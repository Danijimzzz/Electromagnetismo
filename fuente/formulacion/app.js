/* =====================================================================
   Interfaz de la formulación inorgánica: un campo de texto con dos modos
   (de fórmula a nombre y de nombre a fórmula), el resultado con las tres
   nomenclaturas (sistemática, Stock y tradicional) y el desarrollo paso a
   paso. El cálculo está en formulacion/calculo.js (Formulacion) y los
   ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc = { modo, texto }) en localStorage['formulacion-v1']
   en cada cambio. Expone window.FormulacionApp para el modo práctica y las
   pruebas; las respuestas válidas del modo práctica están en #aceptadas.
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const P = Formulacion, CLAVE = 'formulacion-v1', MAX_ACEPTADAS = 60;

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && typeof g.texto === 'string') sc = { modo: g.modo === 'n2f' ? 'n2f' : 'f2n', texto: g.texto }; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null;

  /* ---------- Formulario ---------- */
  const entrada = $('#texto');
  const PIE = {
    f2n: ['Fórmula', 'Fe2O3, H2SO4, Ca(OH)2, Al2(SO4)3…', 'Escribe la fórmula con los números normales (Fe2O3) o con subíndices (Fe₂O₃). Las mayúsculas y las minúsculas importan: CO es el monóxido de carbono y Co es el cobalto.'],
    n2f: ['Nombre', 'óxido de hierro(III), ácido sulfúrico…', 'Vale cualquier nomenclatura: sistemática (trióxido de dihierro), de Stock (óxido de hierro(III)) o tradicional (óxido férrico). Los acentos y las mayúsculas no importan; el número romano puede ir como (III) o (3).'],
  };
  function formulario() {
    const [et, ph, nota] = PIE[sc.modo];
    $('#et-texto').textContent = et; entrada.placeholder = ph; entrada.value = sc.texto; $('#nota').textContent = nota;
    for (const m of ['f2n', 'n2f']) $('#tab-' + m).setAttribute('aria-selected', String(sc.modo === m));
  }
  entrada.addEventListener('input', () => { sc.texto = entrada.value; $('#ejemplos').value = ''; calcula(); });
  for (const m of ['f2n', 'n2f']) $('#tab-' + m).addEventListener('click', () => {
    if (sc.modo === m) return;
    // lo que se ha resuelto pasa al otro modo: de la fórmula al nombre y de vuelta
    const texto = sol ? (m === 'n2f' ? sol.c.lineas.filter((l) => l.et !== 'Nombre común')[0].nombre : sol.c.formula) : '';
    sc = { modo: m, texto }; $('#ejemplos').value = ''; formulario(); calcula();
  });
  $('#sugs').addEventListener('click', (e) => { const b = e.target.closest('button[data-t]'); if (!b) return; sc.texto = b.dataset.t; $('#ejemplos').value = ''; formulario(); calcula(); });
  $('#res').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-c]'); if (!b) return;
    try { navigator.clipboard.writeText(b.dataset.c); b.textContent = '✓'; setTimeout(() => { b.textContent = 'Copiar'; }, 1200); } catch (err) { /* sin portapapeles */ }
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  const grupos = [...new Set(P.ejemplos.map((e) => e.grupo))];
  sel.innerHTML = '<option value="">Ejemplos…</option>' + grupos.map((g) => `<optgroup label="${esc(g)}">${P.ejemplos.filter((e) => e.grupo === g).map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un compuesto de los habituales al azar, en un modo al azar, para el modo práctica
  const habituales = P.todos().filter((c) => c.comun);
  function azar() {
    const c = habituales[Math.floor(Math.random() * habituales.length)], modo = Math.random() < 0.5 ? 'f2n' : 'n2f';
    sc = { modo, texto: modo === 'f2n' ? c.formula : P.nombreEnunciado(c, Math.floor(Math.random() * 3)) };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => (sc.modo === 'f2n'
    ? `Escribe el nombre del compuesto <b>${sol ? sol.c.html : esc(sc.texto)}</b> en cualquiera de las tres nomenclaturas (sistemática, de Stock o tradicional).`
    : `Escribe la fórmula del compuesto llamado <b>${esc(sc.texto)}</b>.`);

  /* ---------- Cálculo ---------- */
  const estado = (c) => (c.esp ? '' : `${c.cat.f}: +${c.cat.v} · ${P.fh(c.an.f)}: −${c.an.w}`);
  function calcula() {
    const err = $('#error'), sugs = $('#sugs');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false; entrada.setAttribute('aria-invalid', 'true');
      sugs.innerHTML = (e.sugerencias || []).length ? '<span class="nota">¿Quizá este?</span> ' + e.sugerencias.map((s) => `<button type="button" class="btn" data-t="${esc(s.replace(/[₀-₉]/g, (d) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(d)))}">${esc(s)}</button>`).join(' ') : '';
      for (const q of ['#formula', '#tipo', '#res', '#pasos', '#aceptadas']) $(q).innerHTML = '';
      return;
    }
    err.hidden = true; sugs.innerHTML = ''; entrada.removeAttribute('aria-invalid'); guarda();
    const c = sol.c;
    $('#formula').innerHTML = c.html;
    $('#tipo').innerHTML = `<div><span>Tipo de compuesto</span><b>${c.tipo}</b></div>` + (c.esp ? '' : `<div><span>Estados de oxidación</span><b>${estado(c)}</b></div>`);
    $('#res').innerHTML = c.lineas.map((l) => {
      const nombres = [l.nombre, ...(l.otros || [])];
      const usada = sol.usada && nombres.some((n) => P.norm(n) === P.norm(sol.usada.nombre));
      return `<div class="ancho${usada ? ' usada' : ''}"><span>${esc(l.et)}${l.nota ? ` (${esc(l.nota)})` : ''}${usada ? ' · la que has escrito' : ''}</span>${nombres.map((n) => `<b class="nombre">${esc(n)}</b>`).join(' <i>o</i> ')} <button type="button" class="btn copiar" data-c="${esc(l.nombre)}" aria-label="Copiar ${esc(l.nombre)}">Copiar</button></div>`;
    }).join('') + (sol.alt.length ? `<div class="ancho"><span>Otra lectura posible</span><b class="nombre">${sol.alt.map((a) => esc(a.lineas[0].nombre)).join(', ')}</b></div>` : '');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#aceptadas').innerHTML = P.aceptadas(c, sc.modo).slice(0, MAX_ACEPTADAS).map((a, i) => `<span id="ac${i}">${esc(a)}</span>`).join('');
  }

  /* ---------- Tabla de oxoácidos de la teoría ---------- */
  const tabla = $('#tabla-oxo');
  if (tabla) tabla.innerHTML = '<thead><tr><th>Fórmula</th><th>Tradicional</th><th>Stock</th><th>Sistemática</th></tr></thead><tbody>' + P.todos().filter((c) => c.tipo === 'Oxoácido' && !c.esp && c.an.comun).map((c) => `<tr><td>${c.html}</td><td>${esc(c.lineas[2].nombre)}</td><td>${esc(c.lineas[1].nombre)}</td><td>${esc(c.lineas[0].nombre)}</td></tr>`).join('') + '</tbody>';

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('formulacion').current;
  formulario(); calcula();
  window.FormulacionApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { formula: sol.formula }, estado: () => copia(sc) };
})();
