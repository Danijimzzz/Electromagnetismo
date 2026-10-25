/* =====================================================================
   Campos vectoriales: interfaz (siete modos: gradiente de un campo
   escalar, divergencia y rotacional (con el potencial) de un campo
   vectorial, integral de línea, ∫ f ds, teorema de Green, flujo por una
   superficie con Stokes y teorema de la divergencia). La gráfica es el
   plano z = z₀: mapa de color y curvas de nivel para f, flechas y
   partículas que siguen el campo para F, la curva con un punto que la
   recorre y la región de Green; las superficies y los sólidos se ven en
   perspectiva, girando. Tocando la gráfica se cambia el punto. El cálculo está en campos/calculo.js
   (Campos) y las expresiones en matematicas/expresion.js.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt } = Herramienta;
  const C = Campos, CLAVE = 'campos-v1';
  const fH = (x, d = 4) => C.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const coma = (v) => String(v).replace('.', ',');
  const MODOS = [['escalar', 'Gradiente de un campo escalar f'], ['vectorial', 'Divergencia, rotacional y potencial de F'], ['linea', 'Integral de línea (trabajo)'], ['masa', 'Integral de f a lo largo de una curva (∫ f ds)'], ['green', 'Teorema de Green'], ['superficie', 'Flujo por una superficie y Stokes'], ['gauss', 'Teorema de la divergencia (Gauss)']];
  const REGION = { circulo: { cx: '0', cy: '0', rad: '1' }, rectangulo: { x1: '0', x2: '2', y1: '0', y2: '1' }, poligono: { vertices: '0 0; 2 0; 0 1' }, curvas: { g1: 'x^2', g2: 'x', a: '0', b: '1' } };
  const SOLIDO = { caja: { x1: '0', x2: '1', y1: '0', y2: '1', z1: '0', z2: '1' }, esfera: { cx: '0', cy: '0', cz: '0', rad: '1' }, cilindro: { cx: '0', cy: '0', rad: '1', z1: '0', z2: '2' } };
  const CURVA = { param: { cx: 'cos t', cy: 'sen t', cz: '', a: '0', b: 'π' }, poligonal: { vertices: '0 0; 1 0; 0 1', cierra: 'si' } };
  const D3 = ['superficie', 'gauss'];

  let sc = copia(C.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, V = null, trans = null, anda = true, u = 0, giro = 0, parts = [], fondo = null, az = 0.7;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, ay = '', larga = false) => `<label for="f-${k}">${nom}${ay ? ` <small>${ay}</small>` : ''}</label><input id="f-${k}" class="in${larga ? ' larga' : ''}" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const campoF = (conR = true) => sep('Campo F = (P, Q, R)') + fila('P', 'P', 'función de x, y, z', true) + fila('Q', 'Q', '', true) + (conR ? fila('R', 'R', D3.includes(sc.modo) ? '' : 'vacía en el plano', true) : '');
  const punto = () => sep('Punto') + fila('x0', 'x₀') + fila('y0', 'y₀') + fila('z0', 'z₀', 'si hay z');
  const curvaF = () => sep('Curva') + elige('curva', 'Tipo', [['param', 'Paramétrica r(t)'], ['poligonal', 'Poligonal (segmentos)']]) + (sc.curva === 'poligonal'
    ? fila('vertices', 'Vértices', 'x y (z); …', true) + elige('cierra', 'Volver al primero', [['si', 'Sí (cerrada)'], ['no', 'No']])
    : fila('cx', 'x(t)', '', true) + fila('cy', 'y(t)', '', true) + fila('cz', 'z(t)', 'vacía en el plano', true) + fila('a', 't inicial') + fila('b', 't final'));
  const NOTAS = {
    escalar: 'Escribe f con x, y (y z si quieres): x^2 + y^2, x y z, e^x sen y… La dirección u es opcional y no hace falta que sea unitaria.',
    vectorial: 'Escribe las componentes con x, y, z. Si R está vacía y no hay z, el campo es plano. Toca la gráfica para mover el punto.',
    linea: 'La curva r(t) = (x(t), y(t), z(t)) va de t inicial a t final; por ejemplo cos t, sen t con t de 0 a 2π. Una poligonal se escribe con sus vértices: 0 0; 1 0; 1 1 (separados por «;», decimales con punto).',
    masa: 'f puede ser la densidad del alambre (para la masa y el centro de masas) o cualquier función; con f = 1 sale la longitud. Una poligonal se escribe con sus vértices: 0 0; 1 0; 1 1.',
    green: 'La curva es el borde de la región, recorrido en sentido antihorario. Un polígono se escribe con sus vértices (0 0; 2 0; 0 1) y la región entre curvas, con la de abajo y la de arriba. Con un círculo, toca la gráfica para mover su centro.',
    superficie: 'La superficie es r(u, v) con u y v en un rectángulo; por ejemplo la esfera unidad es (sen u cos v, sen u sen v, cos u) con u de 0 a π y v de 0 a 2π. La normal es r_u × r_v.',
    gauss: 'El flujo se calcula cara a cara con la normal hacia fuera y se compara con la integral triple de la divergencia. El cilindro tiene el eje vertical.',
  };
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    if (sc.modo === 'escalar') h += fila('f', 'f(x, y, z) =', '', true) + punto() + fila('u', 'Dirección u', '(opcional) 1, 2');
    else if (sc.modo === 'vectorial') h += campoF() + punto();
    else if (sc.modo === 'linea' || sc.modo === 'masa') h += (sc.modo === 'linea' ? campoF() : sep('Campo escalar') + fila('f', 'f(x, y, z) =', 'densidad', true)) + curvaF();
    else if (sc.modo === 'superficie') h += campoF() + sep('Superficie r(u, v)') + fila('sx', 'x(u, v)', '', true) + fila('sy', 'y(u, v)', '', true) + fila('sz', 'z(u, v)', '', true) + fila('u1', 'u mínima') + fila('u2', 'u máxima') + fila('v1', 'v mínima') + fila('v2', 'v máxima');
    else if (sc.modo === 'gauss') {
      h += campoF() + sep('Sólido') + elige('solido', 'Forma', [['caja', 'Caja'], ['esfera', 'Esfera'], ['cilindro', 'Cilindro']]);
      h += sc.solido === 'esfera' ? fila('cx', 'Centro x') + fila('cy', 'Centro y') + fila('cz', 'Centro z') + fila('rad', 'Radio')
        : sc.solido === 'cilindro' ? fila('cx', 'Eje: x') + fila('cy', 'Eje: y') + fila('rad', 'Radio') + fila('z1', 'z mínima') + fila('z2', 'z máxima')
          : fila('x1', 'x mínima') + fila('x2', 'x máxima') + fila('y1', 'y mínima') + fila('y2', 'y máxima') + fila('z1', 'z mínima') + fila('z2', 'z máxima');
    } else {
      h += sep('Campo F = (P, Q)') + fila('P', 'P', 'función de x e y', true) + fila('Q', 'Q', '', true) + sep('Región') + elige('region', 'Forma', [['circulo', 'Círculo'], ['rectangulo', 'Rectángulo'], ['poligono', 'Triángulo o polígono'], ['curvas', 'Entre dos curvas']]);
      h += sc.region === 'rectangulo' ? fila('x1', 'x mínima') + fila('x2', 'x máxima') + fila('y1', 'y mínima') + fila('y2', 'y máxima')
        : sc.region === 'poligono' ? fila('vertices', 'Vértices', 'x y; x y; …', true)
          : sc.region === 'curvas' ? fila('g1', 'Abajo: y =', 'función de x', true) + fila('g2', 'Arriba: y =', '', true) + fila('a', 'x inicial') + fila('b', 'x final')
            : fila('cx', 'Centro x') + fila('cy', 'Centro y') + fila('rad', 'Radio');
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
    else { sc[k] = t.value; Object.assign(sc, ({ region: REGION, solido: SOLIDO, curva: CURVA }[k] || {})[t.value] || {}); }
    formulario(); cambia();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${C.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
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
      () => ({ modo: 'linea', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), R: '', cx: `${ent(1, 3)} cos t`.replace(/^1 /, ''), cy: `${ent(1, 3)} sen t`.replace(/^1 /, ''), cz: '', a: '0', b: ['π/2', 'π', '2π'][ent(0, 2)] }),
      () => ({ modo: 'green', P: k(nz(-3, 3), 'y'), Q: k(nz(-3, 3), 'x'), region: 'circulo', cx: '0', cy: '0', rad: String(ent(1, 3)) }),
      () => { const x2 = ent(1, 3), y2 = ent(1, 3); return { modo: 'green', P: k(nz(-2, 2), 'x y'), Q: k(nz(-2, 2), 'x^2'), region: 'rectangulo', x1: '0', x2: String(x2), y1: '0', y2: String(y2) }; },
      () => { const a = nz(1, 2), b = nz(-2, 2); return { modo: 'vectorial', P: mas(k(2 * a, 'x y'), String(nz(1, 3))), Q: mas(k(a, 'x^2'), k(3 * b, 'y^2')), R: '', x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: '' }; },
      () => ({ modo: 'linea', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), R: '', curva: 'poligonal', vertices: `0 0; ${ent(1, 3)} 0; 0 ${ent(1, 3)}`, cierra: 'si' }),
      () => ({ modo: 'masa', f: ['1', 'x', 'y', 'x + y', 'x^2'][ent(0, 4)], curva: 'param', cx: `${ent(1, 3)} cos t`.replace(/^1 /, ''), cy: `${ent(1, 3)} sen t`.replace(/^1 /, ''), cz: '', a: '0', b: ['π/2', 'π'][ent(0, 1)] }),
      () => ({ modo: 'green', P: k(nz(-3, 3), 'y'), Q: k(nz(-3, 3), 'x'), region: 'poligono', vertices: `0 0; ${ent(1, 4)} 0; ${ent(0, 2)} ${ent(1, 3)}` }),
      () => ({ modo: 'green', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), region: 'curvas', g1: `x^${ent(2, 3)}`, g2: 'x', a: '0', b: '1' }),
      () => ({ modo: 'superficie', P: k(nz(-2, 2), 'x'), Q: k(nz(-2, 2), 'y'), R: k(nz(-2, 2), 'z'), sx: 'u', sy: 'v', sz: String(ent(1, 3)), u1: '0', u2: String(ent(1, 3)), v1: '0', v2: String(ent(1, 3)) }),
      () => { const R = ent(1, 3); return { modo: 'superficie', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), R: '0', sx: `${R} sen u cos v`.replace(/^1 /, ''), sy: `${R} sen u sen v`.replace(/^1 /, ''), sz: `${R} cos u`.replace(/^1 /, ''), u1: '0', u2: 'π/2', v1: '0', v2: '2π' }; },
      () => ({ modo: 'gauss', P: k(nz(-2, 2), 'x'), Q: k(nz(-2, 2), 'y'), R: k(nz(-2, 2), 'z'), solido: 'caja', x1: '0', x2: String(ent(1, 3)), y1: '0', y2: String(ent(1, 3)), z1: '0', z2: String(ent(1, 3)) }),
      () => ({ modo: 'gauss', P: k(nz(-2, 2), 'x'), Q: k(nz(-2, 2), 'y'), R: k(nz(-2, 2), 'z'), solido: ['esfera', 'cilindro'][ent(0, 1)], cx: '0', cy: '0', cz: '0', rad: String(ent(1, 2)), z1: '0', z2: String(ent(1, 3)) }),
    ];
    sc = tipos[ent(0, tipos.length - 1)]();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const F = () => `F = (${esc(sc.P || '0')}, ${esc(sc.Q || '0')}${sc.R ? `, ${esc(sc.R)}` : ''})`;
    const P = () => `(${esc(sc.x0)}, ${esc(sc.y0)}${sc.z0 ? `, ${esc(sc.z0)}` : ''})`;
    if (sc.modo === 'escalar') return `Calcula el gradiente de <b>f = ${esc(sc.f)}</b> en el punto ${P()}${sc.u ? ` y la derivada direccional en la dirección (${esc(sc.u)})` : ''}, y su laplaciano.`;
    if (sc.modo === 'vectorial') return `Calcula la divergencia y el rotacional de <b>${F()}</b> en ${P()}. ¿Es conservativo?`;
    const cur = () => (sc.curva === 'poligonal' ? `la poligonal ${esc(sc.vertices).split(';').map((q) => `(${q.trim().split(/[\s,]+/).join(', ')})`).join(' → ')}${sc.cierra === 'si' ? ' (cerrada)' : ''}` : `r(t) = (${esc(sc.cx)}, ${esc(sc.cy)}${sc.cz ? `, ${esc(sc.cz)}` : ''}) con t de ${esc(sc.a)} a ${esc(sc.b)}`);
    if (sc.modo === 'linea') return `Calcula el trabajo de <b>${F()}</b> a lo largo de ${cur()}.`;
    if (sc.modo === 'masa') return `Calcula <b>∫ f ds</b> con f = ${esc(sc.f)} a lo largo de ${cur()}. Si f es la densidad de un alambre, ¿cuál es su masa y su centro de masas?`;
    if (sc.modo === 'superficie') return `Calcula el flujo de <b>${F()}</b> a través de la superficie r(u, v) = (${esc(sc.sx)}, ${esc(sc.sy)}, ${esc(sc.sz)}) con u de ${esc(sc.u1)} a ${esc(sc.u2)} y v de ${esc(sc.v1)} a ${esc(sc.v2)}, y comprueba el teorema de Stokes.`;
    if (sc.modo === 'gauss') {
      const s3 = sc.solido === 'esfera' ? `la esfera de centro (${esc(sc.cx)}, ${esc(sc.cy)}, ${esc(sc.cz)}) y radio ${esc(sc.rad)}` : sc.solido === 'cilindro' ? `el cilindro de radio ${esc(sc.rad)} y eje vertical por (${esc(sc.cx)}, ${esc(sc.cy)}), con z de ${esc(sc.z1)} a ${esc(sc.z2)}` : `la caja [${esc(sc.x1)}, ${esc(sc.x2)}] × [${esc(sc.y1)}, ${esc(sc.y2)}] × [${esc(sc.z1)}, ${esc(sc.z2)}]`;
      return `Comprueba el teorema de la divergencia para <b>${F()}</b> en ${s3}: calcula el flujo hacia fuera y la integral triple de la divergencia.`;
    }
    const reg = sc.region === 'rectangulo' ? `el rectángulo [${esc(sc.x1)}, ${esc(sc.x2)}] × [${esc(sc.y1)}, ${esc(sc.y2)}]` : sc.region === 'poligono' ? `el polígono de vértices ${esc(sc.vertices).split(';').map((q) => `(${q.trim().split(/[\s,]+/).join(', ')})`).join(', ')}` : sc.region === 'curvas' ? `la región entre y = ${esc(sc.g1)} e y = ${esc(sc.g2)} con x de ${esc(sc.a)} a ${esc(sc.b)}` : `el círculo de centro (${esc(sc.cx)}, ${esc(sc.cy)}) y radio ${esc(sc.rad)}`;
    return `Comprueba el teorema de Green para <b>${F()}</b> en ${reg}: calcula la circulación por el borde y la integral doble del rotacional.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  const vec = (vs) => `(${vs.join(', ')})`;
  // decimal (lo que se pregunta en el modo práctica) y, si lo hay, el valor exacto al lado
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
    if (sol.modo === 'escalar') {
      h += dato('Gradiente', M(`∇f = ${vec(sol.grTxt)}`), 'ancho');
      h += dato(`∇f en ${pt}`, M(vec((d3 ? sol.g0 : sol.g0.slice(0, 2)).map((v) => C.ex(v)))));
      h += dato('|∇f|', nx(sol.mod), 'num');
      if (sol.du !== null) h += dato('Derivada direccional Dᵤf', nx(sol.du), 'num');
      h += dato('Laplaciano', M(`∇² f = ${sol.lapTxt}`) + (sol.armonica ? ' (armónica)' : ''));
    } else if (sol.modo === 'vectorial') {
      h += dato(`Divergencia en ${pt}`, nx(sol.div), 'num');
      h += dato(`Rotacional en ${pt}`, d3 ? M(vec(sol.rot0.map((v) => C.ex(v)))) : nx(sol.rot0[2]), d3 ? '' : 'num');
      h += dato('¿Conservativo?', sol.cons ? 'Sí' : 'No');
      if (sol.phiTxt) h += dato('Potencial', M(`φ = ${sol.phiTxt} + K`), 'ancho');
      if (sol.phi !== null) h += dato(`Potencial φ${pt}`, nx(sol.phi), 'num');
    } else if (sol.modo === 'masa') {
      h += dato('∫ f ds', nx(sol.I, 5), 'num');
      h += dato('Longitud', nx(sol.L, 5), 'num');
      h += dato('Valor medio de f', nx(sol.media, 5), 'num');
      h += sol.cm ? dato('Centro de masas', M(vec((d3 ? sol.cm : sol.cm.slice(0, 2)).map((v) => C.ex(v))))) : dato('Centroide de la curva', M(vec((d3 ? sol.cg : sol.cg.slice(0, 2)).map((v) => C.ex(v)))));
    } else if (sol.modo === 'superficie') {
      h += dato('Flujo ∬ F · dS', nx(sol.flujo, 5), 'num');
      h += dato('Área de la superficie', nx(sol.area, 5), 'num');
      h += dato('∬ (∇ × F) · dS', nx(sol.rotFlujo, 5), 'num');
      h += dato(sol.cerrada ? '∮ borde (no tiene)' : 'Circulación por el borde', nx(sol.circula, 5), 'num');
      if (!sol.stokes) h += dato('Atención', 'No coinciden: el campo tiene una singularidad sobre la superficie y Stokes no vale', 'ancho');
    } else if (sol.modo === 'gauss') {
      h += dato('Flujo hacia fuera ∯ F · dS', nx(sol.flujo, 5), 'num');
      h += dato('∭ div F dV', nx(sol.vol, 5), 'num');
      h += dato('Volumen', nx(sol.V, 5), 'num');
      if (sol.singular) h += dato('Atención', 'No coinciden: hay un punto dentro donde F no está definido y el teorema no vale', 'ancho');
    } else if (sol.modo === 'linea') {
      h += dato('Trabajo W', nx(sol.W, 5), 'num');
      if (sol.dphi !== null) h += dato('φ(B) − φ(A)', nx(sol.dphi, 5), 'num');
      h += dato('Longitud', nx(sol.L, 5), 'num');
      h += dato('¿Conservativo?', sol.cons ? 'Sí: no depende del camino' : 'No');
    } else {
      h += dato('Circulación ∮ F · dr', nx(sol.circula, 5), 'num');
      h += dato('∬ rot F dA', nx(sol.dobleR, 5), 'num');
      h += dato('Flujo ∮ F · n ds', nx(sol.flujo, 5), 'num');
      h += dato('∬ div F dA', nx(sol.dobleD, 5), 'num');
      h += dato('Área de D', nx(sol.area, 5), 'num');
      if (sol.singular) h += dato('Atención', 'No coinciden: hay un punto de D donde F no está definido y Green no vale', 'ancho');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    const corte = d3 && !['green', 'superficie', 'gauss'].includes(sol.modo) ? ` Es el corte por el plano z = ${fH(sol.p ? sol.p[2] : 0, 3)}${sol.modo === 'linea' || sol.modo === 'masa' ? ' y la curva vista desde arriba' : ''}.` : '';
    $('#leyenda').innerHTML = (sol.modo === 'escalar' ? `Mapa de color de f (azul, valores bajos; naranja, altos) con sus curvas de nivel y, en flechas grises, el gradiente. En color, ∇f en el punto${sol.u ? ' y en azul la dirección u' : ''}. Toca la gráfica para mover el punto.`
      : sol.modo === 'vectorial' ? 'Las flechas son la dirección del campo y las partículas lo siguen. El molinillo del punto gira según el rotacional. Toca la gráfica para mover el punto.'
        : sol.modo === 'linea' ? 'La curva va de A (hueco) a B (relleno). El punto que la recorre lleva la fuerza F (en color) y la velocidad r′(t) (en azul): el trabajo crece cuando van en el mismo sentido.'
          : sol.modo === 'masa' ? `Mapa de color de f (azul, valores bajos; naranja, altos) y la curva encima. La cruz es el ${sol.cm ? 'centro de masas del alambre' : 'centroide de la curva'}.`
            : sol.modo === 'superficie' ? `La superficie en perspectiva, girando. En color, la normal r_u × r_v; en azul, el campo F en los mismos puntos${sol.borde.length ? '; el borde, en trazo grueso' : ''}. Pulsa Parar para dejarla quieta.`
              : sol.modo === 'gauss' ? 'El sólido en perspectiva, girando, con el campo F (en color) en puntos de su borde: donde apunta hacia fuera, sale flujo. Pulsa Parar para dejarlo quieto.'
          : 'La región D sombreada y su borde recorrido en sentido antihorario. Las partículas siguen el campo: si giran, hay circulación; si salen, hay flujo.') + corte;
    V = null; fondo = null; parts = []; dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); fondo = null; }
  const marcas = Herramienta.marcas;
  function lienzo(s) {
    const r = Herramienta.lienzo(s);
    if (r.cambia) fondo = null;
    return r;
  }
  const mL = 40, mR = 12, mT = 12, mB = 26;
  // ventana con la misma escala en x y en y, para que los círculos sean círculos
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
  // mapa de color de f y curvas de nivel (marching squares), guardado en un lienzo aparte
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
  // flechas del campo, todas del mismo largo; la opacidad dice el módulo
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
  // superficies y sólidos en perspectiva (giro alrededor del eje z, vistos un poco desde arriba)
  function dibuja3(g, w, h) {
    const todos = sol.lineas.flat(), lo = [0, 1, 2].map((i) => Math.min(...todos.map((p) => p[i]))), hi = [0, 1, 2].map((i) => Math.max(...todos.map((p) => p[i])));
    const c = lo.map((v, i) => (v + hi[i]) / 2), diag = Math.max(1e-9, Math.hypot(...hi.map((v, i) => v - lo[i]))), el = 0.42;
    const k = (0.8 * Math.min(w, h)) / diag, ca = Math.cos(az), sa = Math.sin(az);
    const pr = (p) => { const q = [p[0] - c[0], p[1] - c[1], p[2] - c[2]], x = q[0] * ca - q[1] * sa, y = q[0] * sa + q[1] * ca; return [w / 2 + k * x, h / 2 - k * (q[2] * Math.cos(el) + y * Math.sin(el))]; };
    const linea = (ps) => { g.beginPath(); ps.forEach((p, i) => { const [x, y] = pr(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
    const flecha3 = (p, v, L) => { const m = Math.hypot(...v); if (!(m > 0) || !isFinite(m)) return; const a = pr(p), b = pr(p.map((q, i) => q + (v[i] / m) * L)); g.beginPath(); flecha(g, a[0], a[1], b[0] - a[0], b[1] - a[1], Math.hypot(b[0] - a[0], b[1] - a[1]), 4); g.stroke(); };
    // ejes desde el centro de la figura
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
  function dibuja(dt = 0) {
    const { g, w, h } = lienzo('#grafica');
    trans = null;
    if (!sol) return;
    if (!col['--ink']) colores();
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
        // molinillo: gira con la mitad del rotacional (la velocidad angular del fluido)
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
        // flechas de sentido antihorario sobre el borde
        g.fillStyle = col['--ink'];
        for (const s of [0.125, 0.375, 0.625, 0.875]) { const a = sol.borde(s), b = sol.borde(s + 0.004), dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]); g.beginPath(); flecha(g, X(a[0]) - dx, Y(a[1]) - dy, dx, dy, 2, 6); g.stroke(); }
        const q = sol.borde(u % 1); circulo(g, X(q[0]), Y(q[1]), 5.5, col['--accent']);
      }
    }
    g.restore();
  }
  // tocar la gráfica mueve el punto (o el centro del círculo de Green)
  $('#grafica').addEventListener('click', (e) => {
    if (!sol || !trans || ['linea', 'masa', ...D3].includes(sol.modo) || (sol.modo === 'green' && sc.region !== 'circulo')) return;
    const r = e.target.getBoundingClientRect(), x = trans.x(e.clientX - r.left), y = trans.y(e.clientY - r.top);
    const red = (v) => coma(+v.toPrecision(3));
    if (sol.modo === 'green') { sc.cx = red(x); sc.cy = red(y); } else { sc.x0 = red(x); sc.y0 = red(y); }
    const V0 = sol.modo === 'green' ? null : V;
    formulario(); cambia(); if (V0 && sol) { V = V0; fondo = null; dibuja(); }
  });
  $('#animar').addEventListener('click', () => { anda = !anda; $('#animar').textContent = anda ? '⏸ Parar' : '▶ Animar'; });
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
  window.CamposApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, g0: sol.g0, du: sol.du, div: sol.div, rot0: sol.rot0, phi: sol.phi, phiTxt: sol.phiTxt, W: sol.W, I: sol.I, cm: sol.cm, circula: sol.circula, dobleR: sol.dobleR, flujo: sol.flujo, dobleD: sol.dobleD, rotFlujo: sol.rotFlujo, vol: sol.vol }, estado: () => copia(sc) };
})();
