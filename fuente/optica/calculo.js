/* =====================================================================
   Óptica geométrica de lentes delgadas y espejos esféricos (sin DOM), en aproximación
   paraxial y con la convención «real es positivo»: 1/s + 1/s′ = 1/f, m = −s′/s.
   f > 0 en la lente convergente y el espejo cóncavo, f < 0 en la divergente y el convexo;
   s > 0 es un objeto real (delante del elemento) y s′ > 0 una imagen real (detrás de la
   lente o delante del espejo). La interfaz está en app.js y la prueba en
   pruebas/herramientas/optica.js.
     resolver(sc)  { tipo, f, s, h } (texto) → { fs, sp, m, hp, real, derecha, tam, pasos, … }
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     TIPOS         los cuatro elementos: clave, nombre, lente o espejo y signo de f
   ===================================================================== */
const Optica = (() => {
  const TIPOS = [
    { clave: 'convergente', nombre: 'Lente convergente', lente: true, signo: 1 },
    { clave: 'divergente', nombre: 'Lente divergente', lente: true, signo: -1 },
    { clave: 'concavo', nombre: 'Espejo cóncavo', lente: false, signo: 1 },
    { clave: 'convexo', nombre: 'Espejo convexo', lente: false, signo: -1 },
  ];
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
    const T = TIPOS.find((x) => x.clave === sc.tipo);
    if (!T) throw new Error('Elige el tipo de lente o de espejo');
    const fm = lee(sc, 'f', 'la distancia focal'), s = lee(sc, 's', 'la distancia del objeto'), h = lee(sc, 'h', 'la altura del objeto');
    const fs = T.signo * fm, enfoque = Math.abs(s - fs) < 1e-9 * Math.max(s, fm);
    const sp = enfoque ? Infinity : 1 / (1 / fs - 1 / s), m = enfoque ? Infinity : -sp / s, hp = m * h;
    const real = !enfoque && sp > 0, derecha = !enfoque && m > 0;
    const tam = enfoque ? '' : Math.abs(Math.abs(m) - 1) < 1e-9 ? 'igual' : Math.abs(m) > 1 ? 'mayor' : 'menor';
    const potencia = 100 / fs, radio = 2 * fs; // dioptrías (f en cm) y radio de curvatura del espejo
    const pasos = [
      { t: 'Convención', html: `Se usa «real es positivo»: $f > 0$ en ${T.lente ? 'la lente convergente' : 'el espejo cóncavo'} y $f < 0$ en ${T.lente ? 'la divergente' : 'el convexo'}. Aquí $f = ${f(fs)} "cm"$.` },
      { t: 'Datos', html: `$f = ${f(fs)} "cm"$, $s = ${f(s)} "cm"$, $h = ${f(h)} "cm"$` },
    ];
    if (enfoque) {
      pasos.push({ t: 'Posición de la imagen', html: `$1/s′ = 1/f − 1/s = 0$: el objeto está en el foco, los rayos salen paralelos y la imagen se forma en el infinito.` });
    } else {
      pasos.push(
        { t: 'Posición de la imagen', html: `$1/s′ = 1/f − 1/s = 1/(${f(fs)}) − 1/${f(s)} = ${f(1 / sp)} "cm"^{−1}$` },
        { t: 'Distancia de la imagen', html: `$s′ = ${f(sp)} "cm"$ ⇒ ${real ? `imagen real, ${T.lente ? 'al otro lado de la lente' : 'delante del espejo'}` : `imagen virtual, ${T.lente ? 'al mismo lado que el objeto' : 'detrás del espejo'}`}` },
        { t: 'Aumento lateral', html: `$m = −s′/s = −(${f(sp)})/${f(s)} = ${f(m)}$ ⇒ imagen ${derecha ? 'derecha' : 'invertida'} y de tamaño ${tam === 'igual' ? 'igual' : tam}` },
        { t: 'Altura de la imagen', html: `$h′ = m·h = ${f(m)}·${f(h)} = ${f(hp)} "cm"$` },
      );
    }
    pasos.push(T.lente
      ? { t: 'Potencia', html: `$P = 1/f = 1/(${f(fs / 100)} "m") = ${f(potencia)} "D"$` }
      : { t: 'Radio de curvatura', html: `$R = 2f = ${f(radio)} "cm"$ (el centro de curvatura está a ${f(Math.abs(radio))} cm del espejo, ${fs > 0 ? 'delante' : 'detrás'})` });
    return { tipo: T.clave, lente: T.lente, fs, s, h, sp, m, hp, real, derecha, tam, enfoque, potencia, radio, pasos };
  }

  const ejemplos = [
    { clave: 'lupa', nombre: 'Lupa: objeto dentro del foco', sc: { tipo: 'convergente', f: '10', s: '6', h: '2' } },
    { clave: 'proyector', nombre: 'Lente convergente: imagen real invertida', sc: { tipo: 'convergente', f: '10', s: '30', h: '2' } },
    { clave: 'mirilla', nombre: 'Lente divergente (mirilla)', sc: { tipo: 'divergente', f: '15', s: '40', h: '4' } },
    { clave: 'afeitado', nombre: 'Espejo de afeitar (cóncavo)', sc: { tipo: 'concavo', f: '40', s: '15', h: '3' } },
    { clave: 'maquillaje', nombre: 'Espejo cóncavo: imagen real', sc: { tipo: 'concavo', f: '20', s: '50', h: '5' } },
    { clave: 'retrovisor', nombre: 'Retrovisor (espejo convexo)', sc: { tipo: 'convexo', f: '30', s: '200', h: '150' } },
  ];

  return { resolver, ejemplos, f, TIPOS };
})();
if (typeof module !== 'undefined') module.exports = Optica;
