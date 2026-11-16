const Probabilidad = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (Math.abs(x) >= 1e-3 || Math.abs(x) < 1e-12 ? String(+x.toFixed(4)).replace('.', ',') : f(x, 3));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  function leeProb(sc, k, nom) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    let s = String(sc[k]).trim().replace(/\s/g, ''), v;
    if (/%$/.test(s)) v = leeNum(s.slice(0, -1)) / 100;
    else if (/^[^/]+\/[^/]+$/.test(s)) { const [a, b] = s.split('/'); v = leeNum(a) / leeNum(b); }
    else v = leeNum(s);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número, una fracción (3/10) o un porcentaje (30 %)`);
    if (v < 0 || v > 1) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe estar entre 0 y 1 (o entre 0 % y 100 %)`);
    return v;
  }
  function leeEntero(sc, k, nom, min, max) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número entero`);
    if (v < min || v > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe estar entre ${min} y ${max}`);
    return v;
  }

  const fact = (n) => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; };
  const permP = (n, k) => { let r = 1n; for (let i = 0n; i < BigInt(k); i++) r *= BigInt(n) - i; return r; };
  const comb = (n, k) => { k = Math.min(k, n - k); let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = (r * (BigInt(n) - BigInt(k) + i)) / i; return r; };
  const grande = (b) => {
    const s = b.toString();
    if (s.length <= 15) return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${s[0]},${s.slice(1, 4)}·10<sup>${s.length - 1}</sup>`;
  };
  const cifras = (b) => b.toString().length;

  const TIPOS = {
    var: 'Variaciones sin repetición',
    varrep: 'Variaciones con repetición',
    perm: 'Permutaciones',
    permrep: 'Permutaciones con repetición',
    comb: 'Combinaciones',
    combrep: 'Combinaciones con repetición',
  };

  function combinatoria(sc) {
    const tipo = TIPOS[sc.ctipo] ? sc.ctipo : 'comb';
    let valor, pasos, regla, n, k, grupos;
    const dato = (t, v) => `$${t} = ${v}$`;
    if (tipo === 'permrep') {
      grupos = String(sc.grupos ?? '').split(/[;,\s]+/).filter(Boolean).map((x) => {
        const v = leeNum(x);
        if (!Number.isInteger(v) || v < 1 || v > 1000) throw new Error('Las repeticiones deben ser enteros positivos separados por comas (por ejemplo 1, 4, 4, 2)');
        return v;
      });
      if (grupos.length < 1) throw new Error('Falta la lista de repeticiones (por ejemplo 1, 4, 4, 2)');
      n = grupos.reduce((a, b) => a + b, 0);
      if (n > 1000) throw new Error('Son demasiados elementos: el total no puede pasar de 1000');
      valor = grupos.reduce((r, g) => r / fact(g), fact(n));
      const den = grupos.map((g) => `${g}!`).join('·');
      regla = { t: 'Permutaciones con repetición', html: `Se ordenan todos los elementos (importa el orden) y algunos son indistinguibles: $PR_{${n}}^{${grupos.join(',')}} = {n!}/{${grupos.map((_, i) => `a_${i + 1}!`).join('·')}}$` };
      pasos = [
        { t: 'Datos', html: `${grupos.length} tipos de elemento, repetidos ${grupos.join(', ')} veces; $n = ${grupos.join(' + ')} = ${n}$` },
        regla,
        { t: 'Sustituir', html: `$PR = {${n}!}/{${den}} = {${grande(fact(n))}}/{${grande(grupos.reduce((r, g) => r * fact(g), 1n))}} = ${grande(valor)}$` },
      ];
    } else {
      n = leeEntero(sc, 'n', 'el número de elementos n', 1, tipo === 'varrep' ? 1000 : 1000);
      if (tipo === 'perm') k = n;
      else {
        k = leeEntero(sc, 'k', 'el número de elegidos k', 1, tipo === 'varrep' || tipo === 'combrep' ? 1000 : n);
        if (tipo !== 'varrep' && tipo !== 'combrep' && k > n) throw new Error('Sin repetición no se pueden elegir más elementos de los que hay (k ≤ n)');
      }
      if (tipo === 'var') {
        valor = permP(n, k);
        regla = { t: 'Variaciones sin repetición', html: `Se eligen $k$ de $n$ elementos distintos y importa el orden: $V_{n,k} = {n!}/{(n − k)!} = n(n − 1)⋯(n − k + 1)$` };
        pasos = [{ t: 'Datos', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Sustituir', html: `$V_{${n},${k}} = {${n}!}/{${n - k}!} = ${Array.from({ length: Math.min(k, 6) }, (_, i) => n - i).join('·')}${k > 6 ? '⋯' + (n - k + 1) : ''} = ${grande(valor)}$` }];
      } else if (tipo === 'varrep') {
        valor = BigInt(n) ** BigInt(k);
        regla = { t: 'Variaciones con repetición', html: `Se eligen $k$ veces entre $n$ elementos, pudiendo repetir, y importa el orden: $VR_{n,k} = n^k$` };
        pasos = [{ t: 'Datos', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Sustituir', html: `$VR_{${n},${k}} = ${n}^{${k}} = ${grande(valor)}$` }];
      } else if (tipo === 'perm') {
        valor = fact(n);
        regla = { t: 'Permutaciones', html: `Se ordenan los $n$ elementos distintos: $P_n = n! = n(n − 1)⋯2·1$` };
        pasos = [{ t: 'Datos', html: dato('n', n) }, regla, { t: 'Sustituir', html: `$P_{${n}} = ${n}! = ${grande(valor)}$` }];
      } else if (tipo === 'comb') {
        valor = comb(n, k);
        regla = { t: 'Combinaciones', html: `Se eligen $k$ de $n$ elementos y no importa el orden: $C_{n,k} = binom(n, k) = {n!}/{k!(n − k)!}$` };
        pasos = [{ t: 'Datos', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Sustituir', html: `$C_{${n},${k}} = {${n}!}/{${k}!·${n - k}!} = ${grande(valor)}$` }];
      } else {
        valor = comb(n + k - 1, k);
        regla = { t: 'Combinaciones con repetición', html: `Se eligen $k$ veces entre $n$ elementos, pudiendo repetir, y no importa el orden: $CR_{n,k} = binom(n + k − 1, k)$` };
        pasos = [{ t: 'Datos', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Sustituir', html: `$CR_{${n},${k}} = binom(${n + k - 1}, ${k}) = ${grande(valor)}$` }];
      }
    }
    const res = [{ t: TIPOS[tipo], v: grande(valor), pr: true }];
    if (cifras(valor) > 15) res.push({ t: 'Cifras', v: String(cifras(valor)) });
    const orden = tipo === 'var' || tipo === 'varrep' || tipo === 'perm' || tipo === 'permrep';
    res.push({ t: '¿Importa el orden?', v: orden ? 'Sí' : 'No' });
    res.push({ t: '¿Se puede repetir?', v: tipo === 'varrep' || tipo === 'combrep' ? 'Sí' : 'No' });
    pasos.push({ t: 'Probabilidad de un caso', html: `Si todos los casos son igualmente probables, cada uno tiene probabilidad $1/${grande(valor)}$ ${cifras(valor) <= 15 ? `$= ${f(1 / Number(valor))}$` : ''}` });
    return { modo: 'comb', tipo, n, k, grupos, valor, res, pasos };
  }

  const RELACIONES = {
    inter: 'Conozco P(A ∩ B)',
    union: 'Conozco P(A ∪ B)',
    cond: 'Conozco P(A | B)',
    indep: 'A y B son independientes',
    incomp: 'A y B son incompatibles',
  };

  function sucesos(sc) {
    const pa = leeProb(sc, 'pa', 'P(A)'), pb = leeProb(sc, 'pb', 'P(B)');
    const rel = RELACIONES[sc.rel] ? sc.rel : 'inter';
    let pi, pasos = [{ t: 'Datos', html: `$P(A) = ${p(pa)}$, $P(B) = ${p(pb)}$` }];
    if (rel === 'inter') {
      pi = leeProb(sc, 'pc', 'P(A ∩ B)');
      pasos[0].html += `, $P(A ∩ B) = ${p(pi)}$`;
    } else if (rel === 'union') {
      const pu = leeProb(sc, 'pc', 'P(A ∪ B)');
      pi = pa + pb - pu;
      pasos[0].html += `, $P(A ∪ B) = ${p(pu)}$`;
      pasos.push({ t: 'Intersección', html: `$P(A ∪ B) = P(A) + P(B) − P(A ∩ B)$ ⇒ $P(A ∩ B) = ${p(pa)} + ${p(pb)} − ${p(pu)} = ${p(pi)}$` });
    } else if (rel === 'cond') {
      const pc = leeProb(sc, 'pc', 'P(A | B)');
      pi = pc * pb;
      pasos[0].html += `, $P(A | B) = ${p(pc)}$`;
      pasos.push({ t: 'Intersección', html: `$P(A ∩ B) = P(A | B)·P(B) = ${p(pc)}·${p(pb)} = ${p(pi)}$` });
    } else if (rel === 'indep') {
      pi = pa * pb;
      pasos.push({ t: 'Intersección', html: `Independientes: $P(A ∩ B) = P(A)·P(B) = ${p(pa)}·${p(pb)} = ${p(pi)}$` });
    } else {
      pi = 0;
      pasos.push({ t: 'Intersección', html: `Incompatibles: $A ∩ B = ∅$, así que $P(A ∩ B) = 0$` });
    }
    const minI = Math.max(0, pa + pb - 1), maxI = Math.min(pa, pb), tol = 1e-9;
    if (pi < minI - tol || pi > maxI + tol) {
      throw new Error(`Esos datos son imposibles: P(A ∩ B) tendría que valer ${p(pi)} y debe estar entre ${p(minI)} y ${p(maxI)}`);
    }
    pi = Math.min(maxI, Math.max(minI, pi));
    const pu = pa + pb - pi;
    pasos.push({ t: 'Unión', html: `$P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = ${p(pa)} + ${p(pb)} − ${p(pi)} = ${p(pu)}$` });
    const res = [{ t: 'P(A ∩ B)', v: p(pi) }, { t: 'P(A ∪ B)', v: p(pu), pr: true }];
    let indep = null;
    if (pb > 0) {
      const ab = pi / pb;
      res.push({ t: 'P(A | B)', v: p(ab), pr: true });
      pasos.push({ t: 'Condicionada', html: `$P(A | B) = {P(A ∩ B)}/{P(B)} = {${p(pi)}}/{${p(pb)}} = ${p(ab)}$` });
    } else pasos.push({ t: 'Condicionada', html: `$P(B) = 0$: no se puede condicionar a un suceso imposible` });
    if (pa > 0) {
      const ba = pi / pa;
      res.push({ t: 'P(B | A)', v: p(ba), pr: true });
      pasos.push({ t: '', html: `$P(B | A) = {P(A ∩ B)}/{P(A)} = {${p(pi)}}/{${p(pa)}} = ${p(ba)}$` });
    }
    res.push({ t: 'P(Ā)', v: p(1 - pa) }, { t: 'P(B̄)', v: p(1 - pb) }, { t: 'P(Ā ∩ B̄)', v: p(1 - pu) });
    pasos.push({ t: 'Complementarios', html: `$P(Ā) = 1 − ${p(pa)} = ${p(1 - pa)}$, $P(B̄) = 1 − ${p(pb)} = ${p(1 - pb)}$ y, por las leyes de De Morgan, $P(Ā ∩ B̄) = 1 − P(A ∪ B) = ${p(1 - pu)}$` });
    indep = Math.abs(pi - pa * pb) < 1e-9;
    pasos.push({ t: '¿Independientes?', html: `$P(A)·P(B) = ${p(pa * pb)}$ ${indep ? '=' : '≠'} $P(A ∩ B) = ${p(pi)}$ ⇒ ${indep ? 'sí son independientes' : 'no son independientes'}${pi === 0 && pa * pb > 0 ? ' (son incompatibles, y dos sucesos con probabilidad no nula incompatibles nunca son independientes)' : ''}` });
    res.push({ t: '¿Independientes?', v: indep ? 'Sí' : 'No' });
    return { modo: 'suc', pa, pb, pi, pu, indep, res, pasos };
  }

  function bayes(sc) {
    const nb = String(sc.nb ?? '').trim() || 'B';
    const filas = (sc.filas || []).map((r, i) => ({ i, n: String(r.n ?? '').trim() || `A${i + 1}`, p: r.p, l: r.l })).filter((r) => !(vacio(r.p) && vacio(r.l)));
    if (filas.length < 2) throw new Error('Hacen falta al menos dos causas (con su P(Aᵢ) y su P(B | Aᵢ))');
    for (const r of filas) {
      r.p = leeProb({ x: r.p }, 'x', `P(${r.n})`);
      r.l = leeProb({ x: r.l }, 'x', `P(${nb} | ${r.n})`);
    }
    const suma = filas.reduce((a, r) => a + r.p, 0);
    if (Math.abs(suma - 1) > 1e-6) throw new Error(`Las probabilidades de las causas deben sumar 1 y suman ${p(suma)}: las causas forman un sistema completo de sucesos`);
    const obs = sc.obs === 'no' ? 'no' : 'si';
    const nbn = `${nb}̄`;
    for (const r of filas) { r.j = r.p * r.l; r.jn = r.p * (1 - r.l); }
    const pB = filas.reduce((a, r) => a + r.j, 0), pN = 1 - pB;
    const k = obs === 'si' ? pB : pN;
    if (k < 1e-12) throw new Error(obs === 'si' ? `${nb} es imposible con esos datos: no se puede calcular P(Aᵢ | ${nb})` : `${nb} ocurre siempre con esos datos: no se puede calcular P(Aᵢ | ${nb}̄)`);
    for (const r of filas) r.post = (obs === 'si' ? r.j : r.jn) / k;
    const nom = (r) => `A_${r.i + 1}`;
    const pasos = [
      { t: 'Datos', html: filas.map((r) => `$P(${nom(r)}) = ${p(r.p)}$, $P(${nb} | ${nom(r)}) = ${p(r.l)}$`).join('; ') + ` (${filas.map((r) => `$${nom(r)}$ = ${r.n}`).join(', ')})` },
      { t: 'Diagrama de árbol', html: `Cada rama se multiplica: $P(${nom(filas[0])} ∩ ${nb}) = P(${nom(filas[0])})·P(${nb} | ${nom(filas[0])}) = ${p(filas[0].p)}·${p(filas[0].l)} = ${p(filas[0].j)}$; así con las demás ramas` },
      { t: 'Probabilidad total', html: `$P(${nb}) = ∑ P(${nom(filas[0])})·P(${nb} | ${nom(filas[0])})$ ⇒ $P(${nb}) = ${filas.map((r) => p(r.j)).join(' + ')} = ${p(pB)}$` },
    ];
    pasos.push({ t: obs === 'si' ? 'Teorema de Bayes' : `Bayes con ${nbn}`, html: obs === 'si'
      ? `$P(A_i | ${nb}) = {P(A_i)·P(${nb} | A_i)}/{P(${nb})}$, que es $P(A_i ∩ ${nb})/P(${nb})$` + filas.map((r) => `<br>$P(${nom(r)} | ${nb}) = {${p(r.j)}}/{${p(pB)}} = ${p(r.post)}$`).join('')
      : `Ahora se sabe que ${nb} no ha ocurrido: $P(${nbn}) = 1 − ${p(pB)} = ${p(pN)}$ y $P(A_i | ${nbn}) = {P(A_i)·(1 − P(${nb} | A_i))}/{P(${nbn})}$` + filas.map((r) => `<br>$P(${nom(r)} | ${nbn}) = {${p(r.jn)}}/{${p(pN)}} = ${p(r.post)}$`).join('') });
    pasos.push({ t: 'Comprobación', html: `Las probabilidades a posteriori suman $${filas.map((r) => p(r.post)).join(' + ')} = ${p(filas.reduce((a, r) => a + r.post, 0))}$ (tienen que dar 1)` });
    const res = [{ t: `P(${nb})`, v: p(pB), pr: obs === 'si' }];
    if (obs === 'no') res.push({ t: `P(${nbn})`, v: p(pN), pr: true });
    for (const r of filas) res.push({ t: `P(${r.n} | ${obs === 'si' ? nb : nbn})`, v: p(r.post), pr: true });
    const may = filas.reduce((m, r) => (r.post > m.post ? r : m), filas[0]);
    return { modo: 'bayes', nb, obs, filas, pB, pN, res, pasos, may };
  }

  const lista = (s) => String(s ?? '').replace(/[−–]/g, '-').split(/[;\s]+/).filter(Boolean);
  const leeFrac = (s) => { if (/%$/.test(s)) return leeNum(s.slice(0, -1)) / 100; if (/^[^/]+\/[^/]+$/.test(s)) { const [a, b] = s.split('/'); return leeNum(a) / leeNum(b); } return leeNum(s); };
  function variable(sc) {
    const tx = lista(sc.vax), tp = lista(sc.vap);
    if (tx.length < 2) throw new Error('Escribe al menos dos valores de X separados por punto y coma (por ejemplo 0; 1; 2; 3)');
    if (tx.length > 40) throw new Error('Son demasiados valores: como mucho 40');
    if (tp.length !== tx.length) throw new Error(`Hay ${tx.length} valores y ${tp.length} probabilidades: tiene que haber una probabilidad por cada valor`);
    const xs = tx.map((t) => { const v = leeFrac(t); if (!isFinite(v)) throw new Error(`«${t}» no es un valor de X: escribe números separados por punto y coma`); return v; });
    if (new Set(xs).size !== xs.length) throw new Error('Hay valores de X repetidos: cada valor va una sola vez, con su probabilidad');
    const hueco = tp.map((t, i) => (t === '?' || /^[a-zA-Z]$/.test(t) ? i : -1)).filter((i) => i >= 0);
    if (hueco.length > 1) throw new Error('Solo puede quedar una probabilidad sin dar (escrita como ?)');
    const ps = tp.map((t, i) => {
      if (i === hueco[0]) return 0;
      const v = leeFrac(t);
      if (!isFinite(v)) throw new Error(`«${t}» no es una probabilidad: escribe 0,3, 30 % o 3/10`);
      if (v < 0 || v > 1) throw new Error(`Una probabilidad no puede valer ${p(v)}: todas están entre 0 y 1`);
      return v;
    });
    const pasos = [];
    let suma = ps.reduce((a, b) => a + b, 0);
    if (hueco.length) {
      const k = 1 - suma;
      if (k < -1e-9) throw new Error(`Las probabilidades dadas ya suman ${p(suma)}, más que 1: no queda nada para la que falta`);
      ps[hueco[0]] = Math.max(0, k);
      pasos.push({ t: 'La probabilidad que falta', html: `Todas tienen que sumar 1: $P(X = ${f(xs[hueco[0]])}) = 1 − ${p(suma)} = ${p(ps[hueco[0]])}$` });
      suma = 1;
    } else if (Math.abs(suma - 1) > 1e-6) throw new Error(`Las probabilidades tienen que sumar 1 y suman ${p(suma)}`);
    const orden = xs.map((x, i) => ({ x, p: ps[i] })).sort((a, b) => a.x - b.x);
    let ac = 0; for (const o of orden) { ac += o.p; o.F = Math.min(1, ac); } orden[orden.length - 1].F = 1;
    const mu = orden.reduce((a, o) => a + o.x * o.p, 0), m2 = orden.reduce((a, o) => a + o.x * o.x * o.p, 0);
    const v = Math.max(0, orden.reduce((a, o) => a + (o.x - mu) ** 2 * o.p, 0)), sd = Math.sqrt(v);
    const pmax = Math.max(...orden.map((o) => o.p)), modas = orden.filter((o) => Math.abs(o.p - pmax) < 1e-12).map((o) => o.x);
    const im = orden.findIndex((o) => o.F >= 0.5 - 1e-12), med = Math.abs(orden[im].F - 0.5) < 1e-12 && orden[im + 1] ? (orden[im].x + orden[im + 1].x) / 2 : orden[im].x;
    const n = (x) => f(x, 5), par = (x) => (x < 0 ? `(${n(x)})` : n(x));
    const corta = (ts) => (ts.length > 8 ? [...ts.slice(0, 4), '…', ...ts.slice(-2)] : ts).join(' + ');
    pasos.unshift({ t: 'Función de probabilidad', html: `X toma ${orden.length} valores; sus probabilidades son todas positivas o cero y suman $${p(suma)}$, así que es una función de probabilidad válida.` });
    pasos.push({ t: 'Esperanza', html: `$E[X] = μ = ∑ x_i·p_i = ${corta(orden.map((o) => `${par(o.x)}·${p(o.p)}`))} = ${n(mu)}$` });
    pasos.push({ t: 'Varianza', html: `$E[X^2] = ∑ x_i^2·p_i = ${corta(orden.map((o) => `${par(o.x)}^2·${p(o.p)}`))} = ${n(m2)}$ y $"Var"(X) = E[X^2] − μ^2 = ${n(m2)} − ${par(mu)}^2 = ${n(v)}$` });
    pasos.push({ t: 'Desviación típica', html: `$σ = √{"Var"(X)} = √{${n(v)}} = ${n(sd)}$` });
    pasos.push({ t: 'Función de distribución', html: `$F(x) = P(X ≤ x)$ acumula las probabilidades y sube a saltos en cada valor: ${(orden.length > 8 ? [...orden.slice(0, 4), null, ...orden.slice(-2)] : orden).map((o) => (o ? `$F(${n(o.x)}) = ${p(o.F)}$` : '…')).join(', ')}. Vale 0 antes de $${n(orden[0].x)}$ y 1 desde $${n(orden[orden.length - 1].x)}$.` });
    const res = [{ t: 'E[X] = μ', v: n(mu), pr: true }, { t: 'Var(X)', v: n(v), pr: true }, { t: 'σ', v: n(sd), pr: true }, { t: 'E[X²]', v: n(m2) }, { t: modas.length > 1 ? 'Modas' : 'Moda', v: modas.length === orden.length ? 'No hay: todos igual de probables' : modas.map((x) => n(x)).join('; ') }, { t: 'Mediana', v: n(med) }];
    let k = null, pk = null;
    if (!vacio(sc.vak)) {
      k = leeFrac(String(sc.vak).trim().replace(/[−–]/g, '-'));
      if (!isFinite(k)) throw new Error('El valor de x en el que se calcula tiene que ser un número');
      const men = orden.filter((o) => o.x < k - 1e-12).reduce((a, o) => a + o.p, 0), ig = orden.filter((o) => Math.abs(o.x - k) <= 1e-12).reduce((a, o) => a + o.p, 0);
      pk = { menor: men, igual: ig, menorIgual: men + ig, mayor: Math.max(0, 1 - men - ig), mayorIgual: Math.max(0, 1 - men) };
      res.push({ t: `P(X ≤ ${n(k)})`, v: p(pk.menorIgual), pr: true }, { t: `P(X = ${n(k)})`, v: p(pk.igual) }, { t: `P(X < ${n(k)})`, v: p(pk.menor) }, { t: `P(X > ${n(k)})`, v: p(pk.mayor) }, { t: `P(X ≥ ${n(k)})`, v: p(pk.mayorIgual) });
      pasos.push({ t: `Probabilidades en x = ${n(k)}`, html: `$P(X ≤ ${n(k)}) = F(${n(k)}) = ${p(pk.menorIgual)}$, $P(X < ${n(k)}) = ${p(pk.menor)}$ (sin contar el propio valor), $P(X > ${n(k)}) = 1 − F(${n(k)}) = ${p(pk.mayor)}$ y $P(X ≥ ${n(k)}) = 1 − P(X < ${n(k)}) = ${p(pk.mayorIgual)}$` });
    }
    const a = vacio(sc.vaa) ? 1 : leeFrac(String(sc.vaa).trim().replace(/[−–]/g, '-')), b = vacio(sc.vab) ? 0 : leeFrac(String(sc.vab).trim().replace(/[−–]/g, '-'));
    if (!isFinite(a) || !isFinite(b)) throw new Error('En Y = aX + b, a y b tienen que ser números');
    let Y = null;
    if (a !== 1 || b !== 0) {
      Y = { a, b, mu: a * mu + b, v: a * a * v, sd: Math.abs(a) * sd };
      res.push({ t: 'E[Y]', v: n(Y.mu), pr: true }, { t: 'Var(Y)', v: n(Y.v), pr: true }, { t: 'σ de Y', v: n(Y.sd) });
      pasos.push({ t: 'Cambio lineal Y = aX + b', html: `Con $a = ${n(a)}$ y $b = ${n(b)}$: $E[Y] = a·E[X] + b = ${par(a)}·${par(mu)} + ${par(b)} = ${n(Y.mu)}$. La varianza no nota el desplazamiento y se multiplica por $a^2$: $"Var"(Y) = a^2·"Var"(X) = ${par(a)}^2·${n(v)} = ${n(Y.v)}$, y $σ_Y = |a|·σ = ${n(Y.sd)}$.` });
    }
    const tabla = { cab: ['x', 'P(X = x)', 'F(x)', 'x·p', 'x²·p'], filas: orden.map((o) => [n(o.x), p(o.p), p(o.F), n(o.x * o.p), n(o.x * o.x * o.p)]), pie: ['Suma', p(suma), '', n(mu), n(m2)] };
    return { modo: 'va', xs: orden.map((o) => o.x), ps: orden.map((o) => o.p), F: orden.map((o) => o.F), mu, m2, v, sd, modas, med, k, pk, Y, tabla, res, pasos };
  }

  function contingencia(sc) {
    const limpia = (v, d) => String(v ?? '').replace(/["$<>{}]/g, '').trim() || d, na = limpia(sc.ta, 'A'), nb = limpia(sc.tb, 'B');
    const no = (x) => (x.length > 1 ? `no ${x}` : `${x}̄`), nan = no(na), nbn = no(nb), M = (x) => (x.length > 1 ? `"${x}"` : x), ma = M(na), mb = M(nb), man = M(nan), mbn = M(nbn);
    const celda = (k, nom) => {
      if (vacio(sc[k])) throw new Error(`Falta la casilla de ${nom}`);
      const v = leeFrac(String(sc[k]).trim().replace(/\s/g, '').replace(/[−–]/g, '-'));
      if (!isFinite(v)) throw new Error(`La casilla de ${nom} debe ser un número (casos o probabilidad)`);
      if (v < 0) throw new Error(`La casilla de ${nom} no puede ser negativa`);
      return v;
    };
    const c = [[celda('t11', `${na} y ${nb}`), celda('t12', `${na} y no ${nb}`)], [celda('t21', `no ${na} y ${nb}`), celda('t22', `ni ${na} ni ${nb}`)]];
    const N = c[0][0] + c[0][1] + c[1][0] + c[1][1];
    if (!(N > 0)) throw new Error('La tabla está vacía: al menos una casilla tiene que ser mayor que cero');
    const fA = c[0][0] + c[0][1], fB = c[0][0] + c[1][0], pa = fA / N, pb = fB / N, pi = c[0][0] / N, pu = pa + pb - pi;
    const n = (x) => f(x, 6), prob = Math.abs(N - 1) < 1e-9, sobre = (x) => (prob ? p(x) : `{${n(x)}}/{${n(N)}}`);
    const pasos = [
      { t: 'Totales', html: prob ? `Las casillas ya son probabilidades y suman 1. Sumando filas y columnas: $P(${ma}) = ${p(c[0][0])} + ${p(c[0][1])} = ${p(pa)}$ y $P(${mb}) = ${p(c[0][0])} + ${p(c[1][0])} = ${p(pb)}$`
        : `En total hay $N = ${n(N)}$ casos. Sumando filas y columnas: ${n(fA)} son de ${na} y ${n(fB)} son de ${nb}.` },
      { t: 'Probabilidades de cada suceso', html: prob ? `$P(${man}) = 1 − ${p(pa)} = ${p(1 - pa)}$, $P(${mbn}) = 1 − ${p(pb)} = ${p(1 - pb)}$` : `Regla de Laplace, casos favorables entre casos posibles: $P(${ma}) = {${n(fA)}}/{${n(N)}} = ${p(pa)}$, $P(${mb}) = {${n(fB)}}/{${n(N)}} = ${p(pb)}$` },
      { t: 'Intersección y unión', html: `$P(${ma} ∩ ${mb}) = ${sobre(c[0][0])}${prob ? '' : ` = ${p(pi)}`}$ (la casilla donde se cruzan) y $P(${ma} ∪ ${mb}) = P(${ma}) + P(${mb}) − P(${ma} ∩ ${mb}) = ${p(pa)} + ${p(pb)} − ${p(pi)} = ${p(pu)}$` },
    ];
    const res = [{ t: `P(${na})`, v: p(pa) }, { t: `P(${nb})`, v: p(pb) }, { t: `P(${na} ∩ ${nb})`, v: p(pi), pr: true }, { t: `P(${na} ∪ ${nb})`, v: p(pu), pr: true }];
    const cond = [];
    if (fB > 0) { res.push({ t: `P(${na} | ${nb})`, v: p(c[0][0] / fB), pr: true }); cond.push(`$P(${ma} | ${mb}) = {${n(c[0][0])}}/{${n(fB)}} = ${p(c[0][0] / fB)}$`); }
    if (fA > 0) { res.push({ t: `P(${nb} | ${na})`, v: p(c[0][0] / fA), pr: true }); cond.push(`$P(${mb} | ${ma}) = {${n(c[0][0])}}/{${n(fA)}} = ${p(c[0][0] / fA)}$`); }
    if (N - fB > 0) { res.push({ t: `P(${na} | ${nbn})`, v: p(c[0][1] / (N - fB)) }); cond.push(`$P(${ma} | ${mbn}) = {${n(c[0][1])}}/{${n(N - fB)}} = ${p(c[0][1] / (N - fB))}$`); }
    if (N - fA > 0) { res.push({ t: `P(${nb} | ${nan})`, v: p(c[1][0] / (N - fA)) }); cond.push(`$P(${mb} | ${man}) = {${n(c[1][0])}}/{${n(N - fA)}} = ${p(c[1][0] / (N - fA))}$`); }
    pasos.push({ t: 'Condicionadas', html: `Condicionar es quedarse con una sola fila o columna y dividir por su total: ${cond.join(', ')}` });
    const indep = Math.abs(pi - pa * pb) < 1e-9;
    pasos.push({ t: '¿Independientes?', html: `$P(${ma})·P(${mb}) = ${p(pa)}·${p(pb)} = ${p(pa * pb)}$ ${indep ? '=' : '≠'} $P(${ma} ∩ ${mb}) = ${p(pi)}$ ⇒ ${indep ? 'sí son independientes: las filas de la tabla son proporcionales' : 'no son independientes'}` });
    res.push({ t: `P(${nan} ∩ ${nbn})`, v: p(c[1][1] / N) }, { t: '¿Independientes?', v: indep ? 'Sí' : 'No' });
    const tabla = { cab: ['', nb, `No ${nb}`, 'Total'], filas: [[na, n(c[0][0]), n(c[0][1]), n(fA)], [`No ${na}`, n(c[1][0]), n(c[1][1]), n(N - fA)]], pie: ['Total', n(fB), n(N - fB), n(N)] };
    return { modo: 'tabla', na, nb, c, N, pa, pb, pi, pu, indep, tabla, res, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'va') return variable(sc);
    if (sc.modo === 'tabla') return contingencia(sc);
    if (sc.modo === 'suc') return sucesos(sc);
    if (sc.modo === 'bayes') return bayes(sc);
    return combinatoria(sc);
  }

  const base = () => ({
    modo: 'comb', ctipo: 'comb', n: '49', k: '6', grupos: '1, 4, 4, 2',
    pa: '0,6', pb: '0,5', rel: 'union', pc: '0,85',
    nb: 'D', obs: 'si',
    filas: [{ n: 'Máquina 1', p: '0,5', l: '0,01' }, { n: 'Máquina 2', p: '0,3', l: '0,02' }, { n: 'Máquina 3', p: '0,2', l: '0,03' }, { n: '', p: '', l: '' }],
    vax: '0; 1; 2; 3', vap: '1/8; 3/8; 3/8; 1/8', vak: '', vaa: '', vab: '',
    ta: 'A', tb: 'B', t11: '30', t12: '20', t21: '15', t22: '35',
  });
  const ej = (clave, nombre, extra) => ({ clave, nombre, sc: { ...base(), ...extra } });
  const ejemplos = [
    ej('podio', 'Combinatoria · Podio de 3 entre 10 corredores', { modo: 'comb', ctipo: 'var', n: '10', k: '3' }),
    ej('loteria', 'Combinatoria · Primitiva: 6 números de 49', { modo: 'comb', ctipo: 'comb', n: '49', k: '6' }),
    ej('clave', 'Combinatoria · Clave de 4 cifras', { modo: 'comb', ctipo: 'varrep', n: '10', k: '4' }),
    ej('mississippi', 'Combinatoria · Anagramas de MISSISSIPPI', { modo: 'comb', ctipo: 'permrep', grupos: '1, 4, 4, 2' }),
    ej('helados', 'Combinatoria · 5 bolas de helado de 3 sabores', { modo: 'comb', ctipo: 'combrep', n: '3', k: '5' }),
    ej('union', 'Sucesos · A y B con la unión dada', { modo: 'suc', pa: '0,6', pb: '0,5', rel: 'union', pc: '0,85' }),
    ej('independientes', 'Sucesos · A y B independientes', { modo: 'suc', pa: '0,5', pb: '0,4', rel: 'indep', pc: '' }),
    ej('fabrica', 'Bayes · Tres máquinas y piezas defectuosas', { modo: 'bayes' }),
    ej('diagnostico', 'Bayes · Prueba médica (enfermo / sano)', { modo: 'bayes', nb: '+', filas: [{ n: 'Enfermo', p: '0,01', l: '0,95' }, { n: 'Sano', p: '0,99', l: '0,05' }, { n: '', p: '', l: '' }, { n: '', p: '', l: '' }] }),
    ej('caras', 'Variable aleatoria · Caras al lanzar tres monedas', { modo: 'va', vax: '0; 1; 2; 3', vap: '1/8; 3/8; 3/8; 1/8', vak: '1' }),
    ej('dado', 'Variable aleatoria · Un dado y la ganancia Y = 2X − 5', { modo: 'va', vax: '1; 2; 3; 4; 5; 6', vap: '1/6; 1/6; 1/6; 1/6; 1/6; 1/6', vaa: '2', vab: '−5' }),
    ej('incognita', 'Variable aleatoria · Falta una probabilidad', { modo: 'va', vax: '−1; 0; 2; 5', vap: '0,2; 0,35; ?; 0,15' }),
    ej('encuesta', 'Tabla 2 × 2 · Deporte y tabaco en 100 personas', { modo: 'tabla', ta: 'Deporte', tb: 'Fuma', t11: '10', t12: '50', t21: '20', t22: '20' }),
    ej('tabla-indep', 'Tabla 2 × 2 · Dos sucesos independientes', { modo: 'tabla', ta: 'A', tb: 'B', t11: '0,12', t12: '0,28', t21: '0,18', t22: '0,42' }),
    ej('sin-defecto', 'Bayes · Pieza sin defecto (suceso contrario)', { modo: 'bayes', obs: 'no' }),
  ];

  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const a = e(2, 6) * 5, b = e(2, 6) * 5, c = 100 - a - b;
    if (c < 10) return azar();
    const nombres = ['Máquina 1', 'Máquina 2', 'Máquina 3'], ps = [a, b, c].map((x) => String(x / 100).replace('.', ','));
    const ls = [e(1, 6), e(1, 6), e(1, 6)].map((x) => String(x / 100).replace('.', ','));
    return { ...base(), modo: 'bayes', obs: 'si', nb: 'D', filas: nombres.map((n, i) => ({ n, p: ps[i], l: ls[i] })).concat([{ n: '', p: '', l: '' }]) };
  }

  return { resolver, ejemplos, azar, f, p, TIPOS, RELACIONES, leeProb, grande };
})();

