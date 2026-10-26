/* =====================================================================
   Ondas electromagnéticas planas: interfaz (formulario por modo,
   resultado, dibujo en perspectiva de E y B a lo largo de la dirección de
   propagación, con la polarización y la atenuación en un medio con
   pérdidas, la onda estacionaria de una incidencia normal, o los frentes
   de onda de una fuente puntual, y el desarrollo).
   El cálculo está en ondasem/fisica.js (OndasEM).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const O = OndasEM, f = O.f, CLAVE = 'ondasem-v1';
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<sub>(.*?)<\/sub>/g, (_, e) => e.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['onda', 'Onda plana: E, B y su expresión'], ['expresion', 'Onda a partir de E(r, t) o B(r, t)'], ['incidencia', 'Incidencia normal: reflexión y onda estacionaria'], ['intensidad', 'Intensidad y presión de radiación'], ['perdidas', 'Medio con pérdidas (conductor)']];
  const DIRS = ['+x', '-x', '+y', '-y', '+z', '-z'].map((d) => [d, d.replace('-', '−')]).concat([['otra', 'otra (componentes)']]);

  let sc = copia(O.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const tres = (p, nom) => `<label>${nom}</label><div class="tres">${['x', 'y', 'z'].map((e) => `<input id="f-${p}${e}" class="in" data-k="${p}${e}" value="${esc(sc[p + e] ?? '')}" inputmode="decimal" autocomplete="off" placeholder="${e}" aria-label="${nom}, componente ${e}">`).join('')}</div>`;
  const DATO = [['f', 'Frecuencia f'], ['lambda', 'Longitud de onda λ'], ['omega', 'Frecuencia angular ω'], ['k', 'Número de onda k']], UN = { f: 'Hz', lambda: 'm', omega: 'rad/s', k: 'rad/m' };
  const medioF = () => elige('medio', 'Medio', [['vacio', 'Vacío (o aire)'], ['medio', 'Un material (εr, μr)']]) + (sc.medio === 'medio' ? fila('er', 'Permitividad relativa ε<sub>r</sub>') + fila('mr', 'Permeabilidad relativa μ<sub>r</sub>', 'opcional, 1') : '');
  const NOTAS = {
    onda: 'Se admite 3e8, 3·10^8 o 10^8. La onda se escribe como E₀ cos(k·r − ωt + φ): si avanza hacia −z sale cos(kz + ωt). E tiene que ser perpendicular a la dirección de propagación. Con «otra» escribes las componentes, p. ej. (1, 1, 0).',
    expresion: 'Escribe la amplitud, cos o sen con la fase y la dirección: 30 cos(2,094y + 6,283e8t) k, 5 sen(2x + 2y − 8,5e8t + π/4) (1, −1, 0)… Se admiten î ĵ k̂, i j k o x y z.',
    incidencia: 'La onda llega por z < 0 hacia +z con E según x y choca en z = 0 con un conductor perfecto o con otro medio.',
    intensidad: 'La intensidad es el valor medio del vector de Poynting. Una fuente puntual la reparte en una esfera, así que baja como 1/r².',
    perdidas: 'Con conductividad σ la onda se atenúa como e^(−αz). Si σ/(ωε) es mucho mayor que 1 el medio es un buen conductor y la onda apenas entra (efecto pelicular).',
  };
  function formulario() {
    let h = elige('modo', 'Cálculo', MODOS);
    if (sc.modo === 'onda') {
      const tp = sc.tipoPol || 'lineal';
      h += medioF() + elige('dato', 'Dato de la onda', DATO) + fila('valor', DATO.find(([k]) => k === (sc.dato || 'f'))[1], UN[sc.dato || 'f']) + fila('E0', tp === 'lineal' ? 'Amplitud E<sub>0</sub>' : 'Amplitud E<sub>01</sub>', 'V/m') + sep('Direcciones') + elige('prop', 'Se propaga hacia', DIRS) + (sc.prop === 'otra' ? tres('k', 'Dirección de k') : '') + elige('pol', 'E apunta hacia', DIRS) + (sc.pol === 'otra' ? tres('e', 'Dirección de E') : '');
      h += sep('Polarización y fase') + elige('tipoPol', 'Polarización', [['lineal', 'Lineal'], ['circular', 'Circular'], ['eliptica', 'Elíptica']]);
      if (tp === 'circular') h += elige('giro', 'Gira, visto por quien la recibe', [['antihorario', 'En sentido antihorario'], ['horario', 'En sentido horario']]);
      if (tp === 'eliptica') h += fila('E02', 'Amplitud E<sub>02</sub> (según k̂ × Ê)', 'V/m') + fila('delta', 'Desfase δ', '°');
      h += fila('fase', 'Fase inicial φ (opcional)', '°');
    } else if (sc.modo === 'expresion') h += elige('campo', 'Me dan', [['E', 'El campo eléctrico E(r, t)'], ['B', 'El campo magnético B(r, t)']]) + `<label for="f-expr">${sc.campo === 'B' ? 'B(r, t) en T' : 'E(r, t) en V/m'}</label><input id="f-expr" class="in" data-k="expr" value="${esc(sc.expr ?? '')}" autocomplete="off" spellcheck="false">`;
    else if (sc.modo === 'incidencia') h += medioF() + elige('dato', 'Dato de la onda', DATO) + fila('valor', DATO.find(([k]) => k === (sc.dato || 'f'))[1], UN[sc.dato || 'f']) + fila('E0', 'Amplitud incidente E<sub>0</sub>', 'V/m') + sep('Al otro lado de z = 0') + elige('destino', 'Choca con', [['conductor', 'Un conductor perfecto'], ['dielectrico', 'Otro medio (dieléctrico)']]) + (sc.destino === 'dielectrico' ? fila('er2', 'Permitividad relativa ε<sub>r2</sub>') + fila('mr2', 'Permeabilidad relativa μ<sub>r2</sub>', 'opcional, 1') : '');
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
      if (k === 'destino' && t.value === 'dielectrico' && !sc.er2) sc.er2 = '2,25';
      if (k === 'tipoPol' && t.value === 'eliptica' && !sc.E02) { sc.E02 = String(sc.E0 || '10').replace(/^(\d+)/, (m) => String(Math.max(1, Math.round(+m / 2)))); sc.delta = '90'; }
      if (k === 'prop' && t.value === 'otra' && !sc.kx) Object.assign(sc, { kx: '1', ky: '1', kz: '0' });
      if (k === 'pol' && t.value === 'otra' && !sc.ex) Object.assign(sc, { ex: '0', ey: '0', ez: '1' });
      // E perpendicular a k: si coinciden, se cambia la otra
      if ((k === 'prop' || k === 'pol') && sc.prop !== 'otra' && sc.pol !== 'otra' && sc.prop.slice(-1) === sc.pol.slice(-1)) { const libre = 'xyz'.split('').find((c) => c !== sc.prop.slice(-1)); if (k === 'prop') sc.pol = '+' + libre; else sc.prop = '+' + 'xyz'.split('').find((c) => c !== sc.pol.slice(-1)); }
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
      () => ({ modo: 'onda', medio: 'vacio', er: '', mr: '', dato: de(['f', 'lambda']), valor: '', E0: String(de([10, 20, 50])), prop: '+z', pol: '+x', tipoPol: de(['circular', 'eliptica']), giro: de(['horario', 'antihorario']), E02: String(de([5, 10, 15])), delta: de(['90', '-90', '45']), fase: '' }),
      () => ({ modo: 'incidencia', medio: 'vacio', er: '', mr: '', dato: 'f', valor: de(['1e8', '1e9', '3e9']), E0: String(de([10, 50, 100])), destino: de(['conductor', 'dielectrico']), er2: de(['2,25', '4', '9']), mr2: '' }),
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
    if (sc.modo === 'expresion') return `El campo ${sc.campo === 'B' ? 'magnético' : 'eléctrico'} de una onda plana es ${sc.campo === 'B' ? 'B' : 'E'}(r, t) = ${esc(sc.expr)} (SI). Calcula la dirección de propagación, λ, f, la velocidad, el otro campo y la intensidad.`;
    if (sc.modo === 'incidencia') return `Una onda plana de ${esc(sc.valor)} ${UN[sc.dato || 'f']} y amplitud ${esc(sc.E0)} V/m llega desde el vacío perpendicularmente a ${sc.destino === 'dielectrico' ? `un medio con εr = ${esc(sc.er2)}. Calcula los coeficientes de reflexión y transmisión y qué fracción de la energía se refleja.` : 'un conductor perfecto. Escribe la onda estacionaria que se forma, dónde están los nodos de E y la presión de radiación.'}`;
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
    if (sol.modo === 'incidencia') {
      h = sol.cond ? dato('Coeficiente de reflexión', 'r = <b>−1</b>') + dato('Distancia entre nodos', `λ/2 = <b>${f(sol.F.lam / 2)} m</b>`) + dato('Amplitud en los vientres', `2E<sub>0</sub> = <b>${f(2 * sol.E0)} V/m</b>`) + dato('Presión de radiación', `p = ${f((2 * sol.I0) / sol.M.v)} Pa`) + dato('Corriente superficial', `K = ${f(sol.K)} A/m`) + dato('Campo eléctrico', `E = ${f(2 * sol.E0)} sen(${f(sol.F.k)}z) sen(${f(sol.F.w)}t) î V/m`, 'ancho')
        : dato('Reflexión', `r = <b>${f(sol.r)}</b>`) + dato('Transmisión', `t = <b>${f(sol.t)}</b>`) + dato('Energía reflejada', `R = <b>${f(100 * sol.R, 3)} %</b>`) + dato('Energía transmitida', `T = <b>${f(100 * sol.T, 3)} %</b>`) + dato('Onda estacionaria', `|E| entre ${f(sol.E0 * (1 - Math.abs(sol.r)))} y ${f(sol.E0 * (1 + Math.abs(sol.r)))} V/m`);
    } else if (sol.modo === 'onda' || sol.modo === 'expresion') {
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
    $('#leyenda').innerHTML = sol.modo === 'incidencia' ? `E total en rojo y B total en azul a lo largo de z; la línea discontinua es la amplitud. ${sol.cond ? 'Los puntos marcan los nodos de E: la onda no avanza, oscila en su sitio.' : 'A la derecha, la onda transmitida.'}` : sol.modo === 'intensidad' && sol.de === 'fuente' ? 'Frentes de onda esféricos que salen de la fuente: la misma potencia se reparte en esferas cada vez mayores.' : (sol.tp && sol.tp !== 'lineal') ? 'E en rojo y B en azul: con dos componentes desfasadas, la punta de E gira alrededor del eje de propagación (en naranja la dirección de avance).' : `E en rojo, B en azul y la dirección de propagación (el vector de Poynting) en naranja${sol.modo === 'perdidas' && sol.alfa > 0 ? '; la línea discontinua es la envolvente e<sup>−αz</sup> y la marca, la profundidad δ' : ''}.`;
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
    if (sol.modo === 'incidencia') return incide(g, w, h);
    plana(g, w, h);
  }
  // onda plana en perspectiva: el eje de propagación en horizontal, E en vertical y B en profundidad
  function plana(g, w, h) {
    const per = sol.modo !== 'perdidas';
    // etiquetas de los ejes: ±x… si van por los ejes; si no, k̂, Ê y B̂
    const eti = (v, por) => { if (!per || !v) return por; const i = v.findIndex((c) => Math.abs(c) > 1 - 1e-9); return i < 0 ? null : `${v[i] > 0 ? '+' : '−'}${'xyz'[i]}`; };
    const tK = eti(sol.K && sol.K.v, '+z') || 'k̂', tE = eti(sol.Ed && sol.Ed.v, '+x') || 'Ê', tB = eti(sol.Bv, '+y') || 'B̂';
    const lam = sol.modo === 'perdidas' ? sol.lam : sol.F ? sol.F.lam : 1, alfa = sol.modo === 'perdidas' ? sol.alfa : 0;
    // polarización: E = E01 cos(φ) ê1 + E02 cos(φ + δ) ê2 y B = (E01 cos φ ê2 − E02 cos(φ + δ) ê1)/v
    const E02 = sol.tp && sol.tp !== 'lineal' ? sol.E02 / Math.max(sol.E0, sol.E02) : 0, E01 = sol.tp && sol.tp !== 'lineal' ? sol.E0 / Math.max(sol.E0, sol.E02) : 1, dl = sol.dl || 0, phi0 = sol.phi || 0;
    // tramo que se ve: dos longitudes de onda, o unas cuatro profundidades si la onda se apaga antes
    const L = alfa > 0 && 4 / alfa < 2 * lam ? 4 / alfa : 2 * lam;
    const A = Math.min(h * 0.32, 110), dx = -0.55, dy = 0.42, Bs = A * 0.85, x0 = Math.round((Bs + 30) * -dx + 24), x1 = w - 30, yc = h * 0.5;
    const P = (s, e, b) => [x0 + ((x1 - x0) * s) / L + b * dx, yc - e + b * dy]; // s en metros a lo largo de la propagación
    const t = tA * 0.6, fase = (s) => 2 * Math.PI * (s / lam) - 2 * Math.PI * t + phi0;
    g.lineWidth = 1; g.strokeStyle = col['--line']; g.font = `12px ${FU}`;
    // ejes
    flecha(g, x0 - 20, yc, x1 + 18, yc, col['--muted'], 1.2);
    flecha(g, x0, yc + A * 0.15, x0, yc - A - 18, col['--muted'], 1.2);
    flecha(g, x0, yc, x0 + (Bs + 26) * dx, yc + (Bs + 26) * dy, col['--muted'], 1.2);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(tK, x1 + 4, yc - 12); g.fillText(tE, x0 + 6, yc - A - 14); g.fillText(tB, x0 + (Bs + 30) * dx + 8, yc + (Bs + 30) * dy + 4);
    // envolvente con pérdidas
    if (alfa > 0) {
      g.setLineDash([5, 4]); g.strokeStyle = col['--e']; g.globalAlpha = 0.6; g.beginPath();
      for (let i = 0; i <= 100; i++) { const s = (L * i) / 100, [x, y] = P(s, A * Math.exp(-alfa * s), 0); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.globalAlpha = 1; g.setLineDash([]);
      const d = 1 / alfa; if (d < L) { const [x] = P(d, 0, 0); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(x, yc + 6); g.lineTo(x, yc - 6); g.stroke(); g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('δ', x, yc + 8); }
    }
    const th = sol.modo === 'perdidas' ? sol.th : 0, n = 44;
    // vectores E y B en cada punto y las curvas que unen sus puntas
    const puntas = (fn) => { g.beginPath(); for (let i = 0; i <= 200; i++) { const s = (L * i) / 200, [x, y] = fn(s); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    const Bv = (s) => { const at = Math.exp(-alfa * s); return [-Bs * at * E02 * Math.cos(fase(s) + dl - th), Bs * at * E01 * Math.cos(fase(s) - th)]; };
    const Ev = (s) => { const at = Math.exp(-alfa * s); return [A * at * E01 * Math.cos(fase(s)), A * at * E02 * Math.cos(fase(s) + dl) * (Bs / A)]; };
    g.lineWidth = 2; g.strokeStyle = col['--b']; puntas((s) => P(s, ...Bv(s)));
    for (let i = 0; i <= n; i++) { const s = (L * i) / n, a = P(s, 0, 0), b = P(s, ...Bv(s)); g.globalAlpha = 0.55; flecha(g, a[0], a[1], b[0], b[1], col['--b'], 1.4); }
    g.globalAlpha = 1; g.lineWidth = 2.4; g.strokeStyle = col['--e']; puntas((s) => P(s, ...Ev(s)));
    for (let i = 0; i <= n; i++) { const s = (L * i) / n, a = P(s, 0, 0), b = P(s, ...Ev(s)); g.globalAlpha = 0.7; flecha(g, a[0], a[1], b[0], b[1], col['--e'], 1.6); }
    g.globalAlpha = 1;
    // dirección de propagación
    const yS = 22; flecha(g, w / 2 - 50, yS, w / 2 + 50, yS, col['--s'], 2.6); g.fillStyle = col['--s']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('S = E × B/μ', w / 2 + 58, yS);
    g.fillStyle = col['--e']; g.textAlign = 'left'; g.font = `600 13px ${FU}`; g.fillText('E', x0 + 10, yc - A - 2);
    g.fillStyle = col['--b']; g.textAlign = 'right'; g.fillText('B', x0 + Bs * dx * 0.55 - 8, yc + Bs * dy * 0.55 + 4);
    g.fillStyle = col['--muted']; g.font = `12px ${FU}`; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(`tramo de ${txt(f(L, 3))} m${per ? ` = ${txt(f(L / lam, 3))} λ` : ''}`, x1, h - 6);
  }
  // incidencia normal: E y B totales a lo largo de z, con la amplitud y los nodos
  function incide(g, w, h) {
    const { F, E0, cond } = sol, lam = F.lam, k = F.k, r = sol.r, tt = sol.t, lam2 = cond ? lam : lam * (sol.M2.v / sol.M.v), z0 = -2 * lam, z1 = cond ? 0.25 * lam : 1.5 * lam2;
    const ml = 20, mr = 20, X = (z) => ml + ((z - z0) / (z1 - z0)) * (w - ml - mr), yc = h * 0.52, A = h * 0.2, Y = (e) => yc - (A * e) / E0, wt = tA * 2.4;
    const xs = X(0);
    g.fillStyle = cond ? col['--muted'] : col['--line']; g.globalAlpha = cond ? 0.35 : 0.5; g.fillRect(xs, 8, w - mr - xs + mr, h - 16); g.globalAlpha = 1;
    g.font = `12px ${FU}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = col['--muted'];
    g.fillText(sol.M.vacioM ? 'vacío' : 'medio 1', (ml + xs) / 2, 10); g.fillText(cond ? 'conductor' : 'medio 2', (xs + w - mr) / 2, 10);
    flecha(g, ml, yc, w - mr + 10, yc, col['--muted'], 1);
    g.textAlign = 'right'; g.fillText('z', w - mr + 8, yc + 6);
    // E y B totales: incidente + reflejada a la izquierda; transmitida a la derecha
    const Et = (z) => (z <= 0 ? E0 * (Math.cos(k * z - wt) + r * Math.cos(-k * z - wt)) : cond ? 0 : tt * E0 * Math.cos((k * lam / lam2) * z - wt));
    const Bt = (z) => (z <= 0 ? E0 * (Math.cos(k * z - wt) - r * Math.cos(-k * z - wt)) : cond ? 0 : tt * E0 * (lam2 / lam) * Math.cos((k * lam / lam2) * z - wt));
    const env = (z) => (z <= 0 ? E0 * Math.sqrt(1 + r * r + 2 * r * Math.cos(2 * k * z)) : cond ? 0 : tt * E0);
    const curva = (fn, c, lw, dash = []) => { g.strokeStyle = c; g.lineWidth = lw; g.setLineDash(dash); g.beginPath(); for (let i = 0; i <= 400; i++) { const z = z0 + ((z1 - z0) * i) / 400, y = Y(fn(z)); i ? g.lineTo(X(z), y) : g.moveTo(X(z), y); } g.stroke(); g.setLineDash([]); };
    g.globalAlpha = 0.6; curva(env, col['--e'], 1.2, [5, 4]); curva((z) => -env(z), col['--e'], 1.2, [5, 4]); g.globalAlpha = 1;
    g.globalAlpha = 0.75; curva(Bt, col['--b'], 1.8); g.globalAlpha = 1; curva(Et, col['--e'], 2.4);
    if (cond) { g.fillStyle = col['--ink']; for (let n = 0; -n * lam / 2 >= z0; n++) { g.beginPath(); g.arc(X((-n * lam) / 2), yc, 3.5, 0, 2 * Math.PI); g.fill(); } }
    g.strokeStyle = col['--ink']; g.lineWidth = 2; g.beginPath(); g.moveTo(xs, 8); g.lineTo(xs, h - 8); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillStyle = col['--muted']; g.fillText(cond ? `nodos de E cada λ/2 = ${txt(f(lam / 2, 3))} m` : `r = ${txt(f(r, 3))}, t = ${txt(f(tt, 3))}`, ml, h - 6);
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
  window.OndasEMApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, I: sol.I, B0: sol.B0, alfa: sol.alfa, delta: sol.delta, r: sol.r, R: sol.R }, estado: () => copia(sc) };
})();
