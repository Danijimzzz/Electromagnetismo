/* =====================================================================
   Ayudantes comunes de las herramientas (los que antes copiaba cada una).
   herramientas.js lo pone en cada página justo después de version.js; en
   Node (pruebas) comprobar.js lo deja en global.Herramienta. Uso:
     const { $, esc, copia, vacio } = Herramienta;
     $(q)          document.querySelector
     esc(s)        texto seguro dentro de HTML y de atributos
     copia(o)      copia profunda de datos JSON (el estado sc, un ejemplo)
     vacio(v)      campo sin rellenar (undefined, null o solo espacios)
     txt(h)        HTML de un resultado a texto para el lienzo (exponentes ⁰¹²…)
     marcas(a, b, n)  valores redondos (1, 2, 2,5, 5 × 10ⁿ) para las marcas de un eje
     lienzo(c)     prepara un <canvas> (o su selector) a la resolución de la
                   pantalla, limpio y en px CSS: { g, w, h, c, cambia }; cambia
                   es true si el tamaño era otro (para rehacer un fondo guardado)
   ===================================================================== */
const Herramienta = (() => {
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
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
  return { $, esc, copia, vacio, txt, marcas, lienzo };
})();
if (typeof module !== 'undefined') module.exports = Herramienta;
