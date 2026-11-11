/* =====================================================================
   Superficies y curvas de nivel en 3D (sin DOM): una función de dos
   variables z = f(x, y) con sus derivadas parciales, el gradiente, el
   plano tangente y la normal, la curva de nivel que pasa por el punto y
   su tangente, la derivada direccional, la aproximación lineal y los
   puntos críticos clasificados con el hessiano. Además prepara lo que
   se dibuja: la malla de la superficie y las curvas de nivel (cuadrados
   que marchan). Usa Expresion (matematicas/expresion.js) para leer,
   derivar y escribir. La interfaz está en superficies/app.js.
     resolver(sc)   datos del formulario (texto) → { …resultados, pasos };
                    lanza un Error con un mensaje para el usuario
     malla(sol, n)  valores de f en una rejilla n × n del rango
     contorno(m, L) segmentos de la curva f = L sobre esa malla
     ejemplos       [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
   ===================================================================== */
const Superficies = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const nt = (x) => E.numTxt(Math.abs(x) < 1e-12 ? 0 : x, 5);
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const val2 = (n, x, y) => E.valor(n, x, { y });
  const dX = (n) => E.simp(E.deriva(n, 'x')), dY = (n) => E.simp(E.deriva(n, 'y'));
  const T = (n) => E.texto(E.simp(n));

  // un número escrito como 2, 1,5, pi/2 o 3·10^8
  function num(s, nom, def) {
    if (vacio(s)) { if (def !== undefined) return def; throw new Error(`Falta ${nom}`); }
    const a = E.lee(String(s).replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1'), nom);
    if (E.tieneX(a)) throw new Error(`${nom} debe ser un número, sin la letra x`);
    const v = E.valor(a, 0);
    if (!isFinite(v)) throw new Error(`${nom} debe ser un número`);
    return v;
  }
  // un número casi entero o casi una fracción sencilla, sin el ruido de la última cifra
  const limpia = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x) : x);
  // lado de una raíz: √{20} si el radicando es entero, y si no el decimal
  function raiz(r2) {
    const k = Math.round(r2);
    if (Math.abs(r2 - k) < 1e-9 * Math.max(1, r2) && k >= 0) { const s = Math.round(Math.sqrt(k)); return s * s === k ? String(s) : `√${k}`; }
    return nt(Math.sqrt(r2));
  }
  // «a x + b y + c» con los signos bien puestos
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
  // «x − 3» o «x + 2» para (x − x0)
  const resta = (v, k) => (Math.abs(k) < 1e-12 ? v : k > 0 ? `(${v} − ${nt(k)})` : `(${v} + ${nt(-k)})`);

  /* ---------- Puntos sin derivada ---------- */
  // f deja de ser derivable donde se anula lo de dentro de un valor absoluto o de una raíz. Se buscan ahí los candidatos a extremo
  // (ceros aislados, cruces de dos aristas y extremos de f a lo largo de una arista) y se clasifican comparando f alrededor.
  function sinDerivada(ast, fv, R) {
    const nodos = []; const rec = (n) => { if (!n || typeof n !== 'object') return; if (n.t === 'fn' && ['abs', 'sqrt', 'cbrt'].includes(n.f)) nodos.push({ n, u: n.a }); else if (n.t === '^' && n.b.t === 'n' && n.b.v > 0 && n.b.v < 1) nodos.push({ n, u: n.a }); rec(n.a); rec(n.b); };
    rec(ast);
    const us = nodos.filter((q, i) => !/^[\d,.−\s]*$/.test(T(q.u)) && nodos.findIndex((o) => T(o.u) === T(q.u)) === i);
    if (!us.length) return null;
    const L = Math.min(R.xmax - R.xmin, R.ymax - R.ymin), e = 1e-7 * Math.max(1, R.xmax - R.xmin, R.ymax - R.ymin), dentro = (x, y) => x >= R.xmin - e && x <= R.xmax + e && y >= R.ymin - e && y <= R.ymax + e;
    const sust = (n, viejo) => (n === viejo ? { t: 'n', v: 0 } : !n || typeof n !== 'object' ? n : { ...n, ...(n.a ? { a: sust(n.a, viejo) } : {}), ...(n.b ? { b: sust(n.b, viejo) } : {}) });
    // Newton en dos ecuaciones con jacobiano numérico
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
    // ¿de verdad no es derivable ahí? Las derivadas por un lado y por el contrario no casan en alguna dirección
    const quiebra = (x, y) => { const z = fv(x, y), h = 1e-6 * Math.max(1, L); for (let k = 0; k < 8; k++) { const t = (Math.PI * k) / 8, p1 = (fv(x + h * Math.cos(t), y + h * Math.sin(t)) - z) / h, p2 = (fv(x - h * Math.cos(t), y - h * Math.sin(t)) - z) / h; if (!isFinite(p1) || !isFinite(p2) || Math.abs(p1 + p2) > 1e-4 * Math.max(1, Math.abs(p1))) return true; } return false; };
    const clasifica = (x, y) => {
      const z = fv(x, y), r = 1e-4 * L, tol = 1e-12 * Math.max(1, Math.abs(z)); let mas = 0, menos = 0, igual = 0, borde = 0;
      for (let k = 0; k < 24; k++) { const t = (2 * Math.PI * k) / 24, d = fv(x + r * Math.cos(t), y + r * Math.sin(t)) - z; if (!isFinite(d)) borde++; else if (d > tol) mas++; else if (d < -tol) menos++; else igual++; }
      const b = borde ? ' (en el borde del dominio)' : '';
      if (borde === 24) return null;
      return (mas && menos ? 'ni máximo ni mínimo' : mas ? (igual ? 'mínimo no estricto' : 'mínimo') : menos ? (igual ? 'máximo no estricto' : 'máximo') : 'f es constante alrededor') + b;
    };
    const puntos = [], curvas = [], donde = [];
    const mete = (lista, q) => { if (!q) return; const x = limpia(+q[0].toFixed(7)), y = limpia(+q[1].toFixed(7)); if (!dentro(x, y) || !isFinite(fv(x, y)) || lista.some((o) => Math.abs(o.x - x) < 1e-5 && Math.abs(o.y - y) < 1e-5)) return; lista.push({ x, y }); };
    const U = us.map(({ n, u }) => ({ u, uv: (x, y) => val2(u, x, y), ux: dX(u), uy: dY(u), g: E.simp(sust(ast, n)) }));
    U.forEach((q, i) => {
      // puntos de la curva u = 0 dentro del rango: cambios de signo de u en 9 rectas horizontales y 9 verticales, afinados por bisección
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
      // ceros aislados de u (como x² + y² en el origen) y extremos de f a lo largo de u = 0 (multiplicadores de Lagrange)
      for (const [x, y] of semillas) {
        const p1 = newton((a, b) => [val2(q.ux, a, b), val2(q.uy, a, b)], x, y); if (p1 && Math.abs(q.uv(p1[0], p1[1])) < 1e-9) mete(mios, p1);
        mete(mios, newton((a, b) => [q.uv(a, b), val2(gx, a, b) * val2(q.uy, a, b) - val2(gy, a, b) * val2(q.ux, a, b)], x, y));
      }
      // cruces con otra arista
      for (let j = i + 1; j < U.length; j++) for (const [x, y] of semillas) mete(mios, newton((a, b) => [q.uv(a, b), U[j].uv(a, b)], x, y));
      const buenos = mios.filter((o) => quiebra(o.x, o.y));
      if (toca || buenos.length) donde.push(T(q.u));
      // si en toda la curva f vale lo mismo y pasa lo mismo, se resume
      const ts = enCurva.map(([x, y]) => clasifica(x, y)).filter(Boolean), zs = enCurva.map(([x, y]) => fv(x, y));
      if (enCurva.length >= 4 && ts.length === enCurva.length && ts.every((t) => t === ts[0]) && !/^ni /.test(ts[0]) && Math.max(...zs) - Math.min(...zs) < 1e-9 * Math.max(1, Math.abs(zs[0]))) {
        curvas.push({ u: T(q.u), tipo: `f vale ${nt(zs[0])} en toda la curva: ${ts[0]}`, z: zs[0] });
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
    let xmin = num(sc.xmin, 'x mínima', -3), xmax = num(sc.xmax, 'x máxima', 3), ymin = num(sc.ymin, 'y mínima', -3), ymax = num(sc.ymax, 'y máxima', 3);
    if (!(xmin < xmax) || !(ymin < ymax)) throw new Error('El rango debe ir de menor a mayor (x mínima < x máxima e y mínima < y máxima)');
    const hayPunto = !vacio(sc.x0) || !vacio(sc.y0);
    const pasos = [];
    pasos.push({ t: 'Función', html: `$z = f(x, y) = ${T(ast)}$<br>Cada punto $(x, y)$ del plano tiene una altura $z$: juntos forman la superficie.` });
    pasos.push({ t: 'Derivadas parciales', html: `Para $f_{x}$ se deriva en x con y constante, y al revés para $f_{y}$:<br>$f_{x} = ${T(fx)}$, &ensp; $f_{y} = ${T(fy)}$` });
    pasos.push({ t: 'Segundas derivadas', html: `$f_{xx} = ${T(fxx)}$, &ensp; $f_{yy} = ${T(fyy)}$, &ensp; $f_{xy} = f_{yx} = ${T(fxy)}$` });
    const out = { ast, fx, fy, fxx, fxy, fyy, fv, txt: { f: T(ast), fx: T(fx), fy: T(fy), fxx: T(fxx), fyy: T(fyy), fxy: T(fxy) }, pasos };

    if (hayPunto) {
      const x0 = num(sc.x0, 'x₀'), y0 = num(sc.y0, 'y₀'), z0 = fv(x0, y0);
      if (!isFinite(z0)) throw new Error(`f no está definida en (${f(x0)}, ${f(y0)})`);
      const gx = val2(fx, x0, y0), gy = val2(fy, x0, y0);
      if (!isFinite(gx) || !isFinite(gy)) throw new Error(`f no tiene derivadas en (${f(x0)}, ${f(y0)})`);
      const g2 = gx * gx + gy * gy, g = Math.sqrt(g2), plano = g2 < 1e-18;
      // si el punto queda fuera del rango, el dibujo se amplía
      const m = 1;
      if (x0 < xmin || x0 > xmax) { xmin = Math.min(xmin, x0 - m); xmax = Math.max(xmax, x0 + m); }
      if (y0 < ymin || y0 > ymax) { ymin = Math.min(ymin, y0 - m); ymax = Math.max(ymax, y0 + m); }
      const P = { x0, y0, z0, gx, gy, g, plano };
      out.punto = P;
      const pto = `(${nt(x0)}, ${nt(y0)})`;
      pasos.push({ t: `En ${pto}`, html: `$f${pto} = ${nt(z0)}$ &ensp; (el punto de la superficie es $(${nt(x0)}, ${nt(y0)}, ${nt(z0)})$)<br>$f_{x}${pto} = ${nt(gx)}$, &ensp; $f_{y}${pto} = ${nt(gy)}$` });
      pasos.push({ t: 'Gradiente', html: plano
        ? `$∇f${pto} = (0, 0)$: el gradiente es nulo, así que es un punto crítico (el plano tangente es horizontal).`
        : `$∇f = (f_{x}, f_{y}) = (${nt(gx)}, ${nt(gy)})$, &ensp; $|∇f| = ${raiz(g2)}${/√/.test(raiz(g2)) ? ` = ${nt(g)}` : ''}$<br>Apunta hacia donde $f$ crece más deprisa, en el sentido $(${nt(gx / g)}, ${nt(gy / g)})$ (ángulo ${f(Math.atan2(gy, gx) * 180 / Math.PI)}° con el eje x), y esa pendiente máxima vale $|∇f|$.` });
      // plano tangente: z = z0 + fx (x − x0) + fy (y − y0)
      const c = z0 - gx * x0 - gy * y0;
      P.plano_c = c;
      P.tangente = `z = ${lineal(gx, gy, c)}`;
      pasos.push({ t: 'Plano tangente', html: `$z = f(x_0, y_0) + f_{x} (x − x_0) + f_{y} (y − y_0)$<br>$z = ${nt(z0)} ${gx < 0 ? '−' : '+'} ${nt(Math.abs(gx))} ${resta('x', x0)} ${gy < 0 ? '−' : '+'} ${nt(Math.abs(gy))} ${resta('y', y0)}$ &ensp;⇒&ensp; $${P.tangente}$<br>Normal a la superficie: $n = (f_{x}, f_{y}, −1) = (${nt(gx)}, ${nt(gy)}, −1)$` });
      P.normal = [gx, gy, -1];
      // curva de nivel y su tangente
      if (!plano) {
        P.nivel = `${T(ast)} = ${nt(z0)}`;
        P.rectaNivel = `${lineal(gx, gy, -(gx * x0 + gy * y0))} = 0`;
        pasos.push({ t: 'Curva de nivel', html: `La curva de nivel que pasa por el punto es $f(x, y) = ${nt(z0)}$ (altura constante). El gradiente es perpendicular a ella.<br>Su tangente: $f_{x} (x − x_0) + f_{y} (y − y_0) = 0$ &ensp;⇒&ensp; $${P.rectaNivel}$` });
      } else {
        pasos.push({ t: 'Curva de nivel', html: `Con gradiente nulo la curva de nivel no tiene una tangente única en el punto (puede ser un cruce, un punto aislado…).` });
      }
      // derivada direccional
      if (!vacio(sc.ux) || !vacio(sc.uy)) {
        const ux = num(sc.ux, 'la componente x de la dirección'), uy = num(sc.uy, 'la componente y de la dirección'), nu = Math.hypot(ux, uy);
        if (nu < 1e-12) throw new Error('La dirección no puede ser el vector (0, 0)');
        const ex = ux / nu, ey = uy / nu, Du = gx * ex + gy * ey;
        P.dir = { ux, uy, ex, ey, Du };
        const unit = Math.abs(nu - 1) < 1e-9 ? '' : `Se normaliza: $u = (${nt(ux)}, ${nt(uy)})/${raiz(ux * ux + uy * uy)} = (${nt(ex)}, ${nt(ey)})$.<br>`;
        pasos.push({ t: 'Derivada direccional', html: `${unit}$D_{u} f = ∇f · u = ${nt(gx)} · ${nt(ex)} + ${nt(gy)} · ${nt(ey)} = ${nt(Du)}$<br>${Math.abs(Du) < 1e-9 ? 'En esa dirección la altura no cambia: se va por la curva de nivel.' : Du > 0 ? 'En esa dirección la superficie sube.' : 'En esa dirección la superficie baja.'} (Entre −|∇f| y |∇f|; el máximo, ${nt(g)}, es en la dirección del gradiente.)` });
      }
      // aproximación lineal
      if (!vacio(sc.x1) || !vacio(sc.y1)) {
        const x1 = num(sc.x1, 'x del punto a aproximar'), y1 = num(sc.y1, 'y del punto a aproximar'), zl = z0 + gx * (x1 - x0) + gy * (y1 - y0), ze = fv(x1, y1);
        P.aprox = { x1, y1, zl, ze, err: ze - zl };
        pasos.push({ t: 'Aproximación lineal', html: `$f(${nt(x1)}, ${nt(y1)}) ≈ ${nt(z0)} + (${nt(gx)})(${nt(x1 - x0)}) + (${nt(gy)})(${nt(y1 - y0)}) = ${nt(zl)}$<br>${isFinite(ze) ? `Valor exacto: $${nt(ze)}$, error ${f(Math.abs(ze - zl), 3)}.` : 'La función no está definida en ese punto.'}` });
      }
    }

    // puntos críticos de f_x = f_y = 0 en un rectángulo, por Newton desde una rejilla
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
        lista.push({ x, y, z: fv(x, y), a, b, c, D, tipo: Math.abs(D) < 1e-9 ? 'dudoso (D = 0)' : D < 0 ? 'punto de silla' : a > 0 ? 'mínimo' : 'máximo' });
      }
      return lista;
    };
    const crit = criticos(xmin, xmax, ymin, ymax);
    // los que quedan fuera del rango dibujado (hasta un ancho más por cada lado): se avisa de los más cercanos
    const ax = xmax - xmin, ay = ymax - ymin, eF = 1e-6 * Math.max(1, ax, ay), cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
    const fuera = criticos(xmin - ax, xmax + ax, ymin - ay, ymax + ay).filter((q) => q.x < xmin - eF || q.x > xmax + eF || q.y < ymin - eF || q.y > ymax + eF)
      .sort((p, q) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy));
    out.fuera = fuera.slice(0, 4); out.fueraMas = fuera.length > 4;
    crit.sort((p, q) => p.x - q.x || p.y - q.y);
    out.crit = crit.slice(0, 12);
    out.criticosCortados = crit.length > 12;
    pasos.push({ t: 'Puntos críticos', html: out.crit.length
      ? `Donde $f_{x} = f_{y} = 0$ (dentro del rango dibujado). Con el hessiano $D = f_{xx} f_{yy} − f_{xy}^{2}$: si $D > 0$ es extremo (mínimo si $f_{xx} > 0$, máximo si $f_{xx} < 0$) y si $D < 0$, punto de silla.<br>${out.crit.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$: $f = ${nt(q.z)}$, $D = ${nt(q.D)}$ &ensp;⇒&ensp; ${q.tipo}`).join('<br>')}${out.criticosCortados ? '<br>Hay más; se muestran los primeros.' : ''}`
      : 'No hay puntos donde ambas derivadas parciales se anulen dentro del rango dibujado.' });
    if (out.fuera.length) pasos.push({ t: 'Puntos críticos fuera del dibujo', html: `Ojo: cerca del rango dibujado, pero fuera, ${out.fuera.length > 1 || out.fueraMas ? 'hay más puntos críticos' : 'hay otro punto crítico'}: ${out.fuera.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$, ${q.tipo}`).join('; ')}${out.fueraMas ? '; y alguno más' : ''}. Amplía el rango de x o de y para verlos.` });
    // puntos sin derivada (el vértice de un cono, la arista de |x|): no salen de f_x = f_y = 0 y se clasifican mirando f alrededor
    out.sinDeriv = sinDerivada(ast, fv, { xmin, xmax, ymin, ymax });
    if (out.sinDeriv) {
      const sd = out.sinDeriv, donde = sd.donde.map((u) => `$${u} = 0$`).join(', ');
      pasos.push({ t: 'Puntos sin derivada', html: `f no es derivable donde ${donde} (ahí hay un pico o una arista), así que esos puntos no salen de $f_{x} = f_{y} = 0$ y el hessiano no sirve: se comparan los valores de f alrededor.<br>${[...sd.puntos.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$: $f = ${nt(q.z)}$ &ensp;⇒&ensp; ${q.tipo}`), ...sd.curvas.map((c) => `A lo largo de $${c.u} = 0$: ${c.tipo}`)].join('<br>') || 'No hay ningún extremo entre ellos dentro del rango dibujado.'}` });
    }
    out.rango = { xmin, xmax, ymin, ymax };
    return out;
  }

  /* ---------- Lo que se dibuja ---------- */
  // valores de f en una rejilla n × n; NaN donde no existe
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
    // con una asíntota la escala se recorta a lo que cabe (percentiles 2 y 98)
    if (vs.length > 20) {
      const q = (p) => vs[Math.min(vs.length - 1, Math.floor(p * vs.length))];
      if (zhi - zlo > 8 * (q(0.95) - q(0.05)) + 1e-9) { zlo = q(0.02); zhi = q(0.98); }
    }
    if (zhi - zlo < 1e-12) { zlo -= 1; zhi += 1; }
    return { n, xs, ys, z, zlo, zhi };
  }
  // segmentos [x1, y1, x2, y2] de la curva f = L (cuadrados que marchan, con interpolación lineal)
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
    { clave: 'paraboloide', nombre: 'Paraboloide x² + y² en (1, 2), con dirección', sc: { f: 'x^2 + y^2', x0: '1', y0: '2', ux: '3', uy: '4', x1: '1,1', y1: '1,9', xmin: '-3', xmax: '3', ymin: '-3', ymax: '3' } },
    { clave: 'silla', nombre: 'Silla x² − y² en (1, 1)', sc: { f: 'x^2 - y^2', x0: '1', y0: '1', ux: '', uy: '', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
    { clave: 'cono', nombre: 'Cono √(x² + y²): aproximar en (3,1; 3,9)', sc: { f: 'sqrt(x^2 + y^2)', x0: '3', y0: '4', ux: '', uy: '', x1: '3,1', y1: '3,9', xmin: '-5', xmax: '5', ymin: '-5', ymax: '5' } },
    { clave: 'campana', nombre: 'Campana de Gauss e^(−(x² + y²)) en (1, 0)', sc: { f: 'e^(-(x^2 + y^2))', x0: '1', y0: '0', ux: '0', uy: '1', x1: '', y1: '', xmin: '-2,5', xmax: '2,5', ymin: '-2,5', ymax: '2,5' } },
    { clave: 'onda', nombre: 'Huevera sen x · cos y en (1, 1)', sc: { f: 'sen(x) cos(y)', x0: '1', y0: '1', ux: '1', uy: '-1', x1: '', y1: '', xmin: '-3,14', xmax: '3,14', ymin: '-3,14', ymax: '3,14' } },
    { clave: 'cubica', nombre: 'Mínimo y silla: x³ − 3x + y²', sc: { f: 'x^3 - 3x + y^2', x0: '1', y0: '0', ux: '', uy: '', x1: '', y1: '', xmin: '-2,5', xmax: '2,5', ymin: '-2', ymax: '2' } },
    { clave: 'mono', nombre: 'Silla del mono x³ − 3xy²', sc: { f: 'x^3 - 3 x y^2', x0: '', y0: '', ux: '', uy: '', x1: '', y1: '', xmin: '-1,5', xmax: '1,5', ymin: '-1,5', ymax: '1,5' } },
    { clave: 'pico', nombre: 'Pico sin derivada: 2 − √(x² + y²)', sc: { f: '2 - sqrt(x^2 + y^2)', x0: '', y0: '', ux: '', uy: '', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
    { clave: 'arista', nombre: 'Arista sin extremo: |x| + y', sc: { f: '|x| + y', x0: '', y0: '', ux: '', uy: '', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
    { clave: 'plano', nombre: 'Plano inclinado 2x − y + 1 en (0, 0)', sc: { f: '2x - y + 1', x0: '0', y0: '0', ux: '1', uy: '0', x1: '', y1: '', xmin: '-2', xmax: '2', ymin: '-2', ymax: '2' } },
  ];

  return { resolver, malla, contorno, ejemplos, f, nt };
})();
if (typeof module !== 'undefined') module.exports = Superficies;
