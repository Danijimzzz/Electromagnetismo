/* =====================================================================
   Antena dipolo y radiación: cálculo (sin DOM). Interfaz en app.js, página en
   pagina.html y prueba en pruebas/herramientas/antena.js.
   Campo lejano de un dipolo con la corriente I0 (amplitud):
     corto (Hertz, corriente uniforme): F(θ) = π (L/λ) sin θ
     longitud L (onda de corriente senoidal I0 sen k(L/2 − |z|)):
       F(θ) = [cos(kL/2 cos θ) − cos(kL/2)] / sin θ     (media onda: L = λ/2)
   y |E| = η0 I0 F(θ) / (2π r). La potencia radiada, la resistencia de radiación
   y la directividad salen de integrar F² sin θ (Simpson) con η0 = 376,73 Ω.
   Array de N dipolos iguales (eje z), en fila sobre el eje x con separación d y fase progresiva β:
     F_total(θ, φ) = F(θ) · |AF(ψ)|,  AF = sin(Nψ/2) / (N sin(ψ/2)),  ψ = k d sin θ cos φ + β
   (broadside: β = 0; endfire: β = −k d). La directividad se integra sobre toda la esfera y, sin
   acoplamiento mutuo, la potencia radiada es N veces la de uno. Enlace de Friis entre dos antenas:
     P_r = P_t G_t G_r (λ / 4π d)²,  alcance = (λ / 4π) √(P_t G_t G_r / P_sens)
     resolver(sc)  { tipo, f, L, I, r, th, N, d, modo, beta, Pt, Gr, dist, sens } (texto) → resultados y pasos
     ejemplos      para el desplegable, Mis ejercicios y las pruebas
     patron(tipo, lam, L, th)  F(θ) para dibujar el diagrama
   ===================================================================== */
const Antena = (() => {
  const C0 = 299792458, ETA = 376.730313668;
  const f = (x, d = 4) => {
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
  function lee(sc, k, nom, { pos = true, max } = {}) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (pos && v <= 0) throw new Error(`${may(nom)} debe ser mayor que 0`);
    if (max !== undefined && v > max) throw new Error(`${may(nom)} debe ser como mucho ${max}`);
    return v;
  }

  // F(θ), θ en radianes, desde el eje de la antena
  function patron(tipo, lam, L, th) {
    const s = Math.sin(th);
    if (Math.abs(s) < 1e-9) return 0;
    if (tipo === 'corto') return Math.PI * (L / lam) * s;
    const kl = (Math.PI * L) / lam;
    return Math.abs((Math.cos(kl * Math.cos(th)) - Math.cos(kl)) / s);
  }
  // ∫0^π F² sin θ dθ por Simpson
  function integral(tipo, lam, L, n = 2000) {
    const h = Math.PI / n; let t = 0;
    for (let i = 0; i <= n; i++) { const th = i * h, F = patron(tipo, lam, L, th), w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; t += w * F * F * Math.sin(th); }
    return (t * h) / 3;
  }

  // ---- array de N dipolos en fila (eje x), cada uno paralelo al eje z ----
  const arrayAF = (N, psi) => { const s = Math.sin(psi / 2); return Math.abs(s) < 1e-9 ? 1 : Math.abs(Math.sin((N * psi) / 2) / (N * s)); };
  const psiDe = (P, th, ph) => (2 * Math.PI * P.d) * Math.sin(th) * Math.cos(ph) + P.beta;
  // |E| relativo (sin constantes) en la dirección (θ, φ): elemento × factor de array
  const campoRel = (P, th, ph) => patron(P.tipo, P.lam, P.L, th) * (P.N > 1 ? arrayAF(P.N, psiDe(P, th, ph)) : 1);
  // dirección del plano de corte: 'E' = plano xz (contiene al dipolo), 'H' = plano xy; α de 0 a 2π
  const dirCorte = (plano, a) => (plano === 'H' ? [Math.PI / 2, a] : a <= Math.PI ? [a, 0] : [2 * Math.PI - a, Math.PI]);
  function corte(P, plano, n = 720) {
    const v = []; for (let i = 0; i < n; i++) { const [th, ph] = dirCorte(plano, (2 * Math.PI * i) / n); v.push(campoRel(P, th, ph)); }
    return v;
  }
  // lóbulos de un corte circular: principales (≥ 99,9 % del máximo), secundarios, nivel del mayor secundario y ancho de haz a −3 dB
  function lobulos(v) {
    const n = v.length, mx = Math.max(...v);
    if (mx <= 0) return { omni: false, principales: 0, secundarios: 0, sll: -Infinity, hpbw: 0, max: 0 };
    if (Math.min(...v) / mx > 0.999) return { omni: true, principales: 0, secundarios: 0, sll: -Infinity, hpbw: 360, max: mx };
    const lob = []; for (let i = 0; i < n; i++) { const a = v[(i + n - 1) % n], b = v[i], c = v[(i + 1) % n]; if (b > 1e-6 * mx && b >= a && b > c) lob.push(i); }
    const prin = lob.filter((i) => v[i] >= 0.999 * mx), sec = lob.filter((i) => v[i] < 0.999 * mx);
    const imax = v.indexOf(mx), umbral = mx / Math.SQRT2;
    let i1 = imax, i2 = imax, k = 0; while (v[(i1 - 1 + n) % n] >= umbral && k++ < n) i1 = (i1 - 1 + n) % n;
    k = 0; while (v[(i2 + 1) % n] >= umbral && k++ < n) i2 = (i2 + 1) % n;
    const hpbw = (((i2 - i1 + n) % n) * 360) / n;
    return { omni: false, principales: prin.length, secundarios: sec.length, sll: sec.length ? 20 * Math.log10(Math.max(...sec.map((i) => v[i])) / mx) : -Infinity, hpbw, max: mx, imax };
  }
  // máximo y directividad de toda la esfera: D = 4π U_máx / ∫ U dΩ
  function esfera(P) {
    const nt = 180, np = 360; let tot = 0, mx = 0, bt = Math.PI / 2, bp = 0;
    for (let i = 0; i < nt; i++) {
      const th = ((i + 0.5) * Math.PI) / nt, st = Math.sin(th);
      for (let j = 0; j < np; j++) { const ph = (j * 2 * Math.PI) / np, F = campoRel(P, th, ph), u = F * F; tot += u * st; if (u > mx) { mx = u; bt = th; bp = ph; } }
    }
    tot *= (Math.PI / nt) * ((2 * Math.PI) / np);
    // afina el máximo
    let h = Math.PI / nt;
    for (let it = 0; it < 40; it++) {
      let mejor = false;
      for (const [dt, dp] of [[h, 0], [-h, 0], [0, h], [0, -h]]) { const t2 = Math.min(Math.PI, Math.max(0, bt + dt)), F = campoRel(P, t2, bp + dp); if (F * F > mx) { mx = F * F; bt = t2; bp += dp; mejor = true; } }
      if (!mejor) h /= 2;
    }
    return { D: (4 * Math.PI * mx) / tot, Umax: mx, thMax: (bt * 180) / Math.PI, phMax: ((((bp * 180) / Math.PI) % 360) + 360) % 360, integral: tot };
  }
  // superficie de radiación 3D: |E|/|E|máx en cada dirección → cuadriláteros para la vista 3D
  function malla3d(P, nt = 24, np = 40) {
    let mx = 0; const g = [];
    for (let i = 0; i <= nt; i++) { g.push([]); for (let j = 0; j <= np; j++) { const F = campoRel(P, (i * Math.PI) / nt, (j * 2 * Math.PI) / np); g[i].push(F); if (F > mx) mx = F; } }
    const pt = (i, j) => { const th = (i * Math.PI) / nt, ph = (j * 2 * Math.PI) / np, r = mx ? g[i][j] / mx : 0; return [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]; };
    const caras = []; for (let i = 0; i < nt; i++) for (let j = 0; j < np; j++) caras.push({ pts: [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], v: (g[i][j] + g[i + 1][j] + g[i + 1][j + 1] + g[i][j + 1]) / (4 * (mx || 1)) });
    return caras;
  }
  const dB = (x) => 10 * Math.log10(x);

  function resolver(sc) {
    const tipo = ['corto', 'media', 'general'].includes(sc.tipo) ? sc.tipo : 'media';
    const fr = lee(sc, 'f', 'la frecuencia'), I = lee(sc, 'I', 'la corriente'), r = lee(sc, 'r', 'la distancia'), th = lee(sc, 'th', 'el ángulo θ', { pos: false });
    if (th < 0 || th > 180) throw new Error('El ángulo θ debe estar entre 0° y 180°');
    const lam = C0 / fr;
    const L = tipo === 'media' ? lam / 2 : lee(sc, 'L', 'la longitud de la antena');
    if (tipo === 'corto' && L > lam / 10) throw new Error(`Un dipolo corto necesita L ≤ λ/10 = ${f(lam / 10)} m; usa «Longitud cualquiera»`);
    if (L > 3 * lam) throw new Error(`La longitud debe ser como mucho 3λ = ${f(3 * lam)} m`);
    const tt = th * Math.PI / 180, I0 = I;
    const Fp = patron(tipo, lam, L, tt);
    const N = 1800; let Fmax = 0, imax = 0;
    for (let i = 0; i <= N; i++) { const F = patron(tipo, lam, L, (i / N) * Math.PI); if (F > Fmax) { Fmax = F; imax = i; } }
    const thMax = (imax / N) * 180;
    const J = integral(tipo, lam, L);
    const Rrad = (ETA / (2 * Math.PI)) * J, Prad = 0.5 * Rrad * I0 * I0;
    const D = (2 * Fmax * Fmax) / J, dBi = 10 * Math.log10(D);
    // ancho de haz a −3 dB del lóbulo principal
    const medio = (i0, paso) => { let i = i0; while (i > 0 && i < N && patron(tipo, lam, L, (i / N) * Math.PI) ** 2 > Fmax * Fmax / 2) i += paso; return (i / N) * 180; };
    const hpbw = medio(imax, 1) - medio(imax, -1);
    const E = (ETA * I0 * Fp) / (2 * Math.PI * r), B = E / C0, S = (E * E) / (2 * ETA);
    const Emax = (ETA * I0 * Fmax) / (2 * Math.PI * r), Smax = (Emax * Emax) / (2 * ETA);
    const lejos = r > 2 * L * L / lam && r > lam;
    const lr = L / lam;
    // ---- array ----
    const NA = vacio(sc.N) ? 1 : Math.round(lee(sc, 'N', 'el número de elementos', { max: 16 }));
    if (NA < 1) throw new Error('El número de elementos debe ser al menos 1');
    const modo = ['broadside', 'endfire', 'fase'].includes(sc.modo) ? sc.modo : 'broadside';
    const dsep = NA > 1 ? lee(sc, 'd', 'la separación entre elementos (en λ)', { max: 4 }) : 0;
    const betaG = NA > 1 && modo === 'fase' ? lee(sc, 'beta', 'la fase progresiva β', { pos: false }) : 0;
    const beta = NA === 1 ? 0 : modo === 'broadside' ? 0 : modo === 'endfire' ? -2 * Math.PI * dsep : (betaG * Math.PI) / 180;
    const P = { tipo, lam, L, N: NA, d: dsep, beta };
    let arr = null;
    if (NA > 1) {
      const ee = esfera(P), cE = lobulos(corte(P, 'E')), cH = lobulos(corte(P, 'H'));
      const D1 = D;
      arr = { N: NA, d: dsep, modo, Umax: ee.Umax, beta, betaGrados: (beta * 180) / Math.PI, D: ee.D, dBi: dB(ee.D), aumento: dB(ee.D / D1), thMax: ee.thMax, phMax: ee.phMax, cE, cH, Prad: NA * Prad };
    }
    const Dtot = arr ? arr.D : D, dBitot = arr ? arr.dBi : dBi;
    // ---- enlace de Friis ----
    let enlace = null;
    if (!vacio(sc.Pt)) {
      const Pt = lee(sc, 'Pt', 'la potencia del transmisor'), Gr = lee(sc, 'Gr', 'la ganancia de la antena receptora (dBi)', { pos: false }), dist = lee(sc, 'dist', 'la distancia del enlace');
      const sens = vacio(sc.sens) ? null : lee(sc, 'sens', 'la sensibilidad del receptor (dBm)', { pos: false });
      const Gt = Dtot, Grl = 10 ** (Gr / 10), pasoL = lam / (4 * Math.PI * dist), Pr = Pt * Gt * Grl * pasoL * pasoL;
      const fspl = -20 * Math.log10(pasoL), PtdBm = dB(Pt * 1000), PrdBm = dB(Pr * 1000), eirp = PtdBm + dBitot;
      enlace = { Pt, Gt, Gr, dist, fspl, PtdBm, PrdBm, Pr, eirp, sens, margen: sens === null ? null : PrdBm - sens,
        alcance: sens === null ? null : (lam / (4 * Math.PI)) * Math.sqrt((Pt * Gt * Grl) / (1e-3 * 10 ** (sens / 10))), lejos: dist > 2 * (arr ? Math.max(L, (NA - 1) * dsep * lam + L) : L) ** 2 / lam && dist > lam };
    }
    const pasos = [
      { t: 'Longitud de onda', html: `$λ = c/f = ${f(C0)}/${f(fr)} = ${f(lam)} "m"$` + (tipo === 'media' ? `, y la antena mide $L = λ/2 = ${f(L)} "m"$` : `, $L = ${f(L)} "m" = ${f(lr)} λ$`) },
      { t: 'Diagrama de radiación', html: tipo === 'corto'
        ? `Corriente uniforme: $F(θ) = π {L}/{λ} sin θ = ${f(Math.PI * lr)} sin θ$, nula en el eje y máxima en $θ = 90°$.`
        : `$F(θ) = {cos(π {L}/{λ} cos θ) − cos(π {L}/{λ})}/{sin θ}$ con $π L/λ = ${f(Math.PI * lr)}$. Máximo $F_"máx" = ${f(Fmax)}$ en $θ = ${f(thMax, 4)}°$.` },
      { t: 'Resistencia de radiación y potencia', html: tipo === 'corto'
        ? `$P_"rad" = 40 π^2 (L/λ)^2 I_0^2 = 40 π^2 · ${f(lr * lr)} · ${f(I0 * I0)} = ${f(Prad)} "W"$, $R_"rad" = 2 P_"rad"/I_0^2 = 80 π^2 (L/λ)^2 = ${f(Rrad)} Ω$`
        : `$P_"rad" = {η_0 I_0^2}/{4π} ∫_0^π F^2 sin θ dθ$, con $∫ = ${f(J)}$: $P_"rad" = ${f(Prad)} "W"$ y $R_"rad" = 2 P_"rad"/I_0^2 = ${f(Rrad)} Ω$` },
      { t: 'Directividad', html: `$D = {4π U_"máx"}/{P_"rad"} = {2 F_"máx"^2}/{∫ F^2 sin θ dθ} = ${f(D)}$, es decir $${f(dBi)} "dBi"$. Ancho de haz a −3 dB: $${f(hpbw, 3)}°$.` },
      { t: `Campo en r = ${f(r)} m, θ = ${f(th, 4)}°`, html: `$E = {η_0 I_0 F(θ)}/{2π r} = ${f(E)} "V/m"$, $B = E/c = ${f(B)} "T"$ y $S = E^2/(2η_0) = ${f(S)} "W/m"^2$` + (lejos ? '' : '. <b>Aviso:</b> estás cerca de la antena (hace falta r mucho mayor que λ y que 2L²/λ); en campo cercano este resultado no es fiable.') },
    ];
    const lobTxt = (n, c) => `Plano ${n}: ` + (c.omni ? 'omnidireccional.' : `${c.principales} lóbulo(s) principal(es) con ancho de haz ${f(c.hpbw, 3)}°` + (c.secundarios ? ` y ${c.secundarios} secundario(s), el mayor a ${f(c.sll, 3)} dB` : ', sin lóbulos secundarios') + '.');
    if (arr) {
      const tipoArr = { broadside: 'broadside (β = 0, máximo perpendicular a la fila)', endfire: `endfire (β = −k d = ${f(arr.betaGrados, 4)}°, máximo a lo largo de la fila)`, fase: `fase elegida (β = ${f(arr.betaGrados, 4)}°)` }[modo];
      pasos.push(
        { t: `Array de ${NA} dipolos`, html: `Separación $d = ${f(dsep)} λ = ${f(dsep * lam)} "m"$, fase progresiva ${tipoArr}. Factor de array: $AF = {sin(N ψ/2)}/{N sin(ψ/2)}$ con $ψ = 2π (d/λ) sin θ cos φ + β$; el diagrama total es $F(θ) · |AF|$.` },
        { t: 'Directividad y lóbulos del array', html: `$D = {4π U_"máx"}/{∫ U dΩ} = ${f(arr.D)}$ (${f(arr.dBi)} dBi), ${f(arr.aumento)} dB más que un solo elemento, con el máximo en $θ = ${f(arr.thMax, 4)}°$, $φ = ${f(arr.phMax, 4)}°$. ${lobTxt('E', arr.cE)} ${lobTxt('H', arr.cH)}` },
        { t: 'Potencia del array', html: `Sin acoplamiento mutuo cada elemento radia lo mismo: $P_"rad" = N · P_1 = ${NA} · ${f(Prad)} = ${f(arr.Prad)} "W"$.` });
    }
    if (enlace) pasos.push({ t: 'Enlace de Friis', html: `$G_t = D = ${f(Dtot)}$ (${f(dBitot)} dBi, sin pérdidas), $G_r = ${f(10 ** (enlace.Gr / 10))}$. Pérdida en el espacio libre: $L_"fs" = (4π d/λ)^2 = ${f(10 ** (enlace.fspl / 10))}$, es decir $${f(enlace.fspl)} "dB"$. $P_r = P_t G_t G_r (λ/4π d)^2 = ${f(enlace.Pr)} "W"$ = $${f(enlace.PrdBm)} "dBm"$ (con $P_t$ = ${f(enlace.PtdBm)} dBm, PIRE ${f(enlace.eirp)} dBm).` + (enlace.margen === null ? '' : ` Margen sobre la sensibilidad de ${f(enlace.sens)} dBm: $${f(enlace.margen)} "dB"$; alcance máximo $d_"máx" = {λ}/{4π} √({P_t G_t G_r}/{P_"sens"}) = ${f(enlace.alcance)} "m"$.`) + (enlace.lejos ? '' : ' <b>Aviso:</b> la distancia del enlace no está en campo lejano; Friis no es fiable.') });
    return { tipo, lam, L, lr, I: I0, r, th, Fp, Fmax, thMax, J, Rrad, Prad, D, dBi, hpbw, E, B, S, Emax, Smax, lejos, pasos, P, arr, enlace, Dtot, dBitot, ref: arr ? Math.sqrt(arr.Umax) : Fmax };
  }

  const ejemplos = [
    { clave: 'media', nombre: 'Dipolo de media onda de FM (100 MHz, 2 A)', sc: { tipo: 'media', f: '100e6', L: '', I: '2', r: '1000', th: '90' } },
    { clave: 'corto', nombre: 'Dipolo corto de 10 cm a 100 MHz', sc: { tipo: 'corto', f: '100e6', L: '0,1', I: '1', r: '100', th: '60' } },
    { clave: 'onda', nombre: 'Dipolo de onda completa (L ≈ λ)', sc: { tipo: 'general', f: '300e6', L: '1', I: '1', r: '50', th: '90' } },
    { clave: 'tres-medios', nombre: 'Dipolo largo de 3λ/2 (lóbulos laterales)', sc: { tipo: 'general', f: '300e6', L: '1,5', I: '1', r: '50', th: '60' } },
    { clave: 'array-broadside', nombre: 'Array de 4 dipolos de media onda, broadside (d = λ/2)', sc: { tipo: 'media', f: '100e6', L: '', I: '1', r: '1000', th: '90', N: '4', d: '0,5', modo: 'broadside', beta: '0', Pt: '10', Gr: '2,15', dist: '5000', sens: '-90' } },
    { clave: 'array-endfire', nombre: 'Par de dipolos endfire (d = λ/4)', sc: { tipo: 'media', f: '100e6', L: '', I: '1', r: '1000', th: '90', N: '2', d: '0,25', modo: 'endfire', beta: '0', Pt: '', Gr: '', dist: '', sens: '' } },
    { clave: 'enlace-wifi', nombre: 'Enlace de 2,4 GHz a 100 m (Friis)', sc: { tipo: 'media', f: '2,4e9', L: '', I: '0,1', r: '10', th: '90', N: '1', d: '', modo: 'broadside', beta: '0', Pt: '0,1', Gr: '2,15', dist: '100', sens: '-90' } },
  ];

  return { resolver, ejemplos, f, patron, ETA, C0, arrayAF, campoRel, corte, lobulos, esfera, malla3d, dirCorte };
})();
if (typeof module !== 'undefined') module.exports = Antena;
