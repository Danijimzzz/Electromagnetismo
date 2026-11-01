#!/usr/bin/env node
/* =====================================================================
   Línea del tiempo interna de SimulaCiencia. Escribe interno/linea-tiempo/index.html (una sola
   página, abrir en el navegador) juntando: lo hecho, de fuente/version.js (registros.web);
   lo planeado y lo futuro, de planes.js; y las herramientas «Próximamente» y los fenómenos
   pendientes, de fuente/catalogo.js. Uso: node interno/linea-tiempo/generar.js
   Está fuera de publico/: ni se despliega, ni sale en sitemap.xml, ni lleva enlaces desde la web.
   ===================================================================== */
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..', '..');
const cargar = (f, nombre) => new Function(fs.readFileSync(path.join(raiz, 'fuente', f), 'utf8') + `;return ${nombre}`)();
const Version = cargar('version.js', 'Version'), Catalogo = cargar('catalogo.js', 'Catalogo');
const planes = require('./planes.js');

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fecha = (iso) => { const [a, m, d] = iso.split('-').map(Number); return `${d} ${MES[m - 1]} ${a}`; };
const limpio = (t) => t.replace(/\*\*/g, '').replace(/@\w+/g, '').trim();
const herramientas = Object.fromEntries(Catalogo.asignaturas.flatMap((a) => (a.herramientas || []).map((h) => [h.clave, { ...h, asignatura: a.nombre }])));
const fenomenos = Object.fromEntries((Catalogo.fenomenos.lista || []).map((f) => [f.clave, f]));

// Lo hecho: una entrada por versión de la web, de la más antigua a la más reciente
const hecho = Version.registros.web.slice().reverse().map((r, i) => {
  const puntos = (r.cambios || []).filter((c) => !c.startsWith('#')).map(limpio).filter(Boolean);
  const nuevas = (r.secciones || []).filter((s) => /^Nuev/.test(s.titulo)).length;
  const verMas = puntos.length > 8 ? [[`y ${puntos.length - 8} cosas más (ver Novedades)`, 1]] : [];
  return {
    id: i + 1, e: 'hecho', v: 'Web ' + r.v, f: fecha(r.fecha),
    t: r.titulo || 'Arreglos visibles', i: (r.secciones && r.secciones[0] && r.secciones[0].icono) || '🩹',
    d: r.subtitulo || puntos[0] || '',
    p: puntos.slice(0, 8).map((c) => [c.length > 150 ? c.slice(0, 147) + '…' : c, 1]).concat(verMas),
    l: [r.titulo ? (nuevas ? 'Herramienta nueva' : 'Novedad') : 'Arreglo', 'Web ' + r.v],
  };
});

// Lo planeado y futuro: planes.js, con las herramientas y fenómenos pendientes leídos del catálogo
const pendientes = planes.map((x, k) => {
  const p = (x.p || []).slice();
  for (const c of x.claves || []) { const h = herramientas[c]; if (h) p.push([`${h.nombre} (${h.asignatura})`, h.disponible === false ? 0 : 1]); }
  for (const c of x.fen || []) { const f = fenomenos[c]; if (f) p.push([`Fenómeno: ${f.nombre}`, f.disponible === false ? 0 : 1]); }
  const hechos = p.filter((q) => q[1]).length;
  return { ...x, id: hecho.length + k + 1, p, pg: x.pg != null ? x.pg : Math.round(hechos / Math.max(p.length, 1) * 100) };
});

const hoy = new Date().toISOString().slice(0, 10);
const plantilla = fs.readFileSync(path.join(__dirname, 'plantilla.html'), 'utf8');
const corte = plantilla.indexOf('<div class="aurora"');
const cabeza = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="noindex, nofollow">\n' + plantilla.slice(0, corte) + '</head>\n<body>\n';
const html = (cabeza + plantilla.slice(corte).replace('/*DATOS*/[]', () => JSON.stringify(hecho.concat(pendientes)))
  .replace("/*HOY*/''", () => JSON.stringify(fecha(hoy).toUpperCase().replace(/ 20\d\d$/, '')))) + '</body>\n</html>\n';
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log(`interno/linea-tiempo/index.html: ${hecho.length} hechos, ${pendientes.length} planeados y futuros.`);
