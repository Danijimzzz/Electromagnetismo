/* =====================================================================
   Transitorios: interfaz (RC, RL, RLC en serie y en paralelo, y un
   circuito cualquiera de primer orden escrito como lista de elementos;
   esquema del circuito con la corriente que circula y la carga del
   condensador, gráfica de la tensión y la corriente frente al tiempo con
   un cursor que avanza o que se lleva con el ratón, y el desarrollo).
   El cálculo está en transitorios/fisica.js (Transitorios); el circuito
   cualquiera se resuelve con circuitos/fisica.js (Continua).
   ===================================================================== */
(() => {
  const { $, esc, copia, txt } = Herramienta;
  const T = Transitorios, f = T.f, u = T.u, CLAVE = 'transitorios-v1';
  const MODOS = [['rc', 'Circuito RC (condensador)'], ['rl', 'Circuito RL (bobina)'], ['rlc', 'Circuito RLC en serie'], ['rlcp', 'Circuito RLC en paralelo'], ['primer', 'Circuito cualquiera de primer orden']];
  const UN = { R: 'Ω', V: 'V', I: 'A', C: 'μF', L: 'mH' }, VALOR = { R: '1k', V: '10', I: '1', C: '100', L: '100' }, MAX = 12;
  const NOMBRE = { R: 'Resistencia', V: 'Fuente de tensión', I: 'Fuente de corriente', C: 'Condensador', L: 'Bobina' };
  const CUANDO = [['siempre', 'Siempre'], ['antes', 'Antes'], ['despues', 'Después']];

  let sc = copia(T.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0, tFijo = null, fijo = false, ejeX = null;
  const md = () => sol.base || sol.modo;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    rc: 'El interruptor se cierra en t = 0. En la descarga no hay fuente: el condensador se descarga a través de R. Al conmutar, en t₁ se quita la fuente y se descarga por R₂. Se admite 4,7e-3, 4,7·10^-3 y prefijos como 4k7, 100n o 5m.',
    rl: 'En la subida se conecta la fuente en t = 0; en la bajada se quita y la bobina, que llevaba V/R (o I₀), se descarga a través de R o de R₂. Al conmutar, sube hasta t₁ y entonces se abre el interruptor.',
    rlc: 'R, L y C en serie con una fuente que se conecta en t = 0 (pon 0 V para la respuesta libre). V₀ e I₀ son la tensión del condensador y la corriente al empezar.',
    rlcp: 'Una fuente de corriente se conecta en t = 0 a R, L y C en paralelo (deja R vacía si no hay resistencia). V₀ es la tensión común al empezar e I₀, la corriente de la bobina.',
    primer: 'Escribe el circuito como en Circuitos de continua: cada elemento va del nudo A al nudo B (en una fuente de tensión A es el +; en una de corriente, la corriente va de A a B) y 0 es la referencia. El interruptor actúa en t = 0: lo conectado «Antes» se desconecta y lo conectado «Después» se conecta. Un solo condensador o una sola bobina, siempre conectado.',
  };
  function lista() {
    const els = sc.elementos || [], nom = Continua.nombres(els);
    const campo = (i, k, v, et, extra = '') => `<input class="in" data-i="${i}" data-k="${k}" value="${esc(v ?? '')}" aria-label="${nom[i]}: ${et}" autocomplete="off" spellcheck="false"${extra}>`;
    return '<div class="lista ancho"><span></span><span class="cab">Nudo A</span><span class="cab">Nudo B</span><span class="cab">Valor</span><span class="cab">Conectado</span><span></span>' + els.map((e, i) => `<b title="${NOMBRE[e.t]}">${nom[i].replace(/^(\w)(\d+)$/, '$1<sub>$2</sub>')}</b>${campo(i, 'a', e.a, 'nudo A')}${campo(i, 'b', e.b, 'nudo B')}<span class="valor">${campo(i, 'v', e.v, `valor en ${UN[e.t]}`, ' inputmode="decimal"')}<small>${UN[e.t]}</small></span><select class="in" data-i="${i}" data-k="cuando" aria-label="${nom[i]}: cuándo está conectado">${CUANDO.map(([v, t]) => `<option value="${v}"${(e.cuando || 'siempre') === v ? ' selected' : ''}>${t}</option>`).join('')}</select><button class="x" type="button" data-quita="${i}" aria-label="Quitar ${nom[i]}">×</button>`).join('') + '</div>'
      + `<div class="botones ancho">${Object.keys(UN).map((t) => `<button class="btn" type="button" data-add="${t}">+ ${NOMBRE[t]}</button>`).join('')}</div>`;
  }
  function formulario() {
    let h = elige('modo', 'Circuito', MODOS);
    const p = sc.proceso;
    if (sc.modo === 'rc') {
      h += elige('proceso', 'Proceso', [['carga', 'Carga (se conecta la fuente)'], ['descarga', 'Descarga (sin fuente)'], ['conmuta', 'Carga y, en t₁, descarga por R₂']]);
      if (p === 'conmuta') h += fila('V', 'Tensión de la fuente V', 'V') + fila('R', 'Resistencia de carga R', 'Ω') + fila('R2', 'Resistencia de descarga R₂', 'Ω') + fila('C', 'Capacidad C', 'μF') + fila('t1', 'Instante t₁ en que conmuta', 's') + sep('Opcional') + fila('V0', 'Tensión inicial V₀', 'V') + fila('t', 'Instante t', 's');
      else { const carga = p !== 'descarga'; h += (carga ? fila('V', 'Tensión de la fuente V', 'V') : '') + fila('V0', carga ? 'Tensión inicial V₀ (opcional)' : 'Tensión inicial V₀', 'V') + fila('R', 'Resistencia R', 'Ω') + fila('C', 'Capacidad C', 'μF') + sep('Opcional') + fila('t', 'Instante t', 's') + fila('Vobj', 'Tiempo hasta que V<sub>C</sub> valga', 'V'); }
    } else if (sc.modo === 'rl') {
      h += elige('proceso', 'Proceso', [['subida', 'Se conecta la fuente'], ['bajada', 'Se quita la fuente'], ['conmuta', 'Se conecta y, en t₁, se abre']]) + fila('V', 'Tensión de la fuente V', 'V') + fila('R', 'Resistencia R', 'Ω');
      if (p === 'conmuta') h += fila('R2', 'Resistencia de descarga R₂', 'Ω') + fila('L', 'Inductancia L', 'mH') + fila('t1', 'Instante t₁ en que se abre', 's') + sep('Opcional') + fila('t', 'Instante t', 's');
      else h += fila('L', 'Inductancia L', 'mH') + sep('Opcional') + (p === 'bajada' ? fila('R2', 'Descarga por R₂ (si no, por R)', 'Ω') : '') + fila('I0', p === 'bajada' ? 'Corriente inicial I₀ (si no, V/R)' : 'Corriente inicial I₀', 'A') + fila('t', 'Instante t', 's') + fila('Iobj', 'Tiempo hasta que i valga', 'A');
    } else if (sc.modo === 'rlc') h += fila('V', 'Tensión de la fuente V', 'V') + fila('R', 'Resistencia R', 'Ω') + fila('L', 'Inductancia L', 'mH') + fila('C', 'Capacidad C', 'μF') + sep('Opcional') + fila('V0', 'Tensión inicial del condensador V₀', 'V') + fila('I0', 'Corriente inicial I₀', 'A') + fila('t', 'Instante t', 's') + fila('Vobj', 'Tiempo hasta que V<sub>C</sub> valga', 'V');
    else if (sc.modo === 'rlcp') h += fila('I', 'Corriente de la fuente I', 'A') + fila('R', 'Resistencia R (vacía si no hay)', 'Ω') + fila('L', 'Inductancia L', 'mH') + fila('C', 'Capacidad C', 'μF') + sep('Opcional') + fila('V0', 'Tensión inicial V₀', 'V') + fila('I0', 'Corriente inicial de la bobina I₀', 'A') + fila('t', 'Instante t', 's') + fila('Iobj', 'Tiempo hasta que i<sub>L</sub> valga', 'A');
    else h += lista() + sep('Opcional') + fila('x0', 'Valor inicial dado (V<sub>C</sub> o i<sub>L</sub>)', 'V o A') + fila('t', 'Instante t', 's') + fila('obj', 'Tiempo hasta que valga', 'V o A');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  const ejemploDe = (pred) => copia(T.ejemplos.find((x) => pred(x.sc)).sc);
  function anade(t) {
    const els = sc.elementos || (sc.elementos = []);
    if (els.length >= MAX) return;
    const ult = els[els.length - 1];
    els.push({ t, a: ult ? ult.b : 'a', b: '0', v: VALOR[t], cuando: 'siempre' });
    formulario(); cambia();
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (t.tagName !== 'INPUT') return;
    if (t.dataset.i !== undefined) sc.elementos[+t.dataset.i][t.dataset.k] = t.value; else sc[t.dataset.k] = t.value;
    cambia();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    if (t.dataset.i !== undefined) { sc.elementos[+t.dataset.i].cuando = t.value; cambia(); return; }
    if (t.dataset.k === 'modo') sc = ejemploDe((x) => x.modo === t.value);
    else if (t.value === 'conmuta') sc = ejemploDe((x) => x.modo === sc.modo && x.proceso === 'conmuta');
    else {
      if (sc.proceso === 'conmuta') sc.t1 = '';
      sc.proceso = t.value;
      if (t.value === 'descarga' && !sc.V0) sc.V0 = sc.V || '10';
      if (t.value === 'carga' && !sc.V) sc.V = sc.V0 || '10';
      if (t.value === 'descarga') sc.Vobj = '';
    }
    formulario(); cambia();
  });
  $('#campos').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.add) anade(b.dataset.add);
    else if (b.dataset.quita !== undefined) { sc.elementos.splice(+b.dataset.quita, 1); formulario(); cambia(); }
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
      () => { const R = de([1000, 2200, 4700]), C = de([10, 47, 100]), tau = (R * C) / 1e6; return { modo: 'rc', proceso: 'conmuta', V: String(de([5, 10, 12])), V0: '', R: String(R), R2: String(de([470, 1000, 10000])), C: String(C), t1: c(+(tau * de([1, 2, 3])).toPrecision(3)), t: '' }; },
      () => { const R = de([2, 5, 10, 20, 50]), L = de([10, 50, 100, 200, 500]), tau = L / 1000 / R; return { modo: 'rl', proceso: de(['subida', 'bajada']), V: String(de([6, 10, 12, 24])), R: String(R), L: String(L), t: c(+(tau * de([0.5, 1, 2])).toPrecision(3)), Iobj: '' }; },
      () => ({ modo: 'rlc', V: String(de([5, 10, 12])), R: String(de([10, 20, 50, 200, 500, 1000])), L: String(de([10, 50, 100])), C: String(de([1, 10, 100])), V0: '', I0: '', t: '', Vobj: '' }),
      () => ({ modo: 'rlcp', I: c(de([0.5, 1, 2])), R: String(de([20, 50, 200, 500])), L: String(de([10, 100])), C: String(de([10, 100])), V0: '', I0: '', t: '', Iobj: '' }),
      () => ({ modo: 'primer', elementos: [{ t: 'V', a: 'a', b: '0', v: String(de([6, 10, 12, 24])), cuando: 'siempre' }, { t: 'R', a: 'a', b: 'b', v: de(['1k', '2k', '4k7', '10k']), cuando: 'siempre' }, { t: 'C', a: 'b', b: '0', v: String(de([10, 47, 100])), cuando: 'siempre' }, { t: 'R', a: 'b', b: '0', v: de(['1k', '3k', '10k']), cuando: de(['antes', 'despues']) }], x0: '', t: '', obj: '' }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'rc' && sc.proceso === 'conmuta') return `Un condensador de ${esc(sc.C)} μF${sc.V0 ? ` a ${esc(sc.V0)} V` : ' descargado'} se carga con una fuente de ${esc(sc.V)} V a través de ${esc(sc.R)} Ω. En t₁ = ${esc(sc.t1)} s se quita la fuente y se descarga por ${esc(sc.R2)} Ω. Calcula la tensión en t₁ y V<sub>C</sub>(t) en los dos tramos.`;
    if (sc.modo === 'rc') return sc.proceso === 'descarga' ? `Un condensador de ${esc(sc.C)} μF cargado a ${esc(sc.V0)} V se descarga por una resistencia de ${esc(sc.R)} Ω. Calcula la constante de tiempo${sc.Vobj ? ` y cuánto tarda en bajar a ${esc(sc.Vobj)} V` : ''}${sc.t ? ` y la tensión a los ${esc(sc.t)} s` : ''}.` : `Se conecta un condensador de ${esc(sc.C)} μF${sc.V0 ? ` (a ${esc(sc.V0)} V)` : ' descargado'} a una fuente de ${esc(sc.V)} V a través de ${esc(sc.R)} Ω. Calcula τ, la corriente inicial${sc.t ? ` y la tensión y la corriente a los ${esc(sc.t)} s` : ''}${sc.Vobj ? ` y cuánto tarda en llegar a ${esc(sc.Vobj)} V` : ''}.`;
    if (sc.modo === 'rl' && sc.proceso === 'conmuta') return `Una bobina de ${esc(sc.L)} mH en serie con ${esc(sc.R)} Ω se conecta a ${esc(sc.V)} V y en t₁ = ${esc(sc.t1)} s se abre el interruptor, de modo que se descarga por ${esc(sc.R2)} Ω. Calcula la corriente en t₁ y el pico de tensión de la bobina al abrir.`;
    if (sc.modo === 'rl') return `${sc.proceso === 'bajada' ? `Una bobina de ${esc(sc.L)} mH lleva la corriente que le da una fuente de ${esc(sc.V)} V con ${esc(sc.R)} Ω, y se quita la fuente` : `Se conecta una bobina de ${esc(sc.L)} mH en serie con ${esc(sc.R)} Ω a una fuente de ${esc(sc.V)} V`}. Calcula τ y la corriente final o inicial${sc.t ? `, y la corriente a los ${esc(sc.t)} s` : ''}${sc.Iobj ? `, y cuánto tarda en llegar a ${esc(sc.Iobj)} A` : ''}.`;
    if (sc.modo === 'rlcp') return `Una fuente de corriente de ${esc(sc.I)} A se conecta en t = 0 a ${sc.R ? `una resistencia de ${esc(sc.R)} Ω, ` : ''}una bobina de ${esc(sc.L)} mH y un condensador de ${esc(sc.C)} μF en paralelo. ¿Es sobreamortiguado, crítico o subamortiguado? Calcula α, ω₀ y la corriente de la bobina.`;
    if (sc.modo === 'primer') {
      const els = sc.elementos || [], nom = Continua.nombres(els), q = { antes: ' (solo antes de t = 0)', despues: ' (solo después de t = 0)' };
      return `En el circuito con ${els.map((e, i) => `${nom[i]} = ${esc(e.v)} ${UN[e.t]} entre ${esc(e.a)} y ${esc(e.b)}${q[e.cuando] || ''}`).join(', ')}, el interruptor actúa en t = 0. Calcula el valor inicial y el final, la constante de tiempo y la expresión frente al tiempo.`;
    }
    return `Un circuito RLC en serie con R = ${esc(sc.R)} Ω, L = ${esc(sc.L)} mH y C = ${esc(sc.C)} μF se conecta a ${esc(sc.V)} V. ¿Es sobreamortiguado, crítico o subamortiguado? Calcula α, ω₀ y la tensión del condensador.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  const TIPOS = { sub: 'subamortiguado', critico: 'amortiguamiento crítico', sobre: 'sobreamortiguado' };
  const segundoOrden = () => dato('Tipo', `<b>${TIPOS[sol.tipo]}</b>`) + dato('α', `${f(sol.a)} s<sup>−1</sup>`) + dato('ω<sub>0</sub>', `${f(sol.w0)} rad/s`) + (sol.wd !== null ? dato('ω<sub>d</sub>', `${f(sol.wd)} rad/s`) : '') + dato('Resistencia crítica', `${u(sol.Rc, 'Ω')}`);
  const hasta = (v, un) => (sol.tObj !== null ? dato(`Tiempo hasta ${f(v)} ${un}`, `t = <b>${u(sol.tObj, 's')}</b>`) : '');
  function calcula() {
    const err = $('#error');
    tFijo = null; fijo = false;
    try { sol = T.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; lectura(); guarda(); dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h = '';
    const enT = (n, v) => dato(`${n} en t = ${u(sol.t, 's')}`, v);
    if (sol.modo === 'primer') {
      const xu = sol.esC ? 'V' : 'A', xn = sol.esC ? `V<sub>${sol.nombre}</sub>` : `i<sub>${sol.nombre}</sub>`;
      h = dato('Valor inicial', `${xn}(0<sup>+</sup>) = <b>${f(sol.x0)} ${xu}</b>`) + dato('Valor final', `${xn}(∞) = <b>${f(sol.xf)} ${xu}</b>`) + dato(`Resistencia que ve ${sol.nombre}`, `R<sub>th</sub> = ${u(sol.Rth, 'Ω')}`) + dato('Constante de tiempo', `τ = <b>${u(sol.tau, 's')}</b>`) + dato(sol.esC ? 'Tensión del condensador' : 'Corriente de la bobina', `${xn}(t) = <b>${sol.xTxt} ${xu}</b>`, 'ancho');
      if (sol.t !== null) h += enT(xn, `<b>${f(sol.esC ? sol.Vct : sol.It)} ${xu}</b>`);
      h += hasta(sol.esC ? sol.Vo : sol.Io, xu);
    } else if (sol.modo === 'rc' && sol.conmuta) {
      h = dato('Constantes de tiempo', `τ<sub>1</sub> = RC = <b>${u(sol.tau, 's')}</b>, τ<sub>2</sub> = R<sub>2</sub>C = <b>${u(sol.tau2, 's')}</b>`) + dato('Tensión en t₁', `V<sub>C</sub>(t<sub>1</sub>) = <b>${f(sol.V1)} V</b>`) + dato('Tensión del condensador', `V<sub>C</sub>(t) = <b>${sol.VcTxt} V</b>`, 'ancho');
      if (sol.t !== null) h += enT('V<sub>C</sub>', `<b>${f(sol.Vct)} V</b>`) + enT('i', u(sol.It, 'A'));
      h += dato('Energía en t₁', u(sol.Ef, 'J'));
    } else if (sol.modo === 'rc') {
      h = dato('Constante de tiempo', `τ = RC = <b>${u(sol.tau, 's')}</b>`) + dato('Tensión del condensador', `V<sub>C</sub>(t) = <b>${sol.VcTxt} V</b>`, 'ancho') + dato('Corriente inicial', `i(0) = ${u(sol.I0, 'A')}`);
      if (sol.t !== null) h += enT('V<sub>C</sub>', `<b>${f(sol.Vct)} V</b>`) + enT('i', u(sol.It, 'A'));
      h += hasta(sol.Vo, 'V') + dato('Energía final', u(sol.Ef, 'J'));
    } else if (sol.modo === 'rl' && sol.conmuta) {
      h = dato('Constantes de tiempo', `τ<sub>1</sub> = L/R = <b>${u(sol.tau, 's')}</b>, τ<sub>2</sub> = L/R<sub>2</sub> = <b>${u(sol.tau2, 's')}</b>`) + dato('Corriente en t₁', `i(t<sub>1</sub>) = <b>${u(sol.I1, 'A')}</b>`) + dato('Tensión de la bobina al abrir', `V<sub>L</sub> = −i(t<sub>1</sub>)·R<sub>2</sub> = <b>${f(sol.pico)} V</b>`) + dato('Corriente', `i(t) = <b>${sol.ITxt} A</b>`, 'ancho');
      if (sol.t !== null) h += enT('i', `<b>${u(sol.It, 'A')}</b>`) + enT('V<sub>L</sub>', `${f(sol.VLt)} V`);
      h += dato('Energía en t₁', u(sol.E, 'J'));
    } else if (sol.modo === 'rl') {
      const R2 = !sol.sube && sol.R2 !== sol.R;
      h = dato('Constante de tiempo', `τ = L/R${R2 ? '<sub>2</sub>' : ''} = <b>${u(sol.tau, 's')}</b>`) + dato('Corriente', `i(t) = <b>${sol.ITxt} A</b>`, 'ancho') + dato(sol.sube ? 'Corriente final' : 'Corriente inicial', u(sol.sube ? sol.Inf : sol.I0, 'A'));
      if (!sol.sube) h += dato('Tensión de la bobina al quitar la fuente', `${f(sol.VL(0))} V`);
      if (sol.t !== null) h += enT('i', `<b>${u(sol.It, 'A')}</b>`) + enT('V<sub>L</sub>', `${f(sol.VLt)} V`);
      h += hasta(sol.Io, 'A') + dato('Energía en la bobina', u(sol.E, 'J'));
    } else if (sol.modo === 'rlcp') {
      h = segundoOrden() + dato('Corriente de la bobina', `i<sub>L</sub>(t) = <b>${sol.txt} A</b>`, 'ancho');
      if (sol.t !== null) h += enT('i<sub>L</sub>', `<b>${u(sol.ILt, 'A')}</b>`) + enT('v', `${f(sol.vt)} V`);
      h += hasta(sol.Io, 'A');
    } else {
      h = segundoOrden() + dato('Tensión del condensador', `V<sub>C</sub>(t) = <b>${sol.txt} V</b>`, 'ancho');
      if (sol.t !== null) h += enT('V<sub>C</sub>', `<b>${f(sol.Vct)} V</b>`) + enT('i', u(sol.It, 'A'));
      h += hasta(sol.Vo, 'V');
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    const marca = sol.t1 ? 'las discontinuas marcan τ y t₁' : 'la línea discontinua marca τ';
    $('#leyenda').innerHTML = (sol.modo === 'rlcp' ? `Arriba, el circuito: los puntos son la corriente de cada rama. Abajo, la tensión común v(t) en rojo y la corriente de la bobina i<sub>L</sub>(t) en azul.`
      : sol.modo === 'primer' ? `Arriba, el equivalente de Thévenin que ve ${sol.nombre} después de t = 0. Abajo, ${sol.esC ? `V<sub>${sol.nombre}</sub>(t) en rojo e i(t) en azul` : `i<sub>${sol.nombre}</sub>(t) en azul y v(t) en rojo`}; ${marca}.`
      : md() === 'rl' ? `Arriba, el circuito: los puntos son la corriente. Abajo, i(t) en azul y V<sub>L</sub>(t) en rojo; ${marca}.`
      : `Arriba, el circuito: los puntos son la corriente y las cargas del condensador, su tensión. Abajo, V<sub>C</sub>(t) en rojo e i(t) en azul${sol.modo === 'rc' ? `; ${marca}` : ''}.`) + ' Pasa el ratón (o el dedo) por la gráfica para leer los valores en cada instante; un clic lo deja fijo.';
    lectura();
    dibuja();
  }

  /* ---------- Dibujos ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--v', '--i']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => Herramienta.lienzo(s);
  const DUR = 6, PAUSA = 1.2;
  const tiempo = () => { if (tFijo !== null) return Math.min(tFijo, sol.T); const k = tA % (DUR + PAUSA); return Math.min(1, k / DUR) * sol.T; };
  // la fuente está conectada en el instante t
  const fuente = (t) => {
    if (sol.modo === 'primer') return sol.V !== 0;
    if (sol.conmuta) return t < sol.t1;
    return sol.modo === 'rc' ? sol.carga : sol.modo === 'rl' ? sol.sube : sol.V > 0;
  };
  // la tensión (rojo) y la corriente (azul) que se dibujan
  const curvas = () => (sol.modo === 'rlcp' ? [sol.v, sol.I, 'v (V)', 'iʟ (A)'] : md() === 'rl' ? [sol.VL, sol.I, 'Vʟ (V)', 'i (A)'] : [sol.Vc, sol.I, 'V꜀ (V)', 'i (A)']);
  const marcas = (a, b, n = 5) => Herramienta.marcas(a, b, n);
  const maxAbs = (fn) => Math.max(1e-30, ...Array.from({ length: 81 }, (_, k) => Math.abs(fn((k / 80) * sol.T))));
  function dibuja() { circuito(); grafica(); }
  const avance = {};
  // puntos que recorren un camino (lista de puntos) con velocidad proporcional a la corriente
  function puntos(g, clave, camino, i, imax) {
    const lon = camino.slice(1).reduce((s, p, k) => s + Math.hypot(p[0] - camino[k][0], p[1] - camino[k][1]), 0);
    avance[clave] = (avance[clave] || 0) + (anda && tFijo === null ? 1 : 0) * (i / imax) * 2.2;
    const pos = (s) => { s = ((s % lon) + lon) % lon; for (let k = 1; k < camino.length; k++) { const [a, b] = [camino[k - 1], camino[k]], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s <= d) return [a[0] + ((b[0] - a[0]) * s) / d, a[1] + ((b[1] - a[1]) * s) / d]; s -= d; } return camino[0]; };
    g.fillStyle = col['--accent']; g.globalAlpha = Math.min(1, 0.25 + Math.abs(i) / imax);
    for (let k = 0; k < lon - 4; k += 28) { const p = pos(k + avance[clave]); g.beginPath(); g.arc(p[0], p[1], 3.2, 0, 2 * Math.PI); g.fill(); }
    g.globalAlpha = 1;
  }
  const letra = (g, c, al = 'center', base = 'middle') => { g.fillStyle = c; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = al; g.textBaseline = base; };
  // esquema: fuente (o un cable si no hay) a la izquierda, interruptor y R arriba, C y/o L a la derecha
  function circuito() {
    const { g, w, h } = lienzo('#circuito');
    if (!sol) return;
    if (!col['--ink']) colores();
    if (sol.modo === 'rlcp') return paralelo(g, w, h);
    const t = tiempo(), m = md(), x1 = Math.max(50, w * 0.2), x2 = Math.min(w - 78, w * 0.8), y1 = 34, y2 = h - 30, ink = col['--ink'];
    g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round';
    const linea = (a, b, c, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
    const xm = (x1 + x2) / 2, ym = (y1 + y2) / 2, conFuente = fuente(t);
    // lado izquierdo: fuente
    if (conFuente) { linea(x1, y1, x1, ym - 8); linea(x1, ym + 8, x1, y2); g.lineWidth = 3; linea(x1 - 16, ym - 8, x1 + 16, ym - 8); g.lineWidth = 5; linea(x1 - 8, ym + 8, x1 + 8, ym + 8); g.lineWidth = 2; letra(g, col['--muted'], 'right'); g.fillText(`${sol.modo === 'primer' ? 'Vₜₕ = ' : ''}${f(sol.V, 3)} V`, x1 - 22, ym); }
    else linea(x1, y1, x1, y2);
    // arriba: interruptor (cerrado) y resistencia
    const xs = x1 + (xm - x1) * 0.35; linea(x1, y1, xs - 10, y1); g.fillStyle = ink; g.beginPath(); g.arc(xs - 10, y1, 3, 0, 2 * Math.PI); g.fill(); linea(xs - 10, y1, xs + 12, y1); g.beginPath(); g.arc(xs + 12, y1, 3, 0, 2 * Math.PI); g.fill();
    const r1 = xm - 24, r2 = xm + 24; linea(xs + 12, y1, r1, y1); g.beginPath(); g.moveTo(r1, y1); for (let k = 1; k <= 6; k++) g.lineTo(r1 + (k * (r2 - r1)) / 6 - (r2 - r1) / 12, y1 + (k % 2 ? -7 : 7)); g.lineTo(r2, y1); g.stroke(); linea(r2, y1, x2, y1);
    const conR2 = sol.R2 !== undefined && sol.R2 !== sol.R && !conFuente;
    letra(g, col['--muted'], 'center', 'bottom'); g.fillText(`${sol.modo === 'primer' ? 'Rₜₕ' : conR2 ? 'R₂' : 'R'} = ${txt(u(conR2 ? sol.R2 : sol.R, 'Ω', 3))}`, xm, y1 - 10);
    // derecha: C, L o los dos
    const hayL = m !== 'rc', hayC = m !== 'rl', nom = sol.modo === 'primer' ? sol.nombre : null;
    const bobina = (ya, yb) => { linea(x2, y1, x2, ya); g.beginPath(); const n = 4, hh = (yb - ya) / n; for (let k = 0; k < n; k++) g.arc(x2, ya + hh * (k + 0.5), hh / 2, -Math.PI / 2, Math.PI / 2); g.stroke(); letra(g, col['--muted'], 'left'); g.fillText(`${nom || 'L'} = ${txt(u(sol.L, 'H', 3))}`, x2 + 16, (ya + yb) / 2); };
    let Vc = 0, I = 0, Imax = 1;
    if (m === 'rc') { Vc = sol.Vc(t); I = sol.I(t); Imax = maxAbs(sol.I); }
    else if (m === 'rl') { I = sol.I(t); Imax = maxAbs(sol.I); }
    else { Vc = sol.Vc(t); I = sol.I(t); Imax = maxAbs(sol.I); }
    const cond = (yc) => {
      g.lineWidth = 3; linea(x2 - 22, yc - 6, x2 + 22, yc - 6); linea(x2 - 22, yc + 6, x2 + 22, yc + 6); g.lineWidth = 2;
      const Vm = Math.max(Math.abs(sol.V), Math.abs(sol.V0 || 0), Math.abs(sol.V1 || 0), 1e-30), n = Math.round((6 * Math.abs(Vc)) / Vm), arriba = Vc >= 0;
      g.font = '600 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let k = 0; k < n; k++) { const xx = x2 + (k - (n - 1) / 2) * 7.5; g.fillStyle = col['--v']; g.fillText(arriba ? '+' : '−', xx, yc - 14); g.fillStyle = col['--i']; g.fillText(arriba ? '−' : '+', xx, yc + 14); }
      letra(g, col['--muted'], 'left'); g.fillText(`${nom || 'C'} = ${txt(u(sol.C, 'F', 3))}`, x2 + 30, yc); g.fillStyle = col['--v']; g.fillText(`V꜀ = ${txt(f(Vc, 3))} V`, x2 + 30, yc + 16);
    };
    if (hayC && hayL) { bobina(y1 + 14, ym - 6); linea(x2, ym - 6, x2, ym + 18); cond(ym + 24); linea(x2, ym + 30, x2, y2); }
    else if (hayC) { linea(x2, y1, x2, ym - 6); cond(ym); linea(x2, ym + 6, x2, y2); }
    else { bobina(ym - 40, ym + 40); linea(x2, ym + 40, x2, y2); }
    linea(x1, y2, x2, y2);
    // la corriente: puntos que recorren el circuito con velocidad proporcional a i
    puntos(g, 'serie', [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]], I, Imax);
    letra(g, col['--i'], 'center', 'top'); g.fillText(`i = ${txt(u(I, 'A', 3))}  ·  t = ${txt(u(t, 's', 3))}`, xm, y2 + 8);
  }
  // RLC en paralelo: la fuente de corriente y las ramas R, L y C entre dos barras
  function paralelo(g, w, h) {
    const t = tiempo(), v = sol.v(t), iL = sol.I(t), iR = sol.R === null ? 0 : v / sol.R, iC = sol.Ig - iR - iL;
    const ramas = [['I', sol.Ig], ...(sol.R === null ? [] : [['R', iR]]), ['L', iL], ['C', iC]];
    const xa = Math.max(46, w * 0.14), xb = Math.min(w - 70, w * 0.8), y1 = 26, y2 = h - 34, ym = (y1 + y2) / 2, paso = (xb - xa) / (ramas.length - 1);
    const linea = (a, b, c, d) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); };
    g.strokeStyle = col['--ink']; g.lineWidth = 2; g.lineCap = 'round';
    linea(xa, y1, xb, y1); linea(xa, y2, xb, y2);
    const imax = Math.max(Math.abs(sol.Ig), maxAbs(sol.I), sol.R === null ? 0 : maxAbs(sol.v) / sol.R, 1e-30);
    ramas.forEach(([tipo, i], k) => {
      const x = xa + k * paso;
      g.strokeStyle = col['--ink'];
      if (tipo === 'I') { linea(x, y1, x, ym - 16); linea(x, ym + 16, x, y2); g.beginPath(); g.arc(x, ym, 16, 0, 2 * Math.PI); g.stroke(); linea(x, ym + 9, x, ym - 9); linea(x - 5, ym - 3, x, ym - 9); linea(x + 5, ym - 3, x, ym - 9); letra(g, col['--muted'], 'right'); g.fillText(`${f(sol.Ig, 3)} A`, x - 22, ym); }
      if (tipo === 'R') { linea(x, y1, x, ym - 24); g.beginPath(); g.moveTo(x, ym - 24); for (let j = 1; j <= 6; j++) g.lineTo(x + (j % 2 ? -7 : 7), ym - 24 + j * 8 - 4); g.lineTo(x, ym + 24); g.stroke(); linea(x, ym + 24, x, y2); letra(g, col['--muted'], 'left'); g.fillText(`R = ${txt(u(sol.R, 'Ω', 3))}`, x + 12, ym); }
      if (tipo === 'L') { linea(x, y1, x, ym - 26); g.beginPath(); for (let j = 0; j < 4; j++) g.arc(x, ym - 26 + 13 * (j + 0.5), 6.5, -Math.PI / 2, Math.PI / 2); g.stroke(); linea(x, ym + 26, x, y2); letra(g, col['--muted'], 'left'); g.fillText(`L = ${txt(u(sol.L, 'H', 3))}`, x + 12, ym); }
      if (tipo === 'C') { linea(x, y1, x, ym - 6); linea(x, ym + 6, x, y2); g.lineWidth = 3; linea(x - 16, ym - 6, x + 16, ym - 6); linea(x - 16, ym + 6, x + 16, ym + 6); g.lineWidth = 2; letra(g, col['--muted'], 'left'); g.fillText(`C = ${txt(u(sol.C, 'F', 3))}`, x + 20, ym); }
      // por la fuente la corriente sube; por las ramas, baja
      puntos(g, 'p' + tipo, tipo === 'I' ? [[x, y2], [x, y1]] : [[x, y1], [x, y2]], i, imax);
    });
    letra(g, col['--v'], 'center', 'top'); g.fillText(`v = ${txt(f(v, 3))} V`, (xa + xb) / 2 - 70, y2 + 8);
    g.fillStyle = col['--i']; g.fillText(`iʟ = ${txt(u(iL, 'A', 3))}  ·  t = ${txt(u(t, 's', 3))}`, (xa + xb) / 2 + 50, y2 + 8);
  }
  // V (rojo, eje izquierdo) e i (azul, eje derecho) frente a t
  function grafica() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    const mL = 48, mR = 54, mT = 14, mB = 28, N = 400, t1 = sol.T;
    const [fV, fI, nV, nI] = curvas();
    const ts = Array.from({ length: N + 1 }, (_, k) => (k / N) * t1), vs = ts.map(fV), is = ts.map(fI);
    // los dos ejes con el cero a la misma altura: se escala cada curva por su máximo
    const ext = (xs) => { const b = Math.max(0, ...xs), a = -Math.min(0, ...xs), m = Math.max(a, b) || 1; return [a / m, b / m, m]; };
    const [vn, vp, vm] = ext(vs), [in_, ip, im] = ext(is), bajo = Math.max(vn, in_), alto = Math.max(vp, ip), pd = (alto + bajo) * 0.08;
    const v1 = -(bajo + pd) * vm, v2 = (alto + pd) * vm, i1 = -(bajo + pd) * im, i2 = (alto + pd) * im;
    const X = (t) => mL + (t / t1) * (w - mL - mR), YV = (v) => mT + ((v2 - v) / (v2 - v1)) * (h - mT - mB), YI = (i) => mT + ((i2 - i) / (i2 - i1)) * (h - mT - mB);
    ejeX = { a: mL, b: w - mR };
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1;
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of marcas(0, t1, Math.max(4, Math.round(w / 90)))) { g.beginPath(); g.moveTo(X(t), mT); g.lineTo(X(t), h - mB); g.stroke(); g.fillText(txt(u(t, 's', 3)), X(t), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = col['--v'];
    for (const v of marcas(v1, v2, 5)) { g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(mL, YV(v)); g.lineTo(w - mR, YV(v)); g.stroke(); g.fillText(txt(f(v, 3)), mL - 5, YV(v)); }
    g.textAlign = 'left'; g.fillStyle = col['--i']; for (const i of marcas(i1, i2, 5)) g.fillText(txt(u(i, 'A', 3)), w - mR + 5, YI(i));
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mL, YV(0)); g.lineTo(w - mR, YV(0)); g.stroke();
    const vertical = (x, et) => { g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(x), mT); g.lineTo(X(x), h - mB); g.stroke(); g.setLineDash([]); g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(et, X(x) + 4, mT + 2); };
    if (sol.tau && sol.tau < t1) vertical(sol.tau, 'τ');
    if (sol.t1) vertical(sol.t1, 't₁');
    if (sol.tObj !== null && sol.tObj !== undefined && sol.tObj <= t1) { g.fillStyle = col['--accent']; g.beginPath(); const y = md() === 'rl' || sol.modo === 'rlcp' ? YI(sol.Io) : YV(sol.Vo); g.arc(X(sol.tObj), y, 5, 0, 2 * Math.PI); g.fill(); }
    const curva = (ys, Y, c) => { g.strokeStyle = c; g.lineWidth = 2.4; g.beginPath(); ys.forEach((y, k) => (k ? g.lineTo(X(ts[k]), Y(y)) : g.moveTo(X(ts[k]), Y(y)))); g.stroke(); };
    curva(vs, YV, col['--v']); curva(is, YI, col['--i']);
    const t = tiempo(); g.strokeStyle = col['--ink']; g.globalAlpha = tFijo === null ? 0.5 : 0.9; g.beginPath(); g.moveTo(X(t), mT); g.lineTo(X(t), h - mB); g.stroke(); g.globalAlpha = 1;
    g.fillStyle = col['--v']; g.beginPath(); g.arc(X(t), YV(fV(t)), 4.5, 0, 2 * Math.PI); g.fill(); g.fillStyle = col['--i']; g.beginPath(); g.arc(X(t), YI(fI(t)), 4.5, 0, 2 * Math.PI); g.fill();
    g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'top'; g.textAlign = 'left'; g.fillStyle = col['--v']; g.fillText(nV, mL + 6, mT + 2); g.textAlign = 'right'; g.fillStyle = col['--i']; g.fillText(nI, w - mR - 6, mT + 2);
  }
  // valores en el instante del cursor (cuando se lleva con el ratón o se deja fijo)
  function lectura() {
    const el = $('#lectura');
    if (!sol || tFijo === null) { el.textContent = ''; return; }
    const t = tiempo(), [fV, fI, nV, nI] = curvas();
    el.innerHTML = `t = <b>${u(t, 's')}</b>: ${nV.split(' ')[0]} = <b>${f(fV(t))} V</b>, ${nI.split(' ')[0]} = <b>${u(fI(t), 'A')}</b>${fijo ? ' (fijo)' : ''}`;
  }
  const lienzoG = $('#grafica');
  const instante = (e) => { const r = lienzoG.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientX - r.left - ejeX.a) / (ejeX.b - ejeX.a))) * sol.T; };
  const apunta = (t) => { tFijo = t; lectura(); dibuja(); };
  lienzoG.addEventListener('pointermove', (e) => { if (sol && ejeX && !fijo) apunta(instante(e)); });
  lienzoG.addEventListener('pointerleave', () => { if (!fijo) apunta(null); });
  lienzoG.addEventListener('click', (e) => { if (!sol || !ejeX) return; fijo = !fijo; apunta(fijo ? instante(e) : null); });

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { if (tFijo === null) tA += dt; dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('transitorios').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.TransitoriosApp = { abrirEjemplo, azar, enunciado, anade, cursor: (t) => { fijo = t !== null; apunta(t); }, resultado: () => sol && { modo: sol.modo, tau: sol.tau, tipo: sol.tipo, Vct: sol.Vct, It: sol.It, tObj: sol.tObj, x0: sol.x0, xf: sol.xf, Rth: sol.Rth, V1: sol.V1, I1: sol.I1, pico: sol.pico }, estado: () => copia(sc) };
})();
