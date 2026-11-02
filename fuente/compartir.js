/* =====================================================================
   Compartir, copiar e imprimir (Matemáticas y Electromagnetismo; se pone
   con 'compartir.js' en los scripts de la herramienta en catalogo.js):
   · un enlace con los datos del ejercicio en la dirección (#d=…): al
     abrirlo, los datos se dejan donde la herramienta guarda los suyos
     (localStorage, la clave guarda de la página, que herramientas.js deja
     en Pagina.guarda) antes de que arranque, así que se
     abre con ellos sin que la herramienta tenga que saber nada;
   · copiar los resultados y el desarrollo como texto o como LaTeX (las
     fórmulas salen de su fuente, que Mates deja en data-src);
   · imprimir (o guardar en PDF) solo el ejercicio, sin menús ni teoría.
   Lee los resultados de #resumen o #res y el desarrollo de #pasos; en
   Magnetostática, cada pregunta con su resultado ([data-res]) y su
   desarrollo ([data-steps]);
   · un aviso de que log es el logaritmo decimal.
   Tiene que ir antes que el app.js de la herramienta.
   ===================================================================== */
const Compartir = (() => {
  const partes = () => (typeof location === 'undefined' ? '/herramienta/' : location.pathname).split('/').filter((q) => q && !/\.html?$/.test(q));
  const CLAVE = (typeof Pagina !== 'undefined' && Pagina.guarda) || `${partes().pop()}-v1`;
  const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const deB64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

  // los datos de un enlace compartido pasan a donde la herramienta los lee al arrancar
  if (typeof location !== 'undefined') {
    const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (m) {
      try { const json = deB64(m[1]); JSON.parse(json); localStorage.setItem(CLAVE, json); } catch (e) { /* enlace roto o sin almacenamiento */ }
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
    }
  }
  const enlace = () => { let d = null; try { d = localStorage.getItem(CLAVE); } catch (e) { /* sin almacenamiento */ } return location.href.split('#')[0] + (d ? `#d=${b64(d)}` : ''); };

  /* ---------- De la sintaxis de Mates a LaTeX y a texto ---------- */
  const FUNC = { sen: '\\operatorname{sen}', cos: '\\cos', tg: '\\operatorname{tg}', tan: '\\tan', ln: '\\ln', log: '\\log', exp: '\\exp', arcsen: '\\operatorname{arcsen}', arccos: '\\arccos', arctg: '\\operatorname{arctg}', 'máx': '\\max', 'mín': '\\min', 'lím': '\\lim', senh: '\\operatorname{senh}', cosh: '\\cosh', tgh: '\\operatorname{tgh}', cotg: '\\operatorname{cotg}', sec: '\\sec' };
  const SIM = { '·': '\\cdot', '×': '\\times', '÷': '\\div', '−': '-', '≤': '\\le', '≥': '\\ge', '≠': '\\ne', '≈': '\\approx', '±': '\\pm', '∓': '\\mp', '→': '\\to', '←': '\\leftarrow', '⇒': '\\Rightarrow', '⇔': '\\Leftrightarrow', '↔': '\\leftrightarrow', '∞': '\\infty', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint', '∯': '\\oiint', '∑': '\\sum', '∏': '\\prod', '∂': '\\partial', '∇': '\\nabla', '∈': '\\in', '∝': '\\propto', '⊥': '\\perp', '∥': '\\parallel', '≡': '\\equiv', '∼': '\\sim', '°': '^{\\circ}', '%': '\\%', '′': "'", '″': "''", '|': '|', '\\{': '\\{', '\\}': '\\}', 'ℒ': '\\mathcal{L}', '∅': '\\emptyset', '∪': '\\cup', '∩': '\\cap' };
  const GRIEGO = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'varepsilon', ζ: 'zeta', η: 'eta', θ: 'theta', ι: 'iota', κ: 'kappa', λ: 'lambda', μ: 'mu', ν: 'nu', ξ: 'xi', π: 'pi', ρ: 'rho', σ: 'sigma', τ: 'tau', υ: 'upsilon', φ: 'varphi', χ: 'chi', ψ: 'psi', ω: 'omega', Γ: 'Gamma', Δ: 'Delta', Θ: 'Theta', Λ: 'Lambda', Ξ: 'Xi', Π: 'Pi', Σ: 'Sigma', Φ: 'Phi', Ψ: 'Psi', Ω: 'Omega' };
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' }, SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function latex(src) {
    const tk = Mates.tokens(src);
    let p = 0;
    const es = (v) => tk[p] && tk[p].t === 's' && tk[p].v === v;
    // quita los paréntesis o las llaves de fuera si envuelven todo
    const quita = (s) => {
      let m = /^\\left\((.*)\\right\)$/.exec(s);
      if (m) return m[1];
      if (s[0] === '{' && s.endsWith('}')) { let d = 0; for (let i = 0; i < s.length; i++) { if (s[i] === '{' && s[i - 1] !== '\\') d++; else if (s[i] === '}' && s[i - 1] !== '\\') d--; if (d === 0 && i < s.length - 1) return s; } return s.slice(1, -1); }
      return s;
    };
    const palabra = (w) => {
      if (FUNC[w]) return FUNC[w] + ' ';
      return [...w].map((c) => (GRIEGO[c] ? `\\${GRIEGO[c]} ` : SUB[c] ? `_{${SUB[c]}}` : SUP[c] ? `^{${SUP[c]}}` : SIM[c] || c)).join('');
    };
    function secuencia(cierre) {
      const xs = [];
      while (p < tk.length && !(cierre && es(cierre))) {
        if (es(')') || es('}') || es(']')) { p++; continue; }
        xs.push(fraccion());
      }
      return xs.join(' ').replace(/\s+/g, ' ').trim();
    }
    function fraccion() {
      let a = guiones();
      while (es('/')) { p++; const b = guiones(); a = `\\frac{${quita(a)}}{${quita(b)}}`; }
      return a;
    }
    function argumento() {
      if (es('{')) { p++; const s = secuencia('}'); p++; return `{${s}}`; }
      if (es('-') || es('−')) { p++; return `{-${argumento().replace(/^\{|\}$/g, '')}}`; }
      if (es('(')) return `{${atomo()}}`;
      const k = tk[p];
      if (!k) return '{}';
      p++;
      if (k.t === 's') return `{${SIM[k.v] || k.v}}`;
      let v = k.v;
      while (tk[p] && !tk[p].sp && (tk[p].t === 'n' || tk[p].t === 'w')) { v += tk[p].v; p++; }
      return `{${palabra(v).trim()}}`;
    }
    function guiones() {
      let b = atomo();
      for (;;) {
        if (es('_')) { p++; b += `_${argumento()}`; } else if (es('^')) { p++; b += `^${argumento()}`; } else break;
      }
      return b;
    }
    function atomo() {
      const k = tk[p];
      if (!k) return '';
      p++;
      if (k.t === 'n') return k.v.replace(',', '{,}');
      if (k.t === 'x') return `\\text{${k.v}}`;
      if (k.t === 'w') return k.sp && p > 1 && /^d[a-zA-Zθφρ]$/.test(k.v) ? `\\, d${palabra(k.v[1])}` : palabra(k.v);
      const v = k.v;
      if (v === '(' || v === '[') { const c = v === '(' ? ')' : ']', s = secuencia(c); if (es(c)) p++; return v === '(' ? `\\left(${s}\\right)` : `\\left[${s}\\right]`; }
      if (v === '{') { const s = secuencia('}'); if (es('}')) p++; return `{${s}}`; }
      if (v === '√') return `\\sqrt{${quita(guiones()).replace(/^\{(.*)\}$/, '$1')}}`;
      if (v === '∛') return `\\sqrt[3]{${quita(guiones()).replace(/^\{(.*)\}$/, '$1')}}`;
      return SIM[v] || v;
    }
    return secuencia(null);
  }
  // texto plano: la fuente sin las llaves de agrupar
  function texto(src) {
    let s = String(src).replace(/<sup>(.*?)<\/sup>/g, '^($1)').replace(/<sub>(.*?)<\/sub>/g, '_$1').replace(/<[^>]+>/g, '').replace(/"/g, '').replace(/\\\{/g, '\u0001').replace(/\\\}/g, '\u0002');
    const simple = (a) => /^[\w.,′α-ωπ∂^−-]+$/.test(a) || /^\([^()]*\)$/.test(a);
    for (let i = 0, antes = ''; i < 12 && antes !== s; i++) {
      antes = s;
      s = s.replace(/([\^_])\{([^{}]*)\}/g, (_, o, a) => (/^[\w.,′α-ωπ−-]+$/.test(a) && a.length <= 3 ? `${o}${a}` : `${o}(${a})`));
      s = s.replace(/\{([^{}]*)\}\/\{([^{}]*)\}/g, (_, a, b) => `${simple(a) ? a : `(${a})`}/${simple(b) ? b : `(${b})`}`);
    }
    return s.replace(/[{}]/g, '').replace(/\u0001/g, '{').replace(/\u0002/g, '}');
  }

  /* ---------- El ejercicio como texto o como LaTeX ---------- */
  const escTex = (s) => s.replace(/\\/g, '\\textbackslash{}').replace(/([%#&_$])/g, '\\$1').replace(/[{}]/g, (c) => `\\${c}`);
  function lee(nodo, tex) {
    let out = '';
    for (const n of nodo.childNodes) {
      if (n.nodeType === 3) { out += tex ? escTex(n.nodeValue) : n.nodeValue; continue; }
      if (n.nodeType !== 1 || n.hidden) continue;
      const tag = n.tagName.toLowerCase();
      if (tag === 'math') { const s = n.getAttribute('data-src'); out += s ? (tex ? `$${latex(s)}$` : texto(s)) : n.textContent; continue; }
      if (tag === 'canvas' || tag === 'svg' || tag === 'button' || tag === 'select' || tag === 'input') continue;
      if (n.classList.contains('mat')) {
        const filas = [...n.querySelectorAll('tr')].map((tr) => [...tr.children].map((td) => lee(td, tex).trim()));
        const env = n.classList.contains('det') ? 'vmatrix' : 'pmatrix';
        out += tex ? `$\\begin{${env}} ${filas.map((f) => f.join(' & ').replace(/\$/g, '')).join(' \\\\ ')} \\end{${env}}$` : `${env === 'vmatrix' ? '|' : '['}${filas.map((f) => f.join('  ')).join('; ')}${env === 'vmatrix' ? '|' : ']'}`;
        continue;
      }
      if (n.classList.contains('fr') && n.children.length === 2) { const [a, b] = [...n.children].map((c) => lee(c, tex).trim().replace(/\$/g, '')); out += tex ? `$\\frac{${a}}{${b}}$` : `${/^[\w.,√−-]+$/.test(a) ? a : `(${a})`}/${/^[\w.,√−-]+$/.test(b) ? b : `(${b})`}`; continue; }
      if (tag === 'sup' || tag === 'sub') { const a = lee(n, tex).trim().replace(/\$/g, ''), o = tag === 'sup' ? '^' : '_'; out += tex ? `$${o}{${a}}$` : a.length > 1 ? `${o}(${a})` : `${o}${a}`; continue; }
      if (tag === 'br') { out += '\n'; continue; }
      const dentro = lee(n, tex);
      if (tex && (tag === 'b' || tag === 'strong')) out += `\\textbf{${dentro}}`;
      else if (tag === 'small') { const q = dentro.trim(); out += /^\(.*\)$/.test(q) ? ` ${q}` : ` (${q})`; }
      else if (tag === 'tr') out += '\n' + [...n.children].map((c) => lee(c, tex).trim()).join(tex ? ' & ' : ' | ');
      else if (['div', 'p', 'li', 'table', 'ol', 'ul'].includes(tag)) out += `\n${dentro}\n`;
      else out += dentro;
    }
    return out;
  }
  const limpia = (s) => s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  // cada fila de resultados «<span>nombre</span> valor» sale como «nombre: valor»
  const fila = (d, tex) => { const sp = d.querySelector(':scope > span'); if (!sp) return limpia(lee(d, tex)); const c = d.cloneNode(true); c.querySelector(':scope > span').remove(); return `${limpia(lee(sp, tex))}: ${limpia(lee(c, tex))}`; };
  const filas = (res, tex) => { const ds = [...res.children].filter((d) => !d.hidden && d.tagName === 'DIV' && d.querySelector(':scope > span')); return ds.length ? ds.map((d) => fila(d, tex)) : [limpia(lee(res, tex))].filter(Boolean); };
  // bloques { titulo, items, pasos }: uno en las herramientas normales y uno por pregunta en Magnetostática
  function bloques(tex) {
    const preguntas = [...document.querySelectorAll('[data-res]')];
    if (preguntas.length) return preguntas.map((r, i) => { const p = r.closest('.pieza'), nom = p && p.querySelector('.badge'), st = document.querySelector(`[data-steps="${r.dataset.res}"] ol`); return { titulo: nom ? nom.textContent : `Pregunta ${i + 1}`, items: [limpia(lee(r, tex))], pasos: st ? [...st.children] : [] }; });
    const res = document.querySelector('#resumen') || document.querySelector('#res');
    const vis = (e) => !e.hidden && e.offsetParent !== null;
    // herramientas con varias pestañas o resultados repartidos: lo visible de .resumen, .valores y .resultado
    const grupos = res && !res.querySelector(':scope > div > span') ? [...res.querySelectorAll('.resumen')] : res ? [] : [...document.querySelectorAll('.resumen, .valores, .resultado')].filter(vis);
    // resultados repartidos en varias capas (Configuración electrónica): cada «etiqueta valor» visible de lo más hondo
    const hojas = res && !grupos.length && filas(res, tex).length < 2 ? [...res.querySelectorAll('div')].filter((d) => d.querySelector(':scope > span') && vis(d) && !d.querySelector('div > span')) : [];
    // listas de definición («dt» etiqueta, «dd» valor): una línea por pareja, con el título de la tarjeta delante
    const dl = res && res.querySelector('dl');
    const parejas = dl ? [...dl.querySelectorAll('dt')].filter((t) => t.nextElementSibling && t.nextElementSibling.tagName === 'DD' && vis(t.nextElementSibling)).map((t) => `${limpia(lee(t, tex))}: ${limpia(lee(t.nextElementSibling, tex))}`) : [];
    const cab = dl && res.querySelector('.cab'), tituloDl = cab ? limpia(lee(cab, tex)).replace(/\n+/g, ' · ') : '';
    const items = parejas.length > 1 ? [...(tituloDl ? [tituloDl] : []), ...parejas] : hojas.length ? hojas.map((d) => fila(d, tex)) : grupos.length ? grupos.flatMap((g) => (g.classList.contains('resultado') ? [limpia(lee(g, tex))].filter(Boolean) : filas(g, tex))) : res ? filas(res, tex) : [];
    const pasos = document.querySelector('#pasos') ? [...document.querySelectorAll('#pasos > li')] : [...document.querySelectorAll('.card.pasos ol')].filter(vis).flatMap((ol) => [...ol.children]);
    const tb = document.querySelector('#tabla table');
    return [{ titulo: '', items, pasos, tabla: tb && vis(tb) ? tb : null }];
  }
  // la tabla para pegar en una hoja de cálculo: columnas con tabulador
  const tablaTSV = () => { const tb = document.querySelector('#tabla table'); return tb ? [...tb.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => limpia(lee(c, false)).replace(/\s*\n+\s*/g, ' ')).join('\t')).join('\n') : ''; };
  function ejercicio(tex) {
    const tit = (document.querySelector('h1') || {}).textContent || document.title;
    const paso = (li) => { const t = li.querySelector('strong, .st-h'), c = li.cloneNode(true), ct = c.querySelector('strong, .st-h'); if (ct) ct.remove(); return { t: t ? limpia(lee(t, tex)) : '', c: limpia(lee(c, tex)).replace(/\n+/g, tex ? ' \\\\ ' : '\n   ') }; };
    const bs = bloques(tex);
    const tabla = (b) => (b.tabla ? [...b.tabla.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => limpia(lee(c, tex)).replace(/\n+/g, ' ').replace(/\|/g, '/'))) : null);
    if (!tex) return [tit, ...bs.flatMap((b) => ['', ...(b.titulo ? [b.titulo] : []), ...(b.items.length ? ['Resultados', ...b.items.map((q) => `· ${q.replace(/\n+/g, '; ')}`)] : []), ...(b.pasos.length ? ['', 'Desarrollo', ...b.pasos.map((li, i) => { const q = paso(li); return `${i + 1}. ${q.t}${q.t ? ': ' : ''}${q.c}`; })] : []), ...(b.tabla ? ['', 'Tabla', ...tabla(b).map((f) => f.join(' | '))] : [])]), '', enlace()].join('\n');
    return [`% ${tit} · Ciencify`, `% ${enlace()}`, ...bs.flatMap((b) => { const sec = b.titulo ? '\\subsection*' : '\\section*'; return [...(b.titulo ? [`\\section*{${escTex(b.titulo)}}`] : []), ...(b.items.length ? [`${sec}{Resultados}`, '\\begin{itemize}', ...b.items.map((q) => `  \\item ${q.replace(/\n+/g, '; ')}`), '\\end{itemize}'] : []), ...(b.pasos.length ? [`${sec}{Desarrollo}`, '\\begin{enumerate}', ...b.pasos.map((li) => { const q = paso(li); return `  \\item ${q.t ? `\\textbf{${q.t}.} ` : ''}${q.c}`; }), '\\end{enumerate}'] : []), ...(b.tabla ? ((f) => [`${sec}{Tabla}`, `\\begin{tabular}{l${'r'.repeat(Math.max(0, Math.max(...f.map((x) => x.length)) - 1))}}`, '\\hline', ...f.map((x) => `${x.join(' & ')} \\\\`), '\\hline', '\\end{tabular}'])(tabla(b)) : [])]; })].join('\n');
  }

  /* ---------- Botones ---------- */
  async function copia(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (e) {
      const t = document.createElement('textarea'); t.value = s; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* sin portapapeles */ }
      t.remove(); return ok;
    }
  }
  function botones() {
    if (typeof document === 'undefined') return;
    // en la tarjeta del desarrollo (en Magnetostática, en la de las preguntas)
    const card = document.querySelector('#pasos') ? document.querySelector('#pasos').closest('.card') : document.querySelector('#preguntas') && document.querySelector('#preguntas').closest('.panel');
    // sin tarjeta de desarrollo única (varias pestañas o solo resultados): debajo de la frase de presentación
    const lead = !card && document.querySelector('.wrap > .lead');
    if ((!card && !lead) || document.querySelector('.compartir')) return;
    const caja = document.createElement('div');
    caja.className = 'controles compartir';
    caja.innerHTML = '<button class="btn" type="button" data-a="enlace">Copiar enlace</button><button class="btn" type="button" data-a="texto">Copiar como texto</button><button class="btn" type="button" data-a="latex">Copiar en LaTeX</button><button class="btn" type="button" data-a="imprimir">Imprimir o PDF</button>' + (document.querySelector('#tabla') ? '<button class="btn" type="button" data-a="tabla">Copiar tabla</button>' : '');
    caja.style.margin = '0 0 10px';
    if (card) card.querySelector('h2').after(caja); else lead.after(caja);
    caja.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'imprimir') { window.print(); return; }
      const ok = await copia(a === 'enlace' ? enlace() : a === 'tabla' ? tablaTSV() : ejercicio(a === 'latex'));
      const antes = b.textContent; b.textContent = ok ? '¡Copiado!' : 'No se ha podido copiar'; setTimeout(() => { b.textContent = antes; }, 1600);
    });
    // al imprimir: solo el ejercicio, en claro
    const css = document.createElement('style');
    css.textContent = '@media print { .top, .miga, .bib, .bib-scrim, footer, .teoria, .compartir, #ejemplos, .controles, .nota:empty, .error[hidden] { display: none !important } html, body { background: #fff !important } .wrap { max-width: none; padding: 0 } .layout { display: block !important } .card { break-inside: avoid; box-shadow: none !important } .pasos li { break-inside: avoid } canvas { max-height: 9cm; object-fit: contain } .chips, .stage-bar, .x, .tools { display: none !important } .cvwrap { height: 9cm !important; min-height: 0 !important } }';
    document.head.appendChild(css);
    // en claro y con los desarrollos plegados abiertos
    let tema = null, cerrados = [];
    addEventListener('beforeprint', () => { tema = document.documentElement.getAttribute('data-theme'); document.documentElement.setAttribute('data-theme', 'light'); cerrados = [...document.querySelectorAll('details:not([open])')]; cerrados.forEach((d) => { d.open = true; }); dispatchEvent(new Event('resize')); });
    addEventListener('afterprint', () => { if (tema === null) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', tema); cerrados.forEach((d) => { d.open = false; }); dispatchEvent(new Event('resize')); });
    // log es el decimal
    const err = document.querySelector('#error');
    if (err && ['taylor', 'fourier', 'edos', 'laplace', 'derivadas', 'campos'].includes(CLAVE.slice(0, -3))) { const q = document.createElement('p'); q.className = 'nota'; q.id = 'nota-log'; q.textContent = 'ln es el logaritmo neperiano y log, el decimal (log₁₀).'; err.before(q); }
  }
  botones();
  return { enlace, ejercicio, tablaTSV, latex, texto, CLAVE };
})();
if (typeof module !== 'undefined') module.exports = Compartir;
