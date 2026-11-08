/* =====================================================================
   Disoluciones y concentraciones: interfaz (cuatro pestañas:
   concentración, preparar, diluir y mezclar, y propiedades coligativas).
   El cálculo está en
   quimica/disoluciones.js (Disoluciones), con las masas molares de
   quimica/formulas.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const D = Disoluciones, f = D.f;
  const CLAVE = 'disoluciones-v1';
  const ORDEN = ['M', 'm', 'mm', 'x', 'gL', 'mv', 'ppm', 'N'];
  const NOMBRES = { M: 'Molaridad', m: 'Molalidad', mm: '% en masa', x: 'Fracción molar del soluto', gL: 'Concentración en masa', mv: '% masa/volumen', ppm: 'Partes por millón', N: 'Normalidad' };
  const TABS = ['conc', 'prep', 'dil', 'col', 'sol'];

  let st = {
    tab: 'conc', modo: 'iupac',
    conc: { ...D.ejemplos[0].sc }, prep: { ...D.ejemplosPreparar[0].sc },
    dil: { C1: '12', V1: '', C2: '0.5', V2: '250' }, mez: { C1: '1', V1: '100', C2: '0.25', V2: '300', Va: '' },
    col: { ...D.ejemplosColig[0].sc }, sol: { ...SolT.ejemplos[0].sc },
  };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.conc && g.prep && g.dil && g.mez) st = { ...st, ...g }; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) {} };
  const coma = (v) => String(v ?? '').replace('.', ',');
  const err = (id, e) => { const n = $(id); n.hidden = !e; if (e) n.textContent = e.message; };

  /* ---------- Pestañas ---------- */
  function pestana(t) {
    st.tab = t; guarda();
    if (!TABS.includes(t)) t = st.tab = 'conc';
    for (const s of TABS) { $('#tab-' + s).setAttribute('aria-selected', t === s); $('#' + s).hidden = t !== s; }
  }
  for (const t of TABS) $('#tab-' + t).addEventListener('click', () => pestana(t));
  $('#modo').value = st.modo;
  $('#modo').addEventListener('change', () => { st.modo = $('#modo').value; guarda(); conc(); prep(); col(); });

  // enlaza los campos con prefijo pre- a st[obj]
  function enlaza(pre, obj, alCambiar) {
    document.querySelectorAll(`[id^="${pre}-"]`).forEach((el) => {
      const k = el.id.slice(pre.length + 1);
      el.addEventListener('input', () => { st[obj][k] = el.value; guarda(); alCambiar(k); });
    });
  }
  const rellena = (pre, obj) => document.querySelectorAll(`[id^="${pre}-"]`).forEach((el) => { const k = el.id.slice(pre.length + 1); el.value = el.tagName === 'SELECT' ? st[obj][k] || el.options[0].value : coma(st[obj][k]); });

  /* ---------- Concentración ---------- */
  $('#c-tipo').innerHTML = ORDEN.map((k) => `<option value="${k}">${NOMBRES[k]}${D.TIPOS[k].u ? ` (${D.TIPOS[k].u})` : ''}</option>`).join('');
  const selC = $('#ejemplos');
  selC.innerHTML = '<option value="">Ejemplos…</option>' + D.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  selC.addEventListener('change', () => { if (selC.value) abrirEjemplo(selC.value); });
  function abrirEjemplo(clave) { const e = D.ejemplos.find((x) => x.clave === clave); if (!e) return; st.conc = { ...e.sc }; rellena('c', 'conc'); selC.value = clave; pestana('conc'); conc(); guarda(); }
  enlaza('c', 'conc', () => { selC.value = ''; conc(); });

  function conc() {
    const u = D.TIPOS[st.conc.tipo] ? D.TIPOS[st.conc.tipo].u : '';
    $('#c-unidad').textContent = u ? `(${u})` : '';
    let r;
    try { r = D.concentracion({ ...st.conc, modo: st.modo }); } catch (e) { err('#error-conc', e); $('#valores').innerHTML = ''; $('#comp').innerHTML = ''; $('#pasos-conc').innerHTML = ''; return; }
    err('#error-conc', null);
    const v = r.valores;
    const tarjetas = ORDEN.map((k) => {
      const dato = k === r.tipo, falta = !(k in v);
      return `<div class="valor${dato ? ' dato' : ''}${falta ? ' falta' : ''}"><span>${NOMBRES[k]}${dato ? ' · dato' : ''}</span><b>${falta ? 'falta la densidad' : `${f(v[k])}${D.TIPOS[k].u ? ' ' + D.TIPOS[k].u : ''}`}</b></div>`;
    });
    if (v.xd !== undefined) tarjetas.splice(4, 0, `<div class="valor"><span>Fracción molar del disolvente</span><b>${f(v.xd)}</b></div>`);
    $('#valores').innerHTML = tarjetas.join('');
    // composición en masa y en moles
    const barra = (a, b, ta, tb) => `<div class="barra-comp"><span style="width:${Math.max(0.5, (100 * a) / (a + b))}%;background:var(--c-n)">${ta}</span><span style="flex:1;background:var(--c-p)">${tb}</span></div>`;
    let comp = '';
    if (r.md !== null) {
      comp += `<div>En masa (${r.base}): soluto ${f(r.ms)} g · disolvente ${f(r.md)} g</div>` + barra(r.ms, r.md, `${r.S.html}`, `${r.D.html}`);
      comp += `<div>En moles: soluto ${f(r.ns)} mol · disolvente ${f(r.nd)} mol</div>` + barra(r.ns, r.nd, `${r.S.html}`, `${r.D.html}`);
    }
    $('#comp').innerHTML = comp;
    $('#pasos-conc').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  /* ---------- Preparar ---------- */
  const selP = $('#ejemplos-prep');
  selP.innerHTML = '<option value="">Ejemplos…</option>' + D.ejemplosPreparar.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  selP.addEventListener('change', () => { if (selP.value) abrirEjemploP(selP.value); });
  function abrirEjemploP(clave) { const e = D.ejemplosPreparar.find((x) => x.clave === clave); if (!e) return; st.prep = { ...e.sc }; rellena('p', 'prep'); selP.value = clave; pestana('prep'); prep(); guarda(); }
  enlaza('p', 'prep', () => { selP.value = ''; prep(); });

  function prep() {
    const o = st.prep.origen === 'comercial' ? 'comercial' : 'solido', obj = D.OBJ[st.prep.obj] ? st.prep.obj : 'M', O = D.OBJ[obj];
    document.querySelectorAll('#prep [data-o]').forEach((n) => { n.hidden = n.dataset.o !== o; });
    document.querySelectorAll('#prep [data-obj]').forEach((n) => { n.hidden = n.dataset.obj !== obj; });
    $('#et-pM').innerHTML = `${O.nom[0].toUpperCase() + O.nom.slice(1)} <small>(${O.u})</small>`;
    $('#et-pV').innerHTML = O.q === 'V' ? 'Volumen <small>(mL)</small>' : O.q === 'masa' ? 'Masa de disolución <small>(g)</small>' : 'Masa de agua <small>(g)</small>';
    let r;
    try { r = D.preparar({ ...st.prep, modo: st.modo }); } catch (e) { err('#error-prep', e); $('#valores-prep').innerHTML = ''; $('#instr').hidden = true; $('#pasos-prep').innerHTML = ''; return; }
    err('#error-prep', null);
    const t = [['Moles de soluto', `${f(r.n)} mol`], ['Soluto puro', `${f(r.mPuro)} g`]];
    if (r.mPesar !== undefined) t.push(['Hay que pesar', `${f(r.mPesar)} g`]);
    if (r.Vcomercial !== undefined) t.push(['Reactivo comercial', `${f(r.mComercial)} g`], ['Hay que medir', `${f(r.Vcomercial)} mL`], ['Molaridad del comercial', `${f(r.Mcomercial)} mol/L`]);
    if (r.agua !== undefined) t.push(['Agua que se añade', `${f(r.agua)} g`]);
    const clave = r.Vcomercial !== undefined ? 'Hay que medir' : 'Hay que pesar';
    $('#valores-prep').innerHTML = t.map(([a, b]) => `<div class="valor${a === clave ? ' dato' : ''}"><span>${a}</span><b>${b}</b></div>`).join('');
    $('#instr').hidden = false; $('#instr').textContent = r.instrucciones;
    $('#pasos-prep').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  /* ---------- Diluir y mezclar ---------- */
  enlaza('d', 'dil', () => dil());
  enlaza('m', 'mez', () => mez());
  const NOM = { C1: 'C<sub>1</sub>', V1: 'V<sub>1</sub>', C2: 'C<sub>2</sub>', V2: 'V<sub>2</sub>' };
  function dil() {
    let r;
    try { r = D.diluir(st.dil); } catch (e) { err('#error-dil', e); $('#res-dil').innerHTML = ''; $('#pasos-dil').innerHTML = ''; return; }
    err('#error-dil', null);
    $('#res-dil').innerHTML = `${NOM[r.calculado]} = ${f(r[r.calculado])} ${r.unidad}`;
    $('#pasos-dil').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }
  function mez() {
    let r;
    try { r = D.mezclar(st.mez); } catch (e) { err('#error-mez', e); $('#res-mez').innerHTML = ''; $('#pasos-mez').innerHTML = ''; return; }
    err('#error-mez', null);
    $('#res-mez').innerHTML = `C = ${f(r.C)} en ${f(r.Vt)} de volumen total`;
    $('#pasos-mez').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  /* ---------- Propiedades coligativas ---------- */
  const selG = $('#ejemplos-col');
  selG.innerHTML = '<option value="">Ejemplos…</option>' + D.ejemplosColig.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  selG.addEventListener('change', () => { if (selG.value) abrirEjemploG(selG.value); });
  function abrirEjemploG(clave) { const e = D.ejemplosColig.find((x) => x.clave === clave); if (!e) return; st.col = { ...e.sc }; rellena('g', 'col'); selG.value = clave; pestana('col'); col(); guarda(); }
  enlaza('g', 'col', () => { selG.value = ''; col(); });
  function col() {
    const b = st.col.busca === 'M' ? 'M' : 'prop';
    document.querySelectorAll('#col [data-b]').forEach((n) => { n.hidden = n.dataset.b !== b; });
    let r;
    try { r = D.coligativas({ ...st.col, modo: st.modo }); } catch (e) { err('#error-col', e); $('#valores-col').innerHTML = ''; $('#pasos-col').innerHTML = ''; return; }
    err('#error-col', null);
    const t = r.busca === 'M' ? [['Masa molar del soluto', `${f(r.M)} g/mol`, true], ["Factor de van 't Hoff", `i = ${f(r.i)}`]] : [['Molalidad', `${f(r.molal)} mol/kg`], ['Congela a', `${f(r.Tc)} °C`, true], ['Descenso crioscópico', `${f(r.dTc)} K`], ['Hierve a', `${f(r.Te)} °C`, true], ['Aumento ebulloscópico', `${f(r.dTe)} K`], ['Presión osmótica', `${f(r.pi)} atm`], ...(r.P !== null ? [['Presión de vapor', `${f(r.P)} mmHg`]] : []), ["Factor de van 't Hoff", `i = ${f(r.i)}`]];
    $('#valores-col').innerHTML = t.map(([a, v, d]) => `<div class="valor${d ? ' dato' : ''}"><span>${a}</span><b>${v}</b></div>`).join('');
    $('#pasos-col').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  /* ---------- Solubilidad frente a la temperatura y gases (DI-1) ---------- */
  const ST = SolT, Dt = Datos;
  const selS = $('#ejemplos-sol'), EJS = [...ST.ejemplos, ...ST.ejemplosGas];
  selS.innerHTML = '<option value="">Ejemplos…</option>' + EJS.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  $('#s-sal').innerHTML = Object.entries(Dt.SOLUBILIDAD_T).map(([k, v]) => `<option value="${k}">${v.nombre} (${v.f})</option>`).join('');
  $('#s-gas').innerHTML = Object.entries(Dt.HENRY).map(([k, v]) => `<option value="${k}">${v.nombre} (${v.f})</option>`).join('');
  selS.addEventListener('change', () => { if (selS.value) abrirEjemploS(selS.value); });
  function abrirEjemploS(clave) { const e = EJS.find((x) => x.clave === clave); if (!e) return; st.sol = { ...e.sc }; rellena('s', 'sol'); selS.value = clave; pestana('sol'); sol(); guarda(); }
  document.querySelectorAll('[id^="s-"]').forEach((el) => {
    const k = el.id.slice(2);
    el.addEventListener('input', () => { st.sol[k] = el.value; guarda(); selS.value = ''; sol(); });
  });
  const NOTAS_SOL = { sal: 'Solubilidad en g de soluto anhidro por 100 g de agua, interpolada entre los datos cada 20 °C (0 a 100 °C).', cristal: 'Si dejas la masa de soluto vacía se parte de la disolución saturada a la temperatura inicial.', busca: 'Da la temperatura a la que esa cantidad de sal justo satura 100 g de agua. Si la solubilidad sube y baja (Na₂SO₄) puede haber dos.', gas: 'Pon la presión parcial o, al revés, la concentración que quieres y sale la presión. La ley es fiable en gases que no reaccionan con el agua.' };
  let solS = null;
  const colS = {};
  function sol() {
    const m = ['sal', 'cristal', 'busca', 'gas'].includes(st.sol.modo) ? st.sol.modo : 'sal';
    document.querySelectorAll('#sol [data-m]').forEach((n) => { n.hidden = !n.dataset.m.split(' ').includes(m); });
    $('#nota-sol').textContent = NOTAS_SOL[m];
    let r;
    try { r = m === 'gas' ? ST.gas(st.sol) : ST.sal(st.sol); } catch (e) { err('#error-sol', e); solS = null; $('#valores-sol').innerHTML = ''; $('#pasos-sol').innerHTML = ''; $('#leyenda-sol').textContent = ''; dibujaS(); return; }
    err('#error-sol', null); solS = r;
    const fv = ST.f, mm = (x) => fv(x).replace(/\^\{(.*?)\}/, '<sup>$1</sup>');
    let t;
    if (m === 'gas') t = [['k_H a esa temperatura', `${mm(r.k)} mol/(L·atm)`], ['Presión parcial', `${mm(r.p)} atm`], ['Concentración', `${mm(r.c)} mol/L`, true], ['En masa', `${mm(r.mgL)} mg/L (${mm(r.mgL / 1000)} g/L)`, true]];
    else if (m === 'busca') t = [[r.T.length > 1 ? 'Satura a' : 'Satura a', r.T.length ? r.T.map((x) => `${mm(x)} °C`).join(' y ') : 'a ninguna temperatura (0–100 °C)', true]];
    else if (m === 'sal') t = [['Solubilidad', `${mm(r.S)} g/100 g de agua`, true], ['% en masa de la saturada', `${mm(r.w)} %`], ['Molalidad de la saturada', `${mm(r.m)} mol/kg`], [`Máximo en ${mm(r.agua)} g de agua`, `${mm(r.max)} g`]].concat(r.estado ? [['Tu mezcla', r.estado, true]] : []);
    else t = [[`Solubilidad a ${mm(r.T)} °C`, `${mm(r.S)} g/100 g`], [`Solubilidad a ${mm(r.T2)} °C`, `${mm(r.S2)} g/100 g`], [r.cristaliza > 0 || r.admiteMas === 0 ? 'Cristaliza' : 'Admite más', r.cristaliza > 0 ? `${mm(r.cristaliza)} g` : `${mm(r.admiteMas)} g`, true]];
    $('#valores-sol').innerHTML = t.map(([a, v, d]) => `<div class="valor${d ? ' dato' : ''}"><span>${a}</span><b>${v}</b></div>`).join('');
    $('#pasos-sol').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#titulo-graf-sol').textContent = m === 'gas' ? 'Gas disuelto frente a la temperatura' : 'Curva de solubilidad';
    $('#leyenda-sol').textContent = (m === 'gas' ? `Concentración de ${r.gas.nombre.toLowerCase()} a ${fv(r.p).replace(/\^\{(.*?)\}/, '·10^$1')} atm: baja al calentar. ` : `${r.sal.nombre}: la línea es la interpolación y los puntos, los datos. `) + `Fuente: ${r.fuente}.`;
    dibujaS();
    Herramienta.exportar('#graf-sol', { nombre: 'disoluciones-' + (m === 'gas' ? 'henry' : 'solubilidad'), titulo: m === 'gas' ? 'Gas disuelto frente a la temperatura' : 'Solubilidad frente a la temperatura', etiqueta: 'la gráfica de solubilidad', datos: () => (solS ? (solS.modo === 'gas' ? { cab: ['T (°C)', 'c (mol/L)'], filas: solS.curva.map((p) => [String(p.T), String(+p.c.toPrecision(5)).replace('.', ',')]) } : { cab: ['T (°C)', 'S (g/100 g de agua)'], filas: solS.curva.map((p) => [String(p.T), String(+p.S.toPrecision(5)).replace('.', ',')]) }) : null) });
  }
  function dibujaS() {
    const c = $('#graf-sol'); if (!c) return;
    const L = Herramienta.lienzo(c); if (!L || !L.w || !L.h) return;
    const { g, w, h } = L, cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent']) colS[k] = cs.getPropertyValue(k).trim();
    if (!solS) return;
    const gas = solS.modo === 'gas', ys = solS.curva.map((p) => (gas ? p.c : p.S)), ml = 62, mr = 14, mt = 12, mb = 34, y1 = Math.max(...ys) * 1.08 || 1, x2 = gas ? 60 : 100;
    const X = (T) => ml + (T / x2) * (w - ml - mr), Y = (v) => h - mb - (v / y1) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = colS['--line']; g.fillStyle = colS['--muted']; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of Herramienta.marcas(0, y1, 4)) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(Herramienta.txt(ST.f(v, 3)), ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let T = 0; T <= x2; T += x2 / 5) g.fillText(String(T), X(T), h - mb + 6);
    g.fillText(gas ? 'temperatura (°C)' : 'temperatura (°C)', ml + (w - ml - mr) / 2, h - 16);
    g.save(); g.translate(14, mt + (h - mt - mb) / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText(gas ? 'c (mol/L)' : 'g por 100 g de agua', 0, 0); g.restore();
    g.strokeStyle = colS['--accent']; g.lineWidth = 2.6; g.beginPath(); solS.curva.forEach((p, i) => (i ? g.lineTo(X(p.T), Y(gas ? p.c : p.S)) : g.moveTo(X(p.T), Y(gas ? p.c : p.S)))); g.stroke();
    g.fillStyle = colS['--ink'];
    if (!gas) for (let i = 0; i < Dt.T_SOL.length; i++) { g.beginPath(); g.arc(X(Dt.T_SOL[i]), Y(solS.sal.v[i]), 4, 0, 7); g.fill(); }
    const marca = (T, v) => { g.fillStyle = colS['--accent']; g.beginPath(); g.arc(X(T), Y(v), 6, 0, 7); g.fill(); };
    if (gas) marca(solS.T, solS.c);
    else if (solS.modo === 'sal') marca(solS.T, solS.S);
    else if (solS.modo === 'cristal') { marca(solS.T, solS.S); marca(solS.T2, solS.S2); }
    else if (solS.modo === 'busca') for (const T of solS.T) marca(T, solS.x);
  }
  window.addEventListener('resize', dibujaS);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibujaS);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('disoluciones').current;
  rellena('c', 'conc'); rellena('p', 'prep'); rellena('d', 'dil'); rellena('m', 'mez'); rellena('g', 'col'); rellena('s', 'sol');
  conc(); prep(); dil(); mez(); col(); sol(); pestana(st.tab);
  window.DisolApp = { abrirEjemplo, abrirEjemploP, abrirEjemploG, abrirEjemploS, resultadoSol: () => solS, pestana, estado: () => JSON.parse(JSON.stringify(st)) };
})();
