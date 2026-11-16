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
      if (tk.length < 2 || tk.length > 3) throw new Error(`Fila ${i + 1}: escribe x e y (y si quieres la frecuencia) separados por espacios, tabuladores o «;»`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Fila ${i + 1}: «${l}» no son números`);
      const n = tk.length === 3 ? v[2] : 1;
      if (!(n > 0)) throw new Error(`Fila ${i + 1}: la frecuencia debe ser mayor que 0`);
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
      if (tk.length !== 3) throw new Error(`Fila ${i + 1}: escribe x, y y la incertidumbre de y («2 4,1 0,2»)`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Fila ${i + 1}: «${l}» no son números`);
      if (!(v[2] > 0)) throw new Error(`Fila ${i + 1}: la incertidumbre de y tiene que ser mayor que 0 (el peso es 1/σ²)`);
      pts.push({ x: v[0], y: v[1], n: 1, s: v[2] });
    });
    return pts;
  }
  function ponderado(pts) {
    let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
    for (const q of pts) { const w = 1 / (q.s * q.s); S += w; Sx += w * q.x; Sy += w * q.y; Sxx += w * q.x * q.x; Sxy += w * q.x * q.y; }
    const D = S * Sxx - Sx * Sx;
    if (!(D > 0)) throw new Error('Todos los puntos tienen la misma x: no se puede ajustar una recta');
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
    if (!ys.length || ys.some((y) => !isFinite(y))) throw new Error('La primera fila de la tabla tiene que ser los valores de y (puede empezar con una esquina como «x\\y»)');
    const pts = [];
    for (const [l, i] of filas.slice(1)) {
      const v = parte(l).map(leeNum);
      if (v.length !== ys.length + 1) throw new Error(`Fila ${i + 1}: tiene que ser el valor de x y ${ys.length} frecuencias, una por cada y`);
      if (v.some((x) => !isFinite(x))) throw new Error(`Fila ${i + 1}: «${l}» no son números`);
      if (v.slice(1).some((n) => n < 0)) throw new Error(`Fila ${i + 1}: las frecuencias no pueden ser negativas`);
      v.slice(1).forEach((n, j) => { if (n > 0) pts.push({ x: v[0], y: ys[j], n }); });
    }
    return pts;
  }

  const MODELOS = {
    lineal: { nombre: 'Lineal', adj: 'lineal', forma: 'y = a + bx' },
    origen: { nombre: 'Recta por el origen', adj: 'por el origen', forma: 'y = bx' },
    exponencial: { nombre: 'Exponencial', adj: 'exponencial', forma: 'y = a·e^{bx}', u: 'x', w: 'ln y' },
    potencial: { nombre: 'Potencial', adj: 'potencial', forma: 'y = a·x^b', u: 'ln x', w: 'ln y' },
    logaritmica: { nombre: 'Logarítmica', adj: 'logarítmico', forma: 'y = a + b ln x', u: 'ln x', w: 'y' },
    hiperbolica: { nombre: 'Hiperbólica', adj: 'hiperbólico', forma: 'y = a + b/x', u: '1/x', w: 'y' },
    parabolica: { nombre: 'Parabólica', adj: 'parabólico', forma: 'y = a + bx + cx^2' },
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
    const q = a >= 0.9 ? 'muy fuerte' : a >= 0.7 ? 'fuerte' : a >= 0.5 ? 'moderada' : a >= 0.3 ? 'débil' : 'muy débil o nula';
    if (a < 0.3) return 'La correlación es muy débil o no hay relación lineal: la recta apenas sirve para estimar.';
    return `La correlación es ${q} y ${r > 0 ? 'positiva (directa): cuando x crece, y tiende a crecer' : 'negativa (inversa): cuando x crece, y tiende a bajar'}.`;
  }

  function cramer3(A, b) {
    const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const D = det(A);
    if (!(Math.abs(D) > 1e-12 * Math.abs(A[0][0] * A[1][1] * A[2][2]))) return null;
    return [0, 1, 2].map((j) => det(A.map((fila, i) => fila.map((v, k) => (k === j ? b[i] : v)))) / D);
  }

  function resolver(sc) {
    const doble = sc.formato === 'doble', sig = sc.formato === 'sigma', pts = doble ? leeDoble(sc.doble) : sig ? leeSigma(sc.datosS) : leeDatos(sc.datos), modelo = MODELOS[sc.modelo] ? sc.modelo : 'lineal', M = MODELOS[modelo];
    if (pts.length < 2) throw new Error('Hacen falta al menos dos puntos');
    const x0 = vacio(sc.x0) ? null : leeNum(sc.x0), y0 = vacio(sc.y0) ? null : leeNum(sc.y0);
    if (x0 !== null && !isFinite(x0)) throw new Error('El valor de x para estimar debe ser un número');
    if (y0 !== null && !isFinite(y0)) throw new Error('El valor de y para estimar debe ser un número');
    const m = momentos(pts);
    if (m.vx === 0) throw new Error('Todos los puntos tienen la misma x: no se puede ajustar y en función de x');
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y), xmin = Math.min(...xs), xmax = Math.max(...xs);
    const pasos = [], tabla = pts.length <= 20;
    const S = (t) => (pts.some((q) => q.n !== 1) ? `∑ n_i ${t}` : `∑ ${t}`);
    const cu = sc.div === 'n1' && m.N > 1, k1 = cu ? m.N / (m.N - 1) : 1, Vx = m.vx * k1, Vy = m.vy * k1, Cxy = m.cxy * k1, Sx = Math.sqrt(Vx), Sy = Math.sqrt(Vy);
    const L = cu ? 's' : 'σ', VX = `${L}_x^2`, VY = `${L}_y^2`, CXY = `${L}_{xy}`;
    if (doble) pasos.push({ t: 'Tabla de doble entrada', html: `Cada casilla con frecuencia distinta de 0 es un punto (x, y) con esa frecuencia: salen ${pts.length} puntos distintos y N = ${f(m.N, 6)} observaciones.` });

    pasos.push({ t: 'Tabla de cálculos', tabla: tabla ? tablaSumas(pts, m) : null, html: `$N = ${f(m.N, 6)}$, &ensp; $${S('x_i')} = ${f(m.sx, 6)}$, &ensp; $${S('y_i')} = ${f(m.sy, 6)}$, &ensp; $${S('x_i^2')} = ${f(m.sxx, 6)}$, &ensp; $${S('y_i^2')} = ${f(m.syy, 6)}$, &ensp; $${S('x_i y_i')} = ${f(m.sxy, 6)}$` });
    pasos.push({ t: 'Medias', html: `$x̄ = {${S('x_i')}}/N = {${f(m.sx, 6)}}/${f(m.N, 6)}$ = <b>${f(m.mx)}</b>, &ensp; $ȳ = {${S('y_i')}}/N = {${f(m.sy, 6)}}/${f(m.N, 6)}$ = <b>${f(m.my)}</b>` });
    if (cu) {
      pasos.push({ t: 'Cuasivarianzas y cuasidesviaciones (con N − 1)', html: `$s_x^2 = {${S('x_i^2')} − N x̄^2}/{N − 1} = {${f(m.sxx, 6)} − ${f(m.N, 6)} · ${p(m.mx)}^2}/${f(m.N - 1, 6)} = ${f(Vx)}$ &ensp;⇒&ensp; $s_x = ${f(Sx)}$<br>$s_y^2 = {${S('y_i^2')} − N ȳ^2}/{N − 1} = {${f(m.syy, 6)} − ${f(m.N, 6)} · ${p(m.my)}^2}/${f(m.N - 1, 6)} = ${f(Vy)}$ &ensp;⇒&ensp; $s_y = ${f(Sy)}$<br>Con N en vez de N − 1 saldrían $σ_x = ${f(m.sdx)}$ y $σ_y = ${f(m.sdy)}$. El coeficiente de correlación y las rectas salen iguales con unas o con otras.` });
      pasos.push({ t: 'Cuasicovarianza', html: `$s_{xy} = {${S('x_i y_i')} − N x̄ ȳ}/{N − 1} = {${f(m.sxy, 6)} − ${f(m.N, 6)} · ${p(m.mx)} · ${p(m.my)}}/${f(m.N - 1, 6)}$ = <b>${f(Cxy)}</b><br>${m.cxy > 0 ? 'Es positiva: la relación es directa.' : m.cxy < 0 ? 'Es negativa: la relación es inversa.' : 'Es cero: no hay relación lineal.'}` });
    } else {
      pasos.push({ t: 'Varianzas y desviaciones típicas', html: `$σ_x^2 = {${S('x_i^2')}}/N − x̄^2 = {${f(m.sxx, 6)}}/${f(m.N, 6)} − ${p(m.mx)}^2 = ${f(m.vx)}$ &ensp;⇒&ensp; $σ_x = ${f(m.sdx)}$<br>$σ_y^2 = {${S('y_i^2')}}/N − ȳ^2 = {${f(m.syy, 6)}}/${f(m.N, 6)} − ${p(m.my)}^2 = ${f(m.vy)}$ &ensp;⇒&ensp; $σ_y = ${f(m.sdy)}$${m.N > 1 ? `<br>Las cuasidesviaciones (de la muestra, dividiendo entre N − 1) son $s_x = ${f(m.sdx * Math.sqrt(m.N / (m.N - 1)))}$ y $s_y = ${f(m.sdy * Math.sqrt(m.N / (m.N - 1)))}$. El coeficiente de correlación y las rectas salen iguales con unas o con otras.` : ''}` });
      pasos.push({ t: 'Covarianza', html: `$σ_{xy} = {${S('x_i y_i')}}/N − x̄ ȳ = {${f(m.sxy, 6)}}/${f(m.N, 6)} − ${p(m.mx)} · ${p(m.my)}$ = <b>${f(m.cxy)}</b><br>${m.cxy > 0 ? 'Es positiva: la relación es directa.' : m.cxy < 0 ? 'Es negativa: la relación es inversa.' : 'Es cero: no hay relación lineal.'}` });
    }

    const r = m.vy === 0 ? 0 : m.cxy / (m.sdx * m.sdy);
    pasos.push({ t: 'Coeficiente de correlación de Pearson', html: m.vy === 0 ? 'Todos los puntos tienen la misma y: σ<sub>y</sub> = 0, la recta es horizontal y r no está definido (se toma 0).' : `$r = ${CXY}/{${L}_x ${L}_y} = {${f(Cxy)}}/{${f(Sx)} · ${f(Sy)}}$ = <b>${d4(r)}</b><br>${fuerza(r)} El coeficiente de determinación es $r^2 = ${d4(r * r)}$: la recta explica el ${f(100 * r * r, 3)} % de la variación de y.` });

    const nivel = (() => { let c = vacio(sc.nivel) ? 95 : leeNum(sc.nivel); if (c >= 1) c /= 100; if (!(c > 0 && c < 1)) throw new Error('El nivel de confianza tiene que estar entre 0 y 100 %'); return c; })();
    let t = null, pval = null;
    const nu = m.N - 2;
    if (nu >= 1 && m.vy > 0) {
      if (Math.abs(r) >= 1 - 1e-12) { t = Infinity; pval = 0; }
      else { t = (r * Math.sqrt(nu)) / Math.sqrt(1 - r * r); pval = E.betaI(nu / (nu + t * t), nu / 2, 0.5); }
      pasos.push({ t: '¿Es significativa la correlación?', html: `Contraste de $H_0: ρ = 0$ con $t = r √(N − 2)/√(1 − r^2)$, que sigue una t de Student con ${f(nu, 6)} grados de libertad: ${isFinite(t) ? `$t = ${d4(r)} · √${f(nu, 6)}/√(1 − ${p(r)}^2) = ${f(t)}$, p-valor bilateral = <b>${E.prob(pval)}</b>` : 'los puntos están alineados del todo, t → ∞ y p-valor = 0'}<br>${pval < 0.05 ? 'Como p &lt; 0,05, se rechaza H₀: hay correlación significativa al 5 %.' : 'Como p ≥ 0,05, no se puede rechazar H₀: con estos datos la correlación no es significativa al 5 %.'}${m.N !== pts.length ? ' (N cuenta las frecuencias.)' : ''}` });
    }

    let fisher = null, comp = null;
    const zq = (c) => E.cuantil(E.DIST.normal, { mu: 0, sigma: 1 }, 1 - (1 - c) / 2);
    if (m.N >= 4 && m.vy > 0 && Math.abs(r) < 1 - 1e-12) {
      const z = Math.atanh(r), se = 1 / Math.sqrt(m.N - 3), k = zq(nivel), za = z - k * se, zb = z + k * se;
      fisher = { z, se, k, a: Math.tanh(za), b: Math.tanh(zb), nivel };
      pasos.push({ t: `Intervalo de confianza de ρ al ${f(100 * nivel)} % (z de Fisher)`, html: `r no se reparte como una normal (está encerrado entre −1 y 1), pero $z = "artanh"(r) = 1/2 ln({1 + r}/{1 − r})$ sí, con desviación típica $1/√(N − 3)$:<br>$z = "artanh"(${d4(r)}) = ${f(z)}$, &ensp; $σ_z = 1/√{${f(m.N - 3, 6)}} = ${f(se)}$, &ensp; $z ± ${f(k)} · σ_z = (${f(za)}; ${f(zb)})$<br>Se deshace el cambio con $ρ = "tanh"(z)$: $ρ$ está entre <b>${d4(fisher.a)}</b> y <b>${d4(fisher.b)}</b>.${fisher.a * fisher.b > 0 ? '' : ' El intervalo contiene el 0: la correlación no es significativa a ese nivel.'}${m.N < 10 ? ' Con tan pocos puntos el intervalo es muy ancho.' : ''}` });
    }
    if (!vacio(sc.r2c) || !vacio(sc.n2c)) {
      const r2 = leeNum(sc.r2c), n2 = leeNum(sc.n2c);
      if (!isFinite(r2) || !(Math.abs(r2) < 1)) throw new Error('El otro coeficiente de correlación r₂ tiene que estar entre −1 y 1 (sin llegar)');
      if (!Number.isInteger(n2) || n2 < 4) throw new Error('El tamaño n₂ de la otra muestra tiene que ser un entero de 4 o más');
      if (!fisher) throw new Error('Para comparar dos correlaciones hacen falta al menos 4 puntos y que no estén todos alineados');
      const z2 = Math.atanh(r2), sed = Math.sqrt(1 / (m.N - 3) + 1 / (n2 - 3)), zd = (fisher.z - z2) / sed, pd = 2 * (1 - E.Phi(Math.abs(zd)));
      comp = { r2, n2, z2, se: sed, z: zd, p: pd };
      pasos.push({ t: 'Comparación de dos correlaciones', html: `¿Es distinta esta correlación de la de otra muestra independiente con $r_2 = ${d4(r2)}$ y $n_2 = ${n2}$? Se comparan en la escala de Fisher: $z_1 = ${f(fisher.z)}$, $z_2 = "artanh"(${d4(r2)}) = ${f(z2)}$<br>$Z = {z_1 − z_2}/{√(1/(N_1 − 3) + 1/(n_2 − 3))} = {${f(fisher.z - z2)}}/{${f(sed)}} = ${f(zd)}$, p-valor bilateral = <b>${E.prob(pd)}</b><br>${pd < 0.05 ? 'Como p &lt; 0,05, las dos correlaciones son distintas al 5 %.' : 'Como p ≥ 0,05, la diferencia entre las dos correlaciones puede deberse al azar.'}` });
    }

    let rs = null;
    if (m.vy > 0 && pts.length > 2) {
      const rango = (v) => { const val = [...new Set(v)].sort((a, b) => a - b), ac = new Map(); let c = 0; for (const u of val) { const n = pts.reduce((s, q, i) => s + (v[i] === u ? q.n : 0), 0); ac.set(u, c + (n + 1) / 2); c += n; } return v.map((u) => ac.get(u)); };
      const rx = rango(xs), ry = rango(ys), mr = momentos(pts.map((q, i) => ({ x: rx[i], y: ry[i], n: q.n })));
      rs = mr.vy === 0 || mr.vx === 0 ? 0 : mr.cxy / (mr.sdx * mr.sdy);
      const simple = pts.every((q) => q.n === 1) && new Set(xs).size === xs.length && new Set(ys).size === ys.length, n = pts.length;
      const d2 = simple ? rx.reduce((s, v, i) => s + (v - ry[i]) ** 2, 0) : 0;
      pasos.push({ t: 'Correlación de Spearman (por rangos)', html: `Se cambia cada x y cada y por su puesto (rango) de menor a mayor${simple ? '' : ', con el puesto medio cuando hay empates'} y se calcula r con los rangos. ${simple ? `Sin empates sale lo mismo con $r_s = 1 − {6 ∑ d_i^2}/{n (n^2 − 1)} = 1 − {6 · ${f(d2, 6)}}/{${n} · (${n}^2 − 1)}$, donde d<sub>i</sub> es la diferencia de rangos: ` : ''}$r_s$ = <b>${d4(rs)}</b><br>Mide si y crece (o baja) siempre que crece x, aunque no sea en línea recta, y le afectan menos los puntos atípicos.` });
    }

    const b = m.cxy / m.vx, a = m.my - b * m.mx;
    const res = { modelo, pts, m, r, r2: r * r, t, pval, nu, xmin, xmax, lineal: { a, b }, div: cu ? 'n1' : 'n', cov: Cxy, rs, fisher, comp };
    pasos.push({ t: 'Recta de regresión de Y sobre X', html: `$y − ȳ = ${CXY}/{${VX}} (x − x̄)$, con pendiente $b = ${CXY}/{${VX}} = {${f(Cxy)}}/{${f(Vx)}} = ${f(b)}$ y ordenada $a = ȳ − b x̄ = ${f(m.my)} − ${p(b)} · ${p(m.mx)} = ${f(a)}$<br>$y = ${f(a)} ${mas(b)} x$${modelo === 'lineal' ? '' : ' (la recta, para comparar con el ajuste elegido)'}` });
    if (m.vy > 0) {
      const b2 = m.cxy / m.vy, a2 = m.mx - b2 * m.my;
      const ang = (Math.acos(Math.min(1, Math.abs(b2 + b) / Math.hypot(1, b) / Math.hypot(b2, 1))) * 180) / Math.PI;
      res.xSobreY = { a: a2, b: b2 }; res.angulo = ang;
      pasos.push({ t: 'Recta de regresión de X sobre Y', html: `Sirve para estimar x a partir de y: $x − x̄ = ${CXY}/{${VY}} (y − ȳ)$ ⇒ $x = ${f(a2)} ${mas(b2)} y$<br>Las dos rectas se cortan en el centro de gravedad $(x̄, ȳ) = (${f(m.mx)}, ${f(m.my)})$; cuanto más cerca de ±1 está r, más juntas van.<br>El producto de las dos pendientes es $r^2$: $b · b′ = ${p(b)} · ${p(b2)} = ${d4(b * b2)}$. El ángulo entre las dos rectas es <b>${f(ang, 3)}°</b> (0° si |r| = 1 y 90° si r = 0).` });
    }

    if (nu >= 1 && modelo === 'lineal') {
      const SSl = pts.reduce((s, q) => s + q.n * (q.y - a - b * q.x) ** 2, 0), Sxx = m.N * m.vx, se = Math.sqrt(SSl / nu);
      const sb = se / Math.sqrt(Sxx), sa = se * Math.sqrt(1 / m.N + (m.mx * m.mx) / Sxx), tk = E.cuantil(E.DIST.t, { nu }, 1 - (1 - nivel) / 2), pc = `${f(100 * nivel)} %`;
      res.inc = { se, sb, sa, tk, nivel, Sxx, banda: (x) => tk * se * Math.sqrt(1 / m.N + (x - m.mx) ** 2 / Sxx) };
      pasos.push({ t: 'Incertidumbre de la pendiente y de la ordenada', html: `Desviación típica de los residuos de la recta: $s_e = √({∑ (y_i − ŷ_i)^2}/{N − 2}) = √({${f(SSl)}}/${f(nu, 6)}) = ${f(se)}$<br>Con $S_{xx} = ∑ (x_i − x̄)^2 = ${f(Sxx)}$:<br>$s_b = s_e/√S_{xx} = ${f(sb)}$, &ensp; $s_a = s_e √(1/N + x̄^2/S_{xx}) = ${f(sa)}$<br>Para el informe: <b>b = ${conError(b, sb)}</b> y <b>a = ${conError(a, sa)}</b> (error con una cifra significativa, o dos si empieza por 1).<br>Intervalos al ${pc} con $t_{${f(nu, 6)}; α/2} = ${f(tk)}$: pendiente ${ic(b - tk * sb, b + tk * sb)}, ordenada ${ic(a - tk * sa, a + tk * sa)}.${a - tk * sa <= 0 && a + tk * sa >= 0 ? ' La ordenada podría ser 0: los datos son compatibles con una recta por el origen.' : ''}` });
    }

    if (modelo === 'lineal') {
      res.pred = (x) => a + b * x; res.inv = res.xSobreY ? (y) => res.xSobreY.a + res.xSobreY.b * y : null;
      res.ecuacion = `y = ${f(a)} ${mas(b)}x`; res.R2 = r * r;
      if (sig) {
        const W = ponderado(pts); res.pond = W; res.sinPesos = { a, b }; delete res.inc;
        res.pred = (x) => W.a + W.b * x; res.inv = W.b ? (y) => (y - W.a) / W.b : null; res.ecuacion = `y = ${f(W.a)} ${mas(W.b)}x`;
        const g6 = (x) => f(x, 5);
        pasos.push({ t: 'Ajuste ponderado: cada punto pesa $1/σ_i^2$', html: `Los puntos más precisos tienen que mandar más. Se minimiza $χ^2 = ∑ ({y_i − a − b x_i}/{σ_i})^2$ y, con $w_i = 1/σ_i^2$, salen las sumas $S = ∑ w_i = ${g6(W.S)}$, $S_x = ∑ w_i x_i = ${g6(W.Sx)}$, $S_y = ∑ w_i y_i = ${g6(W.Sy)}$, $S_{xx} = ∑ w_i x_i^2 = ${g6(W.Sxx)}$, $S_{xy} = ∑ w_i x_i y_i = ${g6(W.Sxy)}$ y $Δ = S S_{xx} − S_x^2 = ${g6(W.D)}$:<br>$b = {S S_{xy} − S_x S_y}/Δ = ${f(W.b)}$, &ensp; $a = {S_{xx} S_y − S_x S_{xy}}/Δ = ${f(W.a)}$<br><b>${res.ecuacion}</b> (sin pesos saldría $y = ${f(a)} ${mas(b)} x$).` });
        pasos.push({ t: 'Errores de la pendiente y de la ordenada', html: `Salen de las incertidumbres de los datos, no de lo que se separan de la recta: $σ_b = √{S/Δ} = ${f(W.sb)}$, &ensp; $σ_a = √{S_{xx}/Δ} = ${f(W.sa)}$<br>Para el informe: <b>b = ${conError(W.b, W.sb)}</b> y <b>a = ${conError(W.a, W.sa)}</b>.` });
        if (W.gl > 0) pasos.push({ t: 'χ² reducido: ¿se ajusta la recta a los datos?', html: `$χ^2 = ${f(W.chi2)}$ con $N − 2 = ${W.gl}$ grados de libertad: $χ^2_"red" = ${f(W.red)}$ y la probabilidad de un χ² así o mayor si la recta es correcta es <b>${E.prob(W.p)}</b>.<br>${W.red > 2 && W.p < 0.05 ? `Es bastante mayor que 1: los puntos se separan de la recta más de lo que permiten sus incertidumbres. O el modelo no es una recta o las incertidumbres están subestimadas; si se acepta la recta, los errores se amplían con $√{χ^2_"red"}$: $σ_b = ${f(W.sb * Math.sqrt(W.red))}$, $σ_a = ${f(W.sa * Math.sqrt(W.red))}$.` : W.red < 0.3 && W.gl > 2 ? 'Es mucho menor que 1: los puntos caen sobre la recta mejor de lo esperable; lo normal es que las incertidumbres estén sobreestimadas.' : 'Está cerca de 1: la recta es compatible con los datos y sus incertidumbres.'}` });
        else pasos.push({ t: 'χ² reducido', html: 'Con dos puntos la recta pasa por los dos: no quedan grados de libertad para juzgar el ajuste.' });
      }
    } else if (modelo === 'origen') {
      if (!(m.sxx > 0)) throw new Error('Para una recta por el origen hace falta alguna x distinta de 0');
      const B = m.sxy / m.sxx;
      res.pred = (x) => B * x; res.inv = B ? (y) => y / B : null; res.coef = { b: B };
      res.ecuacion = `y = ${f(B)}x`;
      const se0 = m.N > 1 ? Math.sqrt(pts.reduce((s, q) => s + q.n * (q.y - B * q.x) ** 2, 0) / (m.N - 1)) : null, sb0 = se0 === null ? null : se0 / Math.sqrt(m.sxx);
      if (sb0 !== null) res.inc0 = { se: se0, sb: sb0 };
      pasos.push({ t: 'Recta por el origen: $y = bx$', html: `Cuando la teoría dice que y = 0 si x = 0 (una ley de Hooke, la ley de Ohm…), se ajusta solo la pendiente. Al minimizar $∑ (y_i − b x_i)^2$ sale $b = {${S('x_i y_i')}}/{${S('x_i^2')}} = {${f(m.sxy, 6)}}/{${f(m.sxx, 6)}}$ = <b>${f(B)}</b><br><b>${res.ecuacion}</b>, frente a la pendiente ${f(b)} de la recta con ordenada.${sb0 !== null ? `<br>Incertidumbre: $s_e = √({∑ (y_i − b x_i)^2}/{N − 1}) = ${f(se0)}$ y $s_b = s_e/√{${S('x_i^2')}} = ${f(sb0)}$, así que <b>b = ${conError(B, sb0)}</b>.` : ''}` });
    } else if (modelo === 'parabolica') {
      const sum = (g) => pts.reduce((s, q) => s + q.n * g(q.x, q.y), 0);
      const s1 = m.N, s2 = m.sx, s3 = m.sxx, s4 = sum((x) => x ** 3), s5 = sum((x) => x ** 4), t1 = m.sy, t2 = m.sxy, t3 = sum((x, y) => x * x * y);
      const su = (k) => sum((x) => (x - m.mx) ** k), sol = new Set(xs).size >= 3 ? cramer3([[s1, 0, su(2)], [0, su(2), su(3)], [su(2), su(3), su(4)]], [t1, sum((x, y) => (x - m.mx) * y), sum((x, y) => (x - m.mx) ** 2 * y)]) : null;
      if (!sol) throw new Error('Para una parábola hacen falta al menos tres valores de x distintos');
      const C = sol[2], B = sol[1] - 2 * C * m.mx, A = sol[0] - sol[1] * m.mx + C * m.mx ** 2;
      res.pred = (x) => A + B * x + C * x * x; res.inv = null; res.coef = { a: A, b: B, c: C };
      res.ecuacion = `y = ${f(A)} ${mas(B)}x ${mas(C)}x²`;
      pasos.push({ t: 'Ecuaciones normales de la parábola', html: `Al minimizar $∑ (y_i − a − b x_i − c x_i^2)^2$ salen tres ecuaciones:<br>$${f(s1, 6)} a + ${p(s2)} b + ${p(s3)} c = ${f(t1, 6)}$<br>$${f(s2, 6)} a + ${p(s3)} b + ${p(s4)} c = ${f(t2, 6)}$<br>$${f(s3, 6)} a + ${p(s4)} b + ${p(s5)} c = ${f(t3, 6)}$<br>Resolviendo: $a = ${f(A)}$, $b = ${f(B)}$, $c = ${f(C)}$ ⇒ <b>${res.ecuacion}</b>` });
    } else {
      const gx = M.u === 'ln x' ? Math.log : M.u === '1/x' ? (x) => 1 / x : (x) => x, gy = M.w === 'ln y' ? Math.log : (y) => y;
      if (M.u === 'ln x' && xmin <= 0) throw new Error(`El ajuste ${M.adj} usa ln x: todas las x deben ser positivas`);
      if (M.u === '1/x' && xs.includes(0)) throw new Error(`El ajuste ${M.adj} usa 1/x: ninguna x puede ser 0`);
      if (M.w === 'ln y' && Math.min(...ys) <= 0) throw new Error(`El ajuste ${M.adj} usa ln y: todas las y deben ser positivas`);
      const mt = momentos(pts, gx, gy);
      if (mt.vx === 0) throw new Error('Todos los puntos tienen la misma x');
      const B = mt.cxy / mt.vx, A0 = mt.my - B * mt.mx, rt = mt.vy === 0 ? 0 : mt.cxy / (mt.sdx * mt.sdy);
      const U = M.u, W = M.w, Ut = U.replace('x', 'x_i'), Wt = W.replace('y', 'y_i');
      let html = `Se pasa a una recta cambiando de variable: $u = ${U}$, $w = ${W}$${M.w === 'ln y' ? (M.u === 'ln x' ? ', porque $ln y = ln a + b ln x$' : ', porque $ln y = ln a + b x$') : ', y la ecuación ya es lineal en u'}. Con los datos transformados:<br>$ū = ${f(mt.mx)}$, $w̄ = ${f(mt.my)}$, $σ_u^2 = ${f(mt.vx)}$, $σ_{uw} = ${f(mt.cxy)}$<br>$b = σ_{uw}/{σ_u^2} = ${f(B)}$, &ensp; $${M.w === 'ln y' ? 'ln a' : 'a'} = w̄ − b ū = ${f(A0)}$`;
      let A = A0;
      if (M.w === 'ln y') { A = Math.exp(A0); html += ` ⇒ $a = e^{${f(A0)}} = ${f(A, 4, 0)}$`; if (A < 1e-6 && xmin > 1000) html += '<br>Con unas x tan grandes, a sale muy pequeña. Si las x son años, resta el primero a todas para que a sea el valor de y al empezar.'; }
      res.coef = { a: A, b: B }; res.rt = rt;
      if (modelo === 'exponencial') { res.pred = (x) => A * Math.exp(B * x); res.inv = (y) => (y > 0 && B ? Math.log(y / A) / B : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·e<sup>${f(B)}x</sup>`; }
      if (modelo === 'potencial') { res.pred = (x) => (x > 0 ? A * x ** B : NaN); res.inv = (y) => (y > 0 && B ? (y / A) ** (1 / B) : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·x<sup>${f(B)}</sup>`; }
      if (modelo === 'hiperbolica') { res.pred = (x) => (x ? A + B / x : NaN); res.inv = (y) => (y !== A && B ? B / (y - A) : NaN); res.ecuacion = `y = ${f(A)} ${mas(B)}/x`; }
      if (modelo === 'logaritmica') { res.pred = (x) => (x > 0 ? A + B * Math.log(x) : NaN); res.inv = (y) => (B ? Math.exp((y - A) / B) : NaN); res.ecuacion = `y = ${f(A)} ${mas(B)} ln x`; }
      html += `<br><b>${res.ecuacion}</b><br>El coeficiente de correlación de las variables transformadas es $r_{uw} = ${d4(rt)}$ (${f(100 * rt * rt, 3)} % de la variación de ${W} explicada).`;
      const g = (x) => f(x, 6), tr = pts.some((q) => q.n !== 1);
      const tabT = tabla ? { cab: ['x<sub>i</sub>', 'y<sub>i</sub>', ...(tr ? ['n<sub>i</sub>'] : []), `u<sub>i</sub> = ${Ut}`, `w<sub>i</sub> = ${Wt}`, ...(tr ? ['n<sub>i</sub>u<sub>i</sub>', 'n<sub>i</sub>w<sub>i</sub>', 'n<sub>i</sub>u<sub>i</sub><sup>2</sup>', 'n<sub>i</sub>u<sub>i</sub>w<sub>i</sub>'] : ['u<sub>i</sub><sup>2</sup>', 'u<sub>i</sub>w<sub>i</sub>'])].map((c) => c.replace(/_i/g, '<sub>i</sub>')),
        filas: pts.map((q) => [q.x, q.y, ...(tr ? [q.n] : []), gx(q.x), gy(q.y), ...(tr ? [q.n * gx(q.x), q.n * gy(q.y)] : []), q.n * gx(q.x) ** 2, q.n * gx(q.x) * gy(q.y)].map(g)),
        tot: ['', '', ...(tr ? [g(mt.N), '', '', g(mt.sx), g(mt.sy)] : [g(mt.sx), g(mt.sy)]), g(mt.sxx), g(mt.sxy)] } : null;
      pasos.push({ t: `Ajuste ${M.adj}: $${M.forma}$`, tabla: tabT, html });
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
      pasos.push({ t: 'Calidad del ajuste', html: `En las y originales, $R^2 = 1 − {∑ (y_i − ŷ_i)^2}/{∑ (y_i − ȳ)^2} = 1 − {${f(SSr)}}/{${f(SSt)}}$ = <b>${d4(res.R2)}</b>, frente a $R^2 = ${d4(rl)}$ de la recta. ${res.R2 > rl + 1e-9 ? `El ajuste ${M.adj} se adapta mejor a los datos que la recta.` : res.R2 < rl - 1e-9 ? 'La recta se adapta mejor que este ajuste: quizá el modelo no es el adecuado.' : 'Los dos se adaptan igual de bien.'}` });
    }
    if (tabla) pasos.push({ t: 'Residuos', residuos: true, html: `Residuo $e_i = y_i − ŷ_i$, la distancia vertical de cada punto a la ${modelo === 'lineal' ? 'recta' : 'curva'}. ${modelo === 'lineal' || modelo === 'parabolica' ? 'Suman 0 (con sus frecuencias).' : ''} El mayor, en valor absoluto, es ${f(Math.max(...res.residuos.map((q) => Math.abs(q.e))))}.${res.se ? ` La desviación típica de los residuos es ${f(res.se)}. ${res.atipicos.length ? `Se alejan más de 2 veces ese valor, y pueden ser atípicos (un error al medir o al copiar): ${res.atipicos.map((q) => `(${f(q.x)}, ${f(q.y)})`).join(', ')}.` : 'Ningún punto se aleja más de 2 veces ese valor: no hay puntos atípicos claros.'}` : ''}` });

    if (!sc.sinComparar) {
      const filas = Object.entries(MODELOS).map(([k, Mo]) => { try { const o = resolver({ ...sc, modelo: k, x0: '', y0: '', sinComparar: true }); return [k, Mo.nombre, o.ecuacion, o.R2]; } catch (e) { return [k, Mo.nombre, e.message, null]; } });
      const mejor = filas.filter((q) => q[3] !== null && q[0] !== 'parabolica').sort((u, v) => v[3] - u[3])[0];
      res.comparacion = filas.map(([k, n, e, R2]) => ({ modelo: k, nombre: n, ecuacion: e, R2, mejor: mejor && k === mejor[0] }));
      pasos.push({ t: 'Comparación de ajustes', tabla: { cab: ['Ajuste', 'Ecuación', 'R²'], filas: res.comparacion.map((q) => [`${q.mejor ? '★ ' : ''}${q.nombre}`, q.R2 === null ? `<small>${q.ecuacion}</small>` : q.ecuacion, q.R2 === null ? '—' : d4(q.R2)]) }, html: `${mejor ? `De los ajustes con dos parámetros, el que mejor se adapta es el <b>${mejor[1].toLowerCase()}</b> (★). ` : ''}La parábola tiene un parámetro más, así que su R² nunca es menor que el de la recta: elígela solo si lo mejora bastante o si la teoría lo pide.` });
    }

    const fiable = () => (res.R2 >= 0.81 ? 'el ajuste es bueno' : res.R2 >= 0.5 ? 'el ajuste es solo regular' : 'el ajuste es malo');
    if (x0 !== null) {
      const yp = res.pred(x0);
      if (!isFinite(yp)) throw new Error('El ajuste no está definido en ese valor de x');
      res.x0 = x0; res.yx0 = yp;
      const fuera = x0 < xmin || x0 > xmax;
      let pasoIC = null;
      if (modelo === 'lineal' && res.inc) {
        const { se, tk, Sxx, nivel: c } = res.inc, h1 = tk * se * Math.sqrt(1 / m.N + (x0 - m.mx) ** 2 / Sxx), h2 = tk * se * Math.sqrt(1 + 1 / m.N + (x0 - m.mx) ** 2 / Sxx);
        res.icMedia = [yp - h1, yp + h1]; res.icPred = [yp - h2, yp + h2];
        pasoIC = { t: `Intervalos de la estimación al ${f(100 * c)} %`, html: `Para la media de y cuando x = ${f(x0)}: $ŷ ± t s_e √(1/N + (x_0 − x̄)^2/S_{xx})$ = <b>${ic(...res.icMedia)}</b><br>Para un valor concreto de y (intervalo de predicción, más ancho): $ŷ ± t s_e √(1 + 1/N + (x_0 − x̄)^2/S_{xx})$ = <b>${ic(...res.icPred)}</b><br>Los dos se ensanchan al alejarse de x̄.` };
      }
      pasos.push({ t: `Estimación de y para x = ${f(x0)}`, html: `${res.pond ? `Con la recta ponderada: $ŷ = ${f(res.pond.a)} ${mas(res.pond.b)} · ${p(x0)}$` : modelo === 'lineal' ? `Con la recta de Y sobre X: $ŷ = ${f(a)} ${mas(b)} · ${p(x0)}$` : `$ŷ(${f(x0)})$ con ${res.ecuacion}`} = <b>${f(yp)}</b><br>${fuera ? `Ojo: x = ${f(x0)} está fuera del intervalo de los datos [${f(xmin)}, ${f(xmax)}]. Es una extrapolación y puede no ser fiable aunque ${fiable()}.` : `Está dentro del intervalo de los datos y ${fiable()} ($R^2 = ${d4(res.R2)}$), así que la estimación ${res.R2 >= 0.81 ? 'es fiable' : 'hay que tomarla con cuidado'}.`}` });
      if (pasoIC) pasos.push(pasoIC);
      if (res.pond) { const W = res.pond, sy = Math.sqrt(Math.max(0, W.sa ** 2 + x0 * x0 * W.sb ** 2 + 2 * x0 * W.cov)); res.syx0 = sy; pasos.push({ t: 'Incertidumbre de la estimación', html: `a y b salen del mismo ajuste y están correlacionadas, así que hace falta su covarianza $"cov"(a, b) = −S_x/Δ = ${f(W.cov)}$:<br>$σ_ŷ = √(σ_a^2 + x_0^2 σ_b^2 + 2 x_0 "cov"(a, b)) = ${f(sy)}$ ⇒ <b>ŷ = ${conError(yp, sy)}</b>` }); }
    }
    if (y0 !== null) {
      const xp = res.inv ? res.inv(y0) : NaN;
      if (modelo === 'parabolica') pasos.push({ t: `Estimación de x para y = ${f(y0)}`, html: 'Con una parábola, despejar x puede dar dos valores o ninguno. Para estimar x a partir de y usa el ajuste lineal (recta de X sobre Y).' });
      else if (!isFinite(xp)) throw new Error('No se puede despejar x para ese valor de y');
      else {
        res.y0 = y0; res.xy0 = xp;
        pasos.push({ t: `Estimación de x para y = ${f(y0)}`, html: `${res.pond ? 'Despejando x en la recta ponderada' : modelo === 'lineal' ? `Para estimar x se usa la recta de X sobre Y, no se despeja la de Y sobre X: $x̂ = ${f(res.xSobreY.a)} ${mas(res.xSobreY.b)} · ${p(y0)}$` : `Despejando x en ${res.ecuacion}`} = <b>${f(xp)}</b>${modelo === 'lineal' && !res.pond && Math.abs(r) < 0.999 ? ` (despejando en la otra recta saldría ${f((y0 - a) / b)}; solo coinciden si |r| = 1).` : '.'}` });
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
    { clave: 'peso-altura', nombre: 'Estatura y peso de 8 alumnos', sc: { modelo: 'lineal', datos: '160 55\n165 58\n168 64\n170 63\n172 68\n175 70\n180 77\n185 80', x0: '178', y0: '60' } },
    { clave: 'inversa', nombre: 'Precio y unidades vendidas (correlación negativa)', sc: { modelo: 'lineal', datos: '10 120\n12 110\n14 98\n16 90\n18 85\n20 71', x0: '15', y0: '' } },
    { clave: 'frecuencias', nombre: 'Tabla con frecuencias (nº de hijos y de habitaciones)', sc: { modelo: 'lineal', datos: 'x y n\n1 2 4\n2 2 2\n2 3 6\n3 3 5\n3 4 3\n4 4 4', x0: '', y0: '' } },
    { clave: 'debil', nombre: 'Datos sin apenas relación', sc: { modelo: 'lineal', datos: '1 5\n2 3\n3 6\n4 2\n5 5\n6 4\n7 3', x0: '', y0: '' } },
    { clave: 'hooke', nombre: 'Ley de Hooke: masa y alargamiento', sc: { modelo: 'lineal', datos: '# masa (g); alargamiento (cm)\n50; 2,1\n100; 4,0\n150; 6,2\n200; 7,9\n250; 10,1', x0: '120', y0: '5' } },
    { clave: 'hooke-origen', nombre: 'Ley de Hooke con la recta por el origen', sc: { modelo: 'origen', datos: '# masa (g); alargamiento (cm)\n50; 2,1\n100; 4,0\n150; 6,2\n200; 7,9\n250; 10,1', x0: '120', y0: '' } },
    { clave: 'cuasi', nombre: 'Con cuasivarianzas (dividiendo entre N − 1)', sc: { modelo: 'lineal', div: 'n1', datos: '2 15\n4 22\n5 24\n7 31\n9 37\n10 38', x0: '6', y0: '', nivel: '95' } },
    { clave: 'doble', nombre: 'Tabla de doble entrada (notas de dos asignaturas)', sc: { modelo: 'lineal', formato: 'doble', datos: '', doble: 'x\\y 4 6 8\n3 5 2 0\n5 3 8 2\n7 0 3 6\n9 0 1 4', x0: '', y0: '' } },
    { clave: 'atipico', nombre: 'Un dato mal copiado (punto atípico)', sc: { modelo: 'lineal', datos: '1 2,1\n2 3,9\n3 6,2\n4 8,1\n5 19\n6 11,8\n7 14,1\n8 15,9', x0: '', y0: '' } },
    { clave: 'bacterias', nombre: 'Crecimiento de bacterias (exponencial)', sc: { modelo: 'exponencial', datos: '0 100\n1 165\n2 270\n3 450\n4 740\n5 1220', x0: '6', y0: '' } },
    { clave: 'kepler', nombre: 'Tercera ley de Kepler (potencial)', sc: { modelo: 'potencial', datos: '# a (UA); T (años)\n0,387 0,241\n0,723 0,615\n1 1\n1,524 1,881\n5,203 11,86\n9,537 29,46', x0: '19.19', y0: '' } },
    { clave: 'sonido', nombre: 'Nivel sonoro y distancia (logarítmica)', sc: { modelo: 'logaritmica', datos: '1 90\n2 84\n4 78,2\n8 72\n16 66,1', x0: '10', y0: '' } },
    { clave: 'boyle', nombre: 'Ley de Boyle: presión y volumen (hiperbólica)', sc: { modelo: 'hiperbolica', datos: '# V (L); P (atm)\n1 24,5\n2 12,3\n3 8,1\n4 6,2\n5 4,9\n6 4,1', x0: '2.5', y0: '' } },
    { clave: 'frenada', nombre: 'Velocidad y distancia de frenado (parabólica)', sc: { modelo: 'parabolica', datos: '# km/h; m\n30 9\n50 21\n70 38\n90 58\n110 85\n130 115', x0: '100', y0: '' } },
    { clave: 'ponderado', nombre: 'Ajuste ponderado: cada y con su incertidumbre', sc: { modelo: 'lineal', formato: 'sigma', datosS: '1 2,1 0,2\n2 3,9 0,2\n3 6,2 0,3\n4 7,8 0,3\n5 10,3 0,5\n6 11,7 0,5', x0: '7', y0: '' } },
    { clave: 'dos-correlaciones', nombre: 'Intervalo de ρ y comparación con otra muestra', sc: { modelo: 'lineal', datos: '160 55\n165 58\n168 64\n170 63\n172 68\n175 70\n180 77\n185 80', x0: '', y0: '', r2c: '0,62', n2c: '40' } },
    { clave: 'notas', nombre: 'Horas de estudio y nota del examen', sc: { modelo: 'lineal', datos: '1 3\n2 4\n3 5,5\n4 6\n5 7,5\n6 8\n7 9', x0: '4.5', y0: '' } },
  ];

  return { resolver, leeDatos, leeDoble, leeSigma, ponderado, momentos, MODELOS, ejemplos, f, d4, conError };
})();

