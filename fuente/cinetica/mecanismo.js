/* =====================================================================
   Cinética: reacciones consecutivas y reversibles, y mecanismos de reacción (sin DOM).
   · consecutivas(sc): A → B → C (k₁, k₂) y A ⇌ B (kf, kr) con las tres o dos concentraciones
     en el tiempo, el máximo de B y el instante en que se alcanza, y el equilibrio de A ⇌ B.
   · mecanismo(sc): etapas elementales escritas como texto («NO + NO <=> N2O2», «N2O2 + O2 -> 2NO2»);
     deduce la reacción global, la molecularidad de cada etapa y los intermedios, y obtiene la ley de
     velocidad por (a) etapa lenta, con equilibrios previos rápidos, o (b) estado estacionario del
     intermedio (uno solo), con los casos límite; compara con los órdenes experimentales.
   Las constantes de cada etapa se llaman k₁, k₋₁, k₂… según el número de la etapa.
   La interfaz está en cinetica/app.js y la prueba en pruebas/herramientas/cinetica.js.
   ===================================================================== */
const Mecanismo = (() => {
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `^{${sg === '-' ? '−' : ''}${+e}}`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  function num(sc, k, nom, { min = 0, estricto = true, opcional = false, def = 0 } = {}) {
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (estricto ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${estricto ? 'mayor que' : 'mayor o igual que'} ${min}`);
    return v;
  }

  /* ---------- A → B → C y A ⇌ B ---------- */
  function consecutivas(sc) {
    const A0 = num(sc, 'A0', 'la concentración inicial de A'), pasos = [];
    if (sc.tipo === 'rev') {
      const kf = num(sc, 'kf', 'la constante directa kf'), kr = num(sc, 'kr', 'la constante inversa kr'), B0 = num(sc, 'B0', 'la concentración inicial de B', { opcional: true, def: 0, min: 0, estricto: false });
      const tot = A0 + B0, K = kf / kr, Aeq = tot / (1 + K), Beq = tot - Aeq, s = kf + kr, tau = 1 / s, t12 = Math.LN2 / s;
      const A = (t) => Aeq + (A0 - Aeq) * Math.exp(-s * t), B = (t) => tot - A(t);
      pasos.push({ t: 'Velocidad de cada sentido', html: `$A ⇌ B$: $−{d[A]}/{dt} = k_f [A] − k_r [B]$. Como $[A] + [B] = ${f(tot)} "mol/L"$ es constante, queda $−{d[A]}/{dt} = (k_f + k_r)[A] − k_r ${f(tot)}$.` });
      pasos.push({ t: 'Equilibrio', html: `En el equilibrio las dos velocidades se igualan: $K = {k_f}/{k_r} = {${f(kf)}}/{${f(kr)}} = ${f(K)}$, con $[A]_"eq" = ${f(tot)}/(1 + K) = ${f(Aeq)} "mol/L"$ y $[B]_"eq" = ${f(Beq)} "mol/L"$.` });
      pasos.push({ t: 'Cómo se acerca al equilibrio', html: `La diferencia con el equilibrio decae como en orden 1 con constante $k_f + k_r = ${f(s)}$: $[A] = [A]_"eq" + ([A]_0 − [A]_"eq") e^{−(k_f + k_r) t}$. Constante de tiempo $τ = 1/(k_f + k_r) = ${f(tau)}$ y semivida del acercamiento $t_{1/2} = ln 2/(k_f + k_r) = ${f(t12)}$ (en la unidad de t); a $5τ$ se ha recorrido el 99,3 %.` });
      const tfin = 6 * tau, curva = Array.from({ length: 201 }, (_, i) => { const t = (tfin * i) / 200; return { t, A: A(t), B: B(t), C: 0 }; });
      return { modo: 'consecutivas', tipo: 'rev', A0, B0, kf, kr, K, Aeq, Beq, tau, t12, tfin, curva, especies: ['A', 'B'], pasos };
    }
    const k1 = num(sc, 'k1', 'la constante k₁ (A → B)'), k2 = num(sc, 'k2', 'la constante k₂ (B → C)'), igual = Math.abs(k1 - k2) <= 1e-9 * Math.max(k1, k2);
    const A = (t) => A0 * Math.exp(-k1 * t), B = (t) => (igual ? A0 * k1 * t * Math.exp(-k1 * t) : (A0 * k1 / (k2 - k1)) * (Math.exp(-k1 * t) - Math.exp(-k2 * t))), C = (t) => Math.max(0, A0 - A(t) - B(t));
    const tmax = igual ? 1 / k1 : Math.log(k2 / k1) / (k2 - k1), Bmax = B(tmax), tfin = 5 / Math.min(k1, k2) > 3 * tmax ? 5 / Math.min(k1, k2) : Math.max(3 * tmax, 5 / Math.min(k1, k2));
    pasos.push({ t: 'Las dos etapas', html: `$A → B$ con $v_1 = k_1 [A]$ y $B → C$ con $v_2 = k_2 [B]$ (las dos de orden 1). Entonces $d[A]/dt = −k_1 [A]$, $d[B]/dt = k_1 [A] − k_2 [B]$ y $d[C]/dt = k_2 [B]$.` });
    pasos.push({ t: 'Solución', html: `$[A] = [A]_0 e^{−k_1 t}$` + (igual ? ` y, como $k_1 = k_2 = k$, $[B] = [A]_0 k t e^{−kt}$.` : `, $[B] = {[A]_0 k_1}/{k_2 − k_1} (e^{−k_1 t} − e^{−k_2 t})$ y $[C] = [A]_0 − [A] − [B]$.`) });
    pasos.push({ t: 'Máximo de B', html: igual ? `Con $k_1 = k_2$: $d[B]/dt = 0$ en $t = 1/k = ${f(tmax)}$ y $[B]_"máx" = [A]_0/e = ${f(Bmax)} "mol/L"$.` : `$d[B]/dt = 0$ cuando $k_1 [A] = k_2 [B]$, que ocurre en $t_"máx" = {ln (k_2/k_1)}/{k_2 − k_1} = {ln (${f(k2)}/${f(k1)})}/{${f(k2 - k1)}} = ${f(tmax)}$, y entonces $[B]_"máx" = [A]_0 (k_1/k_2)^{k_2/(k_2 − k_1)} = ${f(Bmax)} "mol/L"$ (el ${f((100 * Bmax) / A0)} % de $[A]_0$).` });
    pasos.push({ t: 'Etapa lenta', html: k1 < k2 ? `Como $k_1 < k_2$, la primera etapa es la lenta: B se gasta en cuanto se forma, nunca se acumula mucho y C aparece casi a la velocidad de $A → B$ (aproximación del estado estacionario para B).` : k1 > k2 ? `Como $k_1 > k_2$, la segunda etapa es la lenta: A pasa rápido a B, B se acumula y es lo que limita la aparición de C.` : 'Las dos etapas igual de rápidas: no hay etapa lenta.' });
    const curva = Array.from({ length: 201 }, (_, i) => { const t = (tfin * i) / 200; return { t, A: A(t), B: B(t), C: C(t) }; });
    return { modo: 'consecutivas', tipo: 'abc', A0, k1, k2, tmax, Bmax, tfin, curva, especies: ['A', 'B', 'C'], pasos };
  }

  /* ---------- Mecanismos ---------- */
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (s) => String(s).replace(/\d/g, (d) => SUB[d]);
  const qn = (s) => String(s).replace(/([^\d]+)(\d+)?/g, (_, t, d) => `"${t}"${d ? `_{${d}}` : ''}`);
  const fr = (n) => (Number.isInteger(n) ? String(n) : Math.abs(n - 0.5) < 1e-9 ? '1/2' : Math.abs(n + 0.5) < 1e-9 ? '−1/2' : String(+n.toFixed(3)).replace('.', ',')).replace('-', '−');
  // monomio: { c: {constante: exponente}, s: {especie: exponente} }
  const mono = (c, s) => ({ c: { ...c }, s: { ...s } });
  const mul = (a, b) => { const r = mono(a.c, a.s); for (const [k, v] of Object.entries(b.c)) r.c[k] = (r.c[k] || 0) + v; for (const [k, v] of Object.entries(b.s)) r.s[k] = (r.s[k] || 0) + v; return limpia(r); };
  const inv = (a) => { const r = mono({}, {}); for (const [k, v] of Object.entries(a.c)) r.c[k] = -v; for (const [k, v] of Object.entries(a.s)) r.s[k] = -v; return r; };
  const pow = (a, p) => { const r = mono({}, {}); for (const [k, v] of Object.entries(a.c)) r.c[k] = v * p; for (const [k, v] of Object.entries(a.s)) r.s[k] = v * p; return r; };
  const limpia = (m) => { for (const o of [m.c, m.s]) for (const k of Object.keys(o)) if (Math.abs(o[k]) < 1e-12) delete o[k]; return m; };
  const kTex = (k) => { const m = /^(-?)(\d+)$/.exec(k.slice(1)); return m ? `k_{${m[1] ? '−' : ''}${m[2]}}` : k; };
  const factores = (o, fmt) => Object.entries(o).filter(([, v]) => v > 0).map(([k, v]) => fmt(k) + (Math.abs(v - 1) < 1e-12 ? '' : `^{${fr(v)}}`));
  const monoTex = (m) => {
    const num = [...factores(m.c, kTex), ...factores(m.s, (s) => `[${qn(s)}]`)], den = [...factores(inv(m).c, kTex), ...factores(inv(m).s, (s) => `[${qn(s)}]`)];
    return den.length ? `{${num.join(' ') || '1'}}/{${den.join(' ')}}` : num.join(' ') || '1';
  };
  const sumaTex = (ms) => ms.map(monoTex).join(' + ');
  const ordenes = (m) => ({ ...m.s });

  function parseLado(t) {
    const r = {};
    for (const trozo of t.split('+')) {
      const m = /^\s*(\d*[.,]?\d*)\s*([^\s].*?)\s*$/.exec(trozo);
      if (!m || !m[2]) throw new Error(`No entiendo «${trozo.trim()}»: escribe cada especie con su coeficiente opcional, separadas por +`);
      const c = m[1] ? leeNum(m[1]) : 1; if (!(c > 0)) throw new Error(`Coeficiente raro en «${trozo.trim()}»`);
      const nm = m[2].replace(/[()\s]/g, '').replace(/[₀-₉]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d)));
      r[nm] = (r[nm] || 0) + c;
    }
    return r;
  }
  function etapas(sc) {
    const lineas = String(sc.etapas || '').split(/\n|;/).map((s) => s.trim()).filter(Boolean);
    if (lineas.length < 2) throw new Error('Escribe al menos dos etapas, una por línea, con -> (irreversible) o <=> (reversible)');
    return lineas.map((l, i) => {
      const m = /^(.*?)(<=>|<->|⇌|⇄|->|→|=>)(.*)$/.exec(l);
      if (!m) throw new Error(`En la etapa ${i + 1} falta la flecha: usa -> o <=>`);
      const quita = (t) => t.replace(/\((rápida|rapida|lenta|fast|slow)\)/gi, '');
      return { texto: l, re: parseLado(quita(m[1])), pr: parseLado(quita(m[3])), rev: /<|⇌|⇄/.test(m[2]), i: i + 1 };
    });
  }
  const molec = (e) => { const n = Object.values(e.re).reduce((s, v) => s + v, 0); return n === 1 ? 'unimolecular' : n === 2 ? 'bimolecular' : n === 3 ? 'termolecular' : `de molecularidad ${n}`; };
  const lado = (o) => Object.entries(o).map(([s, c]) => `${c === 1 ? '' : fr(c) + ' '}${sub(s)}`).join(' + ');
  const ec = (e) => `${lado(e.re)} ${e.rev ? '⇌' : '→'} ${lado(e.pr)}`;
  const rateF = (e) => mono({ ['k' + e.i]: 1 }, e.re), rateR = (e) => mono({ ['k-' + e.i]: 1 }, e.pr);

  function mecanismo(sc) {
    const es = etapas(sc), pasos = [], metodo = sc.metodo === 'ee' ? 'ee' : 'lenta';
    const s = Math.round(num(sc, 'lenta', metodo === 'ee' ? 'el número de la etapa que forma el producto' : 'el número de la etapa lenta', { min: 0 }));
    if (s < 1 || s > es.length) throw new Error(`La etapa ${s} no existe: hay ${es.length}`);
    // reacción global e intermedios
    const nu = {}, primera = {};
    for (const e of es) { for (const [x, c] of Object.entries(e.re)) { nu[x] = (nu[x] || 0) - c; if (!primera[x]) primera[x] = 'r'; } for (const [x, c] of Object.entries(e.pr)) { nu[x] = (nu[x] || 0) + c; if (!primera[x]) primera[x] = 'p'; } }
    const inter = Object.keys(nu).filter((x) => Math.abs(nu[x]) < 1e-9 && primera[x] === 'p');
    const glob = { re: {}, pr: {} }; for (const [x, v] of Object.entries(nu)) { if (v < -1e-9) glob.re[x] = -v; else if (v > 1e-9) glob.pr[x] = v; }
    pasos.push({ t: 'Las etapas', html: es.map((e) => `Etapa ${e.i}: ${ec(e)} (${molec(e)}${e.i === s ? (metodo === 'ee' ? ', da el producto' : ', lenta') : ''})`).join('<br>') + '<br>En una etapa elemental los órdenes son los coeficientes de los reactivos, así que su ley de velocidad se escribe directamente.' });
    pasos.push({ t: 'Reacción global e intermedios', html: `Sumando las etapas y cancelando lo que aparece a los dos lados: <b>${lado(glob.re)} → ${lado(glob.pr)}</b>.${inter.length ? ` Se forman y se gastan los intermedios ${inter.map(sub).join(', ')}: no pueden aparecer en la ley de velocidad final.` : ' No hay intermedios que eliminar.'}` });
    if (metodo === 'ee' && inter.length !== 1) throw new Error(inter.length ? 'El estado estacionario está limitado a un único intermedio: usa el método de la etapa lenta (con equilibrios previos)' : 'Para el estado estacionario hace falta un intermedio (algo que se forma en una etapa y se gasta en otra)');
    let casos = [];
    if (metodo === 'lenta') {
      const e = es[s - 1];
      let v = rateF(e);
      pasos.push({ t: 'Velocidad de la etapa lenta', html: `La reacción va a la velocidad de su etapa más lenta: $v = k_{${s}} ${Object.entries(e.re).map(([x, c]) => `[${qn(x)}]${c === 1 ? '' : `^{${fr(c)}}`}`).join(' ')}$.` });
      let n = 0;
      while (Object.keys(v.s).some((x) => inter.includes(x)) && n++ < 8) {
        const x = Object.keys(v.s).find((y) => inter.includes(y)), ord = v.s[x];
        const previa = es.find((e2) => e2.i < s && e2.rev && e2.pr[x]);
        if (!previa) throw new Error(`No se puede quitar el intermedio ${x}: marca como reversible (<=>) la etapa rápida anterior que lo forma`);
        const K = mono({ ['k' + previa.i]: 1, ['k-' + previa.i]: -1 }, {}), Ix = mul(K, mul(mono({}, previa.re), inv(mono({}, Object.fromEntries(Object.entries(previa.pr).filter(([y]) => y !== x))))));
        const cx = previa.pr[x], Isol = pow(Ix, 1 / cx);
        const sin = mono(v.c, Object.fromEntries(Object.entries(v.s).filter(([y]) => y !== x)));
        v = mul(sin, pow(Isol, ord));
        pasos.push({ t: `Quitar el intermedio ${sub(x)}`, html: `Como la etapa ${previa.i} es un equilibrio rápido, $K_{${previa.i}} = {k_{${previa.i}}}/{k_{−${previa.i}}}$ y se despeja $[${qn(x)}] = ${monoTex(Isol)}$. Se sustituye en la ley de velocidad.` });
      }
      casos = [{ nombre: 'Ley de velocidad', v: [v], den: null }];
      pasos.push({ t: 'Ley de velocidad', html: `$v = ${monoTex(v)}$, que se escribe $v = k_"obs" ${Object.entries(v.s).map(([x, o]) => `[${qn(x)}]${o === 1 ? '' : `^{${fr(o)}}`}`).join(' ')}$ con $k_"obs" = ${monoTex(mono(v.c, {}))}$.` });
    } else {
      const I = inter[0];
      // las que se forman (sin I) suman; las que lo gastan (con I) van al denominador
      const prod = []; for (const e of es) { const vi = (e.pr[I] || 0) - (e.re[I] || 0); if (vi > 0) prod.push(rateF(e)); else if (vi < 0 && e.rev) prod.push(rateR(e)); }
      const cons = []; for (const e of es) { const vi = (e.pr[I] || 0) - (e.re[I] || 0); if (vi > 0 && e.rev) cons.push(rateR(e)); else if (vi < 0) cons.push(rateF(e)); }
      const numI = prod.filter((m) => !m.s[I]), den = cons.filter((m) => m.s[I]).map((m) => mono(m.c, Object.fromEntries(Object.entries(m.s).filter(([y]) => y !== I))));
      if (!numI.length || !den.length) throw new Error(`El intermedio ${I} tiene que formarse en una etapa y gastarse en otra (cada una con su flecha)`);
      pasos.push({ t: 'Estado estacionario', html: `El intermedio ${sub(I)} se gasta tan deprisa como se forma, así que $d[${qn(I)}]/dt = 0$: lo que se forma, $${sumaTex(numI)}$, iguala lo que se gasta, $[${qn(I)}] (${sumaTex(den)})$. De ahí $[${qn(I)}] = {${sumaTex(numI)}}/{${sumaTex(den)}}$.` });
      const e = es[s - 1];
      if (!e.re[I]) throw new Error(`La etapa ${s} (la que forma el producto) tiene que gastar el intermedio ${I}`);
      const Fs = mono(rateF(e).c, Object.fromEntries(Object.entries(rateF(e).s).filter(([y]) => y !== I)));
      const N = numI.map((m) => mul(Fs, m));
      pasos.push({ t: 'Ley de velocidad completa', html: `La velocidad es la de la etapa ${s}, $v = k_{${s}} [${qn(I)}] ⋯$, y al sustituir: $v = {${sumaTex(N)}}/{${sumaTex(den)}}$.` });
      casos.push({ nombre: 'Ley completa', v: N, den });
      if (den.length > 1) den.forEach((d, j) => {
        const v = N.map((m) => mul(m, inv(d)));
        casos.push({ nombre: `Si domina el término ${j + 1} del denominador`, v, dom: d });
        pasos.push({ t: `Caso límite ${j + 1}`, html: `Si <b>${j === 0 ? 'el primer' : 'el segundo'} término del denominador es mucho mayor</b> ($${monoTex(d)}$ domina), queda $v ≈ ${sumaTex(v)}$.` });
      });
    }
    // órdenes y comparación con el experimento
    const exp = {};
    if (!vacio(sc.exp)) for (const t of String(sc.exp).split(/[;,]/)) { const m = /^\s*([^=:\s]+)\s*[=:]\s*(-?[\d.,]+)\s*$/.exec(t); if (!m) throw new Error(`No entiendo el orden experimental «${t.trim()}»: escribe, por ejemplo, NO=2, O2=1`); exp[m[1]] = leeNum(m[2]); }
    const leyes = casos.filter((c) => !c.den || casos.length === 1 || c.dom).map((c) => ({ nombre: c.nombre, v: c.v, ordenes: c.v.length === 1 ? ordenes(c.v[0]) : null }));
    let cuadra = null;
    if (Object.keys(exp).length) {
      const cand = leyes.filter((l) => l.ordenes);
      cuadra = cand.map((l) => ({ nombre: l.nombre, ok: Object.keys({ ...exp, ...l.ordenes }).every((x) => Math.abs((exp[x] || 0) - (l.ordenes[x] || 0)) < 1e-6) }));
      pasos.push({ t: 'Comparación con el experimento', html: `Órdenes medidos: ${Object.entries(exp).map(([x, o]) => `$[${qn(x)}]^{${fr(o)}}$`).join(', ')}. ${cuadra.some((c) => c.ok) ? `<b>El mecanismo es compatible</b> con el experimento (${cuadra.filter((c) => c.ok).map((c) => c.nombre.toLowerCase()).join(', ')}). Ojo: que coincida no demuestra que sea el mecanismo, solo que no se descarta.` : '<b>El mecanismo no reproduce los órdenes medidos</b>: hay que cambiarlo (otra etapa lenta u otras etapas).'}` });
    }
    return { modo: 'mecanismo', metodo, etapas: es, intermedios: inter, global: glob, lenta: s, casos, leyes, exp, cuadra, ley: casos[0].v, pasos };
  }

  const ejemplos = [
    { clave: 'consec-abc', nombre: 'A → B → C con k₁ = 0,2 y k₂ = 0,1 (B máximo 0,5)', sc: { modo: 'consecutivas', tipo: 'abc', k1: '0,2', k2: '0,1', A0: '1', ut: 's' } },
    { clave: 'consec-igual', nombre: 'A → B → C con k₁ = k₂', sc: { modo: 'consecutivas', tipo: 'abc', k1: '0,05', k2: '0,05', A0: '0,8', ut: 'min' } },
    { clave: 'reversible', nombre: 'A ⇌ B con kf = 0,3 y kr = 0,1', sc: { modo: 'consecutivas', tipo: 'rev', kf: '0,3', kr: '0,1', A0: '1', B0: '', ut: 's' } },
    { clave: 'mec-no-o2', nombre: 'Mecanismo de 2 NO + O₂ → 2 NO₂ (equilibrio previo y etapa lenta)', sc: { modo: 'mecanismo', etapas: 'NO + NO <=> N2O2\nN2O2 + O2 -> 2 NO2', metodo: 'lenta', lenta: '2', exp: 'NO=2, O2=1', ut: 's' } },
    { clave: 'mec-no-o2-ee', nombre: 'El mismo mecanismo con estado estacionario', sc: { modo: 'mecanismo', etapas: 'NO + NO <=> N2O2\nN2O2 + O2 -> 2 NO2', metodo: 'ee', lenta: '2', exp: 'NO=2, O2=1', ut: 's' } },
    { clave: 'mec-ozono', nombre: 'Descomposición del ozono: 2 O₃ → 3 O₂', sc: { modo: 'mecanismo', etapas: 'O3 <=> O2 + O\nO + O3 -> 2 O2', metodo: 'lenta', lenta: '2', exp: 'O3=2, O2=-1', ut: 's' } },
  ];
  return { consecutivas, mecanismo, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Mecanismo;
