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
      if (tk.length < 2 || tk.length > 3) throw new Error(`Zeile ${i + 1}: Schreibe x und y (und bei Bedarf die Häufigkeit), getrennt durch Leerzeichen, Tabulatoren oder „;“`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Zeile ${i + 1}: „${l}“ sind keine Zahlen`);
      const n = tk.length === 3 ? v[2] : 1;
      if (!(n > 0)) throw new Error(`Zeile ${i + 1}: Die Häufigkeit muss größer als 0 sein`);
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
      if (tk.length !== 3) throw new Error(`Zeile ${i + 1}: Schreibe x, y und die Unsicherheit von y („2 4,1 0,2“)`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Zeile ${i + 1}: „${l}“ sind keine Zahlen`);
      if (!(v[2] > 0)) throw new Error(`Zeile ${i + 1}: Die Unsicherheit von y muss größer als 0 sein (das Gewicht ist 1/σ²)`);
      pts.push({ x: v[0], y: v[1], n: 1, s: v[2] });
    });
    return pts;
  }
  function ponderado(pts) {
    let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
    for (const q of pts) { const w = 1 / (q.s * q.s); S += w; Sx += w * q.x; Sy += w * q.y; Sxx += w * q.x * q.x; Sxy += w * q.x * q.y; }
    const D = S * Sxx - Sx * Sx;
    if (!(D > 0)) throw new Error('Alle Punkte haben dasselbe x: Es lässt sich keine Gerade anpassen');
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
    if (!ys.length || ys.some((y) => !isFinite(y))) throw new Error('Die erste Zeile der Tabelle müssen die y-Werte sein (sie kann mit einer Ecke wie „x\\y“ beginnen)');
    const pts = [];
    for (const [l, i] of filas.slice(1)) {
      const v = parte(l).map(leeNum);
      if (v.length !== ys.length + 1) throw new Error(`Zeile ${i + 1}: Es muss der x-Wert und ${ys.length} Häufigkeiten sein, eine für jedes y`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Zeile ${i + 1}: „${l}“ sind keine Zahlen`);
      if (v.slice(1).some((n) => n < 0)) throw new Error(`Zeile ${i + 1}: Die Häufigkeiten dürfen nicht negativ sein`);
      v.slice(1).forEach((n, j) => { if (n > 0) pts.push({ x: v[0], y: ys[j], n }); });
    }
    return pts;
  }

  const MODELOS = {
    lineal: { nombre: 'Linear', adj: 'lineal', forma: 'y = a + bx' },
    origen: { nombre: 'Gerade durch den Ursprung', adj: 'por el origen', forma: 'y = bx' },
    exponencial: { nombre: 'Exponentiell', adj: 'exponencial', forma: 'y = a·e^{bx}', u: 'x', w: 'ln y' },
    potencial: { nombre: 'Potenz', adj: 'potencial', forma: 'y = a·x^b', u: 'ln x', w: 'ln y' },
    logaritmica: { nombre: 'Logarithmisch', adj: 'logarithmisch', forma: 'y = a + b ln x', u: 'ln x', w: 'y' },
    hiperbolica: { nombre: 'Hyperbolisch', adj: 'hyperbolisch', forma: 'y = a + b/x', u: '1/x', w: 'y' },
    parabolica: { nombre: 'Parabolisch', adj: 'parabolisch', forma: 'y = a + bx + cx^2' },
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
    const q = a >= 0.9 ? 'sehr stark' : a >= 0.7 ? 'stark' : a >= 0.5 ? 'mäßig' : a >= 0.3 ? 'schwach' : 'sehr schwach oder keine';
    if (a < 0.3) return 'Die Korrelation ist sehr schwach oder es gibt keinen linearen Zusammenhang: Die Gerade taugt kaum zum Schätzen.';
    return `Die Korrelation ist ${q} und ${r > 0 ? 'positiv (gleichsinnig): Wenn x wächst, wächst y tendenziell' : 'negativ (gegensinnig): Wenn x wächst, sinkt y tendenziell'}.`;
  }

  function cramer3(A, b) {
    const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const D = det(A);
    if (!(Math.abs(D) > 1e-12 * Math.abs(A[0][0] * A[1][1] * A[2][2]))) return null;
    return [0, 1, 2].map((j) => det(A.map((fila, i) => fila.map((v, k) => (k === j ? b[i] : v)))) / D);
  }

  function resolver(sc) {
    const doble = sc.formato === 'doble', sig = sc.formato === 'sigma', pts = doble ? leeDoble(sc.doble) : sig ? leeSigma(sc.datosS) : leeDatos(sc.datos), modelo = MODELOS[sc.modelo] ? sc.modelo : 'lineal', M = MODELOS[modelo];
    if (pts.length < 2) throw new Error('Es braucht mindestens zwei Punkte');
    const x0 = vacio(sc.x0) ? null : leeNum(sc.x0), y0 = vacio(sc.y0) ? null : leeNum(sc.y0);
    if (x0 !== null && !isFinite(x0)) throw new Error('Der x-Wert für die Schätzung muss eine Zahl sein');
    if (y0 !== null && !isFinite(y0)) throw new Error('Der y-Wert für die Schätzung muss eine Zahl sein');
    const m = momentos(pts);
    if (m.vx === 0) throw new Error('Alle Punkte haben dasselbe x: y lässt sich nicht als Funktion von x anpassen');
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y), xmin = Math.min(...xs), xmax = Math.max(...xs);
    const pasos = [], tabla = pts.length <= 20;
    const S = (t) => (pts.some((q) => q.n !== 1) ? `∑ n_i ${t}` : `∑ ${t}`);
    const cu = sc.div === 'n1' && m.N > 1, k1 = cu ? m.N / (m.N - 1) : 1, Vx = m.vx * k1, Vy = m.vy * k1, Cxy = m.cxy * k1, Sx = Math.sqrt(Vx), Sy = Math.sqrt(Vy);
    const L = cu ? 's' : 'σ', VX = `${L}_x^2`, VY = `${L}_y^2`, CXY = `${L}_{xy}`;
    if (doble) pasos.push({ t: 'Kontingenztafel', html: `Jedes Feld mit einer Häufigkeit ungleich 0 ist ein Punkt (x, y) mit dieser Häufigkeit: Es ergeben sich ${pts.length} verschiedene Punkte und N = ${f(m.N, 6)} Beobachtungen.` });

    pasos.push({ t: 'Rechentabelle', tabla: tabla ? tablaSumas(pts, m) : null, html: `$N = ${f(m.N, 6)}$, &ensp; $${S('x_i')} = ${f(m.sx, 6)}$, &ensp; $${S('y_i')} = ${f(m.sy, 6)}$, &ensp; $${S('x_i^2')} = ${f(m.sxx, 6)}$, &ensp; $${S('y_i^2')} = ${f(m.syy, 6)}$, &ensp; $${S('x_i y_i')} = ${f(m.sxy, 6)}$` });
    pasos.push({ t: 'Mittelwerte', html: `$x̄ = {${S('x_i')}}/N = {${f(m.sx, 6)}}/${f(m.N, 6)}$ = <b>${f(m.mx)}</b>, &ensp; $ȳ = {${S('y_i')}}/N = {${f(m.sy, 6)}}/${f(m.N, 6)}$ = <b>${f(m.my)}</b>` });
    if (cu) {
      pasos.push({ t: 'Stichprobenvarianzen und -standardabweichungen (mit N − 1)', html: `$s_x^2 = {${S('x_i^2')} − N x̄^2}/{N − 1} = {${f(m.sxx, 6)} − ${f(m.N, 6)} · ${p(m.mx)}^2}/${f(m.N - 1, 6)} = ${f(Vx)}$ &ensp;⇒&ensp; $s_x = ${f(Sx)}$<br>$s_y^2 = {${S('y_i^2')} − N ȳ^2}/{N − 1} = {${f(m.syy, 6)} − ${f(m.N, 6)} · ${p(m.my)}^2}/${f(m.N - 1, 6)} = ${f(Vy)}$ &ensp;⇒&ensp; $s_y = ${f(Sy)}$<br>Mit N statt N − 1 ergäben sich $σ_x = ${f(m.sdx)}$ und $σ_y = ${f(m.sdy)}$. Der Korrelationskoeffizient und die Geraden sind mit beiden gleich.` });
      pasos.push({ t: 'Stichprobenkovarianz', html: `$s_{xy} = {${S('x_i y_i')} − N x̄ ȳ}/{N − 1} = {${f(m.sxy, 6)} − ${f(m.N, 6)} · ${p(m.mx)} · ${p(m.my)}}/${f(m.N - 1, 6)}$ = <b>${f(Cxy)}</b><br>${m.cxy > 0 ? 'Sie ist positiv: Der Zusammenhang ist gleichsinnig.' : m.cxy < 0 ? 'Sie ist negativ: Der Zusammenhang ist gegensinnig.' : 'Sie ist null: Es gibt keinen linearen Zusammenhang.'}` });
    } else {
      pasos.push({ t: 'Varianzen und Standardabweichungen', html: `$σ_x^2 = {${S('x_i^2')}}/N − x̄^2 = {${f(m.sxx, 6)}}/${f(m.N, 6)} − ${p(m.mx)}^2 = ${f(m.vx)}$ &ensp;⇒&ensp; $σ_x = ${f(m.sdx)}$<br>$σ_y^2 = {${S('y_i^2')}}/N − ȳ^2 = {${f(m.syy, 6)}}/${f(m.N, 6)} − ${p(m.my)}^2 = ${f(m.vy)}$ &ensp;⇒&ensp; $σ_y = ${f(m.sdy)}$${m.N > 1 ? `<br>Die Stichprobenstandardabweichungen (durch N − 1 geteilt) sind $s_x = ${f(m.sdx * Math.sqrt(m.N / (m.N - 1)))}$ und $s_y = ${f(m.sdy * Math.sqrt(m.N / (m.N - 1)))}$. Der Korrelationskoeffizient und die Geraden sind mit beiden gleich.` : ''}` });
      pasos.push({ t: 'Kovarianz', html: `$σ_{xy} = {${S('x_i y_i')}}/N − x̄ ȳ = {${f(m.sxy, 6)}}/${f(m.N, 6)} − ${p(m.mx)} · ${p(m.my)}$ = <b>${f(m.cxy)}</b><br>${m.cxy > 0 ? 'Sie ist positiv: Der Zusammenhang ist gleichsinnig.' : m.cxy < 0 ? 'Sie ist negativ: Der Zusammenhang ist gegensinnig.' : 'Sie ist null: Es gibt keinen linearen Zusammenhang.'}` });
    }

    const r = m.vy === 0 ? 0 : m.cxy / (m.sdx * m.sdy);
    pasos.push({ t: 'Pearson-Korrelationskoeffizient', html: m.vy === 0 ? 'Alle Punkte haben dasselbe y: σ<sub>y</sub> = 0, die Gerade ist waagerecht und r ist nicht definiert (es wird 0 gesetzt).' : `$r = ${CXY}/{${L}_x ${L}_y} = {${f(Cxy)}}/{${f(Sx)} · ${f(Sy)}}$ = <b>${d4(r)}</b><br>${fuerza(r)} Das Bestimmtheitsmaß ist $r^2 = ${d4(r * r)}$: Die Gerade erklärt ${f(100 * r * r, 3)} % der Variation von y.` });

    const nivel = (() => { let c = vacio(sc.nivel) ? 95 : leeNum(sc.nivel); if (c >= 1) c /= 100; if (!(c > 0 && c < 1)) throw new Error('Das Konfidenzniveau muss zwischen 0 und 100 % liegen'); return c; })();
    let t = null, pval = null;
    const nu = m.N - 2;
    if (nu >= 1 && m.vy > 0) {
      if (Math.abs(r) >= 1 - 1e-12) { t = Infinity; pval = 0; }
      else { t = (r * Math.sqrt(nu)) / Math.sqrt(1 - r * r); pval = E.betaI(nu / (nu + t * t), nu / 2, 0.5); }
      pasos.push({ t: 'Ist die Korrelation signifikant?', html: `Test von $H_0: ρ = 0$ mit $t = r √(N − 2)/√(1 − r^2)$, das einer Student-t-Verteilung mit ${f(nu, 6)} Freiheitsgraden folgt: ${isFinite(t) ? `$t = ${d4(r)} · √${f(nu, 6)}/√(1 − ${p(r)}^2) = ${f(t)}$, zweiseitiger p-Wert = <b>${E.prob(pval)}</b>` : 'Die Punkte liegen exakt auf einer Geraden, t → ∞ und p-Wert = 0'}<br>${pval < 0.05 ? 'Da p &lt; 0,05, wird H₀ verworfen: Es gibt eine auf dem 5-%-Niveau signifikante Korrelation.' : 'Da p ≥ 0,05, kann H₀ nicht verworfen werden: Mit diesen Daten ist die Korrelation auf dem 5-%-Niveau nicht signifikant.'}${m.N !== pts.length ? ' (N zählt die Häufigkeiten.)' : ''}` });
    }

    let fisher = null, comp = null;
    const zq = (c) => E.cuantil(E.DIST.normal, { mu: 0, sigma: 1 }, 1 - (1 - c) / 2);
    if (m.N >= 4 && m.vy > 0 && Math.abs(r) < 1 - 1e-12) {
      const z = Math.atanh(r), se = 1 / Math.sqrt(m.N - 3), k = zq(nivel), za = z - k * se, zb = z + k * se;
      fisher = { z, se, k, a: Math.tanh(za), b: Math.tanh(zb), nivel };
      pasos.push({ t: `Konfidenzintervall von ρ zu ${f(100 * nivel)} % (Fisher-z)`, html: `r ist nicht normalverteilt (es ist zwischen −1 und 1 eingeschlossen), aber $z = "artanh"(r) = 1/2 ln({1 + r}/{1 − r})$ schon, mit Standardabweichung $1/√(N − 3)$:<br>$z = "artanh"(${d4(r)}) = ${f(z)}$, &ensp; $σ_z = 1/√{${f(m.N - 3, 6)}} = ${f(se)}$, &ensp; $z ± ${f(k)} · σ_z = (${f(za)}; ${f(zb)})$<br>Die Transformation wird mit $ρ = "tanh"(z)$ rückgängig gemacht: $ρ$ liegt zwischen <b>${d4(fisher.a)}</b> und <b>${d4(fisher.b)}</b>.${fisher.a * fisher.b > 0 ? '' : ' Das Intervall enthält die 0: Die Korrelation ist auf diesem Niveau nicht signifikant.'}${m.N < 10 ? ' Bei so wenigen Punkten ist das Intervall sehr breit.' : ''}` });
    }
    if (!vacio(sc.r2c) || !vacio(sc.n2c)) {
      const r2 = leeNum(sc.r2c), n2 = leeNum(sc.n2c);
      if (!isFinite(r2) || !(Math.abs(r2) < 1)) throw new Error('Der andere Korrelationskoeffizient r₂ muss zwischen −1 und 1 liegen (ohne diese zu erreichen)');
      if (!Number.isInteger(n2) || n2 < 4) throw new Error('Der Umfang n₂ der anderen Stichprobe muss eine ganze Zahl von 4 oder mehr sein');
      if (!fisher) throw new Error('Zum Vergleich zweier Korrelationen braucht man mindestens 4 Punkte, die nicht alle auf einer Geraden liegen');
      const z2 = Math.atanh(r2), sed = Math.sqrt(1 / (m.N - 3) + 1 / (n2 - 3)), zd = (fisher.z - z2) / sed, pd = 2 * (1 - E.Phi(Math.abs(zd)));
      comp = { r2, n2, z2, se: sed, z: zd, p: pd };
      pasos.push({ t: 'Vergleich zweier Korrelationen', html: `Unterscheidet sich diese Korrelation von der einer anderen unabhängigen Stichprobe mit $r_2 = ${d4(r2)}$ und $n_2 = ${n2}$? Verglichen wird auf der Fisher-Skala: $z_1 = ${f(fisher.z)}$, $z_2 = "artanh"(${d4(r2)}) = ${f(z2)}$<br>$Z = {z_1 − z_2}/{√(1/(N_1 − 3) + 1/(n_2 − 3))} = {${f(fisher.z - z2)}}/{${f(sed)}} = ${f(zd)}$, zweiseitiger p-Wert = <b>${E.prob(pd)}</b><br>${pd < 0.05 ? 'Da p &lt; 0,05, sind die beiden Korrelationen auf dem 5-%-Niveau verschieden.' : 'Da p ≥ 0,05, kann der Unterschied zwischen den beiden Korrelationen auf Zufall beruhen.'}` });
    }

    let rs = null;
    if (m.vy > 0 && pts.length > 2) {
      const rango = (v) => { const val = [...new Set(v)].sort((a, b) => a - b), ac = new Map(); let c = 0; for (const u of val) { const n = pts.reduce((s, q, i) => s + (v[i] === u ? q.n : 0), 0); ac.set(u, c + (n + 1) / 2); c += n; } return v.map((u) => ac.get(u)); };
      const rx = rango(xs), ry = rango(ys), mr = momentos(pts.map((q, i) => ({ x: rx[i], y: ry[i], n: q.n })));
      rs = mr.vy === 0 || mr.vx === 0 ? 0 : mr.cxy / (mr.sdx * mr.sdy);
      const simple = pts.every((q) => q.n === 1) && new Set(xs).size === xs.length && new Set(ys).size === ys.length, n = pts.length;
      const d2 = simple ? rx.reduce((s, v, i) => s + (v - ry[i]) ** 2, 0) : 0;
      pasos.push({ t: 'Spearman-Korrelation (nach Rängen)', html: `Jedes x und jedes y wird durch seinen Platz (Rang) von klein nach groß ersetzt${simple ? '' : ', bei Bindungen durch den mittleren Platz'}, und mit den Rängen wird r berechnet. ${simple ? `Ohne Bindungen ergibt sich dasselbe mit $r_s = 1 − {6 ∑ d_i^2}/{n (n^2 − 1)} = 1 − {6 · ${f(d2, 6)}}/{${n} · (${n}^2 − 1)}$, wobei d<sub>i</sub> die Rangdifferenz ist: ` : ''}$r_s$ = <b>${d4(rs)}</b><br>Sie misst, ob y immer wächst (oder sinkt), wenn x wächst, auch ohne Gerade, und Ausreißer wirken sich weniger aus.` });
    }

    const b = m.cxy / m.vx, a = m.my - b * m.mx;
    const res = { modelo, pts, m, r, r2: r * r, t, pval, nu, xmin, xmax, lineal: { a, b }, div: cu ? 'n1' : 'n', cov: Cxy, rs, fisher, comp };
    pasos.push({ t: 'Regressionsgerade von Y auf X', html: `$y − ȳ = ${CXY}/{${VX}} (x − x̄)$, mit Steigung $b = ${CXY}/{${VX}} = {${f(Cxy)}}/{${f(Vx)}} = ${f(b)}$ und Achsenabschnitt $a = ȳ − b x̄ = ${f(m.my)} − ${p(b)} · ${p(m.mx)} = ${f(a)}$<br>$y = ${f(a)} ${mas(b)} x$${modelo === 'lineal' ? '' : ' (die Gerade, zum Vergleich mit der gewählten Anpassung)'}` });
    if (m.vy > 0) {
      const b2 = m.cxy / m.vy, a2 = m.mx - b2 * m.my;
      const ang = (Math.acos(Math.min(1, Math.abs(b2 + b) / Math.hypot(1, b) / Math.hypot(b2, 1))) * 180) / Math.PI;
      res.xSobreY = { a: a2, b: b2 }; res.angulo = ang;
      pasos.push({ t: 'Regressionsgerade von X auf Y', html: `Sie dient dazu, x aus y zu schätzen: $x − x̄ = ${CXY}/{${VY}} (y − ȳ)$ ⇒ $x = ${f(a2)} ${mas(b2)} y$<br>Die beiden Geraden schneiden sich im Schwerpunkt $(x̄, ȳ) = (${f(m.mx)}, ${f(m.my)})$; je näher r an ±1 liegt, desto dichter liegen sie beieinander.<br>Das Produkt der beiden Steigungen ist $r^2$: $b · b′ = ${p(b)} · ${p(b2)} = ${d4(b * b2)}$. Der Winkel zwischen den beiden Geraden beträgt <b>${f(ang, 3)}°</b> (0°, wenn |r| = 1, und 90°, wenn r = 0).` });
    }

    if (nu >= 1 && modelo === 'lineal') {
      const SSl = pts.reduce((s, q) => s + q.n * (q.y - a - b * q.x) ** 2, 0), Sxx = m.N * m.vx, se = Math.sqrt(SSl / nu);
      const sb = se / Math.sqrt(Sxx), sa = se * Math.sqrt(1 / m.N + (m.mx * m.mx) / Sxx), tk = E.cuantil(E.DIST.t, { nu }, 1 - (1 - nivel) / 2), pc = `${f(100 * nivel)} %`;
      res.inc = { se, sb, sa, tk, nivel, Sxx, banda: (x) => tk * se * Math.sqrt(1 / m.N + (x - m.mx) ** 2 / Sxx) };
      pasos.push({ t: 'Unsicherheit von Steigung und Achsenabschnitt', html: `Standardabweichung der Residuen der Geraden: $s_e = √({∑ (y_i − ŷ_i)^2}/{N − 2}) = √({${f(SSl)}}/${f(nu, 6)}) = ${f(se)}$<br>Mit $S_{xx} = ∑ (x_i − x̄)^2 = ${f(Sxx)}$:<br>$s_b = s_e/√S_{xx} = ${f(sb)}$, &ensp; $s_a = s_e √(1/N + x̄^2/S_{xx}) = ${f(sa)}$<br>Für den Bericht: <b>b = ${conError(b, sb)}</b> und <b>a = ${conError(a, sa)}</b> (Fehler mit einer signifikanten Stelle, oder zwei, wenn er mit 1 beginnt).<br>Intervalle zu ${pc} mit $t_{${f(nu, 6)}; α/2} = ${f(tk)}$: Steigung ${ic(b - tk * sb, b + tk * sb)}, Achsenabschnitt ${ic(a - tk * sa, a + tk * sa)}.${a - tk * sa <= 0 && a + tk * sa >= 0 ? ' Der Achsenabschnitt könnte 0 sein: Die Daten sind mit einer Geraden durch den Ursprung vereinbar.' : ''}` });
    }

    if (modelo === 'lineal') {
      res.pred = (x) => a + b * x; res.inv = res.xSobreY ? (y) => res.xSobreY.a + res.xSobreY.b * y : null;
      res.ecuacion = `y = ${f(a)} ${mas(b)}x`; res.R2 = r * r;
      if (sig) {
        const W = ponderado(pts); res.pond = W; res.sinPesos = { a, b }; delete res.inc;
        res.pred = (x) => W.a + W.b * x; res.inv = W.b ? (y) => (y - W.a) / W.b : null; res.ecuacion = `y = ${f(W.a)} ${mas(W.b)}x`;
        const g6 = (x) => f(x, 5);
        pasos.push({ t: 'Gewichtete Anpassung: Jeder Punkt wiegt $1/σ_i^2$', html: `Die genaueren Punkte müssen stärker zählen. Man minimiert $χ^2 = ∑ ({y_i − a − b x_i}/{σ_i})^2$ und erhält mit $w_i = 1/σ_i^2$ die Summen $S = ∑ w_i = ${g6(W.S)}$, $S_x = ∑ w_i x_i = ${g6(W.Sx)}$, $S_y = ∑ w_i y_i = ${g6(W.Sy)}$, $S_{xx} = ∑ w_i x_i^2 = ${g6(W.Sxx)}$, $S_{xy} = ∑ w_i x_i y_i = ${g6(W.Sxy)}$ und $Δ = S S_{xx} − S_x^2 = ${g6(W.D)}$:<br>$b = {S S_{xy} − S_x S_y}/Δ = ${f(W.b)}$, &ensp; $a = {S_{xx} S_y − S_x S_{xy}}/Δ = ${f(W.a)}$<br><b>${res.ecuacion}</b> (ohne Gewichte ergäbe sich $y = ${f(a)} ${mas(b)} x$).` });
        pasos.push({ t: 'Fehler von Steigung und Achsenabschnitt', html: `Sie ergeben sich aus den Unsicherheiten der Daten, nicht aus der Abweichung von der Geraden: $σ_b = √{S/Δ} = ${f(W.sb)}$, &ensp; $σ_a = √{S_{xx}/Δ} = ${f(W.sa)}$<br>Für den Bericht: <b>b = ${conError(W.b, W.sb)}</b> und <b>a = ${conError(W.a, W.sa)}</b>.` });
        if (W.gl > 0) pasos.push({ t: 'Reduziertes χ²: Passt die Gerade zu den Daten?', html: `$χ^2 = ${f(W.chi2)}$ mit $N − 2 = ${W.gl}$ Freiheitsgraden: $χ^2_"red" = ${f(W.red)}$, und die Wahrscheinlichkeit eines solchen oder größeren χ², wenn die Gerade stimmt, beträgt <b>${E.prob(W.p)}</b>.<br>${W.red > 2 && W.p < 0.05 ? `Es ist deutlich größer als 1: Die Punkte weichen stärker von der Geraden ab, als ihre Unsicherheiten erlauben. Entweder ist das Modell keine Gerade, oder die Unsicherheiten sind unterschätzt; akzeptiert man die Gerade, werden die Fehler mit $√{χ^2_"red"}$ vergrößert: $σ_b = ${f(W.sb * Math.sqrt(W.red))}$, $σ_a = ${f(W.sa * Math.sqrt(W.red))}$.` : W.red < 0.3 && W.gl > 2 ? 'Es ist viel kleiner als 1: Die Punkte liegen besser auf der Geraden als zu erwarten; normalerweise sind die Unsicherheiten überschätzt.' : 'Es liegt nahe bei 1: Die Gerade ist mit den Daten und ihren Unsicherheiten vereinbar.'}` });
        else pasos.push({ t: 'χ² reducido', html: 'Mit zwei Punkten geht die Gerade durch beide: Es bleiben keine Freiheitsgrade, um die Anpassung zu beurteilen.' });
      }
    } else if (modelo === 'origen') {
      if (!(m.sxx > 0)) throw new Error('Für eine Gerade durch den Ursprung braucht es ein x ungleich 0');
      const B = m.sxy / m.sxx;
      res.pred = (x) => B * x; res.inv = B ? (y) => y / B : null; res.coef = { b: B };
      res.ecuacion = `y = ${f(B)}x`;
      const se0 = m.N > 1 ? Math.sqrt(pts.reduce((s, q) => s + q.n * (q.y - B * q.x) ** 2, 0) / (m.N - 1)) : null, sb0 = se0 === null ? null : se0 / Math.sqrt(m.sxx);
      if (sb0 !== null) res.inc0 = { se: se0, sb: sb0 };
      pasos.push({ t: 'Gerade durch den Ursprung: $y = bx$', html: `Wenn die Theorie sagt, dass y = 0 für x = 0 (ein Hooke-Gesetz, das Ohmsche Gesetz…), wird nur die Steigung angepasst. Die Minimierung von $∑ (y_i − b x_i)^2$ ergibt $b = {${S('x_i y_i')}}/{${S('x_i^2')}} = {${f(m.sxy, 6)}}/{${f(m.sxx, 6)}}$ = <b>${f(B)}</b><br><b>${res.ecuacion}</b>, gegenüber der Steigung ${f(b)} der Geraden mit Achsenabschnitt.${sb0 !== null ? `<br>Unsicherheit: $s_e = √({∑ (y_i − b x_i)^2}/{N − 1}) = ${f(se0)}$ und $s_b = s_e/√{${S('x_i^2')}} = ${f(sb0)}$, also <b>b = ${conError(B, sb0)}</b>.` : ''}` });
    } else if (modelo === 'parabolica') {
      const sum = (g) => pts.reduce((s, q) => s + q.n * g(q.x, q.y), 0);
      const s1 = m.N, s2 = m.sx, s3 = m.sxx, s4 = sum((x) => x ** 3), s5 = sum((x) => x ** 4), t1 = m.sy, t2 = m.sxy, t3 = sum((x, y) => x * x * y);
      const su = (k) => sum((x) => (x - m.mx) ** k), sol = new Set(xs).size >= 3 ? cramer3([[s1, 0, su(2)], [0, su(2), su(3)], [su(2), su(3), su(4)]], [t1, sum((x, y) => (x - m.mx) * y), sum((x, y) => (x - m.mx) ** 2 * y)]) : null;
      if (!sol) throw new Error('Für eine Parabel braucht es mindestens drei verschiedene x-Werte');
      const C = sol[2], B = sol[1] - 2 * C * m.mx, A = sol[0] - sol[1] * m.mx + C * m.mx ** 2;
      res.pred = (x) => A + B * x + C * x * x; res.inv = null; res.coef = { a: A, b: B, c: C };
      res.ecuacion = `y = ${f(A)} ${mas(B)}x ${mas(C)}x²`;
      pasos.push({ t: 'Normalgleichungen der Parabel', html: `Die Minimierung von $∑ (y_i − a − b x_i − c x_i^2)^2$ ergibt drei Gleichungen:<br>$${f(s1, 6)} a + ${p(s2)} b + ${p(s3)} c = ${f(t1, 6)}$<br>$${f(s2, 6)} a + ${p(s3)} b + ${p(s4)} c = ${f(t2, 6)}$<br>$${f(s3, 6)} a + ${p(s4)} b + ${p(s5)} c = ${f(t3, 6)}$<br>Auflösen ergibt: $a = ${f(A)}$, $b = ${f(B)}$, $c = ${f(C)}$ ⇒ <b>${res.ecuacion}</b>` });
    } else {
      const gx = M.u === 'ln x' ? Math.log : M.u === '1/x' ? (x) => 1 / x : (x) => x, gy = M.w === 'ln y' ? Math.log : (y) => y;
      if (M.u === 'ln x' && xmin <= 0) throw new Error(`Die Anpassung (${M.adj}) verwendet ln x: Alle x müssen positiv sein`);
      if (M.u === '1/x' && xs.includes(0)) throw new Error(`Die Anpassung (${M.adj}) verwendet 1/x: Kein x darf 0 sein`);
      if (M.w === 'ln y' && Math.min(...ys) <= 0) throw new Error(`Die Anpassung (${M.adj}) verwendet ln y: Alle y müssen positiv sein`);
      const mt = momentos(pts, gx, gy);
      if (mt.vx === 0) throw new Error('Alle Punkte haben dasselbe x');
      const B = mt.cxy / mt.vx, A0 = mt.my - B * mt.mx, rt = mt.vy === 0 ? 0 : mt.cxy / (mt.sdx * mt.sdy);
      const U = M.u, W = M.w, Ut = U.replace('x', 'x_i'), Wt = W.replace('y', 'y_i');
      let html = `Durch einen Variablenwechsel wird daraus eine Gerade: $u = ${U}$, $w = ${W}$${M.w === 'ln y' ? (M.u === 'ln x' ? ', denn $ln y = ln a + b ln x$' : ', denn $ln y = ln a + b x$') : ', und die Gleichung ist bereits linear in u'}. Mit den transformierten Daten:<br>$ū = ${f(mt.mx)}$, $w̄ = ${f(mt.my)}$, $σ_u^2 = ${f(mt.vx)}$, $σ_{uw} = ${f(mt.cxy)}$<br>$b = σ_{uw}/{σ_u^2} = ${f(B)}$, &ensp; $${M.w === 'ln y' ? 'ln a' : 'a'} = w̄ − b ū = ${f(A0)}$`;
      let A = A0;
      if (M.w === 'ln y') { A = Math.exp(A0); html += ` ⇒ $a = e^{${f(A0)}} = ${f(A, 4, 0)}$`; if (A < 1e-6 && xmin > 1000) html += '<br>Bei so großen x wird a sehr klein. Wenn die x Jahreszahlen sind, ziehe das erste von allen ab, damit a der Wert von y zu Beginn ist.'; }
      res.coef = { a: A, b: B }; res.rt = rt;
      if (modelo === 'exponencial') { res.pred = (x) => A * Math.exp(B * x); res.inv = (y) => (y > 0 && B ? Math.log(y / A) / B : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·e<sup>${f(B)}x</sup>`; }
      if (modelo === 'potencial') { res.pred = (x) => (x > 0 ? A * x ** B : NaN); res.inv = (y) => (y > 0 && B ? (y / A) ** (1 / B) : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·x<sup>${f(B)}</sup>`; }
      if (modelo === 'hiperbolica') { res.pred = (x) => (x ? A + B / x : NaN); res.inv = (y) => (y !== A && B ? B / (y - A) : NaN); res.ecuacion = `y = ${f(A)} ${mas(B)}/x`; }
      if (modelo === 'logaritmica') { res.pred = (x) => (x > 0 ? A + B * Math.log(x) : NaN); res.inv = (y) => (B ? Math.exp((y - A) / B) : NaN); res.ecuacion = `y = ${f(A)} ${mas(B)} ln x`; }
      html += `<br><b>${res.ecuacion}</b><br>Der Korrelationskoeffizient der transformierten Variablen ist $r_{uw} = ${d4(rt)}$ (${f(100 * rt * rt, 3)} % der Variation von ${W} erklärt).`;
      const g = (x) => f(x, 6), tr = pts.some((q) => q.n !== 1);
      const tabT = tabla ? { cab: ['x<sub>i</sub>', 'y<sub>i</sub>', ...(tr ? ['n<sub>i</sub>'] : []), `u<sub>i</sub> = ${Ut}`, `w<sub>i</sub> = ${Wt}`, ...(tr ? ['n<sub>i</sub>u<sub>i</sub>', 'n<sub>i</sub>w<sub>i</sub>', 'n<sub>i</sub>u<sub>i</sub><sup>2</sup>', 'n<sub>i</sub>u<sub>i</sub>w<sub>i</sub>'] : ['u<sub>i</sub><sup>2</sup>', 'u<sub>i</sub>w<sub>i</sub>'])].map((c) => c.replace(/_i/g, '<sub>i</sub>')),
        filas: pts.map((q) => [q.x, q.y, ...(tr ? [q.n] : []), gx(q.x), gy(q.y), ...(tr ? [q.n * gx(q.x), q.n * gy(q.y)] : []), q.n * gx(q.x) ** 2, q.n * gx(q.x) * gy(q.y)].map(g)),
        tot: ['', '', ...(tr ? [g(mt.N), '', '', g(mt.sx), g(mt.sy)] : [g(mt.sx), g(mt.sy)]), g(mt.sxx), g(mt.sxy)] } : null;
      pasos.push({ t: `Anpassung (${M.adj}): $${M.forma}$`, tabla: tabT, html });
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
      pasos.push({ t: 'Güte der Anpassung', html: `In den ursprünglichen y ist $R^2 = 1 − {∑ (y_i − ŷ_i)^2}/{∑ (y_i − ȳ)^2} = 1 − {${f(SSr)}}/{${f(SSt)}}$ = <b>${d4(res.R2)}</b>, gegenüber $R^2 = ${d4(rl)}$ der Geraden. ${res.R2 > rl + 1e-9 ? `Die Anpassung (${M.adj}) passt besser zu den Daten als die Gerade.` : res.R2 < rl - 1e-9 ? 'Die Gerade passt besser als diese Anpassung: Vielleicht ist das Modell nicht geeignet.' : 'Beide passen gleich gut.'}` });
    }
    if (tabla) pasos.push({ t: 'Residuen', residuos: true, html: `Residuum $e_i = y_i − ŷ_i$, der vertikale Abstand jedes Punktes zur ${modelo === 'lineal' ? 'Geraden' : 'Kurve'}. ${modelo === 'lineal' || modelo === 'parabolica' ? 'Sie summieren sich zu 0 (mit ihren Häufigkeiten).' : ''} Das betragsmäßig größte ist ${f(Math.max(...res.residuos.map((q) => Math.abs(q.e))))}.${res.se ? ` Die Standardabweichung der Residuen ist ${f(res.se)}. ${res.atipicos.length ? `Sie weichen um mehr als das Doppelte dieses Wertes ab und können Ausreißer sein (ein Mess- oder Abschreibfehler): ${res.atipicos.map((q) => `(${f(q.x)}, ${f(q.y)})`).join(', ')}.` : 'Kein Punkt weicht um mehr als das Doppelte dieses Wertes ab: Es gibt keine klaren Ausreißer.'}` : ''}` });

    if (!sc.sinComparar) {
      const filas = Object.entries(MODELOS).map(([k, Mo]) => { try { const o = resolver({ ...sc, modelo: k, x0: '', y0: '', sinComparar: true }); return [k, Mo.nombre, o.ecuacion, o.R2]; } catch (e) { return [k, Mo.nombre, e.message, null]; } });
      const mejor = filas.filter((q) => q[3] !== null && q[0] !== 'parabolica').sort((u, v) => v[3] - u[3])[0];
      res.comparacion = filas.map(([k, n, e, R2]) => ({ modelo: k, nombre: n, ecuacion: e, R2, mejor: mejor && k === mejor[0] }));
      pasos.push({ t: 'Vergleich der Anpassungen', tabla: { cab: ['Anpassung', 'Gleichung', 'R²'], filas: res.comparacion.map((q) => [`${q.mejor ? '★ ' : ''}${q.nombre}`, q.R2 === null ? `<small>${q.ecuacion}</small>` : q.ecuacion, q.R2 === null ? '—' : d4(q.R2)]) }, html: `${mejor ? `Von den Anpassungen mit zwei Parametern passt die <b>${mejor[1].toLowerCase()}</b> am besten (★). ` : ''}Die Parabel hat einen Parameter mehr, ihr R² ist also nie kleiner als das der Geraden: Wähle sie nur, wenn sie deutlich besser ist oder die Theorie es verlangt.` });
    }

    const fiable = () => (res.R2 >= 0.81 ? 'die Anpassung ist gut' : res.R2 >= 0.5 ? 'die Anpassung ist nur mittelmäßig' : 'die Anpassung ist schlecht');
    if (x0 !== null) {
      const yp = res.pred(x0);
      if (!isFinite(yp)) throw new Error('Die Anpassung ist bei diesem x-Wert nicht definiert');
      res.x0 = x0; res.yx0 = yp;
      const fuera = x0 < xmin || x0 > xmax;
      let pasoIC = null;
      if (modelo === 'lineal' && res.inc) {
        const { se, tk, Sxx, nivel: c } = res.inc, h1 = tk * se * Math.sqrt(1 / m.N + (x0 - m.mx) ** 2 / Sxx), h2 = tk * se * Math.sqrt(1 + 1 / m.N + (x0 - m.mx) ** 2 / Sxx);
        res.icMedia = [yp - h1, yp + h1]; res.icPred = [yp - h2, yp + h2];
        pasoIC = { t: `Intervalle der Schätzung zu ${f(100 * c)} %`, html: `Für den Mittelwert von y bei x = ${f(x0)}: $ŷ ± t s_e √(1/N + (x_0 − x̄)^2/S_{xx})$ = <b>${ic(...res.icMedia)}</b><br>Für einen konkreten y-Wert (Prognoseintervall, breiter): $ŷ ± t s_e √(1 + 1/N + (x_0 − x̄)^2/S_{xx})$ = <b>${ic(...res.icPred)}</b><br>Beide werden breiter, wenn man sich von x̄ entfernt.` };
      }
      pasos.push({ t: `Schätzung von y für x = ${f(x0)}`, html: `${res.pond ? `Mit der gewichteten Geraden: $ŷ = ${f(res.pond.a)} ${mas(res.pond.b)} · ${p(x0)}$` : modelo === 'lineal' ? `Mit der Geraden von Y auf X: $ŷ = ${f(a)} ${mas(b)} · ${p(x0)}$` : `$ŷ(${f(x0)})$ mit ${res.ecuacion}`} = <b>${f(yp)}</b><br>${fuera ? `Achtung: x = ${f(x0)} liegt außerhalb des Datenbereichs [${f(xmin)}, ${f(xmax)}]. Es ist eine Extrapolation und kann unzuverlässig sein, auch wenn ${fiable()}.` : `Es liegt im Datenbereich und ${fiable()} ($R^2 = ${d4(res.R2)}$), daher ${res.R2 >= 0.81 ? 'ist die Schätzung zuverlässig' : 'ist die Schätzung mit Vorsicht zu behandeln'}.`}` });
      if (pasoIC) pasos.push(pasoIC);
      if (res.pond) { const W = res.pond, sy = Math.sqrt(Math.max(0, W.sa ** 2 + x0 * x0 * W.sb ** 2 + 2 * x0 * W.cov)); res.syx0 = sy; pasos.push({ t: 'Unsicherheit der Schätzung', html: `a und b stammen aus derselben Anpassung und sind korreliert, daher braucht man ihre Kovarianz $"cov"(a, b) = −S_x/Δ = ${f(W.cov)}$:<br>$σ_ŷ = √(σ_a^2 + x_0^2 σ_b^2 + 2 x_0 "cov"(a, b)) = ${f(sy)}$ ⇒ <b>ŷ = ${conError(yp, sy)}</b>` }); }
    }
    if (y0 !== null) {
      const xp = res.inv ? res.inv(y0) : NaN;
      if (modelo === 'parabolica') pasos.push({ t: `Schätzung von x für y = ${f(y0)}`, html: 'Bei einer Parabel kann das Auflösen nach x zwei Werte oder keinen ergeben. Um x aus y zu schätzen, verwende die lineare Anpassung (Gerade von X auf Y).' });
      else if (!isFinite(xp)) throw new Error('Für diesen y-Wert lässt sich x nicht auflösen');
      else {
        res.y0 = y0; res.xy0 = xp;
        pasos.push({ t: `Schätzung von x für y = ${f(y0)}`, html: `${res.pond ? 'Auflösen nach x in der gewichteten Geraden' : modelo === 'lineal' ? `Um x zu schätzen, wird die Gerade von X auf Y verwendet, nicht die von Y auf X aufgelöst: $x̂ = ${f(res.xSobreY.a)} ${mas(res.xSobreY.b)} · ${p(y0)}$` : `Auflösen nach x in ${res.ecuacion}`} = <b>${f(xp)}</b>${modelo === 'lineal' && !res.pond && Math.abs(r) < 0.999 ? ` (beim Auflösen der anderen Geraden ergäbe sich ${f((y0 - a) / b)}; sie stimmen nur überein, wenn |r| = 1).` : '.'}` });
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
    { clave: 'peso-altura', nombre: 'Körpergröße und Gewicht von 8 Studierenden', sc: { modelo: 'lineal', datos: '160 55\n165 58\n168 64\n170 63\n172 68\n175 70\n180 77\n185 80', x0: '178', y0: '60' } },
    { clave: 'inversa', nombre: 'Preis und verkaufte Stückzahl (negative Korrelation)', sc: { modelo: 'lineal', datos: '10 120\n12 110\n14 98\n16 90\n18 85\n20 71', x0: '15', y0: '' } },
    { clave: 'frecuencias', nombre: 'Tabelle mit Häufigkeiten (Anzahl der Kinder und Zimmer)', sc: { modelo: 'lineal', datos: 'x y n\n1 2 4\n2 2 2\n2 3 6\n3 3 5\n3 4 3\n4 4 4', x0: '', y0: '' } },
    { clave: 'debil', nombre: 'Daten ohne nennenswerten Zusammenhang', sc: { modelo: 'lineal', datos: '1 5\n2 3\n3 6\n4 2\n5 5\n6 4\n7 3', x0: '', y0: '' } },
    { clave: 'hooke', nombre: 'Hooke-Gesetz: Masse und Dehnung', sc: { modelo: 'lineal', datos: '# masa (g); alargamiento (cm)\n50; 2,1\n100; 4,0\n150; 6,2\n200; 7,9\n250; 10,1', x0: '120', y0: '5' } },
    { clave: 'hooke-origen', nombre: 'Hooke-Gesetz mit der Geraden durch den Ursprung', sc: { modelo: 'origen', datos: '# masa (g); alargamiento (cm)\n50; 2,1\n100; 4,0\n150; 6,2\n200; 7,9\n250; 10,1', x0: '120', y0: '' } },
    { clave: 'cuasi', nombre: 'Mit Stichprobenvarianzen (durch N − 1 geteilt)', sc: { modelo: 'lineal', div: 'n1', datos: '2 15\n4 22\n5 24\n7 31\n9 37\n10 38', x0: '6', y0: '', nivel: '95' } },
    { clave: 'doble', nombre: 'Kontingenztafel (Noten in zwei Fächern)', sc: { modelo: 'lineal', formato: 'doble', datos: '', doble: 'x\\y 4 6 8\n3 5 2 0\n5 3 8 2\n7 0 3 6\n9 0 1 4', x0: '', y0: '' } },
    { clave: 'atipico', nombre: 'Ein falsch abgeschriebener Wert (Ausreißer)', sc: { modelo: 'lineal', datos: '1 2,1\n2 3,9\n3 6,2\n4 8,1\n5 19\n6 11,8\n7 14,1\n8 15,9', x0: '', y0: '' } },
    { clave: 'bacterias', nombre: 'Bakterienwachstum (exponentiell)', sc: { modelo: 'exponencial', datos: '0 100\n1 165\n2 270\n3 450\n4 740\n5 1220', x0: '6', y0: '' } },
    { clave: 'kepler', nombre: 'Drittes Keplersches Gesetz (Potenz)', sc: { modelo: 'potencial', datos: '# a (UA); T (años)\n0,387 0,241\n0,723 0,615\n1 1\n1,524 1,881\n5,203 11,86\n9,537 29,46', x0: '19.19', y0: '' } },
    { clave: 'sonido', nombre: 'Schallpegel und Entfernung (logarithmisch)', sc: { modelo: 'logaritmica', datos: '1 90\n2 84\n4 78,2\n8 72\n16 66,1', x0: '10', y0: '' } },
    { clave: 'boyle', nombre: 'Boyle-Gesetz: Druck und Volumen (hyperbolisch)', sc: { modelo: 'hiperbolica', datos: '# V (L); P (atm)\n1 24,5\n2 12,3\n3 8,1\n4 6,2\n5 4,9\n6 4,1', x0: '2.5', y0: '' } },
    { clave: 'frenada', nombre: 'Geschwindigkeit und Bremsweg (parabolisch)', sc: { modelo: 'parabolica', datos: '# km/h; m\n30 9\n50 21\n70 38\n90 58\n110 85\n130 115', x0: '100', y0: '' } },
    { clave: 'ponderado', nombre: 'Gewichtete Anpassung: Jedes y mit seiner Unsicherheit', sc: { modelo: 'lineal', formato: 'sigma', datosS: '1 2,1 0,2\n2 3,9 0,2\n3 6,2 0,3\n4 7,8 0,3\n5 10,3 0,5\n6 11,7 0,5', x0: '7', y0: '' } },
    { clave: 'dos-correlaciones', nombre: 'Intervall von ρ und Vergleich mit einer anderen Stichprobe', sc: { modelo: 'lineal', datos: '160 55\n165 58\n168 64\n170 63\n172 68\n175 70\n180 77\n185 80', x0: '', y0: '', r2c: '0,62', n2c: '40' } },
    { clave: 'notas', nombre: 'Lernstunden und Prüfungsnote', sc: { modelo: 'lineal', datos: '1 3\n2 4\n3 5,5\n4 6\n5 7,5\n6 8\n7 9', x0: '4.5', y0: '' } },
  ];

  return { resolver, leeDatos, leeDoble, leeSigma, ponderado, momentos, MODELOS, ejemplos, f, d4, conError };
})();

