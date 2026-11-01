/* =====================================================================
   Gravitación (sin DOM): ley de gravitación universal y campo, satélites en
   órbita circular, velocidad de escape, el radio de una órbita a partir de su
   periodo (geoestacionaria) y las leyes de Kepler en una órbita elíptica.
   Formato y lectura de campos de calculadora.js; interfaz en gravitacion/app.js.
     resolver(sc)  { modo: 'fuerza' | 'satelite' | 'escape' | 'periodo' | 'kepler', … } → { …, pasos }
   Convenciones: SI por dentro (los campos van en km, horas o kg); G = 6,6743·10⁻¹¹;
   cuerpos centrales con M y R de tablas (el modo «Otro» pide los dos).
   ===================================================================== */
const Gravitacion = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { lee, f } = K, n = f, G = 6.6743e-11, TAU = 2 * Math.PI, RAD = Math.PI / 180;
  const MODOS = { fuerza: 'Fuerza y campo gravitatorio', satelite: 'Satélite en órbita circular', escape: 'Velocidad de escape', periodo: 'Órbita a partir del periodo', kepler: 'Órbita elíptica (Kepler)' };
  // masa (kg) y radio medio (m) de algunos cuerpos
  const CUERPOS = {
    tierra: { nom: 'la Tierra', M: 5.972e24, R: 6.371e6 }, luna: { nom: 'la Luna', M: 7.342e22, R: 1.7374e6 }, marte: { nom: 'Marte', M: 6.417e23, R: 3.3895e6 },
    venus: { nom: 'Venus', M: 4.867e24, R: 6.0518e6 }, mercurio: { nom: 'Mercurio', M: 3.301e23, R: 2.4397e6 }, jupiter: { nom: 'Júpiter', M: 1.898e27, R: 6.9911e7 },
    saturno: { nom: 'Saturno', M: 5.683e26, R: 5.8232e7 }, sol: { nom: 'el Sol', M: 1.989e30, R: 6.957e8 }, otro: { nom: 'el cuerpo central' },
  };
  const NOMBRES = Object.entries(CUERPOS).map(([k, c]) => [k, k === 'otro' ? 'Otro (masa y radio)' : c.nom[0].toUpperCase() + c.nom.slice(1).replace(/^el /, '')]);
  const cuerpo = (sc, conRadio) => {
    const c = CUERPOS[sc.cuerpo] || CUERPOS.tierra;
    if (sc.cuerpo !== 'otro') return { ...c };
    return { nom: c.nom, M: lee(sc, 'M', 'la masa del cuerpo', { min: 0, minEx: true }), R: conRadio ? lee(sc, 'R', 'el radio del cuerpo (km)', { min: 0, minEx: true }) * 1e3 : undefined };
  };
  // un tiempo en la unidad que se lee mejor
  const tiempo = (s) => (s < 120 ? `${n(s, 4)} s` : s < 7200 ? `${n(s / 60, 4)} min` : s < 172800 ? `${n(s / 3600, 4)} h` : s < 63115200 ? `${n(s / 86400, 4)} días` : `${n(s / 31557600, 4)} años`);

  function fuerza(sc) {
    const m1 = lee(sc, 'm1', 'la masa 1', { min: 0, minEx: true }), m2 = lee(sc, 'm2', 'la masa 2', { min: 0, minEx: true }), rkm = lee(sc, 'r', 'la distancia entre centros', { min: 0, minEx: true }), r = rkm * 1e3;
    const F = (G * m1 * m2) / (r * r), g1 = (G * m1) / (r * r), g2 = (G * m2) / (r * r), U = (-G * m1 * m2) / r, Fr = (rr) => (G * m1 * m2) / (rr * rr);
    const pasos = [
      { t: 'Ley de gravitación universal', html: `$F = G {m_1 m_2}/r^2 = ${n(G, 5)} · {${n(m1)} · ${n(m2)}}/(${n(r)})^2 = ${n(F, 5)} "N"$. Es atractiva y actúa sobre cada cuerpo con el mismo valor (tercera ley de Newton).` },
      { t: 'Campo de cada masa a esa distancia', html: `$g_1 = G m_1/r^2 = ${n(g1, 5)} "m/s"^2$ (lo que acelera a la masa 2) y $g_2 = G m_2/r^2 = ${n(g2, 5)} "m/s"^2$ (lo que acelera a la masa 1).` },
      { t: 'Energía potencial', html: `$U = −G {m_1 m_2}/r = ${n(U, 5)} "J"$: negativa porque al separar los cuerpos hasta el infinito hay que darles energía.` },
      { t: 'Dependencia con la distancia', html: `Al doblar la distancia la fuerza se reduce a la cuarta parte: $F(2r) = ${n(F / 4, 5)} "N"$. Al reducirla a la mitad se multiplica por cuatro: $F(r/2) = ${n(F * 4, 5)} "N"$.` },
    ];
    return { modo: 'fuerza', m1, m2, r, F, g1, g2, U, Fr, pasos };
  }

  // lo común de satélite, escape y periodo: cuerpo central y radio de la órbita r
  function orbita(sc, modo) {
    const c = cuerpo(sc, modo !== 'periodo'), M = c.M, mu = G * M, pasos = [];
    pasos.push({ t: 'Cuerpo central', html: `Para ${c.nom}: $M = ${n(M, 5)} "kg"$${c.R ? ` y $R = ${n(c.R / 1e3, 5)} "km"$` : ''}. Su parámetro gravitatorio es $μ = G M = ${n(mu, 6)} "m"^3/"s"^2$.` });
    if (modo === 'periodo') {
      const T = lee(sc, 'T', 'el periodo', { min: 0, minEx: true }) * 3600, r = Math.cbrt((mu * T * T) / (TAU * TAU)), v = TAU * r / T;
      pasos.push({ t: 'Tercera ley de Kepler', html: `$T^2 = {4π^2/{G M}} r^3$, así que $r = ∛({G M T^2/{4π^2}}) = ∛({${n(mu, 5)} · (${n(T, 5)})^2}/{4π^2}) = ${n(r / 1e3, 5)} "km"$.` });
      const R = c.R;
      if (R) pasos.push({ t: 'Altura sobre la superficie', html: `$h = r − R = ${n(r / 1e3, 5)} − ${n(R / 1e3, 5)} = ${n((r - R) / 1e3, 5)} "km"$${r < R ? '. Es menor que el radio: esa órbita quedaría dentro del cuerpo' : ''}.` });
      pasos.push({ t: 'Velocidad orbital', html: `$v = {2π r}/T = √({G M}/r) = ${n(v, 5)} "m/s"$ y $v_{esc} = √2 v = ${n(Math.SQRT2 * v, 5)} "m/s"$.` });
      return { modo, M, R, mu, T, r, v, h: R ? r - R : null, vesc: Math.SQRT2 * v, pasos };
    }
    const R = c.R, h = lee(sc, 'h', 'la altura sobre la superficie', { def: 0, min: 0 }) * 1e3, r = R + h, g0 = mu / (R * R), gh = mu / (r * r), vesc = Math.sqrt((2 * mu) / r), v = Math.sqrt(mu / r);
    pasos.push({ t: 'Radio de la órbita', html: `$r = R + h = ${n(R / 1e3, 5)} + ${n(h / 1e3, 5)} = ${n(r / 1e3, 5)} "km"$` });
    pasos.push({ t: 'Gravedad', html: `$g_0 = G M/R^2 = ${n(g0, 5)} "m/s"^2$ en la superficie y $g = G M/r^2 = ${n(gh, 5)} "m/s"^2$ a esa altura (${n((gh / g0) * 100, 4)} % de la de la superficie).` });
    if (modo === 'escape') {
      const m = lee(sc, 'm', 'la masa del cuerpo que escapa', { def: 1, min: 0, minEx: true }), E = (mu * m) / r;
      pasos.push({ t: 'Velocidad de escape', html: `La energía total debe llegar a cero en el infinito: $1/2 m v^2 − {G M m}/r = 0$, así que $v_{esc} = √({2 G M}/r) = √({2 · ${n(mu, 5)}}/${n(r, 5)}) = ${n(vesc, 5)} "m/s"$ (${n(vesc / 1e3, 5)} km/s).` });
      pasos.push({ t: 'Comparación con la órbita circular', html: `A esa altura un satélite circular va a $v = √({G M}/r) = ${n(v, 5)} "m/s"$: la velocidad de escape es $√2$ veces mayor (${n(vesc / v, 5)}).` });
      pasos.push({ t: 'Energía necesaria', html: `Para $m = ${n(m)} "kg"$: $E = {G M m}/r = ${n(E, 5)} "J"$ (${n(E / 1e6, 5)} MJ) con la que se llega al infinito sin velocidad.` });
      return { modo, M, R, mu, h, r, g0, gh, v, vesc, m, E, pasos };
    }
    const m = lee(sc, 'm', 'la masa del satélite', { min: 0, minEx: true }), T = (TAU * r) / v, w = v / r, Ec = (mu * m) / (2 * r), Ep = (-mu * m) / r, E = Ec + Ep, Eop = mu * m * (1 / R - 1 / (2 * r));
    pasos.push({ t: 'Velocidad orbital', html: `La gravedad hace de fuerza centrípeta: $G {M m}/r^2 = m v^2/r$, de donde $v = √({G M}/r) = √(${n(mu, 5)}/${n(r, 5)}) = ${n(v, 5)} "m/s"$ (${n(v * 3.6, 5)} km/h).` });
    pasos.push({ t: 'Periodo', html: `$T = {2π r}/v = ${n(T, 5)} "s"$ = ${tiempo(T)}; $ω = v/r = ${n(w, 5)} "rad/s"$. Da ${n(86400 / T, 4)} vueltas al día.` });
    pasos.push({ t: 'Energías', html: `$E_c = {G M m}/{2r} = ${n(Ec, 5)} "J"$, $E_p = −{G M m}/r = ${n(Ep, 5)} "J"$ y $E = E_c + E_p = −{G M m}/{2r} = ${n(E, 5)} "J"$. Es negativa: el satélite está ligado.` });
    pasos.push({ t: 'Energía para ponerlo en órbita', html: `Desde el reposo en la superficie: $ΔE = G M m (1/R − 1/{2r}) = ${n(Eop, 5)} "J"$ (sin contar la rotación del cuerpo).` });
    pasos.push({ t: 'Velocidad de escape', html: `Desde esa órbita, $v_{esc} = √2 v = ${n(vesc, 5)} "m/s"$: hay que aumentar la velocidad ${n((vesc / v - 1) * 100, 4)} % para abandonarla.` });
    return { modo, M, R, mu, h, r, g0, gh, v, T, w, m, Ec, Ep, E, Eop, vesc, pasos };
  }

  function kepler(sc) {
    const c = cuerpo(sc, false), M = c.M, mu = G * M, pasos = [], datos = sc.datos === 'pa' ? 'pa' : 'ae';
    let a, e;
    if (datos === 'ae') {
      a = lee(sc, 'a', 'el semieje mayor', { min: 0, minEx: true }) * 1e3; e = lee(sc, 'e', 'la excentricidad', { min: 0, max: 1, maxEx: true });
    } else {
      const rp0 = lee(sc, 'rp', 'el periastro', { min: 0, minEx: true }) * 1e3, ra0 = lee(sc, 'ra', 'el apoastro', { min: 0, minEx: true }) * 1e3;
      if (ra0 < rp0) throw new Error('El apoastro no puede ser menor que el periastro');
      a = (rp0 + ra0) / 2; e = (ra0 - rp0) / (ra0 + rp0);
      pasos.push({ t: 'Semieje y excentricidad', html: `$a = {r_p + r_a}/2 = ${n(a / 1e3, 6)} "km"$ y $e = {r_a − r_p}/{r_a + r_p} = ${n(e, 5)}$` });
    }
    const nu = lee(sc, 'nu', 'la anomalía verdadera', { def: 0 }) * RAD, rp = a * (1 - e), ra = a * (1 + e), b = a * Math.sqrt(1 - e * e), T = TAU * Math.sqrt((a * a * a) / mu);
    const vp = Math.sqrt((mu / a) * ((1 + e) / (1 - e))), va = Math.sqrt((mu / a) * ((1 - e) / (1 + e))), eps = -mu / (2 * a), areal = 0.5 * rp * vp, k3 = (T * T) / (a * a * a);
    const rr = (a * (1 - e * e)) / (1 + e * Math.cos(nu)), vv = Math.sqrt(mu * (2 / rr - 1 / a));
    pasos.unshift({ t: 'Datos de la órbita', html: `Alrededor de ${c.nom} ($M = ${n(M, 5)} "kg"$, $μ = G M = ${n(mu, 6)} "m"^3/"s"^2$) con $a = ${n(a / 1e3, 6)} "km"$ y $e = ${n(e, 5)}$. Primera ley: la órbita es una elipse con ${c.nom} en un foco.` });
    pasos.push({ t: 'Distancias extremas', html: `$r_p = a(1 − e) = ${n(rp / 1e3, 6)} "km"$ (más cerca) y $r_a = a(1 + e) = ${n(ra / 1e3, 6)} "km"$ (más lejos); el semieje menor es $b = a√(1 − e^2) = ${n(b / 1e3, 6)} "km"$.` });
    pasos.push({ t: 'Tercera ley: periodo', html: `$T = 2π√({a^3}/{G M}) = ${n(T, 6)} "s"$ = ${tiempo(T)}. La constante $T^2/a^3 = 4π^2/{G M} = ${n(k3, 5)} "s"^2/"m"^3$ es la misma para todo lo que gira alrededor de ${c.nom}.` });
    pasos.push({ t: 'Velocidades en los extremos', html: `Por la conservación de la energía y del momento angular (vis-viva $v^2 = G M (2/r − 1/a)$): $v_p = √({G M}/a {1 + e}/{1 − e}) = ${n(vp, 5)} "m/s"$ y $v_a = √({G M}/a {1 − e}/{1 + e}) = ${n(va, 5)} "m/s"$. Se cumple $r_p v_p = r_a v_a$ = $${n(rp * vp, 5)} "m"^2/"s"$.` });
    pasos.push({ t: 'Segunda ley: velocidad areolar', html: `El radio vector barre áreas iguales en tiempos iguales: $dA/dt = 1/2 r_p v_p = ${n(areal, 5)} "m"^2/"s"$ (comprobación: $π a b / T = ${n((Math.PI * a * b) / T, 5)} "m"^2/"s"$).` });
    pasos.push({ t: 'Energía', html: `La energía específica es $ε = −{G M}/{2a} = ${n(eps, 5)} "J/kg"$, negativa: la órbita está ligada. Desde el periastro la velocidad de escape sería $v_{esc} = √({2 G M}/r_p) = ${n(Math.sqrt((2 * mu) / rp), 5)} "m/s"$, frente a $v_p = ${n(vp, 5)} "m/s"$.` });
    pasos.push({ t: 'Posición con la anomalía verdadera', html: `Con $ν = ${n(nu / RAD, 4)}°$: $r = {a(1 − e^2)}/{1 + e cos ν} = ${n(rr / 1e3, 6)} "km"$ y $v = √(G M (2/r − 1/a)) = ${n(vv, 5)} "m/s"$.` });
    return { modo: 'kepler', M, mu, a, e, b, rp, ra, T, vp, va, eps, areal, k3, nu, r: rr, v: vv, vesc_p: Math.sqrt((2 * mu) / rp), pasos };
  }

  const R = { fuerza, satelite: (sc) => orbita(sc, 'satelite'), escape: (sc) => orbita(sc, 'escape'), periodo: (sc) => orbita(sc, 'periodo'), kepler };
  const resolver = (sc) => (R[sc.modo] || R.fuerza)(sc);

  const ejemplos = [
    { clave: 'tierra-luna', nombre: 'Atracción entre la Tierra y la Luna', sc: { modo: 'fuerza', m1: '5,972·10^24', m2: '7,342·10^22', r: '384400' } },
    { clave: 'iss', nombre: 'Estación Espacial a 408 km de altura', sc: { modo: 'satelite', cuerpo: 'tierra', h: '408', m: '4,2·10^5' } },
    { clave: 'escape-tierra', nombre: 'Velocidad de escape desde la superficie de la Tierra', sc: { modo: 'escape', cuerpo: 'tierra', h: '0', m: '1000' } },
    { clave: 'escape-luna', nombre: 'Velocidad de escape de la Luna', sc: { modo: 'escape', cuerpo: 'luna', h: '0', m: '1' } },
    { clave: 'geoestacionaria', nombre: 'Órbita geoestacionaria (periodo de 23,9345 h)', sc: { modo: 'periodo', cuerpo: 'tierra', T: '23,9345' } },
    { clave: 'fobos', nombre: 'Fobos alrededor de Marte (7,654 h)', sc: { modo: 'periodo', cuerpo: 'marte', T: '7,654' } },
    { clave: 'halley', nombre: 'Cometa Halley (a = 2,6678·10⁹ km, e = 0,967)', sc: { modo: 'kepler', cuerpo: 'sol', datos: 'ae', a: '2,6678·10^9', e: '0,96714', rp: '', ra: '', nu: '90' } },
    { clave: 'tierra-sol', nombre: 'La Tierra: perihelio 1,471·10⁸ km y afelio 1,521·10⁸ km', sc: { modo: 'kepler', cuerpo: 'sol', datos: 'pa', a: '', e: '', rp: '1,471·10^8', ra: '1,521·10^8', nu: '0' } },
  ];

  // sc al azar para el modo práctica
  const azar = () => {
    const r = (a, b, d = 1) => (Math.round((a + Math.random() * (b - a)) * 10 ** d) / 10 ** d).toString().replace('.', ',');
    const modo = ['fuerza', 'satelite', 'escape', 'periodo', 'kepler'][Math.floor(Math.random() * 5)], cuerpo = ['tierra', 'marte', 'luna', 'venus'][Math.floor(Math.random() * 4)];
    if (modo === 'fuerza') return { modo, m1: `${r(1, 9, 1)}·10^${20 + Math.floor(Math.random() * 6)}`, m2: `${r(1, 9, 1)}·10^${3 + Math.floor(Math.random() * 18)}`, r: r(1000, 400000, 0) };
    if (modo === 'satelite') return { modo, cuerpo, h: r(200, 3000, 0), m: r(100, 2000, 0) };
    if (modo === 'escape') return { modo, cuerpo, h: r(0, 2000, 0), m: r(1, 500, 0) };
    if (modo === 'periodo') return { modo, cuerpo: 'tierra', T: r(2, 48, 1) };
    return { modo, cuerpo: 'sol', datos: 'ae', a: `${r(1, 9, 1)}·10^8`, e: r(0.05, 0.9, 2), rp: '', ra: '', nu: r(0, 180, 0) };
  };

  return { resolver, ejemplos, azar, MODOS, CUERPOS, NOMBRES, G, tiempo, f };
})();
if (typeof module !== 'undefined') module.exports = Gravitacion;
