/* =====================================================================
   Interfaz de Redox por ion-electrón: la reacción sin ajustar y el medio, la
   reacción ajustada con sus coeficientes, la gráfica de cómo cambia el número
   de oxidación de lo que se oxida y de lo que se reduce, y el desarrollo.
   El cálculo está en redox/calculo.js (Redox, que usa Formulas de
   quimica/formulas.js) y los ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc) en localStorage['redox-v1'] en cada cambio.
   Expone window.RedoxApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const A = Redox, CLAVE = 'redox-v1';

  let sc = copia(A.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { const g = JSON.parse(localStorage.getItem(CLAVE)) || {}; if (g.electro) sc.electro = g.electro; localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  const ec = $('#ecuacion');
  const formulario = () => {
    ec.value = sc.ecuacion ?? '';
    for (const b of document.querySelectorAll('#medio button')) b.setAttribute('aria-selected', String(b.dataset.medio === (sc.medio === 'basico' ? 'basico' : 'acido')));
  };
  ec.addEventListener('input', () => { sc.ecuacion = ec.value; $('#ejemplos').value = ''; calcula(); });
  $('#medio').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-medio]');
    if (!b) return;
    sc.medio = b.dataset.medio; $('#ejemplos').value = ''; formulario(); calcula();
  });

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
  const enunciado = () => `Ajusta por el método del ion-electrón, en medio <b>${sc.medio === 'basico' ? 'básico' : 'ácido'}</b>, <b>${esc(String(sc.ecuacion ?? '').replace(/->/g, '→'))}</b>, y escribe el coeficiente de cada especie (enteros, lo más pequeños posible).`;

  /* ---------- Cálculo ---------- */
  function calcula() {
    const err = $('#error');
    try { sol = A.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false; ec.setAttribute('aria-invalid', 'true');
      $('#ajustada').innerHTML = ''; $('#coefs').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; ec.removeAttribute('aria-invalid'); guarda();
    $('#ajustada').innerHTML = sol.html;
    $('#coefs').innerHTML = sol.especies.map((s) => `<div><span>Coeficiente de ${s.html}</span><b>${s.coef}</b></div>`).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').innerHTML = 'Cada flecha lleva el número de oxidación de antes a después: <b>sube</b> si se oxida (cede electrones) y <b>baja</b> si se reduce (los gana).';
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  const signo = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + (Number.isInteger(x) ? Math.abs(x) : Math.abs(x).toFixed(2).replace('.', ','));
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const vals = sol.cambios.flatMap((c) => [c.de, c.a]);
    const lo = Math.floor(Math.min(...vals, 0)) - 1, hi = Math.ceil(Math.max(...vals, 0)) + 1;
    const ml = 40, mr = 14, mt = 14, mb = 34, ancho = (w - ml - mr) / sol.cambios.length;
    const Y = (v) => h - mb - ((v - lo) / (hi - lo)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let v = lo; v <= hi; v++) { g.strokeStyle = v === 0 ? col['--muted'] : col['--line']; g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillStyle = col['--muted']; g.fillText(signo(v), ml - 6, Y(v)); }
    sol.cambios.forEach((c, i) => {
      const x = ml + ancho * (i + 0.5), color = col[c.sube ? '--serie-1' : '--serie-2'], y0 = Y(c.de), y1 = Y(c.a), dir = y1 < y0 ? -1 : 1;
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1 - dir * 8); g.stroke();
      g.beginPath(); g.moveTo(x, y1); g.lineTo(x - 7, y1 - dir * 11); g.lineTo(x + 7, y1 - dir * 11); g.closePath(); g.fill();
      g.beginPath(); g.arc(x, y0, 4, 0, 7); g.fill();
      g.fillStyle = col['--ink']; g.textAlign = 'left'; g.font = '12px system-ui, sans-serif';
      g.fillText(signo(c.de), x + 12, y0); g.fillText(signo(c.a), x + 12, y1);
      g.textAlign = 'center'; g.textBaseline = 'top'; g.font = '600 13px system-ui, sans-serif';
      g.fillText(`${c.el}: ${c.sube ? 'se oxida' : 'se reduce'}`, x, h - mb + 8); g.textBaseline = 'middle';
    });
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('redox').current;
  colores(); formulario(); calcula();
  window.RedoxApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { coefs: sol.especies.map((s) => s.coef) }, estado: () => copia(sc) };
})();
