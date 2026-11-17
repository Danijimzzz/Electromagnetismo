const Semiconductores = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const vacio = Herramienta.vacio;
  const VT = 0.02585; // kT/q a 300 K, en voltios

  const MODOS = { diodo: 'Diode with resistor', zener: 'Zener diode regulator', bjt: 'BJT transistor', mosfet: 'MOSFET transistor' };
  const CAMPOS = {
    Vs: ['the source voltage', 1, 'V', true, true], R: ['la resistencia', 1, 'Ω', false, false], Is: ['the saturation current', 1e-12, 'pA', false, false], n: ['the ideality factor', 1, '', false, false],
    Vcc: ['the supply voltage', 1, 'V', false, false], RB: ['the base resistance', 1, 'Ω', false, false], R1: ['la resistencia R1', 1, 'Ω', false, false], R2: ['la resistencia R2', 1, 'Ω', false, false],
    RC: ['the collector resistance', 1, 'Ω', false, false], RE: ['the emitter resistance', 1, 'Ω', true, false], beta: ['the gain β', 1, '', false, false], VBE: ['the base-emitter voltage', 1, 'V', false, false],
    VCEsat: ['the saturation voltage', 1, 'V', true, false],
    Vdd: ['the supply voltage', 1, 'V', false, false], RD: ['the drain resistance', 1, 'Ω', false, false], RS: ['the source resistance', 1, 'Ω', true, false],
    K: ['the transconductance parameter', 1e-3, 'mA/V²', false, false], Vt: ['the threshold voltage', 1, 'V', false, false],
    RL: ['the load resistance', 1, 'Ω', false, false], VA: ['the Early voltage', 1, 'V', false, false], lam: ['the parameter λ', 1, '1/V', true, false],
    Vz: ['the Zener voltage', 1, 'V', false, false], rz: ['the dynamic resistance of the Zener', 1, 'Ω', true, false],
  };
  function lee(sc, k) {
    const [nom, base, , cero, neg] = CAMPOS[k], N = nom[0].toUpperCase() + nom.slice(1);
    if (vacio(sc[k])) throw new Error(`${nom} is missing`);
    const v = Herramienta.leeSI(sc[k], base);
    if (!isFinite(v)) throw new Error(`${N} must be a number`);
    if (!neg && v < 0) throw new Error(`${N} cannot be negative`);
    if (!neg && !cero && v === 0) throw new Error(`${N} must be greater than 0`);
    return v;
  }
  const opc = (sc, k) => (vacio(sc[k]) ? null : lee(sc, k));
  const par = (a, b) => (a === Infinity ? b : b === Infinity ? a : (a * b) / (a + b));
  const tabla = (cab, filas) => `<div class="tabla-scroll"><table class="tabla"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map((fl) => `<tr>${fl.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const lista = (sc, ks) => Object.fromEntries(ks.map((k) => [k, lee(sc, k)]));
  const lineal = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

  const shockley = (Is, nn, Vd) => Is * (Math.exp(Math.min(Vd / (nn * VT), 700)) - 1);
  function diodo(sc) {
    const { Vs, R, Is, n } = lista(sc, ['Vs', 'R', 'Is', 'n']);
    if (n < 0.5 || n > 3) throw new Error('The ideality factor is usually between 1 and 2');
    let a = Math.min(0, Vs), b = Math.max(0, Vs);
    for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (shockley(Is, n, m) - (Vs - m) / R > 0) b = m; else a = m; }
    const Vd = (a + b) / 2, Id = (Vs - Vd) / R;
    const Vcte = 0.7, Icte = Math.max((Vs - Vcte) / R, 0), Iideal = Math.max(Vs / R, 0);
    const region = Vs <= 0 || Vd < 0.3 * n ? (Vd <= 0 ? 'reverse bias (cutoff)' : 'casi en corte') : 'forward bias (conduction)';
    const vmax = Vs > 0 ? Vs : Math.max(-Vs, 0.1), signo = Vs > 0 ? 1 : -1;
    const xs = lineal(0, vmax, 400).map((x) => x * signo);
    const curva = xs.map((x) => [x, shockley(Is, n, x)]);
    const imax = Vs / R, rd = Id > 0 ? (n * VT) / Id : Infinity;   // resistencia dinámica rd = n·VT/ID
    const pasos = [
      { t: 'Data', html: `$V_S = ${f(Vs)} "V"$, $R = ${f(R)} Ω$, $I_S = ${f(Is)} "A"$, $n = ${f(n)}$ y $V_T = kT/q = ${f(VT * 1000)} "mV"$ (a 300 K)` },
      { t: 'Load line', html: `Kirchhoff's law for the loop gives $V_S = V_D + I_D R$, that is $I_D = (V_S − V_D)/R$. It cuts the voltage axis at $V_D = V_S = ${f(Vs)} "V"$ and the current axis at $I_D = V_S/R = ${f(Vs / R * 1000)} "mA"$.` },
      { t: 'Diode curve', html: `$I_D = I_S (e^(V_D/(n V_T)) − 1)$ (Shockley equation)` },
      { t: 'Operating point', html: `Intersecting the curve with the line (the equation $I_S (e^(V_D/(n V_T)) − 1) = (V_S − V_D)/R$ is solved by bisection) gives $V_D = ${f(Vd)} "V"$ and $I_D = (V_S − V_D)/R = ${f(Id * 1000)} "mA"$.` },
      { t: 'Operating region', html: `The diode is in ${region}.` },
      { t: 'Dynamic resistance', html: Id > 0 ? `For small variations around Q the diode behaves like a resistor $r_d = n V_T/I_D = ${f(rd)} Ω$ (the slope of the curve at Q is $1/r_d$).` : 'With zero current the dynamic resistance is very large: the diode does not conduct.' },
      { t: 'Comparison with simple models', html: `With the ideal diode ($V_D = 0$): $I_D = ${f(Iideal * 1000)} "mA"$. With constant voltage $V_D = 0.7 "V"$: $I_D = (V_S − 0.7)/R = ${f(Icte * 1000)} "mA"$. With Shockley: $I_D = ${f(Math.max(Id, 0) * 1000)} "mA"$.` },
    ];
    return {
      modo: 'diodo', region, Q: { x: Vd, y: Id }, rd, Vd, Id, Iideal, Icte, Vcte, pasos,
      recta: { m: -1 / R, x0: Vs, y0: Vs / R, texto: 'Load line' },
      graf: { xl: 'V_D', yl: 'I_D', xu: 'V', curvas: [{ pts: curva, etiqueta: 'Diode curve', fuerte: true }], recta: [[0, Vs / R], [Vs, 0]], Q: { x: Vd, y: Id }, xmax: vmax * signo, ymax: imax },
    };
  }

  function nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta, VBE, VCEsat }) {
    let IB, IC, VCE, region;
    const IBa = (VBB - VBE) / (RBB + (beta + 1) * RE);
    if (IBa <= 0) { IB = 0; IC = 0; VCE = Vcc; region = 'corte'; }
    else {
      IB = IBa; IC = beta * IB; VCE = Vcc - IC * RC - (IC + IB) * RE; region = 'activa';
      if (VCE < VCEsat) {
        const A = VBB - VBE, B = Vcc - VCEsat; // IC·(RC+RE) + IB·RE = B ;  IC·RE + IB·(RBB+RE) = A
        const a11 = RC + RE, a12 = RE, a21 = RE, a22 = RBB + RE, det = a11 * a22 - a12 * a21;
        IC = (B * a22 - a12 * A) / det; IB = (a11 * A - a21 * B) / det; VCE = VCEsat; region = 'saturation';
      }
    }
    return { IB, IC, VCE, region, IBa };
  }
  const espejo = (html) => html.replace(/V_"CE/g, 'V_"EC').replace(/V_"BE"/g, 'V_"EB"').replace(/V_"DS"/g, 'V_"SD"').replace(/V_"GS"/g, 'V_"SG"').replace(/V_"GG"/g, 'V_"GG"');
  function bjt(sc) {
    const pnp = sc.pol === 'p';
    const conf = sc.conf === 'divisor' ? 'divisor' : 'fija';
    const base = lista(sc, ['Vcc', 'RC', 'RE', 'beta', 'VBE', 'VCEsat']);
    const { Vcc, RC, RE, beta, VBE, VCEsat } = base;
    const RL = opc(sc, 'RL'), VA = opc(sc, 'VA');
    let VBB, RBB;
    if (conf === 'fija') { VBB = Vcc; RBB = lee(sc, 'RB'); } else { let R1 = lee(sc, 'R1'), R2 = lee(sc, 'R2'); if (pnp) [R1, R2] = [R2, R1]; VBB = (Vcc * R2) / (R1 + R2); RBB = (R1 * R2) / (R1 + R2); }
    if (beta < 5) throw new Error('The gain β must be at least 5');
    const nuc = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta, VBE, VCEsat }), { IB, IC, VCE, region, IBa } = nuc;
    const IE = IC + IB, Rcc = RC + (RE * (beta + 1)) / beta, ICsat = (Vcc - VCEsat) / Rcc, ICmax = Vcc / Rcc;
    const pot = VCE * IC;
    const IBs = [0.5, 1, 1.5, 2].map((k) => k * (IBa > 0 ? IBa : (VBB - VBE > 0 ? 0 : 1e-5)));
    const vmax = Vcc, curvas = IBs.filter((ib) => ib > 0).map((ib) => {
      const pts = lineal(0, vmax, 200).map((v) => [v, Math.min(beta * ib, beta * ib * (v / Math.max(VCEsat, 0.05)))]);
      return { pts, etiqueta: `I_B = ${f(ib * 1e6)} µA`, fuerte: Math.abs(ib - IBa) < 1e-15 };
    });
    const pasos = [{ t: 'Data', html: `$V_"CC" = ${f(Vcc)} "V"$, $R_C = ${f(RC)} Ω$, $R_E = ${f(RE)} Ω$, $β = ${f(beta)}$, $V_"BE" = ${f(VBE)} "V"$ y $V_"CE,sat" = ${f(VCEsat)} "V"$` }];
    if (pnp) pasos.unshift({ t: 'PNP transistor', html: `In a PNP the emitter goes to the supply and everything is “the other way around”: the currents enter through the emitter and the relevant voltages are $V_"EB"$ and $V_"EC"$. The mirror circuit of an NPN is solved (same resistor values, with $R_1$ and $R_2$ swapped because they are measured from $V_"CC"$) and the results are interpreted with the sign changed: $V_"EB" = ${f(VBE)} "V"$ when conducting and $V_"EC" > 0$ in active.` });
    if (conf === 'fija') pasos.push({ t: 'Base circuit', html: `Fixed bias: $V_"BB" = V_"CC" = ${f(VBB)} "V"$ and $R_B = ${f(RBB)} Ω$` });
    else pasos.push({ t: 'Thévenin equivalent of the base', html: `$V_"BB" = V_"CC" R_2/(R_1 + R_2) = ${f(VBB)} "V"$ y $R_"BB" = R_1 ∥ R_2 = ${f(RBB)} Ω$${pnp ? ' (in the pnp, measured from $V_"CC"$ downwards, the divider has $R_1$ and $R_2$ swapped)' : ''}` });
    pasos.push({ t: 'Base current (assuming the active region)', html: `$I_B = (V_"BB" − V_"BE")/(R_"BB" + (β + 1) R_E) = ${f(IBa * 1e6)} µA$` });
    if (region === 'corte') pasos.push({ t: 'Operating region', html: `$V_"BB" ≤ V_"BE"$: the base-emitter junction does not conduct. The transistor is in cutoff: $I_C = 0$ and $V_"CE" = V_"CC" = ${f(Vcc)} "V"$.` });
    else if (region === 'activa') pasos.push({ t: 'Operating point in active', html: `$I_C = β I_B = ${f(IC * 1000)} "mA"$, $I_E = (β + 1) I_B = ${f(IE * 1000)} "mA"$ and $V_"CE" = V_"CC" − I_C R_C − I_E R_E = ${f(VCE)} "V"$ (greater than $V_"CE,sat"$: the assumption is correct).` });
    else pasos.push({ t: 'Operating region: saturation', html: `In active, $V_"CE" < V_"CE,sat" = ${f(VCEsat)} "V"$ would result, so the transistor saturates. $V_"CE" = V_"CE,sat"$ is fixed and solved: $I_C = ${f(IC * 1000)} "mA"$, $I_B = ${f(IB * 1e6)} µA$ (with $I_C < β I_B$: $β_"forced" = ${f(IC / IB)}$).` });
    pasos.push({ t: 'DC load line', html: `$V_"CC" = V_"CE" + I_C R_C + I_E R_E ≈ V_"CE" + I_C (R_C + R_E (β + 1)/β)$. It cuts the horizontal axis at $V_"CE" = V_"CC" = ${f(Vcc)} "V"$ (cutoff) and the vertical one at $I_C = V_"CC"/R_"cc" = ${f(ICmax * 1000)} "mA"$, with $R_"cc" = ${f(Rcc)} Ω$.` });
    pasos.push({ t: 'Power and split', html: `$P_C = V_"CE" I_C = ${f(pot * 1000)} "mW"$. The point is at ${f((IC / ICsat) * 100, 3)} % of the saturation current $I_"C,sat" = ${f(ICsat * 1000)} "mA"$; the center of the line (maximum symmetric swing) would be $I_C = ${f((ICmax / 2) * 1000)} "mA"$.` });
    let ac = null, rectaAC = null;
    if (region === 'activa') {
      const gm = IC / VT, rpi = beta / gm, ro = VA ? (VA + VCE) / IC : Infinity;
      const rc = par(par(RC, RL === null ? Infinity : RL), ro), rcSin = par(RC, RL === null ? Infinity : RL);
      const AvP = -gm * rc, AvS = -(beta * rcSin) / (rpi + (beta + 1) * RE);
      const Re_ = par(par(RE, RL === null ? Infinity : RL), ro), AvSeg = RE > 0 ? ((beta + 1) * Re_) / (rpi + (beta + 1) * Re_) : null;
      const RinP = par(RBB, rpi), RinS = par(RBB, rpi + (beta + 1) * RE), RinSeg = par(RBB, rpi + (beta + 1) * Re_), Rout = par(RC, ro);
      ac = { gm, rpi, ro, rc, AvP, AvS, AvSeg, RinP, RinS, RinSeg, Rout, RL, VA };
      rectaAC = [[0, IC + VCE / rc], [VCE + IC * rc, 0]];
      pasos.push({ t: 'Small signal: hybrid model parameters', html: `At the Q point: $g_m = I_C/V_T = ${f(gm * 1000)} "mS"$ (with $V_T = ${f(VT * 1000)} "mV"$), $r_π = β/g_m = ${f(rpi)} Ω$${VA ? ` and $r_o = (V_A + V_"CE")/I_C = ${f(ro)} Ω$ with $V_A = ${f(VA)} "V"$` : ' ($r_o$ is neglected: no Early voltage was given)'}.` });
      pasos.push({ t: 'Voltage gain', html: `With $R_E$ bypassed by a capacitor (common emitter): $A_v = −g_m (R_C ∥ R_L${VA ? ' ∥ r_o' : ''}) = ${f(AvP)}$. Without bypass: $A_v = −β (R_C ∥ R_L)/(r_π + (β + 1) R_E) = ${f(AvS)}$${AvSeg !== null ? `. As an emitter follower (output at $R_E$): $A_v = (β+1)(R_E ∥ R_L)/(r_π + (β+1)(R_E ∥ R_L)) = ${f(AvSeg)}$` : ''}.${RL === null ? ' (With no load $R_L$: it is taken as infinite.)' : ''}` });
      pasos.push({ t: 'Input and output resistances', html: `Input with $R_E$ bypassed: $R_"in" = R_"BB" ∥ r_π = ${f(RinP)} Ω$; without bypass: $R_"in" = R_"BB" ∥ [r_π + (β+1) R_E] = ${f(RinS)} Ω$. Output (common emitter): $R_"out" = R_C ∥ r_o = ${f(Rout)} Ω$.` });
      pasos.push({ t: 'AC load line', html: `For the signal, the collector load is $r_c = R_C ∥ R_L${VA ? ' ∥ r_o' : ''} = ${f(rc)} Ω$ (with $R_E$ bypassed): the AC line passes through Q with slope $−1/r_c$ and cuts the axes at $V_"CE" = ${f(VCE + IC * rc)} "V"$ and $I_C = ${f((IC + VCE / rc) * 1000)} "mA"$. The maximum swing without clipping is the smaller of $I_C r_c$ and $V_"CE" − V_"CE,sat"$ around Q: $${f(Math.min(IC * rc, VCE - VCEsat))} "V"$ peak.` });
    } else pasos.push({ t: 'Small signal', html: `The small-signal model is only valid in the active region; the transistor is in ${region}.` });
    const Q0 = IC, filasB = [50, 100, 150, 200, 300].map((b2) => { const q = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: b2, VBE, VCEsat }); return [f(b2), `${f(q.IC * 1000)} mA`, `${f(q.VCE)} V`, Q0 > 0 ? `${f(((q.IC - Q0) / Q0) * 100, 3)} %` : '—', q.region]; });
    const filasT = [-25, 0, 25, 50, 75, 100].map((T) => { const q = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta, VBE: VBE - 0.002 * (T - 25), VCEsat }); return [`${f(T)} °C`, `${f(VBE - 0.002 * (T - 25), 3)} V`, `${f(q.IC * 1000)} mA`, `${f(q.VCE)} V`, Q0 > 0 ? `${f(((q.IC - Q0) / Q0) * 100, 3)} %` : '—']; });
    const sBeta = Q0 > 0 ? (nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: 300, VBE, VCEsat }).IC - nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: 50, VBE, VCEsat }).IC) / Q0 : null;
    pasos.push({ t: 'Stability of the Q point with β', html: `If β changes (from one transistor to another) keeping the circuit, the Q point moves like this:${tabla(['β', 'I<sub>C</sub>', 'V<sub>CE</sub>', 'Change in I<sub>C</sub>', 'Region'], filasB)}${sBeta !== null ? `From β = 50 to β = 300 the collector current changes by ${f(Math.abs(sBeta) * 100, 3)} % of the nominal. ${RE > 0 && conf === 'divisor' ? 'With a voltage divider and $R_E$ the point is stable: the current depends mainly on $V_"BB"$ and $R_E$.' : 'Without a divider and $R_E$, $I_C ≈ β I_B$ is proportional to β: the point is very sensitive.'}` : ''}` });
    pasos.push({ t: 'Stability of the Q point with temperature', html: `$V_"BE"$ drops about 2 mV per degree (−2 mV/K, reference 25 °C):${tabla(['Temperature', 'V<sub>BE</sub>', 'I<sub>C</sub>', 'V<sub>CE</sub>', 'Change in I<sub>C</sub>'], filasT)}` });
    const out = {
      modo: 'bjt', pol: pnp ? 'p' : 'n', conf, region, Q: { x: VCE, y: IC }, IB, IC, IE, VCE, VBB, RBB, Rcc, ICsat, ICmax, pot, ac, pasos,
      graf: { xl: pnp ? 'V_EC' : 'V_CE', yl: 'I_C', xu: 'V', curvas, recta: [[0, ICmax], [Vcc, 0]], rectaAC, Q: { x: VCE, y: IC }, xmax: Vcc, ymax: ICmax },
    };
    if (pnp) { for (const p of out.pasos) p.html = espejo(p.html); out.VEC = VCE; out.VEB = VBE; }
    return out;
  }

  const idMos = (K, Vgs, Vt, Vds) => { const u = Vgs - Vt; return u <= 0 ? 0 : Vds >= u ? 0.5 * K * u * u : K * (u * Vds - 0.5 * Vds * Vds); };
  function mosfet(sc) {
    const { Vdd, RD, RS, K, Vt } = lista(sc, ['Vdd', 'RD', 'RS', 'K', 'Vt']);
    const pmos = sc.pol === 'p', RL = opc(sc, 'RL'), lam = opc(sc, 'lam');
    let R1 = lee(sc, 'R1'), R2 = lee(sc, 'R2'); if (pmos) [R1, R2] = [R2, R1];
    const VGG = (Vdd * R2) / (R1 + R2), RGG = (R1 * R2) / (R1 + R2), Rcc = RD + RS;
    const x = VGG - Vt; let ID, VGS, VDS, region, u;
    if (x <= 0) { ID = 0; VGS = VGG; VDS = Vdd; region = 'corte'; u = 0; }
    else {
      u = RS > 0 ? (-1 + Math.sqrt(1 + 2 * K * RS * x)) / (K * RS) : x; // sobreimpulso VGS − Vt en saturación
      ID = 0.5 * K * u * u; VGS = Vt + u; VDS = Vdd - ID * Rcc; region = 'saturation';
      if (VDS < u) {
        const qa = K * (RS * Rcc - 0.5 * Rcc * Rcc), qb = K * (Rcc * Vdd - x * Rcc - RS * Vdd) - 1, qc = K * (Vdd * x - 0.5 * Vdd * Vdd);
        const raices = (Math.abs(qa) < 1e-30 ? [-qc / qb] : [(-qb - Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa), (-qb + Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa)])
          .filter((i) => isFinite(i) && i >= 0 && Vdd - i * Rcc <= VGG - i * RS - Vt + 1e-12).sort((p, q) => p - q);
        ID = raices[0];
        VDS = Vdd - ID * Rcc; VGS = VGG - ID * RS; region = 'triode (ohmic)';
      }
    }
    const IDmax = Vdd / Rcc, pot = VDS * ID;
    const vgss = x > 0 ? [VGS - 0.5, VGS, VGS + 0.5, VGS + 1].filter((v, i, arr) => v > Vt && arr.indexOf(v) === i) : [Vt + 1, Vt + 2];
    const curvas = vgss.map((vg) => ({ pts: lineal(0, Vdd, 200).map((v) => [v, idMos(K, vg, Vt, v)]), etiqueta: `V_GS = ${f(vg)} V`, fuerte: x > 0 && Math.abs(vg - VGS) < 1e-12 }));
    const pasos = [{ t: 'Data', html: `$V_"DD" = ${f(Vdd)} "V"$, $R_D = ${f(RD)} Ω$, $R_S = ${f(RS)} Ω$, $K = ${f(K * 1000)} "mA/V²"$ y $V_t = ${f(Vt)} "V"$` },
      { t: 'Thévenin equivalent of the gate', html: `$V_"GG" = V_"DD" R_2/(R_1 + R_2) = ${f(VGG)} "V"$ and $R_"GG" = R_1 ∥ R_2 = ${f(RGG)} Ω$ (no current flows through the gate: $V_"GS" = V_"GG" − I_D R_S$)` }];
    if (region === 'corte') pasos.push({ t: 'Operating region', html: `$V_"GG" = ${f(VGG)} "V" ≤ V_t$: there is no channel. The transistor is in cutoff: $I_D = 0$ and $V_"DS" = V_"DD" = ${f(Vdd)} "V"$.` });
    else {
      pasos.push({ t: 'Drain current (assuming saturation)', html: `$I_D = 1/2 K (V_"GS" − V_t)^2$ with $V_"GS" = V_"GG" − I_D R_S$. Solving the quadratic equation: $V_"GS" − V_t = ${f(u)} "V"$ and $I_D = ${f(0.5 * K * u * u * 1000)} "mA"$.` });
      if (region === 'saturation') pasos.push({ t: 'Operating point in saturation', html: `$V_"GS" = ${f(VGS)} "V"$, $I_D = ${f(ID * 1000)} "mA"$ and $V_"DS" = V_"DD" − I_D (R_D + R_S) = ${f(VDS)} "V"$, greater than $V_"GS" − V_t = ${f(u)} "V"$: the assumption is correct.` });
      else pasos.push({ t: 'Operating region: triode', html: `In saturation, $V_"DS" < V_"GS" − V_t$ would result, so the transistor works in triode: $I_D = K [(V_"GS" − V_t) V_"DS" − V_"DS"^2/2]$. Solved with the two circuit equations: $I_D = ${f(ID * 1000)} "mA"$, $V_"GS" = ${f(VGS)} "V"$ and $V_"DS" = ${f(VDS)} "V"$.` });
    }
    pasos.push({ t: 'DC load line', html: `$V_"DD" = V_"DS" + I_D (R_D + R_S)$. It cuts the horizontal axis at $V_"DS" = V_"DD" = ${f(Vdd)} "V"$ and the vertical one at $I_D = V_"DD"/(R_D + R_S) = ${f(IDmax * 1000)} "mA"$.` });
    pasos.push({ t: 'Power', html: `$P_D = V_"DS" I_D = ${f(pot * 1000)} "mW"$` });
    let ac = null, rectaAC = null;
    if (region === 'saturation' && ID > 0) {
      const gm = K * u, ro = lam ? 1 / (lam * ID) : Infinity, rcarga = par(par(RD, RL === null ? Infinity : RL), ro);
      const AvP = -gm * rcarga, AvS = -(gm * par(par(RD, RL === null ? Infinity : RL), Infinity)) / (1 + gm * RS);
      const Rs_ = par(par(RS, RL === null ? Infinity : RL), ro), AvSeg = RS > 0 ? (gm * Rs_) / (1 + gm * Rs_) : null;
      const Rout = par(RD, ro);
      ac = { gm, ro, rc: rcarga, AvP, AvS, AvSeg, Rin: RGG, Rout, RL, lam };
      rectaAC = [[0, ID + VDS / rcarga], [VDS + ID * rcarga, 0]];
      pasos.push({ t: 'Small signal: transconductance', html: `In saturation $g_m = ∂I_D/∂V_"GS" = K (V_"GS" − V_t) = 2 I_D/(V_"GS" − V_t) = ${f(gm * 1000)} "mS"$${lam ? ` and $r_o = 1/(λ I_D) = ${f(ro)} Ω$ with $λ = ${f(lam)}$ V⁻¹` : ' ($r_o$ is neglected: λ was not given)'}.` });
      pasos.push({ t: 'Voltage gain', html: `Common source with $R_S$ bypassed: $A_v = −g_m (R_D ∥ R_L${lam ? ' ∥ r_o' : ''}) = ${f(AvP)}$. Without bypass: $A_v = −g_m (R_D ∥ R_L)/(1 + g_m R_S) = ${f(AvS)}$${AvSeg !== null ? `. As a source follower (output at $R_S$): $A_v = g_m (R_S ∥ R_L)/(1 + g_m (R_S ∥ R_L)) = ${f(AvSeg)}$` : ''}.${RL === null ? ' (With no load $R_L$: it is taken as infinite.)' : ''}` });
      pasos.push({ t: 'Input and output resistances', html: `Input: $R_"in" = R_"GG" = R_1 ∥ R_2 = ${f(RGG)} Ω$ (the gate draws no current). Output (common source): $R_"out" = R_D ∥ r_o = ${f(Rout)} Ω$.` });
      pasos.push({ t: 'AC load line', html: `With $R_S$ bypassed the load for the signal is $r_d = R_D ∥ R_L${lam ? ' ∥ r_o' : ''} = ${f(rcarga)} Ω$: a line of slope $−1/r_d$ through Q, which cuts the axes at $V_"DS" = ${f(VDS + ID * rcarga)} "V"$ and $I_D = ${f((ID + VDS / rcarga) * 1000)} "mA"$.` });
    } else pasos.push({ t: 'Small signal', html: `The small-signal model is valid in saturation; the transistor is in ${region}.` });
    const out = {
      modo: 'mosfet', pol: pmos ? 'p' : 'n', region, Q: { x: VDS, y: ID }, ID, VGS, VDS, VGG, RGG, Rcc, IDmax, pot, ac, pasos,
      graf: { xl: pmos ? 'V_SD' : 'V_DS', yl: 'I_D', xu: 'V', curvas, recta: [[0, IDmax], [Vdd, 0]], rectaAC, Q: { x: VDS, y: ID }, xmax: Vdd, ymax: IDmax },
    };
    if (pmos) {
      out.pasos.unshift({ t: 'MOSFET de canal p', html: `In a p-channel MOSFET the source goes to the supply and the useful voltages are $V_"SG"$ and $V_"SD"$ (with $V_t$ as the absolute value of the threshold). The mirror circuit of the n-channel is solved with $R_1$ and $R_2$ swapped (the divider is measured from $V_"DD"$) and interpreted with the sign changed: the current enters through the source.` });
      for (const q of out.pasos) q.html = espejo(q.html);
      out.VSD = VDS; out.VSG = VGS;
    }
    return out;
  }

  function zener(sc) {
    const { Vs, R, RL, Vz } = lista(sc, ['Vs', 'R', 'RL', 'Vz']), rz = vacio(sc.rz) ? 0 : lee(sc, 'rz');
    if (Vs <= 0) throw new Error('The input voltage must be greater than 0: the Zener is connected in reverse');
    const Vth = (Vs * RL) / (R + RL), Rth = (R * RL) / (R + RL), reg = Vth > Vz;
    const Iz = reg ? (Vth - Vz) / (Rth + rz) : 0, Vo = reg ? Vz + rz * Iz : Vth;
    const IR = (Vs - Vo) / R, IL = Vo / RL, Pz = Vo * Iz;
    const regLinea = reg ? (rz / (Rth + rz)) * (RL / (R + RL)) : RL / (R + RL), Rout = par(R, rz || 1e-300);
    const Vsmin = (Vz * (R + RL)) / RL, ILmax = (Vs - Vz) / R, RLmin = (Vz * R) / (Vs - Vz > 0 ? Vs - Vz : Infinity);
    const region = reg ? 'Zener breakdown: the diode regulates' : 'no breakdown: the Zener does not conduct and the output follows the input';
    const ymax = Vth / Rth, rEf = Math.max(rz, (0.01 * Vth) / ymax);
    const curva = lineal(0, Vth * 1.05, 400).map((v) => [v, v > Vz ? (v - Vz) / rEf : 0]);
    const pasos = [
      { t: 'Data', html: `$V_S = ${f(Vs)} "V"$, $R = ${f(R)} Ω$, $R_L = ${f(RL)} Ω$, $V_Z = ${f(Vz)} "V"$ and $r_z = ${f(rz)} Ω$ (dynamic resistance in breakdown; 0 = ideal Zener).` },
      { t: 'Thévenin equivalent seen by the Zener', html: `Removing the diode, the source with $R$ and the load give $V_"th" = V_S R_L/(R + R_L) = ${f(Vth)} "V"$ and $R_"th" = R ∥ R_L = ${f(Rth)} Ω$. That is the load line: $I_Z = (V_"th" − V_Z)/R_"th"$ if the diode did not exist.` },
      { t: 'Operating region', html: reg ? `Since $V_"th" = ${f(Vth)} "V" > V_Z$, the Zener goes into breakdown and fixes the output: $I_Z = (V_"th" − V_Z)/(R_"th" + r_z) = ${f(Iz * 1000)} "mA"$ and $V_o = V_Z + r_z I_Z = ${f(Vo)} "V"$.` : `Since $V_"th" = ${f(Vth)} "V" ≤ V_Z$, the Zener does not reach breakdown: it does not regulate, $I_Z = 0$ and $V_o = V_"th" = ${f(Vo)} "V"$. $V_S ≥ ${f(Vsmin)} "V"$ is needed to regulate with this load.` },
      { t: 'Currents and power', html: `Current through $R$: $I_R = (V_S − V_o)/R = ${f(IR * 1000)} "mA"$; through the load: $I_L = V_o/R_L = ${f(IL * 1000)} "mA"$; through the Zener: $I_Z = I_R − I_L = ${f(Iz * 1000)} "mA"$ (check: ${f((IR - IL) * 1000)} mA). Power in the Zener: $P_Z = V_o I_Z = ${f(Pz * 1000)} "mW"$ (it must not exceed the diode's rated power).` },
      { t: 'Line and load regulation', html: `Line regulation: $ΔV_o/ΔV_S = ${f(regLinea)}$ (${f(regLinea * 1000)} mV per volt of input variation). Output resistance: $R_"out" = R ∥ r_z = ${f(Rout)} Ω$, so when the load draws 1 mA more the output drops $${f(Rout * 1e-3 * 1000)} "mV"$.` },
      { t: 'Regulation limits', html: `The Zener regulates while $I_Z > 0$: with $V_S = ${f(Vs)} "V"$, the load current can go up to $I_"L,max" = (V_S − V_Z)/R = ${f(ILmax * 1000)} "mA"$ (minimum load $R_L ≥ ${f(RLmin)} Ω$), and with this load the input cannot drop below $V_"S,min" = V_Z (R + R_L)/R_L = ${f(Vsmin)} "V"$.` },
    ];
    return { modo: 'zener', region, reg, Q: { x: Vo, y: Iz }, Vo, Iz, IR, IL, Pz, Vth, Rth, regLinea, Rout, Vsmin, ILmax, pasos,
      graf: { xl: 'V_Z', yl: 'I_Z', xu: 'V', curvas: [{ pts: curva, etiqueta: 'Zener curve in reverse', fuerte: true }], recta: [[0, ymax], [Vth, 0]], Q: { x: Vo, y: Iz }, xmax: Vth * 1.05, ymax } };
  }

  function resolver(sc) {
    const r = sc.modo === 'bjt' ? bjt(sc) : sc.modo === 'mosfet' ? mosfet(sc) : sc.modo === 'zener' ? zener(sc) : diodo(sc);
    r.sc = sc; return r;
  }

  const ejemplos = [
    { clave: 'diodo-5v', nombre: 'Silicon diode with 5 V and 1 kΩ', sc: { modo: 'diodo', Vs: '5', R: '1k', Is: '10', n: '1' } },
    { clave: 'led-3v3', nombre: 'Red LED with 3.3 V and 220 Ω', sc: { modo: 'diodo', Vs: '3,3', R: '220', Is: '1e-18A', n: '2' } },
    { clave: 'bjt-fija', nombre: 'BJT with fixed bias (active)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '470k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-divisor', nombre: 'BJT with voltage divider', sc: { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-saturacion', nombre: 'BJT in saturation (switch)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '100k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'mosfet-saturacion', nombre: 'MOSFET with divider (saturation)', sc: { modo: 'mosfet', Vdd: '12', R1: '2M', R2: '1M', RD: '4k7', RS: '1k', K: '2', Vt: '2' } },
    { clave: 'mosfet-triodo', nombre: 'MOSFET en triodo', sc: { modo: 'mosfet', Vdd: '12', R1: '1M', R2: '1M', RD: '10k', RS: '0', K: '2', Vt: '2' } },
    { clave: 'zener-5v1', nombre: '5.1 V Zener regulator with 12 V and a 1 kΩ load', sc: { modo: 'zener', Vs: '12', R: '470', RL: '1k', Vz: '5,1', rz: '10' } },
    { clave: 'bjt-pnp', nombre: 'PNP BJT with voltage divider (mirror of the NPN)', sc: { modo: 'bjt', pol: 'p', conf: 'divisor', Vcc: '12', R1: '10k', R2: '47k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-senal', nombre: 'Common emitter with load: gain and AC line', sc: { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2', RL: '10k', VA: '100' } },
    { clave: 'mosfet-canal-p', nombre: 'P-channel MOSFET (mirror of the n-channel)', sc: { modo: 'mosfet', pol: 'p', Vdd: '12', R1: '1M', R2: '2M', RD: '4k7', RS: '1k', K: '2', Vt: '2', RL: '', lam: '' } },
  ];

  return { resolver, ejemplos, nucleoBJT, MODOS, CAMPOS, shockley, VT, f };
})();

