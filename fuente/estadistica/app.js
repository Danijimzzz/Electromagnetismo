/* =====================================================================
   Distribuciones de probabilidad: interfaz (distribución, parámetros,
   tipo de cálculo, gráfica con el área sombreada que se puede arrastrar,
   desarrollo con la tabla de valores y ejercicios para el modo práctica).
   El cálculo está en estadistica/calculo.js (Estadistica).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const E = Estadistica, num = E.num, CLAVE = 'estadistica-v1';
  const DEF = { mu: '0', sigma: '1', nu: '10', k: '5', d1: '5', d2: '10', lambda: '2', lo: '0', hi: '10', n: '10', p: '0.5', N: '50', K: '10', q: '0.5', a: '1', b: '2', cc: '1', alfa: '0.05', incog: 'mu', cola: 'menor' };

  let sc = copia(E.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && E.DIST[g.dist]) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {}, vista = null, arrastra = null, enun = '';

  /* ---------- Formulario ---------- */
  const fila = (k, nom) => (sc[k] === undefined && DEF[k] !== undefined && (sc[k] = DEF[k]), `<label for="f-${k}">${nom}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? DEF[k] ?? '')}" inputmode="decimal" autocomplete="off">`);
  const opciones = (k, nom, ops) => (sc[k] = ops.some(([v]) => v === sc[k]) ? sc[k] : ops[0][0], `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${ops.map(([v, t]) => `<option value="${v}"${v === sc[k] ? ' selected' : ''}>${t}</option>`).join('')}</select>`);
  function formulario() {
    const D = E.DIST[sc.dist], tipos = E.tipos(sc.dist);
    if (!tipos.some(([k]) => k === sc.tipo)) sc.tipo = tipos[0][0];
    let h = `<label for="f-dist">Distribución</label><select id="f-dist" class="in" data-k="dist">${Object.entries(E.DIST).map(([k, d]) => `<option value="${k}"${k === sc.dist ? ' selected' : ''}>${d.nombre}</option>`).join('')}</select>`;
    const incog = sc.tipo === 'inverso' ? (sc.incog === 'sigma' ? 'sigma' : 'mu') : null;
    h += D.params.filter(([k]) => k !== incog).map(([k, nom]) => fila(k, nom)).join('');
    h += `<label for="f-tipo">Qué calcular</label><select id="f-tipo" class="in" data-k="tipo">${tipos.map(([k, t]) => `<option value="${k}"${k === sc.tipo ? ' selected' : ''}>${t.replace('X', D.nombreX)}</option>`).join('')}</select>`;
    const t = sc.tipo;
    if (t === 'cuantil') h += fila('q', 'Probabilidad p');
    else if (t === 'critico' || t === 'criticoU') h += fila('alfa', 'Nivel de significación α');
    else if (t === 'centro') h += fila('cc', 'Distancia c a la media');
    else if (t === 'inverso') h += opciones('incog', 'Incógnita', [['mu', 'La media μ'], ['sigma', 'La desviación típica σ']]) + opciones('cola', 'Se sabe que', [['menor', 'P(X ≤ a) = p'], ['mayor', 'P(X ≥ a) = p']]) + fila('a', 'Valor a') + fila('q', 'Probabilidad p');
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
  // un ejercicio con enunciado para el modo práctica
  function azar() { const e = E.ejercicio(); sc = { ...sc, ...e.sc }; enun = e.enunciado; formulario(); calcula(); sel.value = ''; }
  const enunciado = () => esc(enun);

  /* ---------- Cálculo ---------- */
  function calcula() {
    const err = $('#error');
    try { sol = E.calcular(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; dibuja(); return; }
    err.hidden = true; guarda();
    $('#res').innerHTML = `${sol.res}${sol.pct ? `<small>${sol.pct}</small>` : ''}`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }
  // copiar la tabla de valores (separada por tabuladores, para pegarla en una hoja de cálculo)
  $('#pasos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-copiar]');
    if (!b) return;
    const t = [...b.previousElementSibling.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => c.textContent).join('\t')).join('\n');
    const ok = () => { b.textContent = 'Copiada ✓'; setTimeout(() => { b.textContent = 'Copiar la tabla'; }, 1500); };
    try { navigator.clipboard.writeText(t).then(ok, () => { b.textContent = 'No se ha podido copiar'; }); } catch (err) { b.textContent = 'No se ha podido copiar'; }
  });

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--area', '--curva']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const c = $('#grafica'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    vista = null;
    if (!sol) return;
    colores();
    const D = E.DIST[sol.dist], P = sol.P, m = { l: 14, r: 14, t: 14, b: 30 };
    let [x0, x1] = D.rango(P);
    const [s0, s1] = sol.sombra;
    // que se vean los extremos pedidos
    for (const v of [s0, s1, sol.x]) if (isFinite(v)) { x0 = Math.min(x0, v - (x1 - x0) * 0.05); x1 = Math.max(x1, v + (x1 - x0) * 0.05); }
    if (!D.continua) { x0 = Math.max(Math.floor(x0), D.rango(P)[0] - 1, 0) - 0.7; x1 = Math.ceil(x1) + 0.7; }
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (w - m.l - m.r);
    vista = { x0, x1, m, w, continua: D.continua };
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
    if (sol.tipo !== 'cuantil') g.fillText(critico ? `α = ${num(sol.alfa)} (α/2 en cada cola)` : sol.tipo === 'criticoU' ? `α = ${num(sol.alfa)} en la cola derecha` : `P = ${E.prob(sol.p)}`, m.l + 4, m.t);
  }

  /* ---------- Arrastrar a, b o c sobre la gráfica ---------- */
  const lienzo = $('#grafica'), ARRASTRA = ['menor', 'mayor', 'menorE', 'mayorE', 'igual', 'entre', 'centro', 'inverso'];
  const enX = (e) => { const r = lienzo.getBoundingClientRect(), { x0, x1, m, w } = vista; return x0 + ((e.clientX - r.left - m.l) / (w - m.l - m.r)) * (x1 - x0); };
  function mueve(e) {
    if (!vista || !sol) return;
    let x = enX(e);
    if (arrastra === 'cc') x = Math.abs(x - sol.media);
    if (sol.tipo === 'entre') x = arrastra === 'a' ? Math.min(x, sol.b) : Math.max(x, sol.a);
    const paso = vista.continua ? 10 ** Math.floor(Math.log10((vista.x1 - vista.x0) / 100)) : 1, v = Math.round(x / paso) * paso;
    sc[arrastra] = String(+v.toFixed(Math.max(0, -Math.floor(Math.log10(paso)))));
    const inp = $(`#f-${arrastra}`); if (inp) inp.value = sc[arrastra];
    $('#ejemplos').value = ''; calcula();
  }
  lienzo.addEventListener('pointerdown', (e) => {
    if (!sol || !vista || !ARRASTRA.includes(sol.tipo)) return;
    const x = enX(e);
    arrastra = sol.tipo === 'centro' ? 'cc' : sol.tipo === 'entre' && Math.abs(x - sol.b) < Math.abs(x - sol.a) ? 'b' : 'a';
    lienzo.setPointerCapture(e.pointerId); mueve(e);
  });
  lienzo.addEventListener('pointermove', (e) => { if (arrastra) mueve(e); });
  for (const ev of ['pointerup', 'pointercancel']) lienzo.addEventListener(ev, () => { arrastra = null; });
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('estadistica').current;
  formulario(); calcula();
  window.EstadisticaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { p: sol.p, res: sol.res, x: sol.x, c: sol.c }, estado: () => copia(sc) };
})();
