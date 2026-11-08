/* =====================================================================
   Multiplicadores de Lagrange: interfaz (f, g y c; puntos críticos con λ y
   su clasificación; curvas de nivel de f, restricción y puntos en el plano
   si hay dos variables; desarrollo). El cálculo está en lagrange/calculo.js
   (Lagrange); los ayudantes comunes en herramienta.js. Guarda sc en
   localStorage['lagrange-v1'] y expone window.LagrangeApp.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = Lagrange, f = P.f, CLAVE = 'lagrange-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};
  const M = (s) => Mates.html(`$${s}$`);

  /* ---------- Formulario ---------- */
  const fila = (k, nom, ph) => `<label for="f-${k}">${nom}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" placeholder="${ph}" autocomplete="off" spellcheck="false">`;
  function formulario() { $('#campos').innerHTML = fila('f', 'Función f', 'x + y') + fila('g', 'Restricción g', 'x^2 + y^2') + fila('c', 'g es igual a c =', '1'); }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  // un ejercicio al azar con puntos racionales, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), c = String(ent(2, 9)), k = ent(0, 2);
    sc = k === 0 ? { f: 'x^2 + y^2', g: 'x + y', c } : k === 1 ? { f: 'x y', g: '2x + 2y', c: String(4 * ent(1, 6)) } : { f: 'x^2 + 2y^2', g: 'x + y', c: String(3 * ent(1, 4)) };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => `Halla los extremos de <b>f(x, y) = ${esc(sc.f)}</b> con la restricción <b>${esc(sc.g)} = ${esc(sc.c)}</b>: el punto crítico, el valor de λ y el valor de f.`;

  /* ---------- Cálculo ---------- */
  const dato = (t, v, c = '') => `<div${c ? ` class="${c}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const pt = (q) => `(${q.p.map((a) => f(a, 5)).join('; ')})`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.constante !== null) h = dato('f es constante sobre la restricción', `f = ${f(sol.constante, 6)} en todos sus puntos`, 'ancho num');
    else if (!sol.puntos.length) h = dato('Puntos críticos', 'Ninguno encontrado', 'ancho');
    else {
      h += sol.puntos.map((q, i) => dato(`Punto ${i + 1}: ${q.tipo}`, `${pt(q)} · ${q.singular ? '∇g = 0 aquí' : `λ = ${f(q.lambda, 5)}`} · f = ${f(q.valor, 5)}`, 'ancho num')).join('');
      h += dato('Máximo de f entre ellos', f(sol.max, 6), 'num') + dato('Mínimo de f entre ellos', f(sol.min, 6), 'num');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').innerHTML = sol.dim === 2 ? 'Gris: curvas de nivel de f. Azul: la restricción. Los puntos críticos son verdes (máximo), rojos (mínimo) o naranjas (no decide); la curva de nivel que pasa por cada uno es tangente a la restricción.' : 'Con tres variables no se dibuja: la restricción es una superficie. Mira los puntos y su clasificación.';
    dibuja();
  }

  /* ---------- Gráfica (dos variables) ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--nivel', '--pmax', '--pmin', '--psilla', '--restr']) col[k] = cs.getPropertyValue(k).trim(); }
  // segmentos de la curva de nivel F = nivel en una cuadrícula n × n (cuadrados marchantes)
  function contorno(F, nivel, x0, x1, y0, y1, n) {
    const dx = (x1 - x0) / n, dy = (y1 - y0) / n, v = [], segs = [];
    for (let j = 0; j <= n; j++) { const fila = []; for (let i = 0; i <= n; i++) fila.push(F(x0 + i * dx, y0 + j * dy) - nivel); v.push(fila); }
    const cruce = (a, b, pa, pb) => { const t = a / (a - b); return [pa[0] + t * (pb[0] - pa[0]), pa[1] + t * (pb[1] - pa[1])]; };
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const P0 = [x0 + i * dx, y0 + j * dy], P1 = [P0[0] + dx, P0[1]], P2 = [P0[0] + dx, P0[1] + dy], P3 = [P0[0], P0[1] + dy];
      const a = v[j][i], b = v[j][i + 1], c = v[j + 1][i + 1], d = v[j + 1][i];
      if (![a, b, c, d].every(isFinite)) continue;
      const pts = [];
      if (a * b < 0) pts.push(cruce(a, b, P0, P1));
      if (b * c < 0) pts.push(cruce(b, c, P1, P2));
      if (c * d < 0) pts.push(cruce(c, d, P2, P3));
      if (d * a < 0) pts.push(cruce(d, a, P3, P0));
      if (pts.length >= 2) segs.push([pts[0], pts[1]]);
      if (pts.length === 4) segs.push([pts[2], pts[3]]);
    }
    return segs;
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || sol.dim !== 2 || !w || !h) { if (g && w && h) { g.fillStyle = col['--muted']; g.font = '13px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(sol && sol.dim === 3 ? 'Gráfica solo con dos variables' : '', w / 2, h / 2); } return; }
    const ext = Math.max(2, ...sol.puntos.flatMap((q) => q.p.map(Math.abs))) * 1.5;
    const ml = 40, mr = 14, mt = 12, mb = 28, lado = Math.min(w - ml - mr, h - mt - mb);
    const ox = ml + (w - ml - mr - lado) / 2, oy = mt;
    const X = (x) => ox + ((x + ext) / (2 * ext)) * lado, Y = (y) => oy + lado - ((y + ext) / (2 * ext)) * lado;
    g.save(); g.beginPath(); g.rect(ox, oy, lado, lado); g.clip();
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    for (const a of marcas(-ext, ext, 6)) { g.beginPath(); g.moveTo(X(a), oy); g.lineTo(X(a), oy + lado); g.stroke(); g.beginPath(); g.moveTo(ox, Y(a)); g.lineTo(ox + lado, Y(a)); g.stroke(); }
    const Fn = (x, y) => sol.f([x, y]), Gn = (x, y) => sol.g([x, y]);
    const trazo = (segs, color, ancho, dash) => { g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(dash || []); g.beginPath(); for (const [a, b] of segs) { g.moveTo(X(a[0]), Y(a[1])); g.lineTo(X(b[0]), Y(b[1])); } g.stroke(); g.setLineDash([]); };
    const fv = sol.puntos.map((q) => q.valor), lo = Math.min(...fv, Fn(0, 0)), hi = Math.max(...fv, Fn(0, 0));
    if (isFinite(lo) && isFinite(hi) && hi - lo > 1e-12) for (let k = 1; k < 8; k++) { g.globalAlpha = 0.35; trazo(contorno(Fn, lo + (hi - lo) * k / 8, -ext, ext, -ext, ext, 110), col['--nivel'], 1); g.globalAlpha = 1; }
    for (const q of sol.puntos) trazo(contorno(Fn, q.valor, -ext, ext, -ext, ext, 160), col['--nivel'], 1.4, [5, 4]);
    trazo(contorno(Gn, sol.c, -ext, ext, -ext, ext, 200), col['--restr'], 2.6);
    g.restore();
    const cl = { máximo: col['--pmax'], mínimo: col['--pmin'] };
    for (const q of sol.puntos) { g.fillStyle = cl[q.tipo] || col['--psilla']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.arc(X(q.p[0]), Y(q.p[1]), 5.5, 0, 7); g.fill(); g.stroke(); }
    g.fillStyle = col['--muted']; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const a of marcas(-ext, ext, 6)) g.fillText(txt(f(a, 3)), X(a), oy + lado + 6);
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const a of marcas(-ext, ext, 6)) g.fillText(txt(f(a, 3)), ox - 6, Y(a));
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('lagrange').current;
  colores(); formulario(); calcula();
  window.LagrangeApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { max: sol.max, min: sol.min, n: sol.puntos.length }, estado: () => copia(sc) };
})();
