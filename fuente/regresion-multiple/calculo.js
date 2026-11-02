/* =====================================================================
   Regresión lineal múltiple (sin DOM): Y = β₀ + β₁X₁ + ⋯ + β_pX_p por
   mínimos cuadrados. Los datos son una tabla con una columna por variable
   explicativa y la de Y la última (con una primera fila de nombres
   opcional). Se resuelven las ecuaciones normales con las variables
   centradas (no cambia las pendientes y evita errores de redondeo con
   datos como los años 2015–2024), y salen los coeficientes con su error,
   t, p-valor e intervalo, R², R² ajustado, la F global, el factor de
   inflación de la varianza (VIF) y una predicción con sus intervalos.
   Las distribuciones salen de estadistica/calculo.js; formato y lectura en
   calculadora.js; interfaz en regresion-multiple/app.js.
   ===================================================================== */
const RegresionMultiple = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, leeNum } = K, D = ES.DIST;
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const MAX_P = 6;

  // tabla de números con cabecera de nombres opcional: { nombres, filas }
  function tabla(texto) {
    const lin = String(texto ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    if (!lin.length) throw new Error('Faltan los datos: una fila por observación, con las variables X y la Y al final');
    const parte = (l) => (/[;\t]/.test(l) ? l.split(/\s*[;\t]\s*/) : l.split(/\s+/)).filter((t) => t !== '');
    let nombres = null, i0 = 0;
    const p0 = parte(lin[0]);
    if (p0.some((t) => /[a-zñáéíóú]/i.test(t.replace(/e[+-]?\d/gi, '')) )) { nombres = p0; i0 = 1; }
    const fl = lin.slice(i0).map((l, i) => {
      const tk = parte(l), v = tk.map(leeNum);
      if (v.some((x) => !isFinite(x))) throw new Error(`Fila ${i + 1}: «${l}» no son números`);
      return v;
    });
    if (!fl.length) throw new Error('Faltan las filas de datos');
    const m = fl[0].length;
    fl.forEach((r, i) => { if (r.length !== m) throw new Error(`La fila ${i + 1} tiene ${r.length} números y la primera ${m}: todas deben tener los mismos`); });
    if (m < 2) throw new Error('Hacen falta al menos dos columnas: una variable X y la Y');
    if (m - 1 > MAX_P) throw new Error(`Como mucho ${MAX_P} variables explicativas`);
    if (nombres && nombres.length !== m) throw new Error(`La fila de nombres tiene ${nombres.length} palabras y los datos ${m} columnas`);
    return { nombres, filas: fl };
  }

  // inversa por Gauss-Jordan con pivote parcial; null si es singular
  function inversa(A) {
    const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]), esc = Math.max(...A.map((r, i) => Math.abs(r[i])));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-11 * esc) return null;
      [M[c], M[p]] = [M[p], M[c]];
      const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const q = M[r][c]; if (q) for (let j = 0; j < 2 * n; j++) M[r][j] -= q * M[c][j]; }
    }
    return M.map((r) => r.slice(n));
  }

  function resolver(sc) {
    const alfa = lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 0.5, maxEx: true }), nivel = lee(sc, 'nivel', 'el nivel de confianza', { min: 50, minEx: true, max: 100, maxEx: true });
    const { nombres, filas } = tabla(sc.datos), n = filas.length, m = filas[0].length, p = m - 1;
    const nv = nombres || [...Array.from({ length: p }, (_, j) => `X${j + 1}`), 'Y'], X = filas.map((r) => r.slice(0, p)), y = filas.map((r) => r[p]);
    const gl = n - p - 1;
    if (gl < 1) throw new Error(`Con ${p} variable${p > 1 ? 's' : ''} hacen falta al menos ${p + 2} observaciones y hay ${n}`);
    const xm = Array.from({ length: p }, (_, j) => suma(X.map((r) => r[j])) / n), ym = suma(y) / n;
    const Xc = X.map((r) => r.map((v, j) => v - xm[j])), yc = y.map((v) => v - ym);
    const S = Array.from({ length: p }, (_, j) => Array.from({ length: p }, (_, k) => suma(Xc.map((r) => r[j] * r[k])))), c = Array.from({ length: p }, (_, j) => suma(Xc.map((r, i) => r[j] * yc[i])));
    if (S.some((r, j) => !(r[j] > 0))) throw new Error('Una variable explicativa es constante: no se puede estimar su coeficiente');
    const Si = inversa(S);
    if (!Si) throw new Error('Hay multicolinealidad perfecta: alguna variable explicativa es combinación lineal de las otras y los coeficientes no se pueden calcular');
    const bs = Si.map((r) => suma(r.map((v, k) => v * c[k]))), b0 = ym - suma(bs.map((v, j) => v * xm[j])), b = [b0, ...bs];
    const ajust = X.map((r) => b0 + suma(r.map((v, j) => v * bs[j]))), res = y.map((v, i) => v - ajust[i]);
    const SSE = suma(res.map((e) => e * e)), SST = suma(yc.map((e) => e * e)), SSR = SST - SSE;
    if (!(SST > 0)) throw new Error('Todos los valores de Y son iguales');
    if (SSE < 1e-12 * SST) throw new Error('Los datos se ajustan exactamente a un plano (R² = 1): sin error residual no se pueden hacer los contrastes. Prueba con datos que tengan algo de variación');
    const s2 = SSE / gl, s = Math.sqrt(s2), R2 = SSR / SST, R2aj = 1 - (SSE / gl) / (SST / (n - 1));
    const Fg = (SSR / p) / s2, PF = { d1: p, d2: gl }, pF = D.f.sf(PF, Fg), Fcrit = ES.cuantil(D.f, PF, 1 - alfa);
    // errores de los coeficientes: Var(b_j) = s² (S⁻¹)_jj; Var(b₀) = s² (1/n + x̄ᵀ S⁻¹ x̄)
    const q0 = 1 / n + suma(xm.map((a, j) => suma(xm.map((e, k) => a * Si[j][k] * e)))), se = [Math.sqrt(s2 * q0), ...bs.map((_, j) => Math.sqrt(s2 * Si[j][j]))];
    const tcrit = ES.cuantil(D.t, { nu: gl }, 1 - (1 - nivel / 100) / 2);
    const coefs = b.map((v, j) => { const t = v / se[j], pv = Math.min(1, 2 * D.t.sf({ nu: gl }, Math.abs(t))); return { nom: j ? nv[j - 1] : 'Constante', b: v, se: se[j], t, p: pv, lo: v - tcrit * se[j], hi: v + tcrit * se[j], sig: pv < alfa, vif: j ? S[j - 1][j - 1] * Si[j - 1][j - 1] : null }; });
    // predicción
    let pred = null;
    if (String(sc.x0 ?? '').trim() !== '') {
      const v = String(sc.x0).trim().split(/[\s;]+/).map(leeNum);
      if (v.length !== p || v.some((a) => !isFinite(a))) throw new Error(`Para predecir escribe los ${p} valores de ${nv.slice(0, p).join(', ')} separados por espacios`);
      const yh = b0 + suma(v.map((a, j) => a * bs[j])), d = v.map((a, j) => a - xm[j]), h = 1 / n + suma(d.map((a, j) => suma(d.map((e, k) => a * Si[j][k] * e)))), eM = tcrit * s * Math.sqrt(h), eI = tcrit * s * Math.sqrt(1 + h);
      pred = { x0: v, yh, h, eM, eI };
    }
    const nvE = nv.map((x) => x), tx = (j) => `$${'β̂'}_{${j}}$`;
    const pasos = [];
    pasos.push({ t: 'El modelo', html: `$Y = β_0 + ${bs.map((_, j) => `β_${j + 1} X_${j + 1}`).join(' + ')} + ε$, con $n = ${n}$ observaciones y $p = ${p}$ variable${p > 1 ? 's' : ''} explicativa${p > 1 ? 's' : ''} (${nv.slice(0, p).join(', ')}) para explicar ${nv[p]}.` });
    pasos.push({ t: 'Medias y sumas centradas', html: `Se centran las variables restándoles su media (no cambia las pendientes): ${xm.map((a, j) => `$x̄_{${j + 1}} = ${f(a)}$`).join(', ')}, $ȳ = ${f(ym)}$.<br>$S_{jk} = ∑ (x_{ij} − x̄_j)(x_{ik} − x̄_k)$ y $c_j = ∑ (x_{ij} − x̄_j)(y_i − ȳ)$:<br>${S.map((r, j) => r.slice(j).map((v, kk) => `$S_{${j + 1}${j + kk + 1}} = ${f(v)}$`).join(', ')).join('; ')}; ${c.map((v, j) => `$c_{${j + 1}} = ${f(v)}$`).join(', ')}.` });
    pasos.push({ t: 'Ecuaciones normales', html: `Se resuelve $S β = c$, es decir, $β̂ = S^{-1} c$:<br>${bs.map((v, j) => `$β̂_{${j + 1}} = ${f(v)}$`).join(', ')}.<br>La constante sale de que el plano pasa por las medias: $β̂_0 = ȳ − ∑ β̂_j x̄_j = ${f(b0)}$.<br><b>Plano ajustado:</b> $Ŷ = ${f(b0)} ${bs.map((v, j) => `${v < 0 ? '−' : '+'} ${f(Math.abs(v))} X_${j + 1}`).join(' ')}$.` });
    pasos.push({ t: 'Variabilidad', html: `$SC_T = ∑ (y_i − ȳ)^2 = ${f(SST)}$, $SC_R = ∑ (y_i − ŷ_i)^2 = ${f(SSE)}$ (residuos) y $SC_E = SC_T − SC_R = ${f(SSR)}$ (explicada).<br>$s^2 = {SC_R}/{n − p − 1} = {${f(SSE)}}/{${gl}} = ${f(s2)}$, $s = ${f(s)}$.` });
    pasos.push({ t: 'R² y R² ajustado', html: `$R^2 = {SC_E}/{SC_T} = ${f(R2, 4)}$: el modelo explica el ${f(100 * R2, 4)} % de la variabilidad de Y.<br>$R^2_{aj} = 1 − {SC_R/(n − p − 1)}/{SC_T/(n − 1)} = ${f(R2aj, 4)}$.` });
    pasos.push({ t: 'Contraste F global', html: `$H_0$: $β_1 = ⋯ = β_${p} = 0$ (ninguna variable explica Y). $F = {SC_E/p}/{SC_R/(n − p − 1)} = ${f(Fg)}$, con $${p}$ y $${gl}$ grados de libertad: $F_{${p}, ${gl}; ${f(1 - alfa)}} = ${f(Fcrit)}$ y $p = ${ES.prob(pF)}$. ${pF < alfa ? '<b>Se rechaza $H_0$</b>: el modelo explica algo de Y.' : '<b>No se rechaza $H_0$</b>: no hay evidencia de que el modelo explique Y.'}` });
    pasos.push({ t: 'Contraste de cada coeficiente', html: `$EE(β̂_j) = s √((S^{-1})_{jj})$ y $t_j = β̂_j/EE(β̂_j)$ con $${gl}$ grados de libertad (contrasta $β_j = 0$ con las demás variables dentro del modelo):<br>${coefs.slice(1).map((q, j) => `${tx(j + 1)}: $EE = ${f(q.se)}$, $t = ${f(q.t)}$, $p = ${ES.prob(q.p)}$${q.sig ? ' (significativo)' : ' (no significativo)'}`).join('<br>')}<br>Intervalo de confianza del ${f(nivel)} %: $β̂_j ± t_{${gl}; ${f(1 - (1 - nivel / 100) / 2)}} EE(β̂_j)$ con $t = ${f(tcrit)}$.` });
    if (pred) pasos.push({ t: 'Predicción', html: `Para $(${pred.x0.map((a) => f(a)).join(', ')})$: $ŷ = ${f(pred.yh)}$.<br>Intervalo para la <b>media</b> de Y: $ŷ ± t · s √(h) = ${f(pred.yh)} ± ${f(pred.eM)}$, es decir, (${f(pred.yh - pred.eM)}; ${f(pred.yh + pred.eM)}).<br>Intervalo para un <b>valor individual</b>: $ŷ ± t · s √(1 + h) = ${f(pred.yh)} ± ${f(pred.eI)}$, es decir, (${f(pred.yh - pred.eI)}; ${f(pred.yh + pred.eI)}), con $h = 1/n + d^T S^{-1} d = ${f(pred.h)}$.` });
    return { n, p, nv, X, y, b, coefs, ajust, res, SSE, SST, SSR, s, s2, R2, R2aj, Fg, pF, Fcrit, gl, tcrit, nivel, alfa, pred, xm, ym, pasos };
  }

  const ejemplos = [
    { clave: 'ventas', nombre: 'Ventas según publicidad y precio', sc: { alfa: '0,05', nivel: '95', x0: '6 8', datos: 'publicidad precio ventas\n1 9 14,7\n2 7 17,2\n3 10 16,4\n4 6 24,6\n5 9 23,9\n6 5 32,1\n7 8 31,3\n8 6 36,6' } },
    { clave: 'notas', nombre: 'Nota según horas de estudio, de sueño y asistencia', sc: { alfa: '0,05', nivel: '95', x0: '', datos: 'estudio sueño asistencia nota\n10 7 90 7,5\n5 6 70 4,5\n12 8 95 8,6\n3 5 60 3,2\n8 7 85 6,8\n15 6 98 9,1\n6 8 75 5,5\n9 5 80 6,6\n4 7 65 4,1\n11 6 92 8,0' } },
    { clave: 'tendencia', nombre: 'Años como variable: consumo con tendencia y temperatura', sc: { alfa: '0,05', nivel: '95', x0: '', datos: 'año temperatura consumo\n2015 14,2 100,5\n2016 14,8 101,1\n2017 14,1 104,3\n2018 15,0 104,9\n2019 15,3 107,2\n2020 14,6 108,0\n2021 15,1 111,4\n2022 15,8 112,2\n2023 15,4 115,6\n2024 16,0 116,1' } },
  ];
  return { resolver, ejemplos, tabla, MAX_P };
})();
if (typeof module !== 'undefined') module.exports = RegresionMultiple;
