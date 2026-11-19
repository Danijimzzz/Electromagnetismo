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
  const lee = (s, nom, vars = V3) => { if (vacio(s)) throw new Error(`${nom.toLowerCase()} fehlt`); return E.lee(s, nom, vars); };
  const leeOp = (s, nom, vars = V3) => (vacio(s) ? E.N(0) : E.lee(s, nom, vars));
  const num = (s, nom) => { if (vacio(s)) throw new Error(`Es fehlt ${nom}`); const v = E.valor(E.lee(s, nom, []), 0); if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`); return v; };
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
    const fn = lee(sc.f, 'Die Funktion f');
    const d3 = tiene([fn], 'z'), p = [num(sc.x0, 'x₀'), num(sc.y0, 'y₀'), d3 ? numOp(sc.z0, 'z₀', 0) : 0];
    const vs = d3 ? V3 : V3.slice(0, 2), gr = vs.map((v) => E.deriva(fn, v)), lap = suma(vs.map((v, i) => E.deriva(gr[i], v)));
    const f0 = val(fn, p), g0 = gr.map((n) => val(n, p)), mod = Math.hypot(...g0);
    if (!isFinite(f0) || !g0.every(isFinite)) throw new Error(`f oder ihre Ableitungen sind in ${pTxt(p, d3)} nicht definiert`);
    const pasos = [], par = (v) => `{∂f}/{∂${v}}`;
    pasos.push({ t: 'Partielle Ableitungen', html: vs.map((v, i) => `$${par(v)} = ${T(gr[i])}$`).join(', &ensp; ') + '. Jede entsteht durch Ableiten nach dieser Variablen, wobei die anderen als Konstanten behandelt werden.' });
    pasos.push({ t: 'Gradient', html: `$∇f = ${vecTxt(gr.map(T))}$ und im Punkt ${pTxt(p, d3)}: $∇f = ${vecTxt(g0.map((v) => ex(v)))}$, mit dem Betrag $|∇f| = ${ex(mod)}$. Er zeigt dorthin, wo f am schnellsten wächst, und steht senkrecht auf den ${d3 ? 'Niveauflächen' : 'Niveaulinien'}.` });
    let du = null, u = null;
    if (!vacio(sc.u)) {
      u = String(sc.u).split(/[;,]/).filter((s) => s.trim()).map((s, i) => num(s, `die Komponente ${i + 1} der Richtung`));
      while (u.length < vs.length) u.push(0);
      u = u.slice(0, vs.length);
      const nu = Math.hypot(...u);
      if (!(nu > 0)) throw new Error('Die Richtung darf nicht der Nullvektor sein');
      du = g0.reduce((s, g, i) => s + (g * u[i]) / nu, 0);
      pasos.push({ t: 'Richtungsableitung', html: `Mit dem Einheitsvektor $u = ${vecTxt(u.map((v) => f(v)))}${Math.abs(nu - 1) < 1e-12 ? '' : `/${ex(nu)}`}$: $D_u f = ∇f · u = ${ex(du)}$. Der größtmögliche Wert ist $|∇f| = ${ex(mod)}$, in Richtung des Gradienten.` });
    }
    const l0 = val(lap, p);
    pasos.push({ t: 'Laplace-Operator', html: `$∇² f = ${vs.map((v) => `{∂^2 f}/{∂${v}^2}`).join(' + ')} = ${T(lap)}$${E.tieneX(E.simp(lap)) || E.tieneX(E.simp(lap), 'y') || E.tieneX(E.simp(lap), 'z') ? `, das im Punkt den Wert ${em(l0)} hat` : ''}.${nulo(lap) ? ' Es ist 0: f ist eine harmonische Funktion, wie das elektrostatische Potential dort, wo keine Ladungen sind.' : ''}` });
    return { modo: 'escalar', d3, fn, fTxt: T(fn), p, f0, gr, grTxt: gr.map(T), g0, mod, u, du, lap: l0, lapTxt: T(lap), armonica: nulo(lap), F: (x, y, z = 0) => val(fn, [x, y, z]), G: (x, y, z = 0) => gr.map((n) => val(n, [x, y, z])), pasos };
  }

  function leeCampo(sc) {
    const P = leeOp(sc.P, 'Die Komponente P'), Q = leeOp(sc.Q, 'Die Komponente Q'), R = leeOp(sc.R, 'Die Komponente R');
    if (esCero(P) && esCero(Q) && esCero(R)) throw new Error('Schreibe mindestens eine Komponente des Feldes');
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
    if (!F0.every(isFinite)) throw new Error(`Das Feld ist in ${pTxt(p, d3)} nicht definiert`);
    const pasos = [], comp = d3 ? [C.P, C.Q, C.R] : [C.P, C.Q];
    pasos.push({ t: 'Das Feld', html: `$F = ${vecTxt(comp.map(T))}$; im Punkt ${pTxt(p, d3)} ist $F = ${vecTxt((d3 ? F0 : F0.slice(0, 2)).map((v) => ex(v)))}$, vom Betrag ${em(Math.hypot(...F0))}.` });
    const div0 = val(C.dv, p), rot0 = C.rot.map((n) => val(n, p));
    pasos.push({ t: 'Divergenz', html: `$∇ · F = {∂P}/{∂x} + {∂Q}/{∂y}${d3 ? ' + {∂R}/{∂z}' : ''} = ${nulo(C.dv) ? '0' : T(C.dv)}$, was im Punkt <b>${em(div0)}</b> beträgt. ${Math.abs(div0) < 1e-10 ? 'Es tritt weder Feld aus noch ein: Dort gibt es keine Quellen oder Senken.' : div0 > 0 ? 'Sie ist positiv: Aus der Umgebung des Punktes tritt mehr Feld aus, als eintritt (eine Quelle).' : 'Sie ist negativ: Es tritt mehr Feld ein, als austritt (eine Senke).'}` });
    pasos.push({ t: 'Rotation', html: d3 ? `$∇ × F = ({∂R}/{∂y} − {∂Q}/{∂z}, {∂P}/{∂z} − {∂R}/{∂x}, {∂Q}/{∂x} − {∂P}/{∂y}) = ${vecTxt(C.rot.map((n) => (nulo(n) ? '0' : T(n))))}$, im Punkt <b>${vecTxt(rot0.map((v) => ex(v)))}</b>.` : `In der Ebene hat die Rotation nur eine z-Komponente: $(∇ × F)_z = {∂Q}/{∂x} − {∂P}/{∂y} = ${nulo(C.rot[2]) ? '0' : T(C.rot[2])}$, im Punkt <b>${em(rot0[2])}</b>. ${Math.abs(rot0[2]) < 1e-10 ? 'Ein dort platziertes Schaufelrad würde sich nicht drehen.' : rot0[2] > 0 ? 'Ein dort platziertes Schaufelrad würde sich gegen den Uhrzeigersinn drehen.' : 'Ein dort platziertes Schaufelrad würde sich im Uhrzeigersinn drehen.'}` });
    let phi = null, base = null, ps = null;
    if (C.cons) {
      ps = potSimb(C);
      if (ps) {
        phi = val(ps.phi, p);
        const g = d3 ? 'g(y, z)' : 'g(y)', T0 = (n) => (nulo(n) ? '0' : T(n)), mas = (n, r) => (nulo(n) ? r : `${T(n)} + ${r}`);
        pasos.push({ t: 'Konservativ', html: 'Die Rotation ist überall 0, also ist F konservativ (in einem Gebiet ohne Löcher): $F = ∇φ$, und die Arbeit zwischen zwei Punkten hängt nicht vom Weg ab. Das Potential erhält man durch Integrieren Komponente für Komponente.' });
        pasos.push({ t: 'P nach x integrieren', html: `$φ = ∫ P dx = ${mas(ps.f1, g)}$, wobei ${g} die «Konstante» ist, weil es nicht von x abhängt.` });
        pasos.push({ t: 'Nach y ableiten und mit Q gleichsetzen', html: `${'$'}{∂φ}/{∂y} = ${mas(E.deriva(ps.f1, 'y'), d3 ? '{∂g}/{∂y}' : 'g′(y)')} = ${T(C.Q)}$, also ${d3 ? '${∂g}/{∂y}' : '$g′(y)'} = ${T0(ps.ry)}$ und $g = ${mas(ps.f2, d3 ? 'h(z)' : 'K')}$.` });
        if (d3) pasos.push({ t: 'Nach z ableiten und mit R gleichsetzen', html: `${'$'}{∂φ}/{∂z} = ${mas(E.deriva(E.simp({ t: '+', a: ps.f1, b: ps.f2 }), 'z'), 'h′(z)')} = ${nulo(C.R) ? '0' : T(C.R)}$, also $h′(z) = ${T0(ps.rz)}$ und $h = ${mas(ps.f3, 'K')}$.` });
        pasos.push({ t: 'Potential', html: `$φ(x, y${d3 ? ', z' : ''}) = ${T(ps.phi)} + K$ (man prüft, dass $∇φ = F$). Mit $K = 0$ ist im Punkt $φ${pTxt(p, d3)} = ${ex(phi)}$.` });
      } else {
        base = baseDe(C); phi = potencial(C, p, base);
        pasos.push({ t: 'Konservativ', html: `Die Rotation ist überall 0, also ist F konservativ (in einem Gebiet ohne Löcher): $F = ∇φ$, und die Arbeit zwischen zwei Punkten hängt nicht vom Weg ab. Ich finde φ nicht mit elementaren Stammfunktionen; setzt man $φ = 0$ in ${pTxt(base, d3)} und integriert längs der Strecke, ist $φ${pTxt(p, d3)} = ${ex(phi)}$.` });
      }
    } else pasos.push({ t: 'Nicht konservativ', html: 'Da die Rotation nicht 0 ist, ist F nicht der Gradient eines Potentials: Die Arbeit hängt vom Weg ab, und auf einer geschlossenen Kurve muss sie nicht 0 sein.' });
    return { modo: 'vectorial', d3, ...C, p, F0, div: div0, rot0, dvTxt: T(C.dv), rotTxt: C.rot.map(T), phi, base, phiTxt: ps ? T(ps.phi) : null, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  const TV = { t: 'x', n: 't' };
  const lin = (a, d) => E.simp({ t: '+', a: E.N(a), b: prod(E.N(d), TV) });
  function vertices(s, nom = 'die Eckpunkte') {
    if (vacio(s)) throw new Error(`${nom} fehlen`);
    const grupos = /\(/.test(s) ? [...String(s).matchAll(/\(([^)]*)\)/g)].map((m) => m[1]) : String(s).split(';');
    const vs = grupos.filter((q) => q.trim()).map((q, i) => {
      const cs = q.split(/[,\s]+/).filter((c) => c);
      if (cs.length < 2 || cs.length > 3) throw new Error(`Der Eckpunkt ${i + 1} muss 2 oder 3 Koordinaten haben (trenne die Eckpunkte mit «;» und verwende den Punkt für Dezimalstellen)`);
      const p = cs.map((c, j) => num(c, `die Koordinate ${j + 1} des Eckpunkts ${i + 1}`));
      return p.length === 2 ? [...p, 0] : p;
    });
    if (vs.length < 2) throw new Error('Es sind mindestens zwei Eckpunkte nötig');
    return vs;
  }
  function curva(sc) {
    if (sc.curva === 'poligonal') {
      const vs = vertices(sc.vertices);
      if (sc.cierra === 'si' && Math.hypot(...vs[0].map((v, i) => v - vs[vs.length - 1][i])) > 1e-12) vs.push(vs[0]);
      const trozos = [];
      for (let k = 0; k + 1 < vs.length; k++) {
        const A = vs[k], B = vs[k + 1];
        if (Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 1e-12) throw new Error(`Die Eckpunkte ${k + 1} und ${k + 2} sind derselbe Punkt`);
        trozos.push({ rx: lin(A[0], B[0] - A[0]), ry: lin(A[1], B[1] - A[1]), rz: lin(A[2], B[2] - A[2]), a: 0, b: 1, A, B });
      }
      const n = trozos.length, rr = (t) => { const k = Math.max(0, Math.min(n - 1, Math.floor(t))), s = t - k, A = vs[k], B = vs[k + 1]; return A.map((v, i) => v + s * (B[i] - v)); };
      return { trozos, d3: vs.some((p) => p[2] !== 0), poligonal: true, vs, a: 0, b: n, r: rr };
    }
    const VT = ['t'];
    const rx = lee(sc.cx, 'Das x(t) der Kurve', VT), ry = lee(sc.cy, 'Das y(t) der Kurve', VT), rz = leeOp(sc.cz, 'Das z(t) der Kurve', VT);
    const a = num(sc.a, 'der Anfangswert von t'), b = num(sc.b, 'der Endwert von t');
    if (!(b > a)) throw new Error('Der Endwert von t muss größer als der Anfangswert sein');
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
      for (const t of [q.a, (q.a + q.b) / 2, q.b]) if (!isFinite(g(t))) throw new Error(`Der Integrand ist ${cu.poligonal ? `am Punkt ${pTxt(cu.r(cu.trozos.indexOf(q) + t), d3)}` : `bei t = ${f(t)}`} nicht definiert`);
      const m = cu.poligonal ? 32 : 200;
      return { ...q, dr, enT, dentro, W: integra(g, q.a, q.b, m), L: integra((t) => Math.hypot(...dr.map((n) => E.valor(n, 0, { t }))), q.a, q.b, m) };
    });
    const W = tr.reduce((s, q) => s + q.W, 0), L = tr.reduce((s, q) => s + q.L, 0);
    const A = tr[0].A, B = tr[tr.length - 1].B, cerrada = Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) < 1e-9;
    const pasos = [];
    if (!cu.poligonal) {
      const q = tr[0];
      pasos.push({ t: 'Die Kurve', html: `${trozoTxt(q, cp)}, von ${pTxt(A, d3)} nach ${pTxt(B, d3)}${cerrada ? ' (sie ist geschlossen)' : ''}. Ihre Ableitung ist $r′(t) = ${vecTxt(cp.map((i) => T(q.dr[i])))}$.` });
      pasos.push({ t: 'Der Integrand', html: `Setzt man die Kurve in das Feld ein, ist $F(r(t)) = ${vecTxt(cp.map((i) => T(q.enT[i])))}$, und $F(r(t)) · r′(t) = ${E.texto(q.dentro)}$.` });
      pasos.push({ t: 'Arbeit', html: `$W = ∫_C F · dr = ∫_{${ex(q.a)}}^{${ex(q.b)}} (${E.texto(q.dentro)}) dt$ = <b>${em(W, 5)}</b>` });
    } else {
      pasos.push({ t: 'Der Streckenzug', html: `Sie verläuft über ${cu.vs.map((p) => pTxt(p, d3)).join(' → ')}${cerrada ? ' (sie ist geschlossen)' : ''}: Es sind ${tr.length} Strecken, und das Integral ist die Summe der Integrale jeder Strecke. Jede Strecke von A nach B wird mit $r(t) = A + t (B − A)$, $t ∈ [0, 1]$ durchlaufen.` });
      tr.forEach((q, k) => pasos.push({ t: `Abschnitt ${k + 1}: von ${pTxt(q.A, d3)} nach ${pTxt(q.B, d3)}`, html: `$r(t) = ${vecTxt(cp.map((i) => T([q.rx, q.ry, q.rz][i])))}$, $r′ = ${vecTxt(cp.map((i) => T(q.dr[i])))}$ und $F · r′ = ${E.texto(q.dentro)}$: $W_{${k + 1}} = ∫_0^1 (${E.texto(q.dentro)}) dt = ${ex(q.W, 5)}$` }));
      pasos.push({ t: 'Arbeit', html: `$W = ${tr.map((_, k) => `W_{${k + 1}}`).join(' + ')} = ${tr.map((q) => ex(q.W, 5)).join(' + ').replace(/\+ −/g, '− ')}$ = <b>${em(W, 5)}</b>` });
    }
    let dphi = null;
    if (C.cons) {
      const ps = potSimb(C), base = baseDe(C);
      dphi = ps ? val(ps.phi, B) - val(ps.phi, A) : potencial(C, B, base) - potencial(C, A, base);
      pasos.push({ t: 'Probe mit dem Potential', html: `F ist konservativ (Rotation 0), also ist die Arbeit die Potentialdifferenz zwischen den Endpunkten${ps ? `, mit $φ = ${T(ps.phi)}$` : ''}: $φ(B) − φ(A) = ${ex(dphi, 5)}$, unabhängig vom Weg.${cerrada ? ' Da die Kurve geschlossen ist, ergibt sich 0.' : ''}` });
    } else pasos.push({ t: 'Hängt vom Weg ab', html: `F ist nicht konservativ, also wäre die Arbeit längs einer anderen Kurve zwischen denselben Punkten verschieden${cerrada ? ' und auf dieser geschlossenen Kurve muss nicht 0 herauskommen' : ''}.` });
    pasos.push({ t: 'Länge der Kurve', html: `$L = ∫ |r′(t)| dt = ${ex(L, 5)}$` });
    return { modo: 'linea', d3, ...C, trozos: tr.length, a: cu.a, b: cu.b, A, B, cerrada, W, L, dphi, integrando: tr.map((q) => E.texto(q.dentro)).join('; '), r: cu.r, F: (x, y, z = 0) => C.Fv([x, y, z]), pasos };
  }

  function masa(sc) {
    const fn = lee(sc.f, 'Die Funktion f'), cu = curva(sc), d3 = tiene([fn], 'z') || cu.d3, cp = d3 ? [0, 1, 2] : [0, 1];
    let fmin = Infinity;
    const tr = cu.trozos.map((q, k) => {
      const dr = [q.rx, q.ry, q.rz].map((n) => E.deriva(n, 't')), vel = rapidez(dr), fT = E.simp(sust(fn, { x: q.rx, y: q.ry, z: q.rz }));
      const r = (t) => [q.rx, q.ry, q.rz].map((n) => E.valor(n, 0, { t })), ds = (t) => (vel.c ?? E.valor(vel.v, 0, { t })), fv = (t) => E.valor(fT, 0, { t });
      for (const t of [q.a, (q.a + q.b) / 2, q.b]) if (!isFinite(fv(t))) throw new Error(`f ist in ${pTxt(r(t), d3)} nicht definiert`);
      const m = cu.poligonal ? 32 : 200, I = (h) => integra((t) => h(t) * ds(t), q.a, q.b, m);
      for (let i = 0; i <= 40; i++) fmin = Math.min(fmin, fv(q.a + ((q.b - q.a) * i) / 40));
      return { ...q, k, dr, vel, fT, I: I(fv), L: I(() => 1), M: [0, 1, 2].map((i) => I((t) => r(t)[i] * fv(t))), G: [0, 1, 2].map((i) => I((t) => r(t)[i])) };
    });
    const tot = (h) => tr.reduce((s, q) => s + h(q), 0), I = tot((q) => q.I), L = tot((q) => q.L);
    const densidad = fmin >= 0 && I > 0, cm = densidad ? [0, 1, 2].map((i) => tot((q) => q.M[i]) / I) : null, cg = [0, 1, 2].map((i) => tot((q) => q.G[i]) / L);
    const pasos = [], dentro = (q) => (q.vel.c !== null ? (Math.abs(q.vel.c - 1) < 1e-12 ? T(q.fT) : `${ex(q.vel.c)} (${T(q.fT)})`) : `(${T(q.fT)}) ${T(q.vel.v)}`);
    pasos.push({ t: 'Längenelement', html: `Auf einer Kurve ist $ds = |r′(t)| dt$, und das Integral ist $∫_C f ds = ∫ f(r(t)) |r′(t)| dt$: Es addiert die Werte von f, gewichtet mit der Länge jedes Stücks.${cu.poligonal ? ` Der Streckenzug verläuft über ${cu.vs.map((p) => pTxt(p, d3)).join(' → ')} und wird Abschnitt für Abschnitt addiert, jeder mit $r(t) = A + t (B − A)$, $t ∈ [0, 1]$.` : ''}` });
    tr.forEach((q) => pasos.push({ t: cu.poligonal ? `Abschnitt ${q.k + 1}: von ${pTxt(q.A, d3)} nach ${pTxt(q.B, d3)}` : 'Die Kurve', html: `${trozoTxt(q, cp)}, $r′(t) = ${vecTxt(cp.map((i) => T(q.dr[i])))}$ und $|r′(t)| = ${q.vel.txt}$. Auf der Kurve ist $f(r(t)) = ${T(q.fT)}$, also $∫ f ds = ∫_{${ex(q.a)}}^{${ex(q.b)}} ${dentro(q)} dt = ${ex(q.I, 5)}$.` }));
    pasos.push({ t: 'Ergebnis', html: `$∫_C f ds = ${tr.length > 1 ? tr.map((q) => ex(q.I, 5)).join(' + ').replace(/\+ −/g, '− ') + ' = ' : ''}$<b>${em(I, 5)}</b>. Die Länge ist $L = ∫_C ds = ${ex(L, 5)}$ und der Mittelwert von f auf der Kurve $I / L = ${ex(I / L, 5)}$.` });
    if (densidad) pasos.push({ t: 'Masse und Schwerpunkt', html: `Ist f die lineare Dichte des Drahtes (es ist ≥ 0), ist seine Masse $M = ∫_C f ds = ${ex(I, 5)}$ und sein Schwerpunkt $(x̄, ȳ${d3 ? ', z̄' : ''}) = {1}/{M} (∫ x f ds, ∫ y f ds${d3 ? ', ∫ z f ds' : ''}) = ${vecTxt(cp.map((i) => ex(cm[i])))}$. Bei konstanter Dichte wäre es der Schwerpunkt ${pTxt(cg, d3)}.` });
    else pasos.push({ t: 'Keine Dichte', html: `f nimmt auf der Kurve negative Werte an, also ist das Integral keine Masse (es kann 0 oder negativ sein). Der geometrische Schwerpunkt der Kurve ist ${pTxt(cg, d3)}.` });
    return { modo: 'masa', d3, fn, I, L, media: I / L, cm, cg, trozos: tr.length, a: cu.a, b: cu.b, A: tr[0].A, B: tr[tr.length - 1].B, r: cu.r, p: [0, 0, 0], F: (x, y, z = 0) => val(fn, [x, y, z]), pasos };
  }

  function dobleTri(h, A, B, Cc) {
    const det = (B[0] - A[0]) * (Cc[1] - A[1]) - (Cc[0] - A[0]) * (B[1] - A[1]);
    return det * integra((u) => u * integra((v) => h(A[0] + u * (B[0] - A[0]) + u * v * (Cc[0] - B[0]), A[1] + u * (B[1] - A[1]) + u * v * (Cc[1] - B[1])), 0, 1, 8), 0, 1, 8);
  }
  function green(sc) {
    const P = leeOp(sc.P, 'Die Komponente P', ['x', 'y']), Q = leeOp(sc.Q, 'Die Komponente Q', ['x', 'y']);
    if (esCero(P) && esCero(Q)) throw new Error('Schreibe mindestens eine Komponente des Feldes');
    const rotz = E.simp({ t: '-', a: E.deriva(Q, 'x'), b: E.deriva(P, 'y') }), dv = E.simp({ t: '+', a: E.deriva(P, 'x'), b: E.deriva(Q, 'y') });
    const Pv = (x, y) => E.valor(P, x, { y }), Qv = (x, y) => E.valor(Q, x, { y }), rv = (x, y) => E.valor(rotz, x, { y }), dvv = (x, y) => E.valor(dv, x, { y });
    let trozos, doble, area, regTxt, reg, iterada = '';
    const segmento = (A, B) => ({ r: (s) => [A[0] + s * (B[0] - A[0]), A[1] + s * (B[1] - A[1])], d: () => [B[0] - A[0], B[1] - A[1]] });
    const poligono = (vs) => {
      const a2 = vs.reduce((s, p, i) => { const q = vs[(i + 1) % vs.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
      if (Math.abs(a2) < 1e-12) throw new Error('Die Eckpunkte schließen kein Gebiet ein (sie liegen auf einer Geraden)');
      if (a2 < 0) vs = vs.slice().reverse();
      trozos = vs.map((p, i) => segmento(p, vs[(i + 1) % vs.length]));
      doble = (h) => { let s = 0; for (let i = 1; i + 1 < vs.length; i++) s += dobleTri(h, vs[0], vs[i], vs[i + 1]); return s; };
      area = Math.abs(a2) / 2;
      return vs;
    };
    const tipo = ['rectangulo', 'poligono', 'curvas'].includes(sc.region) ? sc.region : 'circulo';
    if (tipo === 'circulo') {
      const cx = numOp(sc.cx, 'der Mittelpunkt x', 0), cy = numOp(sc.cy, 'der Mittelpunkt y', 0), R = num(sc.rad, 'der Radius');
      if (!(R > 0)) throw new Error('Der Radius muss größer als 0 sein');
      const w = 2 * Math.PI;
      trozos = [{ r: (s) => [cx + R * Math.cos(w * s), cy + R * Math.sin(w * s)], d: (s) => [-w * R * Math.sin(w * s), w * R * Math.cos(w * s)] }];
      doble = (h) => integra((r) => r * integra((t) => h(cx + r * Math.cos(t), cy + r * Math.sin(t)), 0, 2 * Math.PI, 16), 0, R, 12);
      area = Math.PI * R * R;
      regTxt = `der Kreis mit Mittelpunkt (${f(cx)}, ${f(cy)}) und Radius ${f(R)}, gegen den Uhrzeigersinn durchlaufen: $r(θ) = (${cx ? `${f(cx)} + ` : ''}${f(R) === '1' ? '' : f(R) + ' '}cos θ, ${cy ? `${f(cy)} + ` : ''}${f(R) === '1' ? '' : f(R) + ' '}sin θ)$`;
      reg = { tipo, cx, cy, R };
    } else if (tipo === 'rectangulo') {
      const x1 = num(sc.x1, 'minimales x'), x2 = num(sc.x2, 'maximales x'), y1 = num(sc.y1, 'minimales y'), y2 = num(sc.y2, 'maximales y');
      if (!(x2 > x1 && y2 > y1)) throw new Error('Das Rechteck muss von dem kleineren zum größeren x (und y) reichen');
      poligono([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]);
      doble = (h) => integra((x) => integra((y) => h(x, y), y1, y2, 16), x1, x2, 16);
      regTxt = `der Rand des Rechtecks [${f(x1)}, ${f(x2)}] × [${f(y1)}, ${f(y2)}], gegen den Uhrzeigersinn durchlaufen`;
      iterada = ` = ∫_{${ex(x1)}}^{${ex(x2)}} ∫_{${ex(y1)}}^{${ex(y2)}}`;
      reg = { tipo, x1, x2, y1, y2 };
    } else if (tipo === 'poligono') {
      const vs = poligono(vertices(sc.vertices).map((p) => p.slice(0, 2)));
      if (vs.length < 3) throw new Error('Ein Polygon braucht mindestens drei Eckpunkte');
      regTxt = `der Rand des ${vs.length === 3 ? 'Dreiecks' : `Polygons mit ${vs.length} Seiten`} ${vs.map((p) => pTxt(p, false)).join(' → ')}, gegen den Uhrzeigersinn durchlaufen (es sind ${vs.length} Strecken)`;
      reg = { tipo, vs };
    } else {
      const g1 = lee(sc.g1, 'Die untere Kurve', ['x']), g2 = lee(sc.g2, 'Die obere Kurve', ['x']), a = num(sc.a, 'das Anfangs-x'), b = num(sc.b, 'das End-x');
      if (!(b > a)) throw new Error('Das End-x muss größer als das Anfangs-x sein');
      const G1 = (x) => E.valor(g1, x), G2 = (x) => E.valor(g2, x), d1 = E.deriva(g1), d2 = E.deriva(g2);
      for (let i = 0; i <= 60; i++) {
        const x = a + ((b - a) * i) / 60;
        if (!isFinite(G1(x)) || !isFinite(G2(x))) throw new Error(`Die Kurven sind bei x = ${f(x)} nicht definiert`);
        if (G2(x) < G1(x) - 1e-12) throw new Error(`Die obere Kurve muss auf ganz [${f(a)}, ${f(b)}] über der unteren liegen (bei x = ${f(x)} tut sie es nicht)`);
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
      regTxt = `der Rand des Gebiets $${ex(a)} ≤ x ≤ ${ex(b)}$, $${T(g1)} ≤ y ≤ ${T(g2)}$, gegen den Uhrzeigersinn durchlaufen: unten $y = ${T(g1)}$ von links nach rechts und oben $y = ${T(g2)}$ zurück (plus die senkrechten Seiten, falls vorhanden)`;
      iterada = ` = ∫_{${ex(a)}}^{${ex(b)}} ∫_{${T(g1)}}^{${T(g2)}}`;
      reg = { tipo, a, b, G1, G2 };
    }
    const lazo = (h) => trozos.reduce((s, q) => { const g = (u) => h(q.r(u), q.d(u)); return s + (q.curva ? D.cuadratura(g, 0, 1) : integra(g, 0, 1, 64)); }, 0);
    const circula = lazo(([x, y], [dx, dy]) => Pv(x, y) * dx + Qv(x, y) * dy), flujo = lazo(([x, y], [dx, dy]) => Pv(x, y) * dy - Qv(x, y) * dx);
    const dobleR = doble(rv), dobleD = doble(dvv);
    const borde = (s) => { const n = trozos.length, k = Math.min(n - 1, Math.floor(((s % 1) + 1) % 1 * n)); return trozos[k].r(((s % 1) + 1) % 1 * n - k); };
    if (![circula, flujo, dobleR, dobleD].every(isFinite)) throw new Error('Das Feld ist nicht auf dem ganzen Gebiet definiert (liegt im Inneren eine Singularität?)');
    const tol = (a) => 1e-5 * Math.max(1, Math.abs(a)), singular = Math.abs(circula - dobleR) > tol(circula) || Math.abs(flujo - dobleD) > tol(flujo);
    const roto = ' Es stimmt nicht überein: Das Feld ist an einem Punkt im Inneren von D nicht definiert (eine Singularität), und dann ist der Satz von Green nicht anwendbar.';
    const pasos = [];
    pasos.push({ t: 'Das Feld und die Kurve', html: `$F = (${T(P)}, ${T(Q)})$ in ${regTxt}.` });
    pasos.push({ t: 'Zirkulation', html: `${trozos.length > 1 ? 'Addiert man die Beiträge jedes Randstücks,' : ''}$∮_C F · dr = ∮_C P dx + Q dy$ = <b>${em(circula, 5)}</b>` });
    pasos.push({ t: 'Satz von Green (Rotation)', html: `$∮_C P dx + Q dy = ∬_D ({∂Q}/{∂x} − {∂P}/{∂y}) dA${iterada ? `${iterada} (${E.texto(rotz)}) dy dx` : ''}$, mit $(∇ × F)_z = ${E.texto(rotz)}$: Das Doppelintegral ergibt <b>${em(dobleR, 5)}</b>${Math.abs(circula - dobleR) > tol(circula) ? '.' + roto : ', dasselbe wie die Zirkulation.'}${rotz.t === 'n' && !singular ? ` Da die Rotation konstant ist, ist es ${em(rotz.v)} mal die Fläche (${em(area)}).` : ''}` });
    pasos.push({ t: 'Fluss nach außen', html: `$∮_C F · n ds = ∮_C P dy − Q dx$ = <b>${em(flujo, 5)}</b>` });
    pasos.push({ t: 'Divergenzsatz in der Ebene', html: `$∮_C F · n ds = ∬_D ({∂P}/{∂x} + {∂Q}/{∂y}) dA$, mit $∇ · F = ${E.texto(dv)}$: Das Doppelintegral ergibt <b>${em(dobleD, 5)}</b>${Math.abs(flujo - dobleD) > tol(flujo) ? '.' + roto : ', dasselbe wie der Fluss.'}${dv.t === 'n' ? ` Die Divergenz ist konstant: ${ex(dv.v)} mal die Fläche.` : ''}` });
    pasos.push({ t: 'Fläche des Gebiets', html: `$A = ∬_D dA$, was man mit Green auch aus dem Rand erhalten kann: $A = {1}/{2} ∮_C (x dy − y dx) = ${ex(area, 5)}$.` });
    return { modo: 'green', d3: false, singular, P, Q, R: E.N(0), reg, circula, flujo, dobleR, dobleD, area, rotTxt: E.texto(rotz), dvTxt: E.texto(dv), borde, rv, F: (x, y) => [Pv(x, y), Qv(x, y), 0], pasos };
  }

  const UV = ['u', 'v'];
  const doble2 = (h, u1, u2, v1, v2, m = 12) => integra((u) => integra((v) => h(u, v), v1, v2, m), u1, u2, m);
  const cruz = (a, b) => [[1, 2], [2, 0], [0, 1]].map(([i, j]) => E.simp({ t: '-', a: prod(a[i], b[j]), b: prod(a[j], b[i]) }));
  const cruzN = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const punto3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function superficie(sc) {
    const C = leeCampo(sc);
    const rs = [lee(sc.sx, 'Das x(u, v) der Fläche', UV), lee(sc.sy, 'Das y(u, v) der Fläche', UV), lee(sc.sz, 'Das z(u, v) der Fläche', UV)];
    const u1 = num(sc.u1, 'das minimale u'), u2 = num(sc.u2, 'das maximale u'), v1 = num(sc.v1, 'das minimale v'), v2 = num(sc.v2, 'das maximale v');
    if (!(u2 > u1 && v2 > v1)) throw new Error('Die Intervalle von u und v müssen vom kleineren zum größeren Wert reichen');
    const ru = rs.map((n) => E.deriva(n, 'u')), rv = rs.map((n) => E.deriva(n, 'v')), N = cruz(ru, rv);
    const ev = (n, u, v) => E.valor(n, 0, { u, v }), r = (u, v) => rs.map((n) => ev(n, u, v)), Nv = (u, v) => N.map((n) => ev(n, u, v));
    const um = (u1 + u2) / 2, vm = (v1 + v2) / 2;
    if (!r(um, vm).every(isFinite) || !Nv(um, vm).every(isFinite)) throw new Error('Die Fläche ist in der Mitte der Intervalle nicht definiert');
    if (Math.hypot(...Nv(um + 0.013 * (u2 - u1), vm + 0.021 * (v2 - v1))) < 1e-12) throw new Error('r_u × r_v ergibt 0: Die Fläche ist entartet (hängt sie von u und von v ab?)');
    const Fs = [C.P, C.Q, C.R].map((n) => E.simp(sust(n, { x: rs[0], y: rs[1], z: rs[2] })));
    const dentro = E.simp(suma(Fs.map((n, i) => prod(n, N[i]))));
    const flujo = doble2((u, v) => punto3(C.Fv(r(u, v)), Nv(u, v)), u1, u2, v1, v2);
    const area = doble2((u, v) => Math.hypot(...Nv(u, v)), u1, u2, v1, v2);
    const rotFlujo = doble2((u, v) => { const p = r(u, v); return punto3(C.rot.map((n) => val(n, p)), Nv(u, v)); }, u1, u2, v1, v2);
    const dU = u2 - u1, dV = v2 - v1, Rd = (ds, u, v) => ds.map((n) => ev(n, u, v));
    const lados = [(s) => [u1 + s * dU, v1, ru, dU], (s) => [u2, v1 + s * dV, rv, dV], (s) => [u2 - s * dU, v2, ru, -dU], (s) => [u1, v2 - s * dV, rv, -dV]];
    const circula = lados.reduce((S, l) => S + integra((s) => { const [u, v, ds, k] = l(s), q = Rd(ds, u, v); return k * punto3(C.Fv(r(u, v)), q); }, 0, 1, 48), 0);
    if (![flujo, area, rotFlujo, circula].every(isFinite)) throw new Error('Das Feld oder die Fläche sind an einem Punkt nicht definiert (liegt eine Singularität vor?)');
    const tol = (a) => 1e-5 * Math.max(1, Math.abs(a)), cuadra = Math.abs(rotFlujo - circula) <= tol(circula);
    const S9 = [0, 0.13, 0.27, 0.4, 0.5, 0.61, 0.75, 0.88, 1], esc = Math.max(1e-9, ...S9.map((s) => Math.hypot(...r(u1 + s * dU, v1 + s * dV))));
    const igual = (g, h) => S9.every((s) => { const a = g(s), b = h(s); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 1e-9 * esc; });
    const punto = (g) => igual(g, () => g(0)), imgL = lados.map((l) => (s) => { const [u, v] = l(s); return r(u, v); });
    const cosido = [igual(imgL[0], (s) => imgL[2](1 - s)), igual(imgL[1], (s) => imgL[3](1 - s))];
    const vivos = [0, 1, 2, 3].filter((i) => !punto(imgL[i]) && !cosido[i % 2]), cerrada = !vivos.length;
    const pasos = [];
    pasos.push({ t: 'Die Fläche', html: `$r(u, v) = ${vecTxt(rs.map(T))}$ mit $u ∈ [${ex(u1)}, ${ex(u2)}]$ und $v ∈ [${ex(v1)}, ${ex(v2)}]$.` });
    pasos.push({ t: 'Normalenvektor', html: `$r_u = ${vecTxt(ru.map(T))}$, $r_v = ${vecTxt(rv.map(T))}$ und $r_u × r_v = ${vecTxt(N.map((n) => (nulo(n) ? '0' : T(n))))}$. Er steht senkrecht auf der Fläche, und sein Betrag ergibt das Flächenelement $dS = |r_u × r_v| du dv$: Die Fläche ist $${ex(area, 5)}$.` });
    pasos.push({ t: 'Fluss', html: `Auf der Fläche ist $F(r(u, v)) = ${vecTxt(Fs.map((n) => (nulo(n) ? '0' : T(n))))}$, und $Φ = ∬_S F · dS = ∬ F(r(u, v)) · (r_u × r_v) du dv = ∫_{${ex(u1)}}^{${ex(u2)}} ∫_{${ex(v1)}}^{${ex(v2)}} (${nulo(dentro) ? '0' : E.texto(dentro)}) dv du$ = <b>${em(flujo, 5)}</b>. ${Math.abs(flujo) < 1e-10 ? 'Es ergibt 0: Es tritt ebenso viel Feld ein wie aus.' : flujo > 0 ? 'Er ist positiv: Das Feld durchquert die Fläche in Richtung der Normalen.' : 'Er ist negativ: Das Feld durchquert sie entgegen der Normalen.'}` });
    pasos.push({ t: 'Satz von Stokes', html: `$∬_S (∇ × F) · dS = ∮_{∂S} F · dr$, mit $∇ × F = ${vecTxt(C.rot.map((n) => (nulo(n) ? '0' : T(n))))}$. Der Fluss der Rotation ergibt <b>${em(rotFlujo, 5)}</b> und die Zirkulation längs des Randes (so durchlaufen, dass die Fläche links liegt, wenn man von der Spitze der Normalen blickt) <b>${em(circula, 5)}</b>${cuadra ? ', dasselbe.' : ': Sie stimmen nicht überein, also hat das Feld auf der Fläche eine Singularität und Stokes ist nicht anwendbar.'}${cuadra && cerrada ? ' Die Fläche ist geschlossen (sie hat keinen Rand), also ergeben beide 0.' : ''}${C.cons && cuadra ? ' Da F konservativ ist, ist seine Rotation 0 und die Zirkulation längs jeder geschlossenen Kurve ebenfalls.' : ''}` });
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
      const x1 = num(sc.x1, 'minimales x'), x2 = num(sc.x2, 'maximales x'), y1 = num(sc.y1, 'minimales y'), y2 = num(sc.y2, 'maximales y'), z1 = num(sc.z1, 'minimales z'), z2 = num(sc.z2, 'maximales z');
      if (!(x2 > x1 && y2 > y1 && z2 > z1)) throw new Error('Der Quader muss in x, y und z von der kleineren zur größeren Koordinate reichen');
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
      solTxt = `der Quader $[${ex(x1)}, ${ex(x2)}] × [${ex(y1)}, ${ex(y2)}] × [${ex(z1)}, ${ex(z2)}]$ mit seinen sechs Seiten und der Normalen nach außen`;
      sol = { tipo, L };
    } else if (tipo === 'esfera') {
      const cx = numOp(sc.cx, 'der Mittelpunkt x', 0), cy = numOp(sc.cy, 'der Mittelpunkt y', 0), cz = numOp(sc.cz, 'der Mittelpunkt z', 0), R = num(sc.rad, 'der Radius');
      if (!(R > 0)) throw new Error('Der Radius muss größer als 0 sein');
      const e = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], pt = (th, ph, r = R) => { const q = e(th, ph); return [cx + r * q[0], cy + r * q[1], cz + r * q[2]]; };
      caras.push({ nom: 'die Kugel (Normale nach außen, $dS = R^2 sin θ dθ dφ$)', flujo: doble2((th, ph) => punto3(C.Fv(pt(th, ph)), e(th, ph)) * R * R * Math.sin(th), 0, Math.PI, 0, 2 * Math.PI, 16) });
      vol = integra((r) => r * r * integra((th) => Math.sin(th) * integra((ph) => { const p = pt(th, ph, r); return dvv(...p); }, 0, 2 * Math.PI, m), 0, Math.PI, m), 0, R, m);
      V = (4 / 3) * Math.PI * R ** 3;
      malla((th, ph) => pt(th, ph), 0, Math.PI, 0, 2 * Math.PI, 8);
      for (const th of [0.5, 1.2, 1.9, 2.6]) for (let k = 0; k < 6; k++) { const ph = (k * Math.PI) / 3 + th; flecha(pt(th, ph), e(th, ph)); }
      solTxt = `die Kugel mit Mittelpunkt (${f(cx)}, ${f(cy)}, ${f(cz)}) und Radius ${f(R)}, mit der Normalen nach außen`;
      sol = { tipo, c: [cx, cy, cz], R };
    } else {
      const cx = numOp(sc.cx, 'der Mittelpunkt x', 0), cy = numOp(sc.cy, 'der Mittelpunkt y', 0), R = num(sc.rad, 'der Radius'), z1 = num(sc.z1, 'minimales z'), z2 = num(sc.z2, 'maximales z');
      if (!(R > 0)) throw new Error('Der Radius muss größer als 0 sein');
      if (!(z2 > z1)) throw new Error('Das maximale z muss größer als das minimale sein');
      const pt = (r, ph, z) => [cx + r * Math.cos(ph), cy + r * Math.sin(ph), z];
      caras.push({ nom: 'die Mantelfläche (Normale $(cos φ, sin φ, 0)$, $dS = R dφ dz$)', flujo: doble2((ph, z) => { const F = C.Fv(pt(R, ph, z)); return (F[0] * Math.cos(ph) + F[1] * Math.sin(ph)) * R; }, 0, 2 * Math.PI, z1, z2, 16) });
      caras.push({ nom: `der obere Deckel, $z = ${ex(z2)}$ (Normale +z)`, flujo: doble2((r, ph) => C.Fv(pt(r, ph, z2))[2] * r, 0, R, 0, 2 * Math.PI, 12) });
      caras.push({ nom: `der untere Deckel, $z = ${ex(z1)}$ (Normale −z)`, flujo: -doble2((r, ph) => C.Fv(pt(r, ph, z1))[2] * r, 0, R, 0, 2 * Math.PI, 12) });
      vol = integra((r) => r * integra((ph) => integra((z) => dvv(...pt(r, ph, z)), z1, z2, m), 0, 2 * Math.PI, m), 0, R, m);
      V = Math.PI * R * R * (z2 - z1);
      malla((ph, z) => pt(R, ph, z), 0, 2 * Math.PI, z1, z2, 6);
      for (const z of [z1, z2]) { const a = []; for (let j = 0; j <= 48; j++) a.push(pt(R, (2 * Math.PI * j) / 48, z)); lineas.push(a); }
      for (let k = 0; k < 8; k++) { const ph = (k * Math.PI) / 4; flecha(pt(R, ph, (z1 + z2) / 2), [Math.cos(ph), Math.sin(ph), 0]); }
      flecha(pt(0, 0, z2), [0, 0, 1]); flecha(pt(0, 0, z1), [0, 0, -1]);
      solTxt = `der Zylinder mit senkrechter Achse durch (${f(cx)}, ${f(cy)}), Radius ${f(R)} und $${ex(z1)} ≤ z ≤ ${ex(z2)}$: die Mantelfläche und die beiden Deckel, mit der Normalen nach außen`;
      sol = { tipo, c: [cx, cy], R, z1, z2 };
    }
    const flujo = caras.reduce((s, q) => s + q.flujo, 0);
    if (![flujo, vol].every(isFinite)) throw new Error('Das Feld ist nicht im ganzen Körper definiert (liegt eine Singularität vor?)');
    const tol = (a) => 1e-5 * Math.max(1, Math.abs(a)), singular = Math.abs(flujo - vol) > tol(flujo), dvS = E.simp(C.dv);
    const pasos = [];
    pasos.push({ t: 'Das Feld und der Körper', html: `$F = ${vecTxt([C.P, C.Q, C.R].map(T))}$ in ${solTxt}.` });
    pasos.push({ t: 'Fluss durch den Rand', html: `$∯_S F · dS$ ist die Summe dessen, was durch jede Seite austritt: ${caras.map((q) => `${q.nom}: ${em(q.flujo, 5)}`).join('; ')}. Insgesamt <b>${em(flujo, 5)}</b>.` });
    pasos.push({ t: 'Divergenz', html: `$∇ · F = {∂P}/{∂x} + {∂Q}/{∂y} + {∂R}/{∂z} = ${nulo(C.dv) ? '0' : T(C.dv)}$` });
    pasos.push({ t: 'Divergenzsatz', html: `$∯_S F · dS = ∭_V ∇ · F dV$: Das Dreifachintegral ergibt <b>${em(vol, 5)}</b>${singular ? '. Es stimmt nicht überein: Das Feld ist an einem Punkt im Inneren nicht definiert (eine Singularität, wie eine Punktladung), und der Satz ist nicht unmittelbar anwendbar.' : ', dasselbe wie der Fluss.'}${dvS.t === 'n' && !singular ? ` Da die Divergenz konstant ist, ist es ${em(dvS.v)} mal das Volumen (${em(V)}).` : ''}` });
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
    { clave: 'paraboloide', nombre: 'Gradient von f = x² + y²', sc: { modo: 'escalar', f: 'x^2 + y^2', x0: '1', y0: '2', z0: '', u: '1, 1' } },
    { clave: 'temperatura', nombre: 'Temperatur T = 100 − x² − 2y²', sc: { modo: 'escalar', f: '100 - x^2 - 2y^2', x0: '2', y0: '1', z0: '', u: '-1, 0' } },
    { clave: 'xyz', nombre: 'f = x y z: Richtungsableitung in 3D', sc: { modo: 'escalar', f: 'x y z', x0: '1', y0: '2', z0: '3', u: '1, 2, 2' } },
    { clave: 'armonica', nombre: 'f = eˣ sin y (harmonisch)', sc: { modo: 'escalar', f: 'e^x sin y', x0: '0', y0: 'π/2', z0: '', u: '' } },
    { clave: 'fuente', nombre: 'F = (x, y): eine Quelle', sc: { modo: 'vectorial', P: 'x', Q: 'y', R: '', x0: '1', y0: '1', z0: '' } },
    { clave: 'remolino', nombre: 'F = (−y, x): ein Wirbel', sc: { modo: 'vectorial', P: '-y', Q: 'x', R: '', x0: '1', y0: '0', z0: '' } },
    { clave: 'conservativo', nombre: 'F = (yz, xz, xy): konservativ', sc: { modo: 'vectorial', P: 'y z', Q: 'x z', R: 'x y', x0: '1', y0: '2', z0: '3' } },
    { clave: 'cizalla', nombre: 'F = (y, 0): Scherung, hat Rotation, ohne zu kreisen', sc: { modo: 'vectorial', P: 'y', Q: '0', R: '', x0: '0', y0: '1', z0: '' } },
    { clave: 'carga', nombre: 'Feld einer Ladung in der Ebene', sc: { modo: 'vectorial', P: 'x/(x^2 + y^2)', Q: 'y/(x^2 + y^2)', R: '', x0: '1', y0: '1', z0: '' } },
    { clave: 'potencial-2d', nombre: 'Potential von (2xy, x² + 3y²)', sc: { modo: 'vectorial', P: '2x y', Q: 'x^2 + 3y^2', R: '', x0: '1', y0: '2', z0: '' } },
    { clave: 'potencial-3d', nombre: 'Potential von (y² + 2xz, 2xy + z, x² + y)', sc: { modo: 'vectorial', P: 'y^2 + 2x z', Q: '2x y + z', R: 'x^2 + y', x0: '1', y0: '1', z0: '2' } },
    { clave: 'circulo', nombre: 'Arbeit von (−y, x) bei einem Umlauf', sc: { modo: 'linea', P: '-y', Q: 'x', R: '', cx: 'cos t', cy: 'sin t', cz: '', a: '0', b: '2π' } },
    { clave: 'parabola', nombre: 'Arbeit von (y, x) längs y = x²', sc: { modo: 'linea', P: 'y', Q: 'x', R: '', cx: 't', cy: 't^2', cz: '', a: '0', b: '1' } },
    { clave: 'helice', nombre: 'Arbeit längs einer Schraubenlinie', sc: { modo: 'linea', P: '-y', Q: 'x', R: 'z', cx: 'cos t', cy: 'sin t', cz: 't', a: '0', b: '2π' } },
    { clave: 'segmento', nombre: 'Arbeit von (x², xy) längs einer Strecke', sc: { modo: 'linea', P: 'x^2', Q: 'x y', R: '', cx: 't', cy: '2t', cz: '', a: '0', b: '1' } },
    { clave: 'poligonal-triangulo', nombre: 'Arbeit von (−y, x) längs des Randes eines Dreiecks', sc: { modo: 'linea', P: '-y', Q: 'x', R: '', curva: 'poligonal', vertices: '0 0; 1 0; 0 1', cierra: 'si' } },
    { clave: 'poligonal-camino', nombre: 'Arbeit von (2xy, x²) längs zweier Strecken', sc: { modo: 'linea', P: '2x y', Q: 'x^2', R: '', curva: 'poligonal', vertices: '0 0; 1 0; 1 2', cierra: 'no' } },
    { clave: 'masa-semicirculo', nombre: 'Halbkreisförmiger Draht mit Dichte y', sc: { modo: 'masa', f: 'y', curva: 'param', cx: 'cos t', cy: 'sin t', cz: '', a: '0', b: 'π' } },
    { clave: 'cicloide', nombre: 'Länge eines Zykloidenbogens', sc: { modo: 'masa', f: '1', curva: 'param', cx: 't - sin t', cy: '1 - cos t', cz: '', a: '0', b: '2π' } },
    { clave: 'masa-helice', nombre: 'Masse einer Schraubenlinie mit Dichte z', sc: { modo: 'masa', f: 'z', curva: 'param', cx: 'cos t', cy: 'sin t', cz: 't', a: '0', b: '2π' } },
    { clave: 'masa-triangulo', nombre: '∫ x ds längs des Randes eines Dreiecks', sc: { modo: 'masa', f: 'x', curva: 'poligonal', vertices: '0 0; 1 0; 1 1', cierra: 'si' } },
    { clave: 'green-circulo', nombre: 'Green: (−y, x) auf dem Kreis', sc: { modo: 'green', P: '-y', Q: 'x', region: 'circulo', cx: '0', cy: '0', rad: '1' } },
    { clave: 'green-rect', nombre: 'Green: (xy, x²) in einem Rechteck', sc: { modo: 'green', P: 'x y', Q: 'x^2', region: 'rectangulo', x1: '0', x2: '2', y1: '0', y2: '1' } },
    { clave: 'green-agujero', nombre: 'Green versagt: (−y, x)/(x² + y²) mit dem Ursprung im Inneren', sc: { modo: 'green', P: '-y/(x^2 + y^2)', Q: 'x/(x^2 + y^2)', region: 'circulo', cx: '0', cy: '0', rad: '1' } },
    { clave: 'green-flujo', nombre: 'Fluss von (x, y) durch einen Kreis', sc: { modo: 'green', P: 'x', Q: 'y', region: 'circulo', cx: '0', cy: '0', rad: '2' } },
    { clave: 'green-triangulo', nombre: 'Green: (−y, x) in einem Dreieck', sc: { modo: 'green', P: '-y', Q: 'x', region: 'poligono', vertices: '0 0; 2 0; 0 1' } },
    { clave: 'green-poligono', nombre: 'Green: (xy, x²) in einem Fünfeck', sc: { modo: 'green', P: 'x y', Q: 'x^2', region: 'poligono', vertices: '0 0; 2 0; 2 2; 1 3; 0 2' } },
    { clave: 'green-curvas', nombre: 'Green: zwischen y = x² und y = x', sc: { modo: 'green', P: '-y', Q: 'x', region: 'curvas', g1: 'x^2', g2: 'x', a: '0', b: '1' } },
    { clave: 'green-semicirculo', nombre: 'Green: (y², 3xy) in einem Halbkreis', sc: { modo: 'green', P: 'y^2', Q: '3x y', region: 'curvas', g1: '0', g2: '√(1 - x^2)', a: '-1', b: '1' } },
    { clave: 'flujo-esfera', nombre: 'Fluss von (x, y, z) durch die Einheitskugel', sc: { modo: 'superficie', P: 'x', Q: 'y', R: 'z', sx: 'sin u cos v', sy: 'sin u sin v', sz: 'cos u', u1: '0', u2: 'π', v1: '0', v2: '2π' } },
    { clave: 'flujo-plano', nombre: 'Fluss von (0, 0, z) durch ein Quadrat bei z = 2', sc: { modo: 'superficie', P: '0', Q: '0', R: 'z', sx: 'u', sy: 'v', sz: '2', u1: '0', u2: '1', v1: '0', v2: '1' } },
    { clave: 'stokes-paraboloide', nombre: 'Stokes: (−y, x, z) auf einem Paraboloid', sc: { modo: 'superficie', P: '-y', Q: 'x', R: 'z', sx: 'u cos v', sy: 'u sin v', sz: '1 - u^2', u1: '0', u2: '1', v1: '0', v2: '2π' } },
    { clave: 'stokes-hemisferio', nombre: 'Stokes: (y, −x, 0) auf einer Halbkugel', sc: { modo: 'superficie', P: 'y', Q: '-x', R: '0', sx: 'sin u cos v', sy: 'sin u sin v', sz: 'cos u', u1: '0', u2: 'π/2', v1: '0', v2: '2π' } },
    { clave: 'gauss-caja', nombre: 'Gauß: (x, y, z) in einem Quader', sc: { modo: 'gauss', P: 'x', Q: 'y', R: 'z', solido: 'caja', x1: '0', x2: '1', y1: '0', y2: '2', z1: '0', z2: '3' } },
    { clave: 'gauss-esfera', nombre: 'Gauß: (x³, y³, z³) in der Einheitskugel', sc: { modo: 'gauss', P: 'x^3', Q: 'y^3', R: 'z^3', solido: 'esfera', cx: '0', cy: '0', cz: '0', rad: '1' } },
    { clave: 'gauss-cilindro', nombre: 'Gauß: (x, y, z²) in einem Zylinder', sc: { modo: 'gauss', P: 'x', Q: 'y', R: 'z^2', solido: 'cilindro', cx: '0', cy: '0', rad: '1', z1: '0', z2: '2' } },
    { clave: 'gauss-carga', nombre: 'Gauß versagt: Feld einer Ladung mit ihr im Inneren', sc: { modo: 'gauss', P: 'x/(x^2 + y^2 + z^2)^(3/2)', Q: 'y/(x^2 + y^2 + z^2)^(3/2)', R: 'z/(x^2 + y^2 + z^2)^(3/2)', solido: 'esfera', cx: '0', cy: '0', cz: '0', rad: '1' } },
  ];

  let curv = [];
  try { curv = Cv().ejemplos.map((e) => ({ clave: e.clave, nombre: e.nombre, sc: { modo: 'curvilineas', ...e.sc } })); } catch (e) { curv = []; }
  ejemplos.push(...curv);

  return { resolver, escalar, vectorial, linea, masa, green, superficie, gauss, potSimb, ejemplos, integra, f, ex, sust, primEn };
})();

