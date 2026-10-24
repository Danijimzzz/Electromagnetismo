/* =====================================================================
   Circuitos de corriente continua: interfaz (lista de elementos, carga
   para Thévenin, resultado, esquema con potenciales y corrientes, y
   desarrollo). El cálculo está en circuitos/fisica.js (Continua).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const C = Continua, f = C.f, CLAVE = 'circuitos-v1', MAX = 14;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<[^>]+>/g, '');

  let sc = copia(C.ejemplos[1].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && Array.isArray(g.elementos) && g.elementos.length) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Lista de elementos ---------- */
  function lista() {
    const nom = C.nombres(sc.elementos);
    $('#lista').innerHTML = '<span class="cab">Elemento</span><span class="cab">Nudo A</span><span class="cab">Nudo B</span><span class="cab">Valor</span><span></span>' + sc.elementos.map((e, i) => {
      const T = C.TIPOS[e.t];
      return `<b title="${T.nombre}">${nom[i].replace(/(\d+)/, '<sub>$1</sub>')}</b><input class="in" data-i="${i}" data-k="a" value="${esc(e.a)}" aria-label="${nom[i]}: nudo A" autocomplete="off" spellcheck="false"><input class="in" data-i="${i}" data-k="b" value="${esc(e.b)}" aria-label="${nom[i]}: nudo B" autocomplete="off" spellcheck="false"><span style="display:flex;gap:4px;align-items:center"><input class="in" data-i="${i}" data-k="v" value="${esc(e.v)}" inputmode="decimal" aria-label="${nom[i]}: valor en ${T.un}" autocomplete="off"><small>${T.un}</small></span><button class="x" type="button" data-quita="${i}" aria-label="Quitar ${nom[i]}">×</button>`;
    }).join('');
    const sel = $('#carga');
    sel.innerHTML = '<option value="">(ninguna)</option>' + sc.elementos.map((e, i) => (e.t === 'R' ? `<option value="${i}"${String(sc.carga) === String(i) ? ' selected' : ''}>${nom[i]}</option>` : '')).join('');
    if (sc.carga !== '' && !(sc.elementos[+sc.carga] && sc.elementos[+sc.carga].t === 'R')) sc.carga = '';
    for (const b of document.querySelectorAll('[data-add]')) b.disabled = sc.elementos.length >= MAX;
  }
  $('#lista').addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; sc.elementos[+t.dataset.i][t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#lista').addEventListener('click', (e) => {
    const q = e.target.dataset.quita;
    if (q === undefined) return;
    const i = +q;
    sc.elementos.splice(i, 1);
    if (sc.carga !== '') { if (+sc.carga === i) sc.carga = ''; else if (+sc.carga > i) sc.carga = String(+sc.carga - 1); }
    $('#ejemplos').value = ''; lista(); calcula();
  });
  for (const b of document.querySelectorAll('[data-add]')) b.addEventListener('click', () => {
    if (sc.elementos.length >= MAX) return;
    const t = b.dataset.add, ult = sc.elementos[sc.elementos.length - 1];
    sc.elementos.push({ t, a: ult ? ult.b : 'a', b: '0', v: t === 'R' ? '10' : t === 'V' ? '5' : '1' });
    $('#ejemplos').value = ''; lista(); calcula();
  });
  $('#carga').addEventListener('change', () => { sc.carga = $('#carga').value; $('#ejemplos').value = ''; calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    lista(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = C.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h = dato('Potenciales', sol.nudos.filter((n) => n !== sol.ref).map((n) => `V<sub>${esc(n)}</sub> = <b>${f(sol.V[n])} V</b>`).join(', ') || '—');
    h += dato('Potencia entregada', `${f(sol.ent)} W (= consumida)`);
    if (sol.thev) { const t = sol.thev; h += dato(`Thévenin visto por ${t.carga}`, `V<sub>th</sub> = <b>${f(t.Vth)} V</b>, R<sub>th</sub> = <b>${f(t.Rth)} Ω</b>`) + dato('Norton y máxima potencia', `I<sub>N</sub> = ${f(t.IN)} A, P<sub>máx</sub> = ${f(t.Pmax)} W`); }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Esquema ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--fuente', '--corr', '--cable', '--panel']) col[k] = cs.getPropertyValue(k).trim(); }
  function etiqueta(g, x, y, t, color, fuente = '12px') {
    g.font = `${fuente} "IBM Plex Sans", system-ui, sans-serif`;
    const w = g.measureText(t).width;
    g.fillStyle = col['--bg']; g.globalAlpha = 0.88; g.fillRect(x - w / 2 - 3, y - 8, w + 6, 16); g.globalAlpha = 1;
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y);
  }
  function dibuja() {
    const c = $('#esquema'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    colores();
    // nudos en una elipse, con la referencia abajo
    const otros = sol.nudos.filter((n) => n !== sol.ref), orden = [sol.ref, ...otros], n = orden.length;
    const cx = w / 2, cy = h / 2 + 4, rx = Math.max(60, w / 2 - 70), ry = Math.max(50, h / 2 - 44);
    const pos = Object.fromEntries(orden.map((q, k) => { const a = Math.PI / 2 + (2 * Math.PI * k) / n; return [q, [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]]; }));
    if (n === 2) { pos[orden[0]] = [cx, cy + ry]; pos[orden[1]] = [cx, cy - ry]; }
    // elementos entre el mismo par de nudos: curvas separadas
    const pares = {};
    for (const e of sol.els) { const k = [e.a, e.b].sort().join('|'); (pares[k] ||= []).push(e); }
    const puestos = [];
    for (const grupo of Object.values(pares)) grupo.forEach((e, j) => {
      const [x1, y1] = pos[e.a], [x2, y2] = pos[e.b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L, sgn = e.a < e.b ? 1 : -1, off = (j - (grupo.length - 1) / 2) * Math.min(110, L * 0.6) * sgn;
      const qx = (x1 + x2) / 2 + nx * off * 2, qy = (y1 + y2) / 2 + ny * off * 2;
      // el símbolo va en el punto de la curva más alejado de los ya dibujados (así no se pisan dos que se cruzan)
      const punto = (t) => [(1 - t) ** 2 * x1 + 2 * t * (1 - t) * qx + t * t * x2, (1 - t) ** 2 * y1 + 2 * t * (1 - t) * qy + t * t * y2];
      const tt = [0.5, 0.38, 0.62, 0.28, 0.72, 0.22, 0.78].find((t) => { const [px, py] = punto(t); return puestos.every(([ax, ay]) => Math.hypot(px - ax, py - ay) > 64); }) ?? 0.5;
      const [mx, my] = punto(tt), tx = 2 * (1 - tt) * (qx - x1) + 2 * tt * (x2 - qx), ty = 2 * (1 - tt) * (qy - y1) + 2 * tt * (y2 - qy), tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
      puestos.push([mx, my]);
      g.strokeStyle = col['--cable']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(qx, qy, x2, y2); g.stroke();
      // símbolo
      g.save(); g.translate(mx, my); g.rotate(Math.atan2(uy, ux));
      g.fillStyle = col['--bg']; g.fillRect(-20, -12, 40, 24);
      g.strokeStyle = col['--cable']; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-20, 0); g.lineTo(-14, 0); g.moveTo(14, 0); g.lineTo(20, 0); g.stroke();
      if (e.t === 'R') { g.fillStyle = col['--panel']; g.fillRect(-14, -6, 28, 12); g.strokeRect(-14, -6, 28, 12); }
      else if (e.t === 'V') {
        // de A (+, placa larga) a B (−, placa corta)
        g.strokeStyle = col['--fuente']; g.lineWidth = 2;
        g.beginPath(); g.moveTo(-14, 0); g.lineTo(-4, 0); g.moveTo(4, 0); g.lineTo(14, 0); g.moveTo(-4, -11); g.lineTo(-4, 11); g.moveTo(4, -6); g.lineTo(4, 6); g.stroke();
        g.fillStyle = col['--fuente']; g.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', -11, -8);
      } else {
        g.strokeStyle = col['--fuente']; g.lineWidth = 1.8; g.beginPath(); g.arc(0, 0, 11, 0, 2 * Math.PI); g.stroke();
        g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.stroke(); g.fillStyle = col['--fuente']; g.beginPath(); g.moveTo(7, 0); g.lineTo(2, -4); g.lineTo(2, 4); g.closePath(); g.fill();
      }
      g.restore();
      // nombre y valor a un lado; corriente al otro (normal a la curva en el símbolo)
      const nx2 = -uy, ny2 = ux;
      const lado = off ? Math.sign(off) : (nx * (mx - cx) + ny * (my - cy)) >= 0 ? 1 : -1;
      etiqueta(g, mx + nx2 * 24 * lado * Math.sign(nx2 * nx + ny2 * ny || 1), my + ny2 * 24 * lado * Math.sign(nx2 * nx + ny2 * ny || 1), `${e.n} = ${txt(f(e.v))} ${C.TIPOS[e.t].un}`, e.t === 'R' ? col['--ink'] : col['--fuente']);
      if (Math.abs(e.I) > 1e-12) {
        const s = e.I > 0 ? 1 : -1, k2 = lado * Math.sign(nx2 * nx + ny2 * ny || 1), ax = mx - nx2 * 22 * k2, ay = my - ny2 * 22 * k2;
        g.strokeStyle = col['--corr']; g.fillStyle = col['--corr']; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(ax - ux * 12 * s, ay - uy * 12 * s); g.lineTo(ax + ux * 10 * s, ay + uy * 10 * s); g.stroke();
        g.beginPath(); g.moveTo(ax + ux * 14 * s, ay + uy * 14 * s); g.lineTo(ax + ux * 7 * s - uy * 4, ay + uy * 7 * s + ux * 4); g.lineTo(ax + ux * 7 * s + uy * 4, ay + uy * 7 * s - ux * 4); g.closePath(); g.fill();
        etiqueta(g, ax - nx2 * 15 * k2, ay - ny2 * 15 * k2, `${txt(f(Math.abs(e.I)))} A`, col['--corr'], '11px');
      }
    });
    // nudos
    for (const q of orden) {
      const [x, y] = pos[q];
      g.fillStyle = col['--cable']; g.beginPath(); g.arc(x, y, 4.5, 0, 2 * Math.PI); g.fill();
      const abajo = y > cy + 1, arriba = y < cy - 1;
      etiqueta(g, x, y + (abajo ? 16 : arriba ? -16 : -16), `${q}: ${txt(f(sol.V[q]))} V`, col['--accent'], '600 12px');
      if (q === sol.ref) {
        g.strokeStyle = col['--cable']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 5);
        for (const [hw, dy] of [[9, 26], [6, 30], [3, 34]]) { g.moveTo(x - hw, y + dy - 2); g.lineTo(x + hw, y + dy - 2); }
        g.stroke();
      }
    }
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('circuitos').current;
  lista(); calcula();
  window.CircuitosApp = { abrirEjemplo, resultado: () => sol && { V: sol.V, thev: sol.thev, ent: sol.ent }, estado: () => copia(sc) };
})();
