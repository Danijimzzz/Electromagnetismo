/* =====================================================================
   Interfaz del ajustador de reacciones: la reacción escrita, la ajustada con
   sus coeficientes, la gráfica de átomos de cada elemento a cada lado (antes
   y después de ajustar) y el desarrollo. El cálculo está en
   ajustador/calculo.js (Ajustador, que usa Formulas de quimica/formulas.js) y
   los ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc) en localStorage['ajustador-v1'] en cada cambio.
   Expone window.AjustadorApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, marcas, lienzo } = Herramienta;
  const A = Ajustador, CLAVE = 'ajustador-v1';

  let sc = copia(A.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  const ec = $('#ecuacion');
  const formulario = () => { ec.value = sc.ecuacion ?? ''; };
  ec.addEventListener('input', () => { sc.ecuacion = ec.value; $('#ejemplos').value = ''; calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + A.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = A.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // una reacción de los ejemplos al azar, para el modo práctica
  const azar = () => abrirEjemplo(A.ejemplos[Math.floor(Math.random() * A.ejemplos.length)].clave);
  const sinEstado = (h) => h.replace(/<small class="estado">.*?<\/small>/g, '');
  const enunciado = () => `Ajusta la reacción <b>${sol ? sol.especies.filter((s) => s.reactivo).map((s) => sinEstado(s.html)).join(' + ') + ' → ' + sol.especies.filter((s) => !s.reactivo).map((s) => sinEstado(s.html)).join(' + ') : esc(sc.ecuacion)}</b> y escribe el coeficiente de cada especie (enteros, lo más pequeños posible).`;

  /* ---------- Cálculo ---------- */
  function calcula() {
    const err = $('#error');
    try { sol = A.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false; ec.setAttribute('aria-invalid', 'true');
      $('#ajustada').innerHTML = ''; $('#coefs').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; ec.removeAttribute('aria-invalid'); guarda();
    $('#ajustada').innerHTML = sol.html;
    $('#coefs').innerHTML = sol.especies.map((s) => `<div><span>Coeficiente de ${sinEstado(s.html)}</span><b>${s.coef}</b></div>`).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').innerHTML = 'Átomos de cada elemento: <b>reactivos</b> a la izquierda y <b>productos</b> a la derecha. El contorno discontinuo es lo que habría con todos los coeficientes a 1; las barras llenas, con la reacción ajustada, son iguales.';
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const R = sol.especies.filter((s) => s.reactivo), P = sol.especies.filter((s) => !s.reactivo);
    const cuenta = (L, el, uno) => L.reduce((t, s) => t + (uno ? 1 : s.coef) * (s.atomos[el] || 0), 0);
    const filas = sol.elementos.map((el) => ({ el, r: cuenta(R, el), p: cuenta(P, el), r1: cuenta(R, el, true), p1: cuenta(P, el, true) }));
    const max = Math.max(1, ...filas.flatMap((f) => [f.r, f.p, f.r1, f.p1]));
    const ml = 40, mr = 12, mt = 12, mb = 30, ancho = (w - ml - mr) / filas.length;
    const Y = (v) => h - mb - (v / max) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(0, max, 4).filter(Number.isInteger)) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(String(v), ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    filas.forEach((f, i) => {
      const x0 = ml + i * ancho, b = Math.min(38, ancho * 0.32);
      g.fillStyle = col['--ink']; g.font = '600 13px system-ui, sans-serif'; g.fillText(f.el, x0 + ancho / 2, h - mb + 8);
      [[f.r, f.r1, '--serie-1', -1], [f.p, f.p1, '--serie-2', 1]].forEach(([v, v1, c, lado]) => {
        const x = x0 + ancho / 2 + (lado < 0 ? -b - 2 : 2);
        g.fillStyle = col[c]; g.globalAlpha = 0.85; g.fillRect(x, Y(v), b, Y(0) - Y(v)); g.globalAlpha = 1;
        g.setLineDash([4, 3]); g.strokeStyle = col['--ink']; g.strokeRect(x + 0.5, Y(v1) + 0.5, b - 1, Y(0) - Y(v1) - 1); g.setLineDash([]);
        g.fillStyle = col['--ink']; g.font = '12px system-ui, sans-serif'; g.textBaseline = 'bottom'; g.fillText(String(v), x + b / 2, Y(v) - 2); g.textBaseline = 'top';
      });
    });
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('ajustador').current;
  colores(); formulario(); calcula();
  window.AjustadorApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { coefs: sol.especies.map((s) => s.coef) }, estado: () => copia(sc) };
})();
