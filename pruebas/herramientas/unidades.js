/* Comprobación de unidades: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo unidades ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'unidades', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Unidades · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    cerca(r('milla').res, 8.04672, 1e-9, '5 mi en km (5·1609,344 m = 8046,72 m)');
    cerca(r('velocidad').res, 25, 1e-12, '90 km/h en m/s');
    cerca(r('temperatura').res, (100 - 32) * 5 / 9, 1e-9, '100 °F en °C = 37,78');
    cerca(r('presion').res, 760, 1e-9, '1 atm en mmHg');
    cerca(r('energia').res, 3.6, 1e-12, '1 kWh en MJ');
    cerca(r('electronvoltio').res / 1e-18, 2.17896, 1e-5, '13,6 eV en J = 2,179·10⁻¹⁸');
    cerca(r('campo-magnetico').res, 50, 1e-9, '0,5 G en µT');
    cerca(r('capacidad').res, 4.7, 1e-12, '4700 nF en µF');
    // temperaturas conocidas y ida y vuelta
    const t = (v, de, a) => C.convertir(v, 'temperatura', de, a);
    cerca(t(0, '°C', 'K'), 273.15, 1e-12, '0 °C en K'); cerca(t(-40, '°C', '°F'), -40, 1e-9, '−40 °C = −40 °F'); cerca(t(212, '°F', '°C'), 100, 1e-9, '212 °F en °C');
    cerca(t(0, 'K', '°R'), 0, 1e-12, '0 K en °R'); cerca(t(100, '°C', '°R'), 671.67, 1e-9, '100 °C en °R');
    // otros factores de las definiciones
    cerca(C.convertir(1, 'longitud', 'in', 'cm'), 2.54, 1e-12, '1 in en cm'); cerca(C.convertir(1, 'longitud', 'al', 'ua'), 63241.077, 1e-3, '1 año luz en ua');
    cerca(C.convertir(1, 'longitud', 'pc', 'al'), 3.2615638, 1e-6, '1 pc en años luz'); cerca(C.convertir(1, 'energia', 'kcal', 'kJ'), 4.184, 1e-12, '1 kcal en kJ');
    cerca(C.convertir(1, 'masa', 'u', 'MeV/c²'), 931.494, 1e-3, '1 u en MeV/c²'); cerca(C.convertir(1, 'potencia', 'CV', 'kW'), 0.73549875, 1e-9, '1 CV en kW');
    cerca(C.convertir(1, 'presion', 'psi', 'kPa'), 6.894757, 1e-6, '1 psi en kPa'); cerca(C.convertir(1, 'carga', 'e', 'C'), 1.602176634e-19, 1e-30, 'carga elemental');
    cerca(C.convertir(1, 'angulo', 'rev', '°'), 360, 1e-9, '1 vuelta en grados'); cerca(C.convertir(60, 'frecuencia', 'rpm', 'Hz'), 1, 1e-12, '60 rpm en Hz');
    cerca(C.convertir(1, 'campoE', 'V/cm', 'kV/m'), 0.1, 1e-12, '1 V/cm en kV/m'); cerca(C.convertir(1, 'velocidad', 'c', 'km/h'), 1079252848.8, 0.1, 'c en km/h');
    // todas las unidades de cada magnitud: ida y vuelta por la unidad base
    for (const [k, M] of Object.entries(C.MAGNITUDES)) for (const u of M.u) for (const w of M.u) {
      const x = C.convertir(C.convertir(7.5, k, u.s, w.s), k, w.s, u.s);
      if (!(Math.abs(x - 7.5) <= 1e-9 * 7.5)) mal(`Unidades: ida y vuelta ${k} ${u.s} ↔ ${w.s} da ${x}`);
    }
    // constantes: valor numérico, exactitud de las definidas y que el buscador las encuentra
    const cte = (s) => C.CONSTANTES.find((c) => c.s === s);
    cerca(cte('c').v, 299792458, 1e-6, 'c'); cerca(cte('h').v / 1e-34, 6.62607015, 1e-9, 'h'); cerca(cte('ħ').v / cte('h').v * 2 * Math.PI, 1, 1e-9, 'ħ = h/2π');
    cerca(cte('N<sub>A</sub>').v * cte('k<sub>B</sub>').v, cte('R').v, 1e-6, 'R = N_A·k_B'); cerca(cte('N<sub>A</sub>').v * cte('e').v, cte('F').v, 1e-4, 'F = N_A·e');
    cerca(1 / (4 * Math.PI * cte('ε<sub>0</sub>').v) / 1e9, cte('k<sub>e</sub> = 1/(4πε<sub>0</sub>)').v / 1e9, 1e-8, 'k = 1/(4π ε₀)'); cerca(1 / Math.sqrt(cte('ε<sub>0</sub>').v * cte('μ<sub>0</sub>').v), cte('c').v, 100, 'c = 1/√(ε₀ μ₀)');
    cerca(cte('h').v / (2 * cte('e').v) / 1e-15, cte('Φ<sub>0</sub>').v / 1e-15, 1e-8, 'Φ₀ = h/2e');
    cerca(cte('al').v, C.convertir(1, 'longitud', 'al', 'm'), 1e-3, 'año luz en m');
    // las dos ediciones (2022 por defecto y 2018) cumplen entre sí las relaciones de la física: es la comprobación de las cifras escritas de memoria
    if (C.CONSTANTES !== C.EDICIONES[2022]) mal('Unidades: la edición por defecto debería ser CODATA 2022');
    for (const ed of [2022, 2018]) {
      const g = (q) => C.EDICIONES[ed].find((c) => c.s === q).v, rel = (a, b, nom, tol = 3e-9) => { if (Math.abs(a / b - 1) > tol) mal(`Unidades · CODATA ${ed}: ${nom} no cuadra (${a} frente a ${b})`); };
      const c = g('c'), e = g('e'), h = g('h'), hb = g('ħ'), mu0 = g('μ<sub>0</sub>'), e0 = g('ε<sub>0</sub>'), al = g('α'), me = g('m<sub>e</sub>'), mp = g('m<sub>p</sub>');
      rel(mu0 * c * e * e / (2 * h), al, 'α = μ₀ c e²/2h'); rel(c * c * e0 * mu0, 1, 'c² ε₀ μ₀ = 1'); rel(1 / (4 * Math.PI * e0), g('k<sub>e</sub> = 1/(4πε<sub>0</sub>)'), 'k = 1/4πε₀'); rel(mu0 * c, g('Z<sub>0</sub>'), 'Z₀ = μ₀ c');
      rel(h / (me * c), g('λ<sub>C</sub>'), 'λ_C = h/m_e c'); rel(al * al * me * c / (2 * h), g('R<sub>∞</sub>'), 'R∞ = α² m_e c/2h'); rel(me * c * c * al * al, g('E<sub>h</sub>'), 'E_h = m_e c² α²');
      rel(me * c * c / e / 1e6, g('m<sub>e</sub>c<sup>2</sup>'), 'm_e c² en MeV'); rel(mp * c * c / e / 1e6, g('m<sub>p</sub>c<sup>2</sup>'), 'm_p c² en MeV', 5e-9);
      rel(hb / (me * c * al), g('a<sub>0</sub>'), 'a₀ = ħ/(m_e c α)', 2e-9); rel(al * hb / (me * c), g('r<sub>e</sub>'), 'r_e = α ħ/(m_e c)', 2e-9); rel(e * hb / (2 * me), g('μ<sub>B</sub>'), 'μ_B = eħ/2m_e', 2e-9); rel(e * hb / (2 * mp), g('μ<sub>N</sub>'), 'μ_N = eħ/2m_p', 2e-9);
    }
    if (C.busca('planck', 2018).length !== 2 || C.busca('', 2018).length !== C.EDICIONES[2018].length) mal('Unidades: el buscador no respeta la edición 2018');
    if (C.busca('electrón').length < 4 || C.busca('ε').length < 1 || C.busca('zzz').length !== 0 || C.busca('').length !== C.CONSTANTES.length) mal('Unidades: el buscador de constantes no encuentra lo esperado');
    for (const sc of [{ mag: 'longitud', valor: '', de: 'm', a: 'km' }, { mag: 'longitud', valor: 'abc', de: 'm', a: 'km' }, { mag: 'longitud', valor: '5m', de: 'm', a: 'km' }, { mag: 'temperatura', valor: '-300', de: '°C', a: 'K' },
      { mag: 'temperatura', valor: '-1', de: 'K', a: '°C' }, { mag: 'nada', valor: '1', de: 'm', a: 'km' }, { mag: 'longitud', valor: '1', de: 'kg', a: 'km' }]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Unidades: ${JSON.stringify(sc)} no da error`);
    }
    cerca(C.resolver({ mag: 'velocidad', valor: '3·10^8', de: 'm/s', a: 'c' }).res, 3e8 / 299792458, 1e-12, '3·10^8 m/s en c');
    cerca(C.resolver({ mag: 'longitud', valor: '2,5', de: 'km', a: 'm' }).res, 2500, 1e-9, 'coma decimal');
    for (let i = 0; i < 200; i++) { const sc = C.azar(), s = C.resolver(sc); if (!isFinite(s.res) || sc.de === sc.a) mal(`Unidades: azar() da un ejercicio mal formado ${JSON.stringify(sc)}`); }
    if (fallos === antes) console.log(`  ✓ Unidades: ${C.ejemplos.length} ejemplos, temperaturas, ida y vuelta de todas las unidades, constantes y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'fisica', 'unidades', 'index.html'));
    await page.waitForFunction(() => window.UnidadesApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('unidades').current) mal(`Unidades: la página muestra la versión «${ver}», se esperaba ${Version.de('unidades').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => UnidadesApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Unidades · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Unidades · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-valor', 'abc');
    if (await page.locator('#error').isHidden()) mal('Unidades: un valor que no es número no muestra el error');
    await page.fill('#f-valor', '2'); await page.selectOption('#f-mag', 'energia');
    const m = await page.evaluate(() => ({ de: document.querySelector('#f-de').value, a: document.querySelector('#f-a').value, err: !document.querySelector('#error').hidden }));
    if (m.err || m.de !== 'J' || m.a !== 'kJ') mal('Unidades: al cambiar de magnitud no se ponen unidades de la nueva');
    await page.click('#intercambia');
    if ((await page.inputValue('#f-de')) !== 'kJ') mal('Unidades: el botón Intercambiar no cambia las unidades');
    await page.fill('#busca', 'planck');
    const nc = await page.locator('#ctes tr').count();
    if (nc !== 2) mal(`Unidades: buscar «planck» da ${nc} constantes en vez de 2`);
    await page.fill('#busca', 'zzz');
    if (!/Ninguna/.test(await page.locator('#ctes').textContent())) mal('Unidades: una búsqueda sin resultados no lo dice');
    await page.close();
    if (consola.length) mal('Unidades: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Unidades: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
