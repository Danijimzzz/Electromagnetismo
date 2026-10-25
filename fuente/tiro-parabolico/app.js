/* =====================================================================
   Tiro parabólico y cinemática: interfaz (datos, trayectoria animada,
   gráficas frente al tiempo y desarrollo). El cálculo está en fisica.js
   (Cinematica).
   ===================================================================== */
(() => {
  const { $ } = Herramienta;
  const C = Cinematica, f = C.f;
  const txt = (s) => String(s).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, ''); // para el lienzo
  const CLAVE = 'tiro-v1';
  const CAMPOS = [
    { sep: 'Lanzamiento' },
    { k: 'v0', nom: 'Velocidad inicial v<sub>0</sub>', u: 'm/s' },
    { k: 'ang', nom: 'Ángulo α sobre la horizontal', u: '°' },
    { k: 'y0', nom: 'Altura inicial y<sub>0</sub>', u: 'm' },
    { sep: 'Suelo y gravedad' },
    { k: 'yf', nom: 'Altura donde cae y<sub>f</sub>', u: 'm' },
    { k: 'g', nom: 'Gravedad g', u: 'm/s²' },
    { sep: 'Rozamiento del aire' },
    { k: 'modelo', nom: 'Modelo', sel: [['ninguno', 'Sin rozamiento'], ['lineal', 'Lineal −(b/m) v'], ['cuadratico', 'Cuadrático −(c/m)|v| v']] },
    { k: 'b', nom: 'b/m', u: '1/s', si: 'lineal' },
    { k: 'c', nom: 'c/m', u: '1/m', si: 'cuadratico' },
    { sep: 'Preguntas (opcional)' },
    { k: 'tq', nom: 'Estado en el instante t', u: 's' },
    { k: 'xb', nom: 'Blanco en x', u: 'm' },
    { k: 'yb', nom: 'Blanco en y', u: 'm' },
  ];
  const CAMPOS_R = [
    { sep: 'Movimiento' },
    { k: 'x0', nom: 'Posición inicial x<sub>0</sub>', u: 'm' },
    { k: 'v0', nom: 'Velocidad inicial v<sub>0</sub>', u: 'm/s' },
    { k: 'a', nom: 'Aceleración a', u: 'm/s²' },
    { sep: 'Preguntas (opcional)' },
    { k: 'tq', nom: 'Posición y velocidad en t', u: 's' },
    { k: 'xq', nom: '¿Cuándo pasa por x?', u: 'm' },
  ];
  const BASE = { v0: '', ang: '', y0: '0', yf: '0', g: '9.81', modelo: 'ninguno', b: '0.1', c: '0.005', tq: '', xb: '', yb: '' };
  const BASE_R = { x0: '0', v0: '', a: '', tq: '', xq: '' };

  let st = { tab: 'tiro', sc: { ...BASE, ...C.ejemplos[0].sc }, r: { ...BASE_R, ...C.ejemplosRecta[0].sc } };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.sc && g.r) st = { tab: g.tab === 'recta' ? 'recta' : 'tiro', sc: { ...BASE, ...g.sc }, r: { ...BASE_R, ...g.r } }; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) {} };
  const col = {};
  function colores() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--suelo', '--bola', '--blanco', '--c-x', '--c-y', '--c-v', '--c-a']) col[k] = cs.getPropertyValue(k).trim();
  }
  const lienzo = (c) => Herramienta.lienzo(c);
  const paso = (rango, n = 5) => { const r = rango / n, p = 10 ** Math.floor(Math.log10(r || 1)), m = r / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  const flecha = (g, x0, y0, x1, y1, c) => {
    const L = Math.hypot(x1 - x0, y1 - y0); if (L < 2) return;
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - ux * 6, y1 - uy * 6); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - ux * 9 - uy * 4.5, y1 - uy * 9 + ux * 4.5); g.lineTo(x1 - ux * 9 + uy * 4.5, y1 - uy * 9 - ux * 4.5); g.closePath(); g.fill();
  };
  // gráfica frente al tiempo: series [{ nom, col, v: (estado) → número }]
  function grafica(c, puntos, T, series, tc, unidad) {
    const { g, w, h } = lienzo(c);
    let lo = 0, hi = 0;
    for (const s of series) for (const p of puntos) { const v = s.v(p); if (v < lo) lo = v; if (v > hi) hi = v; }
    if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
    const m = (hi - lo) * 0.08; hi += m; lo -= m;
    const l = 52, r = 10, top = 8, b = 22;
    const X = (t) => l + (t / Math.max(T, 1e-9)) * (w - l - r), Y = (v) => h - b - ((v - lo) / (hi - lo)) * (h - top - b);
    g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    const sy = paso(hi - lo, 4);
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let v = Math.ceil(lo / sy) * sy; v <= hi; v += sy) { g.beginPath(); g.moveTo(l, Y(v)); g.lineTo(w - r, Y(v)); g.stroke(); g.fillText(txt(f(v, 2)), l - 4, Y(v)); }
    if (lo < 0 && hi > 0) { g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(l, Y(0)); g.lineTo(w - r, Y(0)); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    const sx = paso(T, 5);
    for (let t = 0; t <= T + 1e-9; t += sx) g.fillText(txt(f(t, 2)) + ' s', X(t), h - b + 5);
    if (unidad) { g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText(unidad, w - r - 2, top + 2); }
    g.lineWidth = 1.8;
    for (const s of series) {
      g.strokeStyle = col[s.col]; if (s.trazo) g.setLineDash(s.trazo);
      g.beginPath(); puntos.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(s.v(p))) : g.moveTo(X(p.t), Y(s.v(p))))); g.stroke(); g.setLineDash([]);
    }
    if (tc !== null) { g.strokeStyle = col['--ink']; g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(tc), top); g.lineTo(X(tc), h - b); g.stroke(); g.setLineDash([]); }
  }

  /* ---------- Pestañas ---------- */
  function pestana(t) {
    st.tab = t; guarda();
    $('#tab-tiro').setAttribute('aria-selected', t === 'tiro'); $('#tab-recta').setAttribute('aria-selected', t === 'recta');
    $('#panel-tiro').hidden = t !== 'tiro'; $('#panel-recta').hidden = t !== 'recta';
    paraT(); paraR();
    if (t === 'tiro') dibujaT(); else dibujaR();
  }
  $('#tab-tiro').addEventListener('click', () => pestana('tiro'));
  $('#tab-recta').addEventListener('click', () => pestana('recta'));

  function formulario(cont, campos, datos, alCambiar) {
    for (const c of campos) {
      if (c.sep) { cont.insertAdjacentHTML('beforeend', `<div class="sep">${c.sep}</div>`); continue; }
      const id = cont.id + '-' + c.k;
      const ctl = c.sel ? `<select id="${id}" class="in ancho">${c.sel.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>` : `<input id="${id}" class="in" inputmode="decimal" autocomplete="off">`;
      cont.insertAdjacentHTML('beforeend', `<label for="${id}" data-fila="${c.k}"${c.sel ? ' class="ancho"' : ''}>${c.nom}${c.u ? ` <small>(${c.u})</small>` : ''}</label>${ctl}`);
    }
    cont.addEventListener('input', (e) => { const k = e.target.id.slice(cont.id.length + 1); datos()[k] = e.target.value; alCambiar(k); });
    return () => {
      const d = datos();
      for (const c of campos) if (c.k) {
        const el = document.getElementById(cont.id + '-' + c.k);
        el.value = c.sel ? d[c.k] : String(d[c.k] ?? '').replace('.', ',');
        if (c.si) { const ver = d.modelo === c.si; el.hidden = !ver; cont.querySelector(`[data-fila="${c.k}"]`).hidden = !ver; }
      }
    };
  }

  /* =================== Tiro parabólico =================== */
  let tray = null, sol = null, t = 0, jugando = false, ultimo = 0;
  // número con decimales fijos y relleno a la izquierda, para que la lectura no cambie de ancho mientras avanza el tiempo
  const fijo = (x, d, ancho = 0) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('.', ',').replace('-', '−').padStart(ancho, ' ');
  // cada dato en su span: no se parte por dentro, pero la línea puede bajar entera en el móvil
  const lee = (el, texto) => { el.innerHTML = texto.split(' · ').map((x) => `<span>${x}</span>`).join(' · '); };
  const anchoDe = (vals, d) => Math.max(...vals.map((v) => fijo(v, d).length));
  let anchos = null; // anchos de la lectura para la trayectoria actual
  const rellena = formulario($('#campos'), CAMPOS, () => st.sc, (k) => { $('#ejemplos').value = ''; if (k === 'modelo') rellena(); calculaT(true); });
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave); if (!e) return;
    st.sc = { ...BASE, ...e.sc }; rellena(); sel.value = clave; pestana('tiro'); calculaT(true); paraT(); t = 0; dibujaT();
  }

  function calculaT(guardar) {
    const err = $('#error');
    try { sol = C.resolver(st.sc); tray = C.trayectoria(st.sc); } catch (e) { err.textContent = e.message; err.hidden = false; sol = tray = null; dibujaT(); return; }
    err.hidden = true;
    if (guardar) guarda();
    t = Math.min(t, tray.tv);
    const P = tray.puntos; anchos = { t: anchoDe([tray.tv], 2), x: anchoDe(P.map((q) => q.x), 2), y: anchoDe(P.map((q) => q.y), 2), v: anchoDe(P.map((q) => Math.hypot(q.vx, q.vy)), 2) };
    const r = sol.res, filas = [['Tiempo de vuelo', f(r.tv) + ' s'], ['Altura máxima', f(r.hmax) + ' m'], ['Alcance', f(r.alcance) + ' m'], ['Velocidad al caer', `${f(r.vf)} m/s a ${f(Math.abs(r.angf))}°`]];
    if (r.blanco && r.blanco.angulos) filas.push(['Ángulos para el blanco', r.blanco.angulos.map((a) => f(a) + '°').join(' y ')]);
    $('#resumen').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    dibujaT();
  }

  function dibujaEscena(e) {
    const c = $('#lienzo'), P = tray.puntos, p = tray.p, I = tray.ideal || [];
    let x0 = 0, x1 = 0, y0 = Math.min(0, p.y0, p.yf), y1 = Math.max(p.y0, p.yf);
    for (const q of [...P, ...I]) { x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
    if (p.xb !== null) { x1 = Math.max(x1, p.xb); y1 = Math.max(y1, p.yb); y0 = Math.min(y0, p.yb); }
    if (x1 - x0 < 1e-6) { x0 = -Math.max(1, (y1 - y0) * 0.4); x1 = -x0; }
    const pad = 14, izq = 44, abajo = 24;
    const ancho = (x1 - x0) * 1.06, alto = (y1 - y0) * 1.12 || 1;
    // la escala es la misma en los dos ejes: el lienzo toma la altura que pide la trayectoria
    const hPide = alto * ((c.clientWidth - izq - pad) / ancho) + pad + abajo;
    c.style.height = Math.round(Math.max(190, Math.min(hPide, 420, innerHeight * 0.7))) + 'px';
    const { g, w, h: H } = lienzo(c);
    const s = Math.min((w - izq - pad) / ancho, (H - pad - abajo) / alto);
    const ox = izq + ((w - izq - pad) - (x1 - x0) * s) / 2 - x0 * s, oy = H - abajo - ((H - pad - abajo) - (y1 - y0) * 1.06 * s) / 2 + y0 * s;
    const X = (x) => ox + x * s, Y = (y) => oy - y * s;
    // texto con fondo para que se lea encima de las curvas
    const etiqueta = (t, x, y, alinea, base, color) => {
      g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; const an = g.measureText(t).width;
      if (alinea === 'center') x = Math.max(an / 2 + 2, Math.min(w - an / 2 - 2, x));
      const xi = alinea === 'center' ? x - an / 2 : alinea === 'right' ? x - an : x, yi = base === 'bottom' ? y - 14 : y;
      g.fillStyle = col['--bg']; g.globalAlpha = 0.85; g.fillRect(xi - 3, yi - 1, an + 6, 16); g.globalAlpha = 1;
      g.fillStyle = color || col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(t, xi, yi + 1);
    };
    // ejes con marcas en metros
    g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    const st_ = paso(Math.max(x1 - x0, y1 - y0), 6);
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let x = Math.ceil(x0 / st_) * st_; x <= x1 * 1.04; x += st_) { g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y0) + 4); g.stroke(); g.fillText(txt(f(x, 2)), X(x), Y(y0) + 6); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let y = Math.ceil(y0 / st_) * st_; y <= y1 * 1.04 + 1e-9; y += st_) { g.beginPath(); g.moveTo(X(x0) - 10, Y(y)); g.lineTo(w - pad, Y(y)); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; g.fillText(txt(f(y, 2)), izq - 14, Y(y)); }
    g.textAlign = 'left'; g.fillText('m', 4, pad);
    // suelo: el nivel de llegada y, si sale de más alto, la torre de lanzamiento
    g.fillStyle = col['--suelo'];
    const base = Y(y0) + 2;
    if (p.yf > p.y0) {
      const sube = P.find((q) => q.y >= p.yf), xp = sube ? sube.x + 0.6 * (sol.res.alcance - sube.x) : sol.res.alcance * 0.8;
      g.fillRect(X(x0) - 10, Y(p.y0), X(xp) - X(x0) + 10, base - Y(p.y0));
      g.fillRect(X(xp), Y(p.yf), w - X(xp), base - Y(p.yf));
    } else {
      g.fillRect(X(x0) - 10, Y(p.yf), w - X(x0) + 10, base - Y(p.yf));
      if (p.y0 > p.yf) g.fillRect(X(x0) - 10, Y(p.y0), X(0) - X(x0) + 10 + 0.02 * ancho * s, Y(p.yf) - Y(p.y0));
    }
    // sin rozamiento, a trazos
    const linea = (Q, hasta) => { g.beginPath(); let k = 0; for (const q of Q) { if (hasta !== undefined && q.t > hasta) break; k++ ? g.lineTo(X(q.x), Y(q.y)) : g.moveTo(X(q.x), Y(q.y)); } if (hasta !== undefined) g.lineTo(X(e.x), Y(e.y)); g.stroke(); };
    if (I.length) { g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.setLineDash([5, 4]); linea(I); g.setLineDash([]); }
    g.strokeStyle = col['--line']; g.lineWidth = 1.5; linea(P);
    g.strokeStyle = col['--accent']; g.lineWidth = 2.2; linea(P, e.t);
    // cima y alcance
    const r = sol.res;
    if (r.tc > 0) {
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(X(r.xc), Y(r.hmax)); g.lineTo(X(r.xc), Y(Math.min(p.y0, p.yf))); g.stroke(); g.setLineDash([]);
      etiqueta(`y máx = ${txt(f(r.hmax))} m`, X(r.xc), Y(r.hmax) - 8, 'center', 'bottom');
    }
    if (r.alcance > 0) {
      g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(r.alcance), Y(p.yf) - 5); g.lineTo(X(r.alcance), Y(p.yf) + 5); g.stroke();
      etiqueta(`${txt(f(r.alcance))} m`, X(r.alcance), Y(p.yf) - 10, 'center', 'bottom', col['--ink']);
    }
    if (p.xb !== null) {
      g.strokeStyle = col['--blanco']; g.lineWidth = 2;
      for (const rr of [9, 4]) { g.beginPath(); g.arc(X(p.xb), Y(p.yb), rr, 0, 2 * Math.PI); g.stroke(); }
    }
    // proyectil con su velocidad y sus componentes
    const vmax = Math.max(...P.map((q) => Math.hypot(q.vx, q.vy)), 1e-9), esc = Math.min(70, 0.22 * Math.min(w, H)) / vmax;
    flecha(g, X(e.x), Y(e.y), X(e.x) + e.vx * esc, Y(e.y), col['--c-x']);
    flecha(g, X(e.x), Y(e.y), X(e.x), Y(e.y) - e.vy * esc, col['--c-y']);
    flecha(g, X(e.x), Y(e.y), X(e.x) + e.vx * esc, Y(e.y) - e.vy * esc, col['--c-v']);
    g.fillStyle = col['--bola']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
    g.beginPath(); g.arc(X(e.x), Y(e.y), 6.5, 0, 2 * Math.PI); g.fill(); g.stroke();
  }

  function dibujaT() {
    if (!tray || !sol) { lienzo($('#lienzo')); lienzo($('#grafica')); $('#lectura').textContent = ''; return; }
    if ($('#panel-tiro').hidden) return;
    const e = tray.estado(Math.min(t, tray.tv));
    dibujaEscena(e);
    const q = $('#que').value, I = tray.ideal;
    const series = q === 'pos' ? [{ nom: 'x(t)', col: '--c-x', v: (p) => p.x }, { nom: 'y(t)', col: '--c-y', v: (p) => p.y }]
      : q === 'vel' ? [{ nom: 'v<sub>x</sub>(t)', col: '--c-x', v: (p) => p.vx }, { nom: 'v<sub>y</sub>(t)', col: '--c-y', v: (p) => p.vy }, { nom: '|v|(t)', col: '--c-v', v: (p) => Math.hypot(p.vx, p.vy) }]
      : [{ nom: 'a<sub>x</sub>(t)', col: '--c-x', v: (p) => p.ax }, { nom: 'a<sub>y</sub>(t)', col: '--c-y', v: (p) => p.ay }];
    grafica($('#grafica'), tray.puntos, tray.tv, series, Math.min(t, tray.tv), q === 'pos' ? 'm' : q === 'vel' ? 'm/s' : 'm/s²');
    $('#leyenda').innerHTML = series.map((s) => `<span><i style="background:var(${s.col})"></i>${s.nom}</span>`).join('') + (I ? '<span>· a trazos en el dibujo: sin rozamiento</span>' : '');
    lee($('#lectura'), `t = ${fijo(e.t, 2, anchos.t)} s · x = ${fijo(e.x, 2, anchos.x)} m · y = ${fijo(e.y, 2, anchos.y)} m · v = ${fijo(Math.hypot(e.vx, e.vy), 2, anchos.v)} m/s`);
    $('#tiempo').value = String(Math.round((t / Math.max(tray.tv, 1e-9)) * 1000));
  }
  $('#que').addEventListener('change', dibujaT);

  function paraT() { jugando = false; $('#play').textContent = '▶ Lanzar'; }
  function bucleT(ahora) {
    if (!jugando || !tray) return;
    t += Math.min(0.05, (ahora - ultimo) / 1000) * +$('#ritmo').value; ultimo = ahora;
    if (t >= tray.tv) { t = tray.tv; dibujaT(); paraT(); return; }
    dibujaT(); requestAnimationFrame(bucleT);
  }
  $('#play').addEventListener('click', () => {
    if (jugando) { paraT(); return; }
    if (!tray) return;
    if (t >= tray.tv) t = 0;
    jugando = true; $('#play').textContent = '❚❚ Pausa'; ultimo = performance.now(); requestAnimationFrame(bucleT);
  });
  $('#reinicio').addEventListener('click', () => { paraT(); t = 0; dibujaT(); });
  $('#tiempo').addEventListener('input', (e) => { if (!tray) return; paraT(); t = (+e.target.value / 1000) * tray.tv; dibujaT(); });

  /* =================== Movimiento rectilíneo =================== */
  let rec = null, tr = 0, jugandoR = false, ultimoR = 0, puntosR = [];
  const rellenaR = formulario($('#campos-r'), CAMPOS_R, () => st.r, () => { $('#ejemplos-r').value = ''; calculaR(true); });
  const selR = $('#ejemplos-r');
  selR.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplosRecta.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  selR.addEventListener('change', () => { if (selR.value) abrirEjemploR(selR.value); });
  function abrirEjemploR(clave) {
    const e = C.ejemplosRecta.find((x) => x.clave === clave); if (!e) return;
    st.r = { ...BASE_R, ...e.sc }; rellenaR(); selR.value = clave; pestana('recta'); calculaR(true); paraR(); tr = 0; dibujaR();
  }
  function calculaR(guardar) {
    const err = $('#error-r');
    try { rec = C.rectilineo(st.r); } catch (e) { err.textContent = e.message; err.hidden = false; rec = null; dibujaR(); return; }
    err.hidden = true;
    if (guardar) guarda();
    puntosR = Array.from({ length: 301 }, (_, i) => { const tt = (rec.T * i) / 300; return { t: tt, x: rec.x(tt), v: rec.v(tt), a: rec.p.a }; });
    tr = Math.min(tr, rec.T);
    const r = rec.res, filas = [['Tipo', r.tipo]];
    if (r.tParada !== undefined) filas.push(['Se para en', `t = ${f(r.tParada)} s, x = ${f(r.xParada)} m`]);
    if (r.xEnT !== undefined) filas.push([`En t = ${f(rec.p.tq)} s`, `x = ${f(r.xEnT)} m, v = ${f(r.vEnT)} m/s`]);
    if (r.tEnX) filas.push([`Pasa por x = ${f(rec.p.xq)} m`, r.tEnX.length ? r.tEnX.map((x) => `t = ${f(x)} s`).join(' y ') : 'nunca']);
    $('#resumen-r').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos-r').innerHTML = rec.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    dibujaR();
  }
  function dibujaR() {
    if (!rec) { for (const id of ['#pista', '#g-x', '#g-v', '#g-a']) lienzo($(id)); $('#lectura-r').textContent = ''; return; }
    if ($('#panel-recta').hidden) return;
    const { g, w, h } = lienzo($('#pista'));
    let lo = Math.min(...puntosR.map((q) => q.x)), hi = Math.max(...puntosR.map((q) => q.x));
    if (rec.p.xq !== null) { lo = Math.min(lo, rec.p.xq); hi = Math.max(hi, rec.p.xq); }
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const l = 24, r = 24, X = (x) => l + ((x - lo) / (hi - lo)) * (w - l - r), yb = h * 0.62;
    g.strokeStyle = col['--muted']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(8, yb); g.lineTo(w - 8, yb); g.stroke();
    g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineWidth = 1;
    const sp = paso(hi - lo, 6);
    for (let x = Math.ceil(lo / sp) * sp; x <= hi + 1e-9; x += sp) { g.beginPath(); g.moveTo(X(x), yb - 4); g.lineTo(X(x), yb + 4); g.stroke(); g.fillText(txt(f(x, 2)), X(x), yb + 7); }
    if (rec.p.xq !== null) { g.strokeStyle = col['--blanco']; g.lineWidth = 2; g.beginPath(); g.moveTo(X(rec.p.xq), yb - 16); g.lineTo(X(rec.p.xq), yb + 4); g.stroke(); }
    const x = rec.x(tr), v = rec.v(tr), vmax = Math.max(...puntosR.map((q) => Math.abs(q.v)), 1e-9);
    flecha(g, X(x), yb - 22, X(x) + (v / vmax) * 60, yb - 22, col['--c-v']);
    g.fillStyle = col['--bola']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
    g.beginPath(); g.roundRect ? g.roundRect(X(x) - 11, yb - 14, 22, 12, 3) : g.rect(X(x) - 11, yb - 14, 22, 12); g.fill(); g.stroke();
    grafica($('#g-x'), puntosR, rec.T, [{ col: '--c-x', v: (q) => q.x }], tr, 'x (m)');
    grafica($('#g-v'), puntosR, rec.T, [{ col: '--c-v', v: (q) => q.v }], tr, 'v (m/s)');
    grafica($('#g-a'), puntosR, rec.T, [{ col: '--c-a', v: (q) => q.a }], tr, 'a (m/s²)');
    lee($('#lectura-r'), `t = ${fijo(tr, 2, anchoDe([rec.T], 2))} s · x = ${fijo(x, 2, anchoDe(puntosR.map((q) => q.x), 2))} m · v = ${fijo(v, 2, anchoDe(puntosR.map((q) => q.v), 2))} m/s`);
    $('#tiempo-r').value = String(Math.round((tr / rec.T) * 1000));
  }
  function paraR() { jugandoR = false; $('#play-r').textContent = '▶ Reproducir'; }
  function bucleR(ahora) {
    if (!jugandoR || !rec) return;
    tr += Math.min(0.05, (ahora - ultimoR) / 1000) * Math.max(1, rec.T / 8); ultimoR = ahora;
    if (tr >= rec.T) { tr = rec.T; dibujaR(); paraR(); return; }
    dibujaR(); requestAnimationFrame(bucleR);
  }
  $('#play-r').addEventListener('click', () => {
    if (jugandoR) { paraR(); return; }
    if (!rec) return;
    if (tr >= rec.T) tr = 0;
    jugandoR = true; $('#play-r').textContent = '❚❚ Pausa'; ultimoR = performance.now(); requestAnimationFrame(bucleR);
  });
  $('#reinicio-r').addEventListener('click', () => { paraR(); tr = 0; dibujaR(); });
  $('#tiempo-r').addEventListener('input', (e) => { if (!rec) return; paraR(); tr = (+e.target.value / 1000) * rec.T; dibujaR(); });

  addEventListener('resize', () => { dibujaT(); dibujaR(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibujaT(); dibujaR(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('tiro-parabolico').current;
  colores(); rellena(); rellenaR(); calculaT(false); calculaR(false); pestana(st.tab);
  window.TiroApp = {
    abrirEjemplo, abrirEjemploR, pestana, sol: () => sol, rec: () => rec,
    ir: (tt) => { paraT(); if (tray) t = Math.max(0, Math.min(tray.tv, tt)); dibujaT(); }, fin: () => (tray ? tray.tv : 0),
  };
})();
