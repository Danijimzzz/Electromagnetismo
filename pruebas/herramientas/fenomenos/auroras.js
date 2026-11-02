/* Comprobación de Las auroras boreales («Física en la vida real»): los números del electrón en el campo de la Tierra y el
   ejercicio que se abre en Fuerza magnética, en Node, y la página en Chromium con fenomenos/comun.js. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/auroras ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'auroras', 'escena.js'));
  const Fu = require(path.join(fuente, 'fuerza', 'fisica.js'));
  {
    // a mano (electrón de 5 keV, B = 50 µT, θ = 30°): v = √(2·5000·1,602177e-19/9,109384e-31) = 4,1938e7 m/s; v⊥ = v/2 = 2,0969e7, v∥ = v cos30° = 3,6320e7;
    // r = m v⊥/(eB) = 9,109384e-31·2,0969e7/(1,602177e-19·5e-5) = 2,3845 m; T = 2πm/(eB) = 7,1448e-7 s, f = 1,3996 MHz; p = v∥ T = 25,95 m;
    // espejo: B_ec = 31,2/216 = 0,14444 µT; B(100 km) = 2·31,2·(6371/6471)³ = 59,56 µT ⇒ sen²α = 0,0024251 ⇒ α = 2,822°;
    // fotones: 1239,84/557,7 = 2,2232 eV, 1239,84/630 = 1,9680 eV; protón del viento solar a 400 km/s: ½·1,67262e-27·(4e5)²/1,602177e-19 = 835 eV
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) falla(`Auroras · ${q}: ${a} en vez de ${b}`); };
    const d = F.datos;
    cerca(d.v, 4.1938e7, 1e-4, 'velocidad del electrón'); cerca(d.vper, 2.0969e7, 1e-4, 'v⊥'); cerca(d.vpar, 3.6320e7, 1e-4, 'v∥');
    cerca(d.r, 2.3845, 1e-4, 'radio de giro a 30°'); cerca(d.r90, 4.7689, 1e-4, 'radio de giro a 90°'); cerca(d.T, 7.1448e-7, 1e-4, 'periodo'); cerca(d.f / 1e6, 1.3996, 1e-4, 'frecuencia (MHz)');
    cerca(d.p, 25.95, 1e-3, 'paso de la hélice'); cerca(d.Beq * 1e6, 0.14444, 1e-3, 'B en el ecuador de la capa'); cerca(d.Balt * 1e6, 59.56, 2e-3, 'B a 100 km');
    cerca(d.perdida, 2.822, 2e-3, 'cono de pérdida'); cerca(d.fVerde, 2.2232, 1e-3, 'fotón verde'); cerca(d.fRojo, 1.968, 1e-3, 'fotón rojo'); cerca(d.Ep, 835, 3e-3, 'protón del viento solar');
    // el radio crece con √E y la frecuencia no depende de la energía
    cerca(F.radio(20000) / F.radio(5000), 2, 1e-9, 'r ∝ √E'); cerca(F.paso(20000) / F.paso(5000), 2, 1e-9, 'p ∝ √E');
    // las líneas del campo (dipolo) llegan a la superficie en cos²λ = 1/L
    const q = F.linea(6, F.lamPolo(6)); cerca(Math.hypot(q.x, q.y * 1), Math.hypot(q.x, q.y), 1e-12, 'línea'); cerca(Math.sqrt(q.x * q.x + q.y * q.y), 1, 1e-9, 'la línea del campo toca la superficie (r = 1 radio terrestre)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Auroras: faltan pasos, textos o datos');
    // el ejercicio de Fuerza magnética coincide con el cálculo propio
    const s = Fu.resolver(F.ejercicio());
    cerca(s.r, d.r, 1e-3, 'Fuerza: radio'); cerca(s.T, d.T, 1e-3, 'Fuerza: periodo'); cerca(s.paso, d.p, 1e-3, 'Fuerza: paso de la hélice');
    if (fallos === antes) console.log('  ✓ Auroras: v = 4,19·10⁷ m/s, r = 2,38 m, f = 1,40 MHz, paso 25,9 m, cono de pérdida 2,8°, fotones de 2,22 y 1,97 eV, 6 pasos y el ejercicio de Fuerza magnética');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Auroras', clave: 'auroras',
      nombres: ['Sol', 'Giro', 'Hélice', 'Espejo', 'Brillo', 'Cálculo'],
      prueba: { paso: 2, valor: 10, espera: 'E = 10 keV' },
      destino: { href: '../../electromagnetismo/fuerza/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText, e = document.querySelector('#error'); return /2,38/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Auroras: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Fuerza magnética con los datos, modo oscuro y 390 px');
  };
};
