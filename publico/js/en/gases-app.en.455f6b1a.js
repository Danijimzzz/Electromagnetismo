(() => {
  const { $, esc, copia } = Herramienta;
  const G = Gases, f = G.f, CLAVE = 'gases-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['estado', 'Equation of state PV = nRT'], ['procesos', 'Transformations and cycles'], ['mezcla', 'Gas mixture (Dalton)'], ['real', 'Real gas (Van der Waals)'], ['cinetica', 'Kinetic theory']];
  const TIPOS = [['isoterma', 'Isotherm'], ['isobara', 'Isobaric'], ['isocora', 'Isochoric'], ['adiabatica', 'Adiabat']];
  const PERMITIDOS = { isoterma: ['V', 'P'], isobara: ['V', 'T'], isocora: ['P', 'T'], adiabatica: ['V', 'P', 'T'] };

  let sc = copia(G.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  const unP = () => txt((G.UP[sc.uP] || G.UP.atm)[1]), unV = () => txt((G.UV[sc.uV] || G.UV.L)[1]).replace('^3', '³'), unT = () => (sc.uT === 'C' ? '°C' : 'K');
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (v, lista) => lista.map(([k, t]) => `<option value="${k}"${v === k ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(sc[k], lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const unidades = () => elige('uP', 'Pressure unit', Object.entries(G.UP).map(([k, [, t]]) => [k, t])) + elige('uV', 'Volume unit', Object.entries(G.UV).map(([k, [, t]]) => [k, txt(t).replace('^3', '³')])) + elige('uT', 'Temperature in', [['K', 'kelvin (K)'], ['C', 'degrees Celsius (°C)']]);
  const cuatro = () => fila('P', 'Pressure P', unP()) + fila('V', 'Volume V', unV()) + fila('T', 'Temperature T', unT()) + fila('n', 'Moles n', 'mol');
  function formulario() {
    let h = elige('modo', 'What to calculate', MODOS);
    if (sc.modo === 'estado') {
      h += unidades() + sep('Three of the four (leave empty the one you want)') + cuatro() + sep('Or the moles from the mass') + fila('m', 'Mass m', 'g') + fila('M', 'Molar mass M', 'g/mol');
      $('#nota').textContent = 'If you give the molar mass the density of the gas is also calculated.';
    } else if (sc.modo === 'procesos') {
      h += elige('gas', 'Gas', Object.entries(G.GASES).map(([k, g]) => [k, g.nombre])) + unidades() + sep('State A: three of the four') + cuatro() + sep('Transformations');
      h += `<div class="tramos">${(sc.procesos || []).map((p, i) => {
        const de = String.fromCharCode(65 + i), cierra = String(p.valor).trim().toUpperCase() === 'A', a = cierra ? 'A' : String.fromCharCode(66 + i);
        const un = { P: unP(), V: unV(), T: unT() };
        return `<div class="tramo"><b>${de}→${a}</b><select class="in" data-i="${i}" data-c="tipo" aria-label="Type of stage ${de}">${opciones(p.tipo, TIPOS)}</select><select class="in" data-i="${i}" data-c="dato" aria-label="Final value of stage ${de}">${opciones(p.dato, PERMITIDOS[p.tipo].map((k) => [k, `${k}${a}`]))}</select><input class="in" data-i="${i}" data-c="valor" value="${esc(p.valor)}" placeholder="${un[p.dato]}" inputmode="decimal" autocomplete="off" aria-label="Value of stage ${de}"><button class="btn" type="button" data-quita="${i}" aria-label="Remove stage ${de}">✕</button></div>`;
      }).join('')}</div><div class="botones"><button class="btn" type="button" data-add="1">+ Add transformation</button></div>`;
      $('#nota').textContent = 'Each stage starts from the previous state; you give one value of the final state. Write A as the value to return to state A and close the cycle.';
    } else if (sc.modo === 'mezcla') {
      const gasesL = Object.entries(G.MOLECULAS).map(([k, [t]]) => [k, t]);
      h += fila('T', 'Temperature', 'K') + fila('V', 'Volume of the container', 'L') + elige('cant', 'Amount of each gas in', [['n', 'moles'], ['m', 'gramos']]);
      for (let i = 1; i <= 3; i++) h += sep(`Gas ${i}${i === 3 ? ' (optional)' : ''}`) + elige(`g${i}`, 'Gas', gasesL) + fila(`c${i}`, 'Amount', sc.cant === 'm' ? 'g' : 'mol');
      $('#nota').textContent = 'Each gas fills the whole container: its partial pressure is what it would have alone. Leave the amount of the third empty if there are only two.';
    } else if (sc.modo === 'real') {
      h += elige('gasR', 'Gas', [...Object.entries(G.VDW).map(([k, [t]]) => [k, t]), ['otra', 'Other (enter a and b)']]);
      if (sc.gasR === 'otra') h += fila('a', 'Constant a', 'Pa·m⁶/mol²') + fila('b', 'Constant b', 'm³/mol');
      if (G.CRIT[sc.gasR]) h += elige('crit', 'Redlich–Kwong with T_c and P_c', [['vdw', 'those of Van der Waals (from a and b)'], ['real', 'the real critical data (CRC)']]);
      h += fila('n', 'Moles n', 'mol') + fila('V', 'Volume V', 'L') + fila('T', 'Temperature T', 'K');
      $('#nota').textContent = 'The constants a and b of the gases in the list are in SI. Compare with the ideal gas: at small volumes the difference is large.';
    } else {
      h += elige('molecula', 'Gas', [...Object.entries(G.MOLECULAS).map(([k, [t, M]]) => [k, `${t} (${String(M).replace('.', '.')} g/mol)`]), ['otra', 'Other (enter M)']]);
      if (sc.molecula === 'otra') h += fila('M', 'Molar mass M', 'g/mol');
      h += elige('uT', 'Temperature in', [['K', 'kelvin (K)'], ['C', 'degrees Celsius (°C)']]) + fila('T', 'Temperature T', unT()) + sep('Optional') + fila('n', 'Moles n', 'mol') + fila('P', 'Pressure (for the mean free path)', 'atm') + fila('d', 'Diameter of the molecule', 'pm');
      $('#nota').textContent = 'M is converted to kg/mol so R can be used in SI. With the pressure the mean free path is obtained; if you do not give the diameter, the typical one for each gas is used.';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target;
    if (t.tagName !== 'INPUT') return;
    if (t.dataset.c) sc.procesos[+t.dataset.i][t.dataset.c] = t.value; else sc[t.dataset.k] = t.value;
    $('#ejemplos').value = ''; calcula();
    if (t.dataset.c === 'valor') { const b = t.parentNode.querySelector('b'), i = +t.dataset.i; b.textContent = `${String.fromCharCode(65 + i)}→${t.value.trim().toUpperCase() === 'A' ? 'A' : String.fromCharCode(66 + i)}`; }
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    if (t.dataset.c) {
      const p = sc.procesos[+t.dataset.i]; p[t.dataset.c] = t.value;
      if (t.dataset.c === 'tipo' && !PERMITIDOS[p.tipo].includes(p.dato)) p.dato = PERMITIDOS[p.tipo][0];
    } else {
      sc[t.dataset.k] = t.value;
      if (t.dataset.k === 'modo') sc = copia(G.ejemplos.find((x) => x.sc.modo === t.value).sc);
    }
    $('#ejemplos').value = ''; formulario(); calcula();
  });
  $('#campos').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.add) sc.procesos.push({ tipo: 'isoterma', dato: 'V', valor: '' });
    else if (b.dataset.quita !== undefined) sc.procesos.splice(+b.dataset.quita, 1);
    else return;
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + G.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = G.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const vP = (P) => `${f(P / sol.u.P[0])} ${sol.u.P[1]}`, vV = (V) => `${f(V / sol.u.V[0])} ${sol.u.V[1]}`;
  function calcula() {
    const err = $('#error');
    try { sol = G.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'estado') {
      h = dato('Pressure', `P = <b>${vP(sol.P)}</b>`) + dato('Volume', `V = <b>${vV(sol.V)}</b>`) + dato('Temperature', `T = <b>${f(sol.T, 5)} K</b> (${f(sol.T - 273.15)} °C)`) + dato('Moles', `n = <b>${f(sol.n)} mol</b>`) + (sol.rho ? dato('Density', `ρ = ${f(sol.rho)} kg/m<sup>3</sup>`) : '');
      ley = 'The state of the gas in the P-V diagram, on its isotherm (hyperbola PV = nRT).';
    } else if (sol.modo === 'procesos') {
      if (sol.ciclo) h = dato('Net work', `W = <b>${f(sol.Wt)} J</b>`) + dato('Heat absorbed', `Q<sub>abs</sub> = ${f(sol.Qabs)} J`) + (sol.rend !== null ? dato('Efficiency', `η = <b>${f(100 * sol.rend, 3)} %</b>`) : '');
      else h = dato('Work of the gas', `W = <b>${f(sol.Wt)} J</b>`) + dato('Heat', `Q = <b>${f(sol.Qt)} J</b>`) + dato('Internal energy', `ΔU = <b>${f(sol.Ut)} J</b>`);
      const fin = sol.est[sol.est.length - 1], L = sol.ciclo ? String.fromCharCode(64 + sol.est.length - 1) : String.fromCharCode(64 + sol.est.length);
      if (!sol.ciclo) h += dato(`Final state ${L}`, `${vP(fin.P)}, ${vV(fin.V)}, ${f(fin.T, 5)} K`);
      ley = (sol.ciclo ? `Cycle in the P-V diagram; the enclosed area is the net work${sol.Wt > 0 ? ' (clockwise: engine)' : ' (anticlockwise: refrigerator)'}. In grey, the isotherms of maximum and minimum T.` : 'Transformations in the P-V diagram. In grey, the isotherms of the initial and final states.') + ' Colours: green isothermal, blue isobaric, orange isochoric and purple adiabatic.';
    } else if (sol.modo === 'mezcla') {
      h = dato('Total pressure', `P = <b>${f(sol.Pt)} Pa</b> (${f(sol.Pt / 101325)} atm)`) + sol.comp.map((c) => dato(`Partial pressure of ${c.nombre}`, `<b>${f(c.P)} Pa</b> (x = ${f(c.x)})`)).join('') + dato('Mean molar mass', `M̄ = ${f(sol.Mm)} g/mol`);
      ley = 'The bars are the partial pressure of each gas: together they add up to the total. Below, the molecules of each gas in the box.';
    } else if (sol.modo === 'real') {
      h = dato('Pressure (Van der Waals)', `P = <b>${f(sol.P)} Pa</b> (${f(sol.P / 101325)} atm)`) + dato('Pressure if it were ideal', `P = ${f(sol.Pi)} Pa`) + dato('Pressure (Redlich–Kwong)', `P = ${f(sol.PRK)} Pa (${f(sol.PRK / 101325)} atm)`) + dato('Redlich–Kwong Z', `Z = ${f(sol.ZRK)}`) + dato('Compressibility factor', `Z = <b>${f(sol.Z)}</b>`) + dato('Critical temperature', `T<sub>c</sub> = ${f(sol.Tc)} K`);
      ley = 'Van der Waals isotherm (colour) versus the ideal gas one (grey) at the same temperature, with the state marked. Dashed grey, the critical isotherm. Below, Z = PV/nRT against P at that temperature: the ideal gas (Z = 1), Van der Waals and Redlich–Kwong.';
    } else {
      h = dato('Root-mean-square speed', `v<sub>rms</sub> = <b>${f(sol.vrms)} m/s</b>`) + dato('Mean velocity', `v̄ = ${f(sol.vmed)} m/s`) + dato('Most probable', `v<sub>p</sub> = ${f(sol.vp)} m/s`) + dato('Mean kinetic energy', `⟨E<sub>k</sub>⟩ = ${f(sol.Ec)} J`) + (sol.lam ? dato('Mean free path', `λ = <b>${f(sol.lam * 1e9)} nm</b>`) + dato('Collisions per second', `z = ${f(sol.z)} s<sup>−1</sup>`) : '');
      ley = `Maxwell speed distribution at ${txt(f(sol.T, 5))} K; in grey, that of the same gas at twice the temperature. Below, molecules moving at those speeds (the fast ones lighter).`;
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    { const ue = $('#usar-en'), tr = sol.tramos || [], carnot = sol.modo === 'procesos' && sol.ciclo && tr.length === 4 && tr.map((t) => t.tipo).join() === 'isoterma,adiabatica,isoterma,adiabatica' && tr[0].ini.T > tr[2].ini.T && ['monoatomico', 'diatomico'].includes(sc.gas);
      const c6 = (x) => String(+x.toPrecision(8)).replace('.', '.');
      if (ue) { ue.hidden = !carnot; ue.innerHTML = carnot ? `<a class="btn" data-usar="ciclos" href="${esc(Herramienta.enlaceA('ciclos', { modo: 'carnot', gas: sc.gas === 'monoatomico' ? 'mono' : 'di', Tc: c6(tr[0].ini.T), Tf: c6(tr[2].ini.T), n: c6(sol.n), V1: c6(1000 * tr[0].ini.V), V2: c6(1000 * tr[0].fin.V) }))}">Analyse this Carnot cycle in Thermodynamic cycles →</a>` : ''; } }
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#caja').hidden = !['estado', 'cinetica', 'mezcla'].includes(sol.modo); $('#zp').hidden = sol.modo !== 'real';
    particulas = null; dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--fuerza', '--cuerpo']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  const paso = (max) => { const e = 10 ** Math.floor(Math.log10(max / 4)), r = max / 4 / e; return e * (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10); };
  const num = (x) => txt(f(+x.toPrecision(6)));
  function ejes(g, w, h, xmax, ymax, nx, ny, numX = true) {
    const m = { l: 52, r: 16, t: 16, b: 34 }, X = (x) => m.l + (x / xmax) * (w - m.l - m.r), Y = (y) => h - m.b - (y / ymax) * (h - m.t - m.b);
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    const sx = paso(xmax), sy = paso(ymax);
    for (let k = 0, x = 0; k <= 40 && x <= xmax * 1.0001; x = ++k * sx) { g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(ymax)); g.stroke(); if (numX) texto(g, X(x), h - m.b + 12, num(x), col['--muted']); }
    for (let k = 0, y = 0; k <= 40 && y <= ymax * 1.0001; y = ++k * sy) { g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(xmax), Y(y)); g.stroke(); texto(g, m.l - 6, Y(y), num(y), col['--muted'], 'right'); }
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(0), Y(ymax)); g.lineTo(X(0), Y(0)); g.lineTo(X(xmax), Y(0)); g.stroke();
    texto(g, X(xmax), h - 8, nx, col['--muted'], 'right'); texto(g, m.l + 6, m.t - 6 + 6, ny, col['--muted'], 'left');
    return { X, Y };
  }
  function curva(g, pts, X, Y) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); }
  function flecha(g, x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), x = (x1 + x2) / 2, y = (y1 + y2) / 2;
    g.beginPath(); g.moveTo(x + 6 * Math.cos(a), y + 6 * Math.sin(a)); g.lineTo(x - 6 * Math.cos(a) + 5 * Math.sin(a), y - 6 * Math.sin(a) - 5 * Math.cos(a)); g.lineTo(x - 6 * Math.cos(a) - 5 * Math.sin(a), y - 6 * Math.sin(a) + 5 * Math.cos(a)); g.closePath(); g.fill();
  }
  function tramoPts(t, n, gm, u) {
    const a = t.ini, b = t.fin, pts = [];
    for (let i = 0; i <= 60; i++) {
      const s = i / 60;
      let V, P;
      if (t.tipo === 'isocora') { V = a.V; P = a.P + (b.P - a.P) * s; }
      else { V = a.V + (b.V - a.V) * s; P = t.tipo === 'isobara' ? a.P : t.tipo === 'isoterma' ? (a.P * a.V) / V : a.P * (a.V / V) ** gm; }
      pts.push([V / u.V[0], P / u.P[0]]);
    }
    return pts;
  }
  function dibujaZ() {
    const c = $('#zp'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.hidden || !w || !h || !sol || sol.modo !== 'real') return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!col['--ink']) colores();
    const Pm = Math.max(sol.P, sol.PRK, sol.Pi) * 1.6, Vm0 = sol.V / sol.n, R = G.R;
    const rama = (fn) => {
      const pts = []; let ant = -Infinity;
      for (let i = 0; i <= 400; i++) {
        const Vm = Vm0 * 40 * (Math.max(sol.bR, sol.b) * 1.02 / (Vm0 * 40)) ** (i / 400), P = fn(Vm, sol.T);
        if (!(P > 0) || P < ant) break; if (P > Pm) break; ant = P; pts.push([P / 101325, (P * Vm) / (R * sol.T)]);
      }
      return pts;
    };
    const A = rama(sol.pvdw), B = rama(sol.prk), todos = A.concat(B, [[sol.P / 101325, sol.Z], [sol.PRK / 101325, sol.ZRK]]);
    const zmin = Math.min(0.5, ...todos.map((p) => p[1])) * 0.95, zmax = Math.max(1.1, ...todos.map((p) => p[1])) * 1.03, pmax = Pm / 101325;
    const ml = 52, mr = 12, mt = 12, mb = 40, X = (p) => ml + (p / pmax) * (w - ml - mr), Y = (z) => h - mb - ((z - zmin) / (zmax - zmin)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const z of Herramienta.marcas(zmin, zmax, 4)) { g.beginPath(); g.moveTo(ml, Y(z)); g.lineTo(w - mr, Y(z)); g.stroke(); g.fillText(txt(f(z, 3)), ml - 6, Y(z)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const p of Herramienta.marcas(0, pmax, 5)) g.fillText(txt(f(p, 3)), X(p), h - mb + 6);
    g.fillText('P (atm)', ml + (w - ml - mr) / 2, h - 14);
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('Z', ml + 4, mt);
    g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(0), Y(1)); g.lineTo(X(pmax), Y(1)); g.stroke(); g.setLineDash([]);
    g.lineWidth = 2.4; g.strokeStyle = col['--accent']; curva(g, A, X, Y); g.strokeStyle = col['--peso'] || col['--accent']; curva(g, B, X, Y);
    g.font = '600 12px system-ui, sans-serif'; g.textBaseline = 'middle';
    g.textAlign = 'left'; const yl = h - mb - 52; g.fillStyle = col['--accent']; g.fillText('Van der Waals', ml + 10, yl);
    g.fillStyle = col['--peso'] || col['--accent']; g.fillText('Redlich–Kwong', ml + 10, yl + 16);
    g.fillStyle = col['--ink']; g.fillText('ideal gas (Z = 1)', ml + 10, yl + 32);
    for (const [p, z, cl] of [[sol.P, sol.Z, col['--accent']], [sol.PRK, sol.ZRK, col['--peso'] || col['--accent']]]) { g.fillStyle = cl; g.beginPath(); g.arc(X(p / 101325), Y(z), 5, 0, 2 * Math.PI); g.fill(); }
  }
  function dibuja() {
    dibujaZ();
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    if (sol.modo === 'mezcla') {
      const comp = sol.comp, pmax = sol.Pt * 1.15, { X, Y } = ejes(g, w, h, comp.length + 1, pmax / 1000, '', 'P (kPa)', false), cs = [col['--accent'], col['--peso'], col['--normal']];
      comp.forEach((c, i) => { g.fillStyle = cs[i]; g.fillRect(X(i + 0.25), Y(c.P / 1000), X(0.5) - X(0), Y(0) - Y(c.P / 1000)); texto(g, X(i + 0.5), Y(c.P / 1000) - 10, txt(f(c.P / 1000)), cs[i], 'center', '600 '); texto(g, X(i + 0.5), h - 22, c.k.replace('2', '₂'), col['--ink'], 'center', '600 '); });
      let y0 = 0; comp.forEach((c, i) => { g.fillStyle = cs[i]; g.fillRect(X(comp.length + 0.25), Y((y0 + c.P) / 1000), X(0.5) - X(0), Y(y0 / 1000) - Y((y0 + c.P) / 1000)); y0 += c.P; });
      texto(g, X(comp.length + 0.5), Y(sol.Pt / 1000) - 10, `total ${txt(f(sol.Pt / 1000))}`, col['--ink'], 'center', '600 '); texto(g, X(comp.length + 0.5), h - 22, 'mezcla', col['--ink'], 'center', '600 ');
      return;
    }
    if (sol.modo === 'real') {
      const nb = sol.n * sol.b, Vmax = Math.max(sol.V * 2.2, nb * 12), Vmin = nb * 1.08, Pvdw = (V, T) => (sol.n * G.R * T) / (V - nb) - (sol.a * sol.n * sol.n) / (V * V), Pid = (V) => (sol.n * G.R * sol.T) / V;
      const ymax = Math.max(sol.P, sol.Pi) * 2.4 / 101325, pts = (fn) => { const r = []; for (let i = 0; i <= 300; i++) { const V = Vmin + ((Vmax - Vmin) * i) / 300, P = fn(V) / 101325; if (P <= ymax && P >= 0) r.push([V * 1000, P]); } return r; };
      const { X, Y } = ejes(g, w, h, Vmax * 1000, ymax, 'V (L)', 'P (atm)');
      g.strokeStyle = col['--line']; g.lineWidth = 2; curva(g, pts(Pid), X, Y);
      g.setLineDash([5, 4]); curva(g, pts((V) => Pvdw(V, sol.Tc)), X, Y); g.setLineDash([]);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.6; curva(g, pts((V) => Pvdw(V, sol.T)), X, Y);
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(sol.V * 1000), Y(sol.P / 101325), 5, 0, 2 * Math.PI); g.fill();
      g.fillStyle = col['--muted']; g.beginPath(); g.arc(X(sol.V * 1000), Y(sol.Pi / 101325), 4, 0, 2 * Math.PI); g.fill();
      texto(g, w - 20, 26, `real ${txt(f(sol.P / 101325))} atm · ideal ${txt(f(sol.Pi / 101325))} atm`, col['--ink'], 'right', '600 ');
      return;
    }
    if (sol.modo === 'cinetica') {
      const vmax = 4.2 * sol.vp, pts = (T) => Array.from({ length: 201 }, (_, i) => { const v = (vmax * i) / 200; return [v, G.maxwell(sol.M, T, v) * 1000]; });
      const p1 = pts(sol.T), p2 = pts(2 * sol.T), ymax = Math.max(...p1.map((p) => p[1])) * 1.18;
      const { X, Y } = ejes(g, w, h, vmax, ymax, 'v (m/s)', 'f(v) (·10⁻³ s/m)');
      g.strokeStyle = col['--line']; g.lineWidth = 2; g.setLineDash([5, 4]); curva(g, p2, X, Y); g.setLineDash([]);
      g.fillStyle = col['--accent']; g.globalAlpha = 0.12; g.beginPath(); g.moveTo(X(0), Y(0)); p1.forEach(([x, y]) => g.lineTo(X(x), Y(y))); g.lineTo(X(vmax), Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; curva(g, p1, X, Y);
      [[sol.vp, 'v_p', col['--normal']], [sol.vmed, 'v̄', col['--roz']], [sol.vrms, 'v_cm', col['--peso']]].forEach(([v, t, cl], i) => {
        const y = G.maxwell(sol.M, sol.T, v) * 1000;
        g.strokeStyle = cl; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(v), Y(0)); g.lineTo(X(v), Y(y)); g.stroke();
        texto(g, w - 20, 26 + i * 17, `${t.replace('_p', 'ₚ').replace('_cm', 'cm')} = ${txt(f(v))} m/s`, cl, 'right', '600 ');
      });
      return;
    }
    const u = sol.u, est = sol.modo === 'estado' ? [{ P: sol.P, V: sol.V, T: sol.T }] : sol.est;
    const Vs = est.map((e) => e.V / u.V[0]), Ps = est.map((e) => e.P / u.P[0]);
    const { X, Y } = ejes(g, w, h, Math.max(...Vs) * 1.25, Math.max(...Ps) * 1.25, `V (${txt(u.V[1]).replace('^3', '³')})`, `P (${u.P[1]})`);
    const xmax = Math.max(...Vs) * 1.25, ymax = Math.max(...Ps) * 1.25;
    const iso = (PV) => { const pts = []; for (let i = 1; i <= 200; i++) { const V = (xmax * i) / 200, P = PV / V; if (P <= ymax) pts.push([V, P]); } return pts; };
    g.strokeStyle = col['--line']; g.lineWidth = 1.6; g.setLineDash([5, 4]);
    if (sol.modo === 'estado') curva(g, iso(Vs[0] * Ps[0]), X, Y);
    else {
      const PV = est.map((e, i) => Vs[i] * Ps[i]), lista = sol.ciclo ? [Math.max(...PV), Math.min(...PV)] : [PV[0], PV[PV.length - 1]];
      for (const k of lista) curva(g, iso(k), X, Y);
    }
    g.setLineDash([]);
    if (sol.modo === 'procesos') {
      const gm = sol.G.gamma, colT = { isoterma: col['--normal'], isobara: col['--accent'], isocora: col['--roz'], adiabatica: col['--fuerza'] };
      if (sol.ciclo) { g.fillStyle = col['--accent']; g.globalAlpha = 0.1; g.beginPath(); sol.tramos.forEach((t) => tramoPts(t, sol.n, gm, u).forEach(([x, y], i) => (i || t !== sol.tramos[0] ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))))); g.closePath(); g.fill(); g.globalAlpha = 1; }
      for (const t of sol.tramos) {
        const pts = tramoPts(t, sol.n, gm, u);
        g.strokeStyle = colT[t.tipo]; g.fillStyle = colT[t.tipo]; g.lineWidth = 2.6; curva(g, pts, X, Y);
        const [x1, y1] = pts[28], [x2, y2] = pts[32]; flecha(g, X(x1), Y(y1), X(x2), Y(y2));
      }
    }
    const nEst = sol.modo === 'procesos' && sol.ciclo ? est.length - 1 : est.length;
    const cx = Vs.slice(0, nEst).reduce((s, v) => s + v, 0) / nEst, cy = Ps.slice(0, nEst).reduce((s, v) => s + v, 0) / nEst;
    for (let i = 0; i < nEst; i++) {
      const x = X(Vs[i]), y = Y(Ps[i]);
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(x, y, 4.5, 0, 2 * Math.PI); g.fill();
      const dx = Vs[i] >= cx ? 1 : -1, dy = Ps[i] >= cy ? -1 : 1;
      texto(g, x + dx * 10, y + dy * 12, sol.modo === 'estado' ? `(${num(Vs[i])}, ${num(Ps[i])})` : String.fromCharCode(65 + i), col['--ink'], dx > 0 ? 'left' : 'right', '600 ');
    }
    if (sol.modo === 'estado') { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(Vs[0]), Y(0)); g.lineTo(X(Vs[0]), Y(Ps[0])); g.lineTo(X(0), Y(Ps[0])); g.stroke(); g.setLineDash([]); }
  }
  let particulas = null, choques = 0, tCaja = 0;
  const normal = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  function iniciaCaja(w, h) {
    const grupos = sol.modo === 'mezcla' ? sol.comp.map((c, i) => ({ N: Math.max(3, Math.round(70 * c.x)), M: c.M * 1e-3, i })) : [{ N: 60, M: sol.modo === 'cinetica' ? sol.M : 0.029, i: 0 }];
    const T = sol.T, vref = Math.sqrt((3 * G.R * T) / Math.min(...grupos.map((q) => q.M))), esc = (0.22 * w) / vref; // px/s por m/s
    particulas = [];
    for (const q of grupos) { const s = Math.sqrt((G.R * T) / q.M) * esc; for (let k = 0; k < q.N; k++) particulas.push({ x: 8 + Math.random() * (w - 16), y: 8 + Math.random() * (h - 16), vx: normal() * s, vy: normal() * s, i: q.i, vmax: 2.2 * Math.sqrt(2) * s }); }
    choques = 0; tCaja = 0;
  }
  function caja(dt) {
    const c = $('#caja');
    if (c.hidden || !sol) return;
    const { g, w, h } = Herramienta.lienzo(c);
    if (!w) return;
    if (!col['--ink']) colores();
    if (!particulas) iniciaCaja(w, h);
    const cs = [col['--accent'], col['--peso'], col['--normal']], r = 3.5;
    tCaja += dt;
    g.strokeStyle = col['--muted']; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    for (const q of particulas) {
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.x < r) { q.x = 2 * r - q.x; q.vx = -q.vx; choques++; } if (q.x > w - r) { q.x = 2 * (w - r) - q.x; q.vx = -q.vx; choques++; }
      if (q.y < r) { q.y = 2 * r - q.y; q.vy = -q.vy; choques++; } if (q.y > h - r) { q.y = 2 * (h - r) - q.y; q.vy = -q.vy; choques++; }
      g.fillStyle = cs[q.i]; g.globalAlpha = sol.modo === 'mezcla' ? 0.9 : 0.45 + 0.55 * Math.min(1, Math.hypot(q.vx, q.vy) / q.vmax);
      g.beginPath(); g.arc(q.x, q.y, r, 0, 2 * Math.PI); g.fill();
    }
    g.globalAlpha = 1;
    texto(g, 10, 14, `${txt(f(sol.T, 4))} K${tCaja > 0.5 ? ` · ${Math.round(choques / tCaja)} collisions with the walls per second (in the animation)` : ''}`, col['--ink'], 'left', '600 ');
  }
  let ultimo = performance.now();
  function bucle() { const ahora = performance.now(), dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora; caja(dt); requestAnimationFrame(bucle); }
  window.addEventListener('resize', () => { particulas = null; dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', '.');
    const B = { uP: 'atm', uV: 'L', uT: 'K' };
    const tipos = [
      () => ({ modo: 'estado', ...B, P: c(de([1, 1.5, 2, 3, 5])), V: '', T: String(ent(27, 50) * 10), n: '', m: String(ent(2, 20) * 4), M: de(['4', '28', '32', '44']) }),
      () => ({ modo: 'estado', ...B, P: '', V: String(ent(2, 30)), T: String(ent(27, 50) * 10), n: c(ent(1, 20) / 10), m: '', M: '' }),
      () => ({ modo: 'procesos', gas: de(['monoatomico', 'diatomico']), ...B, P: String(ent(1, 5)), V: String(ent(2, 10)), T: String(ent(27, 50) * 10), n: '', procesos: [{ tipo: de(['isoterma', 'adiabatica', 'isobara']), dato: 'V', valor: String(ent(11, 30)) }] }),
      () => ({ modo: 'procesos', gas: 'monoatomico', ...B, uP: 'kPa', P: '100', V: String(ent(1, 3)), T: '', n: c(ent(1, 5) / 10), procesos: [{ tipo: 'isocora', dato: 'P', valor: String(ent(2, 4) * 100) }, { tipo: 'isobara', dato: 'V', valor: String(ent(4, 8)) }, { tipo: 'isocora', dato: 'P', valor: '100' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] }),
      () => ({ modo: 'mezcla', T: String(ent(27, 35) * 10), V: String(ent(5, 30)), cant: 'm', g1: 'N2', c1: String(ent(1, 10) * 7), g2: de(['O2', 'He', 'CO2']), c2: String(ent(1, 10) * 4), g3: 'Ar', c3: '' }),
      () => ({ modo: 'real', gasR: de(['CO2', 'N2', 'NH3', 'H2O', 'O2']), a: '', b: '', n: '1', V: c(de([0.2, 0.5, 1, 2])), T: String(ent(30, 50) * 10) }),
      () => ({ modo: 'cinetica', molecula: de(['He', 'N2', 'O2', 'H2', 'CO2']), M: '', T: String(ent(20, 60) * 10), uT: 'K', n: '', P: Math.random() < 0.5 ? '' : '1', d: '' }),
    ];
    sc = de(tipos)();
    formulario(); sel.value = ''; calcula();
  }
  const enunciado = () => {
    const e = (x) => esc(String(x ?? '').replace('.', '.')), up = (G.UP[sc.uP] || G.UP.atm)[1], uv = txt((G.UV[sc.uV] || G.UV.L)[1]).replace('^3', '³');
    const nombreG = (k) => (G.MOLECULAS[k] || G.VDW[k] || ['gas'])[0].replace(/, .*/, '').toLowerCase();
    if (sc.modo === 'estado') return sc.m ? `What volume do ${e(sc.m)} g of a gas of molar mass ${e(sc.M)} g/mol occupy at ${e(sc.P)} ${up} and ${e(sc.T)} K? Also calculate its density.` : `${e(sc.n)} mol of an ideal gas occupy ${e(sc.V)} ${uv} at ${e(sc.T)} K. What is its pressure?`;
    if (sc.modo === 'procesos' && (sc.procesos || []).length > 1) return `${e(sc.n)} mol of a monatomic gas start from ${e(sc.P)} ${up} and ${e(sc.V)} ${uv} and go through a rectangular cycle: isochoric up to ${e(sc.procesos[0].valor)} ${up}, isobaric up to ${e(sc.procesos[1].valor)} ${uv}, isochoric up to ${e(sc.procesos[2].valor)} ${up} and isobaric back. Calculate the net work, the heat absorbed and the efficiency.`;
    if (sc.modo === 'procesos') { const p = sc.procesos[0]; return `A ${sc.gas === 'monoatomico' ? 'monatomic' : 'diatomic'} ideal gas at ${e(sc.P)} ${up}, ${e(sc.V)} ${uv} and ${e(sc.T)} K expands in a ${{ isoterma: 'isothermal', adiabatica: 'adiabatic', isobara: 'isobaric' }[p.tipo]} process up to ${e(p.valor)} ${uv}. Calculate the final state, the work, the heat and the change in internal energy.`; }
    if (sc.modo === 'mezcla') return `In a container of ${e(sc.V)} L at ${e(sc.T)} K there are ${e(sc.c1)} ${sc.cant === 'm' ? 'g' : 'mol'} of ${nombreG(sc.g1)} and ${e(sc.c2)} ${sc.cant === 'm' ? 'g' : 'mol'} of ${nombreG(sc.g2)}${sc.c3 ? ` and ${e(sc.c3)} ${sc.cant === 'm' ? 'g' : 'mol'} of ${nombreG(sc.g3)}` : ''}. Calculate the mole fractions, the partial pressures and the total pressure.`;
    if (sc.modo === 'real') return `Calculate the pressure of ${e(sc.n)} mol of ${nombreG(sc.gasR)} in ${e(sc.V)} L at ${e(sc.T)} K with the Van der Waals equation and compare it with that of the ideal gas. What is the compressibility factor?`;
    return `Calculate the root-mean-square, mean and most probable speeds of ${nombreG(sc.molecula)} molecules at ${e(sc.T)} K and their mean kinetic energy${sc.P ? `, and the mean free path at ${e(sc.P)} atm` : ''}.`;
  };

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('gases').current;
  Ajuste.monta(document.querySelector('.layout .card'), { masas: false, F: false });
  addEventListener(Herramienta.ajuste.EVENTO, () => calcula());
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.GasesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, P: sol.P, V: sol.V, T: sol.T, n: sol.n, Wt: sol.Wt, Qt: sol.Qt, Ut: sol.Ut, rend: sol.rend, ciclo: sol.ciclo, vrms: sol.vrms, Pt: sol.Pt, Z: sol.Z, lam: sol.lam }, estado: () => copia(sc) };
})();

