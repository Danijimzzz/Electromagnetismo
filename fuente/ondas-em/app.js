/* =====================================================================
   Ondas electromagnéticas planas: interfaz (formulario por modo,
   resultado, dibujo en perspectiva de E y B a lo largo de la dirección de
   propagación, con la atenuación en un medio con pérdidas, o los frentes
   de onda de una fuente puntual, y el desarrollo).
   El cálculo está en ondasem/fisica.js (OndasEM).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const O = OndasEM, f = O.f, CLAVE = 'ondasem-v1';
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<sub>(.*?)<\/sub>/g, (_, e) => e.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['onda', 'Onda plana: E, B y su expresión'], ['intensidad', 'Intensidad y presión de radiación'], ['perdidas', 'Medio con pérdidas (conductor)']];
  const DIRS = ['+x', '-x', '+y', '-y', '+z', '-z'].map((d) => [d, d.replace('-', '−')]);

  let sc = copia(O.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const DATO = [['f', 'Frecuencia f'], ['lambda', 'Longitud de onda λ'], ['omega', 'Frecuencia angular ω'], ['k', 'Número de onda k']], UN = { f: 'Hz', lambda: 'm', omega: 'rad/s', k: 'rad/m' };
  const medioF = () => elige('medio', 'Medio', [['vacio', 'Vacío (o aire)'], ['medio', 'Un material (εr, μr)']]) + (sc.medio === 'medio' ? fila('er', 'Permitividad relativa ε<sub>r</sub>') + fila('mr', 'Permeabilidad relativa μ<sub>r</sub>', 'opcional, 1') : '');
  const NOTAS = {
    onda: 'Se admite 3e8, 3·10^8 o 10^8. La onda se escribe como E₀ cos(k·r − ωt): si avanza hacia −z sale cos(kz + ωt). E tiene que ser perpendicular a la dirección de propagación.',
    intensidad: 'La intensidad es el valor medio del vector de Poynting. Una fuente puntual la reparte en una esfera, así que baja como 1/r².',
    perdidas: 'Con conductividad σ la onda se atenúa como e^(−αz). Si σ/(ωε) es mucho mayor que 1 el medio es un buen conductor y la onda apenas entra (efecto pelicular).',
  };
  function formulario() {
    let h = elige('modo', 'Cálculo', MODOS);
    if (sc.modo === 'onda') h += medioF() + elige('dato', 'Dato de la onda', DATO) + fila('valor', DATO.find(([k]) => k === (sc.dato || 'f'))[1], UN[sc.dato || 'f']) + fila('E0', 'Amplitud E<sub>0</sub>', 'V/m') + sep('Direcciones') + elige('prop', 'Se propaga hacia', DIRS) + elige('pol', 'E apunta hacia', DIRS);
    else if (sc.modo === 'intensidad') {
      h += medioF() + elige('de', 'Dato', [['fuente', 'Potencia de una fuente y distancia'], ['I', 'La intensidad I'], ['E0', 'La amplitud E₀']]);
      h += sc.de === 'fuente' ? fila('P', 'Potencia P', 'W') + fila('r', 'Distancia r', 'm') : sc.de === 'I' ? fila('I', 'Intensidad I', 'W/m²') : fila('E0', 'Amplitud E<sub>0</sub>', 'V/m');
      h += sep('Opcional') + fila('A', 'Área de la superficie A', 'm²');
    } else h += fila('sigma', 'Conductividad σ', 'S/m') + fila('er', 'Permitividad relativa ε<sub>r</sub>') + fila('mr', 'Permeabilidad relativa μ<sub>r</sub>', 'opcional, 1') + fila('valor', 'Frecuencia f', 'Hz') + sep('Opcional') + fila('E0', 'Amplitud al entrar E<sub>0</sub>', 'V/m') + fila('d', 'Profundidad z', 'm');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(O.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else {
      sc[k] = t.value;
      if (k === 'medio' && t.value === 'medio' && !sc.er) sc.er = '4';
      // E perpendicular a k: si coinciden, se cambia la otra
      if ((k === 'prop' || k === 'pol') && sc.prop.slice(-1) === sc.pol.slice(-1)) { const libre = 'xyz'.split('').find((c) => c !== sc.prop.slice(-1)); if (k === 'prop') sc.pol = '+' + libre; else sc.prop = '+' + 'xyz'.split('').find((c) => c !== sc.pol.slice(-1)); }
    }
    formulario(); cambia();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${O.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = O.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipos = [
      () => { const p = de(['+x', '-x', '+y', '-y', '+z', '-z']), libres = 'xyz'.split('').filter((q) => q !== p.slice(-1)); return { modo: 'onda', medio: Math.random() < 0.7 ? 'vacio' : 'medio', er: de(['2', '4', '9']), mr: '', dato: de(['f', 'f', 'lambda', 'k']), valor: '', E0: String(de([10, 20, 50, 100, 300])), prop: p, pol: de(['+', '-']) + de(libres) }; },
      () => ({ modo: 'intensidad', medio: 'vacio', de: de(['fuente', 'I', 'E0']), P: String(de([60, 100, 500, 1000, 50000])), r: String(de([1, 2, 5, 10, 100])), I: String(de([10, 100, 500, 1000, 1361])), E0: String(de([10, 50, 100, 500])), A: Math.random() < 0.5 ? '' : String(de([1, 2, 10])) }),
      () => ({ modo: 'perdidas', er: de(['1', '10', '81']), mr: '', sigma: de(['5,8e7', '3,5e7', '4', '0,01']), valor: de(['50', '1e3', '1e6', '1e8']), E0: String(de([1, 10, 100])), d: '' }),
    ];
    sc = de(tipos)();
    if (sc.modo === 'onda') sc.valor = { f: de(['1e6', '1e8', '3e9', '5e14']), lambda: de(['3', '0,1', '500e-9']), k: c(de([0.5, 1, 2, 10])) }[sc.dato];
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'onda') {
      const dato = { f: `frecuencia ${esc(sc.valor)} Hz`, lambda: `longitud de onda ${esc(sc.valor)} m`, omega: `frecuencia angular ${esc(sc.valor)} rad/s`, k: `número de onda ${esc(sc.valor)} rad/m` }[sc.dato || 'f'];
      return `Una onda electromagnética plana de ${dato} y amplitud E₀ = ${esc(sc.E0)} V/m se propaga hacia ${esc(sc.prop)} ${sc.medio === 'medio' ? `en un medio con εr = ${esc(sc.er)}` : 'en el vacío'}, con E en la dirección ${esc(sc.pol)}. Calcula λ, k, ω, el campo B y su dirección, escribe E y B y calcula la intensidad.`;
    }
    if (sc.modo === 'intensidad') return sc.de === 'fuente' ? `Una fuente puntual emite ${esc(sc.P)} W por igual en todas direcciones. Calcula la intensidad a ${esc(sc.r)} m, las amplitudes de E y B y la presión de radiación.` : sc.de === 'I' ? `Una onda tiene una intensidad de ${esc(sc.I)} W/m². Calcula E₀, B₀, la densidad de energía y la presión de radiación${sc.A ? ` y la fuerza sobre ${esc(sc.A)} m²` : ''}.` : `El campo eléctrico de una onda tiene amplitud ${esc(sc.E0)} V/m. Calcula la intensidad, B₀ y la presión de radiación.`;
    return `Una onda de ${esc(sc.valor)} Hz entra en un medio con σ = ${esc(sc.sigma)} S/m y εr = ${esc(sc.er)}. ¿Es un buen conductor? Calcula α, β, la profundidad de penetración y la impedancia.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = O.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h;
    if (sol.modo === 'onda') {
      h = dato('Longitud de onda', `λ = <b>${f(sol.F.lam)} m</b>`) + dato('Número de onda', `k = <b>${f(sol.F.k)} rad/m</b>`) + dato('Frecuencia angular', `ω = ${f(sol.F.w)} rad/s`) + dato('Frecuencia', `f = ${f(sol.F.fr)} Hz`)
        + dato('Amplitud de B', `B<sub>0</sub> = <b>${f(sol.B0)} T</b>`) + dato('Intensidad', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Campo eléctrico', sol.Eexp, 'ancho') + dato('Campo magnético', sol.Bexp, 'ancho');
    } else if (sol.modo === 'intensidad') {
      h = dato('Intensidad', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Amplitud de E', `E<sub>0</sub> = <b>${f(sol.E0)} V/m</b>`) + dato('Amplitud de B', `B<sub>0</sub> = <b>${f(sol.B0)} T</b>`) + dato('Densidad de energía', `u = ${f(sol.u)} J/m<sup>3</sup>`) + dato('Presión (absorbe)', `p = ${f(sol.pa)} Pa`);
      if (sol.A !== null) h += dato('Fuerza (absorbe)', `F = ${f(sol.pa * sol.A)} N`);
    } else {
      h = dato('Tipo de medio', `<b>${sol.tipo}</b>`) + dato('σ/(ωε)', `${f(sol.tg)}`) + dato('Atenuación', `α = <b>${f(sol.alfa)} Np/m</b>`) + dato('Constante de fase', `β = ${f(sol.beta)} rad/m`) + dato('Profundidad de penetración', `δ = <b>${f(sol.delta)} m</b>`) + dato('Impedancia', `|η| = ${f(sol.etaM)} Ω`);
      if (sol.Ed !== null) h += dato(`E a z = ${f(sol.d)} m`, `<b>${f(sol.Ed)} V/m</b>`);
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#leyenda').innerHTML = sol.modo === 'intensidad' && sol.de === 'fuente' ? 'Frentes de onda esféricos que salen de la fuente: la misma potencia se reparte en esferas cada vez mayores.' : `E en rojo, B en azul y la dirección de propagación (el vector de Poynting) en naranja${sol.modo === 'perdidas' && sol.alfa > 0 ? '; la línea discontinua es la envolvente e<sup>−αz</sup> y la marca, la profundidad δ' : ''}.`;
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--bg', '--e', '--b', '--s']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = () => Herramienta.lienzo('#escena');
  const FU = '"IBM Plex Sans", system-ui, sans-serif';
  const flecha = (g, x0, y0, x1, y1, c, ancho = 2) => {
    const L = Math.hypot(x1 - x0, y1 - y0); if (L < 1.5) return;
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(8, L * 0.4);
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = ancho; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - p * 0.6 * Math.cos(a), y1 - p * 0.6 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  };
  function dibuja() {
    const { g, w, h } = lienzo();
    if (!sol) return;
    if (!col['--ink']) colores();
    if (sol.modo === 'intensidad' && sol.de === 'fuente') return fuente(g, w, h);
    plana(g, w, h);
  }
  // onda plana en perspectiva: el eje de propagación en horizontal, E en vertical y B en profundidad
  function plana(g, w, h) {
    const per = sol.modo !== 'perdidas';
    const kEje = per && sol.K ? sol.K.eje : 'z', eEje = per && sol.Ed ? sol.Ed.eje : 'x', bEje = per && sol.Bv ? 'xyz'[sol.Bv.findIndex((c) => Math.abs(c) > 0.5)] : 'y';
    const sk = per && sol.K ? sol.K.signo : 1, se = per && sol.Ed ? sol.Ed.signo : 1, sb = per && sol.Bv ? Math.sign(sol.Bv.find((c) => Math.abs(c) > 0.5)) : 1;
    const lam = sol.modo === 'perdidas' ? sol.lam : sol.modo === 'onda' ? sol.F.lam : 1, alfa = sol.modo === 'perdidas' ? sol.alfa : 0;
    // tramo que se ve: dos longitudes de onda, o unas cuatro profundidades si la onda se apaga antes
    const L = alfa > 0 && 4 / alfa < 2 * lam ? 4 / alfa : 2 * lam;
    const A = Math.min(h * 0.32, 110), dx = -0.55, dy = 0.42, Bs = A * 0.85, x0 = Math.round((Bs + 30) * -dx + 24), x1 = w - 30, yc = h * 0.5;
    const P = (s, e, b) => [x0 + ((x1 - x0) * s) / L + b * dx, yc - e + b * dy]; // s en metros a lo largo de la propagación
    const t = tA * 0.6, fase = (s) => 2 * Math.PI * (s / lam) - 2 * Math.PI * t;
    g.lineWidth = 1; g.strokeStyle = col['--line']; g.font = `12px ${FU}`;
    // ejes
    flecha(g, x0 - 20, yc, x1 + 18, yc, col['--muted'], 1.2);
    flecha(g, x0, yc + A * 0.15, x0, yc - A - 18, col['--muted'], 1.2);
    flecha(g, x0, yc, x0 + (Bs + 26) * dx, yc + (Bs + 26) * dy, col['--muted'], 1.2);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(`${sk > 0 ? '+' : '−'}${kEje}`, x1 + 4, yc - 12); g.fillText(`${se > 0 ? '+' : '−'}${eEje}`, x0 + 6, yc - A - 14); g.fillText(`${sb > 0 ? '+' : '−'}${bEje}`, x0 + (Bs + 30) * dx + 8, yc + (Bs + 30) * dy + 4);
    // envolvente con pérdidas
    if (alfa > 0) {
      g.setLineDash([5, 4]); g.strokeStyle = col['--e']; g.globalAlpha = 0.6; g.beginPath();
      for (let i = 0; i <= 100; i++) { const s = (L * i) / 100, [x, y] = P(s, A * Math.exp(-alfa * s), 0); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.globalAlpha = 1; g.setLineDash([]);
      const d = 1 / alfa; if (d < L) { const [x] = P(d, 0, 0); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(x, yc + 6); g.lineTo(x, yc - 6); g.stroke(); g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('δ', x, yc + 8); }
    }
    const th = sol.modo === 'perdidas' ? sol.th : 0, n = 44;
    // vectores E y B en cada punto y las curvas que unen sus puntas
    const puntas = (fn) => { g.beginPath(); for (let i = 0; i <= 200; i++) { const s = (L * i) / 200, [x, y] = fn(s); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    g.lineWidth = 2; g.strokeStyle = col['--b']; puntas((s) => P(s, 0, Bs * Math.exp(-alfa * s) * Math.cos(fase(s) - th)));
    for (let i = 0; i <= n; i++) { const s = (L * i) / n, v = Bs * Math.exp(-alfa * s) * Math.cos(fase(s) - th), a = P(s, 0, 0), b = P(s, 0, v); g.globalAlpha = 0.55; flecha(g, a[0], a[1], b[0], b[1], col['--b'], 1.4); }
    g.globalAlpha = 1; g.lineWidth = 2.4; g.strokeStyle = col['--e']; puntas((s) => P(s, A * Math.exp(-alfa * s) * Math.cos(fase(s)), 0));
    for (let i = 0; i <= n; i++) { const s = (L * i) / n, v = A * Math.exp(-alfa * s) * Math.cos(fase(s)), a = P(s, 0, 0), b = P(s, v, 0); g.globalAlpha = 0.7; flecha(g, a[0], a[1], b[0], b[1], col['--e'], 1.6); }
    g.globalAlpha = 1;
    // dirección de propagación
    const yS = 22; flecha(g, w / 2 - 50, yS, w / 2 + 50, yS, col['--s'], 2.6); g.fillStyle = col['--s']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('S = E × B/μ', w / 2 + 58, yS);
    g.fillStyle = col['--e']; g.textAlign = 'left'; g.font = `600 13px ${FU}`; g.fillText('E', x0 + 10, yc - A - 2);
    g.fillStyle = col['--b']; g.textAlign = 'right'; g.fillText('B', x0 + Bs * dx * 0.55 - 8, yc + Bs * dy * 0.55 + 4);
    g.fillStyle = col['--muted']; g.font = `12px ${FU}`; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(`tramo de ${txt(f(L, 3))} m${per ? ` = ${txt(f(L / lam, 3))} λ` : ''}`, x1, h - 6);
  }
  // fuente puntual: frentes de onda que se alejan y el punto a distancia r
  function fuente(g, w, h) {
    const cx = Math.min(w * 0.3, 160), cy = h / 2, R = w - cx - 30, paso = 34, t = (tA * 40) % paso;
    g.lineWidth = 1.6;
    for (let r = t; r < R + paso; r += paso) { g.strokeStyle = col['--e']; g.globalAlpha = Math.max(0.08, 0.8 * (1 - r / (R + paso))); g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2.6, Math.PI / 2.6); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = col['--s']; g.beginPath(); g.arc(cx, cy, 7, 0, 2 * Math.PI); g.fill();
    const xr = cx + R * 0.75; g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(cx, cy); g.lineTo(xr, cy); g.stroke(); g.setLineDash([]);
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(xr, cy, 4, 0, 2 * Math.PI); g.fill();
    g.font = `12px ${FU}`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = col['--muted']; g.fillText(`r = ${txt(f(sol.r))} m`, (cx + xr) / 2, cy - 6);
    g.textBaseline = 'top'; g.fillStyle = col['--s']; g.fillText(`P = ${txt(f(sol.P))} W`, cx, cy + 12); g.fillStyle = col['--ink']; g.fillText(`I = ${txt(f(sol.I))} W/m²`, xr, cy + 10);
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

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('ondas-em').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.OndasEMApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, I: sol.I, B0: sol.B0, alfa: sol.alfa, delta: sol.delta }, estado: () => copia(sc) };
})();
