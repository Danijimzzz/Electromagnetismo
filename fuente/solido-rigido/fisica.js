/* =====================================================================
   Sólido rígido (sin DOM): momentos de inercia con el teorema de Steiner,
   rodadura sin deslizar por un plano inclinado, polea con masa de la que
   cuelga un cuerpo, y conservación del momento angular.
   Masas en kg, longitudes en m, ángulos en grados, ω en rad/s o rpm.
   ===================================================================== */
const Solido = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  function lee(sc, k, nom, { opcional = false, cero = false, max = Infinity } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    if (v > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no puede pasar de ${f(max)}`);
    return v;
  }

  /* ---------- Cuerpos: I respecto a un eje por el centro de masas ---------- */
  // k = I/(M·L²) con L la medida que se indica; rueda: puede rodar
  const CUERPOS = {
    'esfera': { nombre: 'Esfera maciza', k: 2 / 5, kTxt: '2/5', formula: '(2/5)MR<sup>2</sup>', med: 'R', medNom: 'Radio R', rueda: true, eje: 'un diámetro' },
    'esfera-hueca': { nombre: 'Esfera hueca (corteza)', k: 2 / 3, kTxt: '2/3', formula: '(2/3)MR<sup>2</sup>', med: 'R', medNom: 'Radio R', rueda: true, eje: 'un diámetro' },
    'cilindro': { nombre: 'Cilindro macizo o disco', k: 1 / 2, kTxt: '1/2', formula: '(1/2)MR<sup>2</sup>', med: 'R', medNom: 'Radio R', rueda: true, eje: 'su eje' },
    'aro': { nombre: 'Aro o cilindro hueco delgado', k: 1, kTxt: '1', formula: 'MR<sup>2</sup>', med: 'R', medNom: 'Radio R', rueda: true, eje: 'su eje' },
    'varilla': { nombre: 'Varilla delgada', k: 1 / 12, kTxt: '1/12', formula: '(1/12)ML<sup>2</sup>', med: 'L', medNom: 'Longitud L', rueda: false, eje: 'perpendicular por el centro' },
    'placa': { nombre: 'Placa rectangular (a × b)', placa: true, formula: '(1/12)M(a<sup>2</sup> + b<sup>2</sup>)', med: 'a', medNom: 'Lado a', rueda: false, eje: 'perpendicular por el centro' },
    'disco-diametro': { nombre: 'Disco (eje por un diámetro)', k: 1 / 4, kTxt: '1/4', formula: '(1/4)MR<sup>2</sup>', med: 'R', medNom: 'Radio R', rueda: false, eje: 'un diámetro' },
  };

  function inercia(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.esfera;
    const M = lee(sc, 'M', 'la masa'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'la distancia del eje al centro de masas', { opcional: true, cero: true }) ?? 0;
    let Icm, h;
    if (C.placa) {
      const b = lee(sc, 'b', 'el lado b');
      Icm = (M * (L * L + b * b)) / 12;
      h = `I<sub>cm</sub> = (1/12)M(a<sup>2</sup> + b<sup>2</sup>) = (1/12)·${f(M)}·(${f(L)}<sup>2</sup> + ${f(b)}<sup>2</sup>) = <b>${f(Icm)} kg·m<sup>2</sup></b>`;
    } else {
      Icm = C.k * M * L * L;
      h = `I<sub>cm</sub> = ${C.formula} = ${C.kTxt === '1' ? '' : `(${C.kTxt})·`}${f(M)}·${f(L)}<sup>2</sup> = <b>${f(Icm)} kg·m<sup>2</sup></b>`;
    }
    const pasos = [{ t: `Momento de inercia respecto a un eje por el centro de masas (${C.eje})`, html: h }];
    const I = Icm + M * d * d;
    if (d) pasos.push({ t: 'Teorema de Steiner (ejes paralelos)', html: `I = I<sub>cm</sub> + Md<sup>2</sup> = ${f(Icm)} + ${f(M)}·${f(d)}<sup>2</sup> = <b>${f(I)} kg·m<sup>2</sup></b>${sc.cuerpo === 'varilla' && Math.abs(d - L / 2) < 1e-12 ? ' (por un extremo: (1/3)ML<sup>2</sup>)' : ''}` });
    pasos.push({ t: 'Radio de giro', html: `k = √(I/M) = √(${f(I)}/${f(M)}) = <b>${f(Math.sqrt(I / M))} m</b>: es la distancia a la que habría que concentrar toda la masa para tener el mismo I.` });
    return { modo: 'inercia', C, M, L, d, Icm, I, pasos };
  }

  /* ---------- Rodadura por un plano inclinado ---------- */
  // sc: { cuerpo (que rueda), M, R, theta, d (m a lo largo del plano), mu (opcional), g }
  function rodadura(sc) {
    const C = CUERPOS[sc.cuerpo];
    if (!C || !C.rueda) throw new Error('Para rodar elige una esfera, un cilindro o un aro');
    const g = lee(sc, 'g', 'la gravedad'), M = lee(sc, 'M', 'la masa'), R = lee(sc, 'L', 'el radio'), th = lee(sc, 'theta', 'el ángulo del plano', { max: 89.9 }), d = lee(sc, 'd', 'la distancia recorrida');
    const mu = lee(sc, 'mu', 'el coeficiente de rozamiento estático', { opcional: true, cero: true });
    const t = th * RAD, k = C.k, a = (g * Math.sin(t)) / (1 + k), Fr = k * M * a, h = d * Math.sin(t), v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const muMin = Math.tan(t) * k / (1 + k), N = M * g * Math.cos(t);
    const Krot = 0.5 * k * M * v * v, Ktras = 0.5 * M * v * v;
    const pasos = [
      { t: 'Momento de inercia', html: `${C.nombre}: I = ${C.formula} = <b>${f(k * M * R * R)} kg·m<sup>2</sup></b>, es decir I/(MR<sup>2</sup>) = ${C.kTxt}` },
      { t: 'Ecuaciones del movimiento (rueda sin deslizar: a = αR)', html: `Traslación: Mg sen θ − F<sub>r</sub> = Ma<br>Rotación respecto al centro: F<sub>r</sub>R = Iα = I a/R ⇒ F<sub>r</sub> = Ia/R<sup>2</sup><br>Sumando: Mg sen θ = (M + I/R<sup>2</sup>) a ⇒ a = g sen θ / (1 + I/(MR<sup>2</sup>)) = ${f(g)}·sen ${f(th)}° / (1 + ${C.kTxt}) = <b>${f(a)} m/s<sup>2</sup></b>` },
      { t: 'Rozamiento necesario', html: `F<sub>r</sub> = Ia/R<sup>2</sup> = ${C.kTxt === '1' ? '' : `(${C.kTxt})·`}${f(M)}·${f(a)} = <b>${f(Fr)} N</b> (estático: no hace trabajo, el punto de contacto no se mueve)<br>Para que ruede sin deslizar hace falta μ<sub>e</sub> ≥ F<sub>r</sub>/N = tg θ·(I/MR<sup>2</sup>)/(1 + I/MR<sup>2</sup>) = <b>${f(muMin)}</b>${mu !== null ? `; con μ<sub>e</sub> = ${f(mu)} ${mu >= muMin ? '<b>sí rueda sin deslizar</b>' : '<b>no basta: desliza y gira a la vez</b> (lo de arriba sería si rodara; abajo está lo que pasa de verdad)'}` : ''}` },
      { t: `Por energía, tras recorrer ${f(d)} m (baja h = d sen θ = ${f(h)} m)`, html: `Mgh = ½Mv<sup>2</sup> + ½Iω<sup>2</sup> = ½(M + I/R<sup>2</sup>)v<sup>2</sup> ⇒ v = √(2gh/(1 + I/MR<sup>2</sup>)) = <b>${f(v)} m/s</b>, ω = v/R = ${f(v / R)} rad/s<br>t = √(2d/a) = <b>${f(tt)} s</b>` },
      { t: 'Reparto de la energía cinética', html: `Traslación ½Mv<sup>2</sup> = ${f(Ktras)} J; rotación ½Iω<sup>2</sup> = ${f(Krot)} J (un ${f((100 * k) / (1 + k), 3)} % del total). Cuanto mayor es I/(MR<sup>2</sup>), más energía se va en girar y más despacio baja: la esfera maciza gana a la hueca, al cilindro y al aro, sea cual sea su masa y su radio.` },
    ];
    let desliza = null;
    if (mu !== null && mu < muMin) {
      // rueda y desliza a la vez: el rozamiento es dinámico (tomamos μ_d = μ_e) y la ligadura a = αR ya no vale
      const a2 = g * (Math.sin(t) - mu * Math.cos(t)), I = k * M * R * R, al2 = (mu * N * R) / I, t2 = Math.sqrt((2 * d) / a2), v2 = a2 * t2, w2 = al2 * t2;
      const Q = M * g * h - 0.5 * M * v2 * v2 - 0.5 * I * w2 * w2;
      desliza = { a: a2, al: al2, t: t2, v: v2, w: w2, Q };
      pasos.push({ t: 'Como no basta el rozamiento, desliza mientras gira', html: `Rozamiento dinámico (tomamos μ<sub>d</sub> = μ<sub>e</sub>): F<sub>r</sub> = μN = ${f(mu)}·${f(N)} = ${f(mu * N)} N<br>Traslación: a = g(sen θ − μ cos θ) = <b>${f(a2)} m/s<sup>2</sup></b>; rotación: α = F<sub>r</sub>R/I = <b>${f(al2)} rad/s<sup>2</sup></b>, y αR = ${f(al2 * R)} m/s<sup>2</sup> &lt; a<br>Al final del plano: t = ${f(t2)} s, v = <b>${f(v2)} m/s</b>, ω = ${f(w2)} rad/s (&lt; v/R = ${f(v2 / R)} rad/s); se pierden ${f(Q)} J en calor por el rozamiento.` });
    }
    const carrera = Object.entries(CUERPOS).filter(([, c]) => c.rueda).map(([kk, c]) => ({ k: kk, nombre: c.nombre, a: (g * Math.sin(t)) / (1 + c.k), v: Math.sqrt((2 * g * h) / (1 + c.k)), t: Math.sqrt((2 * d * (1 + c.k)) / (g * Math.sin(t))) }));
    return { modo: 'rodadura', C, g, M, R, th, d, mu, a, Fr, N, v, w: v / R, t: tt, h, muMin, rueda: mu === null || mu >= muMin, desliza, Krot, Ktras, carrera, pasos };
  }

  /* ---------- Polea con masa ---------- */
  // sc: { cuerpo (disco o aro), M (polea), L (R), m (cuelga), d (baja), g }
  function polea(sc) {
    const C = CUERPOS[sc.cuerpo] && CUERPOS[sc.cuerpo].rueda ? CUERPOS[sc.cuerpo] : CUERPOS.cilindro;
    const g = lee(sc, 'g', 'la gravedad'), M = lee(sc, 'M', 'la masa de la polea'), R = lee(sc, 'L', 'el radio de la polea'), m = lee(sc, 'm', 'la masa que cuelga'), d = lee(sc, 'd', 'la altura que baja');
    const I = C.k * M * R * R, a = (m * g) / (m + I / (R * R)), T = m * (g - a), al = a / R, v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const pasos = [
      { t: 'Momento de inercia de la polea', html: `${C.nombre}: I = ${C.formula} = ${C.kTxt === '1' ? '' : `(${C.kTxt})·`}${f(M)}·${f(R)}<sup>2</sup> = <b>${f(I)} kg·m<sup>2</sup></b>` },
      { t: 'Ecuaciones (la cuerda no desliza: a = αR)', html: `Cuerpo que cuelga: mg − T = ma<br>Polea: TR = Iα = I a/R ⇒ T = Ia/R<sup>2</sup><br>Sumando: mg = (m + I/R<sup>2</sup>) a ⇒ a = ${f(m)}·${f(g)} / (${f(m)} + ${f(I / (R * R))}) = <b>${f(a)} m/s<sup>2</sup></b>` },
      { t: 'Tensión y aceleración angular', html: `T = m(g − a) = ${f(m)}·(${f(g)} − ${f(a)}) = <b>${f(T)} N</b> (menor que el peso, ${f(m * g)} N)<br>α = a/R = <b>${f(al)} rad/s<sup>2</sup></b>` },
      { t: `Tras bajar ${f(d)} m`, html: `v = √(2ad) = <b>${f(v)} m/s</b>, ω = v/R = ${f(v / R)} rad/s, t = √(2d/a) = ${f(tt)} s<br>Energía: mgh = ${f(m * g * d)} J = ½mv<sup>2</sup> + ½Iω<sup>2</sup> = ${f(0.5 * m * v * v)} + ${f(0.5 * I * (v / R) ** 2)} J` },
    ];
    return { modo: 'polea', C, g, M, R, m, d, I, a, T, al, v, w: v / R, t: tt, pasos };
  }

  /* ---------- Conservación del momento angular ---------- */
  // sc: { I1, w1, I2, unidad: 'rpm'|'rad' }
  function momento(sc) {
    const I1 = lee(sc, 'I1', 'el momento de inercia inicial'), I2 = lee(sc, 'I2', 'el momento de inercia final'), w1 = lee(sc, 'w1', 'la velocidad angular inicial');
    const rpm = sc.unidad !== 'rad', W1 = rpm ? (w1 * 2 * Math.PI) / 60 : w1, W2 = (I1 * W1) / I2, w2 = rpm ? (W2 * 60) / (2 * Math.PI) : W2;
    const L = I1 * W1, K1 = 0.5 * I1 * W1 * W1, K2 = 0.5 * I2 * W2 * W2, un = rpm ? 'rpm' : 'rad/s';
    const pasos = [
      { t: 'Sin momento de fuerzas exterior, L se conserva', html: `I<sub>1</sub>ω<sub>1</sub> = I<sub>2</sub>ω<sub>2</sub> ⇒ ω<sub>2</sub> = ω<sub>1</sub>·I<sub>1</sub>/I<sub>2</sub> = ${f(w1)}·${f(I1)}/${f(I2)} = <b>${f(w2)} ${un}</b>${rpm ? ` (= ${f(W2)} rad/s)` : ''}` },
      { t: 'Momento angular', html: `L = I<sub>1</sub>ω<sub>1</sub> = ${f(I1)}·${f(W1)} = <b>${f(L)} kg·m<sup>2</sup>/s</b>${rpm ? ` (con ω<sub>1</sub> = ${f(w1)} rpm = ${f(W1)} rad/s)` : ''}` },
      { t: 'La energía cinética de rotación no se conserva', html: `K<sub>1</sub> = ½I<sub>1</sub>ω<sub>1</sub><sup>2</sup> = ${f(K1)} J, &nbsp; K<sub>2</sub> = ½I<sub>2</sub>ω<sub>2</sub><sup>2</sup> = ${f(K2)} J ⇒ ΔK = <b>${f(K2 - K1)} J</b> (K<sub>2</sub>/K<sub>1</sub> = I<sub>1</sub>/I<sub>2</sub> = ${f(I1 / I2)}). ${K2 > K1 ? 'Al encogerse gana energía: la pone el trabajo de los músculos o de quien tira hacia dentro.' : K2 < K1 ? 'Se pierde energía, como en un choque inelástico de rotación.' : ''}` },
    ];
    return { modo: 'momento', I1, I2, w1, w2, W1, W2, L, K1, K2, rpm, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'rodadura') return rodadura(sc);
    if (sc.modo === 'polea') return polea(sc);
    if (sc.modo === 'momento') return momento(sc);
    return inercia(sc);
  }

  const G = '9.8';
  const ejemplos = [
    { clave: 'varilla-extremo', nombre: 'Varilla que gira por un extremo (Steiner)', sc: { modo: 'inercia', cuerpo: 'varilla', M: '2', L: '1.2', d: '0.6' } },
    { clave: 'disco', nombre: 'Disco por su eje', sc: { modo: 'inercia', cuerpo: 'cilindro', M: '5', L: '0.3', d: '' } },
    { clave: 'placa', nombre: 'Placa rectangular', sc: { modo: 'inercia', cuerpo: 'placa', M: '3', L: '0.4', b: '0.3', d: '' } },
    { clave: 'esfera-rueda', nombre: 'Esfera que rueda por un plano', sc: { modo: 'rodadura', cuerpo: 'esfera', g: G, M: '2', L: '0.1', theta: '30', d: '3', mu: '0.2' } },
    { clave: 'aro-desliza', nombre: 'Aro con poco rozamiento', sc: { modo: 'rodadura', cuerpo: 'aro', g: G, M: '1', L: '0.2', theta: '40', d: '2', mu: '0.3' } },
    { clave: 'polea', nombre: 'Polea maciza con un cuerpo colgando', sc: { modo: 'polea', cuerpo: 'cilindro', g: G, M: '4', L: '0.15', m: '2', d: '1.5' } },
    { clave: 'patinadora', nombre: 'Patinadora que encoge los brazos', sc: { modo: 'momento', I1: '4.5', w1: '60', I2: '1.5', unidad: 'rpm' } },
  ];

  return { resolver, inercia, rodadura, polea, momento, CUERPOS, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Solido;
