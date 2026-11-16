(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = TransformadaZ, f = P.f, CLAVE = 'transformada-z-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && ['sistema', 'directa', 'inversa', 'fft'].includes(g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const vacio = Herramienta.vacio;
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  const VISTAS = { sistema: [['plano', 'Plano z'], ['frec', 'Respuesta en frecuencia'], ['impulso', 'h[n]']], directa: [['plano', 'Plano z'], ['impulso', 'x[n]'], ['frec', 'Respuesta en frecuencia']], inversa: [['impulso', 'x[n]'], ['plano', 'Plano z y RDC']], fft: [['espectro', 'Espectro'], ['fase', 'Fase'], ['senal', 'Señal']] };
  const vistaActual = () => (VISTAS[sc.modo] || VISTAS.sistema).some(([k]) => k === sc.vista) ? sc.vista : (VISTAS[sc.modo] || VISTAS.sistema)[0][0];

  const fila = (k, nom, un, ph) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false"${ph ? ` placeholder="${ph}"` : ''}>`;
  const filaTxt = (k, nom, ph) => `<label for="f-${k}" class="ancho">${nom}</label><input id="f-${k}" class="in ancho" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false" placeholder="${ph}">`;
  const sel = (k, nom, ops) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${ops.map(([v, t]) => `<option value="${v}"${(sc[k] ?? ops[0][0]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  function formulario() {
    let h = sel('modo', 'Qué se calcula', [['sistema', 'Sistema H(z)'], ['directa', 'Transformada z de x[n]'], ['inversa', 'Transformada z inversa X(z) → x[n]'], ['fft', 'FFT de una señal']]);
    if (sc.modo === 'sistema') {
      h += '<div class="sep">Función de transferencia</div>' + filaTxt('b', 'Numerador b₀ b₁ b₂ …', '1 0,5') + filaTxt('a', 'Denominador a₀ a₁ a₂ …', '1 -0,9') + fila('Nn', 'Términos de h[n]', '', '12');
      $('#nota').textContent = 'Coeficientes separados por espacios, con coma decimal. Es la ecuación a₀y[n] + a₁y[n−1] + … = b₀x[n] + b₁x[n−1] + … de un sistema causal.';
    } else if (sc.modo === 'inversa') {
      h += '<div class="sep">X(z) en potencias de z⁻¹</div>' + filaTxt('b', 'Numerador b₀ b₁ b₂ …', '1 0,5') + filaTxt('a', 'Denominador a₀ a₁ a₂ …', '1 -0,9');
      const ops = P.opcionesRoc(sc), ri = Math.max(0, Math.min(ops.length - 1, vacio(sc.roc) ? ops.length - 1 : +sc.roc));
      h += `<label for="f-roc" class="ancho">Región de convergencia (RDC)</label><select id="f-roc" class="in ancho" data-k="roc">${ops.map((t, i) => `<option value="${i}"${i === ri ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>` + fila('Nn', 'Términos mostrados', '', '10');
      $('#nota').textContent = 'X(z) = (b₀ + b₁z⁻¹ + …)/(a₀ + a₁z⁻¹ + …). La región de convergencia decide si la señal es causal, anticausal o bilateral; las opciones salen de los módulos de los polos.';
    } else if (sc.modo === 'directa') {
      h += sel('tipo', 'Señal x[n]', Object.entries(P.TIPOS_DIRECTA));
      if (sc.tipo === 'exp' || sc.tipo === 'coseno') h += fila('a', 'Base a');
      if (sc.tipo === 'coseno') h += fila('w', 'Ω₀', 'rad/muestra', 'π/4');
      if (!sc.tipo || sc.tipo === 'finita') h += filaTxt('x', 'Valores x[0] x[1] x[2] …', '1 2 3');
      h += fila('Nn', 'Términos mostrados', '', '12');
      $('#nota').textContent = 'Señales causales (x[n] = 0 para n < 0). Ω₀ admite π/4, 0,25π o un número en radianes.';
    } else {
      h += sel('senal', 'Señal', [['tonos', 'Suma de tonos (coseno)'], ['muestras', 'Muestras escritas']]) + fila('fs', 'Frecuencia de muestreo fₛ', 'Hz');
      if (sc.senal === 'muestras') h += filaTxt('x', 'Muestras x[0] x[1] …', '1 2 3 4');
      else h += fila('N', 'Número de muestras N', 'potencia de 2') + '<div class="sep">Tonos (amplitud y frecuencia)</div>' + [1, 2, 3].map((i) => fila('a' + i, `Tono ${i}: amplitud`) + fila('f' + i, `Tono ${i}: frecuencia`, 'Hz')).join('') + fila('dc', 'Nivel de continua');
      h += '<div class="sep">Análisis</div>' + sel('ventana', 'Ventana', Object.entries(P.VENTANAS).map(([k, v]) => [k, v.nombre])) + sel('escala', 'Escala del espectro', [['lin', 'Lineal'], ['db', 'Decibelios']]) + fila('pad', 'Relleno de ceros hasta', 'puntos, opcional', 'p. ej. 256');
      $('#nota').textContent = 'N se redondea a potencias de 2. Una frecuencia mayor que fₛ/2 se pliega (aliasing). Para pegar muestras de una hoja de cálculo, una por línea (o separadas por «;» o espacios; la coma es decimal).';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (sc.modo === 'inversa' && t.dataset.k === 'a') {   // las regiones posibles dependen de los polos: se rehace solo el desplegable
      const ops = P.opcionesRoc(sc), ri = Math.max(0, Math.min(ops.length - 1, vacio(sc.roc) ? ops.length - 1 : +sc.roc)), rs = $('#f-roc');
      if (rs) rs.innerHTML = ops.map((q, i) => `<option value="${i}"${i === ri ? ' selected' : ''}>${esc(q)}</option>`).join('');
    }
    if (['modo', 'tipo', 'senal'].includes(t.dataset.k)) { if (t.dataset.k === 'modo') sc.vista = undefined; formulario(); }
    calcula();
  });

  const selEj = $('#ejemplos');
  selEj.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  selEj.addEventListener('change', () => { if (selEj.value) abrirEjemplo(selEj.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); selEj.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), c = (x) => String(x).replace('.', ',');
    const t = ent(0, 2);
    if (t === 0) sc = { modo: 'sistema', b: '1', a: `1 ${c(-ent(1, 9) / 10)}`, Nn: '8' };
    else if (t === 1) sc = { modo: 'sistema', b: String(ent(1, 3)), a: `1 ${c(-(ent(1, 9) / 10 + ent(1, 9) / 10).toFixed(1))} ${c((ent(1, 4) / 10 * ent(1, 4) / 10).toFixed(2))}`, Nn: '8' };
    else sc = { modo: 'directa', tipo: 'exp', a: c(ent(1, 9) / 10), Nn: '8' };
    formulario(); calcula(); selEj.value = '';
  }
  const enunciado = () => sc.modo === 'directa'
    ? `Calcula la transformada z de <b>x[n] = ${esc(sc.a)}<sup>n</sup>·u[n]</b>: sus polos, el módulo y los primeros valores.`
    : `Del sistema con <b>b = (${esc(sc.b)})</b> y <b>a = (${esc(sc.a)})</b>: halla los polos, el módulo del mayor y los primeros valores de h[n]. ¿Es estable?`;

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; pestanas(); dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.modo === 'fft') {
      const p = sol.pk[0];
      h += dato('Resolución Δf = fₛ/N', `${f(sol.df)} Hz`, 'num') + dato('Nyquist fₛ/2', `${f(sol.fs / 2)} Hz`, 'num');
      h += p ? dato('Pico principal', `${f(p.f, 5)} Hz, amplitud ${f(p.amp, 4)}`, 'num ancho') : '';
      if (sol.pk.length > 1) h += dato('Otros picos', sol.pk.slice(1).map((q) => `${f(q.f, 5)} Hz (${f(q.amp, 3)})`).join(';  '), 'ancho');
      h += dato('Multiplicaciones', `FFT ${f(sol.fftMul, 6)} frente a DFT ${f(sol.dftMul, 6)}`, 'ancho');
      if (sol.alias.length) h += dato('Aliasing', sol.alias.map((a) => `${f(a.f)} Hz → ${f(a.alias)} Hz`).join(';  '), 'ancho');
      if (sol.fugas) h += dato('Fuga espectral', 'hay tonos entre dos bins: prueba con una ventana', 'ancho');
    } else if (sol.modo === 'inversa') {
      h += dato('Región de convergencia', esc(sol.roc), 'ancho') + dato('Tipo de señal', { causal: 'Causal (x[n] = 0 para n < 0)', anticausal: 'Anticausal (x[n] = 0 para n > 0)', bilateral: 'Bilateral', finita: 'Finita' }[sol.lado], 'num');
      h += dato('¿Contiene |z| = 1?', sol.contieneCirc ? 'Sí: existe X(e^{jω}) y x[n] es sumable' : 'No: x[n] no es absolutamente sumable', 'num');
      h += dato('Polos', sol.polos.length ? M(sol.polos.map((r) => P.fc(r.p) + (r.m > 1 ? ` (×${r.m})` : '')).join(';  ')) : 'ninguno', 'ancho');
      h += dato('x[n]', Mates.html('$' + (sol.pasos.find((q) => q.t === 'Resultado x[n]') || { html: '' }).html.replace(/^\$x\[n\] = /, '').replace(/\$$/, '') + '$'), 'ancho');
    } else {
      if (sol.modo === 'directa') h += dato('X(z)', M(sol.X), 'ancho') + dato('Región de convergencia', Mates.html(sol.roc), 'ancho');
      if (sol.cancel && sol.cancel.length) h += dato('Cancelación polo-cero', sol.cancel.map((c) => M(P.fc(c.p)) + (c.m > 1 ? ` (×${c.m})` : '')).join(';  '), 'ancho');
      if (sol.nulo) h += dato('Aviso', 'H(z) = 0: la salida es siempre 0', 'ancho');
      h += dato('Estabilidad', { estable: 'Estable', marginal: 'Marginalmente estable', inestable: 'Inestable' }[sol.estab], 'num');
      h += dato('|p| máximo', f(sol.rmax, 5), 'num');
      h += dato('Polos', sol.polos.length ? M(sol.polos.map((r) => P.fc(r.p) + (r.m > 1 ? ` (×${r.m})` : '')).join(';  ')) : 'ninguno (FIR)', 'ancho');
      h += dato('Ceros', sol.ceros.length ? M(sol.ceros.map((r) => P.fc(r.p) + (r.m > 1 ? ` (×${r.m})` : '')).join(';  ')) : 'ninguno', 'ancho');
      h += dato('H(1), continua', isFinite(sol.H1) ? f(sol.H1, 5) : '∞', 'num') + dato('H(−1), Nyquist', isFinite(sol.Hn) ? f(sol.Hn, 5) : '∞', 'num');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}${p.tabla ? Mates.html(p.tabla) : ''}</li>`).join('');
    pestanas(); dibuja();
  }

  function pestanas() {
    const v = vistaActual();
    $('#vistas').innerHTML = (VISTAS[sc.modo] || VISTAS.sistema).map(([k, t]) => `<button type="button" role="tab" data-vista="${k}" aria-selected="${k === v}">${t}</button>`).join('');
    $('#grafica').setAttribute('aria-label', 'Gráfica: ' + ((VISTAS[sc.modo] || []).find(([k]) => k === v) || ['', ''])[1]);
  }
  $('#vistas').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; sc.vista = b.dataset.vista; guarda(); pestanas(); dibuja(); });

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  const fuente = (g, px = 12) => { g.font = `${px}px system-ui, sans-serif`; };
  function ejes(g, w, h, m, x0, x1, y0, y1, ex, ey, tx, ty) {
    const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (w - m.l - m.r), Y = (y) => h - m.b - ((y - y0) / (y1 - y0)) * (h - m.t - m.b);
    fuente(g); g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const y of marcas(y0, y1, ey)) { g.beginPath(); g.moveTo(m.l, Y(y)); g.lineTo(w - m.r, Y(y)); g.stroke(); g.fillText(txt(f(y, 3)), m.l - 6, Y(y)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const x of marcas(x0, x1, ex)) g.fillText(txt(f(x, 3)), X(x), h - m.b + 6);
    if (tx) { g.textAlign = 'right'; g.fillText(tx, w - m.r, h - 16); }
    if (ty) { g.save(); g.translate(12, m.t + (h - m.t - m.b) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(ty, 0, 0); g.restore(); }
    return { X, Y };
  }
  function tallos(g, X, Y, xs, ys, base, color) {
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = xs.length > 80 ? 1.4 : 2;
    xs.forEach((x, i) => { g.beginPath(); g.moveTo(X(x), Y(base)); g.lineTo(X(x), Y(ys[i])); g.stroke(); if (xs.length <= 80) { g.beginPath(); g.arc(X(x), Y(ys[i]), 3.2, 0, 2 * Math.PI); g.fill(); } });
  }
  function dibujaPlano(g, w, h) {
    const todos = [...sol.polos, ...sol.ceros].map((r) => P.cabs(r.p)), R = Math.max(1.4, 1.25 * Math.max(0, ...todos));
    const lado = Math.min(w, h) - 24, cx = w / 2, cy = h / 2, s = lado / 2 / R, X = (x) => cx + x * s, Y = (y) => cy - y * s;
    if (sol.modo === 'inversa') {
      const [r0, r1] = sol.rocRango, rr = Math.min(r1, R * 1.6);
      g.fillStyle = col['--accent-soft'] || 'rgba(120,120,255,.2)'; g.beginPath(); g.arc(cx, cy, rr * s, 0, 2 * Math.PI); if (r0 > 0) g.arc(cx, cy, r0 * s, 0, 2 * Math.PI, true); g.fill('evenodd');
    }
    g.strokeStyle = col['--line']; g.lineWidth = 1; fuente(g); g.fillStyle = col['--muted'];
    g.beginPath(); g.moveTo(cx - lado / 2, cy); g.lineTo(cx + lado / 2, cy); g.moveTo(cx, cy - lado / 2); g.lineTo(cx, cy + lado / 2); g.stroke();
    g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.arc(cx, cy, s, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('Re', cx + lado / 2 - 18, cy + 4); g.fillText('Im', cx + 5, cy - lado / 2);
    g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('1', X(1), cy + 4); g.fillText('−1', X(-1), cy + 4);
    g.lineWidth = 2.2;
    for (const r of sol.ceros) { g.strokeStyle = col['--serie-1']; g.beginPath(); g.arc(X(r.p[0]), Y(r.p[1]), 6, 0, 2 * Math.PI); g.stroke(); if (r.m > 1) { g.fillStyle = col['--serie-1']; g.textAlign = 'left'; g.fillText('×' + r.m, X(r.p[0]) + 8, Y(r.p[1]) - 16); } }
    for (const r of sol.polos) { const x = X(r.p[0]), y = Y(r.p[1]); g.strokeStyle = col['--serie-2']; g.beginPath(); g.moveTo(x - 5, y - 5); g.lineTo(x + 5, y + 5); g.moveTo(x + 5, y - 5); g.lineTo(x - 5, y + 5); g.stroke(); if (r.m > 1) { g.fillStyle = col['--serie-2']; g.textAlign = 'left'; g.fillText('×' + r.m, x + 8, y - 16); } }
    $('#leyenda').innerHTML = sol.modo === 'inversa' ? `Plano z: la zona sombreada es la región de convergencia (${esc(sol.roc)}); ${Mates.html('$×$')} polos, ○ ceros y circunferencia unidad discontinua.` : `Plano z: ${Mates.html('$×$')} polos, ○ ceros y circunferencia unidad discontinua (el sistema causal es estable si todos los polos quedan dentro).`;
  }
  function dibujaFrec(g, w, h) {
    const { w: om, mag, fase } = sol.resp, db = mag.map((m) => 20 * Math.log10(Math.max(m, 1e-6)));
    const hmax = Math.max(...db), hmin = Math.max(Math.min(...db), hmax - 80);
    const y1 = Math.ceil(hmax / 10) * 10 + 5, y0 = Math.max(hmin - 5, y1 - 80), mitad = h / 2;
    const m1 = { l: 56, r: 14, t: 10, b: 20 }, x = (i) => om[i] / Math.PI;
    let { X, Y } = ejes(g, w, mitad + 8, m1, 0, 1, y0, y1, 5, 4, '', '|H| (dB)');
    g.strokeStyle = col['--serie-1']; g.lineWidth = 2.2; g.beginPath();
    db.forEach((v, i) => { const yy = Y(Math.min(y1, Math.max(y0, v))); i ? g.lineTo(X(x(i)), yy) : g.moveTo(X(x(i)), yy); }); g.stroke();
    g.save(); g.translate(0, mitad);
    const m2 = { l: 56, r: 14, t: 12, b: 28 };
    ({ X, Y } = ejes(g, w, mitad, m2, 0, 1, -180, 180, 5, 4, 'ω/π (rad/muestra)', 'fase (°)'));
    g.strokeStyle = col['--serie-2']; g.lineWidth = 2.2; g.beginPath();
    fase.forEach((v, i) => { const yy = Y((v * 180) / Math.PI); i ? g.lineTo(X(x(i)), yy) : g.moveTo(X(x(i)), yy); }); g.stroke();
    g.restore();
    $('#leyenda').textContent = 'Módulo (arriba, en dB) y fase (abajo) de H(e^{jω}) entre 0 y la frecuencia de Nyquist (ω = π).' + (sol.estab === 'inestable' ? ' Con un polo fuera de la circunferencia unidad esta respuesta solo es formal: el sistema no tiene respuesta en frecuencia real.' : '');
  }
  function dibujaImpulso(g, w, h) {
    const hs = sol.modo === 'inversa' ? sol.xs : sol.h, n = sol.modo === 'inversa' ? sol.ns : hs.map((_, i) => i), my = Math.max(...hs.map(Math.abs), 1e-9), y1 = my * 1.12, y0 = Math.min(0, ...hs) < 0 ? -y1 : -y1 * 0.08;
    const { X, Y } = ejes(g, w, h, { l: 56, r: 14, t: 12, b: 28 }, n[0] - 0.5, n[n.length - 1] + 0.5, y0, y1, 6, 4, 'n', sol.modo === 'directa' || sol.modo === 'inversa' ? 'x[n]' : 'h[n]');
    tallos(g, X, Y, n, hs, 0, col['--serie-1']);
    $('#leyenda').textContent = sol.modo === 'inversa' ? `Señal x[n] para n de ${n[0]} a ${n[n.length - 1]}, según la región de convergencia elegida (${sol.lado}).` : sol.modo === 'directa' ? 'Valores de x[n] (los coeficientes de la serie en z⁻ⁿ).' : 'Respuesta al impulso h[n] calculada por la recursión de la ecuación en diferencias.';
  }
  function dibujaEspectro(g, w, h) {
    const db = sc.escala === 'db', amp = sol.amp, mx = Math.max(...amp, 1e-12);
    const val = db ? amp.map((a) => Math.max(20 * Math.log10(Math.max(a, 1e-9) / mx), -100)) : amp;
    const y1 = db ? 0 : mx * 1.1, y0 = db ? -100 : 0;
    const { X, Y } = ejes(g, w, h, { l: 56, r: 14, t: 12, b: 28 }, 0, sol.fs / 2, y0, y1 + (db ? 5 : 0), 6, 4, 'Hz', db ? 'dB' : 'amplitud');
    tallos(g, X, Y, sol.frec, val, y0, col['--accent']);
    $('#leyenda').textContent = `Espectro de amplitud de 0 a fₛ/2 = ${txt(f(sol.fs / 2))} Hz, con ${sol.amp.length} bins separados ${txt(f(sol.dfBin))} Hz${sol.M > sol.N ? ` (con relleno de ceros; la resolución real es ${txt(f(sol.df))} Hz)` : ''}.`;
  }
  function dibujaFase(g, w, h) {
    const { X, Y } = ejes(g, w, h, { l: 56, r: 14, t: 12, b: 28 }, 0, sol.fs / 2, -180, 180, 6, 4, 'Hz', 'fase (°)');
    tallos(g, X, Y, sol.frec, sol.fase, 0, col['--serie-2']);
    $('#leyenda').textContent = 'Fase de cada bin en grados (se pone 0 donde la amplitud es casi nula: ahí la fase es solo ruido numérico). Un coseno sin desfase da 0° en su frecuencia si cae justo en un bin.';
  }
  function dibujaSenal(g, w, h) {
    const N = sol.N, my = Math.max(...sol.x.map(Math.abs), 1e-9) * 1.15, t = (n) => (n / sol.fs);
    const { X, Y } = ejes(g, w, h, { l: 56, r: 14, t: 12, b: 28 }, 0, t(N - 1), -my, my, 6, 4, 's', 'x');
    g.strokeStyle = col['--muted']; g.lineWidth = 1.4; g.beginPath(); sol.x.forEach((v, i) => (i ? g.lineTo(X(t(i)), Y(v)) : g.moveTo(X(t(i)), Y(v)))); g.stroke();
    if (sol.ventana !== 'rect') { g.strokeStyle = col['--accent']; g.lineWidth = 2.2; g.beginPath(); sol.xw.forEach((v, i) => (i ? g.lineTo(X(t(i)), Y(v)) : g.moveTo(X(t(i)), Y(v)))); g.stroke(); }
    $('#leyenda').textContent = sol.ventana === 'rect' ? `Señal muestreada: ${N} muestras (${txt(f(N / sol.fs))} s).` : 'Señal original en gris y señal multiplicada por la ventana en color.';
  }
  function datosGrafica() {
    if (!sol) return null;
    const v = vistaActual();
    if (sol.modo === 'fft') return v === 'senal' ? { cab: ['n', 't (s)', 'x[n]', 'x[n]·w[n]'], filas: sol.x.map((x, n) => [n, n / sol.fs, x, sol.xw[n]]) } : { cab: ['f (Hz)', 'Amplitud', 'Fase (°)'], filas: sol.frec.map((fr, k) => [fr, sol.amp[k], sol.fase ? sol.fase[k] : null]) };
    if (v === 'plano') return { cab: ['Tipo', 'Re', 'Im', 'Multiplicidad'], filas: [...sol.polos.map((r) => ['polo', r.p[0], r.p[1], r.m]), ...sol.ceros.map((r) => ['cero', r.p[0], r.p[1], r.m])] };
    if (v === 'frec') return { cab: ['ω (rad/muestra)', '|H|', 'Fase (rad)'], filas: sol.resp.w.map((om, i) => [om, sol.resp.mag[i], sol.resp.fase[i]]) };
    return sol.modo === 'inversa' ? { cab: ['n', 'x[n]'], filas: sol.ns.map((n, i) => [n, sol.xs[i]]) } : { cab: ['n', sol.modo === 'directa' ? 'x[n]' : 'h[n]'], filas: sol.h.map((x, n) => [n, x]) };
  }
  function dibuja() {
    Herramienta.exportar('#grafica', { nombre: `transformada-z-${sc.modo}-${vistaActual()}`, titulo: 'Transformada z y FFT', datos: datosGrafica });
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const v = vistaActual();
    if (sol.modo === 'fft') (v === 'senal' ? dibujaSenal : v === 'fase' ? dibujaFase : dibujaEspectro)(g, w, h);
    else ({ plano: dibujaPlano, frec: dibujaFrec, impulso: dibujaImpulso })[v](g, w, h);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('transformada-z').current;
  colores(); formulario(); calcula();
  window.TransformadaZApp = {
    abrirEjemplo, azar, enunciado, estado: () => copia(sc),
    resultado: () => sol && (sol.modo === 'inversa' ? { lado: sol.lado, roc: sol.roc, estab: sol.estab, x: sol.xs.slice(0, 4) } : sol.modo === 'fft' ? { fres: sol.df, pico: sol.pk[0] && sol.pk[0].f, amp: sol.pk[0] && sol.pk[0].amp } : { rmax: sol.rmax, h1: sol.h[1], h2: sol.h[2], h3: sol.h[3], estab: sol.estab }),
  };
})();

