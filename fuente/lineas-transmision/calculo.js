/* =====================================================================
   Cálculo de las líneas de transmisión sin pérdidas y de la carta de Smith (sin DOM). La
   interfaz está en app.js y la prueba en pruebas/herramientas/lineas-transmision.js.
     resolver(sc)  { Z0 (Ω), R, X (Ω, carga R + jX), f (MHz), er, l, lu ('m'|'lam') } (texto) →
                   Γ, ROE, pérdida de retorno, λ, impedancia de entrada, máximos y mínimos de
                   tensión, adaptación con un stub en paralelo y con un transformador λ/4, perfil
                   de ondas estacionarias y pasos; lanza un Error con un mensaje para el usuario
     zEn(r, d)     impedancia (Ω, {re, im}) a la distancia d (en λ) de la carga hacia el generador
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
   Línea sin pérdidas, v = c/√εr, c = 299 792 458 m/s.
   ===================================================================== */
const LineasTransmision = (() => {
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C0 = SI.c, PI = Math.PI;
  const f = (x, d = 4) => {
    if (x === Infinity) return '∞';
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, min = 0, incl = false) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (incl ? v < min : v <= min) throw new Error(`${may(nom)} debe ser ${incl ? 'al menos' : 'mayor que'} ${f(min)}`);
    return v;
  }
  const leeX = (sc, k, nom) => { // reactancia: vacía vale 0, puede ser negativa
    if (vacio(sc[k])) return 0;
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    return v;
  };

  // complejos {re, im}
  const cx = (re, im = 0) => ({ re, im });
  const suma = (a, b) => cx(a.re + b.re, a.im + b.im), resta = (a, b) => cx(a.re - b.re, a.im - b.im);
  const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const mod = (a) => Math.hypot(a.re, a.im), arg = (a) => Math.atan2(a.im, a.re);
  const polar = (m, t) => cx(m * Math.cos(t), m * Math.sin(t));
  const gamma = (z, z0) => div(resta(z, cx(z0)), suma(z, cx(z0)));
  const cmplx = (a) => `${f(a.re)} ${a.im < 0 ? '−' : '+'} j${f(Math.abs(a.im))}`;
  const resto = (x, p) => ((x % p) + p) % p;

  // impedancia a la distancia d (en λ) de la carga hacia el generador: Z0 (ZL cos + j Z0 sen)/(Z0 cos + j ZL sen)
  function zEn(r, d) {
    const th = 2 * PI * d, c = Math.cos(th), s = Math.sin(th), zl = cx(r.R, r.X), z0 = cx(r.Z0);
    return mul(z0, div(suma(mul(zl, cx(c)), mul(cx(0, 1), mul(z0, cx(s)))), suma(mul(z0, cx(c)), mul(cx(0, 1), mul(zl, cx(s))))));
  }


  /* ---------- LT-1: línea con pérdidas (poca pérdida: Z₀ ≈ Z₀(1 − jα/β), γ = α + jβ) ---------- */
  const cexp = (a) => polar(Math.exp(a.re), a.im);
  const ctanh = (z) => { const e = cexp(cx(2 * z.re, 2 * z.im)); return div(resta(e, cx(1)), suma(e, cx(1))); };
  function conPerdidas(r, alfaDb, P) {
    const alfa = alfaDb / 8.685889638, beta = r.beta, gam = cx(alfa, beta), Z0c = cx(r.Z0, -r.Z0 * alfa / beta), zl = cx(r.R, r.X);
    const GL = div(resta(zl, Z0c), suma(zl, Z0c)), t = ctanh(cx(alfa * r.l, beta * r.l));
    const zin = mul(Z0c, div(suma(zl, mul(Z0c, t)), suma(Z0c, mul(zl, t)))), Gin = mul(GL, cexp(cx(-2 * alfa * r.l, -2 * beta * r.l))), gi = mod(Gin);
    const atenDb = alfaDb * r.l, atenLin = Math.exp(-2 * alfa * r.l), gL = mod(GL);
    // pérdida total de inserción respecto a lo que llega a la carga: P_L = P_inc e^{-2αl}(1 − |Γ_L|²) con P_inc la potencia incidente en la entrada
    const out = { alfa, alfaDb, gam, Z0c, GL, zin, Gin, gin: gi, roeIn: (1 + gi) / (1 - gi), atenDb, atenLin, gL, perdidaTotalDb: -10 * Math.log10(atenLin * (1 - gL * gL) / (1 - gi * gi)) };
    if (P !== null) {
      out.P = P; out.Pinc = P; out.PL = P * atenLin * (1 - gL * gL); out.Pent = P * (1 - gi * gi); out.Pdisip = out.Pent - out.PL;
    }
    out.lmaxUtil3 = alfaDb > 0 ? 3 / alfaDb : Infinity;
    return out;
  }

  /* ---------- LT-2: transitorios (escalón o pulso de un generador Vg con Rg, carga resistiva) ---------- */
  function transitorio(r, Vg, Rg, tp, xp) {
    const Z0 = r.Z0, RL = r.R, T = r.l / r.v, GL = (RL - Z0) / (RL + Z0), Gg = (Rg - Z0) / (Rg + Z0), V1 = Vg * Z0 / (Z0 + Rg), Vinf = Vg * RL / (RL + Rg);
    const x = xp * r.l, tx = x / r.v, tl = T - tx;
    const escalon = (t, ox) => { // tensión en la posición x (m) para un escalón unitario ×V1 en t = 0
      const ta = ox / r.v, tb = (r.l - ox) / r.v; let v = 0; const q = GL * Gg;
      for (let k = 0; k < 400; k++) {
        const a = 2 * k * T + ta, b = (2 * k + 1) * T + tb, qk = q ** k;
        if (t >= a) v += V1 * qk; if (t >= b) v += V1 * GL * qk;
        if (t < a && t < b) break;
      }
      return v;
    };
    const V = (t, ox) => (tp ? escalon(t, ox) - escalon(t - tp, ox) : escalon(t, ox));
    const rebotes = []; // frentes sucesivos: tiempo, posición de llegada (0 generador, l carga), amplitud
    let amp = V1, t = 0, pos = 0;
    for (let k = 0; k < 8; k++) {
      t += T; pos = (k % 2 === 0) ? r.l : 0;
      rebotes.push({ n: k + 1, t, pos, v: amp, Gref: k % 2 === 0 ? GL : Gg, onda: k % 2 === 0 ? 'incidente → carga' : 'reflejada → generador' });
      amp *= k % 2 === 0 ? GL : Gg;
    }
    const tmax = Math.max(8 * T, tp ? tp + 6 * T : 0);
    return { Vg, Rg, tp, xp, x, T, GL, Gg, V1, Vinf, V, escalon, rebotes, tmax, tx, tl, Vcarga1: V1 * (1 + GL) };
  }

  /* ---------- LT-3: más formas de adaptar (stub en serie, doble stub, ancho de banda) ---------- */
  const zEnK = (r, d, k) => { // impedancia normalizada a la distancia d (en λ) de la carga cuando la frecuencia es k·f₀
    const th = 2 * PI * d * k, c = Math.cos(th), sn = Math.sin(th), zl = cx(r.R / r.Z0, r.X / r.Z0), j = cx(0, 1);
    return div(suma(mul(zl, cx(c)), mul(j, cx(sn))), suma(cx(c), mul(mul(j, zl), cx(sn))));
  };
  const gamN = (z) => div(resta(z, cx(1)), suma(z, cx(1)));
  const cotg = (th) => Math.cos(th) / Math.sin(th);
  // distancias (en λ) donde la parte real de z(d) vale 1 (para el stub en serie)
  function stubSerie(r) {
    const sols = [], N = 2000, ff = (d) => zEnK(r, d, 1).re - 1;
    let prev = ff(0);
    for (let i = 1; i <= N; i++) {
      const d1 = i / N * 0.5, cur = ff(d1);
      if (prev * cur <= 0 && !(prev === 0 && i > 1)) {
        let a = (i - 1) / N * 0.5, b = d1, fa = prev;
        for (let it = 0; it < 80; it++) { const m = (a + b) / 2, fm = ff(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
        const d = (a + b) / 2, z = zEnK(r, d, 1), x = z.im; // el stub en serie aporta −jx
        const lcc = resto(Math.atan(-x) / (2 * PI), 0.5), lab = Math.abs(x) < 1e-12 ? 0.25 : resto(Math.atan(1 / x) / (2 * PI), 0.5);
        if (!sols.some((q) => Math.abs(q.d - d) < 1e-6)) sols.push({ d, dm: d * r.lam, x, lcc, lccm: lcc * r.lam, lab, labm: lab * r.lam });
      }
      prev = cur;
    }
    return sols.slice(0, 2);
  }
  // doble stub en paralelo (cortocircuitados) con el primero a d1 (λ) de la carga y separación s (λ, 1/8 o 3/8)
  function dobleStub(r, d1, sep) {
    const y = div(cx(1), zEnK(r, d1, 1)), t = Math.tan(2 * PI * sep), g1 = y.re;
    const disc = g1 * (1 + t * t) - t * t * g1 * g1;
    if (disc < 0) return { prohibida: true, gmax: 1 / (Math.sin(2 * PI * sep) ** 2), g1, sols: [] };
    const sols = [];
    for (const sg of [1, -1]) {
      const B = (1 + sg * Math.sqrt(disc)) / t, b1 = B - y.im;
      const yp = div(cx(g1, B + t), cx(1 - t * B, t * g1)), b2 = -yp.im; // y' a la entrada del segundo plano
      const lc = (b) => resto(Math.atan2(1, b) / (2 * PI), 0.5);
      sols.push({ b1, b2, l1: lc(-b1), l2: lc(-b2), l1m: lc(-b1) * r.lam, l2m: lc(-b2) * r.lam, yp });
    }
    return { prohibida: false, gmax: 1 / (Math.sin(2 * PI * sep) ** 2), g1, sols };
  }
  // |Γ| de cada red de adaptación al cambiar la frecuencia (k = f/f₀) con las longitudes físicas fijas
  function redes(r, st, se, ds, cuarto) {
    const out = {};
    if (st) out.stub = (k) => { const y = div(cx(1), zEnK(r, st.d, k)); return mod(gamN(div(cx(1), suma(y, cx(0, -cotg(2 * PI * st.lcc * k)))))); };
    if (se) out.serie = (k) => { const z = suma(zEnK(r, se.d, k), cx(0, Math.tan(2 * PI * se.lcc * k))); return mod(gamN(z)); };
    if (ds) out.doble = (k) => {
      const y = div(cx(1), zEnK(r, ds.d1, k)), y1 = suma(y, cx(0, -cotg(2 * PI * ds.l1 * k))), t = Math.tan(2 * PI * ds.sep * k), jt = cx(0, t);
      const y2 = div(suma(y1, jt), suma(cx(1), mul(jt, y1))), y3 = suma(y2, cx(0, -cotg(2 * PI * ds.l2 * k)));
      return mod(gamN(div(cx(1), y3)));
    };
    if (cuarto) out.cuarto = (k) => {
      const z1 = zEnK(r, cuarto.d, k), zt = cuarto.Zt / r.Z0, tt = Math.tan(PI / 2 * k), j = cx(0, tt);
      const zin = mul(cx(zt), div(suma(z1, mul(j, cx(zt))), suma(cx(zt), mul(j, z1))));
      return mod(gamN(zin));
    };
    return out;
  }
  // ancho de banda fraccional con ROE ≤ roeMax alrededor de k = 1 (como fracción de f₀)
  function anchoBanda(fun, roeMax = 2) {
    const gmax = (roeMax - 1) / (roeMax + 1); let lo = 1, hi = 1;
    while (lo > 0.3 && fun(lo - 0.0005) <= gmax) lo -= 0.0005;
    while (hi < 1.7 && fun(hi + 0.0005) <= gmax) hi += 0.0005;
    return { lo, hi, bw: hi - lo };
  }

  function resolver(sc) {
    const Z0 = lee(sc, 'Z0', 'la impedancia característica Z₀'), R = lee(sc, 'R', 'la resistencia de la carga R'), X = leeX(sc, 'X', 'la reactancia de la carga X');
    const F = lee(sc, 'f', 'la frecuencia') * 1e6, er = lee(sc, 'er', 'εr'), lu = sc.lu === 'lam' ? 'lam' : 'm', L = lee(sc, 'l', 'la longitud de la línea', 0, true);
    const v = C0 / Math.sqrt(er), lam = v / F, beta = 2 * PI / lam, ld = lu === 'lam' ? L : L / lam, lm = ld * lam;
    const r = { Z0, R, X, F, er, v, lam, beta, l: lm, ld, lu };
    const alfaDb = vacio(sc.alfa) ? 0 : lee(sc, 'alfa', 'la atenuación α (dB/m)', 0, true), Pot = vacio(sc.P) ? null : lee(sc, 'P', 'la potencia incidente'), perdidas = alfaDb > 0 || Pot !== null;
    const trans = !vacio(sc.Vg);
    const zl = cx(R, X), G = gamma(zl, Z0), g = mod(G), th = arg(G);
    const roe = (1 + g) / (1 - g), rl = g < 1e-12 ? Infinity : -20 * Math.log10(g), desad = -10 * Math.log10(1 - g * g);
    Object.assign(r, { G, g, th, roe, rl, desad, pRef: g * g * 100, adaptada: g < 1e-9 });
    const grados = th * 180 / PI;
    const pasos = [
      { t: 'Datos', html: `$Z_0 = ${f(Z0)} "Ω"$, $Z_L = ${cmplx(zl)} "Ω"$, $f = ${f(F / 1e6)} "MHz"$, $ε_r = ${f(er)}$, $l = ${f(lm)} "m"$.` },
      { t: 'Velocidad, longitud de onda y constante de fase', html: `$v = c/√(ε_r) = ${f(v)} "m/s"$, $λ = v/f = ${f(lam)} "m"$, $β = {2π}/λ = ${f(beta)} "rad/m"$. La línea mide $l/λ = ${f(ld)}$.` },
      { t: 'Coeficiente de reflexión en la carga', html: `$Γ_L = {Z_L − Z_0}/{Z_L + Z_0} = {${cmplx(resta(zl, cx(Z0)))}}/{${cmplx(suma(zl, cx(Z0)))}} = ${cmplx(G)}$, es decir $|Γ_L| = ${f(g)}$ y $θ = ${f(grados)}°$.` },
      { t: 'Relación de onda estacionaria y pérdidas', html: `$"ROE" = {1 + |Γ|}/{1 − |Γ|} = ${f(roe)}$. Pérdida de retorno $"RL" = −20 log |Γ| = ${f(rl)} "dB"$; se refleja el $|Γ|^2 = ${f(r.pRef)} %$ de la potencia y la pérdida por desadaptación es $−10 log(1 − |Γ|^2) = ${f(desad)} "dB"$.` },
    ];
    // impedancia de entrada
    const zin = zEn(r, ld), Gin = polar(g, th - 4 * PI * ld);
    r.zin = zin; r.Gin = Gin; r.yin = div(cx(1), zin);
    pasos.push({ t: 'Impedancia de entrada', html: `$Z_"in" = Z_0 {Z_L + j Z_0 tg(β l)}/{Z_0 + j Z_L tg(β l)}$ con $β l = ${f(beta * lm * 180 / PI)}°$: $Z_"in" = ${cmplx(zin)} "Ω"$. El coeficiente de reflexión a la entrada es $Γ_"in" = Γ_L e^{−j 2 β l}$, de módulo $${f(g)}$ y fase $${f(arg(Gin) * 180 / PI)}°$.` });
    if (r.adaptada) {
      r.dmax = null; r.stub = null; r.cuarto = null;
      pasos.push({ t: 'Carga adaptada', html: `$Z_L = Z_0$, así que $Γ = 0$ y $"ROE" = 1$: no hay onda reflejada ni ondas estacionarias, y la impedancia vale $Z_0$ en toda la línea. No hace falta adaptar.` });
    } else {
      // máximos y mínimos de tensión desde la carga: arg Γ(d) = θ − 2βd
      const t2 = resto(th, 2 * PI), dmax = t2 / (4 * PI), dmin = resto(dmax + 0.25, 0.5);
      r.dmax = dmax * lam; r.dmin = dmin * lam; r.dmaxL = dmax; r.dminL = dmin;
      r.Zmax = Z0 * roe; r.Zmin = Z0 / roe;
      pasos.push({ t: 'Máximos y mínimos de tensión', html: `El primer máximo de $|V|$ está donde $θ − 2β d = 0$: $d_"máx" = {θ λ}/{4π} = ${f(dmax)} λ = ${f(r.dmax)} "m"$ de la carga, y el primer mínimo $λ/4$ más allá: $d_"mín" = ${f(dmin)} λ = ${f(r.dmin)} "m"$ (se repiten cada $λ/2$). La tensión varía entre $V_"máx" = (1 + |Γ|)|V^+| = ${f(1 + g)} |V^+|$ y $V_"mín" = (1 − |Γ|)|V^+| = ${f(1 - g)} |V^+|$. En el máximo la impedancia es real, $Z_0 "ROE" = ${f(r.Zmax)} "Ω"$, y en el mínimo $Z_0/"ROE" = ${f(r.Zmin)} "Ω"$.` });
      // adaptación con un stub en paralelo (en cortocircuito o en abierto)
      const sols = [];
      let ts;
      if (Math.abs(R - Z0) < 1e-9 * Z0) ts = [-X / (2 * Z0), Infinity];
      else { const rad = Math.sqrt(R * ((Z0 - R) ** 2 + X * X) / Z0); ts = [(X + rad) / (R - Z0), (X - rad) / (R - Z0)]; }
      for (const t of ts) {
        const d = t === Infinity ? 0.25 : resto(Math.atan(t) / (2 * PI), 0.5), y = div(cx(1), zEn(r, d)), b = y.im * Z0, Y0 = 1;
        const lcc = resto(Math.atan2(Y0, b) / (2 * PI), 0.5), lab = resto(Math.atan2(-b, Y0) / (2 * PI), 0.5);
        sols.push({ t, d, dm: d * lam, bn: b, gn: y.re * Z0, lcc, lccm: lcc * lam, lab, labm: lab * lam, zp: zEn(r, d) });
      }
      sols.sort((a, b) => a.d - b.d);
      r.stub = sols;
      pasos.push(
        { t: 'Adaptación con un stub en paralelo: dónde ponerlo', html: `Se busca la distancia $d$ a la carga en la que la conductancia normalizada vale 1, $y(d) = 1 + j b$. Con $t = tg(β d)$: $t = {X ± √({R[(Z_0 − R)^2 + X^2]/Z_0})}/{R − Z_0}$` + (ts[1] === Infinity ? ` (como $R = Z_0$ vale $t = −X/(2Z_0)$ y la otra solución es $t → ∞$, $d = λ/4$)` : '') + `. Salen dos soluciones: ` + sols.map((s, i) => `(${i + 1}) $d_${i + 1} = ${f(s.d)} λ = ${f(s.dm)} "m"$, con $y = 1 ${s.bn < 0 ? '−' : '+'} j${f(Math.abs(s.bn))}$`).join('; ') + '.' },
        { t: 'Longitud del stub', html: `El stub tiene que dar la susceptancia opuesta, $−b$. Un stub en cortocircuito tiene $y_s = −j cot(β l_s)$, luego $l_s = λ/{2π} arctg(1/b)$; uno en abierto tiene $y_s = j tg(β l_s)$, luego $l_s = λ/{2π} arctg(−b)$. ` + sols.map((s, i) => `Solución ${i + 1}: en cortocircuito $l_s = ${f(s.lcc)} λ = ${f(s.lccm)} "m"$, en abierto $l_s = ${f(s.lab)} λ = ${f(s.labm)} "m"$`).join('; ') + '.' });
      // transformador λ/4 en un máximo y en un mínimo de tensión
      const zt1 = Z0 * Math.sqrt(roe), zt2 = Z0 / Math.sqrt(roe);
      r.cuarto = { dmax: r.dmax, dmin: r.dmin, Zt1: zt1, Zt2: zt2 };
      pasos.push({ t: 'Adaptación con un transformador λ/4', html: `En un máximo de tensión la impedancia es real, $Z_0 "ROE" = ${f(r.Zmax)} "Ω"$, y un trozo de línea de longitud $λ/4 = ${f(lam / 4)} "m"$ y $Z_T = √(Z_0 · Z_0 "ROE") = Z_0 √("ROE") = ${f(zt1)} "Ω"$ la lleva a $Z_0$. Se coloca a $d_"máx" = ${f(r.dmax)} "m"$ de la carga (o en un mínimo, $d_"mín" = ${f(r.dmin)} "m"$, con $Z_T = Z_0/√("ROE") = ${f(zt2)} "Ω"$).` });
    }
    // perfil de la onda estacionaria normalizado a |V+| = 1
    const dMaxPerf = Math.max(ld, 1), n = 400, perf = [];
    for (let i = 0; i <= n; i++) {
      const d = dMaxPerf * i / n, e = polar(g, th - 4 * PI * d), V = mod(suma(cx(1), e)), I = mod(resta(cx(1), e));
      perf.push([d, V, I]);
    }
    r.perfil = perf; r.dPerfil = dMaxPerf;
    // LT-1: pérdidas
    if (perdidas) {
      const q = conPerdidas(r, alfaDb, Pot); r.perd = q;
      pasos.push({ t: 'Línea con pérdidas', html: `Con $α = ${f(alfaDb)} "dB/m" = ${f(q.alfa)} "Np/m"$ y $β = ${f(beta)} "rad/m"$: $γ = α + j β = ${cmplx(q.gam)} "m"^{−1}$ y, con poca pérdida, $Z_0 ≈ Z_0 (1 − j α/β) = ${cmplx(q.Z0c)} "Ω"$. Atenuación de la línea: $α l = ${f(q.atenDb)} "dB"$.` });
      pasos.push({ t: 'Impedancia y reflexión a la entrada con pérdidas', html: `$Z_"in" = Z_0 {Z_L + Z_0 tgh(γ l)}/{Z_0 + Z_L tgh(γ l)} = ${cmplx(q.zin)} "Ω"$. El coeficiente de reflexión en la carga es $|Γ_L| = ${f(q.gL)}$, y a la entrada $Γ_"in" = Γ_L e^{−2γ l}$ con $|Γ_"in"| = ${f(q.gin)}$, es decir $"ROE"_"in" = ${f(q.roeIn)}$ (la línea «mejora» la ROE vista desde el generador).` });
      if (Pot !== null) pasos.push({ t: 'Potencia que llega a la carga', html: `$P_L = P^+ e^{−2α l}(1 − |Γ_L|^2) = ${f(Pot)} · ${f(q.atenLin)} · ${f(1 - q.gL ** 2)} = ${f(q.PL)} "W"$. Entran en la línea $P_"ent" = P^+ (1 − |Γ_"in"|^2) = ${f(q.Pent)} "W"$ y se disipan $${f(q.Pdisip)} "W"$ en el cable. Pérdida total (entrada a carga): $${f(q.perdidaTotalDb)} "dB"$.` });
      if (alfaDb > 0) pasos.push({ t: 'Longitud máxima útil', html: `Con una pérdida admisible de 3 dB (mitad de la potencia): $l_"máx" = 3/α = ${f(3 / alfaDb)} "m"$.` });
    }
    // LT-2: transitorio con el generador
    if (trans) {
      if (Math.abs(X) > 1e-9) throw new Error('Para el transitorio la carga debe ser resistiva (X = 0)');
      const Vg = lee(sc, 'Vg', 'la tensión del generador Vg'), Rg = lee(sc, 'Rg', 'la resistencia del generador Rg', 0, true), tpn = vacio(sc.tp) ? 0 : lee(sc, 'tp', 'la duración del pulso (ns)') * 1e-9;
      const xp = vacio(sc.xp) ? 0.5 : lee(sc, 'xp', 'la posición del punto (0 a 100 %)', 0, true) / 100;
      if (xp > 1) throw new Error('La posición del punto debe estar entre 0 y 100 % de la línea');
      if (r.l <= 0) throw new Error('Para el transitorio la línea debe tener longitud');
      const q = transitorio(r, Vg, Rg, tpn, xp); r.trans = q;
      pasos.push({ t: 'Transitorio: ondas y reflexiones', html: `Retardo $T = l/v = ${f(q.T * 1e9)} "ns"$. Al cerrar el generador entra una onda $V_1 = V_g {Z_0}/{Z_0 + R_g} = ${f(q.V1)} "V"$. Coeficientes de reflexión: $Γ_L = {R_L − Z_0}/{R_L + Z_0} = ${f(q.GL)}$ en la carga y $Γ_g = {R_g − Z_0}/{R_g + Z_0} = ${f(q.Gg)}$ en el generador.` });
      pasos.push({ t: 'Diagrama de rebotes', html: q.rebotes.slice(0, 5).map((b) => `${b.n}.º frente a $t = ${f(b.t * 1e9)} "ns"$ en ${b.pos > 0 ? 'la carga' : 'el generador'}: $${f(b.v)} "V"$`).join('; ') + `. En la carga la primera tensión es $V_1(1 + Γ_L) = ${f(q.Vcarga1)} "V"$ y el régimen permanente es $V_∞ = V_g R_L/(R_L + R_g) = ${f(q.Vinf)} "V"$.` + (tpn ? ` El pulso dura $${f(tpn * 1e9)} "ns"$: se suma el escalón y el mismo escalón con signo contrario retrasado.` : '') });
    }
    // LT-3: stub en serie, doble stub y comparación de anchos de banda
    if (!r.adaptada) {
      const ss = stubSerie(r), d1 = vacio(sc.d1) ? 0 : lee(sc, 'd1', 'la distancia del primer stub (λ)', 0, true), sep = sc.sep === '3/8' ? 0.375 : 0.125, ds = dobleStub(r, d1, sep);
      r.serie = ss; r.doble = { ...ds, d1, sep };
      if (ss.length) pasos.push({ t: 'Stub en serie', html: `Se busca $d$ donde la parte real de $z(d)$ vale 1, $z = 1 + j x$, y se compensa con un stub en serie de reactancia $−j x$: en cortocircuito $j tg(β l_s) = −j x$, en abierto $−j cot(β l_s) = −j x$. ` + ss.map((q, i) => `Solución ${i + 1}: $d = ${f(q.dm)} "m"$ (${f(q.d)} λ), $x = ${f(q.x)}$, $l_"cc" = ${f(q.lccm)} "m"$, $l_"ab" = ${f(q.labm)} "m"$`).join('; ') + '.' });
      pasos.push({ t: 'Doble stub', html: ds.prohibida ? `Con el primer stub a $${f(d1)} λ$ la conductancia $g = ${f(ds.g1)}$ supera el máximo $1/sen^2(β s) = ${f(ds.gmax)}$ de la zona prohibida: el doble stub no puede adaptar. Cambia la distancia del primer stub.` : `Dos stubs en paralelo en cortocircuito separados $s = ${f(sep)} λ$, el primero a $${f(d1)} λ$ de la carga. Hace falta $g ≤ 1/sen^2(β s) = ${f(ds.gmax)}$ (aquí $g = ${f(ds.g1)}$). El primer stub da $b_1$ para que, al pasar al segundo plano, $g = 1$: $B = {1 ± √(g(1 + t^2) − t^2 g^2)}/t$ con $t = tg(β s)$; el segundo cancela la susceptancia que queda. ` + ds.sols.map((q, i) => `Solución ${i + 1}: $b_1 = ${f(q.b1)}$ ($l_1 = ${f(q.l1m)} "m"$) y $b_2 = ${f(q.b2)}$ ($l_2 = ${f(q.l2m)} "m"$)`).join('; ') + '.' });
      const st = r.stub[0], se = ss[0], d0 = ds.prohibida ? null : { d1, sep, l1: ds.sols[0].l1, l2: ds.sols[0].l2 }, cu = { d: r.dmaxL, Zt: r.cuarto.Zt1 };
      const rd = redes(r, st, se, d0, cu), bw = {};
      for (const [k, fun] of Object.entries(rd)) { const b = anchoBanda(fun); bw[k] = { ...b, G0: fun(1) }; }
      r.redes = rd; r.bw = bw;
      const nom = { stub: 'stub en paralelo', serie: 'stub en serie', doble: 'doble stub', cuarto: 'transformador λ/4' };
      pasos.push({ t: 'Comparación del ancho de banda', html: `Con las longitudes físicas fijas, al cambiar la frecuencia la adaptación se pierde. Ancho de banda con $"ROE" ≤ 2$ (fracción de $f_0$): ` + Object.entries(bw).map(([k, b]) => `${nom[k]} $${f(100 * b.bw, 3)} %$`).join('; ') + '. El stub y el transformador λ/4 suelen ser los más anchos; el doble stub, el más estrecho.' });
    }
    r.pasos = pasos;
    return r;
  }

  const ejemplos = [
    { clave: 'compleja', nombre: 'Carga 25 + j25 Ω en una línea de 50 Ω, 100 MHz', sc: { Z0: '50', R: '25', X: '25', f: '100', er: '1', l: '0,6', lu: 'm' } },
    { clave: 'cortocircuito', nombre: 'Casi un cortocircuito (R = 1 Ω): ondas estacionarias casi totales', sc: { Z0: '50', R: '1', X: '0', f: '300', er: '1', l: '0,125', lu: 'lam' } },
    { clave: 'resistiva', nombre: 'Carga resistiva de 100 Ω en una línea de 50 Ω (ROE = 2)', sc: { Z0: '50', R: '100', X: '0', f: '500', er: '1', l: '0,25', lu: 'lam' } },
    { clave: 'antena', nombre: 'Antena de 73 + j42,5 Ω y cable coaxial de 75 Ω (εr = 2,25)', sc: { Z0: '75', R: '73', X: '42,5', f: '150', er: '2,25', l: '3', lu: 'm' } },
    { clave: 'adaptada', nombre: 'Carga adaptada (ROE = 1)', sc: { Z0: '50', R: '50', X: '0', f: '100', er: '1', l: '1', lu: 'm' } },
    { clave: 'coaxial-perdidas', nombre: 'Cable coaxial con pérdidas: 0,1 dB/m, 50 m, antena 75 Ω, 1 kW (LT-1)', sc: { Z0: '50', R: '75', X: '0', f: '100', er: '2,25', l: '50', lu: 'm', alfa: '0,1', P: '1000' } },
    { clave: 'escalon', nombre: 'Escalón de 10 V con Rg = 25 Ω sobre línea de 50 Ω y carga abierta (rebotes)', sc: { Z0: '50', R: '1e9', X: '0', f: '100', er: '1', l: '30', lu: 'm', Vg: '10', Rg: '25', tp: '', xp: '50' } },
    { clave: 'pulso', nombre: 'Pulso de 50 ns de 5 V en una línea de 100 ns, carga de 150 Ω', sc: { Z0: '50', R: '150', X: '0', f: '100', er: '1', l: '20', lu: 'm', Vg: '5', Rg: '50', tp: '50', xp: '100' } },
  ];

  return { resolver, ejemplos, zEn, zEnK, f, gamma, conPerdidas, transitorio, stubSerie, dobleStub, redes, anchoBanda };
})();
if (typeof module !== 'undefined') module.exports = LineasTransmision;
