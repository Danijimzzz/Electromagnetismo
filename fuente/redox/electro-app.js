/* =====================================================================
   Interfaz de las pestañas «Pilas y Nernst» y «Electrolisis» de Redox (RE-1, RE-2) y de las tres pestañas
   de la página (#pilas y #electrolisis en la dirección). El cálculo está en redox/electro.js (Electro).
   El estado va dentro del de Redox, en localStorage['redox-v1'].electro, para que Mis ejercicios lo guarde;
   app.js lo conserva al guardar su parte. Expone window.ElectroApp para las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const E = Electro, CLAVE = 'redox-v1', f = E.f;
  const leeAlm = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
  let el = { pila: copia(E.ejemplos[0].sc), faraday: copia(E.ejemplos.find((x) => x.clave === 'electro-cobre').sc), orden: copia(E.ejemplos.find((x) => x.clave === 'orden-descarga').sc), modoE: 'faraday' };
  { const g = leeAlm().electro; if (g && g.pila) el = { ...el, ...g }; }
  const guarda = () => { try { const g = leeAlm(); g.electro = el; localStorage.setItem(CLAVE, JSON.stringify(g)); } catch (e) { /* sin almacenamiento */ } };
  const col = {};
  const colores = () => { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--panel', '--bg']) col[k] = cs.getPropertyValue(k).trim(); };
  const dato = (t, v, cl = 'num') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const opcionesSemi = (sel, conTodas = true) => E.POTENCIALES.map((s) => `<option value="${s.id}"${s.id === sel ? ' selected' : ''}>${esc(E.etiqueta(s))} · E° = ${String(s.E.toFixed(2)).replace('.', ',').replace('-', '−')} V${s.medio === 'básico' ? ' (medio básico)' : s.medio === 'pH 7' ? ' (pH 7)' : ''}</option>`).join('');
  const resumenPasos = (id, pasos) => { $(id).innerHTML = pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join(''); };

  /* ---------- Pestañas ---------- */
  const TABS = ['ajuste', 'pila', 'electro'], HASH = { pila: 'pilas', electro: 'electrolisis', ajuste: '' };
  let pest = 'ajuste';
  function pestana(t, foco = false) {
    pest = t;
    for (const k of TABS) {
      const b = $('#tab-' + k), on = k === t;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; $('#panel-' + k).hidden = !on;
      if (on && foco) b.focus();
    }
    try { history.replaceState(null, '', location.pathname + location.search + (HASH[t] ? '#' + HASH[t] : '')); } catch (e) { /* file:// */ }
    if (t === 'pila') calculaPila(); else if (t === 'electro') calculaE();
    window.dispatchEvent(new Event('resize'));
  }
  $('#pestanas').addEventListener('click', (ev) => { const b = ev.target.closest('[data-pestana]'); if (b) pestana(b.dataset.pestana); });
  $('#pestanas').addEventListener('keydown', (ev) => {
    const i = TABS.indexOf(pest), d = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
    if (d) { ev.preventDefault(); pestana(TABS[(i + d + TABS.length) % TABS.length], true); }
    else if (ev.key === 'Home') { ev.preventDefault(); pestana(TABS[0], true); } else if (ev.key === 'End') { ev.preventDefault(); pestana(TABS[2], true); }
  });

  /* ---------- Pilas ---------- */
  let sp = null;
  const pe = () => el.pila;
  function formularioPila() {
    $('#p-catodo').innerHTML = opcionesSemi(pe().catodo); $('#p-anodo').innerHTML = opcionesSemi(pe().anodo); $('#p-T').value = pe().T ?? '298,15';
    const pe0 = $('#p-ejemplos'); if (!pe0.options.length) { pe0.innerHTML = '<option value="">Ejemplos…</option>' + E.ejemplos.filter((x) => x.sc.modo === 'pila').map((x) => `<option value="${x.clave}">${x.nombre}</option>`).join(''); }
  }
  function camposConc() {
    // un campo por cada ion o gas de la reacción global
    let r; try { r = E.resolver({ ...pe(), conc: {} }); } catch (e) { $('#p-conc').innerHTML = ''; return; }
    const conc = pe().conc || {};
    $('#p-conc').innerHTML = r.especies.length ? '<p class="nota" style="margin:0 0 6px">Concentraciones (mol/L) y presiones (bar); vacío = 1</p>' + r.especies.map((e, i) => `<label for="p-c${i}" class="nota" style="display:block;margin:6px 0 2px">${e.html.replace(/<small[^>]*>.*?<\/small>/, '')} <small>${e.fase === 'g' ? 'bar' : 'mol/L'}</small></label><input id="p-c${i}" class="in" data-k="${esc(e.k)}" inputmode="decimal" autocomplete="off" value="${esc(conc[e.k] ?? '')}">`).join('') : '';
  }
  function calculaPila() {
    const err = $('#p-error');
    try { sp = E.resolver({ ...pe(), modo: 'pila' }); } catch (e) {
      sp = null; err.textContent = e.message; err.hidden = false; $('#p-res').innerHTML = ''; $('#p-pasos').innerHTML = ''; $('#p-leyenda').textContent = ''; dibujaPila(); return;
    }
    err.hidden = true; guarda();
    $('#p-res').innerHTML = dato('Potencial estándar E°', `${f(sp.E0, 3)} V`) + dato('Potencial E (Nernst)', `${f(sp.E, 4)} V`) + dato('Espontánea', sp.espontanea ? 'Sí (E° > 0)' : 'No (E° < 0)', '') + dato('Electrones n', String(sp.n), '') + dato('ΔG°', `${f(sp.dG0)} kJ`) + dato('Constante K', f(sp.K)) + dato('Q', f(sp.Q), '');
    $('#p-res').innerHTML += `<div class="ancho" style="grid-column:1/-1"><span>Reacción global</span><b class="ajustada">${sp.globalHtml}</b></div><div class="ancho" style="grid-column:1/-1"><span>Notación de pila</span><b class="ajustada">${sp.notacionHtml}</b></div>`;
    resumenPasos('#p-pasos', sp.pasos);
    $('#p-leyenda').textContent = `El ánodo (−) es donde se oxida ${E.bonito(E.etiqueta(sp.an).split('→')[0]).replace(/ \+ \d* ?e⁻/, '')}; los electrones salen por el hilo hacia el cátodo (+). El puente salino cierra el circuito con iones. El voltímetro marca ${f(sp.E, 4)} V.`;
    dibujaPila();
  }
  function dibujaPila() {
    const { g, w, h } = lienzo('#p-grafica');
    if (!sp || !w || !h) return;
    const ink = col['--ink'], m = col['--muted'], mitad = w / 2, base = h - 30, alto = Math.min(130, h * 0.42), ancho = Math.min(150, w * 0.32), y0 = base - alto;
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 2;
    const vaso = (x, color, nombre, signo, sp1) => {
      g.fillStyle = color; g.globalAlpha = 0.25; g.fillRect(x, y0 + 28, ancho, alto - 28); g.globalAlpha = 1;
      g.strokeStyle = ink; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, base); g.lineTo(x + ancho, base); g.lineTo(x + ancho, y0); g.stroke();
      g.fillStyle = ink; g.fillRect(x + ancho / 2 - 5, y0 - 34, 10, alto + 6); // electrodo
      g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'top'; g.font = '600 12px system-ui, sans-serif'; g.fillText(`${nombre} (${signo})`, x + ancho / 2, base + 6);
      g.font = '12px system-ui, sans-serif'; g.fillStyle = m; g.textBaseline = 'middle'; g.fillText(sp1, x + ancho / 2, y0 + alto * 0.55);
    };
    const xa = mitad - ancho - 28, xc = mitad + 28;
    const ion = (s, oxd) => E.bonito((oxd ? s.ox : s.red).map((q) => (q[2] === 'aq' || q[2] === 's' || q[2] === 'g') && q[1] !== 'H+' ? q[1].replace(/\^/, '') : '').filter(Boolean).join(', ')).replace(/(\w)(\d)(?=\W|$)/g, '$1$2');
    vaso(xa, col['--serie-2'], 'Ánodo', '−', E.etiqueta(sp.an).split(' + ')[0] === '' ? '' : E.bonito(E.etiqueta(sp.an)).split(' → ')[1]?.replace(/ \+ \d* ?e⁻.*/, '') || '');
    vaso(xc, col['--serie-1'], 'Cátodo', '+', E.bonito(E.etiqueta(sp.cat)).split(' → ')[1] || '');
    // puente salino
    g.strokeStyle = m; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(xa + ancho - 16, y0 + 26); g.lineTo(xa + ancho - 16, y0 - 6); g.lineTo(xc + 16, y0 - 6); g.lineTo(xc + 16, y0 + 26); g.stroke();
    g.lineCap = 'butt'; g.lineWidth = 2; g.fillStyle = m; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('puente salino', mitad, y0 - 14);
    // hilo y voltímetro
    const yh = y0 - 44, ax = xa + ancho / 2, cx = xc + ancho / 2;
    g.strokeStyle = ink; g.beginPath(); g.moveTo(ax, y0 - 34); g.lineTo(ax, yh); g.lineTo(mitad - 38, yh); g.moveTo(mitad + 38, yh); g.lineTo(cx, yh); g.lineTo(cx, y0 - 34); g.stroke();
    g.fillStyle = col['--panel']; g.beginPath(); g.arc(mitad, yh, 36, 0, 2 * Math.PI); g.fill(); g.stroke();
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 13px system-ui, sans-serif'; g.fillText(`${f(sp.E, 3).replace(/<[^>]+>/g, '')} V`, mitad, yh - 2); g.font = '11px system-ui, sans-serif'; g.fillStyle = m; g.fillText('voltímetro', mitad, yh + 14);
    // flecha de los electrones (hacia el cátodo si E > 0)
    const dir = sp.E >= 0 ? 1 : -1, xf = mitad - dir * 60 + (dir > 0 ? -18 : 18);
    g.fillStyle = col['--accent']; g.strokeStyle = col['--accent']; g.beginPath(); g.moveTo(xf - 12 * dir, yh - 10); g.lineTo(xf + 12 * dir, yh - 10); g.stroke();
    g.beginPath(); g.moveTo(xf + 12 * dir, yh - 10); g.lineTo(xf + 6 * dir, yh - 15); g.lineTo(xf + 6 * dir, yh - 5); g.closePath(); g.fill();
    g.textBaseline = 'bottom'; g.font = '11px system-ui, sans-serif'; g.fillText('e⁻', xf, yh - 14);
  }
  $('#p-catodo').addEventListener('change', (ev) => { pe().catodo = ev.target.value; pe().conc = {}; $('#p-ejemplos').value = ''; camposConc(); calculaPila(); });
  $('#p-anodo').addEventListener('change', (ev) => { pe().anodo = ev.target.value; pe().conc = {}; $('#p-ejemplos').value = ''; camposConc(); calculaPila(); });
  $('#p-T').addEventListener('input', (ev) => { pe().T = ev.target.value; $('#p-ejemplos').value = ''; calculaPila(); });
  $('#p-conc').addEventListener('input', (ev) => { const t = ev.target; if (t.tagName !== 'INPUT') return; pe().conc = { ...(pe().conc || {}), [t.dataset.k]: t.value }; $('#p-ejemplos').value = ''; calculaPila(); });
  $('#p-ejemplos').addEventListener('change', (ev) => { if (ev.target.value) abrirPila(ev.target.value); });
  function abrirPila(clave) {
    const e = E.ejemplos.find((x) => x.clave === clave); if (!e || e.sc.modo !== 'pila') return;
    el.pila = copia(e.sc); formularioPila(); camposConc(); $('#p-ejemplos').value = clave; calculaPila();
  }

  /* ---------- Electrolisis y orden de descarga ---------- */
  let se = null;
  const cur = () => (el.modoE === 'orden' ? el.orden : el.faraday);
  const campo = (id, nom, un, k, extra = '') => `<label for="${id}" class="nota" style="display:block;margin:10px 0 2px">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="${id}" class="in" data-k="${k}" inputmode="decimal" autocomplete="off" value="${esc(cur()[k] ?? '')}"${extra}>`;
  const selec = (id, nom, k, lista) => `<label for="${id}" class="nota" style="display:block;margin:10px 0 2px">${nom}</label><select id="${id}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${cur()[k] === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  function formularioE() {
    $('#e-modo').value = el.modoE;
    if (!$('#e-ejemplos').options.length) $('#e-ejemplos').innerHTML = '<option value="">Ejemplos…</option>' + E.ejemplos.filter((x) => x.sc.modo !== 'pila').map((x) => `<option value="${x.clave}">${x.nombre}</option>`).join('');
    const c = cur();
    if (el.modoE === 'orden') {
      $('#e-campos').innerHTML = `<fieldset style="border:1px solid var(--line);border-radius:8px;padding:8px 10px"><legend class="nota">Semirreacciones presentes (marca las que haya)</legend>${E.POTENCIALES.map((s, i) => `<label style="display:flex;gap:8px;align-items:flex-start;margin:4px 0;font-size:13px"><input type="checkbox" data-id="${s.id}"${(c.mezcla || []).includes(s.id) ? ' checked' : ''}> <span>${esc(E.etiqueta(s))} · ${String(s.E.toFixed(2)).replace('.', ',').replace('-', '−')} V${s.medio === 'pH 7' ? ' (pH 7)' : s.medio === 'básico' ? ' (básico)' : ''}</span></label>`).join('')}</fieldset>`;
      $('#e-nota').textContent = 'Marca los iones y el agua que hay en la disolución. En el cátodo se reduce primero el de mayor potencial; en el ánodo se oxida primero la forma reducida de menor potencial.';
    } else {
      const que = c.calcula || 'masa';
      $('#e-campos').innerHTML = `<label for="e-semi" class="nota" style="display:block;margin:0 0 2px">Semirreacción</label><select id="e-semi" class="in" data-k="semi">${opcionesSemi(c.semi)}</select>` +
        selec('e-sentido', 'Electrodo', 'sentido', [['reduccion', 'Cátodo: se reduce (sentido de la tabla)'], ['oxidacion', 'Ánodo: se oxida (al revés)']]) +
        selec('e-calcula', 'Qué calcular', 'calcula', [['masa', 'Masa (o volumen) desprendido'], ['tiempo', 'Tiempo necesario'], ['intensidad', 'Intensidad necesaria']]) +
        (que !== 'intensidad' ? campo('e-I', 'Intensidad', 'A', 'I') : '') + (que !== 'masa' ? campo('e-m', 'Masa', 'g', 'm') : '') +
        (que !== 'tiempo' ? campo('e-t', 'Tiempo', '', 't') + selec('e-ut', 'Unidad del tiempo', 'ut', [['s', 'segundos'], ['min', 'minutos'], ['h', 'horas']]) : '') +
        campo('e-eta', 'Rendimiento de corriente', '%', 'eta') + campo('e-T', 'Temperatura (para gases)', 'K', 'T') + campo('e-P', 'Presión (para gases)', 'atm', 'P');
      $('#e-nota').textContent = 'F = 96485 C/mol de e⁻. Si el producto es un gas se calcula también su volumen a la temperatura y presión que pongas.';
    }
  }
  function calculaE() {
    const err = $('#e-error'), c = cur();
    try { se = E.resolver({ ...c, modo: el.modoE === 'orden' ? 'orden' : 'electrolisis' }); } catch (e) {
      se = null; err.textContent = e.message; err.hidden = false; $('#e-res').innerHTML = ''; $('#e-pasos').innerHTML = ''; $('#e-leyenda').textContent = ''; dibujaE(); return;
    }
    err.hidden = true; guarda();
    if (se.modo === 'orden') {
      $('#e-res').innerHTML = dato('Se reduce primero (cátodo)', esc(E.etiqueta(se.cat[0]).split(' → ')[1] ? E.etiqueta(se.cat[0]) : ''), '') + dato('Se oxida primero (ánodo)', esc(E.etiqueta(se.an[0])), '') + dato('Tensión mínima', `${f(Math.abs(se.minimo), 3)} V`);
      $('#e-titulo-graf').textContent = 'Escala de potenciales'; $('#e-leyenda').textContent = 'Potenciales de reducción estándar: arriba, lo que se reduce antes en el cátodo; abajo, lo que se oxida antes en el ánodo.';
    } else {
      $('#e-res').innerHTML = (se.calcula === 'masa' ? dato(se.esGas ? 'Gas desprendido' : 'Masa depositada', `${f(se.m)} g`) : '') + (se.calcula === 'tiempo' ? dato('Tiempo', `${f(se.t)} s (${f(se.t / 60)} min)`) : '') + (se.calcula === 'intensidad' ? dato('Intensidad', `${f(se.I)} A`) : '') +
        dato('Cantidad de ' + se.prod, `${f(se.mol)} mol`, '') + dato('Electrones', `${f(se.ne)} mol`, '') + dato('Carga', `${f(se.Q)} C`, '') + (se.esGas ? dato('Volumen', `${f(se.V)} L`) : '');
      $('#e-titulo-graf').textContent = 'Masa frente al tiempo'; $('#e-leyenda').textContent = 'La masa (o los moles) crece de forma lineal con el tiempo, con pendiente M·I/(nF). El punto es tu resultado.';
    }
    resumenPasos('#e-pasos', se.pasos); dibujaE();
  }
  function dibujaE() {
    const { g, w, h } = lienzo('#e-grafica');
    if (!se || !w || !h) return;
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1;
    const ml = 56, mr = 14, mt = 14, mb = 36;
    if (se.modo === 'orden') {
      const lista = [...se.cat], vals = lista.map((s) => s.E), lo = Math.floor(Math.min(...vals) * 2) / 2 - 0.3, hi = Math.ceil(Math.max(...vals) * 2) / 2 + 0.3;
      const Y = (v) => h - mb - ((v - lo) / (hi - lo)) * (h - mt - mb);
      g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'middle';
      for (let v = Math.ceil(lo); v <= hi; v++) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(`${String(v).replace('-', '−')} V`, ml - 6, Y(v)); }
      g.save(); g.translate(14, mt + (h - mt - mb) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText('E° de reducción', 0, 0); g.restore();
      lista.forEach((s, i) => {
        const y = Y(s.E), x = ml + 10, ancho = w - ml - mr - 20;
        g.strokeStyle = col['--serie-1']; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y); g.stroke(); g.lineWidth = 1;
        g.fillStyle = col['--ink']; g.textAlign = 'left'; g.textBaseline = 'bottom';
        g.fillText(`${i + 1}.º  ${E.etiqueta(s)}  (${String(s.E.toFixed(2)).replace('.', ',').replace('-', '−')} V)`, x + 48, y + 5 + (i % 2 ? 0 : 0));
      });
      return;
    }
    // masa (o moles) frente al tiempo: recta por el origen hasta un poco más del tiempo calculado
    const tmax = se.t * 1.25, mmax = (se.m / se.t) * tmax;
    const X = (v) => ml + (v / tmax) * (w - ml - mr), Y = (v) => h - mb - (v / mmax) * (h - mt - mb);
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) { const v = (mmax * i) / 4; g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(Herramienta.txt(f(v, 3)), ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) { const v = (tmax * i) / 4; g.fillText(Herramienta.txt(f(v, 3)), X(v), h - mb + 6); }
    g.fillText('tiempo (s)', ml + (w - ml - mr) / 2, h - 16);
    g.save(); g.translate(14, mt + (h - mt - mb) / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('masa (g)', 0, 0); g.restore();
    g.strokeStyle = col['--accent']; g.lineWidth = 2.6; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(tmax), Y(mmax)); g.stroke();
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(se.t), Y(se.m), 5.5, 0, 7); g.fill();
  }
  $('#e-modo').addEventListener('change', (ev) => { el.modoE = ev.target.value; $('#e-ejemplos').value = ''; formularioE(); calculaE(); });
  $('#e-campos').addEventListener('input', (ev) => { const t = ev.target; if (t.tagName === 'INPUT' && t.dataset.k) { cur()[t.dataset.k] = t.value; $('#e-ejemplos').value = ''; calculaE(); } });
  $('#e-campos').addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.type === 'checkbox') { const c = el.orden; c.mezcla = [...document.querySelectorAll('#e-campos input[type=checkbox]')].filter((x) => x.checked).map((x) => x.dataset.id); $('#e-ejemplos').value = ''; calculaE(); }
    else if (t.tagName === 'SELECT' && t.dataset.k) { cur()[t.dataset.k] = t.value; $('#e-ejemplos').value = ''; formularioE(); calculaE(); }
  });
  $('#e-ejemplos').addEventListener('change', (ev) => { if (ev.target.value) abrirE(ev.target.value); });
  function abrirE(clave) {
    const e = E.ejemplos.find((x) => x.clave === clave); if (!e || e.sc.modo === 'pila') return;
    if (e.sc.modo === 'orden') { el.modoE = 'orden'; el.orden = copia(e.sc); } else { el.modoE = 'faraday'; el.faraday = copia(e.sc); }
    formularioE(); $('#e-ejemplos').value = clave; calculaE();
  }

  window.addEventListener('resize', () => { dibujaPila(); dibujaE(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibujaPila(); dibujaE(); });
  colores(); formularioPila(); camposConc(); formularioE();
  const h = (location.hash || '').slice(1);
  pestana(h === 'pilas' ? 'pila' : h === 'electrolisis' ? 'electro' : 'ajuste');
  window.ElectroApp = {
    pestana, abrirPila, abrirE, estado: () => copia(el), pestanaActual: () => pest,
    resultado: () => (pest === 'pila' ? sp && { modo: 'pila', E0: sp.E0, E: sp.E, n: sp.n, dG0: sp.dG0, K: sp.K } : se && { modo: se.modo, m: se.m, t: se.t, I: se.I, V: se.V }),
  };
})();
