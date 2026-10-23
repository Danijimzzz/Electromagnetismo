/* =====================================================================
   Ejercicios de ejemplo de magnetostática, con enunciados propios.
   ===================================================================== */
const MagEjemplos = (() => {
  const v = (x, y, z) => [String(x), String(y), String(z)];
  const lista = [
    {
      clave: 'dos-hilos', titulo: 'Dos hilos paralelos con corrientes opuestas',
      enunciado: 'Dos hilos rectilíneos e indefinidos, paralelos al eje Z, pasan por (−a, 0) y (a, 0) y llevan la misma corriente I en sentidos opuestos (+Z el primero). Calcular el campo magnético en el origen y en el punto (0, a, 0), y la fuerza por unidad de longitud entre los hilos.',
      escena: () => ({
        fuentes: [
          { id: 'h1', tipo: 'hilo', nombre: 'Hilo 1', I: '1', s: 'I', A: v(-1, 0, 0), u: v(0, 0, 1) },
          { id: 'h2', tipo: 'hilo', nombre: 'Hilo 2', I: '1', s: 'I', A: v(1, 0, 0), u: v(0, 0, -1) },
        ],
        preguntas: [{ tipo: 'B', P: v(0, 0, 0) }, { tipo: 'B', P: v(0, 1, 0) }, { tipo: 'Fhilo', fuente: 'h2' }],
        vista: { plano: 'xy', corte: '0' },
      }),
    },
    {
      clave: 'espira', titulo: 'Espira circular: campo en el eje',
      enunciado: 'Una espira circular de radio a, en el plano XY y centrada en el origen, lleva una corriente I en sentido antihorario visto desde +Z. Calcular el campo magnético en el centro y en el punto (0, 0, a) del eje.',
      escena: () => ({
        fuentes: [{ tipo: 'espira', nombre: 'Espira', I: '1', s: 'I', C: v(0, 0, 0), plano: 'xy', R: '1', sentido: 1 }],
        preguntas: [{ tipo: 'B', P: v(0, 0, 0) }, { tipo: 'B', P: v(0, 0, 1) }],
        vista: { plano: 'xz', corte: '0' },
      }),
    },
    {
      clave: 'cuadrada', titulo: 'Espira cuadrada de lado 2a',
      enunciado: 'Una espira cuadrada de lado 2a está en el plano XY con centro en el origen y lados paralelos a los ejes. Recorre una corriente I en sentido antihorario visto desde +Z. Calcular el campo magnético en el centro y en el punto (0, 0, a).',
      escena: () => {
        const c = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
        return {
          fuentes: c.map((p, i) => ({ tipo: 'segmento', nombre: `Lado ${i + 1}`, I: '1', s: 'I', A: v(p[0], p[1], 0), B: v(c[(i + 1) % 4][0], c[(i + 1) % 4][1], 0) })),
          preguntas: [{ tipo: 'B', P: v(0, 0, 0) }, { tipo: 'B', P: v(0, 0, 1) }],
          vista: { plano: 'xy', corte: '0' },
        };
      },
    },
    {
      clave: 'horquilla', titulo: 'Horquilla: semicircunferencia y dos hilos',
      enunciado: 'Un conductor está formado por un hilo semiinfinito que llega por y = a desde x = +∞, una semicircunferencia de radio a centrada en el origen (por el lado x < 0) y otro hilo semiinfinito que sale por y = −a hacia x = +∞. Si la corriente es I, calcular el campo magnético en el centro de la semicircunferencia.',
      escena: () => ({
        fuentes: [
          { tipo: 'semi', nombre: 'Hilo de entrada', I: '1', s: 'I', A: v(0, 1, 0), u: v(1, 0, 0), sentido: -1 },
          { tipo: 'arco', nombre: 'Semicircunferencia', I: '1', s: 'I', C: v(0, 0, 0), plano: 'xy', R: '1', t1: '90', t2: '270' },
          { tipo: 'semi', nombre: 'Hilo de salida', I: '1', s: 'I', A: v(0, -1, 0), u: v(1, 0, 0), sentido: 1 },
        ],
        preguntas: [{ tipo: 'B', P: v(0, 0, 0) }],
        vista: { plano: 'xy', corte: '0' },
      }),
    },
    {
      clave: 'solenoide', titulo: 'Solenoide finito: centro y extremo',
      enunciado: 'Un solenoide de radio a y longitud 4a tiene 200 espiras por las que circula una corriente I. Su eje es el eje Z y está centrado en el origen. Calcular el campo en el centro y en el centro de una de sus bases, y compararlo con el de un solenoide ideal.',
      escena: () => ({
        fuentes: [{ tipo: 'solenoide', nombre: 'Solenoide', I: '1', s: 'I', C: v(0, 0, 0), eje: 'z', R: '1', L: '4', N: '200', sentido: 1, ideal: false }],
        preguntas: [{ tipo: 'B', P: v(0, 0, 0) }, { tipo: 'B', P: v(0, 0, 2) }],
        vista: { plano: 'xz', corte: '0' },
      }),
    },
    {
      clave: 'toroide', titulo: 'Toroide de sección circular',
      enunciado: 'Un toroide con 300 espiras tiene radio interior 2a y exterior 4a, en el plano XY y centrado en el origen. Por él circula una corriente I. Calcular el campo magnético en (3a, 0, 0), dentro del núcleo, y en el centro del toroide.',
      escena: () => ({
        fuentes: [{ tipo: 'toroide', nombre: 'Toroide', I: '1', s: 'I', C: v(0, 0, 0), plano: 'xy', R1: '2', R2: '4', N: '300', sentido: 1 }],
        preguntas: [{ tipo: 'B', P: v(3, 0, 0) }, { tipo: 'B', P: v(0, 0, 0) }],
        vista: { plano: 'xy', corte: '0' },
      }),
    },
    {
      clave: 'carga', titulo: 'Carga que se mueve junto a un hilo',
      enunciado: 'Por el eje Z circula una corriente I en sentido +Z. Una carga q pasa por el punto (2a, 0, 0) con velocidad v paralela al hilo y en el mismo sentido de la corriente. Calcular la fuerza magnética sobre la carga.',
      escena: () => ({
        fuentes: [{ tipo: 'hilo', nombre: 'Hilo', I: '1', s: 'I', A: v(0, 0, 0), u: v(0, 0, 1) }],
        preguntas: [{ tipo: 'Fq', P: v(2, 0, 0), q: '1', qs: 'q', v: v(0, 0, 1), vs: 'v' }],
        vista: { plano: 'xy', corte: '0' },
      }),
    },
    {
      clave: 'hilo-segmento', titulo: 'Hilo y varilla perpendicular',
      enunciado: 'Un hilo indefinido a lo largo del eje Z lleva una corriente I₁ en sentido +Z. Una varilla conductora va de (a, 0, 0) a (3a, 0, 0) y lleva una corriente I₂ hacia +X. Calcular la fuerza magnética que el hilo ejerce sobre la varilla.',
      escena: () => ({
        fuentes: [
          { id: 'h', tipo: 'hilo', nombre: 'Hilo', I: '1', s: 'I1', A: v(0, 0, 0), u: v(0, 0, 1) },
          { id: 's', tipo: 'segmento', nombre: 'Varilla', I: '1', s: 'I2', A: v(1, 0, 0), B: v(3, 0, 0) },
        ],
        preguntas: [{ tipo: 'Fhilo', fuente: 's' }],
        vista: { plano: 'xy', corte: '0' },
      }),
    },
  ];
  return { lista };
})();
if (typeof module !== 'undefined') module.exports = MagEjemplos;
