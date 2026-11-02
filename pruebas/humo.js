#!/usr/bin/env node
/* Prueba de humo de todas las herramientas disponibles del catálogo, la misma para todas:
   1. abre la página y cambia un dato (el primer campo con un número, o si no un desplegable);
   2. lo guarda en «Mis ejercicios», vuelve a cambiar el dato y abre lo guardado, que recarga la página;
   3. comprueba que tras la recarga vuelven el estado guardado y el dato en pantalla;
   4. pulsa el botón de modo oscuro y mira la página a 390 px, sin desbordar a lo ancho;
   y falla con cualquier error o aviso en la consola. Usa publico/, así que antes hay que compilar.
   Uso: node pruebas/humo.js [--solo CARPETA]   (comprobar.js la llama con su navegador) */
const fs = require('fs'), path = require('path');
const publico = path.join(__dirname, '..', 'publico');
const Catalogo = require('../fuente/catalogo.js');

// un número como los que escribe la gente (coma decimal, signo, 3e8 o 3·10^8) cambiado sin salirse de su rango
function otroNumero(v) {
  const m = /^(−|-)?(\d+)(?:[.,](\d+))?$/.exec(v.trim());
  if (!m) return null;
  const x = +(`${m[2]}.${m[3] || 0}`), d = (m[3] || '').length;
  const y = x === 0 ? 1 : x * 1.5;
  return (m[1] || '') + (d ? y.toFixed(d) : String(Math.round(y) === x ? x + 1 : Math.round(y))).replace('.', ',');
}

// páginas sin ejercicio que copiar: la tabla periódica, el editor de circuitos y Electrostática (que tiene su propia exportación)
const SIN_COMPARTIR = ['quimica/tabla-periodica', 'circuitos/simulador', 'electromagnetismo/electrostatica'];

async function humo(browser, { mal, solo, filtro } = {}) {
  mal = mal || ((m) => { console.log('  ✗ ' + m); process.exitCode = 1; });
  const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
  let probadas = 0, sinDato = [];
  for (const pag of pags) {
    const archivo = path.join(publico, ...pag.split('/'), 'index.html');
    // la carpeta y la clave de localStorage, de la llamada que monta Mis ejercicios en la página
    const [, dir = pag.split('/')[1], clave] = fs.readFileSync(archivo, 'utf8').match(/Biblioteca\.monta\('([^']+)', (?:'([^']+)'|null)\)/) || [];
    if (solo && solo !== dir && solo !== pag.split('/')[1]) continue;
    if (filtro && !filtro(dir)) continue; // un trozo de --parte N/M
    const consola = [];
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + archivo);
    await page.waitForLoadState('load');
    // compartir (compartir.js), con el ejemplo de partida: botones, texto y LaTeX con resultados y llaves bien cerradas; solo faltan donde no hay ejercicio que copiar
    const co = await page.evaluate(() => (typeof Compartir === 'undefined' ? null : { botones: document.querySelectorAll('.compartir button').length, txt: Compartir.ejercicio(false), tex: Compartir.ejercicio(true) }));
    if (!co) { if (!SIN_COMPARTIR.includes(pag)) mal(`${pag}: no tiene compartir.js`); }
    else {
      const llaves = co.tex.replace(/\\[{}]/g, '').split('').reduce((d, c) => (d < 0 ? d : d + (c === '{') - (c === '}')), 0);
      if (co.botones < 4) mal(`${pag}: faltan los botones de compartir (${co.botones})`);
      if (!/(Resultados|Desarrollo)/.test(co.txt)) mal(`${pag}: copiar como texto no saca resultados ni desarrollo`);
      if (/\[object|undefined|NaN/.test(co.txt + co.tex)) mal(`${pag}: al copiar sale «object», «undefined» o «NaN»`);
      if (llaves !== 0) mal(`${pag}: el LaTeX copiado tiene llaves sin cerrar`);
    }
    if (clave) {
      await page.waitForSelector('.bib .bib-acc');
      // los campos con un número y los desplegables de la página; se busca por id porque muchas
      // apps vuelven a pintar el formulario en cada cambio
      const datos = await page.evaluate(() => {
        const vis = (e) => e.id && !!(e.offsetWidth || e.offsetHeight) && !e.closest('.bib, .prac, header, [hidden]');
        const ins = [...document.querySelectorAll('.wrap input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=file]), .wrap textarea')].filter((e) => vis(e) && /^[−-]?\d+([.,]\d+)?$/.test(e.value.trim()));
        const sels = [...document.querySelectorAll('.wrap select')].filter((e) => vis(e) && !/^ejemplo/.test(e.id) && e.options.length > 1);
        return [...ins.map((e) => ({ tipo: 'campo', id: e.id, valor: e.value })), ...sels.map((e) => ({ tipo: 'lista', id: e.id, valor: e.value, otras: [...e.options].map((o) => o.value).filter((v) => v !== e.value) }))];
      });
      const css = (id) => '#' + id.replace(/([^\w-])/g, '\\$1');
      const pon = async (d, n) => {
        const sel = css(d.id);
        if (d.tipo === 'campo') {
          let v = d.valor; for (let k = 0; k < n; k++) v = otroNumero(v);
          await page.fill(sel, v); await page.dispatchEvent(sel, 'change'); return v;
        }
        const v = n ? d.otras[(n - 1) % d.otras.length] : d.valor; await page.selectOption(sel, v); return v;
      };
      const estado = () => page.evaluate((k) => { window.dispatchEvent(new Event('simu-guardar')); return localStorage.getItem(k); }, clave);
      // el primer dato que, cambiado, da otro estado válido (un cambio puede dejar un intervalo vacío o un dato fuera de rango)
      const antes = await estado();
      let dato = null, v1 = null;
      for (const d of datos.slice(0, 6)) {
        if (!(await page.$(css(d.id)))) continue;
        v1 = await pon(d, 1);
        if ((await estado()) !== antes) { dato = d; break; }
        if (d.tipo === 'campo') { await page.fill(css(d.id), d.valor); await page.dispatchEvent(css(d.id), 'change'); }
      }
      if (!dato) sinDato.push(dir);
      else {
        const sel = css(dato.id);
        await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', 'Humo'); await page.click('.bib [data-acc=guardar]');
        const guardado = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{"items":[]}').items, `simu-ejercicios:${dir}`);
        const g = guardado.find((x) => x.titulo === 'Humo');
        if (!g) mal(`${pag}: «Guardar el actual» no guarda el ejercicio`);
        else {
          await pon(dato, 2);
          await Promise.all([page.waitForEvent('load'), page.click('.bib .bib-it .bib-abre')]);
          await page.waitForSelector('.bib .bib-it.activo');
          if ((await page.evaluate((k) => localStorage.getItem(k), clave)) !== g.datos) mal(`${pag}: al abrir lo guardado no vuelve el estado`);
          const ahora = await page.evaluate((s) => document.querySelector(s)?.value, sel);
          if (ahora !== v1) mal(`${pag}: tras abrir lo guardado, ${sel} muestra «${ahora}» y se guardó «${v1}»`);
        }
      }
    }
    // modo oscuro con el botón de la cabecera y móvil sin desbordar
    if (await page.$('header.top .tema')) await page.click('header.top .tema');
    await page.setViewportSize({ width: 390, height: 800 });
    await page.waitForTimeout(50);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    if (ancho > 392) mal(`${pag}: a 390 px la página mide ${ancho} px de ancho`);
    await page.close();
    if (consola.length) mal(`${pag}: consola del navegador:\n      ` + consola.join('\n      '));
    probadas++;
  }
  return { probadas, sinDato };
}

module.exports = humo;

if (require.main === module) {
  const args = process.argv.slice(2), i = args.indexOf('--solo'), solo = i >= 0 ? args[i + 1] : null;
  (async () => {
    const { chromium } = require('playwright');
    const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
    const browser = require('./sin-anuncios.js')(await chromium.launch(exe ? { executablePath: exe } : {}));
    const r = await humo(browser, { solo });
    await browser.close();
    console.log(`${process.exitCode ? '✗' : '✓'} Humo: ${r.probadas} herramientas${r.sinDato.length ? ` (sin dato que cambiar: ${r.sinDato.join(', ')})` : ''}`);
  })().catch((e) => { console.error(e); process.exit(1); });
}
