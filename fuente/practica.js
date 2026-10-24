/* =====================================================================
   Modo práctica común a todas las herramientas. «Otro ejercicio» parte de
   un ejemplo al azar y cambia sus datos numéricos (con la misma forma de
   número: enteros pequeños, ángulos, probabilidades…), tapa los resultados
   y el desarrollo, y pide al alumno los resultados principales, con un
   hueco por cada número de lo que la herramienta escribiría. «Comprobar»
   los corrige (1 % o la última cifra mostrada) y «Ver la solución» destapa
   el desarrollo. Al salir se vuelve a los datos que había antes.
   Lee de la página lo que ya calcula cada app: no repite ninguna física.
   ===================================================================== */
const Practica = (() => {
  const azar = (a, b) => a + Math.random() * (b - a), entero = (a, b) => Math.floor(azar(a, b + 1));
  const toma = (xs) => xs[Math.floor(Math.random() * xs.length)];
  const visible = (e) => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length) && !e.closest('[hidden]');
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // lo que cambia de una herramienta a otra; lo demás sale de la estructura común de las páginas
  const CONF = {
    calorimetria: { items: '#te' },
    disoluciones: { items: '#valores > .valor:not(.dato)' },
    matrices: { items: '#res' },
    // solo sistemas compatibles determinados: la solución paramétrica no se pregunta por huecos
    // complejos: una operación al azar con números pequeños (los datos son textos como 3 − 2i)
    // taylor: una función y un punto de los de clase; se preguntan los coeficientes, la aproximación y el error
    taylor: { datos: null, items: '#resumen > div.num', genera: () => window.TaylorApp?.azar(), enunciado: () => window.TaylorApp?.enunciado() },
    // fourier: una función de las de clase; se preguntan a₀ y los primeros coeficientes
    fourier: { datos: null, items: '#resumen > div.num', genera: () => window.FourierApp?.azar(), enunciado: () => window.FourierApp?.enunciado() },
    // edos: una ecuación de las de clase (Euler, segundo orden o sistema lineal); se preguntan los valores numéricos
    edos: { datos: null, items: '#resumen > div.num', genera: () => window.EDOsApp?.azar(), enunciado: () => window.EDOsApp?.enunciado() },
    // cinetica: un ejercicio de los de clase (ley integrada, datos, velocidades iniciales o Arrhenius)
    cinetica: { datos: null, items: '#resumen > div.num', genera: () => window.CineticaApp?.azar(), enunciado: () => window.CineticaApp?.enunciado() },
    // campos: gradiente, divergencia y rotacional, trabajo o Green con números enteros; se preguntan los valores decimales
    campos: { datos: null, items: '#resumen > div.num', genera: () => window.CamposApp?.azar(), enunciado: () => window.CamposApp?.enunciado() },
    // fuerza: una carga, unos vectores, un selector, un ciclotrón o unos hilos con números de clase
    fuerza: { datos: null, items: '#res > div', genera: () => window.FuerzaApp?.azar(), enunciado: () => window.FuerzaApp?.enunciado() },
    // transitorios: un RC, un RL o un RLC con valores de clase
    transitorios: { datos: null, items: '#res > div', genera: () => window.TransitoriosApp?.azar(), enunciado: () => window.TransitoriosApp?.enunciado() },
    complejos: { datos: null, genera: () => window.ComplejosApp?.azar(), enunciado: () => window.ComplejosApp?.enunciado() },
    sistemas: { items: '#res', valido: () => !/[λμ]|incompatible|no tiene/i.test(document.querySelector('#res')?.textContent + document.querySelector('#tipo')?.textContent) },
    estadistica: { items: '#res' },
    // regresión: una tabla de datos al azar alrededor de una recta (están en un textarea, no en campos numéricos)
    regresion: { datos: null, genera: () => window.RegresionApp?.azar(), enunciado: () => 'Con los datos de la tabla, calcula la recta de regresión de Y sobre X, la de X sobre Y, el coeficiente de correlación, las medias, la covarianza y la estimación de y que se pide.' },
    // resistencias: unos colores al azar (no hay números que cambiar en los datos)
    resistencias: { datos: null, genera: () => window.ResistenciasApp?.azar(), enunciado: () => `¿Cuánto vale una resistencia con las bandas <b>${esc(window.ResistenciasApp?.colores() || '')}</b>? Escribe el valor y el margen en el que puede estar en las mismas unidades.` },
    magnetostatica: { items: '[data-res]', tapa: '[data-res], [data-steps], .cvwrap', datos: '#fuentes',
      // el enunciado del ejemplo ya no vale con los datos nuevos
      despues: () => pon(document.querySelector('#enunciado'), 'Ejercicio de práctica: calcula el campo magnético en los puntos de las preguntas con las fuentes de la izquierda.'),
      antes: () => { const m = document.querySelector('#modo'); if (m && m.value !== 'si') { m.value = 'si'; m.dispatchEvent(new Event('change', { bubbles: true })); } } },
    'masa-molar': {
      items: '#res-masa .grande', quitar: '', tapa: '#res-masa, #conv-card', datos: null,
      genera: () => pon(document.querySelector('#formula'), toma(['H2O', 'CO2', 'NaCl', 'H2SO4', 'HNO3', 'NaOH', 'NH3', 'CaCO3', 'C6H12O6', 'C2H5OH', 'Ca(OH)2', 'Al2(SO4)3', 'KMnO4', 'Fe2O3', 'Mg3(PO4)2', 'CuSO4·5H2O', 'Na2CO3', 'K2Cr2O7', 'CH4', 'C3H8', 'HCl', 'Ba(NO3)2', 'NH4Cl', 'MgCl2·6H2O'])),
      enunciado: () => `Calcula la masa molar de <b>${esc(document.querySelector('#formula').value)}</b>.`,
    },
    'configuracion-electronica': {
      items: null, tapa: '#res', datos: null,
      genera: () => pon(document.querySelector('#entrada'), String(entero(1, 56))),
      enunciado: () => { const g = (s) => document.querySelector(s)?.textContent.trim() || ''; return `Escribe la configuración electrónica del <b>${esc(g('#nombre').toLowerCase())}</b> (${esc(g('#sim'))}, Z = ${esc(g('#z'))}) en orden de llenado y cuántos electrones desapareados tiene.`; },
      textos: [{ et: 'Configuración electrónica', sel: '#llenado', otros: ['#abreviada', '#capas-txt'] }],
      numeros: [{ et: 'Electrones desapareados', sel: '#desap' }],
    },
  };

  function pon(el, v) {
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const lee = (s) => { const t = String(s).trim().replace(/\s+/g, '').replace(/[−–]/g, '-'); return /^-?\d+(,\d+)?$/.test(t) || /^-?\d*\.\d+$/.test(t) ? parseFloat(t.replace(',', '.')) : null; };
  const escribe = (x, como) => (como.includes(',') || !Number.isInteger(x) ? String(x).replace('.', ',') : String(x));
  const redondea = (x, cifras) => { if (x === 0) return 0; const e = Math.floor(Math.log10(Math.abs(x))) - cifras + 1; return Math.round(x / 10 ** e) * 10 ** e; };
  const limpio = (x) => parseFloat(x.toPrecision(12));

  // un dato numérico nuevo, del mismo tipo que el que había
  function otroValor(v, etiqueta, texto) {
    if (v === 0) return 0;
    const ang = /°|ángulo|grados|α|θ|φ/i.test(etiqueta), s = Math.sign(v), a = Math.abs(v);
    if (Number.isInteger(v) && !texto.includes(',') && a <= 12) return s * entero(Math.max(1, Math.round(a * 0.5)), Math.round(a * 1.5) + 1);
    if (ang && a > 0 && a < 90) return s * Math.round(azar(Math.max(5, a * 0.6), Math.min(85, a * 1.4)));
    if (a > 0 && a < 1) return limpio(s * Math.min(0.98, Math.max(0.02, redondea(a * azar(0.6, 1.5), 2))));
    const dec = (texto.split(',')[1] || '').length, cifras = Math.max(2, String(Math.round(a * 10 ** dec)).replace(/^0+/, '').length);
    return limpio(s * redondea(a * azar(0.6, 1.5), Math.min(3, cifras)));
  }
  const etiquetaDe = (inp) => [inp.getAttribute('aria-label'), inp.id && document.querySelector(`label[for="${inp.id}"]`)?.textContent, inp.closest('label')?.textContent, inp.closest('.row, .fila')?.textContent].filter(Boolean).join(' ');

  // los números de un resultado: la plantilla con un hueco por número y su valor (los de sub/sup, fórmulas y notas no cuentan)
  // (también el número de la parte imaginaria, j31, y el decimal con punto de magnetostática)
  const RE = /(?:(?<![\p{L}\d,.])|(?<=(?:^|[^\p{L}\d])j))([−-]?\d+(?:[.,]\d+)?(?:\/\d+)?)(\s*[·×]\s*10)?/gu;
  const conEtiqueta = (el) => el.matches('div') && el.firstElementChild?.tagName === 'SPAN' && !el.firstElementChild.className && el.firstChild === el.firstElementChild;
  function numeros(el, quitar = 'small, .nota') {
    const c = el.cloneNode(true);
    if (conEtiqueta(c)) c.firstElementChild.remove();
    if (quitar) for (const x of c.querySelectorAll(quitar)) x.remove();
    // las fracciones de matrices y sistemas (numerador y denominador apilados) pasan a a/b
    for (const fr of c.querySelectorAll('.fr')) if (fr.children.length === 2) fr.replaceWith(`${fr.children[0].textContent.trim()}/${fr.children[1].textContent.trim()}`);
    c.normalize();
    const vals = [], tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT), nodos = [];
    while (tw.nextNode()) if (!tw.currentNode.parentElement.closest('sub, sup, math, .formula')) nodos.push(tw.currentNode);
    for (const n of nodos) {
      const t = n.nodeValue, frag = document.createDocumentFragment();
      let i = 0, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(t))) {
        let texto = m[1], v = texto.includes('/') ? texto.replace('−', '-').split('/').map((x) => parseFloat(x.replace(',', '.'))).reduce((a, b) => a / b) : parseFloat(texto.replace('−', '-').replace(',', '.')), exp = 0, fin = m.index + m[0].length;
        if (m[2]) {
          const sup = n.nextSibling;
          if (fin === t.length && sup && sup.nodeName === 'SUP' && /^[−-]?\d+$/.test(sup.textContent.trim())) { exp = parseInt(sup.textContent.trim().replace('−', '-'), 10); v *= 10 ** exp; sup.remove(); } else fin = m.index + m[1].length;
        }
        if (!Number.isFinite(v)) continue;
        frag.append(t.slice(i, m.index));
        const h = document.createElement('span'); h.dataset.hueco = String(vals.length); frag.append(h);
        vals.push({ t: texto + (exp ? `·10^${exp}` : ''), v, dec: (texto.split('/')[0].split(/[.,]/)[1] || '').length, exp, frac: texto.includes('/') });
        i = fin;
      }
      if (vals.length && i) { frag.append(t.slice(i)); n.replaceWith(frag); }
    }
    return { plantilla: c.innerHTML, vals };
  }
  // lo que escribe el alumno: 12,5 · 1.2e-3 · 1,2·10^-3 · −3/4
  function leeAlumno(s) {
    let t = String(s).trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/,/g, '.');
    if (!t) return null;
    t = t.replace(/(?:·|\*|x|×)10\^?\(?(-?\d+)\)?$/i, 'e$1');
    if (/^-?\d*\.?\d+(e-?\d+)?\/-?\d*\.?\d+$/.test(t)) { const [a, b] = t.split('/').map(Number); return b ? a / b : null; }
    return /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t) ? Number(t) : null;
  }
  const tolerancia = (x) => (x.frac ? 1e-9 + 0.005 * Math.abs(x.v) : Math.max(0.01 * Math.abs(x.v), 0.5 * 10 ** (x.exp - x.dec) * 1.0001));
  const normaConf = (s) => String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).replace(/\^/g, '').replace(/\s+/g, '').toLowerCase();

  const CSS = `
.prac-btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; cursor: pointer; white-space: nowrap }
.prac-btn:hover { border-color: var(--accent); color: var(--accent) }
.prac-btn[aria-pressed=true] { background: var(--accent); border-color: var(--accent); color: var(--panel) }
.prac-tapa { filter: blur(9px); opacity: .45; pointer-events: none; user-select: none; transition: filter .2s }
.prac { background: var(--panel); border: 1px solid var(--accent); border-radius: 10px; padding: 14px; margin-bottom: 14px; box-shadow: inset 4px 0 0 var(--accent) }
.prac h2 { font: 600 15px var(--f-ui, system-ui); margin: 0 0 6px; color: var(--accent) }
.prac > p { margin: 0 0 10px; color: var(--muted) }
.prac .enun { color: var(--ink) }
.prac-q { display: grid; gap: 8px; margin: 0 0 12px }
.prac-q > div { display: grid; grid-template-columns: minmax(120px, max-content) minmax(0, 1fr); gap: 4px 12px; align-items: baseline }
.prac-q .et { color: var(--muted); font-size: 13px }
.prac-q .val { line-height: 2.1 }
@media (max-width: 560px) { .prac-q > div { grid-template-columns: minmax(0, 1fr) } }
.prac-in { font: 13.5px var(--f-mono, ui-monospace, monospace); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 3px 6px; width: 7.5em; margin: 0 2px }
.prac-in.ancha { width: min(100%, 22em) }
.prac-in.bien { border-color: #1d8a5b; box-shadow: 0 0 0 1px #1d8a5b } .prac-in.mal { border-color: #c0392b; box-shadow: 0 0 0 1px #c0392b }
.prac-sol { font: 12.5px var(--f-mono, ui-monospace, monospace); color: var(--accent); margin-left: 2px }
.prac-acc { display: flex; flex-wrap: wrap; gap: 8px }
.prac-acc button { font: 500 13px var(--f-ui, system-ui); border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 6px; padding: 6px 12px; cursor: pointer }
.prac-acc button.si { background: var(--accent); border-color: var(--accent); color: var(--panel) }
.prac-nota { margin: 10px 0 0; font-weight: 600 } .prac-nota.bien { color: #1d8a5b } .prac-nota.mal { color: #c0392b }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .prac-nota.bien { color: #4cc48e } :root:not([data-theme="light"]) .prac-nota.mal { color: #ef6a5a } }
:root[data-theme="dark"] .prac-nota.bien { color: #4cc48e } :root[data-theme="dark"] .prac-nota.mal { color: #ef6a5a }
`;

  function monta(herramienta, clave) {
    const cab = document.querySelector('header.top');
    if (!cab || herramienta === 'tabla-periodica' || document.querySelector('.prac-btn')) return null;
    const conf = CONF[herramienta] || {};
    const K_ANTES = `simu-practica:${herramienta}`;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'prac-btn'; btn.setAttribute('aria-pressed', 'false'); btn.title = 'Ejercicios con datos al azar: escribe tus resultados y compruébalos antes de ver el desarrollo';
    btn.innerHTML = '<span aria-hidden="true">✎</span> Modo práctica';
    const tras = cab.querySelector('.bib-btn') || cab.querySelector('.a-inicio'); (tras ? tras.after(btn) : cab.prepend(btn));

    let activo = false, card = null, preguntas = [], tapados = [], resuelto = false;
    const layout = () => [...document.querySelectorAll('.layout')].find(visible);
    const datos = () => (conf.datos === null ? null : conf.datos ? document.querySelector(conf.datos) : layout()?.firstElementChild);
    const hayError = () => [...document.querySelectorAll('.error, #errores')].some((e) => visible(e) && e.textContent.trim());
    function zonaTapa() {
      if (conf.tapa) return [...document.querySelectorAll(conf.tapa)].filter((e) => !e.closest('.prac'));
      const l = layout(); return l ? [...l.children].slice(1).flatMap((col) => [...col.children]).filter((e) => !e.classList.contains('prac')) : [];
    }
    function items() {
      if (!conf.items && conf.items !== undefined) return [];
      const sel = conf.items || '#res > div, #resumen > div';
      return [...document.querySelectorAll(sel)].filter((e) => !e.closest('.prac') && (visible(e) || e.closest('.prac-tapa')));
    }
    function ejemplo() {
      const d = datos(); if (!d) return;
      const s = [...d.querySelectorAll('select')].find((x) => visible(x) && x.options.length > 2 && /ejemplo/i.test(x.id + ' ' + x.options[0].textContent));
      if (s) { s.selectedIndex = entero(1, s.options.length - 1); s.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    function cambiaDatos() {
      const d = datos(); if (!d) return;
      for (const inp of [...d.querySelectorAll('input')].filter((x) => visible(x) && (!x.type || x.type === 'text' || x.type === 'number' || x.type === 'search') && !x.classList.contains('nom'))) {
        const v = lee(inp.value); if (v === null) continue;
        pon(inp, escribe(otroValor(v, etiquetaDe(inp), inp.value), inp.value));
      }
    }
    // escoge qué resultados se preguntan: todos si son pocos; si no, el primero y tres al azar
    function arma() {
      const its = items().map((el) => ({ el, et: conEtiqueta(el) ? el.firstElementChild.textContent.trim() : '', n: numeros(el, conf.quitar) })).filter((x) => x.n.vals.length && x.n.vals.length <= 9);
      let elegidos = its.length <= 4 ? its : [its[0], ...its.slice(1).sort(() => Math.random() - 0.5).slice(0, 3)].sort((a, b) => its.indexOf(a) - its.indexOf(b));
      let huecos = 0; elegidos = elegidos.filter((x) => (huecos += x.n.vals.length) <= 10 || x === elegidos[0]);
      const q = elegidos.map((x) => ({ tipo: 'num', idx: its.indexOf(x), et: x.et, plantilla: x.n.plantilla, vals: x.n.vals, el: x.el }));
      for (const t of conf.textos || []) q.push({ tipo: 'texto', et: t.et, sel: t.sel, otros: t.otros || [] });
      for (const t of conf.numeros || []) { const el = document.querySelector(t.sel), n = el && numeros(el); if (n && n.vals.length) q.push({ tipo: 'num', et: t.et, sel: t.sel, plantilla: '', vals: n.vals.slice(0, 1) }); }
      return q;
    }
    function nuevo() {
      resuelto = false;
      let q = [];
      for (let intento = 0; intento < 15 && !q.length; intento++) {
        conf.antes?.();
        if (conf.genera) conf.genera(); else { ejemplo(); cambiaDatos(); }
        conf.despues?.();
        if (!hayError() && (!conf.valido || conf.valido())) q = arma();
      }
      if (!q.length) { conf.genera ? conf.genera() : ejemplo(); q = arma(); }
      preguntas = q; pinta();
    }
    function tapa(v) {
      for (const e of tapados) { e.classList.remove('prac-tapa'); e.removeAttribute('aria-hidden'); }
      tapados = v ? zonaTapa() : [];
      for (const e of tapados) { e.classList.add('prac-tapa'); e.setAttribute('aria-hidden', 'true'); }
    }
    function pinta() {
      if (!card) { card = document.createElement('section'); card.className = 'prac'; card.setAttribute('aria-label', 'Modo práctica'); card.addEventListener('click', clic); card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('prac-in')) { e.preventDefault(); comprueba(); } }); }
      tapa(!resuelto);
      const z = zonaTapa()[0] || tapados[0]; if (z && card.nextElementSibling !== z) z.before(card);
      let n = 0;
      const filas = preguntas.map((p, i) => {
        if (p.tipo === 'texto') return `<div><span class="et">${esc(p.et)}</span><span class="val"><input class="prac-in ancha" data-p="${i}" aria-label="${esc(p.et)}" autocomplete="off" spellcheck="false" placeholder="1s2 2s2 2p6…"></span></div>`;
        const tpl = p.plantilla ? p.plantilla.replace(/<span data-hueco="(\d+)"><\/span>/g, (_, k) => `<input class="prac-in" data-p="${i}" data-k="${k}" inputmode="decimal" autocomplete="off" aria-label="${esc(p.et || 'Resultado')} (${+k + 1})">`) : `<input class="prac-in" data-p="${i}" data-k="0" inputmode="decimal" autocomplete="off" aria-label="${esc(p.et)}">`;
        n++; return `<div><span class="et">${esc(p.et || (preguntas.length > 1 ? `Pregunta ${n}` : 'Resultado'))}</span><span class="val">${tpl}</span></div>`;
      }).join('');
      card.innerHTML = `<h2>Modo práctica</h2>
<p class="enun">${conf.enunciado ? conf.enunciado() : 'Resuelve el ejercicio con estos datos y escribe tus resultados en las mismas unidades. Puedes usar coma o punto, 1,2·10^-3 y fracciones como 3/4.'}</p>
${preguntas.length ? `<div class="prac-q">${filas}</div>` : '<p>Con estos datos no hay resultados numéricos que preguntar: prueba con otro ejercicio.</p>'}
<div class="prac-acc"><button class="si" data-a="comprobar"${preguntas.length ? '' : ' disabled'}>Comprobar</button><button data-a="solucion">${resuelto ? 'Ocultar la solución' : 'Ver la solución'}</button><button data-a="otro">Otro ejercicio</button></div>
<p class="prac-nota" role="status" hidden></p>`;
    }
    // el valor correcto se lee al comprobar, por si el alumno ha tocado los datos
    function esperado(p) {
      if (p.tipo === 'texto') return [document.querySelector(p.sel), ...p.otros.map((s) => document.querySelector(s))].filter(Boolean).map((e) => e.textContent);
      const el = p.sel ? document.querySelector(p.sel) : items()[p.idx]; const n = el && numeros(el, conf.quitar);
      return n && n.vals.length >= p.vals.length ? (p.sel ? n.vals.slice(0, 1) : n.vals) : p.vals;
    }
    function comprueba(mostrar) {
      let bien = 0, total = 0, vacios = 0;
      for (const inp of card.querySelectorAll('.prac-in')) {
        const p = preguntas[+inp.dataset.p], e = esperado(p); total++;
        inp.classList.remove('bien', 'mal'); inp.nextElementSibling?.classList.contains('prac-sol') && inp.nextElementSibling.remove();
        let ok, sol;
        if (p.tipo === 'texto') { ok = e.some((x) => normaConf(x) === normaConf(inp.value)); sol = e[0]; }
        else { const x = e[+inp.dataset.k], a = leeAlumno(inp.value); ok = a !== null && Math.abs(a - x.v) <= tolerancia(x); sol = x.t; }
        if (!inp.value.trim()) vacios++;
        else { inp.classList.add(ok ? 'bien' : 'mal'); if (ok) bien++; }
        if (mostrar && !ok && sol !== null) { const s = document.createElement('span'); s.className = 'prac-sol'; s.textContent = `(${sol.trim()})`; inp.after(s); }
      }
      const nota = card.querySelector('.prac-nota'); nota.hidden = false;
      nota.className = 'prac-nota ' + (bien === total ? 'bien' : 'mal');
      nota.textContent = mostrar ? (vacios === total ? 'Aquí tienes la solución, con el desarrollo debajo.' : `${bien} de ${total} bien. La solución y el desarrollo están debajo.`) : bien === total ? '¡Todo bien! Mira el desarrollo con «Ver la solución» o prueba con otro.' : vacios === total ? 'Escribe primero tus resultados.' : `${bien} de ${total} bien${vacios ? ` (${vacios} sin contestar)` : ''}. Revisa los que están en rojo.`;
    }
    function clic(e) {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'comprobar') comprueba(false);
      else if (a === 'otro') nuevo();
      else if (a === 'solucion') {
        const valores = [...card.querySelectorAll('.prac-in')].map((i) => i.value);
        resuelto = !resuelto; pinta();
        card.querySelectorAll('.prac-in').forEach((inp, k) => { inp.value = valores[k] ?? ''; });
        if (resuelto) comprueba(true);
      }
    }
    function activa(v) {
      if (v === activo) return;
      activo = v; btn.setAttribute('aria-pressed', String(v));
      if (v) {
        try { if (clave) sessionStorage.setItem(K_ANTES, localStorage.getItem(clave) ?? ''); } catch (e) { /* sin almacenamiento */ }
        nuevo(); card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        tapa(false); card?.remove(); card = null;
        // vuelve a los datos de antes de practicar
        let antes = null; try { antes = clave ? sessionStorage.getItem(K_ANTES) : null; sessionStorage.removeItem(K_ANTES); } catch (e) { /* sin almacenamiento */ }
        if (antes !== null) { try { if (antes) localStorage.setItem(clave, antes); else localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ } history.replaceState(null, '', location.pathname + location.search); location.reload(); }
      }
    }
    // si se recargó en mitad de una práctica, deja los datos como estaban
    try { const antes = clave ? sessionStorage.getItem(K_ANTES) : null; if (antes !== null) { sessionStorage.removeItem(K_ANTES); if (antes) localStorage.setItem(clave, antes); else localStorage.removeItem(clave); history.replaceState(null, '', location.pathname + location.search); location.reload(); } } catch (e) { /* sin almacenamiento */ }
    btn.addEventListener('click', () => activa(!activo));
    // lo que habría que escribir en cada hueco, en orden (para las pruebas)
    const respuestas = () => [...(card?.querySelectorAll('.prac-in') || [])].map((inp) => { const p = preguntas[+inp.dataset.p], e = esperado(p); return p.tipo === 'texto' ? e[0] : e[+inp.dataset.k].t; });
    return (window.PracticaApp = { activa, nuevo, respuestas, get activo() { return activo; }, get preguntas() { return preguntas; } });
  }
  return { monta, CONF, numeros, leeAlumno, otroValor };
})();
if (typeof module !== 'undefined') module.exports = Practica;
