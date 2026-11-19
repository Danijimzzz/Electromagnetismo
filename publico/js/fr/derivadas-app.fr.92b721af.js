(() => {
  const { $, esc, copia } = Herramienta;
  const DV = Derivadas, CLAVE = 'derivadas-v1';
  const fH = (x, d = 4) => DV.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const sup = (e) => [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '−' ? '⁻' : c)).join('');
  const txt = (s) => s.replace(/<sup>(.*?)<\/sup>/g, (_, e) => sup(e)).replace(/<[^>]+>/g, '');
  const coma = (v) => String(v).replace('.', ',');
  const MODOS = {
    derivada: { nom: 'Dérivée', campos: [['f', 'f(x) =', ''], ['orden', 'Ordre', '1 a 4'], ['x0', 'En x₀ =', 'facultatif : tangente']] },
    integral: { nom: 'Intégrale', campos: [['f', 'f(x) =', ''], ['a', 'De a =', 'facultatif, accepte −∞'], ['b', 'À b =', 'facultatif, accepte ∞']] },
    limite: { nom: "Limite (L’Hôpital)", campos: [['f', 'f(x) =', ''], ['a', 'Quand x →', 'nombre, ∞ ou −∞']] },
    area: { nom: 'Aire entre deux courbes', campos: [['f', 'f(x) =', ''], ['g', 'g(x) =', ''], ['a', 'De a =', 'facultatif : sinon, entre les points d’intersection'], ['b', 'À b =', 'facultatif']] },
    volumen: { nom: 'Volume de révolution', campos: [['f', 'f(x) =', ''], ['g', 'g(x) =', 'facultatif : bord intérieur'], ['a', 'De a =', 'facultatif'], ['b', 'À b =', 'facultatif'], ['eje', 'Rotation autour de', '']] },
    estudio: { nom: 'Étude complète de f', campos: [['f', 'f(x) =', '']] },
    implicita: { nom: 'Dérivation implicite', campos: [['ec', 'Équation', 'avec x et y'], ['x0', 'En x₀ =', 'facultatif'], ['y0', 'y₀ =', '']] },
    parciales: { nom: 'Dérivées partielles', campos: [['f', 'f(x, y) =', ''], ['x0', 'En x₀ =', 'facultatif'], ['y0', 'y₀ =', '']] },
  };
  const ANCHOS = ['f', 'g', 'ec'];
  const primero = (m) => DV.ejemplos.find((e) => e.sc.modo === m);

  let sc = copia(DV.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS[g.modo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, V = null, anda = false, u = 1;

  function formulario() {
    $('#modo').innerHTML = Object.entries(MODOS).map(([k, m]) => `<option value="${k}"${sc.modo === k ? ' selected' : ''}>${m.nom}</option>`).join('');
    $('#campos').innerHTML = MODOS[sc.modo].campos.map(([k, et, ay]) => k === 'orden'
      ? `<label for="f-orden">${et}</label><select id="f-orden" class="in" data-c="orden">${[1, 2, 3, 4].map((n) => `<option value="${n}"${String(sc.orden) === String(n) ? ' selected' : ''}>${['f′', 'f″', 'f‴', 'f⁽⁴⁾'][n - 1]}</option>`).join('')}</select>`
      : k === 'eje' ? `<label for="f-eje">${et}</label><select id="f-eje" class="in" data-c="eje"><option value="x"${sc.eje !== 'y' ? ' selected' : ''}>l’axe x (disques)</option><option value="y"${sc.eje === 'y' ? ' selected' : ''}>l’axe y (coquilles)</option></select>`
        : `<label for="f-${k}">${et}${ay ? ` <small>(${ay})</small>` : ''}</label><input id="f-${k}" class="in${ANCHOS.includes(k) ? ' larga' : ''}" data-c="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`).join('');
    $('#nota-datos').innerHTML = {
      derivada: 'Écris f avec x : x^2 sin(x), (x^2 + 1)/(x − 1), e^(−x^2), ln(sqrt(x^2 + 1)), x^x… Touche le graphique pour placer la tangente en un autre point.',
      integral: 'Polynômes, racines, sin, cos, e^x, ln, quotients de polynômes et produits : x e^(x^2), x^2 e^x, x ln(x), (3x + 5)/(x^2 + 2x − 3), sin(3x) cos(2x), sqrt(4 − x^2)… Avec a et b on obtient l’intégrale définie ; avec ∞, ou avec une asymptote dans l’intervalle, l’intégrale impropre.',
      limite: "Les formes indéterminées 0/0 et ∞/∞ avec L’Hôpital, et aussi 0·∞, ∞ − ∞, 1^∞, 0^0 et ∞^0 : sin(x)/x en 0, x ln(x) en 0, (1 + 1/x)^x en ∞…",
      area: 'Si tu n’indiques pas a et b, on prend la région entre le premier et le dernier point d’intersection de f et g. Pour l’aire sous une courbe, mets g = 0.',
      volumen: 'Disques (ou rondelles, avec g) tournant autour de l’axe x ; coquilles cylindriques autour de l’axe y (avec x ≥ 0). Sans a ni b, entre les points d’intersection.',
      estudio: 'Domaine, symétrie, intersections, asymptotes, monotonie, extrema, courbure et inflexion, en cherchant entre x = −10 et x = 10.',
      implicita: 'Une équation en x et y, comme x^2 + y^2 = 25 ou x^3 + y^3 = 6xy. Avec un point de la courbe, on obtient la pente et la tangente.',
      parciales: 'Une fonction de x et y : x^2 y + y^3, e^(x y), sin(x) cos(y)… On obtient les dérivées partielles, le gradient au point et les points critiques avec leur nature.',
    }[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.c || t.tagName === 'SELECT') return; sc[t.dataset.c] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName !== 'SELECT') return; sc[t.dataset.c] = t.value; cambia(); });
  $('#modo').addEventListener('change', (e) => { const fx = sc.f; sc = copia(primero(e.target.value).sc); if (fx) sc.f = fx; formulario(); cambia(); });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + Object.entries(MODOS).map(([k, m]) => `<optgroup label="${m.nom}">${DV.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = DV.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; }, de = (xs) => xs[ent(0, xs.length - 1)];
    const k = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));
    const der = [
      () => `${k(nz(-3, 4))}x^${ent(2, 4)} ${de(['sin', 'cos'])}(${k(ent(1, 3))}x)`,
      () => `(${k(nz(-3, 3))}x^2 + ${ent(1, 5)})/(x - ${ent(1, 4)})`,
      () => `e^(${k(nz(-3, 3))}x^2)`,
      () => `ln(${k(ent(1, 3))}x^2 + ${ent(1, 4)})`,
      () => `x^${ent(2, 3)} e^(${nz(-2, 2)}x)`,
      () => `sqrt(${ent(1, 4)}x^2 + ${ent(1, 5)})`,
      () => `arctg(${ent(2, 4)}x)`,
    ];
    const inte = [
      () => [`${nz(-4, 5)}x^${ent(2, 4)} - ${ent(1, 6)}x + ${ent(1, 5)}`, '0', String(ent(1, 3))],
      () => [`x e^(${k(nz(-2, 2))}x^2)`, '0', '1'],
      () => [`x ${de(['e^x', 'sen(x)', 'cos(x)'])}`, '0', String(ent(1, 2))],
      () => [`x^${ent(1, 2)} ln(x)`, '1', String(ent(2, 4))],
      () => { const p = ent(1, 3); let q; do q = ent(-3, 3); while (q === -p || q === 0); return [`${ent(1, 5)}/((x + ${p})(x ${q < 0 ? '-' : '+'} ${Math.abs(q)}))`, String(Math.max(0, -q) + 1), String(Math.max(0, -q) + ent(2, 4))]; },
      () => [`1/(x^2 + ${de([1, 4, 9])})`, '0', String(ent(1, 3))],
      () => [`${de(['sin', 'cos'])}(${ent(1, 3)}x)`, '0', de(['pi/2', 'pi/4', 'pi'])],
    ];
    if (Math.random() < 0.5) sc = { modo: 'derivada', f: de(der)(), orden: String(ent(1, 2)), x0: String(ent(0, 2)) };
    else { const [fx, a, b] = de(inte)(); sc = { modo: 'integral', f: fx, a, b }; }
    try { DV.resolver(sc); } catch (e) { sc = copia(DV.ejemplos[0].sc); sc.x0 = '1'; }
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => ({
    derivada: () => `Dérive <b>f(x) = ${esc(sc.f)}</b>${Number(sc.orden) > 1 ? ` jusqu’à la dérivée ${['', 'première', 'seconde', 'troisième', 'quatrième'][Number(sc.orden)]}` : ''} et donne sa valeur en x = ${esc(sc.x0 || '0')}.`,
    integral: () => `Calcule la primitive de <b>f(x) = ${esc(sc.f)}</b> et l’intégrale définie entre ${esc(sc.a)} et ${esc(sc.b)}.`,
    limite: () => `Calcule <b>lim f(x)</b> quand x → ${esc(sc.a)}, avec f(x) = ${esc(sc.f)}.`,
    area: () => `Calcule l’aire délimitée entre <b>f(x) = ${esc(sc.f)}</b> et <b>g(x) = ${esc(sc.g)}</b>${sc.a || sc.b ? ` entre x = ${esc(sc.a)} et x = ${esc(sc.b)}` : ''}.`,
    volumen: () => `Calcule le volume obtenu en faisant tourner autour de l’axe ${sc.eje === 'y' ? 'y' : 'x'} la région ${sc.g ? `entre f(x) = ${esc(sc.f)} et g(x) = ${esc(sc.g)}` : `sous f(x) = ${esc(sc.f)}`}${sc.a || sc.b ? ` entre x = ${esc(sc.a)} et x = ${esc(sc.b)}` : ''}.`,
    estudio: () => `Fais l’étude complète de <b>f(x) = ${esc(sc.f)}</b> : domaine, asymptotes, monotonie, extrema et courbure.`,
    implicita: () => `Calcule y′ par dérivation implicite dans <b>${esc(sc.ec)}</b>${sc.x0 ? ` et la tangente en (${esc(sc.x0)}, ${esc(sc.y0)})` : ''}.`,
    parciales: () => `Calcule les dérivées partielles de <b>f(x, y) = ${esc(sc.f)}</b> et ses points critiques.`,
  }[sc.modo] || (() => ''))();

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  const prima = (k) => (k <= 3 ? `f${'′'.repeat(k)}` : `f^{(${k})}`);
  function calcula() {
    const err = $('#error');
    try { sol = DV.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.modo === 'derivada') {
      sol.txt.forEach((t, i) => { h += dato(i ? `Dérivée ${['', 'seconde', 'troisième', 'quatrième'][i]}` : 'Dérivée', M(`${prima(i + 1)}(x) = ${t}`), 'ancho'); });
      if (sol.x0 !== undefined) {
        sol.vals.slice(1).forEach((v, i) => { h += dato(`${txt(prima(i + 1).replace(/\^\{\((\d)\)\}/, '⁽$1⁾'))}(${fH(sol.x0)})`, fH(v, 6), 'num'); });
        h += dato('Tangente', M(sol.tangente), 'ancho');
      }
      if (sol.constante) h += dato('Points critiques', 'Aucun : f′ = 0 pour tout x (f est constante)', 'ancho');
      else if (sol.crit.length) h += dato('Points critiques', sol.crit.slice(0, 4).map((q) => `x = ${fH(q.x)}: ${q.tipo}`).join('<br>'), 'ancho');
    } else if (sol.modo === 'integral') {
      h += dato('Primitive', sol.F ? M(`∫ f(x) dx = ${sol.Ftxt} + C`) : 'Non élémentaire (ou je ne sais pas la faire)', 'ancho');
      if (sol.a !== undefined) {
        const lim = (v) => (v === Infinity ? '∞' : v === -Infinity ? '−∞' : fH(v));
        h += dato(`Intégrale de ${lim(sol.a)} à ${lim(sol.b)}`, sol.diverge ? 'diverge' : fH(sol.val, 6), 'num');
        if (sol.impropia) h += dato('Type', sol.diverge ? 'impropre, divergente' : 'impropre, convergente');
        else if (Math.abs(sol.area - Math.abs(sol.val)) > 1e-4 * Math.max(1, sol.area)) h += dato('Aire délimitée', fH(sol.area, 6));
      }
    } else if (sol.modo === 'limite') {
      h += dato('Limite', M(`lim_{x → ${sol.a === Infinity ? '∞' : sol.a === -Infinity ? '−∞' : DV.f(sol.a)}} f(x) = ${sol.txt === 'no existe' ? '"n’existe pas"' : sol.txt}`), 'ancho');
      if (sol.existe && isFinite(sol.val)) h += dato('Valeur', fH(sol.val, 6), 'num');
      h += dato("Nombre d’utilisations de L’Hôpital", String(sol.lhopital));
    } else if (sol.modo === 'area' || sol.modo === 'volumen') {
      h += dato(sol.modo === 'area' ? 'Aire' : 'Volume', M(`${sol.modo === 'area' ? 'A' : 'V'} = ${sol.txt}`), 'ancho');
      h += dato('Valeur', fH(sol.val, 6), 'num') + dato('Entre', `x = ${fH(sol.a)} y x = ${fH(sol.b)}`);
    } else if (sol.modo === 'estudio') {
      h += dato('Domaine', M(`"Dom" f = ${sol.dom}`), 'ancho');
      h += dato('Symétrie', sol.par ? 'par' : sol.impar ? 'impar' : 'ninguna');
      h += dato('Asymptotes', sol.asTxt.map(M).join('<br>') || 'ninguna');
      h += dato('Extrema', sol.extremos.map((q) => `${q.tipo === 'máximo' ? 'maximum' : 'minimum'} en x = ${fH(q.x)}`).join('<br>') || 'ninguno');
      h += dato('Inflexion', sol.infl.map((q) => `x = ${fH(q.x)}`).join('<br>') || 'ninguna');
    } else if (sol.modo === 'implicita') {
      h += dato('Dérivée', M(`y′ = ${sol.txt}`), 'ancho');
      if (sol.x0 !== undefined) h += (sol.m !== undefined ? dato(`y′ en (${fH(sol.x0)}, ${fH(sol.y0)})`, fH(sol.m, 6), 'num') : '') + dato('Tangente', M(sol.tangente), 'ancho');
    } else if (sol.modo === 'parciales') {
      const n = ['f_{x}', 'f_{y}', 'f_{xx}', 'f_{yy}', 'f_{xy}'];
      h += dato('Premières', M(`${n[0]} = ${sol.txt[0]}`) + '<br>' + M(`${n[1]} = ${sol.txt[1]}`), 'ancho');
      h += dato('Secondes', [2, 3, 4].map((i) => M(`${n[i]} = ${sol.txt[i]}`)).join(' &ensp; '), 'ancho');
      if (sol.punto) h += dato(`Gradient en (${fH(sol.punto.x0)}, ${fH(sol.punto.y0)})`, `(${fH(sol.punto.gx)}, ${fH(sol.punto.gy)})`);
      h += dato('Points critiques', sol.crit.map((q) => `(${fH(q.x)}, ${fH(q.y)}): ${q.tipo}`).join('<br>') || 'aucun près de l’origine', 'ancho');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').innerHTML = {
      derivada: () => `En couleur, f(x) ; en bleu, f′(x)${sol.x0 !== undefined ? `; la droite est la tangente en x₀ = ${fH(sol.x0)}` : ''}. Avec ▶ Animer, la tangente parcourt la courbe et sa pente est la valeur de f′. Touche le graphique pour placer x₀ ailleurs.`,
      integral: () => `En couleur, f(x)${sol.a !== undefined ? ', avec l’aire entre a et b (au-dessus de l’axe elle s’ajoute, au-dessous elle se retranche)' : ''}${sol.F && !sol.impropia ? '; en bleu, la primitive F(x)' : ''}. Avec ▶ Animer, l’aire se remplit peu à peu.`,
      limite: () => 'En couleur, f(x) près du point ; le cercle vide est la valeur de la limite. Avec ▶ Animer, un point s’approche le long de la courbe.',
      area: () => 'En couleur, f(x) ; en bleu, g(x) ; en grisé, la région dont l’aire est calculée. Avec ▶ Animer, elle se remplit peu à peu.',
      volumen: () => `En couleur, f(x)${sol.hayG ? '; en bleu, g(x)' : ''} ; en grisé, la région qui tourne, et en gris son reflet de l’autre côté de l’axe ${sol.eje}, qui donne la silhouette du solide.`,
      estudio: () => 'En couleur, f(x) ; en pointillés, les asymptotes ; les cercles sont les extrema et les carrés, les points d’inflexion.',
      implicita: () => 'En couleur, la courbe de l’équation ; la droite est la tangente au point.',
      parciales: () => 'Courbes de niveau de f (plus foncées là où f est plus grande) ; les points sont les points critiques et la flèche, le gradient au point.',
    }[sol.modo]();
    V = null; if (!anda) u = 1; dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); }
  const marcas = Herramienta.marcas;
  const lienzo = (s) => Herramienta.lienzo(s);
  const rango = (vs) => {
    const ok = vs.filter((v) => isFinite(v)).sort((a, b) => a - b);
    if (!ok.length) return [-1, 1];
    let a = ok[Math.floor(ok.length * 0.04)], b = ok[Math.ceil(ok.length * 0.96) - 1];
    a = Math.min(a, 0); b = Math.max(b, 0);
    if (b - a < 1e-9) { a -= 1; b += 1; }
    const p = (b - a) * 0.12; return [a - p, b + p];
  };
  function tramo() {
    let lo = Math.min(sol.a, sol.b), hi = Math.max(sol.a, sol.b);
    if (!isFinite(lo) && !isFinite(hi)) { lo = -6; hi = 6; } else if (!isFinite(lo)) lo = hi - 8; else if (!isFinite(hi)) hi = lo + 8;
    return [lo, hi];
  }
  function ventana() {
    let x1, x2;
    if (sol.modo === 'implicita' || sol.modo === 'parciales') return plano2();
    if (sol.modo === 'derivada') { const c = sol.x0 ?? 0; x1 = c - 4; x2 = c + 4; }
    else if (sol.modo === 'limite') { if (isFinite(sol.a)) { x1 = sol.a - 3; x2 = sol.a + 3; } else if (sol.a > 0) { x1 = 0; x2 = 40; } else { x1 = -40; x2 = 0; } }
    else if (sol.modo === 'estudio') {
      const xs0 = [...sol.asV, ...sol.extremos.map((q) => q.x), ...sol.infl.map((q) => q.x), ...sol.cortesX].filter((x) => Math.abs(x) < 50);
      const lo = Math.min(-2, ...xs0), hi = Math.max(2, ...xs0), m = (hi - lo) * 0.3 + 1; x1 = lo - m; x2 = hi + m;
    } else if (sol.a !== undefined) {
      const [lo, hi] = tramo(), m = (hi - lo) * 0.35 + 0.3; x1 = lo - m; x2 = hi + m;
      if (sol.modo === 'volumen' && sol.eje === 'y') x1 = Math.min(x1, -hi - m);
    } else { x1 = -4; x2 = 4; }
    const xs = [], ys = [], y2 = [];
    const segunda = (x) => (sol.modo === 'derivada' ? sol.d(1)(x) : sol.modo === 'area' || (sol.modo === 'volumen' && sol.hayG) ? sol.g(x) : sol.modo === 'integral' && sol.Ff && !sol.impropia ? sol.Ff(x) - (sol.a !== undefined ? sol.Ff(sol.a) : 0) : NaN);
    for (let i = 0; i <= 900; i++) {
      const x = x1 + ((x2 - x1) * i) / 900;
      xs.push(x); ys.push(sol.f(x)); y2.push(segunda(x));
    }
    const espejo = sol.modo === 'volumen' && sol.eje === 'x' ? ys.map((y) => -y) : [];
    const [ya, yb] = rango([...ys, ...ys, ...y2, ...espejo, ...(sol.modo === 'limite' && isFinite(sol.val) ? [sol.val] : [])]);
    return { x1, x2, y1: ya, y2: yb, xs, ys, y2s: y2 };
  }
  function plano2() {
    const c = sol.modo === 'implicita' ? [sol.x0 ?? 0, sol.y0 ?? 0] : sol.punto ? [sol.punto.x0, sol.punto.y0] : [0, 0];
    const pts = sol.modo === 'parciales' ? sol.crit.map((q) => [q.x, q.y]) : [];
    const r = Math.max(4, ...pts.map(([x, y]) => Math.max(Math.abs(x - c[0]), Math.abs(y - c[1])) * 1.4));
    const cv = $('#grafica'), asp = (cv.clientWidth - mL - mR) / Math.max(1, cv.clientHeight - mT - mB);
    return { x1: c[0] - r * asp, x2: c[0] + r * asp, y1: c[1] - r, y2: c[1] + r, dos: true };
  }
  function contorno(g, F, X, Y, nivel, nx = 140) {
    const ny = Math.round((nx * (V.y2 - V.y1)) / (V.x2 - V.x1)), dx = (V.x2 - V.x1) / nx, dy = (V.y2 - V.y1) / ny, v = [];
    for (let j = 0; j <= ny; j++) { v.push([]); for (let i = 0; i <= nx; i++) v[j].push(F(V.x1 + i * dx, V.y1 + j * dy) - nivel); }
    g.beginPath();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const q = [v[j][i], v[j][i + 1], v[j + 1][i + 1], v[j + 1][i]];
      if (!q.every(isFinite)) continue;
      const P = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], cruces = [];
      for (let k = 0; k < 4; k++) { const a = q[k], b = q[(k + 1) % 4]; if ((a < 0) !== (b < 0)) { const t = a / (a - b), [x0, y0] = P[k], [x1, y1] = P[(k + 1) % 4]; cruces.push([V.x1 + (x0 + t * (x1 - x0)) * dx, V.y1 + (y0 + t * (y1 - y0)) * dy]); } }
      if (Math.max(...q.map(Math.abs)) > 1e3 * (Math.abs(nivel) + 1)) continue;
      for (let k = 0; k + 1 < cruces.length; k += 2) { g.moveTo(X(cruces[k][0]), Y(cruces[k][1])); g.lineTo(X(cruces[k + 1][0]), Y(cruces[k + 1][1])); }
    }
    g.stroke();
  }
  const mL = 44, mR = 12, mT = 12, mB = 26;
  let trans = null;
  function ejes(g, w, h, X, Y) {
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(V.x1, V.x2, Math.max(4, Math.round(w / 80)))) { g.beginPath(); g.moveTo(X(v), mT); g.lineTo(X(v), h - mB); g.stroke(); g.fillText(txt(fH(v, 3)), X(v), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(V.y1, V.y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(txt(fH(v, 3)), mL - 5, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath();
    if (V.y1 < 0 && V.y2 > 0) { g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); }
    if (V.x1 < 0 && V.x2 > 0) { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); }
    g.stroke();
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('x', w - mR - 2, h - mB - 3);
  }
  const linea = (g, xs, ys, X, Y, h) => { g.beginPath(); let dentro = false, py0 = 0; xs.forEach((x, i) => { const y = ys[i]; if (!isFinite(y)) { dentro = false; return; } const px = X(x), py = Y(y); if (dentro && Math.abs(py - py0) < h * 1.5) g.lineTo(px, py); else g.moveTo(px, py); dentro = true; py0 = py; }); g.stroke(); };
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    trans = null;
    if (!sol) return;
    if (!col['--ink']) colores();
    if (!V) V = ventana();
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    trans = (px) => V.x1 + ((px - mL) / (w - mL - mR)) * (V.x2 - V.x1);
    ejes(g, w, h, X, Y);
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    if (V.dos) { dibuja2(g, X, Y); g.restore(); return; }
    if ((sol.modo === 'area' || sol.modo === 'volumen') && sol.a !== undefined) {
      const lo = sol.a, hi = sol.a + (sol.b - sol.a) * u, n = 300, gg = (x) => (sol.modo === 'area' || sol.hayG ? sol.g(x) : 0);
      const banda = (sx, sy, alfa, c) => { g.fillStyle = col[c]; g.globalAlpha = alfa; g.beginPath(); for (let i = 0; i <= n; i++) { const x = lo + ((hi - lo) * i) / n; g.lineTo(X(sx * x), Y(sy * sol.f(x))); } for (let i = n; i >= 0; i--) { const x = lo + ((hi - lo) * i) / n; g.lineTo(X(sx * x), Y(sy * gg(x))); } g.closePath(); g.fill(); g.globalAlpha = 1; };
      banda(1, 1, 0.25, '--accent');
      if (sol.modo === 'volumen') {
        banda(sol.eje === 'y' ? -1 : 1, sol.eje === 'x' ? -1 : 1, 0.12, '--muted');
        g.strokeStyle = col['--ink']; g.lineWidth = 2; g.setLineDash([8, 5]); g.beginPath();
        if (sol.eje === 'x') { g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); } else { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); }
        g.stroke(); g.setLineDash([]);
      }
    }
    if (sol.modo === 'estudio') {
      g.strokeStyle = col['--muted']; g.lineWidth = 1.3; g.setLineDash([6, 5]); g.beginPath();
      for (const c of sol.asV) { g.moveTo(X(c), mT); g.lineTo(X(c), h - mB); }
      for (const q of sol.asH) { const xa = q.s > 0 ? Math.max(V.x1, 0) : V.x1, xb = q.s > 0 ? V.x2 : Math.min(V.x2, 0); g.moveTo(X(xa), Y(q.y)); g.lineTo(X(xb), Y(q.y)); }
      for (const q of sol.asO) { g.moveTo(X(V.x1), Y(q.m * V.x1 + q.n)); g.lineTo(X(V.x2), Y(q.m * V.x2 + q.n)); }
      g.stroke(); g.setLineDash([]);
    }
    if (sol.modo === 'integral' && sol.a !== undefined) {
      const [lo, hi] = tramo(), fin = lo + (hi - lo) * u, n = 300;
      for (const [sg, c] of [[1, '--z1'], [-1, '--z2']]) {
        g.fillStyle = col[c]; g.globalAlpha = 0.22; g.beginPath(); g.moveTo(X(lo), Y(0));
        for (let i = 0; i <= n; i++) { const x = lo + ((fin - lo) * i) / n, y = sol.f(x); g.lineTo(X(x), Y(isFinite(y) && sg * y > 0 ? y : 0)); }
        g.lineTo(X(fin), Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1;
      }
      g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath();
      for (const x of [sol.a, sol.b]) if (isFinite(x)) { g.moveTo(X(x), mT); g.lineTo(X(x), h - mB); }
      g.stroke(); g.setLineDash([]);
    }
    if (V.y2s.some(isFinite)) { g.strokeStyle = col['--z1']; g.lineWidth = 1.8; g.setLineDash(sol.modo === 'integral' ? [6, 4] : []); linea(g, V.xs, V.y2s, X, Y, h); g.setLineDash([]); }
    g.strokeStyle = col['--accent']; g.lineWidth = 2.6; linea(g, V.xs, V.ys, X, Y, h);
    if (sol.modo === 'derivada') {
      const x0 = anda || sol.x0 === undefined ? V.x1 + (V.x2 - V.x1) * (anda ? u : 0.5) : sol.x0, y0 = sol.f(x0), m = sol.d(1)(x0);
      if (isFinite(y0) && isFinite(m)) {
        const L = (V.x2 - V.x1) * 0.28;
        g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(x0 - L), Y(y0 - m * L)); g.lineTo(X(x0 + L), Y(y0 + m * L)); g.stroke();
        g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(x0), Y(y0), 5, 0, 2 * Math.PI); g.fill();
        g.fillStyle = col['--z1']; g.beginPath(); g.arc(X(x0), Y(m), 4, 0, 2 * Math.PI); g.fill();
        g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--ink']; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText(`pendiente ${txt(fH(m, 3))}`, mL + 8, mT + 6);
      }
      for (const q of sol.crit) { g.fillStyle = col['--panel']; g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.arc(X(q.x), Y(q.y), 4, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    }
    if (sol.modo === 'estudio') {
      g.fillStyle = col['--panel']; g.strokeStyle = col['--ink']; g.lineWidth = 1.5;
      for (const q of sol.extremos) { g.beginPath(); g.arc(X(q.x), Y(q.y), 4.5, 0, 2 * Math.PI); g.fill(); g.stroke(); }
      for (const q of sol.infl) { g.beginPath(); g.rect(X(q.x) - 4, Y(q.y) - 4, 8, 8); g.fill(); g.stroke(); }
    }
    if (sol.modo === 'limite' && isFinite(sol.val)) {
      const xa = isFinite(sol.a) ? sol.a : sol.a > 0 ? V.x2 : V.x1;
      if (anda) { const x = isFinite(sol.a) ? sol.a + (V.x2 - sol.a) * (1 - u) * 0.98 : sol.a > 0 ? V.x1 + (V.x2 - V.x1) * u : V.x2 - (V.x2 - V.x1) * u; const y = sol.f(x); if (isFinite(y)) { g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(x), Y(y), 5, 0, 2 * Math.PI); g.fill(); } }
      if (isFinite(sol.a)) { g.fillStyle = col['--panel']; g.strokeStyle = col['--accent']; g.lineWidth = 2; g.beginPath(); g.arc(X(xa), Y(sol.val), 5, 0, 2 * Math.PI); g.fill(); g.stroke(); }
      else { g.strokeStyle = col['--muted']; g.setLineDash([6, 5]); g.lineWidth = 1.3; g.beginPath(); g.moveTo(X(V.x1), Y(sol.val)); g.lineTo(X(V.x2), Y(sol.val)); g.stroke(); g.setLineDash([]); }
    }
    g.restore();
    g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'top';
    const otra = sol.modo === 'derivada' ? 'f′(x)' : sol.modo === 'area' || (sol.modo === 'volumen' && sol.hayG) ? 'g(x)' : sol.modo === 'integral' && sol.F && !sol.impropia ? 'F(x)' : '';
    g.fillStyle = col['--accent']; g.fillText('f(x)', w - mR - (otra ? 52 : 6), mT + 4);
    if (otra) { g.fillStyle = col['--z1']; g.fillText(otra, w - mR - 6, mT + 4); }
  }
  function dibuja2(g, X, Y) {
    if (sol.modo === 'implicita') {
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; contorno(g, sol.Fv, X, Y, 0, 220);
      if (sol.x0 !== undefined) {
        const L = (V.x2 - V.x1) * 0.2;
        g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath();
        if (sol.vertical) { g.moveTo(X(sol.x0), Y(sol.y0 - L)); g.lineTo(X(sol.x0), Y(sol.y0 + L)); } else { g.moveTo(X(sol.x0 - L), Y(sol.y0 - sol.m * L)); g.lineTo(X(sol.x0 + L), Y(sol.y0 + sol.m * L)); }
        g.stroke(); g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(sol.x0), Y(sol.y0), 5, 0, 2 * Math.PI); g.fill();
      }
      return;
    }
    const vs = [];
    for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) { const v = sol.fv(V.x1 + ((V.x2 - V.x1) * i) / 30, V.y1 + ((V.y2 - V.y1) * j) / 30); if (isFinite(v)) vs.push(v); }
    vs.sort((a, b) => a - b);
    const n = 12;
    for (let k = 1; k < n; k++) {
      const nivel = vs[Math.floor((vs.length * k) / n)];
      g.strokeStyle = col['--accent']; g.globalAlpha = 0.25 + (0.7 * k) / n; g.lineWidth = 1.4; contorno(g, sol.fv, X, Y, nivel);
    }
    g.globalAlpha = 1;
    for (const q of sol.crit) { g.fillStyle = q.tipo === 'point selle' ? col['--z2'] : col['--z1']; g.beginPath(); g.arc(X(q.x), Y(q.y), 5, 0, 2 * Math.PI); g.fill(); }
    if (sol.punto) {
      const { x0, y0, gx, gy } = sol.punto, m = Math.hypot(gx, gy), L = (V.x2 - V.x1) * 0.12;
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(x0), Y(y0), 4, 0, 2 * Math.PI); g.fill();
      if (m > 1e-12) {
        const ux = gx / m, uy = gy / m, xb = X(x0 + ux * L), yb = Y(y0 + uy * L), an = Math.atan2(yb - Y(y0), xb - X(x0));
        g.strokeStyle = col['--ink']; g.lineWidth = 2; g.beginPath(); g.moveTo(X(x0), Y(y0)); g.lineTo(xb, yb); g.stroke();
        g.beginPath(); g.moveTo(xb, yb); g.lineTo(xb - 9 * Math.cos(an - 0.4), yb - 9 * Math.sin(an - 0.4)); g.lineTo(xb - 9 * Math.cos(an + 0.4), yb - 9 * Math.sin(an + 0.4)); g.closePath(); g.fillStyle = col['--ink']; g.fill();
      }
    }
  }
  $('#grafica').addEventListener('click', (e) => {
    if (!sol || !trans || sol.modo !== 'derivada') return;
    const r = e.target.getBoundingClientRect(), x = trans(e.clientX - r.left);
    sc.x0 = coma(+x.toPrecision(3)); formulario(); cambia();
  });
  $('#animar').addEventListener('click', () => (anda ? para() : arranca()));
  function arranca() { if (!sol) return; anda = true; u = 0; $('#animar').textContent = '⏸ Arrêter'; }
  function para() { anda = false; u = 1; $('#animar').textContent = '▶ Animer'; dibuja(); }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { u += dt / (sol.modo === 'derivada' || sol.modo === 'limite' ? 6 : 3); if (u >= 1) { u = 1; anda = false; $('#animar').textContent = '▶ Animer'; } dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('derivadas').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  Herramienta.exportar('#grafica', { nombre: 'derivadas-e-integrales', titulo: 'Dérivées et intégrales', etiqueta: 'la fonction' });
  window.DerivadasApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, txt: sol.txt ?? sol.Ftxt, val: sol.val, m: sol.m, crit: sol.crit?.map((q) => q.tipo) }, estado: () => copia(sc) };
})();

