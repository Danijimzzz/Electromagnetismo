const Condensador = (() => {
  const E0 = 8.8541878128e-12;
  const PI = Math.PI;

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
  const PREF = [[1e-15, 'f'], [1e-12, 'p'], [1e-9, 'n'], [1e-6, 'µ'], [1e-3, 'm'], [1, ''], [1e3, 'k'], [1e6, 'M']];
  function conUnidad(x, u) {
    if (!isFinite(x)) return '—';
    if (x === 0) return `0 ${u}`;
    const a = Math.abs(x);
    let p = PREF[0];
    for (const q of PREF) if (a >= q[0] * 0.9999) p = q;
    return `${num(x / p[0])} ${p[1]}${u}`;
  }

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
    g.disposicion = sc.disposicion === 'paralelo' ? 'paralelo' : sc.disposicion === 'variable' ? 'variable' : 'serie';
    const capas = (sc.capas || []).filter((c) => c && String(c.er ?? '').trim() !== '');
    const regiones = [];
    const rigidez = (c, i) => { const v = String(c.rig ?? '').trim(); if (!v) return null; const k = +v.replace(',', '.'); if (!(k > 0)) throw new Error(`Capa ${i + 1}: la rigidez dieléctrica debe ser un número positivo (kV/mm)`); return k * 1e6; };
    if (g.disposicion === 'variable') {
      const e1 = +String(sc.er1 ?? '').replace(',', '.'), e2 = +String(sc.er2 ?? '').replace(',', '.');
      if (!(e1 >= 1) || !(e2 >= 1)) throw new Error('Las permitividades relativas de los extremos deben ser al menos 1');
      const x0 = sc.geo === 'plano' ? 0 : g.a, x1 = sc.geo === 'plano' ? g.d : g.b;
      g.er1 = e1; g.er2 = e2; g.erx = (x) => e1 + ((e2 - e1) * (x - x0)) / (x1 - x0);
      g.regiones = [{ desde: x0, hasta: x1, er: (e1 + e2) / 2, vacio: false, variable: true }];
      return g;
    }
    if (g.disposicion === 'serie') {
      let x = sc.geo === 'plano' ? 0 : g.a;
      const fin = sc.geo === 'plano' ? g.d : g.b;
      for (const [i, c] of capas.entries()) {
        const er = +String(c.er).replace(',', '.');
        if (!(er >= 1)) throw new Error(`Capa ${i + 1}: la permitividad relativa εr debe ser al menos 1`);
        const hasta = sc.geo === 'plano' ? x + leer(c.t, 'mm', `Capa ${i + 1}`) : leer(c.t, 'cm', `Capa ${i + 1}`);
        if (!(hasta > x + 1e-15)) throw new Error(`Capa ${i + 1}: ${sc.geo === 'plano' ? 'el espesor debe ser positivo' : 'su radio exterior debe ser mayor que el de la capa anterior'}`);
        if (hasta > fin * (1 + 1e-9)) throw new Error(`Capa ${i + 1}: no cabe entre las armaduras`);
        regiones.push({ desde: x, hasta: Math.min(hasta, fin), er, vacio: false, rig: rigidez(c, i) });
        x = Math.min(hasta, fin);
      }
      if (x < fin * (1 - 1e-12)) regiones.push({ desde: x, hasta: fin, er: 1, vacio: true });
    } else {
      let f = 0;
      for (const [i, c] of capas.entries()) {
        const er = +String(c.er).replace(',', '.'), p = +String(c.t).replace(',', '.').replace('%', '') / 100;
        if (!(er >= 1)) throw new Error(`Capa ${i + 1}: la permitividad relativa εr debe ser al menos 1`);
        if (!(p > 0)) throw new Error(`Capa ${i + 1}: escribe el porcentaje ${sc.geo === 'plano' ? 'del área' : 'de la superficie (del ángulo)'} que ocupa`);
        if (f + p > 1 + 1e-9) throw new Error(`Las capas ocupan más del 100 % ${sc.geo === 'plano' ? 'del área' : 'de la superficie'}`);
        regiones.push({ fraccion: Math.min(p, 1 - f), er, vacio: false, rig: rigidez(c, i) });
        f += p;
      }
      if (f < 1 - 1e-12) regiones.push({ fraccion: 1 - f, er: 1, vacio: true });
    }
    g.regiones = regiones;
    return g;
  }

  function capRegion(g, r, i = 0) {
    const er = r.er !== 1 ? ' ε_r' : '';
    if (g.disposicion === 'paralelo') {
      const p = r.fraccion, fr = p === 1 ? '' : ` · ${num(p)}`;
      if (g.geo === 'plano') return { C: (E0 * r.er * g.S * p) / g.d, f: `{ε_0${er} S_${i + 1}}/d` };
      if (g.geo === 'cilindro') return { C: (p * 2 * PI * E0 * r.er * g.L) / Math.log(g.b / g.a), f: `{2π ε_0${er} L}/{ln(b/a)}${fr}` };
      return { C: (p * 4 * PI * E0 * r.er * g.a * g.b) / (g.b - g.a), f: `{4π ε_0${er} a b}/{b − a}${fr}` };
    }
    if (r.variable) return capVariable(g);
    if (g.geo === 'plano') return { C: (E0 * r.er * g.S) / (r.hasta - r.desde), f: g.regiones.length === 1 ? `{ε_0${er} S}/d` : `{ε_0${er} S}/t_${i + 1}` };
    if (g.geo === 'cilindro') return { C: (2 * PI * E0 * r.er * g.L) / Math.log(r.hasta / r.desde), f: `{2π ε_0${er} L}/{ln(r_2/r_1)}` };
    return { C: (4 * PI * E0 * r.er) / (1 / r.desde - 1 / r.hasta), f: `{4π ε_0${er}}/{1/r_1 − 1/r_2}` };
  }
  function integra(fn, a, b, n = 2000) { const h = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * fn(a + i * h); return (s * h) / 3; }
  function capVariable(g) {
    const e1 = g.er1, e2 = g.er2, x0 = g.geo === 'plano' ? 0 : g.a, x1 = g.geo === 'plano' ? g.d : g.b;
    if (g.geo === 'plano') {
      if (Math.abs(e2 - e1) < 1e-12) return { C: (E0 * e1 * g.S) / g.d, f: '{ε_0 ε_r S}/d' };
      return { C: (E0 * g.S * (e2 - e1)) / (g.d * Math.log(e2 / e1)), ec: '1/C = ∫_0^d {dx}/{ε_0 ε_r(x) S}', f: '{ε_0 S (ε_2 − ε_1)}/{d ln(ε_2/ε_1)}' };
    }
    const inv = integra((x) => 1 / (E0 * g.erx(x) * area(g, x)), x0, x1);
    return { C: 1 / inv, ec: `1/C = ∫_a^b {dr}/{ε_0 ε_r(r) ${g.geo === 'cilindro' ? '2π r L' : '4π r^2'}}`, numerica: true };
  }
  function letras(g) {
    const rs = g.regiones, uno = rs.length === 1, e = (r, i) => (r.vacio ? '' : uno ? ' ε_r' : ` ε_r${i + 1}`);
    if (g.disposicion === 'variable') return g.geo === 'plano' ? (Math.abs(g.er2 - g.er1) < 1e-12 ? 'C = {ε_0 ε_r S}/d' : 'C = {ε_0 S (ε_2 − ε_1)}/{d ln(ε_2/ε_1)}') : null;
    if (g.disposicion === 'paralelo') {
      if (uno) return { plano: `C = {ε_0${e(rs[0], 0)} S}/d`, cilindro: `C = {2π ε_0${e(rs[0], 0)} L}/{ln(b/a)}`, esfera: `C = {4π ε_0${e(rs[0], 0)} a b}/{b − a}` }[g.geo];
      const suma = rs.map((r, i) => `${r.vacio ? '' : `ε_r${i + 1} `}${g.geo === 'plano' ? `S_${i + 1}` : `f_${i + 1}`}`).join(' + ');
      return { plano: `C = {ε_0 (${suma})}/d`, cilindro: `C = {2π ε_0 L (${suma})}/{ln(b/a)}`, esfera: `C = {4π ε_0 a b (${suma})}/{b − a}` }[g.geo];
    }
    if (uno) return { plano: `C = {ε_0${e(rs[0], 0)} S}/d`, cilindro: `C = {2π ε_0${e(rs[0], 0)} L}/{ln(b/a)}`, esfera: `C = {4π ε_0${e(rs[0], 0)} a b}/{b − a}` }[g.geo];
    const lim = (i) => (i === 0 ? 'a' : i === rs.length ? 'b' : `r_${i}`);
    const term = (r, i) => { const div = r.vacio ? '' : `/ε_r${i + 1}`; return g.geo === 'plano' ? `t_${i + 1}${div}` : g.geo === 'cilindro' ? (r.vacio ? `ln(${lim(i + 1)}/${lim(i)})` : `{ln(${lim(i + 1)}/${lim(i)})}${div}`) : (r.vacio ? `(1/${lim(i)} − 1/${lim(i + 1)})` : `{1/${lim(i)} − 1/${lim(i + 1)}}${div}`); };
    const suma = rs.map(term).join(' + ');
    return { plano: `C = {ε_0 S}/{${suma}}`, cilindro: `C = {2π ε_0 L}/{${suma}}`, esfera: `C = {4π ε_0}/{${suma}}` }[g.geo];
  }
  function capacidad(g) {
    const cs = g.regiones.map((r, i) => capRegion(g, r, i));
    const C = g.disposicion === 'paralelo' ? cs.reduce((s, c) => s + c.C, 0) : 1 / cs.reduce((s, c) => s + 1 / c.C, 0);
    return { C, cs };
  }
  const area = (g, r) => (g.geo === 'plano' ? g.S : g.geo === 'cilindro' ? 2 * PI * r * g.L : 4 * PI * r * r);

  function resolver(sc) {
    if (sc.tipo === 'asociacion') return asociacion(sc);
    if (sc.tipo === 'conectar') return conectar(sc);
    if (sc.tipo === 'fuerza') return fuerzaLamina(sc);
    const g = geometria(sc);
    const { C, cs } = capacidad(g);
    const vacioG = { ...g, disposicion: g.disposicion === 'variable' ? 'serie' : g.disposicion, regiones: g.disposicion === 'paralelo' ? [{ fraccion: 1, er: 1, vacio: true }] : [{ desde: g.geo === 'plano' ? 0 : g.a, hasta: g.geo === 'plano' ? g.d : g.b, er: 1, vacio: true }] };
    const C0 = capacidad(vacioG).C;
    let V, Q;
    if (sc.fuente === 'Q') { Q = leer(sc.Q, 'nC', 'La carga'); V = Q / C; }
    else { V = leer(sc.V, 'V', 'La tensión'); Q = C * V; }
    const U = 0.5 * Q * V;
    const pasos = [];
    const nombres = g.regiones.map((r, i) => (r.vacio ? 'vacío' : r.variable ? `dieléctrico (ε<sub>r</sub> de ${num(g.er1)} a ${num(g.er2)})` : `capa ${i + 1} (ε<sub>r</sub> = ${num(r.er)})`));
    const ec0 = cs[0].ec ? `$${cs[0].ec}$${cs[0].f ? ` ⇒ $C = ${cs[0].f}$` : ' (integral numérica)'}` : `$C = ${cs[0].f}$`;
    if (g.regiones.length === 1) pasos.push({ t: 'Capacidad', html: `${ec0} = <b>${conUnidad(C, 'F')}</b>` });
    else {
      pasos.push({ t: g.disposicion === 'serie' ? 'Capacidad: capas en serie' : 'Capacidad: capas en paralelo', html:
        g.regiones.map((r, i) => `$C_${i + 1} = ${cs[i].f}$ = ${conUnidad(cs[i].C, 'F')} (${nombres[i]})`).join('<br>') +
        `<br>${g.disposicion === 'serie' ? `$1/C = ${cs.map((_, i) => `1/C_${i + 1}`).join(' + ')}$` : `$C = ${cs.map((_, i) => `C_${i + 1}`).join(' + ')}$`} ⇒ <b>C = ${conUnidad(C, 'F')}</b>` });
    }
    pasos.push({ t: sc.fuente === 'Q' ? 'Tensión (condensador aislado)' : 'Carga (conectado a la batería)', html: sc.fuente === 'Q'
      ? `$V = Q/C$ = ${conUnidad(Q, 'C')} / ${conUnidad(C, 'F')} = <b>${conUnidad(V, 'V')}</b>`
      : `$Q = C V$ = ${conUnidad(C, 'F')} · ${conUnidad(V, 'V')} = <b>${conUnidad(Q, 'C')}</b>` });
    pasos.push({ t: 'Energía', html: `$U = 1/2 Q V = 1/2 C V^2$ = <b>${conUnidad(U, 'J')}</b>` });
    const regiones = g.regiones.map((r, i) => {
      const o = { ...r, nombre: nombres[i], C: cs[i].C };
      if (g.disposicion === 'paralelo') {
        const Ea = g.geo === 'plano' ? V / g.d : g.geo === 'cilindro' ? V / (g.a * Math.log(g.b / g.a)) : (V * g.b) / (g.a * (g.b - g.a));
        const Eb = g.geo === 'plano' ? Ea : g.geo === 'cilindro' ? (Ea * g.a) / g.b : (Ea * g.a * g.a) / (g.b * g.b);
        o.E1 = Ea; o.E2 = Eb; o.D1 = E0 * r.er * Ea; o.D2 = E0 * r.er * Eb; o.Q = o.C * V; o.V = V;
      } else if (r.variable) {
        o.V = V; o.D1 = Q / area(g, r.desde); o.D2 = Q / area(g, r.hasta); o.E1 = o.D1 / (E0 * g.er1); o.E2 = o.D2 / (E0 * g.er2);
        o.P1 = o.D1 * (1 - 1 / g.er1); o.P2 = o.D2 * (1 - 1 / g.er2);
        o.Qp = o.P1 * area(g, r.desde);
        return o;
      } else {
        o.V = Q / cs[i].C;
        o.D1 = Q / area(g, r.desde); o.D2 = Q / area(g, r.hasta);
        o.E1 = o.D1 / (E0 * r.er); o.E2 = o.D2 / (E0 * r.er);
      }
      o.P1 = o.D1 * (1 - 1 / r.er); o.P2 = o.D2 * (1 - 1 / r.er);
      o.Qp = r.vacio ? 0 : g.disposicion === 'paralelo' ? o.P1 * (g.geo === 'plano' ? g.S : area(g, g.a)) * r.fraccion : o.P1 * area(g, r.desde);
      return o;
    });
    if (g.disposicion === 'variable') {
      const Pm = (x) => (Q / area(g, x)) * (1 - 1 / g.erx(x)), x0 = g.regiones[0].desde, x1 = g.regiones[0].hasta, Qv = Pm(x1) * area(g, x1) - Pm(x0) * area(g, x0);
      pasos.push({ t: 'Permitividad variable', html: `$ε_r(${g.geo === 'plano' ? 'x' : 'r'}) = ${num(g.er1)} + (${num(g.er2)} − ${num(g.er1)}) ${g.geo === 'plano' ? 'x/d' : '{r − a}/{b − a}'}$: ${num(g.er1)} junto a la armadura positiva y ${num(g.er2)} junto a la negativa.` });
      pasos.push({ t: 'D, E y P', html: `Por Gauss para D, ${g.geo === 'plano' ? '$D = Q/S$' : g.geo === 'cilindro' ? '$D(r) = Q/(2π r L)$' : '$D(r) = Q/(4π r^2)$'}, sin saltos. $E = D/(ε_0 ε_r)$ cambia de ${conUnidad(regiones[0].E1, 'V/m')} a ${conUnidad(regiones[0].E2, 'V/m')} y $P = (1 − 1/ε_r) D$ de ${conUnidad(regiones[0].P1, 'C/m²')} a ${conUnidad(regiones[0].P2, 'C/m²')}.` });
      pasos.push({ t: 'Cargas de polarización', html: `En las caras: $σ_p = −P$ = ${conUnidad(-regiones[0].P1, 'C/m²')} junto a la armadura positiva y $+P$ = ${conUnidad(regiones[0].P2, 'C/m²')} junto a la negativa. Como P no es uniforme, también hay carga de polarización en volumen, $ρ_p = −∇·P$, que en total suma ${conUnidad(-Qv, 'C')}: con las de las caras, la carga de polarización total es 0.` });
    } else if (g.disposicion === 'serie') {
      pasos.push({ t: 'Desplazamiento eléctrico D', html: `Por el teorema de Gauss para D, que solo ve la carga libre: ${g.geo === 'plano' ? '$D = Q/S$' : g.geo === 'cilindro' ? '$D(r) = Q/(2π r L)$' : '$D(r) = Q/(4π r^2)$'}${g.geo === 'plano' ? ` = <b>${conUnidad(regiones[0].D1, 'C/m²')}</b>, el mismo en todas las capas` : ', continuo al pasar de una capa a otra'}.` });
      pasos.push({ t: 'Campo y polarización en cada capa', html: regiones.map((o, i) => `${o.nombre}: $E = D/(ε_0 ε_r)$ = ${g.geo === 'plano' ? conUnidad(o.E1, 'V/m') : `${conUnidad(o.E1, 'V/m')} → ${conUnidad(o.E2, 'V/m')}`}${o.vacio ? '' : `, $P = (1 − 1/ε_r) D$ = ${g.geo === 'plano' ? conUnidad(o.P1, 'C/m²') : `${conUnidad(o.P1, 'C/m²')} → ${conUnidad(o.P2, 'C/m²')}`}`}, ΔV = ${conUnidad(o.V, 'V')}`).join('<br>') });
    } else {
      const Etx = g.geo === 'plano' ? `$E = V/d$ = <b>${conUnidad(V / g.d, 'V/m')}</b>` : g.geo === 'cilindro' ? `$E(r) = V/(r ln(b/a))$, de ${conUnidad(regiones[0].E1, 'V/m')} en r = a a ${conUnidad(regiones[0].E2, 'V/m')} en r = b,` : `$E(r) = {V a b}/{(b − a) r^2}$, de ${conUnidad(regiones[0].E1, 'V/m')} en r = a a ${conUnidad(regiones[0].E2, 'V/m')} en r = b,`;
      pasos.push({ t: 'Campo en cada parte', html: `Todas las partes están a la misma tensión y E es tangente a la frontera entre dieléctricos (que es continuo), así que ${Etx} igual en todas. Cambia la carga libre: $σ = D = ε_0 ε_r E$${g.geo === 'plano' ? '' : ' (en la armadura interior)'}.<br>` + regiones.map((o) => `${o.nombre}: σ = ${conUnidad(o.D1, 'C/m²')}, Q = ${conUnidad(o.Q, 'C')}${o.vacio ? '' : `, P = ${conUnidad(o.P1, 'C/m²')}`}`).join('<br>') });
    }
    const hayDiel = g.regiones.some((r) => !r.vacio);
    if (hayDiel && g.disposicion !== 'variable') pasos.push({ t: 'Cargas de polarización', html: `En cada cara del dieléctrico aparece $σ_p = ±P$: negativa en la cara junto a la armadura positiva y positiva en la otra. ` + regiones.filter((o) => !o.vacio).map((o) => `${o.nombre}: Q<sub>p</sub> = ${conUnidad(o.Qp, 'C')}${g.geo === 'plano' ? ` (σ<sub>p</sub> = ${conUnidad(o.P1, 'C/m²')})` : ''}`).join(' · ') });
    const sigma = g.disposicion === 'paralelo' ? null : Q / (g.geo === 'plano' ? g.S : area(g, g.a));
    if (sigma !== null) pasos.push({ t: 'Carga libre en las armaduras', html: g.geo === 'plano' ? `$σ = Q/S$ = <b>${conUnidad(sigma, 'C/m²')}</b> en la positiva y −σ en la negativa.` : `En la interior $σ_a = ${g.geo === 'cilindro' ? 'Q/(2π a L)' : 'Q/(4π a^2)'}$ = <b>${conUnidad(sigma, 'C/m²')}</b>; en la exterior $σ_b = ${g.geo === 'cilindro' ? '−Q/(2π b L)' : '−Q/(4π b^2)'}$ = ${conUnidad(-Q / area(g, g.b), 'C/m²')}.` });
    let fuerza = null;
    if (g.geo === 'plano') {
      const Fp = (Q * Q) / (2 * E0 * g.S), lado = Math.sqrt(g.S);
      fuerza = { placas: Fp };
      pasos.push({ t: 'Fuerza entre las armaduras', html: `Con la carga fija, $F = −{dU}/{dx} = Q^2/(2 ε_0 S)$ = <b>${conUnidad(Fp, 'N')}</b>, de atracción (la presión electrostática es $σ^2/(2ε_0)$ = ${conUnidad(Fp / g.S, 'Pa')}). Vale así si junto a las armaduras hay vacío o aire.` });
      if (g.disposicion === 'paralelo' && g.regiones.length > 1) {
        const r1 = g.regiones[0], Fd = 0.5 * V * V * E0 * (r1.er - 1) * lado / g.d;
        fuerza.dielectrico = Fd;
        pasos.push({ t: 'Fuerza que mete el dieléctrico', html: `Si la capa 1 entra deslizando por un lado (armaduras cuadradas de lado $ℓ = √S$ = ${conUnidad(lado, 'm')}), C crece con lo que ha entrado, x: $ {dC}/{dx} = {ε_0 (ε_r − 1) ℓ}/d$. La fuerza que tira de ella hacia dentro es $F = 1/2 V^2 {dC}/{dx}$ = <b>${conUnidad(Fd, 'N')}</b>, ${sc.fuente === 'Q' ? 'que con la carga fija va bajando a medida que entra (porque V baja)' : 'constante mientras la batería mantiene V'}.` });
      }
    }
    let Vmax = null;
    if (g.regiones.some((r) => r.rig)) {
      const lista = g.regiones.map((r, i) => {
        const k = r.rig ?? (r.vacio ? 3e6 : null);
        if (!k) return null;
        const o = regiones[i], Emx = Math.max(o.E1, o.E2);
        return { nombre: o.nombre, k, Vm: (V * k) / Emx };
      }).filter(Boolean);
      const peor = lista.reduce((a, b) => (b.Vm < a.Vm ? b : a));
      Vmax = peor.Vm;
      pasos.push({ t: 'Rigidez dieléctrica', html: `El dieléctrico se rompe si el campo supera su rigidez. Como todos los campos son proporcionales a V, la tensión máxima es la que lleva el campo de la región más justa a su límite:<br>` + lista.map((x) => `${x.nombre}: rigidez ${num(x.k / 1e6)} kV/mm${x.nombre === 'vacío' ? ' (aire)' : ''} ⇒ $V_máx$ = ${conUnidad(x.Vm, 'V')}`).join('<br>') + `<br>La primera en romperse es ${peor.nombre}: <b>V<sub>máx</sub> = ${conUnidad(Vmax, 'V')}</b>${V > Vmax ? ' (¡la tensión actual ya la supera!)' : ''}.` });
    }
    let comp = null;
    if (hayDiel) {
      if (sc.fuente === 'Q') {
        const V0 = Q / C0, U0 = 0.5 * Q * V0;
        comp = { C0, Q0: Q, V0, U0, dU: U - U0 };
        pasos.push({ t: 'Al meter el dieléctrico (aislado)', html: `Sin dieléctrico C<sub>0</sub> = ${conUnidad(C0, 'F')}, V<sub>0</sub> = ${conUnidad(V0, 'V')}, U<sub>0</sub> = ${conUnidad(U0, 'J')}. La carga no cambia: la tensión baja a ${conUnidad(V, 'V')} y la energía baja ΔU = <b>${conUnidad(U - U0, 'J')}</b>: el condensador atrae al dieléctrico hacia dentro.` });
      } else {
        const Q0 = C0 * V, U0 = 0.5 * C0 * V * V;
        comp = { C0, Q0, V0: V, U0, dU: U - U0, Wbat: (Q - Q0) * V };
        pasos.push({ t: 'Al meter el dieléctrico (con la batería)', html: `Sin dieléctrico C<sub>0</sub> = ${conUnidad(C0, 'F')}, Q<sub>0</sub> = ${conUnidad(Q0, 'C')}, U<sub>0</sub> = ${conUnidad(U0, 'J')}. La tensión no cambia: la batería aporta ΔQ = ${conUnidad(Q - Q0, 'C')} y un trabajo $W = ΔQ V$ = ${conUnidad((Q - Q0) * V, 'J')}; la energía sube ΔU = <b>${conUnidad(U - U0, 'J')}</b>, la mitad de ese trabajo.` });
      }
    }
    const nota = g.regiones.length < 2 || g.disposicion === 'variable' ? '' : g.disposicion === 'paralelo' ? (g.geo === 'plano' ? 'S_i: área que ocupa cada parte.' : 'f_i: fracción de la superficie (del ángulo) que ocupa cada parte.') : g.geo === 'plano' ? 't_i: espesor de cada capa.' : 'r_i: radio donde acaba la capa i.';
    return { tipo: 'condensador', g, C, letras: letras(g), letrasNota: nota, C0, Q, V, U, sigma, fuerza, Vmax, regiones, pasos, comp, fuente: sc.fuente === 'Q' ? 'Q' : 'V' };
  }

  function fuerzaLamina(sc) {
    const a = leer(sc.a, 'cm', 'El largo'), w = leer(sc.w, 'cm', 'El ancho'), d = leer(sc.d, 'mm', 'La separación'), er = +String(sc.er ?? '').replace(',', '.'), x = leer(sc.x, 'cm', 'Lo que ha entrado');
    if (!(a > 0) || !(w > 0) || !(d > 0)) throw new Error('El largo, el ancho y la separación deben ser positivos');
    if (!(er >= 1)) throw new Error('La permitividad relativa εr debe ser al menos 1');
    if (x < 0 || x > a * (1 + 1e-9)) throw new Error('Lo que ha entrado debe estar entre 0 y el largo de las armaduras');
    const Cx = (t) => (E0 * w * (er * t + (a - t))) / d, dC = (E0 * w * (er - 1)) / d, aislado = sc.fuente === 'Q';
    const C = Cx(x), C0 = Cx(0), C1 = Cx(a);
    let V, Q;
    if (aislado) { Q = leer(sc.Q, 'nC', 'La carga'); V = Q / C; } else { V = leer(sc.V, 'V', 'La tensión'); Q = C * V; }
    const U = 0.5 * C * V * V;
    const F = (t) => (aislado ? (Q * Q * dC) / (2 * Cx(t) * Cx(t)) : 0.5 * V * V * dC);
    const Fd = F(x), Fp = U / d;
    const Ua = aislado ? (Q * Q) / (2 * C0) : 0.5 * C0 * V * V, Ub = aislado ? (Q * Q) / (2 * C1) : 0.5 * C1 * V * V;
    const dU = Ub - Ua, Wcampo = aislado ? -dU : dU, Wbat = aislado ? 0 : V * (C1 - C0) * V;
    const pasos = [];
    pasos.push({ t: 'Capacidad con la lámina a medio meter', html: `Es un condensador con una parte llena (ε<sub>r</sub>, longitud x) y otra vacía (a − x), las dos a la misma tensión: $C(x) = {ε_0 w (ε_r x + a − x)}/d$ = <b>${conUnidad(C, 'F')}</b> (vacío ${conUnidad(C0, 'F')}, toda llena ${conUnidad(C1, 'F')}). Crece de forma lineal con x: $dC/dx = {ε_0 w (ε_r − 1)}/d$ = ${num(dC)} F/m.` });
    pasos.push({ t: aislado ? 'Tensión (condensador aislado)' : 'Carga (con la batería)', html: aislado ? `$V = Q/C$ = ${conUnidad(Q, 'C')} / ${conUnidad(C, 'F')} = <b>${conUnidad(V, 'V')}</b>` : `$Q = C V$ = <b>${conUnidad(Q, 'C')}</b>` });
    pasos.push({ t: 'Energía', html: `$U = 1/2 C V^2$ = <b>${conUnidad(U, 'J')}</b>` });
    pasos.push({ t: 'Fuerza sobre el dieléctrico', html: aislado
      ? `Con la carga fija, $U = Q^2/(2C)$ y $F = −{dU}/{dx} = {Q^2}/{2 C^2} {dC}/{dx}$ = <b>${conUnidad(Fd, 'N')}</b>, hacia dentro. Equivale a $1/2 V^2 dC/dx$ con la V de ahora; como al entrar C sube y V baja, la fuerza decrece (entera vale ${conUnidad(F(a), 'N')}, recién entrando ${conUnidad(F(0), 'N')}).`
      : `Con la batería, V fija: la energía del sistema incluye la de la batería, y la fuerza es $F = +{dU}/{dx}|_V = 1/2 V^2 {dC}/{dx}$ = <b>${conUnidad(Fd, 'N')}</b>, hacia dentro y la misma en cualquier posición. (No es $−dU/dx$ del condensador solo: así saldría con signo contrario, porque la batería aporta la mitad del trabajo.)` });
    pasos.push({ t: 'Fuerza entre las placas', html: `Si acercamos o alejamos las armaduras con la lámina llenando el hueco, C ∝ 1/d y la energía va como $U ∝ ${aislado ? 'd' : '1/d'}$: $F = |dU/dd|$ = <b>${conUnidad(Fp, 'N')}</b> = U/d, de atracción. ${aislado ? 'Con la carga fija, U crece al separarlas: el trabajo exterior es el aumento de U.' : 'Con la batería, la batería pierde el doble de lo que baja U al separarlas.'}` });
    pasos.push({ t: 'Energía antes y después de meterla entera', html: `Antes (x = 0): $U_i$ = ${conUnidad(Ua, 'J')}; después (x = a): $U_f$ = ${conUnidad(Ub, 'J')}; ΔU = <b>${conUnidad(dU, 'J')}</b>. ` + (aislado
      ? `Sin batería, el campo hace el trabajo $W = −ΔU$ = ${conUnidad(Wcampo, 'J')} sobre la lámina, que es lo que baja la energía almacenada.`
      : `La batería aporta $W_{bat} = V ΔQ = V^2 (C_f − C_i)$ = ${conUnidad(Wbat, 'J')}, el doble de ΔU. La mitad sube la energía del condensador y la otra mitad, $W = ΔU$ = ${conUnidad(Wcampo, 'J')}, es el trabajo del campo sobre la lámina.`) });
    return { tipo: 'fuerza', a, w, d, er, x, C, C0, C1, Q, V, U, Fd, Fp, Ua, Ub, dU, Wcampo, Wbat, aislado, F, Cx, pasos };
  }

  const REDES = { serie: 'Todos en serie', paralelo: 'Todos en paralelo', 'serie-par': 'C₁ en serie con (C₂ ∥ C₃ ∥ …)', 'par-serie': 'C₁ en paralelo con (C₂, C₃… en serie)' };
  const sub = (i) => `C<sub>${i + 1}</sub>`;
  function asociacion(sc) {
    const red = REDES[sc.red] ? sc.red : 'serie', cs = (sc.cs || []).filter((c) => String(c ?? '').trim() !== '').map((c, i) => { const v = +String(c).replace(',', '.') * 1e-6; if (!(v > 0)) throw new Error(`${sub(i).replace(/<[^>]+>/g, '')} debe ser un número positivo (en µF)`); return v; });
    if (cs.length < 2) throw new Error('Escribe al menos dos condensadores');
    if ((red === 'serie-par' || red === 'par-serie') && cs.length < 3) throw new Error('Para esta asociación hacen falta al menos tres condensadores');
    const V = leer(sc.V, 'V', 'La tensión'), pasos = [], q = cs.map(() => 0), v = cs.map(() => 0);
    const serie = (xs) => 1 / xs.reduce((s, c) => s + 1 / c, 0), par = (xs) => xs.reduce((s, c) => s + c, 0);
    let Ceq;
    if (red === 'serie') {
      Ceq = serie(cs); const Q = Ceq * V; cs.forEach((c, i) => { q[i] = Q; v[i] = Q / c; });
      pasos.push({ t: 'Capacidad equivalente', html: `En serie se suman las inversas: $1/C_eq = ${cs.map((_, i) => `1/C_${i + 1}`).join(' + ')}$ ⇒ <b>C<sub>eq</sub> = ${conUnidad(Ceq, 'F')}</b>` });
      pasos.push({ t: 'Carga y tensiones', html: `Todos tienen la misma carga, $Q = C_eq V$ = <b>${conUnidad(Q, 'C')}</b>, y la tensión se reparte: ` + cs.map((c, i) => `$V_${i + 1} = Q/C_${i + 1}$ = ${conUnidad(v[i], 'V')}`).join(', ') + '. El más pequeño se lleva más tensión.' });
    } else if (red === 'paralelo') {
      Ceq = par(cs); cs.forEach((c, i) => { v[i] = V; q[i] = c * V; });
      pasos.push({ t: 'Capacidad equivalente', html: `En paralelo se suman: $C_eq = ${cs.map((_, i) => `C_${i + 1}`).join(' + ')}$ = <b>${conUnidad(Ceq, 'F')}</b>` });
      pasos.push({ t: 'Cargas', html: `Todos tienen la tensión V = ${conUnidad(V, 'V')}: ` + cs.map((c, i) => `$Q_${i + 1} = C_${i + 1} V$ = ${conUnidad(q[i], 'C')}`).join(', ') + `; en total Q = ${conUnidad(Ceq * V, 'C')}.` });
    } else if (red === 'serie-par') {
      const resto = cs.slice(1), Cp = par(resto); Ceq = serie([cs[0], Cp]); const Q = Ceq * V, Vp = Q / Cp;
      q[0] = Q; v[0] = Q / cs[0]; resto.forEach((c, j) => { v[j + 1] = Vp; q[j + 1] = c * Vp; });
      pasos.push({ t: 'Primero el paralelo', html: `$C_p = ${resto.map((_, j) => `C_${j + 2}`).join(' + ')}$ = ${conUnidad(Cp, 'F')}` });
      pasos.push({ t: 'Luego la serie', html: `$1/C_eq = 1/C_1 + 1/C_p$ ⇒ <b>C<sub>eq</sub> = ${conUnidad(Ceq, 'F')}</b>; $Q = C_eq V$ = ${conUnidad(Q, 'C')}` });
      pasos.push({ t: 'Cada condensador', html: `C<sub>1</sub> lleva toda la carga: $V_1 = Q/C_1$ = ${conUnidad(v[0], 'V')}. El paralelo queda a $V_p = Q/C_p$ = ${conUnidad(Vp, 'V')}: ` + resto.map((c, j) => `Q<sub>${j + 2}</sub> = ${conUnidad(q[j + 1], 'C')}`).join(', ') + '.' });
    } else {
      const resto = cs.slice(1), Cs = serie(resto); Ceq = cs[0] + Cs; const Qs = Cs * V;
      q[0] = cs[0] * V; v[0] = V; resto.forEach((c, j) => { q[j + 1] = Qs; v[j + 1] = Qs / c; });
      pasos.push({ t: 'Primero la serie', html: `$1/C_s = ${resto.map((_, j) => `1/C_${j + 2}`).join(' + ')}$ ⇒ C<sub>s</sub> = ${conUnidad(Cs, 'F')}` });
      pasos.push({ t: 'Luego el paralelo', html: `$C_eq = C_1 + C_s$ = <b>${conUnidad(Ceq, 'F')}</b>` });
      pasos.push({ t: 'Cada condensador', html: `C<sub>1</sub> está a V: Q<sub>1</sub> = ${conUnidad(q[0], 'C')}. La rama en serie lleva $Q_s = C_s V$ = ${conUnidad(Qs, 'C')} en cada uno: ` + resto.map((c, j) => `V<sub>${j + 2}</sub> = ${conUnidad(v[j + 1], 'V')}`).join(', ') + '.' });
    }
    const u = cs.map((c, i) => 0.5 * c * v[i] * v[i]), U = 0.5 * Ceq * V * V;
    pasos.push({ t: 'Energía', html: `$U = 1/2 C_eq V^2$ = <b>${conUnidad(U, 'J')}</b>, que es la suma de la de cada uno ($1/2 C_i V_i^2$).` });
    const vm = (sc.vm || []).slice(0, cs.length).map((x, i) => { const t = String(x ?? '').trim(); if (!t) return null; const k = +t.replace(',', '.'); if (!(k > 0)) throw new Error(`${sub(i).replace(/<[^>]+>/g, '')}: la tensión máxima debe ser un número positivo (en V)`); return k; });
    let ruptura = null;
    if (vm.some((k) => k)) {
      const lista = cs.map((_, i) => (vm[i] ? { i, vm: vm[i], Vred: (V * vm[i]) / v[i] } : null)).filter(Boolean), peor = lista.reduce((a, b) => (b.Vred < a.Vred ? b : a));
      ruptura = { primero: peor.i, Vmax: peor.Vred, lista, sin: cs.map((_, i) => i).filter((i) => !vm[i]) };
      pasos.push({ t: 'Qué condensador se rompe primero', html: `Las tensiones de todos son proporcionales a V (cada ${'$V_i = k_i V$'} se mantiene al subir la tensión), así que cada uno aguanta hasta $V_{máx,i} = V · V_{rotura,i}/V_i$:<br>` + lista.map((x) => `${sub(x.i)}: aguanta ${conUnidad(x.vm, 'V')} y ahora lleva ${conUnidad(v[x.i], 'V')} ⇒ ${conUnidad(x.Vred, 'V')} en la asociación`).join('<br>') + `<br>El primero en romperse es ${sub(peor.i)}: <b>V<sub>máx</sub> = ${conUnidad(peor.Vred, 'V')}</b>${V > peor.Vred ? ' (¡la tensión aplicada ya lo supera!)' : ''}.${ruptura.sin.length ? ` (No cuento ${ruptura.sin.map((i) => sub(i)).join(', ')}: sin tensión máxima.)` : ''}` });
    }
    return { tipo: 'asociacion', red, cs, V, Ceq, Q: Ceq * V, q, v, u, U, pasos, vm, ruptura };
  }

  function conectar(sc) {
    const uF = (v, n) => { const t = String(v ?? '').trim(), conU = /[A-Za-zµμ]/.test(t.replace(/e[+-]?\d+/i, '')), y = conU && typeof Herramienta !== 'undefined' ? Herramienta.leeUn(t) : undefined, x = y !== undefined ? y / 1e-6 : +t.replace(',', '.'); if (!(x > 0)) throw new Error(`${n} debe ser un número positivo (en µF; admite 10 nF, 2,2 µF…)`); return x * 1e-6; }, C1 = uF(sc.C1, 'C₁'), C2 = uF(sc.C2, 'C₂'), V1 = leer(sc.V1, 'V', 'V₁'), V2 = leer(sc.V2, 'V', 'V₂');
    const op = sc.union === 'opuesta', Q1 = C1 * V1, Q2 = C2 * V2, Qt = op ? Q1 - Q2 : Q1 + Q2, Vf = Qt / (C1 + C2), U0 = 0.5 * C1 * V1 * V1 + 0.5 * C2 * V2 * V2, Uf = (0.5 * Qt * Qt) / (C1 + C2);
    const pasos = [
      { t: 'Cargas antes de conectar', html: `$Q_1 = C_1 V_1$ = ${conUnidad(Q1, 'C')}, $Q_2 = C_2 V_2$ = ${conUnidad(Q2, 'C')}; energía $U_0 = 1/2 C_1 V_1^2 + 1/2 C_2 V_2^2$ = ${conUnidad(U0, 'J')}` },
      { t: 'Al conectarlos', html: `${op ? 'Unidas las placas de signo contrario, las cargas se compensan en parte' : 'Unidas las placas del mismo signo, la carga se reparte'} hasta que los dos quedan a la misma tensión (en paralelo). La carga se conserva: $Q = ${op ? '|Q_1 − Q_2|' : 'Q_1 + Q_2'}$ = ${conUnidad(Math.abs(Qt), 'C')}` },
      { t: 'Tensión final', html: `$V = Q/(C_1 + C_2)$ = <b>${conUnidad(Math.abs(Vf), 'V')}</b>; Q<sub>1</sub>′ = ${conUnidad(Math.abs(C1 * Vf), 'C')} y Q<sub>2</sub>′ = ${conUnidad(Math.abs(C2 * Vf), 'C')}` },
      { t: 'Energía', html: `$U = Q^2/(2(C_1 + C_2))$ = ${conUnidad(Uf, 'J')}: se pierden <b>${conUnidad(U0 - Uf, 'J')}</b> (${num((100 * (U0 - Uf)) / U0, 3)} %), que se van en calor por los cables y en radiación durante la conexión.` },
    ];
    return { tipo: 'conectar', C1, C2, V1, V2, op, Q1, Q2, Qt, Vf: Math.abs(Vf), U0, Uf, perdida: U0 - Uf, pasos };
  }

  function campo(sol, x) {
    const { g, Q } = sol;
    if (g.disposicion === 'paralelo') return g.geo === 'plano' ? sol.V / g.d : g.geo === 'cilindro' ? sol.V / (x * Math.log(g.b / g.a)) : (sol.V * g.a * g.b) / ((g.b - g.a) * x * x);
    if (g.disposicion === 'variable') return Q / area(g, x) / (E0 * g.erx(x));
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
    { clave: 'esfera-mitades', nombre: 'Esférico con dos mitades de dieléctrico', sc: { geo: 'esfera', a: '5', b: '10', disposicion: 'paralelo', capas: [{ t: '50', er: '2' }, { t: '50', er: '4' }], fuente: 'V', V: '1000' } },
    { clave: 'cilindro-sector', nombre: 'Coaxial con un cuarto lleno de dieléctrico', sc: { geo: 'cilindro', a: '1', b: '3', L: '100', disposicion: 'paralelo', capas: [{ t: '25', er: '5' }], fuente: 'V', V: '500' } },
    { clave: 'eps-variable', nombre: 'Plano con ε que crece de 2 a 6', sc: { geo: 'plano', S: '100', d: '2', disposicion: 'variable', er1: '2', er2: '6', capas: [], fuente: 'V', V: '100' } },
    { clave: 'esfera-variable', nombre: 'Esférico con ε que cambia con r', sc: { geo: 'esfera', a: '5', b: '10', disposicion: 'variable', er1: '4', er2: '2', capas: [], fuente: 'Q', Q: '20' } },
    { clave: 'rigidez', nombre: 'Tensión máxima con mica y aire', sc: { geo: 'plano', S: '50', d: '1', disposicion: 'serie', capas: [{ t: '0.5', er: '6', rig: '100' }], fuente: 'V', V: '1000' } },
    { clave: 'meter-lamina', nombre: 'Dieléctrico metido hasta la mitad', sc: { geo: 'plano', S: '100', d: '1', disposicion: 'paralelo', capas: [{ t: '50', er: '4' }], fuente: 'V', V: '200' } },
    { clave: 'asoc-serie', nombre: 'Tres condensadores en serie', sc: { tipo: 'asociacion', red: 'serie', cs: ['2', '3', '6'], V: '12' } },
    { clave: 'asoc-mixta', nombre: 'Uno en serie con dos en paralelo', sc: { tipo: 'asociacion', red: 'serie-par', cs: ['6', '2', '4'], V: '24' } },
    { clave: 'fuerza-bateria', nombre: 'Lámina que entra con la batería', sc: { tipo: 'fuerza', a: '10', w: '10', d: '1', er: '4', x: '5', fuente: 'V', V: '100' } },
    { clave: 'fuerza-aislado', nombre: 'Lámina que entra con la carga fija', sc: { tipo: 'fuerza', a: '10', w: '10', d: '1', er: '4', x: '5', fuente: 'Q', Q: '10' } },
    { clave: 'asoc-ruptura', nombre: 'Qué condensador se rompe primero', sc: { tipo: 'asociacion', red: 'serie', cs: ['2', '3', '6'], vm: ['400', '300', '150'], V: '600' } },
    { clave: 'conectar', nombre: 'Dos condensadores cargados que se conectan', sc: { tipo: 'conectar', C1: '4', V1: '100', C2: '6', V2: '0', union: 'igual' } },
  ];

  return { resolver, campo, leer, num, conUnidad, asociacion, conectar, REDES, ejemplos, E0 };
})();

