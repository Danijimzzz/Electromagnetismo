/* =====================================================================
   Distribuciones de probabilidad: interfaz (distribución, parámetros,
   tipo de cálculo, gráfica con el área sombreada y desarrollo).
   El cálculo está en estadistica/calculo.js (Estadistica).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const E = Estadistica, num = E.num, CLAVE = 'estadistica-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const DEF = { mu: '0', sigma: '1', nu: '10', k: '5', lambda: '2', n: '10', p: '0.5', a: '1', b: '2', alfa: '0.05' };

  let sc = copia(E.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && E.DIST[g.dist]) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom) => `<label for="f-${k}">${nom}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? DEF[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  function formulario() {
    const D = E.DIST[sc.dist], tipos = E.tipos(sc.dist);
    if (!tipos.some(([k]) => k === sc.tipo)) sc.tipo = tipos[0][0];
    let h = `<label for="f-dist">Distribución</label><select id="f-dist" class="in" data-k="dist">${Object.entries(E.DIST).map(([k, d]) => `<option value="${k}"${k === sc.dist ? ' selected' : ''}>${d.nombre}</option>`).join('')}</select>`;
    h += D.params.map(([k, nom]) => fila(k, nom)).join('');
    h += `<label for="f-tipo">Qué calcular</label><select id="f-tipo" class="in" data-k="tipo">${tipos.map(([k, t]) => `<option value="${k}"${k === sc.tipo ? ' selected' : ''}>${t.replace('X', D.nombreX)}</option>`).join('')}</select>`;
    const t = sc.tipo;
    if (t === 'cuantil') h += fila('p', 'Probabilidad p');
    else if (t === 'critico') h += fila('alfa', 'Nivel de significación α');
    else if (t === 'entre') h += fila('a', 'Valor a') + fila('b', 'Valor b');
    else h += fila('a', D.continua ? 'Valor a' : 'Valor k');
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'dist') for (const [k] of E.DIST[t.value].params) if (sc[k] === undefined || sc[k] === '') sc[k] = DEF[k];
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + E.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = E.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = { ...sc, ...copia(e.sc) };
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  function calcula() {
    const err = $('#error');
    try { sol = E.calcular(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; dibuja(); return; }
    err.hidden = true; guarda();
    $('#res').innerHTML = `${sol.res}${sol.pct ? `<small>${sol.pct}</small>` : ''}`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--area', '--curva']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const c = $('#grafica'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    if (!sol) return;
    colores();
    const D = E.DIST[sol.dist], P = sol.P, m = { l: 14, r: 14, t: 14, b: 30 };
    let [x0, x1] = D.rango(P);
    const [s0, s1] = sol.sombra;
    // que se vean los extremos pedidos
    for (const v of [s0, s1, sol.x]) if (isFinite(v)) { x0 = Math.min(x0, v - (x1 - x0) * 0.05); x1 = Math.max(x1, v + (x1 - x0) * 0.05); }
    if (!D.continua) { x0 = Math.max(Math.floor(x0), D.rango(P)[0] - 1, 0) - 0.7; x1 = Math.ceil(x1) + 0.7; }
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (w - m.l - m.r);
    const dentro = (x) => x >= s0 - 1e-9 && x <= s1 + 1e-9, critico = sol.tipo === 'critico';
    let ymax = 0;
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
    if (D.continua) {
      const N = 400, xs = Array.from({ length: N + 1 }, (_, i) => x0 + ((x1 - x0) * i) / N), ys = xs.map((x) => D.pdf(P, x)).map((y) => (isFinite(y) ? y : 0));
      ymax = Math.max(...ys.filter((y) => y < 1e6)) * 1.08 || 1;
      const Y = (y) => h - m.b - (Math.min(y, ymax) / ymax) * (h - m.t - m.b);
      // área sombreada (en el valor crítico, las dos colas)
      const zona = (a, b) => { g.beginPath(); g.moveTo(X(a), Y(0)); for (let i = 0; i <= N; i++) { if (xs[i] < a || xs[i] > b) continue; g.lineTo(X(xs[i]), Y(ys[i])); } g.lineTo(X(b), Y(0)); g.closePath(); g.fill(); };
      g.fillStyle = col['--area'];
      if (critico) { zona(x0, s0); zona(s1, x1); } else zona(Math.max(s0, x0), Math.min(s1, x1));
      g.strokeStyle = col['--curva']; g.lineWidth = 2; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(X(x), Y(ys[i])) : g.moveTo(X(x), Y(ys[i])))); g.stroke(); g.lineWidth = 1;
    } else {
      const ks = []; for (let k = Math.ceil(x0); k <= x1; k++) if (k >= 0) ks.push(k);
      const ys = ks.map((k) => D.pmf(P, k));
      ymax = Math.max(...ys) * 1.08 || 1;
      const Y = (y) => h - m.b - (y / ymax) * (h - m.t - m.b), bw = Math.max(1, Math.min(28, ((w - m.l - m.r) / Math.max(1, x1 - x0)) * 0.7));
      ks.forEach((k, i) => { g.fillStyle = dentro(k) ? col['--accent'] : col['--line']; g.fillRect(X(k) - bw / 2, Y(ys[i]), bw, Y(0) - Y(ys[i])); });
      // números de k bajo las barras (cada 1, 2, 5 o 10 según cuántas haya)
      const paso = [1, 2, 5, 10, 20, 50, 100, 1000].find((q) => ks.length / q <= 16) || 1000;
      g.fillStyle = col['--muted']; g.font = '11px "IBM Plex Sans", system-ui, sans-serif';
      ks.forEach((k) => { if (k % paso === 0) g.fillText(String(k), X(k), h - m.b + 20); });
      g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    }
    // eje y marcas
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(m.l, h - m.b); g.lineTo(w - m.r, h - m.b); g.stroke();
    g.fillStyle = col['--muted'];
    const marcas = D.continua ? [...new Set([s0, s1, sol.x].filter((v) => v !== null && v !== undefined && isFinite(v)))] : [];
    for (const v of marcas) { g.beginPath(); g.moveTo(X(v), h - m.b); g.lineTo(X(v), h - m.b + 5); g.stroke(); g.fillStyle = col['--ink']; g.fillText(num(v, 4).replace(/<[^>]+>/g, ''), X(v), h - m.b + 8); }
    if (D.continua && isFinite(sol.media) && !marcas.some((v) => Math.abs(X(v) - X(sol.media)) < 40)) { g.fillStyle = col['--muted']; g.fillText(`media ${num(sol.media, 4).replace(/<[^>]+>/g, '')}`, X(sol.media), h - m.b + 8); }
    g.textAlign = 'left'; g.fillStyle = col['--accent']; g.font = '600 13px "IBM Plex Sans", system-ui, sans-serif';
    if (sol.tipo !== 'cuantil') g.fillText(critico ? `α = ${num(sol.alfa)} (α/2 en cada cola)` : `P = ${E.prob(sol.p)}`, m.l + 4, m.t);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('estadistica').current;
  formulario(); calcula();
  window.EstadisticaApp = { abrirEjemplo, resultado: () => sol && { p: sol.p, res: sol.res, x: sol.x, c: sol.c }, estado: () => copia(sc) };
})();
