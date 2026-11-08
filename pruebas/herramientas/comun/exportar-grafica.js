/* Prueba común del botón «Guardar PNG» / «Copiar datos» (Herramienta.exportaGrafica, fuente/herramienta.js).
   Uso en la prueba de cada herramienta, con la página ya cargada:
     const Exp = require('./comun/exportar-grafica.js');
     Exp.csv(mal);                                   // el CSV a mano (una vez, en Node)
     await Exp.pagina(page, '#grafica', mal, 'Bode'); // los dos botones en el navegador */
const path = require('path');
const csv = (mal) => {
  const H = global.Herramienta || require(path.join(__dirname, '..', '..', '..', 'fuente', 'herramienta.js'));
  const t = H.csv([['f (Hz)', 'a;b'], [1000.5, -0.5], [1e-7, 'x"y'], [NaN, 3]]);
  const esperado = 'f (Hz);"a;b"\n1000,5;-0,5\n1e-7;"x""y"\n;3';
  if (t !== esperado) mal(`Exportar: el CSV sale «${JSON.stringify(t)}» en vez de «${JSON.stringify(esperado)}»`);
  if (H.nombreArchivo('Control · Nyquist (K=2)', 'png').endsWith('control-nyquist-k-2.png') === false && !/nyquist-k-2\.png$/.test(H.nombreArchivo('Control · Nyquist (K=2)', 'png'))) mal('Exportar: nombre de archivo raro');
};
const pagina = async (page, sel, mal, etiqueta) => {
  try { await page.context().grantPermissions(['clipboard-read', 'clipboard-write']); } catch (e) { /* sin permisos de portapapeles */ }
  const caja = page.locator(sel + ' + .exportar');
  if (await caja.count() !== 1) return mal(`${etiqueta}: la gráfica ${sel} no tiene los botones de exportar`);
  const botones = caja.locator('button');
  if ((await botones.count()) !== 2 || (await botones.nth(0).textContent()) !== 'Guardar PNG' || (await botones.nth(1).textContent()) !== 'Copiar datos') mal(`${etiqueta}: botones de exportar distintos de los comunes`);
  if ((await caja.getAttribute('role')) !== 'group' || !(await caja.getAttribute('aria-label'))) mal(`${etiqueta}: el grupo de exportar no tiene role=group y nombre`);
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), botones.nth(0).click()]);
  if (!d) mal(`${etiqueta}: «Guardar PNG» no descarga nada`);
  else {
    if (!/\.png$/.test(d.suggestedFilename())) mal(`${etiqueta}: el archivo se llama ${d.suggestedFilename()}`);
    const buf = await require('fs').promises.readFile(await d.path());
    if (buf.length < 500 || buf.readUInt32BE(0) !== 0x89504e47) mal(`${etiqueta}: el PNG descargado no es una imagen`);
  }
  await botones.nth(1).click();
  await page.waitForFunction((s) => /copiados|No se pudo|No hay/.test(document.querySelector(s + ' + .exportar [role=status]').textContent), sel, { timeout: 5000 }).catch(() => {});
  const estado = await caja.locator('[role=status]').textContent();
  if (!/Datos copiados/.test(estado)) mal(`${etiqueta}: «Copiar datos» dice «${estado}»`);
  else {
    let tx = null; try { tx = await page.evaluate(() => navigator.clipboard.readText()); } catch (e) { /* no se puede leer */ }
    if (tx !== null) { const ls = tx.split('\n'); if (ls.length < 3 || !/;/.test(ls[0]) || ls.slice(1).some((l) => l.split(';').length !== ls[0].split(';').length)) mal(`${etiqueta}: el CSV copiado no tiene forma de tabla`); }
  }
};
module.exports = { csv, pagina };
