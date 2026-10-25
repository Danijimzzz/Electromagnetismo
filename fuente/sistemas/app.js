/* =====================================================================
   Sistemas de ecuaciones lineales: interfaz (método, nombres de las
   incógnitas, coeficientes, resultado y desarrollo). El cálculo está en
   sistemas/calculo.js (Sistemas) y matematicas/algebra.js (Algebra).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const X = Sistemas, CLAVE = 'sistemas-v1', MAX = 6;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));

  let sc = copia(X.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && Array.isArray(g.M) && g.M.length) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };

  const selMet = $('#metodo');
  selMet.innerHTML = X.METODOS.map(([k, t]) => `<option value="${k}">${t}</option>`).join('');
  selMet.addEventListener('change', () => { sc.metodo = selMet.value; $('#ejemplos').value = ''; calcula(); });
  $('#vars').addEventListener('input', () => { sc.vars = $('#vars').value; $('#ejemplos').value = ''; cabeceras(); calcula(); });

  /* ---------- Editor ---------- */
  const opciones = (v) => Array.from({ length: MAX }, (_, i) => `<option${i + 1 === v ? ' selected' : ''}>${i + 1}</option>`).join('');
  function nombres() { try { return X.nombres(sc.M[0].length - 1, sc.vars); } catch (e) { return X.nombres(sc.M[0].length - 1); } }
  function editor() {
    const m = sc.M.length, n = sc.M[0].length - 1;
    $('#ed').innerHTML = `<div class="editor-cab"><label>Ecuaciones <select data-d="m" class="in" aria-label="Número de ecuaciones">${opciones(m)}</select></label><label>Incógnitas <select data-d="n" class="in" aria-label="Número de incógnitas">${opciones(n)}</select></label><button class="btn" type="button" data-acc="ceros">Ceros</button></div>
      <div class="rejilla" style="grid-template-columns:repeat(${n}, minmax(44px, 64px)) minmax(50px, 72px)">
        <span class="cabeza" id="cab"></span>
        ${sc.M.map((f, i) => f.map((v, j) => `<input data-i="${i}" data-j="${j}" value="${esc(v)}"${j === n ? ' class="sep-b"' : ''} aria-label="Ecuación ${i + 1}, ${j === n ? 'término independiente' : `coeficiente ${j + 1}`}" autocomplete="off" spellcheck="false">`).join('')).join('')}
      </div>`;
    cabeceras();
  }
  // nombres de las columnas encima de la rejilla
  function cabeceras() {
    const c = $('#cab');
    if (!c) return;
    const v = nombres();
    c.outerHTML = `<span id="cab" style="display:contents">${v.map((x) => `<span class="cabeza">${x}</span>`).join('')}<span class="cabeza">= b</span></span>`;
  }
  const ed = $('#ed');
  ed.addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; sc.M[+t.dataset.i][+t.dataset.j] = t.value; $('#ejemplos').value = ''; calcula(); });
  ed.addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    const M = sc.M, m = t.dataset.d === 'm' ? +t.value : M.length, n = t.dataset.d === 'n' ? +t.value : M[0].length - 1, n0 = M[0].length - 1;
    sc.M = Array.from({ length: m }, (_, i) => [...Array.from({ length: n }, (_, j) => (M[i] && j < n0 ? M[i][j] : '0')), M[i] ? M[i][n0] : '0']);
    if (t.dataset.d === 'n') { sc.vars = ''; $('#vars').value = ''; }
    $('#ejemplos').value = ''; editor(); calcula();
  });
  ed.addEventListener('click', (e) => { if (e.target.dataset.acc !== 'ceros') return; sc.M = sc.M.map((f) => f.map(() => '0')); $('#ejemplos').value = ''; editor(); calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + X.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = X.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = { vars: '', ...copia(e.sc) };
    rellena(); calcula(); sel.value = clave;
  }
  function rellena() { selMet.value = sc.metodo || 'gauss'; $('#vars').value = sc.vars || ''; editor(); }

  /* ---------- Cálculo ---------- */
  let sol = null;
  function calcula() {
    const err = $('#error');
    try { sol = X.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#tipo').textContent = ''; $('#pasos').innerHTML = ''; dibuja(); return; }
    err.hidden = true; guarda();
    $('#res').innerHTML = sol.res;
    $('#tipo').textContent = `Sistema ${sol.descripcion}.`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Escribir las ecuaciones ---------- */
  $('#usar-texto').addEventListener('click', () => {
    const e = $('#texto-err');
    try { const r = X.leeTexto($('#texto').value); sc.M = r.M; sc.vars = r.vars; e.textContent = ''; $('#ejemplos').value = ''; rellena(); calcula(); }
    catch (x) { e.textContent = x.message; }
  });

  /* ---------- Las rectas (dos incógnitas) ---------- */
  const COL = ['--accent', '#2e86c1', '#d35400', '#27ae60', '#c0392b', '#7f8c8d'];
  function dibuja() {
    const card = $('#geo-card'), M = sol && sol.M;
    const ok = sol && sol.tipo !== 'PARAM' && sol.n === 2 && M && M.flat().every(Number.isFinite);
    card.hidden = !ok;
    if (!ok) return;
    const cv = $('#geo'), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement), v = (k) => cs.getPropertyValue(k).trim();
    g.fillStyle = v('--panel'); g.fillRect(0, 0, W, H);
    // ventana: alrededor de la solución, o de los cortes con los ejes
    const pts = [];
    if (sol.tipo === 'SCD') pts.push([+sol.sol[0].c.re.n.toString() / +sol.sol[0].c.re.d.toString(), +sol.sol[1].c.re.n.toString() / +sol.sol[1].c.re.d.toString()]);
    if (sol.mc) pts.push(sol.mc.x.map((q) => Number(q.re.n) / Number(q.re.d)));
    for (const [a, b, c] of M) { if (a) pts.push([c / a, 0]); if (b) pts.push([0, c / b]); }
    const xs = pts.map((p) => p[0]).filter(Number.isFinite), ys = pts.map((p) => p[1]).filter(Number.isFinite);
    let x1 = Math.min(0, ...xs), x2 = Math.max(0, ...xs), y1 = Math.min(0, ...ys), y2 = Math.max(0, ...ys);
    const span = Math.max(x2 - x1, y2 - y1, 2) * 0.65, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, asp = W / H;
    x1 = cx - span * asp; x2 = cx + span * asp; y1 = cy - span; y2 = cy + span;
    const X_ = (x) => ((x - x1) / (x2 - x1)) * W, Y_ = (y) => H - ((y - y1) / (y2 - y1)) * H;
    // cuadrícula y ejes
    const paso = Math.pow(10, Math.floor(Math.log10((x2 - x1) / 8))) * ([1, 2, 5].find((k) => ((x2 - x1) / 8) / Math.pow(10, Math.floor(Math.log10((x2 - x1) / 8))) <= k) || 10);
    g.strokeStyle = v('--line'); g.lineWidth = 1; g.font = '11px ' + v('--f-ui'); g.fillStyle = v('--muted');
    for (let x = Math.ceil(x1 / paso) * paso; x <= x2; x += paso) { g.beginPath(); g.moveTo(X_(x), 0); g.lineTo(X_(x), H); g.stroke(); if (Math.abs(x) > 1e-9) g.fillText(String(+x.toPrecision(4)).replace('.', ','), X_(x) + 2, Math.min(H - 4, Math.max(12, Y_(0) - 4))); }
    for (let y = Math.ceil(y1 / paso) * paso; y <= y2; y += paso) { g.beginPath(); g.moveTo(0, Y_(y)); g.lineTo(W, Y_(y)); g.stroke(); if (Math.abs(y) > 1e-9) g.fillText(String(+y.toPrecision(4)).replace('.', ','), Math.min(W - 30, Math.max(2, X_(0) + 3)), Y_(y) - 3); }
    g.strokeStyle = v('--muted'); g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(0, Y_(0)); g.lineTo(W, Y_(0)); g.moveTo(X_(0), 0); g.lineTo(X_(0), H); g.stroke();
    // cada ecuación a x + b y = c
    M.forEach(([a, b, c], i) => {
      if (!a && !b) return;
      g.strokeStyle = COL[i % COL.length].startsWith('--') ? v(COL[i % COL.length]) : COL[i % COL.length]; g.lineWidth = 2.2;
      g.beginPath();
      if (Math.abs(b) > 1e-12) { g.moveTo(X_(x1), Y_((c - a * x1) / b)); g.lineTo(X_(x2), Y_((c - a * x2) / b)); }
      else { g.moveTo(X_(c / a), 0); g.lineTo(X_(c / a), H); }
      g.stroke();
    });
    const punto = (p, col) => { g.fillStyle = col; g.strokeStyle = v('--panel'); g.lineWidth = 2; g.beginPath(); g.arc(X_(p[0]), Y_(p[1]), 5, 0, 2 * Math.PI); g.fill(); g.stroke(); };
    if (sol.tipo === 'SCD') punto(pts[0], v('--ink'));
    if (sol.mc) punto(sol.mc.x.map((q) => Number(q.re.n) / Number(q.re.d)), v('--muted'));
    const geo = sol.pasos.find((p) => p.geo);
    $('#geo-nota').innerHTML = `${M.map((_, i) => `<span style="color:${COL[i % COL.length].startsWith('--') ? v(COL[i % COL.length]) : COL[i % COL.length]}">━ (${i + 1})</span>`).join(' &nbsp;')}${geo ? ' &nbsp;' + geo.html.replace(/^Cada ecuación[^.]*\. /, '') : ''}${sol.mc ? ' El punto gris es la solución por mínimos cuadrados.' : ''}`;
  }
  window.addEventListener('resize', () => { if (sol) dibuja(); });
  new MutationObserver(() => { if (sol) dibuja(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('sistemas').current;
  rellena(); calcula();
  window.SistemasApp = { abrirEjemplo, resultado: () => sol && { tipo: sol.tipo, res: sol.res }, estado: () => copia(sc) };
})();
