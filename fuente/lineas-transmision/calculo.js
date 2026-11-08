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
  const C0 = 299792458, PI = Math.PI;
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

  function resolver(sc) {
    const Z0 = lee(sc, 'Z0', 'la impedancia característica Z₀'), R = lee(sc, 'R', 'la resistencia de la carga R'), X = leeX(sc, 'X', 'la reactancia de la carga X');
    const F = lee(sc, 'f', 'la frecuencia') * 1e6, er = lee(sc, 'er', 'εr'), lu = sc.lu === 'lam' ? 'lam' : 'm', L = lee(sc, 'l', 'la longitud de la línea', 0, true);
    const v = C0 / Math.sqrt(er), lam = v / F, beta = 2 * PI / lam, ld = lu === 'lam' ? L : L / lam, lm = ld * lam;
    const r = { Z0, R, X, F, er, v, lam, beta, l: lm, ld, lu };
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
    r.pasos = pasos;
    return r;
  }

  const ejemplos = [
    { clave: 'compleja', nombre: 'Carga 25 + j25 Ω en una línea de 50 Ω, 100 MHz', sc: { Z0: '50', R: '25', X: '25', f: '100', er: '1', l: '0,6', lu: 'm' } },
    { clave: 'cortocircuito', nombre: 'Casi un cortocircuito (R = 1 Ω): ondas estacionarias casi totales', sc: { Z0: '50', R: '1', X: '0', f: '300', er: '1', l: '0,125', lu: 'lam' } },
    { clave: 'resistiva', nombre: 'Carga resistiva de 100 Ω en una línea de 50 Ω (ROE = 2)', sc: { Z0: '50', R: '100', X: '0', f: '500', er: '1', l: '0,25', lu: 'lam' } },
    { clave: 'antena', nombre: 'Antena de 73 + j42,5 Ω y cable coaxial de 75 Ω (εr = 2,25)', sc: { Z0: '75', R: '73', X: '42,5', f: '150', er: '2,25', l: '3', lu: 'm' } },
    { clave: 'adaptada', nombre: 'Carga adaptada (ROE = 1)', sc: { Z0: '50', R: '50', X: '0', f: '100', er: '1', l: '1', lu: 'm' } },
  ];

  return { resolver, ejemplos, zEn, f, gamma };
})();
if (typeof module !== 'undefined') module.exports = LineasTransmision;
