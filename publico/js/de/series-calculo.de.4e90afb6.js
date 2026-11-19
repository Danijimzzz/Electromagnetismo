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
    if (vacio(sc.an)) throw new Error('Das allgemeine Glied aₙ fehlt');
    const n0 = vacio(sc.n0) ? 1 : +String(sc.n0).trim().replace(',', '.');
    if (!Number.isInteger(n0) || n0 < 0 || n0 > 1000) throw new Error('Der erste Wert von n muss eine ganze Zahl zwischen 0 und 1000 sein');
    const ast = E.lee(sc.an, 'Das allgemeine Glied aₙ', ['n']);
    const a = (n) => E.valor(ast, 0, { n });
    const A0 = a(n0);
    if (!isFinite(A0)) throw new Error(`aₙ ist für n = ${n0} nicht definiert (es ergibt ${Number.isNaN(A0) ? 'einen nicht reellen Wert oder 0/0' : 'unendlich'}): Beginne bei einem größeren n`);
    const T = E.texto(ast);
    for (let n = n0; n < n0 + 60; n++) if (!isFinite(a(n))) throw new Error(`aₙ ist für n = ${n} nicht definiert: Die Reihe ergibt ab n = ${n0} keinen Sinn`);
    const ns = LISTAS.find((L) => L.every((n) => isFinite(a(n)) && a(n) !== 0 && isFinite(a(n + 1)) && a(n + 1) !== 0));
    const pasos = [{ t: 'Reihenschaltung', html: `$∑_{n=${n0}}^{∞} a_n = ∑_{n=${n0}}^{∞} ${T}$` }];
    const out = { an: sc.an, n0, T, pasos, pruebas: [] };
    {
      const vs = []; for (let n = n0; n < n0 + 9; n++) vs.push(a(n));
      const cerca = (u, v) => Math.abs(u - v) <= 1e-9 * Math.max(Math.abs(u), Math.abs(v), 1e-300);
      const C = vs[0], fx = (c, t) => (cTxt(c) === '1' ? t : `${cTxt(c)}${t.startsWith('1/') ? t.slice(1) : ` ${t}`}`);
      const r = vs[1] / vs[0];
      if (C !== 0 && isFinite(r) && r !== 0 && vs.every((v, i) => cerca(v, C * r ** i))) out.desarrollo = { f: C === 1 ? '1/(1-x)' : `${cTxt(C)}/(1-x)`, x0: cTxt(r), n: 8, tipo: 'geometrisch' };
      else if (n0 === 0 && C !== 0 && isFinite(r) && r !== 0 && vs.every((v, i) => cerca(v, C * r ** i / FACT[i]))) out.desarrollo = { f: C === 1 ? 'e^x' : `${cTxt(C)} e^x`, x0: cTxt(r), n: 8, tipo: 'exponencial' };
    }
    const nums = Array.from({ length: 8 }, (_, i) => a(n0 + i));
    pasos.push({ t: 'Erste Glieder', html: `$${nums.map((v) => f(v, 5)).join(' ; ')} ; …$` });
    if (!ns) {
      out.veredicto = 'indeterminado';
      out.texto = 'Ich kann aₙ für große n nicht auswerten (es verschwindet oder läuft über), also kann ich die Kriterien nicht anwenden.';
      pasos.push({ t: 'Ergebnis', html: out.texto });
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
    pasos.push({ t: 'Notwendige Bedingung', html: noCero ? `$lim_{n→∞} a_n ${osc && !isFinite(lim) ? 'existiert nicht' : `= ${limTxt} ≠ 0`}$: Da die Glieder nicht gegen 0 streben, <b>divergiert die Reihe</b>.` : `$lim_{n→∞} a_n = ${limTxt} = 0$: Die notwendige Bedingung ist erfüllt, genügt aber nicht; man muss ein Kriterium anwenden.` });
    out.limite = lim;
    out.pruebas.push({ nombre: 'Notwendige Bedingung', veredicto: noCero ? 'diverge' : 'no concluye' });
    if (noCero) {
      out.veredicto = 'diverge'; out.absoluta = false;
      out.texto = `Divergiert: aₙ strebt nicht gegen 0 (Grenzwert ${limTxt}).`;
      pasos.push({ t: 'Ergebnis', html: out.texto });
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
      out.pruebas.push({ nombre: 'Geometrische Reihe', veredicto: q });
      pasos.push({ t: 'Geometrische Reihe', html: q === 'converge' ? `Jedes Glied ist das $r = ${f(r, 8)}$-fache des vorigen und $|r| < 1$: Sie <b>konvergiert</b>, und ihre Summe ist $S = {a_{${n0}}}/{1 − r} = {${f(A0, 8)}}/{1 − ${f(r, 8).replace('−', '(−') + (r < 0 ? ')' : '')}} = ${f(S, 8)}$.` : `Jedes Glied ist das $r = ${f(r, 8)}$-fache des vorigen und $|r| ≥ 1$: Sie <b>divergiert</b>.` });
      if (q === 'converge') out.sumaExacta = S;
    }

    const rr = ns.map((n) => Math.abs(a(n + 1) / a(n)));
    const nA = ns[ns.length - 1], nB = ns[ns.length - 2];
    const Lc = Math.max(0, (nA * rr[rr.length - 1] - nB * rr[rr.length - 2]) / (nA - nB));
    const estable = (v) => Math.abs(v[v.length - 1] - v[v.length - 2]) < 0.05 * Math.max(1, v[v.length - 1]);
    const vc = !estable(rr) ? 'no concluye' : Lc < 0.97 ? 'converge' : Lc > 1.03 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Quotientenkriterium', veredicto: vc, valor: Lc });
    pasos.push({ t: 'Quotientenkriterium (d’Alembert)', html: `$L = lim_{n→∞} |{a_{n+1}}/{a_n}| ≈ ${f(Lc, 4)}$ (mit $n$ = ${nA}${nB !== nA ? ` und ${nB}` : ''} und Extrapolation). ${vc === 'converge' ? 'Da $L < 1$, <b>konvergiert sie absolut</b>.' : vc === 'diverge' ? 'Da $L > 1$, <b>divergiert sie</b>.' : estable(rr) ? '$L ≈ 1$: Das Kriterium <b>entscheidet nicht</b>.' : 'Der Quotient stabilisiert sich nicht (aₙ oszilliert oder verschwindet): Das Kriterium <b>entscheidet nicht</b>.'}` });

    const rt = ns.map((n) => Math.abs(a(n)) ** (1 / n));
    const Lr = rt[rt.length - 1];
    const vr = !estable(rt) ? 'no concluye' : Lr < 0.95 ? 'converge' : Lr > 1.05 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Wurzelkriterium', veredicto: vr, valor: Lr });
    pasos.push({ t: 'Wurzelkriterium (Cauchy)', html: `$L = lim_{n→∞} |a_n|^{1/n} ≈ ${f(Lr, 4)}$ ${vr === 'converge' ? '$< 1$: <b>konvergiert absolut</b>.' : vr === 'diverge' ? '$> 1$: <b>divergiert</b>.' : '(nahe 1): Das Kriterium <b>entscheidet nicht</b>.'}` });

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
        out.pruebas.push({ nombre: 'Vergleich mit 1/nᵖ', veredicto: v, valor: pu });
        pasos.push({ t: 'Vergleich mit der p-Reihe', html: `Für großes $n$ ist $|a_n| ≈ ${f(C, 4)} · {1}/{n^{${f(pu, 6)}}}$, von der Form $C/n^p$ mit $p = ${f(pu, 6)}$${pura ? ' (exakter Exponent: aₙ ist eine Potenz von n)' : ''}. ${cerca1 ? 'Da $p$ so nahe bei 1 liegt und nur eine Schätzung ist (aₙ ist keine exakte Potenz von $n$), <b>entscheidet</b> der Vergleich <b>nicht</b>: Versuche das Integralkriterium oder eine Ungleichung.' : pu > 1 ? 'Da $p > 1$, konvergiert die Reihe $∑ 1/n^p$, und (nach dem Grenzwertvergleich) <b>konvergiert sie absolut</b>.' : 'Da $p ≤ 1$, divergiert die Reihe $∑ 1/n^p$, und <b>$∑ |a_n|$ divergiert</b>.'}` });
      } else {
        out.pruebas.push({ nombre: 'Vergleich mit 1/nᵖ', veredicto: 'no aplica' });
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
      out.pruebas.push({ nombre: 'Leibniz-Kriterium', veredicto: leib ? 'converge' : 'no concluye' });
      pasos.push({ t: 'Alternierende Reihe: Leibniz-Kriterium', html: `Die Vorzeichen wechseln, $|a_n|$ ${leib ? 'fällt' : 'scheint nicht zu fallen'} und $a_n → 0$. ${leib ? 'Nach Leibniz <b>konvergiert</b> die Reihe.' : 'Ich kann nicht sichern, dass $|a_n|$ fällt, also <b>entscheidet</b> das Kriterium <b>nicht</b>.'}` });
    } else if (!positiva) {
      pasos.push({ t: 'Vorzeichen', html: 'Die Glieder wechseln das Vorzeichen, ohne zu alternieren: Die obigen Kriterien gelten für $|a_n|$ (absolute Konvergenz); scheitert die absolute, könnte die Reihe bedingt konvergieren, und das wird hier nicht entschieden.' });
    }

    let integ = null;
    const sgn = Math.sign(a(ns[0])), mismoSigno = sgn !== 0 && sg.every((q) => q === 0 || q === sgn);
    if (mismoSigno && !alterna && !geo) {
      try { integ = criterioIntegral(ast, a, n0, ns, sgn); } catch (e) { integ = null; }
      if (integ) { out.pruebas.push({ nombre: 'Integralkriterium', veredicto: integ.v, ...(integ.I !== undefined ? { valor: integ.I } : {}) }); pasos.push({ t: 'Integralkriterium', html: integ.html }); out.integral = { v: integ.v, I: integ.I, exacta: integ.exacta, m: integ.m }; }
    }

    const decideInt = integ && integ.v !== 'no concluye' && vc === 'no concluye' && vr === 'no concluye' && (integ.exacta || !pot || pot.v === 'no concluye');
    const abs = decideInt ? integ.v : geo ? (geoV === 'converge' ? 'converge' : 'diverge') : (vc !== 'no concluye' ? vc : vr !== 'no concluye' ? vr : pot ? out.pruebas.find((p) => p.nombre.startsWith('Vergleich')).veredicto : 'no concluye');
    let veredicto, texto;
    const divAbsSolo = (vc === 'diverge' || vr === 'diverge') ? 'serie' : 'abs';
    if (abs === 'converge') { veredicto = 'converge'; out.absoluta = true; texto = 'Konvergiert absolut (und damit überhaupt).'; }
    else if (abs === 'diverge' && divAbsSolo === 'serie' && !geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'Divergiert.'; }
    else if (abs === 'diverge' && geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'Divergiert.'; }
    else if (abs === 'diverge') {
      if (leib) { veredicto = 'converge'; out.absoluta = false; texto = 'Konvergiert bedingt: Σ|aₙ| divergiert, aber Σaₙ konvergiert nach Leibniz.'; }
      else if (positiva || mismoSigno) { veredicto = 'diverge'; out.absoluta = false; texto = 'Divergiert.'; }
      else { veredicto = 'indeterminado'; texto = 'Σ|aₙ| divergiert, und ich kann nicht entscheiden, ob Σaₙ bedingt konvergiert.'; }
    } else if (leib) { veredicto = 'converge'; out.absoluta = null; texto = 'Konvergiert nach Leibniz (ich konnte nicht entscheiden, ob sie auch absolut konvergiert).'; }
    else { veredicto = 'indeterminado'; texto = 'Keines der implementierten Kriterien entscheidet: Versuche den Vergleich mit einer anderen Reihe oder das Raabe-Kriterium.'; }
    out.veredicto = veredicto; out.texto = texto;
    pasos.push({ t: 'Ergebnis', html: `<b>${texto}</b>` });

    out.parciales = parciales(a, n0, 40);
    if (veredicto === 'converge') {
      const S = estimaSuma(a, n0, { geo, S: out.sumaExacta, alterna, pot, L: Lc, cola: decideInt && integ.cola && !(pot && pot.pura) ? integ.cola : null, sg: sgn });
      out.suma = S.v; out.sumaError = S.err;
      pasos.push({ t: 'Summe', html: geo ? `$S = ${f(S.v, 8)}$ (exakt, aus der geometrischen Formel).` : `$S ≈ ${f(S.v, 6)}$ ${S.nota}` });
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
    const Tf = DV.T(fx), base = `$f(x) = ${Tf}$ ist positiv und fallend für $x ≥ ${m}$, also konvergieren oder divergieren die Reihe und das Integral $∫_{${m}}^{∞} f(x) dx$ gleichzeitig.`;
    let F = null; try { const r = DV.prim(E.simp(fx), []); F = r && E.simp(r.F); if (F && !DV.igualNum(E.deriva(F), fx, 1e-6)) F = null; } catch (e) { F = null; }
    const Ff = F && ((x) => sg * E.valor(F, x));
    if (F && isFinite(Ff(m))) {
      const est = limInf(F), lim = est !== null ? { L: sg * est } : limEscalera(Ff), segura = est !== null, pr = `<br>Stammfunktion: $F(x) = ∫ f(x) dx = ${sg < 0 ? '−(' : ''}${DV.T(F)}${sg < 0 ? ')' : ''}$.`;
      if (!lim) return { v: 'no concluye', html: `${base}${pr}<br>Ich kann nicht sicher entscheiden, ob $F(b)$ für $b → ∞$ einen endlichen Grenzwert hat (es wächst oder stabilisiert sich sehr langsam): Prüfe es von Hand.` };
      if (!isFinite(lim.L)) return { v: 'diverge', exacta: segura, html: `${base}${pr}<br>$∫_{${m}}^{∞} f(x) dx = lim_{b→∞} F(b) − F(${m}) = ∞$: Das Integral divergiert, und nach dem Integralkriterium <b>divergiert die Reihe</b>.` };
      const I = lim.L - Ff(m), cola = (N) => lim.L - Ff(N);
      return { v: 'converge', exacta: segura, I, m, cola, html: `${base}${pr}<br>$∫_{${m}}^{∞} f(x) dx = lim_{b→∞} F(b) − F(${m}) = ${f(lim.L, 6)} − ${f(Ff(m), 6).replace(/^−(.*)$/, '(−$1)')} = ${f(I, 6)}$: Das Integral konvergiert, und nach dem Integralkriterium <b>konvergiert die Reihe</b>.` };
    }
    const cotas = [5, 10, 20, 40, 80, 160]; let acc = 0, ant = m; const tabla = cotas.map((k) => { acc += simpsonLog(g, ant, 10 ** k); ant = 10 ** k; return acc; });
    const lim = tabla.every(isFinite) ? limEscalera((x) => tabla[cotas.indexOf(Math.round(Math.log10(x)))]) : null, aviso = `<br>Ich finde keine Stammfunktion von $f$ mit elementaren Funktionen, also wird das Integral <b>numerisch geschätzt</b> (bis $x = 10^{5}$, $10^{10}$, $10^{20}$… mit der Simpson-Regel): Es ist eine Schätzung, kein Beweis.`;
    if (!lim) return { v: 'no concluye', html: `${base}${aviso}<br>Die Schätzung lässt nicht klar erkennen, ob das Integral konvergiert.` };
    if (!isFinite(lim.L)) return { v: 'diverge', exacta: false, html: `${base}${aviso}<br>Das Integral wächst unbegrenzt ($≈ ${tabla.slice(0, 4).map((v) => f(v, 4)).join(' ; ')}$…): <b>Die Reihe divergiert</b>.` };
    return { v: 'converge', exacta: false, I: lim.L, m, html: `${base}${aviso}<br>$∫_{${m}}^{∞} f(x) dx ≈ ${f(lim.L, 5)}$ (es stabilisiert sich): <b>Die Reihe konvergiert</b>.` };
  }

  function parciales(a, n0, k) { const s = []; let acc = 0; for (let i = 0; i < k; i++) { acc += a(n0 + i); s.push(acc); } return s; }

  function estimaSuma(a, n0, { geo, S, alterna, pot, L, cola, sg }) {
    if (geo && S !== undefined) return { v: S, err: 0, nota: '' };
    const suma = (N) => { let s = 0; for (let n = n0; n <= N; n++) s += a(n); return s; };
    if (cola) { const N = 20000, c1 = cola(N + 1), c2 = cola(N); if (isFinite(c1) && isFinite(c2)) return { v: suma(N) + (sg * (c1 + c2)) / 2, err: Math.abs(c2 - c1) / 2 + 1e-12, nota: '(Partialsumme bis n = 20 000 plus der Rest, den das Integralkriterium zwischen $∫_{N+1}^{∞} f$ und $∫_{N}^{∞} f$ einschließt)' }; }
    if (alterna) {
      const N = 4000, s1 = suma(N), s2 = s1 + a(N + 1);
      return { v: (s1 + s2) / 2, err: Math.abs(a(N + 1)) / 2, nota: '(Partialsumme bis n = 4000, gemittelt mit der nächsten; der Fehler ist kleiner als |aₙ₊₁|)' };
    }
    if (pot && pot.pura && pot.p > 1) {
      const N = 20000, s1 = suma(N), tail = pot.C * (N ** (1 - pot.p) / (pot.p - 1) - N ** -pot.p / 2);
      return { v: s1 + tail, err: Math.abs(tail) * 1e-3 + 1e-6, nota: '(Partialsumme bis n = 20 000 plus der mit dem Integral von C/nᵖ berechnete Rest)' };
    }
    if (pot && pot.p > 1.02 && pot.v === 'converge') {
      const N = 20000, s1 = suma(N), s2 = suma(2 * N), q = 2 ** (pot.p - 1);
      return { v: s2 + (s2 - s1) / (q - 1), err: Math.abs(s2 - s1) / (q - 1) * 0.1, nota: '(Partialsummen bis n = 20 000 und 40 000 mit Richardson-Extrapolation)' };
    }
    let s = 0, n = n0;
    for (; n < n0 + 5000; n++) { const t = a(n); s += t; if (n > n0 + 20 && Math.abs(t) < 1e-17 * Math.max(1, Math.abs(s))) break; }
    return { v: s, err: Math.abs(a(n)), nota: `(Summe der Glieder bis n = ${n}, wenn sie nichts mehr beitragen)` };
  }

  const ejemplos = [
    { clave: 'geometrica', nombre: 'Geometrisch: Σ 1/2ⁿ', sc: { an: '1/2^n', n0: '1' } },
    { clave: 'armonica', nombre: 'Harmonisch: Σ 1/n', sc: { an: '1/n', n0: '1' } },
    { clave: 'basilea', nombre: 'p-Reihe: Σ 1/n²', sc: { an: '1/n^2', n0: '1' } },
    { clave: 'alterna', nombre: 'Alternierende harmonische Reihe: Σ (−1)ⁿ/n', sc: { an: '(-1)^n/n', n0: '1' } },
    { clave: 'cociente', nombre: 'Quotientenkriterium: Σ 2ⁿ/n!', sc: { an: '2^n/n!', n0: '0' } },
    { clave: 'necesaria', nombre: 'Erfüllt lim aₙ = 0 nicht: Σ n/(2n + 1)', sc: { an: 'n/(2n+1)', n0: '1' } },
    { clave: 'factorial-potencia', nombre: 'Σ n!/nⁿ', sc: { an: 'n!/n^n', n0: '1' } },
    { clave: 'alterna-abs', nombre: 'Absolut konvergent: Σ (−1)ⁿ/n²', sc: { an: '(-1)^n/n^2', n0: '1' } },
    { clave: 'integral-diverge', nombre: 'Integralkriterium: Σ 1/(n ln n) divergiert', sc: { an: '1/(n ln(n))', n0: '2' } },
    { clave: 'integral-converge', nombre: 'Integralkriterium: Σ 1/(n ln² n) konvergiert', sc: { an: '1/(n ln(n)^2)', n0: '2' } },
    { clave: 'integral-exp', nombre: 'Integralkriterium: Σ n·e^(−n²)', sc: { an: 'n e^(-n^2)', n0: '1' } },
  ];

  return { resolver, ejemplos, f, fh };
})();

