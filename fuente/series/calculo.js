/* =====================================================================
   Convergencia de series numéricas Σ aₙ (sin DOM): condición necesaria,
   serie geométrica y serie p, criterio del cociente, de la raíz, de comparación
   en el límite con 1/nᵖ y de Leibniz, la conclusión (diverge, converge
   absoluta o condicionalmente) y una estimación de la suma con sus sumas
   parciales. Los límites se estiman numéricamente con valores grandes de n
   (y extrapolando), así que los veredictos son los del criterio que se
   aplica a esos valores. Lee aₙ con Expresion (matematicas/expresion.js),
   con n! incluido. La interfaz está en series/app.js.
     resolver(sc)  sc = { an, n0 } → { …, pasos }
     ejemplos      para el desplegable y Mis ejercicios
   ===================================================================== */
const Series = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
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

  // listas de n grandes donde aₙ y aₙ₊₁ son números distintos de cero (si se desborda, se baja)
  const LISTAS = [[1e3, 1e4, 1e5, 1e6], [20, 40, 80, 120], [10, 15, 20, 30, 40, 60], [5, 8, 12, 16, 20, 25]];

  function resolver(sc) {
    if (vacio(sc.an)) throw new Error('Falta el término general aₙ');
    const n0 = vacio(sc.n0) ? 1 : +String(sc.n0).trim().replace(',', '.');
    if (!Number.isInteger(n0) || n0 < 0 || n0 > 1000) throw new Error('El primer valor de n tiene que ser un entero entre 0 y 1000');
    const ast = E.lee(sc.an, 'El término general aₙ', ['n']);
    const a = (n) => E.valor(ast, 0, { n });
    const A0 = a(n0);
    if (!isFinite(A0)) throw new Error(`aₙ no está definido para n = ${n0} (sale ${Number.isNaN(A0) ? 'un valor no real o 0/0' : 'infinito'}): empieza en un n mayor`);
    const T = E.texto(ast);
    // no definido en algún n de los primeros 60
    for (let n = n0; n < n0 + 60; n++) if (!isFinite(a(n))) throw new Error(`aₙ no está definido para n = ${n}: la serie no tiene sentido desde n = ${n0}`);
    const ns = LISTAS.find((L) => L.every((n) => isFinite(a(n)) && a(n) !== 0 && isFinite(a(n + 1)) && a(n + 1) !== 0));
    const pasos = [{ t: 'Serie', html: `$∑_{n=${n0}}^{∞} a_n = ∑_{n=${n0}}^{∞} ${T}$` }];
    const out = { an: sc.an, n0, T, pasos, pruebas: [] };
    const nums = Array.from({ length: 8 }, (_, i) => a(n0 + i));
    pasos.push({ t: 'Primeros términos', html: `$${nums.map((v) => f(v, 5)).join(' ; ')} ; …$` });
    if (!ns) {
      // términos nulos o que se desbordan: solo se pueden sumar los primeros
      out.veredicto = 'indeterminado';
      out.texto = 'No consigo evaluar aₙ para n grandes (se anula o se desborda), así que no puedo aplicar los criterios.';
      pasos.push({ t: 'Conclusión', html: out.texto });
      out.parciales = parciales(a, n0, 40);
      return out;
    }
    const grandes = ns[0] >= 1000;

    /* ---- Condición necesaria ---- */
    const vals = ns.map((n) => a(n)), L = vals[vals.length - 1];
    const U = vals[vals.length - 1], P = vals[vals.length - 2];
    // tiende a 0 si ya es minúsculo o sigue bajando a buen ritmo (1/√n, 1/ln n…); si no, se queda en un valor
    const tiendeA0 = Math.abs(U) < 1e-8 || Math.abs(U) < 0.95 * Math.abs(P);
    const crece = Math.abs(U) > 1e12 && Math.abs(U) >= Math.abs(P);
    const lim = crece ? (U > 0 ? Infinity : -Infinity) : tiendeA0 ? 0 : U;
    const limTxt = crece ? (U > 0 ? '∞' : '−∞') : tiendeA0 ? '0' : f(U, 5);
    // oscila sin límite: a_n y el anterior de signo distinto o muy distintos y no tiende a 0
    const osc = !tiendeA0 && !crece && Math.abs(U - P) > 0.5 * Math.abs(U);
    const noCero = !tiendeA0 || osc;
    pasos.push({ t: 'Condición necesaria', html: noCero ? `$lím_{n→∞} a_n ${osc && !isFinite(lim) ? 'no existe' : `= ${limTxt} ≠ 0`}$: como los términos no tienden a 0, <b>la serie diverge</b>.` : `$lím_{n→∞} a_n = ${limTxt} = 0$: la condición necesaria se cumple, pero no basta; hay que aplicar un criterio.` });
    out.limite = lim;
    out.pruebas.push({ nombre: 'Condición necesaria', veredicto: noCero ? 'diverge' : 'no concluye' });
    if (noCero) {
      out.veredicto = 'diverge'; out.absoluta = false;
      out.texto = `Diverge: aₙ no tiende a 0 (límite ${limTxt}).`;
      pasos.push({ t: 'Conclusión', html: out.texto });
      out.parciales = parciales(a, n0, 40);
      return out;
    }

    /* ---- Serie geométrica ---- */
    const raz = [0, 1, 2, 3].map((k) => a(n0 + k + 1) / a(n0 + k));
    const geo = raz.every((r) => Math.abs(r - raz[0]) < 1e-9 * Math.max(1, Math.abs(raz[0])));
    const r = raz[0];
    let geoV = null;
    if (geo) {
      const q = Math.abs(r) < 1 ? 'converge' : 'diverge';
      geoV = q;
      const S = A0 / (1 - r);
      out.pruebas.push({ nombre: 'Serie geométrica', veredicto: q });
      pasos.push({ t: 'Serie geométrica', html: q === 'converge' ? `Cada término es $r = ${f(r, 8)}$ veces el anterior y $|r| < 1$: <b>converge</b> y su suma es $S = {a_{${n0}}}/{1 − r} = {${f(A0, 8)}}/{1 − ${f(r, 8).replace('−', '(−') + (r < 0 ? ')' : '')}} = ${f(S, 8)}$.` : `Cada término es $r = ${f(r, 8)}$ veces el anterior y $|r| ≥ 1$: <b>diverge</b>.` });
      if (q === 'converge') out.sumaExacta = S;
    }

    /* ---- Cociente ---- */
    const rr = ns.map((n) => Math.abs(a(n + 1) / a(n)));
    const nA = ns[ns.length - 1], nB = ns[ns.length - 2];
    const Lc = Math.max(0, (nA * rr[rr.length - 1] - nB * rr[rr.length - 2]) / (nA - nB));
    const estable = (v) => Math.abs(v[v.length - 1] - v[v.length - 2]) < 0.05 * Math.max(1, v[v.length - 1]);
    const vc = !estable(rr) ? 'no concluye' : Lc < 0.97 ? 'converge' : Lc > 1.03 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Criterio del cociente', veredicto: vc, valor: Lc });
    pasos.push({ t: 'Criterio del cociente (d’Alembert)', html: `$L = lím_{n→∞} |{a_{n+1}}/{a_n}| ≈ ${f(Lc, 4)}$ (con $n$ = ${nA}${nB !== nA ? ` y ${nB}` : ''} y extrapolando). ${vc === 'converge' ? 'Como $L < 1$, <b>converge absolutamente</b>.' : vc === 'diverge' ? 'Como $L > 1$, <b>diverge</b>.' : estable(rr) ? '$L ≈ 1$: el criterio <b>no decide</b>.' : 'El cociente no se estabiliza (aₙ oscila o se anula): el criterio <b>no decide</b>.'}` });

    /* ---- Raíz ---- */
    const rt = ns.map((n) => Math.abs(a(n)) ** (1 / n));
    const Lr = rt[rt.length - 1];
    const vr = !estable(rt) ? 'no concluye' : Lr < 0.95 ? 'converge' : Lr > 1.05 ? 'diverge' : 'no concluye';
    out.pruebas.push({ nombre: 'Criterio de la raíz', veredicto: vr, valor: Lr });
    pasos.push({ t: 'Criterio de la raíz (Cauchy)', html: `$L = lím_{n→∞} |a_n|^{1/n} ≈ ${f(Lr, 4)}$ ${vr === 'converge' ? '$< 1$: <b>converge absolutamente</b>.' : vr === 'diverge' ? '$> 1$: <b>diverge</b>.' : '(cerca de 1): el criterio <b>no decide</b>.'}` });

    /* ---- Comparación con 1/n^p ---- */
    let pot = null;
    if (grandes) {
      const pp = (n) => -Math.log(Math.abs(a(2 * n) / a(n))) / Math.LN2;
      const p1 = pp(1e3), p2 = pp(1e5);
      if (isFinite(p1) && isFinite(p2) && Math.abs(p1 - p2) < 0.02 && Math.abs(p2) < 50) {
        const p = p2, pr = Math.round(p * 2) / 2, exacto = Math.abs(p - pr) < 0.02, pu = exacto ? pr : p;
        const C = Math.abs(a(1e5)) * 1e5 ** pu;
        pot = { p: pu, C };
        out.pruebas.push({ nombre: 'Comparación con 1/nᵖ', veredicto: pu > 1.02 ? 'converge' : pu <= 1.02 ? 'diverge' : 'no concluye', valor: pu });
        pasos.push({ t: 'Comparación con la serie p', html: `Para $n$ grande $|a_n| ≈ ${f(C, 4)} · {1}/{n^{${f(pu, 4)}}}$, de la forma $C/n^p$ con $p = ${f(pu, 4)}$. ${pu > 1.02 ? `Como $p > 1$, la serie $∑ 1/n^p$ converge y (por el criterio de comparación en el límite) <b>converge absolutamente</b>.` : `Como $p ≤ 1$, la serie $∑ 1/n^p$ diverge y <b>$∑ |a_n|$ diverge</b>.`}` });
      } else {
        out.pruebas.push({ nombre: 'Comparación con 1/nᵖ', veredicto: 'no aplica' });
      }
    }

    /* ---- Signo y Leibniz ---- */
    const sg = Array.from({ length: 12 }, (_, i) => Math.sign(a(n0 + i)));
    const alterna = sg.every((s, i) => i === 0 || s * sg[i - 1] < 0);
    const positiva = sg.every((s) => s > 0) || sg.every((s) => s < 0);
    let leib = null;
    if (alterna) {
      const mono = Array.from({ length: 200 }, (_, i) => Math.abs(a(n0 + i + 1)) <= Math.abs(a(n0 + i)) * (1 + 1e-12)).every(Boolean);
      const monoG = ns.every((n) => Math.abs(a(n + 1)) <= Math.abs(a(n)) * (1 + 1e-12));
      leib = mono && monoG;
      out.pruebas.push({ nombre: 'Criterio de Leibniz', veredicto: leib ? 'converge' : 'no concluye' });
      pasos.push({ t: 'Serie alternada: criterio de Leibniz', html: `Los signos se alternan, $|a_n|$ ${leib ? 'es decreciente' : 'no parece decreciente'} y $a_n → 0$. ${leib ? 'Por Leibniz la serie <b>converge</b>.' : 'No puedo asegurar que $|a_n|$ decrezca, así que el criterio <b>no decide</b>.'}` });
    } else if (!positiva) {
      pasos.push({ t: 'Signos', html: 'Los términos cambian de signo sin alternarse: los criterios de arriba se aplican a $|a_n|$ (convergencia absoluta); si la absoluta falla, la serie podría converger condicionalmente y aquí no se decide.' });
    }

    /* ---- Conclusión ---- */
    const abs = geo ? (geoV === 'converge' ? 'converge' : 'diverge') : (vc !== 'no concluye' ? vc : vr !== 'no concluye' ? vr : pot ? out.pruebas.find((p) => p.nombre.startsWith('Comparación')).veredicto : 'no concluye');
    // geométrica y criterios aplicados a |aₙ|: «diverge» de cociente/raíz con L>1 hace diverger la serie (aₙ no →0), el de comparación solo |aₙ|
    let veredicto, texto;
    const divAbsSolo = (vc === 'diverge' || vr === 'diverge') ? 'serie' : 'abs';
    if (abs === 'converge') { veredicto = 'converge'; out.absoluta = true; texto = 'Converge absolutamente (y por tanto converge).'; }
    else if (abs === 'diverge' && divAbsSolo === 'serie' && !geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'Diverge.'; }
    else if (abs === 'diverge' && geo) { veredicto = 'diverge'; out.absoluta = false; texto = 'Diverge.'; }
    else if (abs === 'diverge') {
      if (leib) { veredicto = 'converge'; out.absoluta = false; texto = 'Converge condicionalmente: Σ|aₙ| diverge pero Σaₙ converge por Leibniz.'; }
      else if (positiva) { veredicto = 'diverge'; out.absoluta = false; texto = 'Diverge.'; }
      else { veredicto = 'indeterminado'; texto = 'Σ|aₙ| diverge y no puedo decidir si Σaₙ converge condicionalmente.'; }
    } else if (leib) { veredicto = 'converge'; out.absoluta = null; texto = 'Converge por Leibniz (no he podido decidir si también converge absolutamente).'; }
    else { veredicto = 'indeterminado'; texto = 'Ningún criterio de los implementados decide: prueba el criterio de la integral, comparación con otra serie o Raabe.'; }
    out.veredicto = veredicto; out.texto = texto;
    pasos.push({ t: 'Conclusión', html: `<b>${texto}</b>` });

    /* ---- Suma ---- */
    out.parciales = parciales(a, n0, 40);
    if (veredicto === 'converge') {
      const S = estimaSuma(a, n0, { geo, S: out.sumaExacta, alterna, pot, L: Lc });
      out.suma = S.v; out.sumaError = S.err;
      pasos.push({ t: 'Suma', html: geo ? `$S = ${f(S.v, 8)}$ (exacta, de la fórmula geométrica).` : `$S ≈ ${f(S.v, 6)}$ ${S.nota}` });
    }
    return out;
  }

  function parciales(a, n0, k) { const s = []; let acc = 0; for (let i = 0; i < k; i++) { acc += a(n0 + i); s.push(acc); } return s; }

  // suma estimada: geométrica exacta; alternada con el promedio de dos parciales seguidas (Euler);
  // de cola potencial C/n^p con Richardson; si no, hasta que los términos sean despreciables
  function estimaSuma(a, n0, { geo, S, alterna, pot, L }) {
    if (geo && S !== undefined) return { v: S, err: 0, nota: '' };
    const suma = (N) => { let s = 0; for (let n = n0; n <= N; n++) s += a(n); return s; };
    if (alterna) {
      const N = 4000, s1 = suma(N), s2 = s1 + a(N + 1);
      return { v: (s1 + s2) / 2, err: Math.abs(a(N + 1)) / 2, nota: '(suma parcial hasta n = 4000 promediada con la siguiente; el error es menor que |aₙ₊₁|)' };
    }
    if (pot && pot.p > 1.02) {
      const N = 20000, s1 = suma(N), s2 = suma(2 * N), q = 2 ** (pot.p - 1);
      return { v: s2 + (s2 - s1) / (q - 1), err: Math.abs(s2 - s1) / (q - 1) * 0.1, nota: '(sumas parciales hasta n = 20 000 y 40 000 con extrapolación de Richardson)' };
    }
    let s = 0, n = n0;
    for (; n < n0 + 5000; n++) { const t = a(n); s += t; if (n > n0 + 20 && Math.abs(t) < 1e-17 * Math.max(1, Math.abs(s))) break; }
    return { v: s, err: Math.abs(a(n)), nota: `(suma de los términos hasta n = ${n}, cuando ya no aportan nada)` };
  }

  const ejemplos = [
    { clave: 'geometrica', nombre: 'Geométrica: Σ 1/2ⁿ', sc: { an: '1/2^n', n0: '1' } },
    { clave: 'armonica', nombre: 'Armónica: Σ 1/n', sc: { an: '1/n', n0: '1' } },
    { clave: 'basilea', nombre: 'Serie p: Σ 1/n²', sc: { an: '1/n^2', n0: '1' } },
    { clave: 'alterna', nombre: 'Armónica alternada: Σ (−1)ⁿ/n', sc: { an: '(-1)^n/n', n0: '1' } },
    { clave: 'cociente', nombre: 'Cociente: Σ 2ⁿ/n!', sc: { an: '2^n/n!', n0: '0' } },
    { clave: 'necesaria', nombre: 'No cumple lím aₙ = 0: Σ n/(2n + 1)', sc: { an: 'n/(2n+1)', n0: '1' } },
    { clave: 'factorial-potencia', nombre: 'Σ n!/nⁿ', sc: { an: 'n!/n^n', n0: '1' } },
    { clave: 'alterna-abs', nombre: 'Absolutamente convergente: Σ (−1)ⁿ/n²', sc: { an: '(-1)^n/n^2', n0: '1' } },
  ];

  return { resolver, ejemplos, f, fh };
})();
if (typeof module !== 'undefined') module.exports = Series;
