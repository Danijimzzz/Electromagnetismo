/* Comprobación de El transformador del poste («Física en la vida real»): los números del modelo y el ejercicio que se
   abre en Autoinducción e inducción mutua, en Node, y la página en Chromium con fenomenos/comun.js. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/transformador-poste ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const C = require(path.join(fuente, 'fenomenos', 'transformador-poste', 'escena.js'));
  const Ind = require(path.join(fuente, 'induccion', 'fisica.js'));
  {
    // a mano: N₁/N₂ = 2500/50 = 50; V₂ = 20 000 / 50 = 400 V; 8 V por vuelta; I₁ = 100 000 / 20 000 = 5 A; I₂ = 100 000 / 400 = 250 A;
    // Φ = 400 √2 / (2π · 50 · 50) = 0,036013 Wb; B = Φ / 0,04 = 0,9003 T; pérdidas (1 %) = 1 kW
    // toroide a = 8 cm, b = 12 cm, h = 4 cm: M = 2·10⁻⁷ · 2500 · 50 · 0,04 · ln 1,5 = 0,405465 mH; L₁ = 2·10⁻⁷ · 2500² · 0,04 · ln 1,5 = 20,2733 mH
    // ε₂ = M · dI₁/dt = 565,69 V = 400 √2 (pico de 400 V eficaces); a 25 vueltas: 200 V
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Transformador del poste · ${q}: ${a} en vez de ${b}`); };
    const d = C.datos;
    cerca(d.razon, 50, 1e-12, 'relación de vueltas'); cerca(d.tension2(d.N2), 400, 1e-9, 'V₂ (V)'); cerca(d.tension2(25), 200, 1e-9, 'V₂ con 25 vueltas (V)');
    cerca(d.voltiosPorVuelta, 8, 1e-12, 'V por vuelta'); cerca(d.I1, 5, 1e-12, 'I₁ (A)'); cerca(d.I2, 250, 1e-12, 'I₂ (A)'); cerca(d.PHI, 0.036013, 1e-6, 'flujo (Wb)');
    cerca(d.BMAX, 0.9003, 1e-4, 'B máximo (T)'); cerca(d.perdidas, 1000, 1e-6, 'pérdidas (W)'); cerca(d.V1 * d.I1, d.V2 * d.I2, 1e-6, 'misma potencia a los dos lados');
    cerca(d.M * 1e3, 0.405465, 1e-5, 'M (mH)'); cerca(d.L1 * 1e3, 20.2733, 1e-3, 'L₁ (mH)'); cerca(d.EPS2, 565.69, 0.01, 'fem del secundario (V)');
    if (C.pasos.length !== 6 || C.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Transformador del poste: faltan pasos, textos o datos');
    // el ejercicio: la herramienta de inducción mutua da lo mismo (M, k = 1, fem del secundario = N₂/N₁ de la del primario)
    const s = Ind.mutua(C.ejercicio().M);
    cerca(s.res.M, d.M, 1e-12, 'Inducción: M'); cerca(s.res.L1, d.L1, 1e-12, 'Inducción: L₁'); cerca(Math.abs(s.res.fem), d.EPS2, 1e-6, 'Inducción: fem del secundario');
    cerca(Math.abs(s.res.fem) / (s.res.L1 * d.DIDT), d.N2 / d.N1, 1e-12, 'Inducción: ε₂/ε₁ = N₂/N₁'); cerca(s.res.M / Math.sqrt(s.res.L1 * s.res.L2), 1, 1e-9, 'Inducción: k');
    if (fallos === antes) console.log('  ✓ Transformador del poste: V₂ = V₁ N₂/N₁, corrientes, flujo, pérdidas, 6 pasos y el ejercicio de Inducción mutua con k = 1');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Transformador del poste', clave: 'transformador-poste',
      nombres: ['Poste', 'Núcleo', 'Faraday', 'Potencia', 'Alterna', 'Zumbido'],
      prueba: { paso: 2, valor: 25, espera: '25 vueltas → 200 V en el secundario' },
      destino: { href: '../../electromagnetismo/induccion/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText.replace(/\s/g, ''), e = document.querySelector('#error'); return /0,4055|405,5|4,05/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Transformador del poste: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Inducción mutua con los datos, modo oscuro y 390 px');
  };
};
