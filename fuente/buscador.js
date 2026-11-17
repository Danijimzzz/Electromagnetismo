/* =====================================================================
   Buscador global de la web: una ventana que se abre en cualquier página con «/» o Ctrl+K (o al
   pulsar el campo de búsqueda de la cabecera) y encuentra herramientas, fenómenos, asignaturas y
   páginas sin salir de donde estás. Usa los mismos datos que la portada (catalogo.js: nombre, desc
   y buscar) y no distingue mayúsculas ni tildes.
   portal.js escribe publico/buscador.js (el índice + el código + su CSS) con archivo(); diseno.js y
   portal.js enganchan la etiqueta ETIQUETA(raiz) en cada página. En la portada, «/» y Ctrl+K llevan al
   campo de la propia página (#buscar); en las herramientas (Electrostática incluida) abren la ventana.
   ===================================================================== */
const Catalogo = require('./catalogo.js'), Version = require('./version.js');

const V = Catalogo.fenomenos;
const ETIQUETA = (raiz) => `<script src="${raiz}buscador.js" defer></script>`;

// Índice: asignaturas [nombre, color, colorOscuro] y entradas [tipo, nombre, desc, dirección, asignatura, palabras]
// (tipo: h herramienta, f fenómeno, a asignatura, p página; la dirección va desde la raíz de la web)
function indice() {
  const asig = [...Catalogo.asignaturas, V].map((a) => [a.nombre, a.color, a.colorOscuro]);
  const n = (clave) => asig.findIndex((_, i) => [...Catalogo.asignaturas, V][i].clave === clave);
  const nombreDe = (k) => Catalogo.asignaturas.find((a) => a.clave === k)?.nombre || '';
  const e = [];
  for (const a of Catalogo.asignaturas) {
    e.push(['a', a.nombre, a.resumen || '', `${a.clave}/`, n(a.clave), '']);
    for (const h of a.herramientas.filter((x) => x.disponible)) e.push(['h', h.nombre, h.desc, `${a.clave}/${h.clave}/`, n(a.clave), h.buscar || '']);
  }
  const herr = (ruta) => { const [ak, hk] = ruta.split('/'); return Catalogo.asignaturas.find((a) => a.clave === ak)?.herramientas.find((h) => h.clave === hk)?.nombre || ''; };
  for (const f of V.lista.filter((x) => x.disponible))
    e.push(['f', f.nombre, f.desc, `fenomenos/${f.clave}/`, n(V.clave), ['vida real fenómeno', ...f.asignaturas.map(nombreDe), ...f.herramientas.map(herr)].join(' ')]);
  e.push(['a', V.nombre, V.resumen || '', 'fenomenos/', n(V.clave), 'fenómenos vida real cotidiano']);
  e.push(['p', 'Novedades', `Versión ${Version.de('web').current}: qué hay de nuevo en la web.`, 'novedades/', -1, 'versiones cambios actualizaciones']);
  e.push(['p', 'Foro', 'Preguntas y respuestas entre estudiantes.', 'foro/', -1, 'comunidad dudas']);
  return { asig, e };
}

// Estilos de la ventana: solo variables de la página (--bg, --panel, --ink, --muted, --line, --accent)
const CSS = `
.bq-fondo { position:fixed; inset:0; z-index:1000; display:flex; justify-content:center; align-items:flex-start; padding:9vh 12px 12px; background:color-mix(in srgb, var(--ink) 28%, transparent); -webkit-backdrop-filter:blur(8px) saturate(1.2); backdrop-filter:blur(8px) saturate(1.2) }
.bq-fondo[hidden] { display:none }
.bq { width:min(660px,100%); max-height:min(78vh,640px); display:flex; flex-direction:column; background:var(--vidrio-fuerte, var(--panel)); -webkit-backdrop-filter:var(--blur, none); backdrop-filter:var(--blur, none); color:var(--ink); border:1px solid var(--vidrio-borde, var(--line)); border-radius:26px; box-shadow:var(--vidrio-brillo, none), 0 18px 60px color-mix(in srgb, var(--ink) 30%, transparent); overflow:hidden; font:15px/1.4 var(--f-ui, system-ui, sans-serif) }
.bq-campo { display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid var(--vidrio-borde, var(--line)) }
.bq-campo > span { color:var(--muted); font-size:18px }
.bq input { flex:1; min-width:0; border:0; background:transparent; color:var(--ink); font:inherit; font-size:17px; padding:6px 0; outline:0 }
.bq-campo:focus-within { box-shadow:inset 0 -2px 0 var(--accent) }
.bq kbd { font:600 11.5px var(--f-mono, monospace); color:var(--muted); border:1px solid var(--vidrio-borde, var(--line)); background:var(--vidrio, transparent); border-radius:7px; padding:1px 6px; box-shadow:var(--vidrio-brillo, none) }
.bq ul { list-style:none; margin:0; padding:6px; overflow-y:auto; flex:1 }
.bq h3 { margin:8px 10px 4px; font:600 11.5px var(--f-ui, system-ui); letter-spacing:.06em; text-transform:uppercase; color:var(--muted) }
.bq li { --c:var(--bl, var(--accent)) }
.bq li a { display:flex; align-items:center; gap:12px; padding:9px 10px; border-radius:16px; color:var(--ink); text-decoration:none }
.bq li a[aria-selected="true"], .bq li a:hover { background:color-mix(in srgb, var(--c) 14%, var(--vidrio, transparent)); box-shadow:var(--vidrio-brillo, none), inset 3px 0 0 var(--c) }
.bq .ico { flex:none; width:32px; height:32px; border-radius:12px; display:grid; place-items:center; font:700 15px var(--f-ui, system-ui); color:var(--c); background:color-mix(in srgb, var(--c) 14%, transparent) }
.bq .tx { flex:1; min-width:0; display:flex; flex-direction:column }
.bq .tx b { font-weight:600; font-size:15px } .bq .tx small { color:var(--muted); font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.bq .tag { flex:none; font-size:11.5px; font-weight:600; color:var(--c); border:1px solid color-mix(in srgb, var(--c) 40%, var(--line)); border-radius:99px; padding:1px 9px; white-space:nowrap }
.bq mark { background:color-mix(in srgb, var(--c) 22%, transparent); color:inherit; border-radius:3px }
.bq-nada { padding:22px 16px; color:var(--muted); text-align:center }
.bq-pie { display:flex; gap:14px; flex-wrap:wrap; padding:8px 16px; border-top:1px solid var(--vidrio-borde, var(--line)); color:var(--muted); font-size:12.5px }
.bq-solo { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap }
:root[data-theme="dark"] .bq li { --c:var(--bo, var(--accent)) }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .bq li { --c:var(--bo, var(--accent)) } }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) { .bq-fondo { -webkit-backdrop-filter:none; backdrop-filter:none } .bq { background:var(--panel); -webkit-backdrop-filter:none; backdrop-filter:none } }
@media (max-width:600px) { .bq-fondo { padding-top:8px } .bq { max-height:92vh; border-radius:22px } .bq .tag { display:none } .bq-pie .teclas { display:none } }
`;

// Código de la página. Los datos llegan en window.BUSCADOR_INDICE; la dirección de cada entrada es relativa a la
// carpeta donde está buscador.js (la raíz de la web).
const CLIENTE = `(() => {
  const { asig, e: entradas } = window.BUSCADOR_INDICE, base = new URL('./', document.currentScript.src).href;
  const norm = (s) => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TIPOS = { h: 'Herramienta', f: 'Fenómeno', a: 'Asignatura', p: 'Página' };
  const datos = entradas.map((x, i) => ({ tipo: x[0], nombre: x[1], desc: x[2], url: x[3], a: x[4], i,
    n: norm(x[1]), todo: norm([x[1], x[2], x[5], x[4] >= 0 ? asig[x[4]][0] : ''].join(' ')) }));
  const guarda = (k, v) => { try { return v === undefined ? JSON.parse(localStorage.getItem(k) || 'null') : localStorage.setItem(k, JSON.stringify(v)); } catch (err) { return null; } };
  const RECIENTES = 'simu-buscador-recientes';

  // puntuación: nombre que empieza por lo escrito > palabra del nombre que empieza > en el nombre > en descripción o palabras
  function puntua(d, ts) {
    let total = 0;
    for (const t of ts) {
      if (d.n.startsWith(t)) total += 8;
      else if (d.n.includes(' ' + t) || d.n.includes('(' + t)) total += 6;
      else if (d.n.includes(t)) total += 4;
      else if (d.todo.includes(t)) total += 1;
      else return 0;
    }
    return total + (d.tipo === 'a' ? 0.5 : 0);
  }
  const busca = (q) => {
    const ts = norm(q).split(/\\s+/).filter(Boolean);
    if (!ts.length) return null;
    return datos.map((d) => [puntua(d, ts), d]).filter((x) => x[0] > 0).sort((x, y) => y[0] - x[0] || x[1].i - y[1].i).slice(0, 30).map((x) => x[1]);
  };
  // resalta lo escrito en el nombre (sin tildes ni mayúsculas, sobre el texto original)
  function resalta(texto, q) {
    const ts = norm(q).split(/\\s+/).filter(Boolean), sin = norm(texto);
    if (sin.length !== texto.length) return esc(texto); // la normalización cambió la longitud: sin resaltar
    const marca = new Array(texto.length).fill(false);
    for (const t of ts) for (let p = sin.indexOf(t); p >= 0; p = sin.indexOf(t, p + 1)) for (let k = p; k < p + t.length; k++) marca[k] = true;
    let out = '', dentro = false;
    for (let k = 0; k < texto.length; k++) { if (marca[k] !== dentro) { out += dentro ? '</mark>' : '<mark>'; dentro = marca[k]; } out += esc(texto[k]); }
    return out + (dentro ? '</mark>' : '');
  }

  let fondo, campo, lista, estado, previo, ver = [], sel = -1;
  function crea() {
    const st = document.createElement('style'); st.textContent = ${JSON.stringify(CSS)}; document.head.appendChild(st);
    fondo = document.createElement('div'); fondo.className = 'bq-fondo'; fondo.hidden = true;
    fondo.innerHTML = '<div class="bq" role="dialog" aria-modal="true" aria-label="Buscar en la web"><div class="bq-campo"><span aria-hidden="true">⌕</span>'
      + '<input type="text" id="bq-campo" role="combobox" aria-expanded="true" aria-controls="bq-lista" aria-autocomplete="list" placeholder="Buscar herramientas, fenómenos y asignaturas…" aria-label="Buscar en la web" autocomplete="off" spellcheck="false"><kbd aria-hidden="true">Esc</kbd></div>'
      + '<ul id="bq-lista" role="listbox" aria-label="Resultados"></ul><p class="bq-solo" id="bq-estado" role="status" aria-live="polite"></p>'
      + '<div class="bq-pie"><span class="teclas"><kbd>↑</kbd> <kbd>↓</kbd> moverse · <kbd>Intro</kbd> abrir · <kbd>Esc</kbd> cerrar</span><span>Sin tildes ni mayúsculas</span></div></div>';
    document.body.appendChild(fondo);
    campo = fondo.querySelector('#bq-campo'); lista = fondo.querySelector('#bq-lista'); estado = fondo.querySelector('#bq-estado');
    campo.addEventListener('input', pinta);
    fondo.addEventListener('mousedown', (ev) => { if (ev.target === fondo) cierra(); });
    lista.addEventListener('click', (ev) => { const a = ev.target.closest('a'); if (a) recuerda(+a.dataset.i); });
    lista.addEventListener('mousemove', (ev) => { const a = ev.target.closest('a'); if (a) marca(+a.dataset.pos, false); });
    fondo.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); cierra(); }
      else if (ev.key === 'ArrowDown') { ev.preventDefault(); marca(Math.min(sel + 1, ver.length - 1), true); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); marca(Math.max(sel - 1, 0), true); }
      else if (ev.key === 'Enter' && ver[sel]) { ev.preventDefault(); va(ver[sel]); }
      else if (ev.key === 'Tab') { ev.preventDefault(); campo.focus(); }
    });
  }
  const recuerda = (i) => { const r = (guarda(RECIENTES) || []).filter((x) => x !== i); r.unshift(i); guarda(RECIENTES, r.slice(0, 5)); };
  const va = (d) => { recuerda(d.i); location.href = base + d.url; };
  function marca(n, desplaza) {
    sel = n;
    lista.querySelectorAll('a').forEach((a) => a.setAttribute('aria-selected', +a.dataset.pos === n));
    const a = lista.querySelector('a[data-pos="' + n + '"]');
    if (a) { campo.setAttribute('aria-activedescendant', a.id); if (desplaza) a.scrollIntoView({ block: 'nearest' }); } else campo.removeAttribute('aria-activedescendant');
  }
  function fila(d, pos, q) {
    const col = d.a >= 0 ? asig[d.a] : null, estilo = col ? ' style="--bl:' + col[1] + ';--bo:' + col[2] + '"' : '';
    const etq = d.tipo === 'h' ? asig[d.a][0] : TIPOS[d.tipo];
    const ico = d.tipo === 'f' ? '✦' : d.tipo === 'a' ? '▤' : d.tipo === 'p' ? '↻' : esc([...d.nombre][0]);
    return '<li role="presentation"' + estilo + '><a role="option" id="bq-o' + pos + '" data-pos="' + pos + '" data-i="' + d.i + '" href="' + esc(base + d.url) + '" aria-selected="false">'
      + '<span class="ico" aria-hidden="true">' + ico + '</span><span class="tx"><b>' + resalta(d.nombre, q) + '</b><small>' + esc(d.desc) + '</small></span><span class="tag">' + esc(etq) + '</span></a></li>';
  }
  function pinta() {
    const q = campo.value, r = busca(q);
    let html = '';
    if (r) {
      ver = r;
      html = r.map((d, p) => fila(d, p, q)).join('');
      if (!r.length) html = '<li role="presentation" class="bq-nada">No hay nada con «' + esc(q.trim()) + '». Prueba con otra palabra: «campo», «pH», «integral»…</li>';
      estado.textContent = r.length ? r.length + (r.length === 1 ? ' resultado' : ' resultados') : 'Sin resultados';
    } else {
      // sin escribir: lo último que abriste y, debajo, las asignaturas
      const rec = (guarda(RECIENTES) || []).map((i) => datos[i]).filter(Boolean), asigs = datos.filter((d) => d.tipo === 'a');
      ver = [...rec, ...asigs];
      html = (rec.length ? '<h3 role="presentation">Lo último que abriste</h3>' + rec.map((d, p) => fila(d, p, '')).join('') : '')
        + '<h3 role="presentation">Asignaturas</h3>' + asigs.map((d, p) => fila(d, rec.length + p, '')).join('');
      estado.textContent = 'Escribe para buscar entre ' + datos.filter((d) => d.tipo === 'h').length + ' herramientas';
    }
    lista.innerHTML = html;
    marca(ver.length ? 0 : -1, false);
  }
  function abre() {
    if (!fondo) crea();
    if (!fondo.hidden) { campo.focus(); return; }
    previo = document.activeElement; fondo.hidden = false; document.documentElement.style.overflow = 'hidden';
    campo.value = ''; pinta(); campo.focus();
  }
  function cierra() {
    if (!fondo || fondo.hidden) return;
    fondo.hidden = true; document.documentElement.style.overflow = '';
    if (previo && previo.focus && previo.isConnected && !previo.matches('.buscar')) previo.focus();
  }
  const escribiendo = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  const propio = () => document.getElementById('buscar'); // la portada filtra en la misma página
  document.addEventListener('keydown', (ev) => {
    if (ev.defaultPrevented) return;
    const ctrlK = (ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && ev.key.toLowerCase() === 'k';
    const barra = ev.key === '/' && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !escribiendo(ev.target);
    if (!ctrlK && !barra) return;
    ev.preventDefault();
    if (propio()) { propio().focus(); propio().select(); } else abre();
  });
  // el campo de la cabecera de las herramientas abre la ventana (sin JavaScript sigue llevando a la portada con ?q=)
  document.addEventListener('focusin', (ev) => {
    const c = ev.target.closest && ev.target.closest('header.top form .buscar');
    if (c) { c.blur(); abre(); }
  });
  document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('header.top form .buscar')) abre(); });
  window.Buscador = { abre, cierra };
})();`;

// El archivo que se publica: índice + código (publico/buscador.js)
const archivo = () => `/* Buscador global de SimulaCiencia: generado por fuente/buscador.js */\nwindow.BUSCADOR_INDICE = ${JSON.stringify(indice())};\n${CLIENTE}\n`;

module.exports = { ETIQUETA, archivo, indice };
