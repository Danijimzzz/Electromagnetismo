/* =====================================================================
   Interfaz común de las herramientas de Economía (EcoApp): cada app.js de
   Economía llama a EcoApp.monta con lo suyo y esto pone el formulario, los
   ejemplos, el cálculo con su error, los resultados, la tabla, la gráfica
   (Eco.grafica, en economia/comun.js) y el desarrollo, y guarda el estado.
   La página sigue la plantilla: #ejemplos, #campos, #nota, #error,
   #resumen, #grafica, #leyenda, #pasos y, si hay tabla, #tabla.
     EcoApp.monta({
       C,            el cálculo: { resolver(sc), ejemplos }
       carpeta,      la de catalogo.js; el estado va en localStorage['<carpeta>-v1']
       app,          nombre de window.<app> para el modo práctica y las pruebas
       campos(sc),   lista de campos: { k, nom, un, tipo: 'num' | 'sel' | 'area' | 'texto',
                     ops: [[valor, texto]], sep: 'título de grupo', ayuda, filas }
       resumen(sol), [[etiqueta, valor HTML, ancho?]] de la tarjeta de resultados
       tabla(sol),   HTML de la tabla (opcional)
       grafica(sol, col), configuración de Eco.grafica o null
       leyenda(sol), HTML bajo la gráfica
       nota,         texto de ayuda bajo los datos
       azar(),       sc al azar para el modo práctica (opcional)
       enunciado(sc, sol), enunciado del modo práctica (opcional)
     })
   Un cambio en un desplegable vuelve a pintar el formulario (los campos pueden
   depender del modo elegido).
   ===================================================================== */
const EcoApp = (() => {
  function monta(o) {
    const { $, esc, copia } = Herramienta;
    const C = o.C, CLAVE = `${o.carpeta}-v1`;
    let sc = copia(C.ejemplos[0].sc);
    try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
    const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
    let sol = null, col = {};

    /* ---------- Formulario ---------- */
    const campo = (c) => {
      const id = `f-${c.k}`, v = sc[c.k] ?? '';
      const et = `<label for="${id}"${c.tipo === 'area' ? ' class="ancho"' : ''}>${c.nom}${c.un ? ` <small>(${c.un})</small>` : ''}${c.ayuda ? ` <small>${c.ayuda}</small>` : ''}</label>`;
      if (c.tipo === 'sel') return et + `<select id="${id}" class="in" data-k="${c.k}">${c.ops.map(([val, t]) => `<option value="${val}"${val === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
      if (c.tipo === 'area') return et + `<textarea id="${id}" class="in ancho" data-k="${c.k}" rows="${c.filas || 7}" spellcheck="false" autocomplete="off">${esc(v)}</textarea>`;
      return et + `<input id="${id}" class="in" data-k="${c.k}" value="${esc(v)}"${c.tipo === 'texto' ? '' : ' inputmode="decimal"'} autocomplete="off">`;
    };
    function formulario() {
      const cs = o.campos(sc);
      // los desplegables empiezan en su primera opción si el estado no trae valor
      for (const c of cs) if (c.tipo === 'sel' && !c.ops.some(([val]) => val === sc[c.k])) sc[c.k] = c.ops[0][0];
      $('#campos').innerHTML = cs.map((c) => (c.sep ? `<div class="sep">${c.sep}</div>` : '') + campo(c)).join('');
      if (o.nota) $('#nota').innerHTML = o.nota;
    }
    $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k || t.tagName === 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
    $('#campos').addEventListener('change', (e) => { const t = e.target; if (!t.dataset.k || t.tagName !== 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; formulario(); calcula(); });

    /* ---------- Ejemplos ---------- */
    const sel = $('#ejemplos');
    sel.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
    sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
    function abrirEjemplo(clave) {
      const e = C.ejemplos.find((x) => x.clave === clave);
      if (!e) return;
      sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
    }
    function azar() { if (!o.azar) return; sc = o.azar(); formulario(); calcula(); sel.value = ''; }

    /* ---------- Cálculo ---------- */
    function calcula() {
      const err = $('#error');
      try { sol = C.resolver(sc); } catch (e) {
        sol = null; err.textContent = e.message; err.hidden = false;
        for (const s of ['#resumen', '#pasos', '#leyenda', '#tabla']) { const el = $(s); if (el) el.innerHTML = ''; }
        dibuja(); return;
      }
      err.hidden = true; guarda();
      $('#resumen').innerHTML = o.resumen(sol).map(([t, v, ancho]) => `<div${ancho ? ' class="ancho"' : ''}><span>${t}</span><b>${v}</b></div>`).join('');
      $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
      const tb = $('#tabla'); if (tb) { const h = o.tabla ? o.tabla(sol) : ''; tb.innerHTML = h; tb.closest('.card').hidden = !h; }
      $('#leyenda').innerHTML = o.leyenda ? o.leyenda(sol) : '';
      dibuja();
    }

    /* ---------- Gráfica ---------- */
    function dibuja() {
      const c = $('#grafica'); if (!c) return;
      const cfg = sol && o.grafica ? o.grafica(sol, col) : null;
      if (!cfg) { Herramienta.lienzo(c); return; }
      Eco.grafica(c, cfg, col);
    }
    const colores = () => { col = Eco.colores(o.colores || []); };
    window.addEventListener('resize', dibuja);
    // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

    const ver = $('#ver'); if (ver) ver.textContent = Version.de(o.carpeta).current;
    colores(); formulario(); calcula();
    const enunciado = () => (o.enunciado ? o.enunciado(sc, sol) : undefined);
    return (window[o.app] = { abrirEjemplo, azar, enunciado, resultado: () => sol, estado: () => copia(sc) });
  }
  return { monta };
})();
