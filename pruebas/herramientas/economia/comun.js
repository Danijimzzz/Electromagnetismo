/* Lo común de las comprobaciones de las herramientas de Economía (las de EcoApp, en
   fuente/economia/interfaz.js). Cada pruebas/herramientas/<carpeta>.js de Economía lo usa así:
     const Com = require('./economia/comun.js');
     const { cerca, error } = Com.node(nombre, mal);        // en Node
     return Com.navegador({ … })                           // la parte del navegador
   cerca(a, b, tol, qué) falla si |a − b| > tol; error(sc, qué) falla si resolver(sc) no da error.
   navegador abre la página, mira la versión del pie, cada ejemplo (resultados, desarrollo en
   MathML sin $ sueltos, gráfica sin errores) y que un dato malo muestra el error. */
const path = require('path');
module.exports = {
  node(nombre, mal, C) {
    const cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`${nombre} · ${q}: ${a} en vez de ${b}`); };
    const error = (sc, q) => { let ok = false; try { C.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`${nombre}: ${q} no da error`); };
    const ej = (c) => { const e = C.ejemplos.find((x) => x.clave === c); if (!e) throw new Error(`${nombre}: no hay ejemplo «${c}»`); return C.resolver(e.sc); };
    return { cerca, error, ej };
  },
  // { publico, asignatura, carpeta, nombre, app, C, pagina, mal, malo: { k, v }, extra: async (page) => {} }
  navegador({ publico, asignatura = 'economia', carpeta, nombre, app, C, pagina, mal, malo, extra }) {
    return async (browser) => {
      let fallos = 0; const m = (x) => { fallos++; mal(x); };
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, asignatura, carpeta, 'index.html'));
      await page.waitForFunction((a) => window[a], app);
      const ver = (await page.locator('#ver').textContent()).trim();
      if (ver !== Version.de(carpeta).current) m(`${nombre}: la página muestra la versión «${ver}», se esperaba ${Version.de(carpeta).current}`);
      for (const e of C.ejemplos) {
        await page.evaluate(([a, c]) => window[a].abrirEjemplo(c), [app, e.clave]);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
        if (r.err || !r.pasos || !r.res) m(`${nombre} · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) m(`${nombre} · ${e.clave}: el desarrollo no sale en MathML`);
      }
      if (malo) {
        await page.evaluate(([a, c]) => window[a].abrirEjemplo(c), [app, C.ejemplos[0].clave]);
        await page.fill(`#f-${malo.k}`, malo.v);
        if (await page.locator('#error').isHidden()) m(`${nombre}: «${malo.v}» en ${malo.k} no muestra el error`);
      }
      if (extra) await extra(page, m);
      await page.close();
      if (consola.length) m(`${nombre}: consola del navegador:\n      ` + consola.join('\n      '));
      if (!fallos) console.log(`  ✓ ${nombre}: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
    };
  },
};
