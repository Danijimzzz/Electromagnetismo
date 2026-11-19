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

  const MODOS = { diodo: 'Diode avec résistance', zener: 'Régulateur avec diode Zener', bjt: 'Transistor BJT', mosfet: 'Transistor MOSFET' };
  const CAMPOS = {
    Vs: ['la tension de la source', 1, 'V', true, true], R: ['la resistencia', 1, 'Ω', false, false], Is: ['le courant de saturation', 1e-12, 'pA', false, false], n: ['le facteur d\'idéalité', 1, '', false, false],
    Vcc: ['la tension d\'alimentation', 1, 'V', false, false], RB: ['la résistance de base', 1, 'Ω', false, false], R1: ['la resistencia R1', 1, 'Ω', false, false], R2: ['la resistencia R2', 1, 'Ω', false, false],
    RC: ['la résistance de collecteur', 1, 'Ω', false, false], RE: ['la résistance d\'émetteur', 1, 'Ω', true, false], beta: ['le gain β', 1, '', false, false], VBE: ['la tension base-émetteur', 1, 'V', false, false],
    VCEsat: ['la tension de saturation', 1, 'V', true, false],
    Vdd: ['la tension d\'alimentation', 1, 'V', false, false], RD: ['la résistance de drain', 1, 'Ω', false, false], RS: ['la résistance de source', 1, 'Ω', true, false],
    K: ['le paramètre de transconductance', 1e-3, 'mA/V²', false, false], Vt: ['la tension de seuil', 1, 'V', false, false],
    RL: ['la résistance de charge', 1, 'Ω', false, false], VA: ['la tension d\'Early', 1, 'V', false, false], lam: ['le paramètre λ', 1, '1/V', true, false],
    Vz: ['la tension Zener', 1, 'V', false, false], rz: ['la résistance dynamique de la Zener', 1, 'Ω', true, false],
  };
  function lee(sc, k) {
    const [nom, base, , cero, neg] = CAMPOS[k], N = nom[0].toUpperCase() + nom.slice(1);
    if (vacio(sc[k])) throw new Error(`Il manque : ${nom}`);
    const v = Herramienta.leeSI(sc[k], base);
    if (!isFinite(v)) throw new Error(`${N} doit être un nombre`);
    if (!neg && v < 0) throw new Error(`${N} ne peut pas être négatif`);
    if (!neg && !cero && v === 0) throw new Error(`${N} doit être supérieur à 0`);
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
    if (n < 0.5 || n > 3) throw new Error('Le facteur d\'idéalité est généralement compris entre 1 et 2');
    let a = Math.min(0, Vs), b = Math.max(0, Vs);
    for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (shockley(Is, n, m) - (Vs - m) / R > 0) b = m; else a = m; }
    const Vd = (a + b) / 2, Id = (Vs - Vd) / R;
    const Vcte = 0.7, Icte = Math.max((Vs - Vcte) / R, 0), Iideal = Math.max(Vs / R, 0);
    const region = Vs <= 0 || Vd < 0.3 * n ? (Vd <= 0 ? 'polarisation inverse (blocage)' : 'casi en corte') : 'polarisation directe (conduction)';
    const vmax = Vs > 0 ? Vs : Math.max(-Vs, 0.1), signo = Vs > 0 ? 1 : -1;
    const xs = lineal(0, vmax, 400).map((x) => x * signo);
    const curva = xs.map((x) => [x, shockley(Is, n, x)]);
    const imax = Vs / R, rd = Id > 0 ? (n * VT) / Id : Infinity;   // resistencia dinámica rd = n·VT/ID
    const pasos = [
      { t: 'Données', html: `$V_S = ${f(Vs)} "V"$, $R = ${f(R)} Ω$, $I_S = ${f(Is)} "A"$, $n = ${f(n)}$ y $V_T = kT/q = ${f(VT * 1000)} "mV"$ (a 300 K)` },
      { t: 'Droite de charge', html: `La loi de Kirchhoff de la maille donne $V_S = V_D + I_D R$, c'est-à-dire $I_D = (V_S − V_D)/R$. Elle coupe l'axe des tensions en $V_D = V_S = ${f(Vs)} "V"$ et celui des courants en $I_D = V_S/R = ${f(Vs / R * 1000)} "mA"$.` },
      { t: 'Courbe de la diode', html: `$I_D = I_S (e^(V_D/(n V_T)) − 1)$ (équation de Shockley)` },
      { t: 'Point de fonctionnement', html: `En coupant la courbe avec la droite (on résout l'équation $I_S (e^(V_D/(n V_T)) − 1) = (V_S − V_D)/R$ par dichotomie), on obtient $V_D = ${f(Vd)} "V"$ et $I_D = (V_S − V_D)/R = ${f(Id * 1000)} "mA"$.` },
      { t: 'Région de fonctionnement', html: `La diode est en ${region}.` },
      { t: 'Résistance dynamique', html: Id > 0 ? `Pour de petites variations autour de Q, la diode se comporte comme une résistance $r_d = n V_T/I_D = ${f(rd)} Ω$ (la pente de la courbe en Q est $1/r_d$).` : 'Avec un courant nul, la résistance dynamique est très grande : la diode ne conduit pas.' },
      { t: 'Comparaison avec des modèles simples', html: `Avec la diode idéale ($V_D = 0$) : $I_D = ${f(Iideal * 1000)} "mA"$. Avec une tension constante $V_D = 0,7 "V"$ : $I_D = (V_S − 0,7)/R = ${f(Icte * 1000)} "mA"$. Avec Shockley : $I_D = ${f(Math.max(Id, 0) * 1000)} "mA"$.` },
    ];
    return {
      modo: 'diodo', region, Q: { x: Vd, y: Id }, rd, Vd, Id, Iideal, Icte, Vcte, pasos,
      recta: { m: -1 / R, x0: Vs, y0: Vs / R, texto: 'Droite de charge' },
      graf: { xl: 'V_D', yl: 'I_D', xu: 'V', curvas: [{ pts: curva, etiqueta: 'Courbe de la diode', fuerte: true }], recta: [[0, Vs / R], [Vs, 0]], Q: { x: Vd, y: Id }, xmax: vmax * signo, ymax: imax },
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
    if (beta < 5) throw new Error('Le gain β doit être au moins 5');
    const nuc = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta, VBE, VCEsat }), { IB, IC, VCE, region, IBa } = nuc;
    const IE = IC + IB, Rcc = RC + (RE * (beta + 1)) / beta, ICsat = (Vcc - VCEsat) / Rcc, ICmax = Vcc / Rcc;
    const pot = VCE * IC;
    const IBs = [0.5, 1, 1.5, 2].map((k) => k * (IBa > 0 ? IBa : (VBB - VBE > 0 ? 0 : 1e-5)));
    const vmax = Vcc, curvas = IBs.filter((ib) => ib > 0).map((ib) => {
      const pts = lineal(0, vmax, 200).map((v) => [v, Math.min(beta * ib, beta * ib * (v / Math.max(VCEsat, 0.05)))]);
      return { pts, etiqueta: `I_B = ${f(ib * 1e6)} µA`, fuerte: Math.abs(ib - IBa) < 1e-15 };
    });
    const pasos = [{ t: 'Données', html: `$V_"CC" = ${f(Vcc)} "V"$, $R_C = ${f(RC)} Ω$, $R_E = ${f(RE)} Ω$, $β = ${f(beta)}$, $V_"BE" = ${f(VBE)} "V"$ y $V_"CE,sat" = ${f(VCEsat)} "V"$` }];
    if (pnp) pasos.unshift({ t: 'Transistor pnp', html: `Dans un pnp, l'émetteur est relié à l'alimentation et tout est « à l'envers » : les courants entrent par l'émetteur et les tensions utiles sont $V_"EB"$ et $V_"EC"$. On résout le circuit miroir d'un npn (mêmes valeurs de résistances, avec $R_1$ et $R_2$ échangées car elles sont mesurées depuis $V_"CC"$) et on interprète les résultats avec le signe changé : $V_"EB" = ${f(VBE)} "V"$ en conduction et $V_"EC" > 0$ en régime actif.` });
    if (conf === 'fija') pasos.push({ t: 'Circuit de base', html: `Polarisation fixe : $V_"BB" = V_"CC" = ${f(VBB)} "V"$ et $R_B = ${f(RBB)} Ω$` });
    else pasos.push({ t: 'Équivalent de Thévenin de la base', html: `$V_"BB" = V_"CC" R_2/(R_1 + R_2) = ${f(VBB)} "V"$ y $R_"BB" = R_1 ∥ R_2 = ${f(RBB)} Ω$${pnp ? ' (pour le pnp, mesuré depuis $V_"CC"$ vers le bas, le diviseur a $R_1$ et $R_2$ échangées)' : ''}` });
    pasos.push({ t: 'Courant de base (en supposant le régime actif)', html: `$I_B = (V_"BB" − V_"BE")/(R_"BB" + (β + 1) R_E) = ${f(IBa * 1e6)} µA$` });
    if (region === 'corte') pasos.push({ t: 'Région de fonctionnement', html: `$V_"BB" ≤ V_"BE"$ : la jonction base-émetteur ne conduit pas. Le transistor est bloqué : $I_C = 0$ et $V_"CE" = V_"CC" = ${f(Vcc)} "V"$.` });
    else if (region === 'activa') pasos.push({ t: 'Point de fonctionnement en régime actif', html: `$I_C = β I_B = ${f(IC * 1000)} "mA"$, $I_E = (β + 1) I_B = ${f(IE * 1000)} "mA"$ et $V_"CE" = V_"CC" − I_C R_C − I_E R_E = ${f(VCE)} "V"$ (supérieur à $V_"CE,sat"$ : l'hypothèse est correcte).` });
    else pasos.push({ t: 'Région de fonctionnement : saturation', html: `En régime actif, on aurait $V_"CE" < V_"CE,sat" = ${f(VCEsat)} "V"$, donc le transistor sature. On fixe $V_"CE" = V_"CE,sat"$ et on résout : $I_C = ${f(IC * 1000)} "mA"$, $I_B = ${f(IB * 1e6)} µA$ (avec $I_C < β I_B$ : $β_"forcé" = ${f(IC / IB)}$).` });
    pasos.push({ t: 'Droite de charge en continu', html: `$V_"CC" = V_"CE" + I_C R_C + I_E R_E ≈ V_"CE" + I_C (R_C + R_E (β + 1)/β)$. Elle coupe l'axe horizontal en $V_"CE" = V_"CC" = ${f(Vcc)} "V"$ (blocage) et l'axe vertical en $I_C = V_"CC"/R_"cc" = ${f(ICmax * 1000)} "mA"$, avec $R_"cc" = ${f(Rcc)} Ω$.` });
    pasos.push({ t: 'Puissance et répartition', html: `$P_C = V_"CE" I_C = ${f(pot * 1000)} "mW"$. Le point est à ${f((IC / ICsat) * 100, 3)} % du courant de saturation $I_"C,sat" = ${f(ICsat * 1000)} "mA"$ ; le centre de la droite (excursion symétrique maximale) serait $I_C = ${f((ICmax / 2) * 1000)} "mA"$.` });
    let ac = null, rectaAC = null;
    if (region === 'activa') {
      const gm = IC / VT, rpi = beta / gm, ro = VA ? (VA + VCE) / IC : Infinity;
      const rc = par(par(RC, RL === null ? Infinity : RL), ro), rcSin = par(RC, RL === null ? Infinity : RL);
      const AvP = -gm * rc, AvS = -(beta * rcSin) / (rpi + (beta + 1) * RE);
      const Re_ = par(par(RE, RL === null ? Infinity : RL), ro), AvSeg = RE > 0 ? ((beta + 1) * Re_) / (rpi + (beta + 1) * Re_) : null;
      const RinP = par(RBB, rpi), RinS = par(RBB, rpi + (beta + 1) * RE), RinSeg = par(RBB, rpi + (beta + 1) * Re_), Rout = par(RC, ro);
      ac = { gm, rpi, ro, rc, AvP, AvS, AvSeg, RinP, RinS, RinSeg, Rout, RL, VA };
      rectaAC = [[0, IC + VCE / rc], [VCE + IC * rc, 0]];
      pasos.push({ t: 'Petit signal : paramètres du modèle hybride', html: `Au point Q : $g_m = I_C/V_T = ${f(gm * 1000)} "mS"$ (avec $V_T = ${f(VT * 1000)} "mV"$), $r_π = β/g_m = ${f(rpi)} Ω$${VA ? ` et $r_o = (V_A + V_"CE")/I_C = ${f(ro)} Ω$ avec $V_A = ${f(VA)} "V"$` : ' (on néglige $r_o$ : la tension d\'Early n\'est pas donnée)'}.` });
      pasos.push({ t: 'Gain en tension', html: `Avec $R_E$ découplée par un condensateur (émetteur commun) : $A_v = −g_m (R_C ∥ R_L${VA ? ' ∥ r_o' : ''}) = ${f(AvP)}$. Sans découplage : $A_v = −β (R_C ∥ R_L)/(r_π + (β + 1) R_E) = ${f(AvS)}$${AvSeg !== null ? `. Comme suiveur d'émetteur (sortie sur $R_E$) : $A_v = (β+1)(R_E ∥ R_L)/(r_π + (β+1)(R_E ∥ R_L)) = ${f(AvSeg)}$` : ''}.${RL === null ? ' (Sans charge $R_L$ : on la prend infinie.)' : ''}` });
      pasos.push({ t: 'Résistances d\'entrée et de sortie', html: `Entrée avec $R_E$ découplée : $R_"in" = R_"BB" ∥ r_π = ${f(RinP)} Ω$ ; sans découplage : $R_"in" = R_"BB" ∥ [r_π + (β+1) R_E] = ${f(RinS)} Ω$. Sortie (émetteur commun) : $R_"out" = R_C ∥ r_o = ${f(Rout)} Ω$.` });
      pasos.push({ t: 'Droite de charge en alternatif', html: `Pour le signal, la charge du collecteur est $r_c = R_C ∥ R_L${VA ? ' ∥ r_o' : ''} = ${f(rc)} Ω$ (avec $R_E$ découplée) : la droite en alternatif passe par Q avec la pente $−1/r_c$ et coupe les axes en $V_"CE" = ${f(VCE + IC * rc)} "V"$ et $I_C = ${f((IC + VCE / rc) * 1000)} "mA"$. L'excursion maximale sans écrêtage est la plus petite des valeurs $I_C r_c$ et $V_"CE" − V_"CE,sat"$ autour de Q : $${f(Math.min(IC * rc, VCE - VCEsat))} "V"$ crête.` });
    } else pasos.push({ t: 'Petit signal', html: `Le modèle petit signal n'est valable qu'en régime actif ; le transistor est en ${region}.` });
    const Q0 = IC, filasB = [50, 100, 150, 200, 300].map((b2) => { const q = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: b2, VBE, VCEsat }); return [f(b2), `${f(q.IC * 1000)} mA`, `${f(q.VCE)} V`, Q0 > 0 ? `${f(((q.IC - Q0) / Q0) * 100, 3)} %` : '—', q.region]; });
    const filasT = [-25, 0, 25, 50, 75, 100].map((T) => { const q = nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta, VBE: VBE - 0.002 * (T - 25), VCEsat }); return [`${f(T)} °C`, `${f(VBE - 0.002 * (T - 25), 3)} V`, `${f(q.IC * 1000)} mA`, `${f(q.VCE)} V`, Q0 > 0 ? `${f(((q.IC - Q0) / Q0) * 100, 3)} %` : '—']; });
    const sBeta = Q0 > 0 ? (nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: 300, VBE, VCEsat }).IC - nucleoBJT({ VBB, RBB, Vcc, RC, RE, beta: 50, VBE, VCEsat }).IC) / Q0 : null;
    pasos.push({ t: 'Stabilité du point Q selon β', html: `Si β change (d'un transistor à un autre) alors que le circuit reste le même, le point Q se déplace ainsi :${tabla(['β', 'I<sub>C</sub>', 'V<sub>CE</sub>', 'Variation de I<sub>C</sub>', 'Région'], filasB)}${sBeta !== null ? `De β = 50 à β = 300, le courant de collecteur varie de ${f(Math.abs(sBeta) * 100, 3)} % du nominal. ${RE > 0 && conf === 'divisor' ? 'Avec un pont diviseur et $R_E$, le point est stable : le courant dépend surtout de $V_"BB"$ et de $R_E$.' : 'Sans pont diviseur ni $R_E$, $I_C ≈ β I_B$ est proportionnel à β : le point est très sensible.'}` : ''}` });
    pasos.push({ t: 'Stabilité du point Q selon la température', html: `$V_"BE"$ baisse d'environ 2 mV par degré (−2 mV/K, référence 25 °C) :${tabla(['Température', 'V<sub>BE</sub>', 'I<sub>C</sub>', 'V<sub>CE</sub>', 'Variation de I<sub>C</sub>'], filasT)}` });
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
        VDS = Vdd - ID * Rcc; VGS = VGG - ID * RS; region = 'triode (ohmique)';
      }
    }
    const IDmax = Vdd / Rcc, pot = VDS * ID;
    const vgss = x > 0 ? [VGS - 0.5, VGS, VGS + 0.5, VGS + 1].filter((v, i, arr) => v > Vt && arr.indexOf(v) === i) : [Vt + 1, Vt + 2];
    const curvas = vgss.map((vg) => ({ pts: lineal(0, Vdd, 200).map((v) => [v, idMos(K, vg, Vt, v)]), etiqueta: `V_GS = ${f(vg)} V`, fuerte: x > 0 && Math.abs(vg - VGS) < 1e-12 }));
    const pasos = [{ t: 'Données', html: `$V_"DD" = ${f(Vdd)} "V"$, $R_D = ${f(RD)} Ω$, $R_S = ${f(RS)} Ω$, $K = ${f(K * 1000)} "mA/V²"$ y $V_t = ${f(Vt)} "V"$` },
      { t: 'Équivalent de Thévenin de la grille', html: `$V_"GG" = V_"DD" R_2/(R_1 + R_2) = ${f(VGG)} "V"$ et $R_"GG" = R_1 ∥ R_2 = ${f(RGG)} Ω$ (aucun courant ne passe par la grille : $V_"GS" = V_"GG" − I_D R_S$)` }];
    if (region === 'corte') pasos.push({ t: 'Région de fonctionnement', html: `$V_"GG" = ${f(VGG)} "V" ≤ V_t$ : il n'y a pas de canal. Le transistor est bloqué : $I_D = 0$ et $V_"DS" = V_"DD" = ${f(Vdd)} "V"$.` });
    else {
      pasos.push({ t: 'Courant de drain (en supposant la saturation)', html: `$I_D = 1/2 K (V_"GS" − V_t)^2$ avec $V_"GS" = V_"GG" − I_D R_S$. En résolvant l'équation du second degré : $V_"GS" − V_t = ${f(u)} "V"$ et $I_D = ${f(0.5 * K * u * u * 1000)} "mA"$.` });
      if (region === 'saturation') pasos.push({ t: 'Point de fonctionnement en saturation', html: `$V_"GS" = ${f(VGS)} "V"$, $I_D = ${f(ID * 1000)} "mA"$ et $V_"DS" = V_"DD" − I_D (R_D + R_S) = ${f(VDS)} "V"$, supérieur à $V_"GS" − V_t = ${f(u)} "V"$ : l'hypothèse est correcte.` });
      else pasos.push({ t: 'Région de fonctionnement : triode', html: `En saturation, on aurait $V_"DS" < V_"GS" − V_t$, donc le transistor fonctionne en régime triode : $I_D = K [(V_"GS" − V_t) V_"DS" − V_"DS"^2/2]$. Résolu avec les deux équations du circuit : $I_D = ${f(ID * 1000)} "mA"$, $V_"GS" = ${f(VGS)} "V"$ et $V_"DS" = ${f(VDS)} "V"$.` });
    }
    pasos.push({ t: 'Droite de charge en continu', html: `$V_"DD" = V_"DS" + I_D (R_D + R_S)$. Elle coupe l'axe horizontal en $V_"DS" = V_"DD" = ${f(Vdd)} "V"$ et l'axe vertical en $I_D = V_"DD"/(R_D + R_S) = ${f(IDmax * 1000)} "mA"$.` });
    pasos.push({ t: 'Puissance', html: `$P_D = V_"DS" I_D = ${f(pot * 1000)} "mW"$` });
    let ac = null, rectaAC = null;
    if (region === 'saturation' && ID > 0) {
      const gm = K * u, ro = lam ? 1 / (lam * ID) : Infinity, rcarga = par(par(RD, RL === null ? Infinity : RL), ro);
      const AvP = -gm * rcarga, AvS = -(gm * par(par(RD, RL === null ? Infinity : RL), Infinity)) / (1 + gm * RS);
      const Rs_ = par(par(RS, RL === null ? Infinity : RL), ro), AvSeg = RS > 0 ? (gm * Rs_) / (1 + gm * Rs_) : null;
      const Rout = par(RD, ro);
      ac = { gm, ro, rc: rcarga, AvP, AvS, AvSeg, Rin: RGG, Rout, RL, lam };
      rectaAC = [[0, ID + VDS / rcarga], [VDS + ID * rcarga, 0]];
      pasos.push({ t: 'Petit signal : transconductance', html: `En saturation, $g_m = ∂I_D/∂V_"GS" = K (V_"GS" − V_t) = 2 I_D/(V_"GS" − V_t) = ${f(gm * 1000)} "mS"$${lam ? ` et $r_o = 1/(λ I_D) = ${f(ro)} Ω$ avec $λ = ${f(lam)}$ V⁻¹` : ' (on néglige $r_o$ : λ n\'est pas donné)'}.` });
      pasos.push({ t: 'Gain en tension', html: `Source commune avec $R_S$ découplée : $A_v = −g_m (R_D ∥ R_L${lam ? ' ∥ r_o' : ''}) = ${f(AvP)}$. Sans découplage : $A_v = −g_m (R_D ∥ R_L)/(1 + g_m R_S) = ${f(AvS)}$${AvSeg !== null ? `. Comme suiveur de source (sortie sur $R_S$) : $A_v = g_m (R_S ∥ R_L)/(1 + g_m (R_S ∥ R_L)) = ${f(AvSeg)}$` : ''}.${RL === null ? ' (Sans charge $R_L$ : on la prend infinie.)' : ''}` });
      pasos.push({ t: 'Résistances d\'entrée et de sortie', html: `Entrée : $R_"in" = R_"GG" = R_1 ∥ R_2 = ${f(RGG)} Ω$ (la grille ne consomme pas de courant). Sortie (source commune) : $R_"out" = R_D ∥ r_o = ${f(Rout)} Ω$.` });
      pasos.push({ t: 'Droite de charge en alternatif', html: `Avec $R_S$ découplée, la charge pour le signal est $r_d = R_D ∥ R_L${lam ? ' ∥ r_o' : ''} = ${f(rcarga)} Ω$ : droite de pente $−1/r_d$ passant par Q, qui coupe les axes en $V_"DS" = ${f(VDS + ID * rcarga)} "V"$ et $I_D = ${f((ID + VDS / rcarga) * 1000)} "mA"$.` });
    } else pasos.push({ t: 'Petit signal', html: `Le modèle petit signal est valable en saturation ; le transistor est en ${region}.` });
    const out = {
      modo: 'mosfet', pol: pmos ? 'p' : 'n', region, Q: { x: VDS, y: ID }, ID, VGS, VDS, VGG, RGG, Rcc, IDmax, pot, ac, pasos,
      graf: { xl: pmos ? 'V_SD' : 'V_DS', yl: 'I_D', xu: 'V', curvas, recta: [[0, IDmax], [Vdd, 0]], rectaAC, Q: { x: VDS, y: ID }, xmax: Vdd, ymax: IDmax },
    };
    if (pmos) {
      out.pasos.unshift({ t: 'MOSFET de canal p', html: `Dans un MOSFET à canal p, la source est reliée à l'alimentation et les tensions utiles sont $V_"SG"$ et $V_"SD"$ (avec $V_t$ comme valeur absolue du seuil). On résout le circuit miroir du canal n avec $R_1$ et $R_2$ échangées (le diviseur est mesuré depuis $V_"DD"$) et on interprète avec le signe changé : le courant entre par la source.` });
      for (const q of out.pasos) q.html = espejo(q.html);
      out.VSD = VDS; out.VSG = VGS;
    }
    return out;
  }

  function zener(sc) {
    const { Vs, R, RL, Vz } = lista(sc, ['Vs', 'R', 'RL', 'Vz']), rz = vacio(sc.rz) ? 0 : lee(sc, 'rz');
    if (Vs <= 0) throw new Error('La tension d\'entrée doit être supérieure à 0 : la Zener est branchée en inverse');
    const Vth = (Vs * RL) / (R + RL), Rth = (R * RL) / (R + RL), reg = Vth > Vz;
    const Iz = reg ? (Vth - Vz) / (Rth + rz) : 0, Vo = reg ? Vz + rz * Iz : Vth;
    const IR = (Vs - Vo) / R, IL = Vo / RL, Pz = Vo * Iz;
    const regLinea = reg ? (rz / (Rth + rz)) * (RL / (R + RL)) : RL / (R + RL), Rout = par(R, rz || 1e-300);
    const Vsmin = (Vz * (R + RL)) / RL, ILmax = (Vs - Vz) / R, RLmin = (Vz * R) / (Vs - Vz > 0 ? Vs - Vz : Infinity);
    const region = reg ? 'claquage Zener : la diode régule' : 'pas de claquage : la Zener ne conduit pas et la sortie suit l\'entrée';
    const ymax = Vth / Rth, rEf = Math.max(rz, (0.01 * Vth) / ymax);
    const curva = lineal(0, Vth * 1.05, 400).map((v) => [v, v > Vz ? (v - Vz) / rEf : 0]);
    const pasos = [
      { t: 'Données', html: `$V_S = ${f(Vs)} "V"$, $R = ${f(R)} Ω$, $R_L = ${f(RL)} Ω$, $V_Z = ${f(Vz)} "V"$ et $r_z = ${f(rz)} Ω$ (résistance dynamique en claquage ; 0 = Zener idéale).` },
      { t: 'Équivalent de Thévenin vu par la Zener', html: `En retirant la diode, la source avec $R$ et la charge donnent $V_"th" = V_S R_L/(R + R_L) = ${f(Vth)} "V"$ et $R_"th" = R ∥ R_L = ${f(Rth)} Ω$. C'est la droite de charge : $I_Z = (V_"th" − V_Z)/R_"th"$ si la diode n'existait pas.` },
      { t: 'Région de fonctionnement', html: reg ? `Comme $V_"th" = ${f(Vth)} "V" > V_Z$, la Zener entre en claquage et fixe la sortie : $I_Z = (V_"th" − V_Z)/(R_"th" + r_z) = ${f(Iz * 1000)} "mA"$ et $V_o = V_Z + r_z I_Z = ${f(Vo)} "V"$.` : `Comme $V_"th" = ${f(Vth)} "V" ≤ V_Z$, la Zener n'atteint pas le claquage : elle ne régule pas, $I_Z = 0$ et $V_o = V_"th" = ${f(Vo)} "V"$. Il faut $V_S ≥ ${f(Vsmin)} "V"$ pour réguler avec cette charge.` },
      { t: 'Courants et puissance', html: `Courant dans $R$ : $I_R = (V_S − V_o)/R = ${f(IR * 1000)} "mA"$ ; dans la charge : $I_L = V_o/R_L = ${f(IL * 1000)} "mA"$ ; dans la Zener : $I_Z = I_R − I_L = ${f(Iz * 1000)} "mA"$ (vérification : ${f((IR - IL) * 1000)} mA). Puissance dans la Zener : $P_Z = V_o I_Z = ${f(Pz * 1000)} "mW"$ (elle ne doit pas dépasser la puissance nominale de la diode).` },
      { t: 'Régulation de ligne et de charge', html: `Régulation de ligne : $ΔV_o/ΔV_S = ${f(regLinea)}$ (${f(regLinea * 1000)} mV par volt de variation de l'entrée). Résistance de sortie : $R_"out" = R ∥ r_z = ${f(Rout)} Ω$, donc quand la charge consomme 1 mA de plus, la sortie baisse de $${f(Rout * 1e-3 * 1000)} "mV"$.` },
      { t: 'Limites de la régulation', html: `La Zener régule tant que $I_Z > 0$ : avec $V_S = ${f(Vs)} "V"$, le courant de charge peut atteindre $I_"L,max" = (V_S − V_Z)/R = ${f(ILmax * 1000)} "mA"$ (charge minimale $R_L ≥ ${f(RLmin)} Ω$), et avec cette charge, l'entrée ne peut pas descendre sous $V_"S,min" = V_Z (R + R_L)/R_L = ${f(Vsmin)} "V"$.` },
    ];
    return { modo: 'zener', region, reg, Q: { x: Vo, y: Iz }, Vo, Iz, IR, IL, Pz, Vth, Rth, regLinea, Rout, Vsmin, ILmax, pasos,
      graf: { xl: 'V_Z', yl: 'I_Z', xu: 'V', curvas: [{ pts: curva, etiqueta: 'Courbe de la Zener en inverse', fuerte: true }], recta: [[0, ymax], [Vth, 0]], Q: { x: Vo, y: Iz }, xmax: Vth * 1.05, ymax } };
  }

  function resolver(sc) {
    const r = sc.modo === 'bjt' ? bjt(sc) : sc.modo === 'mosfet' ? mosfet(sc) : sc.modo === 'zener' ? zener(sc) : diodo(sc);
    r.sc = sc; return r;
  }

  const ejemplos = [
    { clave: 'diodo-5v', nombre: 'Diode au silicium avec 5 V et 1 kΩ', sc: { modo: 'diodo', Vs: '5', R: '1k', Is: '10', n: '1' } },
    { clave: 'led-3v3', nombre: 'LED rouge avec 3,3 V et 220 Ω', sc: { modo: 'diodo', Vs: '3,3', R: '220', Is: '1e-18A', n: '2' } },
    { clave: 'bjt-fija', nombre: 'BJT en polarisation fixe (actif)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '470k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-divisor', nombre: 'BJT avec pont diviseur de tension', sc: { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-saturacion', nombre: 'BJT en saturation (interrupteur)', sc: { modo: 'bjt', conf: 'fija', Vcc: '12', RB: '100k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'mosfet-saturacion', nombre: 'MOSFET avec pont diviseur (saturation)', sc: { modo: 'mosfet', Vdd: '12', R1: '2M', R2: '1M', RD: '4k7', RS: '1k', K: '2', Vt: '2' } },
    { clave: 'mosfet-triodo', nombre: 'MOSFET en triodo', sc: { modo: 'mosfet', Vdd: '12', R1: '1M', R2: '1M', RD: '10k', RS: '0', K: '2', Vt: '2' } },
    { clave: 'zener-5v1', nombre: 'Régulateur Zener de 5,1 V avec 12 V et 1 kΩ de charge', sc: { modo: 'zener', Vs: '12', R: '470', RL: '1k', Vz: '5,1', rz: '10' } },
    { clave: 'bjt-pnp', nombre: 'BJT pnp avec pont diviseur de tension (miroir du npn)', sc: { modo: 'bjt', pol: 'p', conf: 'divisor', Vcc: '12', R1: '10k', R2: '47k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' } },
    { clave: 'bjt-senal', nombre: 'Émetteur commun avec charge : gain et droite en alternatif', sc: { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2', RL: '10k', VA: '100' } },
    { clave: 'mosfet-canal-p', nombre: 'MOSFET à canal p (miroir du canal n)', sc: { modo: 'mosfet', pol: 'p', Vdd: '12', R1: '1M', R2: '2M', RD: '4k7', RS: '1k', K: '2', Vt: '2', RL: '', lam: '' } },
  ];

  return { resolver, ejemplos, nucleoBJT, MODOS, CAMPOS, shockley, VT, f };
})();

