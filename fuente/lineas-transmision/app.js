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
      '<div class="sep">Carga ZL = R + jX</div>' + fila('R', 'Resistencia R', 'Ω') + fila('X', 'Reactancia X', 'Ω');
    $('#nota').textContent = 'Línea sin pérdidas. Vacío: X = 0. Se admite coma decimal. X es positiva si la carga es inductiva y negativa si es capacitiva.';
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
    sc = { Z0: c(Z0), R: c(R), X: c(X), f: c(fr), er: c(er), l: c(lamda), lu: 'lam' };
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
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#leyenda2').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = dato('Reflexión en la carga', `|Γ<sub>L</sub>| = ${f(sol.g)}, θ = ${f(sol.th * 180 / PI)}°`) + dato('Relación de onda estacionaria', `ROE = ${f(sol.roe)}`) +
      dato('Pérdida de retorno', `RL = ${f(sol.rl)} dB`) + dato('Potencia reflejada', `${f(sol.pRef)} %`) + dato('Longitud de onda en la línea', `λ = ${f(sol.lam)} m`) +
      dato('Impedancia de entrada', `Z<sub>in</sub> = ${cm(sol.zin)} Ω`);
    if (!sol.adaptada) {
      h += dato('Primer máximo de tensión', `d<sub>máx</sub> = ${f(sol.dmax)} m`) + dato('Primer mínimo de tensión', `d<sub>mín</sub> = ${f(sol.dmin)} m`);
      sol.stub.forEach((s, i) => { h += dato(`Stub en paralelo, solución ${i + 1}`, `d = ${f(s.dm)} m; l<sub>cc</sub> = ${f(s.lccm)} m; l<sub>ab</sub> = ${f(s.labm)} m`, 'est'); });
      h += dato('Transformador λ/4 en un máximo', `Z<sub>T</sub> = ${f(sol.cuarto.Zt1)} Ω a d<sub>máx</sub>`, 'est');
    } else h += dato('Estado', 'Carga adaptada: no hay ondas estacionarias', 'est');
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Carta de Smith normalizada a Z₀. El círculo azul es el de ROE constante; la flecha roja va de la carga hacia el generador (sentido horario, una vuelta por cada λ/2) hasta la entrada, y si la línea mide más de λ/2 solo se dibuja lo que sobra de las vueltas completas. S1 y S2 son los puntos donde el círculo de ROE corta la circunferencia de conductancia 1 (trazos rojos): ahí un stub en paralelo adapta la línea.';
    $('#leyenda2').textContent = 'Tensión |V| y corriente |I|·Z₀ a lo largo de la línea, con |V⁺| = 1 y la distancia medida desde la carga. Los máximos de tensión coinciden con los mínimos de corriente.';
    dibuja();
  }

  /* ---------- Gráficas ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }

  function smith() {
    const { g, w, h } = lienzo('#grafica');
    if (!w || !h) return;
    const R = Math.min(w, h) / 2 - 24, cx = w / 2, cy = h / 2, X = (re) => cx + re * R, Y = (im) => cy - im * R;
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 2 * PI); g.fillStyle = col['--panel']; g.fill(); g.clip();
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.45; g.lineWidth = 1;
    for (const r of [0.2, 0.5, 1, 2, 5]) { g.beginPath(); g.arc(X(r / (1 + r)), cy, R / (1 + r), 0, 2 * PI); g.stroke(); }
    for (const x of [0.2, 0.5, 1, 2, 5]) for (const s of [1, -1]) { g.beginPath(); g.arc(X(1), Y(s / x), R / x, 0, 2 * PI); g.stroke(); }
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
    const paso = Math.max(d1 > 3 ? 1 : d1 > 1.4 ? 0.5 : 0.25, d1 / 12);
    for (let k = 0, d = 0; k <= 40 && d <= d1 + 1e-9; d = ++k * paso) { g.beginPath(); g.moveTo(x(d), m.t); g.lineTo(x(d), m.t + H); g.stroke(); g.fillText(String(+d.toFixed(2)).replace('.', ','), x(d), m.t + H + 4); }
    g.fillText('distancia a la carga (en λ)', m.l + W / 2, m.t + H + 18);
    const serie = (k, c) => { g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); sol.perfil.forEach((p, i) => { if (i) g.lineTo(x(p[0]), y(p[k])); else g.moveTo(x(p[0]), y(p[k])); }); g.stroke(); };
    serie(1, col['--serie-1']); serie(2, col['--serie-2']);
    if (sol.ld > 0 && sol.ld < d1 - 1e-9) {
      g.save(); g.setLineDash([4, 4]); g.strokeStyle = col['--accent']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x(sol.ld), m.t); g.lineTo(x(sol.ld), m.t + H); g.stroke(); g.restore();
      g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillStyle = col['--accent']; g.fillText('entrada', x(sol.ld) + 4, m.t + H - 3);
    }
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = col['--serie-1']; g.fillText('|V|', m.l + 6, m.t + 2); g.fillStyle = col['--serie-2']; g.fillText('|I|·Z₀', m.l + 34, m.t + 2);
  }
  function dibuja() { smith(); perfil(); }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('lineas-transmision').current;
  colores(); formulario(); calcula();
  window.LineasTransmisionApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { g: sol.g, th: sol.th, roe: sol.roe, rl: sol.rl, lam: sol.lam, zin: sol.zin, dmax: sol.dmax }, estado: () => copia(sc) };
})();
