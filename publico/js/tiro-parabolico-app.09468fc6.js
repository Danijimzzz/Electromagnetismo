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
    { sep: 'Dibujo' },
    { k: 'familia', nom: 'Trayectorias', sel: [['no', 'Solo este tiro'], ['si', 'Varios ángulos con la misma v₀']] },
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
    { sep: 'Segundo móvil B (opcional)' },
    { k: 'x0b', nom: 'Posición inicial de B', u: 'm' },
    { k: 'v0b', nom: 'Velocidad inicial de B', u: 'm/s' },
    { k: 'ab', nom: 'Aceleración de B', u: 'm/s²' },
  ];
  const CAMPOS_C = [
    { sep: 'Giro' },
    { k: 'R', nom: 'Radio R', u: 'm' },
    { k: 'dato', nom: 'Dato', sel: [['w', 'Velocidad angular ω (rad/s)'], ['v', 'Velocidad lineal v (m/s)'], ['T', 'Periodo T (s)'], ['rpm', 'Revoluciones por minuto']] },
    { k: 'val', nom: 'Valor del dato', u: '' },
    { k: 'alfa', nom: 'Aceleración angular α (0 = MCU)', u: 'rad/s²' },
    { sep: 'Preguntas (opcional)' },
    { k: 'tq', nom: 'Estado en el instante t', u: 's' },
    { k: 'nv', nom: '¿Cuándo da n vueltas?', u: 'vueltas' },
  ];
  const BASE = { v0: '', ang: '', y0: '0', yf: '0', g: '9.81', modelo: 'ninguno', b: '0.1', c: '0.005', familia: 'no', tq: '', xb: '', yb: '' };
  const BASE_R = { x0: '0', v0: '', a: '', tq: '', xq: '', x0b: '', v0b: '', ab: '' };
  const BASE_C = { R: '', dato: 'w', val: '', alfa: '0', tq: '', nv: '' };
  const TABS = ['tiro', 'recta', 'circ'];

  let st = { tab: 'tiro', sc: { ...BASE, ...C.ejemplos[0].sc }, r: { ...BASE_R, ...C.ejemplosRecta[0].sc }, c: { ...BASE_C, ...C.ejemplosCirculo[0].sc } };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.sc && g.r) st = { tab: TABS.includes(g.tab) ? g.tab : 'tiro', sc: { ...BASE, ...g.sc }, r: { ...BASE_R, ...g.r }, c: { ...BASE_C, ...C.ejemplosCirculo[0].sc, ...g.c } }; } catch (e) {}
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

  function pestana(t) {
    st.tab = t; guarda();
    for (const k of TABS) { $('#tab-' + k).setAttribute('aria-selected', t === k); $('#panel-' + k).hidden = t !== k; }
    paraT(); paraR(); paraC();
    if (t === 'tiro') dibujaT(); else if (t === 'recta') dibujaR(); else dibujaC();
  }
  for (const k of TABS) $('#tab-' + k).addEventListener('click', () => pestana(k));

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

  let tray = null, sol = null, t = 0, jugando = false, ultimo = 0;
  const fijo = (x, d, ancho = 0) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('.', ',').replace('-', '−').padStart(ancho, ' ');
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
    if (r.Rmax !== undefined) filas.push([`Alcance máximo (α = ${f(r.angOpt)}°)`, f(r.Rmax) + ' m']);
    if (r.blanco && r.blanco.angulos) filas.push(['Ángulos para el blanco', r.blanco.angulos.map((a) => f(a) + '°').join(' y ')]);
    if (r.blanco && r.blanco.v0nec) filas.push([`v<sub>0</sub> para el blanco a ${f(tray.p.ang)}°`, f(r.blanco.v0nec) + ' m/s']);
    $('#resumen').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    { const ue = $('#usar-en'), ok = st.sc.modelo === 'ninguno' && isFinite(r.hmax) && isFinite(r.xc) && r.xc > 0 && r.hmax >= 0 && +String(st.sc.yf).replace(',', '.') >= 0 && +String(st.sc.y0).replace(',', '.') >= 0;
      const c6 = (x) => String(+x.toPrecision(8)).replace('.', ',');
      if (ue) { ue.hidden = !ok; ue.innerHTML = ok ? `<a class="btn" data-usar="trabajo-y-energia" href="${Herramienta.esc(Herramienta.enlaceA('trabajo-y-energia', { modo: 'montana', m: '1', g: c6(+String(st.sc.g).replace(',', '.')), alturas: [st.sc.y0, c6(r.hmax), st.sc.yf].map((v) => String(v).replace('.', ',')).join('; '), sep: c6(r.xc), v0: c6(+String(st.sc.v0).replace(',', '.')) }))}">Comprobar la velocidad al caer por energía →</a>` : ''; } }
    dibujaT();
  }

  function dibujaEscena(e) {
    const c = $('#lienzo'), P = tray.puntos, p = tray.p, I = tray.ideal || [], F = tray.familia || [], E = tray.envolvente || [];
    let x0 = 0, x1 = 0, y0 = Math.min(0, p.y0, p.yf), y1 = Math.max(p.y0, p.yf);
    for (const q of [...P, ...I, ...F.flatMap((u) => u.puntos), ...E]) { x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); }
    if (p.xb !== null) { x1 = Math.max(x1, p.xb); y1 = Math.max(y1, p.yb); y0 = Math.min(y0, p.yb); }
    if (x1 - x0 < 1e-6) { x0 = -Math.max(1, (y1 - y0) * 0.4); x1 = -x0; }
    const pad = 14, izq = 44, abajo = 24;
    const ancho = (x1 - x0) * 1.06, alto = (y1 - y0) * 1.12 || 1;
    const hPide = alto * ((c.clientWidth - izq - pad) / ancho) + pad + abajo;
    c.style.height = Math.round(Math.max(190, Math.min(hPide, 420, innerHeight * 0.7))) + 'px';
    const { g, w, h: H } = lienzo(c);
    const s = Math.min((w - izq - pad) / ancho, (H - pad - abajo) / alto);
    const ox = izq + ((w - izq - pad) - (x1 - x0) * s) / 2 - x0 * s, oy = H - abajo - ((H - pad - abajo) - (y1 - y0) * 1.06 * s) / 2 + y0 * s;
    const X = (x) => ox + x * s, Y = (y) => oy - y * s;
    const etiqueta = (t, x, y, alinea, base, color) => {
      g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; const an = g.measureText(t).width;
      if (alinea === 'center') x = Math.max(an / 2 + 2, Math.min(w - an / 2 - 2, x));
      const xi = alinea === 'center' ? x - an / 2 : alinea === 'right' ? x - an : x, yi = base === 'bottom' ? y - 14 : y;
      g.fillStyle = col['--bg']; g.globalAlpha = 0.85; g.fillRect(xi - 3, yi - 1, an + 6, 16); g.globalAlpha = 1;
      g.fillStyle = color || col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(t, xi, yi + 1);
    };
    g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    const st_ = paso(Math.max(x1 - x0, y1 - y0), 6);
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let x = Math.ceil(x0 / st_) * st_; x <= x1 * 1.04; x += st_) { g.beginPath(); g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y0) + 4); g.stroke(); g.fillText(txt(f(x, 2)), X(x), Y(y0) + 6); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let y = Math.ceil(y0 / st_) * st_; y <= y1 * 1.04 + 1e-9; y += st_) { g.beginPath(); g.moveTo(X(x0) - 10, Y(y)); g.lineTo(w - pad, Y(y)); g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1; g.fillText(txt(f(y, 2)), izq - 14, Y(y)); }
    g.textAlign = 'left'; g.fillText('m', 4, pad);
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
    const linea = (Q, hasta) => { g.beginPath(); let k = 0; for (const q of Q) { if (hasta !== undefined && q.t > hasta) break; k++ ? g.lineTo(X(q.x), Y(q.y)) : g.moveTo(X(q.x), Y(q.y)); } if (hasta !== undefined) g.lineTo(X(e.x), Y(e.y)); g.stroke(); };
    if (I.length) { g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.setLineDash([5, 4]); linea(I); g.setLineDash([]); }
    if (E.length) { g.strokeStyle = col['--c-a']; g.lineWidth = 1.4; g.setLineDash([6, 4]); linea(E); g.setLineDash([]); }
    for (const u of F) {
      g.strokeStyle = u.optimo ? col['--c-y'] : col['--muted']; g.lineWidth = u.optimo ? 1.8 : 1; g.globalAlpha = u.optimo ? 1 : 0.7; linea(u.puntos); g.globalAlpha = 1;
      const cima = u.puntos.reduce((m, q) => (q.y > m.y ? q : m), u.puntos[0]);
      g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = u.optimo ? col['--c-y'] : col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillText(`${txt(f(u.ang, 2))}°`, X(cima.x), Y(cima.y) - 3);
    }
    g.strokeStyle = col['--line']; g.lineWidth = 1.5; linea(P);
    g.strokeStyle = col['--accent']; g.lineWidth = 2.2; linea(P, e.t);
    const r = sol.res;
    if (r.tc > 0 && !F.length) {
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
    $('#leyenda').innerHTML = series.map((s) => `<span><i style="background:var(${s.col})"></i>${s.nom}</span>`).join('') + (I ? '<span>· a trazos en el dibujo: sin rozamiento</span>' : '') + (tray.familia ? '<span>· a trazos en el dibujo: parábola de seguridad; en verde, el tiro de alcance máximo</span>' : '');
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
    const B = rec.b;
    puntosR = Array.from({ length: 301 }, (_, i) => { const tt = (rec.T * i) / 300; return { t: tt, x: rec.x(tt), v: rec.v(tt), a: rec.p.a, ...(B ? { xb: rec.xB(tt), vb: rec.vB(tt), ab: B.a } : {}) }; });
    tr = Math.min(tr, rec.T);
    const r = rec.res, filas = [['Tipo', r.tipo]];
    if (r.tParada !== undefined) filas.push(['Se para en', `t = ${f(r.tParada)} s, x = ${f(r.xParada)} m`]);
    if (r.xEnT !== undefined) filas.push([`En t = ${f(rec.p.tq)} s`, `x = ${f(r.xEnT)} m, v = ${f(r.vEnT)} m/s`]);
    if (r.tEnX) filas.push([`Pasa por x = ${f(rec.p.xq)} m`, r.tEnX.length ? r.tEnX.map((x) => `t = ${f(x)} s`).join(' y ') : 'nunca']);
    if (r.encuentros) filas.push(['A y B se encuentran', r.encuentros.length ? r.encuentros.map((e) => `t = ${f(e.t)} s, x = ${f(e.x)} m`).join(' y ') : 'nunca']);
    $('#resumen-r').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos-r').innerHTML = rec.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibujaR();
  }
  function dibujaR() {
    if (!rec) { for (const id of ['#pista', '#g-x', '#g-v', '#g-a']) lienzo($(id)); $('#lectura-r').textContent = ''; return; }
    if ($('#panel-recta').hidden) return;
    const { g, w, h } = lienzo($('#pista'));
    const B = rec.b, xs = puntosR.flatMap((q) => (B ? [q.x, q.xb] : [q.x]));
    let lo = Math.min(...xs), hi = Math.max(...xs);
    if (rec.p.xq !== null) { lo = Math.min(lo, rec.p.xq); hi = Math.max(hi, rec.p.xq); }
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const l = 24, r = 24, X = (x) => l + ((x - lo) / (hi - lo)) * (w - l - r), yb = h * 0.62;
    g.strokeStyle = col['--muted']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(8, yb); g.lineTo(w - 8, yb); g.stroke();
    g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineWidth = 1;
    const sp = paso(hi - lo, 6);
    for (let x = Math.ceil(lo / sp) * sp; x <= hi + 1e-9; x += sp) { g.beginPath(); g.moveTo(X(x), yb - 4); g.lineTo(X(x), yb + 4); g.stroke(); g.fillText(txt(f(x, 2)), X(x), yb + 7); }
    if (rec.p.xq !== null) { g.strokeStyle = col['--blanco']; g.lineWidth = 2; g.beginPath(); g.moveTo(X(rec.p.xq), yb - 16); g.lineTo(X(rec.p.xq), yb + 4); g.stroke(); }
    const x = rec.x(tr), v = rec.v(tr), vmax = Math.max(...puntosR.flatMap((q) => (B ? [Math.abs(q.v), Math.abs(q.vb)] : [Math.abs(q.v)])), 1e-9);
    const movil = (xx, vv, y, relleno, letra) => {
      flecha(g, X(xx), y - 8, X(xx) + (vv / vmax) * 60, y - 8, col['--c-v']);
      g.fillStyle = relleno; g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
      g.beginPath(); g.roundRect ? g.roundRect(X(xx) - 11, y, 22, 12, 3) : g.rect(X(xx) - 11, y, 22, 12); g.fill(); g.stroke();
      if (letra) { g.fillStyle = col['--ink']; g.font = '600 10px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letra, X(xx), y + 6.5); }
    };
    if (B) for (const e of rec.res.encuentros) { g.strokeStyle = col['--c-a']; g.lineWidth = 1.5; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(e.x), 6); g.lineTo(X(e.x), yb); g.stroke(); g.setLineDash([]); }
    movil(x, v, yb - 14, col['--bola'], B ? 'A' : '');
    if (B) movil(rec.xB(tr), rec.vB(tr), yb - 40, col['--c-y'], 'B');
    const conB = (s, k) => (B ? [s, { col: s.col, trazo: [6, 4], v: (q) => q[k] }] : [s]);
    grafica($('#g-x'), puntosR, rec.T, conB({ col: '--c-x', v: (q) => q.x }, 'xb'), tr, B ? 'x (m) · B a trazos' : 'x (m)');
    grafica($('#g-v'), puntosR, rec.T, conB({ col: '--c-v', v: (q) => q.v }, 'vb'), tr, 'v (m/s)');
    grafica($('#g-a'), puntosR, rec.T, conB({ col: '--c-a', v: (q) => q.a }, 'ab'), tr, 'a (m/s²)');
    lee($('#lectura-r'), `t = ${fijo(tr, 2, anchoDe([rec.T], 2))} s · ${B ? 'x<sub>A</sub>' : 'x'} = ${fijo(x, 2, anchoDe(puntosR.map((q) => q.x), 2))} m · v = ${fijo(v, 2, anchoDe(puntosR.map((q) => q.v), 2))} m/s${B ? ` · x<sub>B</sub> = ${fijo(rec.xB(tr), 2, anchoDe(puntosR.map((q) => q.xb), 2))} m` : ''}`);
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

  let cir = null, tc_ = 0, jugandoC = false, ultimoC = 0, puntosC = [];
  const rellenaC = formulario($('#campos-circ'), CAMPOS_C, () => st.c, () => { $('#ejemplos-c').value = ''; calculaC(true); });
  const selC = $('#ejemplos-c');
  selC.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplosCirculo.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  selC.addEventListener('change', () => { if (selC.value) abrirEjemploC(selC.value); });
  function abrirEjemploC(clave) {
    const e = C.ejemplosCirculo.find((x) => x.clave === clave); if (!e) return;
    st.c = { ...BASE_C, ...e.sc }; rellenaC(); selC.value = clave; pestana('circ'); calculaC(true); paraC(); tc_ = 0; dibujaC();
  }
  function calculaC(guardar) {
    const err = $('#error-c');
    try { cir = C.circular(st.c); } catch (e) { err.textContent = e.message; err.hidden = false; cir = null; dibujaC(); return; }
    err.hidden = true;
    if (guardar) guarda();
    const al = cir.p.al;
    puntosC = Array.from({ length: 301 }, (_, i) => { const tt = (cir.T * i) / 300; return { t: tt, th: cir.th(tt), w: cir.w(tt), al }; });
    tc_ = Math.min(tc_, cir.T);
    const r = cir.res, filas = [['Tipo', r.tipo], ['Velocidad angular inicial', f(r.w0) + ' rad/s'], ['Velocidad lineal inicial', f(r.v0) + ' m/s']];
    if (r.periodo !== undefined) filas.push(['Periodo', f(r.periodo) + ' s'], ['Frecuencia', f(r.frec) + ' Hz'], ['Aceleración centrípeta', f(r.ac) + ' m/s²']);
    if (r.at !== undefined) filas.push(['Aceleración tangencial', f(r.at) + ' m/s²']);
    if (r.tParada !== undefined) filas.push(['Se para en', `t = ${f(r.tParada)} s, tras ${f(r.vueltasParada)} vueltas`]);
    if (r.tVueltas !== undefined) filas.push([`Da ${f(cir.p.nv)} vueltas en`, r.tVueltas === null ? 'nunca' : `t = ${f(r.tVueltas)} s`]);
    if (r.wEnT !== undefined) filas.push([`En t = ${f(cir.p.tq)} s`, `ω = ${f(r.wEnT)} rad/s, |a| = ${f(r.aEnT)} m/s²`]);
    $('#resumen-c').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos-c').innerHTML = cir.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibujaC();
  }
  function dibujaC() {
    if (!cir) { for (const id of ['#rueda', '#g-th', '#g-w']) lienzo($(id)); $('#lectura-c').textContent = ''; return; }
    if ($('#panel-circ').hidden) return;
    const { g, w, h } = lienzo($('#rueda'));
    const R = cir.p.R, rp = Math.min(w, h) / 2 - 34, cx = w / 2, cy = h / 2;
    const th = cir.th(tc_), om = cir.w(tc_), al = cir.p.al;
    g.strokeStyle = col['--line']; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, rp, 0, 2 * Math.PI); g.stroke();
    g.fillStyle = col['--muted']; g.beginPath(); g.arc(cx, cy, 3, 0, 2 * Math.PI); g.fill();
    const vueltas = Math.abs(th) / (2 * Math.PI), resto = (Math.abs(th) % (2 * Math.PI)) * Math.sign(th);
    g.strokeStyle = col['--accent']; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rp, 0, -resto, resto > 0); g.stroke();
    const px = cx + rp * Math.cos(th), py = cy - rp * Math.sin(th);
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(cx, cy); g.lineTo(px, py); g.stroke(); g.setLineDash([]);
    const ut = [-Math.sin(th), -Math.cos(th)], un = [cx - px, cy - py].map((u) => u / rp);
    const vmax = Math.max(...puntosC.map((q) => Math.abs(q.w)), 1e-9) * R, v = om * R;
    const an = om * om * R, at = al * R, amax = Math.max(...puntosC.map((q) => Math.hypot(q.w * q.w * R, al * R)), 1e-9);
    const L = Math.min(70, rp * 0.6);
    flecha(g, px, py, px + ut[0] * (v / vmax) * L, py + ut[1] * (v / vmax) * L, col['--c-v']);
    flecha(g, px, py, px + un[0] * (an / amax) * L, py + un[1] * (an / amax) * L, col['--c-a']);
    if (al) flecha(g, px, py, px + ut[0] * (at / amax) * L, py + ut[1] * (at / amax) * L, col['--c-y']);
    g.fillStyle = col['--bola']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.arc(px, py, 7, 0, 2 * Math.PI); g.fill(); g.stroke();
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(`R = ${txt(f(R))} m`, 8, 8); g.fillText(`${txt(f(vueltas, 2))} vueltas`, 8, 26);
    grafica($('#g-th'), puntosC, cir.T, [{ col: '--c-x', v: (q) => q.th }], tc_, 'θ (rad)');
    grafica($('#g-w'), puntosC, cir.T, [{ col: '--c-v', v: (q) => q.w }], tc_, 'ω (rad/s)');
    $('#leyenda-c').innerHTML = `<span><i style="background:var(--c-v)"></i>velocidad v</span><span><i style="background:var(--c-a)"></i>aceleración normal a<sub>n</sub></span>${al ? '<span><i style="background:var(--c-y)"></i>aceleración tangencial a<sub>t</sub></span>' : ''}`;
    lee($('#lectura-c'), `t = ${fijo(tc_, 3, anchoDe([cir.T], 3))} s · θ = ${fijo(th, 2, anchoDe(puntosC.map((q) => q.th), 2))} rad · ω = ${fijo(om, 2, anchoDe(puntosC.map((q) => q.w), 2))} rad/s · v = ${fijo(v, 2, anchoDe(puntosC.map((q) => q.w * R), 2))} m/s`);
    $('#tiempo-c').value = String(Math.round((tc_ / cir.T) * 1000));
  }
  function paraC() { jugandoC = false; $('#play-c').textContent = '▶ Girar'; }
  function bucleC(ahora) {
    if (!jugandoC || !cir) return;
    tc_ += Math.min(0.05, (ahora - ultimoC) / 1000) * (cir.T / 6); ultimoC = ahora;
    if (tc_ >= cir.T) { tc_ = cir.T; dibujaC(); paraC(); return; }
    dibujaC(); requestAnimationFrame(bucleC);
  }
  $('#play-c').addEventListener('click', () => {
    if (jugandoC) { paraC(); return; }
    if (!cir) return;
    if (tc_ >= cir.T) tc_ = 0;
    jugandoC = true; $('#play-c').textContent = '❚❚ Pausa'; ultimoC = performance.now(); requestAnimationFrame(bucleC);
  });
  $('#reinicio-c').addEventListener('click', () => { paraC(); tc_ = 0; dibujaC(); });
  $('#tiempo-c').addEventListener('input', (e) => { if (!cir) return; paraC(); tc_ = (+e.target.value / 1000) * cir.T; dibujaC(); });

  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)];
    const tipos = [
      () => ['tiro', { ...BASE, v0: String(ent(10, 30)), ang: String(de([30, 37, 45, 53, 60])), y0: '0', g: '9.8' }],
      () => ['tiro', { ...BASE, v0: String(ent(5, 20)), ang: '0', y0: String(ent(10, 60)), g: '9.8' }],
      () => ['tiro', { ...BASE, v0: String(ent(15, 30)), ang: String(de([20, 30, 37, 45])), y0: String(ent(5, 40)), g: '9.8' }],
      () => ['tiro', { ...BASE, v0: String(ent(20, 35)), ang: String(de([30, 37, 45])), y0: '0', g: '9.8', xb: String(ent(25, 60)), yb: String(ent(0, 8)) }],
      () => ['recta', { ...BASE_R, x0: '0', v0: String(ent(15, 30)), a: '-' + ent(2, 6) }],
      () => ['recta', { ...BASE_R, x0: '0', v0: String(ent(10, 25)), a: '0', x0b: '0', v0b: '0', ab: String(ent(2, 5)) }],
      () => ['recta', { ...BASE_R, x0: '0', v0: String(ent(10, 25)), a: '0', x0b: String(ent(3, 10) * 100), v0b: '-' + ent(10, 30), ab: '0' }],
      () => ['circ', { ...BASE_C, R: String(de([0.2, 0.5, 2, 5])).replace('.', ','), dato: 'rpm', val: String(de([30, 60, 120, 300, 600])), alfa: '0' }],
      () => ['circ', { ...BASE_C, R: String(de([0.2, 0.3, 0.5])).replace('.', ','), dato: 'w', val: String(ent(10, 40)), alfa: '-' + ent(1, 5), tq: String(ent(1, 4)) }],
    ];
    const [tab, d] = de(tipos)();
    if (tab === 'tiro') { st.sc = d; rellena(); sel.value = ''; pestana('tiro'); calculaT(true); }
    else if (tab === 'recta') { st.r = d; rellenaR(); selR.value = ''; pestana('recta'); calculaR(true); }
    else { st.c = d; rellenaC(); selC.value = ''; pestana('circ'); calculaC(true); }
  }
  const enunciado = () => {
    const e = (x) => Herramienta.esc(String(x).replace('.', ',')), d = st.tab === 'tiro' ? st.sc : st.tab === 'recta' ? st.r : st.c;
    if (st.tab === 'tiro') {
      const desde = +d.y0 ? `desde ${e(d.y0)} m de altura` : 'desde el suelo';
      const como = +d.ang ? `con una velocidad de ${e(d.v0)} m/s a ${e(d.ang)}° sobre la horizontal` : `horizontalmente a ${e(d.v0)} m/s`;
      return `Se lanza un proyectil ${desde} ${como}, sin rozamiento (g = ${e(d.g)} m/s²). Calcula el tiempo de vuelo, la altura máxima, el alcance, la velocidad al llegar al suelo y el alcance máximo que se lograría con la misma velocidad${d.xb ? `. Hay un blanco en (${e(d.xb)}, ${e(d.yb || 0)}) m: ¿con qué ángulos se acierta y qué velocidad haría falta con el ángulo dado?` : ''}.`;
    }
    if (st.tab === 'recta') {
      if (d.x0b !== '') return +d.x0b ? `Dos trenes van por la misma vía, uno hacia el otro: A sale de x = 0 a ${e(d.v0)} m/s y B de x = ${e(d.x0b)} m a ${e(String(d.v0b).replace('-', ''))} m/s. ¿Cuándo y dónde se cruzan?`
        : `Un coche pasa a ${e(d.v0)} m/s junto a una moto parada, que en ese instante arranca con una aceleración de ${e(d.ab)} m/s². ¿Cuándo y dónde lo alcanza?`;
      return `Un coche que va a ${e(d.v0)} m/s frena con una aceleración de ${e(d.a)} m/s². ¿Cuánto tarda en pararse y qué distancia recorre?`;
    }
    if (+d.alfa) return `Una rueda de ${e(d.R)} m de radio gira a ${e(d.val)} rad/s y frena con una aceleración angular de ${e(d.alfa)} rad/s². Calcula la aceleración tangencial, cuándo se para y cuántas vueltas da, y su velocidad angular y aceleración total a los ${e(d.tq)} s.`;
    return `Un punto a ${e(d.R)} m del eje gira a ${e(d.val)} rpm. Calcula su velocidad angular y lineal, el periodo, la frecuencia y la aceleración centrípeta.`;
  };

  addEventListener('resize', () => { dibujaT(); dibujaR(); dibujaC(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibujaT(); dibujaR(); dibujaC(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('tiro-parabolico').current;
  colores(); rellena(); rellenaR(); rellenaC(); calculaT(false); calculaR(false); calculaC(false); pestana(st.tab);
  Constantes.monta(document.querySelector('.layout .card'));
  window.TiroApp = {
    abrirEjemplo, abrirEjemploR, abrirEjemploC, pestana, azar, enunciado, sol: () => sol, rec: () => rec, cir: () => cir,
    ir: (tt) => { paraT(); if (tray) t = Math.max(0, Math.min(tray.tv, tt)); dibujaT(); }, fin: () => (tray ? tray.tv : 0),
  };
})();

