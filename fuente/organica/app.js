/* =====================================================================
   Interfaz de Nomenclatura orgánica e isomería en 3D: el SMILES, los resultados
   (nombre IUPAC, fórmula, grupos, centros R/S, E/Z), la molécula en 3D que
   se gira con el ratón, el dedo o el teclado, la tabla de estereoisómeros,
   los isómeros constitucionales y el desarrollo. El cálculo está en
   organica/calculo.js (Organica) y los ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc) en localStorage['organica-v1'] en cada cambio.
   Expone window.OrganicaApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const P = Organica, CLAVE = 'organica-v1';

  const inicial = () => copia(P.ejemplos.find((e) => e.clave === 'butan2ol-s').sc);
  let sc = inicial();
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g.smiles === 'string') sc = { smiles: g.smiles }; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vista = { yaw: 0.6, pitch: 0.35, zoom: 1, giro: !reducido, h: true, rs: true };

  /* ---------- Ejemplos y entrada ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); $('#smiles').value = sc.smiles; if (entrada === 'semi') $('#semi').value = semiDe(sc.smiles); calcula(); sel.value = clave;
  }
  const pon = (smiles) => { sc = { smiles }; $('#smiles').value = smiles; if (entrada === 'semi') $('#semi').value = semiDe(smiles); sel.value = ''; calcula(); };
  $('#smiles').addEventListener('input', (e) => { sc = { smiles: e.target.value }; sel.value = ''; calcula(); });
  // entrada semidesarrollada (OR-3): se convierte a SMILES y todo lo demás sigue igual
  let entrada = 'smiles';
  const semiDe = (smiles) => { try { return Semi.deSmiles(smiles); } catch (e) { return ''; } };
  function modoEntrada(m) {
    entrada = m;
    $('#tab-smiles').setAttribute('aria-selected', String(m === 'smiles')); $('#tab-semi').setAttribute('aria-selected', String(m === 'semi'));
    $('#p-smiles').hidden = m !== 'smiles'; $('#nota-smiles').hidden = m !== 'smiles'; $('#p-semi').hidden = m !== 'semi';
    if (m === 'semi') $('#semi').value = semiDe(sc.smiles);
  }
  $('#tab-smiles').addEventListener('click', () => modoEntrada('smiles')); $('#tab-semi').addEventListener('click', () => modoEntrada('semi'));
  $('#semi').addEventListener('input', (e) => {
    sel.value = '';
    try { const r = Semi.aSmiles(e.target.value); sc = { smiles: r.smiles }; $('#smiles').value = r.smiles; calcula(); }
    catch (er) { sc = { smiles: '' }; $('#smiles').value = ''; calcula(); $('#error').textContent = er.message; $('#error').hidden = false; }
  });
  $('#grupos-semi').innerHTML = Semi.GRUPOS.map(([et, tx]) => `<button type="button" class="btn" data-t="${tx}" aria-label="Insertar ${et}">${et}</button>`).join('');
  $('#grupos-semi').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-t]'); if (!b) return;
    const inp = $('#semi'), t = b.dataset.t, a = inp.selectionStart ?? inp.value.length, z = inp.selectionEnd ?? a;
    inp.value = inp.value.slice(0, a) + t + inp.value.slice(z);
    const pos = a + (t === '()' ? 1 : t.length); inp.focus(); inp.setSelectionRange(pos, pos); inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  $('#b-espejo').addEventListener('click', () => { if (sol) pon(P.enantiomero(sol.smiles)); });
  // una molécula con nombre fácil de comprobar, para el modo práctica
  const practicables = P.ejemplos.filter((e) => !/tartarico|dicloropentano/.test(e.clave));
  const azar = () => abrirEjemplo(practicables[Math.floor(Math.random() * practicables.length)].clave);
  const enunciado = () => `Escribe el nombre IUPAC de la molécula con SMILES <b>${esc(sc.smiles)}</b> (míralo en 3D si hace falta), cuántos centros quirales tiene y cuántos estereoisómeros.`;

  /* ---------- Resultados ---------- */
  const dato = (t, v, extra = '', id = '') => `<div${extra}><span>${t}</span><b${id ? ` id="${id}"` : ''}>${v}</b></div>`;
  const pintaDesc = (s) => s.centros.map((c) => c.label || '?').join('') || '—';
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      for (const id of ['#resumen', '#titulo-mol', '#pasos', '#leyenda']) $(id).innerHTML = '';
      $('#c-estereo').hidden = true; $('#c-iso').hidden = true; $('#b-espejo').hidden = true; dibuja(); return;
    }
    err.hidden = true; guarda();
    const E = sol.estereo, nCentros = E.centros.length, nDobles = E.dobles.length;
    $('#titulo-mol').textContent = sol.nombre || '(sin nombre)';
    const desc = [...E.centros.map((c) => c.label || '?'), ...E.dobles.map((d) => d.label || '?'), ...(E.anillo && E.anillo.relacion ? [E.anillo.relacion] : [])];
    const quiral = !E.completo && (nCentros || E.anillo) ? 'Falta indicar @ o @@' : E.quiral ? 'Quiral' : nCentros ? 'Aquiral (forma meso)' : 'Aquiral';
    const nEst = E.lista ? E.lista.length : null;
    $('#resumen').innerHTML = (sol.nombre ? '' : dato('Nombre', esc(sol.errorNombre), ' class="ancho"'))
      + dato('Fórmula semidesarrollada', esc(semiDe(sol.smiles)) || '—', ' class="ancho"', 'r-semi') + dato('Fórmula molecular', sol.formula) + dato('Masa molar', `${sol.masa.toFixed(2).replace('.', ',')} g/mol`)
      + (sol.alias ? dato('Nombre sistemático', esc(sol.alias), ' class="ancho"') : '')
      + dato('Grupos funcionales', sol.grupos.length ? sol.grupos.join(', ') : 'ninguno (alcano)', ' class="ancho"')
      + (sol.anillo ? dato('Anillo', `${sol.anillo.aromatico ? 'benceno (aromático)' : `de ${sol.anillo.n} carbonos`}${sol.anillo.posicion ? ' · ' + sol.anillo.posicion.tipo : ''}${sol.anillo.relacion ? ' · ' + sol.anillo.relacion : ''}`) : '')
      + dato('Centros quirales', nCentros, ' class="num"', 'r-nc') + dato('Dobles enlaces E/Z', nDobles, ' class="num"')
      + dato('Configuración', desc.length ? desc.join(', ') : '—') + dato('Quiralidad', quiral)
      + dato('Estereoisómeros', nEst === null ? `hasta ${E.nTeorico}` : nEst, ' class="num"', 'r-ne');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${esc(p.t)}</strong>${p.html}</li>`).join('');
    $('#b-espejo').hidden = !E.quiral;
    $('#leyenda').textContent = `Arrastra para girar. Gris: carbono; rojo: oxígeno; azul: nitrógeno; verde: halógeno; claro: hidrógeno. ${nCentros ? 'El anillo morado marca los centros quirales' + (vista.rs ? ' con su letra R o S' : '') + '.' : ''}${sol.anillo ? ' En el anillo, los sustituyentes que salen hacia el mismo lado del plano son cis y los de lados opuestos, trans.' : ''}`;
    estereoisomeros(); isomeros(); dibuja();
  }

  function estereoisomeros() {
    const E = sol.estereo, c = $('#c-estereo');
    if (!E.centros.length && !E.dobles.length && !E.anillo) { c.hidden = true; return; }
    c.hidden = false;
    if (!E.lista) { $('#n-estereo').textContent = `Hay hasta ${E.nTeorico} estereoisómeros; con tantos centros no hago el listado.`; $('#t-estereo').innerHTML = ''; return; }
    const n = E.lista.length;
    $('#n-estereo').textContent = `${n} estereoisómero${n > 1 ? 's' : ''} distinto${n > 1 ? 's' : ''} (de ${E.nTeorico} combinaciones posibles${n < E.nTeorico ? ': el resto son la misma molécula por simetría, como las formas meso' : ''}).`
      + (E.completo ? '' : ' Indica @ o @@ en tu SMILES para ver cuál eres.');
    const sig = (r) => ({ este: '← el que ves', enantiómero: 'enantiómero del que ves', diastereoisómero: 'diastereoisómero del que ves' }[r] || '');
    $('#t-estereo').innerHTML = '<thead><tr><th>Nombre</th><th>Quiral</th><th>Relación</th><th><span class="solo-lector">Ver en 3D</span></th></tr></thead><tbody>'
      + E.lista.map((v) => `<tr${v.rel === 'este' ? ' class="activa"' : ''}><td>${esc(v.nombre || v.smiles)}${v.anillo ? ` <b>(${v.anillo})</b>` : ''}<br><code>${esc(v.smiles)}</code></td><td>${v.quiral ? 'sí' : 'no'}</td><td>${sig(v.rel)}</td><td><button class="btn" data-s="${esc(v.smiles)}" aria-label="Ver ${esc(v.nombre || v.smiles)} en 3D">Ver en 3D</button></td></tr>`).join('') + '</tbody>';
  }
  function isomeros() {
    const c = $('#c-iso'), L = sol.isomeros;
    if (!L) {
      c.hidden = false;
      const m = /^C(\d+)H(\d+)$/.exec(sol.formulaPlano), n = m && +m[1], alc = m && +m[2] === 2 * n + 2 && P.ALCANOS[n - 1];
      $('#n-iso').textContent = alc ? `El ${P.NUM[n]}ano, C${n}H${2 * n + 2}, tiene ${alc} isómeros constitucionales (de cadena).` : `No tengo la lista de los isómeros de ${sol.formulaPlano}. Prueba con C4H10, C5H12, C5H10, C3H6, C4H8, C2H6O, C3H8O, C3H6O, C4H10O, C3H6O2, C7H8O o C8H10.`;
      $('#t-iso').innerHTML = ''; return;
    }
    c.hidden = false;
    $('#n-iso').textContent = `Compuestos de fórmula ${sol.formula} (misma fórmula, distinta unión de átomos; en cadena o con anillo): ${L.length}.`;
    $('#t-iso').innerHTML = '<thead><tr><th>Nombre</th><th>SMILES</th><th><span class="solo-lector">Ver en 3D</span></th></tr></thead><tbody>'
      + L.map((v) => `<tr${v.smiles === sol.smiles ? ' class="activa"' : ''}><td>${esc(v.nombre || '—')}</td><td><code>${esc(v.smiles)}</code></td><td><button class="btn" data-s="${esc(v.smiles)}" aria-label="Ver ${esc(v.nombre || v.smiles)} en 3D">Ver en 3D</button></td></tr>`).join('') + '</tbody>';
  }
  for (const id of ['#t-estereo', '#t-iso']) $(id).addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-s]'); if (!b) return;
    pon(b.dataset.s); $('#molecula').scrollIntoView({ block: 'center', behavior: reducido ? 'auto' : 'smooth' });
  });

  /* ---------- Molécula en 3D ---------- */
  const COLOR = { H: '--at-h', C: '--at-c', O: '--at-o', N: '--at-n', S: '--at-s', F: '--at-hal', Cl: '--at-hal', Br: '--at-hal', I: '--at-hal' };
  const RADIO = { H: 0.3, C: 0.5, N: 0.5, O: 0.5, S: 0.62, F: 0.45, Cl: 0.62, Br: 0.7, I: 0.8 };
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--panel', '--at-h', '--at-c', '--at-o', '--at-n', '--at-s', '--at-hal', '--at-quiral']) col[k] = cs.getPropertyValue(k).trim(); }
  const rgb = (h) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h) || [0, '80', '80', '80']; return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]; };
  const mezcla = (h, t, con = [255, 255, 255]) => { const c = rgb(h); return `rgb(${c.map((x, i) => Math.round(x + (con[i] - x) * t)).join(',')})`; };
  const oscuro = (h) => { const c = rgb(h); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] < 140; };

  function dibuja() {
    const { g, w, h } = lienzo('#molecula');
    if (!sol || !w || !h) return;
    const cy = Math.cos(vista.yaw), sy = Math.sin(vista.yaw), cp = Math.cos(vista.pitch), sp = Math.sin(vista.pitch);
    const E = (Math.min(w * 0.95, h) * 0.56 / sol.radio) * vista.zoom, F = 7 * sol.radio / 3;
    const P3 = (v) => {
      const x1 = v[0] * cy + v[2] * sy, z1 = -v[0] * sy + v[2] * cy;
      const y2 = v[1] * cp - z1 * sp, z2 = v[1] * sp + z1 * cp, q = F / (F - z2);
      return { x: w / 2 + x1 * E * q, y: h / 2 - y2 * E * q, z: z2, q };
    };
    const visible = (k) => vista.h || sol.atomos[k].sim !== 'H';
    const pts = sol.atomos.map((a) => P3(a.p)), obj = [];
    for (const e of sol.enlaces) {
      if (!visible(e.a) || !visible(e.b)) continue;
      const p = pts[e.a], q = pts[e.b];
      obj.push({ z: (p.z + q.z) / 2, f: () => {
        const dx = q.x - p.x, dy = q.y - p.y, n = Math.hypot(dx, dy) || 1, ox = -dy / n, oy = dx / n, sep = 3.2 * (p.q + q.q) / 2;
        g.strokeStyle = col['--muted']; g.lineCap = 'round'; g.lineWidth = Math.max(1.8, 0.06 * E * (e.o > 1 ? 0.55 : 0.9) * (p.q + q.q) / 2);
        const offs = e.o === 1 ? [0] : e.o === 2 ? [-0.5, 0.5] : [-1, 0, 1];
        for (const s of offs) { g.beginPath(); g.moveTo(p.x + ox * s * sep * 1.6, p.y + oy * s * sep * 1.6); g.lineTo(q.x + ox * s * sep * 1.6, q.y + oy * s * sep * 1.6); g.stroke(); }
      } });
    }
    const quirales = new Map(sol.estereo.centros.map((c) => [c.i, c.label]));
    sol.atomos.forEach((a, k) => {
      if (!visible(k)) return;
      const p = pts[k], r = (RADIO[a.sim] || 0.5) * 0.8 * E * p.q * (a.sim === 'H' ? 0.75 : 0.9);
      obj.push({ z: p.z, f: () => {
        const c = col[COLOR[a.sim]] || col['--at-c'];
        const gr = g.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
        gr.addColorStop(0, mezcla(c, 0.6)); gr.addColorStop(0.55, c); gr.addColorStop(1, mezcla(c, 0.45, [0, 0, 0]));
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.fill();
        if (a.sim !== 'H' && r > 9) { g.fillStyle = oscuro(c) ? '#fff' : '#111'; g.font = `600 ${Math.max(10, Math.round(r * 0.85))}px "IBM Plex Sans", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.sim, p.x, p.y + 1); }
        if (a.i !== undefined && quirales.has(a.i)) {
          g.strokeStyle = col['--at-quiral']; g.lineWidth = 2.4; g.beginPath(); g.arc(p.x, p.y, r + 5, 0, 7); g.stroke();
          const l = quirales.get(a.i);
          if (vista.rs && l) { g.font = '700 19px "STIX Two Text", serif'; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.lineWidth = 4; g.strokeStyle = col['--bg']; g.strokeText(l, p.x, p.y - r - 7); g.fillStyle = col['--at-quiral']; g.fillText(l, p.x, p.y - r - 7); }
        }
      } });
    });
    obj.sort((p, q) => p.z - q.z);
    for (const o of obj) o.f();
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  /* ---------- Giro: ratón, dedo, teclado y giro automático ---------- */
  const cv = $('#molecula');
  let arrastra = null, raf = 0;
  const tope = (p) => Math.max(-1.5, Math.min(1.5, p));
  cv.addEventListener('pointerdown', (e) => { arrastra = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.focus({ preventScroll: true }); });
  cv.addEventListener('pointermove', (e) => {
    if (!arrastra) return;
    vista.yaw += (e.clientX - arrastra.x) * 0.012; vista.pitch = tope(vista.pitch + (e.clientY - arrastra.y) * 0.012);
    arrastra = { x: e.clientX, y: e.clientY }; dibuja();
  });
  const suelta = () => { arrastra = null; };
  cv.addEventListener('pointerup', suelta); cv.addEventListener('pointercancel', suelta);
  cv.addEventListener('wheel', (e) => { if (document.activeElement !== cv) return; e.preventDefault(); vista.zoom = Math.max(0.5, Math.min(2.5, vista.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1))); dibuja(); }, { passive: false });
  cv.addEventListener('keydown', (e) => {
    const paso = 0.15, k = e.key;
    if (k === 'ArrowLeft') vista.yaw -= paso; else if (k === 'ArrowRight') vista.yaw += paso;
    else if (k === 'ArrowUp') vista.pitch = tope(vista.pitch - paso); else if (k === 'ArrowDown') vista.pitch = tope(vista.pitch + paso);
    else if (k === '+' || k === '=') vista.zoom = Math.min(2.5, vista.zoom * 1.1); else if (k === '-') vista.zoom = Math.max(0.5, vista.zoom / 1.1);
    else return;
    e.preventDefault(); dibuja();
  });
  function bucle() {
    raf = 0;
    if (!vista.giro || document.hidden) return;
    if (!arrastra) { vista.yaw += 0.008; dibuja(); }
    raf = requestAnimationFrame(bucle);
  }
  const arranca = () => { if (vista.giro && !raf) raf = requestAnimationFrame(bucle); };
  document.addEventListener('visibilitychange', arranca);
  const interruptor = (id, k) => {
    const b = $(id); b.setAttribute('aria-pressed', String(vista[k]));
    b.addEventListener('click', () => { vista[k] = !vista[k]; b.setAttribute('aria-pressed', String(vista[k])); k === 'giro' ? arranca() : dibuja(); });
  };
  interruptor('#b-giro', 'giro'); interruptor('#b-h', 'h'); interruptor('#b-rs', 'rs');
  $('#b-reinicio').addEventListener('click', () => { Object.assign(vista, { yaw: 0.6, pitch: 0.35, zoom: 1 }); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('organica').current;
  colores(); $('#smiles').value = sc.smiles; calcula(); arranca();
  window.OrganicaApp = {
    abrirEjemplo, azar, enunciado, pon,
    resultado: () => sol && { nombre: sol.nombre, alias: sol.alias, anillo: sol.anillo, formula: sol.formulaPlano, centros: sol.estereo.centros.map((c) => c.label), dobles: sol.estereo.dobles.map((d) => d.label), estereoisomeros: sol.estereo.lista ? sol.estereo.lista.length : null },
    estado: () => copia(sc), vista: () => ({ ...vista }),
  };
})();
