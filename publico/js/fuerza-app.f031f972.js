(() => {
  const { $, esc, copia, txt } = Herramienta;
  const F = Fuerza, f = F.f, CLAVE = 'fuerza-v1';
  const MODOS = [['trayectoria', 'Trayectoria con E y B en cualquier dirección (3D)'], ['espejo', 'Espejo magnético (botella)'], ['carga', 'Carga en un campo B (circunferencia o hélice)'], ['franja', 'Carga que entra en una franja de campo'], ['vectorial', 'Fuerza de Lorentz con vectores'], ['cruzados', 'Campos E y B cruzados (cicloide)'], ['selector', 'Selector de velocidades y espectrómetro'], ['ciclotron', 'Ciclotrón'], ['hall', 'Efecto Hall'], ['hilo', 'Fuerza sobre un hilo'], ['espira', 'Par sobre una espira'], ['paralelos', 'Fuerza entre dos hilos paralelos']];
  const PARTS = [['proton', 'Protón'], ['electron', 'Electrón'], ['alfa', 'Partícula α'], ['deuteron', 'Deuterón'], ['otra', 'Otra (escribo q y m)']];

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const tres = (p, nom, un) => `<label>${nom} <small>${un}</small></label><div class="tres">${['x', 'y', 'z'].map((e) => `<input id="f-${p}${e}" class="in" data-k="${p}${e}" value="${esc(sc[p + e] ?? '')}" inputmode="decimal" autocomplete="off" placeholder="${e}" aria-label="${nom}, componente ${e}">`).join('')}</div>`;
  const sentidoB = () => elige('sentidoB', 'Sentido de B', [['entrante', '⊗ Entrante (hacia la pantalla)'], ['saliente', '⊙ Saliente']]);
  const particula = (conM = true) => elige('part', 'Partícula', PARTS) + (sc.part === 'otra' ? fila('q', 'Carga q', 'C') + fila('m', conM ? 'Masa m' : 'Masa m (opcional)', 'kg') : '');
  const veloc = (op = false) => elige('uv', 'Doy', [['ms', 'la velocidad v (m/s)'], ['eV', 'la energía cinética (eV)'], ['V', 'la ddp que la acelera (V)']]) + fila('v', `${sc.uv === 'eV' ? 'Energía cinética' : sc.uv === 'V' ? 'Diferencia de potencial' : 'Velocidad v'}${op ? ' (opcional)' : ''}`, sc.uv === 'eV' ? 'eV' : sc.uv === 'V' ? 'V' : 'm/s');
  const NOTAS = {
    trayectoria: 'La partícula parte del origen. Escribe las tres componentes de v, B y E (las que falten valen 0). Se integra la ecuación de Lorentz paso a paso (Runge-Kutta 4) y se dibuja en 3D y en proyecciones. Se admite 2e5 o 2·10^5.',
    espejo: 'Botella magnética B(z) = B₀(1 + z²/L²) con los extremos en z = ±L√(Rm − 1). La partícula sale del centro; α₀ es el ángulo entre v y B ahí (90° = gira sin avanzar). Se integra en 3D y se compara con la teoría del momento magnético.',
    carga: 'θ es el ángulo entre v y B: con 90° la trayectoria es una circunferencia y con otro ángulo, una hélice. Se admite 2e6 o 2·10^6.',
    vectorial: 'Escribe las componentes en el SI. E es opcional: con E sale la fuerza de Lorentz completa F = q(E + v × B).',
    franja: 'La partícula entra perpendicular al borde de una franja de anchura d con B uniforme; fuera de ella no hay campo.',
    cruzados: 'E hacia arriba y B saliente (⊙), perpendiculares. La velocidad inicial va hacia la derecha; vacía o 0, parte del reposo.',
    selector: 'Placa positiva arriba (E hacia abajo) y B entrante. Si dejas v vacía se toma la que pasa sin desviarse; B′ es el campo del espectrómetro, opcional. Con la masa de un segundo isótopo (en u, misma carga) sale la separación de los impactos.',
    hall: 'Lámina con la corriente hacia la derecha y B perpendicular a ella. t es el grosor en la dirección de B y w la anchura, donde se mide V_H (opcional).',
    espira: 'θ es el ángulo entre la normal a la espira (el momento magnético) y B: con 90° el par es máximo.',
    ciclotron: 'R es el radio de las des, donde sale la partícula. Con la ddp entre las des se calculan las vueltas.',
    hilo: 'θ es el ángulo entre el hilo y B (90° si es perpendicular). Con la masa del hilo se calcula la corriente para que flote.',
    paralelos: 'Hilos rectos, largos y paralelos separados una distancia d. Sin L se da la fuerza por metro.',
  };
  function formulario() {
    let h = elige('modo', 'Situación', MODOS);
    if (sc.modo === 'carga') h += particula() + veloc() + fila('B', 'Campo B', 'T') + sentidoB() + fila('th', 'Ángulo entre v y B θ', '°');
    else if (sc.modo === 'trayectoria') h += particula() + tres('v', 'Velocidad inicial v', 'm/s') + tres('B', 'Campo B', 'T') + tres('E', 'Campo eléctrico E', 'V/m') + sep('Opcional') + fila('tt', 'Tiempo de integración', 's (vacío = 5 vueltas)');
    else if (sc.modo === 'espejo') h += particula() + veloc() + fila('B0', 'Campo en el centro B₀', 'T') + fila('Rm', 'Relación de espejo Bmáx/B₀', '') + fila('L', 'Longitud característica L', 'm') + fila('al', 'Ángulo entre v y B en el centro α₀', '°');
    else if (sc.modo === 'vectorial') h += particula(false) + tres('v', 'Velocidad v', 'm/s') + tres('B', 'Campo B', 'T') + sep('Opcional') + tres('E', 'Campo eléctrico E', 'V/m');
    else if (sc.modo === 'selector') h += particula() + fila('E', 'Campo eléctrico E', 'V/m') + fila('B', 'Campo B del selector', 'T') + sep('Opcional') + veloc(true) + fila('B2', 'Campo B′ del espectrómetro', 'T') + fila('m2', 'Masa de un segundo isótopo', 'u');
    else if (sc.modo === 'ciclotron') h += particula() + fila('B', 'Campo B', 'T') + fila('R', 'Radio de las des R', 'm') + fila('V', 'Ddp entre las des (opcional)', 'V');
    else if (sc.modo === 'franja') h += particula() + veloc() + fila('B', 'Campo B', 'T') + sentidoB() + fila('d', 'Anchura de la franja d', 'm');
    else if (sc.modo === 'cruzados') h += particula() + fila('E', 'Campo eléctrico E (↑)', 'V/m') + fila('B', 'Campo B (⊙)', 'T') + fila('v0', 'Velocidad inicial (→, opcional)', 'm/s');
    else if (sc.modo === 'hall') h += elige('portador', 'Portadores', [['electrones', 'Electrones (metal, tipo n)'], ['huecos', 'Huecos (tipo p)']]) + fila('I', 'Corriente I', 'A') + fila('B', 'Campo B', 'T') + sentidoB() + fila('t', 'Grosor t (en la dirección de B)', 'm') + fila('w', 'Anchura w (opcional)', 'm') + elige('dato', 'Doy', [['n', 'la densidad de portadores n'], ['VH', 'la tensión Hall medida']]) + (sc.dato === 'VH' ? fila('VH', 'Tensión Hall V_H', 'V') : fila('n', 'Densidad de portadores n', 'm⁻³'));
    else if (sc.modo === 'espira') h += fila('N', 'Vueltas N', '') + fila('I', 'Corriente I', 'A') + elige('forma', 'Forma', [['rect', 'Rectangular (a × b)'], ['circ', 'Circular (radio R)']]) + (sc.forma === 'circ' ? fila('R', 'Radio R', 'm') : fila('a', 'Lado a (perpendicular a B)', 'm') + fila('b', 'Lado b', 'm')) + fila('B', 'Campo B', 'T') + fila('th', 'Ángulo entre la normal y B θ', '°');
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
      if (k === 'forma') { if (t.value === 'circ' && !sc.R) sc.R = '0,1'; if (t.value === 'rect' && !sc.a) { sc.a = '0,1'; sc.b = '0,05'; } }
      if (k === 'dato') { if (t.value === 'VH' && !sc.VH) sc.VH = '1e-5'; if (t.value === 'n' && !sc.n) sc.n = '8,5e28'; }
    }
    formulario(); cambia();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${F.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
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
      () => ({ modo: 'franja', part: de(['proton', 'electron', 'alfa']), ...P0, uv: 'ms', v: `${ent(1, 9)}e${de(['5', '6'])}`, B: dec(1, 10), sentidoB: de(['entrante', 'saliente']), d: String(ent(1, 10) / 100).replace('.', ',') }),
      () => ({ modo: 'cruzados', part: de(['proton', 'electron']), ...P0, E: String(ent(1, 20) * 100), B: dec(1, 5), v0: '' }),
      () => ({ modo: 'hall', portador: de(['electrones', 'huecos']), I: String(ent(1, 20)), B: dec(1, 20), sentidoB: de(['entrante', 'saliente']), t: `${ent(1, 9)}e-4`, w: String(ent(1, 5) / 100).replace('.', ','), dato: 'n', n: `${ent(1, 9)}e${de(['22', '28'])}`, VH: '' }),
      () => ({ modo: 'espira', N: String(de([1, 10, 20, 50, 100])), I: String(ent(1, 10)), forma: 'rect', a: dec(1, 3), b: dec(1, 3), R: '', B: dec(1, 10), th: de(['30', '45', '60', '90']) }),
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
    if (sc.modo === 'trayectoria') return `${p[0].toUpperCase() + p.slice(1)} sale del origen con v = ${vec('v')} m/s en una región con B = ${vec('B')} T y E = ${vec('E')} V/m. Calcula el radio de giro, la deriva y la energía cinética final.`;
    if (sc.modo === 'espejo') return `${p[0].toUpperCase() + p.slice(1)} ${vel()} sale del centro de una botella magnética con B₀ = ${esc(sc.B0)} T y relación de espejo ${esc(sc.Rm)}, formando ${esc(sc.al)}° con B. ¿Queda atrapada? Calcula el ángulo del cono de pérdidas y el periodo de rebote.`;
    if (sc.modo === 'carga') return `${p[0].toUpperCase() + p.slice(1)} entra ${vel()} en un campo B = ${esc(sc.B)} T, formando ${esc(sc.th || '90')}° con él. Calcula la fuerza, el radio${sc.th && sc.th !== '90' ? ' y el paso de la hélice' : ''} y el periodo.`;
    if (sc.modo === 'vectorial') return `Calcula la fuerza sobre ${p} con v = ${vec('v')} m/s en B = ${vec('B')} T${['x', 'y', 'z'].some((e) => sc['E' + e]) ? ` y E = ${vec('E')} V/m` : ''}.`;
    if (sc.modo === 'selector') return `En un selector de velocidades con E = ${esc(sc.E)} V/m y B = ${esc(sc.B)} T, ¿qué velocidad pasa sin desviarse?${sc.B2 ? ` Si ${p} sale y entra en B′ = ${esc(sc.B2)} T, ¿qué radio describe?` : ''}`;
    if (sc.modo === 'ciclotron') return `Un ciclotrón acelera ${p} con B = ${esc(sc.B)} T y des de radio ${esc(sc.R)} m. Calcula la frecuencia, la velocidad y la energía de salida${sc.V ? ` y las vueltas con ${esc(sc.V)} V entre las des` : ''}.`;
    if (sc.modo === 'franja') return `${p[0].toUpperCase() + p.slice(1)} entra ${vel()} perpendicular al borde de una franja de anchura ${esc(sc.d)} m con un campo B = ${esc(sc.B)} T. ¿Atraviesa la franja? Calcula el radio, el ángulo de salida y el tiempo dentro.`;
    if (sc.modo === 'cruzados') return `${p[0].toUpperCase() + p.slice(1)} está ${sc.v0 && +String(sc.v0).replace(',', '.') ? `moviéndose a ${esc(sc.v0)} m/s` : 'en reposo'} en una región con E = ${esc(sc.E)} V/m y B = ${esc(sc.B)} T perpendiculares. Calcula la velocidad de deriva, cuánto se aleja de la recta inicial y su rapidez máxima.`;
    if (sc.modo === 'hall') return `Una lámina de grosor ${esc(sc.t)} m${sc.w ? ` y anchura ${esc(sc.w)} m` : ''}, con ${sc.portador === 'huecos' ? 'huecos' : 'electrones'} como portadores, lleva ${esc(sc.I)} A en un campo de ${esc(sc.B)} T. ${sc.dato === 'VH' ? `Se mide una tensión Hall de ${esc(sc.VH)} V: calcula la densidad de portadores.` : `Con n = ${esc(sc.n)} m⁻³, calcula la tensión Hall.`}`;
    if (sc.modo === 'espira') return `Una ${sc.forma === 'circ' ? `espira circular de radio ${esc(sc.R)} m` : `espira rectangular de ${esc(sc.a)} × ${esc(sc.b)} m`}${sc.N && sc.N !== '1' ? ` con ${esc(sc.N)} vueltas` : ''} lleva ${esc(sc.I)} A en un campo B = ${esc(sc.B)} T cuya dirección forma ${esc(sc.th || '90')}° con la normal. Calcula el momento magnético, el par y la energía.`;
    if (sc.modo === 'hilo') return `Un hilo de ${esc(sc.L)} m con ${esc(sc.I)} A está en un campo B = ${esc(sc.B)} T a ${esc(sc.th || '90')}° del hilo. Calcula la fuerza sobre él.`;
    return `Dos hilos paralelos separados ${esc(sc.d)} m llevan ${esc(sc.I1)} A y ${esc(sc.I2)} A en ${sc.sentido === 'opuesto' ? 'sentidos contrarios' : 'el mismo sentido'}. Calcula la fuerza ${sc.L ? `en ${esc(sc.L)} m` : 'por metro'} y si se atraen o se repelen.`;
  };

  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const ijk = (u, un) => { const t = u.map((x, i) => (Math.abs(x) < 1e-300 ? '' : `${x < 0 ? '−' : '+'} ${f(Math.abs(x))} <i class="uv">${'ijk'[i]}</i>`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−'); return t ? `(${t}) ${un}` : `0 ${un}`; };
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#card3d').hidden = true; $('#desc3d').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h = '', ley = '';
    if (sol.modo === 'carga') {
      h = dato('Fuerza', `F = <b>${f(sol.F)} N</b>`);
      if (sol.F) h += dato('Radio', `r = <b>${f(sol.r)} m</b>`) + dato('Periodo', `T = ${f(sol.T)} s`) + dato('Frecuencia', `f = ${f(sol.f)} Hz`) + (sol.th !== 90 ? dato('Paso de la hélice', `p = <b>${f(sol.paso)} m</b>`) : dato('Sentido de giro', `<b>${sol.giro}</b>`));
      if (sc.uv && sc.uv !== 'ms') h += dato('Velocidad', `v = ${f(sol.v)} m/s`);
      ley = sol.F === 0 ? 'v es paralela a B: no hay fuerza y la partícula sigue recta.' : sol.th === 90 ? 'Visto desde arriba, con B perpendicular a la pantalla. Verde: velocidad; rojo: fuerza magnética, siempre hacia el centro.' : 'Visto de lado, con B hacia la derecha: la partícula gira alrededor de las líneas de campo mientras avanza (en la parte de atrás, más pálida).';
    } else if (sol.modo === 'trayectoria') {
      h = (sol.Bm ? dato('Frecuencia de giro', `ω<sub>c</sub> = ${f(sol.w)} rad/s · T<sub>c</sub> = ${f(sol.Tc)} s`) + dato('Radio de giro', `r<sub>L</sub> = <b>${f(sol.rL)} m</b>`) : '') + (sol.hayE && sol.Bm ? dato('Deriva E × B', `v<sub>d</sub> = <b>${f(Math.hypot(...sol.vd))} m/s</b>`) : '') + (sol.hayE ? dato('Aceleración a lo largo de B', `a<sub>∥</sub> = ${f(sol.apar)} m/s²`) : '') + dato('Posición final', `(${sol.rf.map((x) => f(x)).join('; ')}) m`) + dato('Energía cinética', `${f(sol.KE0)} J → <b>${f(sol.KE1)} J</b>`) + dato('Trabajo del campo eléctrico', `q E·Δr = ${f(sol.WE)} J`);
      ley = 'Arriba, la trayectoria vista desde cada lado (círculo: inicio; cuadrado: final). Abajo, la energía cinética en función del tiempo: solo cambia por el campo eléctrico.';
    } else if (sol.modo === 'espejo') {
      h = dato('Ángulo del cono de pérdidas', `α<sub>c</sub> = <b>${f((sol.ac * 180) / Math.PI)}°</b>`) + dato('Esta partícula', sol.atrapada ? '<b>atrapada</b>' : '<b>escapa</b>') + dato('Momento magnético', `μ = ${f(sol.mu)} J/T`) + dato('Variación de μ en la simulación', `${f(sol.dev * 100)} %`) + (sol.atrapada ? dato('Punto de retorno', `z<sub>t</sub> = L cot α₀ = <b>${f(sol.zt)} m</b> (simulado ${f(sol.zmax)} m)`) + dato('Periodo de rebote', `T<sub>b</sub> = 2πL/v<sub>⊥</sub> = <b>${f(sol.Tb)} s</b>${sol.TbSim ? ` (simulado ${f(sol.TbSim)} s)` : ''}`) : dato('Sale de la botella', `en t = ${f(sol.tEscapa)} s`)) + dato('Radio de giro en el centro', `r<sub>L</sub> = ${f(sol.rL)} m`);
      ley = 'Arriba, vista lateral de la botella con las líneas de B y la trayectoria. Abajo, la altura z(t) y el momento magnético μ(t) relativo al inicial: rebota sin que μ cambie.';
    } else if (sol.modo === 'vectorial') {
      h = dato('v × B', ijk(sol.vB, 'T·m/s')) + dato(sol.hayE ? 'Fuerza magnética' : 'Fuerza', `F${sol.hayE ? '<sub>m</sub>' : ''} = <b>${ijk(sol.Fm, 'N')}</b>`) + dato(sol.hayE ? '|F<sub>m</sub>|' : 'Módulo', `${f(sol.Fmmod)} N`);
      if (sol.hayE) h += dato('Fuerza de Lorentz', `F = <b>${ijk(sol.F, 'N')}</b>`) + dato('|F|', `${f(sol.Fmod)} N`);
      ley = `Verde: v; azul: B; rojo: F${sol.hayE ? '; morado: E' : ''}. Cada flecha tiene su propia escala. La vista gira despacio para ver las tres dimensiones.`;
    } else if (sol.modo === 'selector') {
      h = dato('Velocidad que pasa', `v = E/B = <b>${f(sol.vs)} m/s</b>`);
      if (sol.dado) h += dato('Esta partícula', sol.des === 'si' ? `se desvía hacia <b>${sol.hacia}</b>` : '<b>pasa sin desviarse</b>');
      if (sol.r2 !== null) h += dato('Radio en el espectrómetro', `r = <b>${f(sol.r2)} m</b>`) + dato('Distancia a la rendija (2r)', `${f(2 * sol.r2)} m`);
      if (sol.sepa !== null) h += dato('Radio del segundo isótopo', `r′ = ${f(sol.rb)} m`) + dato('Separación de los impactos', `Δx = <b>${f(sol.sepa)} m</b>`);
      ley = 'Placa positiva arriba (E hacia abajo) y B entrante. Rojo: fuerza eléctrica; morado: magnética. La desviación está exagerada para que se vea.';
    } else if (sol.modo === 'ciclotron') {
      h = dato('Frecuencia', `f = <b>${f(sol.fr)} Hz</b>`) + dato('Velocidad de salida', `v = <b>${f(sol.vmax)} m/s</b>`) + dato('Energía de salida', `E<sub>c</sub> = <b>${f(sol.Ec)} J</b>`) + dato('En MeV', `${f(sol.Ec / F.E0 / 1e6)} MeV`) + (sol.n !== null ? dato('Vueltas', `n = <b>${f(sol.n)}</b>`) + dato('Tiempo', `t = ${f(sol.t)} s`) : '');
      ley = `Las dos des con B entrante; en el hueco, la tensión alterna la acelera cada media vuelta y el radio crece. ${sol.n !== null && sol.n > 6 ? `Se dibujan solo unas pocas de las ${f(sol.n, 3)} vueltas.` : ''}`;
    } else if (sol.modo === 'franja') {
      h = dato('Radio', `r = <b>${f(sol.r)} m</b>`) + (sol.cruza ? dato('Atraviesa la franja', `desviada <b>α = ${f(sol.alfa)}°</b>`) + dato('Desplazamiento al salir', `y = ${f(sol.y)} m hacia ${sol.hacia}`) : dato('No la atraviesa', `sale por donde entró, a <b>2r = ${f(sol.y)} m</b>`)) + dato('Tiempo dentro', `t = <b>${f(sol.t)} s</b>`) + (sc.uv && sc.uv !== 'ms' ? dato('Velocidad', `v = ${f(sol.v)} m/s`) : '');
      ley = 'La franja sombreada tiene el campo; fuera no hay. Verde: velocidad; rojo: fuerza magnética.';
    } else if (sol.modo === 'cruzados') {
      h = dato('Velocidad de deriva', `v<sub>d</sub> = E/B = <b>${f(sol.vd)} m/s</b>`) + (sol.R ? dato('Radio en el sistema que avanza', `R = ${f(sol.R)} m`) + dato('Máxima separación', `h = 2R = <b>${f(sol.h)} m</b>`) + dato('Rapidez máxima', `v<sub>máx</sub> = <b>${f(sol.vmax)} m/s</b>`) + dato('Periodo', `T = ${f(sol.T)} s`) + dato('Avance por periodo', `${f(sol.avance)} m`) : dato('Trayectoria', '<b>recta</b>: v = E/B'));
      ley = 'E hacia arriba y B saliente (⊙). Morado: fuerza eléctrica; rojo: magnética; verde: velocidad. El punto gris avanza con la deriva E/B.';
    } else if (sol.modo === 'hall') {
      h = (sc.dato === 'VH' ? dato('Densidad de portadores', `n = <b>${f(sol.n)} m<sup>−3</sup></b>`) : dato('Tensión Hall', `V<sub>H</sub> = <b>${f(sol.VH)} V</b>`)) + dato('Coeficiente de Hall', `R<sub>H</sub> = ${f(sol.RH)} m<sup>3</sup>/C`) + (sol.vd !== null ? dato('Velocidad de arrastre', `v<sub>d</sub> = ${f(sol.vd)} m/s`) + dato('Campo Hall', `E<sub>H</sub> = ${f(sol.EH)} V/m`) : '') + dato('Cara a más potencial', `la <b>${sol.alta}</b>`);
      ley = `Corriente hacia la derecha. Los portadores (${sol.huecos ? 'huecos, +' : 'electrones, −'}) se desvían y se acumulan en una cara hasta que el campo Hall equilibra la fuerza magnética.`;
    } else if (sol.modo === 'espira') {
      h = dato('Momento magnético', `m = N I S = <b>${f(sol.m)} A·m<sup>2</sup></b>`) + dato('Par', `τ = <b>${f(sol.tau)} N·m</b>`) + dato('Energía', `U = −m B cos θ = <b>${f(sol.U)} J</b>`) + dato('Trabajo desde θ = 0°', `W = ${f(sol.W)} J`);
      ley = 'Vista de lado, con B hacia la derecha: el par hace girar la espira hacia θ = 0, con m paralelo a B, y oscila alrededor (sin rozamiento). Azul: B; morado: m.';
    } else if (sol.modo === 'hilo') {
      h = dato('Fuerza', `F = <b>${f(sol.F)} N</b>`) + dato('Por metro', `F/L = ${f(sol.F / sol.L)} N/m`) + (sol.arriba !== null ? dato('Sentido', `hacia <b>${sol.arriba ? 'arriba' : 'abajo'}</b>`) : '') + (sol.Iflota !== null ? dato('Corriente para que flote', `I = <b>${f(sol.Iflota)} A</b>`) : '');
      ley = `Los puntos que se mueven son las cargas de la corriente. Morado: fuerza magnética${sol.m !== null ? '; rojo: peso' : ''}.`;
    } else {
      h = dato('Fuerza por metro', `F/L = <b>${f(sol.FL)} N/m</b>`) + (sol.F !== null ? dato(`Fuerza en ${f(sol.L)} m`, `F = <b>${f(sol.F)} N</b>`) : '') + dato('Los hilos', `se <b>${sol.mismo ? 'atraen' : 'repelen'}</b>`) + dato('Campo de 1 en 2', `B<sub>1</sub> = ${f(sol.B1)} T`);
      ley = 'Las circunferencias son las líneas del campo del hilo 1. Morado: la fuerza sobre cada hilo.';
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#leyenda').textContent = ley;
    const t3 = sol.modo === 'trayectoria' || sol.modo === 'espejo';
    $('#card3d').hidden = !t3; $('#desc3d').textContent = t3 ? descripcion3d() : '';
    dibuja(); if (t3) vista.dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--tension', '--cuerpo', '--panel', '--bg', '--peso', '--normal', '--fuerza', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = () => Herramienta.lienzo('#escena');
  const flecha = (g, x, y, dx, dy, L, color, lw = 2.4, et = '') => {
    const n = Math.hypot(dx, dy); if (!(n > 0) || !isFinite(n) || !(L > 0)) return;
    const ux = dx / n, uy = dy / n, x2 = x + ux * L, y2 = y + uy * L, a = 4 + lw;
    g.strokeStyle = g.fillStyle = color; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x2 - ux * a, y2 - uy * a); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.8 - uy * a, y2 - uy * a * 1.8 + ux * a); g.lineTo(x2 - ux * a * 1.8 + uy * a, y2 - uy * a * 1.8 - ux * a); g.closePath(); g.fill();
    if (et) { g.font = '600 13px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(et, x2 + ux * 12, y2 + uy * 12); }
  };
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

  function proyeccion(g, x0, y0, pw, ph, pts, nomA, nomB, color, extra) {
    const A = pts.map((q) => q[0]), Bb = pts.map((q) => q[1]), a0 = Math.min(...A, extra ? extra.a0 : Infinity), a1 = Math.max(...A, extra ? extra.a1 : -Infinity), b0 = Math.min(...Bb, extra ? extra.b0 : Infinity), b1 = Math.max(...Bb, extra ? extra.b1 : -Infinity);
    const sa = (a1 - a0) || 1, sb = (b1 - b0) || 1, k = Math.min((pw - 40) / sa, (ph - 34) / sb), ox = x0 + 28 + ((pw - 40) - sa * k) / 2, oy = y0 + ph - 20 - ((ph - 34) - sb * k) / 2;
    const X = (a) => ox + (a - a0) * k, Y = (b) => oy - (b - b0) * k;
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); if (a0 <= 0 && a1 >= 0) { g.moveTo(X(0), Y(b0)); g.lineTo(X(0), Y(b1)); } if (b0 <= 0 && b1 >= 0) { g.moveTo(X(a0), Y(0)); g.lineTo(X(a1), Y(0)); } g.stroke();
    if (extra && extra.lineas) for (const l of extra.lineas) { g.strokeStyle = col['--muted']; g.globalAlpha = 0.5; g.lineWidth = 1; g.beginPath(); l.forEach(([a, b], i) => (i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)))); g.stroke(); g.globalAlpha = 1; }
    g.strokeStyle = col[color]; g.lineWidth = 1.8; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)))); g.stroke();
    g.fillStyle = col['--normal']; g.beginPath(); g.arc(X(pts[0][0]), Y(pts[0][1]), 4.5, 0, 7); g.fill();
    const u = pts[pts.length - 1]; g.fillStyle = col['--peso']; g.fillRect(X(u[0]) - 4, Y(u[1]) - 4, 8, 8);
    etiqueta(g, nomA, x0 + pw - 14, oy + 2, 'right'); etiqueta(g, nomB, x0 + 2, y0 + 2, 'left');
    etiqueta(g, `${txt(f(a0, 3))} … ${txt(f(a1, 3))} m`, x0 + pw / 2, y0 + ph - 14, 'center');
  }
  function graficaT(g, x0, y0, gw, gh, series, tmax) {
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 + gh); g.lineTo(x0 + gw, y0 + gh); g.stroke();
    etiqueta(g, `t = 0 … ${txt(f(tmax, 3))} s`, x0 + gw, y0 + gh + 3, 'right');
    series.forEach((se, i) => {
      const ys = se.pts.map((q) => q[1]), lo = se.lo ?? Math.min(...ys), hi = se.hi ?? Math.max(...ys), rg = (hi - lo) || Math.abs(hi) || 1;
      g.strokeStyle = col[se.color]; g.lineWidth = 2; g.beginPath(); se.pts.forEach(([t, y], j) => { const px = x0 + (t / tmax) * gw, py = y0 + gh - 4 - ((y - lo) / rg) * (gh - 12); j ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
      etiqueta(g, se.nombre, x0 + 8, y0 + 3 + i * 15, 'left', col[se.color]);
    });
  }
  function escNumerica(g, w, h) {
    const M = sol.muestras, hs = h * 0.56, ancho = w / 2;
    if (sol.modo === 'trayectoria') {
      proyeccion(g, 4, 4, ancho - 8, hs - 8, M.map((q) => [q[1], q[2]]), 'x', 'y', '--tension');
      proyeccion(g, ancho + 4, 4, ancho - 8, hs - 8, M.map((q) => [q[1], q[3]]), 'x', 'z', '--tension');
      const KE = M.map((q) => [q[0], 0.5 * sol.P.m * (q[4] * q[4] + q[5] * q[5] + q[6] * q[6])]);
      graficaT(g, 30, hs + 8, w - 44, h - hs - 28, [{ pts: KE, color: '--fuerza', nombre: `Energía cinética (${txt(f(sol.KE0))} → ${txt(f(sol.KE1))} J)` }], sol.tt);
    } else {
      const zm = sol.zm, lineas = [-0.8, -0.5, 0.5, 0.8].map((fr) => Array.from({ length: 41 }, (_, i) => { const z = -zm + (2 * zm * i) / 40; return [fr * 0 + z, (fr * zm * 0.5) / Math.sqrt(1 + (z * z) / (sol.L * sol.L))]; }));
      proyeccion(g, 4, 4, w - 8, hs - 8, M.map((q) => [q[3], q[1]]), 'z', 'x', '--tension', { a0: -zm, a1: zm, b0: -zm * 0.5, b1: zm * 0.5, lineas });
      graficaT(g, 30, hs + 8, w - 44, h - hs - 28, [{ pts: M.map((q) => [q[0], q[3]]), color: '--tension', nombre: `z(t), |z| máx ${txt(f(sol.zmax))} m` }, { pts: sol.mut.map((q) => [q[0], q[1] / sol.mu]), color: '--fuerza', nombre: 'μ(t)/μ₀', lo: 0.9, hi: 1.1 }], M[M.length - 1][0]);
    }
  }
  function descripcion3d() {
    const r = (x) => txt(f(x, 3));
    if (sol.modo === 'trayectoria') {
      const u = sol.rf;
      return `Vista 3D de la trayectoria de ${sol.P.pre ? `${sol.P.art} ${sol.P.nom}` : 'la partícula'}: ${sol.Bm ? `gira alrededor de B con radio ${r(sol.rL)} m` : 'sin campo magnético, se acelera en línea recta'}${sol.hayE && sol.Bm ? `, deriva con velocidad ${r(Math.hypot(...sol.vd))} m/s` : ''}${sol.hayE ? ` y se acelera a lo largo de B a ${r(sol.apar)} m/s²` : ''}. Parte del origen y termina en (${u.map(r).join('; ')}) m. Flecha verde: dirección de B; flecha morada: dirección de E.`;
    }
    return `Vista 3D del espejo magnético: la partícula ${sol.atrapada ? `gira alrededor de las líneas de B y rebota entre z = ±${r(sol.zt)} m con un periodo de ${r(sol.Tb)} s` : `sale de la botella en t = ${r(sol.tEscapa)} s por el extremo`}. Las líneas grises son líneas de B que se juntan hacia los extremos (z = ±${r(sol.zm)} m), donde el campo es ${r(sol.Rm)} veces el del centro.`;
  }
  function escena3d() {
    if (!sol || (sol.modo !== 'trayectoria' && sol.modo !== 'espejo')) return {};
    const M = sol.muestras;
    if (sol.modo === 'trayectoria') {
      const S = Math.max(...M.flatMap((q) => [Math.abs(q[1]), Math.abs(q[2]), Math.abs(q[3])]), 1e-300), n = (q) => [q[1] / S, q[2] / S, q[3] / S];
      const lineas = [{ pts: M.map(n), color: '--tension', ancho: 2, flecha: true }];
      const vec = (u, c, e) => { const m = Math.hypot(...u); if (m) lineas.push({ pts: [[0, 0, 0], u.map((x) => (0.5 * x) / m)], color: c, ancho: 2.4, flecha: true }); };
      vec(sol.B, '--normal'); vec(sol.E, '--fuerza');
      return { lineas, puntos: [{ p: n(M[0]), color: '--normal', r: 5 }, { p: n(M[M.length - 1]), color: '--peso', r: 5 }], ejes: true, etiquetas: [{ p: [0.55, 0, 0], t: 'x' }] };
    }
    const zm = sol.zm, S = zm * 1.05, lineas = [];
    for (const az of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) lineas.push({ pts: Array.from({ length: 31 }, (_, i) => { const z = -zm + (2 * zm * i) / 30, rho = (0.35 * zm) / Math.sqrt(1 + (z * z) / (sol.L * sol.L)); return [(rho * Math.cos(az)) / S, (rho * Math.sin(az)) / S, z / S]; }), color: '--muted', ancho: 1 });
    for (const z of [-zm, zm]) lineas.push({ pts: Array.from({ length: 49 }, (_, i) => [(0.35 * zm * Math.cos((i * Math.PI) / 24)) / S, (0.35 * zm * Math.sin((i * Math.PI) / 24)) / S, z / S]), color: '--suelo', ancho: 2 });
    lineas.push({ pts: M.map((q) => [q[1] / S, q[2] / S, q[3] / S]), color: '--tension', ancho: 1.6, flecha: true });
    return { lineas, puntos: [{ p: [M[0][1] / S, M[0][2] / S, M[0][3] / S], color: '--normal', r: 5 }, { p: [M[M.length - 1][1] / S, M[M.length - 1][2] / S, M[M.length - 1][3] / S], color: '--peso', r: 5 }], ejes: true, etiquetas: [] };
  }
  const vista = Vista3D.monta('#vista3d', { escena: escena3d, descripcion: () => $('#desc3d').textContent || 'Vista tridimensional de la trayectoria', yaw: 0.7, pitch: 0.4 });

  function dibuja() {
    const { g, w, h } = lienzo();
    if (!sol) return;
    if (!col['--ink']) colores();
    const t = tA;
    if (sol.modo === 'trayectoria' || sol.modo === 'espejo') escNumerica(g, w, h);
    else if (sol.modo === 'carga') escCarga(g, w, h, t);
    else if (sol.modo === 'vectorial') escVectores(g, w, h, t);
    else if (sol.modo === 'selector') escSelector(g, w, h, t);
    else if (sol.modo === 'ciclotron') escCiclotron(g, w, h, t);
    else if (sol.modo === 'franja') escFranja(g, w, h, t);
    else if (sol.modo === 'cruzados') escCruzados(g, w, h, t);
    else if (sol.modo === 'hall') escHall(g, w, h, t);
    else if (sol.modo === 'espira') escEspira(g, w, h, t);
    else if (sol.modo === 'hilo') escHilo(g, w, h, t);
    else escParalelos(g, w, h, t);
  }
  function escCarga(g, w, h, t) {
    const q = sol.P.q;
    if (sol.F === 0) {
      g.globalAlpha = 0.5;
      for (let y = 30; y < h; y += 46) { flecha(g, 20, y, 1, 0, w - 40, col['--tension'], 1.3); } g.globalAlpha = 1;
      const dir = sol.th === 0 ? 1 : -1, x = dir > 0 ? 40 + ((t * 80) % (w - 80)) : w - 40 - ((t * 80) % (w - 80));
      bola(g, x, h / 2, 9, q); flecha(g, x + dir * 12, h / 2, dir, 0, 40, col['--normal'], 2.6, 'v');
      etiqueta(g, 'B', 24, 12, 'left', col['--tension']);
      return;
    }
    if (sol.th === 90) {
      simbolos(g, 0, 0, w, h, sol.sentidoB !== 'saliente');
      const R = Math.min(w, h) * 0.33, cx = w / 2, cy = h / 2, s = sol.giro === 'antihorario' ? 1 : -1, ph = s * t * (2 * Math.PI / 4) - Math.PI / 2;
      g.strokeStyle = col['--ink']; g.globalAlpha = 0.25; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
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
    g.globalAlpha = 0.35; for (let y = 24; y < h; y += 44) flecha(g, 8, y, 1, 0, w - 16, col['--tension'], 1.2); g.globalAlpha = 1;
    etiqueta(g, 'B', 12, 4, 'left', col['--tension']);
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
    dib(sol.v, col['--normal'], 'v'); dib(sol.B, col['--tension'], 'B'); if (sol.hayE) dib(sol.E, col['--fuerza'], 'E'); dib(sol.F, col['--peso'], 'F');
    bola(g, o[0], o[1], 7, sol.P.q);
  }
  function escSelector(g, w, h, t) {
    const x1 = w * 0.08, x2 = sol.r2 !== null ? w * 0.5 : w * 0.8, cy = sol.r2 !== null ? h * 0.62 : h / 2, gap = Math.min(110, h * 0.34), q = sol.P.q;
    simbolos(g, x1, cy - gap / 2, x2, cy + gap / 2, true, 30);
    g.fillStyle = col['--peso']; g.fillRect(x1, cy - gap / 2 - 8, x2 - x1, 8); g.fillStyle = col['--z1']; g.fillRect(x1, cy + gap / 2, x2 - x1, 8);
    etiqueta(g, '+ + + +', x1 + 4, cy - gap / 2 - 24, 'left', col['--peso']); etiqueta(g, '− − − −', x1 + 4, cy + gap / 2 + 12, 'left', col['--z1']);
    etiqueta(g, 'E ↓   B ⊗', (x1 + x2) / 2, cy - gap / 2 - 24, 'center');
    const rel = (sol.v - sol.vs) / sol.vs, sg = sol.des === 'si' ? (sol.hacia === 'arriba' ? -1 : 1) : 0, k = Math.min(1, Math.abs(rel) * 5);
    const yv = (x) => cy + sg * (gap / 2) * k * 2 * ((x - x1) / (x2 - x1)) ** 2;
    const vel = (w * 0.9) / 3, Ttot = 3.6, s = (t % Ttot) * vel, recorrido = [];
    let x = x1 - 30, y = cy, choca = false;
    for (let d = 0; d <= s; d += 3) {
      if (x < x1) { x += 3; y = cy; }
      else if (x <= x2) { x += 3; y = yv(x); if (Math.abs(y - cy) >= gap / 2 - 6) { y = cy + Math.sign(y - cy) * (gap / 2 - 6); choca = true; break; } }
      else if (sol.r2 !== null && sol.des !== 'si') {
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
      if (sol.rb !== null) {
        const Rb = R * sol.rb / sol.r2, yb = cy - Math.sign(q) * 2 * Rb;
        g.strokeStyle = col['--fuerza']; g.lineWidth = 2; g.globalAlpha = 0.8; g.setLineDash([6, 4]); g.beginPath(); g.arc(x2, cy - Math.sign(q) * Rb, Rb, -Math.PI / 2, Math.PI / 2, q < 0); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
        g.fillStyle = col['--fuerza']; g.beginPath(); g.arc(x2, yb, 4, 0, 2 * Math.PI); g.fill();
        etiqueta(g, `${txt(f(sol.m2, 3))} u`, x2 - 6, yb - 7, 'right', col['--fuerza']);
        etiqueta(g, `Δx = ${txt(f(sol.sepa, 3))} m`, x2 + 8, h - 38, 'left', col['--fuerza']);
      }
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
  function escFranja(g, w, h, t) {
    const q = sol.P.q, sg = sol.hacia === 'arriba' ? -1 : 1, xa = w * 0.3;
    const s = sol.cruza ? Math.min((w * 0.45) / sol.d, (h * 0.5) / Math.max(sol.y, sol.d * 0.15)) : Math.min((h * 0.4) / sol.r, (w * 0.55) / sol.d), rs = sol.r * s, ds = sol.d * s;
    const y0 = sol.cruza ? (sg < 0 ? h * 0.78 : h * 0.22) : h / 2 - sg * rs;
    g.fillStyle = col['--tension']; g.globalAlpha = 0.07; g.fillRect(xa, 0, Math.min(ds, w - xa), h); g.globalAlpha = 1;
    simbolos(g, xa, 0, Math.min(xa + ds, w), h, sol.sentidoB !== 'saliente', 32);
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(xa, 0); g.lineTo(xa, h); if (xa + ds < w) { g.moveTo(xa + ds, 0); g.lineTo(xa + ds, h); } g.stroke(); g.setLineDash([]);
    if (xa + ds < w) etiqueta(g, `d = ${txt(f(sol.d, 3))} m`, xa + ds / 2, h - 18, 'center');
    const fin = sol.cruza ? (sol.alfa * Math.PI) / 180 : Math.PI, L1 = xa - 20, L2 = rs * fin, L3 = w * 0.6;
    const pos = (u) => {
      if (u < L1) return [20 + u, y0, 0];
      if (u < L1 + L2) { const ph = (u - L1) / rs; return [xa + rs * Math.sin(ph), y0 + sg * rs * (1 - Math.cos(ph)), ph]; }
      const e = (u - L1 - L2), x = xa + rs * Math.sin(fin), y = y0 + sg * rs * (1 - Math.cos(fin));
      return [x + e * Math.cos(fin), y + sg * e * Math.sin(fin), fin];
    };
    const tot = L1 + L2 + L3, u = (t * w * 0.35) % tot, pts = [];
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.35; g.lineWidth = 1.4; g.setLineDash([4, 4]); g.beginPath();
    for (let k = 0; k <= 200; k++) { const p = pos((k / 200) * tot); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    for (let k = 0; k <= 120; k++) pts.push(pos((k / 120) * u));
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.4; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    const [x, y, ph] = pos(u);
    flecha(g, x, y, Math.cos(ph), sg * Math.sin(ph), 44, col['--normal'], 2.4, 'v');
    if (u > L1 && u < L1 + L2) flecha(g, x, y, -Math.sin(ph), sg * Math.cos(ph), 36, col['--peso'], 2.4, 'F');
    bola(g, x, y, 8, q);
    etiqueta(g, sol.cruza ? `α = ${txt(f(sol.alfa, 3))}°` : `2r = ${txt(f(2 * sol.r, 3))} m`, 10, 8);
  }
  function escCruzados(g, w, h, t) {
    const q = sol.P.q, ws = Math.sign(q) * sol.w, T = sol.T, ext = Math.max(sol.avance * 2, 1e-30);
    const s = Math.min((w - 70 - 2 * sol.R * 0) / (ext + 2 * sol.R), sol.h ? (h * 0.62) / sol.h : Infinity), x0 = 30 + sol.R * s, y0 = sol.sube ? h * 0.82 : h * 0.18;
    simbolos(g, 0, 0, w, h, false, 40);
    for (let y = 40; y < h; y += 90) flecha(g, 14, y + 30, 0, -1, 30, col['--fuerza'], 1.6);
    etiqueta(g, 'E ↑   B ⊙', 30, 8);
    const X = (tt) => sol.vd * tt + (sol.u / ws) * Math.sin(ws * tt), Y = (tt) => (sol.u / ws) * (Math.cos(ws * tt) - 1);
    const per = 2, tt = ((t / 2.4) % per) * T;
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.3; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(20, y0); g.lineTo(w - 10, y0); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.4; g.beginPath();
    for (let k = 0; k <= 240; k++) { const a = (k / 240) * tt, px = x0 + X(a) * s, py = y0 - Y(a) * s; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    const px = x0 + X(tt) * s, py = y0 - Y(tt) * s, vx = sol.vd + sol.u * Math.cos(ws * tt), vy = -sol.u * Math.sin(ws * tt);
    g.fillStyle = col['--muted']; g.globalAlpha = 0.6; g.beginPath(); g.arc(x0 + sol.vd * tt * s, y0, 4, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1;
    const Fe = q * sol.E, Fmx = q * vy * sol.B, Fmy = -q * vx * sol.B, ref = Math.max(Math.abs(Fe), Math.abs(q) * sol.vmax * sol.B) || 1;
    flecha(g, px, py, 0, -Math.sign(Fe), 42 * Math.abs(Fe) / ref, col['--fuerza'], 2.4);
    flecha(g, px, py, Fmx, -Fmy, 42 * Math.hypot(Fmx, Fmy) / ref, col['--peso'], 2.4);
    flecha(g, px, py, vx, -vy, 46 * Math.hypot(vx, vy) / (sol.vmax || 1), col['--normal'], 2.4, 'v');
    bola(g, px, py, 8, q);
    etiqueta(g, `v_d = E/B = ${txt(f(sol.vd, 3))} m/s${sol.h ? `  ·  h = ${txt(f(sol.h, 3))} m` : ''}`, w - 10, h - 20, 'right');
  }
  function escHall(g, w, h, t) {
    const x1 = w * 0.1, x2 = w * 0.84, y1 = h * 0.28, y2 = h * 0.72, hu = sol.huecos, sube = sol.arriba;
    g.fillStyle = col['--cuerpo']; g.globalAlpha = 0.6; g.fillRect(x1, y1, x2 - x1, y2 - y1); g.globalAlpha = 1;
    g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.strokeRect(x1, y1, x2 - x1, y2 - y1);
    simbolos(g, x1, y1, x2, y2, sol.sentidoB !== 'saliente', 44);
    flecha(g, x1 - 40, (y1 + y2) / 2, 1, 0, 34, col['--z2'], 2.6, ''); etiqueta(g, 'I', x1 - 30, (y1 + y2) / 2 - 22);
    const arriba = hu === sube ? '+' : '−', abajo = arriba === '+' ? '−' : '+';
    g.font = '600 15px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let x = x1 + 18; x < x2; x += 30) { g.fillStyle = arriba === '+' ? col['--peso'] : col['--z1']; g.fillText(arriba, x, y1 - 10); g.fillStyle = abajo === '+' ? col['--peso'] : col['--z1']; g.fillText(abajo, x, y2 + 11); }
    const dir = hu ? 1 : -1, ancho = x2 - x1;
    for (let k = 0; k < 14; k++) {
      const fase = ((t * 0.35 + k / 14) % 1), x = dir > 0 ? x1 + fase * ancho : x2 - fase * ancho, dy = (y2 - y1) * 0.36 * Math.min(1, fase * 1.6), y = (y1 + y2) / 2 + ((k % 3) - 1) * 18 + (sube ? -dy : dy);
      g.fillStyle = hu ? col['--peso'] : col['--z1']; g.beginPath(); g.arc(x, Math.max(y1 + 6, Math.min(y2 - 6, y)), 4, 0, 2 * Math.PI); g.fill();
    }
    g.strokeStyle = col['--fuerza']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x2 + 22, y1); g.lineTo(x2 + 22, y2); g.stroke();
    etiqueta(g, 'V_H', x2 + 28, (y1 + y2) / 2 - 7, 'left', col['--fuerza']);
    etiqueta(g, 'más potencial', x2 - 4, sol.alta === 'de arriba' ? y1 - 34 : y2 + 24, 'right', col['--ink']);
    etiqueta(g, `V_H = ${txt(f(sol.VH, 3))} V`, x1, h - 20);
  }
  function escEspira(g, w, h, t) {
    const cx = w / 2, cy = h / 2, L = Math.min(w, h) * 0.32, th0 = (sol.th * Math.PI) / 180, th = sol.tau ? th0 * Math.cos(t * 1.6) : th0;
    g.globalAlpha = 0.35; for (let y = 22; y < h; y += 44) flecha(g, 8, y, 1, 0, w - 16, col['--tension'], 1.2); g.globalAlpha = 1;
    etiqueta(g, 'B', 12, 4, 'left', col['--tension']);
    const nx = Math.cos(th), ny = -Math.sin(th);
    g.strokeStyle = col['--ink']; g.lineWidth = 3; g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.7;
    g.beginPath(); g.ellipse(cx, cy, L * 0.22, L, Math.atan2(ny, nx), 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1; g.stroke();
    const ax = cx - ny * L, ay = cy + nx * L, bx = cx + ny * L, by = cy - nx * L;
    g.fillStyle = col['--panel']; for (const [x, y] of [[ax, ay], [bx, by]]) { g.beginPath(); g.arc(x, y, 8, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax - 4, ay - 4); g.lineTo(ax + 4, ay + 4); g.moveTo(ax + 4, ay - 4); g.lineTo(ax - 4, ay + 4); g.stroke();
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(bx, by, 2.5, 0, 2 * Math.PI); g.fill();
    flecha(g, cx, cy, nx, ny, L * 0.9, col['--fuerza'], 3, 'm');
    if (Math.abs(th) > 0.05) { g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, 30, Math.min(0, -th), Math.max(0, -th)); g.stroke(); etiqueta(g, 'θ', cx + 34 * Math.cos(th / 2), cy - 34 * Math.sin(th / 2) - 6); }
    etiqueta(g, `τ = ${txt(f(sol.tau, 3))} N·m con θ = ${txt(f(sol.th, 3))}°`, w - 10, h - 20, 'right');
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
    g.strokeStyle = col['--tension']; g.globalAlpha = 0.35; g.lineWidth = 1.2;
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

  Herramienta.exportar('#escena', { nombre: 'fuerza-magnetica', titulo: 'Fuerza magnética', datos: () => (sol && sol.muestras ? { cab: ['t (s)', 'x (m)', 'y (m)', 'z (m)', 'vx (m/s)', 'vy (m/s)', 'vz (m/s)'], filas: sol.muestras } : null) });
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
  window.FuerzaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { atrapada: sol.atrapada, KE1: sol.KE1, zmax: sol.zmax, modo: sol.modo, F: sol.F, Fmod: sol.Fmod, r: sol.r, vs: sol.vs, r2: sol.r2, sepa: sol.sepa, fr: sol.fr, n: sol.n, FL: sol.FL, alfa: sol.alfa, vd: sol.vd, h: sol.h, VH: sol.VH, tau: sol.tau }, estado: () => copia(sc) };
})();

