/* =====================================================================
   Antena dipolo y radiación: cálculo (sin DOM). Interfaz en app.js, página en
   pagina.html y prueba en pruebas/herramientas/antena.js.
   Campo lejano de un dipolo con la corriente I0 (amplitud):
     corto (Hertz, corriente uniforme): F(θ) = π (L/λ) sin θ
     longitud L (onda de corriente senoidal I0 sen k(L/2 − |z|)):
       F(θ) = [cos(kL/2 cos θ) − cos(kL/2)] / sin θ     (media onda: L = λ/2)
   y |E| = η0 I0 F(θ) / (2π r). La potencia radiada, la resistencia de radiación
   y la directividad salen de integrar F² sin θ (Simpson) con η0 = 376,73 Ω.
     resolver(sc)  { tipo, f, L, I, r, th } (texto) → resultados y pasos
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
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
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
    return { tipo, lam, L, lr, I: I0, r, th, Fp, Fmax, thMax, J, Rrad, Prad, D, dBi, hpbw, E, B, S, Emax, Smax, lejos, pasos };
  }

  const ejemplos = [
    { clave: 'media', nombre: 'Dipolo de media onda de FM (100 MHz, 2 A)', sc: { tipo: 'media', f: '100e6', L: '', I: '2', r: '1000', th: '90' } },
    { clave: 'corto', nombre: 'Dipolo corto de 10 cm a 100 MHz', sc: { tipo: 'corto', f: '100e6', L: '0,1', I: '1', r: '100', th: '60' } },
    { clave: 'onda', nombre: 'Dipolo de onda completa (L ≈ λ)', sc: { tipo: 'general', f: '300e6', L: '1', I: '1', r: '50', th: '90' } },
    { clave: 'tres-medios', nombre: 'Dipolo largo de 3λ/2 (lóbulos laterales)', sc: { tipo: 'general', f: '300e6', L: '1,5', I: '1', r: '50', th: '60' } },
  ];

  return { resolver, ejemplos, f, patron, ETA, C0 };
})();
if (typeof module !== 'undefined') module.exports = Antena;
