/* =====================================================================
   Método de las imágenes (sin DOM): una carga puntual q frente a un plano
   conductor a tierra, frente a una esfera conductora (a tierra, aislada con
   una carga Q o a un potencial V₀) o dentro de una cavidad esférica.
   Da las cargas imagen y su posición, la fuerza sobre q, la carga inducida
   y su densidad superficial σ, el trabajo para llevar q al infinito (plano y
   esfera a tierra) y el potencial y el campo en un punto. Desarrollo en la
   forma simbólica (q²/16πε₀d²) y con números. Unidades del SI.
     resolver(sc)  → { modo, cargas, F, σ(…), campo(z, ρ), pasos, … }
     ejemplos      [{ clave, nombre, sc }]
   Eje z: el plano es z = 0 con la carga en z = d; la esfera (o la cavidad)
   tiene el centro en z = 0 y la carga en z = a.
   La interfaz está en app.js y la prueba en pruebas/herramientas/imagenes.js.
   ===================================================================== */
const Imagenes = (() => {
  const EPS0 = 8.854187817e-12, K = 1 / (4 * Math.PI * EPS0);
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // con prefijo del SI: 3,33·10⁻⁹ C → 3,333 nC
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, unidad, d = 4) => {
    if (!isFinite(x) || Math.abs(x) < 1e-18) return `${f(x, d)} ${unidad}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', ',').replace('-', '−')} ${p[1]}${unidad}`;
  };
  // para dentro de una fórmula: 3,333 nC → 3,333 "nC"
  const uq = (x, unidad, d = 4) => u(x, unidad, d).replace(/ (.+)$/, ' "$1"');
  const leeNum0 = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const lee = (sc, k, nom, { opcional = false, signo = false, cero = false, def = null } = {}) => {
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    if (signo && !cero && v === 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no puede ser 0`);
    return v;
  };

  // cada modo: campos [clave, nombre, unidad, factor al SI, opciones de lee] y qué se pide del punto
  const Q = ['q', 'Carga q', 'nC', 1e-9, { signo: true }];
  const MODOS = {
    plano: { nombre: 'Plano conductor a tierra', campos: [Q, ['d', 'Distancia de q al plano d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, distancia al eje', 'cm', 1e-2], ['z', 'z, altura sobre el plano', 'cm', 1e-2]] },
    'esfera-tierra': { nombre: 'Esfera conductora a tierra', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la esfera R', 'cm', 1e-2, {}]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
    'esfera-aislada': { nombre: 'Esfera aislada con carga Q', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la esfera R', 'cm', 1e-2, {}], ['Q', 'Carga total de la esfera Q', 'nC', 1e-9, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
    'esfera-potencial': { nombre: 'Esfera a un potencial V₀', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la esfera R', 'cm', 1e-2, {}], ['V0', 'Potencial de la esfera V₀', 'V', 1, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
    cavidad: { nombre: 'Carga dentro de una cavidad esférica', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la cavidad R', 'cm', 1e-2, {}]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
  };

  // potencial y campo de un conjunto de cargas puntuales sobre el eje z, en el punto (z, ρ); ρ puede ser negativo
  function campo(cargas, z, rho) {
    let V = 0, Ez = 0, Er = 0;
    for (const c of cargas) { const dz = z - c.z, r2 = dz * dz + rho * rho, r = Math.sqrt(r2); V += (K * c.q) / r; Ez += (K * c.q * dz) / (r2 * r); Er += (K * c.q * rho) / (r2 * r); }
    return { V, Ez, Er, E: Math.hypot(Ez, Er) };
  }

  function resolver(sc) {
    const modo = MODOS[sc.modo] ? sc.modo : 'plano', M = MODOS[modo], esfera = modo !== 'plano', cav = modo === 'cavidad';
    const p = {};
    for (const [k, nom, , fac, op] of M.campos) { const v = lee(sc, k, nom.charAt(0).toLowerCase() + nom.slice(1), op || {}); p[k] = v * fac; }
    const q = p.q;
    if (esfera) {
      if (cav && !(p.a < p.R)) throw new Error('La carga tiene que estar dentro de la cavidad (a < R)');
      if (!cav && !(p.a > p.R)) throw new Error('La carga tiene que estar fuera de la esfera (a > R)');
    }
    const pos = esfera ? p.a : p.d, R = p.R;
    // cargas imagen
    let imagenes, Qe = null, V0 = null, q2 = 0;
    if (!esfera) imagenes = [{ q: -q, z: -p.d, nom: 'q′' }];
    else {
      const qi = (-q * R) / p.a, zi = (R * R) / p.a;
      imagenes = p.a / R < 1e-9 && cav ? [] : [{ q: qi, z: zi, nom: 'q′' }];
      if (modo === 'esfera-tierra') { Qe = qi; V0 = 0; }
      else if (modo === 'esfera-aislada') { Qe = p.Q; q2 = Qe - qi; V0 = (K * q2) / R; }
      else if (modo === 'esfera-potencial') { V0 = p.V0; q2 = (V0 * R) / K; Qe = qi + q2; }
      else { Qe = -q; V0 = 0; }
      if (q2 !== 0) imagenes.push({ q: q2, z: 0, nom: 'q″' });
    }
    const cargas = [{ q, z: pos, real: true }, ...imagenes];
    // fuerza sobre q (componente z) y si atrae al conductor
    let Fz = 0;
    for (const c of imagenes) { const dz = pos - c.z; Fz += (K * q * c.q * dz) / Math.abs(dz) ** 3; }
    const haciaConductor = cav ? 1 : -1, atractiva = Fz * haciaConductor > 0;
    // densidad de carga inducida: plano en ρ; esfera y cavidad en θ (ángulo con el eje de q)
    const sigma = !esfera ? (rho) => (-q * p.d) / (2 * Math.PI * (rho * rho + p.d * p.d) ** 1.5)
      : (th) => (-q * Math.abs(p.a * p.a - R * R)) / (4 * Math.PI * R * (R * R + p.a * p.a - 2 * p.a * R * Math.cos(th)) ** 1.5) + (cav ? 0 : q2 / (4 * Math.PI * R * R));
    const sigmaMax = sigma(0);
    // trabajo para llevar q al infinito (solo si el conductor está a tierra y q puede salir)
    const W = modo === 'plano' ? (K * q * q) / (4 * p.d) : modo === 'esfera-tierra' ? (K * q * q * R) / (2 * (p.a * p.a - R * R)) : null;

    // punto de observación (opcional)
    let pt = null;
    const [k1, k2] = M.punto.map((x) => x[0]), v1 = sc[k1], v2 = sc[k2];
    if (!vacio(v1) || !vacio(v2)) {
      const n1 = M.punto[0][1].split(',')[0], n2 = M.punto[1][1].split(',')[0];
      if (vacio(v1)) throw new Error(`Falta ${n1} del punto`);
      if (vacio(v2)) throw new Error(`Falta ${n2} del punto`);
      const a1 = leeNum(v1), a2 = leeNum(v2);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('Las coordenadas del punto deben ser números');
      let rho, z, th = null, r = null;
      if (!esfera) { rho = a1 * 1e-2; z = a2 * 1e-2; if (z <= 0) throw new Error('El punto tiene que estar del lado de la carga (z > 0)'); }
      else {
        r = a1 * 1e-2; th = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('La distancia r del punto no puede ser negativa');
        if (!cav && r <= R) throw new Error('El punto tiene que estar fuera de la esfera (r > R)');
        if (cav && r >= R) throw new Error('El punto tiene que estar dentro de la cavidad (r < R)');
        rho = r * Math.sin(th); z = r * Math.cos(th);
      }
      const c = campo(cargas, z, rho);
      pt = { rho, z, r, th, ...c, sigma: !esfera ? sigma(rho) : sigma(th) };
    }

    const pasos = [];
    const cm = (x) => f(x * 100);
    // 1. condición de contorno e imágenes
    if (!esfera) {
      pasos.push({ t: 'Planteamiento', html: `El plano está a tierra (V = 0 en z = 0). Se quita el conductor y se pone una carga imagen que dé V = 0 en el plano: la opuesta, en el punto simétrico. Vale para z > 0.` });
      pasos.push({ t: 'Carga imagen', html: `$q′ = −q = ${uq(-q, 'C')}$ en $z = −d = −${cm(p.d)} "cm"$.` });
    } else if (!cav) {
      pasos.push({ t: 'Planteamiento', html: `Se quita la esfera y se busca una carga imagen en el interior, sobre el eje, que dé V = 0 en r = R. Es la imagen de q respecto a la esfera.` });
      pasos.push({ t: 'Carga imagen', html: `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, a una distancia $a′ = R^2/a = {${f(R)}^2}/{${f(p.a)}} = ${cm(imagenes[0].z)} "cm"$ del centro.` });
      if (modo === 'esfera-tierra') pasos.push({ t: 'Esfera a tierra', html: `Con V = 0 basta una sola imagen. La carga total de la esfera es la de la imagen: $Q = q′ = ${uq(Qe, 'C')}$.` });
      else {
        if (modo === 'esfera-aislada') pasos.push({ t: 'Esfera aislada', html: `La esfera tiene carga total $Q = ${f(Qe)} "C"$. La imagen q′ ya aporta ${f(imagenes[0].q)} C y el resto se pone en el centro, para que la superficie siga siendo equipotencial: $q″ = Q − q′ = ${f(Qe)} − (${f(imagenes[0].q)}) = ${f(q2)} "C"$, en $z = 0$.` });
        else pasos.push({ t: 'Esfera a un potencial', html: `La esfera está a $V_0 = ${f(V0)} "V"$. La carga q″ del centro la fija: $q″ = 4π ε_0 R V_0 = ${f(q2)} "C"$, en $z = 0$, y la carga total de la esfera es $Q = q′ + q″ = ${f(Qe)} "C"$.` });
        pasos.push({ t: 'Potencial de la esfera', html: `$V_{esfera} = {q″}/{4π ε_0 R} = ${f(V0)} "V"$ (uniforme: toda la esfera es equipotencial).` });
      }
    } else {
      pasos.push({ t: 'Planteamiento', html: `La carga está dentro de una cavidad esférica de radio R en un conductor. Se busca una carga imagen fuera de la cavidad, sobre el eje, que dé V = 0 en r = R (vale para r < R).` });
      pasos.push({ t: 'Carga imagen', html: imagenes.length ? `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, a una distancia $a′ = R^2/a = ${cm(imagenes[0].z)} "cm"$ del centro, fuera de la cavidad.` : 'Si la carga está en el centro no hace falta imagen: el campo dentro es el de q sola.' });
      pasos.push({ t: 'Carga inducida', html: `En la pared de la cavidad se induce exactamente $−q = ${f(-q)} "C"$ (Gauss): el campo dentro del conductor es nulo.` });
    }
    // 2. fuerza
    const Fmod = Math.abs(Fz);
    if (modo === 'plano') pasos.push({ t: 'Fuerza sobre q', html: `La fuerza es la de q con su imagen, a una distancia 2d: $F = {q q′}/{4π ε_0 (2d)^2} = −{q^2}/{16π ε_0 d^2} = −{(${f(q)})^2}/{16π · ${f(EPS0)} · (${f(p.d)})^2} = ${f(Fz)} "N"$ (${atractiva ? 'atractiva, hacia el plano' : 'repulsiva'}).` });
    else if (modo === 'esfera-tierra') pasos.push({ t: 'Fuerza sobre q', html: `Entre q y su imagen hay $a − a′ = ${cm(p.a - imagenes[0].z)} "cm"$: $F = {q q′}/{4π ε_0 (a − a′)^2} = −{q^2 R a}/{4π ε_0 (a^2 − R^2)^2} = ${f(Fz)} "N"$ (${atractiva ? 'atractiva, hacia la esfera' : 'repulsiva'}).` });
    else if (!cav) pasos.push({ t: 'Fuerza sobre q', html: `Actúan las dos imágenes: $F = {q}/{4π ε_0}[{q′}/{(a − a′)^2} + {q″}/{a^2}] = ${f(K * q)} [{${f(imagenes[0].q)}}/{(${f(p.a - imagenes[0].z)})^2} + {${f(q2)}}/{(${f(p.a)})^2}] = ${f(Fz)} "N"$ (${atractiva ? 'atractiva' : 'repulsiva'}, ${atractiva ? 'hacia la esfera' : 'alejándose de la esfera'}).` });
    else pasos.push({ t: 'Fuerza sobre q', html: imagenes.length ? `Entre q y su imagen hay $a′ − a = ${cm(imagenes[0].z - p.a)} "cm"$: $F = {q q′}/{4π ε_0 (a′ − a)^2} = {q^2 R a}/{4π ε_0 (R^2 − a^2)^2} = ${f(Math.abs(Fz))} "N"$ (atractiva, hacia la pared más cercana).` : '$F = 0$ por simetría.' });
    // 3. densidad inducida
    if (modo === 'plano') pasos.push({ t: 'Carga inducida', html: `Con $σ = ε_0 E_n$ en el plano: $σ(ρ) = −{q d}/{2π (ρ^2 + d^2)^{3/2}}$. En ρ = 0: $σ_{máx} = −{q}/{2π d^2} = ${f(sigmaMax)} "C/m²"$. Integrando en todo el plano sale $Q_{ind} = −q = ${f(-q)} "C"$.` });
    else pasos.push({ t: 'Densidad de carga inducida', html: `$σ(θ) = −{q (${cav ? 'R^2 − a^2' : 'a^2 − R^2'})}/{4π R (R^2 + a^2 − 2 a R cos θ)^{3/2}}${!cav && q2 !== 0 ? ' + {q″}/{4π R^2}' : ''}$. En el punto más cercano a q (θ = 0): $σ = ${f(sigmaMax)} "C/m²"$.` });
    // 4. trabajo
    if (W !== null) pasos.push({ t: 'Trabajo para llevar q al infinito', html: modo === 'plano' ? `$W = ∫_d^∞ {q^2}/{16π ε_0 x^2} dx = {q^2}/{16π ε_0 d} = ${uq(W, 'J')}$ (es la energía del sistema, la mitad de la de las dos cargas reales).` : `$W = ∫_a^∞ F dx = {q^2 R}/{8π ε_0 (a^2 − R^2)} = ${uq(W, 'J')}$.` });
    // 5. punto
    if (pt) {
      const lista = cargas.map((c, i) => `r<sub>${i}</sub> = ${cm(Math.hypot(pt.z - c.z, pt.rho))} cm`).join(', ');
      pasos.push({ t: 'Potencial en el punto', html: `Se suman las contribuciones de q y de ${imagenes.length > 1 ? 'las imágenes' : 'su imagen'}: $V = {1}/{4π ε_0} Σ {q_i}/{r_i}$, con ${lista}. Sale $V = ${f(pt.V)} "V"$.` });
      pasos.push({ t: 'Campo en el punto', html: `$E_z = ${f(pt.Ez)} "V/m"$, $E_ρ = ${f(pt.Er)} "V/m"$, $|E| = ${f(pt.E)} "V/m"$.` });
      pasos.push({ t: 'Carga inducida bajo el punto', html: `${!esfera ? `Bajo el punto (ρ = ${cm(pt.rho)} cm)` : `En el punto de la superficie con el mismo ángulo (θ = ${f((pt.th * 180) / Math.PI)}°)`}: $σ = ${f(pt.sigma)} "C/m²"$.` });
    }
    return { modo, esfera, cav, p, q, pos, R, imagenes, cargas, Fz, Fmod, atractiva, Qe, V0, q2, sigma, sigmaMax, W, pt, pasos };
  }

  const ejemplos = [
    { clave: 'plano', nombre: 'Carga de 5 nC a 3 cm de un plano a tierra', sc: { modo: 'plano', q: '5', d: '3', rho: '4', z: '3' } },
    { clave: 'esfera-tierra', nombre: 'Carga de 10 nC frente a una esfera a tierra', sc: { modo: 'esfera-tierra', q: '10', a: '30', R: '10', r: '15', th: '0' } },
    { clave: 'esfera-neutra', nombre: 'La misma carga frente a una esfera neutra aislada', sc: { modo: 'esfera-aislada', q: '10', a: '30', R: '10', Q: '0', r: '15', th: '0' } },
    { clave: 'esfera-potencial', nombre: 'Esfera a 500 V con una carga cerca', sc: { modo: 'esfera-potencial', q: '2', a: '20', R: '5', V0: '500', r: '10', th: '90' } },
    { clave: 'cavidad', nombre: 'Carga de 5 nC dentro de una cavidad esférica', sc: { modo: 'cavidad', q: '5', a: '6', R: '10', r: '3', th: '60' } },
  ];

  return { resolver, ejemplos, campo, MODOS, f, u, EPS0, K };
})();
if (typeof module !== 'undefined') module.exports = Imagenes;
