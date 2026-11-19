(() => {
  const { $, esc, copia, txt, lienzo, vacio } = Herramienta;
  const P = Solubilidad, f = P.f, CLAVE = 'solubilidad-v1';
  const MODOS = [['kps', 'Solubilité → Ks'], ['solub', 'Ks → solubilité'], ['comun', 'Effet de l’ion commun'], ['precipita', 'Précipite-t-il au mélange ?'], ['selectiva', 'Précipitation fractionnée'], ['ph', 'Effet du pH'], ['complejo', 'Effet d’un ligand (complexes)']];

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const filaT = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const sales = (k) => { const m = P.SALES.find((x) => x[1] === sc.formula && String(x[4]) === String(sc.Kps)); if (sc.sal === undefined && m) sc.sal = m[0]; return elige(k, 'Sel d’exemple', [['', 'Autre (saisissez ses données)'], ...P.SALES.map(([c, fm, a, b, K]) => [c, `${fm} (Kps ${txt(f(K, 2))})`])]); };
  const NOTAS = {
    kps: 'Le sel est A<sub>a</sub>B<sub>b</sub> : a cations et b anions par formule (Ag₂CrO₄ : 2 et 1). Avec la solubilité en g/L, il faut la masse molaire, qui se déduit de la formule si vous l’écrivez.',
    solub: 'Écrivez a et b (cations et anions par formule) et le Ks, ou choisissez un sel d’exemple (valeurs de tableaux d’usage courant à 25 °C ; utilisez celles de votre livre si elles diffèrent). La formule est facultative : elle donne les g/L.',
    comun: 'Écrivez la concentration de l’ion déjà présent dans la solution (celui que donne aussi le sel) : par exemple, 0,10 M de Cl⁻ s’il y a NaCl 0,10 M et que le sel est AgCl.',
    precipita: 'Concentration de chaque ion dans sa solution, avant mélange (celle de l’ion, pas celle du sel : dans Pb(NO₃)₂ 0,01 M, Pb²⁺ vaut 0,01 M). Avec la masse molaire ou la formule, on calcule aussi la masse de précipité.',
    ph: 'Le sel à anion basique (OH⁻, CO₃²⁻, F⁻, CrO₄²⁻, PO₄³⁻…) se dissout davantage quand le pH baisse. Pour un hydroxyde, le pH fixe [OH⁻] ; pour les autres sels, écrivez les pKa de l’acide conjugué de l’anion, du plus petit au plus grand (CO₃²⁻ : 6,35 ; 10,33). Le pH est supposé maintenu par un tampon.',
    complejo: 'Le cation forme des complexes avec un ligand (NH₃, S₂O₃²⁻, OH⁻…) et le sel se dissout davantage. Écrivez la concentration initiale du ligand et les log β de formation des complexes, un par un : « 3,32 ; 7,23 » sont log β₁ et log β₂ de Ag(NH₃)₂⁺ (β₂ = β₁·K₂). On tient compte du ligand consommé.',
    selectiva: 'Deux sels avec un ion que l’on ajoute peu à peu (Ag⁺ à un mélange de Cl⁻ et CrO₄²⁻). La concentration est celle de l’autre ion de chaque sel, avant de commencer à ajouter.',
  };
  function formulario() {
    let h = elige('modo', 'Que calculer', MODOS);
    const sal = (conK) => {
      let s = sales('sal') + filaT('formula', 'Formule', 'facultatif') + fila('a', 'Cations par formule (a)') + fila('b', 'Anions par formule (b)');
      if (conK) s += fila('Ks', 'Ks');
      return s;
    };
    if (sc.modo === 'kps') h += sal(false) + sep('Solubilité') + elige('uni', 'Unité', [['mol', 'mol/L'], ['g', 'g/L']]) + fila('s', 'Solubilité', sc.uni === 'g' ? 'g/L' : 'mol/L') + (sc.uni === 'g' ? fila('M', 'Masse molaire', 'g/mol, ou la formule') : '');
    else if (sc.modo === 'solub') h += sal(true) + fila('M', 'Masse molaire', 'g/mol, opcional');
    else if (sc.modo === 'comun') h += sal(true) + sep('Ion commun') + elige('ion', 'Quel ion est déjà présent', [['an', 'L’anion (B)'], ['cat', 'Le cation (A)']]) + fila('C', 'Concentration', 'mol/L') + fila('M', 'Masse molaire', 'g/mol, opcional');
    else if (sc.modo === 'precipita') h += sal(true) + sep('Solution du cation (A)') + fila('c1', 'Concentration de A', 'mol/L') + fila('V1', 'Volume', 'mL') + sep('Solution de l’anion (B)') + fila('c2', 'Concentration de B', 'mol/L') + fila('V2', 'Volume', 'mL') + fila('M', 'Masse molaire', 'g/mol, opcional');
    else if (sc.modo === 'ph') {
      h += sal(true) + sep('Moyen') + elige('anion', 'L’anion est', [['oh', 'Hydroxyde (OH⁻)'], ['base', 'Base conjuguée d’un acide faible']]);
      if (sc.anion !== 'oh') h += filaT('pkas', 'pKa de l’acide conjugué', 'du plus petit au plus grand, séparés par « ; »');
      h += fila('pH', 'pH de la solution') + (sc.anion === 'oh' ? fila('C', 'Concentration du cation', 'mol/L, facultatif (donne le pH de précipitation)') : '') + fila('M', 'Masse molaire', 'g/mol, opcional');
    } else if (sc.modo === 'complejo') {
      h += sal(true) + sep('Ligand') + elige('lig', 'Ligand', [['NH3', 'NH₃ (ammoniaque)'], ['S2O3', 'S₂O₃²⁻ (tiosulfato)'], ['OH', 'OH⁻ (hydroxyde)'], ['otro', 'Autre (saisissez les log β)']]) + filaT('logb', 'log β₁ ; log β₂ ; …', 'séparés par « ; »') + fila('L0', 'Concentration initiale du ligand', 'mol/L') + fila('M', 'Masse molaire', 'g/mol, opcional');
    } else {
      h += elige('comun', 'Quel ion est ajouté', [['cat', 'Un cation (Ag⁺ à Cl⁻ et CrO₄²⁻)'], ['an', 'Un anion (I⁻ à Pb²⁺ et Ba²⁺)']]);
      for (const i of [1, 2]) h += sep(`Sel ${i}`) + fila('a' + i, 'Cations par formule') + fila('b' + i, 'Anions par formule') + fila('Ks' + i, 'Ks') + fila('c' + i, 'Concentration de l’autre ion', 'mol/L');
    }
    $('#campos').innerHTML = h;
    $('#nota').innerHTML = NOTAS[sc.modo];
  }
  const logb = (cat, lig) => { const v = Datos.COMPLEJOS[cat]?.[lig]; return v && v.every((x) => x !== null) ? v.map((x) => String(x).replace('.', ',')).join(' ; ') : null; };
  const rellena = (c) => {
    const s = P.SALES.find((x) => x[0] === c); if (!s) return;
    sc.formula = s[1]; sc.a = String(s[2]); sc.b = String(s[3]); sc.Kps = String(s[4]); sc.M = '';
    if (sc.modo === 'ph') { sc.anion = s[7] === 'OH' ? 'oh' : 'base'; sc.pkas = Datos.ACIDOS_ANION[s[7]]?.map((x) => String(x).replace('.', ',')).join(' ; ') || ''; }
    if (sc.modo === 'complejo') { const lig = ['NH3', 'S2O3', 'OH'].find((l) => logb(s[5], l)); if (lig) { sc.lig = lig; sc.logb = logb(s[5], lig); } }
  };
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (t.tagName !== 'INPUT') return;
    sc[t.dataset.k] = t.value; if (['formula', 'a', 'b', 'Ks'].includes(t.dataset.k)) { sc.sal = ''; const s = $('#f-sal'); if (s) s.value = ''; }
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

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v, cl = 'num') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#usar-en').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = 'Diagramme logarithmique : la droite est la limite de saturation ([A]^a·[B]^b = Ks). Au-dessus, il y a sursaturation et précipitation ; en dessous, la solution admet davantage de sel.';
    if (sol.modo === 'kps') h = dato('Ks', f(sol.Kps)) + dato('Solubilité', `s = ${f(sol.s)} mol/L`, '') + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`, '') : '') + dato('[A]', `${f(sol.ca)} M`, '') + dato('[B]', `${f(sol.cb)} M`, '');
    else if (sol.modo === 'solub') h = dato('Solubilité', `s = ${f(sol.s)} mol/L`) + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : '') + dato('[A]', `${f(sol.ca)} M`) + dato('[B]', `${f(sol.cb)} M`);
    else if (sol.modo === 'comun') { h = dato('Solubilité avec l’ion commun', `s = ${f(sol.s)} mol/L`) + dato('Dans l’eau pure', `s₀ = ${f(sol.s0)} mol/L`, '') + dato('Se réduit', `${f(sol.factor)} veces`) + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : ''); ley = 'Le point est sur la droite de saturation, avec l’ion commun déjà présent : plus il y a d’ion commun, moins de sel se dissout.'; }
    else if (sol.modo === 'ph') {
      h = dato('Solubilité à ce pH', `s = ${f(sol.s)} mol/L`) + dato('Sans protonation', `s₀ = ${f(sol.s0)} mol/L`, '') + dato(sol.s >= sol.s0 ? 'Plus soluble' : 'Moins soluble', `${f(sol.factor)} veces`) + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : '');
      if (sol.pHini !== undefined) h += dato('Commence à précipiter', `pH ${f(sol.pHini, 4)}`) + dato('Précipitation quantitative', `pH ${f(sol.pHfin, 4)}`);
      ley = 'Solubilité du sel en fonction du pH (échelle logarithmique). Le point noir est le pH que vous avez saisi ; la ligne en pointillés, la solubilité sans tenir compte de la protonation de l’anion.';
    } else if (sol.modo === 'complejo') {
      h = dato('Solubilité avec le ligand', `s = ${f(sol.s)} mol/L`) + dato('Dans l’eau pure', `s₀ = ${f(sol.s0)} mol/L`, '') + dato('Augmente', `${f(sol.factor)} veces`) + dato('Ligand libre', `${f(sol.L)} M`, '') + dato('Ligands par cation', f(sol.nbar), '') + (sol.g !== null ? dato('En g/L', `${f(sol.g)} g/L`) : '');
      ley = 'Solubilité du sel en fonction de la concentration initiale de ligand (échelle logarithmique). Le point noir est la concentration que vous avez saisie ; la ligne en pointillés, la solubilité dans l’eau pure.';
    } else if (sol.modo === 'precipita') {
      h = dato('Produit ionique', `Q = ${f(sol.Q)}`) + dato('Q / Ks', f(sol.ratio)) + dato('Résultat', sol.precipita ? 'Précipite' : 'No precipita', '');
      if (sol.precipita) h += dato('Reste [A]', `${f(sol.cA)} M`) + dato('Reste [B]', `${f(sol.cB)} M`) + dato('Solide', `${f(sol.mol)} mol`) + (sol.masa !== null ? dato('Masse de précipité', `${f(sol.masa)} g`) : '');
      ley = 'Le point orange est le mélange qui vient d’être fait (au-dessus de la droite, il précipite ; en dessous, non). S’il précipite, le point noir est l’équilibre final sur la droite.';
    } else {
      h = sol.S.map((s) => dato(`Le sel ${s.i} commence avec [${sol.cat ? 'A' : 'B'}]`, `${f(s.X)} M`)).join('') + dato('Précipite en premier', `la sal ${sol.primera}`, '') + dato(`Reste du sel ${sol.p.i}`, `${f(sol.resta)} M (${f(100 * sol.frac)} %)`) + dato('Séparation', sol.sep ? 'cuantitativa' : 'incompleta', '');
      ley = `Chaque droite est un sel : [${sol.cat ? 'B' : 'A'}] en fonction de [${sol.cat ? 'A' : 'B'}] à saturation. Les points orange marquent où chacun commence à précipiter ; le noir, ce qui reste du premier quand le second commence.`;
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    exporta();
    $('#usar-en').innerHTML = ['kps', 'solub'].includes(sol.modo) && /OH/.test(sc.formula || '') && sol.s > 0 && isFinite(sol.s) ? `<a class="btn" id="u-ph" data-usar="ph" href="${esc(Herramienta.enlaceA('ph', { modo: 'fuerte', especie: 'base', C: String(sol.s), n: String(sol.b) }))}">Calculer le pH de la solution saturée</a>` : '';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--roz', '--bg']) col[k] = cs.getPropertyValue(k).trim(); }
  const lg = Math.log10;
  const sup = (k) => txt(`10<sup>${k < 0 ? '−' : ''}${Math.abs(k)}</sup>`);
  function figura() {
    if (sol.modo === 'selectiva') {
      const rectas = sol.S.map((s, i) => ({ K: s.Kps, p: s.p, q: s.q, color: i ? col['--serie-2'] : col['--serie-1'], et: `sal ${s.i}` }));
      const pts = sol.S.map((s, i) => ({ x: lg(s.X), y: lg(s.c), color: col['--roz'] || col['--accent'], et: `sal ${s.i}` })).concat([{ x: lg(sol.q.X), y: lg(sol.resta), color: col['--ink'], et: 'queda' }]);
      return { rectas, pts, ejes: [sol.cat ? '[A] ajouté (M)' : '[B] ajouté (M)', 'otro ion (M)'], enlaces: [] };
    }
    const r = [{ K: sol.Kps, p: sol.b, q: sol.a, color: col['--accent'], et: '' }], ejes = ['[B] (M)', '[A] (M)'];
    if (sol.modo === 'precipita') {
      const pts = [{ x: lg(sol.cb0), y: lg(sol.ca0), color: col['--roz'] || col['--accent'], et: 'mezcla' }];
      if (sol.precipita) pts.push({ x: lg(sol.cB), y: lg(sol.cA), color: col['--ink'], et: 'equilibrio', izq: true });
      return { rectas: r, pts, ejes, enlaces: pts.length > 1 ? [[0, 1]] : [] };
    }
    return { rectas: r, pts: [{ x: lg(sol.cb), y: lg(sol.ca), color: col['--ink'], et: 'saturada' }], ejes, enlaces: [] };
  }
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
    g.fillText(ph ? 'pH' : 'ligand initial (mol/L)', ml + (w - ml - mr) / 2, h - 16);
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
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(ph ? 'sans protonation' : 'agua pura', w - mr - 8, Y(lg(sol.s0)) - 4);
  }
  function exporta() {
    const n6 = (v) => String(+Number(v).toPrecision(6)).replace('.', ',');
    Herramienta.exportar('#grafica', { nombre: 'solubilidad-' + (sol ? sol.modo : 'grafica'), titulo: 'Solubilité', etiqueta: 'le graphique', datos: () => {
      if (!sol) return null;
      if (sol.curva) return { cab: [sol.modo === 'ph' ? 'pH' : 'ligand initial (mol/L)', 'solubilidad (mol/L)'], filas: sol.curva.map((q) => [n6(q[0]), n6(q[1])]) };
      const fg = figura();
      return { cab: ['Point', fg.ejes[0] + ' (log10)', fg.ejes[1] + ' (log10)'], filas: fg.pts.map((p) => [p.et || 'punto', n6(p.x), n6(p.y)]) };
    } });
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
    else { g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('au-dessus de chaque droite, ce sel précipite', ml + 8, mt + 6); }
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const toma = (xs) => xs[Math.floor(Math.random() * xs.length)], c3 = (v) => String(+v.toPrecision(3));
  function azar() {
    const [clave, formula, a, b, Kps] = toma(P.SALES.filter((s) => s[4] > 1e-20)), base = { sal: clave, formula, a: String(a), b: String(b), Kps: String(Kps), M: '' };
    const modo = toma(['kps', 'solub', 'comun', 'precipita']);
    if (modo === 'kps') { const s = (Kps / (a ** a * b ** b)) ** (1 / (a + b)); sc = { ...base, modo, uni: 'mol', s: c3(s) }; }
    else if (modo === 'solub') sc = { ...base, modo };
    else if (modo === 'comun') sc = { ...base, modo, ion: toma(['an', 'cat']), C: toma(['0.1', '0.05', '0.01', '0.2']) };
    else {
      const k = toma([20, 50, 200]), cb0 = toma([0.002, 0.004, 0.01, 0.02]), ca0 = ((k * Kps) / cb0 ** b) ** (1 / a), V = toma(['25', '50', '100']);
      sc = { ...base, modo, c1: c3(2 * ca0), V1: V, c2: c3(2 * cb0), V2: V };
    }
    $('#ejemplos').value = ''; formulario(); calcula();
  }
  const enunciado = () => {
    let r; try { r = P.resolver(sc); } catch (e) { return ''; }
    const fm = vacio(sc.formula) ? `un sel A<sub>${esc(sc.a)}</sub>B<sub>${esc(sc.b)}</sub>` : esc(sc.formula);
    if (sc.modo === 'kps') return `La solubilité de ${fm} dans l’eau est ${esc(sc.s)} ${sc.uni === 'g' ? 'g/L' : 'mol/L'}. Calculez son <b>K<sub>s</sub></b> et les concentrations des ions.`;
    if (sc.modo === 'solub') return `Le K<sub>s</sub> de ${fm} est ${esc(sc.Kps)}. Calculez sa <b>solubilité</b> dans l’eau (mol/L) et la concentration de chaque ion.`;
    if (sc.modo === 'comun') return `Le K<sub>s</sub> de ${fm} est ${esc(sc.Kps)}. Calculez sa <b>solubilité</b> dans une solution qui contient déjà ${esc(sc.C)} M de son ${sc.ion === 'cat' ? 'cation' : 'anion'} et combien de fois elle est plus petite que dans l’eau pure.`;
    if (sc.modo === 'precipita') return `On mélange ${esc(sc.V1)} mL d’une solution avec [A] = ${esc(sc.c1)} M et ${esc(sc.V2)} mL avec [B] = ${esc(sc.c2)} M. Le K<sub>s</sub> de ${fm} est ${esc(sc.Kps)}. Calculez le <b>produit ionique Q</b>, Q/K<sub>s</sub> et ${r.precipita ? 'ce qui reste en solution' : 'si le sel précipite'}.`;
    return '';
  };

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('solubilidad').current;
  colores(); formulario(); calcula();
  window.SolubilidadApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, Kps: sol.Kps, s: sol.s, Q: sol.Q, precipita: sol.precipita, resta: sol.resta }, estado: () => copia(sc) };
})();

