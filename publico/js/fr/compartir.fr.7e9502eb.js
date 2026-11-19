const Compartir = (() => {
  const partes = () => (typeof location === 'undefined' ? '/herramienta/' : location.pathname).split('/').filter((q) => q && !/\.html?$/.test(q));
  const CLAVE = (typeof Pagina !== 'undefined' && Pagina.guarda) || `${partes().pop()}-v1`;
  const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const deB64 = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

  if (typeof location !== 'undefined') {
    const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (m) {
      try { const json = deB64(m[1]); JSON.parse(json); localStorage.setItem(CLAVE, json); } catch (e) { /* enlace roto o sin almacenamiento */ }
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
    }
  }
  const enlace = () => { let d = null; try { window.dispatchEvent(new Event('simu-guardar')); d = localStorage.getItem(CLAVE); } catch (e) { /* sin almacenamiento */ } return location.href.split('#')[0] + (d ? `#d=${b64(d)}` : ''); };

  const FUNC = { sen: '\\operatorname{sen}', cos: '\\cos', tg: '\\operatorname{tg}', tan: '\\tan', ln: '\\ln', log: '\\log', exp: '\\exp', arcsen: '\\operatorname{arcsen}', arccos: '\\arccos', arctg: '\\operatorname{arctg}', 'max': '\\max', 'min': '\\min', 'lim': '\\lim', senh: '\\operatorname{senh}', cosh: '\\cosh', tgh: '\\operatorname{tgh}', cotg: '\\operatorname{cotg}', sec: '\\sec' };
  const SIM = { '·': '\\cdot', '×': '\\times', '÷': '\\div', '−': '-', '≤': '\\le', '≥': '\\ge', '≠': '\\ne', '≈': '\\approx', '±': '\\pm', '∓': '\\mp', '→': '\\to', '←': '\\leftarrow', '⇒': '\\Rightarrow', '⇔': '\\Leftrightarrow', '↔': '\\leftrightarrow', '∞': '\\infty', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint', '∯': '\\oiint', '∑': '\\sum', '∏': '\\prod', '∂': '\\partial', '∇': '\\nabla', '∈': '\\in', '∝': '\\propto', '⊥': '\\perp', '∥': '\\parallel', '≡': '\\equiv', '∼': '\\sim', '°': '^{\\circ}', '%': '\\%', '′': "'", '″': "''", '|': '|', '\\{': '\\{', '\\}': '\\}', 'ℒ': '\\mathcal{L}', '∅': '\\emptyset', '∪': '\\cup', '∩': '\\cap' };
  const GRIEGO = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'varepsilon', ζ: 'zeta', η: 'eta', θ: 'theta', ι: 'iota', κ: 'kappa', λ: 'lambda', μ: 'mu', ν: 'nu', ξ: 'xi', π: 'pi', ρ: 'rho', σ: 'sigma', τ: 'tau', υ: 'upsilon', φ: 'varphi', χ: 'chi', ψ: 'psi', ω: 'omega', Γ: 'Gamma', Δ: 'Delta', Θ: 'Theta', Λ: 'Lambda', Ξ: 'Xi', Π: 'Pi', Σ: 'Sigma', Φ: 'Phi', Ψ: 'Psi', Ω: 'Omega' };
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' }, SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function latex(src) {
    const tk = Mates.tokens(src);
    let p = 0;
    const es = (v) => tk[p] && tk[p].t === 's' && tk[p].v === v;
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
  const fila = (d, tex) => { const sp = d.querySelector(':scope > span'); if (!sp) return limpia(lee(d, tex)); const c = d.cloneNode(true); c.querySelector(':scope > span').remove(); return `${limpia(lee(sp, tex))}: ${limpia(lee(c, tex))}`; };
  const filas = (res, tex) => { const ds = [...res.children].filter((d) => !d.hidden && d.tagName === 'DIV' && d.querySelector(':scope > span')); return ds.length ? ds.map((d) => fila(d, tex)) : [limpia(lee(res, tex))].filter(Boolean); };
  function bloques(tex) {
    const preguntas = [...document.querySelectorAll('[data-res]')];
    if (preguntas.length) return preguntas.map((r, i) => { const p = r.closest('.pieza'), nom = p && p.querySelector('.badge'), st = document.querySelector(`[data-steps="${r.dataset.res}"] ol`); return { titulo: nom ? nom.textContent : `Question ${i + 1}`, items: [limpia(lee(r, tex))], pasos: st ? [...st.children] : [] }; });
    const res = document.querySelector('#resumen') || document.querySelector('#res');
    const vis = (e) => !e.hidden && e.offsetParent !== null;
    const grupos = res && !res.querySelector(':scope > div > span') ? [...res.querySelectorAll('.resumen')] : res ? [] : [...document.querySelectorAll('.resumen, .valores, .resultado')].filter(vis);
    const hojas = res && !grupos.length && filas(res, tex).length < 2 ? [...res.querySelectorAll('div')].filter((d) => d.querySelector(':scope > span') && vis(d) && !d.querySelector('div > span')) : [];
    const dl = res && res.querySelector('dl');
    const parejas = dl ? [...dl.querySelectorAll('dt')].filter((t) => t.nextElementSibling && t.nextElementSibling.tagName === 'DD' && vis(t.nextElementSibling)).map((t) => `${limpia(lee(t, tex))}: ${limpia(lee(t.nextElementSibling, tex))}`) : [];
    const cab = dl && res.querySelector('.cab'), tituloDl = cab ? limpia(lee(cab, tex)).replace(/\n+/g, ' · ') : '';
    const items = parejas.length > 1 ? [...(tituloDl ? [tituloDl] : []), ...parejas] : hojas.length ? hojas.map((d) => fila(d, tex)) : grupos.length ? grupos.flatMap((g) => (g.classList.contains('resultado') ? [limpia(lee(g, tex))].filter(Boolean) : filas(g, tex))) : res ? filas(res, tex) : [];
    const pasos = document.querySelector('#pasos') ? [...document.querySelectorAll('#pasos > li')] : [...document.querySelectorAll('.card.pasos ol')].filter(vis).flatMap((ol) => [...ol.children]);
    const tb = document.querySelector('#tabla table');
    return [{ titulo: '', items, pasos, tabla: tb && vis(tb) ? tb : null }];
  }
  const tablaTSV = () => { const tb = document.querySelector('#tabla table'); return tb ? [...tb.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => limpia(lee(c, false)).replace(/\s*\n+\s*/g, ' ')).join('\t')).join('\n') : ''; };
  function ejercicio(tex) {
    const tit = (document.querySelector('h1') || {}).textContent || document.title;
    const paso = (li) => { const t = li.querySelector('strong, .st-h'), c = li.cloneNode(true), ct = c.querySelector('strong, .st-h'); if (ct) ct.remove(); return { t: t ? limpia(lee(t, tex)) : '', c: limpia(lee(c, tex)).replace(/\n+/g, tex ? ' \\\\ ' : '\n   ') }; };
    const bs = bloques(tex);
    const tabla = (b) => (b.tabla ? [...b.tabla.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => limpia(lee(c, tex)).replace(/\n+/g, ' ').replace(/\|/g, '/'))) : null);
    const enun = (window.EnunciadoApp?.texto || '').trim();
    if (!tex) return [tit, ...(enun ? ['', 'Énoncé', enun] : []), ...bs.flatMap((b) => ['', ...(b.titulo ? [b.titulo] : []), ...(b.items.length ? ['Résultats', ...b.items.map((q) => `· ${q.replace(/\n+/g, '; ')}`)] : []), ...(b.pasos.length ? ['', 'Développement', ...b.pasos.map((li, i) => { const q = paso(li); return `${i + 1}. ${q.t}${q.t ? ': ' : ''}${q.c}`; })] : []), ...(b.tabla ? ['', 'Tableau', ...tabla(b).map((f) => f.join(' | '))] : [])]), '', enlace()].join('\n');
    return [`% ${tit} · Ciencify`, `% ${enlace()}`, ...(enun ? ['\\section*{Enunciado}', enun.split('$').map((t, i) => (i % 2 && typeof Mates !== 'undefined' ? `$${latex(t)}$` : i % 2 ? `$${escTex(t)}$` : escTex(t).replace(/\n/g, ' \\\\ '))).join('')] : []), ...bs.flatMap((b) => { const sec = b.titulo ? '\\subsection*' : '\\section*'; return [...(b.titulo ? [`\\section*{${escTex(b.titulo)}}`] : []), ...(b.items.length ? [`${sec}{Resultados}`, '\\begin{itemize}', ...b.items.map((q) => `  \\item ${q.replace(/\n+/g, '; ')}`), '\\end{itemize}'] : []), ...(b.pasos.length ? [`${sec}{Desarrollo}`, '\\begin{enumerate}', ...b.pasos.map((li) => { const q = paso(li); return `  \\item ${q.t ? `\\textbf{${q.t}.} ` : ''}${q.c}`; }), '\\end{enumerate}'] : []), ...(b.tabla ? ((f) => [`${sec}{Tabla}`, `\\begin{tabular}{l${'r'.repeat(Math.max(0, Math.max(...f.map((x) => x.length)) - 1))}}`, '\\hline', ...f.map((x) => `${x.join(' & ')} \\\\`), '\\hline', '\\end{tabular}'])(tabla(b)) : [])]; })].join('\n');
  }

  async function copia(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (e) {
      const t = document.createElement('textarea'); t.value = s; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* sin portapapeles */ }
      t.remove(); return ok;
    }
  }
  function botones() {
    if (typeof document === 'undefined') return;
    const card = document.querySelector('#pasos') ? document.querySelector('#pasos').closest('.card') : document.querySelector('#preguntas') && document.querySelector('#preguntas').closest('.panel');
    const lead = !card && document.querySelector('.wrap > .lead');
    if ((!card && !lead) || document.querySelector('.compartir')) return;
    const caja = document.createElement('div');
    caja.className = 'controles compartir';
    caja.innerHTML = '<button class="btn" type="button" data-a="enlace">Copier le lien</button><button class="btn" type="button" data-a="texto">Copier en texte</button><button class="btn" type="button" data-a="latex">Copier en LaTeX</button><button class="btn" type="button" data-a="imprimir">Imprimer ou PDF</button>' + (document.querySelector('#tabla') ? '<button class="btn" type="button" data-a="tabla">Copier le tableau</button>' : '');
    caja.style.margin = '0 0 10px';
    if (card) card.querySelector('h2').after(caja); else lead.after(caja);
    caja.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'imprimir') { window.print(); return; }
      const ok = await copia(a === 'enlace' ? enlace() : a === 'tabla' ? tablaTSV() : ejercicio(a === 'latex'));
      const antes = b.textContent; b.textContent = ok ? 'Copié !' : 'Impossible de copier'; setTimeout(() => { b.textContent = antes; }, 1600);
    });
    const err = document.querySelector('#error');
    if (err && ['taylor', 'fourier', 'edos', 'laplace', 'derivadas', 'campos'].includes(CLAVE.slice(0, -3))) { const q = document.createElement('p'); q.className = 'nota'; q.id = 'nota-log'; q.textContent = 'ln est le logarithme népérien et log, le logarithme décimal (log₁₀).'; err.before(q); }
  }
  botones();
  return { enlace, ejercicio, tablaTSV, latex, texto, CLAVE };
})();

