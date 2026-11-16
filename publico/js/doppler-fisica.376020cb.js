const Doppler = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const fq = (x) => f(x, Math.min(12, Math.max(4, Math.floor(Math.log10(Math.abs(x) || 1)) + 2)));
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }
  const sentido = (v, quien) => (v > 0 ? `${quien} se acerca` : v < 0 ? `${quien} se aleja` : `${quien} está quieto`);
  const tono = (fp, fr) => (fp > fr ? 'Se oye más aguda que la emitida.' : fp < fr ? 'Se oye más grave que la emitida.' : 'Se oye igual que la emitida.');

  function recta(sc) {
    const fr = lee(sc, 'f', 'la frecuencia emitida'), v = lee(sc, 'v', 'la velocidad del sonido');
    const vF0 = lee(sc, 'vF', 'la velocidad de la fuente', { opcional: true, signo: true }) ?? 0;
    const vO0 = lee(sc, 'vO', 'la velocidad del observador', { opcional: true, signo: true }) ?? 0;
    const w = lee(sc, 'w', 'la velocidad del viento', { opcional: true, signo: true }) ?? 0;
    const aF = lee(sc, 'aF', 'el ángulo de la fuente', { opcional: true, signo: true }) ?? 0;
    const aO = lee(sc, 'aO', 'el ángulo del observador', { opcional: true, signo: true }) ?? 0;
    const cos = (a) => (Math.abs(a % 180) === 90 ? 0 : Math.cos((a * Math.PI) / 180));
    const vF = vF0 * cos(aF), vO = vO0 * cos(aO);
    const ve = v + w; // velocidad del sonido respecto al suelo, de la fuente al observador
    if (ve <= 0) throw new Error('El viento en contra es tan fuerte como el sonido: la onda no llega al observador');
    if (vF >= ve) throw new Error('La fuente va hacia el observador a la velocidad del sonido o más deprisa: se forma una onda de choque y la fórmula de Doppler no vale (mira la pestaña «Onda de choque»)');
    if (-vO >= ve) throw new Error('El observador se aleja a la velocidad del sonido o más: no le llega la onda');
    const fp = (fr * (ve + vO)) / (ve - vF), lam = ve / fr, lamp = (ve - vF) / fr;
    const pasos = [
      { t: 'Convenio de signos', html: `Las velocidades son positivas cuando la fuente y el observador se acercan el uno al otro: ${sentido(vF, 'la fuente')} ($v_F = ${f(vF)}$ m/s) y ${sentido(vO, 'el observador')} ($v_O = ${f(vO)}$ m/s).` },
    ];
    if (aF || aO) pasos.unshift({ t: 'Velocidades que se mueven en ángulo', html: `Solo cuenta la componente de cada velocidad a lo largo de la recta que une la fuente con el observador; la perpendicular no acerca ni aleja y no cambia el tono:${aF ? ` $v_F = ${f(vF0)} · cos ${f(aF)}° = ${f(vF)}$ m/s` : ''}${aF && aO ? ',' : ''}${aO ? ` $v_O = ${f(vO0)} · cos ${f(aO)}° = ${f(vO)}$ m/s` : ''}.` });
    if (w) pasos.push({ t: 'Viento', html: `El aire se mueve ${w > 0 ? 'de la fuente hacia el observador' : 'del observador hacia la fuente'}, así que respecto al suelo el sonido va hacia el observador a $v + w = ${f(v)} ${w < 0 ? '−' : '+'} ${f(Math.abs(w))} = ${f(ve)}$ m/s. En la fórmula se pone esa velocidad en lugar de $v$.` });
    const V = w ? 'v + w' : 'v', Vn = w ? `${f(ve)}` : f(v);
    pasos.push({ t: 'Frecuencia que se oye', html: `$f′ = f (${V} + v_O)/(${V} − v_F) = ${fq(fr)} · (${Vn} + ${p(vO)})/(${Vn} − ${p(vF)})$ = <b>${fq(fp)} Hz</b><br>${tono(fp, fr)} El cambio es de ${fp >= fr ? '+' : '−'}${fq(Math.abs(fp - fr))} Hz (${f((100 * (fp - fr)) / fr, 3)} %).` });
    pasos.push({ t: 'Longitud de onda entre los dos', html: `$λ′ = (${V} − v_F)/f = (${Vn} − ${p(vF)})/${fq(fr)}$ = <b>${f(lamp)} m</b><br>Con la fuente quieta sería $λ = ${V}/f = ${f(lam)}$ m. El movimiento del observador no cambia λ: cambia la rapidez con la que le llegan los frentes.` });
    return { modo: 'recta', fr, v, vF, vO, vF0, vO0, aF, aO, w, ve, fp, lam, lamp, pasos };
  }

  function paso(sc) {
    const v = lee(sc, 'v', 'la velocidad del sonido');
    let fr, u, f1, f2;
    const pasos = [];
    if (sc.datos === 'oidas') {
      f1 = lee(sc, 'f1', 'la frecuencia que se oye al acercarse'); f2 = lee(sc, 'f2', 'la frecuencia que se oye al alejarse');
      if (f2 >= f1) throw new Error('Al acercarse la fuente se oye más agudo que al alejarse: f₁ tiene que ser mayor que f₂');
      u = (v * (f1 - f2)) / (f1 + f2); fr = (2 * f1 * f2) / (f1 + f2);
      pasos.push({ t: 'Las dos ecuaciones', html: `Acercándose: $f_1 = f v/(v − u)$ &nbsp; Alejándose: $f_2 = f v/(v + u)$` });
      pasos.push({ t: 'Velocidad de la fuente', html: `Dividiendo una entre otra desaparece $f$: $f_1/f_2 = (v + u)/(v − u)$, y despejando $u = v (f_1 − f_2)/(f_1 + f_2) = ${f(v)} · (${fq(f1)} − ${fq(f2)})/(${fq(f1)} + ${fq(f2)})$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h)` });
      pasos.push({ t: 'Frecuencia que emite', html: `$f = f_1 (v − u)/v = 2 f_1 f_2/(f_1 + f_2) = 2 · ${fq(f1)} · ${fq(f2)}/(${fq(f1)} + ${fq(f2)})$ = <b>${fq(fr)} Hz</b>` });
    } else {
      fr = lee(sc, 'f', 'la frecuencia emitida'); u = lee(sc, 'vF', 'la velocidad de la fuente');
      if (u >= v) throw new Error('La fuente va a la velocidad del sonido o más deprisa: se forma una onda de choque (mira la pestaña «Onda de choque»)');
      f1 = (fr * v) / (v - u); f2 = (fr * v) / (v + u);
      pasos.push({ t: 'Mientras se acerca', html: `$f_1 = f v/(v − v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} − ${f(u)})$ = <b>${fq(f1)} Hz</b>` });
      pasos.push({ t: 'Cuando ya ha pasado y se aleja', html: `$f_2 = f v/(v + v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} + ${f(u)})$ = <b>${fq(f2)} Hz</b>` });
    }
    const salto = f1 - f2;
    pasos.push({ t: 'Salto de frecuencia al pasar', html: `$Δf = f_1 − f_2 = ${fq(f1)} − ${fq(f2)}$ = <b>${fq(salto)} Hz</b>, ${f((1200 * Math.log2(f1 / f2)) / 100, 3)} semitonos (en música, un semitono es un cociente de $2^{1/12}$).` });
    const d = lee(sc, 'd', 'la distancia a la carretera', { opcional: true, cero: true }) ?? 0;
    let curva = null;
    if (d > 0) {
      const L = Math.max(8 * d, 40), xs = [];
      for (let i = 0; i <= 200; i++) { const x = -L + (2 * L * i) / 200, c = -x / Math.hypot(x, d); xs.push({ x, t: x / u, tr: x / u + Math.hypot(x, d) / v, fp: (fr * v) / (v - u * c) }); }
      curva = { d, L, puntos: xs };
      pasos.push({ t: `Observador a ${f(d)} m de la carretera`, html: `Solo cuenta la componente de la velocidad de la fuente en la dirección del observador, $v_F cos α$, con α el ángulo entre la carretera y la recta fuente–observador: $f′ = f v/(v − v_F cos α)$. Lejos, cos α ≈ ±1 y se oyen $f_1$ y $f_2$; justo enfrente, cos α = 0 y se oye la frecuencia emitida, ${fq(fr)} Hz. La gráfica muestra el cambio gradual frente al instante en que se oye: el sonido tarda $r/v$ en llegar, así que el tono que se oye justo cuando la fuente pasa enfrente ya es más grave que $f$.` });
    }
    return { modo: 'paso', datos: sc.datos === 'oidas' ? 'oidas' : 'fuente', fr, v, u, f1, f2, salto, d, curva, pasos };
  }

  function eco(sc) {
    const fr = lee(sc, 'f', 'la frecuencia emitida'), v = lee(sc, 'v', 'la velocidad de la onda');
    const vE = lee(sc, 'vE', 'la velocidad del emisor', { opcional: true, signo: true }) ?? 0;
    if (Math.abs(vE) >= v) throw new Error('El emisor va a la velocidad de la onda o más deprisa: la fórmula de Doppler no vale');
    let u;
    const pasos = [{ t: 'Dos efectos Doppler seguidos', html: `1) El obstáculo recibe la onda como un observador: $f_R = f (v + u)/(v − v_E)$<br>2) La devuelve como una fuente que se mueve con él, y el emisor la oye: $f″ = f_R (v + v_E)/(v − u)$<br>Velocidades positivas cuando se acercan: $v_E$ la del emisor, $u$ la del obstáculo.` }];
    if (sc.buscar === 'velocidad') {
      const df = lee(sc, 'df', 'la diferencia de frecuencias', { signo: true });
      const r = (fr + df) / fr, k = (r * (v - vE)) / (v + vE);
      if (!(r > 0)) throw new Error('La frecuencia del eco tiene que salir positiva: la diferencia es demasiado negativa');
      u = (v * (k - 1)) / (k + 1);
      pasos.push({ t: 'Velocidad del obstáculo', html: `El eco llega con $f″ = f + Δf = ${fq(fr)} + ${p(df)} = ${fq(fr + df)}$ Hz. De $f″/f = (v + u)(v + v_E)/((v − u)(v − v_E))$, con $k = (f″/f)(v − v_E)/(v + v_E) = ${f(k, 6)}$, queda $u = v (k − 1)/(k + 1)$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h), ${u > 0 ? 'acercándose' : u < 0 ? 'alejándose' : 'quieto'}.` });
    } else {
      u = lee(sc, 'u', 'la velocidad del obstáculo', { signo: true });
    }
    if (Math.abs(u) >= v) throw new Error('El obstáculo va a la velocidad de la onda o más deprisa: la fórmula de Doppler no vale');
    const fR = (fr * (v + u)) / (v - vE), fpp = (fR * (v + vE)) / (v - u), df = fpp - fr;
    if (sc.buscar !== 'velocidad') {
      pasos.push({ t: 'Frecuencia que recibe el obstáculo', html: `$f_R = ${fq(fr)} · (${f(v)} + ${p(u)})/(${f(v)} − ${p(vE)})$ = <b>${fq(fR)} Hz</b>` });
      pasos.push({ t: 'Frecuencia del eco', html: `$f″ = ${fq(fR)} · (${f(v)} + ${p(vE)})/(${f(v)} − ${p(u)})$ = <b>${fq(fpp)} Hz</b>` });
    }
    pasos.push({ t: 'Pulsaciones', html: `Al mezclar la onda emitida con el eco se oyen (o se miden) $Δf = f″ − f$ = <b>${fq(df)} Hz</b>${Math.abs(u) + Math.abs(vE) < 0.01 * v ? `<br>Con velocidades mucho menores que v vale la aproximación $Δf ≈ 2 (u + v_E) f/v = ${f((2 * (u + vE) * fr) / v)}$ Hz, la que usan los radares de tráfico.` : ''}` });
    return { modo: 'eco', buscar: sc.buscar === 'velocidad' ? 'velocidad' : 'frecuencia', fr, v, vE, u, fR, fpp, df, pasos };
  }

  function choque(sc) {
    const v = lee(sc, 'v', 'la velocidad del sonido'), vF = lee(sc, 'vF', 'la velocidad de la fuente');
    if (vF <= v) throw new Error('Para que haya onda de choque la fuente tiene que ir más deprisa que el sonido (número de Mach mayor que 1)');
    const M = vF / v, th = Math.asin(v / vF), gr = (th * 180) / Math.PI;
    const pasos = [
      { t: 'Número de Mach', html: `$M = v_F/v = ${f(vF)}/${f(v)}$ = <b>${f(M)}</b>` },
      { t: 'Semiángulo del cono de Mach', html: `Los frentes de onda se quedan atrás y su envolvente es un cono: $sen θ = v/v_F = 1/M = ${f(1 / M)}$, así que θ = <b>${f(gr)}°</b>` },
    ];
    const h = lee(sc, 'h', 'la altura', { opcional: true });
    let x = null, t = null, r = null;
    if (h) {
      x = h / Math.tan(th); t = x / vF; r = h / Math.sin(th);
      pasos.push({ t: 'Cuándo se oye el estampido', html: `El cono llega al suelo detrás del avión. Cuando lo oyes, el avión ya ha pasado sobre ti y está a una distancia horizontal $x = h/tg θ = ${f(h)}/tg ${f(gr)}°$ = <b>${f(x)} m</b>.<br>Ha pasado un tiempo $t = x/v_F$ = <b>${f(t)} s</b> desde que lo tenías encima, y está a $r = h/sen θ = ${f(r)}$ m de ti.` });
    }
    return { modo: 'choque', v, vF, M, th, gr, h, x, t, r, pasos };
  }

  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C = SI.c;
  function luz(sc) {
    const lam = lee(sc, 'lam', 'la longitud de onda emitida');
    const pasos = [];
    let beta, lamO, geo = sc.geo === 'transversal' ? 'transversal' : 'radial';
    if (sc.dato === 'observado') {
      geo = 'radial';
      lamO = lee(sc, 'lamO', 'la longitud de onda observada');
      const R = lamO / lam; beta = (R * R - 1) / (R * R + 1);
      pasos.push({ t: 'Velocidad a partir del corrimiento', html: `Para una fuente que se aleja en línea recta $λ′/λ = √((1 + β)/(1 − β))$. Con $R = λ′/λ = ${f(lamO)}/${f(lam)} = ${f(R, 6)}$ se despeja $β = (R^2 − 1)/(R^2 + 1)$ = <b>${f(beta)}</b>, es decir $v = β c$ = <b>${f(beta * C)} m/s</b> ${beta > 0 ? 'alejándose' : beta < 0 ? 'acercándose' : '(quieta)'}.` });
    } else {
      beta = lee(sc, 'beta', 'β = v/c', { signo: true });
      if (Math.abs(beta) >= 1) throw new Error('Nada va a la velocidad de la luz o más deprisa: β tiene que estar entre −1 y 1');
    }
    const g = 1 / Math.sqrt(1 - beta * beta);
    const k = geo === 'transversal' ? g : Math.sqrt((1 + beta) / (1 - beta)); // λ′/λ
    lamO = lam * k;
    const z = k - 1, kc = geo === 'transversal' ? 1 : 1 + beta, nu = C / (lam * 1e-9);
    if (sc.dato !== 'observado') {
      pasos.push({ t: 'Convenio', html: `$β = v/c = ${f(beta)}$, positiva si la fuente se aleja y negativa si se acerca. Factor de Lorentz $γ = 1/√(1 − β^2) = ${f(g, 6)}$.` });
      pasos.push(geo === 'transversal'
        ? { t: 'Doppler transversal', html: `Si la fuente se mueve perpendicular a la visual no hay efecto clásico, pero su reloj va más lento (dilatación del tiempo): $λ′ = γ λ = ${f(g, 6)} · ${f(lam)}$ = <b>${f(lamO)} nm</b>. Es un efecto puramente relativista.` }
        : { t: 'Doppler relativista', html: `$λ′ = λ √((1 + β)/(1 − β)) = ${f(lam)} · √((1 + ${p(beta)})/(1 − ${p(beta)}))$ = <b>${f(lamO)} nm</b>` });
    }
    pasos.push({ t: 'Frecuencia y corrimiento', html: `$f = c/λ = ${f(nu)}$ Hz y $f′ = f λ/λ′ = ${f(nu / k)}$ Hz. Corrimiento $z = λ′/λ − 1$ = <b>${f(z)}</b>: ${z > 0 ? 'al rojo (la fuente se aleja o su reloj va lento)' : z < 0 ? 'al azul (la fuente se acerca)' : 'ninguno'}.` });
    pasos.push({ t: 'Comparación con la fórmula clásica', html: geo === 'transversal' ? `Clásicamente una fuente que se mueve perpendicular a la visual no cambia el color: $λ′ = λ$. La diferencia, $${f(lamO - lam)}$ nm, es solo de la dilatación del tiempo.` : `Para $|β| ≪ 1$ vale $λ′ ≈ λ (1 + β) = ${f(lam * kc)}$ nm (o $z ≈ β$), que se aleja del valor exacto un ${f((100 * Math.abs(lam * kc - lamO)) / lamO, 3)} %.` });
    return { modo: 'luz', dato: sc.dato === 'observado' ? 'observado' : 'fuente', geo, lam, lamO, beta, g, z, k, nu, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'luz') return luz(sc);
    if (sc.modo === 'paso') return paso(sc);
    if (sc.modo === 'eco') return eco(sc);
    if (sc.modo === 'choque') return choque(sc);
    return recta(sc);
  }

  const ejemplos = [
    { clave: 'ambulancia', nombre: 'Ambulancia que se acerca a un peatón', sc: { modo: 'recta', f: '700', v: '340', vF: '25', vO: '0', w: '' } },
    { clave: 'dos-coches', nombre: 'Dos coches que se alejan', sc: { modo: 'recta', f: '500', v: '340', vF: '-20', vO: '-15', w: '' } },
    { clave: 'viento', nombre: 'Sirena con viento a favor', sc: { modo: 'recta', f: '1000', v: '340', vF: '0', vO: '10', w: '15' } },
    { clave: 'tren', nombre: 'Tren que pasa por una estación', sc: { modo: 'paso', datos: 'fuente', f: '440', v: '343', vF: '30', d: '15' } },
    { clave: 'moto', nombre: 'Velocidad de una moto por cómo suena', sc: { modo: 'paso', datos: 'oidas', f1: '520', f2: '440', v: '340' } },
    { clave: 'radar', nombre: 'Radar de tráfico', sc: { modo: 'eco', buscar: 'frecuencia', f: '24e9', v: '3e8', vE: '0', u: '33' } },
    { clave: 'murcielago', nombre: 'Murciélago que vuela hacia una pared', sc: { modo: 'eco', buscar: 'frecuencia', f: '40000', v: '340', vE: '6', u: '0' } },
    { clave: 'ecografia', nombre: 'Velocidad de la sangre con una ecografía Doppler', sc: { modo: 'eco', buscar: 'velocidad', f: '5e6', v: '1540', vE: '0', df: '1300' } },
    { clave: 'avion', nombre: 'Avión supersónico y estampido', sc: { modo: 'choque', v: '340', vF: '680', h: '8000' } },
    { clave: 'cruce', nombre: 'Coche que cruza en ángulo', sc: { modo: 'recta', f: '600', v: '340', vF: '30', vO: '0', w: '', aF: '60', aO: '' } },
    { clave: 'galaxia', nombre: 'Velocidad de una galaxia por su corrimiento al rojo', sc: { modo: 'luz', dato: 'observado', lam: '656,3', lamO: '721,9' } },
    { clave: 'estrella', nombre: 'Estrella que se acerca a 0,1c', sc: { modo: 'luz', dato: 'fuente', geo: 'radial', lam: '500', beta: '-0,1' } },
    { clave: 'transversal', nombre: 'Doppler transversal a 0,6c', sc: { modo: 'luz', dato: 'fuente', geo: 'transversal', lam: '500', beta: '0,6' } },
  ];

  return { resolver, recta, paso, eco, choque, luz, ejemplos, f, fq, C };
})();

