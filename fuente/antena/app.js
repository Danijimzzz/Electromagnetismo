/* =====================================================================
   Antena dipolo y radiación: interfaz. Datos, ejemplos, resultados, desarrollo
   y el diagrama de radiación polar. El cálculo está en antena/calculo.js
   (Antena) y los ayudantes comunes ($, esc, copia, txt, lienzo) en herramienta.js.
   Guarda el estado (sc) en localStorage['antena-v1'], que copia Mis ejercicios.
   Expone window.AntenaApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, lienzo } = Herramienta;
  const ARRAY_MODOS = { broadside: 'Broadside (β = 0)', endfire: 'Endfire (β = −k d)', fase: 'Fase β elegida' };
  const P = Antena, f = P.f, CLAVE = 'antena-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const TIPOS = { corto: 'Dipolo corto (Hertz)', media: 'Dipolo de media onda', general: 'Longitud cualquiera' };
  function formulario() {
    const t = sc.tipo || 'media';
    $('#campos').innerHTML = `<label for="f-tipo">Antena</label><select id="f-tipo" class="in" data-k="tipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}"${k === t ? ' selected' : ''}>${v}</option>`).join('')}</select>`
      + fila('f', 'Frecuencia', 'Hz') + (t === 'media' ? '' : fila('L', 'Longitud de la antena', 'm')) + fila('I', 'Corriente I₀ (amplitud)', 'A')
      + '<div class="sep">Array de dipolos en fila</div>' + fila('N', 'Número de elementos (1 = una antena)', '')
      + ((+String(sc.N ?? '1').replace(',', '.') || 1) > 1
        ? fila('d', 'Separación d', 'λ') + `<label for="f-modo">Alimentación</label><select id="f-modo" class="in" data-k="modo">${Object.entries(ARRAY_MODOS).map(([k, v]) => `<option value="${k}"${k === (sc.modo || 'broadside') ? ' selected' : ''}>${v}</option>`).join('')}</select>` + (sc.modo === 'fase' ? fila('beta', 'Fase progresiva β', '°') : '')
        : '')
      + '<div class="sep">Punto de observación</div>' + fila('r', 'Distancia r', 'm') + fila('th', 'Ángulo θ desde el eje', '°')
      + '<div class="sep">Enlace entre dos antenas (Friis, opcional)</div>' + fila('Pt', 'Potencia del transmisor', 'W') + fila('Gr', 'Ganancia del receptor', 'dBi') + fila('dist', 'Distancia del enlace', 'm') + fila('sens', 'Sensibilidad del receptor', 'dBm');
    $('#nota').textContent = 'Se admite coma decimal, 3e8, 3·10^8 y unidades (2,4 GHz, 30 cm, 0,5 m). En la de media onda la longitud sale de la frecuencia (L = λ/2). Deja vacía la potencia del transmisor si no quieres calcular el enlace.';
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (['tipo', 'N', 'modo'].includes(t.dataset.k)) { const pos = t.selectionStart; formulario(); const nuevo = $('#f-' + t.dataset.k); if (nuevo && nuevo.tagName === 'INPUT') { nuevo.focus(); try { nuevo.setSelectionRange(pos, pos); } catch (e) { /* sin selección */ } } else if (nuevo) nuevo.focus(); }
    calcula();
  });

  /* ---------- Ejemplos y práctica ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar, para el modo práctica
  function azar() {
    const de = (l) => l[Math.floor(Math.random() * l.length)], c = (x) => String(x).replace('.', ',');
    const tipo = de(['media', 'media', 'corto', 'general']), fr = de(['50e6', '100e6', '300e6', '900e6']), lam = 299792458 / +fr;
    const L = tipo === 'corto' ? c(+(lam / de([20, 25, 50])).toPrecision(2)) : tipo === 'general' ? c(+(lam * de([0.75, 1, 1.25, 1.5])).toPrecision(3)) : '';
    sc = { N: '1', d: '', modo: 'broadside', beta: '0', Pt: '', Gr: '', dist: '', sens: '', tipo, f: fr, L, I: c(de([0.5, 1, 2, 5])), r: String(de([100, 500, 1000, 5000])), th: String(de([30, 45, 60, 90])) };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const a = { corto: `un dipolo corto de ${esc(sc.L)} m`, media: 'un dipolo de media onda', general: `un dipolo de ${esc(sc.L)} m` }[sc.tipo];
    return `Se alimenta ${a} a ${esc(sc.f)} Hz con una corriente de amplitud I₀ = ${esc(sc.I)} A. Calcula la longitud de onda, la resistencia de radiación, la potencia radiada, la directividad y el campo eléctrico a ${esc(sc.r)} m con θ = ${esc(sc.th)}°.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#desc3d').textContent = ''; dibuja(); vista.dibuja(); return;
    }
    err.hidden = true; guarda();
    $('#resumen').innerHTML = dato('Longitud de onda', `λ = ${f(sol.lam)} m`) + (sc.tipo === 'media' ? dato('Longitud', `L = ${f(sol.L)} m`) : '')
      + dato('Resistencia de radiación', `R<sub>rad</sub> = ${f(sol.Rrad)} Ω`) + dato('Potencia radiada', `P<sub>rad</sub> = ${f(sol.Prad)} W`)
      + dato('Directividad', `D = ${f(sol.D)} (${f(sol.dBi)} dBi)`) + dato('Ancho de haz a −3 dB', `${f(sol.hpbw, 3)}°`)
      + (sol.arr ? dato(`Array de ${sol.arr.N} dipolos`, `D = ${f(sol.arr.D)} (${f(sol.arr.dBi)} dBi)`) + dato('Máximo del array', `θ = ${f(sol.arr.thMax, 4)}°, φ = ${f(sol.arr.phMax, 4)}°`) + dato('Ancho de haz plano E / H', `${f(sol.arr.cE.hpbw, 3)}° / ${sol.arr.cH.omni ? 'omni' : f(sol.arr.cH.hpbw, 3) + '°'}`) + dato('Potencia radiada del array', `${f(sol.arr.Prad)} W`) : '')
      + (sol.enlace ? dato('Pérdida en el espacio libre', `${f(sol.enlace.fspl)} dB`) + dato('Potencia recibida', `${f(sol.enlace.Pr)} W (${f(sol.enlace.PrdBm)} dBm)`) + (sol.enlace.margen === null ? '' : dato('Margen del enlace', `${f(sol.enlace.margen)} dB`) + dato('Alcance máximo', `${f(sol.enlace.alcance)} m`)) : '')
      + dato('Campo eléctrico en el punto', `E = ${f(sol.E)} V/m`) + dato('Campo magnético', `B = ${f(sol.B)} T`) + dato('Densidad de potencia', `S = ${f(sol.S)} W/m²`);
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    descripcion(); dibuja(); vista.dibuja();
  }

  /* ---------- Diagrama polar ---------- */
  let plano = 'E';
  const PLANOS = { E: 'Plano E (contiene a la antena)', H: 'Plano H (perpendicular a la antena)' };
  $('#plano').innerHTML = Object.entries(PLANOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('#plano').addEventListener('change', () => { plano = $('#plano').value; descripcion(); dibuja(); });
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  const refCorte = () => Math.max(...P.corte(sol.P, plano, 360));
  const valores = (n = 360) => { if (!sol) return []; const r = refCorte(); return P.corte(sol.P, plano, n).map((v) => (v * v) / (r * r)); };
  function descripcion() {
    if (!sol) return;
    const lob = plano === 'E' ? (sol.arr ? sol.arr.cE : P.lobulos(P.corte(sol.P, 'E'))) : (sol.arr ? sol.arr.cH : P.lobulos(P.corte(sol.P, 'H')));
    const txt3 = `Diagrama de radiación ${sol.arr ? `de un array de ${sol.arr.N} dipolos` : 'del dipolo'}: directividad ${f(sol.dBitot)} dBi, máximo en θ = ${f(sol.arr ? sol.arr.thMax : sol.thMax, 4)}°${sol.arr ? `, φ = ${f(sol.arr.phMax, 4)}°` : ''}. `;
    $('#desc3d').textContent = txt3 + (sol.arr ? '' : 'La superficie es de revolución alrededor de la antena: con forma de rosquilla, sin radiación a lo largo del eje. ') + `En el plano ${plano} ` + (lob.omni ? 'es omnidireccional.' : `hay ${lob.principales} lóbulo(s) principal(es) con ancho de haz de ${f(lob.hpbw, 3)}° a −3 dB` + (lob.secundarios ? ` y ${lob.secundarios} lóbulo(s) secundario(s), el mayor a ${f(lob.sll, 3)} dB.` : ', sin lóbulos secundarios.'));
    $('#leyenda').textContent = `Potencia relativa en el ${PLANOS[plano].toLowerCase()}, respecto al máximo de este plano. ` + (plano === 'E' ? 'Ángulo medido desde el eje de la antena (arriba); la fila del array va en horizontal. Punto: tu θ. ' : 'Ángulo φ medido desde el eje x, el de la fila del array (a la derecha); la antena es el punto central. ') + 'Círculo de trazos: antena isótropa (1/D). ' + txt3.slice(0, -1) + '.';
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 22, N = 360;
    const pt = (a, rel) => (plano === 'E' ? [cx + R * rel * Math.sin(a), cy - R * rel * Math.cos(a)] : [cx + R * rel * Math.cos(a), cy - R * rel * Math.sin(a)]);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    for (const q of [0.25, 0.5, 0.75, 1]) { g.beginPath(); g.arc(cx, cy, R * q, 0, 7); g.stroke(); }
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'bottom';
    for (const q of [0.5, 1]) g.fillText(String(q).replace('.', ','), cx + 4, cy - R * q - 2);
    g.save(); g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.beginPath(); const rIso = (1 / sol.Dtot) / ((refCorte() ** 2) / (sol.ref ** 2)); if (rIso <= 1) { g.arc(cx, cy, R * rIso, 0, 7); g.stroke(); } g.restore();
    const v = valores(N), traza = () => { g.beginPath(); v.forEach((rel, i) => { const [x, y] = pt((i / N) * 2 * Math.PI, rel); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
    g.fillStyle = col['--serie-1']; g.globalAlpha = 0.18; traza(); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = col['--serie-1']; g.lineWidth = 2.4; traza(); g.stroke();
    if (plano === 'E') {
      const mitad = Math.min(R * 0.5, (sol.L / sol.lam) * R * 0.5 + 6);
      g.strokeStyle = col['--ink']; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy - mitad); g.lineTo(cx, cy + mitad); g.stroke(); g.lineCap = 'butt';
      const th = (sol.th * Math.PI) / 180, F = P.campoRel(sol.P, th, 0), rel = (F * F) / (refCorte() ** 2), [px, py] = pt(th, rel);
      g.strokeStyle = col['--serie-2']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(...pt(th, 1)); g.stroke();
      g.fillStyle = col['--serie-2']; g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill();
    } else { g.fillStyle = col['--ink']; g.beginPath(); g.arc(cx, cy, 4.5, 0, 7); g.fill(); }
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (plano === 'E') { g.fillText('0°', cx, cy - R - 11); g.fillText('180°', cx, cy + R + 11); g.fillText('90°', cx + R + 14, cy); g.fillText('90°', cx - R - 14, cy); }
    else { g.fillText('φ = 0°', cx + R - 4, cy - 12); g.fillText('90°', cx, cy - R - 11); g.fillText('180°', cx - R - 16, cy); g.fillText('270°', cx, cy + R + 11); }
  }
  /* ---------- Vista 3D (con su descripción en texto y el corte 2D de arriba como alternativa) ---------- */
  const vista = Vista3D.monta('#vista3d', {
    yaw: 0.6, pitch: 0.5,
    escena: () => (sol ? { ejes: true, caras: P.malla3d(sol.P), etiquetas: [{ p: [0, 0, 1.12], t: 'antena' }, ...(sol.arr ? [{ p: [1.12, 0, 0], t: 'fila' }] : [])] } : {}),
    descripcion: () => ($('#desc3d').textContent || 'Diagrama de radiación en tres dimensiones'),
  });
  Herramienta.exportar('#grafica', { nombre: 'diagrama-de-radiacion', titulo: 'Diagrama de radiación', datos: () => ({ cab: [plano === 'E' ? 'θ (°) desde el eje' : 'φ (°)', 'Potencia relativa'], filas: valores(360).map((v, i) => [i, v]) }) });
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); vista.dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('antena').current;
  colores(); formulario(); calcula();
  window.AntenaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { lam: sol.lam, Rrad: sol.Rrad, Prad: sol.Prad, D: sol.D, E: sol.E }, estado: () => copia(sc), vista: () => vista.estado(), plano: (p) => { plano = p; $('#plano').value = p; descripcion(); dibuja(); } };
})();
