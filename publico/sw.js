/* Ciencify: service worker (fuente/pwa.js). Generado: no se edita a mano. */
const CACHE = 'ciencify-1.11-d7d84554', PREFIJO = 'ciencify-', MARCA = 'guardado-todo';
const NUCLEO = ["","novedades/","fenomenos/","electromagnetismo/","fisica/","quimica/","matematicas/","estadistica/","circuitos/","economia/","aviso-legal.html","privacidad.html","cookies.html","contacto.html","offline.html","buscador.js","pwa.js","legal.css","fuentes/stix-two-math.woff2","apple-touch-icon.png","manifest.webmanifest","icono-192.png","icono-512.png","icono-maskable-512.png"];
const TODAS = ["","novedades/","fenomenos/","electromagnetismo/","fisica/","quimica/","matematicas/","estadistica/","circuitos/","economia/","aviso-legal.html","privacidad.html","cookies.html","contacto.html","electromagnetismo/electrostatica/","electromagnetismo/magnetostatica/","electromagnetismo/condensadores/","electromagnetismo/induccion/","electromagnetismo/faraday/","electromagnetismo/fuerza/","electromagnetismo/ondas-em/","electromagnetismo/fresnel/","electromagnetismo/laplace-numerica/","electromagnetismo/imagenes/","electromagnetismo/lineas-transmision/","electromagnetismo/guias-onda/","electromagnetismo/maxwell/","electromagnetismo/antena/","fisica/trabajo-y-energia/","fisica/tiro-parabolico/","fisica/calorimetria/","fisica/dinamica/","fisica/solido-rigido/","fisica/ondas/","fisica/doppler/","fisica/interferencia/","fisica/ciclos/","fisica/fluidos/","fisica/gases/","fisica/choques/","fisica/oscilaciones/","fisica/gravitacion/","fisica/optica/","fisica/fisica-moderna/","fisica/unidades/","fisica/osc-acopladas/","fisica/relatividad/","quimica/tabla-periodica/","quimica/masa-molar/","quimica/configuracion-electronica/","quimica/cinetica/","quimica/ph/","quimica/disoluciones/","quimica/ajustador/","quimica/vsepr/","quimica/formulacion/","quimica/equilibrio/","quimica/redox/","quimica/termoquimica/","quimica/solubilidad/","matematicas/matrices/","matematicas/sistemas/","matematicas/taylor/","matematicas/fourier/","matematicas/edos/","matematicas/laplace/","matematicas/derivadas/","matematicas/campos/","matematicas/complejos/","matematicas/integrales-multiples/","matematicas/superficies/","matematicas/metodos-numericos/","matematicas/graficador/","matematicas/series/","matematicas/lagrange/","estadistica/distribuciones/","estadistica/regresion/","estadistica/intervalos/","estadistica/errores/","estadistica/contrastes/","estadistica/descriptiva/","estadistica/probabilidad/","estadistica/chi2-bondad/","estadistica/anova/","estadistica/regresion-multiple/","estadistica/no-parametricos/","circuitos/resistencias/","circuitos/convolucion/","circuitos/bode/","circuitos/sistemas-numericos/","circuitos/puertas-logicas/","circuitos/simulador/","economia/oferta-demanda/","economia/elasticidades/","economia/excedentes/","economia/costes/","economia/beneficio/","economia/teoria-juegos/","economia/pib-ipc/","economia/multiplicador/","economia/is-lm/","economia/phillips-okun/","economia/tipos-cambio/","economia/interes/","economia/prestamos/","economia/van-tir/","economia/rentas/","economia/ahorro/","economia/punto-muerto/","economia/ratios/","economia/amortizacion-inmovilizado/","economia/balance/","economia/numeros-indice/","economia/regresion-economia/","economia/lorenz-gini/","economia/solow/","economia/bonos/","economia/black-scholes/","fenomenos/fuego-san-telmo/","fenomenos/chispa-pomo/","fenomenos/jaula-faraday/","fenomenos/pajaro-cable/","fenomenos/transporte-alta-tension/","fenomenos/microondas/","fenomenos/radar-sirena/","fenomenos/carbono-14/","fenomenos/manguera/","fenomenos/lluvia-acida/","fenomenos/linea-alta-tension/","fenomenos/rayo/","fenomenos/auroras/","fenomenos/altavoz-motor/","fenomenos/cocina-induccion/","fenomenos/cargador-inalambrico/","fenomenos/airbag/","fenomenos/tension-paso/","fenomenos/cielo-azul/","fenomenos/gps-relatividad/","fenomenos/olla-presion/","fenomenos/arcoiris/","fenomenos/radio-am-fm/","fenomenos/fuego-san-telmo/imagen.webp","fenomenos/chispa-pomo/imagen.webp","fenomenos/jaula-faraday/imagen.webp","fenomenos/pajaro-cable/imagen.webp","fenomenos/transporte-alta-tension/imagen.webp","fenomenos/microondas/imagen.webp","fenomenos/radar-sirena/imagen.webp","fenomenos/carbono-14/imagen.webp","fenomenos/manguera/imagen.webp","fenomenos/lluvia-acida/imagen.webp","fenomenos/linea-alta-tension/imagen.webp","fenomenos/rayo/imagen.webp","fenomenos/auroras/imagen.webp","fenomenos/altavoz-motor/imagen.webp","fenomenos/cocina-induccion/imagen.webp","fenomenos/cargador-inalambrico/imagen.webp","fenomenos/airbag/imagen.webp","fenomenos/tension-paso/imagen.webp","fenomenos/cielo-azul/imagen.webp","fenomenos/gps-relatividad/imagen.webp","fenomenos/olla-presion/imagen.webp","fenomenos/arcoiris/imagen.webp","fenomenos/radio-am-fm/imagen.webp"];
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
  const primeroRed = !externa && (req.mode === 'navigate' || /(\/|\.(js|css|json|html|webmanifest|xml|txt))$/.test(url.pathname));
  e.respondWith(primeroRed ? delaRed(e, req, clave(url)) : copiaYActualiza(e, req, externa ? req.url : clave(url)));
});

async function delaRed(e, req, k) {
  const c = await caches.open(CACHE), copia = await c.match(k);
  const red = fetch(req).then((r) => { if (r.ok && !r.redirected && r.type === 'basic') e.waitUntil(c.put(k, r.clone())); return r; });
  e.waitUntil(red.catch(() => {}));
  if (!copia) {
    try { return await red; } catch (err) { return (req.mode === 'navigate' && (await c.match(ABS('offline.html')))) || Response.error(); }
  }
  // con copia: manda la red, salvo que falle o tarde más de 4 s
  return Promise.race([red.catch(() => copia), new Promise((ok) => setTimeout(() => ok(copia), 4000))]);
}

async function copiaYActualiza(e, req, k) {
  const c = await caches.open(CACHE), copia = await c.match(k);
  const red = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') e.waitUntil(c.put(k, r.clone())); return r; });
  e.waitUntil(red.catch(() => {}));
  if (copia) return copia;
  try { return await red; } catch (err) { return Response.error(); }
}
