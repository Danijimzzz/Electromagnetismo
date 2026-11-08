#!/usr/bin/env node
/* ===== Mapa de cobertura de pruebas (10.18) =====
   Por herramienta mide, leyendo su prueba (pruebas/herramientas/<carpeta>.js) y su cálculo:
   · ejemplos de la herramienta (C.ejemplos) y cuántos tienen un valor comprobado a mano (cerca/igual/esperado);
   · comprobaciones numéricas totales, casos de error (entradas que deben fallar) y casos límite (0, vacío, enorme);
   · si la prueba quedó con el ejemplo de la plantilla («coche»/«luz»/«Plantilla»).
   Da una puntuación y lista las más flojas. Uso: node pruebas/cobertura.js [--n 15] [--json salida.json]
   Con --minimo N sale con 1 si alguna herramienta puntúa menos de N (sin usar de momento en CI). */
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), Catalogo = require(path.join(raiz, 'fuente', 'catalogo.js'));
const args = process.argv.slice(2), arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const filas = [];
for (const a of Catalogo.asignaturas) for (const h of a.herramientas.filter((x) => x.disponible)) {
  const carpeta = h.carpeta || h.clave, fp = path.join(__dirname, 'herramientas', carpeta + '.js');
  const t = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf8') : '';
  const cuenta = (re) => (t.match(re) || []).length;
  const num = cuenta(/\b(cerca|igual|iguales|casi|esperado|eq|ok)\(/g) + cuenta(/toBeCloseTo|Math\.abs\([^)]*\)\s*[<>]/g);
  const err = cuenta(/\b(error|falla|debeFallar|noDa)\(|no da error|ok = true/g);
  const lim = cuenta(/\b(Infinity|1e\d{2,}|NaN)\b|tiempo cero|vac[ií]o|división por cero|=\s*['"]0['"]|\b0,\s*0\b/gi);
  let ejem = 0, sc = ''; try { const dir = path.join(raiz, 'fuente', carpeta); const f = ['calculo.js', 'fisica.js'].map((n) => path.join(dir, n)).find(fs.existsSync); if (f) { sc = fs.readFileSync(f, 'utf8'); ejem = (sc.match(/clave:\s*'/g) || []).length; } } catch (e) { /* sin cálculo propio */ }
  const plantilla = /\bPlantilla\b/.test(t) && carpeta !== 'plantilla';
  const nav = /pagina\(|browser/.test(t) ? 1 : 0;
  const punt = Math.min(num, 12) + Math.min(err, 4) * 2 + Math.min(lim, 3) * 2 + nav * 3 + (plantilla ? -20 : 0) + (t || carpeta === 'electrostatica' ? 0 : -30);
  filas.push({ asignatura: a.clave, carpeta, ejemplos: ejem, numericas: num, errores: err, limites: lim, navegador: nav, plantilla, puntos: punt, tamano: t.length });
}
filas.sort((x, y) => x.puntos - y.puntos);
const n = +arg('--n', 15);
console.log(`Cobertura de pruebas · ${filas.length} herramientas · las ${n} más flojas (puntos: numéricas ≤12 + errores ≤4×2 + límites ≤3×2 + navegador 3)`);
console.log('puntos  numér  error  límite  nav  herramienta');
for (const f of filas.slice(0, n)) console.log(`${String(f.puntos).padStart(6)}  ${String(f.numericas).padStart(5)}  ${String(f.errores).padStart(5)}  ${String(f.limites).padStart(6)}  ${String(f.navegador).padStart(3)}  ${f.asignatura}/${f.carpeta}${f.plantilla ? '  ← aún con la plantilla' : ''}`);
const sinNada = filas.filter((f) => f.numericas === 0 || f.plantilla);
console.log(`\n${sinNada.length} herramienta(s) sin ninguna comprobación numérica o con restos de la plantilla.`);
if (arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(filas, null, 1));
const min = arg('--minimo'); if (min && filas[0].puntos < +min) process.exit(1);
