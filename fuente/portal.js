#!/usr/bin/env node
/* Genera la portada (publico/index.html) y una página por asignatura (publico/<asignatura>/index.html)
   a partir de catalogo.js. Lo llama build.sh; no hace falta ejecutarlo a mano. */
const fs = require('fs'), path = require('path');
const Catalogo = require('./catalogo.js'), Version = require('./version.js'), Tema = require('./tema.js');
const publico = path.join(__dirname, '..', 'publico');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icono = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(__dirname, 'icono.svg')).toString('base64');
const [m1, m2] = Catalogo.marca, marca = m1 + m2;
const disponibles = (a) => a.herramientas.filter((h) => h.disponible);

const CSS = `
[style*="--cl:"] { --c:var(--cl) }
:root { --bg:#eef1ee; --panel:#fff; --ink:#1a2128; --muted:#5b6670; --line:#d5dbd5; --accent:#0d6b66; --accent-soft:#e0efec;
  --f-ui:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif; --f-math:"STIX Two Text","Cambria Math",Cambria,Georgia,serif }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#94a0a8; --line:#2a343b; --accent:#4dbcb0; --accent-soft:#173431; color-scheme:dark }
  :root:not([data-theme="light"]) [style*="--cl:"] { --c:var(--co) } }
:root[data-theme="dark"] { --bg:#111619; --panel:#182025; --ink:#e3e8ea; --muted:#94a0a8; --line:#2a343b; --accent:#4dbcb0; --accent-soft:#173431; color-scheme:dark }
:root[data-theme="dark"] [style*="--cl:"] { --c:var(--co) }
* { box-sizing:border-box } [hidden] { display:none !important }
html, body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 var(--f-ui) }
a { color:inherit; text-decoration:none }
.top { display:flex; align-items:center; gap:8px 20px; flex-wrap:wrap; padding:12px clamp(16px,3vw,28px); background:var(--panel); border-bottom:1px solid var(--line) }
.logo { font:600 18px var(--f-math); white-space:nowrap } .logo i { color:var(--accent) }
.top nav { display:flex; gap:4px 16px; font-size:14px; color:var(--muted); overflow-x:auto; max-width:100%; scrollbar-width:none }
.top nav a { white-space:nowrap; padding:2px 0 } .top nav a:hover, .top nav a[aria-current] { color:var(--ink) } .top nav a[aria-current] { font-weight:600 }
.buscar { margin-left:auto; font:14px var(--f-ui); color:var(--ink); border:1px solid var(--line); border-radius:8px; padding:7px 12px; width:min(300px,100%); background:var(--bg) }
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
.mini .off { color:var(--muted); border-style:dashed; border-left-style:solid }
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior:smooth } }
@media (max-width:760px) {
  .lay { grid-template-columns:minmax(0,1fr) }
  .lado { display:flex; gap:6px; overflow-x:auto; max-height:none; padding:8px 16px; border-right:0; border-bottom:1px solid var(--line); background:var(--bg); z-index:2; scrollbar-width:none }
  .lado h2, .lado .mas { display:none } .lado a { flex:0 0 auto; border:1px solid var(--line); border-radius:99px; padding:4px 10px 4px 4px; background:var(--panel) } .lado a small { display:none }
  .asig { scroll-margin-top:60px } .asig header small { display:none } body:has(.lado) .top nav { display:none } }
.crumb { font-size:13.5px; color:var(--muted); margin-bottom:10px } .crumb a { color:var(--accent) } .crumb a:hover { text-decoration:underline }
.cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr)); gap:14px }
.card { background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow:hidden; display:flex; flex-direction:column }
a.card:hover { border-color:var(--c) }
.card .img { height:110px; background:linear-gradient(135deg,color-mix(in srgb,var(--c) 16%,var(--panel)),var(--panel)); display:grid; place-items:center; font:italic 38px var(--f-math); color:var(--c) }
.card .b { padding:12px 14px 14px; display:flex; flex-direction:column; gap:4px; flex:1 } .card h2 { margin:0; font:600 16px var(--f-ui) } .card p { margin:0; color:var(--muted); font-size:13.5px }
.card .t { margin:8px 0 0; align-self:flex-start } .card.off { opacity:.65 }
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
.vers .actual { font-size:11px; font-weight:700; color:var(--panel); background:var(--accent); border-radius:99px; padding:1px 8px }
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
.leyenda { display:flex; gap:8px; flex-wrap:wrap; margin:-10px 0 22px }
@media (max-width:600px) { .dia { grid-template-columns:minmax(0,1fr) } .fecha { text-align:left; padding:6px 0 2px } .fecha b { display:inline; font-size:18px; margin-right:6px } .linea { padding-left:18px } .vers::before { left:-26px } .vers li { grid-template-columns:24px minmax(0,1fr) } .vers li .ir { grid-column:2 } }
footer { text-align:center; font-size:12.5px; color:var(--muted); padding:0 16px 24px } footer a { margin:0 6px; white-space:nowrap } footer a:hover { color:var(--accent); text-decoration:underline }
`;

function pagina({ titulo, desc, raiz, actual, cuerpo, buscar, script }) {
  const nav = Catalogo.asignaturas.map((a) => `<a href="${raiz}${a.clave}/"${a.clave === actual ? ' aria-current="page"' : ''}>${esc(a.nombre)}</a>`).join('');
  return `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" type="image/svg+xml" href="${icono}">
<link rel="apple-touch-icon" href="${raiz}apple-touch-icon.png">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="https://electromagnetismo-two.vercel.app/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400&display=swap">
<script>${Tema.SCRIPT}</script>
<style>${CSS}${Tema.CSS}</style>
<body>
<header class="top"><a class="logo" href="${raiz}">${esc(m1)}<i>${esc(m2)}</i></a>
<nav aria-label="Asignaturas"><a href="${raiz}"${actual ? '' : ' aria-current="page"'}>Inicio</a>${nav}</nav>
${buscar ? '<input type="search" id="buscar" class="buscar" placeholder="Buscar: Biot-Savart, molaridad…" aria-label="Buscar herramientas" autocomplete="off">' : ''}${Tema.BOTON}</header>
${cuerpo}
<footer><a href="${raiz}contacto.html">Contacto</a>·<a href="${raiz}aviso-legal.html">Aviso legal</a>·<a href="${raiz}privacidad.html">Privacidad</a>·<a href="${raiz}cookies.html">Cookies</a>· <a href="${raiz}novedades/">Versión ${esc(Version.de('web').current)} (beta)</a></footer>
${script ? `<script>${script}</script>\n` : ''}</body>
</html>
`;
}

const estilo = (a) => `--cl:${a.color};--co:${a.colorOscuro}`;
const contar = (a) => (disponibles(a).length ? `${disponibles(a).length} de ${a.herramientas.length}` : 'en preparación');
const textoBusqueda = (a, h) => esc([a.nombre, h.nombre, h.desc, h.buscar || ''].join(' '));

// portada: barra lateral con las asignaturas y, a la derecha, una sección por asignatura con sus herramientas
const lado = `<aside class="lado" aria-label="Asignaturas"><h2>Asignaturas</h2>
${Catalogo.asignaturas.map((a) => `  <a href="#${a.clave}" style="${estilo(a)}"><span class="ico s">${esc(a.icono)}</span>${esc(a.nombre)}<small>${disponibles(a).length}</small></a>`).join('\n')}
  <div class="mas"><h2>La web</h2><a href="novedades/" style="--cl:#0d6b66;--co:#4dbcb0"><span class="ico s">↻</span>Novedades<small>${esc(Version.de('web').current)}</small></a></div></aside>`;
const secciones = Catalogo.asignaturas.map((a) => {
  const fichas = a.herramientas.map((h) => h.disponible
    ? `  <a href="${a.clave}/${h.clave}/" title="${esc(h.desc)}" data-buscar="${textoBusqueda(a, h)}"><b>${esc(h.nombre)}</b><span>${esc(h.desc)}</span></a>`
    : `  <div class="off" data-buscar="${textoBusqueda(a, h)}"><b>${esc(h.nombre)}</b><span>Próximamente</span></div>`).join('\n');
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

const archivos = { 'index.html': pagina({
  titulo: `${marca} · Simuladores y calculadoras por asignatura`,
  desc: Catalogo.lema, raiz: '', buscar: true, script: BUSCAR,
  cuerpo: `<div class="lay">
${lado}
<main>
<h1>Elige asignatura y herramienta</h1>
<p class="sub">${esc(Catalogo.lema)}</p>
${secciones}
<p class="nada" id="nada" hidden>No hay ninguna herramienta con ese nombre todavía.</p>
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
  archivos[`${a.clave}/index.html`] = pagina({
    titulo: `${a.nombre} · ${marca}`, desc: a.resumen, raiz: '../', actual: a.clave,
    cuerpo: `<main style="${estilo(a)}">
<div class="crumb"><a href="../">Inicio</a> / ${esc(a.nombre)}</div>
<h1>${esc(a.nombre)}</h1>
<p class="sub">${esc(a.resumen)}</p>
<div class="cards">
${cards}
</div>
<p class="otras">Otras asignaturas: ${otras}</p>
</main>`,
  });
}

// novedades: una página propia con una línea de tiempo por días y una tarjeta por versión con todos sus cambios.
// El tipo de cada cambio sale de la nota: «Nueva herramienta: X, en Y.» es una herramienta nueva (con enlace),
// una versión con tercer número (0.20.1) es un arreglo y lo demás es una mejora.
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
  const SIM = { mejora: '+', arreglo: '✓' }, COLOR = { nueva: 'var(--nueva)', mejora: 'var(--mejora)', arreglo: 'var(--arreglo)' };
  const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const web = Version.de('web'), dias = new Map();
  for (const r of web.log) { if (!dias.has(r.fecha)) dias.set(r.fecha, []); dias.get(r.fecha).push(r); }
  const tarjeta = (r) => {
    const cambios = r.cambios.map((c) => {
      const m = c.match(/^Nueva herramienta: (.+?), en (.+?)\.$/), tipo = m ? 'nueva' : r.v.split('.').length > 2 ? 'arreglo' : 'mejora';
      if (m) {
        const x = herramienta(m[1], m[2]);
        return x
          ? `<li style="${estilo(x.a)}"><span class="ico s">${esc(x.h.icono)}</span><span><span class="tipo nueva">Nueva herramienta</span><b>${esc(x.h.nombre)}</b>, en ${esc(x.a.nombre)}</span><a class="ir" href="../${x.a.clave}/${x.h.clave}/">Abrir →</a></li>`
          : `<li style="--k:var(--nueva)"><span class="sim">★</span><span><span class="tipo nueva">Nueva herramienta</span><b>${esc(m[1])}</b>, en ${esc(m[2])}</span></li>`;
      }
      return { tipo, html: `<li style="--k:${COLOR[tipo]}"><span class="sim">${SIM[tipo]}</span><span><span class="tipo ${tipo}">${tipo === 'arreglo' ? 'Arreglo' : 'Mejora'}</span>${esc(c)}</span></li>` };
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
<p class="sub">Lo último que ha llegado a la web, de lo más nuevo a lo más antiguo. Estás viendo la versión ${esc(web.current)} (beta).</p>
<div class="leyenda"><span class="tipo nueva">Nueva herramienta</span><span class="tipo mejora">Mejora</span><span class="tipo arreglo">Arreglo</span></div>
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
// Cloudflare (Workers con assets) lee publico/_redirects; Vercel, vercel.json
archivos._redirects = Object.entries(redir).flatMap(([v, n]) => [`/${v} /${n} 301`, `/${v.replace(/\/$/, '')} /${n} 301`]).join('\n') + '\n';
const vercel = path.join(__dirname, '..', 'vercel.json'), conf = JSON.parse(fs.readFileSync(vercel, 'utf8'));
conf.redirects = Object.entries(redir).flatMap(([v, n]) => [`/${v.replace(/\/$/, '')}`, `/${v}`].map((source) => ({ source, destination: `/${n}`, permanent: true })));
fs.writeFileSync(vercel, JSON.stringify(conf, null, 2) + '\n');

for (const [f, html] of Object.entries(archivos)) {
  fs.mkdirSync(path.dirname(path.join(publico, f)), { recursive: true });
  fs.writeFileSync(path.join(publico, f), html);
}
