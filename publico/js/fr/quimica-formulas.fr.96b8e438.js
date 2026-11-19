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
    if (!t) throw new Error('Saisissez une formule');
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
      if (!parte) throw new Error('Il manque une partie de la formule autour du point de l’hydrate');
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
            if (c !== cierre) throw new Error(`Parenthèse mal fermée dans « ${texto} »`);
            i++;
            return at;
          } else if (/[A-Z]/.test(c)) {
            let s = c; i++;
            if (i < cuerpo.length && /[a-z]/.test(cuerpo[i])) { s += cuerpo[i]; i++; }
            if (!Elementos.porSimbolo[s]) throw new Error(`« ${s} » n’est le symbole d’aucun élément`);
            at[s] = (at[s] || 0) + numero();
          } else throw new Error(`Je ne comprends pas « ${c} » dans « ${texto} ». Les symboles commencent par une majuscule : Co est le cobalt, CO est le monoxyde de carbone.`);
        }
        if (cierre) throw new Error(`Il manque une parenthèse fermante dans « ${texto} »`);
        return at;
      };
      const numero = () => { let n = ''; while (i < cuerpo.length && /\d/.test(cuerpo[i])) n += cuerpo[i++]; return n ? +n : 1; };
      const at = grupo(null);
      if (!Object.keys(at).length) throw new Error(`« ${texto} » ne contient aucun élément`);
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
    if (lados.length !== 2) throw new Error('Écrivez la réaction avec une flèche : réactifs -> produits');
    const especies = (lado) => lado.split(/\s\+\s|\s\+(?=\s*[A-Z(\[\d])|(?<=[A-Za-z0-9)\]]|(?<!\^)[+-])(?<!\^)\+(?=\s*(?:\d+\s*)?(?:[A-Z(\[]|e(?![a-z])))/).map((s) => s.trim()).filter(Boolean)
      .map((s) => s.replace(/^\d+\s*(?=[A-Z(\[]|e(?![a-z]))/, '').replace(/^\d+\s+/, '')); // quita los coeficientes que ponga el usuario
    const R = especies(lados[0]), P = especies(lados[1]);
    if (!R.length || !P.length) throw new Error('Il manque un réactif ou un produit');
    return { R, P };
  }

  function ajustar(texto) {
    const { R, P } = separar(texto);
    const sp = [...R, ...P].map((s) => ({ texto: s, ...leer(s) }));
    const els = [...new Set(sp.flatMap((s) => Object.keys(s.atomos)))];
    const filas = els.map((e) => sp.map((s, j) => (j < R.length ? 1 : -1) * (s.atomos[e] || 0)));
    if (sp.some((s) => s.carga)) filas.push(sp.map((s, j) => (j < R.length ? 1 : -1) * s.carga));
    for (const e of els) {
      if (!R.some((s) => leer(s).atomos[e])) throw new Error(`L’élément ${Elementos.porSimbolo[e].nombre.toLowerCase()} (${e}) n’apparaît que dans les produits`);
      if (!P.some((s) => leer(s).atomos[e])) throw new Error(`L’élément ${Elementos.porSimbolo[e].nombre.toLowerCase()} (${e}) n’apparaît que dans les réactifs`);
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
    if (libres.length === 0) throw new Error(`Cette réaction ne peut pas être équilibrée : aucun ensemble de coefficients positifs n’égalise les atomes${els.length ? ' de ' + els.join(', ') : ''}${sp.some((s) => s.carga) ? ' et la charge' : ''}. Il manque souvent une substance (par exemple H₂O, H⁺ ou OH⁻ dans une réaction ionique) ou une formule est mal écrite : vérifiez chaque espèce.`);
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
      throw new Error(`L’équation a ${libres.length} degrés de liberté : elle admet ${libres.length} équilibrages indépendants et donc une infinité d’ensembles de coefficients (ce sont plusieurs réactions ensemble).${ajustes.length ? ' Équilibrages indépendants : ' + ajustes.join('  ·  ') + '.' : ''} Séparez-les en réactions distinctes et équilibrez chacune.`);
    }
    const lib = libres[0], x = Array(n).fill(null);
    x[lib] = fr(1n);
    piv.forEach((c, i) => (x[c] = fr(-A[i][lib][0], A[i][lib][1])));
    const mcm = x.reduce((m, v) => (m * v[1]) / mcd(m, v[1]), 1n);
    let coef = x.map((v) => (v[0] * mcm) / v[1]);
    const g = coef.reduce((a, b) => mcd(a, b));
    coef = coef.map((c) => c / g);
    if (coef.some((c) => c === 0n)) throw new Error('Une espèce n’intervient pas dans la réaction équilibrée : elle est en trop dans l’équation');
    if (coef.some((c) => (c > 0n) !== (coef[0] > 0n))) throw new Error('Il n’y a pas d’équilibrage avec tous les coefficients positifs : vérifiez ce qui est réactif et ce qui est produit');
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
    const gas = cn ? 'gaz dans les conditions normales, 22,4 L/mol' : `gaz parfait à ${num(T)} K et ${num(P)} atm : V<sub>m</sub> = RT/P = 0,082 · ${num(T)} / ${num(P)} = ${num(Vm)} L/mol`;
    const dadas = E.map((s, i) => ({ s, i, q: cantidades[i] })).filter((d) => d.s.reactivo && d.q && !vacia(d.q.valor));
    if (!dadas.length) throw new Error('Saisissez la quantité d’au moins un réactif');
    for (const d of dadas) {
      const v = leeNum(d.q.valor);
      if (!isFinite(v) || v <= 0) throw new Error(`La quantité de ${d.s.texto} doit être un nombre positif`);
      d.v = v;
      if (d.q.unidad === 'g') {
        const p = vacia(d.q.extra) ? 100 : leeNum(d.q.extra);
        if (!(p > 0 && p <= 100)) throw new Error(`La pureté de ${d.s.texto} doit être comprise entre 0 et 100 %`);
        const mp = (v * p) / 100;
        d.n = mp / d.s.M;
        pasos.push({ t: `Moles de ${d.s.html}`, html: `${p < 100 ? `Seulement ${num(p)} % est du ${d.s.html} pur : m = ${num(v)} · ${num(p)} / 100 = ${num(mp)} g. ` : ''}n = m / M = ${num(mp)} g / ${num(d.s.M)} g/mol = <b>${num(d.n)} mol</b>` });
      } else if (d.q.unidad === 'L') { d.n = v / Vm; pasos.push({ t: `Moles de ${d.s.html}`, html: `n = V / V<sub>m</sub> = ${num(v)} L / ${num(Vm)} L/mol = <b>${num(d.n)} mol</b> (${gas})` }); }
      else if (d.q.unidad === 'disol') {
        const c = leeNum(d.q.extra);
        if (!(c > 0)) throw new Error(`Saisissez la molarité de la solution de ${d.s.texto}`);
        d.n = (c * v) / 1000;
        pasos.push({ t: `Moles de ${d.s.html}`, html: `En solution : n = M · V = ${num(c)} mol/L · ${num(v / 1000)} L = <b>${num(d.n)} mol</b>` });
      } else d.n = v;
    }
    for (const d of dadas) d.r = d.n / d.s.coef;
    const lim = dadas.reduce((a, b) => (b.r < a.r ? b : a));
    if (dadas.length > 1) pasos.push({ t: 'Réactif limitant', html: dadas.map((d) => `${d.s.html}: ${num(d.n)} / ${d.s.coef} = ${num(d.r)}`).join(' · ') + `. Le plus petit est celui de <b>${lim.s.html}</b> : c’est le réactif limitant et il est entièrement consommé.` });
    const avance = lim.r;
    let ren = rendimiento / 100, renReal = null;
    if (real && real.i != null && !vacia(real.masa)) {
      const o = E[real.i], mr = leeNum(real.masa);
      if (!o || o.reactivo) throw new Error('Le rendement se calcule avec la masse obtenue d’un produit');
      if (!(mr > 0)) throw new Error('La masse obtenue doit être un nombre positif');
      const teo = o.coef * avance * o.M;
      ren = mr / teo; renReal = 100 * ren;
      pasos.push({ t: 'Rendement', html: `Théoriquement, il se forme ${num(o.coef * avance)} mol · ${num(o.M)} g/mol = ${num(teo)} g de ${o.html} ; on en a obtenu ${num(mr)} g : rendement = 100 · ${num(mr)} / ${num(teo)} = <b>${num(renReal)} %</b>${renReal > 100 ? '. On obtient plus de 100 % : le produit était humide ou impur, ou une donnée est erronée' : ''}` });
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
      if (!o.reactivo) pasos.push({ t: `${o.html} formé`, html: `n = ${num(lim.n)} mol de ${lim.s.html} · ${o.coef} / ${lim.s.coef}${ren !== 1 ? ` · ${num(100 * ren)} %` : ''} = <b>${num(o.formado)} mol</b> ⇒ m = n · M = ${num(o.formado)} · ${num(o.M)} = <b>${num(o.masa)} g</b>${o.volumen ? ` et, comme c’est un gaz, V = n · V<sub>m</sub> = ${num(o.formado)} · ${num(Vm)} = <b>${num(o.volumen)} L</b>` : ''}` });
      else if (o.inicial !== undefined && o !== res[lim.i] && o.sobra > 0) pasos.push({ t: `${o.html} restant`, html: `Il réagit ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = ${num(o.gastado)} mol sur les ${num(o.inicial)} mol : il reste <b>${num(o.sobra)} mol = ${num(o.sobra * o.M)} g</b>.` });
      else if (o.inicial === undefined && o.reactivo) pasos.push({ t: `${o.html} necesario`, html: `n = ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = <b>${num(o.gastado)} mol = ${num(o.gastado * o.M)} g</b>` });
    }
    const filaT = (o) => {
      const ini = o.reactivo ? o.inicial : 0, cam = o.reactivo ? -o.gastado : o.formado;
      return `<tr><td>${o.html}</td><td>${ini === undefined ? '—' : num(ini)}</td><td>${num(cam)}</td><td>${ini === undefined ? '—' : num(Math.max(0, ini + cam))}</td></tr>`;
    };
    pasos.push({ t: 'Moles au début, ce qui change et à la fin', html: `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>Espèce</th><th>Initial (mol)</th><th>Variation (mol)</th><th>Final (mol)</th></tr></thead><tbody>${res.filter((o) => !o.electron).map(filaT).join('')}</tbody></table></div>` });
    return { ajuste: aj, especies: res, limitante: lim.i, varios: dadas.length > 1, rendimiento: 100 * ren, renReal, Vm, pasos };
  }

  function empirica(sc) {
    const modo = sc.modo || 'iupac', pasos = [], A = (e) => masaDe(e, modo);
    let gramos; // gramos de cada elemento en la muestra (o en 100 g)
    if (sc.tipo === 'combustion') {
      const m = leeNum(sc.muestra), co2 = leeNum(sc.co2), h2o = leeNum(sc.h2o);
      if (!(m > 0)) throw new Error('Saisissez la masse de l’échantillon brûlé');
      if (!(co2 >= 0) || !(h2o >= 0) || co2 + h2o === 0) throw new Error('Saisissez les grammes de CO2 et de H2O recueillis');
      const Mco2 = A('C') + 2 * A('O'), Mh2o = 2 * A('H') + A('O');
      const gC = (co2 * A('C')) / Mco2, gH = (h2o * 2 * A('H')) / Mh2o, gO = m - gC - gH;
      if (gO < -0.005 * m) throw new Error(`Le carbone et l’hydrogène (${num(gC + gH)} g) pèsent plus que l’échantillon (${num(m)} g) : vérifiez les données`);
      gramos = { C: gC, H: gH };
      if (gO > 0.005 * m) gramos.O = gO;
      pasos.push({ t: 'Carbone et hydrogène de la combustion', html: `Tout le C finit dans le CO<sub>2</sub> et tout le H dans le H<sub>2</sub>O : m(C) = ${num(co2)} · ${num(A('C'))} / ${num(Mco2)} = <b>${num(gC)} g</b>, &nbsp; m(H) = ${num(h2o)} · 2 · ${num(A('H'))} / ${num(Mh2o)} = <b>${num(gH)} g</b>` });
      pasos.push({ t: 'Oxygène par différence', html: gramos.O ? `m(O) = ${num(m)} − ${num(gC)} − ${num(gH)} = <b>${num(gO)} g</b>` : `${num(m)} − ${num(gC)} − ${num(gH)} ≈ 0 : le composé ne contient pas d’oxygène.` });
    } else {
      gramos = {};
      const re = /([A-Z][a-z]?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/g;
      let mt;
      while ((mt = re.exec(String(sc.composicion || '')))) {
        if (!Elementos.porSimbolo[mt[1]]) throw new Error(`« ${mt[1]} » n’est le symbole d’aucun élément`);
        gramos[mt[1]] = (gramos[mt[1]] || 0) + +mt[2].replace(',', '.');
      }
      const k = Object.keys(gramos);
      if (k.length < 2) throw new Error('Saisissez au moins deux éléments avec leur pourcentage ou leurs grammes : C 40; H 6,7; O 53,3');
      const suma = k.reduce((t, e) => t + gramos[e], 0);
      pasos.push({ t: 'Base de calcul', html: sc.unidad === 'g' ? `On part des grammes de chaque élément (${num(suma)} g au total).` : `Avec 100 g de composé, chaque pourcentage vaut des grammes.${Math.abs(suma - 100) > 0.5 ? ` Les pourcentages totalisent ${num(suma)} %, pas 100 : vérifiez s’il manque un élément.` : ''}` });
    }
    const els = Object.keys(gramos), n = Object.fromEntries(els.map((e) => [e, gramos[e] / A(e)]));
    pasos.push({ t: 'Moles de chaque élément', html: els.map((e) => `n(${e}) = ${num(gramos[e])} / ${num(A(e))} = ${num(n[e])} mol`).join(' &nbsp; ') });
    const min = Math.min(...els.map((e) => n[e])), rel = Object.fromEntries(els.map((e) => [e, n[e] / min]));
    pasos.push({ t: 'On divise par le plus petit', html: els.map((e) => `${e}: ${num(n[e])} / ${num(min)} = ${num(rel[e], 3)}`).join(' &nbsp; ') });
    let fac = 1;
    for (let k = 1; k <= 8; k++) if (els.every((e) => Math.abs(rel[e] * k - Math.round(rel[e] * k)) < 0.1 * k ** 0.5 / 1.2)) { fac = k; break; } else if (k === 8) fac = 0;
    if (!fac) throw new Error('Les proportions ne donnent pas de petits nombres entiers : vérifiez les données (arrondissez avec plus de chiffres)');
    const sub = Object.fromEntries(els.map((e) => [e, Math.round(rel[e] * fac)]));
    if (fac > 1) pasos.push({ t: 'Nombres entiers', html: `Tous ne sont pas entiers : en multipliant par ${fac}, ${els.map((e) => `${e} ${num(rel[e] * fac, 3)} ≈ ${sub[e]}`).join(', ')}.` });
    const en = (e) => Elementos.porSimbolo[e].en ?? 4;
    const orden = els.includes('C') ? ['C', 'H', ...els.filter((e) => e !== 'C' && e !== 'H').sort()].filter((e) => els.includes(e)) : [...els].sort((x, y) => en(x) - en(y));
    const formula = (k) => orden.map((e) => e + (sub[e] * k > 1 ? sub[e] * k : '')).join('');
    const emp = formula(1), Memp = masaMolar(emp, modo).M;
    pasos.push({ t: 'Formule empirique', html: `<b class="formula">${html(emp, 0)}</b>, avec M = ${num(Memp)} g/mol` });
    let mol = null, k = null;
    if (!vacia(sc.M)) {
      const M = leeNum(sc.M);
      if (!(M > 0)) throw new Error('La masse molaire doit être un nombre positif');
      k = Math.round(M / Memp);
      if (k < 1 || Math.abs(M / Memp - k) > 0.08 * k) throw new Error(`La masse molaire (${num(M)} g/mol) n’est pas un multiple de celle de la formule brute (${num(Memp)} g/mol)`);
      mol = formula(k);
      pasos.push({ t: 'Formule moléculaire', html: `n = M / M<sub>brute</sub> = ${num(M)} / ${num(Memp)} = ${num(M / Memp, 3)} ≈ ${k} ⇒ <b class="formula">${html(mol, 0)}</b>` });
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
    { clave: 'propano', nombre: 'Combustion du propane', ecuacion: 'C3H8 + O2 -> CO2 + H2O', cantidades: [{ valor: 44, unidad: 'g' }, { valor: 100, unidad: 'g' }] },
    { clave: 'alto-horno', nombre: 'Haut fourneau : oxyde de fer et CO', ecuacion: 'Fe2O3 + CO -> Fe + CO2', cantidades: [{ valor: 1000, unidad: 'g' }, null] },
    { clave: 'aluminio', nombre: 'Aluminium avec acide chlorhydrique', ecuacion: 'Al + HCl -> AlCl3 + H2', cantidades: [{ valor: 5.4, unidad: 'g' }, { valor: 0.5, unidad: 'mol' }] },
    { clave: 'permanganato', nombre: 'Permanganate avec acide chlorhydrique', ecuacion: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O', cantidades: [{ valor: 15.8, unidad: 'g' }, { valor: 100, unidad: 'g' }] },
    { clave: 'cobre-nitrico', nombre: 'Cuivre avec acide nitrique', ecuacion: 'Cu + HNO3 -> Cu(NO3)2 + NO + H2O', cantidades: [{ valor: 6.35, unidad: 'g' }, { valor: 0.5, unidad: 'mol' }] },
    { clave: 'redox-ionica', nombre: 'Redox ionique : permanganate et fer(II)', ecuacion: 'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O', cantidades: [{ valor: 0.02, unidad: 'mol' }, { valor: 0.05, unidad: 'mol' }, { valor: 1, unidad: 'mol' }] },
  ];

  return { leer, separar, masaMolar, ajustar, estequiometria, empirica, num, masaDe, ejemplos, NA, VM, R, vm };
})();

