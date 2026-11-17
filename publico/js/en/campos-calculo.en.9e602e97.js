const Campos = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const D = typeof Derivadas !== 'undefined' ? Derivadas : require('../derivadas/calculo.js');
  const V3 = ['x', 'y', 'z'];
  const Cv = () => (typeof Curvilineas !== 'undefined' ? Curvilineas : require('./curvilineas.js'));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
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
  const lee = (s, nom, vars = V3) => { if (vacio(s)) throw new Error(`${nom.toLowerCase()} is missing`); return E.lee(s, nom, vars); };
  const leeOp = (s, nom, vars = V3) => (vacio(s) ? E.N(0) : E.lee(s, nom, vars));
  const num = (s, nom) => { if (vacio(s)) throw new Error(`Missing ${nom}`); const v = E.valor(E.lee(s, nom, []), 0); if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be a number`); return v; };
  const numOp = (s, nom, def) => (vacio(s) ? def : num(s, nom));
  const val = (n, p) => E.valor(n, p[0], { y: p[1], z: p[2] });
  const T = (n) => E.texto(E.simp(n));
  const tiene = (ns, v) => ns.some((n) => E.tieneX(n, v));
  const vecTxt = (cs) => `(${cs.join(', ')})`;
  const pTxt = (p, d3) => vecTxt((d3 ? p : p.slice(0, 2)).map((v) => f(v)));
  function sust(n, m) {
    if (n.t === 'x') { const k = n.n || 'x'; return m[k] ?? n; }
    if (!n.a && !n.b) return n;
    return { ...n, ...(n.a ? { a: sust(n.a, m) } : {}), ...(n.b ? { b: sust(n.b, m) } : {}) };
  }
  const suma = (ns) => ns.reduce((s, n) => ({ t: '+', a: s, b: n }));
  const prod = (a, b) => ({ t: '*', a, b });
  const esCero = (n) => { const s = E.simp(n); return s.t === 'n' && Math.abs(s.v) < 1e-14; };
  const PRUEBA = [[0.31, 0.77, -0.43], [1.3, -0.6, 0.9], [-0.8, 1.7, 0.25], [2.1, 0.45, -1.2], [-1.4, -1.1, 1.6]];
  const nulo = (n) => esCero(n) || PRUEBA.every((p) => { const v = val(n, p); return isFinite(v) && Math.abs(v) < 1e-9; });

  const GX = [-0.9602898564975363, -0.7966664774136267, -0.525532409916329, -0.1834346424956498, 0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
  const GW = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.362683783378362, 0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  function integra(g, a, b, m = 64) {
    let s = 0; const h = (b - a) / m;
    for (let k = 0; k < m; k++) { const c = a + (k + 0.5) * h; for (let i = 0; i < 8; i++) s += GW[i] * g(c + (h / 2) * GX[i]); }
    return (s * h) / 2;
  }

  function escalar(sc) {
    const fn = lee(sc.f, 'The function f');
    const d3 = tiene([fn], 'z'), p = [num(sc.x0, 'x₀'), num(sc.y0, 'y₀'), d3 ? numOp(sc.z0, 'z₀', 0) : 0];
    const vs = d3 ? V3 : V3.slice(0, 2), gr = vs.map((v) => E.deriva(fn, v)), lap = suma(vs.map((v, i) => E.deriva(gr[i], v)));
    const f0 = val(fn, p), g0 = gr.map((n) => val(n, p)), mod = Math.hypot(...g0);
    if (!isFinite(f0) || !g0.every(isFinite)) throw new Error(`f or its derivatives are not defined at ${pTxt(p, d3)}`);
    const pasos = [], par = (v) => `{∂f}/{∂${v}}`;
    pasos.push({ t: 'Partial derivatives', html: vs.map((v, i) => `$${par(v)} = ${T(gr[i])}$`).join(', &ensp; ') + '. Each one is done by differentiating with respect to that variable and treating the others as constants.' });
    pasos.push({ t: 'Gradient', html: `$∇f = ${vecTxt(gr.map(T))}$ and at the point ${pTxt(p, d3)}: $∇f = ${vecTxt(g0.map((v) => ex(v)))}$, with magnitude $|∇f| = ${ex(mod)}$. It points where f grows fastest, and is perpendicular to the level ${d3 ? 'surfaces' : 'curves'}.` });
    let du = null, u = null;
    if (!vacio(sc.u)) {
      u = String(sc.u).split(/[;,]/).filter((s) => s.trim()).map((s, i) => num(s, `component ${i + 1} of the direction`));
      while (u.length < vs.length) u.push(0);
      u = u.slice(0, vs.length);
      const nu = Math.hypot(...u);
      if (!(nu > 0)) throw new Error('The direction cannot be the zero vector');
      du = g0.reduce((s, g, i) => s + (g * u[i]) / nu, 0);
      pasos.push({ t: 'Directional derivative', html: `With the unit vector $u = ${vecTxt(u.map((v) => f(v)))}${Math.abs(nu - 1) < 1e-12 ? '' : `/${ex(nu)}`}$: $D_u f = ∇f · u = ${ex(du)}$. The most it can be is $|∇f| = ${ex(mod)}$, in the direction of the gradient.` });
    }
    const l0 = val(lap, p);
    pasos.push({ t: 'Laplacian', html: `$∇² f = ${vs.map((v) => `{∂^2 f}/{∂${v}^2}`).join(' + ')} = ${T(lap)}$${E.tieneX(E.simp(lap)) || E.tieneX(E.simp(lap), 'y') || E.tieneX(E.simp(lap), 'z') ? `, which at the point is ${em(l0)}` : ''}.${nulo(lap) ? ' It is 0: f is a harmonic function, like the electrostatic potential where there are no charges.' : ''}` });
    return { modo: 'escalar', d3, fn, fTxt: T(fn), p, f0, gr, grTxt: gr.map(T), g0, mod, u, du, lap: l0, lapTxt: T(lap), armonica: nulo(lap), F: (x, y, z = 0) => val(fn, [x, y, z]), G: (x, y, z = 0) => gr.map((n) => val(n, [x, y, z])), pasos };
  }

  function leeCampo(sc) {
    const P = leeOp(sc.P, 'The P component'), Q = leeOp(sc.Q, 'The Q component'), R = leeOp(sc.R, 'The R component');
    if (esCero(P) && esCero(Q) && esCero(R)) throw new Error('Write at least one component of the field');
    const d3 = tiene([P, Q, R], 'z') || !esCero(R);
    const dv = suma([E.deriva(P, 'x'), E.deriva(Q, 'y'), E.deriva(R, 'z')]);
    const rot = [{ t: '-', a: E.deriva(R, 'y'), b: E.deriva(Q, 'z') }, { t: '-', a: E.deriva(P, 'z'), b: E.deriva(R, 'x') }, { t: '-', a: E.deriva(Q, 'x'), b: E.deriva(P, 'y') }];
    const cons = rot.every(nulo);
    return { P, Q, R, d3, dv, rot, cons, Fv: (p) => [val(P, p), val(Q, p), val(R, p)] };
  }
  function potencial(C, p, base = [0, 0, 0]) {
    const d = p.map((v, i) => v - base[i]);
    return integra((s) => { const q = base.map((b, i) => b + s * d[i]), F = C.Fv(q); return F[0] * d[0] + F[1] * d[1] + F[2] * d[2]; }, 0, 1, 32);
  }
  const baseDe = (C) => [[0, 0, 0], [1, 0, 0], [1, 1, 1], [0.5, 0.5, 0.5]].find((b) => C.Fv(b).every(isFinite)) || [1, 0, 0];
  const Vn = (k) => (k === 'x' ? E.X : { t: 'x', n: k });
  function primEn(n, v) {
    if (nulo(n)) return E.N(0);
    let r;
    try { r = D.prim(v === 'x' ? n : sust(n, { x: Vn('w'), [v]: E.X }), []); } catch (e) { r = null; }
    if (!r) return null;
    return E.simp(v === 'x' ? r.F : sust(r.F, { x: Vn(v), w: E.X }));
  }
  function potSimb(C) {
    const resta = (a, b) => E.simp({ t: '-', a, b }), sin = (n, vs) => vs.every((v) => nulo(E.deriva(n, v)));
    const f1 = primEn(C.P, 'x'); if (!f1) return null;
    let ry = resta(C.Q, E.deriva(f1, 'y')); if (nulo(ry)) ry = E.N(0); else if (!sin(ry, ['x'])) return null;
    const f2 = primEn(ry, 'y'); if (!f2) return null;
    const s = E.simp({ t: '+', a: f1, b: f2 });
    let rz = resta(C.R, E.deriva(s, 'z')); if (nulo(rz)) rz = E.N(0); else if (!sin(rz, ['x', 'y'])) return null;
    const f3 = primEn(rz, 'z'); if (!f3) return null;
    const phi = E.simp({ t: '+', a: s, b: f3 });
    if (![['x', C.P], ['y', C.Q], ['z', C.R]].every(([v, c]) => nulo(resta(E.deriva(phi, v), c)))) return null;
    return { phi, f1, ry, f2, rz, f3 };
  }

  function vectorial(sc) {
    const C = leeCampo(sc), d3 = C.d3, p = [num(sc.x0, 'x₀'), num(sc.y0, 'y₀'), d3 ? numOp(sc.z0, 'z₀', 0) : 0];
    const F0 = C.Fv(p);
    if (!F0.every(isFinite)) throw new Error(`The field is not defined at ${pTxt(p, d3)}`);
    const pasos = [], comp = d3 ? [C.P, C.Q, C.R] : [C.P, C.Q];
    pasos.push({ t: 'The field', html: `$F = ${vecTxt(comp.map(T))}$; at the point ${pTxt(p, d3)}, $F = ${vecTxt((d3 ? F0 : F0.slice(0, 2)).map((v) => ex(v)))}$, of magnitude ${em(Math.hypot(...F0))}.` });
    const div0 = val(C.dv, p), rot0 = C.rot.map((n) => val(n, p));
    pasos.push({ t: 'Divergence', html: `$∇ · F = {∂P}/{∂x} + {∂Q}/{∂y}${d3 ? ' + {∂R}/{∂z}' : ''} = ${nulo(C.dv) ? '0' : T(C.dv)}$, which at the point is <b>${em(div0)}</b>. ${Math.abs(div0) < 1e-10 ? 'No field leaves or enters: there are no sources or sinks there.' : div0 > 0 ? 'It is positive: more field leaves the neighbourhood of the point than enters (a source).' : 'It is negative: more field enters than leaves (a sink).'}` });
    pasos.push({ t: 'Curl', html: d3 ? `$∇ × F = ({∂R}/{∂y} − {∂Q}/{∂z}, {∂P}/{∂z} − {∂R}/{∂x}, {∂Q}/{∂x} − {∂P}/{∂y}) = ${vecTxt(C.rot.map((n) => (nulo(n) ? '0' : T(n))))}$, at the point <b>${vecTxt(rot0.map((v) => ex(v)))}</b>.` : `In the plane the curl only has a z component: $(∇ × F)_z = {∂Q}/{∂x} − {∂P}/{∂y} = ${nulo(C.rot[2]) ? '0' : T(C.rot[2])}$, at the point <b>${em(rot0[2])}</b>. ${Math.abs(rot0[2]) < 1e-10 ? 'A paddle wheel placed there would not turn.' : rot0[2] > 0 ? 'A paddle wheel placed there would turn counterclockwise.' : 'A paddle wheel placed there would turn clockwise.'}` });
    let phi = null, base = null, ps = null;
    if (C.cons) {
      ps = potSimb(C);
      if (ps) {
        phi = val(ps.phi, p);
        const g = d3 ? 'g(y, z)' : 'g(y)', T0 = (n) => (nulo(n) ? '0' : T(n)), mas = (n, r) => (nulo(n) ? r : `${T(n)} + ${r}`);
        pasos.push({ t: 'Conservative', html: 'The curl is 0 everywhere, so F is conservative (in a region without holes): $F = ∇φ$, and the work between two points does not depend on the path. The potential is found by integrating component by component.' });
        pasos.push({ t: 'Integrate P with respect to x', html: `$φ = ∫ P dx = ${mas(ps.f1, g)}$, where ${g} acts as a "constant" because it does not depend on x.` });
        pasos.push({ t: 'Differentiate with respect to y and equate to Q', html: `${'$'}{∂φ}/{∂y} = ${mas(E.deriva(ps.f1, 'y'), d3 ? '{∂g}/{∂y}' : 'g′(y)')} = ${T(C.Q)}$, so ${d3 ? '${∂g}/{∂y}' : '$g′(y)'} = ${T0(ps.ry)}$ and $g = ${mas(ps.f2, d3 ? 'h(z)' : 'K')}$.` });
        if (d3) pasos.push({ t: 'Differentiate with respect to z and equate to R', html: `${'$'}{∂φ}/{∂z} = ${mas(E.deriva(E.simp({ t: '+', a: ps.f1, b: ps.f2 }), 'z'), 'h′(z)')} = ${nulo(C.R) ? '0' : T(C.R)}$, so $h′(z) = ${T0(ps.rz)}$ and $h = ${mas(ps.f3, 'K')}$.` });
        pasos.push({ t: 'Potential', html: `$φ(x, y${d3 ? ', z' : ''}) = ${T(ps.phi)} + K$ (it is checked that $∇φ = F$). With $K = 0$, at the point $φ${pTxt(p, d3)} = ${ex(phi)}$.` });
      } else {
        base = baseDe(C); phi = potencial(C, p, base);
        pasos.push({ t: 'Conservative', html: `The curl is 0 everywhere, so F is conservative (in a region without holes): $F = ∇φ$, and the work between two points does not depend on the path. I cannot find φ with elementary antiderivatives; taking $φ = 0$ at ${pTxt(base, d3)} and integrating along the segment, $φ${pTxt(p, d3)} = ${ex(phi)}$.` });
      }
    } else pasos.push({ t: 'Not conservative', html: 'Since the curl is not 0, F is not the gradient of any potential: the work depends on the path and on a closed curve it need not be 0.' });
    return { modo: 'vectorial', d3, ...C, p, F0, div: div0, rot0, dvTxt: T(C.dv), rotTxt: C.rot.map(T), phi, base, phiTxt: ps ? T(ps.phi) : null, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  const TV = { t: 'x', n: 't' };
  const lin = (a, d) => E.simp({ t: '+', a: E.N(a), b: prod(E.N(d), TV) });
  function vertices(s, nom = 'the vertices') {
    if (vacio(s)) throw new Error(`${nom} missing`);
    const grupos = /\(/.test(s) ? [...String(s).matchAll(/\(([^)]*)\)/g)].map((m) => m[1]) : String(s).split(';');
    const vs = grupos.filter((q) => q.trim()).map((q, i) => {
      const cs = q.split(/[,\s]+/).filter((c) => c);
      if (cs.length < 2 || cs.length > 3) throw new Error(`Vertex ${i + 1} must have 2 or 3 coordinates (separate the vertices with ";" and use a point for decimals)`);
      const p = cs.map((c, j) => num(c, `coordinate ${j + 1} of vertex ${i + 1}`));
      return p.length === 2 ? [...p, 0] : p;
    });
    if (vs.length < 2) throw new Error('At least two vertices are needed');
    return vs;
  }
  function curva(sc) {
    if (sc.curva === 'poligonal') {
      const vs = vertices(sc.vertices);
      if (sc.cierra === 'si' && Math.hypot(...vs[0].map((v, i) => v - vs[vs.length - 1][i])) > 1e-12) vs.push(vs[0]);
      const trozos = [];
      for (let k = 0; k + 1 < vs.length; k++) {
        const A = vs[k], B = vs[k + 1];
        if (Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 1e-12) throw new Error(`Vertices ${k + 1} and ${k + 2} are the same point`);
        trozos.push({ rx: lin(A[0], B[0] - A[0]), ry: lin(A[1], B[1] - A[1]), rz: lin(A[2], B[2] - A[2]), a: 0, b: 1, A, B });
      }
      const n = trozos.length, rr = (t) => { const k = Math.max(0, Math.min(n - 1, Math.floor(t))), s = t - k, A = vs[k], B = vs[k + 1]; return A.map((v, i) => v + s * (B[i] - v)); };
      return { trozos, d3: vs.some((p) => p[2] !== 0), poligonal: true, vs, a: 0, b: n, r: rr };
    }
    const VT = ['t'];
    const rx = lee(sc.cx, 'The x(t) of the curve', VT), ry = lee(sc.cy, 'The y(t) of the curve', VT), rz = leeOp(sc.cz, 'The z(t) of the curve', VT);
    const a = num(sc.a, 'the initial value of t'), b = num(sc.b, 'the final value of t');
    if (!(b > a)) throw new Error('The final value of t has to be greater than the initial one');
    const r = (t) => [rx, ry, rz].map((n) => E.valor(n, 0, { t }));
    return { trozos: [{ rx, ry, rz, a, b, A: r(a), B: r(b) }], d3: !esCero(rz), poligonal: false, a, b, r };
  }
  function rapidez(dr) {
    const v = E.simp({ t: 'fn', f: 'sqrt', a: suma(dr.map((n) => ({ t: '^', a: n, b: E.N(2) }))) });
    const ts = [0.13, 0.71, 1.9, 3.3].map((t) => E.valor(v, 0, { t })), c = ts.every((q) => isFinite(q) && Math.abs(q - ts[0]) < 1e-12 * Math.max(1, ts[0])) ? ts[0] : null;
    return { v, c, txt: c !== null && v.t !== 'n' ? `${T(v)} = ${ex(c)}` : T(v) };
  }
  const trozoTxt = (q, cp) => `$r(t) = ${vecTxt(cp.map((i) => T([q.rx, q.ry, q.rz][i])))}$, $t ∈ [${ex(q.a)}, ${ex(q.b)}]$`;

  function linea(sc) {
    const C = leeCampo(sc), cu = curva(sc), d3 = C.d3 || cu.d3, cp = d3 ? [0, 1, 2] : [0, 1];
    const tr = cu.trozos.map((q) => {
      const dr = [q.rx, q.ry, q.rz].map((n) => E.deriva(n, 't'));
      const enT = [C.P, C.Q, C.R].map((n) => sust(n, { x: q.rx, y: q.ry, z: q.rz }));
      const dentro = E.simp(suma(enT.map((n, i) => prod(n, dr[i])))), g = (t) => E.valor(dentro, 0, { t });
      for (const t of [q.a, (q.a + q.b) / 2, q.b]) if (!isFinite(g(t))) throw new Error(`The integrand is not defined at ${cu.poligonal ? `the point ${pTxt(cu.r(cu.trozos.indexOf(q) + t), d3)}` : `t = ${f(t)}`}`);
      const m = cu.poligonal ? 32 : 200;
      return { ...q, dr, enT, dentro, W: integra(g, q.a, q.b, m), L: integra((t) => Math.hypot(...dr.map((n) => E.valor(n, 0, { t }))), q.a, q.b, m) };
    });
    const W = tr.reduce((s, q) => s + q.W, 0), L = tr.reduce((s, q) => s + q.L, 0);
    const A = tr[0].A, B = tr[tr.length - 1].B, cerrada = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 1e-9;
    const pasos = [];
    if (!cu.poligonal) {
      const q = tr[0];
      pasos.push({ t: 'The curve', html: `${trozoTxt(q, cp)}, from ${pTxt(A, d3)} to ${pTxt(B, d3)}${cerrada ? ' (it is closed)' : ''}. Its derivative is $r′(t) = ${vecTxt(cp.map((i) => T(q.dr[i])))}$.` });
      pasos.push({ t: 'The integrand', html: `Substituting the curve into the field, $F(r(t)) = ${vecTxt(cp.map((i) => T(q.enT[i])))}$, and $F(r(t)) · r′(t) = ${E.texto(q.dentro)}$.` });
      pasos.push({ t: 'Work', html: `$W = ∫_C F · dr = ∫_{${ex(q.a)}}^{${ex(q.b)}} (${E.texto(q.dentro)}) dt$ = <b>${em(W, 5)}</b>` });
    } else {
      pasos.push({ t: 'The polygonal path', html: `It goes through ${cu.vs.map((p) => pTxt(p, d3)).join(' → ')}${cerrada ? ' (it is closed)' : ''}: there are ${tr.length} segments and the integral is the sum of those of each one. Each segment from A to B is traversed with $r(t) = A + t (B − A)$, $t ∈ [0, 1]$.` });
      tr.forEach((q, k) => pasos.push({ t: `Segment ${k + 1}: from ${pTxt(q.A, d3)} to ${pTxt(q.B, d3)}`, html: `$r(t) = ${vecTxt(cp.map((i) => T([q.rx, q.ry, q.rz][i])))}$, $r′ = ${vecTxt(cp.map((i) => T(q.dr[i])))}$ and $F · r′ = ${E.texto(q.dentro)}$: $W_{${k + 1}} = ∫_0^1 (${E.texto(q.dentro)}) dt = ${ex(q.W, 5)}$` }));
      pasos.push({ t: 'Work', html: `$W = ${tr.map((_, k) => `W_{${k + 1}}`).join(' + ')} = ${tr.map((q) => ex(q.W, 5)).join(' + ').replace(/\+ −/g, '− ')}$ = <b>${em(W, 5)}</b>` });
    }
    let dphi = null;
    if (C.cons) {
      const ps = potSimb(C), base = baseDe(C);
      dphi = ps ? val(ps.phi, B) - val(ps.phi, A) : potencial(C, B, base) - potencial(C, A, base);
      pasos.push({ t: 'Check with the potential', html: `F is conservative (curl 0), so the work is the potential difference between the endpoints${ps ? `, with $φ = ${T(ps.phi)}$` : ''}: $φ(B) − φ(A) = ${ex(dphi, 5)}$, regardless of the path.${cerrada ? ' Since the curve is closed, it is 0.' : ''}` });
    } else pasos.push({ t: 'Depends on the path', html: `F is not conservative, so along another curve between the same points the work would be different${cerrada ? ' and on this closed curve it need not be 0' : ''}.` });
    pasos.push({ t: 'Length of the curve', html: `$L = ∫ |r′(t)| dt = ${ex(L, 5)}$` });
    return { modo: 'linea', d3, ...C, trozos: tr.length, a: cu.a, b: cu.b, A, B, cerrada, W, L, dphi, integrando: tr.map((q) => E.texto(q.dentro)).join('; '), r: cu.r, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  function masa(sc) {
    const fn = lee(sc.f, 'The function f'), cu = curva(sc), d3 = tiene([fn], 'z') || cu.d3, cp = d3 ? [0, 1, 2] : [0, 1];
    let fmin = Infinity;
    const tr = cu.trozos.map((q, k) => {
      const dr = [q.rx, q.ry, q.rz].map((n) => E.deriva(n, 't')), vel = rapidez(dr), fT = E.simp(sust(fn, { x: q.rx, y: q.ry, z: q.rz }));
      const r = (t) => [q.rx, q.ry, q.rz].map((n) => E.valor(n, 0, { t })), ds = (t) => (vel.c ?? E.valor(vel.v, 0, { t })), fv = (t) => E.valor(fT, 0, { t });
      for (const t of [q.a, (q.a + q.b) / 2, q.b]) if (!isFinite(fv(t))) throw new Error(`f is not defined at ${pTxt(r(t), d3)}`);
      const m = cu.poligonal ? 32 : 200, I = (h) => integra((t) => h(t) * ds(t), q.a, q.b, m);
      for (let i = 0; i <= 40; i++) fmin = Math.min(fmin, fv(q.a + ((q.b - q.a) * i) / 40));
      return { ...q, k, dr, vel, fT, I: I(fv), L: I(() => 1), M: [0, 1, 2].map((i) => I((t) => r(t)[i] * fv(t))), G: [0, 1, 2].map((i) => I((t) => r(t)[i])) };
    });
    const tot = (h) => tr.reduce((s, q) => s + h(q), 0), I = tot((q) => q.I), L = tot((q) => q.L);
    const densidad = fmin >= 0 && I > 0, cm = densidad ? [0, 1, 2].map((i) => tot((q) => q.M[i]) / I) : null, cg = [0, 1, 2].map((i) => tot((q) => q.G[i]) / L);
    const pasos = [], dentro = (q) => (q.vel.c !== null ? (Math.abs(q.vel.c - 1) < 1e-12 ? T(q.fT) : `${ex(q.vel.c)} (${T(q.fT)})`) : `(${T(q.fT)}) ${T(q.vel.v)}`);
    pasos.push({ t: 'Length element', html: `On a curve $ds = |r′(t)| dt$, and the integral is $∫_C f ds = ∫ f(r(t)) |r′(t)| dt$: it adds the values of f weighted by the size of each piece.${cu.poligonal ? ` The polygonal path goes through ${cu.vs.map((p) => pTxt(p, d3)).join(' → ')} and is added segment by segment, each with $r(t) = A + t (B − A)$, $t ∈ [0, 1]$.` : ''}` });
    tr.forEach((q) => pasos.push({ t: cu.poligonal ? `Segment ${q.k + 1}: from ${pTxt(q.A, d3)} to ${pTxt(q.B, d3)}` : 'The curve', html: `${trozoTxt(q, cp)}, $r′(t) = ${vecTxt(cp.map((i) => T(q.dr[i])))}$ and $|r′(t)| = ${q.vel.txt}$. On the curve $f(r(t)) = ${T(q.fT)}$, so $∫ f ds = ∫_{${ex(q.a)}}^{${ex(q.b)}} ${dentro(q)} dt = ${ex(q.I, 5)}$.` }));
    pasos.push({ t: 'Result', html: `$∫_C f ds = ${tr.length > 1 ? tr.map((q) => ex(q.I, 5)).join(' + ').replace(/\+ −/g, '− ') + ' = ' : ''}$<b>${em(I, 5)}</b>. The length is $L = ∫_C ds = ${ex(L, 5)}$ and the mean value of f on the curve, $I / L = ${ex(I / L, 5)}$.` });
    if (densidad) pasos.push({ t: 'Mass and centre of mass', html: `If f is the linear density of the wire (it is ≥ 0), its mass is $M = ∫_C f ds = ${ex(I, 5)}$ and its centre of mass $(x̄, ȳ${d3 ? ', z̄' : ''}) = {1}/{M} (∫ x f ds, ∫ y f ds${d3 ? ', ∫ z f ds' : ''}) = ${vecTxt(cp.map((i) => ex(cm[i])))}$. With constant density it would be the centroid ${pTxt(cg, d3)}.` });
    else pasos.push({ t: 'It is not a density', html: `f takes negative values on the curve, so the integral is not a mass (it can be 0 or negative). The geometric centroid of the curve is ${pTxt(cg, d3)}.` });
    return { modo: 'masa', d3, fn, I, L, media: I / L, cm, cg, trozos: tr.length, a: cu.a, b: cu.b, A: tr[0].A, B: tr[tr.length - 1].B, r: cu.r, p: [0, 0, 0], F: (x, y, z = 0) => val(fn, [x, y, z]), pasos };
  }

  function dobleTri(h, A, B, Cc) {
    const det = (B[0] - A[0]) * (Cc[1] - A[1]) - (Cc[0] - A[0]) * (B[1] - A[1]);
    return det * integra((u) => u * integra((v) => h(A[0] + u * (B[0] - A[0]) + u * v * (Cc[0] - B[0]), A[1] + u * (B[1] - A[1]) + u * v * (Cc[1] - B[1])), 0, 1, 8), 0, 1, 8);
  }
  function green(sc) {
    const P = leeOp(sc.P, 'The P component', ['x', 'y']), Q = leeOp(sc.Q, 'The Q component', ['x', 'y']);
    if (esCero(P) && esCero(Q)) throw new Error('Write at least one component of the field');
    const rotz = E.simp({ t: '-', a: E.deriva(Q, 'x'), b: E.deriva(P, 'y') }), dv = E.simp({ t: '+', a: E.deriva(P, 'x'), b: E.deriva(Q, 'y') });
    const Pv = (x, y) => E.valor(P, x, { y }), Qv = (x, y) => E.valor(Q, x, { y }), rv = (x, y) => E.valor(rotz, x, { y }), dvv = (x, y) => E.valor(dv, x, { y });
    let trozos, doble, area, regTxt, reg, iterada = '';
    const segmento = (A, B) => ({ r: (s) => [A[0] + s * (B[0] - A[0]), A[1] + s * (B[1] - A[1])], d: () => [B[0] - A[0], B[1] - A[1]] });
    const poligono = (vs) => {
      const a2 = vs.reduce((s, p, i) => { const q = vs[(i + 1) % vs.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
      if (Math.abs(a2) < 1e-12) throw new Error('The vertices do not enclose any region (they are collinear)');
      if (a2 < 0) vs = vs.slice().reverse();
      trozos = vs.map((p, i) => segmento(p, vs[(i + 1) % vs.length]));
      doble = (h) => { let s = 0; for (let i = 1; i + 1 < vs.length; i++) s += dobleTri(h, vs[0], vs[i], vs[i + 1]); return s; };
      area = Math.abs(a2) / 2;
      return vs;
    };
    const tipo = ['rectangulo', 'poligono', 'curvas'].includes(sc.region) ? sc.region : 'circulo';
    if (tipo === 'circulo') {
      const cx = numOp(sc.cx, 'the centre x', 0), cy = numOp(sc.cy, 'the centre y', 0), R = num(sc.rad, 'the radius');
      if (!(R > 0)) throw new Error('The radius has to be greater than 0');
      const w = 2 * Math.PI;
      trozos = [{ r: (s) => [cx + R * Math.cos(w * s), cy + R * Math.sin(w * s)], d: (s) => [-w * R * Math.sin(w * s), w * R * Math.cos(w * s)] }];
      doble = (h) => integra((r) => r * integra((t) => h(cx + r * Math.cos(t), cy + r * Math.sin(t)), 0, 2 * Math.PI, 16), 0, R, 12);
      area = Math.PI * R * R;
      regTxt = `the circle with centre (${f(cx)}, ${f(cy)}) and radius ${f(R)}, traversed counterclockwise: $r(θ) = (${cx ? `${f(cx)} + ` : ''}${f(R) === '1' ? '' : f(R) + ' '}cos θ, ${cy ? `${f(cy)} + ` : ''}${f(R) === '1' ? '' : f(R) + ' '}sin θ)$`;
      reg = { tipo, cx, cy, R };
    } else if (tipo === 'rectangulo') {
      const x1 = num(sc.x1, 'minimum x'), x2 = num(sc.x2, 'maximum x'), y1 = num(sc.y1, 'minimum y'), y2 = num(sc.y2, 'maximum y');
      if (!(x2 > x1 && y2 > y1)) throw new Error('The rectangle has to go from the smaller x (and y) to the larger');
      poligono([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]);
      doble = (h) => integra((x) => integra((y) => h(x, y), y1, y2, 16), x1, x2, 16);
      regTxt = `the boundary of the rectangle [${f(x1)}, ${f(x2)}] × [${f(y1)}, ${f(y2)}], traversed counterclockwise`;
      iterada = ` = ∫_{${ex(x1)}}^{${ex(x2)}} ∫_{${ex(y1)}}^{${ex(y2)}}`;
      reg = { tipo, x1, x2, y1, y2 };
    } else if (tipo === 'poligono') {
      const vs = poligono(vertices(sc.vertices).map((p) => p.slice(0, 2)));
      if (vs.length < 3) throw new Error('A polygon needs at least three vertices');
      regTxt = `the boundary of the ${vs.length === 3 ? 'triangle' : `${vs.length}-sided polygon`} ${vs.map((p) => pTxt(p, false)).join(' → ')}, traversed counterclockwise (${vs.length} segments)`;
      reg = { tipo, vs };
    } else {
      const g1 = lee(sc.g1, 'The lower curve', ['x']), g2 = lee(sc.g2, 'The upper curve', ['x']), a = num(sc.a, 'the initial x'), b = num(sc.b, 'the final x');
      if (!(b > a)) throw new Error('The final x has to be greater than the initial one');
      const G1 = (x) => E.valor(g1, x), G2 = (x) => E.valor(g2, x), d1 = E.deriva(g1), d2 = E.deriva(g2);
      for (let i = 0; i <= 60; i++) {
        const x = a + ((b - a) * i) / 60;
        if (!isFinite(G1(x)) || !isFinite(G2(x))) throw new Error(`The curves are not defined at x = ${f(x)}`);
        if (G2(x) < G1(x) - 1e-12) throw new Error(`The upper curve has to be above the lower one on all of [${f(a)}, ${f(b)}] (at x = ${f(x)} it is not)`);
      }
      const L = b - a;
      trozos = [
        { r: (s) => [a + s * L, G1(a + s * L)], d: (s) => [L, L * E.valor(d1, a + s * L)], curva: true },
        segmento([b, G1(b)], [b, G2(b)]),
        { r: (s) => [b - s * L, G2(b - s * L)], d: (s) => [-L, -L * E.valor(d2, b - s * L)], curva: true },
        segmento([a, G2(a)], [a, G1(a)]),
      ].filter((q) => { const d = q.d(0.5); return Math.hypot(d[0], d[1]) > 1e-12; });
      doble = (h) => D.cuadratura((x) => integra((y) => h(x, y), G1(x), G2(x), 16), a, b);
      area = D.cuadratura((x) => G2(x) - G1(x), a, b);
      regTxt = `the boundary of the region $${ex(a)} ≤ x ≤ ${ex(b)}$, $${T(g1)} ≤ y ≤ ${T(g2)}$, traversed counterclockwise: along the bottom $y = ${T(g1)}$ from left to right and along the top $y = ${T(g2)}$ back (plus the vertical sides, if any)`;
      iterada = ` = ∫_{${ex(a)}}^{${ex(b)}} ∫_{${T(g1)}}^{${T(g2)}}`;
      reg = { tipo, a, b, G1, G2 };
    }
    const lazo = (h) => trozos.reduce((s, q) => { const g = (u) => h(q.r(u), q.d(u)); return s + (q.curva ? D.cuadratura(g, 0, 1) : integra(g, 0, 1, 64)); }, 0);
    const circula = lazo(([x, y], [dx, dy]) => Pv(x, y) * dx + Qv(x, y) * dy), flujo = lazo(([x, y], [dx, dy]) => Pv(x, y) * dy - Qv(x, y) * dx);
    const dobleR = doble(rv), dobleD = doble(dvv);
    const borde = (s) => { const n = trozos.length, k = Math.min(n - 1, Math.floor(((s % 1) + 1) % 1 * n)); return trozos[k].r(((s % 1) + 1) % 1 * n - k); };
    if (![circula, flujo, dobleR, dobleD].every(isFinite)) throw new Error('The field is not defined on the whole region (is there a singularity inside?)');
    const tol = (a) => 1e-5 * Math.max(1, Math.abs(a)), singular = Math.abs(circula - dobleR) > tol(circula) || Math.abs(flujo - dobleD) > tol(flujo);
    const roto = ' It does not match: the field is not defined at some point inside D (a singularity), and then Green\'s theorem cannot be applied.';
    const pasos = [];
    pasos.push({ t: 'The field and the curve', html: `$F = (${T(P)}, ${T(Q)})$ on ${regTxt}.` });
    pasos.push({ t: 'Circulation', html: `${trozos.length > 1 ? 'Adding the contribution of each piece of the boundary,' : ''}$∮_C F · dr = ∮_C P dx + Q dy$ = <b>${em(circula, 5)}</b>` });
    pasos.push({ t: 'Green\'s theorem (curl)', html: `$∮_C P dx + Q dy = ∬_D ({∂Q}/{∂x} − {∂P}/{∂y}) dA${iterada ? `${iterada} (${E.texto(rotz)}) dy dx` : ''}$, with $(∇ × F)_z = ${E.texto(rotz)}$: the double integral gives <b>${em(dobleR, 5)}</b>${Math.abs(circula - dobleR) > tol(circula) ? '.' + roto : ', the same as the circulation.'}${rotz.t === 'n' && !singular ? ` Since the curl is constant, it is ${em(rotz.v)} times the area (${em(area)}).` : ''}` });
    pasos.push({ t: 'Outward flux', html: `$∮_C F · n ds = ∮_C P dy − Q dx$ = <b>${em(flujo, 5)}</b>` });
    pasos.push({ t: 'Divergence theorem in the plane', html: `$∮_C F · n ds = ∬_D ({∂P}/{∂x} + {∂Q}/{∂y}) dA$, with $∇ · F = ${E.texto(dv)}$: the double integral gives <b>${em(dobleD, 5)}</b>${Math.abs(flujo - dobleD) > tol(flujo) ? '.' + roto : ', the same as the flux.'}${dv.t === 'n' ? ` The divergence is constant: ${ex(dv.v)} times the area.` : ''}` });
    pasos.push({ t: 'Area of the region', html: `$A = ∬_D dA$, which with Green can also be obtained from the boundary: $A = {1}/{2} ∮_C (x dy − y dx) = ${ex(area, 5)}$.` });
    return { modo: 'green', d3: false, singular, P, Q, R: E.N(0), reg, circula, flujo, dobleR, dobleD, area, rotTxt: E.texto(rotz), dvTxt: E.texto(dv), borde, rv, F: (x, y) => [Pv(x, y), Qv(x, y), 0], pasos };
  }

  const UV = ['u', 'v'];
  const doble2 = (h, u1, u2, v1, v2, m = 12) => integra((u) => integra((v) => h(u, v), v1, v2, m), u1, u2, m);
  const cruz = (a, b) => [[1, 2], [2, 0], [0, 1]].map(([i, j]) => E.simp({ t: '-', a: prod(a[i], b[j]), b: prod(a[j], b[i]) }));
  const cruzN = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const punto3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function superficie(sc) {
    const C = leeCampo(sc);
    const rs = [lee(sc.sx, 'The x(u, v) of the surface', UV), lee(sc.sy, 'The y(u, v) of the surface', UV), lee(sc.sz, 'The z(u, v) of the surface', UV)];
    const u1 = num(sc.u1, 'the minimum u'), u2 = num(sc.u2, 'the maximum u'), v1 = num(sc.v1, 'the minimum v'), v2 = num(sc.v2, 'the maximum v');
    if (!(u2 > u1 && v2 > v1)) throw new Error('The intervals of u and v have to go from the smaller to the larger value');
    const ru = rs.map((n) => E.deriva(n, 'u')), rv = rs.map((n) => E.deriva(n, 'v')), N = cruz(ru, rv);
    const ev = (n, u, v) => E.valor(n, 0, { u, v }), r = (u, v) => rs.map((n) => ev(n, u, v)), Nv = (u, v) => N.map((n) => ev(n, u, v));
    const um = (u1 + u2) / 2, vm = (v1 + v2) / 2;
    if (!r(um, vm).every(isFinite) || !Nv(um, vm).every(isFinite)) throw new Error('The surface is not defined at the centre of the intervals');
    if (Math.hypot(...Nv(um + 0.013 * (u2 - u1), vm + 0.021 * (v2 - v1))) < 1e-12) throw new Error('r_u × r_v is 0: the surface is degenerate (does it depend on u and v?)');
    const Fs = [C.P, C.Q, C.R].map((n) => E.simp(sust(n, { x: rs[0], y: rs[1], z: rs[2] })));
    const dentro = E.simp(suma(Fs.map((n, i) => prod(n, N[i]))));
    const flujo = doble2((u, v) => punto3(C.Fv(r(u, v)), Nv(u, v)), u1, u2, v1, v2);
    const area = doble2((u, v) => Math.hypot(...Nv(u, v)), u1, u2, v1, v2);
    const rotFlujo = doble2((u, v) => { const p = r(u, v); return punto3(C.rot.map((n) => val(n, p)), Nv(u, v)); }, u1, u2, v1, v2);
    const dU = u2 - u1, dV = v2 - v1, Rd = (ds, u, v) => ds.map((n) => ev(n, u, v));
    const lados = [(s) => [u1 + s * dU, v1, ru, dU], (s) => [u2, v1 + s * dV, rv, dV], (s) => [u2 - s * dU, v2, ru, -dU], (s) => [u1, v2 - s * dV, rv, -dV]];
    const circula = lados.reduce((S, l) => S + integra((s) => { const [u, v, ds, k] = l(s), q = Rd(ds, u, v); return k * punto3(C.Fv(r(u, v)), q); }, 0, 1, 48), 0);
    if (![flujo, area, rotFlujo, circula].every(isFinite)) throw new Error('The field or the surface is not defined at some point (is there a singularity?)');
    const tol = (a) => 1e-5 * Math.max(1, Math.abs(a)), cuadra = Math.abs(rotFlujo - circula) <= tol(circula);
    const S9 = [0, 0.13, 0.27, 0.4, 0.5, 0.61, 0.75, 0.88, 1], esc = Math.max(1e-9, ...S9.map((s) => Math.hypot(...r(u1 + s * dU, v1 + s * dV))));
    const igual = (g, h) => S9.every((s) => { const a = g(s), b = h(s); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-9 * esc; });
    const punto = (g) => igual(g, () => g(0)), imgL = lados.map((l) => (s) => { const [u, v] = l(s); return r(u, v); });
    const cosido = [igual(imgL[0], (s) => imgL[2](1 - s)), igual(imgL[1], (s) => imgL[3](1 - s))];
    const vivos = [0, 1, 2, 3].filter((i) => !punto(imgL[i]) && !cosido[i % 2]), cerrada = !vivos.length;
    const pasos = [];
    pasos.push({ t: 'The surface', html: `$r(u, v) = ${vecTxt(rs.map(T))}$ with $u ∈ [${ex(u1)}, ${ex(u2)}]$ and $v ∈ [${ex(v1)}, ${ex(v2)}]$.` });
    pasos.push({ t: 'Normal vector', html: `$r_u = ${vecTxt(ru.map(T))}$, $r_v = ${vecTxt(rv.map(T))}$ and $r_u × r_v = ${vecTxt(N.map((n) => (nulo(n) ? '0' : T(n))))}$. It is perpendicular to the surface and its magnitude gives the area element, $dS = |r_u × r_v| du dv$: the area is $${ex(area, 5)}$.` });
    pasos.push({ t: 'Flux', html: `On the surface $F(r(u, v)) = ${vecTxt(Fs.map((n) => (nulo(n) ? '0' : T(n))))}$, and $Φ = ∬_S F · dS = ∬ F(r(u, v)) · (r_u × r_v) du dv = ∫_{${ex(u1)}}^{${ex(u2)}} ∫_{${ex(v1)}}^{${ex(v2)}} (${nulo(dentro) ? '0' : E.texto(dentro)}) dv du$ = <b>${em(flujo, 5)}</b>. ${Math.abs(flujo) < 1e-10 ? 'It is 0: as much field enters as leaves.' : flujo > 0 ? 'It is positive: the field crosses the surface in the direction of the normal.' : 'It is negative: the field crosses it against the normal.'}` });
    pasos.push({ t: 'Stokes\' theorem', html: `$∬_S (∇ × F) · dS = ∮_{∂S} F · dr$, with $∇ × F = ${vecTxt(C.rot.map((n) => (nulo(n) ? '0' : T(n))))}$. The flux of the curl gives <b>${em(rotFlujo, 5)}</b> and the circulation around the boundary (traversed leaving the surface on the left when seen from the tip of the normal) <b>${em(circula, 5)}</b>${cuadra ? ', the same.' : ': they do not match, so the field has a singularity on the surface and Stokes\' theorem cannot be applied.'}${cuadra && cerrada ? ' The surface is closed (it has no boundary), so both are 0.' : ''}${C.cons && cuadra ? ' Since F is conservative, its curl is 0 and the circulation around any closed curve is too.' : ''}` });
    const lineas = [], flechas = [];
    for (let i = 0; i <= 10; i++) { const u = u1 + (dU * i) / 10, w = v1 + (dV * i) / 10, a = [], b = []; for (let j = 0; j <= 32; j++) { a.push(r(u, v1 + (dV * j) / 32)); b.push(r(u1 + (dU * j) / 32, w)); } lineas.push(a, b); }
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const u = u1 + (dU * (i + 0.5)) / 5, v = v1 + (dV * (j + 0.5)) / 5, n = Nv(u, v), m = Math.hypot(...n); if (m > 1e-12) flechas.push({ p: r(u, v), n: n.map((c) => c / m) }); }
    const borde = vivos.map((i) => Array.from({ length: 41 }, (_, j) => imgL[i](j / 40)));
    return { modo: 'superficie', d3: true, ...C, flujo, area, rotFlujo, circula, stokes: cuadra, cerrada, normalTxt: N.map(T), lineas, flechas, borde, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  function gauss(sc) {
    const C = leeCampo(sc), dvv = (x, y, z) => val(C.dv, [x, y, z]), Fv = (x, y, z) => C.Fv([x, y, z]);
    const tipo = ['esfera', 'cilindro'].includes(sc.solido) ? sc.solido : 'caja', m = 6;
    const caras = [], lineas = [], flechas = [];
    let vol, V, solTxt, sol;
    const malla = (r, a1, a2, b1, b2, nl = 8) => { for (let i = 0; i <= nl; i++) { const a = [], b = []; for (let j = 0; j <= 32; j++) { a.push(r(a1 + ((a2 - a1) * i) / nl, b1 + ((b2 - b1) * j) / 32)); b.push(r(a1 + ((a2 - a1) * j) / 32, b1 + ((b2 - b1) * i) / nl)); } lineas.push(a, b); } };
    const flecha = (p, n) => flechas.push({ p, n, F: Fv(...p) });
    if (tipo === 'caja') {
      const x1 = num(sc.x1, 'minimum x'), x2 = num(sc.x2, 'maximum x'), y1 = num(sc.y1, 'minimum y'), y2 = num(sc.y2, 'maximum y'), z1 = num(sc.z1, 'minimum z'), z2 = num(sc.z2, 'maximum z');
      if (!(x2 > x1 && y2 > y1 && z2 > z1)) throw new Error('The box has to go from the smaller to the larger coordinate in x, y and z');
      const L = [[x1, x2], [y1, y2], [z1, z2]], nom = ['x', 'y', 'z'];
      for (let i = 0; i < 3; i++) {
        const [j, k] = [0, 1, 2].filter((q) => q !== i);
        for (const [lado, sg] of [[1, 1], [0, -1]]) {
          const pt = (a, b) => { const p = [0, 0, 0]; p[i] = L[i][lado]; p[j] = a; p[k] = b; return p; };
          const fl = sg * doble2((a, b) => C.Fv(pt(a, b))[i], L[j][0], L[j][1], L[k][0], L[k][1], 8);
          caras.push({ nom: `$${nom[i]} = ${ex(L[i][lado])}$ (normal ${sg > 0 ? '+' : '−'}${nom[i]})`, flujo: fl });
          malla(pt, L[j][0], L[j][1], L[k][0], L[k][1], 1);
          const n = [0, 0, 0]; n[i] = sg; flecha(pt((L[j][0] + L[j][1]) / 2, (L[k][0] + L[k][1]) / 2), n);
        }
      }
      vol = integra((x) => integra((y) => integra((z) => dvv(x, y, z), z1, z2, m), y1, y2, m), x1, x2, m);
      V = (x2 - x1) * (y2 - y1) * (z2 - z1);
      solTxt = `the box $[${ex(x1)}, ${ex(x2)}] × [${ex(y1)}, ${ex(y2)}] × [${ex(z1)}, ${ex(z2)}]$, with its six faces and the outward normal`;
      sol = { tipo, L };
    } else if (tipo === 'esfera') {
      const cx = numOp(sc.cx, 'the centre x', 0), cy = numOp(sc.cy, 'the centre y', 0), cz = numOp(sc.cz, 'the centre z', 0), R = num(sc.rad, 'the radius');
      if (!(R > 0)) throw new Error('The radius has to be greater than 0');
      const e = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], pt = (th, ph, r = R) => { const q = e(th, ph); return [cx + r * q[0], cy + r * q[1], cz + r * q[2]]; };
      caras.push({ nom: 'the sphere (outward normal, $dS = R^2 sin θ dθ dφ$)', flujo: doble2((th, ph) => punto3(C.Fv(pt(th, ph)), e(th, ph)) * R * R * Math.sin(th), 0, Math.PI, 0, 2 * Math.PI, 16) });
      vol = integra((r) => r * r * integra((th) => Math.sin(th) * integra((ph) => { const p = pt(th, ph, r); return dvv(...p); }, 0, 2 * Math.PI, m), 0, Math.PI, m), 0, R, m);
      V = (4 / 3) * Math.PI * R ** 3;
      malla((th, ph) => pt(th, ph), 0, Math.PI, 0, 2 * Math.PI, 8);
      for (const th of [0.5, 1.2, 1.9, 2.6]) for (let k = 0; k < 6; k++) { const ph = (k * Math.PI) / 3 + th; flecha(pt(th, ph), e(th, ph)); }
      solTxt = `the sphere with centre (${f(cx)}, ${f(cy)}, ${f(cz)}) and radius ${f(R)}, with the outward normal`;
      sol = { tipo, c: [cx, cy, cz], R };
    } else {
      const cx = numOp(sc.cx, 'the centre x', 0), cy = numOp(sc.cy, 'the centre y', 0), R = num(sc.rad, 'the radius'), z1 = num(sc.z1, 'minimum z'), z2 = num(sc.z2, 'maximum z');
      if (!(R > 0)) throw new Error('The radius has to be greater than 0');
      if (!(z2 > z1)) throw new Error('The maximum z has to be greater than the minimum');
      const pt = (r, ph, z) => [cx + r * Math.cos(ph), cy + r * Math.sin(ph), z];
      caras.push({ nom: 'the lateral wall (normal $(cos φ, sin φ, 0)$, $dS = R dφ dz$)', flujo: doble2((ph, z) => { const F = C.Fv(pt(R, ph, z)); return (F[0] * Math.cos(ph) + F[1] * Math.sin(ph)) * R; }, 0, 2 * Math.PI, z1, z2, 16) });
      caras.push({ nom: `the top cap, $z = ${ex(z2)}$ (normal +z)`, flujo: doble2((r, ph) => C.Fv(pt(r, ph, z2))[2] * r, 0, R, 0, 2 * Math.PI, 12) });
      caras.push({ nom: `the bottom cap, $z = ${ex(z1)}$ (normal −z)`, flujo: -doble2((r, ph) => C.Fv(pt(r, ph, z1))[2] * r, 0, R, 0, 2 * Math.PI, 12) });
      vol = integra((r) => r * integra((ph) => integra((z) => dvv(...pt(r, ph, z)), z1, z2, m), 0, 2 * Math.PI, m), 0, R, m);
      V = Math.PI * R * R * (z2 - z1);
      malla((ph, z) => pt(R, ph, z), 0, 2 * Math.PI, z1, z2, 6);
      for (const z of [z1, z2]) { const a = []; for (let j = 0; j <= 48; j++) a.push(pt(R, (2 * Math.PI * j) / 48, z)); lineas.push(a); }
      for (let k = 0; k < 8; k++) { const ph = (k * Math.PI) / 4; flecha(pt(R, ph, (z1 + z2) / 2), [Math.cos(ph), Math.sin(ph), 0]); }
      flecha(pt(0, 0, z2), [0, 0, 1]); flecha(pt(0, 0, z1), [0, 0, -1]);
      solTxt = `the cylinder with vertical axis through (${f(cx)}, ${f(cy)}), radius ${f(R)} and $${ex(z1)} ≤ z ≤ ${ex(z2)}$: the wall and the two caps, with the outward normal`;
      sol = { tipo, c: [cx, cy], R, z1, z2 };
    }
    const flujo = caras.reduce((s, q) => s + q.flujo, 0);
    if (![flujo, vol].every(isFinite)) throw new Error('The field is not defined on the whole solid (is there a singularity?)');
    const tol = (a) => 1e-5 * Math.max(1, Math.abs(a)), singular = Math.abs(flujo - vol) > tol(flujo), dvS = E.simp(C.dv);
    const pasos = [];
    pasos.push({ t: 'The field and the solid', html: `$F = ${vecTxt([C.P, C.Q, C.R].map(T))}$ in ${solTxt}.` });
    pasos.push({ t: 'Flux through the boundary', html: `$∯_S F · dS$ is the sum of what leaves through each face: ${caras.map((q) => `${q.nom}: ${em(q.flujo, 5)}`).join('; ')}. In total, <b>${em(flujo, 5)}</b>.` });
    pasos.push({ t: 'Divergence', html: `$∇ · F = {∂P}/{∂x} + {∂Q}/{∂y} + {∂R}/{∂z} = ${nulo(C.dv) ? '0' : T(C.dv)}$` });
    pasos.push({ t: 'Divergence theorem', html: `$∯_S F · dS = ∭_V ∇ · F dV$: the triple integral gives <b>${em(vol, 5)}</b>${singular ? '. It does not match: the field is not defined at some point inside (a singularity, like a point charge), and the theorem cannot be applied as it stands.' : ', the same as the flux.'}${dvS.t === 'n' && !singular ? ` Since the divergence is constant, it is ${em(dvS.v)} times the volume (${em(V)}).` : ''}` });
    return { modo: 'gauss', d3: true, ...C, sol, caras: caras.map((q) => q.flujo), flujo, vol, V, singular, lineas, flechas, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'vectorial') return vectorial(sc);
    if (sc.modo === 'linea') return linea(sc);
    if (sc.modo === 'masa') return masa(sc);
    if (sc.modo === 'superficie') return superficie(sc);
    if (sc.modo === 'gauss') return gauss(sc);
    if (sc.modo === 'green') return green(sc);
    if (sc.modo === 'curvilineas') return Cv().calcula(sc);
    return escalar(sc);
  }

  const ejemplos = [
    { clave: 'paraboloide', nombre: 'Gradient of f = x² + y²', sc: { modo: 'escalar', f: 'x^2 + y^2', x0: '1', y0: '2', z0: '', u: '1, 1' } },
    { clave: 'temperatura', nombre: 'Temperature T = 100 − x² − 2y²', sc: { modo: 'escalar', f: '100 - x^2 - 2y^2', x0: '2', y0: '1', z0: '', u: '-1, 0' } },
    { clave: 'xyz', nombre: 'f = x y z: directional derivative in 3D', sc: { modo: 'escalar', f: 'x y z', x0: '1', y0: '2', z0: '3', u: '1, 2, 2' } },
    { clave: 'armonica', nombre: 'f = eˣ sin y (harmonic)', sc: { modo: 'escalar', f: 'e^x sin y', x0: '0', y0: 'π/2', z0: '', u: '' } },
    { clave: 'fuente', nombre: 'F = (x, y): a source', sc: { modo: 'vectorial', P: 'x', Q: 'y', R: '', x0: '1', y0: '1', z0: '' } },
    { clave: 'remolino', nombre: 'F = (−y, x): a whirlpool', sc: { modo: 'vectorial', P: '-y', Q: 'x', R: '', x0: '1', y0: '0', z0: '' } },
    { clave: 'conservativo', nombre: 'F = (yz, xz, xy): conservative', sc: { modo: 'vectorial', P: 'y z', Q: 'x z', R: 'x y', x0: '1', y0: '2', z0: '3' } },
    { clave: 'cizalla', nombre: 'F = (y, 0): shear, rotates without turning', sc: { modo: 'vectorial', P: 'y', Q: '0', R: '', x0: '0', y0: '1', z0: '' } },
    { clave: 'carga', nombre: 'Field of a charge in the plane', sc: { modo: 'vectorial', P: 'x/(x^2 + y^2)', Q: 'y/(x^2 + y^2)', R: '', x0: '1', y0: '1', z0: '' } },
    { clave: 'potencial-2d', nombre: 'Potential of (2xy, x² + 3y²)', sc: { modo: 'vectorial', P: '2x y', Q: 'x^2 + 3y^2', R: '', x0: '1', y0: '2', z0: '' } },
    { clave: 'potencial-3d', nombre: 'Potential of (y² + 2xz, 2xy + z, x² + y)', sc: { modo: 'vectorial', P: 'y^2 + 2x z', Q: '2x y + z', R: 'x^2 + y', x0: '1', y0: '1', z0: '2' } },
    { clave: 'circulo', nombre: 'Work of (−y, x) in one turn', sc: { modo: 'linea', P: '-y', Q: 'x', R: '', cx: 'cos t', cy: 'sin t', cz: '', a: '0', b: '2π' } },
    { clave: 'parabola', nombre: 'Work of (y, x) along y = x²', sc: { modo: 'linea', P: 'y', Q: 'x', R: '', cx: 't', cy: 't^2', cz: '', a: '0', b: '1' } },
    { clave: 'helice', nombre: 'Work along a helix', sc: { modo: 'linea', P: '-y', Q: 'x', R: 'z', cx: 'cos t', cy: 'sin t', cz: 't', a: '0', b: '2π' } },
    { clave: 'segmento', nombre: 'Work of (x², xy) along a segment', sc: { modo: 'linea', P: 'x^2', Q: 'x y', R: '', cx: 't', cy: '2t', cz: '', a: '0', b: '1' } },
    { clave: 'poligonal-triangulo', nombre: 'Work of (−y, x) around the outline of a triangle', sc: { modo: 'linea', P: '-y', Q: 'x', R: '', curva: 'poligonal', vertices: '0 0; 1 0; 0 1', cierra: 'si' } },
    { clave: 'poligonal-camino', nombre: 'Work of (2xy, x²) along two segments', sc: { modo: 'linea', P: '2x y', Q: 'x^2', R: '', curva: 'poligonal', vertices: '0 0; 1 0; 1 2', cierra: 'no' } },
    { clave: 'masa-semicirculo', nombre: 'Semicircular wire of density y', sc: { modo: 'masa', f: 'y', curva: 'param', cx: 'cos t', cy: 'sin t', cz: '', a: '0', b: 'π' } },
    { clave: 'cicloide', nombre: 'Length of an arc of a cycloid', sc: { modo: 'masa', f: '1', curva: 'param', cx: 't - sin t', cy: '1 - cos t', cz: '', a: '0', b: '2π' } },
    { clave: 'masa-helice', nombre: 'Mass of a helix of density z', sc: { modo: 'masa', f: 'z', curva: 'param', cx: 'cos t', cy: 'sin t', cz: 't', a: '0', b: '2π' } },
    { clave: 'masa-triangulo', nombre: '∫ x ds around the outline of a triangle', sc: { modo: 'masa', f: 'x', curva: 'poligonal', vertices: '0 0; 1 0; 1 1', cierra: 'si' } },
    { clave: 'green-circulo', nombre: 'Green: (−y, x) on the circle', sc: { modo: 'green', P: '-y', Q: 'x', region: 'circulo', cx: '0', cy: '0', rad: '1' } },
    { clave: 'green-rect', nombre: 'Green: (xy, x²) on a rectangle', sc: { modo: 'green', P: 'x y', Q: 'x^2', region: 'rectangulo', x1: '0', x2: '2', y1: '0', y2: '1' } },
    { clave: 'green-agujero', nombre: 'Green fails: (−y, x)/(x² + y²) with the origin inside', sc: { modo: 'green', P: '-y/(x^2 + y^2)', Q: 'x/(x^2 + y^2)', region: 'circulo', cx: '0', cy: '0', rad: '1' } },
    { clave: 'green-flujo', nombre: 'Flux of (x, y) through a circle', sc: { modo: 'green', P: 'x', Q: 'y', region: 'circulo', cx: '0', cy: '0', rad: '2' } },
    { clave: 'green-triangulo', nombre: 'Green: (−y, x) on a triangle', sc: { modo: 'green', P: '-y', Q: 'x', region: 'poligono', vertices: '0 0; 2 0; 0 1' } },
    { clave: 'green-poligono', nombre: 'Green: (xy, x²) on a pentagon', sc: { modo: 'green', P: 'x y', Q: 'x^2', region: 'poligono', vertices: '0 0; 2 0; 2 2; 1 3; 0 2' } },
    { clave: 'green-curvas', nombre: 'Green: between y = x² and y = x', sc: { modo: 'green', P: '-y', Q: 'x', region: 'curvas', g1: 'x^2', g2: 'x', a: '0', b: '1' } },
    { clave: 'green-semicirculo', nombre: 'Green: (y², 3xy) on a semicircle', sc: { modo: 'green', P: 'y^2', Q: '3x y', region: 'curvas', g1: '0', g2: '√(1 - x^2)', a: '-1', b: '1' } },
    { clave: 'flujo-esfera', nombre: 'Flux of (x, y, z) through the unit sphere', sc: { modo: 'superficie', P: 'x', Q: 'y', R: 'z', sx: 'sin u cos v', sy: 'sin u sin v', sz: 'cos u', u1: '0', u2: 'π', v1: '0', v2: '2π' } },
    { clave: 'flujo-plano', nombre: 'Flux of (0, 0, z) through a square at z = 2', sc: { modo: 'superficie', P: '0', Q: '0', R: 'z', sx: 'u', sy: 'v', sz: '2', u1: '0', u2: '1', v1: '0', v2: '1' } },
    { clave: 'stokes-paraboloide', nombre: 'Stokes: (−y, x, z) on a paraboloid', sc: { modo: 'superficie', P: '-y', Q: 'x', R: 'z', sx: 'u cos v', sy: 'u sin v', sz: '1 - u^2', u1: '0', u2: '1', v1: '0', v2: '2π' } },
    { clave: 'stokes-hemisferio', nombre: 'Stokes: (y, −x, 0) on a half sphere', sc: { modo: 'superficie', P: 'y', Q: '-x', R: '0', sx: 'sin u cos v', sy: 'sin u sin v', sz: 'cos u', u1: '0', u2: 'π/2', v1: '0', v2: '2π' } },
    { clave: 'gauss-caja', nombre: 'Gauss: (x, y, z) in a box', sc: { modo: 'gauss', P: 'x', Q: 'y', R: 'z', solido: 'caja', x1: '0', x2: '1', y1: '0', y2: '2', z1: '0', z2: '3' } },
    { clave: 'gauss-esfera', nombre: 'Gauss: (x³, y³, z³) in the unit sphere', sc: { modo: 'gauss', P: 'x^3', Q: 'y^3', R: 'z^3', solido: 'esfera', cx: '0', cy: '0', cz: '0', rad: '1' } },
    { clave: 'gauss-cilindro', nombre: 'Gauss: (x, y, z²) in a cylinder', sc: { modo: 'gauss', P: 'x', Q: 'y', R: 'z^2', solido: 'cilindro', cx: '0', cy: '0', rad: '1', z1: '0', z2: '2' } },
    { clave: 'gauss-carga', nombre: 'Gauss fails: field of a charge with it inside', sc: { modo: 'gauss', P: 'x/(x^2 + y^2 + z^2)^(3/2)', Q: 'y/(x^2 + y^2 + z^2)^(3/2)', R: 'z/(x^2 + y^2 + z^2)^(3/2)', solido: 'esfera', cx: '0', cy: '0', cz: '0', rad: '1' } },
  ];

  let curv = [];
  try { curv = Cv().ejemplos.map((e) => ({ clave: e.clave, nombre: e.nombre, sc: { modo: 'curvilineas', ...e.sc } })); } catch (e) { curv = []; }
  ejemplos.push(...curv);

  return { resolver, escalar, vectorial, linea, masa, green, superficie, gauss, potSimb, ejemplos, integra, f, ex, sust, primEn };
})();

