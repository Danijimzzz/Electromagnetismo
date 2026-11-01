/* =====================================================================
   Tablas de verdad y puertas lógicas · interfaz: dos modos (desde la tabla de verdad
   o desde las puertas), ejemplos, ecuaciones, circuito en el lienzo, tabla de verdad,
   mapas de Karnaugh y desarrollo. El cálculo está en puertas-logicas/calculo.js
   (PuertasLogicas); los ayudantes comunes ($, esc, copia, lienzo) en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE] en cada cambio: es lo
   que copia Mis ejercicios (biblioteca.js). Expone window.PuertasLogicasApp para
   el modo práctica y las pruebas.
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

  /* ---------- Formulario ---------- */
  function ajustaTabla() {
    const n = nT(), m = mT(), N = 1 << n;
    sc.tabla = rango(0, m - 1).map((j) => String((sc.tabla || [])[j] ?? '').replace(/[^01X]/gi, '').toUpperCase().padEnd(N, '0').slice(0, N));
  }
  function editorTabla() {
    ajustaTabla();
    const n = nT(), m = mT(), nom = m === 1 ? ['F'] : rango(1, m).map((i) => `F${i}`);
    let h = '<div class="tabla-scroll"><table class="tv" aria-label="Tabla de verdad"><tr><th>#</th>' + NOM.slice(0, n).map((x) => `<th>${x}</th>`).join('') + nom.map((x) => `<th>${x}</th>`).join('') + '</tr>';
    for (let i = 0; i < 1 << n; i++) {
      h += `<tr><td class="idx">${i}</td>` + [...i.toString(2).padStart(n, '0')].map((b) => `<td>${b}</td>`).join('');
      h += sc.tabla.map((s, j) => `<td><button class="cel ${s[i] === '1' ? 'uno' : s[i] === 'X' ? 'x' : ''}" data-j="${j}" data-i="${i}" aria-label="${nom[j]} en la fila ${i}">${s[i]}</button></td>`).join('') + '</tr>';
    }
    return h + '</table></div>';
  }
  const fuentes = (i) => [...NOM.slice(0, nC()), ...puertas().slice(0, i).map((p) => p.id)];
  function editorPuertas() {
    const ps = puertas();
    let h = ps.length ? '' : '<p class="nota">Todavía no hay puertas. Pulsa «Añadir puerta».</p>';
    ps.forEach((p, i) => {
      const fs = fuentes(i), [a, b] = P.arid(p.tipo);
      h += `<div class="puerta" data-i="${i}"><b>${esc(p.id)}</b>`
        + `<select class="in" data-c="tipo" aria-label="Tipo de ${esc(p.id)}">${opts(Object.entries(P.NOMBRES), p.tipo)}</select>`
        + (a === b ? '' : `<select class="in" data-c="k" aria-label="Número de entradas de ${esc(p.id)}">${opts(rango(a, b).map((k) => [k, `${k} entradas`]), p.e.length)}</select>`)
        + p.e.map((e, j) => `<select class="in" data-c="e" data-j="${j}" aria-label="Entrada ${j + 1} de ${esc(p.id)}">${opts(fs.map((x) => [x, x]), e)}</select>`).join('')
        + `<label><input type="checkbox" data-c="sal"${p.sal ? ' checked' : ''}> Salida</label>`
        + `<button class="btn" data-c="del" aria-label="Quitar ${esc(p.id)}">✕</button></div>`;
    });
    return h + '<div class="fila-btn"><button class="btn" id="add">+ Añadir puerta</button></div>';
  }
  function formulario() {
    const tabla = sc.modo !== 'puertas', forma = [['sop', 'Suma de productos (AND-OR)'], ['pos', 'Producto de sumas (OR-AND)']];
    $('#tab-tabla').setAttribute('aria-selected', tabla); $('#tab-puertas').setAttribute('aria-selected', !tabla);
    $('#campos').innerHTML = tabla
      ? `<label for="f-n">Variables</label><select id="f-n" class="in" data-k="n">${opts(rango(1, P.MAXN).map((k) => [k, `${k} (${NOM.slice(0, k).join(', ')})`]), nT())}</select>`
        + `<label for="f-m">Salidas</label><select id="f-m" class="in" data-k="m">${opts(rango(1, P.MAXM).map((k) => [k, k]), mT())}</select>`
        + `<label for="f-forma">Circuito en</label><select id="f-forma" class="in" data-k="forma">${opts(forma, sc.forma)}</select>`
      : `<label for="f-nc">Entradas</label><select id="f-nc" class="in" data-k="nc">${opts(rango(1, P.MAXN).map((k) => [k, `${k} (${NOM.slice(0, k).join(', ')})`]), nC())}</select>`;
    $('#editor').innerHTML = tabla ? editorTabla() : editorPuertas();
    $('#nota').textContent = tabla ? 'Pulsa una casilla de la salida para cambiarla: 0, 1 o X (indiferente). A es el bit de más peso de la fila.' : 'Cada puerta puede usar las entradas y las puertas que están encima. Marca como «Salida» las que quieras estudiar.';
  }
  const cambio = () => { $('#ejemplos').value = ''; calcula(); };
  $('#modos').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const m = b.id === 'tab-puertas' ? 'puertas' : 'tabla';
    if (m === sc.modo) return;
    sc.modo = m; if (m === 'puertas' && !puertas().length) { sc.nc = sc.nc || '3'; nuevaPuerta(); }
    formulario(); cambio();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'nc') { puertas().forEach((p, i) => { const fs = new Set(fuentes(i)); p.e = p.e.map((x) => (fs.has(x) ? x : 'A')); }); }
    formulario(); cambio();
  });
  $('#editor').addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.classList.contains('cel')) {
      const j = +t.dataset.j, i = +t.dataset.i, s = [...sc.tabla[j]];
      s[i] = { 0: '1', 1: 'X', X: '0' }[s[i]] || '0'; sc.tabla[j] = s.join('');
      t.textContent = s[i]; t.className = `cel ${s[i] === '1' ? 'uno' : s[i] === 'X' ? 'x' : ''}`; return cambio();
    }
    if (t.id === 'add') { nuevaPuerta(); formulario(); return cambio(); }
    if (t.dataset.c === 'del') {
      const i = +t.closest('.puerta').dataset.i, id = puertas()[i].id; puertas().splice(i, 1);
      puertas().forEach((p) => { p.e = p.e.map((x) => (x === id ? 'A' : x)); });
      formulario(); cambio();
    }
  });
  $('#editor').addEventListener('change', (e) => {
    const t = e.target, caja = t.closest('.puerta'); if (!caja) return;
    const p = puertas()[+caja.dataset.i], c = t.dataset.c, fs = fuentes(+caja.dataset.i);
    if (c === 'tipo') { p.tipo = t.value; const [a, b] = P.arid(p.tipo); while (p.e.length < a) p.e.push(fs[Math.min(p.e.length, fs.length - 1)]); p.e.length = Math.min(p.e.length, b); }
    else if (c === 'k') { const k = +t.value; while (p.e.length < k) p.e.push(fs[Math.min(p.e.length, fs.length - 1)]); p.e.length = k; }
    else if (c === 'e') p.e[+t.dataset.j] = t.value;
    else if (c === 'sal') p.sal = t.checked;
    if (c !== 'sal') formulario(); cambio();
  });
  function nuevaPuerta() {
    const ps = puertas(), n = Math.max(0, ...ps.map((p) => +p.id.slice(1) || 0)) + 1, fs = fuentes(ps.length);
    ps.push({ id: `P${n}`, tipo: 'AND', e: [fs[0], fs[Math.min(1, fs.length - 1)]], sal: false });
  }

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // una tabla de 3 variables al azar para el modo práctica: minitérminos
  const azar = () => { sc = P.azar(); formulario(); calcula(); sel.value = ''; };
  const enunciado = () => `Dada la tabla de verdad de F (variables A, B y C), escribe sus minitérminos: ${esc(sc.tabla[0].replace(/(.)/g, '$1 ').trim())} (filas de 0 a 7).`;

  /* ---------- Resultados ---------- */
  const dato = (t, v, pr) => `<div class="ancho${pr ? ' pr' : ''}"><span>${t}</span><b>${v}</b></div>`;
  function resumen() {
    const un = sol.salidas.length === 1;
    return sol.salidas.map((s) => {
      const f = s.nombre, ind = s.indif.length ? ` + d(${s.indif.join(', ')})` : '';
      return dato(`${f} · minitérminos`, `${f} = ${s.sumM}${ind}`, un)
        + dato(`${f} · maxitérminos`, `${f} = ${s.prodM}${s.indif.length ? `·D(${s.indif.join(', ')})` : ''}`)
        + dato(`${f} · simplificada, suma de productos`, `${f} = ${s.minS.html}`)
        + dato(`${f} · simplificada, producto de sumas`, `${f} = ${s.minP.html}`);
    }).join('');
  }
  function textoEcuaciones() {
    return sol.salidas.map((s) => `${s.nombre} = ${s.sumM}${s.indif.length ? ` + d(${s.indif.join(', ')})` : ''}\n${s.nombre} = ${s.prodM}\n${s.nombre} = ${s.minS.txt}\n${s.nombre} = ${s.minP.txt}`).join('\n\n');
  }
  function tablaResultado() {
    const t = sol.tabla, n = sol.n;
    return `<table class="tv"><tr><th>#</th>${t.cab.map((c, k) => `<th${k >= n ? ' title="Puerta"' : ''}>${esc(c)}</th>`).join('')}</tr>`
      + t.filas.map((r, i) => `<tr><td class="idx">${i}</td>${r.map((v, k) => `<td${t.nSal.includes(k) ? ' class="sal"' : ''}>${v}</td>`).join('')}</tr>`).join('') + '</table>';
  }
  function mapas() {
    return sol.mapas.map((m) => {
      return `<table class="kmap" aria-label="Mapa de Karnaugh de ${esc(m.nombre)}"><tr><th>${esc(m.rotulo)}</th>${m.cols.map((c) => `<th>${c}</th>`).join('')}</tr>`
        + m.celdas.map((fila, r) => `<tr><th>${m.filas[r]}</th>${fila.map((c) => `<td class="${c.v === 1 ? 'c1' : ''}${c.v === 2 ? ' cx' : ''}${c.cub ? ' cub' : ''}"><small>${c.i}</small>${c.v === 2 ? 'X' : c.v}</td>`).join('')}</tr>`).join('')
        + '</table>';
    }).join('');
  }
  function calcula() {
    const err = $('#error'); guarda();
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      for (const q of ['#resumen', '#pasos', '#tabla-res', '#mapas']) $(q).innerHTML = '';
      $('#leyenda').textContent = ''; $('#c-tabla').hidden = true; dibuja(); return;
    }
    err.hidden = true;
    $('#resumen').innerHTML = resumen();
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${esc(p.t)}</strong>${p.html}</li>`).join('');
    $('#c-tabla').hidden = sol.modo !== 'puertas'; $('#tabla-res').innerHTML = sol.modo === 'puertas' ? tablaResultado() : '';
    $('#c-mapas').hidden = !sol.mapas.length;
    $('#mapas').innerHTML = mapas();
    $('#ley-mapas').textContent = 'Las casillas con borde son las que cubren los términos de la suma de productos simplificada; la X es un indiferente.';
    const gs = sol.dibujo.nodos.length;
    $('#leyenda').innerHTML = sol.modo === 'tabla'
      ? `Circuito de la forma simplificada en ${sol.forma === 'sop' ? 'suma de productos' : 'producto de sumas'}: <b>${gs}</b> ${gs === 1 ? 'puerta' : 'puertas'}.`
      : `Circuito que has montado: <b>${gs}</b> ${gs === 1 ? 'puerta' : 'puertas'}.`;
    dibuja();
  }
  $('#copiar').addEventListener('click', () => {
    if (!sol) return;
    const t = textoEcuaciones(), b = $('#copiar');
    const ok = () => { b.textContent = 'Copiado'; setTimeout(() => { b.textContent = 'Copiar ecuaciones'; }, 1400); };
    try { navigator.clipboard.writeText(t).then(ok, () => {}); } catch (e) { /* sin portapapeles */ }
  });

  /* ---------- Circuito ---------- */
  const ALTO = (g) => (g.tipo === 'NOT' ? 30 : 14 + 12 * g.e.length), ANCHO = 46, BURBUJA = 5, PASO = 124, MARGEN = 64, DESDE = 34;
  const BASE = { AND: 'and', NAND: 'and', OR: 'or', NOR: 'or', XOR: 'xor', XNOR: 'xor', NOT: 'not' };
  const INV = { NAND: 1, NOR: 1, XNOR: 1, NOT: 1 };

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
    const w = ANCHO, b = BASE[tipo], x0 = b === 'xor' ? x + 7 : x;
    g.beginPath();
    if (b === 'and') { g.moveTo(x, y); g.lineTo(x + w * 0.5, y); g.bezierCurveTo(x + w * 0.82, y, x + w, y + h * 0.2, x + w, y + h / 2); g.bezierCurveTo(x + w, y + h * 0.8, x + w * 0.82, y + h, x + w * 0.5, y + h); g.lineTo(x, y + h); g.closePath(); }
    else if (b === 'not') { g.moveTo(x, y); g.lineTo(x + w * 0.75, y + h / 2); g.lineTo(x, y + h); g.closePath(); }
    else { g.moveTo(x0, y); g.quadraticCurveTo(x + w * 0.55, y, x + w, y + h / 2); g.quadraticCurveTo(x + w * 0.55, y + h, x0, y + h); g.quadraticCurveTo(x0 + w * 0.28, y + h / 2, x0, y); g.closePath(); }
    g.fill(); g.stroke();
    if (b === 'xor') { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w * 0.28, y + h / 2, x, y + h); g.stroke(); }
  }
  function dibuja() {
    const cv = $('#grafica');
    if (!sol) { const { g, w, h } = lienzo(cv); if (w && h) g.clearRect(0, 0, w, h); return; }
    const c = sol.dibujo, L = disposicion(c);
    const anchoNat = MARGEN + L.maxp * PASO + ANCHO + BURBUJA + 70, ancho = cv.getBoundingClientRect().width || anchoNat;
    const esc1 = Math.min(1, ancho / anchoNat);
    cv.style.height = `${Math.max(120, Math.ceil(L.alto * esc1))}px`;
    const { g, w, h } = lienzo(cv);
    if (!w || !h) return;
    g.save(); g.scale(esc1, esc1);
    g.font = '600 13px system-ui, sans-serif'; g.lineWidth = 1.5; g.lineJoin = 'round'; g.strokeStyle = col['--ink']; g.fillStyle = col['--ink'];
    const xg = (d) => MARGEN + (d - 1) * PASO + DESDE, pos = L.pos;
    const salida = (id) => { const p = pos[id], n = c.nodos.find((q) => q.id === id); return p.d === 0 ? { x: MARGEN, y: p.y } : { x: xg(p.d) + ANCHO + (INV[n.tipo] ? 2 * BURBUJA : 0), y: p.y }; };
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
      if (INV[n.tipo]) { const bx = x + (n.tipo === 'NOT' ? ANCHO * 0.75 : ANCHO) + BURBUJA; g.beginPath(); g.arc(bx, p.y, BURBUJA, 0, 6.2832); g.fillStyle = col['--panel']; g.fill(); g.stroke(); }
      if (n.etq) { g.fillStyle = col['--muted']; g.font = '11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(n.etq, x + ANCHO / 2, y + p.h + 3); g.font = '600 13px system-ui, sans-serif'; }
    }
    // puntos de bifurcación y etiquetas de salida
    g.fillStyle = col['--muted'];
    for (const id in usos) if (usos[id] > 1) { const o = pos[id].d === 0 ? { x: MARGEN, y: pos[id].y } : salida(id); g.beginPath(); g.arc(o.x + 6, o.y, 2.6, 0, 6.2832); g.fill(); }
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
