const Formulas = (() => {
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  const NA = 6.02214076e23, VM = 22.4; // L/mol en condiciones normales (0 °C, 1 atm)
  const R = 0.082; // atm·L/(mol·K), el de clase
  const vm = (T = 273.15, P = 1) => (Math.abs(T - 273.15) < 1e-9 && Math.abs(P - 1) < 1e-12 ? VM : (R * T) / P);
  const ME = 5.48579909e-4; // masa molar del electrón (g/mol), para las semirreacciones

  const MEDIAS = { Cl: 35.5, Cu: 63.5 };
  const masaDe = (sim, modo) => {
    const e = Elementos.porSimbolo[sim];
    if (modo === 'redondeadas') return MEDIAS[sim] ?? Math.round(e.masa);
    return e.masa;
  };

  const ESTADOS = { s: 's', l: 'l', g: 'g', aq: 'aq', ac: 'aq', dis: 'aq' };
  function leer(texto) {
    let t = String(texto).trim().replace(/[₀-₉]/g, (c) => SUB[c]).replace(/[⁰¹²³⁴-⁹⁺⁻]/g, (c) => SUP[c]).replace(/[−–]/g, '-');
    if (!t) throw new Error('Schreibe eine Formel');
    let estado = null;
    const me = t.match(/\s*\((s|l|g|aq|ac|dis)\)$/i);
    if (me) { estado = ESTADOS[me[1].toLowerCase()]; t = t.slice(0, me.index).trim(); }
    let carga = 0;
    const mc = t.match(/\^\(?(\d*)([+-])(\d*)\)?$/) || t.match(/\s+(\d*)([+-])$/);
    if (mc) { carga = (mc[2] === '+' ? 1 : -1) * (+(mc[1] || mc[3] || 1)); t = t.slice(0, mc.index); }
    else {
      const mp = t.match(/(\d*)([+-])$/);
      if (mp) {
        const cuerpo = t.slice(0, mp.index), dig = mp[1];
        const unAtomo = /^[A-Z][a-z]?$/.test(cuerpo);
        let q = '';
        if (dig.length >= 2) q = dig.slice(-1); else if (dig && unAtomo) q = dig;
        carga = (mp[2] === '+' ? 1 : -1) * (+(q || 1));
        t = cuerpo + dig.slice(0, dig.length - q.length);
      }
    }
    t = t.replace(/\s+/g, '');
    if (t === 'e') return { atomos: {}, carga: carga || -1, estado, electron: true, html: 'e<sup>−</sup>' };
    const partes = t.split(/[·*•.]/);
    const atomos = {};
    const suma = (a, b, f) => { for (const [k, v] of Object.entries(b)) a[k] = (a[k] || 0) + v * f; };
    for (const parte of partes) {
      if (!parte) throw new Error('Neben dem Punkt des Hydrats fehlt ein Teil der Formel');
      const m = parte.match(/^(\d+)(.*)$/);
      const coef = m ? +m[1] : 1, cuerpo = m ? m[2] : parte;
      let i = 0;
      const grupo = (cierre) => {
        const at = {};
        while (i < cuerpo.length) {
          const c = cuerpo[i];
          if (c === '(' || c === '[') {
            i++;
            const dentro = grupo(c === '(' ? ')' : ']');
            suma(at, dentro, numero());
          } else if (c === ')' || c === ']') {
            if (c !== cierre) throw new Error(`Falsch geschlossene Klammer in „${texto}“`);
            i++;
            return at;
          } else if (/[A-Z]/.test(c)) {
            let s = c; i++;
            if (i < cuerpo.length && /[a-z]/.test(cuerpo[i])) { s += cuerpo[i]; i++; }
            if (!Elementos.porSimbolo[s]) throw new Error(`„${s}“ ist kein Elementsymbol`);
            at[s] = (at[s] || 0) + numero();
          } else throw new Error(`Ich verstehe „${c}“ in „${texto}“ nicht. Symbole beginnen mit einem Großbuchstaben: Co ist Cobalt, CO ist Kohlenmonoxid.`);
        }
        if (cierre) throw new Error(`In „${texto}“ fehlt eine schließende Klammer`);
        return at;
      };
      const numero = () => { let n = ''; while (i < cuerpo.length && /\d/.test(cuerpo[i])) n += cuerpo[i++]; return n ? +n : 1; };
      const at = grupo(null);
      if (!Object.keys(at).length) throw new Error(`„${texto}“ enthält kein Element`);
      suma(atomos, at, coef);
    }
    return { atomos, carga, estado, html: html(t, carga) + (estado ? `<small class="estado">(${estado})</small>` : '') };
  }
  function html(t, carga) {
    let h = t.replace(/[*•.]/g, '·').replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
    if (carga) h += `<sup>${Math.abs(carga) > 1 ? Math.abs(carga) : ''}${carga > 0 ? '+' : '−'}</sup>`;
    return h;
  }

  function masaMolar(texto, modo = 'iupac') {
    const f = leer(texto);
    if (f.electron) return { ...f, M: ME, filas: [] };
    let M = 0;
    const filas = Object.entries(f.atomos).map(([s, n]) => { const a = masaDe(s, modo); M += n * a; return { simbolo: s, nombre: Elementos.porSimbolo[s].nombre, n, masa: a, aporte: n * a }; });
    filas.forEach((r) => (r.porcentaje = (100 * r.aporte) / M));
    return { ...f, M, filas };
  }

  const mcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  const fr = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = mcd(n, d) || 1n; return [n / g, d / g]; };
  const mul = (a, b) => fr(a[0] * b[0], a[1] * b[1]), sub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]), div = (a, b) => fr(a[0] * b[1], a[1] * b[0]);

  function separar(texto) {
    const t = String(texto).replace(/<-+>|<=+>|⇌|⇄|↔|⟷|⟶|⇒|→|=>|-+>|=/g, '→');
    const lados = t.split('→');
    if (lados.length !== 2) throw new Error('Schreibe die Reaktion mit einem Pfeil: Edukte -> Produkte');
    const especies = (lado) => lado.split(/\s\+\s|\s\+(?=\s*[A-Z(\[\d])|(?<=[A-Za-z0-9)\]]|(?<!\^)[+-])(?<!\^)\+(?=\s*(?:\d+\s*)?(?:[A-Z(\[]|e(?![a-z])))/).map((s) => s.trim()).filter(Boolean)
      .map((s) => s.replace(/^\d+\s*(?=[A-Z(\[]|e(?![a-z]))/, '').replace(/^\d+\s+/, '')); // quita los coeficientes que ponga el usuario
    const R = especies(lados[0]), P = especies(lados[1]);
    if (!R.length || !P.length) throw new Error('Es fehlt ein Edukt oder Produkt');
    return { R, P };
  }

  function ajustar(texto) {
    const { R, P } = separar(texto);
    const sp = [...R, ...P].map((s) => ({ texto: s, ...leer(s) }));
    const els = [...new Set(sp.flatMap((s) => Object.keys(s.atomos)))];
    const filas = els.map((e) => sp.map((s, j) => (j < R.length ? 1 : -1) * (s.atomos[e] || 0)));
    if (sp.some((s) => s.carga)) filas.push(sp.map((s, j) => (j < R.length ? 1 : -1) * s.carga));
    for (const e of els) {
      if (!R.some((s) => leer(s).atomos[e])) throw new Error(`Das Element ${Elementos.porSimbolo[e].nombre.toLowerCase()} (${e}) erscheint nur bei den Produkten`);
      if (!P.some((s) => leer(s).atomos[e])) throw new Error(`Das Element ${Elementos.porSimbolo[e].nombre.toLowerCase()} (${e}) erscheint nur bei den Edukten`);
    }
    const n = sp.length, A = filas.map((f) => f.map((v) => fr(BigInt(v))));
    const piv = [];
    let r = 0;
    for (let c = 0; c < n && r < A.length; c++) {
      let p = r; while (p < A.length && A[p][c][0] === 0n) p++;
      if (p === A.length) continue;
      [A[r], A[p]] = [A[p], A[r]];
      const pv = A[r][c];
      A[r] = A[r].map((v) => div(v, pv));
      for (let i = 0; i < A.length; i++) if (i !== r && A[i][c][0] !== 0n) { const f = A[i][c]; A[i] = A[i].map((v, j) => sub(v, mul(f, A[r][j]))); }
      piv.push(c); r++;
    }
    const libres = [...Array(n).keys()].filter((c) => !piv.includes(c));
    if (libres.length === 0) throw new Error(`Diese Reaktion lässt sich nicht ausgleichen: Keine Menge positiver Koeffizienten gleicht die Atome${els.length ? ' von ' + els.join(', ') : ''}${sp.some((s) => s.carga) ? ' und die Ladung' : ''} aus. Meist fehlt ein Stoff (zum Beispiel H₂O, H⁺ oder OH⁻ bei einer Ionenreaktion) oder eine Formel ist falsch geschrieben: Prüfe jede Spezies.`);
    if (libres.length > 1) {
      const ajustes = libres.map((lib) => {
        const x = Array(n).fill(null).map(() => fr(0n)); x[lib] = fr(1n); piv.forEach((c, i) => (x[c] = fr(-A[i][lib][0], A[i][lib][1])));
        const mcm = x.reduce((m, v) => (m * v[1]) / mcd(m, v[1]), 1n); let coef = x.map((v) => (v[0] * mcm) / v[1]); const g = coef.reduce((a, b) => mcd(a, b)); coef = coef.map((c) => c / g);
        const signo = coef.find((c) => c !== 0n) > 0n ? 1n : -1n; coef = coef.map((c) => c * signo);
        const ladoT = (L) => L.map(([j, c]) => (c > 1n ? c + ' ' : '') + sp[j].texto).join(' + ');
        const iz = coef.map((c, j) => [j, c]).filter(([j, c]) => c !== 0n && j < R.length), de = coef.map((c, j) => [j, c]).filter(([j, c]) => c !== 0n && j >= R.length);
        const negativos = coef.some((c) => c < 0n);
        return negativos ? null : (iz.length && de.length ? `${ladoT(iz)} → ${ladoT(de)}` : null);
      }).filter(Boolean);
      throw new Error(`Die Gleichung hat ${libres.length} Freiheitsgrade: Sie lässt ${libres.length} unabhängige Ausgleiche und damit unendlich viele Koeffizientensätze zu (es sind mehrere Reaktionen zusammen).${ajustes.length ? ' Unabhängige Ausgleiche: ' + ajustes.join('  ·  ') + '.' : ''} Trenne sie in verschiedene Reaktionen und gleiche jede einzeln aus.`);
    }
    const lib = libres[0], x = Array(n).fill(null);
    x[lib] = fr(1n);
    piv.forEach((c, i) => (x[c] = fr(-A[i][lib][0], A[i][lib][1])));
    const mcm = x.reduce((m, v) => (m * v[1]) / mcd(m, v[1]), 1n);
    let coef = x.map((v) => (v[0] * mcm) / v[1]);
    const g = coef.reduce((a, b) => mcd(a, b));
    coef = coef.map((c) => c / g);
    if (coef.some((c) => c === 0n)) throw new Error('Eine Spezies nimmt an der ausgeglichenen Reaktion nicht teil: Sie ist in der Gleichung überflüssig');
    if (coef.some((c) => (c > 0n) !== (coef[0] > 0n))) throw new Error('Es gibt keinen Ausgleich mit lauter positiven Koeffizienten: Prüfe, was Edukt und was Produkt ist');
    if (coef[0] < 0n) coef = coef.map((c) => -c);
    const especies = sp.map((s, j) => ({ texto: s.texto, html: s.html, atomos: s.atomos, carga: s.carga, coef: Number(coef[j]), reactivo: j < R.length }));
    const lado = (L) => L.map((s) => (s.coef > 1 ? s.coef + ' ' : '') + s.html).join(' + ');
    return { especies, html: lado(especies.filter((s) => s.reactivo)) + ' <span class="flecha">→</span> ' + lado(especies.filter((s) => !s.reactivo)) };
  }

  const leeNum = (v) => +String(v ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?\(?([+\-−]?\d+)\)?/i, 'e$1').replace('−', '-');
  const vacia = (v) => v === '' || v == null || String(v).trim() === '';
  function estequiometria(texto, cantidades, { modo = 'iupac', rendimiento = 100, T = 273.15, P = 1, real = null } = {}) {
    const aj = ajustar(texto);
    const E = aj.especies.map((s) => ({ ...s, M: masaMolar(s.texto, modo).M, estado: leer(s.texto).estado }));
    const pasos = [], Vm = vm(T, P), cn = Vm === VM;
    const gas = cn ? 'Gas unter Normalbedingungen, 22,4 L/mol' : `ideales Gas bei ${num(T)} K und ${num(P)} atm: V<sub>m</sub> = RT/P = 0,082 · ${num(T)} / ${num(P)} = ${num(Vm)} L/mol`;
    const dadas = E.map((s, i) => ({ s, i, q: cantidades[i] })).filter((d) => d.s.reactivo && d.q && !vacia(d.q.valor));
    if (!dadas.length) throw new Error('Schreibe die Menge von mindestens einem Edukt');
    for (const d of dadas) {
      const v = leeNum(d.q.valor);
      if (!isFinite(v) || v <= 0) throw new Error(`Die Menge von ${d.s.texto} muss eine positive Zahl sein`);
      d.v = v;
      if (d.q.unidad === 'g') {
        const p = vacia(d.q.extra) ? 100 : leeNum(d.q.extra);
        if (!(p > 0 && p <= 100)) throw new Error(`Die Reinheit von ${d.s.texto} muss zwischen 0 und 100 % liegen`);
        const mp = (v * p) / 100;
        d.n = mp / d.s.M;
        pasos.push({ t: `Mol ${d.s.html}`, html: `${p < 100 ? `Nur ${num(p)} % sind reines ${d.s.html}: m = ${num(v)} · ${num(p)} / 100 = ${num(mp)} g. ` : ''}n = m / M = ${num(mp)} g / ${num(d.s.M)} g/mol = <b>${num(d.n)} mol</b>` });
      } else if (d.q.unidad === 'L') { d.n = v / Vm; pasos.push({ t: `Mol ${d.s.html}`, html: `n = V / V<sub>m</sub> = ${num(v)} L / ${num(Vm)} L/mol = <b>${num(d.n)} mol</b> (${gas})` }); }
      else if (d.q.unidad === 'disol') {
        const c = leeNum(d.q.extra);
        if (!(c > 0)) throw new Error(`Schreibe die Molarität der Lösung von ${d.s.texto}`);
        d.n = (c * v) / 1000;
        pasos.push({ t: `Mol ${d.s.html}`, html: `In Lösung: n = M · V = ${num(c)} mol/L · ${num(v / 1000)} L = <b>${num(d.n)} mol</b>` });
      } else d.n = v;
    }
    for (const d of dadas) d.r = d.n / d.s.coef;
    const lim = dadas.reduce((a, b) => (b.r < a.r ? b : a));
    if (dadas.length > 1) pasos.push({ t: 'Limitierendes Edukt', html: dadas.map((d) => `${d.s.html}: ${num(d.n)} / ${d.s.coef} = ${num(d.r)}`).join(' · ') + `. Der kleinste ist der von <b>${lim.s.html}</b>: Es ist das limitierende Edukt und wird vollständig verbraucht.` });
    const avance = lim.r;
    let ren = rendimiento / 100, renReal = null;
    if (real && real.i != null && !vacia(real.masa)) {
      const o = E[real.i], mr = leeNum(real.masa);
      if (!o || o.reactivo) throw new Error('Die Ausbeute wird mit der erhaltenen Masse eines Produkts berechnet');
      if (!(mr > 0)) throw new Error('Die erhaltene Masse muss eine positive Zahl sein');
      const teo = o.coef * avance * o.M;
      ren = mr / teo; renReal = 100 * ren;
      pasos.push({ t: 'Ausbeute', html: `Theoretisch entstehen ${num(o.coef * avance)} mol · ${num(o.M)} g/mol = ${num(teo)} g ${o.html}; erhalten wurden ${num(mr)} g: Ausbeute = 100 · ${num(mr)} / ${num(teo)} = <b>${num(renReal)} %</b>${renReal > 100 ? '. Es ergeben sich mehr als 100 %: Das Produkt war feucht oder verunreinigt, oder ein Wert ist falsch' : ''}` });
    }
    const res = E.map((s, i) => {
      const o = { ...s, i };
      if (s.reactivo) {
        o.gastado = s.coef * avance;
        const d = dadas.find((x) => x.i === i);
        if (d) { o.inicial = d.n; o.sobra = Math.max(0, d.n - o.gastado); }
      } else { o.formado = s.coef * avance * ren; o.masa = o.formado * s.M; if (s.estado === 'g') o.volumen = o.formado * Vm; }
      return o;
    });
    for (const o of res) {
      if (o.electron) continue;
      if (!o.reactivo) pasos.push({ t: `Gebildetes ${o.html}`, html: `n = ${num(lim.n)} mol ${lim.s.html} · ${o.coef} / ${lim.s.coef}${ren !== 1 ? ` · ${num(100 * ren)} %` : ''} = <b>${num(o.formado)} mol</b> ⇒ m = n · M = ${num(o.formado)} · ${num(o.M)} = <b>${num(o.masa)} g</b>${o.volumen ? ` und, da es ein Gas ist, V = n · V<sub>m</sub> = ${num(o.formado)} · ${num(Vm)} = <b>${num(o.volumen)} L</b>` : ''}` });
      else if (o.inicial !== undefined && o !== res[lim.i] && o.sobra > 0) pasos.push({ t: `Übrig bleibendes ${o.html}`, html: `Es reagieren ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = ${num(o.gastado)} mol von den ${num(o.inicial)} mol: Es bleiben <b>${num(o.sobra)} mol = ${num(o.sobra * o.M)} g</b> übrig.` });
      else if (o.inicial === undefined && o.reactivo) pasos.push({ t: `${o.html} necesario`, html: `n = ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = <b>${num(o.gastado)} mol = ${num(o.gastado * o.M)} g</b>` });
    }
    const filaT = (o) => {
      const ini = o.reactivo ? o.inicial : 0, cam = o.reactivo ? -o.gastado : o.formado;
      return `<tr><td>${o.html}</td><td>${ini === undefined ? '—' : num(ini)}</td><td>${num(cam)}</td><td>${ini === undefined ? '—' : num(Math.max(0, ini + cam))}</td></tr>`;
    };
    pasos.push({ t: 'Mol am Anfang, Änderung und am Ende', html: `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>Spezies</th><th>Anfang (mol)</th><th>Änderung (mol)</th><th>Ende (mol)</th></tr></thead><tbody>${res.filter((o) => !o.electron).map(filaT).join('')}</tbody></table></div>` });
    return { ajuste: aj, especies: res, limitante: lim.i, varios: dadas.length > 1, rendimiento: 100 * ren, renReal, Vm, pasos };
  }

  function empirica(sc) {
    const modo = sc.modo || 'iupac', pasos = [], A = (e) => masaDe(e, modo);
    let gramos; // gramos de cada elemento en la muestra (o en 100 g)
    if (sc.tipo === 'combustion') {
      const m = leeNum(sc.muestra), co2 = leeNum(sc.co2), h2o = leeNum(sc.h2o);
      if (!(m > 0)) throw new Error('Schreibe die Masse der verbrannten Probe');
      if (!(co2 >= 0) || !(h2o >= 0) || co2 + h2o === 0) throw new Error('Schreibe die Gramm CO2 und H2O, die aufgefangen werden');
      const Mco2 = A('C') + 2 * A('O'), Mh2o = 2 * A('H') + A('O');
      const gC = (co2 * A('C')) / Mco2, gH = (h2o * 2 * A('H')) / Mh2o, gO = m - gC - gH;
      if (gO < -0.005 * m) throw new Error(`Kohlenstoff und Wasserstoff (${num(gC + gH)} g) wiegen mehr als die Probe (${num(m)} g): Prüfe die Daten`);
      gramos = { C: gC, H: gH };
      if (gO > 0.005 * m) gramos.O = gO;
      pasos.push({ t: 'Kohlenstoff und Wasserstoff aus der Verbrennung', html: `Der gesamte C landet im CO<sub>2</sub> und der gesamte H im H<sub>2</sub>O: m(C) = ${num(co2)} · ${num(A('C'))} / ${num(Mco2)} = <b>${num(gC)} g</b>, &nbsp; m(H) = ${num(h2o)} · 2 · ${num(A('H'))} / ${num(Mh2o)} = <b>${num(gH)} g</b>` });
      pasos.push({ t: 'Sauerstoff aus der Differenz', html: gramos.O ? `m(O) = ${num(m)} − ${num(gC)} − ${num(gH)} = <b>${num(gO)} g</b>` : `${num(m)} − ${num(gC)} − ${num(gH)} ≈ 0: Die Verbindung enthält keinen Sauerstoff.` });
    } else {
      gramos = {};
      const re = /([A-Z][a-z]?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/g;
      let mt;
      while ((mt = re.exec(String(sc.composicion || '')))) {
        if (!Elementos.porSimbolo[mt[1]]) throw new Error(`„${mt[1]}“ ist kein Elementsymbol`);
        gramos[mt[1]] = (gramos[mt[1]] || 0) + +mt[2].replace(',', '.');
      }
      const k = Object.keys(gramos);
      if (k.length < 2) throw new Error('Schreibe mindestens zwei Elemente mit ihrem Prozentanteil oder ihren Gramm: C 40; H 6,7; O 53,3');
      const suma = k.reduce((t, e) => t + gramos[e], 0);
      pasos.push({ t: 'Rechenbasis', html: sc.unidad === 'g' ? `Ausgangspunkt sind die Gramm jedes Elements (insgesamt ${num(suma)} g).` : `Bei 100 g Verbindung sind die Prozentwerte gleich Gramm.${Math.abs(suma - 100) > 0.5 ? ` Die Prozentwerte ergeben ${num(suma)} %, nicht 100: Prüfe, ob ein Element fehlt.` : ''}` });
    }
    const els = Object.keys(gramos), n = Object.fromEntries(els.map((e) => [e, gramos[e] / A(e)]));
    pasos.push({ t: 'Mol jedes Elements', html: els.map((e) => `n(${e}) = ${num(gramos[e])} / ${num(A(e))} = ${num(n[e])} mol`).join(' &nbsp; ') });
    const min = Math.min(...els.map((e) => n[e])), rel = Object.fromEntries(els.map((e) => [e, n[e] / min]));
    pasos.push({ t: 'Teilen durch den kleinsten Wert', html: els.map((e) => `${e}: ${num(n[e])} / ${num(min)} = ${num(rel[e], 3)}`).join(' &nbsp; ') });
    let fac = 1;
    for (let k = 1; k <= 8; k++) if (els.every((e) => Math.abs(rel[e] * k - Math.round(rel[e] * k)) < 0.1 * k ** 0.5 / 1.2)) { fac = k; break; } else if (k === 8) fac = 0;
    if (!fac) throw new Error('Die Verhältnisse ergeben keine kleinen ganzen Zahlen: Prüfe die Daten (runde mit mehr Stellen)');
    const sub = Object.fromEntries(els.map((e) => [e, Math.round(rel[e] * fac)]));
    if (fac > 1) pasos.push({ t: 'Ganze Zahlen', html: `Nicht alle sind ganzzahlig: Multipliziert man mit ${fac}, ergibt sich ${els.map((e) => `${e} ${num(rel[e] * fac, 3)} ≈ ${sub[e]}`).join(', ')}.` });
    const en = (e) => Elementos.porSimbolo[e].en ?? 4;
    const orden = els.includes('C') ? ['C', 'H', ...els.filter((e) => e !== 'C' && e !== 'H').sort()].filter((e) => els.includes(e)) : [...els].sort((x, y) => en(x) - en(y));
    const formula = (k) => orden.map((e) => e + (sub[e] * k > 1 ? sub[e] * k : '')).join('');
    const emp = formula(1), Memp = masaMolar(emp, modo).M;
    pasos.push({ t: 'Summenformel', html: `<b class="formula">${html(emp, 0)}</b>, mit M = ${num(Memp)} g/mol` });
    let mol = null, k = null;
    if (!vacia(sc.M)) {
      const M = leeNum(sc.M);
      if (!(M > 0)) throw new Error('Die molare Masse muss eine positive Zahl sein');
      k = Math.round(M / Memp);
      if (k < 1 || Math.abs(M / Memp - k) > 0.08 * k) throw new Error(`Die molare Masse (${num(M)} g/mol) ist kein Vielfaches der empirischen Formel (${num(Memp)} g/mol)`);
      mol = formula(k);
      pasos.push({ t: 'Molekülformel', html: `n = M / M<sub>empirisch</sub> = ${num(M)} / ${num(Memp)} = ${num(M / Memp, 3)} ≈ ${k} ⇒ <b class="formula">${html(mol, 0)}</b>` });
    }
    return { gramos, moles: n, relacion: rel, factor: fac, subindices: sub, empirica: emp, Mempirica: Memp, molecular: mol, k, pasos, html: (f) => html(f, 0) };
  }

  function num(x, cifras = 4) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e6 || a < 1e-3) {
      const [m, e] = x.toExponential(cifras - 1).split('e');
      return `${String(+m).replace('.', ',').replace('-', '−')}·10<sup>${(+e).toString().replace('-', '−')}</sup>`;
    }
    return String(+x.toPrecision(cifras)).replace('.', ',').replace('-', '−');
  }

  const ejemplos = [
    { clave: 'propano', nombre: 'Verbrennung von Propan', ecuacion: 'C3H8 + O2 -> CO2 + H2O', cantidades: [{ valor: 44, unidad: 'g' }, { valor: 100, unidad: 'g' }] },
    { clave: 'alto-horno', nombre: 'Hochofen: Eisenoxid und CO', ecuacion: 'Fe2O3 + CO -> Fe + CO2', cantidades: [{ valor: 1000, unidad: 'g' }, null] },
    { clave: 'aluminio', nombre: 'Aluminium mit Salzsäure', ecuacion: 'Al + HCl -> AlCl3 + H2', cantidades: [{ valor: 5.4, unidad: 'g' }, { valor: 0.5, unidad: 'mol' }] },
    { clave: 'permanganato', nombre: 'Permanganat mit Salzsäure', ecuacion: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O', cantidades: [{ valor: 15.8, unidad: 'g' }, { valor: 100, unidad: 'g' }] },
    { clave: 'cobre-nitrico', nombre: 'Kupfer mit Salpetersäure', ecuacion: 'Cu + HNO3 -> Cu(NO3)2 + NO + H2O', cantidades: [{ valor: 6.35, unidad: 'g' }, { valor: 0.5, unidad: 'mol' }] },
    { clave: 'redox-ionica', nombre: 'Ionen-Redox: Permanganat und Eisen(II)', ecuacion: 'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O', cantidades: [{ valor: 0.02, unidad: 'mol' }, { valor: 0.05, unidad: 'mol' }, { valor: 1, unidad: 'mol' }] },
  ];

  return { leer, separar, masaMolar, ajustar, estequiometria, empirica, num, masaDe, ejemplos, NA, VM, R, vm };
})();

