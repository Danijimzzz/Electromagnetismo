(() => {
  const { $, esc, copia, txt } = Herramienta;
  const I = Intervalos, f = I.f, CLAVE = 'intervalos-v1', E = Estadistica;
  const MODOS = [['media', 'Mean μ'], ['proporcion', 'Proportion p'], ['prediccion', 'Prediction and tolerance'], ['varianza', 'Variance σ² and deviation σ'], ['dif-medias', 'Difference of means μ₁ − μ₂'], ['apareadas', 'Paired data μ_d'], ['dif-prop', 'Difference of proportions p₁ − p₂'], ['cociente-var', 'Variance ratio σ₁²/σ₂²'], ['tamano', 'Sample size']];

  let sc = copia(I.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, sim = null, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const area = (k, nom) => `<label for="f-${k}" class="ancho">${nom} <small>separated by spaces, “;” or on separate lines</small></label><textarea id="f-${k}" class="in ancho" data-k="${k}" rows="4" spellcheck="false" autocomplete="off">${esc(sc[k] ?? '')}</textarea>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const FUENTE = [['resumen', 'A summary (x̄, s, n)'], ['datos', 'The list of values']];
  const TIPO_S = [['cuasi', 'Sample standard deviation (with n − 1)'], ['muestral', 'Sample deviation (with n)']];
  const nivelF = () => fila('nivel', 'Confidence level', '%');
  const PARAM = { prediccion: 'x', media: 'μ', proporcion: 'p', varianza: 'σ²', 'dif-medias': 'μ₁ − μ₂', apareadas: 'μ<sub>d</sub>', 'dif-prop': 'p₁ − p₂', 'cociente-var': 'σ₁²/σ₂²' };
  const NOTAS = {
    media: 'If you are given the population standard deviation σ, choose “σ known” (z is used). If you only have the sample one, Student\'s t with n − 1 degrees of freedom is used.',
    proporcion: 'You can give the number of successes x or directly the sample proportion p̂ (0.42 or 42 %… enter 0.42). The normal (Wald) method is the classroom one; with few successes or failures Wilson or the exact one are better.',
    prediccion: 'The prediction interval says where the next data point will fall; the tolerance interval, where most of the population lies. Both are wider than that of the mean and assume a normal population.',
    varianza: 'The χ² with n − 1 degrees of freedom is used. If your book gives the sample standard deviation dividing by n, choose it below and it is converted to the sample standard deviation with n − 1.',
    'dif-medias': 'Independent samples. With unknown σ, if they are assumed equal the pooled sample variance is used; if not, the Welch approximation.',
    'dif-prop': 'Independent, large samples. The interval for p₁ − p₂ says whether the two proportions are different.',
    apareadas: 'Two measurements on the same individuals (before and after, two methods on the same part…). The differences d = x₁ − x₂ are used as a single sample.',
    'cociente-var': 'It compares the variability of two normal populations with Snedecor\'s F. If the interval contains 1, equal variances can be assumed.',
    tamano: 'How much data is needed to stay within an error E at the confidence you ask for. For a proportion without a prior estimate p = 0.5 is used. If the population is small, give its size N.',
  };
  function formulario() {
    let h = elige('modo', 'Interval for', MODOS);
    const m = sc.modo;
    if (m === 'media' || m === 'varianza') {
      h += elige('fuente', 'Data', FUENTE);
      if (m === 'media') h += elige('sigmaC', 'Population deviation', [['no', 'σ unknown (Student\'s t)'], ['si', 'σ known (normal)']]) + (sc.sigmaC === 'si' ? fila('sigma', 'Standard deviation σ') : '');
      if (sc.fuente === 'datos') h += area('datos', 'Values');
      else {
        h += (m === 'media' ? fila('xm', 'Sample mean x̄') : '') + fila('n', 'Sample size n');
        if (!(m === 'media' && sc.sigmaC === 'si')) h += fila('s', 'Sample deviation s') + elige('tipoS', 'That deviation is the', TIPO_S);
      }
    } else if (m === 'proporcion') {
      h += elige('tipoP', 'Data', [['exitos', 'Number of successes x'], ['proporcion', 'Proportion p̂']]) + fila('n', 'Sample size n') + (sc.tipoP === 'proporcion' ? fila('ph', 'Proportion p̂') : fila('x', 'Successes x'));
      h += elige('metodoP', 'Method', Object.entries(I.METODOS_P));
    } else if (m === 'prediccion') {
      h += elige('queP', 'Interval for', [['pred', 'A future observation (prediction)'], ['tol', 'A proportion of the population (tolerance)']]) + elige('fuente', 'Data', FUENTE);
      if (sc.fuente === 'datos') h += area('datos', 'Values');
      else h += fila('xm', 'Sample mean x̄') + fila('n', 'Sample size n') + fila('s', 'Sample deviation s') + elige('tipoS', 'That deviation is the', TIPO_S);
      if (sc.queP === 'tol') h += fila('cob', 'Proportion of the population', '%');
    } else if (m === 'dif-medias') {
      h += elige('caso', 'Deviations', [['conocidas', 'σ₁ and σ₂ known (normal)'], ['iguales', 'Unknown but equal (t)'], ['distintas', 'Unknown and unequal (Welch)']]) + elige('fuente', 'Data', FUENTE);
      for (const i of ['1', '2']) {
        h += sep(`Sample ${i}`);
        if (sc.fuente === 'datos') h += area('datos' + i, 'Values');
        else h += fila('xm' + i, `Mean x̄${i === '1' ? '₁' : '₂'}`) + fila('n' + i, `Size n${i === '1' ? '₁' : '₂'}`);
        if (sc.caso === 'conocidas') h += fila('sigma' + i, `Population σ${i === '1' ? '₁' : '₂'}`);
        else if (sc.fuente !== 'datos') h += fila('s' + i, `Sample standard deviation s${i === '1' ? '₁' : '₂'}`);
      }
      h += sep('Confidence');
    } else if (m === 'apareadas') {
      h += elige('fuente', 'Data', [['datos', 'The two lists of values'], ['resumen', 'A summary (d̄, s_d, n)']]);
      if (sc.fuente === 'datos') h += area('datos1', 'Values of measurement 1 (before)') + area('datos2', 'Values of measurement 2 (after), in the same order');
      else h += fila('n', 'Number of pairs n') + fila('dm', 'Mean of the differences d̄') + fila('sd', 'Sample standard deviation of the differences s<sub>d</sub>');
    } else if (m === 'cociente-var') {
      h += elige('fuente', 'Data', FUENTE);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Sample ${i}`) + (sc.fuente === 'datos' ? area('datos' + i, 'Values') : fila('n' + i, `Size n${s}`) + fila('s' + i, `Sample standard deviation s${s}`)); }
      h += sep('Confidence');
    } else if (m === 'dif-prop') {
      h += elige('tipoP', 'Data', [['exitos', 'Number of successes'], ['proporcion', 'Proportions p̂']]);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Sample ${i}`) + fila('n' + i, `Size n${s}`) + (sc.tipoP === 'proporcion' ? fila('ph' + i, `Proportion p̂${s}`) : fila('x' + i, `Successes x${s}`)); }
      h += sep('Confidence');
    } else {
      h += elige('de', 'To estimate', [['media', 'A mean'], ['proporcion', 'A proportion'], ['dif-medias', 'A difference of means'], ['dif-prop', 'A difference of proportions']]) + fila('E', 'Margin of error E');
      h += sc.de === 'proporcion' ? fila('p0', 'Expected proportion p', '(opcional)') : sc.de === 'dif-medias' ? fila('sigma1', 'σ₁ of population 1') + fila('sigma2', 'σ₂ of population 2') : sc.de === 'dif-prop' ? fila('p1', 'Expected proportion p₁', '(opcional)') + fila('p2', 'Expected proportion p₂', '(opcional)') : fila('sigma', 'Standard deviation σ');
    }
    h += nivelF();
    if (m !== 'tamano' && !(m === 'prediccion' && sc.queP === 'tol')) h += elige('lado', 'Type of interval', [['dos', 'Two-sided (a, b)'], ['inf', 'Lower bound (a, +∞)'], ['sup', 'Upper bound (−∞, b)']]);
    if (m === 'media' || m === 'proporcion' || (m === 'tamano' && (sc.de === 'media' || sc.de === 'proporcion' || !sc.de))) h += fila('Npob', 'Population size N', '(opcional, si es finita)');
    if (m !== 'tamano' && m !== 'prediccion') h += fila('h0', `Test ${PARAM[m]} =`, '(opcional)');
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

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${I.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = I.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); if (sc.fuente1 && !sc.fuente) sc.fuente = sc.fuente1;
    formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(+x.toFixed(2)).replace('.', '.');
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
    if (sc.modo === 'media' && (sc.lado === 'inf' || sc.lado === 'sup')) return `A sample of ${esc(sc.n)} elements has mean ${esc(sc.xm)} and sample standard deviation ${esc(sc.s)}. Calculate the ${sc.lado === 'inf' ? 'lower' : 'upper'} bound of the population mean with a confidence of ${esc(sc.nivel)} %.`;
    switch (sc.modo) {
      case 'apareadas': return `${esc(sc.n)} people are measured before and after a treatment. The mean of the differences is ${esc(sc.dm)} and its sample standard deviation ${esc(sc.sd)}. Calculate the ${nc} confidence interval for the mean of the differences.`;
      case 'cociente-var': return `Two samples of ${esc(sc.n1)} and ${esc(sc.n2)} parts have sample standard deviations ${esc(sc.s1)} and ${esc(sc.s2)}. Calculate the ${nc} interval for σ₁²/σ₂² and say whether the variances can be equal.`;
      case 'media': return sc.fuente === 'datos' ? `With the sample data, calculate the ${nc} confidence interval for the population mean.` : `A sample of ${esc(sc.n)} elements has mean ${esc(sc.xm)}${sc.sigmaC === 'si' ? `. The population standard deviation is ${esc(sc.sigma)}` : ` and sample standard deviation ${esc(sc.s)}`}. Calculate the ${nc} confidence interval for the mean and the margin of error.`;
      case 'proporcion': return `In a sample of ${esc(sc.n)} people, ${sc.tipoP === 'proporcion' ? `the proportion with the characteristic is ${esc(sc.ph)}` : `${esc(sc.x)} have the characteristic`}. Calculate the ${nc} confidence interval for the proportion and the margin of error.`;
      case 'varianza': return `A sample of ${esc(sc.n)} parts has sample standard deviation ${esc(sc.s)}. Calculate the ${nc} confidence interval for the variance and for the population standard deviation.`;
      case 'dif-medias': return `Two independent samples: n₁ = ${esc(sc.n1)} with mean ${esc(sc.xm1)} and n₂ = ${esc(sc.n2)} with mean ${esc(sc.xm2)}${sc.caso === 'conocidas' ? `, from populations with σ₁ = ${esc(sc.sigma1)} and σ₂ = ${esc(sc.sigma2)}` : ''}. Calculate the ${nc} interval for μ₁ − μ₂ and say whether the means are different.`;
      case 'dif-prop': return `In one sample of ${esc(sc.n1)} there are ${esc(sc.x1)} successes and in another of ${esc(sc.n2)}, ${esc(sc.x2)}. Calculate the ${nc} interval for p₁ − p₂.`;
      default: return sc.de === 'proporcion' ? `How many people must be surveyed to estimate a proportion${sc.p0 ? ` (expected to be ${esc(sc.p0)})` : ''} with a maximum error of ${esc(sc.E)} and a confidence of ${esc(sc.nivel)} %?` : `The standard deviation of a population is ${esc(sc.sigma)}. What sample size is needed to estimate the mean with a maximum error of ${esc(sc.E)} and a confidence of ${esc(sc.nivel)} %?`;
    }
  };

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
    try { sol = I.resolver({ ...sc, fuente1: sc.fuente ?? sc.fuente1, fuente2: sc.fuente ?? sc.fuente2 }); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#usar-en').hidden = true; $('#pasos').innerHTML = ''; $('#cuenta').textContent = ''; sim = null; dibuja(); return; }
    err.hidden = true; guarda();
    const nc = `${f(100 * sol.c)} %`;
    let h;
    if (sol.modo === 'tamano') h = dato(sol.de.startsWith('dif') ? 'Size of each sample' : 'Sample size', `n = <b>${sol.n}</b>`) + dato('Unrounded', `${f(sol.n0, 6)}`) + dato('Critical value', CRIT(sol));
    else {
      const tipo = sol.lado === 'inf' ? 'Lower bound' : sol.lado === 'sup' ? 'Upper bound' : 'Interval';
      h = dato(`${tipo} at ${nc} for ${sol.paramTxt || PARAM[sol.modo]}`, `<b>${iv(sol.a, sol.b)}</b>`, 'ancho');
      if (sol.modo === 'varianza') h += dato(`Interval for σ`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Estimate', `s<sup>2</sup> = ${f(sol.est, 5)}`);
      else if (sol.modo === 'cociente-var') h += dato(`Interval for σ₁/σ₂`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Estimate', `s₁<sup>2</sup>/s₂<sup>2</sup> = ${f(sol.est, 5)}`);
      else h += dato('Estimate', `${{ prediccion: 'x̄', media: 'x̄', proporcion: 'p̂', 'dif-medias': 'x̄₁ − x̄₂', apareadas: 'd̄', 'dif-prop': 'p̂₁ − p̂₂' }[sol.modo]} = ${f(sol.est, 5)}`) + dato('Margin of error', `E = <b>${f(sol.err)}</b>`);
      h += dato(sol.crit === 'k' ? 'Tolerance factor' : 'Critical value', CRIT(sol));
      if (sol.modo === 'proporcion') h += dato('Method', I.METODOS_P[sol.metodoP]);
      if (sol.h0 !== undefined) h += dato(`Test of ${PARAM[sol.modo]} = ${f(sol.h0)}`, sol.rechaza ? '<b>H₀ is rejected</b>' : '<b>H₀ is not rejected</b>', 'ancho');
    }
    $('#res').innerHTML = h;
    const ue = $('#usar-en'), lleva = (sol.modo === 'media' || sol.modo === 'prediccion' || sol.modo === 'varianza') && sc.fuente === 'datos' && !Herramienta.vacio(sc.datos);
    ue.hidden = !lleva;
    ue.innerHTML = lleva ? `<a class="btn" data-usar="descriptiva" href="${esc(Herramienta.enlaceA('descriptiva', { formato: 'lista', datos: sc.datos, pesos: '', div: 'n1', pk: '' }))}">Descriptive statistics of these data →</a>` : '';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#simcard').hidden = sol.modo === 'tamano' || sol.modo === 'prediccion';
    nuevaSim();
    dibuja();
  }

  const N = 100;
  function nuevaSim() {
    const g = sol && I.simula(sol);
    sim = g ? { ...g, hechos: [], t: 0 } : null;
    if (!sim) return;
    try { for (let i = 0; i < N; i++) sim.hechos.push(g.una()); } catch (e) { sim = null; }
    $('#cuenta').textContent = '';
  }
  const visibles = () => (sim ? Math.min(N, Math.floor(sim.t * 25)) : 0);

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--ok', '--mal']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => Herramienta.lienzo(s);
  const FUENTE_UI = '"IBM Plex Sans", system-ui, sans-serif';
  function dibuja() { campana(); simulacion(); }
  function campana() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    const S = sol.sinGrafica ? { ...sol, k: sol.kz, c: sol.cob, crit: 'z', dist: { d: 'normal' } } : sol;
    if (!col['--ink']) colores();
    const d = S.dist, D = E.DIST[d.d], P = d.d === 'normal' ? { mu: 0, sigma: 1 } : d.d === 't' ? { nu: d.nu } : d.d === 'f' ? { d1: d.d1, d2: d.d2 } : { k: d.k };
    const al = 1 - S.c, asim = d.d === 'chi2' || d.d === 'f', inf = S.lado === 'inf', sup = S.lado === 'sup';
    let x0, x1;
    if (d.d === 'chi2') { x0 = 0; x1 = Math.max(S.k * 1.25, d.k + 4 * Math.sqrt(2 * d.k)); } else if (d.d === 'f') { x0 = 0; x1 = Math.max(S.k * 1.25, E.cuantil(D, P, 0.99)); } else { const r = Math.max(4, S.k * 1.35); x0 = -r; x1 = r; }
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
    const nom = d.d === 'normal' ? 'Z ~ N(0, 1)' : d.d === 't' ? `T ~ Student's t with ${d.nu} d.f.` : d.d === 'f' ? `Snedecor's F with (${d.d1}, ${d.d2}) d.f.` : `χ² with ${d.k} d.f.`;
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(nom, mL, 4);
    g.fillStyle = col['--accent']; g.textAlign = 'center'; g.font = `600 13px ${FUENTE_UI}`; g.fillText(`1 − α = ${txt(f(S.c))}`, X((lo + hi) / 2), Y(D.pdf(P, (lo + hi) / 2)) * 0.5 + Y(0) * 0.5);
    g.font = `12px ${FUENTE_UI}`; g.fillStyle = col['--mal'];
    const ya = mT + (h - mT - mB) * 0.6, et = inf || sup ? `α = ${txt(f(al))}` : `α/2 = ${txt(f(al / 2))}`, an = g.measureText(et).width;
    if (!inf) { if (X(lo) - 8 - an >= mL) { g.textAlign = 'right'; g.fillText(et, X(lo) - 8, ya); } else { g.textAlign = 'left'; g.fillText(et, mL, ya - 18); } }
    if (!sup) { if (X(hi) + 8 + an <= w - mR) { g.textAlign = 'left'; g.fillText(et, X(hi) + 8, ya); } else { g.textAlign = 'right'; g.fillText(et, w - mR, ya - 18); } }
  }
  function simulacion() {
    const { g, w, h } = lienzo('#sim');
    if (!sim || !sol) return;
    const v = visibles(), hs = sim.hechos;
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
    $('#cuenta').innerHTML = v ? `<b>${dentro} of ${v}</b> intervals contain the true value${v === N ? ` (about ${Math.round(100 * sol.c)} are expected)` : ''}.` : '';
  }

  $('#otra').addEventListener('click', () => { nuevaSim(); if (sim) sim.t = 0; anda = true; $('#play').textContent = '⏸ Pause'; dibuja(); });
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Resume'; });
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

