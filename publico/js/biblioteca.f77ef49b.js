const Biblioteca = (() => {
  const FORMATO = 'simulaciencia-ejercicios', ANCHO = 1280;
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const lee = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
  const escribe = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); return true; } catch (e) { return false; } };
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const FORMATO_COPIA = 'simulaciencia-copia', PREF = 'simu-ejercicios:', K_ELECTRO = 'electro-sim-lib-v2';
  const idAzar = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const leeAlm = (alm, k) => { try { const v = JSON.parse(alm.getItem(k)); return v ?? null; } catch (e) { return null; } };
  function copia(alm = localStorage) {
    const herramientas = {}; let total = 0;
    for (let i = 0; i < alm.length; i++) {
      const k = alm.key(i); if (!k || !k.startsWith(PREF)) continue;
      const lib = leeAlm(alm, k), its = Array.isArray(lib?.items) ? lib.items.filter((x) => typeof x?.datos === 'string') : [];
      if (!its.length) continue;
      herramientas[k.slice(PREF.length)] = its.map((x) => ({ id: x.id, titulo: x.titulo, carpeta: x.carpeta || undefined, fijado: x.fijado || undefined, actualizado: x.actualizado, datos: x.datos }));
      total += its.length;
    }
    const el = leeAlm(alm, K_ELECTRO), electrostatica = Array.isArray(el?.items) && el.items.length ? el.items : undefined;
    return { formato: FORMATO_COPIA, version: 1, guardado: new Date().toISOString(), herramientas, electrostatica, total: total + (electrostatica?.length || 0) };
  }
  function restaura(d, alm = localStorage) {
    if (d?.formato !== FORMATO_COPIA || typeof d.herramientas !== 'object' || !d.herramientas) throw new Error('no es una copia de seguridad de Ciencify');
    let nuevos = 0, repetidos = 0, herr = 0;
    for (const [carpeta, its] of Object.entries(d.herramientas)) {
      if (!/^[a-z0-9-]{1,60}$/.test(carpeta) || !Array.isArray(its)) continue;
      const lib = leeAlm(alm, PREF + carpeta) || { items: [] }; if (!Array.isArray(lib.items)) lib.items = [];
      let suma = 0;
      for (const e of its) {
        if (typeof e?.datos !== 'string') continue;
        const titulo = String(e.titulo || 'Ejercicio importado').slice(0, 120);
        if (lib.items.some((x) => x.titulo === titulo && x.datos === e.datos)) { repetidos++; continue; }
        const id = typeof e.id === 'string' && e.id && !lib.items.some((x) => x.id === e.id) ? e.id : idAzar();
        lib.items.push({ id, titulo, carpeta: String(e.carpeta || '').slice(0, 60), fijado: !!e.fijado, datos: e.datos, actualizado: Number(e.actualizado) || Date.now() }); suma++;
      }
      if (suma) { alm.setItem(PREF + carpeta, JSON.stringify(lib)); herr++; nuevos += suma; }
    }
    if (Array.isArray(d.electrostatica)) {
      const lib = leeAlm(alm, K_ELECTRO) || { items: [] }; if (!Array.isArray(lib.items)) lib.items = [];
      let suma = 0;
      for (const e of d.electrostatica) { if (!e || typeof e.id !== 'string' || !e.scene) continue; if (lib.items.some((x) => x.id === e.id)) repetidos++; else { lib.items.push(e); suma++; } }
      if (suma) { alm.setItem(K_ELECTRO, JSON.stringify(lib)); herr++; nuevos += suma; }
    }
    return { nuevos, repetidos, herramientas: herr };
  }

  const CSS = `
.bib-btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--vidrio, var(--panel)); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none); border: 1px solid var(--vidrio-borde, var(--line)); border-radius: 999px; padding: 5px 12px; cursor: pointer; white-space: nowrap }
.bib-btn:hover, .bib-btn[aria-expanded=true] { border-color: var(--accent); color: var(--accent) }
.bib { position: fixed; top: 0; left: 0; bottom: 0; width: 290px; max-width: 88vw; z-index: 60; background: var(--vidrio-fuerte, var(--panel)); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none); border-right: 1px solid var(--vidrio-borde, var(--line)); display: flex; flex-direction: column; transform: translateX(-102%); transition: transform .18s ease; font: 13.5px/1.4 var(--f-ui, system-ui); color: var(--ink) }
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
.bib-vacio { color: var(--muted); padding: 4px 6px 10px; margin: 0 }
.bib-sec-ej { margin-top: 10px; font: 600 11px var(--f-ui, system-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--muted) }
.bib-sub { font: 600 12px var(--f-ui, system-ui); color: var(--muted); margin: 8px 6px 2px }
.bib-ej { display: block; width: 100%; border: 0; background: none; color: var(--ink); text-align: left; font: 13.5px var(--f-ui, system-ui); padding: 6px; border-radius: 8px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.bib-ej:hover { background: var(--bg) } .bib-ej.activo { background: var(--accent-soft, var(--bg)); box-shadow: inset 3px 0 0 var(--accent) }
.bib-pie { border-top: 1px solid var(--line); padding: 8px 14px 12px; color: var(--muted); font-size: 12px }
.bib-pie p { margin: 0 }
.bib-aviso { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 70; background: var(--ink); color: var(--panel); padding: 8px 14px; border-radius: 8px; font: 13px var(--f-ui, system-ui); box-shadow: 0 4px 16px rgba(0,0,0,.2) }
.bib.arrastre { outline: 2px dashed var(--accent); outline-offset: -6px }
.bib-chk { flex: 0 0 auto; margin: 0 4px 0 6px; accent-color: var(--accent); width: 16px; height: 16px }
.bib-hoja-barra { display: grid; gap: 4px; padding: 0 8px 8px }
.bib-hoja-barra p { margin: 0 6px 4px; color: var(--muted); font-size: 12.5px }
#hoja-imp { display: none }
@media print { .bib, .bib-scrim, .bib-aviso, .bib-btn { display: none !important } body.bib-fija { padding-left: 0 !important } }
@media print { body.hoja-imprimiendo > *:not(#hoja-imp) { display: none !important } body.hoja-imprimiendo #hoja-imp { display: block !important } body.hoja-imprimiendo { padding: 0 !important; background: #fff !important } #hoja-imp { color: #000; font: 11pt/1.4 var(--f-ui, system-ui) } #hoja-imp h1 { font-size: 17pt; margin: 0 0 4px } #hoja-imp .hoja-sub { color: #555; margin: 0 0 14px } #hoja-imp section.hoja-ej { margin: 0 0 18px; padding-top: 10px; border-top: 1px solid #999 } #hoja-imp h2 { font-size: 13pt; margin: 0 0 8px; break-after: avoid } #hoja-imp .card { box-shadow: none !important; border: 0 !important; padding: 0 0 6px !important; background: none !important; break-inside: avoid } #hoja-imp img { max-width: 100%; max-height: 9cm; object-fit: contain } #hoja-imp .pasos li { break-inside: avoid } }
`;

  function monta(herramienta, clave) {
    const cab = document.querySelector('header.top');
    if (!clave || !cab || document.querySelector('.bib')) return null;
    const K = `simu-ejercicios:${herramienta}`, K_UI = 'simu-ejercicios-ui', K_ACT = `simu-ejercicios-activo:${herramienta}`;
    const nombre = (document.querySelector('h1')?.textContent || document.title.split('·')[0]).trim();
    let lib = lee(K, { items: [] }); if (!Array.isArray(lib.items)) lib = { items: [] };
    let ui = { abierta: window.innerWidth >= ANCHO, cerradas: {}, ...lee(K_UI, {}) };
    let activo = null; try { activo = sessionStorage.getItem(K_ACT); } catch (e) { /* sin almacenamiento */ }
    if (activo && !lib.items.some((x) => x.id === activo)) activo = null;
    let busca = '', form = null, borrando = null, hoja = null;
    const guardaLib = () => escribe(K, lib) || aviso('No se pudo guardar: el navegador no deja usar el almacenamiento');
    const guardaUI = () => escribe(K_UI, ui);
    const refresca = () => { const l = lee(K, null); if (l && Array.isArray(l.items)) lib = l; if (activo && !lib.items.some((x) => x.id === activo)) activo = null; };
    window.addEventListener('storage', (e) => { if (e.key === K && !form) { refresca(); pinta(); } });
    const ponActivo = (id) => { activo = id; try { if (id) sessionStorage.setItem(K_ACT, id); else sessionStorage.removeItem(K_ACT); } catch (e) { /* sin almacenamiento */ } };
    const estado = () => { window.dispatchEvent(new Event('simu-guardar')); try { return localStorage.getItem(clave); } catch (e) { return null; } };
    const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const selsEj = () => [...document.querySelectorAll('select[id^="ejemplo"]')];
    function grupoDe(s) {
      const p = s.closest('[role="tabpanel"]'); if (!p) return '';
      const t = document.getElementById(p.getAttribute('aria-labelledby') || 'tab-' + p.id.replace(/^panel-/, ''));
      return t ? t.textContent.trim() : '';
    }
    function ejemplosHTML(q) {
      const sels = selsEj(); let h = '';
      sels.forEach((s, i) => {
        const bot = (o) => o.value && (!q || norm(o.textContent).includes(q)) ? `<button class="bib-ej${s.value === o.value ? ' activo' : ''}" data-acc="ejemplo" data-sel="${i}" data-v="${esc(o.value)}" title="${esc(o.textContent.trim())}">${esc(o.textContent.trim())}</button>` : '';
        let cuerpo = '';
        for (const c of s.children) {
          if (c.tagName === 'OPTGROUP') { const b = [...c.children].map(bot).join(''); if (b) cuerpo += `<p class="bib-sub">${esc(c.label)}</p>${b}`; }
          else cuerpo += bot(c);
        }
        const g = sels.length > 1 && grupoDe(s);
        if (cuerpo) h += (g ? `<p class="bib-sub">${esc(g)}</p>` : '') + cuerpo;
      });
      return h;
    }
    const marcaEj = () => { const sels = selsEj(); for (const b of panel.querySelectorAll('.bib-ej')) b.classList.toggle('activo', sels[+b.dataset.sel]?.value === b.dataset.v); };
    const ejemplo = () => { const s = document.querySelector('select#ejemplo, select[id^="ejemplo"]'); return s && s.value && s.selectedOptions[0] ? s.selectedOptions[0].textContent.trim() : ''; };

    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.className = 'bib-btn'; btn.type = 'button'; btn.setAttribute('aria-controls', 'bib'); btn.title = 'Guardar, abrir, exportar e importar tus ejercicios';
    btn.innerHTML = '<span aria-hidden="true">☰</span> Mis ejercicios';
    const izq = document.querySelector('.miga-izq'), ini = cab.querySelector('.a-inicio');
    if (izq) izq.append(btn); else (ini ? ini.after(btn) : cab.prepend(btn));
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
    function descargaCopia() {
      const c = copia(); if (!c.total) { aviso('Todavía no tienes ejercicios guardados en ninguna herramienta'); return; }
      delete c.total; descarga(`ciencify-copia-${c.guardado.slice(0, 10)}.copia.json`, c);
      aviso('Copia de seguridad descargada');
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
      if (d?.formato === FORMATO_COPIA) {
        const r = restaura(d); lib = lee(K, { items: [] }); if (!Array.isArray(lib.items)) lib = { items: [] };
        importa.aviso = r.nuevos ? `Copia restaurada: ${r.nuevos} ejercicio${r.nuevos === 1 ? '' : 's'} en ${r.herramientas} herramienta${r.herramientas === 1 ? '' : 's'}${r.repetidos ? ` (${r.repetidos} ya estaban)` : ''}` : 'La copia no traía nada nuevo: ya tenías todo';
        return r.nuevos;
      }
      importa.aviso = '';
      if (d?.formato !== FORMATO || !Array.isArray(d.ejercicios)) throw new Error('no es un archivo de ejercicios de Ciencify');
      if (d.herramienta !== herramienta) throw new Error(`es de otra herramienta (${d.herramienta})`);
      let n = 0;
      for (const e of d.ejercicios) {
        if (typeof e?.datos !== 'string') continue;
        lib.items.push({ id: nuevoId(), titulo: String(e.titulo || 'Ejercicio importado').slice(0, 120), carpeta: String(e.carpeta || '').slice(0, 60), fijado: !!e.fijado, datos: e.datos, actualizado: Date.now() }); n++;
      }
      return n;
    }
    async function importaArchivos(files) {
      refresca();
      let n = 0;
      for (const f of files) {
        try { n += importa(await f.text()); } catch (err) { aviso(`No se pudo importar ${f.name}: ${err.message}`); return; }
      }
      guardaLib(); pinta(); aviso(importa.aviso || (n === 1 ? 'Ejercicio importado' : `${n} ejercicios importados`));
    }
    function carga(it) {
      if (!escribe(clave, it.datos)) { aviso('No se pudo abrir: el navegador no deja usar el almacenamiento'); return; }
      ponActivo(it.id);
      try {
        const pon = Storage.prototype.setItem, quita = Storage.prototype.removeItem;
        Storage.prototype.setItem = function (k, v) { if (this === localStorage && k === clave) return; return pon.call(this, k, v); };
        Storage.prototype.removeItem = function (k) { if (this === localStorage && k === clave) return; return quita.call(this, k); };
      } catch (e) { /* sin almacenamiento */ }
      try { sessionStorage.removeItem(`simu-practica:${herramienta}`); } catch (e) { /* sin almacenamiento */ }
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
    }
    function guardaForm() {
      refresca();
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

    const b64 = (t) => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const enlace = () => { const d = estado(); return location.href.split('#')[0] + (d ? `#d=${b64(d)}` : ''); };
    async function copiaEnlace() {
      const url = enlace(); let ok = false;
      try { await navigator.clipboard.writeText(url); ok = true; } catch (e) {
        const t = document.createElement('textarea'); t.value = url; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
        try { ok = document.execCommand('copy'); } catch (e2) { /* sin portapapeles */ } t.remove();
      }
      aviso(!ok ? 'No se ha podido copiar el enlace' : !url.includes('#d=') ? 'Enlace copiado, pero todavía no hay datos que llevar' : url.length > 8000 ? 'Enlace copiado (es muy largo: algunos programas lo cortan)' : 'Enlace copiado: abre la herramienta con estos datos');
    }

    const valorDe = (el) => el.tagName === 'SELECT' ? [...el.selectedOptions].map((o) => o.textContent.trim()).join(', ') : el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? '✓' : '—') : el.value;
    function extrae(d) {
      let nodos = [...d.querySelectorAll('.layout .card')].filter((c) => !c.closest('[hidden]') && c.textContent.trim());
      if (!nodos.length) { const w = d.querySelector('.wrap') || d.body; nodos = [w]; }
      const out = d.createElement('div');
      for (const n of nodos) {
        const c = n.cloneNode(true);
        const o = [...n.querySelectorAll('input, select, textarea')], k = [...c.querySelectorAll('input, select, textarea')];
        k.forEach((e, i) => { if (e.type === 'hidden' || e.type === 'file' || /^ejemplo/.test(e.id)) { (e.closest('label') || e).remove(); return; } const sp = d.createElement('b'); sp.textContent = valorDe(o[i]); e.replaceWith(sp); });
        const lo = [...n.querySelectorAll('canvas')], lk = [...c.querySelectorAll('canvas')];
        lk.forEach((e, i) => { try { const im = d.createElement('img'); im.src = lo[i].toDataURL('image/png'); im.alt = 'Gráfica del ejercicio'; e.replaceWith(im); } catch (x) { e.remove(); } });
        c.querySelectorAll('button, .controles, .compartir, .tools, .chips, .teoria, footer, header.top, nav, script, style, [hidden]').forEach((e) => e.remove());
        c.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
        c.querySelectorAll('details').forEach((e) => { e.open = true; });
        c.classList.add('card'); out.appendChild(c);
      }
      return out.innerHTML;
    }
    async function imprimeHoja(its) {
      if (!its.length) return;
      aviso('Preparando la hoja…');
      let original = null; try { original = localStorage.getItem(clave); } catch (e) { /* sin almacenamiento */ }
      const fr = document.createElement('iframe');
      fr.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:900px;border:0'; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.title = 'Preparando la hoja';
      document.body.appendChild(fr);
      const trozos = [];
      try {
        for (const it of its) {
          if (!escribe(clave, it.datos)) throw new Error('el navegador no deja usar el almacenamiento');
          await new Promise((ok) => { fr.onload = ok; fr.src = location.pathname + location.search; });
          await new Promise((ok) => setTimeout(ok, 400));
          trozos.push({ it, html: extrae(fr.contentDocument) });
        }
      } catch (err) { aviso(`No se pudo preparar la hoja: ${err.message}`); }
      finally {
        try { if (original === null) localStorage.removeItem(clave); else localStorage.setItem(clave, original); } catch (e) { /* sin almacenamiento */ }
        fr.remove();
      }
      if (trozos.length !== its.length) return;
      document.getElementById('hoja-imp')?.remove();
      const cont = document.createElement('div'); cont.id = 'hoja-imp';
      const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      cont.innerHTML = `<h1>${esc(nombre)}</h1><p class="hoja-sub">Hoja de ejercicios · ${its.length} ejercicio${its.length === 1 ? '' : 's'} · ${esc(fecha)} · Ciencify</p>`
        + trozos.map((t, i) => `<section class="hoja-ej"><h2>${i + 1}. ${esc(t.it.titulo)}${t.it.carpeta ? ` <small>(${esc(t.it.carpeta)})</small>` : ''}</h2>${t.html}</section>`).join('');
      document.body.appendChild(cont);
      const tema = document.documentElement.getAttribute('data-theme');
      const fin = () => {
        removeEventListener('afterprint', fin);
        document.body.classList.remove('hoja-imprimiendo'); cont.remove();
        if (tema === null) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', tema);
      };
      addEventListener('afterprint', fin);
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('hoja-imprimiendo');
      hoja = null; pinta(); abre(false);
      window.print();
    }

    function fila(it) {
      const b = borrando === it.id;
      if (hoja) return `<label class="bib-it" data-id="${it.id}"><input type="checkbox" class="bib-chk" data-id="${it.id}"${hoja.has(it.id) ? ' checked' : ''}><span class="bib-abre">${esc(it.titulo)}</span></label>`;
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
      if (!vis.length) lista = `<p class="bib-sec">Mis ejercicios</p><p class="bib-vacio">${lib.items.length ? 'Ningún ejercicio coincide con la búsqueda.' : 'Aún no has guardado ningún ejercicio. Prepara los datos y pulsa «Guardar el actual».'}</p>`;
      const ejs = hoja ? '' : ejemplosHTML(q), abEj = q || !ui.cerradas[`${herramienta}/#ejemplos`];
      if (ejs) lista += `<button class="bib-carp bib-sec-ej" data-carpeta="#ejemplos" aria-expanded="${!!abEj}">Ejercicios de ejemplo<span class="n" aria-hidden="true">${abEj ? '▾' : '▸'}</span></button>${abEj ? `<div class="bib-ejs">${ejs}</div>` : ''}`;
      const it = lib.items.find((x) => x.id === activo), carps = [...new Set(lib.items.map((x) => x.carpeta).filter(Boolean))];
      const f = form && (form.id ? lib.items.find((x) => x.id === form.id) : { titulo: ejemplo() || `Ejercicio ${lib.items.length + 1}`, carpeta: it?.carpeta || '' });
      if (hoja) {
        panel.innerHTML = `<div class="bib-h"><b>Hoja para imprimir</b><button class="bib-x" data-acc="cerrar" title="Cerrar" aria-label="Cerrar Mis ejercicios">×</button></div>
<div class="bib-hoja-barra"><p>Marca los ejercicios que quieres en la hoja. Se imprimen con sus resultados y su desarrollo.</p>
<button data-acc="hoja-todos"><span class="bib-ic">☑</span>${vis.every((i) => hoja.has(i.id)) && vis.length ? 'Quitar todos' : 'Marcar todos'}</button>
<button data-acc="hoja-imprimir"${hoja.size ? '' : ' disabled'}><span class="bib-ic">🖨</span>Imprimir ${hoja.size} ejercicio${hoja.size === 1 ? '' : 's'}</button>
<button data-acc="hoja-cancelar"><span class="bib-ic">✕</span>Volver a Mis ejercicios</button></div>
<div class="bib-lista">${lista}</div>`;
        return;
      }
      panel.innerHTML = `<div class="bib-h"><b>Mis ejercicios</b><button class="bib-x" data-acc="cerrar" title="Cerrar" aria-label="Cerrar Mis ejercicios">×</button></div>
<div class="bib-acc">
<button data-acc="nuevo"><span class="bib-ic">+</span>Guardar el actual como nuevo</button>
<button data-acc="actualizar"${it ? '' : ' disabled'} title="${it ? `Guarda los datos de ahora en «${esc(it.titulo)}»` : 'Abre o guarda antes un ejercicio'}"><span class="bib-ic">↻</span>${it ? `Guardar cambios en «${esc(it.titulo.length > 22 ? it.titulo.slice(0, 21) + '…' : it.titulo)}»` : 'Guardar cambios'}</button>
<button data-acc="importar"><span class="bib-ic">↥</span>Importar archivo…</button>
<button data-acc="exportar-todo"${lib.items.length ? '' : ' disabled'}><span class="bib-ic">↧</span>Exportar todos</button>
<button data-acc="copia" title="Un solo archivo con los ejercicios de todas las herramientas"><span class="bib-ic">⛁</span>Copia de seguridad de todo</button>
<button data-acc="restaurar" title="Suma a lo que tienes los ejercicios de una copia de seguridad"><span class="bib-ic">⟲</span>Restaurar copia…</button>
<button data-acc="enlace" title="Copia un enlace que abre la herramienta con los datos de ahora"><span class="bib-ic">🔗</span>Copiar enlace con estos datos</button>
<button data-acc="hoja"${lib.items.length ? '' : ' disabled'} title="Elige varios ejercicios y imprímelos juntos con su solución"><span class="bib-ic">🖨</span>Hoja para imprimir…</button>
${lib.items.length > 5 ? `<input type="search" class="bib-busca" placeholder="Buscar por título o carpeta…" aria-label="Buscar ejercicios" value="${esc(busca)}">` : ''}
</div>
${f ? `<div class="bib-form"><label>Título<input id="bib-t" value="${esc(f.titulo)}" maxlength="120" autocomplete="off"></label><label>Carpeta (opcional)<input id="bib-c" value="${esc(f.carpeta || '')}" maxlength="60" list="bib-dl" placeholder="sin carpeta" autocomplete="off"></label><datalist id="bib-dl">${carps.map((c) => `<option value="${esc(c)}">`).join('')}</datalist><div class="fila"><button data-acc="cancelar">Cancelar</button><button class="si" data-acc="guardar">Guardar</button></div></div>` : ''}
<div class="bib-lista">${lista}</div>
<div class="bib-pie"><p>Se guardan en este navegador. Exporta un archivo <code>.simu.json</code> para llevarlos a otro equipo o compartirlos; también puedes arrastrarlo aquí. Haz de vez en cuando una copia de seguridad de todo: si borras los datos del navegador, se pierden.</p></div>`;
      if (f) { const t = panel.querySelector('#bib-t'); t.focus(); t.select(); }
    }

    panel.addEventListener('click', (e) => {
      refresca();
      const car = e.target.closest('.bib-carp');
      if (car) { const k = `${herramienta}/${car.dataset.carpeta}`; ui.cerradas[k] = !ui.cerradas[k]; guardaUI(); pinta(); return; }
      const b = e.target.closest('[data-acc]'); if (!b) return;
      const id = b.closest('.bib-it')?.dataset.id, it = id && lib.items.find((x) => x.id === id);
      switch (b.dataset.acc) {
        case 'cerrar': abre(false); btn.focus(); break;
        case 'nuevo': form = {}; pinta(); break;
        case 'actualizar': actualiza(); break;
        case 'importar': archivo.click(); break;
        case 'copia': descargaCopia(); break;
        case 'restaurar': archivo.click(); break;
        case 'exportar-todo': descarga(nombreArchivo(nombre + ' ejercicios'), archivoDe(lib.items)); break;
        case 'enlace': copiaEnlace(); break;
        case 'hoja': hoja = new Set(); form = null; pinta(); break;
        case 'hoja-cancelar': hoja = null; pinta(); break;
        case 'hoja-todos': { const q = norm(busca), vis = lib.items.filter((i) => !q || norm(i.titulo + ' ' + (i.carpeta || '')).includes(q)); if (vis.every((i) => hoja.has(i.id))) hoja.clear(); else vis.forEach((i) => hoja.add(i.id)); pinta(); break; }
        case 'hoja-imprimir': imprimeHoja(lib.items.filter((i) => hoja.has(i.id))); break;
        case 'guardar': guardaForm(); break;
        case 'cancelar': form = null; pinta(); break;
        case 'abrir': if (it) carga(it); break;
        case 'ejemplo': {
          const s = selsEj()[+b.dataset.sel]; if (!s) break;
          s.value = b.dataset.v; s.dispatchEvent(new Event('change', { bubbles: true }));
          ponActivo(null); pinta(); if (window.innerWidth < ANCHO) abre(false);
          break;
        }
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
    panel.addEventListener('change', (e) => { if (hoja && e.target.classList.contains('bib-chk')) { if (e.target.checked) hoja.add(e.target.dataset.id); else hoja.delete(e.target.dataset.id); const f = e.target.dataset.id; pinta(); panel.querySelector(`.bib-chk[data-id="${f}"]`)?.focus(); } });
    panel.addEventListener('input', (e) => { if (e.target.classList.contains('bib-busca')) { busca = e.target.value; const pos = e.target.selectionStart; pinta(); const s = panel.querySelector('.bib-busca'); s.focus(); s.setSelectionRange(pos, pos); } });
    panel.addEventListener('dragover', (e) => { e.preventDefault(); panel.classList.add('arrastre'); });
    panel.addEventListener('dragleave', () => panel.classList.remove('arrastre'));
    panel.addEventListener('drop', (e) => { e.preventDefault(); panel.classList.remove('arrastre'); if (e.dataTransfer.files.length) importaArchivos([...e.dataTransfer.files]); });
    archivo.addEventListener('change', () => { if (archivo.files.length) importaArchivos([...archivo.files]); archivo.value = ''; });
    btn.addEventListener('click', () => abre(!panel.classList.contains('abierta')));
    scrim.addEventListener('click', () => abre(false));
    window.addEventListener('resize', () => abre(panel.classList.contains('abierta')));

    const sigue = (e) => { if (!panel.contains(e.target)) setTimeout(marcaEj); };
    document.addEventListener('change', sigue); document.addEventListener('input', sigue);
    pinta(); abre(!!ui.abierta);
    if (selsEj().some((s) => s.options.length > 1)) document.body.classList.add('bib-ejemplos');
    return { get items() { return lib.items; }, abre, importa: (t) => { const n = importa(t); guardaLib(); pinta(); return n; }, archivoDe };
  }
  return { monta, FORMATO, FORMATO_COPIA, copia, restaura };
})();

