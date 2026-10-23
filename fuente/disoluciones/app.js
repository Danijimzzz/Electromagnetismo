/* =====================================================================
   Disoluciones y concentraciones: interfaz. El cálculo está en
   quimica/disoluciones.js (Disoluciones), con las masas molares de
   quimica/formulas.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const D = Disoluciones, f = D.f;
  const CLAVE = 'disoluciones-v1';
  const ORDEN = ['M', 'm', 'mm', 'x', 'gL', 'mv', 'ppm'];
  const NOMBRES = { M: 'Molaridad', m: 'Molalidad', mm: '% en masa', x: 'Fracción molar del soluto', gL: 'Concentración en masa', mv: '% masa/volumen', ppm: 'Partes por millón' };

  let st = {
    tab: 'conc', modo: 'iupac',
    conc: { ...D.ejemplos[0].sc }, prep: { ...D.ejemplosPreparar[0].sc },
    dil: { C1: '12', V1: '', C2: '0.5', V2: '250' }, mez: { C1: '1', V1: '100', C2: '0.25', V2: '300', Va: '' },
  };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.conc && g.prep && g.dil && g.mez) st = { ...st, ...g }; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) {} };
  const coma = (v) => String(v ?? '').replace('.', ',');
  const err = (id, e) => { const n = $(id); n.hidden = !e; if (e) n.textContent = e.message; };

  /* ---------- Pestañas ---------- */
  function pestana(t) {
    st.tab = t; guarda();
    for (const [b, s] of [['conc', 'conc'], ['prep', 'prep'], ['dil', 'dil']]) { $('#tab-' + b).setAttribute('aria-selected', t === s); $('#' + s).hidden = t !== s; }
  }
  for (const t of ['conc', 'prep', 'dil']) $('#tab-' + t).addEventListener('click', () => pestana(t));
  $('#modo').value = st.modo;
  $('#modo').addEventListener('change', () => { st.modo = $('#modo').value; guarda(); conc(); prep(); });

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
    const o = st.prep.origen === 'comercial' ? 'comercial' : 'solido';
    document.querySelectorAll('#prep [data-o]').forEach((n) => { n.hidden = n.dataset.o !== o; });
    let r;
    try { r = D.preparar({ ...st.prep, modo: st.modo }); } catch (e) { err('#error-prep', e); $('#valores-prep').innerHTML = ''; $('#instr').hidden = true; $('#pasos-prep').innerHTML = ''; return; }
    err('#error-prep', null);
    const t = [['Moles de soluto', `${f(r.n)} mol`], ['Soluto puro', `${f(r.mPuro)} g`]];
    if (r.mPesar !== undefined) t.push(['Hay que pesar', `${f(r.mPesar)} g`]);
    if (r.Vcomercial !== undefined) t.push(['Reactivo comercial', `${f(r.mComercial)} g`], ['Hay que medir', `${f(r.Vcomercial)} mL`], ['Molaridad del comercial', `${f(r.Mcomercial)} mol/L`]);
    $('#valores-prep').innerHTML = t.map(([a, b], i) => `<div class="valor${i === t.length - (r.Vcomercial !== undefined ? 2 : 1) ? ' dato' : ''}"><span>${a}</span><b>${b}</b></div>`).join('');
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
    $('#res-dil').innerHTML = `${NOM[r.calculado]} = ${f(r[r.calculado])}`;
    $('#pasos-dil').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }
  function mez() {
    let r;
    try { r = D.mezclar(st.mez); } catch (e) { err('#error-mez', e); $('#res-mez').innerHTML = ''; $('#pasos-mez').innerHTML = ''; return; }
    err('#error-mez', null);
    $('#res-mez').innerHTML = `C = ${f(r.C)} en ${f(r.Vt)} de volumen total`;
    $('#pasos-mez').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('disoluciones').current;
  rellena('c', 'conc'); rellena('p', 'prep'); rellena('d', 'dil'); rellena('m', 'mez');
  conc(); prep(); dil(); mez(); pestana(st.tab);
  window.DisolApp = { abrirEjemplo, abrirEjemploP, pestana, estado: () => JSON.parse(JSON.stringify(st)) };
})();
