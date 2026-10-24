/* =====================================================================
   Intervalos de confianza: interfaz (formulario por tipo de intervalo,
   resultado, distribución del estadístico con el área 1 − α sombreada,
   simulación de 100 muestras que van saliendo y el desarrollo).
   El cálculo está en intervalos/calculo.js (Intervalos).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const I = Intervalos, f = I.f, CLAVE = 'intervalos-v1', E = Estadistica;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['media', 'Media μ'], ['proporcion', 'Proporción p'], ['varianza', 'Varianza σ² y desviación σ'], ['dif-medias', 'Diferencia de medias μ₁ − μ₂'], ['dif-prop', 'Diferencia de proporciones p₁ − p₂'], ['tamano', 'Tamaño de la muestra']];

  let sc = copia(I.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, sim = null, anda = true;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const area = (k, nom) => `<label for="f-${k}" class="ancho">${nom} <small>separados por espacios, «;» o en líneas</small></label><textarea id="f-${k}" class="in ancho" data-k="${k}" rows="4" spellcheck="false" autocomplete="off">${esc(sc[k] ?? '')}</textarea>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const FUENTE = [['resumen', 'Un resumen (x̄, s, n)'], ['datos', 'La lista de valores']];
  const TIPO_S = [['cuasi', 'Cuasidesviación (con n − 1)'], ['muestral', 'Desviación de la muestra (con n)']];
  const nivelF = () => fila('nivel', 'Nivel de confianza', '%');
  const NOTAS = {
    media: 'Si te dan la desviación de la población σ, elige «σ conocida» (se usa z). Si solo tienes la de la muestra, se usa la t de Student con n − 1 grados de libertad.',
    proporcion: 'Puedes dar el número de éxitos x o directamente la proporción de la muestra p̂ (0,42 o 42 %… escribe 0,42).',
    varianza: 'Se usa la χ² con n − 1 grados de libertad. Si tu libro da la desviación típica de la muestra dividiendo entre n, elígela abajo y se pasa a la cuasidesviación.',
    'dif-medias': 'Muestras independientes. Con σ desconocidas, si se suponen iguales se usa la cuasivarianza ponderada; si no, la aproximación de Welch.',
    'dif-prop': 'Muestras independientes y grandes. El intervalo de p₁ − p₂ dice si las dos proporciones son distintas.',
    tamano: 'Cuántos datos hacen falta para no pasar de un error E con la confianza que pidas. En una proporción sin estimación previa se usa p = 0,5.',
  };
  function formulario() {
    let h = elige('modo', 'Intervalo de', MODOS);
    const m = sc.modo;
    if (m === 'media' || m === 'varianza') {
      h += elige('fuente', 'Datos', FUENTE);
      if (m === 'media') h += elige('sigmaC', 'Desviación de la población', [['no', 'σ desconocida (t de Student)'], ['si', 'σ conocida (normal)']]) + (sc.sigmaC === 'si' ? fila('sigma', 'Desviación típica σ') : '');
      if (sc.fuente === 'datos') h += area('datos', 'Valores');
      else {
        h += (m === 'media' ? fila('xm', 'Media de la muestra x̄') : '') + fila('n', 'Tamaño de la muestra n');
        if (!(m === 'media' && sc.sigmaC === 'si')) h += fila('s', 'Desviación de la muestra s') + elige('tipoS', 'Esa desviación es la', TIPO_S);
      }
    } else if (m === 'proporcion') {
      h += elige('tipoP', 'Datos', [['exitos', 'Número de éxitos x'], ['proporcion', 'Proporción p̂']]) + fila('n', 'Tamaño de la muestra n') + (sc.tipoP === 'proporcion' ? fila('ph', 'Proporción p̂') : fila('x', 'Éxitos x'));
    } else if (m === 'dif-medias') {
      h += elige('caso', 'Desviaciones', [['conocidas', 'σ₁ y σ₂ conocidas (normal)'], ['iguales', 'Desconocidas pero iguales (t)'], ['distintas', 'Desconocidas y distintas (Welch)']]) + elige('fuente', 'Datos', FUENTE);
      for (const i of ['1', '2']) {
        h += sep(`Muestra ${i}`);
        if (sc.fuente === 'datos') h += area('datos' + i, 'Valores');
        else h += fila('xm' + i, `Media x̄${i === '1' ? '₁' : '₂'}`) + fila('n' + i, `Tamaño n${i === '1' ? '₁' : '₂'}`);
        if (sc.caso === 'conocidas') h += fila('sigma' + i, `σ${i === '1' ? '₁' : '₂'} de la población`);
        else if (sc.fuente !== 'datos') h += fila('s' + i, `Cuasidesviación s${i === '1' ? '₁' : '₂'}`);
      }
      h += sep('Confianza');
    } else if (m === 'dif-prop') {
      h += elige('tipoP', 'Datos', [['exitos', 'Número de éxitos'], ['proporcion', 'Proporciones p̂']]);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Muestra ${i}`) + fila('n' + i, `Tamaño n${s}`) + (sc.tipoP === 'proporcion' ? fila('ph' + i, `Proporción p̂${s}`) : fila('x' + i, `Éxitos x${s}`)); }
      h += sep('Confianza');
    } else {
      h += elige('de', 'Para estimar', [['media', 'Una media'], ['proporcion', 'Una proporción']]) + fila('E', 'Error máximo E') + (sc.de === 'proporcion' ? fila('p0', 'Proporción esperada p <small>(opcional)</small>') : fila('sigma', 'Desviación típica σ'));
    }
    h += nivelF();
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[m];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(I.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else {
      sc[k] = t.value;
      if (k === 'fuente') { sc.fuente1 = sc.fuente2 = t.value; if (t.value === 'datos') for (const d of sc.modo === 'dif-medias' ? ['datos1', 'datos2'] : ['datos']) if (!sc[d]) sc[d] = d === 'datos2' ? '11,2 12,8 10,9 12,1 11,7 12,4' : '12,1 13,4 11,8 12,9 13,2 12,5'; }
    }
    formulario(); cambia();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${I.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = I.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); if (sc.fuente1 && !sc.fuente) sc.fuente = sc.fuente1;
    formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(+x.toFixed(2)).replace('.', ',');
    const nivel = de(['90', '95', '95', '99']);
    const tipos = [
      () => { const conocida = Math.random() < 0.5, s = ent(2, 30); return { modo: 'media', fuente: 'resumen', sigmaC: conocida ? 'si' : 'no', sigma: conocida ? String(s) : '', xm: String(ent(20, 500)), s: conocida ? '' : String(s), n: String(de([9, 10, 16, 25, 36, 49, 64, 100])), nivel, tipoS: 'cuasi' }; },
      () => { const n = de([100, 200, 400, 500, 1000]); return { modo: 'proporcion', tipoP: 'exitos', n: String(n), x: String(ent(Math.round(n * 0.1), Math.round(n * 0.7))), ph: '', nivel }; },
      () => ({ modo: 'varianza', fuente: 'resumen', xm: '', s: c(ent(10, 80) / 10), n: String(ent(8, 30)), nivel, tipoS: 'cuasi' }),
      () => { const s = ent(3, 12); return { modo: 'dif-medias', caso: 'conocidas', fuente: 'resumen', fuente1: 'resumen', fuente2: 'resumen', xm1: String(ent(60, 90)), n1: String(ent(30, 80)), sigma1: String(s), xm2: String(ent(60, 90)), n2: String(ent(30, 80)), sigma2: String(s + ent(0, 4)), nivel, tipoS: 'cuasi' }; },
      () => (Math.random() < 0.5 ? { modo: 'tamano', de: 'media', sigma: String(ent(5, 30)), E: String(ent(1, 5)), p0: '', nivel } : { modo: 'tamano', de: 'proporcion', sigma: '', E: c(de([0.02, 0.03, 0.04, 0.05])), p0: Math.random() < 0.5 ? '' : c(ent(10, 60) / 100), nivel }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const nc = `al ${esc(sc.nivel)} %`;
    switch (sc.modo) {
      case 'media': return sc.fuente === 'datos' ? `Con los datos de la muestra, calcula el intervalo de confianza ${nc} para la media de la población.` : `Una muestra de ${esc(sc.n)} elementos tiene media ${esc(sc.xm)}${sc.sigmaC === 'si' ? `. La desviación típica de la población es ${esc(sc.sigma)}` : ` y cuasidesviación típica ${esc(sc.s)}`}. Calcula el intervalo de confianza ${nc} para la media y el error máximo.`;
      case 'proporcion': return `En una muestra de ${esc(sc.n)} personas, ${sc.tipoP === 'proporcion' ? `la proporción con la característica es ${esc(sc.ph)}` : `${esc(sc.x)} tienen la característica`}. Calcula el intervalo de confianza ${nc} para la proporción y el error máximo.`;
      case 'varianza': return `Una muestra de ${esc(sc.n)} piezas tiene cuasidesviación típica ${esc(sc.s)}. Calcula el intervalo de confianza ${nc} para la varianza y para la desviación típica de la población.`;
      case 'dif-medias': return `Dos muestras independientes: n₁ = ${esc(sc.n1)} con media ${esc(sc.xm1)} y n₂ = ${esc(sc.n2)} con media ${esc(sc.xm2)}${sc.caso === 'conocidas' ? `, de poblaciones con σ₁ = ${esc(sc.sigma1)} y σ₂ = ${esc(sc.sigma2)}` : ''}. Calcula el intervalo ${nc} para μ₁ − μ₂ y di si las medias son distintas.`;
      case 'dif-prop': return `En una muestra de ${esc(sc.n1)} hay ${esc(sc.x1)} éxitos y en otra de ${esc(sc.n2)}, ${esc(sc.x2)}. Calcula el intervalo ${nc} para p₁ − p₂.`;
      default: return sc.de === 'proporcion' ? `¿Cuántas personas hay que encuestar para estimar una proporción${sc.p0 ? ` (que se espera que sea ${esc(sc.p0)})` : ''} con un error máximo de ${esc(sc.E)} y una confianza del ${esc(sc.nivel)} %?` : `La desviación típica de una población es ${esc(sc.sigma)}. ¿Qué tamaño de muestra hace falta para estimar la media con un error máximo de ${esc(sc.E)} y una confianza del ${esc(sc.nivel)} %?`;
    }
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  const CRIT = (s) => (s.crit === 'z' ? `z<sub>α/2</sub> = <b>${f(s.k)}</b>` : s.crit === 't' ? `t<sub>${s.gl}; α/2</sub> = <b>${f(s.k)}</b>` : `χ<sup>2</sup> = ${f(s.k2)} y ${f(s.k)}`);
  const iv = (a, b) => `(${f(a, 5)}; ${f(b, 5)})`;
  function calcula() {
    const err = $('#error');
    try { sol = I.resolver({ ...sc, fuente1: sc.fuente ?? sc.fuente1, fuente2: sc.fuente ?? sc.fuente2 }); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#cuenta').textContent = ''; sim = null; dibuja(); return; }
    err.hidden = true; guarda();
    const nc = `${f(100 * sol.c)} %`;
    let h;
    if (sol.modo === 'tamano') h = dato('Tamaño de la muestra', `n = <b>${sol.n}</b>`) + dato('Sin redondear', `${f(sol.n0, 6)}`) + dato('Valor crítico', CRIT(sol));
    else {
      h = dato(`Intervalo al ${nc} para ${sol.param}`, `<b>${iv(sol.a, sol.b)}</b>`, 'ancho');
      if (sol.modo === 'varianza') h += dato(`Intervalo para σ`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Estimación', `s<sup>2</sup> = ${f(sol.est, 5)}`);
      else h += dato('Estimación', `${{ media: 'x̄', proporcion: 'p̂', 'dif-medias': 'x̄₁ − x̄₂', 'dif-prop': 'p̂₁ − p̂₂' }[sol.modo]} = ${f(sol.est, 5)}`) + dato('Error máximo', `E = <b>${f(sol.err)}</b>`);
      h += dato('Valor crítico', CRIT(sol));
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#simcard').hidden = sol.modo === 'tamano';
    nuevaSim();
    dibuja();
  }

  /* ---------- Simulación ---------- */
  const N = 100;
  function nuevaSim() {
    const g = sol && I.simula(sol);
    sim = g ? { ...g, hechos: [], t: 0 } : null;
    if (!sim) return;
    try { for (let i = 0; i < N; i++) sim.hechos.push(g.una()); } catch (e) { sim = null; }
    $('#cuenta').textContent = '';
  }
  const visibles = () => (sim ? Math.min(N, Math.floor(sim.t * 25)) : 0);

  /* ---------- Dibujos ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--ok', '--mal']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => {
    const c = $(s), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  };
  const FUENTE_UI = '"IBM Plex Sans", system-ui, sans-serif';
  function dibuja() { campana(); simulacion(); }
  // densidad del estadístico (Z, T o χ²) con 1 − α sombreado y los valores críticos
  function campana() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    if (!col['--ink']) colores();
    const d = sol.dist, D = E.DIST[d.d], P = d.d === 'normal' ? { mu: 0, sigma: 1 } : d.d === 't' ? { nu: d.nu } : { k: d.k };
    const al = 1 - sol.c;
    const lo = d.d === 'chi2' ? I.xc(d.k, 1 - al / 2) : -sol.k, hi = d.d === 'chi2' ? sol.k : sol.k;
    let x0, x1;
    if (d.d === 'chi2') { x0 = 0; x1 = Math.max(hi * 1.25, d.k + 4 * Math.sqrt(2 * d.k)); } else { const r = Math.max(4, sol.k * 1.35); x0 = -r; x1 = r; }
    const mL = 16, mR = 16, mT = 26, mB = 30, M = 300, xs = Array.from({ length: M + 1 }, (_, i) => x0 + ((x1 - x0) * i) / M), ys = xs.map((x) => D.pdf(P, x));
    const ymax = Math.max(...ys.filter(isFinite)) * 1.1 || 1;
    const X = (x) => mL + ((x - x0) / (x1 - x0)) * (w - mL - mR), Y = (y) => h - mB - (Math.min(y, ymax) / ymax) * (h - mT - mB);
    const tramo = (a, b, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(X(a), Y(0)); for (let i = 0; i <= 80; i++) { const x = a + ((b - a) * i) / 80; g.lineTo(X(x), Y(D.pdf(P, x))); } g.lineTo(X(b), Y(0)); g.closePath(); g.fill(); };
    tramo(Math.max(x0, lo), Math.min(x1, hi), col['--accent-soft']);
    g.globalAlpha = 0.35; tramo(x0 + 1e-9, lo, col['--mal']); tramo(hi, x1, col['--mal']); g.globalAlpha = 1;
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(X(x), Y(ys[i])) : g.moveTo(X(x), Y(ys[i])))); g.stroke();
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); g.stroke();
    g.font = `12px ${FUENTE_UI}`; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const [x, t] of [[lo, f(lo)], [hi, f(hi)]]) { g.strokeStyle = col['--ink']; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), mT - 4); g.stroke(); g.setLineDash([]); g.fillStyle = col['--ink']; g.fillText(txt(t), X(x), h - mB + 6); }
    const nom = d.d === 'normal' ? 'Z ~ N(0, 1)' : d.d === 't' ? `T ~ t de Student con ${d.nu} g. l.` : `χ² con ${d.k} g. l.`;
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(nom, mL, 4);
    g.fillStyle = col['--accent']; g.textAlign = 'center'; g.font = `600 13px ${FUENTE_UI}`; g.fillText(`1 − α = ${txt(f(sol.c))}`, X((lo + hi) / 2), Y(D.pdf(P, (lo + hi) / 2)) * 0.5 + Y(0) * 0.5);
    g.font = `12px ${FUENTE_UI}`; g.fillStyle = col['--mal'];
    // α/2 fuera de las líneas de los valores críticos, a media altura
    const ya = mT + (h - mT - mB) * 0.6, et = `α/2 = ${txt(f(al / 2))}`, an = g.measureText(et).width;
    if (X(lo) - 8 - an >= mL) { g.textAlign = 'right'; g.fillText(et, X(lo) - 8, ya); } else { g.textAlign = 'left'; g.fillText(et, mL, ya - 18); }
    if (X(hi) + 8 + an <= w - mR) { g.textAlign = 'left'; g.fillText(et, X(hi) + 8, ya); } else { g.textAlign = 'right'; g.fillText(et, w - mR, ya - 18); }
  }
  // 100 intervalos de muestras distintas: los que no contienen el valor real, en rojo
  function simulacion() {
    const { g, w, h } = lienzo('#sim');
    if (!sim || !sol) return;
    const v = visibles(), hs = sim.hechos;
    let a = Math.min(...hs.map((x) => x[0])), b = Math.max(...hs.map((x) => x[1]));
    const pad = (b - a) * 0.05; a -= pad; b += pad;
    const mL = 12, mR = 12, mT = 22, mB = 26, X = (x) => mL + ((x - a) / (b - a)) * (w - mL - mR), paso = (h - mT - mB) / N;
    g.font = `11px ${FUENTE_UI}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    const p0 = (b - a) / 6, e = 10 ** Math.floor(Math.log10(p0)), st = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0);
    for (let x = Math.ceil(a / st) * st; x <= b; x += st) { g.beginPath(); g.moveTo(X(x), mT); g.lineTo(X(x), h - mB); g.stroke(); g.fillText(txt(f(Math.abs(x) < st * 1e-9 ? 0 : x)), X(x), h - mB + 6); }
    let dentro = 0;
    for (let i = 0; i < v; i++) {
      const [lo, hi, est] = hs[i], ok = lo <= sim.real && sim.real <= hi, y = mT + paso * (i + 0.5);
      if (ok) dentro++;
      g.strokeStyle = ok ? col['--ok'] : col['--mal']; g.lineWidth = Math.max(1, Math.min(2.2, paso * 0.6)); g.beginPath(); g.moveTo(X(lo), y); g.lineTo(X(hi), y); g.stroke();
      g.fillStyle = g.strokeStyle; g.fillRect(X(est) - 1, y - Math.max(1, paso * 0.4), 2, Math.max(2, paso * 0.8));
    }
    g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(sim.real), mT - 4); g.lineTo(X(sim.real), h - mB); g.stroke();
    g.fillStyle = col['--ink']; g.textBaseline = 'top'; g.font = `600 12px ${FUENTE_UI}`; g.fillText(`${sol.param} real = ${txt(f(sim.real, 5))}`, X(sim.real), 4);
    $('#cuenta').innerHTML = v ? `<b>${dentro} de ${v}</b> intervalos contienen el valor real${v === N ? ` (se esperan unos ${Math.round(100 * sol.c)})` : ''}.` : '';
  }

  $('#otra').addEventListener('click', () => { nuevaSim(); if (sim) sim.t = 0; anda = true; $('#play').textContent = '⏸ Pausa'; dibuja(); });
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sim && visibles() < N) { sim.t += dt; simulacion(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('intervalos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.IntervalosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, a: sol.a, b: sol.b, n: sol.n, k: sol.k }, estado: () => copia(sc), simulacion: () => sim && { real: sim.real, dentro: sim.hechos.filter(([a, b]) => a <= sim.real && sim.real <= b).length } };
})();
