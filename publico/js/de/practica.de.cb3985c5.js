const Practica = (() => {
  const NIVELES = { F: 'facil', M: 'medio', D: 'dificil' };
  const rngDe = (sem) => { let a = sem >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const codigoDe = (nivel, sem) => `${nivel[0].toUpperCase()}-${(sem >>> 0).toString(36).toUpperCase()}`;
  const leeCodigo = (c) => { const m = /^\s*([FMD])\s*-?\s*([0-9A-Z]{1,7})\s*$/i.exec(String(c)); return m ? { nivel: NIVELES[m[1].toUpperCase()], sem: parseInt(m[2], 36) >>> 0 } : null; };
  let nivelAhora = 'medio';
  const conSemilla = (sem, f) => { const orig = Math.random, r = rngDe(sem); Math.random = r; try { return f(r); } finally { Math.random = orig; } };
  const azar = (a, b) => a + Math.random() * (b - a), entero = (a, b) => Math.floor(azar(a, b + 1));
  const toma = (xs) => xs[Math.floor(Math.random() * xs.length)];
  const visible = (e) => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length) && !e.closest('[hidden]');
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const CONF = {
    calorimetria: { datos: null, items: '#te, #resumen-d > div', genera: () => window.CalorApp?.azar(), enunciado: () => window.CalorApp?.enunciado() },
    disoluciones: { items: '#valores > .valor:not(.dato), #valores-prep > .valor, #valores-col > .valor, #res-dil, #res-mez' },
    simulador: { datos: null, tapa: '#modos, #panel > .tabla-scroll, #panel > h3, #panel > .nota', items: '#resumen > div.num', genera: () => window.SimuladorApp?.azar(), enunciado: () => window.SimuladorApp?.enunciado() },
    matrices: { items: '#res' },
    taylor: { datos: null, items: '#resumen > div.num', genera: () => window.TaylorApp?.azar(), enunciado: () => window.TaylorApp?.enunciado() },
    fourier: { datos: null, items: '#resumen > div.num', genera: () => window.FourierApp?.azar(), enunciado: () => window.FourierApp?.enunciado() },
    edos: { datos: null, items: '#resumen > div.num', genera: () => window.EDOsApp?.azar(), enunciado: () => window.EDOsApp?.enunciado() },
    cinetica: { datos: null, items: '#resumen > div.num', genera: () => window.CineticaApp?.azar(), enunciado: () => window.CineticaApp?.enunciado() },
    solubilidad: { datos: null, items: '#resumen > div.num', genera: () => window.SolubilidadApp?.azar(), enunciado: () => window.SolubilidadApp?.enunciado() },
    equilibrio: { datos: null, items: '#resumen > div.num', genera: () => window.EquilibrioApp?.azar(), enunciado: () => window.EquilibrioApp?.enunciado() },
    'integrales-multiples': { datos: null, items: '#resumen > div.num', genera: () => window.IntegralesMultiplesApp?.azar(), enunciado: () => window.IntegralesMultiplesApp?.enunciado() },
    series: { datos: null, items: '#resumen > div.num', genera: () => window.SeriesApp?.azar(), enunciado: () => window.SeriesApp?.enunciado() },
    lagrange: { datos: null, items: '#resumen > div.num', genera: () => window.LagrangeApp?.azar(), enunciado: () => window.LagrangeApp?.enunciado() },
    campos: { datos: null, items: '#resumen > div.num', genera: () => window.CamposApp?.azar(), enunciado: () => window.CamposApp?.enunciado() },
    imagenes: { datos: null, items: '#resumen > div', genera: () => window.ImagenesApp?.azar(), enunciado: () => window.ImagenesApp?.enunciado() },
    fuerza: { datos: null, items: '#res > div', genera: () => window.FuerzaApp?.azar(), enunciado: () => window.FuerzaApp?.enunciado() },
    intervalos: { datos: null, items: '#res > div', genera: () => window.IntervalosApp?.azar(), enunciado: () => window.IntervalosApp?.enunciado() },
    'laplace-numerica': { datos: null, items: '#resumen > div.num', genera: () => window.LaplaceNumericaApp?.azar(), enunciado: () => window.LaplaceNumericaApp?.enunciado() },
    'guias-onda': { datos: null, items: '#resumen > div.num', genera: () => window.GuiasOndaApp?.azar(), enunciado: () => window.GuiasOndaApp?.enunciado() },
    cavidades: { datos: null, items: '#resumen > div.num', genera: () => window.CavidadesApp?.azar(), enunciado: () => window.CavidadesApp?.enunciado() },
    'lineas-transmision': { datos: null, items: '#resumen > div.num', genera: () => window.LineasTransmisionApp?.azar(), enunciado: () => window.LineasTransmisionApp?.enunciado() },
    'ondas-em': { datos: null, items: '#res > div', genera: () => window.OndasEMApp?.azar(), enunciado: () => window.OndasEMApp?.enunciado() },
    maxwell: { datos: null, items: '#res > div', genera: () => window.MaxwellApp?.azar(), enunciado: () => window.MaxwellApp?.enunciado() },
    fresnel: { datos: null, items: '#res > div', genera: () => window.FresnelApp?.azar(), enunciado: () => window.FresnelApp?.enunciado() },
    'trabajo-y-energia': { datos: null, items: '#resumen > div', genera: () => window.EnergiaApp?.azar(), enunciado: () => window.EnergiaApp?.enunciado() },
    'tiro-parabolico': { datos: null, items: '#resumen > div, #resumen-r > div, #resumen-c > div', genera: () => window.TiroApp?.azar(), enunciado: () => window.TiroApp?.enunciado() },
    'solido-rigido': { datos: null, items: '#res > div', genera: () => window.SolidoApp?.azar(), enunciado: () => window.SolidoApp?.enunciado() },
    ondas: { datos: null, items: '#res > div', genera: () => window.OndasApp?.azar(), enunciado: () => window.OndasApp?.enunciado() },
    doppler: { datos: null, items: '#resumen > div', genera: () => window.DopplerApp?.azar(), enunciado: () => window.DopplerApp?.enunciado() },
    ciclos: { datos: null, items: '#resumen > div', genera: () => window.CiclosApp?.azar(), enunciado: () => window.CiclosApp?.enunciado() },
    gases: { datos: null, items: '#res > div', genera: () => window.GasesApp?.azar(), enunciado: () => window.GasesApp?.enunciado() },
    fluidos: { datos: null, items: '#resumen > div', genera: () => window.FluidosApp?.azar(), enunciado: () => window.FluidosApp?.enunciado() },
    dinamica: { datos: null, items: '#res > div', genera: () => window.DinamicaApp?.azar(), enunciado: () => window.DinamicaApp?.enunciado() },
    antena: { datos: null, items: '#resumen > div', genera: () => window.AntenaApp?.azar(), enunciado: () => window.AntenaApp?.enunciado() },
    choques: { datos: null, items: '#resumen > div', genera: () => window.ChoquesApp?.azar(), enunciado: () => window.ChoquesApp?.enunciado() },
    gravitacion: { datos: null, items: '#resumen > div', genera: () => window.GravitacionApp?.azar(), enunciado: () => window.GravitacionApp?.enunciado() },
    interferencia: { datos: null, items: '#res > div', genera: () => window.InterferenciaApp?.azar(), enunciado: () => window.InterferenciaApp?.enunciado() },
    laplace: { datos: null, items: '#resumen > div.num', genera: () => window.LaplaceApp?.azar(), enunciado: () => window.LaplaceApp?.enunciado() },
    control: { datos: null, items: '#resumen > div.num', genera: () => window.ControlApp?.azar(), enunciado: () => window.ControlApp?.enunciado() },
    convolucion: { datos: null, items: '#resumen > div.num', genera: () => window.ConvolucionApp?.azar(), enunciado: () => window.ConvolucionApp?.enunciado() },
    superficies: { datos: null, items: '#resumen > div.num', genera: () => window.SuperficiesApp?.azar(), enunciado: () => window.SuperficiesApp?.enunciado() },
    derivadas: { datos: null, items: '#resumen > div.num', genera: () => window.DerivadasApp?.azar(), enunciado: () => window.DerivadasApp?.enunciado() },
    complejos: { datos: null, genera: () => window.ComplejosApp?.azar(), enunciado: () => window.ComplejosApp?.enunciado() },
    sistemas: { items: '#res', valido: () => !/[λμ]|incompatible|no tiene/i.test(document.querySelector('#res')?.textContent + document.querySelector('#tipo')?.textContent) },
    estadistica: { datos: null, items: '#res', genera: () => window.EstadisticaApp?.azar(), enunciado: () => window.EstadisticaApp?.enunciado() },
    regresion: { datos: null, genera: () => window.RegresionApp?.azar(), enunciado: () => 'Berechne mit den Daten der Tabelle die Regressionsgerade von Y auf X, die von X auf Y, den Korrelationskoeffizienten, die Mittelwerte, die Kovarianz und den gesuchten Schätzwert von y.' },
    resistencias: { datos: null, genera: () => window.ResistenciasApp?.azar(), enunciado: () => `Welchen Wert hat ein Widerstand mit den Farbringen <b>${esc(window.ResistenciasApp?.colores() || '')}</b>? Schreibe den Wert und den Toleranzbereich in denselben Einheiten.` },
    magnetostatica: { items: '[data-res]', tapa: '[data-res], [data-steps], .cvwrap', datos: '#fuentes',
      despues: () => pon(document.querySelector('#enunciado'), 'Übungsaufgabe: Berechne das Magnetfeld an den Punkten der Fragen mit den Quellen links.'),
      antes: () => { const m = document.querySelector('#modo'); if (m && m.value !== 'si') { m.value = 'si'; m.dispatchEvent(new Event('change', { bubbles: true })); } } },
    'masa-molar': {
      items: '#res-masa .grande, #resumen-este > div, #resumen-emp > div', quitar: '', datos: null,
      tapa: '#res-masa, #conv-card, #tabla-este td.n, #tabla-este td.m, #tabla-este td.s, #resumen-este, #este .pasos, #resumen-emp, #emp .pasos',
      genera: () => window.MasaApp?.azar(), enunciado: () => window.MasaApp?.enunciado(),
      get textos() { return document.querySelector('#tab-emp')?.getAttribute('aria-selected') === 'true' ? [{ et: 'Summenformel', sel: '#resumen-emp .formula' }] : []; },
    },
    graficador: { datos: null, genera: () => window.GraficadorApp?.azar(), enunciado: () => window.GraficadorApp?.enunciado() },
    errores: { datos: null, genera: () => window.ErroresApp?.azar(), enunciado: () => window.ErroresApp?.enunciado() },
    contrastes: { datos: null, genera: () => window.ContrastesApp?.azar(), enunciado: () => window.ContrastesApp?.enunciado() },
    'chi2-bondad': { datos: null, genera: () => window.Chi2BondadApp?.azar(), enunciado: () => window.Chi2BondadApp?.enunciado() },
    probabilidad: { datos: null, items: '#resumen > div.pr', genera: () => window.ProbabilidadApp?.azar(), enunciado: () => window.ProbabilidadApp?.enunciado() },
    'puertas-logicas': { datos: null, items: '#resumen > div.pr', genera: () => window.PuertasLogicasApp?.azar(), enunciado: () => window.PuertasLogicasApp?.enunciado() },
    unidades: { datos: null, items: '#resumen > div.pr', genera: () => window.UnidadesApp?.azar(), enunciado: () => window.UnidadesApp?.enunciado() },
    'sistemas-numericos': { datos: null, items: '#resumen > div.pr', genera: () => window.SistemasNumericosApp?.azar(), enunciado: () => window.SistemasNumericosApp?.enunciado() },
    'oferta-demanda': { datos: null, genera: () => window.OfertaDemandaApp?.azar(), enunciado: () => window.OfertaDemandaApp?.enunciado() },
    excedentes: { datos: null, genera: () => window.ExcedentesApp?.azar(), enunciado: () => window.ExcedentesApp?.enunciado() },
    descriptiva: { datos: null, genera: () => window.DescriptivaApp?.azar(), enunciado: () => window.DescriptivaApp?.enunciado() },
    'anova': { datos: null, genera: () => window.AnovaApp?.azar(), enunciado: () => window.AnovaApp?.enunciado() },
    'no-parametricos': { datos: null, genera: () => window.NoParametricosApp?.azar(), enunciado: () => window.NoParametricosApp?.enunciado() },
    'regresion-multiple': { datos: null, genera: () => window.RegresionMultipleApp?.azar(), enunciado: () => window.RegresionMultipleApp?.enunciado() },
    'regresion-economia': { datos: null, genera: () => window.RegresionEconomiaApp?.azar(), enunciado: () => window.RegresionEconomiaApp?.enunciado() },
    elasticidades: { datos: null, genera: () => window.ElasticidadesApp?.azar(), enunciado: () => window.ElasticidadesApp?.enunciado() },
    costes: { datos: null, genera: () => window.CostesApp?.azar(), enunciado: () => window.CostesApp?.enunciado() },
    beneficio: { datos: null, genera: () => window.BeneficioApp?.azar(), enunciado: () => window.BeneficioApp?.enunciado() },
    'pib-ipc': { datos: null, genera: () => window.PibIpcApp?.azar(), enunciado: () => window.PibIpcApp?.enunciado() },
    multiplicador: { datos: null, genera: () => window.MultiplicadorApp?.azar(), enunciado: () => window.MultiplicadorApp?.enunciado() },
    'is-lm': { datos: null, genera: () => window.IsLmApp?.azar(), enunciado: () => window.IsLmApp?.enunciado() },
    'phillips-okun': { datos: null, genera: () => window.PhillipsOkunApp?.azar(), enunciado: () => window.PhillipsOkunApp?.enunciado() },
    'tipos-cambio': { datos: null, genera: () => window.TiposCambioApp?.azar(), enunciado: () => window.TiposCambioApp?.enunciado() },
    interes: { datos: null, genera: () => window.InteresApp?.azar(), enunciado: () => window.InteresApp?.enunciado() },
    prestamos: { datos: null, genera: () => window.PrestamosApp?.azar(), enunciado: () => window.PrestamosApp?.enunciado() },
    'van-tir': { datos: null, genera: () => window.VanTirApp?.azar(), enunciado: () => window.VanTirApp?.enunciado() },
    rentas: { datos: null, genera: () => window.RentasApp?.azar(), enunciado: () => window.RentasApp?.enunciado() },
    ahorro: { datos: null, genera: () => window.AhorroApp?.azar(), enunciado: () => window.AhorroApp?.enunciado() },
    'punto-muerto': { datos: null, genera: () => window.PuntoMuertoApp?.azar(), enunciado: () => window.PuntoMuertoApp?.enunciado() },
    'amortizacion-inmovilizado': { datos: null, genera: () => window.AmortizacionApp?.azar(), enunciado: () => window.AmortizacionApp?.enunciado() },
    'numeros-indice': { datos: null, genera: () => window.NumerosIndiceApp?.azar(), enunciado: () => window.NumerosIndiceApp?.enunciado() },
    'lorenz-gini': { datos: null, genera: () => window.LorenzGiniApp?.azar(), enunciado: () => window.LorenzGiniApp?.enunciado() },
    solow: { datos: null, genera: () => window.SolowApp?.azar(), enunciado: () => window.SolowApp?.enunciado() },
    bonos: { datos: null, genera: () => window.BonosApp?.azar(), enunciado: () => window.BonosApp?.enunciado() },
    'black-scholes': { datos: null, genera: () => window.BlackScholesApp?.azar(), enunciado: () => window.BlackScholesApp?.enunciado() },
    markowitz: { datos: null, genera: () => window.MarkowitzApp?.azar(), enunciado: () => window.MarkowitzApp?.enunciado() },
    ratios: { datos: null, genera: () => window.RatiosApp?.azar(), enunciado: () => window.RatiosApp?.enunciado() },
    balance: { datos: null, genera: () => window.BalanceApp?.azar(), enunciado: () => window.BalanceApp?.enunciado() },
    ajustador: { datos: null, items: '#coefs > div', genera: () => window.AjustadorApp?.azar(), enunciado: () => window.AjustadorApp?.enunciado() },
    formulacion: {
      datos: null, items: null, genera: () => window.FormulacionApp?.azar(), enunciado: () => window.FormulacionApp?.enunciado(),
      textos: [{ et: 'Tu respuesta', sel: '#ac0', otros: Array.from({ length: 59 }, (_, i) => `#ac${i + 1}`), ph: 'Schreibe den Namen oder die Formel' }],
    },
    redox: { datos: null, items: '#coefs > div', genera: () => window.RedoxApp?.azar(), enunciado: () => window.RedoxApp?.enunciado() },
    vsepr: {
      datos: null, items: '#resumen > div.num', genera: () => window.VseprApp?.azar(), enunciado: () => window.VseprApp?.enunciado(),
      textos: [{ et: 'Molekülgeometrie', sel: '#r-geo', ph: 'tetraedrisch …' }, { et: 'Hybridisierung', sel: '#r-hib', ph: 'sp3…' }, { et: 'Polarität', sel: '#r-pol', ph: 'polar o apolar' }],
    },
    organica: {
      datos: null, items: null, genera: () => window.OrganicaApp?.azar(), enunciado: () => window.OrganicaApp?.enunciado(),
      textos: [{ et: 'IUPAC-Name', sel: '#titulo-mol', ph: 'butan-2-ol…' }],
      numeros: [{ et: 'Chirale Zentren', sel: '#r-nc' }, { et: 'Stereoisomere', sel: '#r-ne' }],
    },
    'configuracion-electronica': {
      items: null, tapa: '#res', datos: null,
      genera: () => { window.ConfigApp?.pestana('el'); pon(document.querySelector('#entrada'), String(entero(1, 56))); },
      enunciado: () => { const g = (s) => document.querySelector(s)?.textContent.trim() || ''; return `Schreibe die Elektronenkonfiguration von <b>${esc(g('#nombre').toLowerCase())}</b> (${esc(g('#sim'))}, Z = ${esc(g('#z'))}) in der Auffüllreihenfolge und wie viele ungepaarte Elektronen es hat.`; },
      textos: [{ et: 'Elektronenkonfiguration', sel: '#llenado', otros: ['#abreviada', '#capas-txt'] }],
      numeros: [{ et: 'Ungepaarte Elektronen', sel: '#desap' }],
    },
  };

  function pon(el, v) {
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const lee = (s) => { const t = String(s).trim().replace(/\s+/g, '').replace(/[−–]/g, '-'); return /^-?\d+(,\d+)?$/.test(t) || /^-?\d*\.\d+$/.test(t) ? parseFloat(t.replace(',', '.')) : null; };
  const escribe = (x, como) => (como.includes(',') || !Number.isInteger(x) ? String(x).replace('.', ',') : String(x));
  const redondea = (x, cifras) => { if (x === 0) return 0; const e = Math.floor(Math.log10(Math.abs(x))) - cifras + 1; return Math.round(x / 10 ** e) * 10 ** e; };
  const limpio = (x) => parseFloat(x.toPrecision(12));

  function otroValor(v, etiqueta, texto) {
    if (v === 0) return 0;
    const ang = /°|ángulo|grados|α|θ|φ/i.test(etiqueta), s = Math.sign(v), a = Math.abs(v);
    if (Number.isInteger(v) && !texto.includes(',') && a <= 12) return s * entero(Math.max(1, Math.round(a * 0.5)), Math.round(a * 1.5) + 1);
    if (ang && a > 0 && a < 90) return s * Math.round(azar(Math.max(5, a * 0.6), Math.min(85, a * 1.4)));
    if (a > 0 && a < 1) return limpio(s * Math.min(0.98, Math.max(0.02, redondea(a * azar(0.6, 1.5), 2))));
    const dec = (texto.split(',')[1] || '').length, cifras = Math.max(2, String(Math.round(a * 10 ** dec)).replace(/^0+/, '').length);
    return limpio(s * redondea(a * azar(0.6, 1.5), nivelAhora === 'facil' ? 2 : Math.min(3, cifras)));
  }
  const etiquetaDe = (inp) => [inp.getAttribute('aria-label'), inp.id && document.querySelector(`label[for="${inp.id}"]`)?.textContent, inp.closest('label')?.textContent, inp.closest('.row, .fila')?.textContent].filter(Boolean).join(' ');

  const RE = /(?:(?<![\p{L}\d,.])|(?<=(?:^|[^\p{L}\d])j))([−-]?\d+(?:[.,]\d+)?(?:\/\d+)?)(\s*[·×]\s*10)?/gu;
  const conEtiqueta = (el) => el.matches('div') && el.firstElementChild?.tagName === 'SPAN' && !el.firstElementChild.className && el.firstChild === el.firstElementChild;
  function numeros(el, quitar = 'small, .nota') {
    const c = el.cloneNode(true);
    if (conEtiqueta(c)) c.firstElementChild.remove();
    if (quitar) for (const x of c.querySelectorAll(quitar)) x.remove();
    for (const fr of c.querySelectorAll('.fr')) if (fr.children.length === 2) fr.replaceWith(`${fr.children[0].textContent.trim()}/${fr.children[1].textContent.trim()}`);
    c.normalize();
    const vals = [], tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT), nodos = [];
    while (tw.nextNode()) if (!tw.currentNode.parentElement.closest('sub, sup, math, .formula')) nodos.push(tw.currentNode);
    for (const n of nodos) {
      const t = n.nodeValue, frag = document.createDocumentFragment();
      let i = 0, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(t))) {
        let texto = m[1], v = texto.includes('/') ? texto.replace('−', '-').split('/').map((x) => parseFloat(x.replace(',', '.'))).reduce((a, b) => a / b) : parseFloat(texto.replace('−', '-').replace(',', '.')), exp = 0, fin = m.index + m[0].length;
        if (m[2]) {
          const sup = n.nextSibling;
          if (fin === t.length && sup && sup.nodeName === 'SUP' && /^[−-]?\d+$/.test(sup.textContent.trim())) { exp = parseInt(sup.textContent.trim().replace('−', '-'), 10); v *= 10 ** exp; sup.remove(); } else fin = m.index + m[1].length;
        }
        if (!Number.isFinite(v)) continue;
        frag.append(t.slice(i, m.index));
        const h = document.createElement('span'); h.dataset.hueco = String(vals.length); frag.append(h);
        vals.push({ t: texto + (exp ? `·10^${exp}` : ''), v, dec: (texto.split('/')[0].split(/[.,]/)[1] || '').length, exp, frac: texto.includes('/') });
        i = fin;
      }
      if (vals.length && i) { frag.append(t.slice(i)); n.replaceWith(frag); }
    }
    return { plantilla: c.innerHTML, vals };
  }
  function leeAlumno(s) {
    let t = String(s).trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/,/g, '.');
    if (!t) return null;
    t = t.replace(/(?:·|\*|x|×)10\^?\(?(-?\d+)\)?$/i, 'e$1');
    if (/^-?\d*\.?\d+(e-?\d+)?\/-?\d*\.?\d+$/.test(t)) { const [a, b] = t.split('/').map(Number); return b ? a / b : null; }
    return /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t) ? Number(t) : null;
  }
  const tolerancia = (x) => (x.frac ? 1e-9 + 0.005 * Math.abs(x.v) : Math.max(0.01 * Math.abs(x.v), 0.5 * 10 ** (x.exp - x.dec) * 1.0001));
  const normaConf = (s) => String(s).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).replace(/\^/g, '').replace(/\s+/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const CSS = `
.prac-btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 5px 12px; cursor: pointer; white-space: nowrap }
.prac-btn:hover { border-color: var(--accent); color: var(--accent) }
.prac-btn[aria-pressed=true] { background: var(--accent); border-color: var(--accent); color: var(--panel) }
.prac-tapa { filter: blur(9px); opacity: .45; pointer-events: none; user-select: none; transition: filter .2s }
.prac { background: var(--panel); border: 1px solid var(--accent); border-radius: 10px; padding: 14px; margin-bottom: 14px; box-shadow: inset 4px 0 0 var(--accent) }
.prac h2 { font: 600 15px var(--f-ui, system-ui); margin: 0 0 6px; color: var(--accent) }
.prac > p { margin: 0 0 10px; color: var(--muted) }
.prac .enun { color: var(--ink) }
.prac-q { display: grid; gap: 8px; margin: 0 0 12px }
.prac-q > div { display: grid; grid-template-columns: minmax(120px, max-content) minmax(0, 1fr); gap: 4px 12px; align-items: baseline }
.prac-q .et { color: var(--muted); font-size: 13px }
.prac-q .val { line-height: 2.1 }
@media (max-width: 560px) { .prac-q > div { grid-template-columns: minmax(0, 1fr) } }
.prac-in { font: 13.5px var(--f-mono, ui-monospace, monospace); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 3px 6px; width: 7.5em; margin: 0 2px }
.prac-in.ancha { width: min(100%, 22em) }
.prac-in.bien { border-color: #1d8a5b; box-shadow: 0 0 0 1px #1d8a5b } .prac-in.mal { border-color: #c0392b; box-shadow: 0 0 0 1px #c0392b }
.prac-sol { font: 12.5px var(--f-mono, ui-monospace, monospace); color: var(--accent); margin-left: 2px }
.prac-acc { display: flex; flex-wrap: wrap; gap: 8px }
.prac-acc button { font: 500 13px var(--f-ui, system-ui); border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 6px; padding: 6px 12px; cursor: pointer }
.prac-acc button.si { background: var(--accent); border-color: var(--accent); color: var(--panel) }
.prac-cod { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin: 10px 0 0; font-size: 13px; color: var(--muted) }
.prac-cod select { font: 13px var(--f-ui, system-ui); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 3px 6px }
.prac-codigo { font: 13.5px var(--f-mono, ui-monospace, monospace); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 6px; padding: 3px 6px; width: 6.5em; text-transform: uppercase }
.prac-codigo.mal { border-color: #c0392b }
.prac-nota { margin: 10px 0 0; font-weight: 600 } .prac-nota.bien { color: #1d8a5b } .prac-nota.mal { color: #c0392b }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .prac-nota.bien { color: #4cc48e } :root:not([data-theme="light"]) .prac-nota.mal { color: #ef6a5a } }
:root[data-theme="dark"] .prac-nota.bien { color: #4cc48e } :root[data-theme="dark"] .prac-nota.mal { color: #ef6a5a }
`;

  function monta(herramienta, clave) {
    const cab = document.querySelector('header.top');
    if (!cab || herramienta === 'tabla-periodica' || document.querySelector('.prac-btn')) return null;
    const conf = CONF[herramienta] || {};
    const K_ANTES = `simu-practica:${herramienta}`;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'prac-btn'; btn.setAttribute('aria-pressed', 'false'); btn.title = 'Aufgaben mit Zufallsdaten: Schreibe deine Ergebnisse und prüfe sie, bevor du die Herleitung ansiehst';
    btn.innerHTML = '<span aria-hidden="true">✎</span> Übungsmodus';
    const der = document.querySelector('.miga-der'), tras = cab.querySelector('.bib-btn') || cab.querySelector('.a-inicio');
    if (der) der.append(btn); else (tras ? tras.after(btn) : cab.prepend(btn));

    let activo = false, card = null, preguntas = [], tapados = [], resuelto = false;
    const layout = () => [...document.querySelectorAll('.layout')].find(visible);
    const datos = () => (conf.datos === null ? null : conf.datos ? document.querySelector(conf.datos) : layout()?.firstElementChild);
    const hayError = () => [...document.querySelectorAll('.error, #errores')].some((e) => visible(e) && e.textContent.trim());
    function zonaTapa() {
      if (conf.tapa) return [...document.querySelectorAll(conf.tapa)].filter((e) => !e.closest('.prac'));
      const l = layout(); return l ? [...l.children].slice(1).flatMap((col) => [...col.children]).filter((e) => !e.classList.contains('prac')) : [];
    }
    function items() {
      if (!conf.items && conf.items !== undefined) return [];
      const sel = conf.items || '#res > div, #resumen > div';
      return [...document.querySelectorAll(sel)].filter((e) => !e.closest('.prac') && (visible(e) || e.closest('.prac-tapa')));
    }
    function ejemplo() {
      const d = datos(); if (!d) return;
      const usable = (x) => visible(x) || (document.body.classList.contains('bib-ejemplos') && /^ejemplo/.test(x.id) && !x.closest('[hidden]'));
      const s = [...d.querySelectorAll('select')].find((x) => usable(x) && x.options.length > 2 && /ejemplo/i.test(x.id + ' ' + x.options[0].textContent));
      if (s) { s.selectedIndex = entero(1, s.options.length - 1); s.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    function cambiaDatos() {
      const d = datos(); if (!d) return;
      for (const inp of [...d.querySelectorAll('input')].filter((x) => visible(x) && (!x.type || x.type === 'text' || x.type === 'number' || x.type === 'search') && !x.classList.contains('nom'))) {
        const v = lee(inp.value); if (v === null) continue;
        pon(inp, escribe(otroValor(v, etiquetaDe(inp), inp.value), inp.value));
      }
    }
    function arma() {
      const its = items().map((el) => ({ el, et: conEtiqueta(el) ? el.firstElementChild.textContent.trim() : '', n: numeros(el, conf.quitar) })).filter((x) => x.n.vals.length && x.n.vals.length <= 9);
      let elegidos = its.length <= 4 ? its : [its[0], ...its.slice(1).sort(() => Math.random() - 0.5).slice(0, 3)].sort((a, b) => its.indexOf(a) - its.indexOf(b));
      let huecos = 0; elegidos = elegidos.filter((x) => (huecos += x.n.vals.length) <= 10 || x === elegidos[0]);
      const q = elegidos.map((x) => ({ tipo: 'num', idx: its.indexOf(x), et: x.et, plantilla: x.n.plantilla, vals: x.n.vals, el: x.el }));
      for (const t of conf.textos || []) q.push({ tipo: 'texto', et: t.et, sel: t.sel, otros: t.otros || [], ph: t.ph });
      for (const t of conf.numeros || []) { const el = document.querySelector(t.sel), n = el && numeros(el); if (n && n.vals.length) q.push({ tipo: 'num', et: t.et, sel: t.sel, plantilla: '', vals: n.vals.slice(0, 1) }); }
      return q;
    }
    let nivel = 'medio', semilla = 0;
    try { const g = localStorage.getItem('simu-practica-nivel'); if (['facil', 'medio', 'dificil'].includes(g)) nivel = g; } catch (e) { /* sin almacenamiento */ }
    function nuevo(sem) {
      resuelto = false; nivelAhora = nivel;
      semilla = sem === undefined ? Math.floor(Math.random() * 36 ** 5) + 1 : sem;
      let q = [];
      conSemilla(semilla, () => {
        for (let intento = 0; intento < 15 && !q.length; intento++) {
          conf.antes?.();
          if (conf.genera) conf.genera(); else { ejemplo(); cambiaDatos(); }
          conf.despues?.();
          if (!hayError() && (!conf.valido || conf.valido())) q = arma();
        }
        if (!q.length) { conf.genera ? conf.genera() : ejemplo(); q = arma(); }
      });
      preguntas = q; pinta();
    }
    function abreCodigo(c) {
      const k = leeCodigo(c); if (!k) return false;
      nivel = k.nivel; nuevo(k.sem); return true;
    }
    function tapa(v) {
      for (const e of tapados) { e.classList.remove('prac-tapa'); e.removeAttribute('aria-hidden'); }
      tapados = v ? zonaTapa() : [];
      for (const e of tapados) { e.classList.add('prac-tapa'); e.setAttribute('aria-hidden', 'true'); }
    }
    function pinta() {
      if (!card) { card = document.createElement('section'); card.className = 'prac'; card.setAttribute('aria-label', 'Übungsmodus'); card.addEventListener('click', clic); card.addEventListener('keydown', (e) => { if (e.key === 'Eingabe' && e.target.classList.contains('prac-codigo')) { e.preventDefault(); if (!abreCodigo(e.target.value)) e.target.classList.add('mal'); } else if (e.key === 'Eingabe' && e.target.classList.contains('prac-in')) { e.preventDefault(); comprueba(); } }); card.addEventListener('change', (e) => { if (e.target.dataset.a === 'nivel') { nivel = e.target.value; try { localStorage.setItem('simu-practica-nivel', nivel); } catch (x) { /* sin almacenamiento */ } nuevo(); } }); }
      tapa(!resuelto);
      const z = zonaTapa()[0] || tapados[0]; if (z && card.nextElementSibling !== z) z.before(card);
      let n = 0;
      const filas = preguntas.map((p, i) => {
        if (p.tipo === 'texto') return `<div><span class="et">${esc(p.et)}</span><span class="val"><input class="prac-in ancha" data-p="${i}" aria-label="${esc(p.et)}" autocomplete="off" spellcheck="false" placeholder="${esc(p.ph ?? '1s2 2s2 2p6…')}"></span></div>`;
        if (p.tipo === 'texto') return `<div><span class="et">${esc(p.et)}</span><span class="val"><input class="prac-in ancha" data-p="${i}" aria-label="${esc(p.et)}" autocomplete="off" spellcheck="false" placeholder="${esc(p.ph || '1s2 2s2 2p6…')}"></span></div>`;
        const tpl = p.plantilla ? p.plantilla.replace(/<span data-hueco="(\d+)"><\/span>/g, (_, k) => `<input class="prac-in" data-p="${i}" data-k="${k}" inputmode="decimal" autocomplete="off" aria-label="${esc(p.et || 'Ergebnis')} (${+k + 1})">`) : `<input class="prac-in" data-p="${i}" data-k="0" inputmode="decimal" autocomplete="off" aria-label="${esc(p.et)}">`;
        n++; return `<div><span class="et">${esc(p.et || (preguntas.length > 1 ? `Frage ${n}` : 'Ergebnis'))}</span><span class="val">${tpl}</span></div>`;
      }).join('');
      card.innerHTML = `<h2>Übungsmodus</h2>
<p class="enun">${conf.enunciado ? conf.enunciado() : 'Löse die Aufgabe mit diesen Daten und schreibe deine Ergebnisse in denselben Einheiten. Du kannst Komma oder Punkt, 1,2·10^-3 und Brüche wie 3/4 verwenden.'}</p>
${preguntas.length ? `<div class="prac-q">${filas}</div>` : '<p>Mit diesen Daten gibt es keine numerischen Ergebnisse zum Abfragen: Versuche es mit einer anderen Aufgabe.</p>'}
<div class="prac-acc"><button class="si" data-a="comprobar"${preguntas.length ? '' : ' disabled'}>Prüfen</button><button data-a="solucion">${resuelto ? 'Lösung ausblenden' : 'Lösung anzeigen'}</button><button data-a="otro">Andere Aufgabe erfinden</button></div>
<div class="prac-cod"><label>Stufe <select data-a="nivel">${[['facil', 'Leicht'], ['medio', 'Mittel'], ['dificil', 'Schwer']].map(([v, t]) => `<option value="${v}"${v === nivel ? ' selected' : ''}>${t}</option>`).join('')}</select></label><label>Code <input class="prac-codigo" data-a="codigo" value="${codigoDe(nivel, semilla)}" aria-label="Code der Aufgabe" autocomplete="off" spellcheck="false"></label><span class="prac-pista">Gib einen Code ein und drücke die Eingabetaste, um eine Aufgabe zu wiederholen.</span></div>
<p class="prac-nota" role="status" hidden></p>`;
    }
    function esperado(p) {
      if (p.tipo === 'texto') return [document.querySelector(p.sel), ...p.otros.map((s) => document.querySelector(s))].filter(Boolean).map((e) => e.textContent);
      const el = p.sel ? document.querySelector(p.sel) : items()[p.idx]; const n = el && numeros(el, conf.quitar);
      return n && n.vals.length >= p.vals.length ? (p.sel ? n.vals.slice(0, 1) : n.vals) : p.vals;
    }
    function comprueba(mostrar) {
      let bien = 0, total = 0, vacios = 0;
      for (const inp of card.querySelectorAll('.prac-in:not(.prac-codigo)')) {
        const p = preguntas[+inp.dataset.p], e = esperado(p); total++;
        inp.classList.remove('bien', 'mal'); inp.nextElementSibling?.classList.contains('prac-sol') && inp.nextElementSibling.remove();
        let ok, sol;
        if (p.tipo === 'texto') { ok = e.some((x) => normaConf(x) === normaConf(inp.value)); sol = e[0]; }
        else { const x = e[+inp.dataset.k], a = leeAlumno(inp.value); ok = a !== null && Math.abs(a - x.v) <= tolerancia(x); sol = x.t; }
        if (!inp.value.trim()) vacios++;
        else { inp.classList.add(ok ? 'bien' : 'mal'); if (ok) bien++; }
        if (mostrar && !ok && sol !== null) { const s = document.createElement('span'); s.className = 'prac-sol'; s.textContent = `(${sol.trim()})`; inp.after(s); }
      }
      const nota = card.querySelector('.prac-nota'); nota.hidden = false;
      nota.className = 'prac-nota ' + (bien === total ? 'bien' : 'mal');
      nota.textContent = mostrar ? (vacios === total ? 'Hier ist die Lösung, darunter die Herleitung.' : `${bien} von ${total} richtig. Die Lösung und die Herleitung stehen darunter.`) : bien === total ? 'Alles richtig! Sieh dir die Herleitung mit „Lösung anzeigen“ an oder versuche eine andere Aufgabe.' : vacios === total ? 'Schreibe zuerst deine Ergebnisse.' : `${bien} von ${total} richtig${vacios ? ` (${vacios} unbeantwortet)` : ''}. Prüfe die roten.`;
    }
    function clic(e) {
      const a = e.target.closest('button[data-a]')?.dataset.a;
      if (a === 'comprobar') comprueba(false);
      else if (a === 'otro') nuevo();
      else if (a === 'solucion') {
        const valores = [...card.querySelectorAll('.prac-in:not(.prac-codigo)')].map((i) => i.value);
        resuelto = !resuelto; pinta();
        card.querySelectorAll('.prac-in:not(.prac-codigo)').forEach((inp, k) => { inp.value = valores[k] ?? ''; });
        if (resuelto) comprueba(true);
      }
    }
    function activa(v) {
      if (v === activo) return;
      activo = v; btn.setAttribute('aria-pressed', String(v));
      if (v) {
        try { if (clave) sessionStorage.setItem(K_ANTES, localStorage.getItem(clave) ?? ''); } catch (e) { /* sin almacenamiento */ }
        nuevo(); card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        tapa(false); card?.remove(); card = null;
        let antes = null; try { antes = clave ? sessionStorage.getItem(K_ANTES) : null; sessionStorage.removeItem(K_ANTES); } catch (e) { /* sin almacenamiento */ }
        if (antes !== null) {
          const restaura = () => { try { if (antes) localStorage.setItem(clave, antes); else localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ } };
          restaura(); window.addEventListener('pagehide', restaura, { once: true });
          history.replaceState(null, '', location.pathname + location.search); location.reload();
        }
      }
    }
    try { const antes = clave ? sessionStorage.getItem(K_ANTES) : null; if (antes !== null) { sessionStorage.removeItem(K_ANTES); if (antes) localStorage.setItem(clave, antes); else localStorage.removeItem(clave); history.replaceState(null, '', location.pathname + location.search); location.reload(); } } catch (e) { /* sin almacenamiento */ }
    btn.addEventListener('click', () => activa(!activo));
    const respuestas = () => [...(card?.querySelectorAll('.prac-in') || [])].map((inp) => { const p = preguntas[+inp.dataset.p], e = esperado(p); return p.tipo === 'texto' ? e[0] : e[+inp.dataset.k].t; });
    return (window.PracticaApp = { activa, nuevo, abreCodigo, respuestas, get codigo() { return codigoDe(nivel, semilla); }, get nivel() { return nivel; }, get activo() { return activo; }, get preguntas() { return preguntas; } });
  }
  return { monta, CONF, numeros, leeAlumno, otroValor, rngDe, codigoDe, leeCodigo, get nivel() { return nivelAhora; } };
})();

