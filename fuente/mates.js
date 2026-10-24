/* =====================================================================
   Fórmulas en MathML a partir de una sintaxis sencilla (sin DOM salvo
   Mates.pinta). En los textos, lo que va entre $…$ es una fórmula:
     a/b            fracción (los paréntesis de fuera se quitan)
     x^2, e^{−bt/m} exponente; v_0x, E_{c,máx} subíndice
     √(…), ∛(…)     raíz
     "m/s"          texto tal cual (unidades, palabras)
     sen cos tg ln log exp máx mín   funciones; binom(n, k)
   Una palabra que no es una función se lee letra a letra (mgh = m·g·h).
   También acepta <sup>, <sub> y las etiquetas que devuelve f().
   ===================================================================== */
const Mates = (() => {
  const FUNC = new Set(['sen', 'cos', 'tg', 'tan', 'ln', 'log', 'exp', 'arcsen', 'arccos', 'arctg', 'máx', 'mín', 'lím', 'senh', 'cosh', 'tgh']);
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
      if ((m = resto.match(/^\d+(?:[.,]\d+)?/))) out.push({ t: 'n', v: m[0].replace('.', ','), sp });
      else if (c === '"') { const j = s.indexOf('"', i + 1); m = [s.slice(i, j < 0 ? s.length : j + 1)]; out.push({ t: 'x', v: m[0].replace(/"/g, ''), sp }); }
      else if ((m = resto.match(/^[\p{L}\p{M}∞]+[′″]*/u))) out.push({ t: 'w', v: m[0], sp });
      else { m = [c]; out.push({ t: 's', v: c, sp }); }
      i += m[0].length; sp = false;
    }
    return out;
  }

  // nodo: { m: MathML, dentro: MathML sin los paréntesis de fuera (o null) }
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
        if (k.t === 's' && OPS.includes(k.v)) {
          p++;
          const v = k.v === '-' ? '−' : k.v;
          // un signo detrás de otro operador (o al principio) es de número: = −19,28
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
      // una racha de letras y números pegados: 0x, máx, 12
      const k = ver();
      if (!k) return '<mrow></mrow>';
      if (k.t === 's') { p++; return `<mo>${escH(k.v)}</mo>`; }
      let v = k.v; p++;
      while (ver() && !ver().sp && (ver().t === 'n' || ver().t === 'w')) { v += ver().v; p++; }
      return letra(v);
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
      if (k.t === 'x') return nodo(`${k.sp && p > 1 ? '<mspace width="0.3em"></mspace>' : ''}<mtext>${escH(k.v)}</mtext>`);
      if (k.t === 'w') {
        // binom(n, k): número combinatorio
        if (k.v === 'binom' && es('(')) { p++; const a = secuencia(','); p++; const b = secuencia(')'); p++; return nodo(`<mrow><mo>(</mo><mfrac linethickness="0">${fila(a)}${fila(b)}</mfrac><mo>)</mo></mrow>`); }
        if (FUNC.has(k.v)) { let m = `<mi mathvariant="normal">${k.v}</mi>`; if (es('^')) { p++; m = `<msup>${m}${argumento()}</msup>`; } return nodo(`<mspace width="0.17em"></mspace>${m}<mo>&#x2061;</mo><mspace width="0.12em"></mspace>`); }
        const ls = [...k.v.replace(/[′″]+$/, '')], pr = (k.v.match(/[′″]+$/) || [''])[0];
        // las marcas combinadas (î, ĵ con acento) van con su letra
        const grupos = []; for (const c of ls) { if (/\p{M}/u.test(c) && grupos.length) grupos[grupos.length - 1] += c; else grupos.push(c); }
        // las mayúsculas griegas (Δ, Σ, Φ, Ω) van rectas, como en los libros
        return nodo(fila(grupos.map((c) => (c === '∞' ? '<mi>∞</mi>' : /^[Α-Ω]$/.test(c) ? `<mi mathvariant="normal">${c}</mi>` : `<mi>${escH(c)}</mi>`)).concat(pr ? [`<mo lspace="0" rspace="0">${pr}</mo>`] : [])));
      }
      const v = k.v;
      if (v === '(' || v === '[') { const c = v === '(' ? ')' : ']'; const xs = secuencia(c); if (es(c)) p++; const d = fila(xs), est = /<m(frac|sqrt|root)/.test(d) ? '' : ' stretchy="false"'; return nodo(`<mrow><mo${est}>${v}</mo>${d}<mo${est}>${c}</mo></mrow>`, d); }
      if (v === '{') { const xs = secuencia('}'); if (es('}')) p++; const d = fila(xs); return nodo(`<mrow>${d}</mrow>`, d); }
      if (v === '√') { const a = guiones(); return nodo(`<msqrt>${a.dentro ?? a.m}</msqrt>`); }
      if (v === '∛') { const a = guiones(); return nodo(`<mroot>${a.dentro ?? a.m}<mn>3</mn></mroot>`); }
      if (v === '|') return nodo('<mo stretchy="false" lspace="0.05em" rspace="0.05em">|</mo>');
      if (v === '°' || v === '%' || v === '‰') return nodo(`<mi mathvariant="normal">${v}</mi>`);
      return nodo(`<mo>${escH(v)}</mo>`);
    }
    return fila(secuencia(null));
  }

  const mathml = (src) => `<math><mstyle displaystyle="true">${analiza(tokens(src))}</mstyle></math>`;
  // sustituye cada $…$ de un texto HTML por su MathML
  const html = (s) => String(s ?? '').replace(/\$([^$]+)\$/g, (_, x) => mathml(x));
  // convierte en el documento los elementos con class="m" (fórmulas escritas en el HTML)
  function pinta(raiz) { if (typeof document === 'undefined') return; for (const el of (raiz || document).querySelectorAll('.m:not([data-m])')) { el.dataset.m = '1'; el.innerHTML = html(el.innerHTML.includes('$') ? el.innerHTML : `$${el.innerHTML}$`); } }
  if (typeof document !== 'undefined') {
    const st = document.createElement('style');
    st.textContent = '@font-face { font-family: "STIX Two Math"; src: url(../../fuentes/stix-two-math.woff2) format("woff2"); font-display: swap }\nmath { font-family: "STIX Two Math", "Cambria Math", math; font-size: 1.08em }\nmath mtext { font-family: "STIX Two Text", "STIX Two Math", serif }';
    document.head.appendChild(st);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => pinta()); else pinta();
  }
  return { html, mathml, pinta, tokens };
})();
if (typeof module !== 'undefined') module.exports = Mates;
