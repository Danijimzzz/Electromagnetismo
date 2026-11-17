const Equilibrio = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  const Aj = typeof Ajuste !== 'undefined' ? Ajuste : require('../quimica/ajuste.js');
  let R_ATM = 0.082, R_J = 8.314, R_BAR = 0.083145;
  const ajusta = () => { const v = Aj.valores(); R_ATM = v.Ratm; R_J = v.R; R_BAR = v.Rbar; };
  const L = ['A', 'B', 'C', 'D'];
  const FASES = [['g', 'gas (g)'], ['aq', 'disuelta (aq)'], ['s', 'solid (s)'], ['l', 'liquid (l)']];
  const fase = (sc, i) => { const v = sc['f' + L[i]]; return FASES.some(([k]) => k === v) ? v : 'g'; };
  const puro = (sc, i) => fase(sc, i) === 's' || fase(sc, i) === 'l';

  function num(sc, k, nom, { min = -Infinity, estricto = false, opcional = false, def = null } = {}) {
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`${nom} is missing`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number`);
    if (estricto ? v <= min : v < min) throw new Error(`${may(nom)} must be ${estricto ? 'greater than' : 'greater than or equal to'} ${min}`);
    return v;
  }

  const nom = (sc, i) => (vacio(sc['n' + L[i]]) ? L[i] : String(sc['n' + L[i]]).trim());
  const nh = (s) => String(s).replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>').replace(/([+-]+)$/, (m) => `<sup>${m.replace('-', '−')}</sup>`);
  const qn = (s) => String(s).replace(/([^\d]+)(\d+)?/g, (_, t, d) => `"${t}"${d ? `_{${d}}` : ''}`);
  const num2 = (v) => String(v).replace('.', '.');

  function lee(sc) {
    const a = num(sc, 'a', 'the coefficient of A', { min: 0, estricto: true }), c = num(sc, 'c', 'the coefficient of C', { min: 0, estricto: true });
    const b = num(sc, 'b', 'the coefficient of B', { min: 0, opcional: true, def: 0 }), d = num(sc, 'd', 'the coefficient of D', { min: 0, opcional: true, def: 0 });
    const nu = [-a, -b, c, d];
    return { coef: [a, b, c, d], nu, act: nu.map((v, i) => (puro(sc, i) ? 0 : v)) };
  }
  const presentes = (nu) => [0, 1, 2, 3].filter((i) => nu[i] !== 0);
  const ladoH = (sc, coef, idx) => idx.filter((i) => coef[i] > 0).map((i) => (coef[i] === 1 ? '' : num2(coef[i]) + ' ') + nh(nom(sc, i)) + (fase(sc, i) === 'g' ? '' : `<span class="fase">(${fase(sc, i)})</span>`)).join(' + ');
  const reaccionH = (sc, coef) => `${ladoH(sc, coef, [0, 1])} ⇌ ${ladoH(sc, coef, [2, 3])}`;
  const conc = (sc, i) => `[${qn(nom(sc, i))}]`;
  const pot = (sc, i, p) => conc(sc, i) + (p === 1 ? '' : `^{${num2(p)}}`);
  const exprK = (sc, coef, k = 'c') => {
    const lado = (idx) => idx.filter((i) => coef[i] > 0 && !puro(sc, i)).map((i) => pot(sc, i, coef[i])).join(' ') || '1';
    return `K_${k} = {${lado([2, 3])}}/{${lado([0, 1])}}`;
  };

  function cociente(c, nu) {
    let cero = false, inf = false, s = 0;
    for (const i of presentes(nu)) { if (c[i] <= 0) { if (nu[i] > 0) cero = true; else inf = true; } else s += nu[i] * Math.log(c[i]); }
    if (cero && inf) throw new Error('Some reactant and some product are missing at once: Q is not defined. Enter some concentration on each side or on just one');
    return cero ? 0 : inf ? Infinity : Math.exp(s);
  }
  const sentido = (Q, K) => (Q === K || Math.abs(Math.log(Q / K)) < 1e-9 ? 'eq' : Q < K ? 'der' : 'izq');
  const TXT_SENT = { eq: 'it is already at equilibrium', der: 'advances to the right (products form)', izq: 'goes back to the left (reactants form)' };

  function limites(c0, nu, libre = []) {
    let lo = -Infinity, hi = Infinity;
    for (const i of presentes(nu)) { if (libre[i]) continue; if (nu[i] > 0) lo = Math.max(lo, -c0[i] / nu[i]); else hi = Math.min(hi, c0[i] / -nu[i]); }
    return { lo, hi };
  }
  function avance(c0, nu, K, act = nu, libre = []) {
    const { lo, hi } = limites(c0, nu, libre);
    if (!(hi - lo > 1e-15)) throw new Error('With those concentrations the reaction cannot advance in either direction: enter some reactant or product');
    const g = (x) => { let s = -Math.log(K); for (const i of presentes(act)) s += act[i] * Math.log(c0[i] + act[i] * x); return s; };
    if (isFinite(hi) && isFinite(g(hi)) && g(hi) < 0) return { x: hi, lo, hi, agotado: true }; // se agota un sólido antes del equilibrio
    if (isFinite(lo) && isFinite(g(lo)) && g(lo) > 0) return { x: lo, lo, hi, agotado: true };
    let a = lo, b = hi; const esc = Math.max(1, ...c0.map(Math.abs));
    if (!isFinite(b)) { b = (isFinite(a) ? a : 0) + esc; for (let k = 0; k < 400 && g(b) < 0; k++) b = a + (b - a) * 2; }
    if (!isFinite(a)) { a = (isFinite(b) ? b : 0) - esc; for (let k = 0; k < 400 && g(a) > 0; k++) a = b - (b - a) * 2; }
    for (let k = 0; k < 400; k++) {
      const m = (a + b) / 2, v = g(m);
      if (!isFinite(v)) break;
      if (v > 0) b = m; else a = m;
      if (b - a <= 1e-16 * Math.max(1, Math.abs(m))) break;
    }
    return { x: (a + b) / 2, lo, hi };
  }
  const lim = (v) => (isFinite(v) ? f(v) : v < 0 ? '−∞' : '+∞');
  const equilibrio = (c0, nu, x, libre = []) => c0.map((v, i) => (libre[i] ? NaN : nu[i] ? Math.max(0, v + nu[i] * x) : v));
  const libres = (sc, nu) => [0, 1, 2, 3].map((i) => !!nu[i] && puro(sc, i) && vacio(sc['c' + L[i]]));

  function leeConc(sc, nu, ropa) {
    return [0, 1, 2, 3].map((i) => (nu[i] ? num(sc, 'c' + L[i], `${ropa} of ${nom(sc, i)}`, { min: 0, opcional: true, def: 0 }) : 0));
  }

  const filaTabla = (t, xs) => `<tr><th>${t}</th>${xs.map((x) => `<td>${x}</td>`).join('')}</tr>`;
  function tablaICE(sc, nu, coef, c0, x, ceq) {
    const idx = presentes(nu);
    const cab = `<tr><th><span class="solo-lector">Species</span></th>${idx.map((i) => `<th>${nh(nom(sc, i))}</th>`).join('')}</tr>`;
    const lib = libres(sc, nu), ini = filaTabla('Initial', idx.map((i) => (lib[i] ? 'in excess' : f(c0[i]))));
    const cam = filaTabla('Change', idx.map((i) => `${nu[i] < 0 ? '−' : '+'}${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`));
    const eq = filaTabla('Equilibrium', idx.map((i) => (lib[i] ? 'in excess' : `${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`)));
    const num_ = filaTabla('x = ' + f(x), idx.map((i) => (lib[i] ? '—' : `<b>${f(ceq[i])}</b>`)));
    return `<table class="tabla">${cab}${ini}${cam}${eq}${num_}</table>`;
  }
  const gasesSolo = (sc, act) => { const ids = presentes(act); return ids.length > 0 && ids.every((i) => fase(sc, i) === 'g'); };
  const kp = (K, act, T, Rg = R_ATM) => { const dn = act.reduce((s, v) => s + v, 0); return { dn, Kp: K * Math.pow(Rg * T, dn) }; };
  function pasoKp(sc, K, act, T, ceq, Rg) {
    const { dn, Kp } = kp(K, act, T, Rg), P = ceq.map((v, i) => (act[i] ? v * Rg * T : 0)), Pt = P.reduce((s, v) => s + v, 0), u = Rg === R_ATM ? 'atm' : 'bar', rt = Rg === R_ATM ? '0,082' : '0,083145';
    const parc = presentes(act).map((i) => `$p_{${qn(nom(sc, i))}} = c·R·T = ${f(ceq[i])} · ${rt} · ${f(T)} = ${f(P[i])} "${u}"$`).join('; ');
    return { Kp, dn, P, Pt, paso: { t: 'Kp and partial pressures', html: `With $T = ${f(T)} "K"$ and assuming ideal gases: $Δn = ${num2(dn)}$ (gaseous moles of products minus those of reactants; solids and liquids do not count), so $K_p = K_c (R T)^{Δn} = ${f(K)} · (${rt} · ${f(T)})^{${num2(dn)}} = ${f(Kp)}$. Partial pressures: ${parc}. Total pressure: $P = ${f(Pt)} "${u}"$.` } };
  }
  const ecuacionX = (sc, coef, nu, c0, K) => {
    const termino = (i) => { const p = coef[i], base = `(${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${p === 1 ? '' : num2(p) + '·'}x)`; return base + (p === 1 ? '' : `^{${num2(p)}}`); };
    const lado = (idx) => idx.filter((i) => coef[i] > 0 && !puro(sc, i)).map(termino).join(' · ') || '1';
    return `$K_c = ${f(K)} = {${lado([2, 3])}}/{${lado([0, 1])}}$`;
  };

  function cabecera(sc, coef, K, kind) {
    return { t: 'The reaction and its constant', html: `$${exprK(sc, coef)}$${kind === 'dado' ? `, with $K_c = ${f(K)}$` : ''}. The reaction is ${reaccionH(sc, coef)}. Pure solids and liquids do not enter $K$ (their activity is 1); whatever you do not mark as solid or liquid is taken as gas or dissolved.` };
  }

  function modoK(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'the initial concentration');
    const e = L.indexOf(String(sc.especie || 'C'));
    if (e < 0 || !nu[e]) throw new Error('Choose a species that is in the reaction');
    if (puro(sc, e)) throw new Error('The measured species cannot be a pure solid or liquid: its concentration does not change. Choose a gas or a dissolved species');
    const ce = num(sc, 'ceq', `the equilibrium concentration of ${nom(sc, e)}`, { min: 0 });
    const x = (ce - c0[e]) / nu[e];
    const ceq = c0.map((v, i) => (nu[i] ? v + nu[i] * x : v));
    if (ceq.some((v, i) => nu[i] && !libre[i] && v < -1e-12)) throw new Error('With those data some equilibrium concentration comes out negative: check the measured concentration or the initial ones');
    if (presentes(act).some((i) => !(ceq[i] > 1e-12))) throw new Error('Some species is used up completely: the reaction is complete and K cannot be calculated with these data');
    const K = Math.exp(presentes(act).reduce((s, i) => s + act[i] * Math.log(ceq[i]), 0));
    const pasos = [cabecera(sc, coef, K, 'calcula')];
    pasos.push({ t: 'Data', html: `Initial concentrations: ${presentes(nu).map((i) => `$${conc(sc, i)}_0 = ${f(c0[i])}$`).join(', ')} (mol/L). At equilibrium $${conc(sc, e)} = ${f(ce)} "mol/L"$ is measured.` });
    pasos.push({ t: 'How far the reaction has advanced', html: `${nh(nom(sc, e))} has gone from ${f(c0[e])} to ${f(ce)}, and its coefficient is ${num2(coef[e])}: $x = (${f(ce)} − ${f(c0[e])}) / ${num2(nu[e])} = ${f(x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c0, x, ceq) });
    pasos.push({ t: 'Kc', html: `$${exprK(sc, coef)} = ${f(K)}$` });
    const out = { modo: 'K', coef, nu, act, libre, c0, ceq, x, K, ...limites(c0, nu, libre), pasos };
    if (c0[0] > 0) out.alfa = (coef[0] * x) / c0[0];
    if (out.alfa !== undefined) pasos.push({ t: 'Degree of dissociation (conversion)', html: `${f(100 * out.alfa)} % of ${nh(nom(sc, 0))} has been consumed: $α = a·x / ${conc(sc, 0)}_0 = ${num2(coef[0])} · ${f(x)} / ${f(c0[0])} = ${f(out.alfa)}$.` });
    cierre(sc, out, K, act, ceq);
    return out;
  }
  function cierre(sc, out, K, act, ceq) {
    const T = num(sc, 'T', 'la temperatura', { min: 0, estricto: true, opcional: true, def: null });
    out.dn = act.reduce((s, v) => s + v, 0);
    if (T !== null && gasesSolo(sc, act)) { const k = pasoKp(sc, K, act, T, ceq, out.modo === 'dG' ? R_BAR : R_ATM); out.T = T; out.Kp = k.Kp; out.dn = k.dn; out.P = k.P; out.Pt = k.Pt; out.pasos.push(k.paso); }
  }

  function modoEq(sc, base, dG) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'the initial concentration'), K = dG ? dG.K : num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q0 = cociente(c0, act), s0 = sentido(Q0, K), r = avance(c0, nu, K, act, libre), ceq = equilibrio(c0, nu, r.x, libre);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    if (dG) pasos.splice(0, 0, ...dG.pasos);
    if (r.agotado) pasos.push({ t: 'Warning: a solid runs out', html: 'The amount of solid you entered runs out before equilibrium is reached: the reaction advances until it is consumed and <b>equilibrium is not reached</b> with this value of K. The concentrations that come out are the final ones.' });
    pasos.push({ t: 'What happens at the start', html: `With the initial concentrations, $Q = ${f(Q0)}$ and $K_c = ${f(K)}$: since $Q ${s0 === 'eq' ? '=' : Q0 < K ? '<' : '>'} K$, the reaction ${TXT_SENT[s0]}.` });
    pasos.push({ t: 'Concentration table', html: `Let $x$ be how far the reaction advances (mol/L). ${r.x < 0 ? 'Since it comes out negative, it actually goes backward.' : ''}` + '<br>' + tablaICE(sc, nu, coef, c0, r.x, ceq) });
    pasos.push({ t: 'Equation for x', html: `${ecuacionX(sc, coef, nu, c0, K)}. It is solved for $x$ between ${lim(r.lo)} and ${lim(r.hi)} (the interval in which no concentration is negative); since $K$ grows with $x$ there is only one valid solution: $x = ${f(r.x)} "mol/L"$.` });
    pasos.push({ t: 'Equilibrium concentrations', html: presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])} "mol/L"$`).join(', ') + `. Check: $Q = ${f(cociente(ceq, act))}$.` });
    const out = { modo: dG ? 'dG' : 'eq', coef, nu, act, libre, c0, ceq, x: r.x, K, Q0, s0, lo: r.lo, hi: r.hi, agotado: !!r.agotado, pasos };
    if (c0[0] > 0 && r.x > 0) { out.alfa = (coef[0] * r.x) / c0[0]; pasos.push({ t: 'Degree of dissociation (conversion)', html: `${f(100 * out.alfa)} % of ${nh(nom(sc, 0))} is consumed: $α = a·x / ${conc(sc, 0)}_0 = ${f(out.alfa)}$.` }); }
    cierre(sc, out, K, act, ceq);
    if (dG) { out.dG = dG.dG; out.Kp0 = dG.Kp; }
    return out;
  }

  function modoQ(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c = leeConc(sc, nu, 'the concentration'), K = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q = cociente(c, act), s = sentido(Q, K), r = avance(c, nu, K, act, libre), ceq = equilibrio(c, nu, r.x, libre);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    pasos.push({ t: 'Reaction quotient', html: `Q has the same form as $K$ but with the present concentrations: $${exprK(sc, coef).replace('K_c', 'Q')} = ${f(Q)}$.` });
    pasos.push({ t: 'Q frente a K', html: `$Q = ${f(Q)}$ y $K_c = ${f(K)}$. ${s === 'eq' ? 'They are equal: the system is at equilibrium and does not change.' : Q < K ? 'Since $Q < K$ there is too much reactant for equilibrium: the reaction advances to the <b>right</b>.' : 'Since $Q > K$ there is too much product for equilibrium: the reaction goes back to the <b>left</b>.'}` });
    pasos.push({ t: 'Where it ends', html: `Until equilibrium is reached the reaction advances $x = ${f(r.x)} "mol/L"$: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])}$`).join(', ')}.` + '<br>' + tablaICE(sc, nu, coef, c, r.x, ceq) });
    const out = { modo: 'Q', coef, nu, act, libre, c0: c, ceq, x: r.x, K, Q, s0: s, lo: r.lo, hi: r.hi, agotado: !!r.agotado, pasos };
    cierre(sc, out, K, act, ceq);
    return out;
  }

  const TIPOS_LC = [['anadir', 'Add a species'], ['quitar', 'Remove a species'], ['volumen', 'Change the volume (compress or expand)'], ['temperatura', 'Change the temperature'], ['inerte', 'Add an inert gas at constant volume'], ['catalizador', 'Add a catalyst']];
  function modoLC(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'the initial concentration'), K1 = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const r1 = avance(c0, nu, K1, act, libre), c1 = equilibrio(c0, nu, r1.x, libre), tipo = sc.tipo || 'anadir';
    const pasos = [cabecera(sc, coef, K1, 'dado')];
    pasos.push({ t: 'Starting equilibrium', html: `With the initial concentrations we reach $x = ${f(r1.x)} "mol/L"$: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(c1[i])}$`).join(', ')}. It is an equilibrium: $Q = ${f(cociente(c1, act))} = K_c$.` });
    let c2 = c1.slice(), K2 = K1, desc = '', porque = '', dn = act.reduce((s, v) => s + v, 0);
    const e = L.indexOf(String(sc.esp || 'A'));
    if (tipo === 'anadir' || tipo === 'quitar') {
      if (e < 0 || !nu[e]) throw new Error('Choose a species that is in the reaction');
      const q = num(sc, 'cant', 'the amount (mol/L)', { min: 0, estricto: true });
      if (tipo === 'quitar' && q >= c1[e]) throw new Error(`${f(q)} mol/L of ${nom(sc, e)} cannot be removed: at equilibrium there is only ${f(c1[e])}`);
      c2[e] += tipo === 'anadir' ? q : -q;
      desc = `${f(q)} mol/L of ${nh(nom(sc, e))} ${tipo === 'anadir' ? 'are added' : 'are removed'} without changing the volume or the temperature, so $K_c$ does not change.`;
      porque = tipo === 'anadir' ? `The system opposes the increase of ${nh(nom(sc, e))} by consuming part of it.` : `The system opposes the lack of ${nh(nom(sc, e))} by producing more.`;
    } else if (tipo === 'volumen') {
      const rv = num(sc, 'rv', 'the final volume over the initial (V₂/V₁)', { min: 0, estricto: true });
      c2 = c1.map((v, i) => (act[i] ? v / rv : v));
      desc = `The volume becomes ${f(rv)} times the initial one (${rv < 1 ? 'it is compressed' : rv > 1 ? 'it expands' : 'it does not change'}), so all the concentrations are multiplied by $1/${f(rv)}$ = ${f(1 / rv)}; $K_c$ does not change (same temperature).`;
      porque = dn === 0 ? 'There are the same moles of gas on each side (Δn = 0): the volume does not shift the equilibrium, it only changes all the concentrations in the same proportion.' : `Δn = ${num2(dn)} moles of gas. ${rv < 1 ? 'On compressing, the pressure rises and the system lowers it by going to the side with fewer moles of gas' : 'On expanding, the pressure drops and the system raises it by going to the side with more moles of gas'}.`;
    } else if (tipo === 'temperatura') {
      const T1 = num(sc, 'T', 'the initial temperature (K)', { min: 0, estricto: true }), T2 = num(sc, 'T2', 'the final temperature (K)', { min: 0, estricto: true }), dH = num(sc, 'dH', 'ΔH of the reaction to the right (kJ/mol)');
      K2 = K1 * Math.exp((-dH * 1000 / R_J) * (1 / T2 - 1 / T1));
      desc = `The temperature goes from ${f(T1)} K to ${f(T2)} K. The constant changes with the Van't Hoff equation: $ln {K_2}/{K_1} = −{ΔH}/{R} (1/T_2 − 1/T_1)$ = $−{${f(dH * 1000)}}/{${R_J}} (1/${f(T2)} − 1/${f(T1)})$ ⇒ $K_2 = ${f(K2)}$. The concentrations do not change in the first instant.`;
      porque = `The reaction to the right is ${dH > 0 ? 'endothermic (ΔH > 0)' : dH < 0 ? 'exothermic (ΔH < 0)' : 'neutral (ΔH = 0)'}: ${dH === 0 ? 'temperature does not change K.' : (dH > 0) === (T2 > T1) ? 'raising the temperature favors the one that absorbs heat and lowering it the one that releases it, and K ' + (K2 > K1 ? 'increases' : 'decreases') + '.' : 'the system opposes the temperature change and K ' + (K2 > K1 ? 'increases' : 'decreases') + '.'}`;
    } else if (tipo === 'inerte') {
      desc = 'A gas that does not react is added without changing the volume: the partial pressures and the concentrations of the species do not change.';
      porque = 'Q is still equal to K: the equilibrium does not shift. (If it were added at constant pressure, the volume would grow and the expand option would have to be used.)';
    } else {
      desc = 'A catalyst lowers the activation energy of the forward and reverse reactions equally.';
      porque = 'Q is still equal to K and K does not change: the equilibrium does not shift, it is only reached faster.';
    }
    const Q2 = cociente(c2, act), s = sentido(Q2, K2), r2 = avance(c2, nu, K2, act, libre), c3 = equilibrio(c2, nu, r2.x, libre);
    pasos.push({ t: 'The disturbance', html: desc });
    pasos.push({ t: 'Q versus K after the change', html: `$Q = ${f(Q2)}$ y $K_c = ${f(K2)}$. ${s === 'eq' ? 'They are still equal: <b>the equilibrium does not shift</b>.' : Q2 < K2 ? 'Since $Q < K$, the reaction advances to the <b>right</b>.' : 'Since $Q > K$, the reaction goes back to the <b>left</b>.'} ${porque}` });
    if (s !== 'eq') pasos.push({ t: 'New equilibrium', html: `$K_c = ${f(K2)}$ is solved starting from the concentrations after the change: $x = ${f(r2.x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c2, r2.x, c3) });
    const cmp = (i) => `<tr><th>${nh(nom(sc, i))}</th><td>${f(c1[i])}</td><td>${f(c2[i])}</td><td><b>${f(c3[i])}</b></td></tr>`;
    pasos.push({ t: 'Before and after', html: `<table class="tabla"><tr><th>mol/L</th><th>Initial equilibrium</th><th>Just after the change</th><th>New equilibrium</th></tr>${presentes(nu).map(cmp).join('')}</table>` });
    const out = { modo: 'lc', coef, nu, act, libre, tipo, c0: c2, c1, c2, ceq: c3, x: r2.x, K: K1, K2, Q: Q2, s0: s, lo: r2.lo, hi: r2.hi, dn, pasos };
    if (!(tipo === 'temperatura') && sc.T !== undefined && !vacio(sc.T)) cierre(sc, out, K1, act, c3);
    return out;
  }


  function modoDG(sc, base) {
    const dG = num(sc, 'dG', 'ΔG° of the reaction (kJ per mole of reaction)'), T = num(sc, 'T', 'la temperatura (K)', { min: 0, estricto: true });
    const Kt = Math.exp((-dG * 1000) / (R_J * T));
    if (!(Kt > 1e-300 && Kt < 1e300)) throw new Error('With that ΔG° and that temperature K is practically 0 or infinite: the reaction does not occur or is complete, there is no equilibrium to calculate');
    const gas = gasesSolo(sc, base.act), dn = base.act.reduce((s, v) => s + v, 0), K = gas ? Kt * Math.pow(R_BAR * T, -dn) : Kt;
    const pasos = [{ t: 'K from ΔG°', html: `$K = e^{−{ΔG^"°"}/{R T}} = e^{−{${f(dG * 1000)}}/{${R_J} · ${f(T)}}} = ${f(Kt)}$.` + (gas ? ` Since everything is gas, this is $K_p$ (standard state at 1 bar). To work in mol/L: $K_c = K_p (R T)^{−Δn} = ${f(Kt)} · (${num2(R_BAR)} · ${f(T)})^{${num2(-dn)}} = ${f(K)}$ with $R = ${num2(R_BAR)} "bar·L/(mol·K)"$ and $Δn = ${num2(dn)}$.` : ' K has no units; it is used as $K_c$ (standard state 1 mol/L).') }];
    return modoEq(sc, base, { K, dG, Kp: Kt, pasos });
  }

  const L5 = ['A', 'B', 'C', 'D', 'E'];
  function modoDos(sc) {
    const nm = (i) => (vacio(sc['n' + L5[i]]) ? L5[i] : String(sc['n' + L5[i]]).trim());
    const leeNu = (r, i) => { const k = 'r' + r + L5[i]; if (vacio(sc[k])) return 0; const v = leeNum(sc[k]); if (!isFinite(v)) throw new Error(`The coefficient of ${nm(i)} in reaction ${r} must be a number (negative if it is a reactant)`); return v; };
    const nu1 = L5.map((_, i) => leeNu(1, i)), nu2 = L5.map((_, i) => leeNu(2, i));
    const c0 = L5.map((_, i) => { const k = 'c' + L5[i]; return vacio(sc[k]) ? 0 : num(sc, k, `the concentration of ${nm(i)}`, { min: 0 }); });
    const K1 = num(sc, 'K1', 'the constant K₁', { min: 0, estricto: true }), K2 = num(sc, 'K2', 'the constant K₂', { min: 0, estricto: true });
    for (const [r, nu] of [[1, nu1], [2, nu2]]) if (!nu.some((v) => v < 0) || !nu.some((v) => v > 0)) throw new Error(`Reaction ${r} needs at least one reactant (negative coefficient) and one product (positive)`);
    let par = true; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (Math.abs(nu1[i] * nu2[j] - nu1[j] * nu2[i]) > 1e-12) par = false;
    if (par) throw new Error('The two reactions are the same (or one is a multiple of the other): a single K is enough, use the other modes');
    const part = L5.map((_, i) => nu1[i] !== 0 || nu2[i] !== 0);
    const lnQ = (c, nu) => { let t = 0; for (let i = 0; i < 5; i++) if (nu[i]) t += nu[i] * Math.log(c[i]); return t; };
    const base = (x1) => c0.map((v, i) => v + nu1[i] * x1);
    const rango2 = (x1) => {
      const b = base(x1); let lo = -Infinity, hi = Infinity, libre = Infinity;
      for (let i = 0; i < 5; i++) { if (nu2[i] > 0) lo = Math.max(lo, -b[i] / nu2[i]); else if (nu2[i] < 0) hi = Math.min(hi, b[i] / -nu2[i]); else if (nu1[i] !== 0) libre = Math.min(libre, b[i]); }
      return { lo, hi, ancho: Math.min(hi - lo, libre) };
    };
    const x2de = (x1) => {
      const { lo, hi } = rango2(x1); let a = lo, b = hi; const g = (x2) => lnQ(c0.map((v, i) => v + nu1[i] * x1 + nu2[i] * x2), nu2) - Math.log(K2);
      for (let k = 0; k < 300; k++) { const m = (a + b) / 2, v = g(m); if (!isFinite(v)) break; if (v > 0) b = m; else a = m; if (b - a < 1e-17 * Math.max(1, Math.abs(m))) break; }
      return (a + b) / 2;
    };
    const M = 1e3 * Math.max(1, c0.reduce((s, v) => s + v, 0));
    let a = -M, b = M;
    for (let k = 0; k < 300; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (rango2(m1).ancho < rango2(m2).ancho) a = m1; else b = m2; }
    const xm = (a + b) / 2;
    if (!(rango2(xm).ancho > 1e-14)) throw new Error('With those concentrations neither reaction can advance: enter some reactant');
    const borde = (x0, x1) => { let u = x0, v = x1; for (let k = 0; k < 300; k++) { const m = (u + v) / 2; if (rango2(m).ancho > 0) u = m; else v = m; } return u; };
    const A = rango2(-M).ancho > 0 ? -M : borde(xm, -M), B = rango2(M).ancho > 0 ? M : borde(xm, M);
    let u = Math.min(A, B), v = Math.max(A, B);
    const h = (x1) => { const x2 = x2de(x1); return lnQ(c0.map((c, i) => c + nu1[i] * x1 + nu2[i] * x2), nu1) - Math.log(K1); };
    for (let k = 0; k < 300; k++) { const m = (u + v) / 2, hv = h(m); if (!isFinite(hv)) break; if (hv > 0) v = m; else u = m; if (v - u < 1e-17 * Math.max(1, Math.abs(m))) break; }
    const x1 = (u + v) / 2, x2 = x2de(x1), ceq = c0.map((c, i) => Math.max(0, c + nu1[i] * x1 + nu2[i] * x2));
    const Q1 = Math.exp(lnQ(ceq, nu1)), Q2 = Math.exp(lnQ(ceq, nu2));
    const lado = (nu, sg) => L5.map((_, i) => (nu[i] * sg > 0 ? (Math.abs(nu[i]) === 1 ? '' : num2(Math.abs(nu[i])) + ' ') + nh(nm(i)) : '')).filter(Boolean).join(' + ');
    const ec = (nu) => `${lado(nu, -1)} ⇌ ${lado(nu, 1)}`;
    const kex = (nu, k) => { const t = (sg) => L5.map((_, i) => (nu[i] * sg > 0 ? `[${qn(nm(i))}]${Math.abs(nu[i]) === 1 ? '' : `^{${num2(Math.abs(nu[i]))}}`}` : '')).filter(Boolean).join(' '); return `K_${k} = {${t(1)}}/{${t(-1)}}`; };
    const idx = L5.map((_, i) => i).filter((i) => part[i]);
    const cam = (i) => [nu1[i] ? `${nu1[i] < 0 ? '−' : '+'}${Math.abs(nu1[i]) === 1 ? '' : num2(Math.abs(nu1[i])) + '·'}x₁` : '', nu2[i] ? `${nu2[i] < 0 ? '−' : '+'}${Math.abs(nu2[i]) === 1 ? '' : num2(Math.abs(nu2[i])) + '·'}x₂` : ''].join(' ').trim();
    const tabla = `<table class="tabla"><tr><th><span class="solo-lector">Species</span></th>${idx.map((i) => `<th>${nh(nm(i))}</th>`).join('')}</tr><tr><th>Initial</th>${idx.map((i) => `<td>${f(c0[i])}</td>`).join('')}</tr><tr><th>Change</th>${idx.map((i) => `<td>${cam(i)}</td>`).join('')}</tr><tr><th>Equilibrium</th>${idx.map((i) => `<td><b>${f(ceq[i])}</b></td>`).join('')}</tr></table>`;
    const pasos = [
      { t: 'The two reactions', html: `Reaction 1: ${ec(nu1)}, with $${kex(nu1, 1)} = ${f(K1)}$.<br>Reaction 2: ${ec(nu2)}, with $${kex(nu2, 2)} = ${f(K2)}$.<br>They share species, so both constants hold at once with the same concentrations.` },
      { t: 'One progress variable per reaction', html: `Let $x_1$ and $x_2$ be how far each reaction advances (mol/L). Each species changes by the sum of what belongs to it from the two:<br>${tabla}` },
      { t: 'Two equations, two unknowns', html: '$Q_1 = K_1$ and $Q_2 = K_2$ are required with those concentrations. In general there is no closed formula: it is solved numerically (for each $x_1$ the $x_2$ that satisfies reaction 2 is found and then the $x_1$ that satisfies 1 is sought; both functions are monotonic, so there is a single solution).' },
      { t: 'Solution', html: `$x_1 = ${f(x1)} "mol/L"$ and $x_2 = ${f(x2)} "mol/L"$: ${idx.map((i) => `$[${qn(nm(i))}] = ${f(ceq[i])}$`).join(', ')}.` },
      { t: 'Check', html: `$Q_1 = ${f(Q1)}$ (must equal $K_1 = ${f(K1)}$) and $Q_2 = ${f(Q2)}$ (must equal $K_2 = ${f(K2)}$).` },
    ];
    const curva = [], paso = Math.max(Math.abs(x1), 1e-3), e0 = Math.max(Math.min(A, B), x1 - 6 * paso), e1 = Math.min(Math.max(A, B), x1 + 6 * paso);
    for (let k = 1; k < 80; k++) { const t = e0 + ((e1 - e0) * k) / 80; if (rango2(t).ancho > 1e-14) { const y2 = x2de(t); curva.push({ x: t, c: c0.map((c, i) => Math.max(0, c + nu1[i] * t + nu2[i] * y2)) }); } }
    return { modo: 'dos', nombres: L5.map((_, i) => nm(i)), nu1, nu2, c0, ceq, x: x1, x1, x2, K: K1, K1, K2, Q1, Q2, curva, part, reaccion: `${ec(nu1)}  ·  ${ec(nu2)}`, pasos, nu: part.map((p) => (p ? 1 : 0)) };
  }

  function resolver(sc) {
    ajusta();
    if (sc.modo === 'dos') return modoDos(sc);
    const base = lee(sc);
    if (!presentes(base.nu).some((i) => base.nu[i] < 0) || !presentes(base.nu).some((i) => base.nu[i] > 0)) throw new Error('At least one reactant and one product are needed');
    if (!presentes(base.act).length) throw new Error('All the species are pure solids or liquids: K would be 1 and there is nothing to calculate. Leave at least one gas or dissolved species');
    const m = sc.modo || 'K';
    const r = m === 'dG' ? modoDG(sc, base) : m === 'eq' ? modoEq(sc, base) : m === 'Q' ? modoQ(sc, base) : m === 'lc' ? modoLC(sc, base) : modoK(sc, base);
    r.nombres = [0, 1, 2, 3].map((i) => nom(sc, i));
    r.reaccion = reaccionH(sc, base.coef);
    return r;
  }

  const ej = (clave, nombre, sc) => ({ clave, nombre, sc: Object.assign({ nA: 'H2', nB: 'I2', nC: 'HI', nD: '', a: '1', b: '1', c: '2', d: '', cA: '', cB: '', cC: '', cD: '', T: '' }, sc) });
  const N2O4 = { nA: 'N2O4', nB: '', nC: 'NO2', nD: '', a: '1', b: '', c: '2', d: '' };
  const ejemplos = [
    ej('hi', 'H₂ + I₂ ⇌ 2 HI: concentrations with Kc = 50', { modo: 'eq', cA: '1', cB: '1', K: '50', T: '731' }),
    ej('n2o4', 'N₂O₄ ⇌ 2 NO₂: degree of dissociation', { ...N2O4, modo: 'eq', cA: '0,1', cC: '0', K: '0,2', T: '400' }),
    ej('calcular-k', 'Calculate Kc from measured [HI]', { modo: 'K', cA: '1', cB: '1', especie: 'C', ceq: '1,2' }),
    ej('q', 'N₂O₄ ⇌ 2 NO₂: which way does it go?', { ...N2O4, modo: 'Q', cA: '0,1', cC: '0,4', K: '0,2' }),
    ej('lc-anadir', 'Le Chatelier: adding H₂ to the equilibrium', { modo: 'lc', cA: '1', cB: '1', K: '50', tipo: 'anadir', esp: 'A', cant: '1' }),
    ej('lc-volumen', 'Le Chatelier: compressing N₂O₄ ⇌ 2 NO₂ to half', { ...N2O4, modo: 'lc', cA: '0,1', cC: '0', K: '0,2', tipo: 'volumen', rv: '0,5' }),
    ej('carbonato', 'CaCO₃(s) ⇌ CaO(s) + CO₂(g): solids do not enter K (Kc = 0.0025)', { modo: 'eq', nA: 'CaCO3', nB: '', nC: 'CaO', nD: 'CO2', a: '1', b: '', c: '1', d: '1', fA: 's', fC: 's', fD: 'g', cA: '', cD: '0', K: '0,0025', T: '1000' }),
    ej('carbono-co2', 'C(s) + CO₂(g) ⇌ 2 CO(g): with excess carbon (Kc = 0.2)', { modo: 'eq', nA: 'C', nB: 'CO2', nC: 'CO', nD: '', a: '1', b: '1', c: '2', d: '', fA: 's', fB: 'g', fC: 'g', cA: '', cB: '1', cC: '0', K: '0,2', T: '1100' }),
    ej('dg-amoniaco', 'N₂ + 3 H₂ ⇌ 2 NH₃ at 298 K with ΔG° = −32.8 kJ/mol (K from ΔG°)', { modo: 'dG', nA: 'N2', nB: 'H2', nC: 'NH3', nD: '', a: '1', b: '3', c: '2', d: '', cA: '1', cB: '3', cC: '0', dG: '-32,8', T: '298' }),
    ej('dos-cadena', 'Two chained equilibria: A ⇌ B (K₁ = 2) and B ⇌ C (K₂ = 0.5), with 1 M of A', { modo: 'dos', nA: 'A', nB: 'B', nC: 'C', nD: '', nE: '', r1A: '-1', r1B: '1', r1C: '', r1D: '', r1E: '', r2A: '', r2B: '-1', r2C: '1', r2D: '', r2E: '', cA: '1', cB: '', cC: '', cD: '', cE: '', K1: '2', K2: '0,5' }),
    ej('dos-cloro', 'PCl₅ ⇌ PCl₃ + Cl₂ and Cl₂ + CO ⇌ COCl₂ (example constants)', { modo: 'dos', nA: 'PCl5', nB: 'PCl3', nC: 'Cl2', nD: 'CO', nE: 'COCl2', r1A: '-1', r1B: '1', r1C: '1', r1D: '', r1E: '', r2A: '', r2B: '', r2C: '-1', r2D: '-1', r2E: '1', cA: '0,5', cB: '', cC: '', cD: '1', cE: '', K1: '0,04', K2: '20' }),
    ej('lc-temperatura', 'Le Chatelier: heating N₂O₄ ⇌ 2 NO₂ (ΔH = +57.2 kJ/mol)', { ...N2O4, modo: 'lc', cA: '0,1', cC: '0', K: '4,6e-3', T: '298', tipo: 'temperatura', T2: '350', dH: '57,2' }),
  ];

  return { resolver, ejemplos, f, leeNum, cociente, avance, TIPOS_LC };
})();

