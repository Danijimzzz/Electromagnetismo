/* =====================================================================
   Corriente alterna y fasores: interfaz (modo, conexión, datos,
   resultado, diagrama de fasores, ondas v(t) e i(t) y desarrollo).
   El cálculo está en alterna/fisica.js (Alterna).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const A = Alterna, CLAVE = 'alterna-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

  let sc = copia(A.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && (g.modo === 'circuito' || g.modo === 'correccion')) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom} <small>${un}</small></label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opcion = (k, v, t) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`;
  function formulario() {
    let h = `<label for="f-modo">Qué calcular</label><select id="f-modo" class="in" data-k="modo">${opcion('modo', 'circuito', 'Circuito RLC')}${opcion('modo', 'correccion', 'Corregir el factor de potencia')}</select>`;
    if (sc.modo === 'correccion') {
      h += fila('V', 'Tensión eficaz V', 'V') + fila('f', 'Frecuencia f', 'Hz') + fila('P', 'Potencia activa P', 'kW') + fila('fp1', 'cos φ inicial', '') + fila('fp2', 'cos φ deseado', '');
      $('#nota').textContent = 'La carga es inductiva; el condensador va en paralelo con ella.';
    } else {
      h += `<label for="f-conexion">Conexión</label><select id="f-conexion" class="in" data-k="conexion">${opcion('conexion', 'serie', 'En serie')}${opcion('conexion', 'paralelo', 'En paralelo')}</select>`;
      h += fila('V', 'Tensión eficaz V', 'V') + fila('f', 'Frecuencia f', 'Hz') + fila('R', 'Resistencia R', 'Ω') + fila('L', 'Inductancia L', 'mH') + fila('C', 'Capacidad C', 'μF');
      $('#nota').textContent = 'Deja vacío un elemento si no está. Puedes usar coma o punto decimal.';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') { const ej = A.ejemplos.find((x) => x.sc.modo === t.value); for (const [k, v] of Object.entries(ej.sc)) if (sc[k] === undefined || sc[k] === '' || k === 'P') sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + A.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = A.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = { ...sc, ...copia(e.sc) };
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = sc.modo === 'correccion' ? { modo: 'correccion', ...A.correccion(sc) } : { modo: 'circuito', ...A.circuito(sc) }; }
    catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').innerHTML = ''; dibuja(); return; }
    err.hidden = true; guarda();
    if (sol.modo === 'correccion') {
      $('#res').innerHTML = dato('Capacidad del condensador', `C = <b>${A.u(sol.C, 'F')}</b>`) + dato('Reactiva que aporta', `Q<sub>C</sub> = ${A.u(sol.Qc, 'var')}`) + dato('Corriente de línea', `${A.u(sol.I1, 'A')} → ${A.u(sol.I2, 'A')}`);
      $('#leyenda').innerHTML = 'Izquierda: triángulo de potencias antes (<b style="color:var(--v)">S<sub>1</sub></b>) y después (<b style="color:var(--i)">S<sub>2</sub></b>). Derecha: v(t) y la corriente de línea antes y después.';
    } else {
      $('#res').innerHTML = dato('Impedancia', `Z = ${A.bin(sol.Zt)} = <b>${A.pol(sol.Zt)} Ω</b>`) + dato('Corriente', `I = <b>${A.pol(sol.I)} A</b>`) + dato('Factor de potencia', `cos φ = <b>${A.f(sol.fp)}</b>${Math.abs(sol.fi) < 1e-5 ? ' (resistivo)' : sol.fi > 0 ? ' inductivo' : ' capacitivo'}`) + dato('Potencias', `P = ${A.u(sol.P, 'W')}, Q = ${A.u(sol.Q, 'var')}, S = ${A.u(sol.S, 'VA')}`) + (sol.res ? dato('Resonancia', `f<sub>0</sub> = ${A.u(sol.res.f0, 'Hz')}`) : '');
      $('#leyenda').innerHTML = sol.serie
        ? 'Fasores: <b style="color:var(--v)">V</b> de la fuente como suma de las tensiones de cada elemento, y <b style="color:var(--i)">I</b> (escala propia). Ondas: v(t) e i(t) con valores de pico √2 veces los eficaces.'
        : 'Fasores: <b style="color:var(--i)">I</b> total como suma de las corrientes de cada rama, y <b style="color:var(--v)">V</b> de la fuente (escala propia). Ondas: v(t) e i(t) con valores de pico √2 veces los eficaces.';
    }
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--v', '--i', '--x', '--bg']) col[k] = cs.getPropertyValue(k).trim(); }
  function lienzo(id) {
    const c = $(id), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.lineCap = 'round'; g.lineJoin = 'round';
    return { g, w, h };
  }
  function flecha(g, x0, y0, x1, y1, color, ancho = 2, punteada = false) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 1) return;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho; g.setLineDash(punteada ? [5, 4] : []);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(10, L * 0.4);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  }
  // texto con un recuadro del color del fondo, para que se lea aunque caiga encima de una flecha
  function etiqueta(g, x, y, t, color, dx = 0, dy = 0) {
    const w = g.measureText(t).width, x0 = dx < 0 ? x + dx - w : dx > 0 ? x + dx : x - w / 2, y0 = dy < 0 ? y + dy - 14 : dy > 0 ? y + dy : y - 7;
    g.fillStyle = col['--bg']; g.globalAlpha = 0.85; g.fillRect(x0 - 2, y0, w + 4, 14); g.globalAlpha = 1;
    g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(t, x0, y0 + 1);
  }

  // Coloca una lista de vectores (en coordenadas físicas) dentro del lienzo, con el origen donde convenga
  function encaja(puntos, w, h, m = 26) {
    const xs = puntos.map((p) => p[0]).concat(0), ys = puntos.map((p) => p[1]).concat(0);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.min((w - 2 * m) / Math.max(x1 - x0, 1e-12), (h - 2 * m) / Math.max(y1 - y0, 1e-12));
    const ox = m + (w - 2 * m - (x1 - x0) * k) / 2 - x0 * k, oy = h - m - (h - 2 * m - (y1 - y0) * k) / 2 + y0 * k;
    return { X: (x) => ox + x * k, Y: (y) => oy - y * k, k, ox, oy };
  }

  function fasores() {
    const { g, w, h } = lienzo('#fasores');
    if (!sol) return;
    if (sol.modo === 'correccion') return triangulos(g, w, h);
    const nombreV = { R: 'V_R', L: 'V_L', C: 'V_C' }, nombreI = { R: 'I_R', L: 'I_L', C: 'I_C' };
    // la magnitud principal se dibuja encadenada; la otra, sola y escalada a la mitad de la principal
    const serie = sol.serie, cadena = sol.partes.map((p) => (serie ? p.V : p.I)), total = serie ? sol.Vf : sol.I, otra = serie ? sol.I : sol.Vf;
    const pts = []; let x = 0, y = 0;
    for (const z of cadena) { x += z.re; y += z.im; pts.push([x, y]); }
    const escOtra = (A.mod(total) * 0.6) / (A.mod(otra) || 1);
    pts.push([otra.re * escOtra, otra.im * escOtra], [total.re, total.im]);
    const T = encaja(pts, w, h);
    // ejes
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(0, T.oy); g.lineTo(w, T.oy); g.moveTo(T.ox, 0); g.lineTo(T.ox, h); g.stroke();
    etiqueta(g, w - 4, T.oy, 'Re', col['--muted'], -1, -4); etiqueta(g, T.ox, 4, 'Im', col['--muted'], 4, 4);
    const cPrin = serie ? col['--v'] : col['--i'], cOtra = serie ? col['--i'] : col['--v'];
    x = 0; y = 0;
    sol.partes.forEach((p, i) => {
      const z = cadena[i], x1 = x + z.re, y1 = y + z.im;
      // L y C son colineales (los dos a 90° de R): se separan unos píxeles para que se vean los dos
      const n = Math.atan2(-(y1 - y), x1 - x) + Math.PI / 2, d = p.k === 'C' && sol.partes.some((q) => q.k === 'L') ? 6 : 0, dx = d * Math.cos(n), dy = d * Math.sin(n);
      flecha(g, T.X(x) + dx, T.Y(y) + dy, T.X(x1) + dx, T.Y(y1) + dy, col['--x'], 2, true);
      const mx = T.X(x) + (T.X(x1) - T.X(x)) * 0.3, my = T.Y(y) + (T.Y(y1) - T.Y(y)) * 0.3, lado = d ? 1 : -1;
      etiqueta(g, mx + lado * 14 * Math.cos(n), my + lado * 14 * Math.sin(n), (serie ? nombreV : nombreI)[p.k].replace('_', ''), col['--x']);
      x = x1; y = y1;
    });
    flecha(g, T.X(0), T.Y(0), T.X(total.re), T.Y(total.im), cPrin, 2.5);
    etiqueta(g, T.X(total.re), T.Y(total.im), serie ? 'V' : 'I', cPrin, total.re >= 0 ? -8 : 8, total.im >= 0 ? -4 : 4);
    flecha(g, T.X(0), T.Y(0), T.X(otra.re * escOtra), T.Y(otra.im * escOtra), cOtra, 2.5);
    etiqueta(g, T.X(otra.re * escOtra), T.Y(otra.im * escOtra), serie ? 'I' : 'V', cOtra, 0, otra.im * escOtra >= 0 ? -6 : 6);
    // ángulo φ entre V e I
    if (Math.abs(sol.fi) > 1e-3) {
      const aV = -Math.atan2(sol.Vf.im, sol.Vf.re), aI = -Math.atan2(sol.I.im, sol.I.re), r = 28;
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.arc(T.ox, T.oy, r, Math.min(aV, aI), Math.max(aV, aI)); g.stroke();
      const am = (aV + aI) / 2; etiqueta(g, T.ox + (r + 10) * Math.cos(am), T.oy + (r + 10) * Math.sin(am), 'φ', col['--muted']);
    }
  }

  function triangulos(g, w, h) {
    const P = sol.P, pts = [[P, 0], [P, sol.Q1], [P, sol.Q2]], T = encaja(pts, w, h, 30);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(0, T.oy); g.lineTo(w, T.oy); g.stroke();
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(0), col['--ink'], 2);
    etiqueta(g, T.X(P / 2), T.Y(0), `P = ${txt(A.u(P, 'W'))}`, col['--ink'], 0, 6);
    flecha(g, T.X(P), T.Y(0), T.X(P), T.Y(sol.Q2), col['--x'], 2);
    flecha(g, T.X(P), T.Y(sol.Q2), T.X(P), T.Y(sol.Q1), col['--accent'], 2, true);
    etiqueta(g, T.X(P), T.Y((sol.Q1 + sol.Q2) / 2), `QC = ${txt(A.u(sol.Qc, 'var'))}`, col['--accent'], -6, 0);
    etiqueta(g, T.X(P), T.Y(sol.Q2 / 2), `Q2`, col['--x'], 6, 0);
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(sol.Q1), col['--v'], 2.5);
    etiqueta(g, T.X(P / 2), T.Y(sol.Q1 / 2), 'S1', col['--v'], -8, -8);
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(sol.Q2), col['--i'], 2.5);
    etiqueta(g, T.X(P * 0.7), T.Y(sol.Q2 * 0.7), 'S2', col['--i'], 4, 8);
    etiqueta(g, 8, 8, `φ1 = ${txt(A.ang(sol.f1))}, φ2 = ${txt(A.ang(sol.f2))}`, col['--muted'], 1, 1);
  }

  function ondas() {
    const { g, w, h } = lienzo('#ondas');
    if (!sol) return;
    const m = { l: 10, r: 10, t: 16, b: 22 }, per = 2, oy = (h - m.b + m.t) / 2, amp = (h - m.t - m.b) / 2 - 4;
    const X = (t) => m.l + (t / per) * (w - m.l - m.r);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(m.l, oy); g.lineTo(w - m.r, oy); g.stroke();
    for (let k = 1; k < per * 2; k++) { g.beginPath(); g.moveTo(X(k / 2), oy - 3); g.lineTo(X(k / 2), oy + 3); g.stroke(); }
    etiqueta(g, X(1), oy + amp + 4, 'T', col['--muted'], 0, 2); etiqueta(g, X(2) - 2, oy + amp + 4, '2T', col['--muted'], -1, 2);
    const curva = (fase, a, color, ancho = 2, punteada = false) => {
      g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(punteada ? [5, 4] : []); g.beginPath();
      for (let i = 0; i <= 300; i++) { const t = (per * i) / 300, y = oy - a * amp * Math.sin(2 * Math.PI * t + fase); i ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
      g.stroke(); g.setLineDash([]);
    };
    g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    if (sol.modo === 'correccion') {
      curva(0, 1, col['--v']);
      curva(-sol.f1, 0.85, col['--muted'], 1.5, true);
      curva(-sol.f2, 0.85 * sol.I2 / sol.I1, col['--i']);
      g.fillStyle = col['--v']; g.fillText('v(t)', m.l + 2, 0);
      g.fillStyle = col['--muted']; g.fillText(`i₁(t), pico ${txt(A.u(Math.SQRT2 * sol.I1, 'A'))}`, m.l + 40, 0);
      g.fillStyle = col['--i']; g.fillText(`i₂(t), pico ${txt(A.u(Math.SQRT2 * sol.I2, 'A'))}`, m.l + 40 + g.measureText(`i₁(t), pico ${txt(A.u(Math.SQRT2 * sol.I1, 'A'))}`).width + 14, 0);
      return;
    }
    const fV = Math.atan2(sol.Vf.im, sol.Vf.re), fI = Math.atan2(sol.I.im, sol.I.re);
    curva(fV, 1, col['--v']);
    curva(fI, 0.7, col['--i']);
    g.fillStyle = col['--v']; const tv = `v(t), pico ${txt(A.u(Math.SQRT2 * sol.V, 'V'))}`; g.fillText(tv, m.l + 2, 0);
    g.fillStyle = col['--i']; g.fillText(`i(t), pico ${txt(A.u(Math.SQRT2 * A.mod(sol.I), 'A'))}`, m.l + 16 + g.measureText(tv).width, 0);
  }
  function dibuja() { colores(); fasores(); ondas(); }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('alterna').current;
  formulario(); calcula();
  window.AlternaApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, Z: sol.Zt && A.mod(sol.Zt), fi: sol.fi, fp: sol.fp, I: sol.I && A.mod(sol.I), C: sol.C, P: sol.P }, estado: () => copia(sc) };
})();
