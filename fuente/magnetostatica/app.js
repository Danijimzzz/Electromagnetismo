/* =====================================================================
   Interfaz de la calculadora de magnetostática: editor de fuentes y
   preguntas, dibujo del campo en un plano (flechas, mapa de color de |B| y
   líneas de campo), ejemplos y archivos .json.
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
  const vacia = () => ({ titulo: '', enunciado: '', modo: 'sym', vista: { plano: 'xy', corte: '0', flechas: true, mapa: false, lineas: false }, fuentes: [], preguntas: [] });
  function valida(s) {
    const o = { ...vacia(), ...s, vista: { ...vacia().vista, ...(s.vista || {}) } };
    o.modo = s.modo === 'si' ? 'si' : 'sym';
    o.fuentes = (s.fuentes || []).filter((f) => SOURCES[f.tipo]).map((f) => ({ I: '1', s: 'I', ...SOURCES[f.tipo].def(), ...f, id: f.id || newId() }));
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
    if (tipo === 'perfil') return fila(lab, sel(f[k], [['uniforme', 'uniforme'], ['lineal', 'J proporcional a r']], (v) => { f[k] = v; ch(); }, lab));
    return null;
  }
  function tarjetaFuente(f) {
    const T = SOURCES[f.tipo];
    const corriente = esc.modo === 'si'
      ? h('div', { class: 'cur' }, h('input', { class: 'in', value: f.I, 'aria-label': 'Corriente', oninput: (e) => { f.I = e.target.value; recalcula(); } }), h('span', {}, { lamina: 'A/m', disco: 'C/(m²·s)' }[f.tipo] || 'A'))
      : h('div', { class: 'cur' }, h('input', { class: 'in', value: f.I, 'aria-label': 'Coeficiente de la corriente', oninput: (e) => { f.I = e.target.value; recalcula(); } }), h('span', {}, '×'), h('input', { class: 'in', value: f.s, 'aria-label': 'Símbolo de la corriente', oninput: (e) => { f.s = e.target.value.replace(/[^A-Za-z0-9_*]/g, ''); recalcula(); } }));
    return h('div', { class: 'pieza' },
      h('div', { class: 'card-h' }, h('span', { class: 'badge' }, T.label), h('input', { class: 'in nom', value: f.nombre || '', placeholder: 'nombre', 'aria-label': 'Nombre', oninput: (e) => { f.nombre = e.target.value; recalcula(false); } }),
        h('button', { class: 'x', title: 'Quitar', 'aria-label': 'Quitar', onclick: () => { esc.fuentes = esc.fuentes.filter((x) => x !== f); editor(); recalcula(); } }, '×')),
      fila({ toroide: 'Corriente por espira', solenoide: 'Corriente por espira', lamina: 'Densidad K', disco: 'σω (carga × giro)', cilindro: 'Corriente total' }[f.tipo] || 'Corriente', corriente),
      ...T.campos.map((c) => campoFuente(f, c)));
  }
  function tarjetaPregunta(q, i) {
    const A = ANALYSES[q.tipo], ch = () => recalcula();
    const campos = [];
    if (q.P) campos.push(fila(q.tipo === 'perfil' ? 'Desde P' : 'Punto P', vecIn(q.P, ch)));
    if (q.Q) campos.push(fila('Hasta Q', vecIn(q.Q, ch)));
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
    return h('div', { class: 'pieza' },
      h('div', { class: 'card-h' }, h('span', { class: 'badge' }, `P${i + 1} · ${A.titulo}`), h('span', { style: 'flex:1' }),
        h('button', { class: 'x', title: 'Quitar', 'aria-label': 'Quitar', onclick: () => { esc.preguntas = esc.preguntas.filter((x) => x !== q); editor(); recalcula(); } }, '×')),
      ...campos, h('div', { class: 'result', 'data-res': q.id }), h('details', { class: 'steps', 'data-steps': q.id }, h('summary', {}, 'Ver desarrollo paso a paso'), h('ol')));
  }
  function editor() {
    $('#titulo').textContent = esc.titulo || 'Magnetostática: campo magnético y Biot-Savart';
    $('#enunciado').value = esc.enunciado || '';
    $('#modo').value = esc.modo;
    $('#plano').value = esc.vista.plano; $('#corte').value = esc.vista.corte; $('#flechas').checked = esc.vista.flechas !== false; $('#mapa').checked = !!esc.vista.mapa; $('#lineas').checked = !!esc.vista.lineas;
    $('#corte-l').textContent = { xy: 'z', xz: 'y', yz: 'x' }[esc.vista.plano];
    $('#hint-unid').textContent = esc.modo === 'si' ? 'Longitudes en metros (admite cm y mm, p. ej. 5 cm) y corrientes en amperios.' : 'Longitudes en unidades de a; admite 1/2, sqrt(3), √2. Corriente = coeficiente × símbolo.';
    $('#fuentes').replaceChildren(...esc.fuentes.map(tarjetaFuente));
    $('#preguntas').replaceChildren(...esc.preguntas.map(tarjetaPregunta));
    if (!esc.fuentes.length) $('#fuentes').append(h('p', { class: 'hint' }, 'Añade una fuente con los botones de arriba.'));
    if (!esc.preguntas.length) $('#preguntas').append(h('p', { class: 'hint' }, 'Añade una pregunta: campo en un punto, fuerza sobre una carga o sobre un hilo, o el perfil de |B| a lo largo de una recta.'));
  }

  /* ---------------- cálculo ---------------- */
  let tRec = 0, t3 = 0;
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
    clearTimeout(t3); t3 = setTimeout(() => { if (typeof actualiza3d === 'function') actualiza3d(); }, 120);
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
      const R = f.R2 || f.R || (f.L ? f.L / 2 : 0) || Math.max(f.a || 0, f.b || 0) / 2 || (f.tipo === 'lamina' ? 2 : 0);
      if (f.C && R) for (const d of [[R, 0, 0], [0, R, 0], [0, 0, R], [-R, 0, 0], [0, -R, 0], [0, 0, -R]]) pts.push(V3.add(f.C, d));
      if (f.tipo === 'solenoide') { const n = Magneto.EJES[f.eje]; pts.push(V3.add(f.C, V3.sc(n, f.L / 2)), V3.add(f.C, V3.sc(n, -f.L / 2))); }
    }
    for (const r of out.results) { if (r.P) pts.push(r.P); if (r.Q) pts.push(r.Q); }
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
    } else if (f.tipo === 'rectangular') {
      const v = Magneto.esquinas(f), pts = [];
      for (let q = 0; q < 4; q++) for (let k = 0; k <= 20; k++) pts.push(V3.add(v[q], V3.sc(V3.sub(v[(q + 1) % 4], v[q]), k / 20)));
      polilinea(f.k >= 0 ? pts : pts.reverse(), color);
    } else if (f.tipo === 'cilindro') {
      const uh = V3.unit(f.u);
      if (V3.norm(V3.cross(uh, nrm)) < 1e-9) {
        // corte transversal: anillo o círculo relleno, con ⊙ o ⊗ en el centro de la parte con corriente
        const [x, y] = aPant(f.C), r2 = f.R2 * vista.s, r1 = f.R1 * vista.s, sal = V3.dot(uh, fuera()) * f.k > 0;
        ctx.fillStyle = color; ctx.globalAlpha = 0.16; ctx.beginPath(); ctx.arc(x, y, r2, 0, 2 * Math.PI); if (r1 > 0) { ctx.moveTo(x + r1, y); ctx.arc(x, y, r1, 0, 2 * Math.PI); } ctx.fill('evenodd'); ctx.globalAlpha = 1;
        ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r2, 0, 2 * Math.PI); ctx.stroke(); if (r1 > 0) { ctx.beginPath(); ctx.arc(x, y, r1, 0, 2 * Math.PI); ctx.stroke(); }
        if (r1 > 0) for (const a of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) simboloNormal(x + ((r1 + r2) / 2) * Math.cos(a), y + ((r1 + r2) / 2) * Math.sin(a), sal, 6, color, 1.5);
        else simboloNormal(x, y, sal, 8, color, 2);
      } else {
        // de lado: banda con la corriente a lo largo del eje
        const lat = V3.unit(V3.cross(nrm, uh));
        for (const sg of [1, -1]) for (const R of [f.R1, f.R2]) if (R > 0) { const o = V3.sc(lat, sg * R); polilinea([V3.add(f.C, V3.add(o, V3.sc(uh, -lejos))), V3.add(f.C, V3.add(o, V3.sc(uh, lejos)))], color, 1.2, false); }
        recta(f.C, f.u, -lejos, lejos);
      }
    } else if (f.tipo === 'lamina') {
      const n = Magneto.EJES[f.eje];
      if (V3.norm(V3.cross(n, nrm)) < 1e-9) {
        // la lámina es el plano de la vista: sombreado con flechas de K
        ctx.fillStyle = color; ctx.globalAlpha = 0.08; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        const [i, j] = ejes(), a = Math.atan2(f.u[j], f.u[i]);
        for (let y = 40; y < H; y += 80) for (let x = 40; x < W; x += 110) flecha(x, y, a, 26, color, 1.6);
      } else {
        const t = V3.unit(V3.cross(n, nrm)), uh = V3.unit(V3.sub(f.u, V3.sc(n, V3.dot(f.u, n))));
        ctx.lineWidth = 3; polilinea([V3.add(f.C, V3.sc(t, -lejos)), V3.add(f.C, V3.sc(t, lejos))], color, 3, false);
        if (Math.abs(V3.dot(uh, t)) > 0.5) recta(f.C, V3.sc(t, Math.sign(V3.dot(uh, t))), -lejos, lejos);
        else { const sal = V3.dot(uh, fuera()) * f.k > 0; for (let k = -6; k <= 6; k++) { const [x, y] = aPant(V3.add(f.C, V3.sc(t, (k * 70) / vista.s))); simboloNormal(x, y, sal, 6, color, 1.5); } }
      }
    } else if (f.tipo === 'disco') {
      const pl = PLANOS[f.plano];
      ctx.fillStyle = color; ctx.globalAlpha = 0.12; const pts = circ(f.C, pl, f.R, 0, 2 * Math.PI).map(aPant); ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.fill(); ctx.globalAlpha = 1;
      polilinea(circ(f.C, pl, f.R, 0, 2 * Math.PI * f.sentido * Math.sign(f.k || 1)), color, 1.6, true);
      polilinea(circ(f.C, pl, f.R * 0.55, 0, 2 * Math.PI * f.sentido * Math.sign(f.k || 1)), color, 1, true);
    } else if (f.tipo === 'toroide') {
      const pl = PLANOS[f.plano];
      for (const R of [f.R1, f.R2]) polilinea(circ(f.C, pl, R, 0, 2 * Math.PI), color, 1.5, false);
      polilinea(circ(f.C, pl, (f.R1 + f.R2) / 2, 0, 2 * Math.PI * f.sentido), color, 1, true);
    }
  }
  // campo en una rejilla de la pantalla (se reutiliza mientras no cambie nada)
  let cacheR = null;
  function rejilla() {
    const gs = 10, nx = Math.ceil(W / gs) + 1, ny = Math.ceil(H / gs) + 1, clave = JSON.stringify([out.fuentes, esc.vista.plano, corte(), W, H, vista]);
    if (cacheR && cacheR.clave === clave) return cacheR;
    const [i, j] = ejes(), bx = new Float32Array(nx * ny), by = new Float32Array(nx * ny), m = new Float32Array(nx * ny);
    for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
      const B = Magneto.campoRapido(out.fuentes, aMundo(ix * gs, iy * gs)), k = iy * nx + ix, M = V3.norm(B);
      if (!isFinite(M)) continue;
      bx[k] = B[i]; by[k] = B[j]; m[k] = M;
    }
    cacheR = { clave, gs, nx, ny, bx, by, m };
    return cacheR;
  }
  const rgb = (c) => { const g = document.createElement('canvas').getContext('2d'); g.fillStyle = c; const x = g.fillStyle; return x[0] === '#' ? [1, 3, 5].map((k) => parseInt(x.slice(k, k + 2), 16)) : (x.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number); };
  // mapa de color de |B| en escala logarítmica
  function mapaColor(R, color) {
    const val = Array.from(R.m).filter((x) => x > 0).sort((a, b) => a - b);
    if (!val.length) return;
    const lo = Math.log(val[Math.floor(val.length * 0.05)]), hi = Math.log(val[Math.floor(val.length * 0.98)]), [r, g, b] = rgb(color);
    const off = document.createElement('canvas'); off.width = R.nx; off.height = R.ny;
    const oc = off.getContext('2d'), img = oc.createImageData(R.nx, R.ny);
    for (let k = 0; k < R.m.length; k++) {
      const t = R.m[k] > 0 && hi > lo ? Math.min(1, Math.max(0, (Math.log(R.m[k]) - lo) / (hi - lo))) : 0;
      img.data[4 * k] = r; img.data[4 * k + 1] = g; img.data[4 * k + 2] = b; img.data[4 * k + 3] = Math.round(150 * t);
    }
    oc.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, -R.gs / 2, -R.gs / 2, R.nx * R.gs, R.ny * R.gs);
  }
  // dirección del campo en el plano por interpolación bilineal en la rejilla
  function dirEn(R, x, y) {
    const fx = x / R.gs, fy = y / R.gs, ix = Math.floor(fx), iy = Math.floor(fy);
    if (ix < 0 || iy < 0 || ix >= R.nx - 1 || iy >= R.ny - 1) return null;
    const tx = fx - ix, ty = fy - iy, k = iy * R.nx + ix, w = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty], ks = [k, k + 1, k + R.nx, k + R.nx + 1];
    let bx = 0, by = 0, M = 0;
    ks.forEach((q, n) => { bx += w[n] * R.bx[q]; by += w[n] * R.by[q]; M += w[n] * R.m[q]; });
    const p = Math.hypot(bx, by);
    // sin campo en el plano (perpendicular a la vista o nulo): la línea se corta
    if (!(p > 0.25 * M) || !(p > 0)) return null;
    return [bx / p, -by / p];
  }
  // líneas de campo repartidas con separación parecida (proyección en el plano de la vista)
  function lineasCampo(R, color) {
    const sep = 26, cw = sep / 2, cx = Math.ceil(W / cw), cy = Math.ceil(H / cw), ocup = new Uint8Array(cx * cy), paso = 2.5;
    const celda = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : Math.floor(y / cw) * cx + Math.floor(x / cw));
    const libre = (x, y) => { const c = celda(x, y); if (c < 0) return false; const gx = c % cx, gy = Math.floor(c / cx); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const X = gx + a, Y = gy + b; if (X >= 0 && Y >= 0 && X < cx && Y < cy && ocup[Y * cx + X]) return false; } return true; };
    const sigue = (x0, y0, sg) => {
      const pts = []; let x = x0, y = y0;
      for (let n = 0; n < 900; n++) {
        const d1 = dirEn(R, x, y); if (!d1) break;
        const xm = x + sg * d1[0] * paso / 2, ym = y + sg * d1[1] * paso / 2, d2 = dirEn(R, xm, ym); if (!d2) break;
        x += sg * d2[0] * paso; y += sg * d2[1] * paso;
        if (n > 4 && !libre(x, y)) break;
        pts.push([x, y]);
        if (n > 30 && Math.hypot(x - x0, y - y0) < paso * 1.5) { pts.push([x0, y0]); break; }
      }
      return pts;
    };
    ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.85;
    for (let gy = 0; gy < cy; gy += 2) for (let gx = 0; gx < cx; gx += 2) {
      const x0 = (gx + 1) * cw, y0 = (gy + 1) * cw;
      if (!libre(x0, y0) || !dirEn(R, x0, y0)) continue;
      const atras = sigue(x0, y0, -1).reverse(), linea = [...atras, [x0, y0], ...sigue(x0, y0, 1)];
      if (linea.length < 8) continue;
      for (const [x, y] of linea) { const c = celda(x, y); if (c >= 0) ocup[c] = 1; }
      ctx.beginPath(); linea.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      const k = Math.floor(linea.length / 2), [xa, ya] = linea[k - 1], [xb, yb] = linea[k + 1] || linea[k];
      flecha(xa, ya, Math.atan2(-(yb - ya), xb - xa), 8, color, 1.3, 6);
    }
    ctx.globalAlpha = 1;
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
    if ((esc.vista.mapa || esc.vista.lineas) && out.fuentes.length) {
      const R = rejilla();
      if (esc.vista.mapa) mapaColor(R, C.neg);
      if (esc.vista.lineas) lineasCampo(R, C.field);
    }
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
      if (r.Q) { const [x1, y1] = aPant(r.P), [x2, y2] = aPant(r.Q); ctx.strokeStyle = C.mark; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = C.mark; ctx.beginPath(); ctx.arc(x2, y2, 4, 0, 2 * Math.PI); ctx.fill(); ctx.font = '600 12px "IBM Plex Sans", sans-serif'; ctx.fillText('Q', x2 + 8, y2 + 16); }
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
  $('#mapa').addEventListener('change', (e) => { esc.vista.mapa = e.target.checked; recalcula(); });
  $('#lineas').addEventListener('change', (e) => { esc.vista.lineas = e.target.checked; recalcula(); });
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

  /* ---------------- vista 3D de las líneas de B (EM-5), con el plano 2D de arriba como alternativa y una descripción en texto ---------------- */
  let c3 = null; // escena 3D en caché: se rehace al cambiar las fuentes
  function tam3d(f) {
    const c = f.C || f.A || [0, 0, 0], d = V3.norm(c);
    const t = { espira: f.R, disco: f.R, rectangular: Math.max(f.a || 0, f.b || 0) / 2, solenoide: Math.max(f.R || 0, (f.L || 0) / 2), toroide: f.R2, cilindro: f.R2 }[f.tipo];
    return d + (t || 1);
  }
  function escena3dMag() {
    if (c3) return c3.e;
    const fs = out ? out.fuentes : [];
    if (!fs.length) return (c3 = { e: {}, t: 'Sin fuentes: añade una para ver sus líneas de campo.' }).e;
    const S = Math.max(1e-6, ...fs.map(tam3d)) * 1.5, n = (p) => [p[0] / S, p[1] / S, p[2] / S], lineas = [], pl = (f) => PLANOS[f.plano];
    const circ = (c, e1, e2, r, a0 = 0, a1 = 2 * Math.PI, N = 64) => Array.from({ length: N + 1 }, (_, i) => { const t = a0 + ((a1 - a0) * i) / N; return n(V3.add(c, V3.add(V3.sc(e1, r * Math.cos(t)), V3.sc(e2, r * Math.sin(t))))); });
    const recta = (A, B) => ({ pts: [n(A), n(B)], color: '--pos', ancho: 3, flecha: true });
    for (const f of fs) {
      if (f.tipo === 'espira' || f.tipo === 'disco') lineas.push({ pts: circ(f.C, pl(f).e1, pl(f).e2, f.R, 0, 2 * Math.PI * f.sentido), color: '--pos', ancho: 3, flecha: true });
      else if (f.tipo === 'rectangular') { const v = Magneto.esquinas(f); lineas.push({ pts: [...v, v[0]].map(n), color: '--pos', ancho: 3, flecha: true }); }
      else if (f.tipo === 'solenoide') { const k = Magneto.EJES[f.eje], q = Magneto.PLANOS[Magneto.PLANO_DE_EJE[f.eje]], vu = Math.max(2, Math.min(f.N, 14)); lineas.push({ pts: Array.from({ length: vu * 24 + 1 }, (_, i) => { const t = (2 * Math.PI * i) / 24, z = -f.L / 2 + (f.L * i) / (vu * 24); return n(V3.add(f.C, V3.add(V3.sc(k, z), V3.add(V3.sc(q.e1, f.R * Math.cos(t * f.sentido)), V3.sc(q.e2, f.R * Math.sin(t * f.sentido)))))); }), color: '--pos', ancho: 2, flecha: true }); }
      else if (f.tipo === 'toroide') for (const r of [f.R1, (f.R1 + f.R2) / 2, f.R2]) lineas.push({ pts: circ(f.C, pl(f).e1, pl(f).e2, r), color: '--pos', ancho: r === f.R1 || r === f.R2 ? 1.2 : 2.4 });
      else if (f.tipo === 'hilo' || f.tipo === 'cilindro') { const u = V3.unit(f.u), c = f.A || f.C; lineas.push(recta(V3.sub(c, V3.sc(u, S * 1.2)), V3.add(c, V3.sc(u, S * 1.2)))); }
      else if (f.tipo === 'segmento') lineas.push(recta(f.A, f.B));
      else if (f.tipo === 'semi') { const u = V3.unit(f.u); lineas.push(recta(f.A, V3.add(f.A, V3.sc(u, S * 1.2 * f.sentido)))); }
      else if (f.tipo === 'arco') lineas.push({ pts: circ(f.C, pl(f).e1, pl(f).e2, f.R, (f.t1 * Math.PI) / 180, (f.t2 * Math.PI) / 180, 40), color: '--pos', ancho: 3, flecha: true });
    }
    // líneas de B: se siembran alrededor de cada fuente y se siguen en los dos sentidos
    const B3 = (p) => Magneto.campoRapido(fs, p), paso = 0.03 * S, vistos = [], dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0.7, 0, 0.7], [0, 0.7, 0.7]];
    let nl = 0;
    const sigue = (p0, sg) => {
      const pts = []; let p = p0;
      for (let k = 0; k < 420; k++) {
        const b1 = B3(p), m1 = V3.norm(b1); if (!(m1 > 1e-12)) break;
        const pm = V3.add(p, V3.sc(b1, (sg * paso) / (2 * m1))), b2 = B3(pm), m2 = V3.norm(b2); if (!(m2 > 1e-12)) break;
        p = V3.add(p, V3.sc(b2, (sg * paso) / m2));
        if (Math.max(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])) > S) break;
        pts.push(p); if (k > 20 && V3.norm(V3.sub(p, p0)) < paso * 1.5) { pts.push(p0); break; }
      }
      return pts;
    };
    for (const f of fs) {
      const c = f.C || f.A || [0, 0, 0], r = tam3d(f) - V3.norm(c);
      for (const rr of [0.55, 1.15]) for (const d of dirs) {
        if (nl >= 22) break;
        const p0 = V3.add(c, V3.sc(V3.unit(d), r * rr + 0.12 * S)), m = V3.norm(B3(p0));
        if (!(m > 1e-12) || vistos.some((q) => V3.norm(V3.sub(q, p0)) < 0.12 * S)) continue;
        const l = [...sigue(p0, -1).reverse(), p0, ...sigue(p0, 1)];
        if (l.length < 10) continue;
        l.forEach((q, i) => { if (i % 5 === 0) vistos.push(q); });
        lineas.push({ pts: l.map(n), color: '--neg', ancho: 1.4, flecha: true }); nl++;
      }
    }
    const nom = fs.map((f) => (f.nombre || SOURCES[f.tipo].label)).join(', ');
    c3 = { e: { lineas, ejes: true, etiquetas: [] }, t: `Vista 3D de las líneas del campo magnético de ${fs.length === 1 ? 'una fuente' : fs.length + ' fuentes'} (${nom}): ${nl} líneas azules de B, que rodean a la corriente en el sentido de la regla de la mano derecha y se cierran sobre sí mismas, y en rojo los conductores con el sentido de la corriente. La vista plana de arriba, con «líneas de campo» activado, muestra el mismo campo en un plano de corte. Se gira con las flechas del teclado, arrastrando o con los botones.` };
    return c3.e;
  }
  const vista3d = Vista3D.monta('#vista3d', { escena: escena3dMag, descripcion: () => (c3 ? c3.t : 'Vista tridimensional de las líneas de campo'), yaw: 0.7, pitch: 0.4 });
  function actualiza3d() { c3 = null; escena3dMag(); $('#desc3d').textContent = c3.t; vista3d.dibuja(); }
  const ver = $('#ver'); if (ver) ver.textContent = Version.de('magnetostatica').current;

  new ResizeObserver(() => { tam(); encuadra(); dibuja(); }).observe(cv.parentElement);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);
  editor(); tam(); recalcula(false); encuadra(); dibuja(); actualiza3d();
  window.MagApp = { get escena() { return esc; }, get salida() { return out; }, abrirEjemplo: (c) => { esc = deEjemplo(MagEjemplos.lista.find((x) => x.clave === c)); editor(); encuadra(); recalcula(); } };
})();
