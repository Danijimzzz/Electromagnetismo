/* =====================================================================
   Autoinducción e inducción mutua: interfaz (pestañas L, M y RL, datos,
   esquema de la geometría o gráfica del transitorio, también con la fuente
   que se conecta y desconecta, resumen y desarrollo).
   El cálculo está en fisica.js (Induccion).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const I = Induccion, f = I.f, u = I.u;
  const CLAVE = 'induccion-v1';

  let st = { tab: 'L', L: copia(I.ejemplos.L[0].sc), M: copia(I.ejemplos.M[0].sc), RL: copia(I.ejemplos.RL[0].sc), F: copia(I.ejemplos.F[0].sc), T: copia(I.ejemplos.T[0].sc) };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.L && g.M && g.RL) st = { ...st, ...g, F: { ...st.F, ...(g.F || {}) }, T: { ...st.T, ...(g.T || {}) } }; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) {} };
  let sol = null, col = {};
  const sc = () => st[st.tab];
  const GEOS = { L: I.GEO_L, M: I.GEO_M };

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc()[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const selector = (k, nom, ops) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${ops.map(([v, t]) => `<option value="${v}"${(sc()[k] ?? ops[0][0]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  function formulario() {
    const s = sc();
    let h = '', nota = '';
    if (st.tab === 'T') {
      h = fila('N1', 'Espiras del primario N<sub>1</sub>') + fila('N2', 'Espiras del secundario N<sub>2</sub>') + fila('L1', 'Autoinducción del primario L<sub>1</sub>', 'mH') + fila('k', 'Coeficiente de acoplamiento k') +
        '<div class="sep">Alimentación y carga</div>' + fila('V1', 'Tensión del primario (eficaz)', 'V') + fila('fr', 'Frecuencia', 'Hz') + fila('RL', 'Resistencia de carga R<sub>L</sub>', 'Ω') +
        '<div class="sep">Resistencia de los devanados</div>' + fila('R1', 'Primario R<sub>1</sub>', 'Ω') + fila('R2', 'Secundario R<sub>2</sub>', 'Ω');
      nota = 'L₂ sale de L₁ y de la relación de espiras. Con k = 1 y sin resistencias es el transformador ideal; baja k y verás cómo cae la tensión, cómo sube la regulación y el rendimiento cae.';
    } else if (st.tab === 'F') {
      h = fila('N1', 'Espiras de la grande N<sub>1</sub>') + fila('R', 'Radio de la grande R', 'cm') + fila('N2', 'Espiras de la pequeña N<sub>2</sub>') + fila('r', 'Radio de la pequeña r', 'cm') + fila('z', 'Distancia z entre los planos', 'cm') + '<div class="sep">Corrientes</div>' + fila('I1', 'Intensidad I<sub>1</sub>', 'A') + fila('I2', 'Intensidad I<sub>2</sub>', 'A');
      nota = 'Los ejes coinciden. Con corrientes del mismo signo (mismo sentido de giro) las espiras se atraen; con signos opuestos, se repelen. Vale cualquier cociente r/R.';
    } else if (st.tab === 'RL') {
      h = fila('E', 'Fem de la fuente ε', 'V') + fila('R', 'Resistencia R', 'Ω') + fila('L', 'Autoinducción L', 'mH') +
        selector('modo', 'Qué pasa', [['carga', 'Cerrar el circuito'], ['descarga', 'Quitar la fuente'], ['pulsos', 'Conectar y desconectar una y otra vez']]) +
        (s.modo === 'pulsos' ? fila('ton', 'Tiempo conectada t<sub>on</sub>', 'ms') + fila('toff', 'Tiempo desconectada t<sub>off</sub>', 'ms') : '') +
        '<div class="sep">En un instante</div>' + fila('t', 'Tiempo t', 'ms');
      nota = s.modo === 'pulsos' ? 'Al desconectar, la bobina se descarga por la misma resistencia. Con t sale el valor en ese instante.' : 'Deja el tiempo en blanco si solo quieres τ y la gráfica. Con t sale también el balance de energía.';
    } else {
      const G = GEOS[st.tab][s.geo] || Object.values(GEOS[st.tab])[0];
      h = selector('geo', st.tab === 'L' ? 'Circuito' : 'Pareja de circuitos', Object.entries(GEOS[st.tab]).map(([k, g]) => [k, g.nombre]));
      h += G.campos.map(([k, nom, un]) => fila(k, nom, un)).join('');
      if (G.interior) h += selector('interior', st.tab === 'L' ? 'Conductor' : 'Hilos', [['hueco', 'Hueco (solo flujo exterior)'], ['macizo', 'Macizo (añade el flujo interno)']]);
      h += '<div class="sep">Opcional</div>';
      if (st.tab === 'L') h += fila('I', 'Intensidad I', 'A') + fila('dIdt', 'Ritmo de cambio dI/dt', 'A/s');
      else {
        h += fila('I1', 'Intensidad I<sub>1</sub>', 'A') + fila('dI1dt', 'Ritmo de cambio dI<sub>1</sub>/dt', 'A/s');
        if (['solenoides', 'toroide-bobina', 'acoplamiento'].includes(s.geo)) h += fila('I2', 'Intensidad I<sub>2</sub>', 'A') + selector('sentido', 'Flujos', [['aditivo', 'Se suman'], ['opuesto', 'Se oponen']]);
      }
      nota = st.tab === 'L' ? 'Con la intensidad salen el flujo y la energía; con dI/dt, la fem autoinducida.' : 'Con I₁ sale el flujo en el circuito 2; con dI₁/dt, la fem inducida; con I₁ e I₂, la energía de los dos.';
    }
    $('#campos').innerHTML = h;
    $('#nota-opc').textContent = nota;
  }

  $('#campos').addEventListener('input', (e) => {
    const t = e.target;
    if (t.tagName !== 'INPUT' || !t.dataset.k) return;
    sc()[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc()[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo' && t.value === 'pulsos' && !sc().ton) Object.assign(sc(), { ton: '5', toff: '5' });
    if (t.dataset.k === 'geo') {
      // al cambiar de geometría, rellena los datos que falten con los de su ejemplo
      const ej = I.ejemplos[st.tab].find((x) => x.sc.geo === t.value);
      if (ej) for (const [k, v] of Object.entries(ej.sc)) if (sc()[k] === undefined || sc()[k] === '' || ['interior', 'sentido'].includes(k)) sc()[k] = v;
    }
    $('#ejemplos').value = '';
    formulario(); calcula();
  });

  /* ---------- Pestañas y ejemplos ---------- */
  const sel = $('#ejemplos');
  function ejemplos() { sel.innerHTML = '<option value="">Ejemplos…</option>' + I.ejemplos[st.tab].map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join(''); }
  function pestana(t) {
    st.tab = t; guarda();
    for (const k of ['L', 'M', 'F', 'RL', 'T']) $('#tab-' + k).setAttribute('aria-selected', k === t);
    $('#dibujo').setAttribute('aria-label', t === 'RL' ? 'Gráfica de la corriente y la tensión en la bobina frente al tiempo' : t === 'T' ? 'Gráfica de la tensión del secundario y del rendimiento frente a la resistencia de carga' : t === 'F' ? 'Gráfica de la fuerza entre las dos espiras frente a la distancia' : 'Esquema del circuito');
    ejemplos(); formulario(); calcula();
  }
  for (const k of ['L', 'M', 'F', 'RL', 'T']) $('#tab-' + k).addEventListener('click', () => pestana(k));
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(st.tab, sel.value); });
  function abrirEjemplo(tab, clave) {
    const e = I.ejemplos[tab].find((x) => x.clave === clave);
    if (!e) return;
    st[tab] = copia(e.sc);
    if (st.tab !== tab) pestana(tab); else { formulario(); calcula(); }
    sel.value = clave;
  }

  /* ---------- Cálculo y resultados ---------- */
  const caja = (n, v, extra) => `<div><span>${n}</span><b>${v}</b>${extra ? `<small>${extra}</small>` : ''}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = st.tab === 'L' ? I.autoinduccion(sc()) : st.tab === 'M' ? I.mutua(sc()) : st.tab === 'F' ? I.fuerza(sc()) : st.tab === 'T' ? I.transformador(sc()) : I.rl(sc()); } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    err.hidden = true; guarda();
    const r = sol.res;
    let h = '';
    if (st.tab === 'T') {
      h = caja('Tensión del secundario', u(r.V2, 'V'), `ideal ${u(r.Vid, 'V')} · relación ${f(r.relacion)}`) + caja('Regulación', `${f(100 * r.reg, 3)} %`, `en vacío ${u(r.V20, 'V')}`) + caja('Rendimiento', `${f(100 * r.eta, 4)} %`, `P₂ = ${u(r.Pout, 'W')}`) + caja('Corriente primaria I₁', u(r.I1, 'A'), `cos φ = ${f(r.fp)}`) + caja('Corriente secundaria I₂', u(r.I2, 'A')) + caja('Inducción mutua M', u(r.M, 'H'), `L₂ = ${u(r.L2, 'H')}`) + caja('Pérdidas en el cobre', u(r.Pcu1 + r.Pcu2, 'W'), `primario ${u(r.Pcu1, 'W')} · secundario ${u(r.Pcu2, 'W')}`);
    } else if (st.tab === 'L') {
      h = caja('Autoinducción L', u(r.L, 'H'), sol.p.l && (sc().geo === 'coaxial' || sc().geo === 'bifilar') ? `por metro: ${u(r.L / sol.p.l, 'H/m')}` : '');
      h += caja('Flujo propio Φ', r.flujo !== undefined ? u(r.flujo, 'Wb') : '—', r.flujo === undefined ? 'falta I' : '');
      h += caja('Energía U', r.U !== undefined ? u(r.U, 'J') : '—', r.U === undefined ? 'falta I' : '');
      h += caja('Fem autoinducida', r.fem !== undefined ? `${f(r.fem)} V` : '—', r.fem === undefined ? 'falta dI/dt' : '');
    } else if (st.tab === 'F') {
      h = caja('Fuerza F', u(Math.abs(r.F), 'N'), r.sentido) + caja('Inducción mutua M', u(r.M, 'H'), `dM/dz = ${f(r.dM)} H/m`) + caja('Aproximación de dipolo', u(Math.abs(r.Fd), 'N'), `error ${f(Math.abs(r.Fd / r.F - 1) * 100, 3)} %`) + caja('Fuerza máxima', u(r.Fmax, 'N'), `a z ≈ ${f(r.zmax * 100)} cm`);
    } else if (st.tab === 'M') {
      const k = r.L1 !== undefined ? r.M / Math.sqrt(r.L1 * r.L2) : null;
      h = caja('Inducción mutua M', u(r.M, 'H'), k !== null ? `k = ${f(k)}` : '');
      h += r.L1 !== undefined ? caja('L₁ · L₂', `${u(r.L1, 'H', 3)}`, `L₂ = ${u(r.L2, 'H', 3)}`) : caja('Flujo Φ₂₁', r.flujo !== undefined ? u(r.flujo, 'Wb') : '—', r.flujo === undefined ? 'falta I₁' : '');
      h += caja('Fem en el circuito 2', r.fem !== undefined ? `${f(r.fem)} V` : '—', r.fem === undefined ? 'falta dI₁/dt' : '');
      h += r.L1 !== undefined ? caja('Energía U', r.U !== undefined ? u(r.U, 'J') : '—', r.U === undefined ? 'faltan I₁ e I₂' : '') : '';
      if (r.Ls !== undefined) h += caja('En serie', u(r.Ls, 'H'), `flujos opuestos: ${u(r.Lso, 'H')}`) + caja('En paralelo', u(r.Lp, 'H'), `flujos opuestos: ${u(r.Lpo, 'H')}`);
    } else if (sol.p.pulsos) {
      h = caja('Constante de tiempo τ', u(r.tau, 's'), `periodo T = ${u(sol.p.ton + sol.p.toff, 's')}`);
      h += caja('Entre', `${u(r.Imin, 'A', 3)} y ${u(r.Imax, 'A', 3)}`, 'en régimen permanente');
      h += caja('Corriente media', u(r.Imed, 'A'), `rizado ${u(r.Imax - r.Imin, 'A', 3)}`);
      h += caja('I(t)', r.It !== undefined ? u(r.It, 'A') : '—', r.It === undefined ? 'falta t' : `V<sub>L</sub> = ${u(r.VLt, 'V')}`);
    } else {
      h = caja('Constante de tiempo τ', u(r.tau, 's'), `τ ln 2 = ${u(r.tau * Math.LN2, 's')}`);
      h += caja(sol.p.carga ? 'Corriente final' : 'Corriente inicial', u(r.I0, 'A'), `U = ${u(0.5 * sol.p.L * r.I0 * r.I0, 'J')}`);
      h += caja('I(t)', r.It !== undefined ? u(r.It, 'A') : '—', r.It !== undefined ? `${f((100 * r.It) / r.I0, 3)} % de ε/R` : 'falta t');
      h += caja('V<sub>L</sub>(t)', r.VLt !== undefined ? u(r.VLt, 'V') : '—', r.VRt !== undefined ? `V<sub>R</sub> = ${u(r.VRt, 'V')}` : '');
      if (r.WR !== undefined) h += caja('Disipada en R hasta t', u(r.WR, 'J'), r.Wf !== undefined ? `la fuente dio ${u(r.Wf, 'J')}` : `de ${u(0.5 * sol.p.L * r.I0 * r.I0, 'J')} que tenía`);
    }
    if (sol.letras) h += `<div class="ancho"><span>En letras</span>${Mates.html(`$${sol.letras}$`)}</div>`;
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--pos', '--neg', '--cobre', '--nucleo', '--campo']) col[k] = cs.getPropertyValue(k).trim();
  }
  const lienzo = (c) => Herramienta.lienzo(c);
  const flecha = (g, x1, y1, x2, y2, s = 6) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)); g.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)); g.closePath(); g.fill();
  };
  const circulo = (g, x, y, r, relleno, trazo) => { g.beginPath(); g.arc(x, y, Math.max(r, 0.5), 0, 2 * Math.PI); if (relleno) { g.fillStyle = relleno; g.fill(); } if (trazo) { g.strokeStyle = trazo; g.stroke(); } };
  const texto = (g, t, x, y, c = col['--muted'], al = 'center') => { g.fillStyle = c; g.textAlign = al; g.fillText(t, x, y); };
  // bobina vista de lado: espiras como elipses estrechas entre x0 y x1
  function bobina(g, x0, x1, yc, rr, n, c) {
    g.strokeStyle = c; g.lineWidth = 1.6;
    const paso = (x1 - x0) / n;
    for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(x0 + paso * (i + 0.5), yc, Math.max(paso * 0.45, 1.5), rr, 0, 0, 2 * Math.PI); g.stroke(); }
    g.lineWidth = 1;
  }
  // corte de un toroide visto desde arriba: anillo con espiras radiales
  function toroide(g, cx, cy, ra, rb, n, c) {
    g.fillStyle = col['--nucleo']; g.beginPath(); g.arc(cx, cy, rb, 0, 2 * Math.PI); g.arc(cx, cy, ra, 0, 2 * Math.PI, true); g.fill();
    g.strokeStyle = c; g.lineWidth = 1.6;
    for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n; g.beginPath(); g.moveTo(cx + (ra - 3) * Math.cos(a), cy + (ra - 3) * Math.sin(a)); g.lineTo(cx + (rb + 3) * Math.cos(a), cy + (rb + 3) * Math.sin(a)); g.stroke(); }
    g.lineWidth = 1;
  }
  function dibuja() {
    if (!sol) return;
    colores();
    const { g, w, h } = lienzo($('#dibujo'));
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    if (st.tab === 'RL') return grafica(g, w, h);
    if (st.tab === 'T') return graficaT(g, w, h);
    if (st.tab === 'F') return graficaF(g, w, h);
    const p = sol.p, geo = sc().geo, cx = w / 2, cy = h / 2, H = h - 50;
    g.strokeStyle = col['--line'];
    if (geo === 'solenoide' || geo === 'solenoides') {
      const lw = Math.min(w * 0.7, 520), x0 = cx - lw / 2, x1 = cx + lw / 2;
      if (geo === 'solenoide') {
        const rr = Math.min(H / 2, Math.max(14, (lw * p.r) / p.l));
        if (p.mur > 1) { g.fillStyle = col['--nucleo']; g.fillRect(x0, cy - rr, lw, 2 * rr); texto(g, `núcleo μr = ${f(p.mur)}`, cx, cy - rr - 12); }
        bobina(g, x0, x1, cy, rr, Math.min(p.N, 28), col['--cobre']);
        g.strokeStyle = col['--neg']; g.fillStyle = col['--neg']; flecha(g, x0 + 10, cy, x1 - 10, cy); texto(g, 'B', x1 - 10, cy - 10, col['--neg']);
        texto(g, `N = ${f(p.N)}, l = ${f(p.l * 100)} cm, r = ${f(p.r * 100)} cm`, cx, h - 14);
      } else {
        const r2 = Math.min(H / 2, 60), r1 = r2 * Math.min(1, p.r1 / p.r2);
        bobina(g, x0, x1, cy, r2, Math.min(p.N2, 30), col['--cobre']);
        bobina(g, x0 + 6, x1 - 6, cy, r1, Math.min(p.N1, 22), col['--neg']);
        texto(g, `exterior: N₂ = ${f(p.N2)}, r₂ = ${f(p.r2 * 100)} cm`, cx, cy - r2 - 12, col['--cobre']);
        texto(g, `interior: N₁ = ${f(p.N1)}, r₁ = ${f(p.r1 * 100)} cm · l = ${f(p.l * 100)} cm`, cx, h - 14, col['--neg']);
      }
    } else if (geo === 'toroide-rect' || geo === 'toroide-circ' || geo === 'toroide-bobina') {
      const rmax = H / 2;
      let ra, rb;
      if (geo === 'toroide-circ') { rb = rmax; ra = rmax * Math.max(0.15, (p.R - p.r) / (p.R + p.r)); } else { rb = rmax; ra = rmax * Math.max(0.15, p.a / p.b); }
      toroide(g, cx, cy, ra, rb, Math.min(geo === 'toroide-bobina' ? p.N1 : p.N, 36), col['--cobre']);
      if (geo === 'toroide-bobina') {
        g.strokeStyle = col['--neg']; g.lineWidth = 2.4;
        for (let i = 0; i < 6; i++) { const a = -0.35 + i * 0.14; g.beginPath(); g.moveTo(cx + (ra - 5) * Math.cos(a), cy + (ra - 5) * Math.sin(a)); g.lineTo(cx + (rb + 5) * Math.cos(a), cy + (rb + 5) * Math.sin(a)); g.stroke(); }
        g.lineWidth = 1; texto(g, `N₂ = ${f(p.N2)}`, cx + rb + 14, cy, col['--neg'], 'left');
      }
      g.strokeStyle = col['--neg']; g.fillStyle = col['--neg'];
      g.beginPath(); g.arc(cx, cy, (ra + rb) / 2, -2.4, -0.9); g.stroke(); const a = -0.9, rm = (ra + rb) / 2; flecha(g, cx + rm * Math.cos(a - 0.05), cy + rm * Math.sin(a - 0.05), cx + rm * Math.cos(a), cy + rm * Math.sin(a));
      texto(g, geo === 'toroide-circ' ? `N = ${f(p.N)}, R = ${f(p.R * 100)} cm, r = ${f(p.r * 100)} cm` : `a = ${f(p.a * 100)} cm, b = ${f(p.b * 100)} cm, h = ${f(p.h * 100)} cm`, 12, 14, col['--muted'], 'left');
    } else if (geo === 'entrehierro') {
      const rb = H / 2, ra = rb * 0.62, gap = Math.max(0.05, Math.min(0.4, p.g / p.R)) / 2;
      g.fillStyle = col['--nucleo']; g.beginPath(); g.arc(cx, cy, rb, gap, 2 * Math.PI - gap); g.arc(cx, cy, ra, 2 * Math.PI - gap, gap, true); g.closePath(); g.fill();
      g.strokeStyle = col['--cobre']; g.lineWidth = 1.6;
      for (let i = 0; i < Math.min(p.N, 30); i++) { const a = gap + 0.25 + ((2 * Math.PI - 2 * gap - 0.5) * i) / Math.max(1, Math.min(p.N, 30) - 1); g.beginPath(); g.moveTo(cx + (ra - 3) * Math.cos(a), cy + (ra - 3) * Math.sin(a)); g.lineTo(cx + (rb + 3) * Math.cos(a), cy + (rb + 3) * Math.sin(a)); g.stroke(); }
      g.lineWidth = 1; g.strokeStyle = col['--neg']; g.fillStyle = col['--neg'];
      g.beginPath(); g.arc(cx, cy, (ra + rb) / 2, -2.4, -0.9); g.stroke(); const rm = (ra + rb) / 2; flecha(g, cx + rm * Math.cos(-0.95), cy + rm * Math.sin(-0.95), cx + rm * Math.cos(-0.9), cy + rm * Math.sin(-0.9));
      texto(g, `g = ${f(p.g * 1000)} mm`, cx + rb + 8, cy, col['--ink'], 'left');
      texto(g, `μr = ${f(p.mur)}, R = ${f(p.R * 100)} cm, S = ${f(p.S * 1e4)} cm²`, 12, 14, col['--muted'], 'left');
    } else if (geo === 'espiras-coaxiales') {
      const esc2 = Math.min((w * 0.6) / Math.max(p.z, 1e-9), (H * 0.45) / p.R), R1 = p.R * esc2, r2 = Math.max(5, p.r * esc2), zz = Math.min(p.z * esc2, w * 0.6), x1 = cx - zz / 2, x2 = cx + zz / 2;
      g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(16, cy); g.lineTo(w - 16, cy); g.stroke(); g.setLineDash([]);
      g.lineWidth = 2.4; g.strokeStyle = col['--cobre']; g.beginPath(); g.ellipse(x1, cy, Math.max(4, R1 * 0.22), R1, 0, 0, 2 * Math.PI); g.stroke();
      g.strokeStyle = col['--neg']; g.beginPath(); g.ellipse(x2, cy, Math.max(3, r2 * 0.22), r2, 0, 0, 2 * Math.PI); g.stroke(); g.lineWidth = 1;
      texto(g, `R = ${f(p.R * 100)} cm, N₁ = ${f(p.N1)}`, x1, cy - R1 - 10, col['--cobre']); texto(g, `r = ${f(p.r * 100)} cm`, x2, cy - r2 - 12, col['--neg']);
      g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(x1, cy + R1 + 10); g.lineTo(x2, cy + R1 + 10); g.stroke(); texto(g, `z = ${f(p.z * 100)} cm`, cx, cy + R1 + 22);
    } else if (geo === 'espira-solenoide') {
      const lw = Math.min(w * 0.7, 520), x0 = cx - lw / 2, x1 = cx + lw / 2, rr = Math.min(H / 2, 70), th = (p.th * Math.PI) / 180, rb = rr * 0.55;
      bobina(g, x0, x1, cy, rr, Math.min(p.N1, 30), col['--cobre']);
      g.strokeStyle = col['--campo']; g.fillStyle = col['--campo']; flecha(g, x0 + 10, cy - rr * 0.8, x0 + 70, cy - rr * 0.8); texto(g, 'B', x0 + 80, cy - rr * 0.8, col['--campo'], 'left');
      // la bobina pequeña vista de lado, con su normal girada θ respecto al eje
      g.strokeStyle = col['--neg']; g.lineWidth = 2.4; g.beginPath(); g.ellipse(cx, cy, rb * 0.25, rb, -th, 0, 2 * Math.PI); g.stroke(); g.lineWidth = 1;
      g.fillStyle = col['--neg']; flecha(g, cx, cy, cx + 50 * Math.cos(th), cy - 50 * Math.sin(th)); texto(g, `θ = ${f(p.th)}°`, cx + 56 * Math.cos(th) + 6, cy - 56 * Math.sin(th), col['--neg'], 'left');
      texto(g, `N₁ = ${f(p.N1)}, l = ${f(p.l * 100)} cm · bobina: N₂ = ${f(p.N2)}, r = ${f(p.r * 100)} cm`, cx, h - 14);
    } else if (geo === 'coaxial') {
      const rb = H / 2, ra = rb * Math.max(0.08, p.a / p.b);
      circulo(g, cx, cy, rb + 6, col['--cobre']); circulo(g, cx, cy, rb, col['--bg']);
      circulo(g, cx, cy, ra, p.macizo ? col['--cobre'] : null, col['--cobre']);
      g.strokeStyle = col['--neg']; g.fillStyle = col['--neg'];
      for (const rr of [ra + (rb - ra) * 0.3, ra + (rb - ra) * 0.7]) { g.beginPath(); g.arc(cx, cy, rr, 0, 2 * Math.PI); g.setLineDash([4, 4]); g.stroke(); g.setLineDash([]); flecha(g, cx + rr, cy + 1, cx + rr, cy - 1); }
      texto(g, `a = ${f(p.a * 1000)} mm, b = ${f(p.b * 1000)} mm`, 12, 14, col['--muted'], 'left'); texto(g, 'B entre los conductores', cx, h - 10, col['--neg']);
    } else if (geo === 'bifilar') {
      const sep = Math.min(w * 0.6, 360), ra = Math.max(6, Math.min(40, (sep * p.a) / p.d));
      for (const [x, s] of [[cx - sep / 2, '⊙'], [cx + sep / 2, '⊗']]) { circulo(g, x, cy, ra, col['--cobre']); g.font = '15px system-ui'; texto(g, s, x, cy, col['--panel']); g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; }
      g.strokeStyle = col['--neg']; g.fillStyle = col['--neg']; flecha(g, cx, cy + 30, cx, cy - 30); texto(g, 'B', cx + 12, cy - 30, col['--neg']);
      g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(cx - sep / 2, cy + ra + 18); g.lineTo(cx + sep / 2, cy + ra + 18); g.stroke(); texto(g, `d = ${f(p.d * 1000)} mm`, cx, cy + ra + 30);
    } else if (geo === 'espiras') {
      const R = H / 2, r = Math.max(6, R * Math.min(0.6, p.r / p.R));
      circulo(g, cx, cy, R, null, col['--cobre']); circulo(g, cx, cy, r, null, col['--neg']);
      texto(g, `R = ${f(p.R * 100)} cm, N₁ = ${f(p.N1)}`, cx, cy - R - 10, col['--cobre']); texto(g, `r = ${f(p.r * 100)} cm`, cx, cy + r + 12, col['--neg']);
    } else if (geo === 'hilo-espira') {
      const esc2 = Math.min((w * 0.7) / (p.d + p.w), (H * 0.9) / p.h), x0 = cx - ((p.d + p.w) * esc2) / 2, xd = x0 + p.d * esc2, xw = xd + p.w * esc2, hh = p.h * esc2;
      g.strokeStyle = col['--cobre']; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, 14); g.lineTo(x0, h - 14); g.stroke(); g.lineWidth = 1;
      g.fillStyle = col['--cobre']; flecha(g, x0, cy + 20, x0, cy - 20, 8); texto(g, 'I₁', x0 - 12, cy, col['--cobre']);
      g.strokeStyle = col['--neg']; g.lineWidth = 2; g.strokeRect(xd, cy - hh / 2, xw - xd, hh); g.lineWidth = 1;
      g.font = '13px system-ui'; for (let i = 1; i < 4; i++) texto(g, '⊗', xd + ((xw - xd) * i) / 4, cy, col['--muted']); g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
      texto(g, `d = ${f(p.d * 100)} cm`, (x0 + xd) / 2, cy + hh / 2 + 12); texto(g, `w = ${f(p.w * 100)} cm`, (xd + xw) / 2, cy + hh / 2 + 12);
      texto(g, `h = ${f(p.h * 100)} cm`, xw + 8, cy, col['--muted'], 'left');
    } else {
      const lw = Math.min(w * 0.32, 200);
      bobina(g, cx - lw - 20, cx - 20, cy, 40, 10, col['--cobre']); bobina(g, cx + 20, cx + lw + 20, cy, 40, 10, col['--neg']);
      texto(g, `L₁ = ${u(p.L1, 'H')}`, cx - lw / 2 - 20, cy + 58, col['--cobre']); texto(g, `L₂ = ${u(p.L2, 'H')}`, cx + lw / 2 + 20, cy + 58, col['--neg']);
      texto(g, `k = ${f(p.k)}`, cx, cy - 58, col['--ink']);
    }
  }
  // transformador: V₂/V₂₀ y rendimiento frente a la resistencia de carga (escala logarítmica), con el punto de los datos
  function graficaT(g, w, h) {
    const pts = sol.curva(), { p, res } = sol, m = { l: 52, r: 20, t: 22, b: 40 }, a = Math.log10(pts[0][0]), z = Math.log10(pts[pts.length - 1][0]);
    const X = (R) => m.l + ((Math.log10(R) - a) / (z - a)) * (w - m.l - m.r), Y = (v) => h - m.b - v * (h - m.t - m.b);
    g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(m.l, m.t); g.lineTo(m.l, h - m.b); g.lineTo(w - m.r, h - m.b); g.stroke();
    for (const v of [0, 0.5, 1]) { g.setLineDash([3, 4]); g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(w - m.r, Y(v)); g.stroke(); g.setLineDash([]); texto(g, `${v * 100} %`, m.l - 6, Y(v), col['--muted'], 'right'); }
    for (let e = Math.ceil(a); e <= Math.floor(z); e++) texto(g, u(Math.pow(10, e), 'Ω', 3), X(Math.pow(10, e)), h - m.b + 14, col['--muted']);
    texto(g, 'resistencia de carga R_L (escala logarítmica; a la derecha, hacia el vacío)', (m.l + w - m.r) / 2, h - 8);
    const linea = (i, c) => { g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); pts.forEach((q, j) => (j ? g.lineTo(X(q[0]), Y(q[i])) : g.moveTo(X(q[0]), Y(q[i])))); g.stroke(); g.lineWidth = 1; };
    linea(1, col['--pos']); linea(2, col['--neg']);
    circulo(g, X(p.RL), Y(res.V2 / res.V20), 4, col['--pos']); circulo(g, X(p.RL), Y(res.eta), 4, col['--neg']);
    texto(g, 'V₂ / V₂₀ (cuánto cae la tensión)', m.l + 8, m.t + 2, col['--pos'], 'left'); texto(g, 'rendimiento η', m.l + 8, m.t + 16, col['--neg'], 'left');
  }
  // fuerza entre espiras: F(z) con el punto de los datos y la aproximación de dipolo discontinua
  function graficaF(g, w, h) {
    const { p, res } = sol, pts = sol.curva(), m = { l: 62, r: 20, t: 22, b: 36 }, zm = pts[pts.length - 1][0], Fm = Math.max(...pts.map((q) => Math.abs(q[1])), Math.abs(res.F)) * 1.1 || 1;
    const X = (z) => m.l + (z / zm) * (w - m.l - m.r), Y = (F) => (m.t + h - m.b) / 2 - (F / Fm) * ((h - m.t - m.b) / 2);
    const y0 = Y(0); g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(m.l, m.t); g.lineTo(m.l, h - m.b); g.stroke(); g.beginPath(); g.moveTo(m.l, y0); g.lineTo(w - m.r, y0); g.stroke();
    texto(g, 'z', w - m.r, y0 + 12); texto(g, '0', m.l - 6, y0, col['--muted'], 'right'); texto(g, `${f(zm * 100, 3)} cm`, w - m.r, y0 + 12 + 12, col['--muted'], 'right');
    texto(g, u(Fm / 1.1, 'N', 3), m.l - 6, Y(Fm / 1.1), col['--muted'], 'right'); texto(g, `−${u(Fm / 1.1, 'N', 3)}`, m.l - 6, Y(-Fm / 1.1), col['--muted'], 'right');
    g.strokeStyle = col['--cobre']; g.lineWidth = 2; g.beginPath(); pts.forEach(([z, F], i) => { const x = X(z), y = Y(F); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.lineWidth = 1;
    const dip = (z) => (p.I1 * p.I2 * -3 * I.MU0 * p.N1 * p.N2 * Math.PI * p.R * p.R * p.r * p.r * z) / (2 * Math.pow(p.R * p.R + z * z, 2.5));
    g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.beginPath(); pts.forEach(([z], i) => { const x = X(z), y = Y(dip(z)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.setLineDash([]);
    circulo(g, X(p.z), Y(res.F), 5, col['--neg']); texto(g, `z = ${f(p.z * 100)} cm: ${u(res.F, 'N', 3)}`, Math.min(X(p.z) + 8, w - 150), Y(res.F) - 14, col['--neg']);
    texto(g, 'F(z) exacta', m.l + 8, m.t + 2, col['--cobre'], 'left'); texto(g, 'aproximación de dipolo', m.l + 100, m.t + 2, col['--muted'], 'left'); texto(g, 'arriba: repulsión · abajo: atracción', w - m.r - 4, m.t + 2, col['--muted'], 'right');
  }
  // transitorio RL: I(t) a la izquierda en A, V_L(t) a la derecha en V
  function grafica(g, w, h) {
    const { p, tau, res } = sol, T = p.pulsos ? Math.min(Math.max(5 * tau, 4 * (p.ton + p.toff)), 12 * (p.ton + p.toff)) : 5 * tau, m = { l: 52, r: 52, t: 16, b: 34 };
    const X = (t) => m.l + (t / T) * (w - m.l - m.r), Yi = (i) => h - m.b - (i / res.I0) * (h - m.t - m.b);
    const Vmax = p.E, Yv = p.pulsos ? (v) => h - m.b - ((v + Vmax) / (2 * Vmax)) * (h - m.t - m.b) : (v) => h - m.b - ((v + (p.carga ? 0 : Vmax)) / Vmax) * (h - m.t - m.b);
    g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(m.l, m.t); g.lineTo(m.l, h - m.b); g.lineTo(w - m.r, h - m.b); g.lineTo(w - m.r, m.t); g.stroke();
    if (p.pulsos) { for (let s = p.ton; s < T; s += p.ton + p.toff) { g.fillStyle = col['--nucleo']; g.fillRect(X(s), m.t, Math.min(X(s + p.toff), w - m.r) - X(s), h - m.t - m.b); } texto(g, 'sombreado: desconectada', w - m.r - 4, h - m.b - 10, col['--muted'], 'right'); }
    else for (let k = 1; k <= 5; k++) { g.setLineDash([3, 4]); g.beginPath(); g.moveTo(X(k * tau), m.t); g.lineTo(X(k * tau), h - m.b); g.stroke(); g.setLineDash([]); texto(g, `${k}τ`, X(k * tau), h - m.b + 12); }
    texto(g, 't', w - m.r + 10, h - m.b + 12);
    texto(g, u(res.I0, 'A', 3), m.l - 6, m.t, col['--neg'], 'right'); texto(g, '0', m.l - 6, h - m.b, col['--neg'], 'right');
    if (p.pulsos) { texto(g, u(Vmax, 'V', 3), w - m.r + 6, m.t, col['--pos'], 'left'); texto(g, `−${u(Vmax, 'V', 3)}`, w - m.r + 6, h - m.b, col['--pos'], 'left'); texto(g, `${f(T * 1000, 3)} ms`, w - m.r, h - m.b + 24); }
    else { texto(g, `${p.carga ? '' : '−'}${u(Vmax, 'V', 3)}`, w - m.r + 6, p.carga ? m.t : h - m.b, col['--pos'], 'left'); texto(g, '0', w - m.r + 6, p.carga ? h - m.b : m.t, col['--pos'], 'left'); }
    const linea = (fn, Y, c) => { g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 600; i++) { const t = (T * i) / 600, x = X(t), y = Y(fn(t)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.lineWidth = 1; };
    linea(sol.I, Yi, col['--neg']); linea(sol.VL, Yv, col['--pos']);
    texto(g, 'I(t)', m.l + 8, m.t + 6, col['--neg'], 'left'); texto(g, 'tensión en la bobina', m.l + 50, m.t + 6, col['--pos'], 'left');
    if (p.t !== null && p.t * 1e-3 <= T) {
      const s = p.t * 1e-3;
      circulo(g, X(s), Yi(sol.I(s)), 4, col['--neg']); circulo(g, X(s), Yv(sol.VL(s)), 4, col['--pos']);
      texto(g, `t = ${f(p.t)} ms`, X(s), h - m.b + 24, col['--ink']);
    }
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('induccion').current;
  pestana(['L', 'M', 'F', 'RL', 'T'].includes(st.tab) ? st.tab : 'L');
  window.InducApp = { abrirEjemplo, pestana, resultado: () => sol && sol.res, estado: () => copia(st) };
})();
