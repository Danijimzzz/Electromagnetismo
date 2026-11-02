#!/usr/bin/env node
/* ===== Comprobación de accesibilidad con axe-core =====
   Pasa axe-core (reglas WCAG 2.0/2.1 A y AA y buenas prácticas) por todas las páginas de publico/
   (herramientas, fenómenos, portada, novedades, fuentes y páginas legales) en tres vistas:
   claro, oscuro y móvil de 390 px (en oscuro y claro, escritorio de 1280 px). Falla si hay alguna
   infracción que no esté en EXCEPCIONES. Usa publico/, así que antes hay que compilar.
   Uso: node pruebas/accesibilidad.js [--solo CARPETA] [--vista claro|oscuro|movil]   (comprobar.js la llama con su navegador) */
const fs = require('fs'), path = require('path');
const publico = path.join(__dirname, '..', 'publico');

// Reglas que no se comprueban y por qué (cada una con su motivo; mejor vacía).
const EXCEPCIONES = {};

const VISTAS = {
  claro: { viewport: { width: 1280, height: 900 }, colorScheme: 'light' },
  oscuro: { viewport: { width: 1280, height: 900 }, colorScheme: 'dark' },
  movil: { viewport: { width: 390, height: 844 }, colorScheme: 'light' },
};

function paginas(dir = publico, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) paginas(p, acc);
    else if (e.name.endsWith('.html') && !/^google/.test(e.name) && !/http-equiv="refresh"/.test(fs.readFileSync(p, 'utf8'))) acc.push(p); // las páginas de redirección no se miran
  }
  return acc.sort();
}

async function accesibilidad(browser, { mal, solo, vistas } = {}) {
  mal = mal || ((m) => { console.log('  ✗ ' + m); process.exitCode = 1; });
  let axe;
  try { axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch (e) {
    try { axe = fs.readFileSync(path.join(require('child_process').execFileSync('npm', ['root', '-g']).toString().trim(), 'axe-core', 'axe.min.js'), 'utf8'); } catch (e2) { mal('no se encuentra axe-core (npm install --no-save axe-core@4.10.2)'); return { comprobadas: 0, paginas: 0, encontradas: new Map() }; }
  }
  let pags = paginas();
  if (solo) pags = pags.filter((p) => path.relative(publico, p).split(path.sep).includes(solo));
  const encontradas = new Map(); // «regla · vista» → { ayuda, impacto, paginas: Map(pagina → nodos) }
  let comprobadas = 0;
  for (const [nombre, v] of Object.entries(VISTAS)) {
    if (vistas && !vistas.includes(nombre)) continue;
    const ctx = await browser.newContext(v);
    const cola = [...pags];
    // cuatro páginas a la vez
    await Promise.all([0, 1, 2, 3].map(async () => { for (let archivo; (archivo = cola.shift()); ) {
      const rel = path.relative(publico, archivo).split(path.sep).join('/');
      const page = await ctx.newPage();
      await page.goto('file://' + archivo);
      await page.waitForLoadState('load');
      // sin animaciones ni transiciones, para medir el color final y no uno a medias
      await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important }' });
      await page.waitForTimeout(300); // deja que se monten las gráficas
      await page.evaluate(() => window.revisaScroll && window.revisaScroll()); // y se hace la pasada de fuente/accesibilidad.js
      await page.addScriptTag({ content: axe });
      const r = await page.evaluate(async (ex) => axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
        rules: Object.fromEntries(ex.map((id) => [id, { enabled: false }])),
      }), Object.keys(EXCEPCIONES));
      for (const x of r.violations) {
        const k = `${x.id} · ${nombre}`;
        if (!encontradas.has(k)) encontradas.set(k, { ayuda: x.help, impacto: x.impact, paginas: new Map() });
        encontradas.get(k).paginas.set(rel, x.nodes.map((n) => n.target.join(' ') + ' → ' + (n.any[0] || n.all[0] || n.none[0] || {}).message));
      }
      await page.close();
      comprobadas++;
    } }));
    await ctx.close();
  }
  if (process.env.AX_DETALLE) fs.writeFileSync(process.env.AX_DETALLE, JSON.stringify([...encontradas].map(([k, d]) => [k, [...d.paginas]]), null, 1));
  for (const [k, d] of encontradas) {
    const ejemplos = [...d.paginas].slice(0, 3).map(([p, n]) => `${p}: ${n[0]}`).join('\n        ');
    mal(`${k} (${d.impacto}): ${d.ayuda}. En ${d.paginas.size} páginas, p. ej.\n        ${ejemplos}`);
  }
  return { comprobadas, paginas: pags.length, encontradas };
}

module.exports = accesibilidad;

if (require.main === module) {
  const args = process.argv.slice(2), arg = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
  (async () => {
    const { chromium } = require('playwright');
    const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
    const browser = require('./sin-anuncios.js')(await chromium.launch(exe ? { executablePath: exe } : {}));
    const vista = arg('--vista');
    const r = await accesibilidad(browser, { solo: arg('--solo'), vistas: vista ? [vista] : null });
    await browser.close();
    console.log(`${process.exitCode ? '✗' : '✓'} Accesibilidad: ${r.paginas} páginas en ${vista ? 1 : 3} vistas, ${r.encontradas.size} tipos de infracción`);
  })().catch((e) => { console.error(e); process.exit(1); });
}
