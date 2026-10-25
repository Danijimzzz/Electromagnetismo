/* =====================================================================
   Sólido rígido: interfaz (modo, cuerpo, datos, resultado, dibujo y
   desarrollo). El cálculo está en solido-rigido/fisica.js (Solido).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const S = Solido, f = S.f, CLAVE = 'solido-rigido-v1';
  const txt = (h) => String(h).replace(/<[^>]+>/g, '');
  const MODOS = [['inercia', 'Momento de inercia (Steiner)'], ['rodadura', 'Rodadura por un plano inclinado'], ['polea', 'Polea con masa'], ['momento', 'Conservación del momento angular']];

  let sc = copia(S.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  function formulario() {
    let h = `<label for="f-modo">Qué calcular</label><select id="f-modo" class="in" data-k="modo">${opciones('modo', MODOS)}</select>`;
    const cuerpos = Object.entries(S.CUERPOS).filter(([, c]) => sc.modo === 'inercia' || c.rueda).map(([k, c]) => [k, c.nombre]);
    if (sc.modo !== 'momento' && !cuerpos.some(([k]) => k === sc.cuerpo)) sc.cuerpo = cuerpos[0][0];
    const C = S.CUERPOS[sc.cuerpo];
    if (sc.modo === 'inercia') {
      h += `<label for="f-cuerpo">Cuerpo</label><select id="f-cuerpo" class="in" data-k="cuerpo">${opciones('cuerpo', cuerpos)}</select>`;
      h += fila('M', 'Masa M', 'kg') + fila('L', C.medNom, 'm') + (C.placa ? fila('b', 'Lado b', 'm') : '') + fila('d', 'Distancia del eje al centro d', 'm');
      $('#nota').textContent = 'Deja d vacío (o 0) para el eje por el centro de masas. Para una varilla por un extremo, d = L/2.';
    } else if (sc.modo === 'rodadura') {
      h += `<label for="f-cuerpo">Cuerpo que rueda</label><select id="f-cuerpo" class="in" data-k="cuerpo">${opciones('cuerpo', cuerpos)}</select>`;
      h += fila('M', 'Masa M', 'kg') + fila('L', 'Radio R', 'm') + fila('theta', 'Ángulo del plano θ', '°') + fila('d', 'Distancia que recorre', 'm') + fila('mu', 'Rozamiento estático μ<sub>e</sub>', '') + fila('g', 'Gravedad g', 'm/s²');
      $('#nota').textContent = 'Parte del reposo. Deja μ vacío si solo quieres el caso de rodadura sin deslizar.';
    } else if (sc.modo === 'polea') {
      h += `<label for="f-cuerpo">Polea</label><select id="f-cuerpo" class="in" data-k="cuerpo">${opciones('cuerpo', cuerpos.filter(([k]) => k === 'cilindro' || k === 'aro'))}</select>`;
      h += fila('M', 'Masa de la polea M', 'kg') + fila('L', 'Radio R', 'm') + fila('m', 'Masa que cuelga m', 'kg') + fila('d', 'Altura que baja', 'm') + fila('g', 'Gravedad g', 'm/s²');
      $('#nota').textContent = 'La cuerda está enrollada en la polea, que gira sin rozamiento en su eje. Parte del reposo.';
    } else {
      h += fila('I1', 'Momento de inercia inicial I<sub>1</sub>', 'kg·m²') + fila('w1', 'Velocidad angular inicial ω<sub>1</sub>', '') + `<label for="f-unidad">Unidades de ω</label><select id="f-unidad" class="in" data-k="unidad">${opciones('unidad', [['rpm', 'rpm'], ['rad', 'rad/s']])}</select>` + fila('I2', 'Momento de inercia final I<sub>2</sub>', 'kg·m²');
      $('#nota').textContent = 'Sirve para una patinadora, un taburete giratorio o dos discos que se acoplan (I₂ = suma de los dos, con el segundo parado al principio).';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') { const ej = S.ejemplos.find((x) => x.sc.modo === t.value); sc = copia(ej.sc); }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + S.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = S.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = S.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'inercia') {
      h = dato('Momento de inercia', `I = <b>${f(sol.I)} kg·m<sup>2</sup></b>`) + (sol.d ? dato('Respecto al centro de masas', `I<sub>cm</sub> = ${f(sol.Icm)} kg·m<sup>2</sup>`) : '');
      ley = 'El eje de giro es la línea discontinua; el punto es el centro de masas.';
    } else if (sol.modo === 'rodadura') {
      const r = sol.desliza;
      h = dato(r ? 'Rueda y desliza' : 'Rueda sin deslizar', `a = <b>${f(r ? r.a : sol.a)} m/s<sup>2</sup></b>`) + dato('Al final del plano', `v = <b>${f(r ? r.v : sol.v)} m/s</b>, t = ${f(r ? r.t : sol.t)} s`) + dato('Rozamiento', r ? `μN = ${f(sol.mu * sol.N)} N (dinámico)` : `F<sub>r</sub> = ${f(sol.Fr)} N; hace falta μ<sub>e</sub> ≥ ${f(sol.muMin)}`);
      ley = 'A la derecha, el tiempo que tarda cada cuerpo en recorrer el plano rodando sin deslizar: gana el de menor I/(MR²).';
    } else if (sol.modo === 'polea') {
      h = dato('Aceleración', `a = <b>${f(sol.a)} m/s<sup>2</sup></b>, α = ${f(sol.al)} rad/s<sup>2</sup>`) + dato('Tensión', `T = <b>${f(sol.T)} N</b>`) + dato(`Tras bajar ${f(sol.d)} m`, `v = ${f(sol.v)} m/s, ω = ${f(sol.w)} rad/s`);
      ley = 'Fuerzas sobre el cuerpo que cuelga y la tensión que hace girar la polea.';
    } else {
      h = dato('Velocidad angular final', `ω<sub>2</sub> = <b>${f(sol.w2)} ${sol.rpm ? 'rpm' : 'rad/s'}</b>`) + dato('Momento angular', `L = ${f(sol.L)} kg·m<sup>2</sup>/s`) + dato('Energía cinética', `${f(sol.K1)} J → ${f(sol.K2)} J`);
      ley = 'El tamaño de cada disco va con su momento de inercia; las flechas, con lo rápido que gira.';
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--fuerza', '--tension', '--cuerpo', '--suelo']) col[k] = cs.getPropertyValue(k).trim(); }
  function flecha(g, x0, y0, x1, y1, color, ancho = 2.2) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 2) return;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho;
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(10, L * 0.45);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - p * 0.6 * Math.cos(a), y1 - p * 0.6 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  // flecha curva de giro alrededor de (x, y)
  function giro(g, x, y, r, color, a0 = -2.4, a1 = -0.5, antihorario = false) {
    g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, a0, a1, antihorario); g.stroke();
    const ex = x + r * Math.cos(a1), ey = y + r * Math.sin(a1), t = a1 + (antihorario ? -1 : 1) * Math.PI / 2;
    g.fillStyle = color; g.beginPath(); g.moveTo(ex + 6 * Math.cos(t), ey + 6 * Math.sin(t)); g.lineTo(ex + 5 * Math.cos(t - 2.2), ey + 5 * Math.sin(t - 2.2)); g.lineTo(ex + 5 * Math.cos(t + 2.2), ey + 5 * Math.sin(t + 2.2)); g.closePath(); g.fill();
  }
  function rueda(g, x, y, r, clave) {
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI);
    if (clave === 'aro') { g.lineWidth = Math.max(3, r * 0.18); g.strokeStyle = col['--cuerpo']; g.stroke(); g.lineWidth = 1; g.strokeStyle = col['--muted']; g.beginPath(); g.arc(x, y, r + Math.max(3, r * 0.18) / 2, 0, 2 * Math.PI); g.stroke(); }
    else { g.fill(); g.stroke(); if (clave === 'esfera-hueca') { g.fillStyle = col['--bg']; g.beginPath(); g.arc(x, y, r * 0.8, 0, 2 * Math.PI); g.fill(); g.stroke(); } }
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(x, y, 2.5, 0, 2 * Math.PI); g.fill();
  }

  function dibujaInercia(g, w, h) {
    const C = sol.C, cx = w / 2, cy = h / 2, esc = Math.min(w * 0.6, h * 0.7);
    const med = C.placa ? Math.max(sol.L, +String(sc.b).replace(',', '.') || 0) : sc.cuerpo === 'varilla' ? sol.L : 2 * sol.L;
    const k = esc / Math.max(med, 2 * sol.d, 1e-9) * 0.8;
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    if (sc.cuerpo === 'varilla') { g.fillRect(cx - (sol.L * k) / 2, cy - 5, sol.L * k, 10); g.strokeRect(cx - (sol.L * k) / 2, cy - 5, sol.L * k, 10); }
    else if (C.placa) { const b = (+String(sc.b).replace(',', '.') || 0) * k; g.fillRect(cx - (sol.L * k) / 2, cy - b / 2, sol.L * k, b); g.strokeRect(cx - (sol.L * k) / 2, cy - b / 2, sol.L * k, b); }
    else if (sc.cuerpo === 'disco-diametro') { g.beginPath(); g.ellipse(cx, cy, sol.L * k, sol.L * k * 0.35, 0, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    else rueda(g, cx, cy, sol.L * k, sc.cuerpo);
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(cx, cy, 3, 0, 2 * Math.PI); g.fill();
    texto(g, cx + 8, cy + 14, 'cm', col['--muted'], 'left');
    // eje: perpendicular al dibujo (punto con cruz) o en el plano (línea)
    const ex = cx + sol.d * k, enPlano = C.eje === 'un diámetro';
    g.strokeStyle = col['--accent']; g.lineWidth = 1.6; g.setLineDash([6, 4]);
    if (enPlano) { g.beginPath(); g.moveTo(ex, 10); g.lineTo(ex, h - 10); g.stroke(); }
    g.setLineDash([]);
    if (!enPlano) { g.beginPath(); g.arc(ex, cy, 7, 0, 2 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(ex - 5, cy - 5); g.lineTo(ex + 5, cy + 5); g.moveTo(ex + 5, cy - 5); g.lineTo(ex - 5, cy + 5); g.stroke(); }
    giro(g, ex, enPlano ? 28 : cy, enPlano ? 16 : 22, col['--accent']);
    if (sol.d) { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy + 30); g.lineTo(ex, cy + 30); g.stroke(); texto(g, (cx + ex) / 2, cy + 42, `d = ${txt(f(sol.d))} m`, col['--muted']); }
    texto(g, 12, 16, `I = ${txt(f(sol.I))} kg·m²`, col['--accent'], 'left', '600 ');
  }

  function dibujaRodadura(g, w, h) {
    const t = sol.th * Math.PI / 180, m = 16, Wp = w * 0.55, L = Math.min((Wp - m) / Math.cos(t), (h - 2 * m) / Math.sin(t)), x0 = m, y0 = h - m, xe = x0 + L * Math.cos(t), ye = y0 - L * Math.sin(t);
    g.fillStyle = col['--line']; g.strokeStyle = col['--suelo']; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(xe, ye); g.lineTo(xe, y0); g.closePath(); g.fill(); g.stroke();
    const r = Math.max(10, Math.min(26, L * 0.08)), s = L * 0.7, bx = x0 + s * Math.cos(t) - r * Math.sin(t), by = y0 - s * Math.sin(t) - r * Math.cos(t);
    rueda(g, bx, by, r, sc.cuerpo);
    giro(g, bx, by, r + 8, col['--accent'], -1.0, -2.6, true);
    flecha(g, bx, by, bx - 44 * Math.cos(t), by + 44 * Math.sin(t), col['--accent']);
    texto(g, bx - 54 * Math.cos(t), by + 54 * Math.sin(t) + 2, 'a', col['--accent'], 'center', '600 ');
    texto(g, x0 + 44, y0 - 10, `θ = ${txt(f(sol.th))}°`, col['--muted'], 'left');
    // carrera: tiempo de cada cuerpo
    const xb = Wp + 30, ancho = w - xb - 16, filas = sol.carrera, tmax = Math.max(...filas.map((q) => q.t)), alto = Math.min(34, (h - 40) / filas.length);
    texto(g, xb, 14, 'Tiempo hasta el final del plano', col['--muted'], 'left');
    filas.forEach((q, i) => {
      const y = 34 + i * alto, bw = (q.t / tmax) * (ancho - 50), yo = q.k === sc.cuerpo;
      g.fillStyle = yo ? col['--accent'] : col['--cuerpo']; g.fillRect(xb, y, bw, alto * 0.45);
      texto(g, xb, y + alto * 0.45 + 9, q.nombre.split(' (')[0], yo ? col['--ink'] : col['--muted'], 'left', yo ? '600 ' : '');
      texto(g, xb + bw + 6, y + alto * 0.22, `${txt(f(q.t, 3))} s`, col['--ink'], 'left');
    });
  }

  function dibujaPolea(g, w, h) {
    const cx = w / 2 - 30, cy = 70, R = Math.min(48, h * 0.16), s = 44, yh = Math.min(h - s / 2 - 14, cy + R + 140);
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 60, 8); g.lineTo(cx + 60, 8); g.moveTo(cx, 8); g.lineTo(cx, cy); g.stroke();
    rueda(g, cx, cy, R, sc.cuerpo);
    g.strokeStyle = col['--ink']; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx + R, cy); g.lineTo(cx + R, yh - s / 2); g.stroke();
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.fillRect(cx + R - s / 2, yh - s / 2, s, s); g.strokeRect(cx + R - s / 2, yh - s / 2, s, s); texto(g, cx + R, yh, 'm');
    const k = Math.min(90, h * 0.3) / (sol.m * sol.g);
    flecha(g, cx + R + s / 2 + 18, yh, cx + R + s / 2 + 18, yh + k * sol.m * sol.g, col['--peso']); texto(g, cx + R + s / 2 + 32, yh + k * sol.m * sol.g * 0.7, 'mg', col['--peso'], 'left', '600 ');
    flecha(g, cx + R + s / 2 + 18, yh - 4, cx + R + s / 2 + 18, yh - 4 - k * sol.T, col['--tension']); texto(g, cx + R + s / 2 + 32, yh - 4 - k * sol.T * 0.7, 'T', col['--tension'], 'left', '600 ');
    flecha(g, cx + R + 4, cy + R * 0.2, cx + R + 4, cy + R * 0.2 + k * sol.T, col['--tension']); texto(g, cx + R + 16, cy + R * 0.2 + k * sol.T * 0.6, 'T', col['--tension'], 'left', '600 ');
    giro(g, cx, cy, R + 10, col['--accent'], -2.2, -0.3); texto(g, cx - R - 18, cy - R + 4, 'α', col['--accent'], 'center', '600 ');
    flecha(g, cx + R - s / 2 - 20, yh - 20, cx + R - s / 2 - 20, yh + 20, col['--accent'], 1.6); texto(g, cx + R - s / 2 - 32, yh, 'a', col['--accent'], 'center', '600 ');
  }

  function dibujaMomento(g, w, h) {
    const rmax = Math.min(w / 5, h / 2 - 30), r1 = rmax * Math.sqrt(sol.I1 / Math.max(sol.I1, sol.I2)), r2 = rmax * Math.sqrt(sol.I2 / Math.max(sol.I1, sol.I2));
    const wmax = Math.max(sol.W1, sol.W2), cy = h / 2 + 6;
    [[w * 0.27, r1, sol.W1, 'Antes', sol.I1, sol.w1], [w * 0.73, r2, sol.W2, 'Después', sol.I2, sol.w2]].forEach(([x, r, W, nom, I, ww]) => {
      rueda(g, x, cy, Math.max(r, 8), 'cilindro');
      const arco = 0.6 + 4.6 * (W / wmax);
      giro(g, x, cy, Math.max(r, 8) + 12, col['--accent'], -Math.PI / 2 - arco / 2, -Math.PI / 2 + arco / 2);
      texto(g, x, 16, nom, col['--ink'], 'center', '600 ');
      texto(g, x, h - 14, `I = ${txt(f(I))} kg·m², ω = ${txt(f(ww))} ${sol.rpm ? 'rpm' : 'rad/s'}`, col['--muted']);
    });
    flecha(g, w / 2 - 20, cy, w / 2 + 20, cy, col['--muted'], 1.6);
  }

  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    colores();
    ({ inercia: dibujaInercia, rodadura: dibujaRodadura, polea: dibujaPolea, momento: dibujaMomento })[sol.modo](g, w, h);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('solido-rigido').current;
  formulario(); calcula();
  window.SolidoApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, I: sol.I, a: sol.a, v: sol.v, T: sol.T, w2: sol.w2, rueda: sol.rueda }, estado: () => copia(sc) };
})();
