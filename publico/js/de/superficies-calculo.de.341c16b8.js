const Superficies = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const nt = (x) => E.numTxt(Math.abs(x) < 1e-12 ? 0 : x, 5);
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const val2 = (n, x, y) => E.valor(n, x, { y });
  const dX = (n) => E.simp(E.deriva(n, 'x')), dY = (n) => E.simp(E.deriva(n, 'y'));
  const T = (n) => E.texto(E.simp(n));

  function num(s, nom, def) {
    if (vacio(s)) { if (def !== undefined) return def; throw new Error(`Es fehlt ${nom}`); }
    const a = E.lee(String(s).replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1'), nom);
    if (E.tieneX(a)) throw new Error(`${nom} muss eine Zahl sein, ohne den Buchstaben x`);
    const v = E.valor(a, 0);
    if (!isFinite(v)) throw new Error(`${nom} muss eine Zahl sein`);
    return v;
  }
  const limpia = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x) : x);
  function raiz(r2) {
    const k = Math.round(r2);
    if (Math.abs(r2 - k) < 1e-9 * Math.max(1, r2) && k >= 0) { const s = Math.round(Math.sqrt(k)); return s * s === k ? String(s) : `√${k}`; }
    return nt(Math.sqrt(r2));
  }
  function lineal(a, b, c, vx = 'x', vy = 'y') {
    const partes = [];
    const termino = (k, v) => {
      if (Math.abs(k) < 1e-12) return;
      const mod = Math.abs(k), t = v ? (Math.abs(mod - 1) < 1e-12 ? v : `${nt(mod)} ${v}`) : nt(mod);
      partes.push({ s: k < 0 ? '−' : '+', t });
    };
    termino(a, vx); termino(b, vy); termino(c, '');
    if (!partes.length) return '0';
    return partes.map((p, i) => (i === 0 ? (p.s === '−' ? `−${p.t}` : p.t) : ` ${p.s} ${p.t}`)).join('');
  }
  const resta = (v, k) => (Math.abs(k) < 1e-12 ? v : k > 0 ? `(${v} − ${nt(k)})` : `(${v} + ${nt(-k)})`);

  function sinDerivada(ast, fv, R) {
    const nodos = []; const rec = (n) => { if (!n || typeof n !== 'object') return; if (n.t === 'fn' && ['abs', 'sqrt', 'cbrt'].includes(n.f)) nodos.push({ n, u: n.a }); else if (n.t === '^' && n.b.t === 'n' && n.b.v > 0 && n.b.v < 1) nodos.push({ n, u: n.a }); rec(n.a); rec(n.b); };
    rec(ast);
    const us = nodos.filter((q, i) => !/^[\d,.−\s]*$/.test(T(q.u)) && nodos.findIndex((o) => T(o.u) === T(q.u)) === i);
    if (!us.length) return null;
    const L = Math.min(R.xmax - R.xmin, R.ymax - R.ymin), e = 1e-7 * Math.max(1, R.xmax - R.xmin, R.ymax - R.ymin), dentro = (x, y) => x >= R.xmin - e && x <= R.xmax + e && y >= R.ymin - e && y <= R.ymax + e;
    const sust = (n, viejo) => (n === viejo ? { t: 'n', v: 0 } : !n || typeof n !== 'object' ? n : { ...n, ...(n.a ? { a: sust(n.a, viejo) } : {}), ...(n.b ? { b: sust(n.b, viejo) } : {}) });
    const newton = (F, x, y) => {
      for (let k = 0; k < 80; k++) {
        const F0 = F(x, y); if (!F0.every(isFinite)) return null;
        const h = 1e-6, Fx = F(x + h, y), Fy = F(x, y + h); if (!Fx.every(isFinite) || !Fy.every(isFinite)) return null;
        const a = (Fx[0] - F0[0]) / h, b = (Fy[0] - F0[0]) / h, c = (Fx[1] - F0[1]) / h, d = (Fy[1] - F0[1]) / h, det = a * d - b * c;
        if (Math.abs(det) < 1e-14) break;
        const dx = (d * F0[0] - b * F0[1]) / det, dy = (a * F0[1] - c * F0[0]) / det; x -= dx; y -= dy;
        if (Math.abs(dx) + Math.abs(dy) < 1e-12) break;
      }
      const Ff = F(x, y); return Ff.every(isFinite) && Math.hypot(...Ff) < 1e-8 ? [x, y] : null;
    };
    const semillas = []; for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) semillas.push([R.xmin + (R.xmax - R.xmin) * (i + 0.37) / 7, R.ymin + (R.ymax - R.ymin) * (j + 0.41) / 7]);
    const quiebra = (x, y) => { const z = fv(x, y), h = 1e-6 * Math.max(1, L); for (let k = 0; k < 8; k++) { const t = (Math.PI * k) / 8, p1 = (fv(x + h * Math.cos(t), y + h * Math.sin(t)) - z) / h, p2 = (fv(x - h * Math.cos(t), y - h * Math.sin(t)) - z) / h; if (!isFinite(p1) || !isFinite(p2) || Math.abs(p1 + p2) > 1e-4 * Math.max(1, Math.abs(p1))) return true; } return false; };
    const clasifica = (x, y) => {
      const z = fv(x, y), r = 1e-4 * L, tol = 1e-12 * Math.max(1, Math.abs(z)); let mas = 0, menos = 0, igual = 0, borde = 0;
      for (let k = 0; k < 24; k++) { const t = (2 * Math.PI * k) / 24, d = fv(x + r * Math.cos(t), y + r * Math.sin(t)) - z; if (!isFinite(d)) borde++; else if (d > tol) mas++; else if (d < -tol) menos++; else igual++; }
      const b = borde ? ' (am Rand des Definitionsbereichs)' : '';
      if (borde === 24) return null;
      return (mas && menos ? 'weder Maximum noch Minimum' : mas ? (igual ? 'nicht strenges Minimum' : 'Minimum') : menos ? (igual ? 'nicht strenges Maximum' : 'Maximum') : 'f ist ringsum konstant') + b;
    };
    const puntos = [], curvas = [], donde = [];
    const mete = (lista, q) => { if (!q) return; const x = limpia(+q[0].toFixed(7)), y = limpia(+q[1].toFixed(7)); if (!dentro(x, y) || !isFinite(fv(x, y)) || lista.some((o) => Math.abs(o.x - x) < 1e-5 && Math.abs(o.y - y) < 1e-5)) return; lista.push({ x, y }); };
    const U = us.map(({ n, u }) => ({ u, uv: (x, y) => val2(u, x, y), ux: dX(u), uy: dY(u), g: E.simp(sust(ast, n)) }));
    U.forEach((q, i) => {
      const muestras = [], sgn = (v) => (!isFinite(v) ? -1 : Math.abs(v) < 1e-13 ? 0 : Math.sign(v));
      for (let m = 0; m < 18; m++) {
        const hor = m < 9, fijo = hor ? R.ymin + (R.ymax - R.ymin) * ((m % 9) + 0.5) / 9 : R.xmin + (R.xmax - R.xmin) * ((m % 9) + 0.5) / 9, a0 = hor ? R.xmin : R.ymin, a1 = hor ? R.xmax : R.ymax, w = (t) => (hor ? q.uv(t, fijo) : q.uv(fijo, t));
        for (let k = 0; k < 40; k++) {
          let t1 = a0 + (a1 - a0) * k / 40, t2 = a0 + (a1 - a0) * (k + 1) / 40; const s1 = sgn(w(t1)), s2 = sgn(w(t2));
          if (s1 === 0) { muestras.push(hor ? [t1, fijo] : [fijo, t1]); continue; }
          if (s2 === 0 || s1 === s2) continue;
          for (let it = 0; it < 60; it++) { const tm = (t1 + t2) / 2; if (sgn(w(tm)) === s1) t1 = tm; else t2 = tm; }
          const tc = sgn(w(t1)) >= 0 && isFinite(w(t1)) ? t1 : t2; muestras.push(hor ? [tc, fijo] : [fijo, tc]);
        }
      }
      const enCurva = muestras.filter(([x, y]) => isFinite(fv(x, y)) && quiebra(x, y)), toca = enCurva.length > 0;
      const mios = [], gx = dX(q.g), gy = dY(q.g);
      for (const [x, y] of semillas) {
        const p1 = newton((a, b) => [val2(q.ux, a, b), val2(q.uy, a, b)], x, y); if (p1 && Math.abs(q.uv(p1[0], p1[1])) < 1e-9) mete(mios, p1);
        mete(mios, newton((a, b) => [q.uv(a, b), val2(gx, a, b) * val2(q.uy, a, b) - val2(gy, a, b) * val2(q.ux, a, b)], x, y));
      }
      for (let j = i + 1; j < U.length; j++) for (const [x, y] of semillas) mete(mios, newton((a, b) => [q.uv(a, b), U[j].uv(a, b)], x, y));
      const buenos = mios.filter((o) => quiebra(o.x, o.y));
      if (toca || buenos.length) donde.push(T(q.u));
      const ts = enCurva.map(([x, y]) => clasifica(x, y)).filter(Boolean), zs = enCurva.map(([x, y]) => fv(x, y));
      if (enCurva.length >= 4 && ts.length === enCurva.length && ts.every((t) => t === ts[0]) && !/^ni /.test(ts[0]) && Math.max(...zs) - Math.min(...zs) < 1e-9 * Math.max(1, Math.abs(zs[0]))) {
        curvas.push({ u: T(q.u), tipo: `f hat auf der ganzen Kurve den Wert ${nt(zs[0])}: ${ts[0]}`, z: zs[0] });
      } else for (const o of buenos) if (!puntos.some((w) => Math.abs(w.x - o.x) < 1e-5 && Math.abs(w.y - o.y) < 1e-5)) { const tipo = clasifica(o.x, o.y); if (tipo) puntos.push({ ...o, z: fv(o.x, o.y), tipo }); }
    });
    if (!donde.length) return null;
    puntos.sort((p, q) => p.x - q.x || p.y - q.y);
    return { donde, puntos: puntos.slice(0, 8), curvas };
  }

  function resolver(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x, y)', ['x', 'y']));
    const fx = dX(ast), fy = dY(ast), fxx = dX(fx), fxy = dY(fx), fyy = dY(fy);
    const fv = (x, y) => val2(ast, x, y);
    let xmin = num(sc.xmin, 'minimales x', -3), xmax = num(sc.xmax, 'maximales x', 3), ymin = num(sc.ymin, 'minimales y', -3), ymax = num(sc.ymax, 'maximales y', 3);
    if (!(xmin < xmax) || !(ymin < ymax)) throw new Error('Der Bereich muss von klein nach groß gehen (minimales x < maximales x und minimales y < maximales y)');
    const hayPunto = !vacio(sc.x0) || !vacio(sc.y0);
    const pasos = [];
    pasos.push({ t: 'Funktion', html: `$z = f(x, y) = ${T(ast)}$<br>Jeder Punkt $(x, y)$ der Ebene hat eine Höhe $z$: Zusammen bilden sie die Fläche.` });
    pasos.push({ t: 'Partielle Ableitungen', html: `Für $f_{x}$ leitet man nach x ab, wobei y konstant bleibt, und umgekehrt für $f_{y}$:<br>$f_{x} = ${T(fx)}$, &ensp; $f_{y} = ${T(fy)}$` });
    pasos.push({ t: 'Zweite Ableitungen', html: `$f_{xx} = ${T(fxx)}$, &ensp; $f_{yy} = ${T(fyy)}$, &ensp; $f_{xy} = f_{yx} = ${T(fxy)}$` });
    const out = { ast, fx, fy, fxx, fxy, fyy, fv, txt: { f: T(ast), fx: T(fx), fy: T(fy), fxx: T(fxx), fyy: T(fyy), fxy: T(fxy) }, pasos };

    if (hayPunto) {
      const x0 = num(sc.x0, 'x₀'), y0 = num(sc.y0, 'y₀'), z0 = fv(x0, y0);
      if (!isFinite(z0)) throw new Error(`f ist in (${f(x0)}, ${f(y0)}) nicht definiert`);
      const gx = val2(fx, x0, y0), gy = val2(fy, x0, y0);
      if (!isFinite(gx) || !isFinite(gy)) throw new Error(`f hat in (${f(x0)}, ${f(y0)}) keine Ableitungen`);
      const g2 = gx * gx + gy * gy, g = Math.sqrt(g2), plano = g2 < 1e-18;
      const m = 1;
      if (x0 < xmin || x0 > xmax) { xmin = Math.min(xmin, x0 - m); xmax = Math.max(xmax, x0 + m); }
      if (y0 < ymin || y0 > ymax) { ymin = Math.min(ymin, y0 - m); ymax = Math.max(ymax, y0 + m); }
      const P = { x0, y0, z0, gx, gy, g, plano };
      out.punto = P;
      const pto = `(${nt(x0)}, ${nt(y0)})`;
      pasos.push({ t: `En ${pto}`, html: `$f${pto} = ${nt(z0)}$ &ensp; (der Punkt der Fläche ist $(${nt(x0)}, ${nt(y0)}, ${nt(z0)})$)<br>$f_{x}${pto} = ${nt(gx)}$, &ensp; $f_{y}${pto} = ${nt(gy)}$` });
      pasos.push({ t: 'Gradient', html: plano
        ? `$∇f${pto} = (0, 0)$: Der Gradient ist null, also ist es ein kritischer Punkt (die Tangentialebene ist waagerecht).`
        : `$∇f = (f_{x}, f_{y}) = (${nt(gx)}, ${nt(gy)})$, &ensp; $|∇f| = ${raiz(g2)}${/√/.test(raiz(g2)) ? ` = ${nt(g)}` : ''}$<br>Er zeigt dorthin, wo $f$ am schnellsten wächst, in Richtung $(${nt(gx / g)}, ${nt(gy / g)})$ (Winkel ${f(Math.atan2(gy, gx) * 180 / Math.PI)}° mit der x-Achse), und diese maximale Steigung ist $|∇f|$.` });
      const c = z0 - gx * x0 - gy * y0;
      P.plano_c = c;
      P.tangente = `z = ${lineal(gx, gy, c)}`;
      pasos.push({ t: 'Tangentialebene', html: `$z = f(x_0, y_0) + f_{x} (x − x_0) + f_{y} (y − y_0)$<br>$z = ${nt(z0)} ${gx < 0 ? '−' : '+'} ${nt(Math.abs(gx))} ${resta('x', x0)} ${gy < 0 ? '−' : '+'} ${nt(Math.abs(gy))} ${resta('y', y0)}$ &ensp;⇒&ensp; $${P.tangente}$<br>Normale der Fläche: $n = (f_{x}, f_{y}, −1) = (${nt(gx)}, ${nt(gy)}, −1)$` });
      P.normal = [gx, gy, -1];
      if (!plano) {
        P.nivel = `${T(ast)} = ${nt(z0)}`;
        P.rectaNivel = `${lineal(gx, gy, -(gx * x0 + gy * y0))} = 0`;
        pasos.push({ t: 'Niveaulinie', html: `Die Niveaulinie durch den Punkt ist $f(x, y) = ${nt(z0)}$ (konstante Höhe). Der Gradient steht senkrecht auf ihr.<br>Ihre Tangente: $f_{x} (x − x_0) + f_{y} (y − y_0) = 0$ &ensp;⇒&ensp; $${P.rectaNivel}$` });
      } else {
        pasos.push({ t: 'Niveaulinie', html: `Bei verschwindendem Gradienten hat die Niveaulinie im Punkt keine eindeutige Tangente (es kann eine Kreuzung, ein isolierter Punkt… sein).` });
      }
      if (!vacio(sc.ux) || !vacio(sc.uy)) {
        const ux = num(sc.ux, 'die x-Komponente der Richtung'), uy = num(sc.uy, 'die y-Komponente der Richtung'), nu = Math.hypot(ux, uy);
        if (nu < 1e-12) throw new Error('Die Richtung darf nicht der Vektor (0, 0) sein');
        const ex = ux / nu, ey = uy / nu, Du = gx * ex + gy * ey;
        P.dir = { ux, uy, ex, ey, Du };
        const unit = Math.abs(nu - 1) < 1e-9 ? '' : `Man normiert: $u = (${nt(ux)}, ${nt(uy)})/${raiz(ux * ux + uy * uy)} = (${nt(ex)}, ${nt(ey)})$.<br>`;
        pasos.push({ t: 'Richtungsableitung', html: `${unit}$D_{u} f = ∇f · u = ${nt(gx)} · ${nt(ex)} + ${nt(gy)} · ${nt(ey)} = ${nt(Du)}$<br>${Math.abs(Du) < 1e-9 ? 'In dieser Richtung ändert sich die Höhe nicht: Man geht längs der Niveaulinie.' : Du > 0 ? 'In dieser Richtung steigt die Fläche an.' : 'In dieser Richtung fällt die Fläche ab.'} (Zwischen −|∇f| und |∇f|; der Höchstwert, ${nt(g)}, liegt in Richtung des Gradienten.)` });
      }
      if (!vacio(sc.x1) || !vacio(sc.y1)) {
        const x1 = num(sc.x1, 'x des Näherungspunkts'), y1 = num(sc.y1, 'y des Näherungspunkts'), zl = z0 + gx * (x1 - x0) + gy * (y1 - y0), ze = fv(x1, y1);
        P.aprox = { x1, y1, zl, ze, err: ze - zl };
        pasos.push({ t: 'Lineare Näherung', html: `$f(${nt(x1)}, ${nt(y1)}) ≈ ${nt(z0)} + (${nt(gx)})(${nt(x1 - x0)}) + (${nt(gy)})(${nt(y1 - y0)}) = ${nt(zl)}$<br>${isFinite(ze) ? `Exakter Wert: $${nt(ze)}$, Fehler ${f(Math.abs(ze - zl), 3)}.` : 'Die Funktion ist an diesem Punkt nicht definiert.'}` });
      }
    }

    const criticos = (x1, x2, y1, y2) => {
      const lista = [];
      for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
        let x = x1 + (x2 - x1) * i / 8, y = y1 + (y2 - y1) * j / 8;
        for (let k = 0; k < 60; k++) {
          const g1 = val2(fx, x, y), g2 = val2(fy, x, y), a = val2(fxx, x, y), b = val2(fxy, x, y), c = val2(fyy, x, y), d = a * c - b * b;
          if (![g1, g2, a, b, c].every(isFinite) || Math.abs(d) < 1e-14) break;
          const dx = (c * g1 - b * g2) / d, dy = (a * g2 - b * g1) / d; x -= dx; y -= dy;
          if (Math.abs(dx) + Math.abs(dy) < 1e-13) break;
        }
        const e = 1e-7 * Math.max(1, x2 - x1, y2 - y1);
        if (!isFinite(x) || !isFinite(y) || x < x1 - e || x > x2 + e || y < y1 - e || y > y2 + e) continue;
        const gc = Math.hypot(val2(fx, x, y), val2(fy, x, y));
        if (!isFinite(gc) || gc > 1e-8) continue;
        x = limpia(+x.toFixed(7)); y = limpia(+y.toFixed(7));
        if (lista.some((q) => Math.abs(q.x - x) < 1e-6 && Math.abs(q.y - y) < 1e-6)) continue;
        const a = val2(fxx, x, y), b = val2(fxy, x, y), c = val2(fyy, x, y), D = a * c - b * b;
        lista.push({ x, y, z: fv(x, y), a, b, c, D, tipo: Math.abs(D) < 1e-9 ? 'unentschieden (D = 0)' : D < 0 ? 'Sattelpunkt' : a > 0 ? 'Minimum' : 'Maximum' });
      }
      return lista;
    };
    const crit = criticos(xmin, xmax, ymin, ymax);
    const ax = xmax - xmin, ay = ymax - ymin, eF = 1e-6 * Math.max(1, ax, ay), cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
    const fuera = criticos(xmin - ax, xmax + ax, ymin - ay, ymax + ay).filter((q) => q.x < xmin - eF || q.x > xmax + eF || q.y < ymin - eF || q.y > ymax + eF)
      .sort((p, q) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy));
    out.fuera = fuera.slice(0, 4); out.fueraMas = fuera.length > 4;
    crit.sort((p, q) => p.x - q.x || p.y - q.y);
    out.crit = crit.slice(0, 12);
    out.criticosCortados = crit.length > 12;
    pasos.push({ t: 'Kritische Punkte', html: out.crit.length
      ? `Wo $f_{x} = f_{y} = 0$ gilt (innerhalb des gezeichneten Bereichs). Mit der Hesse-Determinante $D = f_{xx} f_{yy} − f_{xy}^{2}$: Ist $D > 0$, liegt ein Extremum vor (Minimum, wenn $f_{xx} > 0$, Maximum, wenn $f_{xx} < 0$), und ist $D < 0$, ein Sattelpunkt.<br>${out.crit.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$: $f = ${nt(q.z)}$, $D = ${nt(q.D)}$ &ensp;⇒&ensp; ${q.tipo}`).join('<br>')}${out.criticosCortados ? '<br>Es gibt mehr; die ersten werden angezeigt.' : ''}`
      : 'Es gibt keine Punkte, in denen beide partiellen Ableitungen verschwinden, innerhalb des gezeichneten Bereichs.' });
    if (out.fuera.length) pasos.push({ t: 'Kritische Punkte außerhalb der Zeichnung', html: `Achtung: Nahe dem gezeichneten Bereich, aber außerhalb, ${out.fuera.length > 1 || out.fueraMas ? 'gibt es weitere kritische Punkte' : 'gibt es einen weiteren kritischen Punkt'}: ${out.fuera.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$, ${q.tipo}`).join('; ')}${out.fueraMas ? '; und noch einige' : ''}. Erweitere den Bereich von x oder y, um sie zu sehen.` });
    out.sinDeriv = sinDerivada(ast, fv, { xmin, xmax, ymin, ymax });
    if (out.sinDeriv) {
      const sd = out.sinDeriv, donde = sd.donde.map((u) => `$${u} = 0$`).join(', ');
      pasos.push({ t: 'Punkte ohne Ableitung', html: `f ist dort nicht differenzierbar, wo ${donde} (dort gibt es eine Spitze oder Kante), also ergeben sich diese Punkte nicht aus $f_{x} = f_{y} = 0$ und die Hesse-Determinante ist nutzlos: Man vergleicht die Werte von f ringsum.<br>${[...sd.puntos.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$: $f = ${nt(q.z)}$ &ensp;⇒&ensp; ${q.tipo}`), ...sd.curvas.map((c) => `Längs von $${c.u} = 0$: ${c.tipo}`)].join('<br>') || 'Es gibt unter ihnen kein Extremum innerhalb des gezeichneten Bereichs.'}` });
    }
    out.rango = { xmin, xmax, ymin, ymax };
    return out;
  }

  function malla(sol, n = 31) {
    const { xmin, xmax, ymin, ymax } = sol.rango, xs = [], ys = [], z = [];
    for (let i = 0; i < n; i++) { xs.push(xmin + (xmax - xmin) * i / (n - 1)); ys.push(ymin + (ymax - ymin) * i / (n - 1)); }
    const vs = [];
    for (let j = 0; j < n; j++) {
      const fila = [];
      for (let i = 0; i < n; i++) { let v = sol.fv(xs[i], ys[j]); if (!isFinite(v) || Math.abs(v) > 1e8) v = NaN; fila.push(v); if (!isNaN(v)) vs.push(v); }
      z.push(fila);
    }
    vs.sort((a, b) => a - b);
    let zlo = vs.length ? vs[0] : -1, zhi = vs.length ? vs[vs.length - 1] : 1;
    if (vs.length > 20) {
      const q = (p) => vs[Math.min(vs.length - 1, Math.floor(p * vs.length))];
      if (zhi - zlo > 8 * (q(0.95) - q(0.05)) + 1e-9) { zlo = q(0.02); zhi = q(0.98); }
    }
    if (zhi - zlo < 1e-12) { zlo -= 1; zhi += 1; }
    return { n, xs, ys, z, zlo, zhi };
  }
  function contorno(m, L) {
    const seg = [], { n, xs, ys, z } = m;
    const par = (A, B, a, b) => { const t = (L - a) / (b - a); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]; };
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const a = z[j][i], b = z[j][i + 1], c = z[j + 1][i + 1], d = z[j + 1][i];
      if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) continue;
      const A = [xs[i], ys[j]], B = [xs[i + 1], ys[j]], C = [xs[i + 1], ys[j + 1]], D = [xs[i], ys[j + 1]];
      const idx = (a >= L ? 1 : 0) | (b >= L ? 2 : 0) | (c >= L ? 4 : 0) | (d >= L ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const e = { B: () => par(A, B, a, b), R: () => par(B, C, b, c), T: () => par(D, C, d, c), L: () => par(A, D, a, d) };
      const pares = { 1: ['LB'], 14: ['LB'], 2: ['BR'], 13: ['BR'], 3: ['LR'], 12: ['LR'], 4: ['RT'], 11: ['RT'], 5: ['LB', 'RT'], 6: ['BT'], 9: ['BT'], 7: ['LT'], 8: ['LT'], 10: ['BR', 'LT'] }[idx];
      for (const p of pares) { const u = e[p[0]](), v = e[p[1]](); seg.push([u[0], u[1], v[0], v[1]]); }
    }
    return seg;
  }

  const ejemplos = [
    { clave: 'paraboloide', nombre: 'Paraboloid x² + y² in (1, 2), mit Richtung', sc: { f: 'x^2 + y^2', x0: '1', y0: '2', ux: '3', uy: '4', x1: '1,1', y1: '1,9', xmin: '-3', xmax: '3', ymin: '-3', ymax: '3' } },
    { clave: 'silla', nombre: 'Sattel x² − y² in (1, 1)', sc: { f: 'x^2 - y^2', x0: '1', y0: '1', ux: '', uy: '', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
    { clave: 'cono', nombre: 'Kegel √(x² + y²): Näherung in (3,1; 3,9)', sc: { f: 'sqrt(x^2 + y^2)', x0: '3', y0: '4', ux: '', uy: '', x1: '3,1', y1: '3,9', xmin: '-5', xmax: '5', ymin: '-5', ymax: '5' } },
    { clave: 'campana', nombre: 'Gaußsche Glockenfläche e^(−(x² + y²)) in (1, 0)', sc: { f: 'e^(-(x^2 + y^2))', x0: '1', y0: '0', ux: '0', uy: '1', x1: '', y1: '', xmin: '-2,5', xmax: '2,5', ymin: '-2,5', ymax: '2,5' } },
    { clave: 'onda', nombre: 'Eierkarton sin x · cos y in (1, 1)', sc: { f: 'sin(x) cos(y)', x0: '1', y0: '1', ux: '1', uy: '-1', x1: '', y1: '', xmin: '-3,14', xmax: '3,14', ymin: '-3,14', ymax: '3,14' } },
    { clave: 'cubica', nombre: 'Minimum und Sattel: x³ − 3x + y²', sc: { f: 'x^3 - 3x + y^2', x0: '1', y0: '0', ux: '', uy: '', x1: '', y1: '', xmin: '-2,5', xmax: '2,5', ymin: '-2', ymax: '2' } },
    { clave: 'mono', nombre: 'Affensattel x³ − 3xy²', sc: { f: 'x^3 - 3 x y^2', x0: '', y0: '', ux: '', uy: '', x1: '', y1: '', xmin: '-1,5', xmax: '1,5', ymin: '-1,5', ymax: '1,5' } },
    { clave: 'pico', nombre: 'Spitze ohne Ableitung: 2 − √(x² + y²)', sc: { f: '2 - sqrt(x^2 + y^2)', x0: '', y0: '', ux: '', uy: '', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
    { clave: 'arista', nombre: 'Kante ohne Extremum: |x| + y', sc: { f: '|x| + y', x0: '', y0: '', ux: '', uy: '', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
    { clave: 'plano', nombre: 'Geneigte Ebene 2x − y + 1 in (0, 0)', sc: { f: '2x - y + 1', x0: '0', y0: '0', ux: '1', uy: '0', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
  ];

  return { resolver, malla, contorno, ejemplos, f, nt };
})();

