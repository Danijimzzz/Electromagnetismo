/* =====================================================================
   Fuerza magnética: interfaz (seis situaciones: carga en un campo,
   fuerza de Lorentz con vectores, selector de velocidades y
   espectrómetro, ciclotrón, hilo en un campo y dos hilos paralelos; el
   resultado, una animación de cada una y el desarrollo). El cálculo está
   en fuerza/fisica.js (Fuerza).
   ===================================================================== */
(() => {
  const { $, esc, copia, txt } = Herramienta;
  const F = Fuerza, f = F.f, CLAVE = 'fuerza-v1';
  const MODOS = [['carga', 'Carga en un campo B (circunferencia o hélice)'], ['vectorial', 'Fuerza de Lorentz con vectores'], ['selector', 'Selector de velocidades y espectrómetro'], ['ciclotron', 'Ciclotrón'], ['hilo', 'Fuerza sobre un hilo'], ['paralelos', 'Fuerza entre dos hilos paralelos']];
  const PARTS = [['proton', 'Protón'], ['electron', 'Electrón'], ['alfa', 'Partícula α'], ['deuteron', 'Deuterón'], ['otra', 'Otra (escribo q y m)']];

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const tres = (p, nom, un) => `<label>${nom} <small>${un}</small></label><div class="tres">${['x', 'y', 'z'].map((e) => `<input id="f-${p}${e}" class="in" data-k="${p}${e}" value="${esc(sc[p + e] ?? '')}" inputmode="decimal" autocomplete="off" placeholder="${e}" aria-label="${nom}, componente ${e}">`).join('')}</div>`;
  const sentidoB = () => elige('sentidoB', 'Sentido de B', [['entrante', '⊗ Entrante (hacia la pantalla)'], ['saliente', '⊙ Saliente']]);
  const particula = (conM = true) => elige('part', 'Partícula', PARTS) + (sc.part === 'otra' ? fila('q', 'Carga q', 'C') + fila('m', conM ? 'Masa m' : 'Masa m (opcional)', 'kg') : '');
  const veloc = (op = false) => elige('uv', 'Doy', [['ms', 'la velocidad v (m/s)'], ['eV', 'la energía cinética (eV)'], ['V', 'la ddp que la acelera (V)']]) + fila('v', `${sc.uv === 'eV' ? 'Energía cinética' : sc.uv === 'V' ? 'Diferencia de potencial' : 'Velocidad v'}${op ? ' (opcional)' : ''}`, sc.uv === 'eV' ? 'eV' : sc.uv === 'V' ? 'V' : 'm/s');
  const NOTAS = {
    carga: 'θ es el ángulo entre v y B: con 90° la trayectoria es una circunferencia y con otro ángulo, una hélice. Se admite 2e6 o 2·10^6.',
    vectorial: 'Escribe las componentes en el SI. E es opcional: con E sale la fuerza de Lorentz completa F = q(E + v × B).',
    selector: 'Placa positiva arriba (E hacia abajo) y B entrante. Si dejas v vacía se toma la que pasa sin desviarse; B′ es el campo del espectrómetro, opcional.',
    ciclotron: 'R es el radio de las des, donde sale la partícula. Con la ddp entre las des se calculan las vueltas.',
    hilo: 'θ es el ángulo entre el hilo y B (90° si es perpendicular). Con la masa del hilo se calcula la corriente para que flote.',
    paralelos: 'Hilos rectos, largos y paralelos separados una distancia d. Sin L se da la fuerza por metro.',
  };
  function formulario() {
    let h = elige('modo', 'Situación', MODOS);
    if (sc.modo === 'carga') h += particula() + veloc() + fila('B', 'Campo B', 'T') + sentidoB() + fila('th', 'Ángulo entre v y B θ', '°');
    else if (sc.modo === 'vectorial') h += particula(false) + tres('v', 'Velocidad v', 'm/s') + tres('B', 'Campo B', 'T') + sep('Opcional') + tres('E', 'Campo eléctrico E', 'V/m');
    else if (sc.modo === 'selector') h += particula() + fila('E', 'Campo eléctrico E', 'V/m') + fila('B', 'Campo B del selector', 'T') + sep('Opcional') + veloc(true) + fila('B2', 'Campo B′ del espectrómetro', 'T');
    else if (sc.modo === 'ciclotron') h += particula() + fila('B', 'Campo B', 'T') + fila('R', 'Radio de las des R', 'm') + fila('V', 'Ddp entre las des (opcional)', 'V');
    else if (sc.modo === 'hilo') h += fila('I', 'Corriente I', 'A') + elige('sentidoI', 'Sentido de I', [['derecha', '→ Hacia la derecha'], ['izquierda', '← Hacia la izquierda']]) + fila('L', 'Longitud L', 'm') + fila('B', 'Campo B', 'T') + sentidoB() + fila('th', 'Ángulo entre el hilo y B θ', '°') + fila('m', 'Masa del hilo (opcional)', 'kg');
    else h += fila('I1', 'Corriente I₁', 'A') + fila('I2', 'Corriente I₂', 'A') + elige('sentido', 'Sentidos', [['mismo', 'El mismo sentido'], ['opuesto', 'Sentidos contrarios']]) + fila('d', 'Distancia d', 'm') + fila('L', 'Longitud L (opcional)', 'm');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(F.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else {
      sc[k] = t.value;
      if (k === 'part' && t.value === 'otra' && !sc.q) { sc.q = '1,6e-19'; sc.m = sc.modo === 'vectorial' ? '' : '1,67e-27'; }
      if (k === 'uv' && sc.v) sc.v = { ms: '1e6', eV: '1000', V: '1000' }[t.value];
    }
    formulario(); cambia();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${F.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; }, de = (l) => l[ent(0, l.length - 1)];
    const dec = (a, b) => String(ent(a, b) / 10).replace('.', ','), P0 = { q: '', m: '' };
    const tipos = [
      () => ({ modo: 'carga', part: de(['proton', 'electron', 'alfa']), ...P0, uv: 'ms', v: `${ent(1, 9)}e${ent(5, 6)}`, B: dec(1, 10), th: de(['90', '90', '30', '45', '60']), sentidoB: de(['entrante', 'saliente']) }),
      () => ({ modo: 'carga', part: de(['proton', 'electron']), ...P0, uv: 'V', v: String(ent(1, 20) * 100), B: dec(1, 5), th: '90', sentidoB: de(['entrante', 'saliente']) }),
      () => ({ modo: 'vectorial', part: de(['proton', 'electron']), ...P0, vx: `${nz(-5, 5)}e5`, vy: `${ent(-5, 5)}e5`, vz: '0', Bx: '0', By: dec(-5, 5), Bz: dec(1, 8), Ex: '', Ey: '', Ez: '' }),
      () => { const B = dec(1, 5); return { modo: 'selector', part: de(['proton', 'deuteron', 'alfa']), ...P0, uv: 'ms', v: '', E: `${ent(1, 9)}e4`, B, B2: dec(2, 10) }; },
      () => ({ modo: 'ciclotron', part: de(['proton', 'deuteron', 'alfa']), ...P0, B: dec(5, 20), R: dec(3, 10), V: `${ent(1, 9)}e4` }),
      () => ({ modo: 'hilo', I: String(ent(1, 10)), sentidoI: de(['derecha', 'izquierda']), L: dec(1, 10), B: dec(1, 10), th: de(['90', '90', '30', '60']), sentidoB: de(['entrante', 'saliente']), m: '' }),
      () => ({ modo: 'paralelos', I1: String(ent(1, 20)), I2: String(ent(1, 20)), sentido: de(['mismo', 'opuesto']), d: String(ent(1, 20) / 100).replace('.', ','), L: de(['', '1', '2']) }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const PNOM = { proton: 'un protón', electron: 'un electrón', alfa: 'una partícula α', deuteron: 'un deuterón' };
  const enunciado = () => {
    const p = PNOM[sc.part] || `una partícula de carga ${esc(sc.q)} C${sc.m ? ` y masa ${esc(sc.m)} kg` : ''}`;
    const vel = () => (sc.uv === 'eV' ? `con una energía cinética de ${esc(sc.v)} eV` : sc.uv === 'V' ? `acelerado desde el reposo por una ddp de ${esc(sc.v)} V` : `a ${esc(sc.v)} m/s`);
    const vec = (k) => `(${['x', 'y', 'z'].map((e) => esc(sc[k + e] || '0')).join(', ')})`;
    if (sc.modo === 'carga') return `${p[0].toUpperCase() + p.slice(1)} entra ${vel()} en un campo B = ${esc(sc.B)} T, formando ${esc(sc.th || '90')}° con él. Calcula la fuerza, el radio${sc.th && sc.th !== '90' ? ' y el paso de la hélice' : ''} y el periodo.`;
    if (sc.modo === 'vectorial') return `Calcula la fuerza sobre ${p} con v = ${vec('v')} m/s en B = ${vec('B')} T${['x', 'y', 'z'].some((e) => sc['E' + e]) ? ` y E = ${vec('E')} V/m` : ''}.`;
    if (sc.modo === 'selector') return `En un selector de velocidades con E = ${esc(sc.E)} V/m y B = ${esc(sc.B)} T, ¿qué velocidad pasa sin desviarse?${sc.B2 ? ` Si ${p} sale y entra en B′ = ${esc(sc.B2)} T, ¿qué radio describe?` : ''}`;
    if (sc.modo === 'ciclotron') return `Un ciclotrón acelera ${p} con B = ${esc(sc.B)} T y des de radio ${esc(sc.R)} m. Calcula la frecuencia, la velocidad y la energía de salida${sc.V ? ` y las vueltas con ${esc(sc.V)} V entre las des` : ''}.`;
    if (sc.modo === 'hilo') return `Un hilo de ${esc(sc.L)} m con ${esc(sc.I)} A está en un campo B = ${esc(sc.B)} T a ${esc(sc.th || '90')}° del hilo. Calcula la fuerza sobre él.`;
    return `Dos hilos paralelos separados ${esc(sc.d)} m llevan ${esc(sc.I1)} A y ${esc(sc.I2)} A en ${sc.sentido === 'opuesto' ? 'sentidos contrarios' : 'el mismo sentido'}. Calcula la fuerza ${sc.L ? `en ${esc(sc.L)} m` : 'por metro'} y si se atraen o se repelen.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const ijk = (u, un) => { const t = u.map((x, i) => (Math.abs(x) < 1e-300 ? '' : `${x < 0 ? '−' : '+'} ${f(Math.abs(x))} <i class="uv">${'ijk'[i]}</i>`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−'); return t ? `(${t}) ${un}` : `0 ${un}`; };
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h = '', ley = '';
    if (sol.modo === 'carga') {
      h = dato('Fuerza', `F = <b>${f(sol.F)} N</b>`);
      if (sol.F) h += dato('Radio', `r = <b>${f(sol.r)} m</b>`) + dato('Periodo', `T = ${f(sol.T)} s`) + dato('Frecuencia', `f = ${f(sol.f)} Hz`) + (sol.th !== 90 ? dato('Paso de la hélice', `p = <b>${f(sol.paso)} m</b>`) : dato('Sentido de giro', `<b>${sol.giro}</b>`));
      if (sc.uv && sc.uv !== 'ms') h += dato('Velocidad', `v = ${f(sol.v)} m/s`);
      ley = sol.F === 0 ? 'v es paralela a B: no hay fuerza y la partícula sigue recta.' : sol.th === 90 ? 'Visto desde arriba, con B perpendicular a la pantalla. Verde: velocidad; rojo: fuerza magnética, siempre hacia el centro.' : 'Visto de lado, con B hacia la derecha: la partícula gira alrededor de las líneas de campo mientras avanza (en la parte de atrás, más pálida).';
    } else if (sol.modo === 'vectorial') {
      h = dato('v × B', ijk(sol.vB, 'T·m/s')) + dato(sol.hayE ? 'Fuerza magnética' : 'Fuerza', `F${sol.hayE ? '<sub>m</sub>' : ''} = <b>${ijk(sol.Fm, 'N')}</b>`) + dato(sol.hayE ? '|F<sub>m</sub>|' : 'Módulo', `${f(sol.Fmmod)} N`);
      if (sol.hayE) h += dato('Fuerza de Lorentz', `F = <b>${ijk(sol.F, 'N')}</b>`) + dato('|F|', `${f(sol.Fmod)} N`);
      ley = `Verde: v; azul: B; rojo: F${sol.hayE ? '; morado: E' : ''}. Cada flecha tiene su propia escala. La vista gira despacio para ver las tres dimensiones.`;
    } else if (sol.modo === 'selector') {
      h = dato('Velocidad que pasa', `v = E/B = <b>${f(sol.vs)} m/s</b>`);
      if (sol.dado) h += dato('Esta partícula', sol.des === 'si' ? `se desvía hacia <b>${sol.hacia}</b>` : '<b>pasa sin desviarse</b>');
      if (sol.r2 !== null) h += dato('Radio en el espectrómetro', `r = <b>${f(sol.r2)} m</b>`) + dato('Distancia a la rendija (2r)', `${f(2 * sol.r2)} m`);
      ley = 'Placa positiva arriba (E hacia abajo) y B entrante. Rojo: fuerza eléctrica; morado: magnética. La desviación está exagerada para que se vea.';
    } else if (sol.modo === 'ciclotron') {
      h = dato('Frecuencia', `f = <b>${f(sol.fr)} Hz</b>`) + dato('Velocidad de salida', `v = <b>${f(sol.vmax)} m/s</b>`) + dato('Energía de salida', `E<sub>c</sub> = <b>${f(sol.Ec)} J</b>`) + dato('En MeV', `${f(sol.Ec / F.E0 / 1e6)} MeV`) + (sol.n !== null ? dato('Vueltas', `n = <b>${f(sol.n)}</b>`) + dato('Tiempo', `t = ${f(sol.t)} s`) : '');
      ley = `Las dos des con B entrante; en el hueco, la tensión alterna la acelera cada media vuelta y el radio crece. ${sol.n !== null && sol.n > 6 ? `Se dibujan solo unas pocas de las ${f(sol.n, 3)} vueltas.` : ''}`;
    } else if (sol.modo === 'hilo') {
      h = dato('Fuerza', `F = <b>${f(sol.F)} N</b>`) + dato('Por metro', `F/L = ${f(sol.F / sol.L)} N/m`) + (sol.arriba !== null ? dato('Sentido', `hacia <b>${sol.arriba ? 'arriba' : 'abajo'}</b>`) : '') + (sol.Iflota !== null ? dato('Corriente para que flote', `I = <b>${f(sol.Iflota)} A</b>`) : '');
      ley = `Los puntos que se mueven son las cargas de la corriente. Morado: fuerza magnética${sol.m !== null ? '; rojo: peso' : ''}.`;
    } else {
      h = dato('Fuerza por metro', `F/L = <b>${f(sol.FL)} N/m</b>`) + (sol.F !== null ? dato(`Fuerza en ${f(sol.L)} m`, `F = <b>${f(sol.F)} N</b>`) : '') + dato('Los hilos', `se <b>${sol.mismo ? 'atraen' : 'repelen'}</b>`) + dato('Campo de 1 en 2', `B<sub>1</sub> = ${f(sol.B1)} T`);
      ley = 'Las circunferencias son las líneas del campo del hilo 1. Morado: la fuerza sobre cada hilo.';
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#leyenda').textContent = ley;
    dibuja();
  }

  /* ---------- Animación ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--peso', '--normal', '--fuerza', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = () => Herramienta.lienzo('#escena');
  const flecha = (g, x, y, dx, dy, L, color, lw = 2.4, et = '') => {
    const n = Math.hypot(dx, dy); if (!(n > 0) || !isFinite(n) || !(L > 0)) return;
    const ux = dx / n, uy = dy / n, x2 = x + ux * L, y2 = y + uy * L, a = 4 + lw;
    g.strokeStyle = g.fillStyle = color; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x2 - ux * a, y2 - uy * a); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.8 - uy * a, y2 - uy * a * 1.8 + ux * a); g.lineTo(x2 - ux * a * 1.8 + uy * a, y2 - uy * a * 1.8 - ux * a); g.closePath(); g.fill();
    if (et) { g.font = '600 13px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(et, x2 + ux * 12, y2 + uy * 12); }
  };
  // ⊗ o ⊙ en una rejilla
  function simbolos(g, x1, y1, x2, y2, entrante, paso = 36) {
    g.strokeStyle = g.fillStyle = col['--muted']; g.globalAlpha = 0.45; g.lineWidth = 1.2;
    for (let x = x1 + paso / 2; x < x2; x += paso) for (let y = y1 + paso / 2; y < y2; y += paso) {
      g.beginPath(); g.arc(x, y, 6, 0, 2 * Math.PI); g.stroke();
      if (entrante) { g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x + 4, y - 4); g.lineTo(x - 4, y + 4); g.stroke(); } else { g.beginPath(); g.arc(x, y, 1.8, 0, 2 * Math.PI); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  const bola = (g, x, y, r, q) => { g.fillStyle = q > 0 ? col['--peso'] : col['--z1']; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); g.fillStyle = '#fff'; g.font = `600 ${Math.round(r * 1.5)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(q > 0 ? '+' : '−', x, y + 0.5); };
  const etiqueta = (g, t, x, y, al = 'left', c = col['--muted']) => { g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = c; g.textAlign = al; g.textBaseline = 'top'; g.fillText(t, x, y); };

  function dibuja() {
    const { g, w, h } = lienzo();
    if (!sol) return;
    if (!col['--ink']) colores();
    const t = tA;
    if (sol.modo === 'carga') escCarga(g, w, h, t);
    else if (sol.modo === 'vectorial') escVectores(g, w, h, t);
    else if (sol.modo === 'selector') escSelector(g, w, h, t);
    else if (sol.modo === 'ciclotron') escCiclotron(g, w, h, t);
    else if (sol.modo === 'hilo') escHilo(g, w, h, t);
    else escParalelos(g, w, h, t);
  }
  function escCarga(g, w, h, t) {
    const q = sol.P.q;
    if (sol.F === 0) {
      // v paralela a B: recta
      g.strokeStyle = col['--accent']; g.globalAlpha = 0.5; g.lineWidth = 1.5;
      for (let y = 30; y < h; y += 46) { flecha(g, 20, y, 1, 0, w - 40, col['--accent'], 1.3); } g.globalAlpha = 1;
      const dir = sol.th === 0 ? 1 : -1, x = dir > 0 ? 40 + ((t * 80) % (w - 80)) : w - 40 - ((t * 80) % (w - 80));
      bola(g, x, h / 2, 9, q); flecha(g, x + dir * 12, h / 2, dir, 0, 40, col['--normal'], 2.6, 'v');
      etiqueta(g, 'B', 24, 12, 'left', col['--accent']);
      return;
    }
    if (sol.th === 90) {
      simbolos(g, 0, 0, w, h, sol.sentidoB !== 'saliente');
      const R = Math.min(w, h) * 0.33, cx = w / 2, cy = h / 2, s = sol.giro === 'antihorario' ? 1 : -1, ph = s * t * (2 * Math.PI / 4) - Math.PI / 2;
      g.strokeStyle = col['--ink']; g.globalAlpha = 0.25; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      // estela
      g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.6; g.beginPath(); for (let k = 0; k <= 40; k++) { const a = ph - s * (k / 40) * Math.PI * 1.2; g.globalAlpha = 1; k ? g.lineTo(cx + R * Math.cos(a), cy - R * Math.sin(a)) : g.moveTo(cx + R * Math.cos(a), cy - R * Math.sin(a)); } g.stroke();
      const x = cx + R * Math.cos(ph), y = cy - R * Math.sin(ph);
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
      g.fillStyle = col['--muted']; g.beginPath(); g.arc(cx, cy, 2.5, 0, 2 * Math.PI); g.fill();
      etiqueta(g, `r = ${txt(f(sol.r, 3))} m`, cx + 6, cy + 6);
      flecha(g, x, y, -s * Math.sin(ph), -s * Math.cos(ph), 50, col['--normal'], 2.6, 'v');
      flecha(g, x, y, cx - x, cy - y, 42, col['--peso'], 2.6, 'F');
      bola(g, x, y, 9, q);
      return;
    }
    // hélice vista de lado: B hacia la derecha
    g.globalAlpha = 0.35; for (let y = 24; y < h; y += 44) flecha(g, 8, y, 1, 0, w - 16, col['--accent'], 1.2); g.globalAlpha = 1;
    etiqueta(g, 'B', 12, 4, 'left', col['--accent']);
    const relP = sol.paso / sol.r, R = Math.min(h * 0.3, (w * 0.22) / Math.max(relP, 0.3)), pp = relP * R, dir = sol.va >= 0 ? 1 : -1, cy = h / 2;
    const vueltas = (w - 60) / pp, Tv = 3, u = (t / Tv) % Math.max(1, vueltas), x0 = dir > 0 ? 30 : w - 30, sg = q > 0 ? 1 : -1;
    const pos = (k) => [x0 + dir * k * pp, cy - R * Math.sin(sg * 2 * Math.PI * k), Math.cos(2 * Math.PI * k)];
    g.lineWidth = 2;
    for (let k = 0; k < vueltas * 80; k++) { const a = pos(k / 80), b = pos((k + 1) / 80); g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.globalAlpha = (k / 80 <= u ? 0.9 : 0.18) * (a[2] > 0 ? 1 : 0.45); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.globalAlpha = 1;
    const p = pos(u); bola(g, p[0], p[1], p[2] > 0 ? 9 : 7, q);
    etiqueta(g, `paso p = ${txt(f(sol.paso, 3))} m`, w - 10, h - 20, 'right');
  }
  function escVectores(g, w, h, t) {
    const az = (30 + 15 * Math.sin(t * 0.6)) * Math.PI / 180, el = 22 * Math.PI / 180, L = Math.min(w, h) * 0.36, cx = w / 2, cy = h * 0.55;
    const pr = (v) => [cx + L * (-v[0] * Math.sin(az) + v[1] * Math.cos(az)), cy - L * (v[2] * Math.cos(el) - (v[0] * Math.cos(az) + v[1] * Math.sin(az)) * Math.sin(el))];
    g.lineWidth = 1.2; g.strokeStyle = col['--muted']; g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [e, v] of [['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]]) { const a = pr(v.map((c) => -c * 0.6)), b = pr(v.map((c) => c * 1.15)); g.globalAlpha = 0.6; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.globalAlpha = 1; const c = pr(v.map((c) => c * 1.25)); g.fillText(e, c[0], c[1]); }
    const o = pr([0, 0, 0]);
    const dib = (u, c, et) => { const m = Math.hypot(...u); if (!(m > 0)) return; const p = pr(u.map((x) => (x / m) * 0.85)); flecha(g, o[0], o[1], p[0] - o[0], p[1] - o[1], Math.hypot(p[0] - o[0], p[1] - o[1]), c, 2.8, et); };
    dib(sol.v, col['--normal'], 'v'); dib(sol.B, col['--accent'], 'B'); if (sol.hayE) dib(sol.E, col['--fuerza'], 'E'); dib(sol.F, col['--peso'], 'F');
    bola(g, o[0], o[1], 7, sol.P.q);
  }
  function escSelector(g, w, h, t) {
    const x1 = w * 0.08, x2 = sol.r2 !== null ? w * 0.5 : w * 0.8, cy = sol.r2 !== null ? h * 0.62 : h / 2, gap = Math.min(110, h * 0.34), q = sol.P.q;
    simbolos(g, x1, cy - gap / 2, x2, cy + gap / 2, true, 30);
    g.fillStyle = col['--peso']; g.fillRect(x1, cy - gap / 2 - 8, x2 - x1, 8); g.fillStyle = col['--z1']; g.fillRect(x1, cy + gap / 2, x2 - x1, 8);
    etiqueta(g, '+ + + +', x1 + 4, cy - gap / 2 - 24, 'left', col['--peso']); etiqueta(g, '− − − −', x1 + 4, cy + gap / 2 + 12, 'left', col['--z1']);
    etiqueta(g, 'E ↓   B ⊗', (x1 + x2) / 2, cy - gap / 2 - 24, 'center');
    // desviación exagerada: llega a la placa si v se aparta un 20 % de E/B
    const rel = (sol.v - sol.vs) / sol.vs, sg = sol.des === 'si' ? (sol.hacia === 'arriba' ? -1 : 1) : 0, k = Math.min(1, Math.abs(rel) * 5);
    const yv = (x) => cy + sg * (gap / 2) * k * 2 * ((x - x1) / (x2 - x1)) ** 2;
    const vel = (w * 0.9) / 3, Ttot = 3.6, s = (t % Ttot) * vel, recorrido = [];
    let x = x1 - 30, y = cy, choca = false;
    for (let d = 0; d <= s; d += 3) {
      if (x < x1) { x += 3; y = cy; }
      else if (x <= x2) { x += 3; y = yv(x); if (Math.abs(y - cy) >= gap / 2 - 6) { y = cy + Math.sign(y - cy) * (gap / 2 - 6); choca = true; break; } }
      else if (sol.r2 !== null && sol.des !== 'si') {
        // media circunferencia en el espectrómetro
        const R = Math.min(h * 0.26, (w - x2) * 0.42), a = (d - (x2 - x1 + 30)) / R; if (a > Math.PI) { recorrido.push([x2, cy - 2 * R * Math.sign(q)]); break; }
        x = x2 + R * Math.sin(a); y = cy - Math.sign(q) * R * (1 - Math.cos(a));
      } else x += 3;
      recorrido.push([x, y]);
    }
    if (sol.r2 !== null) {
      const R = Math.min(h * 0.26, (w - x2) * 0.42);
      simbolos(g, x2 + 4, 0, w, h, true, 34);
      g.strokeStyle = col['--ink']; g.lineWidth = 3; g.beginPath(); g.moveTo(x2, 4); g.lineTo(x2, cy - 10); g.moveTo(x2, cy + 10); g.lineTo(x2, h - 4); g.stroke();
      etiqueta(g, `B′  ·  2r = ${txt(f(2 * sol.r2, 3))} m`, x2 + 8, h - 18);
      g.strokeStyle = col['--muted']; g.globalAlpha = 0.4; g.setLineDash([4, 4]); g.beginPath(); g.arc(x2, cy - Math.sign(q) * R, R, -Math.PI / 2, Math.PI / 2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    }
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.4; g.beginPath(); recorrido.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke();
    const p = recorrido[recorrido.length - 1] || [x1 - 30, cy];
    if (p[0] >= x1 && p[0] <= x2 && !choca) { const fe = q > 0 ? 1 : -1, fb = -fe, m = Math.max(sol.FE, sol.FB); flecha(g, p[0], p[1], 0, fe, 36 * sol.FE / m, col['--peso'], 2.4); flecha(g, p[0], p[1], 0, fb, 36 * sol.FB / m, col['--fuerza'], 2.4); }
    bola(g, p[0], p[1], 8, q);
  }
  function escCiclotron(g, w, h, t) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42, gap = 14, q = sol.P.q;
    simbolos(g, cx - R, cy - R, cx + R, cy + R, true, 34);
    g.strokeStyle = col['--ink']; g.lineWidth = 2.5; g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.5;
    for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * gap / 2, cy, R, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : 1.5 * Math.PI); g.closePath(); g.fill(); g.globalAlpha = 1; g.stroke(); g.globalAlpha = 0.5; }
    g.globalAlpha = 1;
    const nv = Math.max(2, Math.min(12, Math.round(sol.n !== null ? sol.n * 2 : 10))), radios = Array.from({ length: nv }, (_, k) => R * 0.9 * Math.sqrt((k + 1) / nv));
    // medias vueltas en sentido antihorario (carga positiva): la par en la de derecha, de abajo arriba; la impar en la izquierda
    const centros = []; let yc = cy;
    for (let k = 0; k < nv; k++) { if (k) yc = k % 2 ? centros[k - 1] - radios[k - 1] + radios[k] : centros[k - 1] + radios[k - 1] - radios[k]; centros.push(yc); }
    const sv = q > 0 ? 1 : -1, Y = (y) => cy + sv * (y - cy);
    const pt = (k, a) => (k % 2 ? [cx - gap / 2 - radios[k] * Math.sin(a), Y(centros[k] - radios[k] * Math.cos(a))] : [cx + gap / 2 + radios[k] * Math.sin(a), Y(centros[k] + radios[k] * Math.cos(a))]);
    const Th = 0.6, tot = nv * Th + 1.2, u = t % tot, kk = Math.min(nv - 1, Math.floor(u / Th)), fr = Math.min(1, (u - kk * Th) / Th);
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2; g.beginPath();
    for (let k = 0; k <= kk; k++) for (let i = 0; i <= 30; i++) { const p = pt(k, Math.PI * (k < kk ? i / 30 : (i / 30) * fr)); k === 0 && i === 0 ? g.moveTo(...p) : g.lineTo(...p); }
    let p = pt(kk, Math.PI * fr);
    if (u >= nv * Th) { const e = pt(nv - 1, Math.PI), dx = (nv - 1) % 2 ? 1 : -1; p = [e[0] + dx * (u - nv * Th) * 160, e[1]]; g.lineTo(...p); }
    g.stroke();
    bola(g, p[0], p[1], 7, q);
    etiqueta(g, `f = ${txt(f(sol.fr, 3))} Hz`, 10, 8);
    const signo = Math.floor(u / Th) % 2 ? '←' : '→'; etiqueta(g, `E ${signo}`, cx, cy - 8, 'center', col['--fuerza']);
  }
  function escHilo(g, w, h, t) {
    simbolos(g, 0, 0, w, h, sol.sentidoB !== 'saliente');
    const cy = h / 2, dir = sol.sentidoI === 'izquierda' ? -1 : 1;
    g.strokeStyle = col['--ink']; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.08, cy); g.lineTo(w * 0.92, cy); g.stroke();
    g.fillStyle = col['--z2']; for (let x = 0; x < w; x += 40) { const xx = w * 0.08 + ((x + dir * t * 60) % (w * 0.84) + w * 0.84) % (w * 0.84); g.beginPath(); g.arc(xx, cy, 3, 0, 2 * Math.PI); g.fill(); }
    flecha(g, w * 0.12, cy - 22, dir, 0, 50, col['--z2'], 2.4, 'I');
    const ref = Math.max(sol.F, sol.m !== null ? sol.m * 9.8 : 0) || 1;
    if (sol.arriba !== null) flecha(g, w / 2, cy, 0, sol.arriba ? -1 : 1, 22 + 70 * sol.F / ref, col['--fuerza'], 3, 'F');
    if (sol.m !== null) flecha(g, w / 2 + 40, cy, 0, 1, 22 + 70 * sol.m * 9.8 / ref, col['--peso'], 3, 'P');
  }
  function escParalelos(g, w, h, t) {
    const d = Math.min(w * 0.3, 160), osc = Math.sin(t * 3) * 2 * (sol.mismo ? -1 : 1), x1 = w / 2 - d / 2 - osc, x2 = w / 2 + d / 2 + osc;
    g.strokeStyle = col['--accent']; g.globalAlpha = 0.35; g.lineWidth = 1.2;
    for (const r of [d * 0.35, d * 0.7, d, d * 1.4]) { g.beginPath(); g.ellipse(x1, h / 2, r, r * 0.28, 0, 0, 2 * Math.PI); g.stroke(); }
    g.globalAlpha = 1;
    for (const [x, sg, et] of [[x1, -1, 'I₁'], [x2, sol.mismo ? -1 : 1, 'I₂']]) {
      g.strokeStyle = col['--ink']; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 10); g.lineTo(x, h - 10); g.stroke();
      g.fillStyle = col['--z2']; for (let y = 0; y < h; y += 34) { const yy = 10 + ((y + sg * t * 50) % (h - 20) + (h - 20)) % (h - 20); g.beginPath(); g.arc(x, yy, 3, 0, 2 * Math.PI); g.fill(); }
      flecha(g, x - 18, h / 2 + (sg > 0 ? -30 : 30), 0, sg, 50, col['--z2'], 2.4, et);
    }
    const L = 50, atrae = sol.mismo;
    flecha(g, x1, h * 0.28, atrae ? 1 : -1, 0, L, col['--fuerza'], 3, 'F');
    flecha(g, x2, h * 0.28, atrae ? -1 : 1, 0, L, col['--fuerza'], 3, 'F');
    etiqueta(g, `d = ${txt(f(sol.d, 3))} m`, w / 2, h - 22, 'center');
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

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('fuerza').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.FuerzaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, F: sol.F, Fmod: sol.Fmod, r: sol.r, vs: sol.vs, r2: sol.r2, fr: sol.fr, n: sol.n, FL: sol.FL }, estado: () => copia(sc) };
})();
