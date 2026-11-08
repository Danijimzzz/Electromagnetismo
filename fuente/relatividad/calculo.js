/* =====================================================================
   Cinemática relativista (sin DOM): transformación de Lorentz de un evento
   entre dos sistemas de referencia (con su diagrama de Minkowski), suma
   y resta de velocidades con las rapideces, e intervalo entre dos eventos
   (temporal, espacial o de tipo luz, tiempo propio y distancia propia).
   Formato y lectura de campos de calculadora.js; interfaz en
   relatividad/app.js.
     resolver(sc)  { modo: 'lorentz' | 'velocidades' | 'intervalo', … } → { …, pasos }
   Convenciones: β = v/c; el sistema S' se mueve con velocidad v respecto de S
   en el sentido +x y los orígenes coinciden en t = t' = 0; la coordenada de
   tiempo del diagrama es c·t, en la misma unidad que x.
   ===================================================================== */
const Relatividad = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { lee, f } = K, n = f;
  const MODOS = { lorentz: 'Transformación de Lorentz y diagrama de Minkowski', velocidades: 'Suma de velocidades', intervalo: 'Intervalo entre dos eventos' };
  // c en la unidad de longitud por unidad de tiempo, y los nombres de cada pareja
  const UNIDADES = {
    al: { nom: 'años-luz y años', L: 'años-luz', T: 'años', c: 1 },
    ls: { nom: 'segundos-luz y segundos', L: 'segundos-luz', T: 's', c: 1 },
    km: { nom: 'kilómetros y segundos', L: 'km', T: 's', c: 299792.458 },
  };
  // β muy cerca de ±1: con 5 cifras saldría «1», así que se dan 12 y, aparte, lo que le falta para llegar a c
  const nb = (b) => (Math.abs(b) > 0.9999 ? n(b, 12) : n(b, 5));
  const uni = (sc) => UNIDADES[sc.unidades] || UNIDADES.al;
  const beta = (sc, k, nom) => lee(sc, k, nom, { min: -1, minEx: true, max: 1, maxEx: true });

  function lorentz(sc) {
    const U = uni(sc), c = U.c, b = beta(sc, 'v', 'la velocidad v (en unidades de c)');
    const x = lee(sc, 'x', 'la posición x'), t = lee(sc, 't', 'el instante t'), pasos = [];
    const g = 1 / Math.sqrt((1 - Math.abs(b)) * (1 + Math.abs(b))), ct = c * t;
    pasos.push({ t: 'Factor de Lorentz', html: `$β = v/c = ${nb(b)}$ y $γ = 1/√(1 − β^2) = ${n(g, 6)}$.${Math.abs(b) > 0.9999 ? ` (Aquí $1 − |β| = ${n(1 - Math.abs(b), 4)}$: la nave va casi a la velocidad de la luz y γ es enorme.)` : ''}${b === 0 ? ' Con $β = 0$ los dos sistemas coinciden: $γ = 1$ y las coordenadas no cambian.' : ''}` });
    pasos.push({ t: 'Coordenadas en S′', html: `Con $c t = ${n(ct, 6)} "${U.L}"$: $x′ = γ (x − β c t) = ${n(g, 6)} (${n(x, 6)} − ${nb(b)} · ${n(ct, 6)}) = ${n(g * (x - b * ct), 6)} "${U.L}"$.` });
    const xp = g * (x - b * ct), ctp = g * (ct - b * x), tp = ctp / c;
    pasos.push({ t: 'Tiempo en S′', html: `$c t′ = γ (c t − β x) = ${n(g, 6)} (${n(ct, 6)} − ${nb(b)} · ${n(x, 6)}) = ${n(ctp, 6)} "${U.L}"$, es decir $t′ = ${n(tp, 6)} "${U.T}"$.` });
    const s2 = ct * ct - x * x, s2p = ctp * ctp - xp * xp;
    pasos.push({ t: 'Comprobación: el intervalo no cambia', html: `$(c t)^2 − x^2 = ${n(s2, 6)}$ y $(c t′)^2 − x′^2 = ${n(s2p, 6)}$ (en "${U.L}"$^2$): es un invariante, igual en los dos sistemas.` });
    pasos.push({ t: 'Qué se ve en el diagrama de Minkowski', html: `En el diagrama de S (x horizontal, $c t$ vertical) la luz va a 45°. El eje $c t′$ (la línea de mundo del origen de S′, $x′ = 0$) tiene pendiente $1/β$; el eje $x′$ ($c t′ = 0$) está inclinado el mismo ángulo hacia dentro, $c t = β x$, un ángulo $arctan β = ${n((Math.atan(b) * 180) / Math.PI, 4)}°$. Las líneas paralelas a los ejes inclinados por el evento dan sus coordenadas $x′$ y $c t′$ (pueden quedar en lados distintos de los ejes de S).` });
    const mismo = Math.abs(ct - x) < 1e-12 * Math.max(1, Math.abs(ct), Math.abs(x));
    const tipo = mismo || Math.abs(s2) <= 1e-12 * Math.max(1, ct * ct, x * x) ? 'luz' : s2 > 0 ? 'temporal' : 'espacial';
    pasos.push({ t: 'Tipo de evento respecto del origen', html: tipo === 'luz' ? 'Está sobre el cono de luz: lo alcanza un rayo de luz salido del origen.' : tipo === 'temporal' ? `$(c t)^2 > x^2$: el evento es de tipo tiempo. Está dentro del cono de luz, en el ${t >= 0 ? 'futuro' : 'pasado'} absoluto del origen: en todos los sistemas ocurre ${t >= 0 ? 'después' : 'antes'} y puede estar causalmente conectado con él.` : '$x^2 > (c t)^2$: el evento es de tipo espacio. Está fuera del cono de luz: su orden temporal respecto del origen depende del sistema y no puede estar causalmente conectado con él.' });
    return { modo: 'lorentz', U, b, g, x, t, ct, xp, ctp, tp, s2, s2p, tipo, pasos };
  }

  function velocidades(sc) {
    const rel = sc.caso === 'relativa', s = rel ? -1 : 1;
    const u = lee(sc, 'u', rel ? 'la velocidad u del objeto en S (en unidades de c)' : 'la velocidad u del objeto respecto de la nave (en unidades de c)', { min: -1, max: 1 });
    const v = beta(sc, 'v', rel ? 'la velocidad v de S′ respecto de S (en unidades de c)' : 'la velocidad v de la nave (en unidades de c)');
    const w = (u + s * v) / (1 + s * u * v), gal = u + s * v, pasos = [];
    // lo que le falta a |w| para llegar a 1, sin restar números casi iguales: 1 − w = (1 − u)(1 − s v)/(1 + s u v) y 1 + w = (1 + u)(1 + s v)/(1 + s u v)
    const mw = w >= 0 ? ((1 - u) * (1 - s * v)) / (1 + s * u * v) : ((1 + u) * (1 + s * v)) / (1 + s * u * v);
    pasos.push({ t: 'Qué se pide', html: rel ? `Un objeto va a $u = ${n(u, 5)} c$ en S y el sistema S′ va a $v = ${n(v, 5)} c$ respecto de S: ¿qué velocidad tiene el objeto en S′?` : `Una nave va a $v = ${nb(v)} c$ respecto de la Tierra y lanza un objeto a $u = ${nb(u)} c$ respecto de la nave: ¿qué velocidad tiene el objeto respecto de la Tierra?` });
    pasos.push({ t: 'Composición relativista', html: rel ? `$u′ = (u − v)/(1 − u v/c^2) = (${nb(u)} − ${nb(v)})/(1 − ${nb(u)} · ${nb(v)}) = ${mw < 1e-6 ? `${w < 0 ? '−' : ''}(1 − ${n(mw, 4)})` : n(w, 6)} c$` : `$w = (u + v)/(1 + u v/c^2) = (${nb(u)} + ${nb(v)})/(1 + ${nb(u)} · ${nb(v)}) = ${mw < 1e-6 ? `1 − ${n(mw, 4)}` : n(w, 6)} c$` });
    pasos.push({ t: 'Lo que daría la suma de Galileo', html: `$${rel ? 'u − v' : 'u + v'} = ${n(gal, 6)} c$${Math.abs(gal) >= 1 ? ', que supera la velocidad de la luz: por eso no vale a estas velocidades' : ''}. La diferencia con el resultado relativista es ${n(gal - w, 4)} c.` });
    const fu = Math.atanh(u), fv = Math.atanh(v), fw = Math.abs(u) < 1 ? fu + s * fv : Math.atanh(w);
    if (Math.abs(u) === 1) pasos.push({ t: 'Rapideces', html: 'La luz tiene rapidez infinita ($"atanh"(1) = ∞$): por eso su velocidad no cambia al sumar rapideces.' });
    else pasos.push({ t: 'Rapideces', html: `La rapidez $φ = "atanh"(β)$ sí se suma: $φ_u = ${n(fu, 5)}$, $φ_v = ${n(fv, 5)}$, y $φ_w = φ_u ${rel ? '−' : '+'} φ_v = ${n(fw, 5)}$, que da $β = tanh φ_w = ${mw < 1e-6 ? `1 − ${n(mw, 4)}` : n(Math.tanh(fw), 6)}$.` });
    const g = 1 / Math.sqrt(mw * (2 - mw));
    pasos.push({ t: 'Nunca se llega a c', html: `El resultado cumple $|w| < c$ siempre que $|u|, |v| < c$.${Math.abs(w) < 1 ? ` Aquí $γ = ${n(g, 6)}$.` : ''} Si $u = c$ (un rayo de luz), da exactamente $c$ para cualquier $v$: la luz va a $c$ en todos los sistemas.` });
    return { modo: 'velocidades', rel, u, v, w, mw, gal, fu, fv, fw, g, pasos };
  }

  function intervalo(sc) {
    const U = uni(sc), c = U.c;
    const x1 = lee(sc, 'x1', 'la posición x₁'), t1 = lee(sc, 't1', 'el instante t₁'), x2 = lee(sc, 'x2', 'la posición x₂'), t2 = lee(sc, 't2', 'el instante t₂');
    const dx = x2 - x1, dct = c * (t2 - t1), dt = t2 - t1, pasos = [];
    if (dx === 0 && dct === 0) throw new Error('Los dos eventos son el mismo: elige dos distintos');
    pasos.push({ t: 'Diferencias', html: `$Δx = x_2 − x_1 = ${n(dx, 6)} "${U.L}"$ y $c Δt = ${n(dct, 6)} "${U.L}"$ (con $Δt = ${n(dt, 6)} "${U.T}"$).` });
    const s2 = dct * dct - dx * dx, esc = Math.max(dct * dct, dx * dx);
    pasos.push({ t: 'Intervalo', html: `$s^2 = (c Δt)^2 − Δx^2 = ${n(s2, 6)} "${U.L}"^2$.` });
    const tipo = Math.abs(s2) <= 1e-9 * esc ? 'luz' : s2 > 0 ? 'temporal' : 'espacial';
    let beta = null, tau = null, d = null;
    if (tipo === 'temporal') {
      beta = dx / dct; tau = Math.sqrt(s2) / c;
      pasos.push({ t: 'Tipo tiempo', html: `$s^2 > 0$: un observador puede estar en los dos eventos. Para el sistema que se mueve con $β = Δx/(c Δt) = ${n(beta, 6)}$ los dos ocurren en el mismo lugar, y el tiempo que transcurre allí es el tiempo propio $Δτ = √(s^2)/c = ${n(tau, 6)} "${U.T}"$ (menor que $Δt$, y el mismo para todos los observadores que viven ambos sucesos).` });
      pasos.push({ t: 'Causalidad', html: `El orden es el mismo en todos los sistemas: el evento ${dct > 0 ? '2 es posterior al 1' : '1 es posterior al 2'}, y uno puede causar el otro, con una señal más lenta que la luz.` });
    } else if (tipo === 'espacial') {
      beta = dct / dx; d = Math.sqrt(-s2);
      pasos.push({ t: 'Tipo espacio', html: `$s^2 < 0$: ningún observador puede estar en los dos eventos. En el sistema con $β = c Δt/Δx = ${n(beta, 6)}$ los dos son simultáneos, y su distancia es la distancia propia $Δσ = √(−s^2) = ${n(d, 6)} "${U.L}"$ (la menor que mide cualquier observador).` });
      pasos.push({ t: 'Causalidad', html: 'Su orden temporal depende del sistema de referencia (hay sistemas donde el 1 es primero y otros donde lo es el 2), así que ninguno puede ser causa del otro: haría falta una señal más rápida que la luz.' });
    } else pasos.push({ t: 'Tipo luz', html: '$s^2 = 0$: solo los une un rayo de luz. El tiempo propio y la distancia propia son cero, y la luz los conecta igual en todos los sistemas.' });
    return { modo: 'intervalo', U, x1, t1, x2, t2, dx, dt, dct, s2, tipo, beta, tau, d, pasos };
  }

  const R = { lorentz, velocidades, intervalo };
  const resolver = (sc) => (R[sc.modo] || lorentz)(sc);

  const ejemplos = [
    { clave: 'evento', nombre: 'Un evento visto desde una nave a 0,6c', sc: { modo: 'lorentz', unidades: 'al', v: '0,6', x: '4', t: '6' } },
    { clave: 'simultaneo', nombre: 'Evento de tipo espacio: ¿cuándo ocurre en S′?', sc: { modo: 'lorentz', unidades: 'al', v: '0,5', x: '3', t: '1' } },
    { clave: 'nave', nombre: 'Un proyectil a 0,8c lanzado desde una nave a 0,6c', sc: { modo: 'velocidades', caso: 'compone', u: '0,8', v: '0,6' } },
    { clave: 'luz', nombre: 'La luz desde una nave a 0,9c sigue yendo a c', sc: { modo: 'velocidades', caso: 'compone', u: '1', v: '0,9' } },
    { clave: 'relativa', nombre: 'Velocidad relativa de dos naves (0,9c y 0,6c)', sc: { modo: 'velocidades', caso: 'relativa', u: '0,9', v: '0,6' } },
    { clave: 'temporal', nombre: 'Dos eventos de tipo tiempo', sc: { modo: 'intervalo', unidades: 'al', x1: '0', t1: '0', x2: '3', t2: '5' } },
    { clave: 'espacial', nombre: 'Dos eventos de tipo espacio', sc: { modo: 'intervalo', unidades: 'al', x1: '0', t1: '0', x2: '5', t2: '3' } },
  ];

  // sc al azar para el modo práctica
  const azar = () => {
    const r = (a, b, d = 1) => (Math.round((a + Math.random() * (b - a)) * 10 ** d) / 10 ** d).toString().replace('.', ',');
    const modo = ['lorentz', 'velocidades', 'intervalo'][Math.floor(Math.random() * 3)];
    if (modo === 'lorentz') return { modo, unidades: 'al', v: r(0.2, 0.9, 1), x: r(1, 8, 0), t: r(1, 8, 0) };
    if (modo === 'velocidades') return { modo, caso: Math.random() < 0.5 ? 'compone' : 'relativa', u: r(0.3, 0.9, 1), v: r(0.3, 0.9, 1) };
    return { modo, unidades: 'al', x1: '0', t1: '0', x2: r(1, 8, 0), t2: r(1, 8, 0) };
  };

  return { resolver, ejemplos, azar, MODOS, UNIDADES, f };
})();
if (typeof module !== 'undefined') module.exports = Relatividad;
