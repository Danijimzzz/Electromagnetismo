/* =====================================================================
   Masa molar y estequiometría: interfaz. El cálculo está en
   quimica/formulas.js (Formulas) con las masas de quimica/elementos.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const F = Formulas, num = F.num;
  const CLAVE = 'masa-molar-v1';
  const COLORES = ['#2a5db5', '#1d8a5b', '#d1495b', '#e0a52a', '#7b5ea7', '#2bb3c0', '#b5562a', '#6b8f23', '#c25fa0', '#5b6670'];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // número para un campo de texto: coma decimal y 4 cifras, potencia de 10 escrita con ^
  const campo = (x) => {
    if (!isFinite(x)) return '';
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e6 || a < 1e-3)) { const [m, e] = x.toExponential(3).split('e'); return `${String(+m).replace('.', ',')}·10^${+e}`; }
    return String(+x.toPrecision(4)).replace('.', ',');
  };
  const leeNum = (s) => {
    const t = String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+-−]?\d+)/i, 'e$1').replace('−', '-');
    return t === '' ? NaN : +t;
  };

  let st = { tab: 'masa', formula: 'CuSO4·5H2O', ecuacion: F.ejemplos[0].ecuacion, cantidades: F.ejemplos[0].cantidades, modo: 'iupac', rendimiento: '100', gramos: '', T: '0', P: '1', realMasa: '', realI: '',
    emp: { tipo: 'composicion', texto: 'C 40; H 6,7; O 53,3', m: '', co2: '', h2o: '', M: '180' } };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') st = { ...st, ...g }; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) {} };

  /* ---------- Pestañas y modo de masas ---------- */
  function pestana(t) {
    st.tab = t;
    $('#tab-masa').setAttribute('aria-selected', t === 'masa');
    $('#tab-este').setAttribute('aria-selected', t === 'este');
    $('#tab-emp').setAttribute('aria-selected', t === 'emp');
    $('#masa').hidden = t !== 'masa'; $('#este').hidden = t !== 'este'; $('#emp').hidden = t !== 'emp';
    guarda();
  }
  $('#tab-emp').addEventListener('click', () => pestana('emp'));
  // temperatura y presión de los gases, las mismas en el conversor y en la estequiometría
  const gas = () => { const T = leeNum(st.T), P = leeNum(st.P); return { T: (isFinite(T) ? T : 0) + 273.15, P: P > 0 ? P : 1 }; };
  document.querySelectorAll('.gT').forEach((x) => { x.value = st.T; x.addEventListener('input', () => { st.T = x.value; document.querySelectorAll('.gT').forEach((y) => y !== x && (y.value = x.value)); guarda(); convierte(null); este(false); }); });
  document.querySelectorAll('.gP').forEach((x) => { x.value = st.P; x.addEventListener('input', () => { st.P = x.value; document.querySelectorAll('.gP').forEach((y) => y !== x && (y.value = x.value)); guarda(); convierte(null); este(false); }); });
  $('#tab-masa').addEventListener('click', () => pestana('masa'));
  $('#tab-este').addEventListener('click', () => pestana('este'));
  $('#modo').value = st.modo;
  $('#modo').addEventListener('change', () => { st.modo = $('#modo').value; guarda(); masa(); este(); emp(); });

  /* ---------- Masa molar ---------- */
  let M = NaN;
  function masa() {
    const err = $('#error-masa'), out = $('#res-masa');
    let r;
    try { r = F.masaMolar(st.formula, st.modo); } catch (e) { err.textContent = e.message; err.hidden = false; out.innerHTML = ''; M = NaN; convierte(null); return; }
    err.hidden = true; M = r.M;
    const filas = r.filas.map((f, i) => `<tr><td><b style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${COLORES[i % COLORES.length]};margin-right:6px"></b>${f.simbolo} <span style="color:var(--muted)">${f.nombre}</span></td><td>${f.n}</td><td>${num(f.masa, 5)}</td><td>${num(f.aporte, 5)}</td><td>${num(f.porcentaje)} %</td></tr>`).join('');
    const suma = r.filas.map((f) => `${f.n > 1 ? f.n + ' · ' : ''}${num(f.masa, 5)}`).join(' + ');
    out.innerHTML = `<div class="grande">M(<span class="formula">${r.html}</span>) = ${num(r.M, 5)} <small>g/mol</small></div>
      <p class="nota" style="margin-top:0">${suma} = ${num(r.M, 5)} g/mol${r.carga ? ' (la masa de los electrones ganados o perdidos es despreciable)' : ''}</p>
      <div class="barra-comp">${r.filas.map((f, i) => `<span style="width:${f.porcentaje}%;background:${COLORES[i % COLORES.length]}" title="${f.simbolo}: ${num(f.porcentaje)} %"></span>`).join('')}</div>
      <div class="tabla-scroll" style="margin-top:12px"><table><thead><tr><th>Elemento</th><th>Átomos</th><th>Masa atómica (u)</th><th>Aporte (g/mol)</th><th>% en masa</th></tr></thead><tbody>${filas}</tbody></table></div>`;
    convierte(null);
  }
  $('#formula').value = st.formula;
  $('#formula').addEventListener('input', () => { st.formula = $('#formula').value; guarda(); masa(); });

  // conversor: el último campo escrito manda
  const Vm = () => F.vm(gas().T, gas().P);
  const CONV = { g: (n) => n * M, mol: (n) => n, n: (n) => n * F.NA, L: (n) => n * Vm() };
  const A_MOL = { g: (v) => v / M, mol: (v) => v, n: (v) => v / F.NA, L: (v) => v / Vm() };
  let ultimo = 'g';
  function convierte(desde) {
    if (desde) ultimo = desde;
    const v = leeNum($('#cv-' + ultimo).value);
    for (const k of Object.keys(CONV)) {
      if (k === ultimo) continue;
      const n = A_MOL[ultimo](v);
      $('#cv-' + k).value = isFinite(n) && isFinite(M) ? campo(CONV[k](n)) : '';
    }
    if (ultimo === 'g') { st.gramos = $('#cv-g').value; guarda(); }
  }
  for (const k of Object.keys(CONV)) $('#cv-' + k).addEventListener('input', () => convierte(k));
  $('#cv-g').value = st.gramos || '100';

  /* ---------- Estequiometría ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + F.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    st.ecuacion = e.ecuacion; st.cantidades = e.cantidades.map((c) => (c ? { ...c } : null)); st.rendimiento = '100'; st.realMasa = ''; st.T = e.T ?? '0'; st.P = e.P ?? '1';
    $('#ecuacion').value = st.ecuacion; $('#rendimiento').value = '100'; $('#real-masa').value = ''; sel.value = clave;
    document.querySelectorAll('.gT').forEach((x) => (x.value = st.T)); document.querySelectorAll('.gP').forEach((x) => (x.value = st.P));
    pestana('este'); este(true); guarda(); // después de este(), que completa las cantidades de la ecuación
  }
  $('#ecuacion').value = st.ecuacion;
  $('#rendimiento').value = st.rendimiento;
  $('#ecuacion').addEventListener('input', () => { st.ecuacion = $('#ecuacion').value; sel.value = ''; guarda(); este(true); });
  $('#rendimiento').addEventListener('input', () => { st.rendimiento = $('#rendimiento').value; guarda(); este(false); });
  $('#real-masa').value = st.realMasa;
  $('#real-masa').addEventListener('input', () => { st.realMasa = $('#real-masa').value; guarda(); este(false); });
  $('#real-i').addEventListener('change', () => { st.realI = $('#real-i').value; guarda(); este(false); });

  let forma = ''; // especies de la tabla dibujada, para no rehacer los campos mientras se escribe
  function este(rehacer) {
    const err = $('#error-este'), tabla = $('#tabla-este');
    let aj;
    try { aj = F.ajustar(st.ecuacion); } catch (e) { err.textContent = e.message; err.hidden = false; $('#ajustada').innerHTML = ''; tabla.innerHTML = ''; $('#pasos').innerHTML = ''; $('#resumen-este').innerHTML = ''; forma = ''; return; }
    err.hidden = true;
    $('#ajustada').innerHTML = aj.html;
    const clave = aj.especies.map((s) => s.texto).join('|');
    if (rehacer || clave !== forma) {
      forma = clave;
      st.cantidades = aj.especies.map((s, i) => (s.reactivo ? st.cantidades?.[i] || { valor: '', unidad: 'g' } : null));
      tabla.innerHTML = `<thead><tr><th>Especie</th><th>Coef.</th><th>M (g/mol)</th><th>Cantidad inicial</th><th>Reacciona / se forma</th><th>Masa</th><th>Sobra</th></tr></thead><tbody>${aj.especies.map((s, i) => `<tr data-i="${i}">
        <td class="formula">${s.html}</td><td>${s.coef}</td><td class="M"></td>
        <td>${s.reactivo ? `<div class="cantidad"><input class="in q" inputmode="decimal" value="${esc(String(st.cantidades[i].valor ?? '').replace('.', ','))}" aria-label="Cantidad de ${esc(s.texto)}"><select class="in u" aria-label="Unidad"><option value="g">g</option><option value="mol">mol</option><option value="L">L de gas</option><option value="disol">mL de disolución</option></select><input class="in x" inputmode="decimal" aria-label="Pureza en % o molaridad de ${esc(s.texto)}"></div>` : '<span style="color:var(--muted)">producto</span>'}</td>
        <td class="n"></td><td class="m"></td><td class="s"></td></tr>`).join('')}</tbody>`;
      tabla.querySelectorAll('tr[data-i]').forEach((tr) => {
        const i = +tr.dataset.i, q = tr.querySelector('.q'), u = tr.querySelector('.u');
        if (!q) return;
        const x = tr.querySelector('.x');
        u.value = st.cantidades[i].unidad || 'g';
        x.value = String(st.cantidades[i].extra ?? '').replace('.', ',');
        // el campo de al lado es la pureza (g) o la molaridad (disolución)
        const extra = () => { x.hidden = !['g', 'disol'].includes(u.value); x.placeholder = u.value === 'disol' ? 'mol/L' : 'pureza %'; };
        const cambia = () => { extra(); st.cantidades[i] = { valor: q.value.replace(',', '.'), unidad: u.value, extra: x.value.replace(',', '.') }; guarda(); este(false); };
        extra();
        q.addEventListener('input', cambia); u.addEventListener('change', cambia); x.addEventListener('input', cambia);
      });
    }
    // productos para el rendimiento real
    const ri = $('#real-i'), prods = aj.especies.map((s, i) => ({ s, i })).filter((x) => !x.s.reactivo && !x.s.atomos.e && Object.keys(x.s.atomos).length);
    const opts = prods.map((x) => `<option value="${x.i}">${esc(x.s.texto)}</option>`).join('');
    if (ri.innerHTML !== opts) ri.innerHTML = opts;
    if (prods.some((x) => String(x.i) === String(st.realI))) ri.value = st.realI;
    let r = null;
    try { r = F.estequiometria(st.ecuacion, st.cantidades, { modo: st.modo, rendimiento: leeNum(st.rendimiento) || 100, ...gas(), real: st.realMasa ? { i: +ri.value, masa: st.realMasa } : null }); err.hidden = true; } catch (e) { err.textContent = e.message; err.hidden = false; }
    $('#rendimiento').disabled = !!(r && r.renReal != null);
    aj.especies.forEach((s, i) => {
      const tr = tabla.querySelector(`tr[data-i="${i}"]`), o = r?.especies[i];
      tr.querySelector('.M').innerHTML = num(F.masaMolar(s.texto, st.modo).M, 5);
      tr.classList.toggle('lim', !!r && r.limitante === i);
      tr.querySelector('.n').innerHTML = !o ? '' : o.reactivo ? `${num(o.gastado)} mol${r.limitante === i && r.varios ? ' · limitante' : ''}` : `${num(o.formado)} mol`;
      tr.querySelector('.m').innerHTML = !o ? '' : `${num((o.reactivo ? o.gastado : o.formado) * o.M)} g`;
      tr.querySelector('.s').innerHTML = !o || !o.reactivo || o.sobra === undefined ? '' : o.sobra > 1e-12 ? `${num(o.sobra * o.M)} g` : '0';
    });
    $('#pasos').innerHTML = r ? r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('') : '';
    // resumen: el limitante, cada producto y lo que sobra
    const res = r ? [
      r.varios ? `<div><span>Reactivo limitante</span><b class="formula">${aj.especies[r.limitante].html}</b></div>` : '',
      ...r.especies.filter((o) => !o.reactivo && !o.electron).map((o) => `<div><span>Masa de ${esc(o.texto)}</span><b>${num(o.masa)} g</b></div>${o.volumen ? `<div><span>Volumen de ${esc(o.texto)}</span><b>${num(o.volumen)} L</b></div>` : ''}`),
      ...r.especies.filter((o) => o.reactivo && o.sobra > 1e-12).map((o) => `<div><span>Sobra de ${esc(o.texto)}</span><b>${num(o.sobra * o.M)} g</b></div>`),
      r.renReal != null ? `<div><span>Rendimiento</span><b>${num(r.renReal)} %</b></div>` : '',
    ].join('') : '';
    $('#resumen-este').innerHTML = res;
  }

  /* ---------- Fórmula empírica ---------- */
  const E = st.emp;
  const campos = { 'emp-texto': 'texto', 'emp-m': 'm', 'emp-co2': 'co2', 'emp-h2o': 'h2o', 'emp-M': 'M' };
  for (const [id, k] of Object.entries(campos)) { $('#' + id).value = E[k] ?? ''; $('#' + id).addEventListener('input', () => { E[k] = $('#' + id).value; guarda(); emp(); }); }
  $('#emp-tipo').value = E.tipo;
  $('#emp-tipo').addEventListener('change', () => { E.tipo = $('#emp-tipo').value; guarda(); emp(); });
  function emp() {
    $('#emp-comp').hidden = E.tipo === 'combustion'; $('#emp-comb').hidden = E.tipo !== 'combustion';
    $('#emp-texto').placeholder = E.tipo === 'gramos' ? 'C 2,4; H 0,4; O 3,2' : 'C 40; H 6,7; O 53,3';
    const err = $('#error-emp');
    let r;
    try { r = F.empirica({ tipo: E.tipo === 'combustion' ? 'combustion' : 'composicion', unidad: E.tipo === 'gramos' ? 'g' : '%', composicion: E.texto, muestra: E.m, co2: E.co2, h2o: E.h2o, M: E.M, modo: st.modo }); } catch (e) { err.textContent = e.message; err.hidden = false; $('#resumen-emp').innerHTML = ''; $('#pasos-emp').innerHTML = ''; return; }
    err.hidden = true;
    $('#resumen-emp').innerHTML = `<div><span>Fórmula empírica</span><b class="formula">${r.html(r.empirica)}</b></div><div><span>M empírica</span><b>${num(r.Mempirica)} g/mol</b></div>${r.molecular ? `<div><span>Fórmula molecular</span><b class="formula">${r.html(r.molecular)}</b></div>` : ''}`;
    $('#pasos-emp').innerHTML = r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  /* ---------- Modo práctica ---------- */
  const toma = (xs) => xs[Math.floor(Math.random() * xs.length)], azarEn = (a, b) => a + Math.random() * (b - a);
  const tres = (x) => +x.toPrecision(3);
  const FORMULAS = ['H2O', 'CO2', 'NaCl', 'H2SO4', 'HNO3', 'NaOH', 'NH3', 'CaCO3', 'C6H12O6', 'C2H5OH', 'Ca(OH)2', 'Al2(SO4)3', 'KMnO4', 'Fe2O3', 'Mg3(PO4)2', 'CuSO4·5H2O', 'Na2CO3', 'K2Cr2O7', 'CH4', 'C3H8', 'HCl', 'Ba(NO3)2', 'NH4Cl', 'MgCl2·6H2O'];
  const EMPIRICAS = [['C6H12O6', 1], ['C2H4O2', 1], ['C4H10', 1], ['C3H6O', 0], ['C6H6', 1], ['C2H6O', 0], ['C8H18', 1], ['Fe2O3', 0], ['K2Cr2O7', 0], ['Na2S2O3', 0], ['C4H8O2', 1]];
  function azar() {
    if (st.tab === 'masa') { const f = toma(FORMULAS); $('#formula').value = f; st.formula = f; guarda(); masa(); return; }
    if (st.tab === 'emp') {
      const [f, conM] = toma(EMPIRICAS), r = F.masaMolar(f, st.modo);
      Object.assign(E, { tipo: 'composicion', texto: r.filas.map((x) => `${x.simbolo} ${String(+x.porcentaje.toFixed(2)).replace('.', ',')}`).join('; '), M: conM ? String(+r.M.toFixed(1)).replace('.', ',') : '' });
      window.MasaApp.empirica({}); return;
    }
    const e = toma(F.ejemplos);
    abrirEjemplo(e.clave);
    st.cantidades = st.cantidades.map((c) => (c && c.valor !== '' ? { ...c, valor: String(tres(+c.valor * azarEn(0.6, 1.5))) } : c));
    $('#tabla-este').innerHTML = ''; forma = ''; este(false); guarda();
  }
  function enunciado() {
    if (st.tab === 'masa') return `Calcula la masa molar de <b>${esc(st.formula)}</b>.`;
    if (st.tab === 'emp') return `Un compuesto tiene la composición <b>${esc(E.texto)}</b> (en % en masa)${E.M ? ` y una masa molar de ${esc(E.M)} g/mol` : ''}. Halla su fórmula empírica${E.M ? ' y su molecular' : ''} y la masa molar de la empírica (escribe la fórmula sin subíndices: CH2O).`;
    const dadas = st.cantidades.map((c, i) => (c && c.valor !== '' ? `${String(c.valor).replace('.', ',')} ${c.unidad === 'disol' ? `mL de disolución ${String(c.extra).replace('.', ',')} M` : c.unidad === 'L' ? 'L' : c.unidad} de ${esc(F.ajustar(st.ecuacion).especies[i].texto)}` : null)).filter(Boolean);
    return `En la reacción <b>${esc(st.ecuacion)}</b> se mezclan ${dadas.join(' y ')}. Calcula ${dadas.length > 1 ? 'cuál es el reactivo limitante, ' : ''}la masa de cada producto${dadas.length > 1 ? ' y cuánto sobra del reactivo en exceso' : ''}.`;
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('masa-molar').current;
  masa(); este(true); emp(); pestana(st.tab);
  window.MasaApp = { pestana, abrirEjemplo, formula: (f) => { $('#formula').value = f; st.formula = f; masa(); }, M: () => M, ecuacion: (e) => { $('#ecuacion').value = e; st.ecuacion = e; este(true); }, empirica: (o) => { Object.assign(E, o); for (const [id, k] of Object.entries(campos)) $('#' + id).value = E[k] ?? ''; $('#emp-tipo').value = E.tipo; guarda(); emp(); }, estado: () => st, azar, enunciado };
})();
