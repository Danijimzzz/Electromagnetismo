(() => {
  const { $, esc } = Herramienta;
  const K = Condensador, cu = K.conUnidad;
  const CLAVE = 'condensadores-v1';
  const COLCAPA = ['--capa', '--capa2', '--capa3'];
  const texto = (h) => h.replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '');

  let sc = JSON.parse(JSON.stringify(K.ejemplos[0].sc));
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && (g.geo || g.tipo)) sc = g; } catch (e) {}
  let sol = null, col = {};

  const campos = $('#campos');
  const TIPOS = [['condensador', 'A capacitor with dielectrics'], ['asociacion', 'Combination of capacitors'], ['conectar', 'Two charged capacitors that are connected'], ['fuerza', 'Force on the dielectric and the plates']];
  const opc = (lista, v) => lista.map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${t}</option>`).join('');
  function formulario() {
    const tipo = sc.tipo || 'condensador';
    let h = `<label for="f-tipo">What you calculate</label><select id="f-tipo" class="in" data-k="tipo">${opc(TIPOS, tipo)}</select>`;
    if (tipo === 'asociacion') {
      h += `<label for="f-red">How they are connected</label><select id="f-red" class="in" data-k="red">${opc(Object.entries(K.REDES), sc.red)}</select>`;
      h += (sc.cs || []).map((c, i) => `<label for="f-c${i}">C<sub>${i + 1}</sub> <small>(µF)</small></label><div class="capa-c"><input id="f-c${i}" class="in" data-cs="${i}" value="${esc(c)}" inputmode="decimal" autocomplete="off"><input class="in" data-vm="${i}" value="${esc((sc.vm || [])[i] ?? '')}" placeholder="V breakdown" aria-label="Breakdown voltage of C${i + 1} in volts (optional)" inputmode="decimal" autocomplete="off">${sc.cs.length > 2 ? `<button class="btn mini" type="button" data-quitac="${i}" aria-label="Remove C${i + 1}">✕</button>` : ''}</div>`).join('');
      h += `<div style="grid-column:1/-1">${(sc.cs || []).length < 6 ? '<button class="btn" type="button" id="anadec">+ Add capacitor</button>' : ''}</div>` + fila('V', 'Applied voltage', 'V');
      campos.innerHTML = h; return;
    }
    if (tipo === 'fuerza') {
      h += fila('a', 'Length of the plates (where it enters)', 'cm') + fila('w', 'Width of the plates', 'cm') + fila('d', 'Separation', 'mm') + fila('er', 'ε<sub>r</sub> of the slab', '') + fila('x', 'How far it has entered, x', 'cm') + circuito();
      campos.innerHTML = h; return;
    }
    if (tipo === 'conectar') {
      h += fila('C1', 'C₁', 'µF') + fila('V1', 'Charged to V₁', 'V') + fila('C2', 'C₂', 'µF') + fila('V2', 'Charged to V₂', 'V') + `<label for="f-union">The plates are joined</label><select id="f-union" class="in" data-k="union">${opc([['igual', 'of the same sign (+ with +)'], ['opuesta', 'of opposite sign (+ with −)']], sc.union)}</select>`;
      campos.innerHTML = h; return;
    }
    const plano = sc.geo === 'plano', disp = ['paralelo', 'variable'].includes(sc.disposicion) ? sc.disposicion : 'serie', serie = disp === 'serie';
    h += `<label for="f-geo">Shape</label><select id="f-geo" class="in" data-k="geo"><option value="plano">Parallel plate</option><option value="cilindro">Cylindrical</option><option value="esfera">Spherical</option></select>`;
    if (plano) h += fila('S', 'Plate area', 'cm²') + fila('d', 'Separation', 'mm');
    else h += fila('a', 'Inner radius a', 'cm') + fila('b', 'Outer radius b', 'cm') + (sc.geo === 'cilindro' ? fila('L', 'Length', 'cm') : '');
    h += `<label for="f-disp">Dielectric</label><select id="f-disp" class="in" data-k="disposicion"><option value="serie">${plano ? 'In slabs (series)' : 'In layers (series)'}</option><option value="paralelo">${plano ? 'Occupying part of the area (parallel)' : 'By sectors (parallel)'}</option><option value="variable">ε<sub>r</sub> changing with position</option></select>`;
    if (disp === 'variable') {
      h += `<div class="sep">ε<sub>r</sub> linear between the plates</div>` + fila('er1', 'ε<sub>r</sub> next to the + plate', plano ? 'x = 0' : 'r = a') + fila('er2', 'ε<sub>r</sub> next to the − plate', plano ? 'x = d' : 'r = b');
      h += circuito(); campos.innerHTML = h; $('#f-geo').value = sc.geo; $('#f-disp').value = disp; return;
    }
    h += `<div class="sep">Dielectric layers ${serie ? (plano ? '(from the + plate)' : '(from the inner radius)') : plano ? '(% of the area)' : '(% of the surface, by angles)'}</div>`;
    h += (sc.capas || []).map((c, i) => `<div class="capa" data-i="${i}"><b style="background:var(${COLCAPA[i % 3]})"></b><input class="in" data-c="t" value="${esc(c.t)}" aria-label="Layer ${i + 1}: ${serie ? (plano ? 'thickness in mm' : 'outer radius in cm') : 'percentage of the area'}" placeholder="${serie ? (plano ? 'espesor (mm)' : 'hasta r (cm)') : '% of the area'}"><input class="in" data-c="er" value="${esc(c.er)}" aria-label="Layer ${i + 1}: εr" placeholder="εr"><input class="in" data-c="rig" value="${esc(c.rig ?? '')}" aria-label="Layer ${i + 1}: dielectric strength in kV/mm (optional)" placeholder="strength kV/mm"><button class="btn mini" type="button" data-quita="${i}" aria-label="Remove layer ${i + 1}">✕</button></div>`).join('');
    h += `<div style="grid-column:1/-1"><button class="btn" type="button" id="anade">+ Add layer</button> <span class="nota">${serie ? (plano ? 'thickness in mm' : 'outer radius in cm') : plano ? '% of the area' : '% of the surface'} · ε<sub>r</sub> · strength (optional, for the maximum voltage)</span></div>`;
    h += circuito();
    campos.innerHTML = h;
    $('#f-geo').value = sc.geo;
    $('#f-disp').value = disp;
  }
  function circuito() {
    let h = `<div class="sep">Circuit</div><div class="radios"><label><input type="radio" name="fuente" value="V"${sc.fuente !== 'Q' ? ' checked' : ''}> Connected to a battery</label><label><input type="radio" name="fuente" value="Q"${sc.fuente === 'Q' ? ' checked' : ''}> Isolated with charge</label></div>`;
    return h + (sc.fuente === 'Q' ? fila('Q', 'Charge', 'nC') : fila('V', 'Battery voltage', 'V'));
  }
  const fila = (k, nom, u) => `<label for="f-${k}">${nom}${u ? ` <small>(${u})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;

  campos.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.k && t.tagName === 'INPUT') sc[t.dataset.k] = t.value;
    else if (t.dataset.cs !== undefined) sc.cs[+t.dataset.cs] = t.value;
    else if (t.dataset.vm !== undefined) { sc.vm = sc.vm || []; sc.vm[+t.dataset.vm] = t.value; }
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
    if (e.target.dataset.quitac !== undefined) { sc.cs.splice(+e.target.dataset.quitac, 1); if (sc.vm) sc.vm.splice(+e.target.dataset.quitac, 1); formulario(); calcula(); }
    if (e.target.id === 'anade') { (sc.capas = sc.capas || []).push({ t: '', er: '2' }); formulario(); calcula(); }
    const q = e.target.dataset.quita;
    if (q !== undefined) { sc.capas.splice(+q, 1); formulario(); calcula(); }
  });
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + K.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = K.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = JSON.parse(JSON.stringify(e.sc)); sel.value = clave; formulario(); calcula();
  }

  function calcula() {
    const err = $('#error');
    try { sol = K.resolver(sc); } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    err.hidden = true;
    try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {}
    const caja = (n, v, extra) => `<div><span>${n}</span><b>${v}</b>${extra ? `<small>${extra}</small>` : ''}</div>`;
    $('#grafica').hidden = sol.tipo !== 'condensador' && sol.tipo !== 'fuerza';
    if (sol.tipo === 'asociacion') {
      $('#resumen').innerHTML = caja('Equivalent capacitance', cu(sol.Ceq, 'F')) + caja('Total charge', cu(sol.Q, 'C')) + caja('Voltage', cu(sol.V, 'V')) + caja('Energy', cu(sol.U, 'J'));
      $('#regiones').innerHTML = `<thead><tr><th>Capacitor</th><th>C</th><th>Q</th><th>V</th><th>U</th>${sol.ruptura ? '<th>V breakdown</th><th>Network max. V</th>' : ''}</tr></thead><tbody>${sol.cs.map((c, i) => { const r = sol.ruptura && sol.ruptura.lista.find((x) => x.i === i); return `<tr><td>C<sub>${i + 1}</sub>${sol.ruptura && sol.ruptura.primero === i ? ' ⚠' : ''}</td><td>${cu(c, 'F')}</td><td>${cu(sol.q[i], 'C')}</td><td>${cu(sol.v[i], 'V')}</td><td>${cu(sol.u[i], 'J')}</td>${sol.ruptura ? `<td>${r ? cu(r.vm, 'V') : '—'}</td><td>${r ? cu(r.Vred, 'V') : '—'}</td>` : ''}</tr>`; }).join('')}</tbody>`;
      if (sol.ruptura) $('#resumen').innerHTML += caja('Maximum voltage of the network', cu(sol.ruptura.Vmax, 'V'), `C${sol.ruptura.primero + 1} breaks first`);
    } else if (sol.tipo === 'fuerza') {
      $('#resumen').innerHTML = caja('Force on the slab', cu(sol.Fd, 'N'), 'inward') + caja('Force between plates', cu(sol.Fp, 'N'), 'attraction') + caja('Capacitance', cu(sol.C, 'F'), `empty ${cu(sol.C0, 'F')}`) + caja(sol.aislado ? 'Voltage' : 'Charge', sol.aislado ? cu(sol.V, 'V') : cu(sol.Q, 'C')) + caja('Energy', cu(sol.U, 'J')) + caja('ΔU on fully inserting it', cu(sol.dU, 'J')) + caja('Work of the field', cu(sol.Wcampo, 'J')) + caja('Work of the battery', sol.aislado ? '0' : cu(sol.Wbat, 'J'));
      $('#regiones').innerHTML = `<thead><tr><th>Position</th><th>C</th><th>U</th><th>F on the slab</th></tr></thead><tbody>${[['x = 0 (empty)', 0], ['x ahora', sol.x], ['x = a (whole)', sol.a]].map(([n, t]) => { const C = sol.Cx(t), U = sol.aislado ? (sol.Q * sol.Q) / (2 * C) : 0.5 * C * sol.V * sol.V; return `<tr><td>${n}</td><td>${cu(C, 'F')}</td><td>${cu(U, 'J')}</td><td>${cu(sol.F(t), 'N')}</td></tr>`; }).join('')}</tbody>`;
    } else if (sol.tipo === 'conectar') {
      $('#resumen').innerHTML = caja('Final voltage', cu(sol.Vf, 'V')) + caja('Total charge', cu(Math.abs(sol.Qt), 'C')) + caja('Energy before', cu(sol.U0, 'J')) + caja('Lost energy', cu(sol.perdida, 'J'), `queda ${cu(sol.Uf, 'J')}`);
      $('#regiones').innerHTML = `<thead><tr><th></th><th>C</th><th>Q before</th><th>V before</th><th>Q after</th><th>V after</th></tr></thead><tbody>${[[sol.C1, sol.Q1, sol.V1], [sol.C2, sol.Q2, sol.V2]].map(([c, q, v], i) => `<tr><td>C<sub>${i + 1}</sub></td><td>${cu(c, 'F')}</td><td>${cu(q, 'C')}</td><td>${cu(v, 'V')}</td><td>${cu(c * sol.Vf, 'C')}</td><td>${cu(sol.Vf, 'V')}</td></tr>`).join('')}</tbody>`;
    }
    if (sol.tipo !== 'condensador') { $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join(''); dibuja(); return; }
    const c = sol.comp;
    $('#resumen').innerHTML = caja('Capacitance', cu(sol.C, 'F'), c ? `empty: ${cu(c.C0, 'F')} (×${K.num(sol.C / c.C0, 3)})` : '') +
      caja('Charge', cu(sol.Q, 'C'), c && sol.fuente === 'V' ? `empty: ${cu(c.Q0, 'C')}` : '') +
      caja('Voltage', cu(sol.V, 'V'), c && sol.fuente === 'Q' ? `empty: ${cu(c.V0, 'V')}` : '') +
      caja('Energy', cu(sol.U, 'J'), c ? `empty: ${cu(c.U0, 'J')}` : '') +
      (sol.Vmax ? caja('Maximum voltage', cu(sol.Vmax, 'V'), 'before breakdown') : '') +
      (sol.letras ? `<div class="ancho"><span>Capacitance in letters</span>${Mates.html(`$${sol.letras}$`)}${sol.letrasNota ? `<small>${Mates.html(sol.letrasNota.replace(/^(\S+):/, '$$$1$$:'))}</small>` : ''}</div>` : '');
    const serie = sol.g.disposicion !== 'paralelo', plano = sol.g.geo === 'plano';
    const rango = (a, b, u) => (Math.abs(a - b) <= 1e-9 * Math.abs(a) ? cu(a, u) : `${cu(a, u)} → ${cu(b, u)}`);
    $('#regiones').innerHTML = `<thead><tr><th>Region</th><th>${serie ? (plano ? 'Thickness' : 'Radii') : plano ? 'Area' : 'Surface'}</th><th>E</th><th>D</th><th>P</th><th>${serie ? 'ΔV' : 'Free charge'}</th><th>Q polarization</th></tr></thead><tbody>${sol.regiones.map((o) => `<tr><td>${o.nombre}</td>
      <td>${serie ? (plano ? cu(o.hasta - o.desde, 'm') : `${K.num(o.desde * 100)}–${K.num(o.hasta * 100)} cm`) : `${K.num(o.fraccion * 100)} %`}</td>
      <td>${rango(o.E1, o.E2, 'V/m')}</td><td>${rango(o.D1, o.D2, 'C/m²')}</td><td>${o.vacio ? '0' : rango(o.P1, o.P2, 'C/m²')}</td><td>${serie ? cu(o.V, 'V') : cu(o.Q, 'C')}</td><td>${o.vacio ? '—' : '±' + cu(o.Qp, 'C')}</td></tr>`).join('')}</tbody>`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibuja();
  }

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
  function placas(g, x, y, nombre, carga) {
    g.strokeStyle = col['--ink']; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 5, y - 16); g.lineTo(x - 5, y + 16); g.moveTo(x + 5, y - 16); g.lineTo(x + 5, y + 16); g.stroke();
    g.fillStyle = col['--ink']; g.fillText(nombre, x, y - 26); if (carga) { g.fillStyle = col['--muted']; g.fillText(carga, x, y + 28); }
  }
  function esquema(g, w, h) {
    const lin = (pts) => { g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }, t = (x) => texto(cu(x, 'V'));
    if (sol.tipo === 'fuerza') {
      const x0 = w * 0.18, x1 = w * 0.72, yc = h / 2, sep = Math.min(40, h * 0.18), f = Math.min(1, sol.x / sol.a);
      g.fillStyle = col['--capa']; g.fillRect(x1 - f * (x1 - x0) , yc - sep / 2, f * (x1 - x0) + w * 0.12, sep);
      g.fillStyle = col['--pos']; g.fillRect(x0, yc - sep / 2 - 8, x1 - x0, 8); g.fillStyle = col['--neg']; g.fillRect(x0, yc + sep / 2, x1 - x0, 8);
      g.strokeStyle = col['--campo']; g.fillStyle = col['--campo']; g.lineWidth = 1.2;
      for (let k = 0; k < 9; k++) { const xx = x0 + 10 + (k / 8) * (x1 - x0 - 20); flecha(g, xx, yc - sep / 2 + 3, xx, yc + sep / 2 - 3, 4); }
      g.strokeStyle = col['--accent']; g.fillStyle = col['--accent']; g.lineWidth = 2.4; flecha(g, x1 + w * 0.16, yc, x1 + w * 0.02 , yc, 8);
      g.fillStyle = col['--ink']; g.fillText('F on the slab: ' + texto(cu(sol.Fd, 'N')), x1 + w * 0.09, yc + sep / 2 + 34);
      g.fillStyle = col['--muted']; g.fillText(`${texto(K.num(sol.x * 100))} of ${texto(K.num(sol.a * 100))} cm inside · εr = ${texto(K.num(sol.er))}`, w / 2, h - 14);
      g.fillStyle = col['--pos']; g.fillText('+', x0 - 12, yc - sep / 2 - 4); g.fillStyle = col['--neg']; g.fillText('−', x0 - 12, yc + sep / 2 + 4);
      return;
    }
    if (sol.tipo === 'conectar') {
      const y = h / 2, x1 = w * 0.35, x2 = w * 0.65;
      lin([[x1, y - 40], [x2, y - 40]]); lin([[x1, y + 40], [x2, y + 40]]); lin([[x1, y - 40], [x1, y - 16]]); lin([[x1, y + 16], [x1, y + 40]]); lin([[x2, y - 40], [x2, y - 16]]); lin([[x2, y + 16], [x2, y + 40]]);
      g.save(); g.translate(x1, y); g.rotate(Math.PI / 2); placas(g, 0, 0, '', ''); g.restore(); g.save(); g.translate(x2, y); g.rotate(Math.PI / 2); placas(g, 0, 0, '', ''); g.restore();
      g.fillStyle = col['--ink']; g.fillText('C₁', x1 - 30, y); g.fillText('C₂', x2 + 30, y);
      g.fillStyle = col['--muted']; g.fillText(`${sol.op ? '+ with −' : '+ with +'} · final V = ${t(sol.Vf)}`, w / 2, h - 16);
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
    if (sol.tipo !== 'condensador') { g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; esquema(g, w, h); if (sol.tipo === 'fuerza') graficaFuerza(); return; }
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
      g.fillStyle = col['--muted']; g.textAlign = 'left'; g.fillText(G.geo === 'cilindro' ? 'section perpendicular to the axis' : 'section through the centre', 8, h - 10);
    }
    grafica();
  }

  function graficaFuerza() {
    const { g, w, h } = lienzo($('#grafica')), l = 84, r = 26, top = 14, b = 26, n = 100, ys = [];
    for (let i = 0; i <= n; i++) ys.push(sol.F((sol.a * i) / n));
    const Fm = Math.max(...ys) * 1.15 || 1, X = (x) => l + (x / sol.a) * (w - l - r), Y = (f) => h - b - (f / Fm) * (h - top - b);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.fillStyle = col['--muted']; g.font = '11px "IBM Plex Mono", monospace'; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const u of [0, 0.5, 1]) { const f = (u * Fm) / 1.15; g.beginPath(); g.moveTo(l, Y(f)); g.lineTo(w - r, Y(f)); g.stroke(); g.fillText(texto(cu(f, 'N')), l - 4, Y(f)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let i = 0; i <= 4; i++) g.fillText(`${texto(K.num(((sol.a * i) / 4) * 100, 3))} cm`, X((sol.a * i) / 4), h - b + 6);
    g.strokeStyle = col['--accent']; g.lineWidth = 2; g.beginPath(); ys.forEach((f, i) => (i ? g.lineTo(X((sol.a * i) / n), Y(f)) : g.moveTo(X(0), Y(f)))); g.stroke();
    g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(sol.x), Y(sol.Fd), 4, 0, 2 * Math.PI); g.fill();
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.fillText('F(x) on the slab', l + 6, top - 2);
  }
  function grafica() {
    if (sol.tipo === 'fuerza') return graficaFuerza();
    if (sol.tipo !== 'condensador') return;
    const { g, w, h } = lienzo($('#grafica'));
    const G = sol.g, ini = G.geo === 'plano' ? 0 : G.a, fin = G.geo === 'plano' ? G.d : G.b;
    const l = 84, r = 26, top = 14, b = 26;
    const pts = [];
    for (let i = 0; i <= 400; i++) { const x = ini + ((fin - ini) * i) / 400; pts.push([x, K.campo(sol, x)]); }
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

