#!/usr/bin/env node
/* Prueba común de «Usar en…» (TRV.U1): recorre todos los enlaces entre herramientas de la web.
   Un enlace «Usar en…» es cualquier elemento con data-usar="<clave>" (o "<asignatura>/<clave>" si va
   a otra asignatura): los de Calculadora (opción usarEn), los que cada app pinta con
   Herramienta.enlaceA y los botones «Abrir en…» de Electromagnetismo. En cada herramienta:
   1. se buscan los enlaces a la vista con los datos de partida y, si no sale ninguno, con cada
      ejemplo de la página (muchos solo salen con cierto tipo de problema);
   2. se pulsa cada uno, se espera a la otra herramienta y se exige: que sea la página que dice
      data-usar, sin errores de consola, con los datos llevados (cada dato de la dirección #d=… está
      en el estado de la otra, con el mismo valor y con un nombre que la otra conoce) y con un
      resultado (sin mensaje de error a la vista);
   3. sin navegador: toda herramienta cuyo código enlaza (usarEn, enlaceA o data-usar) tiene que
      haber enseñado al menos un enlace; si no, hay que añadir aquí un caso en CASOS.
   También escribe la tabla de enlaces (TRV.U2) con --tabla: interno/enlaces-herramientas.md.
   Usa publico/ (antes hay que compilar) servido por un servidor local, porque los enlaces acaban en
   «/» como en la web y con file:// eso abre la carpeta.
   Uso: node pruebas/usar-en.js [--solo CARPETA] [--tabla]   (comprobar.js la llama con su navegador) */
const fs = require('fs'), path = require('path'), http = require('http');
const raiz = path.join(__dirname, '..'), publico = path.join(raiz, 'publico'), fuente = path.join(raiz, 'fuente');
const Catalogo = require('../fuente/catalogo.js');

// estados con los que sale un enlace que no aparece ni con los datos de partida ni con los ejemplos:
// { '<carpeta>': [estado, …] } (el estado entero de la app, como en localStorage)
const CASOS = {};

// herramientas disponibles: { asignatura, clave, carpeta, guarda, nombre }
function herramientas() {
  return Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => {
    const archivo = path.join(publico, a.clave, h.clave, 'index.html');
    const [, carpeta = h.clave, guarda] = (fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : '').match(/Biblioteca\.monta\('([^']+)', (?:'([^']+)'|null)\)/) || [];
    return { asignatura: a.clave, clave: h.clave, nombre: h.nombre, carpeta, guarda, archivo };
  }));
}
// carpetas cuyo código enlaza con otra herramienta
function conEnlace(hs) {
  return hs.filter((h) => {
    const dir = path.join(fuente, h.carpeta); if (!fs.existsSync(dir)) return false;
    return fs.readdirSync(dir).filter((f) => /\.(js|html)$/.test(f)).some((f) => /usarEn\s*[:(]|enlaceA\(|data-usar=/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  });
}
// publico/ en http://127.0.0.1:<puerto>/, como lo sirven Vercel y Cloudflare
const TIPOS = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', webp: 'image/webp', webmanifest: 'application/manifest+json' };
const servidor = () => new Promise((ok) => {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(publico, p);
    if (!f.startsWith(publico) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no existe'); }
    res.writeHead(200, { 'Content-Type': TIPOS[f.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(fs.readFileSync(f));
  }).listen(0, '127.0.0.1', () => ok(s));
});
const descifra = (href) => { const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(href || ''); if (!m) return null; try { return JSON.parse(Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); } catch (e) { return undefined; } };
const igual = (a, b) => (a !== null && typeof a === 'object' ? JSON.stringify(a) === JSON.stringify(b) : String(a) === String(b));

async function usarEn(browser, { mal, solo, filtro } = {}) {
  mal = mal || ((m) => { console.log('  ✗ ' + m); process.exitCode = 1; });
  const hs = herramientas(), porRuta = new Map(hs.map((h) => [`${h.asignatura}/${h.clave}`, h]));
  const enlaces = [], vistos = new Set();
  const srv = await servidor(), base = `http://127.0.0.1:${srv.address().port}`;
  for (const h of hs) {
    if (solo && solo !== h.carpeta && solo !== h.clave) continue;
    if (filtro && !filtro(h.carpeta)) continue;
    if (!conEnlace([h]).length) continue;
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' });
    const consola = [], page = await ctx.newPage();
    page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/Service Worker registration blocked/.test(m.text())) consola.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    const abre = async (estado) => {
      await page.goto(`${base}/${h.asignatura}/${h.clave}/`); await page.waitForLoadState('load');
      if (estado !== undefined && h.guarda) { await page.evaluate(([k, v]) => localStorage.setItem(k, v), [h.guarda, JSON.stringify(estado)]); await page.reload(); await page.waitForLoadState('load'); }
    };
    // los enlaces a la vista ahora: [{ i, destino, texto, href }]
    const aLaVista = () => page.evaluate(() => [...document.querySelectorAll('[data-usar]')].map((e, i) => ({ i, destino: e.dataset.usar, texto: e.textContent.trim(), href: e.getAttribute('href'), ve: !!(e.offsetWidth || e.offsetHeight) && !e.closest('[hidden]') })).filter((e) => e.ve));
    // situaciones que se prueban: los datos de partida, cada ejemplo y los casos de CASOS; de cada destino basta la primera en que salga
    await abre();
    const ejemplos = await page.evaluate(() => [...document.querySelectorAll('select[id^="ejemplo"] option')].map((o) => o.value).filter(Boolean));
    const situaciones = [{ tipo: 'partida' }, ...ejemplos.map((v) => ({ tipo: 'ejemplo', v })), ...(CASOS[h.carpeta] || []).map((estado) => ({ tipo: 'caso', estado }))];
    const prepara = async (s) => {
      await page.evaluate(() => { try { sessionStorage.clear(); } catch (e) { /* sin almacenamiento */ } });
      if (s.tipo === 'caso') return abre(s.estado);
      if (h.guarda) await page.evaluate((k) => localStorage.removeItem(k), h.guarda);
      await abre();
      if (s.tipo === 'ejemplo') await page.evaluate((v) => { const app = Object.keys(window).filter((k) => /App$/.test(k) && window[k] && typeof window[k].abrirEjemplo === 'function').map((k) => window[k])[0]; if (app) app.abrirEjemplo(v); else { const sel = document.querySelector('select[id^="ejemplo"]'); sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); } }, s.v);
      await page.waitForTimeout(30);
    };
    const hechos = new Set();
    for (const s of situaciones) {
      if (s.tipo !== 'partida') await prepara(s);
      const pendientes = (await aLaVista()).filter((e) => !hechos.has(e.destino + '|' + e.texto));
      for (const e of pendientes) {
        hechos.add(e.destino + '|' + e.texto); vistos.add(h.carpeta);
        const origen = `${h.asignatura}/${h.clave}`, ruta = e.destino.includes('/') ? e.destino : `${h.asignatura}/${e.destino}`, d = porRuta.get(ruta), que = `«${e.texto}» de ${origen}`;
        const lleva = descifra(e.href);
        enlaces.push({ origen, nombre: h.nombre, destino: ruta, nombreDestino: d ? d.nombre : '?', texto: e.texto, lleva: lleva ? Object.keys(lleva) : null, situacion: s.tipo === 'ejemplo' ? `ejemplo «${s.v}»` : s.tipo === 'caso' ? 'un caso de la prueba' : 'los datos de partida' });
        if (!d) { mal(`Usar en: ${que} apunta a «${ruta}», que no es una herramienta disponible`); continue; }
        if (lleva === undefined) { mal(`Usar en: ${que} lleva unos datos que no se pueden leer`); continue; }
        // el estado que tenía la otra antes, para saber qué nombres de dato conoce
        consola.length = 0;
        if (d.guarda) await page.evaluate((k) => localStorage.removeItem(k), d.guarda);
        // se vuelve a buscar el elemento (la página puede haberse repintado) y se pulsa
        const antes = page.url();
        await page.evaluate(([dest, txt]) => { const el = [...document.querySelectorAll('[data-usar]')].find((x) => x.dataset.usar === dest && x.textContent.trim() === txt); if (el) el.click(); }, [e.destino, e.texto]);
        try { await page.waitForURL((u) => u.toString().split('#')[0] !== antes.split('#')[0], { timeout: 5000 }); } catch (err) { mal(`Usar en: ${que} no abre nada al pulsarlo`); await prepara(s); continue; }
        await page.waitForLoadState('load'); await page.waitForTimeout(60);
        const llega = decodeURIComponent(page.url().split('#')[0]);
        if (llega !== `${base}/${ruta}/`) mal(`Usar en: ${que} dice ir a ${ruta} y abre ${llega.slice(base.length)}`);
        const alli = await page.evaluate((k) => {
          const app = Object.keys(window).filter((n) => /App$/.test(n) && window[n] && typeof window[n].estado === 'function').map((n) => window[n])[0];
          let guardado = null; try { guardado = k ? JSON.parse(localStorage.getItem(k)) : null; } catch (err) { /* roto */ }
          let estado = null, resultado; try { estado = app ? app.estado() : null; resultado = app && app.resultado ? app.resultado() : undefined; } catch (err) { resultado = null; }
          const error = [...document.querySelectorAll('#error, .error, [role="alert"]')].filter((x) => (x.offsetWidth || x.offsetHeight) && !x.closest('.bib, .prac') && x.textContent.trim()).map((x) => x.textContent.trim())[0] || '';
          const texto = [...document.querySelectorAll('#resumen, #res, #resultados, #pasos, .res, .resultados')].map((x) => x.textContent.trim()).join('');
          return { estado: estado || guardado, hayResultado: resultado === undefined ? texto.length > 0 : !!resultado, error, texto: texto.slice(0, 2000) };
        }, d.guarda);
        if (alli.error) mal(`Usar en: ${que} abre ${ruta} con un error: «${alli.error.slice(0, 160)}»`);
        else if (!alli.hayResultado) mal(`Usar en: ${que} abre ${ruta} sin ningún resultado`);
        if (/\b(NaN|undefined|Infinity)\b|\[object/.test(alli.texto)) mal(`Usar en: ${que} abre ${ruta} con «NaN», «undefined» u «object» en los resultados`);
        if (lleva) {
          if (!alli.estado) mal(`Usar en: ${que}: no se puede leer el estado de ${ruta} para ver si llegaron los datos`);
          else for (const [k, v] of Object.entries(lleva)) {
            if (!(k in alli.estado)) mal(`Usar en: ${que} lleva el dato «${k}», que ${ruta} no conoce`);
            else if (!igual(v, alli.estado[k])) mal(`Usar en: ${que} lleva ${k} = ${JSON.stringify(v)} y ${ruta} se queda con ${JSON.stringify(alli.estado[k])}`);
          }
        }
        if (consola.length) mal(`Usar en: ${que}: consola del navegador en ${ruta}:\n      ` + consola.join('\n      '));
        consola.length = 0;
        await prepara(s);
      }
    }
    if (consola.length) mal(`Usar en: ${h.asignatura}/${h.clave}: consola del navegador:\n      ` + consola.join('\n      '));
    await ctx.close();
  }
  srv.close();
  // toda herramienta que enlaza ha tenido que enseñar algún enlace
  for (const h of conEnlace(hs)) {
    if (solo && solo !== h.carpeta && solo !== h.clave) continue;
    if (filtro && !filtro(h.carpeta)) continue;
    if (!vistos.has(h.carpeta)) mal(`Usar en: ${h.asignatura}/${h.clave} enlaza con otra herramienta, pero el enlace no sale ni con los datos de partida ni con sus ejemplos: añade un caso en CASOS (pruebas/usar-en.js)`);
  }
  return { enlaces, origenes: vistos.size };
}

// TRV.U2: la tabla de enlaces entre herramientas, sacada de lo que la prueba ha pulsado
function tabla(enlaces, hs) {
  const porAsig = new Map();
  for (const e of enlaces) { const a = e.origen.split('/')[0]; if (!porAsig.has(a)) porAsig.set(a, []); porAsig.get(a).push(e); }
  const nombreAsig = (c) => (Catalogo.asignaturas.find((a) => a.clave === c) || {}).nombre || c;
  let md = '# Enlaces «Usar en…» entre herramientas\n\n';
  md += 'Generado por `node pruebas/usar-en.js --tabla` pulsando cada enlace de la web compilada: **no editar a mano**. Cada fila es un enlace que la prueba común abre y comprueba (destino correcto, datos llevados y resultado).\n\n';
  md += `Hay ${enlaces.length} enlaces que salen de ${new Set(enlaces.map((e) => e.origen)).size} herramientas y llegan a ${new Set(enlaces.map((e) => e.destino)).size}.\n`;
  for (const a of Catalogo.asignaturas) {
    const es = porAsig.get(a.clave); if (!es) continue;
    md += `\n## ${a.nombre}\n\n| Origen | Destino | Botón | Qué lleva | Sale con |\n| --- | --- | --- | --- | --- |\n`;
    for (const e of es) md += `| ${e.nombre} | ${e.destino.split('/')[0] === a.clave ? '' : nombreAsig(e.destino.split('/')[0]) + ' · '}${e.nombreDestino} | ${e.texto.replace(/\|/g, '/')} | ${e.lleva ? e.lleva.map((k) => '`' + k + '`').join(', ') : 'el estado, por almacenamiento'} | ${e.situacion} |\n`;
  }
  const con = new Set(enlaces.flatMap((e) => [e.origen, e.destino]));
  md += '\n## Herramientas sin ningún enlace (ni salen ni llegan)\n';
  for (const a of Catalogo.asignaturas) {
    const sin = hs.filter((h) => h.asignatura === a.clave && !con.has(`${h.asignatura}/${h.clave}`));
    if (sin.length) md += `\n- **${a.nombre}:** ${sin.map((h) => h.nombre).join(', ')}.`;
  }
  return md + '\n';
}

module.exports = usarEn;
module.exports.tabla = tabla;
module.exports.herramientas = herramientas;

if (require.main === module) {
  const args = process.argv.slice(2), i = args.indexOf('--solo'), solo = i >= 0 ? args[i + 1] : null;
  (async () => {
    const { chromium } = require('playwright');
    const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
    const browser = require('./sin-anuncios.js')(await chromium.launch(exe ? { executablePath: exe } : {}));
    const r = await usarEn(browser, { solo });
    await browser.close();
    if (args.includes('--tabla') && !solo) { const f = path.join(raiz, 'interno', 'enlaces-herramientas.md'); fs.writeFileSync(f, tabla(r.enlaces, herramientas())); console.log('  Tabla escrita en interno/enlaces-herramientas.md'); }
    console.log(`${process.exitCode ? '✗' : '✓'} Usar en: ${r.enlaces.length} enlaces de ${r.origenes} herramientas abren su destino con los datos llevados y un resultado`);
  })().catch((e) => { console.error(e); process.exit(1); });
}
