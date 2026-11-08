/* =====================================================================
   Reflexión y transmisión de Fresnel: interfaz (datos de los dos medios y
   del ángulo de incidencia, resultados de las dos polarizaciones, dibujo
   de los rayos en la frontera, gráfica de la reflectancia según el ángulo
   y desarrollo). El cálculo está en fresnel/calculo.js (Fresnel).
   Guarda el estado entero (sc) en localStorage['fresnel-v1']; expone
   window.FresnelApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = Fresnel, f = P.f, CLAVE = 'fresnel-v1', RAD = Math.PI / 180;

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && g.theta !== undefined) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  function formulario() {
    const er = sc.dato === 'er';
    let h = `<label for="f-dato">Datos de los medios</label><select id="f-dato" class="in" data-k="dato"><option value="n"${er ? '' : ' selected'}>Índices de refracción n</option><option value="er"${er ? ' selected' : ''}>Permitividad y permeabilidad (ε<sub>r</sub>, μ<sub>r</sub>)</option></select>`;
    h += sep('Medio 1 (de donde llega la onda)') + (er ? fila('er1', 'ε<sub>r</sub>') + fila('mr1', 'μ<sub>r</sub>', 'opcional, 1') : fila('n1', 'Índice n<sub>1</sub>'));
    h += sep('Medio 2') + (er ? fila('er2', 'ε<sub>r</sub>') + fila('mr2', 'μ<sub>r</sub>', 'opcional, 1') : fila('n2', 'Índice n<sub>2</sub>'));
    h += sep('Onda') + fila('theta', 'Ángulo de incidencia θ<sub>i</sub>', '°') + fila('E0', 'Amplitud incidente E<sub>0</sub>', 'V/m, opcional') + fila('lambda', 'Longitud de onda en el vacío', 'nm, opcional');
    const nc = Math.min(3, Math.max(0, Math.round(+String(sc.nc || 0).replace(',', '.')) || 0));
    h += sep('Capas delgadas entre los dos medios (opcional)') + `<label for="f-nc">Número de capas</label><select id="f-nc" class="in" data-k="nc">${[0, 1, 2, 3].map((k) => `<option value="${k}"${k === nc ? ' selected' : ''}>${k}</option>`).join('')}</select>`;
    for (let i = 1; i <= nc; i++) h += fila(`c${i}n`, `Capa ${i}: índice n`) + fila(`c${i}d`, `Capa ${i}: espesor`, 'nm, o λ/4');
    $('#campos').innerHTML = h;
    $('#nota').textContent = (nc ? 'Las capas van de la 1 (junto al medio 1) a la última (junto al medio 2); hace falta la longitud de onda. Escribe «λ/4» como espesor para el cuarto de onda. ' : '') + 'El ángulo se mide desde la normal a la superficie. La amplitud da los campos reflejado y transmitido; la longitud de onda, la profundidad de la onda evanescente en la reflexión total. Se admite coma decimal.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    // al cambiar de n a ε se conserva el mismo medio: ε = n², μ = 1
    if (t.dataset.k === 'dato') {
      const num = (x) => { const v = +String(x ?? '').replace(',', '.'); return isFinite(v) && v > 0 ? v : null; };
      if (t.value === 'er') for (const i of [1, 2]) { const n = num(sc['n' + i]); sc['er' + i] = String(n ? +(n * n).toPrecision(5) : 1).replace('.', ','); sc['mr' + i] = ''; }
      else for (const i of [1, 2]) { const e2 = num(sc['er' + i]), m = num(sc['mr' + i]) ?? 1; sc['n' + i] = String(e2 ? +Math.sqrt(e2 * m).toPrecision(5) : 1).replace('.', ','); }
      sc.dato = t.value;
    } else sc[t.dataset.k] = t.value;
    formulario(); $('#ejemplos').value = ''; calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const de = (l) => l[Math.floor(Math.random() * l.length)], c = (x) => String(x).replace('.', ',');
    const par = Math.random() < 0.6 ? [de([1, 1, 1.33]), de([1.5, 1.52, 1.7, 2.4, 1.33])] : [de([1.33, 1.5, 1.7, 2.4]), de([1, 1.33])];
    const [n1, n2] = par[0] === par[1] ? [1, 1.5] : par;
    sc = { dato: 'n', n1: c(n1), n2: c(n2), theta: String(de([10, 20, 25, 30, 35, 40, 45, 50, 60, 70])), E0: de(['', '10', '20']), lambda: '', nc: '0' };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => `Una onda plana llega con un ángulo de incidencia de ${esc(sc.theta)}° desde un medio de índice n₁ = ${esc(sc.n1)} a otro de índice n₂ = ${esc(sc.n2)}${sc.E0 ? ` con una amplitud E₀ = ${esc(sc.E0)} V/m` : ''}. Calcula el ángulo de refracción, los coeficientes de reflexión y de transmisión de las polarizaciones ⊥ y ∥, las reflectancias, y los ángulos de Brewster y crítico.`;

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  const pc = (x) => `${f(100 * x, 3)} %`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#leyenda-capas').textContent = ''; $('#bloque-capas').hidden = true; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.tot) {
      h += dato('Reflexión', '<b>total</b>') + dato('Reflectancia', `R = <b>100 %</b>`) + dato('Transmitancia', `T = <b>0</b>`)
        + dato('Desfase ⊥', `φ<sub>⊥</sub> = <b>${f(sol.fp)}°</b>`) + dato('Desfase ∥', `φ<sub>∥</sub> = <b>${f(sol.fl)}°</b>`) + dato('Diferencia ∥ − ⊥', `<b>${f(sol.dif)}°</b>`);
      if (sol.prof) h += dato('Onda evanescente', `d = <b>${f(sol.prof * 1e9)} nm</b>`);
    } else {
      h += dato('Ángulo de refracción', `θ<sub>t</sub> = <b>${f(sol.tt)}°</b>`)
        + dato('Reflexión ⊥ (TE)', `r<sub>⊥</sub> = <b>${f(sol.rp)}</b>`) + dato('Transmisión ⊥ (TE)', `t<sub>⊥</sub> = <b>${f(sol.tp)}</b>`)
        + dato('Reflexión ∥ (TM)', `r<sub>∥</sub> = <b>${f(sol.rl)}</b>`) + dato('Transmisión ∥ (TM)', `t<sub>∥</sub> = <b>${f(sol.tl)}</b>`)
        + dato('Reflectancia ⊥', `R<sub>⊥</sub> = <b>${pc(sol.Rp)}</b>`) + dato('Reflectancia ∥', `R<sub>∥</sub> = <b>${pc(sol.Rl)}</b>`)
        + dato('Transmitancia ⊥', `T<sub>⊥</sub> = <b>${pc(sol.Tp)}</b>`) + dato('Transmitancia ∥', `T<sub>∥</sub> = <b>${pc(sol.Tl)}</b>`)
        + dato('Luz natural', `R = <b>${pc(sol.Rm)}</b>`);
      if (sol.amp) h += dato('Campos ⊥', `E<sub>r</sub> = <b>${f(sol.amp.rp)}</b>, E<sub>t</sub> = <b>${f(sol.amp.tp)}</b> V/m`, 'ancho') + dato('Campos ∥', `E<sub>r</sub> = <b>${f(sol.amp.rl)}</b>, E<sub>t</sub> = <b>${f(sol.amp.tl)}</b> V/m`, 'ancho');
    }
    h += dato('Ángulo de Brewster', sol.thBl !== null ? `θ<sub>B</sub> = <b>${f(sol.thBl)}°</b>` : '<b>no hay</b>');
    h += dato('Ángulo crítico', sol.thc !== null ? `θ<sub>c</sub> = <b>${f(sol.thc)}°</b>` : '<b>no hay</b>');
    h += dato('Incidencia normal', `R = <b>${pc(sol.RN)}</b>`);
    if (sol.cap) h += dato('Con las capas, luz natural', `R = <b>${pc(sol.cap.Rm)}</b> (sin capas ${pc((sol.cap.sin.Rp + sol.cap.sin.Rl) / 2)})`, 'ancho') + dato('Con las capas, incidencia normal', `R = <b>${pc(sol.cap.RN)}</b>`) + (sol.cap.nopt ? dato('Índice óptimo de una capa', `n = √(n₁n₂) = <b>${f(sol.cap.nopt)}</b>, d = <b>${f(sol.cap.dopt)} nm</b>`) : '');
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    leyendas();
    $('#bloque-capas').hidden = !sol.cap;
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--serie-1', '--serie-2', '--serie-3']) col[k] = cs.getPropertyValue(k).trim(); }
  const FU = '"IBM Plex Sans", system-ui, sans-serif';
  const flecha = (g, x0, y0, x1, y1, c, ancho) => {
    const a = Math.atan2(y1 - y0, x1 - x0), p = 9;
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = ancho; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - p * 0.6 * Math.cos(a), y1 - p * 0.6 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  };
  function rayos() {
    const { g, w, h } = lienzo('#rayos');
    if (!sol || !w || !h) return;
    const yc = h * 0.52, xc = w / 2, L = Math.min(h * 0.46, w * 0.34);
    g.globalAlpha = 0.14; g.fillStyle = col['--accent']; g.fillRect(0, yc, w, h - yc); g.globalAlpha = 1;
    g.strokeStyle = col['--muted']; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, yc); g.lineTo(w, yc); g.stroke();
    g.setLineDash([5, 4]); g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(xc, 6); g.lineTo(xc, h - 6); g.stroke(); g.setLineDash([]);
    g.font = `13px ${FU}`; g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText(`Medio 1: n = ${txt(f(sol.m1.n))}`, 10, 8); g.fillText(`Medio 2: n = ${txt(f(sol.m2.n))}`, 10, yc + 8);
    const th = sol.th * RAD, R = sol.tot ? 1 : sol.Rm, T = sol.tot ? 0 : sol.Tm;
    const pt = (a, s) => [xc + s * L * Math.sin(a), yc - s * L * Math.cos(a)];
    // incidente (llega desde la izquierda) y reflejado (sale hacia la derecha)
    const [xi, yi] = pt(-th, 1), [xr, yr] = pt(th, 1);
    flecha(g, xi, yi, xc, yc, col['--serie-1'], 2.8);
    g.globalAlpha = 0.25 + 0.75 * Math.sqrt(R); flecha(g, xc, yc, xr, yr, col['--serie-2'], 1 + 2.4 * Math.sqrt(R)); g.globalAlpha = 1;
    // transmitido (o la onda evanescente, que se queda pegada a la frontera)
    if (!sol.tot) {
      const tt = sol.tt * RAD;
      g.globalAlpha = 0.25 + 0.75 * Math.sqrt(T); flecha(g, xc, yc, xc + L * Math.sin(tt), yc + L * Math.cos(tt), col['--serie-3'], 1 + 2.4 * Math.sqrt(T)); g.globalAlpha = 1;
      arco(g, xc, yc, Math.PI / 2, Math.PI / 2 - tt, 0.28 * L, col['--serie-3'], 'θt');
    } else {
      g.strokeStyle = col['--serie-3']; g.lineWidth = 2; g.globalAlpha = 0.6;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(xc + 6 + i * 3, yc + 2 + i * 7); g.lineTo(xc + 40 - i * 6, yc + 2 + i * 7); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = col['--serie-3']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('onda evanescente', xc + 52, yc + 18);
    }
    arco(g, xc, yc, -Math.PI / 2, -Math.PI / 2 - th, 0.3 * L, col['--serie-1'], 'θi'); arco(g, xc, yc, -Math.PI / 2, -Math.PI / 2 + th, 0.3 * L, col['--serie-2'], 'θr');
    g.fillStyle = col['--muted']; g.font = `12px ${FU}`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('normal', xc, h - 4);
    g.font = `600 12px ${FU}`; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillStyle = col['--serie-1']; g.fillText('incidente', w - 10, 8); g.fillStyle = col['--serie-2']; g.fillText(`reflejado ${txt(pc(R))}`, w - 10, 26); g.fillStyle = col['--serie-3']; g.fillText(`transmitido ${txt(pc(T))}`, w - 10, 44);
  }
  // arco entre la normal (ángulo a0) y un rayo (ángulo a1), con su nombre; ángulos de lienzo (y hacia abajo)
  function arco(g, xc, yc, a0, a1, r, c, nombre) {
    if (Math.abs(a1 - a0) < 0.02) return;
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 1.4; g.beginPath(); g.arc(xc, yc, r, Math.min(a0, a1), Math.max(a0, a1)); g.stroke();
    const am = (a0 + a1) / 2; g.font = `12px ${FU}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(nombre, xc + (r + 14) * Math.cos(am), yc + (r + 14) * Math.sin(am));
  }
  let cual = 'R', eje = 'lambda';
  const CUAL = { R: 'Reflectancia R', T: 'Transmitancia T', F: 'Fase de la reflexión' };
  const valorCurva = (c, k) => (cual === 'F' ? c['f' + k] : c[(cual === 'R' ? 'R' : 'T') + k]);
  function leyendas() {
    const cr = sol.thc !== null ? ` El ángulo crítico es ${f(sol.thc)}°.` : '', br = sol.thBl !== null ? ` El de Brewster (∥), ${f(sol.thBl)}°.` : '';
    $('#leyenda').textContent = `${CUAL[cual]} según el ángulo de incidencia: ⊥ en azul, ∥ en rojo; la línea vertical marca el ángulo de los datos (${f(sol.th)}°).` + cr + br + (cual === 'F' ? ' La fase salta 180° donde r cambia de signo y varía de forma continua en la reflexión total.' : '');
    $('#h-grafica').textContent = CUAL[cual] + ' según el ángulo';
    if (sol.cap) $('#leyenda-capas').textContent = `Reflectancia con las ${sol.cap.capas.length} capa(s) en función de ${eje === 'lambda' ? 'la longitud de onda (incidencia con el ángulo de los datos)' : 'el ángulo de incidencia (a la longitud de onda de los datos)'}: ⊥ en azul, ∥ en rojo; en trazos, la misma frontera sin capas (luz natural). Con los datos: R = ${pc(sol.cap.Rm)} frente a ${pc((sol.cap.sin.Rp + sol.cap.sin.Rl) / 2)}.`;
  }
  const filasGrafica = () => { const r = []; for (let a = 0; a <= 89.5; a += 0.5) { const c = P.curvaFull(sol, a); r.push([a, c.Rp, c.Rl, c.Tp, c.Tl, c.fp, c.fl]); } return r; };
  function grafica() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const fase = cual === 'F', ymin = fase ? -180 : 0, ymax = fase ? 180 : 1;
    const ml = 52, mr = 14, mt = 12, mb = 32, X = (a) => ml + (a / 90) * (w - ml - mr), Y = (r) => h - mb - ((r - ymin) / (ymax - ymin)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const r of (fase ? [-180, -90, 0, 90, 180] : [0, 0.25, 0.5, 0.75, 1])) { g.beginPath(); g.moveTo(ml, Y(r)); g.lineTo(w - mr, Y(r)); g.stroke(); g.fillText(fase ? `${r}°` : `${100 * r} %`, ml - 6, Y(r)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const a of marcas(0, 90, 6)) g.fillText(`${a}°`, X(a), h - mb + 6);
    g.fillText('ángulo de incidencia', (ml + w - mr) / 2, h - 14);
    const traza = (k, c) => {
      g.strokeStyle = c; g.lineWidth = 2.4; g.beginPath(); let ant = null;
      for (let i = 0; i <= 180; i++) {
        const a = Math.min(i / 2, 89.99), v = valorCurva(P.curvaFull(sol, a), k);
        if (ant === null || (fase && Math.abs(v - ant) > 100)) g.moveTo(X(a), Y(v)); else g.lineTo(X(a), Y(v)); ant = v;
      }
      g.stroke();
    };
    traza('p', col['--serie-1']); traza('l', col['--serie-2']);
    // ángulo crítico, Brewster y ángulo de los datos
    g.font = '12px system-ui, sans-serif';
    if (sol.thc !== null) { g.setLineDash([3, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(sol.thc), Y(ymax)); g.lineTo(X(sol.thc), Y(ymin)); g.stroke(); g.setLineDash([]); g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText('θc', X(sol.thc) - 4, Y(ymax) + 2); }
    if (sol.thBl !== null) { g.fillStyle = col['--serie-2']; g.beginPath(); g.arc(X(sol.thBl), Y(ymin), 4, 0, 7); g.fill(); g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('θB', X(sol.thBl), Y(ymin) - 8); }
    g.setLineDash([6, 4]); g.strokeStyle = col['--ink']; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(sol.th), Y(ymax)); g.lineTo(X(sol.th), Y(ymin)); g.stroke(); g.setLineDash([]);
    const c0 = P.curvaFull(sol, sol.th);
    for (const [c, k] of [[col['--serie-1'], 'p'], [col['--serie-2'], 'l']]) { g.fillStyle = c; g.beginPath(); g.arc(X(sol.th), Y(valorCurva(c0, k)), 4.5, 0, 7); g.fill(); }
  }
  // R de las capas frente a λ (400–800 nm) o frente al ángulo
  const tramoCapas = () => (eje === 'lambda' ? [400, 800] : [0, 89.5]);
  const rCapas = (x, capas) => { const [a, b] = [sol.cap.lam, sol.th]; return eje === 'lambda' ? P.capasRT(sol.m1.n, sol.m2.n, capas, x, b) : P.capasRT(sol.m1.n, sol.m2.n, capas, a, x); };
  function graficaCapas() {
    const { g, w, h } = lienzo('#capas');
    if (!sol || !sol.cap || !w || !h) return;
    const [x0, x1] = tramoCapas(), ml = 52, mr = 14, mt = 12, mb = 32, X = (v) => ml + ((v - x0) / (x1 - x0)) * (w - ml - mr), Y = (r) => h - mb - r * (h - mt - mb), N = 200;
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const r of [0, 0.25, 0.5, 0.75, 1]) { g.beginPath(); g.moveTo(ml, Y(r)); g.lineTo(w - mr, Y(r)); g.stroke(); g.fillText(`${100 * r} %`, ml - 6, Y(r)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(x0, x1, 6)) g.fillText(eje === 'lambda' ? `${v}` : `${v}°`, X(v), h - mb + 6);
    g.fillText(eje === 'lambda' ? 'longitud de onda (nm)' : 'ángulo de incidencia', (ml + w - mr) / 2, h - 14);
    const traza = (k, capas, c, trazos) => { g.save(); if (trazos) g.setLineDash([5, 4]); g.strokeStyle = c; g.lineWidth = trazos ? 1.6 : 2.4; g.beginPath(); for (let i = 0; i <= N; i++) { const x = x0 + ((x1 - x0) * i) / N, r = rCapas(x, capas)[k]; i ? g.lineTo(X(x), Y(r)) : g.moveTo(X(x), Y(r)); } g.stroke(); g.restore(); };
    g.globalAlpha = 0.9; traza('Rp', [], col['--muted'], true); g.globalAlpha = 1;
    traza('Rp', sol.cap.capas, col['--serie-1']); traza('Rl', sol.cap.capas, col['--serie-2']);
    const xd = eje === 'lambda' ? sol.cap.lam : sol.th; g.setLineDash([6, 4]); g.strokeStyle = col['--ink']; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(xd), Y(1)); g.lineTo(X(xd), Y(0)); g.stroke(); g.setLineDash([]);
  }
  const filasCapas = () => { const [x0, x1] = tramoCapas(), r = []; for (let i = 0; i <= 200; i++) { const x = x0 + ((x1 - x0) * i) / 200, c = rCapas(x, sol.cap.capas), s0 = rCapas(x, []); r.push([x, c.Rp, c.Rl, s0.Rp, s0.Rl]); } return r; };
  $('#cual').innerHTML = Object.entries(CUAL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('#cual').addEventListener('change', () => { cual = $('#cual').value; if (sol) { leyendas(); grafica(); } });
  $('#eje-capas').addEventListener('change', () => { eje = $('#eje-capas').value; if (sol) { leyendas(); graficaCapas(); } });
  Herramienta.exportar('#grafica', { nombre: 'fresnel-grafica', titulo: 'Reflectancia, transmitancia y fase', datos: () => ({ cab: ['θi (°)', 'R⊥', 'R∥', 'T⊥', 'T∥', 'fase ⊥ (°)', 'fase ∥ (°)'], filas: sol ? filasGrafica() : [] }) });
  Herramienta.exportar('#capas', { nombre: 'fresnel-capas', titulo: 'Reflectancia con capas delgadas', datos: () => ({ cab: [eje === 'lambda' ? 'λ (nm)' : 'θi (°)', 'R⊥ con capas', 'R∥ con capas', 'R⊥ sin capas', 'R∥ sin capas'], filas: sol && sol.cap ? filasCapas() : [] }) });
  const dibuja = () => { rayos(); grafica(); graficaCapas(); };
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('fresnel').current;
  colores(); formulario(); calcula();
  window.FresnelApp = { cual: (c) => { cual = c; $('#cual').value = c; if (sol) { leyendas(); grafica(); } }, abrirEjemplo, azar, enunciado, resultado: () => sol && { tt: sol.tt, rp: sol.rp, rl: sol.rl, Rp: sol.Rp, Rl: sol.Rl, tot: sol.tot }, estado: () => copia(sc) };
})();
