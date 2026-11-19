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

  const MODOS = { diodo: 'Diode mit Widerstand', zener: 'Regler mit Z-Diode', bjt: 'BJT-Transistor', mosfet: 'MOSFET-Transistor' };
  const CAMPOS = {
    Vs: ['die Spannung der Quelle', 1, 'V', true, true], R: ['la resistencia', 1, 'Ω', false, false], Is: ['der Sättigungsstrom', 1e-12, 'pA', false, false], n: ['der Idealitätsfaktor', 1, '', false, false],
    Vcc: ['die Versorgungsspannung', 1, 'V', false, false], RB: ['der Basiswiderstand', 1, 'Ω', false, false], R1: ['la resistencia R1', 1, 'Ω', false, false], R2: ['la resistencia R2', 1, 'Ω', false, false],
    RC: ['der Kollektorwiderstand', 1, 'Ω', false, false], RE: ['der Emitterwiderstand', 1, 'Ω', true, false], beta: ['die Verstärkung β', 1, '', false, false], VBE: ['die Basis-Emitter-Spannung', 1, 'V', false, false],
    VCEsat: ['die Sättigungsspannung', 1, 'V', true, false],
    Vdd: ['die Versorgungsspannung', 1, 'V', false, false], RD: ['der Drainwiderstand', 1, 'Ω', false, false], RS: ['der Sourcewiderstand', 1, 'Ω', true, false],
    K: ['der Transkonduktanzparameter', 1e-3, 'mA/V²', false, false], Vt: ['die Schwellenspannung', 1, 'V', false, false],
    RL: ['der Lastwiderstand', 1, 'Ω', false, false], VA: ['die Early-Spannung', 1, 'V', false, false], lam: ['der Parameter λ', 1, '1/V', true, false],
    Vz: ['die Z-Spannung', 1, 'V', false, false], rz: ['der dynamische Widerstand der Z-Diode', 1, 'Ω', true, false],
  };
  function lee(sc, k) {
    const [nom, base, , cero, neg] = CAMPOS[k], N = nom[0].toUpperCase() + nom.slice(1);
    if (vacio(sc[k])) throw new Error(`${nom} fehlt`);
    const v = Herramienta.leeSI(sc[k], base);
    if (!isFinite(v)) throw new Error(`${N} muss eine Zahl sein`);
    if (!neg && v < 0) throw new Error(`${N} darf nicht negativ sein`);
    if (!neg && !cero && v === 0) throw new Error(`${N} muss größer als 0 sein`);
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
    if (n < 0.5 || n > 3) throw new Error('Der Idealitätsfaktor liegt meist zwischen 1 und 2');
    let a = Math.min(0, Vs), b = Math.max(0, Vs);
    for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (shockley(Is, n, m) - (Vs - m) / R > 0) b = m; else a = m; }
    const Vd = (a + b) / 2, Id = (Vs - Vd) / R;
    const Vcte = 0.7, Icte = Math.max((Vs - Vcte) / R, 0), Iideal = Math.max(Vs / R, 0);
    const region = Vs <= 0 || Vd < 0.3 * n ? (Vd <= 0 ? 'Sperrpolarisation (Sperrbereich)' : 'casi en corte') : 'Durchlasspolarisation (Leitend)';
    const vmax = Vs > 0 ? Vs : Math.max(-Vs, 0.1), signo = Vs > 0 ? 1 : -1;
    const xs = lineal(0, vmax, 400).map((x) => x * signo);
    const curva = xs.map((x) => [x, shockley(Is, n, x)]);
    const imax = Vs / R, rd = Id > 0 ? (n * VT) / Id : Infinity;   // resistencia dinámica rd = n·VT/ID
    const pasos = [
      { t: 'Daten', html: `$V_S = ${f(Vs)} "V"$, $R = ${f(R)} Ω$, $I_S = ${f(Is)} "A"$, $n = ${f(n)}$ y $V_T = kT/q = ${f(VT * 1000)} "mV"$ (a 300 K)` },
      { t: 'Lastgerade', html: `Die Kirchhoffsche Maschenregel ergibt $V_S = V_D + I_D R$, also $I_D = (V_S − V_D)/R$. Sie schneidet die Spannungsachse bei $V_D = V_S = ${f(Vs)} "V"$ und die Stromachse bei $I_D = V_S/R = ${f(Vs / R * 1000)} "mA"$.` },
      { t: 'Kennlinie der Diode', html: `$I_D = I_S (e^(V_D/(n V_T)) − 1)$ (Shockley-Gleichung)` },
      { t: 'Arbeitspunkt', html: `Beim Schnitt der Kennlinie mit der Geraden (die Gleichung $I_S (e^(V_D/(n V_T)) − 1) = (V_S − V_D)/R$ wird per Bisektion gelöst) ergibt sich $V_D = ${f(Vd)} "V"$ und $I_D = (V_S − V_D)/R = ${f(Id * 1000)} "mA"$.` },
      { t: 'Arbeitsbereich', html: `Die Diode ist im Bereich ${region}.` },
      { t: 'Dynamischer Widerstand', html: Id > 0 ? `Bei kleinen Änderungen um Q verhält sich die Diode wie ein Widerstand $r_d = n V_T/I_D = ${f(rd)} Ω$ (die Steigung der Kennlinie in Q ist $1/r_d$).` : 'Bei verschwindendem Strom ist der dynamische Widerstand sehr groß: Die Diode leitet nicht.' },
      { t: 'Vergleich mit einfachen Modellen', html: `Mit der idealen Diode ($V_D = 0$): $I_D = ${f(Iideal * 1000)} "mA"$. Mit konstanter Spannung $V_D = 0,7 "V"$: $I_D = (V_S − 0,7)/R = ${f(Icte * 1000)} "mA"$. Mit Shockley: $I_D = ${f(Math.max(Id, 0) * 1000)} "mA"$.` },
    ];
    return {
      modo: 'diodo', region, Q: { x: Vd, y: Id }, rd, Vd, Id, Iideal, Icte, Vcte, pasos,
      recta: { m: -1 / R, x0: Vs, y0: Vs / R, texto: 'Lastgerade' },
      graf: { xl: 'V_D', yl: 'I_D', xu: 'V', curvas: [{ pts: curva, etiqueta: 'Kennlinie der Diode', fuerte: true }], recta: [[0, Vs / R], [Vs, 0]], Q: { x: Vd, y: Id }, xmax: vmax * signo, ymax: imax },
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
        IC = (B * a22 - a12 * A) / det; IB = (a11 * A - a21 * B) / det; VCE = VCEsat; region = 'Sättigung';
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
    if (beta < 5) throw new Error('Die Verstärkung β muss mindestens 5 sein');
    const nuc = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta, VBE, VCEsat }), { IB, IC, VCE, region, IBa } = nuc;
    const IE = IC + IB, Rcc = RC + (RE * (beta + 1)) / beta, ICsat = (Vcc - VCEsat) / Rcc, ICmax = Vcc / Rcc;
    const pot = VCE * IC;
    const IBs = [0.5, 1, 1.5, 2].map((k) => k * (IBa > 0 ? IBa : (VBB - VBE > 0 ? 0 : 1e-5)));
    const vmax = Vcc, curvas = IBs.filter((ib) => ib > 0).map((ib) => {
      const pts = lineal(0, vmax, 200).map((v) => [v, Math.min(beta * ib, beta * ib * (v / Math.max(VCEsat, 0.05)))]);
      return { pts, etiqueta: `I_B = ${f(ib * 1e6)} µA`, fuerte: Math.abs(ib - IBa) < 1e-15 };
    });
    const pasos = [{ t: 'Daten', html: `$V_"CC" = ${f(Vcc)} "V"$, $R_C = ${f(RC)} Ω$, $R_E = ${f(RE)} Ω$, $β = ${f(beta)}$, $V_"BE" = ${f(VBE)} "V"$ y $V_"CE,sat" = ${f(VCEsat)} "V"$` }];
    if (pnp) pasos.unshift({ t: 'PNP-Transistor', html: `Bei einem PNP liegt der Emitter an der Versorgung und alles ist „umgekehrt“: Die Ströme treten am Emitter ein und die relevanten Spannungen sind $V_"EB"$ und $V_"EC"$. Man löst die Spiegelschaltung eines NPN (gleiche Widerstandswerte, mit vertauschten $R_1$ und $R_2$, da sie von $V_"CC"$ aus gemessen werden) und deutet die Ergebnisse mit umgekehrtem Vorzeichen: $V_"EB" = ${f(VBE)} "V"$ im leitenden Zustand und $V_"EC" > 0$ im aktiven Bereich.` });
    if (conf === 'fija') pasos.push({ t: 'Basisschaltung', html: `Feste Einstellung: $V_"BB" = V_"CC" = ${f(VBB)} "V"$ und $R_B = ${f(RBB)} Ω$` });
    else pasos.push({ t: 'Thévenin-Äquivalent der Basis', html: `$V_"BB" = V_"CC" R_2/(R_1 + R_2) = ${f(VBB)} "V"$ y $R_"BB" = R_1 ∥ R_2 = ${f(RBB)} Ω$${pnp ? ' (beim PNP, von $V_"CC"$ nach unten gemessen, hat der Teiler vertauschte $R_1$ und $R_2$)' : ''}` });
    pasos.push({ t: 'Basisstrom (unter der Annahme des aktiven Bereichs)', html: `$I_B = (V_"BB" − V_"BE")/(R_"BB" + (β + 1) R_E) = ${f(IBa * 1e6)} µA$` });
    if (region === 'corte') pasos.push({ t: 'Arbeitsbereich', html: `$V_"BB" ≤ V_"BE"$: Der Basis-Emitter-Übergang leitet nicht. Der Transistor sperrt: $I_C = 0$ und $V_"CE" = V_"CC" = ${f(Vcc)} "V"$.` });
    else if (region === 'activa') pasos.push({ t: 'Arbeitspunkt im aktiven Bereich', html: `$I_C = β I_B = ${f(IC * 1000)} "mA"$, $I_E = (β + 1) I_B = ${f(IE * 1000)} "mA"$ und $V_"CE" = V_"CC" − I_C R_C − I_E R_E = ${f(VCE)} "V"$ (größer als $V_"CE,sat"$: Die Annahme ist richtig).` });
    else pasos.push({ t: 'Arbeitsbereich: Sättigung', html: `Im aktiven Bereich ergäbe sich $V_"CE" < V_"CE,sat" = ${f(VCEsat)} "V"$, also sättigt der Transistor. Man setzt $V_"CE" = V_"CE,sat"$ und löst: $I_C = ${f(IC * 1000)} "mA"$, $I_B = ${f(IB * 1e6)} µA$ (mit $I_C < β I_B$: $β_"forzada" = ${f(IC / IB)}$).` });
    pasos.push({ t: 'Lastgerade bei Gleichstrom', html: `$V_"CC" = V_"CE" + I_C R_C + I_E R_E ≈ V_"CE" + I_C (R_C + R_E (β + 1)/β)$. Sie schneidet die horizontale Achse bei $V_"CE" = V_"CC" = ${f(Vcc)} "V"$ (Sperrung) und die vertikale bei $I_C = V_"CC"/R_"cc" = ${f(ICmax * 1000)} "mA"$, mit $R_"cc" = ${f(Rcc)} Ω$.` });
    pasos.push({ t: 'Leistung und Aufteilung', html: `$P_C = V_"CE" I_C = ${f(pot * 1000)} "mW"$. Der Punkt liegt bei ${f((IC / ICsat) * 100, 3)} % des Sättigungsstroms $I_"C,sat" = ${f(ICsat * 1000)} "mA"$; die Mitte der Geraden (maximale symmetrische Aussteuerung) wäre $I_C = ${f((ICmax / 2) * 1000)} "mA"$.` });
    let ac = null, rectaAC = null;
    if (region === 'activa') {
      const gm = IC / VT, rpi = beta / gm, ro = VA ? (VA + VCE) / IC : Infinity;
      const rc = par(par(RC, RL === null ? Infinity : RL), ro), rcSin = par(RC, RL === null ? Infinity : RL);
      const AvP = -gm * rc, AvS = -(beta * rcSin) / (rpi + (beta + 1) * RE);
      const Re_ = par(par(RE, RL === null ? Infinity : RL), ro), AvSeg = RE > 0 ? ((beta + 1) * Re_) / (rpi + (beta + 1) * Re_) : null;
      const RinP = par(RBB, rpi), RinS = par(RBB, rpi + (beta + 1) * RE), RinSeg = par(RBB, rpi + (beta + 1) * Re_), Rout = par(RC, ro);
      ac = { gm, rpi, ro, rc, AvP, AvS, AvSeg, RinP, RinS, RinSeg, Rout, RL, VA };
      rectaAC = [[0, IC + VCE / rc], [VCE + IC * rc, 0]];
      pasos.push({ t: 'Kleinsignal: Parameter des Hybridmodells', html: `Im Punkt Q: $g_m = I_C/V_T = ${f(gm * 1000)} "mS"$ (mit $V_T = ${f(VT * 1000)} "mV"$), $r_π = β/g_m = ${f(rpi)} Ω$${VA ? ` und $r_o = (V_A + V_"CE")/I_C = ${f(ro)} Ω$ mit $V_A = ${f(VA)} "V"$` : ' ($r_o$ wird vernachlässigt: Es wurde keine Early-Spannung angegeben)'}.` });
      pasos.push({ t: 'Spannungsverstärkung', html: `Mit durch einen Kondensator überbrücktem $R_E$ (Emitterschaltung): $A_v = −g_m (R_C ∥ R_L${VA ? ' ∥ r_o' : ''}) = ${f(AvP)}$. Ohne Überbrückung: $A_v = −β (R_C ∥ R_L)/(r_π + (β + 1) R_E) = ${f(AvS)}$${AvSeg !== null ? `. Als Emitterfolger (Ausgang an $R_E$): $A_v = (β+1)(R_E ∥ R_L)/(r_π + (β+1)(R_E ∥ R_L)) = ${f(AvSeg)}$` : ''}.${RL === null ? ' (Ohne Last $R_L$: Sie wird als unendlich angenommen.)' : ''}` });
      pasos.push({ t: 'Eingangs- und Ausgangswiderstand', html: `Eingang mit überbrücktem $R_E$: $R_"in" = R_"BB" ∥ r_π = ${f(RinP)} Ω$; ohne Überbrückung: $R_"in" = R_"BB" ∥ [r_π + (β+1) R_E] = ${f(RinS)} Ω$. Ausgang (Emitterschaltung): $R_"out" = R_C ∥ r_o = ${f(Rout)} Ω$.` });
      pasos.push({ t: 'Lastgerade bei Wechselstrom', html: `Für das Signal ist die Last des Kollektors $r_c = R_C ∥ R_L${VA ? ' ∥ r_o' : ''} = ${f(rc)} Ω$ (mit überbrücktem $R_E$): Die Wechselstromgerade geht durch Q mit der Steigung $−1/r_c$ und schneidet die Achsen bei $V_"CE" = ${f(VCE + IC * rc)} "V"$ und $I_C = ${f((IC + VCE / rc) * 1000)} "mA"$. Die maximale Aussteuerung ohne Beschneiden ist der kleinere Wert von $I_C r_c$ und $V_"CE" − V_"CE,sat"$ um Q: $${f(Math.min(IC * rc, VCE - VCEsat))} "V"$ Scheitelwert.` });
    } else pasos.push({ t: 'Kleinsignal', html: `Das Kleinsignalmodell gilt nur im aktiven Bereich; der Transistor ist im Bereich ${region}.` });
    const Q0 = IC, filasB = [50, 100, 150, 200, 300].map((b2) => { const q = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: b2, VBE, VCEsat }); return [f(b2), `${f(q.IC * 1000)} mA`, `${f(q.VCE)} V`, Q0 > 0 ? `${f(((q.IC - Q0) / Q0) * 100, 3)} %` : '—', q.region]; });
    const filasT = [-25, 0, 25, 50, 75, 100].map((T) => { const q = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta, VBE: VBE - 0.002 * (T - 25), VCEsat }); return [`${f(T)} °C`, `${f(VBE - 0.002 * (T - 25), 3)} V`, `${f(q.IC * 1000)} mA`, `${f(q.VCE)} V`, Q0 > 0 ? `${f(((q.IC - Q0) / Q0) * 100, 3)} %` : '—']; });
    const sBeta = Q0 > 0 ? (nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: 300, VBE, VCEsat }).IC - nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: 50, VBE, VCEsat }).IC) / Q0 : null;
    pasos.push({ t: 'Stabilität des Arbeitspunkts Q gegenüber β', html: `Ändert sich β (von einem Transistor zum anderen) bei gleicher Schaltung, verschiebt sich der Arbeitspunkt Q so:${tabla(['β', 'I<sub>C</sub>', 'V<sub>CE</sub>', 'Änderung von I<sub>C</sub>', 'Bereich'], filasB)}${sBeta !== null ? `Von β = 50 bis β = 300 ändert sich der Kollektorstrom um ${f(Math.abs(sBeta) * 100, 3)} % des Nennwerts. ${RE > 0 && conf === 'divisor' ? 'Mit Spannungsteiler und $R_E$ ist der Punkt stabil: Der Strom hängt vor allem von $V_"BB"$ und $R_E$ ab.' : 'Ohne Teiler und $R_E$ ist $I_C ≈ β I_B$ proportional zu β: Der Punkt ist sehr empfindlich.'}` : ''}` });
    pasos.push({ t: 'Stabilität des Arbeitspunkts Q gegenüber der Temperatur', html: `$V_"BE"$ sinkt um etwa 2 mV pro Grad (−2 mV/K, Bezug 25 °C):${tabla(['Temperatur', 'V<sub>BE</sub>', 'I<sub>C</sub>', 'V<sub>CE</sub>', 'Änderung von I<sub>C</sub>'], filasT)}` });
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
      ID = 0.5 * K * u * u; VGS = Vt + u; VDS = Vdd - ID * Rcc; region = 'Sättigung';
      if (VDS < u) {
        const qa = K * (RS * Rcc - 0.5 * Rcc * Rcc), qb = K * (Rcc * Vdd - x * Rcc - RS * Vdd) - 1, qc = K * (Vdd * x - 0.5 * Vdd * Vdd);
        const raices = (Math.abs(qa) < 1e-30 ? [-qc / qb] : [(-qb - Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa), (-qb + Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa)])
          .filter((i) => isFinite(i) && i >= 0 && Vdd - i * Rcc <= VGG - i * RS - Vt + 1e-12).sort((p, q) => p - q);
        ID = raices[0];
        VDS = Vdd - ID * Rcc; VGS = VGG - ID * RS; region = 'Triodenbereich (ohmsch)';
      }
    }
    const IDmax = Vdd / Rcc, pot = VDS * ID;
    const vgss = x > 0 ? [VGS - 0.5, VGS, VGS + 0.5, VGS + 1].filter((v, i, arr) => v > Vt && arr.indexOf(v) === i) : [Vt + 1, Vt + 2];
    const curvas = vgss.map((vg) => ({ pts: lineal(0, Vdd, 200).map((v) => [v, idMos(K, vg, Vt, v)]), etiqueta: `V_GS = ${f(vg)} V`, fuerte: x > 0 && Math.abs(vg - VGS) < 1e-12 }));
    const pasos = [{ t: 'Daten', html: `$V_"DD" = ${f(Vdd)} "V"$, $R_D = ${f(RD)} Ω$, $R_S = ${f(RS)} Ω$, $K = ${f(K * 1000)} "mA/V²"$ y $V_t = ${f(Vt)} "V"$` },
      { t: 'Thévenin-Äquivalent des Gates', html: `$V_"GG" = V_"DD" R_2/(R_1 + R_2) = ${f(VGG)} "V"$ und $R_"GG" = R_1 ∥ R_2 = ${f(RGG)} Ω$ (durch das Gate fließt kein Strom: $V_"GS" = V_"GG" − I_D R_S$)` }];
    if (region === 'corte') pasos.push({ t: 'Arbeitsbereich', html: `$V_"GG" = ${f(VGG)} "V" ≤ V_t$: Es gibt keinen Kanal. Der Transistor sperrt: $I_D = 0$ und $V_"DS" = V_"DD" = ${f(Vdd)} "V"$.` });
    else {
      pasos.push({ t: 'Drainstrom (unter der Annahme der Sättigung)', html: `$I_D = 1/2 K (V_"GS" − V_t)^2$ mit $V_"GS" = V_"GG" − I_D R_S$. Aus der Lösung der quadratischen Gleichung: $V_"GS" − V_t = ${f(u)} "V"$ und $I_D = ${f(0.5 * K * u * u * 1000)} "mA"$.` });
      if (region === 'Sättigung') pasos.push({ t: 'Arbeitspunkt in Sättigung', html: `$V_"GS" = ${f(VGS)} "V"$, $I_D = ${f(ID * 1000)} "mA"$ und $V_"DS" = V_"DD" − I_D (R_D + R_S) = ${f(VDS)} "V"$, größer als $V_"GS" − V_t = ${f(u)} "V"$: Die Annahme ist richtig.` });
      else pasos.push({ t: 'Arbeitsbereich: Triodenbereich', html: `In Sättigung ergäbe sich $V_"DS" < V_"GS" − V_t$, also arbeitet der Transistor im Triodenbereich: $I_D = K [(V_"GS" − V_t) V_"DS" − V_"DS"^2/2]$. Gelöst mit den beiden Gleichungen der Schaltung: $I_D = ${f(ID * 1000)} "mA"$, $V_"GS" = ${f(VGS)} "V"$ und $V_"DS" = ${f(VDS)} "V"$.` });
    }
    pasos.push({ t: 'Lastgerade bei Gleichstrom', html: `$V_"DD" = V_"DS" + I_D (R_D + R_S)$. Sie schneidet die horizontale Achse bei $V_"DS" = V_"DD" = ${f(Vdd)} "V"$ und die vertikale bei $I_D = V_"DD"/(R_D + R_S) = ${f(IDmax * 1000)} "mA"$.` });
    pasos.push({ t: 'Teststärke', html: `$P_D = V_"DS" I_D = ${f(pot * 1000)} "mW"$` });
    let ac = null, rectaAC = null;
    if (region === 'Sättigung' && ID > 0) {
      const gm = K * u, ro = lam ? 1 / (lam * ID) : Infinity, rcarga = par(par(RD, RL === null ? Infinity : RL), ro);
      const AvP = -gm * rcarga, AvS = -(gm * par(par(RD, RL === null ? Infinity : RL), Infinity)) / (1 + gm * RS);
      const Rs_ = par(par(RS, RL === null ? Infinity : RL), ro), AvSeg = RS > 0 ? (gm * Rs_) / (1 + gm * Rs_) : null;
      const Rout = par(RD, ro);
      ac = { gm, ro, rc: rcarga, AvP, AvS, AvSeg, Rin: RGG, Rout, RL, lam };
      rectaAC = [[0, ID + VDS / rcarga], [VDS + ID * rcarga, 0]];
      pasos.push({ t: 'Kleinsignal: Transkonduktanz', html: `In Sättigung ist $g_m = ∂I_D/∂V_"GS" = K (V_"GS" − V_t) = 2 I_D/(V_"GS" − V_t) = ${f(gm * 1000)} "mS"$${lam ? ` und $r_o = 1/(λ I_D) = ${f(ro)} Ω$ mit $λ = ${f(lam)}$ V⁻¹` : ' ($r_o$ wird vernachlässigt: λ wurde nicht angegeben)'}.` });
      pasos.push({ t: 'Spannungsverstärkung', html: `Sourceschaltung mit überbrücktem $R_S$: $A_v = −g_m (R_D ∥ R_L${lam ? ' ∥ r_o' : ''}) = ${f(AvP)}$. Ohne Überbrückung: $A_v = −g_m (R_D ∥ R_L)/(1 + g_m R_S) = ${f(AvS)}$${AvSeg !== null ? `. Als Sourcefolger (Ausgang an $R_S$): $A_v = g_m (R_S ∥ R_L)/(1 + g_m (R_S ∥ R_L)) = ${f(AvSeg)}$` : ''}.${RL === null ? ' (Ohne Last $R_L$: Sie wird als unendlich angenommen.)' : ''}` });
      pasos.push({ t: 'Eingangs- und Ausgangswiderstand', html: `Eingang: $R_"in" = R_"GG" = R_1 ∥ R_2 = ${f(RGG)} Ω$ (das Gate nimmt keinen Strom auf). Ausgang (Sourceschaltung): $R_"out" = R_D ∥ r_o = ${f(Rout)} Ω$.` });
      pasos.push({ t: 'Lastgerade bei Wechselstrom', html: `Mit überbrücktem $R_S$ ist die Last für das Signal $r_d = R_D ∥ R_L${lam ? ' ∥ r_o' : ''} = ${f(rcarga)} Ω$: eine Gerade mit der Steigung $−1/r_d$ durch Q, die die Achsen bei $V_"DS" = ${f(VDS + ID * rcarga)} "V"$ und $I_D = ${f((ID + VDS / rcarga) * 1000)} "mA"$ schneidet.` });
    } else pasos.push({ t: 'Kleinsignal', html: `Das Kleinsignalmodell gilt in Sättigung; der Transistor ist im Bereich ${region}.` });
    const out = {
      modo: 'mosfet', pol: pmos ? 'p' : 'n', region, Q: { x: VDS, y: ID }, ID, VGS, VDS, VGG, RGG, Rcc, IDmax, pot, ac, pasos,
      graf: { xl: pmos ? 'V_SD' : 'V_DS', yl: 'I_D', xu: 'V', curvas, recta: [[0, IDmax], [Vdd, 0]], rectaAC, Q: { x: VDS, y: ID }, xmax: Vdd, ymax: IDmax },
    };
    if (pmos) {
      out.pasos.unshift({ t: 'MOSFET de canal p', html: `Bei einem p-Kanal-MOSFET liegt die Source an der Versorgung, und die nützlichen Spannungen sind $V_"SG"$ und $V_"SD"$ (mit $V_t$ als Betrag der Schwellenspannung). Man löst die Spiegelschaltung des n-Kanals mit vertauschten $R_1$ und $R_2$ (der Teiler wird von $V_"DD"$ aus gemessen) und deutet sie mit umgekehrtem Vorzeichen: Der Strom tritt an der Source ein.` });
      for (const q of out.pasos) q.html = espejo(q.html);
      out.VSD = VDS; out.VSG = VGS;
    }
    return out;
  }

  function zener(sc) {
    const { Vs, R, RL, Vz } = lista(sc, ['Vs', 'R', 'RL', 'Vz']), rz = vacio(sc.rz) ? 0 : lee(sc, 'rz');
    if (Vs <= 0) throw new Error('Die Eingangsspannung muss größer als 0 sein: Die Z-Diode wird in Sperrrichtung angeschlossen');
    const Vth = (Vs * RL) / (R + RL), Rth = (R * RL) / (R + RL), reg = Vth > Vz;
    const Iz = reg ? (Vth - Vz) / (Rth + rz) : 0, Vo = reg ? Vz + rz * Iz : Vth;
    const IR = (Vs - Vo) / R, IL = Vo / RL, Pz = Vo * Iz;
    const regLinea = reg ? (rz / (Rth + rz)) * (RL / (R + RL)) : RL / (R + RL), Rout = par(R, rz || 1e-300);
    const Vsmin = (Vz * (R + RL)) / RL, ILmax = (Vs - Vz) / R, RLmin = (Vz * R) / (Vs - Vz > 0 ? Vs - Vz : Infinity);
    const region = reg ? 'Z-Durchbruch: Die Diode regelt' : 'kein Durchbruch: Die Z-Diode leitet nicht und der Ausgang folgt dem Eingang';
    const ymax = Vth / Rth, rEf = Math.max(rz, (0.01 * Vth) / ymax);
    const curva = lineal(0, Vth * 1.05, 400).map((v) => [v, v > Vz ? (v - Vz) / rEf : 0]);
    const pasos = [
      { t: 'Daten', html: `$V_S = ${f(Vs)} "V"$, $R = ${f(R)} Ω$, $R_L = ${f(RL)} Ω$, $V_Z = ${f(Vz)} "V"$ und $r_z = ${f(rz)} Ω$ (dynamischer Widerstand im Durchbruch; 0 = ideale Z-Diode).` },
      { t: 'Thévenin-Äquivalent aus Sicht der Z-Diode', html: `Entfernt man die Diode, ergeben die Quelle mit $R$ und die Last $V_"th" = V_S R_L/(R + R_L) = ${f(Vth)} "V"$ und $R_"th" = R ∥ R_L = ${f(Rth)} Ω$. Das ist die Lastgerade: $I_Z = (V_"th" − V_Z)/R_"th"$, wenn die Diode nicht existierte.` },
      { t: 'Arbeitsbereich', html: reg ? `Da $V_"th" = ${f(Vth)} "V" > V_Z$, geht die Z-Diode in den Durchbruch und legt den Ausgang fest: $I_Z = (V_"th" − V_Z)/(R_"th" + r_z) = ${f(Iz * 1000)} "mA"$ und $V_o = V_Z + r_z I_Z = ${f(Vo)} "V"$.` : `Da $V_"th" = ${f(Vth)} "V" ≤ V_Z$, erreicht die Z-Diode den Durchbruch nicht: Sie regelt nicht, $I_Z = 0$ und $V_o = V_"th" = ${f(Vo)} "V"$. Für die Regelung mit dieser Last ist $V_S ≥ ${f(Vsmin)} "V"$ nötig.` },
      { t: 'Ströme und Leistung', html: `Strom durch $R$: $I_R = (V_S − V_o)/R = ${f(IR * 1000)} "mA"$; durch die Last: $I_L = V_o/R_L = ${f(IL * 1000)} "mA"$; durch die Z-Diode: $I_Z = I_R − I_L = ${f(Iz * 1000)} "mA"$ (Kontrolle: ${f((IR - IL) * 1000)} mA). Leistung an der Z-Diode: $P_Z = V_o I_Z = ${f(Pz * 1000)} "mW"$ (sie darf die Nennleistung der Diode nicht überschreiten).` },
      { t: 'Leitungs- und Lastregelung', html: `Leitungsregelung: $ΔV_o/ΔV_S = ${f(regLinea)}$ (${f(regLinea * 1000)} mV pro Volt Änderung des Eingangs). Ausgangswiderstand: $R_"out" = R ∥ r_z = ${f(Rout)} Ω$, sodass der Ausgang sinkt um $${f(Rout * 1e-3 * 1000)} "mV"$, wenn die Last 1 mA mehr zieht.` },
      { t: 'Grenzen der Regelung', html: `Die Z-Diode regelt, solange $I_Z > 0$: Mit $V_S = ${f(Vs)} "V"$ kann der Laststrom bis $I_"L,max" = (V_S − V_Z)/R = ${f(ILmax * 1000)} "mA"$ gehen (minimale Last $R_L ≥ ${f(RLmin)} Ω$), und bei dieser Last darf der Eingang nicht unter $V_"S,min" = V_Z (R + R_L)/R_L = ${f(Vsmin)} "V"$ sinken.` },
    ];
    return { modo: 'zener', region, reg, Q: { x: Vo, y: Iz }, Vo, Iz, IR, IL, Pz, Vth, Rth, regLinea, Rout, Vsmin, ILmax, pasos,
      graf: { xl: 'V_Z', yl: 'I_Z', xu: 'V', curvas: [{ pts: curva, etiqueta: 'Kennlinie der Z-Diode in Sperrrichtung', fuerte: true }], recta: [[0, ymax], [Vth, 0]], Q: { x: Vo, y: Iz }, xmax: Vth * 1.05, ymax } };
  }

  function resolver(sc) {
    const r = sc.modo === 'bjt' ? bjt(sc) : sc.modo === 'mosfet' ? mosfet(sc) : sc.modo === 'zener' ? zener(sc) : diodo(sc);
    r.sc = sc; return r;
  }

  const ejemplos = [
    { clave: 'diodo-5v', nombre: 'Silizium-Diode mit 5 V und 1 kΩ', sc: { modo: 'diodo', Vs: '5', R: '1k', Is: '10', n: '1' } },
    { clave: 'led-3v3', nombre: 'Rote LED mit 3,3 V und 220 Ω', sc: { modo: 'diodo', Vs: '3,3', R: '220', Is: '1e-18A', n: '2' } },
    { clave: 'bjt-fija', nombre: 'BJT mit fester Einstellung (aktiv)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '470k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-divisor', nombre: 'BJT mit Spannungsteiler', sc: { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-saturacion', nombre: 'BJT in Sättigung (Schalter)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '100k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'mosfet-saturacion', nombre: 'MOSFET mit Teiler (Sättigung)', sc: { modo: 'mosfet', Vdd: '12', R1: '2M', R2: '1M', RD: '4k7', RS: '1k', K: '2', Vt: '2' } },
    { clave: 'mosfet-triodo', nombre: 'MOSFET en triodo', sc: { modo: 'mosfet', Vdd: '12', R1: '1M', R2: '1M', RD: '10k', RS: '0', K: '2', Vt: '2' } },
    { clave: 'zener-5v1', nombre: '5,1-V-Z-Dioden-Regler mit 12 V und 1 kΩ Last', sc: { modo: 'zener', Vs: '12', R: '470', RL: '1k', Vz: '5,1', rz: '10' } },
    { clave: 'bjt-pnp', nombre: 'PNP-BJT mit Spannungsteiler (Spiegel des NPN)', sc: { modo: 'bjt', pol: 'p', conf: 'divisor', Vcc: '12', R1: '10k', R2: '47k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-senal', nombre: 'Emitterschaltung mit Last: Verstärkung und Wechselstromgerade', sc: { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2', RL: '10k', VA: '100' } },
    { clave: 'mosfet-canal-p', nombre: 'P-Kanal-MOSFET (Spiegel des n-Kanals)', sc: { modo: 'mosfet', pol: 'p', Vdd: '12', R1: '1M', R2: '2M', RD: '4k7', RS: '1k', K: '2', Vt: '2', RL: '', lam: '' } },
  ];

  return { resolver, ejemplos, nucleoBJT, MODOS, CAMPOS, shockley, VT, f };
})();

