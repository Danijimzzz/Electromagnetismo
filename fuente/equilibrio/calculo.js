/* =====================================================================
   Equilibrio químico y Le Chatelier: cálculo (sin DOM). Reacción general
   aA + bB ⇌ cC + dD (b y d opcionales), todo en fase gaseosa o disuelto.
   Cuatro modos:
     K   calcular Kc (y Kp) con las concentraciones iniciales y la de equilibrio
         de una especie (tabla ICE)
     eq  calcular las concentraciones de equilibrio con Kc y las iniciales
     Q   cociente de reacción Q frente a K: hacia dónde va la reacción
     lc  principio de Le Chatelier con números: añadir o quitar una especie,
         cambiar el volumen o la temperatura (Van't Hoff), y el nuevo equilibrio
   Lo que cambia es x, el avance de la reacción (mol/L): cada concentración es
   c₀ + ν·x (ν < 0 en reactivos, > 0 en productos). Como ln Q crece siempre con x,
   la ecuación Q(x) = K tiene una sola solución, y se halla por bisección
   (sirve para cualquier grado, no solo el segundo).
   La interfaz está en equilibrio/app.js y la prueba en
   pruebas/herramientas/equilibrio.js.
     resolver(sc)  datos del formulario (texto) → { modo, … , pasos }; lanza un
                   Error con un mensaje para el usuario si falta o falla algo
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     f(x)          número con coma decimal y ·10<sup>n</sup>
   ===================================================================== */
const Equilibrio = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  const R_ATM = 0.082, R_J = 8.314; // atm·L/(mol·K) y J/(mol·K)
  const L = ['A', 'B', 'C', 'D'];

  function num(sc, k, nom, { min = -Infinity, estricto = false, opcional = false, def = null } = {}) {
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (estricto ? v <= min : v < min) throw new Error(`${may(nom)} debe ser ${estricto ? 'mayor que' : 'mayor o igual que'} ${min}`);
    return v;
  }

  // nombre de la especie: texto de cálculo y HTML con subíndices (NO2 → NO₂)
  const nom = (sc, i) => (vacio(sc['n' + L[i]]) ? L[i] : String(sc['n' + L[i]]).trim());
  const nh = (s) => String(s).replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>').replace(/([+-]+)$/, (m) => `<sup>${m.replace('-', '−')}</sup>`);
  // el nombre dentro de una fórmula de Mates: NO2 → "NO"_{2}
  const qn = (s) => String(s).replace(/([^\d]+)(\d+)?/g, (_, t, d) => `"${t}"${d ? `_{${d}}` : ''}`);
  const num2 = (v) => String(v).replace('.', ',');

  // coeficientes: [a, b, c, d]; b y d pueden faltar (0)
  function lee(sc) {
    const a = num(sc, 'a', 'el coeficiente de A', { min: 0, estricto: true }), c = num(sc, 'c', 'el coeficiente de C', { min: 0, estricto: true });
    const b = num(sc, 'b', 'el coeficiente de B', { min: 0, opcional: true, def: 0 }), d = num(sc, 'd', 'el coeficiente de D', { min: 0, opcional: true, def: 0 });
    return { coef: [a, b, c, d], nu: [-a, -b, c, d] };
  }
  const presentes = (nu) => [0, 1, 2, 3].filter((i) => nu[i] !== 0);
  const ladoH = (sc, coef, idx) => idx.filter((i) => coef[i] > 0).map((i) => (coef[i] === 1 ? '' : num2(coef[i]) + ' ') + nh(nom(sc, i))).join(' + ');
  const reaccionH = (sc, coef) => `${ladoH(sc, coef, [0, 1])} ⇌ ${ladoH(sc, coef, [2, 3])}`;
  const conc = (sc, i) => `[${qn(nom(sc, i))}]`;
  const pot = (sc, i, p) => conc(sc, i) + (p === 1 ? '' : `^{${num2(p)}}`);
  const exprK = (sc, coef, k = 'c') => {
    const lado = (idx) => idx.filter((i) => coef[i] > 0).map((i) => pot(sc, i, coef[i])).join(' ');
    return `K_${k} = {${lado([2, 3])}}/{${lado([0, 1])}}`;
  };

  // cociente de reacción con concentraciones c (mol/L); 0 si falta un producto, ∞ si falta un reactivo
  function cociente(c, nu) {
    let cero = false, inf = false, s = 0;
    for (const i of presentes(nu)) { if (c[i] <= 0) { if (nu[i] > 0) cero = true; else inf = true; } else s += nu[i] * Math.log(c[i]); }
    if (cero && inf) throw new Error('Faltan a la vez algún reactivo y algún producto: Q no está definido. Pon alguna concentración en cada lado o en uno solo');
    return cero ? 0 : inf ? Infinity : Math.exp(s);
  }
  const sentido = (Q, K) => (Q === K || Math.abs(Math.log(Q / K)) < 1e-9 ? 'eq' : Q < K ? 'der' : 'izq');
  const TXT_SENT = { eq: 'ya está en equilibrio', der: 'avanza hacia la derecha (se forman productos)', izq: 'retrocede hacia la izquierda (se forman reactivos)' };

  // límites del avance x para que ninguna concentración sea negativa
  function limites(c0, nu) {
    let lo = -Infinity, hi = Infinity;
    for (const i of presentes(nu)) { if (nu[i] > 0) lo = Math.max(lo, -c0[i] / nu[i]); else hi = Math.min(hi, c0[i] / -nu[i]); }
    return { lo, hi };
  }
  // avance x tal que Q(c₀ + νx) = K
  function avance(c0, nu, K) {
    let { lo, hi } = limites(c0, nu);
    if (!(hi - lo > 1e-15)) throw new Error('Con esas concentraciones la reacción no puede avanzar en ningún sentido: pon algo de reactivo o de producto');
    const g = (x) => { let s = -Math.log(K); for (const i of presentes(nu)) s += nu[i] * Math.log(c0[i] + nu[i] * x); return s; };
    let a = lo, b = hi;
    for (let k = 0; k < 400; k++) {
      const m = (a + b) / 2, v = g(m);
      if (!isFinite(v)) break;
      if (v > 0) b = m; else a = m;
      if (b - a <= 1e-16 * Math.max(1, Math.abs(m))) break;
    }
    return { x: (a + b) / 2, lo, hi };
  }
  const equilibrio = (c0, nu, x) => c0.map((v, i) => (nu[i] ? Math.max(0, v + nu[i] * x) : v));

  // lectura de las concentraciones (vacío = 0)
  function leeConc(sc, nu, ropa) {
    return [0, 1, 2, 3].map((i) => (nu[i] ? num(sc, 'c' + L[i], `${ropa} de ${nom(sc, i)}`, { min: 0, opcional: true, def: 0 }) : 0));
  }

  /* ---------- pasos ---------- */
  const filaTabla = (t, xs) => `<tr><th>${t}</th>${xs.map((x) => `<td>${x}</td>`).join('')}</tr>`;
  function tablaICE(sc, nu, coef, c0, x, ceq) {
    const idx = presentes(nu);
    const cab = `<tr><th><span class="solo-lector">Especie</span></th>${idx.map((i) => `<th>${nh(nom(sc, i))}</th>`).join('')}</tr>`;
    const ini = filaTabla('Inicial', idx.map((i) => f(c0[i])));
    const cam = filaTabla('Cambio', idx.map((i) => `${nu[i] < 0 ? '−' : '+'}${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`));
    const eq = filaTabla('Equilibrio', idx.map((i) => `${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`));
    const num_ = filaTabla('x = ' + f(x), idx.map((i) => `<b>${f(ceq[i])}</b>`));
    return `<table class="tabla">${cab}${ini}${cam}${eq}${num_}</table>`;
  }
  const kp = (K, nu, T) => { const dn = nu.reduce((s, v) => s + (v > 0 ? v : 0), 0) + nu.reduce((s, v) => s + (v < 0 ? v : 0), 0); return { dn, Kp: K * Math.pow(R_ATM * T, dn) }; };
  function pasoKp(sc, K, nu, T, ceq) {
    const { dn, Kp } = kp(K, nu, T), P = ceq.map((v, i) => (nu[i] ? v * R_ATM * T : 0)), Pt = P.reduce((s, v) => s + v, 0);
    const parc = presentes(nu).map((i) => `$p_{${qn(nom(sc, i))}} = c·R·T = ${f(ceq[i])} · 0,082 · ${f(T)} = ${f(P[i])} "atm"$`).join('; ');
    return { Kp, dn, P, Pt, paso: { t: 'Kp y presiones parciales', html: `Con $T = ${f(T)} "K"$ y suponiendo gases ideales: $Δn = ${num2(dn)}$ (moles gaseosos de productos menos de reactivos), así que $K_p = K_c (R T)^{Δn} = ${f(K)} · (0,082 · ${f(T)})^{${num2(dn)}} = ${f(Kp)}$. Presiones parciales: ${parc}. Presión total: $P = ${f(Pt)} "atm"$.` } };
  }
  const ecuacionX = (sc, coef, nu, c0, K) => {
    const termino = (i) => { const p = coef[i], base = `(${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${p === 1 ? '' : num2(p) + '·'}x)`; return base + (p === 1 ? '' : `^{${num2(p)}}`); };
    const lado = (idx) => idx.filter((i) => coef[i] > 0).map(termino).join(' · ');
    return `$K_c = ${f(K)} = {${lado([2, 3])}}/{${lado([0, 1])}}$`;
  };

  function cabecera(sc, coef, K, kind) {
    return { t: 'La reacción y su constante', html: `$${exprK(sc, coef)}$${kind === 'dado' ? `, con $K_c = ${f(K)}$` : ''}. La reacción es ${reaccionH(sc, coef)}. Los sólidos y líquidos puros no entran en $K$ y aquí se suponen todas las especies gaseosas o disueltas.` };
  }

  /* ---------- modo K: constante a partir de un equilibrio medido ---------- */
  function modoK(sc, base) {
    const { coef, nu } = base, c0 = leeConc(sc, nu, 'la concentración inicial');
    const e = L.indexOf(String(sc.especie || 'C'));
    if (e < 0 || !nu[e]) throw new Error('Elige una especie que esté en la reacción');
    const ce = num(sc, 'ceq', `la concentración de equilibrio de ${nom(sc, e)}`, { min: 0 });
    const x = (ce - c0[e]) / nu[e];
    const ceq = c0.map((v, i) => (nu[i] ? v + nu[i] * x : v));
    if (ceq.some((v, i) => nu[i] && v < -1e-12)) throw new Error('Con esos datos alguna concentración de equilibrio sale negativa: revisa la concentración medida o las iniciales');
    if (presentes(nu).some((i) => !(ceq[i] > 1e-12))) throw new Error('Alguna especie se agota por completo: la reacción es total y K no se puede calcular con estos datos');
    const K = Math.exp(presentes(nu).reduce((s, i) => s + nu[i] * Math.log(ceq[i]), 0));
    const pasos = [cabecera(sc, coef, K, 'calcula')];
    pasos.push({ t: 'Datos', html: `Concentraciones iniciales: ${presentes(nu).map((i) => `$${conc(sc, i)}_0 = ${f(c0[i])}$`).join(', ')} (mol/L). En el equilibrio se mide $${conc(sc, e)} = ${f(ce)} "mol/L"$.` });
    pasos.push({ t: 'Cuánto ha avanzado la reacción', html: `De ${nh(nom(sc, e))} ha pasado de ${f(c0[e])} a ${f(ce)}, y su coeficiente es ${num2(coef[e])}: $x = (${f(ce)} − ${f(c0[e])}) / ${num2(nu[e])} = ${f(x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c0, x, ceq) });
    pasos.push({ t: 'Kc', html: `$${exprK(sc, coef)} = ${f(K)}$` });
    const out = { modo: 'K', coef, nu, c0, ceq, x, K, ...limites(c0, nu), pasos };
    if (c0[0] > 0) out.alfa = (coef[0] * x) / c0[0];
    if (out.alfa !== undefined) pasos.push({ t: 'Conversión', html: `Se ha consumido el ${f(100 * out.alfa)} % de ${nh(nom(sc, 0))}: $α = a·x / ${conc(sc, 0)}_0 = ${num2(coef[0])} · ${f(x)} / ${f(c0[0])} = ${f(out.alfa)}$.` });
    cierre(sc, out, K, nu, ceq);
    return out;
  }
  // Kp si hay temperatura (común a todos los modos)
  function cierre(sc, out, K, nu, ceq) {
    const T = num(sc, 'T', 'la temperatura', { min: 0, estricto: true, opcional: true, def: null });
    if (T !== null) { const k = pasoKp(sc, K, nu, T, ceq); out.T = T; out.Kp = k.Kp; out.dn = k.dn; out.P = k.P; out.Pt = k.Pt; out.pasos.push(k.paso); } else { out.dn = nu.reduce((s, v) => s + v, 0); }
  }

  /* ---------- modo eq: concentraciones de equilibrio ---------- */
  function modoEq(sc, base) {
    const { coef, nu } = base, c0 = leeConc(sc, nu, 'la concentración inicial'), K = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q0 = cociente(c0, nu), s0 = sentido(Q0, K), r = avance(c0, nu, K), ceq = equilibrio(c0, nu, r.x);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    pasos.push({ t: 'Qué pasa al principio', html: `Con las concentraciones iniciales, $Q = ${f(Q0)}$ y $K_c = ${f(K)}$: como $Q ${s0 === 'eq' ? '=' : Q0 < K ? '<' : '>'} K$, la reacción ${TXT_SENT[s0]}.` });
    pasos.push({ t: 'Tabla de concentraciones', html: `Sea $x$ lo que avanza la reacción (mol/L). ${r.x < 0 ? 'Como sale negativo, en realidad retrocede.' : ''}` + '<br>' + tablaICE(sc, nu, coef, c0, r.x, ceq) });
    pasos.push({ t: 'Ecuación para x', html: `${ecuacionX(sc, coef, nu, c0, K)}. Se resuelve para $x$ entre ${f(r.lo)} y ${f(r.hi)} (el intervalo en que ninguna concentración es negativa); como $K$ crece con $x$ solo hay una solución válida: $x = ${f(r.x)} "mol/L"$.` });
    pasos.push({ t: 'Concentraciones de equilibrio', html: presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])} "mol/L"$`).join(', ') + `. Comprobación: $Q = ${f(cociente(ceq, nu))}$.` });
    const out = { modo: 'eq', coef, nu, c0, ceq, x: r.x, K, Q0, s0, lo: r.lo, hi: r.hi, pasos };
    if (c0[0] > 0 && r.x > 0) { out.alfa = (coef[0] * r.x) / c0[0]; pasos.push({ t: 'Conversión', html: `Se consume el ${f(100 * out.alfa)} % de ${nh(nom(sc, 0))}: $α = a·x / ${conc(sc, 0)}_0 = ${f(out.alfa)}$.` }); }
    cierre(sc, out, K, nu, ceq);
    return out;
  }

  /* ---------- modo Q: cociente de reacción ---------- */
  function modoQ(sc, base) {
    const { coef, nu } = base, c = leeConc(sc, nu, 'la concentración'), K = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q = cociente(c, nu), s = sentido(Q, K), r = avance(c, nu, K), ceq = equilibrio(c, nu, r.x);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    pasos.push({ t: 'Cociente de reacción', html: `Q tiene la misma forma que $K$ pero con las concentraciones de ahora: $${exprK(sc, coef).replace('K_c', 'Q')} = ${f(Q)}$.` });
    pasos.push({ t: 'Q frente a K', html: `$Q = ${f(Q)}$ y $K_c = ${f(K)}$. ${s === 'eq' ? 'Son iguales: el sistema está en equilibrio y no cambia.' : Q < K ? 'Como $Q < K$ hay demasiado reactivo para el equilibrio: la reacción avanza hacia la <b>derecha</b>.' : 'Como $Q > K$ hay demasiado producto para el equilibrio: la reacción retrocede hacia la <b>izquierda</b>.'}` });
    pasos.push({ t: 'Dónde acaba', html: `Hasta llegar al equilibrio la reacción avanza $x = ${f(r.x)} "mol/L"$: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])}$`).join(', ')}.` + '<br>' + tablaICE(sc, nu, coef, c, r.x, ceq) });
    const out = { modo: 'Q', coef, nu, c0: c, ceq, x: r.x, K, Q, s0: s, lo: r.lo, hi: r.hi, pasos };
    cierre(sc, out, K, nu, ceq);
    return out;
  }

  /* ---------- modo lc: Le Chatelier con números ---------- */
  const TIPOS_LC = [['anadir', 'Añadir una especie'], ['quitar', 'Quitar una especie'], ['volumen', 'Cambiar el volumen (comprimir o expandir)'], ['temperatura', 'Cambiar la temperatura'], ['inerte', 'Añadir un gas inerte a volumen constante'], ['catalizador', 'Añadir un catalizador']];
  function modoLC(sc, base) {
    const { coef, nu } = base, c0 = leeConc(sc, nu, 'la concentración inicial'), K1 = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const r1 = avance(c0, nu, K1), c1 = equilibrio(c0, nu, r1.x), tipo = sc.tipo || 'anadir';
    const pasos = [cabecera(sc, coef, K1, 'dado')];
    pasos.push({ t: 'Equilibrio de partida', html: `Con las concentraciones iniciales se llega a $x = ${f(r1.x)} "mol/L"$: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(c1[i])}$`).join(', ')}. Es un equilibrio: $Q = ${f(cociente(c1, nu))} = K_c$.` });
    let c2 = c1.slice(), K2 = K1, desc = '', porque = '', dn = nu.reduce((s, v) => s + v, 0);
    const e = L.indexOf(String(sc.esp || 'A'));
    if (tipo === 'anadir' || tipo === 'quitar') {
      if (e < 0 || !nu[e]) throw new Error('Elige una especie que esté en la reacción');
      const q = num(sc, 'cant', 'la cantidad (mol/L)', { min: 0, estricto: true });
      if (tipo === 'quitar' && q >= c1[e]) throw new Error(`No se pueden quitar ${f(q)} mol/L de ${nom(sc, e)}: en el equilibrio solo hay ${f(c1[e])}`);
      c2[e] += tipo === 'anadir' ? q : -q;
      desc = `${tipo === 'anadir' ? 'Se añaden' : 'Se quitan'} ${f(q)} mol/L de ${nh(nom(sc, e))} sin cambiar el volumen ni la temperatura, así que $K_c$ no cambia.`;
      porque = tipo === 'anadir' ? `El sistema se opone al aumento de ${nh(nom(sc, e))} consumiendo parte de él.` : `El sistema se opone a la falta de ${nh(nom(sc, e))} produciendo más.`;
    } else if (tipo === 'volumen') {
      const rv = num(sc, 'rv', 'el volumen final entre el inicial (V₂/V₁)', { min: 0, estricto: true });
      c2 = c1.map((v, i) => (nu[i] ? v / rv : v));
      desc = `El volumen pasa a ser ${f(rv)} veces el inicial (${rv < 1 ? 'se comprime' : rv > 1 ? 'se expande' : 'no cambia'}), así que todas las concentraciones se multiplican por $1/${f(rv)}$ = ${f(1 / rv)}; $K_c$ no cambia (misma temperatura).`;
      porque = dn === 0 ? 'Hay los mismos moles de gas a cada lado (Δn = 0): el volumen no desplaza el equilibrio, solo cambia todas las concentraciones en la misma proporción.' : `Δn = ${num2(dn)} moles de gas. ${rv < 1 ? 'Al comprimir sube la presión y el sistema la reduce yendo al lado con menos moles de gas' : 'Al expandir baja la presión y el sistema la sube yendo al lado con más moles de gas'}.`;
    } else if (tipo === 'temperatura') {
      const T1 = num(sc, 'T', 'la temperatura inicial (K)', { min: 0, estricto: true }), T2 = num(sc, 'T2', 'la temperatura final (K)', { min: 0, estricto: true }), dH = num(sc, 'dH', 'ΔH de la reacción hacia la derecha (kJ/mol)');
      K2 = K1 * Math.exp((-dH * 1000 / R_J) * (1 / T2 - 1 / T1));
      desc = `La temperatura pasa de ${f(T1)} K a ${f(T2)} K. La constante cambia con la ecuación de Van't Hoff: $ln {K_2}/{K_1} = −{ΔH}/{R} (1/T_2 − 1/T_1)$ = $−{${f(dH * 1000)}}/{${R_J}} (1/${f(T2)} − 1/${f(T1)})$ ⇒ $K_2 = ${f(K2)}$. Las concentraciones no cambian en el primer instante.`;
      porque = `La reacción hacia la derecha es ${dH > 0 ? 'endotérmica (ΔH > 0)' : dH < 0 ? 'exotérmica (ΔH < 0)' : 'neutra (ΔH = 0)'}: ${dH === 0 ? 'la temperatura no cambia K.' : (dH > 0) === (T2 > T1) ? 'subir la temperatura favorece la que absorbe calor y bajarla la que lo desprende, y K ' + (K2 > K1 ? 'aumenta' : 'disminuye') + '.' : 'el sistema se opone al cambio de temperatura y K ' + (K2 > K1 ? 'aumenta' : 'disminuye') + '.'}`;
    } else if (tipo === 'inerte') {
      desc = 'Se añade un gas que no reacciona sin cambiar el volumen: las presiones parciales y las concentraciones de las especies no cambian.';
      porque = 'Q sigue valiendo K: el equilibrio no se desplaza. (Si se añadiera a presión constante, el volumen crecería y habría que usar la opción de expandir.)';
    } else {
      desc = 'Un catalizador baja la energía de activación de la reacción directa y de la inversa por igual.';
      porque = 'Q sigue valiendo K y K no cambia: el equilibrio no se desplaza, solo se alcanza más deprisa.';
    }
    const Q2 = cociente(c2, nu), s = sentido(Q2, K2), r2 = avance(c2, nu, K2), c3 = equilibrio(c2, nu, r2.x);
    pasos.push({ t: 'La perturbación', html: desc });
    pasos.push({ t: 'Q frente a K tras el cambio', html: `$Q = ${f(Q2)}$ y $K_c = ${f(K2)}$. ${s === 'eq' ? 'Siguen siendo iguales: <b>el equilibrio no se desplaza</b>.' : Q2 < K2 ? 'Como $Q < K$, la reacción avanza hacia la <b>derecha</b>.' : 'Como $Q > K$, la reacción retrocede hacia la <b>izquierda</b>.'} ${porque}` });
    if (s !== 'eq') pasos.push({ t: 'Nuevo equilibrio', html: `Se resuelve $K_c = ${f(K2)}$ partiendo de las concentraciones tras el cambio: $x = ${f(r2.x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c2, r2.x, c3) });
    const cmp = (i) => `<tr><th>${nh(nom(sc, i))}</th><td>${f(c1[i])}</td><td>${f(c2[i])}</td><td><b>${f(c3[i])}</b></td></tr>`;
    pasos.push({ t: 'Antes y después', html: `<table class="tabla"><tr><th>mol/L</th><th>Equilibrio inicial</th><th>Justo tras el cambio</th><th>Nuevo equilibrio</th></tr>${presentes(nu).map(cmp).join('')}</table>` });
    const out = { modo: 'lc', coef, nu, tipo, c0: c2, c1, c2, ceq: c3, x: r2.x, K: K1, K2, Q: Q2, s0: s, lo: r2.lo, hi: r2.hi, dn, pasos };
    if (!(tipo === 'temperatura') && sc.T !== undefined && !vacio(sc.T)) cierre(sc, out, K1, nu, c3);
    return out;
  }

  function resolver(sc) {
    const base = lee(sc);
    if (!presentes(base.nu).some((i) => base.nu[i] < 0) || !presentes(base.nu).some((i) => base.nu[i] > 0)) throw new Error('Hace falta al menos un reactivo y un producto');
    const m = sc.modo || 'K';
    const r = m === 'eq' ? modoEq(sc, base) : m === 'Q' ? modoQ(sc, base) : m === 'lc' ? modoLC(sc, base) : modoK(sc, base);
    r.nombres = [0, 1, 2, 3].map((i) => nom(sc, i));
    r.reaccion = reaccionH(sc, base.coef);
    return r;
  }

  const ej = (clave, nombre, sc) => ({ clave, nombre, sc: Object.assign({ nA: 'H2', nB: 'I2', nC: 'HI', nD: '', a: '1', b: '1', c: '2', d: '', cA: '', cB: '', cC: '', cD: '', T: '' }, sc) });
  const N2O4 = { nA: 'N2O4', nB: '', nC: 'NO2', nD: '', a: '1', b: '', c: '2', d: '' };
  const ejemplos = [
    ej('hi', 'H₂ + I₂ ⇌ 2 HI: concentraciones con Kc = 50', { modo: 'eq', cA: '1', cB: '1', K: '50', T: '731' }),
    ej('n2o4', 'N₂O₄ ⇌ 2 NO₂: grado de disociación', { ...N2O4, modo: 'eq', cA: '0,1', cC: '0', K: '0,2', T: '400' }),
    ej('calcular-k', 'Calcular Kc a partir de [HI] medida', { modo: 'K', cA: '1', cB: '1', especie: 'C', ceq: '1,2' }),
    ej('q', 'N₂O₄ ⇌ 2 NO₂: ¿hacia dónde va?', { ...N2O4, modo: 'Q', cA: '0,1', cC: '0,4', K: '0,2' }),
    ej('lc-anadir', 'Le Chatelier: añadir H₂ al equilibrio', { modo: 'lc', cA: '1', cB: '1', K: '50', tipo: 'anadir', esp: 'A', cant: '1' }),
    ej('lc-volumen', 'Le Chatelier: comprimir N₂O₄ ⇌ 2 NO₂ a la mitad', { ...N2O4, modo: 'lc', cA: '0,1', cC: '0', K: '0,2', tipo: 'volumen', rv: '0,5' }),
    ej('lc-temperatura', 'Le Chatelier: calentar N₂O₄ ⇌ 2 NO₂ (ΔH = +57,2 kJ/mol)', { ...N2O4, modo: 'lc', cA: '0,1', cC: '0', K: '4,6e-3', T: '298', tipo: 'temperatura', T2: '350', dH: '57,2' }),
  ];

  return { resolver, ejemplos, f, leeNum, cociente, avance, TIPOS_LC };
})();
if (typeof module !== 'undefined') module.exports = Equilibrio;
