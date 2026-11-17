(() => {
  const { $, esc, copia, vacio, txt } = Herramienta;
  const K = Cinetica, f = K.f, CLAVE = 'cinetica-v1', MAXE = 6;
  const MODOS = [['orden', 'Integrated law (order 0, 1 or 2)'], ['datos', 'Order from [A]–t data'], ['iniciales', 'Method of initial rates'], ['arrhenius', 'Arrhenius equation'], ['consecutivas', 'Consecutive A → B → C and reversible'], ['mecanismo', 'Reaction mechanism']];

  let sc = copia(K.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0, vista = null;

  const fila = (k, nom, un, modo = 'decimal') => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="${modo}" autocomplete="off" spellcheck="false">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const unidT = () => elige('ut', 'Time unit', [['s', 'segundos (s)'], ['min', 'minutos (min)'], ['h', 'horas (h)'], ['d', 'days (d)'], ['a', 'years']]);
  const sep = (t) => `<div class="sep">${t}</div>`;
  const ancho = (k, nom, un) => `<label for="f-${k}" class="ancho">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in ancho" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`;
  const nr = () => (['1', '2', '3'].includes(String(sc.nr)) ? +sc.nr : sc.conB ? 2 : 1);
  const LETRAS = ['A', 'B', 'C'];
  const NOTAS = {
    orden: 'The final concentration is optional: with it, the time it takes to get there is calculated. The coefficient a is that of A in the reaction (empty = 1). 5.1e-4 or 5.1·10^-4 is accepted.',
    datos: 'Enter the times and concentrations separated by spaces or semicolons, in the same order.',
    iniciales: 'Each experiment is a row with the initial concentrations and the measured initial rate. To see an order, change one reactant and keep the others equal.',
    consecutivas: 'A → B → C: two consecutive order-1 steps; A ⇌ B: a reversible reaction. The concentrations are plotted and the maximum of B or the equilibrium is calculated.',
    mecanismo: 'Write one elementary step per line with -> (irreversible) or <=> (reversible), with coefficients (2 NO). Indicate the slow step, or the one that forms the product if you use the steady state. The experimental orders are optional: NO=2, O2=1.',
    arrhenius: 'With two constants at two temperatures you get the activation energy; with it and one constant, the constant at another temperature; with three or more, the fitted line. ΔH and the catalyst are optional.',
  };
  function formulario() {
    let h = elige('modo', 'What to calculate', MODOS);
    if (sc.modo === 'orden') {
      const kde = sc.kde || 'k';
      h += elige('n', 'Order of the reaction', [['0', 'Order 0'], ['1', 'Order 1'], ['2', 'Order 2']]) + fila('a', 'Coefficient of A', 'a A → productos') + elige('kde', 'La constante', [['k', 'I know: k'], ['t12', 'Comes from the half-life'], ['pct', 'Comes from a % that has reacted'], ['med', 'Comes from two measurements']]);
      h += kde === 't12' ? fila('t12', 'Half-life t₁/₂') : kde === 'pct' ? fila('pct', 'Ha reaccionado', '%') + fila('tp', 'at a time') : kde === 'med' ? fila('t1', 'Time t₁') + fila('A1', '[A] at t₁', 'mol/L') + fila('t2', 'Time t₂') + fila('A2', '[A] at t₂', 'mol/L') : fila('k', 'Constant k');
      h += fila('A0', 'Initial concentration [A]₀', 'mol/L') + fila('t', 'Time t') + fila('C', 'Concentration to reach', '(opcional)') + unidT();
    }
    else if (sc.modo === 'datos') h += `<label for="f-ts" class="ancho">Times</label><input id="f-ts" class="in ancho" data-k="ts" value="${esc(sc.ts)}" autocomplete="off" spellcheck="false"><label for="f-As" class="ancho">Concentrations [A] <small>mol/L</small></label><input id="f-As" class="in ancho" data-k="As" value="${esc(sc.As)}" autocomplete="off" spellcheck="false">` + unidT();
    else if (sc.modo === 'consecutivas') {
      h += elige('tipo', 'Which reaction', [['abc', 'A → B → C (consecutivas)'], ['rev', 'A ⇌ B (reversible)']]) + (sc.tipo === 'rev' ? fila('kf', 'Forward constant kf') + fila('kr', 'Reverse constant kr') + fila('A0', 'Initial concentration [A]₀', 'mol/L') + fila('B0', 'Initial concentration [B]₀', 'mol/L, opcional') : fila('k1', 'Constant k₁ (A → B)') + fila('k2', 'Constant k₂ (B → C)') + fila('A0', 'Initial concentration [A]₀', 'mol/L')) + unidT();
    }
    else if (sc.modo === 'mecanismo') {
      h += `<label for="f-etapas" class="ancho">Steps (one per line)</label><textarea id="f-etapas" class="in ancho" data-k="etapas" rows="4" autocomplete="off" spellcheck="false" style="font-family:var(--f-mono)">${esc(sc.etapas ?? '')}</textarea>` + elige('metodo', 'How to obtain the law', [['lenta', 'Slow step (with prior equilibria)'], ['ee', 'Steady state of the intermediate']]) + fila('lenta', sc.metodo === 'ee' ? 'Step that forms the product' : 'Slow step', 'n.º', 'numeric') + fila('exp', 'Measured orders', 'opcional: NO=2, O2=1', 'text');
    }
    else if (sc.modo === 'iniciales') {
      const r = nr(), Ls = LETRAS.slice(0, r), cl = `exp r${r}`;
      sc.nr = String(r); delete sc.conB;
      h += elige('nr', 'Reactants', [['1', 'Only A'], ['2', 'A y B'], ['3', 'A, B y C']]) + unidT();
      h += `<div class="exps ancho"><div class="${cl} cab"><span>No.</span>${Ls.map((L) => `<span>[${L}]₀</span>`).join('')}<span>v₀ <small>mol·L⁻¹·${esc(K.unidT(sc.ut))}⁻¹</small></span><span></span></div>${sc.exps.map((e, i) => `<div class="${cl}"><span>${i + 1}</span>${[...Ls, 'v'].map((c) => `<input class="in" data-i="${i}" data-c="${c}" value="${esc(e[c] ?? '')}" inputmode="decimal" autocomplete="off" aria-label="${c === 'v' ? 'Rate' : `[${c}]`} of experiment ${i + 1}">`).join('')}${sc.exps.length > r + 1 ? `<button class="btn quita" type="button" data-quita="${i}" aria-label="Remove experiment ${i + 1}">×</button>` : '<span></span>'}</div>`).join('')}</div>${sc.exps.length < MAXE ? '<button class="btn ancho" id="mas" type="button">+ Add experiment</button>' : ''}`;
    } else {
      const k2 = sc.tipo === 'k2';
      h += elige('tipo', 'What to find', [['ea', 'The activation energy'], ['k2', 'The constant at another temperature'], ['ajuste', 'Eₐ with several temperatures']]) + elige('uT', 'Temperatures in', [['K', 'kelvin (K)'], ['C', 'degrees Celsius (°C)']]);
      if (sc.tipo === 'ajuste') h += ancho('Ts', 'Temperatures') + ancho('ks', 'Constants k', 'in the same order');
      else h += (k2 ? fila('Ea', 'Activation energy Eₐ', 'kJ/mol') : '') + fila('k1', 'Constant k₁') + fila('T1', 'Temperature T₁') + (k2 ? '' : fila('k2', 'Constant k₂')) + fila('T2', 'Temperature T₂');
      h += sep('Optional') + fila('dH', 'Enthalpy of reaction ΔH', 'kJ/mol') + fila('Eac', 'Eₐ with catalyst', 'kJ/mol');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
    if (t.dataset.c) sc.exps[+t.dataset.i][t.dataset.c] = t.value; else sc[t.dataset.k] = t.value;
    cambia();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(K.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (k === 'nr') { sc.nr = t.value; delete sc.conB; const r = +t.value; for (const x of sc.exps) for (const L of LETRAS.slice(0, r)) if (vacio(x[L])) x[L] = '0,1'; while (sc.exps.length < r + 1) sc.exps.push(Object.fromEntries([...LETRAS.slice(0, r).map((L) => [L, '0,1']), ['v', '']])); }
    else if (k === 'kde') { sc.kde = t.value; const d = { t12: { t12: '100' }, pct: { pct: '50', tp: '60' }, med: { t1: '0', A1: sc.A0 || '0,1', t2: '60', A2: '' } }[t.value] || {}; for (const [c, v] of Object.entries(d)) if (vacio(sc[c])) sc[c] = v; if (t.value === 'k' && vacio(sc.k)) sc.k = '0,01'; }
    else { sc[k] = t.value; if (sc.modo === 'consecutivas' && k === 'tipo') { const d = t.value === 'rev' ? { kf: '0,3', kr: '0,1' } : { k1: '0,2', k2: '0,1' }; for (const [c, v] of Object.entries(d)) if (vacio(sc[c])) sc[c] = v; } if (k === 'tipo' && t.value === 'k2' && vacio(sc.Ea)) sc.Ea = '50'; if (k === 'tipo' && t.value === 'ea' && vacio(sc.k2)) sc.k2 = '0,05'; if (k === 'tipo' && t.value === 'ajuste') { if (vacio(sc.Ts)) sc.Ts = '300 310 320 330'; if (vacio(sc.ks)) sc.ks = '0,001 0,0026 0,0063 0,014'; } }
    formulario(); cambia();
  });
  $('#campos').addEventListener('click', (e) => {
    const q = e.target.closest('[data-quita]');
    if (q) { sc.exps.splice(+q.dataset.quita, 1); formulario(); cambia(); return; }
    if (e.target.id === 'mas') { sc.exps.push({ A: '', v: '' }); formulario(); cambia(); $(`#campos [data-i="${sc.exps.length - 1}"][data-c="A"]`).focus(); }
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + MODOS.map(([k, n]) => `<optgroup label="${n}">${K.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = K.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), toma = (xs) => xs[ent(0, xs.length - 1)], c = (v) => String(+v.toPrecision(3)).replace('.', '.');
    const tipos = [
      () => { const n = ent(0, 2), A0 = toma([0.1, 0.2, 0.5, 1, 0.05]), k = n === 0 ? A0 / toma([100, 200, 500]) : n === 1 ? toma([0.01, 0.002, 0.05, 1e-3]) : toma([0.5, 1, 2, 0.1]); return { modo: 'orden', n: String(n), k: c(k), A0: c(A0), t: String(toma([10, 30, 60, 100, 120])), C: c(A0 / toma([2, 4, 5])), ut: 's' }; },
      () => { const n = ent(0, 2), A0 = toma([0.5, 1, 0.2]), dt = toma([5, 10, 20]), N = 6, k = n === 0 ? (A0 * 0.8) / (dt * (N - 1)) : n === 1 ? toma([0.02, 0.05, 0.03]) : toma([0.2, 0.5, 1]) / A0 / 10; const ts = Array.from({ length: N }, (_, i) => i * dt); return { modo: 'datos', ts: ts.join(' '), As: ts.map((t) => c(K.conc(n, k, A0, t))).join(' '), ut: 'min' }; },
      () => { const m = ent(0, 2), n = ent(0, 2), k = toma([0.5, 2, 10, 25]), A = toma([0.01, 0.1, 0.05]), B = toma([0.01, 0.1, 0.02]), v = (a, b, cc = 1) => c(k * a ** m * b ** n * cc ** p), p = ent(0, 2), C = toma([0.05, 0.1, 0.2]);
        return ent(0, 2) ? { modo: 'iniciales', nr: '2', ut: 's', exps: [{ A: c(A), B: c(B), v: v(A, B) }, { A: c(2 * A), B: c(B), v: v(2 * A, B) }, { A: c(A), B: c(3 * B), v: v(A, 3 * B) }] } : { modo: 'iniciales', nr: '3', ut: 's', exps: [{ A: c(A), B: c(B), C: c(C), v: v(A, B, C) }, { A: c(2 * A), B: c(B), C: c(C), v: v(2 * A, B, C) }, { A: c(A), B: c(2 * B), C: c(C), v: v(A, 2 * B, C) }, { A: c(A), B: c(B), C: c(2 * C), v: v(A, B, 2 * C) }] }; },
      () => { const n = ent(0, 2), A0 = toma([0.1, 0.2, 0.5]), h = toma([20, 30, 50, 100]), kde = toma(['t12', 'pct']); return { modo: 'orden', n: String(n), kde, t12: String(h), pct: String(toma([25, 50, 75, 90])), tp: String(toma([20, 40, 60])), A0: c(A0), t: String(toma([30, 60, 100])), C: '', ut: 'min' }; },
      () => { const Ea = toma([40, 50, 60, 75, 90]), T1 = toma([298, 300, 310]), T2 = T1 + toma([10, 20, 30]), k1 = toma([1e-3, 0.01, 2e-4]); if (!ent(0, 2)) return { modo: 'arrhenius', tipo: 'k2', uT: 'K', Ea: String(Ea), k1: c(k1), T1: String(T1), T2: String(T2), Eac: String(Ea - toma([10, 20, 30])), dH: String(toma([-60, -30, 20])) }; return ent(0, 1) ? { modo: 'arrhenius', tipo: 'k2', uT: 'K', Ea: String(Ea), k1: c(k1), T1: String(T1), T2: String(T2) } : { modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: c(k1), T1: String(T1), k2: c(k1 * Math.exp((-Ea * 1000 / K.R) * (1 / T2 - 1 / T1))), T2: String(T2) }; },
    ];
    sc = toma(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const u = K.unidT(sc.ut), gC = sc.uT === 'C' ? '°C' : 'K';
    if (sc.modo === 'orden') {
      const a = vacio(sc.a) || leeA() === 1 ? '' : `${esc(sc.a)} `, kd = sc.kde === 't12' ? `vida media ${esc(sc.t12)} ${u}` : sc.kde === 'pct' ? `${esc(sc.pct)} % of A reacting in ${esc(sc.tp)} ${u}` : sc.kde === 'med' ? `[A] = ${esc(sc.A1)} mol/L at ${esc(sc.t1)} ${u} and ${esc(sc.A2)} mol/L at ${esc(sc.t2)} ${u}` : `k = ${esc(sc.k)}`;
      return `A reaction ${a}A → products is of <b>order ${esc(sc.n)}</b> with ${kd} and [A]₀ = ${esc(sc.A0)} mol/L. ${sc.kde && sc.kde !== 'k' ? 'Calculate k, ' : 'Calculate '}[A] at ${esc(sc.t)} ${u}, the half-life${vacio(sc.C) ? '' : ` and how long it takes to reach ${esc(sc.C)} mol/L`}.`;
    }
    if (sc.modo === 'consecutivas') return sc.tipo === 'rev' ? `A reaction A ⇌ B has kf = ${esc(sc.kf)} and kr = ${esc(sc.kr)} (in ${u}⁻¹) and starts with [A]₀ = ${esc(sc.A0)} mol/L. Calculate the <b>equilibrium constant and concentrations</b> and the time constant.` : `In A → B → C with k₁ = ${esc(sc.k1)} and k₂ = ${esc(sc.k2)} (in ${u}⁻¹) and [A]₀ = ${esc(sc.A0)} mol/L, calculate <b>when the concentration of B is at its maximum</b> and what it is.`;
    if (sc.modo === 'mecanismo') return `With the mechanism (${esc(String(sc.etapas).replace(/\n/g, '; '))}), find the <b>overall reaction</b>, the intermediates and the <b>rate law</b> using ${sc.metodo === 'ee' ? 'the steady state' : 'the slow step'}.`;
    if (sc.modo === 'datos') return `With these measurements (t in ${u}: ${esc(sc.ts)}; [A] in mol/L: ${esc(sc.As)}), find the <b>order</b> of the reaction, the constant k and the half-life.`;
    if (sc.modo === 'iniciales') return `With the initial rates in the table, find the reaction <b>orders</b>, the constant k and the rate law.`;
    const extra = `${vacio(sc.Eac) ? '' : ` With a catalyst Eₐ drops to ${esc(sc.Eac)} kJ/mol: by how much is k multiplied at ${esc(sc.T1 ?? '')} ${gC}?`}${vacio(sc.dH) ? '' : ` If ΔH = ${esc(sc.dH)} kJ/mol, what is the Eₐ of the reverse reaction?`}`;
    if (sc.tipo === 'ajuste') return `With these constants (T in ${gC}: ${esc(sc.Ts)}; k: ${esc(sc.ks)}), calculate the <b>activation energy</b> and the frequency factor with the Arrhenius plot.${extra}`;
    return (sc.tipo === 'k2' ? `A reaction has Eₐ = ${esc(sc.Ea)} kJ/mol and k = ${esc(sc.k1)} at ${esc(sc.T1)} ${gC}. What is <b>k at ${esc(sc.T2)} ${gC}</b>?` : `The constant is ${esc(sc.k1)} at ${esc(sc.T1)} ${sc.uT === 'C' ? '°C' : 'K'} and ${esc(sc.k2)} at ${esc(sc.T2)} ${sc.uT === 'C' ? '°C' : 'K'}. Calculate the <b>activation energy</b> and the frequency factor.`) + extra;
  };
  const nh = (x) => String(x).replace(/(\d+)/g, '<sub>$1</sub>');
  const glob = (s) => { const l = (o) => Object.entries(o).map(([x, c]) => `${c === 1 ? '' : String(c).replace('.', '.') + ' '}${nh(x)}`).join(' + '); return `${l(s.global.re)} → ${l(s.global.pr)}`; };
  const ordenTxt = (o) => 'v = k' + Object.entries(o).map(([x, n]) => ` [${nh(x)}]${n === 1 ? '' : `<sup>${String(+n.toFixed(3)).replace('.', '.').replace('-', '−')}</sup>`}`).join('') + ` (orden total ${String(+Object.values(o).reduce((a, b) => a + b, 0).toFixed(3)).replace('.', '.').replace('-', '−')})`;
  const leeA = () => +String(sc.a).replace(',', '.');

  const dato = (t, v, cl = 'num') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = K.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#vistas').hidden = true;
      dibuja(); grafica(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'orden') {
      h = (sol.kde !== 'k' || sol.a !== 1 ? dato(sol.a !== 1 && sol.kde === 'k' ? 'Constant of A' : 'Constant', sol.a !== 1 ? `k<sub>A</sub> = ${f(sol.kA, 4)} ${sol.unidad}` : `k = ${f(sol.k, 4)} ${sol.unidad}`) : '') + dato(`[A] a t = ${f(sol.t)} ${sol.u}`, `${f(sol.A, 4)} mol/L`) + dato('Half-life', `t<sub>1/2</sub> = ${f(sol.t12, 4)} ${sol.u}`) + (sol.tC !== null ? dato(`Time until ${f(sol.C)} mol/L`, `${f(sol.tC, 4)} ${sol.u}`) : '') + dato('Initial rate', `${f(sol.v0)} mol·L⁻¹·${sol.u}⁻¹`);
      ley = `[A] versus t. The dotted lines mark each half-life${sol.n === 1 ? ', all equal' : ''}; the dot is the time you asked for.`;
    } else if (sol.modo === 'datos') {
      h = dato('Order', `orden ${sol.n}`, '') + dato('Constant', `k = ${f(sol.k, 4)} ${sol.unidad}`) + dato('Half-life', `t<sub>1/2</sub> = ${f(sol.t12, 4)} ${sol.u}`) + dato('R² of the line', sol.fits[sol.n].r2.toFixed(5).replace('.', '.'), '') + (sol.aviso ? dato('Note', sol.aviso, 'ancho aviso') : '');
      ley = 'The points are the measurements and the line is the least-squares line. Switch graphs to see that only one of the three comes out straight.';
    } else if (sol.modo === 'iniciales') {
      h = dato('Rate law', Mates.html(`$${sol.ley}$`), 'ancho') + dato('Order with respect to A', String(sol.oA).replace('.', '.')) + (sol.nr > 1 ? dato('Order with respect to B', String(sol.oB).replace('.', '.')) : '') + (sol.nr > 2 ? dato('Order with respect to C', String(sol.oC).replace('.', '.')) : '') + dato('Constant', `k = ${f(sol.k, 4)} ${sol.unidad}`);
      ley = 'Initial rate of each experiment: the bar is the measurement and the dot is the one given by the rate law.';
    } else if (sol.modo === 'consecutivas') {
      if (sol.tipo === 'rev') { h = dato('Equilibrium constant', `K = k<sub>f</sub>/k<sub>r</sub> = ${f(sol.K, 4)}`) + dato('[A] at equilibrium', `${f(sol.Aeq, 4)} mol/L`) + dato('[B] at equilibrium', `${f(sol.Beq, 4)} mol/L`) + dato('Time constant', `τ = ${f(sol.tau, 4)} ${K.unidT(sc.ut)}`) + dato('Half-life of the approach', `${f(sol.t12, 4)} ${K.unidT(sc.ut)}`); ley = 'Concentrations versus time: A falls and B rises until equilibrium (dotted lines).'; }
      else { h = dato('B is maximum at', `t = ${f(sol.tmax, 4)} ${K.unidT(sc.ut)}`) + dato('Maximum of B', `${f(sol.Bmax, 4)} mol/L (${f(100 * sol.Bmax / sol.A0, 3)} %)`) + dato('Slow step', sol.k1 < sol.k2 ? 'A → B' : sol.k1 > sol.k2 ? 'B → C' : 'ninguna', ''); ley = 'A falls, B rises to a maximum and falls, and C rises. The circle marks the maximum of B.'; }
    } else if (sol.modo === 'mecanismo') {
      h = dato('Overall reaction', glob(sol), 'num ancho') + dato('Intermediates', sol.intermedios.length ? sol.intermedios.map(nh).join(', ') : 'ninguno', '') + sol.leyes.map((l) => dato(l.nombre, l.ordenes ? ordenTxt(l.ordenes) : 'ver desarrollo', 'num ancho')).join('');
      if (sol.cuadra) h += dato('Versus the experiment', sol.cuadra.some((c) => c.ok) ? 'Consistent' : 'Does not reproduce the measured orders', 'ancho');
      ley = '';
    } else {
      h = (sol.tipo !== 'k2' ? dato('Activation energy', `E<sub>a</sub> = ${f(sol.Ea / 1000, 4)} kJ/mol`) : dato(`k a ${f(sol.uT === 'C' ? sol.T2 - 273.15 : sol.T2, 4)} ${sol.uT === 'C' ? '°C' : 'K'}`, `k₂ = ${f(sol.k2, 4)}`)) + dato('Frequency factor', `A = ${f(sol.A, 4)}`) + (sol.tipo === 'ajuste' ? dato('R² of the line', sol.r2.toFixed(5).replace('.', '.'), '') : dato('k₂/k₁', f(sol.r, 4))) + (sol.fcat !== null ? dato('With catalyst', `k × ${f(sol.fcat, 4)}`) : '') + (sol.dH !== null ? dato('Eₐ of the reverse', `${f(sol.Ea / 1000 - sol.dH, 4)} kJ/mol`) : '');
      ley = `Top, the energy diagram${sol.dH === null ? ' (enter ΔH to place the products)' : ''}${sol.Eac !== null ? ', with the catalyst path dashed' : ''}. Bottom, ln k versus 1/T: a straight line of slope −Eₐ/R. The steeper it is, the more k rises on heating.`;
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#vistas').hidden = sol.modo !== 'datos';
    if (sol.modo === 'datos') { vista = sol.n; marcaVista(); }
    $('#escena').hidden = sol.modo === 'iniciales' || sol.modo === 'consecutivas' || sol.modo === 'mecanismo'; $('#grafica').hidden = sol.modo === 'mecanismo'; $('#play').hidden = !(sol.modo === 'orden' || sol.modo === 'datos');
    tA = 0; particulas(); dibuja(); grafica(); exporta();
  }
  const n6 = (v) => String(+Number(v).toPrecision(6)).replace('.', '.');
  function datosGrafica() {
    if (!sol) return null;
    if (sol.modo === 'orden') { const T = tMax(); return { cab: [`t (${sol.u})`, '[A] (mol/L)'], filas: Array.from({ length: 41 }, (_, i) => { const t = (T * i) / 40; return [n6(t), n6(sol.c(t))]; }) }; }
    if (sol.modo === 'datos') return { cab: [`t (${sol.u})`, '[A] (mol/L)', 'ln [A]', '1/[A]'], filas: sol.ts.map((t, i) => [n6(t), n6(sol.As[i]), n6(Math.log(sol.As[i])), n6(1 / sol.As[i])]) };
    if (sol.modo === 'consecutivas') return { cab: [`t (${K.unidT(sc.ut)})`, ...sol.especies.map((e) => `[${e}] (mol/L)`)], filas: sol.curva.filter((_, i) => i % 5 === 0).map((p) => [n6(p.t), ...sol.especies.map((e) => n6(p[e]))]) };
    if (sol.modo === 'iniciales') return { cab: ['Experiment', 'v₀ medida', 'v₀ from the law'], filas: sol.E.map((e, i) => [String(i + 1), n6(e.v), n6(sol.vLey(e))]) };
    if (sol.modo === 'arrhenius') { const P = sol.pts || [{ T: sol.T1, k: sol.k1 }, { T: sol.T2, k: sol.k2 }]; return { cab: ['1000/T (1/K)', 'ln k'], filas: P.map((q) => [n6(1000 / q.T), n6(Math.log(q.k))]) }; }
    return null;
  }
  function exporta() { if (sol && sol.modo !== 'mecanismo') Herramienta.exportar('#grafica', { nombre: 'cinetica-' + sol.modo, titulo: 'Kinetics: ' + (MODOS.find(([k]) => k === sol.modo) || ['', ''])[1], etiqueta: 'the graph', datos: datosGrafica }); }
  const marcaVista = () => { for (const b of document.querySelectorAll('#vistas button')) b.setAttribute('aria-pressed', String(+b.dataset.v === vista)); };
  $('#vistas').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; vista = +b.dataset.v; marcaVista(); grafica(); });

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--panel', '--suelo', '--peso', '--tension', '--roz']) col[k] = cs.getPropertyValue(k).trim(); }
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Resume'; });
  const NP = 60;
  let parts = [];
  function particulas() {
    parts = Array.from({ length: NP }, (_, i) => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, u: (i + Math.random()) / NP }));
    parts.sort(() => Math.random() - 0.5);
  }
  const tMax = () => (sol.modo === 'datos' ? sol.ts[sol.ts.length - 1] : Math.max(sol.t, sol.tC || 0, (sol.n === 0 ? 1.1 * sol.A0 / (sol.kA ?? sol.k) : 3 * sol.t12)));
  const tDe = () => { const T = tMax(), ciclo = 9; return Math.min(1, (tA % ciclo) / 7.5) * T; };
  function lienzo(c) {
    if (!c.clientWidth || !c.clientHeight) return null;
    const r = Herramienta.lienzo(c);
    return r;
  }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  function mueve(dt) {
    for (const q of parts) {
      q.vx += (Math.random() - 0.5) * dt; q.vy += (Math.random() - 0.5) * dt;
      const v = Math.hypot(q.vx, q.vy); if (v > 0.35) { q.vx *= 0.35 / v; q.vy *= 0.35 / v; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.x < 0 || q.x > 1) { q.vx = -q.vx; q.x = Math.max(0, Math.min(1, q.x)); }
      if (q.y < 0 || q.y > 1) { q.vy = -q.vy; q.y = Math.max(0, Math.min(1, q.y)); }
    }
  }
  function dibuja() {
    const c = $('#escena'); if (c.hidden || !sol) return;
    const L = lienzo(c); if (!L) return;
    const { g, w, h } = L;
    if (!col['--ink']) colores();
    if (sol.modo === 'arrhenius') { energia(g, w, h); return; }
    const t = tDe(), fr = Math.max(0, sol.c(t) / sol.c(0));
    const bw = Math.min(w * 0.46, 320), bx = w * 0.06, by = 14, bh = h - 34;
    g.fillStyle = col['--line']; g.globalAlpha = 0.45; g.fillRect(bx, by + bh * 0.12, bw, bh * 0.88); g.globalAlpha = 1;
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 4, by); g.lineTo(bx, by + bh); g.lineTo(bx + bw, by + bh); g.lineTo(bx + bw + 4, by); g.stroke();
    let nA = 0;
    for (const q of parts) {
      const x = bx + 10 + q.x * (bw - 20), y = by + bh * 0.12 + 10 + q.y * (bh * 0.88 - 20), esA = q.u < fr;
      if (esA) { nA++; punto(g, x - 3.5, y, 5, col['--accent']); punto(g, x + 3.5, y, 5, col['--accent']); } else { punto(g, x - 4, y + 2, 3.6, col['--muted']); punto(g, x + 4, y - 2, 3.6, col['--muted']); }
    }
    const tx = bx + bw + 24;
    punto(g, tx, by + 22, 5, col['--accent']); texto(g, tx + 12, by + 22, 'A', col['--ink'], 'left');
    punto(g, tx, by + 44, 3.6, col['--muted']); texto(g, tx + 12, by + 44, 'productos', col['--ink'], 'left');
    texto(g, tx, by + 80, `t = ${txt(f(t, 3))} ${sol.u}`, col['--ink'], 'left', '600 ');
    texto(g, tx, by + 102, `[A] = ${txt(f(sol.c(t), 3))} mol/L`, col['--ink'], 'left', '600 ');
    texto(g, tx, by + 124, `${txt(f(100 * fr, 3))} % remains (${nA} of ${NP})`, col['--muted'], 'left');
  }

  function energia(g, w, h) {
    const Ea = sol.Ea / 1000, dH = sol.dH ?? 0, Ec = sol.Eac === null ? null : sol.Eac / 1000;
    if (!(Ea > 0)) { texto(g, w / 2, h / 2, 'With negative Eₐ there is no barrier to draw', col['--muted']); return; }
    const estrecho = w < 520, top = Math.max(Ea, dH) * 1.12, bot = Math.min(0, dH) - 0.12 * Ea, mL = estrecho ? 12 : 46, mR = estrecho ? 84 : Math.min(150, w * 0.3), mT = 12, mB = 16;
    const X = (u) => mL + (estrecho ? 62 : 30) + u * (w - mL - mR - (estrecho ? 70 : 60)), Y = (E) => mT + ((top - E) / (top - bot)) * (h - mT - mB);
    const curva = (H, u) => { const v = Math.min(1, Math.max(0, (u - 0.2) / 0.6)); return dH * v * v * (3 - 2 * v) + H * Math.sin(Math.PI * v) ** 2; };
    const traza = (H, color, rayas) => { let um = 0, Em = -Infinity; g.strokeStyle = color; g.lineWidth = 2.4; g.setLineDash(rayas ? [6, 4] : []); g.beginPath(); for (let i = 0; i <= 300; i++) { const u = i / 300, E = curva(H, u); if (E > Em) { Em = E; um = u; } i ? g.lineTo(X(u), Y(E)) : g.moveTo(X(u), Y(E)); } g.stroke(); g.setLineDash([]); return { um, Em }; };
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(mL, h - mB); g.lineTo(mL, mT); g.lineTo(mL - 4, mT + 7); g.moveTo(mL, mT); g.lineTo(mL + 4, mT + 7); g.stroke();
    if (!estrecho) { g.save(); g.translate(mL - 12, (h - mB + mT) / 2); g.rotate(-Math.PI / 2); texto(g, 0, 0, 'Energy', col['--muted']); g.restore(); }
    texto(g, X(0.5), h - 6, 'reaction progress →', col['--muted']);
    g.strokeStyle = col['--line']; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(1) + 40, Y(0)); g.stroke(); g.setLineDash([]);
    if (Ec !== null) traza(Ec - dH / 2, col['--tension'], true);
    const P = traza(Ea - dH / 2, col['--accent'], false);
    texto(g, X(0.08), Y(0) - 10, 'reactivos', col['--ink'], 'center', '600 ');
    texto(g, X(0.92), Y(dH) + (dH < 0 ? 12 : -10), sol.dH === null ? 'productos' : 'productos', col['--ink'], 'center', '600 ');
    const flecha = (x, y1, y2, color) => { g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y2); g.stroke(); const d = y2 < y1 ? 1 : -1; g.beginPath(); g.moveTo(x, y2); g.lineTo(x - 4, y2 + 7 * d); g.lineTo(x + 4, y2 + 7 * d); g.fill(); };
    const xa = X(0.24);
    g.strokeStyle = col['--line']; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(xa - 6, Y(P.Em)); g.lineTo(X(P.um), Y(P.Em)); g.stroke(); g.setLineDash([]);
    flecha(xa, Y(0), Y(P.Em), col['--peso']);
    const etiqueta = (x, y, nom, v, color, al) => { if (estrecho) { texto(g, x, y - 8, `${nom} =`, color, al, '600 '); texto(g, x, y + 8, `${v} kJ/mol`, color, al, '600 '); } else texto(g, x, y, `${nom} = ${v} kJ/mol`, color, al, '600 '); };
    etiqueta(xa - 6, (Y(0) + Y(P.Em)) / 2, 'Eₐ', txt(f(Ea, 3)), col['--peso'], 'right');
    if (Ec !== null) texto(g, X(0.66), Y(Ec), `${estrecho ? 'catalizador' : 'con catalizador'}: ${txt(f(Ec, 3))} kJ/mol`, col['--tension'], 'left');
    if (sol.dH !== null && Math.abs(dH) > 1e-9) {
      const xd = X(1) + (estrecho ? 10 : 26); g.strokeStyle = col['--line']; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(0.8), Y(dH)); g.lineTo(xd + 6, Y(dH)); g.stroke(); g.setLineDash([]);
      flecha(xd, Y(0), Y(dH), col['--roz']); etiqueta(xd + 8, (Y(0) + Y(dH)) / 2, 'ΔH', txt(f(dH, 3)), col['--roz'], 'left');
    }
  }

  const marcas = Herramienta.marcas;
  function ejes(g, w, h, V, X, Y, etX, etY, fx = (v) => txt(f(v, 3)), fy = fx) {
    g.lineWidth = 1; g.strokeStyle = col['--line'];
    if (V.x2 > V.x1) for (const v of marcas(V.x1, V.x2, Math.max(4, Math.round(w / 90)))) { g.beginPath(); g.moveTo(X(v), V.mT); g.lineTo(X(v), h - V.mB); g.stroke(); texto(g, X(v), h - V.mB + 12, fx(v), col['--muted']); }
    for (const v of marcas(V.y1, V.y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(V.mL, Y(v)); g.lineTo(w - V.mR, Y(v)); g.stroke(); texto(g, V.mL - 5, Y(v), fy(v), col['--muted'], 'right'); }
    texto(g, w - V.mR - 2, h - V.mB - 9, etX, col['--muted'], 'right'); texto(g, V.mL + 4, V.mT + 8, etY, col['--muted'], 'left');
  }
  function grafica() {
    const L = lienzo($('#grafica')); if (!L) return;
    const { g, w, h } = L;
    if (!sol) return;
    if (!col['--ink']) colores();
    const V = { mL: 54, mR: 14, mT: 12, mB: 28 };
    const marco = (x1, x2, y1, y2) => { Object.assign(V, { x1, x2, y1, y2 }); return [(x) => V.mL + ((x - x1) / (x2 - x1)) * (w - V.mL - V.mR), (y) => V.mT + ((y2 - y) / (y2 - y1)) * (h - V.mT - V.mB)]; };
    if (sol.modo === 'orden') {
      const T = tMax(), [X, Y] = marco(0, T, 0, sol.A0 * 1.08);
      ejes(g, w, h, V, X, Y, `t (${sol.u})`, '[A] (mol/L)');
      g.strokeStyle = col['--muted']; g.setLineDash([4, 4]);
      let tt = 0, Ah = sol.A0;
      for (let i = 0; i < 6; i++) { const t12 = K.vidaMedia(sol.n, sol.kA ?? sol.k, Ah); tt += t12; Ah /= 2; if (tt > T) break; g.beginPath(); g.moveTo(X(tt), Y(0)); g.lineTo(X(tt), Y(Ah)); g.lineTo(X(0), Y(Ah)); g.stroke(); }
      g.setLineDash([]);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
      for (let i = 0; i <= 400; i++) { const t = (T * i) / 400; i ? g.lineTo(X(t), Y(sol.c(t))) : g.moveTo(X(t), Y(sol.c(t))); }
      g.stroke();
      if (sol.t <= T) punto(g, X(sol.t), Y(sol.A), 5, col['--roz']);
      if (sol.tC !== null) punto(g, X(sol.tC), Y(sol.C), 4.5, col['--ink']);
      const t = tDe(); punto(g, X(t), Y(sol.c(t)), 4, col['--peso']);
    } else if (sol.modo === 'datos') {
      const fy = [(v) => v, Math.log, (v) => 1 / v][vista], ys = sol.As.map(fy), F = sol.fits[vista], T = sol.ts[sol.ts.length - 1];
      const lo = Math.min(...ys, F.a, F.a + F.b * T), hi = Math.max(...ys, F.a, F.a + F.b * T), pad = (hi - lo) * 0.12 || 1;
      const [X, Y] = marco(0, T * 1.04, lo - pad, hi + pad);
      ejes(g, w, h, V, X, Y, `t (${sol.u})`, ['[A]', 'ln [A]', '1/[A]'][vista]);
      g.strokeStyle = vista === sol.n ? col['--accent'] : col['--muted']; g.lineWidth = 2; g.beginPath(); g.moveTo(X(0), Y(F.a)); g.lineTo(X(T * 1.04), Y(F.a + F.b * T * 1.04)); g.stroke();
      if (vista === 0 && sol.n !== 0) { g.strokeStyle = col['--accent']; g.setLineDash([5, 4]); g.beginPath(); for (let i = 0; i <= 200; i++) { const t = (T * i) / 200; i ? g.lineTo(X(t), Y(sol.c(t))) : g.moveTo(X(t), Y(sol.c(t))); } g.stroke(); g.setLineDash([]); }
      sol.ts.forEach((t, i) => punto(g, X(t), Y(ys[i]), 4.5, col['--ink']));
      texto(g, w - V.mR - 6, V.mT + 10, `R² = ${F.r2.toFixed(5).replace('.', '.')}`, vista === sol.n ? col['--accent'] : col['--muted'], 'right', '600 ');
      if (vista === 0) { const t = tDe(); punto(g, X(t), Y(sol.c(t)), 4, col['--peso']); }
    } else if (sol.modo === 'consecutivas') {
      const cv = sol.curva, T = sol.tfin, cmax = Math.max(sol.A0, ...cv.map((p) => p.B)) * 1.08 || 1, [X, Y] = marco(0, T, 0, cmax);
      ejes(g, w, h, V, X, Y, `t (${sol.u || K.unidT(sc.ut)})`, 'concentration (mol/L)');
      const serie = [['A', '--accent'], ['B', '--tension'], ['C', '--roz']].slice(0, sol.especies.length);
      for (const [n, c] of serie) { g.strokeStyle = col[c]; g.lineWidth = 2.4; g.beginPath(); cv.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p[n])) : g.moveTo(X(p.t), Y(p[n])))); g.stroke(); texto(g, X(T) - 6, Y(cv[cv.length - 1][n]) - 9, n, col[c], 'right', '600 '); }
      if (sol.tipo === 'rev') { g.setLineDash([4, 4]); g.lineWidth = 1.4; for (const [v, c] of [[sol.Aeq, '--accent'], [sol.Beq, '--tension']]) { g.strokeStyle = col[c]; g.beginPath(); g.moveTo(X(0), Y(v)); g.lineTo(X(T), Y(v)); g.stroke(); } g.setLineDash([]); }
      else { g.setLineDash([4, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(sol.tmax), Y(0)); g.lineTo(X(sol.tmax), Y(sol.Bmax)); g.stroke(); g.setLineDash([]); punto(g, X(sol.tmax), Y(sol.Bmax), 5, col['--ink']); }
    } else if (sol.modo === 'iniciales') {
      const vs = sol.E.map((e) => e.v), mx = Math.max(...vs, ...sol.E.map(sol.vLey)) * 1.1, n = sol.E.length;
      const [, Y] = marco(0, n, 0, mx), ancho = (w - V.mL - V.mR) / n;
      ejes(g, w, h, { ...V, x1: 0, x2: 0 }, () => -99, Y, '', `v₀ (mol·L⁻¹·${sol.u}⁻¹)`);
      sol.E.forEach((e, i) => {
        const x = V.mL + i * ancho + ancho * 0.25;
        g.fillStyle = col['--accent']; g.globalAlpha = 0.75; g.fillRect(x, Y(e.v), ancho * 0.5, Y(0) - Y(e.v)); g.globalAlpha = 1;
        punto(g, x + ancho * 0.25, Y(sol.vLey(e)), 5, col['--ink']);
        texto(g, x + ancho * 0.25, h - V.mB + 12, `exp. ${i + 1}`, col['--muted']);
      });
    } else {
      const P = sol.pts || [{ T: sol.T1, k: sol.k1, e: 'T₁' }, { T: sol.T2, k: sol.k2, e: 'T₂' }], xs = P.map((q) => 1000 / q.T), ys = P.map((q) => Math.log(q.k));
      const x1 = Math.min(...xs), x2 = Math.max(...xs), dx = (x2 - x1) * 0.35, y1 = Math.min(...ys), y2 = Math.max(...ys), dy = (y2 - y1) * 0.35 || 1;
      const [X, Y] = marco(x1 - dx, x2 + dx, y1 - dy, y2 + dy);
      ejes(g, w, h, V, X, Y, '1000/T (K⁻¹)', 'ln k', (v) => v.toFixed(3).replace('.', '.'), (v) => v.toFixed(2).replace('.', '.').replace('-', '−'));
      const lk = (x) => Math.log(sol.A) - (sol.Ea / K.R) * (x / 1000);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(x1 - dx), Y(lk(x1 - dx))); g.lineTo(X(x2 + dx), Y(lk(x2 + dx))); g.stroke();
      P.forEach((q, i) => { punto(g, X(xs[i]), Y(ys[i]), 5, col['--ink']); if (q.e) texto(g, X(xs[i]) + 9, Y(ys[i]) - 10, q.e, col['--ink'], 'left', '600 '); });
    }
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol && (sol.modo === 'orden' || sol.modo === 'datos')) { tA += dt; mueve(dt); dibuja(); grafica(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); grafica(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); grafica(); });

  Ajuste.monta(document.querySelector('.layout .card'), { masas: false });
  addEventListener(Herramienta.ajuste.EVENTO, () => calcula());
  const ver = $('#ver'); if (ver) ver.textContent = Version.de('cinetica').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.CineticaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, n: sol.n, k: sol.k, A: sol.A, t12: sol.t12, oA: sol.oA, oB: sol.oB, oC: sol.oC, Ea: sol.Ea, k2: sol.k2, fcat: sol.fcat, tmax: sol.tmax, Bmax: sol.Bmax, Aeq: sol.Aeq, Keq: sol.K, leyes: sol.leyes && sol.leyes.map((l) => l.ordenes), cuadra: sol.cuadra }, estado: () => copia(sc), vista: (v) => { vista = v; marcaVista(); grafica(); }, pausa: () => { anda = false; } };
})();

