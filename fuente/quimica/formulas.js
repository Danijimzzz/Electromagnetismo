/* =====================================================================
   Fórmulas químicas (sin DOM): lectura de fórmulas con paréntesis, hidratos
   y cargas, masa molar, ajuste de ecuaciones y estequiometría con reactivo
   limitante. Usa Elementos (elementos.js) para las masas atómicas.
   ===================================================================== */
const Formulas = (() => {
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  const NA = 6.02214076e23, VM = 22.4; // L/mol en condiciones normales (0 °C, 1 atm)
  const R = 0.082; // atm·L/(mol·K), el de clase
  // volumen molar de un gas ideal: 22,4 L/mol en condiciones normales y RT/P en las demás
  const vm = (T = 273.15, P = 1) => (Math.abs(T - 273.15) < 1e-9 && Math.abs(P - 1) < 1e-12 ? VM : (R * T) / P);
  const ME = 5.48579909e-4; // masa molar del electrón (g/mol), para las semirreacciones

  // masas «de clase»: enteras salvo las que se suelen dar con medio
  const MEDIAS = { Cl: 35.5, Cu: 63.5 };
  const masaDe = (sim, modo) => {
    const e = Elementos.porSimbolo[sim];
    if (modo === 'redondeadas') return MEDIAS[sim] ?? Math.round(e.masa);
    return e.masa;
  };

  /* ---------- Lectura de una fórmula ---------- */
  // Devuelve { atomos: {símbolo: n}, carga, estado, html }. Es el lector de fórmulas de todas las
  // herramientas de química. Admite H2O, Ca(OH)2, K4[Fe(CN)6], CuSO4·5H2O (también con * o .),
  // estados (s), (l), (g), (aq), cargas con ^ (SO4^2-, Fe^3+), sin ^ (Fe3+, NO3-, SO42-, SO4 2-),
  // subíndices y superíndices Unicode y el electrón e^- de las semirreacciones.
  const ESTADOS = { s: 's', l: 'l', g: 'g', aq: 'aq', ac: 'aq', dis: 'aq' };
  function leer(texto) {
    let t = String(texto).trim().replace(/[₀-₉]/g, (c) => SUB[c]).replace(/[⁰¹²³⁴-⁹⁺⁻]/g, (c) => SUP[c]).replace(/[−–]/g, '-');
    if (!t) throw new Error('Escribe una fórmula');
    let estado = null;
    const me = t.match(/\s*\((s|l|g|aq|ac|dis)\)$/i);
    if (me) { estado = ESTADOS[me[1].toLowerCase()]; t = t.slice(0, me.index).trim(); }
    // carga al final: ^2-, ^+, ^3+, ^-2; separada por un espacio (SO4 2-); o pegada (Fe3+, NO3-, SO42-)
    let carga = 0;
    const mc = t.match(/\^\(?(\d*)([+-])(\d*)\)?$/) || t.match(/\s+(\d*)([+-])$/);
    if (mc) { carga = (mc[2] === '+' ? 1 : -1) * (+(mc[1] || mc[3] || 1)); t = t.slice(0, mc.index); }
    else {
      const mp = t.match(/(\d*)([+-])$/);
      if (mp) {
        const cuerpo = t.slice(0, mp.index), dig = mp[1];
        // una sola cifra pegada a un ion de varios elementos es su subíndice (NO3-, NH4+); con dos cifras
        // la última es la carga (SO42-, PO43-); en un ion de un solo elemento, la carga (Fe3+, O2-)
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
    return { atomos, carga, estado, html: html(t, carga) + (estado ? `<small class="estado">(${estado})</small>` : '') };
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
    if (f.electron) return { ...f, M: ME, filas: [] };
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
    const t = String(texto).replace(/<-+>|<=+>|⇌|⇄|↔|⟷|⟶|⇒|→|=>|-+>|=/g, '→');
    const lados = t.split('→');
    if (lados.length !== 2) throw new Error('Escribe la reacción con una flecha: reactivos -> productos');
    // las especies se separan con « + » (con espacios); un + pegado es una carga
    // un + pegado también separa si va detrás de una fórmula o de una carga y delante de otra fórmula (CH4+O2, Na++Cl-)
    const especies = (lado) => lado.split(/\s\+\s|\s\+(?=\s*[A-Z(\[\d])|(?<=[A-Za-z0-9)\]]|(?<!\^)[+-])(?<!\^)\+(?=\s*(?:\d+\s*)?(?:[A-Z(\[]|e(?![a-z])))/).map((s) => s.trim()).filter(Boolean)
      .map((s) => s.replace(/^\d+\s*(?=[A-Z(\[]|e(?![a-z]))/, '').replace(/^\d+\s+/, '')); // quita los coeficientes que ponga el usuario
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
  // cantidades: lista paralela a las especies con { valor, unidad, extra } o null. Unidades:
  //   'g' (extra: pureza en %, opcional), 'mol', 'L' (gas a T y P) y 'disol' (valor en mL, extra: molaridad)
  // opciones: modo de masas, rendimiento (%), T (K) y P (atm) de los gases, real: { i, masa } para sacar el rendimiento
  const leeNum = (v) => +String(v ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?\(?([+\-−]?\d+)\)?/i, 'e$1').replace('−', '-');
  const vacia = (v) => v === '' || v == null || String(v).trim() === '';
  function estequiometria(texto, cantidades, { modo = 'iupac', rendimiento = 100, T = 273.15, P = 1, real = null } = {}) {
    const aj = ajustar(texto);
    const E = aj.especies.map((s) => ({ ...s, M: masaMolar(s.texto, modo).M, estado: leer(s.texto).estado }));
    const pasos = [], Vm = vm(T, P), cn = Vm === VM;
    const gas = cn ? 'gas en condiciones normales, 22,4 L/mol' : `gas ideal a ${num(T)} K y ${num(P)} atm: V<sub>m</sub> = RT/P = 0,082 · ${num(T)} / ${num(P)} = ${num(Vm)} L/mol`;
    const dadas = E.map((s, i) => ({ s, i, q: cantidades[i] })).filter((d) => d.s.reactivo && d.q && !vacia(d.q.valor));
    if (!dadas.length) throw new Error('Escribe la cantidad de al menos un reactivo');
    for (const d of dadas) {
      const v = leeNum(d.q.valor);
      if (!isFinite(v) || v <= 0) throw new Error(`La cantidad de ${d.s.texto} debe ser un número positivo`);
      d.v = v;
      if (d.q.unidad === 'g') {
        const p = vacia(d.q.extra) ? 100 : leeNum(d.q.extra);
        if (!(p > 0 && p <= 100)) throw new Error(`La pureza de ${d.s.texto} tiene que estar entre 0 y 100 %`);
        const mp = (v * p) / 100;
        d.n = mp / d.s.M;
        pasos.push({ t: `Moles de ${d.s.html}`, html: `${p < 100 ? `Solo el ${num(p)} % es ${d.s.html} puro: m = ${num(v)} · ${num(p)} / 100 = ${num(mp)} g. ` : ''}n = m / M = ${num(mp)} g / ${num(d.s.M)} g/mol = <b>${num(d.n)} mol</b>` });
      } else if (d.q.unidad === 'L') { d.n = v / Vm; pasos.push({ t: `Moles de ${d.s.html}`, html: `n = V / V<sub>m</sub> = ${num(v)} L / ${num(Vm)} L/mol = <b>${num(d.n)} mol</b> (${gas})` }); }
      else if (d.q.unidad === 'disol') {
        const c = leeNum(d.q.extra);
        if (!(c > 0)) throw new Error(`Escribe la molaridad de la disolución de ${d.s.texto}`);
        d.n = (c * v) / 1000;
        pasos.push({ t: `Moles de ${d.s.html}`, html: `En disolución: n = M · V = ${num(c)} mol/L · ${num(v / 1000)} L = <b>${num(d.n)} mol</b>` });
      } else d.n = v;
    }
    // reactivo limitante: el menor n / coeficiente
    for (const d of dadas) d.r = d.n / d.s.coef;
    const lim = dadas.reduce((a, b) => (b.r < a.r ? b : a));
    if (dadas.length > 1) pasos.push({ t: 'Reactivo limitante', html: dadas.map((d) => `${d.s.html}: ${num(d.n)} / ${d.s.coef} = ${num(d.r)}`).join(' · ') + `. El menor es el de <b>${lim.s.html}</b>: es el reactivo limitante y se consume entero.` });
    const avance = lim.r;
    // rendimiento: el dado, o el que sale de la masa obtenida de verdad
    let ren = rendimiento / 100, renReal = null;
    if (real && real.i != null && !vacia(real.masa)) {
      const o = E[real.i], mr = leeNum(real.masa);
      if (!o || o.reactivo) throw new Error('El rendimiento se calcula con la masa obtenida de un producto');
      if (!(mr > 0)) throw new Error('La masa obtenida tiene que ser un número positivo');
      const teo = o.coef * avance * o.M;
      ren = mr / teo; renReal = 100 * ren;
      pasos.push({ t: 'Rendimiento', html: `Teóricamente se forman ${num(o.coef * avance)} mol · ${num(o.M)} g/mol = ${num(teo)} g de ${o.html}; se han obtenido ${num(mr)} g: rendimiento = 100 · ${num(mr)} / ${num(teo)} = <b>${num(renReal)} %</b>${renReal > 100 ? '. Sale más del 100 %: el producto estaba húmedo o impuro, o hay un dato mal' : ''}` });
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
      if (!o.reactivo) pasos.push({ t: `${o.html} que se forma`, html: `n = ${num(lim.n)} mol de ${lim.s.html} · ${o.coef} / ${lim.s.coef}${ren !== 1 ? ` · ${num(100 * ren)} %` : ''} = <b>${num(o.formado)} mol</b> ⇒ m = n · M = ${num(o.formado)} · ${num(o.M)} = <b>${num(o.masa)} g</b>${o.volumen ? ` y, como es un gas, V = n · V<sub>m</sub> = ${num(o.formado)} · ${num(Vm)} = <b>${num(o.volumen)} L</b>` : ''}` });
      else if (o.inicial !== undefined && o !== res[lim.i] && o.sobra > 0) pasos.push({ t: `${o.html} que sobra`, html: `Reaccionan ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = ${num(o.gastado)} mol de los ${num(o.inicial)} mol: sobran <b>${num(o.sobra)} mol = ${num(o.sobra * o.M)} g</b>.` });
      else if (o.inicial === undefined && o.reactivo) pasos.push({ t: `${o.html} necesario`, html: `n = ${num(lim.n)} · ${o.coef} / ${lim.s.coef} = <b>${num(o.gastado)} mol = ${num(o.gastado * o.M)} g</b>` });
    }
    // tabla de moles al principio, lo que cambia y al final
    const filaT = (o) => {
      const ini = o.reactivo ? o.inicial : 0, cam = o.reactivo ? -o.gastado : o.formado;
      return `<tr><td>${o.html}</td><td>${ini === undefined ? '—' : num(ini)}</td><td>${num(cam)}</td><td>${ini === undefined ? '—' : num(Math.max(0, ini + cam))}</td></tr>`;
    };
    pasos.push({ t: 'Moles al principio, lo que cambia y al final', html: `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>Especie</th><th>Inicial (mol)</th><th>Cambio (mol)</th><th>Final (mol)</th></tr></thead><tbody>${res.filter((o) => !o.electron).map(filaT).join('')}</tbody></table></div>` });
    return { ajuste: aj, especies: res, limitante: lim.i, varios: dadas.length > 1, rendimiento: 100 * ren, renReal, Vm, pasos };
  }

  /* ---------- Fórmula empírica y molecular ---------- */
  // sc: { tipo: 'composicion' | 'combustion', composicion: 'C 40; H 6,7; O 53,3' (% o g), muestra, co2, h2o (g), M (g/mol, opcional), modo }
  function empirica(sc) {
    const modo = sc.modo || 'iupac', pasos = [], A = (e) => masaDe(e, modo);
    let gramos; // gramos de cada elemento en la muestra (o en 100 g)
    if (sc.tipo === 'combustion') {
      const m = leeNum(sc.muestra), co2 = leeNum(sc.co2), h2o = leeNum(sc.h2o);
      if (!(m > 0)) throw new Error('Escribe la masa de la muestra que se quema');
      if (!(co2 >= 0) || !(h2o >= 0) || co2 + h2o === 0) throw new Error('Escribe los gramos de CO2 y de H2O que se recogen');
      const Mco2 = A('C') + 2 * A('O'), Mh2o = 2 * A('H') + A('O');
      const gC = (co2 * A('C')) / Mco2, gH = (h2o * 2 * A('H')) / Mh2o, gO = m - gC - gH;
      if (gO < -0.005 * m) throw new Error(`El carbono y el hidrógeno (${num(gC + gH)} g) pesan más que la muestra (${num(m)} g): revisa los datos`);
      gramos = { C: gC, H: gH };
      if (gO > 0.005 * m) gramos.O = gO;
      pasos.push({ t: 'Carbono e hidrógeno de la combustión', html: `Todo el C acaba en el CO<sub>2</sub> y todo el H en el H<sub>2</sub>O: m(C) = ${num(co2)} · ${num(A('C'))} / ${num(Mco2)} = <b>${num(gC)} g</b>, &nbsp; m(H) = ${num(h2o)} · 2 · ${num(A('H'))} / ${num(Mh2o)} = <b>${num(gH)} g</b>` });
      pasos.push({ t: 'Oxígeno por diferencia', html: gramos.O ? `m(O) = ${num(m)} − ${num(gC)} − ${num(gH)} = <b>${num(gO)} g</b>` : `${num(m)} − ${num(gC)} − ${num(gH)} ≈ 0: el compuesto no tiene oxígeno.` });
    } else {
      gramos = {};
      const re = /([A-Z][a-z]?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/g;
      let mt;
      while ((mt = re.exec(String(sc.composicion || '')))) {
        if (!Elementos.porSimbolo[mt[1]]) throw new Error(`«${mt[1]}» no es el símbolo de ningún elemento`);
        gramos[mt[1]] = (gramos[mt[1]] || 0) + +mt[2].replace(',', '.');
      }
      const k = Object.keys(gramos);
      if (k.length < 2) throw new Error('Escribe al menos dos elementos con su porcentaje o sus gramos: C 40; H 6,7; O 53,3');
      const suma = k.reduce((t, e) => t + gramos[e], 0);
      pasos.push({ t: 'Base de cálculo', html: sc.unidad === 'g' ? `Se parte de los gramos de cada elemento (${num(suma)} g en total).` : `Con 100 g de compuesto, cada porcentaje son gramos.${Math.abs(suma - 100) > 0.5 ? ` Los porcentajes suman ${num(suma)} %, no 100: revisa si falta algún elemento.` : ''}` });
    }
    const els = Object.keys(gramos), n = Object.fromEntries(els.map((e) => [e, gramos[e] / A(e)]));
    pasos.push({ t: 'Moles de cada elemento', html: els.map((e) => `n(${e}) = ${num(gramos[e])} / ${num(A(e))} = ${num(n[e])} mol`).join(' &nbsp; ') });
    const min = Math.min(...els.map((e) => n[e])), rel = Object.fromEntries(els.map((e) => [e, n[e] / min]));
    pasos.push({ t: 'Se divide entre el menor', html: els.map((e) => `${e}: ${num(n[e])} / ${num(min)} = ${num(rel[e], 3)}`).join(' &nbsp; ') });
    // el menor factor que deja todo en enteros (1,5 → ×2; 1,33 → ×3…)
    let fac = 1;
    for (let k = 1; k <= 8; k++) if (els.every((e) => Math.abs(rel[e] * k - Math.round(rel[e] * k)) < 0.1 * k ** 0.5 / 1.2)) { fac = k; break; } else if (k === 8) fac = 0;
    if (!fac) throw new Error('Las proporciones no dan números enteros pequeños: revisa los datos (redondea con más cifras)');
    const sub = Object.fromEntries(els.map((e) => [e, Math.round(rel[e] * fac)]));
    if (fac > 1) pasos.push({ t: 'Números enteros', html: `No todos salen enteros: multiplicando por ${fac}, ${els.map((e) => `${e} ${num(rel[e] * fac, 3)} ≈ ${sub[e]}`).join(', ')}.` });
    // orgánicos en el orden de Hill (C, H y luego alfabético); inorgánicos de menos a más electronegativo (K2Cr2O7, Fe2O3)
    const en = (e) => Elementos.porSimbolo[e].en ?? 4;
    const orden = els.includes('C') ? ['C', 'H', ...els.filter((e) => e !== 'C' && e !== 'H').sort()].filter((e) => els.includes(e)) : [...els].sort((x, y) => en(x) - en(y));
    const formula = (k) => orden.map((e) => e + (sub[e] * k > 1 ? sub[e] * k : '')).join('');
    const emp = formula(1), Memp = masaMolar(emp, modo).M;
    pasos.push({ t: 'Fórmula empírica', html: `<b class="formula">${html(emp, 0)}</b>, con M = ${num(Memp)} g/mol` });
    let mol = null, k = null;
    if (!vacia(sc.M)) {
      const M = leeNum(sc.M);
      if (!(M > 0)) throw new Error('La masa molar tiene que ser un número positivo');
      k = Math.round(M / Memp);
      if (k < 1 || Math.abs(M / Memp - k) > 0.08 * k) throw new Error(`La masa molar (${num(M)} g/mol) no es un múltiplo de la de la fórmula empírica (${num(Memp)} g/mol)`);
      mol = formula(k);
      pasos.push({ t: 'Fórmula molecular', html: `n = M / M<sub>empírica</sub> = ${num(M)} / ${num(Memp)} = ${num(M / Memp, 3)} ≈ ${k} ⇒ <b class="formula">${html(mol, 0)}</b>` });
    }
    return { gramos, moles: n, relacion: rel, factor: fac, subindices: sub, empirica: emp, Mempirica: Memp, molecular: mol, k, pasos, html: (f) => html(f, 0) };
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

  return { leer, separar, masaMolar, ajustar, estequiometria, empirica, num, masaDe, ejemplos, NA, VM, R, vm };
})();
if (typeof module !== 'undefined') module.exports = Formulas;
