/* =====================================================================
   Ayudantes comunes de las herramientas (los que antes copiaba cada una).
   herramientas.js lo pone en cada página justo después de version.js; en
   Node (pruebas) comprobar.js lo deja en global.Herramienta. Uso:
     const { $, esc, copia, vacio } = Herramienta;
     $(q)          document.querySelector
     esc(s)        texto seguro dentro de HTML y de atributos
     copia(o)      copia profunda de datos JSON (el estado sc, un ejemplo)
     vacio(v)      campo sin rellenar (undefined, null o solo espacios)
     leeSI(s, base)  número de un campo con coma, 3·10^8, prefijos del SI y
                   unidad: «4k7», «1,5 kΩ», «100n», «10 µF», «5 ms». Con prefijo,
                   notación 4k7 o unidad escrita da el valor en unidades del SI;
                   un número solo se multiplica por base (1e-3 si el campo
                   está en mH, 1e-6 si en μF). NaN si no se entiende
     txt(h)        HTML de un resultado a texto para el lienzo (exponentes ⁰¹²…)
     marcas(a, b, n)  valores redondos (1, 2, 2,5, 5 × 10ⁿ) para las marcas de un eje
     lienzo(c)     prepara un <canvas> (o su selector) a la resolución de la
                   pantalla, limpio y en px CSS: { g, w, h, c, cambia }; cambia
                   es true si el tamaño era otro (para rehacer un fondo guardado)
     accesible()   (ya se llama al cargar) aria-live en los resultados, role=alert en los
                   errores y aria-describedby de cada gráfica hacia los resultados
   ===================================================================== */
const Herramienta = (() => {
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const PREFIJOS = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9, R: 1 };
  const leeSI = (s, base = 1) => {
    let t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
    const sinUnidad = t.replace(/(Ω|ohmios?|ohms?|Hz|var|VA|V|A|F|H|W|S|s)$/, ''), unidad = sinUnidad !== t;
    t = sinUnidad;
    let m = t.match(/^([+-]?)(\d*)([pnuµμmkKMGR])(\d+)$/);
    if (m) return +`${m[1]}${m[2] || 0}.${m[4]}` * PREFIJOS[m[3]];
    m = t.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([pnuµμmkKMG]?)$/i);
    if (!m) return NaN;
    return +m[1] * (m[2] ? PREFIJOS[m[2]] : unidad ? 1 : base);
  };
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const marcas = (a, b, n = 6) => {
    const p0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(p0)), paso = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0) || 10 * e;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  };
  const lienzo = (c) => {
    if (typeof c === 'string') c = $(c);
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    const cambia = c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr);
    if (cambia) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h, c, cambia };
  };
  // Accesibilidad común: los resultados que cambian al tocar un dato se anuncian con cortesía (aria-live), los mensajes de error
  // como alerta y cada gráfica se describe con los resultados de al lado (aria-describedby), no solo con su título fijo.
  const accesible = (doc = typeof document !== 'undefined' ? document : null) => {
    if (!doc) return;
    const RES = '#resumen, #res, #resumen-d, #resumen-r, #resumen-c, #resumen-este, #resumen-emp, #resumen-nq, #resumen-conf, #res-masa, #res-dil, #res-mez';
    for (const e of doc.querySelectorAll(RES)) if (!e.hasAttribute('aria-live')) e.setAttribute('aria-live', 'polite');
    for (const e of doc.querySelectorAll('.error')) if (!e.hasAttribute('role')) e.setAttribute('role', 'alert');
    const res = doc.querySelector('#resumen, #res');
    if (res) for (const c of doc.querySelectorAll('canvas')) if (!c.hasAttribute('aria-describedby') && !c.closest('#resumen, #res') && !c.hasAttribute('aria-hidden')) c.setAttribute('aria-describedby', res.id);
  };
  accesible();
  return { $, esc, copia, vacio, leeSI, txt, marcas, lienzo, accesible };
})();
if (typeof module !== 'undefined') module.exports = Herramienta;
