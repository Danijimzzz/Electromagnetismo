/* =====================================================================
   Interfaz de las guías de onda: datos de la guía y del modo, ejemplos, resultados, desarrollo y
   el campo eléctrico transversal del modo en la sección de la guía. El cálculo está en
   guias-onda/calculo.js (GuiasOnda) y los ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE]. Expone window.GuiasOndaApp para el modo
   práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, lienzo } = Herramienta;
  const G = GuiasOnda, f = G.f, CLAVE = 'guias-onda-v1';

  let sc = copia(G.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  function formulario() {
    const circ = sc.forma === 'circ';
    $('#campos').innerHTML = '<div class="sep">Guía</div>' + elige('forma', 'Sección', [['rect', 'Rectangular'], ['circ', 'Circular']]) +
      (circ ? fila('R', 'Radio R', 'mm') : fila('a', 'Lado mayor a', 'mm') + fila('b', 'Lado menor b', 'mm')) + fila('er', 'Relleno εr') +
      '<div class="sep">Señal y modo</div>' + fila('f', 'Frecuencia', 'GHz') + elige('tipo', 'Tipo de modo', [['TE', 'TE (Ez = 0)'], ['TM', 'TM (Hz = 0)']]) +
      (circ ? fila('m', 'Índice n (azimutal, desde 0)') + fila('n', 'Índice m (radial, desde 1)') : fila('m', 'Índice m') + fila('n', 'Índice n')) +
      '<div class="sep">Cerrar la guía (cavidad)</div>' + fila('lc', 'Longitud de la cavidad', 'mm, vacío = λg/2');
    $('#nota').textContent = circ ? 'Vacío: εr = 1. Se admite coma decimal y unidades (10 GHz, 2 cm). En la guía circular n cuenta las variaciones del campo alrededor del eje y m los ceros radiales; el modo dominante es el TE11.' : 'Vacío: εr = 1. Se admite coma decimal y unidades (10 GHz, 22,86 mm). m y n cuentan los semiciclos del campo a lo largo de a y de b.';
  }
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT' || !t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.dataset.k === 'forma') { // al cambiar de sección se ponen datos razonables del modo dominante
      if (t.value === 'circ') Object.assign(sc, { R: sc.R || '10', tipo: 'TE', m: '1', n: '1' }); else Object.assign(sc, { a: sc.a || '22,86', b: sc.b || '10,16', tipo: 'TE', m: '1', n: '0' });
      formulario();
    }
    calcula();
  });
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k || t.tagName === 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + G.ejemplos.map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = G.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const de = (l) => l[Math.floor(Math.random() * l.length)], c = (x) => String(x).replace('.', ',');
    const g = de([['22,86', '10,16'], ['47,55', '22,15'], ['15,8', '7,9'], ['58', '29'], ['34,85', '15,8']]);
    const er = de(['1', '1', '2,25', '2,1', '4']), tipo = de(['TE', 'TE', 'TM']);
    const m = tipo === 'TM' ? de(['1', '1', '2']) : de(['1', '1', '2', '0']), n = tipo === 'TM' ? de(['1', '1', '2']) : (m === '0' ? '1' : de(['0', '0', '1']));
    const w = Math.sqrt(+m * +m / (+c(g[0]).replace(',', '.')) ** 2 + (+n) ** 2 / (+c(g[1]).replace(',', '.')) ** 2);
    const fc = 299792458 / Math.sqrt(+c(er).replace(',', '.')) / 2 * w * 1000 / 1e9;
    const fr = Math.round(fc * de([1.15, 1.3, 1.6, 2]) * 10) / 10;
    sc = { forma: 'rect', a: g[0], b: g[1], er, f: c(fr), tipo, m, n, lc: '' };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => `Una guía de onda rectangular de ${esc(sc.a)} × ${esc(sc.b)} mm ${+String(sc.er).replace(',', '.') === 1 ? 'está llena de aire' : `está rellena de un dieléctrico de εr = ${esc(sc.er)}`}. Calcula, para el modo ${esc(sc.tipo)}<sub>${esc(sc.m)}${esc(sc.n)}</sub> a ${esc(sc.f)} GHz, la frecuencia y la longitud de onda de corte, la constante de fase β, la longitud de onda en la guía, las velocidades de fase y de grupo y la impedancia de onda.`;

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = 'num') => `<div class="${cl}"><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = G.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const circ = sol.forma === 'circ', nm = circ ? G.nomC : G.nom, mo = nm(sol.tipo, sol.m, sol.n);
    let h = dato('Frecuencia de corte', `f<sub>c</sub> = ${f(sol.fc / 1e9)} GHz`) + dato('Longitud de onda de corte', `λ<sub>c</sub> = ${f(sol.lc * 1000)} mm`);
    if (sol.propaga) h += dato('Estado del modo', `${mo} se propaga`, 'est') + dato('Constante de fase', `β = ${f(sol.beta)} rad/m`) + dato('Longitud de onda en la guía', `λ<sub>g</sub> = ${f(sol.lg * 1000)} mm`) +
      dato('Velocidad de fase', `v<sub>f</sub> = ${f(sol.vf)} m/s`) + dato('Velocidad de grupo', `v<sub>g</sub> = ${f(sol.vg)} m/s`) + dato(`Impedancia de onda ${sol.tipo}`, `Z<sub>${sol.tipo}</sub> = ${f(sol.Z)} Ω`);
    else h += dato('Estado del modo', `${mo} no se propaga (f &lt; f<sub>c</sub>)`, 'est') + dato('Atenuación', `α = ${f(sol.alfa)} Np/m`) + dato('En decibelios', `${f(sol.dB)} dB/m`);
    h += dato('Banda monomodo', `${f(sol.banda[0] / 1e9)} a ${f(sol.banda[1] / 1e9)} GHz`, 'est') + dato('Modos que se propagan a esta frecuencia', sol.modos.length ? sol.modos.slice(0, 8).map((q) => nm(q.tipo, q.m, q.n)).join(', ') + (sol.modos.length > 8 ? ', …' : '') : 'ninguno', 'est');
    if (sol.cavidad) h += dato('Cavidad cerrando la guía', `d = ${f(sol.cavidad.d * 1000)} mm: resuena a ` + sol.cavidad.res.map((q) => `${f(q.f / 1e9)} GHz (p = ${q.p})`).join(', '), 'est');
    $('#abrir-cav').hidden = !sol.cavidad;
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = `Campo eléctrico transversal del modo ${sol.tipo}${sol.m}${sol.n} en la sección ${sol.forma === 'circ' ? 'circular' : 'a × b'}: cada flecha da su dirección y su tamaño relativo. Los trazos discontinuos separan las zonas donde el campo cambia de sentido.`;
    dibuja();
  }

  /* ---------- Gráfica: sección de la guía con el campo E del modo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel']) col[k] = cs.getPropertyValue(k).trim(); }
  function flecha(g, x, y, dx, dy, l) {
    const mod = Math.hypot(dx, dy); if (mod < 1e-9) return;
    const ux = dx / mod, uy = dy / mod, L = l * Math.min(1, mod), x2 = x + ux * L / 2, y2 = y + uy * L / 2, x1 = x - ux * L / 2, y1 = y - uy * L / 2, h = Math.min(6, L * 0.4);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - ux * h - uy * h * 0.5, y2 - uy * h + ux * h * 0.5); g.lineTo(x2 - ux * h + uy * h * 0.5, y2 - uy * h - ux * h * 0.5); g.closePath(); g.fill();
  }
  function dibujaCirc(g, w, h) {
    const R = Math.min(w, h) / 2 - 22, cx = w / 2, cy = h / 2 + 4;
    g.fillStyle = col['--panel']; g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.fill(); g.stroke();
    const N = 17, rr = sol.R, vs = []; let mx = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = ((i + 0.5) / N * 2 - 1) * rr, y = ((j + 0.5) / N * 2 - 1) * rr;
      if (Math.hypot(x, y) > rr * 0.97) continue;
      const e = G.campoCirc(sol.tipo, sol.m, sol.n, rr, x, y); vs.push([cx + (x / rr) * R, cy - (y / rr) * R, e[0], -e[1]]); mx = Math.max(mx, Math.hypot(e[0], e[1]));
    }
    g.strokeStyle = col['--accent']; g.fillStyle = col['--accent']; g.lineWidth = 1.6;
    const L = (2 * R / N) * 0.9; for (const [x, y, ex, ey] of vs) flecha(g, x, y, ex / mx, ey / mx, L);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(txt(`R = ${f(sol.R * 1000)} mm`), cx, cy - R - 3);
    g.textBaseline = 'top'; g.fillText(`${sol.tipo}${sol.m}${sol.n}`, cx, cy + R + 3);
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    if (sol.forma === 'circ') { dibujaCirc(g, w, h); return; }
    const mg = 16, esc1 = Math.min((w - 2 * mg) / sol.a, (h - 2 * mg - 14) / sol.b), W = sol.a * esc1, H = sol.b * esc1, x0 = (w - W) / 2, y0 = (h - H) / 2 + 6;
    g.fillStyle = col['--panel']; g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.fillRect(x0, y0, W, H); g.strokeRect(x0, y0, W, H);
    // nodos del campo (líneas donde se anulan las componentes) y rejilla de flechas
    g.save(); g.setLineDash([4, 4]); g.strokeStyle = col['--line']; g.lineWidth = 1;
    for (let i = 1; i < sol.m; i++) { const x = x0 + (i / sol.m) * W; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + H); g.stroke(); }
    for (let j = 1; j < sol.n; j++) { const y = y0 + (j / sol.n) * H; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + W, y); g.stroke(); }
    g.restore();
    const nx = Math.max(6, Math.min(22, Math.round(W / 26))), ny = Math.max(4, Math.min(14, Math.round(H / 26)));
    let mx = 0; const vs = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = (i + 0.5) / nx * sol.a, y = (j + 0.5) / ny * sol.b, e = G.campo(sol.tipo, sol.m, sol.n, sol.a, sol.b, x, y);
      vs.push([x0 + (i + 0.5) / nx * W, y0 + H - (j + 0.5) / ny * H, e[0], -e[1]]); mx = Math.max(mx, Math.hypot(e[0], e[1]));
    }
    g.strokeStyle = col['--accent']; g.fillStyle = col['--accent']; g.lineWidth = 1.6;
    const L = Math.min(W / nx, H / ny) * 0.9;
    for (const [x, y, ex, ey] of vs) flecha(g, x, y, ex / mx, ey / mx, L);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom';
    g.fillText(txt(`a = ${f(sol.a * 1000)} mm`), x0 + W / 2, y0 - 3); g.textBaseline = 'top'; g.fillText(`${sol.tipo}${sol.m}${sol.n}`, x0 + W / 2, y0 + H + 3);
    g.save(); g.translate(x0 - 4, y0 + H / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'bottom'; g.fillText(txt(`b = ${f(sol.b * 1000)} mm`), 0, 0); g.restore();
  }
  /* ---------- Abrir en Cavidades (EM-4 / GU-3): lleva guía, modo y longitud a la otra herramienta ---------- */
  const mm = (x) => String(+(x * 1000).toPrecision(8)).replace('.', ',');
  $('#abrir-cav').addEventListener('click', () => {
    if (!sol || !sol.cavidad) return;
    const c = sol.cavidad, p1 = c.res.find((q) => q.p >= 1) || c.res[0], base = { er: String(sol.er).replace('.', ','), tand: '0', sigma: '5,8e7', tipo: sol.tipo, plano: 'xz', pos: 50, que: 'E', beta: '' };
    const est = sol.forma === 'circ' ? { ...base, geo: 'cil', R: mm(sol.R), L: mm(c.d), i1: String(sol.m), i2: String(sol.n), i3: String(p1.p) } : { ...base, geo: 'rect', a: mm(sol.a), b: mm(sol.b), d: mm(c.d), i1: String(sol.m), i2: String(sol.n), i3: String(p1.p) };
    try { localStorage.setItem('cavidades-v1', JSON.stringify(est)); } catch (e) { /* sin almacenamiento */ }
    location.href = '../cavidades/' + (location.protocol === 'file:' ? 'index.html' : '');
  });
  Herramienta.exportar('#grafica', { nombre: 'guia-de-onda-campo', titulo: 'Campo del modo en la guía' });
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('guias-onda').current;
  colores(); formulario(); calcula();
  window.GuiasOndaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { fc: sol.fc, lc: sol.lc, beta: sol.beta, lg: sol.lg, vf: sol.vf, vg: sol.vg, Z: sol.Z, alfa: sol.alfa }, estado: () => copia(sc), cavidad: () => { $('#abrir-cav').click(); } };
})();
