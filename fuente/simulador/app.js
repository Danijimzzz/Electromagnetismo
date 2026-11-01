/* =====================================================================
   Simulador de circuitos · interfaz: paleta, esquema (esquema.js), propiedades,
   y resultados en cinco pestañas (continua, osciloscopio, fasores, Bode y
   desarrollo). El cálculo está en motor.js (SimCircuitos), el paso del dibujo
   al circuito en extraer.js, los componentes en componentes.js y los ejemplos
   en ejemplos.js; los ayudantes comunes ($, esc, copia, lienzo, marcas) en
   herramienta.js. Guarda el estado entero (sc) en localStorage[CLAVE] en cada
   cambio: es lo que copia Mis ejercicios (biblioteca.js). Expone
   window.SimuladorApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo, marcas } = Herramienta;
  const S = SimCircuitos, CAT = CompSim.C, CLAVE = 'simulador-v1';
  const RED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let sc = copia(EjemplosSim.lista[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.componentes) sc = g; } catch (e) { /* sin almacenamiento */ }
  sc.analisis = sc.analisis || {};
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };

  /* ---------- Formato ---------- */
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const num = (x, d = 4) => { if (!isFinite(x)) return '—'; if (Math.abs(x) < 1e-15) return '0'; return String(+x.toPrecision(d)).replace('.', ',').replace('-', '−'); };
  const u = (x, un, d = 4) => { if (!isFinite(x)) return `— ${un}`; if (Math.abs(x) < 1e-15) return `0 ${un}`; const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1]; return `${num(x / p[0], d)} ${p[1]}${un}`; };
  const pol = (z, un, d = 4) => `${u(S.mod(z), un, d)} ∠${num(Math.abs(S.arg(z)) < 1e-9 ? 0 : S.arg(z) * 180 / Math.PI, 4)}°`;
  const eficaz = (z) => ({ re: z.re / Math.SQRT2, im: z.im / Math.SQRT2 });

  /* ---------- Estado de cálculo ---------- */
  let ext = null, opR = null, faR = null, trR = null, errTxt = '', errComp = null, errTr = '';
  let pestana = 'op', idx = 0, anim = true;

  function tfinAuto() {
    const els = ext.net.elementos, fr = els.filter((e) => (e.t === 'V' || e.t === 'I') && e.onda.f).map((e) => e.onda.f);
    if (fr.length) return 4 / Math.min(...fr);
    let t = 0;
    for (const e of els) if (e.t === 'V' || e.t === 'I') { const o = e.onda; if (o.tipo === 'escalon') t = Math.max(t, 2 * (o.t0 || 0)); if (o.tipo === 'pulso') t = Math.max(t, (o.td || 0) + 3 * (o.per || o.pw)); }
    for (const e of els) if (e.t === 'SW' && e.tc) t = Math.max(t, 2 * e.tc);
    const R = els.filter((e) => e.t === 'R').reduce((s, e) => s + e.R, 0) || 1, Rm = Math.min(...els.filter((e) => e.t === 'R').map((e) => e.R), Infinity);
    let tau = 0; for (const e of els) { if (e.t === 'C') tau = Math.max(tau, e.C * R); if (e.t === 'L' && isFinite(Rm)) tau = Math.max(tau, e.L / Rm); }
    return Math.max(t, 5 * tau) || 1e-3;
  }
  function calcula() {
    errTxt = ''; errComp = null; errTr = ''; opR = faR = trR = null;
    try {
      ext = ExtraerSim.extraer(sc);
      opR = S.operacion(ext.net);
      if (ext.net.elementos.some((e) => (e.t === 'V' || e.t === 'I') && e.onda.tipo === 'seno')) { try { faR = S.fasores(ext.net, opR); } catch (e) { faR = null; } }
      try {
        const tf = Herramienta.leeSI(sc.analisis.tfin || '', 1), tfin = isFinite(tf) && tf > 0 ? tf : tfinAuto();
        trR = S.transitorio(ext.net, { tfin, puntos: 1500 }); trR.tfin = tfin;
      } catch (e) { trR = null; errTr = e.message; }
      idx = 0;
    } catch (e) { errTxt = e.message; errComp = e.comp || (/^([^:\s]+):/.exec(e.message) || [])[1] || null; ext = ext && !errTxt ? ext : null; }
    guarda();
    const er = $('#error'); er.hidden = !errTxt; er.textContent = errTxt;
    ed.dibuja(); panel(); props();
    arrancaAnim();
  }
  let pend = null; const pide = () => { clearTimeout(pend); pend = setTimeout(calcula, 120); };

  /* ---------- Vista del esquema ---------- */
  const vGlobal = () => {
    const d = trR && animaTr() ? trR : null; let lo = 0, hi = 0;
    if (opR) for (const v of Object.values(opR.V)) { lo = Math.min(lo, v.re); hi = Math.max(hi, v.re); }
    if (d) for (const a of Object.values(d.V)) for (let i = 0; i < a.length; i += 8) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); }
    return [lo, hi];
  };
  const animaTr = () => trR && ext && ext.net.elementos.some((e) => ((e.t === 'V' || e.t === 'I') && ['seno', 'cuadrada', 'triangular', 'diente', 'pulso', 'escalon'].includes(e.onda.tipo)) || (e.t === 'SW' && e.tc));
  let rango = [0, 0];
  const tensionNet = (n) => { if (n === '0') return 0; if (trR && animaTr() && trR.V[n]) return trR.V[n][Math.min(idx, trR.V[n].length - 1)]; return opR && opR.V[n] ? opR.V[n].re : null; };
  function colorCable(x, y) {
    if (!ext || !opR) return null;
    let n; try { n = ext.nudoDe(x, y); } catch (e) { return null; }
    const v = tensionNet(n); if (v === null || v === undefined) return null;
    const [lo, hi] = rango, m = Math.max(Math.abs(lo), Math.abs(hi), 1e-9), p = Math.round(50 + 50 * v / m);
    return `color-mix(in srgb, var(--v-alto) ${p}%, var(--v-bajo))`;
  }
  const corrienteEl = (id) => (trR && animaTr() && trR.I[id] ? trR.I[id][Math.min(idx, trR.I[id].length - 1)] : opR && opR.I[id] ? opR.I[id].re : 0);
  let flujoCab = [], cabsUlt = [];
  // valor máximo que alcanza una corriente (combinación de las de varios elementos): con forma de onda, en todo el registro; si no, el de continua
  const picoT = (t) => { if (!(trR && animaTr())) return Math.abs(sumaT(t)); let m = 0; const n = trR.t.length, st = Math.max(1, Math.floor(n / 400)); for (let j = 0; j < n; j += st) { let x = 0; for (const [id, k] of t) x += k * (trR.I[id] ? trR.I[id][j] : 0); m = Math.max(m, Math.abs(x)); } return m; };
  const sumaT = (t) => { let x = 0; for (const [id, k] of t) x += k * corrienteEl(id); return x; };
  // corriente de cada cable como combinación de las de los componentes: [[id, coeficiente], …]
  function cablesFlujo(dots) {
    const cl = Esquema.clave, inj = new Map(), conocido = new Set(), desconocido = new Set();
    const suma = (k, id, v) => { if (!inj.has(k)) inj.set(k, new Map()); const m = inj.get(k); m.set(id, (m.get(id) || 0) + v); };
    const de2 = new Map(dots.map(([c, id]) => [c.id, id]));
    for (const c of sc.componentes) {
      const ps = Esquema.pines(c, CAT), id = de2.get(c.id);
      if (id) { suma(cl(ps[0]), id, -1); suma(cl(ps[1]), id, 1); ps.forEach((q) => conocido.add(cl(q))); }
      else if (!['GND', 'ETIQ', 'VM', 'SONDA'].includes(c.t)) ps.forEach((q) => desconocido.add(cl(q)));
    }
    const ady = new Map(); sc.cables.forEach((w, i) => { for (const [x, y] of [[w.a, w.b], [w.b, w.a]]) { const k = cl(x); if (!ady.has(k)) ady.set(k, []); ady.get(k).push([cl(y), i, y, x]); } });
    const vis = new Set(), res = [];
    for (const raiz of ady.keys()) {
      if (vis.has(raiz)) continue;
      const orden = [], padre = new Map([[raiz, null]]); vis.add(raiz); const cola = [raiz];
      while (cola.length) { const k = cola.shift(); orden.push(k); for (const [y, i, py, px] of ady.get(k)) if (!vis.has(y)) { vis.add(y); padre.set(y, [k, i, px, py]); cola.push(y); } }
      if (orden.some((k) => desconocido.has(k))) continue;
      const acum = new Map(orden.map((k) => [k, new Map(inj.get(k) || [])]));
      for (let j = orden.length - 1; j > 0; j--) {
        const k = orden[j], [pk, , pa, pb] = padre.get(k), m = acum.get(k), up = acum.get(pk);
        res.push({ a: pb, b: pa, sg: 1, t: [...m].filter(([, v]) => v), k });
        for (const [id, v] of m) up.set(id, (up.get(id) || 0) + v);
      }
    }
    return res;
  }
  function texto(c) {
    const d = CAT[c.t], m = d.mostrar ? Herramienta.txt(d.mostrar(c.v)) : '';
    if (d.medida && opR) {
      const ids = ext && ext.medidores.find((q) => q.id === c.id);
      if (ids && ids.medida !== 'P' && !(opR.U[ids.id] && opR.I[ids.id])) return '';
      if (ids && ids.medida === 'P' && !(opR.U[ids.v] && opR.I[ids.i])) return '';
      if (ids) {
        const v = (id, k) => (faR && faR[0] ? S.mod(faR[0][k][id]) / Math.SQRT2 : null), dc = (id, k) => (opR[k][id] ? opR[k][id].re : 0);
        if (ids.medida === 'V') return `${u(dc(ids.id, 'U'), 'V')}${v(ids.id, 'U') !== null ? ` · ${u(v(ids.id, 'U'), 'V')} ef.` : ''}`;
        if (ids.medida === 'I') return `${u(dc(ids.id, 'I'), 'A')}${v(ids.id, 'I') !== null ? ` · ${u(v(ids.id, 'I'), 'A')} ef.` : ''}`;
        if (ids.medida === 'P') { const P = opR.U[ids.v].re * opR.I[ids.i].re; if (faR && faR[0]) { const U = faR[0].U[ids.v], I = faR[0].I[ids.i]; return `${u(P + (U.re * I.re + U.im * I.im) / 2, 'W')}`; } return u(P, 'W'); }
      }
    }
    if (c.t === 'SONDA' && ext && ext.pinNet[c.id]) { const v = tensionNet(ext.pinNet[c.id][0]); return v === null ? '' : u(v, 'V'); }
    return m;
  }
  const claseComp = (c) => [errComp === c.id ? 'err' : '', CAT[c.t].lampara ? 'lampara' : ''].join(' ').trim();
  function extra() {
    if (!ext || !opR || errTxt) return '';
    let h = '', max = 0; const dots = [];
    for (const c of sc.componentes) {
      const ids = ext.elementosDe[c.id]; if (!ids || ids.length !== 1 || CAT[c.t].pines.length !== 2 || ['VM', 'GND', 'ETIQ'].includes(c.t)) continue;
      max = Math.max(max, picoT([[ids[0], 1]])); dots.push([c, ids[0]]);
    }
    const punto = (a, b, I0, I, attrs, n) => { let q = ''; for (let k = 0; k < n; k++) q += `<circle class="flujo" r="3" ${attrs} data-k="${k}" data-n="${n}" data-ax="${a[0] * 20}" data-ay="${a[1] * 20}" data-bx="${b[0] * 20}" data-by="${b[1] * 20}" cx="${a[0] * 20 + (b[0] - a[0]) * 20 * (k + 0.5) / n}" cy="${a[1] * 20 + (b[1] - a[1]) * 20 * (k + 0.5) / n}"/>`; return q; };
    // corriente por cada cable: en cada red se reparte la que entra y sale por las patillas de los componentes de dos patillas
    flujoCab = []; const cabs = cablesFlujo(dots);
    for (const w of cabs) { w.p = picoT(w.t); max = Math.max(max, w.p); }
    for (const [c, id] of dots) {
      const [a, b] = Esquema.pines(c, CAT), I0 = opR.I[id] ? Math.abs(opR.I[id].re) : 0, I = Math.abs(corrienteEl(id));
      if (max < 1e-15 || picoT([[id, 1]]) < max * 1e-6) continue;
      h += punto(a, b, I0, I, `data-id="${esc(id)}"`, 3);
    }
    for (const w of cabs) {
      if (max < 1e-15 || w.p < max * 1e-6) continue;
      const i = flujoCab.push(w.t) - 1, L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      h += punto(w.a, w.b, 0, 0, `data-cab="${i}" data-sg="${w.sg}"`, Math.max(1, Math.round(L / 2)));
    }
    ext.maxI = max; cabsUlt = cabs;
    return h;
  }

  /* ---------- Editor ---------- */
  const ed = Esquema.crea($('#ed'), {
    cat: CAT, estado: sc,
    cambia: () => { $('#ejemplos').value = ''; pide(); guarda(); actualizaBotones(); },
    seleccion: () => { props(); actualizaBotones(); const c = ed.seleccion.length === 1 && sc.componentes.find((q) => q.id === ed.seleccion[0]); if (pestana === 'th' && c && dosPines().includes(c)) { sc.analisis.th = { modo: 'c', comp: c.id }; panel(); } },
    clic: (c) => { const d = CAT[c.t]; if (!d.manual) return; ed.marca(); c.v.estado = c.t === 'SW' ? (c.v.estado === 'cerrado' ? 'abierto' : 'cerrado') : (c.v.estado === 'arriba' ? 'abajo' : 'arriba'); ed.dibuja(); pide(); guarda(); props(); },
    editar: () => { const i = $('#props input, #props select'); if (i) i.focus(); },
    colorCable, claseComp, texto, extra,
  });
  const orig = ed.dibuja; let ultimoRango = null;
  function redibuja() { rango = vGlobal(); ed.dibuja(); }
  // la rejilla puede cambiar los datos del estado: tras deshacer y rehacer se vuelve a calcular (cambia() ya lo hace)
  ed.estado.vista = ed.estado.vista || { x: 40, y: 40, z: 1 };
  const actualizaBotones = () => { $('#b-deshacer').disabled = !ed.hayHistorial(); $('#b-rehacer').disabled = !ed.hayRehacer(); const s = ed.seleccion.length > 0; for (const b of ['#b-girar', '#b-reflejar', '#b-copiar', '#b-borrar']) $(b).disabled = !s; };
  $('#b-deshacer').onclick = () => ed.deshaz(); $('#b-rehacer').onclick = () => ed.rehaz();
  $('#b-girar').onclick = () => ed.gira(); $('#b-reflejar').onclick = () => ed.refleja();
  $('#b-copiar').onclick = () => ed.copiar(); $('#b-pegar').onclick = () => ed.pegar(); $('#b-borrar').onclick = () => ed.borra();
  $('#b-mas').onclick = () => ed.zoom(1.25); $('#b-menos').onclick = () => ed.zoom(0.8); $('#b-ajustar').onclick = () => ed.ajustar();
  $('#b-vaciar').onclick = () => { ed.marca(); const e = ed.estado; e.componentes = []; e.cables = []; e.vista = { x: 40, y: 40, z: 1 }; ed.estado = e; sc = ed.estado; calcula(); };

  /* ---------- Medir en cualquier punto: pasa el ratón (o toca) un cable, una patilla o un componente ---------- */
  const tip = document.createElement('div'); tip.className = 'medida-tip'; tip.hidden = true; document.body.appendChild(tip);
  const vNudo = (n) => { const dc = tensionNet(n); if (dc === null || dc === undefined) return null; const f = faR && faR[0] && faR[0].V && faR[0].V[n]; return `${u(dc, 'V')}${f ? ` · ${u(S.mod(f) / Math.SQRT2, 'V')} ef.` : ''}`; };
  function lectura(t) {
    if (!ext || !opR || errTxt) return '';
    const cab = t.closest('.cable-hit'), pin = t.closest('.pin-hit'), comp = t.closest('.comp');
    if (cab || pin) {
      let x, y, w = null;
      if (cab) { w = sc.cables[+cab.dataset.w]; if (!w) return ''; [x, y] = w.a; } else { x = +pin.dataset.px; y = +pin.dataset.py; }
      let n; try { n = ext.nudoDe(x, y); } catch (e) { return ''; }
      const v = vNudo(n); let h = `<b>Nudo ${esc(n === '0' ? '0 (tierra)' : n)}</b>${v ? `<br>V = ${v}` : ''}`;
      if (w) { const c = cabsUlt.find((q) => (q.a[0] === w.a[0] && q.a[1] === w.a[1] && q.b[0] === w.b[0] && q.b[1] === w.b[1]) || (q.a[0] === w.b[0] && q.a[1] === w.b[1] && q.b[0] === w.a[0] && q.b[1] === w.a[1])); if (c) h += `<br>I por el cable = ${u(Math.abs(sumaT(c.t)), 'A')}`; }
      return h;
    }
    if (comp) {
      const c = sc.componentes.find((q) => q.id === comp.dataset.c); if (!c) return '';
      const ids = ext.elementosDe[c.id] || [], pn = ext.pinNet[c.id] || [];
      let h = `<b>${esc(CAT[c.t].nombre)} ${esc(c.id)}</b>`;
      if (ids.length === 1 && opR.U[ids[0]]) { const f = faR && faR[0]; h += `<br>V = ${u(opR.U[ids[0]].re, 'V')}${f && f.U[ids[0]] ? ` · ${u(S.mod(f.U[ids[0]]) / Math.SQRT2, 'V')} ef.` : ''}`; if (opR.I[ids[0]]) h += `<br>I = ${u(Corr(ids[0]), 'A')}${f && f.I[ids[0]] ? ` · ${u(S.mod(f.I[ids[0]]) / Math.SQRT2, 'A')} ef.` : ''}`; }
      else pn.forEach((n, i) => { const v = vNudo(n); if (v) h += `<br>patilla ${i + 1} (${esc(n)}): ${v}`; });
      return h;
    }
    return '';
  }
  const Corr = (id) => (opR.I[id] ? opR.I[id].re : 0);
  const edEl = $('#ed');
  edEl.addEventListener('pointermove', (ev) => {
    if (ev.buttons) { tip.hidden = true; return; }
    const h = lectura(ev.target); if (!h) { tip.hidden = true; return; }
    tip.innerHTML = h; tip.hidden = false; tip.style.left = Math.min(ev.clientX + 14, innerWidth - 200) + 'px'; tip.style.top = ev.clientY + 14 + 'px';
  });
  edEl.addEventListener('pointerleave', () => { tip.hidden = true; });

  /* ---------- Paleta ---------- */
  function paleta(filtro = '') {
    const q = filtro.trim().toLowerCase(); let h = '';
    let abiertas; try { abiertas = JSON.parse(localStorage.getItem('simulador-paleta')); } catch (e) { abiertas = null; }
    if (!Array.isArray(abiertas)) abiertas = ['Pasivos', 'Fuentes'];
    for (const fam of CompSim.FAMILIAS) {
      const ts = Object.entries(CAT).filter(([t, d]) => d.fam === fam && (!q || d.nombre.toLowerCase().includes(q) || t.toLowerCase().includes(q)));
      if (!ts.length) continue;
      h += `<details class="fam" data-fam="${fam}"${q || abiertas.includes(fam) ? ' open' : ''}><summary>${fam} <small>${ts.length}</small></summary><div class="paleta">` + ts.map(([t, d]) => {
        const c = { t, id: '', x: 0, y: 0, rot: 0, v: CompSim.vacio(t) };
        return `<button type="button" data-t="${t}" title="${esc(d.nombre)}"><svg viewBox="-8 -${d.alto * 20 + 4} ${d.ancho * 20 + 16} ${d.alto * 40 + 8}" aria-hidden="true">${d.dib(c)}</svg><span>${esc(d.nombre.replace(/^(Fuente de|Transistor|Puerta|Amplificador operacional|MOSFET de canal) /, (m) => m))}</span></button>`;
      }).join('') + '</div></details>';
    }
    $('#paleta').innerHTML = h || '<p class="nota">No hay ningún componente con ese nombre.</p>';
  }
  paleta(); ed.paleta($('#paleta'));
  $('#paleta').addEventListener('toggle', (e) => { // recuerda qué pestañas están abiertas (con búsqueda se abren todas y no se guarda)
    if ($('#buscar').value.trim() || !e.target.dataset.fam) return;
    const ab = [...document.querySelectorAll('#paleta details[open]')].map((d) => d.dataset.fam);
    try { localStorage.setItem('simulador-paleta', JSON.stringify(ab)); } catch (er) { /* sin almacenamiento */ }
  }, true);
  $('#buscar').addEventListener('input', (e) => paleta(e.target.value));

  /* ---------- Propiedades ---------- */
  function props() {
    const ids = ed.seleccion, box = $('#props');
    if (ids.length !== 1) {
      box.innerHTML = ids.length ? `<p class="vacio">${ids.length} componentes seleccionados. R los gira, F los refleja y Supr los borra.</p>` : `<p class="vacio">Pulsa un componente para ver y cambiar sus valores. El esquema tiene ${sc.componentes.length} componentes y ${sc.cables.length} cables.</p>`;
      return;
    }
    const c = ed.comp(ids[0]), d = CAT[c.t]; if (!c) return;
    let h = `<p><b>${esc(d.nombre)}</b></p><div class="campos"><label for="p-id">Nombre</label><input id="p-id" class="in" value="${esc(c.id)}" data-id="1">`;
    for (const f of d.campos) {
      if (f.si && !f.si(c.v)) continue;
      h += `<label for="p-${f.k}">${esc(f.nom)}${f.un ? ` <small>(${esc(f.un)})</small>` : ''}</label>`;
      h += f.op ? `<select id="p-${f.k}" class="in" data-k="${f.k}">${f.op.map((o) => `<option${o === c.v[f.k] ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input id="p-${f.k}" class="in" data-k="${f.k}" value="${esc(c.v[f.k] ?? '')}" inputmode="decimal" autocomplete="off">`;
    }
    h += '</div>';
    if (ext && opR && !errTxt) {
      const e0 = ext.elementosDe[c.id] || [];
      if (e0.length === 1 && opR.I[e0[0]]) { const id = e0[0]; h += `<div class="res" style="margin-top:12px"><div><span>Tensión</span><b>${u(opR.U[id].re, 'V')}</b></div><div><span>Corriente</span><b>${u(opR.I[id].re, 'A')}</b></div><div><span>Potencia</span><b>${u(opR.P[id].re, 'W')}</b></div></div>`; }
    }
    box.innerHTML = h;
  }
  $('#props').addEventListener('change', (e) => {
    const t = e.target, c = ed.comp(ed.seleccion[0]); if (!c) return;
    if (t.dataset.id) {
      const nuevo = t.value.trim();
      if (!nuevo || sc.componentes.some((q) => q !== c && q.id === nuevo)) { t.value = c.id; return; }
      ed.marca(); const viejo = c.id; c.id = nuevo; for (const q of sc.componentes) if (q.v && q.v.ctrl === viejo) q.v.ctrl = nuevo;
      ed.selecciona([nuevo]); pide(); guarda(); return;
    }
    if (!t.dataset.k) return;
    ed.marca(); c.v[t.dataset.k] = t.value; ed.dibuja(); pide(); guarda();
    if (t.tagName === 'SELECT') props();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + EjemplosSim.lista.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = EjemplosSim.lista.find((x) => x.clave === clave); if (!e) return;
    sc = copia(e.sc); ed.estado = sc; ed.ajustar(); sc = ed.estado; calcula(); sel.value = clave;
  }

  /* ---------- Resultados ---------- */
  const colores = () => { const cs = getComputedStyle(document.documentElement), o = {}; for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--canal-1', '--canal-2', '--canal-3', '--canal-4']) o[k] = cs.getPropertyValue(k).trim(); return o; };
  const tabla = (cab, filas) => `<div class="tabla-scroll"><table class="tabla-res"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const sinDatos = () => `<p class="nota">${errTxt ? 'Arregla el aviso de arriba para ver los resultados.' : 'Dibuja un circuito con una tierra para ver los resultados.'}</p>`;

  function rOp() {
    if (!opR) return sinDatos();
    const filas = ext.net.elementos.filter((e) => e.t !== 'K').map((e) => { const p = opR.P[e.id].re; return [esc(e.id), u(opR.U[e.id].re, 'V'), u(opR.I[e.id].re, 'A'), u(p, 'W'), p < -1e-12 ? 'entrega' : p > 1e-12 ? 'consume' : '—']; });
    const nudos = Object.entries(opR.V).filter(([n]) => !n.includes('~')).map(([n, v]) => [esc(n), u(v.re, 'V')]);
    const ac = faR ? '<p class="nota">Hay fuentes de alterna: aquí se ve la parte de continua (la componente media, con condensadores abiertos y bobinas en cortocircuito). La alterna está en Fasores y en Osciloscopio.</p>' : '';
    const tiles = Object.entries(opR.V).filter(([n]) => !n.includes('~')).map(([n, v]) => `<div class="num"><span>Tensión del nudo ${esc(n)}</span><b>${u(v.re, 'V')}</b></div>`).join('');
    return `${ac}<div class="resumen" id="resumen">${tiles}<div class="ancho"><span>Balance de potencias (debe ser 0)</span><b>${u(opR.balance, 'W')}</b></div></div>
      <h3 style="font:600 13px var(--f-ui);margin:14px 0 4px">Tensión de cada nudo (respecto a tierra)</h3>${tabla(['Nudo', 'Tensión'], [['0 (tierra)', '0 V'], ...nudos])}
      <h3 style="font:600 13px var(--f-ui);margin:14px 0 4px">Cada elemento (la corriente va de la patilla 1 a la 2; potencia absorbida)</h3>${tabla(['Elemento', 'Tensión', 'Corriente', 'Potencia', ''], filas)}`;
  }

  function rTr() {
    const cfg = `<div class="param"><label for="tfin">Tiempo simulado <small>(s)</small></label><input id="tfin" class="in" placeholder="auto: ${trR ? num(trR.tfin) : ''}" value="${esc(sc.analisis.tfin || '')}"><label for="extraI">Añadir corriente de</label><select id="extraI" class="in"><option value="">—</option>${ext ? ext.net.elementos.filter((e) => e.t !== 'K').map((e) => `<option${sc.analisis.extraI === e.id ? ' selected' : ''}>${esc(e.id)}</option>`).join('') : ''}</select></div>`;
    if (!ext || errTxt) return cfg + sinDatos();
    if (!trR) return cfg + `<p class="error">${esc(errTr || 'No se pudo simular en el tiempo.')}</p>`;
    return `${cfg}<canvas id="osc" aria-label="Osciloscopio: tensiones de las sondas en función del tiempo"></canvas><p class="leyenda" id="osc-ley"></p>`;
  }
  function series() {
    if (!trR) return [];
    const out = [];
    const sondas = ext.sondas.length ? ext.sondas : Object.keys(trR.V).filter((n) => !n.includes('~')).slice(0, 4).map((n, i) => ({ id: n, net: n, canal: i + 1 }));
    for (const s of sondas) { const y = s.net === '0' ? trR.t.map(() => 0) : trR.V[s.net]; if (y) out.push({ nom: ext.sondas.length ? `${s.id} (${s.net})` : `V ${s.net}`, y, un: 'V', canal: s.canal }); }
    if (sc.analisis.extraI && trR.I[sc.analisis.extraI]) out.push({ nom: `I ${sc.analisis.extraI}`, y: trR.I[sc.analisis.extraI], un: 'A', canal: 5 });
    return out;
  }
  let cursor = null;
  function dibujaOsc() {
    const c = $('#osc'); if (!c || !trR) return;
    const { g, w, h } = lienzo(c), col = colores(), se = series(); if (!w || !h || !se.length) return;
    const t = trR.t, T = t[t.length - 1], ml = 62, mr = 14, mt = 14, mb = 30;
    const grupos = [...new Set(se.map((s) => s.un))];
    const ejes = grupos.map((un) => { const ys = se.filter((s) => s.un === un).flatMap((s) => s.y); let lo = Math.min(...ys), hi = Math.max(...ys); if (hi - lo < 1e-12) { lo -= 1; hi += 1; } const p = (hi - lo) * 0.08; return { un, lo: lo - p, hi: hi + p }; });
    const eje = (un) => ejes.find((e) => e.un === un), X = (x) => ml + (x / T) * (w - ml - mr), Y = (y, e) => h - mb - ((y - e.lo) / (e.hi - e.lo)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'middle';
    const e0 = ejes[0];
    for (const v of marcas(e0.lo, e0.hi, 6)) { g.beginPath(); g.moveTo(ml, Y(v, e0)); g.lineTo(w - mr, Y(v, e0)); g.stroke(); g.fillText(Herramienta.txt(num(v, 3)), ml - 6, Y(v, e0)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(0, T, 6)) { g.fillText(u(v, 's', 3), X(v), h - mb + 6); }
    g.fillText(`${e0.un}`, ml - 20, mt - 12);
    if (e0.lo < 0 && e0.hi > 0) { g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(ml, Y(0, e0)); g.lineTo(w - mr, Y(0, e0)); g.stroke(); }
    se.forEach((s) => { const e = eje(s.un); g.strokeStyle = s.canal > 4 ? col['--accent'] : col[`--canal-${s.canal}`]; g.lineWidth = 2; g.beginPath(); s.y.forEach((y, i) => { const px = X(t[i]), py = Y(y, e); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); });
    g.strokeStyle = col['--ink']; g.lineWidth = 1; g.setLineDash([4, 3]); g.beginPath(); const xi = X(t[Math.min(idx, t.length - 1)]); g.moveTo(xi, mt); g.lineTo(xi, h - mb); g.stroke(); g.setLineDash([]);
    if (cursor !== null) { g.strokeStyle = col['--accent']; g.beginPath(); g.moveTo(X(cursor), mt); g.lineTo(X(cursor), h - mb); g.stroke(); }
    const k = cursor === null ? Math.min(idx, t.length - 1) : Math.max(0, t.findIndex((q) => q >= cursor));
    $('#osc-ley').innerHTML = `<b>t = ${u(t[k], 's')}</b>` + se.map((s) => `<i class="${s.canal > 4 ? '' : 'c' + s.canal}"></i>${esc(s.nom)} = <b>${u(s.y[k], s.un)}</b>`).join('');
    c.dataset.ml = ml; c.dataset.mr = mr; c.dataset.T = T;
  }

  function rFa() {
    if (!ext || errTxt) return sinDatos();
    if (!faR || !faR.length) return '<p class="nota">No hay fuentes de alterna. Pon una fuente de tensión con forma de onda «seno» para ver los fasores, o usa el osciloscopio para otras formas de onda.</p>';
    const f = faR[Math.min(sc.analisis.fi || 0, faR.length - 1)], els = ext.net.elementos.filter((e) => e.t !== 'K');
    const cab = faR.length > 1 ? `<div class="param"><label for="fsel">Frecuencia</label><select id="fsel" class="in">${faR.map((q, i) => `<option value="${i}"${q === f ? ' selected' : ''}>${u(q.f, 'Hz')}</option>`).join('')}</select></div>` : '';
    let P = 0, Q = 0;
    const filas = els.map((e) => {
      const U = eficaz(f.U[e.id]), I = eficaz(f.I[e.id]), Sx = f.P[e.id], p = Sx.re, q = Sx.im; P += p; Q += q;
      const s = Math.hypot(p, q); return [esc(e.id), pol(U, 'V'), pol(I, 'A'), u(p, 'W'), u(q, 'var'), s > 1e-12 ? num(Math.abs(p) / s, 3) : '—'];
    });
    const dia = `<div class="param"><label for="fdia">Diagrama fasorial de</label><select id="fdia" class="in">${els.map((e) => `<option${sc.analisis.fdia === e.id ? ' selected' : ''}>${esc(e.id)}</option>`).join('')}</select></div><canvas id="fas" aria-label="Diagrama fasorial de la tensión y la corriente del elemento elegido"></canvas><p class="leyenda" id="fas-ley"></p>`;
    return `${cab}<p class="nota">Valores eficaces. Frecuencia ${u(f.f, 'Hz')}, ω = ${num(f.w)} rad/s. Las fases se miden con referencia seno. La potencia es la absorbida (negativa: la entrega).</p><div class="resumen"><div><span>Suma de P</span><b>${u(P, 'W')}</b></div><div><span>Suma de Q</span><b>${u(Q, 'var')}</b></div></div>${tabla(['Elemento', 'Tensión', 'Corriente', 'P', 'Q', 'cos φ'], filas)}${dia}`;
  }
  function dibujaFas() {
    const c = $('#fas'); if (!c || !faR || !faR.length) return;
    const f = faR[Math.min(sc.analisis.fi || 0, faR.length - 1)], id = $('#fdia').value, U = eficaz(f.U[id]), I = eficaz(f.I[id]);
    const { g, w, h } = lienzo(c), col = colores(); if (!w || !h) return;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 24, mu = S.mod(U), mi = S.mod(I), m = Math.max(mu, mi, 1e-30);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    const flecha = (z, mm, color, nom) => { const L = (mm / m) * R, a = Math.atan2(z.im, z.re), x = cx + L * Math.cos(a), y = cy - L * Math.sin(a); g.strokeStyle = g.fillStyle = color; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10 * Math.cos(a - 0.4), y + 10 * Math.sin(a - 0.4)); g.lineTo(x - 10 * Math.cos(a + 0.4), y + 10 * Math.sin(a + 0.4)); g.closePath(); g.fill(); g.font = '600 13px system-ui'; g.textAlign = 'center'; g.fillText(nom, x + 14 * Math.cos(a), y - 14 * Math.sin(a)); };
    if (mu > 0) flecha(U, mu, col['--canal-1'], 'U'); if (mi > 0) flecha(I, mi, col['--canal-2'], 'I');
    const dfi = (S.arg(U) - S.arg(I)) * 180 / Math.PI;
    $('#fas-ley').innerHTML = `<i class="c1"></i><b>U</b> = ${pol(U, 'V')}<i class="c2"></i><b>I</b> = ${pol(I, 'A')} · φ = <b>${num(((dfi + 540) % 360) - 180, 4)}°</b> (tensión adelantada si es positivo)`;
  }

  function rBo() {
    if (!ext || errTxt) return sinDatos();
    const fuentes = ext.net.elementos.filter((e) => e.t === 'V' || e.t === 'I'), nets = [...new Set(Object.keys(opR.V))].filter((n) => !n.includes('~'));
    if (!fuentes.length) return '<p class="nota">Pon una fuente para calcular la respuesta en frecuencia.</p>';
    const b = sc.analisis.bode || {}, fu = b.fuente && fuentes.find((e) => e.id === b.fuente) ? b.fuente : fuentes[0].id, sa = b.salida && nets.includes(b.salida) ? b.salida : nets[nets.length - 1];
    sc.analisis.bode = { ...b, fuente: fu, salida: sa };
    return `<div class="param"><label for="bf">Fuente de entrada</label><select id="bf" class="in">${fuentes.map((e) => `<option${e.id === fu ? ' selected' : ''}>${esc(e.id)}</option>`).join('')}</select><label for="bs">Salida (nudo)</label><select id="bs" class="in">${nets.map((n) => `<option${n === sa ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select><label for="bmin">de</label><input id="bmin" class="in" value="${esc(b.fmin || '1')}"><label for="bmax">a <small>(Hz)</small></label><input id="bmax" class="in" value="${esc(b.fmax || '1M')}"></div><canvas id="bode" aria-label="Diagrama de Bode: ganancia en decibelios y fase en función de la frecuencia"></canvas><p class="leyenda" id="bode-ley"></p>`;
  }
  let bodeR = null;
  function dibujaBode() {
    const c = $('#bode'); if (!c || !ext) return;
    const b = sc.analisis.bode, fmin = Herramienta.leeSI(b.fmin || '1', 1), fmax = Herramienta.leeSI(b.fmax || '1M', 1);
    try { if (!(fmin > 0 && fmax > fmin)) throw new Error('El rango de frecuencias no es válido'); bodeR = S.barrido(ext.net, { fuente: b.fuente, a: b.salida, b: '0', fmin, fmax, puntos: 240 }); } catch (e) { bodeR = null; $('#bode-ley').textContent = e.message; lienzo(c); return; }
    const { g, w, h } = lienzo(c), col = colores(); if (!w || !h) return;
    const ml = 56, mr = 14, h2 = (h - 40) / 2, X = (f) => ml + (Math.log10(f / fmin) / Math.log10(fmax / fmin)) * (w - ml - mr);
    const dBs = bodeR.dB, lo = Math.min(...dBs), hi = Math.max(...dBs), pad = Math.max((hi - lo) * 0.1, 3);
    const trazo = (y, y0, alto, a, bb, color, fmt) => {
      g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.font = '11px system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.lineWidth = 1;
      for (const v of marcas(a, bb, 5)) { const py = y0 + alto - ((v - a) / (bb - a)) * alto; g.beginPath(); g.moveTo(ml, py); g.lineTo(w - mr, py); g.stroke(); g.fillText(fmt(v), ml - 5, py); }
      g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); y.forEach((v, i) => { const px = X(bodeR.f[i]), py = y0 + alto - ((v - a) / (bb - a)) * alto; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
    };
    trazo(dBs, 8, h2 - 14, lo - pad, hi + pad, col['--canal-1'], (v) => num(v, 3));
    trazo(bodeR.fase, 8 + h2 + 6, h2 - 14, -180, 180, col['--canal-2'], (v) => num(v, 3) + '°');
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (let d = Math.ceil(Math.log10(fmin)); d <= Math.floor(Math.log10(fmax)); d++) { const px = X(10 ** d); g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(px, 8); g.lineTo(px, h - 34); g.stroke(); g.fillText(u(10 ** d, 'Hz', 1), px, h - 28); }
    const i3 = dBs.findIndex((v, i) => i > 0 && (dBs[0] - v) >= 3), pico = dBs.indexOf(hi);
    $('#bode-ley').innerHTML = `<i class="c1"></i>Ganancia (dB) <i class="c2"></i>Fase · máximo ${num(hi, 4)} dB en ${u(bodeR.f[pico], 'Hz')}${i3 > 0 ? ` · −3 dB respecto al principio en ${u(bodeR.f[i3], 'Hz')}` : ''}`;
  }

  /* ---------- Desarrollo paso a paso (cuando el circuito encaja en Continua o Alterna) ---------- */
  function rDe() {
    if (!ext || errTxt) return sinDatos();
    const els = ext.net.elementos, nombresOK = els.every((e) => (e.p || []).every((n) => /^[\wÀ-ÿ]{1,8}$/.test(n)));
    const f = Continua.f;
    const fuentes = els.filter((e) => e.t === 'V' || e.t === 'I'), soloCC = fuentes.every((e) => e.onda.tipo === 'cc');
    const tipos = new Set(els.map((e) => e.t));
    const letras = { R: 'R', V: 'E', I: 'J', C: 'C', L: 'L', VV: 'Ed', VI: 'Ed', IV: 'Jd', II: 'Jd' };
    if (nombresOK && soloCC && [...tipos].every((t) => letras[t])) {
      const cont = {}, nom = {};
      const elementos = els.map((e) => { const l = letras[e.t]; cont[l] = (cont[l] || 0) + 1; nom[e.id] = `${l}${cont[l]}`; return e; }).map((e) => {
        const o = { t: e.t, a: e.p[0], b: e.p[1], v: String(e.t === 'R' ? e.R : e.t === 'C' ? e.C / 1e-6 : e.t === 'L' ? e.L / 1e-3 : e.t === 'V' || e.t === 'I' ? e.onda.v : e.k ?? e.r ?? e.g ?? e.beta) };
        if (e.t === 'VV' || e.t === 'IV') { o.c = e.p[2]; o.d = e.p[3]; }
        if (e.t === 'VI' || e.t === 'II') o.x = nom[e.ctrl];
        return o;
      });
      if (elementos.some((o) => o.t === 'VI' || o.t === 'II') && elementos.some((o) => (o.t === 'VI' || o.t === 'II') && !o.x)) return '<p class="nota">El desarrollo paso a paso necesita que las fuentes controladas por corriente se refieran a un elemento anterior en la lista.</p>';
      try { const r = Continua.resolver({ elementos, carga: '' }); return `<p class="nota">Circuito de corriente continua resuelto por el método de los nudos. Los elementos se numeran por orden de colocación: ${els.map((e) => `${esc(e.id)} = ${nom[e.id]}`).join(', ')}.</p><div class="pasos"><ol>${r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('')}</ol></div>`; } catch (e) { return `<p class="nota">${esc(e.message)}</p>`; }
    }
    const fr = [...new Set(fuentes.map((e) => (e.onda.tipo === 'seno' ? e.onda.f : null)))];
    if (nombresOK && fuentes.length && fr.length === 1 && fr[0] && fuentes.every((e) => e.t === 'V' && e.onda.tipo === 'seno' && !e.onda.off) && els.every((e) => 'VRLC'.includes(e.t))) {
      const cont = {}; const elementos = els.map((e) => ({ t: e.t, a: e.p[0], b: e.p[1], v: String(e.t === 'R' ? e.R : e.t === 'C' ? e.C / 1e-6 : e.t === 'L' ? e.L / 1e-3 : (e.onda.eficaz ? e.onda.A : e.onda.A / Math.SQRT2)), fase: e.t === 'V' ? String(e.onda.fase || 0) : '0' }));
      try { const r = Alterna.red({ f: String(fr[0]), elementos }); return `<p class="nota">Circuito de alterna a ${u(fr[0], 'Hz')} resuelto con impedancias complejas por el método de los nudos (valores eficaces).</p><div class="pasos"><ol>${r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('')}</ol></div>`; } catch (e) { return `<p class="nota">${esc(e.message)}</p>`; }
    }
    return `<p class="nota">Este circuito no tiene desarrollo paso a paso porque ${!soloCC && !fr[0] ? 'las fuentes no son solo de continua ni solo de un seno de una frecuencia' : 'tiene elementos que no se resuelven a mano (semiconductores, transformadores, interruptores, lógica…) o nudos con nombres largos'}. Se resuelve numéricamente con el análisis nodal modificado: mira la pestaña Continua para el resultado de cada nudo y elemento.</p>`;
  }

  /* ---------- Thévenin y Norton: se abre el circuito por un componente (o entre dos nudos) ---------- */
  const dosPines = () => sc.componentes.filter((c) => { const ids = ext && ext.elementosDe[c.id]; return ids && ids.length === 1 && CAT[c.t].pines.length === 2 && !['GND', 'ETIQ', 'VM', 'AM', 'SW'].includes(c.t) && !CAT[c.t].sonda; });
  const dibujoTh = (norton, a, b, V, R) => {
    const l = (d) => `<path d="${d}"/>`;
    const fuente = norton ? `<circle cx="70" cy="60" r="16"/>${l('M70 70V50M64 56L70 50L76 56')}` : `<circle cx="40" cy="60" r="16"/>${l('M40 52V58M37 55H43M37 66H43')}`;
    const r = (x, y, v) => (v ? `<rect x="${x}" y="${y}" width="40" height="14"/>` : `<rect x="${x}" y="${y}" width="14" height="40"/>`);
    const cuerpo = norton
      ? `${l('M70 44V20H130M70 76V100H130')}${fuente}${l('M100 20V34M100 86V100')}<rect x="93" y="34" width="14" height="52"/>${l('M130 20H170M130 100H170')}`
      : `${l('M40 44V20H70')}${r(70, 13, true)}${l('M110 20H170M40 76V100H170')}${fuente}`;
    return `<svg class="eq-th" viewBox="0 0 200 120" role="img" aria-label="Circuito equivalente de ${norton ? 'Norton' : 'Thévenin'}">${cuerpo}<circle cx="170" cy="20" r="4"/><circle cx="170" cy="100" r="4"/><text x="178" y="24">${esc(a)}</text><text x="178" y="104">${esc(b)}</text><text class="v" x="${norton ? 12 : 4}" y="64">${V}</text><text class="v" x="${norton ? 112 : 70}" y="${norton ? 64 : 48}">${R}</text></svg>`;
  };
  function rTh() {
    if (!ext || errTxt) return sinDatos();
    const cands = dosPines(), nets = Object.keys(opR.V).filter((n) => !n.includes('~')).concat(Object.keys(opR.V).includes('0') ? [] : ['0']);
    if (!cands.length && nets.length < 2) return '<p class="nota">Dibuja un circuito con al menos un componente de dos patillas para abrirlo y calcular su equivalente.</p>';
    const th = sc.analisis.th || {}, modo = th.modo === 'n' || !cands.length ? 'n' : 'c', comp = cands.find((c) => c.id === th.comp) || cands[cands.length - 1];
    const sel = modo === 'c' ? `c:${comp.id}` : 'n';
    const nA = nets.includes(th.a) ? th.a : nets.find((n) => n !== '0') || nets[0], nB = nets.includes(th.b) ? th.b : '0';
    const cab = `<div class="param"><label for="th-m">Abrir el circuito quitando</label><select id="th-m" class="in">${cands.map((c) => `<option value="c:${esc(c.id)}"${sel === `c:${c.id}` ? ' selected' : ''}>${esc(c.id)} · ${esc(CAT[c.t].nombre)}</option>`).join('')}<option value="n"${sel === 'n' ? ' selected' : ''}>Entre dos nudos…</option></select>${modo === 'n' ? `<label for="th-a">Terminales</label><select id="th-a" class="in">${nets.map((n) => `<option${n === nA ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select><select id="th-b" class="in" aria-label="Segundo terminal">${nets.map((n) => `<option${n === nB ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>` : ''}</div>`;
    let quitar = [], a, b;
    if (modo === 'c') { quitar = ext.elementosDe[comp.id]; [a, b] = ext.pinNet[comp.id]; } else { a = nA; b = nB; }
    if (a === b) return `${cab}<p class="nota">Los dos terminales son el mismo nudo: elige otros.</p>`;
    const base = ext.net.elementos.filter((e) => !quitar.includes(e.id));
    const apaga = (e) => (e.t === 'V' || e.t === 'I' ? { ...e, onda: { tipo: 'cc', v: 0 } } : e);
    const prueba = (onda) => ({ id: 'PRUEBA', t: 'I', p: [b, a], onda });
    const V = (r, n) => (n === '0' || !r.V[n] ? { re: 0, im: 0 } : r.V[n]);
    let h = cab, t;
    try {
      const abierto = { ...ext.net, elementos: base }, op1 = S.operacion(abierto), vth = V(op1, a).re - V(op1, b).re;
      const op2 = S.operacion({ ...ext.net, elementos: [...base.map(apaga), prueba({ tipo: 'cc', v: 1 })] }), rth = V(op2, a).re - V(op2, b).re;
      const cortoC = rth !== 0 ? vth / rth : null;
      t = `<h3>Corriente continua</h3><div class="resumen"><div><span>V<sub>Th</sub> = V<sub>abierto</sub></span><b>${u(vth, 'V')}</b></div><div><span>R<sub>Th</sub> = R<sub>N</sub></span><b>${u(rth, 'Ω')}</b></div><div><span>I<sub>N</sub> = V<sub>Th</sub> / R<sub>Th</sub></span><b>${cortoC === null ? '—' : u(cortoC, 'A')}</b></div></div>`;
      t += `<div class="eqs">${dibujoTh(false, a, b, u(vth, 'V'), u(rth, 'Ω'))}${dibujoTh(true, a, b, cortoC === null ? '—' : u(cortoC, 'A'), u(rth, 'Ω'))}</div><p class="nota">Terminales ${esc(a)} (positivo) y ${esc(b)}. V<sub>Th</sub> es la tensión entre los terminales con el circuito abierto, R<sub>Th</sub> la resistencia que se ve desde ellos con las fuentes de tensión en cortocircuito y las de corriente abiertas, e I<sub>N</sub> la corriente de cortocircuito entre ${esc(a)} y ${esc(b)}.</p>`;
      if (modo === 'c') { const Rc = ext.net.elementos.find((e) => e.id === quitar[0]); if (Rc && Rc.t === 'R' && isFinite(rth) && rth + Rc.R !== 0) t += `<p class="nota">Con ${esc(comp.id)} = ${u(Rc.R, 'Ω')} conectada de nuevo: I = V<sub>Th</sub> / (R<sub>Th</sub> + ${esc(comp.id)}) = <b>${u(vth / (rth + Rc.R), 'A')}</b> y V = <b>${u(vth * Rc.R / (rth + Rc.R), 'V')}</b>.</p>`; }
      if (faR && faR.length) {
        const filas = faR.map((q) => {
          const fa = S.fasores(abierto).find((x) => Math.abs(x.f - q.f) < 1e-9 * q.f) || null;
          const pr = S.fasores({ ...ext.net, elementos: [...base.map(apaga), prueba({ tipo: 'seno', A: 1, f: q.f, fase: 0 })] })[0];
          if (!fa || !pr) return null;
          const vf = { re: V(fa, a).re - V(fa, b).re, im: V(fa, a).im - V(fa, b).im }, zf = { re: V(pr, a).re - V(pr, b).re, im: V(pr, a).im - V(pr, b).im }, den = zf.re * zf.re + zf.im * zf.im;
          const inn = den > 0 ? { re: (vf.re * zf.re + vf.im * zf.im) / den, im: (vf.im * zf.re - vf.re * zf.im) / den } : null;
          return [u(q.f, 'Hz'), pol(eficaz(vf), 'V'), pol(zf, 'Ω'), inn ? pol(eficaz(inn), 'A') : '—'];
        }).filter(Boolean);
        if (filas.length) t += `<h3>Corriente alterna</h3>${tabla(['Frecuencia', 'V<sub>Th</sub> (eficaz)', 'Z<sub>Th</sub>', 'I<sub>N</sub> (eficaz)'], filas)}<p class="nota">Con las fuentes de alterna cada frecuencia se trata por separado; Z<sub>Th</sub> es la impedancia vista desde los terminales y las fases tienen referencia seno.</p>`;
      }
    } catch (e) { t = `<p class="nota">No se pudo calcular el equivalente: ${esc(e.message)}</p>`; }
    return h + t;
  }

  /* ---------- Pestañas ---------- */
  const TABS = { op: rOp, tr: rTr, fa: rFa, bo: rBo, th: rTh, de: rDe };
  function panel() {
    for (const k of Object.keys(TABS)) $(`#tab-${k}`).setAttribute('aria-selected', String(k === pestana));
    $('#panel').innerHTML = TABS[pestana]();
    dibujaOsc(); dibujaFas(); dibujaBode();
  }
  $('#modos').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; pestana = b.id.slice(4); panel(); });
  $('#panel').addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'tfin') { sc.analisis.tfin = t.value; guarda(); calcula(); }
    else if (t.id === 'extraI') { sc.analisis.extraI = t.value; guarda(); panel(); }
    else if (['th-m', 'th-a', 'th-b'].includes(t.id)) { const m = $('#th-m').value; sc.analisis.th = m === 'n' ? { modo: 'n', a: $('#th-a') ? $('#th-a').value : '', b: $('#th-b') ? $('#th-b').value : '' } : { modo: 'c', comp: m.slice(2) }; guarda(); panel(); }
    else if (t.id === 'fsel') { sc.analisis.fi = +t.value; panel(); }
    else if (t.id === 'fdia') { sc.analisis.fdia = t.value; dibujaFas(); }
    else if (['bf', 'bs', 'bmin', 'bmax'].includes(t.id)) { sc.analisis.bode = { ...sc.analisis.bode, fuente: $('#bf').value, salida: $('#bs').value, fmin: $('#bmin').value, fmax: $('#bmax').value }; guarda(); dibujaBode(); }
  });
  $('#panel').addEventListener('pointermove', (e) => { const c = e.target.closest('#osc'); if (!c || !trR) return; const r = c.getBoundingClientRect(), ml = +c.dataset.ml, mr = +c.dataset.mr, T = +c.dataset.T; cursor = Math.min(T, Math.max(0, (e.clientX - r.left - ml) / (r.width - ml - mr) * T)); dibujaOsc(); });
  $('#panel').addEventListener('pointerleave', () => { if (cursor !== null) { cursor = null; dibujaOsc(); } }, true);

  /* ---------- Animación: corriente que fluye y tensiones que cambian ---------- */
  let raf = 0, fase = 0, t0 = 0, ult = 0;
  const PERIODO = 6000;
  function paso(ahora) {
    raf = requestAnimationFrame(paso);
    const dt = Math.min(0.1, (ahora - ult) / 1000); ult = ahora;
    const nA = animaTr() && trR ? trR.t.length : 0;
    if (nA) { const k = Math.floor(((ahora - t0) % PERIODO) / PERIODO * nA); if (k !== idx) { idx = k; refresca(); } }
    fase = (fase + dt * 0.6) % 1;
    const dots = document.querySelectorAll('#ed .flujo'), max = ext && ext.maxI || 1;
    for (const d of dots) {
      const i = d.dataset.cab !== undefined ? sumaT(flujoCab[+d.dataset.cab] || []) : corrienteEl(d.dataset.id), s = Math.sign(i) * Math.min(1, Math.abs(i) / max) ** 0.5;
      const k = +d.dataset.k, uu = (((s >= 0 ? fase : 1 - fase) + k / (+d.dataset.n || 3)) % 1 + 1) % 1, ax = +d.dataset.ax, ay = +d.dataset.ay;
      d.setAttribute('cx', ax + (+d.dataset.bx - ax) * uu); d.setAttribute('cy', ay + (+d.dataset.by - ay) * uu);
      d.setAttribute('opacity', Math.abs(s) < 0.02 || (d.dataset.id !== undefined && uu > 0.26 && uu < 0.74) ? 0 : 0.5 + 0.5 * Math.abs(s));
    }
  }
  function refresca() { // actualiza los colores de los cables y las lecturas sin rehacer el esquema
    const cables = document.querySelectorAll('#ed .cable[data-w]');
    cables.forEach((p) => { const w = sc.cables[+p.dataset.w]; if (!w) return; const col = colorCable(w.a[0], w.a[1]); if (col) p.style.stroke = col; });
    if (pestana === 'tr') dibujaOsc();
  }
  function arrancaAnim() {
    cancelAnimationFrame(raf); raf = 0; rango = vGlobal();
    if (!anim || RED || !opR || errTxt) { ed.dibuja(); return; }
    ed.dibuja(); t0 = performance.now(); ult = t0; raf = requestAnimationFrame(paso);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (anim && !RED && opR && !raf) { ult = performance.now(); raf = requestAnimationFrame(paso); } });
  const bAnim = $('#b-anim');
  if (bAnim) bAnim.onclick = () => { anim = !anim; bAnim.setAttribute('aria-pressed', String(anim)); bAnim.textContent = anim ? '⏸ Animación' : '▶ Animación'; arrancaAnim(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { panel(); });
  window.addEventListener('resize', () => { dibujaOsc(); dibujaFas(); dibujaBode(); });
  new MutationObserver(() => panel()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- Arranque ---------- */
  const verEl = $('#ver'); if (verEl) verEl.textContent = Version.de('simulador').current;
  ed.estado = sc;
  if (!sc.vista || sc.vista === null) ed.ajustar(); else ed.dibuja();
  sc = ed.estado; calcula(); actualizaBotones();
  window.SimuladorApp = {
    abrirEjemplo, estado: () => copia(sc), resultado: () => ({ op: opR, fa: faR, tr: trR, err: errTxt }),
    // para el modo práctica: elige un ejemplo al azar
    azar: () => {
      const e = ['divisor', 'wheatstone', 'inversor'][Math.floor(Math.random() * 3)], R = ['1k', '2k', '3k', '4k7', '10k', '22k', '470'];
      abrirEjemplo(e); pestana = 'op';
      for (const c of sc.componentes) if (c.t === 'R') c.v.R = R[Math.floor(Math.random() * R.length)];
      for (const c of sc.componentes) if (c.t === 'V') c.v.v = String(2 + Math.floor(Math.random() * 14));
      ed.estado = sc; sc = ed.estado; calcula(); return e;
    },
    enunciado: () => `Calcula la tensión de cada nudo del circuito «${esc(EjemplosSim.lista.find((q) => q.clave === sel.value)?.nombre || 'del esquema')}», con los valores que ves en el esquema.`,
    ed,
  };
})();
