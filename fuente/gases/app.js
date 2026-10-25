/* =====================================================================
   Gases ideales: interfaz (modo, datos, lista de transformaciones,
   diagrama P-V o curva de Maxwell y desarrollo). El cálculo está en
   gases/fisica.js (Gases).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const G = Gases, f = G.f, CLAVE = 'gases-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['estado', 'Ecuación de estado PV = nRT'], ['procesos', 'Transformaciones y ciclos'], ['cinetica', 'Teoría cinética']];
  const TIPOS = [['isoterma', 'Isoterma'], ['isobara', 'Isobara'], ['isocora', 'Isocora'], ['adiabatica', 'Adiabática']];
  const PERMITIDOS = { isoterma: ['V', 'P'], isobara: ['V', 'T'], isocora: ['P', 'T'], adiabatica: ['V', 'P', 'T'] };

  let sc = copia(G.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const unP = () => txt((G.UP[sc.uP] || G.UP.atm)[1]), unV = () => txt((G.UV[sc.uV] || G.UV.L)[1]).replace('^3', '³'), unT = () => (sc.uT === 'C' ? '°C' : 'K');
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (v, lista) => lista.map(([k, t]) => `<option value="${k}"${v === k ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(sc[k], lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const unidades = () => elige('uP', 'Unidad de presión', Object.entries(G.UP).map(([k, [, t]]) => [k, t])) + elige('uV', 'Unidad de volumen', Object.entries(G.UV).map(([k, [, t]]) => [k, txt(t).replace('^3', '³')])) + elige('uT', 'Temperatura en', [['K', 'kelvin (K)'], ['C', 'grados Celsius (°C)']]);
  const cuatro = () => fila('P', 'Presión P', unP()) + fila('V', 'Volumen V', unV()) + fila('T', 'Temperatura T', unT()) + fila('n', 'Moles n', 'mol');
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    if (sc.modo === 'estado') {
      h += unidades() + sep('Tres de los cuatro (deja vacío el que buscas)') + cuatro() + sep('O los moles a partir de la masa') + fila('m', 'Masa m', 'g') + fila('M', 'Masa molar M', 'g/mol');
      $('#nota').textContent = 'Si das la masa molar también se calcula la densidad del gas.';
    } else if (sc.modo === 'procesos') {
      h += elige('gas', 'Gas', Object.entries(G.GASES).map(([k, g]) => [k, g.nombre])) + unidades() + sep('Estado A: tres de los cuatro') + cuatro() + sep('Transformaciones');
      h += `<div class="tramos">${(sc.procesos || []).map((p, i) => {
        const de = String.fromCharCode(65 + i), cierra = String(p.valor).trim().toUpperCase() === 'A', a = cierra ? 'A' : String.fromCharCode(66 + i);
        const un = { P: unP(), V: unV(), T: unT() };
        return `<div class="tramo"><b>${de}→${a}</b><select class="in" data-i="${i}" data-c="tipo" aria-label="Tipo del tramo ${de}">${opciones(p.tipo, TIPOS)}</select><select class="in" data-i="${i}" data-c="dato" aria-label="Dato final del tramo ${de}">${opciones(p.dato, PERMITIDOS[p.tipo].map((k) => [k, `${k}${a}`]))}</select><input class="in" data-i="${i}" data-c="valor" value="${esc(p.valor)}" placeholder="${un[p.dato]}" inputmode="decimal" autocomplete="off" aria-label="Valor del tramo ${de}"><button class="btn" type="button" data-quita="${i}" aria-label="Quitar el tramo ${de}">✕</button></div>`;
      }).join('')}</div><div class="botones"><button class="btn" type="button" data-add="1">+ Añadir transformación</button></div>`;
      $('#nota').textContent = 'Cada tramo parte del estado anterior; das un dato del estado final. Escribe A como valor para volver al estado A y cerrar el ciclo.';
    } else {
      h += elige('molecula', 'Gas', [...Object.entries(G.MOLECULAS).map(([k, [t, M]]) => [k, `${t} (${String(M).replace('.', ',')} g/mol)`]), ['otra', 'Otro (escribe M)']]);
      if (sc.molecula === 'otra') h += fila('M', 'Masa molar M', 'g/mol');
      h += elige('uT', 'Temperatura en', [['K', 'kelvin (K)'], ['C', 'grados Celsius (°C)']]) + fila('T', 'Temperatura T', unT()) + fila('n', 'Moles n (opcional)', 'mol');
      $('#nota').textContent = 'M se pasa a kg/mol para usar R en el SI.';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target;
    if (t.tagName !== 'INPUT') return;
    if (t.dataset.c) sc.procesos[+t.dataset.i][t.dataset.c] = t.value; else sc[t.dataset.k] = t.value;
    $('#ejemplos').value = ''; calcula();
    // la etiqueta del tramo cambia al escribir A
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

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + G.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = G.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const vP = (P) => `${f(P / sol.u.P[0])} ${sol.u.P[1]}`, vV = (V) => `${f(V / sol.u.V[0])} ${sol.u.V[1]}`;
  function calcula() {
    const err = $('#error');
    try { sol = G.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'estado') {
      h = dato('Presión', `P = <b>${vP(sol.P)}</b>`) + dato('Volumen', `V = <b>${vV(sol.V)}</b>`) + dato('Temperatura', `T = <b>${f(sol.T, 5)} K</b> (${f(sol.T - 273.15)} °C)`) + dato('Moles', `n = <b>${f(sol.n)} mol</b>`) + (sol.rho ? dato('Densidad', `ρ = ${f(sol.rho)} kg/m<sup>3</sup>`) : '');
      ley = 'El estado del gas en el diagrama P-V, sobre su isoterma (hipérbola PV = nRT).';
    } else if (sol.modo === 'procesos') {
      if (sol.ciclo) h = dato('Trabajo neto', `W = <b>${f(sol.Wt)} J</b>`) + dato('Calor absorbido', `Q<sub>abs</sub> = ${f(sol.Qabs)} J`) + (sol.rend !== null ? dato('Rendimiento', `η = <b>${f(100 * sol.rend, 3)} %</b>`) : '');
      else h = dato('Trabajo del gas', `W = <b>${f(sol.Wt)} J</b>`) + dato('Calor', `Q = <b>${f(sol.Qt)} J</b>`) + dato('Energía interna', `ΔU = <b>${f(sol.Ut)} J</b>`);
      const fin = sol.est[sol.est.length - 1], L = sol.ciclo ? String.fromCharCode(64 + sol.est.length - 1) : String.fromCharCode(64 + sol.est.length);
      if (!sol.ciclo) h += dato(`Estado final ${L}`, `${vP(fin.P)}, ${vV(fin.V)}, ${f(fin.T, 5)} K`);
      ley = (sol.ciclo ? `Ciclo en el diagrama P-V; el área encerrada es el trabajo neto${sol.Wt > 0 ? ' (sentido horario: motor)' : ' (sentido antihorario: frigorífico)'}. En gris, las isotermas de T máxima y mínima.` : 'Transformaciones en el diagrama P-V. En gris, las isotermas de los estados inicial y final.') + ' Colores: verde isoterma, azul isobara, naranja isocora y morado adiabática.';
    } else {
      h = dato('Velocidad cuadrática media', `v<sub>cm</sub> = <b>${f(sol.vrms)} m/s</b>`) + dato('Velocidad media', `v̄ = ${f(sol.vmed)} m/s`) + dato('Más probable', `v<sub>p</sub> = ${f(sol.vp)} m/s`) + dato('Energía cinética media', `⟨E<sub>c</sub>⟩ = ${f(sol.Ec)} J`);
      ley = `Distribución de Maxwell de las velocidades a ${txt(f(sol.T, 5))} K; en gris, la del mismo gas al doble de temperatura.`;
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--fuerza', '--cuerpo']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  const paso = (max) => { const e = 10 ** Math.floor(Math.log10(max / 4)), r = max / 4 / e; return e * (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10); };
  const num = (x) => txt(f(+x.toPrecision(6)));
  // ejes con marcas; devuelve las funciones de escala
  function ejes(g, w, h, xmax, ymax, nx, ny) {
    const m = { l: 52, r: 16, t: 16, b: 34 }, X = (x) => m.l + (x / xmax) * (w - m.l - m.r), Y = (y) => h - m.b - (y / ymax) * (h - m.t - m.b);
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    const sx = paso(xmax), sy = paso(ymax);
    for (let x = 0; x <= xmax * 1.0001; x += sx) { g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(ymax)); g.stroke(); texto(g, X(x), h - m.b + 12, num(x), col['--muted']); }
    for (let y = 0; y <= ymax * 1.0001; y += sy) { g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(xmax), Y(y)); g.stroke(); texto(g, m.l - 6, Y(y), num(y), col['--muted'], 'right'); }
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(0), Y(ymax)); g.lineTo(X(0), Y(0)); g.lineTo(X(xmax), Y(0)); g.stroke();
    texto(g, X(xmax), h - 8, nx, col['--muted'], 'right'); texto(g, m.l + 6, m.t - 6 + 6, ny, col['--muted'], 'left');
    return { X, Y };
  }
  function curva(g, pts, X, Y) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); }
  function flecha(g, x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), x = (x1 + x2) / 2, y = (y1 + y2) / 2;
    g.beginPath(); g.moveTo(x + 6 * Math.cos(a), y + 6 * Math.sin(a)); g.lineTo(x - 6 * Math.cos(a) + 5 * Math.sin(a), y - 6 * Math.sin(a) - 5 * Math.cos(a)); g.lineTo(x - 6 * Math.cos(a) - 5 * Math.sin(a), y - 6 * Math.sin(a) + 5 * Math.cos(a)); g.closePath(); g.fill();
  }
  // puntos (V, P) de un tramo en unidades de la pantalla
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
  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
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
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('gases').current;
  formulario(); colores(); calcula();
  window.GasesApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, P: sol.P, V: sol.V, T: sol.T, n: sol.n, Wt: sol.Wt, Qt: sol.Qt, Ut: sol.Ut, rend: sol.rend, ciclo: sol.ciclo, vrms: sol.vrms }, estado: () => copia(sc) };
})();
