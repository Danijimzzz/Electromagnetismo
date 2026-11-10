/* =====================================================================
   Intervalos de confianza: interfaz (formulario por tipo de intervalo,
   resultado, distribución del estadístico con el área 1 − α sombreada,
   simulación de 100 muestras que van saliendo y el desarrollo). Cada
   intervalo puede ser bilateral o una cota, con población finita y con
   el contraste de un valor.
   El cálculo está en intervalos/calculo.js (Intervalos).
   ===================================================================== */
(() => {
  const { $, esc, copia, txt } = Herramienta;
  const I = Intervalos, f = I.f, CLAVE = 'intervalos-v1', E = Estadistica;
  const MODOS = [['media', 'Media μ'], ['proporcion', 'Proporción p'], ['prediccion', 'Predicción y tolerancia'], ['varianza', 'Varianza σ² y desviación σ'], ['dif-medias', 'Diferencia de medias μ₁ − μ₂'], ['apareadas', 'Datos apareados μ_d'], ['dif-prop', 'Diferencia de proporciones p₁ − p₂'], ['cociente-var', 'Cociente de varianzas σ₁²/σ₂²'], ['tamano', 'Tamaño de la muestra']];

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
  const PARAM = { prediccion: 'x', media: 'μ', proporcion: 'p', varianza: 'σ²', 'dif-medias': 'μ₁ − μ₂', apareadas: 'μ<sub>d</sub>', 'dif-prop': 'p₁ − p₂', 'cociente-var': 'σ₁²/σ₂²' };
  const NOTAS = {
    media: 'Si te dan la desviación de la población σ, elige «σ conocida» (se usa z). Si solo tienes la de la muestra, se usa la t de Student con n − 1 grados de libertad.',
    proporcion: 'Puedes dar el número de éxitos x o directamente la proporción de la muestra p̂ (0,42 o 42 %… escribe 0,42). El método normal (Wald) es el de clase; con pocos éxitos o fracasos son mejores Wilson o el exacto.',
    prediccion: 'El intervalo de predicción dice dónde caerá el próximo dato; el de tolerancia, dónde está la mayor parte de la población. Los dos son más anchos que el de la media y suponen una población normal.',
    varianza: 'Se usa la χ² con n − 1 grados de libertad. Si tu libro da la desviación típica de la muestra dividiendo entre n, elígela abajo y se pasa a la cuasidesviación.',
    'dif-medias': 'Muestras independientes. Con σ desconocidas, si se suponen iguales se usa la cuasivarianza ponderada; si no, la aproximación de Welch.',
    'dif-prop': 'Muestras independientes y grandes. El intervalo de p₁ − p₂ dice si las dos proporciones son distintas.',
    apareadas: 'Dos medidas sobre los mismos individuos (antes y después, dos métodos sobre la misma pieza…). Se trabaja con las diferencias d = x₁ − x₂ como una sola muestra.',
    'cociente-var': 'Compara la variabilidad de dos poblaciones normales con la F de Snedecor. Si el intervalo contiene el 1, se pueden suponer varianzas iguales.',
    tamano: 'Cuántos datos hacen falta para no pasar de un error E con la confianza que pidas. En una proporción sin estimación previa se usa p = 0,5. Si la población es pequeña, da su tamaño N.',
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
      h += elige('metodoP', 'Método', Object.entries(I.METODOS_P));
    } else if (m === 'prediccion') {
      h += elige('queP', 'Intervalo para', [['pred', 'Una observación futura (predicción)'], ['tol', 'Una proporción de la población (tolerancia)']]) + elige('fuente', 'Datos', FUENTE);
      if (sc.fuente === 'datos') h += area('datos', 'Valores');
      else h += fila('xm', 'Media de la muestra x̄') + fila('n', 'Tamaño de la muestra n') + fila('s', 'Desviación de la muestra s') + elige('tipoS', 'Esa desviación es la', TIPO_S);
      if (sc.queP === 'tol') h += fila('cob', 'Proporción de la población', '%');
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
    } else if (m === 'apareadas') {
      h += elige('fuente', 'Datos', [['datos', 'Las dos listas de valores'], ['resumen', 'Un resumen (d̄, s_d, n)']]);
      if (sc.fuente === 'datos') h += area('datos1', 'Valores de la medida 1 (antes)') + area('datos2', 'Valores de la medida 2 (después), en el mismo orden');
      else h += fila('n', 'Número de pares n') + fila('dm', 'Media de las diferencias d̄') + fila('sd', 'Cuasidesviación de las diferencias s<sub>d</sub>');
    } else if (m === 'cociente-var') {
      h += elige('fuente', 'Datos', FUENTE);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Muestra ${i}`) + (sc.fuente === 'datos' ? area('datos' + i, 'Valores') : fila('n' + i, `Tamaño n${s}`) + fila('s' + i, `Cuasidesviación s${s}`)); }
      h += sep('Confianza');
    } else if (m === 'dif-prop') {
      h += elige('tipoP', 'Datos', [['exitos', 'Número de éxitos'], ['proporcion', 'Proporciones p̂']]);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Muestra ${i}`) + fila('n' + i, `Tamaño n${s}`) + (sc.tipoP === 'proporcion' ? fila('ph' + i, `Proporción p̂${s}`) : fila('x' + i, `Éxitos x${s}`)); }
      h += sep('Confianza');
    } else {
      h += elige('de', 'Para estimar', [['media', 'Una media'], ['proporcion', 'Una proporción'], ['dif-medias', 'Una diferencia de medias'], ['dif-prop', 'Una diferencia de proporciones']]) + fila('E', 'Error máximo E');
      h += sc.de === 'proporcion' ? fila('p0', 'Proporción esperada p', '(opcional)') : sc.de === 'dif-medias' ? fila('sigma1', 'σ₁ de la población 1') + fila('sigma2', 'σ₂ de la población 2') : sc.de === 'dif-prop' ? fila('p1', 'Proporción esperada p₁', '(opcional)') + fila('p2', 'Proporción esperada p₂', '(opcional)') : fila('sigma', 'Desviación típica σ');
    }
    h += nivelF();
    if (m !== 'tamano' && !(m === 'prediccion' && sc.queP === 'tol')) h += elige('lado', 'Tipo de intervalo', [['dos', 'Bilateral (a; b)'], ['inf', 'Cota inferior (a; +∞)'], ['sup', 'Cota superior (−∞; b)']]);
    if (m === 'media' || m === 'proporcion' || (m === 'tamano' && (sc.de === 'media' || sc.de === 'proporcion' || !sc.de))) h += fila('Npob', 'Tamaño de la población N', '(opcional, si es finita)');
    if (m !== 'tamano' && m !== 'prediccion') h += fila('h0', `Contrastar ${PARAM[m]} =`, '(opcional)');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[m];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(I.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (k === 'queP') { sc.queP = t.value; if (t.value === 'tol') { sc.lado = 'dos'; if (!sc.cob) sc.cob = '90'; } }
    else {
      sc[k] = t.value;
      if (k === 'fuente') { sc.fuente1 = sc.fuente2 = t.value; if (t.value === 'datos') for (const d of ['dif-medias', 'apareadas', 'cociente-var'].includes(sc.modo) ? ['datos1', 'datos2'] : ['datos']) if (!sc[d]) sc[d] = d === 'datos2' ? '11,2 12,8 10,9 12,1 11,7 12,4' : '12,1 13,4 11,8 12,9 13,2 12,5'; }
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
      () => ({ modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: String(ent(50, 300)), s: String(ent(5, 40)), n: String(de([10, 16, 20, 25])), nivel, tipoS: 'cuasi', lado: de(['inf', 'sup']) }),
      () => ({ modo: 'apareadas', fuente: 'resumen', n: String(ent(8, 20)), dm: c(ent(5, 40) / 10), sd: c(ent(10, 50) / 10), nivel }),
      () => (Math.random() < 0.5 ? { modo: 'tamano', de: 'media', sigma: String(ent(5, 30)), E: String(ent(1, 5)), p0: '', nivel } : { modo: 'tamano', de: 'proporcion', sigma: '', E: c(de([0.02, 0.03, 0.04, 0.05])), p0: Math.random() < 0.5 ? '' : c(ent(10, 60) / 100), nivel }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const nc = `al ${esc(sc.nivel)} %`;
    if (sc.modo === 'media' && (sc.lado === 'inf' || sc.lado === 'sup')) return `Una muestra de ${esc(sc.n)} elementos tiene media ${esc(sc.xm)} y cuasidesviación típica ${esc(sc.s)}. Calcula la cota ${sc.lado === 'inf' ? 'inferior' : 'superior'} de la media de la población con una confianza del ${esc(sc.nivel)} %.`;
    switch (sc.modo) {
      case 'apareadas': return `Se mide a ${esc(sc.n)} personas antes y después de un tratamiento. La media de las diferencias es ${esc(sc.dm)} y su cuasidesviación típica ${esc(sc.sd)}. Calcula el intervalo de confianza ${nc} para la media de las diferencias.`;
      case 'cociente-var': return `Dos muestras de ${esc(sc.n1)} y ${esc(sc.n2)} piezas tienen cuasidesviaciones ${esc(sc.s1)} y ${esc(sc.s2)}. Calcula el intervalo ${nc} para σ₁²/σ₂² y di si las varianzas pueden ser iguales.`;
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
  const CRIT = (s) => {
    const al = s.lado === 'inf' || s.lado === 'sup' ? 'α' : 'α/2', X = s.crit === 'F' ? 'F' : 'χ<sup>2</sup>';
    if (s.crit === 'z') return `z<sub>${al}</sub> = <b>${f(s.k)}</b>`;
    if (s.crit === 't') return `t<sub>${s.gl}; ${al}</sub> = <b>${f(s.k)}</b>`;
    if (s.crit === 'k') return `k = <b>${f(s.k)}</b>`;
    return s.lado === 'inf' ? `${X} = <b>${f(s.k)}</b>` : s.lado === 'sup' ? `${X} = <b>${f(s.k2)}</b>` : `${X} = ${f(s.k2)} y ${f(s.k)}`;
  };
  const extremo = (x) => (x === Infinity ? '+∞' : x === -Infinity ? '−∞' : f(x, 5));
  const iv = (a, b) => `(${extremo(a)}; ${extremo(b)})`;
  function calcula() {
    const err = $('#error');
    try { sol = I.resolver({ ...sc, fuente1: sc.fuente ?? sc.fuente1, fuente2: sc.fuente ?? sc.fuente2 }); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#cuenta').textContent = ''; sim = null; dibuja(); return; }
    err.hidden = true; guarda();
    const nc = `${f(100 * sol.c)} %`;
    let h;
    if (sol.modo === 'tamano') h = dato(sol.de.startsWith('dif') ? 'Tamaño de cada muestra' : 'Tamaño de la muestra', `n = <b>${sol.n}</b>`) + dato('Sin redondear', `${f(sol.n0, 6)}`) + dato('Valor crítico', CRIT(sol));
    else {
      const tipo = sol.lado === 'inf' ? 'Cota inferior' : sol.lado === 'sup' ? 'Cota superior' : 'Intervalo';
      h = dato(`${tipo} al ${nc} para ${sol.paramTxt || PARAM[sol.modo]}`, `<b>${iv(sol.a, sol.b)}</b>`, 'ancho');
      if (sol.modo === 'varianza') h += dato(`Intervalo para σ`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Estimación', `s<sup>2</sup> = ${f(sol.est, 5)}`);
      else if (sol.modo === 'cociente-var') h += dato(`Intervalo para σ₁/σ₂`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Estimación', `s₁<sup>2</sup>/s₂<sup>2</sup> = ${f(sol.est, 5)}`);
      else h += dato('Estimación', `${{ prediccion: 'x̄', media: 'x̄', proporcion: 'p̂', 'dif-medias': 'x̄₁ − x̄₂', apareadas: 'd̄', 'dif-prop': 'p̂₁ − p̂₂' }[sol.modo]} = ${f(sol.est, 5)}`) + dato('Error máximo', `E = <b>${f(sol.err)}</b>`);
      h += dato(sol.crit === 'k' ? 'Factor de tolerancia' : 'Valor crítico', CRIT(sol));
      if (sol.modo === 'proporcion') h += dato('Método', I.METODOS_P[sol.metodoP]);
      if (sol.h0 !== undefined) h += dato(`Contraste de ${PARAM[sol.modo]} = ${f(sol.h0)}`, sol.rechaza ? '<b>Se rechaza H₀</b>' : '<b>No se rechaza H₀</b>', 'ancho');
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#simcard').hidden = sol.modo === 'tamano' || sol.modo === 'prediccion';
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
  const lienzo = (s) => Herramienta.lienzo(s);
  const FUENTE_UI = '"IBM Plex Sans", system-ui, sans-serif';
  function dibuja() { campana(); simulacion(); }
  // densidad del estadístico (Z, T o χ²) con 1 − α sombreado y los valores críticos
  function campana() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    // tolerancia: se dibuja la normal con la proporción de la población que se cubre entre ±z
    const S = sol.sinGrafica ? { ...sol, k: sol.kz, c: sol.cob, crit: 'z', dist: { d: 'normal' } } : sol;
    if (!col['--ink']) colores();
    const d = S.dist, D = E.DIST[d.d], P = d.d === 'normal' ? { mu: 0, sigma: 1 } : d.d === 't' ? { nu: d.nu } : d.d === 'f' ? { d1: d.d1, d2: d.d2 } : { k: d.k };
    const al = 1 - S.c, asim = d.d === 'chi2' || d.d === 'f', inf = S.lado === 'inf', sup = S.lado === 'sup';
    let x0, x1;
    if (d.d === 'chi2') { x0 = 0; x1 = Math.max(S.k * 1.25, d.k + 4 * Math.sqrt(2 * d.k)); } else if (d.d === 'f') { x0 = 0; x1 = Math.max(S.k * 1.25, E.cuantil(D, P, 0.99)); } else { const r = Math.max(4, S.k * 1.35); x0 = -r; x1 = r; }
    // bilateral: entre los dos críticos; cota inferior: toda α a la derecha; cota superior: a la izquierda
    const lo = inf ? x0 : asim ? S.k2 : -S.k, hi = sup ? x1 : S.k;
    const mL = 16, mR = 16, mT = 26, mB = 30, M = 300, xs = Array.from({ length: M + 1 }, (_, i) => x0 + ((x1 - x0) * i) / M), ys = xs.map((x) => D.pdf(P, x));
    const ymax = Math.max(...ys.filter(isFinite)) * 1.1 || 1;
    const X = (x) => mL + ((x - x0) / (x1 - x0)) * (w - mL - mR), Y = (y) => h - mB - (Math.min(y, ymax) / ymax) * (h - mT - mB);
    const tramo = (a, b, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(X(a), Y(0)); for (let i = 0; i <= 80; i++) { const x = a + ((b - a) * i) / 80; g.lineTo(X(x), Y(D.pdf(P, x))); } g.lineTo(X(b), Y(0)); g.closePath(); g.fill(); };
    tramo(Math.max(x0 + 1e-9, lo), Math.min(x1, hi), col['--accent-soft']);
    g.globalAlpha = 0.35; if (!inf) tramo(x0 + 1e-9, lo, col['--mal']); if (!sup) tramo(hi, x1, col['--mal']); g.globalAlpha = 1;
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(X(x), Y(ys[i])) : g.moveTo(X(x), Y(ys[i])))); g.stroke();
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); g.stroke();
    g.font = `12px ${FUENTE_UI}`; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const [x, t] of [[lo, f(lo)], [hi, f(hi)]].filter((_, i) => (i ? !sup : !inf))) { g.strokeStyle = col['--ink']; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), mT - 4); g.stroke(); g.setLineDash([]); g.fillStyle = col['--ink']; g.fillText(txt(t), X(x), h - mB + 6); }
    const nom = d.d === 'normal' ? 'Z ~ N(0, 1)' : d.d === 't' ? `T ~ t de Student con ${d.nu} g. l.` : d.d === 'f' ? `F de Snedecor con (${d.d1}, ${d.d2}) g. l.` : `χ² con ${d.k} g. l.`;
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(nom, mL, 4);
    g.fillStyle = col['--accent']; g.textAlign = 'center'; g.font = `600 13px ${FUENTE_UI}`; g.fillText(`1 − α = ${txt(f(S.c))}`, X((lo + hi) / 2), Y(D.pdf(P, (lo + hi) / 2)) * 0.5 + Y(0) * 0.5);
    g.font = `12px ${FUENTE_UI}`; g.fillStyle = col['--mal'];
    // α/2 (o α en una cota) fuera de las líneas de los valores críticos, a media altura
    const ya = mT + (h - mT - mB) * 0.6, et = inf || sup ? `α = ${txt(f(al))}` : `α/2 = ${txt(f(al / 2))}`, an = g.measureText(et).width;
    if (!inf) { if (X(lo) - 8 - an >= mL) { g.textAlign = 'right'; g.fillText(et, X(lo) - 8, ya); } else { g.textAlign = 'left'; g.fillText(et, mL, ya - 18); } }
    if (!sup) { if (X(hi) + 8 + an <= w - mR) { g.textAlign = 'left'; g.fillText(et, X(hi) + 8, ya); } else { g.textAlign = 'right'; g.fillText(et, w - mR, ya - 18); } }
  }
  // 100 intervalos de muestras distintas: los que no contienen el valor real, en rojo
  function simulacion() {
    const { g, w, h } = lienzo('#sim');
    if (!sim || !sol) return;
    const v = visibles(), hs = sim.hechos;
    // el eje solo con los extremos finitos: los infinitos de las cotas llegan al borde
    const fin = hs.flat().concat(sim.real).filter(isFinite);
    let a = Math.min(...fin), b = Math.max(...fin);
    const pad = (b - a) * 0.05 || 1; a -= pad; b += pad;
    const mL = 12, mR = 12, mT = 22, mB = 26, X = (x) => mL + ((Math.max(a, Math.min(b, x)) - a) / (b - a)) * (w - mL - mR), paso = (h - mT - mB) / N;
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
    g.fillStyle = col['--ink']; g.textBaseline = 'top'; g.font = `600 12px ${FUENTE_UI}`; g.fillText(`${sol.param.replace('μ_d', 'μd')} real = ${txt(f(sim.real, 5))}`, X(sim.real), 4);
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
