/* =====================================================================
   Cartera de Markowitz y CAPM (sin DOM): de 2 a 6 activos con su rentabilidad
   esperada, su volatilidad y la matriz de correlaciones, saca la cartera de
   mínima varianza, la cartera tangente (máximo ratio de Sharpe con un activo
   sin riesgo), la cartera de menor riesgo para una rentabilidad objetivo, la
   frontera eficiente y la línea del mercado de capitales (CML); y con el CAPM
   la beta de cada activo, su rentabilidad exigida (línea del mercado de
   valores, SML) y su alfa. Formato de economia/comun.js; interfaz en
   markowitz/app.js.
     resolver(sc)  { activos, corr, rf, ventas, objetivo, mercado, grafico } →
                   { n, nombres, mu, sg, cov, mv, tg, obj, mer, beta, req, alfa, frontera, pasos, ... }
   Con ventas en corto los pesos salen de álgebra (Merton); sin ellas, de probar
   todos los subconjuntos de activos con peso positivo (n ≤ 6) y quedarse con
   el mejor que cumple w ≥ 0, que es el óptimo exacto del problema convexo.
   ===================================================================== */
const Markowitz = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee, lista, filas, pct } = K;
  const e = (x) => x.toFixed(4).replace('.', ',').replace('-', '−');
  const e6 = (x) => x.toFixed(6).replace('.', ',').replace('-', '−');
  const EPS = 1e-10;

  /* ---------- Álgebra mínima ---------- */
  // resuelve A·x = b por Gauss con pivote parcial; null si A es singular
  function resuelve(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-14) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }
  // ¿es simétrica y definida positiva? (Cholesky)
  function definidaPositiva(A) {
    const n = A.length, L = A.map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) { if (s <= 1e-12) return false; L[i][i] = Math.sqrt(s); } else L[i][j] = s / L[j][j];
    }
    return true;
  }
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const mulv = (M, v) => M.map((r) => dot(r, v));

  /* ---------- Lectura de los activos ---------- */
  // cada línea: «Nombre; rentabilidad %; volatilidad %» (o separado por espacios: el nombre es lo que sobra delante)
  function activos(texto) {
    const out = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const tk = (/[;\t]/.test(l) ? l.split(/\s*[;\t]\s*/) : l.split(/\s+/)).filter((t) => t !== '');
      if (tk.length < 3) throw new Error(`Activos, línea ${i + 1}: escribe «Nombre; rentabilidad %; volatilidad %»`);
      const mu = K.leeNum(tk[tk.length - 2]), sg = K.leeNum(tk[tk.length - 1]);
      if (!isFinite(mu) || !isFinite(sg)) throw new Error(`Activos, línea ${i + 1}: la rentabilidad y la volatilidad deben ser números (en %)`);
      if (sg <= 0) throw new Error(`Activos, línea ${i + 1}: la volatilidad debe ser mayor que 0`);
      out.push({ nombre: tk.slice(0, -2).join(' ').replace(/[$<>&]/g, '') || `Activo ${out.length + 1}`, mu: mu / 100, sg: sg / 100 });
    });
    return out;
  }

  /* ---------- Carteras ---------- */
  // todas las carteras con los datos ya leídos
  function modelo(mu, cov, rf, ventas) {
    const n = mu.length, todos = [...Array(n).keys()];
    const stats = (w) => { const v = Math.max(0, dot(w, mulv(cov, w))); return { w, mu: dot(w, mu), sg: Math.sqrt(v), v }; };
    // subconjuntos que se prueban
    const subs = ventas ? [todos] : Array.from({ length: (1 << n) - 1 }, (_, m) => todos.filter((i) => (m + 1) >> i & 1));
    const parte = (S) => {
      const C = S.map((i) => S.map((j) => cov[i][j])), m = S.map((i) => mu[i]), un = S.map(() => 1);
      const x1 = resuelve(C, un), xm = resuelve(C, m);
      if (!x1 || !xm) return null;
      const A = dot(un, x1), B = dot(un, xm), Cc = dot(m, xm);
      return { S, x1, xm, A, B, C: Cc, D: A * Cc - B * B };
    };
    const completa = (S, wS) => { const w = Array(n).fill(0); S.forEach((i, k) => { w[i] = wS[k]; }); return w; };
    const ok = (wS) => wS.every((x) => x >= -1e-9);
    const limpia = (w) => w.map((x) => (Math.abs(x) < 1e-12 ? 0 : x));
    const partes = subs.map(parte).filter(Boolean);
    const minimo = (cands) => cands.reduce((a, b) => (!a || b.v < a.v - 1e-15 ? b : a), null);

    // mínima varianza
    const mv = minimo(partes.map((p) => { const w = p.x1.map((x) => x / p.A); return ok(w) || ventas ? stats(limpia(completa(p.S, w))) : null; }).filter(Boolean));
    // rentabilidad objetivo m
    const objetivo = (m) => {
      const c = [];
      for (const p of partes) {
        if (p.S.length === 1) { if (Math.abs(mu[p.S[0]] - m) < 1e-12) c.push(stats(completa(p.S, [1]))); continue; }
        if (Math.abs(p.D) < 1e-14) continue;
        const lam = (p.C - p.B * m) / p.D, gam = (p.A * m - p.B) / p.D, w = p.x1.map((x, i) => lam * x + gam * p.xm[i]);
        if (ventas || ok(w)) c.push(stats(limpia(completa(p.S, w))));
      }
      return minimo(c);
    };
    // tangente: máximo ratio de Sharpe
    let tg = null;
    for (const p of partes) {
      const z = p.xm.map((x, i) => x - rf * p.x1[i]), s = z.reduce((a, b) => a + b, 0);
      if (!(s > EPS)) continue;
      const w = z.map((x) => x / s);
      if (!ventas && !ok(w)) continue;
      const st = stats(limpia(completa(p.S, w))), sh = (st.mu - rf) / st.sg;
      if (sh > 0 && (!tg || sh > tg.sharpe)) tg = { ...st, sharpe: sh };
    }
    return { stats, mv, objetivo, tg };
  }

  // dos activos con correlación +1 o −1: la covarianza es singular y todas las carteras están sobre una recta (σp = |w·σ1 + ρ·(1 − w)·σ2|);
  // se resuelve con la fórmula directa. Hay una cartera sin riesgo (σp = 0) salvo con ρ = 1 y σ1 = σ2.
  function modeloDos(mu, sg, r, rf, ventas) {
    const [m1, m2] = mu, [s1, s2] = sg;
    const st = (w1) => { const sgp = Math.abs(w1 * s1 + r * (1 - w1) * s2); return { w: [w1, 1 - w1], mu: w1 * m1 + (1 - w1) * m2, sg: sgp, v: sgp * sgp }; };
    const ok = (w1) => ventas || (w1 >= -1e-12 && w1 <= 1 + 1e-12);
    const objetivo = (m) => { const w1 = (m - m2) / (m1 - m2); return ok(w1) ? st(w1) : null; };
    const den = s1 - r * s2, w0 = den === 0 ? null : -r * s2 / den;
    let mv;
    if (w0 !== null && ok(w0)) mv = st(w0);
    else { const a = st(0), b = st(1); mv = a.sg < b.sg - 1e-15 ? a : b.sg < a.sg - 1e-15 ? b : (a.mu >= b.mu ? a : b); }
    let tg = null, arbitraje = false;
    if (mv.sg < 1e-12 && mv.mu > rf + 1e-12) arbitraje = true;
    else if (mv.sg < 1e-12 && ventas && mv.mu < rf - 1e-12) arbitraje = true;
    else if (!ventas) for (const w1 of [0, 1]) { const p = st(w1), sh = p.sg > 1e-12 ? (p.mu - rf) / p.sg : -Infinity; if (sh > 0 && (!tg || sh > tg.sharpe)) tg = { ...p, sharpe: sh }; }
    return { stats: (w) => { const v = sg.reduce((a, _, i) => a + sg.reduce((b, __, j) => b + w[i] * w[j] * (i === j ? 1 : r) * sg[i] * sg[j], 0), 0); return { w, mu: dot(w, mu), sg: Math.sqrt(Math.max(0, v)), v: Math.max(0, v) }; }, mv, objetivo, tg, arbitraje };
  }

  /* ---------- Resolver ---------- */
  function resolver(sc) {
    const act = activos(sc.activos), n = act.length;
    if (n < 2) throw new Error('Escribe al menos 2 activos (uno por línea)');
    if (n > 6) throw new Error('Como máximo 6 activos');
    const nombres = act.map((a) => a.nombre), mu = act.map((a) => a.mu), sg = act.map((a) => a.sg);
    if (new Set(mu.map((x) => x.toFixed(12))).size === 1) throw new Error('Los activos no pueden tener todos la misma rentabilidad esperada: no habría frontera eficiente');
    const rho = filas(sc.corr, n, 'La matriz de correlaciones');
    if (rho.length !== n) throw new Error(`La matriz de correlaciones debe tener ${n} filas y ${n} columnas (una por activo)`);
    for (let i = 0; i < n; i++) {
      if (Math.abs(rho[i][i] - 1) > 1e-9) throw new Error(`En la matriz de correlaciones, la diagonal (fila ${i + 1}) debe valer 1`);
      for (let j = 0; j < n; j++) {
        if (Math.abs(rho[i][j]) > 1 + 1e-9) throw new Error('Las correlaciones deben estar entre −1 y 1');
        if (Math.abs(rho[i][j] - rho[j][i]) > 1e-9) throw new Error(`La matriz de correlaciones debe ser simétrica (mira las posiciones ${i + 1},${j + 1} y ${j + 1},${i + 1})`);
      }
    }
    const cov = rho.map((r, i) => r.map((x, j) => x * sg[i] * sg[j]));
    const extremo = n === 2 && Math.abs(Math.abs(rho[0][1]) - 1) < 1e-9, r12 = extremo ? Math.sign(rho[0][1]) : 0;
    if (!extremo && !definidaPositiva(cov)) throw new Error('Esa matriz de correlaciones no es válida: con ella alguna cartera tendría varianza cero o negativa (por ejemplo, dos activos con correlación 1)');
    const rf = lee(sc, 'rf', 'el tipo sin riesgo', { min: -50, max: 100 }) / 100;
    const ventas = sc.ventas === 'si';
    const objPct = lee(sc, 'objetivo', 'la rentabilidad objetivo', { min: -100, max: 1000, def: NaN });
    const m0 = isNaN(objPct) ? null : objPct / 100;
    const grafico = sc.grafico === 'sml' ? 'sml' : 'frontera';
    const M = extremo ? modeloDos(mu, sg, r12, rf, ventas) : modelo(mu, cov, rf, ventas), { mv, tg } = M;
    if (!mv) throw new Error('No se ha podido calcular la cartera de mínima varianza');
    const maxMu = Math.max(...mu), minMu = Math.min(...mu);
    let obj = null;
    if (m0 !== null) {
      if (!ventas && (m0 < minMu - 1e-12 || m0 > maxMu + 1e-12)) throw new Error(`Sin ventas en corto, la rentabilidad objetivo debe estar entre ${pct(minMu)} y ${pct(maxMu)} (la del activo menos y el más rentable)`);
      obj = M.objetivo(m0);
      if (!obj) throw new Error('No se ha podido calcular la cartera para esa rentabilidad objetivo');
    }

    // mercado para el CAPM: pesos dados o la cartera tangente
    let mer = null, merTipo = null;
    const txtM = String(sc.mercado ?? '').trim();
    if (txtM) {
      const w = lista(txtM, 'los pesos de mercado');
      if (w.length !== n) throw new Error(`Los pesos de mercado deben ser ${n} (uno por activo)`);
      const s = w.reduce((a, b) => a + b, 0);
      if (Math.abs(s) < 1e-12) throw new Error('Los pesos de mercado no pueden sumar 0');
      mer = M.stats(w.map((x) => x / s)); merTipo = 'dado';
    } else if (tg) { mer = tg; merTipo = 'tangente'; }
    let beta = null, req = null, alfa = null;
    if (mer) {
      const cw = mulv(cov, mer.w);
      beta = cw.map((c) => c / mer.v);
      req = beta.map((b) => rf + b * (mer.mu - rf));
      alfa = mu.map((m, i) => m - req[i]);
    }

    // frontera eficiente: de la mínima varianza hacia arriba (y, discontinua, la rama ineficiente)
    const N = 70, hi = ventas ? Math.max(maxMu + 0.25 * (maxMu - minMu), tg ? tg.mu * 1.1 : -Infinity, mer ? mer.mu * 1.05 : -Infinity) : maxMu;
    const lo = ventas ? mv.mu - 0.5 * (hi - mv.mu) : minMu;
    const rama = (a, b) => { const out = []; for (let i = 0; i <= N; i++) { const p = M.objetivo(a + ((b - a) * i) / N); if (p) out.push([p.sg, p.mu]); } return out; };
    const frontera = { ef: rama(mv.mu, hi), ineficiente: ventas ? rama(lo, mv.mu) : rama(minMu, mv.mu) };

    /* ---------- Desarrollo ---------- */
    const pasos = [];
    if (extremo) pasos.push({ t: `Caso especial: correlación ${r12 > 0 ? '+1' : '−1'} con dos activos`, html: `Con $ρ = ${r12 > 0 ? '1' : '−1'}$ la varianza de la cartera es un cuadrado perfecto: $σ_p = |w·σ_1 ${r12 > 0 ? '+' : '−'} (1 − w)·σ_2|$ (con $w$ el peso del primer activo). Todas las carteras están sobre una recta y se resuelven directamente, sin invertir la matriz de covarianzas (que aquí es singular).<br>${mv.sg < 1e-9 ? `Existe una <b>cartera sin riesgo</b>: con $w = ${e(mv.w[0])}$ ($σ_p = 0$) rinde ${pct(mv.mu)}.` : `No hay cartera sin riesgo (los dos activos tienen la misma volatilidad y correlación 1): el menor riesgo se consigue con el activo de más rentabilidad entre los de menor σ.`}${M.arbitraje ? ` Como esa cartera sin riesgo rinde ${mv.mu > rf ? 'más' : 'menos'} que el activo sin riesgo (${pct(rf)}), habría <b>arbitraje</b> (ganar dinero sin riesgo ${mv.mu > rf ? 'pidiendo prestado a $r_f$ e invirtiendo en ella' : 'vendiéndola en corto e invirtiendo a $r_f$'}); por eso no hay cartera tangente.` : ''}` });
    const pesos = (w, S = nombres) => w.map((x, i) => `${esc(S[i])}: <b>${pct(x)}</b>`).join(' · ');
    const filaCov = (i, j) => `$σ_{${i + 1}${j + 1}} = ρ_{${i + 1}${j + 1}}·σ_${i + 1}·σ_${j + 1} = ${e(rho[i][j])}·${e(sg[i])}·${e(sg[j])} = ${e6(cov[i][j])}$`;
    pasos.push({ t: 'Matriz de covarianzas', html: `Con las volatilidades σ y las correlaciones ρ, la covarianza entre dos activos es $σ_{ij} = ρ_{ij}·σ_i·σ_j$ (y la diagonal, la varianza $σ_i^2$).<br>${filaCov(0, 1)}${n > 2 ? `<br>${filaCov(0, 2)}` : ''}<table class="tabla"><thead><tr><th>Activo</th>${nombres.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${cov.map((r, i) => `<tr><th>${esc(nombres[i])}</th>${r.map((x) => `<td>${e6(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>La rentabilidad y la varianza de una cartera con pesos $w$ son $μ_p = w^T·μ$ y $σ_p^2 = w^T·Σ·w$.` });
    const sin = ventas ? '' : ' Sin ventas en corto, se prueba con cada grupo de activos posible y se queda el mejor con todos los pesos positivos; el resto de activos queda en 0.';
    pasos.push({ t: 'Cartera de mínima varianza', html: `${ventas ? '$w = {Σ^{−1}·1}/{1^T·Σ^{−1}·1}$.' : 'Minimiza $σ_p^2$ con $Σw_i = 1$ y $w_i ≥ 0$.'}${sin}<br>Pesos: ${pesos(mv.w)}<br>$μ_{mín} = ${e(mv.mu)}$ = <b>${pct(mv.mu)}</b> y $σ_{mín} = ${e(mv.sg)}$ = <b>${pct(mv.sg)}</b>. Ninguna combinación de estos activos tiene menos riesgo.` });
    if (tg) pasos.push({ t: 'Cartera tangente', html: `Es la de mayor ratio de Sharpe $S = (μ_p − r_f)/σ_p$ con $r_f$ = ${pct(rf)}: ${ventas ? '$w ∝ Σ^{−1}·(μ − r_f·1)$, normalizada para que sume 1.' : 'el mismo criterio, con $w_i ≥ 0$.'}<br>Pesos: ${pesos(tg.w)}<br>$μ_T = ${e(tg.mu)}$ = <b>${pct(tg.mu)}</b>, $σ_T = ${e(tg.sg)}$ = <b>${pct(tg.sg)}</b> y $S = {${e(tg.mu)} − ${e(rf)}}/${e(tg.sg)} = ${e(tg.sharpe)}$.` });
    else if (M.arbitraje) pasos.push({ t: 'Cartera tangente', html: 'No existe: con correlación ±1 y una cartera sin riesgo que no rinde lo mismo que el activo sin riesgo hay arbitraje, y el ratio de Sharpe sería infinito.' });
    else if (extremo && ventas) pasos.push({ t: 'Cartera tangente', html: 'No está definida: con ventas en corto y correlación ±1 todas las carteras tienen el mismo ratio de Sharpe o crecen sin límite. Prueba sin ventas en corto.' });
    else pasos.push({ t: 'Cartera tangente', html: `No existe: ${ventas ? `el tipo sin riesgo ${pct(rf)} no es menor que la rentabilidad de la cartera de mínima varianza (${pct(mv.mu)})` : `ningún activo rinde más que el tipo sin riesgo ${pct(rf)}`}, así que invertir en el activo sin riesgo es mejor que cualquier cartera de riesgo.` });
    if (tg) pasos.push({ t: 'Línea del mercado de capitales', html: `Combinar el activo sin riesgo con la cartera tangente da la recta $μ_p = r_f + S·σ_p = ${e(rf)} + ${e(tg.sharpe)}·σ_p$. Con $α$ en la tangente y $1 − α$ en el activo sin riesgo, el riesgo es $α·σ_T$ (con α > 1 se invierte pidiendo prestado a $r_f$). Es la mejor combinación posible: siempre por encima de la frontera.` });
    if (obj) pasos.push({ t: `Cartera con rentabilidad ${pct(m0)}`, html: `${ventas ? 'Con $A = 1^TΣ^{−1}1$, $B = 1^TΣ^{−1}μ$, $C = μ^TΣ^{−1}μ$ y $D = AC − B^2$: $w = λ·Σ^{−1}1 + γ·Σ^{−1}μ$ con $λ = (C − B·m)/D$ y $γ = (A·m − B)/D$.' : 'Minimiza la varianza con la rentabilidad fijada en $m$ y $w_i ≥ 0$.'}<br>Pesos: ${pesos(obj.w)}<br>Riesgo mínimo para ese rendimiento: $σ_p = ${e(obj.sg)}$ = <b>${pct(obj.sg)}</b>${m0 < mv.mu - 1e-12 ? '. Está por debajo de la cartera de mínima varianza: es ineficiente, hay otra con más rentabilidad y el mismo riesgo.' : '.'}` });
    if (mer) {
      const filasC = nombres.map((x, i) => `<tr><th>${esc(x)}</th><td>${e(beta[i])}</td><td>${pct(req[i])}</td><td>${pct(mu[i])}</td><td>${(Math.abs(alfa[i]) < 5e-5 ? '' : alfa[i] > 0 ? '+' : '−') + pct(Math.abs(alfa[i]))}</td></tr>`).join('');
      pasos.push({ t: 'CAPM: beta, rentabilidad exigida y alfa', html: `Cartera de mercado: ${merTipo === 'dado' ? 'los pesos que has escrito (normalizados)' : 'la cartera tangente (si todos invierten con Markowitz, el mercado es la tangente)'}, con $μ_M = ${e(mer.mu)}$ y $σ_M = ${e(mer.sg)}$.<br>$β_i = σ_{iM}/σ_M^2 = (Σw)_i/σ_M^2$, la rentabilidad exigida es $μ_i^* = r_f + β_i·(μ_M − r_f)$ y $α_i = μ_i − μ_i^*$.<table class="tabla"><thead><tr><th>Activo</th><th>β</th><th>Exigida</th><th>Esperada</th><th>α</th></tr></thead><tbody>${filasC}</tbody></table>${merTipo === 'tangente' && ventas ? 'Con ventas en corto, todos los activos quedan sobre la SML (α = 0): es la propia condición de la cartera tangente.' : 'α > 0: el activo rinde más de lo que su riesgo de mercado exige (por encima de la SML); α < 0, menos.'}` });
    } else pasos.push({ t: 'CAPM', html: 'Sin cartera tangente no hay cartera de mercado por defecto. Escribe los pesos de mercado para calcular betas, rentabilidades exigidas y alfas.' });

    return { extremo, arbitraje: !!M.arbitraje, n, nombres, mu, sg, rho, cov, rf, ventas, m0, grafico, mv, tg, obj, mer, merTipo, beta, req, alfa, frontera, pasos };
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const ejemplos = [
    { clave: 'dos', nombre: 'Dos activos: acciones y bonos', sc: { activos: 'Acciones; 10; 20\nBonos; 6; 10', corr: '1 0,3\n0,3 1', rf: '2', ventas: 'no', objetivo: '8', mercado: '', grafico: 'frontera' } },
    { clave: 'tres', nombre: 'Tres activos, sin ventas en corto', sc: { activos: 'Tecnología; 12; 25\nEnergía; 8; 15\nBonos; 5; 8', corr: '1 0,4 0,2\n0,4 1 0,3\n0,2 0,3 1', rf: '3', ventas: 'no', objetivo: '8', mercado: '', grafico: 'frontera' } },
    { clave: 'corto', nombre: 'Cuatro activos con ventas en corto', sc: { activos: 'A; 14; 30\nB; 10; 20\nC; 7; 12\nD; 4; 6', corr: '1 0,5 0,3 0,1\n0,5 1 0,4 0,2\n0,3 0,4 1 0,3\n0,1 0,2 0,3 1', rf: '2', ventas: 'si', objetivo: '10', mercado: '', grafico: 'frontera' } },
    { clave: 'rho-menos-uno', nombre: 'Correlación −1: una cartera sin riesgo', sc: { activos: 'Activo X; 12; 20\nActivo Y; 6; 10', corr: '1 -1\n-1 1', rf: '2', ventas: 'no', objetivo: '9', mercado: '', grafico: 'frontera' } },
    { clave: 'rho-uno', nombre: 'Correlación +1: no hay diversificación', sc: { activos: 'Activo X; 12; 20\nActivo Y; 6; 10', corr: '1 1\n1 1', rf: '2', ventas: 'no', objetivo: '9', mercado: '', grafico: 'frontera' } },
    { clave: 'negativa', nombre: 'Correlación negativa: diversificar de verdad', sc: { activos: 'Oro; 5; 15\nBolsa; 9; 18', corr: '1 -0,5\n-0,5 1', rf: '1', ventas: 'no', objetivo: '', mercado: '', grafico: 'frontera' } },
    { clave: 'capm', nombre: 'CAPM con pesos de mercado y la SML', sc: { activos: 'Alfa SA; 11; 22\nBeta SA; 8; 14\nGamma SA; 6; 9', corr: '1 0,6 0,3\n0,6 1 0,4\n0,3 0,4 1', rf: '2,5', ventas: 'si', objetivo: '', mercado: '50 30 20', grafico: 'sml' } },
  ];

  return { resolver, ejemplos, f, modelo };
})();
if (typeof module !== 'undefined') module.exports = Markowitz;
