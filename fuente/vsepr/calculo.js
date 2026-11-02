/* =====================================================================
   Geometría molecular VSEPR (sin DOM): de una fórmula (o de un tipo AXₙEₘ)
   saca los dominios de electrones, la geometría electrónica y molecular,
   los ángulos, la hibridación y la polaridad, con las posiciones 3D de los
   átomos y de los pares libres para dibujarlos. Usa Formulas (leer) y
   Elementos (grupo, periodo, electronegatividad y radio) de quimica/.
     resolver(sc)  { modo: 'formula', formula } o { modo: 'axe', n, m } →
                   { tipo, sn, x, e, ele, geo, hib, ideal, real, polaridad,
                     atomos: [{ sim, v, en, central }], libres: [v], dipolo, pasos }
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     GEOMETRIAS    tabla (dominios, pares libres) → nombre, hibridación, ángulos, vectores
   Las posiciones (v) son vectores unitarios desde el átomo central.
   ===================================================================== */
const Vsepr = (() => {
  const coma = (x, d = 2) => String(+x.toFixed(d)).replace('.', ',').replace('-', '−');
  const rad = (g) => (g * Math.PI) / 180;
  const unit = (v) => { const n = Math.hypot(...v); return v.map((c) => c / n); };
  const suma = (a, b) => a.map((c, i) => c + b[i]);
  const prod = (k, a) => a.map((c) => k * c);
  const ang = (a, b) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180) / Math.PI;
  const plano = (n, ini = 0, z = 0, r = 1) => Array.from({ length: n }, (_, i) => { const t = rad(ini + (360 * i) / n); return [r * Math.cos(t), r * Math.sin(t), z]; });
  const subH = (n) => (n === 1 ? '' : `<sub>${n}</sub>`);

  /* ---------- Geometrías: clave «dominios-pares libres» ---------- */
  const ELE = { 2: 'Lineal', 3: 'Trigonal plana', 4: 'Tetraédrica', 5: 'Bipirámide trigonal', 6: 'Octaédrica', 7: 'Bipirámide pentagonal' };
  const HIB = { 2: ['sp', 'sp'], 3: ['sp<sup>2</sup>', 'sp2'], 4: ['sp<sup>3</sup>', 'sp3'], 5: ['sp<sup>3</sup>d', 'sp3d'], 6: ['sp<sup>3</sup>d<sup>2</sup>', 'sp3d2'], 7: ['sp<sup>3</sup>d<sup>3</sup>', 'sp3d3'] };
  const ORBITALES = { 2: 'un s y un p', 3: 'un s y dos p', 4: 'un s y tres p', 5: 'un s, tres p y un d', 6: 'un s, tres p y dos d', 7: 'un s, tres p y tres d' };
  const G = {
    '2-0': { nombre: 'Lineal', ideal: '180°', real: '180°', sim: true, ej: 'CO₂, BeCl₂',
      nota: 'Los dos dominios se colocan en lados opuestos, a 180°.',
      v: () => ({ enlaces: [[0, 0, 1], [0, 0, -1]], libres: [] }) },
    '3-0': { nombre: 'Trigonal plana', ideal: '120°', real: '120°', sim: true, ej: 'BF₃, SO₃, CO₃²⁻',
      nota: 'Tres dominios en un plano, a 120° unos de otros.',
      v: () => ({ enlaces: plano(3), libres: [] }) },
    '3-1': { nombre: 'Angular', ideal: '120°', real: '≈ 118° (algo menos de 120°)', sim: false, ej: 'SO₂, O₃',
      nota: 'La pareja libre ocupa más sitio que un enlace y cierra un poco el ángulo.',
      v: () => ({ enlaces: [[Math.cos(rad(180 - 59)), Math.sin(rad(180 - 59)), 0], [Math.cos(rad(180 + 59)), Math.sin(rad(180 + 59)), 0]], libres: [[1, 0, 0]] }) },
    '4-0': { nombre: 'Tetraédrica', ideal: '109,5°', real: '109,5°', sim: true, ej: 'CH₄, NH₄⁺, SO₄²⁻',
      nota: 'Cuatro dominios apuntan a los vértices de un tetraedro.',
      v: () => ({ enlaces: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(unit), libres: [] }) },
    '4-1': { nombre: 'Piramidal trigonal', ideal: '109,5°', real: '≈ 107°', sim: false, ej: 'NH₃, PCl₃, H₃O⁺',
      nota: 'Tres enlaces y una pareja libre: la pareja empuja a los enlaces y el ángulo baja de 109,5° a unos 107°.',
      v: () => { const a = Math.acos(Math.sqrt((Math.cos(rad(107)) + 0.5) / 1.5)); return { enlaces: plano(3, 0, 0).map((p) => [Math.sin(a) * p[0], Math.sin(a) * p[1], Math.cos(a)]), libres: [[0, 0, -1]] }; } },
    '4-2': { nombre: 'Angular', ideal: '109,5°', real: '≈ 104,5°', sim: false, ej: 'H₂O, H₂S, OF₂',
      nota: 'Dos parejas libres repelen más que una y cierran el ángulo hasta unos 104,5°.',
      v: () => { const t = rad(104.5 / 2), u = rad(54.75); return { enlaces: [[Math.sin(t), 0, Math.cos(t)], [-Math.sin(t), 0, Math.cos(t)]], libres: [[0, Math.sin(u), -Math.cos(u)], [0, -Math.sin(u), -Math.cos(u)]] }; } },
    '5-0': { nombre: 'Bipirámide trigonal', ideal: '90° y 120°', real: '90° (axial–ecuatorial) y 120° (ecuatorial)', sim: true, ej: 'PCl₅',
      nota: 'Dos posiciones axiales (a 180°) y tres ecuatoriales (a 120°).',
      v: () => ({ enlaces: [[0, 0, 1], [0, 0, -1], ...plano(3)], libres: [] }) },
    '5-1': { nombre: 'Balancín', ideal: '90° y 120°', real: '≈ 173° (axial–axial) y ≈ 102° (ecuatorial)', sim: false, ej: 'SF₄, TeCl₄',
      nota: 'La pareja libre se coloca en una posición ecuatorial (menos repulsiones a 90°); la forma recuerda a un balancín o tetraedro distorsionado.',
      v: () => { const t = rad(3.5), q = rad(51); return { enlaces: [[-Math.sin(t), 0, Math.cos(t)], [-Math.sin(t), 0, -Math.cos(t)], [-Math.cos(q), Math.sin(q), 0], [-Math.cos(q), -Math.sin(q), 0]], libres: [[1, 0, 0]] }; } },
    '5-2': { nombre: 'Forma de T', ideal: '90°', real: '≈ 87,5° (algo menos de 90°)', sim: false, ej: 'ClF₃, BrF₃',
      nota: 'Las dos parejas libres van en el plano ecuatorial, a 120° entre sí; los tres átomos dibujan una T.',
      v: () => { const t = rad(2.5); return { enlaces: [[Math.sin(t), 0, Math.cos(t)], [Math.sin(t), 0, -Math.cos(t)], [1, 0, 0]], libres: [[-0.5, Math.sin(rad(60)), 0], [-0.5, -Math.sin(rad(60)), 0]] }; } },
    '5-3': { nombre: 'Lineal', ideal: '180°', real: '180°', sim: true, ej: 'XeF₂, I₃⁻',
      nota: 'Las tres parejas libres ocupan el plano ecuatorial y los dos átomos quedan en los ejes: la molécula es lineal.',
      v: () => ({ enlaces: [[0, 0, 1], [0, 0, -1]], libres: plano(3) }) },
    '6-0': { nombre: 'Octaédrica', ideal: '90°', real: '90°', sim: true, ej: 'SF₆, PF₆⁻',
      nota: 'Seis dominios en los vértices de un octaedro, a 90°.',
      v: () => ({ enlaces: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], libres: [] }) },
    '6-1': { nombre: 'Pirámide cuadrada', ideal: '90°', real: '≈ 85° (algo menos de 90°)', sim: false, ej: 'BrF₅, IF₅',
      nota: 'Una pareja libre ocupa un vértice del octaedro y los cuatro átomos de la base se doblan un poco hacia el vértice opuesto.',
      v: () => { const a = rad(84.8); return { enlaces: [[0, 0, 1], ...plano(4).map((p) => [Math.sin(a) * p[0], Math.sin(a) * p[1], Math.cos(a)])], libres: [[0, 0, -1]] }; } },
    '6-2': { nombre: 'Plana cuadrada', ideal: '90°', real: '90°', sim: true, ej: 'XeF₄, ICl₄⁻',
      nota: 'Las dos parejas libres van en posiciones opuestas (a 180°, para repelerse lo menos posible) y los cuatro átomos quedan en un plano.',
      v: () => ({ enlaces: plano(4), libres: [[0, 0, 1], [0, 0, -1]] }) },
    '7-0': { nombre: 'Bipirámide pentagonal', ideal: '72° y 90°', real: '72° (ecuatorial) y 90° (axial–ecuatorial)', sim: true, ej: 'IF₇',
      nota: 'Dos posiciones axiales y cinco ecuatoriales, a 72° unas de otras.',
      v: () => ({ enlaces: [[0, 0, 1], [0, 0, -1], ...plano(5)], libres: [] }) },
  };
  for (const k of Object.keys(G)) {
    const [sn, e] = k.split('-').map(Number);
    Object.assign(G[k], { sn, e, x: sn - e, ele: ELE[sn], hib: HIB[sn][0], hibTxt: HIB[sn][1], orb: ORBITALES[sn] });
  }
  /* ---------- Elementos ---------- */
  const E = () => Elementos.porSimbolo;
  const TERMINALES = { H: 1, F: 1, Cl: 1, Br: 1, I: 1, O: 0, S: 0, Se: 0 };
  const valencia = (s) => {
    const el = E()[s];
    if (!el) throw new Error(`No conozco el elemento «${s}»`);
    if (el.grupo === null || el.grupo >= 3 && el.grupo <= 12) throw new Error(`${el.nombre} es un metal de transición o del bloque f: el modelo VSEPR de esta herramienta es para elementos de los grupos principales`);
    return el.grupo <= 2 ? el.grupo : el.grupo === 18 && el.Z === 2 ? 2 : el.grupo - 10;
  };
  const enDe = (s) => { const v = E()[s].en; if (v == null) throw new Error(`${E()[s].nombre} no tiene electronegatividad de Pauling tabulada`); return v; };
  const nombreFormula = (a, carga) => {
    const orden = Object.keys(a);
    return orden.map((s) => s + subH(a[s])).join('') + (carga ? `<sup>${Math.abs(carga) > 1 ? Math.abs(carga) : ''}${carga > 0 ? '+' : '−'}</sup>` : '');
  };
  const pares = (n) => (n === 1 ? 'par' : 'pares');

  /* ---------- Polaridad: suma vectorial de los momentos de enlace (∝ Δχ) ---------- */
  function polaridad(atomos, cen, carga, simbolica) {
    let r = [0, 0, 0];
    const enlaces = atomos.filter((a) => !a.central).map((a) => {
      const d = a.en - cen.en;
      r = suma(r, prod(d, a.v));
      return { d, a };
    });
    const mod = Math.hypot(...r);
    return { r, mod, enlaces, polar: mod > 0.05, carga, simbolica };
  }

  /* ---------- Resolver ---------- */
  function leeEntero(v, nom, min, max) {
    const t = String(v ?? '').trim();
    if (!t) throw new Error(`Falta ${nom}`);
    if (!/^\d+$/.test(t)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número entero`);
    const n = +t;
    if (n < min || n > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe estar entre ${min} y ${max}`);
    return n;
  }

  function resolver(sc) {
    return sc.modo === 'axe' ? resolverAXE(sc) : resolverFormula(sc);
  }

  function clasifica(sn, e, x) {
    const g = G[`${sn}-${e}`];
    if (!g) throw new Error(`No hay una geometría VSEPR sencilla para ${sn} dominios con ${e} ${e === 1 ? 'pareja libre' : 'parejas libres'} (AX${x === 1 ? '' : x}E${e === 1 ? '' : e})`);
    return g;
  }

  function resolverAXE(sc) {
    const x = leeEntero(sc.n, 'el número de átomos enlazados', 2, 7), e = leeEntero(sc.m, 'el número de pares libres', 0, 3), sn = x + e;
    if (sn > 7) throw new Error('Como mucho hay 7 dominios de electrones');
    const g = clasifica(sn, e, x);
    const { enlaces, libres } = g.v();
    const atomos = [{ sim: 'A', v: [0, 0, 0], en: 0, central: true }, ...enlaces.map((v) => ({ sim: 'X', v, en: 1, central: false }))];
    const pol = polaridad(atomos, atomos[0], 0, true);
    const tipo = `AX${x === 1 ? '' : x}${e === 0 ? '' : 'E' + (e === 1 ? '' : e)}`;
    const tipoHtml = `AX${subH(x)}${e === 0 ? '' : 'E' + subH(e)}`;
    const pasos = [
      { t: 'Tipo', html: `Un átomo central A con ${x} átomos X enlazados y ${e} ${e === 1 ? 'par libre' : 'pares libres'}: <b>${tipoHtml}</b>.` },
      { t: 'Dominios de electrones', html: `Dominios = ${x} + ${e} = ${sn}. Cada enlace (sencillo, doble o triple) y cada par libre cuentan como un dominio.` },
      ...pasosGeometria(g, tipoHtml, x, e),
      { t: 'Polaridad', html: pol.polar ? `Suponiendo que los X son iguales y que cada enlace A–X es polar, los momentos de enlace <b>no se anulan</b>: la molécula es polar.` : `Suponiendo que los X son iguales y que cada enlace A–X es polar, los momentos de enlace <b>se anulan</b> por simetría: la molécula es apolar.` },
    ];
    return base({ tipo, tipoHtml, sn, x, e, g, atomos, libres, pol, pasos, formula: null, carga: 0, simbolica: true });
  }

  function pasosGeometria(g, tipoHtml, x, e) {
    const o = [
      { t: 'Geometría electrónica', html: `${g.sn} dominios → disposición <b>${g.ele.toLowerCase()}</b>, la que los separa más. ${e === 0 ? '' : 'Es la forma que tendrían los dominios, contando también los pares libres.'}` },
      { t: 'Geometría molecular', html: `Solo se ven los átomos, no los pares libres: <b>${tipoHtml}</b> → <b>${g.nombre.toLowerCase()}</b>. ${g.nota}` },
      { t: 'Ángulos de enlace', html: `Ideal: ${g.ideal}. ${e === 0 ? 'Valor real: el mismo (si los átomos X son iguales).' : 'Valor típico real: ' + g.real + '.'}` },
      { t: 'Hibridación', html: `${g.sn} dominios → ${g.sn} orbitales híbridos: se mezclan ${g.orb} del átomo central → <b>${g.hib}</b>.` },
    ];
    return o;
  }

  function resolverFormula(sc) {
    if (!sc.formula || !String(sc.formula).trim()) throw new Error('Escribe una fórmula, como SF4, NH3 o SO4 2-');
    const f = Formulas.leer(sc.formula);
    if (f.electron) throw new Error('Escribe una molécula o un ion, no un electrón');
    const a = f.atomos, carga = f.carga || 0, simbolos = Object.keys(a);
    if (!simbolos.length) throw new Error('Escribe una fórmula, como SF4, NH3 o SO4 2-');
    for (const s of simbolos) if (!E()[s]) throw new Error(`No conozco el elemento «${s}»`);
    const total = simbolos.reduce((t, s) => t + a[s], 0);
    if (total < 3 && !(total === 2 && simbolos.length === 2)) throw new Error('Escribe una molécula con un átomo central y al menos dos átomos unidos a él');
    if (total === 2) throw new Error('Una molécula diatómica siempre es lineal y no tiene un átomo central; prueba con una de tres átomos o más');
    // átomo central: único con 1 átomo (salvo H y F), el menos electronegativo; I₃⁻ y similares: el halógeno
    let cands = simbolos.filter((s) => a[s] === 1 && s !== 'H' && s !== 'F');
    let cen;
    if (!cands.length) {
      if (simbolos.length === 1 && ['Cl', 'Br', 'I'].includes(simbolos[0]) && a[simbolos[0]] >= 3) cen = simbolos[0];
      else throw new Error('No encuentro un átomo central único. Esta herramienta resuelve moléculas e iones con un átomo central rodeado de átomos terminales (H, halógenos, O o S)');
    } else cen = cands.sort((p, q) => enDe(p) - enDe(q) || E()[q].Z - E()[p].Z)[0];
    const terminales = {};
    for (const s of simbolos) { const n = s === cen ? a[s] - 1 : a[s]; if (n > 0) terminales[s] = n; }
    for (const s of Object.keys(terminales)) if (!(s in TERMINALES)) throw new Error(`Con ${E()[cen].nombre.toLowerCase()} como átomo central, ${E()[s].nombre.toLowerCase()} no puede ser un átomo terminal en esta herramienta (solo H, F, Cl, Br, I, O, S y Se)`);
    if (terminales.H && cen !== 'C' && (terminales.O || terminales.S || terminales.Se)) throw new Error('En los oxoácidos (HNO₃, H₂SO₄…) el H va unido a un O, no al átomo central. Escribe su ion (NO3-, SO4 2-) o usa el tipo AXₙEₘ');
    const x = Object.values(terminales).reduce((t, n) => t + n, 0);
    const ve = valencia(cen), el = E()[cen];
    const aporta = Object.entries(terminales).reduce((t, [s, n]) => t + TERMINALES[s] * n, 0);
    const ne = ve + aporta - carga;
    if (ne % 2) throw new Error(`Salen ${ne} electrones alrededor del átomo central, un número impar (radical): el modelo VSEPR de esta herramienta es para moléculas con pares de electrones`);
    const sn = ne / 2, e = sn - x;
    if (e < 0) throw new Error(`Salen ${sn} dominios de electrones y ${x} átomos enlazados: hay más átomos que dominios. Revisa la fórmula o la carga`);
    if (sn > 4 && el.periodo === 2) throw new Error(`${el.nombre} es del periodo 2 y no puede tener más de 4 dominios (no expande el octeto): revisa la fórmula`);
    const g = clasifica(sn, e, x);
    const { enlaces, libres } = g.v();
    // ordena los terminales: primero los que más pesan para que se vean los distintos
    const lista = [];
    for (const [s, n] of Object.entries(terminales)) for (let i = 0; i < n; i++) lista.push(s);
    // reparte los terminales en las posiciones: en 5-0 y 5-1 los más electronegativos van a las axiales (regla de Bent)
    if (sn === 5 && e === 0 || sn === 5 && e === 1) lista.sort((p, q) => enDe(q) - enDe(p));
    // en 7-0 y 6-1, el distinto va al vértice apical
    if ((sn === 6 && e === 1) || sn === 7) lista.sort((p, q) => enDe(q) - enDe(p));
    const atomos = [{ sim: cen, v: [0, 0, 0], en: enDe(cen), central: true }, ...enlaces.map((v, i) => ({ sim: lista[i], v, en: enDe(lista[i]), central: false }))];
    const pol = polaridad(atomos, atomos[0], carga, false);
    const tipo = `AX${x === 1 ? '' : x}${e === 0 ? '' : 'E' + (e === 1 ? '' : e)}`;
    const tipoHtml = `AX${subH(x)}${e === 0 ? '' : 'E' + subH(e)}`;
    const nom = nombreFormula(a, carga);
    const terminalesTxt = Object.entries(terminales).map(([s, n]) => `${n} × ${s}`).join(' y ');
    const contrib = Object.entries(terminales).map(([s, n]) => TERMINALES[s] ? `${n} × ${s} aporta${n === 1 ? '' : 'n'} ${n} e⁻ (enlace sencillo)` : `${n} × ${s} no ${n === 1 ? 'aporta' : 'aportan'} ninguno (enlace doble: pone sus electrones el propio ${s})`).join('; ');
    const pasos = [
      { t: 'Átomo central', html: `En ${nom} el átomo central es <b>${cen}</b> (${el.nombre.toLowerCase()}, χ = ${coma(el.en)}): el único menos electronegativo, rodeado de ${terminalesTxt}.` },
      { t: 'Electrones del átomo central', html: `${cen} está en el grupo ${el.grupo} → ${ve} electrones de valencia. ${contrib}.${carga ? ` Carga ${carga > 0 ? '+' : '−'}${Math.abs(carga)}: ${carga > 0 ? 'se quitan' : 'se añaden'} ${Math.abs(carga)} e⁻.` : ''} Total: ${ve} + ${aporta}${carga ? (carga > 0 ? ' − ' : ' + ') + Math.abs(carga) : ''} = <b>${ne} e⁻</b> = ${sn} ${pares(sn)}.` },
      { t: 'Dominios', html: `Dominios = ${ne}/2 = <b>${sn}</b>, de los que ${x} ${x === 1 ? 'es un átomo enlazado' : 'son átomos enlazados'} (X) y ${e} ${e === 1 ? 'es un par libre' : 'son pares libres'} (E) → tipo <b>${tipoHtml}</b>.` },
      ...pasosGeometria(g, tipoHtml, x, e),
    ];
    // polaridad
    let pl;
    if (carga) pl = `${nom} es un ion: se habla de la distribución de su carga y no de molécula polar o apolar. La suma de los momentos de enlace sería ${pol.mod < 0.05 ? 'nula (reparto simétrico)' : 'no nula'}.`;
    else {
      const lineas = pol.enlaces.reduce((m, b) => { const k = `${b.a.sim}`; if (!m.has(k)) m.set(k, b); return m; }, new Map());
      const det = [...lineas.values()].map((b) => `${cen}–${b.a.sim}: Δχ = |${coma(b.a.en)} − ${coma(el.en)}| = ${coma(Math.abs(b.d))}${Math.abs(b.d) < 0.4 ? ' (casi apolar)' : ' (polar)'}`).join('; ');
      pl = `${det}. Se suman como vectores (hacia el átomo más electronegativo): ${pol.mod < 0.05 ? '<b>se anulan</b> por la simetría' : '<b>no se anulan</b>'}${pol.mod < 0.05 || !g.sim ? '' : ' (los átomos X no son todos iguales)'} → molécula <b>${pol.polar ? 'polar' : 'apolar'}</b>.`;
    }
    pasos.push({ t: 'Polaridad', html: pl });
    return base({ tipo, tipoHtml, sn, x, e, g, atomos, libres, pol, pasos, formula: nom, carga, simbolica: false });
  }

  function base({ tipo, tipoHtml, sn, x, e, g, atomos, libres, pol, pasos, formula, carga, simbolica }) {
    const polaridad = carga ? 'Ion' : pol.polar ? 'Polar' : 'Apolar';
    return {
      tipo, tipoHtml, sn, x, e, ele: g.ele, geo: g.nombre, hib: g.hib, hibTxt: g.hibTxt, ideal: g.ideal, real: g.real, ejemplos: g.ej, nota: g.nota,
      polaridad, polar: pol.polar, mu: pol.mod, carga, formula, simbolica, atomos, libres,
      dipolo: pol.mod > 0.05 ? unit(pol.r) : null, pasos,
    };
  }

  /* ---------- Ejemplos ---------- */
  const ex = (clave, nombre, formula) => ({ clave, nombre, sc: { modo: 'formula', formula } });
  const ejemplos = [
    ex('h2o', 'Agua, H₂O (AX₂E₂)', 'H2O'),
    ex('nh3', 'Amoníaco, NH₃ (AX₃E)', 'NH3'),
    ex('ch4', 'Metano, CH₄ (AX₄)', 'CH4'),
    ex('co2', 'Dióxido de carbono, CO₂ (AX₂)', 'CO2'),
    ex('bf3', 'Trifluoruro de boro, BF₃ (AX₃)', 'BF3'),
    ex('so2', 'Dióxido de azufre, SO₂ (AX₂E)', 'SO2'),
    ex('pcl5', 'Pentacloruro de fósforo, PCl₅ (AX₅)', 'PCl5'),
    ex('sf4', 'Tetrafluoruro de azufre, SF₄ (AX₄E)', 'SF4'),
    ex('clf3', 'Trifluoruro de cloro, ClF₃ (AX₃E₂)', 'ClF3'),
    ex('xef2', 'Difluoruro de xenón, XeF₂ (AX₂E₃)', 'XeF2'),
    ex('sf6', 'Hexafluoruro de azufre, SF₆ (AX₆)', 'SF6'),
    ex('brf5', 'Pentafluoruro de bromo, BrF₅ (AX₅E)', 'BrF5'),
    ex('xef4', 'Tetrafluoruro de xenón, XeF₄ (AX₄E₂)', 'XeF4'),
    ex('cocl2', 'Fosgeno, COCl₂ (AX₃, polar)', 'COCl2'),
    ex('pcl3', 'Tricloruro de fósforo, PCl₃ (AX₃E)', 'PCl3'),
    ex('chcl3', 'Cloroformo, CHCl₃ (AX₄ polar)', 'CHCl3'),
    ex('ccl4', 'Tetracloruro de carbono, CCl₄ (AX₄ apolar)', 'CCl4'),
    ex('nh4', 'Ion amonio, NH₄⁺', 'NH4+'),
    ex('so4', 'Ion sulfato, SO₄²⁻', 'SO4 2-'),
    ex('no3', 'Ion nitrato, NO₃⁻', 'NO3-'),
    ex('clo3', 'Ion clorato, ClO₃⁻', 'ClO3-'),
    ex('i3', 'Ion triyoduro, I₃⁻', 'I3^-'),
    { clave: 'ax3e', nombre: 'Tipo AX₃E (sin átomos concretos)', sc: { modo: 'axe', n: '3', m: '1' } },
  ];

  return { resolver, ejemplos, GEOMETRIAS: G, ELE, HIB, ang, coma };
})();
if (typeof module !== 'undefined') module.exports = Vsepr;
