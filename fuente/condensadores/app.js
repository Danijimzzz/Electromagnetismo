/* =====================================================================
   Condensadores con dieléctricos: interfaz (datos, corte del condensador,
   gráfica E(x), tabla por capas y desarrollo). El cálculo está en fisica.js.
   ===================================================================== */
(() => {
  const { $, esc } = Herramienta;
  const K = Condensador, cu = K.conUnidad;
  const CLAVE = 'condensadores-v1';
  const COLCAPA = ['--capa', '--capa2', '--capa3'];
  const texto = (h) => h.replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '');

  let sc = JSON.parse(JSON.stringify(K.ejemplos[0].sc));
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && (g.geo || g.tipo)) sc = g; } catch (e) {}
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const campos = $('#campos');
  const TIPOS = [['condensador', 'Un condensador con dieléctricos'], ['asociacion', 'Asociación de condensadores'], ['conectar', 'Dos condensadores cargados que se conectan']];
  const opc = (lista, v) => lista.map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${t}</option>`).join('');
  function formulario() {
    const tipo = sc.tipo || 'condensador';
    let h = `<label for="f-tipo">Qué calculas</label><select id="f-tipo" class="in" data-k="tipo">${opc(TIPOS, tipo)}</select>`;
    if (tipo === 'asociacion') {
      h += `<label for="f-red">Cómo están</label><select id="f-red" class="in" data-k="red">${opc(Object.entries(K.REDES), sc.red)}</select>`;
      h += (sc.cs || []).map((c, i) => `<label for="f-c${i}">C<sub>${i + 1}</sub> <small>(µF)</small></label><div class="capa-c"><input id="f-c${i}" class="in" data-cs="${i}" value="${esc(c)}" inputmode="decimal" autocomplete="off">${sc.cs.length > 2 ? `<button class="btn mini" type="button" data-quitac="${i}" aria-label="Quitar C${i + 1}">✕</button>` : ''}</div>`).join('');
      h += `<div style="grid-column:1/-1">${(sc.cs || []).length < 6 ? '<button class="btn" type="button" id="anadec">+ Añadir condensador</button>' : ''}</div>` + fila('V', 'Tensión aplicada', 'V');
      campos.innerHTML = h; return;
    }
    if (tipo === 'conectar') {
      h += fila('C1', 'C₁', 'µF') + fila('V1', 'Cargado a V₁', 'V') + fila('C2', 'C₂', 'µF') + fila('V2', 'Cargado a V₂', 'V') + `<label for="f-union">Se unen las placas</label><select id="f-union" class="in" data-k="union">${opc([['igual', 'del mismo signo (+ con +)'], ['opuesta', 'de signo contrario (+ con −)']], sc.union)}</select>`;
      campos.innerHTML = h; return;
    }
    const plano = sc.geo === 'plano', disp = ['paralelo', 'variable'].includes(sc.disposicion) ? sc.disposicion : 'serie', serie = disp === 'serie';
    h += `<label for="f-geo">Forma</label><select id="f-geo" class="in" data-k="geo"><option value="plano">Plano</option><option value="cilindro">Cilíndrico</option><option value="esfera">Esférico</option></select>`;
    if (plano) h += fila('S', 'Área de las armaduras', 'cm²') + fila('d', 'Separación', 'mm');
    else h += fila('a', 'Radio interior a', 'cm') + fila('b', 'Radio exterior b', 'cm') + (sc.geo === 'cilindro' ? fila('L', 'Longitud', 'cm') : '');
    h += `<label for="f-disp">Dieléctrico</label><select id="f-disp" class="in" data-k="disposicion"><option value="serie">${plano ? 'En láminas (serie)' : 'En capas (serie)'}</option><option value="paralelo">${plano ? 'Ocupando parte del área (paralelo)' : 'Por sectores (paralelo)'}</option><option value="variable">ε<sub>r</sub> que cambia con la posición</option></select>`;
    if (disp === 'variable') {
      h += `<div class="sep">ε<sub>r</sub> lineal entre las armaduras</div>` + fila('er1', 'ε<sub>r</sub> junto a la armadura +', plano ? 'x = 0' : 'r = a') + fila('er2', 'ε<sub>r</sub> junto a la armadura −', plano ? 'x = d' : 'r = b');
      h += circuito(); campos.innerHTML = h; $('#f-geo').value = sc.geo; $('#f-disp').value = disp; return;
    }
    h += `<div class="sep">Capas de dieléctrico ${serie ? (plano ? '(desde la armadura +)' : '(desde el radio interior)') : plano ? '(% del área)' : '(% de la superficie, por ángulos)'}</div>`;
    h += (sc.capas || []).map((c, i) => `<div class="capa" data-i="${i}"><b style="background:var(${COLCAPA[i % 3]})"></b><input class="in" data-c="t" value="${esc(c.t)}" aria-label="Capa ${i + 1}: ${serie ? (plano ? 'espesor en mm' : 'radio exterior en cm') : 'porcentaje del área'}" placeholder="${serie ? (plano ? 'espesor (mm)' : 'hasta r (cm)') : '% del área'}"><input class="in" data-c="er" value="${esc(c.er)}" aria-label="Capa ${i + 1}: εr" placeholder="εr"><input class="in" data-c="rig" value="${esc(c.rig ?? '')}" aria-label="Capa ${i + 1}: rigidez dieléctrica en kV/mm (opcional)" placeholder="rigidez kV/mm"><button class="btn mini" type="button" data-quita="${i}" aria-label="Quitar la capa ${i + 1}">✕</button></div>`).join('');
    h += `<div style="grid-column:1/-1"><button class="btn" type="button" id="anade">+ Añadir capa</button> <span class="nota">${serie ? (plano ? 'espesor en mm' : 'radio exterior en cm') : plano ? '% del área' : '% de la superficie'} · ε<sub>r</sub> · rigidez (opcional, para la tensión máxima)</span></div>`;
    h += circuito();
    campos.innerHTML = h;
    $('#f-geo').value = sc.geo;
    $('#f-disp').value = disp;
  }
  function circuito() {
    let h = `<div class="sep">Circuito</div><div class="radios"><label><input type="radio" name="fuente" value="V"${sc.fuente !== 'Q' ? ' checked' : ''}> Conectado a una batería</label><label><input type="radio" name="fuente" value="Q"${sc.fuente === 'Q' ? ' checked' : ''}> Aislado con carga</label></div>`;
    return h + (sc.fuente === 'Q' ? fila('Q', 'Carga', 'nC') : fila('V', 'Tensión de la batería', 'V'));
  }
  const fila = (k, nom, u) => `<label for="f-${k}">${nom} <small>(${u})</small></label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;

  campos.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.k && t.tagName === 'INPUT') sc[t.dataset.k] = t.value;
    else if (t.dataset.cs !== undefined) sc.cs[+t.dataset.cs] = t.value;
    else if (t.dataset.c) sc.capas[+t.closest('.capa').dataset.i][t.dataset.c] = t.value;
    else if (t.name === 'fuente') { sc.fuente = t.value; if (sc.fuente === 'Q' && !sc.Q) sc.Q = '10'; if (sc.fuente === 'V' && !sc.V) sc.V = '100'; formulario(); }
    $('#ejemplos').value = '';
    calcula();
  });
  campos.addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'tipo') { const e = K.ejemplos.find((x) => (x.sc.tipo || 'condensador') === t.value); sc = JSON.parse(JSON.stringify(e.sc)); }
    if (t.dataset.k === 'disposicion' && t.value === 'variable') { if (!sc.er1) sc.er1 = '2'; if (!sc.er2) sc.er2 = '5'; }
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
    if (e.target.id === 'anadec') { sc.cs.push('1'); formulario(); calcula(); }
    if (e.target.dataset.quitac !== undefined) { sc.cs.splice(+e.target.dataset.quitac, 1); formulario(); calcula(); }
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
    const caja = (n, v, extra) => `<div><span>${n}</span><b>${v}</b>${extra ? `<small>${extra}</small>` : ''}</div>`;
    $('#grafica').hidden = sol.tipo !== 'condensador';
    if (sol.tipo === 'asociacion') {
      $('#resumen').innerHTML = caja('Capacidad equivalente', cu(sol.Ceq, 'F')) + caja('Carga total', cu(sol.Q, 'C')) + caja('Tensión', cu(sol.V, 'V')) + caja('Energía', cu(sol.U, 'J'));
      $('#regiones').innerHTML = `<thead><tr><th>Condensador</th><th>C</th><th>Q</th><th>V</th><th>U</th></tr></thead><tbody>${sol.cs.map((c, i) => `<tr><td>C<sub>${i + 1}</sub></td><td>${cu(c, 'F')}</td><td>${cu(sol.q[i], 'C')}</td><td>${cu(sol.v[i], 'V')}</td><td>${cu(sol.u[i], 'J')}</td></tr>`).join('')}</tbody>`;
    } else if (sol.tipo === 'conectar') {
      $('#resumen').innerHTML = caja('Tensión final', cu(sol.Vf, 'V')) + caja('Carga total', cu(Math.abs(sol.Qt), 'C')) + caja('Energía antes', cu(sol.U0, 'J')) + caja('Energía perdida', cu(sol.perdida, 'J'), `queda ${cu(sol.Uf, 'J')}`);
      $('#regiones').innerHTML = `<thead><tr><th></th><th>C</th><th>Q antes</th><th>V antes</th><th>Q después</th><th>V después</th></tr></thead><tbody>${[[sol.C1, sol.Q1, sol.V1], [sol.C2, sol.Q2, sol.V2]].map(([c, q, v], i) => `<tr><td>C<sub>${i + 1}</sub></td><td>${cu(c, 'F')}</td><td>${cu(q, 'C')}</td><td>${cu(v, 'V')}</td><td>${cu(c * sol.Vf, 'C')}</td><td>${cu(sol.Vf, 'V')}</td></tr>`).join('')}</tbody>`;
    }
    if (sol.tipo !== 'condensador') { $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join(''); dibuja(); return; }
    const c = sol.comp;
    $('#resumen').innerHTML = caja('Capacidad', cu(sol.C, 'F'), c ? `vacío: ${cu(c.C0, 'F')} (×${K.num(sol.C / c.C0, 3)})` : '') +
      caja('Carga', cu(sol.Q, 'C'), c && sol.fuente === 'V' ? `vacío: ${cu(c.Q0, 'C')}` : '') +
      caja('Tensión', cu(sol.V, 'V'), c && sol.fuente === 'Q' ? `vacío: ${cu(c.V0, 'V')}` : '') +
      caja('Energía', cu(sol.U, 'J'), c ? `vacío: ${cu(c.U0, 'J')}` : '') +
      (sol.Vmax ? caja('Tensión máxima', cu(sol.Vmax, 'V'), 'antes de la ruptura') : '') +
      (sol.letras ? `<div class="ancho"><span>Capacidad en letras</span>${Mates.html(`$${sol.letras}$`)}${sol.letrasNota ? `<small>${Mates.html(sol.letrasNota.replace(/^(\S+):/, '$$$1$$:'))}</small>` : ''}</div>` : '');
    const serie = sol.g.disposicion !== 'paralelo', plano = sol.g.geo === 'plano';
    const rango = (a, b, u) => (Math.abs(a - b) <= 1e-9 * Math.abs(a) ? cu(a, u) : `${cu(a, u)} → ${cu(b, u)}`);
    $('#regiones').innerHTML = `<thead><tr><th>Región</th><th>${serie ? (plano ? 'Espesor' : 'Radios') : plano ? 'Área' : 'Superficie'}</th><th>E</th><th>D</th><th>P</th><th>${serie ? 'ΔV' : 'Carga libre'}</th><th>Q polarización</th></tr></thead><tbody>${sol.regiones.map((o) => `<tr><td>${o.nombre}</td>
      <td>${serie ? (plano ? cu(o.hasta - o.desde, 'm') : `${K.num(o.desde * 100)}–${K.num(o.hasta * 100)} cm`) : `${K.num(o.fraccion * 100)} %`}</td>
      <td>${rango(o.E1, o.E2, 'V/m')}</td><td>${rango(o.D1, o.D2, 'C/m²')}</td><td>${o.vacio ? '0' : rango(o.P1, o.P2, 'C/m²')}</td><td>${serie ? cu(o.V, 'V') : cu(o.Q, 'C')}</td><td>${o.vacio ? '—' : '±' + cu(o.Qp, 'C')}</td></tr>`).join('')}</tbody>`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--pos', '--neg', '--capa', '--capa2', '--capa3', '--campo']) col[k] = cs.getPropertyValue(k).trim();
  }
  const lienzo = (c) => Herramienta.lienzo(c);
  const flecha = (g, x1, y1, x2, y2, s = 6) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)); g.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)); g.closePath(); g.fill();
  };
  // esquema de condensadores: placas de un condensador en (x, y), vertical
  function placas(g, x, y, nombre, carga) {
    g.strokeStyle = col['--ink']; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 5, y - 16); g.lineTo(x - 5, y + 16); g.moveTo(x + 5, y - 16); g.lineTo(x + 5, y + 16); g.stroke();
    g.fillStyle = col['--ink']; g.fillText(nombre, x, y - 26); if (carga) { g.fillStyle = col['--muted']; g.fillText(carga, x, y + 28); }
  }
  function esquema(g, w, h) {
    const lin = (pts) => { g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }, t = (x) => texto(cu(x, 'V'));
    if (sol.tipo === 'conectar') {
      const y = h / 2, x1 = w * 0.35, x2 = w * 0.65;
      lin([[x1, y - 40], [x2, y - 40]]); lin([[x1, y + 40], [x2, y + 40]]); lin([[x1, y - 40], [x1, y - 16]]); lin([[x1, y + 16], [x1, y + 40]]); lin([[x2, y - 40], [x2, y - 16]]); lin([[x2, y + 16], [x2, y + 40]]);
      g.save(); g.translate(x1, y); g.rotate(Math.PI / 2); placas(g, 0, 0, '', ''); g.restore(); g.save(); g.translate(x2, y); g.rotate(Math.PI / 2); placas(g, 0, 0, '', ''); g.restore();
      g.fillStyle = col['--ink']; g.fillText('C₁', x1 - 30, y); g.fillText('C₂', x2 + 30, y);
      g.fillStyle = col['--muted']; g.fillText(`${sol.op ? '+ con −' : '+ con +'} · V final = ${t(sol.Vf)}`, w / 2, h - 16);
      return;
    }
    const n = sol.cs.length, y = h / 2, xa = 40, xb = w - 40, nombre = (i) => `C${'₁₂₃₄₅₆'[i]}`;
    const fila = (is, x0, x1, yy) => { const paso = (x1 - x0) / is.length; is.forEach((i, j) => { const xc = x0 + paso * (j + 0.5); lin([[x0 + paso * j, yy], [xc - 5, yy]]); lin([[xc + 5, yy], [x0 + paso * (j + 1), yy]]); placas(g, xc, yy, nombre(i), t(sol.v[i])); }); };
    const columna = (is, x0, x1, y0, y1) => { const sep = Math.min(84, (h - 40) / Math.max(1, is.length - 1)), ym = (y0 + y1) / 2; y0 = ym - (sep * (is.length - 1)) / 2; y1 = ym + (sep * (is.length - 1)) / 2; const paso = is.length > 1 ? (y1 - y0) / (is.length - 1) : 0; lin([[x0, y0], [x0, y1]]); lin([[x1, y0], [x1, y1]]); is.forEach((i, j) => fila([i], x0, x1, y0 + paso * j)); };
    const todos = sol.cs.map((_, i) => i), resto = todos.slice(1);
    if (sol.red === 'serie') fila(todos, xa, xb, y);
    else if (sol.red === 'paralelo') columna(todos, xa, xb, y - (n - 1) * 30, y + (n - 1) * 30);
    else if (sol.red === 'serie-par') { const xm = xa + (xb - xa) * 0.35; fila([0], xa, xm, y); columna(resto, xm, xb, y - (resto.length - 1) * 30, y + (resto.length - 1) * 30); }
    else { columna([0], xa, xb, y - 40, y - 40); lin([[xa, y - 40], [xa, y + 40]]); lin([[xb, y - 40], [xb, y + 40]]); fila(resto, xa, xb, y + 40); }
    g.fillStyle = col['--pos']; g.font = '600 15px "IBM Plex Sans", system-ui, sans-serif'; g.fillText('+', xa - 14, y); g.fillStyle = col['--neg']; g.fillText('−', xb + 14, y);
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--muted']; g.fillText(`V = ${t(sol.V)} · C_eq = ${texto(cu(sol.Ceq, 'F'))}`.replace('C_eq', 'Ceq'), w / 2, h - 12);
  }
  function dibuja() {
    if (!sol) return;
    const { g, w, h } = lienzo($('#dibujo'));
    if (sol.tipo !== 'condensador') { g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; esquema(g, w, h); return; }
    const G = sol.g, Emax = Math.max(...sol.regiones.map((o) => Math.max(o.E1, o.E2)));
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (G.geo === 'plano') {
      const x0 = w * 0.18, x1 = w * 0.82, y0 = 24, y1 = h - 24;
      const X = (x) => x0 + (x / G.d) * (x1 - x0);
      sol.regiones.forEach((o, i) => {
        if (o.vacio) return;
        g.fillStyle = col[COLCAPA[i % 3]];
        if (o.variable) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, col['--capa']); gr.addColorStop(1, col['--capa3']); g.fillStyle = gr; g.globalAlpha = 0.35 + 0.5 * Math.min(1, G.er1 / Math.max(G.er1, G.er2)); g.fillRect(x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; }
        else if (G.disposicion === 'serie') g.fillRect(X(o.desde), y0, X(o.hasta) - X(o.desde), y1 - y0);
        else { const f0 = sol.regiones.slice(0, i).reduce((s, r) => s + r.fraccion, 0); g.fillRect(x0, y0 + f0 * (y1 - y0), x1 - x0, o.fraccion * (y1 - y0)); }
      });
      // líneas de campo: más juntas donde E es mayor
      g.strokeStyle = col['--campo']; g.fillStyle = col['--campo']; g.lineWidth = 1.2;
      if (G.disposicion !== 'paralelo') {
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
        if (o.variable) g.fillText(`εr: ${texto(K.num(G.er1))} → ${texto(K.num(G.er2))}`, (x0 + x1) / 2, y0 - 12);
        else if (G.disposicion === 'serie') { g.fillText(`εr = ${K.num(o.er).replace(/<[^>]+>/g, '')}`, (X(o.desde) + X(o.hasta)) / 2, y0 - 12); }
        else { const f0 = sol.regiones.slice(0, i).reduce((s, r) => s + r.fraccion, 0); g.fillText(`εr = ${K.num(o.er)}`, (x0 + x1) / 2, y0 + (f0 + o.fraccion / 2) * (y1 - y0)); }
      });
    } else {
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 18, k = R / G.b;
      if (G.disposicion === 'paralelo') {
        // sectores: cada capa ocupa una fracción del ángulo, empezando arriba
        let a0 = -Math.PI / 2;
        sol.regiones.forEach((o, i) => { const a1 = a0 + o.fraccion * 2 * Math.PI; g.fillStyle = o.vacio ? col['--bg'] : col[COLCAPA[i % 3]]; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, G.b * k, a0, a1); g.closePath(); g.fill(); if (!o.vacio) { g.fillStyle = col['--ink']; g.fillText(`εr = ${texto(K.num(o.er))}`, cx + Math.cos((a0 + a1) / 2) * (G.a + G.b) * 0.5 * k, cy + Math.sin((a0 + a1) / 2) * (G.a + G.b) * 0.5 * k); } a0 = a1; });
      } else if (G.disposicion === 'variable') {
        const gr = g.createRadialGradient(cx, cy, G.a * k, cx, cy, G.b * k); gr.addColorStop(0, col[G.er1 >= G.er2 ? '--capa3' : '--capa']); gr.addColorStop(1, col[G.er1 >= G.er2 ? '--capa' : '--capa3']);
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, G.b * k, 0, 2 * Math.PI); g.fill();
      } else sol.regiones.slice().reverse().forEach((o) => {
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
      if (G.disposicion === 'serie') sol.regiones.forEach((o) => { if (!o.vacio) g.fillText(`εr = ${texto(K.num(o.er))}`, cx, cy - ((o.desde + o.hasta) / 2) * k); });
      if (G.disposicion === 'variable') g.fillText(`εr: ${texto(K.num(G.er1))} → ${texto(K.num(G.er2))}`, cx, cy - ((G.a + G.b) / 2) * k);
      g.fillStyle = col['--muted']; g.textAlign = 'left'; g.fillText(G.geo === 'cilindro' ? 'corte perpendicular al eje' : 'corte por el centro', 8, h - 10);
    }
    grafica();
  }

  function grafica() {
    if (sol.tipo !== 'condensador') return;
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
