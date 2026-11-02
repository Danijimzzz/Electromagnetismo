/* =====================================================================
   Termodinámica estadística (sin DOM): de los niveles de energía de un sistema
   a sus magnitudes termodinámicas, y la entropía contando microestados.
     modo 'dos'        sistema de dos niveles (energía ΔE, degeneraciones g₀ y g₁)
     modo 'oscilador'  oscilador armónico cuántico (Einstein): ε = hν, fórmulas cerradas
     modo 'niveles'    niveles propios (lista «energía degeneración» en meV), p. ej. un rotor
     modo 'einstein'   sólido de Einstein: Ω = C(q + N − 1, q), S = k·ln Ω y la temperatura
     modo 'contacto'   dos sólidos de Einstein que se reparten q cuantos: lo más probable es el equilibrio
   La energía se mide desde el nivel fundamental (en el oscilador se da aparte la
   de punto cero). La distribución de Maxwell-Boltzmann de las velocidades de un
   gas está en gases/fisica.js. Interfaz en termo-estadistica/app.js (Calculadora.monta).
     resolver(sc)   { modo, T, … } → { Z, p, U, S, Cv, F, …, pasos }
     niveles(E, g, T)  Z, p, U, S, Cv, F de una lista de niveles (energías en J)
     lnOmega(N, q)  ln de C(q + N − 1, q)
   ===================================================================== */
const TermoEstadistica = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, filas } = K;
  const kB = 1.380649e-23, h = 6.62607015e-34, eV = 1.602176634e-19, NA = 6.02214076e23, R = kB * NA;
  const meV = eV * 1e-3, KpormeV = meV / kB; // 1 meV equivale a 11,6045 K

  /* ---------- Funciones matemáticas ---------- */
  // ln Γ(x) (Lanczos, x > 0)
  const G = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  function lnGamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
    if (x > 1e7) return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * x);
    let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t);
    let s = 1.000000000190015; for (const c of G) s += c / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  const lnFact = (n) => (n < 2 ? 0 : n < 171 ? Math.log(factorialExacto(n)) : lnGamma(n + 1));
  const factorialExacto = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const lnC = (n, k) => (k < 0 || k > n ? -Infinity : lnFact(n) - lnFact(k) - lnFact(n - k));
  // ln Ω del sólido de Einstein con N osciladores y q cuantos
  const lnOmega = (N, q) => (q === 0 ? 0 : lnC(q + N - 1, q));
  // número enorme a partir de su logaritmo natural: «1,23·10^45»
  function grande(ln) {
    if (ln < 34) return f(Math.round(Math.exp(ln)), 6);
    const l10 = ln / Math.LN10, ex = Math.floor(l10), m = Math.pow(10, l10 - ex);
    return `${f(m, 3)}·10<sup>${ex}</sup>`;
  }

  /* ---------- Un sistema con niveles de energía ---------- */
  // E: energías (J, desde el fundamental), g: degeneraciones, T en K
  function niveles(E, g, T) {
    const kT = kB * T, E0 = Math.min(...E), x = E.map((e) => (e - E0) / kT);
    const w = x.map((xi, i) => g[i] * Math.exp(-xi)), Z = w.reduce((a, b) => a + b, 0);
    const p = w.map((wi) => wi / Z);
    const xm = p.reduce((a, pi, i) => a + pi * x[i], 0), x2 = p.reduce((a, pi, i) => a + pi * x[i] * x[i], 0);
    const lnZ = Math.log(Z), U = xm * kT;
    return { x, w, Z, p, lnZ, U, xm, S: kB * (lnZ + xm), Cv: kB * (x2 - xm * xm), F: -kT * lnZ, kT };
  }
  // magnitudes en unidades útiles
  const unidades = (r) => ({ Umev: r.U / meV, UkJ: r.U * NA / 1000, Sk: r.S / kB, Sm: r.S * NA, Cvk: r.Cv / kB, Fmev: r.F / meV });
  const pasosBoltzmann = (E, g, T, r, nombres) => {
    const n = E.length, u = unidades(r), kT = kB * T, E0 = Math.min(...E);
    const ps = [];
    ps.push({ t: 'Energía térmica', html: `$k_B T = ${f(kB, 7)}·${f(T, 5)} = ${f(kT, 5)} "J" = ${f(kT / meV, 5)} "meV"$ (y $1 "meV"$ equivale a ${f(KpormeV, 6)} K).` });
    const lista = E.map((e, i) => `$${nombres[i]}$: $ε = ${f((e - E0) / meV, 5)} "meV"$, $g = ${f(g[i], 4)}$, $ε/k_B T = ${f(r.x[i], 5)}$, peso $g·e^{−ε/k_B T} = ${f(r.w[i], 6)}$`);
    ps.push({ t: 'Factor de Boltzmann de cada nivel', html: (n > 8 ? lista.slice(0, 8).join('<br>') + `<br>… (${n} niveles)` : lista.join('<br>')) });
    ps.push({ t: 'Función de partición', html: `$Z = Σ g_i·e^{−ε_i/k_B T} = ${f(r.Z, 7)}$` });
    const pl = r.p.map((pi, i) => `$p_${i} = {g_i·e^{−ε_i/k_B T}}/Z = ${f(pi, 6)}$`);
    ps.push({ t: 'Probabilidades (poblaciones)', html: (n > 8 ? pl.slice(0, 8).join('<br>') + '<br>…' : pl.join('<br>')) + '<br>Su suma vale 1 ✓' });
    ps.push({ t: 'Energía media', html: `$U = Σ p_i ε_i = ${f(u.Umev, 6)} "meV"$ = ${f(u.UkJ, 5)} kJ/mol. También $U = k_B T^2 · d(ln Z)/dT$.` });
    ps.push({ t: 'Entropía', html: `$S = k_B (ln Z + U/{k_B T}) = k_B·(${f(r.lnZ, 6)} + ${f(r.xm, 6)}) = ${f(u.Sk, 6)} k_B$ = ${f(u.Sm, 5)} J/(mol·K)` });
    ps.push({ t: 'Capacidad calorífica', html: `$C_V = {⟨ε^2⟩ − ⟨ε⟩^2}/{k_B T^2} = ${f(u.Cvk, 6)} k_B$: la varianza de la energía, medida en $k_B T$, es lo que cuesta calentar el sistema.` });
    ps.push({ t: 'Energía libre', html: `$F = −k_B T ln Z = ${f(u.Fmev, 6)} "meV"$ y se cumple $F = U − T S$ ✓` });
    return ps;
  };

  /* ---------- Modos ---------- */
  function dos(sc) {
    const T = lee(sc, 'T', 'la temperatura', { min: 0, minEx: true, max: 1e9 }), dE = lee(sc, 'dE', 'la separación ΔE', { min: 0, minEx: true }), g0 = lee(sc, 'g0', 'la degeneración g₀', { min: 1, entero: true }), g1 = lee(sc, 'g1', 'la degeneración g₁', { min: 1, entero: true });
    const E = [0, dE * meV], g = [g0, g1], r = niveles(E, g, T), x = dE * meV / (kB * T), theta = dE * KpormeV;
    const pasos = pasosBoltzmann(E, g, T, r, ['0', '1']);
    pasos.splice(1, 1, { t: 'Los dos niveles', html: `$ε_0 = 0$ (g = ${g0}) y $ε_1 = ΔE = ${f(dE, 5)} "meV"$ (g = ${g1}). Temperatura característica $θ = ΔE/k_B = ${f(theta, 5)}$ K y $x = ΔE/k_B T = ${f(x, 6)}$.` });
    pasos.splice(3, 1, { t: 'Poblaciones', html: `$N_1/N_0 = (g_1/g_0)·e^{−ΔE/k_B T} = ${f(g1 / g0, 5)}·${f(Math.exp(-x), 6)} = ${f(r.p[1] / r.p[0], 6)}$<br>$p_0 = ${f(r.p[0], 6)}$ y $p_1 = ${f(r.p[1], 6)}$.<br>Cuando $T → ∞$ las poblaciones tienden a $g_1/g_0$ (nunca se invierten); cuando $T → 0$ todo está en el fundamental.` });
    const pts = []; const Tmax = Math.max(2 * T, 1.2 * theta);
    for (let i = 1; i <= 160; i++) { const t = (Tmax * i) / 160; pts.push([t, niveles(E, g, t).Cv / kB]); }
    return { modo: 'dos', T, dE, g0, g1, theta, E, g, ...r, x, ...unidades(r), pasos, curva: pts, Tmax };
  }

  function oscilador(sc) {
    const T = lee(sc, 'T', 'la temperatura', { min: 0, minEx: true, max: 1e9 }), nu = lee(sc, 'nu', 'la frecuencia ν', { min: 0, minEx: true }) * 1e12;
    const eps = h * nu, theta = eps / kB, x = eps / (kB * T), ex = Math.exp(-x);
    const Z = 1 / (1 - ex), nm = 1 / Math.expm1(x), U0 = eps / 2, U = eps * nm, S = kB * (x * nm - Math.log(1 - ex)), Cv = kB * x * x * Math.exp(x) / Math.expm1(x) ** 2;
    const Zc = Math.exp(-x / 2) / (1 - ex), F = -kB * T * Math.log(Zc);
    const pcur = (t) => { const xx = theta / t; return xx * xx * Math.exp(xx) / Math.expm1(xx) ** 2; };
    const pts = []; const Tmax = Math.max(2 * T, 1.5 * theta);
    for (let i = 1; i <= 160; i++) { const t = (Tmax * i) / 160; pts.push([t, pcur(t)]); }
    const p = []; for (let n = 0; n < 40 && (n < 8 || p[n - 1] > 1e-3); n++) p.push((1 - ex) * Math.exp(-n * x));
    const pasos = [
      { t: 'Cuanto del oscilador', html: `$ε = hν = ${f(h, 7)}·${f(nu, 5)} = ${f(eps, 5)} "J"$ = ${f(eps / meV, 5)} meV. Temperatura de Einstein $θ_E = hν/k_B = ${f(theta, 5)}$ K y $x = θ_E/T = ${f(x, 6)}$.` },
      { t: 'Niveles y función de partición', html: `Los niveles son $E_n = (n + 1/2)hν$. Midiendo desde el fundamental, $Z = Σ e^{−n x} = 1/{1 − e^{−x}} = 1/{1 − ${f(ex, 6)}} = ${f(Z, 7)}$` },
      { t: 'Ocupación media', html: `$⟨n⟩ = 1/{e^{x} − 1} = ${f(nm, 6)}$ cuantos por oscilador. Probabilidad de estar en el nivel $n$: $p_n = (1 − e^{−x})·e^{−n x}$, con $p_0 = ${f(p[0], 6)}$ y $p_1 = ${f(p[1], 6)}$.` },
      { t: 'Energía', html: `$U = hν(⟨n⟩ + 1/2) = ${f((nm + 0.5) * eps / meV, 6)} "meV"$, de la que ${f(U0 / meV, 5)} meV son de punto cero y ${f(U / meV, 6)} meV, térmica.` },
      { t: 'Entropía', html: `$S = k_B [x/{e^{x} − 1} − ln(1 − e^{−x})] = k_B·[${f(x * nm, 6)} − ln(${f(1 - ex, 6)})] = ${f(S / kB, 6)} k_B$ = ${f(S * NA, 5)} J/(mol·K) por mol de osciladores.` },
      { t: 'Capacidad calorífica', html: `$C_V = k_B x^2 e^{x}/(e^{x} − 1)^2 = ${f(Cv / kB, 6)} k_B$. A temperatura alta tiende a $k_B$ (Dulong-Petit, $3R$ por mol en un sólido de tres modos) y a baja se congela: $C_V → 0$.` },
    ];
    return { modo: 'oscilador', T, nu, eps, theta, x, Z, nm, U, U0, S, Cv, F, p, pasos, curva: pts, Tmax, Umev: U / meV, Sk: S / kB, Sm: S * NA, Cvk: Cv / kB, Fmev: F / meV, UkJ: U * NA / 1000 };
  }

  function propios(sc) {
    const T = lee(sc, 'T', 'la temperatura', { min: 0, minEx: true, max: 1e9 });
    const fl = filas(sc.lista, 2, 'los niveles');
    if (fl.length < 2) throw new Error('Escribe al menos dos niveles (energía en meV y degeneración, una pareja por línea)');
    if (fl.length > 5000) throw new Error('Demasiados niveles (máximo 5000)');
    fl.forEach(([e, g], i) => { if (!(g >= 1) || !Number.isInteger(g)) throw new Error(`Nivel ${i + 1}: la degeneración debe ser un entero mayor o igual que 1`); });
    const E = fl.map((v) => v[0] * meV), g = fl.map((v) => v[1]), r = niveles(E, g, T);
    const E0 = Math.min(...E), pasos = pasosBoltzmann(E, g, T, r, fl.map((_, i) => String(i)));
    return { modo: 'niveles', T, E, g, n: fl.length, E0, ...r, ...unidades(r), pasos };
  }

  function einstein(sc) {
    const N = lee(sc, 'N', 'el número de osciladores N', { min: 1, entero: true, max: 1e15 }), q = lee(sc, 'q', 'el número de cuantos q', { min: 0, entero: true, max: 1e15 });
    const epsmeV = lee(sc, 'eps', 'el cuanto ε', { min: 0, minEx: true, def: 1 });
    const ln = lnOmega(N, q), S = kB * ln;
    const slope = q >= 1 ? (lnOmega(N, q + 1) - lnOmega(N, q - 1)) / 2 : (lnOmega(N, 1) - lnOmega(N, 0)); // dlnΩ/dq (diferencia centrada)
    const Tk = q >= 1 ? epsmeV * KpormeV / slope : 0, U = q * epsmeV * meV, kTe = q >= 1 ? 1 / slope : 0;
    const stirling = (N + q) * Math.log(N + q) - q * Math.log(q || 1) - N * Math.log(N);
    const pasos = [
      { t: 'Microestados', html: `Repartir $q = ${f(q, 6)}$ cuantos entre $N = ${f(N, 6)}$ osciladores equivale a colocar $q$ bolas en $N$ cajas:<br>$Ω = binom(q + N − 1, q) = {(q + N − 1)!}/{q!·(N − 1)!}$ = <b>${grande(ln)}</b>${ln < 34 ? '' : ` (ln Ω = ${f(ln, 6)})`}` },
      { t: 'Entropía', html: `$S = k_B ln Ω = ${f(kB, 7)}·${f(ln, 6)} = ${f(S, 5)} "J/K"$ (${f(ln, 6)} $k_B$).` },
      { t: 'Energía', html: `$U = q·ε = ${f(q, 6)}·${f(epsmeV, 5)} "meV" = ${f(U / meV, 6)} "meV"$ (sin contar el punto cero).` },
      q >= 1
        ? { t: 'Temperatura', html: `$1/T = ∂S/∂U = {k_B}/ε·∂(ln Ω)/∂q ≈ {k_B}/ε·{ln Ω(q+1) − ln Ω(q−1)}/2 = {k_B}/ε·${f(slope, 6)}$<br>$k_B T = ε/${f(slope, 6)} = ${f(kTe, 6)} ε$ → <b>T = ${f(Tk, 6)} K</b>. La pendiente de ln Ω frente a q es $ε/k_B T$ (la recta discontinua de la gráfica).` }
        : { t: 'Temperatura', html: `Con $q = 0$ solo hay un microestado ($Ω = 1$, $S = 0$) y $T = 0$.` },
      q >= 1 ? { t: 'Comprobación con Stirling', html: `Para $N$ y $q$ grandes, $ln Ω ≈ (q + N)ln(q + N) − q ln q − N ln N = ${f(stirling, 7)}$ (el exacto es ${f(ln, 7)}; Stirling sobrestima un poco porque olvida un término de orden ln).` } : null,
    ].filter(Boolean);
    const pts = []; const qmax = Math.max(Math.ceil(q * 2), 10), paso = Math.max(1, Math.floor(qmax / 200));
    for (let i = 0; i <= qmax; i += paso) pts.push([i, lnOmega(N, i)]);
    return { modo: 'einstein', N, q, eps: epsmeV, ln, Omega: Math.exp(ln), S, Sk: ln, U, Umev: U / meV, slope, T: Tk, kTe, pasos, curva: pts, qmax, stirling };
  }

  // Dos sólidos de Einstein en contacto térmico: P(q_A) ∝ Ω_A(q_A)·Ω_B(q − q_A)
  function contacto(sc) {
    const NA_ = lee(sc, 'NA', 'el número de osciladores de A', { min: 1, entero: true, max: 1e12 }), NB = lee(sc, 'NB', 'el número de osciladores de B', { min: 1, entero: true, max: 1e12 });
    const q = lee(sc, 'qt', 'el total de cuantos q', { min: 1, entero: true, max: 20000 }), qA0 = lee(sc, 'qA0', 'los cuantos iniciales de A', { min: 0, max: q, entero: true });
    const ln = []; let max = -Infinity, qm = 0;
    for (let a = 0; a <= q; a++) { const v = lnOmega(NA_, a) + lnOmega(NB, q - a); ln.push(v); if (v > max) { max = v; qm = a; } }
    const pesos = ln.map((v) => Math.exp(v - max)), suma = pesos.reduce((a, b) => a + b, 0), prob = pesos.map((w) => w / suma);
    const lnTot = max + Math.log(suma), lnTotal = lnOmega(NA_ + NB, q); // Σ Ω_A Ω_B = Ω(N_A + N_B, q)
    const media = prob.reduce((a, p, i) => a + p * i, 0), sd = Math.sqrt(prob.reduce((a, p, i) => a + p * (i - media) ** 2, 0));
    const ancho = Math.max(1, Math.round(0.05 * q)), dentro = prob.reduce((a, p, i) => a + (Math.abs(i - qm) <= ancho ? p : 0), 0);
    const inv = (N, a) => (a >= 1 && a < q + 1 ? (lnOmega(N, a + 1) - lnOmega(N, a - 1)) / 2 : a === 0 ? lnOmega(N, 1) - lnOmega(N, 0) : lnOmega(N, a) - lnOmega(N, a - 1));
    const bA = inv(NA_, qA0), bB = inv(NB, q - qA0); // 1/T en unidades de k_B/ε
    const S0 = lnOmega(NA_, qA0) + lnOmega(NB, q - qA0), Sf = max;
    const flujo = Math.abs(bA - bB) < 1e-9 * Math.max(bA, bB, 1e-300) ? 'ya están en equilibrio' : bA < bB ? 'A está más caliente: pasa energía de A a B' : 'B está más caliente: pasa energía de B a A';
    const pasos = [
      { t: 'Macroestados', html: `Cada reparto $q_A$ de los $q = ${q}$ cuantos tiene $Ω_A(q_A)·Ω_B(q − q_A)$ microestados, con $Ω_A = binom(q_A + N_A − 1, q_A)$ y $Ω_B$ igual con $N_B = ${f(NB, 5)}$ y $q_B = q − q_A$. La probabilidad de cada reparto es proporcional a ese producto.` },
      { t: 'Total de microestados', html: `$Σ Ω_A Ω_B = Ω(N_A + N_B, q) = $ <b>${grande(lnTotal)}</b>: la suma de todos los repartos coincide con tener un solo sólido de $${f(NA_ + NB, 6)}$ osciladores ✓` },
      { t: 'Reparto más probable', html: `Máximo de $Ω_A Ω_B$ en $q_A^* = ${qm}$ (A tiene ${f(100 * qm / q, 4)} % de la energía y el equilibrio da ${f(100 * NA_ / (NA_ + NB), 4)} % de los osciladores). Con $Ω_A Ω_B = $ <b>${grande(max)}</b> y probabilidad ${f(prob[qm] * 100, 4)} %.` },
      { t: 'Anchura del equilibrio', html: `Desviación típica de $q_A$: $σ = ${f(sd, 4)}$ cuantos (${f(100 * sd / q, 3)} % de $q$). La probabilidad de estar a ±${ancho} cuantos del máximo es <b>${f(dentro * 100, 5)} %</b>. Cuantos más osciladores, más estrecho es el pico relativo.` },
      { t: 'Estado inicial', html: `Con $q_A = ${qA0}$: $ln Ω = ${f(S0, 6)}$ ($S_0 = ${f(S0, 6)} k_B$). Pendientes $∂ln Ω/∂q$ (= ε/k_B T): A = ${f(bA, 5)}, B = ${f(bB, 5)}, es decir $k_B T_A = ${f(bA > 0 ? 1 / bA : Infinity, 5)} ε$ y $k_B T_B = ${f(bB > 0 ? 1 / bB : Infinity, 5)} ε$.<br>${flujo}.` },
      { t: 'Segundo principio', html: `Al equilibrarse, $S = k_B ln Ω_{max} = ${f(Sf, 6)} k_B$: la entropía sube $ΔS = ${f(Sf - S0, 5)} k_B$ ≥ 0. En el equilibrio las dos pendientes coinciden: $∂ln Ω_A/∂q_A = ∂ln Ω_B/∂q_B$, o sea $T_A = T_B$.` },
    ];
    const pts = prob.map((p, i) => [i, p]);
    return { modo: 'contacto', NA: NA_, NB, q, qA0, qm, pmax: prob[qm], sd, dentro, ancho, lnMax: max, lnTotal, lnTot, S0, Sf, dS: Sf - S0, bA, bB, flujo, prob, pasos, curva: pts };
  }

  function resolver(sc) {
    const m = sc.modo || 'dos';
    if (m === 'oscilador') return oscilador(sc);
    if (m === 'niveles') return propios(sc);
    if (m === 'einstein') return einstein(sc);
    if (m === 'contacto') return contacto(sc);
    return dos(sc);
  }

  /* ---------- Ejemplos ---------- */
  const B = 0.2394; // constante rotacional del CO (meV)
  const rotor = Array.from({ length: 41 }, (_, J) => `${(B * J * (J + 1)).toFixed(4).replace('.', ',')} ${2 * J + 1}`).join('\n');
  const ejemplos = [
    { clave: 'dos', nombre: 'Dos niveles: ΔE = 10 meV a 300 K', sc: { modo: 'dos', T: '300', dE: '10', g0: '1', g1: '1' } },
    { clave: 'triplete', nombre: 'Fundamental único y excitado triple', sc: { modo: 'dos', T: '100', dE: '5', g0: '1', g1: '3' } },
    { clave: 'hidrogeno', nombre: 'Hidrógeno en la fotosfera: n = 1 y n = 2 a 5800 K', sc: { modo: 'niveles', T: '5800', lista: '0 2\n10200 8' } },
    { clave: 'einstein-diamante', nombre: 'Oscilador de Einstein del diamante a 300 K', sc: { modo: 'oscilador', T: '300', nu: '27,5' } },
    { clave: 'einstein-frio', nombre: 'El mismo oscilador congelado a 50 K', sc: { modo: 'oscilador', T: '50', nu: '27,5' } },
    { clave: 'rotor-co', nombre: 'Rotor rígido del CO a 300 K', sc: { modo: 'niveles', T: '300', lista: rotor } },
    { clave: 'tres-cuatro', nombre: 'Sólido de Einstein pequeño: N = 3, q = 4', sc: { modo: 'einstein', N: '3', q: '4', eps: '1' } },
    { clave: 'einstein-grande', nombre: 'Sólido de Einstein: N = 300, q = 100', sc: { modo: 'einstein', N: '300', q: '100', eps: '10' } },
    { clave: 'contacto', nombre: 'Dos sólidos: N_A = 300, N_B = 200, q = 100', sc: { modo: 'contacto', NA: '300', NB: '200', qt: '100', qA0: '100' } },
    { clave: 'contacto-pequeno', nombre: 'Dos sólidos pequeños: N_A = N_B = 3, q = 6', sc: { modo: 'contacto', NA: '3', NB: '3', qt: '6', qA0: '6' } },
  ];

  return { resolver, ejemplos, niveles, lnOmega, lnGamma, f, kB, h, eV, NA, R, meV, KpormeV };
})();
if (typeof module !== 'undefined') module.exports = TermoEstadistica;
