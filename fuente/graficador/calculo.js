/* =====================================================================
   Graficador de funciones (sin DOM): hasta tres funciones f, g y h de x
   en una ventana [x mín, x máx] × [y mín, y máx] (la de y, automática si
   no se da), con el estudio de f (dominio, simetría, cortes, asíntotas,
   extremos e inflexión, de Derivadas.estudio), los cortes entre las curvas
   en la ventana y una tabla de valores. Lee las expresiones con Expresion
   (matematicas/expresion.js); formato y lectura de campos en
   calculadora.js; interfaz en graficador/app.js.
   ===================================================================== */
const Graficador = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const DV = typeof Derivadas !== 'undefined' ? Derivadas : require('../derivadas/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, vacio } = K, nt = E.numTxt;
  // límites de la ventana: números o expresiones sin x (2pi, -pi/2, e)
  const lee = (sc, k, nom, def) => {
    if (vacio(sc[k])) { if (def !== undefined) return def; throw new Error(`Falta ${nom}`); }
    const v = E.valor(E.lee(sc[k], nom, []), 0);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} tiene que ser un número`);
    return v;
  };
  const NOMBRES = ['f', 'g', 'h'];
  // el estudio de f no depende de la ventana: se guarda el último para no rehacerlo al mover la gráfica
  let ultimo = { f: null, est: null };
  const estudio = (src) => { if (ultimo.f !== src) ultimo = { f: src, est: DV.estudio({ f: src }) }; return ultimo.est; };

  // y automática: entre los percentiles 3 y 97 de los valores, para que una asíntota no lo aplaste todo
  function rangoY(fun, x0, x1) {
    const ys = [];
    for (const q of fun) for (let i = 0; i <= 400; i++) { const y = q.ev(x0 + ((x1 - x0) * i) / 400); if (isFinite(y)) ys.push(y); }
    if (!ys.length) return [-10, 10];
    ys.sort((a, b) => a - b);
    let a = ys[Math.floor(0.03 * (ys.length - 1))], b = ys[Math.ceil(0.97 * (ys.length - 1))];
    if (b - a < 1e-9) { a -= 1; b += 1; }
    const m = 0.12 * (b - a);
    a -= m; b += m;
    // el eje x a la vista si queda cerca
    if (a > 0 && a < 0.3 * (b - a)) a = -0.05 * (b - a);
    if (b < 0 && -b < 0.3 * (b - a)) b = 0.05 * (b - a);
    return [a, b];
  }

  function resolver(sc) {
    const fun = [];
    for (const k of NOMBRES) if (!vacio(sc[k])) { const ast = E.simp(E.lee(sc[k], `${k}(x)`, ['x'])); fun.push({ k, ast, ev: (x) => E.valor(ast, x), txt: E.texto(ast) }); }
    if (!fun.length || fun[0].k !== 'f') throw new Error('Escribe al menos f(x)');
    const x0 = lee(sc, 'xmin', 'x mínimo', -10), x1 = lee(sc, 'xmax', 'x máximo', 10);
    if (!(x1 > x0)) throw new Error('El x máximo tiene que ser mayor que el x mínimo');
    const conY = !vacio(sc.ymin) || !vacio(sc.ymax);
    let y = null;
    if (conY) {
      if (vacio(sc.ymin) || vacio(sc.ymax)) throw new Error('Escribe los dos límites de y, o deja los dos vacíos para que se ajusten solos');
      y = [lee(sc, 'ymin', 'y mínimo'), lee(sc, 'ymax', 'y máximo')];
      if (!(y[1] > y[0])) throw new Error('El y máximo tiene que ser mayor que el y mínimo');
    } else y = rangoY(fun, x0, x1);
    const est = estudio(sc.f);
    const pasos = [];
    pasos.push({ t: 'Funciones', html: fun.map((q) => `$${q.k}(x) = ${q.txt}$`).join('<br>') + `<br>Ventana: $x ∈ [${f(x0)}, ${f(x1)}]$, $y ∈ [${f(y[0])}, ${f(y[1])}]$${conY ? '' : ' (automática)'}.` });
    // el estudio de f, con su título
    // (el estudio busca entre −10 y 10; el resumen solo enseña lo que cae en la ventana)
    for (const p of est.pasos.slice(1)) pasos.push({ t: `${p.t} de f`, html: p.html });
    // cortes entre cada par de curvas dentro de la ventana
    const cortes = [];
    for (let i = 0; i < fun.length; i++) for (let j = i + 1; j < fun.length; j++) {
      const a = fun[i], b = fun[j], xs = DV.raicesNum((x) => a.ev(x) - b.ev(x), x0, x1, 3000);
      for (const x of xs) cortes.push({ a: a.k, b: b.k, x, y: a.ev(x) });
    }
    if (fun.length > 1) {
      const pares = [];
      for (let i = 0; i < fun.length; i++) for (let j = i + 1; j < fun.length; j++) {
        const a = fun[i].k, b = fun[j].k, cs = cortes.filter((q) => q.a === a && q.b === b);
        pares.push(`$${a}(x) = ${b}(x)$: ${cs.length ? cs.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$`).join(', ') : 'no se cortan en la ventana'}`);
      }
      pasos.push({ t: 'Cortes entre las curvas', html: `Se resuelve $${fun[0].k}(x) − ${fun[1].k}(x) = 0$ (y lo mismo con cada par) buscando cambios de signo entre $x = ${f(x0)}$ y $x = ${f(x1)}$:<br>${pares.join('<br>')}` });
    }
    // tabla de valores: 11 puntos repartidos en la ventana
    const tabla = Array.from({ length: 11 }, (_, i) => { const x = x0 + ((x1 - x0) * i) / 10; return { x, v: fun.map((q) => q.ev(x)) }; });
    return { fun, est, cortes, x: [x0, x1], y, autoY: !conY, tabla, pasos };
  }

  const ejemplos = [
    { clave: 'racional', nombre: 'Racional con asíntota oblicua', sc: { f: '(x^2 + 1)/(x - 1)', g: '', h: '', xmin: '-6', xmax: '8', ymin: '', ymax: '' } },
    { clave: 'parabola-recta', nombre: 'Parábola y recta: dónde se cortan', sc: { f: 'x^2 - 4', g: '2x - 1', h: '', xmin: '-5', xmax: '5', ymin: '', ymax: '' } },
    { clave: 'cubica', nombre: 'Cúbica x³ − 3x', sc: { f: 'x^3 - 3x', g: '', h: '', xmin: '-3', xmax: '3', ymin: '', ymax: '' } },
    { clave: 'campana', nombre: 'Campana de Gauss e^(−x²)', sc: { f: 'e^(-x^2)', g: '', h: '', xmin: '-4', xmax: '4', ymin: '-0.2', ymax: '1.2' } },
    { clave: 'trig', nombre: 'sen x, cos x y sen x + cos x', sc: { f: 'sen(x)', g: 'cos(x)', h: 'sen(x) + cos(x)', xmin: '-pi', xmax: '2pi', ymin: '-2', ymax: '2' } },
    { clave: 'logaritmo', nombre: 'ln x / x', sc: { f: 'ln(x)/x', g: '', h: '', xmin: '0', xmax: '10', ymin: '-2', ymax: '1' } },
    { clave: 'exp-ln', nombre: 'eˣ, ln x y la recta y = x', sc: { f: 'e^x', g: 'ln(x)', h: 'x', xmin: '-4', xmax: '5', ymin: '-4', ymax: '5' } },
  ];

  return { resolver, ejemplos, NOMBRES };
})();
if (typeof module !== 'undefined') module.exports = Graficador;
