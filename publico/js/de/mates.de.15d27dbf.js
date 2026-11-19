const Mates = (() => {
  const VISTA_FN = Object.fromEntries('sen=sin tg=tan arcsen=arcsin arctg=arctan senh=sinh tgh=tanh máx=max mín=min lím=lim'.split(' ').map((x) => x.split('=')));
  const nombreFn = (f) => VISTA_FN[f] || f;
  const FUNC = new Set(['cos', 'tan', 'ln', 'log', 'exp', 'arccos', 'cosh', 'sin', 'arcsin', 'arctan', 'sinh', 'tanh', 'max', 'min', 'lim', ...Object.keys(VISTA_FN)]);
  const OPS = '+-−=·×÷⇒⇔→←↔≈≠<>≤≥±∓,;:!∝∈∼≡∑∏∫∂∇⊥∥';
  const escH = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function tokens(src) {
    const s = String(src)
      .replace(/<sup>/g, '^{').replace(/<\/sup>/g, '}').replace(/<sub>/g, '_{').replace(/<\/sub>/g, '}')
      .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const out = [];
    let i = 0, sp = false;
    while (i < s.length) {
      const c = s[i], resto = s.slice(i);
      let m;
      if (/\s/.test(c)) { sp = true; i++; continue; }
      if (c === '\\' && (s[i + 1] === '{' || s[i + 1] === '}')) { out.push({ t: 's', v: c + s[i + 1], sp }); i += 2; sp = false; continue; }
      if ((m = resto.match(/^\d+(?:[.,]\d+)?/))) out.push({ t: 'n', v: m[0].replace('.', ','), sp });
      else if (c === '"') { const j = s.indexOf('"', i + 1); m = [s.slice(i, j < 0 ? s.length : j + 1)]; out.push({ t: 'x', v: m[0].replace(/"/g, ''), sp }); }
      else if ((m = resto.match(/^[\p{L}\p{M}∞]+[′″]*/u))) out.push({ t: 'w', v: m[0], sp });
      else { m = [c]; out.push({ t: 's', v: c, sp }); }
      i += m[0].length; sp = false;
    }
    return out;
  }

  const nodo = (m, dentro = null) => ({ m, dentro });
  const fila = (xs) => (xs.length === 1 ? xs[0] : `<mrow>${xs.join('')}</mrow>`);
  const letra = (v) => (/^\d+(,\d+)?$/.test(v) ? `<mn>${v}</mn>` : [...v].length === 1 ? `<mi>${escH(v)}</mi>` : `<mi mathvariant="normal">${escH(v)}</mi>`);

  function analiza(tk) {
    let p = 0;
    const ver = () => tk[p], es = (v) => tk[p] && tk[p].t === 's' && tk[p].v === v;
    function secuencia(cierre) {
      const xs = [];
      let prevOp = true;
      while (p < tk.length && !(cierre && es(cierre))) {
        const k = ver();
        if (k.t === 's' && OPS.includes(k.v) && !(k.v === '∫' && tk[p + 1] && tk[p + 1].t === 's' && (tk[p + 1].v === '_' || tk[p + 1].v === '^'))) {
          p++;
          const v = k.v === '-' ? '−' : k.v;
          const signo = prevOp && (v === '−' || v === '+' || v === '±');
          xs.push(v === '!' ? '<mo lspace="0">!</mo>' : v === ',' || v === ';' ? `<mo separator="true">${v}</mo>` : signo ? `<mo form="prefix" lspace="0" rspace="0.05em">${v}</mo>` : `<mo>${escH(v)}</mo>`);
          prevOp = true; continue;
        }
        if (k.t === 's' && (k.v === ')' || k.v === '}' || k.v === ']')) { p++; continue; } // paréntesis sueltos
        xs.push(fraccion().m); prevOp = false;
      }
      return xs;
    }
    function fraccion() {
      let a = guiones();
      while (es('/')) { p++; const b = guiones(); a = nodo(`<mfrac>${a.dentro ?? a.m}${b.dentro ?? b.m}</mfrac>`); }
      return a;
    }
    function argumento() {
      if (es('{')) { p++; const xs = secuencia('}'); p++; return fila(xs); }
      if (es('-') || es('−')) { p++; const a = argumento(); return `<mrow><mo>−</mo>${a}</mrow>`; }
      if (es('(')) { const a = atomo(); return a.m; }
      const k = ver();
      if (!k) return '<mrow></mrow>';
      if (k.t === 's') { p++; return `<mo>${escH(k.v)}</mo>`; }
      let v = k.v; p++;
      while (ver() && !ver().sp && (ver().t === 'n' || ver().t === 'w')) { v += ver().v; p++; }
      return letra(/^m[áa][x]$|^m[íi][n]$/.test(v) ? nombreFn(v) : v);
    }
    function guiones() {
      const base = atomo();
      let sub = null, sup = null;
      for (;;) {
        if (es('_') && sub === null) { p++; sub = argumento(); } else if (es('^') && sup === null) { p++; sup = argumento(); } else break;
      }
      if (sub === null && sup === null) return base;
      const b = base.m;
      return nodo(sub !== null && sup !== null ? `<msubsup>${b}${sub}${sup}</msubsup>` : sub !== null ? `<msub>${b}${sub}</msub>` : `<msup>${b}${sup}</msup>`);
    }
    function atomo() {
      const k = ver();
      if (!k) return nodo('<mrow></mrow>');
      p++;
      if (k.t === 'n') return nodo(`<mn>${k.v}</mn>`);
      if (k.t === 'x') return nodo(`${k.sp && p > 1 ? '<mspace width="0.3em"></mspace>' : ''}<mtext>${escH(/^m[áa][x]$|^m[íi][n]$/.test(k.v) ? nombreFn(k.v) : k.v)}</mtext>`);
      if (k.t === 'w') {
        if (k.v === 'binom' && es('(')) { p++; const a = secuencia(','); p++; const b = secuencia(')'); p++; return nodo(`<mrow><mo>(</mo><mfrac linethickness="0">${fila(a)}${fila(b)}</mfrac><mo>)</mo></mrow>`); }
        if (FUNC.has(k.v)) { let m = `<mi mathvariant="normal">${nombreFn(k.v)}</mi>`; if (es('^')) { p++; m = `<msup>${m}${argumento()}</msup>`; } return nodo(`<mspace width="0.17em"></mspace>${m}<mo>&#x2061;</mo><mspace width="0.12em"></mspace>`); }
        if (k.sp && p > 1 && /^d[a-zA-Zθφρ]$/.test(k.v)) return nodo(`<mspace width="0.17em"></mspace><mi>d</mi><mi>${escH(k.v[1])}</mi>`);
        const ls = [...k.v.replace(/[′″]+$/, '')], pr = (k.v.match(/[′″]+$/) || [''])[0];
        const grupos = []; for (const c of ls) { if (/\p{M}/u.test(c) && grupos.length) grupos[grupos.length - 1] += c; else grupos.push(c); }
        return nodo(fila(grupos.map((c) => (c === '∞' ? '<mi>∞</mi>' : /^[Α-Ω]$/.test(c) ? `<mi mathvariant="normal">${c}</mi>` : `<mi>${escH(c)}</mi>`)).concat(pr ? [`<mo lspace="0" rspace="0">${pr}</mo>`] : [])));
      }
      const v = k.v;
      if (v === '(' || v === '[') { const c = v === '(' ? ')' : ']'; const xs = secuencia(c); if (es(c)) p++; const d = fila(xs), est = /<m(frac|sqrt|root)/.test(d) ? '' : ' stretchy="false"'; return nodo(`<mrow><mo${est}>${v}</mo>${d}<mo${est}>${c}</mo></mrow>`, d); }
      if (v === '{') { const xs = secuencia('}'); if (es('}')) p++; const d = fila(xs); return nodo(`<mrow>${d}</mrow>`, d); }
      if (v === '√') { const a = guiones(); return nodo(`<msqrt>${a.dentro ?? a.m}</msqrt>`); }
      if (v === '∛') { const a = guiones(); return nodo(`<mroot>${a.dentro ?? a.m}<mn>3</mn></mroot>`); }
      if (v === '\\{' || v === '\\}') return nodo(`<mo stretchy="false">${v[1]}</mo>`);
      if (v === '|') return nodo('<mo stretchy="false" lspace="0.05em" rspace="0.05em">|</mo>');
      if (v === '°' || v === '%' || v === '‰') return nodo(`<mi mathvariant="normal">${v}</mi>`);
      return nodo(`<mo>${escH(v)}</mo>`);
    }
    return fila(secuencia(null));
  }

  const mathml = (src) => `<math data-src="${escH(src).replace(/"/g, '&quot;')}"><mstyle displaystyle="true">${analiza(tokens(src))}</mstyle></math>`;
  function trozos(src) {
    const out = [];
    let ini = 0, nivel = 0, comillas = false;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (c === '"') comillas = !comillas;
      else if (comillas || src[i - 1] === '\\') continue;
      else if ('([{'.includes(c)) nivel++;
      else if (')]}'.includes(c)) nivel--;
      else if ((c === '=' || c === '⇒') && nivel === 0 && src.slice(ini, i).trim()) { out.push(src.slice(ini, i)); ini = i; }
    }
    return out.concat(src.slice(ini)).map((x) => x.trim()).filter(Boolean);
  }
  const html = (s, partir = false) => String(s ?? '').replace(/\$([^$]+)\$/g, (_, x) => (partir
    ? trozos(x).map((t, i) => (i ? mathml(t).replace(/^(<math[^>]*><mstyle[^>]*>(?:<mrow>)?)<mo>/, '$1<mo lspace="0">') : mathml(t))).join(' ')
    : mathml(x)));
  function pinta(raiz) { if (typeof document === 'undefined') return; for (const el of (raiz || document).querySelectorAll('.m:not([data-m])')) { el.dataset.m = '1'; el.innerHTML = html(el.innerHTML.includes('$') ? el.innerHTML : `$${el.innerHTML}$`); } }
  if (typeof document !== 'undefined') {
    const st = document.createElement('style');
    st.textContent = '@font-face { font-family: "STIX Two Math"; src: url(../../../fuentes/stix-two-math.woff2) format("woff2"); font-display: swap }\nmath { font-family: "STIX Two Math", "Cambria Math", math; font-size: 1.08em }\nmath mtext { font-family: "STIX Two Text", "STIX Two Math", serif }';
    document.head.appendChild(st);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => pinta()); else pinta();
  }
  return { html, mathml, pinta, tokens, nombreFn };
})();

