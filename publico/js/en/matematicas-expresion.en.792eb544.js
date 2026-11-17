const Expresion = (() => {
  const N = (v) => ({ t: 'n', v }), X = { t: 'x' }, C = (v) => ({ t: 'c', v });
  const op = (t, a, b) => ({ t, a, b }), neg = (a) => ({ t: 'neg', a }), fn = (f, a) => ({ t: 'fn', f, a });
  const esN = (n, v) => n.t === 'n' && (v === undefined || n.v === v);

  const FUN = {
    sen: 'sin', sin: 'sin', cos: 'cos', tg: 'tan', tan: 'tan', sec: 'sec', cosec: 'cosec', csc: 'cosec', cotg: 'cotg', cot: 'cotg', ctg: 'cotg',
    arcsen: 'arcsin', arcsin: 'arcsin', asin: 'arcsin', arccos: 'arccos', acos: 'arccos', arctg: 'arctan', arctan: 'arctan', atan: 'arctan',
    senh: 'sinh', sinh: 'sinh', sh: 'sinh', cosh: 'cosh', ch: 'cosh', tgh: 'tanh', tanh: 'tanh', th: 'tanh',
    ln: 'ln', log: 'log', exp: 'exp', sqrt: 'sqrt', raiz: 'sqrt', 'raíz': 'sqrt', cbrt: 'cbrt', abs: 'abs',
    escalon: 'u', 'escalón': 'u', heaviside: 'u', delta: 'δ', dirac: 'δ',
  };
  const vf = (f) => (typeof Mates !== 'undefined' && Mates.nombreFn ? Mates.nombreFn(f) : f); // nombre de la función como se ve en pantalla (sen → sin en inglés)
  const PALABRAS = [...Object.keys(FUN), 'pi'].sort((a, b) => b.length - a.length);

  function tokens(src, nom, vars = ['x']) {
    const s = String(src ?? '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/\*\*/g, '^').replace(/²/g, '^2').replace(/³/g, '^3').replace(/[\[{]/g, '(').replace(/[\]}]/g, ')');
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      let m = s.slice(i).match(/^\d+(?:[.,]\d+)?|^[.,]\d+/);
      if (m) { out.push({ k: 'n', v: +m[0].replace(',', '.') }); i += m[0].length; continue; }
      m = s.slice(i).match(/^[a-zA-Záéíóúñ]+/);
      if (m) {
        let w = m[0].toLowerCase(), j = 0;
        while (j < w.length) {
          const p = PALABRAS.find((q) => w.startsWith(q, j));
          if (p) { out.push(p === 'pi' ? { k: 'c', v: 'π' } : { k: 'f', v: FUN[p] }); j += p.length; }
          else if (vars.includes(w[j])) { out.push({ k: 'x', v: w[j] }); j++; }
          else if (w[j] === 'e') { out.push({ k: 'c', v: 'e' }); j++; }
          else throw new Error(`${nom}: I don't know what “${m[0].slice(j)}” is. ${vars.length > 1 ? `The variables are ${vars.join(' and ')}` : vars.length ? `The variable is ${vars[0]}` : 'There are no variables here'}; the functions are sin, cos, tan, asin, atan, ln (natural), log (decimal), e^x, √…`);
        }
        i += m[0].length; continue;
      }
      if (c === 'π') { out.push({ k: 'c', v: 'π' }); i++; continue; }
      if (c === '√' || c === '∛') { out.push({ k: 'f', v: c === '√' ? 'sqrt' : 'cbrt' }); i++; continue; }
      if ('+-*/^()|!'.includes(c)) { out.push({ k: c }); i++; continue; }
      throw new Error(`${nom}: I don't understand the symbol “${c}”`);
    }
    return out;
  }

  function lee(src, nom = 'The function', vars = ['x']) {
    if (!String(src ?? '').trim()) throw new Error(`${nom.toLowerCase()} is missing`);
    const tk = tokens(src, nom, vars);
    let p = 0, enAbs = 0;
    const ve = () => tk[p], es = (k) => tk[p] && tk[p].k === k;
    const falla = (que) => new Error(`${nom}: ${que} in “${String(src).trim()}”`);
    const empieza = () => { const k = ve(); return k && (k.k === 'n' || k.k === 'x' || k.k === 'c' || k.k === 'f' || k.k === '(' || (k.k === '|' && !enAbs)); };
    function suma() {
      let a = producto();
      while (es('+') || es('-')) { const o = tk[p++].k; a = op(o, a, producto()); }
      return a;
    }
    function producto() {
      let a = unario();
      for (;;) {
        if (es('*') || es('/')) { const o = tk[p++].k; a = op(o, a, unario()); }
        else if (empieza()) a = op('*', a, potencia());
        else return a;
      }
    }
    function unario() {
      if (es('-')) { p++; return neg(unario()); }
      if (es('+')) { p++; return unario(); }
      return potencia();
    }
    function potencia() {
      let b = primario();
      while (es('!')) { p++; b = fn('fact', b); }
      if (es('^')) { p++; return op('^', b, unario()); }
      return b;
    }
    function primario() {
      const k = ve();
      if (!k) throw falla('something is missing at the end');
      p++;
      if (k.k === 'n') return N(k.v);
      if (k.k === 'x') return k.v === 'x' ? X : { t: 'x', n: k.v };
      if (k.k === 'c') return C(k.v);
      if (k.k === '(') { const a = suma(); if (!es(')')) throw falla('a closing parenthesis is missing'); p++; return a; }
      if (k.k === '|') { enAbs++; const a = suma(); enAbs--; if (!es('|')) throw falla('the closing absolute-value bar is missing'); p++; return fn('abs', a); }
      if (k.k === 'f') {
        let ex = null;
        if (es('^')) { p++; ex = unario(); }
        let a;
        if (es('(')) { p++; a = suma(); if (!es(')')) throw falla('a closing parenthesis is missing'); p++; }
        else {
          if (!empieza()) throw falla(`the argument of ${k.v} is missing`);
          a = potencia();
          if (k.v !== 'sqrt' && k.v !== 'cbrt') while (empieza() && ve().k !== 'f') a = op('*', a, potencia());
        }
        const r = k.v === 'exp' ? op('^', C('e'), a) : fn(k.v, a);
        return ex ? op('^', r, ex) : r;
      }
      throw falla(k.k === ')' ? 'there is an extra parenthesis' : `I did not expect “${k.k}”`);
    }
    const r = suma();
    if (p < tk.length) throw falla(tk[p].k === ')' ? 'there is an extra parenthesis' : `I did not expect “${tk[p].k}”`);
    return r;
  }

  const F1 = {
    sen: Math.sin, cos: Math.cos, tg: Math.tan, sec: (u) => 1 / Math.cos(u), cosec: (u) => 1 / Math.sin(u), cotg: (u) => 1 / Math.tan(u),
    arcsen: Math.asin, arccos: Math.acos, arctg: Math.atan, senh: Math.sinh, cosh: Math.cosh, tgh: Math.tanh,
    ln: (u) => (u > 0 ? Math.log(u) : NaN), log: (u) => (u > 0 ? Math.log10(u) : NaN), sqrt: (u) => (u >= 0 ? Math.sqrt(u) : NaN), cbrt: Math.cbrt, abs: Math.abs,
    u: (u) => (u >= 0 ? 1 : 0), 'δ': () => 0,
    fact: (u) => { if (!(u >= 0) || u !== Math.floor(u) || u > 170) return NaN; let r = 1; for (let i = 2; i <= u; i++) r *= i; return r; },
  };
  const CTE = { 'π': Math.PI, e: Math.E };
  function valorC(n, x) {
    const Z = (re, im = 0) => ({ re: re || 0, im: im || 0 }), mul = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
    const div = (a, b) => { const q = b.re * b.re + b.im * b.im; if (q === 0) throw new Error('there is a division by zero'); return Z((a.re * b.re + a.im * b.im) / q, (a.im * b.re - a.re * b.im) / q); };
    const exp = (a) => { const r = Math.exp(a.re); return Z(r * Math.cos(a.im), r * Math.sin(a.im)); };
    const ln = (a) => { if (a.re === 0 && a.im === 0) throw new Error('the logarithm of 0 does not exist'); return Z(Math.log(Math.hypot(a.re, a.im)), Math.atan2(a.im, a.re)); };
    const pot = (a, b) => {
      if (b.im === 0 && Number.isInteger(b.re) && Math.abs(b.re) <= 64) { let r = Z(1); for (let k = 0; k < Math.abs(b.re); k++) r = mul(r, a); return b.re < 0 ? div(Z(1), r) : r; }
      if (a.re === 0 && a.im === 0) { if (b.re > 0) return Z(0); throw new Error('0 raised to a non-positive exponent does not exist'); }
      return exp(mul(b, ln(a)));
    };
    const sen = (a) => Z(Math.sin(a.re) * Math.cosh(a.im), Math.cos(a.re) * Math.sinh(a.im)), cos = (a) => Z(Math.cos(a.re) * Math.cosh(a.im), -Math.sin(a.re) * Math.sinh(a.im));
    const FC = {
      sqrt: (a) => (a.im === 0 ? (a.re >= 0 ? Z(Math.sqrt(a.re)) : Z(0, Math.sqrt(-a.re))) : pot(a, Z(0.5))), cbrt: (a) => (a.im === 0 ? Z(Math.cbrt(a.re)) : pot(a, Z(1 / 3))),
      abs: (a) => Z(Math.hypot(a.re, a.im)), exp, ln, log: (a) => div(ln(a), Z(Math.LN10)), sen, cos, tg: (a) => div(sen(a), cos(a)),
      arctg: (a) => { const u = ln(Z(1 + a.im, -a.re)), w = ln(Z(1 - a.im, a.re)); return Z((u.im - w.im) / -2, (u.re - w.re) / 2); },
      senh: (a) => Z(Math.sinh(a.re) * Math.cos(a.im), Math.cosh(a.re) * Math.sin(a.im)), cosh: (a) => Z(Math.cosh(a.re) * Math.cos(a.im), Math.sinh(a.re) * Math.sin(a.im)),
    };
    const v = (q) => {
      switch (q.t) {
        case 'n': return Z(q.v);
        case 'c': return Z(CTE[q.v]);
        case 'x': if (q.n === 'i') return Z(0, 1); if (!q.n && x) return Z(x.re, x.im); throw new Error('it can only contain numbers, i, π and e');
        case 'neg': { const a = v(q.a); return Z(-a.re, -a.im); }
        case '+': { const a = v(q.a), b = v(q.b); return Z(a.re + b.re, a.im + b.im); }
        case '-': { const a = v(q.a), b = v(q.b); return Z(a.re - b.re, a.im - b.im); }
        case '*': return mul(v(q.a), v(q.b));
        case '/': return div(v(q.a), v(q.b));
        case '^': return pot(v(q.a), v(q.b));
        case 'fn': {
          const a = v(q.a);
          if (FC[q.f] && (a.im !== 0 || (q.f === 'sqrt' && a.re < 0) || ((q.f === 'ln' || q.f === 'log') && a.re < 0))) return FC[q.f](a);
          if (a.im !== 0) throw new Error(`I cannot calculate ${vf(q.f)} of a complex number`);
          const r = F1[q.f](a.re); if (!isFinite(r)) throw new Error(`${vf(q.f)}(${a.re}) no existe`); return Z(r);
        }
      }
      throw new Error('no se entiende');
    };
    const z = v(n), limpio = (t) => (Math.abs(t) < 1e-14 ? 0 : t);
    if (x) return z;
    if (!isFinite(z.re) || !isFinite(z.im)) throw new Error('it does not give a number');
    return Z(limpio(z.re), limpio(z.im));
  }
  function complejo(texto, nom = 'The number') {
    const ast = lee(String(texto).replace(/j/g, 'i'), nom, ['i']);
    try { return { z: valorC(ast), ast }; } catch (e) { throw new Error(`${nom}: ${e.message}`); }
  }
  function valor(n, x, env) {
    switch (n.t) {
      case 'n': return n.v;
      case 'x': return n.n ? env?.[n.n] ?? NaN : x;
      case 'c': return CTE[n.v];
      case 'neg': return -valor(n.a, x, env);
      case '+': return valor(n.a, x, env) + valor(n.b, x, env);
      case '-': return valor(n.a, x, env) - valor(n.b, x, env);
      case '*': return valor(n.a, x, env) * valor(n.b, x, env);
      case '/': return valor(n.a, x, env) / valor(n.b, x, env);
      case '^': {
        const b = valor(n.a, x, env), e = valor(n.b, x, env);
        if (b < 0 && !Number.isInteger(e)) { const q = fraccion(e); if (q && q[1] % 2) return (q[0] % 2 ? -1 : 1) * Math.abs(b) ** e; return NaN; }
        return b ** e;
      }
      case 'fn': return F1[n.f](valor(n.a, x, env));
    }
    return NaN;
  }
  const tieneX = (n, v = 'x') => (n.t === 'x' && (n.n || 'x') === v) || (n.a && tieneX(n.a, v)) || (n.b && tieneX(n.b, v));

  function fraccion(x, qMax = 100000) {
    if (!isFinite(x)) return null;
    const s = Math.sign(x) || 1, a0 = Math.abs(x);
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0, y = a0;
    for (let i = 0; i < 30; i++) {
      const a = Math.floor(y), h = a * h1 + h0, k = a * k1 + k0;
      if (k > qMax) break;
      h0 = h1; h1 = h; k0 = k1; k1 = k;
      if (Math.abs(h1 / k1 - a0) <= 1e-11 * Math.max(1, a0)) return [s * h1, k1];
      if (y - a < 1e-15) break;
      y = 1 / (y - a);
    }
    return null;
  }
  const IRR = [['', 1], ['√2', Math.SQRT2], ['√3', Math.sqrt(3)], ['π', Math.PI], ['e', Math.E], ['√e', Math.sqrt(Math.E)], ['√π', Math.sqrt(Math.PI)], ['√6', Math.sqrt(6)], ['π^2', Math.PI ** 2], ['ln 2', Math.LN2]];
  function exacto(x, qMax = 50000) {
    if (Math.abs(x) < 1e-13) return { p: 0, q: 1, s: '' };
    for (const [s, v] of IRR) { const r = fraccion(x / v, 2000); if (r && Math.abs(r[0]) <= 1e7) return { p: r[0], q: r[1], s }; }
    const r = fraccion(x, qMax);
    return r && Math.abs(r[0]) <= 1e7 ? { p: r[0], q: r[1], s: '' } : null;
  }
  const dec = (x) => String(+x.toPrecision(12)).replace('.', '.').replace('-', '−');
  function numTxt(x, d = 6) {
    const e = exacto(x);
    if (!e) return dec4(x, d);
    const sg = e.p < 0 ? '−' : '', P = Math.abs(e.p);
    const arriba = e.s ? (P === 1 ? e.s : `${P} ${e.s}`) : String(P);
    return sg + (e.q === 1 ? arriba : `{${arriba}}/{${e.q}}`);
  }
  function dec4(x, d = 4) {
    if (!isFinite(x)) return '—';
    if (x === 0 || Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-]?)(\d+)/, (_, sg, k) => `·10^{${sg === '-' ? '−' : ''}${+k}}`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  }

  function clave(n) { return texto(n); }
  const esNum = (n) => n.t === 'n';
  function simp(n) {
    switch (n.t) {
      case 'n': case 'x': case 'c': return n;
      case '+': case '-': return suma(n);
      case 'neg': case '*': case '/': return producto(n);
      case '^': {
        const b = simp(n.b);
        if (esNum(b) && (b.v < 0 || !Number.isInteger(b.v)) && !esNum(n.a)) return producto(op('^', n.a, b));
        return potencia(op('^', simp(n.a), b));
      }
      case 'fn': {
        const a = simp(n.a);
        if (esNum(a)) { const v = F1[n.f](a.v); if (Number.isInteger(v)) return N(v); }
        if (n.f === 'ln' && a.t === 'c' && a.v === 'e') return N(1);
        if (n.f === 'ln' && a.t === '^' && a.a.t === 'c' && a.a.v === 'e') return a.b;
        return fn(n.f, a);
      }
    }
    return n;
  }
  function potencia(n) {
    const { a, b } = n;
    if (esN(b, 0)) return N(1);
    if (esN(b, 1)) return a;
    if (esN(a, 1)) return N(1);
    if (esN(a, 0) && esNum(b) && b.v > 0) return N(0);
    if (esNum(a) && esNum(b)) { const v = a.v ** b.v; if (Number.isInteger(v) && Math.abs(v) < 1e9) return N(v); }
    if (a.t === '^' && esNum(b) && (esNum(a.b) || Number.isInteger(b.v))) return potencia(op('^', a.a, esNum(a.b) ? N(a.b.v * b.v) : producto(op('*', b, a.b))));
    if (a.t === 'fn' && a.f === 'sqrt' && esN(b, 2)) return a.a;
    if (a.t === 'neg' && esNum(b) && Number.isInteger(b.v)) return b.v % 2 ? neg(potencia(op('^', a.a, b))) : potencia(op('^', a.a, b));
    if ((a.t === '*' || a.t === '/') && esNum(b) && Number.isInteger(b.v)) { const r = (m) => (m.t === '*' || m.t === '/' ? op(m.t, r(m.a), r(m.b)) : op('^', m, b)); return producto(r(a)); }
    return n;
  }
  function producto(n) {
    let c = 1;
    const fs = [];
    function anota(base, e) {
      const k = clave(base), f = fs.find((g) => g.k === k);
      if (f) f.e += e; else fs.push({ k, base, e });
    }
    function junta(m, s) {
      if (m.t === 'neg') { c *= Number.isInteger(s) ? (-1) ** s : NaN; junta(m.a, s); return; }
      if (m.t === '*') { junta(m.a, s); junta(m.b, s); return; }
      if (m.t === '/') { junta(m.a, s); junta(m.b, -s); return; }
      if (m.t === '^') {
        const b = simp(m.b);
        if (esNum(b) && !esNum(m.a)) { junta(m.a, s * b.v); return; }
        if (esNum(b) && esNum(m.a) && !Number.isInteger(m.a.v ** b.v)) { anota(m.a, s * b.v); return; }
      }
      const q = simp(m);
      if (q !== m && (q.t === 'neg' || q.t === '*' || q.t === '/' || (q.t === '^' && esNum(q.b) && !esNum(q.a)))) { junta(q, s); return; }
      if (q.t === 'n') { c *= q.v ** s; return; }
      if (q.t === '^' && esNum(q.b) && !esNum(q.a)) { anota(q.a, s * q.b.v); return; }
      if (q.t === 'fn' && (q.f === 'sqrt' || q.f === 'cbrt')) { anota(q.a, s / (q.f === 'sqrt' ? 2 : 3)); return; }
      anota(q, s);
    }
    junta(n, 1);
    if (c === 0 || !isFinite(c)) return N(c === 0 ? 0 : NaN);
    const fx = (f) => {
      const e = +f.e.toPrecision(12), ent = Math.floor(e + 1e-9), resto = e - ent;
      const raiz = Math.abs(resto - 0.5) < 1e-9 ? fn('sqrt', f.base) : Math.abs(resto - 1 / 3) < 1e-9 ? fn('cbrt', f.base) : Math.abs(resto - 2 / 3) < 1e-9 ? op('^', fn('cbrt', f.base), dos) : null;
      if (raiz) return ent ? op('*', ent === 1 ? f.base : op('^', f.base, N(ent)), raiz) : raiz;
      return Math.abs(e - 1) < 1e-12 ? f.base : potencia(op('^', f.base, N(e)));
    };
    const rango = (b) => (b.t === 'n' ? -1 : b.t === 'x' ? 0 : b.t === 'c' ? 1 : b.t === '^' ? 2 : b.t === '+' || b.t === '-' ? 3 : 4);
    const orden = (p, q) => rango(p.base) - rango(q.base) || (p.k < q.k ? 1 : p.k > q.k ? -1 : 0) * (rango(p.base) === 0 ? -1 : 1);
    const arriba = fs.filter((f) => f.e > 1e-12).sort(orden).map(fx);
    const abajo = fs.filter((f) => f.e < -1e-12).sort(orden).map((f) => fx({ base: f.base, e: -f.e }));
    if (c === -1 && arriba.length === 1 && !abajo.length && (arriba[0].t === '+' || arriba[0].t === '-')) return suma(neg(arriba[0]));
    if (!arriba.length && !abajo.length) return N(+c.toPrecision(15));
    const sg = c < 0 ? -1 : 1, fr = fraccion(Math.abs(c), 1e6) || [Math.abs(c), 1];
    const mul = (xs) => xs.reduce((a, b) => op('*', a, b));
    const num = fr[0] !== 1 || !arriba.length ? [N(fr[0]), ...arriba] : arriba;
    const den = fr[1] !== 1 ? [N(fr[1]), ...abajo] : abajo;
    let r = den.length ? op('/', mul(num), mul(den)) : mul(num);
    if (sg < 0) r = r.t === 'n' ? N(-r.v) : neg(r);
    return r;
  }
  function parte(m) {
    if (m.t === 'n') return [m.v, null];
    if (m.t === 'neg') { const [c, r] = parte(m.a); return [-c, r]; }
    if (m.t === '*') {
      const plano = (q) => (q.t === '*' ? [...plano(q.a), ...plano(q.b)] : [q]), fs = plano(m);
      const c = fs.filter(esNum).reduce((a, q) => a * q.v, 1), resto = fs.filter((q) => !esNum(q));
      return [c, resto.length ? resto.reduce((a, b) => op('*', a, b)) : null];
    }
    if (m.t === '/') { const [c1, r1] = parte(m.a), [c2, r2] = parte(m.b); return [c1 / c2, r2 ? op('/', r1 || N(1), r2) : r1]; }
    return [1, m];
  }
  function suma(n) {
    const ts = [];
    function junta(m, s) {
      if (m.t === '+') { junta(m.a, s); junta(m.b, s); return; }
      if (m.t === '-') { junta(m.a, s); junta(m.b, -s); return; }
      if (m.t === 'neg') { junta(m.a, -s); return; }
      if (m.t === '*' && esNum(m.a) && (m.b.t === '+' || m.b.t === '-')) { junta(m.b, s * m.a.v); return; }
      const q = simp(m);
      if (q.t === '+' || q.t === '-' || q.t === 'neg') { junta(q, s); return; }
      const [c, r] = parte(q), k = r ? clave(r) : '';
      const t = ts.find((u) => u.k === k);
      if (t) t.c += s * c; else ts.push({ k, r, c: s * c });
    }
    junta(n, 1);
    const vivos = ts.filter((t) => Math.abs(t.c) > 1e-12);
    if (!vivos.length) return N(0);
    const termino = (c, r) => (r ? producto(op('*', N(c), r)) : N(c));
    let r = termino(vivos[0].c, vivos[0].r);
    for (const t of vivos.slice(1)) r = t.c < 0 ? op('-', r, termino(-t.c, t.r)) : op('+', r, termino(t.c, t.r));
    return r;
  }

  const uno = N(1), dos = N(2);
  let vd = 'x';
  const tv = (m) => tieneX(m, vd);
  function d(n) {
    if (!tv(n)) return N(0);
    switch (n.t) {
      case 'x': return uno;
      case '+': case '-': return op(n.t, d(n.a), d(n.b));
      case 'neg': return neg(d(n.a));
      case '*': return op('+', op('*', d(n.a), n.b), op('*', n.a, d(n.b)));
      case '/':
        if (!tv(n.b)) return op('/', d(n.a), n.b);
        if (!tv(n.a)) return neg(op('/', op('*', n.a, d(n.b)), op('^', n.b, dos)));
        return op('/', op('-', op('*', d(n.a), n.b), op('*', n.a, d(n.b))), op('^', n.b, dos));
      case '^': {
        const { a, b } = n;
        if (!tv(b)) return op('*', op('*', b, op('^', a, op('-', b, uno))), d(a));
        if (a.t === 'c' && a.v === 'e') return op('*', n, d(b));
        if (!tv(a)) return op('*', op('*', n, fn('ln', a)), d(b));
        return op('*', n, op('+', op('*', d(b), fn('ln', a)), op('/', op('*', b, d(a)), a)));
      }
      case 'fn': {
        const u = n.a, du = d(u);
        const D = {
          sen: () => fn('cos', u), cos: () => neg(fn('sin', u)), tg: () => op('/', uno, op('^', fn('cos', u), dos)),
          sec: () => op('*', fn('sec', u), fn('tan', u)), cosec: () => neg(op('*', fn('cosec', u), fn('cotg', u))), cotg: () => neg(op('/', uno, op('^', fn('sin', u), dos))),
          arcsen: () => op('/', uno, fn('sqrt', op('-', uno, op('^', u, dos)))), arccos: () => neg(op('/', uno, fn('sqrt', op('-', uno, op('^', u, dos))))),
          arctg: () => op('/', uno, op('+', uno, op('^', u, dos))), senh: () => fn('cosh', u), cosh: () => fn('sinh', u), tgh: () => op('/', uno, op('^', fn('cosh', u), dos)),
          ln: () => op('/', uno, u), log: () => op('/', uno, op('*', u, fn('ln', N(10)))), sqrt: () => op('/', uno, op('*', dos, fn('sqrt', u))),
          cbrt: () => op('/', uno, op('*', N(3), op('^', fn('cbrt', u), dos))), abs: () => op('/', u, fn('abs', u)),
        }[n.f]();
        return op('*', D, du);
      }
    }
    return N(0);
  }
  const deriva = (n, v = 'x') => { vd = v; try { return simp(d(n)); } finally { vd = 'x'; } };

  const PREC = { '+': 1, '-': 1, neg: 2, '*': 3, '/': 4, '^': 5, fn: 6, n: 7, x: 7, c: 7 };
  const pr = (n) => (n.t === 'n' && n.v < 0 ? 2 : PREC[n.t]);
  const par = (s) => `(${s})`;
  const NOMBRE = { sec: '"sec"', cosec: '"cosec"', cotg: '"cotg"' };
  const simple = (u) => u.t === 'x' || (u.t === 'n' && u.v >= 0) || u.t === 'c' || (u.t === '*' && esNum(u.a) && u.a.v > 0 && (u.b.t === 'x' || u.b.t === 'c'));
  function texto(n) {
    switch (n.t) {
      case 'n': return numTxt(n.v);
      case 'x': return n.n || 'x';
      case 'c': return n.v;
      case 'neg': return `−${pr(n.a) <= 2 ? par(texto(n.a)) : texto(n.a)}`;
      case '+': return `${texto(n.a)} + ${texto(n.b)}`;
      case '-': return `${texto(n.a)} − ${pr(n.b) <= 1 ? par(texto(n.b)) : texto(n.b)}`;
      case '*': {
        const xs = [], plano = (m) => (m.t === '*' ? [...plano(m.a), ...plano(m.b)] : [m]);
        for (const m of plano(n)) {
          let s = pr(m) <= 2 ? par(texto(m)) : texto(m);
          if (xs.length && (/^[\d{]/.test(s) || /[}]$/.test(xs[xs.length - 1]) && m.t === 'n')) s = `· ${s}`;
          xs.push(s);
        }
        return xs.join(' ');
      }
      case '/': return `{${texto(n.a)}}/{${texto(n.b)}}`;
      case '^': {
        const { a, b } = n;
        const ex = `^{${texto(b)}}`;
        if (a.t === 'fn' && !['sqrt', 'cbrt', 'abs'].includes(a.f) && esNum(b) && Number.isInteger(b.v) && b.v > 0) return `${NOMBRE[a.f] || a.f}${ex} ${simple(a.a) ? texto(a.a) : par(texto(a.a))}`;
        const base = a.t === 'x' || a.t === 'c' || (a.t === 'n' && a.v >= 0 && Number.isInteger(a.v)) || (a.t === 'fn' && ['sqrt', 'cbrt', 'abs'].includes(a.f)) ? texto(a) : par(texto(a));
        return base + ex;
      }
      case 'fn': {
        const u = n.a;
        const solo = u.t === 'x' || u.t === 'c' || (u.t === 'n' && u.v >= 0 && Number.isInteger(u.v));
        if (n.f === 'sqrt') return solo ? `√${texto(u)}` : `√(${texto(u)})`;
        if (n.f === 'cbrt') return solo ? `∛${texto(u)}` : `∛(${texto(u)})`;
        if (n.f === 'abs') return `|${texto(u)}|`;
        if (n.f === 'fact') return `${solo ? texto(u) : par(texto(u))}!`;
        return `${NOMBRE[n.f] || n.f} ${simple(u) ? texto(u) : par(texto(u))}`;
      }
    }
    return '?';
  }

  function serie(n, a, Nn, { evitable = false } = {}) {
    const L = Nn + 1, cero = () => new Float64Array(L);
    const cte = (v) => { const s = cero(); s[0] = v; return s; };
    const noDer = (q) => { const e = new Error(`The function is not differentiable at x = a (${q}): try another point`); e.detalle = q; throw e; };
    const mul = (p, q) => { const r = cero(); for (let i = 0; i < L; i++) if (p[i]) for (let j = 0; i + j < L; j++) r[i + j] += p[i] * q[j]; return r; };
    const corre = (p, m) => { const r = cero(); for (let k = 0; k + m < L; k++) r[k] = p[k + m]; return r; };
    const div = (p, q) => {
      if (Math.abs(q[0]) < 1e-14 && evitable) {
        const esc = Math.max(1e-300, ...q.map(Math.abs)), m = q.findIndex((v) => Math.abs(v) > 1e-10 * esc), escP = Math.max(1, ...p.map(Math.abs));
        if (m > 0 && p.slice(0, m).every((v) => Math.abs(v) < 1e-10 * escP)) { p = corre(p, m); q = corre(q, m); serie.quitados = (serie.quitados || 0) + m; }
      }
      if (Math.abs(q[0]) < 1e-14) noDer('division by zero');
      const r = cero();
      for (let k = 0; k < L; k++) { let s = p[k]; for (let j = 1; j <= k; j++) s -= q[j] * r[k - j]; r[k] = s / q[0]; }
      return r;
    };
    const der = (p) => { const r = cero(); for (let k = 0; k + 1 < L; k++) r[k] = (k + 1) * p[k + 1]; return r; };
    const integra = (dp, c0) => { const r = cero(); r[0] = c0; for (let k = 1; k < L; k++) r[k] = dp[k - 1] / k; return r; };
    const exp = (u) => { const r = cero(); r[0] = Math.exp(u[0]); for (let k = 1; k < L; k++) { let s = 0; for (let j = 1; j <= k; j++) s += j * u[j] * r[k - j]; r[k] = s / k; } return r; };
    const ln = (u) => {
      if (!(u[0] > 0)) noDer(u[0] === 0 ? 'the logarithm of 0' : 'the logarithm of a negative');
      const r = cero(); r[0] = Math.log(u[0]);
      for (let k = 1; k < L; k++) { let s = 0; for (let j = 1; j < k; j++) s += j * r[j] * u[k - j]; r[k] = (u[k] - s / k) / u[0]; }
      return r;
    };
    const pot = (u, p) => {
      if (Number.isInteger(p) && p >= 0) { let r = cte(1), b = u, e = p; while (e) { if (e & 1) r = mul(r, b); b = mul(b, b); e >>= 1; } return r; }
      if (u[0] === 0) noDer(p < 0 ? 'division by zero' : 'a root of 0');
      if (u[0] < 0) {
        const q = fraccion(p);
        if (Number.isInteger(p)) return div(cte(1), pot(u, -p));
        if (q && q[1] % 2) { const r = pot(u.map((v) => -v), p); return q[0] % 2 ? r.map((v) => -v) : r; }
        noDer('a root of a negative');
      }
      const r = cero(); r[0] = u[0] ** p;
      for (let k = 1; k < L; k++) { let s = 0; for (let j = 1; j <= k; j++) s += (p * j - (k - j)) * u[j] * r[k - j]; r[k] = s / (k * u[0]); }
      return r;
    };
    const senCos = (u, h) => {
      const s = cero(), c = cero(), sg = h ? 1 : -1;
      s[0] = h ? Math.sinh(u[0]) : Math.sin(u[0]); c[0] = h ? Math.cosh(u[0]) : Math.cos(u[0]);
      for (let k = 1; k < L; k++) { let a1 = 0, a2 = 0; for (let j = 1; j <= k; j++) { a1 += j * u[j] * c[k - j]; a2 += j * u[j] * s[k - j]; } s[k] = a1 / k; c[k] = (sg * a2) / k; }
      return [s, c];
    };
    function S(m) {
      switch (m.t) {
        case 'n': return cte(m.v);
        case 'c': return cte(CTE[m.v]);
        case 'x': { if (m.n) throw new Error(`The series only accepts the variable x, not ${m.n}`); const s = cte(a); if (L > 1) s[1] = 1; return s; }
        case 'neg': return S(m.a).map((v) => -v);
        case '+': { const p = S(m.a), q = S(m.b); return p.map((v, i) => v + q[i]); }
        case '-': { const p = S(m.a), q = S(m.b); return p.map((v, i) => v - q[i]); }
        case '*': return mul(S(m.a), S(m.b));
        case '/': return div(S(m.a), S(m.b));
        case '^': {
          if (!tieneX(m.b)) return pot(S(m.a), valor(m.b, 0));
          if (m.a.t === 'c' && m.a.v === 'e') return exp(S(m.b));
          return exp(mul(S(m.b), ln(S(m.a))));
        }
        case 'fn': {
          const u = S(m.a);
          switch (m.f) {
            case 'sin': return senCos(u, false)[0];
            case 'cos': return senCos(u, false)[1];
            case 'tan': { const [s, c] = senCos(u, false); return div(s, c); }
            case 'sec': return div(cte(1), senCos(u, false)[1]);
            case 'cosec': return div(cte(1), senCos(u, false)[0]);
            case 'cotg': { const [s, c] = senCos(u, false); return div(c, s); }
            case 'sinh': return senCos(u, true)[0];
            case 'cosh': return senCos(u, true)[1];
            case 'tanh': { const [s, c] = senCos(u, true); return div(s, c); }
            case 'ln': return ln(u);
            case 'log': return ln(u).map((v) => v / Math.LN10);
            case 'sqrt': return pot(u, 0.5);
            case 'cbrt': return pot(u, 1 / 3);
            case 'abs': if (u[0] === 0) noDer('the absolute value at 0'); return u[0] < 0 ? u.map((v) => -v) : u;
            case 'arctan': return integra(div(der(u), mul(u, u).map((v, i) => v + (i ? 0 : 1))), Math.atan(u[0]));
            case 'arcsin': case 'arccos': {
              if (!(Math.abs(u[0]) < 1)) noDer(Math.abs(u[0]) === 1 ? `${vf(m.f)} at ±1` : `${vf(m.f)} outside [−1, 1]`);
              const r = integra(div(der(u), pot(mul(u, u).map((v, i) => (i ? -v : 1 - v)), 0.5)), Math.asin(u[0]));
              return m.f === 'arcsin' ? r : r.map((v, i) => (i ? -v : Math.PI / 2 - v));
            }
          }
        }
      }
      throw new Error('Invalid expression');
    }
    const r = S(n);
    if (![...r].every(isFinite)) noDer('an infinite value results');
    return r;
  }

  return { lee, valor, valorC, complejo, deriva, simp, texto, serie, exacto, fraccion, numTxt, dec4, tieneX, N, X };
})();

