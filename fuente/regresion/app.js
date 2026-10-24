/* =====================================================================
   Regresión y correlación: interfaz (datos, modelo, nube de puntos con
   la recta o la curva ajustada, resultados, tablas y desarrollo).
   El cálculo está en regresion/calculo.js (Regresion).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const R = Regresion, f = R.f, d4 = R.d4, CLAVE = 'regresion-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const FORMA = { lineal: 'y = a + bx', exponencial: 'y = a·eᵇˣ', potencial: 'y = a·xᵇ', logaritmica: 'y = a + b·ln x', parabolica: 'y = a + bx + cx²' };

  let sc = copia(R.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g.datos === 'string' && R.MODELOS[g.modelo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, marcar = false, vista = null;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, ayuda) => `<label for="f-${k}">${nom}${ayuda ? ` <small>${ayuda}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  function formulario() {
    let h = `<label for="f-modelo">Ajuste</label><select id="f-modelo" class="in" data-k="modelo">${Object.entries(R.MODELOS).map(([k, m]) => `<option value="${k}"${k === sc.modelo ? ' selected' : ''}>${m.nombre}: ${FORMA[k]}</option>`).join('')}</select>`;
    h += `<label for="f-datos" class="ancho">Datos <small>una fila por punto: x y, o x y n con la frecuencia</small></label><textarea id="f-datos" class="in ancho" data-k="datos" rows="9" spellcheck="false" autocomplete="off">${esc(sc.datos ?? '')}</textarea>`;
    h += '<div class="sep">Estimar (opcional)</div>' + fila('x0', 'y para x =') + fila('y0', 'x para y =');
    $('#campos').innerHTML = h;
  }
  const cambia = (k, v) => { sc[k] = v; $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') cambia(t.dataset.k, t.value); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName === 'SELECT') cambia(t.dataset.k, t.value); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + R.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = R.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // datos al azar alrededor de una recta, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const n = ent(5, 8), b = (Math.random() < 0.25 ? -1 : 1) * ent(1, 12) / 2, a = ent(0, 20), x0 = ent(0, 3), dx = ent(1, 3);
    const lin = [];
    for (let i = 0; i < n; i++) { const x = x0 + i * dx; lin.push(`${x} ${String(Math.round((a + b * x + (Math.random() - 0.5) * Math.abs(b) * dx * 1.2) * 10) / 10).replace('.', ',')}`); }
    sc = { modelo: 'lineal', datos: lin.join('\n'), x0: String(x0 + ent(1, n - 2) * dx + (dx > 1 ? 1 : 0.5)).replace('.', ','), y0: '' };
    formulario(); calcula(); sel.value = '';
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const tablaHTML = (cab, filas, tot) => `<table class="tabla"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>${tot ? `<tfoot><tr>${tot.map((c, i) => `<td>${i === 0 && c === '' ? '∑' : c}</td>`).join('')}</tr></tfoot>` : ''}</table>`;
  function calcula() {
    const err = $('#error');
    try { sol = R.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      dibuja(); return;
    }
    err.hidden = true; guarda();
    const lin = sol.modelo === 'lineal', M = R.MODELOS[sol.modelo];
    let h = dato(lin ? 'Recta de regresión de Y sobre X' : `Ajuste ${M.adj}`, sol.ecuacion);
    if (lin && sol.xSobreY) h += dato('Recta de regresión de X sobre Y', `x = ${f(sol.xSobreY.a)} ${sol.xSobreY.b < 0 ? '−' : '+'} ${f(Math.abs(sol.xSobreY.b))}y`);
    h += dato('Coeficiente de correlación', `r = ${d4(sol.r)}`);
    h += dato(lin ? 'Coeficiente de determinación' : 'Bondad del ajuste', `R² = ${d4(sol.R2)}`);
    if (!lin && sol.rt !== undefined) h += dato('Correlación de las variables transformadas', `r = ${d4(sol.rt)}`);
    h += dato('Medias', `x̄ = ${f(sol.m.mx)}, ȳ = ${f(sol.m.my)}`) + dato('Covarianza', `σ<sub>xy</sub> = ${f(sol.m.cxy)}`);
    if (sol.yx0 !== undefined) h += dato(`Estimación para x = ${f(sol.x0)}`, `ŷ = ${f(sol.yx0)}`);
    if (sol.xy0 !== undefined) h += dato(`Estimación para y = ${f(sol.y0)}`, `x̂ = ${f(sol.xy0)}`);
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => {
      let extra = '';
      if (p.tabla) extra = tablaHTML(p.tabla.cab, p.tabla.filas, p.tabla.tot);
      if (p.residuos) extra = tablaHTML(['x<sub>i</sub>', 'y<sub>i</sub>', 'ŷ<sub>i</sub>', 'e<sub>i</sub> = y<sub>i</sub> − ŷ<sub>i</sub>'], sol.residuos.map((q) => [f(q.x, 6), f(q.y, 6), f(q.yp), f(q.e)]));
      return `<li><strong>${Mates.html(p.t)}</strong>${extra}${Mates.html(p.html)}</li>`;
    }).join('');
    $('#leyenda').textContent = `${sol.pts.length} puntos${sol.m.N !== sol.pts.length ? ` (N = ${txt(f(sol.m.N))} con las frecuencias, el tamaño del punto)` : ''}. ${lin ? 'En color la recta de Y sobre X y a trazos la de X sobre Y; se cortan en (x̄, ȳ).' : 'En color la curva ajustada y a trazos la recta, para comparar.'}`;
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--panel', '--punto', '--otra']) col[k] = cs.getPropertyValue(k).trim(); }
  // marcas «bonitas» del eje
  function marcas(a, b, n = 6) {
    const paso0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(paso0)), paso = [1, 2, 2.5, 5, 10].map((k) => k * e).find((k) => k >= paso0) || 10 * e;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  }
  function dibuja() {
    const c = $('#grafica'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    vista = null;
    if (!sol) return;
    colores();
    const pts = sol.pts, m = { l: 52, r: 14, t: 14, b: 30 };
    let xs = pts.map((q) => q.x), ys = pts.map((q) => q.y);
    if (sol.yx0 !== undefined) { xs.push(sol.x0); ys.push(sol.yx0); }
    if (sol.xy0 !== undefined) { xs.push(sol.xy0); ys.push(sol.y0); }
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const ax = (x1 - x0) || Math.abs(x0) || 1, ay = (y1 - y0) || Math.abs(y0) || 1;
    x0 -= ax * 0.08; x1 += ax * 0.08; y0 -= ay * 0.12; y1 += ay * 0.12;
    // si el origen está cerca, que se vea
    if (x0 > 0 && x0 < ax * 0.5) x0 = 0; if (y0 > 0 && y0 < ay * 0.5) y0 = 0;
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    vista = { x0, x1, y0, y1, m, w, h };
    // rejilla y ejes
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    const num = (v) => txt(f(v, 4));
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(x0, x1)) { g.beginPath(); g.moveTo(X(v), m.t); g.lineTo(X(v), h - m.b); g.stroke(); g.fillText(num(v), X(v), h - m.b + 6); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(y0, y1, 5)) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(w - m.r, Y(v)); g.stroke(); g.fillText(num(v), m.l - 6, Y(v)); }
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(m.l, m.t); g.lineTo(m.l, h - m.b); g.lineTo(w - m.r, h - m.b); g.stroke();
    g.save(); g.beginPath(); g.rect(m.l, m.t, w - m.l - m.r, h - m.t - m.b); g.clip();
    // la otra recta (X sobre Y) o la recta para comparar, a trazos
    g.setLineDash([6, 5]); g.strokeStyle = col['--otra']; g.lineWidth = 1.5; g.beginPath();
    if (sol.modelo === 'lineal') { if (sol.xSobreY && sol.xSobreY.b) { const { a, b } = sol.xSobreY; g.moveTo(X(a + b * y0), Y(y0)); g.lineTo(X(a + b * y1), Y(y1)); } }
    else { const { a, b } = sol.lineal; g.moveTo(X(x0), Y(a + b * x0)); g.lineTo(X(x1), Y(a + b * x1)); }
    g.stroke(); g.setLineDash([]);
    // recta o curva ajustada
    g.strokeStyle = col['--accent']; g.lineWidth = 2.2; g.beginPath();
    let dentro = false;
    for (let i = 0; i <= 300; i++) {
      const x = x0 + ((x1 - x0) * i) / 300, y = sol.pred(x);
      if (!isFinite(y)) { dentro = false; continue; }
      if (dentro) g.lineTo(X(x), Y(y)); else g.moveTo(X(x), Y(y));
      dentro = true;
    }
    g.stroke(); g.lineWidth = 1;
    // residuos como segmentos verticales
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.5;
    for (const q of sol.residuos) if (isFinite(q.yp)) { g.beginPath(); g.moveTo(X(q.x), Y(q.y)); g.lineTo(X(q.x), Y(q.yp)); g.stroke(); }
    g.globalAlpha = 1;
    // puntos (más grandes cuanta más frecuencia)
    const nmax = Math.max(...pts.map((q) => q.n));
    for (const q of pts) { g.fillStyle = col['--punto']; g.beginPath(); g.arc(X(q.x), Y(q.y), 3.5 + (nmax > 1 ? 4 * Math.sqrt(q.n / nmax) : 1), 0, 2 * Math.PI); g.fill(); g.strokeStyle = col['--panel']; g.stroke(); }
    // centro de gravedad y estimaciones
    const cruz = (x, y, t) => { g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(x) - 6, Y(y)); g.lineTo(X(x) + 6, Y(y)); g.moveTo(X(x), Y(y) - 6); g.lineTo(X(x), Y(y) + 6); g.stroke(); g.lineWidth = 1; g.fillStyle = col['--ink']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillText(t, X(x) - 5, Y(y) - 3); };
    cruz(sol.m.mx, sol.m.my, '(x̄, ȳ)');
    const estima = (x, y, t) => {
      g.setLineDash([3, 3]); g.strokeStyle = col['--accent']; g.beginPath(); g.moveTo(X(x), h - m.b); g.lineTo(X(x), Y(y)); g.lineTo(m.l, Y(y)); g.stroke(); g.setLineDash([]);
      g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(x), Y(y), 5, 0, 2 * Math.PI); g.fill();
      const izq = X(x) > w - m.r - 90; g.textAlign = izq ? 'right' : 'left'; g.textBaseline = 'top'; g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillText(t, X(x) + (izq ? -7 : 7), Y(y) + 3);
    };
    if (sol.yx0 !== undefined) estima(sol.x0, sol.yx0, `ŷ = ${num(sol.yx0)}`);
    if (sol.xy0 !== undefined) estima(sol.xy0, sol.y0, `x̂ = ${num(sol.xy0)}`);
    g.restore();
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  // añadir puntos pulsando en la gráfica
  const btn = $('#marcar');
  btn.addEventListener('click', () => { marcar = !marcar; btn.setAttribute('aria-pressed', marcar); btn.textContent = marcar ? '✓ Pulsa en la gráfica' : '✚ Añadir puntos'; $('#grafica').classList.toggle('marcando', marcar); });
  $('#grafica').addEventListener('click', (e) => {
    if (!marcar || !vista) return;
    const r = e.currentTarget.getBoundingClientRect(), { x0, x1, y0, y1, m, w, h } = vista;
    const x = x0 + ((e.clientX - r.left - m.l) / (w - m.l - m.r)) * (x1 - x0), y = y1 - ((e.clientY - r.top - m.t) / (h - m.t - m.b)) * (y1 - y0);
    const red = (v, s) => v.toFixed(Math.max(0, 2 - Math.floor(Math.log10(s || 1)))).replace('.', ',').replace('-', '−');
    const lin = `${red(x, x1 - x0)} ${red(y, y1 - y0)}`;
    sc.datos = (sc.datos || '').replace(/\s*$/, '') + '\n' + lin;
    $('#f-datos').value = sc.datos; $('#ejemplos').value = ''; calcula();
  });
  $('#vaciar').addEventListener('click', () => { sc.datos = ''; $('#f-datos').value = ''; $('#ejemplos').value = ''; calcula(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('regresion').current;
  formulario(); calcula();
  window.RegresionApp = { abrirEjemplo, azar, resultado: () => sol && { r: sol.r, R2: sol.R2, ecuacion: sol.ecuacion, yx0: sol.yx0, xy0: sol.xy0 }, estado: () => copia(sc) };
})();
