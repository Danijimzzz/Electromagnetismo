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
    return s.replace('.', ',').replace('-', '−');
  };
  const fh = (x, d) => f(x, d).replace(/·10\^\{(−?\d+)\}/, '·10<sup>$1</sup>');

  const LISTAS = [[1e3, 1e4, 1e5, 1e6], [20, 40, 80, 120], [10, 15, 20, 30, 40, 60], [5, 8, 12, 16, 20, 25]];

  const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];
  const cTxt = (x) => String(+x.toFixed(12));
  function resolver(sc) {
    if (vacio(sc.an)) throw new Error('Il manque le terme général aₙ');
    const n0 = vacio(sc.n0) ? 1 : +String(sc.n0).trim().replace(',', '.');
    if (!Number.isInteger(n0) || n0 < 0 || n0 > 1000) throw new Error('La première valeur de n doit être un entier entre 0 et 1000');
    const ast = E.lee(sc.an, 'Le terme général aₙ', ['n']);
    const a = (n) => E.valor(ast, 0, { n });
    const A0 = a(n0);
    if (!isFinite(A0)) throw new Error(`aₙ n’est pas défini pour n = ${n0} (on obtient ${Number.isNaN(A0) ? 'une valeur non réelle ou 0/0' : 'l’infini'}) : commence à un n plus grand`);
    const T = E.texto(ast);
    for (let n = n0; n < n0 + 60; n++) if (!isFinite(a(n))) throw new Error(`aₙ n’est pas défini pour n = ${n} : la série n’a pas de sens à partir de n = ${n0}`);
    const ns = LISTAS.find((L) => L.every((n) => isFinite(a(n)) && a(n) !== 0 && isFinite(a(n + 1)) && a(n + 1) !== 0));
    const pasos = [{ t: 'Série', html: `$∑_{n=${n0}}^{∞} a_n = ∑_{n=${n0}}^{∞} ${T}$` }];
    const out = { an: sc.an, n0, T, pasos, pruebas: [] };
    {
      const vs = []; for (let n = n0; n < n0 + 9; n++) vs.push(a(n));
      const cerca = (u, v) => Math.abs(u - v) <= 1e-9 * Math.max(Math.abs(u), Math.abs(v), 1e-300);
      const C = vs[0], fx = (c, t) => (cTxt(c) === '1' ? t : `${cTxt(c)}${t.startsWith('1/') ? t.slice(1) : ` ${t}`}`);
      const r = vs[1] / vs[0];
      if (C !== 0 && isFinite(r) && r !== 0 && vs.every((v, i) => cerca(v, C * r ** i))) out.desarrollo = { f: C === 1 ? '1/(1-x)' : `${cTxt(C)}/(1-x)`, x0: cTxt(r), n: 8, tipo: 'géométrique' };
      else if (n0 === 0 && C !== 0 && isFinite(r) && r !== 0 && vs.every((v, i) => cerca(v, C * r ** i / FACT[i]))) out.desarrollo = { f: C === 1 ? 'e^x' : `${cTxt(C)} e^x`, x0: cTxt(r), n: 8, tipo: 'exponencial' };
    }
    const nums = Array.from({ length: 8 }, (_, i) => a(n0 + i));
    pasos.push({ t: 'Premiers termes', html: `$${nums.map((v) => f(v, 5)).join(' ; ')} ; …$` });
    if (!ns) {
      out.veredicto = 'indeterminado';
      out.texto = 'Je n’arrive pas à évaluer aₙ pour de grands n (il s’annule ou déborde), donc je ne peux pas appliquer les critères.';
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
    pasos.push({ t: 'Condition nécessaire', html: noCero ? `$lim_{n→∞} a_n ${osc && !isFinite(lim) ? 'n’existe pas' : `= ${limTxt} ≠ 0`}$ : comme les termes ne tendent pas vers 0, <b>la série diverge</b>.` : `$lim_{n→∞} a_n = ${limTxt} = 0$ : la condition nécessaire est remplie, mais elle ne suffit pas ; il faut appliquer un critère.` });
    out.limite = lim;
    out.pruebas.push({ nombre: 'Condition nécessaire', veredicto: noCero ? 'diverge' : 'no concluye' });
    if (noCero) {
      out.veredicto = 'diverge'; out.absoluta = false;
      out.texto = `Diverge : aₙ ne tend pas vers 0 (limite ${limTxt}).`;
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
      out.pruebas.push({ nombre: 'Série géométrique', veredicto: q });
      pasos.push({ t: 'Série géométrique', html: q === 'converge' ? `Chaque terme vaut $r = ${f(r, 8)}$ fois le précédent et $|r| < 1$ : elle <b>converge</b> et sa somme est $S = {a_{${n0}}}/{1 − r} = {${f(A0, 8)}}/{1 − ${f(r, 8).replace('−', '(−') + (r < 0 ? ')' : '')}} = ${f(S, 8)}$.` : `Chaque terme vaut $r = ${f(r, 8)}$ fois le précédent et $|r| ≥ 1$ : elle <b>diverge</b>.` });
      if (q === 'converge') out.sumaExacta = S;
    }

    const rr = ns.map((n) => Math.abs(a(n + 1) / a(n)));
    const nA = ns[ns.length - 1], nB = ns[ns.length - 2];
    const Lc = Math.max(0, (nA * rr[rr.length - 1] - nB * rr[rr.length - 2]) / (nA - nB));
    const estable = (v) => Math.abs(v[v.length - 1] - v[v.length - 2]) < 0.05 * Math.max(1, v[v.length - 1]);
    const vc = !estable(rr) ? 'no concluye' : Lc < 0.97 ? 'converge' : Lc > 1.03 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Critère de d’Alembert', veredicto: vc, valor: Lc });
    pasos.push({ t: 'Critère de d’Alembert (quotient)', html: `$L = lim_{n→∞} |{a_{n+1}}/{a_n}| ≈ ${f(Lc, 4)}$ (avec $n$ = ${nA}${nB !== nA ? ` et ${nB}` : ''} et par extrapolation). ${vc === 'converge' ? 'Comme $L < 1$, elle <b>converge absolument</b>.' : vc === 'diverge' ? 'Comme $L > 1$, elle <b>diverge</b>.' : estable(rr) ? '$L ≈ 1$ : le critère <b>ne permet pas de conclure</b>.' : 'Le quotient ne se stabilise pas (aₙ oscille ou s’annule) : le critère <b>ne permet pas de conclure</b>.'}` });

    const rt = ns.map((n) => Math.abs(a(n)) ** (1 / n));
    const Lr = rt[rt.length - 1];
    const vr = !estable(rt) ? 'no concluye' : Lr < 0.95 ? 'converge' : Lr > 1.05 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Critère de Cauchy', veredicto: vr, valor: Lr });
    pasos.push({ t: 'Critère de Cauchy (racine)', html: `$L = lim_{n→∞} |a_n|^{1/n} ≈ ${f(Lr, 4)}$ ${vr === 'converge' ? '$< 1$ : <b>converge absolument</b>.' : vr === 'diverge' ? '$> 1$ : <b>diverge</b>.' : '(proche de 1) : le critère <b>ne permet pas de conclure</b>.'}` });

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
        out.pruebas.push({ nombre: 'Comparaison avec 1/nᵖ', veredicto: v, valor: pu });
        pasos.push({ t: 'Comparaison avec la série de Riemann', html: `Pour $n$ grand $|a_n| ≈ ${f(C, 4)} · {1}/{n^{${f(pu, 6)}}}$, de la forme $C/n^p$ avec $p = ${f(pu, 6)}$${pura ? ' (exposant exact : aₙ est une puissance de n)' : ''}. ${cerca1 ? 'Comme $p$ est très proche de 1 et que ce n’est qu’une estimation (aₙ n’est pas exactement une puissance de $n$), la comparaison <b>ne permet pas de conclure</b> : essaie le critère de l’intégrale ou une inégalité.' : pu > 1 ? 'Comme $p > 1$, la série $∑ 1/n^p$ converge et (par le critère de comparaison à la limite) elle <b>converge absolument</b>.' : 'Comme $p ≤ 1$, la série $∑ 1/n^p$ diverge et <b>$∑ |a_n|$ diverge</b>.'}` });
      } else {
        out.pruebas.push({ nombre: 'Comparaison avec 1/nᵖ', veredicto: 'no aplica' });
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
      out.pruebas.push({ nombre: 'Critère de Leibniz', veredicto: leib ? 'converge' : 'no concluye' });
      pasos.push({ t: 'Série alternée : critère de Leibniz', html: `Les signes alternent, $|a_n|$ ${leib ? 'est décroissante' : 'ne semble pas décroissante'} et $a_n → 0$. ${leib ? 'Par Leibniz la série <b>converge</b>.' : 'Je ne peux pas garantir que $|a_n|$ décroisse, donc le critère <b>ne permet pas de conclure</b>.'}` });
    } else if (!positiva) {
      pasos.push({ t: 'Signes', html: 'Les termes changent de signe sans alterner : les critères ci-dessus s’appliquent à $|a_n|$ (convergence absolue) ; si l’absolue échoue, la série pourrait converger conditionnellement et ici on ne tranche pas.' });
    }

    let integ = null;
    const sgn = Math.sign(a(ns[0])), mismoSigno = sgn !== 0 && sg.every((q) => q === 0 || q === sgn);
    if (mismoSigno && !alterna && !geo) {
      try { integ = criterioIntegral(ast, a, n0, ns, sgn); } catch (e) { integ = null; }
      if (integ) { out.pruebas.push({ nombre: 'Critère de l’intégrale', veredicto: integ.v, ...(integ.I !== undefined ? { valor: integ.I } : {}) }); pasos.push({ t: 'Critère de l’intégrale', html: integ.html }); out.integral = { v: integ.v, I: integ.I, exacta: integ.exacta, m: integ.m }; }
    }

    const decideInt = integ && integ.v !== 'no concluye' && vc === 'no concluye' && vr === 'no concluye' && (integ.exacta || !pot || pot.v === 'no concluye');
    const abs = decideInt ? integ.v : geo ? (geoV === 'converge' ? 'converge' : 'diverge') : (vc !== 'no concluye' ? vc : vr !== 'no concluye' ? vr : pot ? out.pruebas.find((p) => p.nombre.startsWith('Comparaison')).veredicto : 'no concluye');
    let veredicto, texto;
    const divAbsSolo = (vc === 'diverge' || vr === 'diverge') ? 'serie' : 'abs';
    if (abs === 'converge') { veredicto = 'converge'; out.absoluta = true; texto = 'Elle converge absolument (et donc converge).'; }
    else if (abs === 'diverge' && divAbsSolo === 'serie' && !geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'Elle diverge.'; }
    else if (abs === 'diverge' && geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'Elle diverge.'; }
    else if (abs === 'diverge') {
      if (leib) { veredicto = 'converge'; out.absoluta = false; texto = 'Elle converge conditionnellement : Σ|aₙ| diverge mais Σaₙ converge par Leibniz.'; }
      else if (positiva || mismoSigno) { veredicto = 'diverge'; out.absoluta = false; texto = 'Elle diverge.'; }
      else { veredicto = 'indeterminado'; texto = 'Σ|aₙ| diverge et je ne peux pas décider si Σaₙ converge conditionnellement.'; }
    } else if (leib) { veredicto = 'converge'; out.absoluta = null; texto = 'Elle converge par Leibniz (je n’ai pas pu décider si elle converge aussi absolument).'; }
    else { veredicto = 'indeterminado'; texto = 'Aucun des critères implémentés ne tranche : essaie de comparer avec une autre série ou le critère de Raabe.'; }
    out.veredicto = veredicto; out.texto = texto;
    pasos.push({ t: 'Conclusion', html: `<b>${texto}</b>` });

    out.parciales = parciales(a, n0, 40);
    if (veredicto === 'converge') {
      const S = estimaSuma(a, n0, { geo, S: out.sumaExacta, alterna, pot, L: Lc, cola: decideInt && integ.cola && !(pot && pot.pura) ? integ.cola : null, sg: sgn });
      out.suma = S.v; out.sumaError = S.err;
      pasos.push({ t: 'Somme', html: geo ? `$S = ${f(S.v, 8)}$ (exacte, par la formule géométrique).` : `$S ≈ ${f(S.v, 6)}$ ${S.nota}` });
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
    const Tf = DV.T(fx), base = `$f(x) = ${Tf}$ est positive et décroissante pour $x ≥ ${m}$, donc la série et l’intégrale $∫_{${m}}^{∞} f(x) dx$ convergent ou divergent ensemble.`;
    let F = null; try { const r = DV.prim(E.simp(fx), []); F = r && E.simp(r.F); if (F && !DV.igualNum(E.deriva(F), fx, 1e-6)) F = null; } catch (e) { F = null; }
    const Ff = F && ((x) => sg * E.valor(F, x));
    if (F && isFinite(Ff(m))) {
      const est = limInf(F), lim = est !== null ? { L: sg * est } : limEscalera(Ff), segura = est !== null, pr = `<br>Primitive : $F(x) = ∫ f(x) dx = ${sg < 0 ? '−(' : ''}${DV.T(F)}${sg < 0 ? ')' : ''}$.`;
      if (!lim) return { v: 'no concluye', html: `${base}${pr}<br>Je n’arrive pas à décider avec certitude si $F(b)$ a une limite finie quand $b → ∞$ (elle croît ou se stabilise très lentement) : regarde-le à la main.` };
      if (!isFinite(lim.L)) return { v: 'diverge', exacta: segura, html: `${base}${pr}<br>$∫_{${m}}^{∞} f(x) dx = lim_{b→∞} F(b) − F(${m}) = ∞$ : l’intégrale diverge et, par le critère de l’intégrale, <b>la série diverge</b>.` };
      const I = lim.L - Ff(m), cola = (N) => lim.L - Ff(N);
      return { v: 'converge', exacta: segura, I, m, cola, html: `${base}${pr}<br>$∫_{${m}}^{∞} f(x) dx = lim_{b→∞} F(b) − F(${m}) = ${f(lim.L, 6)} − ${f(Ff(m), 6).replace(/^−(.*)$/, '(−$1)')} = ${f(I, 6)}$ : l’intégrale converge et, par le critère de l’intégrale, <b>la série converge</b>.` };
    }
    const cotas = [5, 10, 20, 40, 80, 160]; let acc = 0, ant = m; const tabla = cotas.map((k) => { acc += simpsonLog(g, ant, 10 ** k); ant = 10 ** k; return acc; });
    const lim = tabla.every(isFinite) ? limEscalera((x) => tabla[cotas.indexOf(Math.round(Math.log10(x)))]) : null, aviso = `<br>Je ne trouve pas de primitive de $f$ avec des fonctions élémentaires, donc l’intégrale est <b>estimée numériquement</b> (jusqu’à $x = 10^{5}$, $10^{10}$, $10^{20}$… avec la méthode de Simpson) : c’est une estimation, pas une démonstration.`;
    if (!lim) return { v: 'no concluye', html: `${base}${aviso}<br>L’estimation ne montre pas clairement si l’intégrale converge.` };
    if (!isFinite(lim.L)) return { v: 'diverge', exacta: false, html: `${base}${aviso}<br>L’intégrale croît sans cesse ($≈ ${tabla.slice(0, 4).map((v) => f(v, 4)).join(' ; ')}$…) : <b>la série diverge</b>.` };
    return { v: 'converge', exacta: false, I: lim.L, m, html: `${base}${aviso}<br>$∫_{${m}}^{∞} f(x) dx ≈ ${f(lim.L, 5)}$ (elle se stabilise) : <b>la série converge</b>.` };
  }

  function parciales(a, n0, k) { const s = []; let acc = 0; for (let i = 0; i < k; i++) { acc += a(n0 + i); s.push(acc); } return s; }

  function estimaSuma(a, n0, { geo, S, alterna, pot, L, cola, sg }) {
    if (geo && S !== undefined) return { v: S, err: 0, nota: '' };
    const suma = (N) => { let s = 0; for (let n = n0; n <= N; n++) s += a(n); return s; };
    if (cola) { const N = 20000, c1 = cola(N + 1), c2 = cola(N); if (isFinite(c1) && isFinite(c2)) return { v: suma(N) + (sg * (c1 + c2)) / 2, err: Math.abs(c2 - c1) / 2 + 1e-12, nota: '(somme partielle jusqu’à n = 20 000 plus le reste, que le critère de l’intégrale encadre entre $∫_{N+1}^{∞} f$ et $∫_{N}^{∞} f$)' }; }
    if (alterna) {
      const N = 4000, s1 = suma(N), s2 = s1 + a(N + 1);
      return { v: (s1 + s2) / 2, err: Math.abs(a(N + 1)) / 2, nota: '(somme partielle jusqu’à n = 4000 moyennée avec la suivante ; l’erreur est inférieure à |aₙ₊₁|)' };
    }
    if (pot && pot.pura && pot.p > 1) {
      const N = 20000, s1 = suma(N), tail = pot.C * (N ** (1 - pot.p) / (pot.p - 1) - N ** -pot.p / 2);
      return { v: s1 + tail, err: Math.abs(tail) * 1e-3 + 1e-6, nota: '(somme partielle jusqu’à n = 20 000 plus la queue calculée avec l’intégrale de C/nᵖ)' };
    }
    if (pot && pot.p > 1.02 && pot.v === 'converge') {
      const N = 20000, s1 = suma(N), s2 = suma(2 * N), q = 2 ** (pot.p - 1);
      return { v: s2 + (s2 - s1) / (q - 1), err: Math.abs(s2 - s1) / (q - 1) * 0.1, nota: '(sommes partielles jusqu’à n = 20 000 et 40 000 avec extrapolation de Richardson)' };
    }
    let s = 0, n = n0;
    for (; n < n0 + 5000; n++) { const t = a(n); s += t; if (n > n0 + 20 && Math.abs(t) < 1e-17 * Math.max(1, Math.abs(s))) break; }
    return { v: s, err: Math.abs(a(n)), nota: `(somme des termes jusqu’à n = ${n}, quand ils n’apportent plus rien)` };
  }

  const ejemplos = [
    { clave: 'geometrica', nombre: 'Géométrique : Σ 1/2ⁿ', sc: { an: '1/2^n', n0: '1' } },
    { clave: 'armonica', nombre: 'Harmonique : Σ 1/n', sc: { an: '1/n', n0: '1' } },
    { clave: 'basilea', nombre: 'Série de Riemann : Σ 1/n²', sc: { an: '1/n^2', n0: '1' } },
    { clave: 'alterna', nombre: 'Harmonique alternée : Σ (−1)ⁿ/n', sc: { an: '(-1)^n/n', n0: '1' } },
    { clave: 'cociente', nombre: 'D’Alembert : Σ 2ⁿ/n!', sc: { an: '2^n/n!', n0: '0' } },
    { clave: 'necesaria', nombre: 'Ne vérifie pas lim aₙ = 0 : Σ n/(2n + 1)', sc: { an: 'n/(2n+1)', n0: '1' } },
    { clave: 'factorial-potencia', nombre: 'Σ n!/nⁿ', sc: { an: 'n!/n^n', n0: '1' } },
    { clave: 'alterna-abs', nombre: 'Absolument convergente : Σ (−1)ⁿ/n²', sc: { an: '(-1)^n/n^2', n0: '1' } },
    { clave: 'integral-diverge', nombre: 'Critère de l’intégrale : Σ 1/(n ln n) diverge', sc: { an: '1/(n ln(n))', n0: '2' } },
    { clave: 'integral-converge', nombre: 'Critère de l’intégrale : Σ 1/(n ln² n) converge', sc: { an: '1/(n ln(n)^2)', n0: '2' } },
    { clave: 'integral-exp', nombre: 'Critère de l’intégrale : Σ n·e^(−n²)', sc: { an: 'n e^(-n^2)', n0: '1' } },
  ];

  return { resolver, ejemplos, f, fh };
})();

