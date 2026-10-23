/* =====================================================================
   Interfaz: barra lateral (biblioteca, buscador, carpetas), editor del
   problema, resultados, modo práctica, exportar, deshacer/rehacer,
   colocar con clic, gráficas y archivos .emsim.json.
   ===================================================================== */
(() => {
  const { SOURCES, ANALYSES, CONDS } = Physics;
  const { KINDS } = Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  };
  const K_LIB = 'electro-sim-lib-v2', K_CUR = 'electro-sim-cur-v2', K_UI = 'electro-sim-ui-v2';
  const FORMAT = 'simulador-electrostatica';
  let uid = 0;
  const newId = () => 'u' + Date.now().toString(36) + (uid++).toString(36);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const blankScene = () => ({ unit: 'a', mode: 'sym', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, sources: [], analyses: [] });
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const arrows = (s) => String(s).replace(/(.)⃗/g, '<span class="vv">$1</span>');

  /* ---------------- estado ---------------- */
  let lib = store.get(K_LIB, { items: [] });
  let ui = { side: true, presetsOpen: true, folders: {}, practice: false, ...store.get(K_UI, {}) };
  let cur = null; // { ref: {kind: 'preset'|'lib', id}, title, statement, folder, tags, scene }
  let scen = null; // atajo a cur.scene
  let out = null;
  let query = '';
  const isMobile = () => matchMedia('(max-width: 900px)').matches;
  const saveUI = () => store.set(K_UI, ui);

  function validScene(s) {
    if (!s || !Array.isArray(s.sources)) throw new Error('falta la lista de fuentes');
    const sc = { ...blankScene(), ...s };
    sc.view = { plane: 'xy', cut: '0', ...(s.view || {}) };
    sc.kinds = s.kinds || {};
    sc.mode = s.mode === 'si' ? 'si' : 'sym';
    sc.sources = s.sources.filter((x) => SOURCES[x.type]).map((x) => ({ id: x.id || newId(), ...x }));
    sc.analyses = (s.analyses || []).filter((x) => ANALYSES[x.type]).map((x) => ({ id: x.id || newId(), ...x }));
    Physics.normUnknown(sc);
    if (sc.unknown) {
      sc.unknown.srcs = sc.unknown.srcs.filter((id) => sc.sources.some((x) => x.id === id));
      sc.unknown.conds = sc.unknown.conds.filter((c) => CONDS[c.type]);
    }
    return sc;
  }

  function openRef(ref, { focus = null } = {}) {
    cancelPlace();
    if (ref.kind === 'preset') {
      const p = Presets.list.find((x) => x.key === ref.id);
      if (!p) return openRef({ kind: 'preset', id: Presets.list[0].key });
      cur = { ref, title: p.title, statement: p.statement || '', note: p.note || '', scene: validScene(p.make()) };
    } else {
      const it = lib.items.find((x) => x.id === ref.id);
      if (!it) return openRef({ kind: 'preset', id: Presets.list[0].key });
      cur = { ref, title: it.title, statement: it.statement || '', folder: it.folder || '', tags: it.tags || [], note: '', scene: validScene(clone(it.scene)) };
    }
    scen = cur.scene;
    store.set(K_CUR, cur);
    resetHistory();
    Canvas.clearProbes();
    if (isMobile()) setSide(false);
    Canvas.fit();
    renderSidebar();
    renderAll();
    if (focus) { const t = $(focus); t.focus(); t.select?.(); }
  }

  // guarda el trabajo en curso y, si es un problema propio, lo actualiza en la biblioteca
  function persist() {
    store.set(K_CUR, cur);
    if (cur.ref.kind !== 'lib') return;
    const it = lib.items.find((x) => x.id === cur.ref.id);
    if (!it) return;
    Object.assign(it, { scene: clone(scen), title: cur.title, statement: cur.statement, folder: cur.folder || '', tags: cur.tags || [], updated: Date.now() });
    store.set(K_LIB, lib);
  }

  function addToLib({ title, statement, scene, origin = 'mio', file, folder = '', tags = [] }) {
    const it = { id: newId(), title: title || 'Problema sin título', statement: statement || '', scene: clone(scene), origin, file, folder, tags, updated: Date.now() };
    lib.items.unshift(it);
    store.set(K_LIB, lib);
    return it;
  }

  /* ---------------- barra lateral ---------------- */
  function setSide(open) {
    const app = $('#app');
    if (isMobile()) app.classList.toggle('mobile-open', open);
    else { ui.side = open; saveUI(); app.classList.toggle('closed', !open); }
    setTimeout(() => Canvas.draw(out, scen), 220);
  }
  let menuFor = null;
  function closeMenu() { menuFor = null; document.querySelectorAll('.menu').forEach((m) => m.remove()); }
  function openMenu(anchor, key, actions) {
    if (menuFor === key) return closeMenu();
    closeMenu(); menuFor = key;
    const m = h('div', { class: 'menu', role: 'menu' }, actions.map((a) => {
      const b = h('button', { role: 'menuitem', class: a.danger ? 'danger' : '' }, a.label);
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (a.confirm && !b.dataset.armed) { b.dataset.armed = '1'; b.textContent = a.confirm; return; }
        closeMenu(); a.run();
      });
      return b;
    }));
    anchor.append(m);
  }
  function itemRow({ ref, title, sub, actions }) {
    const active = cur && cur.ref.kind === ref.kind && cur.ref.id === ref.id;
    const row = h('div', { class: 'item' + (active ? ' active' : ''), role: 'listitem' },
      h('button', { class: 'it', title, onclick: () => openRef(ref) }, h('span', { class: 'it-t' }, title), sub ? h('span', { class: 'it-s' }, sub) : null));
    row.append(h('button', { class: 'more', 'aria-label': 'Opciones de ' + title, title: 'Opciones', onclick: (e) => { e.stopPropagation(); openMenu(row, ref.kind + ref.id, actions); } }, '⋯'));
    return row;
  }
  function libActions(it) {
    return [
      { label: 'Renombrar', run: () => openRef({ kind: 'lib', id: it.id }, { focus: '#title' }) },
      { label: 'Mover a carpeta / etiquetas', run: () => openRef({ kind: 'lib', id: it.id }, { focus: '#folder' }) },
      { label: 'Duplicar', run: () => { const c = addToLib({ ...it, title: it.title + ' (copia)', origin: 'mio' }); openRef({ kind: 'lib', id: c.id }); } },
      { label: 'Guardar en archivo', run: () => saveJSON(slug(it.title) + '.emsim.json', pack([it])) },
      { label: 'Eliminar', confirm: 'Pulsa otra vez para eliminar', danger: true, run: () => {
        lib.items = lib.items.filter((x) => x.id !== it.id); store.set(K_LIB, lib);
        if (cur.ref.kind === 'lib' && cur.ref.id === it.id) openRef({ kind: 'preset', id: Presets.list[0].key }); else renderSidebar();
        flash('Problema eliminado');
      } },
    ];
  }
  const matches = (it) => !query || norm([it.title, it.statement, it.folder, ...(it.tags || [])].join(' ')).includes(query);
  const subOf = (it) => [it.origin === 'importado' ? it.file : '', ...(it.tags || []).map((t) => '#' + t)].filter(Boolean).join(' ');
  // agrupa por carpeta: primero los sueltos, luego cada carpeta plegable
  function grouped(items) {
    const loose = items.filter((x) => !x.folder), folders = {};
    for (const it of items) if (it.folder) (folders[it.folder] ||= []).push(it);
    const row = (it) => itemRow({ ref: { kind: 'lib', id: it.id }, title: it.title, sub: subOf(it), actions: libActions(it) });
    const outEls = loose.map(row);
    for (const name of Object.keys(folders).sort((a, b) => a.localeCompare(b, 'es'))) {
      const open = query || !ui.folders[name];
      outEls.push(h('div', { class: 'fold' },
        h('button', { class: 'fold-h', 'aria-expanded': String(!!open), onclick: () => { ui.folders[name] = !ui.folders[name]; saveUI(); renderSidebar(); } },
          h('span', { class: 'chev' }, open ? '▾' : '▸'), h('span', { class: 'fold-n' }, name), h('span', { class: 'count' }, String(folders[name].length))),
        open ? h('div', { class: 'fold-l' }, folders[name].map(row)) : null));
    }
    return outEls;
  }
  function renderSidebar() {
    const box = $('#side-list');
    box.replaceChildren();
    const byDate = (a, b) => b.updated - a.updated;
    const mine = lib.items.filter((x) => x.origin !== 'importado' && matches(x)).sort(byDate);
    const imp = lib.items.filter((x) => x.origin === 'importado' && matches(x)).sort(byDate);
    const pres = Presets.list.filter((p) => matches({ title: p.title, statement: p.statement }));
    const section = (title, key, items, empty) => {
      const open = query || !key || ui[key] !== false;
      const head = h('button', { class: 'sec-h', 'aria-expanded': key ? String(!!open) : null, onclick: key && !query ? () => { ui[key] = !open; saveUI(); renderSidebar(); } : null }, h('span', {}, title), key && !query ? h('span', { class: 'chev' }, open ? '▾' : '▸') : h('span', { class: 'count' }, items.length ? String(items.length) : ''));
      const list = h('div', { class: 'sec-l', role: 'list' }, open ? (items.length ? items : empty ? h('p', { class: 'side-empty' }, empty) : null) : null);
      box.append(h('section', { class: 'sec' }, head, list));
    };
    if (!query || mine.length) section('Mis problemas', null, grouped(mine), query ? '' : 'Aún no tienes problemas propios. Crea uno nuevo o guarda un ejercicio de ejemplo.');
    if (imp.length) section('Importados', null, grouped(imp), '');
    if (!query || pres.length) section(Presets.section, 'presetsOpen', pres.map((p) => itemRow({ ref: { kind: 'preset', id: p.key }, title: p.title, actions: [
      { label: 'Duplicar en Mis problemas', run: () => { const c = addToLib({ title: p.title, statement: p.statement, scene: p.make() }); openRef({ kind: 'lib', id: c.id }); } },
      { label: 'Guardar en archivo', run: () => saveJSON(slug(p.title) + '.emsim.json', pack([{ title: p.title, statement: p.statement, scene: p.make() }])) },
    ] })), '');
    if (query && !mine.length && !imp.length && !pres.length) box.append(h('p', { class: 'side-empty' }, `Nada coincide con «${$('#search').value}».`));
    $('#save-lib').disabled = !lib.items.length;
    const dl = $('#folders-dl');
    dl.replaceChildren(...[...new Set(lib.items.map((x) => x.folder).filter(Boolean))].map((f) => h('option', { value: f })));
  }

  /* ---------------- archivos ---------------- */
  const slug = (t) => (norm(t).replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'problema');
  function pack(items) {
    return { formato: FORMAT, version: 3, guardado: new Date().toISOString(), problemas: items.map((i) => ({ titulo: i.title, enunciado: i.statement || '', carpeta: i.folder || undefined, etiquetas: i.tags?.length ? i.tags : undefined, escena: i.scene })) };
  }
  function unpack(obj) {
    if (obj?.formato === FORMAT && Array.isArray(obj.problemas)) return obj.problemas.map((p) => ({ title: p.titulo || 'Problema sin título', statement: p.enunciado || '', folder: p.carpeta || '', tags: Array.isArray(p.etiquetas) ? p.etiquetas : [], scene: validScene(p.escena) }));
    if (obj?.sources) return [{ title: 'Escena importada', statement: '', scene: validScene(obj) }];
    throw new Error('no es un archivo del simulador');
  }
  const dlPromise = window.claude?.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  async function saveFile(filename, text, mime) {
    const dl = await Promise.race([dlPromise, new Promise((r) => setTimeout(() => r(null), 1500))]);
    if (dl) {
      try { await dl.save({ filename, data: text }); flash('Archivo guardado: ' + filename); }
      catch (e) { flash(e?.code === 'declined' ? 'Guardado cancelado' : 'No se pudo guardar el archivo aquí (' + (e?.code || 'error') + ')'); }
      return;
    }
    // fuera del visor de Claude (archivo abierto en un navegador normal)
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: mime })), download: filename });
    document.body.append(a); a.click(); a.remove();
    flash('Archivo guardado: ' + filename);
  }
  const saveJSON = (filename, obj) => saveFile(filename, JSON.stringify(obj, null, 2), 'application/json');
  async function importFiles(files) {
    let n = 0, first = null;
    const bad = [];
    for (const f of files) {
      try {
        const probs = unpack(JSON.parse(await f.text()));
        for (const p of probs) { const it = addToLib({ ...p, origin: 'importado', file: f.name }); first ||= it; n++; }
      } catch (e) { bad.push(`${f.name}: ${e.message}`); }
    }
    if (first) openRef({ kind: 'lib', id: first.id }); else renderSidebar();
    flash(n ? `${n} problema${n > 1 ? 's' : ''} importado${n > 1 ? 's' : ''}` + (bad.length ? `; no se pudo leer ${bad.join(', ')}` : '') : 'No se pudo leer: ' + bad.join(', '));
  }

  /* ---------------- campos de formulario ---------------- */
  const getPath = (o, p) => p.reduce((a, k) => a?.[k], o);
  const setPath = (o, p, v) => { const last = p[p.length - 1]; getPath(o, p.slice(0, -1))[last] = v; };
  function input(path, opts = {}) {
    const val = getPath(scen, path) ?? '';
    const el = h('input', { type: 'text', id: 'f-' + path.join('-'), class: 'in ' + (opts.cls || ''), value: val, placeholder: opts.ph || '', 'aria-label': opts.aria || path.join(' '), spellcheck: 'false', autocomplete: 'off' });
    el.dataset.path = JSON.stringify(path);
    el.addEventListener('input', () => { setPath(scen, path, el.value); opts.structural ? renderAll() : schedule(); });
    return el;
  }
  function select(path, options, opts = {}) {
    const val = getPath(scen, path);
    const el = h('select', { class: 'in', id: 'f-' + path.join('-'), 'aria-label': opts.aria || path.join(' ') },
      options.map(([v, l]) => h('option', { value: v, selected: v === val }, l)));
    el.addEventListener('change', () => { setPath(scen, path, el.value); opts.structural === false ? schedule() : renderAll(); });
    return el;
  }
  const fieldRow = (label, ...ctrl) => h('label', { class: 'row' }, h('span', { class: 'lab' }, label), h('span', { class: 'ctl' }, ...ctrl));
  function buildField(f, base, obj) {
    const p = [...base, f.k];
    if (f.show && !f.show(obj, scen)) return null;
    switch (f.t) {
      case 'vec3':
      case 'vec3opt':
        return fieldRow(f.label, h('span', { class: 'vec' }, ['x', 'y', 'z'].map((c, i) => h('span', { class: 'vc' }, h('i', {}, c), input([...p, i], { cls: 'num', ph: f.t === 'vec3opt' ? '—' : '0', aria: `${f.label} ${c}` })))));
      case 'expr': return fieldRow(f.label, input(p, { cls: 'num', ph: f.optional ? 'opcional' : '0' }));
      case 'sym': return fieldRow(f.label, input(p, { cls: 'sym', ph: 'p' }));
      case 'select': return fieldRow(f.label, select(p, f.options, { structural: !!f.structural }));
      case 'charge': return fieldRow(f.label, h('span', { class: 'chg' }, input([...p, 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...p, 'sym'], { cls: 'sym', ph: 'q', aria: 'símbolo' })));
      case 'value': return fieldRow(f.label, h('span', { class: 'chg' }, input([...p, 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...p, 'sym'], { cls: 'sym', ph: 'q', aria: 'símbolo' }), h('span', { class: 'x tail' }, scen.mode === 'si' ? 'SI' : '/(ε₀ aⁿ)')));
    }
    return null;
  }

  /* ---------------- colocar con clic en el lienzo ---------------- */
  const PLACE_KEYS = ['pos', 'A', 'B', 'P', 'C', 'P0'];
  const PERP = { xy: 2, xz: 1, yz: 0 };
  const AXI = { x: 0, y: 1, z: 2 };
  let placing = null; // { kind, type }
  const placeFields = (def) => def.fields.filter((f) => f.t === 'vec3' && PLACE_KEYS.includes(f.k));
  const coord = (v) => String(+v.toFixed(2));
  function ptToStr(p) {
    const perp = PERP[scen.view.plane];
    return p.map((v, i) => (i === perp ? String(scen.view.cut ?? '0') : coord(v)));
  }
  function applyPts(obj, def, pts, planeLike) {
    if (!pts) return;
    if (planeLike) obj.at = coord(pts[0][AXI[obj.axis]]);
    else placeFields(def).forEach((f, i) => { if (pts[i]) obj[f.k] = ptToStr(pts[i]); });
  }
  function markChips() {
    document.querySelectorAll('[data-place]').forEach((c) => c.classList.toggle('on', !!placing && c.dataset.place === placing.kind + ':' + placing.type));
  }
  function cancelPlace() {
    if (!placing) return;
    placing = null; Canvas.setPlace(null); markChips();
  }
  function chipAdd(kind, type) {
    const make = (pts) => (kind === 'src' ? addSource(type, null, pts) : kind === 'an' ? addAnalysis(type, pts) : Canvas.addProbe(pts[0], type === '+' ? 1 : -1));
    if (placing && placing.kind === kind && placing.type === type) { cancelPlace(); if (kind !== 'probe') make(null); return; }
    cancelPlace();
    const def = kind === 'src' ? SOURCES[type] : kind === 'an' ? ANALYSES[type] : null;
    const planeLike = kind === 'src' && (type === 'plane' || type === 'slab');
    const fs = def ? placeFields(def) : [{ label: 'punto de salida' }];
    const n = planeLike ? 1 : fs.length;
    if (scen.view.plane === '3d') {
      if (kind === 'probe') return flash('Las cargas de prueba se sueltan en una vista 2D (XY, XZ o YZ).');
      return make(null);
    }
    if (!n) return make(null);
    placing = { kind, type };
    markChips();
    $('#cv').scrollIntoView({ block: 'nearest', behavior: 'instant' });
    const what = planeLike ? 'un punto del plano' : fs.map((f) => f.label.toLowerCase()).join(', luego ');
    Canvas.setPlace({
      hint: `Clic en el lienzo: ${what}` + (kind === 'probe' ? ' · Esc: cancelar' : ' · Esc: cancelar, botón otra vez: por defecto'),
      n, done: (pts) => { placing = null; markChips(); make(pts); },
    });
  }

  /* ---------------- fuentes ---------------- */
  function addSource(type, copyOf, pts) {
    const def = SOURCES[type];
    const n = scen.sources.filter((s) => SOURCES[s.type].prefix === def.prefix).length + 1;
    const src = copyOf ? { ...clone(copyOf), id: newId(), name: (copyOf.name || def.prefix) + '′' } : { id: newId(), type, name: def.prefix + n, ...def.defaults() };
    if (scen.mode === 'si' && !copyOf) src.s = { c: '1e-9', sym: '' };
    applyPts(src, def, pts, type === 'plane' || type === 'slab');
    scen.sources.push(src);
    if (!pts) Canvas.fit();
    renderAll();
    if (!pts) requestAnimationFrame(() => document.querySelector(`.src[data-id="${src.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  function addAnalysis(type, pts) {
    const def = ANALYSES[type];
    const an = { id: newId(), type, ...def.defaults() };
    if (scen.mode === 'si' && an.Q) an.Q = { c: '1e-9', sym: '' };
    applyPts(an, def, pts, false);
    scen.analyses.push(an);
    renderAll();
    if (!pts) requestAnimationFrame(() => document.querySelector(`.an[data-id="${an.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  const isUnk = (id) => !!scen.unknown?.srcs?.includes(id);
  function renderSources() {
    const box = $('#sources');
    box.replaceChildren();
    scen.sources.forEach((src, i) => {
      const def = SOURCES[src.type];
      const unk = isUnk(src.id);
      const base = ['sources', i];
      box.append(h('div', { class: 'card src' + (unk ? ' unk' : ''), 'data-id': src.id },
        h('div', { class: 'card-h' },
          h('span', { class: 'badge b-' + src.type }, def.label),
          input([...base, 'name'], { cls: 'name', aria: 'nombre' }),
          h('button', { class: 'icon', title: 'Duplicar fuente', 'aria-label': 'Duplicar fuente', onclick: () => addSource(src.type, src) }, '⧉'),
          h('button', { class: 'icon del', title: 'Eliminar fuente', 'aria-label': 'Eliminar fuente', onclick: () => { if (unk) scen.unknown.srcs = scen.unknown.srcs.filter((x) => x !== src.id); scen.sources.splice(i, 1); renderAll(); } }, '×')),
        unk ? h('div', { class: 'row unkrow' }, h('span', { class: 'lab' }, 'Valor'), h('span', { class: 'ctl' }, h('span', { class: 'pill' }, 'incógnita'))) :
          fieldRow('Valor', h('span', { class: 'chg' }, input([...base, 's', 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...base, 's', 'sym'], { cls: 'sym', aria: 'símbolo', ph: scen.mode === 'si' ? '(nada)' : '' }), scen.mode === 'si' ? h('span', { class: 'x tail' }, KINDS[def.kindOf ? def.kindOf(src) : def.kind]?.si || '') : null)),
        def.fields.map((f) => buildField({ ...f, structural: f.structural || f.k === 'mode' }, base, src))));
    });
    if (!scen.sources.length) box.append(h('p', { class: 'empty' }, 'Aún no hay fuentes. Pulsa un botón de arriba (Carga, Hilo, Plano…) y haz clic en el lienzo para colocarla.'));
  }

  /* ---------------- incógnitas ---------------- */
  const defaultCond = () => ({ type: 'Ezero', P: ['1', '0', '0'], comp: 'x', d: ['0', '1', '0'], A: ['1', '0', '0'], B: ['2', '0', '0'], val: { c: '0', sym: '' } });
  function renderUnknown() {
    const box = $('#unknown');
    box.replaceChildren();
    if (!scen.sources.length) { box.append(h('p', { class: 'empty' }, 'Añade primero las fuentes.')); return; }
    const u = scen.unknown;
    const list = h('div', { class: 'unk-list', role: 'group', 'aria-label': 'Fuentes desconocidas' }, scen.sources.map((s) => {
      const cb = h('input', { type: 'checkbox', id: 'unk-' + s.id, checked: isUnk(s.id) });
      cb.addEventListener('change', () => {
        scen.unknown ||= { srcs: [], conds: [] };
        const U = scen.unknown;
        U.srcs = cb.checked ? [...U.srcs, s.id] : U.srcs.filter((x) => x !== s.id);
        if (cb.checked && !U.conds.length) U.conds.push(defaultCond());
        renderAll();
      });
      return h('label', { class: 'unk-o' }, cb, h('span', { class: 'math', html: Fmt.sym(s.name || SOURCES[s.type].prefix) }), h('span', { class: 'it-s' }, SOURCES[s.type].label));
    }));
    box.append(h('div', { class: 'lab' }, 'Fuentes cuyo valor es desconocido:'), list);
    if (!u || !u.srcs.length) return;
    u.conds.forEach((c, j) => {
      for (const k of ['P', 'd', 'A', 'B']) c[k] ??= ['0', '0', '0'];
      c.val ??= { c: '0', sym: '' };
      c.comp ??= 'x';
      const base = ['unknown', 'conds', j];
      box.append(h('div', { class: 'card cond' },
        h('div', { class: 'card-h' }, h('h3', {}, 'Condición ' + (j + 1)), h('button', { class: 'icon del', title: 'Quitar condición', 'aria-label': 'Quitar condición', onclick: () => { u.conds.splice(j, 1); renderAll(); } }, '×')),
        fieldRow('Tipo', select([...base, 'type'], Object.entries(CONDS).map(([k, v]) => [k, v.label]))),
        CONDS[c.type].fields.map((f) => buildField(f, base, c))));
    });
    box.append(h('div', { class: 'tools' },
      h('button', { class: 'chip', onclick: () => { u.conds.push(defaultCond()); renderAll(); } }, '+ Añadir condición'),
      h('span', { class: 'hint' }, `${u.srcs.length} incógnita${u.srcs.length > 1 ? 's' : ''}: hacen falta otras tantas ecuaciones (E = 0 cuenta como tres).`)));
    box.append(h('div', { class: 'card an unk-card', id: 'unk-card' },
      h('div', { class: 'result', id: 'unk-res' }),
      h('div', { class: 'prac', id: 'prac-unk' }),
      h('details', { class: 'steps-d', id: 'unk-steps' }, h('summary', {}, 'Ver desarrollo'), h('div', { class: 'steps-b' }))));
  }

  /* ---------------- símbolos ---------------- */
  function renderSymbols(ctx) {
    const box = $('#symbols');
    box.replaceChildren();
    const names = Object.keys(ctx.kinds).filter((k) => !k.startsWith('§') && k);
    if (!names.length) box.append(h('p', { class: 'empty' }, scen.mode === 'si' ? 'En modo SI no hacen falta símbolos: escribe los valores numéricos.' : 'Aparecerán aquí cuando uses símbolos (q, λ, σ…).'));
    names.forEach((n) => {
      const sel = h('select', { class: 'in', id: 'kind-' + n, 'aria-label': 'Tipo de ' + n }, Object.entries(KINDS).map(([k, v]) => h('option', { value: k, selected: ctx.kinds[n] === k }, `${v.label} (${v.hint})`)));
      sel.addEventListener('change', () => { scen.kinds[n] = sel.value; schedule(); });
      box.append(h('label', { class: 'row' }, h('span', { class: 'lab math', html: Fmt.sym(n) }), h('span', { class: 'ctl' }, sel)));
    });
  }

  /* ---------------- preguntas ---------------- */
  function renderAnalyses() {
    const box = $('#analyses');
    box.replaceChildren();
    scen.analyses.forEach((an, i) => {
      const def = ANALYSES[an.type];
      const base = ['analyses', i];
      box.append(h('section', { class: 'card an', 'data-i': i, 'data-id': an.id },
        h('div', { class: 'card-h' }, h('h3', {}, def.label), h('button', { class: 'icon del', title: 'Quitar pregunta', 'aria-label': 'Quitar pregunta', onclick: () => { scen.analyses.splice(i, 1); renderAll(); } }, '×')),
        def.fields.length ? h('div', { class: 'an-f' }, def.fields.map((f) => buildField(f, base, an))) : null,
        h('div', { class: 'result math', id: 'res-' + i }),
        h('div', { class: 'prac', id: 'prac-' + i }),
        h('div', { class: 'act', id: 'act-' + i }),
        h('details', { class: 'steps-d', id: 'steps-' + i }, h('summary', {}, 'Ver desarrollo paso a paso'), h('div', { class: 'steps-b math' }))));
    });
    if (!scen.analyses.length) box.append(h('p', { class: 'empty' }, 'Aún no hay preguntas. Elige arriba qué quieres calcular: campo, potencial, fuerza, dipolo, flujo, perfil…'));
  }

  /* ---------------- modo práctica ---------------- */
  const pracVals = {};
  function renderPractice(box, key, answers, getAnswers) {
    const card = box.closest('.card');
    card.classList.toggle('has-ans', !!answers?.length);
    if (!ui.practice || !answers?.length) { box.replaceChildren(); box.dataset.sig = ''; return; }
    const sig = answers.map((a) => a.label + (a.vec ? '3' : '1')).join('|') + scen.mode;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.replaceChildren();
    const si = scen.mode === 'si';
    answers.forEach((ans, j) => {
      const k = key + ':' + j;
      const vals = (pracVals[k] ||= ['', '', '']);
      const n = ans.vec ? 3 : 1;
      const unit = si ? (Engine.QTY[ans.qty]?.si || KINDS[ans.qty]?.si || '') : '';
      const ins = Array.from({ length: n }, (_, c) => {
        const el = h('input', { type: 'text', class: 'in num', value: vals[c], 'aria-label': `${ans.label} ${n > 1 ? 'xyz'[c] : ''}`, spellcheck: 'false', autocomplete: 'off',
          placeholder: si ? (unit ? 'valor en ' + unit : 'valor') : n > 1 ? 'xyz'[c] + ': p. ej. q/(4*pi*eps0*a^2)' : 'p. ej. q/(4*pi*eps0*a)' });
        el.addEventListener('input', () => { vals[c] = el.value; msg.textContent = ''; msg.className = 'pill'; });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
        return el;
      });
      const msg = h('span', { class: 'pill', role: 'status' });
      const check = () => {
        const a = getAnswers()?.[j];
        if (!a) return;
        const r = Physics.checkAnswer(a, vals, out.ctx);
        msg.textContent = r.ok ? '✓ ' + r.msg : '✗ ' + r.msg;
        msg.className = 'pill ' + (r.ok ? 'ok' : 'bad');
      };
      box.append(h('div', { class: 'prac-r' },
        h('span', { class: 'lab math', html: arrows(ans.label) + ' =' }),
        h('span', { class: n > 1 ? 'vec' : 'one' }, ins),
        h('span', { class: 'tools' }, h('button', { class: 'btn', onclick: check }, 'Comprobar'), msg)));
    });
    box.append(h('div', { class: 'tools' },
      h('button', { class: 'btn ghost', onclick: (e) => { const on = card.classList.toggle('reveal'); e.target.textContent = on ? 'Ocultar solución' : 'Mostrar solución'; } }, card.classList.contains('reveal') ? 'Ocultar solución' : 'Mostrar solución'),
      h('span', { class: 'hint' }, si ? 'Admite 8.99e9, 2/3…' : 'Escribe con q, lambda, sigma, rho, a, eps0, pi, sqrt(…); no importa el orden.')));
  }

  /* ---------------- gráficas E(z), V(z) ---------------- */
  const chartHidden = {};
  const SERIES_COL = ['--neg', '--ok', '--dipole', '--accent', '--mark'];
  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1, raw = span / n, p = 10 ** Math.floor(Math.log10(raw));
    const st = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || raw;
    const t = [];
    for (let v = Math.ceil(lo / st) * st; v <= hi + st * 1e-9; v += st) t.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return t;
  }
  const tickTxt = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v) ? v.toExponential(1) : String(+v.toPrecision(3)));
  function drawChart(cv, ch, key, hoverI = null) {
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const dpr = window.devicePixelRatio || 1, W = Math.max(220, cv.clientWidth), H = 200;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hid = chartHidden[key] || new Set();
    const ser = ch.series.map((s, i) => ({ ...s, col: css(SERIES_COL[i % SERIES_COL.length]), i })).filter((s) => s.live && !hid.has(s.name));
    const all = ser.flatMap((s) => s.ys.filter((v) => v != null && isFinite(v))).sort((a, b) => a - b);
    const q = (f) => all[Math.min(all.length - 1, Math.floor(f * (all.length - 1)))];
    let lo = all.length ? Math.min(0, q(0.03)) : -1, hi = all.length ? Math.max(0, q(0.97)) : 1;
    if (hi - lo < 1e-12) { hi += 1; lo -= 1; }
    const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    const L = 46, R = 10, T = 10, B = 26, x0 = ch.xs[0], x1 = ch.xs[ch.xs.length - 1];
    const X = (x) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R), Y = (y) => T + ((hi - y) / (hi - lo)) * (H - T - B);
    g.clearRect(0, 0, W, H);
    g.font = '10.5px "IBM Plex Mono", ui-monospace, monospace';
    g.strokeStyle = css('--grid'); g.fillStyle = css('--muted'); g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const t of niceTicks(lo, hi, 4)) { g.beginPath(); g.moveTo(L, Y(t)); g.lineTo(W - R, Y(t)); g.stroke(); g.fillText(tickTxt(t), L - 5, Y(t)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of niceTicks(x0, x1, 6)) { g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), H - B); g.stroke(); g.fillText(tickTxt(t), X(t), H - B + 5); }
    g.strokeStyle = css('--muted'); g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(W - R, Y(0)); g.stroke();
    g.textAlign = 'right'; g.fillText(ch.xlabel, W - R, H - B - 14);
    g.save(); g.beginPath(); g.rect(L, T, W - L - R, H - T - B); g.clip();
    const jump = (hi - lo) * 2;
    for (const s of ser) {
      g.strokeStyle = s.col; g.lineWidth = 1.8; g.setLineDash(s.dashed ? [6, 4] : []);
      g.beginPath();
      let pen = false, prev = null;
      s.ys.forEach((y, i) => {
        if (y == null || !isFinite(y) || (prev != null && Math.abs(y - prev) > jump)) { pen = false; prev = y; return; }
        const px = X(ch.xs[i]), py = Y(Math.max(lo - jump, Math.min(hi + jump, y)));
        pen ? g.lineTo(px, py) : g.moveTo(px, py);
        pen = true; prev = y;
      });
      g.stroke();
    }
    g.setLineDash([]);
    g.restore();
    if (hoverI != null) {
      const px = X(ch.xs[hoverI]);
      g.strokeStyle = css('--ink'); g.globalAlpha = 0.4; g.beginPath(); g.moveTo(px, T); g.lineTo(px, H - B); g.stroke(); g.globalAlpha = 1;
      const lines = [`${ch.xlabel} = ${tickTxt(ch.xs[hoverI])}`, ...ser.map((s) => `${s.name.replace('_', '')} = ${s.ys[hoverI] == null ? '—' : tickTxt(s.ys[hoverI])}`)];
      const tw = Math.max(...lines.map((t) => g.measureText(t).width)) + 14, th = lines.length * 14 + 8;
      const bx = px + tw + 12 > W ? px - tw - 8 : px + 8;
      g.fillStyle = css('--panel'); g.globalAlpha = 0.94; g.fillRect(bx, T + 2, tw, th); g.globalAlpha = 1;
      g.strokeStyle = css('--line'); g.strokeRect(bx, T + 2, tw, th);
      g.textAlign = 'left'; g.textBaseline = 'top';
      lines.forEach((t, k) => { g.fillStyle = k ? ser[k - 1].col : css('--ink'); g.fillText(t, bx + 7, T + 7 + k * 14); });
    }
  }
  function mountChart(box, ch, key) {
    const cv = box.querySelector('canvas.chart'), leg = box.querySelector('.chart-l');
    if (!cv) return;
    // las componentes idénticamente nulas no se dibujan
    const mx = Math.max(1e-300, ...ch.series.flatMap((s) => s.ys.filter((v) => v != null && isFinite(v)).map(Math.abs)));
    ch.series.forEach((s) => { s.live = s.ys.some((v) => v != null && isFinite(v) && Math.abs(v) > 1e-9 * mx); });
    const hid = (chartHidden[key] ||= new Set());
    leg.replaceChildren(...ch.series.map((s, i) => !s.live ? null : h('button', { class: 'ser' + (hid.has(s.name) ? ' off' : ''), 'aria-pressed': String(!hid.has(s.name)), onclick: () => { hid.has(s.name) ? hid.delete(s.name) : hid.add(s.name); mountChart(box, ch, key); } },
      h('span', { class: 'sw' + (s.dashed ? ' dash' : ''), style: `border-color:var(${SERIES_COL[i % SERIES_COL.length]})` }), h('span', { html: s.name.replace(/_(\w)/, '<sub>$1</sub>') }))).filter(Boolean),
      h('span', { class: 'hint' }, ch.ylabel));
    drawChart(cv, ch, key);
    const idx = (e) => { const r = cv.getBoundingClientRect(), f = (e.clientX - r.left - 46) / (r.width - 56); return Math.max(0, Math.min(ch.xs.length - 1, Math.round(f * (ch.xs.length - 1)))); };
    cv.onpointermove = (e) => drawChart(cv, ch, key, idx(e));
    cv.onpointerleave = () => drawChart(cv, ch, key);
  }

  /* ---------------- cálculo ---------------- */
  let pending = 0;
  function schedule() { if (!pending) pending = requestAnimationFrame(() => { pending = 0; compute(); }); }
  function compute() {
    persist();
    try { out = Physics.run(scen); } catch (e) { out = null; $('#errors').textContent = 'Error: ' + e.message; $('#errors').hidden = false; return; }
    const { ctx, unknown, results } = out;
    $('#errors').textContent = ctx.errors.length ? 'Revisa: ' + ctx.errors.join(' · ') : '';
    $('#errors').hidden = !ctx.errors.length;
    if (unknown && $('#unk-res')) {
      $('#unk-res').innerHTML = unknown.error ? `<div class="warn">${unknown.error}</div>` : `<div class="math big">${unknown.html}</div>`;
      $('#unk-steps .steps-b').innerHTML = unknown.steps || '';
      $('#unk-steps').hidden = !unknown.steps;
      renderPractice($('#prac-unk'), 'unk', unknown.error ? null : unknown.answers, () => out.unknown?.answers);
    }
    results.forEach((res, i) => {
      const r = $('#res-' + i), st = $('#steps-' + i + ' .steps-b'), act = $('#act-' + i);
      if (!r) return;
      r.innerHTML = res.error ? `<div class="warn">No se pudo calcular: ${Fmt.esc(res.error)}</div>` : res.res;
      st.innerHTML = res.steps || '';
      $('#steps-' + i).hidden = !res.steps;
      act.replaceChildren();
      if (res.action) act.append(h('button', { class: 'btn ghost', onclick: () => { scen.sources.push({ id: newId(), ...res.action.make() }); renderAll(); } }, res.action.label));
      if (res.chart) mountChart(r, res.chart, scen.analyses[i].id);
      renderPractice($('#prac-' + i), scen.analyses[i].id, res.error ? null : res.answers, () => out.results[i]?.answers);
    });
    renderSymbolsIfChanged(ctx);
    Canvas.draw(out, scen);
    scheduleCommit();
  }
  let lastSyms = '';
  function renderSymbolsIfChanged(ctx) {
    const sig = JSON.stringify(ctx.kinds) + scen.mode;
    if (sig !== lastSyms) { lastSyms = sig; renderSymbols(ctx); }
  }
  function renderHeader() {
    $('#title').value = cur.title;
    const st = $('#statement');
    st.value = cur.statement;
    autosize(st);
    const isPreset = cur.ref.kind === 'preset';
    const it = !isPreset && lib.items.find((x) => x.id === cur.ref.id);
    $('#origin').textContent = isPreset ? 'Ejemplo' : it?.origin === 'importado' ? 'Importado' : 'Mi problema';
    $('#banner').hidden = !isPreset;
    $('#meta').hidden = isPreset;
    if (!isPreset) { $('#folder').value = cur.folder || ''; $('#tags').value = (cur.tags || []).join(', '); }
    $('#note').textContent = cur.note || '';
    $('#note').hidden = !cur.note;
  }
  function renderAll() {
    const ae = document.activeElement?.id;
    renderHeader();
    const si = scen.mode === 'si';
    $('#mode').value = si ? 'si' : 'sym';
    $('#unit').value = si ? 'm' : scen.unit || 'a';
    $('#unit').disabled = si;
    $('#hint-src').innerHTML = si
      ? 'Modo numérico SI: longitudes en metros y valores en unidades SI (C, C/m, C/m²…), p. ej. <code>2e-9</code>. Deja el símbolo vacío.'
      : 'Longitudes en unidades de la escala (<code>a</code>). Admite <code>5/2</code>, <code>2*sqrt(3)</code>, <code>√7</code>, <code>pi</code>. Valor = coeficiente × símbolo.';
    $('#hint-an').textContent = si
      ? 'Resultados numéricos en unidades SI (ε₀ = 8,854·10⁻¹² F/m).'
      : 'Resultados exactos en la forma del libro: coeficiente · símbolos / (π ε₀ aⁿ). Abre “Ver desarrollo” para seguir cada paso.';
    const plane = scen.view?.plane || 'xy';
    $('#plane').value = plane;
    $('#cut').value = scen.view?.cut ?? '0';
    $('#cut-w').hidden = plane === '3d';
    $('#cut-l').textContent = { xy: 'z', xz: 'y', yz: 'x' }[plane] + ' =';
    $('#app').classList.toggle('practice', !!ui.practice);
    $('#practice').checked = !!ui.practice;
    renderSources(); renderUnknown(); renderAnalyses();
    lastSyms = '';
    compute();
    if (ae && ae !== 'title' && document.getElementById(ae)) document.getElementById(ae).focus();
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = Math.max(60, t.scrollHeight + 2) + 'px'; }

  /* ---------------- deshacer / rehacer ---------------- */
  let hist = { past: [], future: [], last: '' }, commitT = 0;
  function resetHistory() { clearTimeout(commitT); hist = { past: [], future: [], last: JSON.stringify(scen) }; updateHistBtns(); }
  function commit() {
    clearTimeout(commitT);
    const s = JSON.stringify(scen);
    if (s === hist.last) return;
    hist.past.push(hist.last);
    if (hist.past.length > 150) hist.past.shift();
    hist.last = s; hist.future = [];
    updateHistBtns();
  }
  function scheduleCommit() { clearTimeout(commitT); commitT = setTimeout(commit, 450); }
  function restore(s) { cur.scene = scen = JSON.parse(s); hist.last = s; renderAll(); updateHistBtns(); }
  function undo() { commit(); if (!hist.past.length) return flash('Nada que deshacer'); hist.future.push(hist.last); restore(hist.past.pop()); }
  function redo() { commit(); if (!hist.future.length) return flash('Nada que rehacer'); hist.past.push(hist.last); restore(hist.future.pop()); }
  function updateHistBtns() { $('#undo').disabled = !hist.past.length; $('#redo').disabled = !hist.future.length; }

  /* ---------------- exportar la solución ---------------- */
  function describe(def, obj) {
    const parts = [];
    for (const f of def.fields) {
      if (f.show && !f.show(obj, scen)) continue;
      const v = obj[f.k];
      if (v == null || v === '') continue;
      if (Array.isArray(v)) { if (v.every((x) => x === '')) continue; parts.push(`${f.label} = (${v.map((x) => x || '0').join(', ')})`); }
      else if (typeof v === 'object') parts.push(`${f.label} = ${v.c}${v.sym ? '·' + v.sym : ''}`);
      else if (f.t === 'select') parts.push(`${f.label}: ${(f.options.find((o) => o[0] === v) || [v, v])[1]}`);
      else parts.push(`${f.label} = ${v}`);
    }
    return parts.join('; ');
  }
  function toText(node) {
    if (node.nodeType === 3) return node.textContent.replace(/ /g, ' ');
    if (node.nodeType !== 1) return '';
    const kids = () => [...node.childNodes].map(toText).join('');
    const tag = node.tagName.toLowerCase(), cl = node.classList;
    if (tag === 'canvas' || tag === 'button' || cl.contains('chart-l')) return '';
    if (cl.contains('fr')) {
      const [nu, de] = [...node.children].map((c) => toText(c).trim());
      const wrap = (t) => (/^[\w.√²³πε₀λσρ]+$/u.test(t) ? t : `(${t})`);
      return `${wrap(nu)}/${wrap(de)}`;
    }
    if (tag === 'sup') { const t = kids(); return t.length > 1 ? `^(${t})` : '^' + t; }
    if (tag === 'sub') { const t = kids(); return t.length > 1 ? `_(${t})` : '_' + t; }
    if (cl.contains('vv') || cl.contains('uv')) return kids() + '⃗';
    if (tag === 'br') return '\n';
    if (tag === 'li') return '\n- ' + kids().trim();
    if (tag === 'div' || tag === 'p' || tag === 'ol' || tag === 'ul') return '\n' + kids() + '\n';
    return kids();
  }
  const htmlText = (html) => { const d = document.createElement('div'); d.innerHTML = html; return toText(d).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim(); };
  function exportMD() {
    const L = [`# ${cur.title}`, ''];
    if (cur.statement.trim()) L.push(...cur.statement.trim().split('\n').map((l) => '> ' + l), '');
    L.push(`*Unidad de longitud: ${scen.mode === 'si' ? 'm (modo numérico SI)' : scen.unit || 'a'}*`, '', '## Datos', '');
    for (const s of scen.sources) {
      const def = SOURCES[s.type];
      L.push(`- **${s.name}** (${def.label}): ${isUnk(s.id) ? 'valor desconocido' : `valor = ${s.s.c}${s.s.sym ? '·' + s.s.sym : ''}`}; ${describe(def, s)}`);
    }
    if (out?.unknown) {
      L.push('', '## Incógnitas', '');
      scen.unknown.conds.forEach((c, j) => L.push(`- Condición ${j + 1}: ${CONDS[c.type].label}; ${describe(CONDS[c.type], c)}`));
      L.push('', '**Resultado:** ' + (out.unknown.error || htmlText(out.unknown.html)).replace(/\n/g, '; '), '');
      if (out.unknown.steps) L.push('**Desarrollo**', '', htmlText(out.unknown.steps), '');
    }
    L.push('', '## Preguntas');
    scen.analyses.forEach((an, i) => {
      const def = ANALYSES[an.type], res = out?.results[i] || {};
      L.push('', `### ${i + 1}. ${def.label}`, '');
      const d = describe(def, an);
      if (d) L.push(d, '');
      L.push('**Resultado:**', '', res.error ? 'No se pudo calcular: ' + res.error : htmlText(res.res), '');
      if (res.steps) L.push('**Desarrollo**', '', htmlText(res.steps), '');
    });
    L.push('', '---', `*Generado con el Simulador de Electrostática · ${new Date().toLocaleString('es-ES')}*`, '');
    saveFile(slug(cur.title) + '-solucion.md', L.join('\n'), 'text/markdown');
  }
  function exportHTML() {
    const esc = Fmt.esc;
    const styles = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    const img = Canvas.snapshot();
    const charts = {};
    scen.analyses.forEach((an, i) => { const c = $(`#res-${i} canvas.chart`); if (c) charts[i] = c.toDataURL('image/png'); });
    const srcRows = scen.sources.map((s) => { const def = SOURCES[s.type]; return `<li><b>${esc(s.name)}</b> (${esc(def.label)}): ${isUnk(s.id) ? '<i>valor desconocido</i>' : `valor = ${esc(s.s.c)}${s.s.sym ? '·' + esc(s.s.sym) : ''}`}; ${esc(describe(def, s))}</li>`; }).join('');
    let unk = '';
    if (out?.unknown) {
      unk = `<section class="card"><h2>Incógnitas</h2><ul>${scen.unknown.conds.map((c, j) => `<li>Condición ${j + 1}: ${esc(CONDS[c.type].label)}; ${esc(describe(CONDS[c.type], c))}</li>`).join('')}</ul>
        <div class="result math">${out.unknown.error ? `<div class="warn">${out.unknown.error}</div>` : out.unknown.html}</div>${out.unknown.steps ? `<h4>Desarrollo</h4><div class="steps-b math">${out.unknown.steps}</div>` : ''}</section>`;
    }
    const qs = scen.analyses.map((an, i) => {
      const def = ANALYSES[an.type], res = out?.results[i] || {};
      const body = res.error ? `<div class="warn">No se pudo calcular: ${esc(res.error)}</div>` : String(res.res || '').replace(/<canvas class="chart"[^>]*><\/canvas><div class="chart-l"><\/div>/, charts[i] ? `<img class="chart-img" alt="Gráfica" src="${charts[i]}">` : '');
      return `<section class="card"><h3>${i + 1}. ${esc(def.label)}</h3><p class="hint">${esc(describe(def, an))}</p><div class="result math">${body}</div>${res.steps ? `<h4>Desarrollo</h4><div class="steps-b math">${res.steps}</div>` : ''}</section>`;
    }).join('');
    const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(cur.title)} · solución</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap">
<style>${styles}
body { max-width: 860px; margin: 0 auto; padding: 24px 16px 60px; font: 14px/1.5 var(--f-ui) }
h1 { font: 600 26px var(--f-math); margin: 0 0 8px } h2 { font: 600 13px var(--f-ui); text-transform: uppercase; letter-spacing: .08em; color: var(--muted) } h3 { font: 600 15px var(--f-ui); margin: 0 } h4 { font: 600 12.5px var(--f-ui); color: var(--muted); margin: 8px 0 0 }
.card { margin: 12px 0; break-inside: avoid } .stmt { white-space: pre-wrap; font: 15px/1.5 var(--f-math); background: var(--accent-soft); padding: 10px 12px; border-radius: 8px }
.snap { width: 100%; border: 1px solid var(--line); border-radius: 8px } .chart-img { width: 100%; max-width: 640px; display: block } .printbar { display: flex; gap: 8px; margin: 10px 0 }
@media print { .printbar { display: none } body { padding: 0 } :root { --bg: #fff } }
</style></head><body>
<div class="printbar"><button class="btn ghost" onclick="print()">Imprimir o guardar como PDF</button></div>
<h1>${esc(cur.title)}</h1>${cur.statement.trim() ? `<div class="stmt">${esc(cur.statement.trim())}</div>` : ''}
<p class="hint">Unidad de longitud: ${scen.mode === 'si' ? 'm (modo numérico SI)' : esc(scen.unit || 'a')}</p>
${img ? `<img class="snap" alt="Esquema del problema" src="${img}">` : ''}
<section class="card"><h2>Datos</h2><ul>${srcRows}</ul></section>${unk}<h2>Preguntas</h2>${qs}
<p class="hint">Generado con el Simulador de Electrostática · ${esc(new Date().toLocaleString('es-ES'))}</p></body></html>`;
    saveFile(slug(cur.title) + '-solucion.html', doc, 'text/html');
  }

  /* ---------------- controles fijos ---------------- */
  const typing = (t) => !!t && (t.id === 'title' || t.id === 'statement' || t.id === 'search' || t.id === 'folder' || t.id === 'tags' || !!t.closest?.('.prac'));
  function initControls() {
    $('#side-close').addEventListener('click', () => setSide(false));
    $('#side-open').addEventListener('click', () => setSide(true));
    $('#scrim').addEventListener('click', () => setSide(false));
    document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) closeMenu(); });
    document.addEventListener('keydown', (e) => {
      const mod = (e.ctrlKey || e.metaKey) && !e.altKey, k = e.key.toLowerCase();
      if (mod && k === 'z' && !typing(e.target)) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && k === 'y' && !typing(e.target)) { e.preventDefault(); redo(); }
      else if (mod && k === 's') { e.preventDefault(); $('#save-cur').click(); }
      else if (mod && k === 'o') { e.preventDefault(); $('#file').click(); }
      else if (mod && k === 'k') { e.preventDefault(); if (isMobile()) setSide(true); else if (!ui.side) setSide(true); $('#search').focus(); }
      else if ((e.key === 'F1' || (e.key === '?' && !typing(e.target) && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) && !$('#guide').open) { e.preventDefault(); openGuide(); }
      else if (e.key === 'Escape') { if (placing) cancelPlace(); closeMenu(); if (isMobile()) setSide(false); }
    });
    $('#guide-open').addEventListener('click', () => openGuide());
    $('#help').addEventListener('click', () => openGuide());
    $('#ver').addEventListener('click', () => openGuide('g-novedades'));
    for (const el of document.querySelectorAll('.ver-n')) el.textContent = Version.current;
    // cada versión es un desplegable; solo la actual empieza abierta
    // Índice de versiones: cada versión mayor (6, 5…) se despliega y dentro lleva sus subversiones (6.4, 6.3…).
    const mayores = [];
    for (const r of Version.log) {
      const m = r.v.split('.')[0];
      if (mayores.at(-1)?.m !== m) mayores.push({ m, rs: [] });
      mayores.at(-1).rs.push(r);
    }
    $('#ver-log').replaceChildren(...mayores.map((g, i) => h('details', { open: i === 0 },
      h('summary', {}, `Versión ${g.m}`, h('span', { class: 'ver-c' }, g.rs.length === 1 ? '1 versión' : `${g.rs.length} versiones`)),
      ...g.rs.map((r) => h('details', { class: 'ver-sub', open: r.v === Version.current }, h('summary', {}, `${r.v} · ${r.fecha.split('-').reverse().join('/')}`), h('ul', {}, r.cambios.map((c) => h('li', {}, c))))))));
    $('#guide-x').addEventListener('click', () => $('#guide').close());
    $('#guide').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    $('#guide-nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showGuide(b.dataset.g); });
    $('#guide-c').addEventListener('scroll', () => {
      const c = $('#guide-c'), top = c.getBoundingClientRect().top + 60;
      let id = null;
      for (const s of c.querySelectorAll('section')) if (s.getBoundingClientRect().top <= top) id = s.id;
      markGuide(id || 'g-vista');
    }, { passive: true });
    $('#new').addEventListener('click', () => { const it = addToLib({ title: 'Problema sin título', statement: '', scene: blankScene() }); openRef({ kind: 'lib', id: it.id }, { focus: '#title' }); });
    $('#open').addEventListener('click', () => $('#file').click());
    $('#file').addEventListener('change', (e) => { importFiles([...e.target.files]); e.target.value = ''; });
    $('#save-lib').addEventListener('click', () => saveJSON('mis-problemas.emsim.json', pack(lib.items)));
    $('#save-cur').addEventListener('click', () => saveJSON(slug(cur.title) + '.emsim.json', pack([cur])));
    $('#export').addEventListener('click', (e) => { e.stopPropagation(); openMenu($('#export-w'), 'export', [
      { label: 'Página para imprimir o PDF (.html)', run: exportHTML },
      { label: 'Texto Markdown (.md)', run: exportMD },
    ]); });
    $('#keep').addEventListener('click', () => { const it = addToLib({ title: cur.title, statement: cur.statement, scene: scen }); openRef({ kind: 'lib', id: it.id }); flash('Guardado en Mis problemas'); });
    $('#title').addEventListener('input', (e) => { cur.title = e.target.value; persist(); renderSidebar(); });
    $('#statement').addEventListener('input', (e) => { cur.statement = e.target.value; autosize(e.target); persist(); });
    $('#folder').addEventListener('change', (e) => { cur.folder = e.target.value.trim(); persist(); renderSidebar(); });
    $('#tags').addEventListener('change', (e) => { cur.tags = e.target.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean); persist(); renderSidebar(); });
    $('#search').addEventListener('input', (e) => { query = norm(e.target.value.trim()); renderSidebar(); });
    $('#unit').addEventListener('input', (e) => { scen.unit = e.target.value.trim() || 'a'; schedule(); });
    $('#mode').addEventListener('change', (e) => { scen.mode = e.target.value; renderAll(); flash(scen.mode === 'si' ? 'Modo numérico SI: usa valores en unidades SI y longitudes en metros' : 'Modo simbólico'); });
    $('#practice').addEventListener('change', (e) => { ui.practice = e.target.checked; saveUI(); document.querySelectorAll('.card.reveal').forEach((c) => c.classList.remove('reveal')); renderAll(); });
    $('#undo').addEventListener('click', undo);
    $('#redo').addEventListener('click', redo);
    $('#plane').addEventListener('change', (e) => { cancelPlace(); scen.view.plane = e.target.value; Canvas.fit(); renderAll(); });
    $('#cut').addEventListener('input', (e) => { scen.view.cut = e.target.value; schedule(); });
    const chipsS = $('#chips-src');
    for (const [k, d] of Object.entries(SOURCES)) chipsS.append(h('button', { class: 'chip', 'data-place': 'src:' + k, title: 'Añadir ' + d.label.toLowerCase() + ' (clic en el lienzo para colocarla)', onclick: () => chipAdd('src', k) }, '+ ' + (d.short || d.label)));
    const chipsA = $('#chips-an');
    for (const [k, d] of Object.entries(ANALYSES)) chipsA.append(h('button', { class: 'chip', 'data-place': 'an:' + k, title: d.label, onclick: () => chipAdd('an', k) }, '+ ' + (d.short || d.label)));
    $('#probe-p').addEventListener('click', () => chipAdd('probe', '+'));
    $('#probe-n').addEventListener('click', () => chipAdd('probe', '-'));
    $('#probe-x').addEventListener('click', () => { cancelPlace(); Canvas.clearProbes(); });
    for (const id of ['t-lines', 't-equi', 't-grid', 't-cmap', 'cmap-q']) $('#' + id).addEventListener('change', () => { ui[id] = $('#' + id).type === 'checkbox' ? $('#' + id).checked : $('#' + id).value; saveUI(); Canvas.draw(out, scen); });
    for (const id of ['t-lines', 't-equi', 't-grid', 't-cmap']) if (typeof ui[id] === 'boolean') $('#' + id).checked = ui[id];
    if (ui['cmap-q']) $('#cmap-q').value = ui['cmap-q'];
    $('#zin').addEventListener('click', () => Canvas.zoom(1.25));
    $('#zout').addEventListener('click', () => Canvas.zoom(0.8));
    $('#zfit').addEventListener('click', () => { Canvas.fit(); Canvas.draw(out, scen); });
    // arrastrar archivos sobre la página
    window.addEventListener('dragover', (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); document.body.classList.add('dropping'); } });
    window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dropping'); });
    window.addEventListener('drop', (e) => { document.body.classList.remove('dropping'); if (e.dataTransfer?.files?.length) { e.preventDefault(); importFiles([...e.dataTransfer.files]); } });
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => out && out.results.forEach((res, i) => res.chart && mountChart($('#res-' + i), res.chart, scen.analyses[i].id)), 150); });
    if (!ui.side) $('#app').classList.add('closed');
  }
  // guía de uso: las capturas van incrustadas en GUIA_IMG (las añade build.sh) y se cargan al abrirla
  function openGuide(id) {
    if (isMobile()) setSide(false);
    for (const el of document.querySelectorAll('#guide .sec-name')) el.textContent = Presets.section;
    for (const img of document.querySelectorAll('#guide img[data-img]')) if (!img.src && window.GUIA_IMG?.[img.dataset.img]) img.src = GUIA_IMG[img.dataset.img];
    $('#guide').showModal();
    if (id) showGuide(id); else { $('#guide-c').scrollTop = 0; markGuide('g-vista'); }
  }
  function markGuide(id) {
    for (const b of document.querySelectorAll('#guide-nav button')) {
      const on = b.dataset.g === id;
      if (on && !b.classList.contains('on') && isMobile()) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      b.classList.toggle('on', on);
    }
  }
  function showGuide(id) { $('#guide-c').scrollTop = $('#' + id).offsetTop - 8; markGuide(id); }
  function flash(t) { const f = $('#flash'); f.textContent = t; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (f.hidden = true), 2600); }

  // al arrastrar en el lienzo
  function onDrag(path, val) {
    setPath(scen, path, val);
    const el = document.querySelector(`[data-path='${JSON.stringify(path)}']`);
    if (el) el.value = val;
    schedule();
  }

  window.App = { onDrag, endDrag: () => setTimeout(commit, 30), get scen() { return scen; } };
  initControls();
  Canvas.init();
  const saved = store.get(K_CUR, null);
  if (saved?.scene && saved.ref) {
    try { cur = { ...saved, scene: validScene(saved.scene) }; scen = cur.scene; resetHistory(); Canvas.fit(); renderSidebar(); renderAll(); }
    catch (e) { openRef({ kind: 'preset', id: Presets.list[0].key }); }
  } else openRef({ kind: 'preset', id: Presets.list[0].key });
})();
