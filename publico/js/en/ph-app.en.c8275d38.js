(() => {
  const { $, esc, copia, txt } = Herramienta;
  const P = PH, f = P.f, f2 = P.f2, CLAVE = 'ph-v1';
  const MODOS = [['fuerte', 'Strong acid or base'], ['debil', 'Weak acid or base'], ['sal', 'Hydrolysis of a salt'], ['inverso', 'Ka, Kb or C from the pH'], ['tampon', 'Buffer solution'], ['preparar', 'Prepare a buffer'], ['mezcla', 'Mixture of an acid and a base'], ['poliprotico', 'Polyprotic acid'], ['valoracion', 'Titration']];

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = { ...sc, ...g }; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const especie = elige.bind(null, 'especie', 'What it is');
  const NOTAS = {
    fuerte: 'Enter 2 in H⁺ or OH⁻ per formula unit for H₂SO₄ (taking both dissociations as complete) or Ba(OH)₂. 1e-8 or 1·10^-8 is accepted.',
    debil: 'Enter the constant or its pK, either one. For a base, Kb (ammonia 1.8·10^-5).',
    tampon: 'The constant is that of the weak acid (HA/A⁻) or of the weak base (B/BH⁺). To see how it buffers, add a strong acid or base.',
    mezcla: 'For an acid with several H⁺ or a base with several OH⁻, multiply the concentration by the number it gives. With a weak one, its constant.',
    sal: 'The constant is that of the weak acid the anion comes from (acetate: Ka of acetic acid) or of the weak base the cation comes from (ammonium: Kb of ammonia).',
    inverso: 'Enter the measured pH. For a weak one, with the concentration you get the constant and with the constant, the concentration needed.',
    preparar: 'The formula of the salt is optional: with it, the grams to weigh out are calculated (CH3COONa, NH4Cl…).',
    poliprotico: 'The constants from largest to smallest. Ka₃ is optional. For a first dissociation that is complete (H₂SO₄) enter a large Ka₁, such as 1e3.',
    valoracion: 'The graph is the titration curve. The added volume is optional: with it the pH at that point is calculated.',
  };
  function formulario() {
    let h = elige('modo', 'What to calculate', MODOS);
    const kk = (b) => fila('K', b ? 'Constant Kb' : 'Constant Ka') + fila('pK', b ? 'o bien pKb' : 'o bien pKa');
    if (sc.modo === 'fuerte') {
      h += especie([['acido', 'A strong acid'], ['base', 'A strong base']]) + fila('C', 'Concentration', 'mol/L') + fila('n', sc.especie === 'base' ? 'OH⁻ per formula unit' : 'H⁺ per formula unit');
    } else if (sc.modo === 'debil') {
      h += especie([['acido', 'A weak acid'], ['base', 'A weak base']]) + fila('C', 'Initial concentration', 'mol/L') + kk(sc.especie === 'base');
    } else if (sc.modo === 'tampon') {
      const b = sc.especie === 'base';
      h += especie([['acido', 'Weak acid and its salt (HA/A⁻)'], ['base', 'Weak base and its salt (B/BH⁺)']]) + kk(b) + fila('Cd', b ? 'Concentration of the base [B]' : 'Concentration of the acid [HA]', 'mol/L') + fila('Cs', b ? 'Concentration of the salt [BH⁺]' : 'Concentration of the salt [A⁻]', 'mol/L');
      h += sep('Add') + elige('anade', 'Added', [['nada', 'Nothing'], ['acido', 'A strong acid'], ['base', 'A strong base']]);
      if (sc.anade === 'acido' || sc.anade === 'base') h += fila('V', 'Volume of the buffer', 'mL') + fila('Cad', 'Concentration of what is added', 'mol/L') + fila('Vad', 'Volume added', 'mL');
    } else if (sc.modo === 'mezcla') {
      h += elige('tipo', 'What is mixed', [['ff', 'Strong acid and strong base'], ['df', 'Weak acid and strong base'], ['fd', 'Strong acid and weak base']]);
      h += fila('Ca', 'Concentration of the acid', 'mol/L') + fila('Va', 'Volume of the acid', 'mL') + fila('Cb', 'Concentration of the base', 'mol/L') + fila('Vb', 'Volume of the base', 'mL') + (sc.tipo === 'df' || sc.tipo === 'fd' ? kk(sc.tipo === 'fd') : '');
    } else if (sc.modo === 'sal') {
      h += elige('tipo', 'Which salt', [['basica', 'Of a weak acid (sodium acetate)'], ['acida', 'Of a weak base (ammonium chloride)'], ['neutra', 'Of a strong acid and base (NaCl)'], ['anfotera', 'Amphoteric (NaHCO₃, NaH₂PO₄)']]) + fila('C', 'Concentration of the salt', 'mol/L') + (sc.tipo === 'neutra' ? '' : sc.tipo === 'anfotera' ? fila('K1', 'Ka₁ of the acid H₂A') + fila('K2', 'Ka₂ (of HA⁻)') : kk(sc.tipo === 'acida'));
    } else if (sc.modo === 'inverso') {
      h += elige('fuerza', 'What it is', [['debil', 'Weak'], ['fuerte', 'Strong']]) + especie([['acido', 'An acid'], ['base', 'A base']]) + fila('pHm', 'pH medido');
      if (sc.fuerza === 'fuerte') h += fila('n', sc.especie === 'base' ? 'OH⁻ per formula unit' : 'H⁺ per formula unit');
      else { h += elige('busca', 'What to find', [['K', 'La constante'], ['C', 'The concentration']]); h += sc.busca === 'C' ? kk(sc.especie === 'base') : fila('C', 'Initial concentration', 'mol/L'); }
    } else if (sc.modo === 'preparar') {
      const b = sc.especie === 'base';
      h += especie([['acido', 'Weak acid and its salt (HA/A⁻)'], ['base', 'Weak base and its salt (B/BH⁺)']]) + kk(b) + fila('pHo', 'Desired pH') + fila('Cd', b ? 'Concentration of the base' : 'Concentration of the acid', 'mol/L') + fila('V', 'Volume to prepare', 'mL') + `<label for="f-sal">Formula of the salt <small>optional</small></label><input id="f-sal" class="in" data-k="sal" value="${esc(sc.sal ?? '')}" autocomplete="off" spellcheck="false">`;
    } else if (sc.modo === 'poliprotico') {
      h += fila('C', 'Concentration', 'mol/L') + fila('K1', 'Ka₁') + fila('K2', 'Ka₂') + fila('K3', 'Ka₃', 'optional');
    } else {
      h += elige('tipo', 'What is titrated', [['af-bf', 'Strong acid with strong base'], ['ad-bf', 'Weak acid with strong base'], ['bf-af', 'Strong base with strong acid'], ['bd-af', 'Weak base with strong acid'], ['ap-bf', 'Polyprotic acid with strong base']]);
      const debil = sc.tipo === 'ad-bf' || sc.tipo === 'bd-af', b = sc.tipo === 'bf-af' || sc.tipo === 'bd-af';
      h += fila('C', `Concentration ${b ? 'of the base' : 'of the acid'}`, 'mol/L') + fila('V', 'Volume titrated', 'mL') + fila('Ct', 'Concentration of the titrant', 'mol/L') + (debil ? kk(b) : '') + (sc.tipo === 'ap-bf' ? fila('K1', 'Ka₁') + fila('K2', 'Ka₂') + fila('K3', 'Ka₃', 'optional') : '') + sep('Optional') + fila('Vt', 'Volume of titrant added', 'mL');
    }
    h += sep('Temperature') + fila('T', 'Water temperature', '°C, empty = 25');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (t.tagName !== 'INPUT') return;
    sc[t.dataset.k] = t.value;
    if ((t.dataset.k === 'K' || t.dataset.k === 'pK') && t.value.trim()) { const o = t.dataset.k === 'K' ? 'pK' : 'K'; sc[o] = ''; const el = $(`#f-${o}`); if (el) el.value = ''; }
    $('#ejemplos').value = ''; calcula();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(P.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (t.dataset.k === 'tipo' && t.value === 'ap-bf') sc = copia(P.ejemplos.find((x) => x.sc.tipo === 'ap-bf').sc);
    else { const ej = P.ejemplos.find((x) => x.sc.modo === sc.modo && x.sc[t.dataset.k] === t.value); if (ej) for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; if (t.dataset.k === 'tipo' && vacioC(sc.K) && vacioC(sc.pK)) sc.K = '1.8e-5'; if (t.dataset.k === 'anade' && vacioC(sc.V)) Object.assign(sc, { V: '100', Cad: '0.1', Vad: '10' }); }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#grafica').hidden = true; $('#especies').hidden = true;
      dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = 'The color is what universal indicator would take. H₃O⁺ in red and OH⁻ in blue (not to scale: each pH unit is ten times more).';
    if (sol.modo === 'fuerte') h = dato('pH', `pH = ${f2(sol.pH)}`) + dato('pOH', `pOH = ${f2(sol.pKw - sol.pH)}`) + dato('[H₃O⁺]', `${f(sol.h)} M`);
    else if (sol.modo === 'debil') { h = dato('pH', `pH = ${f2(sol.pH)}`) + dato(sol.base ? '[OH⁻]' : '[H₃O⁺]', `${f(sol.x)} M`) + dato('Degree of dissociation', `α = ${f(100 * sol.alfa)} %`); ley += sol.base ? ' Unreacted B molecules in gray and BH⁺ in green.' : ' Undissociated HA molecules in gray and A⁻ in green.'; }
    else if (sol.modo === 'tampon') { h = dato('pH of the buffer', `pH = ${f2(sol.pH0)}`) + (sol.anade !== 'nada' ? dato('After adding', `pH = ${f2(sol.pH)}`) + dato('In pure water it would be', `pH = ${f2(sol.pHagua)}`) : '') + dato('pKa of the pair', `pK<sub>a</sub> = ${f2(sol.pKa)}`); ley += ' The acidic form of the pair in gray and the basic form in green.'; }
    else if (sol.modo === 'mezcla') h = dato('pH', `pH = ${f2(sol.pH)}`) + dato('Moles of acid', `${f(sol.na)} mol`) + dato('Moles of base', `${f(sol.nb)} mol`);
    else if (sol.modo === 'sal') h = dato('pH', `pH = ${f2(sol.pH)}`) + (sol.pH0 !== undefined ? dato('Approximation ½(pKa₁ + pKa₂)', `pH ≈ ${f2(sol.pH0)}`, '') + dato('Concentration [H₃O⁺]', `${f(sol.h)} M`, '') : '') + (sol.Kh ? dato('Hydrolysis constant', `${f(sol.Kh)}`) + dato('Degree of hydrolysis', `${f(100 * sol.alfa)} %`) : '');
    else if (sol.modo === 'inverso') h = (sol.K ? dato(sol.base ? 'Kb' : 'Ka', `${f(sol.K)}`) + dato(sol.base ? 'pKb' : 'pKa', `${f2(-Math.log10(sol.K))}`) : '') + dato('Concentration', `${f(sol.C)} M`) + (sol.alfa ? dato('Degree of dissociation', `α = ${f(100 * sol.alfa)} %`) : '');
    else if (sol.modo === 'preparar') h = dato('Base/acid ratio', `${f(sol.cociente)}`) + dato('Concentration of the salt', `${f(sol.Cs)} M`) + (sol.masa !== null ? dato('Mass of salt', `${f(sol.masa)} g`) : dato('Moles of salt', `${f(sol.ns)} mol`));
    else if (sol.modo === 'poliprotico') h = dato('pH', `pH = ${f2(sol.pH)}`) + dato('With Ka₁ only', `pH = ${f2(sol.pH1)}`) + dato('[A²⁻]', `${f(sol.conc[2])} M`);
    else if (sol.poli) {
      h = sol.Veqs.map((v, i) => dato(`${i + 1}.ª equivalencia`, `${f(v)} mL`)).join('') + dato('pH at the last one', `pH = ${f2(sol.pHeq)}`) + dato('Indicator', sol.ind[0]) + (sol.pHv !== null ? dato(`With ${txt(f(sol.v))} mL`, `pH = ${f2(sol.pHv)}`) : '');
      ley = `Strong base is added from the burette: there is a pH jump at each equivalence. The curve is the exact one; the orange point is the volume you asked for.`;
    }
    else {
      h = dato('Equivalence volume', `V<sub>eq</sub> = ${f(sol.Veq)} mL`) + dato('pH at the equivalence point', `pH = ${f2(sol.pHeq)}`) + (sol.debilV ? dato('A mitad', `pH = pK<sub>a</sub> = ${f2(sol.pKa)}`) : '') + dato('Indicator', sol.ind[0]) + (sol.pHv !== null ? dato(`With ${txt(f(sol.v))} mL`, `pH = ${f2(sol.pHv)}`) : '');
      ley = `${sol.nomT} is added from the burette and the ${sol.ind[0]} changes color on reaching the equivalence. The curve is the exact one; the orange point is the volume you asked for.`;
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#grafica').hidden = sol.modo !== 'valoracion';
    $('#especies').hidden = !(sol.modo === 'poliprotico' || sol.modo === 'tampon' || (sol.modo === 'valoracion' && sol.poli));
    $('#especies').setAttribute('aria-label', sol.modo === 'tampon' ? 'Buffer capacity β versus pH' : 'Species diagram: fraction of each form of the acid versus pH');
    tA = 0; particulas(); dibuja(); grafica(); especies(); exporta();
  }
  function exporta() {
    const n6 = (v) => String(+Number(v).toPrecision(6)).replace('.', '.');
    const b1 = Herramienta.exportar('#grafica', { nombre: 'ph-valoracion', titulo: 'Titration curve: pH versus volume', etiqueta: 'the titration curve', datos: () => (sol && sol.curva ? { cab: ['V (mL)', 'pH'], filas: sol.curva.map(([v, p]) => [n6(v), n6(p)]) } : null) });
    const b2 = Herramienta.exportar('#especies', { nombre: 'ph-especies', titulo: 'Species diagram: fraction versus pH', etiqueta: 'the species diagram', datos: () => { if (sol && sol.modo === 'tampon') return { cab: ['pH', 'β (mol/(L·pH))'], filas: sol.curvaBeta.map(([p, b]) => [String(p).replace('.', '.'), String(+b.toPrecision(6)).replace('.', '.')]) }; if (!sol || !sol.Kas) return null; const nm = sol.Kas.length === 2 ? ['H₂A', 'HA⁻', 'A²⁻'] : ['H₃A', 'H₂A⁻', 'HA²⁻', 'A³⁻']; return { cab: ['pH', ...nm.map((x) => 'α(' + x + ')')], filas: Array.from({ length: 141 }, (_, i) => { const p = i / 10; return [n6(p), ...P.fracciones(sol.Kas, p).map(n6)]; }) }; } });
    if (b1) b1.hidden = $('#grafica').hidden; if (b2) b2.hidden = $('#especies').hidden;
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--suelo', '--cuerpo', '--panel', '--tension']) col[k] = cs.getPropertyValue(k).trim(); }
  const UNIV = [[0, [214, 40, 40]], [3, [240, 130, 40]], [5, [242, 200, 50]], [7, [70, 170, 70]], [9, [40, 110, 200]], [11, [70, 60, 170]], [14, [120, 40, 140]]];
  const mezclaRGB = (a, b, s) => a.map((x, i) => Math.round(x + (b[i] - x) * s));
  function universal(pH) {
    const p = Math.max(0, Math.min(14, pH));
    for (let i = 1; i < UNIV.length; i++) if (p <= UNIV[i][0]) { const [p0, c0] = UNIV[i - 1], [p1, c1] = UNIV[i]; return mezclaRGB(c0, c1, (p - p0) / (p1 - p0)); }
    return UNIV[UNIV.length - 1][1];
  }
  const NOMBRES = { rojo: [214, 50, 40], amarillo: [240, 200, 50], azul: [40, 100, 210], rosa: [224, 80, 156], 'purple': [130, 60, 160], 'red-purple': [190, 40, 110], incoloro: null };
  function deIndicador(ind, pH, agua) {
    const a = NOMBRES[ind[3]] || agua, b = NOMBRES[ind[4]] || agua, s = Math.max(0, Math.min(1, (pH - ind[1]) / (ind[2] - ind[1])));
    return mezclaRGB(a, b, s);
  }
  const rgba = (c, al = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${al})`;
  const hexRGB = (h) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || ''); return m ? [1, 2, 3].map((i) => parseInt(m[i], 16)) : [200, 220, 240]; };

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Resume'; });
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  let tA = 0, parts = [];
  function particulas() {
    parts = [];
    if (!sol || sol.modo === 'valoracion') return;
    const pH = sol.modo === 'tampon' ? sol.pH : sol.pH, nH = Math.round(Math.max(0, Math.min(26, (7 - pH) * 3.5))) || (pH < 7 ? 1 : 0), nOH = Math.round(Math.max(0, Math.min(26, (pH - 7) * 3.5))) || (pH > 7 ? 1 : 0);
    const add = (n, tipo) => { for (let i = 0; i < n; i++) parts.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, tipo }); };
    add(nH || (pH >= 6.99 && pH <= 7.01 ? 1 : 0), 'H'); add(nOH || (pH >= 6.99 && pH <= 7.01 ? 1 : 0), 'OH');
    if (sol.modo === 'debil' || sol.modo === 'tampon') {
      const fb = sol.modo === 'debil' ? sol.alfa : 1 / (1 + 10 ** (sol.pKa - sol.pH)), tot = 26, nb = sol.modo === 'debil' ? Math.max(1, Math.round(tot * fb)) : Math.round(tot * fb);
      add(tot - nb, sol.base && sol.modo === 'debil' ? 'B' : 'HA'); add(nb, sol.base && sol.modo === 'debil' ? 'BH' : 'A');
    }
  }
  function mueve(dt) {
    for (const q of parts) {
      q.vx += (Math.random() - 0.5) * dt * 0.8; q.vy += (Math.random() - 0.5) * dt * 0.8;
      const v = Math.hypot(q.vx, q.vy); if (v > 0.3) { q.vx *= 0.3 / v; q.vy *= 0.3 / v; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.x < 0 || q.x > 1) { q.vx = -q.vx; q.x = Math.max(0, Math.min(1, q.x)); }
      if (q.y < 0 || q.y > 1) { q.vy = -q.vy; q.y = Math.max(0, Math.min(1, q.y)); }
    }
  }
  const vMax = () => (sol.poli ? (sol.Kas.length + 1) * sol.Veq : 2 * sol.Veq);
  const vAnim = (t) => { const ciclo = 11, s = (t % ciclo) / 9.5; return Math.min(1, s) * vMax(); };

  function lienzo(c) {
    if (!c.clientWidth || !c.clientHeight) return null;
    const r = Herramienta.lienzo(c);
    r.g.lineCap = 'round'; r.g.lineJoin = 'round';
    return r;
  }
  function dibuja() {
    const L = lienzo($('#escena'));
    if (!L || !sol) return;
    const { g, w, h } = L;
    if (!col['--ink']) colores();
    const agua = hexRGB(col['--bg'] === '#11151b' ? '#2b4f7e' : '#cfe3f7');
    if (sol.modo !== 'valoracion') {
      const bw = Math.min(w * 0.42, 300), bx = w * 0.12, by = h * 0.12, bh = h * 0.6, ySup = by + bh * 0.18;
      g.fillStyle = rgba(universal(sol.pH), 0.55); g.fillRect(bx, ySup, bw, by + bh - ySup);
      g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 4, by); g.lineTo(bx, by + bh); g.lineTo(bx + bw, by + bh); g.lineTo(bx + bw + 4, by); g.stroke();
      const COL = { H: col['--peso'], OH: col['--tension'], HA: col['--suelo'], B: col['--suelo'], A: col['--normal'], BH: col['--normal'] };
      const ETQ = { H: 'H₃O⁺', OH: 'OH⁻', HA: 'HA', A: 'A⁻', B: 'B', BH: 'BH⁺' };
      for (const q of parts) {
        const x = bx + 10 + q.x * (bw - 20), y = ySup + 10 + q.y * (by + bh - ySup - 20);
        if (q.tipo === 'HA' || q.tipo === 'B') { punto(g, x - 4, y, 5, COL[q.tipo]); punto(g, x + 4, y, 4, COL[q.tipo]); } else punto(g, x, y, q.tipo === 'H' || q.tipo === 'OH' ? 4.5 : 5, COL[q.tipo]);
      }
      const tipos = [...new Set(parts.map((q) => q.tipo))];
      tipos.forEach((t, i) => { punto(g, bx + bw + 30, by + 20 + i * 20, 5, COL[t]); texto(g, bx + bw + 42, by + 20 + i * 20, ETQ[t], col['--ink'], 'left'); });
      const sx = 20, sw = w - 40, sy = h - 34;
      for (let i = 0; i < sw; i++) { g.fillStyle = rgba(universal((14 * i) / sw)); g.fillRect(sx + i, sy, 1.5, 12); }
      for (let p = 0; p <= 14; p += 2) texto(g, sx + (sw * p) / 14, sy + 22, String(p), col['--muted']);
      const xm = sx + (sw * Math.max(0, Math.min(14, sol.pH))) / 14;
      g.fillStyle = col['--ink']; g.beginPath(); g.moveTo(xm, sy - 2); g.lineTo(xm - 6, sy - 12); g.lineTo(xm + 6, sy - 12); g.closePath(); g.fill();
      texto(g, xm, sy - 20, `pH ${txt(f2(sol.pH))}`, col['--ink'], 'center', '600 ');
      if (sol.modo === 'tampon' && sol.anade !== 'nada') {
        const x0 = sx + (sw * sol.pH0) / 14, xa = sx + (sw * sol.pHagua) / 14;
        g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x0, sy - 4); g.lineTo(x0, sy + 14); g.moveTo(xa, sy - 4); g.lineTo(xa, sy + 14); g.stroke(); g.setLineDash([]);
        texto(g, xa, sy - 6, 'agua', col['--muted']);
      }
      return;
    }
    const v = vAnim(tA), pH = sol.ph(v), cx = w * 0.3, top = 10, bH = h * 0.42, bW = 16;
    const lleno = 1 - v / (1.2 * vMax());
    g.strokeStyle = col['--suelo']; g.lineWidth = 2; g.strokeRect(cx - bW / 2, top, bW, bH);
    g.fillStyle = rgba(agua, 0.9); g.fillRect(cx - bW / 2 + 2, top + bH * (1 - lleno), bW - 4, bH * lleno - 2);
    for (let k = 1; k < 10; k++) { g.beginPath(); g.moveTo(cx - bW / 2, top + (bH * k) / 10); g.lineTo(cx - bW / 2 + 5, top + (bH * k) / 10); g.stroke(); }
    g.beginPath(); g.moveTo(cx, top + bH); g.lineTo(cx, top + bH + 16); g.stroke();
    texto(g, cx + bW, top + 14, sol.nomT, col['--muted'], 'left');
    const yf = top + bH + 34, fh = h - yf - 24, fw = Math.min(w * 0.34, 200);
    const cMat = deIndicador(sol.ind, pH, agua);
    const yl = yf + fh * 0.5, al = 12 + (fw / 2 - 12) * (0.2 / 0.7); // nivel del líquido y su semiancho en el cono
    g.fillStyle = rgba(cMat, 0.75);
    g.beginPath(); g.moveTo(cx - al, yl); g.lineTo(cx - fw / 2, yf + fh); g.lineTo(cx + fw / 2, yf + fh); g.lineTo(cx + al, yl); g.closePath(); g.fill();
    if (anda && v < vMax()) { const yd = top + bH + 18 + ((tA * 3) % 1) * (yl - top - bH - 18); punto(g, cx, yd, 3, rgba(agua)); }
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 12, yf); g.lineTo(cx - 12, yf + fh * 0.3); g.lineTo(cx - fw / 2, yf + fh); g.lineTo(cx + fw / 2, yf + fh); g.lineTo(cx + 12, yf + fh * 0.3); g.lineTo(cx + 12, yf); g.stroke();
    texto(g, cx + fw / 2 + 12, yf + fh * 0.7, `${sol.nomV} + ${sol.ind[0]}`, col['--muted'], 'left');
    texto(g, w * 0.58, h * 0.25, `V = ${txt(f(v))} mL`, col['--ink'], 'left', '600 ');
    texto(g, w * 0.58, h * 0.25 + 22, `pH = ${txt(f2(pH))}`, col['--ink'], 'left', '600 ');
    const eqs = sol.Veqs || [sol.Veq], k = eqs.findIndex((e) => Math.abs(v - e) <= 0.02 * sol.Veq), antes = eqs.filter((e) => v > e * 1.02).length;
    texto(g, w * 0.58, h * 0.25 + 44, k >= 0 ? `${eqs.length > 1 ? `#${k + 1} ` : ''}equivalence point` : antes === 0 ? 'before the equivalence point' : antes === eqs.length ? 'pasada la equivalencia' : `past equivalence ${antes}`, col['--muted'], 'left');
  }

  function especies() {
    const c = $('#especies');
    if (c.hidden || !sol || !(sol.Kas || sol.modo === 'tampon')) return;
    const L = lienzo(c); if (!L) return;
    const { g, w, h } = L;
    if (!col['--ink']) colores();
    if (sol.modo === 'tampon') {
      const ml = 52, mr = 14, mt = 18, mb = 38, bm = Math.max(...sol.curvaBeta.map((q) => q[1])) * 1.1, X = (p) => ml + (p / 14) * (w - ml - mr), Y = (b) => mt + (1 - b / bm) * (h - mt - mb);
      g.strokeStyle = col['--line']; g.lineWidth = 1;
      for (let k = 0; k <= 4; k++) { const b = (bm * k) / 4; g.beginPath(); g.moveTo(ml, Y(b)); g.lineTo(w - mr, Y(b)); g.stroke(); texto(g, ml - 6, Y(b), txt(f(b, 2)), col['--muted'], 'right'); }
      for (let p = 0; p <= 14; p += 2) texto(g, X(p), h - mb + 12, String(p), col['--muted']);
      texto(g, ml + (w - ml - mr) / 2, h - 7, 'pH', col['--muted']); texto(g, ml + 4, 6, 'β (mol/(L·pH))', col['--muted'], 'left');
      g.setLineDash([3, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(sol.pKa), mt); g.lineTo(X(sol.pKa), h - mb); g.stroke(); g.setLineDash([]);
      texto(g, X(sol.pKa), mt - 8, `pKa = ${txt(f2(sol.pKa))}`, col['--muted']);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath(); sol.curvaBeta.forEach(([p, b], i) => (i ? g.lineTo(X(p), Y(b)) : g.moveTo(X(p), Y(b)))); g.stroke();
      punto(g, X(sol.pH0), Y(sol.beta), 5, col['--roz']); texto(g, X(sol.pH0), Y(sol.beta) - 12, `β = ${txt(f(sol.beta, 3))}`, col['--ink']);
      return;
    }
    const ml = 40, mr = 14, mt = 18, mb = 38, X = (p) => ml + (p / 14) * (w - ml - mr), Y = (a) => mt + (1 - a) * (h - mt - mb), n = sol.Kas.length;
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    for (let a = 0; a <= 1; a += 0.25) { g.beginPath(); g.moveTo(ml, Y(a)); g.lineTo(w - mr, Y(a)); g.stroke(); texto(g, ml - 6, Y(a), txt(f2(a)), col['--muted'], 'right'); }
    for (let p = 0; p <= 14; p += 2) texto(g, X(p), h - mb + 12, String(p), col['--muted']);
    texto(g, ml + (w - ml - mr) / 2, h - 7, 'pH', col['--muted']);
    const cs = [col['--peso'], col['--roz'], col['--normal'], col['--tension']], nom = n === 2 ? ['H₂A', 'HA⁻', 'A²⁻'] : ['H₃A', 'H₂A⁻', 'HA²⁻', 'A³⁻'];
    g.setLineDash([3, 4]); g.strokeStyle = col['--muted'];
    sol.Kas.forEach((K, i) => { const p = -Math.log10(K); if (p >= 0 && p <= 14) { g.beginPath(); g.moveTo(X(p), mt); g.lineTo(X(p), h - mb); g.stroke(); texto(g, X(p), mt - 8, `pK${i + 1} = ${txt(f2(p))}`, col['--muted']); } });
    g.setLineDash([]);
    for (let j = 0; j <= n; j++) {
      g.strokeStyle = cs[j]; g.lineWidth = 2.4; g.beginPath();
      for (let i = 0; i <= 140; i++) { const p = i / 10, a = P.fracciones(sol.Kas, p)[j]; i ? g.lineTo(X(p), Y(a)) : g.moveTo(X(p), Y(a)); }
      g.stroke();
      const pm = j === 0 ? 0.6 : j === n ? 13.3 : (-Math.log10(sol.Kas[j - 1]) - Math.log10(sol.Kas[j])) / 2;
      if (pm > 0 && pm < 14) texto(g, X(Math.min(13.2, Math.max(0.8, pm))), Y(P.fracciones(sol.Kas, Math.min(13.2, Math.max(0.8, pm)))[j]) - 10, nom[j], cs[j], 'center', '600 ');
    }
    const pHm = sol.modo === 'poliprotico' ? sol.pH : sol.pHv;
    if (pHm !== null && pHm !== undefined && pHm >= 0 && pHm <= 14) { g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(pHm), mt); g.lineTo(X(pHm), h - mb); g.stroke(); punto(g, X(pHm), mt, 3.5, col['--ink']); }
  }

  function grafica() {
    const c = $('#grafica');
    if (c.hidden || !sol || sol.modo !== 'valoracion') return;
    const L = lienzo(c); if (!L) return;
    const { g, w, h } = L;
    if (!col['--ink']) colores();
    const ml = 40, mr = 14, mt = 14, mb = 30, Vm = vMax();
    const X = (v) => ml + (v / Vm) * (w - ml - mr), Y = (p) => mt + ((14 - p) / 14) * (h - mt - mb);
    g.fillStyle = col['--line']; g.globalAlpha = 0.5; g.fillRect(ml, Y(sol.ind[2]), w - ml - mr, Y(sol.ind[1]) - Y(sol.ind[2])); g.globalAlpha = 1;
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    for (let p = 0; p <= 14; p += 2) { g.beginPath(); g.moveTo(ml, Y(p)); g.lineTo(w - mr, Y(p)); g.stroke(); texto(g, ml - 6, Y(p), String(p), col['--muted'], 'right'); }
    g.strokeStyle = col['--muted']; g.setLineDash([4, 4]);
    for (const e of sol.Veqs || [sol.Veq]) { g.beginPath(); g.moveTo(X(e), mt); g.lineTo(X(e), h - mb); g.stroke(); }
    g.setLineDash([]);
    if (sol.Veqs) sol.Veqs.forEach((e) => texto(g, X(e), h - 12, `${txt(f(e))} mL`, col['--muted']));
    else texto(g, X(sol.Veq), h - 12, `Veq = ${txt(f(sol.Veq))} mL`, col['--muted']);
    texto(g, X(0), h - 12, '0', col['--muted'], 'left'); texto(g, X(Vm), h - 12, `${txt(f(Vm))} mL`, col['--muted'], 'right');
    texto(g, w - mr, Y(sol.ind[2]) - 8, sol.ind[0], col['--muted'], 'right');
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
    sol.curva.forEach(([v, p], i) => (i ? g.lineTo(X(v), Y(p)) : g.moveTo(X(v), Y(p))));
    g.stroke();
    for (const e of sol.Veqs || [sol.Veq]) punto(g, X(e), Y(sol.ph(e)), 4, col['--ink']);
    if (sol.pHv !== null && sol.v <= Vm) punto(g, X(sol.v), Y(sol.pHv), 5.5, col['--roz']);
    const v = vAnim(tA); punto(g, X(v), Y(sol.ph(v)), 4.5, col['--peso']);
    texto(g, ml + 4, 6, 'pH', col['--muted'], 'left');
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; mueve(dt); dibuja(); grafica(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); grafica(); especies(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); grafica(); especies(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('ph').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.PHApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, pH: sol.pH, Veq: sol.Veq, pHeq: sol.pHeq, pHv: sol.pHv }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();

