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

  let st = { tab: 'masa', formula: 'CuSO4·5H2O', ecuacion: F.ejemplos[0].ecuacion, cantidades: F.ejemplos[0].cantidades, modo: 'iupac', rendimiento: '100', gramos: '' };
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') st = { ...st, ...g }; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) {} };

  /* ---------- Pestañas y modo de masas ---------- */
  function pestana(t) {
    st.tab = t;
    $('#tab-masa').setAttribute('aria-selected', t === 'masa');
    $('#tab-este').setAttribute('aria-selected', t === 'este');
    $('#masa').hidden = t !== 'masa'; $('#este').hidden = t !== 'este';
    guarda();
  }
  $('#tab-masa').addEventListener('click', () => pestana('masa'));
  $('#tab-este').addEventListener('click', () => pestana('este'));
  $('#modo').value = st.modo;
  $('#modo').addEventListener('change', () => { st.modo = $('#modo').value; guarda(); masa(); este(); });

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
  const CONV = { g: (n) => n * M, mol: (n) => n, n: (n) => n * F.NA, L: (n) => n * F.VM };
  const A_MOL = { g: (v) => v / M, mol: (v) => v, n: (v) => v / F.NA, L: (v) => v / F.VM };
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
    st.ecuacion = e.ecuacion; st.cantidades = e.cantidades.map((c) => (c ? { ...c } : null)); st.rendimiento = '100';
    $('#ecuacion').value = st.ecuacion; $('#rendimiento').value = '100'; sel.value = clave;
    pestana('este'); este(true); guarda(); // después de este(), que completa las cantidades de la ecuación
  }
  $('#ecuacion').value = st.ecuacion;
  $('#rendimiento').value = st.rendimiento;
  $('#ecuacion').addEventListener('input', () => { st.ecuacion = $('#ecuacion').value; sel.value = ''; guarda(); este(true); });
  $('#rendimiento').addEventListener('input', () => { st.rendimiento = $('#rendimiento').value; guarda(); este(false); });

  let forma = ''; // especies de la tabla dibujada, para no rehacer los campos mientras se escribe
  function este(rehacer) {
    const err = $('#error-este'), tabla = $('#tabla-este');
    let aj;
    try { aj = F.ajustar(st.ecuacion); } catch (e) { err.textContent = e.message; err.hidden = false; $('#ajustada').innerHTML = ''; tabla.innerHTML = ''; $('#pasos').innerHTML = ''; forma = ''; return; }
    err.hidden = true;
    $('#ajustada').innerHTML = aj.html;
    const clave = aj.especies.map((s) => s.texto).join('|');
    if (rehacer || clave !== forma) {
      forma = clave;
      st.cantidades = aj.especies.map((s, i) => (s.reactivo ? st.cantidades?.[i] || { valor: '', unidad: 'g' } : null));
      tabla.innerHTML = `<thead><tr><th>Especie</th><th>Coef.</th><th>M (g/mol)</th><th>Cantidad inicial</th><th>Reacciona / se forma</th><th>Masa</th><th>Sobra</th></tr></thead><tbody>${aj.especies.map((s, i) => `<tr data-i="${i}">
        <td class="formula">${s.html}</td><td>${s.coef}</td><td class="M"></td>
        <td>${s.reactivo ? `<div class="cantidad"><input class="in q" inputmode="decimal" value="${esc(String(st.cantidades[i].valor ?? '').replace('.', ','))}" aria-label="Cantidad de ${esc(s.texto)}"><select class="in u" aria-label="Unidad"><option value="g">g</option><option value="mol">mol</option><option value="L">L (gas, CN)</option></select></div>` : '<span style="color:var(--muted)">producto</span>'}</td>
        <td class="n"></td><td class="m"></td><td class="s"></td></tr>`).join('')}</tbody>`;
      tabla.querySelectorAll('tr[data-i]').forEach((tr) => {
        const i = +tr.dataset.i, q = tr.querySelector('.q'), u = tr.querySelector('.u');
        if (!q) return;
        u.value = st.cantidades[i].unidad || 'g';
        const cambia = () => { st.cantidades[i] = { valor: q.value.replace(',', '.'), unidad: u.value }; guarda(); este(false); };
        q.addEventListener('input', cambia); u.addEventListener('change', cambia);
      });
    }
    let r = null;
    try { r = F.estequiometria(st.ecuacion, st.cantidades, { modo: st.modo, rendimiento: leeNum(st.rendimiento) || 100 }); err.hidden = true; } catch (e) { err.textContent = e.message; err.hidden = false; }
    aj.especies.forEach((s, i) => {
      const tr = tabla.querySelector(`tr[data-i="${i}"]`), o = r?.especies[i];
      tr.querySelector('.M').innerHTML = num(F.masaMolar(s.texto, st.modo).M, 5);
      tr.classList.toggle('lim', !!r && r.limitante === i);
      tr.querySelector('.n').innerHTML = !o ? '' : o.reactivo ? `${num(o.gastado)} mol${r.limitante === i && r.varios ? ' · limitante' : ''}` : `${num(o.formado)} mol`;
      tr.querySelector('.m').innerHTML = !o ? '' : `${num((o.reactivo ? o.gastado : o.formado) * o.M)} g`;
      tr.querySelector('.s').innerHTML = !o || !o.reactivo || o.sobra === undefined ? '' : o.sobra > 1e-12 ? `${num(o.sobra * o.M)} g` : '0';
    });
    $('#pasos').innerHTML = r ? r.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('') : '';
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('masa-molar').current;
  masa(); este(true); pestana(st.tab);
  window.MasaApp = { pestana, abrirEjemplo, formula: (f) => { $('#formula').value = f; st.formula = f; masa(); }, M: () => M, ecuacion: (e) => { $('#ecuacion').value = e; st.ecuacion = e; este(true); } };
})();
