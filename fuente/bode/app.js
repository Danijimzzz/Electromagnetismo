/* =====================================================================
   Diagramas de Bode y filtros · interfaz: tipo de filtro y componentes,
   resultados (frecuencia de corte, Q, ancho de banda…), los diagramas de
   magnitud (dB) y de fase con sus asíntotas y el desarrollo. El cálculo está en
   bode/calculo.js (Bode) y el circuito entero, con osciloscopio, en el
   Simulador de circuitos (../simulador/). Guarda el estado (sc) en
   localStorage['bode-v1'] (lo que copia Mis ejercicios). Expone window.BodeApp.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const B = Bode, f = B.f, CLAVE = 'bode-v1';

  let sc = copia(B.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && B.TIPOS[g.tipo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const GRUPOS = [['Primer orden', ['rc-bajo', 'rc-alto', 'rl-bajo', 'rl-alto']], ['Segundo orden (RLC en serie)', ['rlc-bajo', 'rlc-alto', 'rlc-banda', 'rlc-rechazo']]];
  function formulario() {
    const t = B.TIPOS[sc.tipo];
    let h = `<label for="f-tipo">Filtro</label><select id="f-tipo" class="in" data-k="tipo">${GRUPOS.map(([g, l]) => `<optgroup label="${g}">${l.map((k) => `<option value="${k}"${sc.tipo === k ? ' selected' : ''}>${B.TIPOS[k].nombre}</option>`).join('')}</optgroup>`).join('')}</select>`;
    h += t.comp.map((k) => fila(k, { R: 'Resistencia R', L: 'Inductancia L', C: 'Capacidad C' }[k], B.UNIDAD[k][2])).join('');
    h += '<div class="sep">Diagrama</div>' + fila('f', 'Frecuencia de interés', 'Hz, opcional') + fila('fmin', 'Frecuencia mínima', 'Hz, opcional') + fila('fmax', 'Frecuencia máxima', 'Hz, opcional');
    $('#campos').innerHTML = h;
    $('#nota').textContent = 'R en Ω, L en mH y C en µF, o con prefijo y unidad (4k7, 100n, 10 µF). Sin rango, el diagrama abarca dos décadas a cada lado.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; if (t.dataset.k === 'tipo') formulario(); calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + B.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = B.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = B.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const o2 = sol.def.orden === 2, c = sol.cortes, hz = (x) => `${f(x)} Hz`;
    let h = dato(o2 ? 'Frecuencia propia f₀' : 'Frecuencia de corte f꜀', hz(sol.f0));
    if (o2) h += dato('Factor de calidad Q', f(sol.Q)) + dato('Amortiguamiento ζ', f(sol.zeta));
    if (sol.BW !== null) h += dato('−3 dB en', `${hz(c[0])} y ${hz(c[1])}`) + dato('Ancho de banda', hz(sol.BW));
    else if (c.length) h += dato('−3 dB en', c.map(hz).join(' y '));
    if (sol.pico) h += dato('Pico de resonancia', `${f(sol.pico.dB)} dB en ${hz(sol.pico.f)}`);
    h += dato('Pendiente', sol.def.clase === 'rechazo' ? 'muesca en f₀' : sol.def.clase === 'banda' ? '±20 dB/dec' : `${sol.def.clase === 'bajo' ? '−' : '+'}${sol.pendiente} dB/dec`);
    if (sol.punto) h += dato(`En ${hz(sol.punto.f)}`, `${f(sol.punto.dB)} dB · ${f(sol.punto.fase)}°`);
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Línea continua: respuesta exacta. Línea discontinua: asíntotas. Punto: frecuencia de interés.';
    dibuja();
  }

  /* ---------- Gráficas ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  const fmtF = (x) => txt(f(x, 3));
  // Un diagrama: eje de frecuencias logarítmico, eje y lineal en `ymin`..`ymax`; `curva` y `asi` son listas de y
  function diagrama(sel, fs, curva, asi, ymin, ymax, unidad, refs, punto) {
    const { g, w, h } = lienzo(sel);
    if (!w || !h) return;
    const ml = 52, mr = 14, mt = 10, mb = 26, l0 = Math.log10(fs[0]), l1 = Math.log10(fs[fs.length - 1]);
    const X = (fr) => ml + ((Math.log10(fr) - l0) / (l1 - l0)) * (w - ml - mr), Y = (v) => mt + (1 - (v - ymin) / (ymax - ymin)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.fillStyle = col['--muted']; g.strokeStyle = col['--line'];
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(ymin, ymax, 5)) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(`${String(v).replace('-', '−')}${unidad}`, ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    let ult = -1e9;
    for (let e = Math.ceil(l0 - 1e-9); e <= l1 + 1e-9; e++) {
      const x = X(10 ** e); g.strokeStyle = col['--line']; g.beginPath(); g.moveTo(x, mt); g.lineTo(x, h - mb); g.stroke();
      if (x - ult > 56) { g.fillText(fmtF(10 ** e), x, h - mb + 6); ult = x; }
    }
    g.save(); g.beginPath(); g.rect(ml, mt, w - ml - mr, h - mt - mb); g.clip();
    for (const [v, c, d] of refs) { g.strokeStyle = c; g.setLineDash(d); g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); }
    for (const x of sol.cortes) { g.strokeStyle = col['--muted']; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(X(x), mt); g.lineTo(X(x), h - mb); g.stroke(); }
    g.setLineDash([6, 4]); g.strokeStyle = col['--serie-2']; g.lineWidth = 1.6;
    if (asi) { g.beginPath(); fs.forEach((fr, k) => { const y = Math.max(ymin - 50, Math.min(ymax + 50, asi[k])); k ? g.lineTo(X(fr), Y(y)) : g.moveTo(X(fr), Y(y)); }); g.stroke(); }
    g.setLineDash([]); g.strokeStyle = col['--serie-1']; g.lineWidth = 2.6;
    g.beginPath(); fs.forEach((fr, k) => (k ? g.lineTo(X(fr), Y(curva[k])) : g.moveTo(X(fr), Y(curva[k])))); g.stroke();
    if (punto) { g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(punto.x), Y(punto.y), 4.5, 0, 2 * Math.PI); g.fill(); }
    g.restore();
  }
  function dibuja() {
    if (!sol) { for (const s of ['#grafica', '#grafica-fase']) lienzo(s); return; }
    const c = sol.curva(500), asi = c.f.map(sol.asintota);
    const dmax = Math.max(...c.dB, 0), dmin = Math.min(...c.dB, -10);
    const ymax = Math.ceil((dmax + 3) / 10) * 10, ymin = Math.max(Math.floor((dmin - 3) / 10) * 10, ymax - 80, -120);
    const p = sol.punto && sol.punto.f >= sol.fmin && sol.punto.f <= sol.fmax ? sol.punto : null;
    diagrama('#grafica', c.f, c.dB, asi, ymin, ymax, ' dB', [[0, col['--line'], []], [-3, col['--muted'], [2, 4]]], p && { x: p.f, y: p.dB });
    diagrama('#grafica-fase', c.f, c.fase, null, -180, 180, '°', [[0, col['--line'], []]], p && { x: p.f, y: p.fase });
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('bode').current;
  colores(); formulario(); calcula();
  window.BodeApp = { abrirEjemplo, resultado: () => sol && { f0: sol.f0, Q: sol.Q, cortes: sol.cortes, BW: sol.BW }, estado: () => copia(sc) };
})();
