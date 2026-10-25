/* Comprobación de fluidos: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fluidos ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const FluidosF = require(path.join(fuente, 'fluidos', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Fluidos · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => FluidosF.resolver(FluidosF.ejemplos.find((e) => e.clave === c).sc);
    const bu = r('buceo');
    cerca(bu.pm, 1025 * 9.8 * 20, 1e-6, 'presión manométrica a 20 m'); cerca(bu.pa, 101325 + 1025 * 9.8 * 20, 1e-6, 'presión absoluta (con la atmósfera)');
    cerca(r('piscina').F, 1000 * 9.8 * 2 * 50, 1e-6, 'fuerza sobre el fondo');
    cerca(r('barometro').pa, 13600 * 9.8 * 0.76, 1e-6, 'barómetro con vacío encima');
    const tu = r('tubo-aceite');
    cerca(tu.h1, 0.08, 1e-12, 'tubo en U: altura del agua'); cerca(tu.dh, 0.02, 1e-12, 'tubo en U: desnivel');
    cerca(r('tubo-densidad').rho2, 850, 1e-9, 'tubo en U: densidad');
    const el = r('elevador');
    cerca(el.F1, (1500 * 9.8) / 100, 1e-9, 'prensa: fuerza para levantar 1500 kg'); cerca(el.x2, 0.2, 1e-12, 'prensa: recorrido del émbolo grande');
    cerca(r('prensa').F2, 200 * 225, 1e-6, 'prensa: fuerza que se consigue');
    const ma = r('madera');
    if (!ma.flota) mal('Fluidos: la madera no flota'); cerca(ma.Vs, 0.0012, 1e-12, 'volumen sumergido de la madera');
    cerca(1 - r('iceberg').Vs / 1000, 1 - 917 / 1025, 1e-12, 'parte visible del iceberg');
    const fe = r('hierro');
    if (fe.flota !== false) mal('Fluidos: el hierro no se hunde');
    cerca(fe.Pa, (7870 - 1000) * 1e-4 * 9.8, 1e-9, 'peso aparente del hierro'); cerca(fe.a, 9.8 * (1 - 1000 / 7870), 1e-9, 'aceleración al soltar el hierro');
    const co = r('corona');
    cerca(co.E, 0.6, 1e-9, 'empuje de la corona'); cerca(co.rhoC, (1000 * 10) / 0.6, 1e-6, 'densidad de la corona'); cerca(co.V, 0.6 / 9800, 1e-12, 'volumen de la corona');
    // al revés: con esa densidad y ese volumen vuelve a salir el peso aparente
    cerca(FluidosF.empuje({ datos: 'cuerpo', rhoC: String(co.rhoC), V: String(co.V), rhoF: '1000', g: '9.8' }).Pa, 9.4, 1e-9, 'peso aparente de vuelta');
    const ve = r('venturi');
    cerca(ve.v2, 8, 1e-12, 'Venturi: velocidad en el estrechamiento'); cerca(ve.p2, 1.5e5 - 500 * 60, 1e-6, 'Venturi: presión en el estrechamiento');
    const ca = r('casa'), v1 = 0.0015 / (Math.PI * 0.02 ** 2);
    cerca(ca.v1, v1, 1e-12, 'velocidad a partir del caudal'); cerca(ca.v2, 4 * v1, 1e-12, 'continuidad con la mitad de diámetro');
    cerca(ca.p2, 4e5 + 500 * (v1 * v1 - 16 * v1 * v1) - 1000 * 9.8 * 6, 1e-6, 'Bernoulli subiendo 6 m');
    const de = r('deposito');
    cerca(de.v, Math.sqrt(2 * 9.8 * 2), 1e-12, 'Torricelli: velocidad'); cerca(de.x, 2 * Math.sqrt(2), 1e-12, 'Torricelli: alcance'); cerca(de.tv, 2500 * Math.sqrt(4 / 9.8), 1e-9, 'Torricelli: tiempo de vaciado');
    if (FluidosF.f(302225) !== '3,022·10<sup>5</sup>') mal(`Fluidos: 302225 Pa sale «${FluidosF.f(302225)}»`);
    for (const [sc, q] of [[{ modo: 'tuboU', rho1: '1000', rho2: '13600', h2: '0.1' }, 'líquido añadido más denso'], [{ modo: 'tuboU', buscar: 'densidad', rho1: '1000', h1: '0.2', h2: '0.1' }, 'columna añadida más baja'], [{ modo: 'prensa', F1: '10', d1: '20', d2: '5' }, 'émbolo grande más estrecho'], [{ modo: 'empuje', datos: 'pesadas', P: '5', Pa: '6', rhoF: '1000' }, 'pesa más dentro del agua'], [{ modo: 'torricelli', H: '2', D: '1' }, 'depósito sin agujero'], [{ modo: 'presion', rho: '1000', h: '-3' }, 'profundidad negativa'], [{ modo: 'bernoulli', rho: '1000', d1: '10', d2: '5', v1: '2' }, 'sin la presión en 1']]) {
      let ok = false; try { FluidosF.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Fluidos: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Fluidos: ${FluidosF.ejemplos.length} ejemplos, presión, tubo en U, prensa, Arquímedes, Bernoulli, Torricelli y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'fluidos', 'index.html'));
      await page.waitForFunction(() => window.FluidosApp);
      const antes = fallos;
      const verF = (await page.locator('#ver').textContent()).trim();
      if (verF !== Version.de('fluidos').current) mal(`Fluidos: la página muestra la versión «${verF}», se esperaba ${Version.de('fluidos').current}`);
      for (const e of FluidosF.ejemplos) {
        await page.evaluate((c) => FluidosApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(120);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
        if (r.err || r.pasos < 3 || r.res < 2) mal(`Fluidos · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Fluidos · ${e.clave}: el desarrollo no sale en MathML`);
      }
      await page.evaluate(() => FluidosApp.abrirEjemplo('elevador'));
      if (!(await page.locator('#resumen').textContent()).includes('147')) mal('Fluidos: la fuerza del elevador no sale en la página');
      await page.selectOption('#f-modo', 'tuboU');
      await page.fill('#f-rho2', '1200');
      if (await page.locator('#error').isHidden()) mal('Fluidos: un líquido añadido más denso no muestra el error');
      await page.selectOption('#f-modo', 'empuje');
      await page.selectOption('#f-datos', 'pesadas');
      if ((await page.locator('#f-Pa').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Fluidos: al elegir las pesadas no pide el peso en el fluido o da error');
      await page.selectOption('#f-modo', 'bernoulli');
      await page.waitForTimeout(300);
      await page.click('#play');
      await page.close();
      if (consola.length) mal('Fluidos: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Fluidos: ${FluidosF.ejemplos.length} ejemplos con MathML, cambio de datos y errores sin errores de consola`);
    }
  };
};
