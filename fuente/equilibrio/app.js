/* =====================================================================
   Equilibrio químico y Le Chatelier: interfaz (reacción, datos según el
   modo, resultados, gráfica de las concentraciones frente al avance de la
   reacción y desarrollo). El cálculo está en equilibrio/calculo.js
   (Equilibrio) y los ayudantes comunes ($, esc, copia, txt, marcas, lienzo)
   en herramienta.js. Guarda el estado entero (sc) en localStorage[CLAVE] en
   cada cambio: es lo que copia Mis ejercicios (biblioteca.js). Expone
   window.EquilibrioApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo, vacio } = Herramienta;
  const P = Equilibrio, f = P.f, CLAVE = 'equilibrio-v1', L = ['A', 'B', 'C', 'D'];
  const MODOS = [['K', 'Calcular Kc a partir de un equilibrio'], ['eq', 'Concentraciones de equilibrio (con Kc)'], ['Q', 'Cociente Q: ¿hacia dónde va?'], ['lc', 'Le Chatelier con números']];
  const SERIES = ['--serie-1', '--serie-2', '--serie-3', '--serie-4'];

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const nombre = (i) => (vacio(sc['n' + L[i]]) ? L[i] : String(sc['n' + L[i]]).trim());
  const nh = (s) => String(s).replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${(sc[k] || lista[0][0]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const hay = (i) => i === 0 || i === 2 || !vacio(sc[L[i].toLowerCase()]) && P.leeNum(sc[L[i].toLowerCase()]) > 0;
  const especies = () => [0, 1, 2, 3].filter((i) => hay(i));
  const opEsp = () => especies().map((i) => [L[i], `${L[i]} (${nombre(i)})`]);
  const NOTAS = {
    K: 'Escribe las concentraciones del principio y la que mides de una especie en el equilibrio; las demás salen de la estequiometría. Las que dejes vacías valen 0.',
    eq: 'Escribe las concentraciones iniciales (las vacías valen 0) y Kc: salen las concentraciones de equilibrio, aunque la ecuación no sea de segundo grado.',
    Q: 'Escribe las concentraciones de ahora y Kc: se compara Q con K para ver hacia dónde avanza la reacción y dónde acaba.',
    lc: 'Parte de un equilibrio (concentraciones iniciales y Kc), le haces un cambio y se calcula hacia dónde se desplaza y el nuevo equilibrio. Todas las especies se suponen gaseosas o disueltas.',
  };
  function reaccion() {
    const slot = (i, signo) => `${signo ? `<span class="mas">${signo}</span>` : ''}<span class="esp"><input class="in coef" data-k="${L[i].toLowerCase()}" value="${esc(sc[L[i].toLowerCase()] ?? '')}" inputmode="decimal" aria-label="Coeficiente de ${L[i]}" placeholder="1"><input class="in nom" data-k="n${L[i]}" value="${esc(sc['n' + L[i]] ?? '')}" aria-label="Fórmula de ${L[i]}" placeholder="${L[i]}"></span>`;
    $('#reac').innerHTML = slot(0) + slot(1, '+') + '<span class="salto"></span><span class="mas fl">⇌</span>' + slot(2) + slot(3, '+');
  }
  function camposDatos() {
    const m = sc.modo || 'K', E = especies();
    const c = (rot) => E.map((i) => fila('c' + L[i], `${rot} <b>${nh(nombre(i))}</b>`, 'mol/L')).join('');
    let h = elige('modo', 'Qué calcular', MODOS);
    if (m === 'K') h += sep('Al principio') + c('[ ]₀ de') + sep('En el equilibrio') + elige('especie', 'Especie medida', opEsp()) + fila('ceq', 'Su concentración', 'mol/L') + sep('Opcional') + fila('T', 'Temperatura', 'K, para Kp');
    else if (m === 'eq') h += sep('Al principio') + c('[ ]₀ de') + sep('Constante') + fila('K', 'Kc') + fila('T', 'Temperatura', 'K, para Kp (opcional)');
    else if (m === 'Q') h += sep('Concentraciones de ahora') + c('[ ] de') + sep('Constante') + fila('K', 'Kc') + fila('T', 'Temperatura', 'K, para Kp (opcional)');
    else {
      h += sep('Equilibrio de partida') + c('[ ]₀ de') + fila('K', 'Kc');
      h += sep('Cambio') + elige('tipo', 'Qué se hace', P.TIPOS_LC);
      const t = sc.tipo || 'anadir';
      if (t === 'anadir' || t === 'quitar') h += elige('esp', 'Especie', opEsp()) + fila('cant', t === 'anadir' ? 'Cantidad que se añade' : 'Cantidad que se quita', 'mol/L');
      else if (t === 'volumen') h += fila('rv', 'Volumen final / inicial', 'V₂/V₁ (0,5 = comprimir a la mitad)');
      else if (t === 'temperatura') h += fila('T', 'Temperatura inicial', 'K') + fila('T2', 'Temperatura final', 'K') + fila('dH', 'ΔH (reacción →)', 'kJ/mol');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[m] + ' Se admite coma decimal, 3e8 y 3·10^8.';
  }
  function formulario() { reaccion(); camposDatos(); }
  $('#reac').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; camposDatos(); calcula(); });
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k || t.tagName === 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (!t.dataset.k || t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.dataset.k === 'modo' || t.dataset.k === 'tipo') { camposDatos(); }
    calcula();
  });

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
  const dato = (t, v, cl = 'num') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const DIR = { eq: 'En equilibrio: no se desplaza', der: 'Hacia la derecha (se forman productos)', izq: 'Hacia la izquierda (se forman reactivos)' };
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#claves').innerHTML = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const idx = [0, 1, 2, 3].filter((i) => sol.nu[i] !== 0), cc = (i) => dato(`[${nh(sol.nombres[i])}] en el equilibrio`, `${f(sol.ceq[i])} mol/L`);
    let h = dato('Reacción', sol.reaccion, 'ancho');
    if (sol.modo === 'K') h += dato('Constante', `K<sub>c</sub> = ${f(sol.K)}`);
    else if (sol.modo === 'eq') h += idx.map(cc).join('');
    else if (sol.modo === 'Q') h += dato('Cociente', `Q = ${f(sol.Q)}`) + dato('Constante', `K<sub>c</sub> = ${f(sol.K)}`) + dato('Sentido', DIR[sol.s0], 'ancho') + idx.map(cc).join('');
    else h += dato('Desplazamiento', DIR[sol.s0], 'ancho') + (sol.K2 !== sol.K ? dato('Constante nueva', `K<sub>c</sub> = ${f(sol.K2)}`) : '') + idx.map((i) => dato(`[${nh(sol.nombres[i])}] nuevo`, `${f(sol.ceq[i])} mol/L`)).join('');
    if (sol.modo !== 'Q' && sol.modo !== 'lc' && sol.alfa !== undefined) h += dato('Conversión de ' + nh(sol.nombres[0]), `α = ${f(sol.alfa)} (${f(100 * sol.alfa)} %)`);
    if (sol.Kp !== undefined) h += dato('Constante en presiones', `K<sub>p</sub> = ${f(sol.Kp)}`);
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#claves').innerHTML = idx.map((i) => `<span style="color:var(${SERIES[i]})">■</span> ${nh(sol.nombres[i])}`).join('&nbsp;&nbsp; ');
    $('#leyenda').textContent = sol.modo === 'lc' ? 'Concentraciones frente al avance x, tras el cambio. El círculo es el instante del cambio (x = 0) y la línea de puntos, el nuevo equilibrio.' : 'Concentraciones frente al avance x de la reacción. El círculo es el principio (x = 0) y la línea de puntos, el equilibrio, donde Q = K.';
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', ...SERIES]) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const ml = 58, mr = 14, mt = 12, mb = 32, idx = [0, 1, 2, 3].filter((i) => sol.nu[i] !== 0);
    let x0 = sol.lo, x1 = sol.hi;
    const cons = (i, x) => sol.c0[i] + sol.nu[i] * x;
    const cmax = Math.max(...idx.flatMap((i) => [cons(i, x0), cons(i, x1)]), ...idx.map((i) => sol.c0[i])) || 1;
    const X = (x) => ml + ((x - x0) / (x1 - x0)) * (w - ml - mr), Y = (c) => h - mb - (c / cmax) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const c of marcas(0, cmax, 4)) { g.beginPath(); g.moveTo(ml, Y(c)); g.lineTo(w - mr, Y(c)); g.stroke(); g.fillText(txt(f(c, 3)), ml - 6, Y(c)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const x of marcas(x0, x1, 5)) g.fillText(txt(f(x, 3)), X(x), h - mb + 6);
    g.fillText('avance x (mol/L)', (ml + w - mr) / 2, h - 14);
    g.lineWidth = 2.4;
    for (const i of idx) { g.strokeStyle = col[SERIES[i]]; g.beginPath(); for (let k = 0; k <= 80; k++) { const x = x0 + ((x1 - x0) * k) / 80; k ? g.lineTo(X(x), Y(cons(i, x))) : g.moveTo(X(x), Y(cons(i, x))); } g.stroke(); }
    g.setLineDash([4, 4]); g.strokeStyle = col['--accent']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(sol.x), mt); g.lineTo(X(sol.x), h - mb); g.stroke(); g.setLineDash([]);
    for (const i of idx) { g.fillStyle = col[SERIES[i]]; g.beginPath(); g.arc(X(sol.x), Y(sol.ceq[i]), 4, 0, 7); g.fill(); }
    if (0 >= x0 && 0 <= x1) for (const i of idx) { g.strokeStyle = col[SERIES[i]]; g.lineWidth = 2; g.beginPath(); g.arc(X(0), Y(sol.c0[i]), 4.5, 0, 7); g.stroke(); }
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  /* ---------- Modo práctica ---------- */
  const PLANTILLAS = [
    { nA: 'H2', nB: 'I2', nC: 'HI', a: 1, b: 1, c: 2, d: 0, T: [731] },
    { nA: 'N2O4', nB: '', nC: 'NO2', a: 1, b: 0, c: 2, d: 0, T: [298, 400] },
    { nA: 'PCl5', nB: '', nC: 'PCl3', nD: 'Cl2', a: 1, b: 0, c: 1, d: 1, T: [500, 523] },
    { nA: 'N2', nB: 'H2', nC: 'NH3', a: 1, b: 3, c: 2, d: 0, T: [500, 700] },
    { nA: 'SO2', nB: 'O2', nC: 'SO3', a: 2, b: 1, c: 2, d: 0, T: [900, 1000] },
    { nA: 'CO', nB: 'H2O', nC: 'CO2', nD: 'H2', a: 1, b: 1, c: 1, d: 1, T: [1000] },
  ];
  const toma = (xs) => xs[Math.floor(Math.random() * xs.length)], c3 = (v) => String(+v.toPrecision(3)).replace('.', ',');
  function azar() {
    const t = toma(PLANTILLAS), coef = [t.a, t.b, t.c, t.d], nu = [-t.a, -t.b, t.c, t.d];
    const c0 = [0, 1, 2, 3].map((i) => (nu[i] < 0 ? toma([0.2, 0.5, 1, 2]) : 0));
    const lim = Math.min(...[0, 1].filter((i) => coef[i]).map((i) => c0[i] / coef[i])), x = lim * toma([0.3, 0.4, 0.5, 0.6]);
    const ceq = c0.map((v, i) => v + nu[i] * x), K = [0, 1, 2, 3].filter((i) => coef[i]).reduce((s, i) => s * Math.pow(ceq[i], nu[i]), 1);
    const base = { nA: t.nA, nB: t.nB, nC: t.nC, nD: t.nD || '', a: String(t.a), b: t.b ? String(t.b) : '', c: String(t.c), d: t.d ? String(t.d) : '', cA: c3(c0[0]), cB: c0[1] ? c3(c0[1]) : '', cC: '', cD: '', T: String(toma(t.T)) };
    sc = toma([0, 1]) ? { ...base, modo: 'eq', K: c3(K) } : { ...base, modo: 'K', especie: 'C', ceq: c3(ceq[2]) };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    let r;
    try { r = P.resolver(sc); } catch (e) { return ''; }
    const concs = (r.nu.map((v, i) => (v < 0 && P.leeNum(sc['c' + L[i]]) > 0 ? `[${nh(r.nombres[i])}]₀ = ${esc(sc['c' + L[i]])} mol/L` : '')).filter(Boolean)).join(' y ');
    const kp = sc.T && !vacio(sc.T) ? ` a ${esc(sc.T)} K, y su K<sub>p</sub>` : '';
    if (sc.modo === 'eq') return `En el equilibrio ${r.reaccion}, con ${concs} y K<sub>c</sub> = ${esc(sc.K)}${kp ? kp : ''}, calcula las <b>concentraciones de equilibrio</b>, la conversión de ${nh(r.nombres[0])}${kp ? ' y K<sub>p</sub>' : ''}.`;
    return `En el equilibrio ${r.reaccion} se parte de ${concs} y en el equilibrio se mide [${nh(r.nombres[2])}] = ${esc(sc.ceq)} mol/L. Calcula <b>K<sub>c</sub></b>${kp ? ' y K<sub>p</sub>' : ''} y la conversión de ${nh(r.nombres[0])}.`;
  };

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('equilibrio').current;
  colores(); formulario(); calcula();
  window.EquilibrioApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, K: sol.K, K2: sol.K2, Kp: sol.Kp, x: sol.x, ceq: sol.ceq, alfa: sol.alfa, s0: sol.s0 }, estado: () => copia(sc) };
})();
