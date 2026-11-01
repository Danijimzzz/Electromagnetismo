/* =====================================================================
   Esquema · editor de esquemas de arrastrar y conectar (SVG), común a las
   herramientas que lo necesiten (hoy, el Simulador de circuitos). Solo dibuja
   y conecta: las piezas (su símbolo, sus patillas y sus valores) las pone
   la herramienta con el catálogo `cat`, y el cálculo es suyo.
   Datos (todo en casillas de la rejilla, enteros):
     estado = { componentes: [{ id, t, x, y, rot (0-3), espejo, v: {…} }],
                cables: [{ a: [x, y], b: [x, y] }], vista: { x, y, z } }
     cat[t] = { pines: [[dx, dy], …] (en casillas, sin girar), dib(c) → SVG en px (1 casilla = 20 px), nombre }
   Los nudos salen de las coordenadas: dos extremos de cable o patillas en el
   mismo punto son el mismo nudo (lo hace la herramienta, ver Esquema.pines).
   Interacción: arrastrar desde la paleta (o tocar para poner en el centro),
   mover, girar (R), reflejar (F), cables arrastrando de una patilla a otra
   (a un cable crea una unión), seleccionar con clic, Mayús o rectángulo,
   copiar y pegar, deshacer y rehacer, zoom con la rueda o pellizco, mover
   el fondo arrastrando, y todo con el teclado (Tab entre piezas, flechas).
   Ganchos de la herramienta (op): cambia(), seleccion(ids), clic(c),
   colorCable(x, y), claseComp(c), texto(c), extra() → SVG añadido encima.
   ===================================================================== */
const Esquema = (() => {
  const G = 20, NS = 'http://www.w3.org/2000/svg';
  const rota = (dx, dy, r) => [[dx, dy], [-dy, dx], [-dx, -dy], [dy, -dx]][((r % 4) + 4) % 4];
  // patillas de un componente en casillas del plano (con giro y reflejo)
  const pines = (c, cat) => (cat[c.t]?.pines || []).map(([dx, dy]) => { const [rx, ry] = rota(dx, c.espejo ? -dy : dy, c.rot || 0); return [c.x + rx, c.y + ry]; });
  const clave = (p) => `${p[0]},${p[1]}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // los textos de un símbolo giran con él: se contragiran para que se lean siempre derechos
  function derecho(h, c) {
    const r = ((c.rot || 0) % 4) * 90; if (!r && !c.espejo) return h;
    return h.replace(/<text([^>]*?) x="(-?[\d.]+)" y="(-?[\d.]+)"/g, (m, a, x, y) => { const cy = +y - 4; return `<text${a} x="${x}" y="${y}" transform="translate(${x} ${cy})${c.espejo ? ' scale(1 -1)' : ''} rotate(${-r}) translate(${-x} ${-cy})"`; });
  }
  function crea(svg, op) {
    const cat = op.cat; let est = op.estado;
    est.vista = est.vista || { x: 40, y: 40, z: 1 };
    let sel = new Set(), selCable = -1, historial = [], rehacer = [], portapapeles = null, modo = null, ptrs = new Map(), pegado = 0;
    svg.setAttribute('tabindex', '0'); svg.setAttribute('role', 'application');
    svg.setAttribute('aria-label', 'Esquema del circuito. Tab para pasar de un componente a otro, flechas para moverlo, R para girarlo y Supr para borrarlo.');
    const snap = (v) => Math.round(v);
    const aMundo = (ev) => { const r = svg.getBoundingClientRect(), v = est.vista; return [(ev.clientX - r.left - v.x) / v.z / G, (ev.clientY - r.top - v.y) / v.z / G]; };
    const cambia = () => { op.cambia && op.cambia(); };
    const instantanea = () => JSON.stringify({ componentes: est.componentes, cables: est.cables });
    const marca = () => { historial.push(instantanea()); if (historial.length > 150) historial.shift(); rehacer = []; };
    const restaura = (s) => { const o = JSON.parse(s); est.componentes = o.componentes; est.cables = o.cables; sel = new Set([...sel].filter((id) => comp(id))); selCable = -1; dibuja(); cambia(); op.seleccion && op.seleccion([...sel]); };
    const comp = (id) => est.componentes.find((c) => c.id === id);

    /* ---------- Dibujo ---------- */
    function cable(a, b) {
      return (a[0] === b[0] || a[1] === b[1]) ? `M${a[0] * G} ${a[1] * G}L${b[0] * G} ${b[1] * G}` : `M${a[0] * G} ${a[1] * G}L${b[0] * G} ${a[1] * G}L${b[0] * G} ${b[1] * G}`;
    }
    function dibuja() {
      const v = est.vista, cuentas = new Map();
      const cuenta = (p) => cuentas.set(clave(p), (cuentas.get(clave(p)) || 0) + 1);
      est.cables.forEach((w) => { cuenta(w.a); cuenta(w.b); });
      est.componentes.forEach((c) => pines(c, cat).forEach(cuenta));
      let h = `<defs><pattern id="rejilla" width="${G}" height="${G}" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1" class="rej"/></pattern></defs>`;
      h += `<g transform="translate(${v.x} ${v.y}) scale(${v.z})"><rect x="-4000" y="-4000" width="8000" height="8000" fill="url(#rejilla)" class="fondo"/>`;
      h += '<g class="cables">';
      est.cables.forEach((w, i) => {
        const col = op.colorCable ? op.colorCable(w.a[0], w.a[1]) : null;
        h += `<path class="cable${i === selCable ? ' sel' : ''}" data-w="${i}" d="${cable(w.a, w.b)}"${col ? ` style="stroke:${col}"` : ''}/><path class="cable-hit" data-w="${i}" d="${cable(w.a, w.b)}"/>`;
      });
      h += '</g>';
      for (const [k, n] of cuentas) { const [x, y] = k.split(',').map(Number); const w = est.cables.some((q) => clave(q.a) === k || clave(q.b) === k); if (n >= 3 && w) h += `<circle class="union" cx="${x * G}" cy="${y * G}" r="4"/>`; }
      for (const c of est.componentes) {
        const d = cat[c.t]; if (!d) continue;
        const cls = ['comp', sel.has(c.id) ? 'sel' : '', op.claseComp ? op.claseComp(c) : ''].filter(Boolean).join(' ');
        const T = `translate(${c.x * G} ${c.y * G}) rotate(${(c.rot || 0) * 90})${c.espejo ? ' scale(1 -1)' : ''}`;
        h += `<g class="${cls}" data-c="${esc(c.id)}" tabindex="0" role="button" aria-label="${esc((d.nombre || c.t) + ' ' + c.id + (op.texto ? ', ' + op.texto(c) : ''))}"><g transform="${T}"><rect class="area" x="-6" y="-${(d.alto || 2) * G}" width="${((d.ancho || 4) * G) + 12}" height="${(d.alto || 2) * G * 2}"/>${derecho(d.dib(c), c)}</g>`;
        const t = op.texto ? op.texto(c) : '', ex = d.etq || [(d.ancho || 4) * G / 2, -((d.alto || 2) * G) - 8];
        const [lx, ly] = rota(ex[0], ex[1], c.rot || 0);
        h += `<text class="etq" x="${c.x * G + lx + (c.rot % 2 && Math.abs(lx) > 8 ? Math.sign(lx) * 6 : 0)}" y="${c.y * G + ly}" text-anchor="${c.rot % 2 && Math.abs(lx) > 8 ? (lx > 0 ? 'start' : 'end') : 'middle'}"><tspan class="id">${esc(c.id)}</tspan>${t ? ` <tspan class="val">${esc(t)}</tspan>` : ''}</text></g>`;
        pines(c, cat).forEach((p, i) => { h += `<circle class="pin" data-pin="${esc(c.id)}:${i}" cx="${p[0] * G}" cy="${p[1] * G}" r="${cuentas.get(clave(p)) > 1 ? 3 : 4}"/><circle class="pin-hit" data-px="${p[0]}" data-py="${p[1]}" cx="${p[0] * G}" cy="${p[1] * G}" r="9"/>`; });
      }
      // extremos libres de cable (para seguir cableando)
      for (const [k, n] of cuentas) if (n === 1 && est.cables.some((q) => clave(q.a) === k || clave(q.b) === k)) { const [x, y] = k.split(',').map(Number); h += `<circle class="libre pin-hit" data-px="${x}" data-py="${y}" cx="${x * G}" cy="${y * G}" r="7"/>`; }
      h += op.extra ? op.extra() : '';
      h += '<g class="capa"></g></g>';
      svg.innerHTML = h;
    }

    /* ---------- Operaciones ---------- */
    function parte(p) { // si el punto p cae en el interior de un cable recto, lo divide en dos
      for (let i = 0; i < est.cables.length; i++) {
        const { a, b } = est.cables[i];
        const recto = a[0] === b[0] ? p[0] === a[0] && p[1] > Math.min(a[1], b[1]) && p[1] < Math.max(a[1], b[1]) : a[1] === b[1] && p[1] === a[1] && p[0] > Math.min(a[0], b[0]) && p[0] < Math.max(a[0], b[0]);
        if (recto) { est.cables.splice(i, 1, { a, b: p }, { a: p, b }); return; }
      }
    }
    function conecta(a, b) {
      if (a[0] === b[0] && a[1] === b[1]) return;
      parte(a); parte(b);
      let m = null;
      if (a[0] !== b[0] && a[1] !== b[1]) { // en L: se elige la esquina que no caiga encima de una patilla ni de otro extremo (uniría nudos sin querer)
        const ocupado = new Set([...est.componentes.flatMap((c) => pines(c, cat)), ...est.cables.flatMap((w) => [w.a, w.b])].map(clave));
        const c1 = [b[0], a[1]], c2 = [a[0], b[1]];
        m = ocupado.has(clave(c1)) && !ocupado.has(clave(c2)) ? c2 : c1;
      }
      if (m) { est.cables.push({ a, b: m }, { a: m, b }); } else est.cables.push({ a, b });
      limpia();
    }
    function limpia() { // quita cables de longitud cero y duplicados
      const vistos = new Set(); est.cables = est.cables.filter((w) => { const k = [clave(w.a), clave(w.b)].sort().join('|'); if (clave(w.a) === clave(w.b) || vistos.has(k)) return false; vistos.add(k); return true; });
    }
    function nuevoId(t) {
      const L = cat[t].letra || t, usados = new Set(est.componentes.map((c) => c.id)); let n = 1;
      while (usados.has(`${L}${n}`)) n++;
      return `${L}${n}`;
    }
    function anade(t, x, y, extra = {}) {
      marca();
      const d = cat[t], v = {};
      for (const f of d.campos || []) v[f.k] = f.def ?? '';
      const c = { id: nuevoId(t), t, x: snap(x), y: snap(y), rot: 0, espejo: false, v, ...extra };
      est.componentes.push(c);
      pines(c, cat).forEach((p) => parte(p));
      sel = new Set([c.id]); selCable = -1; dibuja(); cambia(); op.seleccion && op.seleccion([c.id]);
      return c;
    }
    function borra() {
      if (!sel.size && selCable < 0) return;
      marca();
      est.componentes = est.componentes.filter((c) => !sel.has(c.id));
      if (selCable >= 0) est.cables.splice(selCable, 1);
      sel.clear(); selCable = -1; dibuja(); cambia(); op.seleccion && op.seleccion([]);
    }
    // gira o refleja la selección, arrastrando con ella los cables que llegan a sus patillas
    function transforma(f) {
      if (!sel.size) return;
      marca();
      for (const c of est.componentes.filter((q) => sel.has(q.id))) {
        const antes = pines(c, cat); f(c); const despues = pines(c, cat);
        antes.forEach((p, i) => { for (const w of est.cables) for (const e of ['a', 'b']) if (clave(w[e]) === clave(p)) w[e] = despues[i].slice(); });
      }
      limpia(); dibuja(); cambia();
    }
    const gira = () => transforma((c) => { c.rot = ((c.rot || 0) + 1) % 4; });
    const refleja = () => transforma((c) => { c.espejo = !c.espejo; });
    function mueve(dx, dy) {
      if (!sel.size) return; marca();
      const mov = est.componentes.filter((q) => sel.has(q.id)), ends = new Map();
      for (const c of mov) for (const p of pines(c, cat)) ends.set(clave(p), true);
      for (const w of est.cables) for (const e of ['a', 'b']) if (ends.has(clave(w[e]))) w[e] = [w[e][0] + dx, w[e][1] + dy];
      for (const c of mov) { c.x += dx; c.y += dy; }
      limpia(); dibuja(); cambia();
    }
    function copiar() { portapapeles = JSON.parse(JSON.stringify(est.componentes.filter((c) => sel.has(c.id)))); pegado = 0; }
    function pegar() {
      if (!portapapeles || !portapapeles.length) return;
      marca(); pegado++; const nuevos = [];
      for (const o of portapapeles) { const c = JSON.parse(JSON.stringify(o)); c.id = nuevoId(c.t); c.x += pegado * 2; c.y += pegado * 2; est.componentes.push(c); nuevos.push(c.id); }
      sel = new Set(nuevos); dibuja(); cambia(); op.seleccion && op.seleccion(nuevos);
    }
    function deshaz() { if (!historial.length) return; rehacer.push(instantanea()); restaura(historial.pop()); }
    function rehaz() { if (!rehacer.length) return; historial.push(instantanea()); restaura(rehacer.pop()); }
    function zoom(f, cx, cy) {
      const v = est.vista, r = svg.getBoundingClientRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2;
      const z = Math.min(3, Math.max(0.3, v.z * f)), k = z / v.z;
      v.x = cx - (cx - v.x) * k; v.y = cy - (cy - v.y) * k; v.z = z; dibuja();
    }
    function ajustar() {
      const r = svg.getBoundingClientRect(), pts = [];
      est.componentes.forEach((c) => { const q = pines(c, cat); pts.push(...q, [c.x, c.y]); });
      est.cables.forEach((w) => pts.push(w.a, w.b));
      if (!pts.length || !r.width) { est.vista = { x: 40, y: 40, z: 1 }; dibuja(); return; }
      const xs = pts.map((p) => p[0] * G), ys = pts.map((p) => p[1] * G), x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 110, y0 = Math.min(...ys) - 70, y1 = Math.max(...ys) + 50;
      const z = Math.min(2, Math.max(0.3, Math.min(r.width / (x1 - x0), r.height / (y1 - y0))));
      est.vista = { z, x: (r.width - (x1 - x0) * z) / 2 - x0 * z, y: (r.height - (y1 - y0) * z) / 2 - y0 * z }; dibuja();
    }
    const centro = () => { const r = svg.getBoundingClientRect(), v = est.vista; return [(r.width / 2 - v.x) / v.z / G, (r.height / 2 - v.y) / v.z / G]; };
    function selecciona(ids, w = -1) { sel = new Set(ids); selCable = w; dibuja(); op.seleccion && op.seleccion([...sel]); }

    /* ---------- Ratón y tacto ---------- */
    svg.addEventListener('pointerdown', (ev) => {
      svg.focus({ preventScroll: true });
      ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]);
      if (ptrs.size === 2) { modo = { tipo: 'pellizco', d0: null }; return; }
      const el = ev.target.closest('[data-px],[data-c],[data-w]'), p = aMundo(ev);
      svg.setPointerCapture(ev.pointerId);
      if (el && el.dataset.px !== undefined) { modo = { tipo: 'cable', a: [+el.dataset.px, +el.dataset.py], b: [+el.dataset.px, +el.dataset.py] }; ev.preventDefault(); return; }
      if (el && el.dataset.c !== undefined) {
        const id = el.dataset.c;
        if (ev.shiftKey) { sel.has(id) ? sel.delete(id) : sel.add(id); } else if (!sel.has(id)) sel = new Set([id]);
        selCable = -1; dibuja(); op.seleccion && op.seleccion([...sel]);
        modo = { tipo: 'mueve', p0: p, dx: 0, dy: 0, movido: false, id };
        return;
      }
      if (el && el.dataset.w !== undefined) { sel.clear(); selCable = +el.dataset.w; dibuja(); op.seleccion && op.seleccion([]); modo = null; return; }
      if (!ev.shiftKey) { sel.clear(); selCable = -1; dibuja(); op.seleccion && op.seleccion([]); }
      const r = svg.getBoundingClientRect();
      modo = ev.shiftKey ? { tipo: 'caja', p0: p, p1: p } : { tipo: 'pan', x0: ev.clientX, y0: ev.clientY, vx: est.vista.x, vy: est.vista.y, r };
    });
    svg.addEventListener('pointermove', (ev) => {
      if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, [ev.clientX, ev.clientY]);
      if (!modo) return;
      const capa = svg.querySelector('.capa');
      if (modo.tipo === 'pellizco' && ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = svg.getBoundingClientRect();
        if (modo.d0) zoom(d / modo.d0, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
        modo.d0 = d; return;
      }
      const p = aMundo(ev), q = [snap(p[0]), snap(p[1])];
      if (modo.tipo === 'pan') { est.vista.x = modo.vx + ev.clientX - modo.x0; est.vista.y = modo.vy + ev.clientY - modo.y0; svg.querySelector('g').setAttribute('transform', `translate(${est.vista.x} ${est.vista.y}) scale(${est.vista.z})`); }
      else if (modo.tipo === 'cable') { modo.b = q; capa.innerHTML = `<path class="cable borrador" d="${cable(modo.a, modo.b)}"/><circle class="destino" cx="${q[0] * G}" cy="${q[1] * G}" r="5"/>`; }
      else if (modo.tipo === 'caja') { modo.p1 = p; capa.innerHTML = `<rect class="caja" x="${Math.min(modo.p0[0], p[0]) * G}" y="${Math.min(modo.p0[1], p[1]) * G}" width="${Math.abs(p[0] - modo.p0[0]) * G}" height="${Math.abs(p[1] - modo.p0[1]) * G}"/>`; }
      else if (modo.tipo === 'mueve') {
        const dx = snap(p[0] - modo.p0[0]), dy = snap(p[1] - modo.p0[1]);
        if (!modo.movido && (dx || dy)) { marca(); modo.movido = true; modo.base = new Map(); for (const c of est.componentes.filter((k) => sel.has(k.id))) modo.base.set(c.id, { x: c.x, y: c.y, pines: pines(c, cat) }); }
        if (modo.movido && (dx !== modo.dx || dy !== modo.dy)) {
          // vuelve al punto de partida y aplica el desplazamiento completo, para no acumular errores
          const ddx = dx - modo.dx, ddy = dy - modo.dy; modo.dx = dx; modo.dy = dy;
          const ends = new Map(); for (const c of est.componentes.filter((k) => sel.has(k.id))) for (const pp of pines(c, cat)) ends.set(clave(pp), true);
          for (const w of est.cables) for (const e of ['a', 'b']) if (ends.has(clave(w[e]))) w[e] = [w[e][0] + ddx, w[e][1] + ddy];
          for (const c of est.componentes.filter((k) => sel.has(k.id))) { c.x += ddx; c.y += ddy; }
          dibuja();
        }
      }
    });
    const termina = (ev) => {
      ptrs.delete(ev.pointerId);
      if (!modo) return;
      const m = modo; if (ptrs.size < 2 && m.tipo === 'pellizco') { modo = null; return; }
      modo = null;
      if (m.tipo === 'cable') { if (m.a[0] !== m.b[0] || m.a[1] !== m.b[1]) { marca(); conecta(m.a, m.b); cambia(); } dibuja(); }
      else if (m.tipo === 'caja') {
        const x0 = Math.min(m.p0[0], m.p1[0]), x1 = Math.max(m.p0[0], m.p1[0]), y0 = Math.min(m.p0[1], m.p1[1]), y1 = Math.max(m.p0[1], m.p1[1]);
        for (const c of est.componentes) if (c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1) sel.add(c.id);
        dibuja(); op.seleccion && op.seleccion([...sel]);
      } else if (m.tipo === 'mueve') {
        if (m.movido) { limpia(); est.componentes.filter((k) => sel.has(k.id)).forEach((c) => pines(c, cat).forEach(parte)); dibuja(); cambia(); }
        else if (op.clic) { const c = comp(m.id); if (c) op.clic(c); }
      } else if (m.tipo === 'pan') dibuja();
    };
    svg.addEventListener('pointerup', termina); svg.addEventListener('pointercancel', termina);
    svg.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = svg.getBoundingClientRect(); zoom(ev.deltaY < 0 ? 1.12 : 1 / 1.12, ev.clientX - r.left, ev.clientY - r.top); }, { passive: false });
    svg.addEventListener('dblclick', (ev) => { const el = ev.target.closest('[data-c]'); if (el && op.editar) op.editar(el.dataset.c); });
    svg.addEventListener('focusin', (ev) => { const el = ev.target.closest && ev.target.closest('[data-c]'); if (el && !sel.has(el.dataset.c) && ev.target !== svg) { sel = new Set([el.dataset.c]); op.seleccion && op.seleccion([el.dataset.c]); svg.querySelectorAll('.comp').forEach((g) => g.classList.toggle('sel', g.dataset.c === el.dataset.c)); } });

    /* ---------- Teclado ---------- */
    svg.addEventListener('keydown', (ev) => {
      const k = ev.key, ctrl = ev.ctrlKey || ev.metaKey;
      if (ctrl && k.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? rehaz() : deshaz(); }
      else if (ctrl && k.toLowerCase() === 'y') { ev.preventDefault(); rehaz(); }
      else if (ctrl && k.toLowerCase() === 'c') { copiar(); }
      else if (ctrl && k.toLowerCase() === 'v') { ev.preventDefault(); pegar(); }
      else if (ctrl && k.toLowerCase() === 'a') { ev.preventDefault(); selecciona(est.componentes.map((c) => c.id)); }
      else if (k === 'Delete' || k === 'Backspace') { ev.preventDefault(); borra(); }
      else if (k === 'r' || k === 'R') gira();
      else if (k === 'f' || k === 'F') refleja();
      else if (k === 'Enter' && sel.size === 1 && op.editar) op.editar([...sel][0]);
      else if (k === 'Escape') { sel.clear(); selCable = -1; dibuja(); op.seleccion && op.seleccion([]); }
      else if (k.startsWith('Arrow') && sel.size) { ev.preventDefault(); mueve(k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0, k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0); const id = [...sel][0]; const g = svg.querySelector(`[data-c="${CSS.escape(id)}"]`); g && g.focus({ preventScroll: true }); }
    });

    /* ---------- Paleta: arrastrar una pieza al esquema (ratón y tacto) ---------- */
    function paleta(contenedor) {
      let fantasma = null, t0 = null, mov = false;
      contenedor.addEventListener('pointerdown', (ev) => {
        const b = ev.target.closest('[data-t]'); if (!b) return;
        t0 = b.dataset.t; mov = false; contenedor.setPointerCapture(ev.pointerId);
        fantasma = document.createElement('div'); fantasma.className = 'fantasma'; fantasma.textContent = cat[t0].nombre; fantasma.hidden = true; document.body.appendChild(fantasma);
      });
      contenedor.addEventListener('pointermove', (ev) => { if (!fantasma) return; mov = true; fantasma.hidden = false; fantasma.style.left = ev.clientX + 12 + 'px'; fantasma.style.top = ev.clientY + 12 + 'px'; });
      const fin = (ev) => {
        if (!fantasma) return;
        const r = svg.getBoundingClientRect(), dentro = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        fantasma.remove(); fantasma = null;
        if (mov && dentro) { const p = aMundo(ev); anade(t0, p[0], p[1]); svg.focus({ preventScroll: true }); }
        else if (!mov) { const c = centro(); anade(t0, c[0], c[1]); }
        t0 = null;
      };
      contenedor.addEventListener('pointerup', fin);
      contenedor.addEventListener('pointercancel', () => { if (fantasma) fantasma.remove(); fantasma = null; });
      contenedor.addEventListener('keydown', (ev) => { const b = ev.target.closest('[data-t]'); if (b && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); const c = centro(); anade(b.dataset.t, c[0], c[1]); } });
    }

    return {
      dibuja, anade, borra, gira, refleja, mueve, copiar, pegar, deshaz, rehaz, zoom, ajustar, selecciona, paleta, marca, comp,
      get estado() { return est; }, set estado(o) { est = o; est.vista = est.vista || { x: 40, y: 40, z: 1 }; sel.clear(); selCable = -1; historial = []; rehacer = []; dibuja(); },
      get seleccion() { return [...sel]; }, hayHistorial: () => historial.length, hayRehacer: () => rehacer.length,
    };
  }
  return { crea, pines, clave, G, rota, esc };
})();
if (typeof module !== 'undefined') module.exports = Esquema;
