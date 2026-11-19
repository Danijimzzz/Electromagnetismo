const Complejos = (() => {
  const A = typeof Algebra !== 'undefined' ? Algebra : require('../matematicas/algebra.js');
  const EX = typeof Expresion !== 'undefined' ? Expresion : typeof require !== 'undefined' ? require('../matematicas/expresion.js') : null;
  let LEIDOS = [];   // lo que se ha leído como expresión en esta resolución, para enseñar su valor
  const PI = Math.PI, GR = 180 / PI;
  const f = (x, d = 4) => A.decimal(x, d);
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  const Z = (re, im = 0) => ({ re, im });
  const zs = (a, b) => Z(a.re + b.re, a.im + b.im), zr = (a, b) => Z(a.re - b.re, a.im - b.im);
  const zm = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const zd = (a, b) => { const m = b.re * b.re + b.im * b.im; if (m === 0) throw new Error('Man kann nicht durch 0 dividieren'); return Z((a.re * b.re + a.im * b.im) / m, (a.im * b.re - a.re * b.im) / m); };
  const mod = (z) => Math.hypot(z.re, z.im), arg = (z) => Math.atan2(z.im, z.re);
  const pol = (r, t) => Z(r * Math.cos(t), r * Math.sin(t));
  const limpia = (z) => Z(Math.abs(z.re) < 1e-10 * Math.max(1, mod(z)) ? 0 : z.re, Math.abs(z.im) < 1e-10 * Math.max(1, mod(z)) ? 0 : z.im);
  const bin = (z, d = 4) => A.decimalC(limpia(z), d);

  function leeReal(texto, nom) {
    const orig = String(texto ?? '').trim();
    const s = orig.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/pi/gi, 'π').replace(/º|deg|grados?/gi, '°').replace(/rad$/i, '');
    if (!s) throw new Error(`Es fehlt ${nom}`);
    let p = 0, grados = false, conPi = false;
    const mal = () => new Error(`${nom[0].toUpperCase() + nom.slice(1)}: «${orig}» ist keine Zahl (zum Beispiel 2, √3, 60° oder π/3)`);
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
  function leeAngulo(texto, unidad, nom) {
    const a = leeReal(texto, nom);
    return a.grados || a.conPi || unidad === 'radianes' ? a.v : a.v / GR;
  }
  function leeZ(texto, unidad, nom) {
    const orig = String(texto ?? '').trim();
    if (!orig) throw new Error(`Es fehlt ${nom}`);
    let primero;
    try { return leeZ0(orig.replace(/sqrt\s*\(?(\d+(?:[.,]\d+)?)\)?(?![\d(])/g, '√$1'), unidad, nom); } catch (e) { primero = e; }
    if (!EX || /[∠°º|_]/.test(orig)) throw primero;
    let w;
    try { w = EX.complejo(orig.replace(/[−–]/g, '-').replace(/[·×]/g, '*'), nom); } catch (e) { throw primero; }
    const q = (t) => { const fr = EX.fraccion(t, 10000); return fr && Math.abs(fr[0] / fr[1] - t) < 1e-12 ? fr : null; }, a = q(w.z.re), b = q(w.z.im);
    const ex = a && b ? A.leer(`${a[0]}/${a[1]}${b[0] < 0 ? '-' : '+'}${Math.abs(b[0])}/${b[1]}i`) : null;
    const r = { z: ex ? A.aFloat(ex) : Z(w.z.re, w.z.im), ex, forma: 'kartesisch', leido: orig };
    LEIDOS.push({ nom, orig, w: r });
    return r;
  }
  function leeZ0(texto, unidad, nom) {
    const orig = String(texto ?? '').trim();
    if (!orig) throw new Error(`Es fehlt ${nom}`);
    const s = orig.replace(/[−–]/g, '-');
    let m;
    const polar = (r, t, forma) => {
      const R = leeReal(r, `der Betrag von ${nom}`).v;
      if (R < 0) throw new Error(`Der Betrag von ${nom} darf nicht negativ sein`);
      return { z: pol(R, leeAngulo(t, unidad, `das Argument von ${nom}`)), ex: null, forma };
    };
    if ((m = /^(.+?)\s*(?:∠|_|\|)\s*\{?(.+?)\}?$/.exec(s))) return polar(m[1], m[2], 'polar');
    if ((m = /^(.*?)\s*\*?·?\s*\(\s*cos\s*\(?(.+?)\)?\s*\+\s*i\s*\*?·?\s*s[ei]n\s*\(?(.+?)\)?\s*\)$/i.exec(s))) {
      if (leeAngulo(m[2], unidad, 'der Winkel') !== leeAngulo(m[3], unidad, 'der Winkel')) throw new Error(`Bei ${nom} müssen der Winkel des Kosinus und der des Sinus gleich sein`);
      return polar(m[1] || '1', m[2], 'trigonometrisch');
    }
    if ((m = /^(.*?)\s*\*?·?\s*e\s*\^\s*[({]?(.+?)[)}]?$/.exec(s))) {
      const dentro = m[2].replace(/\s+/g, '');
      if (!/i/.test(dentro)) throw new Error(`In der Exponentialform von ${nom} enthält der Exponent i: 2e^(iπ/3)`);
      const t = dentro.replace(/\*?·?i\*?·?/, '') || '1';
      const a = leeReal(t, `das Argument von ${nom}`);
      return { z: pol(leeReal(m[1] || '1', `der Betrag von ${nom}`).v, a.grados || a.conPi || unidad === 'radianes' ? a.v : a.v / GR), ex: null, forma: 'exponencial' };
    }
    if (/π|√/.test(s) && !/[°º]/.test(s)) { const w = binomicaReal(s); if (w) return w; }
    if (/π|√|°|º/.test(s)) throw new Error(`«${orig}» wird nicht verstanden: Schreibe ${nom} als 3 − 2i, 2∠60°, 2(cos 60° + i sin 60°) oder 2e^(iπ/3)`);
    let ex;
    try { ex = A.leer(s); } catch (e) { throw new Error(`«${orig}» wird nicht verstanden: Schreibe ${nom} als 3 − 2i, 2∠60°, 2(cos 60° + i sin 60°) oder 2e^(iπ/3)`); }
    return { z: A.aFloat(ex), ex, forma: 'kartesisch' };
  }

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
        if (!n) { re += leeReal(q, 'der Realteil').v; continue; }
        let c = q.replace(/[*·]?i[*·]?/, '');
        if (c === '' || c === '+') c = '1'; else if (c === '-') c = '-1';
        im += leeReal(c, 'der Imaginärteil').v;
      }
    } catch (e) { return null; }
    const txt = terms.map((q, k) => { const sg = q[0] === '-' ? '−' : '+', c = q.replace(/^[+-]/, '').replace(/[*·]?i[*·]?/, (m) => (m ? ' i' : '')).trim(); return k ? ` ${sg} ${c}` : `${sg === '−' ? '−' : ''}${c}`; }).join('').replace(/^ i|\( i/g, (m) => m.replace(' ', ''));
    return { z: Z(re, im), ex: null, forma: 'kartesisch', txt };
  }

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
  function moduloTxt(z, ex) {
    const r = mod(z);
    if (!ex) return f(r);
    const r2n = ex.re.n * ex.re.n * ex.im.d * ex.im.d + ex.im.n * ex.im.n * ex.re.d * ex.re.d, r2d = ex.re.d * ex.re.d * ex.im.d * ex.im.d;
    const raiz = (b) => { if (b < 0n) return null; let x = BigInt(Math.round(Math.sqrt(Number(b)))); while (x * x > b) x--; while ((x + 1n) * (x + 1n) <= b) x++; return x * x === b ? x : null; };
    const g = (a, b) => (b ? g(b, a % b) : a), k = g(r2n, r2d), N = r2n / k, D = r2d / k;
    const sn = raiz(N), sd = raiz(D);
    if (sn !== null && sd !== null) return sd === 1n ? `${sn}` : `${sn}/${sd}`;
    const saca = (n) => { let k = 1n, m = n; for (let p = 2n; p * p <= m && p < 10000n; p++) while (m % (p * p) === 0n) { m /= p * p; k *= p; } return (k === 1n ? '' : `${k}`) + `√${m}`; };
    if (N >= 10n ** 12n || D >= 10n ** 12n) return f(r);
    if (D === 1n) return `${saca(N)} ≈ ${f(r)}`;
    if (sd !== null) return `{${saca(N)}}/${sd} ≈ ${f(r)}`;
    return `√(${N}/${D}) ≈ ${f(r)}`;
    return f(r);
  }
  const exTxt = (ex) => A.txt(ex), qT = (q) => A.txt(A.C(q));
  const enPar = (s) => (/^[^+−]+$/.test(s) ? s : `(${s})`);
  const binHtml = (w) => (w.ex ? exTxt(w.ex) : w.txt ?? bin(w.z));

  function formas(w, unidad, nom = 'z') {
    const z = limpia(w.z), r = mod(z), t = arg(z), { re: a, im: b } = z;
    const rT = moduloTxt(z, w.ex), rN = f(r), tT = angulo(t, unidad), tP = piFrac(t) ?? f(t);
    const x = w.ex ? qT(w.ex.re) : f(a), y = w.ex ? qT(w.ex.im) : f(b);
    const rE = rT.includes('≈') ? rT.split(' ≈')[0] : rN, tA = tT.startsWith('−') ? `(${tT})` : tT;
    let argH;
    if (r === 0) argH = 'Die 0 hat den Betrag 0, und ihr Argument ist nicht definiert.';
    else if (a === 0) argH = `Sie liegt auf der ${b > 0 ? 'positiven' : 'negativen'} imaginären Achse: $θ = ${angulo(b > 0 ? PI / 2 : -PI / 2, unidad)}$`;
    else if (b === 0) argH = `Sie liegt auf der ${a > 0 ? 'positiven' : 'negativen'} reellen Achse: $θ = ${angulo(a > 0 ? 0 : PI, unidad)}$`;
    else {
      const base = Math.atan(b / a), cuad = a > 0 ? (b > 0 ? 'ersten' : 'vierten') : b > 0 ? 'zweiten' : 'dritten';
      const corr = a > 0 ? '' : unidad === 'radianes' ? ` ${b > 0 ? '+' : '−'} π` : ` ${b > 0 ? '+' : '−'} 180°`;
      argH = `$arctan(b/a) = arctan(${enPar(y)}/${enPar(x)}) = ${angulo(base, unidad)}$. Da $a ${a > 0 ? '&gt;' : '&lt;'} 0$ und $b ${b > 0 ? '&gt;' : '&lt;'} 0$, liegt der Bildpunkt im <b>${cuad} Quadranten</b>${a > 0 ? ', also ist das Argument dieser Wert' : `: Man muss einen halben Umlauf zum Taschenrechnerwert addieren oder subtrahieren, $θ = ${angulo(base, unidad)}${corr}$`} = <b>$${tT}$</b>`;
    }
    return {
      r, t, rT, tT,
      binomica: binHtml(w), polar: `${rE}_{${tT}}`, trig: rE === '1' ? `cos ${tA} + i sin ${tA}` : `${rE}(cos ${tA} + i sin ${tA})`, expo: `${rE === '1' ? '' : rE + ' '}e^{${tP === '0' ? '0' : piFrac(t) ? tP.replace('π', 'iπ') : `${tP} i`}}`,
      pasos: [
        { t: `Betrag von ${nom}`, html: `$|${nom}| = √(a^2 + b^2) = √(${enPar(x)}^2 + ${enPar(y)}^2)$ = <b>$${rT}$</b>` },
        { t: `Argument von ${nom}`, html: argH },
      ],
    };
  }
  const OPS = {
    formas: 'Formen einer komplexen Zahl', suma: 'Summe z₁ + z₂', resta: 'Differenz z₁ − z₂', producto: 'Produkt z₁ · z₂', cociente: 'Quotient z₁ / z₂',
    potencia: 'Potenz zⁿ (De Moivre)', raices: 'n-te Wurzeln (zⁿ = w)', ecuacion: 'Quadratische Gleichung',
    polinomio: 'Polynomgleichung (Grad 3 oder höher)', logaritmo: 'Logarithmus ln z', exponencial: 'Exponentialfunktion e^z', potenciaC: 'Potenz z^w (komplexer Exponent)',
    region: 'Gebiet der Ebene',
  };

  function resolver(sc) {
    LEIDOS = [];
    const r = resolver0(sc), escapa = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    if (LEIDOS.length && r.pasos) { r.pasos.unshift({ t: 'Gelesener Wert', html: `${LEIDOS.map((q) => `${q.nom} = «${escapa(q.orig)}» wird berechnet und ergibt <b>$${binHtml(q.w)}$</b>${q.w.ex ? '' : ' (gerundet)'}`).join('<br>')}<br>Wurzeln und Logarithmen werden in ihrem Hauptwert genommen.` }); r.leidos = LEIDOS.map((q) => ({ nom: q.nom, z: q.w.z, exacto: !!q.w.ex })); }
    return r;
  }
  function resolver0(sc) {
    const op = OPS[sc.op] ? sc.op : 'formas', u = sc.unidad === 'radianes' ? 'radianes' : 'grados', pasos = [];
    const res = { op, unidad: u, pasos, puntos: [] };
    const aBin = (w, nom) => { if (w.forma !== 'kartesisch') { pasos.push({ t: `${nom} in kartesischer Form`, html: `$${nom} = r cos θ + i r sen θ$ = <b>$${bin(w.z)}$</b>` }); } };
    const aPol = (w, nom) => { const F = formas(w, u, nom); pasos.push(...F.pasos.filter(() => w.forma === 'kartesisch')); return F; };
    if (op === 'ecuacion') return ecuacion(sc, res);
    if (op === 'polinomio') return polinomio(sc, res);
    if (op === 'region') return region(sc, res);
    if (op === 'logaritmo' || op === 'exponencial' || op === 'potenciaC') return trascendente(op, sc, res);
    const w1 = leeZ(sc.z1, u, op === 'formas' || op === 'potencia' || op === 'raices' ? 'z' : 'z₁');
    if (op === 'formas') {
      const F = formas(w1, u);
      if (w1.forma !== 'kartesisch') pasos.push({ t: 'Kartesische Form', html: `$a = r cos θ$, $b = r sen θ$ ⇒ $z$ = <b>$${bin(w1.z)}$</b>` });
      pasos.push(...F.pasos);
      const zc = Z(w1.z.re, -w1.z.im), inv = mod(w1.z) ? zd(Z(1), w1.z) : null;
      pasos.push({ t: 'Die vier Formen', html: `Kartesisch: $z = ${F.binomica}$<br>Polar: $z = ${F.polar}$<br>Trigonometrisch: $z = ${F.trig}$<br>Exponentiell: $z = ${F.expo}$` });
      pasos.push({ t: 'Konjugierte, Gegenzahl und Kehrwert', html: `Konjugierte: $z̄ = ${w1.ex ? exTxt(A.conj(w1.ex)) : bin(zc)}$ (symmetrisch zur reellen Achse, gleicher Betrag und Argument mit umgekehrtem Vorzeichen)<br>Gegenzahl: $−z = ${w1.ex ? exTxt(A.neg(w1.ex)) : bin(Z(-w1.z.re, -w1.z.im))}$${inv ? `<br>Kehrwert: $1/z = z̄/{|z|^2}$ = $${w1.ex ? exTxt(A.div(A.c1, w1.ex)) : bin(inv)}$, vom Betrag $1/{|z|} = ${f(1 / mod(w1.z))}$ und Argument $−θ$` : ''}` });
      Object.assign(res, { z: w1.z, formas: F, conj: zc, inv, ex: w1.ex });
      res.puntos = [{ z: w1.z, n: 'z', c: 1 }, { z: zc, n: 'z̄', c: 0 }];
      return res;
    }
    if (op === 'potencia' || op === 'raices') {
      const n = Number(String(sc.n ?? '').replace(',', '.'));
      if (!Number.isInteger(n) || (op === 'raices' ? n < 2 || n > 24 : Math.abs(n) > 1000)) throw new Error(op === 'raices' ? 'Der Wurzelexponent muss eine ganze Zahl zwischen 2 und 24 sein' : 'Der Exponent muss eine ganze Zahl sein');
      const F = aPol(w1, 'z');
      if (F.r === 0 && (op === 'raices' || n <= 0)) throw new Error(op === 'raices' ? 'Die Wurzeln von 0 sind alle 0' : '0 kann nicht mit einem negativen oder verschwindenden Exponenten potenziert werden');
      if (op === 'potencia') {
        const R = F.r ** n, T = F.t * n, zz = pol(R, T), ex = w1.ex ? A.potencia(w1.ex, n) : null;
        pasos.push({ t: 'Formel von De Moivre', html: `$z^n = (r_θ)^n = (r^n)_{nθ}$ ⇒ $z^{${n}} = (${f(F.r)}^{${n}})_{${n} · ${F.tT}}$ = $${f(R)}_{${angulo(T, u)}}$${Math.abs(T) > PI + 1e-12 ? `, was dasselbe ist wie $${f(R)}_{${angulo(arg(zz), u)}}$ nach Abzug ganzer Umläufe` : ''}` });
        pasos.push({ t: 'In kartesischer Form', html: `$z^{${n}} = ${f(R)}(cos ${angulo(T, u)} + i sen ${angulo(T, u)})$ = <b>$${ex ? exTxt(ex) : bin(zz)}$</b>${ex && n >= 2 && n <= 4 && !A.esReal(w1.ex) && !A.esReal(A.mul(w1.ex, A.cI)) ? `<br>Man prüft es mit dem binomischen Lehrsatz und $i^2 = −1$: ${n === 2 ? '$(a + bi)^2 = a^2 − b^2 + 2abi$' : n === 3 ? '$(a + bi)^3 = a^3 − 3ab^2 + (3a^2 b − b^3)i$' : '$(a + bi)^4 = ((a + bi)^2)^2$'}.` : ''}` });
        Object.assign(res, { z: zz, ex, R, T, formas: formas({ z: zz, ex }, u, `z^{${n}}`) });
        res.puntos = [{ z: w1.z, n: 'z', c: 1 }, { z: zz, n: `z${String(n).replace(/./g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(d)])}`, c: 3 }];
        return res;
      }
      const R = F.r ** (1 / n), base = F.t;
      const raices = Array.from({ length: n }, (_, k) => { const t = (base + 2 * PI * k) / n; return { k, t, z: pol(R, t) }; });
      const vuelta = u === 'radianes' ? '2πk' : '360°k';
      pasos.push({ t: 'Wurzelformel', html: `$(r_θ)^{1/n} = (r^{1/n})_{(θ + ${vuelta})/n}$, mit $k = 0, 1, …, n − 1$. Der Betrag ist $${f(F.r)}^{1/${n}}$ = <b>${f(R)}</b> und die Argumente $(${F.tT} + ${vuelta})/${n}$: Sie sind im Abstand von ${angulo(2 * PI / n, u)} verteilt und bilden ein regelmäßiges ${n}-Eck.` });
      pasos.push({ t: `Die ${n} Wurzeln`, html: raices.map((q) => `$k = ${q.k}$: $w_${q.k} = ${f(R)}_{${angulo(q.t, u)}}$ = <b>$${bin(q.z)}$</b>`).join('<br>') });
      Object.assign(res, { R, raices, z: raices[0].z });
      res.puntos = [{ z: w1.z, n: 'z', c: 1 }, ...raices.map((q) => ({ z: q.z, n: `w${'₀₁₂₃₄₅₆₇₈₉'[q.k] ?? q.k}`, c: 3 }))];
      return res;
    }
    const w2 = leeZ(sc.z2, u, 'z₂');
    let zz, ex = null;
    const x1 = w1.ex ? w1.ex : null, x2 = w2.ex ? w2.ex : null, exacto = x1 && x2;
    if (op === 'suma' || op === 'resta') {
      aBin(w1, 'z_1'); aBin(w2, 'z_2');
      const s = op === 'suma' ? 1 : -1;
      zz = op === 'suma' ? zs(w1.z, w2.z) : zr(w1.z, w2.z);
      if (exacto) ex = op === 'suma' ? A.suma(x1, x2) : A.resta(x1, x2);
      const a = exacto ? [qT(x1.re), qT(x1.im), qT(x2.re), qT(x2.im)] : [f(w1.z.re), f(w1.z.im), f(w2.z.re), f(w2.z.im)];
      pasos.push({ t: op === 'suma' ? 'Summe' : 'Differenz', html: `Man ${op === 'suma' ? 'addiert' : 'subtrahiert'} die Real- und die Imaginärteile getrennt:<br>$z_1 ${s > 0 ? '+' : '−'} z_2 = (${a[0]} ${s > 0 ? '+' : '−'} ${enPar(a[2])}) + (${a[1]} ${s > 0 ? '+' : '−'} ${enPar(a[3])})i$ = <b>$${ex ? exTxt(ex) : bin(zz)}$</b>` });
    } else if (op === 'producto') {
      zz = zm(w1.z, w2.z);
      if (exacto) {
        ex = A.mul(x1, x2);
        pasos.push({ t: 'Produkt in kartesischer Form', html: `Man multipliziert wie zwei Binome und verwendet $i^2 = −1$: $(a + bi)(c + di) = (ac − bd) + (ad + bc)i$<br>$(${exTxt(x1)})(${exTxt(x2)})$ = <b>$${exTxt(ex)}$</b>` });
      }
      const F1 = formas(w1, u, 'z_1'), F2 = formas(w2, u, 'z_2');
      pasos.push({ t: 'Produkt in Polarform', html: `Man multipliziert die Beträge und addiert die Argumente: $r_α · s_β = (r s)_{α + β}$<br>$${F1.polar} · ${F2.polar} = (${f(F1.r)} · ${f(F2.r)})_{${F1.tT} + ${F2.tT}}$ = $${f(F1.r * F2.r)}_{${angulo(F1.t + F2.t, u)}}$${exacto ? '' : ` = <b>$${bin(zz)}$</b>`}` });
    } else if (op === 'cociente') {
      if (mod(w2.z) === 0) throw new Error('Man kann nicht durch 0 dividieren');
      zz = zd(w1.z, w2.z);
      if (exacto) {
        ex = A.div(x1, x2);
        const cj = A.conj(x2), num = A.mul(x1, cj), den = A.mul(x2, cj);
        pasos.push({ t: 'Quotient in kartesischer Form', html: `Man multipliziert Zähler und Nenner mit der konjugiert komplexen Zahl des Nenners, $z̄_2 = ${exTxt(cj)}$:<br>$z_1/z_2 = {(${exTxt(x1)})(${exTxt(cj)})}/{(${exTxt(x2)})(${exTxt(cj)})} = {${exTxt(num)}}/${exTxt(den)}$ = <b>$${exTxt(ex)}$</b>` });
      }
      const F1 = formas(w1, u, 'z_1'), F2 = formas(w2, u, 'z_2');
      pasos.push({ t: 'Quotient in Polarform', html: `Man dividiert die Beträge und subtrahiert die Argumente: $r_α / s_β = (r/s)_{α − β}$<br>$${F1.polar} / ${F2.polar} = (${f(F1.r)}/${f(F2.r)})_{${F1.tT} − ${enPar(F2.tT)}}$ = $${f(F1.r / F2.r)}_{${angulo(F1.t - F2.t, u)}}$${exacto ? '' : ` = <b>$${bin(zz)}$</b>`}` });
    }
    const Fr = formas({ z: zz, ex }, u, 'z');
    pasos.push({ t: 'Das Ergebnis in allen Formen', html: `$${Fr.binomica}$ = $${Fr.polar}$ = $${Fr.trig}$` });
    Object.assign(res, { z: zz, ex, formas: Fr });
    res.puntos = [{ z: w1.z, n: 'z₁', c: 1 }, { z: w2.z, n: 'z₂', c: 2 }, { z: zz, n: { suma: 'z₁ + z₂', resta: 'z₁ − z₂', producto: 'z₁ · z₂', cociente: 'z₁ / z₂' }[op], c: 3 }];
    return res;
  }

  function ecuacion(sc, res) {
    const lee = (k, nom) => { try { return A.leer(vacio(sc[k]) ? '0' : sc[k]); } catch (e) { throw new Error(`Der Koeffizient ${nom}: ${e.message}`); } };
    const a = lee('a', 'a'), b = lee('b', 'b'), c = lee('c', 'c'), pasos = res.pasos;
    if (A.esCero(a)) throw new Error('Der Koeffizient a darf nicht 0 sein (sonst wäre die Gleichung nicht quadratisch)');
    const D = A.resta(A.mul(b, b), A.mul(A.ent(4), A.mul(a, c))), Df = A.aFloat(D);
    pasos.push({ t: 'Diskriminante', html: `$Δ = b^2 − 4ac = ${enPar(exTxt(b))}^2 − 4 · ${enPar(exTxt(a))} · ${enPar(exTxt(c))}$ = <b>$${exTxt(D)}$</b>` });
    let sq = null, sqT;
    const real = A.esReal(D);
    const Rq = (q) => { const r = (x) => { if (x < 0n) return null; let y = BigInt(Math.round(Math.sqrt(Number(x)))); while (y * y > x) y--; while ((y + 1n) * (y + 1n) <= x) y++; return y * y === x ? y : null; }; const n = r(q.n < 0n ? -q.n : q.n), d = r(q.d); return n !== null && d !== null ? A.Q(n, d) : null; };
    if (real) {
      const neg = D.re.n < 0n, rq = Rq(D.re);
      if (rq) { sq = A.C(neg ? A.Q(0) : rq, neg ? rq : A.Q(0)); sqT = exTxt(sq); }
      else sqT = `${neg ? 'i' : ''}√${qT(neg ? A.neg(D).re : D.re)}`;
      pasos.push({ t: 'Wurzel der Diskriminante', html: D.re.n < 0n ? `Δ ist negativ: Es gibt keine reellen Lösungen, aber zwei komplex konjugierte, weil $√Δ = √(${qT(D.re)}) = i √${qT(A.neg(D).re)}$${rq ? ` = ${sqT}` : ` ≈ ${bin(Z(0, Math.sqrt(-Df.re)))}`}` : D.re.n === 0n ? 'Δ = 0: Es gibt eine doppelte Wurzel.' : `Δ ist positiv: Die beiden Lösungen sind reell, $√Δ = ${sqT}${rq ? '' : ` ≈ ${f(Math.sqrt(Df.re))}`}$` });
    } else {
      const r = mod(Df), t = arg(Df), w = pol(Math.sqrt(r), t / 2);
      sqT = bin(w);
      pasos.push({ t: 'Wurzel der Diskriminante', html: `Δ ist komplex: Seine Wurzel zieht man in Polarform, $√(r_θ) = (√r)_{θ/2}$ (und die andere ist die Gegenzahl): $Δ = ${f(r)}_{${grados(t)}}$ ⇒ $√Δ = ${f(Math.sqrt(r))}_{${grados(t / 2)}}$ = ${sqT}` });
    }
    const sqF = sq ? A.aFloat(sq) : real ? (Df.re < 0 ? Z(0, Math.sqrt(-Df.re)) : Z(Math.sqrt(Df.re))) : pol(Math.sqrt(mod(Df)), arg(Df) / 2);
    const af = A.aFloat(a), bf = A.aFloat(b), menosB = Z(-bf.re, -bf.im), dosA = Z(2 * af.re, 2 * af.im);
    const z1 = zd(zs(menosB, sqF), dosA), z2 = zd(zr(menosB, sqF), dosA);
    let e1 = null, e2 = null;
    if (sq) { const mb = A.neg(b), da = A.mul(A.ent(2), a); e1 = A.div(A.suma(mb, sq), da); e2 = A.div(A.resta(mb, sq), da); }
    pasos.push({ t: 'Lösungen', html: `$z = {−b ± √Δ}/{2a} = {${exTxt(A.neg(b))} ± ${enPar(sqT.replace(/ ≈.*/, ''))}}/{${exTxt(A.mul(A.ent(2), a))}}$<br>$z_1$ = <b>$${e1 ? exTxt(e1) : bin(z1)}$</b>, &ensp; $z_2$ = <b>$${e2 ? exTxt(e2) : bin(z2)}$</b>${real && D.re.n < 0n && A.esReal(a) && A.esReal(b) ? '<br>Da die Koeffizienten reell sind, sind die beiden Lösungen konjugiert.' : ''}` });
    pasos.push({ t: 'Kontrolle', html: `Die Summe der Wurzeln ist $−b/a = ${bin(zd(menosB, af))}$ und das Produkt $c/a = ${bin(zd(A.aFloat(c), af))}$ (Satz von Vieta).` });
    Object.assign(res, { z1, z2, e1, e2, D: Df, z: z1 });
    res.puntos = [{ z: z1, n: 'z₁', c: 3 }, { z: z2, n: 'z₂', c: 3 }];
    return res;
  }

  const zln = (z) => Z(Math.log(mod(z)), arg(z));
  const zexp = (z) => pol(Math.exp(z.re), z.im);
  function trascendente(op, sc, res) {
    const u = res.unidad, pasos = res.pasos, PI2 = u === 'radianes' ? '2kπ' : '360°k';
    if (op === 'exponencial') {
      const w = leeZ(sc.z1, 'radianes', 'z'), z = w.z, r = Math.exp(z.re), zz = pol(r, z.im);
      pasos.push({ t: 'Eulersche Formel', html: `Für $z = a + bi$ gilt $e^z = e^a · e^{ib} = e^a (cos b + i sin b)$: Der Betrag ist $e^a$ und das Argument b (im Bogenmaß).` });
      pasos.push({ t: 'Mit z =' + bin(z), html: `$e^{${bin(z)}} = e^{${f(z.re)}} (cos ${f(z.im)} + i sen ${f(z.im)})$ = $${f(r)}_{${angulo(z.im, u)}}$ = <b>$${bin(zz)}$</b>${Math.abs(z.re) < 1e-12 && Math.abs(Math.abs(z.im) - PI) < 1e-12 ? '<br>Das ist die Eulersche Identität: $e^{iπ} = −1$.' : ''}<br>Die komplexe Exponentialfunktion ist periodisch: $e^{z + 2πi} = e^z$.` });
      Object.assign(res, { z: zz, formas: formas({ z: zz, ex: null }, u, 'e^z') });
      res.puntos = [{ z, n: 'z', c: 1 }, { z: zz, n: 'eᶻ', c: 3 }];
      return res;
    }
    const w1 = leeZ(sc.z1, u, 'z');
    if (mod(w1.z) === 0) throw new Error(op === 'logaritmo' ? 'Der Logarithmus von 0 existiert nicht' : 'Die Basis 0 kann nicht mit einem komplexen Exponenten potenziert werden');
    const F = formas(w1, u, 'z'), L = zln(w1.z);
    pasos.push(...F.pasos);
    const lnTxt = `${f(L.re)} ${L.im < 0 ? '−' : '+'} ${f(Math.abs(L.im))}i`;
    pasos.push({ t: 'Logarithmus', html: `$ln z = ln|z| + i (θ + 2kπ)$, mit θ im Bogenmaß: Es gibt unendlich viele Logarithmen, einen für jeden Umlauf. Der <b>Hauptwert</b> (k = 0, mit −π < θ ≤ π) ist:<br>$Ln z = ln ${f(F.r)} + ${piFrac(F.t) ?? f(F.t)} i$ = <b>$${lnTxt}$</b>` });
    if (op === 'logaritmo') {
      pasos.push({ t: 'Die übrigen Werte', html: [-1, 1, 2].map((k) => `$k = ${k}$: $${f(L.re)} ${L.im + 2 * PI * k < 0 ? '−' : '+'} ${f(Math.abs(L.im + 2 * PI * k))}i$`).join('<br>') + `<br>Alle haben denselben Realteil, ln|z|, und der Imaginärteil geht in Schritten von 2π.${void PI2 || ''}` });
      Object.assign(res, { z: L, formas: formas({ z: L, ex: null }, u, 'Ln z') });
      res.puntos = [{ z: w1.z, n: 'z', c: 1 }, { z: L, n: 'Ln z', c: 3 }];
      return res;
    }
    const w2 = leeZ(sc.z2, u, 'w'), e = w2.z, prod = zm(e, L), zz = zexp(prod);
    pasos.push({ t: 'Definition', html: `$z^w = e^{w · ln z}$. Mit dem Hauptwert des Logarithmus ergibt sich der Hauptwert:<br>$w · Ln z = (${bin(e)})(${lnTxt})$ = $${bin(prod)}$<br>$z^w = e^{${bin(prod)}}$ = $${f(Math.exp(prod.re))}_{${angulo(prod.im, u)}}$ = <b>$${bin(zz)}$</b>` });
    const q = w2.ex && A.esReal(w2.ex) ? w2.ex.re : null;
    if (q && q.d !== 1n) pasos.push({ t: 'Wie viele Werte es gibt', html: `Da w = ${qT(q)} ein Bruch mit dem Nenner ${q.d} ist, hat $z^w$ ${q.d} verschiedene Werte (die der ${q.d}-ten Wurzeln); der obige ist der Hauptwert.` });
    else if (!q) pasos.push({ t: 'Wie viele Werte es gibt', html: `Bei einem nicht reellen Exponenten ergibt jeder Logarithmus $ln z + 2kπi$ einen anderen Wert: Es gibt unendlich viele, und der obige ist der Hauptwert. Zum Beispiel ist $i^i = e^{−π/2} ≈ 0,2079$ reell.` });
    Object.assign(res, { z: zz, formas: formas({ z: zz, ex: null }, u, 'z^w') });
    res.puntos = [{ z: w1.z, n: 'z', c: 1 }, { z: e, n: 'w', c: 2 }, { z: zz, n: 'zʷ', c: 3 }];
    return res;
  }

  function polinomio(sc, res) {
    const P_ = typeof Parametro !== 'undefined' ? Parametro : require('../matematicas/parametro.js'), pasos = res.pasos;
    if (vacio(sc.p)) throw new Error('Schreibe das Polynom in z, zum Beispiel z^3 − 8 oder z^4 + 2z^2 + 1');
    let p;
    try { p = P_.lee(String(sc.p).replace(/=\s*0\s*$/, ''), 'z'); } catch (e) { throw new Error(`Das Polynom: ${e.message}`); }
    const g = P_.grado(p);
    if (g < 1) throw new Error('Das Polynom muss z enthalten');
    if (g > 8) throw new Error('Höchstens vom Grad 8');
    const alto = p.slice().reverse(), r = A.raices(alto), sols = [];
    pasos.push({ t: 'Die Gleichung', html: `$${A.polHtml(alto, 'z').replace(/<sup>(.*?)<\/sup>/g, '^{$1}')} = 0$, vom Grad ${g}: Nach dem Fundamentalsatz der Algebra hat sie ${g} komplexe Lösungen, mehrfache mitgezählt.` });
    const noCero = p.map((c, i) => [c, i]).filter(([c]) => !A.esCero(c));
    if (noCero.length === 2 && noCero[0][1] === 0) {
      const [c0, n] = [noCero[0][0], noCero[1][1]], w = A.div(A.neg(c0), noCero[1][0]);
      pasos.push({ t: 'Es ist eine binomische Gleichung', html: `Man löst nach $z^{${n}} = ${exTxt(w)}$ auf: Die Lösungen sind die ${n} ${n}-ten Wurzeln von ${exTxt(w)}, die an einem regelmäßigen Vieleck liegen (nutze «n-te Wurzeln», um sie Schritt für Schritt zu sehen).` });
    }
    for (const { valor, mult } of r.exactas) sols.push({ z: A.aFloat(valor), ex: valor, mult });
    for (const z of r.aprox) sols.push({ z, ex: null, mult: 1 });
    if (r.exactas.length) {
      const fac = r.exactas.map(({ valor, mult }) => { const [sg, v] = A.signo(A.neg(valor)); return `(z ${sg} ${v})${mult > 1 ? `^{${mult}}` : ''}`; }).join(' ');
      pasos.push({ t: 'Exakte Wurzeln (Horner-Schema)', html: `Man probiert die Teiler des konstanten Gliedes und dividiert mit dem Horner-Schema: ${r.exactas.map((x) => `$z = ${exTxt(x.ex ?? x.valor)}$${x.mult > 1 ? ` (${x.mult === 2 ? 'doppelt' : 'dreifach'})` : ''}`).join(', ')}${r.resto.length > 1 ? `. Es bleibt $${A.polHtml(r.resto, 'z').replace(/<sup>(.*?)<\/sup>/g, '^{$1}')}$` : ''}.<br>Faktorisiert: $${fac}${r.resto.length > 1 ? ` (${A.polHtml(r.resto, 'z').replace(/<sup>(.*?)<\/sup>/g, '^{$1}')})` : ''}$` });
    }
    if (r.aprox.length) pasos.push({ t: r.exactas.length ? 'Der Rest, numerisch' : 'Numerische Wurzeln', html: `${r.resto.length === 3 ? 'Sie ist quadratisch: Man löst sie mit der Formel $z = {−b ± √Δ}/{2a}$.' : 'Sie hat keine weiteren rationalen Wurzeln: Sie werden numerisch berechnet (Durand-Kerner-Verfahren).'}${r.aprox.map((z) => `$z ≈ ${bin(z, 5)}$`).join(', ')}` });
    if (alto.every(A.esReal)) pasos.push({ t: 'Reelle Koeffizienten', html: 'Da die Koeffizienten reell sind, treten die komplexen Lösungen in konjugierten Paaren auf.' });
    Object.assign(res, { sols, z: sols[0]?.z });
    res.puntos = sols.map((q, k) => ({ z: q.z, n: `z${'₁₂₃₄₅₆₇₈₉'[k] ?? k + 1}`, c: 3 }));
    return res;
  }

  function region(sc, res) {
    const u = res.unidad, pasos = res.pasos;
    const txt = String(sc.cond ?? '').replace(/[−–]/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/\s+/g, ' ').trim();
    if (!txt) throw new Error('Schreibe eine oder mehrere Bedingungen: |z − 1| < 2, Re z > 0, 0 ≤ arg z ≤ π/2…');
    const partes = txt.split(/\s*(?:,|;|\by\b|∧)\s*/).filter(Boolean), conds = [];
    const expr = (e0) => {
      const e = e0.trim().replace(/\s+/g, '');
      let m;
      if ((m = /^\|z(?:([+-])(.+))?\|$/.exec(e))) {
        const resto = m[1] ? leeZ(m[1] + m[2], u, 'der Mittelpunkt').z : Z(0), cc = Z(-resto.re || 0, -resto.im || 0);
        return { f: (z) => mod(zr(z, cc)), t: m[1] ? `der Abstand von z zu ${bin(cc)}` : 'der Betrag von z', c: cc, tipo: 'mod' };
      }
      if (/^Re\(?z\)?$/i.test(e)) return { f: (z) => z.re, t: 'der Realteil', tipo: 're' };
      if (/^Im\(?z\)?$/i.test(e)) return { f: (z) => z.im, t: 'der Imaginärteil', tipo: 'im' };
      if (/^arg\(?z\)?$/i.test(e)) return { f: (z) => arg(z), t: 'das Argument', tipo: 'arg' };
      return null;
    };
    const num = (e, ang) => (ang ? leeAngulo(e, u, 'der Winkel') : leeReal(e, 'die Zahl').v);
    for (const pz of partes) {
      const tok = pz.split(/(<=|>=|<|>|=)/).map((x) => x.trim());
      if (tok.length !== 3 && tok.length !== 5) throw new Error(`«${pz}» wird nicht verstanden: Schreibe zum Beispiel |z − 1| < 2, Re z > 0 oder 0 < arg z < π/2`);
      const pon = (izq, op, der) => {
        const L = expr(izq), R = expr(der);
        if (L && R) { conds.push({ a: L, b: R, op, t: `${L.t} ${op} ${R.t}` }); return; }
        const X = L || R; if (!X) throw new Error(`«${pz}» enthält kein z: Verwende |z − a|, Re z, Im z oder arg z`);
        const k = num(L ? der : izq, X.tipo === 'arg');
        let o = op; if (!L) o = { '<': '>', '>': '<', '<=': '>=', '>=': '<=', '=': '=' }[op];
        conds.push({ a: X, k, op: o });
      };
      if (tok.length === 3) pon(tok[0], tok[1], tok[2]);
      else { pon(tok[0], tok[1], tok[2]); pon(tok[2], tok[3], tok[4]); }
    }
    const cmp = (x, op, y, tol) => ({ '<': x < y - tol, '>': x > y + tol, '<=': x <= y + tol, '>=': x >= y - tol, '=': Math.abs(x - y) <= tol }[op]);
    const valor = (c, z) => c.a.f(z) - (c.b ? c.b.f(z) : c.k);
    const dentro = (z, tol = 0) => conds.every((c) => cmp(valor(c, z), c.op, 0, c.op === '=' ? tol : 0));
    const OPT = { '<': 'kleiner als', '>': 'größer als', '<=': 'kleiner oder gleich', '>=': 'größer oder gleich', '=': 'gleich' };
    const desc = conds.map((c) => {
      const a = c.a;
      if (c.b) return c.op === '=' ? `${c.t}: die Punkte, die von ${bin(a.c)} und von ${bin(c.b.c)} gleich weit entfernt sind, die Mittelsenkrechte der Strecke, die sie verbindet.` : `${c.t}: die Halbebene der Punkte, die ${bin(a.c)} ${c.op.startsWith('<') ? 'näher' : 'ferner'} sind als ${bin(c.b.c)}; der Rand ist die Mittelsenkrechte.`;
      if (a.tipo === 'mod') return c.op === '=' ? `Der Kreis mit Mittelpunkt ${bin(a.c)} und Radius ${f(c.k)}.` : `${c.op.startsWith('<') ? 'Das Innere' : 'Das Äußere'} des Kreises mit Mittelpunkt ${bin(a.c)} und Radius ${f(c.k)}${c.op.length > 1 ? ', mit dem Rand' : ', ohne den Rand'}.`;
      if (a.tipo === 're') return c.op === '=' ? `Die senkrechte Gerade x = ${f(c.k)}.` : `Die Halbebene ${c.op.startsWith('<') ? 'links' : 'rechts'} der senkrechten Geraden x = ${f(c.k)}.`;
      if (a.tipo === 'im') return c.op === '=' ? `Die waagerechte Gerade y = ${f(c.k)}.` : `Die Halbebene ${c.op.startsWith('<') ? 'unterhalb' : 'oberhalb'} der waagerechten Geraden y = ${f(c.k)}.`;
      return `${c.op === '=' ? 'Ein Strahl vom Ursprung aus' : 'Der von den Strahlen vom Ursprung überstrichene Bereich'} (${a.t} ${OPT[c.op]} ${angulo(c.k, u)}).`;
    });
    const OPS = { '<': '<', '>': '>', '<=': '≤', '>=': '≥', '=': '=' };
    const fz = (a) => (a.tipo === 'mod' ? (mod(a.c) < 1e-12 ? '|z|' : `|z − (${bin(a.c)})|`) : a.tipo === 're' ? '"Re" z' : a.tipo === 'im' ? '"Im" z' : 'arg z');
    const fCond = (c) => `$${fz(c.a)} ${OPS[c.op]} ${c.b ? fz(c.b) : c.a.tipo === 'arg' ? angulo(c.k, u) : f(c.k)}$`;
    pasos.push({ t: conds.length > 1 ? 'Jede Bedingung' : 'Die Bedingung', html: desc.map((d, i) => `${conds.length > 1 ? `(${i + 1}) ` : ''}${fCond(conds[i])}: ${d[0].toLowerCase() + d.slice(1)}`).join('<br>') });
    if (conds.length > 1) pasos.push({ t: 'Alle zugleich', html: 'Das Gebiet ist der Durchschnitt: die Punkte, die alle Bedingungen erfüllen (der schattierte Bereich).' });
    let L0 = 2;
    for (const c of conds) { if (c.a.c) L0 = Math.max(L0, mod(c.a.c) + (c.k || 0)); if (c.b && c.b.c) L0 = Math.max(L0, mod(c.b.c)); if (c.a.tipo !== 'arg' && c.k !== undefined) L0 = Math.max(L0, Math.abs(c.k) + 1); }
    L0 *= 1.3;
    let hay = false, punto = null;
    for (const paso of [1, L0 / 30]) for (let i = 0; i <= 2 * L0 / paso && !hay; i++) for (let j = 0; j <= 2 * L0 / paso && !hay; j++) { const z = Z(Math.round(-L0 / paso) * paso + i * paso, Math.round(-L0 / paso) * paso + j * paso); if (dentro(z, paso === 1 ? 0 : L0 / 40)) { hay = true; punto = z; } }
    if (!hay) pasos.push({ t: 'Leeres Gebiet', html: 'Kein Punkt erfüllt alle Bedingungen zugleich.' });
    Object.assign(res, { conds, dentro, frontera: (z, tol) => conds.some((c) => Math.abs(valor(c, z)) < tol), L: L0, vacia: !hay, desc, punto: punto && bin(Z(+f(punto.re).replace(',', '.').replace('−', '-'), +f(punto.im).replace(',', '.').replace('−', '-'))) });
    res.puntos = conds.flatMap((c) => [c.a.c, c.b?.c]).filter(Boolean).filter((z, i, xs) => xs.findIndex((w) => Math.abs(w.re - z.re) + Math.abs(w.im - z.im) < 1e-12) === i).map((z) => ({ z, n: bin(z), c: 1 }));
    return res;
  }

  const ejemplos = [
    { clave: 'formas', nombre: 'Formen von 3 + 4i', sc: { op: 'formas', z1: '3+4i', unidad: 'grados' } },
    { clave: 'cuadrante', nombre: 'Von polar zu kartesisch: 2∠120°', sc: { op: 'formas', z1: '2∠120°', unidad: 'grados' } },
    { clave: 'tercero', nombre: 'Argument im dritten Quadranten: −2 − 2i', sc: { op: 'formas', z1: '-2-2i', unidad: 'radianes' } },
    { clave: 'suma', nombre: 'Summe (3 + 2i) + (1 − 5i)', sc: { op: 'suma', z1: '3+2i', z2: '1-5i', unidad: 'grados' } },
    { clave: 'producto', nombre: 'Produkt (2 + 3i)(1 − i)', sc: { op: 'producto', z1: '2+3i', z2: '1-i', unidad: 'grados' } },
    { clave: 'cociente', nombre: 'Quotient (3 + 2i)/(1 − i)', sc: { op: 'cociente', z1: '3+2i', z2: '1-i', unidad: 'grados' } },
    { clave: 'polar', nombre: 'Produkt in Polarform: 2∠30° · 3∠60°', sc: { op: 'producto', z1: '2∠30°', z2: '3∠60°', unidad: 'grados' } },
    { clave: 'moivre', nombre: 'Potenz (1 + i)⁸ mit De Moivre', sc: { op: 'potencia', z1: '1+i', n: '8', unidad: 'grados' } },
    { clave: 'raices-cubicas', nombre: 'Dritte Wurzeln von −8', sc: { op: 'raices', z1: '-8', n: '3', unidad: 'grados' } },
    { clave: 'raices-unidad', nombre: 'Sechste Einheitswurzeln', sc: { op: 'raices', z1: '1', n: '6', unidad: 'radianes' } },
    { clave: 'ecuacion', nombre: 'Gleichung z² − 2z + 5 = 0', sc: { op: 'ecuacion', a: '1', b: '-2', c: '5', unidad: 'grados' } },
    { clave: 'ecuacion-compleja', nombre: 'Gleichung mit komplexen Koeffizienten', sc: { op: 'ecuacion', a: '1', b: '-3i', c: '-3+i', unidad: 'grados' } },
    { clave: 'exponencial', nombre: 'Von exponentiell zu kartesisch: 2e^(iπ/3)', sc: { op: 'formas', z1: '2e^(iπ/3)', unidad: 'radianes' } },
    { clave: 'cubica', nombre: 'Gleichung z³ − 8 = 0', sc: { op: 'polinomio', p: 'z^3 - 8', unidad: 'grados' } },
    { clave: 'cuarta', nombre: 'Gleichung z⁴ + 5z² + 4 = 0', sc: { op: 'polinomio', p: 'z^4 + 5z^2 + 4', unidad: 'grados' } },
    { clave: 'logaritmo', nombre: 'Logarithmus von −1', sc: { op: 'logaritmo', z1: '-1', unidad: 'radianes' } },
    { clave: 'euler', nombre: 'e^(1 + iπ/2)', sc: { op: 'exponencial', z1: '1+iπ/2', unidad: 'radianes' } },
    { clave: 'ii', nombre: 'iⁱ ist eine reelle Zahl', sc: { op: 'potenciaC', z1: 'i', z2: 'i', unidad: 'radianes' } },
    { clave: 'disco', nombre: 'Gebiet |z − 1 − i| ≤ 2 mit Re z > 0', sc: { op: 'region', cond: '|z - 1 - i| <= 2, Re z > 0', unidad: 'grados' } },
    { clave: 'sector', nombre: 'Sektor 0 ≤ arg z ≤ 60° mit |z| < 3', sc: { op: 'region', cond: '0 <= arg z <= 60°, |z| < 3', unidad: 'grados' } },
  ];

  return { resolver, leeZ, leeReal, formas, piFrac, OPS, ejemplos, mod, arg, bin, f, Z };
})();

