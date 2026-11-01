/* =====================================================================
   Antena dipolo y radiación: interfaz. Datos, ejemplos, resultados, desarrollo
   y el diagrama de radiación polar. El cálculo está en antena/calculo.js
   (Antena) y los ayudantes comunes ($, esc, copia, txt, lienzo) en herramienta.js.
   Guarda el estado (sc) en localStorage['antena-v1'], que copia Mis ejercicios.
   Expone window.AntenaApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, lienzo } = Herramienta;
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
      + '<div class="sep">Punto de observación</div>' + fila('r', 'Distancia r', 'm') + fila('th', 'Ángulo θ desde el eje', '°');
    $('#nota').textContent = 'Se admite coma decimal, 3e8 y 3·10^8. En la de media onda la longitud sale de la frecuencia (L = λ/2).';
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.dataset.k === 'tipo') formulario();
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
    sc = { tipo, f: fr, L, I: c(de([0.5, 1, 2, 5])), r: String(de([100, 500, 1000, 5000])), th: String(de([30, 45, 60, 90])) };
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
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    $('#resumen').innerHTML = dato('Longitud de onda', `λ = ${f(sol.lam)} m`) + (sc.tipo === 'media' ? dato('Longitud', `L = ${f(sol.L)} m`) : '')
      + dato('Resistencia de radiación', `R<sub>rad</sub> = ${f(sol.Rrad)} Ω`) + dato('Potencia radiada', `P<sub>rad</sub> = ${f(sol.Prad)} W`)
      + dato('Directividad', `D = ${f(sol.D)} (${f(sol.dBi)} dBi)`) + dato('Ancho de haz a −3 dB', `${f(sol.hpbw, 3)}°`)
      + dato('Campo eléctrico en el punto', `E = ${f(sol.E)} V/m`) + dato('Campo magnético', `B = ${f(sol.B)} T`) + dato('Densidad de potencia', `S = ${f(sol.S)} W/m²`);
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Potencia relativa F(θ)²/F²máx en un plano que contiene a la antena (vertical). Punto: tu θ. Círculo de trazos: antena isótropa (1/D).';
    dibuja();
  }

  /* ---------- Diagrama polar ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 22;
    const pt = (th, rel) => [cx + R * rel * Math.sin(th), cy - R * rel * Math.cos(th)];
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    for (const q of [0.25, 0.5, 0.75, 1]) { g.beginPath(); g.arc(cx, cy, R * q, 0, 7); g.stroke(); }
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'bottom';
    for (const q of [0.5, 1]) g.fillText(String(q).replace('.', ','), cx + 4, cy - R * q - 2);
    // antena isótropa (1/D)
    g.save(); g.setLineDash([5, 4]); g.strokeStyle = col['--muted'];     g.beginPath(); g.arc(cx, cy, R / sol.D, 0, 7); g.stroke(); g.restore();
    // diagrama (simétrico a ambos lados del eje)
    const traza = (signo) => { g.beginPath(); for (let i = 0; i <= 360; i++) { const th = (i / 360) * Math.PI, F = P.patron(sol.tipo, sol.lam, sol.L, th), rel = (F * F) / (sol.Fmax * sol.Fmax), [x, y] = pt(th, rel); const X = cx + signo * (x - cx); i ? g.lineTo(X, y) : g.moveTo(X, y); } };
    g.fillStyle = col['--serie-1']; g.globalAlpha = 0.18; traza(1); g.fill(); traza(-1); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = col['--serie-1']; g.lineWidth = 2.4; traza(1); g.stroke(); traza(-1); g.stroke();
    // la antena
    const mitad = Math.min(R * 0.5, (sol.L / sol.lam) * R * 0.5 + 6);
    g.strokeStyle = col['--ink']; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx, cy - mitad); g.lineTo(cx, cy + mitad); g.stroke(); g.lineCap = 'butt';
    // el punto de observación
    const th = (sol.th * Math.PI) / 180, rel = (sol.Fp * sol.Fp) / (sol.Fmax * sol.Fmax), [px, py] = pt(th, rel);
    g.strokeStyle = col['--serie-2']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(...pt(th, 1)); g.stroke();
    g.fillStyle = col['--serie-2']; g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill();
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('0°', cx, cy - R - 11); g.fillText('180°', cx, cy + R + 11); g.fillText('90°', cx + R + 14, cy); g.fillText('90°', cx - R - 14, cy);
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('antena').current;
  colores(); formulario(); calcula();
  window.AntenaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { lam: sol.lam, Rrad: sol.Rrad, Prad: sol.Prad, D: sol.D, E: sol.E }, estado: () => copia(sc) };
})();
