/* =====================================================================
   Fórmulas químicas (sin DOM): lectura de fórmulas con paréntesis, hidratos
   y cargas, masa molar, ajuste de ecuaciones y estequiometría con reactivo
   limitante. Usa Elementos (elementos.js) para las masas atómicas.
   ===================================================================== */
const Formulas = (() => {
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  const NA = 6.02214076e23, VM = 22.4; // L/mol en condiciones normales (0 °C, 1 atm)

  // masas «de clase»: enteras salvo las que se suelen dar con medio
  const MEDIAS = { Cl: 35.5, Cu: 63.5 };
  const masaDe = (sim, modo) => {
    const e = Elementos.porSimbolo[sim];
    if (modo === 'redondeadas') return MEDIAS[sim] ?? Math.round(e.masa);
    return e.masa;
  };

  /* ---------- Lectura de una fórmula ---------- */
  // Devuelve { atomos: {símbolo: n}, carga, html }. Admite H2O, Ca(OH)2, K4[Fe(CN)6],
  // CuSO4·5H2O (también con * o .), SO4^2-, Fe^3+, subíndices y superíndices Unicode.
  function leer(texto) {
    let t = String(texto).trim().replace(/[₀-₉]/g, (c) => SUB[c]).replace(/[⁰-⁹⁺⁻]/g, (c) => SUP[c]).replace(/\s+/g, '');
    if (!t) throw new Error('Escribe una fórmula');
    // carga al final: ^2-, ^+, ^3+, ^-2, o superíndice ya convertido a ^…
    let carga = 0;
    const mc = t.match(/\^(\d*)([+-])(\d*)$/) || t.match(/\^\(?(\d*)([+-])(\d*)\)?$/);
    if (mc) { carga = (mc[2] === '+' ? 1 : -1) * (+(mc[1] || mc[3] || 1)); t = t.slice(0, mc.index); }
    const partes = t.split(/[·*•.]/);
    const atomos = {};
    const suma = (a, b, f) => { for (const [k, v] of Object.entries(b)) a[k] = (a[k] || 0) + v * f; };
    for (const parte of partes) {
      if (!parte) throw new Error('Falta una parte de la fórmula alrededor del punto del hidrato');
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
            if (c !== cierre) throw new Error(`Paréntesis mal cerrado en «${texto}»`);
            i++;
            return at;
          } else if (/[A-Z]/.test(c)) {
            let s = c; i++;
            if (i < cuerpo.length && /[a-z]/.test(cuerpo[i])) { s += cuerpo[i]; i++; }
            if (!Elementos.porSimbolo[s]) throw new Error(`«${s}» no es el símbolo de ningún elemento`);
            at[s] = (at[s] || 0) + numero();
          } else throw new Error(`No entiendo «${c}» en «${texto}». Los símbolos empiezan por mayúscula: Co es cobalto, CO es monóxido de carbono.`);
        }
        if (cierre) throw new Error(`Falta cerrar un paréntesis en «${texto}»`);
        return at;
      };
      const numero = () => { let n = ''; while (i < cuerpo.length && /\d/.test(cuerpo[i])) n += cuerpo[i++]; return n ? +n : 1; };
      const at = grupo(null);
      if (!Object.keys(at).length) throw new Error(`«${texto}» no tiene ningún elemento`);
      suma(atomos, at, coef);
    }
    return { atomos, carga, html: html(t, carga) };
  }
  // H2O → H<sub>2</sub>O, CuSO4·5H2O conserva el coeficiente del hidrato
  function html(t, carga) {
    let h = t.replace(/[*•.]/g, '·').replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
    if (carga) h += `<sup>${Math.abs(carga) > 1 ? Math.abs(carga) : ''}${carga > 0 ? '+' : '−'}</sup>`;
    return h;
  }

  /* ---------- Masa molar ---------- */
  function masaMolar(texto, modo = 'iupac') {
    const f = leer(texto);
    let M = 0;
    const filas = Object.entries(f.atomos).map(([s, n]) => { const a = masaDe(s, modo); M += n * a; return { simbolo: s, nombre: Elementos.porSimbolo[s].nombre, n, masa: a, aporte: n * a }; });
    filas.forEach((r) => (r.porcentaje = (100 * r.aporte) / M));
    return { ...f, M, filas };
  }

  /* ---------- Ajuste de ecuaciones ---------- */
  // fracciones exactas con BigInt para la eliminación gaussiana
  const mcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  const fr = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = mcd(n, d) || 1n; return [n / g, d / g]; };
  const mul = (a, b) => fr(a[0] * b[0], a[1] * b[1]), sub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]), div = (a, b) => fr(a[0] * b[1], a[1] * b[0]);

  function separar(texto) {
    const t = String(texto).replace(/⟶|⇒|→|=>|-+>|=/g, '→');
    const lados = t.split('→');
    if (lados.length !== 2) throw new Error('Escribe la reacción con una flecha: reactivos -> productos');
    // las especies se separan con « + » (con espacios); un + pegado es una carga
    const especies = (lado) => lado.split(/\s\+\s|\s\+(?=\s*[A-Z(\[\d])/).map((s) => s.trim()).filter(Boolean)
      .map((s) => s.replace(/^\d+\s*(?=[A-Z(\[])/, '').replace(/^\d+\s+/, '')); // quita los coeficientes que ponga el usuario
    const R = especies(lados[0]), P = especies(lados[1]);
    if (!R.length || !P.length) throw new Error('Falta algún reactivo o producto');
    return { R, P };
  }

  function ajustar(texto) {
    const { R, P } = separar(texto);
    const sp = [...R, ...P].map((s) => ({ texto: s, ...leer(s) }));
    const els = [...new Set(sp.flatMap((s) => Object.keys(s.atomos)))];
    const filas = els.map((e) => sp.map((s, j) => (j < R.length ? 1 : -1) * (s.atomos[e] || 0)));
    if (sp.some((s) => s.carga)) filas.push(sp.map((s, j) => (j < R.length ? 1 : -1) * s.carga));
    for (const e of els) {
      if (!R.some((s) => leer(s).atomos[e])) throw new Error(`El ${Elementos.porSimbolo[e].nombre.toLowerCase()} (${e}) solo aparece en los productos`);
      if (!P.some((s) => leer(s).atomos[e])) throw new Error(`El ${Elementos.porSimbolo[e].nombre.toLowerCase()} (${e}) solo aparece en los reactivos`);
    }
    // forma escalonada reducida
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
    if (libres.length === 0) throw new Error('Esta reacción no se puede ajustar: revisa las fórmulas');
    if (libres.length > 1) throw new Error('La reacción admite varios ajustes independientes (son dos reacciones juntas). Sepáralas.');
    const lib = libres[0], x = Array(n).fill(null);
    x[lib] = fr(1n);
    piv.forEach((c, i) => (x[c] = fr(-A[i][lib][0], A[i][lib][1])));
    const mcm = x.reduce((m, v) => (m * v[1]) / mcd(m, v[1]), 1n);
    let coef = x.map((v) => (v[0] * mcm) / v[1]);
    const g = coef.reduce((a, b) => mcd(a, b));
    coef = coef.map((c) => c / g);
    if (coef.some((c) => c === 0n)) throw new Error('Alguna especie no interviene en la reacción ajustada: sobra en la ecuación');
    if (coef.some((c) => (c > 0n) !== (coef[0] > 0n))) throw new Error('No hay un ajuste con todos los coeficientes positivos: revisa qué es reactivo y qué es producto');
    if (coef[0] < 0n) coef = coef.map((c) => -c);
    const especies = sp.map((s, j) => ({ texto: s.texto, html: s.html, atomos: s.atomos, carga: s.carga, coef: Number(coef[j]), reactivo: j < R.length }));
    const lado = (L) => L.map((s) => (s.coef > 1 ? s.coef + ' ' : '') + s.html).join(' + ');
    return { especies, html: lado(especies.filter((s) => s.reactivo)) + ' <span class="flecha">→</span> ' + lado(especies.filter((s) => !s.reactivo)) };
  }

  /* ---------- Estequiometría ---------- */
  // cantidades: lista paralela a las especies con { valor, unidad: 'g' | 'mol' | 'L' } o null
  function estequiometria(texto, cantidades, { modo = 'iupac', rendimiento = 100 } = {}) {
    const aj = ajustar(texto);
    const E = aj.especies.map((s) => ({ ...s, M: masaMolar(s.texto, modo).M }));
    const pasos = [];
    const dadas = E.map((s, i) => ({ s, i, q: cantidades[i] })).filter((d) => d.s.reactivo && d.q && d.q.valor !== '' && d.q.valor != null);
    if (!dadas.length) throw new Error('Escribe la cantidad de al menos un reactivo');
    for (const d of dadas) {
      const v = +String(d.q.valor).replace(',', '.');
      if (!isFinite(v) || v <= 0) throw new Error(`La cantidad de ${d.s.texto} debe ser un número positivo`);
      d.v = v;
      if (d.q.unidad === 'g') { d.n = v / d.s.M; pasos.push({ t: `Moles de ${d.s.html}`, html: `n = m / M = ${num(v)} g / ${num(d.s.M)} g/mol = <b>${num(d.n)} mol</b>` }); }
      else if (d.q.unidad === 'L') { d.n = v / VM; pasos.push({ t: `Moles de ${d.s.html}`, html: `n = V / V<sub>m</sub> = ${num(v)} L / 22,4 L/mol = <b>${num(d.n)} mol</b> (gas en condiciones normales)` }); }
      else d.n = v;
    }
    // reactivo limitante: el menor n / coeficiente
    for (const d of dadas) d.r = d.n / d.s.coef;
    const lim = dadas.reduce((a, b) => (b.r < a.r ? b : a));
    if (dadas.length > 1) pasos.push({ t: 'Reactivo limitante', html: dadas.map((d) => `${d.s.html}: ${num(d.n)} / ${d.s.coef} = ${num(d.r)}`).join(' · ') + `. El menor es el de <b>${lim.s.html}</b>: es el reactivo limitante y se consume entero.` });
    const avance = lim.r, ren = rendimiento / 100;
    const res = E.map((s, i) => {
      const o = { ...s, i };
      if (s.reactivo) {
        o.gastado = s.coef * avance;
        const d = dadas.find((x) => x.i === i);
        if (d) { o.inicial = d.n; o.sobra = Math.max(0, d.n - o.gastado); }
      } else { o.formado = s.coef * avance * ren; o.masa = o.formado * s.M; }
      return o;
    });
    for (const o of res) {
      if (!o.reactivo) pasos.push({ t: `${o.html} que se forma`, html: `n = ${num(lim.n)} mol de ${lim.s.html} · ${o.coef} / ${lim.s.coef}${ren !== 1 ? ` · ${num(rendimiento)} %` : ''} = <b>${num(o.formado)} mol</b> ⇒ m = n · M = ${num(o.formado)} · ${num(o.M)} = <b>${num(o.masa)} g</b>` });
      else if (o.inicial !== undefined && o !== res[lim.i] && o.sobra > 0) pasos.push({ t: `${o.html} que sobra`, html: `Reaccionan ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = ${num(o.gastado)} mol de los ${num(o.inicial)} mol: sobran <b>${num(o.sobra)} mol = ${num(o.sobra * o.M)} g</b>.` });
      else if (o.inicial === undefined && o.reactivo) pasos.push({ t: `${o.html} necesario`, html: `n = ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = <b>${num(o.gastado)} mol = ${num(o.gastado * o.M)} g</b>` });
    }
    return { ajuste: aj, especies: res, limitante: lim.i, varios: dadas.length > 1, pasos };
  }

  // número con coma decimal y 4 cifras significativas (notación científica si es muy grande o pequeño)
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
    { clave: 'propano', nombre: 'Combustión del propano', ecuacion: 'C3H8 + O2 -> CO2 + H2O', cantidades: [{ valor: 44, unidad: 'g' }, { valor: 100, unidad: 'g' }] },
    { clave: 'alto-horno', nombre: 'Alto horno: óxido de hierro y CO', ecuacion: 'Fe2O3 + CO -> Fe + CO2', cantidades: [{ valor: 1000, unidad: 'g' }, null] },
    { clave: 'aluminio', nombre: 'Aluminio con ácido clorhídrico', ecuacion: 'Al + HCl -> AlCl3 + H2', cantidades: [{ valor: 5.4, unidad: 'g' }, { valor: 0.5, unidad: 'mol' }] },
    { clave: 'permanganato', nombre: 'Permanganato con ácido clorhídrico', ecuacion: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O', cantidades: [{ valor: 15.8, unidad: 'g' }, { valor: 100, unidad: 'g' }] },
    { clave: 'cobre-nitrico', nombre: 'Cobre con ácido nítrico', ecuacion: 'Cu + HNO3 -> Cu(NO3)2 + NO + H2O', cantidades: [{ valor: 6.35, unidad: 'g' }, { valor: 0.5, unidad: 'mol' }] },
    { clave: 'redox-ionica', nombre: 'Redox iónica: permanganato y hierro(II)', ecuacion: 'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O', cantidades: [{ valor: 0.02, unidad: 'mol' }, { valor: 0.05, unidad: 'mol' }, { valor: 1, unidad: 'mol' }] },
  ];

  return { leer, masaMolar, ajustar, estequiometria, num, masaDe, ejemplos, NA, VM };
})();
if (typeof module !== 'undefined') module.exports = Formulas;
