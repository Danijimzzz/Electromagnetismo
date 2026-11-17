/* =====================================================================
   Idiomas de la web y su selector (botón de la cabecera + aviso de idioma).
   - IDIOMAS: la lista (código, nombre en su idioma, carpeta, bandera, formato de números). El español es la
     fuente y vive en la raíz; los demás irán en /en/, /de/, /fr/, /pt/, /it/, /zh/ y /ja/.
   - `publicado`: solo los idiomas publicados salen en el selector. Con menos de dos publicados el selector NO se
     pinta (la web se ve exactamente igual que antes) y se enciende solo al publicar el primer idioma nuevo.
     Para verlo antes: IDIOMAS_TODOS=1 sh fuente/build.sh (o idiomas.BOTON con todos=true en las pruebas).
   - `indexar`: si Google puede indexar ese idioma. Un idioma se publica (se ve y se enlaza) antes de indexarlo:
     con indexar:false sus páginas llevan `noindex` (ROBOTS) y no entran en hreflang ni en sitemap. Se pone a true
     cuando el idioma está completo. HREFLANG(ruta) da las alternativas de una página (cada idioma indexable
     con su URL, más x-default = español) y SITEMAP(rutas) las líneas xhtml:link del sitemap.
   - BOTON({ idioma, ruta }): el botón (globo + código «ES ▾») y, al abrirlo, la lista con bandera, nombre en su
     idioma y código. Enlaces reales a la misma página en el otro idioma (un script los completa con la ruta actual
     y guarda la elección en `simu-idioma`); sin JavaScript llevan a la portada de ese idioma.
   - AVISO: una sola vez, si el idioma del navegador es otro publicado y no se ha elegido nada, ofrece cambiar.
     Nunca redirige solo (no se rompe el SEO ni los enlaces compartidos).
   portal.js y diseno.js meten BOTON junto al botón claro/oscuro y CSS donde está Tema.CSS.
   La traducción del contenido (diccionarios, T(), /en/…) es la siguiente etapa: ver el plan del hilo.
   ===================================================================== */
const CLAVE = 'simu-idioma';

// Bandera redonda (SVG propio: el emoji de bandera sale como letras en Windows). Cuadro de 24 × 24 recortado.
const BANDERAS = {
  es: '<rect width="24" height="24" fill="#c60b1e"/><rect y="6" width="24" height="12" fill="#ffc400"/>',
  en: '<rect width="24" height="24" fill="#012169"/><path d="M0 0L24 24M24 0L0 24" stroke="#fff" stroke-width="5"/><path d="M0 0L24 24M24 0L0 24" stroke="#c8102e" stroke-width="2"/><path d="M12 0V24M0 12H24" stroke="#fff" stroke-width="8"/><path d="M12 0V24M0 12H24" stroke="#c8102e" stroke-width="4.5"/>',
  de: '<rect width="24" height="8" fill="#000"/><rect y="8" width="24" height="8" fill="#dd0000"/><rect y="16" width="24" height="8" fill="#ffce00"/>',
  fr: '<rect width="8" height="24" fill="#0055a4"/><rect x="8" width="8" height="24" fill="#fff"/><rect x="16" width="8" height="24" fill="#ef4135"/>',
  pt: '<rect width="24" height="24" fill="#f00"/><rect width="9.6" height="24" fill="#060"/><circle cx="9.6" cy="12" r="3.6" fill="#fc0"/>',
  it: '<rect width="8" height="24" fill="#009246"/><rect x="8" width="8" height="24" fill="#fff"/><rect x="16" width="8" height="24" fill="#ce2b37"/>',
  zh: '<rect width="24" height="24" fill="#de2910"/><path d="M7 4l1.6 4.9h5.1l-4.1 3 1.6 4.9L7 13.8l-4.2 3 1.6-4.9-4.1-3h5.1z" transform="translate(2.5 -.5) scale(.85)" fill="#ffde00"/>',
  ja: '<rect width="24" height="24" fill="#fff"/><circle cx="12" cy="12" r="6" fill="#bc002d"/>'
};
const bandera = (c, t) => `<svg class="lg-fl" viewBox="0 0 24 24" width="${t}" height="${t}" aria-hidden="true" focusable="false">${BANDERAS[c]}</svg>`;

// carpeta '' = raíz. num: decimal y miles (lo usará Num en la etapa de traducción). aviso: [frase, cambiar, quedarse]
const IDIOMAS = [
  { c: 'es', etiqueta: 'Idioma', nombre: 'Español', carpeta: '', html: 'es', publicado: true, indexar: true, num: { dec: ',', miles: '' }, aviso: ['Esta página está disponible en español.', 'Cambiar a español', 'Seguir aquí'] },
  { c: 'en', etiqueta: 'Language', nombre: 'English', carpeta: 'en/', html: 'en', publicado: true, indexar: false, num: { dec: '.', miles: ',' }, aviso: ['This page is available in English.', 'Switch to English', 'Stay here'] },
  { c: 'de', nombre: 'Deutsch', carpeta: 'de/', html: 'de', publicado: false, indexar: false, num: { dec: ',', miles: '.' }, aviso: ['Diese Seite ist auf Deutsch verfügbar.', 'Auf Deutsch ansehen', 'Hier bleiben'] },
  { c: 'fr', nombre: 'Français', carpeta: 'fr/', html: 'fr', publicado: false, indexar: false, num: { dec: ',', miles: ' ' }, aviso: ['Cette page est disponible en français.', 'Passer en français', 'Rester ici'] },
  { c: 'pt', nombre: 'Português', carpeta: 'pt/', html: 'pt', publicado: false, indexar: false, num: { dec: ',', miles: '.' }, aviso: ['Esta página está disponível em português.', 'Mudar para português', 'Ficar aqui'] },
  { c: 'it', nombre: 'Italiano', carpeta: 'it/', html: 'it', publicado: false, indexar: false, num: { dec: ',', miles: '.' }, aviso: ['Questa pagina è disponibile in italiano.', 'Passa all’italiano', 'Resta qui'] },
  { c: 'zh', nombre: '简体中文', carpeta: 'zh/', html: 'zh-Hans', publicado: false, indexar: false, num: { dec: '.', miles: ',' }, aviso: ['本页面提供简体中文版本。', '切换到简体中文', '留在此页'] },
  { c: 'ja', nombre: '日本語', carpeta: 'ja/', html: 'ja', publicado: false, indexar: false, num: { dec: '.', miles: ',' }, aviso: ['このページは日本語でも利用できます。', '日本語に切り替える', 'このまま'] }
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const globo = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg>';

// idiomas que salen en el selector (los publicados, o todos con IDIOMAS_TODOS=1 / todos = true)
const activos = (todos = !!process.env.IDIOMAS_TODOS) => IDIOMAS.filter((i) => todos || i.publicado);

// Páginas traducidas de un idioma ('asignatura/clave/'): las que tienen diccionario en fuente/i18n/<idioma>/<carpeta>.json.
// El español las tiene todas. Un idioma solo aparece en el selector (y en hreflang) de las páginas que existen en él.
const _paginas = {};
function paginas(c) {
  if (c === 'es') return null;
  if (_paginas[c]) return _paginas[c];
  const dir = require('path').join(__dirname, 'i18n', c), fs = require('fs'), set = new Set();
  if (fs.existsSync(dir)) {
    const Catalogo = require('./catalogo.js'), carpetas = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f[0] !== '_').map((f) => f.slice(0, -5).replace(/__/g, '/'));
    for (const a of Catalogo.asignaturas) for (const h of a.herramientas) if (carpetas.includes(h.carpeta || h.clave)) set.add(`${a.clave}/${h.clave}/`);
    for (const f of Catalogo.fenomenos.lista) if (carpetas.includes(`fenomenos/${f.clave}`)) set.add(`fenomenos/${f.clave}/`);
    for (const g of generales()) if (fs.existsSync(require('path').join(dir, g.dic + '.json'))) set.add(g.ruta);
  }
  return (_paginas[c] = set);
}
const existe = (c, ruta, todos) => todos || c === 'es' || paginas(c).has(ruta);

// Páginas generales (no son herramientas): ruta (desde la raíz, '' = portada), archivo generado en español y diccionario
// fuente/i18n/<idioma>/<dic>.json (con _g- delante: no se confunden con los de herramientas). Existen en un idioma si tienen diccionario.
function generales() {
  const Catalogo = require('./catalogo.js');
  return [
    { ruta: '', archivo: 'index.html', dic: '_g-portada' },
    ...Catalogo.asignaturas.map((a) => ({ ruta: `${a.clave}/`, archivo: `${a.clave}/index.html`, dic: '_g-asignaturas' })),
    { ruta: 'novedades/', archivo: 'novedades/index.html', dic: '_g-novedades' },
    { ruta: 'foro/', archivo: 'foro/index.html', dic: '_g-foro' },
    { ruta: 'fenomenos/', archivo: 'fenomenos/index.html', dic: '_g-fenomenos' },
    ...['aviso-legal', 'privacidad', 'cookies', 'contacto'].map((f) => ({ ruta: `${f}.html`, archivo: `${f}.html`, dic: '_g-legal' })),
    { ruta: 'offline.html', archivo: 'offline.html', dic: '_g-offline', sinSelector: true }
  ];
}

const CSS = (todos) => activos(todos).length < 2 ? '' : `
.lg { position:relative; flex:0 0 auto }
.lg-btn { display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 12px; border:1px solid var(--vidrio-borde, var(--line)); border-radius:99px; background:var(--vidrio, var(--bg)); color:var(--ink); font:600 13px var(--f-ui, system-ui, sans-serif); cursor:pointer }
.lg-btn:hover { border-color:var(--accent); color:var(--accent) }
.lg-btn:focus-visible, .lg-pop a:focus-visible, .lg-ban button:focus-visible { outline:2px solid var(--accent); outline-offset:1px }
.lg-pop { position:absolute; top:44px; right:0; z-index:50; min-width:210px; margin:0; padding:6px; list-style:none; border:1px solid var(--vidrio-borde, var(--line)); border-radius:16px; background:rgba(255,255,255,.98); color:var(--ink); box-shadow:0 12px 36px rgba(0,0,0,.22) }
.lg-pop[hidden] { display:none }
:root[data-theme="dark"] .lg-pop, :root[data-theme="dark"] .lg-ban { background:rgba(28,34,38,.98) }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .lg-pop, :root:not([data-theme="light"]) .lg-ban { background:rgba(28,34,38,.98) } }
.lg-t { font:600 11px var(--f-ui, system-ui, sans-serif); text-transform:uppercase; letter-spacing:.06em; color:var(--muted); padding:6px 10px 4px }
.lg-pop a { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:8px 10px; border-radius:10px; color:var(--ink); text-decoration:none; font:500 14px var(--f-ui, system-ui, sans-serif) }
.lg-pop a:hover { background:var(--accent-soft) }
.lg-pop a > span { display:flex; align-items:center; gap:10px }
.lg-pop a small { color:var(--muted); font-size:12px }
.lg-pop a[aria-current="true"] { background:var(--accent-soft); font-weight:700 }
.lg-pop a[aria-current="true"] small::after { content:' ✓'; color:var(--accent) }
.lg-fl { flex:none; border-radius:50%; box-shadow:0 0 0 1px rgba(0,0,0,.18) }
.lg-ban { position:fixed; left:50%; bottom:18px; z-index:60; transform:translateX(-50%); width:min(560px, calc(100vw - 24px)); box-sizing:border-box; display:flex; flex-wrap:wrap; align-items:center; gap:10px 12px; padding:12px 16px; border:1px solid var(--vidrio-borde, var(--line)); border-radius:18px; background:rgba(255,255,255,.98); color:var(--ink); box-shadow:0 12px 36px rgba(0,0,0,.25); font:14px var(--f-ui, system-ui, sans-serif) }
.lg-ban p { flex:1 1 220px; margin:0 }
.lg-ban button { font:600 13px var(--f-ui, system-ui, sans-serif); padding:7px 14px; border-radius:99px; border:1px solid var(--vidrio-borde, var(--line)); background:var(--vidrio, var(--bg)); color:var(--ink); cursor:pointer }
.lg-ban button.lg-si { background:var(--accent); border-color:var(--accent); color:#fff }
:root[data-theme="dark"] .lg-ban button.lg-si { color:#0d141a }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .lg-ban button.lg-si { color:#0d141a } }
@media (max-width:700px) { .top > .lg { margin-left:auto } .top > .lg + .tema { margin-left:0 } }
@media print { .lg, .lg-ban { display:none !important } }
`;

// El script va tras la cabecera. Datos: lista de idiomas publicados y el idioma de esta página.
const SCRIPT = (lista, actual, etiqueta) => `(() => {
  const L = ${JSON.stringify(lista.map((i) => ({ c: i.c, d: i.carpeta, n: i.nombre, a: i.aviso })))}, ACTUAL = ${JSON.stringify(actual)}, K = '${CLAVE}';
  const guarda = (c) => { try { localStorage.setItem(K, c); } catch (e) { /* sin almacenamiento */ } };
  const lee = () => { try { return localStorage.getItem(K); } catch (e) { return null; } };
  const resto = () => { let p = location.pathname; for (const i of L) if (i.d && p.startsWith('/' + i.d)) { p = '/' + p.slice(i.d.length + 1); break; } return p + location.search + location.hash; };
  const destino = (i) => '/' + i.d + resto().replace(/^\\//, '');
  const btn = document.querySelector('.lg-btn'), pop = document.querySelector('.lg-pop');
  if (!btn || !pop) return;
  pop.querySelectorAll('a[hreflang]').forEach((a) => { const i = L.find((x) => x.c === a.hreflang); if (i) a.href = destino(i); a.addEventListener('click', () => guarda(a.hreflang)); });
  const abre = (v) => { pop.hidden = !v; btn.setAttribute('aria-expanded', String(v)); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); abre(pop.hidden); });
  document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.lg')) abre(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { abre(false); btn.focus(); } });
  pop.addEventListener('focusout', (e) => { if (!pop.hidden && !e.relatedTarget?.closest?.('.lg')) abre(false); });
  // aviso: una vez, sin elección guardada, con el idioma del navegador publicado y distinto del de la página
  if (lee() || window.__sinAviso) return;
  const pref = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map((s) => String(s).toLowerCase().slice(0, 2));
  const i = pref.map((c) => L.find((x) => x.c === c)).find(Boolean);
  if (!i || i.c === ACTUAL) { return; }
  const b = document.createElement('div'); b.className = 'lg-ban'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', ${JSON.stringify(etiqueta)}); b.lang = i.c;
  const t = document.createElement('p'); t.textContent = i.a[0];
  const si = document.createElement('button'); si.type = 'button'; si.className = 'lg-si'; si.textContent = i.a[1];
  const no = document.createElement('button'); no.type = 'button'; no.textContent = i.a[2];
  si.addEventListener('click', () => { guarda(i.c); location.href = destino(i); });
  no.addEventListener('click', () => { guarda(ACTUAL); b.remove(); });
  b.append(t, si, no); document.body.append(b);
})();`;

// Marca del botón + lista + script. Vacío si hay menos de dos idiomas publicados.
// idioma: el de esta página; etiqueta: textos de la interfaz (en español hasta que haya diccionarios).
function BOTON({ idioma = 'es', raiz = './', todos, ruta } = {}) {
  const lista = ruta === undefined && !todos ? [] : activos(todos).filter((i) => existe(i.c, ruta, todos));
  if (lista.length < 2) return '';
  const act = lista.find((i) => i.c === idioma) || lista[0], etiqueta = act.etiqueta;
  const filas = lista.map((i) => `<li><a href="${esc(raiz + i.carpeta)}" hreflang="${i.c}" lang="${i.html}"${i.c === act.c ? ' aria-current="true"' : ''}><span>${bandera(i.c, 22)}${esc(i.nombre)}</span><small>${i.c.toUpperCase()}</small></a></li>`).join('');
  return `<style>${CSS(true)}</style><div class="lg"><button class="lg-btn" type="button" aria-expanded="false" aria-controls="lg-lista" aria-label="${esc(etiqueta)}: ${esc(act.nombre)}" title="${esc(etiqueta)}">${globo}<span>${act.c.toUpperCase()}</span><span aria-hidden="true">▾</span></button>`
    + `<ul class="lg-pop" id="lg-lista" hidden><li class="lg-t" aria-hidden="true">${act.c === 'es' ? 'Idioma · Language' : 'Language · Idioma'}</li>${filas}</ul></div><script>${SCRIPT(lista, act.c, etiqueta)}</script>`;
}

// ruta: ruta de la página en español sin barra inicial ('fisica/choques/'). Solo idiomas publicados e indexables.
const url = (base, i, ruta) => `${base}/${i.carpeta}${ruta}`;
function HREFLANG(ruta, base, todos) {
  const l = activos(todos).filter((i) => (i.indexar || todos) && existe(i.c, ruta, todos));
  if (l.length < 2) return '';
  return l.map((i) => `<link rel="alternate" hreflang="${i.html}" href="${url(base, i, ruta)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${url(base, IDIOMAS[0], ruta)}">`;
}
const ROBOTS = (idioma) => (IDIOMAS.find((i) => i.c === idioma) || IDIOMAS[0]).indexar ? '' : '<meta name="robots" content="noindex, follow">';
const SITEMAP = (ruta, base, todos) => HREFLANG(ruta, base, todos).replace(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g, '<xhtml:link rel="alternate" hreflang="$1" href="$2"/>');

if (typeof module !== 'undefined') module.exports = { paginas, existe, generales, HREFLANG, ROBOTS, SITEMAP, IDIOMAS, BANDERAS, CLAVE, CSS, BOTON, SCRIPT, activos, bandera };
