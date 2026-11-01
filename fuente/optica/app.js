/* =====================================================================
   Interfaz de Óptica geométrica: tipo de lente o espejo, distancia focal, objeto,
   resultados, desarrollo y el diagrama de rayos en <canvas>. El cálculo está en
   optica/calculo.js (Optica) y los ayudantes comunes en herramienta.js.
   Guarda el estado (sc) en localStorage['optica-v1']; expone window.OpticaApp para
   el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, lienzo } = Herramienta;
  const P = Optica, f = P.f, CLAVE = 'optica-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  function formulario() {
    $('#campos').innerHTML = `<label for="f-tipo">Elemento</label><select id="f-tipo" class="in" data-k="tipo">${P.TIPOS.map((t) => `<option value="${t.clave}"${t.clave === sc.tipo ? ' selected' : ''}>${t.nombre}</option>`).join('')}</select>`
      + fila('f', 'Distancia focal (valor absoluto)', 'cm') + '<div class="sep">Objeto</div>' + fila('s', 'Distancia al elemento', 'cm') + fila('h', 'Altura', 'cm');
    $('#nota').textContent = 'El signo de f lo decide el elemento. Objeto real delante (distancia positiva). Se admite coma decimal y 3e8.';
  }
  const cambia = (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', cambia);
  $('#campos').addEventListener('change', cambia);

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v, c = '') => `<div${c ? ` class="${c}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const nat = sol.enfoque ? 'En el infinito (los rayos salen paralelos)'
      : `${sol.real ? 'Real' : 'Virtual'}, ${sol.derecha ? 'derecha' : 'invertida'}, ${sol.tam === 'igual' ? 'del mismo tamaño' : `${sol.tam} que el objeto`}`;
    $('#resumen').innerHTML = (sol.enfoque ? dato('Distancia de la imagen', 'No hay imagen (s′ → ∞)')
      : dato('Distancia de la imagen', `s′ = ${f(sol.sp)} cm`) + dato('Aumento', `m = ${f(sol.m)}`) + dato('Altura de la imagen', `h′ = ${f(sol.hp)} cm`))
      + dato('Naturaleza', nat, 'ancho')
      + (sol.lente ? dato('Potencia', `P = ${f(sol.potencia)} D`) : dato('Radio de curvatura', `R = ${f(sol.radio)} cm`));
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').innerHTML = 'Rayos: <b>paralelo al eje</b> (pasa por el foco), <b>por el centro</b>' + (sol.enfoque ? '' : ' y <b>por el foco</b>') + '. Línea discontinua: prolongación virtual. Las alturas no van a escala con las distancias.';
    dibuja();
  }

  /* ---------- Diagrama de rayos ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--rayo-1', '--rayo-2', '--rayo-3', '--imagen']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h: H } = lienzo('#grafica');
    if (!sol || !w || !H) return;
    const dir = sol.lente ? 1 : -1, fs = sol.fs, s = sol.s, ah = sol.h;
    const lejos = !sol.enfoque && Math.abs(sol.sp) > 4 * Math.max(s, Math.abs(fs));
    const xi = sol.enfoque || lejos ? null : dir * sol.sp;
    const dist = Math.max(s, Math.abs(fs));
    let xmin = -dist * 1.3, xmax = dist * 1.3;
    if (xi !== null) { xmin = Math.min(xmin, xi * 1.2); xmax = Math.max(xmax, xi * 1.2); }
    xmin = Math.min(xmin, -s * 1.15, -2 * Math.abs(fs) * (sol.lente ? 1 : 1.1)); xmax = Math.max(xmax, 0.35 * -xmin);
    const hi = xi === null ? 0 : Math.abs(sol.hp);
    const ymax = Math.max(Math.abs(ah), hi) * 1.45;
    const ml = 14, mr = 14, mt = 14, mb = 22;
    const X = (x) => ml + ((x - xmin) / (xmax - xmin)) * (w - ml - mr), Y = (y) => mt + (1 - (y + ymax) / (2 * ymax)) * (H - mt - mb);
    const y0 = Y(0), xe = X(0);
    g.font = '12px system-ui, sans-serif'; g.lineCap = 'round'; g.lineJoin = 'round';
    // eje óptico
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([2, 4]);
    g.beginPath(); g.moveTo(ml, y0); g.lineTo(w - mr, y0); g.stroke(); g.setLineDash([]);
    // lente o espejo
    const hv = (H - mt - mb) / 2;
    g.strokeStyle = col['--accent']; g.fillStyle = col['--accent']; g.lineWidth = 2.6;
    if (sol.lente) {
      g.beginPath(); g.moveTo(xe, y0 - hv); g.lineTo(xe, y0 + hv); g.stroke();
      const a = sol.fs > 0 ? 1 : -1, pt = (yy, d) => { g.beginPath(); g.moveTo(xe - 7, yy + d * 9 * a); g.lineTo(xe, yy); g.lineTo(xe + 7, yy + d * 9 * a); g.stroke(); };
      g.lineWidth = 2.2; pt(y0 - hv, 1); pt(y0 + hv, -1);
    } else {
      const bomba = (sol.fs > 0 ? -1 : 1) * 12; // el cóncavo se abre hacia el objeto (izquierda)
      g.beginPath(); g.moveTo(xe + bomba, y0 - hv); g.quadraticCurveTo(xe - bomba, y0, xe + bomba, y0 + hv); g.stroke();
      g.lineWidth = 1.2;
      for (let k = -8; k <= 8; k++) { const yy = y0 + (k / 8) * hv, u = (yy - y0) / hv, xx = xe + bomba * u * u; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 7, yy + 6); g.stroke(); }
    }
    // focos y centro
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    const marca = (x, t) => { if (x < xmin || x > xmax) return; g.beginPath(); g.arc(X(x), y0, 2.6, 0, 7); g.fill(); g.fillText(t, X(x), y0 + 6); };
    if (sol.lente) { marca(-fs, 'F'); marca(fs, "F′"); marca(-2 * fs, '2F'); marca(2 * fs, "2F′"); } else { marca(dir * fs, 'F'); marca(dir * 2 * fs, 'C'); }
    // rayos
    const lim = (x) => (dir > 0 ? xmax : xmin); // borde del dibujo hacia donde sale la luz
    const tramo = (xa, ya, xb, yb, c, disc) => { g.strokeStyle = c; g.setLineDash(disc ? [6, 5] : []); g.lineWidth = disc ? 1.5 : 2; g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xb), Y(yb)); g.stroke(); g.setLineDash([]); };
    const flecha = (x, y, c, up) => { const px = X(x), py = Y(y), s2 = up ? 1 : -1; g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 2.6; g.beginPath(); g.moveTo(px, Y(0)); g.lineTo(px, py); g.stroke(); g.beginPath(); g.moveTo(px, py); g.lineTo(px - 5, py + 9 * s2); g.lineTo(px + 5, py + 9 * s2); g.closePath(); g.fill(); };
    // rayo: desde la punta del objeto hasta el elemento (en yEl) y luego con pendiente (dx, dy) hacia donde sale
    const rayo = (yEl, dx, dy, c) => {
      tramo(-s, ah, 0, yEl, c, false);
      const t = (lim(0) - 0) / dx, yf = yEl + dy * t;
      tramo(0, yEl, lim(0), yf, c, false);
      if (!sol.enfoque && !sol.real) { // prolongación hacia atrás hasta la imagen virtual
        const xv = -dir * Math.abs(sol.sp); tramo(0, yEl, xv < xmin ? xmin : xv, yEl + dy * ((xv < xmin ? xmin : xv) / dx), c, true);
      }
    };
    // 1: paralelo, sale pasando por (o viniendo de) el foco
    {
      const fo = dir * fs, sg = fs > 0 ? 1 : -1, dx = (fo - 0) * sg, dy = (0 - ah) * sg;
      rayo(ah, dx, dy, col['--rayo-1']);
    }
    // 2: por el centro del elemento
    rayo(0, dir * s, -ah, col['--rayo-2']);
    // 3: dirigido al foco del lado del objeto, sale paralelo
    if (!sol.enfoque) {
      const y3 = -ah * fs / (s - fs);
      if (Math.abs(y3) <= ymax * 0.98) {
        tramo(-s, ah, 0, y3, col['--rayo-3'], false); tramo(0, y3, lim(0), y3, col['--rayo-3'], false);
        if (!sol.real) { const xv = -dir * Math.abs(sol.sp); tramo(0, y3, Math.max(xv, xmin), y3, col['--rayo-3'], true); }
      }
    }
    // objeto e imagen
    flecha(-s, ah, col['--ink'], ah > 0);
    g.fillStyle = col['--ink']; g.textBaseline = 'top'; g.textAlign = 'center'; g.fillText('Objeto', X(-s), y0 + 6);
    if (xi !== null) {
      const c = col['--imagen'];
      if (!sol.real) { g.save(); g.setLineDash([5, 4]); g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); g.moveTo(X(xi), y0); g.lineTo(X(xi), Y(sol.hp)); g.stroke(); g.restore(); const px = X(xi), py = Y(sol.hp), s2 = sol.hp > 0 ? 1 : -1; g.fillStyle = c; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 5, py + 9 * s2); g.lineTo(px + 5, py + 9 * s2); g.closePath(); g.fill(); }
      else flecha(xi, sol.hp, c, sol.hp > 0);
      g.fillStyle = c; g.textAlign = xi > xmin + (xmax - xmin) * 0.8 ? 'right' : 'left'; g.textBaseline = 'middle'; g.fillText(sol.real ? 'Imagen real' : 'Imagen virtual', X(xi) + (g.textAlign === 'left' ? 9 : -9), (y0 + Y(sol.hp)) / 2);
    } else if (!sol.enfoque) {
      g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText('La imagen cae fuera del dibujo', w - mr, mt);
    }
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('optica').current;
  colores(); formulario(); calcula();
  window.OpticaApp = { abrirEjemplo, resultado: () => sol && { sp: sol.sp, m: sol.m, hp: sol.hp }, estado: () => copia(sc) };
})();
