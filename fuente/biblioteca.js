/* =====================================================================
   «Mis ejercicios»: barra lateral común a todas las herramientas, como la
   del simulador de electrostática. Guarda en este navegador el estado de la
   herramienta (lo que cada app ya deja en localStorage con su CLAVE) con un
   título, una carpeta y la marca de fijado; abre, renombra, borra, exporta e
   importa ejercicios en archivos .simu.json. Abrir uno deja su estado en la
   CLAVE de la app y recarga la página, así sirve para cualquier herramienta.
   ===================================================================== */
const Biblioteca = (() => {
  // carpeta de la herramienta → clave de localStorage donde la app guarda su estado
  const CLAVES = {
    alterna: 'alterna-v1', calorimetria: 'calorimetria-v1', circuitos: 'circuitos-v1', condensadores: 'condensadores-v1',
    'configuracion-electronica': 'configuracion-v1', dinamica: 'dinamica-v1', disoluciones: 'disoluciones-v1', doppler: 'doppler-v1', fluidos: 'fluidos-v1', estadistica: 'estadistica-v1', regresion: 'regresion-v1',
    faraday: 'faraday-v1', gases: 'gases-v1', induccion: 'induccion-v1', magnetostatica: 'magneto-cur-v1', 'masa-molar': 'masa-molar-v1',
    matrices: 'matrices-v1', resistencias: 'resistencias-v1', ondas: 'ondas-v1', sistemas: 'sistemas-v1', complejos: 'complejos-v1', 'solido-rigido': 'solido-rigido-v1', 'tiro-parabolico': 'tiro-v1',
    'trabajo-y-energia': 'energia-v1',
  };
  const FORMATO = 'simulaciencia-ejercicios', ANCHO = 1280;
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const lee = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
  const escribe = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); return true; } catch (e) { return false; } };
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const CSS = `
.bib-btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; cursor: pointer; white-space: nowrap }
.bib-btn:hover, .bib-btn[aria-expanded=true] { border-color: var(--accent); color: var(--accent) }
.bib { position: fixed; top: 0; left: 0; bottom: 0; width: 290px; max-width: 88vw; z-index: 60; background: var(--panel); border-right: 1px solid var(--line); display: flex; flex-direction: column; transform: translateX(-102%); transition: transform .18s ease; font: 13.5px/1.4 var(--f-ui, system-ui); color: var(--ink) }
.bib.abierta { transform: none; box-shadow: 4px 0 24px rgba(0,0,0,.12) }
.bib-scrim { position: fixed; inset: 0; z-index: 59; background: rgba(0,0,0,.3) }
@media (min-width: ${ANCHO}px) { body.bib-fija { padding-left: 290px } body.bib-fija .bib.abierta { box-shadow: none } body.bib-fija .bib-scrim { display: none } }
@media (prefers-reduced-motion: reduce) { .bib { transition: none } }
.bib-h { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 8px 14px }
.bib-h b { font: 600 15px var(--f-ui, system-ui) }
.bib-x { border: 0; background: none; color: var(--muted); font-size: 20px; line-height: 1; cursor: pointer; padding: 2px 6px; border-radius: 6px }
.bib-x:hover { background: var(--bg) }
.bib-acc { display: grid; gap: 2px; padding: 0 8px 8px }
.bib-acc button, .bib-acc label { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; border: 0; background: none; color: var(--ink); font: 500 13.5px var(--f-ui, system-ui); padding: 6px 8px; border-radius: 8px; cursor: pointer }
.bib-acc button:hover, .bib-acc label:hover { background: var(--bg) }
.bib-acc button:disabled { opacity: .45; cursor: default; background: none }
.bib-ic { width: 22px; height: 22px; border-radius: 6px; display: inline-grid; place-items: center; border: 1px solid var(--line); color: var(--accent); font-size: 13px; flex: 0 0 auto }
.bib-busca { margin: 4px 2px 0; font: 13px var(--f-ui, system-ui); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 6px 9px; width: calc(100% - 4px) }
.bib-form { margin: 0 10px 8px; padding: 10px; border: 1px solid var(--accent); border-radius: 10px; display: grid; gap: 6px }
.bib-form label { font-size: 12px; color: var(--muted); display: grid; gap: 2px }
.bib-form input { font: 13px var(--f-ui, system-ui); color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px }
.bib-form .fila { display: flex; gap: 6px; justify-content: flex-end }
.bib-form button { font: 500 13px var(--f-ui, system-ui); border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 6px; padding: 5px 10px; cursor: pointer }
.bib-form button.si { background: var(--accent); border-color: var(--accent); color: var(--panel) }
.bib-lista { flex: 1; overflow-y: auto; padding: 0 8px 8px; border-top: 1px solid var(--line) }
.bib-sec { font: 600 11px var(--f-ui, system-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin: 12px 6px 4px }
.bib-carp { display: flex; align-items: center; gap: 6px; width: 100%; border: 0; background: none; color: var(--ink); font: 600 13px var(--f-ui, system-ui); padding: 5px 6px; border-radius: 6px; cursor: pointer; text-align: left }
.bib-carp:hover { background: var(--bg) } .bib-carp .n { margin-left: auto; color: var(--muted); font-weight: 400; font-size: 12px }
.bib-it { display: flex; align-items: center; gap: 2px; border-radius: 8px; padding-left: 2px }
.bib-it:hover, .bib-it:focus-within { background: var(--bg) }
.bib-it.activo { background: var(--accent-soft, var(--bg)); box-shadow: inset 3px 0 0 var(--accent) }
.bib-carpd .bib-it { margin-left: 14px }
.bib-abre { flex: 1; min-width: 0; border: 0; background: none; color: var(--ink); text-align: left; font: 13.5px var(--f-ui, system-ui); padding: 6px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.bib-mini { border: 0; background: none; color: var(--muted); cursor: pointer; font-size: 13px; width: 26px; height: 26px; border-radius: 6px; flex: 0 0 auto; opacity: .55 }
.bib-it:hover .bib-mini, .bib-it:focus-within .bib-mini, .bib-mini.on { opacity: 1 } .bib-mini:hover { background: var(--panel); color: var(--accent) } .bib-mini.on { color: var(--accent) }
@media (hover: none) { .bib-mini { opacity: 1 } }
.bib-vacio { color: var(--muted); padding: 10px 6px; margin: 0 }
.bib-pie { border-top: 1px solid var(--line); padding: 8px 14px 12px; color: var(--muted); font-size: 12px }
.bib-pie p { margin: 0 }
.bib-aviso { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 70; background: var(--ink); color: var(--panel); padding: 8px 14px; border-radius: 8px; font: 13px var(--f-ui, system-ui); box-shadow: 0 4px 16px rgba(0,0,0,.2) }
.bib.arrastre { outline: 2px dashed var(--accent); outline-offset: -6px }
`;

  function monta(herramienta) {
    const clave = CLAVES[herramienta], cab = document.querySelector('header.top');
    if (!clave || !cab || document.querySelector('.bib')) return null;
    const K = `simu-ejercicios:${herramienta}`, K_UI = 'simu-ejercicios-ui', K_ACT = `simu-ejercicios-activo:${herramienta}`;
    const nombre = (document.querySelector('h1')?.textContent || document.title.split('·')[0]).trim();
    let lib = lee(K, { items: [] }); if (!Array.isArray(lib.items)) lib = { items: [] };
    let ui = { abierta: window.innerWidth >= ANCHO, cerradas: {}, ...lee(K_UI, {}) };
    let activo = null; try { activo = sessionStorage.getItem(K_ACT); } catch (e) { /* sin almacenamiento */ }
    if (activo && !lib.items.some((x) => x.id === activo)) activo = null;
    let busca = '', form = null, borrando = null;
    const guardaLib = () => escribe(K, lib) || aviso('No se pudo guardar: el navegador no deja usar el almacenamiento');
    const guardaUI = () => escribe(K_UI, ui);
    const ponActivo = (id) => { activo = id; try { if (id) sessionStorage.setItem(K_ACT, id); else sessionStorage.removeItem(K_ACT); } catch (e) { /* sin almacenamiento */ } };
    // las apps que guardan con retraso escuchan «simu-guardar» y guardan al momento
    const estado = () => { window.dispatchEvent(new Event('simu-guardar')); try { return localStorage.getItem(clave); } catch (e) { return null; } };
    const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const ejemplo = () => { const s = document.querySelector('select#ejemplo, select[id^="ejemplo"]'); return s && s.value && s.selectedOptions[0] ? s.selectedOptions[0].textContent.trim() : ''; };

    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.className = 'bib-btn'; btn.type = 'button'; btn.setAttribute('aria-controls', 'bib'); btn.title = 'Guardar, abrir, exportar e importar tus ejercicios';
    btn.innerHTML = '<span aria-hidden="true">☰</span> Mis ejercicios';
    const ini = cab.querySelector('.a-inicio'); (ini ? ini.after(btn) : cab.prepend(btn));
    const panel = document.createElement('aside'); panel.className = 'bib'; panel.id = 'bib'; panel.setAttribute('aria-label', 'Mis ejercicios');
    const scrim = document.createElement('div'); scrim.className = 'bib-scrim'; scrim.hidden = true;
    const archivo = document.createElement('input'); archivo.type = 'file'; archivo.accept = '.json,application/json'; archivo.multiple = true; archivo.hidden = true;
    document.body.append(panel, scrim, archivo);

    let tAviso = 0;
    function aviso(t) {
      let a = document.querySelector('.bib-aviso'); if (!a) { a = document.createElement('div'); a.className = 'bib-aviso'; a.setAttribute('role', 'status'); document.body.appendChild(a); }
      a.textContent = t; a.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => { a.hidden = true; }, 2600);
    }
    function abre(v) {
      ui.abierta = v; guardaUI();
      panel.classList.toggle('abierta', v); btn.setAttribute('aria-expanded', String(v));
      document.body.classList.toggle('bib-fija', v && window.innerWidth >= ANCHO);
      scrim.hidden = !v || window.innerWidth >= ANCHO;
    }
    function descarga(nombreArch, datos) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = nombreArch; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    const archivoDe = (items) => ({ formato: FORMATO, version: 1, herramienta, guardado: new Date().toISOString(), ejercicios: items.map((i) => ({ titulo: i.titulo, carpeta: i.carpeta || undefined, fijado: i.fijado || undefined, datos: i.datos })) });
    const nombreArchivo = (t) => (norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ejercicio') + '.simu.json';

    function importa(texto) {
      const d = JSON.parse(texto);
      if (d?.formato !== FORMATO || !Array.isArray(d.ejercicios)) throw new Error('no es un archivo de ejercicios de SimulaCiencia');
      if (d.herramienta !== herramienta) throw new Error(`es de otra herramienta (${d.herramienta})`);
      let n = 0;
      for (const e of d.ejercicios) {
        if (typeof e?.datos !== 'string') continue;
        lib.items.push({ id: nuevoId(), titulo: String(e.titulo || 'Ejercicio importado').slice(0, 120), carpeta: String(e.carpeta || '').slice(0, 60), fijado: !!e.fijado, datos: e.datos, actualizado: Date.now() }); n++;
      }
      return n;
    }
    async function importaArchivos(files) {
      let n = 0;
      for (const f of files) {
        try { n += importa(await f.text()); } catch (err) { aviso(`No se pudo importar ${f.name}: ${err.message}`); return; }
      }
      guardaLib(); pinta(); aviso(n === 1 ? 'Ejercicio importado' : `${n} ejercicios importados`);
    }
    function carga(it) {
      if (!escribe(clave, it.datos)) { aviso('No se pudo abrir: el navegador no deja usar el almacenamiento'); return; }
      ponActivo(it.id);
      // si se estaba practicando, lo que se abre sustituye a los datos de antes de la práctica
      try { sessionStorage.removeItem(`simu-practica:${herramienta}`); } catch (e) { /* sin almacenamiento */ }
      // sin el #… de la dirección, que en algunas herramientas (configuración electrónica) manda sobre lo guardado
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
    }
    function guardaForm() {
      const t = panel.querySelector('#bib-t').value.trim() || 'Ejercicio sin título', c = panel.querySelector('#bib-c').value.trim();
      if (form.id) { const it = lib.items.find((x) => x.id === form.id); if (it) Object.assign(it, { titulo: t, carpeta: c, actualizado: Date.now() }); }
      else {
        const datos = estado();
        if (datos == null) { aviso('Todavía no hay nada que guardar: cambia algún dato primero'); return; }
        const it = { id: nuevoId(), titulo: t, carpeta: c, fijado: false, datos, actualizado: Date.now() };
        lib.items.push(it); ponActivo(it.id); aviso('Guardado en Mis ejercicios');
      }
      form = null; guardaLib(); pinta();
    }
    function actualiza() {
      const it = lib.items.find((x) => x.id === activo), datos = estado();
      if (!it || datos == null) return;
      it.datos = datos; it.actualizado = Date.now(); guardaLib(); pinta(); aviso(`Cambios guardados en «${it.titulo}»`);
    }

    function fila(it) {
      const b = borrando === it.id;
      return `<div class="bib-it${it.id === activo ? ' activo' : ''}" data-id="${it.id}">
<button class="bib-abre" data-acc="abrir" title="Abrir «${esc(it.titulo)}»">${esc(it.titulo)}</button>${b
        ? '<button class="bib-mini on" data-acc="si-borrar" title="Borrar de verdad" aria-label="Confirmar borrar">✓</button><button class="bib-mini" data-acc="no-borrar" title="No borrar" aria-label="Cancelar">✕</button>'
        : `<button class="bib-mini${it.fijado ? ' on' : ''}" data-acc="fijar" title="${it.fijado ? 'Quitar de fijados' : 'Fijar arriba'}" aria-label="${it.fijado ? 'Quitar de fijados' : 'Fijar'}" aria-pressed="${!!it.fijado}">${it.fijado ? '★' : '☆'}</button><button class="bib-mini" data-acc="editar" title="Cambiar el título o la carpeta" aria-label="Editar">✎</button><button class="bib-mini" data-acc="exportar" title="Exportar este ejercicio" aria-label="Exportar">⤓</button><button class="bib-mini" data-acc="borrar" title="Borrar" aria-label="Borrar">🗑</button>`}
</div>`;
    }
    function pinta() {
      const q = norm(busca), vis = lib.items.filter((i) => !q || norm(i.titulo + ' ' + (i.carpeta || '')).includes(q));
      const orden = (a, b) => a.titulo.localeCompare(b.titulo, 'es', { numeric: true });
      const fij = vis.filter((i) => i.fijado).sort(orden), resto = vis.filter((i) => !i.fijado);
      const sueltos = resto.filter((i) => !i.carpeta).sort(orden), carpetas = {};
      for (const i of resto) if (i.carpeta) (carpetas[i.carpeta] ||= []).push(i);
      let lista = '';
      if (fij.length) lista += `<p class="bib-sec">Fijados</p>${fij.map(fila).join('')}`;
      const nombres = Object.keys(carpetas).sort((a, b) => a.localeCompare(b, 'es'));
      if (nombres.length || sueltos.length) lista += `<p class="bib-sec">Mis ejercicios</p>`;
      for (const n of nombres) {
        const ab = q || !ui.cerradas[`${herramienta}/${n}`];
        lista += `<button class="bib-carp" data-carpeta="${esc(n)}" aria-expanded="${!!ab}"><span aria-hidden="true">${ab ? '▾' : '▸'}</span>${esc(n)}<span class="n">${carpetas[n].length}</span></button>${ab ? `<div class="bib-carpd">${carpetas[n].sort(orden).map(fila).join('')}</div>` : ''}`;
      }
      lista += sueltos.map(fila).join('');
      if (!vis.length) lista = `<p class="bib-vacio">${lib.items.length ? 'Ningún ejercicio coincide con la búsqueda.' : 'Aún no has guardado ningún ejercicio. Prepara los datos y pulsa «Guardar el actual».'}</p>`;
      const it = lib.items.find((x) => x.id === activo), carps = [...new Set(lib.items.map((x) => x.carpeta).filter(Boolean))];
      const f = form && (form.id ? lib.items.find((x) => x.id === form.id) : { titulo: ejemplo() || `Ejercicio ${lib.items.length + 1}`, carpeta: it?.carpeta || '' });
      panel.innerHTML = `<div class="bib-h"><b>Mis ejercicios</b><button class="bib-x" data-acc="cerrar" title="Cerrar" aria-label="Cerrar Mis ejercicios">×</button></div>
<div class="bib-acc">
<button data-acc="nuevo"><span class="bib-ic">+</span>Guardar el actual como nuevo</button>
<button data-acc="actualizar"${it ? '' : ' disabled'} title="${it ? `Guarda los datos de ahora en «${esc(it.titulo)}»` : 'Abre o guarda antes un ejercicio'}"><span class="bib-ic">↻</span>${it ? `Guardar cambios en «${esc(it.titulo.length > 22 ? it.titulo.slice(0, 21) + '…' : it.titulo)}»` : 'Guardar cambios'}</button>
<button data-acc="importar"><span class="bib-ic">↥</span>Importar archivo…</button>
<button data-acc="exportar-todo"${lib.items.length ? '' : ' disabled'}><span class="bib-ic">↧</span>Exportar todos</button>
${lib.items.length > 5 ? `<input type="search" class="bib-busca" placeholder="Buscar por título o carpeta…" aria-label="Buscar ejercicios" value="${esc(busca)}">` : ''}
</div>
${f ? `<div class="bib-form"><label>Título<input id="bib-t" value="${esc(f.titulo)}" maxlength="120" autocomplete="off"></label><label>Carpeta (opcional)<input id="bib-c" value="${esc(f.carpeta || '')}" maxlength="60" list="bib-dl" placeholder="sin carpeta" autocomplete="off"></label><datalist id="bib-dl">${carps.map((c) => `<option value="${esc(c)}">`).join('')}</datalist><div class="fila"><button data-acc="cancelar">Cancelar</button><button class="si" data-acc="guardar">Guardar</button></div></div>` : ''}
<div class="bib-lista">${lista}</div>
<div class="bib-pie"><p>Se guardan en este navegador. Exporta un archivo <code>.simu.json</code> para llevarlos a otro equipo o compartirlos; también puedes arrastrarlo aquí.</p></div>`;
      if (f) { const t = panel.querySelector('#bib-t'); t.focus(); t.select(); }
    }

    panel.addEventListener('click', (e) => {
      const car = e.target.closest('.bib-carp');
      if (car) { const k = `${herramienta}/${car.dataset.carpeta}`; ui.cerradas[k] = !ui.cerradas[k]; guardaUI(); pinta(); return; }
      const b = e.target.closest('[data-acc]'); if (!b) return;
      const id = b.closest('.bib-it')?.dataset.id, it = id && lib.items.find((x) => x.id === id);
      switch (b.dataset.acc) {
        case 'cerrar': abre(false); btn.focus(); break;
        case 'nuevo': form = {}; pinta(); break;
        case 'actualizar': actualiza(); break;
        case 'importar': archivo.click(); break;
        case 'exportar-todo': descarga(nombreArchivo(nombre + ' ejercicios'), archivoDe(lib.items)); break;
        case 'guardar': guardaForm(); break;
        case 'cancelar': form = null; pinta(); break;
        case 'abrir': if (it) carga(it); break;
        case 'fijar': if (it) { it.fijado = !it.fijado; guardaLib(); pinta(); } break;
        case 'editar': if (it) { form = { id }; pinta(); } break;
        case 'exportar': if (it) descarga(nombreArchivo(it.titulo), archivoDe([it])); break;
        case 'borrar': borrando = id; pinta(); break;
        case 'no-borrar': borrando = null; pinta(); break;
        case 'si-borrar': lib.items = lib.items.filter((x) => x.id !== id); if (activo === id) ponActivo(null); borrando = null; guardaLib(); pinta(); aviso('Ejercicio borrado'); break;
      }
    });
    panel.addEventListener('keydown', (e) => {
      if (e.target.closest('.bib-form') && e.key === 'Enter') { e.preventDefault(); guardaForm(); }
      else if (e.key === 'Escape') { if (form) { form = null; pinta(); } else { abre(false); btn.focus(); } }
    });
    panel.addEventListener('input', (e) => { if (e.target.classList.contains('bib-busca')) { busca = e.target.value; const pos = e.target.selectionStart; pinta(); const s = panel.querySelector('.bib-busca'); s.focus(); s.setSelectionRange(pos, pos); } });
    panel.addEventListener('dragover', (e) => { e.preventDefault(); panel.classList.add('arrastre'); });
    panel.addEventListener('dragleave', () => panel.classList.remove('arrastre'));
    panel.addEventListener('drop', (e) => { e.preventDefault(); panel.classList.remove('arrastre'); if (e.dataTransfer.files.length) importaArchivos([...e.dataTransfer.files]); });
    archivo.addEventListener('change', () => { if (archivo.files.length) importaArchivos([...archivo.files]); archivo.value = ''; });
    btn.addEventListener('click', () => abre(!panel.classList.contains('abierta')));
    scrim.addEventListener('click', () => abre(false));
    window.addEventListener('resize', () => abre(panel.classList.contains('abierta')));

    pinta(); abre(!!ui.abierta);
    return { get items() { return lib.items; }, abre, importa: (t) => { const n = importa(t); guardaLib(); pinta(); return n; }, archivoDe };
  }
  return { monta, CLAVES, FORMATO };
})();
if (typeof module !== 'undefined') module.exports = Biblioteca;
