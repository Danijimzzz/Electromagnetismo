/* =====================================================================
   Tiro parabólico y cinemática (sin DOM).
   tiro: proyectil lanzado desde (0, y0) con v0 y un ángulo sobre la horizontal,
   hasta que cae a la altura yf. Sin rozamiento y con rozamiento lineal
   (a = −b v) la solución es analítica; con rozamiento cuadrático
   (a = −c |v| v) se integra con RK4. Desarrollo paso a paso.
   rectilineo: MRU y MRUA en una dimensión. Unidades del SI.
   ===================================================================== */
const Cinematica = (() => {
  const rad = (g) => (g * Math.PI) / 180, gra = (r) => (r * 180) / Math.PI;
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(2).replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d + 1));
    return s.replace('.', ',').replace('-', '−');
  };
  // « + 2,5» o « − 2,5» para escribir sumas con su signo
  const mas = (x) => (x < 0 ? ` − ${f(-x)}` : ` + ${f(x)}`);
  const num = (v) => +String(v).trim().replace(',', '.');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const n = (sc, k, nom, { min = -Infinity, estricto = false, opcional = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = num(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (estricto ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${estricto ? 'mayor que' : 'al menos'} ${f(min)}`);
    return v;
  };

  /* =================== Tiro parabólico =================== */
  // escena: { v0, ang, y0, yf, g, modelo: 'ninguno'|'lineal'|'cuadratico', b, c, tq, xb, yb }
  function leer(sc) {
    const p = {
      v0: n(sc, 'v0', 'la velocidad inicial', { min: 0 }), ang: n(sc, 'ang', 'el ángulo'), y0: n(sc, 'y0', 'la altura inicial'),
      yf: vacio(sc.yf) ? 0 : n(sc, 'yf', 'la altura del suelo'), g: n(sc, 'g', 'la gravedad', { min: 0, estricto: true }),
      modelo: ['lineal', 'cuadratico'].includes(sc.modelo) ? sc.modelo : 'ninguno',
      tq: n(sc, 'tq', 'el instante', { min: 0, opcional: true }), xb: n(sc, 'xb', 'la x del blanco', { min: 0, estricto: true, opcional: true }), yb: null,
    };
    if (p.ang < -90 || p.ang > 90) throw new Error('El ángulo debe estar entre −90° y 90°');
    if (p.xb !== null) p.yb = vacio(sc.yb) ? 0 : n(sc, 'yb', 'la y del blanco');
    if (p.modelo === 'lineal') p.b = n(sc, 'b', 'el coeficiente b/m', { min: 0, estricto: true });
    if (p.modelo === 'cuadratico') p.c = n(sc, 'c', 'el coeficiente c/m', { min: 0, estricto: true });
    p.vx0 = p.v0 * Math.cos(rad(p.ang)); p.vy0 = p.v0 * Math.sin(rad(p.ang));
    if (Math.abs(p.vx0) < 1e-12) p.vx0 = 0;
    if (Math.abs(p.vy0) < 1e-12) p.vy0 = 0;
    return p;
  }

  // Movimiento: estado(t) → { t, x, y, vx, vy, ax, ay }, con la cima y el impacto
  function ideal(p) {
    const { vx0, vy0, y0, yf, g } = p;
    const estado = (t) => ({ t, x: vx0 * t, y: y0 + vy0 * t - 0.5 * g * t * t, vx: vx0, vy: vy0 - g * t, ax: 0, ay: -g });
    const tc = Math.max(0, vy0 / g);
    const D = vy0 * vy0 + 2 * g * (y0 - yf);
    if (D < 0) return { estado, tc, tv: null };
    return { estado, tc, tv: (vy0 + Math.sqrt(D)) / g };
  }
  function lineal(p) {
    const { vx0, vy0, y0, yf, g, b } = p, vt = g / b;
    const estado = (t) => {
      const e = Math.exp(-b * t), u = -Math.expm1(-b * t); // u = 1 − e sin perder cifras con b t pequeño
      const vx = vx0 * e, vy = (vy0 + vt) * e - vt;
      return { t, x: (vx0 / b) * u, y: y0 + ((vy0 + vt) / b) * u - vt * t, vx, vy, ax: -b * vx, ay: -g - b * vy };
    };
    const tc = vy0 > 0 ? Math.log(1 + vy0 / vt) / b : 0;
    if (estado(tc).y < yf) return { estado, tc, tv: null };
    // después de la cima y(t) solo baja: bisección
    let lo = tc, hi = tc + 1;
    while (estado(hi).y >= yf) { lo = hi; hi *= 2; if (hi > 1e9) return { estado, tc, tv: null }; }
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (estado(m).y >= yf) lo = m; else hi = m; }
    return { estado, tc, tv: (lo + hi) / 2 };
  }
  function cuadratico(p) {
    const { vx0, vy0, y0, yf, g, c } = p;
    const acel = (vx, vy) => { const v = Math.hypot(vx, vy); return [-c * v * vx, -g - c * v * vy]; };
    // paso de referencia a partir del tiempo de caída sin rozamiento
    const ref = ideal(p).tv || (2 * Math.max(Math.abs(vy0), Math.sqrt(g * Math.max(1, Math.abs(y0 - yf))))) / g;
    const dt = Math.max(1e-5, ref / 20000);
    const T = [{ t: 0, x: 0, y: y0, vx: vx0, vy: vy0 }];
    let s = T[0], tc = vy0 > 0 ? null : 0, tv = null;
    for (let i = 0; i < 2e6; i++) {
      const d = (st) => { const [ax, ay] = acel(st.vx, st.vy); return [st.vx, st.vy, ax, ay]; };
      const k1 = d(s);
      const k2 = d({ vx: s.vx + (dt / 2) * k1[2], vy: s.vy + (dt / 2) * k1[3] });
      const k3 = d({ vx: s.vx + (dt / 2) * k2[2], vy: s.vy + (dt / 2) * k2[3] });
      const k4 = d({ vx: s.vx + dt * k3[2], vy: s.vy + dt * k3[3] });
      const nx = { t: s.t + dt,
        x: s.x + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y: s.y + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
        vx: s.vx + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]), vy: s.vy + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]) };
      if (tc === null && nx.vy <= 0) tc = s.t + dt * (s.vy / (s.vy - nx.vy));
      T.push(nx);
      if (s.y >= yf && nx.y < yf && nx.vy < 0) { tv = s.t + dt * ((s.y - yf) / (s.y - nx.y)); break; }
      if (nx.vy < 0 && nx.y < yf && s.y < yf) break; // ya baja por debajo de yf sin haberla alcanzado
      s = nx;
    }
    if (tc === null) tc = 0;
    const estado = (t) => {
      const i = Math.min(T.length - 2, Math.max(0, Math.floor(t / dt)));
      const a = T[i], z = T[i + 1], u = (t - a.t) / dt, o = { t };
      for (const k of ['x', 'y', 'vx', 'vy']) o[k] = a[k] + (z[k] - a[k]) * u;
      [o.ax, o.ay] = acel(o.vx, o.vy);
      return o;
    };
    return { estado, tc, tv, dt };
  }
  const movimiento = (p) => (p.modelo === 'lineal' ? lineal(p) : p.modelo === 'cuadratico' ? cuadratico(p) : ideal(p));

  function resolver(sc) {
    const p = leer(sc), { v0, ang, y0, yf, g, vx0, vy0, modelo } = p;
    const mov = movimiento(p), pasos = [], res = {};
    if (mov.tv === null) throw new Error(yf > y0 ? `El proyectil no llega a la altura del suelo (${f(yf)} m): no sube tanto` : 'El proyectil no vuelve a la altura del suelo');
    if (mov.tv < 1e-9) throw new Error('Con esa altura y ese ángulo el proyectil cae en el mismo instante: no hay vuelo');
    const { estado, tc, tv } = mov;
    const cima = estado(tc), fin = estado(tv);
    Object.assign(res, { tv, alcance: fin.x, tc, hmax: Math.max(cima.y, y0), xc: cima.x, vf: Math.hypot(fin.vx, fin.vy), angf: gra(Math.atan2(fin.vy, fin.vx)), vxf: fin.vx, vyf: fin.vy });
    pasos.push({ t: 'Componentes de la velocidad inicial', html: `v<sub>0x</sub> = v<sub>0</sub> cos α = ${f(v0)} · cos ${f(ang)}° = <b>${f(vx0)} m/s</b> &nbsp; v<sub>0y</sub> = v<sub>0</sub> sen α = ${f(v0)} · sen ${f(ang)}° = <b>${f(vy0)} m/s</b>` });
    if (modelo === 'ninguno') {
      pasos.push({ t: 'Ecuaciones del movimiento', html: `Eje x (MRU): x(t) = ${f(vx0)} t &nbsp; v<sub>x</sub> = ${f(vx0)} m/s<br>Eje y (MRUA, a = −g): y(t) = ${f(y0)}${mas(vy0)} t − ${f(g / 2)} t<sup>2</sup> &nbsp; v<sub>y</sub>(t) = ${f(vy0)} − ${f(g)} t` });
      if (vy0 > 0) pasos.push({ t: 'Altura máxima', html: `En la cima v<sub>y</sub> = 0 ⇒ t<sub>s</sub> = v<sub>0y</sub> / g = <b>${f(tc)} s</b>.<br>y<sub>máx</sub> = y<sub>0</sub> + v<sub>0y</sub><sup>2</sup> / (2 g) = ${f(y0)} + ${f(vy0)}<sup>2</sup> / (2 · ${f(g)}) = <b>${f(res.hmax)} m</b>, en x = ${f(res.xc)} m.` });
      else pasos.push({ t: 'Altura máxima', html: `Como v<sub>0y</sub> ≤ 0 el proyectil no sube: la altura máxima es la inicial, <b>${f(y0)} m</b>.` });
      const ec = `${f(y0)}${mas(vy0)} t − ${f(g / 2)} t<sup>2</sup> = ${f(yf)}`;
      pasos.push({ t: 'Tiempo de vuelo', html: `Cae cuando y(t) = ${f(yf)} m: ${ec} ⇒ t = (v<sub>0y</sub> + √(v<sub>0y</sub><sup>2</sup> + 2 g (y<sub>0</sub> − y<sub>f</sub>))) / g = <b>${f(tv)} s</b>${y0 === yf && vy0 > 0 ? ' (= 2 t<sub>s</sub>, la trayectoria es simétrica)' : ''}.` });
      pasos.push({ t: 'Alcance', html: `x = v<sub>0x</sub> t<sub>v</sub> = ${f(vx0)} · ${f(tv)} = <b>${f(res.alcance)} m</b>${y0 === yf ? `. Al mismo nivel también vale R = v<sub>0</sub><sup>2</sup> sen 2α / g = ${f((v0 * v0 * Math.sin(rad(2 * ang))) / g)} m` : ''}.` });
    } else if (modelo === 'lineal') {
      const { b } = p, vt = g / b;
      pasos.push({ t: 'Ecuaciones con rozamiento lineal', html: `a = −g ĵ − (b/m) v, con b/m = ${f(b)} s<sup>−1</sup>. Velocidad límite v<sub>L</sub> = g / (b/m) = <b>${f(vt)} m/s</b>.<br>v<sub>x</sub>(t) = v<sub>0x</sub> e<sup>−bt/m</sup> &nbsp; x(t) = (v<sub>0x</sub> m / b)(1 − e<sup>−bt/m</sup>), que tiende a ${f(vx0 / b)} m<br>v<sub>y</sub>(t) = (v<sub>0y</sub> + v<sub>L</sub>) e<sup>−bt/m</sup> − v<sub>L</sub> &nbsp; y(t) = y<sub>0</sub> + (v<sub>0y</sub> + v<sub>L</sub>)(m / b)(1 − e<sup>−bt/m</sup>) − v<sub>L</sub> t` });
      pasos.push({ t: 'Altura máxima', html: vy0 > 0 ? `v<sub>y</sub> = 0 ⇒ t<sub>s</sub> = (m / b) ln(1 + v<sub>0y</sub> / v<sub>L</sub>) = <b>${f(tc)} s</b> ⇒ y<sub>máx</sub> = <b>${f(res.hmax)} m</b>, en x = ${f(res.xc)} m.` : `Como v<sub>0y</sub> ≤ 0 no sube: y<sub>máx</sub> = <b>${f(y0)} m</b>.` });
      pasos.push({ t: 'Tiempo de vuelo y alcance', html: `y(t) = ${f(yf)} m no se puede despejar a mano: resolviendo numéricamente, t<sub>v</sub> = <b>${f(tv)} s</b> y el alcance es x(t<sub>v</sub>) = <b>${f(res.alcance)} m</b>.` });
    } else {
      const { c } = p;
      pasos.push({ t: 'Ecuaciones con rozamiento cuadrático', html: `a = −g ĵ − (c/m) |v| v, con c/m = ${f(c)} m<sup>−1</sup>. Velocidad límite en caída v<sub>L</sub> = √(g / (c/m)) = <b>${f(Math.sqrt(g / c))} m/s</b>.<br>Las componentes están acopladas y no hay solución cerrada: se integra numéricamente (Runge-Kutta de orden 4, Δt = ${f(mov.dt)} s).` });
      pasos.push({ t: 'Resultados de la integración', html: `${vy0 > 0 ? `Cima en t<sub>s</sub> = <b>${f(tc)} s</b>, y<sub>máx</sub> = <b>${f(res.hmax)} m</b> en x = ${f(res.xc)} m. ` : ''}Llega a y = ${f(yf)} m en t<sub>v</sub> = <b>${f(tv)} s</b>, con alcance <b>${f(res.alcance)} m</b>.` });
    }
    pasos.push({ t: 'Velocidad al caer', html: `v<sub>x</sub> = ${f(fin.vx)} m/s, v<sub>y</sub> = ${f(fin.vy)} m/s ⇒ |v| = √(v<sub>x</sub><sup>2</sup> + v<sub>y</sub><sup>2</sup>) = <b>${f(res.vf)} m/s</b>, a ${f(Math.abs(res.angf))}° ${res.angf <= 0 ? 'por debajo' : 'por encima'} de la horizontal.` });
    if (modelo !== 'ninguno') {
      const sin = ideal(p);
      if (sin.tv) {
        res.alcanceIdeal = sin.estado(sin.tv).x; res.hmaxIdeal = Math.max(sin.estado(sin.tc).y, y0);
        pasos.push({ t: 'Comparación sin rozamiento', html: `Sin rozamiento llegaría a ${f(res.alcanceIdeal)} m (y<sub>máx</sub> = ${f(res.hmaxIdeal)} m): el aire le quita un <b>${f(100 * (1 - res.alcance / res.alcanceIdeal), 2)} %</b> del alcance. Es la línea a trazos del dibujo.` });
      }
    }
    if (p.tq !== null) {
      if (p.tq > tv) pasos.push({ t: `En t = ${f(p.tq)} s`, html: `Para entonces ya ha caído (t<sub>v</sub> = ${f(tv)} s).` });
      else {
        const e = estado(p.tq);
        res.enT = e;
        pasos.push({ t: `En t = ${f(p.tq)} s`, html: `Posición (${f(e.x)}, ${f(e.y)}) m · velocidad (${f(e.vx)}, ${f(e.vy)}) m/s, |v| = <b>${f(Math.hypot(e.vx, e.vy))} m/s</b> · aceleración (${f(e.ax)}, ${f(e.ay)}) m/s<sup>2</sup>${modelo === 'ninguno' ? '' : `, |a| = ${f(Math.hypot(e.ax, e.ay))} m/s<sup>2</sup>`}.` });
      }
    }
    if (p.xb !== null) res.blanco = blanco(p, mov, pasos);
    return { p, pasos, res };
  }

  // ¿pasa por el blanco (xb, yb)? y, sin rozamiento, con qué ángulos se acierta
  function blanco(p, mov, pasos) {
    const { xb, yb, v0, g, y0, vx0 } = p, out = {};
    const fin = mov.estado(mov.tv);
    let texto;
    if (vx0 <= 0 || xb > fin.x) texto = `El proyectil cae antes de llegar a x = ${f(xb)} m.`;
    else {
      let t;
      if (p.modelo === 'ninguno') t = xb / vx0;
      else { let lo = 0, hi = mov.tv; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (mov.estado(m).x < xb) lo = m; else hi = m; } t = (lo + hi) / 2; }
      const y = mov.estado(t).y;
      out.y = y; out.t = t; out.dif = y - yb;
      const acierta = Math.abs(out.dif) < 0.005 * Math.max(1, Math.abs(yb), xb / 100);
      texto = `${p.modelo === 'ninguno' ? `t = x / v<sub>0x</sub> = ${f(t)} s ⇒ y = y<sub>0</sub> + v<sub>0y</sub> t − ½ g t<sup>2</sup>` : `En t = ${f(t)} s`} = <b>${f(y)} m</b>: ${acierta ? '<b>da en el blanco</b>.' : `pasa <b>${f(Math.abs(out.dif))} m ${out.dif > 0 ? 'por encima' : 'por debajo'}</b> del blanco.`}`;
    }
    if (p.modelo === 'ninguno') {
      // y = y0 + x tg α − g x² (1 + tg² α) / (2 v0²) ⇒ cuadrática en tg α
      const Y = yb - y0, A = (g * xb * xb) / (2 * v0 * v0), D = xb * xb - 4 * A * (A + Y);
      if (v0 === 0 || D < 0) {
        const vmin = Math.sqrt(g * (Y + Math.hypot(xb, Y)));
        out.vmin = vmin;
        texto += `<br>Con v<sub>0</sub> = ${f(v0)} m/s ningún ángulo llega: hace falta al menos v<sub>0</sub> = √(g (Δy + √(x<sup>2</sup> + Δy<sup>2</sup>))) = <b>${f(vmin)} m/s</b>.`;
      } else {
        const a1 = gra(Math.atan((xb - Math.sqrt(D)) / (2 * A))), a2 = gra(Math.atan((xb + Math.sqrt(D)) / (2 * A)));
        out.angulos = D === 0 ? [a1] : [a1, a2];
        texto += `<br>Para acertar con v<sub>0</sub> = ${f(v0)} m/s: y<sub>b</sub> − y<sub>0</sub> = x tg α − g x<sup>2</sup> (1 + tg<sup>2</sup> α) / (2 v<sub>0</sub><sup>2</sup>) ⇒ ${f(A)} tg<sup>2</sup> α − ${f(xb)} tg α + ${f(A + Y)} = 0 ⇒ <b>α = ${out.angulos.map((a) => f(a) + '°').join(' o α = ')}</b>${out.angulos.length > 1 ? ' (tiro tenso y tiro por elevación)' : ''}.`;
      }
    }
    pasos.push({ t: `Blanco en (${f(xb)}, ${f(yb)}) m`, html: texto });
    return out;
  }

  // puntos de la trayectoria para dibujar y para las gráficas
  function trayectoria(sc, N = 400) {
    const p = leer(sc), mov = movimiento(p);
    const T = mov.tv || 0, puntos = [];
    for (let i = 0; i <= N; i++) puntos.push(mov.estado((T * i) / N));
    let ideal_ = null;
    if (p.modelo !== 'ninguno') {
      const s = ideal(p);
      if (s.tv) { ideal_ = []; for (let i = 0; i <= N; i++) ideal_.push(s.estado((s.tv * i) / N)); }
    }
    return { p, puntos, ideal: ideal_, tv: T, tc: mov.tc, estado: mov.estado };
  }

  /* =================== Movimiento rectilíneo =================== */
  // escena: { x0, v0, a, tq, xq }
  function rectilineo(sc) {
    const x0 = n(sc, 'x0', 'la posición inicial'), v0 = n(sc, 'v0', 'la velocidad inicial'), a = n(sc, 'a', 'la aceleración');
    const tq = n(sc, 'tq', 'el instante', { min: 0, opcional: true }), xq = n(sc, 'xq', 'la posición buscada', { opcional: true });
    const x = (t) => x0 + v0 * t + 0.5 * a * t * t, v = (t) => v0 + a * t;
    const pasos = [], res = { tipo: a === 0 ? 'MRU' : 'MRUA' };
    pasos.push({ t: a === 0 ? 'Movimiento rectilíneo uniforme' : 'Movimiento rectilíneo uniformemente acelerado', html: a === 0
      ? `x(t) = x<sub>0</sub> + v t = ${f(x0)}${mas(v0)} t &nbsp; v = ${f(v0)} m/s constante`
      : `x(t) = x<sub>0</sub> + v<sub>0</sub> t + ½ a t<sup>2</sup> = ${f(x0)}${mas(v0)} t${mas(a / 2)} t<sup>2</sup><br>v(t) = v<sub>0</sub> + a t = ${f(v0)}${mas(a)} t &nbsp; a = ${f(a)} m/s<sup>2</sup>` });
    // ¿se para y da la vuelta?
    if (a !== 0 && v0 * a < 0) {
      res.tParada = -v0 / a; res.xParada = x(res.tParada);
      pasos.push({ t: 'Se para', html: `v(t) = 0 ⇒ t = −v<sub>0</sub> / a = <b>${f(res.tParada)} s</b>, en x = <b>${f(res.xParada)} m</b> (recorre ${f(Math.abs(res.xParada - x0))} m frenando: v<sub>0</sub><sup>2</sup> = 2 |a| d). Después vuelve hacia atrás.` });
    }
    if (tq !== null) {
      res.xEnT = x(tq); res.vEnT = v(tq);
      pasos.push({ t: `En t = ${f(tq)} s`, html: `x = ${f(x0)}${mas(v0)} · ${f(tq)}${a ? `${mas(a / 2)} · ${f(tq)}<sup>2</sup>` : ''} = <b>${f(res.xEnT)} m</b> &nbsp; v = <b>${f(res.vEnT)} m/s</b>` });
    }
    if (xq !== null) {
      let ts;
      if (a === 0) ts = v0 === 0 ? [] : [(xq - x0) / v0].filter((t) => t >= 0);
      else {
        const D = v0 * v0 - 2 * a * (x0 - xq);
        ts = D < 0 ? [] : [...new Set([(-v0 - Math.sqrt(D)) / a, (-v0 + Math.sqrt(D)) / a])].filter((t) => t >= -1e-12).map((t) => Math.max(0, t)).sort((p, q) => p - q);
      }
      res.tEnX = ts;
      const ec = a === 0 ? `${f(x0)}${mas(v0)} t = ${f(xq)}` : `${f(a / 2)} t<sup>2</sup>${mas(v0)} t${mas(x0 - xq)} = 0`;
      pasos.push({ t: `¿Cuándo pasa por x = ${f(xq)} m?`, html: `${ec} ⇒ ${ts.length ? ts.map((t) => `<b>t = ${f(t)} s</b> (v = ${f(v(t))} m/s)`).join(' y ') : '<b>nunca</b> (con t ≥ 0)'}.` });
    }
    // duración de la gráfica
    const marcas = [tq, ...(res.tEnX || []), res.tParada !== undefined ? 2 * res.tParada : null].filter((t) => t !== null && t > 0);
    const T = marcas.length ? Math.max(...marcas) * 1.15 : 10;
    return { p: { x0, v0, a, tq, xq }, pasos, res, x, v, T };
  }

  const ejemplos = [
    { clave: 'clasico', nombre: 'Tiro a 45° desde el suelo', sc: { v0: 20, ang: 45, y0: 0, yf: 0, g: 9.81, modelo: 'ninguno' } },
    { clave: 'horizontal', nombre: 'Lanzamiento horizontal desde un edificio', sc: { v0: 15, ang: 0, y0: 20, yf: 0, g: 9.81, modelo: 'ninguno' } },
    { clave: 'acantilado', nombre: 'Hacia arriba desde un acantilado', sc: { v0: 25, ang: 30, y0: 10, yf: 0, g: 9.81, modelo: 'ninguno', tq: 1.5 } },
    { clave: 'plataforma', nombre: 'Cae en una plataforma más alta', sc: { v0: 18, ang: 60, y0: 0, yf: 5, g: 9.81, modelo: 'ninguno' } },
    { clave: 'blanco', nombre: 'Blanco: ¿con qué ángulo se acierta?', sc: { v0: 30, ang: 40, y0: 0, yf: 0, g: 9.81, modelo: 'ninguno', xb: 60, yb: 5 } },
    { clave: 'caida-libre', nombre: 'Caída libre', sc: { v0: 0, ang: 0, y0: 45, yf: 0, g: 9.81, modelo: 'ninguno' } },
    { clave: 'lineal', nombre: 'Con rozamiento lineal', sc: { v0: 30, ang: 45, y0: 0, yf: 0, g: 9.81, modelo: 'lineal', b: 0.2 } },
    { clave: 'beisbol', nombre: 'Pelota de béisbol (rozamiento cuadrático)', sc: { v0: 40, ang: 35, y0: 1, yf: 0, g: 9.81, modelo: 'cuadratico', c: 0.0052 } },
  ];
  const ejemplosRecta = [
    { clave: 'frenada', nombre: 'Frenada hasta pararse', sc: { x0: 0, v0: 25, a: -5 } },
    { clave: 'arranque', nombre: 'Arranque: ¿cuándo llega a 100 m?', sc: { x0: 0, v0: 0, a: 2, xq: 100 } },
    { clave: 'mru', nombre: 'Velocidad constante', sc: { x0: 10, v0: 12, a: 0, tq: 5 } },
    { clave: 'vertical', nombre: 'Lanzamiento vertical hacia arriba', sc: { x0: 0, v0: 20, a: -9.81, xq: 0 } },
  ];

  return { leer, resolver, trayectoria, rectilineo, ejemplos, ejemplosRecta, f };
})();
if (typeof module !== 'undefined') module.exports = Cinematica;
