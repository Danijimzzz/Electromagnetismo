#!/usr/bin/env node
/* Prueba común del «Enunciado del ejercicio» (fuente/enunciado.js) en todas las herramientas con estado:
   1. sin enunciado: el apartado sale cerrado y vacío, y al imprimir no deja nada;
   2. escribir un enunciado (con fórmula, saltos de línea, <, & y comillas), cambiar un dato y recargar: vuelve;
   3. el texto va dentro del estado guardado (campo _enunciado) cuando alguien lo lee («simu-guardar»);
   4. «Mis ejercicios»: guardar, cambiar el enunciado, abrir lo guardado → vuelve el de lo guardado (el .simu.json, la
      copia de seguridad y el enlace #d=… llevan el mismo texto de datos: se prueban aparte, abajo);
   5. un estado de antes (sin el campo) se abre con el enunciado vacío;
   6. al imprimir sale con su título y el texto (y sin el cuadro de edición).
   Además, en Node: con/de/sin. Usa publico/, así que antes hay que compilar.
   Uso: node pruebas/enunciado.js [--solo CARPETA]   (comprobar.js la llama con su navegador) */
const fs = require('fs'), path = require('path');
const publico = path.join(__dirname, '..', 'publico');
const Catalogo = require('../fuente/catalogo.js'), Enunciado = require('../fuente/enunciado.js');
const TEXTO = 'Una carga $q = 2·10^{-6}$ C a 3 cm de otra <b>carga</b> & "algo más".\nSegunda línea: calcula el campo.';

function nodo(mal) {
  const e = (c, ok) => { if (!ok) mal(`enunciado.js (Node): ${c}`); };
  const d = JSON.stringify({ a: 1, b: [2, 3] });
  const c = Enunciado.con(d, TEXTO);
  e('con() añade el campo', Enunciado.de(c) === TEXTO);
  e('con() no pierde el resto del estado', JSON.parse(c).a === 1 && JSON.parse(c).b.length === 2);
  e('sin() lo quita y deja el resto igual', Enunciado.sin(c) === d);
  e('con(vacío) lo quita', Enunciado.con(c, '  ') === d);
  e('de() de un estado de antes es vacío', Enunciado.de(d) === '');
  e('con() no toca lo que no es un objeto', Enunciado.con('[1,2]', 'x') === null && Enunciado.con('hola', 'x') === null && Enunciado.con('"x"', 'x') === null);
  e('de() no revienta con basura', Enunciado.de('{no json') === '' && Enunciado.de(null) === '');
  // la copia de seguridad y la restauración (biblioteca.js) llevan el estado tal cual, con el enunciado dentro
  {
    const Biblioteca = require('../fuente/biblioteca.js');
    const alm = () => { const m = new Map(); return { get length() { return m.size; }, key: (i) => [...m.keys()][i], getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
    const a = alm(), b = alm();
    a.setItem('simu-ejercicios:ph', JSON.stringify({ items: [{ id: 'x1', titulo: 'Con enunciado', datos: c, actualizado: 1 }, { id: 'x2', titulo: 'De antes', datos: d, actualizado: 2 }] }));
    Biblioteca.restaura(JSON.parse(JSON.stringify(Biblioteca.copia(a))), b);
    const its = JSON.parse(b.getItem('simu-ejercicios:ph')).items;
    e('la copia de seguridad conserva el enunciado y los ejercicios sin él', its.length === 2 && Enunciado.de(its[0].datos) === TEXTO && Enunciado.de(its[1].datos) === '');
  }
  e('con() recorta a MAX', Enunciado.de(Enunciado.con(d, 'x'.repeat(Enunciado.MAX + 50))).length === Enunciado.MAX);
}

function otroNumero(v) {
  const m = /^(−|-)?(\d+)(?:[.,](\d+))?$/.exec(v.trim());
  if (!m) return null;
  const x = +(`${m[2]}.${m[3] || 0}`), dd = (m[3] || '').length, y = x === 0 ? 1 : x * 1.5;
  return (m[1] || '') + (dd ? y.toFixed(dd) : String(Math.round(y) === x ? x + 1 : Math.round(y))).replace('.', ',');
}

async function prueba(browser, { mal, solo, filtro } = {}) {
  mal = mal || ((m) => { console.log('  ✗ ' + m); process.exitCode = 1; });
  if (!solo) nodo(mal);
  let probadas = 0; const sinEstado = [], sinBloque = [];
  const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible && h.scripts).map((h) => `${a.clave}/${h.clave}`));
  for (const pag of pags) {
    const archivo = path.join(publico, ...pag.split('/'), 'index.html');
    const html = fs.readFileSync(archivo, 'utf8');
    const [, dir, clave] = html.match(/Biblioteca\.monta\('([^']+)', (?:'([^']+)'|null)\)/) || [];
    if (!dir || (solo && solo !== dir && solo !== pag.split('/')[1]) || (filtro && !filtro(dir))) continue;
    const tiene = /Enunciado\.monta\(/.test(html), debe = !!clave && Catalogo.asignaturas.flatMap((a) => a.herramientas).find((h) => h.clave === pag.split('/')[1]).enunciado !== false;
    if (tiene !== debe) { mal(`${pag}: ${debe ? 'debería tener' : 'no debería tener'} el apartado «Enunciado» y ${tiene ? 'lo tiene' : 'no lo tiene'}`); continue; }
    if (!tiene) { sinBloque.push(dir); continue; }
    const consola = [];
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + archivo); await page.waitForLoadState('load');
    await page.waitForSelector('.enun-bloque'); await page.waitForSelector('.bib .bib-acc');
    const lee = () => page.evaluate(() => { const b = document.querySelector('.enun-bloque'); return { abierto: b.open, texto: b.querySelector('textarea').value, imp: b.querySelector('.enun-imp').textContent, vacio: b.classList.contains('vacio') }; });
    const estado = () => page.evaluate((k) => { window.dispatchEvent(new Event('simu-guardar')); return localStorage.getItem(k); }, clave);
    const r0 = await lee();
    if (r0.abierto || r0.texto || r0.imp || !r0.vacio) mal(`${pag}: sin enunciado debería salir cerrado y vacío (${JSON.stringify(r0)})`);
    // el apartado va justo debajo del título y antes de las herramientas
    const orden = await page.evaluate(() => { const b = document.querySelector('.enun-bloque'), l = document.querySelector('main .layout, .layout'); return { dentro: !!b.closest('main'), antes: !l || !!(b.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
    if (!orden.dentro || !orden.antes) mal(`${pag}: el apartado «Enunciado» no está en el contenido y antes de la herramienta`);
    // escribir, y cambiar un dato de la app (esta guarda su estado sin el campo)
    await page.click('.enun-bloque > summary'); await page.fill('#enunciado-texto', TEXTO);
    const num = await page.evaluate(() => { const e = [...document.querySelectorAll('.wrap input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=file])')].find((x) => x.id && !!(x.offsetWidth || x.offsetHeight) && !x.closest('.bib, .prac, header, [hidden], .enun-bloque') && /^[−-]?\d+([.,]\d+)?$/.test(x.value.trim())); return e ? { id: e.id, valor: e.value } : null; });
    if (num) { const s = '#' + num.id.replace(/([^\w-])/g, '\\$1'); if (await page.$(s)) { await page.fill(s, otroNumero(num.valor)); await page.dispatchEvent(s, 'change'); } }
    // copiar como texto y como LaTeX (compartir.js) llevan el enunciado, con las fórmulas pasadas a LaTeX
    const co = await page.evaluate(() => (typeof Compartir === 'undefined' ? null : { txt: Compartir.ejercicio(false), tex: Compartir.ejercicio(true) }));
    if (co) {
      if (!/Enunciado\n.*Segunda línea/s.test(co.txt)) mal(`${pag}: «Copiar como texto» no lleva el enunciado`);
      if (!co.tex.includes('\\section*{Enunciado}') || !co.tex.includes('Segunda línea') || !co.tex.includes('$q = 2')) mal(`${pag}: «Copiar en LaTeX» no lleva bien el enunciado`);
    }
    const d1 = await estado();
    if (d1 == null) { sinEstado.push(dir); }
    else {
      let o = null; try { o = JSON.parse(d1); } catch (e) { /* no es JSON */ }
      if (!o || typeof o !== 'object') sinEstado.push(dir + ' (el estado no es un objeto JSON)');
      else if (o._enunciado !== TEXTO) mal(`${pag}: el estado guardado no lleva el enunciado (${String(o._enunciado).slice(0, 40)})`);
      // Mis ejercicios: guardar, quitar el enunciado y abrir lo guardado
      await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', 'Con enunciado'); await page.click('.bib [data-acc=guardar]');
      const g = await page.evaluate((k) => (JSON.parse(localStorage.getItem(k) || '{"items":[]}').items || []).find((x) => x.titulo === 'Con enunciado'), `simu-ejercicios:${dir}`);
      if (!g) mal(`${pag}: no se guardó el ejercicio`);
      else {
        if (Enunciado.de(g.datos) !== TEXTO) mal(`${pag}: Mis ejercicios guarda el ejercicio sin su enunciado`);
        await page.fill('#enunciado-texto', 'Otro enunciado distinto');
        await Promise.all([page.waitForEvent('load'), page.click('.bib .bib-it .bib-abre')]);
        await page.waitForSelector('.enun-bloque');
        const r = await lee();
        if (r.texto !== TEXTO || !r.abierto) mal(`${pag}: al abrir lo guardado el enunciado es «${r.texto.slice(0, 30)}» y se guardó el de verdad`);
      }
      // recarga a secas: el enunciado sigue (también tras cambiar un dato después de escribirlo, ver arriba)
      await page.reload(); await page.waitForSelector('.enun-bloque');
      const r2 = await lee();
      if (r2.texto !== TEXTO) mal(`${pag}: tras recargar el enunciado es «${r2.texto.slice(0, 30)}»`);
      // al imprimir: título y texto, sin el cuadro de edición
      await page.emulateMedia({ media: 'print' });
      const imp = await page.evaluate(() => {
        const b = document.querySelector('.enun-bloque'), i = b.querySelector('.enun-imp'), cs = (e) => getComputedStyle(e);
        return { visible: cs(b).display !== 'none' && cs(i).display !== 'none', titulo: getComputedStyle(i, '::before').content, texto: i.textContent, edicion: cs(b.querySelector('.enun-cuerpo')).display !== 'none', resumen: cs(b.querySelector('summary')).display !== 'none' };
      });
      if (!imp.visible || !/Enunciado/.test(imp.titulo) || !imp.texto.includes('<b>carga</b> &') || !imp.texto.includes('Segunda línea') || imp.edicion || imp.resumen) mal(`${pag}: al imprimir no sale bien el enunciado (${JSON.stringify(imp)})`);
      if (!/<math/.test(await page.evaluate(() => document.querySelector('.enun-imp').innerHTML)) && (await page.evaluate(() => typeof Mates !== 'undefined'))) mal(`${pag}: la fórmula del enunciado no sale en MathML al imprimir`);
      await page.emulateMedia({ media: 'screen' });
      // un estado de antes, sin el campo: enunciado vacío y nada al imprimir
      // (se bloquean las escrituras de la clave hasta recargar, como hace «Mis ejercicios» al abrir uno: si no, la página vuelve a guardar su texto al irse)
      await page.evaluate((k) => { const o = JSON.parse(localStorage.getItem(k)); delete o._enunciado; localStorage.setItem(k, JSON.stringify(o)); const pon = Storage.prototype.setItem; Storage.prototype.setItem = function (c, v) { return c === k ? undefined : pon.call(this, c, v); }; }, clave);
      await page.reload(); await page.waitForSelector('.enun-bloque');
      const r3 = await lee();
      if (r3.texto || r3.abierto || !r3.vacio) mal(`${pag}: un estado sin el campo debería abrirse sin enunciado`);
      await page.emulateMedia({ media: 'print' });
      if (await page.evaluate(() => getComputedStyle(document.querySelector('.enun-bloque')).display) !== 'none') mal(`${pag}: sin enunciado, al imprimir no debería salir nada`);
    }
    await page.close();
    if (consola.length) mal(`${pag}: consola del navegador:\n      ` + consola.join('\n      '));
    probadas++;
  }
  return { probadas, sinEstado, sinBloque };
}

module.exports = prueba;

if (require.main === module) {
  const args = process.argv.slice(2), i = args.indexOf('--solo'), solo = i >= 0 ? args[i + 1] : null;
  (async () => {
    const { chromium } = require('playwright');
    const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
    const browser = require('./sin-anuncios.js')(await chromium.launch(exe ? { executablePath: exe } : {}));
    const r = await prueba(browser, { solo });
    await browser.close();
    console.log(`${process.exitCode ? '✗' : '✓'} Enunciado: ${r.probadas} herramientas${r.sinBloque.length ? ` · sin apartado: ${r.sinBloque.join(', ')}` : ''}${r.sinEstado.length ? ` · sin estado que lleve el enunciado: ${r.sinEstado.join(', ')}` : ''}`);
  })().catch((e) => { console.error(e); process.exit(1); });
}
