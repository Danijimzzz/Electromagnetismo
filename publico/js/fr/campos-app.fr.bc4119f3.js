(() => {
  const { $, esc, copia, txt } = Herramienta;
  const C = Campos, CLAVE = 'campos-v1';
  const fH = (x, d = 4) => C.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const coma = (v) => String(v).replace('.', ',');
  const MODOS = [['curvilineas', 'Cylindriques et sphériques : ∇f, ∇·F et ∇×F'], ['escalar', 'Gradient d’un champ scalaire f'], ['vectorial', 'Divergence, rotationnel et potentiel de F'], ['linea', 'Intégrale curviligne (travail)'], ['masa', 'Intégrale de f le long d’une courbe (∫ f ds)'], ['green', 'Théorème de Green'], ['superficie', 'Flux à travers une surface et Stokes'], ['gauss', 'Théorème de la divergence (Gauss)']];
  const REGION = { circulo: { cx: '0', cy: '0', rad: '1' }, rectangulo: { x1: '0', x2: '2', y1: '0', y2: '1' }, poligono: { vertices: '0 0; 2 0; 0 1' }, curvas: { g1: 'x^2', g2: 'x', a: '0', b: '1' } };
  const SOLIDO = { caja: { x1: '0', x2: '1', y1: '0', y2: '1', z1: '0', z2: '1' }, esfera: { cx: '0', cy: '0', cz: '0', rad: '1' }, cilindro: { cx: '0', cy: '0', rad: '1', z1: '0', z2: '2' } };
  const CURVA = { param: { cx: 'cos t', cy: 'sin t', cz: '', a: '0', b: 'π' }, poligonal: { vertices: '0 0; 1 0; 0 1', cierra: 'si' } };
  const D3 = ['superficie', 'gauss'];
  const SIS = Object.fromEntries(C.ejemplos.filter((e) => e.sc.modo === 'curvilineas' && ['cil-radial', 'esf-carga'].includes(e.clave)).map((e) => [e.sc.sis, e.sc]));

  let sc = copia(C.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, V = null, trans = null, anda = true, u = 0, giro = 0, parts = [], fondo = null, az = 0.7;

  const fila = (k, nom, ay = '', larga = false) => `<label for="f-${k}">${nom}${ay ? ` <small>${ay}</small>` : ''}</label><input id="f-${k}" class="in${larga ? ' larga' : ''}" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const campoF = (conR = true) => sep('Champ F = (P, Q, R)') + fila('P', 'P', 'fonction de x, y, z', true) + fila('Q', 'Q', '', true) + (conR ? fila('R', 'R', D3.includes(sc.modo) ? '' : 'vide dans le plan', true) : '');
  const punto = () => sep('Point') + fila('x0', 'x₀') + fila('y0', 'y₀') + fila('z0', 'z₀', 's’il y a z');
  const curvaF = () => sep('Courbe') + elige('curva', 'Type', [['param', 'Paramétrique r(t)'], ['poligonal', 'Ligne brisée (segments)']]) + (sc.curva === 'poligonal'
    ? fila('vertices', 'Sommets', 'x y (z); …', true) + elige('cierra', 'Revenir au premier', [['si', 'Oui (fermée)'], ['no', 'No']])
    : fila('cx', 'x(t)', '', true) + fila('cy', 'y(t)', '', true) + fila('cz', 'z(t)', 'vide dans le plan', true) + fila('a', 't initial') + fila('b', 't final'));
  const NOTAS = {
    curvilineas: 'Cylindriques : ρ → r, φ → p. Sphériques : r → r, θ → t (angle avec l’axe z, de 0 à π), φ → p. Écris f et les composantes du champ dans la base (e_ρ, e_φ, e_z) ou (e_r, e_θ, e_φ), avec sin, cos, ln, π… ; laisse vide celle que tu n’utilises pas.',
    escalar: 'Écris f avec x, y (et z si tu veux) : x^2 + y^2, x y z, e^x sin y… La direction u est facultative et n’a pas besoin d’être unitaire.',
    vectorial: 'Écris les composantes avec x, y, z. Si R est vide et qu’il n’y a pas de z, le champ est plan. Touche le graphe pour déplacer le point.',
    linea: 'La courbe r(t) = (x(t), y(t), z(t)) va de t initial à t final ; par exemple cos t, sin t avec t de 0 à 2π. Une ligne brisée s’écrit avec ses sommets : 0 0; 1 0; 1 1 (séparés par « ; », décimales avec un point).',
    masa: 'f peut être la densité du fil (pour la masse et le centre de masse) ou n’importe quelle fonction ; avec f = 1 on obtient la longueur. Une ligne brisée s’écrit avec ses sommets : 0 0; 1 0; 1 1.',
    green: 'La courbe est le bord de la région, parcouru dans le sens trigonométrique. Un polygone s’écrit avec ses sommets (0 0; 2 0; 0 1) et la région entre des courbes, avec celle du bas et celle du haut. Avec un cercle, touche le graphe pour déplacer son centre.',
    superficie: 'La surface est r(u, v) avec u et v dans un rectangle ; par exemple la sphère unité est (sin u cos v, sin u sin v, cos u) avec u de 0 à π et v de 0 à 2π. La normale est r_u × r_v.',
    gauss: 'Le flux se calcule face par face avec la normale sortante et se compare à l’intégrale triple de la divergence. Le cylindre a un axe vertical.',
  };
  function formulario() {
    let h = elige('modo', 'Que calculer', MODOS);
    if (sc.modo === 'curvilineas') {
      const cil = sc.sis === 'cil', n = cil ? ['ρ', 'φ', 'z'] : ['r', 'θ', 'φ'], c = cil ? ['F_ρ', 'F_φ', 'F_z'] : ['F_r', 'F_θ', 'F_φ'], v = cil ? 'r, p, z' : 'r, t, p';
      h += elige('sis', 'Système', [['cil', 'Cylindriques (ρ, φ, z)'], ['esf', 'Sphériques (r, θ, φ)']]) + sep('Champ scalaire') + fila('f', 'f =', 'variables ' + v + ' (opcional)', true)
        + sep('Champ vectoriel') + fila('A', c[0], 'composante selon e_' + n[0], true) + fila('B', c[1], 'composante selon e_' + n[1], true) + fila('C', c[2], 'composante selon e_' + n[2], true)
        + sep('Point') + fila('p1', n[0] + ' =') + fila('p2', n[1] + ' =', 'radians : π/3') + fila('p3', n[2] + ' =', 'radians si c’est φ');
    } else if (sc.modo === 'escalar') h += fila('f', 'f(x, y, z) =', '', true) + punto() + fila('u', 'Direction u', '(facultatif) 1, 2');
    else if (sc.modo === 'vectorial') h += campoF() + punto();
    else if (sc.modo === 'linea' || sc.modo === 'masa') h += (sc.modo === 'linea' ? campoF() : sep('Champ scalaire') + fila('f', 'f(x, y, z) =', 'densidad', true)) + curvaF();
    else if (sc.modo === 'superficie') h += campoF() + sep('Surface r(u, v)') + fila('sx', 'x(u, v)', '', true) + fila('sy', 'y(u, v)', '', true) + fila('sz', 'z(u, v)', '', true) + fila('u1', 'u minimal') + fila('u2', 'u maximal') + fila('v1', 'v minimal') + fila('v2', 'v maximal');
    else if (sc.modo === 'gauss') {
      h += campoF() + sep('Solide') + elige('solido', 'Forme', [['caja', 'Boîte'], ['esfera', 'Sphère'], ['cilindro', 'Cylindre']]);
      h += sc.solido === 'esfera' ? fila('cx', 'Centre x') + fila('cy', 'Centre y') + fila('cz', 'Centre z') + fila('rad', 'Rayon')
        : sc.solido === 'cilindro' ? fila('cx', 'Axe : x') + fila('cy', 'Axe : y') + fila('rad', 'Rayon') + fila('z1', 'z minimale') + fila('z2', 'z maximale')
          : fila('x1', 'x minimale') + fila('x2', 'x maximale') + fila('y1', 'y minimale') + fila('y2', 'y maximale') + fila('z1', 'z minimale') + fila('z2', 'z maximale');
    } else {
      h += sep('Champ F = (P, Q)') + fila('P', 'P', 'fonction de x et y', true) + fila('Q', 'Q', '', true) + sep('Région') + elige('region', 'Forme', [['circulo', 'Cercle'], ['rectangulo', 'Rectangle'], ['poligono', 'Triangle ou polygone'], ['curvas', 'Entre deux courbes']]);
      h += sc.region === 'rectangulo' ? fila('x1', 'x minimale') + fila('x2', 'x maximale') + fila('y1', 'y minimale') + fila('y2', 'y maximale')
        : sc.region === 'poligono' ? fila('vertices', 'Sommets', 'x y; x y; …', true)
          : sc.region === 'curvas' ? fila('g1', 'En bas : y =', 'fonction de x', true) + fila('g2', 'En haut : y =', '', true) + fila('a', 'x initial') + fila('b', 'x final')
            : fila('cx', 'Centre x') + fila('cy', 'Centre y') + fila('rad', 'Rayon');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(C.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { sc[k] = t.value; Object.assign(sc, ({ region: REGION, solido: SOLIDO, curva: CURVA, sis: SIS }[k] || {})[t.value] || {}); }
    formulario(); cambia();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${C.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; };
    const k = (n, v) => `${n < 0 ? '-' : ''}${Math.abs(n) === 1 ? '' : Math.abs(n)}${v}`;
    const mas = (a, b) => `${a} ${b.startsWith('-') ? '- ' + b.slice(1) : '+ ' + b}`;
    const tipos = [
      () => ({ modo: 'escalar', f: mas(k(nz(-3, 3), 'x^2'), k(nz(-3, 3), 'y^2')), x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: '', u: `${nz(-2, 2)}, ${ent(-2, 2)}` }),
      () => ({ modo: 'escalar', f: mas(k(nz(-3, 3), 'x y'), k(nz(-3, 3), 'z^2')), x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: String(nz(-2, 2)), u: `${ent(0, 2)}, ${nz(-2, 2)}, ${ent(0, 2)}` }),
      () => ({ modo: 'vectorial', P: mas(k(nz(-2, 2), 'x'), k(nz(-2, 2), 'y')), Q: mas(k(nz(-2, 2), 'x'), k(nz(-2, 2), 'y')), R: '', x0: String(ent(-2, 2)), y0: String(ent(-2, 2)), z0: '' }),
      () => ({ modo: 'vectorial', P: k(nz(-2, 2), 'y z'), Q: k(nz(-2, 2), 'x z'), R: k(nz(-2, 2), 'x y'), x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: String(nz(-2, 2)) }),
      () => { const m = nz(-3, 3); return { modo: 'linea', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x^2'), R: '', cx: 't', cy: k(m, 't'), cz: '', a: '0', b: String(ent(1, 2)) }; },
      () => ({ modo: 'linea', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), R: '', cx: `${ent(1, 3)} cos t`.replace(/^1 /, ''), cy: `${ent(1, 3)} sin t`.replace(/^1 /, ''), cz: '', a: '0', b: ['π/2', 'π', '2π'][ent(0, 2)] }),
      () => ({ modo: 'green', P: k(nz(-3, 3), 'y'), Q: k(nz(-3, 3), 'x'), region: 'circulo', cx: '0', cy: '0', rad: String(ent(1, 3)) }),
      () => { const x2 = ent(1, 3), y2 = ent(1, 3); return { modo: 'green', P: k(nz(-2, 2), 'x y'), Q: k(nz(-2, 2), 'x^2'), region: 'rectangulo', x1: '0', x2: String(x2), y1: '0', y2: String(y2) }; },
      () => { const a = nz(1, 2), b = nz(-2, 2); return { modo: 'vectorial', P: mas(k(2 * a, 'x y'), String(nz(1, 3))), Q: mas(k(a, 'x^2'), k(3 * b, 'y^2')), R: '', x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: '' }; },
      () => ({ modo: 'linea', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), R: '', curva: 'poligonal', vertices: `0 0; ${ent(1, 3)} 0; 0 ${ent(1, 3)}`, cierra: 'si' }),
      () => ({ modo: 'masa', f: ['1', 'x', 'y', 'x + y', 'x^2'][ent(0, 4)], curva: 'param', cx: `${ent(1, 3)} cos t`.replace(/^1 /, ''), cy: `${ent(1, 3)} sin t`.replace(/^1 /, ''), cz: '', a: '0', b: ['π/2', 'π'][ent(0, 1)] }),
      () => ({ modo: 'green', P: k(nz(-3, 3), 'y'), Q: k(nz(-3, 3), 'x'), region: 'poligono', vertices: `0 0; ${ent(1, 4)} 0; ${ent(0, 2)} ${ent(1, 3)}` }),
      () => ({ modo: 'green', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), region: 'curvas', g1: `x^${ent(2, 3)}`, g2: 'x', a: '0', b: '1' }),
      () => ({ modo: 'superficie', P: k(nz(-2, 2), 'x'), Q: k(nz(-2, 2), 'y'), R: k(nz(-2, 2), 'z'), sx: 'u', sy: 'v', sz: String(ent(1, 3)), u1: '0', u2: String(ent(1, 3)), v1: '0', v2: String(ent(1, 3)) }),
      () => { const R = ent(1, 3); return { modo: 'superficie', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), R: '0', sx: `${R} sin u cos v`.replace(/^1 /, ''), sy: `${R} sin u sin v`.replace(/^1 /, ''), sz: `${R} cos u`.replace(/^1 /, ''), u1: '0', u2: 'π/2', v1: '0', v2: '2π' }; },
      () => ({ modo: 'gauss', P: k(nz(-2, 2), 'x'), Q: k(nz(-2, 2), 'y'), R: k(nz(-2, 2), 'z'), solido: 'caja', x1: '0', x2: String(ent(1, 3)), y1: '0', y2: String(ent(1, 3)), z1: '0', z2: String(ent(1, 3)) }),
      () => ({ modo: 'gauss', P: k(nz(-2, 2), 'x'), Q: k(nz(-2, 2), 'y'), R: k(nz(-2, 2), 'z'), solido: ['esfera', 'cilindro'][ent(0, 1)], cx: '0', cy: '0', cz: '0', rad: String(ent(1, 2)), z1: '0', z2: String(ent(1, 3)) }),
    ];
    sc = tipos[ent(0, tipos.length - 1)]();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const F = () => `F = (${esc(sc.P || '0')}, ${esc(sc.Q || '0')}${sc.R ? `, ${esc(sc.R)}` : ''})`;
    const P = () => `(${esc(sc.x0)}, ${esc(sc.y0)}${sc.z0 ? `, ${esc(sc.z0)}` : ''})`;
    if (sc.modo === 'curvilineas') return `En coordonnées ${sc.sis === 'cil' ? 'cylindriques' : 'sphériques'}, calcule ${sc.f ? `le gradient et le laplacien de <b>f = ${esc(sc.f)}</b>` : ''}${sc.f && (sc.A || sc.B || sc.C) ? ' et ' : ''}${sc.A || sc.B || sc.C ? `la divergence et le rotationnel de <b>F = (${esc(sc.A || '0')}, ${esc(sc.B || '0')}, ${esc(sc.C || '0')})</b>` : ''} au point (${esc(sc.p1)}, ${esc(sc.p2)}, ${esc(sc.p3)}).`;
    if (sc.modo === 'escalar') return `Calcule le gradient de <b>f = ${esc(sc.f)}</b> au point ${P()}${sc.u ? ` et la dérivée directionnelle dans la direction (${esc(sc.u)})` : ''}, ainsi que son laplacien.`;
    if (sc.modo === 'vectorial') return `Calcule la divergence et le rotationnel de <b>${F()}</b> en ${P()}. Est-il conservatif ?`;
    const cur = () => (sc.curva === 'poligonal' ? `la ligne brisée ${esc(sc.vertices).split(';').map((q) => `(${q.trim().split(/[\s,]+/).join(', ')})`).join(' → ')}${sc.cierra === 'si' ? ' (fermée)' : ''}` : `r(t) = (${esc(sc.cx)}, ${esc(sc.cy)}${sc.cz ? `, ${esc(sc.cz)}` : ''}) avec t de ${esc(sc.a)} à ${esc(sc.b)}`);
    if (sc.modo === 'linea') return `Calcule le travail de <b>${F()}</b> le long de ${cur()}.`;
    if (sc.modo === 'masa') return `Calcule <b>∫ f ds</b> avec f = ${esc(sc.f)} le long de ${cur()}. Si f est la densité d’un fil, quelles sont sa masse et son centre de masse ?`;
    if (sc.modo === 'superficie') return `Calcule le flux de <b>${F()}</b> à travers la surface r(u, v) = (${esc(sc.sx)}, ${esc(sc.sy)}, ${esc(sc.sz)}) avec u de ${esc(sc.u1)} à ${esc(sc.u2)} et v de ${esc(sc.v1)} à ${esc(sc.v2)}, et vérifie le théorème de Stokes.`;
    if (sc.modo === 'gauss') {
      const s3 = sc.solido === 'esfera' ? `la sphère de centre (${esc(sc.cx)}, ${esc(sc.cy)}, ${esc(sc.cz)}) et de rayon ${esc(sc.rad)}` : sc.solido === 'cilindro' ? `le cylindre de rayon ${esc(sc.rad)} et d’axe vertical passant par (${esc(sc.cx)}, ${esc(sc.cy)}), avec z de ${esc(sc.z1)} à ${esc(sc.z2)}` : `la boîte [${esc(sc.x1)}, ${esc(sc.x2)}] × [${esc(sc.y1)}, ${esc(sc.y2)}] × [${esc(sc.z1)}, ${esc(sc.z2)}]`;
      return `Vérifie le théorème de la divergence pour <b>${F()}</b> dans ${s3} : calcule le flux sortant et l’intégrale triple de la divergence.`;
    }
    const reg = sc.region === 'rectangulo' ? `le rectangle [${esc(sc.x1)}, ${esc(sc.x2)}] × [${esc(sc.y1)}, ${esc(sc.y2)}]` : sc.region === 'poligono' ? `le polygone de sommets ${esc(sc.vertices).split(';').map((q) => `(${q.trim().split(/[\s,]+/).join(', ')})`).join(', ')}` : sc.region === 'curvas' ? `la région entre y = ${esc(sc.g1)} et y = ${esc(sc.g2)} avec x de ${esc(sc.a)} à ${esc(sc.b)}` : `le cercle de centre (${esc(sc.cx)}, ${esc(sc.cy)}) et de rayon ${esc(sc.rad)}`;
    return `Vérifie le théorème de Green pour <b>${F()}</b> sur ${reg} : calcule la circulation le long du bord et l’intégrale double du rotationnel.`;
  };

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  const vec = (vs) => `(${vs.join(', ')})`;
  const nx = (x, d = 5) => { const e = C.ex(x, d); return e === C.f(x, d) ? fH(x, d) : `${fH(x, d)} <small>= ${M(e)}</small>`; };
  function calcula() {
    const err = $('#error');
    try { sol = C.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      V = null; dibuja(); return;
    }
    err.hidden = true; guarda();
    const d3 = sol.d3, pt = sol.p ? vec((d3 ? sol.p : sol.p.slice(0, 2)).map((v) => fH(v, 3))) : '';
    let h = '';
    if (sol.modo === 'curvilineas') {
      const n = sol.simb.map((s) => s), pun = vec(sol.p.map((v) => fH(v, 3)));
      if (sol.hayF) {
        h += dato('Gradient', M(`∇f = ${vec(sol.grTxt)}`), 'ancho');
        h += dato(`∇f en ${pun}`, M(vec(sol.g0.map((v) => C.ex(v)))), 'ancho');
        h += dato('Laplacien', M(`∇² f = ${sol.lapTxt}`) + (sol.armonica ? ' (harmonique)' : ''), 'ancho');
        h += dato(`∇² f en ${pun}`, nx(sol.lap0), 'num');
      }
      if (sol.hayV) {
        h += dato('Divergence', M(`∇ · F = ${sol.divTxt}`) + (sol.solenoidal ? ' (solenoidal)' : ''), 'ancho');
        h += dato(`∇ · F en ${pun}`, nx(sol.div0), 'num');
        h += dato('Rotationnel', M(`∇ × F = ${vec(sol.rotTxt)}`) + (sol.irrot ? ' (irrotacional)' : ''), 'ancho');
        h += dato(`∇ × F en ${pun}`, M(vec(sol.rot0.map((v) => C.ex(v)))), 'ancho');
      }
    } else if (sol.modo === 'escalar') {
      h += dato('Gradient', M(`∇f = ${vec(sol.grTxt)}`), 'ancho');
      h += dato(`∇f en ${pt}`, M(vec((d3 ? sol.g0 : sol.g0.slice(0, 2)).map((v) => C.ex(v)))));
      h += dato('|∇f|', nx(sol.mod), 'num');
      if (sol.du !== null) h += dato('Dérivée directionnelle Dᵤf', nx(sol.du), 'num');
      h += dato('Laplacien', M(`∇² f = ${sol.lapTxt}`) + (sol.armonica ? ' (harmonique)' : ''));
    } else if (sol.modo === 'vectorial') {
      h += dato(`Divergence en ${pt}`, nx(sol.div), 'num');
      h += dato(`Rotationnel en ${pt}`, d3 ? M(vec(sol.rot0.map((v) => C.ex(v)))) : nx(sol.rot0[2]), d3 ? '' : 'num');
      h += dato('Conservatif ?', sol.cons ? 'Oui' : 'No');
      if (sol.phiTxt) h += dato('Potentiel', M(`φ = ${sol.phiTxt} + K`), 'ancho');
      if (sol.phi !== null) h += dato(`Potentiel φ${pt}`, nx(sol.phi), 'num');
    } else if (sol.modo === 'masa') {
      h += dato('∫ f ds', nx(sol.I, 5), 'num');
      h += dato('Longueur', nx(sol.L, 5), 'num');
      h += dato('Valeur moyenne de f', nx(sol.media, 5), 'num');
      h += sol.cm ? dato('Centre de masse', M(vec((d3 ? sol.cm : sol.cm.slice(0, 2)).map((v) => C.ex(v))))) : dato('Centroïde de la courbe', M(vec((d3 ? sol.cg : sol.cg.slice(0, 2)).map((v) => C.ex(v)))));
    } else if (sol.modo === 'superficie') {
      h += dato('Flux ∬ F · dS', nx(sol.flujo, 5), 'num');
      h += dato('Aire de la surface', nx(sol.area, 5), 'num');
      h += dato('∬ (∇ × F) · dS', nx(sol.rotFlujo, 5), 'num');
      h += dato(sol.cerrada ? '∮ bord (il n’y en a pas)' : 'Circulation le long du bord', nx(sol.circula, 5), 'num');
      if (!sol.stokes) h += dato('Attention', 'Les valeurs ne coïncident pas : le champ a une singularité sur la surface et le théorème de Stokes ne s’applique pas', 'ancho');
    } else if (sol.modo === 'gauss') {
      h += dato('Flux sortant ∯ F · dS', nx(sol.flujo, 5), 'num');
      h += dato('∭ div F dV', nx(sol.vol, 5), 'num');
      h += dato('Volume', nx(sol.V, 5), 'num');
      if (sol.singular) h += dato('Attention', 'Les valeurs ne coïncident pas : il y a un point à l’intérieur où F n’est pas défini et le théorème ne s’applique pas', 'ancho');
    } else if (sol.modo === 'linea') {
      h += dato('Travail W', nx(sol.W, 5), 'num');
      if (sol.dphi !== null) h += dato('φ(B) − φ(A)', nx(sol.dphi, 5), 'num');
      h += dato('Longueur', nx(sol.L, 5), 'num');
      h += dato('Conservatif ?', sol.cons ? 'Oui : il ne dépend pas du chemin' : 'No');
    } else {
      h += dato('Circulation ∮ F · dr', nx(sol.circula, 5), 'num');
      h += dato('∬ rot F dA', nx(sol.dobleR, 5), 'num');
      h += dato('Flux ∮ F · n ds', nx(sol.flujo, 5), 'num');
      h += dato('∬ div F dA', nx(sol.dobleD, 5), 'num');
      h += dato('Aire de D', nx(sol.area, 5), 'num');
      if (sol.singular) h += dato('Attention', 'Les valeurs ne coïncident pas : il y a un point de D où F n’est pas défini et le théorème de Green ne s’applique pas', 'ancho');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    const corte = d3 && !['green', 'superficie', 'gauss', 'curvilineas'].includes(sol.modo) ? ` C’est la coupe par le plan z = ${fH(sol.p ? sol.p[2] : 0, 3)}${sol.modo === 'linea' || sol.modo === 'masa' ? ' et la courbe vue de dessus' : ''}.` : '';
    $('#leyenda').innerHTML = (sol.modo === 'curvilineas' ? (sol.sis === 'cil' ? 'Vue de dessus du plan xy : le point, en noir, avec la base locale e_ρ (radiale, en couleur) et e_φ (le long du cercle, en bleu). S’il y a un champ, la flèche épaisse est F au point, avec ses composantes.' : 'Plan contenant l’axe z et le point (le méridien), avec la base locale e_r (radiale, en couleur) et e_θ (dans le sens où θ croît, en bleu). S’il y a un champ, la flèche épaisse est F au point ; sa composante e_φ sort du plan.')
      : sol.modo === 'escalar' ? `Carte de couleurs de f (bleu, valeurs basses ; orange, valeurs élevées) avec ses courbes de niveau et, en flèches grises, le gradient. En couleur, ∇f au point${sol.u ? ' et en bleu la direction u' : ''}. Touche le graphe pour déplacer le point.`
      : sol.modo === 'vectorial' ? 'Les flèches indiquent la direction du champ et les particules la suivent. Le moulinet du point tourne selon le rotationnel. Touche le graphe pour déplacer le point.'
        : sol.modo === 'linea' ? 'La courbe va de A (creux) à B (plein). Le point qui la parcourt porte la force F (en couleur) et la vitesse r′(t) (en bleu) : le travail augmente quand elles vont dans le même sens.'
          : sol.modo === 'masa' ? `Carte de couleurs de f (bleu, valeurs basses ; orange, valeurs élevées) et la courbe par-dessus. La croix est le ${sol.cm ? 'centre de masse du fil' : 'centroïde de la courbe'}.`
            : sol.modo === 'superficie' ? `La surface en perspective, en rotation. En couleur, la normale r_u × r_v ; en bleu, le champ F aux mêmes points${sol.borde.length ? ' ; le bord, en trait épais' : ''}. Appuie sur Arrêter pour l’immobiliser.`
              : sol.modo === 'gauss' ? 'Le solide en perspective, en rotation, avec le champ F (en couleur) en des points de son bord : là où il pointe vers l’extérieur, du flux sort. Appuie sur Arrêter pour l’immobiliser.'
          : 'La région D ombrée et son bord parcouru dans le sens trigonométrique. Les particules suivent le champ : si elles tournent, il y a de la circulation ; si elles sortent, il y a du flux.') + corte;
    V = null; fondo = null; parts = []; dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); fondo = null; }
  const marcas = Herramienta.marcas;
  function lienzo(s) {
    const r = Herramienta.lienzo(s);
    if (r.cambia) fondo = null;
    return r;
  }
  const mL = 40, mR = 12, mT = 12, mB = 26;
  function ventana(w, h) {
    let xs, ys;
    if (sol.modo === 'linea' || sol.modo === 'masa') { xs = []; ys = []; for (let i = 0; i <= 200; i++) { const q = sol.r(sol.a + ((sol.b - sol.a) * i) / 200); if (isFinite(q[0]) && isFinite(q[1])) { xs.push(q[0]); ys.push(q[1]); } } }
    else if (sol.modo === 'green') { xs = []; ys = []; for (let i = 0; i < 200; i++) { const q = sol.borde(i / 200); xs.push(q[0]); ys.push(q[1]); } }
    else { const L = Math.max(2.5, 1.5 * Math.max(Math.abs(sol.p[0]), Math.abs(sol.p[1])) + 0.5); xs = [-L, L, sol.p[0]]; ys = [-L, L, sol.p[1]]; }
    let x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
    const lado = Math.max(x2 - x1, y2 - y1, 1) * (sol.modo === 'escalar' || sol.modo === 'vectorial' ? 1 : 1.5);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, ax = w - mL - mR, ay = h - mT - mB, k = Math.max(lado / ax, lado / ay);
    return { x1: cx - (ax * k) / 2, x2: cx + (ax * k) / 2, y1: cy - (ay * k) / 2, y2: cy + (ay * k) / 2 };
  }
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
    g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('x', w - mR - 2, h - mB - 3);
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('y', mL + 4, mT + 2);
  }
  const flecha = (g, x, y, dx, dy, L, a = 3.2) => {
    const n = Math.hypot(dx, dy); if (!(n > 0) || !isFinite(n)) return;
    const ux = dx / n, uy = dy / n, x2 = x + ux * L, y2 = y + uy * L;
    g.moveTo(x, y); g.lineTo(x2, y2);
    g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.6 - uy * a, y2 - uy * a * 1.6 + ux * a); g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.6 + uy * a, y2 - uy * a * 1.6 - ux * a);
  };
  const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); const n = m ? parseInt(m[1], 16) : 0x888888; return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mezcla = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const z0 = () => (sol.p ? sol.p[2] : 0);
  const Fxy = (x, y) => { try { const v = sol.F(x, y, z0()); return isFinite(v[0]) && isFinite(v[1]) ? v : null; } catch (e) { return null; } };
  function mapa(w, h, X, Y) {
    const c = document.createElement('canvas'), dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const paso = 4, nx = Math.ceil((w - mL - mR) / paso) + 1, ny = Math.ceil((h - mT - mB) / paso) + 1, val = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = V.x1 + ((i * paso) / (w - mL - mR)) * (V.x2 - V.x1), y = V.y2 - ((j * paso) / (h - mT - mB)) * (V.y2 - V.y1); let v; try { v = sol.F(x, y, z0()); } catch (e) { v = NaN; } val.push(isFinite(v) ? v : NaN); }
    const ok = val.filter(isFinite).sort((a, b) => a - b);
    if (!ok.length) return c;
    const lo = ok[Math.floor(ok.length * 0.02)], hi = ok[Math.floor(ok.length * 0.98)] + 1e-12;
    const c1 = hex(col['--z1']), c2 = hex(col['--z2']), cb = hex(col['--bg']);
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const v = val[j * nx + i]; if (!isFinite(v)) continue;
      const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo))), rgb = t < 0.5 ? mezcla(c1, cb, t * 2) : mezcla(cb, c2, (t - 0.5) * 2);
      g.fillStyle = `rgba(${rgb.join(',')},0.55)`; g.fillRect(mL + i * paso, mT + j * paso, paso, paso);
    }
    g.strokeStyle = col['--ink']; g.globalAlpha = 0.45; g.lineWidth = 1; g.beginPath();
    for (const nivel of marcas(lo, hi, 10)) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const q = [val[j * nx + i], val[j * nx + i + 1], val[(j + 1) * nx + i + 1], val[(j + 1) * nx + i]].map((v) => v - nivel);
      if (!q.every(isFinite)) continue;
      const pts = [], esq = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (let k = 0; k < 4; k++) { const a = q[k], b = q[(k + 1) % 4]; if ((a < 0) !== (b < 0)) { const s = a / (a - b), p = esq[k], r = esq[(k + 1) % 4]; pts.push([mL + (i + p[0] + (r[0] - p[0]) * s) * paso, mT + (j + p[1] + (r[1] - p[1]) * s) * paso]); } }
      for (let k = 0; k + 1 < pts.length; k += 2) { g.moveTo(...pts[k]); g.lineTo(...pts[k + 1]); }
    }
    g.stroke();
    return c;
  }
  function flechas(g, w, h, X, Y, campo) {
    const nx = Math.max(10, Math.round((w - mL - mR) / 34)), ny = Math.max(8, Math.round((h - mT - mB) / 34)), vs = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = V.x1 + ((i + 0.5) / nx) * (V.x2 - V.x1), y = V.y1 + ((j + 0.5) / ny) * (V.y2 - V.y1), v = campo(x, y); if (v) vs.push([x, y, v[0], v[1], Math.hypot(v[0], v[1])]); }
    const ms = vs.map((q) => q[4]).sort((a, b) => a - b), ref = ms[Math.floor(ms.length * 0.9)] || 1;
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2;
    for (const [x, y, a, b, m] of vs) { g.globalAlpha = 0.25 + 0.6 * Math.min(1, m / ref); g.beginPath(); flecha(g, X(x) - (a / m) * 7, Y(y) + (b / m) * 7, a, -b, 14); g.stroke(); }
    g.globalAlpha = 1;
    return ref;
  }
  function particulas(g, X, Y, ref, dt) {
    const nueva = () => ({ x: V.x1 + Math.random() * (V.x2 - V.x1), y: V.y1 + Math.random() * (V.y2 - V.y1), vida: 1 + Math.random() * 3 });
    while (parts.length < 160) parts.push(nueva());
    const vel = (V.x2 - V.x1) / 8;
    g.fillStyle = col['--accent'];
    for (let i = 0; i < parts.length; i++) {
      const q = parts[i], v = Fxy(q.x, q.y);
      if (dt) {
        q.vida -= dt;
        if (v) { const m = Math.hypot(v[0], v[1]); if (m > 0) { const s = (vel * dt * Math.min(1.5, m / ref)) / m; q.x += v[0] * s; q.y += v[1] * s; } }
        if (!v || q.vida < 0 || q.x < V.x1 || q.x > V.x2 || q.y < V.y1 || q.y > V.y2) { parts[i] = nueva(); continue; }
      }
      g.globalAlpha = Math.min(1, q.vida, 0.85); g.beginPath(); g.arc(X(q.x), Y(q.y), 2.2, 0, 2 * Math.PI); g.fill();
    }
    g.globalAlpha = 1;
  }
  const circulo = (g, x, y, r, relleno, borde, lw = 1.8) => { g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); if (relleno) { g.fillStyle = relleno; g.fill(); } if (borde) { g.strokeStyle = borde; g.lineWidth = lw; g.stroke(); } };
  function dibuja3(g, w, h) {
    const todos = sol.lineas.flat(), lo = [0, 1, 2].map((i) => Math.min(...todos.map((p) => p[i]))), hi = [0, 1, 2].map((i) => Math.max(...todos.map((p) => p[i])));
    const c = lo.map((v, i) => (v + hi[i]) / 2), diag = Math.max(1e-9, Math.hypot(...hi.map((v, i) => v - lo[i]))), el = 0.42;
    const k = (0.8 * Math.min(w, h)) / diag, ca = Math.cos(az), sa = Math.sin(az);
    const pr = (p) => { const q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], x = q[0] * ca - q[1] * sa, y = q[0] * sa + q[1] * ca; return [w / 2 + k * x, h / 2 - k * (q[2] * Math.cos(el) + y * Math.sin(el))]; };
    const linea = (ps) => { g.beginPath(); ps.forEach((p, i) => { const [x, y] = pr(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
    const flecha3 = (p, v, L) => { const m = Math.hypot(...v); if (!(m > 0) || !isFinite(m)) return; const a = pr(p), b = pr(p.map((q, i) => q + (v[i] / m) * L)); g.beginPath(); flecha(g, a[0], a[1], b[0] - a[0], b[1] - a[1], Math.hypot(b[0] - a[0], b[1] - a[1]), 4); g.stroke(); };
    g.lineWidth = 1; g.strokeStyle = col['--muted']; g.fillStyle = col['--muted']; g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['x', 'y', 'z'].forEach((n, i) => { const e = c.slice(); e[i] += diag * 0.62; linea([c, e]); const [x, y] = pr(e); g.fillText(n, x, y); });
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.55; g.lineWidth = 1; sol.lineas.forEach(linea); g.globalAlpha = 1;
    if (sol.borde) { g.strokeStyle = col['--ink']; g.lineWidth = 2.6; sol.borde.forEach(linea); }
    const L = diag * 0.13;
    if (sol.modo === 'superficie') {
      g.lineWidth = 2; g.strokeStyle = col['--accent']; for (const q of sol.flechas) flecha3(q.p, q.n, L);
      g.lineWidth = 1.6; g.strokeStyle = col['--z1']; for (const q of sol.flechas) { const F = sol.F(...q.p); if (F.every(isFinite)) flecha3(q.p, F, L * 0.8); }
    } else {
      const ms = sol.flechas.map((q) => Math.hypot(...q.F)).filter(isFinite), ref = Math.max(1e-12, ...ms);
      g.lineWidth = 2; g.strokeStyle = col['--accent'];
      for (const q of sol.flechas) { const m = Math.hypot(...q.F); if (isFinite(m) && m > 1e-9 * ref) { g.globalAlpha = 0.35 + 0.65 * (m / ref); flecha3(q.p, q.F, L * (0.4 + 0.6 * (m / ref))); } }
      g.globalAlpha = 1;
    }
  }
  function dibujaCurv(g, w, h) {
    const cil = sol.sis === 'cil', cx = w / 2, cy = h / 2, [a, b] = [sol.p[0], sol.p[1]];
    const R = Math.max(a, 1e-9), k = (0.38 * Math.min(w, h)) / Math.max(R * (cil ? 1.15 : 1.15), 1e-9);
    const px = cil ? a * Math.cos(b) : a * Math.sin(b), py = cil ? a * Math.sin(b) : a * Math.cos(b);
    const X = (x) => cx + k * x, Y = (y) => cy - k * y;
    const e1 = cil ? [Math.cos(b), Math.sin(b)] : [Math.sin(b), Math.cos(b)], e2 = cil ? [-Math.sin(b), Math.cos(b)] : [Math.cos(b), -Math.sin(b)];
    g.save(); g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1;
    const L = Math.min(w, h) * 0.46;
    g.beginPath(); g.moveTo(cx - L, cy); g.lineTo(cx + L, cy); g.moveTo(cx, cy - L); g.lineTo(cx, cy + L); g.stroke();
    g.fillText(cil ? 'x' : 'ρ (distance à l’axe z)', cx + L - (cil ? 6 : 52), cy + 12); g.fillText(cil ? 'y' : 'z', cx + 10, cy - L + 4);
    g.beginPath(); if (cil) g.arc(cx, cy, k * R, 0, 2 * Math.PI); else g.arc(cx, cy, k * R, -Math.PI / 2, Math.PI / 2); g.stroke();
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(X(px), Y(py)); g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.stroke(); g.setLineDash([]);
    const P = [X(px), Y(py)], len = Math.min(w, h) * 0.2;
    g.lineWidth = 2.4; g.strokeStyle = col['--accent']; g.beginPath(); flecha(g, P[0], P[1], e1[0], -e1[1], len, 5); g.stroke();
    g.strokeStyle = col['--z1']; g.beginPath(); flecha(g, P[0], P[1], e2[0], -e2[1], len, 5); g.stroke();
    g.fillStyle = col['--accent']; g.fillText(cil ? 'e_ρ' : 'e_r', P[0] + e1[0] * (len + 14), P[1] - e1[1] * (len + 14));
    g.fillStyle = col['--z1']; g.fillText(cil ? 'e_φ' : 'e_θ', P[0] + e2[0] * (len + 14), P[1] - e2[1] * (len + 14));
    if (sol.hayV && sol.F0.every(isFinite)) {
      const vx = sol.F0[0] * e1[0] + sol.F0[1] * e2[0], vy = sol.F0[0] * e1[1] + sol.F0[1] * e2[1], m = Math.hypot(vx, vy);
      if (m > 1e-12) { g.lineWidth = 3.4; g.strokeStyle = col['--ink']; g.beginPath(); flecha(g, P[0], P[1], vx, -vy, Math.min(w, h) * 0.3, 7); g.stroke(); g.fillStyle = col['--ink']; g.fillText('F', P[0] + (vx / m) * (Math.min(w, h) * 0.3 + 12), P[1] - (vy / m) * (Math.min(w, h) * 0.3 + 12)); }
    }
    circulo(g, P[0], P[1], 4.5, col['--panel'], col['--ink']);
    g.restore();
  }
  function dibuja(dt = 0) {
    const { g, w, h } = lienzo('#grafica');
    trans = null;
    if (!sol) return;
    if (!col['--ink']) colores();
    if (sol.modo === 'curvilineas') { dibujaCurv(g, w, h); return; }
    if (D3.includes(sol.modo)) { dibuja3(g, w, h); return; }
    if (!V) V = ventana(w, h);
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    trans = { x: (px) => V.x1 + ((px - mL) / (w - mL - mR)) * (V.x2 - V.x1), y: (py) => V.y2 - ((py - mT) / (h - mT - mB)) * (V.y2 - V.y1) };
    if (sol.modo === 'escalar' || sol.modo === 'masa') { if (!fondo) fondo = mapa(w, h, X, Y); g.drawImage(fondo, 0, 0, w, h); }
    ejes(g, w, h, X, Y);
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    if (sol.modo === 'escalar') {
      flechas(g, w, h, X, Y, (x, y) => { try { const v = sol.G(x, y, z0()); return isFinite(v[0]) && isFinite(v[1]) ? v : null; } catch (e) { return null; } });
      const P0 = [X(sol.p[0]), Y(sol.p[1])], gm = Math.hypot(sol.g0[0], sol.g0[1]);
      g.lineWidth = 2.6; g.strokeStyle = col['--accent']; g.beginPath(); flecha(g, P0[0], P0[1], sol.g0[0], -sol.g0[1], 56, 5); g.stroke();
      if (sol.u) { g.strokeStyle = col['--z1']; g.beginPath(); flecha(g, P0[0], P0[1], sol.u[0], -sol.u[1], 44, 5); g.stroke(); }
      circulo(g, P0[0], P0[1], 4.5, col['--panel'], col['--ink']);
      if (gm > 0) { g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--accent']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('∇f', P0[0] + (sol.g0[0] / gm) * 64, P0[1] - (sol.g0[1] / gm) * 64); }
    } else if (sol.modo === 'masa') {
      const n = 400, pts = []; for (let i = 0; i <= n; i++) pts.push(sol.r(sol.a + ((sol.b - sol.a) * i) / n));
      g.strokeStyle = col['--ink']; g.lineWidth = 3; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])))); g.stroke();
      const c = sol.cm || sol.cg, cx = X(c[0]), cy = Y(c[1]);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx - 7, cy - 7); g.lineTo(cx + 7, cy + 7); g.moveTo(cx - 7, cy + 7); g.lineTo(cx + 7, cy - 7); g.stroke();
    } else {
      if (sol.modo === 'green') {
        g.beginPath(); for (let i = 0; i <= 120; i++) { const q = sol.borde(i / 120); i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])); }
        g.closePath(); g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.8; g.fill(); g.globalAlpha = 1;
      }
      const ref = flechas(g, w, h, X, Y, Fxy);
      particulas(g, X, Y, ref, anda ? dt : 0);
      if (sol.modo === 'vectorial') {
        const P0 = [X(sol.p[0]), Y(sol.p[1])], r = 18;
        g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.beginPath();
        for (let k = 0; k < 4; k++) { const a = giro + (k * Math.PI) / 2; g.moveTo(P0[0], P0[1]); g.lineTo(P0[0] + r * Math.cos(a), P0[1] - r * Math.sin(a)); }
        g.stroke(); g.fillStyle = col['--ink']; for (let k = 0; k < 4; k++) { const a = giro + (k * Math.PI) / 2; circulo(g, P0[0] + r * Math.cos(a), P0[1] - r * Math.sin(a), 3.2, col['--accent']); }
        circulo(g, P0[0], P0[1], 3.5, col['--panel'], col['--ink'], 1.5);
      } else if (sol.modo === 'linea') {
        const n = 300, pts = []; for (let i = 0; i <= n; i++) pts.push(sol.r(sol.a + ((sol.b - sol.a) * i) / n));
        g.strokeStyle = col['--ink']; g.lineWidth = 2.4; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])))); g.stroke();
        circulo(g, X(sol.A[0]), Y(sol.A[1]), 5, col['--panel'], col['--ink']); circulo(g, X(sol.B[0]), Y(sol.B[1]), 4, col['--ink']);
        const t = sol.a + (sol.b - sol.a) * u, q = sol.r(t), e = 1e-4 * (sol.b - sol.a), q2 = sol.r(Math.min(sol.b, t + e)), q1 = sol.r(Math.max(sol.a, t - e)), F = Fxy(q[0], q[1]) && sol.F(q[0], q[1], q[2]);
        if (F) { g.strokeStyle = col['--accent']; g.lineWidth = 2.6; g.beginPath(); flecha(g, X(q[0]), Y(q[1]), F[0], -F[1], 46, 5); g.stroke(); }
        g.strokeStyle = col['--z1']; g.lineWidth = 2.2; g.beginPath(); flecha(g, X(q[0]), Y(q[1]), q2[0] - q1[0], -(q2[1] - q1[1]), 34, 4.5); g.stroke();
        circulo(g, X(q[0]), Y(q[1]), 5.5, col['--accent']);
      } else {
        g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= 120; i++) { const q = sol.borde(i / 120); i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])); } g.closePath(); g.stroke();
        g.fillStyle = col['--ink'];
        for (const s of [0.125, 0.375, 0.625, 0.875]) { const a = sol.borde(s), b = sol.borde(s + 0.004), dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]); g.beginPath(); flecha(g, X(a[0]) - dx, Y(a[1]) - dy, dx, dy, 2, 6); g.stroke(); }
        const q = sol.borde(u % 1); circulo(g, X(q[0]), Y(q[1]), 5.5, col['--accent']);
      }
    }
    g.restore();
  }
  $('#grafica').addEventListener('click', (e) => {
    if (!sol || !trans || ['linea', 'masa', ...D3].includes(sol.modo) || (sol.modo === 'green' && sc.region !== 'circulo')) return;
    const r = e.target.getBoundingClientRect(), x = trans.x(e.clientX - r.left), y = trans.y(e.clientY - r.top);
    const red = (v) => coma(+v.toPrecision(3));
    if (sol.modo === 'green') { sc.cx = red(x); sc.cy = red(y); } else { sc.x0 = red(x); sc.y0 = red(y); }
    const V0 = sol.modo === 'green' ? null : V;
    formulario(); cambia(); if (V0 && sol) { V = V0; fondo = null; dibuja(); }
  });
  $('#animar').addEventListener('click', () => { anda = !anda; $('#animar').textContent = anda ? '⏸ Arrêter' : '▶ Animer'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) {
      u = sol.modo === 'linea' ? (u + dt / 5) % 1 : sol.modo === 'green' ? (u + dt / 6) % 1 : u;
      if (sol.modo === 'vectorial') giro += Math.max(-4, Math.min(4, sol.rot0[2] / 2)) * dt;
      if (D3.includes(sol.modo)) az += dt * 0.35;
      dibuja(dt);
    }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { V = null; fondo = null; parts = []; dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('campos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  Herramienta.exportar('#grafica', { nombre: 'campos-vectoriales', titulo: 'Champs vectoriels', etiqueta: 'le champ' });
  window.CamposApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, div0: sol.div0, lap0: sol.lap0, divTxt: sol.divTxt, rotTxt: sol.rotTxt, grTxt: sol.grTxt, lapTxt: sol.lapTxt, g0: sol.g0, du: sol.du, div: sol.div, rot0: sol.rot0, phi: sol.phi, phiTxt: sol.phiTxt, W: sol.W, I: sol.I, cm: sol.cm, circula: sol.circula, dobleR: sol.dobleR, flujo: sol.flujo, dobleD: sol.dobleD, rotFlujo: sol.rotFlujo, vol: sol.vol }, estado: () => copia(sc) };
})();

