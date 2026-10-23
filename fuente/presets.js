/* =====================================================================
   Ejercicios de ejemplo precargados (enunciados propios del simulador).
   Cubren los mismos tipos de pregunta que el Tema 3; la versión privada
   cambia este archivo por privado/tema3-pdf.js (ver fuente/build.sh).
   ===================================================================== */
const Presets = (() => {
  let n = 0;
  const id = () => 'k' + ++n;
  const S = (type, name, extra, c = '1', sym) => ({ id: id(), type, name, ...extra, s: { c, sym } });
  const A = (type, extra) => ({ id: id(), type, ...extra });
  const scen = (o) => ({ unit: 'a', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, ...o });

  const list = [
    {
      key: 'p1', statement: "Cuatro partículas con la misma carga q están en los vértices de un cuadrado de lado 2a en el plano XY, en (±a, ±a, 0). Determinar: 1) la energía electrostática del sistema; 2) el campo eléctrico en cualquier punto del eje Z; 3) el momento de fuerzas sobre un dipolo p = b(u_x + u_y + u_z), que solo puede rotar, colocado en (0, 0, a).", title: '1 · Cuadrado de cuatro cargas',
      make: () => scen({
        view: { plane: 'xz', cut: '0' },
        sources: [S('point', 'q1', { pos: ['1', '1', '0'] }, '1', 'q'), S('point', 'q2', { pos: ['-1', '1', '0'] }, '1', 'q'), S('point', 'q3', { pos: ['-1', '-1', '0'] }, '1', 'q'), S('point', 'q4', { pos: ['1', '-1', '0'] }, '1', 'q')],
        analyses: [A('energy', {}), A('profile', { P0: ['0', '0', '0'], d: ['0', '0', '1'], var: 'z', t0: '-4', t1: '4', at: '' }), A('dipole', { P: ['0', '0', '1'], p: ['1', '1', '1'], sym: 'b', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'p2', statement: "Tres cargas puntuales q1 = 2q, q2 = −q y q3 = q están en los vértices de un triángulo rectángulo: q1 en el origen, q2 en (3a, 0) y q3 en (0, 4a). Obtener: 1) la energía electrostática del sistema; 2) la energía potencial de un dipolo p = p0(3u_x + 4u_y) situado en (3a, 4a).", title: '2 · Triángulo rectángulo de cargas',
      make: () => scen({
        sources: [S('point', 'q1', { pos: ['0', '0', '0'] }, '2', 'q'), S('point', 'q2', { pos: ['3', '0', '0'] }, '-1', 'q'), S('point', 'q3', { pos: ['0', '4', '0'] }, '1', 'q')],
        analyses: [A('energy', {}), A('dipole', { P: ['3', '4', '0'], p: ['3', '4', '0'], sym: 'p0', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'p3', statement: "Una carga q1 = −2q0 está en (0, 2a) y una segunda carga q2, desconocida, en (3a, 0). Un dipolo p = p0(1/2 u_x + √3/2 u_y), que solo puede rotar y está en el origen, se encuentra en equilibrio. Determinar: 1) el valor de q2; 2) si el equilibrio es estable o inestable; 3) el trabajo de un agente externo para colocar el dipolo paralelo a +u_y.", title: '3 · Dipolo en equilibrio a 60°',
      make: () => {
        const q2 = S('point', 'q2', { pos: ['3', '0', '0'] }, '1', 'q0');
        return scen({
          order: ['q0', 'p0'],
          sources: [S('point', 'q1', { pos: ['0', '2', '0'] }, '-2', 'q0'), q2],
          unknown: { src: q2.id, cond: { type: 'Epar', P: ['0', '0', '0'], d: ['1/2', 'sqrt(3)/2', '0'] } },
          analyses: [A('dipole', { P: ['0', '0', '0'], p: ['1/2', 'sqrt(3)/2', '0'], sym: 'p0', rot: ['0', '1', '0'] })],
        });
      },
    },
    {
      key: 'p4', statement: "Un plano uniformemente cargado coincide con el plano XZ. Dos hilos indefinidos paralelos al eje Z cortan al plano XY en (3a, 4a), con λ1 = 2λ, y en (−3a, 4a), con λ2 = −λ. Obtener la densidad de carga del plano sabiendo que un dipolo situado en (0, a, 0) estaría en equilibrio orientado según u_x, y el campo eléctrico en ese punto.", title: '4 · Plano XZ y dos hilos',
      make: () => {
        const pl = S('plane', 'σ', { axis: 'y', at: '0' }, '1', 'sigma');
        return scen({
          sources: [pl, S('line', 'λ1', { pos: ['3', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '2', 'lambda'), S('line', 'λ2', { pos: ['-3', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '-1', 'lambda')],
          unknown: { src: pl.id, cond: { type: 'Epar', P: ['0', '1', '0'], d: ['1', '0', '0'] } },
          analyses: [A('E', { P: ['0', '1', '0'] })],
        });
      },
    },
    {
      key: 'p5', statement: "Un cilindro indefinido de radio 2a, uniformemente cargado y coaxial con el eje Z, y un plano cargado con densidad σ en y = −5a. Si en (4a, 3a, 0) se situara una carga puntual, la fuerza sería paralela al eje X. Determinar: 1) la densidad volumétrica de carga del cilindro; 2) V_B − V_A entre A(0, a, 0) y B(0, 3a, 0).", title: '5 · Cilindro grueso y plano',
      make: () => {
        const cyl = S('line', 'ρ', { pos: ['0', '0', '0'], dir: 'z', mode: 'rho', R: '2' }, '1', 'rho');
        return scen({
          sources: [cyl, S('plane', 'σ', { axis: 'y', at: '-5' }, '1', 'sigma')],
          unknown: { src: cyl.id, cond: { type: 'Epar', P: ['4', '3', '0'], d: ['1', '0', '0'] } },
          analyses: [A('E', { P: ['4', '3', '0'] }), A('dV', { A: ['0', '1', '0'], B: ['0', '3', '0'] })],
        });
      },
    },
    {
      key: 'p6', statement: "Una carga puntual q está en el origen y una esfera de radio a, uniformemente cargada, tiene su centro en (2a, 0, 0). Si el potencial en (3a, 0, 0) es q/(3πε0a), determinar la densidad de carga de la esfera y la energía potencial de un dipolo p = p(u_x + u_y) situado en (2a, 2a, 0).", title: '6 · Esfera desplazada y carga puntual',
      make: () => {
        const sph = S('sphere', 'ρ', { pos: ['2', '0', '0'], R1: '0', R2: '1' }, '1', 'rho');
        return scen({
          sources: [S('point', 'q', { pos: ['0', '0', '0'] }, '1', 'q'), sph],
          unknown: { src: sph.id, cond: { type: 'V', P: ['3', '0', '0'], val: { c: '1/(3*pi)', sym: 'q' } } },
          analyses: [A('dipole', { P: ['2', '2', '0'], p: ['1', '1', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'p7', statement: "Un hilo indefinido con densidad λ, paralelo al eje X, pasa por (0, 6a, 0). Determinar la carga que debe situarse en (0, −3a, 0) para que un dipolo p = p u_x, situado en (4a, 0, 0) y que solo puede rotar, permanezca en equilibrio. Justificar si el equilibrio es estable o inestable y obtener su energía potencial.", title: '7 · Hilo paralelo a X y carga desconocida',
      make: () => {
        const Q = S('point', 'Q', { pos: ['0', '-3', '0'] }, '1', 'q');
        return scen({
          order: ['p', 'lambda'],
          sources: [S('line', 'λ', { pos: ['0', '6', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda'), Q],
          unknown: { src: Q.id, cond: { type: 'Epar', P: ['4', '0', '0'], d: ['1', '0', '0'] } },
          analyses: [A('dipole', { P: ['4', '0', '0'], p: ['1', '0', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'p8', statement: "Una lámina indefinida de anchura 2b, uniformemente cargada, ocupa la región −b < y < b. Un hilo indefinido con densidad λ, paralelo al eje Z, pasa por (0, 4b, 0). Sabiendo que el campo eléctrico es nulo en la recta x = 0, y = 2b, obtener la densidad de la lámina y V_B − V_A entre A(0, 0, 0) y B(0, 3b, 0).", title: '8 · Lámina gruesa y campo nulo',
      make: () => {
        const sl = S('slab', 'ρ', { axis: 'y', at: '-1', w: '2' }, '1', 'rho');
        return scen({
          unit: 'b',
          sources: [sl, S('line', 'λ', { pos: ['0', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '1', 'lambda')],
          unknown: { src: sl.id, cond: { type: 'Ezero', P: ['0', '2', '0'] } },
          analyses: [A('dV', { A: ['0', '0', '0'], B: ['0', '3', '0'] })],
        });
      },
    },
    {
      key: 'p9', statement: "Dos planos indefinidos, y = 0 con densidad 2σ e y = 2b con densidad −σ, y un hilo indefinido con densidad λ, paralelo al eje X, que pasa por (0, b, 0). Obtener: 1) el campo eléctrico en cualquier punto del plano XY; 2) la relación entre σ y λ para que V_B − V_A sea nula, con A(0, b/2, 0) y B(0, 3b, 0).", title: '9 · Dos planos distintos y un hilo', note: 'Apartado 1: el perfil a lo largo de Y usa λ como símbolo (no depende del apartado 2); en el plano XY el campo solo depende de y.',
      make: () => {
        const ln = S('line', 'λ', { pos: ['0', '1', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda');
        return scen({
          unit: 'b',
          sources: [S('plane', 'σ1', { axis: 'y', at: '0' }, '2', 'sigma'), ln, S('plane', 'σ2', { axis: 'y', at: '2' }, '-1', 'sigma')],
          unknown: { src: ln.id, cond: { type: 'dV', A: ['0', '1/2', '0'], B: ['0', '3', '0'], val: { c: '0', sym: '' } } },
          analyses: [A('profile', { P0: ['0', '0', '0'], d: ['0', '1', '0'], var: 'y', t0: '-1', t1: '4', at: '', unk: 'libre' })],
        });
      },
    },
    {
      key: 'p10', statement: "Una carga puntual Q está en el origen, centro de una corona esférica de radios R y 2R cargada con densidad ρ = 3Q/(28πR³). Obtener el trabajo realizado en contra del campo para desplazar una carga q desde (R/2, 0, 0) hasta (3R, 0, 0).", title: '10 · Carga dentro de una corona esférica',
      make: () => scen({
        unit: 'R', order: ['q', 'Q'],
        sources: [S('point', 'Q', { pos: ['0', '0', '0'] }, '1', 'Q'), S('sphere', 'ρ', { pos: ['0', '0', '0'], R1: '1', R2: '2' }, '3/(28*pi)', 'Q')],
        analyses: [A('work', { A: ['1/2', '0', '0'], B: ['3', '0', '0'], Q: { c: '1', sym: 'q' } })],
      }),
    },
    {
      key: 'p11', statement: "Un hilo indefinido con densidad λ está sobre el eje X. En (a, 2a, 0) se coloca un dipolo contenido en el plano XY que solo puede rotar; inicialmente su energía potencial es −bλ/(πaε0) y sobre él actúa un momento 3bλ/(4πaε0) u_z. 1) Determinar el momento dipolar inicial. Con el dipolo ya en equilibrio estable: 2) el campo en A(a, 4a, 0); 3) la diferencia de potencial entre A y B(a, 6a, 0).", title: '11 · Hilo en el eje X y dipolo',
      note: 'El dipolo fuente ya está en su posición de equilibrio estable (p = 5b, en la dirección +Y). Bórralo para ver solo el apartado 1.',
      make: () => scen({
        sources: [S('line', 'λ', { pos: ['0', '0', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda'), S('dipole', 'p', { pos: ['1', '2', '0'], p: ['0', '5', '0'] }, '1', 'b')],
        analyses: [
          A('findDipole', { P: ['1', '2', '0'], sym: 'b', tau: ['0', '0', '3/(4*pi)'], U: '-1/pi', plane: 'z' }),
          A('E', { P: ['1', '4', '0'] }), A('dV', { A: ['1', '4', '0'], B: ['1', '6', '0'], sense: 'AB' }),
        ],
      }),
    },
    {
      key: 'p12', statement: "Una varilla de longitud 4a con densidad λ está en el plano XY, sobre la recta y = 3a, de x = 0 a x = 4a. 1) Campo eléctrico en el origen. 2) En el origen se coloca un dipolo contenido en el plano YZ: obtener p si el momento de fuerzas es p0λ/(30πε0a)(2u_x − u_y + 3u_z).", title: '12 · Varilla finita y dipolo en YZ',
      make: () => scen({
        sources: [S('rod', 'λ', { A: ['0', '3', '0'], B: ['4', '3', '0'] }, '1', 'lambda')],
        analyses: [A('E', { P: ['0', '0', '0'] }), A('findDipole', { P: ['0', '0', '0'], sym: 'p0', tau: ['1/(15*pi)', '-1/(30*pi)', '1/(10*pi)'], U: '', plane: 'x' })],
      }),
    },
  ];
  return { section: 'Ejercicios de ejemplo', list, newId: id };
})();
if (typeof module !== 'undefined') module.exports = Presets;
