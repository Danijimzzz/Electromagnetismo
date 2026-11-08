/* Prueba común de «Descargar PNG» / «Copiar datos» (Herramienta.exportar, fuente/herramienta.js).
   Uso en la prueba de cada herramienta, con la página ya cargada:
     const Exp = require('./comun/exportar-grafica.js');
     Exp.csv(mal);                                    // la tabla a mano (una vez, en Node)
     await Exp.pagina(page, '#grafica', mal, 'Bode'); // los dos botones en el navegador */
const path = require('path');
const csv = (mal) => {
  const H = global.Herramienta || require(path.join(__dirname, '..', '..', '..', 'fuente', 'herramienta.js'));
  const t = H.tabla(['f (Hz)', 'a'], [[1000.5, -0.5], [1e-7, 'x\ty'], [NaN, 3]]);
  if (t !== 'f (Hz)\ta\n1000,5\t-0,5\n1e-7\tx y\n\t3') mal(`Exportar: la tabla sale ${JSON.stringify(t)}`);
};
const pagina = async (page, sel, mal, etiqueta) => {
  try { await page.context().grantPermissions(['clipboard-read', 'clipboard-write']); } catch (e) { /* sin permisos de portapapeles */ }
  const h = (await page.evaluateHandle((s) => { const c = document.querySelector(s); return c && c._exporta && c._exporta.barra; }, sel)).asElement();
  if (!h) return mal(`${etiqueta}: la gráfica ${sel} no tiene los botones de exportar`);
  const bs = await h.$$('button'), est = await h.$('[role=status]');
  const textos = await Promise.all(bs.map((b) => b.textContent()));
  if (textos.join('|') !== 'Descargar PNG|Copiar datos') mal(`${etiqueta}: botones de exportar distintos de los comunes (${textos.join('|')})`);
  if ((await h.getAttribute('role')) !== 'group' || !(await h.getAttribute('aria-label'))) mal(`${etiqueta}: el grupo de exportar no tiene role=group y nombre`);
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), bs[0].click()]);
  if (!d) mal(`${etiqueta}: «Descargar PNG» no descarga nada`);
  else {
    if (!/\.png$/.test(d.suggestedFilename())) mal(`${etiqueta}: el archivo se llama ${d.suggestedFilename()}`);
    const buf = await require('fs').promises.readFile(await d.path());
    if (buf.length < 500 || buf.readUInt32BE(0) !== 0x89504e47) mal(`${etiqueta}: el PNG descargado no es una imagen`);
  }
  await bs[1].click();
  await page.waitForTimeout(150);
  const estado = await est.textContent();
  if (!/Datos copiados/.test(estado)) return mal(`${etiqueta}: «Copiar datos» dice «${estado}»`);
  let tx = null; try { tx = await page.evaluate(() => navigator.clipboard.readText()); } catch (e) { /* no se puede leer */ }
  if (tx !== null) { const ls = tx.split('\n'); if (ls.length < 3 || !/\t/.test(ls[0]) || ls.slice(1).some((l) => l.split('\t').length !== ls[0].split('\t').length)) mal(`${etiqueta}: lo copiado no tiene forma de tabla`); }
};
module.exports = { csv, pagina };
