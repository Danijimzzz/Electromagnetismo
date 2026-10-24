/* =====================================================================
   Circuitos de corriente continua (sin DOM): resistencias, fuentes de
   tensión y fuentes de corriente entre nudos con nombre. Se resuelve por el
   método de los nudos (análisis nodal modificado): incógnitas, los
   potenciales de los nudos y la corriente de cada fuente de tensión.
   Después, corriente y potencia de cada elemento, balance de potencias y,
   si se elige una resistencia como carga, el equivalente de Thévenin y de
   Norton que ve y la máxima transferencia de potencia.
   Convenios: en cada elemento la corriente I va de A a B; en una fuente de
   tensión A es el borne positivo (V_A − V_B = E); en una fuente de
   corriente la corriente J va de A a B por dentro de la fuente.
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
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const TIPOS = { R: { nombre: 'Resistencia', letra: 'R', un: 'Ω' }, V: { nombre: 'Fuente de tensión', letra: 'E', un: 'V' }, I: { nombre: 'Fuente de corriente', letra: 'J', un: 'A' } };
  const sub = (n) => n.replace(/^([A-Za-z])(\w+)$/, '$1<sub>$2</sub>');
  const Vn = (n, ref) => (n === ref ? '0' : `V<sub>${n}</sub>`);

  // R1, R2, E1, J1… según el orden en la lista
  function nombres(els) {
    const c = { R: 0, V: 0, I: 0 };
    return els.map((e) => `${TIPOS[e.t].letra}${++c[e.t]}`);
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
      if (!/^[\wÀ-ÿ]{1,8}$/.test(a) || !/^[\wÀ-ÿ]{1,8}$/.test(b)) throw new Error(`${q}: los nudos se nombran con letras o números (hasta 8)`);
      if (a === b) throw new Error(`${q}: está conectado entre el mismo nudo por los dos lados`);
      if (vacio(e.v)) throw new Error(`${q}: falta el valor`);
      const v = leeNum(e.v);
      if (!isFinite(v)) throw new Error(`${q}: el valor debe ser un número`);
      if (e.t === 'R' && v <= 0) throw new Error(`${q}: la resistencia debe ser mayor que 0`);
      return { i, t: e.t, n: q, a, b, v };
    });
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

  // Análisis nodal modificado de una lista de elementos
  function nodal(els, ref) {
    const nudos = [];
    for (const e of els) for (const n of [e.a, e.b]) if (!nudos.includes(n)) nudos.push(n);
    const inc = nudos.filter((n) => n !== ref), fuentes = els.filter((e) => e.t === 'V');
    const N = inc.length + fuentes.length, A = Array.from({ length: N }, () => Array(N).fill(0)), b = Array(N).fill(0);
    const k = (n) => inc.indexOf(n);
    for (const e of els) {
      const ia = k(e.a), ib = k(e.b);
      if (e.t === 'R') {
        const G = 1 / e.v;
        if (ia >= 0) { A[ia][ia] += G; if (ib >= 0) A[ia][ib] -= G; }
        if (ib >= 0) { A[ib][ib] += G; if (ia >= 0) A[ib][ia] -= G; }
      } else if (e.t === 'I') {
        if (ia >= 0) b[ia] -= e.v;
        if (ib >= 0) b[ib] += e.v;
      } else {
        const s = inc.length + fuentes.indexOf(e);
        if (ia >= 0) { A[ia][s] += 1; A[s][ia] += 1; }
        if (ib >= 0) { A[ib][s] -= 1; A[s][ib] -= 1; }
        b[s] = e.v;
      }
    }
    const x = N ? gauss(A, b) : [];
    if (!x) return null;
    const V = Object.fromEntries(nudos.map((n) => [n, n === ref ? 0 : x[k(n)]]));
    const Iv = Object.fromEntries(fuentes.map((e, j) => [e.n, x[inc.length + j]]));
    return { nudos, inc, fuentes, A, b, x, V, Iv };
  }

  // Comprueba que el circuito está conectado y que cada parte tiene un camino cerrado
  function conectado(els) {
    const ady = {};
    for (const e of els) { (ady[e.a] ||= []).push(e.b); (ady[e.b] ||= []).push(e.a); }
    const nudos = Object.keys(ady), visto = new Set([nudos[0]]), pila = [nudos[0]];
    while (pila.length) for (const m of ady[pila.pop()]) if (!visto.has(m)) { visto.add(m); pila.push(m); }
    return nudos.filter((n) => !visto.has(n));
  }

  const matHtml = (M) => `<span class="mat"><span class="mat-in" style="grid-template-columns:repeat(${M[0].length}, auto)">${M.flat().map((v) => `<span>${v}</span>`).join('')}</span></span>`;

  function resolver(sc) {
    const els = leer(sc);
    const todos = [...new Set(els.flatMap((e) => [e.a, e.b]))];
    const ref = todos.includes('0') ? '0' : todos.includes('tierra') ? 'tierra' : todos[0];
    const sueltos = conectado(els);
    if (sueltos.length) throw new Error(`El circuito está partido: ${sueltos.join(', ')} no están unidos al resto`);
    const sol = nodal(els, ref);
    if (!sol) throw new Error('El sistema no tiene solución única: revisa que no haya fuentes de tensión en paralelo o formando un lazo, fuentes de corriente en serie, o un nudo al que solo llega una fuente de corriente');
    const { V, Iv, inc, fuentes } = sol, nom = Object.fromEntries(els.map((e) => [e.n, e]));
    const pasos = [];
    pasos.push({ t: 'Nudos y referencia', html: `Nudos: ${sol.nudos.map((n) => `<b>${n}</b>`).join(', ')}. Tomamos <b>${ref}</b> como referencia (V = 0)${ref !== '0' ? ' porque no hay ningún nudo llamado 0' : ''}.<br>Incógnitas: ${[...inc.map((n) => `V<sub>${n}</sub>`), ...fuentes.map((e) => `I<sub>${e.n}</sub> (corriente por ${sub(e.n)}, del borne + al −, por dentro)`)].join(', ') || 'ninguna'}.` });
    // ecuaciones de nudos: suma de corrientes que salen = 0
    const ecs = inc.map((n) => {
      const t = [], rhs = [];
      for (const e of els) {
        if (e.a !== n && e.b !== n) continue;
        const otro = e.a === n ? e.b : e.a;
        if (e.t === 'R') t.push(otro === ref ? `${Vn(n, ref)}/${f(e.v)}` : `(${Vn(n, ref)} − ${Vn(otro, ref)})/${f(e.v)}`);
        else if (e.t === 'V') t.push(`${e.a === n ? '+' : '−'} I<sub>${e.n}</sub>`);
        else rhs.push(`${e.a === n ? '−' : '+'} ${f(e.v)}`);
      }
      const izq = t.join(' + ').replace(/\+ ([+−]) /g, '$1 ').replace(/^\+ /, '');
      const der = rhs.length ? rhs.join(' ').replace(/^\+ /, '') : '0';
      return `Nudo ${n}: ${izq || '0'} = ${der}`;
    });
    const ecV = fuentes.map((e) => `${sub(e.n)}: ${Vn(e.a, ref)} − ${Vn(e.b, ref)} = ${f(e.v)}`.replace(/ − 0 =/, ' =').replace(/^([^:]+): 0 − /, '$1: −'));
    pasos.push({ t: 'Primera ley de Kirchhoff en cada nudo: las corrientes que salen suman lo que inyectan las fuentes de corriente', html: ecs.join('<br>') + (ecV.length ? `<br><br>Cada fuente de tensión fija la diferencia de potencial entre sus bornes:<br>${ecV.join('<br>')}` : '') });
    if (sol.A.length) {
      const incTxt = [...inc.map((n) => `V<sub>${n}</sub>`), ...fuentes.map((e) => `I<sub>${e.n}</sub>`)];
      pasos.push({ t: 'Sistema en forma matricial', html: `${matHtml(sol.A.map((fi) => fi.map((v) => f(v))))} · ${matHtml(incTxt.map((v) => [v]))} = ${matHtml(sol.b.map((v) => [f(v)]))}` });
      pasos.push({ t: 'Solución', html: [...inc.map((n) => `V<sub>${n}</sub> = <b>${f(V[n])} V</b>`), ...fuentes.map((e) => `I<sub>${e.n}</sub> = <b>${f(Iv[e.n])} A</b>`)].join(', &nbsp; ') });
    }
    // corriente y potencia de cada elemento (I de A a B; potencia absorbida U·I con U = V_A − V_B)
    const res = els.map((e) => {
      const U = V[e.a] - V[e.b];
      const I = e.t === 'R' ? U / e.v : e.t === 'V' ? Iv[e.n] : e.v;
      const P = U * I; // absorbida (negativa = entrega)
      return { ...e, U, I, P };
    });
    pasos.push({ t: 'Corriente y potencia de cada elemento', html: res.map((r) => {
      if (r.t === 'R') return `${sub(r.n)}: I = ${r.b === ref ? Vn(r.a, ref) : r.a === ref ? `−${Vn(r.b, ref)}` : `(${Vn(r.a, ref)} − ${Vn(r.b, ref)})`}/${sub(r.n)} = ${r.b === ref ? p(V[r.a]) : r.a === ref ? `−${p(V[r.b])}` : `(${f(V[r.a])} − ${p(V[r.b])})`}/${f(r.v)} = <b>${f(Math.abs(r.I))} A</b>${Math.abs(r.I) > 1e-12 ? ` de ${r.I > 0 ? r.a : r.b} a ${r.I > 0 ? r.b : r.a}` : ''}; &nbsp; P = I<sup>2</sup>R = <b>${f(r.P)} W</b>`;
      const que = r.P < -1e-12 ? 'entrega' : r.P > 1e-12 ? 'consume' : 'ni entrega ni consume';
      if (r.t === 'V') return `${sub(r.n)}: I = ${f(r.I)} A ${r.I < -1e-12 ? '(sale por el borne +)' : r.I > 1e-12 ? '(entra por el borne +)' : ''}; &nbsp; P = E·I = <b>${f(Math.abs(r.P))} W</b> (${que})`;
      return `${sub(r.n)}: tensión entre sus bornes U = ${Vn(r.a, ref)} − ${Vn(r.b, ref)} = ${f(r.U)} V; &nbsp; P = U·J = <b>${f(Math.abs(r.P))} W</b> (${que})`;
    }).join('<br>') });
    const ent = -res.filter((r) => r.P < 0).reduce((s, r) => s + r.P, 0), abs = res.filter((r) => r.P > 0).reduce((s, r) => s + r.P, 0);
    pasos.push({ t: 'Balance de potencias', html: `Entregada: ${f(ent)} W; &nbsp; consumida: ${f(abs)} W. ${Math.abs(ent - abs) <= 1e-9 * Math.max(1, ent) ? 'Coinciden, como debe ser.' : 'No coinciden: revisa los datos.'}` });

    // Thévenin visto por una resistencia de carga
    let thev = null;
    if (!vacio(sc.carga)) {
      const L = els[+sc.carga];
      if (!L || L.t !== 'R') throw new Error('La carga para el equivalente de Thévenin tiene que ser una resistencia');
      const resto = els.filter((e) => e !== L);
      if (!resto.length || conectado(resto).length || ![L.a, L.b].every((n) => resto.some((e) => e.a === n || e.b === n))) throw new Error(`Al quitar ${L.n} el circuito queda partido: no hay equivalente de Thévenin entre ${L.a} y ${L.b}`);
      const ab = nodal(resto, ref);
      if (!ab) throw new Error(`Al quitar ${L.n} el sistema no tiene solución única`);
      const Vth = ab.V[L.a] - ab.V[L.b];
      // fuentes apagadas (tensión → cortocircuito, corriente → abierto) y 1 A inyectado de B a A por fuera
      const apagado = resto.filter((e) => e.t !== 'I').map((e) => (e.t === 'V' ? { ...e, v: 0 } : e)).concat([{ t: 'I', n: 'Jp', a: L.b, b: L.a, v: 1 }]);
      const pr = nodal(apagado, ref);
      if (!pr) throw new Error(`Con las fuentes apagadas no se puede calcular la resistencia de Thévenin entre ${L.a} y ${L.b}`);
      const Rth = pr.V[L.a] - pr.V[L.b], IN = Math.abs(Rth) > 1e-12 ? Vth / Rth : Infinity;
      const IL = Vth / (Rth + L.v), PL = IL * IL * L.v, Pmax = Math.abs(Rth) > 1e-12 ? (Vth * Vth) / (4 * Rth) : Infinity;
      thev = { carga: L.n, a: L.a, b: L.b, RL: L.v, Vth, Rth, IN, IL, PL, Pmax };
      pasos.push({ t: `Equivalente de Thévenin visto por ${L.n} (entre ${L.a} y ${L.b})`, html: `Se quita ${sub(L.n)} y se resuelve igual: V<sub>th</sub> = V<sub>${L.a}</sub> − V<sub>${L.b}</sub> en circuito abierto = <b>${f(Vth)} V</b><br>Con las fuentes apagadas (las de tensión en cortocircuito y las de corriente abiertas), la resistencia entre ${L.a} y ${L.b} es R<sub>th</sub> = <b>${f(Rth)} Ω</b><br>Norton: I<sub>N</sub> = V<sub>th</sub>/R<sub>th</sub> = <b>${f(IN)} A</b>` });
      pasos.push({ t: 'Con la carga puesta y máxima transferencia de potencia', html: `I<sub>${L.n}</sub> = V<sub>th</sub>/(R<sub>th</sub> + ${sub(L.n)}) = ${f(Vth)}/(${f(Rth)} + ${f(L.v)}) = <b>${f(IL)} A</b> (coincide con la del circuito completo); P = <b>${f(PL)} W</b><br>La potencia en la carga es máxima si ${sub(L.n)} = R<sub>th</sub> = ${f(Rth)} Ω: P<sub>máx</sub> = V<sub>th</sub><sup>2</sup>/(4R<sub>th</sub>) = <b>${f(Pmax)} W</b>` });
    }
    return { ref, nudos: sol.nudos, V, els: res, ent, abs, thev, pasos };
  }

  const R = (a, b, v) => ({ t: 'R', a, b, v }), E = (a, b, v) => ({ t: 'V', a, b, v }), J = (a, b, v) => ({ t: 'I', a, b, v });
  const ejemplos = [
    { clave: 'divisor', nombre: 'Divisor de tensión', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '1000'), R('b', '0', '2000')], carga: '' } },
    { clave: 'dos-mallas', nombre: 'Dos mallas con dos fuentes', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '2'), R('b', '0', '4'), R('b', 'c', '3'), E('c', '0', '5')], carga: '' } },
    { clave: 'wheatstone', nombre: 'Puente de Wheatstone desequilibrado', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '100'), R('a', 'c', '150'), R('b', '0', '200'), R('c', '0', '200'), R('b', 'c', '50')], carga: '' } },
    { clave: 'corriente', nombre: 'Con una fuente de corriente', sc: { elementos: [J('0', 'a', '2'), R('a', '0', '10'), R('a', 'b', '5'), R('b', '0', '5')], carga: '' } },
    { clave: 'mixto', nombre: 'Fuente de tensión y de corriente', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '4'), J('0', 'b', '1'), R('b', '0', '6')], carga: '' } },
    { clave: 'thevenin', nombre: 'Thévenin y máxima potencia', sc: { elementos: [E('a', '0', '24'), R('a', 'b', '6'), R('b', '0', '3'), R('b', '0', '2')], carga: '3' } },
  ];

  return { resolver, nombres, TIPOS, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Continua;
