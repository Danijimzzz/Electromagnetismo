/* =====================================================================
   Campos vectoriales (sin DOM):
   · campo escalar f(x, y, z): gradiente, derivada direccional y
     laplaciano;
   · campo vectorial F = (P, Q, R): divergencia, rotacional y, si es
     conservativo, el potencial en un punto;
   · integral de línea (trabajo) de F a lo largo de una curva r(t);
   · teorema de Green en el plano: circulación y flujo por una curva
     cerrada (circunferencia o rectángulo) frente a las integrales dobles
     del rotacional y de la divergencia.
   Las derivadas son simbólicas (Expresion); las integrales, numéricas
   por Gauss-Legendre, con el valor exacto cuando se reconoce.
   ===================================================================== */
const Campos = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const V3 = ['x', 'y', 'z'];
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  // número exacto si se reconoce con denominador pequeño (2π, 3√2, ln 2/2…), si no decimal; es texto Mates
  const IRR = [['', 1], ['π', Math.PI], ['√2', Math.SQRT2], ['√3', Math.sqrt(3)], ['√5', Math.sqrt(5)], ['ln 2', Math.LN2], ['π^2', Math.PI ** 2]];
  function ex(x, d = 4) {
    if (Math.abs(x) < 1e-11) return '0';
    for (const [s, v] of IRR) {
      const r = E.fraccion(x / v, 120);
      if (!r || Math.abs(r[0]) > 5000 || Math.abs(r[0] / r[1] * v - x) > 1e-9 * Math.max(1, Math.abs(x))) continue;
      const P = Math.abs(r[0]), arriba = s ? (P === 1 ? s : `${P} ${s}`) : String(P);
      return (r[0] < 0 ? '−' : '') + (r[1] === 1 ? arriba : `{${arriba}}/{${r[1]}}`);
    }
    return f(x, d);
  }
  const em = (x, d) => `$${ex(x, d)}$`;
  const lee = (s, nom, vars = V3) => { if (vacio(s)) throw new Error(`Falta ${nom.toLowerCase()}`); return E.lee(s, nom, vars); };
  const leeOp = (s, nom, vars = V3) => (vacio(s) ? E.N(0) : E.lee(s, nom, vars));
  const num = (s, nom) => { if (vacio(s)) throw new Error(`Falta ${nom}`); const v = E.valor(E.lee(s, nom, []), 0); if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} tiene que ser un número`); return v; };
  const numOp = (s, nom, def) => (vacio(s) ? def : num(s, nom));
  const val = (n, p) => E.valor(n, p[0], { y: p[1], z: p[2] });
  const T = (n) => E.texto(E.simp(n));
  const tiene = (ns, v) => ns.some((n) => E.tieneX(n, v));
  const vecTxt = (cs) => `(${cs.join(', ')})`;
  const pTxt = (p, d3) => vecTxt((d3 ? p : p.slice(0, 2)).map((v) => f(v)));
  // sustituye variables por nodos
  function sust(n, m) {
    if (n.t === 'x') { const k = n.n || 'x'; return m[k] ?? n; }
    if (!n.a && !n.b) return n;
    return { ...n, ...(n.a ? { a: sust(n.a, m) } : {}), ...(n.b ? { b: sust(n.b, m) } : {}) };
  }
  const suma = (ns) => ns.reduce((s, n) => ({ t: '+', a: s, b: n }));
  const prod = (a, b) => ({ t: '*', a, b });
  const esCero = (n) => { const s = E.simp(n); return s.t === 'n' && Math.abs(s.v) < 1e-14; };
  // ¿se anula en unos cuantos puntos? (por si la simplificación no llega)
  const PRUEBA = [[0.31, 0.77, -0.43], [1.3, -0.6, 0.9], [-0.8, 1.7, 0.25], [2.1, 0.45, -1.2], [-1.4, -1.1, 1.6]];
  const nulo = (n) => esCero(n) || PRUEBA.every((p) => { const v = val(n, p); return isFinite(v) && Math.abs(v) < 1e-9; });

  // Gauss-Legendre de 8 puntos en m trozos
  const GX = [-0.9602898564975363, -0.7966664774136267, -0.525532409916329, -0.1834346424956498, 0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
  const GW = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.362683783378362, 0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  function integra(g, a, b, m = 64) {
    let s = 0; const h = (b - a) / m;
    for (let k = 0; k < m; k++) { const c = a + (k + 0.5) * h; for (let i = 0; i < 8; i++) s += GW[i] * g(c + (h / 2) * GX[i]); }
    return (s * h) / 2;
  }

  /* ---------- Campo escalar ---------- */
  // sc: { f, x0, y0, z0, u (dirección, opcional: "1, 2, 2") }
  function escalar(sc) {
    const fn = lee(sc.f, 'La función f');
    const d3 = tiene([fn], 'z'), p = [num(sc.x0, 'x₀'), num(sc.y0, 'y₀'), d3 ? numOp(sc.z0, 'z₀', 0) : 0];
    const vs = d3 ? V3 : V3.slice(0, 2), gr = vs.map((v) => E.deriva(fn, v)), lap = suma(vs.map((v, i) => E.deriva(gr[i], v)));
    const f0 = val(fn, p), g0 = gr.map((n) => val(n, p)), mod = Math.hypot(...g0);
    if (!isFinite(f0) || !g0.every(isFinite)) throw new Error(`f o sus derivadas no están definidas en ${pTxt(p, d3)}`);
    const pasos = [], par = (v) => `{∂f}/{∂${v}}`;
    pasos.push({ t: 'Derivadas parciales', html: vs.map((v, i) => `$${par(v)} = ${T(gr[i])}$`).join(', &ensp; ') + '. Cada una se hace derivando respecto de esa variable y tratando las demás como constantes.' });
    pasos.push({ t: 'Gradiente', html: `$∇f = ${vecTxt(gr.map(T))}$ y en el punto ${pTxt(p, d3)}: $∇f = ${vecTxt(g0.map((v) => ex(v)))}$, con módulo $|∇f| = ${ex(mod)}$. Apunta hacia donde f crece más deprisa, y es perpendicular a las ${d3 ? 'superficies' : 'curvas'} de nivel.` });
    let du = null, u = null;
    if (!vacio(sc.u)) {
      u = String(sc.u).split(/[;,]/).filter((s) => s.trim()).map((s, i) => num(s, `la componente ${i + 1} de la dirección`));
      while (u.length < vs.length) u.push(0);
      u = u.slice(0, vs.length);
      const nu = Math.hypot(...u);
      if (!(nu > 0)) throw new Error('La dirección no puede ser el vector cero');
      du = g0.reduce((s, g, i) => s + (g * u[i]) / nu, 0);
      pasos.push({ t: 'Derivada direccional', html: `Con el vector unitario $u = ${vecTxt(u.map((v) => f(v)))}${Math.abs(nu - 1) < 1e-12 ? '' : `/${ex(nu)}`}$: $D_u f = ∇f · u = ${ex(du)}$. Lo más que puede valer es $|∇f| = ${ex(mod)}$, en la dirección del gradiente.` });
    }
    const l0 = val(lap, p);
    pasos.push({ t: 'Laplaciano', html: `$∇² f = ${vs.map((v) => `{∂^2 f}/{∂${v}^2}`).join(' + ')} = ${T(lap)}$${E.tieneX(E.simp(lap)) || E.tieneX(E.simp(lap), 'y') || E.tieneX(E.simp(lap), 'z') ? `, que en el punto vale ${em(l0)}` : ''}.${nulo(lap) ? ' Es 0: f es una función armónica, como el potencial electrostático donde no hay cargas.' : ''}` });
    return { modo: 'escalar', d3, fn, fTxt: T(fn), p, f0, gr, grTxt: gr.map(T), g0, mod, u, du, lap: l0, lapTxt: T(lap), armonica: nulo(lap), F: (x, y, z = 0) => val(fn, [x, y, z]), G: (x, y, z = 0) => gr.map((n) => val(n, [x, y, z])), pasos };
  }

  /* ---------- Campo vectorial ---------- */
  function leeCampo(sc) {
    const P = leeOp(sc.P, 'La componente P'), Q = leeOp(sc.Q, 'La componente Q'), R = leeOp(sc.R, 'La componente R');
    if (esCero(P) && esCero(Q) && esCero(R)) throw new Error('Escribe al menos una componente del campo');
    const d3 = tiene([P, Q, R], 'z') || !esCero(R);
    const dv = suma([E.deriva(P, 'x'), E.deriva(Q, 'y'), E.deriva(R, 'z')]);
    const rot = [{ t: '-', a: E.deriva(R, 'y'), b: E.deriva(Q, 'z') }, { t: '-', a: E.deriva(P, 'z'), b: E.deriva(R, 'x') }, { t: '-', a: E.deriva(Q, 'x'), b: E.deriva(P, 'y') }];
    const cons = rot.every(nulo);
    return { P, Q, R, d3, dv, rot, cons, Fv: (p) => [val(P, p), val(Q, p), val(R, p)] };
  }
  // potencial con φ(0) = 0 por el segmento desde un punto base
  function potencial(C, p, base = [0, 0, 0]) {
    const d = p.map((v, i) => v - base[i]);
    return integra((s) => { const q = base.map((b, i) => b + s * d[i]), F = C.Fv(q); return F[0] * d[0] + F[1] * d[1] + F[2] * d[2]; }, 0, 1, 32);
  }
  // un punto donde el campo esté definido para medir el potencial
  const baseDe = (C) => [[0, 0, 0], [1, 0, 0], [1, 1, 1], [0.5, 0.5, 0.5]].find((b) => C.Fv(b).every(isFinite)) || [1, 0, 0];

  // sc: { P, Q, R, x0, y0, z0 }
  function vectorial(sc) {
    const C = leeCampo(sc), d3 = C.d3, p = [num(sc.x0, 'x₀'), num(sc.y0, 'y₀'), d3 ? numOp(sc.z0, 'z₀', 0) : 0];
    const F0 = C.Fv(p);
    if (!F0.every(isFinite)) throw new Error(`El campo no está definido en ${pTxt(p, d3)}`);
    const pasos = [], comp = d3 ? [C.P, C.Q, C.R] : [C.P, C.Q];
    pasos.push({ t: 'El campo', html: `$F = ${vecTxt(comp.map(T))}$; en el punto ${pTxt(p, d3)}, $F = ${vecTxt((d3 ? F0 : F0.slice(0, 2)).map((v) => ex(v)))}$, de módulo ${em(Math.hypot(...F0))}.` });
    const div0 = val(C.dv, p), rot0 = C.rot.map((n) => val(n, p));
    pasos.push({ t: 'Divergencia', html: `$∇ · F = {∂P}/{∂x} + {∂Q}/{∂y}${d3 ? ' + {∂R}/{∂z}' : ''} = ${nulo(C.dv) ? '0' : T(C.dv)}$, que en el punto vale <b>${em(div0)}</b>. ${Math.abs(div0) < 1e-10 ? 'Ni sale ni entra campo: allí no hay fuentes ni sumideros.' : div0 > 0 ? 'Es positiva: del entorno del punto sale más campo del que entra (una fuente).' : 'Es negativa: entra más campo del que sale (un sumidero).'}` });
    pasos.push({ t: 'Rotacional', html: d3 ? `$∇ × F = ({∂R}/{∂y} − {∂Q}/{∂z}, {∂P}/{∂z} − {∂R}/{∂x}, {∂Q}/{∂x} − {∂P}/{∂y}) = ${vecTxt(C.rot.map((n) => (nulo(n) ? '0' : T(n))))}$, en el punto <b>${vecTxt(rot0.map((v) => ex(v)))}</b>.` : `En el plano el rotacional solo tiene componente z: $(∇ × F)_z = {∂Q}/{∂x} − {∂P}/{∂y} = ${nulo(C.rot[2]) ? '0' : T(C.rot[2])}$, en el punto <b>${em(rot0[2])}</b>. ${Math.abs(rot0[2]) < 1e-10 ? 'Un molinillo puesto allí no giraría.' : rot0[2] > 0 ? 'Un molinillo puesto allí giraría en sentido antihorario.' : 'Un molinillo puesto allí giraría en sentido horario.'}` });
    let phi = null, base = null;
    if (C.cons) {
      base = baseDe(C); phi = potencial(C, p, base);
      pasos.push({ t: 'Conservativo', html: `El rotacional es 0 en todas partes, así que F es conservativo (en una región sin agujeros): $F = ∇φ$, y el trabajo entre dos puntos no depende del camino. Tomando $φ = 0$ en ${pTxt(base, d3)} e integrando por el segmento, $φ${pTxt(p, d3)} = ${ex(phi)}$.` });
    } else pasos.push({ t: 'No conservativo', html: 'Como el rotacional no es 0, F no es el gradiente de ningún potencial: el trabajo depende del camino y en una curva cerrada no tiene por qué ser 0.' });
    return { modo: 'vectorial', d3, ...C, p, F0, div: div0, rot0, dvTxt: T(C.dv), rotTxt: C.rot.map(T), phi, base, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  /* ---------- Integral de línea ---------- */
  // sc: { P, Q, R, cx, cy, cz, a, b }
  function linea(sc) {
    const C = leeCampo(sc), VT = ['t'];
    const rx = lee(sc.cx, 'La x(t) de la curva', VT), ry = lee(sc.cy, 'La y(t) de la curva', VT), rz = leeOp(sc.cz, 'La z(t) de la curva', VT);
    const d3 = C.d3 || !esCero(rz), a = num(sc.a, 'el valor inicial de t'), b = num(sc.b, 'el valor final de t');
    if (!(b > a)) throw new Error('El valor final de t tiene que ser mayor que el inicial');
    const dr = [rx, ry, rz].map((n) => E.deriva(n, 't'));
    const enT = [C.P, C.Q, C.R].map((n) => sust(n, { x: rx, y: ry, z: rz }));
    const dentro = E.simp(suma(enT.map((n, i) => prod(n, dr[i]))));
    const r = (t) => [rx, ry, rz].map((n) => E.valor(n, 0, { t })), g = (t) => E.valor(dentro, 0, { t });
    for (const t of [a, (a + b) / 2, b]) if (!isFinite(g(t))) throw new Error(`El integrando no está definido en t = ${f(t)}`);
    const W = integra(g, a, b, 200), L = integra((t) => Math.hypot(...dr.map((n) => E.valor(n, 0, { t }))), a, b, 200);
    const A = r(a), B = r(b), cerrada = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 1e-9;
    const pasos = [], cp = d3 ? [0, 1, 2] : [0, 1];
    pasos.push({ t: 'La curva', html: `$r(t) = ${vecTxt(cp.map((i) => T([rx, ry, rz][i])))}$ con $t ∈ [${ex(a)}, ${ex(b)}]$, de ${pTxt(A, d3)} a ${pTxt(B, d3)}${cerrada ? ' (es cerrada)' : ''}. Su derivada es $r′(t) = ${vecTxt(cp.map((i) => T(dr[i])))}$.` });
    pasos.push({ t: 'El integrando', html: `Sustituyendo la curva en el campo, $F(r(t)) = ${vecTxt(cp.map((i) => T(enT[i])))}$, y $F(r(t)) · r′(t) = ${E.texto(dentro)}$.` });
    pasos.push({ t: 'Trabajo', html: `$W = ∫_C F · dr = ∫_{${ex(a)}}^{${ex(b)}} (${E.texto(dentro)}) dt$ = <b>${em(W, 5)}</b>` });
    let dphi = null;
    if (C.cons) {
      const base = baseDe(C); dphi = potencial(C, B, base) - potencial(C, A, base);
      pasos.push({ t: 'Comprobación con el potencial', html: `F es conservativo (rotacional 0), así que el trabajo es la diferencia de potencial entre los extremos: $φ(B) − φ(A) = ${ex(dphi, 5)}$, sin importar el camino.${cerrada ? ' Como la curva es cerrada, sale 0.' : ''}` });
    } else pasos.push({ t: 'Depende del camino', html: `F no es conservativo, así que por otra curva entre los mismos puntos el trabajo sería distinto${cerrada ? ' y en esta curva cerrada no tiene por qué salir 0' : ''}.` });
    pasos.push({ t: 'Longitud de la curva', html: `$L = ∫ |r′(t)| dt = ${ex(L, 5)}$` });
    return { modo: 'linea', d3, ...C, rx, ry, rz, a, b, A, B, cerrada, W, L, dphi, integrando: E.texto(dentro), r, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  /* ---------- Teorema de Green ---------- */
  // sc: { P, Q, region: 'circulo' (cx, cy, rad) | 'rectangulo' (x1, x2, y1, y2) }
  function green(sc) {
    const P = leeOp(sc.P, 'La componente P', ['x', 'y']), Q = leeOp(sc.Q, 'La componente Q', ['x', 'y']);
    if (esCero(P) && esCero(Q)) throw new Error('Escribe al menos una componente del campo');
    const rotz = E.simp({ t: '-', a: E.deriva(Q, 'x'), b: E.deriva(P, 'y') }), dv = E.simp({ t: '+', a: E.deriva(P, 'x'), b: E.deriva(Q, 'y') });
    const Pv = (x, y) => E.valor(P, x, { y }), Qv = (x, y) => E.valor(Q, x, { y }), rv = (x, y) => E.valor(rotz, x, { y }), dvv = (x, y) => E.valor(dv, x, { y });
    const circ = sc.region !== 'rectangulo';
    let circula, flujo, dobleR, dobleD, borde, area, regTxt, reg;
    if (circ) {
      const cx = numOp(sc.cx, 'el centro x', 0), cy = numOp(sc.cy, 'el centro y', 0), R = num(sc.rad, 'el radio');
      if (!(R > 0)) throw new Error('El radio tiene que ser mayor que 0');
      // r(θ) = (cx + R cos θ, cy + R sen θ), antihorario
      circula = integra((t) => { const x = cx + R * Math.cos(t), y = cy + R * Math.sin(t); return -Pv(x, y) * R * Math.sin(t) + Qv(x, y) * R * Math.cos(t); }, 0, 2 * Math.PI, 64);
      flujo = integra((t) => { const x = cx + R * Math.cos(t), y = cy + R * Math.sin(t); return Pv(x, y) * R * Math.cos(t) + Qv(x, y) * R * Math.sin(t); }, 0, 2 * Math.PI, 64);
      const doble = (h) => integra((r) => r * integra((t) => h(cx + r * Math.cos(t), cy + r * Math.sin(t)), 0, 2 * Math.PI, 16), 0, R, 12);
      dobleR = doble(rv); dobleD = doble(dvv);
      area = Math.PI * R * R; borde = (s) => [cx + R * Math.cos(2 * Math.PI * s), cy + R * Math.sin(2 * Math.PI * s)];
      regTxt = `la circunferencia de centro (${f(cx)}, ${f(cy)}) y radio ${f(R)}, recorrida en sentido antihorario: $r(θ) = (${cx ? `${f(cx)} + ` : ''}${f(R) === '1' ? '' : f(R) + ' '}cos θ, ${cy ? `${f(cy)} + ` : ''}${f(R) === '1' ? '' : f(R) + ' '}sen θ)$`;
      reg = { tipo: 'circulo', cx, cy, R };
    } else {
      const x1 = num(sc.x1, 'x mínima'), x2 = num(sc.x2, 'x máxima'), y1 = num(sc.y1, 'y mínima'), y2 = num(sc.y2, 'y máxima');
      if (!(x2 > x1 && y2 > y1)) throw new Error('El rectángulo tiene que ir de la x (y la y) menor a la mayor');
      const lado = (h) => integra(h, 0, 1, 32);
      // abajo, derecha, arriba, izquierda
      circula = lado((s) => Pv(x1 + s * (x2 - x1), y1) * (x2 - x1)) + lado((s) => Qv(x2, y1 + s * (y2 - y1)) * (y2 - y1)) - lado((s) => Pv(x1 + s * (x2 - x1), y2) * (x2 - x1)) - lado((s) => Qv(x1, y1 + s * (y2 - y1)) * (y2 - y1));
      flujo = -lado((s) => Qv(x1 + s * (x2 - x1), y1) * (x2 - x1)) + lado((s) => Pv(x2, y1 + s * (y2 - y1)) * (y2 - y1)) + lado((s) => Qv(x1 + s * (x2 - x1), y2) * (x2 - x1)) - lado((s) => Pv(x1, y1 + s * (y2 - y1)) * (y2 - y1));
      const doble = (h) => integra((x) => integra((y) => h(x, y), y1, y2, 16), x1, x2, 16);
      dobleR = doble(rv); dobleD = doble(dvv);
      area = (x2 - x1) * (y2 - y1);
      borde = (s) => { const L = 2 * (x2 - x1 + y2 - y1); let d = s * L; const a = x2 - x1, b = y2 - y1; if (d < a) return [x1 + d, y1]; d -= a; if (d < b) return [x2, y1 + d]; d -= b; if (d < a) return [x2 - d, y2]; d -= a; return [x1, y2 - d]; };
      regTxt = `el borde del rectángulo [${f(x1)}, ${f(x2)}] × [${f(y1)}, ${f(y2)}], recorrido en sentido antihorario`;
      reg = { tipo: 'rectangulo', x1, x2, y1, y2 };
    }
    if (![circula, flujo, dobleR, dobleD].every(isFinite)) throw new Error('El campo no está definido en toda la región (¿hay una singularidad dentro?)');
    // si no coinciden es que hay un punto de D donde F no está definido (las integrales lo esquivan)
    const tol = (a) => 1e-5 * Math.max(1, Math.abs(a)), singular = Math.abs(circula - dobleR) > tol(circula) || Math.abs(flujo - dobleD) > tol(flujo);
    const roto = ' No coincide: el campo no está definido en algún punto de dentro de D (una singularidad), y entonces el teorema de Green no se puede aplicar.';
    const pasos = [];
    pasos.push({ t: 'El campo y la curva', html: `$F = (${T(P)}, ${T(Q)})$ en ${regTxt}.` });
    pasos.push({ t: 'Circulación', html: `$∮_C F · dr = ∮_C P dx + Q dy$ = <b>${em(circula, 5)}</b>` });
    pasos.push({ t: 'Teorema de Green (rotacional)', html: `$∮_C P dx + Q dy = ∬_D ({∂Q}/{∂x} − {∂P}/{∂y}) dA$, con $(∇ × F)_z = ${E.texto(rotz)}$: la integral doble da <b>${em(dobleR, 5)}</b>${Math.abs(circula - dobleR) > tol(circula) ? '.' + roto : ', lo mismo que la circulación.'}${rotz.t === 'n' && !singular ? ` Como el rotacional es constante, es ${em(rotz.v)} por el área (${em(area)}).` : ''}` });
    pasos.push({ t: 'Flujo hacia fuera', html: `$∮_C F · n ds = ∮_C P dy − Q dx$ = <b>${em(flujo, 5)}</b>` });
    pasos.push({ t: 'Teorema de la divergencia en el plano', html: `$∮_C F · n ds = ∬_D ({∂P}/{∂x} + {∂Q}/{∂y}) dA$, con $∇ · F = ${E.texto(dv)}$: la integral doble da <b>${em(dobleD, 5)}</b>${Math.abs(flujo - dobleD) > tol(flujo) ? '.' + roto : ', lo mismo que el flujo.'}${dv.t === 'n' ? ` La divergencia es constante: ${ex(dv.v)} por el área.` : ''}` });
    return { modo: 'green', d3: false, singular, P, Q, R: E.N(0), reg, circula, flujo, dobleR, dobleD, area, rotTxt: E.texto(rotz), dvTxt: E.texto(dv), borde, rv, F: (x, y) => [Pv(x, y), Qv(x, y), 0], pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'vectorial') return vectorial(sc);
    if (sc.modo === 'linea') return linea(sc);
    if (sc.modo === 'green') return green(sc);
    return escalar(sc);
  }

  const ejemplos = [
    { clave: 'paraboloide', nombre: 'Gradiente de f = x² + y²', sc: { modo: 'escalar', f: 'x^2 + y^2', x0: '1', y0: '2', z0: '', u: '1, 1' } },
    { clave: 'temperatura', nombre: 'Temperatura T = 100 − x² − 2y²', sc: { modo: 'escalar', f: '100 - x^2 - 2y^2', x0: '2', y0: '1', z0: '', u: '-1, 0' } },
    { clave: 'xyz', nombre: 'f = x y z: derivada direccional en 3D', sc: { modo: 'escalar', f: 'x y z', x0: '1', y0: '2', z0: '3', u: '1, 2, 2' } },
    { clave: 'armonica', nombre: 'f = eˣ sen y (armónica)', sc: { modo: 'escalar', f: 'e^x sen y', x0: '0', y0: 'π/2', z0: '', u: '' } },
    { clave: 'fuente', nombre: 'F = (x, y): una fuente', sc: { modo: 'vectorial', P: 'x', Q: 'y', R: '', x0: '1', y0: '1', z0: '' } },
    { clave: 'remolino', nombre: 'F = (−y, x): un remolino', sc: { modo: 'vectorial', P: '-y', Q: 'x', R: '', x0: '1', y0: '0', z0: '' } },
    { clave: 'conservativo', nombre: 'F = (yz, xz, xy): conservativo', sc: { modo: 'vectorial', P: 'y z', Q: 'x z', R: 'x y', x0: '1', y0: '2', z0: '3' } },
    { clave: 'cizalla', nombre: 'F = (y, 0): cizalla, rota sin girar', sc: { modo: 'vectorial', P: 'y', Q: '0', R: '', x0: '0', y0: '1', z0: '' } },
    { clave: 'carga', nombre: 'Campo de una carga en el plano', sc: { modo: 'vectorial', P: 'x/(x^2 + y^2)', Q: 'y/(x^2 + y^2)', R: '', x0: '1', y0: '1', z0: '' } },
    { clave: 'circulo', nombre: 'Trabajo de (−y, x) en una vuelta', sc: { modo: 'linea', P: '-y', Q: 'x', R: '', cx: 'cos t', cy: 'sen t', cz: '', a: '0', b: '2π' } },
    { clave: 'parabola', nombre: 'Trabajo de (y, x) por y = x²', sc: { modo: 'linea', P: 'y', Q: 'x', R: '', cx: 't', cy: 't^2', cz: '', a: '0', b: '1' } },
    { clave: 'helice', nombre: 'Trabajo por una hélice', sc: { modo: 'linea', P: '-y', Q: 'x', R: 'z', cx: 'cos t', cy: 'sen t', cz: 't', a: '0', b: '2π' } },
    { clave: 'segmento', nombre: 'Trabajo de (x², xy) por un segmento', sc: { modo: 'linea', P: 'x^2', Q: 'x y', R: '', cx: 't', cy: '2t', cz: '', a: '0', b: '1' } },
    { clave: 'green-circulo', nombre: 'Green: (−y, x) en la circunferencia', sc: { modo: 'green', P: '-y', Q: 'x', region: 'circulo', cx: '0', cy: '0', rad: '1' } },
    { clave: 'green-rect', nombre: 'Green: (xy, x²) en un rectángulo', sc: { modo: 'green', P: 'x y', Q: 'x^2', region: 'rectangulo', x1: '0', x2: '2', y1: '0', y2: '1' } },
    { clave: 'green-agujero', nombre: 'Green falla: (−y, x)/(x² + y²) con el origen dentro', sc: { modo: 'green', P: '-y/(x^2 + y^2)', Q: 'x/(x^2 + y^2)', region: 'circulo', cx: '0', cy: '0', rad: '1' } },
    { clave: 'green-flujo', nombre: 'Flujo de (x, y) por una circunferencia', sc: { modo: 'green', P: 'x', Q: 'y', region: 'circulo', cx: '0', cy: '0', rad: '2' } },
  ];

  return { resolver, escalar, vectorial, linea, green, ejemplos, integra, f, ex };
})();
if (typeof module !== 'undefined') module.exports = Campos;
