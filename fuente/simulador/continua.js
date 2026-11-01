/* =====================================================================
   Circuitos de corriente continua (sin DOM): resistencias, fuentes de
   tensión y de corriente, fuentes dependientes, y condensadores y bobinas
   en régimen permanente, entre nudos con nombre. Se resuelve por el método
   de los nudos (análisis nodal modificado): incógnitas, los potenciales de
   los nudos y la corriente de cada elemento que fija una tensión (fuentes
   de tensión y bobinas). Después, corriente y potencia de cada elemento,
   balance de potencias, el equivalente de Thévenin y de Norton visto por
   una resistencia o entre dos nudos, superposición y método de las mallas.
   Convenios: en cada elemento la corriente I va de A a B; en una fuente de
   tensión A es el borne positivo (V_A − V_B = E); en una fuente de
   corriente la corriente J va de A a B por dentro de la fuente.
   Fuentes dependientes: VV (tensión = k·(V_c − V_d)), VI (tensión = r·I_x),
   IV (corriente = g·(V_c − V_d)) e II (corriente = β·I_x), con I_x la
   corriente de A a B del elemento que controla.
   ===================================================================== */
const Continua = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (x < -1e-10 ? `(${f(x)})` : f(x));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const TIPOS = {
    R: { nombre: 'Resistencia', letra: 'R', un: 'Ω' },
    V: { nombre: 'Fuente de tensión', letra: 'E', un: 'V' },
    I: { nombre: 'Fuente de corriente', letra: 'J', un: 'A' },
    C: { nombre: 'Condensador', letra: 'C', un: 'μF', base: 1e-6 },
    L: { nombre: 'Bobina', letra: 'L', un: 'mH', base: 1e-3 },
    VV: { nombre: 'Fuente de tensión controlada por tensión', letra: 'Ed', un: 'V/V', k: 'k', ctrl: 'V' },
    VI: { nombre: 'Fuente de tensión controlada por corriente', letra: 'Ed', un: 'Ω', k: 'r', ctrl: 'I' },
    IV: { nombre: 'Fuente de corriente controlada por tensión', letra: 'Jd', un: 'S', k: 'g', ctrl: 'V' },
    II: { nombre: 'Fuente de corriente controlada por corriente', letra: 'Jd', un: 'A/A', k: 'β', ctrl: 'I' },
  };
  const FIJA_TENSION = new Set(['V', 'L', 'VV', 'VI']); // su corriente es una incógnita más
  const DEPENDIENTE = new Set(['VV', 'VI', 'IV', 'II']);
  const sub = (n) => n.replace(/^([A-Za-z])(\w+)$/, '$1<sub>$2</sub>');
  const Vn = (n, ref) => (n === ref ? '0' : `V<sub>${n}</sub>`);
  const dif = (a, b, ref) => (b === ref ? Vn(a, ref) : a === ref ? `−${Vn(b, ref)}` : `(${Vn(a, ref)} − ${Vn(b, ref)})`);
  const NUDO = /^[\wÀ-ÿ]{1,8}$/;

  // R1, R2, E1, J1, Ed1… según el orden en la lista
  function nombres(els) {
    const c = {};
    return els.map((e) => { const l = (TIPOS[e.t] || TIPOS.R).letra; c[l] = (c[l] || 0) + 1; return `${l}${c[l]}`; });
  }

  function leer(sc) {
    const crudos = sc.elementos || [];
    if (!crudos.length) throw new Error('Añade al menos un elemento');
    const nom = nombres(crudos);
    const els = crudos.map((e, i) => {
      const q = nom[i], T = TIPOS[e.t];
      if (!T) throw new Error(`${q}: tipo desconocido`);
      const a = String(e.a ?? '').trim(), b = String(e.b ?? '').trim();
      if (!a || !b) throw new Error(`${q}: faltan los nudos`);
      if (!NUDO.test(a) || !NUDO.test(b)) throw new Error(`${q}: los nudos se nombran con letras o números (hasta 8)`);
      if (a === b) throw new Error(`${q}: está conectado entre el mismo nudo por los dos lados`);
      if (vacio(e.v)) throw new Error(`${q}: falta el ${T.k ? `factor ${T.k}` : 'valor'}`);
      const v = Herramienta.leeSI(e.v, T.base || 1); // admite 4k7, 1,5k, 100m…
      if (!isFinite(v)) throw new Error(`${q}: el valor debe ser un número`);
      if ('RCL'.includes(e.t) && v <= 0) throw new Error(`${q}: ${e.t === 'R' ? 'la resistencia' : e.t === 'C' ? 'la capacidad' : 'la inductancia'} debe ser mayor que 0`);
      const el = { i, t: e.t, n: q, a, b, v };
      if (T.ctrl === 'V') {
        el.c = String(e.c ?? '').trim(); el.d = String(e.d ?? '').trim();
        if (!el.c || !el.d) throw new Error(`${q}: faltan los nudos de la tensión que la controla`);
        if (!NUDO.test(el.c) || !NUDO.test(el.d)) throw new Error(`${q}: los nudos de control se nombran con letras o números (hasta 8)`);
        if (el.c === el.d) throw new Error(`${q}: la tensión que la controla es entre el mismo nudo`);
      } else if (T.ctrl === 'I') {
        const x = String(e.x ?? '').trim().toUpperCase(), j = nom.findIndex((m) => m.toUpperCase() === x);
        if (!x) throw new Error(`${q}: falta el elemento cuya corriente la controla`);
        if (j < 0) throw new Error(`${q}: no hay ningún elemento llamado ${e.x}`);
        if (j === i) throw new Error(`${q}: no puede controlarla su propia corriente`);
        el.x = nom[j];
      }
      return el;
    });
    const nudos = new Set(els.flatMap((e) => [e.a, e.b]));
    for (const e of els) for (const n of [e.c, e.d]) if (n !== undefined && !nudos.has(n)) throw new Error(`${e.n}: el nudo de control ${n} no está en el circuito`);
    return els;
  }

  // Resuelve A x = b por Gauss con pivote parcial; null si es singular
  function gauss(A, b) {
    const n = b.length, M = A.map((f, i) => [...f, b[i]]);
    const escala = Math.max(1e-300, ...A.flat().map(Math.abs));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-12 * escala) return null;
      [M[c], M[piv]] = [M[piv], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; if (k) for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((f, i) => f[n] / f[i]);
  }

  // Análisis nodal modificado: cada corriente y cada tensión es una forma lineal { c, k } de las incógnitas
  function nodal(els, ref) {
    const nudos = [];
    for (const e of els) for (const n of [e.a, e.b]) if (!nudos.includes(n)) nudos.push(n);
    const inc = nudos.filter((n) => n !== ref), fuentes = els.filter((e) => FIJA_TENSION.has(e.t));
    const N = inc.length + fuentes.length, porNombre = Object.fromEntries(els.map((e) => [e.n, e]));
    const forma = (k = 0) => ({ c: Array(N).fill(0), k });
    const suma = (...ts) => ts.reduce((s, [q, x]) => ({ c: s.c.map((v, j) => v + q * x.c[j]), k: s.k + q * x.k }), forma());
    const pot = (n) => { const x = forma(); if (n !== ref && inc.includes(n)) x.c[inc.indexOf(n)] = 1; return x; };
    function corr(e, vistos = []) {
      if (vistos.includes(e.n)) throw new Error(`${vistos[0]}: las fuentes dependientes se controlan unas a otras en círculo`);
      if (e.t === 'R') return suma([1 / e.v, pot(e.a)], [-1 / e.v, pot(e.b)]);
      if (FIJA_TENSION.has(e.t)) { const x = forma(); x.c[inc.length + fuentes.indexOf(e)] = 1; return x; }
      if (e.t === 'I') return forma(e.v);
      if (e.t === 'C') return forma();
      if (e.t === 'IV') return suma([e.v, pot(e.c)], [-e.v, pot(e.d)]);
      const ctrl = porNombre[e.x];
      if (!ctrl) throw new Error(`${e.n}: el elemento ${e.x} que la controla no está`);
      return suma([e.v, corr(ctrl, [...vistos, e.n])]); // II
    }
    const A = [], b = [];
    for (const n of inc) {
      const x = suma(...els.filter((e) => e.a === n || e.b === n).map((e) => [e.a === n ? 1 : -1, corr(e)]));
      A.push(x.c); b.push(-x.k);
    }
    for (const e of fuentes) {
      const u = suma([1, pot(e.a)], [-1, pot(e.b)]);
      const x = e.t === 'V' ? suma([1, u], [1, forma(-e.v)]) : e.t === 'L' ? u : e.t === 'VV' ? suma([1, u], [-e.v, pot(e.c)], [e.v, pot(e.d)]) : suma([1, u], [-e.v, corr(porNombre[e.x] || (() => { throw new Error(`${e.n}: el elemento ${e.x} que la controla no está`); })(), [e.n])]);
      A.push(x.c); b.push(-x.k);
    }
    const x = N ? gauss(A, b) : [];
    if (!x) return null;
    const val = (q) => q.c.reduce((s, v, j) => s + v * x[j], q.k);
    const V = Object.fromEntries(nudos.map((n) => [n, n === ref ? 0 : x[inc.indexOf(n)]]));
    const I = Object.fromEntries(els.map((e) => [e.n, val(corr(e))]));
    return { nudos, inc, fuentes, A, b, x, V, I };
  }

  // Nudos que no están unidos al primero
  function conectado(els) {
    const ady = {};
    for (const e of els) { (ady[e.a] ||= []).push(e.b); (ady[e.b] ||= []).push(e.a); }
    const nudos = Object.keys(ady), visto = new Set([nudos[0]]), pila = [nudos[0]];
    while (pila.length) for (const m of ady[pila.pop()]) if (!visto.has(m)) { visto.add(m); pila.push(m); }
    return nudos.filter((n) => !visto.has(n));
  }

  const matHtml = (M) => `<span class="mat"><span class="mat-in" style="grid-template-columns:repeat(${M[0].length}, auto)">${M.flat().map((v) => `<span>${v}</span>`).join('')}</span></span>`;
  const SINGULAR = 'El sistema no tiene solución única: revisa que no haya fuentes de tensión (o bobinas) en paralelo o formando un lazo, fuentes de corriente (o condensadores) en serie, o un nudo al que solo llegan fuentes de corriente o condensadores';

  // Texto de la ley de los nudos para el término de un elemento en el nudo n (corriente que sale)
  function termino(e, n, ref) {
    const s = e.a === n ? '+' : '−', otro = e.a === n ? e.b : e.a;
    if (e.t === 'R') return `${s} ${otro === ref ? Vn(n, ref) : `(${Vn(n, ref)} − ${Vn(otro, ref)})`}/${f(e.v)}`;
    if (FIJA_TENSION.has(e.t)) return `${s} I<sub>${e.n}</sub>`;
    if (e.t === 'IV') return `${s} ${f(e.v)}·${dif(e.c, e.d, ref)}`;
    if (e.t === 'II') return `${s} ${f(e.v)}·I<sub>${e.x}</sub>`;
    return null;
  }
  const junta = (ts) => ts.join(' ').replace(/^\+ /, '').replace(/^− /, '−') || '0';

  // Equivalente de Thévenin entre a y b; si hay carga, sin ella
  function thevenin(els, a, b, ref, L) {
    const resto = L ? els.filter((e) => e !== L) : els, quien = L ? `Al quitar ${L.n}` : 'Entre esos nudos';
    if (L) {
      const dep = resto.find((e) => e.x === L.n);
      if (dep) throw new Error(`${dep.n} depende de la corriente de ${L.n}: no se puede quitar para el equivalente de Thévenin`);
      if (!resto.length || conectado(resto).length || ![a, b].every((n) => resto.some((e) => e.a === n || e.b === n))) throw new Error(`Al quitar ${L.n} el circuito queda partido: no hay equivalente de Thévenin entre ${a} y ${b}`);
    }
    const r = resto.some((e) => e.a === ref || e.b === ref) ? ref : a;
    const ab = nodal(resto, r);
    if (!ab) throw new Error(`${quien} el sistema no tiene solución única`);
    const Vth = ab.V[a] - ab.V[b];
    // fuentes independientes apagadas (tensión → cortocircuito, corriente → abierto) y 1 A inyectado de b a a por fuera
    const apagado = resto.map((e) => (e.t === 'V' || e.t === 'I' ? { ...e, v: 0 } : e)).concat([{ t: 'I', n: 'Jp', a: b, b: a, v: 1 }]);
    const pr = nodal(apagado, r);
    if (!pr) throw new Error(`Con las fuentes apagadas no se puede calcular la resistencia de Thévenin entre ${a} y ${b}`);
    const Rmax = Math.max(1, ...resto.filter((e) => e.t === 'R').map((e) => e.v), L ? L.v : 0), ideal = Math.abs(pr.V[a] - pr.V[b]) < 1e-9 * Rmax;
    const Rth = ideal ? 0 : pr.V[a] - pr.V[b], IN = ideal ? Infinity : Vth / Rth, Pmax = ideal || Rth < 0 ? Infinity : (Vth * Vth) / (4 * Rth);
    return { a, b, Vth, Rth, IN, Pmax, ideal, dep: resto.some((e) => DEPENDIENTE.has(e.t)) };
  }

  // Método de las mallas con lazos independientes: árbol con las fuentes de tensión y las bobinas, y una malla por cada eslabón
  function mallas(els, sol) {
    if (els.some((e) => DEPENDIENTE.has(e.t))) return { nota: 'Con fuentes dependientes el desarrollo se hace solo por el método de los nudos.' };
    const padre = {}, raiz = (n) => (padre[n] === undefined || padre[n] === n ? n : (padre[n] = raiz(padre[n])));
    const orden = (e) => ({ V: 0, L: 0, R: 1, C: 2, I: 2 }[e.t]), arbol = [], eslabones = [];
    for (const e of [...els].sort((x, y) => orden(x) - orden(y) || x.i - y.i)) {
      const ra = raiz(e.a), rb = raiz(e.b);
      if (ra !== rb) { padre[ra] = rb; arbol.push(e); } else eslabones.push(e);
    }
    if (arbol.some((e) => e.t === 'I' || e.t === 'C')) return { nota: 'Aquí no se puede plantear por mallas: hay nudos a los que solo llegan fuentes de corriente o condensadores.' };
    eslabones.sort((x, y) => x.i - y.i);
    // camino por el árbol de u a w: lista de [elemento, sentido]
    const camino = (u, w) => {
      const prev = { [u]: null }, cola = [u];
      while (cola.length) { const n = cola.shift(); if (n === w) break; for (const e of arbol) for (const [x, y, s] of [[e.a, e.b, 1], [e.b, e.a, -1]]) if (x === n && !(y in prev)) { prev[y] = [e, s, n]; cola.push(y); } }
      const out = []; for (let n = w; prev[n]; n = prev[n][2]) out.unshift([prev[n][0], prev[n][1]]);
      return out;
    };
    const lazos = eslabones.map((l) => [[l, 1], ...camino(l.b, l.a)]);
    const conocida = eslabones.map((l) => (l.t === 'I' ? l.v : l.t === 'C' ? 0 : null));
    const inc = lazos.map((_, k) => k).filter((k) => conocida[k] === null);
    const sentido = (lz, e) => (lz.find(([x]) => x === e) || [null, 0])[1];
    const A = [], b = [], ecs = [];
    for (const m of inc) {
      const fila = inc.map((k) => lazos[m].filter(([e]) => e.t === 'R').reduce((s, [e, sm]) => s + sm * sentido(lazos[k], e) * e.v, 0));
      let rhs = -lazos[m].filter(([e]) => e.t === 'V').reduce((s, [e, sm]) => s + sm * e.v, 0);
      lazos.forEach((lz, k) => { if (conocida[k] !== null) rhs -= lazos[m].filter(([e]) => e.t === 'R').reduce((s, [e, sm]) => s + sm * sentido(lz, e) * e.v, 0) * conocida[k]; });
      A.push(fila); b.push(rhs);
      const izq = fila.map((v, j) => (Math.abs(v) < 1e-12 ? '' : `${v < 0 ? '−' : '+'} ${Math.abs(Math.abs(v) - 1) < 1e-12 ? '' : `${f(Math.abs(v))}·`}I<sub>${inc[j] + 1}</sub>`)).filter(Boolean);
      ecs.push(`Malla ${m + 1} (${lazos[m].map(([e]) => sub(e.n)).join(' → ')}): ${junta(izq)} = ${f(rhs)}`);
    }
    const x = inc.length ? gauss(A, b) : [];
    if (!x) return { nota: 'El sistema de mallas no tiene solución única.' };
    const Im = lazos.map((_, k) => (conocida[k] !== null ? conocida[k] : x[inc.indexOf(k)]));
    const rama = Object.fromEntries(els.map((e) => [e.n, lazos.reduce((s, lz, k) => s + sentido(lz, e) * Im[k], 0)]));
    const ok = els.every((e) => Math.abs(rama[e.n] - sol.I[e.n]) <= 1e-7 * Math.max(1, Math.abs(sol.I[e.n])));
    return { lazos, conocida, inc, A, b, Im, rama, ok, ecs, ramas: els.length, nudos: sol.nudos.length };
  }

  function resolver(sc) {
    const els = leer(sc);
    const todos = [...new Set(els.flatMap((e) => [e.a, e.b]))];
    const ref = todos.includes('0') ? '0' : todos.includes('tierra') ? 'tierra' : todos[0];
    const sueltos = conectado(els);
    if (sueltos.length) throw new Error(`El circuito está partido: ${sueltos.join(', ')} no están unidos al resto`);
    const sol = nodal(els, ref);
    if (!sol) throw new Error(SINGULAR);
    const { V, inc, fuentes } = sol, deps = els.filter((e) => DEPENDIENTE.has(e.t));
    const pasos = [];
    pasos.push({ t: 'Nudos y referencia', html: `Nudos: ${sol.nudos.map((n) => `<b>${n}</b>`).join(', ')}. Tomamos <b>${ref}</b> como referencia (V = 0)${ref !== '0' ? ' porque no hay ningún nudo llamado 0' : ''}.<br>Incógnitas: ${[...inc.map((n) => `V<sub>${n}</sub>`), ...fuentes.map((e) => `I<sub>${e.n}</sub> (corriente por ${sub(e.n)}, de ${e.a} a ${e.b}${e.t === 'L' ? '' : ', del borne + al −, por dentro'})`)].join(', ') || 'ninguna'}.${els.some((e) => e.t === 'C' || e.t === 'L') ? '<br>En régimen permanente de continua un condensador es un circuito abierto (no pasa corriente) y una bobina, un cortocircuito (tensión 0).' : ''}` });
    if (deps.length) pasos.push({ t: 'Fuentes dependientes', html: deps.map((e) => `${sub(e.n)}: ${e.t[0] === 'V' ? `V<sub>${e.a}</sub> − V<sub>${e.b}</sub>` : `corriente de ${e.a} a ${e.b}`} = ${f(e.v)}·${e.t[1] === 'V' ? `(V<sub>${e.c}</sub> − V<sub>${e.d}</sub>)` : `I<sub>${e.x}</sub>`}`).join('<br>') + (deps.some((e) => e.x) ? '<br>' + [...new Set(deps.filter((e) => e.x).map((e) => e.x))].map((n) => { const c = els.find((e) => e.n === n); return `I<sub>${n}</sub> = ${c.t === 'R' ? `${dif(c.a, c.b, ref)}/${f(c.v)}` : FIJA_TENSION.has(c.t) ? `I<sub>${n}</sub> (es una incógnita)` : c.t === 'I' ? f(c.v) : c.t === 'C' ? '0' : `la de ${sub(n)}`}`; }).join('<br>') : '') + '<br>Las fuentes dependientes no se apagan nunca: ni en Thévenin ni en superposición.' });
    // ecuaciones de nudos: corrientes que salen = lo que inyectan las fuentes de corriente independientes
    const ecs = inc.map((n) => {
      const t = [], rhs = [];
      for (const e of els) {
        if (e.a !== n && e.b !== n) continue;
        if (e.t === 'I') rhs.push(`${e.a === n ? '−' : '+'} ${f(e.v)}`);
        else { const q = termino(e, n, ref); if (q) t.push(q); }
      }
      return `Nudo ${n}: ${junta(t)} = ${junta(rhs)}`;
    });
    const ecV = fuentes.map((e) => `${sub(e.n)}: ${Vn(e.a, ref)} − ${Vn(e.b, ref)} = ${e.t === 'V' ? f(e.v) : e.t === 'L' ? '0 (cortocircuito)' : e.t === 'VV' ? `${f(e.v)}·${dif(e.c, e.d, ref)}` : `${f(e.v)}·I<sub>${e.x}</sub>`}`.replace(/ − 0 =/, ' =').replace(/^([^:]+): 0 − /, '$1: −'));
    pasos.push({ t: 'Primera ley de Kirchhoff en cada nudo: las corrientes que salen suman lo que inyectan las fuentes de corriente', html: ecs.join('<br>') + (ecV.length ? `<br><br>Cada fuente de tensión${fuentes.some((e) => e.t === 'L') ? ' y cada bobina' : ''} fija la diferencia de potencial entre sus bornes:<br>${ecV.join('<br>')}` : '') });
    if (sol.A.length) {
      const incTxt = [...inc.map((n) => `V<sub>${n}</sub>`), ...fuentes.map((e) => `I<sub>${e.n}</sub>`)];
      pasos.push({ t: 'Sistema en forma matricial', html: `${matHtml(sol.A.map((fi) => fi.map((v) => f(v))))} · ${matHtml(incTxt.map((v) => [v]))} = ${matHtml(sol.b.map((v) => [f(v)]))}` });
      pasos.push({ t: 'Solución', html: [...inc.map((n) => `V<sub>${n}</sub> = <b>${f(V[n])} V</b>`), ...fuentes.map((e) => `I<sub>${e.n}</sub> = <b>${f(sol.I[e.n])} A</b>`)].join(', &nbsp; ') });
    }
    // corriente y potencia de cada elemento (I de A a B; potencia absorbida U·I con U = V_A − V_B)
    const res = els.map((e) => {
      const U = V[e.a] - V[e.b], I = sol.I[e.n], P = U * I; // absorbida (negativa = entrega)
      const W = e.t === 'C' ? 0.5 * e.v * U * U : e.t === 'L' ? 0.5 * e.v * I * I : null;
      return { ...e, U, I, P, W };
    });
    const que = (r) => (r.P < -1e-12 ? 'entrega' : r.P > 1e-12 ? 'consume' : 'ni entrega ni consume');
    pasos.push({ t: 'Corriente y potencia de cada elemento', html: res.map((r) => {
      if (r.t === 'R') return `${sub(r.n)}: I = ${dif(r.a, r.b, ref)}/${sub(r.n)} = ${r.b === ref ? p(V[r.a]) : r.a === ref ? `−${p(V[r.b])}` : `(${f(V[r.a])} − ${p(V[r.b])})`}/${f(r.v)} = <b>${f(Math.abs(r.I))} A</b>${Math.abs(r.I) > 1e-12 ? ` de ${r.I > 0 ? r.a : r.b} a ${r.I > 0 ? r.b : r.a}` : ''}; &nbsp; P = I<sup>2</sup>R = <b>${f(r.P)} W</b>`;
      if (r.t === 'V') return `${sub(r.n)}: I = ${f(r.I)} A ${r.I < -1e-12 ? '(sale por el borne +)' : r.I > 1e-12 ? '(entra por el borne +)' : ''}; &nbsp; P = E·I = <b>${f(Math.abs(r.P))} W</b> (${que(r)})`;
      if (r.t === 'C') return `${sub(r.n)}: no pasa corriente; tensión U = ${dif(r.a, r.b, ref).replace(/^\((.*)\)$/, '$1')} = ${f(r.U)} V, carga q = CU = <b>${f(r.v * r.U)} C</b> y energía ½CU<sup>2</sup> = <b>${f(r.W)} J</b>`;
      if (r.t === 'L') return `${sub(r.n)}: tensión 0; I = <b>${f(Math.abs(r.I))} A</b>${Math.abs(r.I) > 1e-12 ? ` de ${r.I > 0 ? r.a : r.b} a ${r.I > 0 ? r.b : r.a}` : ''} y energía ½LI<sup>2</sup> = <b>${f(r.W)} J</b>`;
      if (r.t === 'VV' || r.t === 'VI') return `${sub(r.n)}: tensión ${f(r.U)} V, I = ${f(r.I)} A (de ${r.a} a ${r.b} por dentro); &nbsp; P = U·I = <b>${f(Math.abs(r.P))} W</b> (${que(r)})`;
      return `${sub(r.n)}: ${r.t === 'I' ? '' : `corriente ${f(r.I)} A; `}tensión entre sus bornes U = ${Vn(r.a, ref)} − ${Vn(r.b, ref)} = ${f(r.U)} V; &nbsp; P = U·${r.t === 'I' ? 'J' : 'I'} = <b>${f(Math.abs(r.P))} W</b> (${que(r)})`;
    }).join('<br>') });
    const ent = -res.filter((r) => r.P < 0).reduce((s, r) => s + r.P, 0), abs = res.filter((r) => r.P > 0).reduce((s, r) => s + r.P, 0);
    pasos.push({ t: 'Balance de potencias', html: `Entregada: ${f(ent)} W; &nbsp; consumida: ${f(abs)} W. ${Math.abs(ent - abs) <= 1e-9 * Math.max(1, ent) ? 'Coinciden, como debe ser.' : 'No coinciden: revisa los datos.'}` });

    // Thévenin visto por una resistencia de carga o entre dos nudos
    let thev = null;
    if (sc.carga === 'nudos') {
      const a = String(sc.thA ?? '').trim(), b = String(sc.thB ?? '').trim();
      if (!sol.nudos.includes(a) || !sol.nudos.includes(b)) throw new Error('Elige los dos nudos entre los que quieres el equivalente de Thévenin');
      if (a === b) throw new Error('El equivalente de Thévenin tiene que ser entre dos nudos distintos');
      thev = { ...thevenin(els, a, b, ref, null), carga: null };
      const t = thev;
      pasos.push({ t: `Equivalente de Thévenin entre ${a} y ${b}`, html: `V<sub>th</sub> = V<sub>${a}</sub> − V<sub>${b}</sub> = ${f(V[a])} − ${p(V[b])} = <b>${f(t.Vth)} V</b> (la tensión en circuito abierto, la del circuito tal cual)<br>Con las fuentes independientes apagadas (las de tensión en cortocircuito y las de corriente abiertas)${t.dep ? ', las dependientes encendidas y 1 A inyectado entre los dos nudos' : ''}, la resistencia entre ${a} y ${b} es R<sub>th</sub> = <b>${f(t.Rth)} Ω</b><br>${t.ideal ? `Con R<sub>th</sub> = 0 entre ${a} y ${b} hay una fuente de tensión ideal: no tiene equivalente de Norton.` : `Norton: I<sub>N</sub> = V<sub>th</sub>/R<sub>th</sub> = <b>${f(t.IN)} A</b>${t.Rth > 0 ? `<br>Una carga entre ${a} y ${b} recibe la máxima potencia si vale R<sub>th</sub> = ${f(t.Rth)} Ω: P<sub>máx</sub> = V<sub>th</sub><sup>2</sup>/(4R<sub>th</sub>) = <b>${f(t.Pmax)} W</b>` : ''}`}` });
    } else if (!vacio(sc.carga)) {
      const L = els[+sc.carga];
      if (!L || L.t !== 'R') throw new Error('La carga para el equivalente de Thévenin tiene que ser una resistencia');
      const t = thevenin(els, L.a, L.b, ref, L), { Vth, Rth, ideal } = t;
      const IL = Vth / (Rth + L.v), PL = IL * IL * L.v;
      thev = { ...t, carga: L.n, RL: L.v, IL, PL };
      pasos.push({ t: `Equivalente de Thévenin visto por ${L.n} (entre ${L.a} y ${L.b})`, html: `Se quita ${sub(L.n)} y se resuelve igual: V<sub>th</sub> = V<sub>${L.a}</sub> − V<sub>${L.b}</sub> en circuito abierto = <b>${f(Vth)} V</b><br>Con las fuentes ${t.dep ? 'independientes ' : ''}apagadas (las de tensión en cortocircuito y las de corriente abiertas)${t.dep ? ' y las dependientes encendidas' : ''}, la resistencia entre ${L.a} y ${L.b} es R<sub>th</sub> = <b>${f(Rth)} Ω</b><br>${ideal ? `Con R<sub>th</sub> = 0 lo que ve ${sub(L.n)} es una fuente de tensión ideal: no tiene equivalente de Norton, porque I<sub>N</sub> = V<sub>th</sub>/R<sub>th</sub> sería infinita.` : `Norton: I<sub>N</sub> = V<sub>th</sub>/R<sub>th</sub> = <b>${f(t.IN)} A</b>`}` });
      pasos.push({ t: 'Con la carga puesta y máxima transferencia de potencia', html: `I<sub>${L.n}</sub> = V<sub>th</sub>/(R<sub>th</sub> + ${sub(L.n)}) = ${f(Vth)}/(${f(Rth)} + ${f(L.v)}) = <b>${f(IL)} A</b> (coincide con la del circuito completo); P = <b>${f(PL)} W</b><br>${ideal ? `Con R<sub>th</sub> = 0 la tensión en la carga es siempre V<sub>th</sub> y su potencia V<sub>th</sub><sup>2</sup>/${sub(L.n)} crece sin límite al bajar ${sub(L.n)}: no hay máxima transferencia de potencia.` : Rth < 0 ? 'Con R<sub>th</sub> negativa (por las fuentes dependientes) no hay un valor de la carga que dé la máxima potencia.' : `La potencia en la carga es máxima si ${sub(L.n)} = R<sub>th</sub> = ${f(Rth)} Ω: P<sub>máx</sub> = V<sub>th</sub><sup>2</sup>/(4R<sub>th</sub>) = <b>${f(t.Pmax)} W</b>`}` });
    }

    // Superposición: cada fuente independiente sola, con las demás apagadas
    let superposicion = null;
    const indep = els.filter((e) => e.t === 'V' || e.t === 'I');
    if (sc.superposicion && indep.length >= 2) {
      const otros = sol.nudos.filter((n) => n !== ref), rs = els.filter((e) => e.t === 'R');
      const filas = indep.map((s) => {
        const parcial = nodal(els.map((e) => (e !== s && (e.t === 'V' || e.t === 'I') ? { ...e, v: 0 } : e)), ref);
        return { fuente: s.n, V: Object.fromEntries(otros.map((n) => [n, parcial.V[n]])), I: Object.fromEntries(rs.map((e) => [e.n, parcial.I[e.n]])) };
      });
      const total = { V: Object.fromEntries(otros.map((n) => [n, filas.reduce((s, q) => s + q.V[n], 0)])), I: Object.fromEntries(rs.map((e) => [e.n, filas.reduce((s, q) => s + q.I[e.n], 0)])) };
      const ok = otros.every((n) => Math.abs(total.V[n] - V[n]) <= 1e-9 * Math.max(1, Math.abs(V[n])));
      superposicion = { filas, total, ok };
      const cab = [...otros.map((n) => `V<sub>${n}</sub> (V)`), ...rs.map((e) => `I<sub>${e.n}</sub> (A)`)];
      const fila = (t, q) => `<tr><th>${t}</th>${otros.map((n) => `<td>${f(q.V[n])}</td>`).join('')}${rs.map((e) => `<td>${f(q.I[e.n])}</td>`).join('')}</tr>`;
      pasos.push({ t: 'Superposición: cada fuente independiente por separado', html: `Se deja encendida una sola fuente independiente cada vez (las de tensión apagadas son un cortocircuito y las de corriente, un circuito abierto${deps.length ? '; las dependientes siguen' : ''}) y se suman los resultados. Las corrientes van de A a B de cada resistencia.<div class="tabla-scroll"><table class="tabla"><tr><th>Solo con</th>${cab.map((c) => `<th>${c}</th>`).join('')}</tr>${filas.map((q) => fila(sub(q.fuente), q)).join('')}${fila('Suma', total)}</table></div>${ok ? 'La suma coincide con lo que da el circuito completo.' : 'La suma no coincide: revisa los datos.'} La potencia no se puede sumar así, porque va con el cuadrado de la corriente.` });
    } else if (sc.superposicion) pasos.push({ t: 'Superposición', html: 'Hace falta más de una fuente independiente para aplicar superposición.' });

    // Método de las mallas
    let malla = null;
    if (sc.mallas) {
      malla = mallas(els, sol);
      if (malla.nota) pasos.push({ t: 'Método de las mallas', html: malla.nota });
      else {
        const m = malla, n = m.lazos.length;
        const conoc = m.lazos.map((lz, k) => (m.conocida[k] !== null ? `I<sub>${k + 1}</sub> = ${f(m.conocida[k])} A (la fija ${sub(lz[0][0].n)}${lz[0][0].t === 'C' ? ', que no deja pasar corriente' : ''})` : '')).filter(Boolean);
        pasos.push({ t: 'Método de las mallas: segunda ley de Kirchhoff', html: `Con ${m.ramas} elementos y ${m.nudos} nudos hay ${m.ramas} − ${m.nudos} + 1 = <b>${n}</b> mallas independientes. Cada una sigue el sentido indicado y lleva su corriente de malla I<sub>k</sub>; la corriente de cada elemento es la suma de las de las mallas que lo recorren (con signo). En cada malla, las caídas R·I suman lo que dan las fuentes de tensión:<br>${m.ecs.join('<br>')}${conoc.length ? `<br>${conoc.join('<br>')}` : ''}` });
        if (m.inc.length) pasos.push({ t: 'Corrientes de malla', html: `${matHtml(m.A.map((fi) => fi.map((v) => f(v))))} · ${matHtml(m.inc.map((k) => [`I<sub>${k + 1}</sub>`]))} = ${matHtml(m.b.map((v) => [f(v)]))} ⇒ ${m.inc.map((k) => `I<sub>${k + 1}</sub> = <b>${f(m.Im[k])} A</b>`).join(', &nbsp; ')}<br>Corriente de cada elemento (de A a B): ${els.map((e) => `I<sub>${e.n}</sub> = ${f(m.rama[e.n])} A`).join(', ')}. ${m.ok ? 'Coinciden con las del método de los nudos.' : 'No coinciden con las del método de los nudos: revisa los datos.'}` });
      }
    }
    return { ref, nudos: sol.nudos, V, els: res, ent, abs, thev, superposicion, malla, pasos };
  }

  const R = (a, b, v) => ({ t: 'R', a, b, v }), E = (a, b, v) => ({ t: 'V', a, b, v }), J = (a, b, v) => ({ t: 'I', a, b, v });
  const ejemplos = [
    { clave: 'divisor', nombre: 'Divisor de tensión', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '1000'), R('b', '0', '2000')], carga: '' } },
    { clave: 'dos-mallas', nombre: 'Dos mallas con dos fuentes', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '2'), R('b', '0', '4'), R('b', 'c', '3'), E('c', '0', '5')], carga: '', mallas: true, superposicion: true } },
    { clave: 'wheatstone', nombre: 'Puente de Wheatstone desequilibrado', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '100'), R('a', 'c', '150'), R('b', '0', '200'), R('c', '0', '200'), R('b', 'c', '50')], carga: '' } },
    { clave: 'corriente', nombre: 'Con una fuente de corriente', sc: { elementos: [J('0', 'a', '2'), R('a', '0', '10'), R('a', 'b', '5'), R('b', '0', '5')], carga: '' } },
    { clave: 'mixto', nombre: 'Fuente de tensión y de corriente', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '4'), J('0', 'b', '1'), R('b', '0', '6')], carga: '', superposicion: true, mallas: true } },
    { clave: 'thevenin', nombre: 'Thévenin y máxima potencia', sc: { elementos: [E('a', '0', '24'), R('a', 'b', '6'), R('b', '0', '3'), R('b', '0', '2')], carga: '3' } },
    { clave: 'thevenin-nudos', nombre: 'Thévenin entre dos nudos', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '100'), R('a', 'c', '150'), R('b', '0', '200'), R('c', '0', '200')], carga: 'nudos', thA: 'b', thB: 'c' } },
    { clave: 'dependiente', nombre: 'Fuente de tensión dependiente de una tensión', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '2'), R('b', '0', '4'), { t: 'VV', a: 'c', b: '0', v: '3', c: 'b', d: '0' }, R('c', '0', '6')], carga: '' } },
    { clave: 'dependiente-corriente', nombre: 'Fuente de corriente dependiente y Thévenin', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '4'), { t: 'II', a: '0', b: 'b', v: '2', x: 'R1' }, R('b', '0', '8'), R('b', '0', '10')], carga: '3' } },
    { clave: 'condensador', nombre: 'Condensador y bobina en régimen permanente', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '4'), { t: 'L', a: 'b', b: 'c', v: '50' }, R('c', '0', '8'), { t: 'C', a: 'b', b: '0', v: '100' }], carga: '' } },
  ];

  return { resolver, nombres, TIPOS, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Continua;
