/* =====================================================================
   Plantilla de la interfaz de una herramienta: datos, ejemplos, resultados,
   desarrollo y gráfica. node fuente/nueva.js la copia a fuente/<clave>/app.js;
   el cálculo está en <clave>/calculo.js (Plantilla) y los ayudantes comunes
   ($, esc, copia, txt, marcas, lienzo) en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE] en cada cambio: es lo
   que copia Mis ejercicios (biblioteca.js). Expone window.PlantillaApp para
   el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = Plantilla, f = P.f, CLAVE = 'plantilla-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  function formulario() {
    $('#campos').innerHTML = fila('s', 'Distancia recorrida', 'm') + fila('t', 'Tiempo', 's');
    $('#nota').textContent = 'Se admite coma decimal, 3e8 y 3·10^8.';
  }
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

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    $('#resumen').innerHTML = dato('Velocidad media', `v = ${f(sol.v)} m/s`) + dato('En km/h', `v = ${f(sol.v * 3.6)} km/h`);
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Posición x(t) = v·t desde 0 hasta t.';
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const ml = 56, mr = 14, mt = 12, mb = 28;
    const X = (t) => ml + (t / sol.t) * (w - ml - mr), Y = (x) => h - mb - (x / sol.s) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const x of marcas(0, sol.s, 4)) { g.beginPath(); g.moveTo(ml, Y(x)); g.lineTo(w - mr, Y(x)); g.stroke(); g.fillText(txt(f(x)), ml - 6, Y(x)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of marcas(0, sol.t, 5)) g.fillText(txt(f(t)), X(t), h - mb + 6);
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(sol.t), Y(sol.s)); g.stroke();
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('plantilla').current;
  colores(); formulario(); calcula();
  /* ---------- Ejercicio inventado (modo práctica) ----------
     azar() INVENTA un ejercicio nuevo: datos que no salen de ningún ejemplo, redondos (que se puedan hacer a mano) y que dan un
     resultado con sentido. Usa Math.random (el modo práctica lo sustituye por un generador con semilla: el mismo código da el mismo
     ejercicio) y Practica.nivel ('facil' | 'medio' | 'dificil'): fácil, números enteros pequeños; difícil, más cifras. enunciado() lo cuenta. */
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function azar() {
    const n = typeof Practica !== 'undefined' ? Practica.nivel : 'medio', t = entre(2, n === 'facil' ? 10 : 40);
    const v = n === 'dificil' ? entre(11, 99) / 10 : entre(2, 20);
    sc = { s: String(Math.round(v * t * 10) / 10).replace('.', ','), t: String(t) }; $('#ejemplos').value = ''; formulario(); calcula();
  }
  const enunciado = () => `Un móvil recorre ${esc(sc.s)} m en ${esc(sc.t)} s con velocidad constante. Calcula su velocidad media en m/s y en km/h.`;
  window.PlantillaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { v: sol.v }, estado: () => copia(sc) };
})();
