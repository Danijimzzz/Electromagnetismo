/* =====================================================================
   Interfaz de la geometría molecular VSEPR: la fórmula (o el tipo AXₙEₘ),
   los resultados (dominios, geometría, ángulos, hibridación y polaridad),
   la molécula en 3D que se gira con el ratón, el dedo o el teclado, el
   desarrollo y la tabla de todas las geometrías. El cálculo está en
   vsepr/calculo.js (Vsepr, que usa Formulas y Elementos de quimica/) y
   los ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc) en localStorage['vsepr-v1'] en cada cambio.
   Expone window.VseprApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const P = Vsepr, CLAVE = 'vsepr-v1', G = P.GEOMETRIAS;

  const inicial = () => ({ ...copia(P.ejemplos[0].sc), n: '3', m: '1' });
  let sc = inicial();
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = { ...sc, ...g }; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, lew = null, col = {};
  // vista 3D
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vista = { yaw: 0.6, pitch: 0.35, zoom: 1, giro: !reducido, libres: true, dipolo: true };

  /* ---------- Formulario ---------- */
  function formulario() {
    const axe = sc.modo === 'axe';
    const cad = sc.modo === 'cadena', fm = !axe && !cad;
    $('#formula').value = sc.formula ?? ''; $('#f-n').value = sc.n ?? ''; $('#f-m').value = sc.m ?? ''; $('#cadena').value = sc.cadena ?? ''; $('#octeto').checked = !!sc.octeto;
    $('#tab-formula').setAttribute('aria-selected', String(fm)); $('#tab-axe').setAttribute('aria-selected', String(axe)); $('#tab-cadena').setAttribute('aria-selected', String(cad));
    $('#p-formula').hidden = !fm; $('#p-axe').hidden = !axe; $('#p-cadena').hidden = !cad;
  }
  $('#formula').addEventListener('input', (e) => { sc.formula = e.target.value; $('#ejemplos').value = ''; calcula(); });
  $('#p-axe').addEventListener('input', (e) => { const k = e.target.dataset.k; if (!k) return; sc[k] = e.target.value; $('#ejemplos').value = ''; calcula(); });
  $('#cadena').addEventListener('input', (e) => { sc.cadena = e.target.value; $('#ejemplos').value = ''; calcula(); });
  $('#octeto').addEventListener('change', (e) => { sc.octeto = e.target.checked; calcula(); });
  for (const [id, modo] of [['#tab-formula', 'formula'], ['#tab-axe', 'axe'], ['#tab-cadena', 'cadena']]) $(id).addEventListener('click', () => { sc.modo = modo; formulario(); calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  const EC = Lewis.ejemplosCadena.map((e) => ({ clave: 'c-' + e.clave, nombre: e.nombre, sc: { modo: 'cadena', cadena: e.texto } }));
  sel.innerHTML = '<option value="">Ejemplos…</option><optgroup label="' + 'Un átomo central' + '">' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('') + '</optgroup><optgroup label="' + 'Varios centros (semidesarrollada)' + '">' + EC.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('') + '</optgroup>';
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave) || EC.find((x) => x.clave === clave);
    if (!e) return;
    sc = { ...inicial(), ...copia(e.sc) }; formulario(); calcula(); sel.value = clave;
  }
  // un ejemplo con fórmula y neutro al azar, para el modo práctica
  const neutros = P.ejemplos.filter((e) => e.sc.modo === 'formula' && !/[+\-]$/.test(e.sc.formula));
  const azar = () => abrirEjemplo(neutros[Math.floor(Math.random() * neutros.length)].clave);
  const enunciado = () => `Para <b>${sol && sol.formula ? sol.formula : esc(sc.formula)}</b> indica cuántos dominios de electrones y pares libres tiene el átomo central, su geometría molecular, su hibridación y si la molécula es polar o apolar.`;

  /* ---------- Resultados ---------- */
  const dato = (t, v, extra = '', id = '') => `<div${extra}><span>${t}</span><b${id ? ` id="${id}"` : ''}>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    if (sc.modo === 'cadena') return calculaCadena();
    $('#card-3d').hidden = false; $('#card-centros').hidden = true;
    try { sol = P.resolver(sc); } catch (e) {
      $('#card-lewis').hidden = true;
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#titulo-mol').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; marcaTabla(); dibuja(); return;
    }
    err.hidden = true; guarda();
    $('#titulo-mol').innerHTML = (sol.formula ? sol.formula + ' · ' : '') + sol.tipoHtml;
    $('#resumen').innerHTML = dato('Tipo', sol.tipoHtml)
      + dato('Dominios de electrones', sol.sn, ' class="num"') + dato('Pares libres', sol.e, ' class="num"')
      + dato('Geometría electrónica', sol.ele.toLowerCase())
      + dato('Geometría molecular', sol.geo, '', 'r-geo')
      + dato('Hibridación del central', sol.hib, '', 'r-hib')
      + dato('Polaridad', sol.polaridad, '', 'r-pol')
      + dato('Ángulo de enlace', `ideal ${sol.ideal}<br><small>real: ${sol.real}</small>`, ' class="ancho"');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = `Arrastra para girar. ${sol.e ? 'Las nubes moradas son los pares libres. ' : ''}${sol.polar && !sol.carga ? 'La flecha roja es el momento dipolar, hacia el extremo negativo (δ−). ' : ''}Otros con esta forma: ${sol.ejemplos}.`;
    lewis(); marcaTabla(); dibuja();
  }

  /* ---------- Estructura de Lewis ---------- */
  const filasAtomos = (r) => '<thead><tr><th>Átomo</th><th>Vecinos</th><th>Enlaces (suma)</th><th>Pares libres</th><th>Carga formal</th></tr></thead><tbody>' + r.atomos.map((a, i) => `<tr><td>${a.sim}${i + 1}</td><td>${a.en.length}</td><td>${a.en.reduce((t, b) => t + b.o, 0)}</td><td>${a.lp}</td><td>${a.fc > 0 ? '+' : a.fc < 0 ? '−' : ''}${Math.abs(a.fc)}</td></tr>`).join('') + '</tbody>';
  const num = (x) => String(+x.toFixed(2)).replace('.', ',');
  function pintaLewis(r, lista) {
    $('#card-lewis').hidden = false; $('#lewis-nota').textContent = '';
    $('#lewis-fig').innerHTML = r.svg;
    $('#lewis-resumen').innerHTML = dato('Enlaces', r.enlaces, ' class="num"') + dato('Pares libres', r.atomos.reduce((t, a) => t + a.lp, 0), ' class="num"')
      + (lista ? dato('Estructuras resonantes', r.resonancia, ' class="num"', 'l-res') : '')
      + (r.ordenes.length ? dato('Orden de enlace', r.ordenes.map((o) => `${o.par}: ${num(o.medio)}`).join('<br>'), ' class="ancho"', 'l-orden') : '');
    $('#lewis-tabla').innerHTML = filasAtomos(r);
  }
  function lewis() {
    $('#lab-octeto').hidden = false;
    let r = null;
    try { r = Lewis.centro(sol.atomos[0].sim, sol.atomos.slice(1).map((a) => a.sim), sol.carga, !!sc.octeto); } catch (e) {
      lew = null; $('#card-lewis').hidden = true; return;
    }
    lew = r; pintaLewis(r, true);
    $('#pasos').innerHTML += r.pasos.map((p) => `<li><strong>Lewis · ${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
  }
  function calculaCadena() {
    const err = $('#error'); sol = null; lew = null;
    $('#card-3d').hidden = true;
    try { lew = Lewis.condensada(sc.cadena); } catch (e) {
      err.textContent = e.message; err.hidden = false; $('#resumen').innerHTML = ''; $('#titulo-mol').innerHTML = ''; $('#pasos').innerHTML = ''; $('#card-lewis').hidden = true; $('#card-centros').hidden = true; return;
    }
    err.hidden = true; guarda();
    $('#lab-octeto').hidden = true;
    $('#titulo-mol').innerHTML = esc(sc.cadena);
    $('#resumen').innerHTML = dato('Átomos', lew.atomos.length, ' class="num"') + dato('Centros con geometría', lew.centros.length, ' class="num"', 'r-ncentros')
      + dato('Enlaces', lew.enlaces, ' class="num"') + dato('Enlaces múltiples', lew.ordenes.length, ' class="num"');
    pintaLewis(lew, false);
    $('#card-centros').hidden = false;
    $('#centros-tabla').innerHTML = '<thead><tr><th>Átomo</th><th>Tipo</th><th>Geometría</th><th>Hibridación</th><th>Ángulos</th></tr></thead><tbody>' + lew.centros.map((c) => `<tr><td>${c.sim}${c.i + 1}</td><td>${c.tipo.replace(/(\d)/g, '<sub>$1</sub>')}</td><td><b>${c.geo}</b></td><td>${c.hib}</td><td>${c.real}</td></tr>`).join('') + '</tbody>';
    $('#pasos').innerHTML = lew.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('')
      + lew.centros.map((c) => `<li><strong>${c.sim}${c.i + 1}</strong>${c.vecinos} vecinos + ${c.lp} ${c.lp === 1 ? 'par libre' : 'pares libres'} = ${c.sn} dominios (${c.tipo}) → <b>${c.geo.toLowerCase()}</b>, ${c.hib}.</li>`).join('');
    $('#leyenda').textContent = '';
  }

  /* ---------- Tabla de geometrías ---------- */
  function tabla() {
    const filas = Object.entries(G).map(([k, g]) => {
      const tipo = `AX${g.x === 1 ? '' : `<sub>${g.x}</sub>`}${g.e ? 'E' + (g.e === 1 ? '' : `<sub>${g.e}</sub>`) : ''}`;
      return `<tr data-k="${k}"><td>${tipo}</td><td>${g.sn}</td><td>${g.ele}</td><td><b>${g.nombre}</b></td><td>${g.hib}</td><td>${g.real}</td><td>${g.ej}</td><td><button class="btn" data-n="${g.x}" data-m="${g.e}" aria-label="Ver ${g.nombre} en 3D">Ver en 3D</button></td></tr>`;
    }).join('');
    $('#tabla-geo').innerHTML = '<thead><tr><th>Tipo</th><th>Dominios</th><th>Electrónica</th><th>Molecular</th><th>Hibridación</th><th>Ángulos</th><th>Ejemplos</th><th><span class="solo-lector">Ver en 3D</span></th></tr></thead><tbody>' + filas + '</tbody>';
  }
  const marcaTabla = () => { for (const tr of document.querySelectorAll('#tabla-geo tr[data-k]')) tr.classList.toggle('activa', !!sol && tr.dataset.k === `${sol.sn}-${sol.e}`); };
  $('#tabla-geo').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-n]'); if (!b) return;
    sc = { ...sc, modo: 'axe', n: b.dataset.n, m: b.dataset.m }; $('#ejemplos').value = ''; formulario(); calcula();
    $('#molecula').scrollIntoView({ block: 'center', behavior: reducido ? 'auto' : 'smooth' });
  });

  /* ---------- Molécula en 3D ---------- */
  const COLOR = { H: '--at-h', C: '--at-c', O: '--at-o', N: '--at-n', S: '--at-s', Se: '--at-s', F: '--at-hal', Cl: '--at-hal', Br: '--at-hal', I: '--at-hal' };
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--panel', '--at-central', '--at-h', '--at-c', '--at-o', '--at-n', '--at-s', '--at-hal', '--at-otro', '--par-libre', '--dipolo']) col[k] = cs.getPropertyValue(k).trim(); }
  const rgb = (h) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h) || [0, '80', '80', '80']; return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]; };
  const mezcla = (h, t, con = [255, 255, 255]) => { const c = rgb(h); return `rgb(${c.map((x, i) => Math.round(x + (con[i] - x) * t)).join(',')})`; };
  const oscuro = (h) => { const c = rgb(h); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] < 140; };
  const colorAtomo = (a) => (sol.simbolica ? (a.central ? col['--at-central'] : col['--at-otro']) : col[COLOR[a.sim]] || col['--at-otro']);
  const radioAtomo = (a) => (sol.simbolica ? (a.central ? 0.34 : 0.27) : 0.1 + (Elementos.porSimbolo[a.sim]?.radio || 70) / 400);
  const LARGO = 1.3;

  function dibuja() {
    const { g, w, h } = lienzo('#molecula');
    if (!sol || !w || !h) return;
    const cy = Math.cos(vista.yaw), sy = Math.sin(vista.yaw), cp = Math.cos(vista.pitch), sp = Math.sin(vista.pitch);
    const E = Math.min(w, h) * 0.25 * vista.zoom, F = 7;
    // gira (primero alrededor de la vertical, luego inclina) y aplica un poco de perspectiva
    const P3 = (v, k = 1) => {
      const x = v[0] * k, y = v[1] * k, z = v[2] * k;
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, q = F / (F - z2);
      return { x: w / 2 + x1 * E * q, y: h / 2 - y2 * E * q, z: z2, q };
    };
    const cen = P3([0, 0, 0]), obj = [];
    const esfera = (a, p) => {
      const r = radioAtomo(a) * E * p.q, c = colorAtomo(a);
      const gr = g.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
      gr.addColorStop(0, mezcla(c, 0.6)); gr.addColorStop(0.55, c); gr.addColorStop(1, mezcla(c, 0.45, [0, 0, 0]));
      g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 7); g.fill();
      g.fillStyle = oscuro(c) ? '#fff' : '#111'; g.font = `600 ${Math.max(10, Math.round(r * 0.85))}px "IBM Plex Sans", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(a.sim, p.x, p.y + 1);
    };
    const [centro, ...term] = sol.atomos;
    obj.push({ z: cen.z, f: () => esfera(centro, cen) });
    for (const a of term) {
      const p = P3(a.v, LARGO), doble = !sol.simbolica && (a.sim === 'O' || a.sim === 'S' || a.sim === 'Se');
      obj.push({ z: (p.z + cen.z) / 2, f: () => {
        const dx = p.x - cen.x, dy = p.y - cen.y, n = Math.hypot(dx, dy) || 1, ox = (-dy / n) * (doble ? 3.5 : 0), oy = (dx / n) * (doble ? 3.5 : 0);
        g.strokeStyle = col['--muted']; g.lineCap = 'round'; g.lineWidth = Math.max(2, 0.05 * E * (doble ? 0.75 : 1.2) * (p.q + cen.q) / 2);
        for (const s of doble ? [-1, 1] : [0]) { g.beginPath(); g.moveTo(cen.x + s * ox, cen.y + s * oy); g.lineTo(p.x + s * ox, p.y + s * oy); g.stroke(); }
      } });
      obj.push({ z: p.z, f: () => esfera(a, p) });
    }
    if (vista.libres) for (const v of sol.libres) {
      const p = P3(v, 0.85), b = P3(v, 0.35);
      obj.push({ z: p.z + 0.01, f: () => {
        const ang = Math.atan2(p.y - cen.y, p.x - cen.x), largo = Math.hypot(p.x - cen.x, p.y - cen.y), r = 0.5 * E * p.q;
        g.save(); g.translate(b.x * 0.4 + p.x * 0.6, b.y * 0.4 + p.y * 0.6); g.rotate(largo > 1 ? ang : 0);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
        gr.addColorStop(0, mezcla(col['--par-libre'], 0.5)); gr.addColorStop(1, col['--par-libre']);
        g.globalAlpha = 0.5; g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r, r * (largo > 1 ? 0.62 : 1), 0, 0, 7); g.fill();
        g.globalAlpha = 0.9; g.strokeStyle = col['--par-libre']; g.lineWidth = 1.4; g.stroke();
        g.fillStyle = col['--ink']; g.globalAlpha = 0.85;
        for (const s of [-1, 1]) { g.beginPath(); g.arc(s * r * 0.28, 0, Math.max(2, r * 0.09), 0, 7); g.fill(); }
        g.restore();
      } });
    }
    if (vista.dipolo && sol.dipolo && !sol.carga) {
      const a = P3(sol.dipolo, -0.6), b = P3(sol.dipolo, 2);
      obj.push({ z: -99, f: () => {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        g.strokeStyle = col['--dipolo']; g.fillStyle = col['--dipolo']; g.lineWidth = 3; g.lineCap = 'round'; g.setLineDash([7, 5]);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]);
        g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(b.x - 12 * Math.cos(ang - 0.4), b.y - 12 * Math.sin(ang - 0.4)); g.lineTo(b.x - 12 * Math.cos(ang + 0.4), b.y - 12 * Math.sin(ang + 0.4)); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(a.x - 5, a.y); g.lineTo(a.x + 5, a.y); g.moveTo(a.x, a.y - 5); g.lineTo(a.x, a.y + 5); g.stroke();
        g.font = '600 13px "STIX Two Text", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('μ', b.x + 12 * Math.cos(ang) + 6 * Math.sin(ang), b.y + 12 * Math.sin(ang) - 6 * Math.cos(ang));
      } });
    }
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
  interruptor('#b-giro', 'giro'); interruptor('#b-libres', 'libres'); interruptor('#b-dipolo', 'dipolo');
  $('#b-reinicio').addEventListener('click', () => { Object.assign(vista, { yaw: 0.6, pitch: 0.35, zoom: 1 }); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('vsepr').current;
  colores(); tabla(); formulario(); calcula(); arranca();
  window.VseprApp = {
    abrirEjemplo, azar, enunciado,
    resultado: () => sol && { sn: sol.sn, e: sol.e, geo: sol.geo, hib: sol.hibTxt, polaridad: sol.polaridad },
    lewis: () => lew && { enlaces: lew.enlaces, resonancia: lew.resonancia, ordenes: lew.ordenes, centros: lew.centros.map((c) => ({ sim: c.sim, tipo: c.tipo, geo: c.geo, hib: c.hibTxt })), fc: lew.atomos.map((a) => a.fc) },
    estado: () => copia(sc), vista: () => ({ ...vista }),
  };
})();
