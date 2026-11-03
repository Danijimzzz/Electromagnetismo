/* =====================================================================
   Semiconductores: punto de trabajo y recta de carga · cálculo (sin DOM).
   Tres circuitos de polarización en continua, con su recta de carga, su
   punto de trabajo Q y la región en que trabaja el dispositivo:
     · diodo con resistencia en serie (Shockley, por bisección), comparado con
       los modelos ideal y de tensión constante;
     · transistor BJT npn: polarización fija o por divisor de tensión, con
       resistencia de emisor (corte, activa y saturación);
     · MOSFET de enriquecimiento canal n con divisor de tensión y resistencia
       de fuente (corte, triodo y saturación).
     resolver(sc)  → { modo, Q, region, recta, graf, pasos, … }
     ejemplos      para el desplegable y Mis ejercicios
     f(x)          número con coma decimal y ·10<sup>n</sup>
   La gráfica (sol.graf) lleva las curvas del dispositivo, la recta de carga y Q
   en unidades del SI; app.js las dibuja. Los campos admiten prefijos y unidades
   (4k7, 100n, 10 µF) con Herramienta.leeSI.
   ===================================================================== */
const Semiconductores = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const vacio = Herramienta.vacio;
  const VT = 0.02585; // kT/q a 300 K, en voltios

  const MODOS = { diodo: 'Diodo con resistencia', bjt: 'Transistor BJT', mosfet: 'Transistor MOSFET' };
  // [nombre, unidad base (lo que significa un número sin prefijo), unidad que se muestra, permite 0, permite negativo]
  const CAMPOS = {
    Vs: ['la tensión de la fuente', 1, 'V', true, true], R: ['la resistencia', 1, 'Ω', false, false], Is: ['la corriente de saturación', 1e-12, 'pA', false, false], n: ['el factor de idealidad', 1, '', false, false],
    Vcc: ['la tensión de alimentación', 1, 'V', false, false], RB: ['la resistencia de base', 1, 'Ω', false, false], R1: ['la resistencia R1', 1, 'Ω', false, false], R2: ['la resistencia R2', 1, 'Ω', false, false],
    RC: ['la resistencia de colector', 1, 'Ω', false, false], RE: ['la resistencia de emisor', 1, 'Ω', true, false], beta: ['la ganancia β', 1, '', false, false], VBE: ['la tensión base-emisor', 1, 'V', false, false],
    VCEsat: ['la tensión de saturación', 1, 'V', true, false],
    Vdd: ['la tensión de alimentación', 1, 'V', false, false], RD: ['la resistencia de drenador', 1, 'Ω', false, false], RS: ['la resistencia de fuente', 1, 'Ω', true, false],
    K: ['el parámetro de transconductancia', 1e-3, 'mA/V²', false, false], Vt: ['la tensión umbral', 1, 'V', false, false],
  };
  function lee(sc, k) {
    const [nom, base, , cero, neg] = CAMPOS[k], N = nom[0].toUpperCase() + nom.slice(1);
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = Herramienta.leeSI(sc[k], base);
    if (!isFinite(v)) throw new Error(`${N} debe ser un número`);
    if (!neg && v < 0) throw new Error(`${N} no puede ser negativa`);
    if (!neg && !cero && v === 0) throw new Error(`${N} debe ser mayor que 0`);
    return v;
  }
  const lista = (sc, ks) => Object.fromEntries(ks.map((k) => [k, lee(sc, k)]));
  const lineal = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

  /* ---------- Diodo ---------- */
  // Id(Vd) por Shockley: Is·(exp(Vd/(n·VT)) − 1)
  const shockley = (Is, nn, Vd) => Is * (Math.exp(Math.min(Vd / (nn * VT), 700)) - 1);
  function diodo(sc) {
    const { Vs, R, Is, n } = lista(sc, ['Vs', 'R', 'Is', 'n']);
    if (n < 0.5 || n > 3) throw new Error('El factor de idealidad suele estar entre 1 y 2');
    // g(Vd) = Id(Vd) − (Vs − Vd)/R crece con Vd: una sola raíz entre 0 y Vs
    let a = Math.min(0, Vs), b = Math.max(0, Vs);
    for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (shockley(Is, n, m) - (Vs - m) / R > 0) b = m; else a = m; }
    const Vd = (a + b) / 2, Id = (Vs - Vd) / R;
    const Vcte = 0.7, Icte = Math.max((Vs - Vcte) / R, 0), Iideal = Math.max(Vs / R, 0);
    const region = Vs <= 0 || Vd < 0.3 * n ? (Vd <= 0 ? 'polarización inversa (corte)' : 'casi en corte') : 'polarización directa (conducción)';
    const vmax = Vs > 0 ? Vs : Math.max(-Vs, 0.1), signo = Vs > 0 ? 1 : -1;
    const xs = lineal(0, vmax, 400).map((x) => x * signo);
    const curva = xs.map((x) => [x, shockley(Is, n, x)]);
    const imax = Vs / R;
    const pasos = [
      { t: 'Datos', html: `$V_S = ${f(Vs)} "V"$, $R = ${f(R)} Ω$, $I_S = ${f(Is)} "A"$, $n = ${f(n)}$ y $V_T = kT/q = ${f(VT * 1000)} "mV"$ (a 300 K)` },
      { t: 'Recta de carga', html: `La ley de Kirchhoff de la malla da $V_S = V_D + I_D R$, es decir $I_D = (V_S − V_D)/R$. Corta el eje de tensiones en $V_D = V_S = ${f(Vs)} "V"$ y el de corrientes en $I_D = V_S/R = ${f(Vs / R * 1000)} "mA"$.` },
      { t: 'Curva del diodo', html: `$I_D = I_S (e^(V_D/(n V_T)) − 1)$ (ecuación de Shockley)` },
      { t: 'Punto de trabajo', html: `Al cortarse la curva con la recta (se resuelve la ecuación $I_S (e^(V_D/(n V_T)) − 1) = (V_S − V_D)/R$ por bisección) sale $V_D = ${f(Vd)} "V"$ e $I_D = (V_S − V_D)/R = ${f(Id * 1000)} "mA"$.` },
      { t: 'Región de trabajo', html: `El diodo está en ${region}.` },
      { t: 'Comparación con modelos sencillos', html: `Con el diodo ideal ($V_D = 0$): $I_D = ${f(Iideal * 1000)} "mA"$. Con tensión constante $V_D = 0,7 "V"$: $I_D = (V_S − 0,7)/R = ${f(Icte * 1000)} "mA"$. Con Shockley: $I_D = ${f(Math.max(Id, 0) * 1000)} "mA"$.` },
    ];
    return {
      modo: 'diodo', region, Q: { x: Vd, y: Id }, Vd, Id, Iideal, Icte, Vcte, pasos,
      recta: { m: -1 / R, x0: Vs, y0: Vs / R, texto: 'Recta de carga' },
      graf: { xl: 'V_D', yl: 'I_D', xu: 'V', curvas: [{ pts: curva, etiqueta: 'Curva del diodo', fuerte: true }], recta: [[0, Vs / R], [Vs, 0]], Q: { x: Vd, y: Id }, xmax: vmax * signo, ymax: imax },
    };
  }

  /* ---------- BJT npn ---------- */
  function bjt(sc) {
    const conf = sc.conf === 'divisor' ? 'divisor' : 'fija';
    const base = lista(sc, ['Vcc', 'RC', 'RE', 'beta', 'VBE', 'VCEsat']);
    const { Vcc, RC, RE, beta, VBE, VCEsat } = base;
    let VBB, RBB;
    if (conf === 'fija') { VBB = Vcc; RBB = lee(sc, 'RB'); } else { const R1 = lee(sc, 'R1'), R2 = lee(sc, 'R2'); VBB = (Vcc * R2) / (R1 + R2); RBB = (R1 * R2) / (R1 + R2); }
    if (beta < 5) throw new Error('La ganancia β debe ser al menos 5');
    let IB, IC, VCE, region;
    const IBa = (VBB - VBE) / (RBB + (beta + 1) * RE);
    if (IBa <= 0) { IB = 0; IC = 0; VCE = Vcc; region = 'corte'; }
    else {
      IB = IBa; IC = beta * IB; VCE = Vcc - IC * RC - (IC + IB) * RE; region = 'activa';
      if (VCE < VCEsat) {
        // saturación: VCE = VCEsat, dos ecuaciones lineales en IC e IB
        const A = VBB - VBE, B = Vcc - VCEsat; // IC·(RC+RE) + IB·RE = B ;  IC·RE + IB·(RBB+RE) = A
        const a11 = RC + RE, a12 = RE, a21 = RE, a22 = RBB + RE, det = a11 * a22 - a12 * a21;
        IC = (B * a22 - a12 * A) / det; IB = (a11 * A - a21 * B) / det; VCE = VCEsat; region = 'saturación';
      }
    }
    const IE = IC + IB, Rcc = RC + (RE * (beta + 1)) / beta, ICsat = (Vcc - VCEsat) / Rcc, ICmax = Vcc / Rcc;
    const pot = VCE * IC;
    const IBs = [0.5, 1, 1.5, 2].map((k) => k * (IBa > 0 ? IBa : (VBB - VBE > 0 ? 0 : 1e-5)));
    // curvas de salida: IC = β·IB (tras el codo de saturación a VCEsat), una por cada IB
    const vmax = Vcc, curvas = IBs.filter((ib) => ib > 0).map((ib) => {
      const pts = lineal(0, vmax, 200).map((v) => [v, Math.min(beta * ib, beta * ib * (v / Math.max(VCEsat, 0.05)))]);
      return { pts, etiqueta: `I_B = ${f(ib * 1e6)} µA`, fuerte: Math.abs(ib - IBa) < 1e-15 };
    });
    const pasos = [{ t: 'Datos', html: `$V_"CC" = ${f(Vcc)} "V"$, $R_C = ${f(RC)} Ω$, $R_E = ${f(RE)} Ω$, $β = ${f(beta)}$, $V_"BE" = ${f(VBE)} "V"$ y $V_"CE,sat" = ${f(VCEsat)} "V"$` }];
    if (conf === 'fija') pasos.push({ t: 'Circuito de base', html: `Polarización fija: $V_"BB" = V_"CC" = ${f(VBB)} "V"$ y $R_B = ${f(RBB)} Ω$` });
    else pasos.push({ t: 'Equivalente de Thévenin de la base', html: `$V_"BB" = V_"CC" R_2/(R_1 + R_2) = ${f(VBB)} "V"$ y $R_"BB" = R_1 ∥ R_2 = ${f(RBB)} Ω$` });
    pasos.push({ t: 'Corriente de base (suponiendo la región activa)', html: `$I_B = (V_"BB" − V_"BE")/(R_"BB" + (β + 1) R_E) = ${f(IBa * 1e6)} µA$` });
    if (region === 'corte') pasos.push({ t: 'Región de trabajo', html: `$V_"BB" ≤ V_"BE"$: la unión base-emisor no conduce. El transistor está en corte: $I_C = 0$ y $V_"CE" = V_"CC" = ${f(Vcc)} "V"$.` });
    else if (region === 'activa') pasos.push({ t: 'Punto de trabajo en activa', html: `$I_C = β I_B = ${f(IC * 1000)} "mA"$, $I_E = (β + 1) I_B = ${f(IE * 1000)} "mA"$ y $V_"CE" = V_"CC" − I_C R_C − I_E R_E = ${f(VCE)} "V"$ (mayor que $V_"CE,sat"$: la suposición es correcta).` });
    else pasos.push({ t: 'Región de trabajo: saturación', html: `En activa saldría $V_"CE" < V_"CE,sat" = ${f(VCEsat)} "V"$, así que el transistor satura. Se fija $V_"CE" = V_"CE,sat"$ y se resuelve: $I_C = ${f(IC * 1000)} "mA"$, $I_B = ${f(IB * 1e6)} µA$ (con $I_C < β I_B$: $β_"forzada" = I_C/I_B = ${f(IC / IB)}$).` });
    pasos.push({ t: 'Recta de carga en continua', html: `$V_"CC" = V_"CE" + I_C R_C + I_E R_E ≈ V_"CE" + I_C (R_C + R_E (β + 1)/β)$. Corta el eje horizontal en $V_"CE" = V_"CC" = ${f(Vcc)} "V"$ (corte) y el vertical en $I_C = V_"CC"/R_"cc" = ${f(ICmax * 1000)} "mA"$, con $R_"cc" = ${f(Rcc)} Ω$.` });
    pasos.push({ t: 'Potencia y reparto', html: `$P_C = V_"CE" I_C = ${f(pot * 1000)} "mW"$. El punto está al ${f((IC / ICsat) * 100, 3)} % de la corriente de saturación $I_"C,sat" = ${f(ICsat * 1000)} "mA"$; el centro de la recta (máxima excursión simétrica) sería $I_C = ${f((ICmax / 2) * 1000)} "mA"$.` });
    return {
      modo: 'bjt', conf, region, Q: { x: VCE, y: IC }, IB, IC, IE, VCE, VBB, RBB, Rcc, ICsat, ICmax, pot, pasos,
      graf: { xl: 'V_CE', yl: 'I_C', xu: 'V', curvas, recta: [[0, ICmax], [Vcc, 0]], Q: { x: VCE, y: IC }, xmax: Vcc, ymax: ICmax },
    };
  }

  /* ---------- MOSFET de enriquecimiento canal n ---------- */
  const idMos = (K, Vgs, Vt, Vds) => { const u = Vgs - Vt; return u <= 0 ? 0 : Vds >= u ? 0.5 * K * u * u : K * (u * Vds - 0.5 * Vds * Vds); };
  function mosfet(sc) {
    const { Vdd, RD, RS, K, Vt } = lista(sc, ['Vdd', 'RD', 'RS', 'K', 'Vt']);
    const R1 = lee(sc, 'R1'), R2 = lee(sc, 'R2'), VGG = (Vdd * R2) / (R1 + R2), RGG = (R1 * R2) / (R1 + R2), Rcc = RD + RS;
    const x = VGG - Vt; let ID, VGS, VDS, region, u;
    if (x <= 0) { ID = 0; VGS = VGG; VDS = Vdd; region = 'corte'; u = 0; }
    else {
      u = RS > 0 ? (-1 + Math.sqrt(1 + 2 * K * RS * x)) / (K * RS) : x; // sobreimpulso VGS − Vt en saturación
      ID = 0.5 * K * u * u; VGS = Vt + u; VDS = Vdd - ID * Rcc; region = 'saturación';
      if (VDS < u) {
        // triodo: ID = K·[(VGS − Vt)·VDS − VDS²/2] con VGS = VGG − ID·RS y VDS = Vdd − ID·Rcc es una ecuación de segundo grado en ID
        const qa = K * (RS * Rcc - 0.5 * Rcc * Rcc), qb = K * (Rcc * Vdd - x * Rcc - RS * Vdd) - 1, qc = K * (Vdd * x - 0.5 * Vdd * Vdd);
        const raices = (Math.abs(qa) < 1e-30 ? [-qc / qb] : [(-qb - Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa), (-qb + Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa)])
          .filter((i) => isFinite(i) && i >= 0 && Vdd - i * Rcc <= VGG - i * RS - Vt + 1e-12).sort((p, q) => p - q);
        ID = raices[0];
        VDS = Vdd - ID * Rcc; VGS = VGG - ID * RS; region = 'triodo (óhmica)';
      }
    }
    const IDmax = Vdd / Rcc, pot = VDS * ID;
    const vgss = x > 0 ? [VGS - 0.5, VGS, VGS + 0.5, VGS + 1].filter((v, i, arr) => v > Vt && arr.indexOf(v) === i) : [Vt + 1, Vt + 2];
    const curvas = vgss.map((vg) => ({ pts: lineal(0, Vdd, 200).map((v) => [v, idMos(K, vg, Vt, v)]), etiqueta: `V_GS = ${f(vg)} V`, fuerte: x > 0 && Math.abs(vg - VGS) < 1e-12 }));
    const pasos = [{ t: 'Datos', html: `$V_"DD" = ${f(Vdd)} "V"$, $R_D = ${f(RD)} Ω$, $R_S = ${f(RS)} Ω$, $K = ${f(K * 1000)} "mA/V²"$ y $V_t = ${f(Vt)} "V"$` },
      { t: 'Equivalente de Thévenin de la puerta', html: `$V_"GG" = V_"DD" R_2/(R_1 + R_2) = ${f(VGG)} "V"$ y $R_"GG" = R_1 ∥ R_2 = ${f(RGG)} Ω$ (no pasa corriente por la puerta: $V_"GS" = V_"GG" − I_D R_S$)` }];
    if (region === 'corte') pasos.push({ t: 'Región de trabajo', html: `$V_"GG" = ${f(VGG)} "V" ≤ V_t$: no hay canal. El transistor está en corte: $I_D = 0$ y $V_"DS" = V_"DD" = ${f(Vdd)} "V"$.` });
    else {
      pasos.push({ t: 'Corriente de drenador (suponiendo saturación)', html: `$I_D = 1/2 K (V_"GS" − V_t)^2$ con $V_"GS" = V_"GG" − I_D R_S$. Resuelta la ecuación de segundo grado: $V_"GS" − V_t = ${f(u)} "V"$ e $I_D = ${f(0.5 * K * u * u * 1000)} "mA"$.` });
      if (region === 'saturación') pasos.push({ t: 'Punto de trabajo en saturación', html: `$V_"GS" = ${f(VGS)} "V"$, $I_D = ${f(ID * 1000)} "mA"$ y $V_"DS" = V_"DD" − I_D (R_D + R_S) = ${f(VDS)} "V"$, mayor que $V_"GS" − V_t = ${f(u)} "V"$: la suposición es correcta.` });
      else pasos.push({ t: 'Región de trabajo: triodo', html: `En saturación saldría $V_"DS" < V_"GS" − V_t$, así que el transistor trabaja en triodo: $I_D = K [(V_"GS" − V_t) V_"DS" − V_"DS"^2/2]$. Resuelto con las dos ecuaciones del circuito: $I_D = ${f(ID * 1000)} "mA"$, $V_"GS" = ${f(VGS)} "V"$ y $V_"DS" = ${f(VDS)} "V"$.` });
    }
    pasos.push({ t: 'Recta de carga en continua', html: `$V_"DD" = V_"DS" + I_D (R_D + R_S)$. Corta el eje horizontal en $V_"DS" = V_"DD" = ${f(Vdd)} "V"$ y el vertical en $I_D = V_"DD"/(R_D + R_S) = ${f(IDmax * 1000)} "mA"$.` });
    pasos.push({ t: 'Potencia', html: `$P_D = V_"DS" I_D = ${f(pot * 1000)} "mW"$` });
    return {
      modo: 'mosfet', region, Q: { x: VDS, y: ID }, ID, VGS, VDS, VGG, RGG, Rcc, IDmax, pot, pasos,
      graf: { xl: 'V_DS', yl: 'I_D', xu: 'V', curvas, recta: [[0, IDmax], [Vdd, 0]], Q: { x: VDS, y: ID }, xmax: Vdd, ymax: IDmax },
    };
  }

  function resolver(sc) {
    const r = sc.modo === 'bjt' ? bjt(sc) : sc.modo === 'mosfet' ? mosfet(sc) : diodo(sc);
    r.sc = sc; return r;
  }

  const ejemplos = [
    { clave: 'diodo-5v', nombre: 'Diodo de silicio con 5 V y 1 kΩ', sc: { modo: 'diodo', Vs: '5', R: '1k', Is: '10', n: '1' } },
    { clave: 'led-3v3', nombre: 'LED rojo con 3,3 V y 220 Ω', sc: { modo: 'diodo', Vs: '3,3', R: '220', Is: '1e-18A', n: '2' } },
    { clave: 'bjt-fija', nombre: 'BJT con polarización fija (activa)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '470k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-divisor', nombre: 'BJT con divisor de tensión', sc: { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-saturacion', nombre: 'BJT en saturación (interruptor)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '100k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'mosfet-saturacion', nombre: 'MOSFET con divisor (saturación)', sc: { modo: 'mosfet', Vdd: '12', R1: '2M', R2: '1M', RD: '4k7', RS: '1k', K: '2', Vt: '2' } },
    { clave: 'mosfet-triodo', nombre: 'MOSFET en triodo', sc: { modo: 'mosfet', Vdd: '12', R1: '1M', R2: '1M', RD: '10k', RS: '0', K: '2', Vt: '2' } },
  ];

  return { resolver, ejemplos, MODOS, CAMPOS, shockley, VT, f };
})();
if (typeof module !== 'undefined') module.exports = Semiconductores;
