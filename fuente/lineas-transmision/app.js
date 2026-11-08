/* =====================================================================
   Interfaz de las líneas de transmisión: datos de la línea y de la carga, ejemplos, resultados,
   desarrollo, la carta de Smith dibujada (con el círculo de ROE, el recorrido hacia el
   generador y los puntos de adaptación) y el perfil de la onda estacionaria. El cálculo está
   en lineas-transmision/calculo.js (LineasTransmision) y los ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE]. Expone window.LineasTransmisionApp para
   el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const P = LineasTransmision, f = P.f, CLAVE = 'lineas-transmision-v1', PI = Math.PI;

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  function formulario() {
    $('#campos').innerHTML = '<div class="sep">Línea</div>' + fila('Z0', 'Impedancia característica Z₀', 'Ω') + fila('f', 'Frecuencia', 'MHz') + fila('er', 'Dieléctrico εr') +
      fila('l', 'Longitud de la línea') + elige('lu', 'Unidad de la longitud', [['m', 'metros'], ['lam', 'longitudes de onda (λ)']]) +
      '<div class="sep">Carga ZL = R + jX</div>' + fila('R', 'Resistencia R', 'Ω') + fila('X', 'Reactancia X', 'Ω') +
      '<div class="sep">Pérdidas de la línea (opcional)</div>' + fila('alfa', 'Atenuación α', 'dB/m') + fila('P', 'Potencia incidente en la entrada', 'W') +
      '<div class="sep">Transitorio con el generador (opcional)</div>' + fila('Vg', 'Tensión del generador Vg', 'V') + fila('Rg', 'Resistencia del generador Rg', 'Ω') + fila('tp', 'Duración del pulso (vacío = escalón)', 'ns') + fila('xp', 'Punto que se mira', '% de la línea') +
      '<div class="sep">Doble stub (opcional)</div>' + fila('d1', 'Primer stub a', 'λ de la carga') + elige('sep', 'Separación de los stubs', [['1/8', 'λ/8'], ['3/8', '3λ/8']]);
    $('#nota').textContent = 'Sin atenuación la línea no tiene pérdidas (vacío α). Para el transitorio la carga debe ser resistiva y hace falta Vg. Vacío: X = 0. Se admite coma decimal. X es positiva si la carga es inductiva y negativa si es capacitiva.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName === 'SELECT' && t.dataset.k) { sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); } });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const de = (l) => l[Math.floor(Math.random() * l.length)], c = (x) => String(x).replace('.', ',');
    const Z0 = de([50, 50, 75, 100]), R = de([20, 25, 40, 60, 75, 100, 150]), X = de([-50, -25, 0, 25, 50, 75]);
    const fr = de([100, 200, 300, 500, 900]), er = de([1, 1, 2.25]), lamda = de([0.1, 0.125, 0.2, 0.25, 0.3, 0.375, 0.4]);
    if (R === Z0 && X === 0) return azar();
    sc = { Z0: c(Z0), R: c(R), X: c(X), f: c(fr), er: c(er), l: c(lamda), lu: 'lam', alfa: '', P: '', Vg: '', Rg: '', tp: '', xp: '50', d1: '', sep: '1/8' };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const x = +String(sc.X || 0).replace(',', '.');
    return `Una línea sin pérdidas de ${esc(sc.Z0)} Ω${+String(sc.er).replace(',', '.') === 1 ? '' : ` y εr = ${esc(sc.er)}`} trabaja a ${esc(sc.f)} MHz y termina en una carga ZL = ${esc(sc.R)} ${x < 0 ? '−' : '+'} j${f(Math.abs(x))} Ω. Calcula el coeficiente de reflexión en la carga (módulo y fase), la ROE, la pérdida de retorno, la longitud de onda, la impedancia de entrada a ${esc(sc.l)} ${sc.lu === 'lam' ? 'λ' : 'm'} de la carga y la distancia de la carga al primer máximo de tensión.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = 'num') => `<div class="${cl}"><span>${t}</span>${v}</div>`;
  const cm = (a) => `${f(a.re)} ${a.im < 0 ? '−' : '+'} j${f(Math.abs(a.im))}`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#leyenda2').textContent = ''; $('#bloque-trans').hidden = true; $('#bloque-bw').hidden = true; lectura(); dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = dato('Reflexión en la carga', `|Γ<sub>L</sub>| = ${f(sol.g)}, θ = ${f(sol.th * 180 / PI)}°`) + dato('Relación de onda estacionaria', `ROE = ${f(sol.roe)}`) +
      dato('Pérdida de retorno', `RL = ${f(sol.rl)} dB`) + dato('Potencia reflejada', `${f(sol.pRef)} %`) + dato('Longitud de onda en la línea', `λ = ${f(sol.lam)} m`) +
      dato('Impedancia de entrada', `Z<sub>in</sub> = ${cm(sol.zin)} Ω`);
    if (!sol.adaptada) {
      h += dato('Primer máximo de tensión', `d<sub>máx</sub> = ${f(sol.dmax)} m`) + dato('Primer mínimo de tensión', `d<sub>mín</sub> = ${f(sol.dmin)} m`);
      sol.stub.forEach((s, i) => { h += dato(`Stub en paralelo, solución ${i + 1}`, `d = ${f(s.dm)} m; l<sub>cc</sub> = ${f(s.lccm)} m; l<sub>ab</sub> = ${f(s.labm)} m`, 'est'); });
      h += dato('Transformador λ/4 en un máximo', `Z<sub>T</sub> = ${f(sol.cuarto.Zt1)} Ω a d<sub>máx</sub>`, 'est');
      sol.serie.forEach((q, i) => { h += dato(`Stub en serie, solución ${i + 1}`, `d = ${f(q.dm)} m; l<sub>cc</sub> = ${f(q.lccm)} m; l<sub>ab</sub> = ${f(q.labm)} m`, 'est'); });
      if (sol.doble.prohibida) h += dato('Doble stub', `Zona prohibida: g = ${f(sol.doble.g1)} supera ${f(sol.doble.gmax)}`, 'est');
      else sol.doble.sols.forEach((q, i) => { h += dato(`Doble stub, solución ${i + 1}`, `l<sub>1</sub> = ${f(q.l1m)} m; l<sub>2</sub> = ${f(q.l2m)} m`, 'est'); });
    } else h += dato('Estado', 'Carga adaptada: no hay ondas estacionarias', 'est');
    if (sol.perd) {
      const q = sol.perd; h += dato('Atenuación de la línea', `α·l = ${f(q.atenDb)} dB`) + dato('Z<sub>in</sub> con pérdidas', `${cm(q.zin)} Ω`) + dato('ROE a la entrada', `${f(q.roeIn)} (en la carga ${f(sol.roe)})`);
      if (q.PL !== undefined) h += dato('Potencia en la carga', `P<sub>L</sub> = ${f(q.PL)} W`) + dato('Disipada en el cable', `${f(q.Pdisip)} W`);
      h += dato('Longitud máxima útil (3 dB)', Number.isFinite(q.lmaxUtil3) ? `${f(q.lmaxUtil3)} m` : 'sin límite');
    }
    if (sol.trans) { const q = sol.trans; h += dato('Primera onda', `V₁ = ${f(q.V1)} V; Γ<sub>L</sub> = ${f(q.GL)}, Γ<sub>g</sub> = ${f(q.Gg)}`, 'est') + dato('Retardo de la línea', `T = ${f(q.T * 1e9)} ns`) + dato('Régimen permanente', `V<sub>∞</sub> = ${f(q.Vinf)} V`); }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Carta de Smith normalizada a Z₀. El círculo azul es el de ROE constante; la flecha roja va de la carga hacia el generador (sentido horario, una vuelta por cada λ/2) hasta la entrada, y si la línea mide más de λ/2 solo se dibuja lo que sobra de las vueltas completas. S1 y S2 son los puntos donde el círculo de ROE corta la circunferencia de conductancia 1 (trazos rojos): ahí un stub en paralelo adapta la línea.';
    $('#leyenda2').textContent = 'Tensión |V| y corriente |I|·Z₀ a lo largo de la línea, con |V⁺| = 1 y la distancia medida desde la carga. Los máximos de tensión coinciden con los mínimos de corriente.';
    $('#bloque-trans').hidden = !sol.trans; $('#bloque-bw').hidden = !sol.bw; lectura();
    if (sol.trans) $('#leyenda-trans').textContent = `Tensión en el generador (azul), en el punto elegido (${Math.round(100 * sol.trans.xp)} % de la línea, rojo) y en la carga (verde) tras cerrar el generador de ${f(sol.trans.Vg)} V con Rg = ${f(sol.trans.Rg)} Ω. Retardo T = ${f(sol.trans.T * 1e9)} ns, V₁ = ${f(sol.trans.V1)} V, Γ<sub>L</sub> = ${f(sol.trans.GL)}, Γ<sub>g</sub> = ${f(sol.trans.Gg)}; permanente V∞ = ${f(sol.trans.Vinf)} V.`.replace(/<sub>|<\/sub>/g, '');
    if (sol.bw) $('#leyenda-bw').textContent = 'Módulo de Γ a la entrada de cada red de adaptación al variar la frecuencia con las longitudes fijas (k = f/f₀). La línea de trazos marca ROE = 2 (|Γ| = 1/3). ' + Object.entries(sol.bw).map(([k, b]) => `${NOMBRE_RED[k]}: ${f(100 * b.bw, 3)} % de f₀`).join('; ') + '.';
    dibuja();
  }
  const NOMBRE_RED = { stub: 'stub paralelo', serie: 'stub serie', doble: 'doble stub', cuarto: 'transformador λ/4' };

  /* ---------- Lectura interactiva de la carta (LT-5) ---------- */
  let sonda = null, adm = false;
  function lectura() {
    const o = $('#lectura'); if (!o) return;
    if (!sonda || !sol) { o.textContent = 'Pulsa un punto de la carta o escribe r y x para leer su coeficiente de reflexión, impedancia, admitancia y ROE.'; return; }
    const G = sonda, g = Math.hypot(G.re, G.im), den = (1 - G.re) ** 2 + G.im ** 2, z = { re: (1 - g * g) / den, im: (2 * G.im) / den }, d2 = z.re * z.re + z.im * z.im, y = { re: z.re / d2, im: -z.im / d2 };
    const th = Math.atan2(G.im, G.re), roe = g < 1 ? (1 + g) / (1 - g) : Infinity;
    const haciaGen = (((sol.th - th) / (4 * PI)) % 0.5 + 0.5) % 0.5, haciaCarga = (((th - sol.th) / (4 * PI)) % 0.5 + 0.5) % 0.5;
    o.innerHTML = `<b>Punto P:</b> Γ = ${f(g)} ∠ ${f(th * 180 / PI)}°; z = ${f(z.re)} ${z.im < 0 ? '−' : '+'} j${f(Math.abs(z.im))} (Z = ${f(z.re * sol.Z0)} ${z.im < 0 ? '−' : '+'} j${f(Math.abs(z.im) * sol.Z0)} Ω); y = ${f(y.re)} ${y.im < 0 ? '−' : '+'} j${f(Math.abs(y.im))}; ROE = ${f(roe)}. Desde la carga ZL se llega a P a ${f(haciaGen)} λ hacia el generador (o a ${f(haciaCarga)} λ hacia la carga).`;
    $('#lee-r').value = String(+z.re.toPrecision(5)).replace('.', ','); $('#lee-x').value = String(+z.im.toPrecision(5)).replace('.', ',');
  }
  const desdeZ = (r, x) => { const d = (r + 1) ** 2 + x * x; return { re: (r * r + x * x - 1) / d, im: (2 * x) / d }; };
  const leeRX = () => { const r = +String($('#lee-r').value).replace(',', '.'), x = +String($('#lee-x').value || 0).replace(',', '.'); if (!isFinite(r) || !isFinite(x) || r < 0) return; sonda = desdeZ(r, x); lectura(); smith(); };
  $('#lee-r').addEventListener('input', leeRX); $('#lee-x').addEventListener('input', leeRX);
  $('#ver-adm').addEventListener('change', () => { adm = $('#ver-adm').checked; smith(); });
  $('#grafica').addEventListener('click', (e) => {
    const c = $('#grafica'), b = c.getBoundingClientRect(), R = Math.min(b.width, b.height) / 2 - 24, re = (e.clientX - b.left - b.width / 2) / R, im = -(e.clientY - b.top - b.height / 2) / R;
    if (re * re + im * im > 1.02) return; sonda = { re, im }; lectura(); smith();
  });
  $('#borra-sonda').addEventListener('click', () => { sonda = null; lectura(); smith(); });

  /* ---------- Gráficas ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel', '--serie-1', '--serie-2', '--serie-3']) col[k] = cs.getPropertyValue(k).trim(); }

  function smith() {
    const { g, w, h } = lienzo('#grafica');
    if (!w || !h) return;
    const R = Math.min(w, h) / 2 - 24, cx = w / 2, cy = h / 2, X = (re) => cx + re * R, Y = (im) => cy - im * R;
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 2 * PI); g.fillStyle = col['--panel']; g.fill(); g.clip();
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.45; g.lineWidth = 1;
    for (const r of [0.2, 0.5, 1, 2, 5]) { g.beginPath(); g.arc(X(r / (1 + r)), cy, R / (1 + r), 0, 2 * PI); g.stroke(); }
    for (const x of [0.2, 0.5, 1, 2, 5]) for (const s of [1, -1]) { g.beginPath(); g.arc(X(1), Y(s / x), R / x, 0, 2 * PI); g.stroke(); }
    if (adm) { g.setLineDash([3, 3]); g.strokeStyle = col['--serie-2']; // admitancias: la misma carta girada media vuelta
      for (const r of [0.2, 0.5, 1, 2, 5]) { g.beginPath(); g.arc(X(-r / (1 + r)), cy, R / (1 + r), 0, 2 * PI); g.stroke(); }
      for (const x of [0.2, 0.5, 1, 2, 5]) for (const s of [1, -1]) { g.beginPath(); g.arc(X(-1), Y(s / x), R / x, 0, 2 * PI); g.stroke(); }
      g.setLineDash([]); g.strokeStyle = col['--muted']; }
    g.beginPath(); g.moveTo(X(-1), cy); g.lineTo(X(1), cy); g.stroke(); // eje real
    g.restore();
    g.strokeStyle = col['--ink']; g.lineWidth = 1.8; g.beginPath(); g.arc(cx, cy, R, 0, 2 * PI); g.stroke();
    g.font = '11px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const r of [0.2, 0.5, 1, 2, 5]) g.fillText(String(r).replace('.', ','), X((r - 1) / (r + 1)), cy + 3);
    g.textBaseline = 'middle';
    for (const x of [0.2, 0.5, 1, 2, 5]) for (const s of [1, -1]) { // donde el arco de reactancia x corta la circunferencia exterior
      const m = x * x + 1, px = (x * x - 1) / m, py = (2 * x) / m * s, k = 1.07;
      g.textAlign = 'center'; g.fillText((s > 0 ? '+' : '−') + String(x).replace('.', ','), cx + px * R * k, cy - py * R * k);
    }
    if (!sol) return;
    const punto = (G, c, nom, dx = 8, dy = -8) => {
      const x = X(G.re), y = Y(G.im);
      g.fillStyle = c; g.beginPath(); g.arc(x, y, 4.5, 0, 2 * PI); g.fill();
      g.fillStyle = col['--ink']; g.font = 'bold 12px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(nom, x + dx, y + dy);
    };
    // círculo de ROE constante
    g.strokeStyle = col['--serie-1']; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, sol.g * R, 0, 2 * PI); g.stroke();
    // circunferencia de conductancia 1 (la r = 1 girada media vuelta): ahí caen los puntos de los stubs
    if (!sol.adaptada) { g.save(); g.strokeStyle = col['--serie-2']; g.globalAlpha = 0.7; g.setLineDash([4, 4]); g.lineWidth = 1.4; g.beginPath(); g.arc(X(-0.5), cy, R * 0.5, 0, 2 * PI); g.stroke(); g.restore(); }
    // recorrido de la carga a la entrada: Γ(d) = ΓL e^{−j4πd}, en sentido horario
    const vueltas = sol.ld > 0 && sol.ld % 0.5 < 1e-9 ? 0.5 : sol.ld % 0.5, n = Math.max(2, Math.ceil(vueltas * 240)); // solo la última vuelta, que acaba en Zin
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
    for (let i = 0; i <= n; i++) { const a = sol.th - 4 * PI * vueltas * i / n, x = X(sol.g * Math.cos(a)), y = Y(sol.g * Math.sin(a)); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
    if (sol.g > 1e-9 && vueltas > 0) { // punta de flecha en la entrada
      const a = sol.th - 4 * PI * vueltas, x = X(sol.g * Math.cos(a)), y = Y(sol.g * Math.sin(a)), dx = Math.sin(a), dy = Math.cos(a);
      g.fillStyle = col['--accent']; g.beginPath(); g.moveTo(x + dx * 9, y + dy * 9); g.lineTo(x - dy * 5, y + dx * 5); g.lineTo(x + dy * 5, y - dx * 5); g.closePath(); g.fill();
    }
    if (sol.stub) sol.stub.forEach((s, i) => punto(P.gamma(s.zp, sol.Z0), col['--serie-2'], `S${i + 1}`, -22, 12));
    if (sol.ld > 0 && !sol.adaptada) punto(sol.Gin, col['--serie-1'], 'Zin', 8, 10);
    punto(sol.G, col['--ink'], 'ZL', 8, -8);
    if (sonda) { const gm = Math.hypot(sonda.re, sonda.im); g.save(); g.setLineDash([2, 3]); g.strokeStyle = col['--accent']; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, gm * R, 0, 2 * PI); g.stroke(); g.restore(); punto(sonda, col['--accent'], 'P', 8, -8); }
    g.fillStyle = col['--muted']; g.font = '11px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText('hacia el generador ↻', 8, 8);
  }

  function perfil() {
    const { g, w, h } = lienzo('#perfil');
    if (!sol || !w || !h) return;
    const m = { l: 40, r: 12, t: 14, b: 34 }, W = w - m.l - m.r, H = h - m.t - m.b, d1 = sol.dPerfil, ym = 2.1;
    const x = (d) => m.l + d / d1 * W, y = (v) => m.t + H - Math.min(v, ym) / ym * H;
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1; g.font = '11px system-ui, sans-serif';
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of [0, 0.5, 1, 1.5, 2]) { g.beginPath(); g.moveTo(m.l, y(v)); g.lineTo(m.l + W, y(v)); g.stroke(); g.fillText(String(v).replace('.', ','), m.l - 5, y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    const paso = d1 > 3 ? 1 : d1 > 1.4 ? 0.5 : 0.25;
    for (let d = 0; d <= d1 + 1e-9; d += paso) { g.beginPath(); g.moveTo(x(d), m.t); g.lineTo(x(d), m.t + H); g.stroke(); g.fillText(String(+d.toFixed(2)).replace('.', ','), x(d), m.t + H + 4); }
    g.fillText('distancia a la carga (en λ)', m.l + W / 2, m.t + H + 18);
    const serie = (k, c) => { g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); sol.perfil.forEach((p, i) => { if (i) g.lineTo(x(p[0]), y(p[k])); else g.moveTo(x(p[0]), y(p[k])); }); g.stroke(); };
    serie(1, col['--serie-1']); serie(2, col['--serie-2']);
    if (sol.ld > 0 && sol.ld < d1 - 1e-9) {
      g.save(); g.setLineDash([4, 4]); g.strokeStyle = col['--accent']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x(sol.ld), m.t); g.lineTo(x(sol.ld), m.t + H); g.stroke(); g.restore();
      g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillStyle = col['--accent']; g.fillText('entrada', x(sol.ld) + 4, m.t + H - 3);
    }
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = col['--serie-1']; g.fillText('|V|', m.l + 6, m.t + 2); g.fillStyle = col['--serie-2']; g.fillText('|I|·Z₀', m.l + 34, m.t + 2);
  }
  
  /* ---------- Transitorios (LT-2): tensión en el tiempo y diagrama de rebotes ---------- */
  function trans() {
    const { g, w, h } = lienzo('#trans');
    if (!sol || !sol.trans || !w || !h) return;
    const q = sol.trans, m = { l: 48, r: 12, t: 14, b: 34 }, W = w - m.l - m.r, H = h - m.t - m.b, tm = q.tmax, N = 600;
    const puntos = [[0, col['--serie-1']], [q.x, col['--serie-2']], [sol.l, col['--serie-3'] || col['--accent']]];
    let vmin = 0, vmax = 0; for (const [ox] of puntos) for (let i = 0; i <= N; i++) { const v = q.V(tm * i / N, ox); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
    const paso = Math.max(1e-6, vmax - vmin), lo = vmin - 0.08 * paso, hi = vmax + 0.12 * paso, X = (t) => m.l + (t / tm) * W, Y = (v) => m.t + H - ((v - lo) / (hi - lo)) * H;
    g.font = '11px system-ui, sans-serif'; g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of Herramienta.marcas(lo, hi, 5)) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(m.l + W, Y(v)); g.stroke(); g.fillText(String(+v.toPrecision(4)).replace('.', ','), m.l - 5, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of Herramienta.marcas(0, tm * 1e9, 6)) { g.fillText(String(t).replace('.', ','), X(t * 1e-9), m.t + H + 4); }
    g.fillText('tiempo (ns)', m.l + W / 2, m.t + H + 18);
    for (const [ox, c] of puntos) { g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= N; i++) { const t = tm * i / N, v = q.V(t, ox); if (i) g.lineTo(X(t), Y(v)); else g.moveTo(X(t), Y(v)); } g.stroke(); }
    g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(m.l, Y(q.Vinf)); g.lineTo(m.l + W, Y(q.Vinf)); g.stroke(); g.setLineDash([]);
  }
  function rebotes() {
    const { g, w, h } = lienzo('#rebotes');
    if (!sol || !sol.trans || !w || !h) return;
    const q = sol.trans, m = { l: 46, r: 30, t: 24, b: 14 }, W = w - m.l - m.r, H = h - m.t - m.b, n = Math.min(6, q.rebotes.length), tmax = (n + 0.3) * q.T, X = (x) => m.l + (x / sol.l) * W, Y = (t) => m.t + (t / tmax) * H;
    g.font = '11px system-ui, sans-serif'; g.strokeStyle = col['--ink']; g.lineWidth = 1.4; g.fillStyle = col['--muted'];
    for (const x of [0, sol.l]) { g.beginPath(); g.moveTo(X(x), m.t); g.lineTo(X(x), m.t + H); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('generador', X(0), m.t - 6); g.fillText('carga', X(sol.l), m.t - 6);
    g.textAlign = 'right'; g.textBaseline = 'middle'; for (let k = 0; k <= n; k++) g.fillText(`${k}T`, m.l - 6, Y(k * q.T));
    g.strokeStyle = col['--accent']; g.lineWidth = 2; g.fillStyle = col['--ink'];
    for (let k = 0; k < n; k++) {
      const x0 = k % 2 === 0 ? 0 : sol.l, x1 = k % 2 === 0 ? sol.l : 0, b = q.rebotes[k];
      g.beginPath(); g.moveTo(X(x0), Y(k * q.T)); g.lineTo(X(x1), Y((k + 1) * q.T)); g.stroke();
      g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(`${f(b.v, 3)} V`, (X(x0) + X(x1)) / 2, (Y(k * q.T) + Y((k + 1) * q.T)) / 2 - 3 - (k % 2 ? 0 : 0));
    }
  }
  /* ---------- Ancho de banda de las redes de adaptación (LT-3) ---------- */
  function bw() {
    const { g, w, h } = lienzo('#bw');
    if (!sol || !sol.bw || !w || !h) return;
    const m = { l: 44, r: 12, t: 12, b: 34 }, W = w - m.l - m.r, H = h - m.t - m.b, k0 = 0.5, k1 = 1.5, X = (k) => m.l + ((k - k0) / (k1 - k0)) * W, Y = (v) => m.t + H - Math.min(1, v) * H, cols = { stub: col['--serie-1'], serie: col['--serie-2'], doble: col['--muted'], cuarto: col['--accent'] };
    g.font = '11px system-ui, sans-serif'; g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of [0, 0.25, 0.5, 0.75, 1]) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(m.l + W, Y(v)); g.stroke(); g.fillText(String(v).replace('.', ','), m.l - 5, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const k of [0.5, 0.75, 1, 1.25, 1.5]) g.fillText(String(k).replace('.', ','), X(k), m.t + H + 4);
    g.fillText('frecuencia relativa f/f₀', m.l + W / 2, m.t + H + 18);
    g.setLineDash([5, 4]); g.strokeStyle = col['--ink']; g.beginPath(); g.moveTo(m.l, Y(1 / 3)); g.lineTo(m.l + W, Y(1 / 3)); g.stroke(); g.setLineDash([]);
    let yy = m.t + 4; g.textAlign = 'left'; g.textBaseline = 'top';
    for (const [k, fun] of Object.entries(sol.redes)) { g.strokeStyle = cols[k]; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= 200; i++) { const kk = k0 + ((k1 - k0) * i) / 200, v = fun(kk); if (i) g.lineTo(X(kk), Y(v)); else g.moveTo(X(kk), Y(v)); } g.stroke(); g.fillStyle = cols[k]; g.fillText(NOMBRE_RED[k], m.l + 8, yy); yy += 14; }
  }
  const filasBw = () => { const r = []; for (let i = 0; i <= 200; i++) { const k = 0.5 + i / 200; r.push([k, ...['stub', 'serie', 'doble', 'cuarto'].map((c) => (sol.redes[c] ? sol.redes[c](k) : ''))]); } return r; };
  Herramienta.exportar('#bw', { nombre: 'adaptacion-ancho-de-banda', titulo: 'Ancho de banda de la adaptación', datos: () => ({ cab: ['f/f0', '|Γ| stub paralelo', '|Γ| stub serie', '|Γ| doble stub', '|Γ| transformador λ/4'], filas: sol && sol.redes ? filasBw() : [] }) });
  Herramienta.exportar('#trans', { nombre: 'transitorio-tension', titulo: 'Tensión en el tiempo', datos: () => ({ cab: ['t (ns)', 'V generador (V)', 'V punto (V)', 'V carga (V)'], filas: sol && sol.trans ? Array.from({ length: 301 }, (_, i) => { const t = sol.trans.tmax * i / 300; return [t * 1e9, sol.trans.V(t, 0), sol.trans.V(t, sol.trans.x), sol.trans.V(t, sol.l)]; }) : [] }) });
  Herramienta.exportar('#grafica', { nombre: 'carta-de-smith', titulo: 'Carta de Smith', datos: () => ({ cab: ['d (λ)', '|V|', '|I|·Z0'], filas: sol ? sol.perfil.map((p) => [p[0], p[1], p[2]]) : [] }) });
  function dibuja() { smith(); perfil(); trans(); rebotes(); bw(); }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('lineas-transmision').current;
  colores(); formulario(); calcula();
  window.LineasTransmisionApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { g: sol.g, th: sol.th, roe: sol.roe, rl: sol.rl, lam: sol.lam, zin: sol.zin, dmax: sol.dmax }, estado: () => copia(sc), sonda: (r, x) => { sonda = desdeZ(r, x); lectura(); smith(); return sonda; } };
})();
