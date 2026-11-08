/* =====================================================================
   LaplaceNumerica: interfaz de la ecuación de Laplace numérica. Datos
   (caja, potenciales de los bordes, electrodo interior, método y sonda),
   ejemplos, resultados, desarrollo y el mapa de color con equipotenciales
   y campo eléctrico. Pulsar en el mapa coloca la sonda; pasar el ratón
   lee el potencial. El cálculo está en laplace-numerica/calculo.js
   (LaplaceNumerica) y los ayudantes comunes en herramienta.js.
   También: Poisson, bordes aislantes, varios electrodos, cargas, capacidad, energía y comparación de métodos.
   Guarda el estado entero (sc) en localStorage[CLAVE] en cada cambio: es lo
   que copia Mis ejercicios (biblioteca.js). Expone window.LaplaceNumericaApp
   para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = LaplaceNumerica, f = P.f, CLAVE = 'laplace-numerica-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, geo = null, lectura = null;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const lista = (k, nom, ops) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${ops.map(([v, t]) => `<option value="${v}"${(sc[k] ?? ops[0][0]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const borde = (k, t, nom) => {
    const ais = sc[t] === 'n';
    return lista(t, nom, [['v', 'Potencial fijo'], ['n', 'Aislante (∂V/∂n = 0)']]) + (ais ? '' : fila(k, 'Potencial de ese borde', 'V'));
  };
  const electrodo = (on, tt, kx, ky, kw, kh, kv, n) => {
    const e = sc[on] === '1', c = sc[tt] === 'circ';
    return `<div class="sep">Electrodo ${n}</div>` + lista(on, 'Electrodo', [['0', 'Sin electrodo'], ['1', 'Con electrodo']])
      + (e ? lista(tt, 'Forma', [['rect', 'Rectangular'], ['circ', 'Circular']]) + (c ? fila(kx, 'Centro, x', 'm') + fila(ky, 'Centro, y', 'm') + fila(kw, 'Radio', 'm') : fila(kx, 'Esquina inferior, x', 'm') + fila(ky, 'Esquina inferior, y', 'm') + fila(kw, 'Ancho', 'm') + fila(kh, 'Alto', 'm')) + fila(kv, 'Potencial', 'V') : '');
  };
  function formulario() {
    $('#campos').innerHTML = '<div class="sep">Caja</div>' + fila('a', 'Ancho', 'm') + fila('b', 'Alto', 'm') + fila('n', 'Celdas en el ancho')
      + '<div class="sep">Bordes</div>' + borde('va', 'ta', 'Borde de arriba') + borde('vb', 'tb', 'Borde de abajo') + borde('vi', 'ti', 'Borde izquierdo') + borde('vd', 'td', 'Borde derecho')
      + '<div class="sep">Carga dentro de la caja (Poisson)</div>' + fila('rho', 'Densidad de carga ρ', 'C/m³, vacío = Laplace')
      + (vacioRho() ? '' : fila('rx', 'Región con carga: x', 'm, vacío = toda la caja') + fila('ry', 'Región con carga: y', 'm') + fila('rw', 'Región con carga: ancho', 'm') + fila('rh', 'Región con carga: alto', 'm'))
      + electrodo('elec', 'et', 'ex', 'ey', 'ew', 'eh', 'ev', 1) + electrodo('e2', 'e2t', 'e2x', 'e2y', 'e2w', 'e2h', 'e2v', 2) + electrodo('e3', 'e3t', 'e3x', 'e3y', 'e3w', 'e3h', 'e3v', 3)
      + '<div class="sep">Relajación</div>' + lista('metodo', 'Método', [['sor', 'SOR'], ['gs', 'Gauss-Seidel'], ['jacobi', 'Jacobi']]) + fila('tol', 'Error máximo', 'V')
      + '<div class="sep">Sonda</div>' + fila('px', 'Posición x', 'm') + fila('py', 'Posición y', 'm');
    $('#nota').textContent = 'Se admite coma decimal, 3e8, 3·10^8 y unidades (50 mV). Un borde aislante no fija el potencial: el campo no lo atraviesa. Las cargas y la capacidad son por metro de profundidad.';
    $('#ver-eq').checked = sc.eq !== '0'; $('#ver-e').checked = sc.cam === '1';
  }
  const vacioRho = () => !String(sc.rho ?? '').trim();
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.tagName === 'SELECT' || t.dataset.k === 'rho') { const k = t.dataset.k, foco = k === 'rho' ? k : null; formulario(); if (foco) { const i = $('#f-' + foco); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } else $('#f-' + k).focus(); }
    calcula();
  });
  $('#ver-eq').addEventListener('change', (e) => { sc.eq = e.target.checked ? '1' : '0'; guarda(); dibuja(); });
  $('#ver-e').addEventListener('change', (e) => { sc.cam = e.target.checked ? '1' : '0'; guarda(); dibuja(); });

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
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; lectura = null; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const s = sol.sonda;
    $('#resumen').innerHTML = dato('Potencial en la sonda', `V = ${f(s.V)} V`, 'num') + dato('Campo en la sonda', `E = ${f(s.E)} V/m`, 'num')
      + dato('Componentes del campo', `E<sub>x</sub> = ${f(s.Ex)} V/m · E<sub>y</sub> = ${f(s.Ey)} V/m`, 'ancho')
      + dato('Potencial en el centro', `V = ${f(sol.centro.V)} V`, 'num') + dato('Iteraciones', `${sol.iter}${sol.convergio ? '' : ' (sin converger)'}`)
      + (sol.exacto !== null ? dato('Solución exacta', `V = ${f(sol.exacto)} V`) + dato('Error de la malla', `${f(Math.abs(s.V - sol.exacto))} V`) : '')
      + sol.conductores.map((c, i) => dato(`Carga de ${c.nombre.toLowerCase()} (${f(c.v)} V)`, `Q' = ${f(sol.q[i])} C/m`)).join('')
      + dato('Energía por metro', `W' = ${f(sol.W)} J/m`)
      + (sol.capacidad ? dato('Capacidad por metro', `C' = ${f(sol.capacidad.C)} F/m`) + dato('Capacidad por la energía', `C' = 2W'/ΔV² = ${f(sol.capacidad.Cw)} F/m`) : '');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    lectura = null; dibuja();
  }

  /* ---------- Mapa ---------- */
  // azul → blanco → rojo (potencial bajo → alto)
  const PARADAS = [[0, [42, 93, 181]], [0.5, [244, 244, 240]], [1, [194, 65, 42]]];
  function color(t) {
    t = Math.min(Math.max(t, 0), 1);
    for (let i = 1; i < PARADAS.length; i++) if (t <= PARADAS[i][0]) {
      const [t0, c0] = PARADAS[i - 1], [t1, c1] = PARADAS[i], u = (t - t0) / (t1 - t0);
      return c0.map((v, k) => Math.round(v + (c1[k] - v) * u));
    }
    return PARADAS[PARADAS.length - 1][1];
  }
  const TINTA = '#1b1f27', BLANCO = '#ffffff'; // sobre el mapa, que no cambia con el tema
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h, c } = lienzo('#grafica');
    geo = null;
    if (!sol || !w || !h) return;
    const ml = 44, mr = 66, mt = 12, mb = 30, aw = w - ml - mr, ah = h - mt - mb;
    const k = Math.min(aw / sol.a, ah / sol.b), pw = Math.max(10, Math.floor(sol.a * k)), ph = Math.max(10, Math.floor(sol.b * k));
    const x0 = ml + (aw - pw) / 2, y0 = mt + (ah - ph) / 2;
    geo = { x0, y0, pw, ph, c };
    const rango = sol.vmax - sol.vmin || 1, norm = (v) => (v - sol.vmin) / rango;
    // imagen punto a punto con interpolación bilineal de los nodos
    const dpr = window.devicePixelRatio || 1, iw = Math.round(pw * dpr), ih = Math.round(ph * dpr);
    const of = document.createElement('canvas'); of.width = iw; of.height = ih;
    const og = of.getContext('2d'), im = og.createImageData(iw, ih), W = sol.nx + 1;
    for (let py = 0; py < ih; py++) {
      const y = (1 - (py + 0.5) / ih) * sol.b, j = Math.min(Math.floor(y / sol.hy), sol.ny - 1), t = y / sol.hy - j;
      for (let px = 0; px < iw; px++) {
        const x = ((px + 0.5) / iw) * sol.a, i = Math.min(Math.floor(x / sol.hx), sol.nx - 1), s = x / sol.hx - i;
        const v = sol.V[j * W + i] * (1 - s) * (1 - t) + sol.V[j * W + i + 1] * s * (1 - t) + sol.V[(j + 1) * W + i] * (1 - s) * t + sol.V[(j + 1) * W + i + 1] * s * t;
        const cc = color(norm(v)), o = (py * iw + px) * 4; im.data[o] = cc[0]; im.data[o + 1] = cc[1]; im.data[o + 2] = cc[2]; im.data[o + 3] = 255;
      }
    }
    og.putImageData(im, 0, 0); g.drawImage(of, x0, y0, pw, ph);
    const X = (x) => x0 + (x / sol.a) * pw, Y = (y) => y0 + ph - (y / sol.b) * ph;
    // equipotenciales: cruces de cada celda con el nivel, unidas con segmentos
    if (sc.eq !== '0' && rango > 0) {
      g.strokeStyle = TINTA; g.globalAlpha = 0.45; g.lineWidth = 1; g.beginPath();
      const n = 10;
      for (let q = 1; q < n; q++) {
        const L = sol.vmin + (rango * q) / n;
        for (let j = 0; j < sol.ny; j++) for (let i = 0; i < sol.nx; i++) {
          const v = [sol.V[j * W + i], sol.V[j * W + i + 1], sol.V[(j + 1) * W + i + 1], sol.V[(j + 1) * W + i]];
          const pts = [], ps = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
          for (let e = 0; e < 4; e++) {
            const a = v[e], b = v[(e + 1) % 4];
            if ((a - L) * (b - L) < 0) { const u = (L - a) / (b - a), A = ps[e], B = ps[(e + 1) % 4]; pts.push([X((A[0] + (B[0] - A[0]) * u) * sol.hx), Y((A[1] + (B[1] - A[1]) * u) * sol.hy)]); }
          }
          if (pts.length === 2) { g.moveTo(...pts[0]); g.lineTo(...pts[1]); }
          else if (pts.length === 4) { g.moveTo(...pts[0]); g.lineTo(...pts[1]); g.moveTo(...pts[2]); g.lineTo(...pts[3]); }
        }
      }
      g.stroke(); g.globalAlpha = 1;
    }
    // campo eléctrico: flechas en una rejilla gruesa, del mismo largo y con el módulo en la opacidad
    if (sc.cam === '1') {
      const pasoX = Math.max(1, Math.round(sol.nx / 16)), pasoY = Math.max(1, Math.round(sol.ny / (16 * sol.b / sol.a)));
      let emax = 0; const lista = [];
      for (let j = pasoY; j < sol.ny; j += pasoY) for (let i = pasoX; i < sol.nx; i += pasoX) {
        if (sol.fijo[j * W + i]) continue;
        const e = P.valorEn(sol, i * sol.hx, j * sol.hy); lista.push([i * sol.hx, j * sol.hy, e]); emax = Math.max(emax, e.E);
      }
      const L = Math.min(pasoX * sol.hx * k, pasoY * sol.hy * k) * 0.8;
      g.strokeStyle = TINTA; g.fillStyle = TINTA; g.lineWidth = 1.4;
      for (const [x, y, e] of lista) {
        if (!e.E) continue;
        const dx = e.Ex / e.E, dy = -e.Ey / e.E, cx = X(x), cy = Y(y), ax = cx - (dx * L) / 2, ay = cy - (dy * L) / 2, bx = cx + (dx * L) / 2, by = cy + (dy * L) / 2;
        g.globalAlpha = 0.25 + 0.6 * Math.sqrt(e.E / emax);
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - 5 * dx + 3 * dy, by - 5 * dy - 3 * dx); g.lineTo(bx - 5 * dx - 3 * dy, by - 5 * dy + 3 * dx); g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
    }
    // marco, electrodos, región con carga, bordes aislantes (a trazos) y sonda
    g.strokeStyle = TINTA; g.lineWidth = 1.2; g.strokeRect(x0, y0, pw, ph);
    g.lineWidth = 2; g.strokeStyle = TINTA;
    for (const e of sol.electrodos) {
      if (e.tipo === 'circ') { g.beginPath(); g.arc(X(e.x), Y(e.y), e.w * k, 0, 6.2832); g.stroke(); }
      else g.strokeRect(X(e.i0 * sol.hx), Y(e.j1 * sol.hy), (e.i1 - e.i0) * sol.hx * k, (e.j1 - e.j0) * sol.hy * k);
    }
    if (sol.rhoRegion) { const r = sol.rhoRegion; g.setLineDash([5, 4]); g.lineWidth = 1.2; g.strokeRect(X(r.x), Y(r.y + r.h), r.w * k, r.h * k); g.setLineDash([]); }
    g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath();
    if (sol.neu.arr) { g.moveTo(x0, y0); g.lineTo(x0 + pw, y0); } if (sol.neu.aba) { g.moveTo(x0, y0 + ph); g.lineTo(x0 + pw, y0 + ph); }
    if (sol.neu.izq) { g.moveTo(x0, y0); g.lineTo(x0, y0 + ph); } if (sol.neu.der) { g.moveTo(x0 + pw, y0); g.lineTo(x0 + pw, y0 + ph); }
    g.stroke(); g.setLineDash([]);
    const sx = X(sol.px), sy = Y(sol.py);
    g.lineWidth = 2; g.strokeStyle = BLANCO; g.beginPath(); g.arc(sx, sy, 6, 0, 6.2832); g.stroke();
    g.lineWidth = 1.6; g.strokeStyle = TINTA; g.beginPath(); g.arc(sx, sy, 6, 0, 6.2832); g.moveTo(sx - 10, sy); g.lineTo(sx + 10, sy); g.moveTo(sx, sy - 10); g.lineTo(sx, sy + 10); g.stroke();
    // ejes
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const x of marcas(0, sol.a, 5)) g.fillText(txt(f(x)), X(x), y0 + ph + 6);
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const y of marcas(0, sol.b, 4)) g.fillText(txt(f(y)), x0 - 6, Y(y));
    g.textAlign = 'left'; g.fillText('x (m)', x0 + pw - 30, y0 + ph + 18 > h ? h - 6 : y0 + ph + 18);
    // barra de color
    const bx = w - mr + 18, bh = ph, bw = 12;
    for (let q = 0; q < bh; q++) { const cc = color(1 - q / (bh - 1)); g.fillStyle = `rgb(${cc[0]},${cc[1]},${cc[2]})`; g.fillRect(bx, y0 + q, bw, 1.5); }
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.strokeRect(bx, y0, bw, bh);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(txt(f(sol.vmax)) + ' V', bx - 4, y0 - 12 < 0 ? 0 : y0 - 12 + 0);
    g.textBaseline = 'bottom'; g.fillText(txt(f(sol.vmin)) + ' V', bx - 4, y0 + bh + 14);
    escribeLectura();
  }
  function escribeLectura() {
    const p = lectura || { x: sol.px, y: sol.py, e: sol.sonda }, q = p.e;
    $('#leyenda').innerHTML = `${lectura ? 'Bajo el ratón' : 'Sonda'}: <b>(${f(p.x)}; ${f(p.y)}) m</b> · V = <b>${f(q.V)} V</b> · E = <b>${f(q.E)} V/m</b>. Pulsa en el mapa para mover la sonda.`;
  }
  function punto(ev) {
    if (!geo || !sol) return null;
    const r = geo.c.getBoundingClientRect(), x = ev.clientX - r.left - geo.x0, y = ev.clientY - r.top - geo.y0;
    if (x < 0 || y < 0 || x > geo.pw || y > geo.ph) return null;
    return { x: (x / geo.pw) * sol.a, y: (1 - y / geo.ph) * sol.b };
  }
  $('#grafica').addEventListener('pointermove', (ev) => {
    const p = punto(ev);
    lectura = p ? { x: p.x, y: p.y, e: P.valorEn(sol, p.x, p.y) } : null;
    if (sol) escribeLectura();
  });
  $('#grafica').addEventListener('pointerleave', () => { lectura = null; if (sol) escribeLectura(); });
  $('#grafica').addEventListener('click', (ev) => {
    const p = punto(ev); if (!p) return;
    sc.px = String(+p.x.toPrecision(3)).replace('.', ','); sc.py = String(+p.y.toPrecision(3)).replace('.', ',');
    for (const k of ['px', 'py']) { const i = $('#f-' + k); if (i) i.value = sc[k]; }
    $('#ejemplos').value = ''; lectura = null; calcula();
  });
  /* ---------- Modo práctica ---------- */
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const v = () => String(de([0, 0, 50, 100, -50, -100, 20, 80]));
    const base = { ta: 'v', tb: 'v', ti: 'v', td: 'v', rho: '', et: 'rect', e2: '0', e3: '0', a: '1', b: '1', n: '40', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '100', metodo: 'sor', tol: '1e-6' };
    do { sc = { ...base, va: v(), vb: v(), vi: v(), vd: v() }; } while (new Set([sc.va, sc.vb, sc.vi, sc.vd]).size < 2);
    if (Math.random() < 0.4) sc.elec = '1', sc.ev = String(de([50, 100, -100]));
    sc.px = c(de([0.25, 0.5, 0.75])); sc.py = c(de([0.25, 0.5, 0.75]));
    if (sc.elec === '1' && sc.px === '0,5' && sc.py === '0,5') sc.px = '0,25';
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const u = (x) => `${esc(x)} V`;
    return `Una caja cuadrada de 1 m de lado tiene el borde de arriba a ${u(sc.va)}, el de abajo a ${u(sc.vb)}, el izquierdo a ${u(sc.vi)} y el derecho a ${u(sc.vd)}${sc.elec === '1' ? `, y un electrodo cuadrado de 0,2 m de lado centrado en la caja a ${u(sc.ev)}` : ''}. Resolviendo la ecuación de Laplace por relajación, calcula el potencial y el módulo del campo eléctrico en el punto (${esc(sc.px)}; ${esc(sc.py)}) m y el potencial en el centro de la caja.`;
  };
  /* ---------- Comparar métodos (LA-4) ---------- */
  $('#comparar').addEventListener('click', () => {
    const cuerpo = $('#comp-cuerpo'), msg = $('#comp-msg');
    try {
      const filas = P.comparar(sc), nm = P.NOM_METODO;
      cuerpo.innerHTML = filas.map((q) => `<tr><td>${nm[q.metodo]}</td><td>${q.n} × ${q.ny}</td><td>${q.iter}${q.convergio ? '' : ' (sin converger)'}</td><td>${f(q.tiempo)} ms</td><td>${f(q.error)} V</td></tr>`).join('');
      msg.textContent = 'Cada fila resuelve el mismo problema con la malla y el método indicados; el error es el mayor desvío respecto de una solución de referencia con SOR y error 10⁻¹⁰ V en la misma malla.'; $('#comp-tabla').hidden = false;
    } catch (e) { msg.textContent = e.message; $('#comp-tabla').hidden = true; }
  });
  Herramienta.exportar('#grafica', { nombre: 'laplace-mapa', titulo: 'Mapa del potencial' });
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('laplace-numerica').current;
  colores(); formulario(); calcula();
  window.LaplaceNumericaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { v: sol.sonda.V, e: sol.sonda.E, centro: sol.centro.V, iter: sol.iter }, estado: () => copia(sc) };
})();
