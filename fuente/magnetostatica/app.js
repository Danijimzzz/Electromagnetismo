/* =====================================================================
   Interfaz de la calculadora de magnetostática: editor de fuentes y
   preguntas, dibujo del campo en un plano, ejemplos y archivos .json.
   ===================================================================== */
(() => {
  const { SOURCES, ANALYSES, PLANOS } = Magneto;
  const { V3 } = Engine;
  const $ = (s) => document.querySelector(s);
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
  const K_CUR = 'magneto-cur-v1', FORMATO = 'simulador-magnetostatica';
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  let uid = 0;
  const newId = () => 'm' + Date.now().toString(36) + (uid++).toString(36);
  const vacia = () => ({ titulo: '', enunciado: '', modo: 'sym', vista: { plano: 'xy', corte: '0', flechas: true }, fuentes: [], preguntas: [] });
  function valida(s) {
    const o = { ...vacia(), ...s, vista: { ...vacia().vista, ...(s.vista || {}) } };
    o.modo = s.modo === 'si' ? 'si' : 'sym';
    o.fuentes = (s.fuentes || []).filter((f) => SOURCES[f.tipo]).map((f) => ({ ...SOURCES[f.tipo].def(), I: '1', s: 'I', ...f, id: f.id || newId() }));
    o.preguntas = (s.preguntas || []).filter((q) => ANALYSES[q.tipo]).map((q) => ({ ...ANALYSES[q.tipo].def(o.fuentes), ...q, id: q.id || newId() }));
    return o;
  }
  function deEjemplo(e) { return valida({ titulo: e.titulo, enunciado: e.enunciado, ejemplo: e.clave, ...e.escena() }); }

  let esc = store.get(K_CUR, null);
  try { esc = esc ? valida(esc) : deEjemplo(MagEjemplos.lista[0]); } catch (e) { esc = deEjemplo(MagEjemplos.lista[0]); }
  let out = null;
  const guarda = () => store.set(K_CUR, esc);
  const flash = (t) => { const f = $('#flash'); f.textContent = t; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (f.hidden = true), 2200); };

  /* ---------------- editor ---------------- */
  const vecIn = (arr, onCh) => h('div', { class: 'vec' }, ...[0, 1, 2].map((j) => h('label', { class: 'vc' }, h('i', {}, 'xyz'[j]), h('input', { class: 'in', value: arr[j], 'aria-label': 'xyz'[j], oninput: (e) => { arr[j] = e.target.value; onCh(); } }))));
  const fila = (lab, ctl) => h('div', { class: 'row' }, h('span', { class: 'lab' }, lab), ctl);
  const sel = (val, opts, onCh, aria) => { const s = h('select', { class: 'in', 'aria-label': aria, onchange: (e) => onCh(e.target.value) }, ...opts.map(([v, t]) => h('option', { value: v }, t))); s.value = String(val); return s; };

  function campoFuente(f, [k, lab, tipo]) {
    const ch = () => recalcula();
    if (tipo === 'vec') return fila(lab, vecIn(f[k], ch));
    if (tipo === 'num') return fila(lab, h('input', { class: 'in', value: f[k], oninput: (e) => { f[k] = e.target.value; ch(); } }));
    if (tipo === 'plano') return fila(lab, sel(f[k], [['xy', 'XY (normal +z)'], ['xz', 'XZ (normal +y)'], ['yz', 'YZ (normal +x)']], (v) => { f[k] = v; editor(); recalcula(); }, lab));
    if (tipo === 'eje') return fila(lab, sel(f[k], [['x', 'X'], ['y', 'Y'], ['z', 'Z']], (v) => { f[k] = v; editor(); recalcula(); }, lab));
    if (tipo === 'sentido') {
      const desde = f.eje ? `+${f.eje}` : PLANOS[f.plano].normal;
      return fila(lab, sel(f[k], [['1', `antihorario visto desde ${desde}`], ['-1', `horario visto desde ${desde}`]], (v) => { f[k] = +v; ch(); }, lab));
    }
    if (tipo === 'salida') return fila(lab, sel(f[k], [['1', 'sale de A'], ['-1', 'llega a A']], (v) => { f[k] = +v; ch(); }, lab));
    if (tipo === 'bool') return fila(lab, h('input', { type: 'checkbox', checked: !!f[k], onchange: (e) => { f[k] = e.target.checked; ch(); } }));
    return null;
  }
  function tarjetaFuente(f) {
    const T = SOURCES[f.tipo];
    const corriente = esc.modo === 'si'
      ? h('div', { class: 'cur' }, h('input', { class: 'in', value: f.I, 'aria-label': 'Corriente', oninput: (e) => { f.I = e.target.value; recalcula(); } }), h('span', {}, 'A'))
      : h('div', { class: 'cur' }, h('input', { class: 'in', value: f.I, 'aria-label': 'Coeficiente de la corriente', oninput: (e) => { f.I = e.target.value; recalcula(); } }), h('span', {}, '×'), h('input', { class: 'in', value: f.s, 'aria-label': 'Símbolo de la corriente', oninput: (e) => { f.s = e.target.value.replace(/[^A-Za-z0-9_]/g, ''); recalcula(); } }));
    return h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('span', { class: 'badge' }, T.label), h('input', { class: 'in nom', value: f.nombre || '', placeholder: 'nombre', 'aria-label': 'Nombre', oninput: (e) => { f.nombre = e.target.value; recalcula(false); } }),
        h('button', { class: 'x', title: 'Quitar', 'aria-label': 'Quitar', onclick: () => { esc.fuentes = esc.fuentes.filter((x) => x !== f); editor(); recalcula(); } }, '×')),
      fila(f.tipo === 'toroide' || f.tipo === 'solenoide' ? 'Corriente por espira' : 'Corriente', corriente),
      ...T.campos.map((c) => campoFuente(f, c)));
  }
  function tarjetaPregunta(q, i) {
    const A = ANALYSES[q.tipo], ch = () => recalcula();
    const campos = [];
    if (q.P) campos.push(fila('Punto P', vecIn(q.P, ch)));
    if (q.tipo === 'Fq') {
      campos.push(fila('Carga', esc.modo === 'si' ? h('div', { class: 'cur' }, h('input', { class: 'in', value: q.q, oninput: (e) => { q.q = e.target.value; ch(); } }), h('span', {}, 'C'))
        : h('div', { class: 'cur' }, h('input', { class: 'in', value: q.q, oninput: (e) => { q.q = e.target.value; ch(); } }), h('span', {}, '×'), h('input', { class: 'in', value: q.qs, oninput: (e) => { q.qs = e.target.value.replace(/[^A-Za-z0-9_]/g, ''); ch(); } }))));
      campos.push(fila(esc.modo === 'si' ? 'Velocidad (m/s)' : 'Velocidad', vecIn(q.v, ch)));
      if (esc.modo !== 'si') campos.push(fila('Símbolo de v', h('input', { class: 'in', value: q.vs, oninput: (e) => { q.vs = e.target.value.replace(/[^A-Za-z0-9_]/g, ''); ch(); } })));
    }
    if (q.tipo === 'Fhilo') {
      const ops = esc.fuentes.filter((f) => f.tipo === 'hilo' || f.tipo === 'segmento').map((f, j) => [f.id, f.nombre || `${SOURCES[f.tipo].label} ${j + 1}`]);
      campos.push(fila('Sobre', ops.length ? sel(q.fuente, ops, (v) => { q.fuente = v; ch(); }, 'Conductor') : h('span', { class: 'hint' }, 'Añade un hilo o un segmento')));
    }
    return h('div', { class: 'card' },
      h('div', { class: 'card-h' }, h('span', { class: 'badge' }, `P${i + 1} · ${A.titulo}`), h('span', { style: 'flex:1' }),
        h('button', { class: 'x', title: 'Quitar', 'aria-label': 'Quitar', onclick: () => { esc.preguntas = esc.preguntas.filter((x) => x !== q); editor(); recalcula(); } }, '×')),
      ...campos, h('div', { class: 'result', 'data-res': q.id }), h('details', { class: 'steps', 'data-steps': q.id }, h('summary', {}, 'Ver desarrollo paso a paso'), h('ol')));
  }
  function editor() {
    $('#titulo').textContent = esc.titulo || 'Magnetostática: campo magnético y Biot-Savart';
    $('#enunciado').value = esc.enunciado || '';
    $('#modo').value = esc.modo;
    $('#plano').value = esc.vista.plano; $('#corte').value = esc.vista.corte; $('#flechas').checked = esc.vista.flechas !== false;
    $('#corte-l').textContent = { xy: 'z', xz: 'y', yz: 'x' }[esc.vista.plano];
    $('#hint-unid').textContent = esc.modo === 'si' ? 'Longitudes en metros (admite cm y mm, p. ej. 5 cm) y corrientes en amperios.' : 'Longitudes en unidades de a; admite 1/2, sqrt(3), √2. Corriente = coeficiente × símbolo.';
    $('#fuentes').replaceChildren(...esc.fuentes.map(tarjetaFuente));
    $('#preguntas').replaceChildren(...esc.preguntas.map(tarjetaPregunta));
    if (!esc.fuentes.length) $('#fuentes').append(h('p', { class: 'hint' }, 'Añade una fuente con los botones de arriba.'));
    if (!esc.preguntas.length) $('#preguntas').append(h('p', { class: 'hint' }, 'Añade una pregunta: campo en un punto, fuerza sobre una carga o sobre un hilo.'));
  }

  /* ---------------- cálculo ---------------- */
  let tRec = 0;
  // «Mis ejercicios» pide el estado al momento, sin esperar a la pausa
  window.addEventListener('simu-guardar', () => { clearTimeout(tRec); guarda(); });
  function recalcula(conGuardar = true) {
    out = Magneto.run(esc);
    const er = $('#errores');
    er.hidden = !out.errors.length; er.textContent = out.errors.join(' · ');
    for (const r of out.results) {
      const res = document.querySelector(`[data-res="${r.q.id}"]`), st = document.querySelector(`[data-steps="${r.q.id}"]`);
      if (!res) continue;
      if (r.error) { res.innerHTML = `<div class="warn">${r.error.replace(/</g, '&lt;')}</div>`; st.hidden = true; continue; }
      res.innerHTML = r.res; st.hidden = false;
      st.querySelector('ol').innerHTML = r.steps.map((s) => `<li><div class="st-h">${s.texto || ''}</div>${s.formula ? `<div>${s.formula}</div>` : ''}${s.datos ? `<div class="st-d">${s.datos}</div>` : ''}<div>${s.html}</div></li>`).join('') + `<li><div class="st-h">Resultado</div><div class="st-d">${r.final}</div><div>${r.res}</div></li>`;
    }
    if (conGuardar) { clearTimeout(tRec); tRec = setTimeout(guarda, 300); }
    dibuja();
  }

  /* ---------------- dibujo ---------------- */
  const cv = $('#cv'), ctx = cv.getContext('2d');
  let W = 0, H = 0, vista = { cx: 0, cy: 0, s: 40 }, arrastre = null, marcas = [];
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const ejes = () => ({ xy: [0, 1, 2], xz: [0, 2, 1], yz: [1, 2, 0] }[esc.vista.plano]);
  // dirección que sale de la pantalla: horizontal × vertical (en el plano XZ es −y)
  const fuera = () => { const [i, j] = ejes(), a = [0, 0, 0], b = [0, 0, 0]; a[i] = 1; b[j] = 1; return V3.cross(a, b); };
  const aPant = (p) => { const [i, j] = ejes(); return [W / 2 + (p[i] - vista.cx) * vista.s, H / 2 - (p[j] - vista.cy) * vista.s]; };
  const aMundo = (x, y) => { const [i, j, k] = ejes(), p = [0, 0, 0]; p[i] = vista.cx + (x - W / 2) / vista.s; p[j] = vista.cy - (y - H / 2) / vista.s; p[k] = corte(); return p; };
  const corte = () => { try { return Engine.parseExpr(esc.vista.corte || '0', esc.modo === 'si' ? null : 'a', esc.modo === 'si' ? { m: 1, cm: 0.01, mm: 0.001 } : null); } catch (e) { return 0; } };
  function tam() {
    const r = cv.parentElement.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // encuadre: todos los puntos de las fuentes y de las preguntas
  function encuadra() {
    out = Magneto.run(esc);
    const [i, j] = ejes(), pts = [];
    for (const f of out.fuentes) {
      for (const k of ['A', 'B', 'C']) if (f[k]) pts.push(f[k]);
      const R = f.R2 || f.R || (f.L ? f.L / 2 : 0);
      if (f.C && R) for (const d of [[R, 0, 0], [0, R, 0], [0, 0, R], [-R, 0, 0], [0, -R, 0], [0, 0, -R]]) pts.push(V3.add(f.C, d));
      if (f.tipo === 'solenoide') { const n = Magneto.EJES[f.eje]; pts.push(V3.add(f.C, V3.sc(n, f.L / 2)), V3.add(f.C, V3.sc(n, -f.L / 2))); }
    }
    for (const r of out.results) if (r.P) pts.push(r.P);
    if (!pts.length) pts.push([0, 0, 0]);
    let x0 = Math.min(...pts.map((p) => p[i])), x1 = Math.max(...pts.map((p) => p[i])), y0 = Math.min(...pts.map((p) => p[j])), y1 = Math.max(...pts.map((p) => p[j]));
    const m = Math.max(x1 - x0, y1 - y0, esc.modo === 'si' ? 0.02 : 2) * 0.35;
    x0 -= m; x1 += m; y0 -= m; y1 += m;
    vista = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, s: Math.min(W / (x1 - x0), H / (y1 - y0)) };
  }
  function flecha(x, y, ang, len, color, w = 1.5, hs = 0) {
    const x2 = x + Math.cos(ang) * len, y2 = y - Math.sin(ang) * len;
    ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    const s = hs || Math.max(4, len * 0.3);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - s * Math.cos(ang - 0.45), y2 + s * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - s * Math.cos(ang + 0.45), y2 + s * Math.sin(ang + 0.45)); ctx.fill();
  }
  function polilinea(pts, color, w = 2, conFlecha = true) {
    let ps = pts.map(aPant);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
    ps.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    if (conFlecha && ps.length > 1) {
      // punta de flecha a mitad del recorrido, en el sentido de la corriente
      const m = Math.floor((ps.length - 1) / 2), a = ps[m], b = ps[m + 1];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L > 0.01) {
        const ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
        let t = 0;
        // recta: la flecha va en el punto visible más cercano al centro del dibujo
        if (ps.length === 2) t = Math.min(0.97, Math.max(0.03, ((W / 2 - a[0]) * (b[0] - a[0]) + (H / 2 - a[1]) * (b[1] - a[1])) / (L * L)));
        if (ps.length === 2 && L * Math.min(t, 1 - t) < 14) t = Math.min(0.5, 14 / L) * (t < 0.5 ? 1 : -1) + (t < 0.5 ? 0 : 1);
        const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        flecha(x - Math.cos(ang) * 7, y + Math.sin(ang) * 7, ang, 14, color, w, 9);
      }
    }
  }
  // ⊙ (hacia el observador) o ⊗ (hacia dentro), de radio r
  function simboloNormal(x, y, saliente, r, color, w = 1.2) {
    ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.stroke();
    const c = r * 0.62;
    if (saliente) { ctx.beginPath(); ctx.arc(x, y, Math.max(1, r * 0.3), 0, 2 * Math.PI); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x - c, y - c); ctx.lineTo(x + c, y + c); ctx.moveTo(x + c, y - c); ctx.lineTo(x - c, y + c); ctx.stroke(); }
  }
  function puntoCorriente(p, saliente, color) { const [x, y] = aPant(p); simboloNormal(x, y, saliente, 8, color, 2); }
  function circ(C, pl, R, t1, t2, n = 96) {
    const pts = [];
    for (let k = 0; k <= n; k++) { const t = t1 + ((t2 - t1) * k) / n; pts.push(V3.add(C, V3.add(V3.sc(pl.e1, R * Math.cos(t)), V3.sc(pl.e2, R * Math.sin(t))))); }
    return pts;
  }
  function dibujaFuente(f, color) {
    const nrm = PLANOS[esc.vista.plano].n, lejos = 1e4 / vista.s;
    const recta = (A, u, t0, t1, sg = 1) => {
      const uh = V3.unit(u);
      if (V3.norm(V3.cross(uh, nrm)) < 1e-9) { puntoCorriente(A, V3.dot(uh, fuera()) * sg * f.k > 0, color); return; }
      const P0 = V3.add(A, V3.sc(uh, t0)), P1 = V3.add(A, V3.sc(uh, t1));
      polilinea(sg * f.k >= 0 ? [P0, P1] : [P1, P0], color);
    };
    if (f.tipo === 'hilo') recta(f.A, f.u, -lejos, lejos);
    else if (f.tipo === 'segmento') recta(f.A, V3.sub(f.B, f.A), 0, V3.norm(V3.sub(f.B, f.A)));
    else if (f.tipo === 'semi') recta(f.A, f.u, 0, lejos, f.sentido);
    else if (f.tipo === 'espira' || f.tipo === 'arco') {
      const pl = PLANOS[f.plano];
      let t1 = 0, t2 = 2 * Math.PI * f.sentido;
      if (f.tipo === 'arco') { t1 = (f.t1 * Math.PI) / 180; t2 = (f.t2 * Math.PI) / 180; }
      if (f.k < 0) [t1, t2] = [t2, t1];
      const pts = circ(f.C, pl, f.R, t1, t2, 360);
      polilinea(pts, color);
      // si la espira corta el plano de la vista, ⊙ y ⊗ donde lo atraviesa
      const nv = PLANOS[esc.vista.plano].n, kk = ejes()[2], c0 = corte();
      if (V3.norm(V3.cross(pl.n, nv)) > 1e-9) for (let q = 0; q + 1 < pts.length; q++) {
        const d0 = pts[q][kk] - c0, d1 = pts[q + 1][kk] - c0;
        if ((d0 < -1e-12) === (d1 < -1e-12)) continue;
        const pc = V3.add(pts[q], V3.sc(V3.sub(pts[q + 1], pts[q]), d0 / (d0 - d1)));
        puntoCorriente(pc, V3.dot(V3.sub(pts[q + 1], pts[q]), fuera()) > 0, color);
      }
    } else if (f.tipo === 'solenoide') {
      const n = Magneto.EJES[f.eje], pl = PLANOS[Magneto.PLANO_DE_EJE[f.eje]], vueltas = Math.min(Math.round(f.N), 24), pts = [];
      for (let k = 0; k <= vueltas * 48; k++) { const t = k / 48; pts.push(V3.add(V3.add(f.C, V3.sc(n, -f.L / 2 + (f.L * t) / vueltas)), V3.add(V3.sc(pl.e1, f.R * Math.cos(2 * Math.PI * t * f.sentido)), V3.sc(pl.e2, f.R * Math.sin(2 * Math.PI * t * f.sentido))))); }
      ctx.globalAlpha = 0.8; polilinea(pts, color, 1.2, false); ctx.globalAlpha = 1;
    } else if (f.tipo === 'toroide') {
      const pl = PLANOS[f.plano];
      for (const R of [f.R1, f.R2]) polilinea(circ(f.C, pl, R, 0, 2 * Math.PI), color, 1.5, false);
      polilinea(circ(f.C, pl, (f.R1 + f.R2) / 2, 0, 2 * Math.PI * f.sentido), color, 1, true);
    }
  }
  function dibuja() {
    if (!W) return;
    const C = { fondo: css('--canvas'), grid: css('--grid'), ink: css('--ink'), muted: css('--muted'), field: css('--field'), pos: css('--pos'), neg: css('--neg'), mark: css('--mark'), accent: css('--accent') };
    ctx.fillStyle = C.fondo; ctx.fillRect(0, 0, W, H);
    // cuadrícula
    const paso = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find((s) => s * vista.s >= 40) || 100;
    const a0 = aMundo(0, H), a1 = aMundo(W, 0), [i, j, k] = ejes();
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = Math.ceil(a0[i] / paso) * paso; x <= a1[i]; x += paso) { const X = W / 2 + (x - vista.cx) * vista.s; ctx.moveTo(X, 0); ctx.lineTo(X, H); }
    for (let y = Math.ceil(a0[j] / paso) * paso; y <= a1[j]; y += paso) { const Y = H / 2 - (y - vista.cy) * vista.s; ctx.moveTo(0, Y); ctx.lineTo(W, Y); }
    ctx.stroke();
    const [ox, oy] = aPant([0, 0, 0]);
    ctx.strokeStyle = C.muted; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = C.muted; ctx.font = 'italic 13px "STIX Two Text", serif';
    ctx.fillText('xyz'[i].toUpperCase(), W - 14, oy - 6); ctx.fillText('xyz'[j].toUpperCase(), ox + 6, 14);
    if (!out) return;
    // campo: flechas normalizadas, más opacas donde el campo es más intenso
    if (esc.vista.flechas !== false && out.fuentes.length) {
      const n = Math.max(14, Math.min(34, Math.round(W / 34))), dx = W / n, mags = [], arr = [], sal = fuera();
      for (let y = dx / 2; y < H; y += dx) for (let x = dx / 2; x < W; x += dx) {
        const B = Magneto.campoRapido(out.fuentes, aMundo(x, y)), bx = B[i], by = B[j], m = Math.hypot(bx, by), M = V3.norm(B);
        if (!(M > 0) || !isFinite(M)) continue;
        // campo casi perpendicular al plano: ⊙ o ⊗ en lugar de flecha
        arr.push(m < 0.3 * M ? [x, y, null, M, Math.sign(V3.dot(B, sal))] : [x, y, Math.atan2(by, bx), M]); mags.push(M);
      }
      mags.sort((a, b) => a - b);
      const lo = Math.log(mags[Math.floor(mags.length * 0.05)] || 1e-9), hi = Math.log(mags[Math.floor(mags.length * 0.95)] || 1);
      for (const [x, y, a, m, sg] of arr) {
        const t = hi > lo ? Math.min(1, Math.max(0, (Math.log(m) - lo) / (hi - lo))) : 1;
        ctx.globalAlpha = 0.25 + 0.7 * t;
        if (a === null) { simboloNormal(x, y, sg > 0, 3.5, C.field); continue; }
        flecha(x - Math.cos(a) * dx * 0.32, y + Math.sin(a) * dx * 0.32, a, dx * 0.64, C.field, 1.2);
      }
      ctx.globalAlpha = 1;
    }
    out.fuentes.forEach((f) => dibujaFuente(f, f.k >= 0 ? C.pos : C.neg));
    // puntos de las preguntas, con la dirección de B
    marcas = [];
    out.results.forEach((r, k) => {
      if (!r.P) return;
      const [x, y] = aPant(r.P);
      const B = Object.values(r.vp || {}).reduce((a, b) => V3.add(a, b), [0, 0, 0]), m = Math.hypot(B[i], B[j]);
      const normal = !(m > 0.3 * V3.norm(B)) && V3.norm(B) > 0;
      if (m > 0.3 * V3.norm(B)) flecha(x, y, Math.atan2(B[j], B[i]), 34, C.accent, 2.4);
      if (normal) simboloNormal(x, y, V3.dot(B, fuera()) > 0, 11, C.accent, 2.4);
      else { ctx.fillStyle = C.mark; ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill(); }
      ctx.fillStyle = C.mark;
      ctx.font = '600 12px "IBM Plex Sans", sans-serif'; ctx.fillText(`P${esc.preguntas.indexOf(r.q) + 1}`, x + 8, y + 16);
      marcas.push({ x, y, q: r.q });
    });
  }
  const posEv = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', (e) => {
    const [x, y] = posEv(e), m = marcas.find((m) => Math.hypot(m.x - x, m.y - y) < 12);
    if (m) { arrastre = m.q; cv.setPointerCapture(e.pointerId); }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const [x, y] = posEv(e), p = aMundo(x, y), [i, j] = ejes();
    const red = (v) => { const st = esc.modo === 'si' ? 0.001 : 0.05; return String(+(Math.round(v / st) * st).toFixed(4)); };
    arrastre.P[i] = red(p[i]); arrastre.P[j] = red(p[j]);
    recalcula();
  });
  cv.addEventListener('pointerup', () => { if (arrastre) { arrastre = null; editor(); recalcula(); } });

  /* ---------------- barra de herramientas ---------------- */
  const sEj = $('#ejemplo');
  sEj.append(h('option', { value: '' }, 'Ejemplos…'), ...MagEjemplos.lista.map((e, k) => h('option', { value: e.clave }, `${k + 1} · ${e.titulo}`)));
  sEj.addEventListener('change', () => {
    const e = MagEjemplos.lista.find((x) => x.clave === sEj.value);
    if (e) { esc = deEjemplo(e); editor(); tam(); encuadra(); recalcula(); }
    sEj.value = '';
  });
  $('#modo').addEventListener('change', (e) => { esc.modo = e.target.value; editor(); encuadra(); recalcula(); });
  $('#enunciado').addEventListener('input', (e) => { esc.enunciado = e.target.value; recalcula(false); guarda(); });
  $('#plano').addEventListener('change', (e) => { esc.vista.plano = e.target.value; editor(); encuadra(); recalcula(); });
  $('#corte').addEventListener('input', (e) => { esc.vista.corte = e.target.value; recalcula(); });
  $('#flechas').addEventListener('change', (e) => { esc.vista.flechas = e.target.checked; recalcula(); });
  $('#nuevo').addEventListener('click', () => { esc = vacia(); esc.fuentes.push(valida({ fuentes: [{ tipo: 'hilo' }] }).fuentes[0]); esc.preguntas.push({ id: newId(), tipo: 'B', P: ['1', '0', '0'] }); editor(); encuadra(); recalcula(); });
  $('#guardar').addEventListener('click', () => {
    const datos = { formato: FORMATO, version: 1, problema: esc };
    const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(datos, null, 1)], { type: 'application/json' })), download: `${(esc.titulo || 'magnetostatica').replace(/[^\wáéíóúñ -]/gi, '').trim() || 'magnetostatica'}.emsim.json` });
    document.body.append(a); a.click(); a.remove();
  });
  $('#abrir').addEventListener('click', () => $('#archivo').click());
  $('#archivo').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.formato !== FORMATO) throw new Error('no es un problema de magnetostática');
      esc = valida(d.problema); editor(); encuadra(); recalcula(); flash('Problema abierto');
    } catch (err) { flash('No se pudo abrir: ' + err.message); }
  });
  for (const [t, T] of Object.entries(SOURCES)) $('#add-fuente').append(h('button', { class: 'chip', onclick: () => { esc.fuentes.push({ id: newId(), tipo: t, nombre: `${T.label} ${esc.fuentes.length + 1}`, I: '1', s: 'I', ...T.def() }); editor(); encuadra(); recalcula(); } }, '+ ' + T.label));
  for (const [t, A] of Object.entries(ANALYSES)) $('#add-pregunta').append(h('button', { class: 'chip', onclick: () => { esc.preguntas.push({ id: newId(), tipo: t, ...A.def(esc.fuentes) }); editor(); encuadra(); recalcula(); } }, '+ ' + A.label));
  const ver = $('#ver'); if (ver) ver.textContent = Version.de('magnetostatica').current;

  new ResizeObserver(() => { tam(); encuadra(); dibuja(); }).observe(cv.parentElement);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);
  editor(); tam(); recalcula(false); encuadra(); dibuja();
  window.MagApp = { get escena() { return esc; }, get salida() { return out; }, abrirEjemplo: (c) => { esc = deEjemplo(MagEjemplos.lista.find((x) => x.clave === c)); editor(); encuadra(); recalcula(); } };
})();
