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
if (typeof module !== 'undefined') module.exports = Fmt;
