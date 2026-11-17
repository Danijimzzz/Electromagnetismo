const Magneto = (() => {
  const { V3, identify, parseExpr, gl } = Engine;
  const PI = Math.PI, MU0 = 4e-7 * PI, MINUS = '−';
  const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const PLANOS = {
    xy: { e1: [1, 0, 0], e2: [0, 1, 0], n: [0, 0, 1], normal: '+z', desde: '+x' },
    yz: { e1: [0, 1, 0], e2: [0, 0, 1], n: [1, 0, 0], normal: '+x', desde: '+y' },
    xz: { e1: [1, 0, 0], e2: [0, 0, -1], n: [0, 1, 0], normal: '+y', desde: '+x' },
  };
  const PLANO_DE_EJE = { z: 'xy', x: 'yz', y: 'xz' };

  function arcoNum(P, c, pl, R, t1, t2, fino = true) {
    const B = [0, 0, 0];
    const add = (t, w) => {
      const ct = Math.cos(t), st = Math.sin(t);
      const r = V3.add(c, V3.add(V3.sc(pl.e1, R * ct), V3.sc(pl.e2, R * st)));
      const dl = V3.add(V3.sc(pl.e1, -R * st), V3.sc(pl.e2, R * ct));
      const d = V3.sub(P, r), n = V3.norm(d);
      const k = w / (4 * PI * n * n * n), x = V3.cross(dl, d);
      B[0] += k * x[0]; B[1] += k * x[1]; B[2] += k * x[2];
    };
    if (Math.abs(Math.abs(t2 - t1) - 2 * PI) < 1e-12) {
      const N = fino ? 768 : 64, h = (t2 - t1) / N;
      for (let i = 0; i < N; i++) add(t1 + i * h, h);
    } else {
      const g = gl(fino ? 32 : 8), pan = fino ? 12 : 3, h = (t2 - t1) / pan;
      for (let p = 0; p < pan; p++) for (let i = 0; i < g.x.length; i++) add(t1 + h * (p + (g.x[i] + 1) / 2), (g.w[i] * h) / 2);
    }
    return B;
  }
  function rectaNum(P, A, u, Bp, tipo) {
    const uh = V3.unit(u), AP = V3.sub(P, A);
    const rho = V3.sub(AP, V3.sc(uh, V3.dot(AP, uh))), d = V3.norm(rho);
    let c1, c2;
    if (tipo === 'hilo') { c1 = 1; c2 = -1; }
    else {
      const nA = V3.norm(AP);
      c1 = nA < 1e-13 ? 1 : V3.dot(AP, uh) / nA;
      if (tipo === 'semi') c2 = -1;
      else { const BP = V3.sub(P, Bp), nB = V3.norm(BP); c2 = nB < 1e-13 ? -1 : V3.dot(BP, uh) / nB; }
    }
    if (d < 1e-10) return { B: [0, 0, 0], d, c1, c2, sobre: c1 - c2 > 1e-9 };
    const dir = V3.cross(uh, V3.sc(rho, 1 / d));
    return { B: V3.sc(dir, (c1 - c2) / (4 * PI * d)), d, c1, c2, dir, rho };
  }
  const ang = (t) => (t * PI) / 180;

  const SOURCES = {
    hilo: {
      label: 'Infinite wire', icon: '|',
      campos: [['A', 'Point of the wire', 'vec'], ['u', 'Direction of the current', 'vec']],
      def: () => ({ A: ['0', '0', '0'], u: ['0', '0', '1'] }),
      campo(f, P) {
        const r = rectaNum(P, f.A, f.u, null, 'hilo');
        if (r.d < 1e-10) return { error: 'the point is on the wire' };
        return { B: r.B, info: { d: r.d, dir: r.dir } };
      },
      formula: () => 'B = <span class="fr"><span class="nu">μ<sub>0</sub><i>I</i></span><span class="de">2π<i>d</i></span></span>, direction <span class="uv">u</span> × <span class="uv">ρ</span>/<i>d</i>',
    },
    segmento: {
      label: 'Segment', icon: '⟋',
      campos: [['A', 'From (A)', 'vec'], ['B', 'To (B)', 'vec']],
      def: () => ({ A: ['-1', '0', '0'], B: ['1', '0', '0'] }),
      campo(f, P) {
        const u = V3.sub(f.B, f.A);
        if (V3.norm(u) < 1e-12) return { error: 'A y B coinciden' };
        const r = rectaNum(P, f.A, u, f.B, 'segmento');
        if (r.sobre) return { error: 'the point is on the segment' };
        return { B: r.B, info: { d: r.d, c1: r.c1, c2: r.c2, dir: r.dir } };
      },
      formula: () => 'B = <span class="fr"><span class="nu">μ<sub>0</sub><i>I</i></span><span class="de">4π<i>d</i></span></span>(cos α<sub>1</sub> − cos α<sub>2</sub>)',
    },
    semi: {
      label: 'Semi-infinite wire', icon: '↦',
      campos: [['A', 'End (A)', 'vec'], ['u', 'Direction of the wire from A', 'vec'], ['sentido', 'Current', 'salida']],
      def: () => ({ A: ['0', '0', '0'], u: ['1', '0', '0'], sentido: 1 }),
      campo(f, P) {
        const r = rectaNum(P, f.A, f.u, null, 'semi');
        if (r.sobre) return { error: 'the point is on the wire' };
        return { B: V3.sc(r.B, f.sentido), info: { d: r.d, c1: r.c1, c2: -1, dir: r.dir && V3.sc(r.dir, f.sentido) } };
      },
      formula: () => 'B = <span class="fr"><span class="nu">μ<sub>0</sub><i>I</i></span><span class="de">4π<i>d</i></span></span>(cos α<sub>1</sub> + 1)',
    },
    espira: {
      label: 'Circular loop', icon: '○',
      campos: [['C', 'Centre', 'vec'], ['plano', 'Parallel plate', 'plano'], ['R', 'Radius', 'num'], ['sentido', 'Direction', 'sentido']],
      def: () => ({ C: ['0', '0', '0'], plano: 'xy', R: '1', sentido: 1 }),
      campo(f, P, fino) {
        const pl = PLANOS[f.plano], CP = V3.sub(P, f.C), z = V3.dot(CP, pl.n);
        const rho = V3.norm(V3.sub(CP, V3.sc(pl.n, z)));
        if (rho < 1e-12 * f.R) {
          const b = (f.R * f.R) / (2 * Math.pow(f.R * f.R + z * z, 1.5));
          return { B: V3.sc(pl.n, b * f.sentido), info: { eje: true, z } };
        }
        if (Math.abs(z) < 1e-12 && Math.abs(rho - f.R) < 1e-9) return { error: 'the point is on the loop' };
        return { B: V3.sc(arcoNum(P, f.C, pl, f.R, 0, 2 * PI, fino), f.sentido), info: { eje: false } };
      },
      formula: (i) => (i.eje ? 'On the axis: B = <span class="fr"><span class="nu">μ<sub>0</sub><i>I R</i><sup>2</sup></span><span class="de">2(<i>R</i><sup>2</sup> + <i>z</i><sup>2</sup>)<sup>3/2</sup></span></span>' : 'Off the axis: Biot-Savart integral d<span class="uv">B</span> = <span class="fr"><span class="nu">μ<sub>0</sub><i>I</i></span><span class="de">4π</span></span><span class="fr"><span class="nu">d<span class="uv">l</span> × <span class="uv">r</span></span><span class="de"><i>r</i><sup>3</sup></span></span>, solved numerically'),
    },
    arco: {
      label: 'Arc', icon: '◠',
      campos: [['C', 'Centre', 'vec'], ['plano', 'Parallel plate', 'plano'], ['R', 'Radius', 'num'], ['t1', 'From (degrees)', 'num'], ['t2', 'To (degrees)', 'num']],
      def: () => ({ C: ['0', '0', '0'], plano: 'xy', R: '1', t1: '0', t2: '180' }),
      campo(f, P, fino) {
        const pl = PLANOS[f.plano], t1 = ang(f.t1), t2 = ang(f.t2), CP = V3.sub(P, f.C);
        if (Math.abs(t2 - t1) < 1e-12) return { error: 'the arc has no length' };
        if (V3.norm(CP) < 1e-12) {
          return { B: V3.sc(pl.n, (t2 - t1) / (4 * PI * f.R)), info: { centro: true, th: t2 - t1 } };
        }
        return { B: arcoNum(P, f.C, pl, f.R, t1, t2, fino), info: { centro: false } };
      },
      formula: (i) => (i.centro ? 'At the centre: B = <span class="fr"><span class="nu">μ<sub>0</sub><i>I</i> θ</span><span class="de">4π<i>R</i></span></span>' : 'Biot-Savart integral along the arc, solved numerically'),
    },
    solenoide: {
      label: 'Solenoid', icon: '≋',
      campos: [['C', 'Centre', 'vec'], ['eje', 'Axis', 'eje'], ['R', 'Radius', 'num'], ['L', 'Length', 'num'], ['N', 'Number of turns N', 'num'], ['sentido', 'Direction', 'sentido'], ['ideal', 'Ideal (very long)', 'bool']],
      def: () => ({ C: ['0', '0', '0'], eje: 'z', R: '1', L: '4', N: '100', sentido: 1, ideal: false }),
      campo(f, P, fino) {
        const n = EJES[f.eje], CP = V3.sub(P, f.C), z = V3.dot(CP, n);
        const rho = V3.norm(V3.sub(CP, V3.sc(n, z))), dens = f.N / f.L;
        if (f.ideal) {
          const dentro = rho < f.R - 1e-12 && Math.abs(z) < f.L / 2;
          return { B: dentro ? V3.sc(n, dens * f.sentido) : [0, 0, 0], info: { ideal: true, dentro } };
        }
        if (rho < 1e-12 * f.R) {
          const z1 = z + f.L / 2, z2 = z - f.L / 2;
          const c1 = z1 / Math.hypot(z1, f.R), c2 = z2 / Math.hypot(z2, f.R);
          return { B: V3.sc(n, (dens / 2) * (c1 - c2) * f.sentido), info: { eje: true, c1, c2 } };
        }
        if (Math.abs(rho - f.R) < 1e-9 && Math.abs(z) <= f.L / 2) return { error: 'the point is on the winding' };
        const pl = PLANOS[PLANO_DE_EJE[f.eje]], g = gl(fino ? 24 : 6), pan = fino ? 16 : 4, h = f.L / pan, B = [0, 0, 0];
        for (let p = 0; p < pan; p++) for (let i = 0; i < g.x.length; i++) {
          const zz = -f.L / 2 + h * (p + (g.x[i] + 1) / 2);
          const b = arcoNum(P, V3.add(f.C, V3.sc(n, zz)), pl, f.R, 0, 2 * PI, false);
          const w = (g.w[i] * h) / 2 * dens * f.sentido;
          B[0] += w * b[0]; B[1] += w * b[1]; B[2] += w * b[2];
        }
        return { B, info: { eje: false } };
      },
      formula: (i) => (i.ideal ? (i.dentro ? 'Inside an ideal solenoid: B = μ<sub>0</sub> <i>n I</i> = <span class="fr"><span class="nu">μ<sub>0</sub><i>N I</i></span><span class="de"><i>L</i></span></span>' : 'Outside an ideal solenoid: B = 0')
        : i.eje ? 'On the axis: B = <span class="fr"><span class="nu">μ<sub>0</sub><i>N I</i></span><span class="de">2<i>L</i></span></span>(cos β<sub>1</sub> − cos β<sub>2</sub>)' : 'Off the axis: sum of loops solved numerically'),
    },
    toroide: {
      label: 'Toroid', icon: '◎',
      campos: [['C', 'Centre', 'vec'], ['plano', 'Parallel plate', 'plano'], ['R1', 'Inner radius', 'num'], ['R2', 'Outer radius', 'num'], ['N', 'Number of turns N', 'num'], ['sentido', 'Direction of B', 'sentido']],
      def: () => ({ C: ['0', '0', '0'], plano: 'xy', R1: '2', R2: '3', N: '500', sentido: 1 }),
      campo(f, P) {
        if (!(f.R2 > f.R1 && f.R1 >= 0)) return { error: 'the outer radius must be greater than the inner one' };
        const pl = PLANOS[f.plano], CP = V3.sub(P, f.C), hgt = V3.dot(CP, pl.n);
        const rv = V3.sub(CP, V3.sc(pl.n, hgt)), r = V3.norm(rv);
        const Rm = (f.R1 + f.R2) / 2, rm = (f.R2 - f.R1) / 2;
        const dentro = r > 1e-12 && (r - Rm) ** 2 + hgt * hgt < rm * rm - 1e-12;
        if (!dentro) return { B: [0, 0, 0], info: { dentro: false } };
        const phi = V3.cross(pl.n, V3.sc(rv, 1 / r));
        return { B: V3.sc(phi, (f.N / (2 * PI * r)) * f.sentido), info: { dentro: true, r } };
      },
      formula: (i) => (i.dentro ? 'Inside the toroid (Ampère): B = <span class="fr"><span class="nu">μ<sub>0</sub><i>N I</i></span><span class="de">2π<i>r</i></span></span>' : 'Outside the toroid core: B = 0'),
    },
    rectangular: {
      label: 'Rectangular loop', icon: '▭',
      campos: [['C', 'Centre', 'vec'], ['plano', 'Parallel plate', 'plano'], ['a', 'Side a (along the first axis)', 'num'], ['b', 'Side b (along the second axis)', 'num'], ['sentido', 'Direction', 'sentido']],
      def: () => ({ C: ['0', '0', '0'], plano: 'xy', a: '2', b: '2', sentido: 1 }),
      campo(f, P) {
        const pl = PLANOS[f.plano], v = esquinas(f), B = [0, 0, 0];
        for (let k = 0; k < 4; k++) {
          const A = v[k], Bp = v[(k + 1) % 4], r = rectaNum(P, A, V3.sub(Bp, A), Bp, 'segmento');
          if (r.sobre) return { error: 'the point is on the loop' };
          B[0] += r.B[0]; B[1] += r.B[1]; B[2] += r.B[2];
        }
        const CP = V3.sub(P, f.C), z = V3.dot(CP, pl.n), centro = V3.norm(V3.sub(CP, V3.sc(pl.n, z))) < 1e-12;
        return { B, info: { rect: true, centro: centro && Math.abs(z) < 1e-12, eje: centro, z } };
      },
      formula: (i) => (i.centro ? 'At the centre, adding the four sides: B = <span class="fr"><span class="nu">2μ<sub>0</sub><i>I</i>√(<i>a</i><sup>2</sup> + <i>b</i><sup>2</sup>)</span><span class="de">π<i>a b</i></span></span>' : 'Sum of the four sides, each with B = <span class="fr"><span class="nu">μ<sub>0</sub><i>I</i></span><span class="de">4π<i>d</i></span></span>(cos α<sub>1</sub> − cos α<sub>2</sub>)'),
    },
    cilindro: {
      label: 'Current-carrying cylinder', icon: '◉',
      campos: [['C', 'Point on the axis', 'vec'], ['u', 'Direction of the current', 'vec'], ['R1', 'Inner radius (0 if solid)', 'num'], ['R2', 'Outer radius', 'num'], ['perfil', 'Current density', 'perfil']],
      def: () => ({ C: ['0', '0', '0'], u: ['0', '0', '1'], R1: '0', R2: '1', perfil: 'uniforme' }),
      campo(f, P) {
        if (!(f.R2 > f.R1 && f.R1 >= 0)) return { error: 'the outer radius must be greater than the inner one' };
        const uh = V3.unit(f.u), CP = V3.sub(P, f.C), rho = V3.sub(CP, V3.sc(uh, V3.dot(CP, uh))), r = V3.norm(rho);
        if (r < 1e-12) return { B: [0, 0, 0], info: { cil: true, r: 0, fr: 0, zona: f.R1 > 0 ? 'hueco' : 'dentro', perfil: f.perfil } };
        const p = f.perfil === 'lineal' ? 3 : 2, fr = r <= f.R1 ? 0 : r >= f.R2 ? 1 : (r ** p - f.R1 ** p) / (f.R2 ** p - f.R1 ** p);
        return { B: V3.sc(V3.cross(uh, V3.sc(rho, 1 / r)), fr / (2 * PI * r)), info: { cil: true, r, fr, zona: r <= f.R1 ? 'hueco' : r >= f.R2 ? 'fuera' : 'dentro', perfil: f.perfil, hueco: f.R1 > 0 } };
      },
      formula: (i) => (i.zona === 'hueco' ? 'Inside the hollow there is no enclosed current (Ampère): B = 0' : `Ampère's law with a circle of radius <i>r</i>: B·2π<i>r</i> = μ<sub>0</sub><i>I</i><sub>enc</sub>, with <i>I</i><sub>enc</sub>/<i>I</i> = ${i.zona === 'fuera' ? '1 (outside, all of it is enclosed)' : i.perfil === 'lineal' ? (i.hueco ? '(<i>r</i><sup>3</sup> − <i>R</i><sub>1</sub><sup>3</sup>)/(<i>R</i><sub>2</sub><sup>3</sup> − <i>R</i><sub>1</sub><sup>3</sup>) with <i>J</i> ∝ <i>r</i>' : '<i>r</i><sup>3</sup>/<i>R</i><sup>3</sup> with <i>J</i> ∝ <i>r</i>') : (i.hueco ? '(<i>r</i><sup>2</sup> − <i>R</i><sub>1</sub><sup>2</sup>)/(<i>R</i><sub>2</sub><sup>2</sup> − <i>R</i><sub>1</sub><sup>2</sup>)' : '<i>r</i><sup>2</sup>/<i>R</i><sup>2</sup>')}`),
    },
    lamina: {
      label: 'Current sheet', icon: '▤', unidad: 'A/m', simbolo: 'K', escala: 1,
      campos: [['C', 'Point of the sheet', 'vec'], ['eje', 'Normal to the sheet', 'eje'], ['u', 'Direction of K', 'vec']],
      def: () => ({ C: ['0', '0', '0'], eje: 'z', u: ['1', '0', '0'], s: 'K' }),
      campo(f, P) {
        const n = EJES[f.eje], k = V3.sub(f.u, V3.sc(n, V3.dot(f.u, n)));
        if (V3.norm(k) < 1e-12) return { error: 'K has to run along the sheet' };
        const z = V3.dot(V3.sub(P, f.C), n);
        if (Math.abs(z) < 1e-12) return { error: 'the point is on the sheet' };
        return { B: V3.sc(V3.cross(V3.unit(k), n), Math.sign(z) / 2), info: { lamina: true } };
      },
      formula: () => 'Infinite sheet (Ampère): B = <span class="fr"><span class="nu">μ<sub>0</sub><i>K</i></span><span class="de">2</span></span>, parallel to the sheet and perpendicular to <span class="vv">K</span>, in opposite directions on each side (<span class="vv">B</span> = <span class="fr"><span class="nu">μ<sub>0</sub></span><span class="de">2</span></span> <span class="vv">K</span> × <span class="uv">n</span>)',
    },
    disco: {
      label: 'Rotating charged disc', icon: '◍', simbolo: 'sigma*omega', escala: 2,
      campos: [['C', 'Centre', 'vec'], ['plano', 'Parallel plate', 'plano'], ['R', 'Radius', 'num'], ['sentido', 'Rotation', 'sentido']],
      def: () => ({ C: ['0', '0', '0'], plano: 'xy', R: '1', sentido: 1, s: 'sigma*omega' }),
      campo(f, P, fino) {
        const pl = PLANOS[f.plano], CP = V3.sub(P, f.C), z = V3.dot(CP, pl.n), rho = V3.norm(V3.sub(CP, V3.sc(pl.n, z))), R = f.R;
        if (rho < 1e-12 * R) {
          return { B: V3.sc(pl.n, (((2 * z * z + R * R) / Math.hypot(R, z) - 2 * Math.abs(z)) / 2) * f.sentido), info: { eje: true, z } };
        }
        if (Math.abs(z) < 1e-9 && rho <= R) return { error: 'the point is on the disc' };
        const g = gl(fino ? 16 : 6), pan = fino ? 6 : 2, h = R / pan, B = [0, 0, 0];
        for (let p = 0; p < pan; p++) for (let i = 0; i < g.x.length; i++) {
          const r = h * (p + (g.x[i] + 1) / 2), w = ((g.w[i] * h) / 2) * r * f.sentido, b = arcoNum(P, f.C, pl, r, 0, 2 * PI, false);
          B[0] += w * b[0]; B[1] += w * b[1]; B[2] += w * b[2];
        }
        return { B, info: { eje: false } };
      },
      formula: (i) => (i.eje ? 'Each ring of radius <i>r</i> carries d<i>I</i> = σω<i>r</i> d<i>r</i>; integrating on the axis: B = <span class="fr"><span class="nu">μ<sub>0</sub>σω</span><span class="de">2</span></span>(<span class="fr"><span class="nu">2<i>z</i><sup>2</sup> + <i>R</i><sup>2</sup></span><span class="de">√(<i>R</i><sup>2</sup> + <i>z</i><sup>2</sup>)</span></span> − 2|<i>z</i>|)' : 'Sum of current rings d<i>I</i> = σω<i>r</i> d<i>r</i>, solved numerically'),
    },
  };
  function esquinas(f) {
    const pl = PLANOS[f.plano], s = f.sentido < 0 ? -1 : 1, q = [[1, -1], [1, 1], [-1, 1], [-1, -1]];
    const v = q.map(([x, y]) => V3.add(f.C, V3.add(V3.sc(pl.e1, (x * f.a) / 2), V3.sc(pl.e2, (y * f.b) / 2))));
    return s > 0 ? v : v.reverse();
  }

  function lector(modo) {
    const vars = modo === 'si' ? { m: 1, cm: 0.01, mm: 0.001, km: 1000 } : null;
    const unit = modo === 'si' ? null : 'a';
    return (src, que) => {
      try { return parseExpr(src, unit, vars); } catch (e) { throw new Error(`${que}: ${e.message}`); }
    };
  }
  function leerFuente(f, leer, i) {
    const T = SOURCES[f.tipo], nom = f.nombre || `${T.label} ${i + 1}`, o = { ...f, nombre: nom };
    for (const [k, lab, tipo] of T.campos) {
      if (tipo === 'vec') o[k] = f[k].map((x, j) => leer(x, `${nom}, ${lab} (${'xyz'[j]})`));
      else if (tipo === 'num') o[k] = leer(f[k], `${nom}, ${lab}`);
      else if (tipo === 'sentido' || tipo === 'salida') o[k] = f[k] < 0 ? -1 : 1;
      else if (tipo === 'perfil') o[k] = f[k] === 'lineal' ? 'lineal' : 'uniforme';
    }
    if (T.campos.some(([k, , t]) => k === 'u' && t === 'vec') && V3.norm(o.u) < 1e-12) throw new Error(`${nom}: the direction cannot be zero`);
    for (const k of ['R', 'L', 'N', 'a', 'b', 'R2']) if (k in o && !(o[k] > 0)) throw new Error(`${nom}: ${k} must be positive`);
    if ('R1' in o && f.tipo === 'cilindro' && !(o.R1 >= 0 && o.R1 < o.R2)) throw new Error(`${nom}: the inner radius has to be between 0 and the outer one`);
    o.k = leer(f.I ?? '1', `${nom}, corriente`);
    o.s = f.s || '';
    if (T.escala) o.s = key(o.s, ...Array(T.escala).fill('~a'));
    return o;
  }

  const key = (...ss) => ss.flatMap((s) => (s ? s.split('*') : [])).sort().join('*');
  function vpAdd(vp, k, v) { const o = vp[k] || [0, 0, 0]; vp[k] = V3.add(o, v); }
  function vpLimpia(vp) {
    const tam = Math.max(1e-300, ...Object.values(vp).flatMap((v) => v.map(Math.abs)));
    for (const [k, v] of Object.entries(vp)) {
      const w = v.map((x) => (Math.abs(x) < 1e-11 * tam ? 0 : x));
      if (w.every((x) => x === 0)) delete vp[k]; else vp[k] = w;
    }
    return vp;
  }
  function campoTotal(fs, P, fino = true, excluir = null) {
    const vp = {}, pasos = [];
    for (const f of fs) {
      if (f === excluir) continue;
      const r = SOURCES[f.tipo].campo(f, P, fino);
      if (r.error) throw new Error(`${f.nombre}: ${r.error}`);
      const v = V3.sc(r.B, f.k);
      vpAdd(vp, f.s, v);
      pasos.push({ f, info: r.info, vp: vpLimpia({ [f.s]: v }) });
    }
    return { vp: vpLimpia(vp), pasos };
  }
  function campoRapido(fs, P) {
    let B = [0, 0, 0];
    for (const f of fs) {
      const r = SOURCES[f.tipo].campo(f, P, false);
      if (!r.error) B = V3.add(B, V3.sc(r.B, f.k));
    }
    return B;
  }

  const GREEK = { mu: 'μ', lambda: 'λ', alpha: 'α', beta: 'β', omega: 'ω', phi: 'φ', theta: 'θ', sigma: 'σ' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function sym(name) {
    const m = String(name).match(/^([A-Za-z]+?)_?(\d*)$/);
    if (!m) return `<i>${esc(name)}</i>`;
    return `<i>${esc(GREEK[m[1].toLowerCase()] || m[1])}</i>${m[2] ? `<sub>${m[2]}</sub>` : ''}`;
  }
  const sup = (n) => (n === 1 ? '' : `<sup>${n}</sup>`);
  const potA = (k) => (k ? k.split('*').filter((s) => s === '~a').length : 0);
  function mono(k) {
    const cnt = {};
    for (const s of k ? k.split('*') : []) if (s !== '~a') cnt[s] = (cnt[s] || 0) + 1;
    return Object.keys(cnt).sort((x, y) => (y === 'sigma') - (x === 'sigma')).map((s) => sym(s) + sup(cnt[s])).join('');
  }
  const frac = (n, d) => (d ? `<span class="fr"><span class="nu">${n || '1'}</span><span class="de">${d}</span></span>` : n || '1');
  const uv = (c) => `<span class="uv">u</span><sub>${c}</sub>`;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  function dec(x) {
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    let s = a >= 1e4 || a < 1e-3 ? x.toExponential(3).replace(/\.?0+e/, 'e').replace('e', '·10^') : String(+x.toPrecision(4));
    s = s.replace(/·10\^([+-]?\d+)/, (_, e) => `·10<sup>${+e}</sup>`);
    return s.replace('.', '.').replace('-', MINUS);
  }
  function num(x) {
    const id = identify(x, false);
    if (!id) return dec(x);
    if (id.n === 0) return '0';
    return (id.s < 0 ? MINUS : '') + `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}${id.d !== 1 ? '/' + id.d : ''}`;
  }
  const pt = (v) => `(${v.map(num).join(', ')})`;
  function cola(k, n, conPi) {
    n += potA(k);
    const syms = 'μ<sub>0</sub>' + mono(k) + (n > 0 ? `<i>a</i>${sup(n)}` : '');
    const den = (conPi ? 'π' : '') + (n < 0 ? `<i>a</i>${sup(-n)}` : '');
    return { syms, den };
  }
  function vecMono(v, k, n) {
    const comps = ['x', 'y', 'z'];
    for (const conPi of [true, false]) {
      const f = conPi ? PI : 1;
      const ids = v.map((x) => identify(x * f, false));
      if (ids.some((x) => !x)) continue;
      const nz = ids.map((id, i) => ({ id, i })).filter((o) => o.id.n !== 0);
      if (!nz.length) return '0';
      const r0 = nz[0].id.r, mismoRad = nz.every((o) => o.id.r === r0);
      const L = nz.reduce((l, o) => (l * o.id.d) / gcd(l, o.id.d), 1);
      const ints = nz.map((o) => (o.id.n * L) / o.id.d);
      const g = ints.reduce((a, b) => gcd(a, b), 0);
      const neg = nz.every((o) => o.id.s < 0);
      const { syms, den } = cola(k, n, conPi);
      const rad = mismoRad && r0 > 1 ? '√' + r0 : '';
      const front = (neg ? MINUS : '') + frac(`${g !== 1 ? g : ''}${rad}${syms}`, `${L !== 1 ? L : ''}${den}`);
      if (nz.length === 1) return `${front} ${uv(comps[nz[0].i])}`;
      const inner = nz.map((o, j) => {
        const m = ints[j] / g, sg = (o.id.s < 0) !== neg, r = mismoRad ? 1 : o.id.r;
        const c = m === 1 && r === 1 ? '' : `${m !== 1 || r === 1 ? m : ''}${r > 1 ? '√' + r : ''}`;
        return (j === 0 ? (sg ? MINUS : '') : sg ? ` ${MINUS} ` : ' + ') + c + ' ' + uv(comps[o.i]);
      }).join('');
      return `${front}·(${inner})`;
    }
    return null;
  }
  function term(c, k, n) {
    let best = null;
    for (const conPi of [true, false]) {
      const id = identify(c * (conPi ? PI : 1));
      if (id && (!best || id.score < best.id.score)) best = { id, conPi };
    }
    if (!best) {
      const { syms, den } = cola(k, n, true);
      const x = c * PI;
      for (let D = 1; D <= 24; D++) for (let Bn = -24; Bn <= 24; Bn++) {
        if (!Bn) continue;
        const A = x * D - Bn * PI, Ar = Math.round(A);
        if (!Ar || Math.abs(Ar) > 200 || Math.abs(A - Ar) > 1e-9 * Math.max(1, Math.abs(x * D))) continue;
        const g = gcd(gcd(Math.abs(Ar), Math.abs(Bn)), D), a2 = Ar / g, b2 = Bn / g, d2 = D / g;
        const neg = a2 < 0 && b2 < 0, bs = `${Math.abs(b2) !== 1 ? Math.abs(b2) : ''}π`;
        const top = b2 > 0 ? `(${bs} ${a2 < 0 ? MINUS : '+'} ${Math.abs(a2)})` : a2 > 0 ? `(${Math.abs(a2)} ${MINUS} ${bs})` : `(${bs} + ${Math.abs(a2)})`;
        return { neg, html: frac(top + syms, `${d2 !== 1 ? d2 : ''}${den}`) };
      }
      for (const [p, q] of LN_BASES) {
        const id = identify((c * PI) / Math.log(p / q), false);
        if (id && id.r === 1 && id.d <= 24 && id.n <= 200 && id.n) return { neg: id.s < 0, html: `${frac(`${id.n !== 1 ? id.n : ''}${syms}`, `${id.d !== 1 ? id.d : ''}${den}`)} ln ${q === 1 ? p : `(${p}/${q})`}` };
      }
      return { neg: c < 0, html: `${dec(Math.abs(c * PI))}·${frac(syms, den)}` };
    }
    const { id, conPi } = best, { syms, den } = cola(k, n, conPi);
    if (id.mix) {
      const A = Math.abs(id.a), Bb = Math.abs(id.b), bs = `${Bb !== 1 ? Bb : ''}√${id.r}`;
      const neg = id.a < 0 && id.b < 0;
      const top = id.a > 0 ? `(${A} ${id.b < 0 ? MINUS : '+'} ${bs})` : id.b > 0 ? `(${bs} ${MINUS} ${A})` : `(${A} + ${bs})`;
      return { neg, html: frac(top + syms, `${id.d !== 1 ? id.d : ''}${den}`) };
    }
    return { neg: id.s < 0, html: frac(`${id.n !== 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}${syms}`, `${id.d !== 1 ? id.d : ''}${den}`) };
  }
  const LN_BASES = [];
  for (let p = 2; p <= 12; p++) for (let q = 1; q < p; q++) if (gcd(p, q) === 1 && !LN_BASES.some(([a, b]) => Math.abs(Math.log(a / b) / Math.log(p / q) - Math.round(Math.log(a / b) / Math.log(p / q))) < 1e-12 && Math.round(Math.log(p / q) / Math.log(a / b)) >= 1)) LN_BASES.push([p, q]);
  const junta = (ts) => (ts.length ? ts.map((t, i) => (i === 0 ? (t.neg ? MINUS : '') : t.neg ? ` ${MINUS} ` : ' + ') + t.html).join('') : '0');
  function vecHtml(vp, n, modo, unidad) {
    const ks = Object.keys(vp);
    if (!ks.length) return modo === 'si' ? `0 <span class="unit">${unidad}</span>` : '0';
    if (modo === 'si') {
      const v = V3.sc(Object.values(vp).reduce((a, b) => V3.add(a, b), [0, 0, 0]), MU0);
      return `(${v.map(dec).join(', ')}) <span class="unit">${unidad}</span>`;
    }
    if (ks.length === 1) { const h = vecMono(vp[ks[0]], ks[0], n); if (h) return h; }
    return junta([0, 1, 2].map((i) => {
      const ts = ks.filter((k) => vp[k][i] !== 0).map((k) => term(vp[k][i], k, n));
      if (!ts.length) return null;
      if (ts.length === 1) return { neg: ts[0].neg, html: `${ts[0].html} ${uv('xyz'[i])}` };
      return { neg: false, html: `(${junta(ts)}) ${uv('xyz'[i])}` };
    }).filter(Boolean));
  }
  function modHtml(vp, n, modo, unidad) {
    const ks = Object.keys(vp);
    if (modo === 'si') {
      const v = Object.values(vp).reduce((a, b) => V3.add(a, b), [0, 0, 0]);
      return `${dec(V3.norm(v) * MU0)} <span class="unit">${unidad}</span>`;
    }
    if (!ks.length) return '0';
    if (ks.length !== 1) return null;
    return term(V3.norm(vp[ks[0]]), ks[0], n).html;
  }

  const ANALYSES = {
    B: {
      label: 'Field B', titulo: 'Magnetic field at a point',
      def: () => ({ P: ['0', '0', '0'] }),
      run(q, fs, leer, modo) {
        const P = q.P.map((x, j) => leer(x, `Point P (${'xyz'[j]})`));
        const { vp, pasos } = campoTotal(fs, P);
        const steps = pasos.map(({ f, info, vp: c }) => ({ f, info, html: vecHtml(c, -1, modo, 'T') }));
        const m = modHtml(vp, -1, modo, 'T');
        return {
          P, vp,
          res: `<span class="vv">B</span>(P) = ${vecHtml(vp, -1, modo, 'T')}${m ? `<br><span class="sub">|<span class="vv">B</span>| = ${m}</span>` : ''}`,
          steps, final: 'Superposition: <span class="vv">B</span> = Σ <span class="vv">B</span><sub>i</sub>',
        };
      },
    },
    Fq: {
      label: 'Force on a charge', titulo: 'Lorentz force on a moving charge',
      def: () => ({ P: ['0', '0', '0'], q: '1', qs: 'q', v: ['1', '0', '0'], vs: 'v' }),
      run(q, fs, leer, modo) {
        const P = q.P.map((x, j) => leer(x, `Point P (${'xyz'[j]})`));
        const kq = leer(q.q, 'Charge'), v = q.v.map((x, j) => leer(x, `Velocity (${'xyz'[j]})`));
        const { vp } = campoTotal(fs, P);
        const F = {};
        for (const [k, B] of Object.entries(vp)) vpAdd(F, modo === 'si' ? '' : key(q.qs, q.vs, k), V3.sc(V3.cross(v, B), kq));
        vpLimpia(F);
        const m = modHtml(F, -1, modo, 'N');
        const vtxt = modo === 'si' ? `${pt(v)} m/s` : `${pt(v)}·${sym(q.vs || 'v')}`;
        return {
          P, vp,
          res: `<span class="vv">F</span> = <i>q</i> <span class="vv">v</span> × <span class="vv">B</span> = ${vecHtml(F, -1, modo, 'N')}${m ? `<br><span class="sub">|<span class="vv">F</span>| = ${m}</span>` : ''}`,
          steps: [{ html: `<span class="vv">B</span>(P) = ${vecHtml(vp, -1, modo, 'T')}`, texto: 'Field at the point' }, { html: `<span class="vv">v</span> = ${vtxt}`, texto: 'Velocity of the charge' }],
          final: '<span class="vv">F</span> = <i>q</i> <span class="vv">v</span> × <span class="vv">B</span>',
        };
      },
    },
    Fhilo: {
      label: 'Force on a wire', titulo: 'Magnetic force on a conductor',
      def: (fs) => ({ fuente: fs.find((f) => f.tipo === 'hilo' || f.tipo === 'segmento')?.id || '' }),
      run(q, fs, leer, modo) {
        const f = fs.find((x) => x.id === q.fuente);
        if (!f) throw new Error('choose the wire or segment the force acts on');
        const otros = fs.filter((x) => x !== f);
        const F = {};
        if (f.tipo === 'hilo') {
          const u = V3.unit(f.u);
          for (const o of otros) {
            const paralelo = o.tipo === 'hilo' && V3.norm(V3.cross(V3.unit(o.u), u)) < 1e-12;
            if (!paralelo) throw new Error('the force per unit length on an infinite wire is only calculated with other parallel infinite wires');
          }
          const { vp } = campoTotal(otros, f.A);
          for (const [k, B] of Object.entries(vp)) vpAdd(F, modo === 'si' ? '' : key(f.s, k), V3.sc(V3.cross(u, B), f.k));
          vpLimpia(F);
          const m = modHtml(F, -1, modo, 'N/m');
          return {
            vp: {}, res: `<span class="fr"><span class="nu"><span class="vv">F</span></span><span class="de"><i>L</i></span></span> = <i>I</i> <span class="uv">u</span> × <span class="vv">B</span> = ${vecHtml(F, -1, modo, 'N/m')}${m ? `<br><span class="sub">|<span class="vv">F</span>|/<i>L</i> = ${m}</span>` : ''}`,
            steps: [{ html: `<span class="vv">B</span> = ${vecHtml(vp, -1, modo, 'T')}`, texto: `Field of the other wires on ${esc(f.nombre)}` }],
            final: 'Per unit length: <span class="vv">F</span>/<i>L</i> = <i>I</i> <span class="uv">u</span> × <span class="vv">B</span>',
          };
        }
        if (f.tipo !== 'segmento') throw new Error('the force is calculated on an infinite wire or a segment');
        const dl = V3.sub(f.B, f.A), g = gl(32), pan = 8;
        for (let p = 0; p < pan; p++) for (let i = 0; i < g.x.length; i++) {
          const t = (p + (g.x[i] + 1) / 2) / pan, w = g.w[i] / 2 / pan;
          const { vp } = campoTotal(otros, V3.add(f.A, V3.sc(dl, t)));
          for (const [k, B] of Object.entries(vp)) vpAdd(F, modo === 'si' ? '' : key(f.s, k), V3.sc(V3.cross(dl, B), f.k * w));
        }
        vpLimpia(F);
        const m = modHtml(F, 0, modo, 'N');
        return {
          vp: {}, res: `<span class="vv">F</span> = ∫ <i>I</i> d<span class="vv">l</span> × <span class="vv">B</span> = ${vecHtml(F, 0, modo, 'N')}${m ? `<br><span class="sub">|<span class="vv">F</span>| = ${m}</span>` : ''}`,
          steps: [{ html: `d<span class="vv">l</span> along ${pt(dl)}`, texto: `Section ${esc(f.nombre)} from A to B` }],
          final: 'Integral of the force along the segment (Gauss-Legendre)',
        };
      },
    },
  };

  function perfilB(q, fs, leer, modo) {
    const P = q.P.map((x, j) => leer(x, `From (${'xyz'[j]})`)), Q = q.Q.map((x, j) => leer(x, `To (${'xyz'[j]})`)), d = V3.sub(Q, P), L = V3.norm(d);
    if (!(L > 0)) throw new Error('the two ends of the line coincide');
    const n = 160, xs = [], ys = [], esc2 = modo === 'si' ? MU0 : 1;
    for (let k = 0; k <= n; k++) {
      let m = null;
      try { const { vp } = campoTotal(fs, V3.add(P, V3.sc(d, k / n)), false); m = V3.norm(Object.values(vp).reduce((a, b) => V3.add(a, b), [0, 0, 0])) * esc2; } catch (e) { m = null; }
      xs.push((L * k) / n); ys.push(m !== null && isFinite(m) ? m : null);
    }
    const val = ys.filter((y) => y !== null).sort((a, b) => a - b);
    if (!val.length) throw new Error('the line passes over the sources at all its points');
    const top = Math.max(val[Math.floor(0.97 * (val.length - 1))] * 1.15, 1e-300), iMax = ys.reduce((im, y, k) => (y !== null && (im < 0 || y > ys[im]) ? k : im), -1);
    const w = 320, h = 150, ml = 8, mb = 22, mt = 10, X = (x) => ml + ((w - 2 * ml) * x) / L, Y = (y) => h - mb - ((h - mb - mt) * Math.min(y, top)) / top;
    let trazo = '', pen = false;
    ys.forEach((y, k) => { if (y === null) { pen = false; return; } trazo += `${pen ? 'L' : 'M'}${X(xs[k]).toFixed(1)} ${Y(y).toFixed(1)} `; pen = true; });
    const uL = (x) => (modo === 'si' ? `${dec(x)} m` : `${num(x) === '1' ? '' : num(x)}a`), uB = modo === 'si' ? 'T' : 'μ₀/a per unit current';
    const svg = `<svg class="perfil" viewBox="0 0 ${w} ${h}" role="img" aria-label="|B| profile along the line">`
      + `<line x1="${ml}" y1="${h - mb}" x2="${w - ml}" y2="${h - mb}" stroke="var(--line)"/>`
      + `<path d="${trazo}" fill="none" stroke="var(--neg)" stroke-width="2"/>`
      + `<circle cx="${X(xs[iMax]).toFixed(1)}" cy="${Y(ys[iMax]).toFixed(1)}" r="3.5" fill="var(--mark)"/>`
      + `<text x="${ml}" y="${h - 6}" font-size="11" fill="var(--muted)">P</text><text x="${w - ml}" y="${h - 6}" font-size="11" fill="var(--muted)" text-anchor="end">Q · ${uL(L)}</text>`
      + `<text x="${ml + 4}" y="${mt + 8}" font-size="11" fill="var(--muted)">|B| (${uB})</text></svg>`;
    const huecos = ys.some((y) => y === null), claves = [...new Set(fs.map((f) => f.s))];
    const maxHtml = modo === 'si' ? `${dec(ys[iMax])} <span class="unit">T</span>` : claves.length === 1 ? term(ys[iMax], claves[0], -1).html : `${dec(ys[iMax])}·μ<sub>0</sub>/<i>a</i>`;
    return {
      P, Q, vp: {}, perfil: { xs, ys },
      res: `${svg}<span class="sub">Maximum |<span class="vv">B</span>| = ${maxHtml} at a distance ${uL(xs[iMax])} from P${huecos ? ' · the gaps are points on a conductor' : ''}</span>`,
      steps: [{ texto: 'Line from P to Q', html: `<span class="vv">B</span> is calculated by superposition at ${n + 1} points between P = ${pt(P)} and Q = ${pt(Q)}${modo === 'si' ? '' : ', with all currents equal to 1 (the result is in units of μ<sub>0</sub>/<i>a</i> per unit current)'}.` }],
      final: 'Magnitude of the total field at each point of the line',
    };
  }
  function momentoLazo(f) {
    if (f.tipo === 'espira') return V3.sc(PLANOS[f.plano].n, PI * f.R * f.R * f.sentido);
    if (f.tipo === 'rectangular') return V3.sc(PLANOS[f.plano].n, f.a * f.b * f.sentido);
    if (f.tipo === 'solenoide') return V3.sc(EJES[f.eje], f.N * PI * f.R * f.R * f.sentido);
    if (f.tipo === 'disco') return V3.sc(PLANOS[f.plano].n, (PI * Math.pow(f.R, 4) * f.sentido) / 4);
    return null;
  }
  const centroLazo = (f) => f.C;
  function campoDipolo(m, r) { const d = V3.norm(r), u = V3.sc(r, 1 / d); return V3.sc(V3.sub(V3.sc(u, 3 * V3.dot(m, u)), m), 1 / (4 * PI * d * d * d)); }
  const dirTxt = (v) => { const n = V3.norm(v); if (!n) return '0'; const u = V3.sc(v, 1 / n), i = u.findIndex((x) => Math.abs(Math.abs(x) - 1) < 1e-9); return i >= 0 ? `${u[i] < 0 ? MINUS : '+'}${'xyz'[i]}` : pt(u.map((x) => +x.toFixed(4))); };
  ANALYSES.dipolo = {
    label: 'Magnetic dipole', titulo: 'Dipole moment and far field',
    def: () => ({ P: ['0', '0', '3'] }),
    run(q, fs, leer, modo) {
      const P = q.P.map((x, j) => leer(x, `Point P (${'xyz'[j]})`)), lazos = fs.filter((f) => momentoLazo(f)), otros = fs.filter((f) => !momentoLazo(f));
      if (!lazos.length) throw new Error('Add a loop, a rectangular loop, a solenoid or a disc: the dipole describes a current loop');
      const exacto = campoTotal(lazos, P).vp, vd = {}, steps = [], mt = [0, 0, 0];
      for (const f of lazos) {
        const m = momentoLazo(f), r = V3.sub(P, centroLazo(f));
        if (V3.norm(r) < 1e-12) throw new Error(`${f.nombre}: point P is at the centre of the loop, where the dipole is not valid`);
        vpAdd(vd, f.s, V3.sc(campoDipolo(m, r), f.k));
        const mm = V3.norm(m), kf = mm / PI, mT = V3.sc(m, f.k);
        for (let i = 0; i < 3; i++) mt[i] += mT[i];
        const txt = modo === 'si' ? `${dec(mm * f.k)} <span class="unit">A·m²</span> toward ${dirTxt(m)}` : `${kf === 1 ? '' : num(kf)}π ${sym(f.s)}<i>a</i><sup>2</sup> toward ${dirTxt(m)}`;
        steps.push({ texto: `${f.nombre} · dipole moment`, html: `<span class="vv">m</span> = ${f.tipo === 'espira' ? 'π R² I' : f.tipo === 'rectangular' ? 'a b I' : f.tipo === 'solenoide' ? 'N π R² I' : 'π σ ω R⁴/4'} = ${txt}` });
      }
      vpLimpia(vd);
      const tot = (vp) => Object.values(vp).reduce((a, b) => V3.add(a, b), [0, 0, 0]), Be = tot(exacto), Bd = tot(vd), nB = V3.norm(Be), err = nB ? V3.norm(V3.sub(Bd, Be)) / nB : NaN;
      const m1 = lazos[0], req = Math.sqrt(V3.norm(momentoLazo(m1)) / PI), dist = V3.norm(V3.sub(P, centroLazo(m1)));
      steps.push({ texto: 'Dipole field', html: `<span class="vv">B</span><sub>dip</sub> = μ₀/(4π<i>r</i>³) [3(<span class="vv">m</span>·r̂)r̂ − <span class="vv">m</span>] = ${vecHtml(vd, -1, modo, 'T')}` });
      steps.push({ texto: 'Exact field (Biot-Savart)', html: `<span class="vv">B</span> = ${vecHtml(exacto, -1, modo, 'T')}` });
      const aviso = otros.length ? `<br><span class="sub">Not taken into account: ${otros.map((f) => esc(f.nombre)).join(', ')} (they are not loops).</span>` : '';
      const mtxt = modo === 'si' ? `(${mt.map(dec).join(', ')}) <span class="unit">A·m²</span>` : lazos.map((f) => { const c = (V3.norm(momentoLazo(f)) / PI) * f.k; return `${c === 1 ? '' : num(c)}π ${sym(f.s)}<i>a</i><sup>2</sup> (${dirTxt(momentoLazo(f))})`; }).join(' + ');
      return {
        P, vp: exacto, dipolo: { Be, Bd, err, dist, req },
        res: `<span class="vv">m</span> = ${mtxt}<br><span class="vv">B</span><sub>dip</sub>(P) = ${vecHtml(vd, -1, modo, 'T')}<br><span class="sub"><span class="vv">B</span><sub>exacto</sub>(P) = ${vecHtml(exacto, -1, modo, 'T')}</span><br><span class="sub">Difference: ${(100 * err).toLocaleString('en-US', { maximumFractionDigits: 2 })} % · distance ≈ ${(dist / req).toLocaleString('en-US', { maximumFractionDigits: 2 })} loop radii</span>${aviso}`,
        steps, final: 'B ≈ μ₀/(4π r³)[3(m·r̂)r̂ − m]; on the axis μ₀ m/(2π r³) and in the plane of the loop μ₀ m/(4π r³), opposite to m',
      };
    },
  };
  function arcoA(P, c, pl, R, N = 256) {
    const A = [0, 0, 0], h = (2 * PI) / N;
    for (let i = 0; i < N; i++) {
      const t = i * h, r = V3.add(c, V3.add(V3.sc(pl.e1, R * Math.cos(t)), V3.sc(pl.e2, R * Math.sin(t)))), dl = V3.add(V3.sc(pl.e1, -R * Math.sin(t) * h), V3.sc(pl.e2, R * Math.cos(t) * h)), k = 1 / (4 * PI * V3.norm(V3.sub(P, r)));
      A[0] += k * dl[0]; A[1] += k * dl[1]; A[2] += k * dl[2];
    }
    return A;
  }
  function segmentoA(P, A0, B0) {
    const d = V3.sub(B0, A0), L = V3.norm(d), u = V3.sc(d, 1 / L), w = V3.sub(P, A0), t0 = V3.dot(w, u), d2 = V3.dot(w, w) - t0 * t0, dd = Math.sqrt(Math.max(d2, 0));
    if (dd < 1e-9 * L) return null;
    return V3.sc(u, (Math.asinh((L - t0) / dd) + Math.asinh(t0 / dd)) / (4 * PI));
  }
  const POT = {
    espira(f, P) {
      const pl = PLANOS[f.plano], CP = V3.sub(P, f.C), z = V3.dot(CP, pl.n), rho = V3.norm(V3.sub(CP, V3.sc(pl.n, z)));
      if ((rho - f.R) ** 2 + z * z < 1e-14 * f.R * f.R) return { error: 'the point is on the loop' };
      return { A: V3.sc(arcoA(P, f.C, pl, f.R, rho < 1e-12 ? 8 : 512), f.sentido), nota: rho < 1e-12 ? 'On the axis A = 0 by symmetry' : 'Neumann integral along the loop' };
    },
    rectangular(f, P) {
      const v = esquinas(f), A = [0, 0, 0];
      for (let k = 0; k < 4; k++) { const a = segmentoA(P, v[k], v[(k + 1) % 4]); if (!a) return { error: 'the point is on a side of the loop' }; A[0] += a[0]; A[1] += a[1]; A[2] += a[2]; }
      return { A, nota: 'Sum of the four sides: A = (μ₀I/4π) û [asinh + asinh]' };
    },
    solenoide(f, P, fino) {
      const n = EJES[f.eje], CP = V3.sub(P, f.C), z = V3.dot(CP, n), rv = V3.sub(CP, V3.sc(n, z)), rho = V3.norm(rv), dens = f.N / f.L;
      if (f.ideal) {
        if (rho < 1e-12) return { A: [0, 0, 0], nota: 'En el eje A = 0' };
        const phi = V3.cross(n, V3.sc(rv, 1 / rho)), a = rho < f.R ? (dens * rho) / 2 : (dens * f.R * f.R) / (2 * rho);
        return { A: V3.sc(phi, a * f.sentido), nota: rho < f.R ? 'Inside the ideal solenoid: A = μ₀ n I ρ/2 (along φ̂)' : 'Outside the ideal solenoid: A = μ₀ n I R²/(2ρ): there is A even though B = 0' };
      }
      if (Math.abs(rho - f.R) < 1e-9 && Math.abs(z) <= f.L / 2) return { error: 'the point is on the winding' };
      const pl = PLANOS[PLANO_DE_EJE[f.eje]], g = gl(fino ? 16 : 6), pan = fino ? 12 : 4, h = f.L / pan, A = [0, 0, 0];
      for (let p = 0; p < pan; p++) for (let i = 0; i < g.x.length; i++) {
        const zz = -f.L / 2 + h * (p + (g.x[i] + 1) / 2), a = arcoA(P, V3.add(f.C, V3.sc(n, zz)), pl, f.R, rho < 1e-12 ? 8 : 192), w = (g.w[i] * h) / 2 * dens * f.sentido;
        A[0] += w * a[0]; A[1] += w * a[1]; A[2] += w * a[2];
      }
      return { A, nota: 'Sum of the solenoid loops (numerical integral)' };
    },
  };
  ANALYSES.potencial = {
    label: 'Vector potential A', titulo: 'Vector potential at a point',
    def: () => ({ P: ['2', '0', '0'] }),
    run(q, fs, leer, modo) {
      const P = q.P.map((x, j) => leer(x, `Point P (${'xyz'[j]})`)), ok = fs.filter((f) => POT[f.tipo]), otros = fs.filter((f) => !POT[f.tipo]);
      if (!ok.length) throw new Error('Add a loop, a rectangular loop or a solenoid: the vector potential is calculated for those loops');
      const vp = {}, steps = [];
      for (const f of ok) {
        const r = POT[f.tipo](f, P, true); if (r.error) throw new Error(`${f.nombre}: ${r.error}`);
        const v = V3.sc(r.A, f.k); vpAdd(vp, f.s, v); steps.push({ texto: `${f.nombre} · ${SOURCES[f.tipo].label}`, html: `<span class="vv">A</span> = ${vecHtml(vpLimpia({ [f.s]: v }), 0, modo, 'T·m')}<br><span class="sub">${r.nota}</span>` });
      }
      vpLimpia(vp);
      const m = modHtml(vp, 0, modo, 'T·m'), aviso = otros.length ? `<br><span class="sub">Not taken into account: ${otros.map((f) => esc(f.nombre)).join(', ')}.</span>` : '';
      return { P, vp, res: `<span class="vv">A</span>(P) = ${vecHtml(vp, 0, modo, 'T·m')}${m ? `<br><span class="sub">|<span class="vv">A</span>| = ${m}</span>` : ''}${aviso}`, steps, final: 'A = μ₀/(4π) ∮ I dl/|r − r′|, with B = ∇ × A and ∮ A·dl = flux of B' };
    },
  };

  ANALYSES.perfil = { label: '|B| profile', titulo: '|B| profile along a line', def: () => ({ P: ['-3', '0', '0'], Q: ['3', '0', '0'] }), run: perfilB };

  function datos(f, info, modo) {
    const L = (x) => { if (modo === 'si') return `${dec(x)} m`; const t = num(x); return t === '1' ? '<i>a</i>' : t === MINUS + '1' ? MINUS + '<i>a</i>' : t === '0' ? '0' : `${t}<i>a</i>`; };
    const out = [];
    if (info.d !== undefined) out.push(`<i>d</i> = ${L(info.d)}`);
    if (info.c1 !== undefined) out.push(`cos α<sub>1</sub> = ${num(info.c1)}`, `cos α<sub>2</sub> = ${num(info.c2)}`);
    if (info.dir) out.push(`direction ${pt(info.dir)}`);
    if (info.eje && info.z !== undefined) out.push(`<i>z</i> = ${L(info.z)}`);
    if (info.th !== undefined) { const t = num(info.th / PI); out.push(`θ = ${t === '1' ? '' : t === MINUS + '1' ? MINUS : t}π`); }
    if (info.r !== undefined) out.push(`<i>r</i> = ${L(info.r)}`);
    if (info.fr !== undefined && info.zona !== 'hueco') out.push(`<i>I</i><sub>enc</sub> = ${num(info.fr)}·<i>I</i>`);
    return out.join(' · ');
  }

  function run(scene) {
    const modo = scene.modo === 'si' ? 'si' : 'sym', leer = lector(modo);
    const errors = [], fs = [];
    scene.fuentes.forEach((f, i) => { try { fs.push({ ...leerFuente(f, leer, i), id: f.id }); } catch (e) { errors.push(e.message); } });
    if (modo === 'si') for (const f of fs) f.s = '';
    const results = scene.preguntas.map((q) => {
      const A = ANALYSES[q.tipo];
      if (errors.length) return { q, error: 'first correct the data of the sources' };
      try {
        const r = A.run(q, fs, leer, modo);
        for (const s of r.steps) if (s.f) { s.texto = `${esc(s.f.nombre)} · ${SOURCES[s.f.tipo].label}`; s.formula = SOURCES[s.f.tipo].formula(s.info || {}); s.datos = datos(s.f, s.info || {}, modo); }
        return { q, ...r };
      } catch (e) { return { q, error: e.message }; }
    });
    return { modo, fuentes: fs, errors, results };
  }

  return { SOURCES, ANALYSES, PLANOS, EJES, PLANO_DE_EJE, run, campoRapido, esquinas, MU0, num, dec, sym, momentoLazo, campoDipolo, POT, campoTotal };
})();

