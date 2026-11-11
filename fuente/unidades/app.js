/* =====================================================================
   Conversor de unidades y constantes · interfaz: magnitud, valor y unidades,
   ejemplos, resultado, el valor en todas las unidades, el desarrollo y la
   tabla de constantes CODATA con buscador. El cálculo está en
   unidades/calculo.js (Unidades); los ayudantes comunes ($, esc, copia) en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE] en cada cambio: es lo
   que copia Mis ejercicios (biblioteca.js). Expone window.UnidadesApp para
   el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const P = Unidades, CLAVE = 'unidades-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null;

  /* ---------- Formulario ---------- */
  const unidades = () => (P.MAGNITUDES[sc.mag] || P.MAGNITUDES.longitud).u;
  const opcionesU = (sel) => unidades().map((u) => `<option value="${esc(u.s)}"${u.s === sel ? ' selected' : ''}>${esc(u.n)} (${esc(u.s)})</option>`).join('');
  function formulario() {
    if (!P.MAGNITUDES[sc.mag]) sc.mag = 'longitud';
    const L = unidades();
    if (!L.some((u) => u.s === sc.de)) sc.de = L[0].s;
    if (!L.some((u) => u.s === sc.a)) sc.a = L[Math.min(1, L.length - 1)].s;
    $('#campos').innerHTML = `<label for="f-mag">Magnitud</label><select id="f-mag" class="in" data-k="mag">${Object.entries(P.MAGNITUDES).map(([k, m]) => `<option value="${k}"${k === sc.mag ? ' selected' : ''}>${m.n}</option>`).join('')}</select>`
      + `<label for="f-valor">Valor</label><input id="f-valor" class="in" data-k="valor" value="${esc(sc.valor ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`
      + `<label for="f-de">De</label><select id="f-de" class="in" data-k="de">${opcionesU(sc.de)}</select>`
      + `<label for="f-a">A</label><select id="f-a" class="in" data-k="a">${opcionesU(sc.a)}</select>`
      + `<div class="ancho cambia"><button type="button" class="btn" id="intercambia" title="Intercambiar las dos unidades">⇄ Intercambiar</button></div>`;
    $('#nota').textContent = 'Se admite coma decimal, 3e8 y 3·10^8. Las temperaturas no pueden bajar del cero absoluto.';
  }
  const lee = (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.dataset.k === 'mag') { sc.de = ''; sc.a = ''; formulario(); }
    calcula();
  };
  $('#campos').addEventListener('input', lee);
  $('#campos').addEventListener('change', lee);
  $('#campos').addEventListener('click', (e) => {
    if (!e.target.closest('#intercambia')) return;
    [sc.de, sc.a] = [sc.a, sc.de]; $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar para el modo práctica
  const azar = () => { sc = P.azar(); formulario(); calcula(); sel.value = ''; };
  const enunciado = () => `Convierte <b>${esc(sc.valor)} ${esc(sc.de)}</b> a <b>${esc(sc.a)}</b> (${esc((P.MAGNITUDES[sc.mag] || {}).n || '').toLowerCase()}).`;

  /* ---------- Resultados ---------- */
  const dato = (t, v, cl) => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#todas').innerHTML = ''; $('#pasos').innerHTML = ''; return;
    }
    err.hidden = true; guarda();
    $('#resumen').innerHTML = dato(`${esc(sol.ud.n)} → ${esc(sol.ua.n)}`, sol.resH, 'pr ancho') + (sol.factor ? dato('Factor', sol.factor, 'ancho') : '');
    $('#todas').innerHTML = sol.filas.map((f) => dato(esc(f.t), f.v)).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
  }

  /* ---------- Constantes ---------- */
  function constantes() {
    const q = $('#busca').value, L = P.busca(q, edicion());
    $('#ctes').innerHTML = L.map((c) => `<tr><td class="n">${esc(c.n)}</td><td class="s">${c.s}</td><td class="v">${esc(c.d)}${c.e ? `·10<sup>${String(c.e).replace('-', '−')}</sup>` : ''}</td><td class="u">${c.u}</td><td class="x">${esc(c.x)}</td></tr>`).join('')
      || '<tr><td colspan="5">Ninguna constante coincide con la búsqueda.</td></tr>';
    $('#ctes-n').textContent = `${L.length} de ${P.CONSTANTES.length}`;
  }
  const edicion = () => ($('#edicion') && $('#edicion').value === '2018' ? 2018 : 2022);
  try { if ($('#edicion') && localStorage.getItem('simu-codata') === '2018') $('#edicion').value = '2018'; } catch (e) {}
  if ($('#edicion')) $('#edicion').addEventListener('change', () => { try { localStorage.setItem('simu-codata', $('#edicion').value); } catch (e) {} constantes(); });
  $('#busca').addEventListener('input', constantes);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('unidades').current;
  formulario(); calcula(); constantes();
  window.UnidadesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { v: sol.res }, estado: () => copia(sc) };
})();
