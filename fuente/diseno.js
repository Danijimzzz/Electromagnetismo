/* =====================================================================
   Diseño común de las herramientas: la misma cabecera que la portada
   (marca, asignaturas y buscador), el color de la asignatura como acento,
   la miga «Asignatura › Herramienta» con los botones Mis ejercicios (a la
   izquierda) y Modo práctica (a la derecha), y tarjetas iguales en todas.
   build.sh pasa cada pagina.html por aquí:
     node diseno.js ASIGNATURA < pagina.html > página con el diseño común
   Las reglas van después del <style> de cada página, así que mandan sobre él.
   ===================================================================== */
const Catalogo = require('./catalogo.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// los mismos tonos neutros que la portada; el acento es el de la asignatura
const css = (a) => `
:root { --bg:#eef1ee; --panel:#fff; --ink:#1a2128; --muted:#5b6670; --line:#d5dbd5; --accent:${a.color}; --accent-soft:color-mix(in srgb, ${a.color} 12%, #fff); --marca:#0d6b66 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#94a0a8; --line:#2a343b; --accent:${a.colorOscuro}; --accent-soft:color-mix(in srgb, ${a.colorOscuro} 16%, #182025); --marca:#4dbcb0; color-scheme:dark } }
:root[data-theme="dark"] { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#94a0a8; --line:#2a343b; --accent:${a.colorOscuro}; --accent-soft:color-mix(in srgb, ${a.colorOscuro} 16%, #182025); --marca:#4dbcb0; color-scheme:dark }
header.top { display:flex; align-items:center; gap:8px 20px; flex-wrap:wrap; padding:12px clamp(16px,3vw,28px); background:var(--panel); border-bottom:1px solid var(--line) }
header.top .logo { font:600 18px var(--f-math); white-space:nowrap; color:var(--ink); text-decoration:none } header.top .logo i { color:var(--marca) }
header.top nav { display:flex; gap:4px 16px; font-size:14px; overflow-x:auto; max-width:100%; scrollbar-width:none }
header.top nav a { white-space:nowrap; padding:2px 0; color:var(--muted); text-decoration:none } header.top nav a:hover { color:var(--ink) }
header.top nav a[aria-current] { color:var(--ink); font-weight:600; box-shadow:inset 0 -2px 0 var(--accent) }
header.top form { margin-left:auto; flex:0 1 260px; min-width:150px }
@media (min-width:701px) { header.top { flex-wrap:nowrap } header.top nav { min-width:0 } }
header.top .buscar { font:14px var(--f-ui); color:var(--ink); border:1px solid var(--line); border-radius:8px; padding:7px 12px; width:100%; background:var(--bg) }
header.top .buscar:focus-visible, header.top a:focus-visible { outline:2px solid var(--accent); outline-offset:1px }
.miga { display:flex; align-items:center; flex-wrap:wrap; gap:8px; font-size:13.5px; color:var(--muted); margin:0 0 10px }
.miga a { color:var(--accent); font-weight:600; text-decoration:none } .miga a:hover { text-decoration:underline }
.miga-ico { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:6px; background:var(--accent-soft); color:var(--accent); font:italic 600 13px var(--f-math) }
.miga-der { margin-left:auto; display:flex; gap:8px } .miga-izq:empty, .miga-der:empty { display:none }
.bib-btn, .prac-btn { border-radius:8px !important; padding:6px 12px !important }
.wrap { max-width:1300px }
h1 { font:600 24px/1.25 var(--f-ui) }
.card { border-radius:12px }
.card h2 { font:600 12px/1.4 var(--f-ui); text-transform:uppercase; letter-spacing:.06em; color:var(--muted) }
.destacado { box-shadow:none; border-color:var(--line); border-top:3px solid var(--accent) }
.destacado h2 { color:var(--accent) }
.resumen div { background:var(--accent-soft) }
.sep { color:var(--accent) }
@media (max-width:700px) { header.top form { display:none } h1 { font-size:21px } }
`;

function piezas(a, nombre) {
  const [m1, m2] = Catalogo.marca;
  const nav = Catalogo.asignaturas.map((x) => `<a href="../../${x.clave}/"${x === a ? ' aria-current="page"' : ''}>${esc(x.nombre)}</a>`).join('');
  const cab = `<header class="top"><a class="logo" href="../../">${m1}<i>${m2}</i></a><nav aria-label="Asignaturas"><a href="../../">Inicio</a>${nav}</nav>`
    + `<form action="../../" role="search"><input class="buscar" type="search" name="q" placeholder="Buscar: Biot-Savart, molaridad…" aria-label="Buscar herramientas"></form></header>`;
  const miga = `<nav class="miga" aria-label="Estás en"><span class="miga-izq"></span><span class="miga-ico" aria-hidden="true">${esc(a.icono)}</span><a href="../">${esc(a.nombre)}</a><span aria-hidden="true">›</span><span>${esc(nombre)}</span><span class="miga-der"></span></nav>`;
  return { cab, miga };
}

// El simulador de electrostática (shell.html) tiene su propia maqueta: la cabecera y la miga van arriba
// de la columna principal, a la derecha de su barra lateral, igual que en las demás herramientas.
function aplicaElectrostatica(html) {
  const a = Catalogo.asignaturas.find((x) => x.clave === 'electromagnetismo');
  const { cab, miga } = piezas(a, 'Electrostática');
  const extra = `
.main { padding-top:0 }
.main > header.top { margin:0 calc(-1 * max(16px, env(safe-area-inset-right, 0px))) 12px -20px }
.app.closed .main > header.top { margin-left:calc(-1 * max(16px, env(safe-area-inset-left, 0px))) }
.main > .miga { margin-bottom:8px }`;
  if (!/<a [^>]*a-inicio[^>]*>.*<\/a>\n?/.test(html) || !html.includes('<main class="main">')) throw new Error('diseno.js: shell.html no tiene la forma esperada');
  return html.replace(/[ \t]*<a [^>]*a-inicio[^>]*>.*<\/a>\n?/, '')
    .replace('<main class="main">', `<main class="main">\n${cab}\n${miga}`)
    .replace('<div class="app"', `<style>${css(a)}${extra}</style>\n<div class="app"`);
}

function aplica(html, clave) {
  if (clave === 'electrostatica') return aplicaElectrostatica(html);
  const a = Catalogo.asignaturas.find((x) => x.clave === clave);
  if (!a) throw new Error(`diseno.js: no hay asignatura «${clave}» en catalogo.js`);
  const m = html.match(/<header class="top">.*<\/header>/);
  if (!m) throw new Error('diseno.js: la página no tiene <header class="top">');
  // el nombre corto de la herramienta es el último tramo de la miga de antes
  const nombre = m[0].replace(/<\/span><\/header>$/, '').split(' / ').pop().replace(/<[^>]*>/g, '').trim();
  const { cab, miga } = piezas(a, nombre);
  return html.replace(m[0], cab).replace('<h1', miga + '\n<h1').replace(/^<body>/m, `<style>${css(a)}</style>\n<body>`);
}

if (typeof module !== 'undefined') module.exports = { aplica, css };
if (typeof require !== 'undefined' && require.main === module) {
  let txt = ''; process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { txt += d; }).on('end', () => process.stdout.write(aplica(txt, process.argv[2])));
}
