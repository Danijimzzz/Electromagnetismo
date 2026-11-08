/* =====================================================================
   Electroquímica (sin DOM), pestañas «Pilas» y «Electrolisis» de Redox (RE-1, RE-2).
   Pilas: con dos semirreacciones de la tabla de potenciales estándar (quimica/datos.js) calcula
     E° de la pila = E°(cátodo) − E°(ánodo), la reacción global (electrones igualados), la notación de
     pila, ΔG° = −nFE°, la constante de equilibrio K = e^{nFE°/RT} y, con las concentraciones y presiones,
     la ecuación de Nernst E = E° − (RT/nF)·ln Q.
   Electrolisis: leyes de Faraday, m = M·I·t / (n·F) (masa depositada, tiempo o intensidad), volumen de
     gas desprendido y, en una mezcla de iones, el orden de descarga en cada electrodo por potenciales.
   Usa Datos (quimica/datos.js) y Formulas (quimica/formulas.js).
     resolver(sc)  { modo: 'pila' | 'electrolisis' | 'orden', … } → resultado con `pasos`; lanza Error para el usuario
     ejemplos      [{ clave, nombre, sc }]
   La interfaz está en redox/app.js y la prueba en pruebas/herramientas/redox.js.
   ===================================================================== */
const Electro = (() => {
  const D = typeof Datos !== 'undefined' ? Datos : require('../quimica/datos.js');
  const F0 = typeof Formulas !== 'undefined' ? Formulas : require('../quimica/formulas.js');
  const R = D.R, T0 = D.T0;
  // constantes «de clase»: lo pide el estado (sc.constantes) o, si no, el ajuste común de Química (por defecto, exactas)
  const Aj = typeof Ajuste !== 'undefined' ? Ajuste : require('../quimica/ajuste.js');
  const esClase = (sc) => (sc.constantes === undefined ? Aj.leer({ constantes: false }).constantes : sc.constantes === 'clase');
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const a = Math.abs(x), s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const mcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const mcm = (a, b) => (a / mcd(a, b)) * b;
  const num = (sc, k, nom, { min = -Infinity, minEx = false, def } = {}) => {
    if (vacio(sc[k])) { if (def !== undefined) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (minEx ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${minEx ? 'mayor' : 'mayor o igual'} que ${min}`);
    return v;
  };
  const semi = (id) => { const s = D.POTENCIALES.find((x) => x.id === id); if (!s) throw new Error('Elige una semirreacción de la tabla'); return s; };
  const clave = (sp) => `${sp[1]}|${sp[2]}`;
  const html = (sp) => { try { return F0.leer(sp[1] + (sp[2] === 'aq' ? '' : `(${sp[2]})`)).html; } catch (e) { return sp[1]; } };
  const htmlLado = (L) => L.map(([c, sp]) => (c === 1 ? '' : c + ' ') + html(sp)).join(' + ');
  const plano = (h) => String(h).replace(/<small class="estado">.*?<\/small>/g, '').replace(/<[^>]+>/g, '');
  // la semirreacción de reducción como texto: «MnO4⁻ + 8 H⁺ + 5 e⁻ → Mn²⁺ + 4 H₂O»
  const eqSemi = (s, inv = false) => {
    const e = `<span class="ec">`, ox = s.ox.map((sp) => [sp[0], sp]), red = s.red.map((sp) => [sp[0], sp]);
    const el = [s.n === 1 ? '' : s.n + ' ', 'e<sup>−</sup>'].join('');
    return inv ? `${e}${htmlLado(red)} <span class="flecha">→</span> ${htmlLado(ox)} + ${el}</span>` : `${e}${htmlLado(ox)} + ${el} <span class="flecha">→</span> ${htmlLado(red)}</span>`;
  };
  // texto sin etiquetas con exponentes y subíndices en Unicode, para <select> y rótulos del lienzo
  const bonito = (h) => String(h).replace(/<small class="estado">.*?<\/small>/g, '').replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\+/g, '⁺').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<sub>(.*?)<\/sub>/g, (_, e) => e.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])).replace(/<[^>]+>/g, '');
  const etiqueta = (s) => `${bonito(htmlLado(s.ox.map((sp) => [sp[0], sp])))} + ${s.n === 1 ? '' : s.n + ' '}e⁻ → ${bonito(htmlLado(s.red.map((sp) => [sp[0], sp])))}`;
  const nombreSemi = (s) => plano(htmlLado(s.ox.map((sp) => [sp[0], sp]))).replace(/\s+/g, ' ') + ' / ' + plano(htmlLado(s.red.map((sp) => [sp[0], sp]))).replace(/\s+/g, ' ');

  // electrodo en notación de pila: sólidos | gases | disolución; con electrodo inerte (Pt) si no hay un sólido conductor
  function electrodo(s, conc) {
    const todos = [...s.ox, ...s.red];
    const g = (fase) => todos.filter((sp) => sp[2] === fase && !(sp[1] === 'H2O' && fase === 'l'));
    const fmt = (sp) => {
      const c = conc[clave(sp)];
      const tx = html(sp).replace(/<small class="estado">\(aq\)<\/small>/, '');
      return sp[2] === 'aq' ? `${tx}${vacio(c) ? '' : `(${String(c).replace('.', ',')} M)`}` : sp[2] === 'g' ? `${tx}${vacio(c) ? '' : `(${String(c).replace('.', ',')} bar)`}` : tx;
    };
    const sol = g('s'), gas = g('g'), aq = g('aq'), liq = g('l');
    const partes = [];
    const conductor = sol.length || liq.length;
    if (!conductor) partes.push('Pt(s)');
    if (sol.length) partes.push(sol.map(fmt).join(', '));
    if (liq.length) partes.push(liq.map(fmt).join(', '));
    if (gas.length) partes.push(gas.map(fmt).join(', '));
    if (aq.length) partes.push(aq.map(fmt).join(', '));
    return partes.join(' | ');
  }

  /* ---------- Pilas ---------- */
  function pila(sc) {
    let cat = semi(sc.catodo), an = semi(sc.anodo);
    if (cat.id === an.id) throw new Error('Elige dos semirreacciones distintas para el cátodo y el ánodo');
    const conc = sc.conc && typeof sc.conc === 'object' ? sc.conc : {};
    const T = num(sc, 'T', 'la temperatura', { min: 0, minEx: true, def: T0 }), clase = esClase(sc), F = clase ? D.FCLASE : D.F;
    const E0 = cat.E - an.E, nL = mcm(cat.n, an.n), fc = nL / cat.n, fa = nL / an.n, pasos = [];
    pasos.push({ t: 'Potenciales estándar', html: `Del cátodo (reducción): ${eqSemi(cat)} &nbsp; $E^"°"_"cátodo" = ${f(cat.E, 3)} "V"$<br>Del ánodo (se escribe como reducción en la tabla): ${eqSemi(an)} &nbsp; $E^"°"_"ánodo" = ${f(an.E, 3)} "V"$` });
    pasos.push({ t: 'Quién se reduce y quién se oxida', html: `En el <b>cátodo</b> (+) ocurre la reducción y en el <b>ánodo</b> (−) la oxidación. Se oxida la semirreacción que tiene el potencial de reducción menor: se escribe al revés.<br>Ánodo (oxidación): ${eqSemi(an, true)}` });
    pasos.push({ t: 'Potencial de la pila', html: `$E^"°"_"pila" = E^"°"_"cátodo" − E^"°"_"ánodo" = ${f(cat.E, 3)} − (${f(an.E, 3)})$ = <b>${f(E0, 3)} V</b>. ${E0 > 0 ? 'Es positivo: la reacción es <b>espontánea</b> y la pila funciona.' : E0 < 0 ? 'Es negativo: <b>no es espontánea</b> como la has montado. La pila funcionaría al revés: el cátodo y el ánodo se intercambian.' : 'Es cero: está en equilibrio.'}` });
    // electrones igualados y reacción global
    const L = [], Dd = [];
    const suma = (M, lista, k) => { for (const sp of lista) { const kk = clave(sp); M.set(kk, { sp, n: (M.get(kk)?.n || 0) + sp[0] * k }); } };
    const izq = new Map(), der = new Map();
    suma(izq, cat.ox, fc); suma(der, cat.red, fc); suma(izq, an.red, fa); suma(der, an.ox, fa);
    for (const [k, o] of izq) if (der.has(k)) { const m = Math.min(o.n, der.get(k).n); o.n -= m; der.get(k).n -= m; }
    const lista = (M) => [...M.values()].filter((o) => o.n > 0);
    const gi = lista(izq), gd = lista(der);
    const g = [...gi, ...gd].reduce((a, o) => mcd(a, o.n), 0) || 1, nGlob = nL / g;
    const lt = (A) => A.map((o) => [o.n / g, [o.n / g, o.sp[1], o.sp[2]]]);
    const globalHtml = `<span class="ec">${htmlLado(lt(gi))} <span class="flecha">→</span> ${htmlLado(lt(gd))}</span>`;
    pasos.push({ t: 'Igualar los electrones', html: `El cátodo capta ${cat.n} e⁻ y el ánodo cede ${an.n}: se multiplican por ${fc} y ${fa} para que se intercambien ${nL} e⁻. Al sumar, los electrones y las especies que aparecen a los dos lados se cancelan:<br>${globalHtml} &nbsp; (n = ${nGlob} e⁻ por reacción)` });
    pasos.push({ t: 'Notación de pila', html: `${electrodo(an, conc)} <b>‖</b> ${electrodo(cat, conc)}<br>El ánodo (−) va a la izquierda, la doble barra es el puente salino y el cátodo (+) a la derecha; una barra separa cada fase.` });
    const dG0 = -nGlob * F * E0 / 1000, lnK = nGlob * F * E0 / (R * T), logK = lnK / Math.LN10;
    pasos.push({ t: 'Energía libre estándar', html: `$ΔG^"°" = −n F E^"°"_"pila" = −${nGlob} · ${f(F, 6)} · ${f(E0, 3)} / 1000 = ${f(dG0)} "kJ"$ por cada reacción ajustada. ${dG0 < 0 ? 'ΔG° < 0: espontánea.' : 'ΔG° > 0: no espontánea.'}` });
    pasos.push({ t: 'Constante de equilibrio', html: `En el equilibrio $E = 0$ y $Q = K$: $ln K = {n F E^"°"}/{R T} = {${nGlob} · ${f(F, 6)} · ${f(E0, 3)}}/{${f(R, 5)} · ${f(T)}} = ${f(lnK)}$ ⇒ $log K = ${f(logK)}$ ⇒ <b>K = ${f(10 ** logK)}</b>.` });
    // Nernst: Q con las actividades (aq → mol/L, g → bar, s y l → 1)
    const especiesNernst = [], act = (o) => {
      if (o.sp[2] === 'aq') { const c = conc[clave(o.sp)]; return vacio(c) ? 1 : leeNum(c); }
      if (o.sp[2] === 'g') { const c = conc[clave(o.sp)]; return vacio(c) ? 1 : leeNum(c); }
      return null;
    };
    let lnQ = 0;
    for (const [lado, A, signo] of [['der', gd, 1], ['izq', gi, -1]]) for (const o of A) {
      const a = act(o); if (a === null) continue;
      if (!(a > 0) || !isFinite(a)) throw new Error(`La ${o.sp[2] === 'g' ? 'presión' : 'concentración'} de ${plano(html(o.sp))} debe ser un número mayor que 0`);
      lnQ += signo * (o.n / g) * Math.log(a);
    }
    for (const o of [...gi, ...gd]) if (o.sp[2] === 'aq' || o.sp[2] === 'g') especiesNernst.push({ k: clave(o.sp), nombre: plano(html(o.sp)), html: html(o.sp), fase: o.sp[2], valor: conc[clave(o.sp)] ?? '' });
    const Q = Math.exp(lnQ), E = E0 - (R * T / (nGlob * F)) * lnQ;
    const hay = especiesNernst.some((e) => !vacio(e.valor));
    pasos.push({ t: 'Ecuación de Nernst', html: `$E = E^"°" − {R T}/{n F} ln Q = E^"°" − {0{,}0592}/{n} log Q$ (a 25 °C). El cociente $Q$ usa las concentraciones (mol/L) de los iones y las presiones (bar) de los gases; los sólidos y el agua no entran.<br>${hay || true ? `$Q = ${f(Q)}$ ⇒ $E = ${f(E0, 3)} − {${f(R, 5)} · ${f(T)}}/{${nGlob} · ${f(F, 6)}} · ln ${f(Q)} = ${f(E, 4)} "V"$.` : ''} ${hay ? '' : 'Con todas las concentraciones 1 M y las presiones 1 bar, Q = 1 y E = E°.'}` });
    if (E > 0 !== E0 > 0 && hay) pasos.push({ t: 'La concentración cambia el sentido', html: `Con estas concentraciones el signo de E es distinto del de E°: la reacción espontánea es la contraria. Con $Q = K$ la pila se agota ($E = 0$).` });
    const curva = []; // E frente a log Q, de −4 a +4 alrededor de Q=1
    for (let x = -6; x <= 6.0001; x += 0.5) curva.push([x, E0 - (R * T / (nGlob * F)) * x * Math.LN10]);
    return { modo: 'pila', cat, an, E0, E, n: nGlob, dG0, K: 10 ** logK, logK, Q, lnQ, T, F, globalHtml, notacion: `${plano(electrodo(an, conc))} ‖ ${plano(electrodo(cat, conc))}`, notacionHtml: `${electrodo(an, conc)} ‖ ${electrodo(cat, conc)}`,
      espontanea: E0 > 0, especies: especiesNernst, curva, catHtml: eqSemi(cat), anHtml: eqSemi(an, true), pasos };
  }

  /* ---------- Electrolisis: leyes de Faraday ---------- */
  const UT = { s: 1, min: 60, h: 3600 };
  function electrolisis(sc) {
    const s = semi(sc.semi), oxida = sc.sentido === 'oxidacion', F = esClase(sc) ? D.FCLASE : D.F;
    const prod = (oxida ? s.ox : s.red).concat().find((sp) => (sp[2] === 's' || sp[2] === 'g' || (sp[2] === 'l' && sp[1] !== 'H2O')) && sp[1] !== 'H2O') || (oxida ? s.ox : s.red).find((sp) => sp[1] !== 'H2O' && sp[1] !== 'H+' && sp[1] !== 'OH-');
    const reag = (oxida ? s.red : s.ox).find((sp) => sp[1] !== 'H2O' && sp[1] !== 'H+' && sp[1] !== 'OH-');
    if (!prod) throw new Error('Esa semirreacción no tiene un producto que se deposite o se desprenda: elige otra');
    if (prod[2] === 'aq') throw new Error(`En esta semirreacción el producto (${plano(html(prod))}) queda disuelto: elige una que deposite un sólido o desprenda un gas`);
    const base = prod[1].replace(/\^.*$/, ''), formula = base;
    let M; try { M = F0.masaMolar(formula).M; } catch (e) { throw new Error(`No sé la masa molar de «${formula}»`); }
    const n = s.n / prod[0], esGas = prod[2] === 'g'; // electrones por mol de producto
    const eta = num(sc, 'eta', 'el rendimiento de corriente', { min: 0, minEx: true, def: 100 }) / 100;
    if (eta > 1) throw new Error('El rendimiento de corriente no puede pasar de 100 %');
    const que = sc.calcula === 'tiempo' ? 'tiempo' : sc.calcula === 'intensidad' ? 'intensidad' : 'masa';
    const pasos = [];
    const lado = oxida ? 'ánodo (oxidación)' : 'cátodo (reducción)';
    pasos.push({ t: `Semirreacción en el ${lado}`, html: `${eqSemi(s, oxida)}<br>Por cada mol de ${plano(html(prod))} se intercambian $n = ${f(n, 4)}$ mol de e⁻. Masa molar: $M = ${f(M, 5)}$ g/mol.` });
    pasos.push({ t: 'Ley de Faraday', html: `La carga que pasa es $Q = I t$ y cada mol de electrones transporta $F = ${f(F, 6)}$ C. Así que $m = {M · I · t}/{n F}$${eta < 1 ? ` (con un rendimiento de corriente del ${f(eta * 100)} %)` : ''}.` });
    let I = null, t = null, m = null;
    if (que === 'masa') {
      I = num(sc, 'I', 'la intensidad', { min: 0, minEx: true }); t = num(sc, 't', 'el tiempo', { min: 0, minEx: true }) * (UT[sc.ut] || 1);
      const Qc = I * t, ne = Qc * eta / F, mol = ne / n; m = mol * M;
      pasos.push({ t: 'Carga y electrones', html: `$Q = I t = ${f(I)} · ${f(t)} = ${f(Qc)} "C"$ ⇒ $n_{e^{−}} = {Q}/{F}${eta < 1 ? ' η' : ''} = ${f(ne)}$ mol de e⁻.` });
      pasos.push({ t: 'Cantidad de sustancia y masa', html: `$n = n_{e^{−}}/${f(n, 4)} = ${f(mol)}$ mol ⇒ <b>$m = n M = ${f(m)} "g"$</b>.` });
    } else {
      m = num(sc, 'm', 'la masa', { min: 0, minEx: true });
      const mol = m / M, ne = mol * n, Qc = ne * F / eta;
      pasos.push({ t: 'Electrones necesarios', html: `$n = m/M = ${f(m)}/${f(M, 5)} = ${f(mol)}$ mol ⇒ $n_{e^{−}} = ${f(n, 4)} · ${f(mol)} = ${f(ne)}$ mol ⇒ $Q = n_{e^{−}} F${eta < 1 ? '/η' : ''} = ${f(Qc)} "C"$.` });
      if (que === 'tiempo') { I = num(sc, 'I', 'la intensidad', { min: 0, minEx: true }); t = Qc / I; pasos.push({ t: 'Tiempo', html: `$t = Q/I = ${f(Qc)}/${f(I)}$ = <b>${f(t)} s</b> (${f(t / 60)} min = ${f(t / 3600)} h).` }); }
      else { t = num(sc, 't', 'el tiempo', { min: 0, minEx: true }) * (UT[sc.ut] || 1); I = Qc / t; pasos.push({ t: 'Intensidad', html: `$I = Q/t = ${f(Qc)}/${f(t)}$ = <b>${f(I)} A</b>.` }); }
    }
    const mol = m / M, r = { modo: 'electrolisis', semi: s, oxida, prod: plano(html(prod)), formula, M, n, I, t, m, mol, ne: mol * n, Q: mol * n * F / eta, esGas, calcula: que, eta, F, pasos };
    if (esGas) {
      const T = num(sc, 'T', 'la temperatura', { min: 0, minEx: true, def: T0 }), P = num(sc, 'P', 'la presión', { min: 0, minEx: true, def: 1 }), Rg = esClase(sc) ? D.RCLASE : D.RATM;
      const V = mol * Rg * T / P; r.V = V; r.T = T; r.P = P;
      pasos.push({ t: 'Volumen del gas', html: `Gas ideal: $V = {n R T}/{P} = {${f(mol)} · ${f(Rg, 6)} · ${f(T)}}/{${f(P)}} = ${f(V)} "L"$ a ${f(T)} K y ${f(P)} atm.` });
    }
    return r;
  }

  /* ---------- Orden de descarga en una mezcla ---------- */
  function orden(sc) {
    const ids = Array.isArray(sc.mezcla) ? sc.mezcla : [];
    if (ids.length < 2) throw new Error('Marca al menos dos semirreacciones para ver cuál se descarga antes');
    const L = ids.map(semi), pasos = [];
    const cat = [...L].sort((a, b) => b.E - a.E), an = [...L].sort((a, b) => a.E - b.E);
    pasos.push({ t: 'Criterio', html: `En el <b>cátodo</b> se reduce primero la especie con el potencial de reducción <b>más alto</b> (la que capta electrones con más facilidad). En el <b>ánodo</b> se oxida primero la forma reducida con el potencial <b>más bajo</b> (la que cede electrones con más facilidad).` });
    pasos.push({ t: 'Orden de reducción en el cátodo', html: cat.map((s, i) => `${i + 1}.º ${eqSemi(s)} &nbsp; $E^"°" = ${f(s.E, 3)} "V"$`).join('<br>') });
    pasos.push({ t: 'Orden de oxidación en el ánodo', html: an.map((s, i) => `${i + 1}.º ${eqSemi(s, true)} &nbsp; $E^"°" = ${f(s.E, 3)} "V"$`).join('<br>') });
    pasos.push({ t: 'Mínima tensión', html: `Para electrolizar la primera pareja hace falta aplicar más que $E_"mín" = E^"°"_"ánodo" − E^"°"_"cátodo" = ${f(an[0].E, 3)} − ${f(cat[0].E, 3)} = ${f(an[0].E - cat[0].E, 3)} "V"$ (en valor absoluto ${f(Math.abs(an[0].E - cat[0].E), 3)} V), sin contar las sobretensiones.` });
    if (ids.some((i) => i === 'H2O' || i === 'H2O-pH7')) pasos.push({ t: 'Aviso: el agua', html: 'El agua también puede reducirse y oxidarse: los metales con potencial menor que −0,41 V (a pH 7) no se depositan en disolución acuosa, se desprende hidrógeno.' });
    return { modo: 'orden', cat, an, minimo: an[0].E - cat[0].E, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'electrolisis') return electrolisis(sc);
    if (sc.modo === 'orden') return orden(sc);
    return pila(sc);
  }

  const ejemplos = [
    { clave: 'daniell', nombre: 'Pila Daniell: Zn y Cu', sc: { modo: 'pila', catodo: 'Cu2+', anodo: 'Zn2+', conc: {}, T: '298,15' } },
    { clave: 'daniell-nernst', nombre: 'Pila Daniell con [Cu²⁺] = 0,01 M (Nernst)', sc: { modo: 'pila', catodo: 'Cu2+', anodo: 'Zn2+', conc: { 'Cu^2+|aq': '0.01', 'Zn^2+|aq': '1' }, T: '298,15' } },
    { clave: 'plata-cobre', nombre: 'Pila de Ag⁺ y Cu', sc: { modo: 'pila', catodo: 'Ag+', anodo: 'Cu2+', conc: {}, T: '298,15' } },
    { clave: 'permanganato-hierro', nombre: 'Permanganato y hierro(II) (redox con H⁺)', sc: { modo: 'pila', catodo: 'MnO4-ac', anodo: 'Fe3+', conc: {}, T: '298,15' } },
    { clave: 'no-espontanea', nombre: 'Cu²⁺ con Zn en el cátodo: no espontánea', sc: { modo: 'pila', catodo: 'Zn2+', anodo: 'Cu2+', conc: {}, T: '298,15' } },
    { clave: 'electro-cobre', nombre: 'Electrolisis: masa de cobre con 2 A durante 1 h', sc: { modo: 'electrolisis', semi: 'Cu2+', sentido: 'reduccion', calcula: 'masa', I: '2', t: '1', ut: 'h', eta: '100', T: '298,15', P: '1' } },
    { clave: 'electro-tiempo', nombre: 'Electrolisis: tiempo para depositar 5 g de plata con 3 A', sc: { modo: 'electrolisis', semi: 'Ag+', sentido: 'reduccion', calcula: 'tiempo', I: '3', m: '5', t: '', ut: 's', eta: '100', T: '298,15', P: '1' } },
    { clave: 'electro-cloro', nombre: 'Electrolisis: litros de Cl₂ con 10 A durante 30 min', sc: { modo: 'electrolisis', semi: 'Cl2', sentido: 'oxidacion', calcula: 'masa', I: '10', t: '30', ut: 'min', eta: '100', T: '298,15', P: '1' } },
    { clave: 'orden-descarga', nombre: 'Mezcla de Ag⁺, Cu²⁺ y Zn²⁺: qué se deposita primero', sc: { modo: 'orden', mezcla: ['Ag+', 'Cu2+', 'Zn2+', 'H2O-pH7'] } },
  ];

  return { resolver, ejemplos, f, bonito, etiqueta, nombreSemi, POTENCIALES: D.POTENCIALES, semi, pila, electrolisis, orden };
})();
if (typeof module !== 'undefined') module.exports = Electro;
