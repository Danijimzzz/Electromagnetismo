/* =====================================================================
   Transitorios: interfaz (RC, RL y RLC en serie; esquema del circuito
   con la corriente que circula y la carga del condensador, gráfica de la
   tensión y la corriente frente al tiempo con un cursor que avanza, y el
   desarrollo). El cálculo está en transitorios/fisica.js (Transitorios).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const T = Transitorios, f = T.f, u = T.u, CLAVE = 'transitorios-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['rc', 'Circuito RC (condensador)'], ['rl', 'Circuito RL (bobina)'], ['rlc', 'Circuito RLC en serie']];

  let sc = copia(T.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    rc: 'El interruptor se cierra en t = 0. En la descarga no hay fuente: el condensador se descarga a través de R. Se admite 4,7e-3 o 4,7·10^-3.',
    rl: 'En la subida se conecta la fuente en t = 0; en la bajada se quita y la bobina, que llevaba V/R, se descarga a través de R.',
    rlc: 'R, L y C en serie con una fuente que se conecta en t = 0 (pon 0 V para la respuesta libre). V₀ e I₀ son la tensión del condensador y la corriente al empezar.',
  };
  function formulario() {
    let h = elige('modo', 'Circuito', MODOS);
    if (sc.modo === 'rc') {
      const carga = sc.proceso !== 'descarga';
      h += elige('proceso', 'Proceso', [['carga', 'Carga (se conecta la fuente)'], ['descarga', 'Descarga (sin fuente)']]) + (carga ? fila('V', 'Tensión de la fuente V', 'V') : '') + fila('V0', carga ? 'Tensión inicial V₀ (opcional)' : 'Tensión inicial V₀', 'V') + fila('R', 'Resistencia R', 'Ω') + fila('C', 'Capacidad C', 'μF') + sep('Opcional') + fila('t', 'Instante t', 's') + fila('Vobj', 'Tiempo hasta que V<sub>C</sub> valga', 'V');
    } else if (sc.modo === 'rl') {
      h += elige('proceso', 'Proceso', [['subida', 'Se conecta la fuente'], ['bajada', 'Se quita la fuente']]) + fila('V', 'Tensión de la fuente V', 'V') + fila('R', 'Resistencia R', 'Ω') + fila('L', 'Inductancia L', 'mH') + sep('Opcional') + fila('t', 'Instante t', 's') + fila('Iobj', 'Tiempo hasta que i valga', 'A');
    } else h += fila('V', 'Tensión de la fuente V', 'V') + fila('R', 'Resistencia R', 'Ω') + fila('L', 'Inductancia L', 'mH') + fila('C', 'Capacidad C', 'μF') + sep('Opcional') + fila('V0', 'Tensión inicial del condensador V₀', 'V') + fila('I0', 'Corriente inicial I₀', 'A') + fila('t', 'Instante t', 's');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    if (t.dataset.k === 'modo') sc = copia(T.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { sc.proceso = t.value; if (t.value === 'descarga' && !sc.V0) sc.V0 = sc.V || '10'; if (t.value === 'carga' && !sc.V) sc.V = sc.V0 || '10'; if (t.value === 'descarga') sc.Vobj = ''; }
    formulario(); cambia();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${T.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = T.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipos = [
      () => { const R = de([100, 220, 470, 1000, 2200, 4700, 10000]), C = de([10, 22, 47, 100, 220, 470, 1000]), tau = (R * C) / 1e6; return { modo: 'rc', proceso: 'carga', V: String(de([5, 9, 10, 12, 24])), V0: '', R: String(R), C: String(C), t: c(+(tau * de([0.5, 1, 2, 3])).toPrecision(3)), Vobj: '' }; },
      () => { const R = de([100, 470, 1000, 2200, 10000]), C = de([10, 47, 100, 470, 1000]), V0 = de([6, 9, 12, 20]); return { modo: 'rc', proceso: 'descarga', V: '', V0: String(V0), R: String(R), C: String(C), t: '', Vobj: c(V0 / de([2, 3, 4])) }; },
      () => { const R = de([2, 5, 10, 20, 50]), L = de([10, 50, 100, 200, 500]), tau = L / 1000 / R; return { modo: 'rl', proceso: de(['subida', 'bajada']), V: String(de([6, 10, 12, 24])), R: String(R), L: String(L), t: c(+(tau * de([0.5, 1, 2])).toPrecision(3)), Iobj: '' }; },
      () => ({ modo: 'rlc', V: String(de([5, 10, 12])), R: String(de([10, 20, 50, 200, 500, 1000])), L: String(de([10, 50, 100])), C: String(de([1, 10, 100])), V0: '', I0: '', t: '' }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'rc') return sc.proceso === 'descarga' ? `Un condensador de ${esc(sc.C)} μF cargado a ${esc(sc.V0)} V se descarga por una resistencia de ${esc(sc.R)} Ω. Calcula la constante de tiempo${sc.Vobj ? ` y cuánto tarda en bajar a ${esc(sc.Vobj)} V` : ''}${sc.t ? ` y la tensión a los ${esc(sc.t)} s` : ''}.` : `Se conecta un condensador de ${esc(sc.C)} μF${sc.V0 ? ` (a ${esc(sc.V0)} V)` : ' descargado'} a una fuente de ${esc(sc.V)} V a través de ${esc(sc.R)} Ω. Calcula τ, la corriente inicial${sc.t ? ` y la tensión y la corriente a los ${esc(sc.t)} s` : ''}${sc.Vobj ? ` y cuánto tarda en llegar a ${esc(sc.Vobj)} V` : ''}.`;
    if (sc.modo === 'rl') return `${sc.proceso === 'bajada' ? `Una bobina de ${esc(sc.L)} mH lleva la corriente que le da una fuente de ${esc(sc.V)} V con ${esc(sc.R)} Ω, y se quita la fuente` : `Se conecta una bobina de ${esc(sc.L)} mH en serie con ${esc(sc.R)} Ω a una fuente de ${esc(sc.V)} V`}. Calcula τ y la corriente final o inicial${sc.t ? `, y la corriente a los ${esc(sc.t)} s` : ''}${sc.Iobj ? `, y cuánto tarda en llegar a ${esc(sc.Iobj)} A` : ''}.`;
    return `Un circuito RLC en serie con R = ${esc(sc.R)} Ω, L = ${esc(sc.L)} mH y C = ${esc(sc.C)} μF se conecta a ${esc(sc.V)} V. ¿Es sobreamortiguado, crítico o subamortiguado? Calcula α, ω₀ y la tensión del condensador.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  const TIPOS = { sub: 'subamortiguado', critico: 'amortiguamiento crítico', sobre: 'sobreamortiguado' };
  function calcula() {
    const err = $('#error');
    try { sol = T.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h = '';
    if (sol.modo === 'rc') {
      h = dato('Constante de tiempo', `τ = RC = <b>${u(sol.tau, 's')}</b>`) + dato('Tensión del condensador', `V<sub>C</sub>(t) = <b>${sol.VcTxt} V</b>`, 'ancho') + dato('Corriente inicial', `i(0) = ${u(sol.I0, 'A')}`);
      if (sol.t !== null) h += dato(`V<sub>C</sub> en t = ${u(sol.t, 's')}`, `<b>${f(sol.Vct)} V</b>`) + dato(`i en t = ${u(sol.t, 's')}`, `${u(sol.It, 'A')}`);
      if (sol.tObj !== null) h += dato(`Tiempo hasta ${f(sol.Vo)} V`, `t = <b>${u(sol.tObj, 's')}</b>`);
      h += dato('Energía final', `${u(sol.Ef, 'J')}`);
    } else if (sol.modo === 'rl') {
      h = dato('Constante de tiempo', `τ = L/R = <b>${u(sol.tau, 's')}</b>`) + dato('Corriente', `i(t) = <b>${sol.ITxt} A</b>`, 'ancho') + dato(sol.sube ? 'Corriente final' : 'Corriente inicial', `${u(sol.Inf, 'A')}`);
      if (sol.t !== null) h += dato(`i en t = ${u(sol.t, 's')}`, `<b>${u(sol.It, 'A')}</b>`) + dato(`V<sub>L</sub> en t = ${u(sol.t, 's')}`, `${f(sol.VLt)} V`);
      if (sol.tObj !== null) h += dato(`Tiempo hasta ${f(sol.Io)} A`, `t = <b>${u(sol.tObj, 's')}</b>`);
      h += dato('Energía en la bobina', `${u(sol.E, 'J')}`);
    } else {
      h = dato('Tipo', `<b>${TIPOS[sol.tipo]}</b>`) + dato('α', `${f(sol.a)} s<sup>−1</sup>`) + dato('ω<sub>0</sub>', `${f(sol.w0)} rad/s`) + (sol.wd !== null ? dato('ω<sub>d</sub>', `${f(sol.wd)} rad/s`) : '') + dato('Resistencia crítica', `${u(sol.Rc, 'Ω')}`) + dato('Tensión del condensador', `V<sub>C</sub>(t) = <b>${sol.txt} V</b>`, 'ancho');
      if (sol.t !== null) h += dato(`V<sub>C</sub> en t = ${u(sol.t, 's')}`, `<b>${f(sol.Vct)} V</b>`) + dato(`i en t = ${u(sol.t, 's')}`, `${u(sol.It, 'A')}`);
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#leyenda').innerHTML = sol.modo === 'rl' ? 'Arriba, el circuito: los puntos son la corriente. Abajo, i(t) en azul y V<sub>L</sub>(t) en rojo; la línea discontinua marca τ.' : `Arriba, el circuito: los puntos son la corriente y las cargas del condensador, su tensión. Abajo, V<sub>C</sub>(t) en rojo e i(t) en azul${sol.modo === 'rc' ? '; la línea discontinua marca τ' : ''}.`;
    dibuja();
  }

  /* ---------- Dibujos ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--v', '--i']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => {
    const c = $(s), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  };
  const DUR = 6, PAUSA = 1.2;
  const tiempo = () => { const k = tA % (DUR + PAUSA); return Math.min(1, k / DUR) * sol.T; };
  const fuente = () => (sol.modo === 'rc' ? sol.carga : sol.modo === 'rl' ? sol.sube : sol.V > 0);
  const marcas = (a, b, n = 5) => {
    const p0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(p0)), paso = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0) || 10 * e;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  };
  function dibuja() { circuito(); grafica(); }
  // esquema: fuente (o un cable si no hay) a la izquierda, interruptor y R arriba, C y/o L a la derecha
  function circuito() {
    const { g, w, h } = lienzo('#circuito');
    if (!sol) return;
    if (!col['--ink']) colores();
    const t = tiempo(), x1 = Math.max(50, w * 0.2), x2 = Math.min(w - 50, w * 0.8), y1 = 34, y2 = h - 30, ink = col['--ink'];
    g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round';
    const linea = (a, b, c, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
    const xm = (x1 + x2) / 2, ym = (y1 + y2) / 2;
    // lado izquierdo: fuente
    if (fuente()) { linea(x1, y1, x1, ym - 8); linea(x1, ym + 8, x1, y2); g.lineWidth = 3; linea(x1 - 16, ym - 8, x1 + 16, ym - 8); g.lineWidth = 5; linea(x1 - 8, ym + 8, x1 + 8, ym + 8); g.lineWidth = 2; g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(`${f(sol.V, 3)} V`, x1 - 22, ym); }
    else linea(x1, y1, x1, y2);
    // arriba: interruptor (cerrado) y resistencia
    const xs = x1 + (xm - x1) * 0.35; linea(x1, y1, xs - 10, y1); g.fillStyle = ink; g.beginPath(); g.arc(xs - 10, y1, 3, 0, 2 * Math.PI); g.fill(); linea(xs - 10, y1, xs + 12, y1); g.beginPath(); g.arc(xs + 12, y1, 3, 0, 2 * Math.PI); g.fill();
    const r1 = xm - 24, r2 = xm + 24; linea(xs + 12, y1, r1, y1); g.beginPath(); g.moveTo(r1, y1); for (let k = 1; k <= 6; k++) g.lineTo(r1 + (k * (r2 - r1)) / 6 - (r2 - r1) / 12, y1 + (k % 2 ? -7 : 7)); g.lineTo(r2, y1); g.stroke(); linea(r2, y1, x2, y1);
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(`R = ${txt(u(sol.R, 'Ω', 3))}`, xm, y1 - 10);
    // derecha: C, L o los dos
    const hayL = sol.modo !== 'rc', hayC = sol.modo !== 'rl';
    const bobina = (ya, yb) => { linea(x2, y1, x2, ya); g.beginPath(); const n = 4, hh = (yb - ya) / n; for (let k = 0; k < n; k++) g.arc(x2, ya + hh * (k + 0.5), hh / 2, -Math.PI / 2, Math.PI / 2); g.stroke(); g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`L = ${txt(u(sol.L, 'H', 3))}`, x2 + 16, (ya + yb) / 2); };
    let Vc = 0, I = 0, Imax = 1;
    if (sol.modo === 'rc') { Vc = sol.Vc(t); I = sol.I(t); Imax = Math.abs(sol.I0) || 1; }
    else if (sol.modo === 'rl') { I = sol.I(t); Imax = sol.Inf || 1; }
    else { Vc = sol.Vc(t); I = sol.I(t); Imax = Math.max(1e-30, ...Array.from({ length: 60 }, (_, k) => Math.abs(sol.I((k / 60) * sol.T)))); }
    const cond = (yc) => {
      linea(x2, yc - 6, x2, yc - 6); g.lineWidth = 3; linea(x2 - 22, yc - 6, x2 + 22, yc - 6); linea(x2 - 22, yc + 6, x2 + 22, yc + 6); g.lineWidth = 2;
      const Vm = Math.max(Math.abs(sol.V), Math.abs(sol.V0 || 0), 1e-30), n = Math.round((6 * Math.abs(Vc)) / Vm), arriba = Vc >= 0;
      g.font = '600 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let k = 0; k < n; k++) { const xx = x2 + (k - (n - 1) / 2) * 7.5; g.fillStyle = col['--v']; g.fillText(arriba ? '+' : '−', xx, yc - 14); g.fillStyle = col['--i']; g.fillText(arriba ? '−' : '+', xx, yc + 14); }
      g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'left'; g.fillText(`C = ${txt(u(sol.C, 'F', 3))}`, x2 + 30, yc); g.fillStyle = col['--v']; g.fillText(`V꜀ = ${txt(f(Vc, 3))} V`, x2 + 30, yc + 16);
    };
    if (hayC && hayL) { bobina(y1 + 14, ym - 6); linea(x2, ym - 6, x2, ym + 18); cond(ym + 24); linea(x2, ym + 30, x2, y2); }
    else if (hayC) { linea(x2, y1, x2, ym - 6); cond(ym); linea(x2, ym + 6, x2, y2); }
    else { bobina(ym - 40, ym + 40); linea(x2, ym + 40, x2, y2); }
    linea(x1, y2, x2, y2);
    // la corriente: puntos que recorren el circuito con velocidad proporcional a i
    const per = 2 * (x2 - x1 + y2 - y1), pos = (s) => { s = ((s % per) + per) % per; if (s < x2 - x1) return [x1 + s, y1]; s -= x2 - x1; if (s < y2 - y1) return [x2, y1 + s]; s -= y2 - y1; if (s < x2 - x1) return [x2 - s, y2]; s -= x2 - x1; return [x1, y2 - s]; };
    avance += (anda ? 1 : 0) * (I / Imax) * 2.2;
    g.fillStyle = col['--accent']; g.globalAlpha = Math.min(1, 0.25 + Math.abs(I) / Imax);
    for (let k = 0; k < per; k += 28) { const p = pos(k + avance); g.beginPath(); g.arc(p[0], p[1], 3.2, 0, 2 * Math.PI); g.fill(); }
    g.globalAlpha = 1;
    g.fillStyle = col['--i']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(`i = ${txt(u(I, 'A', 3))}  ·  t = ${txt(u(t, 's', 3))}`, xm, y2 + 8);
  }
  let avance = 0;
  // V (rojo, eje izquierdo) e i (azul, eje derecho) frente a t
  function grafica() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    const mL = 48, mR = 54, mT = 14, mB = 28, N = 400, t1 = sol.T;
    const fV = sol.modo === 'rl' ? sol.VL : sol.Vc, fI = sol.I;
    const ts = Array.from({ length: N + 1 }, (_, k) => (k / N) * t1), vs = ts.map(fV), is = ts.map(fI);
    // los dos ejes con el cero a la misma altura: se escala cada curva por su máximo
    const ext = (xs) => { const b = Math.max(0, ...xs), a = -Math.min(0, ...xs), m = Math.max(a, b) || 1; return [a / m, b / m, m]; };
    const [vn, vp, vm] = ext(vs), [in_, ip, im] = ext(is), bajo = Math.max(vn, in_), alto = Math.max(vp, ip), pd = (alto + bajo) * 0.08;
    const v1 = -(bajo + pd) * vm, v2 = (alto + pd) * vm, i1 = -(bajo + pd) * im, i2 = (alto + pd) * im;
    const X = (t) => mL + (t / t1) * (w - mL - mR), YV = (v) => mT + ((v2 - v) / (v2 - v1)) * (h - mT - mB), YI = (i) => mT + ((i2 - i) / (i2 - i1)) * (h - mT - mB);
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1;
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of marcas(0, t1, Math.max(4, Math.round(w / 90)))) { g.beginPath(); g.moveTo(X(t), mT); g.lineTo(X(t), h - mB); g.stroke(); g.fillText(txt(u(t, 's', 3)), X(t), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = col['--v'];
    for (const v of marcas(v1, v2, 5)) { g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(mL, YV(v)); g.lineTo(w - mR, YV(v)); g.stroke(); g.fillText(txt(f(v, 3)), mL - 5, YV(v)); }
    g.textAlign = 'left'; g.fillStyle = col['--i']; for (const i of marcas(i1, i2, 5)) g.fillText(txt(u(i, 'A', 3)), w - mR + 5, YI(i));
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mL, YV(0)); g.lineTo(w - mR, YV(0)); g.stroke();
    if (sol.tau) { g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(sol.tau), mT); g.lineTo(X(sol.tau), h - mB); g.stroke(); g.setLineDash([]); g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('τ', X(sol.tau) + 4, mT + 2); }
    if (sol.tObj !== null && sol.tObj !== undefined && sol.tObj <= t1) { g.fillStyle = col['--accent']; g.beginPath(); const y = sol.modo === 'rl' ? YI(sol.Io) : YV(sol.Vo); g.arc(X(sol.tObj), y, 5, 0, 2 * Math.PI); g.fill(); }
    const curva = (ys, Y, c) => { g.strokeStyle = c; g.lineWidth = 2.4; g.beginPath(); ys.forEach((y, k) => (k ? g.lineTo(X(ts[k]), Y(y)) : g.moveTo(X(ts[k]), Y(y)))); g.stroke(); };
    curva(vs, YV, col['--v']); curva(is, YI, col['--i']);
    const t = tiempo(); g.strokeStyle = col['--ink']; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(X(t), mT); g.lineTo(X(t), h - mB); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = col['--v']; g.beginPath(); g.arc(X(t), YV(fV(t)), 4.5, 0, 2 * Math.PI); g.fill(); g.fillStyle = col['--i']; g.beginPath(); g.arc(X(t), YI(fI(t)), 4.5, 0, 2 * Math.PI); g.fill();
    g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillStyle = col['--v']; g.fillText(sol.modo === 'rl' ? 'Vʟ (V)' : 'V꜀ (V)', mL + 6, mT + 2); g.textAlign = 'right'; g.fillStyle = col['--i']; g.fillText('i (A)', w - mR - 6, mT + 2);
  }

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('transitorios').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.TransitoriosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, tau: sol.tau, tipo: sol.tipo, Vct: sol.Vct, It: sol.It, tObj: sol.tObj }, estado: () => copia(sc) };
})();
