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
     leeUn(s)      valor en el SI de un número con unidad escrita («4 mm», «2,4 GHz», «10 pF»), o undefined si no lleva unidad
     txt(h)        HTML de un resultado a texto para el lienzo (exponentes ⁰¹²…)
     marcas(a, b, n)  valores redondos (1, 2, 2,5, 5 × 10ⁿ) para las marcas de un eje
     lienzo(c)     prepara un <canvas> (o su selector) a la resolución de la
                   pantalla, limpio y en px CSS: { g, w, h, c, cambia }; cambia
                   es true si el tamaño era otro (para rehacer un fondo guardado)
     enlace        un enlace con #d=… (lo copia «Mis ejercicios») deja sus datos en la clave de la página
                   (Pagina.guarda) antes de que arranque la app, en todas las herramientas
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
  // Número con unidad física escrita («4 mm», «2,4 GHz», «10 pF», «5 m», «30 cm»): valor en unidades del SI, o undefined si el texto no
  // lleva unidad (entonces cada herramienta lo lee como antes). Con «m» suelta es el metro, no el prefijo milli.
  const UNIDADES = { m: 1, Hz: 1, F: 1, H: 1, A: 1, V: 1, 'Ω': 1, ohm: 1, ohmios: 1, T: 1, W: 1, S: 1, s: 1, C: 1, N: 1, J: 1 };
  const PREF_UN = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, c: 1e-2, k: 1e3, M: 1e6, G: 1e9 };
  const leeUn = (s) => {
    const t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
    const m = t.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(ohmios|ohm|Hz|[mFHAVΩTWSsCNJ]|[pnuµμmckMG](?:Hz|[mFHAVΩTWSsCNJ]))$/);
    if (!m) return undefined;
    const u = m[2];
    if (UNIDADES[u] !== undefined) return +m[1];
    const pre = u[0], r = u.slice(1);
    if (PREF_UN[pre] === undefined || UNIDADES[r] === undefined) return undefined;
    if (pre === 'c' && r !== 'm') return undefined;
    return +m[1] * PREF_UN[pre];
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
  // Enlace que lleva el estado (#d=…, base64 url del JSON guardado): los datos pasan a donde la app los lee al arrancar
  if (typeof location !== 'undefined' && typeof Pagina !== 'undefined' && Pagina.guarda) {
    const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (m) {
      try { const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))); JSON.parse(json); localStorage.setItem(Pagina.guarda, json); } catch (e) { /* enlace roto o sin almacenamiento */ }
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
    }
  }
  return { $, esc, copia, vacio, leeSI, leeUn, txt, marcas, lienzo, accesible };
})();
if (typeof module !== 'undefined') module.exports = Herramienta;
