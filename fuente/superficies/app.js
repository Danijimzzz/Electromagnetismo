/* =====================================================================
   Superficies y curvas de nivel en 3D: interfaz. Escribes z = f(x, y) y un
   punto; sale la superficie en 3D (se gira arrastrando, con la rueda o con
   las flechas, con el plano tangente y el mapa de curvas de nivel en el
   suelo), el mapa de curvas de nivel con el gradiente y la tangente
   (pulsando en él se cambia el punto), los resultados y el desarrollo.
   El cálculo y las mallas están en superficies/calculo.js (Superficies).
   Guarda el estado (sc) en localStorage['superficies-v1'] y expone
   window.SuperficiesApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const S = Superficies, CLAVE = 'superficies-v1';
  const fH = (x, d = 4) => S.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const coma = (v) => String(v).replace('.', ',');
  const M = (s) => Mates.html(`$${s}$`);

  let sc = copia(S.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && typeof g.f === 'string') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, m31 = null, m81 = null, zr = { lo: 0, hi: 1 }, niv = [], cont = [], contPto = null, col = {}, anda = false, T2 = null;
  const V0 = { az: -0.8, el: 0.55, zoom: 1 };
  const V = { ...V0 };

  /* ---------- Formulario ---------- */
  const CAMPOS = [
    ['f', 'f(x, y) =', ''], ['x0', 'Punto x₀', ''], ['y0', 'y₀', ''],
    ['ux', 'Dirección uₓ', 'opcional'], ['uy', 'u<sub>y</sub>', ''], ['x1', 'Aproximar en x', 'opcional'], ['y1', 'y', ''],
    ['xmin', 'x desde', ''], ['xmax', 'hasta', ''], ['ymin', 'y desde', ''], ['ymax', 'hasta', ''], ['niveles', 'Curvas de nivel', 'cuántas'],
  ];
  function formulario() {
    $('#campos').innerHTML = CAMPOS.map(([k, et, ay]) => `<label for="f-${k}">${et}${ay ? ` <small>(${ay})</small>` : ''}</label><input id="f-${k}" class="in${k === 'f' ? ' larga' : ''}" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false"${k === 'f' ? '' : ' inputmode="decimal"'}${k === 'niveles' ? ' placeholder="10"' : ''}>`).join('');
    $('#nota').textContent = 'Escribe f con x e y: x^2 + y^2, sen(x) cos(y), e^(−(x^2 + y^2)), sqrt(x^2 + y^2), x^3 − 3x y^2… Los números admiten coma decimal y π (pi/2). Sin punto salen solo los puntos críticos; el rango se amplía si el punto queda fuera.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + S.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = S.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; }, de = (xs) => xs[ent(0, xs.length - 1)];
    const k = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));
    const fs = [
      () => `${nz(1, 3)}x^2 ${de(['+', '-'])} ${nz(1, 3)}y^2`,
      () => `x^2 y ${de(['+', '-'])} ${nz(1, 3)}y`,
      () => `${k(nz(-2, 3))}x y + ${ent(1, 4)}x - y^2`,
      () => `x^3 - ${nz(1, 3)}x y + y^2`,
      () => `e^(${k(nz(-2, 2))}x y)`,
      () => `sen(x) + ${nz(1, 3)}cos(y)`,
      () => `ln(x^2 + y^2 + ${ent(1, 3)})`,
      () => `sqrt(${ent(1, 3)}x^2 + y^2 + ${ent(1, 4)})`,
    ];
    for (let i = 0; i < 40; i++) {
      const c = { f: de(fs)(), x0: String(ent(-2, 2)), y0: String(ent(-2, 2)), ux: '', uy: '', x1: '', y1: '', xmin: '-3', xmax: '3', ymin: '-3', ymax: '3', niveles: '10' };
      if (Math.random() < 0.6) { const [a, b] = de([[1, 1], [3, 4], [1, -1], [2, 1], [-1, 2], [0, 1], [1, 0]]); c.ux = String(a); c.uy = String(b); }
      try { const r = S.resolver(c); if (!r.punto || !isFinite(r.punto.z0) || r.punto.plano) continue; sc = c; break; } catch (e) { /* otra */ }
    }
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => `Para <b>f(x, y) = ${esc(sc.f)}</b> en el punto (${esc(sc.x0)}, ${esc(sc.y0)}): calcula f y las derivadas parciales, el módulo del gradiente${sc.ux !== '' && sc.uy !== '' ? ` y la derivada direccional en la dirección (${esc(sc.ux)}, ${esc(sc.uy)})` : ''}. Escribe después el plano tangente.`;

  /* ---------- Resultados ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = S.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#leyenda-3d').textContent = ''; dibujaTodo(); return;
    }
    err.hidden = true; guarda();
    // mallas y curvas de nivel
    m31 = S.malla(sol, 31); m81 = S.malla(sol, 81);
    zr = { lo: m81.zlo, hi: m81.zhi };
    const n = Math.max(2, Math.min(30, Math.round(Number(String(sc.niveles || '10').replace(',', '.')) || 10)));
    niv = marcas(zr.lo, zr.hi, n).filter((L) => L > zr.lo && L < zr.hi);
    cont = niv.map((L) => ({ L, seg: S.contorno(m81, L) }));
    contPto = sol.punto ? S.contorno(m81, sol.punto.z0) : null;
    const P = sol.punto;
    let h = '';
    if (P) {
      h += dato('f(x₀, y₀)', fH(P.z0, 6), 'num') + dato('f<sub>x</sub>(x₀, y₀)', fH(P.gx, 6), 'num') + dato('f<sub>y</sub>(x₀, y₀)', fH(P.gy, 6), 'num') + dato('|∇f|', fH(P.g, 6), 'num');
      if (P.dir) h += dato('Derivada direccional', fH(P.dir.Du, 6), 'num');
      h += dato('Plano tangente', M(P.tangente), 'ancho') + dato('Normal', M(`n = (${S.nt(P.gx)}, ${S.nt(P.gy)}, −1)`), 'ancho');
      if (P.rectaNivel) h += dato('Tangente a la curva de nivel', M(P.rectaNivel), 'ancho');
      if (P.aprox) h += dato('f aproximada (plano)', fH(P.aprox.zl, 6), 'num') + dato('f exacta', fH(P.aprox.ze, 6), 'num') + dato('Error', fH(Math.abs(P.aprox.err), 3));
    } else h += dato('Punto', 'Escribe x₀ e y₀ para ver el gradiente y el plano tangente', 'ancho');
    h += dato('Puntos críticos', sol.crit.length ? sol.crit.map((q) => `${M(`(${S.nt(q.x)}, ${S.nt(q.y)})`)}: ${q.tipo}`).join('<br>') : 'ninguno en el rango', 'ancho');
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda-3d').textContent = `Arrastra para girar y usa la rueda para acercar. El color y las curvas del suelo marcan la altura, de ${txt(fH(zr.lo))} a ${txt(fH(zr.hi))}.`;
    $('#leyenda').textContent = `Cada curva une los puntos de la misma altura (${niv.length} alturas, de ${txt(fH(niv[0] ?? zr.lo))} a ${txt(fH(niv[niv.length - 1] ?? zr.hi))}).${P ? ' La curva gruesa pasa por el punto; la flecha roja es el gradiente, perpendicular a ella, y la línea discontinua su tangente.' : ''} Pulsa en el mapa para mover el punto.`;
    dibujaTodo();
  }

  /* ---------- Colores ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--z1', '--z2', '--z3', '--plano', '--grad']) col[k] = cs.getPropertyValue(k).trim(); }
  const rgb = (c) => { const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c); if (!m) return [128, 128, 128]; let s = m[1]; if (s.length === 3) s = [...s].map((q) => q + q).join(''); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)); };
  const mezcla = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  // altura normalizada 0..1 → color: abajo --z1, medio --z3, arriba --z2
  const mapa = (t) => { t = Math.max(0, Math.min(1, t)); const [a, b, c] = [rgb(col['--z1']), rgb(col['--z3']), rgb(col['--z2'])]; return t < 0.5 ? mezcla(a, b, t * 2) : mezcla(b, c, (t - 0.5) * 2); };
  const css = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;
  const norm = (z) => (z - zr.lo) / (zr.hi - zr.lo);
  function flecha(g, x1, y1, x2, y2, color, ancho = 2) {
    const L = Math.hypot(x2 - x1, y2 - y1); if (L < 2) return;
    const a = Math.atan2(y2 - y1, x2 - x1), c = Math.min(9, L * 0.5);
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * c * 0.6, y2 - Math.sin(a) * c * 0.6); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - c * Math.cos(a - 0.4), y2 - c * Math.sin(a - 0.4)); g.lineTo(x2 - c * Math.cos(a + 0.4), y2 - c * Math.sin(a + 0.4)); g.closePath(); g.fill();
  }

  /* ---------- Superficie 3D ---------- */
  function dibuja3d() {
    const { g, w, h } = lienzo('#superficie');
    if (!sol || !m31 || !w || !h) return;
    const { xmin, xmax, ymin, ymax } = sol.rango, R = zr.hi - zr.lo, zlo = zr.lo, zhi = zr.hi;
    const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2, cz = (zlo + zhi) / 2;
    const kx = 2 / (xmax - xmin), ky = 2 / (ymax - ymin), kz = 1.2 / R;
    const ca = Math.cos(V.az), sa = Math.sin(V.az), ce = Math.cos(V.el), se = Math.sin(V.el), E = Math.min(w / 3, h / 2.8) * V.zoom;
    const lim = (z, m) => Math.max(zlo - m * R, Math.min(zhi + m * R, z));
    // espacio normalizado (a, b, Z) y pantalla
    const norm3 = (x, y, z) => { const X = (x - cx) * kx, Y = (y - cy) * ky, Z = (z - cz) * kz, a = X * ca - Y * sa, b = X * sa + Y * ca; return [a, b, Z]; };
    const pant = (p) => [w / 2 + p[0] * E, h / 2 + 0.04 * h - (p[2] * ce + p[1] * se) * E, p[1] * ce - p[2] * se];
    const P3 = (x, y, z, m = 0) => pant(norm3(x, y, lim(z, m)));
    const suelo = zlo - 0.02 * R;
    // suelo con el mapa de curvas de nivel
    g.lineWidth = 1; g.strokeStyle = col['--line'];
    const esq = [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]].map(([x, y]) => P3(x, y, suelo - 0.1 * R));
    g.beginPath(); esq.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.stroke();
    for (const { L, seg } of cont) {
      g.strokeStyle = css(mapa(norm(L)), 0.85); g.lineWidth = 1.1; g.beginPath();
      for (const [x1, y1, x2, y2] of seg) { const a = P3(x1, y1, suelo - 0.1 * R), b = P3(x2, y2, suelo - 0.1 * R); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
      g.stroke();
    }
    // elementos que se pintan de atrás adelante
    const el = [], n = m31.n;
    const pts = m31.z.map((fila, j) => fila.map((z, i) => (isNaN(z) ? null : { p: norm3(m31.xs[i], m31.ys[j], lim(z, 0)), z })));
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const q = [pts[j][i], pts[j][i + 1], pts[j + 1][i + 1], pts[j + 1][i]];
      if (q.some((p) => !p)) continue;
      const e1 = q[1].p.map((v, k) => v - q[0].p[k]), e2 = q[3].p.map((v, k) => v - q[0].p[k]);
      const nr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], ln = Math.hypot(...nr) || 1;
      const luz = Math.abs((nr[1] * -ce + nr[2] * se) / ln), zm = (q[0].z + q[1].z + q[2].z + q[3].z) / 4;
      const c = mapa(norm(zm)).map((v) => v * (0.6 + 0.4 * luz) + 255 * 0.08 * (1 - luz));
      const ps = q.map((p) => pant(p.p));
      el.push({ ps, d: (ps[0][2] + ps[1][2] + ps[2][2] + ps[3][2]) / 4, fill: css(c, 0.97), line: css(c.map((v) => v * 0.55), 0.55) });
    }
    // plano tangente
    const P = sol.punto;
    if (P && $('#ver-plano').checked) {
      const hx = (xmax - xmin) * 0.2, hy = (ymax - ymin) * 0.2, N = 6, zp = (x, y) => P.z0 + P.gx * (x - P.x0) + P.gy * (y - P.y0), pc = rgb(col['--plano']);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const xa = P.x0 - hx + (2 * hx * i) / N, xb = P.x0 - hx + (2 * hx * (i + 1)) / N, ya = P.y0 - hy + (2 * hy * j) / N, yb = P.y0 - hy + (2 * hy * (j + 1)) / N;
        const ps = [[xa, ya], [xb, ya], [xb, yb], [xa, yb]].map(([x, y]) => P3(x, y, zp(x, y), 0.35));
        el.push({ ps, d: (ps[0][2] + ps[1][2] + ps[2][2] + ps[3][2]) / 4 - 0.01, fill: css(pc, 0.5), line: css(pc, 0.75) });
      }
    }
    el.sort((a, b) => b.d - a.d);
    g.lineWidth = 0.6; g.lineJoin = 'round';
    for (const e of el) {
      g.beginPath(); e.ps.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
      g.fillStyle = e.fill; g.fill(); g.strokeStyle = e.line; g.stroke();
    }
    // etiquetas de ejes
    g.font = '600 13px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'middle';
    const et = (t, x, y, z) => { const p = P3(x, y, z); g.fillText(t, p[0], p[1]); };
    et('x', xmax + (xmax - xmin) * 0.07, ymin, suelo - 0.1 * R); et('y', xmin, ymax + (ymax - ymin) * 0.07, suelo - 0.1 * R); et('z', xmin, ymin, zhi + 0.1 * R);
    // punto, su proyección al suelo, gradiente y dirección
    if (P) {
      const s0 = P3(P.x0, P.y0, suelo - 0.1 * R), p0 = P3(P.x0, P.y0, P.z0, 0.35);
      g.setLineDash([4, 4]); g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(s0[0], s0[1]); g.stroke(); g.setLineDash([]);
      const paso = 0.22 * Math.min(xmax - xmin, ymax - ymin);
      if (!P.plano) { const q = P3(P.x0 + (P.gx / P.g) * paso, P.y0 + (P.gy / P.g) * paso, suelo - 0.1 * R); flecha(g, s0[0], s0[1], q[0], q[1], col['--grad'], 2.2); }
      if (P.dir) { const q = P3(P.x0 + P.dir.ex * paso, P.y0 + P.dir.ey * paso, suelo - 0.1 * R); flecha(g, s0[0], s0[1], q[0], q[1], col['--z3'], 2); }
      g.fillStyle = col['--grad']; g.strokeStyle = col['--ink']; g.lineWidth = 1.5;
      g.beginPath(); g.arc(p0[0], p0[1], 5, 0, 2 * Math.PI); g.fill(); g.stroke();
      g.beginPath(); g.arc(s0[0], s0[1], 3, 0, 2 * Math.PI); g.fill();
    }
  }

  /* ---------- Curvas de nivel ---------- */
  function dibujaNiv() {
    const { g, w, h } = lienzo('#niveles');
    T2 = null;
    if (!sol || !w || !h) return;
    const { xmin, xmax, ymin, ymax } = sol.rango, ml = 44, mr = 14, mt = 12, mb = 26, pw = w - ml - mr, ph = h - mt - mb;
    const k = Math.min(pw / (xmax - xmin), ph / (ymax - ymin)), ox = ml + (pw - k * (xmax - xmin)) / 2, oy = mt + (ph - k * (ymax - ymin)) / 2;
    const X = (x) => ox + (x - xmin) * k, Y = (y) => oy + (ymax - y) * k;
    T2 = { ox, oy, k, xmin, ymax, xmax, ymin };
    g.font = '12px system-ui, sans-serif';
    g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const y of marcas(ymin, ymax, 5)) { g.beginPath(); g.moveTo(X(xmin), Y(y)); g.lineTo(X(xmax), Y(y)); g.stroke(); g.fillText(txt(fH(y)), X(xmin) - 6, Y(y)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const x of marcas(xmin, xmax, 6)) { g.beginPath(); g.moveTo(X(x), Y(ymin)); g.lineTo(X(x), Y(ymax)); g.stroke(); g.fillText(txt(fH(x)), X(x), Y(ymin) + 6); }
    g.strokeStyle = col['--muted']; g.strokeRect(X(xmin), Y(ymax), X(xmax) - X(xmin), Y(ymin) - Y(ymax));
    g.save(); g.beginPath(); g.rect(X(xmin), Y(ymax), X(xmax) - X(xmin), Y(ymin) - Y(ymax)); g.clip();
    // celdas sin definir (asíntotas, raíces de negativos): se tachan en gris suave
    const n = m81.n, dx = (xmax - xmin) / (n - 1), dy = (ymax - ymin) / (n - 1);
    g.fillStyle = col['--line'];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (isNaN(m81.z[j][i])) g.fillRect(X(m81.xs[i] - dx / 2), Y(m81.ys[j] + dy / 2), dx * k + 1, dy * k + 1);
    for (const { L, seg } of cont) {
      g.strokeStyle = css(mapa(norm(L)), 1); g.lineWidth = 1.5; g.beginPath();
      for (const [x1, y1, x2, y2] of seg) { g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); }
      g.stroke();
    }
    const P = sol.punto;
    if (P) {
      if (contPto) { g.strokeStyle = col['--ink']; g.lineWidth = 2.6; g.beginPath(); for (const [x1, y1, x2, y2] of contPto) { g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); } g.stroke(); }
      if (!P.plano) {
        const tx = -P.gy / P.g, ty = P.gx / P.g, big = (xmax - xmin) + (ymax - ymin);
        g.setLineDash([6, 5]); g.strokeStyle = col['--plano']; g.lineWidth = 2; g.beginPath(); g.moveTo(X(P.x0 - tx * big), Y(P.y0 - ty * big)); g.lineTo(X(P.x0 + tx * big), Y(P.y0 + ty * big)); g.stroke(); g.setLineDash([]);
      }
    }
    g.restore();
    for (const q of sol.crit) {
      g.fillStyle = q.tipo === 'mínimo' ? col['--z1'] : q.tipo === 'máximo' ? col['--z2'] : col['--z3']; g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
      g.beginPath(); g.rect(X(q.x) - 4, Y(q.y) - 4, 8, 8); g.fill(); g.stroke();
    }
    if (P) {
      const paso = 0.18 * Math.min(xmax - xmin, ymax - ymin);
      if (!P.plano) flecha(g, X(P.x0), Y(P.y0), X(P.x0 + (P.gx / P.g) * paso), Y(P.y0 + (P.gy / P.g) * paso), col['--grad'], 2.6);
      if (P.dir) flecha(g, X(P.x0), Y(P.y0), X(P.x0 + P.dir.ex * paso), Y(P.y0 + P.dir.ey * paso), col['--z3'], 2.2);
      g.fillStyle = col['--grad']; g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.arc(X(P.x0), Y(P.y0), 5, 0, 2 * Math.PI); g.fill(); g.stroke();
      if (P.aprox) { const a = X(P.aprox.x1), b = Y(P.aprox.y1); g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(a - 4, b - 4); g.lineTo(a + 4, b + 4); g.moveTo(a + 4, b - 4); g.lineTo(a - 4, b + 4); g.stroke(); }
    }
    // barra de color con la altura mínima y máxima
    const bw = Math.min(110, pw * 0.4), bx = X(xmax) - bw - 8, by = Y(ymax) + 10;
    for (let i = 0; i < bw; i++) { g.fillStyle = css(mapa(i / (bw - 1))); g.fillRect(bx + i, by, 1.5, 8); }
    g.fillStyle = col['--ink']; g.font = '11px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(txt(fH(zr.lo, 3)), bx, by + 11);
    g.textAlign = 'right'; g.fillText(txt(fH(zr.hi, 3)), bx + bw, by + 11);
  }
  // pulsar en el mapa mueve el punto
  $('#niveles').addEventListener('click', (e) => {
    if (!T2) return;
    const r = e.currentTarget.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const x = T2.xmin + (px - T2.ox) / T2.k, y = T2.ymax - (py - T2.oy) / T2.k;
    if (x < T2.xmin || x > T2.xmax || y < T2.ymin || y > T2.ymax) return;
    sc.x0 = coma(+x.toFixed(2)); sc.y0 = coma(+y.toFixed(2));
    $('#f-x0').value = sc.x0; $('#f-y0').value = sc.y0; sel.value = ''; calcula();
  });

  /* ---------- Girar la superficie ---------- */
  const dibujaTodo = () => { dibuja3d(); dibujaNiv(); };
  const cv = $('#superficie');
  let arrastra = null;
  cv.addEventListener('pointerdown', (e) => { arrastra = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!arrastra) return;
    V.az += (e.clientX - arrastra.x) * 0.008; V.el = Math.max(0.05, Math.min(1.5, V.el + (e.clientY - arrastra.y) * 0.008));
    arrastra = { x: e.clientX, y: e.clientY }; dibuja3d();
  });
  const suelta = () => { arrastra = null; };
  cv.addEventListener('pointerup', suelta); cv.addEventListener('pointercancel', suelta);
  cv.addEventListener('wheel', (e) => { e.preventDefault(); V.zoom = Math.max(0.5, Math.min(2.5, V.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); dibuja3d(); }, { passive: false });
  cv.addEventListener('keydown', (e) => {
    const m = { ArrowLeft: () => (V.az -= 0.1), ArrowRight: () => (V.az += 0.1), ArrowUp: () => (V.el = Math.min(1.5, V.el + 0.08)), ArrowDown: () => (V.el = Math.max(0.05, V.el - 0.08)), '+': () => (V.zoom = Math.min(2.5, V.zoom * 1.1)), '-': () => (V.zoom = Math.max(0.5, V.zoom / 1.1)) }[e.key];
    if (m) { e.preventDefault(); m(); dibuja3d(); }
  });
  const gira = () => { if (!anda) return; V.az += 0.012; dibuja3d(); requestAnimationFrame(gira); };
  $('#girar').addEventListener('click', () => { anda = !anda; $('#girar').textContent = anda ? '⏸ Parar' : '▶ Girar sola'; if (anda) requestAnimationFrame(gira); });
  $('#vista').addEventListener('click', () => { Object.assign(V, V0); dibuja3d(); });
  $('#ver-plano').addEventListener('change', dibuja3d);

  window.addEventListener('resize', dibujaTodo);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibujaTodo(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('superficies').current;
  colores(); formulario(); calcula();
  Herramienta.exportar('#superficie', { nombre: 'superficie-3d', titulo: 'Superficie en 3D', etiqueta: 'la superficie' });
  Herramienta.exportar('#niveles', { nombre: 'curvas-de-nivel', titulo: 'Curvas de nivel', etiqueta: 'las curvas de nivel' });
  window.SuperficiesApp = {
    abrirEjemplo, azar, enunciado,
    resultado: () => sol && { f: sol.txt.f, z0: sol.punto?.z0, gx: sol.punto?.gx, gy: sol.punto?.gy, g: sol.punto?.g, Du: sol.punto?.dir?.Du, plano: sol.punto?.tangente, crit: sol.crit.map((q) => q.tipo) },
    estado: () => copia(sc),
  };
})();
