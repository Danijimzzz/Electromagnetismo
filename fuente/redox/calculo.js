/* =====================================================================
   Redox por ion-electrón (sin DOM): ajusta una reacción de oxidación-reducción
   en forma iónica, en medio ácido o básico, con el desarrollo de clase: números
   de oxidación, las dos semirreacciones (elemento, O con H₂O, H con H⁺, carga con
   e⁻), igualar los electrones, sumar, pasar a medio básico con OH⁻ y la
   comprobación átomo a átomo y de la carga. Usa Formulas (quimica/formulas.js).
   La interfaz está en redox/app.js y la prueba en pruebas/herramientas/redox.js.
     resolver(sc)  { ecuacion, medio: 'acido' | 'basico' } →
                   { html, especies, cambios, tabla, cargas, pasos, espectadores }
     ejemplos      [{ clave, nombre, sc }]
   ===================================================================== */
const Redox = (() => {
  const mcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const mcm = (a, b) => (a / mcd(a, b)) * b;
  const sinEtiquetas = (h) => String(h).replace(/<small class="estado">.*?<\/small>/g, '');
  const clave = (sp) => (sp.electron ? 'e-' : Object.keys(sp.atomos).sort().map((k) => k + sp.atomos[k]).join('') + '/' + sp.carga);

  // el agua, el protón, el hidróxido y el electrón los pone el método; rango = orden al escribir
  const mk = (t, rango) => { const sp = Formulas.leer(t); sp.k = clave(sp); sp.aux = true; sp.rango = rango; sp.html = sinEtiquetas(sp.html); return sp; };
  const AGUA = mk('H2O', 2), H = mk('H^+', 1), OH = mk('OH^-', 1), E = mk('e^-', 3);
  const AUX = { [AGUA.k]: AGUA, [H.k]: H, [OH.k]: OH, [E.k]: E };

  /* ---------- Números de oxidación ---------- */
  const FIJOS = { Li: 1, Na: 1, K: 1, Rb: 1, Cs: 1, Be: 2, Mg: 2, Ca: 2, Sr: 2, Ba: 2, Al: 3, Zn: 2, Cd: 2, Ag: 1, F: -1 };
  // elemento → número de oxidación (puede ser fraccionario: Fe₃O₄ da 8/3)
  function oxidacion(sp) {
    const el = Object.keys(sp.atomos);
    if (el.length === 1) return { [el[0]]: sp.carga / sp.atomos[el[0]] };
    const base = { ...FIJOS, H: 1, O: -2 };
    // H +1 y O −2; si no cuadra con la carga (H₂O₂, NaH) se suelta O y luego H
    const intenta = (suelta) => {
      const inc = el.filter((e) => !(e in base) || suelta.includes(e));
      const s = el.filter((e) => !inc.includes(e)).reduce((t, e) => t + base[e] * sp.atomos[e], 0);
      if (inc.length === 0) return s === sp.carga ? Object.fromEntries(el.map((e) => [e, base[e]])) : null;
      if (inc.length > 1) return null;
      return Object.fromEntries(el.map((e) => [e, e === inc[0] ? (sp.carga - s) / sp.atomos[inc[0]] : base[e]]));
    };
    const ox = intenta([]) || (el.includes('O') && intenta(['O'])) || (el.includes('H') && intenta(['H']));
    if (ox) return ox;
    throw new Error(`No sé asignar los números de oxidación de ${sinEtiquetas(sp.html)}: tiene varios elementos sin número fijo. Escribe la reacción con iones sencillos (por ejemplo MnO4^-, Fe^2+).`);
  }
  const fr = (x) => { for (let d = 1; d <= 12; d++) if (Math.abs(x * d - Math.round(x * d)) < 1e-9) { const n = Math.round(x * d); return d === 1 ? String(n) : `${n}/${d}`; } return x.toFixed(2).replace('.', ','); };
  const sg = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + fr(Math.abs(x));

  /* ---------- Lados de una ecuación: Map clave → { sp, n } ---------- */
  const suma = (L, sp, n) => { const o = L.get(sp.k); if (o) o.n += n; else L.set(sp.k, { sp, n }); };
  const copia = (L, f = 1) => { const c = new Map(); for (const { sp, n } of L.values()) suma(c, sp, n * f); return c; };
  const quita = (L, sp, n) => { const o = L.get(sp.k); if (!o) return; o.n -= n; if (o.n <= 0) L.delete(sp.k); };
  const cuenta = (L, el) => [...L.values()].reduce((t, { sp, n }) => t + n * (sp.atomos[el] || 0), 0);
  const carga = (L) => [...L.values()].reduce((t, { sp, n }) => t + n * sp.carga, 0);
  const orden = (L) => [...L.values()].sort((a, b) => (a.sp.rango || 0) - (b.sp.rango || 0) || (a.sp.idx || 0) - (b.sp.idx || 0));
  const lado = (L) => orden(L).map(({ sp, n }) => (n > 1 ? n + ' ' : '') + sp.html).join(' + ') || '0';
  const ec = (iz, de) => `<span class="ec">${lado(iz)} <span class="flecha">→</span> ${lado(de)}</span>`;
  // lo que está a los dos lados se simplifica (agua, protones, hidróxidos y electrones)
  function simplifica(iz, de) {
    for (const a of [AGUA, H, OH, E]) {
      const m = Math.min(iz.get(a.k)?.n || 0, de.get(a.k)?.n || 0);
      if (m) { quita(iz, a, m); quita(de, a, m); }
    }
  }

  /* ---------- Una semirreacción en medio ácido ---------- */
  function semirreaccion(r, p, el) {
    const nr = sinEtiquetas(r.html), np = sinEtiquetas(p.html);
    const ar = r.atomos[el], ap = p.atomos[el], m = mcm(ar, ap), a = m / ar, b = m / ap;
    const iz = new Map(), de = new Map(), lineas = [];
    suma(iz, r, a); suma(de, p, b);
    lineas.push(`<b>1. ${el}:</b> ${a === 1 && b === 1 ? 'ya está ajustado' : `${a} ${nr} → ${b} ${np} deja ${m} átomos de ${el} a cada lado`}. ${ec(iz, de)}`);
    for (const x of new Set([...Object.keys(r.atomos), ...Object.keys(p.atomos)])) {
      if (x !== el && x !== 'H' && x !== 'O' && a * (r.atomos[x] || 0) !== b * (p.atomos[x] || 0)) {
        throw new Error(`El ${x} no se conserva entre ${nr} y ${np}. Escribe la reacción en forma iónica neta, sin los iones espectadores (por ejemplo MnO4^- + Fe^2+ -> Mn^2+ + Fe^3+).`);
      }
    }
    const dO = cuenta(iz, 'O') - cuenta(de, 'O');
    if (dO) { suma(dO > 0 ? de : iz, AGUA, Math.abs(dO)); lineas.push(`<b>2. Oxígeno:</b> faltan ${Math.abs(dO)} O ${dO > 0 ? 'a la derecha' : 'a la izquierda'}; se añaden ${Math.abs(dO)} H₂O. ${ec(iz, de)}`); } else lineas.push('<b>2. Oxígeno:</b> ya está ajustado.');
    const dH = cuenta(iz, 'H') - cuenta(de, 'H');
    if (dH) { suma(dH > 0 ? de : iz, H, Math.abs(dH)); lineas.push(`<b>3. Hidrógeno:</b> faltan ${Math.abs(dH)} H ${dH > 0 ? 'a la derecha' : 'a la izquierda'}; se añaden ${Math.abs(dH)} H⁺. ${ec(iz, de)}`); } else lineas.push('<b>3. Hidrógeno:</b> ya está ajustado.');
    const qi = carga(iz), qd = carga(de), ne = Math.abs(qi - qd);
    if (!ne) throw new Error(`${nr} → ${np} no cambia de carga ni de número de oxidación: revisa la reacción.`);
    suma(qi > qd ? iz : de, E, ne);
    lineas.push(`<b>4. Carga:</b> ${qi >= 0 ? '+' : '−'}${Math.abs(qi)} a la izquierda y ${qd >= 0 ? '+' : '−'}${Math.abs(qd)} a la derecha; se añaden ${ne} e⁻ ${qi > qd ? 'a la izquierda' : 'a la derecha'}. ${ec(iz, de)}`);
    return { r, p, el, iz, de, ne, tipo: qi > qd ? 'reducción' : 'oxidación', lineas };
  }

  /* ---------- Quién se oxida y quién se reduce ---------- */
  // el elemento por el que una especie se oxida o se reduce: el que no es H ni O (MnO₄⁻ → Mn);
  // si solo tiene H y O, el O (H₂O₂, O₂, H₂O) o el H (H₂, H⁺)
  const redox = (sp) => { const o = Object.keys(sp.atomos).filter((e) => e !== 'H' && e !== 'O'); return o.length ? o : sp.atomos.O ? ['O'] : ['H']; };
  function pares(sps, nR, conAux) {
    const out = [];
    sps.forEach((r, i) => sps.forEach((p, j) => {
      if (i >= nR || j < nR || (!conAux && (r.aux || p.aux))) return;
      for (const el of redox(r)) {
        if (!redox(p).includes(el)) continue;
        const a = r.ox[el], b = p.ox[el];
        if (Math.abs(a - b) > 1e-9) out.push({ r, p, el, de: a, a: b, sube: b > a });
      }
    }));
    return out;
  }

  function resolver(sc) {
    const texto = String(sc.ecuacion ?? '').trim();
    if (!texto) throw new Error('Escribe la reacción iónica, por ejemplo MnO4^- + Fe^2+ -> Mn^2+ + Fe^3+');
    const medio = sc.medio === 'basico' ? 'basico' : 'acido';
    const { R, P } = Formulas.separar(texto);
    const sps = [...R, ...P].map((t, i) => {
      const sp = Formulas.leer(t);
      if (sp.electron) throw new Error('No escribas los electrones: el método los añade en cada semirreacción.');
      const k = clave(sp);
      if (AUX[k]) return AUX[k];
      sp.k = k; sp.idx = i; sp.html = sinEtiquetas(sp.html); sp.ox = oxidacion(sp);
      return sp;
    });
    sps.forEach((sp) => { if (sp.aux) sp.ox = oxidacion(sp); });
    const nR = R.length;

    let ps = pares(sps, nR, false);
    const bien = (q) => q.filter((x) => x.sube).length === 1 && q.filter((x) => !x.sube).length === 1;
    if (!bien(ps)) { const q = pares(sps, nR, true); if (bien(q)) ps = q; }
    const ox = ps.filter((x) => x.sube), rd = ps.filter((x) => !x.sube);
    if (!ps.length) throw new Error('Ningún elemento cambia su número de oxidación: no es una reacción redox. Revisa que escribes reactivos y productos.');
    if (!ox.length) throw new Error('Algo se reduce pero nada se oxida. Falta en los reactivos o en los productos la especie que cede los electrones.');
    if (!rd.length) throw new Error('Algo se oxida pero nada se reduce. Falta en los reactivos o en los productos la especie que gana los electrones.');
    if (!bien(ps)) throw new Error('Hay más de una oxidación o más de una reducción. Separa la reacción en partes con una sola de cada.');

    const so = semirreaccion(ox[0].r, ox[0].p, ox[0].el), sr = semirreaccion(rd[0].r, rd[0].p, rd[0].el);
    const usadas = new Set([ox[0].r, ox[0].p, rd[0].r, rd[0].p, ...sps.filter((s) => s.aux)]);
    const espectadores = sps.filter((s, i) => !usadas.has(s) && sps.findIndex((x) => x.k === s.k) === i);
    const nom = (s) => s.html;
    const nombre = (x) => `<span class="ec">${nom(x.r)}</span> → <span class="ec">${nom(x.p)}</span>`;

    const pasos = [];
    const cambia = (x) => `<b>${x.el}</b>: ${sg(x.de)} en ${nom(x.r)} → ${sg(x.a)} en ${nom(x.p)}. ${x.sube ? 'Se oxida: pierde' : 'Se reduce: gana'} ${fr(Math.abs(x.a - x.de))} e⁻ por átomo.`;
    pasos.push({ t: 'Números de oxidación: quién se oxida y quién se reduce', html: [cambia(ox[0]), cambia(rd[0]), ...(espectadores.length ? [`No cambian y se dejan fuera: ${espectadores.map(nom).join(', ')}.`] : []), `Medio ${medio === 'acido' ? 'ácido: los ajustes de H y O se hacen con H₂O y H⁺' : 'básico: se ajusta como en medio ácido y al final se pasa a básico con OH⁻'}.`].join('<br>') });
    pasos.push({ t: `Semirreacción de oxidación: ${nombre(ox[0])}`, html: so.lineas.join('<br>') + `<br>La oxidación cede ${so.ne} e⁻.` });
    pasos.push({ t: `Semirreacción de reducción: ${nombre(rd[0])}`, html: sr.lineas.join('<br>') + `<br>La reducción gana ${sr.ne} e⁻.` });

    const L = mcm(so.ne, sr.ne), fo = L / so.ne, fr_ = L / sr.ne;
    const io = copia(so.iz, fo), dO = copia(so.de, fo), ir = copia(sr.iz, fr_), dR = copia(sr.de, fr_);
    pasos.push({ t: 'Igualar los electrones', html: `Los electrones cedidos tienen que ser los ganados: mcm(${so.ne}, ${sr.ne}) = ${L}. Se multiplica la oxidación por ${fo} y la reducción por ${fr_}:<br>${ec(io, dO)}<br>${ec(ir, dR)}` });

    const iz = copia(io), de = copia(dO);
    for (const { sp, n } of ir.values()) suma(iz, sp, n);
    for (const { sp, n } of dR.values()) suma(de, sp, n);
    const bruta = ec(iz, de);
    simplifica(iz, de);
    let g = [...iz.values(), ...de.values()].reduce((t, { n }) => mcd(t, n), 0);
    if (g > 1) { for (const l of [iz, de]) for (const o of l.values()) o.n /= g; }
    pasos.push({ t: 'Sumar y simplificar', html: `Se suman las dos semirreacciones: ${bruta}<br>Los ${L} e⁻ se cancelan y el H₂O y el H⁺ que están a los dos lados se simplifican${g > 1 ? `; además se divide todo entre ${g}` : ''}:<br>${ec(iz, de)}` });

    if (medio === 'basico') {
      const h = (iz.get(H.k)?.n || 0) || (de.get(H.k)?.n || 0);
      if (h) {
        const enIz = !!iz.get(H.k), S = enIz ? iz : de, O = enIz ? de : iz;
        quita(S, H, h); suma(S, AGUA, h); suma(O, OH, h);
        const antes = ec(iz, de);
        simplifica(iz, de);
        g = [...iz.values(), ...de.values()].reduce((t, { n }) => mcd(t, n), 0);
        if (g > 1) { for (const l of [iz, de]) for (const o of l.values()) o.n /= g; }
        pasos.push({ t: 'Pasar a medio básico', html: `Se añaden ${h} OH⁻ a los dos lados. A ${enIz ? 'la izquierda' : 'la derecha'} los ${h} H⁺ y los ${h} OH⁻ forman ${h} H₂O (H⁺ + OH⁻ → H₂O) y al otro lado quedan los ${h} OH⁻:<br>${antes}<br>Se simplifica el agua que sale a los dos lados:<br>${ec(iz, de)}` });
      } else pasos.push({ t: 'Pasar a medio básico', html: 'No ha quedado ningún H⁺ en la reacción, así que ya está en medio básico.' });
    }

    // comprobación: átomos de cada elemento y carga
    const els = [...new Set([...iz.values(), ...de.values()].flatMap(({ sp }) => Object.keys(sp.atomos)))];
    const tabla = els.map((el) => ({ el, iz: cuenta(iz, el), de: cuenta(de, el) }));
    const cargas = { iz: carga(iz), de: carga(de) };
    if (tabla.some((f) => f.iz !== f.de) || cargas.iz !== cargas.de) throw new Error('No he conseguido ajustar esta reacción: revisa las fórmulas y las cargas.');
    const q = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x);
    const html = `<span class="ec">${lado(iz)} <span class="flecha">→</span> ${lado(de)}</span>`;
    pasos.push({ t: 'Reacción ajustada', html });
    pasos.push({ t: 'Comprobación', html: tabla.map((f) => `${f.el}: ${f.iz} = ${f.de}`).join(' · ') + ` · carga: ${q(cargas.iz)} = ${q(cargas.de)}` });

    const especies = [...orden(iz).map((o) => ({ ...o, reactivo: true })), ...orden(de).map((o) => ({ ...o, reactivo: false }))]
      .map(({ sp, n, reactivo }) => ({ html: sp.html, coef: n, reactivo, k: sp.k, atomos: sp.atomos, carga: sp.carga }));
    const cambios = [ox[0], rd[0]].map((x) => ({ el: x.el, de: x.de, a: x.a, sube: x.sube, ne: x.sube ? so.ne : sr.ne }));
    return { medio, html, especies, cambios, tabla, cargas, pasos, espectadores: espectadores.map(nom), electrones: L };
  }

  const ejemplos = [
    { clave: 'permanganato-hierro', nombre: 'Permanganato y hierro(II) (ácido)', sc: { ecuacion: 'MnO4^- + Fe^2+ -> Mn^2+ + Fe^3+', medio: 'acido' } },
    { clave: 'dicromato-hierro', nombre: 'Dicromato y hierro(II) (ácido)', sc: { ecuacion: 'Cr2O7^2- + Fe^2+ -> Cr^3+ + Fe^3+', medio: 'acido' } },
    { clave: 'permanganato-cloruro', nombre: 'Permanganato y cloruro: cloro gas (ácido)', sc: { ecuacion: 'MnO4^- + Cl^- -> Mn^2+ + Cl2', medio: 'acido' } },
    { clave: 'cobre-nitrico', nombre: 'Cobre y ácido nítrico (ácido)', sc: { ecuacion: 'Cu + NO3^- -> Cu^2+ + NO', medio: 'acido' } },
    { clave: 'permanganato-oxalato', nombre: 'Permanganato y oxalato (ácido)', sc: { ecuacion: 'MnO4^- + C2O4^2- -> Mn^2+ + CO2', medio: 'acido' } },
    { clave: 'permanganato-agua-oxigenada', nombre: 'Permanganato y agua oxigenada (ácido)', sc: { ecuacion: 'MnO4^- + H2O2 -> Mn^2+ + O2', medio: 'acido' } },
    { clave: 'permanganato-yoduro', nombre: 'Permanganato y yoduro (básico)', sc: { ecuacion: 'MnO4^- + I^- -> MnO2 + I2', medio: 'basico' } },
    { clave: 'cromo-clorato', nombre: 'Hidróxido de cromo(III) y clorato (básico)', sc: { ecuacion: 'Cr(OH)3 + ClO3^- -> CrO4^2- + Cl^-', medio: 'basico' } },
    { clave: 'cloro-dismutacion', nombre: 'Dismutación del cloro: lejía (básico)', sc: { ecuacion: 'Cl2 -> Cl^- + ClO^-', medio: 'basico' } },
    { clave: 'dioxido-cloro', nombre: 'Dióxido de cloro y agua oxigenada (básico)', sc: { ecuacion: 'ClO2 + H2O2 -> ClO2^- + O2', medio: 'basico' } },
  ];

  return { resolver, ejemplos, oxidacion };
})();
if (typeof module !== 'undefined') module.exports = Redox;
