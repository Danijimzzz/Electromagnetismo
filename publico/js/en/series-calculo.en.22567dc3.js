const Series = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const DV = typeof Derivadas !== 'undefined' ? Derivadas : require('../derivadas/calculo.js');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 6) => {
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '−∞';
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-4 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `{${sg === '-' ? '−' : ''}${+e}}`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const fh = (x, d) => f(x, d).replace(/·10\^\{(−?\d+)\}/, '·10<sup>$1</sup>');

  const LISTAS = [[1e3, 1e4, 1e5, 1e6], [20, 40, 80, 120], [10, 15, 20, 30, 40, 60], [5, 8, 12, 16, 20, 25]];

  const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];
  const cTxt = (x) => String(+x.toFixed(12));
  function resolver(sc) {
    if (vacio(sc.an)) throw new Error('The general term aₙ is missing');
    const n0 = vacio(sc.n0) ? 1 : +String(sc.n0).trim().replace(',', '.');
    if (!Number.isInteger(n0) || n0 < 0 || n0 > 1000) throw new Error('The first value of n has to be an integer between 0 and 1000');
    const ast = E.lee(sc.an, 'The general term aₙ', ['n']);
    const a = (n) => E.valor(ast, 0, { n });
    const A0 = a(n0);
    if (!isFinite(A0)) throw new Error(`aₙ is not defined for n = ${n0} (it gives ${Number.isNaN(A0) ? 'a non-real value or 0/0' : 'infinity'}): start at a larger n`);
    const T = E.texto(ast);
    for (let n = n0; n < n0 + 60; n++) if (!isFinite(a(n))) throw new Error(`aₙ is not defined for n = ${n}: the series makes no sense from n = ${n0}`);
    const ns = LISTAS.find((L) => L.every((n) => isFinite(a(n)) && a(n) !== 0 && isFinite(a(n + 1)) && a(n + 1) !== 0));
    const pasos = [{ t: 'Series', html: `$∑_{n=${n0}}^{∞} a_n = ∑_{n=${n0}}^{∞} ${T}$` }];
    const out = { an: sc.an, n0, T, pasos, pruebas: [] };
    {
      const vs = []; for (let n = n0; n < n0 + 9; n++) vs.push(a(n));
      const cerca = (u, v) => Math.abs(u - v) <= 1e-9 * Math.max(Math.abs(u), Math.abs(v), 1e-300);
      const C = vs[0], fx = (c, t) => (cTxt(c) === '1' ? t : `${cTxt(c)}${t.startsWith('1/') ? t.slice(1) : ` ${t}`}`);
      const r = vs[1] / vs[0];
      if (C !== 0 && isFinite(r) && r !== 0 && vs.every((v, i) => cerca(v, C * r ** i))) out.desarrollo = { f: C === 1 ? '1/(1-x)' : `${cTxt(C)}/(1-x)`, x0: cTxt(r), n: 8, tipo: 'geometric' };
      else if (n0 === 0 && C !== 0 && isFinite(r) && r !== 0 && vs.every((v, i) => cerca(v, C * r ** i / FACT[i]))) out.desarrollo = { f: C === 1 ? 'e^x' : `${cTxt(C)} e^x`, x0: cTxt(r), n: 8, tipo: 'exponencial' };
    }
    const nums = Array.from({ length: 8 }, (_, i) => a(n0 + i));
    pasos.push({ t: 'First terms', html: `$${nums.map((v) => f(v, 5)).join(' ; ')} ; …$` });
    if (!ns) {
      out.veredicto = 'indeterminado';
      out.texto = 'I cannot evaluate aₙ for large n (it vanishes or overflows), so I cannot apply the tests.';
      pasos.push({ t: 'Conclusion', html: out.texto });
      out.parciales = parciales(a, n0, 40);
      return out;
    }
    const grandes = ns[0] >= 1000;

    const vals = ns.map((n) => a(n)), L = vals[vals.length - 1];
    const U = vals[vals.length - 1], P = vals[vals.length - 2];
    const tiendeA0 = Math.abs(U) < 1e-8 || Math.abs(U) < 0.95 * Math.abs(P);
    const crece = Math.abs(U) > 1e12 && Math.abs(U) >= Math.abs(P);
    const lim = crece ? (U > 0 ? Infinity : -Infinity) : tiendeA0 ? 0 : U;
    const limTxt = crece ? (U > 0 ? '∞' : '−∞') : tiendeA0 ? '0' : f(U, 5);
    const osc = !tiendeA0 && !crece && Math.abs(U - P) > 0.5 * Math.abs(U);
    const noCero = !tiendeA0 || osc;
    pasos.push({ t: 'Necessary condition', html: noCero ? `$lim_{n→∞} a_n ${osc && !isFinite(lim) ? 'does not exist' : `= ${limTxt} ≠ 0`}$: since the terms do not tend to 0, <b>the series diverges</b>.` : `$lim_{n→∞} a_n = ${limTxt} = 0$: the necessary condition holds, but it is not enough; a test has to be applied.` });
    out.limite = lim;
    out.pruebas.push({ nombre: 'Necessary condition', veredicto: noCero ? 'diverge' : 'no concluye' });
    if (noCero) {
      out.veredicto = 'diverge'; out.absoluta = false;
      out.texto = `Diverges: aₙ does not tend to 0 (limit ${limTxt}).`;
      pasos.push({ t: 'Conclusion', html: out.texto });
      out.parciales = parciales(a, n0, 40);
      return out;
    }

    const raz = [0, 1, 2, 3].map((k) => a(n0 + k + 1) / a(n0 + k));
    const geo = raz.every((r) => Math.abs(r - raz[0]) < 1e-9 * Math.max(1, Math.abs(raz[0])));
    const r = raz[0];
    let geoV = null;
    if (geo) {
      const q = Math.abs(r) < 1 ? 'converge' : 'diverge';
      geoV = q;
      const S = A0 / (1 - r);
      out.pruebas.push({ nombre: 'Geometric series', veredicto: q });
      pasos.push({ t: 'Geometric series', html: q === 'converge' ? `Each term is $r = ${f(r, 8)}$ times the previous one and $|r| < 1$: it <b>converges</b> and its sum is $S = {a_{${n0}}}/{1 − r} = {${f(A0, 8)}}/{1 − ${f(r, 8).replace('−', '(−') + (r < 0 ? ')' : '')}} = ${f(S, 8)}$.` : `Each term is $r = ${f(r, 8)}$ times the previous one and $|r| ≥ 1$: it <b>diverges</b>.` });
      if (q === 'converge') out.sumaExacta = S;
    }

    const rr = ns.map((n) => Math.abs(a(n + 1) / a(n)));
    const nA = ns[ns.length - 1], nB = ns[ns.length - 2];
    const Lc = Math.max(0, (nA * rr[rr.length - 1] - nB * rr[rr.length - 2]) / (nA - nB));
    const estable = (v) => Math.abs(v[v.length - 1] - v[v.length - 2]) < 0.05 * Math.max(1, v[v.length - 1]);
    const vc = !estable(rr) ? 'no concluye' : Lc < 0.97 ? 'converge' : Lc > 1.03 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Ratio test', veredicto: vc, valor: Lc });
    pasos.push({ t: 'Ratio test (d’Alembert)', html: `$L = lim_{n→∞} |{a_{n+1}}/{a_n}| ≈ ${f(Lc, 4)}$ (with $n$ = ${nA}${nB !== nA ? ` and ${nB}` : ''} and extrapolating). ${vc === 'converge' ? 'Since $L < 1$, it <b>converges absolutely</b>.' : vc === 'diverge' ? 'Since $L > 1$, it <b>diverges</b>.' : estable(rr) ? '$L ≈ 1$: the test is <b>inconclusive</b>.' : 'The ratio does not settle (aₙ oscillates or vanishes): the test is <b>inconclusive</b>.'}` });

    const rt = ns.map((n) => Math.abs(a(n)) ** (1 / n));
    const Lr = rt[rt.length - 1];
    const vr = !estable(rt) ? 'no concluye' : Lr < 0.95 ? 'converge' : Lr > 1.05 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Root test', veredicto: vr, valor: Lr });
    pasos.push({ t: 'Root test (Cauchy)', html: `$L = lim_{n→∞} |a_n|^{1/n} ≈ ${f(Lr, 4)}$ ${vr === 'converge' ? '$< 1$: <b>converges absolutely</b>.' : vr === 'diverge' ? '$> 1$: <b>diverges</b>.' : '(close to 1): the test is <b>inconclusive</b>.'}` });

    let pot = null;
    if (grandes) {
      const pp = (n) => -Math.log(Math.abs(a(2 * n) / a(n))) / Math.LN2;
      const p1 = pp(1e3), p2 = pp(1e5), p3 = pp(1e6);
      if (isFinite(p1) && isFinite(p2) && Math.abs(p1 - p2) < 0.02 && Math.abs(p2) < 50) {
        const q3 = isFinite(p3) ? p3 : p2;
        const pura = isFinite(p3) && Math.abs(p1 - p2) < 1e-7 && Math.abs(p2 - p3) < 1e-7;
        const pr = Math.round(q3 * 2) / 2;
        const exacto = !pura && Math.abs(q3 - pr) < 1e-4 && Math.abs(p1 - pr) < 0.02;
        const pu = pura ? +q3.toFixed(6) : exacto ? pr : q3;
        const C = Math.abs(a(1e5)) * 1e5 ** pu;
        const cerca1 = !pura && !exacto && Math.abs(pu - 1) < 0.03;
        const v = cerca1 ? 'no concluye' : pu > 1 ? 'converge' : 'diverge';
        pot = { p: pu, C, pura, v };
        out.pruebas.push({ nombre: 'Comparison with 1/nᵖ', veredicto: v, valor: pu });
        pasos.push({ t: 'Comparison with the p-series', html: `For large $n$, $|a_n| ≈ ${f(C, 4)} · {1}/{n^{${f(pu, 6)}}}$, of the form $C/n^p$ with $p = ${f(pu, 6)}$${pura ? ' (exact exponent: aₙ is a power of n)' : ''}. ${cerca1 ? 'Since $p$ is so close to 1 and is only an estimate (aₙ is not exactly a power of $n$), the comparison is <b>inconclusive</b>: try the integral test or an inequality.' : pu > 1 ? 'Since $p > 1$, the series $∑ 1/n^p$ converges and (by the limit comparison test) it <b>converges absolutely</b>.' : 'Since $p ≤ 1$, the series $∑ 1/n^p$ diverges and <b>$∑ |a_n|$ diverges</b>.'}` });
      } else {
        out.pruebas.push({ nombre: 'Comparison with 1/nᵖ', veredicto: 'no aplica' });
      }
    }

    const sg = Array.from({ length: 12 }, (_, i) => Math.sign(a(n0 + i)));
    const alterna = sg.every((s, i) => i === 0 || s * sg[i - 1] < 0);
    const positiva = sg.every((s) => s > 0) || sg.every((s) => s < 0);
    let leib = null;
    if (alterna) {
      const mono = Array.from({ length: 200 }, (_, i) => Math.abs(a(n0 + i + 1)) <= Math.abs(a(n0 + i)) * (1 + 1e-12)).every(Boolean);
      const monoG = ns.every((n) => Math.abs(a(n + 1)) <= Math.abs(a(n)) * (1 + 1e-12));
      leib = mono && monoG;
      out.pruebas.push({ nombre: 'Leibniz test', veredicto: leib ? 'converge' : 'no concluye' });
      pasos.push({ t: 'Alternating series: Leibniz test', html: `The signs alternate, $|a_n|$ ${leib ? 'is decreasing' : 'does not seem to be decreasing'} and $a_n → 0$. ${leib ? 'By Leibniz the series <b>converges</b>.' : 'I cannot be sure that $|a_n|$ decreases, so the test is <b>inconclusive</b>.'}` });
    } else if (!positiva) {
      pasos.push({ t: 'Signs', html: 'The terms change sign without alternating: the tests above apply to $|a_n|$ (absolute convergence); if the absolute one fails, the series could converge conditionally and this is not decided here.' });
    }

    let integ = null;
    const sgn = Math.sign(a(ns[0])), mismoSigno = sgn !== 0 && sg.every((q) => q === 0 || q === sgn);
    if (mismoSigno && !alterna && !geo) {
      try { integ = criterioIntegral(ast, a, n0, ns, sgn); } catch (e) { integ = null; }
      if (integ) { out.pruebas.push({ nombre: 'Integral test', veredicto: integ.v, ...(integ.I !== undefined ? { valor: integ.I } : {}) }); pasos.push({ t: 'Integral test', html: integ.html }); out.integral = { v: integ.v, I: integ.I, exacta: integ.exacta, m: integ.m }; }
    }

    const decideInt = integ && integ.v !== 'no concluye' && vc === 'no concluye' && vr === 'no concluye' && (integ.exacta || !pot || pot.v === 'no concluye');
    const abs = decideInt ? integ.v : geo ? (geoV === 'converge' ? 'converge' : 'diverge') : (vc !== 'no concluye' ? vc : vr !== 'no concluye' ? vr : pot ? out.pruebas.find((p) => p.nombre.startsWith('Comparison')).veredicto : 'no concluye');
    let veredicto, texto;
    const divAbsSolo = (vc === 'diverge' || vr === 'diverge') ? 'serie' : 'abs';
    if (abs === 'converge') { veredicto = 'converge'; out.absoluta = true; texto = 'It converges absolutely (and therefore converges).'; }
    else if (abs === 'diverge' && divAbsSolo === 'serie' && !geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'It diverges.'; }
    else if (abs === 'diverge' && geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'It diverges.'; }
    else if (abs === 'diverge') {
      if (leib) { veredicto = 'converge'; out.absoluta = false; texto = 'It converges conditionally: Σ|aₙ| diverges but Σaₙ converges by Leibniz.'; }
      else if (positiva || mismoSigno) { veredicto = 'diverge'; out.absoluta = false; texto = 'It diverges.'; }
      else { veredicto = 'indeterminado'; texto = 'Σ|aₙ| diverges and I cannot decide whether Σaₙ converges conditionally.'; }
    } else if (leib) { veredicto = 'converge'; out.absoluta = null; texto = 'It converges by Leibniz (I could not decide whether it also converges absolutely).'; }
    else { veredicto = 'indeterminado'; texto = 'None of the implemented tests decides: try comparing with another series or the Raabe test.'; }
    out.veredicto = veredicto; out.texto = texto;
    pasos.push({ t: 'Conclusion', html: `<b>${texto}</b>` });

    out.parciales = parciales(a, n0, 40);
    if (veredicto === 'converge') {
      const S = estimaSuma(a, n0, { geo, S: out.sumaExacta, alterna, pot, L: Lc, cola: decideInt && integ.cola && !(pot && pot.pura) ? integ.cola : null, sg: sgn });
      out.suma = S.v; out.sumaError = S.err;
      pasos.push({ t: 'Sum', html: geo ? `$S = ${f(S.v, 8)}$ (exact, from the geometric formula).` : `$S ≈ ${f(S.v, 6)}$ ${S.nota}` });
    }
    return out;
  }

  const enX = (n) => (!n || typeof n !== 'object' ? n : n.t === 'x' ? { t: 'x' } : n.t === 'fn' && n.f === 'fact' ? null : Object.fromEntries(Object.entries(n).map(([k, v]) => [k, enX(v)])));
  const entera = (n) => !n || typeof n !== 'object' || Object.values(n).every((v) => v !== null && entera(v));
  function limInf(n) {
    const a = n.a ? limInf(n.a) : null, b = n.b ? limInf(n.b) : null;
    switch (n.t) {
      case 'n': return n.v;
      case 'c': return E.valor(n, 0);
      case 'x': return n.n ? null : Infinity;
      case 'neg': return a === null ? null : -a;
      case '+': case '-': { if (a === null || b === null) return null; const c = n.t === '-' ? -b : b; return !isFinite(a) && !isFinite(c) && a !== c ? null : a + c; }
      case '*': return a === null || b === null || (a === 0 && !isFinite(b)) || (b === 0 && !isFinite(a)) ? null : a * b;
      case '/': return a === null || b === null || b === 0 || (!isFinite(a) && !isFinite(b)) ? null : a / b;
      case '^': return a === null || b === null || a < 0 || (a === 1 && !isFinite(b)) || (a === 0 && b <= 0) || (!isFinite(a) && b === 0) ? null : a ** b;
      case 'fn': {
        if (a === null) return null;
        if (n.f === 'abs') return Math.abs(a);
        if (n.f === 'ln' || n.f === 'log') return a === Infinity ? Infinity : a > 0 ? E.valor({ ...n, a: { t: 'n', v: a } }, 0) : null;
        if (n.f === 'sqrt' || n.f === 'cbrt') return a === Infinity ? Infinity : a >= 0 ? E.valor({ ...n, a: { t: 'n', v: a } }, 0) : null;
        if (n.f === 'arctan') return a === Infinity ? Math.PI / 2 : a === -Infinity ? -Math.PI / 2 : Math.atan(a);
        if (!isFinite(a)) return null;
        const v = E.valor({ ...n, a: { t: 'n', v: a } }, 0); return isFinite(v) ? v : null;
      }
    }
    return null;
  }
  function limEscalera(g) {
    const todos = [5, 10, 20, 40, 80, 160].map((k) => g(10 ** k)), corte = todos.findIndex((y) => !isFinite(y)), v = corte < 0 ? todos : todos.slice(0, corte);
    if (v.length < 4) return null;
    const d = v.slice(1).map((y, i) => y - v[i]), u = v[v.length - 1], esc = Math.max(1, Math.abs(u)), n = d.length;
    if (d.slice(-2).every((q) => Math.abs(q) < 1e-10 * esc)) return { L: u };
    const r1 = Math.abs(d[n - 1] / d[n - 2]), r2 = Math.abs(d[n - 2] / d[n - 3]);
    if (r1 <= 0.6 && r2 <= 0.6) return { L: u + (d[n - 1] * r1) / (1 - r1) };
    if (r1 >= 1 && r2 >= 1 && d.every((q) => Math.sign(q) === Math.sign(d[0]))) return { L: Math.sign(d[0]) * Infinity };
    return null;
  }
  function simpsonLog(g, p, q, m = 4000) {
    const a = Math.log(p), b = Math.log(q), h = (b - a) / m, G = (u) => { const x = Math.exp(u); return g(x) * x; };
    let t = G(a) + G(b); for (let i = 1; i < m; i++) t += (i % 2 ? 4 : 2) * G(a + i * h);
    return (t * h) / 3;
  }
  function criterioIntegral(ast, a, n0, ns, sg) {
    const fx = enX(ast);
    if (!entera(fx) || !DV) return null;
    const g = (x) => sg * E.valor(fx, x);
    let m = n0;
    for (let k = n0; k < n0 + 300; k += 0.5) { if (g(k) === 0 && k > m + 2) break; if (!(g(k) > 0) || !(g(k + 0.5) <= g(k) * (1 + 1e-12))) m = Math.floor(k) + 1; }
    if (m > n0 + 100 || !ns.every((n) => g(n) >= 0 && g(n + 0.5) <= g(n) && g(n + 1) <= g(n + 0.5))) return null;
    const Tf = DV.T(fx), base = `$f(x) = ${Tf}$ is positive and decreasing for $x ≥ ${m}$, so the series and the integral $∫_{${m}}^{∞} f(x) dx$ either both converge or both diverge.`;
    let F = null; try { const r = DV.prim(E.simp(fx), []); F = r && E.simp(r.F); if (F && !DV.igualNum(E.deriva(F), fx, 1e-6)) F = null; } catch (e) { F = null; }
    const Ff = F && ((x) => sg * E.valor(F, x));
    if (F && isFinite(Ff(m))) {
      const est = limInf(F), lim = est !== null ? { L: sg * est } : limEscalera(Ff), segura = est !== null, pr = `<br>Antiderivative: $F(x) = ∫ f(x) dx = ${sg < 0 ? '−(' : ''}${DV.T(F)}${sg < 0 ? ')' : ''}$.`;
      if (!lim) return { v: 'no concluye', html: `${base}${pr}<br>I cannot decide with certainty whether $F(b)$ has a finite limit as $b → ∞$ (it grows or settles very slowly): check it by hand.` };
      if (!isFinite(lim.L)) return { v: 'diverge', exacta: segura, html: `${base}${pr}<br>$∫_{${m}}^{∞} f(x) dx = lim_{b→∞} F(b) − F(${m}) = ∞$: the integral diverges and, by the integral test, <b>the series diverges</b>.` };
      const I = lim.L - Ff(m), cola = (N) => lim.L - Ff(N);
      return { v: 'converge', exacta: segura, I, m, cola, html: `${base}${pr}<br>$∫_{${m}}^{∞} f(x) dx = lim_{b→∞} F(b) − F(${m}) = ${f(lim.L, 6)} − ${f(Ff(m), 6).replace(/^−(.*)$/, '(−$1)')} = ${f(I, 6)}$: the integral converges and, by the integral test, <b>the series converges</b>.` };
    }
    const cotas = [5, 10, 20, 40, 80, 160]; let acc = 0, ant = m; const tabla = cotas.map((k) => { acc += simpsonLog(g, ant, 10 ** k); ant = 10 ** k; return acc; });
    const lim = tabla.every(isFinite) ? limEscalera((x) => tabla[cotas.indexOf(Math.round(Math.log10(x)))]) : null, aviso = `<br>I cannot find an antiderivative of $f$ with elementary functions, so the integral is <b>estimated numerically</b> (up to $x = 10^{5}$, $10^{10}$, $10^{20}$… with Simpson's rule): it is an estimate, not a proof.`;
    if (!lim) return { v: 'no concluye', html: `${base}${aviso}<br>The estimate does not make it clear whether the integral converges.` };
    if (!isFinite(lim.L)) return { v: 'diverge', exacta: false, html: `${base}${aviso}<br>The integral grows without bound ($≈ ${tabla.slice(0, 4).map((v) => f(v, 4)).join(' ; ')}$…): <b>the series diverges</b>.` };
    return { v: 'converge', exacta: false, I: lim.L, m, html: `${base}${aviso}<br>$∫_{${m}}^{∞} f(x) dx ≈ ${f(lim.L, 5)}$ (it settles): <b>the series converges</b>.` };
  }

  function parciales(a, n0, k) { const s = []; let acc = 0; for (let i = 0; i < k; i++) { acc += a(n0 + i); s.push(acc); } return s; }

  function estimaSuma(a, n0, { geo, S, alterna, pot, L, cola, sg }) {
    if (geo && S !== undefined) return { v: S, err: 0, nota: '' };
    const suma = (N) => { let s = 0; for (let n = n0; n <= N; n++) s += a(n); return s; };
    if (cola) { const N = 20000, c1 = cola(N + 1), c2 = cola(N); if (isFinite(c1) && isFinite(c2)) return { v: suma(N) + (sg * (c1 + c2)) / 2, err: Math.abs(c2 - c1) / 2 + 1e-12, nota: '(partial sum up to n = 20,000 plus the remainder, which the integral test bounds between $∫_{N+1}^{∞} f$ and $∫_{N}^{∞} f$)' }; }
    if (alterna) {
      const N = 4000, s1 = suma(N), s2 = s1 + a(N + 1);
      return { v: (s1 + s2) / 2, err: Math.abs(a(N + 1)) / 2, nota: '(partial sum up to n = 4000 averaged with the next one; the error is less than |aₙ₊₁|)' };
    }
    if (pot && pot.pura && pot.p > 1) {
      const N = 20000, s1 = suma(N), tail = pot.C * (N ** (1 - pot.p) / (pot.p - 1) - N ** -pot.p / 2);
      return { v: s1 + tail, err: Math.abs(tail) * 1e-3 + 1e-6, nota: '(partial sum up to n = 20,000 plus the tail computed with the integral of C/nᵖ)' };
    }
    if (pot && pot.p > 1.02 && pot.v === 'converge') {
      const N = 20000, s1 = suma(N), s2 = suma(2 * N), q = 2 ** (pot.p - 1);
      return { v: s2 + (s2 - s1) / (q - 1), err: Math.abs(s2 - s1) / (q - 1) * 0.1, nota: '(partial sums up to n = 20,000 and 40,000 with Richardson extrapolation)' };
    }
    let s = 0, n = n0;
    for (; n < n0 + 5000; n++) { const t = a(n); s += t; if (n > n0 + 20 && Math.abs(t) < 1e-17 * Math.max(1, Math.abs(s))) break; }
    return { v: s, err: Math.abs(a(n)), nota: `(sum of the terms up to n = ${n}, when they no longer contribute anything)` };
  }

  const ejemplos = [
    { clave: 'geometrica', nombre: 'Geometric: Σ 1/2ⁿ', sc: { an: '1/2^n', n0: '1' } },
    { clave: 'armonica', nombre: 'Harmonic: Σ 1/n', sc: { an: '1/n', n0: '1' } },
    { clave: 'basilea', nombre: 'p-series: Σ 1/n²', sc: { an: '1/n^2', n0: '1' } },
    { clave: 'alterna', nombre: 'Alternating harmonic: Σ (−1)ⁿ/n', sc: { an: '(-1)^n/n', n0: '1' } },
    { clave: 'cociente', nombre: 'Ratio: Σ 2ⁿ/n!', sc: { an: '2^n/n!', n0: '0' } },
    { clave: 'necesaria', nombre: 'Does not satisfy lim aₙ = 0: Σ n/(2n + 1)', sc: { an: 'n/(2n+1)', n0: '1' } },
    { clave: 'factorial-potencia', nombre: 'Σ n!/nⁿ', sc: { an: 'n!/n^n', n0: '1' } },
    { clave: 'alterna-abs', nombre: 'Absolutely convergent: Σ (−1)ⁿ/n²', sc: { an: '(-1)^n/n^2', n0: '1' } },
    { clave: 'integral-diverge', nombre: 'Integral test: Σ 1/(n ln n) diverges', sc: { an: '1/(n ln(n))', n0: '2' } },
    { clave: 'integral-converge', nombre: 'Integral test: Σ 1/(n ln² n) converges', sc: { an: '1/(n ln(n)^2)', n0: '2' } },
    { clave: 'integral-exp', nombre: 'Integral test: Σ n·e^(−n²)', sc: { an: 'n e^(-n^2)', n0: '1' } },
  ];

  return { resolver, ejemplos, f, fh };
})();

