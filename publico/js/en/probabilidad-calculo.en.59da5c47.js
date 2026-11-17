const Probabilidad = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const p = (x) => (Math.abs(x) >= 1e-3 || Math.abs(x) < 1e-12 ? String(+x.toFixed(4)).replace('.', '.') : f(x, 3));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  function leeProb(sc, k, nom) {
    if (vacio(sc[k])) throw new Error(`${nom} is missing`);
    let s = String(sc[k]).trim().replace(/\s/g, ''), v;
    if (/%$/.test(s)) v = leeNum(s.slice(0, -1)) / 100;
    else if (/^[^/]+\/[^/]+$/.test(s)) { const [a, b] = s.split('/'); v = leeNum(a) / leeNum(b); }
    else v = leeNum(s);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be a number, a fraction (3/10) or a percentage (30 %)`);
    if (v < 0 || v > 1) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be between 0 and 1 (or between 0 % and 100 %)`);
    return v;
  }
  function leeEntero(sc, k, nom, min, max) {
    if (vacio(sc[k])) throw new Error(`${nom} is missing`);
    const v = leeNum(sc[k]);
    if (!Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be an integer`);
    if (v < min || v > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be between ${min} and ${max}`);
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
    var: 'Variations without repetition',
    varrep: 'Variations with repetition',
    perm: 'Permutations',
    permrep: 'Permutations with repetition',
    comb: 'Combinations',
    combrep: 'Combinations with repetition',
  };

  function combinatoria(sc) {
    const tipo = TIPOS[sc.ctipo] ? sc.ctipo : 'comb';
    let valor, pasos, regla, n, k, grupos;
    const dato = (t, v) => `$${t} = ${v}$`;
    if (tipo === 'permrep') {
      grupos = String(sc.grupos ?? '').split(/[;,\s]+/).filter(Boolean).map((x) => {
        const v = leeNum(x);
        if (!Number.isInteger(v) || v < 1 || v > 1000) throw new Error('The repetitions must be positive integers separated by commas (for example 1, 4, 4, 2)');
        return v;
      });
      if (grupos.length < 1) throw new Error('The list of repetitions is missing (for example 1, 4, 4, 2)');
      n = grupos.reduce((a, b) => a + b, 0);
      if (n > 1000) throw new Error('There are too many elements: the total cannot exceed 1000');
      valor = grupos.reduce((r, g) => r / fact(g), fact(n));
      const den = grupos.map((g) => `${g}!`).join('·');
      regla = { t: 'Permutations with repetition', html: `All the elements are arranged (order matters) and some are indistinguishable: $PR_{${n}}^{${grupos.join(',')}} = {n!}/{${grupos.map((_, i) => `a_${i + 1}!`).join('·')}}$` };
      pasos = [
        { t: 'Data', html: `${grupos.length} types of element, repeated ${grupos.join(', ')} times; $n = ${grupos.join(' + ')} = ${n}$` },
        regla,
        { t: 'Substitute', html: `$PR = {${n}!}/{${den}} = {${grande(fact(n))}}/{${grande(grupos.reduce((r, g) => r * fact(g), 1n))}} = ${grande(valor)}$` },
      ];
    } else {
      n = leeEntero(sc, 'n', 'the number of elements n', 1, tipo === 'varrep' ? 1000 : 1000);
      if (tipo === 'perm') k = n;
      else {
        k = leeEntero(sc, 'k', 'the number chosen k', 1, tipo === 'varrep' || tipo === 'combrep' ? 1000 : n);
        if (tipo !== 'varrep' && tipo !== 'combrep' && k > n) throw new Error('Without repetition you cannot choose more elements than there are (k ≤ n)');
      }
      if (tipo === 'var') {
        valor = permP(n, k);
        regla = { t: 'Variations without repetition', html: `$k$ of $n$ distinct elements are chosen and order matters: $V_{n,k} = {n!}/{(n − k)!} = n(n − 1)⋯(n − k + 1)$` };
        pasos = [{ t: 'Data', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Substitute', html: `$V_{${n},${k}} = {${n}!}/{${n - k}!} = ${Array.from({ length: Math.min(k, 6) }, (_, i) => n - i).join('·')}${k > 6 ? '⋯' + (n - k + 1) : ''} = ${grande(valor)}$` }];
      } else if (tipo === 'varrep') {
        valor = BigInt(n) ** BigInt(k);
        regla = { t: 'Variations with repetition', html: `$k$ choices are made among $n$ elements, repetition allowed, and order matters: $VR_{n,k} = n^k$` };
        pasos = [{ t: 'Data', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Substitute', html: `$VR_{${n},${k}} = ${n}^{${k}} = ${grande(valor)}$` }];
      } else if (tipo === 'perm') {
        valor = fact(n);
        regla = { t: 'Permutations', html: `The $n$ distinct elements are arranged: $P_n = n! = n(n − 1)⋯2·1$` };
        pasos = [{ t: 'Data', html: dato('n', n) }, regla, { t: 'Substitute', html: `$P_{${n}} = ${n}! = ${grande(valor)}$` }];
      } else if (tipo === 'comb') {
        valor = comb(n, k);
        regla = { t: 'Combinations', html: `$k$ of $n$ elements are chosen and order does not matter: $C_{n,k} = binom(n, k) = {n!}/{k!(n − k)!}$` };
        pasos = [{ t: 'Data', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Substitute', html: `$C_{${n},${k}} = {${n}!}/{${k}!·${n - k}!} = ${grande(valor)}$` }];
      } else {
        valor = comb(n + k - 1, k);
        regla = { t: 'Combinations with repetition', html: `$k$ choices are made among $n$ elements, repetition allowed, and order does not matter: $CR_{n,k} = binom(n + k − 1, k)$` };
        pasos = [{ t: 'Data', html: dato('n', n) + ', ' + dato('k', k) }, regla, { t: 'Substitute', html: `$CR_{${n},${k}} = binom(${n + k - 1}, ${k}) = ${grande(valor)}$` }];
      }
    }
    const res = [{ t: TIPOS[tipo], v: grande(valor), pr: true }];
    if (cifras(valor) > 15) res.push({ t: 'Digits', v: String(cifras(valor)) });
    const orden = tipo === 'var' || tipo === 'varrep' || tipo === 'perm' || tipo === 'permrep';
    res.push({ t: 'Does order matter?', v: orden ? 'Yes' : 'No' });
    res.push({ t: 'Can it repeat?', v: tipo === 'varrep' || tipo === 'combrep' ? 'Yes' : 'No' });
    pasos.push({ t: 'Probability of one case', html: `If all cases are equally likely, each has probability $1/${grande(valor)}$ ${cifras(valor) <= 15 ? `$= ${f(1 / Number(valor))}$` : ''}` });
    return { modo: 'comb', tipo, n, k, grupos, valor, res, pasos };
  }

  const RELACIONES = {
    inter: 'I know P(A ∩ B)',
    union: 'I know P(A ∪ B)',
    cond: 'I know P(A | B)',
    indep: 'A and B are independent',
    incomp: 'A and B are mutually exclusive',
  };

  function sucesos(sc) {
    const pa = leeProb(sc, 'pa', 'P(A)'), pb = leeProb(sc, 'pb', 'P(B)');
    const rel = RELACIONES[sc.rel] ? sc.rel : 'inter';
    let pi, pasos = [{ t: 'Data', html: `$P(A) = ${p(pa)}$, $P(B) = ${p(pb)}$` }];
    if (rel === 'inter') {
      pi = leeProb(sc, 'pc', 'P(A ∩ B)');
      pasos[0].html += `, $P(A ∩ B) = ${p(pi)}$`;
    } else if (rel === 'union') {
      const pu = leeProb(sc, 'pc', 'P(A ∪ B)');
      pi = pa + pb - pu;
      pasos[0].html += `, $P(A ∪ B) = ${p(pu)}$`;
      pasos.push({ t: 'Intersection', html: `$P(A ∪ B) = P(A) + P(B) − P(A ∩ B)$ ⇒ $P(A ∩ B) = ${p(pa)} + ${p(pb)} − ${p(pu)} = ${p(pi)}$` });
    } else if (rel === 'cond') {
      const pc = leeProb(sc, 'pc', 'P(A | B)');
      pi = pc * pb;
      pasos[0].html += `, $P(A | B) = ${p(pc)}$`;
      pasos.push({ t: 'Intersection', html: `$P(A ∩ B) = P(A | B)·P(B) = ${p(pc)}·${p(pb)} = ${p(pi)}$` });
    } else if (rel === 'indep') {
      pi = pa * pb;
      pasos.push({ t: 'Intersection', html: `Independent: $P(A ∩ B) = P(A)·P(B) = ${p(pa)}·${p(pb)} = ${p(pi)}$` });
    } else {
      pi = 0;
      pasos.push({ t: 'Intersection', html: `Mutually exclusive: $A ∩ B = ∅$, so $P(A ∩ B) = 0$` });
    }
    const minI = Math.max(0, pa + pb - 1), maxI = Math.min(pa, pb), tol = 1e-9;
    if (pi < minI - tol || pi > maxI + tol) {
      throw new Error(`Those data are impossible: P(A ∩ B) would have to equal ${p(pi)} and must be between ${p(minI)} and ${p(maxI)}`);
    }
    pi = Math.min(maxI, Math.max(minI, pi));
    const pu = pa + pb - pi;
    pasos.push({ t: 'Union', html: `$P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = ${p(pa)} + ${p(pb)} − ${p(pi)} = ${p(pu)}$` });
    const res = [{ t: 'P(A ∩ B)', v: p(pi) }, { t: 'P(A ∪ B)', v: p(pu), pr: true }];
    let indep = null;
    if (pb > 0) {
      const ab = pi / pb;
      res.push({ t: 'P(A | B)', v: p(ab), pr: true });
      pasos.push({ t: 'Conditional', html: `$P(A | B) = {P(A ∩ B)}/{P(B)} = {${p(pi)}}/{${p(pb)}} = ${p(ab)}$` });
    } else pasos.push({ t: 'Conditional', html: `$P(B) = 0$: you cannot condition on an impossible event` });
    if (pa > 0) {
      const ba = pi / pa;
      res.push({ t: 'P(B | A)', v: p(ba), pr: true });
      pasos.push({ t: '', html: `$P(B | A) = {P(A ∩ B)}/{P(A)} = {${p(pi)}}/{${p(pa)}} = ${p(ba)}$` });
    }
    res.push({ t: 'P(Ā)', v: p(1 - pa) }, { t: 'P(B̄)', v: p(1 - pb) }, { t: 'P(Ā ∩ B̄)', v: p(1 - pu) });
    pasos.push({ t: 'Complements', html: `$P(Ā) = 1 − ${p(pa)} = ${p(1 - pa)}$, $P(B̄) = 1 − ${p(pb)} = ${p(1 - pb)}$ and, by De Morgan's laws, $P(Ā ∩ B̄) = 1 − P(A ∪ B) = ${p(1 - pu)}$` });
    indep = Math.abs(pi - pa * pb) < 1e-9;
    pasos.push({ t: 'Independent?', html: `$P(A)·P(B) = ${p(pa * pb)}$ ${indep ? '=' : '≠'} $P(A ∩ B) = ${p(pi)}$ ⇒ ${indep ? 'they are independent' : 'they are not independent'}${pi === 0 && pa * pb > 0 ? ' (they are mutually exclusive, and two mutually exclusive events with non-zero probability are never independent)' : ''}` });
    res.push({ t: 'Independent?', v: indep ? 'Yes' : 'No' });
    return { modo: 'suc', pa, pb, pi, pu, indep, res, pasos };
  }

  function bayes(sc) {
    const nb = String(sc.nb ?? '').trim() || 'B';
    const filas = (sc.filas || []).map((r, i) => ({ i, n: String(r.n ?? '').trim() || `A${i + 1}`, p: r.p, l: r.l })).filter((r) => !(vacio(r.p) && vacio(r.l)));
    if (filas.length < 2) throw new Error('At least two causes are needed (with their P(Aᵢ) and P(B | Aᵢ))');
    for (const r of filas) {
      r.p = leeProb({ x: r.p }, 'x', `P(${r.n})`);
      r.l = leeProb({ x: r.l }, 'x', `P(${nb} | ${r.n})`);
    }
    const suma = filas.reduce((a, r) => a + r.p, 0);
    if (Math.abs(suma - 1) > 1e-6) throw new Error(`The probabilities of the causes must add up to 1 and they add up to ${p(suma)}: the causes form a complete system of events`);
    const obs = sc.obs === 'no' ? 'no' : 'si';
    const nbn = `${nb}̄`;
    for (const r of filas) { r.j = r.p * r.l; r.jn = r.p * (1 - r.l); }
    const pB = filas.reduce((a, r) => a + r.j, 0), pN = 1 - pB;
    const k = obs === 'si' ? pB : pN;
    if (k < 1e-12) throw new Error(obs === 'si' ? `${nb} is impossible with those data: P(Aᵢ | ${nb}) cannot be calculated` : `${nb} always occurs with those data: P(Aᵢ | ${nb}̄) cannot be calculated`);
    for (const r of filas) r.post = (obs === 'si' ? r.j : r.jn) / k;
    const nom = (r) => `A_${r.i + 1}`;
    const pasos = [
      { t: 'Data', html: filas.map((r) => `$P(${nom(r)}) = ${p(r.p)}$, $P(${nb} | ${nom(r)}) = ${p(r.l)}$`).join('; ') + ` (${filas.map((r) => `$${nom(r)}$ = ${r.n}`).join(', ')})` },
      { t: 'Tree diagram', html: `Each branch is multiplied: $P(${nom(filas[0])} ∩ ${nb}) = P(${nom(filas[0])})·P(${nb} | ${nom(filas[0])}) = ${p(filas[0].p)}·${p(filas[0].l)} = ${p(filas[0].j)}$; and likewise for the other branches` },
      { t: 'Total probability', html: `$P(${nb}) = ∑ P(${nom(filas[0])})·P(${nb} | ${nom(filas[0])})$ ⇒ $P(${nb}) = ${filas.map((r) => p(r.j)).join(' + ')} = ${p(pB)}$` },
    ];
    pasos.push({ t: obs === 'si' ? 'Bayes\' theorem' : `Bayes with ${nbn}`, html: obs === 'si'
      ? `$P(A_i | ${nb}) = {P(A_i)·P(${nb} | A_i)}/{P(${nb})}$, which is $P(A_i ∩ ${nb})/P(${nb})$` + filas.map((r) => `<br>$P(${nom(r)} | ${nb}) = {${p(r.j)}}/{${p(pB)}} = ${p(r.post)}$`).join('')
      : `Now it is known that ${nb} has not occurred: $P(${nbn}) = 1 − ${p(pB)} = ${p(pN)}$ and $P(A_i | ${nbn}) = {P(A_i)·(1 − P(${nb} | A_i))}/{P(${nbn})}$` + filas.map((r) => `<br>$P(${nom(r)} | ${nbn}) = {${p(r.jn)}}/{${p(pN)}} = ${p(r.post)}$`).join('') });
    pasos.push({ t: 'Check', html: `The posterior probabilities add up to $${filas.map((r) => p(r.post)).join(' + ')} = ${p(filas.reduce((a, r) => a + r.post, 0))}$ (they must give 1)` });
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
    if (tx.length < 2) throw new Error('Enter at least two values of X separated by semicolons (for example 0; 1; 2; 3)');
    if (tx.length > 40) throw new Error('There are too many values: at most 40');
    if (tp.length !== tx.length) throw new Error(`There are ${tx.length} values and ${tp.length} probabilities: there must be one probability for each value`);
    const xs = tx.map((t) => { const v = leeFrac(t); if (!isFinite(v)) throw new Error(`“${t}” is not a value of X: enter numbers separated by semicolons`); return v; });
    if (new Set(xs).size !== xs.length) throw new Error('There are repeated values of X: each value goes only once, with its probability');
    const hueco = tp.map((t, i) => (t === '?' || /^[a-zA-Z]$/.test(t) ? i : -1)).filter((i) => i >= 0);
    if (hueco.length > 1) throw new Error('Only one probability can be left unspecified (written as ?)');
    const ps = tp.map((t, i) => {
      if (i === hueco[0]) return 0;
      const v = leeFrac(t);
      if (!isFinite(v)) throw new Error(`“${t}” is not a probability: enter 0,3, 30 % or 3/10`);
      if (v < 0 || v > 1) throw new Error(`A probability cannot equal ${p(v)}: all are between 0 and 1`);
      return v;
    });
    const pasos = [];
    let suma = ps.reduce((a, b) => a + b, 0);
    if (hueco.length) {
      const k = 1 - suma;
      if (k < -1e-9) throw new Error(`The given probabilities already add up to ${p(suma)}, more than 1: nothing is left for the missing one`);
      ps[hueco[0]] = Math.max(0, k);
      pasos.push({ t: 'The missing probability', html: `All must add up to 1: $P(X = ${f(xs[hueco[0]])}) = 1 − ${p(suma)} = ${p(ps[hueco[0]])}$` });
      suma = 1;
    } else if (Math.abs(suma - 1) > 1e-6) throw new Error(`The probabilities must add up to 1 and they add up to ${p(suma)}`);
    const orden = xs.map((x, i) => ({ x, p: ps[i] })).sort((a, b) => a.x - b.x);
    let ac = 0; for (const o of orden) { ac += o.p; o.F = Math.min(1, ac); } orden[orden.length - 1].F = 1;
    const mu = orden.reduce((a, o) => a + o.x * o.p, 0), m2 = orden.reduce((a, o) => a + o.x * o.x * o.p, 0);
    const v = Math.max(0, orden.reduce((a, o) => a + (o.x - mu) ** 2 * o.p, 0)), sd = Math.sqrt(v);
    const pmax = Math.max(...orden.map((o) => o.p)), modas = orden.filter((o) => Math.abs(o.p - pmax) < 1e-12).map((o) => o.x);
    const im = orden.findIndex((o) => o.F >= 0.5 - 1e-12), med = Math.abs(orden[im].F - 0.5) < 1e-12 && orden[im + 1] ? (orden[im].x + orden[im + 1].x) / 2 : orden[im].x;
    const n = (x) => f(x, 5), par = (x) => (x < 0 ? `(${n(x)})` : n(x));
    const corta = (ts) => (ts.length > 8 ? [...ts.slice(0, 4), '…', ...ts.slice(-2)] : ts).join(' + ');
    pasos.unshift({ t: 'Probability function', html: `X takes ${orden.length} values; their probabilities are all positive or zero and add up to $${p(suma)}$, so it is a valid probability function.` });
    pasos.push({ t: 'Expected value', html: `$E[X] = μ = ∑ x_i·p_i = ${corta(orden.map((o) => `${par(o.x)}·${p(o.p)}`))} = ${n(mu)}$` });
    pasos.push({ t: 'Variance', html: `$E[X^2] = ∑ x_i^2·p_i = ${corta(orden.map((o) => `${par(o.x)}^2·${p(o.p)}`))} = ${n(m2)}$ y $"Var"(X) = E[X^2] − μ^2 = ${n(m2)} − ${par(mu)}^2 = ${n(v)}$` });
    pasos.push({ t: 'Standard deviation', html: `$σ = √{"Var"(X)} = √{${n(v)}} = ${n(sd)}$` });
    pasos.push({ t: 'Distribution function', html: `$F(x) = P(X ≤ x)$ accumulates the probabilities and rises in jumps at each value: ${(orden.length > 8 ? [...orden.slice(0, 4), null, ...orden.slice(-2)] : orden).map((o) => (o ? `$F(${n(o.x)}) = ${p(o.F)}$` : '…')).join(', ')}. It is 0 before $${n(orden[0].x)}$ and 1 from $${n(orden[orden.length - 1].x)}$.` });
    const res = [{ t: 'E[X] = μ', v: n(mu), pr: true }, { t: 'Var(X)', v: n(v), pr: true }, { t: 'σ', v: n(sd), pr: true }, { t: 'E[X²]', v: n(m2) }, { t: modas.length > 1 ? 'Modes' : 'Mode', v: modas.length === orden.length ? 'None: all equally likely' : modas.map((x) => n(x)).join('; ') }, { t: 'Median', v: n(med) }];
    let k = null, pk = null;
    if (!vacio(sc.vak)) {
      k = leeFrac(String(sc.vak).trim().replace(/[−–]/g, '-'));
      if (!isFinite(k)) throw new Error('The value of x at which it is calculated must be a number');
      const men = orden.filter((o) => o.x < k - 1e-12).reduce((a, o) => a + o.p, 0), ig = orden.filter((o) => Math.abs(o.x - k) <= 1e-12).reduce((a, o) => a + o.p, 0);
      pk = { menor: men, igual: ig, menorIgual: men + ig, mayor: Math.max(0, 1 - men - ig), mayorIgual: Math.max(0, 1 - men) };
      res.push({ t: `P(X ≤ ${n(k)})`, v: p(pk.menorIgual), pr: true }, { t: `P(X = ${n(k)})`, v: p(pk.igual) }, { t: `P(X < ${n(k)})`, v: p(pk.menor) }, { t: `P(X > ${n(k)})`, v: p(pk.mayor) }, { t: `P(X ≥ ${n(k)})`, v: p(pk.mayorIgual) });
      pasos.push({ t: `Probabilities at x = ${n(k)}`, html: `$P(X ≤ ${n(k)}) = F(${n(k)}) = ${p(pk.menorIgual)}$, $P(X < ${n(k)}) = ${p(pk.menor)}$ (sin contar el propio valor), $P(X > ${n(k)}) = 1 − F(${n(k)}) = ${p(pk.mayor)}$ y $P(X ≥ ${n(k)}) = 1 − P(X < ${n(k)}) = ${p(pk.mayorIgual)}$` });
    }
    const a = vacio(sc.vaa) ? 1 : leeFrac(String(sc.vaa).trim().replace(/[−–]/g, '-')), b = vacio(sc.vab) ? 0 : leeFrac(String(sc.vab).trim().replace(/[−–]/g, '-'));
    if (!isFinite(a) || !isFinite(b)) throw new Error('In Y = aX + b, a and b must be numbers');
    let Y = null;
    if (a !== 1 || b !== 0) {
      Y = { a, b, mu: a * mu + b, v: a * a * v, sd: Math.abs(a) * sd };
      res.push({ t: 'E[Y]', v: n(Y.mu), pr: true }, { t: 'Var(Y)', v: n(Y.v), pr: true }, { t: 'σ of Y', v: n(Y.sd) });
      pasos.push({ t: 'Linear change Y = aX + b', html: `With $a = ${n(a)}$ and $b = ${n(b)}$: $E[Y] = a·E[X] + b = ${par(a)}·${par(mu)} + ${par(b)} = ${n(Y.mu)}$. The variance does not notice the shift and is multiplied by $a^2$: $"Var"(Y) = a^2·"Var"(X) = ${par(a)}^2·${n(v)} = ${n(Y.v)}$, and $σ_Y = |a|·σ = ${n(Y.sd)}$.` });
    }
    const tabla = { cab: ['x', 'P(X = x)', 'F(x)', 'x·p', 'x²·p'], filas: orden.map((o) => [n(o.x), p(o.p), p(o.F), n(o.x * o.p), n(o.x * o.x * o.p)]), pie: ['Sum', p(suma), '', n(mu), n(m2)] };
    return { modo: 'va', xs: orden.map((o) => o.x), ps: orden.map((o) => o.p), F: orden.map((o) => o.F), mu, m2, v, sd, modas, med, k, pk, Y, tabla, res, pasos };
  }

  function contingencia(sc) {
    const limpia = (v, d) => String(v ?? '').replace(/["$<>{}]/g, '').trim() || d, na = limpia(sc.ta, 'A'), nb = limpia(sc.tb, 'B');
    const no = (x) => (x.length > 1 ? `no ${x}` : `${x}̄`), nan = no(na), nbn = no(nb), M = (x) => (x.length > 1 ? `"${x}"` : x), ma = M(na), mb = M(nb), man = M(nan), mbn = M(nbn);
    const celda = (k, nom) => {
      if (vacio(sc[k])) throw new Error(`The cell for ${nom} is missing`);
      const v = leeFrac(String(sc[k]).trim().replace(/\s/g, '').replace(/[−–]/g, '-'));
      if (!isFinite(v)) throw new Error(`The cell for ${nom} must be a number (cases or probability)`);
      if (v < 0) throw new Error(`The cell for ${nom} cannot be negative`);
      return v;
    };
    const c = [[celda('t11', `${na} y ${nb}`), celda('t12', `${na} y no ${nb}`)], [celda('t21', `no ${na} y ${nb}`), celda('t22', `ni ${na} ni ${nb}`)]];
    const N = c[0][0] + c[0][1] + c[1][0] + c[1][1];
    if (!(N > 0)) throw new Error('The table is empty: at least one cell must be greater than zero');
    const fA = c[0][0] + c[0][1], fB = c[0][0] + c[1][0], pa = fA / N, pb = fB / N, pi = c[0][0] / N, pu = pa + pb - pi;
    const n = (x) => f(x, 6), prob = Math.abs(N - 1) < 1e-9, sobre = (x) => (prob ? p(x) : `{${n(x)}}/{${n(N)}}`);
    const pasos = [
      { t: 'Totals', html: prob ? `The cells are already probabilities and add up to 1. Adding rows and columns: $P(${ma}) = ${p(c[0][0])} + ${p(c[0][1])} = ${p(pa)}$ and $P(${mb}) = ${p(c[0][0])} + ${p(c[1][0])} = ${p(pb)}$`
        : `There are $N = ${n(N)}$ cases in total. Adding rows and columns: ${n(fA)} are ${na} and ${n(fB)} are ${nb}.` },
      { t: 'Probabilities of each event', html: prob ? `$P(${man}) = 1 − ${p(pa)} = ${p(1 - pa)}$, $P(${mbn}) = 1 − ${p(pb)} = ${p(1 - pb)}$` : `Laplace's rule, favourable cases over possible cases: $P(${ma}) = {${n(fA)}}/{${n(N)}} = ${p(pa)}$, $P(${mb}) = {${n(fB)}}/{${n(N)}} = ${p(pb)}$` },
      { t: 'Intersection and union', html: `$P(${ma} ∩ ${mb}) = ${sobre(c[0][0])}${prob ? '' : ` = ${p(pi)}`}$ (the cell where they cross) and $P(${ma} ∪ ${mb}) = P(${ma}) + P(${mb}) − P(${ma} ∩ ${mb}) = ${p(pa)} + ${p(pb)} − ${p(pi)} = ${p(pu)}$` },
    ];
    const res = [{ t: `P(${na})`, v: p(pa) }, { t: `P(${nb})`, v: p(pb) }, { t: `P(${na} ∩ ${nb})`, v: p(pi), pr: true }, { t: `P(${na} ∪ ${nb})`, v: p(pu), pr: true }];
    const cond = [];
    if (fB > 0) { res.push({ t: `P(${na} | ${nb})`, v: p(c[0][0] / fB), pr: true }); cond.push(`$P(${ma} | ${mb}) = {${n(c[0][0])}}/{${n(fB)}} = ${p(c[0][0] / fB)}$`); }
    if (fA > 0) { res.push({ t: `P(${nb} | ${na})`, v: p(c[0][0] / fA), pr: true }); cond.push(`$P(${mb} | ${ma}) = {${n(c[0][0])}}/{${n(fA)}} = ${p(c[0][0] / fA)}$`); }
    if (N - fB > 0) { res.push({ t: `P(${na} | ${nbn})`, v: p(c[0][1] / (N - fB)) }); cond.push(`$P(${ma} | ${mbn}) = {${n(c[0][1])}}/{${n(N - fB)}} = ${p(c[0][1] / (N - fB))}$`); }
    if (N - fA > 0) { res.push({ t: `P(${nb} | ${nan})`, v: p(c[1][0] / (N - fA)) }); cond.push(`$P(${mb} | ${man}) = {${n(c[1][0])}}/{${n(N - fA)}} = ${p(c[1][0] / (N - fA))}$`); }
    pasos.push({ t: 'Conditionals', html: `Conditioning means keeping a single row or column and dividing by its total: ${cond.join(', ')}` });
    const indep = Math.abs(pi - pa * pb) < 1e-9;
    pasos.push({ t: 'Independent?', html: `$P(${ma})·P(${mb}) = ${p(pa)}·${p(pb)} = ${p(pa * pb)}$ ${indep ? '=' : '≠'} $P(${ma} ∩ ${mb}) = ${p(pi)}$ ⇒ ${indep ? 'they are independent: the rows of the table are proportional' : 'they are not independent'}` });
    res.push({ t: `P(${nan} ∩ ${nbn})`, v: p(c[1][1] / N) }, { t: 'Independent?', v: indep ? 'Yes' : 'No' });
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
    filas: [{ n: 'Machine 1', p: '0,5', l: '0,01' }, { n: 'Machine 2', p: '0,3', l: '0,02' }, { n: 'Machine 3', p: '0,2', l: '0,03' }, { n: '', p: '', l: '' }],
    vax: '0; 1; 2; 3', vap: '1/8; 3/8; 3/8; 1/8', vak: '', vaa: '', vab: '',
    ta: 'A', tb: 'B', t11: '30', t12: '20', t21: '15', t22: '35',
  });
  const ej = (clave, nombre, extra) => ({ clave, nombre, sc: { ...base(), ...extra } });
  const ejemplos = [
    ej('podio', 'Combinatorics · Podium of 3 among 10 runners', { modo: 'comb', ctipo: 'var', n: '10', k: '3' }),
    ej('loteria', 'Combinatorics · Lottery: 6 numbers out of 49', { modo: 'comb', ctipo: 'comb', n: '49', k: '6' }),
    ej('clave', 'Combinatorics · 4-digit code', { modo: 'comb', ctipo: 'varrep', n: '10', k: '4' }),
    ej('mississippi', 'Combinatorics · Anagrams of MISSISSIPPI', { modo: 'comb', ctipo: 'permrep', grupos: '1, 4, 4, 2' }),
    ej('helados', 'Combinatorics · 5 scoops of ice cream from 3 flavours', { modo: 'comb', ctipo: 'combrep', n: '3', k: '5' }),
    ej('union', 'Events · A and B with the given union', { modo: 'suc', pa: '0,6', pb: '0,5', rel: 'union', pc: '0,85' }),
    ej('independientes', 'Events · Independent A and B', { modo: 'suc', pa: '0,5', pb: '0,4', rel: 'indep', pc: '' }),
    ej('fabrica', 'Bayes · Three machines and defective parts', { modo: 'bayes' }),
    ej('diagnostico', 'Bayes · Medical test (sick / healthy)', { modo: 'bayes', nb: '+', filas: [{ n: 'Sick', p: '0,01', l: '0,95' }, { n: 'Healthy', p: '0,99', l: '0,05' }, { n: '', p: '', l: '' }, { n: '', p: '', l: '' }] }),
    ej('caras', 'Random variable · Heads when tossing three coins', { modo: 'va', vax: '0; 1; 2; 3', vap: '1/8; 3/8; 3/8; 1/8', vak: '1' }),
    ej('dado', 'Random variable · A die and the gain Y = 2X − 5', { modo: 'va', vax: '1; 2; 3; 4; 5; 6', vap: '1/6; 1/6; 1/6; 1/6; 1/6; 1/6', vaa: '2', vab: '−5' }),
    ej('incognita', 'Random variable · A probability is missing', { modo: 'va', vax: '−1; 0; 2; 5', vap: '0,2; 0,35; ?; 0,15' }),
    ej('encuesta', '2 × 2 table · Sport and smoking in 100 people', { modo: 'tabla', ta: 'Sport', tb: 'Smokes', t11: '10', t12: '50', t21: '20', t22: '20' }),
    ej('tabla-indep', '2 × 2 table · Two independent events', { modo: 'tabla', ta: 'A', tb: 'B', t11: '0,12', t12: '0,28', t21: '0,18', t22: '0,42' }),
    ej('sin-defecto', 'Bayes · Part without defect (complementary event)', { modo: 'bayes', obs: 'no' }),
  ];

  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const a = e(2, 6) * 5, b = e(2, 6) * 5, c = 100 - a - b;
    if (c < 10) return azar();
    const nombres = ['Machine 1', 'Machine 2', 'Machine 3'], ps = [a, b, c].map((x) => String(x / 100).replace('.', '.'));
    const ls = [e(1, 6), e(1, 6), e(1, 6)].map((x) => String(x / 100).replace('.', '.'));
    return { ...base(), modo: 'bayes', obs: 'si', nb: 'D', filas: nombres.map((n, i) => ({ n, p: ps[i], l: ls[i] })).concat([{ n: '', p: '', l: '' }]) };
  }

  return { resolver, ejemplos, azar, f, p, TIPOS, RELACIONES, leeProb, grande };
})();

