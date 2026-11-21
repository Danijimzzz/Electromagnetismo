#!/usr/bin/env node
/* Prueba del sitemap.xml generado (necesita publico/ compilado; sin navegador). Lo corre comprobar.js (trozo 1).
   - Límites del estándar: ≤ 50.000 URLs y ≤ 50 MB; sin URLs repetidas; solo https de la dirección principal.
   - Cada URL existe en publico/, su canonical es ella misma y no lleva noindex.
   - hreflang: cada URL se lista a sí misma y a sus alternativas con x-default; recíproco (si A apunta a B, B apunta a A);
     toda alternativa está en el sitemap; coincide con los <link rel="alternate"> de la propia página.
   - lastmod: AAAA-MM-DD válida, no futura; sin changefreq ni priority (Google los ignora); las páginas sin fecha solo avisan
     (fichero sin commit: `node fuente/lastmod.js` tras commitear); lastmod.json sin claves que ya no estén en el sitemap.
   Uso: node pruebas/sitemap.js */
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), pub = path.join(raiz, 'publico'), Catalogo = require('../fuente/catalogo.js');
let fallos = 0; const mal = (m) => { fallos++; console.error('  ✗ sitemap: ' + m); };
const xml = fs.readFileSync(path.join(pub, 'sitemap.xml'), 'utf8'), base = Catalogo.web + '/';
if (Buffer.byteLength(xml) > 50 * 1024 * 1024 - 1) mal('pasa de 50 MB');
if (!/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9" xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml">/.test(xml)) mal('cabecera o espacios de nombres incorrectos');
if (/<changefreq|<priority/.test(xml)) mal('lleva changefreq o priority (Google los ignora)');
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
  loc: (m[1].match(/<loc>([^<]*)<\/loc>/) || [])[1], lastmod: (m[1].match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1],
  alts: [...m[1].matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map((a) => [a[1], a[2]])
}));
if (urls.length !== (xml.match(/<url>/g) || []).length) mal('algún <url> mal formado');
if (urls.length > 50000) mal(`${urls.length} URLs (máximo 50.000)`);
const mapa = new Map(urls.map((u) => [u.loc, u]));
if (mapa.size !== urls.length) mal('URLs repetidas');
const hoy = new Date().toISOString().slice(0, 10); let sinFecha = 0;
for (const u of urls) {
  if (!u.loc || !u.loc.startsWith(base) || /[?#\s]/.test(u.loc)) { mal(`URL no válida: ${u.loc}`); continue; }
  const ruta = u.loc.slice(base.length), f = path.join(pub, ruta === '' || ruta.endsWith('/') ? ruta + 'index.html' : ruta);
  if (!fs.existsSync(f)) { mal(`${u.loc} no existe en publico/`); continue; }
  const h = fs.readFileSync(f, 'utf8');
  if ((h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] !== u.loc) mal(`${u.loc}: su canonical no es ella misma`);
  if (/<meta name="robots"[^>]*noindex/.test(h)) mal(`${u.loc}: lleva noindex`);
  if (u.lastmod) { if (!/^\d{4}-\d{2}-\d{2}$/.test(u.lastmod) || isNaN(Date.parse(u.lastmod))) mal(`${u.loc}: lastmod no válido (${u.lastmod})`); else if (u.lastmod > hoy) mal(`${u.loc}: lastmod en el futuro (${u.lastmod})`); } else sinFecha++;
  const enPagina = [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((a) => a[1] + ' ' + a[2]).sort().join('\n');
  const enSitemap = u.alts.map((a) => a.join(' ')).sort().join('\n');
  if (enPagina !== enSitemap) mal(`${u.loc}: sus hreflang no coinciden con los del <head> de la página`);
  if (u.alts.length) {
    if (!u.alts.some((a) => a[1] === u.loc)) mal(`${u.loc}: no se lista a sí misma en hreflang`);
    if (!u.alts.some((a) => a[0] === 'x-default')) mal(`${u.loc}: sin x-default`);
    if (new Set(u.alts.map((a) => a[0])).size !== u.alts.length) mal(`${u.loc}: idioma repetido en hreflang`);
    for (const [, dest] of u.alts) {
      const o = mapa.get(dest);
      if (!o) mal(`${u.loc}: alternativa ${dest} no está en el sitemap`);
      else if (JSON.stringify(o.alts) !== JSON.stringify(u.alts)) mal(`${u.loc}: ${dest} no tiene las mismas alternativas (no recíproco)`);
    }
  }
}
const guardado = require('../fuente/lastmod.js').guardado(), claves = new Set(urls.map((u) => u.loc.slice(base.length)));
for (const k of Object.keys(guardado)) if (!claves.has(k)) mal(`fuente/lastmod.json trae ${k}, que ya no está en el sitemap (rehacer con node fuente/lastmod.js)`);
if (sinFecha) console.log(`  · sitemap: ${sinFecha} páginas sin lastmod (aún sin commit: node fuente/lastmod.js después de commitear)`);
if (!fallos) console.log(`  ✓ Sitemap: ${urls.length} URLs, hreflang completo y recíproco, lastmod válido`);
process.exit(fallos ? 1 : 0);
