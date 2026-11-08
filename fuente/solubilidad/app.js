/* =====================================================================
   Solubilidad y Kps: interfaz (modo, sal, datos, resultados, diagrama
   logarítmico [catión]–[anión] con la recta de saturación y desarrollo).
   El cálculo está en solubilidad/calculo.js (Solubilidad). Guarda el
   estado entero (sc) en localStorage['solubilidad-v1']; expone
   window.SolubilidadApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, lienzo, vacio } = Herramienta;
  const P = Solubilidad, f = P.f, CLAVE = 'solubilidad-v1';
  const MODOS = [['kps', 'Solubilidad → Kps'], ['solub', 'Kps → solubilidad'], ['comun', 'Efecto del ion común'], ['precipita', '¿Precipita al mezclar?'], ['selectiva', 'Precipitación fraccionada'], ['ph', 'Efecto del pH'], ['complejo', 'Efecto de un ligando (complejos)']];

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const filaT = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const sales = (k) => { const m = P.SALES.find((x) => x[1] === sc.formula && String(x[4]) === String(sc.Kps)); if (sc.sal === undefined && m) sc.sal = m[0]; return elige(k, 'Sal de ejemplo', [['', 'Otra (escribe sus datos)'], ...P.SALES.map(([c, fm, a, b, K]) => [c, `${fm} (Kps ${txt(f(K, 2))})`])]); };
  const NOTAS = {
    kps: 'La sal es A<sub>a</sub>B<sub>b</sub>: a cationes y b aniones por fórmula (Ag₂CrO₄: 2 y 1). Con la solubilidad en g/L hace falta la masa molar, que sale de la fórmula si la escribes.',
    solub: 'Escribe a y b (cationes y aniones por fórmula) y el Kps, o elige una sal de ejemplo (valores de tablas de uso común a 25 °C; usa los de tu libro si difieren). La fórmula es opcional: da los g/L.',
    comun: 'Escribe la concentración del ion que ya hay en la disolución (el que también da la sal): por ejemplo, 0,10 M de Cl⁻ si hay NaCl 0,10 M y la sal es AgCl.',
    precipita: 'Concentración de cada ion en su disolución, antes de mezclar (la del ion, no la de la sal: en Pb(NO₃)₂ 0,01 M, Pb²⁺ es 0,01 M). Con la masa molar o la fórmula se calcula también la masa de precipitado.',
    ph: 'La sal con un anión básico (OH⁻, CO₃²⁻, F⁻, CrO₄²⁻, PO₄³⁻…) se disuelve más al bajar el pH. Para un hidróxido el pH fija [OH⁻]; para las demás sales escribe los pKa del ácido conjugado del anión, de menor a mayor (CO₃²⁻: 6,35 ; 10,33). El pH se supone mantenido por un tampón.',
    complejo: 'El catión forma complejos con un ligando (NH₃, S₂O₃²⁻, OH⁻…) y la sal se disuelve más. Escribe la concentración inicial del ligando y los log β de formación de los complejos, de uno en uno: «3,32 ; 7,23» son log β₁ y log β₂ del Ag(NH₃)₂⁺ (β₂ = β₁·K₂). Se tiene en cuenta el ligando que se gasta.',
    selectiva: 'Dos sales con un ion que se va añadiendo (Ag⁺ a una mezcla de Cl⁻ y CrO₄²⁻). La concentración es la del otro ion de cada sal, antes de empezar a añadir.',
  };
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    const sal = (conK) => {
      let s = sales('sal') + filaT('formula', 'Fórmula', 'opcional') + fila('a', 'Cationes por fórmula (a)') + fila('b', 'Aniones por fórmula (b)');
      if (conK) s += fila('Kps', 'Kps');
      return s;
    };
    if (sc.modo === 'kps') h += sal(false) + sep('Solubilidad') + elige('uni', 'Unidad', [['mol', 'mol/L'], ['g', 'g/L']]) + fila('s', 'Solubilidad', sc.uni === 'g' ? 'g/L' : 'mol/L') + (sc.uni === 'g' ? fila('M', 'Masa molar', 'g/mol, o la fórmula') : '');
    else if (sc.modo === 'solub') h += sal(true) + fila('M', 'Masa molar', 'g/mol, opcional');
    else if (sc.modo === 'comun') h += sal(true) + sep('Ion común') + elige('ion', 'Qué ion hay ya', [['an', 'El anión (B)'], ['cat', 'El catión (A)']]) + fila('C', 'Concentración', 'mol/L') + fila('M', 'Masa molar', 'g/mol, opcional');
    else if (sc.modo === 'precipita') h += sal(true) + sep('Disolución del catión (A)') + fila('c1', 'Concentración de A', 'mol/L') + fila('V1', 'Volumen', 'mL') + sep('Disolución del anión (B)') + fila('c2', 'Concentración de B', 'mol/L') + fila('V2', 'Volumen', 'mL') + fila('M', 'Masa molar', 'g/mol, opcional');
    else if (sc.modo === 'ph') {
      h += sal(true) + sep('Medio') + elige('anion', 'El anión es', [['oh', 'Hidróxido (OH⁻)'], ['base', 'Base conjugada de un ácido débil']]);
      if (sc.anion !== 'oh') h += filaT('pkas', 'pKa del ácido conjugado', 'de menor a mayor, separados por «;»');
      h += fila('pH', 'pH de la disolución') + (sc.anion === 'oh' ? fila('C', 'Concentración del catión', 'mol/L, opcional (da el pH de precipitación)') : '') + fila('M', 'Masa molar', 'g/mol, opcional');
    } else if (sc.modo === 'complejo') {
      h += sal(true) + sep('Ligando') + elige('lig', 'Ligando', [['NH3', 'NH₃ (amoníaco)'], ['S2O3', 'S₂O₃²⁻ (tiosulfato)'], ['OH', 'OH⁻ (hidróxido)'], ['otro', 'Otro (escribe los log β)']]) + filaT('logb', 'log β₁ ; log β₂ ; …', 'separados por «;»') + fila('L0', 'Concentración inicial del ligando', 'mol/L') + fila('M', 'Masa molar', 'g/mol, opcional');
    } else {
      h += elige('comun', 'Qué ion se añade', [['cat', 'Un catión (Ag⁺ a Cl⁻ y CrO₄²⁻)'], ['an', 'Un anión (I⁻ a Pb²⁺ y Ba²⁺)']]);
      for (const i of [1, 2]) h += sep(`Sal ${i}`) + fila('a' + i, 'Cationes por fórmula') + fila('b' + i, 'Aniones por fórmula') + fila('Kps' + i, 'Kps') + fila('c' + i, 'Concentración del otro ion', 'mol/L');
    }
    $('#campos').innerHTML = h;
    $('#nota').innerHTML = NOTAS[sc.modo];
  }
  // logβ de la tabla de Datos para el catión de la sal y el ligando; la coma decimal de España
  const logb = (cat, lig) => { const v = Datos.COMPLEJOS[cat]?.[lig]; return v && v.every((x) => x !== null) ? v.map((x) => String(x).replace('.', ',')).join(' ; ') : null; };
  const rellena = (c) => {
    const s = P.SALES.find((x) => x[0] === c); if (!s) return;
    sc.formula = s[1]; sc.a = String(s[2]); sc.b = String(s[3]); sc.Kps = String(s[4]); sc.M = '';
    if (sc.modo === 'ph') { sc.anion = s[7] === 'OH' ? 'oh' : 'base'; sc.pkas = Datos.ACIDOS_ANION[s[7]]?.map((x) => String(x).replace('.', ',')).join(' ; ') || ''; }
    if (sc.modo === 'complejo') { const lig = ['NH3', 'S2O3', 'OH'].find((l) => logb(s[5], l)); if (lig) { sc.lig = lig; sc.logb = logb(s[5], lig); } }
  };
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (t.tagName !== 'INPUT') return;
    sc[t.dataset.k] = t.value; if (['formula', 'a', 'b', 'Kps'].includes(t.dataset.k)) { sc.sal = ''; const s = $('#f-sal'); if (s) s.value = ''; }
    $('#ejemplos').value = ''; calcula();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k; sc[k] = t.value;
    if (k === 'modo') sc = copia(P.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (k === 'sal') rellena(t.value);
    else if (k === 'lig' && sc.modo === 'complejo') { const s = P.SALES.find((x) => x[0] === sc.sal); const v = s && logb(s[5], t.value); if (v) sc.logb = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
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
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#usar-en').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = 'Diagrama logarítmico: la recta es el límite de saturación ([A]^a·[B]^b = Kps). Por encima hay sobresaturación y precipita; por debajo, la disolución admite más sal.';
    if (sol.modo === 'kps') h = dato('Kps', f(sol.Kps)) + dato('Solubilidad', `s = ${f(sol.s)} mol/L`, '') + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`, '') : '') + dato('[A]', `${f(sol.ca)} M`, '') + dato('[B]', `${f(sol.cb)} M`, '');
    else if (sol.modo === 'solub') h = dato('Solubilidad', `s = ${f(sol.s)} mol/L`) + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : '') + dato('[A]', `${f(sol.ca)} M`) + dato('[B]', `${f(sol.cb)} M`);
    else if (sol.modo === 'comun') { h = dato('Solubilidad con el ion común', `s = ${f(sol.s)} mol/L`) + dato('En agua pura', `s₀ = ${f(sol.s0)} mol/L`, '') + dato('Se reduce', `${f(sol.factor)} veces`) + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : ''); ley = 'El punto está sobre la recta de saturación, con el ion común ya presente: cuanto más ion común, menos sal se disuelve.'; }
    else if (sol.modo === 'ph') {
      h = dato('Solubilidad a ese pH', `s = ${f(sol.s)} mol/L`) + dato('Sin protonación', `s₀ = ${f(sol.s0)} mol/L`, '') + dato(sol.s >= sol.s0 ? 'Más soluble' : 'Menos soluble', `${f(sol.factor)} veces`) + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : '');
      if (sol.pHini !== undefined) h += dato('Empieza a precipitar', `pH ${f(sol.pHini, 4)}`) + dato('Precipitación cuantitativa', `pH ${f(sol.pHfin, 4)}`);
      ley = 'Solubilidad de la sal en función del pH (escala logarítmica). El punto negro es el pH que has puesto; la línea de puntos, la solubilidad sin tener en cuenta la protonación del anión.';
    } else if (sol.modo === 'complejo') {
      h = dato('Solubilidad con el ligando', `s = ${f(sol.s)} mol/L`) + dato('En agua pura', `s₀ = ${f(sol.s0)} mol/L`, '') + dato('Aumenta', `${f(sol.factor)} veces`) + dato('Ligando libre', `${f(sol.L)} M`, '') + dato('Ligandos por catión', f(sol.nbar), '') + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : '');
      ley = 'Solubilidad de la sal en función de la concentración inicial de ligando (escala logarítmica). El punto negro es la concentración que has puesto; la línea de puntos, la solubilidad en agua pura.';
    } else if (sol.modo === 'precipita') {
      h = dato('Producto iónico', `Q = ${f(sol.Q)}`) + dato('Q / Kps', f(sol.ratio)) + dato('Resultado', sol.precipita ? 'Precipita' : 'No precipita', '');
      if (sol.precipita) h += dato('Queda [A]', `${f(sol.cA)} M`) + dato('Queda [B]', `${f(sol.cB)} M`) + dato('Sólido', `${f(sol.mol)} mol`) + (sol.masa !== null ? dato('Masa de precipitado', `${f(sol.masa)} g`) : '');
      ley = 'El punto naranja es la mezcla recién hecha (por encima de la recta, precipita; por debajo, no). Si precipita, el punto negro es el equilibrio final sobre la recta.';
    } else {
      h = sol.S.map((s) => dato(`Sal ${s.i} empieza con [${sol.cat ? 'A' : 'B'}]`, `${f(s.X)} M`)).join('') + dato('Precipita primero', `la sal ${sol.primera}`, '') + dato(`Queda de la sal ${sol.p.i}`, `${f(sol.resta)} M (${f(100 * sol.frac)} %)`) + dato('Separación', sol.sep ? 'cuantitativa' : 'incompleta', '');
      ley = `Cada recta es una sal: [${sol.cat ? 'B' : 'A'}] frente a [${sol.cat ? 'A' : 'B'}] en saturación. Los puntos naranjas marcan dónde empieza a precipitar cada una; el negro, lo que queda de la primera cuando empieza la segunda.`;
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    // «Usar en…»: un hidróxido poco soluble es una base fuerte con [OH⁻] = b·s; el pH de su disolución saturada se calcula en la herramienta de pH
    $('#usar-en').innerHTML = ['kps', 'solub'].includes(sol.modo) && /OH/.test(sc.formula || '') && sol.s > 0 && isFinite(sol.s) ? `<a class="btn" id="u-ph" href="${esc(Herramienta.enlaceA('ph', { modo: 'fuerte', especie: 'base', C: String(sol.s), n: String(sol.b) }))}">Calcular el pH de la disolución saturada</a>` : '';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    dibuja();
  }

  /* ---------- Diagrama logarítmico ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--roz', '--bg']) col[k] = cs.getPropertyValue(k).trim(); }
  const lg = Math.log10;
  const sup = (k) => txt(`10<sup>${k < 0 ? '−' : ''}${Math.abs(k)}</sup>`);
  // rectas de saturación y puntos del modo actual: x = log del ion de la abscisa, y = log del de la ordenada
  function figura() {
    if (sol.modo === 'selectiva') {
      const rectas = sol.S.map((s, i) => ({ K: s.Kps, p: s.p, q: s.q, color: i ? col['--serie-2'] : col['--serie-1'], et: `sal ${s.i}` }));
      const pts = sol.S.map((s, i) => ({ x: lg(s.X), y: lg(s.c), color: col['--roz'] || col['--accent'], et: `sal ${s.i}` })).concat([{ x: lg(sol.q.X), y: lg(sol.resta), color: col['--ink'], et: 'queda' }]);
      return { rectas, pts, ejes: [sol.cat ? '[A] añadido (M)' : '[B] añadido (M)', 'otro ion (M)'], enlaces: [] };
    }
    const r = [{ K: sol.Kps, p: sol.b, q: sol.a, color: col['--accent'], et: '' }], ejes = ['[B] (M)', '[A] (M)'];
    if (sol.modo === 'precipita') {
      const pts = [{ x: lg(sol.cb0), y: lg(sol.ca0), color: col['--roz'] || col['--accent'], et: 'mezcla' }];
      if (sol.precipita) pts.push({ x: lg(sol.cB), y: lg(sol.cA), color: col['--ink'], et: 'equilibrio', izq: true });
      return { rectas: r, pts, ejes, enlaces: pts.length > 1 ? [[0, 1]] : [] };
    }
    return { rectas: r, pts: [{ x: lg(sol.cb), y: lg(sol.ca), color: col['--ink'], et: 'saturada' }], ejes, enlaces: [] };
  }
  // solubilidad (log) frente al pH o frente a la concentración inicial del ligando
  function dibujaCurva(g, w, h) {
    const ml = 62, mr = 14, mt = 14, mb = 40, ph = sol.modo === 'ph', xs = sol.curva.map((q) => q[0]), ys = sol.curva.map((q) => lg(q[1]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    let y0 = Math.floor(Math.min(...ys, lg(sol.s0)) - 0.5), y1 = Math.ceil(Math.max(...ys, lg(sol.s0)) + 0.5);
    if (y1 - y0 < 3) y1 = y0 + 3;
    const X = (v) => ml + ((v - x0) / (x1 - x0)) * (w - ml - mr), Y = (v) => h - mb - ((v - y0) / (y1 - y0)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let v = y0; v <= y1; v += Math.max(1, Math.ceil((y1 - y0) / 7))) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(sup(v), ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let v = Math.ceil(x0); v <= x1; v += ph ? 2 : 1) { g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), h - mb); g.stroke(); g.fillText(ph ? String(v) : sup(v), X(v), h - mb + 6); }
    g.fillText(ph ? 'pH' : 'ligando inicial (mol/L)', ml + (w - ml - mr) / 2, h - 16);
    g.save(); g.translate(14, mt + (h - mt - mb) / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText('solubilidad (mol/L)', 0, 0); g.restore();
    g.save(); g.beginPath(); g.rect(ml, mt, w - ml - mr, h - mt - mb); g.clip();
    g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(X(x0), Y(lg(sol.s0))); g.lineTo(X(x1), Y(lg(sol.s0))); g.stroke();
    if (ph && sol.pHini !== undefined) for (const v of [sol.pHini, sol.pHfin]) { g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), h - mb); g.stroke(); }
    g.setLineDash([]); g.strokeStyle = col['--accent']; g.lineWidth = 2.6; g.beginPath();
    sol.curva.forEach((q, i) => { const px = X(q[0]), py = Y(lg(q[1])); if (i) g.lineTo(px, py); else g.moveTo(px, py); }); g.stroke();
    g.restore();
    const px = X(ph ? sol.pH : lg(sol.L0)), py = Y(lg(sol.s));
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(px, py, 5.5, 0, 2 * Math.PI); g.fill();
    g.font = '600 12px system-ui, sans-serif'; g.textAlign = px > w - 90 ? 'right' : 'left'; g.textBaseline = 'bottom'; g.fillText('tu dato', px + (px > w - 90 ? -9 : 9), py - 6);
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(ph ? 'sin protonación' : 'agua pura', w - mr - 8, Y(lg(sol.s0)) - 4);
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    if (sol.modo === 'ph' || sol.modo === 'complejo') return dibujaCurva(g, w, h);
    const fg = figura(), ml = 62, mr = 14, mt = 14, mb = 40;
    let x0 = Math.min(...fg.pts.map((p) => p.x)) - 1.2, x1 = Math.max(...fg.pts.map((p) => p.x)) + 1.2;
    if (x1 - x0 < 5) { const m = (x0 + x1) / 2; x0 = m - 2.5; x1 = m + 2.5; }
    x0 = Math.floor(x0); x1 = Math.ceil(x1);
    const yr = (r, x) => (lg(r.K) - r.p * x) / r.q;
    let y0 = Math.min(...fg.pts.map((p) => p.y)) - 1.5, y1 = Math.max(...fg.pts.map((p) => p.y)) + 1.5;
    if (y1 - y0 < 5) { const m = (y0 + y1) / 2; y0 = m - 2.5; y1 = m + 2.5; }
    y0 = Math.floor(y0); y1 = Math.ceil(y1);
    const X = (v) => ml + ((v - x0) / (x1 - x0)) * (w - ml - mr), Y = (v) => h - mb - ((v - y0) / (y1 - y0)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1;
    const paso = (a, b) => Math.max(1, Math.ceil((b - a) / 7));
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let v = y0; v <= y1; v += paso(y0, y1)) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(sup(v), ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let v = x0; v <= x1; v += paso(x0, x1)) { g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), h - mb); g.stroke(); g.fillText(sup(v), X(v), h - mb + 6); }
    g.fillText(fg.ejes[0], ml + (w - ml - mr) / 2, h - 16);
    g.save(); g.translate(14, mt + (h - mt - mb) / 2); g.rotate(-Math.PI / 2); g.textBaseline = 'middle'; g.fillText(fg.ejes[1], 0, 0); g.restore();
    g.save(); g.beginPath(); g.rect(ml, mt, w - ml - mr, h - mt - mb); g.clip();
    // zona sobresaturada de la primera recta (por encima)
    if (sol.modo !== 'selectiva') {
      const r = fg.rectas[0]; g.fillStyle = col['--accent']; g.globalAlpha = 0.1;
      g.beginPath(); g.moveTo(X(x0), Y(y1)); g.lineTo(X(x0), Y(yr(r, x0))); g.lineTo(X(x1), Y(yr(r, x1))); g.lineTo(X(x1), Y(y1)); g.closePath(); g.fill(); g.globalAlpha = 1;
    }
    for (const r of fg.rectas) { g.strokeStyle = r.color; g.lineWidth = 2.4; g.beginPath(); g.moveTo(X(x0), Y(yr(r, x0))); g.lineTo(X(x1), Y(yr(r, x1))); g.stroke(); }
    g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    for (const [i, j] of fg.enlaces) { g.beginPath(); g.moveTo(X(fg.pts[i].x), Y(fg.pts[i].y)); g.lineTo(X(fg.pts[j].x), Y(fg.pts[j].y)); g.stroke(); }
    if (sol.modo === 'selectiva') { g.beginPath(); g.moveTo(X(fg.pts[2].x), Y(fg.pts[2].y)); g.lineTo(X(fg.pts[2].x), Y(y1)); g.stroke(); }
    g.setLineDash([]);
    g.restore();
    g.font = '600 12px system-ui, sans-serif';
    for (const p of fg.pts) {
      g.fillStyle = p.color; g.beginPath(); g.arc(X(p.x), Y(p.y), 5.5, 0, 2 * Math.PI); g.fill();
      g.fillStyle = col['--ink']; g.textAlign = p.izq || X(p.x) > w - 90 ? 'right' : 'left'; g.textBaseline = 'bottom';
      if (p.et) g.fillText(p.et, X(p.x) + (g.textAlign === 'right' ? -9 : 9), Y(p.y) - 6);
    }
    if (sol.modo !== 'selectiva') { g.fillStyle = col['--accent']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('sobresaturada: precipita', ml + 8, mt + 6); g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('insaturada', w - mr - 8, h - mb - 6); }
    else { g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('por encima de cada recta, esa sal precipita', ml + 8, mt + 6); }
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  /* ---------- Modo práctica ---------- */
  const toma = (xs) => xs[Math.floor(Math.random() * xs.length)], c3 = (v) => String(+v.toPrecision(3));
  function azar() {
    const [clave, formula, a, b, Kps] = toma(P.SALES.filter((s) => s[4] > 1e-20)), base = { sal: clave, formula, a: String(a), b: String(b), Kps: String(Kps), M: '' };
    const modo = toma(['kps', 'solub', 'comun', 'precipita']);
    if (modo === 'kps') { const s = (Kps / (a ** a * b ** b)) ** (1 / (a + b)); sc = { ...base, modo, uni: 'mol', s: c3(s) }; }
    else if (modo === 'solub') sc = { ...base, modo };
    else if (modo === 'comun') sc = { ...base, modo, ion: toma(['an', 'cat']), C: toma(['0.1', '0.05', '0.01', '0.2']) };
    else {
      // concentraciones de la mezcla (volúmenes iguales) con un Q varias veces mayor que el Kps, para que precipite
      const k = toma([20, 50, 200]), cb0 = toma([0.002, 0.004, 0.01, 0.02]), ca0 = ((k * Kps) / cb0 ** b) ** (1 / a), V = toma(['25', '50', '100']);
      sc = { ...base, modo, c1: c3(2 * ca0), V1: V, c2: c3(2 * cb0), V2: V };
    }
    $('#ejemplos').value = ''; formulario(); calcula();
  }
  const enunciado = () => {
    let r; try { r = P.resolver(sc); } catch (e) { return ''; }
    const fm = vacio(sc.formula) ? `una sal A<sub>${esc(sc.a)}</sub>B<sub>${esc(sc.b)}</sub>` : esc(sc.formula);
    if (sc.modo === 'kps') return `La solubilidad de ${fm} en agua es ${esc(sc.s)} ${sc.uni === 'g' ? 'g/L' : 'mol/L'}. Calcula su <b>K<sub>ps</sub></b> y las concentraciones de los iones.`;
    if (sc.modo === 'solub') return `El K<sub>ps</sub> de ${fm} es ${esc(sc.Kps)}. Calcula su <b>solubilidad</b> en agua (mol/L) y la concentración de cada ion.`;
    if (sc.modo === 'comun') return `El K<sub>ps</sub> de ${fm} es ${esc(sc.Kps)}. Calcula su <b>solubilidad</b> en una disolución que ya contiene ${esc(sc.C)} M de su ${sc.ion === 'cat' ? 'catión' : 'anión'} y cuántas veces es menor que en agua pura.`;
    if (sc.modo === 'precipita') return `Se mezclan ${esc(sc.V1)} mL de una disolución con [A] = ${esc(sc.c1)} M y ${esc(sc.V2)} mL con [B] = ${esc(sc.c2)} M. El K<sub>ps</sub> de ${fm} es ${esc(sc.Kps)}. Calcula el <b>producto iónico Q</b>, Q/K<sub>ps</sub> y ${r.precipita ? 'lo que queda en disolución' : 'si precipita'}.`;
    return '';
  };

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('solubilidad').current;
  colores(); formulario(); calcula();
  window.SolubilidadApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, Kps: sol.Kps, s: sol.s, Q: sol.Q, precipita: sol.precipita, resta: sol.resta }, estado: () => copia(sc) };
})();
