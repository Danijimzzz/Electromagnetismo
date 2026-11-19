const Cinematica = (() => {
  const rad = (g) => (g * Math.PI) / 180, gra = (r) => (r * 180) / Math.PI;
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(2).replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d + 1));
    return s.replace('.', ',').replace('-', '−');
  };
  const mas = (x) => (x < 0 ? ` − ${f(-x)}` : ` + ${f(x)}`);
  const num = (v) => +String(v).trim().replace(',', '.');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const n = (sc, k, nom, { min = -Infinity, estricto = false, opcional = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Es fehlt ${nom}`); }
    const v = num(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`);
    if (estricto ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${estricto ? 'größer als' : 'mindestens'} ${f(min)} sein`);
    return v;
  };

  function leer(sc) {
    const p = {
      v0: n(sc, 'v0', 'die Anfangsgeschwindigkeit', { min: 0 }), ang: n(sc, 'ang', 'der Winkel'), y0: n(sc, 'y0', 'die Anfangshöhe'),
      yf: vacio(sc.yf) ? 0 : n(sc, 'yf', 'die Höhe des Bodens'), g: n(sc, 'g', 'die Erdbeschleunigung', { min: 0, estricto: true }),
      modelo: ['lineal', 'cuadratico'].includes(sc.modelo) ? sc.modelo : 'ninguno', familia: sc.familia === 'si',
      tq: n(sc, 'tq', 'der Zeitpunkt', { min: 0, opcional: true }), xb: n(sc, 'xb', 'das x des Ziels', { min: 0, estricto: true, opcional: true }), yb: null,
    };
    if (p.ang < -90 || p.ang > 90) throw new Error('Der Winkel muss zwischen −90° und 90° liegen');
    if (p.xb !== null) p.yb = vacio(sc.yb) ? 0 : n(sc, 'yb', 'das y des Ziels');
    if (p.modelo === 'lineal') p.b = n(sc, 'b', 'der Koeffizient b/m', { min: 0, estricto: true });
    if (p.modelo === 'cuadratico') p.c = n(sc, 'c', 'der Koeffizient c/m', { min: 0, estricto: true });
    p.vx0 = p.v0 * Math.cos(rad(p.ang)); p.vy0 = p.v0 * Math.sin(rad(p.ang));
    if (Math.abs(p.vx0) < 1e-12) p.vx0 = 0;
    if (Math.abs(p.vy0) < 1e-12) p.vy0 = 0;
    return p;
  }

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
    let lo = tc, hi = tc + 1;
    while (estado(hi).y >= yf) { lo = hi; hi *= 2; if (hi > 1e9) return { estado, tc, tv: null }; }
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (estado(m).y >= yf) lo = m; else hi = m; }
    return { estado, tc, tv: (lo + hi) / 2 };
  }
  function cuadratico(p) {
    const { vx0, vy0, y0, yf, g, c } = p;
    const acel = (vx, vy) => { const v = Math.hypot(vx, vy); return [-c * v * vx, -g - c * v * vy]; };
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
    if (mov.tv === null) throw new Error(yf > y0 ? `Das Geschoss erreicht die Höhe des Bodens nicht (${f(yf)} m): Es steigt nicht so hoch` : 'Das Geschoss kehrt nicht auf die Höhe des Bodens zurück');
    if (mov.tv < 1e-9) throw new Error('Mit dieser Höhe und diesem Winkel fällt das Geschoss sofort: kein Flug');
    const { estado, tc, tv } = mov;
    const cima = estado(tc), fin = estado(tv);
    Object.assign(res, { tv, alcance: fin.x, tc, hmax: Math.max(cima.y, y0), xc: cima.x, vf: Math.hypot(fin.vx, fin.vy), angf: gra(Math.atan2(fin.vy, fin.vx)), vxf: fin.vx, vyf: fin.vy });
    pasos.push({ t: 'Komponenten der Anfangsgeschwindigkeit', html: `$v_0x = v_0 cos α = ${f(v0)} · cos ${f(ang)}°$ = <b>${f(vx0)} m/s</b> &nbsp; $v_0y = v_0 sin α = ${f(v0)} · sin ${f(ang)}°$ = <b>${f(vy0)} m/s</b>` });
    if (modelo === 'ninguno') {
      pasos.push({ t: 'Bewegungsgleichungen', html: `x-Achse (gleichförmig): $x(t) = ${f(vx0)} t$ &nbsp; $v_x = ${f(vx0)} "m/s"$<br>y-Achse (gleichmäßig beschleunigt, a = −g): $y(t) = ${f(y0)}${mas(vy0)} t − ${f(g / 2)} t^2$ &nbsp; $v_y(t) = ${f(vy0)} − ${f(g)} t$` });
      if (vy0 > 0) pasos.push({ t: 'Maximale Höhe', html: `Im Scheitelpunkt gilt $v_y = 0 ⇒ t_s = v_0y/g$ = <b>${f(tc)} s</b>.<br>$y_{max} = y_0 + v_0y^2/(2g) = ${f(y0)} + ${f(vy0)}^2/(2 · ${f(g)})$ = <b>${f(res.hmax)} m</b>, bei x = ${f(res.xc)} m.` });
      else pasos.push({ t: 'Maximale Höhe', html: `Da $v_0y ≤ 0$, steigt das Geschoss nicht: Die maximale Höhe ist die Anfangshöhe, <b>${f(y0)} m</b>.` });
      const ec = `$${f(y0)}${mas(vy0)} t − ${f(g / 2)} t^2 = ${f(yf)}$`;
      pasos.push({ t: 'Flugzeit', html: `Es fällt, wenn y(t) = ${f(yf)} m: ${ec} ⇒ $t = {v_0y + √(v_0y^2 + 2g(y_0 − y_f))}/g$ = <b>${f(tv)} s</b>${y0 === yf && vy0 > 0 ? ' ($= 2t_s$, die Bahn ist symmetrisch)' : ''}.` });
      pasos.push({ t: 'Wurfweite', html: `$x = v_0x t_v = ${f(vx0)} · ${f(tv)}$ = <b>${f(res.alcance)} m</b>${y0 === yf ? `. Auf gleicher Höhe gilt auch $R = {v_0^2 sin 2α}/g$ = ${f((v0 * v0 * Math.sin(rad(2 * ang))) / g)} m` : ''}.` });
      const op = optimo(p);
      if (op) {
        Object.assign(res, op);
        pasos.push({ t: 'Winkel maximaler Reichweite', html: y0 === yf
          ? `Auf gleicher Höhe ist $R = {v_0^2 sin 2α}/g$ maximal für $sin 2α = 1 ⇒ α = 45°$: $R_{max} = v_0^2/g$ = <b>${f(op.Rmax)} m</b>.`
          : `Bei Höhenunterschied $h = y_0 − y_f = ${f(y0 - yf)} "m"$ ist der beste Winkel nicht mehr 45°: $tan α = v_0/√(v_0^2 + 2g h)$ ⇒ <b>α = ${f(op.angOpt)}°</b> ⇒ $R_{max} = {v_0 √(v_0^2 + 2g h)}/g$ = <b>${f(op.Rmax)} m</b>.` });
      }
      if (p.familia) pasos.push({ t: 'Sicherheitsparabel', html: `Mit $v_0 = ${f(v0)} "m/s"$ und beliebigem Winkel verläuft kein Wurf oberhalb von $y = y_0 + v_0^2/(2g) − {g x^2}/{2 v_0^2} = ${f(y0 + (v0 * v0) / (2 * g))} − ${f(g / (2 * v0 * v0))} x^2$, der Einhüllenden aller Bahnen (gestrichelt in der Zeichnung).` });
    } else if (modelo === 'lineal') {
      const { b } = p, vt = g / b;
      pasos.push({ t: 'Gleichungen mit linearer Reibung', html: `$a = −g ĵ − (b/m) v$, mit $b/m = ${f(b)} "s"^−1$. Grenzgeschwindigkeit $v_L = g/(b/m)$ = <b>${f(vt)} m/s</b>.<br>$v_x(t) = v_0x e^{−bt/m}$ &nbsp; $x(t) = {v_0x m}/b (1 − e^{−bt/m})$, was gegen ${f(vx0 / b)} m strebt<br>$v_y(t) = (v_0y + v_L) e^{−bt/m} − v_L$ &nbsp; $y(t) = y_0 + (v_0y + v_L) m/b (1 − e^{−bt/m}) − v_L t$` });
      pasos.push({ t: 'Maximale Höhe', html: vy0 > 0 ? `$v_y = 0 ⇒ t_s = m/b ln(1 + v_0y/v_L)$ = <b>${f(tc)} s</b> ⇒ $y_{max}$ = <b>${f(res.hmax)} m</b>, bei x = ${f(res.xc)} m.` : `Da $v_0y ≤ 0$, steigt es nicht: $y_{max}$ = <b>${f(y0)} m</b>.` });
      pasos.push({ t: 'Flugzeit und Wurfweite', html: `$y(t) = ${f(yf)} "m"$ lässt sich nicht von Hand auflösen: Numerisch gelöst ist $t_v$ = <b>${f(tv)} s</b> und die Wurfweite $x(t_v)$ = <b>${f(res.alcance)} m</b>.` });
    } else {
      const { c } = p;
      pasos.push({ t: 'Gleichungen mit quadratischer Reibung', html: `$a = −g ĵ − (c/m) |v| v$, mit $c/m = ${f(c)} "m"^−1$. Grenzgeschwindigkeit im Fall $v_L = √(g/(c/m))$ = <b>${f(Math.sqrt(g / c))} m/s</b>.<br>Die Komponenten sind gekoppelt und es gibt keine geschlossene Lösung: Es wird numerisch integriert (Runge-Kutta 4. Ordnung, $Δt = ${f(mov.dt)} "s"$).` });
      pasos.push({ t: 'Ergebnisse der Integration', html: `${vy0 > 0 ? `Scheitelpunkt bei $t_s$ = <b>${f(tc)} s</b>, $y_{max}$ = <b>${f(res.hmax)} m</b> bei x = ${f(res.xc)} m. ` : ''}Erreicht y = ${f(yf)} m bei $t_v$ = <b>${f(tv)} s</b>, mit Wurfweite <b>${f(res.alcance)} m</b>.` });
    }
    pasos.push({ t: 'Aufprallgeschwindigkeit', html: `$v_x = ${f(fin.vx)} "m/s"$, $v_y = ${f(fin.vy)} "m/s" ⇒ |v| = √(v_x^2 + v_y^2)$ = <b>${f(res.vf)} m/s</b>, unter ${f(Math.abs(res.angf))}° ${res.angf <= 0 ? 'unterhalb' : 'oberhalb'} der Horizontalen.` });
    if (modelo !== 'ninguno') {
      const sin = ideal(p);
      if (sin.tv) {
        res.alcanceIdeal = sin.estado(sin.tv).x; res.hmaxIdeal = Math.max(sin.estado(sin.tc).y, y0);
        pasos.push({ t: 'Vergleich ohne Reibung', html: `Ohne Reibung käme es ${f(res.alcanceIdeal)} m weit ($y_{max}$ = ${f(res.hmaxIdeal)} m): Die Luft nimmt ihm <b>${f(100 * (1 - res.alcance / res.alcanceIdeal), 2)} %</b> der Wurfweite. Das ist die gestrichelte Linie in der Zeichnung.` });
      }
    }
    if (p.tq !== null) {
      if (p.tq > tv) pasos.push({ t: `Bei t = ${f(p.tq)} s`, html: `Dann ist es schon gefallen ($t_v$ = ${f(tv)} s).` });
      else {
        const e = estado(p.tq);
        res.enT = e;
        pasos.push({ t: `Bei t = ${f(p.tq)} s`, html: `Ort (${f(e.x)}, ${f(e.y)}) m · Geschwindigkeit (${f(e.vx)}, ${f(e.vy)}) m/s, |v| = <b>${f(Math.hypot(e.vx, e.vy))} m/s</b> · Beschleunigung (${f(e.ax)}, ${f(e.ay)}) m/s²${modelo === 'ninguno' ? '' : `, |a| = ${f(Math.hypot(e.ax, e.ay))} m/s²`}.` });
      }
    }
    if (p.xb !== null) res.blanco = blanco(p, mov, pasos);
    return { p, pasos, res };
  }

  function optimo({ v0, g, y0, yf }) {
    const D = v0 * v0 + 2 * g * (y0 - yf);
    if (!(v0 > 0) || D <= 0) return null;
    return { angOpt: gra(Math.atan(v0 / Math.sqrt(D))), Rmax: (v0 * Math.sqrt(D)) / g };
  }

  function blanco(p, mov, pasos) {
    const { xb, yb, v0, g, y0, vx0, ang } = p, out = {};
    const fin = mov.estado(mov.tv);
    let texto;
    if (vx0 <= 0 || xb > fin.x) texto = `Das Geschoss fällt, bevor es x = ${f(xb)} m erreicht.`;
    else {
      let t;
      if (p.modelo === 'ninguno') t = xb / vx0;
      else { let lo = 0, hi = mov.tv; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (mov.estado(m).x < xb) lo = m; else hi = m; } t = (lo + hi) / 2; }
      const y = mov.estado(t).y;
      out.y = y; out.t = t; out.dif = y - yb;
      const acierta = Math.abs(out.dif) < 0.005 * Math.max(1, Math.abs(yb), xb / 100);
      texto = `${p.modelo === 'ninguno' ? `$t = x/v_0x = ${f(t)} "s" ⇒ y = y_0 + v_0y t − 1/2 g t^2$` : `Bei t = ${f(t)} s`} = <b>${f(y)} m</b>: ${acierta ? '<b>trifft das Ziel</b>.' : `geht <b>${f(Math.abs(out.dif))} m ${out.dif > 0 ? 'oberhalb' : 'unterhalb'}</b> des Ziels vorbei.`}`;
    }
    if (p.modelo === 'ninguno') {
      const Y = yb - y0, A = (g * xb * xb) / (2 * v0 * v0), D = xb * xb - 4 * A * (A + Y);
      if (v0 === 0 || D < 0) {
        const vmin = Math.sqrt(g * (Y + Math.hypot(xb, Y)));
        out.vmin = vmin;
        texto += `<br>Mit $v_0 = ${f(v0)} "m/s"$ erreicht kein Winkel das Ziel: Nötig sind mindestens $v_0 = √(g(Δy + √(x^2 + Δy^2)))$ = <b>${f(vmin)} m/s</b>.`;
      } else {
        const a1 = gra(Math.atan((xb - Math.sqrt(D)) / (2 * A))), a2 = gra(Math.atan((xb + Math.sqrt(D)) / (2 * A)));
        out.angulos = D === 0 ? [a1] : [a1, a2];
        texto += `<br>Um mit $v_0 = ${f(v0)} "m/s"$ zu treffen: $y_b − y_0 = x tan α − {g x^2 (1 + tan^2 α)}/{2 v_0^2} ⇒ ${f(A)} tan^2 α − ${f(xb)} tan α + ${f(A + Y)} = 0$ ⇒ <b>α = ${out.angulos.map((a) => f(a) + '°').join(' oder α = ')}</b>${out.angulos.length > 1 ? ' (flache und steile Bahn)' : ''}.`;
      }
      const ca = Math.cos(rad(ang)), den = xb * Math.tan(rad(ang)) - Y;
      if (ca > 1e-9 && den > 0) {
        out.v0nec = Math.sqrt((g * xb * xb) / (2 * ca * ca * den));
        texto += `<br>Um mit $α = ${f(ang)}°$ zu treffen: $v_0 = √({g x^2}/{2 cos^2 α (x tan α − Δy)})$ = <b>${f(out.v0nec)} m/s</b>.`;
      } else texto += `<br>Mit $α = ${f(ang)}°$ trifft man mit keiner Geschwindigkeit: Das Ziel liegt oberhalb der Abwurfgeraden.`;
    }
    pasos.push({ t: `Ziel bei (${f(xb)}, ${f(yb)}) m`, html: texto });
    return out;
  }

  function trayectoria(sc, N = 400) {
    const p = leer(sc), mov = movimiento(p);
    const T = mov.tv || 0, puntos = [];
    for (let i = 0; i <= N; i++) puntos.push(mov.estado((T * i) / N));
    let ideal_ = null;
    if (p.modelo !== 'ninguno') {
      const s = ideal(p);
      if (s.tv) { ideal_ = []; for (let i = 0; i <= N; i++) ideal_.push(s.estado((s.tv * i) / N)); }
    }
    let familia = null, envolvente = null;
    if (p.familia && p.v0 > 0) {
      const op = optimo(p), angs = [15, 30, 45, 60, 75];
      if (op && Math.abs(op.angOpt - 45) > 0.5) angs.push(op.angOpt);
      familia = [];
      for (const a of angs.sort((u, v) => u - v)) {
        const q = { ...p, ang: a, vx0: p.v0 * Math.cos(rad(a)), vy0: p.v0 * Math.sin(rad(a)) }, s = ideal(q);
        if (!s.tv) continue;
        const P = []; for (let i = 0; i <= 120; i++) P.push(s.estado((s.tv * i) / 120));
        familia.push({ ang: a, optimo: op && a === op.angOpt, puntos: P });
      }
      const k = p.g / (2 * p.v0 * p.v0), y = (x) => p.y0 + 1 / (4 * k) - k * x * x, xf = Math.sqrt(Math.max(0, (p.y0 + 1 / (4 * k) - p.yf) / k));
      envolvente = []; for (let i = 0; i <= 120; i++) { const x = (xf * i) / 120; envolvente.push({ x, y: y(x) }); }
    }
    return { p, puntos, ideal: ideal_, tv: T, tc: mov.tc, estado: mov.estado, familia, envolvente };
  }

  function rectilineo(sc) {
    const x0 = n(sc, 'x0', 'der Anfangsort'), v0 = n(sc, 'v0', 'die Anfangsgeschwindigkeit'), a = n(sc, 'a', 'die Beschleunigung');
    const tq = n(sc, 'tq', 'der Zeitpunkt', { min: 0, opcional: true }), xq = n(sc, 'xq', 'der gesuchte Ort', { opcional: true });
    const x = (t) => x0 + v0 * t + 0.5 * a * t * t, v = (t) => v0 + a * t;
    const pasos = [], res = { tipo: a === 0 ? 'MRU' : 'MRUA' };
    pasos.push({ t: a === 0 ? 'Gleichförmige geradlinige Bewegung' : 'Gleichmäßig beschleunigte geradlinige Bewegung', html: a === 0
      ? `$x(t) = x_0 + v t = ${f(x0)}${mas(v0)} t$ &nbsp; v = ${f(v0)} m/s konstant`
      : `$x(t) = x_0 + v_0 t + 1/2 a t^2 = ${f(x0)}${mas(v0)} t${mas(a / 2)} t^2$<br>$v(t) = v_0 + a t = ${f(v0)}${mas(a)} t$ &nbsp; a = ${f(a)} m/s²` });
    if (a !== 0 && v0 * a < 0) {
      res.tParada = -v0 / a; res.xParada = x(res.tParada);
      pasos.push({ t: 'Bleibt stehen', html: `$v(t) = 0 ⇒ t = −v_0/a$ = <b>${f(res.tParada)} s</b>, bei x = <b>${f(res.xParada)} m</b> (legt beim Bremsen ${f(Math.abs(res.xParada - x0))} m zurück: $v_0^2 = 2|a| d$). Danach kehrt er um.` });
    }
    if (tq !== null) {
      res.xEnT = x(tq); res.vEnT = v(tq);
      pasos.push({ t: `Bei t = ${f(tq)} s`, html: `$x = ${f(x0)}${mas(v0)} · ${f(tq)}${a ? `${mas(a / 2)} · ${f(tq)}^2` : ''}$ = <b>${f(res.xEnT)} m</b> &nbsp; v = <b>${f(res.vEnT)} m/s</b>` });
    }
    if (xq !== null) {
      let ts;
      if (a === 0) ts = v0 === 0 ? [] : [(xq - x0) / v0].filter((t) => t >= 0);
      else {
        const D = v0 * v0 - 2 * a * (x0 - xq);
        ts = D < 0 ? [] : [...new Set([(-v0 - Math.sqrt(D)) / a, (-v0 + Math.sqrt(D)) / a])].filter((t) => t >= -1e-12).map((t) => Math.max(0, t)).sort((p, q) => p - q);
      }
      res.tEnX = ts;
      const ec = a === 0 ? `$${f(x0)}${mas(v0)} t = ${f(xq)}$` : `$${f(a / 2)} t^2${mas(v0)} t${mas(x0 - xq)} = 0$`;
      pasos.push({ t: `Wann passiert er x = ${f(xq)} m?`, html: `${ec} ⇒ ${ts.length ? ts.map((t) => `<b>t = ${f(t)} s</b> (v = ${f(v(t))} m/s)`).join(' y ') : '<b>nie</b> (mit t ≥ 0)'}.` });
    }
    let b = null, xB = null, vB = null;
    if (!vacio(sc.x0b) || !vacio(sc.v0b) || !vacio(sc.ab)) {
      b = { x0: vacio(sc.x0b) ? 0 : n(sc, 'x0b', 'der Anfangsort von B'), v0: vacio(sc.v0b) ? 0 : n(sc, 'v0b', 'die Geschwindigkeit von B'), a: vacio(sc.ab) ? 0 : n(sc, 'ab', 'die Beschleunigung von B') };
      xB = (t) => b.x0 + b.v0 * t + 0.5 * b.a * t * t; vB = (t) => b.v0 + b.a * t;
      pasos.push({ t: 'Zweiter Körper B', html: `$x_B(t) = ${f(b.x0)}${mas(b.v0)} t${b.a ? `${mas(b.a / 2)} t^2` : ''}$ &nbsp; $v_B(t) = ${f(b.v0)}${b.a ? `${mas(b.a)} t` : ''}$` });
      const c0 = x0 - b.x0, c1 = v0 - b.v0, c2 = (a - b.a) / 2;
      let ts;
      if (Math.abs(c2) < 1e-12) ts = Math.abs(c1) < 1e-12 ? [] : [-c0 / c1];
      else { const D = c1 * c1 - 4 * c2 * c0; ts = D < 0 ? [] : [...new Set([(-c1 - Math.sqrt(D)) / (2 * c2), (-c1 + Math.sqrt(D)) / (2 * c2)])]; }
      ts = ts.filter((t) => t > 1e-9).sort((u, w) => u - w);
      res.encuentros = ts.map((t) => ({ t, x: x(t) }));
      const ec = Math.abs(c2) < 1e-12 ? `$${f(c1)} t${mas(c0)} = 0$` : `$${f(c2)} t^2${mas(c1)} t${mas(c0)} = 0$`;
      pasos.push({ t: 'Begegnung', html: `Sie treffen sich, wenn $x_A(t) = x_B(t)$: ${ec} ⇒ ${ts.length ? res.encuentros.map((e) => `<b>t = ${f(e.t)} s</b>, bei <b>x = ${f(e.x)} m</b>`).join(' und ') : `<b>nie</b> (mit t > 0)${Math.abs(c0) < 1e-12 ? ', sie starten nur gemeinsam' : ''}`}.` });
    }
    const marcas = [tq, ...(res.tEnX || []), ...(res.encuentros || []).map((e) => e.t), res.tParada !== undefined ? 2 * res.tParada : null].filter((t) => t !== null && t > 0);
    const T = marcas.length ? Math.max(...marcas) * 1.15 : 10;
    return { p: { x0, v0, a, tq, xq }, b, pasos, res, x, v, xB, vB, T };
  }

  const DATOS_C = { v: 'die Bahngeschwindigkeit', w: 'die Winkelgeschwindigkeit', T: 'die Periode', rpm: 'die Umdrehungen pro Minute' };
  function circular(sc) {
    const R = n(sc, 'R', 'der Radius', { min: 0, estricto: true }), dato = DATOS_C[sc.dato] ? sc.dato : 'w';
    const val = n(sc, 'val', DATOS_C[dato], dato === 'T' ? { min: 0, estricto: true } : {});
    const al = vacio(sc.alfa) ? 0 : n(sc, 'alfa', 'die Winkelbeschleunigung');
    const tq = n(sc, 'tq', 'der Zeitpunkt', { min: 0, opcional: true }), nv = n(sc, 'nv', 'die Anzahl der Umdrehungen', { min: 0, estricto: true, opcional: true });
    const w0 = dato === 'v' ? val / R : dato === 'T' ? (2 * Math.PI) / val : dato === 'rpm' ? (2 * Math.PI * val) / 60 : val;
    if (w0 === 0 && al === 0) throw new Error('Bei verschwindender Winkelgeschwindigkeit und Winkelbeschleunigung bewegt sich nichts');
    const w = (t) => w0 + al * t, th = (t) => w0 * t + 0.5 * al * t * t;
    const pasos = [], res = { tipo: al === 0 ? 'MCU' : 'MCUA', w0, v0: w0 * R };
    const deDato = { v: `$ω = v/R = ${f(val)}/${f(R)}$`, w: '$ω$', T: `$ω = 2π/T = 2π/${f(val)}$`, rpm: `$ω = 2π n/60 = 2π · ${f(val)}/60$` }[dato];
    pasos.push({ t: 'Winkelgeschwindigkeit', html: `${deDato} = <b>${f(w0)} rad/s</b> &nbsp; $v = ω R = ${f(w0)} · ${f(R)}$ = <b>${f(w0 * R)} m/s</b>` });
    if (al === 0) {
      Object.assign(res, { periodo: (2 * Math.PI) / Math.abs(w0), frec: Math.abs(w0) / (2 * Math.PI), ac: w0 * w0 * R });
      pasos.push({ t: 'Periode und Frequenz', html: `$T = 2π/ω$ = <b>${f(res.periodo)} s</b> &nbsp; $f = 1/T$ = <b>${f(res.frec)} Hz</b> (${f(60 * res.frec)} U/min)` });
      pasos.push({ t: 'Zentripetalbeschleunigung', html: `Bei der gleichförmigen Kreisbewegung gibt es nur die Normalbeschleunigung zum Mittelpunkt: $a_c = ω^2 R = v^2/R$ = <b>${f(res.ac)} m/s²</b>.` });
    } else {
      res.at = al * R; res.an0 = w0 * w0 * R;
      pasos.push({ t: 'Gleichungen der gleichmäßig beschleunigten Kreisbewegung', html: `$ω(t) = ω_0 + α t = ${f(w0)}${mas(al)} t$ &nbsp; $θ(t) = ω_0 t + 1/2 α t^2 = ${f(w0)} t${mas(al / 2)} t^2$<br>Konstante Tangentialbeschleunigung $a_t = α R = ${f(al)} · ${f(R)}$ = <b>${f(res.at)} m/s²</b>; die Normalbeschleunigung $a_n = ω^2 R$ ändert sich (anfangs ${f(res.an0)} m/s²).` });
      if (w0 * al < 0) {
        res.tParada = -w0 / al; res.thParada = Math.abs(th(res.tParada)); res.vueltasParada = res.thParada / (2 * Math.PI);
        pasos.push({ t: 'Bleibt stehen', html: `$ω = 0 ⇒ t = −ω_0/α$ = <b>${f(res.tParada)} s</b>, nach einer Drehung um $θ = ω_0^2/(2|α|)$ = ${f(res.thParada)} rad = <b>${f(res.vueltasParada)} Umdrehungen</b>.` });
      }
    }
    if (nv !== null) {
      const ang = 2 * Math.PI * nv;
      let t = null;
      if (al === 0) t = ang / Math.abs(w0);
      else { const D = w0 * w0 + 2 * Math.sign(w0 || al) * al * ang; if (D >= 0) { const wf = Math.sqrt(D); t = (wf - Math.abs(w0)) / (Math.sign(w0 || al) * al); } }
      res.tVueltas = t !== null && t >= 0 ? t : null;
      pasos.push({ t: `Wann vollführt er ${f(nv)} Umdrehungen?`, html: res.tVueltas === null ? `<b>Nie</b>: Er bleibt vorher stehen (${f(res.vueltasParada)} Umdrehungen).`
        : `$θ = 2π · ${f(nv)} = ${f(ang)} "rad"$ ⇒ ${al === 0 ? `$t = θ/ω$` : `$${f(Math.abs(al) / 2)} t^2${mas(Math.abs(w0) * Math.sign(al * (w0 || al)))} t − ${f(ang)} = 0$ ⇒`} <b>t = ${f(res.tVueltas)} s</b>${al ? `, mit ω = ${f(w(res.tVueltas))} rad/s` : ''}.` });
    }
    if (tq !== null) {
      const wt = w(tq), an = wt * wt * R, at = al * R;
      Object.assign(res, { wEnT: wt, vEnT: wt * R, thEnT: th(tq), anEnT: an, aEnT: Math.hypot(an, at) });
      pasos.push({ t: `Bei t = ${f(tq)} s`, html: `$ω = ${f(wt)} "rad/s"$, $v = ${f(wt * R)} "m/s"$, $θ = ${f(res.thEnT)} "rad"$ (${f(Math.abs(res.thEnT) / (2 * Math.PI))} Umdrehungen)<br>$a_n = ω^2 R = ${f(an)} "m/s²"$${al ? `, $a_t = ${f(at)} "m/s²" ⇒ |a| = √(a_n^2 + a_t^2)$` : ' ⇒ |a|'} = <b>${f(res.aEnT)} m/s²</b>` });
    }
    const marcas = [tq, res.tVueltas, res.tParada].filter((t) => t !== null && t !== undefined && t > 0);
    const T = marcas.length ? Math.max(...marcas) * (res.tParada && Math.max(...marcas) === res.tParada ? 1 : 1.1) : al === 0 ? 2 * res.periodo : 4;
    return { p: { R, w0, al, tq, nv }, pasos, res, w, th, T };
  }

  const ejemplos = [
    { clave: 'clasico', nombre: 'Wurf mit 45° vom Boden', sc: { v0: 20, ang: 45, y0: 0, yf: 0, g: 9.81, modelo: 'ninguno' } },
    { clave: 'horizontal', nombre: 'Horizontaler Wurf von einem Gebäude', sc: { v0: 15, ang: 0, y0: 20, yf: 0, g: 9.81, modelo: 'ninguno' } },
    { clave: 'acantilado', nombre: 'Nach oben von einer Klippe', sc: { v0: 25, ang: 30, y0: 10, yf: 0, g: 9.81, modelo: 'ninguno', tq: 1.5 } },
    { clave: 'plataforma', nombre: 'Landet auf einer höheren Plattform', sc: { v0: 18, ang: 60, y0: 0, yf: 5, g: 9.81, modelo: 'ninguno' } },
    { clave: 'blanco', nombre: 'Ziel: Mit welchem Winkel trifft man?', sc: { v0: 30, ang: 40, y0: 0, yf: 0, g: 9.81, modelo: 'ninguno', xb: 60, yb: 5 } },
    { clave: 'caida-libre', nombre: 'Freier Fall', sc: { v0: 0, ang: 0, y0: 45, yf: 0, g: 9.81, modelo: 'ninguno' } },
    { clave: 'lineal', nombre: 'Mit linearer Reibung', sc: { v0: 30, ang: 45, y0: 0, yf: 0, g: 9.81, modelo: 'lineal', b: 0.2 } },
    { clave: 'beisbol', nombre: 'Baseball (quadratische Reibung)', sc: { v0: 40, ang: 35, y0: 1, yf: 0, g: 9.81, modelo: 'cuadratico', c: 0.0052 } },
  ];
  const ejemplosRecta = [
    { clave: 'frenada', nombre: 'Bremsen bis zum Stillstand', sc: { x0: 0, v0: 25, a: -5 } },
    { clave: 'arranque', nombre: 'Anfahren: Wann erreicht er 100 m?', sc: { x0: 0, v0: 0, a: 2, xq: 100 } },
    { clave: 'mru', nombre: 'Konstante Geschwindigkeit', sc: { x0: 10, v0: 12, a: 0, tq: 5 } },
    { clave: 'vertical', nombre: 'Senkrechter Wurf nach oben', sc: { x0: 0, v0: 20, a: -9.81, xq: 0 } },
    { clave: 'persecucion', nombre: 'Verfolgung: Startet, wenn der andere vorbeifährt', sc: { x0: 0, v0: 20, a: 0, x0b: 0, v0b: 0, ab: 3 } },
    { clave: 'cruce', nombre: 'Zwei Züge fahren aufeinander zu: Wo kreuzen sie sich?', sc: { x0: 0, v0: 20, a: 0, x0b: 1000, v0b: -30, ab: 0 } },
  ];
  const ejemplosCirculo = [
    { clave: 'tiovivo', nombre: 'Karussell: eine Umdrehung alle 8 s', sc: { R: 4, dato: 'T', val: 8 } },
    { clave: 'centrifugadora', nombre: 'Zentrifuge mit 1200 U/min', sc: { R: 0.25, dato: 'rpm', val: 1200 } },
    { clave: 'curva', nombre: 'Auto in einer Kurve mit 72 km/h', sc: { R: 50, dato: 'v', val: 20, tq: 1 } },
    { clave: 'frena', nombre: 'Rad, das bis zum Stillstand abbremst', sc: { R: 0.3, dato: 'w', val: 30, alfa: -2, tq: 5 } },
    { clave: 'arranca', nombre: 'Startet aus der Ruhe: Wann vollführt es 10 Umdrehungen?', sc: { R: 0.15, dato: 'w', val: 0, alfa: 4, nv: 10 } },
  ];

  return { leer, resolver, trayectoria, rectilineo, circular, ejemplos, ejemplosRecta, ejemplosCirculo, f };
})();

