const SimCircuitos = (() => {
  const VT = 0.025852, GMIN = 1e-12, RON = 1e-6, ROFF = 1e12;
  const REF = new Set(['0', 'tierra', 'gnd', 'GND']);

  const amp = (o) => (o.eficaz ? o.A * Math.SQRT2 : o.A);
  const rad = (g) => (g || 0) * Math.PI / 180;
  function valor(o, t) {
    switch (o.tipo) {
      case 'seno': return (o.off || 0) + amp(o) * Math.sin(2 * Math.PI * o.f * t + rad(o.fase));
      case 'escalon': return t >= (o.t0 || 0) ? o.v2 : o.v1;
      case 'cuadrada': { const T = 1 / o.f, x = ((t / T) % 1 + 1) % 1; return (o.off || 0) + (x < (o.duty ?? 0.5) ? amp(o) : -amp(o)); }
      case 'triangular': { const T = 1 / o.f, x = ((t / T) % 1 + 1) % 1; return (o.off || 0) + amp(o) * (x < 0.5 ? 4 * x - 1 : 3 - 4 * x); }
      case 'diente': { const T = 1 / o.f, x = ((t / T) % 1 + 1) % 1; return (o.off || 0) + amp(o) * (2 * x - 1); }
      case 'pulso': {
        const { v1, v2, td = 0, tr = 0, tf = 0, pw, per } = o;
        if (t < td) return v1;
        const x = per ? (t - td) % per : t - td;
        if (x < tr) return v1 + (v2 - v1) * x / tr;
        if (x < tr + pw) return v2;
        if (x < tr + pw + tf) return v2 + (v1 - v2) * (x - tr - pw) / tf;
        return v1;
      }
      default: return o.v ?? 0; // cc
    }
  }
  const continua = (o) => (o.tipo === 'seno' || o.tipo === 'cuadrada' || o.tipo === 'triangular' || o.tipo === 'diente' ? (o.off || 0) : o.tipo === 'escalon' || o.tipo === 'pulso' ? o.v1 : (o.v ?? 0));
  function rupturas(o, tfin) {
    const r = [];
    if (o.tipo === 'escalon') r.push(o.t0 || 0);
    if (o.tipo === 'pulso') { const per = o.per || Infinity, tr = o.tr || 0, tf = o.tf || 0; for (let k = 0, t0 = o.td || 0; t0 <= tfin && k < 5000; k++, t0 = (o.td || 0) + k * per) { r.push(t0, t0 + tr, t0 + tr + o.pw, t0 + tr + o.pw + tf); if (!isFinite(per)) break; } }
    if (o.tipo === 'cuadrada') for (let k = 0; k / o.f <= tfin && k < 5000; k++) r.push(k / o.f, (k + (o.duty ?? 0.5)) / o.f);
    return r;
  }

  function resuelve(Are, Aim, bre, bim, n) {
    const re = Float64Array.from(Are), im = Float64Array.from(Aim), xr = Float64Array.from(bre), xi = Float64Array.from(bim);
    for (let c = 0; c < n; c++) {
      let m = c, mm = -1;
      for (let r = c; r < n; r++) { const q = re[r * n + c] ** 2 + im[r * n + c] ** 2; if (q > mm) { mm = q; m = r; } }
      if (mm < 1e-300) return null;
      if (m !== c) {
        for (let k = 0; k < n; k++) { let t = re[c * n + k]; re[c * n + k] = re[m * n + k]; re[m * n + k] = t; t = im[c * n + k]; im[c * n + k] = im[m * n + k]; im[m * n + k] = t; }
        let t = xr[c]; xr[c] = xr[m]; xr[m] = t; t = xi[c]; xi[c] = xi[m]; xi[m] = t;
      }
      const pr = re[c * n + c], pi = im[c * n + c], d = pr * pr + pi * pi;
      for (let r = c + 1; r < n; r++) {
        const ar = re[r * n + c], ai = im[r * n + c];
        if (ar === 0 && ai === 0) continue;
        const fr = (ar * pr + ai * pi) / d, fi = (ai * pr - ar * pi) / d;
        for (let k = c; k < n; k++) { const br = re[c * n + k], bi = im[c * n + k]; re[r * n + k] -= fr * br - fi * bi; im[r * n + k] -= fr * bi + fi * br; }
        xr[r] -= fr * xr[c] - fi * xi[c]; xi[r] -= fr * xi[c] + fi * xr[c];
      }
    }
    for (let r = n - 1; r >= 0; r--) {
      let sr = xr[r], si = xi[r];
      for (let k = r + 1; k < n; k++) { sr -= re[r * n + k] * xr[k] - im[r * n + k] * xi[k]; si -= re[r * n + k] * xi[k] + im[r * n + k] * xr[k]; }
      const pr = re[r * n + r], pi = im[r * n + r], d = pr * pr + pi * pi;
      xr[r] = (sr * pr + si * pi) / d; xi[r] = (si * pr - sr * pi) / d;
    }
    return { re: xr, im: xi };
  }

  const RAMA = new Set(['V', 'L', 'VV', 'VI', 'TR', 'AO', 'AM', 'AOR', 'COMP', 'GATE']);
  const NOLINEAL = new Set(['D', 'Z', 'LED', 'BJT', 'MOS']); // AOR y COMP lo son solo con saturación (ver esNL)
  const esNL = (e) => NOLINEAL.has(e.t) || (e.t === 'GATE' || ((e.t === 'AOR' || e.t === 'COMP') && isFinite(e.Vsat)));
  const TIPOS_OK = new Set(['R', 'C', 'L', 'K', 'V', 'I', 'VV', 'VI', 'IV', 'II', 'SW', 'TR', 'AO', 'D', 'Z', 'LED', 'BJT', 'MOS', 'AOR', 'COMP', 'AM', 'VM', 'GATE']);
  const NPINES = { R: 2, C: 2, L: 2, K: 0, V: 2, I: 2, VV: 4, VI: 2, IV: 4, II: 2, SW: 2, TR: 4, AO: 3, D: 2, Z: 2, LED: 2, BJT: 3, MOS: 3, AOR: 3, COMP: 3, AM: 2, VM: 2, GATE: 2 };
  function prepara(net) {
    const crudos = net.elementos || [];
    if (!crudos.length) throw new Error('Añade al menos un componente');
    const ids = new Set(), nombres = [];
    const esRef = (n) => REF.has(String(n));
    const idx = new Map();
    for (const e of crudos) {
      if (!TIPOS_OK.has(e.t)) throw new Error(`${e.id}: tipo de componente desconocido (${e.t})`);
      if (ids.has(e.id)) throw new Error(`${e.id}: hay dos componentes con el mismo nombre`);
      ids.add(e.id);
      if (e.t !== 'K' && (!Array.isArray(e.p) || e.p.length < NPINES[e.t] || e.p.some((n) => n === undefined || n === null || String(n) === ''))) throw new Error(`${e.id}: tiene patillas sin conectar`);
      for (const n of e.p || []) if (!esRef(n) && !idx.has(String(n))) { idx.set(String(n), nombres.length); nombres.push(String(n)); }
    }
    if (!crudos.some((e) => (e.p || []).some(esRef))) throw new Error('Falta la tierra: conecta un nudo a tierra (0)');
    const N = nombres.length;
    const nodo = (n) => (esRef(n) ? -1 : idx.get(String(n)));
    const els = crudos.map((e) => ({ ...e, q: (e.p || []).map(nodo), rama: -1 }));
    let M = N;
    for (const e of els) if (RAMA.has(e.t)) e.rama = M++;
    const porId = new Map(els.map((e) => [e.id, e]));
    for (const e of els) {
      if (e.t === 'R' && !(e.R > 0)) throw new Error(`${e.id}: la resistencia debe ser mayor que 0`);
      if (e.t === 'C' && !(e.C > 0)) throw new Error(`${e.id}: la capacidad debe ser mayor que 0`);
      if (e.t === 'L' && !(e.L > 0)) throw new Error(`${e.id}: la inductancia debe ser mayor que 0`);
      if (e.t === 'TR' && !(e.n > 0)) throw new Error(`${e.id}: la relación de transformación debe ser mayor que 0`);
      if (e.t === 'VI' || e.t === 'II') {
        const x = porId.get(e.ctrl);
        if (!x) throw new Error(`${e.id}: no hay ningún componente llamado ${e.ctrl}`);
        if (x === e) throw new Error(`${e.id}: no puede controlarla su propia corriente`);
        if (!['R', 'V', 'L', 'C', 'SW', 'VV', 'VI'].includes(x.t)) throw new Error(`${e.id}: no se puede controlar con la corriente de ${e.ctrl}`);
        e.x = x;
      }
      if (e.t === 'K') {
        const a = porId.get(e.l1), b = porId.get(e.l2);
        if (!a || !b || a.t !== 'L' || b.t !== 'L' || a === b) throw new Error(`${e.id}: debe acoplar dos bobinas distintas`);
        if (!(e.k > 0 && e.k <= 1)) throw new Error(`${e.id}: el coeficiente de acoplamiento debe estar entre 0 y 1`);
        e.a = a; e.b = b; e.M = e.k * Math.sqrt(a.L * b.L);
      }
    }
    const padre = Array.from({ length: N + 1 }, (_, i) => i), raiz = (i) => (padre[i] === i ? i : (padre[i] = raiz(padre[i])));
    for (const e of els) { const qs = e.q.map((q) => (q < 0 ? N : q)); for (let i = 1; i < qs.length; i++) padre[raiz(qs[i])] = raiz(qs[0]); }
    const sueltos = nombres.filter((_, i) => raiz(i) !== raiz(N));
    if (sueltos.length) throw new Error(`El circuito está partido: ${sueltos.join(', ')} no están unidos a tierra`);
    return { els, nombres, N, M, porId, nodo, idx };
  }

  const matriz = (M) => {
    const re = new Float64Array(M * M), im = new Float64Array(M * M), br = new Float64Array(M), bi = new Float64Array(M);
    return { re, im, br, bi, M, add(i, j, r, m = 0) { if (i < 0 || j < 0) return; re[i * M + j] += r; im[i * M + j] += m; }, rhs(i, r, m = 0) { if (i < 0) return; br[i] += r; bi[i] += m; } };
  };
  const adm = (A, a, b, gr, gi = 0) => { A.add(a, a, gr, gi); A.add(b, b, gr, gi); A.add(a, b, -gr, -gi); A.add(b, a, -gr, -gi); };
  function formaCorriente(x, modo, w, h) {
    const [a, b] = x.q;
    if (x.rama >= 0) return [[x.rama, 1, 0]];
    if (x.t === 'R') return [[a, 1 / x.R, 0], [b, -1 / x.R, 0]];
    if (x.t === 'SW') { const g = 1 / x.rsw; return [[a, g, 0], [b, -g, 0]]; }
    if (x.t === 'C') { if (modo === 'ac') return [[a, 0, w * x.C], [b, 0, -w * x.C]]; return []; }
    return [];
  }

  function modeloDiodo(e, v) {
    const Is = e.Is ?? (e.t === 'LED' ? 1e-18 : 1e-14), nn = e.n ?? (e.t === 'LED' ? 2 : 1), nvt = nn * VT;
    const ex = Math.exp(Math.min(v / nvt, 80));
    let i = Is * (ex - 1), g = Is * ex / nvt;
    if (e.t === 'Z' && e.Vz > 0) { const er = Math.exp(Math.min(-(v + e.Vz) / nvt, 80)); i -= Is * (er - 1); g += Is * er / nvt; }
    return { i, g: g + GMIN };
  }
  const vcrit = (e) => { const nvt = (e.n ?? (e.t === 'LED' ? 2 : 1)) * VT, Is = e.Is ?? (e.t === 'LED' ? 1e-18 : 1e-14); return nvt * Math.log(nvt / (Math.SQRT2 * Is)); };
  function limita(vn, vo, e) {
    const nvt = (e.n ?? (e.t === 'LED' ? 2 : 1)) * VT, vc = vcrit(e);
    if (vn > vc && Math.abs(vn - vo) > 2 * nvt) {
      if (vo > 0) { const arg = 1 + (vn - vo) / nvt; return arg > 0 ? vo + nvt * Math.log(arg) : vc; }
      return nvt * Math.log(vn / nvt);
    }
    return vn;
  }


  function modeloBJT(e, vbe, vbc) {
    const Is = e.Is ?? 1e-14, bf = e.bf ?? 100, br = e.br ?? 1, ef = Math.exp(Math.min(vbe / VT, 80)), er = Math.exp(Math.min(vbc / VT, 80));
    const IF = Is * (ef - 1), IR = Is * (er - 1), gF = Is * ef / VT + GMIN, gR = Is * er / VT + GMIN, s = e.pnp ? -1 : 1;
    const ic = IF - IR * (1 + 1 / br), ib = IF / bf + IR / br;
    const dic = [gF, -gR * (1 + 1 / br)], dib = [gF / bf, gR / br];
    return { I: [s * ic, s * ib, -s * (ic + ib)], Jj: [[s * dic[0], s * dic[1]], [s * dib[0], s * dib[1]], [-s * (dic[0] + dib[0]), -s * (dic[1] + dib[1])]] };
  }
  function modeloMOS(e, Vd, Vg, Vs) {
    const k = e.k ?? 2e-3, Vth = e.Vth ?? 2, lam = e.lambda ?? 0, s = e.pmos ? -1 : 1;
    const f = (vgs, vds) => { // vds >= 0
      const vov = vgs - Vth;
      if (vov <= 0) return { id: 0, gm: 0, gds: GMIN };
      if (vds < vov) return { id: k * (vov * vds - vds * vds / 2) * (1 + lam * vds), gm: k * vds * (1 + lam * vds), gds: k * (vov - vds) * (1 + lam * vds) + k * (vov * vds - vds * vds / 2) * lam + GMIN };
      return { id: k / 2 * vov * vov * (1 + lam * vds), gm: k * vov * (1 + lam * vds), gds: k / 2 * vov * vov * lam + GMIN };
    };
    const d = s * Vd, g = s * Vg, so = s * Vs;
    let Id, J; // J = [dId/dVd, dId/dVg, dId/dVs] en tensiones primadas
    if (d >= so) { const m = f(g - so, d - so); Id = m.id; J = [m.gds, m.gm, -m.gm - m.gds]; }
    else { const m = f(g - d, so - d); Id = -m.id; J = [m.gm + m.gds, -m.gm, -m.gds]; }
    return { I: [s * Id, 0, -s * Id], J: [[J[0], J[1], J[2]], [0, 0, 0], [-J[0], -J[1], -J[2]]] };
  }
  function modeloAO(e, vd) {
    const A0 = e.A ?? (e.t === 'COMP' ? 1e6 : 1e5);
    if (!isFinite(e.Vsat)) return { out: A0 * vd, g: A0 };
    const th = Math.tanh(A0 * vd / e.Vsat);
    return { out: e.Vsat * th, g: A0 * (1 - th * th) + 1e-9 };
  }

  function ensambla(P, ctx) {
    const { modo, w = 0, t = 0, h = 0, x = null, prev = null, euler = false, f = 0 } = ctx;
    const A = matriz(P.M), { N } = P;
    for (let i = 0; i < N; i++) A.add(i, i, GMIN);
    if (modo === 'dc') for (const i of fugas(P)) A.add(i, i, 1e-3);
    const v = (q) => (q < 0 || !x ? 0 : x.re[q]);
    for (const e of P.els) {
      const [a, b, c, d] = e.q, r = e.rama;
      switch (e.t) {
        case 'R': adm(A, a, b, 1 / e.R); break;
        case 'SW': adm(A, a, b, 1 / e.rsw); break;
        case 'C':
          if (modo === 'ac') adm(A, a, b, 0, w * e.C);
          else if (modo === 'tr') {
            const G = (euler ? 1 : 2) * e.C / h, vp = prev.V(a) - prev.V(b), ip = prev.Ic[e.id];
            adm(A, a, b, G); const Ieq = euler ? G * vp : G * vp + ip; A.rhs(a, Ieq); A.rhs(b, -Ieq);
          }
          break;
        case 'L': {
          A.add(a, r, 1); A.add(b, r, -1); A.add(r, a, 1); A.add(r, b, -1);
          if (modo === 'ac') A.add(r, r, 0, -w * e.L);
          else if (modo === 'tr') {
            const Z = (euler ? 1 : 2) * e.L / h; A.add(r, r, -Z);
            A.rhs(r, euler ? -Z * prev.x.re[r] : -Z * prev.x.re[r] - (prev.V(a) - prev.V(b)));
          }
          break;
        }
        case 'K': {
          const { a: la, b: lb, M } = e;
          if (modo === 'ac') { A.add(la.rama, lb.rama, 0, -w * M); A.add(lb.rama, la.rama, 0, -w * M); }
          else if (modo === 'tr') {
            const Z = (euler ? 1 : 2) * M / h;
            A.add(la.rama, lb.rama, -Z); A.add(lb.rama, la.rama, -Z);
            A.rhs(la.rama, -Z * prev.x.re[lb.rama]); A.rhs(lb.rama, -Z * prev.x.re[la.rama]);
          }
          break;
        }
        case 'V': {
          A.add(a, r, 1); A.add(b, r, -1); A.add(r, a, 1); A.add(r, b, -1);
          const fv = ctx.fuente(e); A.rhs(r, fv.re, fv.im); break;
        }
        case 'I': { const fv = ctx.fuente(e); A.rhs(a, -fv.re, -fv.im); A.rhs(b, fv.re, fv.im); break; }
        case 'VV': A.add(a, r, 1); A.add(b, r, -1); A.add(r, a, 1); A.add(r, b, -1); A.add(r, c, -e.k); A.add(r, d, e.k); break;
        case 'VI': {
          A.add(a, r, 1); A.add(b, r, -1); A.add(r, a, 1); A.add(r, b, -1);
          for (const [col, gr, gi] of formaCorriente(e.x, modo, w, h)) A.add(r, col, -e.r * gr, -e.r * gi);
          break;
        }
        case 'IV': A.add(a, c, e.g); A.add(a, d, -e.g); A.add(b, c, -e.g); A.add(b, d, e.g); break;
        case 'II': for (const [col, gr, gi] of formaCorriente(e.x, modo, w, h)) { A.add(a, col, e.beta * gr, e.beta * gi); A.add(b, col, -e.beta * gr, -e.beta * gi); } break;
        case 'TR': {
          A.add(a, r, 1); A.add(b, r, -1); A.add(c, r, -e.n); A.add(d, r, e.n);
          A.add(r, a, 1); A.add(r, b, -1); A.add(r, c, -e.n); A.add(r, d, e.n);
          break;
        }
        case 'AO': { const [pos, neg, sal] = e.q; A.add(sal, r, 1); A.add(r, pos, 1); A.add(r, neg, -1); break; }
        case 'D': case 'Z': case 'LED': {
          let g, Ieq;
          if (modo === 'ac') { const m = modeloDiodo(e, ctx.op.vd[e.id]); g = m.g; adm(A, a, b, g); break; }
          const vd = limita(v(a) - v(b), ctx.vd[e.id] ?? 0, e); ctx.vd[e.id] = vd;
          const m = modeloDiodo(e, vd); g = m.g; Ieq = m.i - g * vd;
          adm(A, a, b, g); A.rhs(a, -Ieq); A.rhs(b, Ieq);
          break;
        }
        case 'GATE': { // puerta lógica: salida = fuente de tensión que vale 0 o Vcc según las entradas (respecto a tierra)
          const ent = e.q.slice(0, -1), sal = e.q[e.q.length - 1], Vcc = e.Vcc ?? 5, th = e.Vth ?? Vcc / 2, bits = ent.map((q) => (v(q) > th ? 1 : 0)), n1 = bits.reduce((a, b) => a + b, 0);
          const y = { AND: n1 === bits.length, NAND: n1 !== bits.length, OR: n1 > 0, NOR: n1 === 0, XOR: n1 % 2 === 1, XNOR: n1 % 2 === 0, NOT: bits[0] === 0, BUF: bits[0] === 1 }[e.fn];
          A.add(sal, r, 1); A.add(r, sal, 1); A.rhs(r, y ? Vcc : 0); break;
        }
        case 'AM': A.add(a, r, 1); A.add(b, r, -1); A.add(r, a, 1); A.add(r, b, -1); break; // amperímetro: fuente de 0 V
        case 'VM': adm(A, a, b, 1e-9); break; // voltímetro: 1 GΩ
        case 'AOR': case 'COMP': {
          const [pos, neg, sal] = e.q, vd0 = ctx.modo === 'ac' ? ctx.op.vd[e.id] : (ctx.vd[e.id] = ctx.x ? (v(pos) - v(neg)) : 0);
          const m = modeloAO(e, ctx.modo === 'ac' ? vd0 : vd0);
          A.add(sal, r, 1); A.add(r, sal, 1); A.add(r, pos, -m.g); A.add(r, neg, m.g);
          if (ctx.modo !== 'ac') A.rhs(r, m.out - m.g * vd0);
          break;
        }
        case 'BJT': {
          const [c, b, em] = e.q, s = e.pnp ? -1 : 1;
          let vj;
          if (modo === 'ac') vj = ctx.op.vd[e.id];
          else { const o = ctx.vd[e.id] || [0, 0], fake = { n: 1, Is: e.Is ?? 1e-14 }; vj = [limita(s * (v(b) - v(em)), o[0], fake), limita(s * (v(b) - v(c)), o[1], fake)]; ctx.vd[e.id] = vj; }
          const m = modeloBJT(e, ...vj), q = [c, b, em];
          const S = [[0, s, -s], [-s, s, 0]]; // columnas C, B, E
          for (let i = 0; i < 3; i++) {
            let Ieq = m.I[i]; for (let k = 0; k < 2; k++) { Ieq -= m.Jj[i][k] * vj[k]; for (let j = 0; j < 3; j++) A.add(q[i], q[j], m.Jj[i][k] * S[k][j]); }
            if (modo !== 'ac') A.rhs(q[i], -Ieq);
          }
          break;
        }
        case 'MOS': {
          const [dd, gg, ss] = e.q, V = modo === 'ac' ? ctx.op.vd[e.id] : [v(dd), v(gg), v(ss)];
          if (modo !== 'ac') ctx.vd[e.id] = V;
          const m = modeloMOS(e, ...V), q = [dd, gg, ss];
          for (let i = 0; i < 3; i++) {
            let Ieq = m.I[i]; for (let j = 0; j < 3; j++) { A.add(q[i], q[j], m.J[i][j]); Ieq -= m.J[i][j] * V[j]; }
            if (modo !== 'ac') A.rhs(q[i], -Ieq);
          }
          break;
        }
        default: break;
      }
    }
    return A;
  }

  function fugas(P) {
    const { N } = P, padre = Array.from({ length: N + 1 }, (_, i) => i), raiz = (i) => (padre[i] === i ? i : (padre[i] = raiz(padre[i])));
    const une = (a, b) => { padre[raiz(a < 0 ? N : a)] = raiz(b < 0 ? N : b); };
    for (const e of P.els) {
      if (['R', 'L', 'V', 'VV', 'VI', 'D', 'Z', 'LED'].includes(e.t) || (e.t === 'SW' && e.rsw === RON)) une(e.q[0], e.q[1]);
      else if (e.t === 'TR') { une(e.q[0], e.q[1]); une(e.q[2], e.q[3]); } else if (e.t === 'AO') une(e.q[2], -1);
    }
    const vistos = new Set(), r = [];
    for (let i = 0; i < N; i++) { const g = raiz(i); if (g !== raiz(N) && !vistos.has(g)) { vistos.add(g); r.push(i); } }
    return r;
  }
  const rswEn = (e, t) => { const c0 = e.estado === 'cerrado', cambio = e.tc !== undefined && e.tc !== null && t >= e.tc; return (cambio ? !c0 : c0) ? RON : ROFF; };
  const ponSW = (P, t) => { for (const e of P.els) if (e.t === 'SW') e.rsw = rswEn(e, t); };

  function paso(P, ctx, maxIt = 150) {
    const hayNL = P.els.some(esNL);
    let x = ctx.x || { re: new Float64Array(P.M), im: new Float64Array(P.M) };
    for (let it = 0; it < (hayNL && ctx.modo !== 'ac' ? maxIt : 1); it++) {
      const A = ensambla(P, { ...ctx, x });
      const s = resuelve(A.re, A.im, A.br, A.bi, P.M);
      if (!s) throw new Error('El circuito no tiene solución única: revisa fuentes de tensión en paralelo, fuentes de corriente en serie o nudos sin camino de continua');
      if (!hayNL || ctx.modo === 'ac') return s;
      let dx = 0; for (let k = 0; k < P.M; k++) dx = Math.max(dx, Math.abs(s.re[k] - x.re[k]) - 1e-9 - 1e-6 * Math.abs(s.re[k]));
      if (it > 0 || ctx.x) for (let k = 0; k < P.N; k++) { const d = s.re[k] - x.re[k]; if (Math.abs(d) > 2) s.re[k] = x.re[k] + Math.sign(d) * 2; } // paso máximo de 2 V por iteración
      x = s;
      if (dx <= 0 && it > 0) return s;
    }
    throw new Error('El circuito no lineal no converge: prueba con otros valores o quita algún diodo');
  }

  const cx = (re, im = 0) => ({ re, im });
  function terminales(e, V, modo, ctx) {
    const q = e.q, T = q.map((n) => V(n));
    if (modo === 'ac') {
      const o = ctx.op.vd[e.id];
      let J;
      if (e.t === 'BJT') { const m = modeloBJT(e, ...o), s = e.pnp ? -1 : 1, S = [[0, s, -s], [-s, s, 0]]; J = m.Jj.map((fila) => [0, 1, 2].map((j) => fila[0] * S[0][j] + fila[1] * S[1][j])); } else J = modeloMOS(e, ...o).J;
      const I = [0, 1, 2].map((i) => cx(J[i].reduce((a, g, j) => a + g * T[j].re, 0), J[i].reduce((a, g, j) => a + g * T[j].im, 0)));
      return { I, P: cx(0) };
    }
    let I;
    if (e.t === 'BJT') { const s = e.pnp ? -1 : 1; I = modeloBJT(e, s * (T[1].re - T[2].re), s * (T[1].re - T[0].re)).I; } else I = modeloMOS(e, T[0].re, T[1].re, T[2].re).I;
    return { I: I.map((v) => cx(v)), P: cx(T.reduce((a, t, j) => a + t.re * I[j], 0)) };
  }
  function resultados(P, x, modo, w, h, prev, euler, ctx) {
    const V = (q) => (q < 0 ? cx(0) : cx(x.re[q], x.im[q]));
    const dif = (a, b) => cx(V(a).re - V(b).re, V(a).im - V(b).im);
    const tensiones = {}; P.nombres.forEach((n, i) => { tensiones[n] = V(i); });
    const I = {}, U = {}, Pot = {}, Iter = {};
    for (const e of P.els) {
      if (e.t === 'K') continue;
      const [a, b] = e.q, u = e.t === 'TR' ? dif(a, b) : e.t === 'AO' ? dif(e.q[2], -1) : dif(a, b);
      let i = cx(0);
      if (e.rama >= 0) i = cx(x.re[e.rama], x.im[e.rama]);
      else if (e.t === 'R') i = cx(u.re / e.R, u.im / e.R);
      else if (e.t === 'SW') i = cx(u.re / e.rsw, u.im / e.rsw);
      else if (e.t === 'C') { if (modo === 'ac') i = cx(-w * e.C * u.im, w * e.C * u.re); else if (modo === 'tr') { const G = (euler ? 1 : 2) * e.C / h, vp = prev.V(a) - prev.V(b); i = cx(euler ? G * (u.re - vp) : G * (u.re - vp) - prev.Ic[e.id]); } }
      else if (e.t === 'I') { const f = ctx.fuente(e); i = cx(f.re, f.im); }
      else if (e.t === 'IV') i = cx(e.g * (V(e.q[2]).re - V(e.q[3]).re), e.g * (V(e.q[2]).im - V(e.q[3]).im));
      else if (e.t === 'II') { const f = formaCorriente(e.x, modo, w, h); let sr = 0, si = 0; for (const [c, gr, gi] of f) { const xr = x.re[c] ?? 0, xi = x.im[c] ?? 0; sr += gr * xr - gi * xi; si += gr * xi + gi * xr; } i = cx(e.beta * sr, e.beta * si); }
      else if (e.t === 'VM') i = cx(u.re * 1e-9, u.im * 1e-9);
      else if (e.t === 'BJT' || e.t === 'MOS') { const r3 = terminales(e, V, modo, ctx); i = r3.I[0]; Pot[e.id] = r3.P; I[e.id] = i; U[e.id] = e.t === 'BJT' ? dif(e.q[0], e.q[2]) : dif(e.q[0], e.q[2]); Iter[e.id] = r3.I; continue; }
      else if (e.t === 'AOR' || e.t === 'COMP') { i = cx(x.re[e.rama], x.im[e.rama]); I[e.id] = i; U[e.id] = V(e.q[2]); Pot[e.id] = modo === 'ac' ? cx(0) : cx(0); continue; }
      else if (NOLINEAL.has(e.t)) { if (modo === 'ac') i = cx(u.re * modeloDiodo(e, ctx.op.vd[e.id]).g, u.im * modeloDiodo(e, ctx.op.vd[e.id]).g); else i = cx(modeloDiodo(e, u.re).i); }
      I[e.id] = i; U[e.id] = u;
      Pot[e.id] = modo === 'ac' ? cx((u.re * i.re + u.im * i.im) / 2, (u.im * i.re - u.re * i.im) / 2) : cx(u.re * i.re);
    }
    return { V: tensiones, I, U, P: Pot, Iter };
  }

  const fuenteCC = (e) => cx(continua(e.onda));

  function operacion(net) {
    const P = prepara(net);
    ponSW(P, -Infinity); // antes del cambio
    const ctx = { modo: 'dc', fuente: fuenteCC, vd: {} };
    const x = paso(P, ctx);
    const r = resultados(P, x, 'dc', 0, 0, null, false, ctx);
    r.vd = ctx.vd; r.P_ = P; r.x = x;
    r.balance = Object.values(r.P).reduce((s, p) => s + p.re, 0);
    return r;
  }

  function fasores(net, op) {
    const P = op?.P_ || prepara(net);
    ponSW(P, -Infinity);
    if (!op && P.els.some(esNL)) op = operacion(net); // solo hace falta el punto de operación si hay no lineales
    const fr = [...new Set(P.els.filter((e) => (e.t === 'V' || e.t === 'I') && e.onda.tipo === 'seno').map((e) => e.onda.f))].sort((a, b) => a - b);
    return fr.map((f) => {
      const w = 2 * Math.PI * f;
      const fuente = (e) => (e.onda.tipo === 'seno' && e.onda.f === f ? cx(amp(e.onda) * Math.cos(rad(e.onda.fase)), amp(e.onda) * Math.sin(rad(e.onda.fase))) : cx(0));
      const ctx = { modo: 'ac', w, fuente, op };
      const x = paso(P, ctx);
      return { f, w, ...resultados(P, x, 'ac', w, 0, null, false, ctx) };
    });
  }

  function barrido(net, { fuente, a, b = '0', fmin = 1, fmax = 1e6, puntos = 200, adaptativo = false, maximo = 3000 }) {
    const P = prepara(net); ponSW(P, -Infinity);
    if (!P.els.find((e) => e.id === fuente && (e.t === 'V' || e.t === 'I'))) throw new Error(`No hay ninguna fuente llamada ${fuente}`);
    const ia = P.nodo(a), ib = P.nodo(b);
    if (ia === undefined || ib === undefined) throw new Error('El nudo de salida no existe');
    const op = P.els.some(esNL) ? operacion(net) : null, out = { f: [], mod: [], dB: [], fase: [] };
    const punto = (f) => {
      const w = 2 * Math.PI * f, x = paso(P, { modo: 'ac', w, op, fuente: (e) => (e.id === fuente ? cx(1) : cx(0)) });
      const re = (ia < 0 ? 0 : x.re[ia]) - (ib < 0 ? 0 : x.re[ib]), im = (ia < 0 ? 0 : x.im[ia]) - (ib < 0 ? 0 : x.im[ib]), m = Math.hypot(re, im);
      return { f, mod: m, dB: 20 * Math.log10(Math.max(m, 1e-300)), fase: Math.atan2(im, re) * 180 / Math.PI };
    };
    let pts = [];
    for (let k = 0; k < puntos; k++) pts.push(punto(fmin * Math.pow(fmax / fmin, k / (puntos - 1))));
    if (adaptativo) {
      const dif = (p, q) => { const d = Math.abs(p.fase - q.fase); return Math.max(Math.abs(p.dB - q.dB) / 0.5, Math.min(d, 360 - d) / 3); };
      for (let vuelta = 0; vuelta < 14 && pts.length < maximo; vuelta++) {
        const nuevo = [];
        for (let k = 1; k < pts.length && pts.length + nuevo.length < maximo; k++) if (dif(pts[k - 1], pts[k]) > 1 && pts[k].f / pts[k - 1].f > 1 + 1e-9) nuevo.push(punto(Math.sqrt(pts[k - 1].f * pts[k].f)));
        if (!nuevo.length) break;
        pts = pts.concat(nuevo).sort((p, q) => p.f - q.f);
      }
    }
    for (const q of pts) { out.f.push(q.f); out.mod.push(q.mod); out.dB.push(q.dB); out.fase.push(q.fase); }
    return out;
  }

  function trifasica(id, [r, s, t, n], Vf, f, fase0 = 0) {
    return [[r, 0], [s, -120], [t, 120]].map(([q, d], i) => ({ id: `${id}${'RST'[i]}`, t: 'V', p: [q, n], onda: { tipo: 'seno', A: Vf, eficaz: true, f, fase: fase0 + d } }));
  }

  function transitorio(net, { tfin, h, puntos = 2000, uic = false } = {}) {
    if (!(tfin > 0)) throw new Error('El tiempo final debe ser mayor que 0');
    const P = prepara(net);
    const frecs = P.els.filter((e) => (e.t === 'V' || e.t === 'I') && e.onda.f).map((e) => e.onda.f);
    let hmax = h || tfin / puntos;
    if (frecs.length) hmax = Math.min(hmax, 1 / (Math.max(...frecs) * 60));
    const rup = [];
    for (const e of P.els) { if ((e.t === 'V' || e.t === 'I')) rup.push(...rupturas(e.onda, tfin)); if (e.t === 'SW' && e.tc !== undefined && e.tc !== null) rup.push(+e.tc); }
    const cortes = [...new Set(rup.filter((t) => t > 0 && t < tfin).map((t) => +t.toFixed(15)))].sort((a, b) => a - b);
    ponSW(P, -1e-30);
    const ctx0 = { modo: 'dc', fuente: fuenteCC, vd: {} };
    const ceros = () => ({ re: new Float64Array(P.M), im: new Float64Array(P.M) });
    let x;
    if (uic) x = ceros(); else { try { x = paso(P, ctx0); } catch (e) { x = ceros(); } } // si la continua no está determinada (L en paralelo con una fuente), se parte de cero
    const vd = ctx0.vd;
    const out = { t: [0], V: {}, I: {}, U: {}, P: {} };
    const guarda = (t, r) => {
      if (t > 0) out.t.push(t);
      for (const n of P.nombres) (out.V[n] ||= []).push(r.V[n].re);
      for (const id of Object.keys(r.I)) { (out.I[id] ||= []).push(r.I[id].re); (out.U[id] ||= []).push(r.U[id].re); (out.P[id] ||= []).push(r.P[id].re); }
    };
    const mk = (xx, Ic) => ({ x: xx, V: (q) => (q < 0 ? 0 : xx.re[q]), Ic });
    let prev = mk(x, {});
    const r0 = resultados(P, x, 'dc', 0, 0, null, false, ctx0);
    for (const e of P.els) if (e.t === 'C') prev.Ic[e.id] = 0;
    guarda(0, r0);
    let t = 0, k = 0, euler = true, nPasos = 0;
    while (t < tfin - 1e-15 * tfin && nPasos < 400000) {
      let t1 = Math.min(t + hmax, tfin);
      while (k < cortes.length && cortes[k] <= t + 1e-15) k++;
      let corte = false;
      if (k < cortes.length && cortes[k] < t1 + 1e-15) { t1 = cortes[k]; corte = true; }
      const hh = t1 - t;
      if (hh <= 0) { t = t1; continue; }
      ponSW(P, t1);
      const ctx = { modo: 'tr', h: hh, t: t1, prev, euler, x, vd, fuente: (e) => cx(valor(e.onda, t1)) };
      x = paso(P, ctx);
      const r = resultados(P, x, 'tr', 0, hh, prev, euler, ctx);
      for (const e of P.els) if (e.t === 'C') prev.Ic[e.id] = r.I[e.id].re;
      prev = mk(x, prev.Ic);
      guarda(t1, r);
      t = t1; nPasos++;
      euler = corte; // el paso siguiente a una ruptura se hace con Euler
    }
    out.nudos = P.nombres;
    return out;
  }

  const mod = (z) => Math.hypot(z.re, z.im), arg = (z) => Math.atan2(z.im, z.re);
  function estadistica(t, y) {
    let s = 0, s2 = 0; const T = t[t.length - 1] - t[0];
    for (let i = 1; i < t.length; i++) { const dt = t[i] - t[i - 1]; s += (y[i] + y[i - 1]) / 2 * dt; s2 += (y[i] * y[i] + y[i - 1] * y[i - 1]) / 2 * dt; }
    return { media: s / T, rms: Math.sqrt(s2 / T) };
  }

  return { operacion, fasores, barrido, trifasica, transitorio, valor, continua, estadistica, mod, arg, prepara };
})();

