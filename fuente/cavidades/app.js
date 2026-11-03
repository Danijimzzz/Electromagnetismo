/* =====================================================================
   Interfaz de las cavidades resonantes: geometría, relleno y paredes, modo, ejemplos, resultados,
   desarrollo, tabla de modos y el mapa del campo eléctrico o magnético en un plano de corte. El cálculo
   está en cavidades/calculo.js (Cavidades) y los ayudantes comunes en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE]. Expone window.CavidadesApp para el modo
   práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, lienzo } = Herramienta;
  const P = Cavidades, f = P.f, CLAVE = 'cavidades-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, mp = null, col = {};

  const GEO = {
    rect: { nombre: 'Rectangular', modo: { tipo: 'TE', i1: '1', i2: '0', i3: '1' }, idx: ['m (semiciclos en x)', 'n (semiciclos en y)', 'p (semiciclos en z)'],
      planos: [['xz', 'Plano x–z'], ['yz', 'Plano y–z'], ['xy', 'Plano x–y']] },
    cil: { nombre: 'Cilíndrica', modo: { tipo: 'TM', i1: '0', i2: '1', i3: '0' }, idx: ['n (azimutal)', 'm (radial, desde 1)', 'p (axial)'],
      planos: [['xz', 'Plano meridiano x–z'], ['yz', 'Plano meridiano y–z'], ['xy', 'Sección x–y (perpendicular al eje)']] },
    esf: { nombre: 'Esférica', modo: { tipo: 'TM', i1: '1', i2: '1', i3: '0' }, idx: ['n (orden angular, desde 1)', 'l (radial, desde 1)'],
      planos: [['xz', 'Plano x–z (con el eje z)'], ['yz', 'Plano y–z (con el eje z)'], ['xy', 'Plano x–y (perpendicular al eje)']] },
  };
  const geo = () => (GEO[sc.geo] ? sc.geo : 'rect');

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  function formulario() {
    const g = geo(), G = GEO[g];
    const dims = g === 'rect' ? fila('a', 'Lado a', 'mm') + fila('b', 'Lado b', 'mm') + fila('d', 'Longitud d (eje z)', 'mm') : g === 'cil' ? fila('R', 'Radio R', 'mm') + fila('L', 'Longitud L (eje z)', 'mm') : fila('R', 'Radio R', 'mm');
    $('#campos').innerHTML = '<div class="sep">Cavidad</div>' + elige('geo', 'Forma', Object.entries(GEO).map(([k, v]) => [k, v.nombre])) + dims +
      '<div class="sep">Relleno y paredes</div>' + fila('er', 'Permitividad relativa εr') + fila('tand', 'Pérdidas del relleno tg δ') + fila('sigma', 'Conductividad de las paredes σ', 'S/m') +
      '<div class="sep">Modo</div>' + elige('tipo', 'Tipo de modo', [['TE', 'TE (Ez = 0)'], ['TM', 'TM (Hz = 0)']]) + G.idx.map((t, j) => fila('i' + (j + 1), t)).join('');
    $('#nota').textContent = 'Vacío tg δ: sin pérdidas en el relleno. σ del cobre: 5,8·10^7 S/m. Se admite coma decimal. El eje de la cavidad es z; en la esférica cada modo es (2n+1) veces degenerado.';
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.dataset.k === 'geo') { Object.assign(sc, GEO[geo()].modo, { plano: 'xz' }); for (const [k, v] of Object.entries({ a: '30', b: '15', d: '30', R: '25', L: '40' })) if (!String(sc[k] ?? '').trim()) sc[k] = v; formulario(); }
    calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const de = (l) => l[Math.floor(Math.random() * l.length)], c = (x) => String(x).replace('.', ',');
    const g = de(['rect', 'rect', 'cil', 'cil', 'esf']), er = de(['1', '1', '2,1', '4']), tand = er === '1' ? '0' : de(['0', '2e-4', '1e-3']), sigma = de(['5,8e7', '5,8e7', '3,5e7', '1,1e7']);
    const base = { geo: g, er, tand, sigma };
    if (g === 'rect') Object.assign(base, { a: c(de([20, 22.86, 30, 40, 50])), b: c(de([10, 10.16, 15, 20])), d: c(de([25, 30, 40, 60])) });
    else if (g === 'cil') Object.assign(base, { R: c(de([15, 20, 25, 30])), L: c(de([20, 30, 40, 60])) });
    else base.R = c(de([30, 40, 50, 75]));
    const m = de(P.resolver({ ...base, ...GEO[g].modo }).modos.slice(0, 6));
    sc = { ...base, tipo: m.tipo, i1: String(m.i[0]), i2: String(m.i[1]), i3: String(m.i[2] ?? 0), plano: 'xz', pos: 50, que: 'E' };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const g = geo(), d = g === 'rect' ? `rectangular de ${esc(sc.a)} × ${esc(sc.b)} × ${esc(sc.d)} mm` : g === 'cil' ? `cilíndrica de radio ${esc(sc.R)} mm y longitud ${esc(sc.L)} mm` : `esférica de radio ${esc(sc.R)} mm`;
    const rel = +String(sc.er).replace(',', '.') === 1 ? 'vacía' : `rellena de un dieléctrico de εr = ${esc(sc.er)}${+String(sc.tand).replace(',', '.') > 0 ? ` y tg δ = ${esc(sc.tand)}` : ''}`;
    return `Una cavidad resonante ${d}, ${rel}, tiene paredes de conductividad σ = ${esc(sc.sigma)} S/m. Para el modo ${esc(sc.tipo)}<sub>${esc(sc.i1)}${esc(sc.i2)}${g === 'esf' ? '' : esc(sc.i3)}</sub> calcula la frecuencia de resonancia, la longitud de onda, la profundidad de penetración, el factor de calidad de las paredes, el total y el ancho de banda.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = 'num') => `<div class="${cl}"><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; mp = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#modos').innerHTML = ''; $('#leyenda').textContent = ''; controles(); dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = dato('Modo', `${sol.nombre}`, 'est') + dato('Frecuencia de resonancia', `f<sub>0</sub> = ${f(sol.f0 / 1e9)} GHz`) + dato('Longitud de onda en el relleno', `λ<sub>0</sub> = ${f(sol.lam * 1000)} mm`) +
      dato('Profundidad de penetración', `δ = ${f(sol.delta * 1e6)} μm`) + dato('Q de las paredes', `Q<sub>c</sub> = ${f(sol.Qc)}`) +
      (sol.tand > 0 ? dato('Q del dieléctrico', `Q<sub>d</sub> = ${f(sol.Qd)}`) : '') + dato('Factor de calidad total', `Q = ${f(sol.Q)}`) + dato('Ancho de banda', `Δf = ${f(sol.df / 1e3)} kHz`);
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#modos').innerHTML = '<div class="tabla-scroll"><table class="tabla"><thead><tr><th scope="col">Modo</th><th scope="col">Frecuencia (GHz)</th></tr></thead><tbody>' +
      sol.modos.map((m) => { const act = m.tipo === sol.tipo && m.i.every((q, j) => q === sol.i[j]); return `<tr><td><button type="button" class="elige-modo" data-m="${m.tipo}|${m.i.join('|')}"${act ? ' aria-current="true"' : ''}>${m.nombre}</button></td><td>${f(m.f / 1e9)}</td></tr>`; }).join('') + '</tbody></table></div>';
    controles(); remapea();
  }
  $('#modos').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-m]'); if (!b) return;
    const [t, ...i] = b.dataset.m.split('|'); sc.tipo = t; sc.i1 = i[0]; sc.i2 = i[1]; sc.i3 = i[2] ?? '0'; sel.value = ''; formulario(); calcula();
  });

  /* ---------- Controles del mapa ---------- */
  function controles() {
    const G = GEO[geo()];
    if (!G.planos.some(([v]) => v === sc.plano)) sc.plano = 'xz';
    $('#plano').innerHTML = G.planos.map(([v, t]) => `<option value="${v}"${sc.plano === v ? ' selected' : ''}>${t}</option>`).join('');
    $('#pos').value = sc.pos ?? 50; $('#pos-v').textContent = `${Math.round(sc.pos ?? 50)} %`;
    for (const b of document.querySelectorAll('#que button')) b.setAttribute('aria-selected', String((sc.que || 'E') === b.dataset.q));
  }
  $('#plano').addEventListener('change', () => { sc.plano = $('#plano').value; guarda(); remapea(); });
  $('#pos').addEventListener('input', () => { sc.pos = +$('#pos').value; $('#pos-v').textContent = `${Math.round(sc.pos)} %`; guarda(); remapea(); });
  $('#que').addEventListener('click', (e) => { const b = e.target.closest('button[data-q]'); if (!b) return; sc.que = b.dataset.q; guarda(); controles(); remapea(); });

  function remapea() {
    if (!sol) return;
    mp = P.mapa(sol, sc.plano || 'xz', (sc.pos ?? 50) / 100, sc.que || 'E');
    const eje = { xz: 'y', yz: 'x', xy: 'z' }[sc.plano || 'xz'];
    $('#leyenda').innerHTML = `Mapa del campo ${(sc.que || 'E') === 'E' ? 'eléctrico' : 'magnético'} del modo ${sol.nombre} en el corte ${eje} = ${f(mp.c * 1000)} mm: el color es su módulo (más intenso, más campo) y las flechas, su componente en el plano. Es la forma del campo en el instante de máximo; el eléctrico y el magnético están en cuadratura.`;
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel']) col[k] = cs.getPropertyValue(k).trim(); }
  function flecha(g, x, y, dx, dy, l) {
    const mod = Math.hypot(dx, dy); if (mod < 1e-9) return;
    const ux = dx / mod, uy = dy / mod, L = l * Math.min(1, mod), x2 = x + ux * L / 2, y2 = y + uy * L / 2, x1 = x - ux * L / 2, y1 = y - uy * L / 2, h = Math.min(6, L * 0.4);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - ux * h - uy * h * 0.5, y2 - uy * h + ux * h * 0.5); g.lineTo(x2 - ux * h + uy * h * 0.5, y2 - uy * h - ux * h * 0.5); g.closePath(); g.fill();
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !mp || !w || !h) return;
    const mg = 22, W0 = mp.u1 - mp.u0, H0 = mp.v1 - mp.v0, e = Math.min((w - 2 * mg) / W0, (h - 2 * mg) / H0), W = W0 * e, H = H0 * e, x0 = (w - W) / 2, y0 = (h - H) / 2;
    const px = (u) => x0 + (u - mp.u0) * e, py = (v) => y0 + H - (v - mp.v0) * e, n = mp.n, cw = W / n, ch = H / n;
    // contorno de la cavidad en el corte
    const traza = () => { g.beginPath(); if (mp.perfil.t === 'circ') g.arc(px(0), py(0), mp.perfil.r * e, 0, 2 * Math.PI); else g.rect(x0, y0, W, H); };
    g.save(); traza(); g.fillStyle = col['--panel']; g.fill(); g.clip();
    if (mp.max > 1e-12) {
      g.fillStyle = col['--accent'];
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
        const m = mp.mag[a * n + b]; if (!(m >= 0)) continue;
        g.globalAlpha = Math.min(1, Math.pow(m / mp.max, 0.9) * 0.9);
        const xa = Math.round(x0 + a * cw), ya = Math.round(y0 + H - (b + 1) * ch); g.fillRect(xa, ya, Math.round(x0 + (a + 1) * cw) - xa, Math.round(y0 + H - b * ch) - ya);   // celdas sin solaparse (si no, se ve la rejilla)
      }
      g.globalAlpha = 1;
      let mx = 0; for (let i = 0; i < n * n; i++) { const q = Math.hypot(mp.vu[i], mp.vv[i]); if (q > mx) mx = q; }
      g.strokeStyle = col['--ink']; g.fillStyle = col['--ink']; g.lineWidth = 1.3;
      const paso = 4, L = cw * paso * 0.85;
      if (mx > 1e-9 * mp.max) for (let a = paso / 2; a < n; a += paso) for (let b = paso / 2; b < n; b += paso) {
        const i = Math.floor(a) * n + Math.floor(b); if (!(mp.mag[i] >= 0)) continue;
        const q = Math.hypot(mp.vu[i], mp.vv[i]); if (q < 0.06 * mx) continue;
        flecha(g, x0 + (Math.floor(a) + 0.5) * cw, y0 + H - (Math.floor(b) + 0.5) * ch, mp.vu[i] / mx, -mp.vv[i] / mx, L);
      }
    } else { g.restore(); g.save(); g.font = '13px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.fillText('El campo es nulo en este corte: cambia la posición.', w / 2, h / 2); }
    g.restore();
    g.strokeStyle = col['--ink']; g.lineWidth = 2; traza(); g.stroke();
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted'];
    const [ejeU, ejeV] = { xz: ['x', 'z'], yz: ['y', 'z'], xy: ['x', 'y'] }[mp.plano];
    g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(txt(`${ejeU}: ${f(mp.u0 * 1000)} a ${f(mp.u1 * 1000)} mm`), w / 2, y0 + H + 4);
    g.save(); g.translate(x0 - 6, y0 + H / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'bottom'; g.fillText(txt(`${ejeV}: ${f(mp.v0 * 1000)} a ${f(mp.v1 * 1000)} mm`), 0, 0); g.restore();
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('cavidades').current;
  colores(); formulario(); calcula();
  window.CavidadesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { f0: sol.f0, lam: sol.lam, delta: sol.delta, Qc: sol.Qc, Qd: sol.Qd, Q: sol.Q, df: sol.df }, estado: () => copia(sc) };
})();
