/* =====================================================================
   Formato: convierte números, Ex, Poly y vectores en HTML legible.
   ===================================================================== */
const Fmt = (() => {
  const { identify, KINDS, QTY, splitKey, PI, EPS0 } = Engine;
  let kinds = {}; // símbolo -> tipo (q, lambda, sigma, rho, p)
  let unit = 'a';
  let mode = 'sym';
  const setContext = (k, u, md) => { kinds = k; unit = u || 'a'; mode = md || 'sym'; };
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
    return Object.keys(cnt).sort().map((s) => sym(s) + sup(cnt[s])).join('');
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
        const t = mixTop(a);
        return { neg: t.neg, html: frac(t.s + piTop + syms, `${a.d !== 1 ? a.d : ''}${denTail}`) };
      }
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
    return joinTerms(P.keys().sort().map((k) => term(P.coef(k), k, qty)));
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // vector de Poly, factorizando cuando hay un único monomio
  function vec(vp, qty) {
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
          // si hay un solo componente, el radical sale fuera
          const single = nz.length === 1;
          const rad = single && nz[0].id.r > 1 ? '√' + nz[0].id.r : '';
          const syms = mono(key) + (n > 0 ? unitPow(n) : '');
          const top = `${g !== 1 || (!syms && !rad) ? g : ''}${rad}${syms}`;
          const den = `${L !== 1 ? L : ''}${piDen ? 'π' : ''}${hasEps(qty) ? 'ε<sub>0</sub>' : ''}${n < 0 ? unitPow(-n) : ''}`;
          const front = (neg ? MINUS : '') + frac(top, den);
          if (single) return `${front} ${uv(comps[nz[0].i])}`;
          const inner = nz.map((o, j) => {
            const m = ints[j] / g;
            const sgn = (o.id.s < 0) !== neg;
            const c = `${m !== 1 || o.id.r === 1 ? m : ''}${o.id.r > 1 ? '√' + o.id.r : ''}`;
            const c2 = m === 1 && o.id.r === 1 ? '' : c;
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
if (typeof module !== 'undefined') module.exports = Fmt;
