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
     dG  K a partir de ΔG° y la temperatura (K = e^(−ΔG°/RT)) y de ahí el equilibrio
     dos dos reacciones a la vez que comparten especies (cinco especies A–E, un
         avance por reacción, resuelto por bisecciones anidadas)
   Fases: cada especie puede ser gas (g), disuelta (aq), sólido (s) o líquido puro (l).
   Los sólidos y líquidos no entran en Q ni en K (actividad 1); un sólido sin cantidad
   se supone en exceso, y con cantidad puede agotarse antes de llegar al equilibrio.
   Kp solo si todo lo que entra en K es gas.
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
  const Aj = typeof Ajuste !== 'undefined' ? Ajuste : require('../quimica/ajuste.js');
  // R de clase (8,314 J/(mol·K), 0,082 atm·L/(mol·K), 0,083145 bar·L/(mol·K)) o exacta, según el ajuste común de Química
  let R_ATM = 0.082, R_J = 8.314, R_BAR = 0.083145;
  const ajusta = () => { const v = Aj.valores(); R_ATM = v.Ratm; R_J = v.R; R_BAR = v.Rbar; };
  const L = ['A', 'B', 'C', 'D'];
  const FASES = [['g', 'gas (g)'], ['aq', 'disuelta (aq)'], ['s', 'sólido (s)'], ['l', 'líquido (l)']];
  const fase = (sc, i) => { const v = sc['f' + L[i]]; return FASES.some(([k]) => k === v) ? v : 'g'; };
  const puro = (sc, i) => fase(sc, i) === 's' || fase(sc, i) === 'l';

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
    const nu = [-a, -b, c, d];
    return { coef: [a, b, c, d], nu, act: nu.map((v, i) => (puro(sc, i) ? 0 : v)) };
  }
  const presentes = (nu) => [0, 1, 2, 3].filter((i) => nu[i] !== 0);
  const ladoH = (sc, coef, idx) => idx.filter((i) => coef[i] > 0).map((i) => (coef[i] === 1 ? '' : num2(coef[i]) + ' ') + nh(nom(sc, i)) + (fase(sc, i) === 'g' ? '' : `<span class="fase">(${fase(sc, i)})</span>`)).join(' + ');
  const reaccionH = (sc, coef) => `${ladoH(sc, coef, [0, 1])} ⇌ ${ladoH(sc, coef, [2, 3])}`;
  const conc = (sc, i) => `[${qn(nom(sc, i))}]`;
  const pot = (sc, i, p) => conc(sc, i) + (p === 1 ? '' : `^{${num2(p)}}`);
  const exprK = (sc, coef, k = 'c') => {
    const lado = (idx) => idx.filter((i) => coef[i] > 0 && !puro(sc, i)).map((i) => pot(sc, i, coef[i])).join(' ') || '1';
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
  function limites(c0, nu, libre = []) {
    let lo = -Infinity, hi = Infinity;
    for (const i of presentes(nu)) { if (libre[i]) continue; if (nu[i] > 0) lo = Math.max(lo, -c0[i] / nu[i]); else hi = Math.min(hi, c0[i] / -nu[i]); }
    return { lo, hi };
  }
  // avance x tal que Q(c₀ + νx) = K (act: ν de lo que entra en K; libre: sólidos en exceso, sin límite)
  function avance(c0, nu, K, act = nu, libre = []) {
    const { lo, hi } = limites(c0, nu, libre);
    if (!(hi - lo > 1e-15)) throw new Error('Con esas concentraciones la reacción no puede avanzar en ningún sentido: pon algo de reactivo o de producto');
    const g = (x) => { let s = -Math.log(K); for (const i of presentes(act)) s += act[i] * Math.log(c0[i] + act[i] * x); return s; };
    if (isFinite(hi) && isFinite(g(hi)) && g(hi) < 0) return { x: hi, lo, hi, agotado: true }; // se agota un sólido antes del equilibrio
    if (isFinite(lo) && isFinite(g(lo)) && g(lo) > 0) return { x: lo, lo, hi, agotado: true };
    let a = lo, b = hi; const esc = Math.max(1, ...c0.map(Math.abs));
    if (!isFinite(b)) { b = (isFinite(a) ? a : 0) + esc; for (let k = 0; k < 400 && g(b) < 0; k++) b = a + (b - a) * 2; }
    if (!isFinite(a)) { a = (isFinite(b) ? b : 0) - esc; for (let k = 0; k < 400 && g(a) > 0; k++) a = b - (b - a) * 2; }
    for (let k = 0; k < 400; k++) {
      const m = (a + b) / 2, v = g(m);
      if (!isFinite(v)) break;
      if (v > 0) b = m; else a = m;
      if (b - a <= 1e-16 * Math.max(1, Math.abs(m))) break;
    }
    return { x: (a + b) / 2, lo, hi };
  }
  const lim = (v) => (isFinite(v) ? f(v) : v < 0 ? '−∞' : '+∞');
  const equilibrio = (c0, nu, x, libre = []) => c0.map((v, i) => (libre[i] ? NaN : nu[i] ? Math.max(0, v + nu[i] * x) : v));
  const libres = (sc, nu) => [0, 1, 2, 3].map((i) => !!nu[i] && puro(sc, i) && vacio(sc['c' + L[i]]));

  // lectura de las concentraciones (vacío = 0)
  function leeConc(sc, nu, ropa) {
    return [0, 1, 2, 3].map((i) => (nu[i] ? num(sc, 'c' + L[i], `${ropa} de ${nom(sc, i)}`, { min: 0, opcional: true, def: 0 }) : 0));
  }

  /* ---------- pasos ---------- */
  const filaTabla = (t, xs) => `<tr><th>${t}</th>${xs.map((x) => `<td>${x}</td>`).join('')}</tr>`;
  function tablaICE(sc, nu, coef, c0, x, ceq) {
    const idx = presentes(nu);
    const cab = `<tr><th><span class="solo-lector">Especie</span></th>${idx.map((i) => `<th>${nh(nom(sc, i))}</th>`).join('')}</tr>`;
    const lib = libres(sc, nu), ini = filaTabla('Inicial', idx.map((i) => (lib[i] ? 'en exceso' : f(c0[i]))));
    const cam = filaTabla('Cambio', idx.map((i) => `${nu[i] < 0 ? '−' : '+'}${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`));
    const eq = filaTabla('Equilibrio', idx.map((i) => (lib[i] ? 'en exceso' : `${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`)));
    const num_ = filaTabla('x = ' + f(x), idx.map((i) => (lib[i] ? '—' : `<b>${f(ceq[i])}</b>`)));
    return `<table class="tabla">${cab}${ini}${cam}${eq}${num_}</table>`;
  }
  const gasesSolo = (sc, act) => { const ids = presentes(act); return ids.length > 0 && ids.every((i) => fase(sc, i) === 'g'); };
  const kp = (K, act, T, Rg = R_ATM) => { const dn = act.reduce((s, v) => s + v, 0); return { dn, Kp: K * Math.pow(Rg * T, dn) }; };
  function pasoKp(sc, K, act, T, ceq, Rg) {
    const { dn, Kp } = kp(K, act, T, Rg), P = ceq.map((v, i) => (act[i] ? v * Rg * T : 0)), Pt = P.reduce((s, v) => s + v, 0), u = Rg === R_ATM ? 'atm' : 'bar', rt = Rg === R_ATM ? '0,082' : '0,083145';
    const parc = presentes(act).map((i) => `$p_{${qn(nom(sc, i))}} = c·R·T = ${f(ceq[i])} · ${rt} · ${f(T)} = ${f(P[i])} "${u}"$`).join('; ');
    return { Kp, dn, P, Pt, paso: { t: 'Kp y presiones parciales', html: `Con $T = ${f(T)} "K"$ y suponiendo gases ideales: $Δn = ${num2(dn)}$ (moles gaseosos de productos menos de reactivos; los sólidos y líquidos no cuentan), así que $K_p = K_c (R T)^{Δn} = ${f(K)} · (${rt} · ${f(T)})^{${num2(dn)}} = ${f(Kp)}$. Presiones parciales: ${parc}. Presión total: $P = ${f(Pt)} "${u}"$.` } };
  }
  const ecuacionX = (sc, coef, nu, c0, K) => {
    const termino = (i) => { const p = coef[i], base = `(${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${p === 1 ? '' : num2(p) + '·'}x)`; return base + (p === 1 ? '' : `^{${num2(p)}}`); };
    const lado = (idx) => idx.filter((i) => coef[i] > 0 && !puro(sc, i)).map(termino).join(' · ') || '1';
    return `$K_c = ${f(K)} = {${lado([2, 3])}}/{${lado([0, 1])}}$`;
  };

  function cabecera(sc, coef, K, kind) {
    return { t: 'La reacción y su constante', html: `$${exprK(sc, coef)}$${kind === 'dado' ? `, con $K_c = ${f(K)}$` : ''}. La reacción es ${reaccionH(sc, coef)}. Los sólidos y líquidos puros no entran en $K$ (su actividad es 1); lo que no marques como sólido o líquido se toma como gas o disuelto.` };
  }

  /* ---------- modo K: constante a partir de un equilibrio medido ---------- */
  function modoK(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'la concentración inicial');
    const e = L.indexOf(String(sc.especie || 'C'));
    if (e < 0 || !nu[e]) throw new Error('Elige una especie que esté en la reacción');
    if (puro(sc, e)) throw new Error('La especie medida no puede ser un sólido ni un líquido puro: su concentración no cambia. Elige un gas o una especie disuelta');
    const ce = num(sc, 'ceq', `la concentración de equilibrio de ${nom(sc, e)}`, { min: 0 });
    const x = (ce - c0[e]) / nu[e];
    const ceq = c0.map((v, i) => (nu[i] ? v + nu[i] * x : v));
    if (ceq.some((v, i) => nu[i] && !libre[i] && v < -1e-12)) throw new Error('Con esos datos alguna concentración de equilibrio sale negativa: revisa la concentración medida o las iniciales');
    if (presentes(act).some((i) => !(ceq[i] > 1e-12))) throw new Error('Alguna especie se agota por completo: la reacción es total y K no se puede calcular con estos datos');
    const K = Math.exp(presentes(act).reduce((s, i) => s + act[i] * Math.log(ceq[i]), 0));
    const pasos = [cabecera(sc, coef, K, 'calcula')];
    pasos.push({ t: 'Datos', html: `Concentraciones iniciales: ${presentes(nu).map((i) => `$${conc(sc, i)}_0 = ${f(c0[i])}$`).join(', ')} (mol/L). En el equilibrio se mide $${conc(sc, e)} = ${f(ce)} "mol/L"$.` });
    pasos.push({ t: 'Cuánto ha avanzado la reacción', html: `De ${nh(nom(sc, e))} ha pasado de ${f(c0[e])} a ${f(ce)}, y su coeficiente es ${num2(coef[e])}: $x = (${f(ce)} − ${f(c0[e])}) / ${num2(nu[e])} = ${f(x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c0, x, ceq) });
    pasos.push({ t: 'Kc', html: `$${exprK(sc, coef)} = ${f(K)}$` });
    const out = { modo: 'K', coef, nu, act, libre, c0, ceq, x, K, ...limites(c0, nu, libre), pasos };
    if (c0[0] > 0) out.alfa = (coef[0] * x) / c0[0];
    if (out.alfa !== undefined) pasos.push({ t: 'Grado de disociación (conversión)', html: `Se ha consumido el ${f(100 * out.alfa)} % de ${nh(nom(sc, 0))}: $α = a·x / ${conc(sc, 0)}_0 = ${num2(coef[0])} · ${f(x)} / ${f(c0[0])} = ${f(out.alfa)}$.` });
    cierre(sc, out, K, act, ceq);
    return out;
  }
  // Kp si hay temperatura y todo lo que entra en K es gas (común a todos los modos)
  function cierre(sc, out, K, act, ceq) {
    const T = num(sc, 'T', 'la temperatura', { min: 0, estricto: true, opcional: true, def: null });
    out.dn = act.reduce((s, v) => s + v, 0);
    if (T !== null && gasesSolo(sc, act)) { const k = pasoKp(sc, K, act, T, ceq, out.modo === 'dG' ? R_BAR : R_ATM); out.T = T; out.Kp = k.Kp; out.dn = k.dn; out.P = k.P; out.Pt = k.Pt; out.pasos.push(k.paso); }
  }

  /* ---------- modo eq: concentraciones de equilibrio ---------- */
  function modoEq(sc, base, dG) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'la concentración inicial'), K = dG ? dG.K : num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q0 = cociente(c0, act), s0 = sentido(Q0, K), r = avance(c0, nu, K, act, libre), ceq = equilibrio(c0, nu, r.x, libre);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    if (dG) pasos.splice(0, 0, ...dG.pasos);
    if (r.agotado) pasos.push({ t: 'Aviso: se agota un sólido', html: 'La cantidad de sólido que has puesto se agota antes de llegar al equilibrio: la reacción avanza hasta consumirlo y <b>no se alcanza el equilibrio</b> con ese valor de K. Las concentraciones que salen son las finales.' });
    pasos.push({ t: 'Qué pasa al principio', html: `Con las concentraciones iniciales, $Q = ${f(Q0)}$ y $K_c = ${f(K)}$: como $Q ${s0 === 'eq' ? '=' : Q0 < K ? '<' : '>'} K$, la reacción ${TXT_SENT[s0]}.` });
    pasos.push({ t: 'Tabla de concentraciones', html: `Sea $x$ lo que avanza la reacción (mol/L). ${r.x < 0 ? 'Como sale negativo, en realidad retrocede.' : ''}` + '<br>' + tablaICE(sc, nu, coef, c0, r.x, ceq) });
    pasos.push({ t: 'Ecuación para x', html: `${ecuacionX(sc, coef, nu, c0, K)}. Se resuelve para $x$ entre ${lim(r.lo)} y ${lim(r.hi)} (el intervalo en que ninguna concentración es negativa); como $K$ crece con $x$ solo hay una solución válida: $x = ${f(r.x)} "mol/L"$.` });
    pasos.push({ t: 'Concentraciones de equilibrio', html: presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])} "mol/L"$`).join(', ') + `. Comprobación: $Q = ${f(cociente(ceq, act))}$.` });
    const out = { modo: dG ? 'dG' : 'eq', coef, nu, act, libre, c0, ceq, x: r.x, K, Q0, s0, lo: r.lo, hi: r.hi, agotado: !!r.agotado, pasos };
    if (c0[0] > 0 && r.x > 0) { out.alfa = (coef[0] * r.x) / c0[0]; pasos.push({ t: 'Grado de disociación (conversión)', html: `Se consume el ${f(100 * out.alfa)} % de ${nh(nom(sc, 0))}: $α = a·x / ${conc(sc, 0)}_0 = ${f(out.alfa)}$.` }); }
    cierre(sc, out, K, act, ceq);
    if (dG) { out.dG = dG.dG; out.Kp0 = dG.Kp; }
    return out;
  }

  /* ---------- modo Q: cociente de reacción ---------- */
  function modoQ(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c = leeConc(sc, nu, 'la concentración'), K = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q = cociente(c, act), s = sentido(Q, K), r = avance(c, nu, K, act, libre), ceq = equilibrio(c, nu, r.x, libre);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    pasos.push({ t: 'Cociente de reacción', html: `Q tiene la misma forma que $K$ pero con las concentraciones de ahora: $${exprK(sc, coef).replace('K_c', 'Q')} = ${f(Q)}$.` });
    pasos.push({ t: 'Q frente a K', html: `$Q = ${f(Q)}$ y $K_c = ${f(K)}$. ${s === 'eq' ? 'Son iguales: el sistema está en equilibrio y no cambia.' : Q < K ? 'Como $Q < K$ hay demasiado reactivo para el equilibrio: la reacción avanza hacia la <b>derecha</b>.' : 'Como $Q > K$ hay demasiado producto para el equilibrio: la reacción retrocede hacia la <b>izquierda</b>.'}` });
    pasos.push({ t: 'Dónde acaba', html: `Hasta llegar al equilibrio la reacción avanza $x = ${f(r.x)} "mol/L"$: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])}$`).join(', ')}.` + '<br>' + tablaICE(sc, nu, coef, c, r.x, ceq) });
    const out = { modo: 'Q', coef, nu, act, libre, c0: c, ceq, x: r.x, K, Q, s0: s, lo: r.lo, hi: r.hi, agotado: !!r.agotado, pasos };
    cierre(sc, out, K, act, ceq);
    return out;
  }

  /* ---------- modo lc: Le Chatelier con números ---------- */
  const TIPOS_LC = [['anadir', 'Añadir una especie'], ['quitar', 'Quitar una especie'], ['volumen', 'Cambiar el volumen (comprimir o expandir)'], ['temperatura', 'Cambiar la temperatura'], ['inerte', 'Añadir un gas inerte a volumen constante'], ['catalizador', 'Añadir un catalizador']];
  function modoLC(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'la concentración inicial'), K1 = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const r1 = avance(c0, nu, K1, act, libre), c1 = equilibrio(c0, nu, r1.x, libre), tipo = sc.tipo || 'anadir';
    const pasos = [cabecera(sc, coef, K1, 'dado')];
    pasos.push({ t: 'Equilibrio de partida', html: `Con las concentraciones iniciales se llega a $x = ${f(r1.x)} "mol/L"$: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(c1[i])}$`).join(', ')}. Es un equilibrio: $Q = ${f(cociente(c1, act))} = K_c$.` });
    let c2 = c1.slice(), K2 = K1, desc = '', porque = '', dn = act.reduce((s, v) => s + v, 0);
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
      c2 = c1.map((v, i) => (act[i] ? v / rv : v));
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
    const Q2 = cociente(c2, act), s = sentido(Q2, K2), r2 = avance(c2, nu, K2, act, libre), c3 = equilibrio(c2, nu, r2.x, libre);
    pasos.push({ t: 'La perturbación', html: desc });
    pasos.push({ t: 'Q frente a K tras el cambio', html: `$Q = ${f(Q2)}$ y $K_c = ${f(K2)}$. ${s === 'eq' ? 'Siguen siendo iguales: <b>el equilibrio no se desplaza</b>.' : Q2 < K2 ? 'Como $Q < K$, la reacción avanza hacia la <b>derecha</b>.' : 'Como $Q > K$, la reacción retrocede hacia la <b>izquierda</b>.'} ${porque}` });
    if (s !== 'eq') pasos.push({ t: 'Nuevo equilibrio', html: `Se resuelve $K_c = ${f(K2)}$ partiendo de las concentraciones tras el cambio: $x = ${f(r2.x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c2, r2.x, c3) });
    const cmp = (i) => `<tr><th>${nh(nom(sc, i))}</th><td>${f(c1[i])}</td><td>${f(c2[i])}</td><td><b>${f(c3[i])}</b></td></tr>`;
    pasos.push({ t: 'Antes y después', html: `<table class="tabla"><tr><th>mol/L</th><th>Equilibrio inicial</th><th>Justo tras el cambio</th><th>Nuevo equilibrio</th></tr>${presentes(nu).map(cmp).join('')}</table>` });
    const out = { modo: 'lc', coef, nu, act, libre, tipo, c0: c2, c1, c2, ceq: c3, x: r2.x, K: K1, K2, Q: Q2, s0: s, lo: r2.lo, hi: r2.hi, dn, pasos };
    if (!(tipo === 'temperatura') && sc.T !== undefined && !vacio(sc.T)) cierre(sc, out, K1, act, c3);
    return out;
  }


  /* ---------- modo dG: K a partir de ΔG° ---------- */
  function modoDG(sc, base) {
    const dG = num(sc, 'dG', 'ΔG° de la reacción (kJ por mol de reacción)'), T = num(sc, 'T', 'la temperatura (K)', { min: 0, estricto: true });
    const Kt = Math.exp((-dG * 1000) / (R_J * T));
    if (!(Kt > 1e-300 && Kt < 1e300)) throw new Error('Con ese ΔG° y esa temperatura K es prácticamente 0 o infinita: la reacción no ocurre o es total, no hay equilibrio que calcular');
    const gas = gasesSolo(sc, base.act), dn = base.act.reduce((s, v) => s + v, 0), K = gas ? Kt * Math.pow(R_BAR * T, -dn) : Kt;
    const pasos = [{ t: 'K a partir de ΔG°', html: `$K = e^{−{ΔG^"°"}/{R T}} = e^{−{${f(dG * 1000)}}/{${R_J} · ${f(T)}}} = ${f(Kt)}$.` + (gas ? ` Como todo es gas, esta es $K_p$ (estado estándar a 1 bar). Para trabajar en mol/L: $K_c = K_p (R T)^{−Δn} = ${f(Kt)} · (${num2(R_BAR)} · ${f(T)})^{${num2(-dn)}} = ${f(K)}$ con $R = ${num2(R_BAR)} "bar·L/(mol·K)"$ y $Δn = ${num2(dn)}$.` : ' K no tiene unidades; se usa como $K_c$ (estado estándar 1 mol/L).') }];
    return modoEq(sc, base, { K, dG, Kp: Kt, pasos });
  }

  /* ---------- modo dos: dos equilibrios acoplados ---------- */
  const L5 = ['A', 'B', 'C', 'D', 'E'];
  function modoDos(sc) {
    const nm = (i) => (vacio(sc['n' + L5[i]]) ? L5[i] : String(sc['n' + L5[i]]).trim());
    const leeNu = (r, i) => { const k = 'r' + r + L5[i]; if (vacio(sc[k])) return 0; const v = leeNum(sc[k]); if (!isFinite(v)) throw new Error(`El coeficiente de ${nm(i)} en la reacción ${r} debe ser un número (negativo si es reactivo)`); return v; };
    const nu1 = L5.map((_, i) => leeNu(1, i)), nu2 = L5.map((_, i) => leeNu(2, i));
    const c0 = L5.map((_, i) => { const k = 'c' + L5[i]; return vacio(sc[k]) ? 0 : num(sc, k, `la concentración de ${nm(i)}`, { min: 0 }); });
    const K1 = num(sc, 'K1', 'la constante K₁', { min: 0, estricto: true }), K2 = num(sc, 'K2', 'la constante K₂', { min: 0, estricto: true });
    for (const [r, nu] of [[1, nu1], [2, nu2]]) if (!nu.some((v) => v < 0) || !nu.some((v) => v > 0)) throw new Error(`La reacción ${r} necesita al menos un reactivo (coeficiente negativo) y un producto (positivo)`);
    let par = true; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (Math.abs(nu1[i] * nu2[j] - nu1[j] * nu2[i]) > 1e-12) par = false;
    if (par) throw new Error('Las dos reacciones son la misma (o una es múltiplo de la otra): con una sola K basta, usa los otros modos');
    const part = L5.map((_, i) => nu1[i] !== 0 || nu2[i] !== 0);
    const lnQ = (c, nu) => { let t = 0; for (let i = 0; i < 5; i++) if (nu[i]) t += nu[i] * Math.log(c[i]); return t; };
    const base = (x1) => c0.map((v, i) => v + nu1[i] * x1);
    // intervalo de x₂ que deja todas las concentraciones positivas, dado x₁ (ancho ≤ 0: x₁ no es posible)
    const rango2 = (x1) => {
      const b = base(x1); let lo = -Infinity, hi = Infinity, libre = Infinity;
      for (let i = 0; i < 5; i++) { if (nu2[i] > 0) lo = Math.max(lo, -b[i] / nu2[i]); else if (nu2[i] < 0) hi = Math.min(hi, b[i] / -nu2[i]); else if (nu1[i] !== 0) libre = Math.min(libre, b[i]); }
      return { lo, hi, ancho: Math.min(hi - lo, libre) };
    };
    const x2de = (x1) => {
      const { lo, hi } = rango2(x1); let a = lo, b = hi; const g = (x2) => lnQ(c0.map((v, i) => v + nu1[i] * x1 + nu2[i] * x2), nu2) - Math.log(K2);
      for (let k = 0; k < 300; k++) { const m = (a + b) / 2, v = g(m); if (!isFinite(v)) break; if (v > 0) b = m; else a = m; if (b - a < 1e-17 * Math.max(1, Math.abs(m))) break; }
      return (a + b) / 2;
    };
    const M = 1e3 * Math.max(1, c0.reduce((s, v) => s + v, 0));
    let a = -M, b = M;
    for (let k = 0; k < 300; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (rango2(m1).ancho < rango2(m2).ancho) a = m1; else b = m2; }
    const xm = (a + b) / 2;
    if (!(rango2(xm).ancho > 1e-14)) throw new Error('Con esas concentraciones ninguna de las dos reacciones puede avanzar: pon algo de reactivo');
    const borde = (x0, x1) => { let u = x0, v = x1; for (let k = 0; k < 300; k++) { const m = (u + v) / 2; if (rango2(m).ancho > 0) u = m; else v = m; } return u; };
    const A = rango2(-M).ancho > 0 ? -M : borde(xm, -M), B = rango2(M).ancho > 0 ? M : borde(xm, M);
    let u = Math.min(A, B), v = Math.max(A, B);
    // ln Q₁ − ln K₁ (con la reacción 2 en equilibrio) crece con x₁ y tiende a ∓∞ en los bordes
    const h = (x1) => { const x2 = x2de(x1); return lnQ(c0.map((c, i) => c + nu1[i] * x1 + nu2[i] * x2), nu1) - Math.log(K1); };
    for (let k = 0; k < 300; k++) { const m = (u + v) / 2, hv = h(m); if (!isFinite(hv)) break; if (hv > 0) v = m; else u = m; if (v - u < 1e-17 * Math.max(1, Math.abs(m))) break; }
    const x1 = (u + v) / 2, x2 = x2de(x1), ceq = c0.map((c, i) => Math.max(0, c + nu1[i] * x1 + nu2[i] * x2));
    const Q1 = Math.exp(lnQ(ceq, nu1)), Q2 = Math.exp(lnQ(ceq, nu2));
    const lado = (nu, sg) => L5.map((_, i) => (nu[i] * sg > 0 ? (Math.abs(nu[i]) === 1 ? '' : num2(Math.abs(nu[i])) + ' ') + nh(nm(i)) : '')).filter(Boolean).join(' + ');
    const ec = (nu) => `${lado(nu, -1)} ⇌ ${lado(nu, 1)}`;
    const kex = (nu, k) => { const t = (sg) => L5.map((_, i) => (nu[i] * sg > 0 ? `[${qn(nm(i))}]${Math.abs(nu[i]) === 1 ? '' : `^{${num2(Math.abs(nu[i]))}}`}` : '')).filter(Boolean).join(' '); return `K_${k} = {${t(1)}}/{${t(-1)}}`; };
    const idx = L5.map((_, i) => i).filter((i) => part[i]);
    const cam = (i) => [nu1[i] ? `${nu1[i] < 0 ? '−' : '+'}${Math.abs(nu1[i]) === 1 ? '' : num2(Math.abs(nu1[i])) + '·'}x₁` : '', nu2[i] ? `${nu2[i] < 0 ? '−' : '+'}${Math.abs(nu2[i]) === 1 ? '' : num2(Math.abs(nu2[i])) + '·'}x₂` : ''].join(' ').trim();
    const tabla = `<table class="tabla"><tr><th><span class="solo-lector">Especie</span></th>${idx.map((i) => `<th>${nh(nm(i))}</th>`).join('')}</tr><tr><th>Inicial</th>${idx.map((i) => `<td>${f(c0[i])}</td>`).join('')}</tr><tr><th>Cambio</th>${idx.map((i) => `<td>${cam(i)}</td>`).join('')}</tr><tr><th>Equilibrio</th>${idx.map((i) => `<td><b>${f(ceq[i])}</b></td>`).join('')}</tr></table>`;
    const pasos = [
      { t: 'Las dos reacciones', html: `Reacción 1: ${ec(nu1)}, con $${kex(nu1, 1)} = ${f(K1)}$.<br>Reacción 2: ${ec(nu2)}, con $${kex(nu2, 2)} = ${f(K2)}$.<br>Comparten especies, así que las dos constantes se cumplen a la vez con las mismas concentraciones.` },
      { t: 'Un avance por reacción', html: `Sean $x_1$ y $x_2$ lo que avanza cada reacción (mol/L). Cada especie cambia en la suma de lo que le toca de las dos:<br>${tabla}` },
      { t: 'Dos ecuaciones, dos incógnitas', html: 'Se exige $Q_1 = K_1$ y $Q_2 = K_2$ con esas concentraciones. En general no hay fórmula cerrada: se resuelve numéricamente (para cada $x_1$ se halla el $x_2$ que cumple la reacción 2 y después se busca el $x_1$ que cumple la 1; las dos funciones son monótonas, así que hay una sola solución).' },
      { t: 'Solución', html: `$x_1 = ${f(x1)} "mol/L"$ y $x_2 = ${f(x2)} "mol/L"$: ${idx.map((i) => `$[${qn(nm(i))}] = ${f(ceq[i])}$`).join(', ')}.` },
      { t: 'Comprobación', html: `$Q_1 = ${f(Q1)}$ (debe valer $K_1 = ${f(K1)}$) y $Q_2 = ${f(Q2)}$ (debe valer $K_2 = ${f(K2)}$).` },
    ];
    // curva para la gráfica: concentraciones frente a x₁ con la reacción 2 siempre en equilibrio
    const curva = [], paso = Math.max(Math.abs(x1), 1e-3), e0 = Math.max(Math.min(A, B), x1 - 6 * paso), e1 = Math.min(Math.max(A, B), x1 + 6 * paso);
    for (let k = 1; k < 80; k++) { const t = e0 + ((e1 - e0) * k) / 80; if (rango2(t).ancho > 1e-14) { const y2 = x2de(t); curva.push({ x: t, c: c0.map((c, i) => Math.max(0, c + nu1[i] * t + nu2[i] * y2)) }); } }
    return { modo: 'dos', nombres: L5.map((_, i) => nm(i)), nu1, nu2, c0, ceq, x: x1, x1, x2, K: K1, K1, K2, Q1, Q2, curva, part, reaccion: `${ec(nu1)}  ·  ${ec(nu2)}`, pasos, nu: part.map((p) => (p ? 1 : 0)) };
  }

  function resolver(sc) {
    ajusta();
    if (sc.modo === 'dos') return modoDos(sc);
    const base = lee(sc);
    if (!presentes(base.nu).some((i) => base.nu[i] < 0) || !presentes(base.nu).some((i) => base.nu[i] > 0)) throw new Error('Hace falta al menos un reactivo y un producto');
    if (!presentes(base.act).length) throw new Error('Todas las especies son sólidos o líquidos puros: K valdría 1 y no hay nada que calcular. Deja al menos un gas o una especie disuelta');
    const m = sc.modo || 'K';
    const r = m === 'dG' ? modoDG(sc, base) : m === 'eq' ? modoEq(sc, base) : m === 'Q' ? modoQ(sc, base) : m === 'lc' ? modoLC(sc, base) : modoK(sc, base);
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
    ej('carbonato', 'CaCO₃(s) ⇌ CaO(s) + CO₂(g): los sólidos no entran en K (Kc = 0,0025)', { modo: 'eq', nA: 'CaCO3', nB: '', nC: 'CaO', nD: 'CO2', a: '1', b: '', c: '1', d: '1', fA: 's', fC: 's', fD: 'g', cA: '', cD: '0', K: '0,0025', T: '1000' }),
    ej('carbono-co2', 'C(s) + CO₂(g) ⇌ 2 CO(g): con carbono en exceso (Kc = 0,2)', { modo: 'eq', nA: 'C', nB: 'CO2', nC: 'CO', nD: '', a: '1', b: '1', c: '2', d: '', fA: 's', fB: 'g', fC: 'g', cA: '', cB: '1', cC: '0', K: '0,2', T: '1100' }),
    ej('dg-amoniaco', 'N₂ + 3 H₂ ⇌ 2 NH₃ a 298 K con ΔG° = −32,8 kJ/mol (K desde ΔG°)', { modo: 'dG', nA: 'N2', nB: 'H2', nC: 'NH3', nD: '', a: '1', b: '3', c: '2', d: '', cA: '1', cB: '3', cC: '0', dG: '-32,8', T: '298' }),
    ej('dos-cadena', 'Dos equilibrios en cadena: A ⇌ B (K₁ = 2) y B ⇌ C (K₂ = 0,5), con 1 M de A', { modo: 'dos', nA: 'A', nB: 'B', nC: 'C', nD: '', nE: '', r1A: '-1', r1B: '1', r1C: '', r1D: '', r1E: '', r2A: '', r2B: '-1', r2C: '1', r2D: '', r2E: '', cA: '1', cB: '', cC: '', cD: '', cE: '', K1: '2', K2: '0,5' }),
    ej('dos-cloro', 'PCl₅ ⇌ PCl₃ + Cl₂ y Cl₂ + CO ⇌ COCl₂ (constantes de ejemplo)', { modo: 'dos', nA: 'PCl5', nB: 'PCl3', nC: 'Cl2', nD: 'CO', nE: 'COCl2', r1A: '-1', r1B: '1', r1C: '1', r1D: '', r1E: '', r2A: '', r2B: '', r2C: '-1', r2D: '-1', r2E: '1', cA: '0,5', cB: '', cC: '', cD: '1', cE: '', K1: '0,04', K2: '20' }),
    ej('lc-temperatura', 'Le Chatelier: calentar N₂O₄ ⇌ 2 NO₂ (ΔH = +57,2 kJ/mol)', { ...N2O4, modo: 'lc', cA: '0,1', cC: '0', K: '4,6e-3', T: '298', tipo: 'temperatura', T2: '350', dH: '57,2' }),
  ];

  return { resolver, ejemplos, f, leeNum, cociente, avance, TIPOS_LC };
})();
if (typeof module !== 'undefined') module.exports = Equilibrio;
