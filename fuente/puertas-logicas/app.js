/* =====================================================================
   Tablas de verdad y puertas lógicas · interfaz. Dos modos:
     «Desde la tabla»   tabla de verdad editable → ecuaciones normales (canónicas) y,
                        con el botón «Simplificar», simplificadas; circuito en el lienzo,
                        mapa de Karnaugh y desarrollo.
     «Desde las puertas» editor gráfico (SVG): se arrastran puertas de la paleta, se
                        mueven y se unen arrastrando de una salida a una entrada; sale la
                        tabla de verdad con todas las puertas y las mismas ecuaciones.
   El cálculo está en puertas-logicas/calculo.js (PuertasLogicas); los ayudantes comunes
   ($, esc, copia, lienzo) en herramienta.js.
   Guarda el estado entero (sc: tabla o puertas con sus posiciones) en localStorage[CLAVE]
   en cada cambio: es lo que copia Mis ejercicios (biblioteca.js). Expone
   window.PuertasLogicasApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const P = PuertasLogicas, NOM = P.NOM, CLAVE = 'puertas-logicas-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  const ent = (x, a, b, def) => { const v = parseInt(x, 10); return v >= a && v <= b ? v : def; };
  const nT = () => ent(sc.n, 1, P.MAXN, 3), mT = () => ent(sc.m, 1, P.MAXM, 1), nC = () => ent(sc.nc, 1, P.MAXN, 3);
  const puertas = () => (Array.isArray(sc.puertas) ? sc.puertas : (sc.puertas = []));
  const opts = (xs, sel) => xs.map(([k, t]) => `<option value="${esc(k)}"${String(k) === String(sel) ? ' selected' : ''}>${esc(t)}</option>`).join('');
  const rango = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const sep4 = (i, N) => ((i + 1) % 4 === 0 && i < N - 1 ? ' class="g4"' : '');

  /* ---------- Geometría de las puertas (la comparten el lienzo y el editor) ---------- */
  const ANCHO = 46, BURBUJA = 5, PASO = 124, MARGEN = 64, DESDE = 34;
  const ALTO = (g) => (g.tipo === 'NOT' ? 30 : 14 + 12 * g.e.length);
  const BASE = { AND: 'and', NAND: 'and', OR: 'or', NOR: 'or', XOR: 'xor', XNOR: 'xor', NOT: 'not' };
  const INV = { NAND: 1, NOR: 1, XNOR: 1, NOT: 1 };
  const anchoF = (t) => (t === 'NOT' ? ANCHO * 0.75 : ANCHO), salX = (t) => anchoF(t) + (INV[t] ? 2 * BURBUJA : 0);
  // contorno de la puerta con la esquina arriba a la izquierda en (0, 0), como trazado SVG (sirve para Path2D)
  function trazo(tipo, h) {
    const b = BASE[tipo], w = anchoF(tipo), x0 = b === 'xor' ? 7 : 0;
    let d;
    if (b === 'and') d = `M0,0 L${w * 0.5},0 C${w * 0.82},0 ${w},${h * 0.2} ${w},${h / 2} C${w},${h * 0.8} ${w * 0.82},${h} ${w * 0.5},${h} L0,${h} Z`;
    else if (b === 'not') d = `M0,0 L${w},${h / 2} L0,${h} Z`;
    else d = `M${x0},0 Q${w * 0.55},0 ${w},${h / 2} Q${w * 0.55},${h} ${x0},${h} Q${x0 + w * 0.28},${h / 2} ${x0},0 Z`;
    return { d, extra: b === 'xor' ? `M0,0 Q${w * 0.28},${h / 2} 0,${h}` : null };
  }

  /* ---------- Formulario ---------- */
  function ajustaTabla() {
    const n = nT(), m = mT(), N = 1 << n;
    sc.tabla = rango(0, m - 1).map((j) => String((sc.tabla || [])[j] ?? '').replace(/[^01X]/gi, '').toUpperCase().padEnd(N, '0').slice(0, N));
  }
  function editorTabla() {
    ajustaTabla();
    const n = nT(), m = mT(), N = 1 << n, nom = m === 1 ? ['F'] : rango(1, m).map((i) => `F${i}`);
    let h = '<div class="tabla-scroll"><table class="tv" aria-label="Tabla de verdad"><tr><th>#</th>' + NOM.slice(0, n).map((x) => `<th>${x}</th>`).join('') + nom.map((x) => `<th>${x}</th>`).join('') + '</tr>';
    for (let i = 0; i < N; i++) {
      h += `<tr${sep4(i, N)}><td class="idx">${i}</td>` + [...i.toString(2).padStart(n, '0')].map((b) => `<td>${b}</td>`).join('');
      h += sc.tabla.map((s, j) => `<td><button class="cel ${s[i] === '1' ? 'uno' : s[i] === 'X' ? 'x' : ''}" data-j="${j}" data-i="${i}" aria-label="${nom[j]} en la fila ${i}">${s[i]}</button></td>`).join('') + '</tr>';
    }
    return h + '</table></div>';
  }
  const paleta = () => '<div class="paleta" role="group" aria-label="Puertas">' + Object.entries(P.NOMBRES).map(([t, nom]) => `<button class="btn" data-tipo="${t}" title="Pulsa para añadir o arrastra al dibujo">${esc(nom)}</button>`).join('') + '</div>';
  function formulario() {
    const tabla = sc.modo !== 'puertas', forma = [['sop', 'Suma de productos (AND-OR)'], ['pos', 'Producto de sumas (OR-AND)']];
    $('#tab-tabla').setAttribute('aria-selected', tabla); $('#tab-puertas').setAttribute('aria-selected', !tabla);
    $('#campos').innerHTML = tabla
      ? `<label for="f-n">Variables</label><select id="f-n" class="in" data-k="n">${opts(rango(1, P.MAXN).map((k) => [k, `${k} (${NOM.slice(0, k).join(', ')})`]), nT())}</select>`
        + `<label for="f-m">Salidas</label><select id="f-m" class="in" data-k="m">${opts(rango(1, P.MAXM).map((k) => [k, k]), mT())}</select>`
        + `<label for="f-forma">Circuito en</label><select id="f-forma" class="in" data-k="forma">${opts(forma, sc.forma)}</select>`
      : `<label for="f-nc">Entradas</label><select id="f-nc" class="in" data-k="nc">${opts(rango(1, P.MAXN).map((k) => [k, `${k} (${NOM.slice(0, k).join(', ')})`]), nC())}</select>`;
    $('#editor').innerHTML = tabla ? editorTabla() : '<p class="nota" style="margin:0 0 6px">Puertas: pulsa una para añadirla o arrástrala al dibujo.</p>' + paleta();
    $('#nota').textContent = tabla ? 'Pulsa una casilla de la salida para cambiarla: 0, 1 o X (indiferente). A es el bit de más peso de la fila.'
      : 'Une una salida (círculo de la derecha) con una entrada (círculo de la izquierda) arrastrando. Suelta un cable en el vacío para quitarlo. Doble clic en una puerta para marcarla como salida.';
    $('#c-circ').hidden = !tabla; $('#c-editor').hidden = tabla;
    if (!tabla) { colocaTodo(); pintaEditor(); }
  }
  const cambio = () => { $('#ejemplos').value = ''; calcula(); };
  $('#modos').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const m = b.id === 'tab-puertas' ? 'puertas' : 'tabla';
    if (m === sc.modo) return;
    sc.modo = m; if (m === 'puertas') sc.nc = sc.nc || '3';
    formulario(); cambio();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'nc') {
      const ok = new Set(NOM.slice(0, nC()));
      for (const p of puertas()) p.e = p.e.map((x) => (NOM.includes(x) && !ok.has(x) ? '' : x));
      for (const k of Object.keys(sc.pos || {})) if (!ok.has(k)) delete sc.pos[k];
    }
    formulario(); cambio();
  });
  $('#editor').addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.classList.contains('cel')) {
      const j = +t.dataset.j, i = +t.dataset.i, s = [...sc.tabla[j]];
      s[i] = { 0: '1', 1: 'X', X: '0' }[s[i]] || '0'; sc.tabla[j] = s.join('');
      t.textContent = s[i]; t.className = `cel ${s[i] === '1' ? 'uno' : s[i] === 'X' ? 'x' : ''}`; return cambio();
    }
    if (t.dataset.tipo) { nuevaPuerta(t.dataset.tipo); pintaEditor(); cambio(); }
  });

  /* ---------- Editor gráfico de puertas ---------- */
  const ED = { sel: null, arr: null, vb: { W: 760, H: 380 } };
  const svg = $('#ed');
  const gate = (id) => puertas().find((p) => p.id === id);
  const pt = (e) => { const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()); return { x: q.x, y: q.y }; };

  // posiciones que faltan (al abrir un ejemplo): entradas a la izquierda y cada puerta en su columna por profundidad
  function colocaTodo() {
    const ps = puertas(), n = nC(); sc.pos = sc.pos || {};
    const faltan = ps.some((p) => typeof p.x !== 'number' || typeof p.y !== 'number');
    NOM.slice(0, n).forEach((k, i) => { if (!sc.pos[k] || faltan) sc.pos[k] = { x: 24, y: 30 + i * 70 }; });
    if (!faltan) return;
    const prof = {}, por = new Map(ps.map((p) => [p.id, p])), ys = {};
    NOM.slice(0, n).forEach((k) => { prof[k] = 0; ys[k] = sc.pos[k].y + 13; });
    const nivel = (p, vis = new Set()) => {
      if (prof[p.id] != null) return prof[p.id];
      if (vis.has(p.id)) return 1; vis.add(p.id);
      return (prof[p.id] = 1 + Math.max(0, ...p.e.map((x) => (por.has(x) ? nivel(por.get(x), vis) : 0))));
    };
    ps.forEach((p) => nivel(p));
    const maxd = Math.max(1, ...ps.map((p) => prof[p.id]));
    for (let d = 1; d <= maxd; d++) {
      const fila = ps.filter((p) => prof[p.id] === d).map((p) => { const v = p.e.map((x) => ys[x]).filter((y) => y != null); return { p, h: ALTO(p), b: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 30 }; });
      fila.sort((a, b) => a.b - b.b);
      let tope = -1e9;
      for (const f of fila) { const yc = Math.max(f.b, tope + 16 + f.h / 2); f.p.x = 150 + (d - 1) * 150; f.p.y = Math.round(yc - f.h / 2); ys[f.p.id] = yc; tope = yc + f.h / 2; }
    }
  }
  function nuevaPuerta(tipo, cx, cy) {
    const ps = puertas(), n = Math.max(0, ...ps.map((p) => +String(p.id).slice(1) || 0)) + 1;
    const g = { id: `P${n}`, tipo, e: Array(P.arid(tipo)[0]).fill(''), sal: false }, h = ALTO(g);
    if (cx != null) { g.x = Math.round(cx - anchoF(tipo) / 2); g.y = Math.round(cy - h / 2); }
    else { // primer hueco libre de una rejilla a la derecha de las entradas
      const libre = (x, y) => ps.every((p) => Math.abs(p.x - x) > 80 || Math.abs(p.y - y) > ALTO(p) + 12);
      let x = 170, y = 24; while (!libre(x, y)) { y += 60; if (y > 330) { y = 24; x += 120; } }
      g.x = x; g.y = y;
    }
    g.x = Math.max(0, g.x); g.y = Math.max(0, g.y);
    ps.push(g); ED.sel = g.id; return g;
  }
  function geom() {
    const G = {};
    NOM.slice(0, nC()).forEach((k, i) => { const q = (sc.pos || {})[k] || { x: 24, y: 30 + i * 70 }; G[k] = { x: q.x, y: q.y, w: 34, h: 26, out: { x: q.x + 34, y: q.y + 13 }, ins: [], ent: true }; });
    puertas().forEach((p) => { const h = ALTO(p); G[p.id] = { x: p.x, y: p.y, w: anchoF(p.tipo), h, out: { x: p.x + salX(p.tipo), y: p.y + h / 2 }, ins: p.e.map((_, j) => ({ x: p.x, y: p.y + ((j + 1) * h) / (p.e.length + 1) })), ent: false }; });
    return G;
  }
  const cable = (a, b) => { const d = Math.max(30, Math.abs(b.x - a.x) / 2); return `M${a.x},${a.y} C${a.x + d},${a.y} ${b.x - d},${b.y} ${b.x},${b.y}`; };
  // ¿la puerta `destino` alimenta (directa o indirectamente) a `fuente`? Entonces unirlas haría un lazo
  const dependeDe = (fuente, destino, vis = new Set()) => {
    if (fuente === destino) return true;
    const g = gate(fuente); if (!g || vis.has(fuente)) return false; vis.add(fuente);
    return g.e.some((x) => x && dependeDe(x, destino, vis));
  };
  function pintaEditor() {
    if (sc.modo !== 'puertas') return;
    const G = geom(), ps = puertas(), sal = ps.filter((p) => p.sal), a = ED.arr;
    if (!(a && a.tipo === 'mueve')) {
      let W = 760, H = 380;
      for (const k in G) { W = Math.max(W, G[k].x + G[k].w + 100); H = Math.max(H, G[k].y + G[k].h + 40); }
      ED.vb = { W, H };
    }
    svg.setAttribute('viewBox', `0 0 ${ED.vb.W} ${ED.vb.H}`);
    let h = '';
    for (const p of ps) p.e.forEach((e, j) => { if (e && G[e]) h += `<path class="cable" d="${cable(G[e].out, G[p.id].ins[j])}"/>`; });
    if (a && a.tipo === 'cable') h += `<path class="cable borrador" d="${cable(G[a.de].out, a)}"/>`;
    if (a && a.tipo === 'cableInv') h += `<path class="cable borrador" d="${cable(a, G[a.id].ins[a.j])}"/>`;
    for (const k of NOM.slice(0, nC())) h += `<g class="nodo${ED.sel === k ? ' sel' : ''}" data-k="nodo" data-id="${k}" transform="translate(${G[k].x},${G[k].y})"><rect class="cuerpo" width="34" height="26" rx="6"/><text x="17" y="14" text-anchor="middle" dominant-baseline="central">${k}</text></g>`;
    for (const p of ps) {
      const t = trazo(p.tipo, G[p.id].h), w = G[p.id].w;
      h += `<g class="nodo${ED.sel === p.id ? ' sel' : ''}" data-k="nodo" data-id="${p.id}" transform="translate(${p.x},${p.y})"><path class="cuerpo" d="${t.d}"/>${t.extra ? `<path class="cuerpo sin" d="${t.extra}"/>` : ''}`
        + (INV[p.tipo] ? `<circle class="cuerpo" cx="${w + BURBUJA}" cy="${G[p.id].h / 2}" r="${BURBUJA}"/>` : '')
        + `<text class="etq" x="${ANCHO / 2}" y="${G[p.id].h + 14}" text-anchor="middle">${esc(p.id)}</text></g>`;
    }
    const uso = new Set(ps.flatMap((p) => p.e));
    for (const k in G) {
      h += `<circle class="hit" data-k="out" data-id="${k}" cx="${G[k].out.x}" cy="${G[k].out.y}" r="12"/><circle class="pin${uso.has(k) ? ' on' : ''}" data-k="out" data-id="${k}" cx="${G[k].out.x}" cy="${G[k].out.y}" r="4.5"/>`;
      G[k].ins.forEach((q, j) => { h += `<circle class="hit" data-k="in" data-id="${k}" data-j="${j}" cx="${q.x}" cy="${q.y}" r="12"/><circle class="pin${ps.find((p) => p.id === k).e[j] ? ' on' : ''}" data-k="in" data-id="${k}" data-j="${j}" cx="${q.x}" cy="${q.y}" r="4.5"/>`; });
    }
    sal.forEach((p, i) => { const o = G[p.id].out; h += `<path class="cable salida" d="M${o.x + 5},${o.y} L${o.x + 30},${o.y}"/><text class="sal" x="${o.x + 36}" y="${o.y}" dominant-baseline="central">${sal.length === 1 ? 'F' : `F${i + 1}`}</text>`; });
    svg.innerHTML = h; barra();
  }
  function barra() {
    const g = ED.sel && gate(ED.sel), b = $('#sel-barra');
    if (!g) { b.innerHTML = '<span class="nota">Selecciona una puerta para quitarla, cambiar sus entradas o marcarla como salida.</span>'; return; }
    const [a, z] = P.arid(g.tipo);
    b.innerHTML = `<b>${esc(g.id)}</b> <span class="nota">${esc(P.NOMBRES[g.tipo])}</span>`
      + (a === z ? '' : `<button class="btn" data-a="menos"${g.e.length <= a ? ' disabled' : ''}>− entrada</button><button class="btn" data-a="mas"${g.e.length >= z ? ' disabled' : ''}>+ entrada</button>`)
      + `<label><input type="checkbox" data-a="sal"${g.sal ? ' checked' : ''}> Salida</label><button class="btn" data-a="del">Quitar</button>`;
  }
  function quita(id) {
    const i = puertas().findIndex((p) => p.id === id); if (i < 0) return;
    puertas().splice(i, 1); puertas().forEach((p) => { p.e = p.e.map((x) => (x === id ? '' : x)); });
    if (ED.sel === id) ED.sel = null; pintaEditor(); cambio();
  }
  $('#sel-barra').addEventListener('click', (e) => {
    const b = e.target.closest('button'), g = ED.sel && gate(ED.sel); if (!b || !g) return;
    if (b.dataset.a === 'del') return quita(g.id);
    if (b.dataset.a === 'mas') g.e.push(''); if (b.dataset.a === 'menos') g.e.pop();
    pintaEditor(); cambio();
  });
  $('#sel-barra').addEventListener('change', (e) => { const g = ED.sel && gate(ED.sel); if (g && e.target.dataset.a === 'sal') { g.sal = e.target.checked; pintaEditor(); cambio(); } });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && sc.modo === 'puertas' && ED.sel && gate(ED.sel) && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) { e.preventDefault(); quita(ED.sel); }
  });
  svg.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('[data-k]'), p = pt(e);
    if (!t) { ED.sel = null; return pintaEditor(); }
    const k = t.dataset.k, id = t.dataset.id, G = geom();
    if (k === 'out') ED.arr = { tipo: 'cable', de: id, x: p.x, y: p.y };
    else if (k === 'in') {
      const g = gate(id), j = +t.dataset.j;
      if (g.e[j]) { const de = g.e[j]; g.e[j] = ''; ED.arr = { tipo: 'cable', de, x: p.x, y: p.y }; }
      else ED.arr = { tipo: 'cableInv', id, j, x: p.x, y: p.y };
    } else {
      // doble pulsación sobre una puerta: la marca (o desmarca) como salida; el dibujo se rehace en cada pulsación, así que no se usa dblclick
      const ahora = Date.now(), g = gate(id);
      if (g && ED.ult && ED.ult.id === id && ahora - ED.ult.t < 400) { g.sal = !g.sal; ED.ult = null; cambio(); } else ED.ult = { id, t: ahora };
      ED.sel = id; ED.arr = { tipo: 'mueve', id, dx: p.x - G[id].x, dy: p.y - G[id].y, mov: false }; }
    try { svg.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ }
    e.preventDefault(); pintaEditor();
  });
  svg.addEventListener('pointermove', (e) => {
    const a = ED.arr; if (!a) return;
    const p = pt(e);
    if (a.tipo === 'mueve') {
      const x = Math.max(0, Math.min(ED.vb.W - 90, p.x - a.dx)), y = Math.max(0, Math.min(ED.vb.H - 40, p.y - a.dy)), g = gate(a.id);
      if (g) { g.x = Math.round(x); g.y = Math.round(y); } else sc.pos[a.id] = { x: Math.round(x), y: Math.round(y) };
      a.mov = true;
    } else { a.x = p.x; a.y = p.y; }
    pintaEditor();
  });
  svg.addEventListener('pointerup', (e) => {
    const a = ED.arr; if (!a) return; ED.arr = null;
    const p = pt(e), G = geom();
    if (a.tipo === 'cable') { // de una salida a la entrada más cercana
      let mejor = null, dm = 16;
      for (const g of puertas()) g.e.forEach((_, j) => { const q = G[g.id].ins[j], d = Math.hypot(q.x - p.x, q.y - p.y); if (d < dm && !dependeDe(a.de, g.id)) { dm = d; mejor = { g, j }; } });
      if (mejor) mejor.g.e[mejor.j] = a.de;
    } else if (a.tipo === 'cableInv') { // de una entrada vacía a la salida más cercana
      let mejor = null, dm = 16;
      for (const k in G) { const d = Math.hypot(G[k].out.x - p.x, G[k].out.y - p.y); if (d < dm && !dependeDe(k, a.id)) { dm = d; mejor = k; } }
      if (mejor) gate(a.id).e[a.j] = mejor;
    }
    pintaEditor(); cambio();
  });
  svg.addEventListener('pointercancel', () => { ED.arr = null; pintaEditor(); });

  // arrastrar una puerta de la paleta al dibujo (en el teclado y con un clic basta el botón)
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest?.('.paleta button'); if (!b || e.button) return;
    const x0 = e.clientX, y0 = e.clientY; let fantasma = null;
    const mueve = (m) => {
      if (!fantasma && Math.hypot(m.clientX - x0, m.clientY - y0) > 6) { fantasma = document.createElement('div'); fantasma.className = 'fantasma'; fantasma.textContent = P.NOMBRES[b.dataset.tipo]; document.body.appendChild(fantasma); }
      if (fantasma) { fantasma.style.left = `${m.clientX + 8}px`; fantasma.style.top = `${m.clientY + 8}px`; }
    };
    const suelta = (m) => {
      document.removeEventListener('pointermove', mueve); document.removeEventListener('pointerup', suelta);
      if (!fantasma) return;
      fantasma.remove();
      const r = svg.getBoundingClientRect();
      if (m.clientX >= r.left && m.clientX <= r.right && m.clientY >= r.top && m.clientY <= r.bottom) { const q = pt(m); nuevaPuerta(b.dataset.tipo, q.x, q.y); pintaEditor(); cambio(); }
    };
    document.addEventListener('pointermove', mueve); document.addEventListener('pointerup', suelta);
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); ED.sel = null; formulario(); calcula(); sel.value = clave;
  }
  // una tabla de 3 variables al azar para el modo práctica: minitérminos
  const azar = () => { sc = P.azar(); formulario(); calcula(); sel.value = ''; };
  const enunciado = () => `Dada la tabla de verdad de F (variables A, B y C), escribe sus minitérminos: ${esc(sc.tabla[0].replace(/(.)/g, '$1 ').trim())} (filas de 0 a 7).`;

  /* ---------- Resultados ---------- */
  const dato = (t, v, pr, extra = '') => `<div class="ancho${pr ? ' pr' : ''}${extra}"><span>${t}</span><b>${v}</b></div>`;
  function resumen() {
    const un = sol.salidas.length === 1, simp = sol.simp;
    return sol.salidas.map((s) => {
      const f = s.nombre, ind = s.indif.length ? ` + d(${s.indif.join(', ')})` : '';
      let h = '';
      if (sol.modo === 'puertas') { const o = sol.dibujo.salidas.find((x) => x.nombre === f), g = o && sol.dado.find((x) => x.id === o.id); if (g) h += dato(`${f} · ecuación del circuito`, `${f} = ${g.h}`); }
      h += dato(`${f} · minitérminos`, `${f} = ${s.sumM}${ind}`, un)
        + dato(`${f} · forma canónica, suma de minitérminos`, `${f} = ${s.canS.html}`)
        + dato(`${f} · maxitérminos`, `${f} = ${s.prodM}${s.indif.length ? `·D(${s.indif.join(', ')})` : ''}`)
        + dato(`${f} · forma canónica, producto de maxitérminos`, `${f} = ${s.canP.html}`);
      if (simp) h += dato(`${f} · simplificada, suma de productos`, `${f} = ${s.minS.html}`, false, ' simp') + dato(`${f} · simplificada, producto de sumas`, `${f} = ${s.minP.html}`, false, ' simp');
      return h;
    }).join('');
  }
  function textoEcuaciones() {
    return sol.salidas.map((s) => [`${s.nombre} = ${s.sumM}${s.indif.length ? ` + d(${s.indif.join(', ')})` : ''}`, `${s.nombre} = ${s.canS.txt}`, `${s.nombre} = ${s.prodM}`, `${s.nombre} = ${s.canP.txt}`]
      .concat(sol.simp ? [`${s.nombre} = ${s.minS.txt}`, `${s.nombre} = ${s.minP.txt}`] : []).join('\n')).join('\n\n');
  }
  function tablaResultado() {
    const t = sol.tabla, n = sol.n, N = t.filas.length;
    return `<table class="tv"><tr><th>#</th>${t.cab.map((c, k) => `<th${k >= n ? ' title="Puerta"' : ''}>${esc(c)}</th>`).join('')}</tr>`
      + t.filas.map((r, i) => `<tr${sep4(i, N)}><td class="idx">${i}</td>${r.map((v, k) => `<td${t.nSal.includes(k) ? ' class="sal"' : ''}>${v}</td>`).join('')}</tr>`).join('') + '</table>';
  }
  function mapas() {
    return sol.mapas.map((m) => `<table class="kmap" aria-label="Mapa de Karnaugh de ${esc(m.nombre)}"><tr><th>${esc(m.rotulo)}</th>${m.cols.map((c) => `<th>${c}</th>`).join('')}</tr>`
      + m.celdas.map((fila, r) => `<tr><th>${m.filas[r]}</th>${fila.map((c) => `<td class="${c.v === 1 ? 'c1' : ''}${c.v === 2 ? ' cx' : ''}${c.cub ? ' cub' : ''}"><small>${c.i}</small>${c.v === 2 ? 'X' : c.v}</td>`).join('')}</tr>`).join('') + '</table>').join('');
  }
  function calcula() {
    const err = $('#error'); guarda();
    $('#simplificar').textContent = sc.simp ? 'Ocultar la simplificación' : 'Simplificar ecuaciones';
    $('#simplificar').setAttribute('aria-pressed', !!sc.simp);
    $('#cambia-forma').textContent = sc.forma === 'pos' ? 'Ver el circuito en suma de productos (AND-OR)' : 'Ver el circuito en producto de sumas (OR-AND)';
    const sf = $('#f-forma'); if (sf) sf.value = sc.forma === 'pos' ? 'pos' : 'sop';
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      for (const q of ['#resumen', '#pasos', '#tabla-res', '#mapas']) $(q).innerHTML = '';
      $('#leyenda').textContent = ''; $('#c-tabla').hidden = true; $('#c-mapas').hidden = true; dibuja(); return;
    }
    err.hidden = true;
    $('#resumen').innerHTML = resumen();
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${esc(p.t)}</strong>${p.html}</li>`).join('');
    $('#c-tabla').hidden = sol.modo !== 'puertas'; $('#tabla-res').innerHTML = sol.modo === 'puertas' ? tablaResultado() : '';
    $('#c-mapas').hidden = !sol.mapas.length;
    $('#mapas').innerHTML = mapas();
    $('#ley-mapas').textContent = sol.simp || sol.modo === 'puertas' ? 'Las casillas con borde son las que cubren los términos de la suma de productos simplificada; la X es un indiferente.' : 'Cada casilla lleva el número de su fila; la X es un indiferente. Pulsa «Simplificar ecuaciones» para ver los grupos.';
    const gs = sol.dibujo.nodos.length;
    $('#leyenda').innerHTML = `Circuito de la forma ${sol.simp ? 'simplificada' : 'canónica'} en ${sol.forma === 'sop' ? 'suma de productos' : 'producto de sumas'}: <b>${gs}</b> ${gs === 1 ? 'puerta' : 'puertas'}.`;
    dibuja();
  }
  $('#cambia-forma').addEventListener('click', () => { sc.forma = sc.forma === 'pos' ? 'sop' : 'pos'; calcula(); });
  $('#simplificar').addEventListener('click', () => { sc.simp = !sc.simp; calcula(); });
  $('#copiar').addEventListener('click', () => {
    if (!sol) return;
    const t = textoEcuaciones(), b = $('#copiar');
    const ok = () => { b.textContent = 'Copiado'; setTimeout(() => { b.textContent = 'Copiar ecuaciones'; }, 1400); };
    try { navigator.clipboard.writeText(t).then(ok, () => {}); } catch (e) { /* sin portapapeles */ }
  });

  /* ---------- Circuito en el lienzo (modo tabla) ---------- */
  // posiciones de cada nodo: columna por profundidad y fila por baricentro de sus entradas
  function disposicion(c) {
    const prof = {}, pos = {};
    c.entradas.forEach((e) => { prof[e.id] = 0; });
    c.nodos.forEach((g) => { prof[g.id] = 1 + Math.max(...g.e.map((x) => prof[x])); });
    const maxp = Math.max(0, ...c.nodos.map((g) => prof[g.id]));
    c.entradas.forEach((e, i) => { pos[e.id] = { d: 0, y: 22 + i * 40, h: 0 }; });
    for (let d = 1; d <= maxp; d++) {
      const fila = c.nodos.filter((g) => prof[g.id] === d).map((g) => ({ g, h: ALTO(g), b: g.e.reduce((s, x) => s + pos[x].y, 0) / g.e.length }));
      fila.sort((p, q) => p.b - q.b);
      let tope = -1e9;
      for (const f of fila) { const y = Math.max(f.b, tope + 12 + f.h / 2); pos[f.g.id] = { d, y, h: f.h }; tope = y + f.h / 2; }
    }
    let min = 1e9, max = -1e9;
    for (const k in pos) { min = Math.min(min, pos[k].y - pos[k].h / 2); max = Math.max(max, pos[k].y + pos[k].h / 2); }
    const dy = 16 - Math.min(min, 6);
    for (const k in pos) pos[k].y += dy;
    return { pos, maxp, alto: max - min + 52 + (min > 6 ? 0 : 6 - min) };
  }
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel']) col[k] = cs.getPropertyValue(k).trim(); }
  function figura(g, tipo, x, y, h) {
    const t = trazo(tipo, h);
    g.save(); g.translate(x, y);
    const p = new Path2D(t.d); g.fill(p); g.stroke(p);
    if (t.extra) g.stroke(new Path2D(t.extra));
    g.restore();
  }
  function dibuja() {
    const cv = $('#grafica');
    if (!sol || sol.modo !== 'tabla') { const { g, w, h } = lienzo(cv); if (w && h) g.clearRect(0, 0, w, h); return; }
    const c = sol.dibujo, L = disposicion(c);
    const anchoNat = MARGEN + L.maxp * PASO + ANCHO + BURBUJA + 70, ancho = cv.getBoundingClientRect().width || anchoNat;
    const esc1 = Math.min(1, ancho / anchoNat);
    cv.style.height = `${Math.max(120, Math.ceil(L.alto * esc1))}px`;
    const { g, w, h } = lienzo(cv);
    if (!w || !h) return;
    g.save(); g.scale(esc1, esc1);
    g.font = '600 13px system-ui, sans-serif'; g.lineWidth = 1.5; g.lineJoin = 'round'; g.strokeStyle = col['--ink']; g.fillStyle = col['--ink'];
    const xg = (d) => MARGEN + (d - 1) * PASO + DESDE, pos = L.pos;
    const salida = (id) => { const p = pos[id], n = c.nodos.find((q) => q.id === id); return p.d === 0 ? { x: MARGEN, y: p.y } : { x: xg(p.d) + salX(n.tipo), y: p.y }; };
    const usos = {}; c.nodos.forEach((n) => n.e.forEach((x) => { usos[x] = (usos[x] || 0) + 1; })); c.salidas.forEach((s) => { usos[s.id] = (usos[s.id] || 0) + 1; });
    // cables
    g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    for (const n of c.nodos) {
      const p = pos[n.id], k = n.e.length, x = xg(p.d) + (BASE[n.tipo] === 'or' || BASE[n.tipo] === 'xor' ? 5 : 0);
      n.e.forEach((e, j) => {
        const o = salida(e), ty = p.y - p.h / 2 + ((j + 1) * p.h) / (k + 1), xm = Math.max(o.x + 6, xg(p.d) - 12 - 4 * j);
        g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(xm, o.y); g.lineTo(xm, ty); g.lineTo(x, ty); g.stroke();
      });
    }
    // entradas, puertas y salidas
    for (const e of c.entradas) {
      const p = pos[e.id];
      g.strokeStyle = col['--ink']; g.fillStyle = col['--ink']; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.beginPath(); g.moveTo(DESDE - 8, p.y); g.lineTo(MARGEN, p.y); g.stroke(); g.fillText(e.etq, DESDE - 12, p.y);
    }
    for (const n of c.nodos) {
      const p = pos[n.id], x = xg(p.d), y = p.y - p.h / 2;
      g.strokeStyle = col['--ink']; g.fillStyle = col['--panel']; g.lineWidth = 1.6;
      figura(g, n.tipo, x, y, p.h);
      if (INV[n.tipo]) { g.beginPath(); g.arc(x + anchoF(n.tipo) + BURBUJA, p.y, BURBUJA, 0, 6.2832); g.fillStyle = col['--panel']; g.fill(); g.stroke(); }
    }
    // puntos de bifurcación y etiquetas de salida
    g.fillStyle = col['--muted'];
    for (const id in usos) if (usos[id] > 1) { const o = salida(id); g.beginPath(); g.arc(o.x + 6, o.y, 2.6, 0, 6.2832); g.fill(); }
    for (const s of c.salidas) {
      const o = salida(s.id); g.strokeStyle = col['--accent']; g.fillStyle = col['--accent']; g.lineWidth = 2;
      g.beginPath(); g.moveTo(o.x, o.y); g.lineTo(o.x + 22, o.y); g.stroke();
      g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s.nombre, o.x + 28, o.y);
    }
    g.restore();
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('puertas-logicas').current;
  colores(); formulario(); calcula();
  window.PuertasLogicasApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { f: sol.salidas.map((s) => s.minS.txt) }, estado: () => copia(sc) };
})();
