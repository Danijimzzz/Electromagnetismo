/* =====================================================================
   Termoquímica y ley de Hess (sin DOM). Tres modos:
     formacion  ΔH°reacción = Σ n·ΔHf°(productos) − Σ n·ΔHf°(reactivos), con una tabla de
                entalpías de formación estándar (kJ/mol, 25 °C) y la opción de escribir la
                que falte tras un «;».
     hess       combina reacciones con su ΔH para obtener la reacción pedida: calcula por
                qué número hay que multiplicar cada una (negativo = darle la vuelta) con un
                sistema lineal sobre las especies, y suma las entalpías.
     gibbs      ΔG = ΔH − T·ΔS, si es espontánea y la temperatura de equilibrio.
   Las fórmulas se leen con Formulas (quimica/formulas.js). La interfaz está en
   termoquimica/app.js y la prueba en pruebas/herramientas/termoquimica.js.
     resolver(sc)  { modo, … } → { modo, dH, …, pasos }
     ejemplos      [{ clave, nombre, sc }]
   ===================================================================== */
const Termoquimica = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const F = typeof Formulas !== 'undefined' ? Formulas : require('../quimica/formulas.js');
  const { f, leeNum, lee } = K;
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };

  // ΔHf° (kJ/mol), S° (J/(mol·K)) y ΔGf° (kJ/mol) a 25 °C y 1 bar: quimica/datos.js (QU-1), con su fuente
  const D = typeof Datos !== 'undefined' ? Datos : require('../quimica/datos.js');
  const TABLA = Object.fromEntries(Object.entries(D.TERMO).map(([k, v]) => [k, v[0]]));

  /* ---------- Lectura de sustancias y reacciones ---------- */
  const limpia = (t) => String(t).trim().replace(/[₀-₉]/g, (c) => SUB[c]).replace(/\((?:grafito|graf)\)/i, '(s)').replace(/\s+/g, ' ');
  // «2 H2O(l)», «1/2 O2», «C(grafito)» → { coef, texto, clave, html, atomos, carga }
  function sustancia(txt) {
    const t = limpia(txt), m = t.match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)?\s*(.+)$/);
    if (!m || !m[2]) throw new Error('Falta una sustancia');
    let coef = 1;
    if (m[1]) { const [a, b] = m[1].split('/'); coef = leeNum(a) / (b ? leeNum(b) : 1); }
    if (!(coef > 0) || !isFinite(coef)) throw new Error(`El coeficiente de «${t}» no es válido`);
    let texto = m[2].trim(), fo;
    try { fo = F.leer(texto); } catch (e) { throw new Error(`No entiendo la fórmula «${texto}»: ${e.message}`); }
    const base = texto.replace(/\s*\((?:s|l|g|aq|ac|dis)\)$/i, '').replace(/\s+/g, '');
    return { coef, texto, clave: base + (fo.estado ? `(${fo.estado})` : ''), base, estado: fo.estado, html: fo.html, atomos: fo.atomos, carga: fo.carga || 0 };
  }
  // «A + 2 B» → [sustancias]; el «+» separa si va entre espacios o antes de un coeficiente, fórmula o paréntesis
  const lado = (t) => String(t).trim().split(/\s*\+\s*(?=[\dA-Z(])/).filter((s) => s.trim()).map(sustancia);
  const SEPARA = /\s*(?:->|→|=>|⇌|⇄|=)\s*/;
  function ecuacion(txt) {
    const [r, p, ...resto] = String(txt).trim().split(SEPARA);
    if (p === undefined || resto.length || !r.trim() || !p.trim()) throw new Error(`Escribe la reacción con una flecha, como «CH4 + 2 O2 -> CO2 + 2 H2O»: «${String(txt).trim()}»`);
    const R = lado(r), P = lado(p);
    const cuenta = (L, k) => L.reduce((a, s) => a + s.coef * (k === 'carga' ? s.carga : s.atomos[k] || 0), 0);
    const els = new Set([...R, ...P].flatMap((s) => Object.keys(s.atomos)));
    for (const e of els) if (Math.abs(cuenta(R, e) - cuenta(P, e)) > 1e-9) throw new Error(`La reacción «${String(txt).trim()}» no está ajustada (${e}: ${f(cuenta(R, e))} a la izquierda y ${f(cuenta(P, e))} a la derecha)`);
    if (Math.abs(cuenta(R, 'carga') - cuenta(P, 'carga')) > 1e-9) throw new Error(`La reacción «${String(txt).trim()}» no está ajustada en carga`);
    return { R, P };
  }
  const fraccion = (x) => {
    for (let d = 1; d <= 12; d++) if (Math.abs(x * d - Math.round(x * d)) < 1e-9) { const n = Math.round(x * d); return d === 1 ? f(n) : `${n < 0 ? '−' : ''}{${Math.abs(n)}}/{${d}}`; }
    return f(x);
  };
  const html = (L) => L.map((s) => (s.coef === 1 ? '' : fraccion(s.coef).replace(/\{(\d+)\}\/\{(\d+)\}/, '$1/$2') + ' ') + s.html).join(' + ');
  const eq = (R, P) => `${html(R)} <span class="flecha">→</span> ${html(P)}`;
  const kJ = (x, d = 5) => `${f(x, d)} "kJ"`;

  /* ---------- ΔHf ---------- */
  // «2 H2O(l) ; -285,8» → sustancia con su ΔHf (la de la tabla si no se da)
  function conEntalpia(linea) {
    const [a, b, c, d] = linea.split(';');
    const s = sustancia(a);
    if (b !== undefined && b.trim() !== '') {
      const v = leeNum(b); if (!isFinite(v)) throw new Error(`La entalpía de formación de «${s.texto}» no es un número`);
      const o = { ...s, h: v, propia: true };
      if (c !== undefined && c.trim() !== '') { o.s = leeNum(c); if (!isFinite(o.s)) throw new Error(`La entropía de «${s.texto}» no es un número`); }
      if (d !== undefined && d.trim() !== '') { o.g = leeNum(d); if (!isFinite(o.g)) throw new Error(`La energía libre de formación de «${s.texto}» no es un número`); }
      return o;
    }
    let k = s.clave;
    if (!s.estado) {
      const cands = Object.keys(TABLA).filter((c) => c.replace(/\((?:s|l|g)\)$/, '') === s.base);
      if (cands.length > 1) throw new Error(`Indica el estado de «${s.base}»: ${cands.map((c) => c).join(' o ')}`);
      if (cands.length === 1) { k = cands[0]; s.estado = k.slice(-2, -1); s.html += `<small class="estado">(${s.estado})</small>`; }
    }
    if (!(k in TABLA)) throw new Error(`No tengo la entalpía de formación de «${s.clave}»: escríbela detrás de un «;» (por ejemplo «${s.texto} ; −100»)`);
    return { ...s, clave: k, h: TABLA[k], s: D.TERMO[k][1], g: D.TERMO[k][2], propia: false };
  }
  const lineas = (t) => String(t ?? '').split(/\n/).map((l) => l.trim()).filter(Boolean);
  const ladoH = (t) => lineas(t).map(conEntalpia);

  function formacion(sc) {
    const R = ladoH(sc.reactivos), P = ladoH(sc.productos);
    if (!R.length) throw new Error('Escribe al menos un reactivo');
    if (!P.length) throw new Error('Escribe al menos un producto');
    ecuacion(`${R.map((s) => `${s.coef} ${s.texto}`).join(' + ')} -> ${P.map((s) => `${s.coef} ${s.texto}`).join(' + ')}`);
    const sum = (L) => L.reduce((a, s) => a + s.coef * s.h, 0), hp = sum(P), hr = sum(R), dH = hp - hr;
    const term = (s) => `${s.coef === 1 ? '' : fraccion(s.coef) + ' · '}(${f(s.h)})`;
    const fila = (L) => L.map(term).join(' + ');
    const nombre = (s) => `${s.html}: ΔH<sub>f</sub>° = ${f(s.h)} kJ/mol${s.propia ? ' (dato tuyo)' : ''}`;
    const pasos = [
      { t: 'Reacción', html: eq(R, P) },
      { t: 'Entalpías de formación', html: [...R, ...P].map(nombre).join('<br>') },
      { t: 'Productos', html: `$Σ n ΔH_f^"°"("productos") = ${fila(P)} = ${kJ(hp)}$` },
      { t: 'Reactivos', html: `$Σ n ΔH_f^"°"("reactivos") = ${fila(R)} = ${kJ(hr)}$` },
      { t: 'Entalpía de la reacción', html: `$ΔH^"°"_r = ${f(hp)} − (${f(hr)}) = ${kJ(dH)}$. ${dH < 0 ? 'Es negativa: la reacción es <b>exotérmica</b> y desprende calor.' : dH > 0 ? 'Es positiva: la reacción es <b>endotérmica</b> y absorbe calor.' : 'Es nula.'}` },
    ];
    const out = { modo: 'formacion', dH, hp, hr, R, P, pasos, barras: [['Σ reactivos', hr], ['Σ productos', hp], ['ΔH', dH]] };
    // TQ-1: con S° y ΔGf° de todas las sustancias (de la tabla o escritas tras «;») salen ΔS°, ΔG° y la temperatura de equilibrio sin teclear nada más
    const tg = String(sc.t ?? '').trim() === '' ? 298.15 : lee(sc, 't', 'la temperatura', { min: 0, minEx: true });
    const hay = (k) => [...R, ...P].every((q) => q[k] !== undefined);
    if (hay('s')) {
      const sS = (L) => L.reduce((a, q) => a + q.coef * q.s, 0), dS = sS(P) - sS(R);
      out.dS = dS; out.T = tg; out.dGT = dH - tg * dS / 1000;
      pasos.push({ t: 'Entropía de la reacción', html: `Con las entropías molares estándar S° (J/(mol·K)): ${[...R, ...P].map((q) => `${q.html}: ${f(q.s)}${q.propia ? ' (dato tuyo)' : ''}`).join(', ')}.<br>$ΔS^"°"_r = Σ n S^"°"("productos") − Σ n S^"°"("reactivos") = ${f(sS(P))} − ${f(sS(R))} = ${f(dS)} "J/K"$. ${dS > 0 ? 'Aumenta el desorden (ΔS > 0).' : dS < 0 ? 'Disminuye el desorden (ΔS < 0).' : ''}` });
      pasos.push({ t: `Energía libre a ${f(tg)} K`, html: `$ΔG = ΔH − T ΔS = ${f(dH)} − ${f(tg)} · ${f(dS / 1000)} = ${kJ(out.dGT)}$ (ΔS pasada a kJ/K, suponiendo ΔH y ΔS constantes con la temperatura). ${out.dGT < 0 ? 'ΔG < 0: espontánea a esa temperatura.' : out.dGT > 0 ? 'ΔG > 0: no espontánea a esa temperatura.' : 'ΔG = 0: en equilibrio.'}` });
      if (dS !== 0) {
        const Te = dH * 1000 / dS; out.Te = Te > 0 ? Te : NaN;
        pasos.push({ t: 'Temperatura de equilibrio', html: Te > 0 ? `ΔG = 0 ⇒ $T_e = {ΔH}/{ΔS} = {${f(dH * 1000)}}/{${f(dS)}} = ${f(Te)} "K"$ (${f(Te - 273.15)} °C). ${dH < 0 ? 'Por debajo de esa temperatura la reacción es espontánea.' : 'Por encima de esa temperatura la reacción es espontánea.'}` : `ΔH y ΔS tienen signo contrario: ${dH < 0 ? 'ΔG < 0 a cualquier temperatura (siempre espontánea).' : 'ΔG > 0 a cualquier temperatura (nunca espontánea).'}` });
      }
    }
    if (hay('g')) {
      const sG = (L) => L.reduce((a, q) => a + q.coef * q.g, 0), dG = sG(P) - sG(R);
      out.dG298 = dG;
      pasos.push({ t: 'Energía libre a 25 °C con ΔGf°', html: `$ΔG^"°"_r = Σ n ΔG_f^"°"("productos") − Σ n ΔG_f^"°"("reactivos") = ${f(sG(P))} − (${f(sG(R))}) = ${kJ(dG)}$. ${hay('s') ? `Comprobación con ΔH − TΔS a 298,15 K: ${kJ(dH - 298.15 * out.dS / 1000)}.` : ''}` });
    }
    if (String(sc.masa ?? '').trim() !== '') {
      const m = lee(sc, 'masa', 'la masa', { min: 0, minEx: true }), s0 = R[0], M = F.masaMolar(s0.texto).M, n = m / M, q = dH * n / s0.coef;
      out.q = q; out.n = n; out.M = M;
      pasos.push({ t: `Calor con ${f(m)} g de ${s0.html}`, html: `$n = m/M = ${f(m)}/${f(M)} = ${f(n)} "mol"$. Como ΔH está dado por ${s0.coef === 1 ? 'cada mol' : `cada ${fraccion(s0.coef)} mol`} de ${s0.html} que reacciona: $Q = ΔH · n/${fraccion(s0.coef)} = ${f(dH)} · ${f(n)}/${fraccion(s0.coef)} = ${kJ(q)}$ (${q < 0 ? 'calor desprendido' : 'calor absorbido'}).` });
    }
    return out;
  }

  /* ---------- Ley de Hess ---------- */
  // resuelve M·x = t por Gauss-Jordan; las incógnitas libres valen 0
  function resuelve(M, t, n) {
    const A = M.map((fila, i) => [...fila, t[i]]), piv = [];
    let r = 0;
    for (let c = 0; c < n && r < A.length; c++) {
      let p = r; for (let i = r + 1; i < A.length; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
      if (Math.abs(A[p][c]) < 1e-9) continue;
      [A[r], A[p]] = [A[p], A[r]];
      const d = A[r][c]; A[r] = A[r].map((v) => v / d);
      for (let i = 0; i < A.length; i++) if (i !== r) { const k = A[i][c]; if (k) A[i] = A[i].map((v, j) => v - k * A[r][j]); }
      piv.push(c); r++;
    }
    for (let i = r; i < A.length; i++) if (Math.abs(A[i][n]) > 1e-9) return null;
    const x = Array(n).fill(0); piv.forEach((c, i) => (x[c] = A[i][n]));
    return { x, libres: n - piv.length };
  }

  function hess(sc) {
    const dadas = lineas(sc.reacciones).map((l, i) => {
      const [e, h] = l.split(';');
      if (h === undefined || h.trim() === '') throw new Error(`Falta la ΔH de la reacción ${i + 1}: escríbela detrás de un «;»`);
      const v = leeNum(h); if (!isFinite(v)) throw new Error(`La ΔH de la reacción ${i + 1} no es un número`);
      return { ...ecuacion(e), h: v };
    });
    if (!dadas.length) throw new Error('Escribe al menos una reacción con su ΔH');
    if (String(sc.objetivo ?? '').trim() === '') throw new Error('Escribe la reacción que quieres obtener');
    const obj = ecuacion(sc.objetivo);
    const vec = (r) => { const v = {}; for (const s of r.R) v[s.clave] = (v[s.clave] || 0) - s.coef; for (const s of r.P) v[s.clave] = (v[s.clave] || 0) + s.coef; return v; };
    const V = dadas.map(vec), T = vec(obj), claves = [...new Set([...V.flatMap(Object.keys), ...Object.keys(T)])];
    const s = resuelve(claves.map((k) => V.map((v) => v[k] || 0)), claves.map((k) => T[k] || 0), dadas.length);
    if (!s) throw new Error('Con esas reacciones no se puede obtener la reacción pedida: sobran o faltan sustancias (comprueba los estados físicos, que cuentan como sustancias distintas)');
    const x = s.x.map((v) => (Math.abs(v) < 1e-9 ? 0 : v)), dH = x.reduce((a, v, i) => a + v * dadas[i].h, 0);
    const que = (v) => (v === 0 ? 'no se usa' : v === 1 ? 'se deja igual' : v === -1 ? 'se invierte' : `se ${v < 0 ? 'invierte y se ' : ''}multiplica por ${fraccion(Math.abs(v))}`);
    const trans = (r, v) => { const k = Math.abs(v), L = v < 0 ? [r.P, r.R] : [r.R, r.P], m = (S) => S.map((q) => ({ ...q, coef: q.coef * k })); return eq(m(L[0]), m(L[1])); };
    const usadas = x.map((v, i) => [v, i]).filter(([v]) => v !== 0);
    const pasos = [
      { t: 'Reacción pedida', html: eq(obj.R, obj.P) },
      { t: 'Reacciones dadas', html: dadas.map((r, i) => `(${i + 1}) ${eq(r.R, r.P)} &nbsp; ΔH<sub>${i + 1}</sub> = ${f(r.h)} kJ`).join('<br>') },
      { t: 'Qué hacer con cada una', html: `Se busca $x_1, x_2, …$ tales que al sumar las reacciones multiplicadas por ellos solo queden las sustancias de la pedida (las demás se cancelan). Un $x$ negativo es dar la vuelta a la reacción y cambiarle el signo a la ΔH.<br>` + dadas.map((r, i) => `(${i + 1}): $x_${i + 1} = ${fraccion(x[i])}$, ${que(x[i])}`).join('<br>') + (s.libres ? `<br>Las reacciones no son independientes; se ha dejado a 0 el factor de ${s.libres} de ellas.` : '') },
      { t: 'Reacciones preparadas', html: usadas.map(([v, i]) => `${trans(dadas[i], v)} &nbsp; ΔH = ${f(v * dadas[i].h)} kJ`).join('<br>') },
      { t: 'Suma', html: `$ΔH = ${usadas.map(([v, i]) => `${fraccion(v)} · (${f(dadas[i].h)})`).join(' + ')} = ${kJ(dH)}$. ${dH < 0 ? 'Es <b>exotérmica</b>.' : dH > 0 ? 'Es <b>endotérmica</b>.' : ''}` },
    ];
    return { modo: 'hess', dH, x, dadas, obj, pasos, barras: [...usadas.map(([v, i]) => [`(${i + 1})`, v * dadas[i].h]), ['ΔH', dH]] };
  }

  /* ---------- Espontaneidad ---------- */
  function gibbs(sc) {
    const H = lee(sc, 'h', 'ΔH', { def: undefined }), S = lee(sc, 's', 'ΔS'), T = lee(sc, 't', 'la temperatura', { min: 0, minEx: true }), G = H - T * S / 1000;
    const Te = S !== 0 ? H * 1000 / S : NaN, ok = isFinite(Te) && Te > 0;
    const caso = H < 0 && S > 0 ? 'siempre espontánea (ΔH < 0 y ΔS > 0)' : H > 0 && S < 0 ? 'nunca espontánea (ΔH > 0 y ΔS < 0)'
      : H < 0 ? `espontánea por debajo de ${f(Te)} K (ΔH < 0 y ΔS < 0)` : H > 0 ? `espontánea por encima de ${f(Te)} K (ΔH > 0 y ΔS > 0)` : 'depende solo de ΔS';
    const pasos = [
      { t: 'Datos', html: `$ΔH = ${kJ(H)}$, $ΔS = ${f(S)} "J/K"$, $T = ${f(T)} "K"$` },
      { t: 'Energía libre de Gibbs', html: `$ΔG = ΔH − T ΔS = ${f(H)} − ${f(T)} · ${f(S / 1000)} = ${kJ(G)}$ (con ΔS pasada a kJ/K).` },
      { t: 'Espontaneidad', html: `ΔG ${G < 0 ? '< 0: a esa temperatura la reacción es <b>espontánea</b>' : G > 0 ? '> 0: a esa temperatura <b>no es espontánea</b>' : '= 0: está en equilibrio'}.` },
      { t: 'Temperatura de equilibrio', html: ok ? `ΔG = 0 ⇒ $T_e = {ΔH}/{ΔS} = {${f(H * 1000)}}/{${f(S)}} = ${f(Te)} "K"$ (${f(Te - 273.15)} °C). La reacción es ${caso}.` : `No hay temperatura de equilibrio positiva. La reacción es ${caso}.` },
    ];
    return { modo: 'gibbs', dH: H, dS: S, T, dG: G, Te: ok ? Te : NaN, caso, pasos, barras: [['ΔH', H], ['−TΔS', -T * S / 1000], ['ΔG', G]] };
  }

  /* ---------- Ciclo de Born-Haber (TQ-3) ---------- */
  // sal M_aX_b de un metal alcalino, alcalinotérreo o Al con F, Cl, Br, I, O o S: energía reticular a partir de la formación
  const CARGA_M = { Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3 }, CARGA_X = { F: 1, Cl: 1, Br: 1, I: 1, O: 2, S: 2 };
  function born(sc) {
    const txt = String(sc.sal ?? '').trim().replace(/[₀-₉]/g, (c) => SUB[c]);
    if (!txt) throw new Error('Escribe la sal: NaCl, MgO, CaF2…');
    const m = txt.match(/^([A-Z][a-z]?)(\d*)([A-Z][a-z]?)(\d*)$/);
    if (!m) throw new Error(`No entiendo la sal «${txt}»: escribe el metal primero y el no metal después, como NaCl, MgCl2 o Na2O`);
    const M = m[1], X = m[3], a = +(m[2] || 1), b = +(m[4] || 1), qM = CARGA_M[M], qX = CARGA_X[X];
    if (!qM) throw new Error(`El ciclo está preparado para los metales ${Object.keys(CARGA_M).join(', ')}; «${M}» no está`);
    if (!qX) throw new Error(`El ciclo está preparado para los no metales ${Object.keys(CARGA_X).join(', ')}; «${X}» no está`);
    if (a * qM !== b * qX) throw new Error(`«${txt}» no está equilibrada en carga: ${M}${qM > 1 ? qM : ''}+ y ${X}${qX > 1 ? qX : ''}− no dan esa proporción`);
    const dm = D.METALES[M], dx = D.NOMETALES[X], ref = D.SALES_BORN[txt];
    let hf;
    if (String(sc.hf ?? '').trim() !== '') { hf = leeNum(sc.hf); if (!isFinite(hf)) throw new Error('La entalpía de formación debe ser un número'); }
    else if (ref) hf = ref.hf;
    else throw new Error(`No tengo la entalpía de formación de ${txt}: escríbela (kJ/mol)`);
    const sub = a * dm.sub, ion = a * dm.ei.slice(0, qM).reduce((p, v) => p + v, 0), at = b * dx.atom, ae = -b * dx.ae.slice(0, qX).reduce((p, v) => p + v, 0);
    const lat = hf - sub - ion - at - ae; // ΔH de formar el cristal desde los iones gaseosos (negativa)
    const nombre = `${M}${a > 1 ? a : ''}${X}${b > 1 ? b : ''}`, num = (n) => (n === 1 ? '' : n + ' ');
    const pasos = [
      { t: 'La sal y su ciclo', html: `${nombre}: ${a} ${M}<sup>${qM > 1 ? qM : ''}+</sup> y ${b} ${X}<sup>${qX > 1 ? qX : ''}−</sup>. El ciclo de Born-Haber lleva de los elementos a la sal por dos caminos: la formación directa (ΔH<sub>f</sub>) y el camino por los iones gaseosos, cuyo último paso es la formación de la red (energía reticular).` },
      { t: 'Sublimación del metal', html: `$${num(a)}${M}(s) → ${num(a)}${M}(g)$: $${a} · ${f(dm.sub)} = ${kJ(sub)}$` },
      { t: `Ionización del metal (${qM === 1 ? '1.ª' : qM === 2 ? '1.ª y 2.ª' : '1.ª, 2.ª y 3.ª'} energía)`, html: `$${num(a)}${M}(g) → ${num(a)}${M}^{${qM}+}(g)$: $${a} · (${dm.ei.slice(0, qM).map((v) => f(v)).join(' + ')}) = ${kJ(ion)}$` },
      { t: 'Atomización del no metal', html: `$${b === 1 ? '' : b + ' · '}1/2 ${X}_2 → ${num(b)}${X}(g)$: $${b} · ${f(dx.atom)} = ${kJ(at)}$ (la mitad de la energía de disociación${X === 'Br' ? ' y la vaporización del Br₂' : X === 'I' ? ' y la sublimación del I₂' : ''}).` },
      { t: `Afinidad electrónica (${qX === 1 ? '1.ª' : '1.ª y 2.ª'})`, html: `$${num(b)}${X}(g) → ${num(b)}${X}^{${qX}−}(g)$: $−${b} · (${dx.ae.slice(0, qX).map((v) => f(v)).join(' + ')}) = ${kJ(ae)}$${qX === 2 ? '. La 2.ª afinidad es negativa (hay que dar energía para meter un electrón en un anión), pero la red la compensa de sobra.' : ''}` },
      { t: 'Entalpía de formación', html: `$ΔH_f(${nombre}) = ${kJ(hf)}$${String(sc.hf ?? '').trim() !== '' ? ' (dato tuyo)' : ' (tabla)'}.` },
      { t: 'Energía reticular', html: `$ΔH_f = ΔH_"sub" + ΔH_"ion" + ΔH_"at" + ΔH_"AE" + ΔH_"red"$ ⇒ $ΔH_"red" = ${f(hf)} − (${f(sub)} + ${f(ion)} + ${f(at)} + ${f(ae)}) = ${kJ(lat)}$.<br>La energía reticular (la que se desprende al formarse un mol de cristal a partir de los iones gaseosos) vale <b>${f(-lat)} kJ/mol</b>.${ref && String(sc.hf ?? '').trim() === '' ? ` El valor de las tablas es ${f(ref.ref)} kJ/mol (diferencia ${f(100 * (-lat - ref.ref) / ref.ref, 2)} %).` : ''}` },
    ];
    return { modo: 'born', sal: txt, a, b, M, X, qM, qX, hf, sub, ion, at, ae, lat, U: -lat, ref: ref?.ref ?? null, pasos,
      barras: [['Sublimación', sub], ['Ionización', ion], ['Atomización', at], ['Afinidad', ae], ['Red', lat], ['ΔHf', hf]] };
  }

  const resolver = (sc) => ({ hess, gibbs, born }[sc.modo] || formacion)(sc);

  const ejemplos = [
    { clave: 'metano', nombre: 'Combustión del metano (ΔHf)', sc: { modo: 'formacion', reactivos: 'CH4(g)\n2 O2(g)', productos: 'CO2(g)\n2 H2O(l)', masa: '' } },
    { clave: 'etanol', nombre: 'Combustión del etanol, calor de 10 g', sc: { modo: 'formacion', reactivos: 'C2H5OH(l)\n3 O2(g)', productos: '2 CO2(g)\n3 H2O(l)', masa: '10' } },
    { clave: 'amoniaco', nombre: 'Síntesis del amoniaco', sc: { modo: 'formacion', reactivos: 'N2(g)\n3 H2(g)', productos: '2 NH3(g)', masa: '' } },
    { clave: 'propio', nombre: 'Con una entalpía de formación propia', sc: { modo: 'formacion', reactivos: 'CaCO3(s) ; -1207,1', productos: 'CaO(s)\nCO2(g)', masa: '' } },
    { clave: 'hess-co', nombre: 'Hess: C + ½ O₂ → CO', sc: { modo: 'hess', reacciones: 'C(s) + O2(g) -> CO2(g) ; -393,5\nCO(g) + 1/2 O2(g) -> CO2(g) ; -283,0', objetivo: 'C(s) + 1/2 O2(g) -> CO(g)' } },
    { clave: 'hess-etano', nombre: 'Hess: formación del etano', sc: { modo: 'hess', reacciones: 'C2H6(g) + 7/2 O2(g) -> 2 CO2(g) + 3 H2O(l) ; -1560\nC(s) + O2(g) -> CO2(g) ; -393,5\nH2(g) + 1/2 O2(g) -> H2O(l) ; -285,8', objetivo: '2 C(s) + 3 H2(g) -> C2H6(g)' } },
    { clave: 'gibbs-metano', nombre: 'Combustión del metano: ΔS°, ΔG° y temperatura de equilibrio', sc: { modo: 'formacion', reactivos: 'CH4(g)\n2 O2(g)', productos: 'CO2(g)\n2 H2O(g)', masa: '', t: '298,15' } },
    { clave: 'caco3-descomposicion', nombre: 'Descomposición del CaCO₃: ¿a qué temperatura es espontánea?', sc: { modo: 'formacion', reactivos: 'CaCO3(s)', productos: 'CaO(s)\nCO2(g)', masa: '', t: '1000' } },
    { clave: 'born-nacl', nombre: 'Born-Haber: energía reticular del NaCl', sc: { modo: 'born', sal: 'NaCl', hf: '' } },
    { clave: 'born-mgo', nombre: 'Born-Haber: energía reticular del MgO', sc: { modo: 'born', sal: 'MgO', hf: '' } },
    { clave: 'born-cacl2', nombre: 'Born-Haber: energía reticular del CaCl₂', sc: { modo: 'born', sal: 'CaCl2', hf: '' } },
    { clave: 'gibbs-hielo', nombre: 'Gibbs: fusión del hielo', sc: { modo: 'gibbs', h: '6,01', s: '22,0', t: '298' } },
    { clave: 'gibbs-caco3', nombre: 'Gibbs: descomposición del CaCO₃', sc: { modo: 'gibbs', h: '178,3', s: '160,5', t: '1000' } },
  ];

  return { resolver, ejemplos, f, TABLA, born };
})();
if (typeof module !== 'undefined') module.exports = Termoquimica;
