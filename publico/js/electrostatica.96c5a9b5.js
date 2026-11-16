const Version = (() => { const log = [{"v":"0.8","fecha":"2026-11-16","cambios":["La página tiene ya pie con Contacto, Aviso legal, Privacidad y Cookies (antes solo estaban en la barra lateral, que en el móvil no se veía) y «Informar de un error» abre un correo con la herramienta ya escrita.","Aparece en «Tu espacio» de la portada (últimas visitadas) y tiene el botón ☆ Favorita.","Con el teclado, Tab empieza por la cabecera y el contenido, y la barra de Mis ejercicios queda después.","Si tu sistema pide reducir el movimiento, las cargas de prueba dibujan su trayectoria de golpe en vez de animarla.","La descripción y la teoría incluyen ya todas las fuentes (láminas, cascarones, anillos, discos, conductores, dipolos…)."]},{"v":"0.7","fecha":"2026-11-08","cambios":["El modo práctica comprueba las dimensiones: si tu respuesta no sale en N/C, V, N, J… te lo dice, y si sumas términos con unidades distintas señala cuál falla."]},{"v":"0.6","fecha":"2026-10-26","cambios":["Tubo cilíndrico con carga superficial σ y cilindros huecos (con radio interior), para resolver cables coaxiales.","Densidades que no son uniformes en esferas y cilindros (ρ₀·r/R, ρ₀·R/r, ρ₀(1 − r/R) y ρ₀(1 − r²/R²)) y en varillas (λ que crece o decrece a lo largo), con Gauss y la carga encerrada.","Arcos cargados: semicircunferencias, cuartos de anillo o cualquier ángulo, con el campo y el potencial en el centro.","Corteza esférica conductora con radio interior y exterior: si dentro hay una carga centrada, se induce −q en la cara interior y +q en la exterior.","Seis ejercicios de ejemplo nuevos con todo esto.","La guía enlaza con la herramienta de Condensadores."]},{"v":"0.5.1","fecha":"2026-10-23","cambios":["El simulador tiene ahora su propia dirección, /electromagnetismo/electrostatica/. Tus problemas guardados siguen ahí. El botón «Todas las herramientas» de la barra lateral vuelve a la portada."]},{"v":"0.5","fecha":"2026-10-23","cambios":["Doce ejercicios de ejemplo con enunciados propios: los mismos tipos de pregunta que en clase, con otras figuras y otros números. La guía de uso tiene capturas nuevas hechas con ellos.","La web tiene icono propio: un dipolo con sus líneas de campo, en la pestaña del navegador, en la pantalla de inicio del móvil y en la vista previa al compartir el enlace.","Páginas de aviso legal, privacidad, cookies y contacto, enlazadas al pie de la barra lateral."]},{"v":"0.4","fecha":"2026-10-22","cambios":["Número de versión visible y este apartado de novedades.","Arreglo: en la vista 3D los cilindros se dibujan con su radio real, aparecen las superficies de Gauss, y las esferas, cascarones y conductores tienen volumen en lugar de parecer círculos planos."]},{"v":"0.3","fecha":"2026-10-22","cambios":["Guía de uso con capturas (botón ?, barra lateral o F1).","Los resultados se escriben con la misma forma que el solucionario oficial: perfiles por tramos, factor común en logaritmos y radicales, y la pregunta V_A − V_B."]},{"v":"0.2","fecha":"2026-10-22","cambios":["Anillos, discos, cortezas y conductores.","Varias incógnitas, modo numérico SI, flujo de Gauss y gráficas E(z) y V(z).","Modo práctica, exportar la solución, deshacer y rehacer, mapa de color y vista 3D.","Búsqueda, carpetas y etiquetas en la barra lateral."]},{"v":"0.1","fecha":"2026-10-22","cambios":["Primera versión: cargas, hilos, planos y esferas con el desarrollo paso a paso y 12 ejercicios resueltos.","Barra lateral con tus problemas, los importados y los ejercicios; título y enunciado editables; archivos .emsim.json."]}]; return { current: log[0].v, log }; })();

/* =====================================================================
   Motor de cálculo (sin DOM). Unidades: longitud en unidades de "a",
   ε₀ = 1 internamente; los resultados se muestran como coef·símbolos/(πε₀aⁿ).
   ===================================================================== */
const Engine = (() => {
  const PI = Math.PI;

  /* ---------- Parser de expresiones: 2*sqrt(3), 5/2, -1/(4pi), √3 ---------- */
  const FUN = {
    sqrt: Math.sqrt, ln: Math.log, log: Math.log10, exp: Math.exp, abs: Math.abs,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
  };
  function parseExpr(src, unit, vars) {
    if (typeof src === 'number') return src;
    let s = String(src ?? '').trim();
    if (!s) throw new Error('vacío');
    s = s.replace(/π/g, 'pi').replace(/λ/g, 'lambda').replace(/σ/g, 'sigma').replace(/ρ/g, 'rho').replace(/ε₀|ε0|ε/g, 'eps0').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/²/g, '^2').replace(/³/g, '^3').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/,/g, '.');
    const toks = [];
    const re = /\s*(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+|[A-Za-z_][A-Za-z_0-9]*|√|[-+*/^()])/y;
    let m;
    re.lastIndex = 0;
    while (re.lastIndex < s.length) {
      const at = re.lastIndex;
      m = re.exec(s);
      if (!m) { if (/^\s*$/.test(s.slice(at))) break; throw new Error('símbolo no válido: ' + s.slice(at, at + 3)); }
      toks.push(m[1]);
    }
    let i = 0;
    const peek = () => toks[i];
    const eat = (t) => { if (toks[i] !== t) throw new Error('se esperaba ' + t); i++; };
    const startsPrimary = (t) => t !== undefined && (/^[\d.A-Za-z_(]/.test(t) || t === '√');
    function expr() {
      let v = term();
      while (peek() === '+' || peek() === '-') { const op = toks[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        const t = peek();
        if (t === '*') { i++; v *= unary(); }
        else if (t === '/') { i++; v /= unary(); }
        else if (startsPrimary(t)) v *= power();
        else return v;
      }
    }
    function unary() {
      if (peek() === '-') { i++; return -unary(); }
      if (peek() === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (peek() === '^') { i++; return Math.pow(b, unary()); }
      return b;
    }
    function primary() {
      const t = toks[i++];
      if (t === undefined) throw new Error('expresión incompleta');
      if (t === '(') { const v = expr(); eat(')'); return v; }
      if (t === '√') return power();
      if (/^[\d.]/.test(t)) return parseFloat(t);
      const id = t.toLowerCase();
      if (id === 'pi') return PI;
      if (id === 'e') return Math.E;
      if (vars && t in vars) return vars[t];
      if (unit && t === unit) return 1;
      if (FUN[id]) {
        if (peek() === '(') { i++; const v = expr(); eat(')'); return FUN[id](v); }
        return FUN[id](power());
      }
      throw new Error('desconocido: ' + t);
    }
    const v = expr();
    if (i < toks.length) throw new Error('sobra: ' + toks[i]);
    if (!isFinite(v)) throw new Error('no es un número finito');
    return v;
  }

  /* ---------- Vectores numéricos ---------- */
  const V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (a) => Math.hypot(a[0], a[1], a[2]),
  };
  V3.unit = (a) => { const n = V3.norm(a); return n ? V3.sc(a, 1 / n) : [0, 0, 0]; };

  /* ---------- Reconocer números "bonitos": (n/d)·√r ---------- */
  const RADS = [1, 2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 29, 30, 31, 33, 34, 35, 37, 38, 39, 41, 42, 43, 46, 47, 51, 53, 55];
  function rat(x, maxDen, tol = 1e-11) {
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0, y = x;
    for (let it = 0; it < 40; it++) {
      const a = Math.floor(y);
      const h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(x - h1 / k1) <= tol * Math.abs(x)) return [h1, k1];
      const f = y - a;
      if (f < 1e-14) break;
      y = 1 / f;
    }
    return null;
  }
  const MIXR = [2, 3, 5, 6, 7, 10, 15];
  // x = (a + b·√r)/d con enteros pequeños
  function identifyMix(x) {
    for (let d = 1; d <= 96; d++) {
      const X = x * d;
      for (let m = 1; m <= 60; m++) for (const sg of [1, -1]) {
        const b = sg * m;
        for (const r of MIXR) {
          const a = X - b * Math.sqrt(r), ar = Math.round(a);
          if (ar === 0 || Math.abs(ar) > 5000) continue;
          if (Math.abs(a - ar) <= 1e-10 * Math.max(Math.abs(X), Math.abs(b * Math.sqrt(r)))) {
            const g = gcd3(Math.abs(ar), m, d);
            return { mix: true, a: ar / g, b: b / g, r, d: d / g };
          }
        }
      }
    }
    return null;
  }
  const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
  const gcd3 = (a, b, c) => gcd2(gcd2(a, b), c);
  // devuelve {s, n, d, r} o {mix, a, b, r, d}; score = complejidad (menor = más simple)
  function identify(x, allowMix = true) {
    if (!isFinite(x)) return null;
    if (Math.abs(x) < 1e-12) return { s: 1, n: 0, d: 1, r: 1, score: 0 };
    const s = x < 0 ? -1 : 1, ax = Math.abs(x);
    for (const r of RADS) {
      const q = rat(ax / Math.sqrt(r), 1000, 1e-11);
      if (q && q[0] < 1e6) return { s, n: q[0], d: q[1], r, score: q[1] + (r > 1 ? 3 : 0) };
    }
    if (allowMix) { const m = identifyMix(x); if (m) return { ...m, score: m.d + 6 }; }
    const q = rat(ax, 100000, 2e-14);
    if (q && q[0] < 1e7) return { s, n: q[0], d: q[1], r: 1, score: q[1] };
    return null;
  }

  /* ---------- Ex: número exacto = parte algebraica + Σ α·ln β ---------- */
  class Ex {
    constructor(a = 0, L = []) { this.a = a; this.L = L; }
    static of(x) { return x instanceof Ex ? x : new Ex(x); }
    static ln(al, be) { const e = new Ex(0); addLn(e.L, al, be); return e; }
    value() { return this.a + this.L.reduce((s, t) => s + t.al * Math.log(t.be), 0); }
    add(o) { o = Ex.of(o); const r = new Ex(this.a + o.a, this.L.map((t) => ({ ...t }))); for (const t of o.L) addLn(r.L, t.al, t.be); return r; }
    sub(o) { return this.add(Ex.of(o).scale(-1)); }
    scale(k) { return new Ex(this.a * k, this.L.map((t) => ({ al: t.al * k, be: t.be }))); }
    mul(o) {
      o = Ex.of(o);
      if (!o.L.length) return this.scale(o.a);
      if (!this.L.length) return o.scale(this.a);
      return new Ex(this.value() * o.value());
    }
    isZero() { return Math.abs(this.value()) < 1e-13 && Math.abs(this.a) < 1e-13; }
  }
  function addLn(L, al, be) {
    if (Math.abs(al) < 1e-15 || !(be > 0) || Math.abs(Math.log(be)) < 1e-13) return;
    for (const t of L) {
      const s = Math.max(Math.abs(t.al), Math.abs(al));
      if (Math.abs(t.al - al) < 1e-9 * s) { t.be *= be; prune(L); return; }
      if (Math.abs(t.al + al) < 1e-9 * s) { t.be /= be; prune(L); return; }
    }
    L.push({ al, be });
  }
  function prune(L) { for (let i = L.length - 1; i >= 0; i--) if (Math.abs(Math.log(L[i].be)) < 1e-12) L.splice(i, 1); }

  /* ---------- Poly: combinación lineal de monomios simbólicos ---------- */
  const splitKey = (k) => (k ? k.split('*') : []);
  const joinKey = (arr) => arr.slice().sort().join('*');
  class Poly {
    constructor(m) { this.m = m || new Map(); }
    static sym(name, c = 1) { const p = new Poly(); p.m.set(name || '', Ex.of(c)); return p; }
    static num(c) { return Poly.sym('', c); }
    static zero() { return new Poly(); }
    add(o) {
      const r = new Poly(new Map(this.m));
      for (const [k, c] of o.m) r.m.set(k, r.m.has(k) ? r.m.get(k).add(c) : c);
      return r.clean();
    }
    sub(o) { return this.add(o.scale(-1)); }
    scale(k) { const r = new Poly(); for (const [kk, c] of this.m) r.m.set(kk, c.mul(k)); return r.clean(); }
    mul(o) {
      let r = new Poly();
      for (const [k1, c1] of this.m) for (const [k2, c2] of o.m) {
        const k = joinKey([...splitKey(k1), ...splitKey(k2)]);
        r = r.add(Poly.sym(k, c1.mul(c2)));
      }
      return r;
    }
    value(vals = {}) {
      let s = 0;
      for (const [k, c] of this.m) s += c.value() * splitKey(k).reduce((p, n) => p * (vals[n] ?? 1), 1);
      return s;
    }
    clean() {
      let mx = 0;
      for (const c of this.m.values()) mx = Math.max(mx, Math.abs(c.value()), Math.abs(c.a));
      for (const [k, c] of [...this.m]) if (Math.abs(c.value()) <= 1e-11 * Math.max(mx, 1e-300) && Math.abs(c.a) <= 1e-11 * Math.max(mx, 1e-300) && !c.L.length) this.m.delete(k);
      return this;
    }
    keys() { return [...this.m.keys()]; }
    isZero() { return this.m.size === 0; }
    coef(k) { return this.m.get(k) || new Ex(0); }
  }
  // Vectores de Poly
  const VP = {
    zero: () => [Poly.zero(), Poly.zero(), Poly.zero()],
    fromNum: (P, v) => v.map((x) => P.scale(x)),
    add: (a, b) => a.map((p, i) => p.add(b[i])),
    scaleP: (a, P) => a.map((p) => p.mul(P)),
    dot: (a, b) => a[0].mul(b[0]).add(a[1].mul(b[1])).add(a[2].mul(b[2])),
    cross: (a, b) => [
      a[1].mul(b[2]).sub(a[2].mul(b[1])),
      a[2].mul(b[0]).sub(a[0].mul(b[2])),
      a[0].mul(b[1]).sub(a[1].mul(b[0])),
    ],
    dotNum: (a, v) => a[0].scale(v[0]).add(a[1].scale(v[1])).add(a[2].scale(v[2])),
    value: (a, vals) => a.map((p) => p.value(vals)),
    keys: (a) => [...new Set(a.flatMap((p) => p.keys()))],
  };

  /* ---------- Tipos de símbolo (dimensiones) ---------- */
  // m: exponente tal que símbolo·a^m es una carga
  const KINDS = {
    q: { m: 0, label: 'Carga', hint: 'q', si: 'C' },
    lambda: { m: 1, label: 'Densidad lineal', hint: 'λ', si: 'C/m' },
    sigma: { m: 2, label: 'Densidad superficial', hint: 'σ', si: 'C/m²' },
    rho: { m: 3, label: 'Densidad volumétrica', hint: 'ρ', si: 'C/m³' },
    p: { m: -1, label: 'Momento dipolar', hint: 'p', si: 'C·m' },
  };
  // exponente de longitud de cada magnitud física (con ε₀ dividiendo)
  const QTY = {
    E: { L: -2, eps: true, si: 'N/C' }, V: { L: -1, eps: true, si: 'V' }, F: { L: -2, eps: true, si: 'N' },
    U: { L: -1, eps: true, si: 'J' }, T: { L: -1, eps: true, si: 'N·m' }, Phi: { L: 0, eps: true, si: 'N·m²/C' },
  };
  const EPS0 = 8.8541878128e-12;

  /* ---------- Integrales elípticas (AGM) y Gauss-Legendre ---------- */
  function ellipKE(m) {
    let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), sum = m / 2, p = 0.5;
    for (let i = 0; i < 30 && Math.abs(c) > 1e-15; i++) {
      const an = (a + b) / 2; c = (a - b) / 2; b = Math.sqrt(a * b); a = an;
      p *= 2; sum += p * c * c;
    }
    const K = PI / (2 * a);
    return [K, K * (1 - sum)];
  }
  function gaussLegendre(n) {
    const x = [], w = [];
    for (let i = 1; i <= n; i++) {
      let z = Math.cos(PI * (i - 0.25) / (n + 0.5)), pp;
      for (let it = 0; it < 100; it++) {
        let p1 = 1, p2 = 0;
        for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
        pp = n * (z * p1 - p2) / (z * z - 1);
        const z1 = z; z = z1 - p1 / pp;
        if (Math.abs(z - z1) < 1e-15) break;
      }
      x.push(z); w.push(2 / ((1 - z * z) * pp * pp));
    }
    return { x, w };
  }
  const GL = {};
  const gl = (n) => GL[n] || (GL[n] = gaussLegendre(n));


  return { PI, EPS0, parseExpr, V3, identify, Ex, Poly, VP, KINDS, QTY, splitKey, joinKey, ellipKE, gl };
})();


/* =====================================================================
   Formato: convierte números, Ex, Poly y vectores en HTML legible.
   ===================================================================== */
const Fmt = (() => {
  const { identify, KINDS, QTY, splitKey, PI, EPS0 } = Engine;
  let kinds = {}; // símbolo -> tipo (q, lambda, sigma, rho, p)
  let unit = 'a';
  let mode = 'sym';
  let order = []; // orden opcional de los símbolos en los productos (p. ej. ['q0', 'p0'])
  const setContext = (k, u, md, ord) => { kinds = k; unit = u || 'a'; mode = md || 'sym'; order = ord || []; };
  const siUnit = (qty) => QTY[qty]?.si || KINDS[qty]?.si || '';
  const siFactor = (qty) => (QTY[qty]?.eps ? 1 / EPS0 : 1);

  const GREEK = { lambda: 'λ', sigma: 'σ', rho: 'ρ', alpha: 'α', beta: 'β', mu: 'μ', eta: 'η', tau: 'τ', theta: 'θ', phi: 'φ', omega: 'ω', delta: 'δ', kappa: 'κ', gamma: 'γ', xi: 'ξ' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function sym(name) {
    if (!name) return '';
    name = String(name).replace(/^§/, '');
    const m = String(name).match(/^([A-Za-zλσρ]+?)_?(\d*)$/);
    if (!m) return `<i>${esc(name)}</i>`;
    const base = GREEK[m[1].toLowerCase()] || m[1];
    return `<i>${esc(base)}</i>${m[2] ? `<sub>${m[2]}</sub>` : ''}`;
  }
  const sup = (n) => (n === 1 ? '' : `<sup>${n}</sup>`);
  const unitPow = (n) => (n ? `<i>${esc(unit)}</i>${sup(n)}` : '');
  function mono(key) {
    const cnt = {};
    for (const s of splitKey(key)) cnt[s] = (cnt[s] || 0) + 1;
    const rank = (s) => { const i = order.indexOf(s); return i < 0 ? order.length : i; };
    return Object.keys(cnt).sort((x, y) => rank(x) - rank(y) || (x < y ? -1 : x > y ? 1 : 0)).map((s) => sym(s) + sup(cnt[s])).join('');
  }
  const frac = (n, d) => (d ? `<span class="fr"><span class="nu">${n || '1'}</span><span class="de">${d}</span></span>` : n || '1');
  const uv = (c) => `<span class="uv">u<sub>${c}</sub></span>`;
  const MINUS = '−';

  // número bonito en línea: 3√3/16, (3 − 2√3)/32
  function mixTop(id) {
    const A = Math.abs(id.a), B = Math.abs(id.b);
    const bs = `${B !== 1 ? B : ''}√${id.r}`;
    if (id.a > 0) return { neg: false, s: `(${A} ${id.b < 0 ? MINUS : '+'} ${bs})` };
    if (id.b > 0) return { neg: false, s: `(${bs} ${MINUS} ${A})` };
    return { neg: true, s: `(${A} + ${bs})` };
  }
  function niceInline(id, withSign = true) {
    if (id.mix) { const t = mixTop(id); return (withSign && t.neg ? MINUS : '') + t.s + (id.d !== 1 ? '/' + id.d : ''); }
    const body = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}${id.d !== 1 ? '/' + id.d : ''}`;
    return (withSign && id.s < 0 ? MINUS : '') + body;
  }
  const idNeg = (id) => (id.mix ? mixTop(id).neg : id.s < 0);
  function dec(x) {
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    let s = a >= 1e4 || a < 1e-3 ? x.toExponential(3).replace('e', '·10^') : String(+x.toPrecision(4));
    s = s.replace(/·10\^([+-]?\d+)/, (_, e) => `·10<sup>${+e}</sup>`);
    return s.replace('-', MINUS);
  }
  // número geométrico (sin π ni ε₀)
  function num(x) {
    const id = identify(x);
    return id ? niceInline(id) : dec(x);
  }
  function numFrac(x) {
    const id = identify(x);
    if (!id) return dec(x);
    if (id.mix) { const t = mixTop(id); return (t.neg ? MINUS : '') + (id.d === 1 ? t.s : frac(t.s, String(id.d))); }
    const top = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}`;
    return (id.s < 0 ? MINUS : '') + (id.d === 1 ? top : frac(top, String(id.d)));
  }
  const vecNum = (v) => `(${v.map(num).join(', ')})`;
  const pt = (v) => `(${v.map(num).join(', ')})`;

  // elige representación de un Ex: sobre π o no, con logaritmos
  // pi: 'den' (…/π), 'none', 'num' (π·…)
  function rep(ex) {
    let best = null;
    for (const pi of ['den', 'none', 'num']) {
      const k = pi === 'den' ? PI : pi === 'num' ? 1 / PI : 1;
      const a = identify(ex.a * k, !ex.L.length);
      if (!a) continue;
      const ls = ex.L.map((t) => {
        let al = t.al * k, be = t.be;
        if (be < 1) { al = -al; be = 1 / be; }
        return { al: identify(al, false), be: identify(be, false), bev: be };
      });
      if (ls.some((l) => !l.al || !l.be)) continue;
      const score = a.score + ls.reduce((s2, l) => s2 + l.al.score + l.be.score, 0) + (pi === 'num' ? 2 : 0);
      if (!best || score < best.score) best = { pi, a, ls, score };
    }
    return best || { pi: 'den', dec: ex.value() * PI };
  }
  function aExpFor(key, qty) {
    const ms = splitKey(key).reduce((s, n) => s + (KINDS[kinds[n]]?.m ?? 0), 0);
    if (QTY[qty]) return QTY[qty].L + ms;
    if (KINDS[qty]) return -KINDS[qty].m + ms;
    return 0;
  }
  const hasEps = (qty) => !!QTY[qty]?.eps;

  // un término: devuelve {neg, html} (html sin signo)
  function term(ex, key, qty) {
    if (mode === 'si') {
      const v = ex.value() * siFactor(qty);
      const syms = mono(key);
      return { neg: v < 0, html: `${dec(Math.abs(v))}${syms ? '·' + syms : ''} <span class="unit">${siUnit(qty)}</span>` };
    }
    const r = rep(ex);
    const n = aExpFor(key, qty);
    const piTop = r.pi === 'num' ? 'π' : '';
    const syms = mono(key) + (n > 0 ? unitPow(n) : '');
    const denTail = (r.pi === 'den' ? 'π' : '') + (hasEps(qty) ? 'ε<sub>0</sub>' : '') + (n < 0 ? unitPow(-n) : '');
    if (r.dec === undefined && !r.ls.length) {
      const a = r.a;
      if (a.mix) {
        // (3 − 2√3) = −√3(2 − √3): si a = ±r se saca √r factor común
        if (Math.abs(a.a) === a.r) {
          const c = a.a / a.r, B = Math.abs(a.b), C = Math.abs(c);
          const inner = `(${B} ${Math.sign(c) === Math.sign(a.b) ? '+' : MINUS} ${C !== 1 ? C : ''}√${a.r})`;
          return { neg: a.b < 0, html: `${frac(piTop + syms + '√' + a.r, `${a.d !== 1 ? a.d : ''}${denTail}`)}·${inner}` };
        }
        const t = mixTop(a);
        return { neg: t.neg, html: frac(t.s + piTop + syms, `${a.d !== 1 ? a.d : ''}${denTail}`) };
      }
      // denominador puramente numérico y sin potencias de la unidad: −(9/2)q₀
      if (!denTail && a.d !== 1 && syms && !piTop && n === 0) return { neg: a.s < 0, html: `${numFrac(Math.abs(a.s * a.n * Math.sqrt(a.r) / a.d))}${syms}` };
      const top = `${a.n !== 1 || (a.r === 1 && !syms && !piTop) ? a.n : ''}${a.r > 1 ? '√' + a.r : ''}${piTop}${syms}`;
      const den = `${a.d !== 1 ? a.d : ''}${denTail}`;
      return { neg: a.s < 0, html: frac(top, den) };
    }
    let coef, neg = false;
    if (r.dec !== undefined) { coef = dec(Math.abs(r.dec)); neg = r.dec < 0; }
    else {
      const parts = [];
      if (r.a.n) parts.push({ neg: idNeg(r.a), s: niceInline(r.a, false) });
      for (const l of r.ls) {
        const c = niceInline(l.al, false);
        parts.push({ neg: l.al.s < 0, s: `${c === '1' ? '' : c + '·'}ln ${niceInline(l.be, false)}` });
      }
      if (parts.length === 1) { neg = parts[0].neg; coef = parts[0].s; }
      else {
        if (parts.every((p) => p.neg)) { neg = true; parts.forEach((p) => (p.neg = false)); }
        coef = '(' + parts.map((p, i) => (i ? (p.neg ? ` ${MINUS} ` : ' + ') : p.neg ? MINUS : '') + p.s).join('') + ')';
      }
    }
    const tail = frac(piTop + syms, denTail);
    return { neg, html: `${coef}${tail === '1' ? '' : '·' + tail}` };
  }
  function joinTerms(ts) {
    if (!ts.length) return '0';
    return ts.map((t, i) => (i === 0 ? (t.neg ? MINUS : '') : t.neg ? ` ${MINUS} ` : ' + ') + t.html).join('');
  }
  function poly(P, qty) {
    return factorLog(P, qty) || joinTerms(P.keys().sort().map((k) => term(P.coef(k), k, qty)));
  }

  // ln β con la base más pequeña posible: ln 8 → 3·ln 2
  function lnBase(al, be) {
    if (be < 1) { al = -al; be = 1 / be; }
    for (let k = 6; k >= 2; k--) {
      const id = identify(be ** (1 / k), false);
      if (id && id.r === 1 && id.d <= 20 && id.n <= 1000 && id.n !== id.d) return { al: al * k, be: id.n / id.d };
    }
    return { al, be };
  }
  // Un solo logaritmo y algún término algebraico: se saca factor común el coeficiente del
  // logaritmo, como en los solucionarios: −(4σa/ε₀)(3/8 + ln 2), (1/2πε₀)(λ ln 2 − b/4a²)
  function factorLog(P, qty) {
    if (mode === 'si') return null;
    const keys = P.keys(), alg = [], logs = [];
    for (const k of keys) {
      const ex = P.coef(k);
      if (Math.abs(ex.a) > 1e-14) alg.push({ k, v: ex.a });
      for (const t of ex.L) logs.push({ k, ...lnBase(t.al, t.be) });
    }
    if (logs.length !== 1 || !alg.length) return null;
    const lg = logs[0], same = keys.length === 1, eps0 = hasEps(qty) ? 'ε<sub>0</sub>' : '';
    for (const piDen of [true, false]) {
      const al = identify(Math.abs(lg.al) * (piDen ? PI : 1), false);
      if (!al || al.r !== 1 || al.d > 100) continue;
      const be = identify(lg.be, false);
      const items = alg.map((o) => ({ ...o, id: identify(o.v / lg.al, false) }));
      if (!be || items.some((o) => !o.id || o.id.d > 1000)) continue;
      const neg = lg.al < 0, n0 = aExpFor(lg.k, qty);
      // factor de fuera: coeficiente del logaritmo (y símbolos si todos los términos los comparten)
      const top = `${al.n !== 1 || !same ? al.n : ''}${same ? mono(lg.k) + (n0 > 0 ? unitPow(n0) : '') : ''}`;
      const den = `${al.d !== 1 ? al.d : ''}${piDen ? 'π' : ''}${eps0}${same && n0 < 0 ? unitPow(-n0) : ''}`;
      const inside = (k, body, isLn) => {
        if (same) return body;
        const n = aExpFor(k, qty), syms = mono(k) + (n > 0 ? unitPow(n) : '');
        if (isLn) return `${syms}${syms ? ' ' : ''}${body}${n < 0 ? '/' + unitPow(-n) : ''}`;
        return null;
      };
      const parts = items.map((o) => {
        const id = o.id;
        if (same) return { neg: id.s < 0, s: numFrac(Math.abs(o.v / lg.al)) };
        const n = aExpFor(o.k, qty);
        const t = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}`;
        const syms = mono(o.k) + (n > 0 ? unitPow(n) : '');
        return { neg: id.s < 0, s: frac((t === '1' && syms ? '' : t) + syms, `${id.d !== 1 ? id.d : ''}${n < 0 ? unitPow(-n) : ''}`) };
      });
      const lnS = { neg: false, s: inside(lg.k, `ln ${niceInline(be, false)}`, true), ln: true };
      // primero los términos positivos; si todos lo son, los algebraicos delante del logaritmo
      const all = [...parts, lnS];
      if (all.every((p) => !p.neg)) all.sort((x, y) => (x.ln ? 1 : 0) - (y.ln ? 1 : 0));
      else all.sort((x, y) => (x.neg ? 1 : 0) - (y.neg ? 1 : 0));
      const inner = all.map((p, i) => (i === 0 ? (p.neg ? MINUS : '') : p.neg ? ` ${MINUS} ` : ' + ') + p.s).join('');
      return `${neg ? MINUS : ''}${frac(top || '1', den)}·(${inner})`;
    }
    return null;
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // Suma de varios símbolos con el mismo denominador πε₀: se saca factor común el término
  // con menor potencia de la unidad, como en los solucionarios: (1/2πε₀a)(λ − 2b/(3a²√3))
  function factorSum(P, qty) {
    if (mode === 'si') return null;
    const keys = P.keys();
    if (keys.length < 2 || keys.some((k) => P.coef(k).L.length || !k)) return null;
    const ts = keys.map((k) => ({ k, v: P.coef(k).a, n: aExpFor(k, qty) }));
    const lead = ts.reduce((b, t) => (t.n > b.n || (t.n === b.n && t.v > b.v) ? t : b));
    const L = identify(Math.abs(lead.v) * PI, false);
    if (!L || L.r !== 1 || L.d > 100) return null;
    const inner = [];
    for (const t of ts) {
      const syms = mono(t.k), dn = t.n - lead.n, r = t.v / lead.v;
      if (t === lead) { inner.unshift({ neg: false, s: syms, lead: true }); continue; }
      const id = identify(Math.abs(r), false);
      if (!id || id.d > 1000) return null;
      // radical en el denominador cuando la fracción lo permite: 2√3/9 → 2/(3√3)
      let top = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}`, den = `${id.d !== 1 ? id.d : ''}`;
      if (id.r > 1 && id.d % id.r === 0) { top = `${id.n}`; den = `${id.d / id.r !== 1 ? id.d / id.r : ''}`; }
      const radDen = id.r > 1 && id.d % id.r === 0 ? '√' + id.r : '';
      const num = (top === '1' ? '' : top) + syms + (dn > 0 ? unitPow(dn) : '');
      inner.push({ neg: r < 0, s: frac(num || '1', `${den}${dn < 0 ? unitPow(-dn) : ''}${radDen}`) });
    }
    inner.sort((x, y) => (x.neg ? 1 : 0) - (y.neg ? 1 : 0));
    const den = `${L.d !== 1 ? L.d : ''}π${hasEps(qty) ? 'ε<sub>0</sub>' : ''}${lead.n < 0 ? unitPow(-lead.n) : ''}`;
    const top = `${L.n}${lead.n > 0 ? unitPow(lead.n) : ''}`;
    const body = inner.map((p, i) => (i === 0 ? (p.neg ? MINUS : '') : p.neg ? ` ${MINUS} ` : ' + ') + p.s).join('');
    return { neg: lead.v < 0, html: `${frac(top, den)}·(${body})` };
  }
  // vector de Poly, factorizando cuando hay un único monomio
  // opts.unitForm: si los radicales de las componentes no coinciden, escribe |v|·(û)
  function vec(vp, qty, opts = {}) {
    const keys = [...new Set(vp.flatMap((p) => p.keys()))];
    const comps = ['x', 'y', 'z'];
    if (!keys.length) return '0';
    if (mode === 'si' && keys.length === 1) {
      const k = keys[0], f = siFactor(qty);
      return `(${vp.map((p) => dec(p.coef(k).value() * f)).join(', ')})${k ? '·' + mono(k) : ''} <span class="unit">${siUnit(qty)}</span>`;
    }
    if (keys.length === 1) {
      const key = keys[0];
      const exs = vp.map((p) => p.coef(key));
      if (exs.every((e) => !e.L.length)) {
        for (const piDen of [true, false]) {
          const k = piDen ? PI : 1;
          const ids = exs.map((e) => identify(e.a * k, false));
          if (ids.some((x) => !x)) continue;
          const nz = ids.map((id, i) => ({ id, i })).filter((o) => o.id.n !== 0);
          if (!nz.length) return '0';
          const L = nz.reduce((l, o) => (l * o.id.d) / gcd(l, o.id.d), 1);
          const ints = nz.map((o) => (o.id.n * L) / o.id.d);
          let g = ints.reduce((a, b) => gcd(a, b), 0);
          const neg = nz.every((o) => o.id.s < 0);
          const n = aExpFor(key, qty);
          // si hay un solo componente o todos llevan el mismo radical, el radical sale fuera
          const single = nz.length === 1;
          const r0 = nz[0].id.r, sameRad = r0 > 1 && nz.every((o) => o.id.r === r0);
          if (opts.unitForm && !sameRad && !single && nz.some((o) => o.id.r !== r0)) {
            const m = Math.hypot(...exs.map((e) => e.a)), mid = identify(m * k, false);
            const us = nz.map((o) => identify(exs[o.i].a / m, false));
            if (mid && mid.r === 1 && us.every((u) => u && u.d <= 20)) {
              const syms = mono(key) + (n > 0 ? unitPow(n) : '');
              const den = `${mid.d !== 1 ? mid.d : ''}${piDen ? 'π' : ''}${hasEps(qty) ? 'ε<sub>0</sub>' : ''}${n < 0 ? unitPow(-n) : ''}`;
              const inner = nz.map((o, j) => (j === 0 ? (us[j].s < 0 ? MINUS : '') : us[j].s < 0 ? ` ${MINUS} ` : ' + ') + numFrac(Math.abs(exs[o.i].a / m)) + ' ' + uv(comps[o.i])).join('');
              return `${frac(`${mid.n !== 1 || !syms ? mid.n : ''}${syms}`, den)}·(${inner})`;
            }
          }
          const rad = (single || sameRad) && r0 > 1 ? '√' + r0 : '';
          const syms = mono(key) + (n > 0 ? unitPow(n) : '');
          const top = `${g !== 1 || (!syms && !rad) ? g : ''}${rad}${syms}`;
          const den = `${L !== 1 ? L : ''}${piDen ? 'π' : ''}${hasEps(qty) ? 'ε<sub>0</sub>' : ''}${n < 0 ? unitPow(-n) : ''}`;
          const front = (neg ? MINUS : '') + frac(top, den);
          if (single) return `${front} ${uv(comps[nz[0].i])}`;
          const inner = nz.map((o, j) => {
            const m = ints[j] / g;
            const sgn = (o.id.s < 0) !== neg;
            const r = sameRad ? 1 : o.id.r;
            const c = `${m !== 1 || r === 1 ? m : ''}${r > 1 ? '√' + r : ''}`;
            const c2 = m === 1 && r === 1 ? '' : c;
            return (j === 0 ? (sgn ? MINUS : '') : sgn ? ` ${MINUS} ` : ' + ') + c2 + ' ' + uv(comps[o.i]);
          }).join('');
          return `${front}·(${inner})`;
        }
      }
    }
    // caso general: componente a componente
    return joinTerms(vp.map((p, i) => {
      if (p.isZero()) return null;
      if (p.keys().length === 1) { const t = term(p.coef(p.keys()[0]), p.keys()[0], qty); return { neg: t.neg, html: `${t.html} ${uv(comps[i])}` }; }
      const fs = factorSum(p, qty);
      if (fs) return { neg: fs.neg, html: `${fs.html} ${uv(comps[i])}` };
      return { neg: false, html: `(${poly(p, qty)}) ${uv(comps[i])}` };
    }).filter(Boolean));
  }
  // módulo de un vector de un solo monomio
  function modulus(vp, qty) {
    const keys = [...new Set(vp.flatMap((p) => p.keys()))];
    if (keys.length !== 1) return null;
    const exs = vp.map((p) => p.coef(keys[0]));
    if (exs.some((e) => e.L.length)) return null;
    const m = Math.hypot(...exs.map((e) => e.a));
    if (mode === 'si') return `${dec(m * siFactor(qty))}${keys[0] ? '·' + mono(keys[0]) : ''} <span class="unit">${siUnit(qty)}</span>`;
    return term(new Engine.Ex(m), keys[0], qty).html;
  }

  return { setContext, aExpFor, hasEps, getMode: () => mode, sym, mono, frac, uv, num, numFrac, dec, vecNum, pt, poly, vec, modulus, term, joinTerms, esc, unitPow, MINUS, getUnit: () => unit };
})();


/* =====================================================================
   Física: tipos de fuente, superposición, incógnitas y preguntas.
   Para añadir un tipo de fuente nuevo basta con añadir una entrada a
   SOURCES; para una pregunta nueva, una entrada a ANALYSES.
   ===================================================================== */
const Physics = (() => {
  const { PI, parseExpr, V3, Ex, Poly, VP, KINDS } = Engine;
  const F = Fmt;
  const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const AXI = { x: 0, y: 1, z: 2 };
  const uvAxis = (k, sgn = 1) => (sgn < 0 ? F.MINUS : '') + F.uv(k);
  const E_ = 'E<sub></sub>';
  const vecE = (sub) => `<span class="vv">E</span>${sub ? `<sub>${sub}</sub>` : ''}`;
  const eps = 'ε<sub>0</sub>';

  /* --------- densidades no uniformes: ρ(r) = ρ₀ Σ cₙ (r/R)ⁿ --------- */
  const PERFILES = {
    uniforme: { t: [[0, 1]], txt: 'ρ' },
    lineal: { t: [[1, 1]], txt: 'ρ<sub>0</sub> r/R' },
    inversa: { t: [[-1, 1]], txt: 'ρ<sub>0</sub> R/r' },
    resta: { t: [[0, 1], [1, -1]], txt: 'ρ<sub>0</sub>(1 − r/R)' },
    parabola: { t: [[0, 1], [2, -1]], txt: 'ρ<sub>0</sub>(1 − r<sup>2</sup>/R<sup>2</sup>)' },
  };
  const PERF_OPC = [['uniforme', 'uniforme'], ['lineal', 'ρ₀·r/R (crece)'], ['inversa', 'ρ₀·R/r'], ['resta', 'ρ₀·(1 − r/R)'], ['parabola', 'ρ₀·(1 − r²/R²)']];
  const perfil = (src) => PERFILES[src.perfil] || PERFILES.uniforme;
  // ∫_{R1}^{r} rʹ^(n+k−1) dr / R^n para cada término (k = 3 en esferas, 2 en cilindros)
  const momento = (pf, R, R1, r, k) => pf.t.reduce((acc, [n, c]) => acc + (c * (r ** (n + k) - R1 ** (n + k))) / ((n + k) * R ** n), 0);
  // inducción en una corteza conductora: si una fuente con carga total Q está dentro del hueco, su efecto fuera del
  // hueco es el de una corteza de carga Q en el radio exterior (−Q en la cara interior, +Q en la exterior)
  function conInduccion(def, ind) {
    const d = Object.create(def);
    const dentro = (X) => V3.norm(V3.sub(X, ind.pos));
    d.E = function (g, X) {
      const r = dentro(X);
      if (r < ind.R1 - 1e-12) return def.E.call(this, g, X);
      if (r < ind.R2 - 1e-12) return [0, 0, 0];
      return V3.sc(V3.sub(X, ind.pos), ind.Q / (4 * PI * r ** 3));
    };
    d.V = function (g, X) {
      const r = dentro(X);
      if (r < ind.R1 - 1e-12) { const v = def.V.call(this, g, X); return v && v.add(new Ex(-ind.Q / (4 * PI * ind.R1) + ind.Q / (4 * PI * ind.R2))); }
      return new Ex(ind.Q / (4 * PI * Math.max(r, ind.R2)));
    };
    d.explainE = function (g, X, nm) {
      const r = dentro(X), L = r < ind.R1 - 1e-12 ? def.explainE.call(this, g, X, nm) : [];
      L.push(r < ind.R1 - 1e-12 ? `Está dentro del hueco de la corteza conductora: la carga inducida en su cara interior (−Q) no crea campo en el hueco porque la carga está centrada.`
        : r < ind.R2 - 1e-12 ? `P está dentro del conductor: la carga −Q inducida en la cara interior anula el campo de ${nm} (E = 0).`
          : `Fuera de la corteza conductora, ${nm} y la carga −Q inducida en la cara interior se anulan; queda la +Q de la cara exterior: ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, con Q = ${F.num(ind.Q / (ind.Q || 1))}·(carga de ${nm}).`);
      return L;
    };
    return d;
  }
  // campo y potencial de una curva cargada (λ(s) ds) por cuadratura de Gauss-Legendre por tramos
  function curva(pt, lam, s0, s1, X, tramos = 16) {
    const { x, w } = Engine.gl(24);
    let E = [0, 0, 0], V = 0;
    for (let k = 0; k < tramos; k++) {
      const a = s0 + ((s1 - s0) * k) / tramos, b = s0 + ((s1 - s0) * (k + 1)) / tramos;
      for (let i = 0; i < x.length; i++) {
        const t = (a + b) / 2 + ((b - a) / 2) * x[i], wt = ((b - a) / 2) * w[i] * lam(t);
        const r = V3.sub(X, pt.p(t)), n = V3.norm(r);
        if (n < 1e-9) return null;
        E = V3.add(E, V3.sc(r, (wt * pt.ds(t)) / (4 * PI * n ** 3))); V += (wt * pt.ds(t)) / (4 * PI * n);
      }
    }
    // los ceros por simetría salen como 1e-17: se limpian para que el resultado sea exacto
    const m = V3.norm(E);
    return { E: E.map((c) => (Math.abs(c) < 1e-11 * m ? 0 : c)), V };
  }

  /* --------------------------- FUENTES --------------------------- */
  const SOURCES = {
    point: {
      label: 'Carga puntual', short: 'Carga', kind: 'q', prefix: 'q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Posición' }],
      defaults: () => ({ pos: ['0', '0', '0'], s: { c: '1', sym: 'q' } }),
      geom: (src, P) => ({ pos: src.pos.map(P) }),
      E(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        if (n < 1e-9) return null;
        return V3.sc(r, 1 / (4 * PI * n ** 3));
      },
      V(g, X) { const n = V3.norm(V3.sub(X, g.pos)); return n < 1e-9 ? null : new Ex(1 / (4 * PI * n)); },
      explainE(g, X, nm) {
        const r = V3.sub(X, g.pos);
        return [`<span class="vv">r</span> = P − <span class="vv">r</span><sub>${nm}</sub> = ${F.vecNum(r)}, &nbsp;|<span class="vv">r</span>| = ${F.num(V3.norm(r))}`,
          `${vecE()} = ${F.frac('q <span class="vv">r</span>', `4π${eps}|<span class="vv">r</span>|<sup>3</sup>`)}`];
      },
      explainV(g, A, B) {
        return `V = ${F.frac('q', `4π${eps}r`)}, &nbsp; r<sub>A</sub> = ${F.num(V3.norm(V3.sub(A, g.pos)))}, r<sub>B</sub> = ${F.num(V3.norm(V3.sub(B, g.pos)))}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    line: {
      label: 'Hilo infinito', short: 'Hilo', kind: 'lambda', prefix: 'λ', absV: false,
      fields: [
        { k: 'pos', t: 'vec3', label: 'Pasa por' },
        { k: 'dir', t: 'select', label: 'Paralelo a', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] },
        { k: 'mode', t: 'select', label: 'Carga', structural: true, options: [['lambda', 'lineal λ (hilo fino)'], ['rho', 'volumétrica ρ (cilindro de radio R)'], ['sigma', 'superficial σ (tubo de radio R)']] },
        { k: 'R', t: 'expr', label: 'Radio R', show: (s) => s.mode === 'rho' || s.mode === 'sigma' },
        { k: 'R1', t: 'expr', label: 'Radio interior (0 = macizo)', show: (s) => s.mode === 'rho', optional: true },
        { k: 'perfil', t: 'select', label: 'Densidad', options: PERF_OPC, show: (s) => s.mode === 'rho' },
      ],
      defaults: () => ({ pos: ['0', '0', '0'], dir: 'z', mode: 'lambda', R: '1', s: { c: '1', sym: 'lambda' } }),
      kindOf: (src) => (src.mode === 'rho' ? 'rho' : src.mode === 'sigma' ? 'sigma' : 'lambda'),
      geom(src, P) {
        const g = { pos: src.pos.map(P), u: AX[src.dir], dir: src.dir, mode: src.mode, R: src.mode === 'rho' || src.mode === 'sigma' ? P(src.R) : 0, R1: src.mode === 'rho' && String(src.R1 ?? '').trim() ? P(src.R1) : 0, pf: perfil(src) };
        if (g.R1 >= g.R && g.R1 > 0) throw new Error('el radio interior debe ser menor que R');
        return g;
      },
      // carga por unidad de longitud dentro de un radio d (ρ = 1 o σ = 1)
      lam(g, d) { return g.mode === 'sigma' ? (d >= g.R ? 2 * PI * g.R : 0) : 2 * PI * momento(g.pf, g.R, g.R1, Math.min(Math.max(d, g.R1), g.R), 2); },
      perp(g, X) { const w = V3.sub(X, g.pos); return V3.sub(w, V3.sc(g.u, V3.dot(w, g.u))); },
      E(g, X) {
        const pv = this.perp(g, X), d = V3.norm(pv);
        if (g.mode === 'rho' || g.mode === 'sigma') {
          if (g.mode === 'sigma' && Math.abs(d - g.R) < 1e-9) return null;
          if (d < 1e-12) return [0, 0, 0];
          return V3.sc(pv, this.lam(g, d) / (2 * PI * d * d));
        }
        if (d < 1e-9) return null;
        return V3.sc(pv, 1 / (2 * PI * d * d));
      },
      V(g, X) {
        const d = V3.norm(this.perp(g, X));
        if (g.mode === 'sigma') return d <= g.R ? new Ex(0) : Ex.ln(-g.R, d / g.R);
        if (g.mode === 'rho' && g.pf === PERFILES.uniforme && g.R1 === 0) {
          if (d <= g.R) return new Ex(-d * d / 4);
          return new Ex(-g.R * g.R / 4).add(Ex.ln(-g.R * g.R / 2, d / g.R));
        }
        if (g.mode === 'rho') {
          // V(d) = −∫ E dd con V = 0 en el eje (o en R₁): para cada término ρ₀ cₙ (r/R)ⁿ
          const Vin = (x) => {
            let v = new Ex(0);
            for (const [n, c] of g.pf.t) { const k = c / ((n + 2) * g.R ** n); v = v.add(new Ex((-k * (x ** (n + 2) - g.R1 ** (n + 2))) / (n + 2))); if (g.R1 > 0) v = v.add(Ex.ln(k * g.R1 ** (n + 2), x / g.R1)); }
            return v;
          };
          if (d <= g.R1) return new Ex(0);
          if (d <= g.R) return Vin(d);
          return Vin(g.R).add(Ex.ln(-this.lam(g, g.R) / (2 * PI), d / g.R));
        }
        if (d < 1e-9) return null;
        return Ex.ln(-1 / (2 * PI), d);
      },
      explainE(g, X) {
        const pv = this.perp(g, X), d = V3.norm(pv);
        const L = [`Distancia perpendicular al eje: <span class="vv">d</span> = ${F.vecNum(pv)}, &nbsp;d = ${F.num(d)}`];
        if (g.mode === 'sigma') {
          L.push(d < g.R ? `P está dentro del tubo (d &lt; R = ${F.num(g.R)}): el cilindro de Gauss no encierra carga, ${vecE()} = 0`
            : `P está fuera del tubo (d &gt; R = ${F.num(g.R)}). Gauss: λ = 2πRσ y ${vecE()} = ${F.frac('σ R', `${eps}d`)} û<sub>d</sub>`);
        } else if (g.mode === 'rho' && (g.pf !== PERFILES.uniforme || g.R1 > 0)) {
          const zona = d < g.R1 ? 'en el hueco' : d <= g.R ? 'dentro del cilindro' : 'fuera del cilindro';
          L.push(`ρ(r) = ${g.pf.txt}${g.R1 ? `, entre R<sub>1</sub> = ${F.num(g.R1)} y R = ${F.num(g.R)}` : ''}. P está ${zona} (d = ${F.num(d)}).`);
          L.push(`Gauss en un cilindro de radio d y altura h: ${vecE()} 2π d h = ${F.frac('h', eps)} ∫ ρ(r) 2π r dr ⇒ λ<sub>enc</sub> = ${F.num(this.lam(g, d) / PI)}π (por unidad de ρ<sub>0</sub>) y ${vecE()} = ${F.frac('λ<sub>enc</sub>', `2π${eps}d`)} û<sub>d</sub>`);
        } else if (g.mode === 'rho') {
          L.push(d <= g.R
            ? `P está dentro del cilindro (d ≤ R = ${F.num(g.R)}). Gauss: ${vecE()} = ${F.frac('ρ d', `2${eps}`)} û<sub>d</sub>`
            : `P está fuera del cilindro (d &gt; R = ${F.num(g.R)}). Gauss: ${vecE()} = ${F.frac('ρ R<sup>2</sup>', `2${eps}d`)} û<sub>d</sub>`);
        } else L.push(`${vecE()} = ${F.frac('λ', `2π${eps}d`)} û<sub>d</sub>`);
        return L;
      },
      explainV(g, A, B) {
        const dA = V3.norm(this.perp(g, A)), dB = V3.norm(this.perp(g, B));
        const ds = `d<sub>A</sub> = ${F.num(dA)}, d<sub>B</sub> = ${F.num(dB)}`;
        if (g.mode === 'sigma') return `V constante dentro del tubo y V<sub>B</sub> − V<sub>A</sub> = −${F.frac('σR', eps)} ln${F.frac('d<sub>B</sub>', 'd<sub>A</sub>')} fuera; ${ds}`;
        if (g.mode === 'rho') return `Integrando ${vecE()} de A a B (${g.pf === PERFILES.uniforme && !g.R1 ? `dentro: ${F.frac('ρd', `2${eps}`)}, fuera: ${F.frac('ρR<sup>2</sup>', `2${eps}d`)}` : `con ρ(r) = ${g.pf.txt}`}); ${ds}`;
        return `V<sub>B</sub> − V<sub>A</sub> = −${F.frac('λ', `2π${eps}`)} ln${F.frac('d<sub>B</sub>', 'd<sub>A</sub>')}, &nbsp; ${ds}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    plane: {
      label: 'Plano infinito', short: 'Plano', kind: 'sigma', prefix: 'σ', absV: false,
      fields: [
        { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['x', 'eje X (plano x = cte)'], ['y', 'eje Y (plano y = cte)'], ['z', 'eje Z (plano z = cte)']] },
        { k: 'at', t: 'expr', label: 'Posición (cte)' },
      ],
      defaults: () => ({ axis: 'x', at: '0', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ k: src.axis, i: AXI[src.axis], c: P(src.at) }),
      E(g, X) {
        const dn = X[g.i] - g.c;
        if (Math.abs(dn) < 1e-12) return null;
        return V3.sc(AX[g.k], Math.sign(dn) / 2);
      },
      V(g, X) { return new Ex(-Math.abs(X[g.i] - g.c) / 2); },
      explainE(g, X) {
        const dn = X[g.i] - g.c;
        return [`P está en ${g.k} = ${F.num(X[g.i])}, ${dn > 0 ? 'por encima' : 'por debajo'} del plano ${g.k} = ${F.num(g.c)}`,
          `${vecE()} = ${F.frac('σ', `2${eps}`)} (${uvAxis(g.k, Math.sign(dn))})`];
      },
      explainV(g, A, B) {
        return `V<sub>B</sub> − V<sub>A</sub> = −${F.frac('σ', `2${eps}`)}(|${g.k}<sub>B</sub> − ${F.num(g.c)}| − |${g.k}<sub>A</sub> − ${F.num(g.c)}|)`;
      },
      anchors: () => [],
    },

    slab: {
      label: 'Lámina gruesa', short: 'Lámina', kind: 'rho', prefix: 'ρ', absV: false,
      fields: [
        { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['x', 'eje X'], ['y', 'eje Y'], ['z', 'eje Z']] },
        { k: 'at', t: 'expr', label: 'Plano central' },
        { k: 'w', t: 'expr', label: 'Anchura' },
      ],
      defaults: () => ({ axis: 'x', at: '0', w: '2', s: { c: '1', sym: 'rho' } }),
      geom: (src, P) => ({ k: src.axis, i: AXI[src.axis], c: P(src.at), w: P(src.w) }),
      E(g, X) {
        const dn = X[g.i] - g.c;
        const m = Math.abs(dn) <= g.w / 2 ? dn : (Math.sign(dn) * g.w) / 2;
        return V3.sc(AX[g.k], m);
      },
      V(g, X) {
        const dn = Math.abs(X[g.i] - g.c);
        return new Ex(dn <= g.w / 2 ? -dn * dn / 2 : -(g.w / 2) * dn + (g.w * g.w) / 8);
      },
      explainE(g, X) {
        const dn = X[g.i] - g.c;
        const inside = Math.abs(dn) <= g.w / 2;
        return [`Distancia al plano central: ${g.k} − ${F.num(g.c)} = ${F.num(dn)} (semianchura ${F.num(g.w / 2)})`,
          inside ? `P está dentro: ${vecE()} = ${F.frac('ρ d', eps)} ${F.uv(g.k)} con d = ${F.num(dn)}`
            : `P está fuera: ${vecE()} = ${F.frac('ρ w', `2${eps}`)} (${uvAxis(g.k, Math.sign(dn))})`];
      },
      explainV(g, A, B) {
        return `Integrando ${vecE()} a lo largo de ${g.k} (dentro ${F.frac('ρd', eps)}, fuera ${F.frac('ρw', `2${eps}`)})`;
      },
      anchors: () => [],
    },

    sphere: {
      label: 'Esfera / corona', short: 'Esfera', kind: 'rho', prefix: 'ρ', absV: true,
      fields: [
        { k: 'pos', t: 'vec3', label: 'Centro' },
        { k: 'R1', t: 'expr', label: 'Radio interior (0 = maciza)' },
        { k: 'R2', t: 'expr', label: 'Radio exterior' },
        { k: 'perfil', t: 'select', label: 'Densidad', options: PERF_OPC },
      ],
      defaults: () => ({ pos: ['0', '0', '0'], R1: '0', R2: '1', perfil: 'uniforme', s: { c: '1', sym: 'rho' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R1: P(src.R1), R2: P(src.R2), pf: perfil(src) }),
      Q: (g, r) => 4 * PI * momento(g.pf, g.R2, g.R1, Math.min(Math.max(r, g.R1), g.R2), 3),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < 1e-12) return [0, 0, 0];
        return V3.sc(rv, this.Q(g, r) / (4 * PI * r ** 3));
      },
      V(g, X) {
        const r = Math.max(V3.norm(V3.sub(X, g.pos)), g.R1);
        const Qt = this.Q(g, g.R2);
        if (r >= g.R2) return new Ex(Qt / (4 * PI * r));
        // V(r) = V(R₂) + ∫_r^{R₂} Q(rʹ)/(4π rʹ²) drʹ, término a término
        const sum = g.pf.t.reduce((acc, [n, c]) => acc + (c / ((n + 3) * g.R2 ** n)) * ((g.R2 ** (n + 2) - r ** (n + 2)) / (n + 2) + (g.R1 > 0 ? g.R1 ** (n + 3) * (1 / g.R2 - 1 / r) : 0)), 0);
        return new Ex(Qt / (4 * PI * g.R2) + sum);
      },
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        const zone = r >= g.R2 ? 'exterior' : r >= g.R1 ? (g.R1 ? 'dentro de la corona' : 'interior') : 'hueco interior';
        return [`r = |P − C| = ${F.num(r)} → región: ${zone}`,
          g.pf === PERFILES.uniforme ? `Gauss: ${vecE()} = ${F.frac('Q<sub>enc</sub>(r)', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, &nbsp;Q<sub>enc</sub> = ρ·${F.frac('4π', '3')}(r<sub>c</sub><sup>3</sup> − R<sub>1</sub><sup>3</sup>) = ${F.num(this.Q(g, r) / PI)}π ρ`
            : `Densidad no uniforme ρ(r) = ${g.pf.txt.replace(/R/g, 'R<sub>2</sub>')}. Gauss: ${vecE()} = ${F.frac('Q<sub>enc</sub>(r)', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, &nbsp;Q<sub>enc</sub> = ∫ ρ(rʹ) 4π rʹ<sup>2</sup> drʹ = ${F.num(this.Q(g, r) / PI)}π ρ<sub>0</sub>`];
      },
      explainV(g, A, B) {
        return `V(r) por Gauss (V(∞) = 0), &nbsp; r<sub>A</sub> = ${F.num(V3.norm(V3.sub(A, g.pos)))}, r<sub>B</sub> = ${F.num(V3.norm(V3.sub(B, g.pos)))}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    shell: {
      label: 'Esfera hueca (σ)', short: 'Cascarón', kind: 'sigma', prefix: 'σ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], R: '1', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R: P(src.R) }),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R - 1e-12) return [0, 0, 0];
        return V3.sc(rv, (g.R * g.R) / r ** 3);
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(r >= g.R ? (g.R * g.R) / r : g.R); },
      Qtot: (g) => 4 * PI * g.R * g.R,
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`r = |P − C| = ${F.num(r)}, R = ${F.num(g.R)} → ${r < g.R ? 'dentro' : 'fuera'}`,
          r < g.R ? `Gauss: no hay carga encerrada → ${vecE()} = 0` : `Gauss: ${vecE()} = ${F.frac('σR<sup>2</sup>', `${eps}r<sup>2</sup>`)} û<sub>r</sub> &nbsp;(Q = 4πR²σ)`];
      },
      explainV() { return `V = ${F.frac('σR<sup>2</sup>', `${eps}r`)} fuera, V = ${F.frac('σR', eps)} dentro (constante)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    conductor: {
      label: 'Esfera conductora (Q)', short: 'Conductor', kind: 'q', prefix: 'Q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], R: '1', s: { c: '1', sym: 'q' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R: P(src.R) }),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R - 1e-12) return [0, 0, 0];
        return V3.sc(rv, 1 / (4 * PI * r ** 3));
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(1 / (4 * PI * Math.max(r, g.R))); },
      Qtot: () => 1,
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`Conductor en equilibrio: la carga se reparte por la superficie y el interior es equipotencial.`,
          r < g.R ? `r = ${F.num(r)} &lt; R → ${vecE()} = 0` : `r = ${F.num(r)} ≥ R → ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>`];
      },
      explainV() { return `V = ${F.frac('Q', `4π${eps}r`)} fuera; V = ${F.frac('Q', `4π${eps}R`)} en todo el conductor`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    ring: {
      label: 'Anillo (λ)', short: 'Anillo', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Eje del anillo', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', s: { c: '1', sym: 'lambda' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), n: AX[src.axis], axis: src.axis, R: P(src.R) }),
      Qtot: (g) => 2 * PI * g.R,
      E(g, X) { const r = ringAt(g.R, 2 * PI * g.R, g, X); return r && r.E; },
      V(g, X) { const r = ringAt(g.R, 2 * PI * g.R, g, X); return r && new Ex(r.V); },
      explainE(g, X) {
        const { z, rho } = local(g, X);
        return rho < 1e-9 ? [`P está sobre el eje, a z = ${F.num(z)} del centro`, `${vecE()} = ${F.frac('λR z', `2${eps}(z<sup>2</sup> + R<sup>2</sup>)<sup>3/2</sup>`)} n̂`]
          : [`P está fuera del eje (ρ = ${F.num(rho)}, z = ${F.num(z)}): el campo se obtiene con integrales elípticas K(m), E(m) (resultado numérico).`];
      },
      explainV() { return `En el eje: V = ${F.frac('λR', `2${eps}√(z<sup>2</sup> + R<sup>2</sup>)`)}`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    disk: {
      label: 'Disco (σ)', short: 'Disco', kind: 'sigma', prefix: 'σ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Eje del disco', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), n: AX[src.axis], axis: src.axis, R: P(src.R) }),
      Qtot: (g) => PI * g.R * g.R,
      E(g, X) { const r = diskAt(g, X, true); return r && r.E; },
      V(g, X) { const r = diskAt(g, X, false); return r && new Ex(r.V); },
      explainE(g, X) {
        const { z, rho } = local(g, X);
        return rho < 1e-9 ? [`P está sobre el eje, a z = ${F.num(z)} del centro`, `${vecE()} = ${F.frac('σ', `2${eps}`)}(1 − ${F.frac('|z|', '√(z<sup>2</sup> + R<sup>2</sup>)')}) (±n̂)`]
          : [`P está fuera del eje (ρ = ${F.num(rho)}, z = ${F.num(z)}): se suman anillos de radio r′ (integración numérica).`];
      },
      explainV() { return `En el eje: V = ${F.frac('σ', `2${eps}`)}(√(z<sup>2</sup> + R<sup>2</sup>) − |z|)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    rod: {
      label: 'Varilla finita', short: 'Varilla', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'A', t: 'vec3', label: 'Extremo 1' }, { k: 'B', t: 'vec3', label: 'Extremo 2' }, { k: 'perfil', t: 'select', label: 'Densidad', options: [['uniforme', 'uniforme λ'], ['lineal', 'λ₀·s/L (0 en el extremo 1)'], ['resta', 'λ₀·(1 − s/L)']] }],
      defaults: () => ({ A: ['0', '0', '0'], B: ['0', '1', '0'], perfil: 'uniforme', s: { c: '1', sym: 'lambda' } }),
      geom(src, P) {
        const A = src.A.map(P), B = src.B.map(P), L = V3.norm(V3.sub(B, A)), perfil = ['lineal', 'resta'].includes(src.perfil) ? src.perfil : 'uniforme';
        return { A, B, L, u: V3.unit(V3.sub(B, A)), perfil };
      },
      Qtot: (g) => (g.perfil === 'uniforme' ? g.L : g.L / 2),
      // densidad no uniforme: se integra a lo largo de la varilla
      noUni(g, X) {
        const lam = g.perfil === 'lineal' ? (t) => t / g.L : (t) => 1 - t / g.L;
        return curva({ p: (t) => V3.add(g.A, V3.sc(g.u, t)), ds: () => 1 }, lam, 0, g.L, X);
      },
      loc(g, X) {
        const w = V3.sub(X, g.A), s = V3.dot(w, g.u), pv = V3.sub(w, V3.sc(g.u, s));
        return { s, pv, d: V3.norm(pv), rA: V3.norm(w), rB: V3.norm(V3.sub(X, g.B)) };
      },
      E(g, X) {
        const { s, pv, d, rA, rB } = this.loc(g, X);
        if (rA < 1e-9 || rB < 1e-9 || (d < 1e-9 && s >= 0 && s <= g.L)) return null;
        if (g.perfil !== 'uniforme') { const c = this.noUni(g, X); return c && c.E; }
        let E = V3.sc(g.u, 1 / rB - 1 / rA);
        if (d > 1e-12) E = V3.add(E, V3.sc(pv, (s / rA - (s - g.L) / rB) / (d * d)));
        return V3.sc(E, 1 / (4 * PI));
      },
      V(g, X) {
        const { s, d, rA, rB } = this.loc(g, X);
        if (d < 1e-9 && s >= 0 && s <= g.L) return null;
        if (g.perfil !== 'uniforme') { const c = this.noUni(g, X); return c && new Ex(c.V); }
        let n = rA + s, m = rB + s - g.L;
        if (n < 1e-9 || m < 1e-9) { n = rB - s + g.L; m = rA - s; }
        return Ex.ln(1 / (4 * PI), n / m);
      },
      explainE(g, X) {
        if (g.perfil !== 'uniforme') return [`Densidad no uniforme λ(s) = ${g.perfil === 'lineal' ? 'λ<sub>0</sub> s/L' : 'λ<sub>0</sub>(1 − s/L)'}, con s medido desde el extremo 1 (L = ${F.num(g.L)}).`, `d<span class="vv">E</span> = ${F.frac('λ(s) ds', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>: se integra a lo largo de la varilla (con λ(s) lineal, cada componente es una integral elemental; aquí se hace numéricamente).`];
        
        const { s, d, rA, rB } = this.loc(g, X);
        return [`Longitud L = ${F.num(g.L)}; proyección de P sobre la varilla s = ${F.num(s)}, distancia d = ${F.num(d)}, r<sub>1</sub> = ${F.num(rA)}, r<sub>2</sub> = ${F.num(rB)}`,
          `Integrando d<span class="vv">E</span> = ${F.frac('λ dl', `4π${eps}r<sup>2</sup>`)}: E<sub>∥</sub> = ${F.frac('λ', `4π${eps}`)}(${F.frac(1, 'r<sub>2</sub>')} − ${F.frac(1, 'r<sub>1</sub>')}), E<sub>⊥</sub> = ${F.frac('λ', `4π${eps}d`)}(${F.frac('s', 'r<sub>1</sub>')} − ${F.frac('s − L', 'r<sub>2</sub>')})`];
      },
      explainV(g) { return g.perfil !== 'uniforme' ? `V = ∫ ${F.frac('λ(s) ds', `4π${eps}r`)} con λ(s) = ${g.perfil === 'lineal' ? 'λ<sub>0</sub> s/L' : 'λ<sub>0</sub>(1 − s/L)'} (integral numérica)` : `V = ${F.frac('λ', `4π${eps}`)} ln${F.frac('r<sub>1</sub> + s', 'r<sub>2</sub> + s − L')}`; },
      anchors: (src, g) => [{ path: ['A'], at: g.A }, { path: ['B'], at: g.B }],
    },

    arc: {
      label: 'Arco (λ)', short: 'Arco', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['z', 'eje Z (en el plano XY)'], ['y', 'eje Y (en el plano ZX)'], ['x', 'eje X (en el plano YZ)']] }, { k: 'R', t: 'expr', label: 'Radio R' }, { k: 't1', t: 'expr', label: 'Desde el ángulo (°)' }, { k: 't2', t: 'expr', label: 'Hasta el ángulo (°)' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', t1: '0', t2: '180', s: { c: '1', sym: 'lambda' } }),
      geom(src, P) {
        const base = { z: [[1, 0, 0], [0, 1, 0]], y: [[0, 0, 1], [1, 0, 0]], x: [[0, 1, 0], [0, 0, 1]] }[src.axis] || [[1, 0, 0], [0, 1, 0]];
        const t1 = (+String(src.t1).replace(',', '.') * PI) / 180, t2 = (+String(src.t2).replace(',', '.') * PI) / 180;
        if (!isFinite(t1) || !isFinite(t2) || Math.abs(t2 - t1) < 1e-9) throw new Error('los ángulos del arco deben ser números distintos');
        return { pos: src.pos.map(P), axis: src.axis, n: AX[src.axis], e1: base[0], e2: base[1], R: P(src.R), t1: Math.min(t1, t2), t2: Math.max(t1, t2) };
      },
      Qtot: (g) => g.R * (g.t2 - g.t1),
      at(g, X) { return curva({ p: (t) => V3.add(g.pos, V3.add(V3.sc(g.e1, g.R * Math.cos(t)), V3.sc(g.e2, g.R * Math.sin(t)))), ds: () => g.R }, () => 1, g.t1, g.t2, X); },
      E(g, X) { const c = this.at(g, X); return c && c.E; },
      V(g, X) { const c = this.at(g, X); return c && new Ex(c.V); },
      explainE(g, X) {
        const dc = V3.norm(V3.sub(X, g.pos)), ang = F.num(((g.t2 - g.t1) * 180) / PI);
        return dc < 1e-9 ? [`Arco de radio R = ${F.num(g.R)} y ${ang}°; P está en el centro: todos los dl están a la misma distancia R.`, `d<span class="vv">E</span> = ${F.frac('λ R dθ', `4π${eps}R<sup>2</sup>`)}(−û<sub>r</sub>) ⇒ ${vecE()} = ${F.frac('λ', `4π${eps}R`)} ∫(−cos θ, −sen θ) dθ entre ${F.num((g.t1 * 180) / PI)}° y ${F.num((g.t2 * 180) / PI)}°`]
          : [`Arco de radio R = ${F.num(g.R)} y ${ang}°: se suman las contribuciones d<span class="vv">E</span> = ${F.frac('λ dl', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub> a lo largo del arco (integral numérica).`];
      },
      explainV(g) { return `V = ∫ ${F.frac('λ dl', `4π${eps}r`)}; en el centro, V = ${F.frac('λ θ', `4π${eps}`)} con θ = ${F.num(g.t2 - g.t1)} rad`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    hollow: {
      label: 'Corteza conductora (R₁–R₂)', short: 'Corteza', kind: 'q', prefix: 'Q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R1', t: 'expr', label: 'Radio interior R₁' }, { k: 'R2', t: 'expr', label: 'Radio exterior R₂' }],
      defaults: () => ({ pos: ['0', '0', '0'], R1: '1', R2: '2', s: { c: '1', sym: 'q' } }),
      geom(src, P) { const g = { pos: src.pos.map(P), R1: P(src.R1), R2: P(src.R2) }; if (!(g.R2 > g.R1 && g.R1 > 0)) throw new Error('debe ser 0 < R₁ < R₂'); return g; },
      Qtot: () => 1,
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R2 - 1e-12) return [0, 0, 0];
        return V3.sc(rv, 1 / (4 * PI * r ** 3));
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(1 / (4 * PI * Math.max(r, g.R2))); },
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`Corteza conductora en equilibrio: su carga neta Q va a la cara exterior (R<sub>2</sub> = ${F.num(g.R2)}); en la interior (R<sub>1</sub> = ${F.num(g.R1)}) solo aparece la carga inducida por lo que haya en el hueco.`,
          r < g.R2 ? `r = ${F.num(r)} &lt; R<sub>2</sub> → la carga neta de la cara exterior no crea campo dentro` : `r = ${F.num(r)} ≥ R<sub>2</sub> → ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>`];
      },
      explainV() { return `V = ${F.frac('Q', `4π${eps}r`)} fuera; V = ${F.frac('Q', `4π${eps}R<sub>2</sub>`)} en el conductor y en el hueco (por su carga neta)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    dipole: {
      label: 'Dipolo (fuente)', short: 'Dipolo', kind: 'p', prefix: 'p', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Posición' }, { k: 'p', t: 'vec3', label: 'Dirección de p (× símbolo)' }],
      defaults: () => ({ pos: ['0', '0', '0'], p: ['1', '0', '0'], s: { c: '1', sym: 'p' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), p: src.p.map(P) }),
      E(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        if (n < 1e-9) return null;
        const u = V3.sc(r, 1 / n);
        return V3.sc(V3.sub(V3.sc(u, 3 * V3.dot(g.p, u)), g.p), 1 / (4 * PI * n ** 3));
      },
      V(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        return n < 1e-9 ? null : new Ex(V3.dot(g.p, r) / (4 * PI * n ** 3));
      },
      explainE(g, X) {
        const r = V3.sub(X, g.pos);
        return [`<span class="vv">p</span> ∝ ${F.vecNum(g.p)}; <span class="vv">r</span> = ${F.vecNum(r)}, |<span class="vv">r</span>| = ${F.num(V3.norm(r))}`,
          `${vecE()} = ${F.frac(`3(<span class="vv">p</span>·û<sub>r</sub>)û<sub>r</sub> − <span class="vv">p</span>`, `4π${eps}r<sup>3</sup>`)}`];
      },
      explainV() { return `V = ${F.frac('<span class="vv">p</span>·<span class="vv">r</span>', `4π${eps}r<sup>3</sup>`)}`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },
  };

  /* --------- geometría local para anillos y discos --------- */
  function local(g, X) {
    const w = V3.sub(X, g.pos), z = V3.dot(w, g.n), pv = V3.sub(w, V3.sc(g.n, z)), rho = V3.norm(pv);
    return { z, rho, er: rho > 0 ? V3.sc(pv, 1 / rho) : [0, 0, 0] };
  }
  // anillo de radio R y carga Q (ε₀ = 1): campo y potencial en X
  function ringRZ(R, Q, rho, z) {
    if (rho < 1e-9 * Math.max(R, 1)) {
      const s = z * z + R * R;
      return { Er: 0, Ez: (Q * z) / (4 * PI * s ** 1.5), V: Q / (4 * PI * Math.sqrt(s)) };
    }
    const s2 = (R + rho) ** 2 + z * z, d2 = (R - rho) ** 2 + z * z;
    if (d2 < 1e-18) return null;
    const m = (4 * R * rho) / s2;
    const [K, E] = Engine.ellipKE(m);
    const pre = (Q / (4 * PI)) * (2 / PI) / Math.sqrt(s2);
    return { V: pre * K, Ez: (pre * z * E) / d2, Er: (pre / (2 * rho)) * (((rho * rho - R * R - z * z) / d2) * E + K) };
  }
  function ringAt(R, Q, g, X) {
    const { z, rho, er } = local(g, X);
    const r = ringRZ(R, Q, rho, z);
    if (!r) return null;
    return { E: V3.add(V3.sc(g.n, r.Ez), V3.sc(er, r.Er)), V: r.V };
  }
  function diskAt(g, X, needE) {
    const { z, rho, er } = local(g, X), R = g.R;
    if (rho < 1e-9) {
      const s = Math.sqrt(z * z + R * R);
      if (Math.abs(z) < 1e-12 && needE) return null;
      return { E: V3.sc(g.n, (Math.sign(z) * (1 - Math.abs(z) / s)) / 2), V: (s - Math.abs(z)) / 2 };
    }
    if (Math.abs(z) < 1e-12 && rho < R && needE) return null;
    const { x, w } = Engine.gl(24);
    const segs = rho < R ? [[0, rho], [rho, R]] : [[0, R]];
    let Er = 0, Ez = 0, V = 0;
    for (const [a, b] of segs) for (let i = 0; i < x.length; i++) {
      const r = (a + b) / 2 + ((b - a) / 2) * x[i], wt = ((b - a) / 2) * w[i];
      const q = ringRZ(r, 2 * PI * r, rho, z);
      if (!q) continue;
      Er += q.Er * wt; Ez += q.Ez * wt; V += q.V * wt;
    }
    return { E: V3.add(V3.sc(g.n, Ez), V3.sc(er, Er)), V };
  }

  /* --------------------------- CONTEXTO --------------------------- */
  function build(scen) {
    const mode = scen.mode === 'si' ? 'si' : 'sym';
    const unit = mode === 'si' ? 'm' : scen.unit || 'a';
    normUnknown(scen);
    const P = (s) => parseExpr(s, unit);
    const errors = [];
    const kinds = {};
    const anyFree = scen.analyses.some((an) => an.unk === 'libre');
    const sources = scen.sources.map((src) => {
      const def = SOURCES[src.type];
      const o = { id: src.id, src, def, name: src.name || def.prefix, kind: def.kindOf ? def.kindOf(src) : def.kind };
      try { o.g = def.geom(src, P); } catch (e) { errors.push(`${o.name}: ${e.message}`); }
      const isUnknown = !!scen.unknown?.srcs?.includes(src.id);
      if (!isUnknown) {
        try { o.S = Poly.sym(src.s.sym, P(src.s.c)); if (!(src.s.sym in kinds)) kinds[src.s.sym] = o.kind; }
        catch (e) { errors.push(`${o.name}: ${e.message}`); }
      } else {
        o.unknown = true;
        // valor como símbolo, para las preguntas que no usan la incógnita despejada
        if (anyFree && src.s?.sym) { try { o.Sfree = Poly.sym(src.s.sym, P(src.s.c || '1')); if (!(src.s.sym in kinds)) kinds[src.s.sym] = o.kind; } catch (e) { /* sin valor simbólico */ } }
      }
      return o;
    });
    // fuentes dentro del hueco de una corteza conductora: su carga se induce en las caras
    for (const h of sources.filter((o) => o.src.type === 'hollow' && o.g)) {
      for (const o of sources) {
        if (o === h || !o.g || !o.g.pos) continue;
        const t = o.src.type, dc = V3.norm(V3.sub(o.g.pos, h.g.pos)), Rs = t === 'sphere' ? o.g.R2 : t === 'point' ? 0 : o.g.R;
        if (!['point', 'sphere', 'shell', 'conductor'].includes(t) || !(dc + Rs < h.g.R1 + 1e-9)) continue;
        if (dc > 1e-9) { errors.push(`${o.name}: dentro de la corteza ${h.name} solo se resuelven cargas centradas (la carga inducida no sería uniforme)`); continue; }
        const Q = t === 'point' ? 1 : t === 'sphere' ? o.def.Q(o.g, o.g.R2) : o.def.Qtot(o.g);
        o.def = conInduccion(o.def, { pos: h.g.pos, R1: h.g.R1, R2: h.g.R2, Q });
        o.inducida = h;
      }
    }
    for (const an of scen.analyses) {
      if (an.Q?.sym && !(an.Q.sym in kinds)) kinds[an.Q.sym] = 'q';
      if (an.sym && !(an.sym in kinds)) kinds[an.sym] = 'p';
    }
    for (const uc of scen.unknown?.conds || []) if (uc.val?.sym && !(uc.val.sym in kinds)) kinds[uc.val.sym] = 'q';
    for (const k in scen.kinds || {}) if (k in kinds) kinds[k] = scen.kinds[k];
    for (const s of sources) if (s.unknown) kinds['§' + s.name] = s.kind;
    delete kinds[''];
    const ctx = { unit, mode, P, sources, kinds, errors, order: scen.order || [] };
    F.setContext(kinds, unit, mode, ctx.order);
    return ctx;
  }
  const nameHTML = (s) => F.sym(s.name);
  const strengthHTML = (s) => (s.S ? F.poly(s.S, s.kind) : '?');
  const headHTML = (s) => { const v = strengthHTML(s), n = nameHTML(s); return v === n ? n : `${n} = ${v}`; };

  function field(ctx, X) {
    let E = VP.zero();
    const parts = [], singular = [];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.E(s.g, X);
      if (!e) { singular.push(s); continue; }
      const Ep = VP.fromNum(s.S, e);
      E = VP.add(E, Ep);
      parts.push({ s, e, Ep });
    }
    return { E, parts, singular };
  }
  function potential(ctx, X) {
    let V = Poly.zero();
    const parts = [], singular = [];
    let absolute = true;
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      if (!s.def.absV) absolute = false;
      const v = s.def.V(s.g, X);
      if (!v) { singular.push(s); continue; }
      const Vp = s.S.scale(v);
      V = V.add(Vp);
      parts.push({ s, v, Vp });
    }
    return { V, parts, singular, absolute };
  }
  function diffV(ctx, A, B) {
    const a = potential(ctx, A), b = potential(ctx, B);
    const parts = [];
    for (const pb of b.parts) {
      const pa = a.parts.find((p) => p.s === pb.s);
      if (pa) parts.push({ s: pb.s, dV: pb.Vp.sub(pa.Vp) });
    }
    return { dV: b.V.sub(a.V), parts, singular: [...a.singular, ...b.singular] };
  }
  // valores numéricos (todos los símbolos = 1) para el dibujo
  function fieldNum(ctx, X) {
    let E = [0, 0, 0];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.E(s.g, X);
      if (!e) return null;
      E = V3.add(E, V3.sc(e, s.Snum ?? (s.Snum = s.S.value())));
    }
    return E;
  }
  function potNum(ctx, X) {
    let v = 0;
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.V(s.g, X);
      if (!e) return NaN;
      v += e.value() * (s.Snum ?? (s.Snum = s.S.value()));
    }
    return v;
  }

  function singularWarn(list) {
    return list.length ? `<div class="warn">El punto está sobre ${list.map(nameHTML).join(', ')}: ahí el campo no está definido y se ha omitido esa contribución.</div>` : '';
  }
  function fieldSteps(ctx, X, F0) {
    const rows = F0.parts.map(({ s, Ep }) => `<li><div class="st-h">${headHTML(s)} <span class="tag">${s.def.label}</span></div>
      ${s.def.explainE(s.g, X, s.name).map((l) => `<div>${l}</div>`).join('')}
      <div class="st-r">${vecE(s.name.replace(/\D/g, '') || '')} = ${F.vec(Ep, 'E')}</div></li>`);
    return `<p>Principio de superposición: ${vecE()}(P) = Σ ${vecE('i')}, con P = ${F.pt(X)}·${F.esc(ctx.unit)}.</p><ol class="steps">${rows.join('')}</ol>
      <div class="st-r">Suma: ${vecE()}(P) = ${F.vec(F0.E, 'E')}</div>`;
  }

  /* --------------------------- INCÓGNITA --------------------------- */
  const CONDS = {
    Ecomp: { label: 'Una componente de E es nula en P', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'comp', t: 'select', label: 'Componente nula', options: [['x', 'E_x = 0'], ['y', 'E_y = 0'], ['z', 'E_z = 0']] }] },
    Epar: { label: 'E en P paralelo a una dirección (dipolo en equilibrio, fuerza paralela…)', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'd', t: 'vec3', label: 'Dirección' }] },
    Ezero: { label: 'E = 0 en P (campo nulo)', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }] },
    dV: { label: 'V_B − V_A tiene un valor dado', fields: [{ k: 'A', t: 'vec3', label: 'Punto A' }, { k: 'B', t: 'vec3', label: 'Punto B' }, { k: 'val', t: 'value', label: 'V_B − V_A =' }] },
    V: { label: 'V en P tiene un valor dado', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'val', t: 'value', label: 'V(P) =' }] },
  };
  // admite el formato antiguo {src, cond} y el nuevo {srcs: [...], conds: [...]}
  function normUnknown(scen) {
    const u = scen.unknown;
    if (!u) return null;
    if (u.src !== undefined && !u.srcs) { scen.unknown = { srcs: u.src ? [u.src] : [], conds: u.cond ? [u.cond] : [] }; }
    scen.unknown.srcs ||= []; scen.unknown.conds ||= [];
    return scen.unknown;
  }
  function solveUnknowns(ctx, scen) {
    const u = scen.unknown;
    if (!u || !u.srcs?.length) return null;
    const us = u.srcs.map((id) => ctx.sources.find((x) => x.id === id)).filter(Boolean);
    if (!us.length) return null;
    if (us.some((s) => !s.g)) return { error: 'Alguna fuente incógnita no está bien definida.' };
    if (!u.conds.length) return { error: 'Añade al menos una condición para despejar la incógnita.' };
    const P = ctx.P;
    const xP = (j, b) => Poly.sym('§' + us[j].name, b);
    const sumX = (bs) => bs.reduce((acc, b, j) => acc.add(xP(j, 1).scale(b)), Poly.zero());
    const rows = []; // { A: Poly, b: [Ex|number], t: Poly }
    const eqs = [];
    try {
      for (const c of u.conds) {
        if (c.type === 'Ecomp' || c.type === 'Ezero' || c.type === 'Epar') {
          const X = c.P.map(P);
          const F0 = field(ctx, X);
          const bs = us.map((s) => s.def.E(s.g, X));
          if (bs.some((b) => !b)) return { error: 'Un punto de condición está sobre una fuente incógnita.' };
          const Ex3 = [0, 1, 2].map((k) => F0.E[k].add(sumX(bs.map((b) => b[k]))));
          const tot = `${vecE()}(${F.pt(X)}) = ${F.vec(Ex3, 'E')}`;
          if (c.type === 'Ecomp') {
            const k = AXI[c.comp];
            rows.push({ A: F0.E[k], b: bs.map((b) => b[k]), t: Poly.zero() });
            eqs.push(`${tot}<br>E<sub>${c.comp}</sub> = 0: ${F.poly(Ex3[k], 'E')} = 0`);
          } else if (c.type === 'Ezero') {
            for (let k = 0; k < 3; k++) rows.push({ A: F0.E[k], b: bs.map((b) => b[k]), t: Poly.zero() });
            eqs.push(`${tot} = <span class="vv">0</span>`);
          } else {
            const d = V3.unit(c.d.map(P)), dv = d.map((v) => Poly.num(v));
            const A = VP.cross(dv, F0.E), bb = bs.map((b) => V3.cross(d, b));
            for (let k = 0; k < 3; k++) rows.push({ A: A[k], b: bb.map((b) => b[k]), t: Poly.zero() });
            const lhs = [0, 1, 2].map((k) => A[k].add(sumX(bb.map((b) => b[k]))));
            eqs.push(`${tot}<br>Paralelo a ${F.vecNum(c.d.map(P))} ⇔ û × ${vecE()} = <span class="vv">0</span>: ${F.vec(lhs, 'E')} = <span class="vv">0</span>`);
          }
        } else {
          const val = c.val?.sym ? Poly.sym(c.val.sym, P(c.val.c || '0')) : Poly.num(P(c.val?.c || '0'));
          if (c.type === 'dV') {
            const Av = c.A.map(P), Bv = c.B.map(P);
            const A = diffV(ctx, Av, Bv).dV;
            const bs = us.map((s) => { const vb = s.def.V(s.g, Bv), va = s.def.V(s.g, Av); return vb && va ? vb.sub(va) : null; });
            if (bs.some((b) => !b)) return { error: 'A o B están sobre una fuente incógnita.' };
            rows.push({ A, b: bs, t: val });
            eqs.push(`V<sub>B</sub> − V<sub>A</sub> = ${F.poly(A.add(sumX(bs)), 'V')} = ${F.poly(val, 'V')}`);
          } else {
            const X = c.P.map(P);
            const pot = potential(ctx, X);
            if (!pot.absolute || us.some((s) => !s.def.absV)) return { error: 'Hay hilos o planos infinitos: el potencial absoluto no está definido. Usa la condición V_B − V_A.' };
            const bs = us.map((s) => s.def.V(s.g, X));
            if (bs.some((b) => !b)) return { error: 'El punto está sobre una fuente incógnita.' };
            rows.push({ A: pot.V, b: bs, t: val });
            eqs.push(`V(${F.pt(X)}) = ${F.poly(pot.V.add(sumX(bs)), 'V')} = ${F.poly(val, 'V')}`);
          }
        }
      }
    } catch (e) { return { error: e.message }; }
    const n = us.length;
    const bnum = (b) => (b instanceof Ex ? b.value() : b);
    const live = rows.filter((r) => r.b.some((b) => Math.abs(bnum(b)) > 1e-13));
    const rhs = live.map((r) => r.t.sub(r.A));
    const out = new Array(n);
    let xHTML = null, check = '';
    // caso de una incógnita y una ecuación con logaritmo: forma exacta (…)/ln β
    if (n === 1 && live.length === 1 && live[0].b[0] instanceof Ex && live[0].b[0].L.length) {
      const b = live[0].b[0];
      if (Math.abs(b.a) < 1e-14 && b.L.length === 1) {
        let { al, be } = b.L[0];
        if (be < 1) { al = -al; be = 1 / be; }
        const xp = rhs[0].scale(1 / al);
        out[0] = xp.scale(1 / Math.log(be));
        xHTML = [F.frac(F.poly(xp, us[0].kind), 'ln ' + F.num(be))];
        // relación entre símbolos, como la dan los solucionarios: σ/λ = −3 ln 2/(2πb)
        const ks = xp.keys(), Y = ks.length === 1 && ks[0] && !ks[0].includes('*') ? ks[0] : null;
        if (Y && ctx.kinds[Y]) {
          const inv = 1 / xp.coef(Y).value(), n = KINDS[ctx.kinds[Y]].m - KINDS[us[0].kind].m;
          for (const piDen of [true, false]) {
            const id = Engine.identify(inv * (piDen ? PI : 1), false);
            if (!id || id.r !== 1) continue;
            const top = `${id.n !== 1 ? id.n + ' ' : ''}ln ${F.num(be)}`;
            const den = `${id.d !== 1 ? id.d : ''}${piDen ? 'π' : ''}${n > 0 ? F.unitPow(n) : ''}`;
            const ratio = `${F.sym(Y)}/${nameHTML(us[0])} = ${id.s < 0 ? F.MINUS : ''}${F.frac(top, den || '')}${n < 0 ? F.unitPow(-n) : ''}`;
            xHTML[0] += ` &nbsp;⇔&nbsp; ${ratio}`;
            break;
          }
        }
      }
    }
    if (!out[0]) {
      if (live.length < n) return { error: `Hay ${n} incógnitas pero solo ${live.length} ecuación(es) útiles: añade condiciones.` };
      const B = live.map((r) => r.b.map((b) => (b instanceof Ex && !b.L.length ? b.a : bnum(b))));
      const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => B.reduce((s, row) => s + row[i] * row[j], 0)));
      const Mi = invert(M);
      if (!Mi) return { error: 'Las condiciones no son independientes: no bastan para determinar las incógnitas.' };
      for (let j = 0; j < n; j++) {
        let x = Poly.zero();
        live.forEach((row, i) => {
          let c = 0;
          for (let k = 0; k < n; k++) c += Mi[j][k] * B[i][k];
          if (Math.abs(c) > 1e-15) x = x.add(rhs[i].scale(c));
        });
        out[j] = x;
      }
      const res = live.reduce((s, r, i) => s + (r.A.value() + B[i].reduce((a, b, j) => a + b * out[j].value(), 0) - r.t.value()) ** 2, 0);
      const scale = live.reduce((s, r) => s + r.A.value() ** 2 + r.t.value() ** 2, 0) + 1e-30;
      if (res > 1e-10 * scale) check = `<div class="warn">Las condiciones no se pueden cumplir todas a la vez; se muestra la solución que mejor se aproxima (mínimos cuadrados).</div>`;
    }
    us.forEach((s, j) => { s.S = out[j]; s.unknownSolved = true; });
    const lines = us.map((s, j) => `${nameHTML(s)} = ${xHTML?.[j] || F.poly(out[j], s.kind)}`);
    return {
      html: lines.join('<br>'),
      steps: `<p>Incógnitas: ${us.map(nameHTML).join(', ')}. Cada condición da una o varias ecuaciones lineales en ellas:</p>${eqs.map((e) => `<div class="eq">${e}</div>`).join('')}${check}<div class="st-r">⇒ ${lines.join(', &nbsp;')}</div>`,
      answers: us.map((s, j) => ({ label: s.name, qty: s.kind, val: out[j] })),
    };
  }
  function invert(M) {
    const n = M.length, A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      const mx = Math.max(...M.map((r) => Math.max(...r.map(Math.abs))));
      if (Math.abs(A[p][c]) < 1e-12 * (mx || 1)) return null;
      [A[c], A[p]] = [A[p], A[c]];
      const d = A[c][c];
      for (let k = 0; k < 2 * n; k++) A[c][k] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r) => r.slice(n));
  }

  /* --------- Gauss: carga encerrada exacta cuando es fácil --------- */
  function insideSurf(surf, X, tol = 1e-9) {
    const w = V3.sub(X, surf.C);
    if (surf.shape === 'sphere') { const r = V3.norm(w); return r < surf.R - tol ? 1 : r > surf.R + tol ? 0 : 0.5; }
    const z = V3.dot(w, surf.n), rho = V3.norm(V3.sub(w, V3.sc(surf.n, z)));
    if (rho > surf.R + tol || Math.abs(z) > surf.h / 2 + tol) return 0;
    if (rho < surf.R - tol && Math.abs(z) < surf.h / 2 - tol) return 1;
    return null;
  }
  function qencExact(s, surf) {
    const g = s.g, t = s.src.type;
    if (s.inducida) return null;
    if (t === 'hollow') {
      if (surf.shape !== 'sphere') return null;
      const dc = V3.norm(V3.sub(g.pos, surf.C));
      return dc + g.R2 < surf.R - 1e-9 ? new Ex(1) : dc > surf.R + g.R2 + 1e-9 ? new Ex(0) : dc < 1e-12 && surf.R < g.R2 ? new Ex(0) : null;
    }
    if (t === 'point') { const k = insideSurf(surf, g.pos); return k === null ? null : new Ex(k); }
    if (t === 'dipole') return insideSurf(surf, g.pos) !== null ? new Ex(0) : null;
    if (['sphere', 'shell', 'conductor', 'ring', 'disk'].includes(t)) {
      const Rs = t === 'sphere' ? g.R2 : g.R;
      const Qt = t === 'sphere' ? s.def.Q(g, g.R2) : s.def.Qtot(g);
      if (surf.shape === 'sphere') {
        const dc = V3.norm(V3.sub(g.pos, surf.C));
        if (dc + Rs < surf.R - 1e-9) return new Ex(Qt);
        if (dc > surf.R + Rs + 1e-9) return new Ex(0);
        if (t === 'sphere' && dc < 1e-12) return new Ex(s.def.Q(g, surf.R));
      }
      return null;
    }
    if (t === 'arc') return null;
    if (t === 'line' && g.mode === 'lambda') {
      const w = V3.sub(surf.C, g.pos), dpar = V3.dot(w, g.u), dist = V3.norm(V3.sub(w, V3.sc(g.u, dpar)));
      if (surf.shape === 'sphere') return new Ex(dist < surf.R ? 2 * Math.sqrt(surf.R ** 2 - dist ** 2) : 0);
      if (Math.abs(Math.abs(V3.dot(g.u, surf.n)) - 1) < 1e-12) return new Ex(dist < surf.R ? surf.h : 0);
      return null;
    }
    if (t === 'plane') {
      const dist = Math.abs(surf.C[g.i] - g.c);
      if (surf.shape === 'sphere') return dist < surf.R ? new Ex(PI * (surf.R ** 2 - dist ** 2)) : new Ex(0);
      if (surf.n[g.i] === 1) return new Ex(dist < surf.h / 2 ? PI * surf.R ** 2 : 0);
      return null;
    }
    return null;
  }
  function fluxNum(def, g, surf) {
    const { x, w } = Engine.gl(40), NF = 96, dphi = (2 * PI) / NF;
    let phi = 0;
    const add = (X, nrm, wt) => { const e = def.E(g, X); if (e) phi += V3.dot(e, nrm) * wt; };
    if (surf.shape === 'sphere') {
      for (let i = 0; i < x.length; i++) {
        const ct = x[i], st = Math.sqrt(1 - ct * ct);
        for (let j = 0; j < NF; j++) {
          const p = (j + 0.5) * dphi, nrm = [st * Math.cos(p), st * Math.sin(p), ct];
          add(V3.add(surf.C, V3.sc(nrm, surf.R)), nrm, surf.R * surf.R * w[i] * dphi);
        }
      }
      return phi;
    }
    const n = surf.n, e1 = n[0] ? [0, 1, 0] : [1, 0, 0], e2 = V3.cross(n, e1), hh = surf.h / 2;
    for (let i = 0; i < x.length; i++) for (let j = 0; j < NF; j++) {
      const p = (j + 0.5) * dphi, rad = V3.add(V3.sc(e1, Math.cos(p)), V3.sc(e2, Math.sin(p)));
      const z = hh * x[i];
      add(V3.add(V3.add(surf.C, V3.sc(n, z)), V3.sc(rad, surf.R)), rad, surf.R * hh * w[i] * dphi);
      const r = (surf.R / 2) * (1 + x[i]), wr = (surf.R / 2) * w[i] * r * dphi;
      add(V3.add(V3.add(surf.C, V3.sc(n, hh)), V3.sc(rad, r)), n, wr);
      add(V3.add(V3.add(surf.C, V3.sc(n, -hh)), V3.sc(rad, r)), V3.sc(n, -1), wr);
    }
    return phi;
  }

  /* --------- Fórmula de E a lo largo de una recta (cargas, hilos y planos) ---------
     Si la recta atraviesa cargas, hilos o planos, el campo se da por tramos, como en
     los solucionarios: E⃗(z<a√3) = (…) u_z, E⃗(z>a√3) = (…) u_z; los tramos con la
     misma fórmula se juntan: E⃗(x<0) = … = E⃗(x>2b). */
  function profileFormula(ctx, P0, d, vname) {
    const v = F.sym(vname), u = (n) => F.unitPow(n);
    const tiny = (c) => Math.abs(c) < 1e-12;
    // |c|·a escrito como en los libros: a, 2b, a√3
    const withUnit = (c) => { const b = F.num(Math.abs(c)); return b === '1' ? u(1) : b.includes('√') ? u(1) + b : b + u(1); };
    const coefTxt = (c, tail, first) => {
      if (tiny(c)) return '';
      const neg = c < 0, body = F.num(Math.abs(c));
      const s = tail === null ? withUnit(c) : (body === '1' && tail ? '' : body) + tail;
      return (first ? (neg ? F.MINUS : '') : neg ? ` ${F.MINUS} ` : ' + ') + s;
    };
    // c1·v + c0 (el término positivo delante: a√3 − z)
    const lin = (c0, c1) => {
      const order = c1 < 0 && c0 > 0 ? [[c0, null], [c1, v]] : [[c1, v], [c0, null]];
      const parts = [];
      for (const [c, tl] of order) { const x = coefTxt(c, tl, !parts.length); if (x) parts.push(x); }
      return parts.join('') || '0';
    };
    const quad = (c0, c1, c2) => { const parts = []; for (const [c, tl] of [[c2, `${v}<sup>2</sup>`], [c1, `${u(1)}${v}`], [c0, u(2)]]) { const x = coefTxt(c, tl, !parts.length); if (x) parts.push(x); } return parts.join('') || '0'; };
    const posTxt = (t) => (tiny(t) ? '0' : coefTxt(t, null, true));
    const at = (t) => V3.add(P0, V3.sc(d, t));

    // cada fuente se convierte en una función del tramo (t de muestra) → piezas por componente
    const items = [], cuts = [], other = [];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const t = s.src.type;
      if (t === 'plane') {
        const i = s.g.i, c0 = P0[i] - s.g.c, c1 = d[i];
        if (!tiny(c1)) cuts.push(-c0 / c1);
        items.push((tm) => { const dn = c0 + c1 * tm; return tiny(dn) ? [] : [{ k: i, plane: s.S.scale(Math.sign(dn) / 2) }]; });
        continue;
      }
      let r0, r1, kind;
      if (t === 'point') { r0 = V3.sub(P0, s.g.pos); r1 = d; kind = 'point'; }
      else if (t === 'line' && s.g.mode === 'lambda') {
        const perp = (w) => V3.sub(w, V3.sc(s.g.u, V3.dot(w, s.g.u)));
        r0 = perp(V3.sub(P0, s.g.pos)); r1 = perp(d); kind = 'line';
      } else { other.push(nameHTML(s)); continue; }
      const S = s.S, n1 = V3.norm(r1);
      if (n1 > 1e-12 && V3.norm(V3.cross(r0, r1)) < 1e-9 * (V3.norm(r0) * n1 + 1e-30)) {
        // la recta pasa por la carga o corta al hilo: distancia con signo s(t) = s0 + n1·t
        const e = V3.sc(r1, 1 / n1), s0 = V3.dot(r0, r1) / n1;
        cuts.push(-s0 / n1);
        items.push((tm) => {
          const sg = Math.sign(s0 + n1 * tm), out = [];
          for (let k = 0; k < 3; k++) {
            if (tiny(e[k])) continue;
            if (kind === 'point') out.push({ k, S, c: sg * e[k], num: '1', den: `4π${eps}(${lin(sg * s0, sg * n1)})<sup>2</sup>` });
            else out.push({ k, S, c: e[k], num: '1', den: `2π${eps}(${lin(s0, n1)})` });
          }
          return out;
        });
        continue;
      }
      const c0 = V3.dot(r0, r0), c1 = 2 * V3.dot(r0, r1), c2 = V3.dot(r1, r1);
      const sq = c2 > 1e-12 && Math.abs(c1 * c1 - 4 * c0 * c2) < 1e-9 * (c1 * c1 + c0 * c2 + 1e-30);
      const q = sq ? lin(c1 / (2 * Math.sqrt(c2)), Math.sqrt(c2)) : quad(c0, c1, c2);
      const den = kind === 'point' ? `4π${eps}${sq ? `|${q}|<sup>3</sup>` : `(${q})<sup>3/2</sup>`}` : `2π${eps}${sq ? `(${q})<sup>2</sup>` : `(${q})`}`;
      const pieces = [];
      for (let k = 0; k < 3; k++) if (!(tiny(r0[k]) && tiny(r1[k]))) pieces.push({ k, S, c: 1, num: lin(r0[k], r1[k]), den });
      items.push(() => pieces);
    }
    if (!items.length) return other.length ? `<div class="sub hint">Sin fórmula cerrada para ${other.join(', ')}: mira la gráfica.</div>` : '';

    const bps = cuts.sort((x, y) => x - y).filter((c, i, arr) => !i || c - arr[i - 1] > 1e-9);
    const ivs = [];
    if (!bps.length) ivs.push({ t: [0.37, 1.13, 2.71], label: v });
    else {
      ivs.push({ t: [bps[0] - 1, bps[0] - 2.3, bps[0] - 0.4], label: `${v}&lt;${posTxt(bps[0])}` });
      for (let i = 0; i + 1 < bps.length; i++) { const w = bps[i + 1] - bps[i]; ivs.push({ t: [0.5, 0.31, 0.77].map((f) => bps[i] + f * w), label: `${posTxt(bps[i])}&lt;${v}&lt;${posTxt(bps[i + 1])}` }); }
      const L = bps[bps.length - 1];
      ivs.push({ t: [L + 1, L + 2.3, L + 0.4], label: `${v}&gt;${posTxt(L)}` });
    }
    const piece = (p, first) => {
      const Sh = F.poly(p.S, null), simple = !/class="fr"|[+−]/.test(Sh.replace(/^−/, ''));
      const neg = (p.c < 0) !== (simple && Sh.startsWith(F.MINUS));
      const m = Math.abs(p.c), mTxt = tiny(m - 1) ? '' : F.num(m);
      const numer = p.num === '1' ? '' : /[+−]/.test(p.num.replace(/^−/, '')) ? `(${p.num})` : p.num;
      let html;
      if (simple) html = F.frac(`${mTxt}${Sh.replace(/^−/, '')}${numer}`, p.den);
      else html = `${mTxt}${mTxt ? '·' : ''}(${Sh})·${F.frac(p.num, p.den)}`;
      return { neg: simple ? neg : p.c < 0, html };
    };
    const seen = new Map();
    for (const iv of ivs) {
      const smp = iv.t.map((t) => fieldNum(ctx, at(t))).filter(Boolean);
      const big = Math.max(1e-30, ...smp.map((e) => V3.norm(e)));
      const out = [];
      for (let k = 0; k < 3; k++) {
        if (smp.length && smp.every((e) => Math.abs(e[k]) < 1e-10 * big)) continue;
        const ps = [], keys = new Set();
        let plane = Poly.zero();
        for (const it of items) for (const p of it(iv.t[0])) {
          if (p.k !== k) continue;
          if (p.plane) { plane = plane.add(p.plane); continue; }
          const prev = ps.find((x) => F.poly(x.S, null) === F.poly(p.S, null) && x.num === p.num && x.den === p.den);
          if (prev) prev.c += p.c;
          else ps.push({ ...p });
        }
        const terms = ps.filter((p) => !tiny(p.c)).map((p) => { p.S.keys().forEach((x) => keys.add(x)); return piece(p); });
        if (!plane.isZero()) { plane.keys().forEach((x) => keys.add(x)); const h = F.poly(plane, 'E'); terms.push({ neg: h.startsWith(F.MINUS), html: h.replace(/^−/, '') }); }
        if (!terms.length) continue;
        const uk = F.uv('xyz'[k]);
        if (terms.length === 1) out.push({ neg: terms[0].neg, html: `${terms[0].html} ${uk}` });
        else if (keys.size === 1) out.push({ neg: false, html: `(${F.joinTerms(terms)}) ${uk}` });
        else terms.forEach((t) => out.push({ neg: t.neg, html: `${t.html} ${uk}` }));
      }
      const html = F.joinTerms(out);
      if (seen.has(html)) seen.get(html).push(iv.label); else seen.set(html, [iv.label]);
    }
    const E = (l) => `${vecE()}(${l})`;
    const lines = [...seen].map(([html, ls]) => `<div>${E(ls[0])} = ${html}${ls.slice(1).map((l) => ` = ${E(l)}`).join('')}</div>`).join('');
    return lines + (other.length ? `<div class="sub hint">Sin fórmula cerrada para ${other.join(', ')}: mira la gráfica.</div>` : '');
  }

  /* --------- ES-3: comprobación dimensional de la respuesta del alumno --------- */
  // dimensiones como exponentes de [C, m, N]; las de la expresión se miden escalando cada unidad por 2 y viendo cómo cambia el valor
  const DIM_Q = { E: [-1, 0, 1], V: [-1, 1, 1], F: [0, 0, 1], U: [0, 1, 1], T: [0, 1, 1], Phi: [-1, 2, 1] };
  const DIM_K = { q: [1, 0, 0], lambda: [1, -1, 0], sigma: [1, -2, 0], rho: [1, -3, 0], p: [1, 1, 0] };
  const dimTxt = (d) => { const bs = ['C', 'm', 'N'], up = (n) => (n === 1 ? '' : String(n).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).replace(/\./, ',')); const pos = [], neg = []; d.forEach((n, i) => { if (n > 0) pos.push(bs[i] + up(n)); else if (n < 0) neg.push(bs[i] + up(-n)); }); return pos.length ? pos.join('·') + (neg.length ? '/' + (neg.length > 1 ? '(' + neg.join('·') + ')' : neg[0]) : '') : neg.length ? '1/' + (neg.length > 1 ? '(' + neg.join('·') + ')' : neg[0]) : '1 (sin dimensiones)'; };
  // trozos de una expresión separados por + o − fuera de paréntesis (no cuenta el signo ni el exponente)
  function trozos(src) {
    const t = []; let nivel = 0, ini = 0;
    for (let i = 0; i < src.length; i++) { const c = src[i]; if (c === '(') nivel++; else if (c === ')') nivel--; else if (nivel === 0 && (c === '+' || c === '-') && i > ini && !/[*/^(eE+-]\s*$/.test(src.slice(ini, i).replace(/\s/g, '').slice(-1)) ) { t.push(src.slice(ini, i)); ini = i + 1; } }
    t.push(src.slice(ini)); return t.map((x) => x.trim()).filter(Boolean);
  }
  function dimension(src, ctx) {
    const norm = String(src).replace(/π/g, 'pi').replace(/λ/g, 'lambda').replace(/σ/g, 'sigma').replace(/ρ/g, 'rho').replace(/ε₀|ε0|ε/g, 'eps0');
    const ids = [...new Set(norm.match(/[A-Za-z_][A-Za-z_0-9]*/g) || [])].filter((n) => !['pi', 'e'].includes(n.toLowerCase()) && !/^(sqrt|ln|log|exp|sin|cos|tan|asin|acos|atan|abs|arctan|arcsin|arccos)$/i.test(n));
    const dims = {};
    for (const n of ids) {
      if (n === 'eps0') dims[n] = [2, -2, -1];
      else if (n === 'a' || n === ctx.unit) dims[n] = [0, 1, 0];
      else { const k = ctx.kinds[n] || (DIM_K[n] ? n : null); if (!k || !DIM_K[k]) return null; dims[n] = DIM_K[k]; }
    }
    const ev = (fl) => { const vars = {}; ids.forEach((n, i) => { vars[n] = (1.3 + 0.17 * i) * 2 ** dims[n].reduce((s, d, j) => s + d * fl[j], 0); }); try { return Engine.parseExpr(norm, null, vars); } catch (e) { return NaN; } };
    const r0 = ev([0, 0, 0]); if (!isFinite(r0) || r0 === 0) return null;
    const d = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((fl) => { const q = ev(fl) / r0; return Math.log2(Math.abs(q)) ; });
    if (d.some((x) => !isFinite(x) || Math.abs(2 * x - Math.round(2 * x)) > 1e-7)) return 'mixta';
    return d.map((x) => Math.round(2 * x) / 2);
  }
  // devuelve un aviso si la respuesta no tiene las dimensiones de la magnitud pedida, o '' si cuadran o no se puede saber
  function checkDim(raw, ans, ctx) {
    if (F.getMode() === 'si' || !ctx) return '';
    const esp = DIM_Q[ans.qty] || (DIM_K[ans.qty] ? DIM_K[ans.qty] : null); if (!esp) return '';
    const piezas = trozos(raw), ds = piezas.map((x) => dimension(x, ctx));
    if (ds.some((x) => x === null)) return '';
    if (piezas.length > 1) {
      const i = ds.findIndex((x, j) => j && (x === 'mixta' || ds[0] === 'mixta' || x.some((n, k) => Math.abs(n - ds[0][k]) > 1e-7)));
      if (i > 0) return `Los sumandos no tienen las mismas dimensiones: «${piezas[0]}» sale en ${ds[0] === 'mixta' ? '¿?' : dimTxt(ds[0])} y «${piezas[i]}» en ${ds[i] === 'mixta' ? '¿?' : dimTxt(ds[i])}.`;
    }
    const d = dimension(raw, ctx); if (d === null) return '';
    if (d === 'mixta') return 'Las dimensiones de la expresión no cuadran: hay sumandos o funciones con unidades que no se pueden combinar.';
    if (d.some((n, k) => Math.abs(n - esp[k]) > 1e-7)) return `Las dimensiones no cuadran: tu expresión sale en ${dimTxt(d)} y debería salir en ${dimTxt(esp)}.`;
    return 'Las dimensiones sí cuadran: revisa el coeficiente.';
  }

  /* --------- Modo práctica: comprobar la respuesta del alumno --------- */
  function checkAnswer(ans, inputs, ctx) {
    const si = F.getMode() === 'si';
    const names = [...new Set((ans.vec || [ans.val]).flatMap((p) => p.keys()).flatMap(Engine.splitKey))];
    const trials = si ? 1 : 3;
    const comps = ans.vec ? [0, 1, 2] : [0];
    for (let tr = 0; tr < trials; tr++) {
      const vals = {}, a = si ? 1 : 0.7 + Math.random() * 0.9, e0 = si ? Engine.EPS0 : 0.6 + Math.random() * 0.9;
      for (const k of Object.keys(ctx.kinds)) vals[k] = si ? 1 : 0.6 + Math.random() * 1.3;
      for (const k of names) vals[k] ??= si ? 1 : 0.6 + Math.random() * 1.3;
      const vars = { ...vals, eps0: e0, [ctx.unit]: a, a: ctx.unit === 'a' ? a : vals.a ?? a };
      for (const k of comps) {
        const P = ans.vec ? ans.vec[k] : ans.val;
        let exp = 0;
        for (const [key, c] of P.m) {
          const n = F.aExpFor(key, ans.qty);
          exp += c.value() * Engine.splitKey(key).reduce((p, s) => p * vals[s], 1) * a ** n * (F.hasEps(ans.qty) ? 1 / e0 : 1);
        }
        const raw = String(inputs[k] ?? '').trim();
        let got;
        try { got = raw === '' ? 0 : Engine.parseExpr(raw, null, vars); } catch (e) { return { ok: false, msg: 'No entiendo la expresión: ' + e.message }; }
        const scale = Math.max(Math.abs(exp), ...comps.map(() => 0)) || 1;
        if (Math.abs(got - exp) > 2e-3 * Math.max(Math.abs(exp), 1e-12) && !(Math.abs(exp) < 1e-12 && Math.abs(got) < 1e-9 * scale)) return { ok: false, msg: (ans.vec ? `La componente ${'xyz'[k]} no coincide.` : 'No coincide.') + ' ' + checkDim(raw, ans, ctx) };
      }
    }
    return { ok: true, msg: 'Correcto' };
  }

  /* --------------------------- PREGUNTAS --------------------------- */
  // con una incógnita despejada, cada pregunta puede usarla con su valor o como símbolo
  const UNK = { k: 'unk', t: 'select', label: 'Incógnita', options: [['sust', 'con su valor despejado'], ['libre', 'como símbolo (apartado independiente)']], show: (a, sc) => !!sc?.unknown?.srcs?.length };
  const ANALYSES = {
    E: {
      label: 'Campo eléctrico en un punto', short: 'Campo E',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, UNK],
      defaults: () => ({ P: ['1', '1', '0'] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const mod = F.modulus(F0.E, 'E');
        return {
          res: `<div>${vecE()}(P) = ${F.vec(F0.E, 'E')}</div>${mod ? `<div class="sub">|${vecE()}| = ${mod}</div>` : ''}`,
          steps: singularWarn(F0.singular) + fieldSteps(ctx, X, F0),
          marks: [{ key: 'P', at: X, label: 'P', vec: VP.value(F0.E) }],
          answers: [{ label: 'E⃗(P)', qty: 'E', vec: F0.E }],
        };
      },
    },
    V: {
      label: 'Potencial en un punto', short: 'Potencial V',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }],
      defaults: () => ({ P: ['1', '0', '0'] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), pot = potential(ctx, X);
        if (!pot.absolute) return { res: `<div class="warn">Hay hilos o planos infinitos: el potencial absoluto no está definido (no se puede tomar V(∞) = 0). Usa “Diferencia de potencial”.</div>`, marks: [{ key: 'P', at: X, label: 'P' }] };
        const rows = pot.parts.map(({ s, Vp }) => `<li><div class="st-h">${headHTML(s)}</div><div>${s.def.explainV(s.g, X, X)}</div><div class="st-r">V<sub>${F.esc(s.name)}</sub> = ${F.poly(Vp, 'V')}</div></li>`);
        return {
          res: `V(P) = ${F.poly(pot.V, 'V')}`,
          steps: singularWarn(pot.singular) + `<p>Superposición con V(∞) = 0.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">V(P) = ${F.poly(pot.V, 'V')}</div>`,
          marks: [{ key: 'P', at: X, label: 'P' }],
          answers: [{ label: 'V(P)', qty: 'V', val: pot.V }],
        };
      },
    },
    dV: {
      label: 'Diferencia de potencial V_B − V_A', short: 'V_B − V_A',
      fields: [{ k: 'A', t: 'vec3', label: 'Punto A' }, { k: 'B', t: 'vec3', label: 'Punto B' }, { k: 'sense', t: 'select', label: 'Calcular', options: [['BA', 'V_B − V_A'], ['AB', 'V_A − V_B']] }, UNK],
      defaults: () => ({ A: ['1', '0', '0'], B: ['2', '0', '0'], sense: 'BA' }),
      run(an, ctx) {
        const A = an.A.map(ctx.P), B = an.B.map(ctx.P), d = diffV(ctx, A, B);
        const ab = an.sense === 'AB', sg = ab ? -1 : 1, D = d.dV.scale(sg);
        const lab = ab ? 'V<sub>A</sub> − V<sub>B</sub>' : 'V<sub>B</sub> − V<sub>A</sub>';
        const rows = d.parts.map(({ s, dV }) => `<li><div class="st-h">${headHTML(s)}</div><div>${s.def.explainV(s.g, A, B)}</div><div class="st-r">ΔV<sub>${F.esc(s.name)}</sub> = ${F.poly(dV, 'V')}</div></li>`);
        return {
          res: `${lab} = ${F.poly(D, 'V')}`,
          steps: singularWarn(d.singular) + `<p>V<sub>B</sub> − V<sub>A</sub> = −∫<sub>A</sub><sup>B</sup> ${vecE()}·d<span class="vv">l</span>, sumando la contribución de cada fuente.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">V<sub>B</sub> − V<sub>A</sub> = ${F.poly(d.dV, 'V')}</div>${ab ? `<div class="st-r">${lab} = −(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(D, 'V')}</div>` : ''}`,
          marks: [{ key: 'A', at: A, label: 'A' }, { key: 'B', at: B, label: 'B' }],
          answers: [{ label: ab ? 'V_A − V_B' : 'V_B − V_A', qty: 'V', val: D }],
        };
      },
    },
    force: {
      label: 'Fuerza sobre una carga', short: 'Fuerza',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'Q', t: 'charge', label: 'Carga de prueba' }],
      defaults: () => ({ P: ['1', '1', '0'], Q: { c: '1', sym: 'q' } }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X), Q = Poly.sym(an.Q.sym, ctx.P(an.Q.c));
        const Fv = VP.fromNum(Q, [1, 1, 1]).map((q, i) => q.mul(F0.E[i]));
        const mod = F.modulus(Fv, 'F');
        return {
          res: `<div><span class="vv">F</span> = Q${vecE()} = ${F.vec(Fv, 'F')}</div>${mod ? `<div class="sub">|<span class="vv">F</span>| = ${mod}</div>` : ''}`,
          steps: singularWarn(F0.singular) + fieldSteps(ctx, X, F0) + `<div class="st-r"><span class="vv">F</span> = (${F.poly(Q, 'q')})·${vecE()} = ${F.vec(Fv, 'F')}</div>`,
          marks: [{ key: 'P', at: X, label: 'P', vec: VP.value(Fv) }],
          answers: [{ label: 'F⃗', qty: 'F', vec: Fv }],
        };
      },
    },
    work: {
      label: 'Trabajo para mover una carga de A a B', short: 'Trabajo',
      fields: [{ k: 'A', t: 'vec3', label: 'Desde A' }, { k: 'B', t: 'vec3', label: 'Hasta B' }, { k: 'Q', t: 'charge', label: 'Carga' }],
      defaults: () => ({ A: ['1', '0', '0'], B: ['2', '0', '0'], Q: { c: '1', sym: 'q' } }),
      run(an, ctx) {
        const A = an.A.map(ctx.P), B = an.B.map(ctx.P), d = diffV(ctx, A, B), Q = Poly.sym(an.Q.sym, ctx.P(an.Q.c));
        const W = Q.mul(d.dV);
        return {
          res: `<div>W<sub>ext</sub> = Q(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(W, 'U')}</div><div class="sub">Trabajo del campo: W<sub>campo</sub> = −W<sub>ext</sub> = ${F.poly(W.scale(-1), 'U')}</div>`,
          steps: singularWarn(d.singular) + d.parts.map(({ s, dV }) => `<div>${nameHTML(s)}: ${s.def.explainV(s.g, A, B)} → ΔV = ${F.poly(dV, 'V')}</div>`).join('') +
            `<div class="st-r">V<sub>B</sub> − V<sub>A</sub> = ${F.poly(d.dV, 'V')}</div><div class="st-r">W<sub>ext</sub> = (${F.poly(Q, 'q')})·(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(W, 'U')}</div>`,
          marks: [{ key: 'A', at: A, label: 'A' }, { key: 'B', at: B, label: 'B' }],
          answers: [{ label: 'W_ext', qty: 'U', val: W }],
        };
      },
    },
    dipole: {
      label: 'Dipolo en un punto (par, energía, equilibrio)', short: 'Dipolo en P',
      fields: [{ k: 'P', t: 'vec3', label: 'Posición' }, { k: 'p', t: 'vec3', label: 'Momento p (× símbolo)' }, { k: 'sym', t: 'sym', label: 'Símbolo' }, { k: 'rot', t: 'vec3opt', label: 'Girarlo hasta (opcional)' }],
      defaults: () => ({ P: ['0', '0', '0'], p: ['1', '0', '0'], sym: 'p', rot: ['', '', ''] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const pn = an.p.map(ctx.P);
        const pS = Poly.sym(an.sym, 1);
        const pv = pn.map((v) => pS.scale(v));
        const tau = VP.cross(pv, F0.E), U = VP.dot(pv, F0.E).scale(-1);
        const En = VP.value(F0.E), pm = V3.norm(pn), Em = V3.norm(En);
        const crossN = V3.norm(V3.cross(pn, En)), dotN = V3.dot(pn, En);
        let eqTxt;
        if (Em < 1e-14) eqTxt = `<span class="pill"><span class="vv">E</span> = 0 en P: cualquier orientación es de equilibrio (indiferente)</span>`;
        else if (crossN < 1e-9 * pm * Em) eqTxt = dotN > 0 ? `<span class="pill ok">Equilibrio estable</span> <span class="vv">p</span> apunta como ${vecE()} (U mínima)` : `<span class="pill bad">Equilibrio inestable</span> <span class="vv">p</span> apunta contra ${vecE()} (U máxima)`;
        else eqTxt = `<span class="pill">No está en equilibrio</span> el par lo gira hacia ${vecE()}`;
        let rotHTML = '';
        const hasRot = an.rot && an.rot.some((v) => String(v).trim() !== '');
        if (hasRot) {
          const d = V3.unit(an.rot.map((v) => (String(v).trim() === '' ? 0 : ctx.P(v))));
          const pf = d.map((v) => pS.scale(v * pm));
          const Uf = VP.dot(pf, F0.E).scale(-1);
          rotHTML = `<div class="sub">Girándolo hasta ${F.vecNum(d)} (mismo |<span class="vv">p</span>|): U<sub>f</sub> = ${F.poly(Uf, 'U')}, &nbsp;W<sub>ext</sub> = U<sub>f</sub> − U<sub>i</sub> = <b>${F.poly(Uf.sub(U), 'U')}</b></div>`;
        }
        const pmod = pm === 1 ? '' : F.num(pm);
        return {
          res: `<div><span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} = ${F.vec(tau, 'T')}</div><div>U = −<span class="vv">p</span>·${vecE()} = ${F.poly(U, 'U')}</div><div class="sub">${eqTxt}</div>${rotHTML}`,
          steps: singularWarn(F0.singular.filter((s) => s.src.type !== 'dipole')) + fieldSteps(ctx, X, F0) +
            `<div class="st-r"><span class="vv">p</span> = ${F.vec(pv, 'p')} &nbsp;(|<span class="vv">p</span>| = ${pmod}${F.sym(an.sym)})</div>
             <div class="st-r">Momento de fuerzas: <span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} = ${F.vec(tau, 'T')}</div>
             <div class="st-r">Energía potencial: U = −<span class="vv">p</span>·${vecE()} = ${F.poly(U, 'U')}</div>
             <p>Equilibrio cuando <span class="vv">M</span> = 0 (<span class="vv">p</span> ∥ ${vecE()}). Estable si <span class="vv">p</span> tiene el mismo sentido que ${vecE()}; inestable si es opuesto.</p>`,
          marks: [{ key: 'P', at: X, label: 'p', vec: En, dip: pn }],
          answers: [{ label: 'M⃗', qty: 'T', vec: tau }, { label: 'U', qty: 'U', val: U }],
        };
      },
    },
    energy: {
      label: 'Energía electrostática del sistema de cargas', short: 'Energía',
      fields: [],
      defaults: () => ({}),
      run(an, ctx) {
        const pts = ctx.sources.filter((s) => s.src.type === 'point' && s.g && s.S);
        let U = Poly.zero();
        const rows = [];
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const r = V3.norm(V3.sub(pts[i].g.pos, pts[j].g.pos));
          const u = pts[i].S.mul(pts[j].S).scale(1 / (4 * PI * r));
          U = U.add(u);
          rows.push(`<li>${nameHTML(pts[i])}${nameHTML(pts[j])}: r = ${F.num(r)} → ${F.frac(`${nameHTML(pts[i])}${nameHTML(pts[j])}`, `4π${eps}r`)} = ${F.poly(u, 'U')}</li>`);
        }
        const others = ctx.sources.length - pts.length;
        return {
          res: `U = ${F.poly(U, 'U')}`,
          steps: `<p>U = Σ<sub>i&lt;j</sub> ${F.frac('q<sub>i</sub>q<sub>j</sub>', `4π${eps}r<sub>ij</sub>`)} (una vez cada pareja).</p><ol class="steps">${rows.join('')}</ol>${others ? `<div class="warn">Solo se cuentan las cargas puntuales (${others} fuente(s) de otro tipo ignoradas).</div>` : ''}`,
          marks: [],
          answers: [{ label: 'U', qty: 'U', val: U }],
        };
      },
    },
    findDipole: {
      label: 'Hallar el momento dipolar a partir del par y/o la energía', short: 'Hallar p',
      fields: [
        { k: 'P', t: 'vec3', label: 'Posición' }, { k: 'sym', t: 'sym', label: 'Símbolo de p' },
        { k: 'tau', t: 'vec3opt', label: 'Par M dado (coeficientes)' },
        { k: 'U', t: 'expr', label: 'U dada (mismo convenio, opcional)', optional: true },
        { k: 'plane', t: 'select', label: 'Restricción', options: [['none', 'ninguna'], ['z', 'en el plano XY (p_z = 0)'], ['y', 'en el plano XZ (p_y = 0)'], ['x', 'en el plano YZ (p_x = 0)']] },
      ],
      defaults: () => ({ P: ['1', '0', '0'], sym: 'b', tau: ['', '', ''], U: '', plane: 'z' }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const keys = VP.keys(F0.E);
        if (keys.length !== 1) return { res: `<div class="warn">Este cálculo necesita que el campo en P dependa de un solo símbolo (ahora depende de ${keys.length}).</div>` };
        const e = F0.E.map((p) => p.coef(keys[0]).value());
        const rows = [], rhs = [];
        const has = (v) => String(v ?? '').trim() !== '';
        // (p × e)_x = p_y e_z − p_z e_y, etc.
        if (an.tau.some(has)) {
          const t = an.tau.map((v) => (has(v) ? ctx.P(v) : 0));
          rows.push([0, e[2], -e[1]], [-e[2], 0, e[0]], [e[1], -e[0], 0]); rhs.push(...t);
        }
        if (has(an.U)) { rows.push([-e[0], -e[1], -e[2]]); rhs.push(ctx.P(an.U)); }
        if (an.plane !== 'none') { const r = [0, 0, 0]; r[AXI[an.plane]] = 1; rows.push(r); rhs.push(0); }
        if (!rows.length) return { res: `<div class="warn">Introduce el par <span class="vv">M</span> y/o la energía U.</div>` };
        // mínimos cuadrados: (AᵀA) p = Aᵀ b
        const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
        rows.forEach((r, k) => { for (let i = 0; i < 3; i++) { v[i] += r[i] * rhs[k]; for (let j = 0; j < 3; j++) M[i][j] += r[i] * r[j]; } });
        const p = solve3(M, v);
        if (!p) return { res: `<div class="warn">Faltan datos: con lo introducido <span class="vv">p</span> no queda determinado. Añade U o una restricción.</div>` };
        const res = rows.reduce((s, r, k) => s + (r[0] * p[0] + r[1] * p[1] + r[2] * p[2] - rhs[k]) ** 2, 0);
        const pS = Poly.sym(an.sym, 1), pv = p.map((x) => pS.scale(x));
        const Eu = V3.unit(VP.value(F0.E));
        const pm = V3.norm(p);
        return {
          res: `<div><span class="vv">p</span> = ${F.vec(pv, 'p', { unitForm: true })}</div><div class="sub">|<span class="vv">p</span>| = ${F.num(pm)}${F.sym(an.sym)}</div>${res > 1e-12 ? '<div class="warn">Los datos no son del todo compatibles; se muestra la mejor aproximación.</div>' : ''}`,
          steps: fieldSteps(ctx, X, F0) + `<p>Incógnita <span class="vv">p</span> = (p<sub>x</sub>, p<sub>y</sub>, p<sub>z</sub>). Ecuaciones: <span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} (3 ecuaciones), U = −<span class="vv">p</span>·${vecE()} y la restricción elegida. Resolviendo el sistema lineal:</p><div class="st-r"><span class="vv">p</span> = ${F.vec(pv, 'p')}</div>`,
          marks: [{ key: 'P', at: X, label: 'p', vec: VP.value(F0.E), dip: p }],
          answers: [{ label: 'p⃗', qty: 'p', vec: pv }],
          action: {
            label: 'Añadir este dipolo como fuente, ya en equilibrio estable',
            make: () => ({ type: 'dipole', name: 'p', pos: an.P.slice(), p: Eu.map((x) => trimNum(x * pm)), s: { c: '1', sym: an.sym } }),
          },
        };
      },
    },
    flux: {
      label: 'Flujo de E por una superficie cerrada (Gauss)', short: 'Flujo (Gauss)',
      fields: [
        { k: 'shape', t: 'select', label: 'Superficie', structural: true, options: [['sphere', 'esfera'], ['cyl', 'cilindro']] },
        { k: 'C', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio' },
        { k: 'axis', t: 'select', label: 'Eje', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']], show: (a) => a.shape === 'cyl' },
        { k: 'h', t: 'expr', label: 'Altura', show: (a) => a.shape === 'cyl' },
      ],
      defaults: () => ({ shape: 'sphere', C: ['0', '0', '0'], R: '2', axis: 'z', h: '2' }),
      run(an, ctx) {
        const surf = { shape: an.shape, C: an.C.map(ctx.P), R: ctx.P(an.R), axis: an.axis, n: AX[an.axis], h: an.shape === 'cyl' ? ctx.P(an.h) : 0 };
        let Q = Poly.zero();
        const rows = [];
        for (const s of ctx.sources) {
          if (!s.g || !s.S) continue;
          let q = qencExact(s, surf), how = 'exacto';
          if (q === null) { q = fluxNum(s.def, s.g, surf); how = 'integración numérica de E·dA'; }
          const Qi = s.S.scale(q);
          Q = Q.add(Qi);
          rows.push(`<li><div class="st-h">${headHTML(s)}</div><div>Carga encerrada (${how}): ${F.poly(Qi, 'q')}</div></li>`);
        }
        const Phi = Q.clean();
        return {
          res: `<div>Φ = ∮${vecE()}·d<span class="vv">A</span> = ${F.frac('Q<sub>enc</sub>', eps)} = ${F.poly(Phi, 'Phi')}</div><div class="sub">Q<sub>enc</sub> = ${F.poly(Phi, 'q')}</div>`,
          steps: `<p>Ley de Gauss: el flujo por una superficie cerrada solo depende de la carga encerrada. Superficie: ${an.shape === 'sphere' ? `esfera de radio ${F.num(surf.R)}` : `cilindro de radio ${F.num(surf.R)} y altura ${F.num(surf.h)}, eje ${an.axis.toUpperCase()}`} centrada en ${F.pt(surf.C)}.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">Φ = ${F.poly(Phi, 'Phi')}</div>`,
          marks: [{ key: 'C', at: surf.C, label: 'C' }],
          surf,
          answers: [{ label: 'Φ', qty: 'Phi', val: Phi }],
        };
      },
    },
    profile: {
      label: 'Perfil a lo largo de una recta: E y V en función de una variable', short: 'E(z), V(z)',
      fields: [
        { k: 'P0', t: 'vec3', label: 'Punto de la recta' }, { k: 'd', t: 'vec3', label: 'Dirección' },
        { k: 'var', t: 'sym', label: 'Variable' }, { k: 't0', t: 'expr', label: 'Desde' }, { k: 't1', t: 'expr', label: 'Hasta' },
        { k: 'at', t: 'expr', label: 'Valor exacto en', optional: true }, UNK,
      ],
      defaults: () => ({ P0: ['0', '0', '0'], d: ['0', '0', '1'], var: 'z', t0: '-3', t1: '3', at: '' }),
      run(an, ctx) {
        const P0 = an.P0.map(ctx.P), d = an.d.map(ctx.P), t0 = ctx.P(an.t0), t1 = ctx.P(an.t1);
        const vname = an.var || 't';
        const at = (t) => V3.add(P0, V3.sc(d, t));
        const formula = profileFormula(ctx, P0, d, vname);
        // muestreo numérico (símbolos = 1)
        const N = 240, xs = [], Ex = [], Ey = [], Ez = [], Em = [], Vs = [];
        const absV = ctx.sources.every((s) => !s.S || s.def.absV);
        const si = F.getMode() === 'si', f = si ? 1 / Engine.EPS0 : PI;
        let V0 = null;
        for (let i = 0; i <= N; i++) {
          const t = t0 + ((t1 - t0) * i) / N, X = at(t);
          const E = fieldNum(ctx, X), V = potNum(ctx, X);
          xs.push(t);
          const ok = E && E.every(isFinite);
          Ex.push(ok ? E[0] * f : null); Ey.push(ok ? E[1] * f : null); Ez.push(ok ? E[2] * f : null); Em.push(ok ? V3.norm(E) * f : null);
          if (isFinite(V) && V0 === null) V0 = V;
          Vs.push(isFinite(V) ? (absV ? V : V - V0) * f : null);
        }
        let exact = '';
        if (String(an.at ?? '').trim() !== '') {
          const tv = ctx.P(an.at), X = at(tv), F0 = field(ctx, X), pot = potential(ctx, X);
          exact = `<div class="sub">En ${F.sym(vname)} = ${F.num(tv)}: ${vecE()} = ${F.vec(F0.E, 'E')}${pot.absolute ? `, &nbsp;V = ${F.poly(pot.V, 'V')}` : ''}</div>`;
        }
        const yl = si ? 'N/C y V' : '×(símbolo)/(πε₀)';
        return {
          res: `${formula}${exact}<canvas class="chart" aria-label="Gráfica de E y V"></canvas><div class="chart-l"></div>`,
          steps: `<p>Puntos de la recta: P(${F.sym(vname)}) = ${F.pt(P0)} + ${F.sym(vname)}·${F.vecNum(d)}. La gráfica es numérica tomando todos los símbolos = 1 ${si ? '' : '(eje vertical en unidades de símbolo/(πε₀aⁿ))'}${absV ? '' : '; V se mide respecto al primer punto porque hay hilos o planos infinitos'}.</p>`,
          marks: [{ key: 'P0', at: P0, label: 'P₀' }],
          seg: [at(t0), at(t1)],
          chart: { xs, xlabel: vname, ylabel: yl, series: [
            { name: 'E_x', ys: Ex }, { name: 'E_y', ys: Ey }, { name: 'E_z', ys: Ez }, { name: '|E|', ys: Em }, { name: absV ? 'V' : 'V − V(inicio)', ys: Vs, dashed: true },
          ] },
        };
      },
    },
  };
  function trimNum(x) {
    const id = Engine.identify(x);
    if (id) return (id.s < 0 ? '-' : '') + (id.n !== 1 || id.r === 1 ? id.n : '') + (id.r > 1 ? (id.n !== 1 ? '*' : '') + `sqrt(${id.r})` : '') + (id.d !== 1 ? '/' + id.d : '');
    return String(+x.toPrecision(8));
  }
  function solve3(M, v) {
    const A = M.map((r, i) => [...r, v[i]]);
    for (let c = 0; c < 3; c++) {
      let piv = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-12) return null;
      [A[c], A[piv]] = [A[piv], A[c]];
      for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r, i) => r[3] / r[i]);
  }

  /* --------------------------- EJECUCIÓN --------------------------- */
  function run(scen) {
    const ctx = build(scen);
    const unknown = solveUnknowns(ctx, scen);
    for (const s of ctx.sources) s.Snum = s.S ? s.S.value() : 0;
    const results = scen.analyses.map((an) => {
      const def = ANALYSES[an.type];
      // «incógnita como símbolo»: la pregunta se calcula sin sustituir el valor despejado
      const swap = an.unk === 'libre' ? ctx.sources.filter((s) => s.unknown && s.Sfree) : [];
      const saved = swap.map((s) => [s.S, s.Snum]);
      swap.forEach((s) => { s.S = s.Sfree; s.Snum = s.Sfree.value(); });
      try { return def.run(an, ctx); } catch (e) { return { error: e.message }; }
      finally { swap.forEach((s, i) => { [s.S, s.Snum] = saved[i]; }); }
    });
    return { ctx, unknown, results };
  }

  return { SOURCES, ANALYSES, CONDS, run, build, checkAnswer, checkDim, normUnknown, field, potential, fieldNum, potNum, trimNum };
})();


/* =====================================================================
   Ejercicios de ejemplo precargados (enunciados propios del simulador).
   Cubren los mismos tipos de pregunta que el Tema 3; la versión privada
   cambia este archivo por privado/tema3-pdf.js (ver fuente/build.sh).
   ===================================================================== */
const Presets = (() => {
  let n = 0;
  const id = () => 'k' + ++n;
  const S = (type, name, extra, c = '1', sym) => ({ id: id(), type, name, ...extra, s: { c, sym } });
  const A = (type, extra) => ({ id: id(), type, ...extra });
  const scen = (o) => ({ unit: 'a', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, ...o });

  const list = [
    {
      key: 'p1', statement: "Cuatro partículas con la misma carga q están en los vértices de un cuadrado de lado 2a en el plano XY, en (±a, ±a, 0). Determinar: 1) la energía electrostática del sistema; 2) el campo eléctrico en cualquier punto del eje Z; 3) el momento de fuerzas sobre un dipolo p = b(u_x + u_y + u_z), que solo puede rotar, colocado en (0, 0, a).", title: '1 · Cuadrado de cuatro cargas',
      make: () => scen({
        view: { plane: 'xz', cut: '0' },
        sources: [S('point', 'q1', { pos: ['1', '1', '0'] }, '1', 'q'), S('point', 'q2', { pos: ['-1', '1', '0'] }, '1', 'q'), S('point', 'q3', { pos: ['-1', '-1', '0'] }, '1', 'q'), S('point', 'q4', { pos: ['1', '-1', '0'] }, '1', 'q')],
        analyses: [A('energy', {}), A('profile', { P0: ['0', '0', '0'], d: ['0', '0', '1'], var: 'z', t0: '-4', t1: '4', at: '' }), A('dipole', { P: ['0', '0', '1'], p: ['1', '1', '1'], sym: 'b', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'p2', statement: "Tres cargas puntuales q1 = 2q, q2 = −q y q3 = q están en los vértices de un triángulo rectángulo: q1 en el origen, q2 en (3a, 0) y q3 en (0, 4a). Obtener: 1) la energía electrostática del sistema; 2) la energía potencial de un dipolo p = p0(3u_x + 4u_y) situado en (3a, 4a).", title: '2 · Triángulo rectángulo de cargas',
      make: () => scen({
        sources: [S('point', 'q1', { pos: ['0', '0', '0'] }, '2', 'q'), S('point', 'q2', { pos: ['3', '0', '0'] }, '-1', 'q'), S('point', 'q3', { pos: ['0', '4', '0'] }, '1', 'q')],
        analyses: [A('energy', {}), A('dipole', { P: ['3', '4', '0'], p: ['3', '4', '0'], sym: 'p0', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'p3', statement: "Una carga q1 = −2q0 está en (0, 2a) y una segunda carga q2, desconocida, en (3a, 0). Un dipolo p = p0(1/2 u_x + √3/2 u_y), que solo puede rotar y está en el origen, se encuentra en equilibrio. Determinar: 1) el valor de q2; 2) si el equilibrio es estable o inestable; 3) el trabajo de un agente externo para colocar el dipolo paralelo a +u_y.", title: '3 · Dipolo en equilibrio a 60°',
      make: () => {
        const q2 = S('point', 'q2', { pos: ['3', '0', '0'] }, '1', 'q0');
        return scen({
          order: ['q0', 'p0'],
          sources: [S('point', 'q1', { pos: ['0', '2', '0'] }, '-2', 'q0'), q2],
          unknown: { src: q2.id, cond: { type: 'Epar', P: ['0', '0', '0'], d: ['1/2', 'sqrt(3)/2', '0'] } },
          analyses: [A('dipole', { P: ['0', '0', '0'], p: ['1/2', 'sqrt(3)/2', '0'], sym: 'p0', rot: ['0', '1', '0'] })],
        });
      },
    },
    {
      key: 'p4', statement: "Un plano uniformemente cargado coincide con el plano XZ. Dos hilos indefinidos paralelos al eje Z cortan al plano XY en (3a, 4a), con λ1 = 2λ, y en (−3a, 4a), con λ2 = −λ. Obtener la densidad de carga del plano sabiendo que un dipolo situado en (0, a, 0) estaría en equilibrio orientado según u_x, y el campo eléctrico en ese punto.", title: '4 · Plano XZ y dos hilos',
      make: () => {
        const pl = S('plane', 'σ', { axis: 'y', at: '0' }, '1', 'sigma');
        return scen({
          sources: [pl, S('line', 'λ1', { pos: ['3', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '2', 'lambda'), S('line', 'λ2', { pos: ['-3', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '-1', 'lambda')],
          unknown: { src: pl.id, cond: { type: 'Epar', P: ['0', '1', '0'], d: ['1', '0', '0'] } },
          analyses: [A('E', { P: ['0', '1', '0'] })],
        });
      },
    },
    {
      key: 'p5', statement: "Un cilindro indefinido de radio 2a, uniformemente cargado y coaxial con el eje Z, y un plano cargado con densidad σ en y = −5a. Si en (4a, 3a, 0) se situara una carga puntual, la fuerza sería paralela al eje X. Determinar: 1) la densidad volumétrica de carga del cilindro; 2) V_B − V_A entre A(0, a, 0) y B(0, 3a, 0).", title: '5 · Cilindro grueso y plano',
      make: () => {
        const cyl = S('line', 'ρ', { pos: ['0', '0', '0'], dir: 'z', mode: 'rho', R: '2' }, '1', 'rho');
        return scen({
          sources: [cyl, S('plane', 'σ', { axis: 'y', at: '-5' }, '1', 'sigma')],
          unknown: { src: cyl.id, cond: { type: 'Epar', P: ['4', '3', '0'], d: ['1', '0', '0'] } },
          analyses: [A('E', { P: ['4', '3', '0'] }), A('dV', { A: ['0', '1', '0'], B: ['0', '3', '0'] })],
        });
      },
    },
    {
      key: 'p6', statement: "Una carga puntual q está en el origen y una esfera de radio a, uniformemente cargada, tiene su centro en (2a, 0, 0). Si el potencial en (3a, 0, 0) es q/(3πε0a), determinar la densidad de carga de la esfera y la energía potencial de un dipolo p = p(u_x + u_y) situado en (2a, 2a, 0).", title: '6 · Esfera desplazada y carga puntual',
      make: () => {
        const sph = S('sphere', 'ρ', { pos: ['2', '0', '0'], R1: '0', R2: '1' }, '1', 'rho');
        return scen({
          sources: [S('point', 'q', { pos: ['0', '0', '0'] }, '1', 'q'), sph],
          unknown: { src: sph.id, cond: { type: 'V', P: ['3', '0', '0'], val: { c: '1/(3*pi)', sym: 'q' } } },
          analyses: [A('dipole', { P: ['2', '2', '0'], p: ['1', '1', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'p7', statement: "Un hilo indefinido con densidad λ, paralelo al eje X, pasa por (0, 6a, 0). Determinar la carga que debe situarse en (0, −3a, 0) para que un dipolo p = p u_x, situado en (4a, 0, 0) y que solo puede rotar, permanezca en equilibrio. Justificar si el equilibrio es estable o inestable y obtener su energía potencial.", title: '7 · Hilo paralelo a X y carga desconocida',
      make: () => {
        const Q = S('point', 'Q', { pos: ['0', '-3', '0'] }, '1', 'q');
        return scen({
          order: ['p', 'lambda'],
          sources: [S('line', 'λ', { pos: ['0', '6', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda'), Q],
          unknown: { src: Q.id, cond: { type: 'Epar', P: ['4', '0', '0'], d: ['1', '0', '0'] } },
          analyses: [A('dipole', { P: ['4', '0', '0'], p: ['1', '0', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'p8', statement: "Una lámina indefinida de anchura 2b, uniformemente cargada, ocupa la región −b < y < b. Un hilo indefinido con densidad λ, paralelo al eje Z, pasa por (0, 4b, 0). Sabiendo que el campo eléctrico es nulo en la recta x = 0, y = 2b, obtener la densidad de la lámina y V_B − V_A entre A(0, 0, 0) y B(0, 3b, 0).", title: '8 · Lámina gruesa y campo nulo',
      make: () => {
        const sl = S('slab', 'ρ', { axis: 'y', at: '-1', w: '2' }, '1', 'rho');
        return scen({
          unit: 'b',
          sources: [sl, S('line', 'λ', { pos: ['0', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '1', 'lambda')],
          unknown: { src: sl.id, cond: { type: 'Ezero', P: ['0', '2', '0'] } },
          analyses: [A('dV', { A: ['0', '0', '0'], B: ['0', '3', '0'] })],
        });
      },
    },
    {
      key: 'p9', statement: "Dos planos indefinidos, y = 0 con densidad 2σ e y = 2b con densidad −σ, y un hilo indefinido con densidad λ, paralelo al eje X, que pasa por (0, b, 0). Obtener: 1) el campo eléctrico en cualquier punto del plano XY; 2) la relación entre σ y λ para que V_B − V_A sea nula, con A(0, b/2, 0) y B(0, 3b, 0).", title: '9 · Dos planos distintos y un hilo', note: 'Apartado 1: el perfil a lo largo de Y usa λ como símbolo (no depende del apartado 2); en el plano XY el campo solo depende de y.',
      make: () => {
        const ln = S('line', 'λ', { pos: ['0', '1', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda');
        return scen({
          unit: 'b',
          sources: [S('plane', 'σ1', { axis: 'y', at: '0' }, '2', 'sigma'), ln, S('plane', 'σ2', { axis: 'y', at: '2' }, '-1', 'sigma')],
          unknown: { src: ln.id, cond: { type: 'dV', A: ['0', '1/2', '0'], B: ['0', '3', '0'], val: { c: '0', sym: '' } } },
          analyses: [A('profile', { P0: ['0', '0', '0'], d: ['0', '1', '0'], var: 'y', t0: '-1', t1: '4', at: '', unk: 'libre' })],
        });
      },
    },
    {
      key: 'p10', statement: "Una carga puntual Q está en el origen, centro de una corona esférica de radios R y 2R cargada con densidad ρ = 3Q/(28πR³). Obtener el trabajo realizado en contra del campo para desplazar una carga q desde (R/2, 0, 0) hasta (3R, 0, 0).", title: '10 · Carga dentro de una corona esférica',
      make: () => scen({
        unit: 'R', order: ['q', 'Q'],
        sources: [S('point', 'Q', { pos: ['0', '0', '0'] }, '1', 'Q'), S('sphere', 'ρ', { pos: ['0', '0', '0'], R1: '1', R2: '2' }, '3/(28*pi)', 'Q')],
        analyses: [A('work', { A: ['1/2', '0', '0'], B: ['3', '0', '0'], Q: { c: '1', sym: 'q' } })],
      }),
    },
    {
      key: 'p11', statement: "Un hilo indefinido con densidad λ está sobre el eje X. En (a, 2a, 0) se coloca un dipolo contenido en el plano XY que solo puede rotar; inicialmente su energía potencial es −bλ/(πaε0) y sobre él actúa un momento 3bλ/(4πaε0) u_z. 1) Determinar el momento dipolar inicial. Con el dipolo ya en equilibrio estable: 2) el campo en A(a, 4a, 0); 3) la diferencia de potencial entre A y B(a, 6a, 0).", title: '11 · Hilo en el eje X y dipolo',
      note: 'El dipolo fuente ya está en su posición de equilibrio estable (p = 5b, en la dirección +Y). Bórralo para ver solo el apartado 1.',
      make: () => scen({
        sources: [S('line', 'λ', { pos: ['0', '0', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda'), S('dipole', 'p', { pos: ['1', '2', '0'], p: ['0', '5', '0'] }, '1', 'b')],
        analyses: [
          A('findDipole', { P: ['1', '2', '0'], sym: 'b', tau: ['0', '0', '3/(4*pi)'], U: '-1/pi', plane: 'z' }),
          A('E', { P: ['1', '4', '0'] }), A('dV', { A: ['1', '4', '0'], B: ['1', '6', '0'], sense: 'AB' }),
        ],
      }),
    },
    {
      key: 'p12', statement: "Una varilla de longitud 4a con densidad λ está en el plano XY, sobre la recta y = 3a, de x = 0 a x = 4a. 1) Campo eléctrico en el origen. 2) En el origen se coloca un dipolo contenido en el plano YZ: obtener p si el momento de fuerzas es p0λ/(30πε0a)(2u_x − u_y + 3u_z).", title: '12 · Varilla finita y dipolo en YZ',
      make: () => scen({
        sources: [S('rod', 'λ', { A: ['0', '3', '0'], B: ['4', '3', '0'] }, '1', 'lambda')],
        analyses: [A('E', { P: ['0', '0', '0'] }), A('findDipole', { P: ['0', '0', '0'], sym: 'p0', tau: ['1/(15*pi)', '-1/(30*pi)', '1/(10*pi)'], U: '', plane: 'x' })],
      }),
    },
    {
      key: 'p13', statement: "Un hilo indefinido con densidad λ coincide con el eje Z y está rodeado por un tubo cilíndrico coaxial de radio 2a con densidad superficial σ = −λ/(4πa). Obtener: 1) el campo eléctrico en (a, 0, 0); 2) el campo en (3a, 0, 0); 3) la diferencia de potencial V(a, 0, 0) − V(2a, 0, 0).", title: '13 · Hilo dentro de un tubo cargado',
      make: () => scen({
        sources: [S('line', 'λ', { pos: ['0', '0', '0'], dir: 'z', mode: 'lambda', R: '1' }, '1', 'lambda'), S('line', 'σ', { pos: ['0', '0', '0'], dir: 'z', mode: 'sigma', R: '2' }, '-1/(4*pi)', 'lambda')],
        analyses: [A('E', { P: ['1', '0', '0'] }), A('E', { P: ['3', '0', '0'] }), A('dV', { A: ['2', '0', '0'], B: ['1', '0', '0'] })],
      }),
    },
    {
      key: 'p14', statement: "Una esfera de radio a centrada en el origen tiene una densidad de carga que crece con la distancia al centro, ρ = ρ0 r/a. Obtener: 1) el campo eléctrico en (a/2, 0, 0); 2) el campo en (2a, 0, 0); 3) el potencial en el centro.", title: '14 · Esfera con ρ = ρ0 r/a',
      make: () => scen({
        sources: [S('sphere', 'ρ', { pos: ['0', '0', '0'], R1: '0', R2: '1', perfil: 'lineal' }, '1', 'rho0')],
        kinds: { rho0: 'rho' },
        analyses: [A('E', { P: ['1/2', '0', '0'] }), A('E', { P: ['2', '0', '0'] }), A('V', { P: ['0', '0', '0'] })],
      }),
    },
    {
      key: 'p15', statement: "Un cilindro indefinido de radio 2a, coaxial con el eje Z, tiene una densidad de carga ρ = ρ0(1 − r/(2a)), máxima en el eje y nula en la superficie. Obtener el campo eléctrico en (a, 0, 0) y en (0, 4a, 0).", title: '15 · Cilindro con ρ = ρ0(1 − r/R)',
      make: () => scen({
        sources: [S('line', 'ρ', { pos: ['0', '0', '0'], dir: 'z', mode: 'rho', R: '2', R1: '', perfil: 'resta' }, '1', 'rho0')],
        kinds: { rho0: 'rho' },
        analyses: [A('E', { P: ['1', '0', '0'] }), A('E', { P: ['0', '4', '0'] })],
      }),
    },
    {
      key: 'p16', statement: "Una semicircunferencia de radio a, con densidad lineal λ, está en el plano XY, centrada en el origen y en la región y > 0. Obtener: 1) el campo eléctrico en el centro; 2) el potencial en el centro; 3) el campo en (0, 0, a).", title: '16 · Semicircunferencia cargada',
      make: () => scen({
        sources: [S('arc', 'λ', { pos: ['0', '0', '0'], axis: 'z', R: '1', t1: '0', t2: '180' }, '1', 'lambda')],
        analyses: [A('E', { P: ['0', '0', '0'] }), A('V', { P: ['0', '0', '0'] }), A('E', { P: ['0', '0', '1'] })],
      }),
    },
    {
      key: 'p17', statement: "Una carga puntual q está en el centro de una corteza esférica conductora de radios a y 2a, con carga neta 2q. Obtener: 1) el campo eléctrico en (a/2, 0, 0), en (3a/2, 0, 0) y en (3a, 0, 0); 2) el potencial de la corteza.", title: '17 · Carga dentro de una corteza conductora',
      make: () => scen({
        sources: [S('point', 'q', { pos: ['0', '0', '0'] }, '1', 'q'), S('hollow', 'Q', { pos: ['0', '0', '0'], R1: '1', R2: '2' }, '2', 'q')],
        analyses: [A('E', { P: ['1/2', '0', '0'] }), A('E', { P: ['3/2', '0', '0'] }), A('E', { P: ['3', '0', '0'] }), A('V', { P: ['3/2', '0', '0'] })],
      }),
    },
    {
      key: 'p18', statement: "Una varilla de longitud 2a sobre el eje X, de x = a a x = 3a, tiene una densidad que crece linealmente desde 0, λ = λ0 (x − a)/(2a). Obtener el campo eléctrico y el potencial en el origen.", title: '18 · Varilla con densidad lineal',
      make: () => scen({
        sources: [S('rod', 'λ', { A: ['1', '0', '0'], B: ['3', '0', '0'], perfil: 'lineal' }, '1', 'lambda0')],
        kinds: { lambda0: 'lambda' },
        analyses: [A('E', { P: ['0', '0', '0'] }), A('V', { P: ['0', '0', '0'] })],
      }),
    },
  ];
  return { section: 'Ejercicios de ejemplo', list, newId: id };
})();


/* =====================================================================
   Lienzo: corte 2D (líneas de campo, equipotenciales, mapa de color,
   puntos arrastrables, cargas de prueba) y vista 3D girable.
   El fondo se guarda en una capa en caché: pasar el ratón o animar
   no recalcula el campo; al arrastrar se dibuja en calidad rápida.
   ===================================================================== */
const Canvas = (() => {
  const { V3 } = Engine;
  const AXES = { xy: [0, 1, 2], xz: [0, 2, 1], yz: [1, 2, 0] };
  const NAMES = ['X', 'Y', 'Z'];
  const AXI = { x: 0, y: 1, z: 2 };
  let cv, g, g0, W = 0, H = 0, dpr = 1;
  let view = { cx: 0, cy: 0, s: 50 }, needFit = true;
  let cam = { yaw: -0.6, pitch: 0.45, s: 50, c: [0, 0, 0] };
  let lastOut = null, lastScen = null, anchors = [], drag = null, hover = null, foco = null; // foco: clave del punto elegido con el teclado
  let bg = null, bgKey = '', outVer = 0, lastOutRef = null, fast = false, fastTimer = 0;
  let place = null, probes = [], anim = 0, legend = null;

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const is3D = () => lastScen?.view?.plane === '3d';
  const ax = () => AXES[lastScen?.view?.plane] || AXES.xy;
  const cutVal = () => { try { return Engine.parseExpr(lastScen?.view?.cut || '0', lastScen?.unit); } catch (e) { return 0; } };
  const toS = (p) => { const [a, b] = ax(); return [W / 2 + (p[a] - view.cx) * view.s, H / 2 - (p[b] - view.cy) * view.s]; };
  const toW = (x, y) => { const [a, b, c] = ax(); const p = [0, 0, 0]; p[a] = view.cx + (x - W / 2) / view.s; p[b] = view.cy - (y - H / 2) / view.s; p[c] = cutVal(); return p; };
  const el = (id) => document.getElementById(id);
  const on = (id) => !!el(id)?.checked;

  function init() {
    cv = el('cv');
    g0 = g = cv.getContext('2d');
    bg = document.createElement('canvas');
    new ResizeObserver(() => { resize(); redraw(); }).observe(cv.parentElement);
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { bgKey = ''; redraw(); });
    new MutationObserver(() => { bgKey = ''; redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { hover = null; if (!drag) redraw(); });
    // con teclado: Intro elige el siguiente punto movible, flechas lo mueven, Esc lo suelta (ver «teclado» más abajo)
    cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-describedby', 'cv-estado');
    cv.setAttribute('aria-label', 'Lienzo del campo. Intro elige el siguiente punto movible, las flechas lo mueven (con Mayús, paso fino) y Esc lo suelta. Sin punto elegido, las flechas desplazan la vista, más y menos acercan o alejan, y 0 encuadra.');
    cv.addEventListener('keydown', teclado);
    cv.addEventListener('blur', () => { if (foco) { foco = null; redraw(); } });
    cv.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 0.87); }, { passive: false });
    resize();
  }
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = Math.max(200, r.width); H = Math.max(220, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    bg.width = W * dpr; bg.height = H * dpr;
    bgKey = '';
  }
  function fit() { needFit = true; }
  function zoom(k) { if (is3D()) cam.s *= k; else view.s *= k; redraw(); }
  const redraw = () => draw(lastOut, lastScen);

  function scenePoints(out) {
    const pts = [];
    for (const s of out.ctx.sources) {
      const G = s.g; if (!G) continue;
      if (G.pos) pts.push(G.pos);
      if (G.A) pts.push(G.A, G.B);
      const R = G.R2 || G.R;
      if (R && G.pos) pts.push(V3.add(G.pos, [R, R, R]), V3.sub(G.pos, [R, R, R]));
      if (G.c !== undefined && G.i !== undefined) { const p = [0, 0, 0]; p[G.i] = G.c + (G.w ? G.w / 2 : 0); pts.push(p); if (G.w) { const q = [0, 0, 0]; q[G.i] = G.c - G.w / 2; pts.push(q); } }
    }
    for (const r of out.results) {
      for (const m of r.marks || []) pts.push(m.at);
      if (r.seg) pts.push(...r.seg);
      if (r.surf) pts.push(V3.add(r.surf.C, [r.surf.R, r.surf.R, r.surf.R]), V3.sub(r.surf.C, [r.surf.R, r.surf.R, r.surf.R]));
    }
    if (!pts.length) pts.push([0, 0, 0]);
    return pts;
  }
  function doFit(out) {
    const pts = scenePoints(out);
    if (is3D()) {
      const lo = [0, 1, 2].map((k) => Math.min(0, ...pts.map((p) => p[k]))), hi = [0, 1, 2].map((k) => Math.max(0, ...pts.map((p) => p[k])));
      cam.c = lo.map((v, k) => (v + hi[k]) / 2);
      const span = Math.max(3, ...hi.map((v, k) => v - lo[k]));
      cam.s = Math.min(W, H) / (span * 1.6);
      needFit = false;
      return;
    }
    const [a, b] = ax();
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (const p of pts) { x0 = Math.min(x0, p[a]); x1 = Math.max(x1, p[a]); y0 = Math.min(y0, p[b]); y1 = Math.max(y1, p[b]); }
    const w = Math.max(x1 - x0, 3), hh = Math.max(y1 - y0, 3);
    view.cx = (x0 + x1) / 2; view.cy = (y0 + y1) / 2;
    view.s = Math.min(W / (w * 1.3 + 1), H / (hh * 1.3 + 1));
    needFit = false;
  }
  function colors() {
    return { bg: css('--canvas'), grid: css('--grid'), axis: css('--muted'), ink: css('--ink'), pos: css('--pos'), neg: css('--neg'), fl: css('--fieldline'), eq: css('--equi'), acc: css('--accent'), dip: css('--dipole'), mark: css('--mark'), probe: css('--probe') };
  }

  /* ----------------------------- dibujo ----------------------------- */
  function draw(out, scen) {
    lastOut = out; lastScen = scen;
    if (!g0 || !out) return;
    if (out !== lastOutRef) { lastOutRef = out; outVer++; }
    if (needFit) doFit(out);
    const C = colors();
    if (is3D()) { g = g0; g.setTransform(dpr, 0, 0, dpr, 0, 0); draw3D(out, scen, C); return; }
    const has = out.ctx.sources.some((s) => s.S && s.g);
    const key = [outVer, view.cx, view.cy, view.s, W, H, scen.view.plane, scen.view.cut, on('t-lines'), on('t-equi'), on('t-grid'), on('t-cmap'), el('cmap-q')?.value, fast, C.bg].join('|');
    if (key !== bgKey) {
      bgKey = key;
      g = bg.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      legend = null;
      if (has && on('t-cmap')) drawCmap(out.ctx, C);
      drawGrid(C);
      if (has && on('t-equi')) drawEqui(out.ctx, C);
      if (has && on('t-grid')) drawArrows(out.ctx, C);
      if (has && on('t-lines')) drawLines(out.ctx, C);
    }
    g = g0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(bg, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    anchors = [];
    drawExtras(out, C);
    out.ctx.sources.forEach((s, i) => drawSource(s, i, C));
    drawMarks(out, scen, C);
    drawProbes(C);
    if (legend) drawLegend(C);
    drawHover(out.ctx, C);
    drawFoco(C);
    if (place) banner(place.hint + (place.pts.length ? ` (${place.pts.length}/${place.n})` : ''), C);
  }
  function banner(text, C) {
    g.font = '600 12.5px "IBM Plex Sans", system-ui, sans-serif';
    const tw = g.measureText(text).width;
    g.fillStyle = C.mark; g.globalAlpha = 0.92; g.fillRect(W / 2 - tw / 2 - 12, 8, tw + 24, 26); g.globalAlpha = 1;
    g.fillStyle = C.bg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, 21);
  }

  function niceStep(px) {
    const target = 46 / px;
    const p = Math.pow(10, Math.floor(Math.log10(target)));
    for (const m of [1, 2, 5, 10]) if (m * p >= target) return m * p;
    return 10 * p;
  }
  function drawGrid(C) {
    const [a, b] = ax();
    const st = niceStep(view.s);
    const p0 = toW(0, H), p1 = toW(W, 0);
    g.lineWidth = 1;
    g.strokeStyle = C.grid;
    g.beginPath();
    for (let x = Math.ceil(p0[a] / st) * st; x <= p1[a]; x += st) { const X = W / 2 + (x - view.cx) * view.s; g.moveTo(X, 0); g.lineTo(X, H); }
    for (let y = Math.ceil(p0[b] / st) * st; y <= p1[b]; y += st) { const Y = H / 2 - (y - view.cy) * view.s; g.moveTo(0, Y); g.lineTo(W, Y); }
    g.stroke();
    const [ox, oy] = toS([0, 0, 0]);
    g.strokeStyle = C.axis; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, oy); g.lineTo(W, oy); g.moveTo(ox, 0); g.lineTo(ox, H); g.stroke();
    g.fillStyle = C.axis; g.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    const u = lastOut.ctx.unit || 'a';
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let x = Math.ceil(p0[a] / st) * st; x <= p1[a]; x += st) { if (Math.abs(x) < st / 2) continue; const X = W / 2 + (x - view.cx) * view.s; g.fillText(fmtTick(x) + u, X, Math.min(Math.max(oy + 4, 4), H - 16)); }
    g.textAlign = 'left'; g.textBaseline = 'middle';
    for (let y = Math.ceil(p0[b] / st) * st; y <= p1[b]; y += st) { if (Math.abs(y) < st / 2) continue; const Y = H / 2 - (y - view.cy) * view.s; g.fillText(fmtTick(y) + u, Math.min(Math.max(ox + 5, 4), W - 40), Y); }
    g.font = 'italic 600 13px "STIX Two Text", Georgia, serif';
    g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(NAMES[a], W - 8, Math.min(Math.max(oy - 4, 16), H - 4));
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(NAMES[b], Math.min(Math.max(ox + 6, 4), W - 20), 6);
  }
  const fmtTick = (x) => String(+x.toFixed(2)).replace('-', '−');

  function E2(ctx, x, y) {
    const E = Physics.fieldNum(ctx, toW(x, y));
    if (!E) return null;
    const [a, b] = ax();
    return [E[a], -E[b]];
  }

  function drawLines(ctx, C) {
    const cell = fast ? 22 : 14, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    const occ = new Int32Array(gw * gh).fill(-1);
    const stops = [];
    const [, , c] = ax(), cut = cutVal();
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      if ((s.src.type === 'point' || s.src.type === 'dipole') && Math.abs(s.g.pos[c] - cut) < 1e-6) stops.push({ p: toS(s.g.pos), q: s.Snum });
      if (s.src.type === 'line' && s.g.mode === 'lambda' && AXI[s.g.dir] === c) stops.push({ p: toS(s.g.pos), q: s.Snum });
    }
    const seeds = [];
    for (const st of stops) {
      const n = fast ? 8 : 14;
      for (let k = 0; k < n; k++) { const t = (2 * Math.PI * k) / n + 0.2; seeds.push([st.p[0] + 9 * Math.cos(t), st.p[1] + 9 * Math.sin(t)]); }
    }
    const sp = fast ? 70 : 46;
    for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) seeds.push([x, y]);
    const h = fast ? 4.5 : 2.5, maxN = fast ? 260 : 700;
    let id = 0;
    g.strokeStyle = C.fl; g.fillStyle = C.fl; g.lineWidth = 1.1;
    for (const sd of seeds) {
      const ci = Math.floor(sd[0] / cell) + Math.floor(sd[1] / cell) * gw;
      if (occ[ci] >= 0) continue;
      const lid = id++;
      const trace = (dir) => {
        const pts = [];
        let p = sd.slice();
        for (let n = 0; n < maxN; n++) {
          const e1 = E2(ctx, p[0], p[1]); if (!e1) break;
          const n1 = Math.hypot(e1[0], e1[1]); if (n1 < 1e-14) break;
          const mid = [p[0] + (dir * h * e1[0]) / n1 / 2, p[1] + (dir * h * e1[1]) / n1 / 2];
          const e2 = E2(ctx, mid[0], mid[1]); if (!e2) break;
          const n2 = Math.hypot(e2[0], e2[1]); if (n2 < 1e-14) break;
          p = [p[0] + (dir * h * e2[0]) / n2, p[1] + (dir * h * e2[1]) / n2];
          if (p[0] < 0 || p[1] < 0 || p[0] > W || p[1] > H) break;
          if (stops.some((st) => Math.hypot(st.p[0] - p[0], st.p[1] - p[1]) < 6)) { pts.push(p); break; }
          const k = Math.floor(p[0] / cell) + Math.floor(p[1] / cell) * gw;
          if (occ[k] >= 0 && occ[k] !== lid && n > 3) break;
          pts.push(p);
        }
        return pts;
      };
      const fw = trace(1), bw = trace(-1);
      const all = [...bw.reverse(), sd, ...fw];
      if (all.length < 8) continue;
      for (const p of all) { const k = Math.floor(p[0] / cell) + Math.floor(p[1] / cell) * gw; if (k >= 0 && k < occ.length) occ[k] = lid; }
      g.beginPath(); g.moveTo(all[0][0], all[0][1]);
      for (const p of all) g.lineTo(p[0], p[1]);
      g.stroke();
      const m = Math.floor(all.length / 2), p0 = all[m - 1], p1 = all[m + 1];
      if (p0 && p1) arrowHead(p1, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 5);
    }
  }
  function arrowHead(p, ang, s) {
    g.beginPath();
    g.moveTo(p[0] + s * Math.cos(ang), p[1] + s * Math.sin(ang));
    g.lineTo(p[0] + s * Math.cos(ang + 2.5), p[1] + s * Math.sin(ang + 2.5));
    g.lineTo(p[0] + s * Math.cos(ang - 2.5), p[1] + s * Math.sin(ang - 2.5));
    g.closePath(); g.fill();
  }
  function arrow(p, v, len, color, w = 2) {
    const n = Math.hypot(v[0], v[1]); if (n < 1e-14) return;
    const q = [p[0] + (v[0] / n) * len, p[1] + (v[1] / n) * len];
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = w;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
    arrowHead(q, Math.atan2(v[1], v[0]), 6);
  }

  function drawArrows(ctx, C) {
    const sp = 40;
    const vals = [];
    for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) { const e = E2(ctx, x, y); if (e) vals.push([x, y, e, Math.hypot(e[0], e[1])]); }
    const mags = vals.map((v) => v[3]).filter((m) => m > 0).sort((p, q) => p - q);
    const ref = mags[Math.floor(mags.length * 0.9)] || 1;
    g.globalAlpha = 0.8;
    for (const [x, y, e, m] of vals) arrow([x - e[0] / m * 8, y - e[1] / m * 8], e, 6 + 12 * Math.min(1, m / ref), C.acc, 1.2);
    g.globalAlpha = 1;
  }

  function sampleV(ctx, st) {
    const nx = Math.ceil(W / st) + 1, ny = Math.ceil(H / st) + 1;
    const V = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[i + j * nx] = Physics.potNum(ctx, toW(i * st, j * st));
    return { V, nx, ny };
  }
  function drawEqui(ctx, C) {
    const st = fast ? 12 : 7;
    const { V, nx, ny } = sampleV(ctx, st);
    const fin = [...V].filter(isFinite).sort((p, q) => p - q);
    if (fin.length < 10) return;
    const lo = fin[Math.floor(fin.length * 0.04)], hi = fin[Math.floor(fin.length * 0.96)];
    if (!(hi > lo)) return;
    const NL = 13, lv = [];
    for (let k = 1; k < NL; k++) lv.push(lo + ((hi - lo) * k) / NL);
    g.strokeStyle = C.eq; g.lineWidth = 1; g.setLineDash([4, 3]);
    g.beginPath();
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const v0 = V[i + j * nx], v1 = V[i + 1 + j * nx], v2 = V[i + 1 + (j + 1) * nx], v3 = V[i + (j + 1) * nx];
      if (!(isFinite(v0) && isFinite(v1) && isFinite(v2) && isFinite(v3))) continue;
      const mn = Math.min(v0, v1, v2, v3), mx = Math.max(v0, v1, v2, v3);
      for (const L of lv) {
        if (L < mn || L > mx) continue;
        const x = i * st, y = j * st, P = [];
        const ed = (va, vb, xa, ya, xb, yb) => { if ((va - L) * (vb - L) < 0) { const t = (L - va) / (vb - va); P.push([xa + t * (xb - xa), ya + t * (yb - ya)]); } };
        ed(v0, v1, x, y, x + st, y); ed(v1, v2, x + st, y, x + st, y + st); ed(v2, v3, x + st, y + st, x, y + st); ed(v3, v0, x, y + st, x, y);
        for (let k = 0; k + 1 < P.length; k += 2) { g.moveTo(P[k][0], P[k][1]); g.lineTo(P[k + 1][0], P[k + 1][1]); }
      }
    }
    g.stroke(); g.setLineDash([]);
  }

  /* --------- mapa de color de V o |E| --------- */
  const rgb = (c) => {
    const m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return [128, 128, 128];
  };
  function drawCmap(ctx, C) {
    const q = el('cmap-q')?.value || 'V';
    const st = fast ? 8 : 4, nx = Math.ceil(W / st), ny = Math.ceil(H / st);
    const vals = new Float64Array(nx * ny);
    const absV = ctx.sources.every((s) => !s.S || s.def.absV);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const X = toW((i + 0.5) * st, (j + 0.5) * st);
      if (q === 'V') vals[i + j * nx] = Physics.potNum(ctx, X);
      else { const E = Physics.fieldNum(ctx, X); vals[i + j * nx] = E ? V3.norm(E) : NaN; }
    }
    const fin = [...vals].filter(isFinite).sort((p, r) => p - r);
    if (fin.length < 4) return;
    const pos = rgb(C.pos), neg = rgb(C.neg), base = rgb(C.bg), acc = rgb(C.acc);
    let map, lo, hi, mid = 0;
    if (q === 'V') {
      mid = absV ? 0 : fin[Math.floor(fin.length / 2)];
      const lim = Math.max(Math.abs(fin[Math.floor(fin.length * 0.03)] - mid), Math.abs(fin[Math.floor(fin.length * 0.97)] - mid)) || 1;
      lo = mid - lim; hi = mid + lim;
      map = (v) => { const t = Math.max(-1, Math.min(1, (v - mid) / lim)); const c = t >= 0 ? pos : neg, a = Math.abs(t) * 0.75; return base.map((b, k) => b + (c[k] - b) * a); };
    } else {
      lo = Math.max(fin[Math.floor(fin.length * 0.03)], 1e-30); hi = fin[Math.floor(fin.length * 0.97)];
      const l0 = Math.log(lo), l1 = Math.log(hi) - l0 || 1;
      map = (v) => { const t = Math.max(0, Math.min(1, (Math.log(Math.max(v, 1e-300)) - l0) / l1)); return base.map((b, k) => b + (acc[k] - b) * t * 0.8); };
    }
    const img = g.createImageData(nx, ny);
    for (let k = 0; k < nx * ny; k++) {
      const v = vals[k];
      const c = isFinite(v) ? map(v) : base;
      img.data[4 * k] = c[0]; img.data[4 * k + 1] = c[1]; img.data[4 * k + 2] = c[2]; img.data[4 * k + 3] = 255;
    }
    const tmp = document.createElement('canvas');
    tmp.width = nx; tmp.height = ny;
    tmp.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(tmp, 0, 0, nx * st, ny * st);
    const si = lastOut.ctx.mode === 'si';
    const f = si ? 1 / Engine.EPS0 : Math.PI;
    legend = { q, lo: lo * f, hi: hi * f, mid: mid * f, absV, si, colors: q === 'V' ? [C.neg, C.bg, C.pos] : [C.bg, C.acc] };
  }
  function drawLegend(C) {
    const w = 150, x = W - w - 14, y = H - 46;
    g.fillStyle = C.bg; g.globalAlpha = 0.88; g.fillRect(x - 8, y - 18, w + 16, 46); g.globalAlpha = 1;
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    legend.colors.forEach((c, i) => gr.addColorStop(i / (legend.colors.length - 1), c));
    g.fillStyle = gr; g.fillRect(x, y, w, 9);
    g.strokeStyle = C.axis; g.lineWidth = 0.5; g.strokeRect(x, y, w, 9);
    g.font = '10.5px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle = C.ink; g.textBaseline = 'top';
    const u = legend.si ? (legend.q === 'V' ? ' V' : ' N/C') : '';
    const fm = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(1) : String(+v.toPrecision(2))).replace('-', '−');
    g.textAlign = 'left'; g.fillText(fm(legend.lo) + u, x, y + 12);
    g.textAlign = 'right'; g.fillText(fm(legend.hi) + u, x + w, y + 12);
    g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText(legend.q === 'V' ? (legend.absV ? 'V' : 'V − V_medio') + (legend.si ? '' : ' ·πε₀a/símb.') : '|E|' + (legend.si ? '' : ' ·πε₀a²/símb.') + ' (log)', x, y - 3);
  }

  function colorOf(s, C) { return !s.S ? C.axis : s.Snum >= 0 ? C.pos : C.neg; }
  function label(text, x, y, color) {
    g.font = 'italic 14px "STIX Two Text", Georgia, serif';
    g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText(text, x, y);
  }
  const prettyName = (n) => String(n).replace(/lambda/i, 'λ').replace(/sigma/i, 'σ').replace(/rho/i, 'ρ').replace(/(\D)(\d+)$/, (_, a, d) => a + d.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[c]).join(''));

  function drawSource(s, i, C) {
    const G = s.g; if (!G) return;
    const [a, b, c] = ax(), cut = cutVal();
    const col = colorOf(s, C);
    const nm = prettyName(s.name) + (s.unknown && !s.unknownSolved ? ' ?' : '');
    const t = s.src.type;
    const addAnchors = () => { for (const an of s.def.anchors(s.src, G)) anchors.push({ p: toS(an.at), path: ['sources', i, ...an.path], at: an.at, lab: nm }); };
    g.lineWidth = 2;
    if (t === 'point' || t === 'dipole') {
      const p = toS(G.pos), inPlane = Math.abs(G.pos[c] - cut) < 1e-6;
      g.globalAlpha = inPlane ? 1 : 0.45;
      if (t === 'point') {
        g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 8, 0, 7); g.fill();
        g.strokeStyle = C.bg; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0] - 4, p[1]); g.lineTo(p[0] + 4, p[1]);
        if (s.Snum >= 0) { g.moveTo(p[0], p[1] - 4); g.lineTo(p[0], p[1] + 4); }
        g.stroke();
      } else {
        const d = [G.p[a], -G.p[b]];
        g.fillStyle = C.dip; g.beginPath(); g.arc(p[0], p[1], 4, 0, 7); g.fill();
        if (Math.hypot(...d) > 1e-12) { const n = Math.hypot(...d); arrow([p[0] - (d[0] / n) * 14, p[1] - (d[1] / n) * 14], d, 30, C.dip, 2.5); }
      }
      label(nm + (inPlane ? '' : ` (${'xyz'[c]}=${fmtTick(G.pos[c])})`), p[0] + 10, p[1] - 6, C.ink);
      g.globalAlpha = 1;
      addAnchors();
    } else if (t === 'line') {
      const di = AXI[G.dir];
      if (di === c) {
        const p = toS(G.pos);
        if (G.mode === 'rho') { g.fillStyle = col; g.globalAlpha = 0.18; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 2 * Math.PI); if (G.R1) { g.moveTo(p[0] + G.R1 * view.s, p[1]); g.arc(p[0], p[1], G.R1 * view.s, 0, 2 * Math.PI); } g.fill('evenodd'); g.globalAlpha = 1; g.strokeStyle = col; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 7); g.stroke(); }
        if (G.mode === 'sigma') { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 7); g.stroke(); g.lineWidth = 1; }
        g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.stroke();
        g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 2.5, 0, 7); g.fill();
        label(nm, p[0] + 10, p[1] - 6, C.ink);
      } else {
        const off = Math.abs(G.pos[c] - cut) > 1e-6;
        const p = toS(G.pos);
        const vert = di !== a;
        g.strokeStyle = col; g.globalAlpha = off ? 0.4 : 1;
        if (G.mode === 'rho') { g.fillStyle = col; g.globalAlpha *= 0.18; const r = G.R * view.s; if (vert) g.fillRect(p[0] - r, 0, 2 * r, H); else g.fillRect(0, p[1] - r, W, 2 * r); g.globalAlpha = off ? 0.4 : 1; }
        if (G.mode === 'sigma') { const r = G.R * view.s; g.lineWidth = 2.5; g.beginPath(); if (vert) { g.moveTo(p[0] - r, 0); g.lineTo(p[0] - r, H); g.moveTo(p[0] + r, 0); g.lineTo(p[0] + r, H); } else { g.moveTo(0, p[1] - r); g.lineTo(W, p[1] - r); g.moveTo(0, p[1] + r); g.lineTo(W, p[1] + r); } g.stroke(); }
        g.lineWidth = 3; g.setLineDash(off ? [6, 4] : []);
        g.beginPath(); if (vert) { g.moveTo(p[0], 0); g.lineTo(p[0], H); } else { g.moveTo(0, p[1]); g.lineTo(W, p[1]); } g.stroke(); g.setLineDash([]);
        label(nm, vert ? p[0] + 6 : 8, vert ? 22 : p[1] - 6, C.ink);
        g.globalAlpha = 1;
      }
      addAnchors();
    } else if (t === 'plane' || t === 'slab') {
      if (G.i === c) { label(`${nm}: plano ${'xyz'[c]} = ${fmtTick(G.c)} (paralelo a la vista)`, 8, H - 8, C.axis); return; }
      const vert = G.i === a;
      const p = toS([G.c, G.c, G.c]);
      g.strokeStyle = col; g.fillStyle = col;
      if (t === 'slab') {
        const r = (G.w / 2) * view.s;
        g.globalAlpha = 0.2; if (vert) g.fillRect(p[0] - r, 0, 2 * r, H); else g.fillRect(0, p[1] - r, W, 2 * r);
        g.globalAlpha = 1; g.lineWidth = 1.5;
        g.beginPath(); if (vert) { g.moveTo(p[0] - r, 0); g.lineTo(p[0] - r, H); g.moveTo(p[0] + r, 0); g.lineTo(p[0] + r, H); } else { g.moveTo(0, p[1] - r); g.lineTo(W, p[1] - r); g.moveTo(0, p[1] + r); g.lineTo(W, p[1] + r); } g.stroke();
        label(nm, vert ? p[0] - r + 6 : 8, vert ? 22 : p[1] - r - 4, C.ink);
      } else {
        g.lineWidth = 5; g.globalAlpha = 0.85;
        g.beginPath(); if (vert) { g.moveTo(p[0], 0); g.lineTo(p[0], H); } else { g.moveTo(0, p[1]); g.lineTo(W, p[1]); } g.stroke();
        g.globalAlpha = 1;
        label(nm, vert ? p[0] + 7 : 8, vert ? 22 : p[1] - 6, C.ink);
      }
    } else if (t === 'hollow') {
      const d = G.pos[c] - cut, p = toS(G.pos), rr = (R) => (R > Math.abs(d) ? Math.sqrt(R * R - d * d) * view.s : 0), r2 = rr(G.R2), r1 = rr(G.R1);
      if (r2 > 0) {
        g.fillStyle = C.axis; g.globalAlpha = 0.25; g.beginPath(); g.arc(p[0], p[1], r2, 0, 2 * Math.PI); if (r1 > 0) { g.moveTo(p[0] + r1, p[1]); g.arc(p[0], p[1], r1, 0, 2 * Math.PI); } g.fill('evenodd');
        g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], r2, 0, 7); g.stroke(); if (r1 > 0) { g.beginPath(); g.arc(p[0], p[1], r1, 0, 7); g.stroke(); }
      }
      label(nm, p[0] + r2 * 0.72 + 4, p[1] - r2 * 0.72, C.ink);
      addAnchors();
    } else if (t === 'arc') {
      const p = toS(G.pos), pts = [];
      for (let i = 0; i <= 64; i++) { const th = G.t1 + ((G.t2 - G.t1) * i) / 64; pts.push(toS(V3.add(G.pos, V3.add(V3.sc(G.e1, G.R * Math.cos(th)), V3.sc(G.e2, G.R * Math.sin(th)))))); }
      g.strokeStyle = col; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 2.5, 0, 7); g.fill();
      const m = pts[32]; label(nm, m[0] + 8, m[1] - 6, C.ink);
      addAnchors();
    } else if (t === 'sphere' || t === 'shell' || t === 'conductor') {
      const d = G.pos[c] - cut;
      const p = toS(G.pos);
      const rr = (R) => (R > Math.abs(d) ? Math.sqrt(R * R - d * d) * view.s : 0);
      const r2 = rr(t === 'sphere' ? G.R2 : G.R), r1 = t === 'sphere' ? rr(G.R1) : 0;
      if (r2 > 0) {
        g.fillStyle = t === 'conductor' ? C.axis : col; g.globalAlpha = t === 'shell' ? 0.06 : 0.2;
        g.beginPath(); g.arc(p[0], p[1], r2, 0, 2 * Math.PI); if (r1 > 0) { g.moveTo(p[0] + r1, p[1]); g.arc(p[0], p[1], r1, 0, 2 * Math.PI); } g.fill('evenodd');
        g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = t === 'shell' || t === 'conductor' ? 3 : 1.5;
        g.beginPath(); g.arc(p[0], p[1], r2, 0, 7); g.stroke();
        if (r1 > 0) { g.lineWidth = 1.5; g.beginPath(); g.arc(p[0], p[1], r1, 0, 7); g.stroke(); }
      }
      label(nm, p[0] + r2 * 0.72 + 4, p[1] - r2 * 0.72, C.ink);
      addAnchors();
    } else if (t === 'ring' || t === 'disk') {
      const p = toS(G.pos), ni = AXI[G.axis], r = G.R * view.s;
      g.strokeStyle = col; g.fillStyle = col;
      if (ni === c) {
        if (t === 'disk') { g.globalAlpha = 0.2; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.globalAlpha = 1; }
        g.lineWidth = t === 'ring' ? 3 : 1.5; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.stroke();
      } else {
        const horiz = ni === b; // el eje del anillo es vertical en pantalla → el anillo se ve como segmento horizontal
        const q0 = horiz ? [p[0] - r, p[1]] : [p[0], p[1] - r], q1 = horiz ? [p[0] + r, p[1]] : [p[0], p[1] + r];
        if (t === 'disk') { g.lineWidth = 5; g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.stroke(); }
        else { g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.stroke(); g.setLineDash([]); for (const q of [q0, q1]) { g.beginPath(); g.arc(q[0], q[1], 5, 0, 7); g.fill(); } }
      }
      label(nm, p[0] + r * 0.72 + 4, p[1] - r * 0.72 - 2, C.ink);
      addAnchors();
    } else if (t === 'rod') {
      const p = toS(G.A), q = toS(G.B);
      g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.lineCap = 'butt';
      label(nm, (p[0] + q[0]) / 2 + 8, (p[1] + q[1]) / 2, C.ink);
      addAnchors();
    }
  }

  // superficies de Gauss y rectas de perfil
  function drawExtras(out, C) {
    const [a, b, c] = ax(), cut = cutVal();
    g.strokeStyle = C.mark; g.lineWidth = 1.5; g.setLineDash([6, 4]);
    for (const r of out.results) {
      if (r.seg) { const p = toS(r.seg[0]), q = toS(r.seg[1]); g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); }
      if (r.surf) {
        const S = r.surf, p = toS(S.C), R = S.R * view.s;
        if (S.shape === 'sphere') { const d = Math.abs(S.C[c] - cut); if (d < S.R) { g.beginPath(); g.arc(p[0], p[1], Math.sqrt(S.R ** 2 - d * d) * view.s, 0, 7); g.stroke(); } }
        else {
          const ni = AXI[S.axis], hh = (S.h / 2) * view.s;
          if (ni === c) { g.beginPath(); g.arc(p[0], p[1], R, 0, 7); g.stroke(); }
          else if (ni === a) g.strokeRect(p[0] - hh, p[1] - R, 2 * hh, 2 * R);
          else g.strokeRect(p[0] - R, p[1] - hh, 2 * R, 2 * hh);
        }
      }
    }
    g.setLineDash([]);
  }

  function drawMarks(out, scen, C) {
    const add = (path, at, lab, vec, dip) => {
      const p = toS(at);
      if (vec) { const [a, b] = ax(); arrow(p, [vec[a], -vec[b]], 42, C.acc, 2.4); }
      if (dip) { const [a, b] = ax(); const d = [dip[a], -dip[b]]; const n = Math.hypot(...d); if (n > 1e-12) arrow([p[0] - (d[0] / n) * 13, p[1] - (d[1] / n) * 13], d, 26, C.dip, 3); }
      g.fillStyle = C.bg; g.strokeStyle = C.mark; g.lineWidth = 2;
      g.beginPath(); g.moveTo(p[0], p[1] - 6); g.lineTo(p[0] + 6, p[1]); g.lineTo(p[0], p[1] + 6); g.lineTo(p[0] - 6, p[1]); g.closePath(); g.fill(); g.stroke();
      g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.mark; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(lab, p[0] + 8, p[1] + 4);
      if (path) anchors.push({ p, path, at, lab });
    };
    const many = scen.analyses.length > 1;
    scen.analyses.forEach((an, i) => {
      for (const m of out.results[i]?.marks || []) add(m.key ? ['analyses', i, m.key] : null, m.at, `${m.label || m.key}${many ? '·' + (i + 1) : ''}`, m.vec, m.dip);
    });
    const P = out.ctx.P;
    (scen.unknown?.conds || []).forEach((cd, j) => {
      const keys = { Ecomp: ['P'], Epar: ['P'], Ezero: ['P'], dV: ['A', 'B'], V: ['P'] }[cd.type] || [];
      for (const k of keys) { try { add(['unknown', 'conds', j, k], cd[k].map(P), k + '*', null); } catch (e) { /* entrada incompleta */ } }
    });
  }

  function drawHover(ctx, C) {
    if (!hover || drag || place) return;
    const w = toW(hover[0], hover[1]);
    const E = Physics.fieldNum(ctx, w);
    const [a, b] = ax(), u = ctx.unit || 'a', si = ctx.mode === 'si';
    const Et = E ? (si ? `${(V3.norm(E) / Engine.EPS0).toPrecision(3)} N/C` : `${(V3.norm(E) * Math.PI).toPrecision(3)}/(πε₀)`) : '';
    const txt = `${'xyz'[a]} = ${w[a].toFixed(2)}${u}, ${'xyz'[b]} = ${w[b].toFixed(2)}${u}` + (E ? `   |E| ≈ ${Et}` : '');
    g.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    const tw = g.measureText(txt).width;
    g.fillStyle = C.bg; g.globalAlpha = 0.9; g.fillRect(6, H - 26, tw + 12, 20); g.globalAlpha = 1;
    g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, 12, H - 16);
  }

  /* ------------------- cargas de prueba animadas ------------------- */
  function addProbe(X, sign) {
    const E = Physics.fieldNum(lastOut.ctx, X);
    if (!E) return;
    const k = 220 / (view.s * Math.max(V3.norm(E), 1e-12)); // aceleración inicial ≈ 220 px/s²
    probes.push({ x: X.slice(), v: [0, 0, 0], k: k * sign, sign, trail: [X.slice()], alive: true, t: 0 });
    // con «reducir movimiento» no se anima: la trayectoria sale entera de golpe
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { for (let i = 0; i < 500 && probes.some((p) => p.alive); i++) stepProbes(0.05); redraw(); return; }
    if (!anim) { let last = performance.now(); const step = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; stepProbes(dt); redraw(); anim = probes.some((p) => p.alive) ? requestAnimationFrame(step) : 0; }; anim = requestAnimationFrame(step); }
  }
  function stepProbes(dt) {
    const ctx = lastOut?.ctx; if (!ctx) return;
    const sub = 10, h = dt / sub, lim = 3 * Math.max(W, H) / view.s;
    for (const p of probes) {
      if (!p.alive) continue;
      for (let i = 0; i < sub; i++) {
        const E = Physics.fieldNum(ctx, p.x);
        if (!E || !E.every(isFinite)) { p.alive = false; break; }
        const acc = V3.sc(E, p.k);
        p.v = V3.add(p.v, V3.sc(acc, h));
        p.x = V3.add(p.x, V3.sc(p.v, h));
        if (V3.norm(V3.sub(p.x, [view.cx, view.cy, 0])) > lim && V3.norm(V3.sub(p.x, toW(W / 2, H / 2))) > lim) { p.alive = false; break; }
        if (ctx.sources.some((s) => s.g?.pos && s.src.type === 'point' && V3.norm(V3.sub(s.g.pos, p.x)) < 6 / view.s)) { p.alive = false; break; }
      }
      p.t += dt;
      if (p.t > 25) p.alive = false;
      const last = p.trail[p.trail.length - 1];
      if (V3.norm(V3.sub(p.x, last)) * view.s > 2) p.trail.push(p.x.slice());
      if (p.trail.length > 1500) p.trail.shift();
    }
  }
  function drawProbes(C) {
    for (const p of probes) {
      const col = p.sign > 0 ? C.pos : C.neg;
      g.strokeStyle = col; g.globalAlpha = 0.7; g.lineWidth = 1.6;
      g.beginPath(); p.trail.forEach((q, i) => { const s = toS(q); if (i) g.lineTo(...s); else g.moveTo(...s); }); g.stroke();
      g.globalAlpha = 1;
      const s = toS(p.x);
      g.fillStyle = C.probe || col; g.beginPath(); g.arc(s[0], s[1], 5, 0, 7); g.fill();
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(s[0], s[1], 5, 0, 7); g.stroke();
    }
  }
  function clearProbes() { probes = []; redraw(); }

  /* ----------------------------- vista 3D ----------------------------- */
  function proj(p) {
    const q = V3.sub(p, cam.c);
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = cy * q[0] - sy * q[1], y1 = sy * q[0] + cy * q[1];
    const yv = q[2] * cp - y1 * sp, depth = y1 * cp + q[2] * sp;
    const f = 1 / (1 - depth * cam.s / (Math.min(W, H) * 2.2));
    return [W / 2 + x1 * cam.s * f, H / 2 - yv * cam.s * f, depth, f];
  }
  function line3(a, b) { const p = proj(a), q = proj(b); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
  function arrow3(p0, v, len, color, w = 2) {
    const a = proj(p0), b = proj(V3.add(p0, V3.sc(V3.unit(v), len / cam.s)));
    arrow([a[0], a[1]], [b[0] - a[0], b[1] - a[1]], Math.hypot(b[0] - a[0], b[1] - a[1]), color, w);
  }
  function draw3D(out, scen, C) {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const ctx = out.ctx, L = Math.min(W, H) / cam.s * 0.5, c0 = cam.c;
    // rejilla en z = 0 y ejes
    g.strokeStyle = C.grid; g.lineWidth = 1;
    const st = niceStep(cam.s);
    const gx0 = Math.floor((c0[0] - L) / st) * st, gy0 = Math.floor((c0[1] - L) / st) * st;
    for (let x = gx0; x <= c0[0] + L; x += st) line3([x, c0[1] - L, 0], [x, c0[1] + L, 0]);
    for (let y = gy0; y <= c0[1] + L; y += st) line3([c0[0] - L, y, 0], [c0[0] + L, y, 0]);
    g.strokeStyle = C.axis; g.lineWidth = 1.4;
    g.font = 'italic 600 13px "STIX Two Text", Georgia, serif'; g.fillStyle = C.axis; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const e = [0, 0, 0]; e[k] = L * 1.05;
      line3(V3.sc(e, -1), e);
      const p = proj(V3.sc(e, 1.07)); g.fillText(NAMES[k], p[0], p[1]);
    }
    // campo: flechas en una malla 3D
    if (on('t-grid') || on('t-lines')) {
      const n = fast ? 4 : 6, vals = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        const X = [c0[0] - L * 0.8 + (1.6 * L * i) / (n - 1), c0[1] - L * 0.8 + (1.6 * L * j) / (n - 1), c0[2] - L * 0.8 + (1.6 * L * k) / (n - 1)];
        const E = Physics.fieldNum(ctx, X);
        if (E && V3.norm(E) > 0) vals.push([X, E, V3.norm(E)]);
      }
      const ms = vals.map((v) => v[2]).sort((a, b) => a - b), ref = ms[Math.floor(ms.length * 0.9)] || 1;
      g.globalAlpha = 0.55;
      for (const [X, E, m] of vals) arrow3(X, E, 8 + 14 * Math.min(1, m / ref), C.acc, 1.2);
      g.globalAlpha = 1;
    }
    if (on('t-lines')) drawLines3D(ctx, C, L);
    // fuentes, de atrás hacia delante
    const items = ctx.sources.filter((s) => s.g).map((s) => ({ s, d: proj(s.g.pos || s.g.A || c0)[2] }));
    items.sort((a, b) => a.d - b.d);
    for (const { s } of items) drawSource3D(s, C, L);
    // superficies de Gauss, discontinuas como en 2D
    g.strokeStyle = C.mark; g.lineWidth = 1.5; g.setLineDash([6, 4]);
    for (const r of out.results) {
      if (!r.surf) continue;
      const S = r.surf;
      if (S.shape === 'sphere') { const p = proj(S.C); g.beginPath(); g.arc(p[0], p[1], S.R * cam.s * p[3], 0, 7); g.stroke(); ring3(S.C, [0, 0, 1], S.R, 1, 0.4); }
      else cylinder3(S.C, S.n, S.R, S.h, 0, 1);
    }
    g.setLineDash([]);
    for (const r of out.results) for (const m of r.marks || []) {
      const p = proj(m.at);
      if (m.vec) arrow3(m.at, m.vec, 42, C.acc, 2.4);
      if (m.dip && V3.norm(m.dip) > 0) arrow3(V3.sub(m.at, V3.sc(V3.unit(m.dip), 13 / cam.s)), m.dip, 26, C.dip, 3);
      g.fillStyle = C.bg; g.strokeStyle = C.mark; g.lineWidth = 2;
      g.beginPath(); g.arc(p[0], p[1], 5, 0, 7); g.fill(); g.stroke();
      g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.mark; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(m.label || m.key || '', p[0] + 7, p[1] + 3);
    }
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.axis; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText('Arrastra para girar · Ctrl + rueda o +/− para acercar', 10, H - 8);
  }
  function drawLines3D(ctx, C, L) {
    const lim = L * 1.2;
    g.strokeStyle = C.fl; g.lineWidth = 1; g.globalAlpha = 0.85;
    const dirs = [];
    const N = fast ? 8 : 14;
    for (let i = 0; i < N; i++) { const z = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - z * z), t = i * 2.39996; dirs.push([r * Math.cos(t), r * Math.sin(t), z]); }
    const h = 1.5 / cam.s;
    for (const s of ctx.sources) {
      if (!s.g || !s.S || s.src.type !== 'point') continue;
      const sgn = s.Snum >= 0 ? 1 : -1;
      for (const d of dirs) {
        let p = V3.add(s.g.pos, V3.sc(d, 8 / cam.s));
        const pts = [p];
        for (let n = 0; n < (fast ? 250 : 600); n++) {
          const E = Physics.fieldNum(ctx, p); if (!E) break;
          const m = V3.norm(E); if (m < 1e-14) break;
          p = V3.add(p, V3.sc(E, (sgn * h * 2) / m));
          if (Math.abs(p[0] - cam.c[0]) > lim || Math.abs(p[1] - cam.c[1]) > lim || Math.abs(p[2] - cam.c[2]) > lim) break;
          pts.push(p);
          if (ctx.sources.some((o) => o !== s && o.src.type === 'point' && V3.norm(V3.sub(o.g.pos, p)) < 6 / cam.s)) break;
        }
        g.beginPath(); pts.forEach((q, i) => { const pp = proj(q); if (i) g.lineTo(pp[0], pp[1]); else g.moveTo(pp[0], pp[1]); }); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
  function circle3(c, n, R) {
    const e1 = Math.abs(n[0]) < 0.9 ? V3.unit(V3.cross(n, [1, 0, 0])) : V3.unit(V3.cross(n, [0, 1, 0])), e2 = V3.cross(n, e1);
    const pts = [];
    for (let i = 0; i <= 48; i++) { const t = (2 * Math.PI * i) / 48; pts.push(proj(V3.add(c, V3.add(V3.sc(e1, R * Math.cos(t)), V3.sc(e2, R * Math.sin(t)))))); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  }
  // cilindro de eje u y radio R entre c − u·h/2 y c + u·h/2. Es convexo, así que su contorno
  // en pantalla es la envolvente convexa de las dos tapas proyectadas (vale también en perspectiva).
  function cylinder3(c, u, R, h, fill, rings) {
    const e1 = Math.abs(u[0]) < 0.9 ? V3.unit(V3.cross(u, [1, 0, 0])) : V3.unit(V3.cross(u, [0, 1, 0])), e2 = V3.cross(u, e1);
    const pts = [];
    for (const k of [-0.5, 0.5]) for (let i = 0; i < 48; i++) {
      const t = (2 * Math.PI * i) / 48;
      pts.push(proj(V3.add(V3.add(c, V3.sc(u, h * k)), V3.add(V3.sc(e1, R * Math.cos(t)), V3.sc(e2, R * Math.sin(t))))).concat(k));
    }
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const crs = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length > 1 && crs(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length > 1 && crs(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
    g.beginPath(); hull.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    if (fill) { g.globalAlpha = fill; g.fill(); g.globalAlpha = 1; }
    // lados: solo las aristas que unen una tapa con la otra (el resto del contorno lo dibujan las tapas)
    g.beginPath();
    hull.forEach((p, i) => { const q = hull[(i + 1) % hull.length]; if (p[4] !== q[4]) { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } });
    g.stroke();
    for (let k = 0; k <= rings; k++) { circle3(V3.add(c, V3.sc(u, h * (k / rings - 0.5))), u, R); g.stroke(); }
  }
  // circunferencia de centro c, normal n y radio R: la mitad delantera más marcada que la trasera
  function ring3(c, n, R, front, back) {
    const e1 = Math.abs(n[0]) < 0.9 ? V3.unit(V3.cross(n, [1, 0, 0])) : V3.unit(V3.cross(n, [0, 1, 0])), e2 = V3.cross(n, e1), d0 = proj(c)[2];
    const pts = [];
    for (let i = 0; i <= 64; i++) { const t = (2 * Math.PI * i) / 64; pts.push(proj(V3.add(c, V3.add(V3.sc(e1, R * Math.cos(t)), V3.sc(e2, R * Math.sin(t)))))); }
    for (const [side, a] of [[true, front], [false, back]]) {
      g.globalAlpha = a; g.beginPath();
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i];
        if ((p[2] + q[2] > 2 * d0) !== side) continue;
        if (i === 1 || (pts[i - 2][2] + p[2] > 2 * d0) !== side) g.moveTo(p[0], p[1]);
        g.lineTo(q[0], q[1]);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  // esfera con volumen: relleno, sombra suave en el borde (sin reflejo), ecuador y dos meridianos
  function sphere3(c, R, col, fill) {
    const p = proj(c), r = R * cam.s * p[3];
    g.fillStyle = col; g.globalAlpha = fill; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill();
    const gr = g.createRadialGradient(p[0], p[1], r * 0.55, p[0], p[1], r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill();
    g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1;
    for (const n of [[0, 0, 1], [1, 0, 0], [0, 1, 0]]) ring3(c, n, R, 0.55, 0.15);
    g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.stroke();
    return p;
  }
  function drawSource3D(s, C, L) {
    const G = s.g, t = s.src.type, col = colorOf(s, C), nm = prettyName(s.name);
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
    let lp = null;
    if (t === 'point') { const p = proj(G.pos); g.beginPath(); g.arc(p[0], p[1], 7 * p[3], 0, 7); g.fill(); lp = p; }
    else if (t === 'dipole') { arrow3(V3.sub(G.pos, V3.sc(V3.unit(G.p), 14 / cam.s)), G.p, 30, C.dip, 2.5); lp = proj(G.pos); }
    else if (t === 'line' && G.mode === 'rho') {
      // cilindro macizo de radio R (centrado en la proyección de la cámara sobre su eje)
      const c = V3.add(G.pos, V3.sc(G.u, V3.dot(V3.sub(cam.c, G.pos), G.u)));
      g.lineWidth = 1.5; cylinder3(c, G.u, G.R, L * 2.4, 0.18, 4);
      lp = proj(V3.add(V3.add(c, V3.sc(G.u, L)), V3.sc(Math.abs(G.u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], G.R)));
    } else if (t === 'line' && G.mode === 'sigma') {
      const c = V3.add(G.pos, V3.sc(G.u, V3.dot(V3.sub(cam.c, G.pos), G.u)));
      g.lineWidth = 2; cylinder3(c, G.u, G.R, L * 2.4, 0.06, 4);
      lp = proj(V3.add(V3.add(c, V3.sc(G.u, L)), V3.sc(Math.abs(G.u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], G.R)));
    } else if (t === 'hollow') {
      sphere3(G.pos, G.R1, col, 0.05); const p = sphere3(G.pos, G.R2, C.axis, 0.18), R = G.R2 * cam.s * p[3];
      lp = [p[0] + R * 0.7, p[1] - R * 0.7];
    } else if (t === 'arc') {
      g.lineWidth = 4; g.beginPath();
      for (let i = 0; i <= 64; i++) { const th = G.t1 + ((G.t2 - G.t1) * i) / 64, q = proj(V3.add(G.pos, V3.add(V3.sc(G.e1, G.R * Math.cos(th)), V3.sc(G.e2, G.R * Math.sin(th))))); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
      g.stroke(); lp = proj(V3.add(G.pos, V3.add(V3.sc(G.e1, G.R * Math.cos((G.t1 + G.t2) / 2)), V3.sc(G.e2, G.R * Math.sin((G.t1 + G.t2) / 2)))));
    } else if (t === 'line') {
      g.lineWidth = 3;
      line3(V3.sub(G.pos, V3.sc(G.u, L * 1.2)), V3.add(G.pos, V3.sc(G.u, L * 1.2))); lp = proj(V3.add(G.pos, V3.sc(G.u, L)));
    } else if (t === 'plane' || t === 'slab') {
      const offs = t === 'slab' ? [-G.w / 2, G.w / 2] : [0];
      for (const o of offs) {
        const k1 = (G.i + 1) % 3, k2 = (G.i + 2) % 3, corner = (u, v) => { const p = cam.c.slice(); p[G.i] = G.c + o; p[k1] = cam.c[k1] + u * L; p[k2] = cam.c[k2] + v * L; return proj(p); };
        const q = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
        g.globalAlpha = 0.14; g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
        g.globalAlpha = 0.6; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
        lp = q[2];
      }
    } else if (t === 'sphere' || t === 'shell' || t === 'conductor') {
      const p = sphere3(G.pos, t === 'sphere' ? G.R2 : G.R, t === 'conductor' ? C.axis : col, t === 'shell' ? 0.1 : 0.24), R = (t === 'sphere' ? G.R2 : G.R) * cam.s * p[3];
      lp = [p[0] + R * 0.7, p[1] - R * 0.7];
    } else if (t === 'ring' || t === 'disk') {
      circle3(G.pos, G.n, G.R);
      if (t === 'disk') { g.globalAlpha = 0.2; g.fill(); g.globalAlpha = 1; }
      g.lineWidth = t === 'ring' ? 3 : 1.5; g.stroke();
      lp = proj(V3.add(G.pos, V3.sc(G.n, 0.2)));
    } else if (t === 'rod') { g.lineWidth = 5; line3(G.A, G.B); lp = proj(G.B); }
    if (lp) label(nm, lp[0] + 8, lp[1] - 4, C.ink);
  }

  /* --------------------------- interacción --------------------------- */
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function setPlace(spec) {
    place = spec ? { ...spec, pts: [] } : null;
    cv.classList.toggle('placing', !!place);
    redraw();
    if (place) decir(`${place.hint || 'Colocar'}. Con teclado: flechas para mover la vista e Intro para colocarlo en el centro del lienzo.`);
  }
  function down(e) {
    const p = pos(e);
    if (place && !is3D()) {
      const w = toW(p[0], p[1]);
      const snap = e.shiftKey ? 0.01 : 0.25, [a, b] = ax();
      for (const k of [a, b]) w[k] = +(Math.round(w[k] / snap) * snap).toFixed(2);
      place.pts.push(w);
      if (place.pts.length >= place.n) { const sp = place; place = null; cv.classList.remove('placing'); sp.done(sp.pts); }
      else redraw();
      return;
    }
    if (is3D()) { drag = { rot: p, y0: cam.yaw, p0: cam.pitch }; cv.setPointerCapture(e.pointerId); return; }
    let best = null, bd = 14;
    for (const an of anchors) { const d = Math.hypot(an.p[0] - p[0], an.p[1] - p[1]); if (d < bd) { bd = d; best = an; } }
    drag = best ? { anchor: best } : { pan: p, c0: [view.cx, view.cy] };
    if (best) { fast = true; }
    cv.setPointerCapture(e.pointerId);
    cv.classList.add('dragging');
  }
  function move(e) {
    const p = pos(e);
    if (!drag) {
      hover = is3D() ? null : p;
      const near = anchors.some((an) => Math.hypot(an.p[0] - p[0], an.p[1] - p[1]) < 14);
      cv.style.cursor = place ? 'copy' : is3D() ? 'grab' : near ? 'grab' : 'crosshair';
      if (!is3D()) redraw();
      return;
    }
    if (drag.rot) {
      cam.yaw = drag.y0 + (p[0] - drag.rot[0]) * 0.01;
      cam.pitch = Math.max(-1.5, Math.min(1.5, drag.p0 + (p[1] - drag.rot[1]) * 0.01));
      fast = true; redraw();
      return;
    }
    if (drag.pan) {
      view.cx = drag.c0[0] - (p[0] - drag.pan[0]) / view.s;
      view.cy = drag.c0[1] + (p[1] - drag.pan[1]) / view.s;
      fast = true; redraw();
      return;
    }
    const w = toW(p[0], p[1]);
    const snap = e.shiftKey ? 0.01 : 0.25;
    const [a, b] = ax();
    for (const k of [a, b]) App.onDrag([...drag.anchor.path, k], String(+(Math.round(w[k] / snap) * snap).toFixed(2)));
  }
  function up() {
    const was = drag; drag = null; cv.classList.remove('dragging');
    if (was && (was.anchor ? App.endDrag?.() : true)) { /* fin del arrastre */ }
    clearTimeout(fastTimer);
    fastTimer = setTimeout(() => { fast = false; redraw(); }, 120);
  }
  /* ------------------------- teclado ------------------------- */
  // Cada punto que se arrastra con el ratón (cargas, extremos, puntos de cálculo) se elige con Intro y se mueve con las flechas;
  // lo que pasa se dice en la región #cv-estado (aria-live) para quien usa lector de pantalla.
  const clave = (an) => JSON.stringify(an.path);
  const decir = (t) => { const e = el('cv-estado'); if (e) e.textContent = t; };
  const coma = (x) => String(+x.toFixed(2)).replace('.', ',').replace('-', '−');
  function dondeEsta(an) {
    const [a, b] = ax(), u = lastOut?.ctx?.unit || 'a';
    return `${an.lab}, en ${'xyz'[a]} = ${coma(an.at[a])}${u}, ${'xyz'[b]} = ${coma(an.at[b])}${u}`;
  }
  function elegido() { return foco ? anchors.find((an) => clave(an) === foco) : null; }
  function elige(dir) {
    if (!anchors.length) { decir('No hay ningún punto que se pueda mover.'); return; }
    const i = anchors.findIndex((an) => clave(an) === foco), j = ((i < 0 ? (dir > 0 ? -1 : 0) : i) + dir + anchors.length) % anchors.length;
    foco = clave(anchors[j]); redraw();
    decir(`Punto ${j + 1} de ${anchors.length}: ${dondeEsta(anchors[j])}. Flechas para moverlo.`);
  }
  function teclado(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, flecha = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[k];
    if (is3D()) {
      if (!flecha) return;
      e.preventDefault(); cam.yaw += flecha[0] * 0.1; cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch - flecha[1] * 0.1)); redraw(); return;
    }
    if (place) {
      if (k === 'Enter') {
        e.preventDefault();
        const w = toW(W / 2, H / 2), [a, b] = ax();
        for (const c of [a, b]) w[c] = +(Math.round(w[c] / 0.25) * 0.25).toFixed(2);
        place.pts.push(w);
        if (place.pts.length >= place.n) { const sp = place; place = null; cv.classList.remove('placing'); sp.done(sp.pts); decir('Punto colocado.'); }
        else { redraw(); decir(`Punto ${place.pts.length} de ${place.n} colocado.`); }
        return;
      }
    }
    if (flecha) {
      e.preventDefault();
      const an = elegido();
      if (an) {
        const [a, b] = ax(), paso = e.shiftKey ? 0.01 : 0.25, nuevo = { [a]: an.at[a] + flecha[0] * paso, [b]: an.at[b] + flecha[1] * paso };
        for (const c of [a, b]) App.onDrag([...an.path, c], String(+(Math.round(nuevo[c] / paso) * paso).toFixed(2)));
        App.endDrag?.();
        const ant = clave(an);
        setTimeout(() => { const nu = anchors.find((x) => clave(x) === ant); if (nu) decir(`${coma(nu.at[a])}${lastOut?.ctx?.unit || 'a'}, ${coma(nu.at[b])}${lastOut?.ctx?.unit || 'a'}`); }, 150);
      } else { view.cx += (flecha[0] * 30) / view.s; view.cy += (flecha[1] * 30) / view.s; redraw(); }
    } else if (k === 'Enter' || k === ' ') { e.preventDefault(); elige(e.shiftKey ? -1 : 1); }
    else if (k === 'Escape' && foco) { foco = null; redraw(); decir('Punto soltado.'); }
    else if (k === '+' || k === '=') { e.preventDefault(); zoom(1.15); }
    else if (k === '-' || k === '_') { e.preventDefault(); zoom(0.87); }
    else if (k === '0' || k === 'Home') { e.preventDefault(); fit(); redraw(); }
  }
  // el anillo alrededor del punto elegido con el teclado
  function drawFoco(C) {
    const an = elegido(); if (!an) return;
    g.save(); g.strokeStyle = C.ink; g.lineWidth = 2; g.setLineDash([4, 3]);
    g.beginPath(); g.arc(an.p[0], an.p[1], 15, 0, 7); g.stroke(); g.restore();
  }
  function snapshot() { try { return cv.toDataURL('image/png'); } catch (e) { return ''; } }

  return { init, draw, fit, zoom, setPlace, addProbe, clearProbes, snapshot, isPlacing: () => !!place, toWorldCenter: () => toW(W / 2, H / 2) };
})();


/* =====================================================================
   Interfaz: barra lateral (biblioteca, buscador, carpetas), editor del
   problema, resultados, modo práctica, exportar, deshacer/rehacer,
   colocar con clic, gráficas y archivos .emsim.json.
   ===================================================================== */
(() => {
  const { SOURCES, ANALYSES, CONDS } = Physics;
  const { KINDS } = Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  };
  const K_LIB = 'electro-sim-lib-v2', K_CUR = 'electro-sim-cur-v2', K_UI = 'electro-sim-ui-v2';
  const FORMAT = 'simulador-electrostatica';
  let uid = 0;
  const newId = () => 'u' + Date.now().toString(36) + (uid++).toString(36);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const blankScene = () => ({ unit: 'a', mode: 'sym', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, sources: [], analyses: [] });
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const arrows = (s) => String(s).replace(/(.)⃗/g, '<span class="vv">$1</span>');

  /* ---------------- estado ---------------- */
  let lib = store.get(K_LIB, { items: [] });
  let ui = { side: true, presetsOpen: true, folders: {}, practice: false, ...store.get(K_UI, {}) };
  let cur = null; // { ref: {kind: 'preset'|'lib', id}, title, statement, folder, tags, scene }
  let scen = null; // atajo a cur.scene
  let out = null;
  let query = '';
  const isMobile = () => matchMedia('(max-width: 900px)').matches;
  const saveUI = () => store.set(K_UI, ui);

  function validScene(s) {
    if (!s || !Array.isArray(s.sources)) throw new Error('falta la lista de fuentes');
    const sc = { ...blankScene(), ...s };
    sc.view = { plane: 'xy', cut: '0', ...(s.view || {}) };
    sc.kinds = s.kinds || {};
    sc.mode = s.mode === 'si' ? 'si' : 'sym';
    sc.sources = s.sources.filter((x) => SOURCES[x.type]).map((x) => ({ id: x.id || newId(), ...x }));
    sc.analyses = (s.analyses || []).filter((x) => ANALYSES[x.type]).map((x) => ({ id: x.id || newId(), ...x }));
    Physics.normUnknown(sc);
    if (sc.unknown) {
      sc.unknown.srcs = sc.unknown.srcs.filter((id) => sc.sources.some((x) => x.id === id));
      sc.unknown.conds = sc.unknown.conds.filter((c) => CONDS[c.type]);
    }
    return sc;
  }

  function openRef(ref, { focus = null } = {}) {
    cancelPlace();
    if (ref.kind === 'preset') {
      const p = Presets.list.find((x) => x.key === ref.id);
      if (!p) return openRef({ kind: 'preset', id: Presets.list[0].key });
      cur = { ref, title: p.title, statement: p.statement || '', note: p.note || '', scene: validScene(p.make()) };
    } else {
      const it = lib.items.find((x) => x.id === ref.id);
      if (!it) return openRef({ kind: 'preset', id: Presets.list[0].key });
      cur = { ref, title: it.title, statement: it.statement || '', folder: it.folder || '', tags: it.tags || [], note: '', scene: validScene(clone(it.scene)) };
    }
    scen = cur.scene;
    store.set(K_CUR, cur);
    resetHistory();
    Canvas.clearProbes();
    if (isMobile()) setSide(false);
    Canvas.fit();
    renderSidebar();
    renderAll();
    if (focus) { const t = $(focus); t.focus(); t.select?.(); }
  }

  // guarda el trabajo en curso y, si es un problema propio, lo actualiza en la biblioteca
  function persist() {
    store.set(K_CUR, cur);
    if (cur.ref.kind !== 'lib') return;
    const it = lib.items.find((x) => x.id === cur.ref.id);
    if (!it) return;
    Object.assign(it, { scene: clone(scen), title: cur.title, statement: cur.statement, folder: cur.folder || '', tags: cur.tags || [], updated: Date.now() });
    store.set(K_LIB, lib);
  }

  function addToLib({ title, statement, scene, origin = 'mio', file, folder = '', tags = [] }) {
    const it = { id: newId(), title: title || 'Problema sin título', statement: statement || '', scene: clone(scene), origin, file, folder, tags, updated: Date.now() };
    lib.items.unshift(it);
    store.set(K_LIB, lib);
    return it;
  }

  /* ---------------- barra lateral ---------------- */
  function setSide(open) {
    const app = $('#app');
    if (isMobile()) app.classList.toggle('mobile-open', open);
    else { ui.side = open; saveUI(); app.classList.toggle('closed', !open); }
    setTimeout(() => Canvas.draw(out, scen), 220);
  }
  let menuFor = null;
  function closeMenu() { menuFor = null; document.querySelectorAll('.menu').forEach((m) => m.remove()); }
  function openMenu(anchor, key, actions) {
    if (menuFor === key) return closeMenu();
    closeMenu(); menuFor = key;
    const m = h('div', { class: 'menu', role: 'menu' }, actions.map((a) => {
      const b = h('button', { role: 'menuitem', class: a.danger ? 'danger' : '' }, a.label);
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (a.confirm && !b.dataset.armed) { b.dataset.armed = '1'; b.textContent = a.confirm; return; }
        closeMenu(); a.run();
      });
      return b;
    }));
    anchor.append(m);
  }
  function itemRow({ ref, title, sub, actions }) {
    const active = cur && cur.ref.kind === ref.kind && cur.ref.id === ref.id;
    const row = h('div', { class: 'item' + (active ? ' active' : ''), role: 'listitem' },
      h('button', { class: 'it', title, onclick: () => openRef(ref) }, h('span', { class: 'it-t' }, title), sub ? h('span', { class: 'it-s' }, sub) : null));
    row.append(h('button', { class: 'more', 'aria-label': 'Opciones de ' + title, title: 'Opciones', onclick: (e) => { e.stopPropagation(); openMenu(row, ref.kind + ref.id, actions); } }, '⋯'));
    return row;
  }
  function libActions(it) {
    return [
      { label: 'Renombrar', run: () => openRef({ kind: 'lib', id: it.id }, { focus: '#title' }) },
      { label: 'Mover a carpeta / etiquetas', run: () => openRef({ kind: 'lib', id: it.id }, { focus: '#folder' }) },
      { label: 'Duplicar', run: () => { const c = addToLib({ ...it, title: it.title + ' (copia)', origin: 'mio' }); openRef({ kind: 'lib', id: c.id }); } },
      { label: 'Guardar en archivo', run: () => saveJSON(slug(it.title) + '.emsim.json', pack([it])) },
      { label: 'Eliminar', confirm: 'Pulsa otra vez para eliminar', danger: true, run: () => {
        lib.items = lib.items.filter((x) => x.id !== it.id); store.set(K_LIB, lib);
        if (cur.ref.kind === 'lib' && cur.ref.id === it.id) openRef({ kind: 'preset', id: Presets.list[0].key }); else renderSidebar();
        flash('Problema eliminado');
      } },
    ];
  }
  const matches = (it) => !query || norm([it.title, it.statement, it.folder, ...(it.tags || [])].join(' ')).includes(query);
  const subOf = (it) => [it.origin === 'importado' ? it.file : '', ...(it.tags || []).map((t) => '#' + t)].filter(Boolean).join(' ');
  // agrupa por carpeta: primero los sueltos, luego cada carpeta plegable
  function grouped(items) {
    const loose = items.filter((x) => !x.folder), folders = {};
    for (const it of items) if (it.folder) (folders[it.folder] ||= []).push(it);
    const row = (it) => itemRow({ ref: { kind: 'lib', id: it.id }, title: it.title, sub: subOf(it), actions: libActions(it) });
    const outEls = loose.map(row);
    for (const name of Object.keys(folders).sort((a, b) => a.localeCompare(b, 'es'))) {
      const open = query || !ui.folders[name];
      outEls.push(h('div', { class: 'fold' },
        h('button', { class: 'fold-h', 'aria-expanded': String(!!open), onclick: () => { ui.folders[name] = !ui.folders[name]; saveUI(); renderSidebar(); } },
          h('span', { class: 'chev' }, open ? '▾' : '▸'), h('span', { class: 'fold-n' }, name), h('span', { class: 'count' }, String(folders[name].length))),
        open ? h('div', { class: 'fold-l' }, folders[name].map(row)) : null));
    }
    return outEls;
  }
  function renderSidebar() {
    const box = $('#side-list');
    box.replaceChildren();
    const byDate = (a, b) => b.updated - a.updated;
    const mine = lib.items.filter((x) => x.origin !== 'importado' && matches(x)).sort(byDate);
    const imp = lib.items.filter((x) => x.origin === 'importado' && matches(x)).sort(byDate);
    const pres = Presets.list.filter((p) => matches({ title: p.title, statement: p.statement }));
    const section = (title, key, items, empty) => {
      const open = query || !key || ui[key] !== false;
      const head = h('button', { class: 'sec-h', 'aria-expanded': key ? String(!!open) : null, onclick: key && !query ? () => { ui[key] = !open; saveUI(); renderSidebar(); } : null }, h('span', {}, title), key && !query ? h('span', { class: 'chev' }, open ? '▾' : '▸') : h('span', { class: 'count' }, items.length ? String(items.length) : ''));
      const list = h('div', open && items.length ? { class: 'sec-l', role: 'list' } : { class: 'sec-l' }, open ? (items.length ? items : empty ? h('p', { class: 'side-empty' }, empty) : null) : null);
      box.append(h('section', { class: 'sec' }, head, list));
    };
    if (!query || mine.length) section('Mis problemas', null, grouped(mine), query ? '' : 'Aún no tienes problemas propios. Crea uno nuevo o guarda un ejercicio de ejemplo.');
    if (imp.length) section('Importados', null, grouped(imp), '');
    if (!query || pres.length) section(Presets.section, 'presetsOpen', pres.map((p) => itemRow({ ref: { kind: 'preset', id: p.key }, title: p.title, actions: [
      { label: 'Duplicar en Mis problemas', run: () => { const c = addToLib({ title: p.title, statement: p.statement, scene: p.make() }); openRef({ kind: 'lib', id: c.id }); } },
      { label: 'Guardar en archivo', run: () => saveJSON(slug(p.title) + '.emsim.json', pack([{ title: p.title, statement: p.statement, scene: p.make() }])) },
    ] })), '');
    if (query && !mine.length && !imp.length && !pres.length) box.append(h('p', { class: 'side-empty' }, `Nada coincide con «${$('#search').value}».`));
    $('#save-lib').disabled = !lib.items.length;
    const dl = $('#folders-dl');
    dl.replaceChildren(...[...new Set(lib.items.map((x) => x.folder).filter(Boolean))].map((f) => h('option', { value: f })));
  }

  /* ---------------- archivos ---------------- */
  const slug = (t) => (norm(t).replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'problema');
  function pack(items) {
    return { formato: FORMAT, version: 3, guardado: new Date().toISOString(), problemas: items.map((i) => ({ titulo: i.title, enunciado: i.statement || '', carpeta: i.folder || undefined, etiquetas: i.tags?.length ? i.tags : undefined, escena: i.scene })) };
  }
  function unpack(obj) {
    if (obj?.formato === FORMAT && Array.isArray(obj.problemas)) return obj.problemas.map((p) => ({ title: p.titulo || 'Problema sin título', statement: p.enunciado || '', folder: p.carpeta || '', tags: Array.isArray(p.etiquetas) ? p.etiquetas : [], scene: validScene(p.escena) }));
    if (obj?.sources) return [{ title: 'Escena importada', statement: '', scene: validScene(obj) }];
    throw new Error('no es un archivo del simulador');
  }
  const dlPromise = window.claude?.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  async function saveFile(filename, text, mime) {
    const dl = await Promise.race([dlPromise, new Promise((r) => setTimeout(() => r(null), 1500))]);
    if (dl) {
      try { await dl.save({ filename, data: text }); flash('Archivo guardado: ' + filename); }
      catch (e) { flash(e?.code === 'declined' ? 'Guardado cancelado' : 'No se pudo guardar el archivo aquí (' + (e?.code || 'error') + ')'); }
      return;
    }
    // fuera del visor de Claude (archivo abierto en un navegador normal)
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: mime })), download: filename });
    document.body.append(a); a.click(); a.remove();
    flash('Archivo guardado: ' + filename);
  }
  const saveJSON = (filename, obj) => saveFile(filename, JSON.stringify(obj, null, 2), 'application/json');
  async function importFiles(files) {
    let n = 0, first = null;
    const bad = [];
    for (const f of files) {
      try {
        const probs = unpack(JSON.parse(await f.text()));
        for (const p of probs) { const it = addToLib({ ...p, origin: 'importado', file: f.name }); first ||= it; n++; }
      } catch (e) { bad.push(`${f.name}: ${e.message}`); }
    }
    if (first) openRef({ kind: 'lib', id: first.id }); else renderSidebar();
    flash(n ? `${n} problema${n > 1 ? 's' : ''} importado${n > 1 ? 's' : ''}` + (bad.length ? `; no se pudo leer ${bad.join(', ')}` : '') : 'No se pudo leer: ' + bad.join(', '));
  }

  /* ---------------- campos de formulario ---------------- */
  const getPath = (o, p) => p.reduce((a, k) => a?.[k], o);
  const setPath = (o, p, v) => { const last = p[p.length - 1]; getPath(o, p.slice(0, -1))[last] = v; };
  function input(path, opts = {}) {
    const val = getPath(scen, path) ?? '';
    const el = h('input', { type: 'text', id: 'f-' + path.join('-'), class: 'in ' + (opts.cls || ''), value: val, placeholder: opts.ph || '', 'aria-label': opts.aria || path.join(' '), spellcheck: 'false', autocomplete: 'off' });
    el.dataset.path = JSON.stringify(path);
    el.addEventListener('input', () => { setPath(scen, path, el.value); opts.structural ? renderAll() : schedule(); });
    return el;
  }
  function select(path, options, opts = {}) {
    const val = getPath(scen, path);
    const el = h('select', { class: 'in', id: 'f-' + path.join('-'), 'aria-label': opts.aria || path.join(' ') },
      options.map(([v, l]) => h('option', { value: v, selected: v === val }, l)));
    el.addEventListener('change', () => { setPath(scen, path, el.value); opts.structural === false ? schedule() : renderAll(); });
    return el;
  }
  const fieldRow = (label, ...ctrl) => h('label', { class: 'row' }, h('span', { class: 'lab' }, label), h('span', { class: 'ctl' }, ...ctrl));
  function buildField(f, base, obj) {
    const p = [...base, f.k];
    if (f.show && !f.show(obj, scen)) return null;
    switch (f.t) {
      case 'vec3':
      case 'vec3opt':
        return fieldRow(f.label, h('span', { class: 'vec' }, ['x', 'y', 'z'].map((c, i) => h('span', { class: 'vc' }, h('i', {}, c), input([...p, i], { cls: 'num', ph: f.t === 'vec3opt' ? '—' : '0', aria: `${f.label} ${c}` })))));
      case 'expr': return fieldRow(f.label, input(p, { cls: 'num', ph: f.optional ? 'opcional' : '0' }));
      case 'sym': return fieldRow(f.label, input(p, { cls: 'sym', ph: 'p' }));
      case 'select': return fieldRow(f.label, select(p, f.options, { structural: !!f.structural }));
      case 'charge': return fieldRow(f.label, h('span', { class: 'chg' }, input([...p, 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...p, 'sym'], { cls: 'sym', ph: 'q', aria: 'símbolo' })));
      case 'value': return fieldRow(f.label, h('span', { class: 'chg' }, input([...p, 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...p, 'sym'], { cls: 'sym', ph: 'q', aria: 'símbolo' }), h('span', { class: 'x tail' }, scen.mode === 'si' ? 'SI' : '/(ε₀ aⁿ)')));
    }
    return null;
  }

  /* ---------------- colocar con clic en el lienzo ---------------- */
  const PLACE_KEYS = ['pos', 'A', 'B', 'P', 'C', 'P0'];
  const PERP = { xy: 2, xz: 1, yz: 0 };
  const AXI = { x: 0, y: 1, z: 2 };
  let placing = null; // { kind, type }
  const placeFields = (def) => def.fields.filter((f) => f.t === 'vec3' && PLACE_KEYS.includes(f.k));
  const coord = (v) => String(+v.toFixed(2));
  function ptToStr(p) {
    const perp = PERP[scen.view.plane];
    return p.map((v, i) => (i === perp ? String(scen.view.cut ?? '0') : coord(v)));
  }
  function applyPts(obj, def, pts, planeLike) {
    if (!pts) return;
    if (planeLike) obj.at = coord(pts[0][AXI[obj.axis]]);
    else placeFields(def).forEach((f, i) => { if (pts[i]) obj[f.k] = ptToStr(pts[i]); });
  }
  function markChips() {
    document.querySelectorAll('[data-place]').forEach((c) => c.classList.toggle('on', !!placing && c.dataset.place === placing.kind + ':' + placing.type));
  }
  function cancelPlace() {
    if (!placing) return;
    placing = null; Canvas.setPlace(null); markChips();
  }
  function chipAdd(kind, type) {
    const make = (pts) => (kind === 'src' ? addSource(type, null, pts) : kind === 'an' ? addAnalysis(type, pts) : Canvas.addProbe(pts[0], type === '+' ? 1 : -1));
    if (placing && placing.kind === kind && placing.type === type) { cancelPlace(); if (kind !== 'probe') make(null); return; }
    cancelPlace();
    const def = kind === 'src' ? SOURCES[type] : kind === 'an' ? ANALYSES[type] : null;
    const planeLike = kind === 'src' && (type === 'plane' || type === 'slab');
    const fs = def ? placeFields(def) : [{ label: 'punto de salida' }];
    const n = planeLike ? 1 : fs.length;
    if (scen.view.plane === '3d') {
      if (kind === 'probe') return flash('Las cargas de prueba se sueltan en una vista 2D (XY, XZ o YZ).');
      return make(null);
    }
    if (!n) return make(null);
    placing = { kind, type };
    markChips();
    $('#cv').scrollIntoView({ block: 'nearest', behavior: 'instant' });
    const what = planeLike ? 'un punto del plano' : fs.map((f) => f.label.toLowerCase()).join(', luego ');
    Canvas.setPlace({
      hint: `Clic en el lienzo: ${what}` + (kind === 'probe' ? ' · Esc: cancelar' : ' · Esc: cancelar, botón otra vez: por defecto'),
      n, done: (pts) => { placing = null; markChips(); make(pts); },
    });
  }

  /* ---------------- fuentes ---------------- */
  function addSource(type, copyOf, pts) {
    const def = SOURCES[type];
    const n = scen.sources.filter((s) => SOURCES[s.type].prefix === def.prefix).length + 1;
    const src = copyOf ? { ...clone(copyOf), id: newId(), name: (copyOf.name || def.prefix) + '′' } : { id: newId(), type, name: def.prefix + n, ...def.defaults() };
    if (scen.mode === 'si' && !copyOf) src.s = { c: '1e-9', sym: '' };
    applyPts(src, def, pts, type === 'plane' || type === 'slab');
    scen.sources.push(src);
    if (!pts) Canvas.fit();
    renderAll();
    if (!pts) requestAnimationFrame(() => document.querySelector(`.src[data-id="${src.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  function addAnalysis(type, pts) {
    const def = ANALYSES[type];
    const an = { id: newId(), type, ...def.defaults() };
    if (scen.mode === 'si' && an.Q) an.Q = { c: '1e-9', sym: '' };
    applyPts(an, def, pts, false);
    scen.analyses.push(an);
    renderAll();
    if (!pts) requestAnimationFrame(() => document.querySelector(`.an[data-id="${an.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  const isUnk = (id) => !!scen.unknown?.srcs?.includes(id);
  function renderSources() {
    const box = $('#sources');
    box.replaceChildren();
    scen.sources.forEach((src, i) => {
      const def = SOURCES[src.type];
      const unk = isUnk(src.id);
      const base = ['sources', i];
      box.append(h('div', { class: 'card src' + (unk ? ' unk' : ''), 'data-id': src.id },
        h('div', { class: 'card-h' },
          h('span', { class: 'badge b-' + src.type }, def.label),
          input([...base, 'name'], { cls: 'name', aria: 'nombre' }),
          h('button', { class: 'icon', title: 'Duplicar fuente', 'aria-label': 'Duplicar fuente', onclick: () => addSource(src.type, src) }, '⧉'),
          h('button', { class: 'icon del', title: 'Eliminar fuente', 'aria-label': 'Eliminar fuente', onclick: () => { if (unk) scen.unknown.srcs = scen.unknown.srcs.filter((x) => x !== src.id); scen.sources.splice(i, 1); renderAll(); } }, '×')),
        unk ? h('div', { class: 'row unkrow' }, h('span', { class: 'lab' }, 'Valor'), h('span', { class: 'ctl' }, h('span', { class: 'pill' }, 'incógnita'))) :
          fieldRow('Valor', h('span', { class: 'chg' }, input([...base, 's', 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...base, 's', 'sym'], { cls: 'sym', aria: 'símbolo', ph: scen.mode === 'si' ? '(nada)' : '' }), scen.mode === 'si' ? h('span', { class: 'x tail' }, KINDS[def.kindOf ? def.kindOf(src) : def.kind]?.si || '') : null)),
        def.fields.map((f) => buildField({ ...f, structural: f.structural || f.k === 'mode' }, base, src))));
    });
    if (!scen.sources.length) box.append(h('p', { class: 'empty' }, 'Aún no hay fuentes. Pulsa un botón de arriba (Carga, Hilo, Plano…) y haz clic en el lienzo para colocarla.'));
  }

  /* ---------------- incógnitas ---------------- */
  const defaultCond = () => ({ type: 'Ezero', P: ['1', '0', '0'], comp: 'x', d: ['0', '1', '0'], A: ['1', '0', '0'], B: ['2', '0', '0'], val: { c: '0', sym: '' } });
  function renderUnknown() {
    const box = $('#unknown');
    box.replaceChildren();
    if (!scen.sources.length) { box.append(h('p', { class: 'empty' }, 'Añade primero las fuentes.')); return; }
    const u = scen.unknown;
    const list = h('div', { class: 'unk-list', role: 'group', 'aria-label': 'Fuentes desconocidas' }, scen.sources.map((s) => {
      const cb = h('input', { type: 'checkbox', id: 'unk-' + s.id, checked: isUnk(s.id) });
      cb.addEventListener('change', () => {
        scen.unknown ||= { srcs: [], conds: [] };
        const U = scen.unknown;
        U.srcs = cb.checked ? [...U.srcs, s.id] : U.srcs.filter((x) => x !== s.id);
        if (cb.checked && !U.conds.length) U.conds.push(defaultCond());
        renderAll();
      });
      return h('label', { class: 'unk-o' }, cb, h('span', { class: 'math', html: Fmt.sym(s.name || SOURCES[s.type].prefix) }), h('span', { class: 'it-s' }, SOURCES[s.type].label));
    }));
    box.append(h('div', { class: 'lab' }, 'Fuentes cuyo valor es desconocido:'), list);
    if (!u || !u.srcs.length) return;
    u.conds.forEach((c, j) => {
      for (const k of ['P', 'd', 'A', 'B']) c[k] ??= ['0', '0', '0'];
      c.val ??= { c: '0', sym: '' };
      c.comp ??= 'x';
      const base = ['unknown', 'conds', j];
      box.append(h('div', { class: 'card cond' },
        h('div', { class: 'card-h' }, h('h3', {}, 'Condición ' + (j + 1)), h('button', { class: 'icon del', title: 'Quitar condición', 'aria-label': 'Quitar condición', onclick: () => { u.conds.splice(j, 1); renderAll(); } }, '×')),
        fieldRow('Tipo', select([...base, 'type'], Object.entries(CONDS).map(([k, v]) => [k, v.label]))),
        CONDS[c.type].fields.map((f) => buildField(f, base, c))));
    });
    box.append(h('div', { class: 'tools' },
      h('button', { class: 'chip', onclick: () => { u.conds.push(defaultCond()); renderAll(); } }, '+ Añadir condición'),
      h('span', { class: 'hint' }, `${u.srcs.length} incógnita${u.srcs.length > 1 ? 's' : ''}: hacen falta otras tantas ecuaciones (E = 0 cuenta como tres).`)));
    box.append(h('div', { class: 'card an unk-card', id: 'unk-card' },
      h('div', { class: 'result', id: 'unk-res' }),
      h('div', { class: 'prac', id: 'prac-unk' }),
      h('details', { class: 'steps-d', id: 'unk-steps' }, h('summary', {}, 'Ver desarrollo'), h('div', { class: 'steps-b' }))));
  }

  /* ---------------- símbolos ---------------- */
  function renderSymbols(ctx) {
    const box = $('#symbols');
    box.replaceChildren();
    const names = Object.keys(ctx.kinds).filter((k) => !k.startsWith('§') && k);
    if (!names.length) box.append(h('p', { class: 'empty' }, scen.mode === 'si' ? 'En modo SI no hacen falta símbolos: escribe los valores numéricos.' : 'Aparecerán aquí cuando uses símbolos (q, λ, σ…).'));
    names.forEach((n) => {
      const sel = h('select', { class: 'in', id: 'kind-' + n, 'aria-label': 'Tipo de ' + n }, Object.entries(KINDS).map(([k, v]) => h('option', { value: k, selected: ctx.kinds[n] === k }, `${v.label} (${v.hint})`)));
      sel.addEventListener('change', () => { scen.kinds[n] = sel.value; schedule(); });
      box.append(h('label', { class: 'row' }, h('span', { class: 'lab math', html: Fmt.sym(n) }), h('span', { class: 'ctl' }, sel)));
    });
  }

  /* ---------------- preguntas ---------------- */
  function renderAnalyses() {
    const box = $('#analyses');
    box.replaceChildren();
    scen.analyses.forEach((an, i) => {
      const def = ANALYSES[an.type];
      const base = ['analyses', i];
      box.append(h('section', { class: 'card an', 'data-i': i, 'data-id': an.id },
        h('div', { class: 'card-h' }, h('h3', {}, def.label), h('button', { class: 'icon del', title: 'Quitar pregunta', 'aria-label': 'Quitar pregunta', onclick: () => { scen.analyses.splice(i, 1); renderAll(); } }, '×')),
        def.fields.length ? h('div', { class: 'an-f' }, def.fields.map((f) => buildField(f, base, an))) : null,
        h('div', { class: 'result math', id: 'res-' + i }),
        h('div', { class: 'prac', id: 'prac-' + i }),
        h('div', { class: 'act', id: 'act-' + i }),
        h('details', { class: 'steps-d', id: 'steps-' + i }, h('summary', {}, 'Ver desarrollo paso a paso'), h('div', { class: 'steps-b math' }))));
    });
    if (!scen.analyses.length) box.append(h('p', { class: 'empty' }, 'Aún no hay preguntas. Elige arriba qué quieres calcular: campo, potencial, fuerza, dipolo, flujo, perfil…'));
  }

  /* ---------------- modo práctica ---------------- */
  const pracVals = {};
  function renderPractice(box, key, answers, getAnswers) {
    const card = box.closest('.card');
    card.classList.toggle('has-ans', !!answers?.length);
    if (!ui.practice || !answers?.length) { box.replaceChildren(); box.dataset.sig = ''; return; }
    const sig = answers.map((a) => a.label + (a.vec ? '3' : '1')).join('|') + scen.mode;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.replaceChildren();
    const si = scen.mode === 'si';
    answers.forEach((ans, j) => {
      const k = key + ':' + j;
      const vals = (pracVals[k] ||= ['', '', '']);
      const n = ans.vec ? 3 : 1;
      const unit = si ? (Engine.QTY[ans.qty]?.si || KINDS[ans.qty]?.si || '') : '';
      const ins = Array.from({ length: n }, (_, c) => {
        const el = h('input', { type: 'text', class: 'in num', value: vals[c], 'aria-label': `${ans.label} ${n > 1 ? 'xyz'[c] : ''}`, spellcheck: 'false', autocomplete: 'off',
          placeholder: si ? (unit ? 'valor en ' + unit : 'valor') : n > 1 ? 'xyz'[c] + ': p. ej. q/(4*pi*eps0*a^2)' : 'p. ej. q/(4*pi*eps0*a)' });
        el.addEventListener('input', () => { vals[c] = el.value; msg.textContent = ''; msg.className = 'pill'; });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
        return el;
      });
      const msg = h('span', { class: 'pill', role: 'status' });
      const check = () => {
        const a = getAnswers()?.[j];
        if (!a) return;
        const r = Physics.checkAnswer(a, vals, out.ctx);
        msg.textContent = r.ok ? '✓ ' + r.msg : '✗ ' + r.msg;
        msg.className = 'pill ' + (r.ok ? 'ok' : 'bad');
      };
      box.append(h('div', { class: 'prac-r' },
        h('span', { class: 'lab math', html: arrows(ans.label) + ' =' }),
        h('span', { class: n > 1 ? 'vec' : 'one' }, ins),
        h('span', { class: 'tools' }, h('button', { class: 'btn', onclick: check }, 'Comprobar'), msg)));
    });
    box.append(h('div', { class: 'tools' },
      h('button', { class: 'btn ghost', onclick: (e) => { const on = card.classList.toggle('reveal'); e.target.textContent = on ? 'Ocultar solución' : 'Mostrar solución'; } }, card.classList.contains('reveal') ? 'Ocultar solución' : 'Mostrar solución'),
      h('span', { class: 'hint' }, si ? 'Admite 8.99e9, 2/3…' : 'Escribe con q, lambda, sigma, rho, a, eps0, pi, sqrt(…); no importa el orden.')));
  }

  /* ---------------- gráficas E(z), V(z) ---------------- */
  const chartHidden = {};
  const SERIES_COL = ['--neg', '--ok', '--dipole', '--accent', '--mark'];
  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1, raw = span / n, p = 10 ** Math.floor(Math.log10(raw));
    const st = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || raw;
    const t = [];
    for (let v = Math.ceil(lo / st) * st; v <= hi + st * 1e-9; v += st) t.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return t;
  }
  const tickTxt = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v) ? v.toExponential(1) : String(+v.toPrecision(3)));
  function drawChart(cv, ch, key, hoverI = null) {
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const dpr = window.devicePixelRatio || 1, W = Math.max(220, cv.clientWidth), H = 200;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hid = chartHidden[key] || new Set();
    const ser = ch.series.map((s, i) => ({ ...s, col: css(SERIES_COL[i % SERIES_COL.length]), i })).filter((s) => s.live && !hid.has(s.name));
    const all = ser.flatMap((s) => s.ys.filter((v) => v != null && isFinite(v))).sort((a, b) => a - b);
    const q = (f) => all[Math.min(all.length - 1, Math.floor(f * (all.length - 1)))];
    let lo = all.length ? Math.min(0, q(0.03)) : -1, hi = all.length ? Math.max(0, q(0.97)) : 1;
    if (hi - lo < 1e-12) { hi += 1; lo -= 1; }
    const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    const L = 46, R = 10, T = 10, B = 26, x0 = ch.xs[0], x1 = ch.xs[ch.xs.length - 1];
    const X = (x) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R), Y = (y) => T + ((hi - y) / (hi - lo)) * (H - T - B);
    g.clearRect(0, 0, W, H);
    g.font = '10.5px "IBM Plex Mono", ui-monospace, monospace';
    g.strokeStyle = css('--grid'); g.fillStyle = css('--muted'); g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const t of niceTicks(lo, hi, 4)) { g.beginPath(); g.moveTo(L, Y(t)); g.lineTo(W - R, Y(t)); g.stroke(); g.fillText(tickTxt(t), L - 5, Y(t)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of niceTicks(x0, x1, 6)) { g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), H - B); g.stroke(); g.fillText(tickTxt(t), X(t), H - B + 5); }
    g.strokeStyle = css('--muted'); g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(W - R, Y(0)); g.stroke();
    g.textAlign = 'right'; g.fillText(ch.xlabel, W - R, H - B - 14);
    g.save(); g.beginPath(); g.rect(L, T, W - L - R, H - T - B); g.clip();
    const jump = (hi - lo) * 2;
    for (const s of ser) {
      g.strokeStyle = s.col; g.lineWidth = 1.8; g.setLineDash(s.dashed ? [6, 4] : []);
      g.beginPath();
      let pen = false, prev = null;
      s.ys.forEach((y, i) => {
        if (y == null || !isFinite(y) || (prev != null && Math.abs(y - prev) > jump)) { pen = false; prev = y; return; }
        const px = X(ch.xs[i]), py = Y(Math.max(lo - jump, Math.min(hi + jump, y)));
        pen ? g.lineTo(px, py) : g.moveTo(px, py);
        pen = true; prev = y;
      });
      g.stroke();
    }
    g.setLineDash([]);
    g.restore();
    if (hoverI != null) {
      const px = X(ch.xs[hoverI]);
      g.strokeStyle = css('--ink'); g.globalAlpha = 0.4; g.beginPath(); g.moveTo(px, T); g.lineTo(px, H - B); g.stroke(); g.globalAlpha = 1;
      const lines = [`${ch.xlabel} = ${tickTxt(ch.xs[hoverI])}`, ...ser.map((s) => `${s.name.replace('_', '')} = ${s.ys[hoverI] == null ? '—' : tickTxt(s.ys[hoverI])}`)];
      const tw = Math.max(...lines.map((t) => g.measureText(t).width)) + 14, th = lines.length * 14 + 8;
      const bx = px + tw + 12 > W ? px - tw - 8 : px + 8;
      g.fillStyle = css('--panel'); g.globalAlpha = 0.94; g.fillRect(bx, T + 2, tw, th); g.globalAlpha = 1;
      g.strokeStyle = css('--line'); g.strokeRect(bx, T + 2, tw, th);
      g.textAlign = 'left'; g.textBaseline = 'top';
      lines.forEach((t, k) => { g.fillStyle = k ? ser[k - 1].col : css('--ink'); g.fillText(t, bx + 7, T + 7 + k * 14); });
    }
  }
  function mountChart(box, ch, key) {
    const cv = box.querySelector('canvas.chart'), leg = box.querySelector('.chart-l');
    if (!cv) return;
    // las componentes idénticamente nulas no se dibujan
    const mx = Math.max(1e-300, ...ch.series.flatMap((s) => s.ys.filter((v) => v != null && isFinite(v)).map(Math.abs)));
    ch.series.forEach((s) => { s.live = s.ys.some((v) => v != null && isFinite(v) && Math.abs(v) > 1e-9 * mx); });
    const hid = (chartHidden[key] ||= new Set());
    leg.replaceChildren(...ch.series.map((s, i) => !s.live ? null : h('button', { class: 'ser' + (hid.has(s.name) ? ' off' : ''), 'aria-pressed': String(!hid.has(s.name)), onclick: () => { hid.has(s.name) ? hid.delete(s.name) : hid.add(s.name); mountChart(box, ch, key); } },
      h('span', { class: 'sw' + (s.dashed ? ' dash' : ''), style: `border-color:var(${SERIES_COL[i % SERIES_COL.length]})` }), h('span', { html: s.name.replace(/_(\w)/, '<sub>$1</sub>') }))).filter(Boolean),
      h('span', { class: 'hint' }, ch.ylabel));
    drawChart(cv, ch, key);
    const idx = (e) => { const r = cv.getBoundingClientRect(), f = (e.clientX - r.left - 46) / (r.width - 56); return Math.max(0, Math.min(ch.xs.length - 1, Math.round(f * (ch.xs.length - 1)))); };
    cv.onpointermove = (e) => drawChart(cv, ch, key, idx(e));
    cv.onpointerleave = () => drawChart(cv, ch, key);
  }

  /* ---------------- cálculo ---------------- */
  let pending = 0;
  function schedule() { if (!pending) pending = requestAnimationFrame(() => { pending = 0; compute(); }); }
  function compute() {
    persist();
    try { out = Physics.run(scen); } catch (e) { out = null; $('#errors').textContent = 'Error: ' + e.message; $('#errors').hidden = false; return; }
    const { ctx, unknown, results } = out;
    $('#errors').textContent = ctx.errors.length ? 'Revisa: ' + ctx.errors.join(' · ') : '';
    $('#errors').hidden = !ctx.errors.length;
    if (unknown && $('#unk-res')) {
      $('#unk-res').innerHTML = unknown.error ? `<div class="warn">${unknown.error}</div>` : `<div class="math big">${unknown.html}</div>`;
      $('#unk-steps .steps-b').innerHTML = unknown.steps || '';
      $('#unk-steps').hidden = !unknown.steps;
      renderPractice($('#prac-unk'), 'unk', unknown.error ? null : unknown.answers, () => out.unknown?.answers);
    }
    results.forEach((res, i) => {
      const r = $('#res-' + i), st = $('#steps-' + i + ' .steps-b'), act = $('#act-' + i);
      if (!r) return;
      r.innerHTML = res.error ? `<div class="warn">No se pudo calcular: ${Fmt.esc(res.error)}</div>` : res.res;
      st.innerHTML = res.steps || '';
      $('#steps-' + i).hidden = !res.steps;
      act.replaceChildren();
      if (res.action) act.append(h('button', { class: 'btn ghost', onclick: () => { scen.sources.push({ id: newId(), ...res.action.make() }); renderAll(); } }, res.action.label));
      if (res.chart) mountChart(r, res.chart, scen.analyses[i].id);
      renderPractice($('#prac-' + i), scen.analyses[i].id, res.error ? null : res.answers, () => out.results[i]?.answers);
    });
    renderSymbolsIfChanged(ctx);
    Canvas.draw(out, scen);
    scheduleCommit();
  }
  let lastSyms = '';
  function renderSymbolsIfChanged(ctx) {
    const sig = JSON.stringify(ctx.kinds) + scen.mode;
    if (sig !== lastSyms) { lastSyms = sig; renderSymbols(ctx); }
  }
  function renderHeader() {
    $('#title').value = cur.title;
    const st = $('#statement');
    st.value = cur.statement;
    autosize(st);
    const isPreset = cur.ref.kind === 'preset';
    const it = !isPreset && lib.items.find((x) => x.id === cur.ref.id);
    $('#origin').textContent = isPreset ? 'Ejemplo' : it?.origin === 'importado' ? 'Importado' : 'Mi problema';
    $('#banner').hidden = !isPreset;
    $('#meta').hidden = isPreset;
    if (!isPreset) { $('#folder').value = cur.folder || ''; $('#tags').value = (cur.tags || []).join(', '); }
    $('#note').textContent = cur.note || '';
    $('#note').hidden = !cur.note;
  }
  function renderAll() {
    const ae = document.activeElement?.id;
    renderHeader();
    const si = scen.mode === 'si';
    $('#mode').value = si ? 'si' : 'sym';
    $('#unit').value = si ? 'm' : scen.unit || 'a';
    $('#unit').disabled = si;
    $('#hint-src').innerHTML = si
      ? 'Modo numérico SI: longitudes en metros y valores en unidades SI (C, C/m, C/m²…), p. ej. <code>2e-9</code>. Deja el símbolo vacío.'
      : 'Longitudes en unidades de la escala (<code>a</code>). Admite <code>5/2</code>, <code>2*sqrt(3)</code>, <code>√7</code>, <code>pi</code>. Valor = coeficiente × símbolo.';
    $('#hint-an').textContent = si
      ? 'Resultados numéricos en unidades SI (ε₀ = 8,854·10⁻¹² F/m).'
      : 'Resultados exactos en la forma del libro: coeficiente · símbolos / (π ε₀ aⁿ). Abre “Ver desarrollo” para seguir cada paso.';
    const plane = scen.view?.plane || 'xy';
    $('#plane').value = plane;
    $('#cut').value = scen.view?.cut ?? '0';
    $('#cut-w').hidden = plane === '3d';
    $('#cut-l').textContent = { xy: 'z', xz: 'y', yz: 'x' }[plane] + ' =';
    $('#app').classList.toggle('practice', !!ui.practice);
    $('#practice').checked = !!ui.practice;
    renderSources(); renderUnknown(); renderAnalyses();
    lastSyms = '';
    compute();
    if (ae && ae !== 'title' && document.getElementById(ae)) document.getElementById(ae).focus();
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = Math.max(60, t.scrollHeight + 2) + 'px'; }

  /* ---------------- deshacer / rehacer ---------------- */
  let hist = { past: [], future: [], last: '' }, commitT = 0;
  function resetHistory() { clearTimeout(commitT); hist = { past: [], future: [], last: JSON.stringify(scen) }; updateHistBtns(); }
  function commit() {
    clearTimeout(commitT);
    const s = JSON.stringify(scen);
    if (s === hist.last) return;
    hist.past.push(hist.last);
    if (hist.past.length > 150) hist.past.shift();
    hist.last = s; hist.future = [];
    updateHistBtns();
  }
  function scheduleCommit() { clearTimeout(commitT); commitT = setTimeout(commit, 450); }
  function restore(s) { cur.scene = scen = JSON.parse(s); hist.last = s; renderAll(); updateHistBtns(); }
  function undo() { commit(); if (!hist.past.length) return flash('Nada que deshacer'); hist.future.push(hist.last); restore(hist.past.pop()); }
  function redo() { commit(); if (!hist.future.length) return flash('Nada que rehacer'); hist.past.push(hist.last); restore(hist.future.pop()); }
  function updateHistBtns() { $('#undo').disabled = !hist.past.length; $('#redo').disabled = !hist.future.length; }

  /* ---------------- exportar la solución ---------------- */
  function describe(def, obj) {
    const parts = [];
    for (const f of def.fields) {
      if (f.show && !f.show(obj, scen)) continue;
      const v = obj[f.k];
      if (v == null || v === '') continue;
      if (Array.isArray(v)) { if (v.every((x) => x === '')) continue; parts.push(`${f.label} = (${v.map((x) => x || '0').join(', ')})`); }
      else if (typeof v === 'object') parts.push(`${f.label} = ${v.c}${v.sym ? '·' + v.sym : ''}`);
      else if (f.t === 'select') parts.push(`${f.label}: ${(f.options.find((o) => o[0] === v) || [v, v])[1]}`);
      else parts.push(`${f.label} = ${v}`);
    }
    return parts.join('; ');
  }
  function toText(node) {
    if (node.nodeType === 3) return node.textContent.replace(/ /g, ' ');
    if (node.nodeType !== 1) return '';
    const kids = () => [...node.childNodes].map(toText).join('');
    const tag = node.tagName.toLowerCase(), cl = node.classList;
    if (tag === 'canvas' || tag === 'button' || cl.contains('chart-l')) return '';
    if (cl.contains('fr')) {
      const [nu, de] = [...node.children].map((c) => toText(c).trim());
      const wrap = (t) => (/^[\w.√²³πε₀λσρ]+$/u.test(t) ? t : `(${t})`);
      return `${wrap(nu)}/${wrap(de)}`;
    }
    if (tag === 'sup') { const t = kids(); return t.length > 1 ? `^(${t})` : '^' + t; }
    if (tag === 'sub') { const t = kids(); return t.length > 1 ? `_(${t})` : '_' + t; }
    if (cl.contains('vv') || cl.contains('uv')) return kids() + '⃗';
    if (tag === 'br') return '\n';
    if (tag === 'li') return '\n- ' + kids().trim();
    if (tag === 'div' || tag === 'p' || tag === 'ol' || tag === 'ul') return '\n' + kids() + '\n';
    return kids();
  }
  const htmlText = (html) => { const d = document.createElement('div'); d.innerHTML = html; return toText(d).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim(); };
  function exportMD() {
    const L = [`# ${cur.title}`, ''];
    if (cur.statement.trim()) L.push(...cur.statement.trim().split('\n').map((l) => '> ' + l), '');
    L.push(`*Unidad de longitud: ${scen.mode === 'si' ? 'm (modo numérico SI)' : scen.unit || 'a'}*`, '', '## Datos', '');
    for (const s of scen.sources) {
      const def = SOURCES[s.type];
      L.push(`- **${s.name}** (${def.label}): ${isUnk(s.id) ? 'valor desconocido' : `valor = ${s.s.c}${s.s.sym ? '·' + s.s.sym : ''}`}; ${describe(def, s)}`);
    }
    if (out?.unknown) {
      L.push('', '## Incógnitas', '');
      scen.unknown.conds.forEach((c, j) => L.push(`- Condición ${j + 1}: ${CONDS[c.type].label}; ${describe(CONDS[c.type], c)}`));
      L.push('', '**Resultado:** ' + (out.unknown.error || htmlText(out.unknown.html)).replace(/\n/g, '; '), '');
      if (out.unknown.steps) L.push('**Desarrollo**', '', htmlText(out.unknown.steps), '');
    }
    L.push('', '## Preguntas');
    scen.analyses.forEach((an, i) => {
      const def = ANALYSES[an.type], res = out?.results[i] || {};
      L.push('', `### ${i + 1}. ${def.label}`, '');
      const d = describe(def, an);
      if (d) L.push(d, '');
      L.push('**Resultado:**', '', res.error ? 'No se pudo calcular: ' + res.error : htmlText(res.res), '');
      if (res.steps) L.push('**Desarrollo**', '', htmlText(res.steps), '');
    });
    L.push('', '---', `*Generado con el Simulador de Electrostática · ${new Date().toLocaleString('es-ES')}*`, '');
    saveFile(slug(cur.title) + '-solucion.md', L.join('\n'), 'text/markdown');
  }
  function exportHTML() {
    const esc = Fmt.esc;
    const styles = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    const img = Canvas.snapshot();
    const charts = {};
    scen.analyses.forEach((an, i) => { const c = $(`#res-${i} canvas.chart`); if (c) charts[i] = c.toDataURL('image/png'); });
    const srcRows = scen.sources.map((s) => { const def = SOURCES[s.type]; return `<li><b>${esc(s.name)}</b> (${esc(def.label)}): ${isUnk(s.id) ? '<i>valor desconocido</i>' : `valor = ${esc(s.s.c)}${s.s.sym ? '·' + esc(s.s.sym) : ''}`}; ${esc(describe(def, s))}</li>`; }).join('');
    let unk = '';
    if (out?.unknown) {
      unk = `<section class="card"><h2>Incógnitas</h2><ul>${scen.unknown.conds.map((c, j) => `<li>Condición ${j + 1}: ${esc(CONDS[c.type].label)}; ${esc(describe(CONDS[c.type], c))}</li>`).join('')}</ul>
        <div class="result math">${out.unknown.error ? `<div class="warn">${out.unknown.error}</div>` : out.unknown.html}</div>${out.unknown.steps ? `<h4>Desarrollo</h4><div class="steps-b math">${out.unknown.steps}</div>` : ''}</section>`;
    }
    const qs = scen.analyses.map((an, i) => {
      const def = ANALYSES[an.type], res = out?.results[i] || {};
      const body = res.error ? `<div class="warn">No se pudo calcular: ${esc(res.error)}</div>` : String(res.res || '').replace(/<canvas class="chart"[^>]*><\/canvas><div class="chart-l"><\/div>/, charts[i] ? `<img class="chart-img" alt="Gráfica" src="${charts[i]}">` : '');
      return `<section class="card"><h3>${i + 1}. ${esc(def.label)}</h3><p class="hint">${esc(describe(def, an))}</p><div class="result math">${body}</div>${res.steps ? `<h4>Desarrollo</h4><div class="steps-b math">${res.steps}</div>` : ''}</section>`;
    }).join('');
    const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(cur.title)} · solución</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap">
<style>${styles}
body { max-width: 860px; margin: 0 auto; padding: 24px 16px 60px; font: 14px/1.5 var(--f-ui) }
h1 { font: 600 26px var(--f-math); margin: 0 0 8px } h2 { font: 600 13px var(--f-ui); text-transform: uppercase; letter-spacing: .08em; color: var(--muted) } h3 { font: 600 15px var(--f-ui); margin: 0 } h4 { font: 600 12.5px var(--f-ui); color: var(--muted); margin: 8px 0 0 }
.card { margin: 12px 0; break-inside: avoid } .stmt { white-space: pre-wrap; font: 15px/1.5 var(--f-math); background: var(--accent-soft); padding: 10px 12px; border-radius: 8px }
.snap { width: 100%; border: 1px solid var(--line); border-radius: 8px } .chart-img { width: 100%; max-width: 640px; display: block } .printbar { display: flex; gap: 8px; margin: 10px 0 }
@media print { .printbar { display: none } body { padding: 0 } :root { --bg: #fff } }
</style></head><body>
<div class="printbar"><button class="btn ghost" onclick="print()">Imprimir o guardar como PDF</button></div>
<h1>${esc(cur.title)}</h1>${cur.statement.trim() ? `<div class="stmt">${esc(cur.statement.trim())}</div>` : ''}
<p class="hint">Unidad de longitud: ${scen.mode === 'si' ? 'm (modo numérico SI)' : esc(scen.unit || 'a')}</p>
${img ? `<img class="snap" alt="Esquema del problema" src="${img}">` : ''}
<section class="card"><h2>Datos</h2><ul>${srcRows}</ul></section>${unk}<h2>Preguntas</h2>${qs}
<p class="hint">Generado con el Simulador de Electrostática · ${esc(new Date().toLocaleString('es-ES'))}</p></body></html>`;
    saveFile(slug(cur.title) + '-solucion.html', doc, 'text/html');
  }

  /* ---------------- controles fijos ---------------- */
  const typing = (t) => !!t && (t.id === 'title' || t.id === 'statement' || t.id === 'search' || t.id === 'folder' || t.id === 'tags' || !!t.closest?.('.prac'));
  function initControls() {
    $('#side-close').addEventListener('click', () => setSide(false));
    $('#side-open').addEventListener('click', () => setSide(true));
    $('#scrim').addEventListener('click', () => setSide(false));
    document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) closeMenu(); });
    document.addEventListener('keydown', (e) => {
      const mod = (e.ctrlKey || e.metaKey) && !e.altKey, k = e.key.toLowerCase();
      if (mod && k === 'z' && !typing(e.target)) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && k === 'y' && !typing(e.target)) { e.preventDefault(); redo(); }
      else if (mod && k === 's') { e.preventDefault(); $('#save-cur').click(); }
      else if (mod && k === 'o') { e.preventDefault(); $('#file').click(); }
      else if (mod && k === 'k') { e.preventDefault(); if (isMobile()) setSide(true); else if (!ui.side) setSide(true); $('#search').focus(); }
      else if ((e.key === 'F1' || (e.key === '?' && !typing(e.target) && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) && !$('#guide').open) { e.preventDefault(); openGuide(); }
      else if (e.key === 'Escape') { if (placing) cancelPlace(); closeMenu(); if (isMobile()) setSide(false); }
    });
    $('#guide-open').addEventListener('click', () => openGuide());
    $('#help').addEventListener('click', () => openGuide());
    $('#ver').addEventListener('click', () => openGuide('g-novedades'));
    for (const el of document.querySelectorAll('.ver-n')) el.textContent = Version.current;
    // cada versión es un desplegable; solo la actual empieza abierta
    // Índice de versiones: cada versión mayor (1, 2…; la beta es la 0) se despliega y dentro lleva sus subversiones (0.5, 0.4…).
    const mayores = [];
    for (const r of Version.log) {
      const m = r.v.split('.')[0];
      if (mayores.at(-1)?.m !== m) mayores.push({ m, rs: [] });
      mayores.at(-1).rs.push(r);
    }
    $('#ver-log').replaceChildren(...mayores.map((g, i) => h('details', { open: i === 0 },
      h('summary', {}, g.m === '0' ? 'Beta (0.x)' : `Versión ${g.m}`, h('span', { class: 'ver-c' }, g.rs.length === 1 ? '1 versión' : `${g.rs.length} versiones`)),
      ...g.rs.map((r) => h('details', { class: 'ver-sub', open: r.v === Version.current }, h('summary', {}, `${r.v} · ${r.fecha.split('-').reverse().join('/')}`), h('ul', {}, r.cambios.map((c) => h('li', {}, c))))))));
    $('#guide-x').addEventListener('click', () => $('#guide').close());
    $('#guide').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    $('#guide-nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showGuide(b.dataset.g); });
    $('#guide-c').addEventListener('scroll', () => {
      const c = $('#guide-c'), top = c.getBoundingClientRect().top + 60;
      let id = null;
      for (const s of c.querySelectorAll('section')) if (s.getBoundingClientRect().top <= top) id = s.id;
      markGuide(id || 'g-vista');
    }, { passive: true });
    $('#new').addEventListener('click', () => { const it = addToLib({ title: 'Problema sin título', statement: '', scene: blankScene() }); openRef({ kind: 'lib', id: it.id }, { focus: '#title' }); });
    $('#open').addEventListener('click', () => $('#file').click());
    $('#file').addEventListener('change', (e) => { importFiles([...e.target.files]); e.target.value = ''; });
    $('#save-lib').addEventListener('click', () => saveJSON('mis-problemas.emsim.json', pack(lib.items)));
    $('#save-cur').addEventListener('click', () => saveJSON(slug(cur.title) + '.emsim.json', pack([cur])));
    $('#export').addEventListener('click', (e) => { e.stopPropagation(); openMenu($('#export-w'), 'export', [
      { label: 'Página para imprimir o PDF (.html)', run: exportHTML },
      { label: 'Texto Markdown (.md)', run: exportMD },
    ]); });
    $('#keep').addEventListener('click', () => { const it = addToLib({ title: cur.title, statement: cur.statement, scene: scen }); openRef({ kind: 'lib', id: it.id }); flash('Guardado en Mis problemas'); });
    $('#title').addEventListener('input', (e) => { cur.title = e.target.value; persist(); renderSidebar(); });
    $('#statement').addEventListener('input', (e) => { cur.statement = e.target.value; autosize(e.target); persist(); });
    $('#folder').addEventListener('change', (e) => { cur.folder = e.target.value.trim(); persist(); renderSidebar(); });
    $('#tags').addEventListener('change', (e) => { cur.tags = e.target.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean); persist(); renderSidebar(); });
    $('#search').addEventListener('input', (e) => { query = norm(e.target.value.trim()); renderSidebar(); });
    $('#unit').addEventListener('input', (e) => { scen.unit = e.target.value.trim() || 'a'; schedule(); });
    $('#mode').addEventListener('change', (e) => { scen.mode = e.target.value; renderAll(); flash(scen.mode === 'si' ? 'Modo numérico SI: usa valores en unidades SI y longitudes en metros' : 'Modo simbólico'); });
    $('#practice').addEventListener('change', (e) => { ui.practice = e.target.checked; saveUI(); document.querySelectorAll('.card.reveal').forEach((c) => c.classList.remove('reveal')); renderAll(); });
    $('#undo').addEventListener('click', undo);
    $('#redo').addEventListener('click', redo);
    $('#plane').addEventListener('change', (e) => { cancelPlace(); scen.view.plane = e.target.value; Canvas.fit(); renderAll(); });
    $('#cut').addEventListener('input', (e) => { scen.view.cut = e.target.value; schedule(); });
    const chipsS = $('#chips-src');
    for (const [k, d] of Object.entries(SOURCES)) chipsS.append(h('button', { class: 'chip', 'data-place': 'src:' + k, title: 'Añadir ' + d.label.toLowerCase() + ' (clic en el lienzo para colocarla)', onclick: () => chipAdd('src', k) }, '+ ' + (d.short || d.label)));
    const chipsA = $('#chips-an');
    for (const [k, d] of Object.entries(ANALYSES)) chipsA.append(h('button', { class: 'chip', 'data-place': 'an:' + k, title: d.label, onclick: () => chipAdd('an', k) }, '+ ' + (d.short || d.label)));
    $('#probe-p').addEventListener('click', () => chipAdd('probe', '+'));
    $('#probe-n').addEventListener('click', () => chipAdd('probe', '-'));
    $('#probe-x').addEventListener('click', () => { cancelPlace(); Canvas.clearProbes(); });
    for (const id of ['t-lines', 't-equi', 't-grid', 't-cmap', 'cmap-q']) $('#' + id).addEventListener('change', () => { ui[id] = $('#' + id).type === 'checkbox' ? $('#' + id).checked : $('#' + id).value; saveUI(); Canvas.draw(out, scen); });
    for (const id of ['t-lines', 't-equi', 't-grid', 't-cmap']) if (typeof ui[id] === 'boolean') $('#' + id).checked = ui[id];
    if (ui['cmap-q']) $('#cmap-q').value = ui['cmap-q'];
    $('#zin').addEventListener('click', () => Canvas.zoom(1.25));
    $('#zout').addEventListener('click', () => Canvas.zoom(0.8));
    $('#zfit').addEventListener('click', () => { Canvas.fit(); Canvas.draw(out, scen); });
    // arrastrar archivos sobre la página
    window.addEventListener('dragover', (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); document.body.classList.add('dropping'); } });
    window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dropping'); });
    window.addEventListener('drop', (e) => { document.body.classList.remove('dropping'); if (e.dataTransfer?.files?.length) { e.preventDefault(); importFiles([...e.dataTransfer.files]); } });
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => out && out.results.forEach((res, i) => res.chart && mountChart($('#res-' + i), res.chart, scen.analyses[i].id)), 150); });
    if (!ui.side) $('#app').classList.add('closed');
  }
  // guía de uso: las capturas van incrustadas en GUIA_IMG (las añade build.sh) y se cargan al abrirla
  function openGuide(id) {
    if (isMobile()) setSide(false);
    for (const el of document.querySelectorAll('#guide .sec-name')) el.textContent = Presets.section;
    for (const img of document.querySelectorAll('#guide img[data-img]')) if (!img.src && window.GUIA_IMG?.[img.dataset.img]) img.src = GUIA_IMG[img.dataset.img];
    $('#guide').showModal();
    if (id) showGuide(id); else { $('#guide-c').scrollTop = 0; markGuide('g-vista'); }
  }
  function markGuide(id) {
    for (const b of document.querySelectorAll('#guide-nav button')) {
      const on = b.dataset.g === id;
      if (on && !b.classList.contains('on') && isMobile()) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      b.classList.toggle('on', on);
    }
  }
  function showGuide(id) { $('#guide-c').scrollTop = $('#' + id).offsetTop - 8; markGuide(id); }
  function flash(t) { const f = $('#flash'); f.textContent = t; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (f.hidden = true), 2600); }

  // al arrastrar en el lienzo
  function onDrag(path, val) {
    setPath(scen, path, val);
    const el = document.querySelector(`[data-path='${JSON.stringify(path)}']`);
    if (el) el.value = val;
    schedule();
  }

  window.App = { onDrag, endDrag: () => setTimeout(commit, 30), get scen() { return scen; } };
  initControls();
  Canvas.init();
  const saved = store.get(K_CUR, null);
  if (saved?.scene && saved.ref) {
    try { cur = { ...saved, scene: validScene(saved.scene) }; scen = cur.scene; resetHistory(); Canvas.fit(); renderSidebar(); renderAll(); }
    catch (e) { openRef({ kind: 'preset', id: Presets.list[0].key }); }
  } else openRef({ kind: 'preset', id: Presets.list[0].key });
})();


/* =====================================================================
   Portada personal: lo que Ciencify recuerda de ti, solo en este navegador (localStorage, sin
   cuentas ni envíos). herramientas.js lo pone en cada herramienta y fenómeno tras biblioteca.js; la
   portada (portal.js) lo usa para pintar «Tu espacio». Claves:
     simu-recientes   [{ r: 'asignatura/herramienta', t: ms }]   las últimas 8, la más nueva primero
     simu-favoritos   ['asignatura/herramienta', …]
   En cada herramienta apunta la visita y añade el botón ☆ «Favorita» junto a Mis ejercicios.
   Personal.espacio(sitio) devuelve { continuar, favoritas, recientes } con rutas (portal.js las
   convierte en tarjetas); Personal.borra() olvida todo.
   ===================================================================== */
const Personal = (() => {
  const K_REC = 'simu-recientes', K_FAV = 'simu-favoritos', MAX = 8;
  const lee = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const escribe = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  // «/fisica/gases/» → 'fisica/gases' (las dos últimas partes: también vale desde un archivo local)
  const rutaDe = (p) => { const q = String(p).split('/').filter((s) => s && !/\.html?$/.test(s)); return q.length >= 2 ? q.slice(-2).join('/') : null; };
  const recientes = () => lee(K_REC).filter((x) => x && typeof x.r === 'string');
  const favoritos = () => lee(K_FAV).filter((x) => typeof x === 'string');
  function visita(ruta, ahora = Date.now()) { escribe(K_REC, [{ r: ruta, t: ahora }, ...recientes().filter((x) => x.r !== ruta)].slice(0, MAX)); }
  const esFavorita = (ruta) => favoritos().includes(ruta);
  function alterna(ruta) { const f = favoritos(), i = f.indexOf(ruta); if (i >= 0) f.splice(i, 1); else f.push(ruta); escribe(K_FAV, f); return i < 0; }
  // continuar = la última visitada; recientes = las demás
  function espacio() {
    const r = recientes();
    return { continuar: r[0] || null, favoritas: favoritos(), recientes: r.slice(1, 6) };
  }
  function borra() { try { localStorage.removeItem(K_REC); localStorage.removeItem(K_FAV); } catch (e) { /* sin almacenamiento */ } }
  // «hace 5 min», «hace 3 h», «ayer», «hace 4 días»
  function hace(t, ahora = Date.now()) {
    const m = Math.max(0, Math.round((ahora - t) / 60000));
    if (m < 2) return 'justo ahora';
    if (m < 60) return `hace ${m} min`;
    if (m < 60 * 24) return `hace ${Math.round(m / 60)} h`;
    const d = Math.round(m / 1440);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  }

  const CSS = '.fav-btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--vidrio, var(--panel)); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none); border: 1px solid var(--vidrio-borde, var(--line)); border-radius: 999px; padding: 5px 12px; cursor: pointer; white-space: nowrap } .fav-btn:hover, .fav-btn[aria-pressed=true] { border-color: var(--accent); color: var(--accent) } @media print { .fav-btn { display: none !important } }';
  function monta() {
    if (typeof document === 'undefined') return;
    const ruta = rutaDe(location.pathname); if (!ruta) return;
    visita(ruta);
    const sitio = document.querySelector('.miga-der'); if (!sitio || sitio.querySelector('.fav-btn')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fav-btn';
    const pinta = () => { const on = esFavorita(ruta); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Quitar de tus favoritas (portada)' : 'Añadir a tus favoritas (portada)'; b.innerHTML = `<span aria-hidden="true">${on ? '★' : '☆'}</span> Favorita`; };
    b.addEventListener('click', () => { alterna(ruta); pinta(); });
    pinta(); sitio.append(b);
  }
  monta();
  return { rutaDe, visita, esFavorita, alterna, espacio, borra, hace, recientes, favoritos, K_REC, K_FAV };
})();

