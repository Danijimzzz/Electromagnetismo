/* =====================================================================
   Web instalable y sin conexión (PWA): manifiesto, service worker y el script que lo registra.
   portal.js escribe en publico/ manifest.webmanifest, sw.js, pwa.js, offline.html y los iconos de fuente/pwa/;
   portal.js, diseno.js, herramientas.js y build.sh enganchan CABEZA(raiz) en cada página.
   Cómo guarda el service worker (sw.js):
   · Al instalarse guarda lo básico: portada, asignaturas, novedades, buscador, tipografía y la página sin conexión.
   · Las páginas y los scripts van «primero la red»: con conexión siempre llega la versión nueva (y se guarda una
     copia); sin conexión, o si la red tarda más de 4 s, sale la copia. Las imágenes y tipografías, «copia y
     actualiza detrás». Así una versión vieja nunca se queda pegada.
   · «Guardar todo para usar sin conexión» (portada) descarga las ~140 páginas. Si ya estaba hecho, cada
     versión nueva de la web lo vuelve a hacer sola, para que la copia no se quede antigua.
   · Una versión nueva del service worker espera: pwa.js avisa («Hay una versión nueva») y recarga al pulsar Actualizar.
   Subir la versión de la web (version.js) o cambiar la lista de páginas cambia sw.js y, con él, la caché.
   Pruebas: pruebas/pwa.js (servidor local, instala, corta la red y comprueba).
   ===================================================================== */
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const Catalogo = require('./catalogo.js'), Version = require('./version.js');

const V = Catalogo.fenomenos, ver = () => Version.de('web').current;
const COLOR = '#0d6b66', FONDO = '#eef1ee';
const PESO_MB = 20; // lo que descarga «guardar todo» (publico/ sin duplicados); se dice en el botón

const CABEZA = (raiz) => `<link rel="manifest" href="${raiz}manifest.webmanifest">\n<meta name="theme-color" content="${COLOR}">\n<script src="${raiz}pwa.js" defer></script>`;

// direcciones de las páginas desde la raíz
const basicas = () => ['', 'novedades/', 'fenomenos/', ...Catalogo.asignaturas.map((a) => `${a.clave}/`), 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html'];
const paginas = () => [...basicas(), ...Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}/`)),
  ...V.lista.filter((f) => f.disponible).map((f) => `fenomenos/${f.clave}/`)];
const imagenes = () => [...V.lista.filter((f) => f.disponible).map((f) => `fenomenos/${f.clave}/imagen.webp`), ...require('./electrostatica-js.js').IMAGENES().map((f) => `electromagnetismo/electrostatica/guia/${f}`)];
const ICONOS = [['icono-192.png', 192, 'any'], ['icono-512.png', 512, 'any'], ['icono-maskable-512.png', 512, 'maskable']];
// TRV.10.15: los scripts compartidos (publico/js/, con huella en el nombre) se guardan al instalar: así una página guardada siempre tiene sus scripts
const scriptsComunes = () => Object.values(require('./herramientas.js').externos()).map((e) => `js/${e.nombre}`);
const nucleo = () => [...basicas(), ...scriptsComunes(), 'offline.html', 'buscador.js', 'pwa.js', 'legal.css', 'fuentes/stix-two-math.woff2', 'apple-touch-icon.png', 'icono.svg', ...fs.readdirSync(path.join(__dirname, 'iconos')).filter((f) => f.endsWith('.svg')).map((f) => 'iconos/' + f), 'manifest.webmanifest', ...ICONOS.map((i) => i[0])];

// Idiomas traducidos (i18n.js): carpetas de publico/ con sus páginas, scripts propios y archivos comunes. Se leen del disco
// (la primera vez que portal.js escribe sw.js puede estar vacío o viejo; i18n.js lo vuelve a escribir al terminar).
function traducido() {
  const fs = require('fs'), path = require('path'), publico = path.join(__dirname, '..', 'publico'), out = { dirs: [], paginas: [], recursos: [], scripts: [] };
  for (const I of require('./idiomas.js').IDIOMAS.filter((x) => x.carpeta)) {
    const raiz = path.join(publico, I.carpeta); if (!fs.existsSync(raiz)) continue;
    out.dirs.push(I.carpeta);
    const anda = (d, rel) => { for (const f of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (f.isDirectory()) anda(path.join(d, f.name), `${rel}${f.name}/`);
      else if (f.name === 'index.html') out.paginas.push(`${I.carpeta}${rel}`);
      else if (f.name === 'offline.html' || (rel === '' && /\.(js|webmanifest|html)$/.test(f.name))) out.recursos.push(`${I.carpeta}${rel}${f.name}`);
    } };
    anda(raiz, '');
    const js = path.join(publico, 'js', I.carpeta.replace(/\/$/, '')); if (fs.existsSync(js)) for (const f of fs.readdirSync(js).sort()) out.scripts.push(`js/${I.carpeta}${f}`);
  }
  return out;
}

function manifiesto() {
  const nombre = Catalogo.marca.join('');
  return JSON.stringify({
    id: './', name: nombre, short_name: nombre, lang: 'es', dir: 'ltr', start_url: './', scope: './', display: 'standalone',
    background_color: FONDO, theme_color: COLOR, categories: ['education'],
    description: 'Simuladores y calculadoras de ciencias (Electromagnetismo, Física, Química, Matemáticas, Estadística, Circuitos y Economía), gratis y sin registro.',
    icons: ICONOS.map(([src, n, purpose]) => ({ src, sizes: `${n}x${n}`, type: 'image/png', purpose })),
    shortcuts: Catalogo.asignaturas.slice(0, 4).map((a) => ({ name: a.nombre, url: `${a.clave}/` })),
  }, null, 2) + '\n';
}

function offline() {
  const nombre = Catalogo.marca.join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sin conexión · ${nombre}</title>
<style>
:root { --bg:#eef1ee; --ink:#1a2128; --muted:#4a555e; --accent:#0d6b66 }
@media (prefers-color-scheme: dark) { :root { --bg:#111619; --ink:#e3e8ea; --muted:#a3aeb5; --accent:#4dbcb0; color-scheme:dark } }
html, body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif }
main { max-width:520px; margin:0 auto; padding:18vh 20px 40px }
h1 { font-size:26px; margin:0 0 10px } p { color:var(--muted); margin:0 0 14px } a { color:var(--accent); font-weight:600 }
</style>
</head>
<body>
<main>
<h1>Sin conexión</h1>
<p>Esta página todavía no está guardada en este dispositivo. Las herramientas que ya abriste antes sí funcionan sin conexión.</p>
<p><a href="./">Ir a la portada</a></p>
</main>
</body>
</html>
`;
}

// sw.js: la lista de páginas y la versión van dentro; si cambian, el archivo cambia y el navegador lo instala de nuevo
function sw() {
  const tr = traducido(), datos = { version: ver(), nucleo: [...nucleo(), ...tr.recursos, ...tr.paginas.filter((x) => x.split('/').length <= 3)], todas: [...paginas(), ...tr.paginas, ...tr.scripts, ...imagenes()], idiomas: tr.dirs };
  const hash = crypto.createHash('sha1').update(JSON.stringify(datos)).digest('hex').slice(0, 8);
  return `/* ${Catalogo.marca.join('')}: service worker (fuente/pwa.js). Generado: no se edita a mano. */
const CACHE = 'ciencify-${datos.version}-${hash}', PREFIJO = 'ciencify-', MARCA = 'guardado-todo';
const NUCLEO = ${JSON.stringify(datos.nucleo)};
const IDIOMAS = ${JSON.stringify(datos.idiomas)}; // carpetas de los idiomas traducidos: cada uno tiene su offline.html
const TODAS = ${JSON.stringify(datos.todas)};
const FUENTES_EXTERNAS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const ABS = (u) => new URL(u, self.registration.scope).href;

self.addEventListener('install', (e) => {
  // lo básico; si algún archivo falla no se rompe la instalación (se guardará cuando se visite)
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(NUCLEO.map((u) => fetch(ABS(u), { cache: 'reload' }).then((r) => r.ok && c.put(ABS(u), r)).catch(() => {})))));
});

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  const claves = await caches.keys(), viejas = claves.filter((k) => k.startsWith(PREFIJO) && k !== CACHE);
  // si en una versión anterior se guardó todo, se vuelve a guardar todo con esta (en segundo plano)
  let habiaTodo = false;
  for (const k of viejas) if (await (await caches.open(k)).match(ABS(MARCA))) habiaTodo = true;
  await Promise.all(viejas.map((k) => caches.delete(k)));
  await self.clients.claim();
  if (habiaTodo) await guardaTodo(false);
})()));

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  else if (e.data === 'GUARDAR_TODO') e.waitUntil(guardaTodo(true));
});

async function avisa(msg) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg); }

// descarga todas las páginas e imágenes, de seis en seis, y deja la marca de que está todo guardado
async function guardaTodo(informa) {
  const c = await caches.open(CACHE), cola = TODAS.slice(); let hechas = 0, fallos = 0;
  const trabajo = async () => {
    for (let u; (u = cola.shift()); ) {
      try { const r = await fetch(ABS(u), { cache: 'reload' }); if (r.ok) await c.put(ABS(u), r); else fallos++; } catch (err) { fallos++; }
      hechas++; if (informa && (hechas % 5 === 0 || !cola.length)) avisa({ tipo: 'progreso', hechas, total: TODAS.length });
    }
  };
  await Promise.all([1, 2, 3, 4, 5, 6].map(trabajo));
  if (!fallos) await c.put(ABS(MARCA), new Response('1'));
  if (informa) avisa({ tipo: 'fin', hechas, total: TODAS.length, fallos });
}

// la clave de una página no lleva ?consulta ni #ancla (la portada con ?q= es la portada)
const clave = (url) => ABS(url.origin === location.origin ? url.pathname : url.href);

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const externa = url.origin !== location.origin;
  if (externa && !FUENTES_EXTERNAS.includes(url.hostname)) return; // anuncios y demás: sin tocar
  if (url.pathname === new URL(ABS('sw.js')).pathname) return; // el navegador revisa sw.js por su cuenta
  // js/<nombre>.<huella>.js nunca cambia (la huella es su contenido): con copia, se sirve sin preguntar a la red
  if (!externa && /\\/js\\/[^/]+\\.[0-9a-f]{8}\\.js$/.test(url.pathname)) { e.respondWith(copiaYActualiza(e, req, clave(url), true)); return; }
  const primeroRed = !externa && (req.mode === 'navigate' || /(\\/|\\.(js|css|json|html|webmanifest|xml|txt))$/.test(url.pathname));
  e.respondWith(primeroRed ? delaRed(e, req, clave(url)) : copiaYActualiza(e, req, externa ? req.url : clave(url)));
});

// la página sin conexión del idioma de la página pedida (/en/… → en/offline.html), o la española
const offlineDe = (req) => { const p = new URL(req.url).pathname; const d = IDIOMAS.find((x) => p.startsWith(new URL(ABS(x)).pathname)); return (d || '') + 'offline.html'; };

async function delaRed(e, req, k) {
  const c = await caches.open(CACHE), copia = await c.match(k);
  const red = fetch(req).then((r) => { if (r.ok && !r.redirected && r.type === 'basic') e.waitUntil(c.put(k, r.clone())); return r; });
  e.waitUntil(red.catch(() => {}));
  if (!copia) {
    try { return await red; } catch (err) { return (req.mode === 'navigate' && (await c.match(ABS(offlineDe(req))))) || Response.error(); }
  }
  // con copia: manda la red, salvo que falle o tarde más de 4 s
  return Promise.race([red.catch(() => copia), new Promise((ok) => setTimeout(() => ok(copia), 4000))]);
}

async function copiaYActualiza(e, req, k, inmutable) {
  const c = await caches.open(CACHE), copia = await c.match(k);
  if (copia && inmutable) return copia;
  const red = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') e.waitUntil(c.put(k, r.clone())); return r; });
  e.waitUntil(red.catch(() => {}));
  if (copia) return copia;
  try { return await red; } catch (err) { return Response.error(); }
}
`;
}

// pwa.js: registra el service worker, avisa de versiones nuevas y maneja los botones de la portada
function cliente() {
  return `/* ${Catalogo.marca.join('')}: registro del service worker y avisos (fuente/pwa.js). Generado: no se edita a mano. */
(() => {
  if (!('serviceWorker' in navigator)) return; // sin https (o file://) no hay service worker
  const origen = document.currentScript && document.currentScript.src, sw = new URL('sw.js', origen || location.href).href;
  const css = document.createElement('style');
  css.textContent = ${JSON.stringify(CSS_AVISO)};
  document.head.appendChild(css);

  let recarga = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (recarga) location.reload(); });

  const aviso = (reg) => {
    if (document.querySelector('.pwa-aviso')) return;
    const d = document.createElement('div'); d.className = 'pwa-aviso'; d.setAttribute('role', 'status');
    d.innerHTML = '<span>Hay una versión nueva de ${Catalogo.marca.join('')}.</span><button type="button" class="si">Actualizar</button><button type="button" class="no">Ahora no</button>';
    d.querySelector('.si').onclick = () => { recarga = true; (reg.waiting || reg.installing || reg.active).postMessage('SKIP_WAITING'); setTimeout(() => location.reload(), 1500); };
    d.querySelector('.no').onclick = () => d.remove();
    document.body.appendChild(d);
  };
  const vigila = (reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) aviso(reg);
    reg.addEventListener('updatefound', () => {
      const n = reg.installing;
      if (n) n.addEventListener('statechange', () => { if (n.state === 'installed' && navigator.serviceWorker.controller) aviso(reg); });
    });
  };

  const barra = () => {
    const b = document.getElementById('pwa-barra'); if (!b) return;
    const estado = document.getElementById('pwa-estado'), todo = document.getElementById('pwa-todo'), inst = document.getElementById('pwa-instalar');
    b.hidden = false;
    const instalada = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !instalada;
    if (ios) estado.textContent = 'En iPhone y iPad: pulsa Compartir y «Añadir a pantalla de inicio».';
    let aplaza = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); aplaza = e; if (!instalada) inst.hidden = false; });
    window.addEventListener('appinstalled', () => { inst.hidden = true; estado.textContent = 'Instalada.'; });
    inst.onclick = async () => { if (!aplaza) return; aplaza.prompt(); await aplaza.userChoice; aplaza = null; inst.hidden = true; };
    caches.keys().then(async (ks) => { for (const k of ks) if (k.startsWith('ciencify-') && await (await caches.open(k)).match(new URL('guardado-todo', sw))) { estado.textContent = 'Todo guardado: funciona sin conexión.'; return; } }).catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => {
      const m = e.data || {};
      if (m.tipo === 'progreso') estado.textContent = 'Guardando… ' + Math.round(100 * m.hechas / m.total) + ' %';
      if (m.tipo === 'fin') { todo.disabled = false; estado.textContent = m.fallos ? 'No se pudo guardar todo (' + m.fallos + ' páginas). Vuelve a intentarlo con conexión.' : 'Todo guardado: funciona sin conexión.'; }
    });
    todo.onclick = async () => {
      const reg = await navigator.serviceWorker.ready;
      todo.disabled = true; estado.textContent = 'Guardando… 0 %';
      reg.active.postMessage('GUARDAR_TODO');
    };
  };

  const arranca = () => navigator.serviceWorker.register(sw).then((reg) => {
    vigila(reg); barra();
    // buscar versión nueva al volver a la pestaña (si pasó más de una hora desde la última vez)
    let ultima = Date.now();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - ultima > 36e5) { ultima = Date.now(); reg.update().catch(() => {}); } });
  }).catch(() => {});
  if (document.readyState === 'complete') arranca(); else addEventListener('load', arranca);
})();
`;
}

const CSS_AVISO = `.pwa-aviso{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:10px;flex-wrap:wrap;max-width:calc(100vw - 32px);padding:10px 14px;background:var(--panel,#fff);color:var(--ink,#1a2128);border:1px solid var(--line,#d5dbd5);border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.2);font:14px/1.4 var(--f-ui,system-ui,sans-serif)}
.pwa-aviso button{font:600 13px var(--f-ui,system-ui,sans-serif);padding:6px 12px;border-radius:8px;border:1px solid var(--accent,#0d6b66);background:transparent;color:var(--accent,#0d6b66);cursor:pointer}
.pwa-aviso .si{background:var(--accent,#0d6b66);color:var(--panel,#fff)}
.pwa-aviso button:focus-visible{outline:2px solid var(--accent,#0d6b66);outline-offset:2px}`;

// la franja de la portada con «Instalar» y «Guardar todo» (pwa.js la muestra solo si el navegador sabe)
const BARRA = `<section class="pwa-barra" id="pwa-barra" aria-label="Instalar y usar sin conexión" hidden>
<button type="button" id="pwa-instalar" hidden>Instalar ${Catalogo.marca.join('')}</button>
<button type="button" id="pwa-todo" title="Descarga unos ${PESO_MB} MB una sola vez">Guardar todo para usar sin conexión</button>
<span id="pwa-estado" role="status"></span>
</section>`;
const CSS = `
.pwa-barra { display:flex; align-items:center; gap:8px 12px; flex-wrap:wrap; margin:8px 0 28px; font-size:13px; color:var(--muted) }
.pwa-barra button { font:600 13px var(--f-ui); padding:7px 12px; border-radius:8px; border:1px solid var(--line); background:var(--panel); color:var(--ink); cursor:pointer }
.pwa-barra button:hover:not(:disabled) { border-color:var(--accent); color:var(--accent) }
.pwa-barra button:disabled { opacity:.6; cursor:progress }
.pwa-barra button:focus-visible { outline:2px solid var(--accent); outline-offset:1px }`;

if (typeof module !== 'undefined') module.exports = { traducido, CABEZA, BARRA, CSS, manifiesto, offline, sw, cliente, paginas, nucleo, ICONOS, COLOR, PESO_MB };
