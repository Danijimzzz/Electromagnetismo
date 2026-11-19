const Equilibrio = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  const Aj = typeof Ajuste !== 'undefined' ? Ajuste : require('../quimica/ajuste.js');
  let R_ATM = 0.082, R_J = 8.314, R_BAR = 0.083145;
  const ajusta = () => { const v = Aj.valores(); R_ATM = v.Ratm; R_J = v.R; R_BAR = v.Rbar; };
  const L = ['A', 'B', 'C', 'D'];
  const FASES = [['g', 'gas (g)'], ['aq', 'disuelta (aq)'], ['s', 'fest (s)'], ['l', 'flüssig (l)']];
  const fase = (sc, i) => { const v = sc['f' + L[i]]; return FASES.some(([k]) => k === v) ? v : 'g'; };
  const puro = (sc, i) => fase(sc, i) === 's' || fase(sc, i) === 'l';

  function num(sc, k, nom, { min = -Infinity, estricto = false, opcional = false, def = null } = {}) {
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (estricto ? v <= min : v < min) throw new Error(`${may(nom)} muss ${estricto ? 'größer als' : 'größer oder gleich'} ${min} sein`);
    return v;
  }

  const nom = (sc, i) => (vacio(sc['n' + L[i]]) ? L[i] : String(sc['n' + L[i]]).trim());
  const nh = (s) => String(s).replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>').replace(/([+-]+)$/, (m) => `<sup>${m.replace('-', '−')}</sup>`);
  const qn = (s) => String(s).replace(/([^\d]+)(\d+)?/g, (_, t, d) => `"${t}"${d ? `_{${d}}` : ''}`);
  const num2 = (v) => String(v).replace('.', ',');

  function lee(sc) {
    const a = num(sc, 'a', 'der Koeffizient von A', { min: 0, estricto: true }), c = num(sc, 'c', 'der Koeffizient von C', { min: 0, estricto: true });
    const b = num(sc, 'b', 'der Koeffizient von B', { min: 0, opcional: true, def: 0 }), d = num(sc, 'd', 'der Koeffizient von D', { min: 0, opcional: true, def: 0 });
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

  function cociente(c, nu) {
    let cero = false, inf = false, s = 0;
    for (const i of presentes(nu)) { if (c[i] <= 0) { if (nu[i] > 0) cero = true; else inf = true; } else s += nu[i] * Math.log(c[i]); }
    if (cero && inf) throw new Error('Es fehlen gleichzeitig ein Edukt und ein Produkt: Q ist nicht definiert. Gib auf jeder Seite oder nur auf einer eine Konzentration an');
    return cero ? 0 : inf ? Infinity : Math.exp(s);
  }
  const sentido = (Q, K) => (Q === K || Math.abs(Math.log(Q / K)) < 1e-9 ? 'eq' : Q < K ? 'der' : 'izq');
  const TXT_SENT = { eq: 'befindet sich bereits im Gleichgewicht', der: 'läuft nach rechts (Produkte bilden sich)', izq: 'läuft nach links zurück (Edukte bilden sich)' };

  function limites(c0, nu, libre = []) {
    let lo = -Infinity, hi = Infinity;
    for (const i of presentes(nu)) { if (libre[i]) continue; if (nu[i] > 0) lo = Math.max(lo, -c0[i] / nu[i]); else hi = Math.min(hi, c0[i] / -nu[i]); }
    return { lo, hi };
  }
  function avance(c0, nu, K, act = nu, libre = []) {
    const { lo, hi } = limites(c0, nu, libre);
    if (!(hi - lo > 1e-15)) throw new Error('Mit diesen Konzentrationen kann die Reaktion in keine Richtung ablaufen: Gib etwas Edukt oder Produkt an');
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

  function leeConc(sc, nu, ropa) {
    return [0, 1, 2, 3].map((i) => (nu[i] ? num(sc, 'c' + L[i], `${ropa} von ${nom(sc, i)}`, { min: 0, opcional: true, def: 0 }) : 0));
  }

  const filaTabla = (t, xs) => `<tr><th>${t}</th>${xs.map((x) => `<td>${x}</td>`).join('')}</tr>`;
  function tablaICE(sc, nu, coef, c0, x, ceq) {
    const idx = presentes(nu);
    const cab = `<tr><th><span class="solo-lector">Spezies</span></th>${idx.map((i) => `<th>${nh(nom(sc, i))}</th>`).join('')}</tr>`;
    const lib = libres(sc, nu), ini = filaTabla('Anfang', idx.map((i) => (lib[i] ? 'im Überschuss' : f(c0[i]))));
    const cam = filaTabla('Änderung', idx.map((i) => `${nu[i] < 0 ? '−' : '+'}${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`));
    const eq = filaTabla('Gleichgewicht', idx.map((i) => (lib[i] ? 'im Überschuss' : `${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${coef[i] === 1 ? '' : num2(coef[i]) + '·'}x`)));
    const num_ = filaTabla('x = ' + f(x), idx.map((i) => (lib[i] ? '—' : `<b>${f(ceq[i])}</b>`)));
    return `<table class="tabla">${cab}${ini}${cam}${eq}${num_}</table>`;
  }
  const gasesSolo = (sc, act) => { const ids = presentes(act); return ids.length > 0 && ids.every((i) => fase(sc, i) === 'g'); };
  const kp = (K, act, T, Rg = R_ATM) => { const dn = act.reduce((s, v) => s + v, 0); return { dn, Kp: K * Math.pow(Rg * T, dn) }; };
  function pasoKp(sc, K, act, T, ceq, Rg) {
    const { dn, Kp } = kp(K, act, T, Rg), P = ceq.map((v, i) => (act[i] ? v * Rg * T : 0)), Pt = P.reduce((s, v) => s + v, 0), u = Rg === R_ATM ? 'atm' : 'bar', rt = Rg === R_ATM ? '0,082' : '0,083145';
    const parc = presentes(act).map((i) => `$p_{${qn(nom(sc, i))}} = c·R·T = ${f(ceq[i])} · ${rt} · ${f(T)} = ${f(P[i])} "${u}"$`).join('; ');
    return { Kp, dn, P, Pt, paso: { t: 'Kp und Partialdrücke', html: `Mit $T = ${f(T)} "K"$ und idealen Gasen: $Δn = ${num2(dn)}$ (Gasmole der Produkte minus die der Edukte; Feststoffe und Flüssigkeiten zählen nicht), also $K_p = K_c (R T)^{Δn} = ${f(K)} · (${rt} · ${f(T)})^{${num2(dn)}} = ${f(Kp)}$. Partialdrücke: ${parc}. Gesamtdruck: $P = ${f(Pt)} "${u}"$.` } };
  }
  const ecuacionX = (sc, coef, nu, c0, K) => {
    const termino = (i) => { const p = coef[i], base = `(${f(c0[i])} ${nu[i] < 0 ? '−' : '+'} ${p === 1 ? '' : num2(p) + '·'}x)`; return base + (p === 1 ? '' : `^{${num2(p)}}`); };
    const lado = (idx) => idx.filter((i) => coef[i] > 0 && !puro(sc, i)).map(termino).join(' · ') || '1';
    return `$K_c = ${f(K)} = {${lado([2, 3])}}/{${lado([0, 1])}}$`;
  };

  function cabecera(sc, coef, K, kind) {
    return { t: 'Die Reaktion und ihre Konstante', html: `$${exprK(sc, coef)}$${kind === 'dado' ? `, mit $K_c = ${f(K)}$` : ''}. Die Reaktion ist ${reaccionH(sc, coef)}. Reine Feststoffe und Flüssigkeiten gehen nicht in $K$ ein (ihre Aktivität ist 1); was du nicht als Feststoff oder Flüssigkeit markierst, gilt als Gas oder gelöst.` };
  }

  function modoK(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'die Anfangskonzentration');
    const e = L.indexOf(String(sc.especie || 'C'));
    if (e < 0 || !nu[e]) throw new Error('Wähle eine Spezies, die in der Reaktion vorkommt');
    if (puro(sc, e)) throw new Error('Die gemessene Spezies darf kein reiner Feststoff oder keine reine Flüssigkeit sein: Ihre Konzentration ändert sich nicht. Wähle ein Gas oder eine gelöste Spezies');
    const ce = num(sc, 'ceq', `die Gleichgewichtskonzentration von ${nom(sc, e)}`, { min: 0 });
    const x = (ce - c0[e]) / nu[e];
    const ceq = c0.map((v, i) => (nu[i] ? v + nu[i] * x : v));
    if (ceq.some((v, i) => nu[i] && !libre[i] && v < -1e-12)) throw new Error('Mit diesen Daten wird eine Gleichgewichtskonzentration negativ: Prüfe die gemessene oder die anfänglichen Konzentrationen');
    if (presentes(act).some((i) => !(ceq[i] > 1e-12))) throw new Error('Eine Spezies wird vollständig aufgebraucht: Die Reaktion ist vollständig, und K lässt sich mit diesen Daten nicht berechnen');
    const K = Math.exp(presentes(act).reduce((s, i) => s + act[i] * Math.log(ceq[i]), 0));
    const pasos = [cabecera(sc, coef, K, 'calcula')];
    pasos.push({ t: 'Daten', html: `Anfangskonzentrationen: ${presentes(nu).map((i) => `$${conc(sc, i)}_0 = ${f(c0[i])}$`).join(', ')} (mol/L). Im Gleichgewicht wird $${conc(sc, e)} = ${f(ce)} "mol/L"$ gemessen.` });
    pasos.push({ t: 'Wie weit die Reaktion fortgeschritten ist', html: `${nh(nom(sc, e))} ist von ${f(c0[e])} auf ${f(ce)} gegangen, und sein Koeffizient ist ${num2(coef[e])}: $x = (${f(ce)} − ${f(c0[e])}) / ${num2(nu[e])} = ${f(x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c0, x, ceq) });
    pasos.push({ t: 'Kc', html: `$${exprK(sc, coef)} = ${f(K)}$` });
    const out = { modo: 'K', coef, nu, act, libre, c0, ceq, x, K, ...limites(c0, nu, libre), pasos };
    if (c0[0] > 0) out.alfa = (coef[0] * x) / c0[0];
    if (out.alfa !== undefined) pasos.push({ t: 'Dissoziationsgrad (Umsatz)', html: `${nh(nom(sc, 0))} wurde zu ${f(100 * out.alfa)} % verbraucht: $α = a·x / ${conc(sc, 0)}_0 = ${num2(coef[0])} · ${f(x)} / ${f(c0[0])} = ${f(out.alfa)}$.` });
    cierre(sc, out, K, act, ceq);
    return out;
  }
  function cierre(sc, out, K, act, ceq) {
    const T = num(sc, 'T', 'la temperatura', { min: 0, estricto: true, opcional: true, def: null });
    out.dn = act.reduce((s, v) => s + v, 0);
    if (T !== null && gasesSolo(sc, act)) { const k = pasoKp(sc, K, act, T, ceq, out.modo === 'dG' ? R_BAR : R_ATM); out.T = T; out.Kp = k.Kp; out.dn = k.dn; out.P = k.P; out.Pt = k.Pt; out.pasos.push(k.paso); }
  }

  function modoEq(sc, base, dG) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'die Anfangskonzentration'), K = dG ? dG.K : num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q0 = cociente(c0, act), s0 = sentido(Q0, K), r = avance(c0, nu, K, act, libre), ceq = equilibrio(c0, nu, r.x, libre);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    if (dG) pasos.splice(0, 0, ...dG.pasos);
    if (r.agotado) pasos.push({ t: 'Hinweis: Ein Feststoff wird aufgebraucht', html: 'Die von dir angegebene Feststoffmenge wird verbraucht, bevor das Gleichgewicht erreicht wird: Die Reaktion läuft, bis er aufgebraucht ist, und mit diesem Wert von K <b>wird das Gleichgewicht nicht erreicht</b>. Die sich ergebenden Konzentrationen sind die endgültigen.' });
    pasos.push({ t: 'Was zu Beginn geschieht', html: `Mit den Anfangskonzentrationen ist $Q = ${f(Q0)}$ und $K_c = ${f(K)}$: Da $Q ${s0 === 'eq' ? '=' : Q0 < K ? '<' : '>'} K$, ${TXT_SENT[s0]}.` });
    pasos.push({ t: 'Konzentrationstabelle', html: `Sei $x$ der Fortschritt der Reaktion (mol/L). ${r.x < 0 ? 'Da er negativ ist, läuft sie in Wirklichkeit zurück.' : ''}` + '<br>' + tablaICE(sc, nu, coef, c0, r.x, ceq) });
    pasos.push({ t: 'Gleichung für x', html: `${ecuacionX(sc, coef, nu, c0, K)}. Gelöst wird für $x$ zwischen ${lim(r.lo)} und ${lim(r.hi)} (das Intervall, in dem keine Konzentration negativ ist); da $K$ mit $x$ wächst, gibt es nur eine gültige Lösung: $x = ${f(r.x)} "mol/L"$.` });
    pasos.push({ t: 'Gleichgewichtskonzentrationen', html: presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])} "mol/L"$`).join(', ') + `. Kontrolle: $Q = ${f(cociente(ceq, act))}$.` });
    const out = { modo: dG ? 'dG' : 'eq', coef, nu, act, libre, c0, ceq, x: r.x, K, Q0, s0, lo: r.lo, hi: r.hi, agotado: !!r.agotado, pasos };
    if (c0[0] > 0 && r.x > 0) { out.alfa = (coef[0] * r.x) / c0[0]; pasos.push({ t: 'Dissoziationsgrad (Umsatz)', html: `${nh(nom(sc, 0))} wird zu ${f(100 * out.alfa)} % verbraucht: $α = a·x / ${conc(sc, 0)}_0 = ${f(out.alfa)}$.` }); }
    cierre(sc, out, K, act, ceq);
    if (dG) { out.dG = dG.dG; out.Kp0 = dG.Kp; }
    return out;
  }

  function modoQ(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c = leeConc(sc, nu, 'die Konzentration'), K = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const Q = cociente(c, act), s = sentido(Q, K), r = avance(c, nu, K, act, libre), ceq = equilibrio(c, nu, r.x, libre);
    const pasos = [cabecera(sc, coef, K, 'dado')];
    pasos.push({ t: 'Reaktionsquotient', html: `Q hat dieselbe Form wie $K$, aber mit den Konzentrationen von jetzt: $${exprK(sc, coef).replace('K_c', 'Q')} = ${f(Q)}$.` });
    pasos.push({ t: 'Q frente a K', html: `$Q = ${f(Q)}$ y $K_c = ${f(K)}$. ${s === 'eq' ? 'Sie sind gleich: Das System befindet sich im Gleichgewicht und ändert sich nicht.' : Q < K ? 'Da $Q < K$, liegt zu viel Edukt für das Gleichgewicht vor: Die Reaktion läuft nach <b>rechts</b>.' : 'Da $Q > K$, liegt zu viel Produkt für das Gleichgewicht vor: Die Reaktion läuft nach <b>links</b> zurück.'}` });
    pasos.push({ t: 'Wo sie endet', html: `Bis zum Gleichgewicht schreitet die Reaktion um $x = ${f(r.x)} "mol/L"$ fort: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(ceq[i])}$`).join(', ')}.` + '<br>' + tablaICE(sc, nu, coef, c, r.x, ceq) });
    const out = { modo: 'Q', coef, nu, act, libre, c0: c, ceq, x: r.x, K, Q, s0: s, lo: r.lo, hi: r.hi, agotado: !!r.agotado, pasos };
    cierre(sc, out, K, act, ceq);
    return out;
  }

  const TIPOS_LC = [['anadir', 'Eine Spezies zugeben'], ['quitar', 'Eine Spezies entfernen'], ['volumen', 'Das Volumen ändern (komprimieren oder expandieren)'], ['temperatura', 'Die Temperatur ändern'], ['inerte', 'Ein Inertgas bei konstantem Volumen zugeben'], ['catalizador', 'Einen Katalysator zugeben']];
  function modoLC(sc, base) {
    const { coef, nu, act } = base, libre = libres(sc, nu), c0 = leeConc(sc, nu, 'die Anfangskonzentration'), K1 = num(sc, 'K', 'la constante Kc', { min: 0, estricto: true });
    const r1 = avance(c0, nu, K1, act, libre), c1 = equilibrio(c0, nu, r1.x, libre), tipo = sc.tipo || 'anadir';
    const pasos = [cabecera(sc, coef, K1, 'dado')];
    pasos.push({ t: 'Ausgangsgleichgewicht', html: `Mit den Anfangskonzentrationen ergibt sich $x = ${f(r1.x)} "mol/L"$: ${presentes(nu).map((i) => `$${conc(sc, i)} = ${f(c1[i])}$`).join(', ')}. Es ist ein Gleichgewicht: $Q = ${f(cociente(c1, act))} = K_c$.` });
    let c2 = c1.slice(), K2 = K1, desc = '', porque = '', dn = act.reduce((s, v) => s + v, 0);
    const e = L.indexOf(String(sc.esp || 'A'));
    if (tipo === 'anadir' || tipo === 'quitar') {
      if (e < 0 || !nu[e]) throw new Error('Wähle eine Spezies, die in der Reaktion vorkommt');
      const q = num(sc, 'cant', 'die Menge (mol/L)', { min: 0, estricto: true });
      if (tipo === 'quitar' && q >= c1[e]) throw new Error(`Es lassen sich keine ${f(q)} mol/L ${nom(sc, e)} entfernen: Im Gleichgewicht sind nur ${f(c1[e])} vorhanden`);
      c2[e] += tipo === 'anadir' ? q : -q;
      desc = `${tipo === 'anadir' ? 'Es werden' : 'Es werden'} ${f(q)} mol/L ${nh(nom(sc, e))} ${tipo === 'anadir' ? 'zugegeben' : 'entfernt'}, ohne das Volumen oder die Temperatur zu ändern, also ändert sich $K_c$ nicht.`;
      porque = tipo === 'anadir' ? `Das System wirkt der Zunahme von ${nh(nom(sc, e))} entgegen, indem es einen Teil davon verbraucht.` : `Das System wirkt dem Mangel an ${nh(nom(sc, e))} entgegen, indem es mehr davon bildet.`;
    } else if (tipo === 'volumen') {
      const rv = num(sc, 'rv', 'das Endvolumen geteilt durch das Anfangsvolumen (V₂/V₁)', { min: 0, estricto: true });
      c2 = c1.map((v, i) => (act[i] ? v / rv : v));
      desc = `Das Volumen wird das ${f(rv)}-Fache des anfänglichen (${rv < 1 ? 'es wird komprimiert' : rv > 1 ? 'es wird expandiert' : 'es ändert sich nicht'}), also werden alle Konzentrationen mit $1/${f(rv)}$ = ${f(1 / rv)} multipliziert; $K_c$ ändert sich nicht (gleiche Temperatur).`;
      porque = dn === 0 ? 'Auf jeder Seite liegen gleich viele Gasmole vor (Δn = 0): Das Volumen verschiebt das Gleichgewicht nicht, sondern ändert nur alle Konzentrationen im gleichen Verhältnis.' : `Δn = ${num2(dn)} Gasmole. ${rv < 1 ? 'Beim Komprimieren steigt der Druck, und das System senkt ihn, indem es zur Seite mit weniger Gasmolen geht' : 'Beim Expandieren sinkt der Druck, und das System erhöht ihn, indem es zur Seite mit mehr Gasmolen geht'}.`;
    } else if (tipo === 'temperatura') {
      const T1 = num(sc, 'T', 'die Anfangstemperatur (K)', { min: 0, estricto: true }), T2 = num(sc, 'T2', 'die Endtemperatur (K)', { min: 0, estricto: true }), dH = num(sc, 'dH', 'ΔH der Reaktion nach rechts (kJ/mol)');
      K2 = K1 * Math.exp((-dH * 1000 / R_J) * (1 / T2 - 1 / T1));
      desc = `Die Temperatur geht von ${f(T1)} K auf ${f(T2)} K. Die Konstante ändert sich nach der Van-'t-Hoff-Gleichung: $ln {K_2}/{K_1} = −{ΔH}/{R} (1/T_2 − 1/T_1)$ = $−{${f(dH * 1000)}}/{${R_J}} (1/${f(T2)} − 1/${f(T1)})$ ⇒ $K_2 = ${f(K2)}$. Die Konzentrationen ändern sich im ersten Moment nicht.`;
      porque = `Die Reaktion nach rechts ist ${dH > 0 ? 'endotherm (ΔH > 0)' : dH < 0 ? 'exotherm (ΔH < 0)' : 'neutral (ΔH = 0)'}: ${dH === 0 ? 'Die Temperatur ändert K nicht.' : (dH > 0) === (T2 > T1) ? 'Eine Temperaturerhöhung begünstigt die, die Wärme aufnimmt, und eine Senkung die, die sie abgibt, und K ' + (K2 > K1 ? 'steigt' : 'sinkt') + '.' : 'Das System wirkt der Temperaturänderung entgegen, und K ' + (K2 > K1 ? 'steigt' : 'sinkt') + '.'}`;
    } else if (tipo === 'inerte') {
      desc = 'Es wird ein Gas zugegeben, das nicht reagiert, ohne das Volumen zu ändern: Die Partialdrücke und die Konzentrationen der Spezies ändern sich nicht.';
      porque = 'Q ist weiterhin gleich K: Das Gleichgewicht verschiebt sich nicht. (Würde man es bei konstantem Druck zugeben, würde das Volumen wachsen, und man müsste die Option Expandieren verwenden.)';
    } else {
      desc = 'Ein Katalysator senkt die Aktivierungsenergie der Hin- und der Rückreaktion gleich.';
      porque = 'Q ist weiterhin gleich K und K ändert sich nicht: Das Gleichgewicht verschiebt sich nicht, es wird nur schneller erreicht.';
    }
    const Q2 = cociente(c2, act), s = sentido(Q2, K2), r2 = avance(c2, nu, K2, act, libre), c3 = equilibrio(c2, nu, r2.x, libre);
    pasos.push({ t: 'Die Störung', html: desc });
    pasos.push({ t: 'Q gegen K nach der Änderung', html: `$Q = ${f(Q2)}$ y $K_c = ${f(K2)}$. ${s === 'eq' ? 'Sie sind weiterhin gleich: <b>Das Gleichgewicht verschiebt sich nicht</b>.' : Q2 < K2 ? 'Da $Q < K$, läuft die Reaktion nach <b>rechts</b>.' : 'Da $Q > K$, läuft die Reaktion nach <b>links</b> zurück.'} ${porque}` });
    if (s !== 'eq') pasos.push({ t: 'Neues Gleichgewicht', html: `Man löst $K_c = ${f(K2)}$ ausgehend von den Konzentrationen nach der Änderung: $x = ${f(r2.x)} "mol/L"$.` + '<br>' + tablaICE(sc, nu, coef, c2, r2.x, c3) });
    const cmp = (i) => `<tr><th>${nh(nom(sc, i))}</th><td>${f(c1[i])}</td><td>${f(c2[i])}</td><td><b>${f(c3[i])}</b></td></tr>`;
    pasos.push({ t: 'Vorher und nachher', html: `<table class="tabla"><tr><th>mol/L</th><th>Anfangsgleichgewicht</th><th>Unmittelbar nach der Änderung</th><th>Neues Gleichgewicht</th></tr>${presentes(nu).map(cmp).join('')}</table>` });
    const out = { modo: 'lc', coef, nu, act, libre, tipo, c0: c2, c1, c2, ceq: c3, x: r2.x, K: K1, K2, Q: Q2, s0: s, lo: r2.lo, hi: r2.hi, dn, pasos };
    if (!(tipo === 'temperatura') && sc.T !== undefined && !vacio(sc.T)) cierre(sc, out, K1, act, c3);
    return out;
  }


  function modoDG(sc, base) {
    const dG = num(sc, 'dG', 'ΔG° der Reaktion (kJ pro Formelumsatz)'), T = num(sc, 'T', 'la temperatura (K)', { min: 0, estricto: true });
    const Kt = Math.exp((-dG * 1000) / (R_J * T));
    if (!(Kt > 1e-300 && Kt < 1e300)) throw new Error('Mit diesem ΔG° und dieser Temperatur ist K praktisch 0 oder unendlich: Die Reaktion läuft nicht ab oder ist vollständig, es gibt kein Gleichgewicht zu berechnen');
    const gas = gasesSolo(sc, base.act), dn = base.act.reduce((s, v) => s + v, 0), K = gas ? Kt * Math.pow(R_BAR * T, -dn) : Kt;
    const pasos = [{ t: 'K aus ΔG°', html: `$K = e^{−{ΔG^"°"}/{R T}} = e^{−{${f(dG * 1000)}}/{${R_J} · ${f(T)}}} = ${f(Kt)}$.` + (gas ? ` Da alles Gas ist, ist dies $K_p$ (Standardzustand bei 1 bar). Um in mol/L zu rechnen: $K_c = K_p (R T)^{−Δn} = ${f(Kt)} · (${num2(R_BAR)} · ${f(T)})^{${num2(-dn)}} = ${f(K)}$ mit $R = ${num2(R_BAR)} "bar·L/(mol·K)"$ und $Δn = ${num2(dn)}$.` : ' K hat keine Einheiten; es wird als $K_c$ verwendet (Standardzustand 1 mol/L).') }];
    return modoEq(sc, base, { K, dG, Kp: Kt, pasos });
  }

  const L5 = ['A', 'B', 'C', 'D', 'E'];
  function modoDos(sc) {
    const nm = (i) => (vacio(sc['n' + L5[i]]) ? L5[i] : String(sc['n' + L5[i]]).trim());
    const leeNu = (r, i) => { const k = 'r' + r + L5[i]; if (vacio(sc[k])) return 0; const v = leeNum(sc[k]); if (!isFinite(v)) throw new Error(`Der Koeffizient von ${nm(i)} in der Reaktion ${r} muss eine Zahl sein (negativ, wenn es ein Edukt ist)`); return v; };
    const nu1 = L5.map((_, i) => leeNu(1, i)), nu2 = L5.map((_, i) => leeNu(2, i));
    const c0 = L5.map((_, i) => { const k = 'c' + L5[i]; return vacio(sc[k]) ? 0 : num(sc, k, `die Konzentration von ${nm(i)}`, { min: 0 }); });
    const K1 = num(sc, 'K1', 'die Konstante K₁', { min: 0, estricto: true }), K2 = num(sc, 'K2', 'die Konstante K₂', { min: 0, estricto: true });
    for (const [r, nu] of [[1, nu1], [2, nu2]]) if (!nu.some((v) => v < 0) || !nu.some((v) => v > 0)) throw new Error(`Die Reaktion ${r} braucht mindestens ein Edukt (negativer Koeffizient) und ein Produkt (positiv)`);
    let par = true; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (Math.abs(nu1[i] * nu2[j] - nu1[j] * nu2[i]) > 1e-12) par = false;
    if (par) throw new Error('Die beiden Reaktionen sind dieselbe (oder die eine ist ein Vielfaches der anderen): Mit einer einzigen K genügt es, verwende die anderen Modi');
    const part = L5.map((_, i) => nu1[i] !== 0 || nu2[i] !== 0);
    const lnQ = (c, nu) => { let t = 0; for (let i = 0; i < 5; i++) if (nu[i]) t += nu[i] * Math.log(c[i]); return t; };
    const base = (x1) => c0.map((v, i) => v + nu1[i] * x1);
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
    if (!(rango2(xm).ancho > 1e-14)) throw new Error('Mit diesen Konzentrationen kann keine der beiden Reaktionen ablaufen: Gib etwas Edukt an');
    const borde = (x0, x1) => { let u = x0, v = x1; for (let k = 0; k < 300; k++) { const m = (u + v) / 2; if (rango2(m).ancho > 0) u = m; else v = m; } return u; };
    const A = rango2(-M).ancho > 0 ? -M : borde(xm, -M), B = rango2(M).ancho > 0 ? M : borde(xm, M);
    let u = Math.min(A, B), v = Math.max(A, B);
    const h = (x1) => { const x2 = x2de(x1); return lnQ(c0.map((c, i) => c + nu1[i] * x1 + nu2[i] * x2), nu1) - Math.log(K1); };
    for (let k = 0; k < 300; k++) { const m = (u + v) / 2, hv = h(m); if (!isFinite(hv)) break; if (hv > 0) v = m; else u = m; if (v - u < 1e-17 * Math.max(1, Math.abs(m))) break; }
    const x1 = (u + v) / 2, x2 = x2de(x1), ceq = c0.map((c, i) => Math.max(0, c + nu1[i] * x1 + nu2[i] * x2));
    const Q1 = Math.exp(lnQ(ceq, nu1)), Q2 = Math.exp(lnQ(ceq, nu2));
    const lado = (nu, sg) => L5.map((_, i) => (nu[i] * sg > 0 ? (Math.abs(nu[i]) === 1 ? '' : num2(Math.abs(nu[i])) + ' ') + nh(nm(i)) : '')).filter(Boolean).join(' + ');
    const ec = (nu) => `${lado(nu, -1)} ⇌ ${lado(nu, 1)}`;
    const kex = (nu, k) => { const t = (sg) => L5.map((_, i) => (nu[i] * sg > 0 ? `[${qn(nm(i))}]${Math.abs(nu[i]) === 1 ? '' : `^{${num2(Math.abs(nu[i]))}}`}` : '')).filter(Boolean).join(' '); return `K_${k} = {${t(1)}}/{${t(-1)}}`; };
    const idx = L5.map((_, i) => i).filter((i) => part[i]);
    const cam = (i) => [nu1[i] ? `${nu1[i] < 0 ? '−' : '+'}${Math.abs(nu1[i]) === 1 ? '' : num2(Math.abs(nu1[i])) + '·'}x₁` : '', nu2[i] ? `${nu2[i] < 0 ? '−' : '+'}${Math.abs(nu2[i]) === 1 ? '' : num2(Math.abs(nu2[i])) + '·'}x₂` : ''].join(' ').trim();
    const tabla = `<table class="tabla"><tr><th><span class="solo-lector">Spezies</span></th>${idx.map((i) => `<th>${nh(nm(i))}</th>`).join('')}</tr><tr><th>Anfang</th>${idx.map((i) => `<td>${f(c0[i])}</td>`).join('')}</tr><tr><th>Änderung</th>${idx.map((i) => `<td>${cam(i)}</td>`).join('')}</tr><tr><th>Gleichgewicht</th>${idx.map((i) => `<td><b>${f(ceq[i])}</b></td>`).join('')}</tr></table>`;
    const pasos = [
      { t: 'Die beiden Reaktionen', html: `Reaktion 1: ${ec(nu1)}, mit $${kex(nu1, 1)} = ${f(K1)}$.<br>Reaktion 2: ${ec(nu2)}, mit $${kex(nu2, 2)} = ${f(K2)}$.<br>Sie teilen sich Spezies, sodass beide Konstanten gleichzeitig mit denselben Konzentrationen gelten.` },
      { t: 'Ein Fortschritt pro Reaktion', html: `Seien $x_1$ und $x_2$ der Fortschritt jeder Reaktion (mol/L). Jede Spezies ändert sich um die Summe dessen, was ihr von beiden zufällt:<br>${tabla}` },
      { t: 'Zwei Gleichungen, zwei Unbekannte', html: 'Man verlangt $Q_1 = K_1$ und $Q_2 = K_2$ mit diesen Konzentrationen. Im Allgemeinen gibt es keine geschlossene Formel: Es wird numerisch gelöst (für jedes $x_1$ bestimmt man das $x_2$, das Reaktion 2 erfüllt, und sucht dann das $x_1$, das 1 erfüllt; beide Funktionen sind monoton, sodass es nur eine Lösung gibt).' },
      { t: 'Lösung', html: `$x_1 = ${f(x1)} "mol/L"$ und $x_2 = ${f(x2)} "mol/L"$: ${idx.map((i) => `$[${qn(nm(i))}] = ${f(ceq[i])}$`).join(', ')}.` },
      { t: 'Kontrolle', html: `$Q_1 = ${f(Q1)}$ (muss $K_1 = ${f(K1)}$ sein) und $Q_2 = ${f(Q2)}$ (muss $K_2 = ${f(K2)}$ sein).` },
    ];
    const curva = [], paso = Math.max(Math.abs(x1), 1e-3), e0 = Math.max(Math.min(A, B), x1 - 6 * paso), e1 = Math.min(Math.max(A, B), x1 + 6 * paso);
    for (let k = 1; k < 80; k++) { const t = e0 + ((e1 - e0) * k) / 80; if (rango2(t).ancho > 1e-14) { const y2 = x2de(t); curva.push({ x: t, c: c0.map((c, i) => Math.max(0, c + nu1[i] * t + nu2[i] * y2)) }); } }
    return { modo: 'dos', nombres: L5.map((_, i) => nm(i)), nu1, nu2, c0, ceq, x: x1, x1, x2, K: K1, K1, K2, Q1, Q2, curva, part, reaccion: `${ec(nu1)}  ·  ${ec(nu2)}`, pasos, nu: part.map((p) => (p ? 1 : 0)) };
  }

  function resolver(sc) {
    ajusta();
    if (sc.modo === 'dos') return modoDos(sc);
    const base = lee(sc);
    if (!presentes(base.nu).some((i) => base.nu[i] < 0) || !presentes(base.nu).some((i) => base.nu[i] > 0)) throw new Error('Es werden mindestens ein Edukt und ein Produkt benötigt');
    if (!presentes(base.act).length) throw new Error('Alle Spezies sind reine Feststoffe oder Flüssigkeiten: K wäre 1 und es gibt nichts zu berechnen. Lass mindestens ein Gas oder eine gelöste Spezies stehen');
    const m = sc.modo || 'K';
    const r = m === 'dG' ? modoDG(sc, base) : m === 'eq' ? modoEq(sc, base) : m === 'Q' ? modoQ(sc, base) : m === 'lc' ? modoLC(sc, base) : modoK(sc, base);
    r.nombres = [0, 1, 2, 3].map((i) => nom(sc, i));
    r.reaccion = reaccionH(sc, base.coef);
    return r;
  }

  const ej = (clave, nombre, sc) => ({ clave, nombre, sc: Object.assign({ nA: 'H2', nB: 'I2', nC: 'HI', nD: '', a: '1', b: '1', c: '2', d: '', cA: '', cB: '', cC: '', cD: '', T: '' }, sc) });
  const N2O4 = { nA: 'N2O4', nB: '', nC: 'NO2', nD: '', a: '1', b: '', c: '2', d: '' };
  const ejemplos = [
    ej('hi', 'H₂ + I₂ ⇌ 2 HI: Konzentrationen mit Kc = 50', { modo: 'eq', cA: '1', cB: '1', K: '50', T: '731' }),
    ej('n2o4', 'N₂O₄ ⇌ 2 NO₂: Dissoziationsgrad', { ...N2O4, modo: 'eq', cA: '0,1', cC: '0', K: '0,2', T: '400' }),
    ej('calcular-k', 'Kc aus der gemessenen [HI] berechnen', { modo: 'K', cA: '1', cB: '1', especie: 'C', ceq: '1,2' }),
    ej('q', 'N₂O₄ ⇌ 2 NO₂: In welche Richtung läuft es?', { ...N2O4, modo: 'Q', cA: '0,1', cC: '0,4', K: '0,2' }),
    ej('lc-anadir', 'Le Chatelier: H₂ zum Gleichgewicht geben', { modo: 'lc', cA: '1', cB: '1', K: '50', tipo: 'anadir', esp: 'A', cant: '1' }),
    ej('lc-volumen', 'Le Chatelier: N₂O₄ ⇌ 2 NO₂ auf die Hälfte komprimieren', { ...N2O4, modo: 'lc', cA: '0,1', cC: '0', K: '0,2', tipo: 'volumen', rv: '0,5' }),
    ej('carbonato', 'CaCO₃(s) ⇌ CaO(s) + CO₂(g): Feststoffe gehen nicht in K ein (Kc = 0,0025)', { modo: 'eq', nA: 'CaCO3', nB: '', nC: 'CaO', nD: 'CO2', a: '1', b: '', c: '1', d: '1', fA: 's', fC: 's', fD: 'g', cA: '', cD: '0', K: '0,0025', T: '1000' }),
    ej('carbono-co2', 'C(s) + CO₂(g) ⇌ 2 CO(g): mit Kohlenstoff im Überschuss (Kc = 0,2)', { modo: 'eq', nA: 'C', nB: 'CO2', nC: 'CO', nD: '', a: '1', b: '1', c: '2', d: '', fA: 's', fB: 'g', fC: 'g', cA: '', cB: '1', cC: '0', K: '0,2', T: '1100' }),
    ej('dg-amoniaco', 'N₂ + 3 H₂ ⇌ 2 NH₃ bei 298 K mit ΔG° = −32,8 kJ/mol (K aus ΔG°)', { modo: 'dG', nA: 'N2', nB: 'H2', nC: 'NH3', nD: '', a: '1', b: '3', c: '2', d: '', cA: '1', cB: '3', cC: '0', dG: '-32,8', T: '298' }),
    ej('dos-cadena', 'Zwei verkettete Gleichgewichte: A ⇌ B (K₁ = 2) und B ⇌ C (K₂ = 0,5), mit 1 M A', { modo: 'dos', nA: 'A', nB: 'B', nC: 'C', nD: '', nE: '', r1A: '-1', r1B: '1', r1C: '', r1D: '', r1E: '', r2A: '', r2B: '-1', r2C: '1', r2D: '', r2E: '', cA: '1', cB: '', cC: '', cD: '', cE: '', K1: '2', K2: '0,5' }),
    ej('dos-cloro', 'PCl₅ ⇌ PCl₃ + Cl₂ und Cl₂ + CO ⇌ COCl₂ (Beispielkonstanten)', { modo: 'dos', nA: 'PCl5', nB: 'PCl3', nC: 'Cl2', nD: 'CO', nE: 'COCl2', r1A: '-1', r1B: '1', r1C: '1', r1D: '', r1E: '', r2A: '', r2B: '', r2C: '-1', r2D: '-1', r2E: '1', cA: '0,5', cB: '', cC: '', cD: '1', cE: '', K1: '0,04', K2: '20' }),
    ej('lc-temperatura', 'Le Chatelier: N₂O₄ ⇌ 2 NO₂ erwärmen (ΔH = +57,2 kJ/mol)', { ...N2O4, modo: 'lc', cA: '0,1', cC: '0', K: '4,6e-3', T: '298', tipo: 'temperatura', T2: '350', dH: '57,2' }),
  ];

  return { resolver, ejemplos, f, leeNum, cociente, avance, TIPOS_LC };
})();

