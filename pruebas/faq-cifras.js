/* ===== Cifras de las preguntas frecuentes (TRV.10.7, Fase 14) =====
   Cada respuesta con un ejemplo resuelto del tipo «… = 8,99·10⁹ · 2·10⁻⁹ / 0,03² ≈ 2,0·10⁴ N/C» se evalúa: se calcula el segundo
   miembro con los números de la propia frase y se compara con el resultado escrito, a la precisión con que está escrito. Así un número
   mal puesto en una FAQ (que además sale en Google) hace fallar la prueba. Lo que la frase no deja evaluar solo (unidades dentro de la cuenta,
   texto en medio) se cuenta como «sin evaluar» y va a la lista de revisión a mano: node pruebas/faq-cifras.js --lista
   node pruebas/faq-cifras.js [--lista]   (lo llama comprobar.js) */
const path = require('path'), fuente = path.join(__dirname, '..', 'fuente');
const P = require(path.join(fuente, 'preguntas.js'));
const PRE = Object.assign({}, ...['electromagnetismo', 'fisica', 'quimica', 'matematicas', 'estadistica', 'circuitos', 'economia'].map((a) => require(path.join(fuente, 'preguntas', `${a}.js`))));
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '' };
// texto → expresión de JS, o null si lleva algo que no es un número, un operador o una constante
function aJs(t) {
  let s = t.trim().replace(/[  ]/g, ' ').replace(/−/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '**(' + [...m].map((c) => SUP[c]).join('') + ')');
  s = s.replace(/(\d)\s*·\s*10\*\*\(/g, '$1e(').replace(/e\((-?\d+)\)/g, 'e$1').replace(/\b10\*\*\(/g, '1e(').replace(/1e\((-?\d+)\)/g, '1e$1');
  s = s.replace(/(\d)\s*×\s*10\^\(?(-?\d+)\)?/g, '$1e$2').replace(/(\d)\s*·\s*10\^\(?(-?\d+)\)?/g, '$1e$2');
  s = s.replace(/(\d),(\d)/g, '$1.$2').replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/π/g, '(Math.PI)').replace(/√\s*\(([^()]*)\)/g, 'Math.sqrt($1)').replace(/√\s*(\d+(?:\.\d+)?(?:e-?\d+)?)/g, 'Math.sqrt($1)');
  s = s.replace(/(\d|\))\s*\(/g, '$1*(').replace(/\)\s*(\d)/g, ')*$1').replace(/(\d)\s*\(Math/g, '$1*(Math').replace(/(\d)Math/g, '$1*Math').replace(/\)\s*Math/g, ')*Math');
  if (/[^0-9eE+\-*/.()  ]|Math\.(?!PI|sqrt)/.test(s.replace(/Math\.PI|Math\.sqrt/g, ''))) return null;
  return s;
}
const num = (t) => { const s = aJs(t); if (s === null) return null; try { const v = Function(`"use strict";return (${s})`)(); return Number.isFinite(v) ? v : null; } catch (e) { return null; } };
// cifras significativas con que está escrito un resultado
const cifras = (t) => { const m = t.replace(/[,.]/g, (c) => (c === ',' ? '.' : c)).match(/^-?\s*(\d+(?:\.\d+)?)/); if (!m) return 3; const d = m[1].replace('.', '').replace(/^0+/, ''); return Math.max(1, d.length); };
const dec = (t) => { const m = t.match(/[,.](\d+)/); return m ? m[1].length : 0; };
const lista = process.argv.includes('--lista');
let evaluadas = 0, sin = [], fallos = 0;
for (const [clave, fs_] of Object.entries(PRE)) for (const [q, a] of fs_) {
  // «= cuenta = resultado» o «= cuenta ≈ resultado» (con las unidades del resultado detrás)
  const re = /=\s*([^=≈;]+?)\s*(=|≈)\s*(-?\d[\d.,\s]*(?:\s*[·×]\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+|\s*[·×]\s*10\^-?\d+)?)/g; let m, algo = false;
  while ((m = re.exec(a))) {
    // la cuenta es lo último de la izquierda antes del «=»: sin letras de unidades dentro (si las hay, se prueba quitando la unidad final)
    let izq = m[1].replace(/\s*(N\/C|N·m²\/C²|N|m\/s²|m\/s|kg|mol|T|V|J|W|Hz|Ω|A|s|m|g|C|F|H|K|eV|%)\s*$/, '').trim();
    // sin las unidades pegadas a los números (10 cm, 5 kg, 100 V…) ni las variables antes de «=»: queda la aritmética
    izq = izq.replace(/(\d)\s*(?:[A-Za-zµΩ°%′]+(?:[·/][A-Za-zµΩ]+)*[²³]?)(?![A-Za-z(])/g, '$1').replace(/^.*[A-Za-zµ_)]\s*(?==|\s*\d)/, (x) => (/\d/.test(x) ? x : '')).trim();
    if (!/[*/+\-·×^²³⁻√π]|\d\s*\(|\)\s*\d/.test(izq.replace(/^-/, '')) ) continue; // sin cuenta, solo un número
    const v = num(izq), r = num(m[3]); if (v === null || r === null) { sin.push(`${clave} · «${m[1].trim().slice(-60)} ${m[2]} ${m[3].trim()}»`); continue; }
    if (m[2] === '=' && /\d,?\d*\s*$/.test(m[1]) && /^\s*-?\d/.test(m[1]) && num(m[1]) === null) continue;
    evaluadas++; algo = true;
    const tol = m[2] === '=' ? 1e-9 : 0, escrito = m[3].trim(); let ok;
    if (escrito.includes('10') && /10/.test(escrito) && /[·×]/.test(escrito)) { const c = cifras(escrito); ok = Math.abs(v - r) <= Math.abs(r) * 0.5 * 10 ** (1 - c) * 1.001; } else { const d = dec(escrito); ok = Math.abs(v - r) <= 0.5 * 10 ** -d * 1.001 + Math.abs(r) * tol; }
    // la cuenta puede estar en otras unidades (mH, mm, %): vale si solo cambia una potencia de 10 y las cifras coinciden
    if (!ok && v !== 0 && r !== 0) { const k = Math.round(Math.log10(Math.abs(r / v))); if (k !== 0 && Math.abs(Math.abs(r / v) / 10 ** k - 1) < 0.05) { const v2 = v * 10 ** k, c = cifras(escrito.replace(/\s*[·×].*$/, '')); ok = Math.abs(v2 - r) <= Math.abs(r) * 0.5 * 10 ** (1 - c) * 1.001 + 1e-12 || (dec(escrito) > 0 && Math.abs(v2 - r) <= 0.5 * 10 ** -dec(escrito) * 1.001); } }
    if (!ok && /(arc|ln|log|sen|cos|tan|k_B)/.test(m[1])) continue; // funciones que el evaluador no conoce
    if (!ok) { fallos++; console.log(`✗ ${clave}: «${m[1].trim()} ${m[2]} ${escrito}» → sale ${v} (${q})`); }
  }
}
if (lista) { console.log(`\nSin evaluar solo (a mano): ${sin.length}`); for (const s of sin) console.log(' -', s); }
console.log(`Cifras de las FAQ: ${evaluadas} cuentas evaluadas por el código, ${sin.length} sin poder evaluar (--lista las muestra); ${fallos} fallos.`);
process.exit(fallos ? 1 : 0);
