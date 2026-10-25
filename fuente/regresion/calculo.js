/* =====================================================================
   Regresión y correlación (sin DOM): datos bidimensionales (x, y) con
   frecuencias opcionales, medias, desviaciones típicas, covarianza,
   coeficiente de correlación de Pearson y su contraste, rectas de
   regresión de Y sobre X y de X sobre Y, ajustes exponencial, potencial,
   logarítmico y parabólico, residuos y estimaciones.
   La t de Student del contraste sale de estadistica/calculo.js.
   ===================================================================== */
const Regresion = (() => {
  const E = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  // cero: por debajo de esto se escribe 0 (ruido de redondeo); con 0, nunca (la a de y = a·e^{bx} no es 0 aunque sea muy pequeña)
  const f = (x, d = 4, cero = 1e-12) => {
    if (!isFinite(x)) return '—';
    if (x === 0 || Math.abs(x) < cero) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // r y R² con 4 decimales, como en las tablas (0,99998 no se redondea a 1)
  const d4 = (x) => (Math.abs(x) >= 1 - 5e-13 ? f(x) : x.toFixed(4).replace('.', ',').replace('-', '−'));
  // número entre paréntesis si es negativo, para sustituir en una fórmula
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  // «+ 2,5» o «− 2,5» para escribir a + bx
  const mas = (x, d) => `${x < 0 ? '−' : '+'} ${f(Math.abs(x), d)}`;
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  /* ---------- Lectura de los datos ---------- */
  // una fila por punto: «x y» o «x y n» (n = frecuencia), separados por espacios, tabuladores o «;».
  // La coma es decimal. Se ignoran las líneas vacías, las que empiezan por # y una cabecera de texto.
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

  /* ---------- Modelos ---------- */
  // cada uno se ajusta por mínimos cuadrados sobre unas variables transformadas (u, w) = (g(x), h(y))
  const MODELOS = {
    lineal: { nombre: 'Lineal', adj: 'lineal', forma: 'y = a + bx' },
    exponencial: { nombre: 'Exponencial', adj: 'exponencial', forma: 'y = a·e^{bx}', u: 'x', w: 'ln y' },
    potencial: { nombre: 'Potencial', adj: 'potencial', forma: 'y = a·x^b', u: 'ln x', w: 'ln y' },
    logaritmica: { nombre: 'Logarítmica', adj: 'logarítmico', forma: 'y = a + b ln x', u: 'ln x', w: 'y' },
    parabolica: { nombre: 'Parabólica', adj: 'parabólico', forma: 'y = a + bx + cx^2' },
  };

  // sumas y momentos con frecuencias
  function momentos(pts, gx = (x) => x, gy = (y) => y) {
    let N = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    for (const q of pts) {
      const u = gx(q.x), w = gy(q.y);
      N += q.n; sx += q.n * u; sy += q.n * w; sxx += q.n * u * u; syy += q.n * w * w; sxy += q.n * u * w;
    }
    const mx = sx / N, my = sy / N;
    // varianzas como media de los cuadrados menos el cuadrado de la media, corrigiendo el redondeo
    const vx = Math.max(0, sxx / N - mx * mx), vy = Math.max(0, syy / N - my * my), cxy = sxy / N - mx * my;
    return { N, sx, sy, sxx, syy, sxy, mx, my, vx, vy, sdx: Math.sqrt(vx), sdy: Math.sqrt(vy), cxy };
  }

  function fuerza(r) {
    const a = Math.abs(r);
    const q = a >= 0.9 ? 'muy fuerte' : a >= 0.7 ? 'fuerte' : a >= 0.5 ? 'moderada' : a >= 0.3 ? 'débil' : 'muy débil o nula';
    if (a < 0.3) return 'La correlación es muy débil o no hay relación lineal: la recta apenas sirve para estimar.';
    return `La correlación es ${q} y ${r > 0 ? 'positiva (directa): cuando x crece, y tiende a crecer' : 'negativa (inversa): cuando x crece, y tiende a bajar'}.`;
  }

  // resuelve el sistema 3×3 de las ecuaciones normales de la parábola (Cramer)
  function cramer3(A, b) {
    const det = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
    const D = det(A);
    if (!(Math.abs(D) > 1e-12 * Math.abs(A[0][0] * A[1][1] * A[2][2]))) return null;
    return [0, 1, 2].map((j) => det(A.map((fila, i) => fila.map((v, k) => (k === j ? b[i] : v)))) / D);
  }

  /* ---------- Cálculo ---------- */
  // sc: { datos (texto), modelo, x0 (estimar y), y0 (estimar x), opcionales }
  function resolver(sc) {
    const pts = leeDatos(sc.datos), modelo = MODELOS[sc.modelo] ? sc.modelo : 'lineal', M = MODELOS[modelo];
    if (pts.length < 2) throw new Error('Hacen falta al menos dos puntos');
    const x0 = vacio(sc.x0) ? null : leeNum(sc.x0), y0 = vacio(sc.y0) ? null : leeNum(sc.y0);
    if (x0 !== null && !isFinite(x0)) throw new Error('El valor de x para estimar debe ser un número');
    if (y0 !== null && !isFinite(y0)) throw new Error('El valor de y para estimar debe ser un número');
    const m = momentos(pts);
    if (m.vx === 0) throw new Error('Todos los puntos tienen la misma x: no se puede ajustar y en función de x');
    const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y), xmin = Math.min(...xs), xmax = Math.max(...xs);
    const pasos = [], tabla = pts.length <= 20;
    const S = (t) => (pts.some((q) => q.n !== 1) ? `∑ n_i ${t}` : `∑ ${t}`);

    // tabla de cálculos (la de clase): x, y, x², y², xy
    pasos.push({ t: 'Tabla de cálculos', tabla: tabla ? tablaSumas(pts, m) : null, html: `$N = ${f(m.N, 6)}$, &ensp; $${S('x_i')} = ${f(m.sx, 6)}$, &ensp; $${S('y_i')} = ${f(m.sy, 6)}$, &ensp; $${S('x_i^2')} = ${f(m.sxx, 6)}$, &ensp; $${S('y_i^2')} = ${f(m.syy, 6)}$, &ensp; $${S('x_i y_i')} = ${f(m.sxy, 6)}$` });
    pasos.push({ t: 'Medias', html: `$x̄ = {${S('x_i')}}/N = {${f(m.sx, 6)}}/${f(m.N, 6)}$ = <b>${f(m.mx)}</b>, &ensp; $ȳ = {${S('y_i')}}/N = {${f(m.sy, 6)}}/${f(m.N, 6)}$ = <b>${f(m.my)}</b>` });
    pasos.push({ t: 'Varianzas y desviaciones típicas', html: `$σ_x^2 = {${S('x_i^2')}}/N − x̄^2 = {${f(m.sxx, 6)}}/${f(m.N, 6)} − ${p(m.mx)}^2 = ${f(m.vx)}$ &ensp;⇒&ensp; $σ_x = ${f(m.sdx)}$<br>$σ_y^2 = {${S('y_i^2')}}/N − ȳ^2 = {${f(m.syy, 6)}}/${f(m.N, 6)} − ${p(m.my)}^2 = ${f(m.vy)}$ &ensp;⇒&ensp; $σ_y = ${f(m.sdy)}$${m.N > 1 ? `<br>Las cuasidesviaciones (de la muestra, dividiendo entre N − 1) son $s_x = ${f(m.sdx * Math.sqrt(m.N / (m.N - 1)))}$ y $s_y = ${f(m.sdy * Math.sqrt(m.N / (m.N - 1)))}$. El coeficiente de correlación y las rectas salen iguales con unas o con otras.` : ''}` });
    pasos.push({ t: 'Covarianza', html: `$σ_{xy} = {${S('x_i y_i')}}/N − x̄ ȳ = {${f(m.sxy, 6)}}/${f(m.N, 6)} − ${p(m.mx)} · ${p(m.my)}$ = <b>${f(m.cxy)}</b><br>${m.cxy > 0 ? 'Es positiva: la relación es directa.' : m.cxy < 0 ? 'Es negativa: la relación es inversa.' : 'Es cero: no hay relación lineal.'}` });

    const r = m.vy === 0 ? 0 : m.cxy / (m.sdx * m.sdy);
    pasos.push({ t: 'Coeficiente de correlación de Pearson', html: m.vy === 0 ? 'Todos los puntos tienen la misma y: σ<sub>y</sub> = 0, la recta es horizontal y r no está definido (se toma 0).' : `$r = σ_{xy}/{σ_x σ_y} = {${f(m.cxy)}}/{${f(m.sdx)} · ${f(m.sdy)}}$ = <b>${d4(r)}</b><br>${fuerza(r)} El coeficiente de determinación es $r^2 = ${d4(r * r)}$: la recta explica el ${f(100 * r * r, 3)} % de la variación de y.` });

    // contraste de H₀: ρ = 0 con la t de Student de N − 2 grados de libertad
    let t = null, pval = null;
    const nu = m.N - 2;
    if (nu >= 1 && m.vy > 0) {
      if (Math.abs(r) >= 1 - 1e-12) { t = Infinity; pval = 0; }
      else { t = (r * Math.sqrt(nu)) / Math.sqrt(1 - r * r); pval = E.betaI(nu / (nu + t * t), nu / 2, 0.5); }
      pasos.push({ t: '¿Es significativa la correlación?', html: `Contraste de $H_0: ρ = 0$ con $t = r √(N − 2)/√(1 − r^2)$, que sigue una t de Student con ${f(nu, 6)} grados de libertad: ${isFinite(t) ? `$t = ${d4(r)} · √${f(nu, 6)}/√(1 − ${p(r)}^2) = ${f(t)}$, p-valor bilateral = <b>${E.prob(pval)}</b>` : 'los puntos están alineados del todo, t → ∞ y p-valor = 0'}<br>${pval < 0.05 ? 'Como p &lt; 0,05, se rechaza H₀: hay correlación significativa al 5 %.' : 'Como p ≥ 0,05, no se puede rechazar H₀: con estos datos la correlación no es significativa al 5 %.'}${m.N !== pts.length ? ' (N cuenta las frecuencias.)' : ''}` });
    }

    // recta de Y sobre X (siempre) y de X sobre Y
    const b = m.cxy / m.vx, a = m.my - b * m.mx;
    const res = { modelo, pts, m, r, r2: r * r, t, pval, nu, xmin, xmax, lineal: { a, b } };
    pasos.push({ t: 'Recta de regresión de Y sobre X', html: `$y − ȳ = σ_{xy}/{σ_x^2} (x − x̄)$, con pendiente $b = σ_{xy}/{σ_x^2} = {${f(m.cxy)}}/{${f(m.vx)}} = ${f(b)}$ y ordenada $a = ȳ − b x̄ = ${f(m.my)} − ${p(b)} · ${p(m.mx)} = ${f(a)}$<br>$y = ${f(a)} ${mas(b)} x$${modelo === 'lineal' ? '' : ' (la recta, para comparar con el ajuste elegido)'}` });
    if (m.vy > 0) {
      const b2 = m.cxy / m.vy, a2 = m.mx - b2 * m.my;
      res.xSobreY = { a: a2, b: b2 };
      pasos.push({ t: 'Recta de regresión de X sobre Y', html: `Sirve para estimar x a partir de y: $x − x̄ = σ_{xy}/{σ_y^2} (y − ȳ)$ ⇒ $x = ${f(a2)} ${mas(b2)} y$<br>Las dos rectas se cortan en el centro de gravedad $(x̄, ȳ) = (${f(m.mx)}, ${f(m.my)})$; cuanto más cerca de ±1 está r, más juntas van.` });
    }

    // ajuste del modelo elegido
    if (modelo === 'lineal') {
      res.pred = (x) => a + b * x; res.inv = res.xSobreY ? (y) => res.xSobreY.a + res.xSobreY.b * y : null;
      res.ecuacion = `y = ${f(a)} ${mas(b)}x`; res.R2 = r * r;
    } else if (modelo === 'parabolica') {
      const sum = (g) => pts.reduce((s, q) => s + q.n * g(q.x, q.y), 0);
      const s1 = m.N, s2 = m.sx, s3 = m.sxx, s4 = sum((x) => x ** 3), s5 = sum((x) => x ** 4), t1 = m.sy, t2 = m.sxy, t3 = sum((x, y) => x * x * y);
      // se resuelve con u = x − x̄ (con x grandes, como años, el sistema en x queda mal condicionado) y se deshace el cambio
      const su = (k) => sum((x) => (x - m.mx) ** k), sol = new Set(xs).size >= 3 ? cramer3([[s1, 0, su(2)], [0, su(2), su(3)], [su(2), su(3), su(4)]], [t1, sum((x, y) => (x - m.mx) * y), sum((x, y) => (x - m.mx) ** 2 * y)]) : null;
      if (!sol) throw new Error('Para una parábola hacen falta al menos tres valores de x distintos');
      const C = sol[2], B = sol[1] - 2 * C * m.mx, A = sol[0] - sol[1] * m.mx + C * m.mx ** 2;
      res.pred = (x) => A + B * x + C * x * x; res.inv = null; res.coef = { a: A, b: B, c: C };
      res.ecuacion = `y = ${f(A)} ${mas(B)}x ${mas(C)}x²`;
      pasos.push({ t: 'Ecuaciones normales de la parábola', html: `Al minimizar $∑ (y_i − a − b x_i − c x_i^2)^2$ salen tres ecuaciones:<br>$${f(s1, 6)} a + ${p(s2)} b + ${p(s3)} c = ${f(t1, 6)}$<br>$${f(s2, 6)} a + ${p(s3)} b + ${p(s4)} c = ${f(t2, 6)}$<br>$${f(s3, 6)} a + ${p(s4)} b + ${p(s5)} c = ${f(t3, 6)}$<br>Resolviendo: $a = ${f(A)}$, $b = ${f(B)}$, $c = ${f(C)}$ ⇒ <b>${res.ecuacion}</b>` });
    } else {
      const gx = M.u === 'ln x' ? Math.log : (x) => x, gy = M.w === 'ln y' ? Math.log : (y) => y;
      if (M.u === 'ln x' && xmin <= 0) throw new Error(`El ajuste ${M.adj} usa ln x: todas las x deben ser positivas`);
      if (M.w === 'ln y' && Math.min(...ys) <= 0) throw new Error(`El ajuste ${M.adj} usa ln y: todas las y deben ser positivas`);
      const mt = momentos(pts, gx, gy);
      if (mt.vx === 0) throw new Error('Todos los puntos tienen la misma x');
      const B = mt.cxy / mt.vx, A0 = mt.my - B * mt.mx, rt = mt.vy === 0 ? 0 : mt.cxy / (mt.sdx * mt.sdy);
      const U = M.u === 'ln x' ? 'ln x' : 'x', W = M.w === 'ln y' ? 'ln y' : 'y', Ut = M.u === 'ln x' ? 'ln x_i' : 'x_i', Wt = M.w === 'ln y' ? 'ln y_i' : 'y_i';
      let html = `Se pasa a una recta cambiando de variable: $u = ${U}$, $w = ${W}$${M.w === 'ln y' ? (M.u === 'ln x' ? ', porque $ln y = ln a + b ln x$' : ', porque $ln y = ln a + b x$') : ', y la ecuación ya es lineal en u'}. Con los datos transformados:<br>$ū = ${f(mt.mx)}$, $w̄ = ${f(mt.my)}$, $σ_u^2 = ${f(mt.vx)}$, $σ_{uw} = ${f(mt.cxy)}$<br>$b = σ_{uw}/{σ_u^2} = ${f(B)}$, &ensp; $${M.w === 'ln y' ? 'ln a' : 'a'} = w̄ − b ū = ${f(A0)}$`;
      let A = A0;
      if (M.w === 'ln y') { A = Math.exp(A0); html += ` ⇒ $a = e^{${f(A0)}} = ${f(A, 4, 0)}$`; if (A < 1e-6 && xmin > 1000) html += '<br>Con unas x tan grandes, a sale muy pequeña. Si las x son años, resta el primero a todas para que a sea el valor de y al empezar.'; }
      res.coef = { a: A, b: B }; res.rt = rt;
      if (modelo === 'exponencial') { res.pred = (x) => A * Math.exp(B * x); res.inv = (y) => (y > 0 && B ? Math.log(y / A) / B : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·e<sup>${f(B)}x</sup>`; }
      if (modelo === 'potencial') { res.pred = (x) => (x > 0 ? A * x ** B : NaN); res.inv = (y) => (y > 0 && B ? (y / A) ** (1 / B) : NaN); res.ecuacion = `y = ${f(A, 4, 0)}·x<sup>${f(B)}</sup>`; }
      if (modelo === 'logaritmica') { res.pred = (x) => (x > 0 ? A + B * Math.log(x) : NaN); res.inv = (y) => (B ? Math.exp((y - A) / B) : NaN); res.ecuacion = `y = ${f(A)} ${mas(B)} ln x`; }
      html += `<br><b>${res.ecuacion}</b><br>El coeficiente de correlación de las variables transformadas es $r_{uw} = ${d4(rt)}$ (${f(100 * rt * rt, 3)} % de la variación de ${W} explicada).`;
      const g = (x) => f(x, 6), tr = pts.some((q) => q.n !== 1);
      const tabT = tabla ? { cab: ['x<sub>i</sub>', 'y<sub>i</sub>', ...(tr ? ['n<sub>i</sub>'] : []), `u<sub>i</sub> = ${Ut}`, `w<sub>i</sub> = ${Wt}`, ...(tr ? ['n<sub>i</sub>u<sub>i</sub>', 'n<sub>i</sub>w<sub>i</sub>', 'n<sub>i</sub>u<sub>i</sub><sup>2</sup>', 'n<sub>i</sub>u<sub>i</sub>w<sub>i</sub>'] : ['u<sub>i</sub><sup>2</sup>', 'u<sub>i</sub>w<sub>i</sub>'])].map((c) => c.replace(/_i/g, '<sub>i</sub>')),
        filas: pts.map((q) => [q.x, q.y, ...(tr ? [q.n] : []), gx(q.x), gy(q.y), ...(tr ? [q.n * gx(q.x), q.n * gy(q.y)] : []), q.n * gx(q.x) ** 2, q.n * gx(q.x) * gy(q.y)].map(g)),
        tot: ['', '', ...(tr ? [g(mt.N), '', '', g(mt.sx), g(mt.sy)] : [g(mt.sx), g(mt.sy)]), g(mt.sxx), g(mt.sxy)] } : null;
      pasos.push({ t: `Ajuste ${M.adj}: $${M.forma}$`, tabla: tabT, html });
    }

    // calidad del ajuste en las y originales
    const SSt = pts.reduce((s, q) => s + q.n * (q.y - m.my) ** 2, 0);
    const SSr = pts.reduce((s, q) => s + q.n * (q.y - res.pred(q.x)) ** 2, 0);
    res.R2 = SSt > 0 ? 1 - SSr / SSt : 1;
    res.residuos = pts.map((q) => ({ ...q, yp: res.pred(q.x), e: q.y - res.pred(q.x) }));
    if (modelo !== 'lineal') {
      const rl = 1 - pts.reduce((s, q) => s + q.n * (q.y - a - b * q.x) ** 2, 0) / (SSt || 1);
      pasos.push({ t: 'Calidad del ajuste', html: `En las y originales, $R^2 = 1 − {∑ (y_i − ŷ_i)^2}/{∑ (y_i − ȳ)^2} = 1 − {${f(SSr)}}/{${f(SSt)}}$ = <b>${d4(res.R2)}</b>, frente a $R^2 = ${d4(rl)}$ de la recta. ${res.R2 > rl + 1e-9 ? `El ajuste ${M.adj} se adapta mejor a los datos que la recta.` : res.R2 < rl - 1e-9 ? 'La recta se adapta mejor que este ajuste: quizá el modelo no es el adecuado.' : 'Los dos se adaptan igual de bien.'}` });
    }
    if (tabla) pasos.push({ t: 'Residuos', residuos: true, html: `Residuo $e_i = y_i − ŷ_i$, la distancia vertical de cada punto a la ${modelo === 'lineal' ? 'recta' : 'curva'}. ${modelo === 'lineal' || modelo === 'parabolica' ? 'Suman 0 (con sus frecuencias).' : ''} El mayor, en valor absoluto, es ${f(Math.max(...res.residuos.map((q) => Math.abs(q.e))))}.` });

    // estimaciones
    const fiable = () => (res.R2 >= 0.81 ? 'el ajuste es bueno' : res.R2 >= 0.5 ? 'el ajuste es solo regular' : 'el ajuste es malo');
    if (x0 !== null) {
      const yp = res.pred(x0);
      if (!isFinite(yp)) throw new Error('El ajuste no está definido en ese valor de x');
      res.x0 = x0; res.yx0 = yp;
      const fuera = x0 < xmin || x0 > xmax;
      pasos.push({ t: `Estimación de y para x = ${f(x0)}`, html: `${modelo === 'lineal' ? `Con la recta de Y sobre X: $ŷ = ${f(a)} ${mas(b)} · ${p(x0)}$` : `$ŷ(${f(x0)})$ con ${res.ecuacion}`} = <b>${f(yp)}</b><br>${fuera ? `Ojo: x = ${f(x0)} está fuera del intervalo de los datos [${f(xmin)}, ${f(xmax)}]. Es una extrapolación y puede no ser fiable aunque ${fiable()}.` : `Está dentro del intervalo de los datos y ${fiable()} ($R^2 = ${d4(res.R2)}$), así que la estimación ${res.R2 >= 0.81 ? 'es fiable' : 'hay que tomarla con cuidado'}.`}` });
    }
    if (y0 !== null) {
      const xp = res.inv ? res.inv(y0) : NaN;
      if (modelo === 'parabolica') pasos.push({ t: `Estimación de x para y = ${f(y0)}`, html: 'Con una parábola, despejar x puede dar dos valores o ninguno. Para estimar x a partir de y usa el ajuste lineal (recta de X sobre Y).' });
      else if (!isFinite(xp)) throw new Error('No se puede despejar x para ese valor de y');
      else {
        res.y0 = y0; res.xy0 = xp;
        pasos.push({ t: `Estimación de x para y = ${f(y0)}`, html: `${modelo === 'lineal' ? `Para estimar x se usa la recta de X sobre Y, no se despeja la de Y sobre X: $x̂ = ${f(res.xSobreY.a)} ${mas(res.xSobreY.b)} · ${p(y0)}$` : `Despejando x en ${res.ecuacion}`} = <b>${f(xp)}</b>${modelo === 'lineal' && Math.abs(r) < 0.999 ? ` (despejando en la otra recta saldría ${f((y0 - a) / b)}; solo coinciden si |r| = 1).` : '.'}` });
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
    { clave: 'notas', nombre: 'Horas de estudio y nota del examen', sc: { modelo: 'lineal', datos: '1 3\n2 4\n3 5,5\n4 6\n5 7,5\n6 8\n7 9', x0: '4.5', y0: '' } },
    { clave: 'peso-altura', nombre: 'Estatura y peso de 8 alumnos', sc: { modelo: 'lineal', datos: '160 55\n165 58\n168 64\n170 63\n172 68\n175 70\n180 77\n185 80', x0: '178', y0: '60' } },
    { clave: 'inversa', nombre: 'Precio y unidades vendidas (correlación negativa)', sc: { modelo: 'lineal', datos: '10 120\n12 110\n14 98\n16 90\n18 85\n20 71', x0: '15', y0: '' } },
    { clave: 'frecuencias', nombre: 'Tabla con frecuencias (nº de hijos y de habitaciones)', sc: { modelo: 'lineal', datos: 'x y n\n1 2 4\n2 2 2\n2 3 6\n3 3 5\n3 4 3\n4 4 4', x0: '', y0: '' } },
    { clave: 'debil', nombre: 'Datos sin apenas relación', sc: { modelo: 'lineal', datos: '1 5\n2 3\n3 6\n4 2\n5 5\n6 4\n7 3', x0: '', y0: '' } },
    { clave: 'hooke', nombre: 'Ley de Hooke: masa y alargamiento', sc: { modelo: 'lineal', datos: '# masa (g); alargamiento (cm)\n50; 2,1\n100; 4,0\n150; 6,2\n200; 7,9\n250; 10,1', x0: '120', y0: '5' } },
    { clave: 'bacterias', nombre: 'Crecimiento de bacterias (exponencial)', sc: { modelo: 'exponencial', datos: '0 100\n1 165\n2 270\n3 450\n4 740\n5 1220', x0: '6', y0: '' } },
    { clave: 'kepler', nombre: 'Tercera ley de Kepler (potencial)', sc: { modelo: 'potencial', datos: '# a (UA); T (años)\n0,387 0,241\n0,723 0,615\n1 1\n1,524 1,881\n5,203 11,86\n9,537 29,46', x0: '19.19', y0: '' } },
    { clave: 'sonido', nombre: 'Nivel sonoro y distancia (logarítmica)', sc: { modelo: 'logaritmica', datos: '1 90\n2 84\n4 78,2\n8 72\n16 66,1', x0: '10', y0: '' } },
    { clave: 'frenada', nombre: 'Velocidad y distancia de frenado (parabólica)', sc: { modelo: 'parabolica', datos: '# km/h; m\n30 9\n50 21\n70 38\n90 58\n110 85\n130 115', x0: '100', y0: '' } },
  ];

  return { resolver, leeDatos, momentos, MODELOS, ejemplos, f, d4 };
})();
if (typeof module !== 'undefined') module.exports = Regresion;
