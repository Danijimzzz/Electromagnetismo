/* =====================================================================
   Números complejos (sin DOM): lectura en forma binómica (con fracciones
   exactas, por Algebra), polar 2∠60°, trigonométrica 2(cos 60° + i sen 60°)
   y exponencial 2e^(iπ/3); paso entre las cuatro formas con el argumento
   en su cuadrante; suma, resta, producto, cociente, potencias (De Moivre),
   raíces n-ésimas y ecuaciones de segundo grado, con el desarrollo.
   ===================================================================== */
const Complejos = (() => {
  const A = typeof Algebra !== 'undefined' ? Algebra : require('../matematicas/algebra.js');
  const PI = Math.PI, GR = 180 / PI;
  const f = (x, d = 4) => A.decimal(x, d);
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  /* ---------- Complejos en coma flotante ---------- */
  const Z = (re, im = 0) => ({ re, im });
  const zs = (a, b) => Z(a.re + b.re, a.im + b.im), zr = (a, b) => Z(a.re - b.re, a.im - b.im);
  const zm = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const zd = (a, b) => { const m = b.re * b.re + b.im * b.im; if (m === 0) throw new Error('No se puede dividir entre 0'); return Z((a.re * b.re + a.im * b.im) / m, (a.im * b.re - a.re * b.im) / m); };
  const mod = (z) => Math.hypot(z.re, z.im), arg = (z) => Math.atan2(z.im, z.re);
  const pol = (r, t) => Z(r * Math.cos(t), r * Math.sin(t));
  const limpia = (z) => Z(Math.abs(z.re) < 1e-10 * Math.max(1, mod(z)) ? 0 : z.re, Math.abs(z.im) < 1e-10 * Math.max(1, mod(z)) ? 0 : z.im);
  const bin = (z, d = 4) => A.decimalC(limpia(z), d);

  /* ---------- Lectura ---------- */
  // número real con π, √, fracciones, grados y producto implícito: «√2», «2π/3», «−45°», «1,5»
  function leeReal(texto, nom) {
    const orig = String(texto ?? '').trim();
    const s = orig.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/pi/gi, 'π').replace(/º|deg|grados?/gi, '°').replace(/rad$/i, '');
    if (!s) throw new Error(`Falta ${nom}`);
    let p = 0, grados = false, conPi = false;
    const mal = () => new Error(`${nom[0].toUpperCase() + nom.slice(1)}: «${orig}» no es un número (por ejemplo 2, √3, 60° o π/3)`);
    const ve = () => s[p];
    function expr() { let v = term(); while (ve() === '+' || ve() === '-') { const o = s[p++], t = term(); v = o === '+' ? v + t : v - t; } return v; }
    function term() {
      let v = un();
      for (;;) {
        const c = ve();
        if (c === '*' || c === '/') { p++; const t = un(); v = c === '*' ? v * t : v / t; }
        else if (c === 'π' || c === '√' || c === '(' || /\d/.test(c ?? '')) v *= pot();
        else return v;
      }
    }
    function un() { if (ve() === '-') { p++; return -un(); } if (ve() === '+') { p++; return un(); } return pot(); }
    function pot() { let b = at(); if (ve() === '°') { p++; grados = true; b /= GR; } if (ve() === '^') { p++; b **= un(); } return b; }
    function at() {
      const c = ve();
      if (c === '(') { p++; const v = expr(); if (s[p++] !== ')') throw mal(); return v; }
      if (c === 'π') { p++; conPi = true; return PI; }
      if (c === '√') { p++; return Math.sqrt(at()); }
      const m = /^(\d+(?:[.,]\d*)?|[.,]\d+)/.exec(s.slice(p));
      if (!m) throw mal();
      p += m[0].length;
      return +m[0].replace(',', '.');
    }
    let v;
    try { v = expr(); } catch (e) { throw mal(); }
    if (p < s.length || !isFinite(v)) throw mal();
    return { v, grados, conPi };
  }
  // ángulo: en grados si lleva ° o si la unidad es grados y no lleva π
  function leeAngulo(texto, unidad, nom) {
    const a = leeReal(texto, nom);
    return a.grados || a.conPi || unidad === 'radianes' ? a.v : a.v / GR;
  }
  // un complejo en cualquier forma: { z (flotante), ex (exacto de Algebra o null), forma }
  function leeZ(texto, unidad, nom) {
    const orig = String(texto ?? '').trim();
    if (!orig) throw new Error(`Falta ${nom}`);
    const s = orig.replace(/[−–]/g, '-');
    let m;
    const polar = (r, t, forma) => {
      const R = leeReal(r, `el módulo de ${nom}`).v;
      if (R < 0) throw new Error(`El módulo de ${nom} no puede ser negativo`);
      return { z: pol(R, leeAngulo(t, unidad, `el argumento de ${nom}`)), ex: null, forma };
    };
    if ((m = /^(.+?)\s*(?:∠|_|\|)\s*\{?(.+?)\}?$/.exec(s))) return polar(m[1], m[2], 'polar');
    if ((m = /^(.*?)\s*\*?·?\s*\(\s*cos\s*\(?(.+?)\)?\s*\+\s*i\s*\*?·?\s*s[ei]n\s*\(?(.+?)\)?\s*\)$/i.exec(s))) {
      if (leeAngulo(m[2], unidad, 'el ángulo') !== leeAngulo(m[3], unidad, 'el ángulo')) throw new Error(`En ${nom}, el ángulo del coseno y el del seno deben ser el mismo`);
      return polar(m[1] || '1', m[2], 'trigonométrica');
    }
    if ((m = /^(.*?)\s*\*?·?\s*e\s*\^\s*[({]?(.+?)[)}]?$/.exec(s))) {
      const dentro = m[2].replace(/\s+/g, '');
      if (!/i/.test(dentro)) throw new Error(`En la forma exponencial de ${nom} el exponente lleva i: 2e^(iπ/3)`);
      const t = dentro.replace(/\*?·?i\*?·?/, '') || '1';
      const a = leeReal(t, `el argumento de ${nom}`);
      return { z: pol(leeReal(m[1] || '1', `el módulo de ${nom}`).v, a.grados || a.conPi || unidad === 'radianes' ? a.v : a.v / GR), ex: null, forma: 'exponencial' };
    }
    // binómica con raíces o π: 1 + √3i, 1 + i√3, √2/2 − (√2/2)i, π + 2i
    if (/π|√/.test(s) && !/[°º]/.test(s)) { const w = binomicaReal(s); if (w) return w; }
    if (/π|√|°|º/.test(s)) throw new Error(`«${orig}» no se entiende: escribe ${nom} como 3 − 2i, 2∠60°, 2(cos 60° + i sen 60°) o 2e^(iπ/3)`);
    let ex;
    try { ex = A.leer(s); } catch (e) { throw new Error(`«${orig}» no se entiende: escribe ${nom} como 3 − 2i, 2∠60°, 2(cos 60° + i sen 60°) o 2e^(iπ/3)`); }
    return { z: A.aFloat(ex), ex, forma: 'binómica' };
  }

  // a + bi con a y b reales escritos con √, π o fracciones; null si no tiene esa forma
  function binomicaReal(s) {
    const t = s.replace(/\s+/g, '').replace(/j/g, 'i'), terms = [];
    let dentro = 0, ini = 0;
    for (let k = 0; k < t.length; k++) {
      const c = t[k];
      if (c === '(') dentro++; else if (c === ')') dentro--;
      else if ((c === '+' || c === '-') && dentro === 0 && k > 0 && !/[*/^]/.test(t[k - 1])) { terms.push(t.slice(ini, k)); ini = k; }
    }
    terms.push(t.slice(ini));
    let re = 0, im = 0;
    try {
      for (const q of terms) {
        const n = (q.match(/i/g) || []).length;
        if (n > 1) return null;
        if (!n) { re += leeReal(q, 'la parte real').v; continue; }
        let c = q.replace(/[*·]?i[*·]?/, '');
        if (c === '' || c === '+') c = '1'; else if (c === '-') c = '-1';
        im += leeReal(c, 'la parte imaginaria').v;
      }
    } catch (e) { return null; }
    // se escribe como lo puso el alumno: 1 + √3 i
    const txt = terms.map((q, k) => { const sg = q[0] === '-' ? '−' : '+', c = q.replace(/^[+-]/, '').replace(/[*·]?i[*·]?/, (m) => (m ? ' i' : '')).trim(); return k ? ` ${sg} ${c}` : `${sg === '−' ? '−' : ''}${c}`; }).join('').replace(/^ i|\( i/g, (m) => m.replace(' ', ''));
    return { z: Z(re, im), ex: null, forma: 'binómica', txt };
  }

  /* ---------- Escritura ---------- */
  // ángulo bonito: múltiplo de π con denominador pequeño
  function piFrac(t) {
    for (const d of [1, 2, 3, 4, 6, 12, 5, 8, 10]) {
      const n = Math.round((t / PI) * d);
      if (Math.abs((t / PI) * d - n) < 1e-9) {
        if (n === 0) return '0';
        const g = (a, b) => (b ? g(b, a % b) : a), k = g(Math.abs(n), d), N = n / k, D = d / k;
        const num = `${N < 0 ? '−' : ''}${Math.abs(N) === 1 ? '' : Math.abs(N)}π`;
        return D === 1 ? num : `${num}/${D}`;
      }
    }
    return null;
  }
  const grados = (t) => `${f(t * GR, Math.abs(t * GR) >= 100 ? 5 : 4)}°`;
  const radianes = (t) => piFrac(t) ?? f(t);
  const angulo = (t, unidad) => (unidad === 'radianes' ? `${radianes(t)}${piFrac(t) ? '' : ' rad'}` : grados(t));
  // módulo exacto si las partes son racionales: 5, √13, √(13)/2…
  function moduloTxt(z, ex) {
    const r = mod(z);
    if (!ex) return f(r);
    const r2n = ex.re.n * ex.re.n * ex.im.d * ex.im.d + ex.im.n * ex.im.n * ex.re.d * ex.re.d, r2d = ex.re.d * ex.re.d * ex.im.d * ex.im.d;
    const raiz = (b) => { if (b < 0n) return null; let x = BigInt(Math.round(Math.sqrt(Number(b)))); while (x * x > b) x--; while ((x + 1n) * (x + 1n) <= b) x++; return x * x === b ? x : null; };
    const g = (a, b) => (b ? g(b, a % b) : a), k = g(r2n, r2d), N = r2n / k, D = r2d / k;
    const sn = raiz(N), sd = raiz(D);
    if (sn !== null && sd !== null) return sd === 1n ? `${sn}` : `${sn}/${sd}`;
    // saca los cuadrados de la raíz: √8 = 2√2
    const saca = (n) => { let k = 1n, m = n; for (let p = 2n; p * p <= m && p < 10000n; p++) while (m % (p * p) === 0n) { m /= p * p; k *= p; } return (k === 1n ? '' : `${k}`) + `√${m}`; };
    if (N >= 10n ** 12n || D >= 10n ** 12n) return f(r);
    if (D === 1n) return `${saca(N)} ≈ ${f(r)}`;
    if (sd !== null) return `{${saca(N)}}/${sd} ≈ ${f(r)}`;
    return `√(${N}/${D}) ≈ ${f(r)}`;
    return f(r);
  }
  const exTxt = (ex) => A.txt(ex), qT = (q) => A.txt(A.C(q));
  // entre paréntesis si tiene dos términos o es negativo, para sustituir: (3 − 2i), (−45°)
  const enPar = (s) => (/^[^+−]+$/.test(s) ? s : `(${s})`);
  const binHtml = (w) => (w.ex ? exTxt(w.ex) : w.txt ?? bin(w.z));

  // las formas de un complejo y el argumento con su cuadrante
  function formas(w, unidad, nom = 'z') {
    const z = limpia(w.z), r = mod(z), t = arg(z), { re: a, im: b } = z;
    const rT = moduloTxt(z, w.ex), rN = f(r), tT = angulo(t, unidad), tP = piFrac(t) ?? f(t);
    const x = w.ex ? qT(w.ex.re) : f(a), y = w.ex ? qT(w.ex.im) : f(b);
    // el módulo exacto si lo hay (5√2 en vez de 7,071) y el ángulo negativo entre paréntesis: cos(−53,13°)
    const rE = rT.includes('≈') ? rT.split(' ≈')[0] : rN, tA = tT.startsWith('−') ? `(${tT})` : tT;
    let argH;
    if (r === 0) argH = 'El 0 tiene módulo 0 y su argumento no está definido.';
    else if (a === 0) argH = `Está sobre el eje imaginario ${b > 0 ? 'positivo' : 'negativo'}: $θ = ${angulo(b > 0 ? PI / 2 : -PI / 2, unidad)}$`;
    else if (b === 0) argH = `Está sobre el eje real ${a > 0 ? 'positivo' : 'negativo'}: $θ = ${angulo(a > 0 ? 0 : PI, unidad)}$`;
    else {
      const base = Math.atan(b / a), cuad = a > 0 ? (b > 0 ? 'primer' : 'cuarto') : b > 0 ? 'segundo' : 'tercer';
      const corr = a > 0 ? '' : unidad === 'radianes' ? ` ${b > 0 ? '+' : '−'} π` : ` ${b > 0 ? '+' : '−'} 180°`;
      argH = `$arctg(b/a) = arctg(${enPar(y)}/${enPar(x)}) = ${angulo(base, unidad)}$. Como $a ${a > 0 ? '&gt;' : '&lt;'} 0$ y $b ${b > 0 ? '&gt;' : '&lt;'} 0$, el afijo está en el <b>${cuad} cuadrante</b>${a > 0 ? ', así que el argumento es ese' : `: hay que sumar o restar media vuelta a la calculadora, $θ = ${angulo(base, unidad)}${corr}$`} = <b>$${tT}$</b>`;
    }
    return {
      r, t, rT, tT,
      binomica: binHtml(w), polar: `${rE}_{${tT}}`, trig: rE === '1' ? `cos ${tA} + i sen ${tA}` : `${rE}(cos ${tA} + i sen ${tA})`, expo: `${rE === '1' ? '' : rE + ' '}e^{${tP === '0' ? '0' : piFrac(t) ? tP.replace('π', 'iπ') : `${tP} i`}}`,
      pasos: [
        { t: `Módulo de ${nom}`, html: `$|${nom}| = √(a^2 + b^2) = √(${enPar(x)}^2 + ${enPar(y)}^2)$ = <b>$${rT}$</b>` },
        { t: `Argumento de ${nom}`, html: argH },
      ],
    };
  }
  const OPS = {
    formas: 'Formas de un complejo', suma: 'Suma z₁ + z₂', resta: 'Resta z₁ − z₂', producto: 'Producto z₁ · z₂', cociente: 'Cociente z₁ / z₂',
    potencia: 'Potencia zⁿ (De Moivre)', raices: 'Raíces n-ésimas', ecuacion: 'Ecuación de segundo grado',
  };

  /* ---------- Cálculo ---------- */
  function resolver(sc) {
    const op = OPS[sc.op] ? sc.op : 'formas', u = sc.unidad === 'radianes' ? 'radianes' : 'grados', pasos = [];
    const res = { op, unidad: u, pasos, puntos: [] };
    const aBin = (w, nom) => { if (w.forma !== 'binómica') { pasos.push({ t: `${nom} en forma binómica`, html: `$${nom} = r cos θ + i r sen θ$ = <b>$${bin(w.z)}$</b>` }); } };
    const aPol = (w, nom) => { const F = formas(w, u, nom); pasos.push(...F.pasos.filter(() => w.forma === 'binómica')); return F; };
    if (op === 'ecuacion') return ecuacion(sc, res);
    const w1 = leeZ(sc.z1, u, op === 'formas' || op === 'potencia' || op === 'raices' ? 'z' : 'z₁');
    if (op === 'formas') {
      const F = formas(w1, u);
      if (w1.forma !== 'binómica') pasos.push({ t: 'Forma binómica', html: `$a = r cos θ$, $b = r sen θ$ ⇒ $z$ = <b>$${bin(w1.z)}$</b>` });
      pasos.push(...F.pasos);
      const zc = Z(w1.z.re, -w1.z.im), inv = mod(w1.z) ? zd(Z(1), w1.z) : null;
      pasos.push({ t: 'Las cuatro formas', html: `Binómica: $z = ${F.binomica}$<br>Polar: $z = ${F.polar}$<br>Trigonométrica: $z = ${F.trig}$<br>Exponencial: $z = ${F.expo}$` });
      pasos.push({ t: 'Conjugado, opuesto e inverso', html: `Conjugado: $z̄ = ${w1.ex ? exTxt(A.conj(w1.ex)) : bin(zc)}$ (simétrico respecto al eje real, mismo módulo y argumento cambiado de signo)<br>Opuesto: $−z = ${w1.ex ? exTxt(A.neg(w1.ex)) : bin(Z(-w1.z.re, -w1.z.im))}$${inv ? `<br>Inverso: $1/z = z̄/{|z|^2}$ = $${w1.ex ? exTxt(A.div(A.c1, w1.ex)) : bin(inv)}$, de módulo $1/{|z|} = ${f(1 / mod(w1.z))}$ y argumento $−θ$` : ''}` });
      Object.assign(res, { z: w1.z, formas: F, conj: zc, inv, ex: w1.ex });
      res.puntos = [{ z: w1.z, n: 'z', c: 1 }, { z: zc, n: 'z̄', c: 0 }];
      return res;
    }
    if (op === 'potencia' || op === 'raices') {
      const n = Number(String(sc.n ?? '').replace(',', '.'));
      if (!Number.isInteger(n) || (op === 'raices' ? n < 2 || n > 24 : Math.abs(n) > 1000)) throw new Error(op === 'raices' ? 'El índice de la raíz debe ser un entero entre 2 y 24' : 'El exponente debe ser un número entero');
      const F = aPol(w1, 'z');
      if (F.r === 0 && (op === 'raices' || n <= 0)) throw new Error(op === 'raices' ? 'Las raíces de 0 son todas 0' : 'El 0 no se puede elevar a un exponente negativo o cero');
      if (op === 'potencia') {
        const R = F.r ** n, T = F.t * n, zz = pol(R, T), ex = w1.ex ? A.potencia(w1.ex, n) : null;
        pasos.push({ t: 'Fórmula de De Moivre', html: `$z^n = (r_θ)^n = (r^n)_{nθ}$ ⇒ $z^{${n}} = (${f(F.r)}^{${n}})_{${n} · ${F.tT}}$ = $${f(R)}_{${angulo(T, u)}}$${Math.abs(T) > PI + 1e-12 ? `, que es lo mismo que $${f(R)}_{${angulo(arg(zz), u)}}$ quitando vueltas enteras` : ''}` });
        pasos.push({ t: 'En forma binómica', html: `$z^{${n}} = ${f(R)}(cos ${angulo(T, u)} + i sen ${angulo(T, u)})$ = <b>$${ex ? exTxt(ex) : bin(zz)}$</b>${ex && n >= 2 && n <= 4 && !A.esReal(w1.ex) && !A.esReal(A.mul(w1.ex, A.cI)) ? `<br>Se comprueba con el binomio de Newton y $i^2 = −1$: ${n === 2 ? '$(a + bi)^2 = a^2 − b^2 + 2abi$' : n === 3 ? '$(a + bi)^3 = a^3 − 3ab^2 + (3a^2 b − b^3)i$' : '$(a + bi)^4 = ((a + bi)^2)^2$'}.` : ''}` });
        Object.assign(res, { z: zz, ex, R, T, formas: formas({ z: zz, ex }, u, `z^{${n}}`) });
        res.puntos = [{ z: w1.z, n: 'z', c: 1 }, { z: zz, n: `z${String(n).replace(/./g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(d)])}`, c: 3 }];
        return res;
      }
      const R = F.r ** (1 / n), base = F.t;
      const raices = Array.from({ length: n }, (_, k) => { const t = (base + 2 * PI * k) / n; return { k, t, z: pol(R, t) }; });
      const vuelta = u === 'radianes' ? '2πk' : '360°k';
      pasos.push({ t: 'Fórmula de las raíces', html: `$(r_θ)^{1/n} = (r^{1/n})_{(θ + ${vuelta})/n}$, con $k = 0, 1, …, n − 1$. El módulo es $${f(F.r)}^{1/${n}}$ = <b>${f(R)}</b> y los argumentos $(${F.tT} + ${vuelta})/${n}$: se reparten cada ${angulo(2 * PI / n, u)} y forman un polígono regular de ${n} lados.` });
      pasos.push({ t: `Las ${n} raíces`, html: raices.map((q) => `$k = ${q.k}$: $w_${q.k} = ${f(R)}_{${angulo(q.t, u)}}$ = <b>$${bin(q.z)}$</b>`).join('<br>') });
      Object.assign(res, { R, raices, z: raices[0].z });
      res.puntos = [{ z: w1.z, n: 'z', c: 1 }, ...raices.map((q) => ({ z: q.z, n: `w${'₀₁₂₃₄₅₆₇₈₉'[q.k] ?? q.k}`, c: 3 }))];
      return res;
    }
    // operaciones con dos complejos
    const w2 = leeZ(sc.z2, u, 'z₂');
    let zz, ex = null;
    const x1 = w1.ex ? w1.ex : null, x2 = w2.ex ? w2.ex : null, exacto = x1 && x2;
    if (op === 'suma' || op === 'resta') {
      aBin(w1, 'z_1'); aBin(w2, 'z_2');
      const s = op === 'suma' ? 1 : -1;
      zz = op === 'suma' ? zs(w1.z, w2.z) : zr(w1.z, w2.z);
      if (exacto) ex = op === 'suma' ? A.suma(x1, x2) : A.resta(x1, x2);
      const a = exacto ? [qT(x1.re), qT(x1.im), qT(x2.re), qT(x2.im)] : [f(w1.z.re), f(w1.z.im), f(w2.z.re), f(w2.z.im)];
      pasos.push({ t: op === 'suma' ? 'Suma' : 'Resta', html: `Se ${op === 'suma' ? 'suman' : 'restan'} por separado las partes reales y las imaginarias:<br>$z_1 ${s > 0 ? '+' : '−'} z_2 = (${a[0]} ${s > 0 ? '+' : '−'} ${enPar(a[2])}) + (${a[1]} ${s > 0 ? '+' : '−'} ${enPar(a[3])})i$ = <b>$${ex ? exTxt(ex) : bin(zz)}$</b>` });
    } else if (op === 'producto') {
      zz = zm(w1.z, w2.z);
      if (exacto) {
        ex = A.mul(x1, x2);
        pasos.push({ t: 'Producto en forma binómica', html: `Se multiplica como dos binomios y se usa $i^2 = −1$: $(a + bi)(c + di) = (ac − bd) + (ad + bc)i$<br>$(${exTxt(x1)})(${exTxt(x2)})$ = <b>$${exTxt(ex)}$</b>` });
      }
      const F1 = formas(w1, u, 'z_1'), F2 = formas(w2, u, 'z_2');
      pasos.push({ t: 'Producto en forma polar', html: `Se multiplican los módulos y se suman los argumentos: $r_α · s_β = (r s)_{α + β}$<br>$${F1.polar} · ${F2.polar} = (${f(F1.r)} · ${f(F2.r)})_{${F1.tT} + ${F2.tT}}$ = $${f(F1.r * F2.r)}_{${angulo(F1.t + F2.t, u)}}$${exacto ? '' : ` = <b>$${bin(zz)}$</b>`}` });
    } else if (op === 'cociente') {
      if (mod(w2.z) === 0) throw new Error('No se puede dividir entre 0');
      zz = zd(w1.z, w2.z);
      if (exacto) {
        ex = A.div(x1, x2);
        const cj = A.conj(x2), num = A.mul(x1, cj), den = A.mul(x2, cj);
        pasos.push({ t: 'Cociente en forma binómica', html: `Se multiplican el numerador y el denominador por el conjugado del denominador, $z̄_2 = ${exTxt(cj)}$:<br>$z_1/z_2 = {(${exTxt(x1)})(${exTxt(cj)})}/{(${exTxt(x2)})(${exTxt(cj)})} = {${exTxt(num)}}/${exTxt(den)}$ = <b>$${exTxt(ex)}$</b>` });
      }
      const F1 = formas(w1, u, 'z_1'), F2 = formas(w2, u, 'z_2');
      pasos.push({ t: 'Cociente en forma polar', html: `Se dividen los módulos y se restan los argumentos: $r_α / s_β = (r/s)_{α − β}$<br>$${F1.polar} / ${F2.polar} = (${f(F1.r)}/${f(F2.r)})_{${F1.tT} − ${enPar(F2.tT)}}$ = $${f(F1.r / F2.r)}_{${angulo(F1.t - F2.t, u)}}$${exacto ? '' : ` = <b>$${bin(zz)}$</b>`}` });
    }
    const Fr = formas({ z: zz, ex }, u, 'z');
    pasos.push({ t: 'El resultado en todas sus formas', html: `$${Fr.binomica}$ = $${Fr.polar}$ = $${Fr.trig}$` });
    Object.assign(res, { z: zz, ex, formas: Fr });
    res.puntos = [{ z: w1.z, n: 'z₁', c: 1 }, { z: w2.z, n: 'z₂', c: 2 }, { z: zz, n: { suma: 'z₁ + z₂', resta: 'z₁ − z₂', producto: 'z₁ · z₂', cociente: 'z₁ / z₂' }[op], c: 3 }];
    return res;
  }

  // a z² + b z + c = 0 con coeficientes complejos
  function ecuacion(sc, res) {
    const lee = (k, nom) => { try { return A.leer(vacio(sc[k]) ? '0' : sc[k]); } catch (e) { throw new Error(`El coeficiente ${nom}: ${e.message}`); } };
    const a = lee('a', 'a'), b = lee('b', 'b'), c = lee('c', 'c'), pasos = res.pasos;
    if (A.esCero(a)) throw new Error('El coeficiente a no puede ser 0 (la ecuación no sería de segundo grado)');
    const D = A.resta(A.mul(b, b), A.mul(A.ent(4), A.mul(a, c))), Df = A.aFloat(D);
    pasos.push({ t: 'Discriminante', html: `$Δ = b^2 − 4ac = ${enPar(exTxt(b))}^2 − 4 · ${enPar(exTxt(a))} · ${enPar(exTxt(c))}$ = <b>$${exTxt(D)}$</b>` });
    // raíz cuadrada de Δ: exacta si Δ es real y un cuadrado perfecto
    let sq = null, sqT;
    const real = A.esReal(D);
    const Rq = (q) => { const r = (x) => { if (x < 0n) return null; let y = BigInt(Math.round(Math.sqrt(Number(x)))); while (y * y > x) y--; while ((y + 1n) * (y + 1n) <= x) y++; return y * y === x ? y : null; }; const n = r(q.n < 0n ? -q.n : q.n), d = r(q.d); return n !== null && d !== null ? A.Q(n, d) : null; };
    if (real) {
      const neg = D.re.n < 0n, rq = Rq(D.re);
      if (rq) { sq = A.C(neg ? A.Q(0) : rq, neg ? rq : A.Q(0)); sqT = exTxt(sq); }
      else sqT = `${neg ? 'i' : ''}√${qT(neg ? A.neg(D).re : D.re)}`;
      pasos.push({ t: 'Raíz del discriminante', html: D.re.n < 0n ? `Δ es negativo: no hay soluciones reales, pero sí dos complejas conjugadas, porque $√Δ = √(${qT(D.re)}) = i √${qT(A.neg(D).re)}$${rq ? ` = ${sqT}` : ` ≈ ${bin(Z(0, Math.sqrt(-Df.re)))}`}` : D.re.n === 0n ? 'Δ = 0: hay una raíz doble.' : `Δ es positivo: las dos soluciones son reales, $√Δ = ${sqT}${rq ? '' : ` ≈ ${f(Math.sqrt(Df.re))}`}$` });
    } else {
      const r = mod(Df), t = arg(Df), w = pol(Math.sqrt(r), t / 2);
      sqT = bin(w);
      pasos.push({ t: 'Raíz del discriminante', html: `Δ es complejo: su raíz se saca en forma polar, $√(r_θ) = (√r)_{θ/2}$ (y la otra es la opuesta): $Δ = ${f(r)}_{${grados(t)}}$ ⇒ $√Δ = ${f(Math.sqrt(r))}_{${grados(t / 2)}}$ = ${sqT}` });
    }
    const sqF = sq ? A.aFloat(sq) : real ? (Df.re < 0 ? Z(0, Math.sqrt(-Df.re)) : Z(Math.sqrt(Df.re))) : pol(Math.sqrt(mod(Df)), arg(Df) / 2);
    const af = A.aFloat(a), bf = A.aFloat(b), menosB = Z(-bf.re, -bf.im), dosA = Z(2 * af.re, 2 * af.im);
    const z1 = zd(zs(menosB, sqF), dosA), z2 = zd(zr(menosB, sqF), dosA);
    let e1 = null, e2 = null;
    if (sq) { const mb = A.neg(b), da = A.mul(A.ent(2), a); e1 = A.div(A.suma(mb, sq), da); e2 = A.div(A.resta(mb, sq), da); }
    pasos.push({ t: 'Soluciones', html: `$z = {−b ± √Δ}/{2a} = {${exTxt(A.neg(b))} ± ${enPar(sqT.replace(/ ≈.*/, ''))}}/{${exTxt(A.mul(A.ent(2), a))}}$<br>$z_1$ = <b>$${e1 ? exTxt(e1) : bin(z1)}$</b>, &ensp; $z_2$ = <b>$${e2 ? exTxt(e2) : bin(z2)}$</b>${real && D.re.n < 0n && A.esReal(a) && A.esReal(b) ? '<br>Como los coeficientes son reales, las dos soluciones son conjugadas.' : ''}` });
    pasos.push({ t: 'Comprobación', html: `La suma de las raíces es $−b/a = ${bin(zd(menosB, af))}$ y el producto $c/a = ${bin(zd(A.aFloat(c), af))}$ (fórmulas de Cardano-Vieta).` });
    Object.assign(res, { z1, z2, e1, e2, D: Df, z: z1 });
    res.puntos = [{ z: z1, n: 'z₁', c: 3 }, { z: z2, n: 'z₂', c: 3 }];
    return res;
  }

  const ejemplos = [
    { clave: 'formas', nombre: 'Formas de 3 + 4i', sc: { op: 'formas', z1: '3+4i', unidad: 'grados' } },
    { clave: 'cuadrante', nombre: 'De polar a binómica: 2∠120°', sc: { op: 'formas', z1: '2∠120°', unidad: 'grados' } },
    { clave: 'tercero', nombre: 'Argumento en el tercer cuadrante: −2 − 2i', sc: { op: 'formas', z1: '-2-2i', unidad: 'radianes' } },
    { clave: 'suma', nombre: 'Suma (3 + 2i) + (1 − 5i)', sc: { op: 'suma', z1: '3+2i', z2: '1-5i', unidad: 'grados' } },
    { clave: 'producto', nombre: 'Producto (2 + 3i)(1 − i)', sc: { op: 'producto', z1: '2+3i', z2: '1-i', unidad: 'grados' } },
    { clave: 'cociente', nombre: 'Cociente (3 + 2i)/(1 − i)', sc: { op: 'cociente', z1: '3+2i', z2: '1-i', unidad: 'grados' } },
    { clave: 'polar', nombre: 'Producto en polar: 2∠30° · 3∠60°', sc: { op: 'producto', z1: '2∠30°', z2: '3∠60°', unidad: 'grados' } },
    { clave: 'moivre', nombre: 'Potencia (1 + i)⁸ con De Moivre', sc: { op: 'potencia', z1: '1+i', n: '8', unidad: 'grados' } },
    { clave: 'raices-cubicas', nombre: 'Raíces cúbicas de −8', sc: { op: 'raices', z1: '-8', n: '3', unidad: 'grados' } },
    { clave: 'raices-unidad', nombre: 'Raíces sextas de la unidad', sc: { op: 'raices', z1: '1', n: '6', unidad: 'radianes' } },
    { clave: 'ecuacion', nombre: 'Ecuación z² − 2z + 5 = 0', sc: { op: 'ecuacion', a: '1', b: '-2', c: '5', unidad: 'grados' } },
    { clave: 'ecuacion-compleja', nombre: 'Ecuación con coeficientes complejos', sc: { op: 'ecuacion', a: '1', b: '-3i', c: '-3+i', unidad: 'grados' } },
    { clave: 'exponencial', nombre: 'De exponencial a binómica: 2e^(iπ/3)', sc: { op: 'formas', z1: '2e^(iπ/3)', unidad: 'radianes' } },
  ];

  return { resolver, leeZ, leeReal, formas, piFrac, OPS, ejemplos, mod, arg, bin, f, Z };
})();
if (typeof module !== 'undefined') module.exports = Complejos;
