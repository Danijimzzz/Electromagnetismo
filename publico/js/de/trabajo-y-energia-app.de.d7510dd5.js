(() => {
  const { $ } = Herramienta;
  const CLAVE = 'energia-v1';
  const MODOS = { rampa: 'Rampe und Feder', rizo: 'Looping', pendulo: 'Pendel', montana: 'Achterbahn', fuerza: 'Veränderliche Kraft' };
  const CAMPOS_DE = {
    rizo: [{ sep: 'Wagen' }, { k: 'm', nom: 'Masse', u: 'kg' }, { k: 'v0', nom: 'Anfangsgeschwindigkeit', u: 'm/s' }, { k: 'g', nom: 'Erdbeschleunigung', u: 'm/s²' }, { sep: 'Strecke' }, { k: 'h', nom: 'Starthöhe', u: 'm' }, { k: 'R', nom: 'Radius des Loopings', u: 'm' }],
    pendulo: [{ k: 'm', nom: 'Masse', u: 'kg' }, { k: 'L', nom: 'Länge des Fadens', u: 'm' }, { k: 'th0', nom: 'Anfangswinkel θ₀', u: '°' }, { k: 'v0', nom: 'Oder Geschwindigkeit unten', u: 'm/s' }, { k: 'th', nom: 'Gesuchter Winkel θ', u: '°' }, { k: 'g', nom: 'Erdbeschleunigung', u: 'm/s²' }],
    montana: [{ k: 'm', nom: 'Masse', u: 'kg' }, { k: 'alturas', nom: 'Höhen der Punkte', u: 'm', texto: true }, { k: 'sep', nom: 'Abstand zwischen den Punkten', u: 'm' }, { k: 'v0', nom: 'Geschwindigkeit im ersten', u: 'm/s' }, { k: 'g', nom: 'Erdbeschleunigung', u: 'm/s²' }],
    fuerza: [{ k: 'puntos', nom: 'Punkte (x F; x F…)', u: 'm, N', texto: true }, { k: 'm', nom: 'Masse', u: 'kg' }, { k: 'v0', nom: 'Anfangsgeschwindigkeit', u: 'm/s' }, { k: 't', nom: 'Benötigte Zeit', u: 's' }],
  };
  const NOTAS = {
    rampa: 'Aus der gewünschten Stauchung wird die Federkonstante berechnet, die sie bewirkt.',
    rizo: 'Ohne Reibung. Die Höhe wird vom tiefsten Punkt des Loopings aus gemessen.',
    pendulo: 'Gib den Winkel an, aus dem er losgelassen wird, oder die Geschwindigkeit am tiefsten Punkt.',
    montana: 'Ohne Reibung. Schreibe die Höhen durch Semikolon getrennt: 30; 8; 22.',
    fuerza: 'Der Graph F(x) besteht aus geraden Abschnitten zwischen den Punkten. Masse, Anfangsgeschwindigkeit und Zeit sind optional.',
  };
  const CAMPOS_RAMPA = [
    { sep: 'Block' },
    { k: 'm', nom: 'Masse', u: 'kg' },
    { k: 'v0', nom: 'Anfangsgeschwindigkeit', u: 'm/s' },
    { k: 'g', nom: 'Erdbeschleunigung', u: 'm/s²' },
    { sep: 'Rampe' },
    { k: 'h', nom: 'Höhe', u: 'm' },
    { k: 'ang', nom: 'Winkel', u: '°' },
    { k: 'mu1', nom: 'Reibung μ₁', u: '' },
    { sep: 'Horizontales Stück und Feder' },
    { k: 'd', nom: 'Länge des Stücks', u: 'm' },
    { k: 'mu2', nom: 'Reibung μ₂', u: '' },
    { k: 'k', nom: 'Federkonstante', u: 'N/m' },
    { k: 'xobj', nom: 'Gewünschte Stauchung', u: 'm' },
  ];
  const camposDe = (m) => CAMPOS_DE[m] || CAMPOS_RAMPA;
  const modo = () => esc.modo || 'rampa';
  const ENERGIAS = [
    { k: 'K', nom: 'Kinetisch', col: '--e-k' },
    { k: 'Ug', nom: 'Gravitation', col: '--e-g' },
    { k: 'Ue', nom: 'Elastisch', col: '--e-e' },
    { k: 'Q', nom: 'Wärme', col: '--e-q' },
  ];

  let esc = { ...Energia.ejemplos[0].sc };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') esc = g.modo && g.modo !== 'rampa' ? g : { ...esc, ...g }; } catch (e) {}
  let sim = null, sol = null, t = 0, jugando = false, ultimo = 0;
  const fijo = (x, d, ancho = 0) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('.', ',').replace('-', '−').padStart(ancho, ' ');
  const lee = (el, texto) => { el.innerHTML = texto.split(' · ').map((x) => `<span>${x}</span>`).join(' · '); };
  const anchoDe = (vals, d) => Math.max(...vals.map((v) => fijo(v, d).length));
  let anchos = null; // anchos de la lectura para la simulación actual
  let col = {};

  const campos = $('#campos');
  function formulario() {
    campos.innerHTML = camposDe(modo()).map((c) => (c.sep ? `<div class="sep">${c.sep}</div>` : `<label for="c-${c.k}">${c.nom}${c.u ? ` <small>(${c.u})</small>` : ''}</label><input id="c-${c.k}" class="in${c.texto ? ' ancho-texto' : ''}" ${c.texto ? '' : 'inputmode="decimal" '}autocomplete="off">`)).join('');
    for (const b of document.querySelectorAll('#modos button')) b.setAttribute('aria-selected', String(b.dataset.m === modo()));
    $('#nota').textContent = NOTAS[modo()];
    const fz = modo() === 'fuerza';
    for (const q of ['.controles', '#barras', '#grafica']) $(q).hidden = fz;
  }
  const rellena = () => { formulario(); for (const c of camposDe(modo())) if (c.k) $('#c-' + c.k).value = String(esc[c.k] ?? '').replace(/(\d)\.(\d)/g, '$1,$2'); };
  $('#modos').innerHTML = Object.entries(MODOS).map(([k, t]) => `<button type="button" role="tab" data-m="${k}">${t}</button>`).join('');
  $('#modos').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.dataset.m === modo()) return;
    const ej = Energia.ejemplos.find((x) => (x.sc.modo || 'rampa') === b.dataset.m);
    esc = { ...ej.sc }; rellena(); $('#ejemplos').value = ''; calcula(true);
  });
  campos.addEventListener('input', (e) => {
    const k = e.target.id.slice(2);
    esc[k] = e.target.value;
    $('#ejemplos').value = '';
    calcula(true);
  });
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Beispiele…</option>' + Object.entries(MODOS).map(([k, t]) => `<optgroup label="${t}">${Energia.ejemplos.filter((e) => (e.sc.modo || 'rampa') === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = Energia.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    esc = { ...e.sc }; rellena(); sel.value = clave; calcula(true);
  }

  function calcula(guardar) {
    const err = $('#error');
    try {
      sol = Energia.resolver(esc);
      sim = sol.sim !== undefined ? sol.sim : Energia.simular(esc, 20);
    } catch (e) {
      err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = '';
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
    const mo = modo();
    if (mo !== 'fuerza') filas.push(['E₀', f(sol.Ei) + ' J']);
    if (mo === 'rizo') {
      filas.push(['v unten', f(r.vAbajo) + ' m/s'], ['Mindesthöhe', f(r.hmin) + ' m']);
      if (r.completa) filas.push(['v oben', f(r.vArriba) + ' m/s'], ['Normalkraft oben', f(r.Narriba) + ' N']);
      else if (r.ydesp !== undefined) filas.push(['Löst sich bei', f(r.ydesp) + ' m Höhe']);
      else filas.push(['Steigt bis', f(r.ymax) + ' m und rollt zurück']);
    } else if (mo === 'pendulo') {
      filas.push(['v unten', f(r.vAbajo) + ' m/s'], ['Spannung unten', f(r.Tabajo) + ' N']);
      if (r.vEn !== undefined) filas.push(['v bei θ', f(r.vEn) + ' m/s'], ['Spannung bei θ', f(r.TEn) + ' N']);
      if (r.vuelta) filas.push(['v oben', f(r.vArriba) + ' m/s']);
      if (r.angAfloja !== undefined) filas.push(['Der Faden erschlafft bei', f(r.angAfloja) + '° von unten']);
    } else if (mo === 'montana') {
      r.v.forEach((v, i) => filas.push([`v im Punkt ${i + 2}`, f(v) + ' m/s']));
      if (r.llega < sim.p.hs.length) filas.push(['Erreicht den Punkt nicht', String(r.llega + 1)]);
    } else if (mo === 'fuerza') {
      filas.push(['Arbeit', f(r.W) + ' J']);
      if (r.v !== undefined) filas.push(['Endgeschwindigkeit', r.v === null ? 'bleibt vorher stehen' : f(r.v) + ' m/s']);
      if (r.Pmedia !== undefined) filas.push(['Mittlere Leistung', f(r.Pmedia) + ' W']);
      if (r.Pfin !== undefined) filas.push(['Leistung am Ende', f(r.Pfin) + ' W']);
    }
    if (r.hmin !== undefined && mo === 'rampa') filas.push(['Mindesthöhe, um die Feder zu erreichen', f(r.hmin) + ' m']);
    if (r.kPara !== undefined && r.kPara > 0) filas.push(['k für diese Stauchung', f(r.kPara) + ' N/m']);
    if (r.quieto) filas.push(['Bewegung', 'fährt nicht an']);
    if (r.vB !== undefined) filas.push(['v am Fuß der Rampe', f(r.vB) + ' m/s']);
    if (r.paraRampa !== undefined) filas.push(['Bleibt auf der Rampe stehen nach', f(r.paraRampa) + ' m']);
    if (r.paraLlano !== undefined) filas.push(['Bleibt auf der Ebene stehen nach', f(r.paraLlano) + ' m']);
    if (r.vC !== undefined) filas.push(['v beim Erreichen der Feder', f(r.vC) + ' m/s']);
    if (r.x !== undefined) filas.push(['Maximale Stauchung', f(r.x) + ' m'], ['Maximale Federkraft', f(r.Fmax) + ' N']);
    $('#resumen').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
  }

  function enT(tt) {
    const P = sim.puntos;
    if (tt <= P[0].t) return P[0];
    if (tt >= P[P.length - 1].t) return P[P.length - 1];
    let lo = 0, hi = P.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P[mid].t <= tt) lo = mid; else hi = mid; }
    const a = P[lo], b = P[hi], u = b.t > a.t ? (tt - a.t) / (b.t - a.t) : 0;
    const o = { t: tt };
    for (const k of ['s', 'v', 'K', 'Ug', 'Ue', 'Q', 'x', 'px', 'py']) o[k] = a[k] + (b[k] - a[k]) * u;
    o.libre = b.libre;
    return o;
  }
  const tFin = () => (sim ? sim.puntos[sim.puntos.length - 1].t : 0);

  function colores() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--suelo', '--bloque', '--e-k', '--e-g', '--e-e', '--e-q']) col[k] = cs.getPropertyValue(k).trim();
  }
  const lienzo = (c) => Herramienta.lienzo(c);

  function bola(g, x, y, r, dx, dy, v, vmax) {
    g.fillStyle = col['--bloque']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); g.stroke();
    if (Math.abs(v) > 1e-3 && (dx || dy)) {
      const L = Math.hypot(dx, dy), lon = (Math.abs(v) / Math.max(vmax, 1e-9)) * 50 + 8, ux = dx / L, uy = dy / L;
      g.strokeStyle = col['--e-k']; g.fillStyle = col['--e-k']; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + ux * lon, y + uy * lon); g.stroke();
      g.beginPath(); g.moveTo(x + ux * (lon + 8), y + uy * (lon + 8)); g.lineTo(x + ux * lon - uy * 5, y + uy * lon + ux * 5); g.lineTo(x + ux * lon + uy * 5, y + uy * lon - ux * 5); g.closePath(); g.fill();
    }
  }
  function rumbo(e) {
    const P = sim.puntos; let i = 0; while (i < P.length - 1 && P[i].t < e.t) i++;
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, Math.max(i, 1))];
    return [b.px - a.px, b.py - a.py];
  }
  function cotas(g, t, x, y, al = 'left') { g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function dibujaRizo(e) {
    const { g, w, h: H } = lienzo($('#lienzo')), p = sim.p, pad = 20;
    const ancho = p.xc + p.R * 2.6, alto = Math.max(p.h, 2 * p.R) * 1.08, sx = Math.min((w - 2 * pad) / ancho, (H - 2 * pad) / alto);
    const X = (x) => pad + x * sx, Y = (y) => H - pad - y * sx;
    g.strokeStyle = col['--suelo']; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(X(0), Y(p.h)); g.lineTo(X(p.Lx), Y(0)); g.lineTo(X(ancho), Y(0)); g.stroke();
    g.beginPath(); g.arc(X(p.xc), Y(p.R), p.R * sx, 0, 2 * Math.PI); g.stroke();
    g.setLineDash([4, 4]); g.lineWidth = 1; g.strokeStyle = col['--muted']; const hm = sol.res.hmin; g.beginPath(); g.moveTo(X(0) - 6, Y(hm)); g.lineTo(X(p.Lx * 0.9), Y(hm)); g.stroke(); g.setLineDash([]);
    cotas(g, `h min = ${Energia.f(hm)} m`, X(0) + 4, Y(hm) - 9); cotas(g, `R = ${Energia.f(p.R)} m`, X(p.xc), Y(p.R), 'center');
    const vmax = Math.max(...sim.puntos.map((q) => q.v)), [dx, dy] = rumbo(e);
    bola(g, X(e.px ?? 0), Y(e.py ?? p.h) - 9, 9, dx, -dy, e.v, vmax);
  }
  function dibujaPendulo(e) {
    const { g, w, h: H } = lienzo($('#lienzo')), p = sim.p, cx = w / 2, cy = H * 0.45, sx = Math.min(H * 0.42, w * 0.4) / p.L;
    g.strokeStyle = col['--suelo']; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 40, cy); g.lineTo(cx + 40, cy); g.stroke();
    g.setLineDash([4, 4]); g.lineWidth = 1; g.strokeStyle = col['--line']; g.beginPath(); g.arc(cx, cy, p.L * sx, 0, 2 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy + p.L * sx); g.stroke(); g.setLineDash([]);
    const bx = cx + (e.px ?? 0) * sx, by = cy - (e.py ?? -p.L) * sx;
    if (!e.libre) { g.strokeStyle = col['--ink']; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(bx, by); g.stroke(); }
    const vmax = Math.max(...sim.puntos.map((q) => q.v)), [dx, dy] = rumbo(e);
    bola(g, bx, by, 11, dx, -dy, e.v, vmax);
    cotas(g, `L = ${Energia.f(p.L)} m`, cx + 46, cy - 2);
  }
  function dibujaMontana(e) {
    const { g, w, h: H } = lienzo($('#lienzo')), p = sim.p, pad = 22;
    const xmax = p.pt[p.pt.length - 1].x, ymax = Math.max(...p.hs) * 1.1 + 1, sx = (w - 2 * pad) / xmax, sy = Math.min((H - 2 * pad) / ymax, sx * 1.5);
    const X = (x) => pad + x * sx, Y = (y) => H - pad - y * sy;
    g.fillStyle = col['--suelo']; g.beginPath(); g.moveTo(X(0), Y(0)); p.pt.forEach((q) => g.lineTo(X(q.x), Y(q.y))); g.lineTo(X(xmax), Y(0)); g.closePath(); g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1;
    g.strokeStyle = col['--suelo']; g.lineWidth = 4; g.beginPath(); p.pt.forEach((q, i) => (i ? g.lineTo(X(q.x), Y(q.y)) : g.moveTo(X(q.x), Y(q.y)))); g.stroke();
    const hmax = sol.Ei / (p.m * p.g); g.setLineDash([4, 4]); g.lineWidth = 1; g.strokeStyle = col['--e-g']; g.beginPath(); g.moveTo(X(0), Y(hmax)); g.lineTo(X(xmax), Y(hmax)); g.stroke(); g.setLineDash([]);
    cotas(g, `maximal mögliche Höhe ${Energia.f(hmax)} m`, X(xmax), Y(hmax) - 9, 'right');
    p.hs.forEach((hh, i) => cotas(g, String(i + 1), X(i * p.sep), Y(hh) - 14, 'center'));
    const vmax = Math.max(...sim.puntos.map((q) => q.v)), [dx, dy] = rumbo(e);
    bola(g, X(e.px ?? 0), Y(e.py ?? p.hs[0]) - 8, 8, dx * sx, -dy * sy, e.v, vmax);
  }
  function dibujaFuerza() {
    const { g, w, h: H } = lienzo($('#lienzo')), P = sol.p.pares, l = 48, r = 14, top = 14, b = 28;
    const x0 = Math.min(0, P[0][0]), x1 = P[P.length - 1][0], Fs = P.map((q) => q[1]), Fmin = Math.min(0, ...Fs), Fmax = Math.max(0, ...Fs), dF = Fmax - Fmin || 1;
    const X = (x) => l + ((x - x0) / (x1 - x0)) * (w - l - r), Y = (F) => H - b - ((F - Fmin) / dF) * (H - top - b);
    for (let i = 1; i < P.length; i++) {
      const [xa, Fa] = P[i - 1], [xb, Fb] = P[i];
      const corta = Fa * Fb < 0 ? xa + ((xb - xa) * Fa) / (Fa - Fb) : null;
      const trozos = corta === null ? [[xa, Fa, xb, Fb]] : [[xa, Fa, corta, 0], [corta, 0, xb, Fb]];
      for (const [u1, F1, u2, F2] of trozos) { g.fillStyle = F1 + F2 >= 0 ? col['--e-g'] : col['--e-e']; g.globalAlpha = 0.28; g.beginPath(); g.moveTo(X(u1), Y(0)); g.lineTo(X(u1), Y(F1)); g.lineTo(X(u2), Y(F2)); g.lineTo(X(u2), Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1; }
    }
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = col['--muted'];
    for (const v of Herramienta.marcas(Fmin, Fmax, 5)) { g.beginPath(); g.moveTo(l, Y(v)); g.lineTo(w - r, Y(v)); g.stroke(); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(Energia.f(v, 2), l - 4, Y(v)); }
    for (const v of Herramienta.marcas(x0, x1, 6)) { g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(Energia.f(v, 2), X(v), H - b + 6); }
    g.strokeStyle = col['--ink']; g.beginPath(); g.moveTo(l, Y(0)); g.lineTo(w - r, Y(0)); g.stroke();
    g.strokeStyle = col['--e-k']; g.lineWidth = 2.2; g.beginPath(); P.forEach(([x, F], i) => (i ? g.lineTo(X(x), Y(F)) : g.moveTo(X(x), Y(F)))); g.stroke();
    g.fillStyle = col['--e-k']; for (const [x, F] of P) { g.beginPath(); g.arc(X(x), Y(F), 3.5, 0, 2 * Math.PI); g.fill(); }
    cotas(g, 'F (N)', l + 4, top + 2); cotas(g, 'x (m)', w - r, Y(0) - 10, 'right');
    cotas(g, `W = Fläche = ${Herramienta.txt(Energia.f(sol.res.W))} J`, w - r, top + 2, 'right');
  }
  function dibujaEscena(e) {
    if (modo() === 'rizo') return dibujaRizo(e);
    if (modo() === 'pendulo') return dibujaPendulo(e);
    if (modo() === 'montana') return dibujaMontana(e);
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
    g.fillStyle = col['--suelo'];
    g.beginPath(); g.moveTo(X(-bs), Y(0)); g.lineTo(X(-bs), Y(p.h)); g.lineTo(X(0), Y(p.h)); g.lineTo(X(Lx), Y(0)); g.lineTo(X(muro), Y(0)); g.lineTo(X(muro), Y(bs * 1.4)); g.lineTo(X(muro + 0.15 + bs * 0.3), Y(bs * 1.4)); g.lineTo(X(muro + 0.15 + bs * 0.3), Y(-bs * 0.5)); g.lineTo(X(-bs), Y(-bs * 0.5)); g.closePath(); g.fill();
    g.lineWidth = 3; g.lineCap = 'round';
    if (p.mu1 > 0 && p.h > 0) { g.strokeStyle = col['--e-q']; g.beginPath(); g.moveTo(X(0), Y(p.h)); g.lineTo(X(Lx), Y(0)); g.stroke(); }
    if (p.mu2 > 0) { g.strokeStyle = col['--e-q']; g.beginPath(); g.moveTo(X(Lx), Y(0)); g.lineTo(X(muro), Y(0)); g.stroke(); }
    g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    if (p.h > 0) { g.textAlign = 'right'; g.fillText(`h = ${Energia.f(p.h)} m`, X(-bs) - 4, Y(p.h / 2)); }
    g.textAlign = 'center'; g.fillText(`d = ${Energia.f(p.d)} m`, X(Lx + p.d / 2), Y(-bs * 0.25) + 0);
    if (p.h > 0) {
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.arc(X(Lx), Y(0), 26, Math.PI, Math.PI + th); g.stroke();
      g.textAlign = 'right'; g.fillText(`${Energia.f(p.ang)}°`, X(Lx) - 30, Y(0) - 9);
    }
    const comp = Math.min(e.x || 0, l0 * 0.92);
    const xa = Lx + p.d + comp, xb = muro, yb = bs * 0.5, vueltas = 10, amp = bs * 0.28;
    g.strokeStyle = p.k > 0 ? col['--e-e'] : col['--line']; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(X(xa), Y(yb));
    for (let i = 1; i < 2 * vueltas; i++) g.lineTo(X(xa + ((xb - xa) * i) / (2 * vueltas)), Y(yb + (i % 2 ? amp : -amp)));
    g.lineTo(X(xb), Y(yb)); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(X(xa), Y(yb - amp * 1.3)); g.lineTo(X(xa), Y(yb + amp * 1.3)); g.stroke();
    const s = Math.max(0, e.s);
    let px, py, giro;
    if (s < sim.p.L) { px = s * Math.cos(th); py = p.h - s * Math.sin(th); giro = th; } else { px = Lx + (s - sim.p.L); py = 0; giro = 0; }
    g.save(); g.translate(X(px), Y(py)); g.rotate(giro);
    g.fillStyle = col['--bloque']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
    g.beginPath(); g.rect(-bs * sx, -bs * sx, bs * sx, bs * sx); g.fill(); g.stroke();
    g.fillStyle = col['--ink']; g.textAlign = 'center'; g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillText('m', -bs * sx / 2, -bs * sx / 2);
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
    const filas = [...ENERGIAS.map((q) => ({ ...q, v: e[q.k] })), { k: 'T', nom: 'Gesamt', col: '--ink', v: tot }];
    const cont = $('#barras');
    if (cont.children.length !== filas.length) cont.innerHTML = filas.map((q) => `<div class="barra" data-e="${q.k}"><b></b><div class="tubo"><i style="background:var(${q.col})"></i></div><span>${q.nom}</span></div>`).join('');
    filas.forEach((q, i) => {
      const n = cont.children[i];
      n.querySelector('b').textContent = Herramienta.txt(Energia.f(q.v > 1e-6 * tope ? q.v : 0)) + ' J';
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
    for (const u of [0, 0.5, 1]) { g.beginPath(); g.moveTo(l, Y(u * tope)); g.lineTo(w - r, Y(u * tope)); g.stroke(); g.fillText(Herramienta.txt(Energia.f(u * tope, 2)), l - 4, Y(u * tope)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) g.fillText(Herramienta.txt(Energia.f((T * i) / 4, 2)) + ' s', X((T * i) / 4), h - b + 6);
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
    if (modo() === 'fuerza') { if (sol) dibujaFuerza(); return; }
    if (!sim) return;
    const e = enT(t);
    dibujaEscena(e); dibujaBarras(e); dibujaGrafica(e);
    const p = sim.p;
    if (modo() !== 'rampa') { lee($('#lectura'), `t = ${fijo(e.t, 2, 5)} s · v = ${fijo(Math.abs(e.v), 2, 5)} m/s · Höhe = ${fijo((e.Ug || 0) / (p.m * p.g), 2, 5)} m`); $('#tiempo').value = String(Math.round((t / Math.max(tFin(), 1e-9)) * 1000)); return; }
    if (!anchos || anchos.sim !== sim) { const m = sim.puntos; anchos = { sim, t: anchoDe([tFin()], 2), v: anchoDe(m.map((q) => Math.abs(q.v)), 2), x: anchoDe(m.map((q) => q.x || 0), 3) }; }
    const donde = e.s < p.L ? 'auf der Rampe' : e.s <= p.L + p.d ? 'auf der Ebene' : `an der Feder, x = ${fijo(e.x, 3, anchos.x)} m`;
    lee($('#lectura'), `t = ${fijo(e.t, 2, anchos.t)} s · v = ${fijo(Math.abs(e.v), 2, anchos.v)} m/s · ${donde}`);
    $('#tiempo').value = String(Math.round((t / Math.max(tFin(), 1e-9)) * 1000));
  }

  function para() { jugando = false; $('#play').textContent = '▶ Abspielen'; }
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
    jugando = true; $('#play').textContent = '❚❚ Pause'; ultimo = performance.now(); requestAnimationFrame(bucle);
  });
  $('#reinicio').addEventListener('click', () => { para(); t = 0; dibuja(); });
  $('#tiempo').addEventListener('input', (e) => { para(); t = (+e.target.value / 1000) * tFin(); dibuja(); });
  addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipos = [
      () => ({ m: ent(1, 5), g: 9.8, h: ent(2, 8), ang: de([20, 30, 37, 45]), mu1: de([0, 0.1, 0.15, 0.2]), d: ent(2, 6), mu2: de([0.1, 0.2, 0.3]), k: de([100, 200, 300, 500]), v0: 0 }),
      () => ({ modo: 'rizo', m: c(de([0.2, 0.5, 1])), g: '9,8', h: String(ent(3, 12)), R: c(de([1, 1.5, 2])), v0: '' }),
      () => ({ modo: 'pendulo', m: c(de([0.1, 0.2, 0.5])), g: '9,8', L: c(de([0.5, 1, 1.5, 2])), th0: String(de([30, 45, 60, 90])), th: String(de([0, 15, 20, 30])), v0: '' }),
      () => ({ modo: 'montana', m: String(de([300, 400, 500])), g: '9,8', alturas: [ent(25, 35), ent(2, 10), ent(12, 24), ent(0, 8), ent(10, 20)].join('; '), sep: '15', v0: String(ent(0, 4)) }),
      () => ({ modo: 'fuerza', puntos: `0 0; ${ent(1, 3)} ${de([10, 20, 30])}; ${ent(4, 6)} ${de([10, 20, 30])}; ${ent(7, 9)} 0`, m: String(ent(2, 10)), v0: '0', t: String(ent(2, 6)) }),
    ];
    esc = de(tipos)(); rellena(); sel.value = ''; calcula(true);
  }
  const enunciado = () => {
    const e = Herramienta.esc, mo = modo(), g = `(g = ${e(esc.g)} m/s²)`;
    if (mo === 'rizo') return `Ein Wagen von ${e(esc.m)} kg startet aus der Ruhe in ${e(esc.h)} m Höhe und rollt reibungsfrei zu einem Looping mit ${e(esc.R)} m Radius ${g}. Berechne die Geschwindigkeit unten, die Mindesthöhe für den vollen Umlauf und, falls er ihn schafft, die Geschwindigkeit und die Normalkraft oben.`;
    if (mo === 'pendulo') return `Ein Pendel von ${e(esc.L)} m Länge mit einer Masse von ${e(esc.m)} kg wird aus ${e(esc.th0)}° losgelassen ${g}. Berechne die Geschwindigkeit und die Spannung am tiefsten Punkt${esc.th && +esc.th ? ` und bei einem Winkel von ${e(esc.th)}° zur Senkrechten` : ''}.`;
    if (mo === 'montana') return `Ein Wagen von ${e(esc.m)} kg fährt reibungsfrei über eine Achterbahn, die Punkte in ${e(esc.alturas).replace(/;/g, ',')} m Höhe passiert; im ersten hat er ${e(esc.v0)} m/s ${g}. Berechne die Geschwindigkeit in jedem Punkt.`;
    if (mo === 'fuerza') return `Auf einen ruhenden Körper von ${e(esc.m)} kg wirkt eine ortsabhängige Kraft gemäß dem Punktegraphen (x in m, F in N) ${e(esc.puntos)}, und es dauert ${e(esc.t)} s. Berechne die Arbeit, die Endgeschwindigkeit und die mittlere Leistung.`;
    return `Ein Block von ${e(esc.m)} kg gleitet aus ${e(esc.h)} m Höhe eine Rampe mit ${e(esc.ang)}° hinab (μ = ${e(String(esc.mu1).replace('.', ','))}), legt ${e(esc.d)} m Ebene zurück (μ = ${e(String(esc.mu2).replace('.', ','))}) und stößt auf eine Feder mit ${e(esc.k)} N/m ${g}. Berechne die Geschwindigkeit am Fuß der Rampe, beim Erreichen der Feder und die maximale Stauchung.`;
  };

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('trabajo-y-energia').current;
  colores(); rellena(); calcula(true);
  Constantes.monta(document.querySelector('.layout .card'));
  window.EnergiaApp = { escena: () => ({ ...esc }), abrirEjemplo, azar, enunciado, ir: (tt) => { para(); t = Math.max(0, Math.min(tFin(), tt)); dibuja(); }, estado: () => (sim ? enT(t) : null), fin: tFin };
})();

