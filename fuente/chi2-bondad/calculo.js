/* =====================================================================
   Chi2Bondad del cálculo de una herramienta (sin DOM). node fuente/nueva.js la
   copia a fuente/<clave>/calculo.js cambiando Chi2Bondad y chi2-bondad por el
   nombre y la clave. Trae un ejemplo que funciona (movimiento uniforme,
   v = s/t) para que la página y las pruebas pasen desde el principio:
   cámbialo por lo tuyo. La interfaz está en app.js y la prueba en
   pruebas/herramientas/<clave>.js.
     resolver(sc)  datos del formulario (texto) → { …resultados, pasos }; lanza
                   un Error con un mensaje para el usuario si falta o falla algo
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     f(x)          número con coma decimal y ·10<sup>n</sup>
   ===================================================================== */
const Chi2Bondad = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser mayor que 0`);
    return v;
  }

  function resolver(sc) {
    const s = lee(sc, 's', 'la distancia'), t = lee(sc, 't', 'el tiempo'), v = s / t;
    const pasos = [
      { t: 'Datos', html: `$s = ${f(s)} "m"$, $t = ${f(t)} "s"$` },
      { t: 'Velocidad media', html: `$v = s/t = ${f(s)}/${f(t)} = ${f(v)} "m/s"$` },
      { t: 'En km/h', html: `$v = ${f(v)} · 3,6 = ${f(v * 3.6)} "km/h"$` },
    ];
    return { s, t, v, pasos };
  }

  const ejemplos = [
    { clave: 'coche', nombre: 'Un coche recorre 150 m en 10 s', sc: { s: '150', t: '10' } },
    { clave: 'luz', nombre: 'La luz del Sol a la Tierra', sc: { s: '1,496·10^11', t: '499' } },
  ];

  return { resolver, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Chi2Bondad;
