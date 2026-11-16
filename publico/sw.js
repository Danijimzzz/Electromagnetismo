/* Ciencify: service worker (fuente/pwa.js). Generado: no se edita a mano. */
const CACHE = 'ciencify-1.18-32d26f28', PREFIJO = 'ciencify-', MARCA = 'guardado-todo';
const NUCLEO = ["","novedades/","fenomenos/","electromagnetismo/","fisica/","quimica/","matematicas/","estadistica/","circuitos/","economia/","aviso-legal.html","privacidad.html","cookies.html","contacto.html","js/herramienta.c70d9bc0.js","js/magnetostatica-fisica.7e99822c.js","js/compartir.4ea99432.js","js/vista3d.469722c6.js","js/magnetostatica-app.d0a3adc5.js","js/biblioteca.884d13cb.js","js/practica.6707fdd4.js","js/personal.cde61015.js","js/mates.7d292cf7.js","js/condensadores-fisica.62922ed8.js","js/condensadores-app.b71fd5fc.js","js/induccion-fisica.9a72be96.js","js/induccion-app.0699162f.js","js/faraday-fisica.65919bbb.js","js/faraday-app.e9e82d86.js","js/fisica-constantes.b131d115.js","js/fuerza-fisica.36511283.js","js/fuerza-app.f031f972.js","js/ondas-em-fisica.27acf215.js","js/ondas-em-app.7c2da6ab.js","js/laplace-numerica-calculo.eae84a4e.js","js/imagenes-calculo.80c40f72.js","js/imagenes-app.6bf50254.js","js/lineas-transmision-calculo.4fbf94a8.js","js/lineas-transmision-app.44b5cf80.js","js/cavidades-calculo.0f65a1e4.js","js/matematicas-expresion.faeb1de0.js","js/trabajo-y-energia-fisica.b3ebce7d.js","js/trabajo-y-energia-app.18abe64c.js","js/tiro-parabolico-fisica.ea5d47f0.js","js/tiro-parabolico-app.09468fc6.js","js/calorimetria-fisica.aa06f268.js","js/dinamica-fisica.5bf666a6.js","js/dinamica-app.21e2affb.js","js/solido-rigido-fisica.ba493829.js","js/solido-rigido-app.cda58ca5.js","js/doppler-fisica.376020cb.js","js/ondas-app.1c3596a1.js","js/doppler-app.4f7ea041.js","js/interferencia-fisica.ff249efe.js","js/interferencia-app.bf65ae36.js","js/ciclos-fisica.7fa727e0.js","js/ciclos-app.eca90d70.js","js/fluidos-fisica.d9882c41.js","js/fluidos-app.35586a2a.js","js/quimica-ajuste.bc19c8d4.js","js/gases-fisica.fbb93125.js","js/gases-app.662fc8c6.js","js/calculadora.3e15371c.js","js/quimica-elementos.2352d556.js","js/quimica-configuracion.7a954dbf.js","js/quimica-formulas.92501051.js","js/cinetica-calculo.b1245851.js","js/cinetica-app.31c7c826.js","js/quimica-datos.0a78b245.js","js/ph-calculo.a248d57c.js","js/ph-app.3c50ac86.js","js/quimica-disoluciones.c5a08c78.js","js/formulacion-calculo.ee3435bb.js","js/equilibrio-calculo.d83dc776.js","js/solubilidad-calculo.7542dc56.js","js/solubilidad-app.870e9851.js","js/organica-calculo.21fbbcde.js","js/matematicas-algebra.8a6cfef7.js","js/matematicas-parametro.37eae239.js","js/matrices-calculo.7cf720fa.js","js/sistemas-calculo.c5f4abe9.js","js/taylor-calculo.c7eaa53f.js","js/fourier-calculo.caf046a1.js","js/laplace-calculo.7011b7e7.js","js/derivadas-calculo.94f011e3.js","js/edos-calculo.177a8146.js","js/edos-app.e18b3b37.js","js/laplace-app.d227ab9b.js","js/derivadas-app.86788afe.js","js/campos-calculo.f4d2f4bd.js","js/campos-app.f5ef2b24.js","js/complejos-calculo.c14411d9.js","js/superficies-calculo.96b73fa7.js","js/series-calculo.7b621b8d.js","js/estadistica-calculo.8036da12.js","js/regresion-calculo.ed2e5985.js","js/intervalos-calculo.a149c1d9.js","js/intervalos-app.e3fdd7b0.js","js/estadistica-inferencia.0ce3a867.js","js/contrastes-calculo.54eb4e92.js","js/probabilidad-calculo.bb0b3f90.js","js/chi2-bondad-calculo.87d0515a.js","js/anova-calculo.891a8e26.js","js/no-parametricos-calculo.74c08c34.js","js/resistencias-calculo.f6cdb566.js","js/convolucion-calculo.d15f8360.js","js/convolucion-app.6405ab76.js","js/sistemas-numericos-calculo.80da6725.js","js/puertas-logicas-calculo.4038164f.js","js/puertas-logicas-app.927b2160.js","js/simulador-continua.0d7c92a9.js","js/simulador-alterna.f91e009d.js","js/simulador-motor.58186bb0.js","js/simulador-app.01c4677a.js","js/control-calculo.13601d92.js","js/control-app.602eec16.js","js/transformada-z-calculo.b2e2a307.js","js/transformada-z-app.e566415f.js","js/semiconductores-calculo.5fa7d166.js","js/economia-comun.ff2d0035.js","js/fenomenos-animacion.732750eb.js","js/fenomenos-dibujo.1916c94a.js","js/fenomenos-fuego-san-telmo-escena.305531a7.js","js/fenomenos-auroras-escena.69a0bdbd.js","js/fenomenos-radio-am-fm-escena.b4eee2d2.js","js/fenomenos-fibra-optica-escena.4c2fe0b9.js","js/electrostatica.ae703d61.js","offline.html","buscador.js","pwa.js","legal.css","fuentes/stix-two-math.woff2","apple-touch-icon.png","manifest.webmanifest","icono-192.png","icono-512.png","icono-maskable-512.png"];
const TODAS = ["","novedades/","fenomenos/","electromagnetismo/","fisica/","quimica/","matematicas/","estadistica/","circuitos/","economia/","aviso-legal.html","privacidad.html","cookies.html","contacto.html","electromagnetismo/electrostatica/","electromagnetismo/magnetostatica/","electromagnetismo/condensadores/","electromagnetismo/induccion/","electromagnetismo/faraday/","electromagnetismo/fuerza/","electromagnetismo/ondas-em/","electromagnetismo/fresnel/","electromagnetismo/laplace-numerica/","electromagnetismo/imagenes/","electromagnetismo/lineas-transmision/","electromagnetismo/guias-onda/","electromagnetismo/maxwell/","electromagnetismo/antena/","electromagnetismo/cavidades/","fisica/trabajo-y-energia/","fisica/tiro-parabolico/","fisica/calorimetria/","fisica/dinamica/","fisica/solido-rigido/","fisica/ondas/","fisica/doppler/","fisica/interferencia/","fisica/ciclos/","fisica/fluidos/","fisica/gases/","fisica/choques/","fisica/oscilaciones/","fisica/gravitacion/","fisica/optica/","fisica/fisica-moderna/","fisica/unidades/","fisica/osc-acopladas/","fisica/relatividad/","fisica/termo-estadistica/","quimica/tabla-periodica/","quimica/masa-molar/","quimica/configuracion-electronica/","quimica/cinetica/","quimica/ph/","quimica/disoluciones/","quimica/ajustador/","quimica/vsepr/","quimica/formulacion/","quimica/equilibrio/","quimica/redox/","quimica/termoquimica/","quimica/solubilidad/","quimica/organica/","matematicas/matrices/","matematicas/sistemas/","matematicas/taylor/","matematicas/fourier/","matematicas/edos/","matematicas/laplace/","matematicas/derivadas/","matematicas/campos/","matematicas/complejos/","matematicas/integrales-multiples/","matematicas/superficies/","matematicas/metodos-numericos/","matematicas/graficador/","matematicas/series/","matematicas/lagrange/","estadistica/distribuciones/","estadistica/regresion/","estadistica/intervalos/","estadistica/errores/","estadistica/contrastes/","estadistica/descriptiva/","estadistica/probabilidad/","estadistica/chi2-bondad/","estadistica/anova/","estadistica/regresion-multiple/","estadistica/no-parametricos/","circuitos/resistencias/","circuitos/convolucion/","circuitos/bode/","circuitos/sistemas-numericos/","circuitos/puertas-logicas/","circuitos/simulador/","circuitos/control/","circuitos/transformada-z/","circuitos/semiconductores/","economia/oferta-demanda/","economia/elasticidades/","economia/excedentes/","economia/costes/","economia/beneficio/","economia/teoria-juegos/","economia/pib-ipc/","economia/multiplicador/","economia/is-lm/","economia/phillips-okun/","economia/tipos-cambio/","economia/interes/","economia/prestamos/","economia/van-tir/","economia/rentas/","economia/ahorro/","economia/punto-muerto/","economia/ratios/","economia/amortizacion-inmovilizado/","economia/balance/","economia/numeros-indice/","economia/regresion-economia/","economia/lorenz-gini/","economia/solow/","economia/bonos/","economia/black-scholes/","economia/markowitz/","fenomenos/fuego-san-telmo/","fenomenos/chispa-pomo/","fenomenos/jaula-faraday/","fenomenos/pajaro-cable/","fenomenos/transporte-alta-tension/","fenomenos/microondas/","fenomenos/radar-sirena/","fenomenos/carbono-14/","fenomenos/manguera/","fenomenos/lluvia-acida/","fenomenos/linea-alta-tension/","fenomenos/rayo/","fenomenos/auroras/","fenomenos/altavoz-motor/","fenomenos/cocina-induccion/","fenomenos/cargador-inalambrico/","fenomenos/airbag/","fenomenos/tension-paso/","fenomenos/cielo-azul/","fenomenos/gps-relatividad/","fenomenos/olla-presion/","fenomenos/arcoiris/","fenomenos/radio-am-fm/","fenomenos/detector-metales/","fenomenos/resonancia-magnetica/","fenomenos/frenado-magnetico/","fenomenos/transformador-poste/","fenomenos/fibra-optica/","fenomenos/pantalla-tactil/","fenomenos/fuego-san-telmo/imagen.webp","fenomenos/chispa-pomo/imagen.webp","fenomenos/jaula-faraday/imagen.webp","fenomenos/pajaro-cable/imagen.webp","fenomenos/transporte-alta-tension/imagen.webp","fenomenos/microondas/imagen.webp","fenomenos/radar-sirena/imagen.webp","fenomenos/carbono-14/imagen.webp","fenomenos/manguera/imagen.webp","fenomenos/lluvia-acida/imagen.webp","fenomenos/linea-alta-tension/imagen.webp","fenomenos/rayo/imagen.webp","fenomenos/auroras/imagen.webp","fenomenos/altavoz-motor/imagen.webp","fenomenos/cocina-induccion/imagen.webp","fenomenos/cargador-inalambrico/imagen.webp","fenomenos/airbag/imagen.webp","fenomenos/tension-paso/imagen.webp","fenomenos/cielo-azul/imagen.webp","fenomenos/gps-relatividad/imagen.webp","fenomenos/olla-presion/imagen.webp","fenomenos/arcoiris/imagen.webp","fenomenos/radio-am-fm/imagen.webp","fenomenos/detector-metales/imagen.webp","fenomenos/resonancia-magnetica/imagen.webp","fenomenos/frenado-magnetico/imagen.webp","fenomenos/transformador-poste/imagen.webp","fenomenos/fibra-optica/imagen.webp","fenomenos/pantalla-tactil/imagen.webp","electromagnetismo/electrostatica/guia/editar.webp","electromagnetismo/electrostatica/guia/exportar.webp","electromagnetismo/electrostatica/guia/grafica.webp","electromagnetismo/electrostatica/guia/lateral.webp","electromagnetismo/electrostatica/guia/lienzo.webp","electromagnetismo/electrostatica/guia/practica.webp","electromagnetismo/electrostatica/guia/solucion.webp","electromagnetismo/electrostatica/guia/vista.webp","electromagnetismo/electrostatica/guia/vista3d.webp"];
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
  if (!externa && /\/js\/[^/]+\.[0-9a-f]{8}\.js$/.test(url.pathname)) { e.respondWith(copiaYActualiza(e, req, clave(url), true)); return; }
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

async function copiaYActualiza(e, req, k, inmutable) {
  const c = await caches.open(CACHE), copia = await c.match(k);
  if (copia && inmutable) return copia;
  const red = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') e.waitUntil(c.put(k, r.clone())); return r; });
  e.waitUntil(red.catch(() => {}));
  if (copia) return copia;
  try { return await red; } catch (err) { return Response.error(); }
}
