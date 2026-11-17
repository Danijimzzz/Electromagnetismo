#!/usr/bin/env node
/* Genera la portada (publico/index.html), una página por asignatura (publico/<asignatura>/index.html), el foro,
   las novedades y el índice de «Física en la vida real» (publico/fenomenos/index.html) a partir de catalogo.js.
   Lo llama build.sh; no hace falta ejecutarlo a mano. Las páginas de cada fenómeno las hace herramientas.js. */
const fs = require('fs'), path = require('path');
const Catalogo = require('./catalogo.js'), Version = require('./version.js'), Tema = require('./tema.js'), Idiomas = require('./idiomas.js'), Buscador = require('./buscador.js'), Llama = require('./llama.js'), Anuncios = require('./anuncios.js'), Pwa = require('./pwa.js');
const publico = path.join(__dirname, '..', 'publico');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icono = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(__dirname, 'icono.svg')).toString('base64');
const [m1, m2] = Catalogo.marca, marca = m1 + m2;
const disponibles = (a) => a.herramientas.filter((h) => h.disponible);
const V = Catalogo.fenomenos;

const CSS = `
[style*="--cl:"] { --c:var(--cl) }
:root { --bg:#eef1ee; --panel:#fff; --ink:#1a2128; --muted:#5b6670; --line:#d5dbd5; --accent:#0d6b66; --accent-soft:#e0efec;
  --f-ui:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif; --f-math:"STIX Two Text","Cambria Math",Cambria,Georgia,serif }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#a3aeb5; --line:#2a343b; --accent:#4dbcb0; --accent-soft:#173431; color-scheme:dark }
  :root:not([data-theme="light"]) [style*="--cl:"] { --c:var(--co) } }
:root[data-theme="dark"] { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#a3aeb5; --line:#2a343b; --accent:#4dbcb0; --accent-soft:#173431; color-scheme:dark }
:root[data-theme="dark"] [style*="--cl:"] { --c:var(--co) }
* { box-sizing:border-box } [hidden] { display:none !important }
html, body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 var(--f-ui) }
a { color:inherit; text-decoration:none }
.top { display:flex; align-items:center; gap:8px 20px; flex-wrap:wrap; padding:12px clamp(16px,3vw,28px); background:var(--panel); border-bottom:1px solid var(--line) }
.logo { font:600 18px var(--f-math); white-space:nowrap } .logo i { color:var(--accent) }
.top nav { display:flex; gap:4px 14px; font-size:14px; color:var(--muted); overflow-x:auto; max-width:100%; scrollbar-width:none }
.top nav a { white-space:nowrap; padding:2px 0 } .top nav a:hover, .top nav a[aria-current] { color:var(--ink) } .top nav a[aria-current] { font-weight:600 }
.buscar { margin-left:auto; font:14px var(--f-ui); color:var(--ink); border:1px solid var(--line); border-radius:8px; padding:7px 12px; width:min(300px,100%); background:var(--bg) }
.top .foro { margin-left:auto; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; font:600 14px var(--f-ui); color:var(--ink); text-decoration:none; border:1px solid var(--line); border-radius:8px; padding:6px 12px } .top .foro:hover, .top .foro[aria-current] { border-color:var(--accent); color:var(--accent) } .foro + .buscar { margin-left:0 } .top > .foro ~ .tema { margin-left:0 }
.buscar:focus-visible, a:focus-visible { outline:2px solid var(--accent); outline-offset:1px }
main { max-width:1120px; margin:0 auto; padding:28px clamp(16px,3vw,28px) 40px }
h1 { font:600 clamp(24px,4vw,28px)/1.2 var(--f-ui); margin:0 0 6px } .sub { color:var(--muted); margin:0 0 24px; max-width:640px }
.ico { width:30px; height:30px; flex:0 0 auto; border-radius:8px; background:color-mix(in srgb,var(--c) 14%,transparent); color:var(--c); display:grid; place-items:center; font:italic 17px var(--f-math); white-space:nowrap }
.ico.s { width:24px; height:24px; border-radius:6px; font-size:13px }
.t { margin-left:auto; font-size:11px; font-weight:600; padding:2px 8px; border-radius:99px; white-space:nowrap; background:var(--bg); color:var(--muted) }
a .t { background:var(--c); color:var(--panel) }
.nada { color:var(--muted); font-style:italic }
/* portada: asignaturas en una barra lateral fija y, a la derecha, cada asignatura con sus herramientas */
.lay { display:grid; grid-template-columns:240px minmax(0,1fr); max-width:1280px; margin:0 auto }
.lado { position:sticky; top:0; align-self:start; max-height:100vh; overflow:auto; padding:22px 12px; border-right:1px solid var(--line) }
.lado h2 { font:600 11px var(--f-ui); letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin:4px 10px 8px }
.lado a { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:8px; font-size:14px }
.lado a:hover, .lado a.on { background:color-mix(in srgb,var(--c) 12%,transparent) } .lado a.on { font-weight:600 }
.lado a small { margin-left:auto; color:var(--muted); font-size:12px; font-variant-numeric:tabular-nums }
.lado .mas { margin-top:14px; border-top:1px solid var(--line); padding-top:12px }
.lay main { margin:0; max-width:none; padding-top:24px }
.asig { margin-bottom:30px; scroll-margin-top:16px }
.asig > header { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px }
.asig h2 { margin:0; font:600 19px var(--f-ui) } .asig header small { color:var(--muted); font-size:13px }
.ver { margin-left:auto; font-size:13px; color:var(--c); font-weight:600 } .ver:hover { text-decoration:underline }
.mini { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr)); gap:10px }
.mini > * { min-width:0; background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--c); border-radius:4px 10px 10px 4px; padding:10px 12px }
.mini a:hover { background:color-mix(in srgb,var(--c) 6%,var(--panel)); border-color:color-mix(in srgb,var(--c) 50%,var(--line)); border-left-color:var(--c) }
.mini b { display:block; font-weight:600; font-size:14px } .mini span { display:block; color:var(--muted); font-size:12.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.tuyo { margin-bottom:30px } .tuyo[hidden], #tu-espacio[data-q] { display:none }
.tuyo > header { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px } .tuyo h2 { margin:0; font:600 19px var(--f-ui) }
.tuyo h3 { margin:14px 0 8px; font:600 12px var(--f-ui); letter-spacing:.06em; text-transform:uppercase; color:var(--muted) }
.tuyo .olvida { margin-left:auto; font:500 13px var(--f-ui); color:var(--muted); background:none; border:0; cursor:pointer; text-decoration:underline } .tuyo .olvida:hover { color:var(--ink) }
.mini .seguir { border-left-width:5px } .mini .seguir span { color:var(--c); font-weight:600 }
.mini .off { color:var(--muted); border-style:dashed; border-left-style:solid; cursor:default }
.mini .pronto { font-style:normal; font-weight:600; color:var(--c) }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior:smooth } }
@media (max-width:760px) {
  .lay { grid-template-columns:minmax(0,1fr) }
  .lado { display:flex; gap:6px; overflow-x:auto; max-height:none; padding:8px 16px; border-right:0; border-bottom:1px solid var(--line); background:var(--bg); z-index:2; scrollbar-width:none }
  .lado h2 { display:none } .lado .mas { display:contents } .lado a { flex:0 0 auto; border:1px solid var(--line); border-radius:99px; padding:4px 10px 4px 4px; background:var(--panel) } .lado a small { display:none }
  .asig { scroll-margin-top:60px } .asig header small { display:none } body:has(.lado) .top nav { display:none } }
/* Liquid Glass (portada, asignaturas, novedades, foro y fenómenos): fondo con color detrás y superficies de vidrio translúcido */
:root { --vidrio:rgba(255,255,255,.55); --vidrio-fuerte:rgba(255,255,255,.72); --vidrio-borde:rgba(255,255,255,.7); --vidrio-brillo:inset 0 1px 0 rgba(255,255,255,.8);
  --vidrio-sombra:0 1px 2px rgba(20,40,60,.06),0 8px 28px rgba(20,40,60,.10); --blur:blur(22px) saturate(1.7); --halo1:rgba(13,107,102,.22); --halo2:rgba(42,93,181,.20); --halo3:rgba(107,63,160,.14) }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --vidrio:rgba(34,46,54,.50); --vidrio-fuerte:rgba(26,36,42,.70); --vidrio-borde:rgba(255,255,255,.12); --vidrio-brillo:inset 0 1px 0 rgba(255,255,255,.10);
  --vidrio-sombra:0 1px 2px rgba(0,0,0,.3),0 10px 32px rgba(0,0,0,.35); --halo1:rgba(77,188,176,.20); --halo2:rgba(116,162,242,.18); --halo3:rgba(170,120,230,.14) } }
:root[data-theme="dark"] { --vidrio:rgba(34,46,54,.50); --vidrio-fuerte:rgba(26,36,42,.70); --vidrio-borde:rgba(255,255,255,.12); --vidrio-brillo:inset 0 1px 0 rgba(255,255,255,.10);
  --vidrio-sombra:0 1px 2px rgba(0,0,0,.3),0 10px 32px rgba(0,0,0,.35); --halo1:rgba(77,188,176,.20); --halo2:rgba(116,162,242,.18); --halo3:rgba(170,120,230,.14) }
body { display:flow-root; background:radial-gradient(60% 50% at 8% 0%,var(--halo1),transparent 70%),radial-gradient(50% 45% at 95% 10%,var(--halo2),transparent 70%),radial-gradient(55% 50% at 60% 100%,var(--halo3),transparent 70%),var(--bg); background-attachment:fixed }
body .top { position:sticky; top:10px; z-index:10; margin:10px clamp(10px,2vw,20px) 0; border:1px solid var(--vidrio-borde); border-radius:22px; background:var(--vidrio-fuerte); box-shadow:var(--vidrio-brillo),var(--vidrio-sombra); -webkit-backdrop-filter:var(--blur); backdrop-filter:var(--blur) }
body .top .buscar, body .top .foro { border-radius:99px; border-color:var(--vidrio-borde); background:var(--vidrio) }
body .lado { margin:14px 0 0 clamp(10px,2vw,20px); top:84px; max-height:calc(100vh - 100px); border:1px solid var(--vidrio-borde); border-radius:22px; background:var(--vidrio); box-shadow:var(--vidrio-brillo),var(--vidrio-sombra); -webkit-backdrop-filter:var(--blur); backdrop-filter:var(--blur) }
body .lado a { border-radius:99px } body .lado .mas { border-top-color:var(--vidrio-borde) }
body .mini > * { background:var(--vidrio); border:1px solid var(--vidrio-borde); border-radius:16px; box-shadow:var(--vidrio-brillo),var(--vidrio-sombra); -webkit-backdrop-filter:var(--blur); backdrop-filter:var(--blur); transition:transform .18s ease,background .18s ease }
body .mini a:hover { background:var(--vidrio-fuerte); border-color:color-mix(in srgb,var(--c) 45%,var(--vidrio-borde)); transform:translateY(-2px) }
body .mini .off { background:transparent; box-shadow:none; -webkit-backdrop-filter:none; backdrop-filter:none; border-style:dashed }
body .card:not(.off), body .vers, body .obras { background:var(--vidrio); border:1px solid var(--vidrio-borde); border-radius:18px; box-shadow:var(--vidrio-brillo),var(--vidrio-sombra); -webkit-backdrop-filter:var(--blur); backdrop-filter:var(--blur) }
body a.card:hover { border-color:color-mix(in srgb,var(--c) 45%,var(--vidrio-borde)); transform:translateY(-2px) } body .card { transition:transform .18s ease }
body .vers::before { background:var(--bg) } body .filtro button { border-radius:99px; border-color:var(--vidrio-borde); background:var(--vidrio); -webkit-backdrop-filter:var(--blur); backdrop-filter:var(--blur) } body .filtro button[aria-pressed=true] { background:var(--c) }
body .t { background:var(--vidrio) } body a .t { background:var(--c) }
@media (max-width:760px) { body .top { position:static; padding:10px 14px; gap:8px 10px; border-radius:20px } body .top .buscar { order:5; flex:1 0 100%; width:100%; margin-left:0 } body .top .tema { margin-left:0 } body .lado { margin:8px 10px 0; top:8px; max-height:none; border-radius:99px; background:var(--vidrio-fuerte); z-index:9 }
  body .lado a { background:var(--vidrio) } body .mini > * { -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px) } }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) { body .top, body .lado, body .mini > *, body .card, body .vers, body .obras, body .filtro button { background:var(--panel); -webkit-backdrop-filter:none; backdrop-filter:none } }
@media (prefers-reduced-motion: reduce) { body .mini > * { transition:none } body .mini a:hover { transform:none } }
.crumb { font-size:13.5px; color:var(--muted); margin-bottom:10px } .crumb a { color:var(--accent) } .crumb a:hover { text-decoration:underline }
.cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr)); gap:14px }
.card { background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow:hidden; display:flex; flex-direction:column }
a.card:hover { border-color:var(--c) }
.card .img { height:110px; background:linear-gradient(135deg,color-mix(in srgb,var(--c) 16%,var(--panel)),var(--panel)); display:grid; place-items:center; font:italic 38px var(--f-math); color:var(--c) }
.fen-cards .card .img { height:auto; aspect-ratio:16/9 } .card .img img { width:100%; height:100%; object-fit:cover; display:block }
.card .b { padding:12px 14px 14px; display:flex; flex-direction:column; gap:4px; flex:1 } .card h2 { margin:0; font:600 16px var(--f-ui) } .card p { margin:0; color:var(--muted); font-size:13.5px }
.card .t { margin:8px 0 0; align-self:flex-start } .card.off { opacity:.65; border-style:dashed; cursor:default }
.obras { max-width:640px; margin:24px auto 0; text-align:center; background:var(--panel); border:1px dashed var(--line); border-radius:14px; padding:36px 24px }
.obras .ico { width:56px; height:56px; border-radius:14px; font-size:28px; margin:0 auto 14px; font-style:normal } .obras h1 { margin-bottom:8px } .obras p { color:var(--muted); margin:0 auto 10px; max-width:480px }
.obras a { color:var(--accent); font-weight:600 } .obras a:hover { text-decoration:underline }
/* «Física en la vida real»: bloque en cada asignatura e índice con filtro por asignatura */
.vida { margin-top:28px } .vida h2 { font:600 19px var(--f-ui); margin:0 0 4px } .vida > p { color:var(--muted); margin:0 0 12px; font-size:14px } .vida > p a { color:var(--accent); font-weight:600 } .vida > p a:hover { text-decoration:underline }
.filtro { display:flex; flex-wrap:wrap; gap:6px; margin:-8px 0 18px }
.filtro button { font:500 13px var(--f-ui); color:var(--ink); background:var(--panel); border:1px solid var(--line); border-radius:99px; padding:4px 12px; cursor:pointer }
.filtro button[aria-pressed=true] { background:var(--c); border-color:var(--c); color:var(--panel) }
.filtro button:focus-visible { outline:2px solid var(--accent); outline-offset:1px }
.etq { display:flex; flex-wrap:wrap; gap:4px; margin-top:4px } .etq span { font-size:11px; font-weight:600; padding:1px 8px; border-radius:99px; color:var(--c); background:color-mix(in srgb,var(--c) 12%,transparent) }
.otras { margin-top:32px; font-size:14px; color:var(--muted) } .otras a { color:var(--accent); margin-right:14px; white-space:nowrap } .otras a:hover { text-decoration:underline }
/* novedades: una línea de tiempo por días y, en ella, una tarjeta por versión con todos sus cambios */
:root { --nueva:#0d6b66; --mejora:#2a5db5; --arreglo:#9a5b00 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --nueva:#4dbcb0; --mejora:#74a2f2; --arreglo:#e6a640 } }
:root[data-theme="dark"] { --nueva:#4dbcb0; --mejora:#74a2f2; --arreglo:#e6a640 }
.tl { max-width:860px }
.dia { display:grid; grid-template-columns:96px minmax(0,1fr); gap:0 18px }
.fecha { text-align:right; padding-top:14px; font:600 13px var(--f-ui); color:var(--muted) } .fecha b { display:block; font:600 28px/1 var(--f-math); color:var(--ink) }
.linea { border-left:2px solid var(--line); padding:8px 0 22px 22px; display:flex; flex-direction:column; gap:12px; min-width:0 }
.vers { position:relative; background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:12px 16px 10px; scroll-margin-top:16px }
.vers::before { content:""; position:absolute; left:-30px; top:16px; width:12px; height:12px; border-radius:50%; background:var(--panel); border:3px solid var(--k) }
.vers > header { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin-bottom:4px }
.vers h2 { margin:0; font:600 20px var(--f-math) } .vers header small { color:var(--muted); font-size:12.5px }
.vers .actual { white-space:nowrap; font-size:11px; font-weight:700; color:var(--panel); background:var(--accent); border-radius:99px; padding:1px 8px }
.vers ul { list-style:none; margin:0; padding:0 }
.vers li { display:grid; grid-template-columns:24px minmax(0,1fr) auto; gap:4px 12px; align-items:start; padding:8px 0; border-top:1px solid var(--line); font-size:14px }
.vers li:first-child { border-top:0 }
.vers li .ico { margin-top:1px } .vers li b { font-weight:600 }
.vers li .ir { font-size:13px; font-weight:600; color:var(--c); white-space:nowrap } .vers li .ir:hover { text-decoration:underline }
.tipo { display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; padding:1px 8px; border-radius:99px; white-space:nowrap; margin-right:8px; vertical-align:1px }
.tipo::before { content:""; width:6px; height:6px; border-radius:50%; background:currentColor }
.tipo.nueva { color:var(--nueva); background:color-mix(in srgb,var(--nueva) 13%,transparent) }
.tipo.mejora { color:var(--mejora); background:color-mix(in srgb,var(--mejora) 13%,transparent) }
.tipo.arreglo { color:var(--arreglo); background:color-mix(in srgb,var(--arreglo) 15%,transparent) }
.sim { width:24px; height:24px; border-radius:6px; display:grid; place-items:center; font-weight:700; font-size:13px; color:var(--k); background:color-mix(in srgb,var(--k) 14%,transparent) }
.vers.grande { padding:22px 24px 14px; border-top:4px solid var(--k) }
.vers.grande > header { display:block; margin-bottom:6px } .vers.grande h2 { font:700 30px/1.15 var(--f-ui); letter-spacing:-.01em; display:inline; margin-right:10px } .vers.grande .actual { vertical-align:6px }
.vers.grande > header p { margin:8px 0 0; font-size:16px; color:var(--muted) }
.vers.grande section { border-top:1px solid var(--line); padding:14px 0 6px; margin-top:12px }
.vers.grande h3 { display:flex; align-items:center; gap:10px; margin:0 0 6px; font:700 18px var(--f-ui) } .vers.grande h3 span { width:32px; height:32px; border-radius:9px; display:grid; place-items:center; font-size:17px; background:color-mix(in srgb,var(--k) 13%,transparent) }
.vers.grande li { display:block; position:relative; padding:5px 0 5px 20px; border:0; font-size:14.5px; line-height:1.5 } .vers.grande li::before { content:""; position:absolute; left:6px; top:13px; width:6px; height:6px; border-radius:50%; background:var(--k) }
.vers.grande li.asig-n { padding:8px 0; border-top:1px dashed var(--line) } .vers.grande li.asig-n::before { display:none } .vers.grande li.asig-n:first-child { border-top:0 }
.asig-n .nom { display:inline-flex; align-items:center; gap:8px; color:var(--ink); margin-bottom:6px } .asig-n .nom small { font-size:11.5px; font-weight:700; color:var(--c); background:color-mix(in srgb,var(--c) 13%,transparent); border-radius:99px; padding:0 7px }
.vers.grande li.herr-n { padding:4px 0 } .vers.grande li.herr-n::before { display:none }
.herr-n a { display:flex; align-items:center; gap:12px; padding:10px 14px; border:1px solid color-mix(in srgb,var(--c) 35%,var(--line)); background:color-mix(in srgb,var(--c) 7%,transparent); border-radius:12px; color:var(--ink); text-decoration:none }
.herr-n a:hover { border-color:var(--c) } .herr-n .txt { flex:1; min-width:0; display:flex; flex-direction:column } .herr-n .txt b { font-size:15px } .herr-n .txt small { color:var(--muted); font-size:12.5px; line-height:1.4 } .herr-n .ir { font-weight:700; font-size:13px; color:var(--c); white-space:nowrap }
.chips { display:flex; flex-wrap:wrap; gap:6px } .chips a { font-size:13px; color:var(--ink); border:1px solid color-mix(in srgb,var(--c) 35%,var(--line)); background:color-mix(in srgb,var(--c) 6%,transparent); border-radius:99px; padding:2px 10px } .chips a:hover { color:var(--c); border-color:var(--c) }
.leyenda { display:flex; gap:8px; flex-wrap:wrap; margin:-10px 0 22px }
@media (max-width:600px) { .vers.grande { padding:18px 16px 10px } .vers.grande h2 { font-size:25px } .dia { grid-template-columns:minmax(0,1fr) } .fecha { text-align:left; padding:6px 0 2px } .fecha b { display:inline; font-size:18px; margin-right:6px } .linea { padding-left:18px } .vers::before { left:-26px } .vers li { grid-template-columns:24px minmax(0,1fr) } .vers li .ir { grid-column:2 } }
footer { text-align:center; font-size:12.5px; color:var(--muted); padding:0 16px 24px } footer a { margin:0 6px; white-space:nowrap } footer a:hover { color:var(--accent); text-decoration:underline }
`;

// con anuncios.js activo, un hueco al final de las páginas de asignatura y del índice de fenómenos
// (no en la portada, el foro ni las novedades)
const CON_ANUNCIO = [...Catalogo.asignaturas.map((a) => a.clave), V.clave];
function pagina({ titulo, desc, raiz, actual, cuerpo, buscar, script, pwa, ruta }) {
  const nav = [...Catalogo.asignaturas, V].map((a) => `<a href="${raiz}${a.clave}/"${a.clave === actual ? ' aria-current="page"' : ''}>${esc(a.corto || a.nombre)}</a>`).join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
${raiz === '' && Catalogo.google ? `<meta name="google-site-verification" content="${esc(Catalogo.google)}">\n` : ''}<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" type="image/svg+xml" href="${icono}">
<link rel="apple-touch-icon" href="${raiz}apple-touch-icon.png">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${Catalogo.web}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400&display=swap">
${Pwa.CABEZA(raiz)}
${Anuncios.cabeza()}<script>${Tema.SCRIPT}</script>
<style>${CSS}${Tema.CSS}${pwa ? Pwa.CSS : ''}</style>
</head>
<body>
<header class="top"><a class="logo" href="${raiz}">${esc(m1)}<i>${esc(m2)}</i></a>
<nav aria-label="Asignaturas"><a href="${raiz}"${actual ? '' : ' aria-current="page"'}>Inicio</a>${nav}</nav>
<a class="foro" href="${raiz}foro/"${actual === 'foro' ? ' aria-current="page"' : ''}><span aria-hidden="true">💬</span>Foro</a>
${buscar ? '<input type="search" id="buscar" class="buscar" placeholder="Buscar: Biot-Savart, molaridad…" aria-label="Buscar herramientas (atajo: barra /)" title="Atajo: / o Ctrl+K" autocomplete="off">' : ''}${Idiomas.BOTON({ raiz, ruta })}${Tema.BOTON}</header>
${cuerpo}
${CON_ANUNCIO.includes(actual) && Anuncios.hueco() ? `<div role="region" aria-label="Publicidad">${Anuncios.hueco()}</div>` : ''}${Anuncios.pie(`<footer><a href="${raiz}contacto.html">Contacto</a>·<a href="${raiz}aviso-legal.html">Aviso legal</a>·<a href="${raiz}privacidad.html">Privacidad</a>·<a href="${raiz}cookies.html">Cookies</a>· <a href="${raiz}novedades/">Versión ${esc(Version.de('web').current)}</a></footer>`)}
${Buscador.ETIQUETA(raiz)}\n${Llama.ETIQUETA(raiz)}\n${script ? `<script>${script}</script>\n` : ''}</body>
</html>
`;
}

const estilo = (a) => `--cl:${a.color};--co:${a.colorOscuro}`;
// ficha pequeña de un fenómeno (bloque «En la vida real» de cada asignatura)
const fichaFenomeno = (f, raiz) => (f.disponible
  ? `  <a href="${raiz}fenomenos/${f.clave}/" title="${esc(f.desc)}"><b>${esc(f.nombre)}</b><span>${esc(f.desc)}</span></a>`
  : `  <div class="off" title="${esc(f.desc)}"><b>${esc(f.nombre)}</b><span><i class="pronto">Próximamente</i> ${esc(f.desc)}</span></div>`);
const contar = (a) => {
  const n = disponibles(a).length, p = a.herramientas.length - n;
  return n ? `${n} herramientas${p ? ` · ${p} próximamente` : ''}` : 'en preparación';
};
const textoBusqueda = (a, h) => esc([a.nombre, h.nombre, h.desc, h.buscar || ''].join(' '));

// portada: barra lateral con las asignaturas y, a la derecha, una sección por asignatura con sus herramientas
const lado = `<aside class="lado" aria-label="Asignaturas"><h2>Asignaturas</h2>
${Catalogo.asignaturas.map((a) => `  <a href="#${a.clave}" style="${estilo(a)}"><span class="ico s">${esc(a.icono)}</span>${esc(a.nombre)}<small>${disponibles(a).length}</small></a>`).join('\n')}
  <div class="mas"><h2>La web</h2><a href="novedades/" style="--cl:#0d6b66;--co:#4dbcb0"><span class="ico s">↻</span>Novedades<small>${esc(Version.de('web').current)}</small></a>
  <a href="fenomenos/" style="${estilo(V)}"><span class="ico s">${esc(V.icono)}</span>${esc(V.nombre)}<small>${V.lista.filter((f) => f.disponible).length}</small></a></div></aside>`;
const secciones = Catalogo.asignaturas.map((a) => {
  const fichas = a.herramientas.map((h) => h.disponible
    ? `  <a href="${a.clave}/${h.clave}/" title="${esc(h.desc)}" data-buscar="${textoBusqueda(a, h)}"><b>${esc(h.nombre)}</b><span>${esc(h.desc)}</span></a>`
    : `  <div class="off" title="${esc(h.desc)}" data-buscar="${textoBusqueda(a, h)}"><b>${esc(h.nombre)}</b><span><i class="pronto">Próximamente</i> ${esc(h.desc)}</span></div>`).join('\n');
  return `<section class="asig" id="${a.clave}" style="${estilo(a)}"><header><span class="ico">${esc(a.icono)}</span><h2>${esc(a.nombre)}</h2><small>${contar(a)}</small><a class="ver" href="${a.clave}/">Ver la asignatura →</a></header>
<div class="mini">
${fichas}
</div></section>`;
}).join('\n');

// búsqueda en la portada: filtra herramientas sin distinguir mayúsculas ni tildes
const BUSCAR = `(() => {
  const q = document.getElementById('buscar'), nada = document.getElementById('nada');
  const norm = (s) => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  if (location.hash === '#novedades') location.replace('novedades/'); // enlaces antiguos a las novedades
  q.addEventListener('input', () => {
    const t = norm(q.value).split(/\\s+/).filter(Boolean);
    let hay = 0;
    for (const s of document.querySelectorAll('.asig')) {
      let n = 0;
      for (const f of s.querySelectorAll('[data-buscar]')) { const ok = t.every((p) => norm(f.dataset.buscar).includes(p)); f.hidden = !ok; n += ok; }
      s.hidden = !n; hay += n;
    }
    nada.hidden = !!hay;
    for (const a of document.querySelectorAll('.lado a[href^="#"]')) { const s = document.getElementById(a.hash.slice(1)); if (s?.classList.contains('asig')) a.hidden = s.hidden; }
  });
  // el buscador de la cabecera de las herramientas llega con ?q=
  const q0 = new URLSearchParams(location.search).get('q'); if (q0) { q.value = q0; q.dispatchEvent(new Event('input')); }
  // la barra lateral resalta la asignatura que está en pantalla
  const enlaces = [...document.querySelectorAll('.lado a[href^="#"]')], marca = (id) => { for (const a of enlaces) a.classList.toggle('on', a.hash === '#' + id); };
  // al pulsar un enlace se marca ese, aunque la página no pueda bajar tanto; al desplazarse a mano, la sección que está arriba
  const secs = [...document.querySelectorAll('.asig')]; let fijo = false;
  const mira = () => { if (fijo) return; let id = secs[0].id; for (const s of secs) if (!s.hidden && s.getBoundingClientRect().top < 140) id = s.id; marca(id); };
  for (const a of enlaces) a.addEventListener('click', () => { fijo = true; marca(a.hash.slice(1)); });
  for (const ev of ['wheel', 'touchstart', 'keydown']) addEventListener(ev, () => { fijo = false; }, { passive: true });
  addEventListener('scroll', mira, { passive: true }); mira();
})();`;

// «Tu espacio»: continuar, favoritas y últimas usadas (simu-recientes y simu-favoritos, que escribe personal.js en cada herramienta)
const FICHAS = {};
for (const a of Catalogo.asignaturas) for (const h of a.herramientas.filter((x) => x.disponible)) FICHAS[`${a.clave}/${h.clave}`] = [h.nombre, h.desc, estilo(a)];
for (const f of V.lista.filter((x) => x.disponible)) FICHAS[`fenomenos/${f.clave}`] = [f.nombre, f.desc, estilo(V)];
const ESPACIO = `(() => {
  const F = ${JSON.stringify(FICHAS).replace(/</g, '\\u003c')}, K_REC = 'simu-recientes', K_FAV = 'simu-favoritos';
  const sec = document.getElementById('tu-espacio'); if (!sec) return;
  const lee = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const hace = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 2 ? 'justo ahora' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : Math.round(m / 1440) === 1 ? 'ayer' : 'hace ' + Math.round(m / 1440) + ' días'; };
  const ficha = (r, extra) => { const f = F[r]; return f ? '<a href="' + r + '/" style="' + f[2] + '"' + (extra ? ' class="seguir"' : '') + '><b>' + esc(f[0]) + '</b><span>' + esc(extra || f[1]) + '</span></a>' : ''; };
  function pinta() {
    const rec = lee(K_REC).filter((x) => x && F[x.r]), fav = lee(K_FAV).filter((r) => F[r]);
    if (!rec.length && !fav.length) { sec.hidden = true; return; }
    let h = '<header><h2>Tu espacio</h2><small>Solo en este navegador</small><button type="button" class="olvida">Olvidar mis datos</button></header>';
    if (rec[0]) h += '<h3>Continúa donde lo dejaste</h3><div class="mini">' + ficha(rec[0].r, 'Abierta ' + hace(rec[0].t) + ' · sigue con tus datos') + '</div>';
    if (fav.length) h += '<h3>Favoritas</h3><div class="mini">' + fav.map((r) => ficha(r)).join('') + '</div>';
    const ult = rec.slice(1, 7).filter((x) => !fav.includes(x.r));
    if (ult.length) h += '<h3>Últimas usadas</h3><div class="mini">' + ult.map((x) => ficha(x.r)).join('') + '</div>';
    sec.innerHTML = h; sec.hidden = false;
    sec.querySelector('.olvida').addEventListener('click', () => { try { localStorage.removeItem(K_REC); localStorage.removeItem(K_FAV); } catch (e) { /* sin almacenamiento */ } pinta(); });
  }
  pinta();
  const q = document.getElementById('buscar');
  if (q) q.addEventListener('input', () => { if (q.value.trim()) sec.setAttribute('data-q', ''); else sec.removeAttribute('data-q'); });
})();`;

const archivos = { 'index.html': pagina({
  titulo: `${marca} · Simuladores y calculadoras por asignatura`,
  desc: Catalogo.lema, raiz: '', buscar: true, script: BUSCAR + '\n' + ESPACIO, pwa: true,
  cuerpo: `<div class="lay">
${lado}
<main>
<h1>Elige asignatura y herramienta</h1>
<p class="sub">${esc(Catalogo.lema)}</p>
<section class="tuyo" id="tu-espacio" hidden aria-label="Tu espacio"></section>
${secciones}
<p class="nada" id="nada" hidden>No hay ninguna herramienta con ese nombre todavía.</p>
${Pwa.BARRA}
</main>
</div>`,
}) };

// una página por asignatura con sus herramientas en tarjetas
for (const a of Catalogo.asignaturas) {
  const cards = a.herramientas.map((h) => {
    const dentro = `<div class="img" aria-hidden="true">${esc(h.icono)}</div><div class="b"><h2>${esc(h.nombre)}</h2><p>${esc(h.desc)}</p><span class="t">${h.disponible ? 'Abrir' : 'Próximamente'}</span></div>`;
    return h.disponible ? `<a class="card" href="${h.clave}/">${dentro}</a>` : `<div class="card off">${dentro}</div>`;
  }).join('\n');
  const otras = Catalogo.asignaturas.filter((b) => b !== a).map((b) => `<a href="../${b.clave}/">${esc(b.nombre)}</a>`).join('');
  const fen = V.lista.filter((f) => f.asignaturas.includes(a.clave)).sort((x, y) => y.disponible - x.disponible);
  const vida = fen.length ? `<section class="vida" style="${estilo(V)}"><h2>En la vida real</h2>
<p>Fenómenos que se explican con ${esc(a.nombre)}, paso a paso. <a href="../fenomenos/">Ver todos →</a></p>
<div class="mini">
${fen.map((f) => fichaFenomeno(f, '../')).join('\n')}
</div></section>\n` : '';
  archivos[`${a.clave}/index.html`] = pagina({
    titulo: `${a.nombre} · ${marca}`, desc: a.resumen, raiz: '../', actual: a.clave,
    cuerpo: `<main style="${estilo(a)}">
<div class="crumb"><a href="../">Inicio</a> / ${esc(a.nombre)}</div>
<h1>${esc(a.nombre)}</h1>
<p class="sub">${esc(a.resumen)}</p>
<div class="cards fen-cards">
${cards}
</div>
${vida}<p class="otras">Otras asignaturas: ${otras}</p>
</main>`,
  });
}

// foro: de momento solo una página que avisa de que está en construcción
archivos['foro/index.html'] = pagina({
  titulo: `Foro · ${marca}`, desc: `El foro de ${marca} para preguntar dudas y compartir ejercicios llegará pronto.`, raiz: '../', actual: 'foro',
  cuerpo: `<main style="--cl:#0d6b66;--co:#4dbcb0">
<div class="crumb"><a href="../">Inicio</a> / Foro</div>
<section class="obras"><span class="ico" aria-hidden="true">🚧</span>
<h1>Foro en construcción</h1>
<p>Muy pronto podrás preguntar tus dudas, ayudar a otros estudiantes y compartir ejercicios resueltos con las herramientas de la web.</p>
<p>Mientras tanto, <a href="../">vuelve al inicio</a> o mira las <a href="../novedades/">novedades</a>.</p>
</section>
</main>`,
});

// «Física en la vida real»: tarjetas de todos los fenómenos (primero los disponibles), con las asignaturas que tocan
// y un filtro por asignatura
{
  const asig = (k) => Catalogo.asignaturas.find((a) => a.clave === k);
  const usadas = Catalogo.asignaturas.filter((a) => V.lista.some((f) => f.asignaturas.includes(a.clave)));
  const cards = [...V.lista].sort((x, y) => y.disponible - x.disponible).map((f) => {
    const etq = f.asignaturas.map((k) => `<span style="${estilo(asig(k))}">${esc(asig(k).nombre)}</span>`).join('');
    const dentro = `<div class="img" aria-hidden="true">${f.disponible ? `<img src="${f.clave}/imagen.webp" alt="" width="640" height="360" loading="lazy">` : esc(f.icono)}</div><div class="b"><h2>${esc(f.nombre)}</h2><p>${esc(f.desc)}</p><div class="etq">${etq}</div><span class="t">${f.disponible ? 'Ver la explicación' : 'Próximamente'}</span></div>`;
    return f.disponible ? `<a class="card" href="${f.clave}/" data-asig="${f.asignaturas.join(' ')}">${dentro}</a>` : `<div class="card off" data-asig="${f.asignaturas.join(' ')}">${dentro}</div>`;
  }).join('\n');
  const FILTRO = `(() => {
  const bs = document.querySelectorAll('.filtro button');
  for (const b of bs) b.addEventListener('click', () => {
    for (const x of bs) x.setAttribute('aria-pressed', x === b);
    for (const c of document.querySelectorAll('.cards [data-asig]')) c.hidden = !!b.dataset.asig && !c.dataset.asig.split(' ').includes(b.dataset.asig);
  });
})();`;
  archivos['fenomenos/index.html'] = pagina({
    titulo: `${V.nombre} · ${marca}`, desc: V.resumen, raiz: '../', actual: V.clave, script: FILTRO, ruta: 'fenomenos/',
    cuerpo: `<main style="${estilo(V)}">
<div class="crumb"><a href="../">Inicio</a> / ${esc(V.nombre)}</div>
<h1>${esc(V.nombre)}</h1>
<p class="sub">${esc(V.resumen)}</p>
<div class="filtro" role="group" aria-label="Filtrar por asignatura"><button type="button" aria-pressed="true" data-asig="">Todas</button>${usadas.map((a) => `<button type="button" aria-pressed="false" data-asig="${a.clave}">${esc(a.nombre)}</button>`).join('')}</div>
<div class="cards fen-cards">
${cards}
</div>
</main>`,
  });
}

// novedades: una página propia con una línea de tiempo por días y una tarjeta por versión con todos sus cambios.
// El tipo de cada cambio sale de la nota: «Nueva herramienta: X, en Y.» es una herramienta nueva (con enlace),
// una versión con tercer número (0.20.1) es un arreglo, lo de una versión mayor (1.0) es una novedad y lo demás es una mejora.
{
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const raizNombre = (n) => norm(n).split(/[:(,]/)[0].trim();
  const herramienta = (nombre, asig) => {
    const n = norm(nombre), donde = Catalogo.asignaturas.filter((a) => norm(a.nombre) === norm(asig));
    const todas = [...donde, ...Catalogo.asignaturas].flatMap((a) => a.herramientas.filter((x) => x.disponible).map((h) => ({ a, h })));
    const x = todas.find(({ h }) => n.includes(raizNombre(h.nombre))) || todas.find(({ h }) => norm(h.nombre).includes(raizNombre(nombre)));
    if (x) return x;
    // nombres que han cambiado de orden («Condensadores con dieléctricos»): las mismas palabras largas
    const largas = (t) => norm(t).split(/[^a-zñ]+/).filter((w) => w.length > 4);
    for (const a of donde) for (const h of a.herramientas.filter((x) => x.disponible)) if (largas(nombre).filter((w) => largas(h.nombre).includes(w)).length >= 2) return { a, h };
    return null;
  };
  const SIM = { nueva: '★', mejora: '+', arreglo: '✓' }, ETIQUETA = { nueva: 'Novedad', mejora: 'Mejora', arreglo: 'Arreglo' }, COLOR = { nueva: 'var(--nueva)', mejora: 'var(--mejora)', arreglo: 'var(--arreglo)' };
  const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const web = Version.de('web'), dias = new Map();
  for (const r of web.log) { if (!dias.has(r.fecha)) dias.set(r.fecha, []); dias.get(r.fecha).push(r); }
  // versión con secciones: cabecera grande con título y subtítulo, y un bloque por sección con sus puntos
  const negrita = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  // «#asignatura/herramienta» (o «#fenomenos/fenomeno»): tarjeta con el icono, el nombre, lo que hace y un enlace para abrirla
  const tarjetaHerr = (p) => {
    const [ac, hc] = p.slice(1).split('/'), a = ac === 'fenomenos' ? Catalogo.fenomenos : Catalogo.asignaturas.find((x) => x.clave === ac), h = (a?.herramientas || a?.lista)?.find((x) => x.clave === hc && x.disponible);
    if (!h) throw new Error(`Novedades: no hay una herramienta disponible «${p}»`);
    return `<li class="herr-n" style="${estilo(a)}"><a href="../${a.clave}/${h.clave}/"><span class="ico s">${esc(h.icono)}</span><span class="txt"><b>${esc(h.nombre)}</b><small>${esc(a.nombre)} · ${esc(h.desc)}</small></span><span class="ir">Abrir →</span></a></li>`;
  };
  const punto = (p) => {
    if (p.startsWith('#')) return tarjetaHerr(p);
    const a = p.startsWith('@') && Catalogo.asignaturas.find((x) => x.clave === p.slice(1));
    if (!a) return `<li>${negrita(p)}</li>`;
    const hs = disponibles(a);
    return `<li class="asig-n" style="${estilo(a)}"><a class="nom" href="../${a.clave}/"><span class="ico s">${esc(a.icono)}</span><b>${esc(a.nombre)}</b><small>${hs.length}</small></a><span class="chips">${hs.map((h) => `<a href="../${a.clave}/${h.clave}/">${esc(h.nombre)}</a>`).join('')}</span></li>`;
  };
  const grande = (r) => `<article class="vers grande" id="v${r.v}" style="--k:var(--nueva)"><header><h2>${esc(r.titulo)}</h2>${r.v === web.current ? '<span class="actual">Versión actual</span>' : ''}<p>${esc(r.subtitulo)}</p></header>
${r.secciones.map((x) => `<section><h3><span>${x.icono}</span>${esc(x.titulo)}</h3><ul>${x.puntos.map(punto).join('')}</ul></section>`).join('\n')}</article>`;
  const tarjeta = (r) => {
    if (r.secciones) return grande(r);
    const cambios = r.cambios.map((c) => {
      const m = c.match(/^Nueva herramienta: (.+?), en (.+?)\.$/), tipo = m || /\.0$/.test(r.v) ? 'nueva' : r.v.split('.').length > 2 ? 'arreglo' : 'mejora';
      if (m) {
        const x = herramienta(m[1], m[2]);
        return x
          ? `<li style="${estilo(x.a)}"><span class="ico s">${esc(x.h.icono)}</span><span><span class="tipo nueva">Nueva herramienta</span><b>${esc(x.h.nombre)}</b>, en ${esc(x.a.nombre)}</span><a class="ir" href="../${x.a.clave}/${x.h.clave}/">Abrir →</a></li>`
          : `<li style="--k:var(--nueva)"><span class="sim">★</span><span><span class="tipo nueva">Nueva herramienta</span><b>${esc(m[1])}</b>, en ${esc(m[2])}</span></li>`;
      }
      return { tipo, html: `<li style="--k:${COLOR[tipo]}"><span class="sim">${SIM[tipo]}</span><span><span class="tipo ${tipo}">${ETIQUETA[tipo]}</span>${esc(c)}</span></li>` };
    });
    const tipos = cambios.map((c) => (typeof c === 'string' ? 'nueva' : c.tipo));
    const k = COLOR[tipos.includes('nueva') ? 'nueva' : tipos.includes('mejora') ? 'mejora' : 'arreglo'];
    return `<article class="vers" id="v${r.v}" style="--k:${k}"><header><h2>${esc(r.v)}</h2>${r.v === web.current ? '<span class="actual">Versión actual</span>' : ''}<small>${r.cambios.length === 1 ? '1 cambio' : `${r.cambios.length} cambios`}</small></header>
<ul>${cambios.map((c) => (typeof c === 'string' ? c : c.html)).join('')}</ul></article>`;
  };
  const linea = [...dias].map(([f, rs]) => { const [y, m, d] = f.split('-'); return `<div class="dia"><div class="fecha"><b>${+d}</b>${MES[m - 1]} ${y}</div><div class="linea">
${rs.map(tarjeta).join('\n')}
</div></div>`; }).join('\n');
  archivos['novedades/index.html'] = pagina({
    titulo: `Novedades · ${marca}`, desc: `Lo último que ha llegado a ${marca}: herramientas nuevas, mejoras y arreglos, versión a versión.`, raiz: '../', actual: 'novedades',
    cuerpo: `<main>
<div class="crumb"><a href="../">Inicio</a> / Novedades</div>
<h1>Novedades</h1>
<p class="sub">Lo último que ha llegado a la web, de lo más nuevo a lo más antiguo. Estás viendo la versión ${esc(web.current)}.</p>
${web.log.some((r) => !r.secciones) ? '<div class="leyenda"><span class="tipo nueva">Nueva herramienta</span><span class="tipo mejora">Mejora</span><span class="tipo arreglo">Arreglo</span></div>' : ''}
<div class="tl">
${linea}
</div>
</main>`,
  });
}

// direcciones antiguas: una página que lleva a la nueva (por si se abre sin servidor) y las reglas 301
const redir = Catalogo.redirecciones || {};
for (const [vieja, nueva] of Object.entries(redir)) {
  const sube = '../'.repeat(vieja.split('/').filter(Boolean).length), destino = sube + nueva;
  archivos[`${vieja}index.html`] = `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<title>Esta página se ha movido · ${esc(marca)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${destino}">
<meta http-equiv="refresh" content="0; url=${destino}">
<script>location.replace(${JSON.stringify(destino)} + location.search + location.hash)</script>
<p>Esta página se ha movido a <a href="${destino}">su nueva dirección</a>.</p>
</html>
`;
}
// páginas legales (fuente/legal/): las líneas data-sin-anuncios solo salen con los anuncios apagados y las
// data-con-anuncios solo con ellos encendidos (anuncios.js)
const legal = path.join(__dirname, 'legal'), quita = Anuncios.activos ? 'data-sin-anuncios' : 'data-con-anuncios';
for (const f of fs.readdirSync(legal)) archivos[f] = fs.readFileSync(path.join(legal, f), 'utf8').split('\n').filter((l) => !l.includes(quita)).join('\n').replace(/ data-(sin|con)-anuncios/g, '');
// ads.txt de AdSense, solo con anuncios.js activo (si no, se borra el que hubiera)
if (Anuncios.adsTxt()) archivos['ads.txt'] = Anuncios.adsTxt();
else fs.rmSync(path.join(publico, 'ads.txt'), { force: true });
// archivo de verificación de Google Search Console (catalogo.js → googleArchivo)
if (Catalogo.googleArchivo) archivos[`${Catalogo.googleArchivo}.html`] = `google-site-verification: ${Catalogo.googleArchivo}.html`;
// Cloudflare (Workers con assets) lee publico/_redirects; Vercel, vercel.json
archivos._redirects = Object.entries(redir).flatMap(([v, n]) => [`/${v} /${n} 301`, `/${v.replace(/\/$/, '')} /${n} 301`]).join('\n') + '\n';
const vercel = path.join(__dirname, '..', 'vercel.json'), conf = JSON.parse(fs.readFileSync(vercel, 'utf8'));
conf.redirects = Object.entries(redir).flatMap(([v, n]) => [`/${v.replace(/\/$/, '')}`, `/${v}`].map((source) => ({ source, destination: `/${n}`, permanent: true })));
fs.writeFileSync(vercel, JSON.stringify(conf, null, 2) + '\n');

// para Google: la lista de páginas (sitemap.xml), dónde está (robots.txt) y, en cada página, su dirección principal
// (canonical), para que la copia de Cloudflare no cuente como contenido duplicado. Las páginas de herramientas y
// fenómenos las escribe herramientas.js, y Electrostática build.sh, con la misma etiqueta.
const enlaces = ['', 'novedades/', ...Catalogo.asignaturas.flatMap((a) => [`${a.clave}/`, ...disponibles(a).map((h) => `${a.clave}/${h.clave}/`)]),
  'fenomenos/', ...V.lista.filter((f) => f.disponible).map((f) => `fenomenos/${f.clave}/`), 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html'];
archivos['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${enlaces.some((e) => Idiomas.SITEMAP(e, Catalogo.web)) ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>\n${enlaces.map((e) => `  <url><loc>${Catalogo.web}/${e}</loc>${Idiomas.SITEMAP(e, Catalogo.web) ? '\n    ' + Idiomas.SITEMAP(e, Catalogo.web).split('\n').join('\n    ') : ''}</url>`).join('\n')}\n</urlset>\n`;
archivos['robots.txt'] = `User-agent: *\nAllow: /\n\nSitemap: ${Catalogo.web}/sitemap.xml\n`;
const canonica = (f) => `${Catalogo.web}/${f.replace(/index\.html$/, '')}`;
for (const f of Object.keys(archivos)) if (f.endsWith('.html') && !archivos[f].includes('rel="canonical"'))
  archivos[f] = archivos[f].replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<link rel="canonical" href="${canonica(f)}">${Idiomas.HREFLANG(f.replace(/index\.html$/, ''), Catalogo.web) ? '\n' + Idiomas.HREFLANG(f.replace(/index\.html$/, ''), Catalogo.web) : ''}`);

archivos['buscador.js'] = Buscador.archivo();
// web instalable y sin conexión (pwa.js): manifiesto, service worker, su registro, la página sin conexión y los iconos
archivos._headers = '/sw.js\n  Cache-Control: no-cache\n/manifest.webmanifest\n  Cache-Control: no-cache\n/js/*\n  Cache-Control: public, max-age=31536000, immutable\n'; // Cloudflare (Vercel: vercel.json)
archivos['manifest.webmanifest'] = Pwa.manifiesto(); archivos['sw.js'] = Pwa.sw(); archivos['pwa.js'] = Pwa.cliente(); archivos['offline.html'] = Pwa.offline();
for (const [f] of Pwa.ICONOS) fs.copyFileSync(path.join(__dirname, 'pwa', f), path.join(publico, f));
archivos['llama.js'] = Llama.archivo();
// datos del contador de visitas (worker/contador.mjs): herramientas válidas y webs que pueden contar
fs.mkdirSync(path.join(__dirname, '..', 'worker'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'worker', 'rutas.mjs'), `/* Generado por fuente/portal.js desde catalogo.js: no se edita a mano. */\nexport const RUTAS = ${JSON.stringify(Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`)))};\nexport const ORIGENES = ${JSON.stringify([...new Set([Catalogo.web, Catalogo.conteo && new URL(Catalogo.conteo).origin, 'https://electromagnetismo-two.vercel.app'].filter(Boolean))])};\n`);
for (const [f, html] of Object.entries(archivos)) {
  fs.mkdirSync(path.dirname(path.join(publico, f)), { recursive: true });
  fs.writeFileSync(path.join(publico, f), html);
}

/* cifras de README.md y CLAUDE.md: se calculan del catálogo y de version.js (entre marcas), para no tocarlas a mano */
{
  const nTot = Catalogo.asignaturas.reduce((n, a) => n + disponibles(a).length, 0), nFen = V.lista.filter((f) => f.disponible).length;
  const ult = Version.registros.web[0], [ya, ym, yd] = ult.fecha.split('-'), mes = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][+ym - 1];
  const cifras = `| | |\n| --- | --- |\n| **${nTot}** herramientas | repartidas en ${Catalogo.asignaturas.length} asignaturas |\n| **${nFen}** fenómenos de «Física en la vida real» | animaciones que explican cosas cotidianas |\n| **Web ${ult.v}** | última versión (${+yd} ${mes} ${ya}) |\n`;
  const tabla = `| Asignatura | Herramientas | Próximamente |\n| --- | :-: | :-: |\n${Catalogo.asignaturas.map((a) => `| ${a.nombre} | ${disponibles(a).length} | ${a.herramientas.length - disponibles(a).length} |`).join('\n')}\n`;
  const pon = (f, fn) => { const r = path.join(__dirname, '..', f), t = fs.readFileSync(r, 'utf8'), n = fn(t); if (n !== t) fs.writeFileSync(r, n); };
  const entre = (t, ini, fin, nuevo) => t.replace(new RegExp(`(<!-- ${ini}:inicio[^\\n]*-->\\n)[\\s\\S]*?(<!-- ${fin}:fin -->)`), (_, a, b) => a + nuevo + b);
  pon('README.md', (t) => entre(entre(t, 'cifras', 'cifras', cifras), 'asignaturas', 'asignaturas', tabla));
  pon('CLAUDE.md', (t) => t.replace(/<!--n-->.*?<!--\/n-->/, `<!--n-->${nTot} herramientas disponibles en ${Catalogo.asignaturas.length} asignaturas<!--/n-->`));
}
