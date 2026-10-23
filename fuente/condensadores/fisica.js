/* =====================================================================
   Condensadores y dieléctricos (sin DOM): condensador plano, cilíndrico o
   esférico con capas de dieléctrico en serie (una tras otra en el sentido
   del campo) o, en el plano, en paralelo (cada una ocupa parte del área).
   Capacidad, carga, tensión, energía, campos E, D y P en cada capa y cargas
   de polarización, comparado con el condensador vacío. Unidades del SI.
   ===================================================================== */
const Condensador = (() => {
  const E0 = 8.8541878128e-12;
  const PI = Math.PI;

  // número con coma decimal y 4 cifras; potencias de 10 como superíndice
  function num(x, cifras = 4) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-2) {
      const [m, e] = x.toExponential(cifras - 1).split('e');
      return `${String(+m).replace('.', ',').replace('-', '−')}·10<sup>${(+e).toString().replace('-', '−')}</sup>`;
    }
    return String(+x.toPrecision(cifras)).replace('.', ',').replace('-', '−');
  }
  // magnitud con el prefijo más cómodo: 1,2 nF, 35 µJ…
  const PREF = [[1e-15, 'f'], [1e-12, 'p'], [1e-9, 'n'], [1e-6, 'µ'], [1e-3, 'm'], [1, ''], [1e3, 'k'], [1e6, 'M']];
  function conUnidad(x, u) {
    if (!isFinite(x)) return '—';
    if (x === 0) return `0 ${u}`;
    const a = Math.abs(x);
    let p = PREF[0];
    for (const q of PREF) if (a >= q[0] * 0.9999) p = q;
    return `${num(x / p[0])} ${p[1]}${u}`;
  }

  // lee un número con unidad opcional: «2 mm», «3,5cm», «1e-3» (en la unidad por defecto)
  const FAC = { m: 1, dm: 0.1, cm: 1e-2, mm: 1e-3, 'µm': 1e-6, um: 1e-6, 'm2': 1, 'dm2': 1e-2, 'cm2': 1e-4, 'mm2': 1e-6, 'm²': 1, 'dm²': 1e-2, 'cm²': 1e-4, 'mm²': 1e-6,
    V: 1, kV: 1e3, mV: 1e-3, C: 1, mC: 1e-3, 'µC': 1e-6, uC: 1e-6, nC: 1e-9, pC: 1e-12 };
  function leer(valor, porDefecto, nombre) {
    const t = String(valor ?? '').trim().replace(',', '.');
    const m = t.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-Zµ²2]*)$/i);
    if (!m) throw new Error(`${nombre}: escribe un número${porDefecto ? ` (en ${porDefecto})` : ''}`);
    const u = m[2] || porDefecto;
    if (!(u in FAC)) throw new Error(`${nombre}: no conozco la unidad «${m[2]}»`);
    return +m[1] * FAC[u];
  }

  /* ---------- Regiones del condensador ---------- */
  // sc: { geo, S, d, a, b, L, disposicion: 'serie' | 'paralelo', capas: [{ t | f, er }], fuente: 'V' | 'Q', V, Q }
  // En serie cada capa da su espesor (plano) o su radio exterior (cilindro y esfera) y lo que falta hasta la
  // otra armadura es vacío. En paralelo (solo plano) cada capa da el porcentaje del área que ocupa.
  function geometria(sc) {
    const g = { geo: sc.geo };
    if (sc.geo === 'plano') {
      g.S = leer(sc.S, 'cm2', 'El área'); g.d = leer(sc.d, 'mm', 'La separación');
      if (!(g.S > 0) || !(g.d > 0)) throw new Error('El área y la separación deben ser positivas');
    } else {
      g.a = leer(sc.a, 'cm', 'El radio interior'); g.b = leer(sc.b, 'cm', 'El radio exterior');
      if (!(g.a > 0) || !(g.b > g.a)) throw new Error('El radio exterior debe ser mayor que el interior, y los dos positivos');
      if (sc.geo === 'cilindro') { g.L = leer(sc.L, 'cm', 'La longitud'); if (!(g.L > 0)) throw new Error('La longitud debe ser positiva'); }
    }
    g.disposicion = sc.geo === 'plano' && sc.disposicion === 'paralelo' ? 'paralelo' : 'serie';
    const capas = (sc.capas || []).filter((c) => c && String(c.er ?? '').trim() !== '');
    const regiones = [];
    if (g.disposicion === 'serie') {
      let x = sc.geo === 'plano' ? 0 : g.a;
      const fin = sc.geo === 'plano' ? g.d : g.b;
      for (const [i, c] of capas.entries()) {
        const er = +String(c.er).replace(',', '.');
        if (!(er >= 1)) throw new Error(`Capa ${i + 1}: la permitividad relativa εr debe ser al menos 1`);
        const hasta = sc.geo === 'plano' ? x + leer(c.t, 'mm', `Capa ${i + 1}`) : leer(c.t, 'cm', `Capa ${i + 1}`);
        if (!(hasta > x + 1e-15)) throw new Error(`Capa ${i + 1}: ${sc.geo === 'plano' ? 'el espesor debe ser positivo' : 'su radio exterior debe ser mayor que el de la capa anterior'}`);
        if (hasta > fin * (1 + 1e-9)) throw new Error(`Capa ${i + 1}: no cabe entre las armaduras`);
        regiones.push({ desde: x, hasta: Math.min(hasta, fin), er, vacio: false });
        x = Math.min(hasta, fin);
      }
      if (x < fin * (1 - 1e-12)) regiones.push({ desde: x, hasta: fin, er: 1, vacio: true });
    } else {
      let f = 0;
      for (const [i, c] of capas.entries()) {
        const er = +String(c.er).replace(',', '.'), p = +String(c.t).replace(',', '.').replace('%', '') / 100;
        if (!(er >= 1)) throw new Error(`Capa ${i + 1}: la permitividad relativa εr debe ser al menos 1`);
        if (!(p > 0)) throw new Error(`Capa ${i + 1}: escribe el porcentaje del área que ocupa`);
        if (f + p > 1 + 1e-9) throw new Error('Las capas ocupan más del 100 % del área');
        regiones.push({ fraccion: Math.min(p, 1 - f), er, vacio: false });
        f += p;
      }
      if (f < 1 - 1e-12) regiones.push({ fraccion: 1 - f, er: 1, vacio: true });
    }
    g.regiones = regiones;
    return g;
  }

  // capacidad de una región y su fórmula
  function capRegion(g, r) {
    if (g.disposicion === 'paralelo') return { C: (E0 * r.er * g.S * r.fraccion) / g.d, f: `ε<sub>0</sub>${r.er !== 1 ? ' ε<sub>r</sub>' : ''} S<sub>i</sub> / d` };
    if (g.geo === 'plano') return { C: (E0 * r.er * g.S) / (r.hasta - r.desde), f: `ε<sub>0</sub>${r.er !== 1 ? ' ε<sub>r</sub>' : ''} S / t` };
    if (g.geo === 'cilindro') return { C: (2 * PI * E0 * r.er * g.L) / Math.log(r.hasta / r.desde), f: `2π ε<sub>0</sub>${r.er !== 1 ? ' ε<sub>r</sub>' : ''} L / ln(r<sub>2</sub>/r<sub>1</sub>)` };
    return { C: (4 * PI * E0 * r.er) / (1 / r.desde - 1 / r.hasta), f: `4π ε<sub>0</sub>${r.er !== 1 ? ' ε<sub>r</sub>' : ''} / (1/r<sub>1</sub> − 1/r<sub>2</sub>)` };
  }
  function capacidad(g) {
    const cs = g.regiones.map((r) => capRegion(g, r));
    const C = g.disposicion === 'paralelo' ? cs.reduce((s, c) => s + c.C, 0) : 1 / cs.reduce((s, c) => s + 1 / c.C, 0);
    return { C, cs };
  }
  // superficie atravesada por el campo a distancia r (o en el plano)
  const area = (g, r) => (g.geo === 'plano' ? g.S : g.geo === 'cilindro' ? 2 * PI * r * g.L : 4 * PI * r * r);

  /* ---------- Resolución ---------- */
  function resolver(sc) {
    const g = geometria(sc);
    const { C, cs } = capacidad(g);
    const vacioG = { ...g, regiones: g.disposicion === 'paralelo' ? [{ fraccion: 1, er: 1, vacio: true }] : [{ desde: g.geo === 'plano' ? 0 : g.a, hasta: g.geo === 'plano' ? g.d : g.b, er: 1, vacio: true }] };
    const C0 = capacidad(vacioG).C;
    let V, Q;
    if (sc.fuente === 'Q') { Q = leer(sc.Q, 'nC', 'La carga'); V = Q / C; }
    else { V = leer(sc.V, 'V', 'La tensión'); Q = C * V; }
    const U = 0.5 * Q * V;
    const pasos = [];
    const nombres = g.regiones.map((r, i) => (r.vacio ? 'vacío' : `capa ${i + 1} (ε<sub>r</sub> = ${num(r.er)})`));
    // capacidad
    if (g.regiones.length === 1) pasos.push({ t: 'Capacidad', html: `C = ${cs[0].f} = <b>${conUnidad(C, 'F')}</b>` });
    else {
      pasos.push({ t: g.disposicion === 'serie' ? 'Capacidad: capas en serie' : 'Capacidad: capas en paralelo', html:
        g.regiones.map((r, i) => `C<sub>${i + 1}</sub> = ${cs[i].f} = ${conUnidad(cs[i].C, 'F')} (${nombres[i]})`).join('<br>') +
        `<br>${g.disposicion === 'serie' ? `1/C = ${cs.map((_, i) => `1/C<sub>${i + 1}</sub>`).join(' + ')}` : `C = ${cs.map((_, i) => `C<sub>${i + 1}</sub>`).join(' + ')}`} ⇒ <b>C = ${conUnidad(C, 'F')}</b>` });
    }
    pasos.push({ t: sc.fuente === 'Q' ? 'Tensión (condensador aislado)' : 'Carga (conectado a la batería)', html: sc.fuente === 'Q'
      ? `V = Q / C = ${conUnidad(Q, 'C')} / ${conUnidad(C, 'F')} = <b>${conUnidad(V, 'V')}</b>`
      : `Q = C V = ${conUnidad(C, 'F')} · ${conUnidad(V, 'V')} = <b>${conUnidad(Q, 'C')}</b>` });
    pasos.push({ t: 'Energía', html: `U = ½ Q V = ½ C V<sup>2</sup> = <b>${conUnidad(U, 'J')}</b>` });
    // campos en cada región
    const regiones = g.regiones.map((r, i) => {
      const o = { ...r, nombre: nombres[i], C: cs[i].C };
      if (g.disposicion === 'paralelo') {
        o.E1 = o.E2 = V / g.d; o.D1 = o.D2 = E0 * r.er * o.E1; o.Q = o.D1 * g.S * r.fraccion; o.V = V;
      } else {
        o.V = Q / cs[i].C;
        o.D1 = Q / area(g, r.desde); o.D2 = Q / area(g, r.hasta);
        o.E1 = o.D1 / (E0 * r.er); o.E2 = o.D2 / (E0 * r.er);
      }
      o.P1 = o.D1 * (1 - 1 / r.er); o.P2 = o.D2 * (1 - 1 / r.er);
      // carga de polarización en las caras: −P en la cara del lado positivo, +P en la del negativo
      o.Qp = r.vacio ? 0 : g.disposicion === 'paralelo' ? o.P1 * g.S * r.fraccion : o.P1 * area(g, r.desde);
      return o;
    });
    if (g.disposicion === 'serie') {
      pasos.push({ t: 'Desplazamiento eléctrico D', html: `Por el teorema de Gauss para D, que solo ve la carga libre: ${g.geo === 'plano' ? 'D = Q / S' : g.geo === 'cilindro' ? 'D(r) = Q / (2π r L)' : 'D(r) = Q / (4π r<sup>2</sup>)'}${g.geo === 'plano' ? ` = <b>${conUnidad(regiones[0].D1, 'C/m²')}</b>, el mismo en todas las capas` : ', continuo al pasar de una capa a otra'}.` });
      pasos.push({ t: 'Campo y polarización en cada capa', html: regiones.map((o, i) => `${o.nombre}: E = D / (ε<sub>0</sub> ε<sub>r</sub>) = ${g.geo === 'plano' ? conUnidad(o.E1, 'V/m') : `${conUnidad(o.E1, 'V/m')} → ${conUnidad(o.E2, 'V/m')}`}${o.vacio ? '' : `, P = (1 − 1/ε<sub>r</sub>) D = ${g.geo === 'plano' ? conUnidad(o.P1, 'C/m²') : `${conUnidad(o.P1, 'C/m²')} → ${conUnidad(o.P2, 'C/m²')}`}`}, ΔV = ${conUnidad(o.V, 'V')}`).join('<br>') });
    } else {
      pasos.push({ t: 'Campo en cada parte', html: `Todas las partes están a la misma tensión, así que E = V / d = <b>${conUnidad(V / g.d, 'V/m')}</b> en todas. Cambia la carga libre: σ = D = ε<sub>0</sub> ε<sub>r</sub> E.<br>` + regiones.map((o) => `${o.nombre}: σ = ${conUnidad(o.D1, 'C/m²')}, Q = ${conUnidad(o.Q, 'C')}${o.vacio ? '' : `, P = ${conUnidad(o.P1, 'C/m²')}`}`).join('<br>') });
    }
    const hayDiel = g.regiones.some((r) => !r.vacio);
    if (hayDiel) pasos.push({ t: 'Cargas de polarización', html: `En cada cara del dieléctrico aparece σ<sub>p</sub> = ±P: negativa en la cara junto a la armadura positiva y positiva en la otra. ` + regiones.filter((o) => !o.vacio).map((o) => `${o.nombre}: Q<sub>p</sub> = ${conUnidad(o.Qp, 'C')}${g.geo === 'plano' ? ` (σ<sub>p</sub> = ${conUnidad(o.P1, 'C/m²')})` : ''}`).join(' · ') });
    // comparación con el condensador vacío
    let comp = null;
    if (hayDiel) {
      if (sc.fuente === 'Q') {
        const V0 = Q / C0, U0 = 0.5 * Q * V0;
        comp = { C0, Q0: Q, V0, U0, dU: U - U0 };
        pasos.push({ t: 'Al meter el dieléctrico (aislado)', html: `Sin dieléctrico C<sub>0</sub> = ${conUnidad(C0, 'F')}, V<sub>0</sub> = ${conUnidad(V0, 'V')}, U<sub>0</sub> = ${conUnidad(U0, 'J')}. La carga no cambia: la tensión baja a ${conUnidad(V, 'V')} y la energía baja ΔU = <b>${conUnidad(U - U0, 'J')}</b>: el condensador atrae al dieléctrico hacia dentro.` });
      } else {
        const Q0 = C0 * V, U0 = 0.5 * C0 * V * V;
        comp = { C0, Q0, V0: V, U0, dU: U - U0, Wbat: (Q - Q0) * V };
        pasos.push({ t: 'Al meter el dieléctrico (con la batería)', html: `Sin dieléctrico C<sub>0</sub> = ${conUnidad(C0, 'F')}, Q<sub>0</sub> = ${conUnidad(Q0, 'C')}, U<sub>0</sub> = ${conUnidad(U0, 'J')}. La tensión no cambia: la batería aporta ΔQ = ${conUnidad(Q - Q0, 'C')} y un trabajo W = ΔQ · V = ${conUnidad((Q - Q0) * V, 'J')}; la energía sube ΔU = <b>${conUnidad(U - U0, 'J')}</b>, la mitad de ese trabajo.` });
      }
    }
    return { g, C, C0, Q, V, U, regiones, pasos, comp, fuente: sc.fuente === 'Q' ? 'Q' : 'V' };
  }

  // campo E en una posición x (plano, desde la armadura positiva) o r (cilindro y esfera), para la gráfica
  function campo(sol, x) {
    const { g, Q } = sol;
    if (g.disposicion === 'paralelo') return sol.V / g.d;
    const r = sol.regiones.find((o) => x >= o.desde - 1e-15 && x <= o.hasta + 1e-15) || sol.regiones[sol.regiones.length - 1];
    return Q / area(g, x) / (E0 * r.er);
  }

  const ejemplos = [
    { clave: 'plano-lleno', nombre: 'Plano lleno de vidrio, con batería', sc: { geo: 'plano', S: '100', d: '2', disposicion: 'serie', capas: [{ t: '2', er: '5' }], fuente: 'V', V: '100' } },
    { clave: 'plano-lamina', nombre: 'Plano con una lámina, aislado', sc: { geo: 'plano', S: '200', d: '4', disposicion: 'serie', capas: [{ t: '2', er: '4' }], fuente: 'Q', Q: '10' } },
    { clave: 'plano-mitad', nombre: 'Plano medio lleno a lo ancho (paralelo)', sc: { geo: 'plano', S: '100', d: '1', disposicion: 'paralelo', capas: [{ t: '50', er: '3' }], fuente: 'V', V: '50' } },
    { clave: 'dos-capas', nombre: 'Plano con dos dieléctricos en serie', sc: { geo: 'plano', S: '50', d: '3', disposicion: 'serie', capas: [{ t: '1', er: '2' }, { t: '2', er: '6' }], fuente: 'V', V: '200' } },
    { clave: 'coaxial', nombre: 'Cable coaxial con polietileno', sc: { geo: 'cilindro', a: '0.1', b: '0.35', L: '100', capas: [{ t: '0.35', er: '2.3' }], fuente: 'V', V: '1000' } },
    { clave: 'esferico', nombre: 'Esférico con una corteza de dieléctrico', sc: { geo: 'esfera', a: '5', b: '10', capas: [{ t: '7', er: '3' }], fuente: 'Q', Q: '20' } },
  ];

  return { resolver, campo, leer, num, conUnidad, ejemplos, E0 };
})();
if (typeof module !== 'undefined') module.exports = Condensador;
