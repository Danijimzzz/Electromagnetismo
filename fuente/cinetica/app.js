/* =====================================================================
   Cinética química: interfaz (cuatro modos: leyes integradas, orden a
   partir de datos, velocidades iniciales y Arrhenius; un vaso en el que
   las moléculas de A se van convirtiendo en producto con el tiempo, la
   gráfica de cada modo y el desarrollo). El cálculo está en
   cinetica/calculo.js (Cinetica).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const K = Cinetica, f = K.f, CLAVE = 'cinetica-v1', MAXE = 6;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['orden', 'Ley integrada (orden 0, 1 o 2)'], ['datos', 'Orden a partir de datos [A]–t'], ['iniciales', 'Método de las velocidades iniciales'], ['arrhenius', 'Ecuación de Arrhenius']];

  let sc = copia(K.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0, vista = null;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un, modo = 'decimal') => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="${modo}" autocomplete="off" spellcheck="false">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const unidT = () => elige('ut', 'Unidad de tiempo', [['s', 'segundos (s)'], ['min', 'minutos (min)'], ['h', 'horas (h)']]);
  const NOTAS = {
    orden: 'La concentración final es opcional: con ella se calcula cuánto tarda en llegar. Se admite 5,1e-4 o 5,1·10^-4.',
    datos: 'Escribe los tiempos y las concentraciones separados por espacios o por punto y coma, en el mismo orden.',
    iniciales: 'Cada experimento es una fila con las concentraciones iniciales y la velocidad inicial medida. Para ver un orden, cambia un reactivo y deja el otro igual.',
    arrhenius: 'Con dos constantes a dos temperaturas sale la energía de activación; con ella y una constante, la de otra temperatura.',
  };
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    if (sc.modo === 'orden') h += elige('n', 'Orden de la reacción', [['0', 'Orden 0'], ['1', 'Orden 1'], ['2', 'Orden 2']]) + fila('k', 'Constante k') + fila('A0', 'Concentración inicial [A]₀', 'mol/L') + fila('t', 'Tiempo t') + fila('C', 'Concentración a alcanzar', '(opcional)') + unidT();
    else if (sc.modo === 'datos') h += `<label for="f-ts" class="ancho">Tiempos</label><input id="f-ts" class="in ancho" data-k="ts" value="${esc(sc.ts)}" autocomplete="off" spellcheck="false"><label for="f-As" class="ancho">Concentraciones [A] <small>mol/L</small></label><input id="f-As" class="in ancho" data-k="As" value="${esc(sc.As)}" autocomplete="off" spellcheck="false">` + unidT();
    else if (sc.modo === 'iniciales') {
      h += `<label for="f-conB">Reactivos</label><select id="f-conB" class="in" data-k="conB"><option value="0"${sc.conB ? '' : ' selected'}>Solo A</option><option value="1"${sc.conB ? ' selected' : ''}>A y B</option></select>` + unidT();
      h += `<div class="exps ancho"><div class="exp cab${sc.conB ? '' : ' sinB'}"><span>N.º</span><span>[A]₀</span>${sc.conB ? '<span>[B]₀</span>' : ''}<span>v₀ <small>mol·L⁻¹·${esc(sc.ut || 's')}⁻¹</small></span><span></span></div>${sc.exps.map((e, i) => `<div class="exp${sc.conB ? '' : ' sinB'}"><span>${i + 1}</span>${['A', ...(sc.conB ? ['B'] : []), 'v'].map((c) => `<input class="in" data-i="${i}" data-c="${c}" value="${esc(e[c] ?? '')}" inputmode="decimal" autocomplete="off" aria-label="${c === 'v' ? 'Velocidad' : `[${c}]`} del experimento ${i + 1}">`).join('')}${sc.exps.length > 2 ? `<button class="btn quita" type="button" data-quita="${i}" aria-label="Quitar el experimento ${i + 1}">×</button>` : '<span></span>'}</div>`).join('')}</div>${sc.exps.length < MAXE ? '<button class="btn ancho" id="mas" type="button">+ Añadir experimento</button>' : ''}`;
    } else {
      const k2 = sc.tipo === 'k2';
      h += elige('tipo', 'Qué se busca', [['ea', 'La energía de activación'], ['k2', 'La constante a otra temperatura']]) + elige('uT', 'Temperaturas en', [['K', 'kelvin (K)'], ['C', 'grados Celsius (°C)']]);
      h += (k2 ? fila('Ea', 'Energía de activación Eₐ', 'kJ/mol') : '') + fila('k1', 'Constante k₁') + fila('T1', 'Temperatura T₁') + (k2 ? '' : fila('k2', 'Constante k₂')) + fila('T2', 'Temperatura T₂');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (t.tagName !== 'INPUT') return;
    if (t.dataset.c) sc.exps[+t.dataset.i][t.dataset.c] = t.value; else sc[t.dataset.k] = t.value;
    cambia();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(K.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (k === 'conB') { sc.conB = t.value === '1'; if (sc.conB) for (const x of sc.exps) if (vacio(x.B)) x.B = '0,1'; }
    else { sc[k] = t.value; if (k === 'tipo' && t.value === 'k2' && vacio(sc.Ea)) sc.Ea = '50'; if (k === 'tipo' && t.value === 'ea' && vacio(sc.k2)) sc.k2 = '0,05'; }
    formulario(); cambia();
  });
  $('#campos').addEventListener('click', (e) => {
    const q = e.target.closest('[data-quita]');
    if (q) { sc.exps.splice(+q.dataset.quita, 1); formulario(); cambia(); return; }
    if (e.target.id === 'mas') { sc.exps.push({ A: '', B: sc.conB ? '' : undefined, v: '' }); formulario(); cambia(); $(`#campos [data-i="${sc.exps.length - 1}"][data-c="A"]`).focus(); }
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, n]) => `<optgroup label="${n}">${K.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = K.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), toma = (xs) => xs[ent(0, xs.length - 1)], c = (v) => String(+v.toPrecision(3)).replace('.', ',');
    const tipos = [
      () => { const n = ent(0, 2), A0 = toma([0.1, 0.2, 0.5, 1, 0.05]), k = n === 0 ? A0 / toma([100, 200, 500]) : n === 1 ? toma([0.01, 0.002, 0.05, 1e-3]) : toma([0.5, 1, 2, 0.1]); return { modo: 'orden', n: String(n), k: c(k), A0: c(A0), t: String(toma([10, 30, 60, 100, 120])), C: c(A0 / toma([2, 4, 5])), ut: 's' }; },
      () => { const n = ent(0, 2), A0 = toma([0.5, 1, 0.2]), dt = toma([5, 10, 20]), N = 6, k = n === 0 ? (A0 * 0.8) / (dt * (N - 1)) : n === 1 ? toma([0.02, 0.05, 0.03]) : toma([0.2, 0.5, 1]) / A0 / 10; const ts = Array.from({ length: N }, (_, i) => i * dt); return { modo: 'datos', ts: ts.join(' '), As: ts.map((t) => c(K.conc(n, k, A0, t))).join(' '), ut: 'min' }; },
      () => { const m = ent(0, 2), n = ent(0, 2), k = toma([0.5, 2, 10, 25]), A = toma([0.01, 0.1, 0.05]), B = toma([0.01, 0.1, 0.02]), v = (a, b) => c(k * a ** m * b ** n); return { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: c(A), B: c(B), v: v(A, B) }, { A: c(2 * A), B: c(B), v: v(2 * A, B) }, { A: c(A), B: c(3 * B), v: v(A, 3 * B) }] }; },
      () => { const Ea = toma([40, 50, 60, 75, 90]), T1 = toma([298, 300, 310]), T2 = T1 + toma([10, 20, 30]), k1 = toma([1e-3, 0.01, 2e-4]); return ent(0, 1) ? { modo: 'arrhenius', tipo: 'k2', uT: 'K', Ea: String(Ea), k1: c(k1), T1: String(T1), T2: String(T2) } : { modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: c(k1), T1: String(T1), k2: c(k1 * Math.exp((-Ea * 1000 / K.R) * (1 / T2 - 1 / T1))), T2: String(T2) }; },
    ];
    sc = toma(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const u = sc.ut || 's';
    if (sc.modo === 'orden') return `Una reacción A → productos es de <b>orden ${esc(sc.n)}</b> con k = ${esc(sc.k)} y [A]₀ = ${esc(sc.A0)} mol/L. Calcula [A] a los ${esc(sc.t)} ${u}, la vida media${vacio(sc.C) ? '' : ` y cuánto tarda en llegar a ${esc(sc.C)} mol/L`}.`;
    if (sc.modo === 'datos') return `Con estas medidas (t en ${u}: ${esc(sc.ts)}; [A] en mol/L: ${esc(sc.As)}), averigua el <b>orden</b> de la reacción, la constante k y la vida media.`;
    if (sc.modo === 'iniciales') return `Con las velocidades iniciales de la tabla, halla los <b>órdenes</b> de reacción, la constante k y la ley de velocidad.`;
    return sc.tipo === 'k2' ? `Una reacción tiene Eₐ = ${esc(sc.Ea)} kJ/mol y k = ${esc(sc.k1)} a ${esc(sc.T1)} ${sc.uT === 'C' ? '°C' : 'K'}. ¿Cuánto vale <b>k a ${esc(sc.T2)} ${sc.uT === 'C' ? '°C' : 'K'}</b>?` : `La constante vale ${esc(sc.k1)} a ${esc(sc.T1)} ${sc.uT === 'C' ? '°C' : 'K'} y ${esc(sc.k2)} a ${esc(sc.T2)} ${sc.uT === 'C' ? '°C' : 'K'}. Calcula la <b>energía de activación</b> y el factor de frecuencia.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = 'num') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = K.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#vistas').hidden = true;
      dibuja(); grafica(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'orden') {
      h = dato(`[A] a t = ${f(sol.t)} ${sol.u}`, `${f(sol.A, 4)} mol/L`) + dato('Vida media', `t<sub>1/2</sub> = ${f(sol.t12, 4)} ${sol.u}`) + (sol.tC !== null ? dato(`Tiempo hasta ${f(sol.C)} mol/L`, `${f(sol.tC, 4)} ${sol.u}`) : '') + dato('Velocidad inicial', `${f(sol.v0)} mol·L⁻¹·${sol.u}⁻¹`);
      ley = `[A] frente a t. Las líneas de puntos marcan cada vida media${sol.n === 1 ? ', todas iguales' : ''}; el punto es el tiempo que has pedido.`;
    } else if (sol.modo === 'datos') {
      h = dato('Orden', `orden ${sol.n}`, '') + dato('Constante', `k = ${f(sol.k, 4)} ${sol.unidad}`) + dato('Vida media', `t<sub>1/2</sub> = ${f(sol.t12, 4)} ${sol.u}`) + dato('R² de la recta', sol.fits[sol.n].r2.toFixed(5).replace('.', ','), '');
      ley = 'Los puntos son las medidas y la línea, la recta de mínimos cuadrados. Cambia de gráfica para ver que solo una de las tres sale recta.';
    } else if (sol.modo === 'iniciales') {
      h = dato('Ley de velocidad', Mates.html(`$${sol.ley}$`), 'ancho') + dato('Orden respecto de A', String(sol.oA).replace('.', ',')) + (sol.conB ? dato('Orden respecto de B', String(sol.oB).replace('.', ',')) : '') + dato('Constante', `k = ${f(sol.k, 4)} ${sol.unidad}`);
      ley = 'Velocidad inicial de cada experimento: la barra es la medida y el punto, la que da la ley de velocidad.';
    } else {
      h = (sol.tipo === 'ea' ? dato('Energía de activación', `E<sub>a</sub> = ${f(sol.Ea / 1000, 4)} kJ/mol`) : dato(`k a ${f(sol.uT === 'C' ? sol.T2 - 273.15 : sol.T2, 4)} ${sol.uT === 'C' ? '°C' : 'K'}`, `k₂ = ${f(sol.k2, 4)}`)) + dato('Factor de frecuencia', `A = ${f(sol.A, 4)}`) + dato('k₂/k₁', f(sol.r, 4));
      ley = 'Gráfica de Arrhenius: ln k frente a 1/T es una recta de pendiente −Eₐ/R. Cuanto más empinada, más sube k al calentar.';
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#vistas').hidden = sol.modo !== 'datos';
    if (sol.modo === 'datos') { vista = sol.n; marcaVista(); }
    $('#escena').hidden = $('#play').hidden = !(sol.modo === 'orden' || sol.modo === 'datos');
    tA = 0; particulas(); dibuja(); grafica();
  }
  const marcaVista = () => { for (const b of document.querySelectorAll('#vistas button')) b.setAttribute('aria-pressed', String(+b.dataset.v === vista)); };
  $('#vistas').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (!b) return; vista = +b.dataset.v; marcaVista(); grafica(); });

  /* ---------- Vaso con las moléculas ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--panel', '--suelo', '--peso', '--tension', '--roz']) col[k] = cs.getPropertyValue(k).trim(); }
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  const NP = 60;
  let parts = [];
  function particulas() {
    parts = Array.from({ length: NP }, (_, i) => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, u: (i + Math.random()) / NP }));
    parts.sort(() => Math.random() - 0.5);
  }
  // hasta qué tiempo se dibuja y se anima
  const tMax = () => (sol.modo === 'datos' ? sol.ts[sol.ts.length - 1] : Math.max(sol.t, sol.tC || 0, (sol.n === 0 ? 1.1 * sol.A0 / sol.k : 3 * sol.t12)));
  const tDe = () => { const T = tMax(), ciclo = 9; return Math.min(1, (tA % ciclo) / 7.5) * T; };
  function lienzo(c) {
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  function mueve(dt) {
    for (const q of parts) {
      q.vx += (Math.random() - 0.5) * dt; q.vy += (Math.random() - 0.5) * dt;
      const v = Math.hypot(q.vx, q.vy); if (v > 0.35) { q.vx *= 0.35 / v; q.vy *= 0.35 / v; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.x < 0 || q.x > 1) { q.vx = -q.vx; q.x = Math.max(0, Math.min(1, q.x)); }
      if (q.y < 0 || q.y > 1) { q.vy = -q.vy; q.y = Math.max(0, Math.min(1, q.y)); }
    }
  }
  function dibuja() {
    const c = $('#escena'); if (c.hidden || !sol) return;
    const L = lienzo(c); if (!L) return;
    const { g, w, h } = L;
    if (!col['--ink']) colores();
    const t = tDe(), fr = Math.max(0, sol.c(t) / sol.c(0));
    const bw = Math.min(w * 0.46, 320), bx = w * 0.06, by = 14, bh = h - 34;
    g.fillStyle = col['--line']; g.globalAlpha = 0.45; g.fillRect(bx, by + bh * 0.12, bw, bh * 0.88); g.globalAlpha = 1;
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 4, by); g.lineTo(bx, by + bh); g.lineTo(bx + bw, by + bh); g.lineTo(bx + bw + 4, by); g.stroke();
    let nA = 0;
    for (const q of parts) {
      const x = bx + 10 + q.x * (bw - 20), y = by + bh * 0.12 + 10 + q.y * (bh * 0.88 - 20), esA = q.u < fr;
      if (esA) { nA++; punto(g, x - 3.5, y, 5, col['--accent']); punto(g, x + 3.5, y, 5, col['--accent']); } else { punto(g, x - 4, y + 2, 3.6, col['--muted']); punto(g, x + 4, y - 2, 3.6, col['--muted']); }
    }
    const tx = bx + bw + 24;
    punto(g, tx, by + 22, 5, col['--accent']); texto(g, tx + 12, by + 22, 'A', col['--ink'], 'left');
    punto(g, tx, by + 44, 3.6, col['--muted']); texto(g, tx + 12, by + 44, 'productos', col['--ink'], 'left');
    texto(g, tx, by + 80, `t = ${txt(f(t, 3))} ${sol.u}`, col['--ink'], 'left', '600 ');
    texto(g, tx, by + 102, `[A] = ${txt(f(sol.c(t), 3))} mol/L`, col['--ink'], 'left', '600 ');
    texto(g, tx, by + 124, `queda el ${txt(f(100 * fr, 3))} % (${nA} de ${NP})`, col['--muted'], 'left');
  }

  /* ---------- Gráficas ---------- */
  const marcas = (a, b, n = 6) => {
    const p0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(p0)), paso = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0) || 10 * e;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  };
  function ejes(g, w, h, V, X, Y, etX, etY, fx = (v) => txt(f(v, 3)), fy = fx) {
    g.lineWidth = 1; g.strokeStyle = col['--line'];
    if (V.x2 > V.x1) for (const v of marcas(V.x1, V.x2, Math.max(4, Math.round(w / 90)))) { g.beginPath(); g.moveTo(X(v), V.mT); g.lineTo(X(v), h - V.mB); g.stroke(); texto(g, X(v), h - V.mB + 12, fx(v), col['--muted']); }
    for (const v of marcas(V.y1, V.y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(V.mL, Y(v)); g.lineTo(w - V.mR, Y(v)); g.stroke(); texto(g, V.mL - 5, Y(v), fy(v), col['--muted'], 'right'); }
    texto(g, w - V.mR - 2, h - V.mB - 9, etX, col['--muted'], 'right'); texto(g, V.mL + 4, V.mT + 8, etY, col['--muted'], 'left');
  }
  function grafica() {
    const L = lienzo($('#grafica')); if (!L) return;
    const { g, w, h } = L;
    if (!sol) return;
    if (!col['--ink']) colores();
    const V = { mL: 54, mR: 14, mT: 12, mB: 28 };
    const marco = (x1, x2, y1, y2) => { Object.assign(V, { x1, x2, y1, y2 }); return [(x) => V.mL + ((x - x1) / (x2 - x1)) * (w - V.mL - V.mR), (y) => V.mT + ((y2 - y) / (y2 - y1)) * (h - V.mT - V.mB)]; };
    if (sol.modo === 'orden') {
      const T = tMax(), [X, Y] = marco(0, T, 0, sol.A0 * 1.08);
      ejes(g, w, h, V, X, Y, `t (${sol.u})`, '[A] (mol/L)');
      g.strokeStyle = col['--muted']; g.setLineDash([4, 4]);
      let tt = 0, Ah = sol.A0;
      for (let i = 0; i < 6; i++) { const t12 = K.vidaMedia(sol.n, sol.k, Ah); tt += t12; Ah /= 2; if (tt > T) break; g.beginPath(); g.moveTo(X(tt), Y(0)); g.lineTo(X(tt), Y(Ah)); g.lineTo(X(0), Y(Ah)); g.stroke(); }
      g.setLineDash([]);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
      for (let i = 0; i <= 400; i++) { const t = (T * i) / 400; i ? g.lineTo(X(t), Y(sol.c(t))) : g.moveTo(X(t), Y(sol.c(t))); }
      g.stroke();
      if (sol.t <= T) punto(g, X(sol.t), Y(sol.A), 5, col['--roz']);
      if (sol.tC !== null) punto(g, X(sol.tC), Y(sol.C), 4.5, col['--ink']);
      const t = tDe(); punto(g, X(t), Y(sol.c(t)), 4, col['--peso']);
    } else if (sol.modo === 'datos') {
      const fy = [(v) => v, Math.log, (v) => 1 / v][vista], ys = sol.As.map(fy), F = sol.fits[vista], T = sol.ts[sol.ts.length - 1];
      const lo = Math.min(...ys, F.a, F.a + F.b * T), hi = Math.max(...ys, F.a, F.a + F.b * T), pad = (hi - lo) * 0.12 || 1;
      const [X, Y] = marco(0, T * 1.04, lo - pad, hi + pad);
      ejes(g, w, h, V, X, Y, `t (${sol.u})`, ['[A]', 'ln [A]', '1/[A]'][vista]);
      g.strokeStyle = vista === sol.n ? col['--accent'] : col['--muted']; g.lineWidth = 2; g.beginPath(); g.moveTo(X(0), Y(F.a)); g.lineTo(X(T * 1.04), Y(F.a + F.b * T * 1.04)); g.stroke();
      // la curva del modelo elegido, en la vista de [A]
      if (vista === 0 && sol.n !== 0) { g.strokeStyle = col['--accent']; g.setLineDash([5, 4]); g.beginPath(); for (let i = 0; i <= 200; i++) { const t = (T * i) / 200; i ? g.lineTo(X(t), Y(sol.c(t))) : g.moveTo(X(t), Y(sol.c(t))); } g.stroke(); g.setLineDash([]); }
      sol.ts.forEach((t, i) => punto(g, X(t), Y(ys[i]), 4.5, col['--ink']));
      texto(g, w - V.mR - 6, V.mT + 10, `R² = ${F.r2.toFixed(5).replace('.', ',')}`, vista === sol.n ? col['--accent'] : col['--muted'], 'right', '600 ');
      if (vista === 0) { const t = tDe(); punto(g, X(t), Y(sol.c(t)), 4, col['--peso']); }
    } else if (sol.modo === 'iniciales') {
      const vs = sol.E.map((e) => e.v), mx = Math.max(...vs, ...sol.E.map((e) => sol.k * e.A ** sol.oA * e.B ** sol.oB)) * 1.1, n = sol.E.length;
      const [, Y] = marco(0, n, 0, mx), ancho = (w - V.mL - V.mR) / n;
      ejes(g, w, h, { ...V, x1: 0, x2: 0 }, () => -99, Y, '', `v₀ (mol·L⁻¹·${sol.u}⁻¹)`);
      sol.E.forEach((e, i) => {
        const x = V.mL + i * ancho + ancho * 0.25;
        g.fillStyle = col['--accent']; g.globalAlpha = 0.75; g.fillRect(x, Y(e.v), ancho * 0.5, Y(0) - Y(e.v)); g.globalAlpha = 1;
        punto(g, x + ancho * 0.25, Y(sol.k * e.A ** sol.oA * e.B ** sol.oB), 5, col['--ink']);
        texto(g, x + ancho * 0.25, h - V.mB + 12, `exp. ${i + 1}`, col['--muted']);
      });
    } else {
      // ln k frente a 1/T, en 1000/T
      const xs = [1000 / sol.T1, 1000 / sol.T2], ys = [Math.log(sol.k1), Math.log(sol.k2)];
      const x1 = Math.min(...xs), x2 = Math.max(...xs), dx = (x2 - x1) * 0.35, y1 = Math.min(...ys), y2 = Math.max(...ys), dy = (y2 - y1) * 0.35 || 1;
      const [X, Y] = marco(x1 - dx, x2 + dx, y1 - dy, y2 + dy);
      ejes(g, w, h, V, X, Y, '1000/T (K⁻¹)', 'ln k', (v) => v.toFixed(3).replace('.', ','), (v) => v.toFixed(2).replace('.', ',').replace('-', '−'));
      const lk = (x) => Math.log(sol.A) - (sol.Ea / K.R) * (x / 1000);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(x1 - dx), Y(lk(x1 - dx))); g.lineTo(X(x2 + dx), Y(lk(x2 + dx))); g.stroke();
      [[xs[0], ys[0], 'T₁'], [xs[1], ys[1], 'T₂']].forEach(([x, y, e]) => { punto(g, X(x), Y(y), 5, col['--ink']); texto(g, X(x) + 9, Y(y) - 10, e, col['--ink'], 'left', '600 '); });
    }
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol && (sol.modo === 'orden' || sol.modo === 'datos')) { tA += dt; mueve(dt); dibuja(); grafica(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); grafica(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); grafica(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('cinetica').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.CineticaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, n: sol.n, k: sol.k, A: sol.A, t12: sol.t12, oA: sol.oA, oB: sol.oB, Ea: sol.Ea, k2: sol.k2 }, estado: () => copia(sc), vista: (v) => { vista = v; marcaVista(); grafica(); }, pausa: () => { anda = false; } };
})();
