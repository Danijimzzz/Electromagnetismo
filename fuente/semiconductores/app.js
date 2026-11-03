/* =====================================================================
   Semiconductores: punto de trabajo y recta de carga · interfaz: elige
   diodo, BJT o MOSFET, escribe el circuito y obtén la región de trabajo, las
   tensiones y corrientes, la gráfica con las curvas del dispositivo, la recta
   de carga y el punto Q, y el desarrollo. El cálculo está en
   semiconductores/calculo.js (Semiconductores). Guarda el estado (sc) en
   localStorage['semiconductores-v1'] (lo que copia Mis ejercicios).
   Expone window.SemiconductoresApp.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const S = Semiconductores, f = S.f, CLAVE = 'semiconductores-v1';

  let sc = copia(S.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && S.MODOS[g.modo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const NOMBRE = { Vs: 'Tensión de la fuente V_S', R: 'Resistencia R', Is: 'Corriente de saturación I_S', n: 'Factor de idealidad n', Vcc: 'Alimentación V_CC', RB: 'Resistencia de base R_B', R1: 'Resistencia R₁', R2: 'Resistencia R₂', RC: 'Resistencia de colector R_C', RE: 'Resistencia de emisor R_E', beta: 'Ganancia β', VBE: 'Tensión V_BE', VCEsat: 'Tensión V_CE,sat', Vdd: 'Alimentación V_DD', RD: 'Resistencia de drenador R_D', RS: 'Resistencia de fuente R_S', K: 'Transconductancia K', Vt: 'Tensión umbral V_t' };
  const CAMPOS_MODO = { diodo: ['Vs', 'R', 'Is', 'n'], mosfet: ['Vdd', 'R1', 'R2', 'RD', 'RS', 'K', 'Vt'] };
  const campos = () => (sc.modo === 'bjt' ? ['Vcc', ...(sc.conf === 'divisor' ? ['R1', 'R2'] : ['RB']), 'RC', 'RE', 'beta', 'VBE', 'VCEsat'] : CAMPOS_MODO[sc.modo]);
  const fila = (k) => { const u = S.CAMPOS[k][2]; return `<label for="f-${k}">${NOMBRE[k].replace(/_([A-Za-z,]+)/g, '<sub>$1</sub>')}${u ? ` <small>(${u})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`; };
  function formulario() {
    let h = `<label for="f-modo">Dispositivo</label><select id="f-modo" class="in" data-k="modo">${Object.entries(S.MODOS).map(([k, n]) => `<option value="${k}"${sc.modo === k ? ' selected' : ''}>${n}</option>`).join('')}</select>`;
    if (sc.modo === 'bjt') h += `<label for="f-conf">Polarización</label><select id="f-conf" class="in" data-k="conf"><option value="fija"${sc.conf !== 'divisor' ? ' selected' : ''}>Fija (R_B a V_CC)</option><option value="divisor"${sc.conf === 'divisor' ? ' selected' : ''}>Divisor de tensión</option></select>`;
    $('#campos').innerHTML = h + campos().map(fila).join('');
    $('#nota').textContent = 'Resistencias en Ω, con prefijo y unidad si quieres (4k7, 1M, 100n). ' + (sc.modo === 'diodo' ? 'La corriente de saturación va en pA (o con unidad: 1e-18A).' : sc.modo === 'mosfet' ? 'K en mA/V²: en saturación, ID = ½·K·(VGS − Vt)².' : 'β no lleva unidad; VBE y VCE,sat van en voltios.');
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.dataset.k === 'modo') { const base = S.ejemplos.find((x) => x.sc.modo === sc.modo); sc = copia(base.sc); formulario(); }
    else if (t.dataset.k === 'conf') { const e2 = S.ejemplos.find((x) => x.sc.conf === sc.conf); for (const k of ['R1', 'R2', 'RB']) if (e2.sc[k] !== undefined && vacioSc(k)) sc[k] = e2.sc[k]; formulario(); }
    calcula();
  });
  const vacioSc = (k) => sc[k] === undefined || String(sc[k]).trim() === '';

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + S.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = S.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const mA = (i) => `${f(i * 1000)} mA`;
  function calcula() {
    const err = $('#error');
    try { sol = S.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = dato('Región de trabajo', sol.region);
    if (sol.modo === 'diodo') h += dato('Tensión del diodo V<sub>D</sub>', `${f(sol.Vd)} V`) + dato('Corriente I<sub>D</sub>', mA(sol.Id)) + dato('Con tensión constante 0,7 V', mA(sol.Icte)) + dato('Con diodo ideal', mA(sol.Iideal));
    else if (sol.modo === 'bjt') h += dato('Punto Q: V<sub>CE</sub>', `${f(sol.VCE)} V`) + dato('I<sub>C</sub>', mA(sol.IC)) + dato('I<sub>B</sub>', `${f(sol.IB * 1e6)} µA`) + dato('I<sub>E</sub>', mA(sol.IE)) + dato('Potencia en el transistor', `${f(sol.pot * 1000)} mW`) + dato('Recta: I<sub>C</sub> máxima', mA(sol.ICmax));
    else h += dato('Punto Q: V<sub>DS</sub>', `${f(sol.VDS)} V`) + dato('I<sub>D</sub>', mA(sol.ID)) + dato('V<sub>GS</sub>', `${f(sol.VGS)} V`) + dato('Potencia en el transistor', `${f(sol.pot * 1000)} mW`) + dato('Recta: I<sub>D</sub> máxima', mA(sol.IDmax));
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Línea fina: curvas del dispositivo. Línea discontinua: recta de carga. Punto: punto de trabajo Q.';
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--serie-3']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const G = sol.graf, ml = 58, mr = 16, mt = 12, mb = 34;
    const xa = Math.min(0, G.xmax), xb = Math.max(0, G.xmax), ya = Math.min(0, G.ymax * 1.08), yb = Math.max(0, G.ymax * 1.08);
    const un = Math.max(Math.abs(ya), Math.abs(yb)) < 1 ? 1000 : 1, uI = un === 1000 ? 'mA' : 'A';
    const X = (v) => ml + ((v - xa) / (xb - xa)) * (w - ml - mr), Y = (v) => mt + (1 - (v * un - ya * un) / ((yb - ya) * un)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.fillStyle = col['--muted']; g.strokeStyle = col['--line'];
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(ya * un, yb * un, 5)) { const y = Y(v / un); g.beginPath(); g.moveTo(ml, y); g.lineTo(w - mr, y); g.stroke(); g.fillText(txt(String(+v.toPrecision(4))).replace('-', '−') + '', ml - 6, y); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(xa, xb, 6)) { const x = X(v); g.beginPath(); g.moveTo(x, mt); g.lineTo(x, h - mb); g.stroke(); g.fillText(String(+v.toPrecision(4)).replace('.', ',').replace('-', '−'), x, h - mb + 6); }
    g.fillStyle = col['--ink']; g.textAlign = 'right'; g.fillText(`${G.xl.replace(/_/, '')} (V)`, w - mr, h - mb + 20);
    g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText(`${G.yl.replace(/_/, '')} (${uI})`, w - mr - 4, mt + 2);
    g.save(); g.beginPath(); g.rect(ml, mt, w - ml - mr, h - mt - mb); g.clip();
    g.lineWidth = 1.6;
    for (const c of G.curvas) {
      g.strokeStyle = c.fuerte ? col['--serie-1'] : col['--serie-3']; g.lineWidth = c.fuerte ? 2.8 : 1.4;
      g.beginPath(); c.pts.forEach(([x, y], k) => (k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke();
    }
    g.setLineDash([7, 5]); g.strokeStyle = col['--serie-2']; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(X(G.recta[0][0]), Y(G.recta[0][1])); g.lineTo(X(G.recta[1][0]), Y(G.recta[1][1])); g.stroke();
    g.setLineDash([2, 4]); g.strokeStyle = col['--muted']; g.lineWidth = 1;
    g.beginPath(); g.moveTo(X(G.Q.x), Y(0)); g.lineTo(X(G.Q.x), Y(G.Q.y)); g.lineTo(X(0), Y(G.Q.y)); g.stroke();
    g.setLineDash([]); g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(G.Q.x), Y(G.Q.y), 5.5, 0, 2 * Math.PI); g.fill();
    g.restore();
    g.fillStyle = col['--ink']; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText('Q', Math.min(X(G.Q.x) + 9, w - mr - 12), Math.max(Y(G.Q.y) - 6, mt + 14));
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('semiconductores').current;
  colores(); formulario(); calcula();
  window.SemiconductoresApp = { abrirEjemplo, resultado: () => sol && { region: sol.region, Q: sol.Q }, estado: () => copia(sc) };
})();
