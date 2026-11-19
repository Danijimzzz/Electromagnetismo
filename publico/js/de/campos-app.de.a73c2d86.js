(() => {
  const { $, esc, copia, txt } = Herramienta;
  const C = Campos, CLAVE = 'campos-v1';
  const fH = (x, d = 4) => C.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const coma = (v) => String(v).replace('.', ',');
  const MODOS = [['curvilineas', 'Zylinder- und Kugelkoordinaten: ∇f, ∇·F und ∇×F'], ['escalar', 'Gradient eines Skalarfeldes f'], ['vectorial', 'Divergenz, Rotation und Potential von F'], ['linea', 'Linienintegral (Arbeit)'], ['masa', 'Integral von f längs einer Kurve (∫ f ds)'], ['green', 'Satz von Green'], ['superficie', 'Fluss durch eine Fläche und Stokes'], ['gauss', 'Divergenzsatz (Gauß)']];
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
  const campoF = (conR = true) => sep('Feld F = (P, Q, R)') + fila('P', 'P', 'Funktion von x, y, z', true) + fila('Q', 'Q', '', true) + (conR ? fila('R', 'R', D3.includes(sc.modo) ? '' : 'leer in der Ebene', true) : '');
  const punto = () => sep('Punkt') + fila('x0', 'x₀') + fila('y0', 'y₀') + fila('z0', 'z₀', 'falls es z gibt');
  const curvaF = () => sep('Kurve') + elige('curva', 'Art', [['param', 'Parametrisch r(t)'], ['poligonal', 'Streckenzug (Strecken)']]) + (sc.curva === 'poligonal'
    ? fila('vertices', 'Eckpunkte', 'x y (z); …', true) + elige('cierra', 'Zum ersten zurück', [['si', 'Ja (geschlossen)'], ['no', 'No']])
    : fila('cx', 'x(t)', '', true) + fila('cy', 'y(t)', '', true) + fila('cz', 'z(t)', 'leer in der Ebene', true) + fila('a', 't anfangs') + fila('b', 't Ende'));
  const NOTAS = {
    curvilineas: 'Zylinder: ρ → r, φ → p. Kugel: r → r, θ → t (Winkel zur z-Achse, von 0 bis π), φ → p. Schreibe f und die Komponenten des Feldes in der Basis (e_ρ, e_φ, e_z) oder (e_r, e_θ, e_φ), mit sin, cos, ln, π…; lass leer, was du nicht brauchst.',
    escalar: 'Schreibe f mit x, y (und z, wenn du willst): x^2 + y^2, x y z, e^x sin y… Die Richtung u ist optional und muss kein Einheitsvektor sein.',
    vectorial: 'Schreibe die Komponenten mit x, y, z. Ist R leer und gibt es kein z, ist das Feld eben. Tippe auf den Graphen, um den Punkt zu verschieben.',
    linea: 'Die Kurve r(t) = (x(t), y(t), z(t)) läuft von t anfangs bis t Ende; zum Beispiel cos t, sin t mit t von 0 bis 2π. Ein Streckenzug wird mit seinen Eckpunkten geschrieben: 0 0; 1 0; 1 1 (getrennt durch «;», Dezimalstellen mit Punkt).',
    masa: 'f kann die Dichte des Drahtes sein (für Masse und Schwerpunkt) oder eine beliebige Funktion; mit f = 1 ergibt sich die Länge. Ein Streckenzug wird mit seinen Eckpunkten geschrieben: 0 0; 1 0; 1 1.',
    green: 'Die Kurve ist der Rand des Gebiets, gegen den Uhrzeigersinn durchlaufen. Ein Polygon wird mit seinen Eckpunkten geschrieben (0 0; 2 0; 0 1) und das Gebiet zwischen Kurven mit der unteren und der oberen. Bei einem Kreis tippe auf den Graphen, um seinen Mittelpunkt zu verschieben.',
    superficie: 'Die Fläche ist r(u, v) mit u und v in einem Rechteck; zum Beispiel ist die Einheitskugel (sin u cos v, sin u sin v, cos u) mit u von 0 bis π und v von 0 bis 2π. Die Normale ist r_u × r_v.',
    gauss: 'Der Fluss wird Seite für Seite mit der Normalen nach außen berechnet und mit dem Dreifachintegral der Divergenz verglichen. Der Zylinder hat eine senkrechte Achse.',
  };
  function formulario() {
    let h = elige('modo', 'Was berechnen', MODOS);
    if (sc.modo === 'curvilineas') {
      const cil = sc.sis === 'cil', n = cil ? ['ρ', 'φ', 'z'] : ['r', 'θ', 'φ'], c = cil ? ['F_ρ', 'F_φ', 'F_z'] : ['F_r', 'F_θ', 'F_φ'], v = cil ? 'r, p, z' : 'r, t, p';
      h += elige('sis', 'System', [['cil', 'Zylinderkoordinaten (ρ, φ, z)'], ['esf', 'Kugelkoordinaten (r, θ, φ)']]) + sep('Skalarfeld') + fila('f', 'f =', 'variables ' + v + ' (opcional)', true)
        + sep('Vektorfeld') + fila('A', c[0], 'Komponente in e_' + n[0], true) + fila('B', c[1], 'Komponente in e_' + n[1], true) + fila('C', c[2], 'Komponente in e_' + n[2], true)
        + sep('Punkt') + fila('p1', n[0] + ' =') + fila('p2', n[1] + ' =', 'Bogenmaß: π/3') + fila('p3', n[2] + ' =', 'Bogenmaß, wenn es φ ist');
    } else if (sc.modo === 'escalar') h += fila('f', 'f(x, y, z) =', '', true) + punto() + fila('u', 'Richtung u', '(optional) 1, 2');
    else if (sc.modo === 'vectorial') h += campoF() + punto();
    else if (sc.modo === 'linea' || sc.modo === 'masa') h += (sc.modo === 'linea' ? campoF() : sep('Skalarfeld') + fila('f', 'f(x, y, z) =', 'densidad', true)) + curvaF();
    else if (sc.modo === 'superficie') h += campoF() + sep('Fläche r(u, v)') + fila('sx', 'x(u, v)', '', true) + fila('sy', 'y(u, v)', '', true) + fila('sz', 'z(u, v)', '', true) + fila('u1', 'minimales u') + fila('u2', 'maximales u') + fila('v1', 'minimales v') + fila('v2', 'maximales v');
    else if (sc.modo === 'gauss') {
      h += campoF() + sep('Fest') + elige('solido', 'Form', [['caja', 'Quader'], ['esfera', 'Kugel'], ['cilindro', 'Zylinder']]);
      h += sc.solido === 'esfera' ? fila('cx', 'Mittelpunkt x') + fila('cy', 'Mittelpunkt y') + fila('cz', 'Mittelpunkt z') + fila('rad', 'Radius')
        : sc.solido === 'cilindro' ? fila('cx', 'Achse: x') + fila('cy', 'Achse: y') + fila('rad', 'Radius') + fila('z1', 'minimales z') + fila('z2', 'maximales z')
          : fila('x1', 'minimales x') + fila('x2', 'maximales x') + fila('y1', 'minimales y') + fila('y2', 'maximales y') + fila('z1', 'minimales z') + fila('z2', 'maximales z');
    } else {
      h += sep('Feld F = (P, Q)') + fila('P', 'P', 'Funktion von x und y', true) + fila('Q', 'Q', '', true) + sep('Gebiet') + elige('region', 'Form', [['circulo', 'Kreis'], ['rectangulo', 'Rechteck'], ['poligono', 'Dreieck oder Polygon'], ['curvas', 'Zwischen zwei Kurven']]);
      h += sc.region === 'rectangulo' ? fila('x1', 'minimales x') + fila('x2', 'maximales x') + fila('y1', 'minimales y') + fila('y2', 'maximales y')
        : sc.region === 'poligono' ? fila('vertices', 'Eckpunkte', 'x y; x y; …', true)
          : sc.region === 'curvas' ? fila('g1', 'Unten: y =', 'Funktion von x', true) + fila('g2', 'Oben: y =', '', true) + fila('a', 'x anfangs') + fila('b', 'x Ende')
            : fila('cx', 'Mittelpunkt x') + fila('cy', 'Mittelpunkt y') + fila('rad', 'Radius');
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
  sel.innerHTML = '<option value="">Beispiele…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${C.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
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
    if (sc.modo === 'curvilineas') return `Berechne in ${sc.sis === 'cil' ? 'Zylinderkoordinaten' : 'Kugelkoordinaten'} ${sc.f ? `den Gradienten und den Laplace-Operator von <b>f = ${esc(sc.f)}</b>` : ''}${sc.f && (sc.A || sc.B || sc.C) ? ' und ' : ''}${sc.A || sc.B || sc.C ? `die Divergenz und die Rotation von <b>F = (${esc(sc.A || '0')}, ${esc(sc.B || '0')}, ${esc(sc.C || '0')})</b>` : ''} im Punkt (${esc(sc.p1)}, ${esc(sc.p2)}, ${esc(sc.p3)}).`;
    if (sc.modo === 'escalar') return `Berechne den Gradienten von <b>f = ${esc(sc.f)}</b> im Punkt ${P()}${sc.u ? ` und die Richtungsableitung in Richtung (${esc(sc.u)})` : ''} sowie ihren Laplace-Operator.`;
    if (sc.modo === 'vectorial') return `Berechne die Divergenz und die Rotation von <b>${F()}</b> in ${P()}. Ist es konservativ?`;
    const cur = () => (sc.curva === 'poligonal' ? `der Streckenzug ${esc(sc.vertices).split(';').map((q) => `(${q.trim().split(/[\s,]+/).join(', ')})`).join(' → ')}${sc.cierra === 'si' ? ' (geschlossen)' : ''}` : `r(t) = (${esc(sc.cx)}, ${esc(sc.cy)}${sc.cz ? `, ${esc(sc.cz)}` : ''}) mit t von ${esc(sc.a)} bis ${esc(sc.b)}`);
    if (sc.modo === 'linea') return `Berechne die Arbeit von <b>${F()}</b> längs ${cur()}.`;
    if (sc.modo === 'masa') return `Berechne <b>∫ f ds</b> mit f = ${esc(sc.f)} längs ${cur()}. Wenn f die Dichte eines Drahtes ist, was sind seine Masse und sein Schwerpunkt?`;
    if (sc.modo === 'superficie') return `Berechne den Fluss von <b>${F()}</b> durch die Fläche r(u, v) = (${esc(sc.sx)}, ${esc(sc.sy)}, ${esc(sc.sz)}) mit u von ${esc(sc.u1)} bis ${esc(sc.u2)} und v von ${esc(sc.v1)} bis ${esc(sc.v2)} und prüfe den Satz von Stokes.`;
    if (sc.modo === 'gauss') {
      const s3 = sc.solido === 'esfera' ? `die Kugel mit Mittelpunkt (${esc(sc.cx)}, ${esc(sc.cy)}, ${esc(sc.cz)}) und Radius ${esc(sc.rad)}` : sc.solido === 'cilindro' ? `der Zylinder mit Radius ${esc(sc.rad)} und senkrechter Achse durch (${esc(sc.cx)}, ${esc(sc.cy)}), mit z von ${esc(sc.z1)} bis ${esc(sc.z2)}` : `der Quader [${esc(sc.x1)}, ${esc(sc.x2)}] × [${esc(sc.y1)}, ${esc(sc.y2)}] × [${esc(sc.z1)}, ${esc(sc.z2)}]`;
      return `Prüfe den Divergenzsatz für <b>${F()}</b> in ${s3}: Berechne den Fluss nach außen und das Dreifachintegral der Divergenz.`;
    }
    const reg = sc.region === 'rectangulo' ? `das Rechteck [${esc(sc.x1)}, ${esc(sc.x2)}] × [${esc(sc.y1)}, ${esc(sc.y2)}]` : sc.region === 'poligono' ? `das Polygon mit den Eckpunkten ${esc(sc.vertices).split(';').map((q) => `(${q.trim().split(/[\s,]+/).join(', ')})`).join(', ')}` : sc.region === 'curvas' ? `das Gebiet zwischen y = ${esc(sc.g1)} und y = ${esc(sc.g2)} mit x von ${esc(sc.a)} bis ${esc(sc.b)}` : `der Kreis mit Mittelpunkt (${esc(sc.cx)}, ${esc(sc.cy)}) und Radius ${esc(sc.rad)}`;
    return `Prüfe den Satz von Green für <b>${F()}</b> in ${reg}: Berechne die Zirkulation längs des Randes und das Doppelintegral der Rotation.`;
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
        h += dato(`∇f in ${pun}`, M(vec(sol.g0.map((v) => C.ex(v)))), 'ancho');
        h += dato('Laplace-Operator', M(`∇² f = ${sol.lapTxt}`) + (sol.armonica ? ' (harmonisch)' : ''), 'ancho');
        h += dato(`∇² f in ${pun}`, nx(sol.lap0), 'num');
      }
      if (sol.hayV) {
        h += dato('Divergenz', M(`∇ · F = ${sol.divTxt}`) + (sol.solenoidal ? ' (solenoidal)' : ''), 'ancho');
        h += dato(`∇ · F in ${pun}`, nx(sol.div0), 'num');
        h += dato('Rotation', M(`∇ × F = ${vec(sol.rotTxt)}`) + (sol.irrot ? ' (irrotacional)' : ''), 'ancho');
        h += dato(`∇ × F in ${pun}`, M(vec(sol.rot0.map((v) => C.ex(v)))), 'ancho');
      }
    } else if (sol.modo === 'escalar') {
      h += dato('Gradient', M(`∇f = ${vec(sol.grTxt)}`), 'ancho');
      h += dato(`∇f in ${pt}`, M(vec((d3 ? sol.g0 : sol.g0.slice(0, 2)).map((v) => C.ex(v)))));
      h += dato('|∇f|', nx(sol.mod), 'num');
      if (sol.du !== null) h += dato('Richtungsableitung Dᵤf', nx(sol.du), 'num');
      h += dato('Laplace-Operator', M(`∇² f = ${sol.lapTxt}`) + (sol.armonica ? ' (harmonisch)' : ''));
    } else if (sol.modo === 'vectorial') {
      h += dato(`Divergenz in ${pt}`, nx(sol.div), 'num');
      h += dato(`Rotation in ${pt}`, d3 ? M(vec(sol.rot0.map((v) => C.ex(v)))) : nx(sol.rot0[2]), d3 ? '' : 'num');
      h += dato('Konservativ?', sol.cons ? 'Ja' : 'No');
      if (sol.phiTxt) h += dato('Potential', M(`φ = ${sol.phiTxt} + K`), 'ancho');
      if (sol.phi !== null) h += dato(`Potential φ${pt}`, nx(sol.phi), 'num');
    } else if (sol.modo === 'masa') {
      h += dato('∫ f ds', nx(sol.I, 5), 'num');
      h += dato('Länge', nx(sol.L, 5), 'num');
      h += dato('Mittelwert von f', nx(sol.media, 5), 'num');
      h += sol.cm ? dato('Schwerpunkt', M(vec((d3 ? sol.cm : sol.cm.slice(0, 2)).map((v) => C.ex(v))))) : dato('Schwerpunkt der Kurve', M(vec((d3 ? sol.cg : sol.cg.slice(0, 2)).map((v) => C.ex(v)))));
    } else if (sol.modo === 'superficie') {
      h += dato('Fluss ∬ F · dS', nx(sol.flujo, 5), 'num');
      h += dato('Fläche der Oberfläche', nx(sol.area, 5), 'num');
      h += dato('∬ (∇ × F) · dS', nx(sol.rotFlujo, 5), 'num');
      h += dato(sol.cerrada ? '∮ Rand (hat keinen)' : 'Zirkulation längs des Randes', nx(sol.circula, 5), 'num');
      if (!sol.stokes) h += dato('Achtung', 'Sie stimmen nicht überein: Das Feld hat auf der Fläche eine Singularität, und Stokes gilt nicht', 'ancho');
    } else if (sol.modo === 'gauss') {
      h += dato('Fluss nach außen ∯ F · dS', nx(sol.flujo, 5), 'num');
      h += dato('∭ div F dV', nx(sol.vol, 5), 'num');
      h += dato('Volumen', nx(sol.V, 5), 'num');
      if (sol.singular) h += dato('Achtung', 'Sie stimmen nicht überein: Im Inneren gibt es einen Punkt, in dem F nicht definiert ist, und der Satz gilt nicht', 'ancho');
    } else if (sol.modo === 'linea') {
      h += dato('Arbeit W', nx(sol.W, 5), 'num');
      if (sol.dphi !== null) h += dato('φ(B) − φ(A)', nx(sol.dphi, 5), 'num');
      h += dato('Länge', nx(sol.L, 5), 'num');
      h += dato('Konservativ?', sol.cons ? 'Ja: Es hängt nicht vom Weg ab' : 'No');
    } else {
      h += dato('Zirkulation ∮ F · dr', nx(sol.circula, 5), 'num');
      h += dato('∬ rot F dA', nx(sol.dobleR, 5), 'num');
      h += dato('Fluss ∮ F · n ds', nx(sol.flujo, 5), 'num');
      h += dato('∬ div F dA', nx(sol.dobleD, 5), 'num');
      h += dato('Fläche von D', nx(sol.area, 5), 'num');
      if (sol.singular) h += dato('Achtung', 'Sie stimmen nicht überein: In D gibt es einen Punkt, in dem F nicht definiert ist, und Green gilt nicht', 'ancho');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    const corte = d3 && !['green', 'superficie', 'gauss', 'curvilineas'].includes(sol.modo) ? ` Es ist der Schnitt mit der Ebene z = ${fH(sol.p ? sol.p[2] : 0, 3)}${sol.modo === 'linea' || sol.modo === 'masa' ? ' und die Kurve von oben gesehen' : ''}.` : '';
    $('#leyenda').innerHTML = (sol.modo === 'curvilineas' ? (sol.sis === 'cil' ? 'Ansicht von oben auf die xy-Ebene: der Punkt, schwarz, mit der lokalen Basis e_ρ (radial, farbig) und e_φ (längs des Kreises, blau). Gibt es ein Feld, ist der dicke Pfeil F im Punkt, mit seinen Komponenten.' : 'Ebene, die die z-Achse und den Punkt enthält (der Meridian), mit der lokalen Basis e_r (radial, farbig) und e_θ (dorthin, wo θ wächst, blau). Gibt es ein Feld, ist der dicke Pfeil F im Punkt; seine e_φ-Komponente tritt aus der Ebene heraus.')
      : sol.modo === 'escalar' ? `Farbkarte von f (blau niedrige Werte, orange hohe) mit ihren Niveaulinien und, als graue Pfeile, dem Gradienten. Farbig ∇f im Punkt${sol.u ? ' und blau die Richtung u' : ''}. Tippe auf den Graphen, um den Punkt zu verschieben.`
      : sol.modo === 'vectorial' ? 'Die Pfeile sind die Richtung des Feldes, und die Teilchen folgen ihm. Das Schaufelrad im Punkt dreht sich entsprechend der Rotation. Tippe auf den Graphen, um den Punkt zu verschieben.'
        : sol.modo === 'linea' ? 'Die Kurve verläuft von A (hohl) nach B (gefüllt). Der Punkt, der sie durchläuft, trägt die Kraft F (farbig) und die Geschwindigkeit r′(t) (blau): Die Arbeit wächst, wenn beide in dieselbe Richtung zeigen.'
          : sol.modo === 'masa' ? `Farbkarte von f (blau niedrige Werte, orange hohe) und die Kurve darüber. Das Kreuz ist der ${sol.cm ? 'Schwerpunkt des Drahtes' : 'Schwerpunkt der Kurve'}.`
            : sol.modo === 'superficie' ? `Die Fläche in Perspektive, rotierend. Farbig die Normale r_u × r_v; blau das Feld F in denselben Punkten${sol.borde.length ? '; der Rand in dicker Linie' : ''}. Drücke Anhalten, um sie ruhig zu stellen.`
              : sol.modo === 'gauss' ? 'Der Körper in Perspektive, rotierend, mit dem Feld F (farbig) in Punkten seines Randes: Wo es nach außen zeigt, tritt Fluss aus. Drücke Anhalten, um ihn ruhig zu stellen.'
          : 'Das schattierte Gebiet D und sein Rand, gegen den Uhrzeigersinn durchlaufen. Die Teilchen folgen dem Feld: Wenn sie kreisen, gibt es Zirkulation; wenn sie austreten, gibt es Fluss.') + corte;
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
    g.fillText(cil ? 'x' : 'ρ (Abstand von der z-Achse)', cx + L - (cil ? 6 : 52), cy + 12); g.fillText(cil ? 'y' : 'z', cx + 10, cy - L + 4);
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
  $('#animar').addEventListener('click', () => { anda = !anda; $('#animar').textContent = anda ? '⏸ Anhalten' : '▶ Animieren'; });
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
  Herramienta.exportar('#grafica', { nombre: 'campos-vectoriales', titulo: 'Vektorfelder', etiqueta: 'das Feld' });
  window.CamposApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, div0: sol.div0, lap0: sol.lap0, divTxt: sol.divTxt, rotTxt: sol.rotTxt, grTxt: sol.grTxt, lapTxt: sol.lapTxt, g0: sol.g0, du: sol.du, div: sol.div, rot0: sol.rot0, phi: sol.phi, phiTxt: sol.phiTxt, W: sol.W, I: sol.I, cm: sol.cm, circula: sol.circula, dobleR: sol.dobleR, flujo: sol.flujo, dobleD: sol.dobleD, rotFlujo: sol.rotFlujo, vol: sol.vol }, estado: () => copia(sc) };
})();

