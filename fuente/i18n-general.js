/* =====================================================================
   Traducción de las PÁGINAS GENERALES (portada, asignaturas, novedades, foro, índice de fenómenos, páginas legales y
   página sin conexión) y de los archivos comunes del portal (buscador.js, llama.js, pwa.js, manifest). Lo usa i18n.js
   (generar). Diccionarios en fuente/i18n/<idioma>/ con el prefijo _g-:
     _g-portada, _g-asignaturas (las 7 asignaturas), _g-novedades, _g-foro, _g-fenomenos, _g-legal, _g-offline,
     _g-buscador, _g-llama, _g-pwa (pwa.js y manifest).
   Todas las generales miran además _comun.json y _catalogo.json (nombres, descripciones y palabras de búsqueda de las
   herramientas, que salen en muchas páginas).
   Reglas de los enlaces: lo que existe en el idioma (página o archivo común traducido) se enlaza con la misma ruta
   relativa que en español (el idioma cuelga de /<idioma>/ con la misma estructura); lo demás vuelve al original.
   ===================================================================== */
const crypto = require('crypto');

module.exports = (I) => {
  const { fs, path, publico, Idiomas, Catalogo, traduceJS, traduceHTML, numeros, leeDic, dicComun, candidatosHTML, candidatosJS } = I;

  // archivos comunes del portal que se traducen: nombre en publico/, diccionario y retoques tras traducir
  const RECURSOS = [
    { archivo: 'buscador.js', dic: '_g-buscador' },
    { archivo: 'llama.js', dic: '_g-llama' },
    { archivo: 'pwa.js', dic: '_g-pwa' },
    { archivo: 'manifest.webmanifest', dic: '_g-pwa' }
  ];
  const existeRecurso = (idioma, r) => fs.existsSync(path.join(I.DIR, idioma, r.dic + '.json'));
  const recursosDe = (idioma) => RECURSOS.filter((r) => existeRecurso(idioma, r));
  const generalesDe = (idioma) => Idiomas.generales().filter((g) => fs.existsSync(path.join(I.DIR, idioma, g.dic + '.json')));

  const rel = (desde, hasta) => { const r = path.posix.relative('/' + desde.replace(/\/$/, ''), '/' + hasta.replace(/\/$/, '')); return (r || '.') + (hasta.endsWith('/') || hasta === '' ? '/' : ''); };

  // rutas (desde la raíz) que existen en el idioma: páginas generales, archivos comunes y offline
  function rutasGenerales(idioma) { return [...generalesDe(idioma).map((g) => g.ruta), ...recursosDe(idioma).map((r) => r.archivo)]; }

  function enlaces(html, dirEs, idioma, existentes) {
    return html.replace(/\b(href|src|action)="([^"#?]*)([?#][^"]*)?"/g, (m, a, u, resto = '') => {
      if (!u || /^([a-z][a-z0-9+.-]*:|\/)/i.test(u)) return m;
      let abs = path.posix.normalize(path.posix.join(dirEs, u)); if (abs === '.' || abs === './') abs = '';
      if (existentes.has(abs)) return m; // misma estructura dentro del idioma
      return `${a}="${rel(`${idioma}/${dirEs}`, abs)}${resto}"`;
    });
  }

  function generarGeneral(g, idioma, existentes, faltan, usadas) {
    const L = Idiomas.IDIOMAS.find((i) => i.c === idioma);
    let html = fs.readFileSync(path.join(publico, g.archivo), 'utf8');
    const dics = [leeDic(idioma, g.dic), dicComun(idioma)];
    const dirEs = path.posix.dirname(g.archivo) === '.' ? '' : path.posix.dirname(g.archivo) + '/';
    html = html.replace(/<style>[^<]*<\/style><div class="lg">[\s\S]*?<\/script>/, '<!--LG-->');
    html = html.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g, (m, attrs = '', cuerpo) => {
      if (/\ssrc=/.test(attrs) || /ld\+json/.test(attrs) || /pagead|adsbygoogle|googlefc/.test(attrs + cuerpo)) return m;
      let c = traduceJS(cuerpo, dics, faltan, usadas);
      // «Tu espacio» (portada): las fichas enlazan con la versión en el idioma solo si existe; si no, con la original
      c = c.replace(`'<a href="' + r + '/"`, `'<a href="' + (window.__TRAD.has(r) ? '' : '../') + r + '/"`);
      c = c.replace("Math.round(m / 60) + ' h'", "Math.round(m / 60) + ' h ago'"); // «hace 3 h»: el literal ' h' no es texto para el extractor
      return `<script${attrs}>${numeros(c, idioma)}</script>`;
    });
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, (st) => st.replace(/content:\s*(['"])([^'"\n]*[A-Za-zÁÉÍÓÚáéíóúñ]{3}[^'"\n]*)\1/g, (m, q, t) => { const v = dics.map((d) => d[t]).find((x) => x !== undefined); usadas.add(t); if (v === undefined || v === '') { faltan.add(t); return m; } return v ? `content:${q}${v}${q}` : m; }));
    html = traduceHTML(html, dics, faltan, usadas, true);
    html = html.replace('<html lang="es">', `<html lang="${L.html}">`);
    html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${Catalogo.web}/${idioma}/${g.ruta}">` + (L.indexar ? '' : '\n' + Idiomas.ROBOTS(idioma)));
    html = html.replace(/<meta property="og:image"/, `<meta property="og:locale" content="${L.html.replace('-', '_')}">\n<meta property="og:image"`);
    html = html.replace(/([?&]hl=)es\b/g, `$1${idioma === 'zh' ? 'zh-CN' : idioma}`); // enlaces a políticas de Google en el idioma de la página
    html = enlaces(html, dirEs, idioma, existentes);
    const prof = `${idioma}/${dirEs}`.split('/').filter(Boolean).length;
    html = html.replace('<!--LG-->', Idiomas.BOTON({ idioma, raiz: '../'.repeat(prof), ruta: g.ruta }));
    // lista de rutas traducidas para las fichas de «Tu espacio»
    if (html.includes('window.__TRAD')) html = html.replace('<script>', `<script>window.__TRAD = new Set(${JSON.stringify(todasLasRutas(idioma))});</script>\n<script>`);
    const out = path.join(publico, idioma, g.archivo);
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
  }

  // todas las rutas de herramientas/fenómenos que existen en el idioma, sin barra final ('fisica/choques')
  const todasLasRutas = (idioma) => [...Idiomas.paginas(idioma)].filter((r) => /^[^/]+\/[^/]+\/$/.test(r)).map((r) => r.slice(0, -1));

  function generarRecurso(r, idioma, faltan, usadas) {
    const dics = [leeDic(idioma, r.dic), dicComun(idioma)];
    let src = fs.readFileSync(path.join(publico, r.archivo), 'utf8');
    src = traduceJS(src, dics, faltan, usadas);
    const L = Idiomas.IDIOMAS.find((i) => i.c === idioma), pre = `/^\\/${idioma}(?=\\/)/`;
    if (r.archivo === 'pwa.js') src = src.replace("new URL('sw.js'", "new URL('../sw.js'"); // un solo service worker, el de la raíz
    if (r.archivo === 'llama.js') src = src.replace(/\.pathname\.split\('\/'\)/g, `.pathname.replace(${pre}, '').split('/')`);
    if (r.archivo === 'buscador.js') {
      const rutas = [...Idiomas.paginas(idioma)].filter((x) => x !== 'offline.html'), TR = JSON.stringify(rutas);
      src = src.replace("base = new URL('./', document.currentScript.src).href", `base = new URL('./', document.currentScript.src).href, base0 = new URL('../', base).href, TR = new Set(${TR}), dir = (u) => (TR.has(u) ? base : base0) + u`);
      src = src.replace(/base \+ d\.url/g, 'dir(d.url)');
    }
    if (r.archivo === 'manifest.webmanifest') {
      src = src.replace(/"lang": "es"/, `"lang": "${L.html}"`).replace(/"src": "(icono-[^"]+)"/g, '"src": "../$1"');
      src = JSON.stringify(JSON.parse(src), null, 2) + '\n';
    }
    src = numeros(src, idioma);
    fs.mkdirSync(path.join(publico, idioma), { recursive: true });
    fs.writeFileSync(path.join(publico, idioma, r.archivo), src);
  }

  // textos por traducir de un diccionario general (_g-…): HTML, scripts en línea, textos de hojas de estilo y archivos comunes
  function candidatos(dic) {
    const t = [];
    for (const g of Idiomas.generales().filter((x) => x.dic === dic)) {
      const html = fs.readFileSync(path.join(publico, g.archivo), 'utf8').replace(/<style>[^<]*<\/style><div class="lg">[\s\S]*?<\/script>/, '');
      t.push(...candidatosHTML(html, true));
      for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) if (!/\ssrc=|ld\+json|pagead|adsbygoogle|googlefc/.test((m[1] || '') + m[2])) t.push(...candidatosJS(m[2]));
      for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) for (const q of m[1].matchAll(/content:\s*(['"])([^'"\n]*[A-Za-zÁÉÍÓÚáéíóúñ]{3}[^'"\n]*)\1/g)) t.push(q[2]);
    }
    for (const r of RECURSOS.filter((x) => x.dic === dic)) { const src = fs.readFileSync(path.join(publico, r.archivo), 'utf8'); t.push(...candidatosJS(src)); }
    return t;
  }

  return { candidatos, generalesDe, recursosDe, rutasGenerales, generarGeneral, generarRecurso, RECURSOS, enlaces, rel };
};
