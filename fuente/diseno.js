/* =====================================================================
   Diseño común de las herramientas: la misma cabecera que la portada
   (marca, asignaturas y buscador), el color de la asignatura como acento,
   la miga «Asignatura › Herramienta» con los botones Mis ejercicios (a la
   izquierda) y Modo práctica (a la derecha), y tarjetas iguales en todas.
   build.sh pasa cada pagina.html por aquí:
     node diseno.js ASIGNATURA < pagina.html > página con el diseño común
   La hoja común (estilos.css) va antes del <style> de cada página, que solo ajusta sus
   variables o añade lo propio (ver DISENO.md).
   Los fenómenos de «Física en la vida real» pasan por aquí con ASIGNATURA = fenomenos
   (su color, su miga y fenomenos/estilos.css). Cada herramienta lleva al final el
   bloque «En la vida real» con los fenómenos disponibles que la usan, y todas
   (fenómenos también) el de «Herramientas relacionadas» (o «Más fenómenos»):
     node diseno.js ASIGNATURA HERRAMIENTA < pagina.html
   ===================================================================== */
const Limites = require('./limites.js'), Catalogo = require('./catalogo.js'), Tema = require('./tema.js'), Idiomas = require('./idiomas.js'), Accesibilidad = require('./accesibilidad.js'), Buscador = require('./buscador.js'), Llama = require('./llama.js'), Anuncios = require('./anuncios.js'), Pwa = require('./pwa.js'), Preguntas = require('./preguntas.js'), Imprimir = require('./imprimir-css.js'), Version = require('./version.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Hoja común de las herramientas (estilos.css) y la cabecera del portal, que comparten con el simulador de
// electrostática. El acento es el color de la asignatura; los tonos neutros son los de la portada.
const ESTILOS = require('fs').readFileSync(require('path').join(__dirname, 'estilos.css'), 'utf8');
const ESTILOS_FENOMENOS = require('fs').readFileSync(require('path').join(__dirname, 'fenomenos', 'estilos.css'), 'utf8');
const V = Catalogo.fenomenos;
const acento = (a) => `
:root { --accent:${a.color}; --accent-soft:color-mix(in srgb, ${a.color} 12%, #fff); --marca:#0d6b66 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --accent:${a.colorOscuro}; --accent-soft:color-mix(in srgb, ${a.colorOscuro} 16%, #182025); --marca:#4dbcb0 } }
:root[data-theme="dark"] { --accent:${a.colorOscuro}; --accent-soft:color-mix(in srgb, ${a.colorOscuro} 16%, #182025); --marca:#4dbcb0 }`;
const cabecera = `
header.top { display:flex; align-items:center; gap:8px 20px; flex-wrap:wrap; padding:12px clamp(16px,3vw,28px); position:sticky; top:10px; z-index:10; margin:10px clamp(10px,2vw,20px) 0; border:1px solid var(--vidrio-borde); border-radius:22px; background:var(--vidrio-fuerte); box-shadow:var(--vidrio-brillo),var(--vidrio-sombra); -webkit-backdrop-filter:var(--blur); backdrop-filter:var(--blur) }
header.top .logo { font:600 18px var(--f-math); margin:0; white-space:nowrap; color:var(--ink); text-decoration:none } header.top .logo i { color:var(--marca) }
header.top nav { display:flex; gap:4px 14px; font-size:14px; overflow-x:auto; max-width:100%; scrollbar-width:none }
header.top nav a { white-space:nowrap; padding:2px 0; color:var(--muted); text-decoration:none } header.top nav a:hover { color:var(--ink) }
header.top nav a[aria-current] { color:var(--ink); font-weight:600; box-shadow:inset 0 -2px 0 var(--accent) }
header.top form { margin-left:auto; flex:0 1 170px; min-width:130px }
header.top .foro { margin-left:auto; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; font:600 14px var(--f-ui); color:var(--ink); text-decoration:none; border:1px solid var(--vidrio-borde); background:var(--vidrio); border-radius:99px; padding:6px 12px } header.top .foro:hover, header.top .foro[aria-current] { border-color:var(--accent); color:var(--accent) } header.top .foro + form { margin-left:0 } header.top > .foro ~ .tema { margin-left:0 }
@media (min-width:701px) { header.top { flex-wrap:nowrap } header.top nav { min-width:0 } }
header.top .buscar { font:14px var(--f-ui); color:var(--ink); border:1px solid var(--vidrio-borde); border-radius:99px; padding:7px 14px; width:100%; background:var(--vidrio) }
header.top .buscar:focus-visible, header.top a:focus-visible { outline:2px solid var(--accent); outline-offset:1px }
.miga { display:flex; align-items:center; flex-wrap:wrap; gap:8px; font-size:13.5px; color:var(--muted); margin:0 0 10px }
.miga a { color:var(--accent); font-weight:600; text-decoration:none } .miga a:hover { text-decoration:underline }
.miga-ico { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:6px; background:var(--accent-soft); color:var(--accent); font:italic 600 13px var(--f-math) }
.miga-der { margin-left:auto; display:flex; gap:8px } .miga-izq:empty, .miga-der:empty { display:none }
.bib-btn, .prac-btn { border-radius:8px !important; padding:6px 12px !important }
body.bib-ejemplos select[id^="ejemplo"] { display:none }
@media print { header.top, .miga, .prac-btn { display:none !important } }
:root { --vida:${V.color} }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --vida:${V.colorOscuro} } }
:root[data-theme="dark"] { --vida:${V.colorOscuro} }
.relacionadas { max-width:860px; margin:16px 0 0; background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--accent); border-radius:4px 12px 12px 4px; padding:12px 16px }
.relacionadas h2 { font:600 12px/1.4 var(--f-ui); text-transform:uppercase; letter-spacing:.06em; color:var(--accent); margin:0 0 4px }
.relacionadas a { display:flex; gap:10px; align-items:baseline; padding:5px 0; color:var(--ink); text-decoration:none; font-size:14px }
.relacionadas a b { font-weight:600; white-space:nowrap } .relacionadas a span { color:var(--muted) } .relacionadas a:hover b { color:var(--accent); text-decoration:underline }
.vida-real { max-width:860px; margin:28px 0 0; background:var(--panel); border:1px solid var(--line); border-left:3px solid var(--vida); border-radius:4px 12px 12px 4px; padding:12px 16px }
.vida-real h2 { font:600 12px/1.4 var(--f-ui); text-transform:uppercase; letter-spacing:.06em; color:var(--vida); margin:0 0 4px }
.vida-real a { display:flex; gap:10px; align-items:baseline; padding:5px 0; color:var(--ink); text-decoration:none; font-size:14px }
.vida-real a b { font-weight:600; white-space:nowrap } .vida-real a span { color:var(--muted) } .vida-real a:hover b { color:var(--vida); text-decoration:underline }
@media (max-width:600px) { .vida-real a, .relacionadas a { display:block } .vida-real a b, .relacionadas a b { display:block; white-space:normal } }
@media (max-width:700px) { header.top form { display:none } h1 { font-size:21px }
  .miga-izq, .miga-der, .miga::after { order:-1 } .miga::after { content:''; flex-basis:100%; height:0 } }
${Tema.CSS}${Imprimir.CSS}`;
// el simulador de electrostática no usa estilos.css: solo los colores, la cabecera y el aspecto de sus tarjetas
const css = (a) => `
:root { --bg:#eef1ee; --panel:#fff; --ink:#1a2128; --muted:#5b6670; --line:#d5dbd5 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#a3aeb5; --line:#2a343b; color-scheme:dark } }
:root[data-theme="dark"] { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#a3aeb5; --line:#2a343b; color-scheme:dark }${acento(a)}
.wrap { max-width:1300px }
h1 { font:600 24px/1.25 var(--f-ui) }
.card { border-radius:12px }
.card h2 { font:600 12px/1.4 var(--f-ui); text-transform:uppercase; letter-spacing:.06em; color:var(--muted) }
.destacado { box-shadow:none; border-color:var(--line); border-top:3px solid var(--accent) }
.destacado h2 { color:var(--accent) }
.resumen div { background:var(--accent-soft) }
.sep { color:var(--accent) }${cabecera}`;

// «Informar de un error»: enlace de correo con la herramienta en el asunto y su ruta en el cuerpo (el pie de todas las herramientas)
const enlaceError = (nombre, clave, herramienta) => `<a href="mailto:${Catalogo.correo}?subject=${encodeURIComponent('Error en ' + nombre)}&amp;body=${encodeURIComponent('Herramienta: ' + nombre + ' (' + clave + '/' + herramienta + ')\n\nQué esperaba y qué ha pasado:\n')}">Informar de un error</a>`;

function piezas(a, nombre, ruta) {
  const [m1, m2] = Catalogo.marca;
  const nav = [...Catalogo.asignaturas, V].map((x) => `<a href="../../${x.clave}/"${x === a ? ' aria-current="page"' : ''}>${esc(x.corto || x.nombre)}</a>`).join('');
  const cab = `<header class="top"><a class="logo" href="../../">${m1}<i>${m2}</i></a><nav aria-label="Asignaturas"><a href="../../">Inicio</a>${nav}</nav>`
    + `<a class="foro" href="../../foro/"><span aria-hidden="true">💬</span>Foro</a><form action="../../" role="search"><input class="buscar" type="search" name="q" placeholder="Buscar: Biot-Savart, molaridad…" aria-label="Buscar herramientas (atajo: barra /)" title="Atajo: / o Ctrl+K"></form>${Idiomas.BOTON({ raiz: '../../', ruta })}${Tema.BOTON}</header>`;
  const miga = `<nav class="miga" aria-label="Estás en"><span class="miga-izq"></span><span class="miga-ico" aria-hidden="true">${esc(a.icono)}</span><a href="../">${esc(a.nombre)}</a><span aria-hidden="true">›</span><span>${esc(nombre)}</span><span class="miga-der"></span></nav>`;
  return { cab, miga };
}

// «En la vida real»: los fenómenos disponibles que se calculan con esta herramienta ('asignatura/clave')
function vidaReal(herramienta) {
  const fs = V.lista.filter((f) => f.disponible && f.herramientas.includes(herramienta));
  if (!fs.length) return '';
  return `<section class="vida-real" aria-label="En la vida real"><h2>En la vida real</h2>\n${fs.map((f) => `<a href="../../fenomenos/${f.clave}/"><b>${esc(f.nombre)} →</b><span>${esc(f.desc)}</span></a>`).join('\n')}\n</section>\n`;
}

// «Herramientas relacionadas»: las 4 disponibles más cercanas en el orden del catálogo, de la misma asignatura
// (en los fenómenos, «Más fenómenos» con 3), para que Google y quien entra pasen de una página a otra
function relacionadas(clave, herramienta) {
  const fenomeno = clave === V.clave, lista = (fenomeno ? V.lista : Catalogo.asignaturas.find((x) => x.clave === clave).herramientas).filter((h) => h.disponible);
  const i = lista.findIndex((h) => h.clave === herramienta);
  if (i < 0 || lista.length < 2) return '';
  const cercanas = [...new Set([1, 2, -1, -2, 3].map((d) => lista[(i + d + lista.length) % lista.length]))].filter((h) => h !== lista[i]).map((h) => ({ h, href: `../${h.clave}/` }));
  // enlaces cruzados con herramientas parecidas de otras asignaturas (preguntas.js), primero
  const cruzadas = fenomeno ? [] : (Preguntas.ENLACES[herramienta] || []).map((r) => {
    const [as, cl] = r.split('/'), h = Catalogo.asignaturas.find((x) => x.clave === as)?.herramientas.find((x) => x.clave === cl);
    return h && h.disponible && as !== clave ? { h, href: `../../${as}/${cl}/` } : null;
  }).filter(Boolean);
  const propias = (Preguntas.ENLACES[herramienta] || []).filter((r) => r.startsWith(clave + '/')).map((r) => cercanas.find((c) => c.h.clave === r.split('/')[1])).filter(Boolean);
  const elegidas = [...new Set([...cruzadas.slice(0, 2), ...propias, ...cercanas])].slice(0, fenomeno ? 3 : 4);
  return `<section class="relacionadas" aria-label="${fenomeno ? 'Más fenómenos' : 'Herramientas relacionadas'}"><h2>${fenomeno ? 'Más fenómenos' : 'Herramientas relacionadas'}</h2>\n${elegidas.map(({ h, href }) => `<a href="${href}"><b>${esc(h.nombre)} →</b><span>${esc(h.desc)}</span></a>`).join('\n')}\n</section>\n`;
}

// Texto del simulador de electrostática para quien llega desde un buscador (electrostatica-teoria.html)
const TEORIA_ELECTRO = require('fs').readFileSync(require('path').join(__dirname, 'electrostatica-teoria.html'), 'utf8').replace(/^<!--.*-->\n/, '');

// El simulador de electrostática (shell.html) tiene su propia maqueta. En la web se le da la de las demás
// herramientas: cabecera a lo ancho, contenido centrado con márgenes, la miga con «Mis ejercicios» a la
// izquierda (biblioteca.js la rellena: es la misma barra que en las demás, sin barra propia desde la 1.20.1)
// y «Modo práctica» a la derecha, y el título encima de los botones. La versión privada (artifact) no pasa por aquí.
function aplicaElectrostatica(html) {
  const a = Catalogo.asignaturas.find((x) => x.clave === 'electromagnetismo');
  const { cab, miga } = piezas(a, 'Electrostática', 'electromagnetismo/electrostatica/');
  const extra = `
.main, .app:not(.closed) .main { padding:0 }
.app, .app.closed { display:block !important }
footer { text-align:center; font-size:12.5px; color:var(--muted); padding:20px 16px 8px } footer a { color:var(--muted); margin:0 6px; white-space:nowrap; display:inline-block }
.main > .wrap { max-width:1300px; margin:0 auto; padding:16px clamp(16px,3vw,24px) 32px }
.miga-der .toggle { font:600 13.5px var(--f-ui); border-radius:8px; padding:6px 12px; gap:6px }
.miga-der .toggle input { position:absolute; opacity:0; width:1px; height:1px; pointer-events:none }
.miga-der .toggle:has(input:checked) { background:var(--accent); border-color:var(--accent); color:var(--panel) }
.miga-der .toggle:has(input:focus-visible) { outline:2px solid var(--accent); outline-offset:1px }
.main .top { margin-bottom:12px }
.main .top .title-in { font:600 24px/1.25 var(--f-ui); flex:1 1 300px; margin-left:-8px }
.main .top .tools { flex-basis:100% }
@media (max-width:700px) { .main .top .title-in { font-size:21px } }
.solo-lector { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap }
.teoria, .preguntas { margin-top:28px; max-width:860px; font-size:15px; line-height:1.6; color:var(--ink) }
.teoria h2, .preguntas h2 { font:600 19px var(--f-ui); margin:24px 0 6px } .preguntas h3 { font:600 15px var(--f-ui); margin:14px 0 2px } .preguntas p { margin:0 } .teoria ul { padding-left:20px } .teoria li { margin-bottom:4px }
.limites { margin-top:28px; max-width:860px; font-size:15px; line-height:1.6; padding:12px 18px 14px; background:var(--panel); border:1px solid var(--line); border-left:4px solid var(--accent); border-radius:8px } .limites h2 { font:600 17px var(--f-ui); margin:0 0 6px } .limites ul { margin:0; padding-left:20px } .limites li + li { margin-top:4px }
.teoria .f { font-size:16px; background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:8px 12px; display:inline-block; max-width:100%; overflow-x:auto }`;
  const btnLado = /[ \t]*<button id="side-open"[^>]*>.*<\/button>\n?/, practica = /<label class="toggle"[^>]*><input type="checkbox" id="practice"> Modo práctica<\/label>/;
  const lateral = /<aside class="side"[\s\S]*?<\/aside>\n?/, scrim = /[ \t]*<div class="scrim" id="scrim"><\/div>\n?/, inicio = /[ \t]*<a [^>]*a-inicio[^>]*>.*<\/a>\n?/;
  for (const r of [inicio, btnLado, practica, lateral, scrim])
    if (!r.test(html)) throw new Error(`diseno.js: shell.html no tiene la forma esperada (${r})`);
  if (!html.includes('<main class="main">') || !html.includes('</main>')) throw new Error('diseno.js: shell.html no tiene <main class="main">');
  const prac = html.match(practica)[0].replace('> Modo práctica<', '><span aria-hidden="true">✎</span> Modo práctica<');
  const migaE = miga
    .replace('<span class="miga-izq"></span>', '<span class="miga-izq"></span>')
    .replace('<span class="miga-der"></span>', `<span class="miga-der">${prac}</span>`);
  // el pie de las demás herramientas (enlaces legales y «Informar de un error»): antes solo estaba en la barra lateral, que en móvil queda fuera de pantalla
  const pie = `<footer><a href="../../">Inicio</a>·<a href="../../contacto.html">Contacto</a>·${enlaceError('Electrostática', 'electromagnetismo', 'electrostatica')}·<a href="../../aviso-legal.html">Aviso legal</a>·<a href="../../privacidad.html">Privacidad</a>·<a href="../../cookies.html">Cookies</a>· <button id="ver" class="linkbtn" title="Ver las novedades">Electrostática <span class="ver-n"></span></button></footer>\n`;
  return html.replace(lateral, '').replace(scrim, '').replace(inicio, '').replace(btnLado, '').replace(practica, '')
    .replace('<main class="main">', `<main class="main">\n${cab}\n<div class="wrap">\n<h1 class="solo-lector">Simulador de electrostática</h1>\n${migaE}`).replace('</main>', `${TEORIA_ELECTRO}${Preguntas.html('electrostatica')}${Anuncios.hueco()}${vidaReal('electromagnetismo/electrostatica')}${relacionadas('electromagnetismo', 'electrostatica')}</div>\n${pie}</main>\n`)
    .replace('<div class="app"', `<style>${css(a)}${extra}${Imprimir.PAGINA(Catalogo.web.replace(/^https?:\/\//, '') + '/electromagnetismo/electrostatica/', Version.registros.electrostatica[0].v)}</style>\n<div class="app"`);
}

// con anuncios.js activo: su código en la cabeza, «Preferencias de cookies» en el pie y los huecos (en las
// herramientas, además, el lateral bajo los datos y dos más repartidos por la teoría)
function aplica(html, clave, herramienta) {
  return Pwa.CABEZA('../../') + '\n' + Anuncios.cabeza() + (clave === 'electrostatica' || clave === V.clave ? '' : Anuncios.lateral()) + `<script>${Tema.SCRIPT}</script>
<script>${Accesibilidad.SCRIPT}</script>
${Buscador.ETIQUETA('../../')}
${Llama.ETIQUETA('../../')}
` + Anuncios.pie(clave === 'electrostatica' ? aplicaElectrostatica(html) : aplicaHerramienta(html, clave, herramienta));
}

function aplicaHerramienta(html, clave, herramienta) {
  const a = clave === V.clave ? V : Catalogo.asignaturas.find((x) => x.clave === clave);
  if (!a) throw new Error(`diseno.js: no hay asignatura «${clave}» en catalogo.js`);
  const m = html.match(/<header class="top">.*<\/header>/);
  if (!m) throw new Error('diseno.js: la página no tiene <header class="top">');
  // el nombre corto de la herramienta es el último tramo de la miga de antes
  const nombre = m[0].replace(/<\/span><\/header>$/, '').split(' / ').pop().replace(/<[^>]*>/g, '').trim();
  const { cab, miga } = piezas(a, nombre, `${clave}/${herramienta}/`);
  // la hoja común va antes del <style> de la página, para que la página pueda ajustar sus variables
  if (!/^<style>/m.test(html)) throw new Error('diseno.js: la página no tiene <style>');
  const propios = a === V ? ESTILOS_FENOMENOS : '', vida = (a === V ? '' : Limites.html(herramienta) + Preguntas.html(herramienta) + vidaReal(`${clave}/${herramienta}`)) + relacionadas(clave, herramienta);
  if (vida && !html.includes('<footer')) throw new Error('diseno.js: la página no tiene <footer>');
  // el contenido de la página es el «main» (accesibilidad): <div class="wrap"> … </div> antes del pie
  if (!/<div class="wrap[^"]*"[^>]*>/.test(html) || !/<\/div>\s*<footer/.test(html)) throw new Error('diseno.js: la página no tiene <div class="wrap"> cerrado justo antes del <footer>');
  const main = (x) => x.replace(/<div class="(wrap[^"]*)"([^>]*)>/, '<main class="$1"$2>' + marca).replace(/<\/div>(\s*)<footer/, '</main>$1<footer');
  // «Informar de un error»: enlace de correo en el pie, con la herramienta en el asunto y su ruta en el cuerpo
  const error = (x) => x.replace(/(>Contacto<\/a>)/, `$1·${enlaceError(nombre, clave, herramienta)}`);
  const pag = Imprimir.PAGINA(Catalogo.web.replace(/^https?:\/\//, '') + `/${clave}/${herramienta}/`, (Version.registros[herramienta] || [])[0]?.v), marca = `<div class="imp-marca" aria-hidden="true"><div class="mk">${Catalogo.marca[0]}<i>${Catalogo.marca[1]}</i></div><div class="as">${esc(a.nombre)}</div></div>`;
  return error(main(html.replace(m[0], cab).replace(/<div class="fen-etiquetas"|<h1/, (x) => miga + '\n' + x).replace(/^<style>/m, `<style>${ESTILOS}${acento(a)}${cabecera}${propios}${pag}</style>\n<style>`)
    .replace(/(<\/div>\s*)?<footer/, (x) => (vida ? vida + x : x)).replace(TEORIA.test(html) ? TEORIA : /(<\/div>\s*)?<section class="(preguntas|vida-real|relacionadas)"|(<\/div>\s*)?<footer/, (x) => Anuncios.hueco() + x)
    // en las herramientas con teoría, otros dos huecos: en mitad de la teoría (antes de su tercer apartado) y
    // al final, antes de «Herramientas relacionadas» (o del pie); nunca pegados a otro anuncio
    .replace(/<section class="teoria"[\s\S]*?<\/section>/, (t) => { let n = 0; return a === V ? t : t.replace(/<h2/g, (x) => (++n === 3 ? Anuncios.hueco() + x : x)); })
    .replace(a === V || !TEORIA.test(html) ? /$^/ : /(<section class="relacionadas")|(<\/div>\s*)?<footer/, (x) => Anuncios.hueco() + x)));
}
const TEORIA = /<section class="teoria"/;

if (typeof module !== 'undefined') module.exports = { aplica, css, ESTILOS };
if (typeof require !== 'undefined' && require.main === module) {
  let txt = ''; process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => { txt += d; }).on('end', () => process.stdout.write(aplica(txt, process.argv[2], process.argv[3])));
}
