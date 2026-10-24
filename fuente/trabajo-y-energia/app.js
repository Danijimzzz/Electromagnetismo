/* =====================================================================
   Trabajo y energía: interfaz (datos, animación, barras de energía,
   gráfica E(t) y desarrollo). El cálculo está en fisica.js (Energia).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const CLAVE = 'energia-v1';
  const CAMPOS = [
    { sep: 'Bloque' },
    { k: 'm', nom: 'Masa', u: 'kg' },
    { k: 'v0', nom: 'Velocidad inicial', u: 'm/s' },
    { k: 'g', nom: 'Gravedad', u: 'm/s²' },
    { sep: 'Rampa' },
    { k: 'h', nom: 'Altura', u: 'm' },
    { k: 'ang', nom: 'Ángulo', u: '°' },
    { k: 'mu1', nom: 'Rozamiento μ₁', u: '' },
    { sep: 'Tramo horizontal y muelle' },
    { k: 'd', nom: 'Longitud del tramo', u: 'm' },
    { k: 'mu2', nom: 'Rozamiento μ₂', u: '' },
    { k: 'k', nom: 'Constante del muelle', u: 'N/m' },
  ];
  const ENERGIAS = [
    { k: 'K', nom: 'Cinética', col: '--e-k' },
    { k: 'Ug', nom: 'Gravitatoria', col: '--e-g' },
    { k: 'Ue', nom: 'Elástica', col: '--e-e' },
    { k: 'Q', nom: 'Calor', col: '--e-q' },
  ];

  let esc = { ...Energia.ejemplos[0].sc };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') esc = { ...esc, ...g }; } catch (e) {}
  let sim = null, sol = null, t = 0, jugando = false, ultimo = 0;
  // número con decimales fijos y relleno a la izquierda, para que la lectura no cambie de ancho mientras avanza el tiempo
  const fijo = (x, d, ancho = 0) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('.', ',').replace('-', '−').padStart(ancho, ' ');
  // cada dato en su span: no se parte por dentro, pero la línea puede bajar entera en el móvil
  const lee = (el, texto) => { el.innerHTML = texto.split(' · ').map((x) => `<span>${x}</span>`).join(' · '); };
  const anchoDe = (vals, d) => Math.max(...vals.map((v) => fijo(v, d).length));
  let anchos = null; // anchos de la lectura para la simulación actual
  let col = {};

  /* ---------- Formulario ---------- */
  const campos = $('#campos');
  for (const c of CAMPOS) {
    if (c.sep) { campos.insertAdjacentHTML('beforeend', `<div class="sep">${c.sep}</div>`); continue; }
    campos.insertAdjacentHTML('beforeend', `<label for="c-${c.k}">${c.nom}${c.u ? ` <small>(${c.u})</small>` : ''}</label><input id="c-${c.k}" class="in" inputmode="decimal" autocomplete="off">`);
  }
  const rellena = () => { for (const c of CAMPOS) if (c.k) $('#c-' + c.k).value = String(esc[c.k]).replace('.', ','); };
  campos.addEventListener('input', (e) => {
    const k = e.target.id.slice(2);
    esc[k] = e.target.value;
    $('#ejemplos').value = '';
    calcula(true);
  });
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + Energia.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = Energia.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    esc = { ...e.sc }; rellena(); sel.value = clave; calcula(false);
  }

  /* ---------- Cálculo ---------- */
  function calcula(guardar) {
    const err = $('#error');
    try {
      sol = Energia.resolver(esc);
      sim = Energia.simular(esc, 20);
    } catch (e) {
      err.textContent = e.message; err.hidden = false;
      return;
    }
    err.hidden = true;
    if (guardar) try { localStorage.setItem(CLAVE, JSON.stringify(esc)); } catch (e) {}
    t = 0; para();
    pintaResultados();
    dibuja();
  }

  function pintaResultados() {
    const f = Energia.f, r = sol.res, filas = [];
    filas.push(['E₀', f(sol.Ei) + ' J']);
    if (r.quieto) filas.push(['Movimiento', 'no arranca']);
    if (r.vB !== undefined) filas.push(['v al pie de la rampa', f(r.vB) + ' m/s']);
    if (r.paraRampa !== undefined) filas.push(['Se para en la rampa tras', f(r.paraRampa) + ' m']);
    if (r.paraLlano !== undefined) filas.push(['Se para en el llano tras', f(r.paraLlano) + ' m']);
    if (r.vC !== undefined) filas.push(['v al llegar al muelle', f(r.vC) + ' m/s']);
    if (r.x !== undefined) filas.push(['Compresión máxima', f(r.x) + ' m'], ['Fuerza máxima del muelle', f(r.Fmax) + ' N']);
    $('#resumen').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  /* ---------- Estado en un instante (interpolado) ---------- */
  function enT(tt) {
    const P = sim.puntos;
    if (tt <= P[0].t) return P[0];
    if (tt >= P[P.length - 1].t) return P[P.length - 1];
    let lo = 0, hi = P.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P[mid].t <= tt) lo = mid; else hi = mid; }
    const a = P[lo], b = P[hi], u = b.t > a.t ? (tt - a.t) / (b.t - a.t) : 0;
    const o = { t: tt };
    for (const k of ['s', 'v', 'K', 'Ug', 'Ue', 'Q', 'x']) o[k] = a[k] + (b[k] - a[k]) * u;
    return o;
  }
  const tFin = () => sim.puntos[sim.puntos.length - 1].t;

  /* ---------- Dibujo ---------- */
  function colores() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--suelo', '--bloque', '--e-k', '--e-g', '--e-e', '--e-q']) col[k] = cs.getPropertyValue(k).trim();
  }
  function lienzo(c) {
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  }

  function dibujaEscena(e) {
    const { g, w, h: H } = lienzo($('#lienzo'));
    const p = sim.p, th = (p.ang * Math.PI) / 180;
    const Lx = p.h / Math.tan(th);
    const xm = sol.res.x || 0;
    const l0 = Math.max(0.6, 1.8 * xm, 0.12 * (Lx + p.d));
    const muro = Lx + p.d + l0;
    const ancho = muro * 1.04 + 0.2;
    const bs = Math.min(0.06 * ancho, Math.max(p.h, 0.3) * 0.35);
    const alto = p.h + bs * 1.6;
    const pad = 18, izq = p.h > 0 ? 62 : pad, sx = Math.min((w - izq - pad) / (ancho + bs), (H - 2 * pad) / alto);
    const ox = izq + bs * sx + ((w - izq - pad) - (ancho + bs) * sx) / 2, oy = H - pad - ((H - 2 * pad) - alto * sx) / 2 - 0.1 * bs * sx;
    const X = (x) => ox + x * sx, Y = (y) => oy - y * sx;
    // suelo y rampa
    g.fillStyle = col['--suelo'];
    g.beginPath(); g.moveTo(X(-bs), Y(0)); g.lineTo(X(-bs), Y(p.h)); g.lineTo(X(0), Y(p.h)); g.lineTo(X(Lx), Y(0)); g.lineTo(X(muro), Y(0)); g.lineTo(X(muro), Y(bs * 1.4)); g.lineTo(X(muro + 0.15 + bs * 0.3), Y(bs * 1.4)); g.lineTo(X(muro + 0.15 + bs * 0.3), Y(-bs * 0.5)); g.lineTo(X(-bs), Y(-bs * 0.5)); g.closePath(); g.fill();
    // tramos con rozamiento
    g.lineWidth = 3; g.lineCap = 'round';
    if (p.mu1 > 0 && p.h > 0) { g.strokeStyle = col['--e-q']; g.beginPath(); g.moveTo(X(0), Y(p.h)); g.lineTo(X(Lx), Y(0)); g.stroke(); }
    if (p.mu2 > 0) { g.strokeStyle = col['--e-q']; g.beginPath(); g.moveTo(X(Lx), Y(0)); g.lineTo(X(muro), Y(0)); g.stroke(); }
    // cotas
    g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    if (p.h > 0) { g.textAlign = 'right'; g.fillText(`h = ${Energia.f(p.h)} m`, X(-bs) - 4, Y(p.h / 2)); }
    g.textAlign = 'center'; g.fillText(`d = ${Energia.f(p.d)} m`, X(Lx + p.d / 2), Y(-bs * 0.25) + 0);
    if (p.h > 0) {
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.arc(X(Lx), Y(0), 26, Math.PI, Math.PI + th); g.stroke();
      g.textAlign = 'right'; g.fillText(`${Energia.f(p.ang)}°`, X(Lx) - 30, Y(0) - 9);
    }
    // muelle
    const comp = Math.min(e.x || 0, l0 * 0.92);
    const xa = Lx + p.d + comp, xb = muro, yb = bs * 0.5, vueltas = 10, amp = bs * 0.28;
    g.strokeStyle = p.k > 0 ? col['--e-e'] : col['--line']; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(X(xa), Y(yb));
    for (let i = 1; i < 2 * vueltas; i++) g.lineTo(X(xa + ((xb - xa) * i) / (2 * vueltas)), Y(yb + (i % 2 ? amp : -amp)));
    g.lineTo(X(xb), Y(yb)); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(X(xa), Y(yb - amp * 1.3)); g.lineTo(X(xa), Y(yb + amp * 1.3)); g.stroke();
    // bloque: su esquina inferior delantera está en el punto s del recorrido
    const s = Math.max(0, e.s);
    let px, py, giro;
    if (s < sim.p.L) { px = s * Math.cos(th); py = p.h - s * Math.sin(th); giro = th; } else { px = Lx + (s - sim.p.L); py = 0; giro = 0; }
    g.save(); g.translate(X(px), Y(py)); g.rotate(giro);
    g.fillStyle = col['--bloque']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
    g.beginPath(); g.rect(-bs * sx, -bs * sx, bs * sx, bs * sx); g.fill(); g.stroke();
    g.fillStyle = col['--ink']; g.textAlign = 'center'; g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillText('m', -bs * sx / 2, -bs * sx / 2);
    // flecha de velocidad
    if (Math.abs(e.v) > 1e-3) {
      const vmax = Math.max(...sim.puntos.map((q) => Math.abs(q.v)), 1e-9), lon = (Math.abs(e.v) / vmax) * Math.max(40, bs * sx * 1.6), dir = Math.sign(e.v);
      const y0 = -bs * sx - 10, x0 = -bs * sx / 2;
      g.strokeStyle = col['--e-k']; g.fillStyle = col['--e-k']; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + dir * lon, y0); g.stroke();
      g.beginPath(); g.moveTo(x0 + dir * (lon + 8), y0); g.lineTo(x0 + dir * lon, y0 - 5); g.lineTo(x0 + dir * lon, y0 + 5); g.closePath(); g.fill();
    }
    g.restore();
  }

  function dibujaBarras(e) {
    const tot = e.K + e.Ug + e.Ue + e.Q, tope = Math.max(sim.E0, 1e-9);
    const filas = [...ENERGIAS.map((q) => ({ ...q, v: e[q.k] })), { k: 'T', nom: 'Total', col: '--ink', v: tot }];
    const cont = $('#barras');
    if (cont.children.length !== filas.length) cont.innerHTML = filas.map((q) => `<div class="barra" data-e="${q.k}"><b></b><div class="tubo"><i style="background:var(${q.col})"></i></div><span>${q.nom}</span></div>`).join('');
    filas.forEach((q, i) => {
      const n = cont.children[i];
      n.querySelector('b').textContent = Energia.f(Math.max(0, q.v)) + ' J';
      n.querySelector('i').style.height = `${Math.min(100, (Math.max(0, q.v) / tope) * 100)}%`;
    });
  }

  function dibujaGrafica(e) {
    const { g, w, h } = lienzo($('#grafica'));
    const P = sim.puntos, T = Math.max(tFin(), 1e-9), tope = Math.max(sim.E0, 1e-9);
    const l = 44, r = 10, top = 10, b = 24;
    const X = (tt) => l + (tt / T) * (w - l - r), Y = (v) => h - b - (v / tope) * (h - top - b);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.fillStyle = col['--muted']; g.font = '11px "IBM Plex Mono", monospace';
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const u of [0, 0.5, 1]) { g.beginPath(); g.moveTo(l, Y(u * tope)); g.lineTo(w - r, Y(u * tope)); g.stroke(); g.fillText(Energia.f(u * tope, 2), l - 4, Y(u * tope)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) g.fillText(Energia.f((T * i) / 4, 2) + ' s', X((T * i) / 4), h - b + 6);
    g.lineWidth = 1.8;
    for (const q of ENERGIAS) {
      g.strokeStyle = col[q.col]; g.beginPath();
      P.forEach((p, i) => (i ? g.lineTo(X(p.t), Y(p[q.k])) : g.moveTo(X(p.t), Y(p[q.k]))));
      g.stroke();
    }
    g.strokeStyle = col['--ink']; g.lineWidth = 1; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(X(e.t), top); g.lineTo(X(e.t), h - b); g.stroke(); g.setLineDash([]);
  }

  function dibuja() {
    if (!sim) return;
    const e = enT(t);
    dibujaEscena(e); dibujaBarras(e); dibujaGrafica(e);
    const p = sim.p;
    if (!anchos || anchos.sim !== sim) { const m = sim.puntos; anchos = { sim, t: anchoDe([tFin()], 2), v: anchoDe(m.map((q) => Math.abs(q.v)), 2), x: anchoDe(m.map((q) => q.x || 0), 3) }; }
    const donde = e.s < p.L ? 'en la rampa' : e.s <= p.L + p.d ? 'en el llano' : `en el muelle, x = ${fijo(e.x, 3, anchos.x)} m`;
    lee($('#lectura'), `t = ${fijo(e.t, 2, anchos.t)} s · v = ${fijo(Math.abs(e.v), 2, anchos.v)} m/s · ${donde}`);
    $('#tiempo').value = String(Math.round((t / Math.max(tFin(), 1e-9)) * 1000));
  }

  /* ---------- Reproducción ---------- */
  function para() { jugando = false; $('#play').textContent = '▶ Reproducir'; }
  function bucle(ahora) {
    if (!jugando) return;
    const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
    t += dt * +$('#ritmo').value;
    if (t >= tFin()) { t = tFin(); dibuja(); para(); return; }
    dibuja();
    requestAnimationFrame(bucle);
  }
  $('#play').addEventListener('click', () => {
    if (jugando) { para(); return; }
    if (t >= tFin()) t = 0;
    jugando = true; $('#play').textContent = '❚❚ Pausa'; ultimo = performance.now(); requestAnimationFrame(bucle);
  });
  $('#reinicio').addEventListener('click', () => { para(); t = 0; dibuja(); });
  $('#tiempo').addEventListener('input', (e) => { para(); t = (+e.target.value / 1000) * tFin(); dibuja(); });
  addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('trabajo-y-energia').current;
  colores(); rellena(); calcula(false);
  window.EnergiaApp = { escena: () => ({ ...esc }), abrirEjemplo, ir: (tt) => { para(); t = Math.max(0, Math.min(tFin(), tt)); dibuja(); }, estado: () => enT(t), fin: tFin };
})();
