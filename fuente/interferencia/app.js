/* =====================================================================
   Interferencia y difracción: interfaz (formulario por montaje,
   resultado, dibujo del montaje con las ondas que salen de las rendijas,
   patrón de intensidad en la pantalla con el color de la luz, órdenes de
   una red y la luz que refleja una lámina delgada, y el desarrollo).
   El cálculo está en interferencia/fisica.js (Interferencia).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const IF = Interferencia, f = IF.f, CLAVE = 'interferencia-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['young', 'Doble rendija de Young'], ['rendija', 'Rendija simple (difracción)'], ['red', 'Red de difracción'], ['lamina', 'Lámina delgada']];

  let sc = copia(IF.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    young: 'Luz monocromática que pasa por dos rendijas muy finas. Si das la anchura a de cada rendija se añade la envolvente de difracción. El índice n es el del medio entre las rendijas y la pantalla (1 en aire).',
    rendija: 'La rendija tiene que ser estrecha, del orden de la longitud de onda (décimas o centésimas de mm), para que la difracción se note.',
    red: 'Una red se suele dar por sus líneas por milímetro: d = 1/N. La anchura iluminada sirve para el poder de resolución.',
    lamina: 'Luz que llega perpendicular a una lámina de espesor t, como una pompa de jabón, una mancha de aceite o una capa antirreflectante.',
  };
  function formulario() {
    let h = elige('modo', 'Montaje', MODOS);
    if (sc.modo === 'young') h += fila('lambda', 'Longitud de onda λ', 'nm') + fila('d', 'Separación entre rendijas d', 'mm') + fila('L', 'Distancia a la pantalla L', 'm') + sep('Opcional') + fila('m', 'Orden m del máximo') + fila('y', 'Posición y en la pantalla', 'mm') + fila('a', 'Anchura de cada rendija a', 'mm') + fila('n', 'Índice del medio n');
    else if (sc.modo === 'rendija') h += fila('lambda', 'Longitud de onda λ', 'nm') + fila('a', 'Anchura de la rendija a', 'mm') + fila('L', 'Distancia a la pantalla L', 'm') + fila('m', 'Orden m del mínimo') + sep('Opcional') + fila('y', 'Posición y en la pantalla', 'mm') + fila('n', 'Índice del medio n');
    else if (sc.modo === 'red') h += fila('lambda', 'Longitud de onda λ', 'nm') + fila('N', 'Líneas por milímetro N') + sep('Opcional') + fila('L', 'Distancia a la pantalla L', 'm') + fila('lambda2', 'Otra longitud de onda λ₂', 'nm') + fila('W', 'Anchura iluminada de la red', 'mm');
    else h += fila('nl', 'Índice de la lámina n') + fila('n1', 'Índice del medio de arriba n₁') + fila('n2', 'Índice del medio de abajo n₂') + fila('t', 'Espesor t', 'nm') + fila('lambda', 'Longitud de onda λ', 'nm');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName !== 'SELECT') return; sc = copia(IF.ejemplos.find((x) => x.sc.modo === t.value).sc); formulario(); cambia(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${IF.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = IF.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const lam = String(de([450, 500, 546, 550, 589, 600, 633, 650]));
    const tipos = [
      () => ({ modo: 'young', lambda: lam, d: c(de([0.1, 0.2, 0.25, 0.3, 0.5])), L: c(de([1, 1.2, 1.5, 2, 3])), n: '', a: '', m: String(ent(1, 5)), y: '' }),
      () => ({ modo: 'rendija', lambda: lam, a: c(de([0.02, 0.05, 0.1, 0.2])), L: c(de([1, 1.5, 2])), n: '', m: String(ent(1, 3)), y: '' }),
      () => ({ modo: 'red', lambda: lam, N: String(de([100, 200, 300, 500, 600, 800])), L: Math.random() < 0.5 ? '' : c(de([0.5, 1, 2])), lambda2: '', W: '' }),
      () => ({ modo: 'lamina', nl: c(de([1.33, 1.38, 1.45, 1.5])), n1: '1', n2: c(de([1, 1, 1.33, 1.52])), t: String(de([100, 200, 300, 400, 500])), lambda: Math.random() < 0.5 ? '' : lam }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'young') return `En un experimento de Young con luz de ${esc(sc.lambda)} nm, las rendijas están separadas ${esc(sc.d)} mm y la pantalla a ${esc(sc.L)} m. Calcula la interfranja${sc.m ? `, la posición del máximo de orden ${esc(sc.m)}` : ''}${sc.y ? ` y la intensidad relativa a ${esc(sc.y)} mm del centro` : ''}.`;
    if (sc.modo === 'rendija') return `Luz de ${esc(sc.lambda)} nm pasa por una rendija de ${esc(sc.a)} mm y llega a una pantalla a ${esc(sc.L)} m. Calcula el ángulo y la posición del mínimo de orden ${esc(sc.m || 1)} y la anchura del máximo central.`;
    if (sc.modo === 'red') return `Una red de difracción de ${esc(sc.N)} líneas/mm se ilumina con luz de ${esc(sc.lambda)} nm. Calcula los ángulos de los máximos y el orden máximo que se observa.`;
    return `Una lámina de índice ${esc(sc.nl)}${sc.t ? ` y espesor ${esc(sc.t)} nm` : ''} está entre un medio de índice ${esc(sc.n1 || 1)} y otro de índice ${esc(sc.n2 || 1)}. ${sc.t ? '¿Qué colores visibles se refuerzan y cuáles se anulan en la luz reflejada?' : ''}${sc.lambda ? ` ¿Qué espesor mínimo refuerza y cuál anula la reflexión de ${esc(sc.lambda)} nm?` : ''}`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = IF.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h = '';
    if (sol.modo === 'young') {
      h = dato('Interfranja', `Δy = <b>${f(sol.dy * 1e3)} mm</b>`) + dato('Orden máximo', `m<sub>máx</sub> = ${sol.mmax}`);
      if (sol.m !== null) h += dato(`Ángulo del máximo m = ${sol.m}`, `θ = <b>${f((sol.th * 180) / Math.PI)}°</b>`) + dato(`Posición del máximo m = ${sol.m}`, `y = <b>${f(sol.ym * 1e3)} mm</b>`);
      if (sol.Iy !== null) h += dato(`Intensidad en y = ${f(sol.y)} mm`, `I/I<sub>máx</sub> = <b>${f(sol.Iy)}</b>`);
    } else if (sol.modo === 'rendija') {
      h = dato(`Ángulo del mínimo m = ${sol.m}`, `θ = <b>${f((sol.th * 180) / Math.PI)}°</b>`) + dato(`Posición del mínimo m = ${sol.m}`, `y = <b>${f(sol.ym * 1e3)} mm</b>`) + dato('Anchura del máximo central', `<b>${f(sol.ancho * 1e3)} mm</b>`);
      if (sol.Iy !== null) h += dato(`Intensidad en y = ${f(sol.y)} mm`, `I/I<sub>0</sub> = <b>${f(sol.Iy)}</b>`);
    } else if (sol.modo === 'red') {
      h = dato('Paso de la red', `d = ${f(sol.d * 1e9)} nm`) + dato('Orden máximo', `m<sub>máx</sub> = <b>${sol.mmax}</b>`) + sol.ords.slice(0, 4).map((o) => dato(`Ángulo del orden ${o.m}`, `θ = <b>${f((o.th * 180) / Math.PI)}°</b>`)).join('');
      if (sol.sep !== null) h += dato('Separación de λ y λ₂ (orden 1)', `Δθ = ${f(Math.abs(sol.sep))}°`);
    } else {
      h = dato('Desfase extra al reflejarse', `<b>${sol.medio ? 'sí, λ/2' : 'no'}</b>`);
      if (sol.t !== null) h += dato('Se refuerzan', sol.refuerzan.length ? sol.refuerzan.map((l) => `<b>${f(l)} nm</b>`).join(', ') : 'ninguna visible') + dato('Se anulan', sol.anulan.length ? sol.anulan.map((l) => `${f(l)} nm`).join(', ') : 'ninguna visible');
      if (sol.tmin !== null) h += dato('Espesor mínimo con refuerzo', `t = <b>${f(sol.tmin)} nm</b>`) + dato('Espesor mínimo que anula', `t = <b>${f(sol.tmin2)} nm</b>`);
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#leyenda').textContent = sol.modo === 'lamina' ? 'Arriba, los dos rayos reflejados que interfieren. Abajo, cuánto se refleja cada color y el color que se ve.' : sol.modo === 'red' ? 'Arriba, la red y los haces de cada orden. Abajo, dónde salen los máximos (sen θ).' : 'Arriba, las ondas que salen de las rendijas (no a escala). Abajo, la intensidad en la pantalla y cómo se ven las franjas.';
    dibuja();
  }

  /* ---------- Dibujos ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--bg', '--panel']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => {
    const c = $(s), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  };
  const FU = '"IBM Plex Sans", system-ui, sans-serif';
  const rgb = (nm, a = 1) => { const [r, g, b] = IF.color(nm); return `rgba(${r},${g},${b},${a})`; };
  const luz = () => (sol.modo === 'lamina' ? sol.l0 || 550 : sol.l0);
  function dibuja() { montaje(); patron(); }
  function montaje() {
    const { g, w, h } = lienzo('#montaje');
    if (!sol) return;
    if (!col['--ink']) colores();
    const nm = luz(), paso = 16, avance = (tA * 30) % paso;
    g.font = `12px ${FU}`;
    if (sol.modo === 'lamina') return lamina(g, w, h, avance);
    const xb = w * 0.32, xs = w - 40, yc = h / 2;
    // ondas planas que llegan
    g.lineWidth = 1.5;
    for (let x = 20 + avance; x < xb; x += paso) { g.strokeStyle = rgb(nm, 0.55); g.beginPath(); g.moveTo(x, 14); g.lineTo(x, h - 14); g.stroke(); }
    // rendijas
    const nR = sol.modo === 'young' ? 2 : sol.modo === 'rendija' ? 1 : 9, sepR = sol.modo === 'red' ? 9 : 34, ys = Array.from({ length: nR }, (_, i) => yc + (i - (nR - 1) / 2) * sepR), hueco = sol.modo === 'rendija' ? 22 : 4;
    g.fillStyle = col['--ink']; g.fillRect(xb - 3, 8, 6, h - 16);
    g.globalCompositeOperation = 'destination-out'; for (const y of ys) g.fillRect(xb - 4, y - hueco / 2, 8, hueco); g.globalCompositeOperation = 'source-over';
    // ondas que salen de cada rendija
    g.save(); g.beginPath(); g.rect(xb + 3, 0, xs - xb - 3, h); g.clip();
    for (const y of ys) for (let r = avance; r < xs - xb + paso; r += paso) { g.strokeStyle = rgb(nm, Math.max(0.05, 0.5 * (1 - r / (xs - xb)) / Math.sqrt(nR / 2))); g.lineWidth = 1.2; g.beginPath(); g.arc(xb, y, r, -Math.PI / 2, Math.PI / 2); g.stroke(); }
    g.restore();
    if (sol.modo === 'red') {
      // haces de cada orden (ángulos reales)
      g.lineWidth = 2; for (const o of [{ m: 0, th: 0 }, ...sol.ords]) for (const s of o.m ? [1, -1] : [1]) { const L = xs - xb, x2 = xb + L * Math.cos(o.th), y2 = yc - s * L * Math.sin(o.th); g.strokeStyle = rgb(nm, 0.9); g.beginPath(); g.moveTo(xb, yc); g.lineTo(x2, y2); g.stroke(); g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle'; if (Math.abs(y2 - yc) < h / 2 - 8) g.fillText(`m = ${s * o.m}`, Math.min(x2 + 4, w - 40), y2); }
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(`${txt(f(sol.N))} líneas/mm`, xb, h - 1);
      return;
    }
    // pantalla con las franjas
    const Y = sol.modo === 'young' ? sol.ancho : sol.anchoV, alto = h - 20;
    for (let i = 0; i < alto; i++) { const yy = ((i - alto / 2) / alto) * Y; g.fillStyle = rgb(nm, sol.I(-yy)); g.fillRect(xs, 10 + i, 14, 1); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.strokeRect(xs, 10, 14, alto);
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('pantalla', xs + 7, h - 0); g.fillText(sol.modo === 'young' ? `d = ${txt(f(sol.d * 1e3))} mm` : `a = ${txt(f(sol.a * 1e3))} mm`, xb, h - 0);
  }
  function lamina(g, w, h, avance) {
    const y1 = h * 0.45, y2 = h * 0.72, x0 = w * 0.18, nm = luz();
    g.fillStyle = col['--bg']; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,160,220,0.22)'; g.fillRect(0, y1, w, y2 - y1);
    if (sol.n2 > 1.001) { g.fillStyle = 'rgba(120,160,220,0.10)'; g.fillRect(0, y2, w, h - y2); }
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText(`n₁ = ${txt(f(sol.n1))}`, w - 10, y1 / 2); g.fillText(`n = ${txt(f(sol.nf))}${sol.t !== null ? `, t = ${txt(f(sol.t))} nm` : ''}`, w - 10, (y1 + y2) / 2); g.fillText(`n₂ = ${txt(f(sol.n2))}`, w - 10, (y2 + h) / 2);
    // rayo incidente (inclinado para que se vea) y los dos reflejados
    const dx = 70, xa = x0 + dx, xb2 = xa + dx * 0.7, xc = xb2 + dx * 0.7;
    const rayo = (pts, c, fase0) => {
      g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      // marcas de las crestas que avanzan
      let acc = 0; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay); for (let s = ((fase0 + avance - acc) % 16 + 16) % 16; s < L; s += 16) { const x = ax + ((bx - ax) * s) / L, y = ay + ((by - ay) * s) / L; g.fillStyle = c; g.beginPath(); g.arc(x, y, 2.2, 0, 2 * Math.PI); g.fill(); } acc += L; }
    };
    rayo([[x0 - dx * 0.2, 10], [xa, y1]], rgb(nm), 0);
    rayo([[xa, y1], [xa + dx * 1.2, 10]], rgb(nm, 0.9), 0);
    rayo([[xa, y1], [xb2, y2], [xc, y1], [xc + dx * 1.2, 10]], rgb(nm, 0.7), sol.medio ? 8 : 0);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('1', xa + dx * 1.2 + 4, 8); g.fillText('2', xc + dx * 1.2 + 4, 8);
    // color que se ve en reflexión
    const [r, gg, b] = visto(); g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(w * 0.62, 14, 46, 46); g.strokeStyle = col['--line']; g.strokeRect(w * 0.62, 14, 46, 46);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('color reflejado', w * 0.62 + 54, 37);
  }
  // color de la luz blanca reflejada: suma de los colores pesada por la reflexión
  function visto() {
    if (sol.t === null) return IF.color(sol.l0);
    let s = [0, 0, 0], n = 0;
    for (let l = 400; l <= 700; l += 5) { const c = IF.color(l), R = sol.R(l); s = s.map((v, i) => v + c[i] * R); n++; }
    const m = Math.max(...s) || 1; return s.map((v) => Math.round((255 * v) / m * Math.min(1, (2.2 * m) / (n * 255))));
  }
  function patron() {
    const { g, w, h } = lienzo('#patron');
    if (!sol) return;
    const mL = 40, mR = 14, mT = 14, mB = 52;
    g.font = `11px ${FU}`;
    if (sol.modo === 'lamina') {
      if (sol.t === null) { g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Da un espesor t para ver qué colores se reflejan.', w / 2, h / 2); return; }
      const X = (l) => mL + ((l - 380) / 370) * (w - mL - mR), Y = (r) => mT + (1 - r) * (h - mT - mB);
      for (let l = 380; l < 750; l++) { g.fillStyle = rgb(l, 0.35); g.fillRect(X(l), mT, X(l + 1) - X(l) + 0.5, h - mT - mB); }
      g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.beginPath(); for (let l = 380; l <= 750; l++) { const x = X(l), y = Y(sol.R(l)); l === 380 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; for (let l = 400; l <= 700; l += 50) g.fillText(`${l} nm`, X(l), h - mB + 4);
      g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('máx', mL - 4, Y(1)); g.fillText('0', mL - 4, Y(0));
      g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('Reflexión relativa de cada longitud de onda', mL, h - mB + 22);
      return;
    }
    if (sol.modo === 'red') {
      const X = (s) => mL + ((s + 1) / 2) * (w - mL - mR);
      g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(mL, h - mB); g.lineTo(w - mR, h - mB); g.stroke();
      const lineas = (lam, c, alto) => { for (let m = -sol.mmax - 1; m <= sol.mmax + 1; m++) { const s = (m * lam) / sol.d; if (Math.abs(s) > 1) continue; g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(X(s), h - mB); g.lineTo(X(s), mT + alto); g.stroke(); } };
      lineas(sol.lam, rgb(sol.l0), 0); if (sol.l2 !== null) lineas(sol.l2 * 1e-9, rgb(sol.l2, 0.8), 20);
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
      for (let m = -sol.mmax; m <= sol.mmax; m++) g.fillText(`${m}`, X((m * sol.lam) / sol.d), h - mB + 4);
      for (const s of [-0.5, 0, 0.5]) g.fillText(`sen θ = ${txt(f(s))}`, X(s), h - mB + 22);
      return;
    }
    const Y0 = sol.modo === 'young' ? sol.ancho : sol.anchoV, X = (y) => mL + ((y / Y0) + 0.5) * (w - mL - mR), Yc = (i) => mT + (1 - i) * (h - mT - mB - 22);
    // franjas como se verían
    for (let x = mL; x < w - mR; x++) { const y = ((x - mL) / (w - mL - mR) - 0.5) * Y0; g.fillStyle = rgb(sol.l0, sol.I(y)); g.fillRect(x, h - mB - 18, 1.5, 16); }
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(mL, Yc(0)); g.lineTo(w - mR, Yc(0)); g.stroke();
    g.strokeStyle = col['--accent']; g.lineWidth = 2.2; g.beginPath(); for (let x = mL; x <= w - mR; x++) { const y = ((x - mL) / (w - mL - mR) - 0.5) * Y0, v = Yc(sol.I(y)); x === mL ? g.moveTo(x, v) : g.lineTo(x, v); } g.stroke();
    // marcas en mm
    const p0 = (Y0 * 1e3) / 8, e = 10 ** Math.floor(Math.log10(p0)), st = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0);
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (let v = Math.ceil((-Y0 * 500) / st) * st; v <= Y0 * 500; v += st) g.fillText(txt(f(Math.abs(v) < st * 1e-6 ? 0 : v)), X(v / 1e3), h - mB + 4);
    g.fillText('y (mm)', w - mR - 16, h - mB + 22);
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('I', mL - 8, Yc(1)); g.fillText('0', mL - 8, Yc(0));
    const marca = (yv, c) => { if (yv === null || Math.abs(yv) > Y0 / 2) return; g.fillStyle = c; g.beginPath(); g.arc(X(yv), Yc(sol.I(yv)), 5, 0, 2 * Math.PI); g.fill(); };
    if (sol.ym !== null) marca(sol.ym, col['--ink']); if (sol.y !== null) marca(sol.y * 1e-3, col['--accent']);
  }

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; montaje(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('interferencia').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.InterferenciaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, dy: sol.dy, ym: sol.ym, mmax: sol.mmax }, estado: () => copia(sc) };
})();
