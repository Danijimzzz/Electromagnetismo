/* =====================================================================
   Traducción de la web por sustitución de textos en la compilación (sin tocar las fuentes en español).
   El español sigue siendo la fuente. Para cada idioma publicable hay diccionarios en fuente/i18n/<idioma>/:
     _comun.json     cabecera, pie, miga, botones y los scripts comunes (biblioteca, práctica, enunciado…)
     <carpeta>.json  lo propio de cada herramienta (página, app.js y calculo.js)
   Cada diccionario es { "texto en español": "traducción" }. Un valor null significa «no se traduce» (es código,
   un nombre propio o un símbolo). Hay dos clases de texto:
     - HTML: el contenido de cada bloque (p, li, h2, td, label, button…) con sus etiquetas internas (b, sup, math…) y
       los atributos title, aria-label, placeholder, alt y content de meta/og. La traducción conserva las etiquetas.
     - JavaScript: cada literal de texto ('…', "…" o `…`). En las plantillas se conservan las expresiones ${…}
       (se pueden recolocar, pero tienen que estar todas).
   `node fuente/i18n.js candidatos <idioma> <carpeta>` lista lo que falta por traducir de una herramienta y
   `node fuente/i18n.js rellenar <idioma> <carpeta>` añade al diccionario las claves que faltan (valor "").
   La compilación (generar) escribe publico/<idioma>/… con las rutas, lang, canonical, hreflang y números del idioma.
   pruebas/i18n.js comprueba que no quedan claves sin traducir, que las traducciones conservan etiquetas y ${…}, y que
   no queda español visible en lo generado.
   ===================================================================== */
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, 'i18n');

/* ---------- Léxico de JavaScript: literales de texto con su posición ---------- */
// Devuelve [{ ini, fin, tipo, texto }]: texto = contenido tal cual (con \ sin interpretar), ini/fin = posiciones del
// contenido (sin las comillas). En las plantillas el texto incluye las expresiones ${…} (con sus llaves).
function literales(src) {
  const out = [], n = src.length; let i = 0, ult = '', nivel = 0;
  const antesDeRegex = () => ult === '' || /[(,=:[!&|?{};+\-*%<>~^]/.test(ult) || /^(?:return|typeof|case|in|of|delete|void|throw|new|else|do)$/.test(ult);
  const cadena = (c) => { const ini = ++i; while (i < n && src[i] !== c) { if (src[i] === '\\') i++; i++; } out.push({ ini, fin: i, tipo: c, texto: src.slice(ini, i), nivel }); i++; ult = 'x'; };
  const plantilla = () => {
    const ini = ++i;
    while (i < n && src[i] !== '`') {
      if (src[i] === '\\') { i += 2; continue; }
      if (src[i] === '$' && src[i + 1] === '{') { i += 2; nivel++; codigo(true); nivel--; continue; }
      i++;
    }
    out.push({ ini, fin: i, tipo: '`', texto: src.slice(ini, i), nivel }); i++; ult = 'x';
  };
  // recorre código; con enLlave termina en la } que cierra la expresión ${…}
  function codigo(enLlave) {
    let prof = 0; if (enLlave) ult = '{'; // tras ${ puede venir una expresión regular
    while (i < n) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2); i = i < 0 ? n : i + 2; continue; }
      if (c === '\'' || c === '"') { cadena(c); continue; }
      if (c === '`') { plantilla(); continue; }
      if (c === '{') { prof++; ult = '{'; i++; continue; }
      if (c === '}') { if (enLlave && prof === 0) { i++; ult = 'x'; return; } prof--; ult = '}'; i++; continue; }
      if (c === '/' && antesDeRegex()) {
        i++; let clase = false; while (i < n && (clase || src[i] !== '/')) { if (src[i] === '\\') i++; else if (src[i] === '[') clase = true; else if (src[i] === ']') clase = false; i++; }
        i++; while (/[a-z]/.test(src[i] || '')) i++; ult = 'x'; continue;
      }
      if (/\s/.test(c)) { i++; continue; }
      if (/[A-Za-z_$]/.test(c)) { let j = i; while (/[\w$]/.test(src[j] || '')) j++; ult = src.slice(i, j); i = j; continue; }
      if (/[0-9]/.test(c)) { while (/[\w.]/.test(src[i] || '')) i++; ult = '0'; continue; }
      ult = c; i++;
    }
  }
  codigo(false);
  return out.sort((a, b) => a.ini - b.ini);
}

// ¿Es un texto para personas? (no un selector, una clave, una ruta, un color ni código)
function esTexto(t) {
  const s = t.replace(/\$\{[^}]*\}/g, '').replace(/\\./g, ' ');
  if (!/[A-Za-zÁÉÍÓÚáéíóúñÑüÜ]{2}/.test(s)) return false;
  if (/^[#.[]/.test(s.trim()) || /^(https?:|\/|\.\/|\.\.\/|data:|#)/.test(s.trim())) return false;
  if (/^[\w.:#>~*+,=\[\]"'()$ -]+$/.test(s) && !/[A-Z][a-z]{2}|\s[a-z]{3,}\s[a-z]{2,}/.test(s) && !/[áéíóúñ]/i.test(s)) return false; // selectores y claves en minúsculas
  if (/^[a-z]+(?:[A-Z][a-z]*)+$/.test(s.trim()) || /^[a-z]+(-[a-z0-9]+)+$/.test(s.trim()) || /^[A-Z_]+$/.test(s.trim())) return false;
  if (/^\s*(?:function|return|const|let|var)\b/.test(s)) return false;
  return /[áéíóúñÁÉÍÓÚÑ¿¡«»]/.test(s) || /(^|[\s>])[A-ZÁÉÍÓÚ][a-záéíóúñ]{2,}/.test(s) || /\s[a-z]{2,}\s/.test(s) || /[a-z]{4,}\s[a-z]{2,}/.test(s);
}

/* ---------- HTML: unidades de texto y atributos ---------- */
const BLOQUE = new Set('address article aside blockquote body button caption dd details dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr html label legend li main nav ol optgroup option p pre section select summary table tbody td tfoot th thead title tr ul textarea head meta link input img canvas svg br hr script style ins'.split(' '));
const ATRIBUTOS = ['title', 'aria-label', 'placeholder', 'alt', 'aria-description'];

// Recorre el HTML y devuelve las unidades [{ ini, fin, texto, clase }] (clase 'html' o 'attr'), sin entrar en <script> ni <style>.
function unidadesHTML(html) {
  const out = []; const re = /<!--[\s\S]*?-->|<![^>]*>|<(script|style)\b[\s\S]*?<\/\1>|<\/?([A-Za-z][\w:-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>|[^<]+|</g;
  let m, ini = -1, fin = -1;
  const cierra = () => { if (ini >= 0) { const t = html.slice(ini, fin); if (/[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}/.test(t.replace(/<[^>]*>/g, '').replace(/\$[^$]*\$/g, ''))) { const l = t.length - t.trimStart().length; out.push({ ini: ini + l, fin: ini + l + t.trim().length, texto: t.trim(), clase: 'html' }); } } ini = fin = -1; };
  let pre = 0, ctx = 0;
  while ((m = re.exec(html))) {
    const [t, scr, tag, attrs] = m;
    if (t.startsWith('<!')) continue;
    if (scr) {
      cierra();
      if (/^<script[^>]*application\/ld\+json/i.test(t)) { // datos estructurados: los textos de los valores
        const ini0 = m.index + t.indexOf('>') + 1, cuerpo = t.slice(t.indexOf('>') + 1, t.lastIndexOf('</'));
        const rs = /"((?:[^"\\]|\\.)*)"(\s*:)?/g; let q;
        while ((q = rs.exec(cuerpo))) if (!q[2] && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{3}/.test(q[1]) && !/^(https?:|@|\/)/.test(q[1]) && /\s|[áéíóúñ]/.test(q[1])) out.push({ ini: ini0 + q.index + 1, fin: ini0 + q.index + 1 + q[1].length, texto: q[1], clase: 'json' });
      }
      continue;
    }
    if (tag) {
      const nombre = tag.toLowerCase(), esCierre = t[1] === '/';
      if (/^(nav|header|footer)$/.test(nombre)) ctx += esCierre ? -1 : 1;
      if (ctx > 0 && /^(a|span|i|b|small)$/.test(nombre)) { cierra(); continue; }
      if (attrs && !esCierre) { // atributos con texto
        const ra = /([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g; let a; const base = m.index + t.indexOf(attrs);
        while ((a = ra.exec(attrs))) {
          const nom = a[1].toLowerCase(), val = a[3] ?? a[4] ?? '';
          const esMeta = nombre === 'meta' && nom === 'content' && /(?:name|property)\s*=\s*["'](?:description|og:title|og:description|twitter:title|twitter:description)["']/i.test(attrs);
          if ((ATRIBUTOS.includes(nom) || esMeta) && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}/.test(val)) out.push({ ini: base + a.index + a[0].indexOf(a[2]) + 1, fin: base + a.index + a[0].indexOf(a[2]) + 1 + val.length, texto: val, clase: 'attr' });
        }
      }
      if (BLOQUE.has(nombre)) { cierra(); if (nombre === 'pre') pre += esCierre ? -1 : 1; }
      else if (ini >= 0 || (!esCierre && !/^\/?(?:svg|path|g|circle|rect|line|polyline|polygon|defs)$/.test(nombre))) { if (ini < 0) ini = m.index; fin = m.index + t.length; }
      continue;
    }
    if (t === '<') continue;
    if (pre > 0) continue;
    if (ini < 0) ini = m.index; fin = m.index + t.length;
    // las etiquetas en línea quedan dentro: el trozo continúa; se amplía en el siguiente texto (ver abajo)
  }
  cierra();
  return out;
}

/* ---------- Ediciones de un script: qué trozos se traducen ---------- */
// Máscara con la misma longitud: las expresiones ${…} (balanceadas) se vuelven \u0001 para que no cuenten como texto ni como etiquetas.
function mascara(t) {
  let o = '', i = 0;
  while (i < t.length) {
    if (t[i] === '\\') { o += t.slice(i, i + 2); i += 2; continue; }
    if (t[i] === '$' && t[i + 1] === '{') { let prof = 1, j = i + 2; while (j < t.length && prof) { if (t[j] === '{') prof++; else if (t[j] === '}') prof--; j++; } o += '\u0001'.repeat(j - i); i = j; continue; }
    o += t[i++];
  }
  return o;
}
const conLetras = (m) => /[A-Za-zÁÉÍÓÚáéíóúñÑüÜ]{2}/.test(m.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/g, ''));
// [{ ini, fin, texto, tipo }] sobre el código: cada trozo de texto para personas con su posición absoluta.
function edicionesJS(src) {
  const ls = literales(src), eds = [];
  for (const l of ls.filter((x) => x.nivel === 0)) {
    const m = mascara(l.texto);
    if (m.includes('<') && /<\/?[a-zA-Z]/.test(m)) { for (const u of unidadesHTML(m)) eds.push({ ini: l.ini + u.ini, fin: l.ini + u.fin, texto: l.texto.slice(u.ini, u.fin), tipo: l.tipo, clase: u.clase }); }
    else if (conLetras(m) || /^-?\d+,\d+$/.test(m)) eds.push({ ini: l.ini, fin: l.fin, texto: l.texto, tipo: l.tipo, clase: 'js', opt: !esTexto(l.texto) });
  }
  const dentro = (e) => eds.some((x) => e.ini >= x.ini && e.fin <= x.fin);
  for (const l of ls.filter((x) => x.nivel > 0)) {
    const m = mascara(l.texto);
    const parte = (ini, fin, texto, clase) => { const e = { ini, fin, texto, tipo: l.tipo, clase }; if (!dentro(e)) eds.push(e); };
    if (/<\/?[a-zA-Z]/.test(m)) for (const u of unidadesHTML(m)) parte(l.ini + u.ini, l.ini + u.fin, l.texto.slice(u.ini, u.fin), u.clase);
    else if (conLetras(m)) { parte(l.ini, l.fin, l.texto, 'js'); if (!esTexto(l.texto) && eds.length) { const u = eds[eds.length - 1]; if (u.ini === l.ini && u.fin === l.fin) u.opt = true; } }
  }
  return eds.sort((a, b) => a.ini - b.ini);
}

/* ---------- Diccionarios ---------- */
const rutaDic = (idioma, nombre) => path.join(DIR, idioma, nombre + '.json');
const leeDic = (idioma, nombre) => { try { return JSON.parse(fs.readFileSync(rutaDic(idioma, nombre), 'utf8')); } catch (e) { return {}; } };
const guardaDic = (idioma, nombre, d) => { fs.mkdirSync(path.join(DIR, idioma), { recursive: true }); fs.writeFileSync(rutaDic(idioma, nombre), JSON.stringify(d, null, 1) + '\n'); };
const busca = (dics, k) => { for (const d of dics) if (Object.prototype.hasOwnProperty.call(d, k)) return d[k]; return undefined; };
// El valor del diccionario es texto natural: se escapa lo que el literal en que entra no admite.
const escapa = (t, tipo) => {
  if (tipo === 'json') return t.replace(/(?<!\\)"/g, '\\"');
  if (tipo === '`') { const m = mascara(t); let o = ''; for (let i = 0; i < t.length; i++) o += m[i] === '`' && t[i - 1] !== '\\' ? '\\`' : t[i]; return o; } // las expresiones ${…} no se tocan
  return tipo ? t.replace(new RegExp('(?<!\\\\)' + tipo, 'g'), '\\' + tipo) : t;
};

function aplica(src, eds, dics, faltan, usadas) {
  let out = '', pos = 0;
  for (const e of eds) {
    if (e.ini < pos) continue;
    if (!e.texto.trim()) continue;
    const t = busca(dics, e.texto);
    if (e.opt && (t === undefined || t === '')) continue; // literal que parece código: solo se traduce si el diccionario lo pide
    if (t === undefined || t === '') { if (faltan) faltan.add(e.texto); continue; }
    if (usadas) usadas.add(e.texto);
    if (t === null) continue;
    out += src.slice(pos, e.ini) + escapa(t, e.clase === 'json' ? 'json' : (e.clase === 'html' || e.clase === 'attr') ? (e.tipo || '') : e.tipo); pos = e.fin;
  }
  return out + src.slice(pos);
}
const traduceJS = (src, dics, faltan, usadas) => aplica(src, edicionesJS(src), dics, faltan, usadas);
const traduceHTML = (html, dics, faltan, usadas) => aplica(html, unidadesHTML(html).sort((a, b) => a.ini - b.ini).map((u) => ({ ...u, tipo: u.clase === 'json' ? 'json' : '' })), dics, faltan, usadas);
const sinSelector = (html) => html.replace(/<style>[^<]*<\/style><div class="lg">[\s\S]*?<\/script>/, '');
const candidatosHTML = (html) => [...new Set(unidadesHTML(sinSelector(html)).map((u) => u.texto))];
const candidatosJS = (src) => [...new Set(edicionesJS(src).filter((u) => !u.opt).map((u) => u.texto))];

/* ---------- Generar publico/<idioma>/ ---------- */
const Catalogo = require('./catalogo.js'), Idiomas = require('./idiomas.js'), Herramientas = require('./herramientas.js');
const publico = path.join(__dirname, '..', 'publico');
const crypto = require('crypto');

// Números del idioma: en los scripts de lo generado, la coma decimal fija pasa a la del idioma y 'es' a su localización.
function numeros(src, idioma) {
  const I = Idiomas.IDIOMAS.find((i) => i.c === idioma);
  src = src.replace(/url\(\.\.\/\.\.\//g, 'url(../../../'); // rutas de recursos dentro de los scripts: la página baja un nivel
  if (I.num.dec === ',') return src;
  return src.replace(/\.replace\((['"])\.\1, *(['"]),\2\)/g, ".replace('.', '.')").replace(/toLocaleString\((['"])es(?:-ES)?\1/g, `toLocaleString('${idioma}'`).replace(/Intl\.NumberFormat\((['"])es(?:-ES)?\1/g, `Intl.NumberFormat('${idioma}'`);
}

const dicComun = (idioma) => leeDic(idioma, '_comun');
const dicDe = (idioma, carpeta) => leeDic(idioma, carpeta.replace(/\//g, '__'));
// Idiomas con dic de herramienta: las páginas que se generan
const paginasTraducidas = (idioma) => Herramientas.lista().filter((h) => fs.existsSync(rutaDic(idioma, h.carpeta.replace(/\//g, '__'))));

// Ruta relativa de `desde` (carpeta, con barras) a `hasta`
const rel = (desde, hasta) => { const r = path.posix.relative('/' + desde.replace(/\/$/, ''), '/' + hasta.replace(/\/$/, '')); return (r || '.') + (hasta.endsWith('/') || hasta === '' ? '/' : ''); };

function generarPagina(h, idioma, existentes, faltan, usadas) {
  const I = Idiomas.IDIOMAS.find((i) => i.c === idioma);
  const origen = path.join(publico, h.asignatura, h.clave, 'index.html');
  let html = fs.readFileSync(origen, 'utf8');
  const dics = [dicDe(idioma, h.carpeta), dicComun(idioma)];
  const ruta = `${h.asignatura}/${h.clave}/`, aqui = `${idioma}/${ruta}`;
  html = html.replace(/<style>[^<]*<\/style><div class="lg">[\s\S]*?<\/script>/, '<!--LG-->'); // el selector se pinta al final, ya en el idioma
  // 1. scripts: los de la página en línea y las copias traducidas de los externos con huella
  html = html.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g, (m, attrs = '', cuerpo) => {
    const src = /\ssrc="([^"]+)"/.exec(attrs);
    if (src) {
      const mm = /^\.\.\/\.\.\/js\/([^"]+)$/.exec(src[1]); if (!mm) return m;
      const cod = fs.readFileSync(path.join(publico, 'js', mm[1]), 'utf8');
      const nuevo = numeros(traduceJS(cod, dics, faltan, usadas), idioma), hash = crypto.createHash('sha1').update(nuevo).digest('hex').slice(0, 8);
      const nombre = mm[1].replace(/\.[0-9a-f]{8}\.js$/, `.${idioma}.${hash}.js`);
      fs.mkdirSync(path.join(publico, 'js', idioma), { recursive: true }); fs.writeFileSync(path.join(publico, 'js', idioma, nombre), nuevo);
      return `<script${attrs.replace(src[1], `../../../js/${idioma}/${nombre}`)}></script>`;
    }
    if (/ld\+json/.test(attrs)) return m; // sus textos los traduce traduceHTML más abajo
    if (/pagead|adsbygoogle/.test(attrs + cuerpo)) return m;
    return `<script${attrs}>${numeros(traduceJS(cuerpo, dics, faltan, usadas), idioma)}</script>`;
  });
  // 2a. textos de las hojas de estilo (content: '…')
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, (st) => st.replace(/content:\s*(['"])([^'"\n]*[A-Za-zÁÉÍÓÚáéíóúñ]{3}[^'"\n]*)\1/g, (m, q, t) => { const v = busca(dics, t); usadas.add(t); if (v === undefined) { faltan.add(t); return m; } return v ? `content:${q}${v}${q}` : m; }));
  // 2. HTML (texto y atributos)
  html = traduceHTML(html, dics, faltan, usadas);
  // 3. lang, canonical, hreflang, robots y selector
  html = html.replace('<html lang="es">', `<html lang="${I.html}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${Catalogo.web}/${aqui}">` + (I.indexar ? '' : '\n' + Idiomas.ROBOTS(idioma)));
  html = html.replace(/<meta property="og:image"/, `<meta property="og:locale" content="${I.html.replace('-', '_')}">\n<meta property="og:image"`);
  // 4. enlaces y recursos relativos: la página baja un nivel (/en/…); lo que existe en este idioma se queda en él
  html = html.replace(/\b(href|src|action)="(\.\.\/[^"#]*)(#[^"]*)?"/g, (m, a, u, hash = '') => {
    const abs = path.posix.normalize(path.posix.join(ruta, u)); // ruta absoluta sin barra inicial, desde la raíz del sitio
    const dest = abs === '.' ? '' : abs;
    const sitio = dest.replace(/\/$/, '');
    const enIdioma = a === 'href' && (dest === '' || existentes.has(sitio + '/') || /^(?:[^/]+\/)?$/.test(dest) && false);
    return `${a}="${enIdioma ? rel(aqui, `${idioma}/${dest}`) : rel(aqui, dest)}${hash}"`;
  });
  // 5. selector de idioma apuntando a esta página (idiomas publicados que la tienen)
  html = html.replace('<!--LG-->', Idiomas.BOTON({ idioma, raiz: '../../../', ruta }));
  const out = path.join(publico, idioma, h.asignatura, h.clave, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
  return out;
}

function generar(idioma) {
  const paginas = paginasTraducidas(idioma), faltan = new Set(), usadas = new Set();
  fs.rmSync(path.join(publico, idioma), { recursive: true, force: true }); fs.rmSync(path.join(publico, 'js', idioma), { recursive: true, force: true });
  const existentes = new Set(paginas.map((h) => `${h.asignatura}/${h.clave}/`));
  for (const h of paginas) generarPagina(h, idioma, existentes, faltan, usadas);
  return { paginas: paginas.length, faltan: [...faltan], usadas };
}

if (typeof module !== 'undefined') module.exports = { generar, generarPagina, paginasTraducidas, numeros, literales, esTexto, unidadesHTML, edicionesJS, traduceJS, traduceHTML, candidatosHTML, candidatosJS, leeDic, guardaDic, DIR };

if (require.main === module) {
  const [, , cmd, idioma, carpeta] = process.argv;
  if (cmd === 'todos') { for (const c of fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => fs.statSync(path.join(DIR, f)).isDirectory()) : []) { const r = generar(c); console.log(`i18n ${c}: ${r.paginas} páginas${r.faltan.length ? `, ${r.faltan.length} textos sin traducir` : ''}`); } }
  else if (cmd === 'generar') { const r = generar(idioma || 'en'); console.log(`i18n ${idioma || 'en'}: ${r.paginas} páginas${r.faltan.length ? `, ${r.faltan.length} textos sin traducir` : ''}`); }
  else if (cmd === 'reusar') {
    // reusar <idioma> [carpeta|todas]: rellena los "" con la traducción que ya tiene la misma clave en otro diccionario del idioma
    const dir = path.join(DIR, idioma), nombres = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)), conocidas = new Map();
    for (const n of nombres) for (const [k, v] of Object.entries(leeDic(idioma, n))) if (v !== '' && v !== null && !conocidas.has(k)) conocidas.set(k, v);
    let total = 0;
    for (const n of nombres) if (!carpeta || carpeta === 'todas' || n === carpeta.replace(/\//g, '__')) { const d = leeDic(idioma, n); let c = 0; for (const k of Object.keys(d)) if (d[k] === '' && conocidas.has(k)) { d[k] = conocidas.get(k); c++; } if (c) { guardaDic(idioma, n, d); total += c; } }
    console.log(total + ' claves rellenadas con traducciones de otros diccionarios');
  }
  else if (cmd === 'volcar' || cmd === 'cargar') {
    // volcar: escribe en <archivo> la lista de claves sin traducir; cargar: lee una lista de traducciones (mismo orden) y las guarda
    const nombre = carpeta.replace(/\//g, '__'), d = leeDic(idioma, nombre), archivo = process.argv[5];
    if (cmd === 'volcar') { const falta = Object.keys(d).filter((k) => d[k] === ''); fs.writeFileSync(archivo, JSON.stringify(falta, null, 1)); console.log(falta.length + ' claves en ' + archivo); }
    else { const falta = Object.keys(d).filter((k) => d[k] === ''), t = JSON.parse(fs.readFileSync(archivo, 'utf8')); if (t.length !== falta.length) throw new Error(`hay ${falta.length} claves y ${t.length} traducciones`); falta.forEach((k, i) => { d[k] = t[i]; }); guardaDic(idioma, nombre, d); console.log(t.length + ' traducciones cargadas'); }
  }
  else if (cmd === 'candidatos' || cmd === 'rellenar') {
    // textos de una herramienta (o 'comun') que faltan en su diccionario
    const { lista, ficherosDe, script } = Herramientas;
    let textos = [];
    if (carpeta === '_comun') {
      const h0 = lista().find((h) => h.carpeta === 'choques');
      const h1 = lista().find((h) => h.carpeta !== 'choques' && h.asignatura === 'fisica');
      const leer = (h) => candidatosHTML(fs.readFileSync(path.join(publico, h.asignatura, h.clave, 'index.html'), 'utf8'));
      const otros = new Set(leer(h1));
      textos = leer(h0).filter((t) => otros.has(t));
      for (const f of ficherosDe(h0)) if (!/^(choques)\//.test(f)) textos.push(...candidatosJS(script(f)));
    } else {
      const h = lista().find((x) => x.carpeta === carpeta); if (!h) throw new Error('herramienta desconocida: ' + carpeta);
      const html = fs.readFileSync(path.join(publico, h.asignatura, h.clave, 'index.html'), 'utf8');
      textos = candidatosHTML(html);
      for (const f of h.scripts) textos.push(...candidatosJS(script(f)));
      textos = textos.filter((t) => busca([dicComun(idioma)], t) === undefined);
    }
    const nombre = carpeta.replace(/\//g, '__'), d = leeDic(idioma, nombre), nuevos = [...new Set(textos)].filter((t) => !(t in d));
    if (cmd === 'rellenar') { for (const t of nuevos) d[t] = ''; guardaDic(idioma, nombre, d); }
    console.log(nuevos.length + ' textos por traducir' + (cmd === 'rellenar' ? ' (añadidos al diccionario con "")' : ':\n' + nuevos.join('\n')));
  }
}
