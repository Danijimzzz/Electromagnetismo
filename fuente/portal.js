#!/usr/bin/env node
/* Genera la portada (publico/index.html) y una página por asignatura (publico/<asignatura>/index.html)
   a partir de catalogo.js. Lo llama build.sh; no hace falta ejecutarlo a mano. */
const fs = require('fs'), path = require('path');
const Catalogo = require('./catalogo.js'), Version = require('./version.js');
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
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(330px,100%),1fr)); gap:16px; align-items:start }
.subj { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:10px; border-top:4px solid var(--c) }
.subj h2 { margin:0; font:600 18px var(--f-ui); display:flex; align-items:center; gap:10px }
.ico { width:30px; height:30px; flex:0 0 auto; border-radius:8px; background:color-mix(in srgb,var(--c) 14%,transparent); color:var(--c); display:grid; place-items:center; font:italic 17px var(--f-math) }
.subj h2 small { margin-left:auto; font:500 12px var(--f-ui); color:var(--muted) }
.tool { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; border:1px solid var(--line); font-size:14px }
a.tool { border-color:color-mix(in srgb,var(--c) 45%,var(--line)); background:color-mix(in srgb,var(--c) 6%,var(--panel)) }
a.tool:hover { border-color:var(--c) }
.tool .n { font-weight:500 } .tool .d { color:var(--muted); font-size:12.5px }
.t { margin-left:auto; font-size:11px; font-weight:600; padding:2px 8px; border-radius:99px; white-space:nowrap; background:var(--bg); color:var(--muted) }
a .t { background:var(--c); color:var(--panel) }
.tool.off { color:var(--muted); border-style:dashed }
.ver { font-size:13px; color:var(--c); font-weight:600 } .ver:hover { text-decoration:underline }
.nada { color:var(--muted); font-style:italic }
.crumb { font-size:13.5px; color:var(--muted); margin-bottom:10px } .crumb a { color:var(--accent) } .crumb a:hover { text-decoration:underline }
.cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(250px,100%),1fr)); gap:14px }
.card { background:var(--panel); border:1px solid var(--line); border-radius:12px; overflow:hidden; display:flex; flex-direction:column }
a.card:hover { border-color:var(--c) }
.card .img { height:110px; background:linear-gradient(135deg,color-mix(in srgb,var(--c) 16%,var(--panel)),var(--panel)); display:grid; place-items:center; font:italic 38px var(--f-math); color:var(--c) }
.card .b { padding:12px 14px 14px; display:flex; flex-direction:column; gap:4px; flex:1 } .card h2 { margin:0; font:600 16px var(--f-ui) } .card p { margin:0; color:var(--muted); font-size:13.5px }
.card .t { margin:8px 0 0; align-self:flex-start } .card.off { opacity:.65 }
.otras { margin-top:32px; font-size:14px; color:var(--muted) } .otras a { color:var(--accent); margin-right:14px; white-space:nowrap } .otras a:hover { text-decoration:underline }
.novedades { margin-top:28px; max-width:720px; font-size:14px; color:var(--muted) } .novedades summary { cursor:pointer; color:var(--accent); font-weight:500 }
.novedades h3 { font:600 14px var(--f-ui); color:var(--ink); margin:12px 0 4px } .novedades ul { margin:0; padding-left:20px }
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
<style>${CSS}</style>
<body>
<header class="top"><a class="logo" href="${raiz}">${esc(m1)}<i>${esc(m2)}</i></a>
<nav aria-label="Asignaturas"><a href="${raiz}"${actual ? '' : ' aria-current="page"'}>Inicio</a>${nav}</nav>
${buscar ? '<input type="search" id="buscar" class="buscar" placeholder="Buscar: Biot-Savart, molaridad…" aria-label="Buscar herramientas" autocomplete="off">' : ''}</header>
${cuerpo}
<footer><a href="${raiz}contacto.html">Contacto</a>·<a href="${raiz}aviso-legal.html">Aviso legal</a>·<a href="${raiz}privacidad.html">Privacidad</a>·<a href="${raiz}cookies.html">Cookies</a>· <a href="${raiz}#novedades">Versión ${esc(Version.de('web').current)} (beta)</a></footer>
${script ? `<script>${script}</script>\n` : ''}</body>
</html>
`;
}

const estilo = (a) => `--cl:${a.color};--co:${a.colorOscuro}`;
const contar = (a) => (disponibles(a).length ? `${disponibles(a).length} de ${a.herramientas.length}` : 'en preparación');
const textoBusqueda = (a, h) => esc([a.nombre, h.nombre, h.desc, h.buscar || ''].join(' '));

// portada: una tarjeta por asignatura con todas sus herramientas
const tarjetas = Catalogo.asignaturas.map((a) => {
  const filas = a.herramientas.map((h) => h.disponible
    ? `  <a class="tool" href="${a.clave}/${h.clave}/" data-buscar="${textoBusqueda(a, h)}"><div><div class="n">${esc(h.nombre)}</div><div class="d">${esc(h.desc)}</div></div><span class="t">Abrir</span></a>`
    : `  <div class="tool off" data-buscar="${textoBusqueda(a, h)}"><div class="n">${esc(h.nombre)}</div><span class="t">Próximamente</span></div>`).join('\n');
  return `<section class="subj" style="${estilo(a)}"><h2><span class="ico">${esc(a.icono)}</span>${esc(a.nombre)}<small>${contar(a)}</small></h2>
${filas}
  <a class="ver" href="${a.clave}/">Ver la asignatura →</a></section>`;
}).join('\n');

// búsqueda en la portada: filtra herramientas sin distinguir mayúsculas ni tildes
const BUSCAR = `(() => {
  const q = document.getElementById('buscar'), nada = document.getElementById('nada');
  const norm = (s) => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  if (location.hash === '#novedades') document.getElementById('novedades').open = true;
  q.addEventListener('input', () => {
    const t = norm(q.value).split(/\\s+/).filter(Boolean);
    let hay = 0;
    for (const s of document.querySelectorAll('.subj')) {
      let n = 0;
      for (const f of s.querySelectorAll('[data-buscar]')) { const ok = t.every((p) => norm(f.dataset.buscar).includes(p)); f.hidden = !ok; n += ok; }
      s.hidden = !n; hay += n;
    }
    nada.hidden = !!hay;
  });
})();`;

const archivos = { 'index.html': pagina({
  titulo: `${marca} · Simuladores y calculadoras por asignatura`,
  desc: Catalogo.lema, raiz: '', buscar: true, script: BUSCAR,
  cuerpo: `<main>
<h1>Elige asignatura y herramienta</h1>
<p class="sub">${esc(Catalogo.lema)}</p>
<div class="grid">
${tarjetas}
</div>
<p class="nada" id="nada" hidden>No hay ninguna herramienta con ese nombre todavía.</p>
<details class="novedades" id="novedades"><summary>Novedades de la web</summary>
${Version.de('web').log.map((r) => `<h3>${esc(r.v)} · ${r.fecha.split('-').reverse().join('/')}</h3><ul>${r.cambios.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`).join('\n')}
</details>
</main>`,
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
