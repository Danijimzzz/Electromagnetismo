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
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, min = 0, incl = false) {
    if (vacio(sc[k])) throw new Error(`${nom} fehlt`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (incl ? v < min : v <= min) throw new Error(`${may(nom)} muss ${incl ? 'mindestens' : 'größer als'} ${f(min)} sein`);
    return v;
  }
  const leeX = (sc, k, nom) => { // reactancia: vacía vale 0, puede ser negativa
    if (vacio(sc[k])) return 0;
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    return v;
  };

  const cx = (re, im = 0) => ({ re, im });
  const suma = (a, b) => cx(a.re + b.re, a.im + b.im), resta = (a, b) => cx(a.re - b.re, a.im - b.im);
  const mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const mod = (a) => Math.hypot(a.re, a.im), arg = (a) => Math.atan2(a.im, a.re);
  const polar = (m, t) => cx(m * Math.cos(t), m * Math.sin(t));
  const gamma = (z, z0) => div(resta(z, cx(z0)), suma(z, cx(z0)));
  const cmplx = (a) => `${f(a.re)} ${a.im < 0 ? '−' : '+'} j${f(Math.abs(a.im))}`;
  const resto = (x, p) => ((x % p) + p) % p;

  function zEn(r, d) {
    const th = 2 * PI * d, c = Math.cos(th), s = Math.sin(th), zl = cx(r.R, r.X), z0 = cx(r.Z0);
    return mul(z0, div(suma(mul(zl, cx(c)), mul(cx(0, 1), mul(z0, cx(s)))), suma(mul(z0, cx(c)), mul(cx(0, 1), mul(zl, cx(s))))));
  }


  const cexp = (a) => polar(Math.exp(a.re), a.im);
  const ctanh = (z) => { const e = cexp(cx(2 * z.re, 2 * z.im)); return div(resta(e, cx(1)), suma(e, cx(1))); };
  function conPerdidas(r, alfaDb, P) {
    const alfa = alfaDb / 8.685889638, beta = r.beta, gam = cx(alfa, beta), Z0c = cx(r.Z0, -r.Z0 * alfa / beta), zl = cx(r.R, r.X);
    const GL = div(resta(zl, Z0c), suma(zl, Z0c)), t = ctanh(cx(alfa * r.l, beta * r.l));
    const zin = mul(Z0c, div(suma(zl, mul(Z0c, t)), suma(Z0c, mul(zl, t)))), Gin = mul(GL, cexp(cx(-2 * alfa * r.l, -2 * beta * r.l))), gi = mod(Gin);
    const atenDb = alfaDb * r.l, atenLin = Math.exp(-2 * alfa * r.l), gL = mod(GL);
    const out = { alfa, alfaDb, gam, Z0c, GL, zin, Gin, gin: gi, roeIn: (1 + gi) / (1 - gi), atenDb, atenLin, gL, perdidaTotalDb: -10 * Math.log10(atenLin * (1 - gL * gL) / (1 - gi * gi)) };
    if (P !== null) {
      out.P = P; out.Pinc = P; out.PL = P * atenLin * (1 - gL * gL); out.Pent = P * (1 - gi * gi); out.Pdisip = out.Pent - out.PL;
    }
    out.lmaxUtil3 = alfaDb > 0 ? 3 / alfaDb : Infinity;
    return out;
  }

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

  const zEnK = (r, d, k) => { // impedancia normalizada a la distancia d (en λ) de la carga cuando la frecuencia es k·f₀
    const th = 2 * PI * d * k, c = Math.cos(th), sn = Math.sin(th), zl = cx(r.R / r.Z0, r.X / r.Z0), j = cx(0, 1);
    return div(suma(mul(zl, cx(c)), mul(j, cx(sn))), suma(cx(c), mul(mul(j, zl), cx(sn))));
  };
  const gamN = (z) => div(resta(z, cx(1)), suma(z, cx(1)));
  const cotg = (th) => Math.cos(th) / Math.sin(th);
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
  function anchoBanda(fun, roeMax = 2) {
    const gmax = (roeMax - 1) / (roeMax + 1); let lo = 1, hi = 1;
    while (lo > 0.3 && fun(lo - 0.0005) <= gmax) lo -= 0.0005;
    while (hi < 1.7 && fun(hi + 0.0005) <= gmax) hi += 0.0005;
    return { lo, hi, bw: hi - lo };
  }

  function resolver(sc) {
    const Z0 = lee(sc, 'Z0', 'den Wellenwiderstand Z₀'), R = lee(sc, 'R', 'den Lastwiderstand R'), X = leeX(sc, 'X', 'die Lastreaktanz X');
    const F = lee(sc, 'f', 'die Frequenz') * 1e6, er = lee(sc, 'er', 'εr'), lu = sc.lu === 'lam' ? 'lam' : 'm', L = lee(sc, 'l', 'die Länge der Leitung', 0, true);
    const v = C0 / Math.sqrt(er), lam = v / F, beta = 2 * PI / lam, ld = lu === 'lam' ? L : L / lam, lm = ld * lam;
    const r = { Z0, R, X, F, er, v, lam, beta, l: lm, ld, lu };
    const alfaDb = vacio(sc.alfa) ? 0 : lee(sc, 'alfa', 'die Dämpfung α (dB/m)', 0, true), Pot = vacio(sc.P) ? null : lee(sc, 'P', 'die einfallende Leistung'), perdidas = alfaDb > 0 || Pot !== null;
    const trans = !vacio(sc.Vg);
    const zl = cx(R, X), G = gamma(zl, Z0), g = mod(G), th = arg(G);
    const roe = (1 + g) / (1 - g), rl = g < 1e-12 ? Infinity : -20 * Math.log10(g), desad = -10 * Math.log10(1 - g * g);
    Object.assign(r, { G, g, th, roe, rl, desad, pRef: g * g * 100, adaptada: g < 1e-9 });
    const grados = th * 180 / PI;
    const pasos = [
      { t: 'Daten', html: `$Z_0 = ${f(Z0)} "Ω"$, $Z_L = ${cmplx(zl)} "Ω"$, $f = ${f(F / 1e6)} "MHz"$, $ε_r = ${f(er)}$, $l = ${f(lm)} "m"$.` },
      { t: 'Geschwindigkeit, Wellenlänge und Phasenkonstante', html: `$v = c/√(ε_r) = ${f(v)} "m/s"$, $λ = v/f = ${f(lam)} "m"$, $β = {2π}/λ = ${f(beta)} "rad/m"$. Die Leitung hat $l/λ = ${f(ld)}$.` },
      { t: 'Reflexionskoeffizient an der Last', html: `$Γ_L = {Z_L − Z_0}/{Z_L + Z_0} = {${cmplx(resta(zl, cx(Z0)))}}/{${cmplx(suma(zl, cx(Z0)))}} = ${cmplx(G)}$, also $|Γ_L| = ${f(g)}$ und $θ = ${f(grados)}°$.` },
      { t: 'Stehwellenverhältnis und Verluste', html: `$"SWR" = {1 + |Γ|}/{1 − |Γ|} = ${f(roe)}$. Rückflussdämpfung $"RL" = −20 log |Γ| = ${f(rl)} "dB"$; es werden $|Γ|^2 = ${f(r.pRef)} %$ der Leistung reflektiert, und der Fehlanpassungsverlust beträgt $−10 log(1 − |Γ|^2) = ${f(desad)} "dB"$.` },
    ];
    const zin = zEn(r, ld), Gin = polar(g, th - 4 * PI * ld);
    r.zin = zin; r.Gin = Gin; r.yin = div(cx(1), zin);
    pasos.push({ t: 'Eingangsimpedanz', html: `$Z_"in" = Z_0 {Z_L + j Z_0 tan(β l)}/{Z_0 + j Z_L tan(β l)}$ mit $β l = ${f(beta * lm * 180 / PI)}°$: $Z_"in" = ${cmplx(zin)} "Ω"$. Der Reflexionskoeffizient am Eingang ist $Γ_"in" = Γ_L e^{−j 2 β l}$ mit dem Betrag $${f(g)}$ und der Phase $${f(arg(Gin) * 180 / PI)}°$.` });
    if (r.adaptada) {
      r.dmax = null; r.stub = null; r.cuarto = null;
      pasos.push({ t: 'Angepasste Last', html: `$Z_L = Z_0$, also $Γ = 0$ und $"SWR" = 1$: Es gibt weder eine reflektierte Welle noch stehende Wellen, und die Impedanz beträgt auf der ganzen Leitung $Z_0$. Eine Anpassung ist nicht nötig.` });
    } else {
      const t2 = resto(th, 2 * PI), dmax = t2 / (4 * PI), dmin = resto(dmax + 0.25, 0.5);
      r.dmax = dmax * lam; r.dmin = dmin * lam; r.dmaxL = dmax; r.dminL = dmin;
      r.Zmax = Z0 * roe; r.Zmin = Z0 / roe;
      pasos.push({ t: 'Spannungsmaxima und -minima', html: `Das erste Maximum von $|V|$ liegt dort, wo $θ − 2β d = 0$: $d_"max" = {θ λ}/{4π} = ${f(dmax)} λ = ${f(r.dmax)} "m"$ von der Last, und das erste Minimum $λ/4$ weiter: $d_"min" = ${f(dmin)} λ = ${f(r.dmin)} "m"$ (Wiederholung alle $λ/2$). Die Spannung schwankt zwischen $V_"max" = (1 + |Γ|)|V^+| = ${f(1 + g)} |V^+|$ und $V_"min" = (1 − |Γ|)|V^+| = ${f(1 - g)} |V^+|$. Im Maximum ist die Impedanz reell, $Z_0 "SWR" = ${f(r.Zmax)} "Ω"$, und im Minimum $Z_0/"SWR" = ${f(r.Zmin)} "Ω"$.` });
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
        { t: 'Anpassung mit einem parallelen Stub: wo man ihn anbringt', html: `Man sucht den Abstand $d$ zur Last, bei dem der normierte Leitwert 1 beträgt, $y(d) = 1 + j b$. Mit $t = tan(β d)$: $t = {X ± √({R[(Z_0 − R)^2 + X^2]/Z_0})}/{R − Z_0}$` + (ts[1] === Infinity ? ` (da $R = Z_0$, ist $t = −X/(2Z_0)$, und die andere Lösung ist $t → ∞$, $d = λ/4$)` : '') + `. Salen dos soluciones: ` + sols.map((s, i) => `(${i + 1}) $d_${i + 1} = ${f(s.d)} λ = ${f(s.dm)} "m"$, mit $y = 1 ${s.bn < 0 ? '−' : '+'} j${f(Math.abs(s.bn))}$`).join('; ') + '.' },
        { t: 'Länge des Stubs', html: `Der Stub muss die entgegengesetzte Suszeptanz, $−b$, liefern. Ein kurzgeschlossener Stub hat $y_s = −j cot(β l_s)$, also $l_s = λ/{2π} arctan(1/b)$; ein offener hat $y_s = j tan(β l_s)$, also $l_s = λ/{2π} arctan(−b)$. ` + sols.map((s, i) => `Lösung ${i + 1}: kurzgeschlossen $l_s = ${f(s.lcc)} λ = ${f(s.lccm)} "m"$, offen $l_s = ${f(s.lab)} λ = ${f(s.labm)} "m"$`).join('; ') + '.' });
      const zt1 = Z0 * Math.sqrt(roe), zt2 = Z0 / Math.sqrt(roe);
      r.cuarto = { dmax: r.dmax, dmin: r.dmin, Zt1: zt1, Zt2: zt2 };
      pasos.push({ t: 'Anpassung mit einem λ/4-Transformator', html: `Bei einem Spannungsmaximum ist die Impedanz reell, $Z_0 "SWR" = ${f(r.Zmax)} "Ω"$, und ein Leitungsstück der Länge $λ/4 = ${f(lam / 4)} "m"$ mit $Z_T = √(Z_0 · Z_0 "SWR") = Z_0 √("SWR") = ${f(zt1)} "Ω"$ bringt sie auf $Z_0$. Es wird bei $d_"max" = ${f(r.dmax)} "m"$ von der Last angebracht (oder bei einem Minimum, $d_"min" = ${f(r.dmin)} "m"$, mit $Z_T = Z_0/√("SWR") = ${f(zt2)} "Ω"$).` });
    }
    const dMaxPerf = Math.max(ld, 1), n = 400, perf = [];
    for (let i = 0; i <= n; i++) {
      const d = dMaxPerf * i / n, e = polar(g, th - 4 * PI * d), V = mod(suma(cx(1), e)), I = mod(resta(cx(1), e));
      perf.push([d, V, I]);
    }
    r.perfil = perf; r.dPerfil = dMaxPerf;
    if (perdidas) {
      const q = conPerdidas(r, alfaDb, Pot); r.perd = q;
      pasos.push({ t: 'Verlustbehaftete Leitung', html: `Mit $α = ${f(alfaDb)} "dB/m" = ${f(q.alfa)} "Np/m"$ und $β = ${f(beta)} "rad/m"$: $γ = α + j β = ${cmplx(q.gam)} "m"^{−1}$ und bei geringen Verlusten $Z_0 ≈ Z_0 (1 − j α/β) = ${cmplx(q.Z0c)} "Ω"$. Dämpfung der Leitung: $α l = ${f(q.atenDb)} "dB"$.` });
      pasos.push({ t: 'Eingangsimpedanz und Reflexion mit Verlusten', html: `$Z_"in" = Z_0 {Z_L + Z_0 tanh(γ l)}/{Z_0 + Z_L tanh(γ l)} = ${cmplx(q.zin)} "Ω"$. Der Reflexionskoeffizient an der Last ist $|Γ_L| = ${f(q.gL)}$ und am Eingang $Γ_"in" = Γ_L e^{−2γ l}$ mit $|Γ_"in"| = ${f(q.gin)}$, also $"SWR"_"in" = ${f(q.roeIn)}$ (die Leitung „verbessert“ das SWR, vom Generator aus gesehen).` });
      if (Pot !== null) pasos.push({ t: 'Leistung, die die Last erreicht', html: `$P_L = P^+ e^{−2α l}(1 − |Γ_L|^2) = ${f(Pot)} · ${f(q.atenLin)} · ${f(1 - q.gL ** 2)} = ${f(q.PL)} "W"$. In die Leitung gehen $P_"ent" = P^+ (1 − |Γ_"in"|^2) = ${f(q.Pent)} "W"$ hinein, und $${f(q.Pdisip)} "W"$ werden im Kabel dissipiert. Gesamtverlust (Eingang bis Last): $${f(q.perdidaTotalDb)} "dB"$.` });
      if (alfaDb > 0) pasos.push({ t: 'Maximale nutzbare Länge', html: `Bei einem zulässigen Verlust von 3 dB (halbe Leistung): $l_"max" = 3/α = ${f(3 / alfaDb)} "m"$.` });
    }
    if (trans) {
      if (Math.abs(X) > 1e-9) throw new Error('Für den Einschwingvorgang muss die Last ohmsch sein (X = 0)');
      const Vg = lee(sc, 'Vg', 'die Generatorspannung Vg'), Rg = lee(sc, 'Rg', 'den Generatorwiderstand Rg', 0, true), tpn = vacio(sc.tp) ? 0 : lee(sc, 'tp', 'die Dauer des Pulses (ns)') * 1e-9;
      const xp = vacio(sc.xp) ? 0.5 : lee(sc, 'xp', 'die Position des Punktes (0 bis 100 %)', 0, true) / 100;
      if (xp > 1) throw new Error('Die Position des Punktes muss zwischen 0 und 100 % der Leitung liegen');
      if (r.l <= 0) throw new Error('Für den Einschwingvorgang muss die Leitung eine Länge haben');
      const q = transitorio(r, Vg, Rg, tpn, xp); r.trans = q;
      pasos.push({ t: 'Einschwingvorgang: Wellen und Reflexionen', html: `Laufzeit $T = l/v = ${f(q.T * 1e9)} "ns"$. Beim Schließen des Generators läuft eine Welle $V_1 = V_g {Z_0}/{Z_0 + R_g} = ${f(q.V1)} "V"$ ein. Reflexionskoeffizienten: $Γ_L = {R_L − Z_0}/{R_L + Z_0} = ${f(q.GL)}$ an der Last und $Γ_g = {R_g − Z_0}/{R_g + Z_0} = ${f(q.Gg)}$ am Generator.` });
      pasos.push({ t: 'Reflexionsdiagramm', html: q.rebotes.slice(0, 5).map((b) => `${b.n}. Front bei $t = ${f(b.t * 1e9)} "ns"$ an ${b.pos > 0 ? 'der Last' : 'dem Generator'}: $${f(b.v)} "V"$`).join('; ') + `. An der Last beträgt die erste Spannung $V_1(1 + Γ_L) = ${f(q.Vcarga1)} "V"$ und der stationäre Zustand $V_∞ = V_g R_L/(R_L + R_g) = ${f(q.Vinf)} "V"$.` + (tpn ? ` Der Puls dauert $${f(tpn * 1e9)} "ns"$: Man addiert den Sprung und denselben Sprung mit entgegengesetztem Vorzeichen, verzögert.` : '') });
    }
    if (!r.adaptada) {
      const ss = stubSerie(r), d1 = vacio(sc.d1) ? 0 : lee(sc, 'd1', 'den Abstand des ersten Stubs (λ)', 0, true), sep = sc.sep === '3/8' ? 0.375 : 0.125, ds = dobleStub(r, d1, sep);
      r.serie = ss; r.doble = { ...ds, d1, sep };
      if (ss.length) pasos.push({ t: 'Serienstub', html: `Man sucht $d$, wo der Realteil von $z(d)$ gleich 1 ist, $z = 1 + j x$, und kompensiert ihn mit einem Serienstub der Reaktanz $−j x$: kurzgeschlossen $j tan(β l_s) = −j x$, offen $−j cot(β l_s) = −j x$. ` + ss.map((q, i) => `Lösung ${i + 1}: $d = ${f(q.dm)} "m"$ (${f(q.d)} λ), $x = ${f(q.x)}$, $l_"ks" = ${f(q.lccm)} "m"$, $l_"off" = ${f(q.labm)} "m"$`).join('; ') + '.' });
      pasos.push({ t: 'Doppelstub', html: ds.prohibida ? `Beim ersten Stub bei $${f(d1)} λ$ überschreitet der Leitwert $g = ${f(ds.g1)}$ das Maximum $1/sin^2(β s) = ${f(ds.gmax)}$ des verbotenen Bereichs: Der Doppelstub kann nicht anpassen. Ändere den Abstand des ersten Stubs.` : `Zwei parallele kurzgeschlossene Stubs im Abstand $s = ${f(sep)} λ$, der erste bei $${f(d1)} λ$ von der Last. Es muss $g ≤ 1/sin^2(β s) = ${f(ds.gmax)}$ gelten (hier $g = ${f(ds.g1)}$). Der erste Stub liefert $b_1$, sodass beim Übergang zur zweiten Ebene $g = 1$: $B = {1 ± √(g(1 + t^2) − t^2 g^2)}/t$ mit $t = tan(β s)$; der zweite hebt die verbleibende Suszeptanz auf. ` + ds.sols.map((q, i) => `Lösung ${i + 1}: $b_1 = ${f(q.b1)}$ ($l_1 = ${f(q.l1m)} "m"$) und $b_2 = ${f(q.b2)}$ ($l_2 = ${f(q.l2m)} "m"$)`).join('; ') + '.' });
      const st = r.stub[0], se = ss[0], d0 = ds.prohibida ? null : { d1, sep, l1: ds.sols[0].l1, l2: ds.sols[0].l2 }, cu = { d: r.dmaxL, Zt: r.cuarto.Zt1 };
      const rd = redes(r, st, se, d0, cu), bw = {};
      for (const [k, fun] of Object.entries(rd)) { const b = anchoBanda(fun); bw[k] = { ...b, G0: fun(1) }; }
      r.redes = rd; r.bw = bw;
      const nom = { stub: 'Parallelstub', serie: 'Serienstub', doble: 'doble stub', cuarto: 'transformador λ/4' };
      pasos.push({ t: 'Vergleich der Bandbreite', html: `Bei festen physikalischen Längen geht die Anpassung verloren, wenn sich die Frequenz ändert. Bandbreite mit $"SWR" ≤ 2$ (Bruchteil von $f_0$): ` + Object.entries(bw).map(([k, b]) => `${nom[k]} $${f(100 * b.bw, 3)} %$`).join('; ') + '. Der Stub und der λ/4-Transformator sind meist am breitesten; der Doppelstub am schmalsten.' });
    }
    r.pasos = pasos;
    return r;
  }

  const ejemplos = [
    { clave: 'compleja', nombre: 'Last 25 + j25 Ω an einer 50-Ω-Leitung, 100 MHz', sc: { Z0: '50', R: '25', X: '25', f: '100', er: '1', l: '0,6', lu: 'm' } },
    { clave: 'cortocircuito', nombre: 'Fast ein Kurzschluss (R = 1 Ω): nahezu vollständige stehende Wellen', sc: { Z0: '50', R: '1', X: '0', f: '300', er: '1', l: '0,125', lu: 'lam' } },
    { clave: 'resistiva', nombre: 'Ohmsche Last von 100 Ω an einer 50-Ω-Leitung (SWR = 2)', sc: { Z0: '50', R: '100', X: '0', f: '500', er: '1', l: '0,25', lu: 'lam' } },
    { clave: 'antena', nombre: 'Antenne mit 73 + j42,5 Ω und 75-Ω-Koaxialkabel (εr = 2,25)', sc: { Z0: '75', R: '73', X: '42,5', f: '150', er: '2,25', l: '3', lu: 'm' } },
    { clave: 'adaptada', nombre: 'Angepasste Last (SWR = 1)', sc: { Z0: '50', R: '50', X: '0', f: '100', er: '1', l: '1', lu: 'm' } },
    { clave: 'coaxial-perdidas', nombre: 'Verlustbehaftetes Koaxialkabel: 0,1 dB/m, 50 m, Antenne 75 Ω, 1 kW (LT-1)', sc: { Z0: '50', R: '75', X: '0', f: '100', er: '2,25', l: '50', lu: 'm', alfa: '0,1', P: '1000' } },
    { clave: 'escalon', nombre: 'Sprung von 10 V mit Rg = 25 Ω auf einer 50-Ω-Leitung mit offener Last (Reflexionen)', sc: { Z0: '50', R: '1e9', X: '0', f: '100', er: '1', l: '30', lu: 'm', Vg: '10', Rg: '25', tp: '', xp: '50' } },
    { clave: 'pulso', nombre: 'Puls von 50 ns und 5 V auf einer 100-ns-Leitung, Last 150 Ω', sc: { Z0: '50', R: '150', X: '0', f: '100', er: '1', l: '20', lu: 'm', Vg: '5', Rg: '50', tp: '50', xp: '100' } },
  ];


  const ETA0 = 376.730313668;
  function z0Geometria(g) {
    const num = (k, nom) => { const v = leeNum(g[k]); if (!(v > 0) || !isFinite(v)) throw new Error(`${nom} muss eine Zahl größer als 0 sein`); return v; };
    const er = vacio(g.er) ? 1 : num('er', 'Das Dielektrikum εr');
    if (er < 1) throw new Error('Das Dielektrikum εr muss mindestens 1 sein');
    if (g.geo === 'coaxial') {
      const a = num('a', 'Der Radius des Innenleiters a'), b = num('b', 'Der Innenradius des Geflechts b');
      if (!(b > a)) throw new Error('Der Radius b muss größer als a sein');
      const Z0 = (ETA0 / (2 * PI * Math.sqrt(er))) * Math.log(b / a);
      return { Z0, er, erEf: er, f: `Z_0 = {η_0}/{2π √ε_r} ln(b/a) = {60 ln(b/a)}/{√ε_r}`, pasos: `Koaxial: $Z_0 = {η_0}/{2π √ε_r} ln(b/a) = ${f(ETA0 / (2 * PI))}/${f(Math.sqrt(er))} · ln(${f(b / a)})$ = <b>${f(Z0)} Ω</b>` };
    }
    if (g.geo === 'bifilar') {
      const a = num('a', 'Der Radius der Drähte a'), D = num('D', 'Der Achsabstand D');
      if (!(D > 2 * a)) throw new Error('Der Achsabstand D muss größer als 2a sein');
      const Z0 = (ETA0 / (PI * Math.sqrt(er))) * Math.acosh(D / (2 * a));
      return { Z0, er, erEf: er, f: `Z_0 = {η_0}/{π √ε_r} arccosh(D/(2a))`, pasos: `Doppelleitung: $Z_0 = {η_0}/{π √ε_r} arcosh({D}/{2a}) = ${f(ETA0 / PI)}/${f(Math.sqrt(er))} · arcosh(${f(D / (2 * a))})$ = <b>${f(Z0)} Ω</b> (mit D ≫ a, ≈ 120 ln(D/a)/√ε_r)` };
    }
    if (g.geo === 'microstrip') {
      const w = num('w', 'Die Breite der Leiterbahn w'), h = num('h', 'Die Höhe des Substrats h'), u = w / h;
      const erEf = (er + 1) / 2 + ((er - 1) / 2) / Math.sqrt(1 + 12 / u);
      const Z0 = u <= 1 ? (60 / Math.sqrt(erEf)) * Math.log(8 / u + u / 4) : (ETA0 / Math.sqrt(erEf)) / (u + 1.393 + 0.667 * Math.log(u + 1.444));
      return { Z0, er, erEf, f: `ε_ef = {ε_r + 1}/2 + {ε_r − 1}/2 · 1/√{1 + 12h/w}`, pasos: `Mikrostreifenleitung (Hammerstad), w/h = ${f(u)}: $ε_{ef} = {ε_r + 1}/2 + {ε_r − 1}/2 · 1/√{1 + 12 h/w}$ = ${f(erEf)}; ${u <= 1 ? '$Z_0 = {60}/{√ε_{ef}} ln(8h/w + w/(4h))$' : '$Z_0 = {η_0}/{√ε_{ef} (w/h + 1,393 + 0,667 ln(w/h + 1,444))}$'} = <b>${f(Z0)} Ω</b>. Die Phasengeschwindigkeit verwendet ε<sub>ef</sub>, nicht ε<sub>r</sub>.` };
    }
    throw new Error('Wähle Koaxial, Doppelleitung oder Mikrostreifenleitung');
  }

  return { z0Geometria, resolver, ejemplos, zEn, zEnK, f, gamma, conPerdidas, transitorio, stubSerie, dobleStub, redes, anchoBanda };
})();

