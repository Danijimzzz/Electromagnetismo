/* =====================================================================
   Interfaz de Excedentes, impuestos y eficiencia: las dos rectas y la
   intervención; la gráfica en (Q, P) con el excedente del consumidor, el
   del productor, la recaudación (o el gasto) y la pérdida irrecuperable
   sombreados, y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en excedentes/calculo.js.
   ===================================================================== */
(() => {
  const X = Excedentes, { f, num } = Eco;
  // un mercado con equilibrio entero y un impuesto, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const b = e(1, 4), d = e(1, 4), p = e(10, 40), q = e(4, 12) * b * d * 2, t = e(1, 4) * 2;
    return { a: String(q + b * p), b: String(b), c: String(q - d * p), d: String(d), interv: 'impuesto', v: String(t) };
  }
  const ec = (sc) => `Qd = ${sc.a} − ${sc.b}P y Qs = ${String(sc.c).startsWith('-') ? `−${String(sc.c).slice(1)} + ` : sc.c === '0' ? '' : `${sc.c} + `}${sc.d}P`;
  const COL = { ec: '--serie-1', ep: '--serie-2', pi: '--serie-3', pie: '--ink' };
  Calculadora.monta({
    C: X, carpeta: 'excedentes', app: 'ExcedentesApp', azar,
    enunciado: (sc) => `Con ${ec(sc)}, el Estado pone un impuesto de ${sc.v} € por unidad. Calcula el precio que pagan los compradores, el que cobran los vendedores, la cantidad, los excedentes del consumidor y del productor, la recaudación y la pérdida irrecuperable de eficiencia.`,
    nota: 'Demanda Qd = a − bP y oferta Qs = c + dP (c puede ser negativo). Si te las dan como P en función de Q, P = α − βQ, despeja: a = α/β y b = 1/β.',
    campos: (sc) => [
      { k: 'forma', nom: 'Forma de las curvas', tipo: 'sel', ops: Eco.FORMAS },
      ...Eco.camposCurvas(sc),
      { k: 'interv', nom: 'Intervención', tipo: 'sel', ops: Object.entries(X.INTERV), sep: 'Intervención del Estado' },
      ...(sc.interv && sc.interv !== 'ninguna' ? [{ k: 'v', nom: { advalorem: 'Impuesto (%)', impuesto: 'Impuesto por unidad', subvencion: 'Subvención por unidad', maximo: 'Precio máximo', minimo: 'Precio mínimo' }[sc.interv], un: sc.interv === 'advalorem' ? '%' : '€' }] : []),
    ],
    resumen: (s) => {
      const r = [['Equilibrio', `P* = ${f(s.p, 5)} y Q* = ${f(s.q, 5)}`, true], ['Excedente del consumidor', f(s.ec, 6)], ['Excedente del productor', f(s.ep, 6)]];
      if (!s.des) return [...r, ['Excedente total', f(s.w, 6), true]];
      const D = s.des, imp = D.interv === 'impuesto' || D.interv === 'subvencion';
      return [...r.slice(0, 1), ...(imp ? [['Pagan los compradores', `P<sub>c</sub> = ${f(D.pc, 5)}`], ['Cobran los vendedores', `P<sub>v</sub> = ${f(D.pv, 5)}`]] : []), ['Cantidad', f(D.q, 5)], ['Excedente del consumidor', `${f(s.ec, 6)} → ${f(D.ec, 6)}`], ['Excedente del productor', `${f(s.ep, 6)} → ${f(D.ep, 6)}`],
        ...(D.pi ? [[D.pi > 0 ? 'Recaudación' : 'Gasto público', f(Math.abs(D.pi), 6)]] : []), ['Pérdida irrecuperable', f(D.pie, 5), !D.pi]];
    },
    grafica: (s) => {
      const pmax = s.pMax * 1.05, qmax = Math.max(s.a, s.c + s.d * pmax) * 1.02;
      const series = [{ pts: [[s.a, 0], [0, s.pMax]], color: '--serie-1' }, { pts: [[Math.max(0, s.c), s.p0], [s.c + s.d * pmax, pmax]], color: '--serie-2' }];
      const D = s.des, E = D || { pc: s.p, pv: s.p, q: s.q };
      if (D && D.pc !== D.pv) series.push({ pts: [[0, D.pc], [D.q, D.pc]], color: '--muted', grosor: 1, discontinua: true }, { pts: [[0, D.pv], [D.q, D.pv]], color: '--muted', grosor: 1, discontinua: true });
      series.push({ pts: [[0, E.pc], [E.q, E.pc], [E.q, 0]], color: '--muted', grosor: 1, discontinua: true }, { tipo: 'puntos', pts: [[s.q, s.p]], color: '--ink', radio: 5 });
      return { x: [0, qmax], y: [0, pmax], fx: (v) => f(v), fy: (v) => num(v, pmax < 20 ? 1 : 0), ejeX: 'Cantidad Q', ejeY: 'Precio P', series,
        etiquetas: [{ x: s.a * 0.92, y: (s.a * 0.08) / s.b, texto: 'D', color: '--serie-1' }, { x: s.c + s.d * pmax * 0.92, y: pmax * 0.92, texto: 'S', color: '--serie-2', alinea: 'right' }, { x: s.q, y: s.p, texto: 'E' }] };
    },
    // las áreas: EC entre la demanda y Pc, EP entre Pv y la oferta, la recaudación entre los dos precios y la pérdida entre las curvas
    despues: ({ X: x, Y: y, g }, s, col) => {
      const D = s.des, Q = D ? D.q : s.q, pc = D ? D.pc : s.p, pv = D ? D.pv : s.p;
      const pd = (q) => (s.a - q) / s.b, ps = (q) => Math.max(0, (q - s.c) / s.d);
      const cubre = (pts, color, alfa) => { g.save(); g.globalAlpha = alfa; g.fillStyle = col[color]; g.beginPath(); pts.forEach(([u, v], i) => (i ? g.lineTo(x(u), y(v)) : g.moveTo(x(u), y(v)))); g.closePath(); g.fill(); g.restore(); };
      const tramo = (fn, a, b) => Array.from({ length: 21 }, (_, i) => { const q = a + ((b - a) * i) / 20; return [q, fn(q)]; });
      cubre([[0, pc], ...tramo(pd, 0, Q), [Q, pc]], COL.ec, 0.22);
      cubre([[0, pv], ...tramo(ps, 0, Q), [Q, pv]], COL.ep, 0.22);
      if (D && D.pi) cubre([[0, pc], [Q, pc], [Q, pv], [0, pv]], COL.pi, 0.28);
      if (D && D.pie > 1e-9) { const [a, b] = Q < s.q ? [Q, s.q] : [s.q, Q]; cubre([...tramo(pd, a, b), ...tramo(ps, a, b).reverse()], COL.pie, 0.35); }
    },
    leyenda: (s) => `Áreas: <b style="color:var(--serie-1)">excedente del consumidor</b>, <b style="color:var(--serie-2)">excedente del productor</b>${s.des && s.des.pi ? `, <b style="color:var(--serie-3)">${s.des.pi > 0 ? 'recaudación' : 'gasto en la subvención'}</b>` : ''}${s.des && s.des.pie > 1e-9 ? ' y, en gris oscuro, la <b>pérdida irrecuperable</b>' : ''}. E es el equilibrio sin intervención.`,
  });
})();
