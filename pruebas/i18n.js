#!/usr/bin/env node
/* Prueba de las traducciones (fuente/i18n.js y fuente/i18n/<idioma>/*.json). Usa publico/ (hay que compilar antes).
   En Node, para cada idioma con diccionarios:
     1. ningún texto sin traducir (valor "") y ninguna clave caducada (que ya no sale en el español de origen);
     2. cada traducción conserva las expresiones ${…}, las etiquetas HTML y las fórmulas $…$ de su original;
     3. lo generado compila (scripts en línea y externos), lleva lang, canonical propio y noindex mientras el idioma
        no sea indexable, y todos sus enlaces y recursos locales existen;
     4. el selector de idioma de la página enlaza con la misma página en español.
   En el navegador (comprobar.js pasa el suyo): cada página traducida abre sin errores, sin español visible (ni en la
   barra «Mis ejercicios», el modo práctica ni los ejemplos) y con los números en el formato del idioma.
   Uso: node pruebas/i18n.js   (necesita Playwright) */
const fs = require('fs'), path = require('path'), http = require('http'), vm = require('vm');
const publico = path.join(__dirname, '..', 'publico');
const I18n = require('../fuente/i18n.js'), Idiomas = require('../fuente/idiomas.js');

const expresiones = (t) => { const m = []; const re = /\$\{/g; let q; while ((q = re.exec(t))) { let prof = 1, j = q.index + 2; while (j < t.length && prof) { if (t[j] === '{') prof++; else if (t[j] === '}') prof--; j++; } m.push(t.slice(q.index, j)); re.lastIndex = j; } return m; };
// esqueleto de una expresión: sin el texto de sus cadenas (que sí se traduce), con las expresiones anidadas
const esqueleto = (x) => x.replace(/`([^`]*)`/g, (m, c) => '`' + (c.match(/\$\{[^}]*\}/g) || []).join('') + '`').replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, "''");
const etiquetas = (t) => (t.match(/<\/?[a-zA-Z][^>]*>/g) || []).map((x) => x.replace(/\s+/g, ' ').replace(/\s*\/?>$/, '>')).sort().join('|');
const formulas = (t) => (t.replace(/\$\{[^}]*\}/g, '').match(/\$[^$]+\$/g) || []).length;
// Español visible: letras con tilde o palabras muy españolas (en un texto en inglés no deberían salir)
const ESPANOL = /[áéíóúñ¿¡]|\b(el|los|las|una|del|para|con|que|por|desde|sobre|cuando|como|más)\b/i;

function nodo(mal) {
  const e = (c, ok) => { if (!ok) mal(`i18n (Node): ${c}`); };
  let total = 0;
  for (const I of Idiomas.IDIOMAS.filter((x) => x.c !== 'es')) {
    const dir = path.join(I18n.DIR, I.c); if (!fs.existsSync(dir)) continue;
    const r = I18n.generar(I.c);
    e(`${I.c}: hay textos sin traducir: ${r.faltan.slice(0, 3).map((x) => x.slice(0, 50)).join(' | ')}`, r.faltan.length === 0);
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      for (const [k, v] of Object.entries(d)) {
        total++;
        if (v === '') { e(`${I.c}/${f}: sin traducir «${k.slice(0, 60)}»`, false); continue; }
        if (v === null) continue;
        if (!r.usadas.has(k)) e(`${I.c}/${f}: clave caducada (ya no sale en el español) «${k.slice(0, 60)}»`, false);
        if ([...new Set(expresiones(k).map(esqueleto))].sort().join('¦') !== [...new Set(expresiones(v).map(esqueleto))].sort().join('¦')) e(`${I.c}/${f}: las expresiones \${…} no coinciden «${k.slice(0, 60)}»`, false);
        if (etiquetas(k.replace(/\$\{[^}]*\}/g, '')) !== etiquetas(v.replace(/\$\{[^}]*\}/g, ''))) e(`${I.c}/${f}: las etiquetas HTML no coinciden «${k.slice(0, 60)}»`, false);
        if (formulas(k) !== formulas(v)) e(`${I.c}/${f}: el número de fórmulas $…$ no coincide «${k.slice(0, 60)}»`, false);
      }
    }
    for (const h of I18n.paginasTraducidas(I.c)) {
      const out = path.join(publico, I.c, h.asignatura, h.clave, 'index.html'), html = fs.readFileSync(out, 'utf8'), n = `${I.c}/${h.asignatura}/${h.clave}`;
      e(`${n}: lang="${I.html}"`, html.includes(`<html lang="${I.html}">`));
      e(`${n}: canonical propio`, html.includes(`<link rel="canonical" href="${require('../fuente/catalogo.js').web}/${I.c}/${h.asignatura}/${h.clave}/">`));
      e(`${n}: noindex mientras el idioma no es indexable`, I.indexar || html.includes('name="robots" content="noindex'));
      for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
        if (/src=|ld\+json|adsbygoogle/.test(m[1] || '')) continue;
        try { new vm.Script(m[2]); } catch (err) { e(`${n}: un script en línea no compila: ${err.message}`, false); }
      }
      for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) if (!/^https?:/.test(m[1])) {
        const f = path.join(path.dirname(out), m[1].split('?')[0]);
        if (!fs.existsSync(f)) e(`${n}: no existe el script ${m[1]}`, false);
        else try { new vm.Script(fs.readFileSync(f, 'utf8')); } catch (err) { e(`${n}: ${m[1]} no compila: ${err.message}`, false); }
      }
      for (const m of html.matchAll(/\b(?:href|src)="([^"#:]*)(?:#[^"]*)?"/g)) if (m[1] && !/^(?:data|mailto|https?)/.test(m[1])) {
        const f = path.join(path.dirname(out), m[1]); if (!fs.existsSync(f) && !fs.existsSync(f + 'index.html')) e(`${n}: enlace o recurso que no existe: ${m[1]}`, false);
      }
      const hrefs = [...html.matchAll(/<a href="([^"]*)" hreflang="([a-z-]+)"/g)].map((x) => [x[2], x[1]]);
      e(`${n}: el selector enlaza con el español y con ${I.c}`, hrefs.some(([c]) => c === 'es') && hrefs.some(([c]) => c === I.c));
    }
  }
  return total;
}

async function navegador(browser, { mal }) {
  const e = (c, ok) => { if (!ok) mal(`i18n (navegador): ${c}`); };
  const servidor = http.createServer((req, res) => {
    let f = path.join(publico, decodeURIComponent(req.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
    fs.readFile(f, (err, d) => { if (err) { res.statusCode = 404; return res.end(); } res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' }[path.extname(f)] || 'application/octet-stream'); res.end(d); });
  });
  await new Promise((ok) => servidor.listen(0, ok)); const base = `http://localhost:${servidor.address().port}`;
  try {
    for (const I of Idiomas.IDIOMAS.filter((x) => x.c !== 'es')) {
      for (const h of I18n.paginasTraducidas(I.c)) {
        const n = `${I.c}/${h.asignatura}/${h.clave}`, ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: I.c });
        const p = await ctx.newPage(), errores = [];
        await ctx.route(/googlesyndication|googletagmanager|google-analytics|workers\.dev/, (r) => r.abort());
        p.on('pageerror', (er) => errores.push(er.message)); p.on('response', (r) => { if (r.status() >= 400) errores.push(`${r.status()} ${r.url()}`); });
        await p.goto(`${base}/${I.c}/${h.asignatura}/${h.clave}/`); await p.waitForTimeout(600);
        const espanol = async (donde) => { const t = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((x) => !x.closest('.lg-pop, script, style, template, [hidden]') && x.offsetParent !== null).flatMap((x) => [...x.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim())).filter(Boolean)); const mal2 = t.filter((l) => ESPANOL.test(l)); e(`${n}: español visible ${donde}: ${mal2.slice(0, 3).join(' | ').slice(0, 160)}`, mal2.length === 0); };
        await espanol('al abrir');
        // la barra Mis ejercicios: pestaña Ejemplos y menú ⋮
        await p.evaluate(() => document.querySelector('.bib-btn')?.click()); await p.waitForTimeout(300);
        await p.evaluate(() => document.querySelector('[data-acc="pestana-ejemplos"]')?.click()); await p.waitForTimeout(200); await espanol('en la pestaña Ejemplos');
        await p.evaluate(() => document.querySelector('.bib-dots[data-acc="menu-general"]')?.click()); await p.waitForTimeout(250); await espanol('en el menú ⋮ de Mis ejercicios');
        await p.keyboard.press('Escape');
        // modo práctica
        await p.evaluate(() => document.querySelector('.prac-btn')?.click()); await p.waitForTimeout(400); await espanol('en el modo práctica');
        // números: un ejemplo con decimales sale con el punto de este idioma
        if (h.clave === 'choques') {
          await p.evaluate(() => { const s = document.querySelector('#ejemplos'); s.value = s.options[3].value; s.dispatchEvent(new Event('change', { bubbles: true })); });
          await p.waitForTimeout(400);
          const campo = await p.inputValue('#f-e').catch(() => '');
          e(`${n}: el ejemplo con e = 0.5 escribe el decimal con punto en el campo (sale «${campo}»)`, I.num.dec === '.' ? campo.includes('.') || campo === '0.5' : campo.includes(','));
        }
        e(`${n}: errores en la consola o recursos que faltan: ${errores.join(' | ').slice(0, 200)}`, errores.length === 0);
        await ctx.close();
      }
    }
  } finally { servidor.close(); }
}

module.exports = async (browser, ctx) => { nodo(ctx.mal); if (browser) await navegador(browser, ctx); };
if (require.main === module) (async () => {
  let fallos = 0; const mal = (m) => { fallos++; console.error('  ✗ ' + m); };
  const { chromium } = require('playwright'); const b = await chromium.launch();
  await module.exports(b, { mal }); await b.close();
  console.log(fallos ? `${fallos} fallos` : '  ✓ Traducciones: sin textos sin traducir ni caducados, expresiones y etiquetas intactas, lo generado compila y sus enlaces existen, sin español visible');
  process.exit(fallos ? 1 : 0);
})();
