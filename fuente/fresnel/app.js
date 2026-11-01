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
    $('#campos').innerHTML = h;
    $('#nota').textContent = 'El ángulo se mide desde la normal a la superficie. La amplitud da los campos reflejado y transmitido; la longitud de onda, la profundidad de la onda evanescente en la reflexión total. Se admite coma decimal.';
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
    sc = { dato: 'n', n1: c(n1), n2: c(n2), theta: String(de([10, 20, 25, 30, 35, 40, 45, 50, 60, 70])), E0: de(['', '10', '20']), lambda: '' };
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
      $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
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
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#leyenda').textContent = 'Reflectancia según el ángulo de incidencia: ⊥ en azul, ∥ en rojo. La línea vertical marca el ángulo de los datos.';
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
  function grafica() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const ml = 48, mr = 14, mt = 12, mb = 32, X = (a) => ml + (a / 90) * (w - ml - mr), Y = (r) => h - mb - r * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const r of [0, 0.25, 0.5, 0.75, 1]) { g.beginPath(); g.moveTo(ml, Y(r)); g.lineTo(w - mr, Y(r)); g.stroke(); g.fillText(`${100 * r} %`, ml - 6, Y(r)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const a of marcas(0, 90, 6)) g.fillText(`${a}°`, X(a), h - mb + 6);
    g.fillText('ángulo de incidencia', (ml + w - mr) / 2, h - 14);
    const traza = (campo, c) => {
      g.strokeStyle = c; g.lineWidth = 2.4; g.beginPath();
      for (let i = 0; i <= 180; i++) { const a = i / 2, r = P.curva(sol, a)[campo]; i ? g.lineTo(X(a), Y(r)) : g.moveTo(X(a), Y(r)); }
      g.stroke();
    };
    traza('Rp', col['--serie-1']); traza('Rl', col['--serie-2']);
    // ángulo crítico, Brewster y ángulo de los datos
    g.font = '12px system-ui, sans-serif';
    if (sol.thc !== null) { g.setLineDash([3, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(sol.thc), Y(1)); g.lineTo(X(sol.thc), Y(0)); g.stroke(); g.setLineDash([]); g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText('θc', X(sol.thc) - 4, Y(1) + 14); }
    if (sol.thBl !== null) { g.fillStyle = col['--serie-2']; g.beginPath(); g.arc(X(sol.thBl), Y(0), 4, 0, 7); g.fill(); g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('θB', X(sol.thBl), Y(0) - 8); }
    g.setLineDash([6, 4]); g.strokeStyle = col['--ink']; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(sol.th), Y(1)); g.lineTo(X(sol.th), Y(0)); g.stroke(); g.setLineDash([]);
    for (const [c, r] of [[col['--serie-1'], sol.Rp], [col['--serie-2'], sol.Rl]]) { g.fillStyle = c; g.beginPath(); g.arc(X(sol.th), Y(r), 4.5, 0, 7); g.fill(); }
  }
  const dibuja = () => { rayos(); grafica(); };
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('fresnel').current;
  colores(); formulario(); calcula();
  window.FresnelApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { tt: sol.tt, rp: sol.rp, rl: sol.rl, Rp: sol.Rp, Rl: sol.Rl, tot: sol.tot }, estado: () => copia(sc) };
})();
