const Regresion = (() => {
  const E = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const f = (x, d = 4, cero = 1e-12) => {
    if (!isFinite(x)) return '—';
    if (x === 0 || Math.abs(x) < cero) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const d4 = (x) => (Math.abs(x) >= 1 - 5e-13 ? f(x) : x.toFixed(4).replace('.', ',').replace('-', '−'));
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const mas = (x, d) => `${x < 0 ? '−' : '+'} ${f(Math.abs(x), d)}`;
  const ic = (a, b) => `(${f(a, 5)}; ${f(b, 5)})`;
  const conError = (v, e) => {
    if (!(e > 0) || !isFinite(e)) return f(v);
    const ex = Math.floor(Math.log10(e)), dec = (e / 10 ** ex < 2 ? 2 : 1) - 1 - ex;
    const r = (x) => (dec >= 0 ? (Math.round(x * 10 ** dec) / 10 ** dec).toFixed(dec) : String(Math.round(x / 10 ** -dec) * 10 ** -dec));
    return `${r(v)} ± ${r(e)}`.replace(/\./g, ',').replace(/-/g, '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  function leeDatos(texto) {
    const pts = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const tk = (/[;\t]/.test(l) ? l.split(/\s*[;\t]\s*/) : l.split(/\s+/)).filter((t) => t !== '');
      const v = tk.map(leeNum);
      if (!pts.length && v.some((x) => !isFinite(x)) && tk.some((t) => /^[^\d]*[a-zñáéíóú]/i.test(t))) return; // cabecera
      if (tk.length < 2 || tk.length > 3) throw new Error(`Ligne ${i + 1} : écrivez x et y (et si vous voulez l’effectif) séparés par des espaces, des tabulations ou « ; »`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Ligne ${i + 1} : « ${l} » ne sont pas des nombres`);
      const n = tk.length === 3 ? v[2] : 1;
      if (!(n > 0)) throw new Error(`Ligne ${i + 1} : l’effectif doit être supérieur à 0`);
      pts.push({ x: v[0], y: v[1], n });
    });
    return pts;
  }

  function leeSigma(texto) {
    const pts = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim().replace(/±|\+\/-|\+-/g, ' ');
      if (!l || l.startsWith('#')) return;
      const tk = (/[;\t]/.test(l) ? l.split(/\s*[;\t]\s*/) : l.split(/\s+/)).filter((t) => t !== ''), v = tk.map(leeNum);
      if (!pts.length && v.some((x) => !isFinite(x)) && tk.some((t) => /^[^\d]*[a-zñáéíóúσ]/i.test(t))) return; // cabecera
      if (tk.length !== 3) throw new Error(`Ligne ${i + 1} : écrivez x, y et l’incertitude de y (« 2 4,1 0,2 »)`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Ligne ${i + 1} : « ${l} » ne sont pas des nombres`);
      if (!(v[2] > 0)) throw new Error(`Ligne ${i + 1} : l’incertitude de y doit être supérieure à 0 (le poids est 1/σ²)`);
      pts.push({ x: v[0], y: v[1], n: 1, s: v[2] });
    });
    return pts;
  }
  function ponderado(pts) {
    let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
    for (const q of pts) { const w = 1 / (q.s * q.s); S += w; Sx += w * q.x; Sy += w * q.y; Sxx += w * q.x * q.x; Sxy += w * q.x * q.y; }
    const D = S * Sxx - Sx * Sx;
    if (!(D > 0)) throw new Error('Tous les points ont le même x : on ne peut pas ajuster une droite');
    const a = (Sxx * Sy - Sx * Sxy) / D, b = (S * Sxy - Sx * Sy) / D, sa = Math.sqrt(Sxx / D), sb = Math.sqrt(S / D);
    const chi2 = pts.reduce((t, q) => t + ((q.y - a - b * q.x) / q.s) ** 2, 0), gl = pts.length - 2, red = gl > 0 ? chi2 / gl : null;
    return { a, b, sa, sb, S, Sx, Sy, Sxx, Sxy, D, chi2, gl, red, p: gl > 0 ? E.gammaQ(gl / 2, chi2 / 2) : null, cov: -Sx / D };
  }

  function leeDoble(texto) {
    const filas = String(texto ?? '').split(/\r?\n/).map((l, i) => [l.trim(), i]).filter(([l]) => l && !l.startsWith('#'));
    if (!filas.length) return [];
    const parte = (l) => (/[;\t]/.test(l) ? l.split(/\s*[;\t]\s*/) : l.split(/\s+/)).filter((t) => t !== '');
    let cab = parte(filas[0][0]);
    if (!isFinite(leeNum(cab[0]))) cab = cab.slice(1);
    const ys = cab.map(leeNum);
    if (!ys.length || ys.some((y) => !isFinite(y))) throw new Error('La première ligne du tableau doit contenir les valeurs de y (elle peut commencer par un coin comme « x\\y »)');
    const pts = [];
    for (const [l, i] of filas.slice(1)) {
      const v = parte(l).map(leeNum);
      if (v.length !== ys.length + 1) throw new Error(`Ligne ${i + 1} : il faut la valeur de x et ${ys.length} effectifs, un par y`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Ligne ${i + 1} : « ${l} » ne sont pas des nombres`);
      if (v.slice(1).some((n) => n < 0)) throw new Error(`Ligne ${i + 1} : les effectifs ne peuvent pas être négatifs`);
      v.slice(1).forEach((n, j) => { if (n > 0) pts.push({ x: v[0], y: ys[j], n }); });
    }
    return pts;
  }

  const MODELOS = {
    lineal: { nombre: 'Linéaire', adj: 'lineal', forma: 'y = a + bx' },
    origen: { nombre: 'Droite passant par l’origine', adj: 'por el origen', forma: 'y = bx' },
    exponencial: { nombre: 'Exponentielle', adj: 'exponencial', forma: 'y = a·e^{bx}', u: 'x', w: 'ln y' },
    potencial: { nombre: 'Puissance', adj: 'potencial', forma: 'y = a·x^b', u: 'ln x', w: 'ln y' },
    logaritmica: { nombre: 'Logarithmique', adj: 'logarithmique', forma: 'y = a + b ln x', u: 'ln x', w: 'y' },
    hiperbolica: { nombre: 'Hyperbolique', adj: 'hyperbolique', forma: 'y = a + b/x', u: '1/x', w: 'y' },
    parabolica: { nombre: 'Parabolique', adj: 'parabolique', forma: 'y = a + bx + cx^2' },
  };

  function momentos(pts, gx = (x) => x, gy = (y) => y) {
    let N = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    for (const q of pts) {
      const u = gx(q.x), w = gy(q.y);
      N += q.n; sx += q.n * u; sy += q.n * w; sxx += q.n * u * u; syy += q.n * w * w; sxy += q.n * u * w;
    }
    const mx = sx / N, my = sy / N;
    const vx = Math.max(0, sxx / N - mx * mx), vy = Math.max(0, syy / N - my * my), cxy = sxy / N - mx * my;
    return { N, sx, sy, sxx, syy, sxy, mx, my, vx, vy, sdx: Math.sqrt(vx), sdy: Math.sqrt(vy), cxy };
  }

  function fuerza(r) {
    const a = Math.abs(r);
    const q = a >= 0.9 ? 'très forte' : a >= 0.7 ? 'forte' : a >= 0.5 ? 'modérée' : a >= 0.3 ? 'faible' : 'très faible ou nulle';
    if (a < 0.3) return 'La corrélation est très faible ou il n’y a pas de relation linéaire : la droite ne sert presque pas à estimer.';
    return `La corrélation est ${q} et ${r > 0 ? 'positive (directe) : quand x croît, y a tendance à croître' : 'négative (inverse) : quand x croît, y a tendance à diminuer'}.`;
  }

  function cramer3(A, b) {
    const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const D = det(A);
    if (!(Math.abs(D) > 1e-12 * Math.abs(A[0][0] * A[1][1] * A[2][2]))) return null;
    return [0, 1, 2].map((j) => det(A.map((fila, i) => fila.map((v, k) => (k === j ? b[i] : v)))) / D);
  }

  function resolver(sc) {
    const doble = sc.formato === 'doble', sig = sc.formato === 'sigma', pts = doble ? leeDoble(sc.doble) : sig ? leeSigma(sc.datosS) : leeDatos(sc.datos), modelo = MODELOS[sc.modelo] ? sc.modelo : 'lineal', M = MODELOS[modelo];
    if (pts.length < 2) throw new Error('Il faut au moins deux points');
    const x0 = vacio(sc.x0) ? null : leeNum(sc.x0), y0 = vacio(sc.y0) ? null : leeNum(sc.y0);
    if (x0 !== null && !isFinite(x0)) throw new Error('La valeur de x à estimer doit être un nombre');
    if (y0 !== null && !isFinite(y0)) throw new Error('La valeur de y à estimer doit être un nombre');
    const m = momentos(pts);
    if (m.vx === 0) throw new Error('Tous les points ont le même x : on ne peut pas ajuster y en fonction de x');
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y), xmin = Math.min(...xs), xmax = Math.max(...xs);
    const pasos = [], tabla = pts.length <= 20;
    const S = (t) => (pts.some((q) => q.n !== 1) ? `∑ n_i ${t}` : `∑ ${t}`);
    const cu = sc.div === 'n1' && m.N > 1, k1 = cu ? m.N / (m.N - 1) : 1, Vx = m.vx * k1, Vy = m.vy * k1, Cxy = m.cxy * k1, Sx = Math.sqrt(Vx), Sy = Math.sqrt(Vy);
    const L = cu ? 's' : 'σ', VX = `${L}_x^2`, VY = `${L}_y^2`, CXY = `${L}_{xy}`;
    if (doble) pasos.push({ t: 'Tableau à double entrée', html: `Chaque case d’effectif non nul est un point (x, y) avec cet effectif : cela donne ${pts.length} points distincts et N = ${f(m.N, 6)} observations.` });

    pasos.push({ t: 'Tableau de calculs', tabla: tabla ? tablaSumas(pts, m) : null, html: `$N = ${f(m.N, 6)}$, &ensp; $${S('x_i')} = ${f(m.sx, 6)}$, &ensp; $${S('y_i')} = ${f(m.sy, 6)}$, &ensp; $${S('x_i^2')} = ${f(m.sxx, 6)}$, &ensp; $${S('y_i^2')} = ${f(m.syy, 6)}$, &ensp; $${S('x_i y_i')} = ${f(m.sxy, 6)}$` });
    pasos.push({ t: 'Moyennes', html: `$x̄ = {${S('x_i')}}/N = {${f(m.sx, 6)}}/${f(m.N, 6)}$ = <b>${f(m.mx)}</b>, &ensp; $ȳ = {${S('y_i')}}/N = {${f(m.sy, 6)}}/${f(m.N, 6)}$ = <b>${f(m.my)}</b>` });
    if (cu) {
      pasos.push({ t: 'Variances corrigées et écarts types corrigés (avec N − 1)', html: `$s_x^2 = {${S('x_i^2')} − N x̄^2}/{N − 1} = {${f(m.sxx, 6)} − ${f(m.N, 6)} · ${p(m.mx)}^2}/${f(m.N - 1, 6)} = ${f(Vx)}$ &ensp;⇒&ensp; $s_x = ${f(Sx)}$<br>$s_y^2 = {${S('y_i^2')} − N ȳ^2}/{N − 1} = {${f(m.syy, 6)} − ${f(m.N, 6)} · ${p(m.my)}^2}/${f(m.N - 1, 6)} = ${f(Vy)}$ &ensp;⇒&ensp; $s_y = ${f(Sy)}$<br>Avec N au lieu de N − 1, on obtiendrait $σ_x = ${f(m.sdx)}$ et $σ_y = ${f(m.sdy)}$. Le coefficient de corrélation et les droites sont identiques avec l’une ou l’autre.` });
      pasos.push({ t: 'Covariance corrigée', html: `$s_{xy} = {${S('x_i y_i')} − N x̄ ȳ}/{N − 1} = {${f(m.sxy, 6)} − ${f(m.N, 6)} · ${p(m.mx)} · ${p(m.my)}}/${f(m.N - 1, 6)}$ = <b>${f(Cxy)}</b><br>${m.cxy > 0 ? 'Elle est positive : la relation est directe.' : m.cxy < 0 ? 'Elle est négative : la relation est inverse.' : 'Elle est nulle : il n’y a pas de relation linéaire.'}` });
    } else {
      pasos.push({ t: 'Variances et écarts types', html: `$σ_x^2 = {${S('x_i^2')}}/N − x̄^2 = {${f(m.sxx, 6)}}/${f(m.N, 6)} − ${p(m.mx)}^2 = ${f(m.vx)}$ &ensp;⇒&ensp; $σ_x = ${f(m.sdx)}$<br>$σ_y^2 = {${S('y_i^2')}}/N − ȳ^2 = {${f(m.syy, 6)}}/${f(m.N, 6)} − ${p(m.my)}^2 = ${f(m.vy)}$ &ensp;⇒&ensp; $σ_y = ${f(m.sdy)}$${m.N > 1 ? `<br>Les écarts types corrigés (de l’échantillon, en divisant par N − 1) sont $s_x = ${f(m.sdx * Math.sqrt(m.N / (m.N - 1)))}$ et $s_y = ${f(m.sdy * Math.sqrt(m.N / (m.N - 1)))}$. Le coefficient de corrélation et les droites sont identiques avec l’une ou l’autre.` : ''}` });
      pasos.push({ t: 'Covariance', html: `$σ_{xy} = {${S('x_i y_i')}}/N − x̄ ȳ = {${f(m.sxy, 6)}}/${f(m.N, 6)} − ${p(m.mx)} · ${p(m.my)}$ = <b>${f(m.cxy)}</b><br>${m.cxy > 0 ? 'Elle est positive : la relation est directe.' : m.cxy < 0 ? 'Elle est négative : la relation est inverse.' : 'Elle est nulle : il n’y a pas de relation linéaire.'}` });
    }

    const r = m.vy === 0 ? 0 : m.cxy / (m.sdx * m.sdy);
    pasos.push({ t: 'Coefficient de corrélation de Pearson', html: m.vy === 0 ? 'Tous les points ont le même y : σ<sub>y</sub> = 0, la droite est horizontale et r n’est pas défini (on prend 0).' : `$r = ${CXY}/{${L}_x ${L}_y} = {${f(Cxy)}}/{${f(Sx)} · ${f(Sy)}}$ = <b>${d4(r)}</b><br>${fuerza(r)} Le coefficient de détermination est $r^2 = ${d4(r * r)}$ : la droite explique ${f(100 * r * r, 3)} % de la variation de y.` });

    const nivel = (() => { let c = vacio(sc.nivel) ? 95 : leeNum(sc.nivel); if (c >= 1) c /= 100; if (!(c > 0 && c < 1)) throw new Error('Le niveau de confiance doit être compris entre 0 et 100 %'); return c; })();
    let t = null, pval = null;
    const nu = m.N - 2;
    if (nu >= 1 && m.vy > 0) {
      if (Math.abs(r) >= 1 - 1e-12) { t = Infinity; pval = 0; }
      else { t = (r * Math.sqrt(nu)) / Math.sqrt(1 - r * r); pval = E.betaI(nu / (nu + t * t), nu / 2, 0.5); }
      pasos.push({ t: 'La corrélation est-elle significative ?', html: `Test de $H_0: ρ = 0$ avec $t = r √(N − 2)/√(1 − r^2)$, qui suit une loi de Student à ${f(nu, 6)} degrés de liberté : ${isFinite(t) ? `$t = ${d4(r)} · √${f(nu, 6)}/√(1 − ${p(r)}^2) = ${f(t)}$, p-valeur bilatérale = <b>${E.prob(pval)}</b>` : 'les points sont parfaitement alignés, t → ∞ et p-valeur = 0'}<br>${pval < 0.05 ? 'Comme p &lt; 0,05, on rejette H₀ : il y a une corrélation significative au seuil de 5 %.' : 'Comme p ≥ 0,05, on ne peut pas rejeter H₀ : avec ces données, la corrélation n’est pas significative au seuil de 5 %.'}${m.N !== pts.length ? ' (N compte les effectifs.)' : ''}` });
    }

    let fisher = null, comp = null;
    const zq = (c) => E.cuantil(E.DIST.normal, { mu: 0, sigma: 1 }, 1 - (1 - c) / 2);
    if (m.N >= 4 && m.vy > 0 && Math.abs(r) < 1 - 1e-12) {
      const z = Math.atanh(r), se = 1 / Math.sqrt(m.N - 3), k = zq(nivel), za = z - k * se, zb = z + k * se;
      fisher = { z, se, k, a: Math.tanh(za), b: Math.tanh(zb), nivel };
      pasos.push({ t: `Intervalle de confiance de ρ à ${f(100 * nivel)} % (z de Fisher)`, html: `r ne se répartit pas comme une loi normale (il est enfermé entre −1 et 1), mais $z = "artanh"(r) = 1/2 ln({1 + r}/{1 − r})$ oui, avec un écart type $1/√(N − 3)$ :<br>$z = "artanh"(${d4(r)}) = ${f(z)}$, &ensp; $σ_z = 1/√{${f(m.N - 3, 6)}} = ${f(se)}$, &ensp; $z ± ${f(k)} · σ_z = (${f(za)}; ${f(zb)})$<br>On revient en arrière avec $ρ = "tanh"(z)$ : $ρ$ est compris entre <b>${d4(fisher.a)}</b> et <b>${d4(fisher.b)}</b>.${fisher.a * fisher.b > 0 ? '' : ' L’intervalle contient 0 : la corrélation n’est pas significative à ce niveau.'}${m.N < 10 ? ' Avec si peu de points, l’intervalle est très large.' : ''}` });
    }
    if (!vacio(sc.r2c) || !vacio(sc.n2c)) {
      const r2 = leeNum(sc.r2c), n2 = leeNum(sc.n2c);
      if (!isFinite(r2) || !(Math.abs(r2) < 1)) throw new Error('L’autre coefficient de corrélation r₂ doit être compris entre −1 et 1 (exclus)');
      if (!Number.isInteger(n2) || n2 < 4) throw new Error('La taille n₂ de l’autre échantillon doit être un entier supérieur ou égal à 4');
      if (!fisher) throw new Error('Pour comparer deux corrélations, il faut au moins 4 points qui ne soient pas tous alignés');
      const z2 = Math.atanh(r2), sed = Math.sqrt(1 / (m.N - 3) + 1 / (n2 - 3)), zd = (fisher.z - z2) / sed, pd = 2 * (1 - E.Phi(Math.abs(zd)));
      comp = { r2, n2, z2, se: sed, z: zd, p: pd };
      pasos.push({ t: 'Comparaison de deux corrélations', html: `Cette corrélation est-elle différente de celle d’un autre échantillon indépendant avec $r_2 = ${d4(r2)}$ et $n_2 = ${n2}$ ? On les compare sur l’échelle de Fisher : $z_1 = ${f(fisher.z)}$, $z_2 = "artanh"(${d4(r2)}) = ${f(z2)}$<br>$Z = {z_1 − z_2}/{√(1/(N_1 − 3) + 1/(n_2 − 3))} = {${f(fisher.z - z2)}}/{${f(sed)}} = ${f(zd)}$, p-valeur bilatérale = <b>${E.prob(pd)}</b><br>${pd < 0.05 ? 'Comme p &lt; 0,05, les deux corrélations sont différentes au seuil de 5 %.' : 'Comme p ≥ 0,05, la différence entre les deux corrélations peut être due au hasard.'}` });
    }

    let rs = null;
    if (m.vy > 0 && pts.length > 2) {
      const rango = (v) => { const val = [...new Set(v)].sort((a, b) => a - b), ac = new Map(); let c = 0; for (const u of val) { const n = pts.reduce((s, q, i) => s + (v[i] === u ? q.n : 0), 0); ac.set(u, c + (n + 1) / 2); c += n; } return v.map((u) => ac.get(u)); };
      const rx = rango(xs), ry = rango(ys), mr = momentos(pts.map((q, i) => ({ x: rx[i], y: ry[i], n: q.n })));
      rs = mr.vy === 0 || mr.vx === 0 ? 0 : mr.cxy / (mr.sdx * mr.sdy);
      const simple = pts.every((q) => q.n === 1) && new Set(xs).size === xs.length && new Set(ys).size === ys.length, n = pts.length;
      const d2 = simple ? rx.reduce((s, v, i) => s + (v - ry[i]) ** 2, 0) : 0;
      pasos.push({ t: 'Corrélation de Spearman (par les rangs)', html: `On remplace chaque x et chaque y par son rang, du plus petit au plus grand${simple ? '' : ', avec le rang moyen en cas d’ex æquo'}, et l’on calcule r avec les rangs. ${simple ? `Sans ex æquo, on obtient la même chose avec $r_s = 1 − {6 ∑ d_i^2}/{n (n^2 − 1)} = 1 − {6 · ${f(d2, 6)}}/{${n} · (${n}^2 − 1)}$, où d<sub>i</sub> est la différence de rangs : ` : ''}$r_s$ = <b>${d4(rs)}</b><br>Elle mesure si y croît (ou décroît) chaque fois que x croît, même sans que ce soit en ligne droite, et les points aberrants l’affectent moins.` });
    }

    const b = m.cxy / m.vx, a = m.my - b * m.mx;
    const res = { modelo, pts, m, r, r2: r * r, t, pval, nu, xmin, xmax, lineal: { a, b }, div: cu ? 'n1' : 'n', cov: Cxy, rs, fisher, comp };
    pasos.push({ t: 'Droite de régression de Y en X', html: `$y − ȳ = ${CXY}/{${VX}} (x − x̄)$, de pente $b = ${CXY}/{${VX}} = {${f(Cxy)}}/{${f(Vx)}} = ${f(b)}$ et d’ordonnée à l’origine $a = ȳ − b x̄ = ${f(m.my)} − ${p(b)} · ${p(m.mx)} = ${f(a)}$<br>$y = ${f(a)} ${mas(b)} x$${modelo === 'lineal' ? '' : ' (la droite, à comparer avec l’ajustement choisi)'}` });
    if (m.vy > 0) {
      const b2 = m.cxy / m.vy, a2 = m.mx - b2 * m.my;
      const ang = (Math.acos(Math.min(1, Math.abs(b2 + b) / Math.hypot(1, b) / Math.hypot(b2, 1))) * 180) / Math.PI;
      res.xSobreY = { a: a2, b: b2 }; res.angulo = ang;
      pasos.push({ t: 'Droite de régression de X en Y', html: `Elle sert à estimer x à partir de y : $x − x̄ = ${CXY}/{${VY}} (y − ȳ)$ ⇒ $x = ${f(a2)} ${mas(b2)} y$<br>Les deux droites se coupent au centre de gravité $(x̄, ȳ) = (${f(m.mx)}, ${f(m.my)})$ ; plus r est proche de ±1, plus elles sont proches l’une de l’autre.<br>Le produit des deux pentes est $r^2$ : $b · b′ = ${p(b)} · ${p(b2)} = ${d4(b * b2)}$. L’angle entre les deux droites est <b>${f(ang, 3)}°</b> (0° si |r| = 1 et 90° si r = 0).` });
    }

    if (nu >= 1 && modelo === 'lineal') {
      const SSl = pts.reduce((s, q) => s + q.n * (q.y - a - b * q.x) ** 2, 0), Sxx = m.N * m.vx, se = Math.sqrt(SSl / nu);
      const sb = se / Math.sqrt(Sxx), sa = se * Math.sqrt(1 / m.N + (m.mx * m.mx) / Sxx), tk = E.cuantil(E.DIST.t, { nu }, 1 - (1 - nivel) / 2), pc = `${f(100 * nivel)} %`;
      res.inc = { se, sb, sa, tk, nivel, Sxx, banda: (x) => tk * se * Math.sqrt(1 / m.N + (x - m.mx) ** 2 / Sxx) };
      pasos.push({ t: 'Incertitude de la pente et de l’ordonnée à l’origine', html: `Écart type des résidus de la droite : $s_e = √({∑ (y_i − ŷ_i)^2}/{N − 2}) = √({${f(SSl)}}/${f(nu, 6)}) = ${f(se)}$<br>Avec $S_{xx} = ∑ (x_i − x̄)^2 = ${f(Sxx)}$ :<br>$s_b = s_e/√S_{xx} = ${f(sb)}$, &ensp; $s_a = s_e √(1/N + x̄^2/S_{xx}) = ${f(sa)}$<br>Pour le compte rendu : <b>b = ${conError(b, sb)}</b> et <b>a = ${conError(a, sa)}</b> (erreur à un chiffre significatif, ou deux si elle commence par 1).<br>Intervalles à ${pc} avec $t_{${f(nu, 6)}; α/2} = ${f(tk)}$ : pente ${ic(b - tk * sb, b + tk * sb)}, ordonnée à l’origine ${ic(a - tk * sa, a + tk * sa)}.${a - tk * sa <= 0 && a + tk * sa >= 0 ? ' L’ordonnée à l’origine pourrait être 0 : les données sont compatibles avec une droite passant par l’origine.' : ''}` });
    }

    if (modelo === 'lineal') {
      res.pred = (x) => a + b * x; res.inv = res.xSobreY ? (y) => res.xSobreY.a + res.xSobreY.b * y : null;
      res.ecuacion = `y = ${f(a)} ${mas(b)}x`; res.R2 = r * r;
      if (sig) {
        const W = ponderado(pts); res.pond = W; res.sinPesos = { a, b }; delete res.inc;
        res.pred = (x) => W.a + W.b * x; res.inv = W.b ? (y) => (y - W.a) / W.b : null; res.ecuacion = `y = ${f(W.a)} ${mas(W.b)}x`;
        const g6 = (x) => f(x, 5);
        pasos.push({ t: 'Ajustement pondéré : chaque point pèse $1/σ_i^2$', html: `Les points les plus précis doivent compter davantage. On minimise $χ^2 = ∑ ({y_i − a − b x_i}/{σ_i})^2$ et, avec $w_i = 1/σ_i^2$, on obtient les sommes $S = ∑ w_i = ${g6(W.S)}$, $S_x = ∑ w_i x_i = ${g6(W.Sx)}$, $S_y = ∑ w_i y_i = ${g6(W.Sy)}$, $S_{xx} = ∑ w_i x_i^2 = ${g6(W.Sxx)}$, $S_{xy} = ∑ w_i x_i y_i = ${g6(W.Sxy)}$ et $Δ = S S_{xx} − S_x^2 = ${g6(W.D)}$ :<br>$b = {S S_{xy} − S_x S_y}/Δ = ${f(W.b)}$, &ensp; $a = {S_{xx} S_y − S_x S_{xy}}/Δ = ${f(W.a)}$<br><b>${res.ecuacion}</b> (sans poids, on obtiendrait $y = ${f(a)} ${mas(b)} x$).` });
        pasos.push({ t: 'Erreurs de la pente et de l’ordonnée à l’origine', html: `Elles découlent des incertitudes des données, et non de leur écart à la droite : $σ_b = √{S/Δ} = ${f(W.sb)}$, &ensp; $σ_a = √{S_{xx}/Δ} = ${f(W.sa)}$<br>Pour le compte rendu : <b>b = ${conError(W.b, W.sb)}</b> et <b>a = ${conError(W.a, W.sa)}</b>.` });
        if (W.gl > 0) pasos.push({ t: 'χ² réduit : la droite s’ajuste-t-elle aux données ?', html: `$χ^2 = ${f(W.chi2)}$ avec $N − 2 = ${W.gl}$ degrés de liberté : $χ^2_"red" = ${f(W.red)}$ et la probabilité d’un χ² aussi grand ou plus grand si la droite est correcte est <b>${E.prob(W.p)}</b>.<br>${W.red > 2 && W.p < 0.05 ? `Il est nettement supérieur à 1 : les points s’écartent de la droite plus que ne le permettent leurs incertitudes. Soit le modèle n’est pas une droite, soit les incertitudes sont sous-estimées ; si l’on accepte la droite, les erreurs sont élargies avec $√{χ^2_"red"}$ : $σ_b = ${f(W.sb * Math.sqrt(W.red))}$, $σ_a = ${f(W.sa * Math.sqrt(W.red))}$.` : W.red < 0.3 && W.gl > 2 ? 'Il est très inférieur à 1 : les points sont mieux alignés que ce à quoi l’on pouvait s’attendre ; il est probable que les incertitudes soient surestimées.' : 'Il est proche de 1 : la droite est compatible avec les données et leurs incertitudes.'}` });
        else pasos.push({ t: 'χ² reducido', html: 'Avec deux points, la droite passe par les deux : il ne reste aucun degré de liberté pour juger l’ajustement.' });
      }
    } else if (modelo === 'origen') {
      if (!(m.sxx > 0)) throw new Error('Pour une droite passant par l’origine, il faut au moins un x différent de 0');
      const B = m.sxy / m.sxx;
      res.pred = (x) => B * x; res.inv = B ? (y) => y / B : null; res.coef = { b: B };
      res.ecuacion = `y = ${f(B)}x`;
      const se0 = m.N > 1 ? Math.sqrt(pts.reduce((s, q) => s + q.n * (q.y - B * q.x) ** 2, 0) / (m.N - 1)) : null, sb0 = se0 === null ? null : se0 / Math.sqrt(m.sxx);
      if (sb0 !== null) res.inc0 = { se: se0, sb: sb0 };
      pasos.push({ t: 'Droite passant par l’origine : $y = bx$', html: `Quand la théorie dit que y = 0 si x = 0 (une loi de Hooke, la loi d’Ohm…), on n’ajuste que la pente. En minimisant $∑ (y_i − b x_i)^2$, on obtient $b = {${S('x_i y_i')}}/{${S('x_i^2')}} = {${f(m.sxy, 6)}}/{${f(m.sxx, 6)}}$ = <b>${f(B)}</b><br><b>${res.ecuacion}</b>, contre la pente ${f(b)} de la droite avec ordonnée à l’origine.${sb0 !== null ? `<br>Incertitude : $s_e = √({∑ (y_i − b x_i)^2}/{N − 1}) = ${f(se0)}$ et $s_b = s_e/√{${S('x_i^2')}} = ${f(sb0)}$, donc <b>b = ${conError(B, sb0)}</b>.` : ''}` });
    } else if (modelo === 'parabolica') {
      const sum = (g) => pts.reduce((s, q) => s + q.n * g(q.x, q.y), 0);
      const s1 = m.N, s2 = m.sx, s3 = m.sxx, s4 = sum((x) => x ** 3), s5 = sum((x) => x ** 4), t1 = m.sy, t2 = m.sxy, t3 = sum((x, y) => x * x * y);
      const su = (k) => sum((x) => (x - m.mx) ** k), sol = new Set(xs).size >= 3 ? cramer3([[s1, 0, su(2)], [0, su(2), su(3)], [su(2), su(3), su(4)]], [t1, sum((x, y) => (x - m.mx) * y), sum((x, y) => (x - m.mx) ** 2 * y)]) : null;
      if (!sol) throw new Error('Pour une parabole, il faut au moins trois valeurs de x distinctes');
      const C = sol[2], B = sol[1] - 2 * C * m.mx, A = sol[0] - sol[1] * m.mx + C * m.mx ** 2;
      res.pred = (x) => A + B * x + C * x * x; res.inv = null; res.coef = { a: A, b: B, c: C };
      res.ecuacion = `y = ${f(A)} ${mas(B)}x ${mas(C)}x²`;
      pasos.push({ t: 'Équations normales de la parabole', html: `En minimisant $∑ (y_i − a − b x_i − c x_i^2)^2$, on obtient trois équations :<br>$${f(s1, 6)} a + ${p(s2)} b + ${p(s3)} c = ${f(t1, 6)}$<br>$${f(s2, 6)} a + ${p(s3)} b + ${p(s4)} c = ${f(t2, 6)}$<br>$${f(s3, 6)} a + ${p(s4)} b + ${p(s5)} c = ${f(t3, 6)}$<br>En résolvant : $a = ${f(A)}$, $b = ${f(B)}$, $c = ${f(C)}$ ⇒ <b>${res.ecuacion}</b>` });
    } else {
      const gx = M.u === 'ln x' ? Math.log : M.u === '1/x' ? (x) => 1 / x : (x) => x, gy = M.w === 'ln y' ? Math.log : (y) => y;
      if (M.u === 'ln x' && xmin <= 0) throw new Error(`L’ajustement ${M.adj} utilise ln x : tous les x doivent être positifs`);
      if (M.u === '1/x' && xs.includes(0)) throw new Error(`L’ajustement ${M.adj} utilise 1/x : aucun x ne peut être 0`);
      if (M.w === 'ln y' && Math.min(...ys) <= 0) throw new Error(`L’ajustement ${M.adj} utilise ln y : tous les y doivent être positifs`);
      const mt = momentos(pts, gx, gy);
      if (mt.vx === 0) throw new Error('Tous les points ont le même x');
      const B = mt.cxy / mt.vx, A0 = mt.my - B * mt.mx, rt = mt.vy === 0 ? 0 : mt.cxy / (mt.sdx * mt.sdy);
      const U = M.u, W = M.w, Ut = U.replace('x', 'x_i'), Wt = W.replace('y', 'y_i');
      let html = `On se ramène à une droite par changement de variable : $u = ${U}$, $w = ${W}$${M.w === 'ln y' ? (M.u === 'ln x' ? ', car $ln y = ln a + b ln x$' : ', car $ln y = ln a + b x$') : ', et l’équation est déjà linéaire en u'}. Avec les données transformées :<br>$ū = ${f(mt.mx)}$, $w̄ = ${f(mt.my)}$, $σ_u^2 = ${f(mt.vx)}$, $σ_{uw} = ${f(mt.cxy)}$<br>$b = σ_{uw}/{σ_u^2} = ${f(B)}$, &ensp; $${M.w === 'ln y' ? 'ln a' : 'a'} = w̄ − b ū = ${f(A0)}$`;
      let A = A0;
      if (M.w === 'ln y') { A = Math.exp(A0); html += ` ⇒ $a = e^{${f(A0)}} = ${f(A, 4, 0)}$`; if (A < 1e-6 && xmin > 1000) html += '<br>Avec des x aussi grands, a est très petit. Si les x sont des années, soustrayez la première à toutes pour que a soit la valeur de y au départ.'; }
      res.coef = { a: A, b: B }; res.rt = rt;
      if (modelo === 'exponencial') { res.pred = (x) => A * Math.exp(B * x); res.inv = (y) => (y > 0 && B ? Math.log(y / A) / B : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·e<sup>${f(B)}x</sup>`; }
      if (modelo === 'potencial') { res.pred = (x) => (x > 0 ? A * x ** B : NaN); res.inv = (y) => (y > 0 && B ? (y / A) ** (1 / B) : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·x<sup>${f(B)}</sup>`; }
      if (modelo === 'hiperbolica') { res.pred = (x) => (x ? A + B / x : NaN); res.inv = (y) => (y !== A && B ? B / (y - A) : NaN); res.ecuacion = `y = ${f(A)} ${mas(B)}/x`; }
      if (modelo === 'logaritmica') { res.pred = (x) => (x > 0 ? A + B * Math.log(x) : NaN); res.inv = (y) => (B ? Math.exp((y - A) / B) : NaN); res.ecuacion = `y = ${f(A)} ${mas(B)} ln x`; }
      html += `<br><b>${res.ecuacion}</b><br>Le coefficient de corrélation des variables transformées est $r_{uw} = ${d4(rt)}$ (${f(100 * rt * rt, 3)} % de la variation de ${W} expliquée).`;
      const g = (x) => f(x, 6), tr = pts.some((q) => q.n !== 1);
      const tabT = tabla ? { cab: ['x<sub>i</sub>', 'y<sub>i</sub>', ...(tr ? ['n<sub>i</sub>'] : []), `u<sub>i</sub> = ${Ut}`, `w<sub>i</sub> = ${Wt}`, ...(tr ? ['n<sub>i</sub>u<sub>i</sub>', 'n<sub>i</sub>w<sub>i</sub>', 'n<sub>i</sub>u<sub>i</sub><sup>2</sup>', 'n<sub>i</sub>u<sub>i</sub>w<sub>i</sub>'] : ['u<sub>i</sub><sup>2</sup>', 'u<sub>i</sub>w<sub>i</sub>'])].map((c) => c.replace(/_i/g, '<sub>i</sub>')),
        filas: pts.map((q) => [q.x, q.y, ...(tr ? [q.n] : []), gx(q.x), gy(q.y), ...(tr ? [q.n * gx(q.x), q.n * gy(q.y)] : []), q.n * gx(q.x) ** 2, q.n * gx(q.x) * gy(q.y)].map(g)),
        tot: ['', '', ...(tr ? [g(mt.N), '', '', g(mt.sx), g(mt.sy)] : [g(mt.sx), g(mt.sy)]), g(mt.sxx), g(mt.sxy)] } : null;
      pasos.push({ t: `Ajustement ${M.adj} : $${M.forma}$`, tabla: tabT, html });
    }

    const SSt = pts.reduce((s, q) => s + q.n * (q.y - m.my) ** 2, 0);
    const SSr = pts.reduce((s, q) => s + q.n * (q.y - res.pred(q.x)) ** 2, 0);
    res.R2 = SSt > 0 ? 1 - SSr / SSt : 1;
    res.residuos = pts.map((q) => ({ ...q, yp: res.pred(q.x), e: q.y - res.pred(q.x) }));
    const npar = { origen: 1, parabolica: 3 }[modelo] ?? 2;
    res.se = m.N > npar ? Math.sqrt(SSr / (m.N - npar)) : null;
    res.atipicos = res.se ? res.residuos.filter((q) => Math.abs(q.e) > 2 * res.se) : [];
    if (modelo !== 'lineal') {
      const rl = 1 - pts.reduce((s, q) => s + q.n * (q.y - a - b * q.x) ** 2, 0) / (SSt || 1);
      pasos.push({ t: 'Qualité de l’ajustement', html: `Sur les y d’origine, $R^2 = 1 − {∑ (y_i − ŷ_i)^2}/{∑ (y_i − ȳ)^2} = 1 − {${f(SSr)}}/{${f(SSt)}}$ = <b>${d4(res.R2)}</b>, contre $R^2 = ${d4(rl)}$ pour la droite. ${res.R2 > rl + 1e-9 ? `L’ajustement ${M.adj} s’adapte mieux aux données que la droite.` : res.R2 < rl - 1e-9 ? 'La droite s’adapte mieux que cet ajustement : le modèle n’est peut-être pas le bon.' : 'Les deux s’adaptent aussi bien.'}` });
    }
    if (tabla) pasos.push({ t: 'Résidus', residuos: true, html: `Résidu $e_i = y_i − ŷ_i$, la distance verticale de chaque point à la ${modelo === 'lineal' ? 'droite' : 'courbe'}. ${modelo === 'lineal' || modelo === 'parabolica' ? 'Leur somme est 0 (avec leurs effectifs).' : ''} Le plus grand, en valeur absolue, est ${f(Math.max(...res.residuos.map((q) => Math.abs(q.e))))}.${res.se ? ` L’écart type des résidus est ${f(res.se)}. ${res.atipicos.length ? `Ils s’écartent de plus de 2 fois cette valeur et peuvent être aberrants (erreur de mesure ou de recopie) : ${res.atipicos.map((q) => `(${f(q.x)}, ${f(q.y)})`).join(', ')}.` : 'Aucun point ne s’écarte de plus de 2 fois cette valeur : il n’y a pas de points aberrants évidents.'}` : ''}` });

    if (!sc.sinComparar) {
      const filas = Object.entries(MODELOS).map(([k, Mo]) => { try { const o = resolver({ ...sc, modelo: k, x0: '', y0: '', sinComparar: true }); return [k, Mo.nombre, o.ecuacion, o.R2]; } catch (e) { return [k, Mo.nombre, e.message, null]; } });
      const mejor = filas.filter((q) => q[3] !== null && q[0] !== 'parabolica').sort((u, v) => v[3] - u[3])[0];
      res.comparacion = filas.map(([k, n, e, R2]) => ({ modelo: k, nombre: n, ecuacion: e, R2, mejor: mejor && k === mejor[0] }));
      pasos.push({ t: 'Comparaison des ajustements', tabla: { cab: ['Ajustement', 'Équation', 'R²'], filas: res.comparacion.map((q) => [`${q.mejor ? '★ ' : ''}${q.nombre}`, q.R2 === null ? `<small>${q.ecuacion}</small>` : q.ecuacion, q.R2 === null ? '—' : d4(q.R2)]) }, html: `${mejor ? `Parmi les ajustements à deux paramètres, celui qui s’adapte le mieux est le <b>${mejor[1].toLowerCase()}</b> (★). ` : ''}La parabole a un paramètre de plus, donc son R² n’est jamais inférieur à celui de la droite : ne la choisissez que si elle l’améliore nettement ou si la théorie l’exige.` });
    }

    const fiable = () => (res.R2 >= 0.81 ? 'l’ajustement est bon' : res.R2 >= 0.5 ? 'l’ajustement est seulement moyen' : 'l’ajustement est mauvais');
    if (x0 !== null) {
      const yp = res.pred(x0);
      if (!isFinite(yp)) throw new Error('L’ajustement n’est pas défini pour cette valeur de x');
      res.x0 = x0; res.yx0 = yp;
      const fuera = x0 < xmin || x0 > xmax;
      let pasoIC = null;
      if (modelo === 'lineal' && res.inc) {
        const { se, tk, Sxx, nivel: c } = res.inc, h1 = tk * se * Math.sqrt(1 / m.N + (x0 - m.mx) ** 2 / Sxx), h2 = tk * se * Math.sqrt(1 + 1 / m.N + (x0 - m.mx) ** 2 / Sxx);
        res.icMedia = [yp - h1, yp + h1]; res.icPred = [yp - h2, yp + h2];
        pasoIC = { t: `Intervalles de l’estimation à ${f(100 * c)} %`, html: `Pour la moyenne de y quand x = ${f(x0)} : $ŷ ± t s_e √(1/N + (x_0 − x̄)^2/S_{xx})$ = <b>${ic(...res.icMedia)}</b><br>Pour une valeur précise de y (intervalle de prédiction, plus large) : $ŷ ± t s_e √(1 + 1/N + (x_0 − x̄)^2/S_{xx})$ = <b>${ic(...res.icPred)}</b><br>Les deux s’élargissent quand on s’éloigne de x̄.` };
      }
      pasos.push({ t: `Estimation de y pour x = ${f(x0)}`, html: `${res.pond ? `Avec la droite pondérée : $ŷ = ${f(res.pond.a)} ${mas(res.pond.b)} · ${p(x0)}$` : modelo === 'lineal' ? `Avec la droite de Y en X : $ŷ = ${f(a)} ${mas(b)} · ${p(x0)}$` : `$ŷ(${f(x0)})$ avec ${res.ecuacion}`} = <b>${f(yp)}</b><br>${fuera ? `Attention : x = ${f(x0)} est en dehors de l’intervalle des données [${f(xmin)}, ${f(xmax)}]. C’est une extrapolation et elle peut ne pas être fiable même si ${fiable()}.` : `Elle est dans l’intervalle des données et ${fiable()} ($R^2 = ${d4(res.R2)}$), donc l’estimation ${res.R2 >= 0.81 ? 'est fiable' : 'doit être prise avec prudence'}.`}` });
      if (pasoIC) pasos.push(pasoIC);
      if (res.pond) { const W = res.pond, sy = Math.sqrt(Math.max(0, W.sa ** 2 + x0 * x0 * W.sb ** 2 + 2 * x0 * W.cov)); res.syx0 = sy; pasos.push({ t: 'Incertitude de l’estimation', html: `a et b proviennent du même ajustement et sont corrélés ; il faut donc leur covariance $"cov"(a, b) = −S_x/Δ = ${f(W.cov)}$ :<br>$σ_ŷ = √(σ_a^2 + x_0^2 σ_b^2 + 2 x_0 "cov"(a, b)) = ${f(sy)}$ ⇒ <b>ŷ = ${conError(yp, sy)}</b>` }); }
    }
    if (y0 !== null) {
      const xp = res.inv ? res.inv(y0) : NaN;
      if (modelo === 'parabolica') pasos.push({ t: `Estimation de x pour y = ${f(y0)}`, html: 'Avec une parabole, isoler x peut donner deux valeurs ou aucune. Pour estimer x à partir de y, utilisez l’ajustement linéaire (droite de X en Y).' });
      else if (!isFinite(xp)) throw new Error('On ne peut pas isoler x pour cette valeur de y');
      else {
        res.y0 = y0; res.xy0 = xp;
        pasos.push({ t: `Estimation de x pour y = ${f(y0)}`, html: `${res.pond ? 'En isolant x dans la droite pondérée' : modelo === 'lineal' ? `Pour estimer x, on utilise la droite de X en Y, on n’isole pas celle de Y en X : $x̂ = ${f(res.xSobreY.a)} ${mas(res.xSobreY.b)} · ${p(y0)}$` : `En isolant x dans ${res.ecuacion}`} = <b>${f(xp)}</b>${modelo === 'lineal' && !res.pond && Math.abs(r) < 0.999 ? ` (en isolant dans l’autre droite, on obtiendrait ${f((y0 - a) / b)} ; elles ne coïncident que si |r| = 1).` : '.'}` });
      }
    }
    return Object.assign(res, { pasos });
  }

  function tablaSumas(pts, m) {
    const fr = pts.some((q) => q.n !== 1), g = (x) => f(x, 6);
    const cab = fr ? ['x<sub>i</sub>', 'y<sub>i</sub>', 'n<sub>i</sub>', 'n<sub>i</sub>x<sub>i</sub>', 'n<sub>i</sub>y<sub>i</sub>', 'n<sub>i</sub>x<sub>i</sub><sup>2</sup>', 'n<sub>i</sub>y<sub>i</sub><sup>2</sup>', 'n<sub>i</sub>x<sub>i</sub>y<sub>i</sub>'] : ['x<sub>i</sub>', 'y<sub>i</sub>', 'x<sub>i</sub><sup>2</sup>', 'y<sub>i</sub><sup>2</sup>', 'x<sub>i</sub>y<sub>i</sub>'];
    const filas = pts.map((q) => (fr ? [q.x, q.y, q.n, q.n * q.x, q.n * q.y, q.n * q.x * q.x, q.n * q.y * q.y, q.n * q.x * q.y] : [q.x, q.y, q.x * q.x, q.y * q.y, q.x * q.y]).map(g));
    const tot = fr ? ['', '', g(m.N), g(m.sx), g(m.sy), g(m.sxx), g(m.syy), g(m.sxy)] : [g(m.sx), g(m.sy), g(m.sxx), g(m.syy), g(m.sxy)];
    return { cab, filas, tot };
  }

  const ejemplos = [
    { clave: 'peso-altura', nombre: 'Taille et poids de 8 élèves', sc: { modelo: 'lineal', datos: '160 55\n165 58\n168 64\n170 63\n172 68\n175 70\n180 77\n185 80', x0: '178', y0: '60' } },
    { clave: 'inversa', nombre: 'Prix et unités vendues (corrélation négative)', sc: { modelo: 'lineal', datos: '10 120\n12 110\n14 98\n16 90\n18 85\n20 71', x0: '15', y0: '' } },
    { clave: 'frecuencias', nombre: 'Tableau avec effectifs (nombre d’enfants et de pièces)', sc: { modelo: 'lineal', datos: 'x y n\n1 2 4\n2 2 2\n2 3 6\n3 3 5\n3 4 3\n4 4 4', x0: '', y0: '' } },
    { clave: 'debil', nombre: 'Données presque sans relation', sc: { modelo: 'lineal', datos: '1 5\n2 3\n3 6\n4 2\n5 5\n6 4\n7 3', x0: '', y0: '' } },
    { clave: 'hooke', nombre: 'Loi de Hooke : masse et allongement', sc: { modelo: 'lineal', datos: '# masa (g); alargamiento (cm)\n50; 2,1\n100; 4,0\n150; 6,2\n200; 7,9\n250; 10,1', x0: '120', y0: '5' } },
    { clave: 'hooke-origen', nombre: 'Loi de Hooke avec la droite passant par l’origine', sc: { modelo: 'origen', datos: '# masa (g); alargamiento (cm)\n50; 2,1\n100; 4,0\n150; 6,2\n200; 7,9\n250; 10,1', x0: '120', y0: '' } },
    { clave: 'cuasi', nombre: 'Avec des variances corrigées (en divisant par N − 1)', sc: { modelo: 'lineal', div: 'n1', datos: '2 15\n4 22\n5 24\n7 31\n9 37\n10 38', x0: '6', y0: '', nivel: '95' } },
    { clave: 'doble', nombre: 'Tableau à double entrée (notes de deux matières)', sc: { modelo: 'lineal', formato: 'doble', datos: '', doble: 'x\\y 4 6 8\n3 5 2 0\n5 3 8 2\n7 0 3 6\n9 0 1 4', x0: '', y0: '' } },
    { clave: 'atipico', nombre: 'Une donnée mal recopiée (point aberrant)', sc: { modelo: 'lineal', datos: '1 2,1\n2 3,9\n3 6,2\n4 8,1\n5 19\n6 11,8\n7 14,1\n8 15,9', x0: '', y0: '' } },
    { clave: 'bacterias', nombre: 'Croissance de bactéries (exponentielle)', sc: { modelo: 'exponencial', datos: '0 100\n1 165\n2 270\n3 450\n4 740\n5 1220', x0: '6', y0: '' } },
    { clave: 'kepler', nombre: 'Troisième loi de Kepler (puissance)', sc: { modelo: 'potencial', datos: '# a (UA); T (años)\n0,387 0,241\n0,723 0,615\n1 1\n1,524 1,881\n5,203 11,86\n9,537 29,46', x0: '19.19', y0: '' } },
    { clave: 'sonido', nombre: 'Niveau sonore et distance (logarithmique)', sc: { modelo: 'logaritmica', datos: '1 90\n2 84\n4 78,2\n8 72\n16 66,1', x0: '10', y0: '' } },
    { clave: 'boyle', nombre: 'Loi de Boyle : pression et volume (hyperbolique)', sc: { modelo: 'hiperbolica', datos: '# V (L); P (atm)\n1 24,5\n2 12,3\n3 8,1\n4 6,2\n5 4,9\n6 4,1', x0: '2.5', y0: '' } },
    { clave: 'frenada', nombre: 'Vitesse et distance de freinage (parabolique)', sc: { modelo: 'parabolica', datos: '# km/h; m\n30 9\n50 21\n70 38\n90 58\n110 85\n130 115', x0: '100', y0: '' } },
    { clave: 'ponderado', nombre: 'Ajustement pondéré : chaque y avec son incertitude', sc: { modelo: 'lineal', formato: 'sigma', datosS: '1 2,1 0,2\n2 3,9 0,2\n3 6,2 0,3\n4 7,8 0,3\n5 10,3 0,5\n6 11,7 0,5', x0: '7', y0: '' } },
    { clave: 'dos-correlaciones', nombre: 'Intervalle de ρ et comparaison avec un autre échantillon', sc: { modelo: 'lineal', datos: '160 55\n165 58\n168 64\n170 63\n172 68\n175 70\n180 77\n185 80', x0: '', y0: '', r2c: '0,62', n2c: '40' } },
    { clave: 'notas', nombre: 'Heures d’étude et note à l’examen', sc: { modelo: 'lineal', datos: '1 3\n2 4\n3 5,5\n4 6\n5 7,5\n6 8\n7 9', x0: '4.5', y0: '' } },
  ];

  return { resolver, leeDatos, leeDoble, leeSigma, ponderado, momentos, MODELOS, ejemplos, f, d4, conError };
})();

