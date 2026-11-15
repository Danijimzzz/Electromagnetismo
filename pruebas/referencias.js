/* ===== Referencias externas (Fase 14: F14.1 Química, F14.2 Matemáticas) =====
   Comprueba que los contrastes hechos con programas de Python (pruebas/referencias/*.py → *.json) siguen
   vigentes y sin diferencias sin explicar. No necesita Python: lee los JSON guardados.
   Química: quimica.json lo escribe quimica.py comparando fuente/quimica/datos.js con `chemicals`, `mendeleev`
   y PHREEQC. Falla si algún dato se aparta de la fuente sin una razón escrita (REVISADAS en el .py) o si
   datos.js cambió desde la última vez que se contrastó (hay que volver a ejecutar el guion).
   Matemáticas: matematicas.json lo escribe matematicas.py (sympy) y se comprueba con las propias herramientas. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const raiz = path.join(__dirname, '..');
let fallos = 0;
const mal = (m) => { fallos++; console.error('✗ ' + m); };

{ // ---------- Química ----------
  const R = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencias', 'quimica.json'), 'utf8'));
  const D = require(path.join(raiz, 'fuente', 'quimica', 'datos.js'));
  const sello = crypto.createHash('sha256').update(JSON.stringify(D)).digest('hex');
  if (sello !== R.sello_datos) mal('Química: fuente/quimica/datos.js ha cambiado desde el último contraste; ejecuta `python3 pruebas/referencias/quimica.py` y mira las diferencias nuevas');
  for (const f of R.filas) if (!f.ok && !f.revisada) mal(`Química · ${f.grupo} ${f.dato}: ${f.nuestro} frente a ${f.ref} (${f.fuente}), fuera de ±${f.tol} y sin explicación`);
  const n = R.filas.length, rev = R.filas.filter((f) => f.revisada).length;
  console.log(`Referencias de Química: ${n} datos contrastados con ${Object.keys(R.versiones).join(', ')}; ${rev} diferencias entre tablas explicadas; sin contraste: ${R.sin_contraste.length} bloques.`);
}
if (fs.existsSync(path.join(__dirname, 'referencias', 'matematicas.json'))) require('./referencias-matematicas.js')({ fs, path, raiz, mal });
if (fallos) { console.error(`Referencias: ${fallos} fallos`); process.exit(1); }
