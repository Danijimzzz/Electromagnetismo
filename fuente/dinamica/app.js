/* =====================================================================
   Dinámica y diagramas de fuerzas: interfaz (tipo de problema, datos,
   resultado, dibujo con el diagrama de fuerzas y desarrollo).
   El cálculo está en dinamica/fisica.js (Dinamica).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const D = Dinamica, f = D.f, CLAVE = 'dinamica-v1';
  const txt = (h) => String(h).replace(/<[^>]+>/g, '');

  let sc = copia(D.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && (g.tipo === 'plano' || g.tipo === 'atwood')) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  function formulario() {
    let h = `<label for="f-tipo">Problema</label><select id="f-tipo" class="in" data-k="tipo"><option value="plano"${sc.tipo === 'plano' ? ' selected' : ''}>Bloque en un plano</option><option value="atwood"${sc.tipo === 'atwood' ? ' selected' : ''}>Máquina de Atwood</option></select>`;
    if (sc.tipo === 'atwood') {
      h += fila('m1', 'Masa 1 (izquierda)', 'kg') + fila('m2', 'Masa 2 (derecha)', 'kg') + fila('mp', 'Masa de la polea', 'kg');
      $('#nota').textContent = 'La polea se toma como un disco (I = ½mR²). Déjala vacía si no tiene masa.';
    } else {
      h += sep('Bloque y plano') + fila('m1', 'Masa del bloque', 'kg') + fila('theta', 'Ángulo del plano θ', '°') + fila('mus', 'Rozamiento estático μ<sub>e</sub>', '') + fila('muk', 'Rozamiento dinámico μ<sub>d</sub>', '');
      h += sep('Fuerza aplicada') + fila('F', 'Módulo F', 'N') + fila('alfa', 'Ángulo sobre el plano α', '°');
      h += sep('Polea') + fila('m2', 'Masa que cuelga', 'kg');
      $('#nota').textContent = 'θ = 0 es un plano horizontal. La fuerza tira plano arriba (α negativo la inclina hacia el plano). Deja vacío lo que no haya.';
    }
    h += sep('Otros') + fila('d', 'Distancia recorrida', 'm') + fila('g', 'Gravedad g', 'm/s²');
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'tipo') { const ej = D.ejemplos.find((x) => x.sc.tipo === t.value); sc = { ...copia(ej.sc), g: sc.g || ej.sc.g }; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + D.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = D.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = D.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').innerHTML = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h;
    if (sol.tipo === 'atwood') {
      h = dato('Aceleración', `a = <b>${f(sol.a)} m/s<sup>2</sup></b>`) + dato(sol.mp ? 'Tensiones' : 'Tensión', sol.mp ? `T<sub>1</sub> = ${f(sol.T1)} N, T<sub>2</sub> = ${f(sol.T2)} N` : `T = <b>${f(sol.T1)} N</b>`);
    } else {
      const mov = sol.estado === 'reposo' ? 'En reposo' : `Desliza ${sol.sentido > 0 ? (sol.th > 0 ? 'plano arriba' : 'a la derecha') : (sol.th > 0 ? 'plano abajo' : 'a la izquierda')}`;
      h = dato('Qué pasa', `<b>${mov}</b>`) + dato('Aceleración', `a = <b>${f(Math.abs(sol.a))} m/s<sup>2</sup></b>`) + dato('Normal', `N = ${f(sol.N)} N`) + dato('Rozamiento', `F<sub>r</sub> = ${f(Math.abs(sol.Fr))} N${sol.estado === 'reposo' ? ' (estático)' : ''}`) + (sol.m2 ? dato('Tensión', `T = <b>${f(sol.T)} N</b>`) : '');
    }
    if (sol.cin) h += dato(`Al recorrer ${f(sol.d)} m`, `v = ${f(sol.cin.v)} m/s, t = ${f(sol.cin.t)} s`);
    $('#res').innerHTML = h;
    $('#leyenda').innerHTML = 'Las flechas son proporcionales a cada fuerza: <b style="color:var(--peso)">peso</b>, <b style="color:var(--normal)">normal</b>, <b style="color:var(--roz)">rozamiento</b>, <b style="color:var(--fuerza)">fuerza aplicada</b> y <b style="color:var(--tension)">tensión</b>. La flecha discontinua es la aceleración.';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--fuerza', '--tension', '--cuerpo', '--suelo']) col[k] = cs.getPropertyValue(k).trim(); }
  const COLOR = { P: '--peso', P2: '--peso', N: '--normal', Fr: '--roz', F: '--fuerza', T: '--tension', T1: '--tension', T2: '--tension' };
  function flecha(g, x0, y0, x1, y1, color, ancho = 2.5, punteada = false) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 2) return;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho; g.setLineDash(punteada ? [5, 4] : []);
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(11, L * 0.45);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - p * 0.6 * Math.cos(a), y1 - p * 0.6 * Math.sin(a)); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  }
  function etiqueta(g, x, y, t, color) {
    g.font = '600 12.5px "IBM Plex Sans", system-ui, sans-serif';
    const w = g.measureText(t).width;
    g.fillStyle = col['--bg']; g.globalAlpha = 0.85; g.fillRect(x - w / 2 - 2, y - 8, w + 4, 16); g.globalAlpha = 1;
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y);
  }
  // flecha de una fuerza desde (x, y) en la dirección (dx, dy) de pantalla, con la etiqueta pasada la punta
  function fuerza(g, x, y, dx, dy, k, nombre) {
    flecha(g, x, y, x + dx, y + dy, col[COLOR[k] || '--ink']);
    const L = Math.hypot(dx, dy) || 1;
    etiqueta(g, x + dx + (dx / L) * 13, y + dy + (dy / L) * 13, nombre, col[COLOR[k] || '--ink']);
  }
  // con esquina, el nombre va arriba a la izquierda, donde no llega ninguna flecha de las que salen del centro
  function cuerpo(g, cx, cy, s, ang, texto, esquina = false) {
    g.save(); g.translate(cx, cy); g.rotate(-ang);
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.2;
    g.fillRect(-s / 2, -s / 2, s, s); g.strokeRect(-s / 2, -s / 2, s, s);
    g.fillStyle = col['--ink']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    if (esquina) { g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(texto, -s / 2 + 4, -s / 2 + 3); }
    else { g.rotate(ang); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, 0, 0); }
    g.restore();
  }
  function lienzo() {
    const r = Herramienta.lienzo('#escena');
    r.g.lineCap = 'round'; r.g.lineJoin = 'round';
    return r;
  }

  function dibujaPlano(g, w, h) {
    const t = sol.th * Math.PI / 180, m = 20, pol = !!sol.m2;
    const s = Math.max(44, Math.min(68, w / 9)), r = 11;
    const anchoMax = (pol ? w * 0.7 : w - 2 * m) - m, altoMax = h - 2 * m - 30;
    const L = Math.min(anchoMax / Math.max(Math.cos(t), 1e-6), t > 1e-6 ? altoMax / Math.sin(t) : Infinity);
    // en horizontal se sube la superficie para que quepa el peso (y, con polea, es una mesa)
    const horiz = t < 1e-6, suelo = h - m, y0 = horiz ? h * (pol ? 0.46 : 0.6) : suelo;
    const x0 = m, xe = x0 + L * Math.cos(t), ye = y0 - L * Math.sin(t);
    const ux = [Math.cos(t), -Math.sin(t)], uy = [-Math.sin(t), -Math.cos(t)];
    g.fillStyle = col['--line']; g.strokeStyle = col['--suelo']; g.lineWidth = 1.5;
    if (!horiz) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(xe, ye); g.lineTo(xe, y0); g.closePath(); g.fill(); g.stroke(); }
    else if (pol) { g.fillRect(x0, y0, xe - x0, 8); g.strokeRect(x0, y0, xe - x0, 8); g.beginPath(); g.moveTo(x0 + 14, y0 + 8); g.lineTo(x0 + 14, suelo); g.moveTo(xe - 14, y0 + 8); g.lineTo(xe - 14, suelo); g.stroke(); }
    else { g.beginPath(); g.moveTo(0, y0); g.lineTo(w, y0); g.stroke(); }
    g.beginPath(); g.moveTo(0, suelo); g.lineTo(w, suelo); if (!horiz || pol) g.stroke();
    if (t > 1e-6) { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.arc(x0, y0, 34, -t, 0); g.stroke(); g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`θ = ${txt(f(sol.th))}°`, x0 + 40, y0 - 10); }
    // bloque en el centro del plano
    const xb = x0 + (L * 0.5) * ux[0] + (s / 2) * uy[0], yb = y0 + (L * 0.5) * ux[1] + (s / 2) * uy[1];
    // escala de las fuerzas: la mayor mide unos 0,3 del alto
    const mods = sol.fuerzas.map((q) => q.mod).concat(sol.m2 ? [sol.m2 * sol.g] : []), k = (Math.min(h, w) * 0.26) / Math.max(...mods, 1e-9);
    const pant = (fx, fy) => [k * (fx * ux[0] + fy * uy[0]), k * (fx * ux[1] + fy * uy[1])];
    // polea y masa colgando
    let xh, yh;
    if (pol) {
      const cxp = xe + (s / 2 - r) * uy[0] + r * ux[0] * 0, cyp = ye + (s / 2 - r) * uy[1];
      g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(xe, ye); g.lineTo(cxp, cyp); g.stroke();
      g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
      // cuerda: del bloque a la polea y de la polea abajo
      const tx = cxp + r * uy[0], ty = cyp + r * uy[1];
      g.beginPath(); g.moveTo(xb + (s / 2) * ux[0], yb + (s / 2) * ux[1]); g.lineTo(tx, ty); g.stroke();
      xh = cxp + r; yh = Math.min(suelo - s / 2 - 6, cyp + Math.max(70, (suelo - cyp) * 0.5));
      g.beginPath(); g.moveTo(xh, cyp); g.lineTo(xh, yh - s / 2); g.stroke();
      g.fillStyle = col['--panel'] || col['--bg']; g.beginPath(); g.arc(cxp, cyp, r, 0, 2 * Math.PI); g.fillStyle = col['--cuerpo']; g.fill(); g.strokeStyle = col['--muted']; g.stroke();
      cuerpo(g, xh, yh, s * 0.85, 0, 'm₂', true);
    }
    cuerpo(g, xb, yb, s, t, 'm₁', true);
    // fuerzas sobre el bloque: el peso desde el centro; la normal y el rozamiento desde la cara de contacto
    for (const q of sol.fuerzas) {
      const [dx, dy] = pant(q.x, q.y);
      let ox = xb, oy = yb;
      if (q.k === 'Fr') { ox = xb - (s / 2) * uy[0]; oy = yb - (s / 2) * uy[1]; }
      fuerza(g, ox, oy, dx, dy, q.k, q.k === 'Fr' ? 'Fr' : q.k);
    }
    if (pol) { fuerza(g, xh, yh, 0, k * sol.m2 * sol.g, 'P2', 'P₂'); fuerza(g, xh, yh - s * 0.42, 0, -k * sol.T, 'T', 'T'); }
    // aceleración
    if (Math.abs(sol.a) > 1e-9) {
      // a un lado de la normal, empezando junto a ella, para no cruzarla
      const la = 46 * Math.sign(sol.a), d0 = la / 2 + 6 * Math.sign(la), ax = xb + (s * 0.9) * uy[0] + d0 * ux[0], ay = yb + (s * 0.9) * uy[1] + d0 * ux[1];
      flecha(g, ax - (la / 2) * ux[0], ay - (la / 2) * ux[1], ax + (la / 2) * ux[0], ay + (la / 2) * ux[1], col['--ink'], 1.5, true);
      etiqueta(g, ax + (la / 2 + 12 * Math.sign(la)) * ux[0], ay + (la / 2 + 12 * Math.sign(la)) * ux[1], 'a', col['--ink']);
    }
  }

  function dibujaAtwood(g, w, h) {
    const cx = w / 2, cy = 34, R = Math.max(18, Math.min(30, w / 18)), s = Math.max(34, Math.min(52, w / 12));
    const y1 = h * 0.5 + (sol.m1 >= sol.m2 ? 20 : -20), y2 = h * 0.5 + (sol.m2 > sol.m1 ? 20 : -20);
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 60, 6); g.lineTo(cx + 60, 6); g.moveTo(cx, 6); g.lineTo(cx, cy); g.stroke();
    g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - R, y1 - s / 2); g.moveTo(cx + R, cy); g.lineTo(cx + R, y2 - s / 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.fillStyle = col['--cuerpo']; g.fill(); g.strokeStyle = col['--muted']; g.stroke();
    if (sol.mp) { g.fillStyle = col['--muted']; g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`m_p = ${txt(f(sol.mp))} kg`.replace('_', ''), cx + R + 8, cy); }
    cuerpo(g, cx - R, y1, s, 0, 'm₁'); cuerpo(g, cx + R, y2, s, 0, 'm₂');
    const k = (h * 0.26) / Math.max(sol.m1 * sol.g, sol.m2 * sol.g, sol.T1, sol.T2);
    const ox = s * 0.85;
    fuerza(g, cx - R - ox, y1, 0, k * sol.m1 * sol.g, 'P', 'P₁'); fuerza(g, cx - R - ox, y1, 0, -k * sol.T1, 'T', 'T₁');
    fuerza(g, cx + R + ox, y2, 0, k * sol.m2 * sol.g, 'P', 'P₂'); fuerza(g, cx + R + ox, y2, 0, -k * sol.T2, 'T', 'T₂');
    if (Math.abs(sol.a) > 1e-9) {
      const la = 40 * Math.sign(sol.a);
      flecha(g, cx - R - s, y1 + la / 2, cx - R - s, y1 - la / 2, col['--ink'], 1.5, true);
      flecha(g, cx + R + s, y2 - la / 2, cx + R + s, y2 + la / 2, col['--ink'], 1.5, true);
    }
  }

  function dibuja() {
    const { g, w, h } = lienzo();
    if (!sol) return;
    colores();
    if (sol.tipo === 'atwood') dibujaAtwood(g, w, h); else dibujaPlano(g, w, h);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('dinamica').current;
  formulario(); calcula();
  window.DinamicaApp = { abrirEjemplo, resultado: () => sol && { tipo: sol.tipo, a: sol.a, N: sol.N, T: sol.T ?? sol.T1, estado: sol.estado }, estado: () => copia(sc) };
})();
