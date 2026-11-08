/* =====================================================================
   Estructuras de Lewis (sin DOM) para la herramienta de geometría VSEPR:
   enlaces, pares libres, cargas formales, resonancia y orden de enlace, y
   la geometría de cada átomo con varios vecinos (VS-1 y VS-3). Usa Elementos
   (grupo, periodo, electronegatividad) y Vsepr.GEOMETRIAS.
     centro(sim, terminales, carga, octeto)
         un átomo central rodeado de terminales (H, halógenos, O, S, Se):
         reparte los electrones y baja las cargas formales con dobles enlaces.
         Con octeto = true el central del periodo 3 o más no pasa de 8 e⁻.
     condensada(texto)
         molécula con varios centros escrita en forma semidesarrollada:
         CH3-CH2-OH, CH2=CH2, H-C#C-H, CH3-C(=O)-OH… (- = # ≡ y paréntesis
         para las ramas; no admite anillos)
   Las dos devuelven { atomos, enlaces, centros, resonancia, ordenes, pasos,
   svg, texto } y lanzan Error con un mensaje claro si no cuadra.
   ===================================================================== */
const Lewis = (() => {
  const E = () => Elementos.porSimbolo;
  const coma = (x) => String(+x.toFixed(2)).replace('.', ',');
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => String(n).replace(/\d/g, (d) => SUBS[d]);
  const signo = (q) => (q === 0 ? '0' : (q > 0 ? '+' : '−') + (Math.abs(q) === 1 ? '' : Math.abs(q)));
  const ve = (s) => {
    const el = E()[s];
    if (!el) throw new Error(`No conozco el elemento «${s}»`);
    if (el.grupo == null || (el.grupo >= 3 && el.grupo <= 12)) throw new Error(`${el.nombre} no es un elemento de los grupos principales`);
    return el.grupo <= 2 ? el.grupo : el.grupo === 18 && el.Z === 2 ? 2 : el.grupo - 10;
  };
  // enlaces que suelen hacer los átomos en moléculas neutras (para avisar de fórmulas imposibles)
  const VAL = { H: [1], C: [4], N: [3], O: [2], F: [1], Cl: [1], Br: [1], I: [1], S: [2, 4, 6], P: [3, 5], B: [3], Se: [2, 4, 6], Si: [4], As: [3, 5] };
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));

  const nuevo = (sim) => ({ sim, ve: ve(sim), en: [], lp: 0, fc: 0 });
  const enlaza = (at, i, j, o) => { at[i].en.push({ j, o }); at[j].en.push({ j: i, o }); };
  const orden = (a) => a.en.reduce((t, b) => t + b.o, 0);
  const cargaFormal = (a) => a.ve - 2 * a.lp - orden(a);

  /* ---------- Un átomo central ---------- */
  function centro(cen, terminales, carga = 0, octeto = false) {
    const el = E()[cen];
    const at = [nuevo(cen), ...terminales.map(nuevo)];
    for (let i = 1; i < at.length; i++) enlaza(at, 0, i, 1);
    const total = at.reduce((t, a) => t + a.ve, 0) - carga;
    for (let i = 1; i < at.length; i++) at[i].lp = at[i].sim === 'H' ? 0 : 3;
    const resto = total - 2 * (at.length - 1) - 2 * at.slice(1).reduce((t, a) => t + a.lp, 0);
    if (resto < 0) throw new Error(`Con ${total} electrones no alcanza para completar el octeto de los átomos terminales: revisa la fórmula o la carga`);
    if (resto % 2) throw new Error(`Salen ${resto} electrones sueltos en el átomo central, un número impar (radical): la estructura de Lewis de esta herramienta es para moléculas con pares de electrones`);
    at[0].lp = resto / 2;
    const inicial = at.map(cargaFormal);
    const expande = el.periodo >= 3 && !octeto;
    const dobles = [];
    for (;;) {
      const c = at[0], elec = 2 * orden(c) + 2 * c.lp;
      if (!expande && elec + 2 > 8) break;
      let mejor = -1;
      for (let i = 1; i < at.length; i++) {
        const t = at[i];
        if (!['O', 'S', 'Se'].includes(t.sim) || t.lp < 1 || t.en[0].o >= 2) continue;
        const d = Math.abs(cargaFormal(c) - 1) - Math.abs(cargaFormal(c)) + Math.abs(cargaFormal(t) + 1) - Math.abs(cargaFormal(t));
        if (d < 0 && (mejor < 0 || cargaFormal(t) < cargaFormal(at[mejor]))) mejor = i;
      }
      if (mejor < 0) break;
      at[mejor].lp -= 1; at[mejor].en[0].o = 2; c.en.find((b) => b.j === mejor).o = 2; dobles.push(mejor);
    }
    for (const a of at) a.fc = cargaFormal(a);
    // resonancia: reparto de los dobles enlaces entre terminales iguales
    let resonancia = 1; const ordenes = [];
    const grupos = {};
    for (let i = 1; i < at.length; i++) (grupos[at[i].sim] = grupos[at[i].sim] || []).push(at[i].en[0].o);
    for (const [s, os] of Object.entries(grupos)) {
      const cuenta = {}; for (const o of os) cuenta[o] = (cuenta[o] || 0) + 1;
      resonancia *= fact(os.length) / Object.values(cuenta).reduce((t, m) => t * fact(m), 1);
      if (s !== 'H') ordenes.push({ par: `${cen}–${s}`, medio: os.reduce((t, o) => t + o, 0) / os.length, n: os.length });
    }
    const nom = nombre(at, carga);
    const nd = dobles.length, nf = at.slice(1).filter((a) => a.fc !== 0).length;
    const pasos = [
      { t: 'Electrones de valencia', html: `${Object.entries(at.reduce((m, a) => { m[a.sim] = (m[a.sim] || 0) + 1; return m; }, {})).map(([s, n]) => `${n} × ${s} (${ve(s)} e⁻)`).join(' + ')}${carga ? ` ${carga > 0 ? '−' : '+'} ${Math.abs(carga)} (carga ${signo(carga)})` : ''} = <b>${total} e⁻</b>, es decir, ${total / 2} pares.` },
      { t: 'Esqueleto', html: `${cen} en el centro y un enlace sencillo con cada uno de los ${at.length - 1} átomos: ${at.length - 1} pares usados.` },
      { t: 'Octeto de los terminales', html: `Cada terminal (salvo el H, que tiene 2 e⁻) completa 8 e⁻ con pares libres: ${at.slice(1).reduce((t, a) => t + a.lp, 0) + dobles.length} pares libres en total (antes de los dobles enlaces). Quedan ${resto / 2} ${resto / 2 === 1 ? 'par' : 'pares'} para ${cen}.` },
      { t: 'Cargas formales', html: `$C_f = V - P - E/2$ (V electrones de valencia, P electrones en pares libres, E electrones de enlace). Antes de mover nada: ${at.map((a, i) => `${a.sim} ${signo(inicial[i])}`).filter((x, i, l) => l.indexOf(x) === i).join(', ')}.` },
      { t: 'Dobles enlaces', html: nd ? `Un par libre de un ${[...new Set(dobles.map((i) => at[i].sim))].join('/')} pasa a ser un enlace con ${cen} y la suma de |cargas formales| baja; se repite ${nd} ${nd === 1 ? 'vez' : 'veces'}.${expande ? ` Como ${el.nombre.toLowerCase()} es del periodo ${el.periodo}, puede superar el octeto.` : ''}` : `No hay ningún par libre que, al convertirse en enlace, baje las cargas formales${!expande && el.periodo >= 3 ? ' (con el octeto limitado)' : ''}: la estructura se queda con enlaces sencillos.` },
      { t: 'Resultado', html: `Cargas formales finales: ${at.map((a) => a.sim + ' ' + signo(a.fc)).filter((x, i, l) => l.indexOf(x) === i).join(', ')}; suman ${signo(at.reduce((t, a) => t + a.fc, 0))}, la carga de ${nom}.${resonancia > 1 ? ` El doble enlace puede estar en cualquiera de los terminales iguales: <b>${resonancia} estructuras resonantes</b>.` : ''}${ordenes.length ? ` Orden de enlace ${ordenes.map((o) => `${o.par} = ${coma(o.medio)}`).join(', ')}${resonancia > 1 ? ' (media entre las estructuras resonantes)' : ''}.` : ''}` },
    ];
    return finaliza(at, { nom, carga, resonancia, ordenes, pasos, octeto: expande ? 'expandido' : 'octeto' });
  }

  const nombre = (at, carga) => {
    const m = {}; for (const a of at) m[a.sim] = (m[a.sim] || 0) + 1;
    return Object.entries(m).map(([s, n]) => s + (n > 1 ? sub(n) : '')).join('') + (carga ? (Math.abs(carga) > 1 ? String(Math.abs(carga)).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) : '') + (carga > 0 ? '⁺' : '⁻') : '');
  };

  /* ---------- Varios centros: semidesarrollada ---------- */
  function condensada(texto) {
    const s = String(texto ?? '').replace(/\s+/g, '').replace(/[₀-₉]/g, (d) => SUBS.indexOf(d)).replace(/[–−—]/g, '-').replace(/≡/g, '#');
    if (!s) throw new Error('Escribe una fórmula semidesarrollada, como CH3-CH2-OH, CH2=CH2 o CH3-C(=O)-OH');
    const at = [], pila = []; let cur = -1, enl = 1, i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '-') { enl = 1; i++; } else if (ch === '=') { enl = 2; i++; } else if (ch === '#') { enl = 3; i++; }
      else if (ch === '(') { if (cur < 0) throw new Error('Una rama entre paréntesis tiene que ir después de un átomo'); pila.push(cur); i++; }
      else if (ch === ')') { if (!pila.length) throw new Error('Hay un paréntesis que se cierra sin haberse abierto'); cur = pila.pop(); enl = 1; i++; }
      else {
        const m = /^(Cl|Br|[CNOSPFIBH])(?:H(\d*))?/.exec(s.slice(i));
        if (!m) throw new Error(/^\d/.test(s.slice(i)) ? 'Aquí no se admiten números sueltos ni anillos: escribe cada grupo con sus hidrógenos (CH3, CH2…)' : `No entiendo «${s.slice(i, i + 3)}». Usa C, N, O, S, P, B, F, Cl, Br, I y H con su número de hidrógenos (CH3, OH, NH2…)`);
        const k = at.length; at.push(nuevo(m[1])); i += m[0].length;
        if (cur >= 0) enlaza(at, cur, k, enl);
        const nh = m[2] === undefined ? (m[0].endsWith('H') && m[1] !== 'H' ? 1 : 0) : (m[2] === '' ? 1 : +m[2]);
        for (let h = 0; h < nh; h++) { at.push(nuevo('H')); enlaza(at, k, at.length - 1, 1); }
        cur = k; enl = 1;
      }
    }
    if (pila.length) throw new Error('Falta cerrar un paréntesis');
    if (at.length < 2) throw new Error('Escribe al menos dos átomos');
    for (const a of at) {
      const o = orden(a), v = VAL[a.sim];
      if (!v) throw new Error(`Para ${E()[a.sim].nombre.toLowerCase()} no tengo sus valencias habituales: usa C, N, O, S, P, halógenos o H`);
      if (!v.includes(o)) throw new Error(`El ${a.sim} tiene ${o} ${o === 1 ? 'enlace' : 'enlaces'} y lo habitual es ${v.join(' o ')}${a.sim === 'C' ? '. Los enlaces dobles y triples se escriben con = y # (CH3-C(=O)-OH, H-C#C-H)' : ''}`);
      a.lp = (a.ve - o) / 2;
    }
    for (const a of at) a.fc = cargaFormal(a);
    const ordenes = []; const vistos = new Set();
    for (let a = 0; a < at.length; a++) for (const b of at[a].en) { const k = [a, b.j].sort().join(); if (vistos.has(k) || b.o === 1) continue; vistos.add(k); ordenes.push({ par: `${at[a].sim}${a + 1}–${at[b.j].sim}${b.j + 1}`, medio: b.o, n: 1 }); }
    const nom = nombre(at, 0);
    const nEl = at.reduce((t, a) => t + a.ve, 0);
    const nPares = at.reduce((t, a) => t + a.lp, 0), nEnl = at.reduce((t, a) => t + orden(a), 0) / 2;
    const pasos = [
      { t: 'Átomos y enlaces', html: `${at.length} átomos (${at.filter((a) => a.sim !== 'H').length} no hidrógeno) y ${nEnl} enlaces contando cada enlace doble como 2 y cada triple como 3. Los hidrógenos de cada grupo (CH₃, OH…) se unen al átomo que los lleva.` },
      { t: 'Valencias', html: `Cada átomo suma sus enlaces y comprueba que tiene los habituales (C: 4, N: 3, O: 2, halógenos y H: 1).` },
      { t: 'Pares libres', html: `Para cada átomo, pares libres = (e⁻ de valencia − enlaces)/2: ${[...new Set(at.filter((a) => a.sim !== 'H').map((a) => `${a.sim} con ${orden(a)} enlaces → ${a.lp}`))].join('; ')}. En total ${nPares} pares libres y ${nEl} e⁻ de valencia = 2 × ${nEnl} enlaces + 2 × ${nPares} pares.` },
    ];
    return finaliza(at, { nom, carga: 0, resonancia: 1, ordenes, pasos, octeto: 'octeto' });
  }

  /* ---------- Geometría de cada centro, dibujo y texto ---------- */
  function finaliza(at, base) {
    const G = typeof Vsepr !== 'undefined' ? Vsepr.GEOMETRIAS : require('./calculo.js').GEOMETRIAS;
    const centros = [];
    at.forEach((a, i) => {
      if (a.en.length < 2 || a.sim === 'H') return;
      const sn = a.en.length + a.lp, g = G[`${sn}-${a.lp}`];
      if (!g) return;
      centros.push({ i, sim: a.sim, vecinos: a.en.length, lp: a.lp, sn, geo: g.nombre, hib: g.hib, hibTxt: g.hibTxt, ideal: g.ideal, real: g.real, tipo: `AX${a.en.length === 1 ? '' : a.en.length}${a.lp ? 'E' + (a.lp === 1 ? '' : a.lp) : ''}` });
    });
    const enlaces = at.reduce((t, a) => t + orden(a), 0) / 2;
    const texto = at.map((a, i) => `${a.sim}${i + 1}: ${a.en.length} ${a.en.length === 1 ? 'vecino' : 'vecinos'}, ${a.lp} ${a.lp === 1 ? 'par libre' : 'pares libres'}, carga formal ${signo(a.fc)}`).join('; ');
    const r = { ...base, atomos: at, centros, enlaces, texto };
    r.svg = dibuja(at, r);
    return r;
  }

  // Posiciones 2D: el átomo 0 en el origen y cada uno reparte sus vecinos y pares libres en ángulos iguales
  function coloca(at) {
    const pos = at.map(() => null), dir = at.map(() => []);
    pos[0] = [0, 0];
    const cola = [[0, -1, -90]];
    while (cola.length) {
      const [i, padre, entrada] = cola.shift();
      const a = at[i], hijos = a.en.filter((b) => b.j !== padre), slots = a.en.length + a.lp + (padre < 0 ? 0 : 0), paso = 360 / Math.max(slots, 1);
      // el padre ocupa el hueco opuesto a la entrada; los demás, a continuación en sentido horario
      const ini = padre < 0 ? entrada : entrada + 180;
      let k = padre < 0 ? 0 : 1;
      for (const b of hijos) {
        const ang = ini + k * paso * (padre < 0 ? 1 : 1); k++;
        pos[b.j] = [pos[i][0] + Math.cos((ang * Math.PI) / 180), pos[i][1] + Math.sin((ang * Math.PI) / 180)];
        dir[i].push(ang); cola.push([b.j, i, ang]);
      }
      a.libresAng = Array.from({ length: a.lp }, (_, n) => ini + (k + n) * paso);
    }
    return pos;
  }

  function dibuja(at, r) {
    const pos = coloca(at), U = 52, R = 13;
    const xs = pos.map((p) => p[0] * U), ys = pos.map((p) => p[1] * U);
    const x0 = Math.min(...xs) - 34, x1 = Math.max(...xs) + 34, y0 = Math.min(...ys) - 34, y1 = Math.max(...ys) + 34, w = x1 - x0, h = y1 - y0;
    const f = (x) => +x.toFixed(1);
    let g = '';
    at.forEach((a, i) => {
      for (const b of a.en) {
        if (b.j < i) continue;
        const dx = xs[b.j] - xs[i], dy = ys[b.j] - ys[i], n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, px = -uy * 3.2, py = ux * 3.2;
        const ax = xs[i] + ux * R, ay = ys[i] + uy * R, bx = xs[b.j] - ux * R, by = ys[b.j] - uy * R;
        for (let s = 0; s < b.o; s++) { const d = s - (b.o - 1) / 2; g += `<line x1="${f(ax + px * d)}" y1="${f(ay + py * d)}" x2="${f(bx + px * d)}" y2="${f(by + py * d)}"/>`; }
      }
    });
    const pun = [];
    at.forEach((a, i) => {
      for (const ang of a.libresAng || []) {
        const t = (ang * Math.PI) / 180, cx = xs[i] + Math.cos(t) * (R + 5), cy = ys[i] + Math.sin(t) * (R + 5), px = -Math.sin(t) * 3.6, py = Math.cos(t) * 3.6;
        pun.push(`<circle cx="${f(cx + px)}" cy="${f(cy + py)}" r="1.9"/><circle cx="${f(cx - px)}" cy="${f(cy - py)}" r="1.9"/>`);
      }
    });
    let t = '';
    at.forEach((a, i) => {
      t += `<text x="${f(xs[i])}" y="${f(ys[i] + 5)}" text-anchor="middle" class="lw-at">${a.sim}</text>`;
      if (a.fc) t += `<text x="${f(xs[i] + 12)}" y="${f(ys[i] - 9)}" class="lw-fc${a.fc > 0 ? ' pos' : ' neg'}">${a.fc > 0 ? '+' : '−'}${Math.abs(a.fc) > 1 ? Math.abs(a.fc) : ''}</text>`;
    });
    const desc = `Estructura de Lewis de ${r.nom.replace(/<[^>]+>/g, '')}: ${r.enlaces} enlaces y ${at.reduce((s, a) => s + a.lp, 0)} pares libres. ${r.texto}.`;
    return `<svg viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(h)}" width="${f(Math.min(w * 1.15, 560))}" role="img" aria-label="${desc.replace(/"/g, '')}" class="lewis-svg"><g stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none">${g}</g><g fill="currentColor">${pun.join('')}</g>${t}</svg>`;
  }

  const ejemplos = [
    { clave: 'so4', nombre: 'SO₄²⁻ · sulfato', texto: 'SO4 2-' }, { clave: 'no3', nombre: 'NO₃⁻ · nitrato (resonancia)', texto: 'NO3-' }, { clave: 'co3', nombre: 'CO₃²⁻ · carbonato', texto: 'CO3 2-' }, { clave: 'so2', nombre: 'SO₂', texto: 'SO2' }, { clave: 'o3', nombre: 'O₃ · ozono', texto: 'O3' },
  ];
  const ejemplosCadena = [
    { clave: 'etanol', nombre: 'Etanol, CH₃-CH₂-OH', texto: 'CH3-CH2-OH' }, { clave: 'eteno', nombre: 'Eteno, CH₂=CH₂', texto: 'CH2=CH2' }, { clave: 'etino', nombre: 'Etino, H-C≡C-H', texto: 'H-C#C-H' },
    { clave: 'acetico', nombre: 'Ácido acético, CH₃-C(=O)-OH', texto: 'CH3-C(=O)-OH' }, { clave: 'propanona', nombre: 'Propanona, CH₃-C(=O)-CH₃', texto: 'CH3-C(=O)-CH3' }, { clave: 'etanamida', nombre: 'Etanamida, CH₃-C(=O)-NH₂', texto: 'CH3-C(=O)-NH2' }, { clave: 'propeno', nombre: 'Propeno, CH₃-CH=CH₂', texto: 'CH3-CH=CH2' },
  ];
  return { centro, condensada, ejemplos, ejemplosCadena, ve };
})();
if (typeof module !== 'undefined') module.exports = Lewis;
