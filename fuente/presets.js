/* =====================================================================
   Ejercicios del Tema 3 precargados (geometría tomada de las figuras).
   ===================================================================== */
const Presets = (() => {
  let n = 0;
  const id = () => 'k' + ++n;
  const S = (type, name, extra, c = '1', sym) => ({ id: id(), type, name, ...extra, s: { c, sym } });
  const A = (type, extra) => ({ id: id(), type, ...extra });
  const scen = (o) => ({ unit: 'a', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, ...o });

  const list = [
    {
      key: 'e1', statement: "Tres partículas con la misma carga q están en los vértices de un triángulo equilátero de lado 2a: dos en (−a, 0, 0) y (a, 0, 0) y la tercera sobre el semieje Z positivo. Determinar: 1) la energía electrostática del sistema; 2) el campo eléctrico en cualquier punto del eje Z; 3) el momento de fuerzas sobre un dipolo p = b(u_x − 2u_y + 4u_z), que solo puede rotar, colocado en el origen.", title: '1 · Triángulo equilátero de cargas', note: 'Apartado 2: el perfil da E en cualquier punto del eje Z, por tramos a cada lado de q3.',
      make: () => scen({
        view: { plane: 'xz', cut: '0' },
        sources: [S('point', 'q1', { pos: ['-1', '0', '0'] }, '1', 'q'), S('point', 'q2', { pos: ['1', '0', '0'] }, '1', 'q'), S('point', 'q3', { pos: ['0', '0', 'sqrt(3)'] }, '1', 'q')],
        analyses: [A('energy', {}), A('profile', { P0: ['0', '0', '0'], d: ['0', '0', '1'], var: 'z', t0: '-4', t1: '4', at: '' }), A('dipole', { P: ['0', '0', '0'], p: ['1', '-2', '4'], sym: 'b', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'e2', statement: "Tres cargas puntuales q1 = q, q2 = −2q y q3 = −q están situadas como indica la figura (q1 en el origen, q2 en (4a, 0), q3 en (4a, 3a)). Obtener: 1) la energía electrostática del sistema; 2) la energía potencial de un dipolo p = p0(16u_x − 9u_y) situado en (0, 3a).", title: '2 · Tres cargas y un dipolo',
      make: () => scen({
        sources: [S('point', 'q1', { pos: ['0', '0', '0'] }, '1', 'q'), S('point', 'q2', { pos: ['4', '0', '0'] }, '-2', 'q'), S('point', 'q3', { pos: ['4', '3', '0'] }, '-1', 'q')],
        analyses: [A('energy', {}), A('dipole', { P: ['0', '3', '0'], p: ['16', '-9', '0'], sym: 'p0', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'e3', statement: "Una carga q1 = −q0 está en (a, −a√3) y una segunda carga q2, desconocida, en (−3a, 0). Un dipolo p = p0(√3/2 u_x + 1/2 u_y), que solo puede rotar y está en el origen, se encuentra en equilibrio. Determinar: 1) el valor de q2; 2) si el equilibrio es estable o inestable; 3) el trabajo de un agente externo para colocar el dipolo paralelo a +u_x.", title: '3 · Carga desconocida y dipolo en equilibrio',
      make: () => {
        const q2 = S('point', 'q2', { pos: ['-3', '0', '0'] }, '1', 'q0');
        return scen({
          order: ['q0', 'p0'],
          sources: [S('point', 'q1', { pos: ['1', '-sqrt(3)', '0'] }, '-1', 'q0'), q2],
          unknown: { src: q2.id, cond: { type: 'Epar', P: ['0', '0', '0'], d: ['sqrt(3)/2', '1/2', '0'] } },
          analyses: [A('dipole', { P: ['0', '0', '0'], p: ['sqrt(3)/2', '1/2', '0'], sym: 'p0', rot: ['1', '0', '0'] })],
        });
      },
    },
    {
      key: 'e4', statement: "Un plano uniformemente cargado que coincide con el plano YZ y dos hilos indefinidos paralelos al eje Z, con λ1 = 5λ/2 y λ2 = −4λ, se sitúan como indica la figura. Obtener la densidad de carga del plano sabiendo que un dipolo situado en (a, 0, 0) estaría en equilibrio orientado según u_y.", title: '4 · Plano YZ y dos hilos',
      make: () => {
        const pl = S('plane', 'σ', { axis: 'x', at: '0' }, '1', 'sigma');
        return scen({
          sources: [pl, S('line', 'λ1', { pos: ['7', '8', '0'], dir: 'z', mode: 'lambda', R: '1' }, '5/2', 'lambda'), S('line', 'λ2', { pos: ['7', '2*sqrt(7)', '0'], dir: 'z', mode: 'lambda', R: '1' }, '-4', 'lambda')],
          unknown: { src: pl.id, cond: { type: 'Epar', P: ['1', '0', '0'], d: ['0', '1', '0'] } },
          analyses: [A('E', { P: ['1', '0', '0'] })],
        });
      },
    },
    {
      key: 'e5', statement: "Un hilo indefinido de radio a, uniformemente cargado y coaxial con el eje Z, y un plano cargado con densidad σ en x = 4a. Si en (2a, 2a√3, 0) se situara una carga puntual, la fuerza sería paralela al eje Y. Determinar: 1) la densidad volumétrica de carga del hilo; 2) V_B − V_A entre B(0, 2a, 0) y A(0, a/2, 0).", title: '5 · Cilindro cargado y plano',
      make: () => {
        const cyl = S('line', 'ρ', { pos: ['0', '0', '0'], dir: 'z', mode: 'rho', R: '1' }, '1', 'rho');
        return scen({
          sources: [cyl, S('plane', 'σ', { axis: 'x', at: '4' }, '1', 'sigma')],
          unknown: { src: cyl.id, cond: { type: 'Epar', P: ['2', '2*sqrt(3)', '0'], d: ['0', '1', '0'] } },
          analyses: [A('E', { P: ['2', '2*sqrt(3)', '0'] }), A('dV', { A: ['0', '1/2', '0'], B: ['0', '2', '0'] })],
        });
      },
    },
    {
      key: 'e6', statement: "Una carga puntual q y una esfera de radio a uniformemente cargada se sitúan como indica la figura. Si el potencial en (a/2, 0, 0) es 115q/(96πε0a), determinar la energía potencial de un dipolo p = p(u_x − u_y) situado en (−a√2, 0, 0).", title: '6 · Esfera cargada y carga puntual',
      make: () => {
        const sph = S('sphere', 'ρ', { pos: ['0', '0', '0'], R1: '0', R2: '1' }, '1', 'rho');
        return scen({
          sources: [S('point', 'q', { pos: ['0', 'sqrt(2)', '0'] }, '1', 'q'), sph],
          unknown: { src: sph.id, cond: { type: 'V', P: ['1/2', '0', '0'], val: { c: '115/(96*pi)', sym: 'q' } } },
          analyses: [A('dipole', { P: ['-sqrt(2)', '0', '0'], p: ['1', '-1', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'e7', statement: "Un hilo indefinido con densidad λ, paralelo al eje Z, se sitúa como muestra la figura. Determinar la carga que debe situarse en (−6a, 0, 0) para que un dipolo p = p u_y, situado en (0, 8a, 0) y que solo puede rotar, permanezca en equilibrio. Justificar si el equilibrio es estable o inestable y obtener su energía potencial.", title: '7 · Hilo, carga desconocida y dipolo',
      make: () => {
        const Q = S('point', 'Q', { pos: ['-6', '0', '0'] }, '1', 'q');
        return scen({
          order: ['p', 'lambda'],
          sources: [S('line', 'λ', { pos: ['24', '1', '0'], dir: 'z', mode: 'lambda', R: '1' }, '1', 'lambda'), Q],
          unknown: { src: Q.id, cond: { type: 'Epar', P: ['0', '8', '0'], d: ['0', '1', '0'] } },
          analyses: [A('dipole', { P: ['0', '8', '0'], p: ['0', '1', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'e8', statement: "Una lámina indefinida de anchura 4b, uniformemente cargada, y un hilo indefinido con densidad λ, situado en el plano XY, se disponen como en la figura. Sabiendo que el campo eléctrico es nulo en el eje Y, obtener V_B − V_A entre A(−3b, b, 0) y B(4b, 0, 0).", title: '8 · Lámina gruesa e hilo',
      make: () => {
        const sl = S('slab', 'ρ', { axis: 'x', at: '-4', w: '4' }, '1', 'rho');
        return scen({
          unit: 'b',
          sources: [sl, S('line', 'λ', { pos: ['5', '0', '0'], dir: 'y', mode: 'lambda', R: '1' }, '1', 'lambda')],
          unknown: { src: sl.id, cond: { type: 'Ezero', P: ['0', '1', '0'] } },
          analyses: [A('dV', { A: ['-3', '1', '0'], B: ['4', '0', '0'] })],
        });
      },
    },
    {
      key: 'e9', statement: "Dos planos indefinidos con densidades σ y −σ y un hilo indefinido con densidad λ están situados como en la figura. Obtener: 1) el campo eléctrico en cualquier punto del plano XY; 2) la relación entre σ y λ para que V_B − V_A sea nula.", title: '9 · Dos planos y un hilo', note: 'Apartado 1: el perfil a lo largo de X usa λ como símbolo (no depende del apartado 2); en el plano XY el campo solo depende de x.',
      make: () => {
        const ln = S('line', 'λ', { pos: ['1', '0', '0'], dir: 'y', mode: 'lambda', R: '1' }, '1', 'lambda');
        return scen({
          unit: 'b',
          sources: [S('plane', 'σ1', { axis: 'x', at: '0' }, '1', 'sigma'), ln, S('plane', 'σ2', { axis: 'x', at: '2' }, '-1', 'sigma')],
          unknown: { src: ln.id, cond: { type: 'dV', A: ['4/3', '1', '0'], B: ['5/3', '1', '0'], val: { c: '0', sym: '' } } },
          analyses: [A('profile', { P0: ['0', '0', '0'], d: ['1', '0', '0'], var: 'x', t0: '-1', t1: '3', at: '', unk: 'libre' })],
        });
      },
    },
    {
      key: 'e10', statement: "Un dipolo p = p0 u_x está en el origen, centro de una corona esférica de radios R y 3R cargada con densidad ρ = 3p0/(16πR⁴). Obtener el trabajo realizado en contra del campo para desplazar una carga q desde (R/2, 0, 0) hasta (2R, 0, 0).", title: '10 · Dipolo dentro de una corona esférica',
      make: () => scen({
        unit: 'R', kinds: { p0: 'p' }, order: ['q', 'p0'],
        sources: [S('dipole', 'p', { pos: ['0', '0', '0'], p: ['1', '0', '0'] }, '1', 'p0'), S('sphere', 'ρ', { pos: ['0', '0', '0'], R1: '1', R2: '3' }, '3/(16*pi)', 'p0')],
        analyses: [A('work', { A: ['1/2', '0', '0'], B: ['2', '0', '0'], Q: { c: '1', sym: 'q' } })],
      }),
    },
    {
      key: 'e11', statement: "Un hilo indefinido con densidad λ está sobre el eje Y. En (a, a√3, 0) se coloca un dipolo que solo puede rotar; inicialmente su energía potencial es −bλ√3/(πaε0) y sobre él actúa un momento bλ/(πaε0)(−u_z). 1) Determinar el momento dipolar inicial. Con el dipolo ya en equilibrio estable: 2) el campo en A(a, 0, 0); 3) la diferencia de potencial entre A y B(2a, 0, 0).", title: '11 · Hilo en el eje Y y dipolo',
      note: 'El dipolo fuente ya está en su posición de equilibrio estable (p = 4b, en la dirección +X). Bórralo para ver solo el apartado 1.',
      make: () => scen({
        sources: [S('line', 'λ', { pos: ['0', '0', '0'], dir: 'y', mode: 'lambda', R: '1' }, '1', 'lambda'), S('dipole', 'p', { pos: ['1', 'sqrt(3)', '0'], p: ['4', '0', '0'] }, '1', 'b')],
        analyses: [
          A('findDipole', { P: ['1', 'sqrt(3)', '0'], sym: 'b', tau: ['0', '0', '-1/pi'], U: '-sqrt(3)/pi', plane: 'z' }),
          A('E', { P: ['1', '0', '0'] }), A('dV', { A: ['1', '0', '0'], B: ['2', '0', '0'], sense: 'AB' }),
        ],
      }),
    },
    {
      key: 'e12', statement: "Una varilla de longitud 3a con densidad λ está en el plano XY como en la figura (en x = 4a, de y = 0 a y = 3a). 1) Campo eléctrico en el origen. 2) En el origen se coloca un dipolo contenido en el plano XZ: obtener p si el momento de fuerzas es p0λ/(πε0a√20)(−2u_x + 6u_y − u_z).", title: '12 · Varilla finita y dipolo en XZ',
      make: () => scen({
        sources: [S('rod', 'λ', { A: ['4', '0', '0'], B: ['4', '3', '0'] }, '1', 'lambda')],
        analyses: [A('E', { P: ['0', '0', '0'] }), A('findDipole', { P: ['0', '0', '0'], sym: 'p0', tau: ['-2/(pi*sqrt(20))', '6/(pi*sqrt(20))', '-1/(pi*sqrt(20))'], U: '', plane: 'y' })],
      }),
    },
  ];
  return { list, newId: id };
})();
if (typeof module !== 'undefined') module.exports = Presets;
