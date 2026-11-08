/* Comprobación común del botón «Descargar PNG» / «Copiar datos» de una gráfica (Herramienta.exportar).
   Uso en el navegador de una herramienta: await require('./comun/exportar.js')(page, mal, 'Series', { lienzo: '#grafica', datos: true }); */
module.exports = async (page, mal, nombre, { lienzo = '#grafica', datos = true } = {}) => {
  const r = await page.evaluate((c) => {
    const el = document.querySelector(c), barra = el && (el._exporta ? el._exporta.barra : null);
    return { hay: !!barra, botones: barra ? [...barra.querySelectorAll('button')].map((b) => b.textContent) : [], aria: barra ? barra.getAttribute('role') + '|' + barra.getAttribute('aria-label') : '', ancho: document.documentElement.scrollWidth <= window.innerWidth + 1 };
  }, lienzo);
  if (!r.hay) { mal(`${nombre}: la gráfica ${lienzo} no tiene los botones de exportar`); return; }
  if (r.botones[0] !== 'Descargar PNG') mal(`${nombre}: falta «Descargar PNG» (${r.botones})`);
  if (datos && r.botones[1] !== 'Copiar datos') mal(`${nombre}: falta «Copiar datos» (${r.botones})`);
  if (!/^group\|Exportar/.test(r.aria)) mal(`${nombre}: la barra de exportar no está rotulada (${r.aria})`);
  if (!r.ancho) mal(`${nombre}: la barra de exportar desborda la página`);
  if (datos) {
    await page.evaluate(() => { window.__copiado = null; navigator.clipboard.writeText = async (t) => { window.__copiado = t; }; });
    await page.evaluate((c) => document.querySelector(c)._exporta.barra.querySelectorAll('button')[1].click(), lienzo);
    await page.waitForTimeout(150);
    const t = await page.evaluate(() => window.__copiado);
    if (!t || !t.includes('\t') || !/\n/.test(t)) mal(`${nombre}: «Copiar datos» no copia una tabla con tabuladores (${JSON.stringify(t)})`);
  }
};
