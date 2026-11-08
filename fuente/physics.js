/* =====================================================================
   Física: tipos de fuente, superposición, incógnitas y preguntas.
   Para añadir un tipo de fuente nuevo basta con añadir una entrada a
   SOURCES; para una pregunta nueva, una entrada a ANALYSES.
   ===================================================================== */
const Physics = (() => {
  const { PI, parseExpr, V3, Ex, Poly, VP, KINDS } = Engine;
  const F = Fmt;
  const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const AXI = { x: 0, y: 1, z: 2 };
  const uvAxis = (k, sgn = 1) => (sgn < 0 ? F.MINUS : '') + F.uv(k);
  const E_ = 'E<sub></sub>';
  const vecE = (sub) => `<span class="vv">E</span>${sub ? `<sub>${sub}</sub>` : ''}`;
  const eps = 'ε<sub>0</sub>';

  /* --------- densidades no uniformes: ρ(r) = ρ₀ Σ cₙ (r/R)ⁿ --------- */
  const PERFILES = {
    uniforme: { t: [[0, 1]], txt: 'ρ' },
    lineal: { t: [[1, 1]], txt: 'ρ<sub>0</sub> r/R' },
    inversa: { t: [[-1, 1]], txt: 'ρ<sub>0</sub> R/r' },
    resta: { t: [[0, 1], [1, -1]], txt: 'ρ<sub>0</sub>(1 − r/R)' },
    parabola: { t: [[0, 1], [2, -1]], txt: 'ρ<sub>0</sub>(1 − r<sup>2</sup>/R<sup>2</sup>)' },
  };
  const PERF_OPC = [['uniforme', 'uniforme'], ['lineal', 'ρ₀·r/R (crece)'], ['inversa', 'ρ₀·R/r'], ['resta', 'ρ₀·(1 − r/R)'], ['parabola', 'ρ₀·(1 − r²/R²)']];
  const perfil = (src) => PERFILES[src.perfil] || PERFILES.uniforme;
  // ∫_{R1}^{r} rʹ^(n+k−1) dr / R^n para cada término (k = 3 en esferas, 2 en cilindros)
  const momento = (pf, R, R1, r, k) => pf.t.reduce((acc, [n, c]) => acc + (c * (r ** (n + k) - R1 ** (n + k))) / ((n + k) * R ** n), 0);
  // inducción en una corteza conductora: si una fuente con carga total Q está dentro del hueco, su efecto fuera del
  // hueco es el de una corteza de carga Q en el radio exterior (−Q en la cara interior, +Q en la exterior)
  function conInduccion(def, ind) {
    const d = Object.create(def);
    const dentro = (X) => V3.norm(V3.sub(X, ind.pos));
    d.E = function (g, X) {
      const r = dentro(X);
      if (r < ind.R1 - 1e-12) return def.E.call(this, g, X);
      if (r < ind.R2 - 1e-12) return [0, 0, 0];
      return V3.sc(V3.sub(X, ind.pos), ind.Q / (4 * PI * r ** 3));
    };
    d.V = function (g, X) {
      const r = dentro(X);
      if (r < ind.R1 - 1e-12) { const v = def.V.call(this, g, X); return v && v.add(new Ex(-ind.Q / (4 * PI * ind.R1) + ind.Q / (4 * PI * ind.R2))); }
      return new Ex(ind.Q / (4 * PI * Math.max(r, ind.R2)));
    };
    d.explainE = function (g, X, nm) {
      const r = dentro(X), L = r < ind.R1 - 1e-12 ? def.explainE.call(this, g, X, nm) : [];
      L.push(r < ind.R1 - 1e-12 ? `Está dentro del hueco de la corteza conductora: la carga inducida en su cara interior (−Q) no crea campo en el hueco porque la carga está centrada.`
        : r < ind.R2 - 1e-12 ? `P está dentro del conductor: la carga −Q inducida en la cara interior anula el campo de ${nm} (E = 0).`
          : `Fuera de la corteza conductora, ${nm} y la carga −Q inducida en la cara interior se anulan; queda la +Q de la cara exterior: ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, con Q = ${F.num(ind.Q / (ind.Q || 1))}·(carga de ${nm}).`);
      return L;
    };
    return d;
  }
  // campo y potencial de una curva cargada (λ(s) ds) por cuadratura de Gauss-Legendre por tramos
  function curva(pt, lam, s0, s1, X, tramos = 16) {
    const { x, w } = Engine.gl(24);
    let E = [0, 0, 0], V = 0;
    for (let k = 0; k < tramos; k++) {
      const a = s0 + ((s1 - s0) * k) / tramos, b = s0 + ((s1 - s0) * (k + 1)) / tramos;
      for (let i = 0; i < x.length; i++) {
        const t = (a + b) / 2 + ((b - a) / 2) * x[i], wt = ((b - a) / 2) * w[i] * lam(t);
        const r = V3.sub(X, pt.p(t)), n = V3.norm(r);
        if (n < 1e-9) return null;
        E = V3.add(E, V3.sc(r, (wt * pt.ds(t)) / (4 * PI * n ** 3))); V += (wt * pt.ds(t)) / (4 * PI * n);
      }
    }
    // los ceros por simetría salen como 1e-17: se limpian para que el resultado sea exacto
    const m = V3.norm(E);
    return { E: E.map((c) => (Math.abs(c) < 1e-11 * m ? 0 : c)), V };
  }

  /* --------------------------- FUENTES --------------------------- */
  const SOURCES = {
    point: {
      label: 'Carga puntual', short: 'Carga', kind: 'q', prefix: 'q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Posición' }],
      defaults: () => ({ pos: ['0', '0', '0'], s: { c: '1', sym: 'q' } }),
      geom: (src, P) => ({ pos: src.pos.map(P) }),
      E(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        if (n < 1e-9) return null;
        return V3.sc(r, 1 / (4 * PI * n ** 3));
      },
      V(g, X) { const n = V3.norm(V3.sub(X, g.pos)); return n < 1e-9 ? null : new Ex(1 / (4 * PI * n)); },
      explainE(g, X, nm) {
        const r = V3.sub(X, g.pos);
        return [`<span class="vv">r</span> = P − <span class="vv">r</span><sub>${nm}</sub> = ${F.vecNum(r)}, &nbsp;|<span class="vv">r</span>| = ${F.num(V3.norm(r))}`,
          `${vecE()} = ${F.frac('q <span class="vv">r</span>', `4π${eps}|<span class="vv">r</span>|<sup>3</sup>`)}`];
      },
      explainV(g, A, B) {
        return `V = ${F.frac('q', `4π${eps}r`)}, &nbsp; r<sub>A</sub> = ${F.num(V3.norm(V3.sub(A, g.pos)))}, r<sub>B</sub> = ${F.num(V3.norm(V3.sub(B, g.pos)))}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    line: {
      label: 'Hilo infinito', short: 'Hilo', kind: 'lambda', prefix: 'λ', absV: false,
      fields: [
        { k: 'pos', t: 'vec3', label: 'Pasa por' },
        { k: 'dir', t: 'select', label: 'Paralelo a', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] },
        { k: 'mode', t: 'select', label: 'Carga', structural: true, options: [['lambda', 'lineal λ (hilo fino)'], ['rho', 'volumétrica ρ (cilindro de radio R)'], ['sigma', 'superficial σ (tubo de radio R)']] },
        { k: 'R', t: 'expr', label: 'Radio R', show: (s) => s.mode === 'rho' || s.mode === 'sigma' },
        { k: 'R1', t: 'expr', label: 'Radio interior (0 = macizo)', show: (s) => s.mode === 'rho', optional: true },
        { k: 'perfil', t: 'select', label: 'Densidad', options: PERF_OPC, show: (s) => s.mode === 'rho' },
      ],
      defaults: () => ({ pos: ['0', '0', '0'], dir: 'z', mode: 'lambda', R: '1', s: { c: '1', sym: 'lambda' } }),
      kindOf: (src) => (src.mode === 'rho' ? 'rho' : src.mode === 'sigma' ? 'sigma' : 'lambda'),
      geom(src, P) {
        const g = { pos: src.pos.map(P), u: AX[src.dir], dir: src.dir, mode: src.mode, R: src.mode === 'rho' || src.mode === 'sigma' ? P(src.R) : 0, R1: src.mode === 'rho' && String(src.R1 ?? '').trim() ? P(src.R1) : 0, pf: perfil(src) };
        if (g.R1 >= g.R && g.R1 > 0) throw new Error('el radio interior debe ser menor que R');
        return g;
      },
      // carga por unidad de longitud dentro de un radio d (ρ = 1 o σ = 1)
      lam(g, d) { return g.mode === 'sigma' ? (d >= g.R ? 2 * PI * g.R : 0) : 2 * PI * momento(g.pf, g.R, g.R1, Math.min(Math.max(d, g.R1), g.R), 2); },
      perp(g, X) { const w = V3.sub(X, g.pos); return V3.sub(w, V3.sc(g.u, V3.dot(w, g.u))); },
      E(g, X) {
        const pv = this.perp(g, X), d = V3.norm(pv);
        if (g.mode === 'rho' || g.mode === 'sigma') {
          if (g.mode === 'sigma' && Math.abs(d - g.R) < 1e-9) return null;
          if (d < 1e-12) return [0, 0, 0];
          return V3.sc(pv, this.lam(g, d) / (2 * PI * d * d));
        }
        if (d < 1e-9) return null;
        return V3.sc(pv, 1 / (2 * PI * d * d));
      },
      V(g, X) {
        const d = V3.norm(this.perp(g, X));
        if (g.mode === 'sigma') return d <= g.R ? new Ex(0) : Ex.ln(-g.R, d / g.R);
        if (g.mode === 'rho' && g.pf === PERFILES.uniforme && g.R1 === 0) {
          if (d <= g.R) return new Ex(-d * d / 4);
          return new Ex(-g.R * g.R / 4).add(Ex.ln(-g.R * g.R / 2, d / g.R));
        }
        if (g.mode === 'rho') {
          // V(d) = −∫ E dd con V = 0 en el eje (o en R₁): para cada término ρ₀ cₙ (r/R)ⁿ
          const Vin = (x) => {
            let v = new Ex(0);
            for (const [n, c] of g.pf.t) { const k = c / ((n + 2) * g.R ** n); v = v.add(new Ex((-k * (x ** (n + 2) - g.R1 ** (n + 2))) / (n + 2))); if (g.R1 > 0) v = v.add(Ex.ln(k * g.R1 ** (n + 2), x / g.R1)); }
            return v;
          };
          if (d <= g.R1) return new Ex(0);
          if (d <= g.R) return Vin(d);
          return Vin(g.R).add(Ex.ln(-this.lam(g, g.R) / (2 * PI), d / g.R));
        }
        if (d < 1e-9) return null;
        return Ex.ln(-1 / (2 * PI), d);
      },
      explainE(g, X) {
        const pv = this.perp(g, X), d = V3.norm(pv);
        const L = [`Distancia perpendicular al eje: <span class="vv">d</span> = ${F.vecNum(pv)}, &nbsp;d = ${F.num(d)}`];
        if (g.mode === 'sigma') {
          L.push(d < g.R ? `P está dentro del tubo (d &lt; R = ${F.num(g.R)}): el cilindro de Gauss no encierra carga, ${vecE()} = 0`
            : `P está fuera del tubo (d &gt; R = ${F.num(g.R)}). Gauss: λ = 2πRσ y ${vecE()} = ${F.frac('σ R', `${eps}d`)} û<sub>d</sub>`);
        } else if (g.mode === 'rho' && (g.pf !== PERFILES.uniforme || g.R1 > 0)) {
          const zona = d < g.R1 ? 'en el hueco' : d <= g.R ? 'dentro del cilindro' : 'fuera del cilindro';
          L.push(`ρ(r) = ${g.pf.txt}${g.R1 ? `, entre R<sub>1</sub> = ${F.num(g.R1)} y R = ${F.num(g.R)}` : ''}. P está ${zona} (d = ${F.num(d)}).`);
          L.push(`Gauss en un cilindro de radio d y altura h: ${vecE()} 2π d h = ${F.frac('h', eps)} ∫ ρ(r) 2π r dr ⇒ λ<sub>enc</sub> = ${F.num(this.lam(g, d) / PI)}π (por unidad de ρ<sub>0</sub>) y ${vecE()} = ${F.frac('λ<sub>enc</sub>', `2π${eps}d`)} û<sub>d</sub>`);
        } else if (g.mode === 'rho') {
          L.push(d <= g.R
            ? `P está dentro del cilindro (d ≤ R = ${F.num(g.R)}). Gauss: ${vecE()} = ${F.frac('ρ d', `2${eps}`)} û<sub>d</sub>`
            : `P está fuera del cilindro (d &gt; R = ${F.num(g.R)}). Gauss: ${vecE()} = ${F.frac('ρ R<sup>2</sup>', `2${eps}d`)} û<sub>d</sub>`);
        } else L.push(`${vecE()} = ${F.frac('λ', `2π${eps}d`)} û<sub>d</sub>`);
        return L;
      },
      explainV(g, A, B) {
        const dA = V3.norm(this.perp(g, A)), dB = V3.norm(this.perp(g, B));
        const ds = `d<sub>A</sub> = ${F.num(dA)}, d<sub>B</sub> = ${F.num(dB)}`;
        if (g.mode === 'sigma') return `V constante dentro del tubo y V<sub>B</sub> − V<sub>A</sub> = −${F.frac('σR', eps)} ln${F.frac('d<sub>B</sub>', 'd<sub>A</sub>')} fuera; ${ds}`;
        if (g.mode === 'rho') return `Integrando ${vecE()} de A a B (${g.pf === PERFILES.uniforme && !g.R1 ? `dentro: ${F.frac('ρd', `2${eps}`)}, fuera: ${F.frac('ρR<sup>2</sup>', `2${eps}d`)}` : `con ρ(r) = ${g.pf.txt}`}); ${ds}`;
        return `V<sub>B</sub> − V<sub>A</sub> = −${F.frac('λ', `2π${eps}`)} ln${F.frac('d<sub>B</sub>', 'd<sub>A</sub>')}, &nbsp; ${ds}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    plane: {
      label: 'Plano infinito', short: 'Plano', kind: 'sigma', prefix: 'σ', absV: false,
      fields: [
        { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['x', 'eje X (plano x = cte)'], ['y', 'eje Y (plano y = cte)'], ['z', 'eje Z (plano z = cte)']] },
        { k: 'at', t: 'expr', label: 'Posición (cte)' },
      ],
      defaults: () => ({ axis: 'x', at: '0', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ k: src.axis, i: AXI[src.axis], c: P(src.at) }),
      E(g, X) {
        const dn = X[g.i] - g.c;
        if (Math.abs(dn) < 1e-12) return null;
        return V3.sc(AX[g.k], Math.sign(dn) / 2);
      },
      V(g, X) { return new Ex(-Math.abs(X[g.i] - g.c) / 2); },
      explainE(g, X) {
        const dn = X[g.i] - g.c;
        return [`P está en ${g.k} = ${F.num(X[g.i])}, ${dn > 0 ? 'por encima' : 'por debajo'} del plano ${g.k} = ${F.num(g.c)}`,
          `${vecE()} = ${F.frac('σ', `2${eps}`)} (${uvAxis(g.k, Math.sign(dn))})`];
      },
      explainV(g, A, B) {
        return `V<sub>B</sub> − V<sub>A</sub> = −${F.frac('σ', `2${eps}`)}(|${g.k}<sub>B</sub> − ${F.num(g.c)}| − |${g.k}<sub>A</sub> − ${F.num(g.c)}|)`;
      },
      anchors: () => [],
    },

    slab: {
      label: 'Lámina gruesa', short: 'Lámina', kind: 'rho', prefix: 'ρ', absV: false,
      fields: [
        { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['x', 'eje X'], ['y', 'eje Y'], ['z', 'eje Z']] },
        { k: 'at', t: 'expr', label: 'Plano central' },
        { k: 'w', t: 'expr', label: 'Anchura' },
      ],
      defaults: () => ({ axis: 'x', at: '0', w: '2', s: { c: '1', sym: 'rho' } }),
      geom: (src, P) => ({ k: src.axis, i: AXI[src.axis], c: P(src.at), w: P(src.w) }),
      E(g, X) {
        const dn = X[g.i] - g.c;
        const m = Math.abs(dn) <= g.w / 2 ? dn : (Math.sign(dn) * g.w) / 2;
        return V3.sc(AX[g.k], m);
      },
      V(g, X) {
        const dn = Math.abs(X[g.i] - g.c);
        return new Ex(dn <= g.w / 2 ? -dn * dn / 2 : -(g.w / 2) * dn + (g.w * g.w) / 8);
      },
      explainE(g, X) {
        const dn = X[g.i] - g.c;
        const inside = Math.abs(dn) <= g.w / 2;
        return [`Distancia al plano central: ${g.k} − ${F.num(g.c)} = ${F.num(dn)} (semianchura ${F.num(g.w / 2)})`,
          inside ? `P está dentro: ${vecE()} = ${F.frac('ρ d', eps)} ${F.uv(g.k)} con d = ${F.num(dn)}`
            : `P está fuera: ${vecE()} = ${F.frac('ρ w', `2${eps}`)} (${uvAxis(g.k, Math.sign(dn))})`];
      },
      explainV(g, A, B) {
        return `Integrando ${vecE()} a lo largo de ${g.k} (dentro ${F.frac('ρd', eps)}, fuera ${F.frac('ρw', `2${eps}`)})`;
      },
      anchors: () => [],
    },

    sphere: {
      label: 'Esfera / corona', short: 'Esfera', kind: 'rho', prefix: 'ρ', absV: true,
      fields: [
        { k: 'pos', t: 'vec3', label: 'Centro' },
        { k: 'R1', t: 'expr', label: 'Radio interior (0 = maciza)' },
        { k: 'R2', t: 'expr', label: 'Radio exterior' },
        { k: 'perfil', t: 'select', label: 'Densidad', options: PERF_OPC },
      ],
      defaults: () => ({ pos: ['0', '0', '0'], R1: '0', R2: '1', perfil: 'uniforme', s: { c: '1', sym: 'rho' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R1: P(src.R1), R2: P(src.R2), pf: perfil(src) }),
      Q: (g, r) => 4 * PI * momento(g.pf, g.R2, g.R1, Math.min(Math.max(r, g.R1), g.R2), 3),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < 1e-12) return [0, 0, 0];
        return V3.sc(rv, this.Q(g, r) / (4 * PI * r ** 3));
      },
      V(g, X) {
        const r = Math.max(V3.norm(V3.sub(X, g.pos)), g.R1);
        const Qt = this.Q(g, g.R2);
        if (r >= g.R2) return new Ex(Qt / (4 * PI * r));
        // V(r) = V(R₂) + ∫_r^{R₂} Q(rʹ)/(4π rʹ²) drʹ, término a término
        const sum = g.pf.t.reduce((acc, [n, c]) => acc + (c / ((n + 3) * g.R2 ** n)) * ((g.R2 ** (n + 2) - r ** (n + 2)) / (n + 2) + (g.R1 > 0 ? g.R1 ** (n + 3) * (1 / g.R2 - 1 / r) : 0)), 0);
        return new Ex(Qt / (4 * PI * g.R2) + sum);
      },
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        const zone = r >= g.R2 ? 'exterior' : r >= g.R1 ? (g.R1 ? 'dentro de la corona' : 'interior') : 'hueco interior';
        return [`r = |P − C| = ${F.num(r)} → región: ${zone}`,
          g.pf === PERFILES.uniforme ? `Gauss: ${vecE()} = ${F.frac('Q<sub>enc</sub>(r)', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, &nbsp;Q<sub>enc</sub> = ρ·${F.frac('4π', '3')}(r<sub>c</sub><sup>3</sup> − R<sub>1</sub><sup>3</sup>) = ${F.num(this.Q(g, r) / PI)}π ρ`
            : `Densidad no uniforme ρ(r) = ${g.pf.txt.replace(/R/g, 'R<sub>2</sub>')}. Gauss: ${vecE()} = ${F.frac('Q<sub>enc</sub>(r)', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, &nbsp;Q<sub>enc</sub> = ∫ ρ(rʹ) 4π rʹ<sup>2</sup> drʹ = ${F.num(this.Q(g, r) / PI)}π ρ<sub>0</sub>`];
      },
      explainV(g, A, B) {
        return `V(r) por Gauss (V(∞) = 0), &nbsp; r<sub>A</sub> = ${F.num(V3.norm(V3.sub(A, g.pos)))}, r<sub>B</sub> = ${F.num(V3.norm(V3.sub(B, g.pos)))}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    shell: {
      label: 'Esfera hueca (σ)', short: 'Cascarón', kind: 'sigma', prefix: 'σ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], R: '1', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R: P(src.R) }),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R - 1e-12) return [0, 0, 0];
        return V3.sc(rv, (g.R * g.R) / r ** 3);
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(r >= g.R ? (g.R * g.R) / r : g.R); },
      Qtot: (g) => 4 * PI * g.R * g.R,
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`r = |P − C| = ${F.num(r)}, R = ${F.num(g.R)} → ${r < g.R ? 'dentro' : 'fuera'}`,
          r < g.R ? `Gauss: no hay carga encerrada → ${vecE()} = 0` : `Gauss: ${vecE()} = ${F.frac('σR<sup>2</sup>', `${eps}r<sup>2</sup>`)} û<sub>r</sub> &nbsp;(Q = 4πR²σ)`];
      },
      explainV() { return `V = ${F.frac('σR<sup>2</sup>', `${eps}r`)} fuera, V = ${F.frac('σR', eps)} dentro (constante)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    conductor: {
      label: 'Esfera conductora (Q)', short: 'Conductor', kind: 'q', prefix: 'Q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], R: '1', s: { c: '1', sym: 'q' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R: P(src.R) }),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R - 1e-12) return [0, 0, 0];
        return V3.sc(rv, 1 / (4 * PI * r ** 3));
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(1 / (4 * PI * Math.max(r, g.R))); },
      Qtot: () => 1,
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`Conductor en equilibrio: la carga se reparte por la superficie y el interior es equipotencial.`,
          r < g.R ? `r = ${F.num(r)} &lt; R → ${vecE()} = 0` : `r = ${F.num(r)} ≥ R → ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>`];
      },
      explainV() { return `V = ${F.frac('Q', `4π${eps}r`)} fuera; V = ${F.frac('Q', `4π${eps}R`)} en todo el conductor`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    ring: {
      label: 'Anillo (λ)', short: 'Anillo', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Eje del anillo', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', s: { c: '1', sym: 'lambda' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), n: AX[src.axis], axis: src.axis, R: P(src.R) }),
      Qtot: (g) => 2 * PI * g.R,
      E(g, X) { const r = ringAt(g.R, 2 * PI * g.R, g, X); return r && r.E; },
      V(g, X) { const r = ringAt(g.R, 2 * PI * g.R, g, X); return r && new Ex(r.V); },
      explainE(g, X) {
        const { z, rho } = local(g, X);
        return rho < 1e-9 ? [`P está sobre el eje, a z = ${F.num(z)} del centro`, `${vecE()} = ${F.frac('λR z', `2${eps}(z<sup>2</sup> + R<sup>2</sup>)<sup>3/2</sup>`)} n̂`]
          : [`P está fuera del eje (ρ = ${F.num(rho)}, z = ${F.num(z)}): el campo se obtiene con integrales elípticas K(m), E(m) (resultado numérico).`];
      },
      explainV() { return `En el eje: V = ${F.frac('λR', `2${eps}√(z<sup>2</sup> + R<sup>2</sup>)`)}`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    disk: {
      label: 'Disco (σ)', short: 'Disco', kind: 'sigma', prefix: 'σ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Eje del disco', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), n: AX[src.axis], axis: src.axis, R: P(src.R) }),
      Qtot: (g) => PI * g.R * g.R,
      E(g, X) { const r = diskAt(g, X, true); return r && r.E; },
      V(g, X) { const r = diskAt(g, X, false); return r && new Ex(r.V); },
      explainE(g, X) {
        const { z, rho } = local(g, X);
        return rho < 1e-9 ? [`P está sobre el eje, a z = ${F.num(z)} del centro`, `${vecE()} = ${F.frac('σ', `2${eps}`)}(1 − ${F.frac('|z|', '√(z<sup>2</sup> + R<sup>2</sup>)')}) (±n̂)`]
          : [`P está fuera del eje (ρ = ${F.num(rho)}, z = ${F.num(z)}): se suman anillos de radio r′ (integración numérica).`];
      },
      explainV() { return `En el eje: V = ${F.frac('σ', `2${eps}`)}(√(z<sup>2</sup> + R<sup>2</sup>) − |z|)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    rod: {
      label: 'Varilla finita', short: 'Varilla', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'A', t: 'vec3', label: 'Extremo 1' }, { k: 'B', t: 'vec3', label: 'Extremo 2' }, { k: 'perfil', t: 'select', label: 'Densidad', options: [['uniforme', 'uniforme λ'], ['lineal', 'λ₀·s/L (0 en el extremo 1)'], ['resta', 'λ₀·(1 − s/L)']] }],
      defaults: () => ({ A: ['0', '0', '0'], B: ['0', '1', '0'], perfil: 'uniforme', s: { c: '1', sym: 'lambda' } }),
      geom(src, P) {
        const A = src.A.map(P), B = src.B.map(P), L = V3.norm(V3.sub(B, A)), perfil = ['lineal', 'resta'].includes(src.perfil) ? src.perfil : 'uniforme';
        return { A, B, L, u: V3.unit(V3.sub(B, A)), perfil };
      },
      Qtot: (g) => (g.perfil === 'uniforme' ? g.L : g.L / 2),
      // densidad no uniforme: se integra a lo largo de la varilla
      noUni(g, X) {
        const lam = g.perfil === 'lineal' ? (t) => t / g.L : (t) => 1 - t / g.L;
        return curva({ p: (t) => V3.add(g.A, V3.sc(g.u, t)), ds: () => 1 }, lam, 0, g.L, X);
      },
      loc(g, X) {
        const w = V3.sub(X, g.A), s = V3.dot(w, g.u), pv = V3.sub(w, V3.sc(g.u, s));
        return { s, pv, d: V3.norm(pv), rA: V3.norm(w), rB: V3.norm(V3.sub(X, g.B)) };
      },
      E(g, X) {
        const { s, pv, d, rA, rB } = this.loc(g, X);
        if (rA < 1e-9 || rB < 1e-9 || (d < 1e-9 && s >= 0 && s <= g.L)) return null;
        if (g.perfil !== 'uniforme') { const c = this.noUni(g, X); return c && c.E; }
        let E = V3.sc(g.u, 1 / rB - 1 / rA);
        if (d > 1e-12) E = V3.add(E, V3.sc(pv, (s / rA - (s - g.L) / rB) / (d * d)));
        return V3.sc(E, 1 / (4 * PI));
      },
      V(g, X) {
        const { s, d, rA, rB } = this.loc(g, X);
        if (d < 1e-9 && s >= 0 && s <= g.L) return null;
        if (g.perfil !== 'uniforme') { const c = this.noUni(g, X); return c && new Ex(c.V); }
        let n = rA + s, m = rB + s - g.L;
        if (n < 1e-9 || m < 1e-9) { n = rB - s + g.L; m = rA - s; }
        return Ex.ln(1 / (4 * PI), n / m);
      },
      explainE(g, X) {
        if (g.perfil !== 'uniforme') return [`Densidad no uniforme λ(s) = ${g.perfil === 'lineal' ? 'λ<sub>0</sub> s/L' : 'λ<sub>0</sub>(1 − s/L)'}, con s medido desde el extremo 1 (L = ${F.num(g.L)}).`, `d<span class="vv">E</span> = ${F.frac('λ(s) ds', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>: se integra a lo largo de la varilla (con λ(s) lineal, cada componente es una integral elemental; aquí se hace numéricamente).`];
        
        const { s, d, rA, rB } = this.loc(g, X);
        return [`Longitud L = ${F.num(g.L)}; proyección de P sobre la varilla s = ${F.num(s)}, distancia d = ${F.num(d)}, r<sub>1</sub> = ${F.num(rA)}, r<sub>2</sub> = ${F.num(rB)}`,
          `Integrando d<span class="vv">E</span> = ${F.frac('λ dl', `4π${eps}r<sup>2</sup>`)}: E<sub>∥</sub> = ${F.frac('λ', `4π${eps}`)}(${F.frac(1, 'r<sub>2</sub>')} − ${F.frac(1, 'r<sub>1</sub>')}), E<sub>⊥</sub> = ${F.frac('λ', `4π${eps}d`)}(${F.frac('s', 'r<sub>1</sub>')} − ${F.frac('s − L', 'r<sub>2</sub>')})`];
      },
      explainV(g) { return g.perfil !== 'uniforme' ? `V = ∫ ${F.frac('λ(s) ds', `4π${eps}r`)} con λ(s) = ${g.perfil === 'lineal' ? 'λ<sub>0</sub> s/L' : 'λ<sub>0</sub>(1 − s/L)'} (integral numérica)` : `V = ${F.frac('λ', `4π${eps}`)} ln${F.frac('r<sub>1</sub> + s', 'r<sub>2</sub> + s − L')}`; },
      anchors: (src, g) => [{ path: ['A'], at: g.A }, { path: ['B'], at: g.B }],
    },

    arc: {
      label: 'Arco (λ)', short: 'Arco', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['z', 'eje Z (en el plano XY)'], ['y', 'eje Y (en el plano ZX)'], ['x', 'eje X (en el plano YZ)']] }, { k: 'R', t: 'expr', label: 'Radio R' }, { k: 't1', t: 'expr', label: 'Desde el ángulo (°)' }, { k: 't2', t: 'expr', label: 'Hasta el ángulo (°)' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', t1: '0', t2: '180', s: { c: '1', sym: 'lambda' } }),
      geom(src, P) {
        const base = { z: [[1, 0, 0], [0, 1, 0]], y: [[0, 0, 1], [1, 0, 0]], x: [[0, 1, 0], [0, 0, 1]] }[src.axis] || [[1, 0, 0], [0, 1, 0]];
        const t1 = (+String(src.t1).replace(',', '.') * PI) / 180, t2 = (+String(src.t2).replace(',', '.') * PI) / 180;
        if (!isFinite(t1) || !isFinite(t2) || Math.abs(t2 - t1) < 1e-9) throw new Error('los ángulos del arco deben ser números distintos');
        return { pos: src.pos.map(P), axis: src.axis, n: AX[src.axis], e1: base[0], e2: base[1], R: P(src.R), t1: Math.min(t1, t2), t2: Math.max(t1, t2) };
      },
      Qtot: (g) => g.R * (g.t2 - g.t1),
      at(g, X) { return curva({ p: (t) => V3.add(g.pos, V3.add(V3.sc(g.e1, g.R * Math.cos(t)), V3.sc(g.e2, g.R * Math.sin(t)))), ds: () => g.R }, () => 1, g.t1, g.t2, X); },
      E(g, X) { const c = this.at(g, X); return c && c.E; },
      V(g, X) { const c = this.at(g, X); return c && new Ex(c.V); },
      explainE(g, X) {
        const dc = V3.norm(V3.sub(X, g.pos)), ang = F.num(((g.t2 - g.t1) * 180) / PI);
        return dc < 1e-9 ? [`Arco de radio R = ${F.num(g.R)} y ${ang}°; P está en el centro: todos los dl están a la misma distancia R.`, `d<span class="vv">E</span> = ${F.frac('λ R dθ', `4π${eps}R<sup>2</sup>`)}(−û<sub>r</sub>) ⇒ ${vecE()} = ${F.frac('λ', `4π${eps}R`)} ∫(−cos θ, −sen θ) dθ entre ${F.num((g.t1 * 180) / PI)}° y ${F.num((g.t2 * 180) / PI)}°`]
          : [`Arco de radio R = ${F.num(g.R)} y ${ang}°: se suman las contribuciones d<span class="vv">E</span> = ${F.frac('λ dl', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub> a lo largo del arco (integral numérica).`];
      },
      explainV(g) { return `V = ∫ ${F.frac('λ dl', `4π${eps}r`)}; en el centro, V = ${F.frac('λ θ', `4π${eps}`)} con θ = ${F.num(g.t2 - g.t1)} rad`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    hollow: {
      label: 'Corteza conductora (R₁–R₂)', short: 'Corteza', kind: 'q', prefix: 'Q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R1', t: 'expr', label: 'Radio interior R₁' }, { k: 'R2', t: 'expr', label: 'Radio exterior R₂' }],
      defaults: () => ({ pos: ['0', '0', '0'], R1: '1', R2: '2', s: { c: '1', sym: 'q' } }),
      geom(src, P) { const g = { pos: src.pos.map(P), R1: P(src.R1), R2: P(src.R2) }; if (!(g.R2 > g.R1 && g.R1 > 0)) throw new Error('debe ser 0 < R₁ < R₂'); return g; },
      Qtot: () => 1,
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R2 - 1e-12) return [0, 0, 0];
        return V3.sc(rv, 1 / (4 * PI * r ** 3));
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(1 / (4 * PI * Math.max(r, g.R2))); },
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`Corteza conductora en equilibrio: su carga neta Q va a la cara exterior (R<sub>2</sub> = ${F.num(g.R2)}); en la interior (R<sub>1</sub> = ${F.num(g.R1)}) solo aparece la carga inducida por lo que haya en el hueco.`,
          r < g.R2 ? `r = ${F.num(r)} &lt; R<sub>2</sub> → la carga neta de la cara exterior no crea campo dentro` : `r = ${F.num(r)} ≥ R<sub>2</sub> → ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>`];
      },
      explainV() { return `V = ${F.frac('Q', `4π${eps}r`)} fuera; V = ${F.frac('Q', `4π${eps}R<sub>2</sub>`)} en el conductor y en el hueco (por su carga neta)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    dipole: {
      label: 'Dipolo (fuente)', short: 'Dipolo', kind: 'p', prefix: 'p', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Posición' }, { k: 'p', t: 'vec3', label: 'Dirección de p (× símbolo)' }],
      defaults: () => ({ pos: ['0', '0', '0'], p: ['1', '0', '0'], s: { c: '1', sym: 'p' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), p: src.p.map(P) }),
      E(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        if (n < 1e-9) return null;
        const u = V3.sc(r, 1 / n);
        return V3.sc(V3.sub(V3.sc(u, 3 * V3.dot(g.p, u)), g.p), 1 / (4 * PI * n ** 3));
      },
      V(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        return n < 1e-9 ? null : new Ex(V3.dot(g.p, r) / (4 * PI * n ** 3));
      },
      explainE(g, X) {
        const r = V3.sub(X, g.pos);
        return [`<span class="vv">p</span> ∝ ${F.vecNum(g.p)}; <span class="vv">r</span> = ${F.vecNum(r)}, |<span class="vv">r</span>| = ${F.num(V3.norm(r))}`,
          `${vecE()} = ${F.frac(`3(<span class="vv">p</span>·û<sub>r</sub>)û<sub>r</sub> − <span class="vv">p</span>`, `4π${eps}r<sup>3</sup>`)}`];
      },
      explainV() { return `V = ${F.frac('<span class="vv">p</span>·<span class="vv">r</span>', `4π${eps}r<sup>3</sup>`)}`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },
  };

  /* --------- geometría local para anillos y discos --------- */
  function local(g, X) {
    const w = V3.sub(X, g.pos), z = V3.dot(w, g.n), pv = V3.sub(w, V3.sc(g.n, z)), rho = V3.norm(pv);
    return { z, rho, er: rho > 0 ? V3.sc(pv, 1 / rho) : [0, 0, 0] };
  }
  // anillo de radio R y carga Q (ε₀ = 1): campo y potencial en X
  function ringRZ(R, Q, rho, z) {
    if (rho < 1e-9 * Math.max(R, 1)) {
      const s = z * z + R * R;
      return { Er: 0, Ez: (Q * z) / (4 * PI * s ** 1.5), V: Q / (4 * PI * Math.sqrt(s)) };
    }
    const s2 = (R + rho) ** 2 + z * z, d2 = (R - rho) ** 2 + z * z;
    if (d2 < 1e-18) return null;
    const m = (4 * R * rho) / s2;
    const [K, E] = Engine.ellipKE(m);
    const pre = (Q / (4 * PI)) * (2 / PI) / Math.sqrt(s2);
    return { V: pre * K, Ez: (pre * z * E) / d2, Er: (pre / (2 * rho)) * (((rho * rho - R * R - z * z) / d2) * E + K) };
  }
  function ringAt(R, Q, g, X) {
    const { z, rho, er } = local(g, X);
    const r = ringRZ(R, Q, rho, z);
    if (!r) return null;
    return { E: V3.add(V3.sc(g.n, r.Ez), V3.sc(er, r.Er)), V: r.V };
  }
  function diskAt(g, X, needE) {
    const { z, rho, er } = local(g, X), R = g.R;
    if (rho < 1e-9) {
      const s = Math.sqrt(z * z + R * R);
      if (Math.abs(z) < 1e-12 && needE) return null;
      return { E: V3.sc(g.n, (Math.sign(z) * (1 - Math.abs(z) / s)) / 2), V: (s - Math.abs(z)) / 2 };
    }
    if (Math.abs(z) < 1e-12 && rho < R && needE) return null;
    const { x, w } = Engine.gl(24);
    const segs = rho < R ? [[0, rho], [rho, R]] : [[0, R]];
    let Er = 0, Ez = 0, V = 0;
    for (const [a, b] of segs) for (let i = 0; i < x.length; i++) {
      const r = (a + b) / 2 + ((b - a) / 2) * x[i], wt = ((b - a) / 2) * w[i];
      const q = ringRZ(r, 2 * PI * r, rho, z);
      if (!q) continue;
      Er += q.Er * wt; Ez += q.Ez * wt; V += q.V * wt;
    }
    return { E: V3.add(V3.sc(g.n, Ez), V3.sc(er, Er)), V };
  }

  /* --------------------------- CONTEXTO --------------------------- */
  function build(scen) {
    const mode = scen.mode === 'si' ? 'si' : 'sym';
    const unit = mode === 'si' ? 'm' : scen.unit || 'a';
    normUnknown(scen);
    const P = (s) => parseExpr(s, unit);
    const errors = [];
    const kinds = {};
    const anyFree = scen.analyses.some((an) => an.unk === 'libre');
    const sources = scen.sources.map((src) => {
      const def = SOURCES[src.type];
      const o = { id: src.id, src, def, name: src.name || def.prefix, kind: def.kindOf ? def.kindOf(src) : def.kind };
      try { o.g = def.geom(src, P); } catch (e) { errors.push(`${o.name}: ${e.message}`); }
      const isUnknown = !!scen.unknown?.srcs?.includes(src.id);
      if (!isUnknown) {
        try { o.S = Poly.sym(src.s.sym, P(src.s.c)); if (!(src.s.sym in kinds)) kinds[src.s.sym] = o.kind; }
        catch (e) { errors.push(`${o.name}: ${e.message}`); }
      } else {
        o.unknown = true;
        // valor como símbolo, para las preguntas que no usan la incógnita despejada
        if (anyFree && src.s?.sym) { try { o.Sfree = Poly.sym(src.s.sym, P(src.s.c || '1')); if (!(src.s.sym in kinds)) kinds[src.s.sym] = o.kind; } catch (e) { /* sin valor simbólico */ } }
      }
      return o;
    });
    // fuentes dentro del hueco de una corteza conductora: su carga se induce en las caras
    for (const h of sources.filter((o) => o.src.type === 'hollow' && o.g)) {
      for (const o of sources) {
        if (o === h || !o.g || !o.g.pos) continue;
        const t = o.src.type, dc = V3.norm(V3.sub(o.g.pos, h.g.pos)), Rs = t === 'sphere' ? o.g.R2 : t === 'point' ? 0 : o.g.R;
        if (!['point', 'sphere', 'shell', 'conductor'].includes(t) || !(dc + Rs < h.g.R1 + 1e-9)) continue;
        if (dc > 1e-9) { errors.push(`${o.name}: dentro de la corteza ${h.name} solo se resuelven cargas centradas (la carga inducida no sería uniforme)`); continue; }
        const Q = t === 'point' ? 1 : t === 'sphere' ? o.def.Q(o.g, o.g.R2) : o.def.Qtot(o.g);
        o.def = conInduccion(o.def, { pos: h.g.pos, R1: h.g.R1, R2: h.g.R2, Q });
        o.inducida = h;
      }
    }
    for (const an of scen.analyses) {
      if (an.Q?.sym && !(an.Q.sym in kinds)) kinds[an.Q.sym] = 'q';
      if (an.sym && !(an.sym in kinds)) kinds[an.sym] = 'p';
    }
    for (const uc of scen.unknown?.conds || []) if (uc.val?.sym && !(uc.val.sym in kinds)) kinds[uc.val.sym] = 'q';
    for (const k in scen.kinds || {}) if (k in kinds) kinds[k] = scen.kinds[k];
    for (const s of sources) if (s.unknown) kinds['§' + s.name] = s.kind;
    delete kinds[''];
    const ctx = { unit, mode, P, sources, kinds, errors, order: scen.order || [] };
    F.setContext(kinds, unit, mode, ctx.order);
    return ctx;
  }
  const nameHTML = (s) => F.sym(s.name);
  const strengthHTML = (s) => (s.S ? F.poly(s.S, s.kind) : '?');
  const headHTML = (s) => { const v = strengthHTML(s), n = nameHTML(s); return v === n ? n : `${n} = ${v}`; };

  function field(ctx, X) {
    let E = VP.zero();
    const parts = [], singular = [];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.E(s.g, X);
      if (!e) { singular.push(s); continue; }
      const Ep = VP.fromNum(s.S, e);
      E = VP.add(E, Ep);
      parts.push({ s, e, Ep });
    }
    return { E, parts, singular };
  }
  function potential(ctx, X) {
    let V = Poly.zero();
    const parts = [], singular = [];
    let absolute = true;
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      if (!s.def.absV) absolute = false;
      const v = s.def.V(s.g, X);
      if (!v) { singular.push(s); continue; }
      const Vp = s.S.scale(v);
      V = V.add(Vp);
      parts.push({ s, v, Vp });
    }
    return { V, parts, singular, absolute };
  }
  function diffV(ctx, A, B) {
    const a = potential(ctx, A), b = potential(ctx, B);
    const parts = [];
    for (const pb of b.parts) {
      const pa = a.parts.find((p) => p.s === pb.s);
      if (pa) parts.push({ s: pb.s, dV: pb.Vp.sub(pa.Vp) });
    }
    return { dV: b.V.sub(a.V), parts, singular: [...a.singular, ...b.singular] };
  }
  // valores numéricos (todos los símbolos = 1) para el dibujo
  function fieldNum(ctx, X) {
    let E = [0, 0, 0];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.E(s.g, X);
      if (!e) return null;
      E = V3.add(E, V3.sc(e, s.Snum ?? (s.Snum = s.S.value())));
    }
    return E;
  }
  function potNum(ctx, X) {
    let v = 0;
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.V(s.g, X);
      if (!e) return NaN;
      v += e.value() * (s.Snum ?? (s.Snum = s.S.value()));
    }
    return v;
  }

  function singularWarn(list) {
    return list.length ? `<div class="warn">El punto está sobre ${list.map(nameHTML).join(', ')}: ahí el campo no está definido y se ha omitido esa contribución.</div>` : '';
  }
  function fieldSteps(ctx, X, F0) {
    const rows = F0.parts.map(({ s, Ep }) => `<li><div class="st-h">${headHTML(s)} <span class="tag">${s.def.label}</span></div>
      ${s.def.explainE(s.g, X, s.name).map((l) => `<div>${l}</div>`).join('')}
      <div class="st-r">${vecE(s.name.replace(/\D/g, '') || '')} = ${F.vec(Ep, 'E')}</div></li>`);
    return `<p>Principio de superposición: ${vecE()}(P) = Σ ${vecE('i')}, con P = ${F.pt(X)}·${F.esc(ctx.unit)}.</p><ol class="steps">${rows.join('')}</ol>
      <div class="st-r">Suma: ${vecE()}(P) = ${F.vec(F0.E, 'E')}</div>`;
  }

  /* --------------------------- INCÓGNITA --------------------------- */
  const CONDS = {
    Ecomp: { label: 'Una componente de E es nula en P', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'comp', t: 'select', label: 'Componente nula', options: [['x', 'E_x = 0'], ['y', 'E_y = 0'], ['z', 'E_z = 0']] }] },
    Epar: { label: 'E en P paralelo a una dirección (dipolo en equilibrio, fuerza paralela…)', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'd', t: 'vec3', label: 'Dirección' }] },
    Ezero: { label: 'E = 0 en P (campo nulo)', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }] },
    dV: { label: 'V_B − V_A tiene un valor dado', fields: [{ k: 'A', t: 'vec3', label: 'Punto A' }, { k: 'B', t: 'vec3', label: 'Punto B' }, { k: 'val', t: 'value', label: 'V_B − V_A =' }] },
    V: { label: 'V en P tiene un valor dado', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'val', t: 'value', label: 'V(P) =' }] },
  };
  // admite el formato antiguo {src, cond} y el nuevo {srcs: [...], conds: [...]}
  function normUnknown(scen) {
    const u = scen.unknown;
    if (!u) return null;
    if (u.src !== undefined && !u.srcs) { scen.unknown = { srcs: u.src ? [u.src] : [], conds: u.cond ? [u.cond] : [] }; }
    scen.unknown.srcs ||= []; scen.unknown.conds ||= [];
    return scen.unknown;
  }
  function solveUnknowns(ctx, scen) {
    const u = scen.unknown;
    if (!u || !u.srcs?.length) return null;
    const us = u.srcs.map((id) => ctx.sources.find((x) => x.id === id)).filter(Boolean);
    if (!us.length) return null;
    if (us.some((s) => !s.g)) return { error: 'Alguna fuente incógnita no está bien definida.' };
    if (!u.conds.length) return { error: 'Añade al menos una condición para despejar la incógnita.' };
    const P = ctx.P;
    const xP = (j, b) => Poly.sym('§' + us[j].name, b);
    const sumX = (bs) => bs.reduce((acc, b, j) => acc.add(xP(j, 1).scale(b)), Poly.zero());
    const rows = []; // { A: Poly, b: [Ex|number], t: Poly }
    const eqs = [];
    try {
      for (const c of u.conds) {
        if (c.type === 'Ecomp' || c.type === 'Ezero' || c.type === 'Epar') {
          const X = c.P.map(P);
          const F0 = field(ctx, X);
          const bs = us.map((s) => s.def.E(s.g, X));
          if (bs.some((b) => !b)) return { error: 'Un punto de condición está sobre una fuente incógnita.' };
          const Ex3 = [0, 1, 2].map((k) => F0.E[k].add(sumX(bs.map((b) => b[k]))));
          const tot = `${vecE()}(${F.pt(X)}) = ${F.vec(Ex3, 'E')}`;
          if (c.type === 'Ecomp') {
            const k = AXI[c.comp];
            rows.push({ A: F0.E[k], b: bs.map((b) => b[k]), t: Poly.zero() });
            eqs.push(`${tot}<br>E<sub>${c.comp}</sub> = 0: ${F.poly(Ex3[k], 'E')} = 0`);
          } else if (c.type === 'Ezero') {
            for (let k = 0; k < 3; k++) rows.push({ A: F0.E[k], b: bs.map((b) => b[k]), t: Poly.zero() });
            eqs.push(`${tot} = <span class="vv">0</span>`);
          } else {
            const d = V3.unit(c.d.map(P)), dv = d.map((v) => Poly.num(v));
            const A = VP.cross(dv, F0.E), bb = bs.map((b) => V3.cross(d, b));
            for (let k = 0; k < 3; k++) rows.push({ A: A[k], b: bb.map((b) => b[k]), t: Poly.zero() });
            const lhs = [0, 1, 2].map((k) => A[k].add(sumX(bb.map((b) => b[k]))));
            eqs.push(`${tot}<br>Paralelo a ${F.vecNum(c.d.map(P))} ⇔ û × ${vecE()} = <span class="vv">0</span>: ${F.vec(lhs, 'E')} = <span class="vv">0</span>`);
          }
        } else {
          const val = c.val?.sym ? Poly.sym(c.val.sym, P(c.val.c || '0')) : Poly.num(P(c.val?.c || '0'));
          if (c.type === 'dV') {
            const Av = c.A.map(P), Bv = c.B.map(P);
            const A = diffV(ctx, Av, Bv).dV;
            const bs = us.map((s) => { const vb = s.def.V(s.g, Bv), va = s.def.V(s.g, Av); return vb && va ? vb.sub(va) : null; });
            if (bs.some((b) => !b)) return { error: 'A o B están sobre una fuente incógnita.' };
            rows.push({ A, b: bs, t: val });
            eqs.push(`V<sub>B</sub> − V<sub>A</sub> = ${F.poly(A.add(sumX(bs)), 'V')} = ${F.poly(val, 'V')}`);
          } else {
            const X = c.P.map(P);
            const pot = potential(ctx, X);
            if (!pot.absolute || us.some((s) => !s.def.absV)) return { error: 'Hay hilos o planos infinitos: el potencial absoluto no está definido. Usa la condición V_B − V_A.' };
            const bs = us.map((s) => s.def.V(s.g, X));
            if (bs.some((b) => !b)) return { error: 'El punto está sobre una fuente incógnita.' };
            rows.push({ A: pot.V, b: bs, t: val });
            eqs.push(`V(${F.pt(X)}) = ${F.poly(pot.V.add(sumX(bs)), 'V')} = ${F.poly(val, 'V')}`);
          }
        }
      }
    } catch (e) { return { error: e.message }; }
    const n = us.length;
    const bnum = (b) => (b instanceof Ex ? b.value() : b);
    const live = rows.filter((r) => r.b.some((b) => Math.abs(bnum(b)) > 1e-13));
    const rhs = live.map((r) => r.t.sub(r.A));
    const out = new Array(n);
    let xHTML = null, check = '';
    // caso de una incógnita y una ecuación con logaritmo: forma exacta (…)/ln β
    if (n === 1 && live.length === 1 && live[0].b[0] instanceof Ex && live[0].b[0].L.length) {
      const b = live[0].b[0];
      if (Math.abs(b.a) < 1e-14 && b.L.length === 1) {
        let { al, be } = b.L[0];
        if (be < 1) { al = -al; be = 1 / be; }
        const xp = rhs[0].scale(1 / al);
        out[0] = xp.scale(1 / Math.log(be));
        xHTML = [F.frac(F.poly(xp, us[0].kind), 'ln ' + F.num(be))];
        // relación entre símbolos, como la dan los solucionarios: σ/λ = −3 ln 2/(2πb)
        const ks = xp.keys(), Y = ks.length === 1 && ks[0] && !ks[0].includes('*') ? ks[0] : null;
        if (Y && ctx.kinds[Y]) {
          const inv = 1 / xp.coef(Y).value(), n = KINDS[ctx.kinds[Y]].m - KINDS[us[0].kind].m;
          for (const piDen of [true, false]) {
            const id = Engine.identify(inv * (piDen ? PI : 1), false);
            if (!id || id.r !== 1) continue;
            const top = `${id.n !== 1 ? id.n + ' ' : ''}ln ${F.num(be)}`;
            const den = `${id.d !== 1 ? id.d : ''}${piDen ? 'π' : ''}${n > 0 ? F.unitPow(n) : ''}`;
            const ratio = `${F.sym(Y)}/${nameHTML(us[0])} = ${id.s < 0 ? F.MINUS : ''}${F.frac(top, den || '')}${n < 0 ? F.unitPow(-n) : ''}`;
            xHTML[0] += ` &nbsp;⇔&nbsp; ${ratio}`;
            break;
          }
        }
      }
    }
    if (!out[0]) {
      if (live.length < n) return { error: `Hay ${n} incógnitas pero solo ${live.length} ecuación(es) útiles: añade condiciones.` };
      const B = live.map((r) => r.b.map((b) => (b instanceof Ex && !b.L.length ? b.a : bnum(b))));
      const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => B.reduce((s, row) => s + row[i] * row[j], 0)));
      const Mi = invert(M);
      if (!Mi) return { error: 'Las condiciones no son independientes: no bastan para determinar las incógnitas.' };
      for (let j = 0; j < n; j++) {
        let x = Poly.zero();
        live.forEach((row, i) => {
          let c = 0;
          for (let k = 0; k < n; k++) c += Mi[j][k] * B[i][k];
          if (Math.abs(c) > 1e-15) x = x.add(rhs[i].scale(c));
        });
        out[j] = x;
      }
      const res = live.reduce((s, r, i) => s + (r.A.value() + B[i].reduce((a, b, j) => a + b * out[j].value(), 0) - r.t.value()) ** 2, 0);
      const scale = live.reduce((s, r) => s + r.A.value() ** 2 + r.t.value() ** 2, 0) + 1e-30;
      if (res > 1e-10 * scale) check = `<div class="warn">Las condiciones no se pueden cumplir todas a la vez; se muestra la solución que mejor se aproxima (mínimos cuadrados).</div>`;
    }
    us.forEach((s, j) => { s.S = out[j]; s.unknownSolved = true; });
    const lines = us.map((s, j) => `${nameHTML(s)} = ${xHTML?.[j] || F.poly(out[j], s.kind)}`);
    return {
      html: lines.join('<br>'),
      steps: `<p>Incógnitas: ${us.map(nameHTML).join(', ')}. Cada condición da una o varias ecuaciones lineales en ellas:</p>${eqs.map((e) => `<div class="eq">${e}</div>`).join('')}${check}<div class="st-r">⇒ ${lines.join(', &nbsp;')}</div>`,
      answers: us.map((s, j) => ({ label: s.name, qty: s.kind, val: out[j] })),
    };
  }
  function invert(M) {
    const n = M.length, A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      const mx = Math.max(...M.map((r) => Math.max(...r.map(Math.abs))));
      if (Math.abs(A[p][c]) < 1e-12 * (mx || 1)) return null;
      [A[c], A[p]] = [A[p], A[c]];
      const d = A[c][c];
      for (let k = 0; k < 2 * n; k++) A[c][k] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r) => r.slice(n));
  }

  /* --------- Gauss: carga encerrada exacta cuando es fácil --------- */
  function insideSurf(surf, X, tol = 1e-9) {
    const w = V3.sub(X, surf.C);
    if (surf.shape === 'sphere') { const r = V3.norm(w); return r < surf.R - tol ? 1 : r > surf.R + tol ? 0 : 0.5; }
    const z = V3.dot(w, surf.n), rho = V3.norm(V3.sub(w, V3.sc(surf.n, z)));
    if (rho > surf.R + tol || Math.abs(z) > surf.h / 2 + tol) return 0;
    if (rho < surf.R - tol && Math.abs(z) < surf.h / 2 - tol) return 1;
    return null;
  }
  function qencExact(s, surf) {
    const g = s.g, t = s.src.type;
    if (s.inducida) return null;
    if (t === 'hollow') {
      if (surf.shape !== 'sphere') return null;
      const dc = V3.norm(V3.sub(g.pos, surf.C));
      return dc + g.R2 < surf.R - 1e-9 ? new Ex(1) : dc > surf.R + g.R2 + 1e-9 ? new Ex(0) : dc < 1e-12 && surf.R < g.R2 ? new Ex(0) : null;
    }
    if (t === 'point') { const k = insideSurf(surf, g.pos); return k === null ? null : new Ex(k); }
    if (t === 'dipole') return insideSurf(surf, g.pos) !== null ? new Ex(0) : null;
    if (['sphere', 'shell', 'conductor', 'ring', 'disk'].includes(t)) {
      const Rs = t === 'sphere' ? g.R2 : g.R;
      const Qt = t === 'sphere' ? s.def.Q(g, g.R2) : s.def.Qtot(g);
      if (surf.shape === 'sphere') {
        const dc = V3.norm(V3.sub(g.pos, surf.C));
        if (dc + Rs < surf.R - 1e-9) return new Ex(Qt);
        if (dc > surf.R + Rs + 1e-9) return new Ex(0);
        if (t === 'sphere' && dc < 1e-12) return new Ex(s.def.Q(g, surf.R));
      }
      return null;
    }
    if (t === 'arc') return null;
    if (t === 'line' && g.mode === 'lambda') {
      const w = V3.sub(surf.C, g.pos), dpar = V3.dot(w, g.u), dist = V3.norm(V3.sub(w, V3.sc(g.u, dpar)));
      if (surf.shape === 'sphere') return new Ex(dist < surf.R ? 2 * Math.sqrt(surf.R ** 2 - dist ** 2) : 0);
      if (Math.abs(Math.abs(V3.dot(g.u, surf.n)) - 1) < 1e-12) return new Ex(dist < surf.R ? surf.h : 0);
      return null;
    }
    if (t === 'plane') {
      const dist = Math.abs(surf.C[g.i] - g.c);
      if (surf.shape === 'sphere') return dist < surf.R ? new Ex(PI * (surf.R ** 2 - dist ** 2)) : new Ex(0);
      if (surf.n[g.i] === 1) return new Ex(dist < surf.h / 2 ? PI * surf.R ** 2 : 0);
      return null;
    }
    return null;
  }
  function fluxNum(def, g, surf) {
    const { x, w } = Engine.gl(40), NF = 96, dphi = (2 * PI) / NF;
    let phi = 0;
    const add = (X, nrm, wt) => { const e = def.E(g, X); if (e) phi += V3.dot(e, nrm) * wt; };
    if (surf.shape === 'sphere') {
      for (let i = 0; i < x.length; i++) {
        const ct = x[i], st = Math.sqrt(1 - ct * ct);
        for (let j = 0; j < NF; j++) {
          const p = (j + 0.5) * dphi, nrm = [st * Math.cos(p), st * Math.sin(p), ct];
          add(V3.add(surf.C, V3.sc(nrm, surf.R)), nrm, surf.R * surf.R * w[i] * dphi);
        }
      }
      return phi;
    }
    const n = surf.n, e1 = n[0] ? [0, 1, 0] : [1, 0, 0], e2 = V3.cross(n, e1), hh = surf.h / 2;
    for (let i = 0; i < x.length; i++) for (let j = 0; j < NF; j++) {
      const p = (j + 0.5) * dphi, rad = V3.add(V3.sc(e1, Math.cos(p)), V3.sc(e2, Math.sin(p)));
      const z = hh * x[i];
      add(V3.add(V3.add(surf.C, V3.sc(n, z)), V3.sc(rad, surf.R)), rad, surf.R * hh * w[i] * dphi);
      const r = (surf.R / 2) * (1 + x[i]), wr = (surf.R / 2) * w[i] * r * dphi;
      add(V3.add(V3.add(surf.C, V3.sc(n, hh)), V3.sc(rad, r)), n, wr);
      add(V3.add(V3.add(surf.C, V3.sc(n, -hh)), V3.sc(rad, r)), V3.sc(n, -1), wr);
    }
    return phi;
  }

  /* --------- Fórmula de E a lo largo de una recta (cargas, hilos y planos) ---------
     Si la recta atraviesa cargas, hilos o planos, el campo se da por tramos, como en
     los solucionarios: E⃗(z<a√3) = (…) u_z, E⃗(z>a√3) = (…) u_z; los tramos con la
     misma fórmula se juntan: E⃗(x<0) = … = E⃗(x>2b). */
  function profileFormula(ctx, P0, d, vname) {
    const v = F.sym(vname), u = (n) => F.unitPow(n);
    const tiny = (c) => Math.abs(c) < 1e-12;
    // |c|·a escrito como en los libros: a, 2b, a√3
    const withUnit = (c) => { const b = F.num(Math.abs(c)); return b === '1' ? u(1) : b.includes('√') ? u(1) + b : b + u(1); };
    const coefTxt = (c, tail, first) => {
      if (tiny(c)) return '';
      const neg = c < 0, body = F.num(Math.abs(c));
      const s = tail === null ? withUnit(c) : (body === '1' && tail ? '' : body) + tail;
      return (first ? (neg ? F.MINUS : '') : neg ? ` ${F.MINUS} ` : ' + ') + s;
    };
    // c1·v + c0 (el término positivo delante: a√3 − z)
    const lin = (c0, c1) => {
      const order = c1 < 0 && c0 > 0 ? [[c0, null], [c1, v]] : [[c1, v], [c0, null]];
      const parts = [];
      for (const [c, tl] of order) { const x = coefTxt(c, tl, !parts.length); if (x) parts.push(x); }
      return parts.join('') || '0';
    };
    const quad = (c0, c1, c2) => { const parts = []; for (const [c, tl] of [[c2, `${v}<sup>2</sup>`], [c1, `${u(1)}${v}`], [c0, u(2)]]) { const x = coefTxt(c, tl, !parts.length); if (x) parts.push(x); } return parts.join('') || '0'; };
    const posTxt = (t) => (tiny(t) ? '0' : coefTxt(t, null, true));
    const at = (t) => V3.add(P0, V3.sc(d, t));

    // cada fuente se convierte en una función del tramo (t de muestra) → piezas por componente
    const items = [], cuts = [], other = [];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const t = s.src.type;
      if (t === 'plane') {
        const i = s.g.i, c0 = P0[i] - s.g.c, c1 = d[i];
        if (!tiny(c1)) cuts.push(-c0 / c1);
        items.push((tm) => { const dn = c0 + c1 * tm; return tiny(dn) ? [] : [{ k: i, plane: s.S.scale(Math.sign(dn) / 2) }]; });
        continue;
      }
      let r0, r1, kind;
      if (t === 'point') { r0 = V3.sub(P0, s.g.pos); r1 = d; kind = 'point'; }
      else if (t === 'line' && s.g.mode === 'lambda') {
        const perp = (w) => V3.sub(w, V3.sc(s.g.u, V3.dot(w, s.g.u)));
        r0 = perp(V3.sub(P0, s.g.pos)); r1 = perp(d); kind = 'line';
      } else { other.push(nameHTML(s)); continue; }
      const S = s.S, n1 = V3.norm(r1);
      if (n1 > 1e-12 && V3.norm(V3.cross(r0, r1)) < 1e-9 * (V3.norm(r0) * n1 + 1e-30)) {
        // la recta pasa por la carga o corta al hilo: distancia con signo s(t) = s0 + n1·t
        const e = V3.sc(r1, 1 / n1), s0 = V3.dot(r0, r1) / n1;
        cuts.push(-s0 / n1);
        items.push((tm) => {
          const sg = Math.sign(s0 + n1 * tm), out = [];
          for (let k = 0; k < 3; k++) {
            if (tiny(e[k])) continue;
            if (kind === 'point') out.push({ k, S, c: sg * e[k], num: '1', den: `4π${eps}(${lin(sg * s0, sg * n1)})<sup>2</sup>` });
            else out.push({ k, S, c: e[k], num: '1', den: `2π${eps}(${lin(s0, n1)})` });
          }
          return out;
        });
        continue;
      }
      const c0 = V3.dot(r0, r0), c1 = 2 * V3.dot(r0, r1), c2 = V3.dot(r1, r1);
      const sq = c2 > 1e-12 && Math.abs(c1 * c1 - 4 * c0 * c2) < 1e-9 * (c1 * c1 + c0 * c2 + 1e-30);
      const q = sq ? lin(c1 / (2 * Math.sqrt(c2)), Math.sqrt(c2)) : quad(c0, c1, c2);
      const den = kind === 'point' ? `4π${eps}${sq ? `|${q}|<sup>3</sup>` : `(${q})<sup>3/2</sup>`}` : `2π${eps}${sq ? `(${q})<sup>2</sup>` : `(${q})`}`;
      const pieces = [];
      for (let k = 0; k < 3; k++) if (!(tiny(r0[k]) && tiny(r1[k]))) pieces.push({ k, S, c: 1, num: lin(r0[k], r1[k]), den });
      items.push(() => pieces);
    }
    if (!items.length) return other.length ? `<div class="sub hint">Sin fórmula cerrada para ${other.join(', ')}: mira la gráfica.</div>` : '';

    const bps = cuts.sort((x, y) => x - y).filter((c, i, arr) => !i || c - arr[i - 1] > 1e-9);
    const ivs = [];
    if (!bps.length) ivs.push({ t: [0.37, 1.13, 2.71], label: v });
    else {
      ivs.push({ t: [bps[0] - 1, bps[0] - 2.3, bps[0] - 0.4], label: `${v}&lt;${posTxt(bps[0])}` });
      for (let i = 0; i + 1 < bps.length; i++) { const w = bps[i + 1] - bps[i]; ivs.push({ t: [0.5, 0.31, 0.77].map((f) => bps[i] + f * w), label: `${posTxt(bps[i])}&lt;${v}&lt;${posTxt(bps[i + 1])}` }); }
      const L = bps[bps.length - 1];
      ivs.push({ t: [L + 1, L + 2.3, L + 0.4], label: `${v}&gt;${posTxt(L)}` });
    }
    const piece = (p, first) => {
      const Sh = F.poly(p.S, null), simple = !/class="fr"|[+−]/.test(Sh.replace(/^−/, ''));
      const neg = (p.c < 0) !== (simple && Sh.startsWith(F.MINUS));
      const m = Math.abs(p.c), mTxt = tiny(m - 1) ? '' : F.num(m);
      const numer = p.num === '1' ? '' : /[+−]/.test(p.num.replace(/^−/, '')) ? `(${p.num})` : p.num;
      let html;
      if (simple) html = F.frac(`${mTxt}${Sh.replace(/^−/, '')}${numer}`, p.den);
      else html = `${mTxt}${mTxt ? '·' : ''}(${Sh})·${F.frac(p.num, p.den)}`;
      return { neg: simple ? neg : p.c < 0, html };
    };
    const seen = new Map();
    for (const iv of ivs) {
      const smp = iv.t.map((t) => fieldNum(ctx, at(t))).filter(Boolean);
      const big = Math.max(1e-30, ...smp.map((e) => V3.norm(e)));
      const out = [];
      for (let k = 0; k < 3; k++) {
        if (smp.length && smp.every((e) => Math.abs(e[k]) < 1e-10 * big)) continue;
        const ps = [], keys = new Set();
        let plane = Poly.zero();
        for (const it of items) for (const p of it(iv.t[0])) {
          if (p.k !== k) continue;
          if (p.plane) { plane = plane.add(p.plane); continue; }
          const prev = ps.find((x) => F.poly(x.S, null) === F.poly(p.S, null) && x.num === p.num && x.den === p.den);
          if (prev) prev.c += p.c;
          else ps.push({ ...p });
        }
        const terms = ps.filter((p) => !tiny(p.c)).map((p) => { p.S.keys().forEach((x) => keys.add(x)); return piece(p); });
        if (!plane.isZero()) { plane.keys().forEach((x) => keys.add(x)); const h = F.poly(plane, 'E'); terms.push({ neg: h.startsWith(F.MINUS), html: h.replace(/^−/, '') }); }
        if (!terms.length) continue;
        const uk = F.uv('xyz'[k]);
        if (terms.length === 1) out.push({ neg: terms[0].neg, html: `${terms[0].html} ${uk}` });
        else if (keys.size === 1) out.push({ neg: false, html: `(${F.joinTerms(terms)}) ${uk}` });
        else terms.forEach((t) => out.push({ neg: t.neg, html: `${t.html} ${uk}` }));
      }
      const html = F.joinTerms(out);
      if (seen.has(html)) seen.get(html).push(iv.label); else seen.set(html, [iv.label]);
    }
    const E = (l) => `${vecE()}(${l})`;
    const lines = [...seen].map(([html, ls]) => `<div>${E(ls[0])} = ${html}${ls.slice(1).map((l) => ` = ${E(l)}`).join('')}</div>`).join('');
    return lines + (other.length ? `<div class="sub hint">Sin fórmula cerrada para ${other.join(', ')}: mira la gráfica.</div>` : '');
  }

  /* --------- ES-3: comprobación dimensional de la respuesta del alumno --------- */
  // dimensiones como exponentes de [C, m, N]; las de la expresión se miden escalando cada unidad por 2 y viendo cómo cambia el valor
  const DIM_Q = { E: [-1, 0, 1], V: [-1, 1, 1], F: [0, 0, 1], U: [0, 1, 1], T: [0, 1, 1], Phi: [-1, 2, 1] };
  const DIM_K = { q: [1, 0, 0], lambda: [1, -1, 0], sigma: [1, -2, 0], rho: [1, -3, 0], p: [1, 1, 0] };
  const dimTxt = (d) => { const bs = ['C', 'm', 'N'], up = (n) => (n === 1 ? '' : String(n).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).replace(/\./, ',')); const pos = [], neg = []; d.forEach((n, i) => { if (n > 0) pos.push(bs[i] + up(n)); else if (n < 0) neg.push(bs[i] + up(-n)); }); return pos.length ? pos.join('·') + (neg.length ? '/' + (neg.length > 1 ? '(' + neg.join('·') + ')' : neg[0]) : '') : neg.length ? '1/' + (neg.length > 1 ? '(' + neg.join('·') + ')' : neg[0]) : '1 (sin dimensiones)'; };
  // trozos de una expresión separados por + o − fuera de paréntesis (no cuenta el signo ni el exponente)
  function trozos(src) {
    const t = []; let nivel = 0, ini = 0;
    for (let i = 0; i < src.length; i++) { const c = src[i]; if (c === '(') nivel++; else if (c === ')') nivel--; else if (nivel === 0 && (c === '+' || c === '-') && i > ini && !/[*/^(eE+-]\s*$/.test(src.slice(ini, i).replace(/\s/g, '').slice(-1)) ) { t.push(src.slice(ini, i)); ini = i + 1; } }
    t.push(src.slice(ini)); return t.map((x) => x.trim()).filter(Boolean);
  }
  function dimension(src, ctx) {
    const norm = String(src).replace(/π/g, 'pi').replace(/λ/g, 'lambda').replace(/σ/g, 'sigma').replace(/ρ/g, 'rho').replace(/ε₀|ε0|ε/g, 'eps0');
    const ids = [...new Set(norm.match(/[A-Za-z_][A-Za-z_0-9]*/g) || [])].filter((n) => !['pi', 'e'].includes(n.toLowerCase()) && !/^(sqrt|ln|log|exp|sin|cos|tan|asin|acos|atan|abs|arctan|arcsin|arccos)$/i.test(n));
    const dims = {};
    for (const n of ids) {
      if (n === 'eps0') dims[n] = [2, -2, -1];
      else if (n === 'a' || n === ctx.unit) dims[n] = [0, 1, 0];
      else { const k = ctx.kinds[n] || (DIM_K[n] ? n : null); if (!k || !DIM_K[k]) return null; dims[n] = DIM_K[k]; }
    }
    const ev = (fl) => { const vars = {}; ids.forEach((n, i) => { vars[n] = (1.3 + 0.17 * i) * 2 ** dims[n].reduce((s, d, j) => s + d * fl[j], 0); }); try { return Engine.parseExpr(norm, null, vars); } catch (e) { return NaN; } };
    const r0 = ev([0, 0, 0]); if (!isFinite(r0) || r0 === 0) return null;
    const d = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((fl) => { const q = ev(fl) / r0; return Math.log2(Math.abs(q)) ; });
    if (d.some((x) => !isFinite(x) || Math.abs(2 * x - Math.round(2 * x)) > 1e-7)) return 'mixta';
    return d.map((x) => Math.round(2 * x) / 2);
  }
  // devuelve un aviso si la respuesta no tiene las dimensiones de la magnitud pedida, o '' si cuadran o no se puede saber
  function checkDim(raw, ans, ctx) {
    if (F.getMode() === 'si' || !ctx) return '';
    const esp = DIM_Q[ans.qty] || (DIM_K[ans.qty] ? DIM_K[ans.qty] : null); if (!esp) return '';
    const piezas = trozos(raw), ds = piezas.map((x) => dimension(x, ctx));
    if (ds.some((x) => x === null)) return '';
    if (piezas.length > 1) {
      const i = ds.findIndex((x, j) => j && (x === 'mixta' || ds[0] === 'mixta' || x.some((n, k) => Math.abs(n - ds[0][k]) > 1e-7)));
      if (i > 0) return `Los sumandos no tienen las mismas dimensiones: «${piezas[0]}» sale en ${ds[0] === 'mixta' ? '¿?' : dimTxt(ds[0])} y «${piezas[i]}» en ${ds[i] === 'mixta' ? '¿?' : dimTxt(ds[i])}.`;
    }
    const d = dimension(raw, ctx); if (d === null) return '';
    if (d === 'mixta') return 'Las dimensiones de la expresión no cuadran: hay sumandos o funciones con unidades que no se pueden combinar.';
    if (d.some((n, k) => Math.abs(n - esp[k]) > 1e-7)) return `Las dimensiones no cuadran: tu expresión sale en ${dimTxt(d)} y debería salir en ${dimTxt(esp)}.`;
    return 'Las dimensiones sí cuadran: revisa el coeficiente.';
  }

  /* --------- Modo práctica: comprobar la respuesta del alumno --------- */
  function checkAnswer(ans, inputs, ctx) {
    const si = F.getMode() === 'si';
    const names = [...new Set((ans.vec || [ans.val]).flatMap((p) => p.keys()).flatMap(Engine.splitKey))];
    const trials = si ? 1 : 3;
    const comps = ans.vec ? [0, 1, 2] : [0];
    for (let tr = 0; tr < trials; tr++) {
      const vals = {}, a = si ? 1 : 0.7 + Math.random() * 0.9, e0 = si ? Engine.EPS0 : 0.6 + Math.random() * 0.9;
      for (const k of Object.keys(ctx.kinds)) vals[k] = si ? 1 : 0.6 + Math.random() * 1.3;
      for (const k of names) vals[k] ??= si ? 1 : 0.6 + Math.random() * 1.3;
      const vars = { ...vals, eps0: e0, [ctx.unit]: a, a: ctx.unit === 'a' ? a : vals.a ?? a };
      for (const k of comps) {
        const P = ans.vec ? ans.vec[k] : ans.val;
        let exp = 0;
        for (const [key, c] of P.m) {
          const n = F.aExpFor(key, ans.qty);
          exp += c.value() * Engine.splitKey(key).reduce((p, s) => p * vals[s], 1) * a ** n * (F.hasEps(ans.qty) ? 1 / e0 : 1);
        }
        const raw = String(inputs[k] ?? '').trim();
        let got;
        try { got = raw === '' ? 0 : Engine.parseExpr(raw, null, vars); } catch (e) { return { ok: false, msg: 'No entiendo la expresión: ' + e.message }; }
        const scale = Math.max(Math.abs(exp), ...comps.map(() => 0)) || 1;
        if (Math.abs(got - exp) > 2e-3 * Math.max(Math.abs(exp), 1e-12) && !(Math.abs(exp) < 1e-12 && Math.abs(got) < 1e-9 * scale)) return { ok: false, msg: (ans.vec ? `La componente ${'xyz'[k]} no coincide.` : 'No coincide.') + ' ' + checkDim(raw, ans, ctx) };
      }
    }
    return { ok: true, msg: 'Correcto' };
  }

  /* --------------------------- PREGUNTAS --------------------------- */
  // con una incógnita despejada, cada pregunta puede usarla con su valor o como símbolo
  const UNK = { k: 'unk', t: 'select', label: 'Incógnita', options: [['sust', 'con su valor despejado'], ['libre', 'como símbolo (apartado independiente)']], show: (a, sc) => !!sc?.unknown?.srcs?.length };
  const ANALYSES = {
    E: {
      label: 'Campo eléctrico en un punto', short: 'Campo E',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, UNK],
      defaults: () => ({ P: ['1', '1', '0'] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const mod = F.modulus(F0.E, 'E');
        return {
          res: `<div>${vecE()}(P) = ${F.vec(F0.E, 'E')}</div>${mod ? `<div class="sub">|${vecE()}| = ${mod}</div>` : ''}`,
          steps: singularWarn(F0.singular) + fieldSteps(ctx, X, F0),
          marks: [{ key: 'P', at: X, label: 'P', vec: VP.value(F0.E) }],
          answers: [{ label: 'E⃗(P)', qty: 'E', vec: F0.E }],
        };
      },
    },
    V: {
      label: 'Potencial en un punto', short: 'Potencial V',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }],
      defaults: () => ({ P: ['1', '0', '0'] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), pot = potential(ctx, X);
        if (!pot.absolute) return { res: `<div class="warn">Hay hilos o planos infinitos: el potencial absoluto no está definido (no se puede tomar V(∞) = 0). Usa “Diferencia de potencial”.</div>`, marks: [{ key: 'P', at: X, label: 'P' }] };
        const rows = pot.parts.map(({ s, Vp }) => `<li><div class="st-h">${headHTML(s)}</div><div>${s.def.explainV(s.g, X, X)}</div><div class="st-r">V<sub>${F.esc(s.name)}</sub> = ${F.poly(Vp, 'V')}</div></li>`);
        return {
          res: `V(P) = ${F.poly(pot.V, 'V')}`,
          steps: singularWarn(pot.singular) + `<p>Superposición con V(∞) = 0.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">V(P) = ${F.poly(pot.V, 'V')}</div>`,
          marks: [{ key: 'P', at: X, label: 'P' }],
          answers: [{ label: 'V(P)', qty: 'V', val: pot.V }],
        };
      },
    },
    dV: {
      label: 'Diferencia de potencial V_B − V_A', short: 'V_B − V_A',
      fields: [{ k: 'A', t: 'vec3', label: 'Punto A' }, { k: 'B', t: 'vec3', label: 'Punto B' }, { k: 'sense', t: 'select', label: 'Calcular', options: [['BA', 'V_B − V_A'], ['AB', 'V_A − V_B']] }, UNK],
      defaults: () => ({ A: ['1', '0', '0'], B: ['2', '0', '0'], sense: 'BA' }),
      run(an, ctx) {
        const A = an.A.map(ctx.P), B = an.B.map(ctx.P), d = diffV(ctx, A, B);
        const ab = an.sense === 'AB', sg = ab ? -1 : 1, D = d.dV.scale(sg);
        const lab = ab ? 'V<sub>A</sub> − V<sub>B</sub>' : 'V<sub>B</sub> − V<sub>A</sub>';
        const rows = d.parts.map(({ s, dV }) => `<li><div class="st-h">${headHTML(s)}</div><div>${s.def.explainV(s.g, A, B)}</div><div class="st-r">ΔV<sub>${F.esc(s.name)}</sub> = ${F.poly(dV, 'V')}</div></li>`);
        return {
          res: `${lab} = ${F.poly(D, 'V')}`,
          steps: singularWarn(d.singular) + `<p>V<sub>B</sub> − V<sub>A</sub> = −∫<sub>A</sub><sup>B</sup> ${vecE()}·d<span class="vv">l</span>, sumando la contribución de cada fuente.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">V<sub>B</sub> − V<sub>A</sub> = ${F.poly(d.dV, 'V')}</div>${ab ? `<div class="st-r">${lab} = −(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(D, 'V')}</div>` : ''}`,
          marks: [{ key: 'A', at: A, label: 'A' }, { key: 'B', at: B, label: 'B' }],
          answers: [{ label: ab ? 'V_A − V_B' : 'V_B − V_A', qty: 'V', val: D }],
        };
      },
    },
    force: {
      label: 'Fuerza sobre una carga', short: 'Fuerza',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'Q', t: 'charge', label: 'Carga de prueba' }],
      defaults: () => ({ P: ['1', '1', '0'], Q: { c: '1', sym: 'q' } }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X), Q = Poly.sym(an.Q.sym, ctx.P(an.Q.c));
        const Fv = VP.fromNum(Q, [1, 1, 1]).map((q, i) => q.mul(F0.E[i]));
        const mod = F.modulus(Fv, 'F');
        return {
          res: `<div><span class="vv">F</span> = Q${vecE()} = ${F.vec(Fv, 'F')}</div>${mod ? `<div class="sub">|<span class="vv">F</span>| = ${mod}</div>` : ''}`,
          steps: singularWarn(F0.singular) + fieldSteps(ctx, X, F0) + `<div class="st-r"><span class="vv">F</span> = (${F.poly(Q, 'q')})·${vecE()} = ${F.vec(Fv, 'F')}</div>`,
          marks: [{ key: 'P', at: X, label: 'P', vec: VP.value(Fv) }],
          answers: [{ label: 'F⃗', qty: 'F', vec: Fv }],
        };
      },
    },
    work: {
      label: 'Trabajo para mover una carga de A a B', short: 'Trabajo',
      fields: [{ k: 'A', t: 'vec3', label: 'Desde A' }, { k: 'B', t: 'vec3', label: 'Hasta B' }, { k: 'Q', t: 'charge', label: 'Carga' }],
      defaults: () => ({ A: ['1', '0', '0'], B: ['2', '0', '0'], Q: { c: '1', sym: 'q' } }),
      run(an, ctx) {
        const A = an.A.map(ctx.P), B = an.B.map(ctx.P), d = diffV(ctx, A, B), Q = Poly.sym(an.Q.sym, ctx.P(an.Q.c));
        const W = Q.mul(d.dV);
        return {
          res: `<div>W<sub>ext</sub> = Q(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(W, 'U')}</div><div class="sub">Trabajo del campo: W<sub>campo</sub> = −W<sub>ext</sub> = ${F.poly(W.scale(-1), 'U')}</div>`,
          steps: singularWarn(d.singular) + d.parts.map(({ s, dV }) => `<div>${nameHTML(s)}: ${s.def.explainV(s.g, A, B)} → ΔV = ${F.poly(dV, 'V')}</div>`).join('') +
            `<div class="st-r">V<sub>B</sub> − V<sub>A</sub> = ${F.poly(d.dV, 'V')}</div><div class="st-r">W<sub>ext</sub> = (${F.poly(Q, 'q')})·(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(W, 'U')}</div>`,
          marks: [{ key: 'A', at: A, label: 'A' }, { key: 'B', at: B, label: 'B' }],
          answers: [{ label: 'W_ext', qty: 'U', val: W }],
        };
      },
    },
    dipole: {
      label: 'Dipolo en un punto (par, energía, equilibrio)', short: 'Dipolo en P',
      fields: [{ k: 'P', t: 'vec3', label: 'Posición' }, { k: 'p', t: 'vec3', label: 'Momento p (× símbolo)' }, { k: 'sym', t: 'sym', label: 'Símbolo' }, { k: 'rot', t: 'vec3opt', label: 'Girarlo hasta (opcional)' }],
      defaults: () => ({ P: ['0', '0', '0'], p: ['1', '0', '0'], sym: 'p', rot: ['', '', ''] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const pn = an.p.map(ctx.P);
        const pS = Poly.sym(an.sym, 1);
        const pv = pn.map((v) => pS.scale(v));
        const tau = VP.cross(pv, F0.E), U = VP.dot(pv, F0.E).scale(-1);
        const En = VP.value(F0.E), pm = V3.norm(pn), Em = V3.norm(En);
        const crossN = V3.norm(V3.cross(pn, En)), dotN = V3.dot(pn, En);
        let eqTxt;
        if (Em < 1e-14) eqTxt = `<span class="pill"><span class="vv">E</span> = 0 en P: cualquier orientación es de equilibrio (indiferente)</span>`;
        else if (crossN < 1e-9 * pm * Em) eqTxt = dotN > 0 ? `<span class="pill ok">Equilibrio estable</span> <span class="vv">p</span> apunta como ${vecE()} (U mínima)` : `<span class="pill bad">Equilibrio inestable</span> <span class="vv">p</span> apunta contra ${vecE()} (U máxima)`;
        else eqTxt = `<span class="pill">No está en equilibrio</span> el par lo gira hacia ${vecE()}`;
        let rotHTML = '';
        const hasRot = an.rot && an.rot.some((v) => String(v).trim() !== '');
        if (hasRot) {
          const d = V3.unit(an.rot.map((v) => (String(v).trim() === '' ? 0 : ctx.P(v))));
          const pf = d.map((v) => pS.scale(v * pm));
          const Uf = VP.dot(pf, F0.E).scale(-1);
          rotHTML = `<div class="sub">Girándolo hasta ${F.vecNum(d)} (mismo |<span class="vv">p</span>|): U<sub>f</sub> = ${F.poly(Uf, 'U')}, &nbsp;W<sub>ext</sub> = U<sub>f</sub> − U<sub>i</sub> = <b>${F.poly(Uf.sub(U), 'U')}</b></div>`;
        }
        const pmod = pm === 1 ? '' : F.num(pm);
        return {
          res: `<div><span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} = ${F.vec(tau, 'T')}</div><div>U = −<span class="vv">p</span>·${vecE()} = ${F.poly(U, 'U')}</div><div class="sub">${eqTxt}</div>${rotHTML}`,
          steps: singularWarn(F0.singular.filter((s) => s.src.type !== 'dipole')) + fieldSteps(ctx, X, F0) +
            `<div class="st-r"><span class="vv">p</span> = ${F.vec(pv, 'p')} &nbsp;(|<span class="vv">p</span>| = ${pmod}${F.sym(an.sym)})</div>
             <div class="st-r">Momento de fuerzas: <span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} = ${F.vec(tau, 'T')}</div>
             <div class="st-r">Energía potencial: U = −<span class="vv">p</span>·${vecE()} = ${F.poly(U, 'U')}</div>
             <p>Equilibrio cuando <span class="vv">M</span> = 0 (<span class="vv">p</span> ∥ ${vecE()}). Estable si <span class="vv">p</span> tiene el mismo sentido que ${vecE()}; inestable si es opuesto.</p>`,
          marks: [{ key: 'P', at: X, label: 'p', vec: En, dip: pn }],
          answers: [{ label: 'M⃗', qty: 'T', vec: tau }, { label: 'U', qty: 'U', val: U }],
        };
      },
    },
    energy: {
      label: 'Energía electrostática del sistema de cargas', short: 'Energía',
      fields: [],
      defaults: () => ({}),
      run(an, ctx) {
        const pts = ctx.sources.filter((s) => s.src.type === 'point' && s.g && s.S);
        let U = Poly.zero();
        const rows = [];
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const r = V3.norm(V3.sub(pts[i].g.pos, pts[j].g.pos));
          const u = pts[i].S.mul(pts[j].S).scale(1 / (4 * PI * r));
          U = U.add(u);
          rows.push(`<li>${nameHTML(pts[i])}${nameHTML(pts[j])}: r = ${F.num(r)} → ${F.frac(`${nameHTML(pts[i])}${nameHTML(pts[j])}`, `4π${eps}r`)} = ${F.poly(u, 'U')}</li>`);
        }
        const others = ctx.sources.length - pts.length;
        return {
          res: `U = ${F.poly(U, 'U')}`,
          steps: `<p>U = Σ<sub>i&lt;j</sub> ${F.frac('q<sub>i</sub>q<sub>j</sub>', `4π${eps}r<sub>ij</sub>`)} (una vez cada pareja).</p><ol class="steps">${rows.join('')}</ol>${others ? `<div class="warn">Solo se cuentan las cargas puntuales (${others} fuente(s) de otro tipo ignoradas).</div>` : ''}`,
          marks: [],
          answers: [{ label: 'U', qty: 'U', val: U }],
        };
      },
    },
    findDipole: {
      label: 'Hallar el momento dipolar a partir del par y/o la energía', short: 'Hallar p',
      fields: [
        { k: 'P', t: 'vec3', label: 'Posición' }, { k: 'sym', t: 'sym', label: 'Símbolo de p' },
        { k: 'tau', t: 'vec3opt', label: 'Par M dado (coeficientes)' },
        { k: 'U', t: 'expr', label: 'U dada (mismo convenio, opcional)', optional: true },
        { k: 'plane', t: 'select', label: 'Restricción', options: [['none', 'ninguna'], ['z', 'en el plano XY (p_z = 0)'], ['y', 'en el plano XZ (p_y = 0)'], ['x', 'en el plano YZ (p_x = 0)']] },
      ],
      defaults: () => ({ P: ['1', '0', '0'], sym: 'b', tau: ['', '', ''], U: '', plane: 'z' }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const keys = VP.keys(F0.E);
        if (keys.length !== 1) return { res: `<div class="warn">Este cálculo necesita que el campo en P dependa de un solo símbolo (ahora depende de ${keys.length}).</div>` };
        const e = F0.E.map((p) => p.coef(keys[0]).value());
        const rows = [], rhs = [];
        const has = (v) => String(v ?? '').trim() !== '';
        // (p × e)_x = p_y e_z − p_z e_y, etc.
        if (an.tau.some(has)) {
          const t = an.tau.map((v) => (has(v) ? ctx.P(v) : 0));
          rows.push([0, e[2], -e[1]], [-e[2], 0, e[0]], [e[1], -e[0], 0]); rhs.push(...t);
        }
        if (has(an.U)) { rows.push([-e[0], -e[1], -e[2]]); rhs.push(ctx.P(an.U)); }
        if (an.plane !== 'none') { const r = [0, 0, 0]; r[AXI[an.plane]] = 1; rows.push(r); rhs.push(0); }
        if (!rows.length) return { res: `<div class="warn">Introduce el par <span class="vv">M</span> y/o la energía U.</div>` };
        // mínimos cuadrados: (AᵀA) p = Aᵀ b
        const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
        rows.forEach((r, k) => { for (let i = 0; i < 3; i++) { v[i] += r[i] * rhs[k]; for (let j = 0; j < 3; j++) M[i][j] += r[i] * r[j]; } });
        const p = solve3(M, v);
        if (!p) return { res: `<div class="warn">Faltan datos: con lo introducido <span class="vv">p</span> no queda determinado. Añade U o una restricción.</div>` };
        const res = rows.reduce((s, r, k) => s + (r[0] * p[0] + r[1] * p[1] + r[2] * p[2] - rhs[k]) ** 2, 0);
        const pS = Poly.sym(an.sym, 1), pv = p.map((x) => pS.scale(x));
        const Eu = V3.unit(VP.value(F0.E));
        const pm = V3.norm(p);
        return {
          res: `<div><span class="vv">p</span> = ${F.vec(pv, 'p', { unitForm: true })}</div><div class="sub">|<span class="vv">p</span>| = ${F.num(pm)}${F.sym(an.sym)}</div>${res > 1e-12 ? '<div class="warn">Los datos no son del todo compatibles; se muestra la mejor aproximación.</div>' : ''}`,
          steps: fieldSteps(ctx, X, F0) + `<p>Incógnita <span class="vv">p</span> = (p<sub>x</sub>, p<sub>y</sub>, p<sub>z</sub>). Ecuaciones: <span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} (3 ecuaciones), U = −<span class="vv">p</span>·${vecE()} y la restricción elegida. Resolviendo el sistema lineal:</p><div class="st-r"><span class="vv">p</span> = ${F.vec(pv, 'p')}</div>`,
          marks: [{ key: 'P', at: X, label: 'p', vec: VP.value(F0.E), dip: p }],
          answers: [{ label: 'p⃗', qty: 'p', vec: pv }],
          action: {
            label: 'Añadir este dipolo como fuente, ya en equilibrio estable',
            make: () => ({ type: 'dipole', name: 'p', pos: an.P.slice(), p: Eu.map((x) => trimNum(x * pm)), s: { c: '1', sym: an.sym } }),
          },
        };
      },
    },
    flux: {
      label: 'Flujo de E por una superficie cerrada (Gauss)', short: 'Flujo (Gauss)',
      fields: [
        { k: 'shape', t: 'select', label: 'Superficie', structural: true, options: [['sphere', 'esfera'], ['cyl', 'cilindro']] },
        { k: 'C', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio' },
        { k: 'axis', t: 'select', label: 'Eje', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']], show: (a) => a.shape === 'cyl' },
        { k: 'h', t: 'expr', label: 'Altura', show: (a) => a.shape === 'cyl' },
      ],
      defaults: () => ({ shape: 'sphere', C: ['0', '0', '0'], R: '2', axis: 'z', h: '2' }),
      run(an, ctx) {
        const surf = { shape: an.shape, C: an.C.map(ctx.P), R: ctx.P(an.R), axis: an.axis, n: AX[an.axis], h: an.shape === 'cyl' ? ctx.P(an.h) : 0 };
        let Q = Poly.zero();
        const rows = [];
        for (const s of ctx.sources) {
          if (!s.g || !s.S) continue;
          let q = qencExact(s, surf), how = 'exacto';
          if (q === null) { q = fluxNum(s.def, s.g, surf); how = 'integración numérica de E·dA'; }
          const Qi = s.S.scale(q);
          Q = Q.add(Qi);
          rows.push(`<li><div class="st-h">${headHTML(s)}</div><div>Carga encerrada (${how}): ${F.poly(Qi, 'q')}</div></li>`);
        }
        const Phi = Q.clean();
        return {
          res: `<div>Φ = ∮${vecE()}·d<span class="vv">A</span> = ${F.frac('Q<sub>enc</sub>', eps)} = ${F.poly(Phi, 'Phi')}</div><div class="sub">Q<sub>enc</sub> = ${F.poly(Phi, 'q')}</div>`,
          steps: `<p>Ley de Gauss: el flujo por una superficie cerrada solo depende de la carga encerrada. Superficie: ${an.shape === 'sphere' ? `esfera de radio ${F.num(surf.R)}` : `cilindro de radio ${F.num(surf.R)} y altura ${F.num(surf.h)}, eje ${an.axis.toUpperCase()}`} centrada en ${F.pt(surf.C)}.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">Φ = ${F.poly(Phi, 'Phi')}</div>`,
          marks: [{ key: 'C', at: surf.C, label: 'C' }],
          surf,
          answers: [{ label: 'Φ', qty: 'Phi', val: Phi }],
        };
      },
    },
    profile: {
      label: 'Perfil a lo largo de una recta: E y V en función de una variable', short: 'E(z), V(z)',
      fields: [
        { k: 'P0', t: 'vec3', label: 'Punto de la recta' }, { k: 'd', t: 'vec3', label: 'Dirección' },
        { k: 'var', t: 'sym', label: 'Variable' }, { k: 't0', t: 'expr', label: 'Desde' }, { k: 't1', t: 'expr', label: 'Hasta' },
        { k: 'at', t: 'expr', label: 'Valor exacto en', optional: true }, UNK,
      ],
      defaults: () => ({ P0: ['0', '0', '0'], d: ['0', '0', '1'], var: 'z', t0: '-3', t1: '3', at: '' }),
      run(an, ctx) {
        const P0 = an.P0.map(ctx.P), d = an.d.map(ctx.P), t0 = ctx.P(an.t0), t1 = ctx.P(an.t1);
        const vname = an.var || 't';
        const at = (t) => V3.add(P0, V3.sc(d, t));
        const formula = profileFormula(ctx, P0, d, vname);
        // muestreo numérico (símbolos = 1)
        const N = 240, xs = [], Ex = [], Ey = [], Ez = [], Em = [], Vs = [];
        const absV = ctx.sources.every((s) => !s.S || s.def.absV);
        const si = F.getMode() === 'si', f = si ? 1 / Engine.EPS0 : PI;
        let V0 = null;
        for (let i = 0; i <= N; i++) {
          const t = t0 + ((t1 - t0) * i) / N, X = at(t);
          const E = fieldNum(ctx, X), V = potNum(ctx, X);
          xs.push(t);
          const ok = E && E.every(isFinite);
          Ex.push(ok ? E[0] * f : null); Ey.push(ok ? E[1] * f : null); Ez.push(ok ? E[2] * f : null); Em.push(ok ? V3.norm(E) * f : null);
          if (isFinite(V) && V0 === null) V0 = V;
          Vs.push(isFinite(V) ? (absV ? V : V - V0) * f : null);
        }
        let exact = '';
        if (String(an.at ?? '').trim() !== '') {
          const tv = ctx.P(an.at), X = at(tv), F0 = field(ctx, X), pot = potential(ctx, X);
          exact = `<div class="sub">En ${F.sym(vname)} = ${F.num(tv)}: ${vecE()} = ${F.vec(F0.E, 'E')}${pot.absolute ? `, &nbsp;V = ${F.poly(pot.V, 'V')}` : ''}</div>`;
        }
        const yl = si ? 'N/C y V' : '×(símbolo)/(πε₀)';
        return {
          res: `${formula}${exact}<canvas class="chart" aria-label="Gráfica de E y V"></canvas><div class="chart-l"></div>`,
          steps: `<p>Puntos de la recta: P(${F.sym(vname)}) = ${F.pt(P0)} + ${F.sym(vname)}·${F.vecNum(d)}. La gráfica es numérica tomando todos los símbolos = 1 ${si ? '' : '(eje vertical en unidades de símbolo/(πε₀aⁿ))'}${absV ? '' : '; V se mide respecto al primer punto porque hay hilos o planos infinitos'}.</p>`,
          marks: [{ key: 'P0', at: P0, label: 'P₀' }],
          seg: [at(t0), at(t1)],
          chart: { xs, xlabel: vname, ylabel: yl, series: [
            { name: 'E_x', ys: Ex }, { name: 'E_y', ys: Ey }, { name: 'E_z', ys: Ez }, { name: '|E|', ys: Em }, { name: absV ? 'V' : 'V − V(inicio)', ys: Vs, dashed: true },
          ] },
        };
      },
    },
  };
  function trimNum(x) {
    const id = Engine.identify(x);
    if (id) return (id.s < 0 ? '-' : '') + (id.n !== 1 || id.r === 1 ? id.n : '') + (id.r > 1 ? (id.n !== 1 ? '*' : '') + `sqrt(${id.r})` : '') + (id.d !== 1 ? '/' + id.d : '');
    return String(+x.toPrecision(8));
  }
  function solve3(M, v) {
    const A = M.map((r, i) => [...r, v[i]]);
    for (let c = 0; c < 3; c++) {
      let piv = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-12) return null;
      [A[c], A[piv]] = [A[piv], A[c]];
      for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r, i) => r[3] / r[i]);
  }

  /* --------------------------- EJECUCIÓN --------------------------- */
  function run(scen) {
    const ctx = build(scen);
    const unknown = solveUnknowns(ctx, scen);
    for (const s of ctx.sources) s.Snum = s.S ? s.S.value() : 0;
    const results = scen.analyses.map((an) => {
      const def = ANALYSES[an.type];
      // «incógnita como símbolo»: la pregunta se calcula sin sustituir el valor despejado
      const swap = an.unk === 'libre' ? ctx.sources.filter((s) => s.unknown && s.Sfree) : [];
      const saved = swap.map((s) => [s.S, s.Snum]);
      swap.forEach((s) => { s.S = s.Sfree; s.Snum = s.Sfree.value(); });
      try { return def.run(an, ctx); } catch (e) { return { error: e.message }; }
      finally { swap.forEach((s, i) => { [s.S, s.Snum] = saved[i]; }); }
    });
    return { ctx, unknown, results };
  }

  return { SOURCES, ANALYSES, CONDS, run, build, checkAnswer, checkDim, normUnknown, field, potential, fieldNum, potNum, trimNum };
})();
if (typeof module !== 'undefined') module.exports = Physics;
