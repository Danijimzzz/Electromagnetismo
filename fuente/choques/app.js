/* =====================================================================
   Choques de la interfaz de una herramienta: datos, ejemplos, resultados,
   desarrollo y gráfica. node fuente/nueva.js la copia a fuente/<clave>/app.js;
   el cálculo está en <clave>/calculo.js (Choques) y los ayudantes comunes
   ($, esc, copia, txt, marcas, lienzo) en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE] en cada cambio: es lo
   que copia Mis ejercicios (biblioteca.js). Expone window.ChoquesApp para
   el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = Choques, f = P.f, CLAVE = 'choques-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const TIPOS = [['elastico', 'Elástico'], ['inelastico', 'Inelástico (con e)'], ['pegados', 'Pegados (inelástico total)']];
  function formulario() {
    $('#campos').innerHTML = `<label for="f-tipo">Tipo de choque</label><select id="f-tipo" class="in" data-k="tipo">${TIPOS.map(([k, n]) => `<option value="${k}"${sc.tipo === k ? ' selected' : ''}>${n}</option>`).join('')}</select>`
      + '<div class="sep">Cuerpo 1</div>' + fila('m1', 'Masa m₁', 'kg') + fila('v1x', 'Velocidad v₁ₓ', 'm/s') + fila('v1y', 'Velocidad v₁ᵧ', 'm/s')
      + '<div class="sep">Cuerpo 2</div>' + fila('m2', 'Masa m₂', 'kg') + fila('v2x', 'Velocidad v₂ₓ', 'm/s') + fila('v2y', 'Velocidad v₂ᵧ', 'm/s')
      + '<div class="sep">Choque</div>' + fila('th', 'Ángulo de la normal', '°') + (sc.tipo === 'inelastico' ? fila('e', 'Coeficiente e (0 a 1)', '') : '');
    $('#nota').textContent = 'Ángulo 0° y velocidades en x: choque en una dimensión. La normal es la recta que une los centros al chocar. Se admite coma decimal, 3e8 y 3·10^8.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; if (t.dataset.k === 'tipo') formulario(); calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const vec = (x, y, u) => `(${f(x)}, ${f(y)}) ${u}`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const m = (v) => Math.hypot(v[0], v[1]), g = (v) => Math.atan2(v[1], v[0]) * 180 / Math.PI;
    const dir = (v) => (sol.dim2 && m(v) > 1e-12 ? `, ${f(g(v))}°` : '');
    $('#resumen').innerHTML = dato('Velocidad final 1', `${sol.dim2 ? `w₁ = ${vec(...sol.w1, 'm/s')}` : `w₁ = ${f(sol.w1[0])} m/s`} <small>(|w₁| = ${f(m(sol.w1))} m/s${dir(sol.w1)})</small>`)
      + dato('Velocidad final 2', `${sol.dim2 ? `w₂ = ${vec(...sol.w2, 'm/s')}` : `w₂ = ${f(sol.w2[0])} m/s`} <small>(|w₂| = ${f(m(sol.w2))} m/s${dir(sol.w2)})</small>`)
      + dato('Momento lineal total', `${sol.dim2 ? `p = ${vec(...sol.p1, 'kg·m/s')}` : `p = ${f(sol.p1[0])} kg·m/s`} (igual antes y después)`)
      + dato('Energía cinética', `K antes = ${f(sol.k0)} J; después = ${f(sol.k1)} J`)
      + dato('Energía perdida', `ΔK = ${f(sol.perdida)} J (${f(sol.k0 > 0 ? sol.perdida / sol.k0 * 100 : 0)} %)`);
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Izquierda: antes del choque. Derecha: después. Las flechas son las velocidades (misma escala); la línea de puntos, la normal.';
    dibuja();
  }

  /* ---------- Dibujo: antes y después ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  function flecha(g, x, y, dx, dy, color) {
    const L = Math.hypot(dx, dy); if (L < 3) return;
    const ux = dx / L, uy = dy / L; g.strokeStyle = g.fillStyle = color; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke();
    g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - 9 * ux + 5 * uy, y + dy - 9 * uy - 5 * ux); g.lineTo(x + dx - 9 * ux - 5 * uy, y + dy - 9 * uy + 5 * ux); g.closePath(); g.fill();
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const vmax = Math.max(1e-9, ...[sol.v1, sol.v2, sol.w1, sol.w2].map((v) => Math.hypot(v[0], v[1])));
    const R = Math.min(22, w / 14), esc_ = Math.min(w / 2 - 2 * R - 24, h / 2 - R - 8) / vmax, th = sol.th * Math.PI / 180;
    g.font = '13px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(w / 2, 8); g.lineTo(w / 2, h - 8); g.stroke();
    const panel = (cx, tit, a, b, aa, bb) => {
      g.fillStyle = col['--muted']; g.fillText(tit, cx, 6);
      const cy = h / 2 + 8, d = R + 2, nx = Math.cos(th), ny = -Math.sin(th);
      g.setLineDash([3, 4]); g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - nx * 2.4 * R, cy - ny * 2.4 * R); g.lineTo(cx + nx * 2.4 * R, cy + ny * 2.4 * R); g.stroke(); g.setLineDash([]);
      for (const [dx, v, c, n] of [[-1, a, col['--serie-1'], '1'], [1, b, col['--serie-2'], '2']]) {
        const x = cx + dx * d * nx, y = cy + dx * d * ny;
        g.fillStyle = c; g.globalAlpha = 0.85; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); g.globalAlpha = 1;
        g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(n, x, y); g.textBaseline = 'top';
        flecha(g, x, y, v[0] * esc_, -v[1] * esc_, c);
      }
    };
    panel(w / 4, 'Antes', sol.v1, sol.v2); panel(3 * w / 4, 'Después', sol.w1, sol.w2);
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('choques').current;
  colores(); formulario(); calcula();
  /* ---------- Modo práctica ---------- */
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipo = de(['elastico', 'inelastico', 'pegados']), dosD = Math.random() < 0.35;
    sc = { tipo, m1: String(ent(1, 6)), m2: String(ent(1, 6)), v1x: String(ent(2, 9)), v1y: '0', v2x: String(de([0, 0, -1, -2, -3])), v2y: '0', th: '0', e: c(de([0.3, 0.5, 0.8])) };
    if (dosD && tipo !== 'pegados') { sc.v2x = '0'; sc.th = String(de([20, 30, 40, 60])); }
    sel.value = ''; formulario(); calcula();
  }
  const enunciado = () => {
    const e = Herramienta.esc, t = sc.tipo, v = (x, y) => (+String(y).replace(',', '.') ? `(${e(x)}; ${e(y)})` : e(x));
    const tipo = t === 'pegados' ? 'quedan pegados tras el choque' : t === 'elastico' ? 'chocan de forma elástica' : `chocan con coeficiente de restitución e = ${e(sc.e)}`;
    return `Un cuerpo de ${e(sc.m1)} kg con velocidad ${v(sc.v1x, sc.v1y)} m/s choca con otro de ${e(sc.m2)} kg con velocidad ${v(sc.v2x, sc.v2y)} m/s${+String(sc.th) ? ` (normal a ${e(sc.th)}° del eje x)` : ''}; ${tipo}. Calcula las velocidades finales, el momento lineal y la energía perdida.`;
  };

  window.ChoquesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { w1: sol.w1, w2: sol.w2, perdida: sol.perdida }, estado: () => copia(sc) };
})();
