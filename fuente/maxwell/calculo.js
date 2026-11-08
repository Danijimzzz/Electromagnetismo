/* =====================================================================
   Ecuaciones de Maxwell: cálculo (sin DOM). Una calculadora por ecuación:
     gauss      Φ_E = Q/ε₀ y E(r) de una esfera con carga uniforme
     gaussmag   Φ_B por las seis caras de un cubo en un B uniforme (suma 0)
     faraday    fem inducida en una bobina con B(t) = B₀ sen ωt
     ampere     corriente de desplazamiento y B entre las placas de un condensador
     onda       c = 1/√(μ₀ε₀), B₀ = E₀/c, intensidad y λ de una onda plana
     campo      (MX-1) ¿cumplen E(x, y, z, t) y B(x, y, z, t) las cuatro ecuaciones? Derivadas con Expresion
                (matematicas/expresion.js), residuos en varios puntos y la ecuación que falla
   resolver(sc) → { modo, …resultados, pasos, grafica } (la gráfica es una lista de
   series {n, c, pts} o unas barras); lanza Error con un mensaje para el usuario.
   campos[modo] da los datos de cada ecuación y ejemplos los de Mis ejercicios.
   La interfaz está en app.js y la prueba en pruebas/herramientas/maxwell.js.
   ===================================================================== */
const Maxwell = (() => {
  const Ex_ = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const E0V = 8.8541878128e-12, MU0 = 1.25663706212e-6, C = 1 / Math.sqrt(E0V * MU0);
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // en las fórmulas $…$ el exponente va con ^ (f() da <sup>)
  const fm = (x, d) => f(x, d).replace(/<sup>(.*?)<\/sup>/, '^{$1}');
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  // signo: 'pos' (> 0), 'no0' (≥ 0) o 'cualquiera'
  function lee(sc, k, nom, signo = 'pos') {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (signo === 'pos' && v <= 0) throw new Error(`${may(nom)} debe ser mayor que 0`);
    if (signo === 'no0' && v < 0) throw new Error(`${may(nom)} no puede ser negativo`);
    return v;
  }

  const campos = {
    gauss: [['Q', 'Carga total Q', 'nC'], ['R', 'Radio de la esfera cargada R', 'm'], ['r', 'Radio de la superficie gaussiana r', 'm']],
    gaussmag: [['Bx', 'Campo B en x', 'T'], ['By', 'Campo B en y', 'T'], ['Bz', 'Campo B en z', 'T'], ['L', 'Lado del cubo L', 'm']],
    faraday: [['B0', 'Amplitud del campo B₀', 'mT'], ['fr', 'Frecuencia f', 'Hz'], ['A', 'Área de cada espira A', 'cm²'], ['N', 'Número de espiras N', '']],
    ampere: [['I', 'Corriente I que carga el condensador', 'A'], ['R', 'Radio de las placas R', 'cm'], ['r', 'Distancia al eje r', 'cm']],
    onda: [['E0', 'Amplitud del campo eléctrico E₀', 'V/m'], ['fr', 'Frecuencia f', 'Hz']],
    campo: [['Ex', 'Campo E, componente x', 'V/m'], ['Ey', 'Campo E, componente y', 'V/m'], ['Ez', 'Campo E, componente z', 'V/m'], ['Bx', 'Campo B, componente x (vacío = no se conoce)', 'T'], ['By', 'Campo B, componente y', 'T'], ['Bz', 'Campo B, componente z', 'T'], ['rho', 'Densidad de carga ρ (vacío = 0)', 'C/m³'], ['Jx', 'Corriente J, componente x (vacío = 0)', 'A/m²'], ['Jy', 'Corriente J, componente y', 'A/m²'], ['Jz', 'Corriente J, componente z', 'A/m²']],
  };
  const nombres = { gauss: 'Gauss para E', gaussmag: 'Gauss para B', faraday: 'Faraday', ampere: 'Ampère–Maxwell', onda: 'La onda electromagnética', campo: '¿Cumple este campo las ecuaciones?' };

  const lineas = (a, b, g, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, g(x)]; });


  /* ---------- MX-1: ¿este campo cumple las ecuaciones? ---------- */
  const VARS = ['x', 'y', 'z', 't'], PUNTOS = [[0.31, -0.52, 0.77, 0], [-0.43, 0.28, 0.61, 1e-9], [0.67, 0.35, -0.29, 2.7e-9], [0.18, -0.74, -0.46, 0.13], [-0.55, -0.21, 0.38, 0.61], [0.92, 0.47, 0.83, 3.1e-9]];
  const val = (n, P) => Ex_.valor(n, P[0], { y: P[1], z: P[2], t: P[3] });
  const lc = (src, nom) => (vacio(src) ? null : Ex_.lee(src, nom, VARS));
  const tx = (n) => Ex_.texto(n);
  const CERO = Ex_.N(0), suma = (...l) => l.reduce((a, b) => Ex_.simp({ t: '+', a, b }));
  const neg = (a) => Ex_.simp({ t: 'neg', a }), rest = (a, b) => Ex_.simp({ t: '-', a, b });
  const dv = (n, v) => (n ? Ex_.deriva(n, v) : CERO);
  const por = (c, a) => Ex_.simp({ t: '*', a: Ex_.N(c), b: a });
  // residuo relativo de una ecuación vectorial/escalar: máx |izq − der| / máx(|izq|, |términos|, 1e-300) en todos los puntos
  function residuo(izq, der) {
    let r = 0, esc2 = 0, n = 0, malos = 0;
    for (const P of PUNTOS) {
      for (let c = 0; c < izq.length; c++) {
        const a = val(izq[c], P), b = val(der[c], P); if (!isFinite(a) || !isFinite(b)) { malos++; continue; }
        n++; r = Math.max(r, Math.abs(a - b)); esc2 = Math.max(esc2, Math.abs(a), Math.abs(b));
      }
    }
    if (!n || malos * 2 > n + malos) throw new Error('No se puede evaluar el campo en los puntos de prueba (¿se divide por cero o falta una variable?)');
    return { abs: r, rel: esc2 > 0 ? r / esc2 : 0, escala: esc2 };
  }
  function resolverCampo(sc) {
    const E = ['Ex', 'Ey', 'Ez'].map((k) => lc(sc[k], `E${k[1]}`) || CERO), Bv = ['Bx', 'By', 'Bz'].map((k) => lc(sc[k], `B${k[1]}`)), conB = Bv.some(Boolean), B = Bv.map((b) => b || CERO);
    if (E.every((e) => e === CERO)) throw new Error('Escribe al menos una componente de E');
    const rho = lc(sc.rho, 'ρ') || CERO, J = ['Jx', 'Jy', 'Jz'].map((k) => lc(sc[k], `J${k[1]}`) || CERO);
    for (const [n, nom] of [...E.map((e, i) => [e, 'E' + 'xyz'[i]]), ...B.map((b, i) => [b, 'B' + 'xyz'[i]]), ...J.map((j, i) => [j, 'J' + 'xyz'[i]]), [rho, 'ρ']]) if (PUNTOS.filter((P) => !isFinite(val(n, P))).length * 2 >= PUNTOS.length) throw new Error(`${nom} no se puede evaluar en los puntos de prueba (¿divide por cero?)`);
    const V = ['x', 'y', 'z'], rot = (F) => [rest(dv(F[2], 'y'), dv(F[1], 'z')), rest(dv(F[0], 'z'), dv(F[2], 'x')), rest(dv(F[1], 'x'), dv(F[0], 'y'))];
    const div = (F) => suma(dv(F[0], 'x'), dv(F[1], 'y'), dv(F[2], 'z'));
    const divE = div(E), rotE = rot(E), dBdt = B.map((b) => dv(b, 't')), dEdt = E.map((e) => dv(e, 't'));
    const eqs = [];
    // 1. Gauss para E: ∇·E = ρ/ε0  (se compara ε0 ∇·E con ρ para no arrastrar 10⁻¹²)
    eqs.push({ n: 'Gauss para E', f: '∇·E = ρ/ε₀', ...residuo([por(E0V, divE)], [rho]), t: `$∇·E = ${tx(divE)}$`, extra: `ρ necesaria = ε₀∇·E = ${tx(por(E0V, divE))}` });
    // 2. Gauss para B
    let divB = null;
    if (conB) { divB = div(B); eqs.push({ n: 'Gauss para B', f: '∇·B = 0', ...residuo([divB], [CERO]), t: `$∇·B = ${tx(divB)}$` }); }
    // 3. Faraday: ∇×E = −∂B/∂t
    if (conB) eqs.push({ n: 'Faraday', f: '∇×E = −∂B/∂t', ...residuo(rotE, dBdt.map(neg)), t: `$∇×E = (${rotE.map(tx).join(', ')})$ y $−∂B/∂t = (${dBdt.map((d) => tx(neg(d))).join(', ')})$` });
    // 4. Ampère–Maxwell: ∇×B = μ0 J + μ0 ε0 ∂E/∂t   (se multiplica por 1/μ0)
    let rotB = null;
    if (conB) { rotB = rot(B); eqs.push({ n: 'Ampère–Maxwell', f: '∇×B = μ₀J + μ₀ε₀ ∂E/∂t', ...residuo(rotB.map((b) => por(1 / MU0, b)), J.map((j, i) => suma(j, por(E0V, dEdt[i])))), t: `$∇×B = (${rotB.map(tx).join(', ')})$` }); }
    for (const q of eqs) q.ok = q.rel <= 1e-6;
    const fallan = eqs.filter((q) => !q.ok), pasos = [];
    pasos.push({ t: 'Planteamiento', html: `Se comprueba cada ecuación de Maxwell con las derivadas parciales exactas de lo que has escrito (variables $x$, $y$, $z$, $t$ en m y s). Después se evalúa la diferencia entre los dos miembros en ${PUNTOS.length} puntos de prueba y se acepta si es menor que $10^{−6}$ del tamaño de los términos.` });
    pasos.push({ t: 'Divergencia de E', html: `$∇·E = {∂E_x}/{∂x} + {∂E_y}/{∂y} + {∂E_z}/{∂z} = ${tx(divE)}$. Gauss exige $∇·E = ρ/ε_0$: ` + (eqs[0].ok ? `se cumple con ρ = ${tx(rho)}.` : `no se cumple con ρ = ${tx(rho)}; haría falta $ρ = ε_0 ∇·E = ${tx(por(E0V, divE))}$ (diferencia relativa ${f(eqs[0].rel)}).`) });
    if (conB) {
      pasos.push({ t: 'Divergencia de B', html: `$∇·B = ${tx(divB)}$. Gauss para B exige que sea 0: ` + (eqs[1].ok ? 'se cumple.' : `no se cumple (diferencia relativa ${f(eqs[1].rel)}): un campo B así implicaría un monopolo magnético.`) });
      pasos.push({ t: 'Rotacional de E', html: `$∇×E = (${rotE.map(tx).join(', ')})$ y $−{∂B}/{∂t} = (${dBdt.map((d) => tx(neg(d))).join(', ')})$. Faraday: ` + (eqs[2].ok ? 'coinciden.' : `no coinciden (diferencia relativa ${f(eqs[2].rel)}).`) });
      pasos.push({ t: 'Rotacional de B', html: `$∇×B = (${rotB.map(tx).join(', ')})$ y $μ_0 J + μ_0 ε_0 {∂E}/{∂t} = μ_0 (${J.map((j, i) => tx(suma(j, por(E0V, dEdt[i])))).join(', ')})$. Ampère–Maxwell: ` + (eqs[3].ok ? 'coinciden.' : `no coinciden (diferencia relativa ${f(eqs[3].rel)}).`) });
    } else {
      pasos.push({ t: 'Cuál es B', html: `Con solo E, Faraday da $∂B/∂t = −∇×E = (${rotE.map((r2) => tx(neg(r2))).join(', ')})$. Integrando en $t$ (más un campo estático arbitrario) sale B; escríbelo en los campos de B para comprobar Gauss para B y Ampère–Maxwell.` });
    }
    pasos.push({ t: 'Conclusión', html: conB ? (fallan.length ? `El campo <b>no</b> cumple: ${fallan.map((q) => q.n).join(', ')}. No puede ser un campo electromagnético con esas fuentes.` : 'Cumple las cuatro ecuaciones: es un campo electromagnético posible con esas fuentes.') : (eqs[0].ok ? 'Cumple Gauss para E; da el campo B para seguir.' : 'No cumple Gauss para E con esa ρ.') });
    const ok = conB && !fallan.length;
    return { modo: 'campo', eqs, conB, ok, fallan, divE: tx(divE), rotE: rotE.map(tx), dBdt: dBdt.map((d) => tx(neg(d))), pasos, grafica: { barras: eqs.map((q) => ({ n: q.n, v: q.rel })), yl: 'diferencia relativa entre los dos miembros', cero: true } };
  }

  function resolver(sc) {
    const modo = sc.modo || 'gauss';
    if (modo === 'campo') return resolverCampo(sc);
    if (!campos[modo]) throw new Error('Esa ecuación no existe');
    let r;
    if (modo === 'gauss') {
      const Q = lee(sc, 'Q', 'la carga', 'cualquiera') * 1e-9, R = lee(sc, 'R', 'el radio de la esfera'), rr = lee(sc, 'r', 'el radio de la superficie');
      if (Q === 0) throw new Error('La carga no puede ser 0');
      const k = 1 / (4 * Math.PI * E0V), dentro = rr < R, Qint = dentro ? Q * (rr / R) ** 3 : Q, Phi = Qint / E0V;
      const Ef = (x) => (x < R ? (k * Q * x) / R ** 3 : (k * Q) / x ** 2), E = Ef(rr);
      const pasos = [
        { t: 'Ley de Gauss', html: `$∮ E·dS = Q_{enc}/ε_0$, con $ε_0 = 8,854·10^{−12} "F/m"$` },
        { t: 'Carga encerrada', html: dentro ? `La superficie ($r = ${fm(rr)} "m"$) está dentro de la esfera ($R = ${fm(R)} "m"$): solo encierra la parte $(r/R)^3$ de la carga. $Q_{enc} = Q (r/R)^3 = ${fm(Qint)} "C"$` : `La superficie ($r = ${fm(rr)} "m"$) deja dentro toda la esfera ($R = ${fm(R)} "m"$): $Q_{enc} = Q = ${fm(Q)} "C"$` },
        { t: 'Flujo', html: `$Φ_E = Q_{enc}/ε_0 = {${fm(Qint)}}/{8,854·10^{−12}} = ${fm(Phi)} "V·m"$` },
        { t: 'Campo en la superficie', html: `Por simetría E es radial y constante sobre la esfera de radio $r$, así que $E·4π r^2 = Φ_E$ y $E = Φ_E/{4π r^2} = ${fm(E)} "V/m"$` + (dentro ? `, que es $E = {Q r}/{4π ε_0 R^3}$` : `, que es $E = Q/{4π ε_0 r^2}$`) },
      ];
      r = { Q, R, r: rr, dentro, Qint, Phi, E, pasos, grafica: { xl: 'r (m)', yl: 'E (V/m)', series: [{ n: 'E(r)', c: '--e', pts: lineas(0, 3 * Math.max(R, rr), (x) => Math.abs(Ef(x))) }], marca: rr } };
    } else if (modo === 'gaussmag') {
      const B = [lee(sc, 'Bx', 'la componente x de B', 'cualquiera'), lee(sc, 'By', 'la componente y de B', 'cualquiera'), lee(sc, 'Bz', 'la componente z de B', 'cualquiera')], L = lee(sc, 'L', 'el lado del cubo');
      if (!B.some((b) => b !== 0)) throw new Error('B no puede ser cero en todas sus componentes');
      const A = L * L, caras = [];
      ['x', 'y', 'z'].forEach((e, i) => { caras.push({ n: `+${e}`, v: B[i] * A }); caras.push({ n: `−${e}`, v: -B[i] * A }); });
      const total = caras.reduce((s, c) => s + c.v, 0);
      const pasos = [
        { t: 'Ley de Gauss para B', html: `$∮ B·dS = 0$: no hay cargas magnéticas, así que las líneas de B no nacen ni mueren en ninguna parte y todo lo que entra en una superficie cerrada sale.` },
        { t: 'Área de cada cara', html: `$A = L^2 = (${fm(L)})^2 = ${fm(A)} "m"^2$` },
        { t: 'Flujo por cada cara', html: `Con la normal hacia fuera, en la cara $+x$ es $Φ = B_x A = ${fm(B[0] * A)} "Wb"$ y en la opuesta, $−x$, la normal cambia de signo: $Φ = −B_x A = ${fm(-B[0] * A)} "Wb"$. Igual para y y z: $±B_y A = ±${fm(Math.abs(B[1] * A))} "Wb"$ y $±B_z A = ±${fm(Math.abs(B[2] * A))} "Wb"$.` },
        { t: 'Flujo total', html: `$Φ_B = Σ Φ_{caras} = 0$: lo que entra por una cara sale por la opuesta.` },
        { t: 'Forma diferencial', html: `Aplicando el teorema de la divergencia a un cubo muy pequeño, $∇·B = {∂B_x}/{∂x} + {∂B_y}/{∂y} + {∂B_z}/{∂z} = 0$. En un campo uniforme las tres derivadas valen 0, y también en el de un imán o una corriente.` },
      ];
      r = { B, L, A, caras, total, pasos, grafica: { barras: caras.map((c) => ({ n: c.n, v: c.v })), yl: 'Φ (Wb)' } };
    } else if (modo === 'faraday') {
      const B0 = lee(sc, 'B0', 'la amplitud del campo') * 1e-3, fr = lee(sc, 'fr', 'la frecuencia'), A = lee(sc, 'A', 'el área') * 1e-4, N = lee(sc, 'N', 'el número de espiras');
      if (!Number.isInteger(N)) throw new Error('El número de espiras debe ser entero');
      const w = 2 * Math.PI * fr, Phi0 = N * B0 * A, emax = Phi0 * w, T = 1 / fr;
      const pasos = [
        { t: 'Ley de Faraday', html: `$ε = −{dΦ}/{dt}$ con $Φ = N ∫ B·dS$ (flujo concatenado de las $N$ espiras)` },
        { t: 'Flujo', html: `Con $B(t) = B_0 sen ωt$ perpendicular a la bobina, $Φ(t) = N B_0 A sen ωt$. Su amplitud es $N B_0 A = ${N} · ${fm(B0)} · ${fm(A)} = ${fm(Phi0)} "Wb"$` },
        { t: 'Frecuencia angular', html: `$ω = 2π f = 2π · ${fm(fr)} = ${fm(w)} "rad/s"$` },
        { t: 'Fuerza electromotriz', html: `$ε(t) = −{dΦ}/{dt} = −N B_0 A ω cos ωt$, de amplitud $ε_{max} = Φ_0 ω = ${fm(Phi0)} · ${fm(w)} = ${fm(emax)} "V"$` },
        { t: 'Valor eficaz', html: `$ε_{ef} = ε_{max}/√2 = ${fm(emax / Math.SQRT2)} "V"$. La fem está desfasada 90° respecto al flujo: es máxima cuando el flujo pasa por cero, que es cuando más rápido cambia.` },
        { t: 'Forma diferencial', html: `Por Stokes, $∮ E·dl = −{dΦ}/{dt}$ equivale a $∇ × E = −{∂B}/{∂t}$: un campo magnético que cambia crea un campo eléctrico con circulación.` },
      ];
      const nt = (t) => Math.sin(w * t), ne = (t) => -Math.cos(w * t);
      r = { B0, fr, A, N, w, Phi0, emax, T, pasos, grafica: { xl: 't (s)', yl: 'relativo al máximo', series: [{ n: `Φ (máx. ${f(Phi0)} Wb)`, c: '--b', pts: lineas(0, 2 * T, nt, 200) }, { n: `ε (máx. ${f(emax)} V)`, c: '--e', pts: lineas(0, 2 * T, ne, 200) }] } };
    } else if (modo === 'ampere') {
      const I = lee(sc, 'I', 'la corriente'), R = lee(sc, 'R', 'el radio de las placas') * 1e-2, rr = lee(sc, 'r', 'la distancia al eje') * 1e-2;
      const dEdt = I / (E0V * Math.PI * R ** 2), dentro = rr < R, Id = dentro ? I * (rr / R) ** 2 : I, B = (MU0 * Id) / (2 * Math.PI * rr);
      const Bf = (x) => (x < R ? (MU0 * I * x) / (2 * Math.PI * R ** 2) : (MU0 * I) / (2 * Math.PI * x));
      const pasos = [
        { t: 'Ley de Ampère–Maxwell', html: `$∮ B·dl = μ_0 (I_{enc} + ε_0 {dΦ_E}/{dt})$: el segundo sumando es la corriente de desplazamiento $I_d$.` },
        { t: 'Campo entre las placas', html: `Entre las placas el campo es uniforme, $E = σ/ε_0 = Q/{ε_0 π R^2}$, y crece al llegar carga: $dE/dt = I/{ε_0 π R^2} = ${fm(I)}/{8,854·10^{−12}·π·(${fm(R)})^2} = ${fm(dEdt)} "V/(m·s)"$` },
        { t: 'Corriente de desplazamiento encerrada', html: dentro ? `Un círculo de radio $r = ${fm(rr)} "m"$ (dentro de las placas) abarca la parte $r^2/R^2$ del flujo: $I_d = ε_0 π r^2 dE/dt = I r^2/R^2 = ${fm(Id)} "A"$` : `Un círculo de radio $r = ${fm(rr)} "m"$ (fuera de las placas) abarca todo el campo: $I_d = ε_0 π R^2 dE/dt = I = ${fm(Id)} "A"$. Es la misma corriente que llega por el cable: la ley de Ampère sin $I_d$ no se cumpliría.` },
        { t: 'Campo magnético', html: `Por simetría B es tangente al círculo: $B · 2π r = μ_0 I_d$, luego $B = {μ_0 I_d}/{2π r} = ${fm(B)} "T"$` + (dentro ? `, o sea $B = {μ_0 I r}/{2π R^2}$` : `, o sea $B = {μ_0 I}/{2π r}$, igual que el de un hilo`) },
        { t: 'Forma diferencial', html: `Por Stokes: $∇ × B = μ_0 J + μ_0 ε_0 {∂E}/{∂t}$. Maxwell añadió el último término; con él las ecuaciones predicen ondas.` },
      ];
      r = { I, R, r: rr, dEdt, dentro, Id, B, pasos, grafica: { xl: 'r (m)', yl: 'B (T)', series: [{ n: 'B(r)', c: '--b', pts: lineas(0, 3 * Math.max(R, rr), Bf) }], marca: rr } };
    } else {
      const E0 = lee(sc, 'E0', 'la amplitud de E'), fr = lee(sc, 'fr', 'la frecuencia');
      const B0 = E0 / C, lam = C / fr, I = (E0 * E0) / (2 * MU0 * C), u = (E0V * E0 * E0) / 2, eta = MU0 * C;
      const pasos = [
        { t: 'Velocidad de las ondas', html: `Combinando las ecuaciones de Faraday y Ampère–Maxwell en el vacío se obtiene $∇^2 E = μ_0 ε_0 {∂^2 E}/{∂t^2}$, una ecuación de ondas con $c = 1/√{μ_0 ε_0} = 1/√{${fm(MU0)} · ${fm(E0V)}} = ${fm(C)} "m/s"$` },
        { t: 'Amplitud de B', html: `Faraday da $E_0 = c B_0$, luego $B_0 = E_0/c = ${fm(E0)}/${fm(C)} = ${fm(B0)} "T"$` },
        { t: 'Longitud de onda', html: `$λ = c/f = ${fm(C)}/${fm(fr)} = ${fm(lam)} "m"$` },
        { t: 'Intensidad', html: `$I = ⟨S⟩ = {E_0^2}/{2 μ_0 c} = {(${fm(E0)})^2}/{2 · ${fm(MU0)} · ${fm(C)}} = ${fm(I)} "W/m"^2$, con impedancia del vacío $η = μ_0 c = ${fm(eta)} "Ω"$` },
        { t: 'Energía almacenada', html: `La densidad media de energía es $u = 1/2 ε_0 E_0^2 = ${fm(u)} "J/m"^3$, mitad eléctrica y mitad magnética; la onda la transporta a velocidad $c$ ($I = u c$).` },
      ];
      const k = (2 * Math.PI) / lam;
      r = { E0, fr, B0, lam, I, u, eta, c: C, pasos, grafica: { xl: 'z (m)', yl: 'relativo a la amplitud', series: [{ n: `E (${f(E0)} V/m)`, c: '--e', pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }, { n: `B (${f(B0)} T)`, c: '--b', d: 1, pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }] } };
    }
    return { modo, ...r };
  }

  const ejemplos = [
    { clave: 'esfera-fuera', nombre: 'Gauss: esfera cargada, desde fuera', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,3' } },
    { clave: 'esfera-dentro', nombre: 'Gauss: esfera cargada, desde dentro', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,05' } },
    { clave: 'cubo', nombre: 'Gauss para B: un cubo en un campo uniforme', sc: { modo: 'gaussmag', Bx: '0,2', By: '-0,1', Bz: '0,3', L: '0,5' } },
    { clave: 'bobina', nombre: 'Faraday: bobina de 200 espiras a 50 Hz', sc: { modo: 'faraday', B0: '100', fr: '50', A: '20', N: '200' } },
    { clave: 'condensador-dentro', nombre: 'Ampère–Maxwell: dentro de un condensador', sc: { modo: 'ampere', I: '2', R: '5', r: '2' } },
    { clave: 'condensador-fuera', nombre: 'Ampère–Maxwell: fuera de un condensador', sc: { modo: 'ampere', I: '2', R: '5', r: '10' } },
    { clave: 'fm', nombre: 'Onda: emisora de FM a 100 MHz', sc: { modo: 'onda', E0: '1', fr: '1e8' } },
    { clave: 'campo-onda', nombre: 'Campo: onda plana en el vacío (cumple todo)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/299792458', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-mal', nombre: 'Campo: onda con B demasiado grande (falla Faraday)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/100000000', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-coulomb', nombre: 'Campo: carga puntual (∇·E = 0 fuera del origen)', sc: { modo: 'campo', Ex: '9 x/(x^2+y^2+z^2)^(3/2)', Ey: '9 y/(x^2+y^2+z^2)^(3/2)', Ez: '9 z/(x^2+y^2+z^2)^(3/2)', Bx: '0', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-uniforme', nombre: 'Campo: E lineal sin cargas (falla Gauss)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '', By: '', Bz: '', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-rho', nombre: 'Campo: E = 5x con ρ = 5ε₀ (cumple Gauss)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '0', By: '0', Bz: '0', rho: '4.4270939064*10^(-11)', Jx: '', Jy: '', Jz: '' } },
  ];

  return { resolver, ejemplos, campos, nombres, f, constantes: { E0V, MU0, C } };
})();
if (typeof module !== 'undefined') module.exports = Maxwell;
