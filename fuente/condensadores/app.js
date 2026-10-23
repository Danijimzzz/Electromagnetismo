/* =====================================================================
   Condensadores con dieléctricos: interfaz (datos, corte del condensador,
   gráfica E(x), tabla por capas y desarrollo). El cálculo está en fisica.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const K = Condensador, cu = K.conUnidad;
  const CLAVE = 'condensadores-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const COLCAPA = ['--capa', '--capa2', '--capa3'];
  const texto = (h) => h.replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '');

  let sc = JSON.parse(JSON.stringify(K.ejemplos[0].sc));
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.geo) sc = g; } catch (e) {}
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const campos = $('#campos');
  function formulario() {
    const plano = sc.geo === 'plano', serie = !plano || sc.disposicion !== 'paralelo';
    let h = `<label for="f-geo">Forma</label><select id="f-geo" class="in" data-k="geo"><option value="plano">Plano</option><option value="cilindro">Cilíndrico</option><option value="esfera">Esférico</option></select>`;
    if (plano) h += fila('S', 'Área de las armaduras', 'cm²') + fila('d', 'Separación', 'mm') + `<label for="f-disp">Dieléctrico</label><select id="f-disp" class="in" data-k="disposicion"><option value="serie">En láminas (serie)</option><option value="paralelo">Ocupando parte del área (paralelo)</option></select>`;
    else h += fila('a', 'Radio interior a', 'cm') + fila('b', 'Radio exterior b', 'cm') + (sc.geo === 'cilindro' ? fila('L', 'Longitud', 'cm') : '');
    h += `<div class="sep">Capas de dieléctrico ${plano ? (serie ? '(desde la armadura +)' : '') : '(desde el radio interior)'}</div>`;
    h += (sc.capas || []).map((c, i) => `<div class="capa" data-i="${i}"><b style="background:var(${COLCAPA[i % 3]})"></b><input class="in" data-c="t" value="${esc(c.t)}" aria-label="Capa ${i + 1}: ${serie ? (plano ? 'espesor en mm' : 'radio exterior en cm') : 'porcentaje del área'}" placeholder="${serie ? (plano ? 'espesor (mm)' : 'hasta r (cm)') : '% del área'}"><input class="in" data-c="er" value="${esc(c.er)}" aria-label="Capa ${i + 1}: εr" placeholder="εr"><button class="btn mini" type="button" data-quita="${i}" aria-label="Quitar la capa ${i + 1}">✕</button></div>`).join('');
    h += `<div style="grid-column:1/-1"><button class="btn" type="button" id="anade">+ Añadir capa</button> <span class="nota">${serie ? (plano ? 'espesor en mm' : 'radio exterior en cm') : '% del área'} · ε<sub>r</sub></span></div>`;
    h += `<div class="sep">Circuito</div><div class="radios"><label><input type="radio" name="fuente" value="V"${sc.fuente !== 'Q' ? ' checked' : ''}> Conectado a una batería</label><label><input type="radio" name="fuente" value="Q"${sc.fuente === 'Q' ? ' checked' : ''}> Aislado con carga</label></div>`;
    h += sc.fuente === 'Q' ? fila('Q', 'Carga', 'nC') : fila('V', 'Tensión de la batería', 'V');
    campos.innerHTML = h;
    $('#f-geo').value = sc.geo;
    if (plano) $('#f-disp').value = sc.disposicion === 'paralelo' ? 'paralelo' : 'serie';
  }
  const fila = (k, nom, u) => `<label for="f-${k}">${nom} <small>(${u})</small></label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;

  campos.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.k && t.tagName === 'INPUT') sc[t.dataset.k] = t.value;
    else if (t.dataset.c) sc.capas[+t.closest('.capa').dataset.i][t.dataset.c] = t.value;
    else if (t.name === 'fuente') { sc.fuente = t.value; if (sc.fuente === 'Q' && !sc.Q) sc.Q = '10'; if (sc.fuente === 'V' && !sc.V) sc.V = '100'; formulario(); }
    $('#ejemplos').value = '';
    calcula();
  });
  campos.addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'geo') {
      const def = { plano: { S: '100', d: '2' }, cilindro: { a: '1', b: '2', L: '100' }, esfera: { a: '5', b: '10' } }[t.value];
      for (const [k, v] of Object.entries(def)) if (!sc[k]) sc[k] = v;
      sc.capas = (sc.capas || []).map((c) => ({ ...c, t: '' }));
    }
    if (t.dataset.k === 'disposicion') sc.capas = (sc.capas || []).map((c) => ({ ...c, t: '' }));
    $('#ejemplos').value = '';
    formulario(); calcula();
  });
  campos.addEventListener('click', (e) => {
    if (e.target.id === 'anade') { (sc.capas = sc.capas || []).push({ t: '', er: '2' }); formulario(); calcula(); }
    const q = e.target.dataset.quita;
    if (q !== undefined) { sc.capas.splice(+q, 1); formulario(); calcula(); }
  });
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + K.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = K.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = JSON.parse(JSON.stringify(e.sc)); sel.value = clave; formulario(); calcula();
  }

  /* ---------- Cálculo y resultados ---------- */
  function calcula() {
    const err = $('#error');
    try { sol = K.resolver(sc); } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    err.hidden = true;
    try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {}
    const c = sol.comp;
    const caja = (n, v, extra) => `<div><span>${n}</span><b>${v}</b>${extra ? `<small>${extra}</small>` : ''}</div>`;
    $('#resumen').innerHTML = caja('Capacidad', cu(sol.C, 'F'), c ? `vacío: ${cu(c.C0, 'F')} (×${K.num(sol.C / c.C0, 3)})` : '') +
      caja('Carga', cu(sol.Q, 'C'), c && sol.fuente === 'V' ? `vacío: ${cu(c.Q0, 'C')}` : '') +
      caja('Tensión', cu(sol.V, 'V'), c && sol.fuente === 'Q' ? `vacío: ${cu(c.V0, 'V')}` : '') +
      caja('Energía', cu(sol.U, 'J'), c ? `vacío: ${cu(c.U0, 'J')}` : '');
    const serie = sol.g.disposicion === 'serie', plano = sol.g.geo === 'plano';
    const rango = (a, b, u) => (Math.abs(a - b) <= 1e-9 * Math.abs(a) ? cu(a, u) : `${cu(a, u)} → ${cu(b, u)}`);
    $('#regiones').innerHTML = `<thead><tr><th>Región</th><th>${serie ? (plano ? 'Espesor' : 'Radios') : 'Área'}</th><th>E</th><th>D</th><th>P</th><th>${serie ? 'ΔV' : 'Carga libre'}</th><th>Q polarización</th></tr></thead><tbody>${sol.regiones.map((o) => `<tr><td>${o.nombre}</td>
      <td>${serie ? (plano ? cu(o.hasta - o.desde, 'm') : `${K.num(o.desde * 100)}–${K.num(o.hasta * 100)} cm`) : `${K.num(o.fraccion * 100)} %`}</td>
      <td>${rango(o.E1, o.E2, 'V/m')}</td><td>${rango(o.D1, o.D2, 'C/m²')}</td><td>${o.vacio ? '0' : rango(o.P1, o.P2, 'C/m²')}</td><td>${serie ? cu(o.V, 'V') : cu(o.Q, 'C')}</td><td>${o.vacio ? '—' : '±' + cu(o.Qp, 'C')}</td></tr>`).join('')}</tbody>`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--pos', '--neg', '--capa', '--capa2', '--capa3', '--campo']) col[k] = cs.getPropertyValue(k).trim();
  }
  function lienzo(c) {
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  }
  const flecha = (g, x1, y1, x2, y2, s = 6) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)); g.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)); g.closePath(); g.fill();
  };
  function dibuja() {
    if (!sol) return;
    const { g, w, h } = lienzo($('#dibujo'));
    const G = sol.g, Emax = Math.max(...sol.regiones.map((o) => Math.max(o.E1, o.E2)));
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (G.geo === 'plano') {
      const x0 = w * 0.18, x1 = w * 0.82, y0 = 24, y1 = h - 24;
      const X = (x) => x0 + (x / G.d) * (x1 - x0);
      sol.regiones.forEach((o, i) => {
        if (o.vacio) return;
        g.fillStyle = col[COLCAPA[i % 3]];
        if (G.disposicion === 'serie') g.fillRect(X(o.desde), y0, X(o.hasta) - X(o.desde), y1 - y0);
        else { const f0 = sol.regiones.slice(0, i).reduce((s, r) => s + r.fraccion, 0); g.fillRect(x0, y0 + f0 * (y1 - y0), x1 - x0, o.fraccion * (y1 - y0)); }
      });
      // líneas de campo: más juntas donde E es mayor
      g.strokeStyle = col['--campo']; g.fillStyle = col['--campo']; g.lineWidth = 1.2;
      if (G.disposicion === 'serie') {
        for (const o of sol.regiones) {
          const n = Math.max(2, Math.round((o.E1 / Emax) * 12));
          for (let k = 0; k < n; k++) { const y = y0 + ((k + 0.5) / n) * (y1 - y0); flecha(g, X(o.desde) + 3, y, X(o.hasta) - 3, y, 5); }
        }
      } else {
        let f0 = 0;
        for (const o of sol.regiones) {
          const n = Math.max(1, Math.round((o.D1 / Math.max(...sol.regiones.map((r) => r.D1))) * 12 * o.fraccion));
          for (let k = 0; k < n; k++) { const y = y0 + (f0 + ((k + 0.5) / n) * o.fraccion) * (y1 - y0); flecha(g, x0 + 3, y, x1 - 3, y, 5); }
          f0 += o.fraccion;
        }
      }
      // armaduras
      g.fillStyle = col['--pos']; g.fillRect(x0 - 8, y0 - 6, 8, y1 - y0 + 12);
      g.fillStyle = col['--neg']; g.fillRect(x1, y0 - 6, 8, y1 - y0 + 12);
      g.font = '600 16px "IBM Plex Sans", system-ui, sans-serif';
      g.fillStyle = col['--pos']; g.fillText('+', x0 - 22, (y0 + y1) / 2);
      g.fillStyle = col['--neg']; g.fillText('−', x1 + 22, (y0 + y1) / 2);
      g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--ink'];
      sol.regiones.forEach((o, i) => {
        if (o.vacio) return;
        if (G.disposicion === 'serie') { g.fillText(`εr = ${K.num(o.er).replace(/<[^>]+>/g, '')}`, (X(o.desde) + X(o.hasta)) / 2, y0 - 12); }
        else { const f0 = sol.regiones.slice(0, i).reduce((s, r) => s + r.fraccion, 0); g.fillText(`εr = ${K.num(o.er)}`, (x0 + x1) / 2, y0 + (f0 + o.fraccion / 2) * (y1 - y0)); }
      });
    } else {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 18, k = R / G.b;
      sol.regiones.slice().reverse().forEach((o) => {
        const i = sol.regiones.indexOf(o);
        g.fillStyle = o.vacio ? col['--bg'] : col[COLCAPA[i % 3]];
        g.beginPath(); g.arc(cx, cy, o.hasta * k, 0, 2 * Math.PI); g.fill();
      });
      g.fillStyle = col['--pos']; g.beginPath(); g.arc(cx, cy, G.a * k, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = col['--neg']; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, G.b * k + 3, 0, 2 * Math.PI); g.stroke();
      g.strokeStyle = col['--campo']; g.fillStyle = col['--campo']; g.lineWidth = 1.2;
      const n = 16;
      for (let j = 0; j < n; j++) { const a = (j / n) * 2 * Math.PI; flecha(g, cx + Math.cos(a) * (G.a * k + 4), cy + Math.sin(a) * (G.a * k + 4), cx + Math.cos(a) * (G.b * k - 4), cy + Math.sin(a) * (G.b * k - 4), 5); }
      g.fillStyle = col['--panel']; g.font = '600 15px "IBM Plex Sans", system-ui, sans-serif'; g.fillText('+', cx, cy);
      g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--ink'];
      sol.regiones.forEach((o) => { if (!o.vacio) g.fillText(`εr = ${K.num(o.er)}`, cx, cy - ((o.desde + o.hasta) / 2) * k); });
      g.fillStyle = col['--muted']; g.textAlign = 'left'; g.fillText(G.geo === 'cilindro' ? 'corte perpendicular al eje' : 'corte por el centro', 8, h - 10);
    }
    grafica();
  }

  function grafica() {
    const { g, w, h } = lienzo($('#grafica'));
    const G = sol.g, ini = G.geo === 'plano' ? 0 : G.a, fin = G.geo === 'plano' ? G.d : G.b;
    const l = 84, r = 26, top = 14, b = 26;
    const pts = [];
    for (let i = 0; i <= 400; i++) { const x = ini + ((fin - ini) * i) / 400; pts.push([x, K.campo(sol, x)]); }
    // en los cambios de capa el campo salta: añade los dos lados
    if (G.disposicion === 'serie') for (const o of sol.regiones) { pts.push([o.desde, o.E1], [o.hasta, o.E2]); }
    pts.sort((p, q) => p[0] - q[0]);
    const Emax = Math.max(...pts.map((p) => p[1])) * 1.1;
    const X = (x) => l + ((x - ini) / (fin - ini)) * (w - l - r), Y = (e) => h - b - (e / Emax) * (h - top - b);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.fillStyle = col['--muted']; g.font = '11px "IBM Plex Mono", monospace';
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const u of [0, 0.5, 1]) { const e = (u * Emax) / 1.1; g.beginPath(); g.moveTo(l, Y(e)); g.lineTo(w - r, Y(e)); g.stroke(); g.fillText(texto(cu(e, 'V/m')), l - 4, Y(e)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    const fx = G.geo === 'plano' ? 1e3 : 1e2, ux = G.geo === 'plano' ? 'mm' : 'cm';
    for (let i = 0; i <= 4; i++) { const x = ini + ((fin - ini) * i) / 4; g.fillText(`${texto(K.num(x * fx, 3))} ${ux}`, X(x), h - b + 6); }
    g.strokeStyle = col['--accent']; g.lineWidth = 2; g.beginPath();
    let prev = null;
    for (const [x, e] of pts) { if (prev === null) g.moveTo(X(x), Y(e)); else g.lineTo(X(x), Y(e)); prev = x; }
    g.stroke();
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.fillText(`E(${G.geo === 'plano' ? 'x' : 'r'})`, l + 6, top - 2);
  }

  addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });
  const ver = $('#ver'); if (ver) ver.textContent = Version.de('condensadores').current;
  colores(); formulario(); calcula();
  window.CondApp = { abrirEjemplo, sol: () => sol, escena: () => JSON.parse(JSON.stringify(sc)) };
})();
