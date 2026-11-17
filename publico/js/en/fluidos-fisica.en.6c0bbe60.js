const Fluidos = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} must be a number`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} must be ${cero ? 'positive or zero' : 'greater than 0'}`);
    return v;
  }
  const G = 9.8, ATM = 101325;
  const MATERIALES = [['gold', 19300], ['lead', 11340], ['silver', 10490], ['copper', 8960], ['iron', 7870], ['aluminium', 2700]];
  const gDe = (sc) => lee(sc, 'g', 'gravity', { opcional: true }) ?? G;
  const circulo = (dcm) => (Math.PI * (dcm / 100) ** 2) / 4; // área en m² de un círculo de diámetro en cm
  const areaPaso = (nom, A, dcm) => `$A_${nom} = {π d_${nom}^2}/{4} = {π · ${f(dcm / 100)}^2}/{4}$ = ${f(A)} m²`;

  function presion(sc) {
    const rho = lee(sc, 'rho', 'the density of the liquid'), h = lee(sc, 'h', 'the depth', { cero: true }), g = gDe(sc);
    const p0dato = lee(sc, 'p0', 'the pressure at the surface', { opcional: true, cero: true });
    const p0 = p0dato ?? ATM, A = lee(sc, 'A', 'the area of the bottom', { opcional: true });
    const pm = rho * g * h, pa = p0 + pm;
    const pasos = [
      { t: 'Pressure due to the liquid', html: `Hydrostatic pressure depends only on depth, not on the shape of the container: $p_{gauge} = ρ g h = ${f(rho)} · ${f(g)} · ${f(h)}$ = <b>${f(pm)} Pa</b>. It is the one a pressure gauge shows (gauge pressure).` },
      { t: 'Absolute pressure', html: `${p0dato === null ? 'Above the surface is the atmosphere, $p_0 = 101325$ Pa: ' : ''}$p = p_0 + ρ g h = ${f(p0)} + ${f(pm)}$ = <b>${f(pa)} Pa</b> = ${f(pa / ATM)} atm` },
    ];
    let F = null;
    if (A) {
      F = pm * A;
      pasos.push({ t: 'Force of the liquid on the bottom', html: `$F = p_{man} A = ${f(pm)} · ${f(A)}$ = <b>${f(F)} N</b><br>The atmosphere also pushes on the outside of the container, so its part cancels; including it, it would be $p A = ${f(pa * A)}$ N.` });
    }
    pasos.push({ t: 'How much it rises with depth', html: `In this liquid the pressure increases by 1 atm every $h = p_{atm}/(ρ g) = 101325/(${f(rho)} · ${f(g)})$ = ${f(ATM / (rho * g))} m.` });
    return { modo: 'presion', rho, h, g, p0, pm, pa, A, F, pasos };
  }

  function tuboU(sc) {
    const rho1 = lee(sc, 'rho1', 'the density of the liquid at the bottom'), h2 = lee(sc, 'h2', 'the height of the added column');
    let rho2, h1;
    const pasos = [{ t: 'Same level, same pressure', html: 'At the interface between the two liquids and at the same height in the other arm there is the same liquid at rest and connected, so the pressure is equal. Above, each arm has its column and at the top the atmosphere: $p_0 + ρ_2 g h_2 = p_0 + ρ_1 g h_1$, that is, $ρ_2 h_2 = ρ_1 h_1$.' }];
    if (sc.buscar === 'densidad') {
      h1 = lee(sc, 'h1', 'the height on the other side');
      if (h1 >= h2) throw new Error('The column of added liquid must be taller than that on the other side (it is the less dense one)');
      rho2 = (rho1 * h1) / h2;
      pasos.push({ t: 'Density of the added liquid', html: `$ρ_2 = {ρ_1 h_1}/{h_2} = {${f(rho1)} · ${f(h1)}}/{${f(h2)}}$ = <b>${f(rho2)} kg/m³</b>` });
    } else {
      rho2 = lee(sc, 'rho2', 'the density of the added liquid');
      if (rho2 >= rho1) throw new Error('The added liquid must be less dense than the one at the bottom: otherwise it goes down to the bend of the tube and pushes the other');
      h1 = (rho2 * h2) / rho1;
      pasos.push({ t: 'Height on the other side', html: `Above the interface, the liquid at the bottom rises in the other arm $h_1 = {ρ_2 h_2}/{ρ_1} = {${f(rho2)} · ${f(h2)}}/{${f(rho1)}}$ = <b>${f(h1)} m</b>` });
    }
    const dh = h2 - h1;
    pasos.push({ t: 'Difference in level between the two surfaces', html: `$Δh = h_2 − h_1 = ${f(h2)} − ${f(h1)}$ = <b>${f(dh)} m</b> (${f(dh * 100)} cm), higher on the side of the less dense liquid.` });
    return { modo: 'tuboU', buscar: sc.buscar === 'densidad' ? 'densidad' : 'altura', rho1, rho2, h1, h2, dh, pasos };
  }

  function prensa(sc) {
    const d1 = lee(sc, 'd1', 'the diameter of the small piston'), d2 = lee(sc, 'd2', 'the diameter of the large piston'), g = gDe(sc);
    if (d2 <= d1) throw new Error('The large piston must have a larger diameter than the small one');
    const A1 = circulo(d1), A2 = circulo(d2), k = A2 / A1;
    const pasos = [{ t: 'Areas of the pistons', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let F1, F2, m = null;
    if (sc.datos === 'masa') {
      m = lee(sc, 'm', 'the mass to be lifted'); F2 = m * g; F1 = F2 / k;
      pasos.push({ t: 'Weight to be lifted', html: `$F_2 = m g = ${f(m)} · ${f(g)}$ = ${f(F2)} N` });
      pasos.push({ t: 'Pascal\'s principle', html: `The pressure is transmitted equally throughout the liquid: $F_1/A_1 = F_2/A_2$, so $F_1 = {F_2 A_1}/{A_2} = F_2 (d_1/d_2)^2 = ${f(F2)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(F1)} N</b>` });
    } else {
      F1 = lee(sc, 'F1', 'the force on the small piston'); F2 = F1 * k;
      pasos.push({ t: 'Pascal\'s principle', html: `The pressure is transmitted equally throughout the liquid: $F_1/A_1 = F_2/A_2$, so $F_2 = {F_1 A_2}/{A_1} = F_1 (d_2/d_1)^2 = ${f(F1)} · (${f(d2)}/${f(d1)})^2$ = <b>${f(F2)} N</b>${g ? `, the weight of a mass of ${f(F2 / g)} kg` : ''}` });
    }
    const pr = F1 / A1;
    pasos.push({ t: 'Pressure in the liquid', html: `$p = F_1/A_1 = ${f(F1)}/${f(A1)}$ = <b>${f(pr)} Pa</b> (${f(pr / ATM)} atm above atmospheric). The force is multiplied by $A_2/A_1 = ${f(k)}$.` });
    const x1 = lee(sc, 'x1', 'the travel of the small piston', { opcional: true });
    let x2 = null;
    if (x1) {
      x2 = x1 / k;
      pasos.push({ t: 'Travel', html: `The volume of liquid leaving one side enters the other: $A_1 x_1 = A_2 x_2$, so $x_2 = {x_1 A_1}/{A_2} = ${f(x1)}/${f(k)}$ = <b>${f(x2)} cm</b><br>What is gained in force is lost in travel: the work is the same, $F_1 x_1 = F_2 x_2 = ${f((F1 * x1) / 100)}$ J.` });
    }
    return { modo: 'prensa', datos: sc.datos === 'masa' ? 'masa' : 'fuerza', d1, d2, A1, A2, k, F1, F2, m, pr, x1, x2, g, pasos };
  }

  function empuje(sc) {
    const rhoF = lee(sc, 'rhoF', 'the density of the fluid'), g = gDe(sc);
    const pasos = [];
    if (sc.datos === 'pesadas') {
      const P = lee(sc, 'P', 'the weight in air'), Pa = lee(sc, 'Pa', 'the weight in the fluid', { cero: true });
      if (Pa >= P) throw new Error('Inside the fluid the body must weigh less than in air');
      const E = P - Pa, V = E / (rhoF * g), m = P / g, rhoC = m / V;
      pasos.push({ t: 'Buoyant force', html: `The weight it loses when submerged is the buoyant force: $E = P − P_{ap} = ${f(P)} − ${f(Pa)}$ = <b>${f(E)} N</b>` });
      pasos.push({ t: 'Volume of the body', html: `Fully submerged, $E = ρ_f V g$, so $V = E/(ρ_f g) = ${f(E)}/(${f(rhoF)} · ${f(g)})$ = <b>${f(V)} m³</b> (${f(V * 1e6)} cm³)` });
      pasos.push({ t: 'Density of the body', html: `$m = P/g = ${f(m)}$ kg and $ρ = m/V = {ρ_f P}/{E} = {${f(rhoF)} · ${f(P)}}/{${f(E)}}$ = <b>${f(rhoC)} kg/m³</b>` });
      const cerca = MATERIALES.reduce((a, b) => (Math.abs(Math.log(b[1] / rhoC)) < Math.abs(Math.log(a[1] / rhoC)) ? b : a));
      pasos.push({ t: 'What could it be made of?', html: `Comparing with some densities (gold 19,300, lead 11,340, silver 10,490, copper 8960, iron 7870, aluminium 2700 kg/m³), the closest is ${cerca[0]}${Math.abs(rhoC / cerca[1] - 1) > 0.03 ? ', but it does not match: it will be an alloy or have cavities' : ''}.` });
      return { modo: 'empuje', datos: 'pesadas', rhoF, g, P, Pa, E, V, m, rhoC, flota: false, pasos };
    }
    const rhoC = lee(sc, 'rhoC', 'the density of the body'), V = lee(sc, 'V', 'the volume of the body');
    const m = rhoC * V, P = m * g, Emax = rhoF * V * g;
    pasos.push({ t: 'Weight', html: `$P = m g = ρ V g = ${f(rhoC)} · ${f(V)} · ${f(g)}$ = <b>${f(P)} N</b>` });
    pasos.push({ t: 'Buoyant force with the whole body immersed', html: `$E = ρ_f V g = ${f(rhoF)} · ${f(V)} · ${f(g)}$ = <b>${f(Emax)} N</b>` });
    let flota, E, Vs = null, Pa = null, a = null;
    if (rhoC < rhoF) {
      flota = true; E = P; Vs = (rhoC * V) / rhoF;
      pasos.push({ t: 'It floats', html: `Since $E > P$ (the body is less dense than the fluid), it rises until the submerged part gives a buoyant force equal to the weight: $ρ_f V_s g = ρ V g$, $V_s = {ρ V}/{ρ_f} = {${f(rhoC)} · ${f(V)}}/{${f(rhoF)}}$ = <b>${f(Vs)} m³</b><br>${f((100 * rhoC) / rhoF)}% submerged and ${f(100 - (100 * rhoC) / rhoF)}% out.` });
      pasos.push({ t: 'To sink it completely', html: `It has to be pushed down with $F = E − P = ${f(Emax)} − ${f(P)}$ = ${f(Emax - P)} N` });
    } else if (rhoC === rhoF) {
      flota = null; E = Emax; Pa = 0;
      pasos.push({ t: 'Neither rises nor sinks', html: 'The body has the same density as the fluid: $E = P$ everywhere and it stays wherever you leave it (neutral equilibrium).' });
    } else {
      flota = false; E = Emax; Pa = P - Emax; a = Pa / m;
      pasos.push({ t: 'It sinks', html: `Since $P > E$ it goes to the bottom. Its apparent weight is $P_{ap} = P − E = ${f(P)} − ${f(Emax)}$ = <b>${f(Pa)} N</b>` });
      pasos.push({ t: 'Acceleration when released', html: `Without friction with the fluid, $a = (P − E)/m = g (1 − ρ_f/ρ) = ${f(Pa)}/${f(m)}$ = <b>${f(a)} m/s²</b>` });
    }
    return { modo: 'empuje', datos: 'cuerpo', rhoC, V, rhoF, g, m, P, Emax, E, flota, Vs, Pa, a, pasos };
  }

  function bernoulli(sc) {
    const rho = lee(sc, 'rho', 'the density of the fluid'), d1 = lee(sc, 'd1', 'the diameter at 1'), d2 = lee(sc, 'd2', 'the diameter at 2'), g = gDe(sc);
    const p1 = lee(sc, 'p1', 'the pressure at 1', { signo: true });
    const h1 = lee(sc, 'h1', 'the height of 1', { opcional: true, signo: true }) ?? 0, h2 = lee(sc, 'h2', 'the height of 2', { opcional: true, signo: true }) ?? 0;
    const A1 = circulo(d1), A2 = circulo(d2);
    const pasos = [{ t: 'Sections', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let v1, Q;
    if (sc.datos === 'Q') {
      const QL = lee(sc, 'Q', 'the flow rate'); Q = QL / 1000; v1 = Q / A1;
      pasos.push({ t: 'Speed at 1', html: `$Q = ${f(QL)}$ L/s = ${f(Q)} m³/s, y $v_1 = Q/A_1 = ${f(Q)}/${f(A1)}$ = <b>${f(v1)} m/s</b>` });
    } else {
      v1 = lee(sc, 'v1', 'the speed at 1'); Q = A1 * v1;
      pasos.push({ t: 'Flow rate', html: `$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s (${f(rho * Q)} kg/s)` });
    }
    const v2 = (v1 * A1) / A2;
    pasos.push({ t: 'Continuity', html: `The flow rate is the same throughout the pipe: $A_1 v_1 = A_2 v_2$, $v_2 = v_1 (d_1/d_2)^2 = ${f(v1)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(v2)} m/s</b>` });
    const p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
    const alt = h1 || h2;
    pasos.push({ t: 'Bernoulli', html: `$p_1 + {1}/{2} ρ v_1^2 ${alt ? '+ ρ g h_1 ' : ''}= p_2 + {1}/{2} ρ v_2^2${alt ? ' + ρ g h_2' : ''}$, so<br>$p_2 = p_1 + {1}/{2} ρ (v_1^2 − v_2^2)${alt ? ' + ρ g (h_1 − h_2)' : ''} = ${f(p1)} + {1}/{2} · ${f(rho)} · (${f(v1)}^2 − ${f(v2)}^2)${alt ? `$ $+ ${f(rho)} · ${f(g)} · (${f(h1)} − ${p(h2)})` : ''}$ = <b>${f(p2)} Pa</b>${p2 < 0 ? '<br>It comes out negative: if $p_1$ was gauge pressure, at 2 there is less pressure than atmospheric; if it was absolute, it cannot be and the liquid would boil (cavitation).' : ''}` });
    pasos.push({ t: 'Pressure difference', html: `$Δp = p_1 − p_2 = ${f(p1 - p2)}$ Pa${alt ? '' : `. Where the pipe narrows the fluid goes faster and the pressure drops: this is the Venturi effect. With two open vertical tubes, the liquid would rise ${f(Math.abs(p1 - p2) / (rho * g))} m more on side ${p1 > p2 ? '1' : '2'}.`}` });
    return { modo: 'bernoulli', datos: sc.datos === 'Q' ? 'Q' : 'v1', rho, d1, d2, A1, A2, v1, v2, Q, p1, p2, h1, h2, g, pasos };
  }

  function torricelli(sc) {
    const H = lee(sc, 'H', 'the height of the liquid above the orifice'), g = gDe(sc);
    const y = lee(sc, 'y', 'the height of the orifice', { opcional: true, cero: true });
    const d = lee(sc, 'd', 'the diameter of the orifice', { opcional: true }), D = lee(sc, 'D', 'the diameter of the tank', { opcional: true });
    if (D && !d) throw new Error('For the emptying time the diameter of the orifice is also needed');
    if (D && d && D <= d / 100) throw new Error('The tank must be wider than the orifice');
    const v = Math.sqrt(2 * g * H);
    const pasos = [{ t: 'Exit speed', html: `Bernoulli between the surface (almost at rest, at atmospheric pressure) and the orifice (also open to air): $v = √(2 g H) = √(2 · ${f(g)} · ${f(H)})$ = <b>${f(v)} m/s</b>, the same as if it fell freely from the surface.` }];
    let x = null, tc = null, Q = null, A = null, tv = null;
    if (y) {
      tc = Math.sqrt((2 * y) / g); x = v * tc;
      pasos.push({ t: 'Range of the jet', html: `It leaves horizontally and falls like a horizontal projectile: it takes $t = √(2 y/g) = √(2 · ${f(y)}/${f(g)})$ = ${f(tc)} s, and lands at $x = v t = 2 √(H y) = ${f(v)} · ${f(tc)}$ = <b>${f(x)} m</b><br>With the same total height, ${f(H + y)} m, the range would be greatest with the orifice at half height: ${f(H + y)} m.` });
    } else if (y === 0) {
      x = 0;
    }
    if (d) {
      A = circulo(d); Q = A * v;
      pasos.push({ t: 'Flow rate leaving', html: `${areaPaso('o', A, d)}, $Q = A_o v = ${f(A)} · ${f(v)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
    }
    if (D) {
      const AD = (Math.PI * D * D) / 4;
      tv = (AD / A) * Math.sqrt((2 * H) / g);
      pasos.push({ t: 'Time until it empties', html: `As the level drops the speed decreases. With $A_D v_{level} = A_o √(2 g z)$ and integrating from H to 0: $t = (A_D/A_o) √(2 H/g) = (D/d)^2 √(2 H/g) = ${f(AD / A)} · ${f(Math.sqrt((2 * H) / g))}$ = <b>${f(tv)} s</b> (${f(tv / 60)} min), twice what it would take if it always flowed out at the initial rate.` });
    }
    return { modo: 'torricelli', H, y, d, D, g, v, x, tc, A, Q, tv, pasos };
  }

  function viscosidad(sc) {
    const pasos = [], g = gDe(sc);
    if (sc.tipo === 'stokes') {
      const r = lee(sc, 'r', 'the radius of the sphere') / 1000, rhoE = lee(sc, 'rhoE', 'the density of the sphere'), rhoF = lee(sc, 'rhoF', 'the density of the fluid');
      if (rhoE <= rhoF) throw new Error('The sphere must be denser than the fluid in order to fall');
      let eta, v;
      pasos.push({ t: 'Forces on the sphere', html: `It falls with its weight $ρ_s V g$, the buoyant force slows it with $ρ_f V g$ and the viscous drag of Stokes, $F_v = 6 π η r v$, grows with speed. It reaches the terminal velocity when they balance: $6 π η r v = (ρ_s − ρ_f) {4}/{3} π r^3 g$.` });
      if (sc.datos === 'v') {
        v = lee(sc, 'v', 'the measured terminal velocity'); eta = (2 * r * r * (rhoE - rhoF) * g) / (9 * v);
        pasos.push({ t: 'Viscosity (falling-ball viscometer)', html: `$η = {2 r^2 (ρ_s − ρ_f) g}/{9 v} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(v)}}$ = <b>${f(eta)} Pa·s</b>` });
      } else {
        eta = lee(sc, 'eta', 'the viscosity'); v = (2 * r * r * (rhoE - rhoF) * g) / (9 * eta);
        pasos.push({ t: 'Terminal velocity', html: `$v_{lím} = {2 r^2 (ρ_e − ρ_f) g}/{9 η} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(eta)}}$ = <b>${f(v)} m/s</b>` });
      }
      const Re = (rhoF * v * 2 * r) / eta, tau = (2 * rhoE * r * r) / (9 * eta);
      pasos.push({ t: 'Does Stokes\' law hold?', html: `Reynolds number $Re = ρ_f v (2r)/η = ${f(Re)}$: ${Re < 1 ? 'much less than 1, the flow around the sphere is laminar and the law holds.' : 'not small compared with 1, so the result is only approximate (a wake appears and the force grows faster).'} It reaches almost the terminal velocity in a few $τ = {2 ρ_s r^2}/{9 η} = ${f(tau)}$ s.` });
      return { modo: 'viscosidad', tipo: 'stokes', datos: sc.datos === 'v' ? 'v' : 'eta', r, rhoE, rhoF, eta, v, Re, tau, g, pasos };
    }
    const eta = lee(sc, 'eta', 'the viscosity'), L = lee(sc, 'L', 'the length of the tube'), d = lee(sc, 'd', 'the inner diameter') / 1000, r = d / 2;
    const Rh = (8 * eta * L) / (Math.PI * r ** 4);
    pasos.push({ t: 'Poiseuille\'s law', html: `In a tube of radius r and length L, a viscous fluid in laminar flow has a parabolic velocity profile and the flow rate is $Q = {π r^4 Δp}/{8 η L}$. The resistance of the tube is $R = {8 η L}/{π r^4} = {8 · ${f(eta)} · ${f(L)}}/{π · (${f(r)})^4}$ = ${f(Rh)} Pa·s/m³: halving the radius reduces the flow rate 16 times.` });
    let Q, dp;
    if (sc.datos === 'Q') {
      Q = lee(sc, 'Q', 'the flow rate') / 1e6; dp = Q * Rh;
      pasos.push({ t: 'Pressure difference needed', html: `$Δp = Q R = ${f(Q)} · ${f(Rh)}$ = <b>${f(dp)} Pa</b> (${f(dp / 133.32)} mmHg)` });
    } else {
      dp = lee(sc, 'dp', 'the pressure difference'); Q = dp / Rh;
      pasos.push({ t: 'Flow rate', html: `$Q = Δp/R = ${f(dp)}/${f(Rh)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1e6)} mL/s` });
    }
    const A = Math.PI * r * r, vm = Q / A, vmax = 2 * vm, rho = lee(sc, 'rho', 'the density of the fluid', { opcional: true }) ?? 1000, Re = (rho * vm * d) / eta;
    pasos.push({ t: 'Velocities', html: `Mean velocity $v̄ = Q/(π r^2) = ${f(vm)}$ m/s; at the centre it is twice as much, $v_{max} = 2 v̄ = ${f(vmax)}$ m/s, and next to the wall, 0.` });
    pasos.push({ t: 'Is it laminar?', html: `$Re = ρ v̄ d/η = {${f(rho)} · ${f(vm)} · ${f(d)}}/${'{'}${f(eta)}}$ = ${f(Re)}: ${Re < 2000 ? 'less than about 2000, laminar regime and the Poiseuille law holds.' : Re < 4000 ? 'between 2000 and 4000, transition zone: the Poiseuille law is no longer reliable.' : 'greater than 4000, the flow is turbulent and the Poiseuille law does not hold.'}` });
    return { modo: 'viscosidad', tipo: 'poiseuille', datos: sc.datos === 'Q' ? 'Q' : 'dp', eta, L, d, r, Rh, Q, dp, vm, vmax, rho, Re, pasos };
  }

  function medidor(sc) {
    const rhoF = lee(sc, 'rhoF', 'the density of the fluid'), dh = lee(sc, 'dh', 'the level difference of the manometer') / 100, g = gDe(sc), pasos = [];
    const rhoM = lee(sc, 'rhoM', 'the density of the manometer liquid', { opcional: true });
    if (rhoM !== null && rhoM <= rhoF) throw new Error('The manometer liquid must be denser than the fluid being measured');
    const dp = rhoM === null ? rhoF * g * dh : (rhoM - rhoF) * g * dh;
    pasos.push({ t: 'Pressure difference', html: rhoM === null ? `With two open vertical tubes, the liquid rises until its weight balances the pressure: $Δp = ρ g Δh = ${f(rhoF)} · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` : `In the U manometer, at the height of the lower surface the pressure is equal in both arms: $Δp = (ρ_m − ρ) g Δh = (${f(rhoM)} − ${f(rhoF)}) · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` });
    if (sc.tipo === 'venturi') {
      const d1 = lee(sc, 'd1', 'the diameter of the pipe'), d2 = lee(sc, 'd2', 'the diameter of the constriction');
      if (d2 >= d1) throw new Error('The constriction must be narrower than the pipe');
      const A1 = circulo(d1), A2 = circulo(d2), k = (A1 / A2) ** 2 - 1, v1 = Math.sqrt((2 * dp) / (rhoF * k)), v2 = (v1 * A1) / A2, Q = A1 * v1;
      pasos.push({ t: 'Continuity and Bernoulli', html: `$v_2 = v_1 A_1/A_2$ and $p_1 − p_2 = {1}/{2} ρ (v_2^2 − v_1^2) = {1}/{2} ρ v_1^2 ((A_1/A_2)^2 − 1)$, with $(A_1/A_2)^2 = (d_1/d_2)^4 = ${f(k + 1)}$` });
      pasos.push({ t: 'Speed and flow rate', html: `$v_1 = √({2 Δp}/{ρ ((A_1/A_2)^2 − 1)}) = √({2 · ${f(dp)}}/{${f(rhoF)} · ${f(k)}})$ = <b>${f(v1)} m/s</b>, $v_2$ = ${f(v2)} m/s<br>$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
      return { modo: 'medidor', tipo: 'venturi', rhoF, rhoM, dh, dp, d1, d2, A1, A2, v1, v2, Q, g, pasos };
    }
    const v = Math.sqrt((2 * dp) / rhoF);
    pasos.unshift({ t: 'How it works', html: 'The tube has an opening facing the flow, where the fluid comes to rest, and a port on the side, past which it flows at its speed. Bernoulli between the two, at the same height: $p_{total} = p + {1}/{2} ρ v^2$, so the manometer joining them measures the dynamic pressure ${1}/{2} ρ v^2$.' });
    pasos.push({ t: 'Speed of the fluid', html: `At the mouth of the Pitot tube the fluid stops (stagnation pressure) and at the side port it flows at its speed: $Δp = {1}/{2} ρ v^2$, so $v = √({2 Δp}/{ρ}) = √({2 · ${f(dp)}}/{${f(rhoF)}})$ = <b>${f(v)} m/s</b> (${f(v * 3.6)} km/h). This is how aircraft measure their airspeed.` });
    return { modo: 'medidor', tipo: 'pitot', rhoF, rhoM, dh, dp, v, g, pasos };
  }

  function pared(sc) {
    const rho = lee(sc, 'rho', 'the density of the liquid'), b = lee(sc, 'b', 'the width'), hc = lee(sc, 'hc', 'the wetted height'), g = gDe(sc);
    const h0 = lee(sc, 'h0', 'the depth of the top edge', { opcional: true, cero: true }) ?? 0;
    const hg = h0 + hc / 2, A = b * hc, F = rho * g * hg * A, yc = hg + (hc * hc) / (12 * hg), M = F * (h0 + hc - yc);
    const pasos = [{ t: 'Pressure on the wall', html: `The pressure of the liquid grows with depth, $p = ρ g y$, so it pushes harder at the bottom than at the top. ${h0 ? `The gate goes from $y = ${f(h0)}$ m to $y = ${f(h0 + hc)}$ m.` : `The wall is wetted up to $H = ${f(hc)}$ m.`}` }];
    pasos.push({ t: 'Resultant force', html: `It is the pressure at the centroid of the surface times its area: $F = ρ g h_G A = ${f(rho)} · ${f(g)} · ${f(hg)} · (${f(b)} · ${f(hc)})$ = <b>${f(F)} N</b>${h0 ? '' : `, that is, $F = {1}/{2} ρ g b H^2$`}` });
    pasos.push({ t: 'Centre of pressure', html: `Since it pushes harder lower down, the force does not act at the centre but lower: $y_P = h_G + {I_G}/{h_G A} = h_G + {h_c^2}/{12 h_G} = ${f(hg)} + {${f(hc)}^2}/{12 · ${f(hg)}}$ = <b>${f(yc)} m</b> deep${h0 ? '' : ', at two thirds of the height (H/3 from the bottom)'}.` });
    pasos.push({ t: 'Moment about the bottom edge', html: `$M = F (h_0 + h_c − y_P) = ${f(F)} · ${f(h0 + hc - yc)}$ = <b>${f(M)} N·m</b>: this is what the dam or the bottom hinges have to withstand so that it does not overturn.` });
    return { modo: 'pared', rho, b, hc, h0, hg, A, F, yc, M, g, pasos };
  }

  function capilar(sc) {
    const ga = lee(sc, 'gamma', 'the surface tension'), r = lee(sc, 'r', 'the radius of the tube') / 1000, rho = lee(sc, 'rho', 'the density of the liquid'), g = gDe(sc);
    const th = lee(sc, 'theta', 'the contact angle', { opcional: true, cero: true }) ?? 0;
    if (th > 180) throw new Error('The contact angle goes from 0° to 180°');
    const c = Math.abs(th - 90) < 1e-9 ? 0 : Math.cos((th * Math.PI) / 180), h = (2 * ga * c) / (rho * g * r), dp = (2 * ga * c) / r;
    const pasos = [{ t: 'Why it rises (or falls)', html: `Surface tension pulls on the edge of the meniscus along the whole perimeter, $2πr$, with a contact angle θ = ${f(th)}°: the vertical force is $2 π r γ cos θ$. ${c > 0 ? 'The liquid wets the glass and rises' : c < 0 ? 'The liquid does not wet it (like mercury) and falls' : 'With θ = 90° it neither rises nor falls'}.` }];
    pasos.push({ t: 'Jurin\'s law', html: `The column rises until its weight, $ρ π r^2 h g$, equals that force: $h = {2 γ cos θ}/{ρ g r} = {2 · ${f(ga)} · ${f(c)}}/{${f(rho)} · ${f(g)} · ${f(r)}}$ = <b>${f(h * 1000)} mm</b>${h < 0 ? ' (below the outside level)' : ''}. The thinner the tube, the higher it rises: this is how water climbs up paper and sap rises in plants.` });
    pasos.push({ t: 'Pressure under the meniscus', html: `The curved surface makes the pressure under the meniscus $Δp = {2 γ cos θ}/{r} = ${f(dp)}$ Pa ${dp >= 0 ? 'lower' : 'higher'} than atmospheric (Laplace's law), exactly what the column compensates: $ρ g h = ${f(rho * g * h)}$ Pa.` });
    return { modo: 'capilar', ga, r, rho, th, c, h, dp, g, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'viscosidad') return viscosidad(sc);
    if (sc.modo === 'medidor') return medidor(sc);
    if (sc.modo === 'pared') return pared(sc);
    if (sc.modo === 'capilar') return capilar(sc);
    if (sc.modo === 'tuboU') return tuboU(sc);
    if (sc.modo === 'prensa') return prensa(sc);
    if (sc.modo === 'empuje') return empuje(sc);
    if (sc.modo === 'bernoulli') return bernoulli(sc);
    if (sc.modo === 'torricelli') return torricelli(sc);
    return presion(sc);
  }

  const ejemplos = [
    { clave: 'buceo', nombre: 'Pressure on a diver at 20 m', sc: { modo: 'presion', rho: '1025', h: '20', p0: '', A: '', g: '9,8' } },
    { clave: 'piscina', nombre: 'Force on the bottom of a swimming pool', sc: { modo: 'presion', rho: '1000', h: '2', p0: '', A: '50', g: '9,8' } },
    { clave: 'barometro', nombre: 'Torricelli\'s mercury barometer', sc: { modo: 'presion', rho: '13600', h: '0,76', p0: '0', A: '', g: '9,8' } },
    { clave: 'tubo-aceite', nombre: 'Oil and water in a U-tube', sc: { modo: 'tuboU', buscar: 'altura', rho1: '1000', rho2: '800', h2: '0,1' } },
    { clave: 'tubo-densidad', nombre: 'Density of a liquid with a U-tube', sc: { modo: 'tuboU', buscar: 'densidad', rho1: '1000', h1: '0,068', h2: '0,08' } },
    { clave: 'elevador', nombre: 'Hydraulic lift in a workshop', sc: { modo: 'prensa', datos: 'masa', m: '1500', d1: '4', d2: '40', x1: '20', g: '9,8' } },
    { clave: 'prensa', nombre: 'Hydraulic press', sc: { modo: 'prensa', datos: 'fuerza', F1: '200', d1: '2', d2: '30', x1: '', g: '9,8' } },
    { clave: 'madera', nombre: 'Wooden block in water', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '600', V: '0,002', rhoF: '1000', g: '9,8' } },
    { clave: 'iceberg', nombre: 'Visible part of an iceberg', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '917', V: '1000', rhoF: '1025', g: '9,8' } },
    { clave: 'hierro', nombre: 'Iron piece submerged in water', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '7870', V: '1e-4', rhoF: '1000', g: '9,8' } },
    { clave: 'corona', nombre: 'Archimedes\' crown: is it gold?', sc: { modo: 'empuje', datos: 'pesadas', P: '10', Pa: '9,4', rhoF: '1000', g: '9,8' } },
    { clave: 'venturi', nombre: 'Venturi tube', sc: { modo: 'bernoulli', datos: 'v1', rho: '1000', d1: '10', d2: '5', v1: '2', p1: '1,5e5', h1: '', h2: '', g: '9,8' } },
    { clave: 'casa', nombre: 'Water rising to a second floor', sc: { modo: 'bernoulli', datos: 'Q', rho: '1000', d1: '4', d2: '2', Q: '1,5', p1: '4e5', h1: '0', h2: '6', g: '9,8' } },
    { clave: 'deposito', nombre: 'Jet from a tank with a hole', sc: { modo: 'torricelli', H: '2', y: '1', d: '2', D: '1', g: '9,8' } },
    { clave: 'sangre', nombre: 'Blood through an artery (Poiseuille)', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'dp', eta: '4e-3', L: '0,1', d: '4', dp: '400', Q: '', rho: '1060' } },
    { clave: 'jeringa', nombre: 'Pressure to push water through a needle', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'Q', eta: '1e-3', L: '0,04', d: '0,5', dp: '', Q: '0,5', rho: '1000' } },
    { clave: 'glicerina', nombre: 'Steel ball falling in glycerine (Stokes)', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'eta', r: '1', rhoE: '7800', rhoF: '1260', eta: '1,5', v: '', g: '9,8' } },
    { clave: 'viscosimetro', nombre: 'Viscosity of an oil with a falling ball', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'v', r: '1,5', rhoE: '7800', rhoF: '900', eta: '', v: '0,12', g: '9,8' } },
    { clave: 'pitot', nombre: 'Speed of an aircraft with a Pitot tube', sc: { modo: 'medidor', tipo: 'pitot', rhoF: '1,2', rhoM: '1000', dh: '25', d1: '', d2: '', g: '9,8' } },
    { clave: 'venturimetro', nombre: 'Flow rate with a Venturi meter and mercury', sc: { modo: 'medidor', tipo: 'venturi', rhoF: '1000', rhoM: '13600', dh: '4', d1: '10', d2: '5', g: '9,8' } },
    { clave: 'presa', nombre: 'Force of water on a dam', sc: { modo: 'pared', rho: '1000', b: '50', hc: '20', h0: '', g: '9,8' } },
    { clave: 'compuerta', nombre: 'Submerged gate in a tank', sc: { modo: 'pared', rho: '1000', b: '1,5', hc: '2', h0: '3', g: '9,8' } },
    { clave: 'capilar', nombre: 'Water rising in a capillary tube', sc: { modo: 'capilar', gamma: '0,073', r: '0,5', rho: '1000', theta: '0', g: '9,8' } },
    { clave: 'mercurio', nombre: 'Mercury falling in a capillary', sc: { modo: 'capilar', gamma: '0,49', r: '1', rho: '13600', theta: '140', g: '9,8' } },
  ];

  return { resolver, presion, tuboU, prensa, empuje, bernoulli, torricelli, viscosidad, medidor, pared, capilar, ejemplos, f, ATM };
})();

