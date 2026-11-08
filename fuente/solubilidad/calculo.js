/* =====================================================================
   Solubilidad y Kps: cálculo (sin DOM). Sal poco soluble A_aB_b, que se
   disuelve como A_aB_b ⇌ a A + b B, con K_ps = [A]^a [B]^b a 25 °C.
   Cinco modos:
     kps        solubilidad (mol/L o g/L) → Kps
     solub      Kps → solubilidad en agua pura (mol/L y g/L) y concentración de los iones
     comun      solubilidad cuando ya hay en la disolución un ion de la sal (efecto del ion común)
     precipita  mezcla de dos disoluciones: ¿precipita? (Q frente a Kps), y si precipita,
                lo que queda disuelto y la masa de sólido
     selectiva  precipitación fraccionada: dos sales con un ion común que se va añadiendo;
                cuál precipita antes y cuánto queda de la primera al empezar la segunda
   Concentraciones en mol/L, volúmenes en mL, masa molar en g/mol (se saca de la
   fórmula si se escribe y está cargado quimica/formulas.js). Sin actividades:
   disoluciones diluidas y sin otros equilibrios (hidrólisis, complejos).
   Las ecuaciones se resuelven por bisección en escala logarítmica, que sirve
   para cualquier exponente y Kps tan pequeño como el del Fe(OH)₃.
   La interfaz está en solubilidad/app.js y la prueba en pruebas/herramientas/solubilidad.js.
     resolver(sc)  datos del formulario (texto) → { modo, …, pasos }; lanza un Error
                   con un mensaje para el usuario si falta o falla algo
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     SALES         sales de ejemplo [clave, fórmula, a, b, Kps]
     f(x)          número con coma decimal y ·10<sup>n</sup>
   ===================================================================== */
const Solubilidad = (() => {
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, entero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} debe ser un número`);
    if (v <= 0) throw new Error(`${Mayus(nom)} debe ser mayor que 0`);
    if (entero && (!Number.isInteger(v) || v > 6)) throw new Error(`${Mayus(nom)} debe ser un entero de 1 a 6`);
    return v;
  }

  // sales de ejemplo [clave, fórmula, cationes a, aniones b, Kps a 25 °C, catión, anión, ácido conjugado del anión]: quimica/datos.js (QU-1), con su fuente
  const D = typeof Datos !== 'undefined' ? Datos : require('../quimica/datos.js');
  const SALES = D.KPS.map(([c, cat, an, a, b, K, ac]) => [c, c, a, b, K, cat, an, ac]);

  const ns = (n) => (n === 1 ? 's' : `${n} s`);
  const sub = (n) => (n === 1 ? '' : `_{${n}}`), ex = (n) => (n === 1 ? '' : `^{${n}}`);
  const salM = (a, b) => `A${sub(a)}B${sub(b)}`; // la sal genérica, en Mates
  const prod = (a, b) => `[A]${ex(a)}[B]${ex(b)}`; // producto iónico, en Mates

  // masa molar: de M escrita o, si no, de la fórmula (si está cargado quimica/formulas.js)
  function masaM(sc) {
    if (!vacio(sc.M)) return lee(sc, 'M', 'la masa molar');
    if (!vacio(sc.formula) && typeof Formulas !== 'undefined') { try { return Formulas.masaMolar(sc.formula).M; } catch (e) { throw new Error(`La fórmula: ${e.message}`); } }
    return null;
  }
  const nombre = (sc) => (!vacio(sc.formula) && typeof Formulas !== 'undefined' ? (() => { try { return Formulas.leer(sc.formula).html; } catch (e) { return ''; } })() : '');
  const cabecera = (sc, a, b, M) => {
    const nom = nombre(sc);
    return { t: 'La sal y su equilibrio', html: `${nom ? `${nom} es la sal poco soluble. ` : ''}Se escribe como $${salM(a, b)}$ y se disuelve: $${salM(a, b)} ⇌ ${a > 1 ? a + ' ' : ''}A + ${b > 1 ? b + ' ' : ''}B$, con $K_{"ps"} = ${prod(a, b)}$.${M ? ` Masa molar: $M = ${f(M, 4)}$ g/mol.` : ''}` };
  };

  // soluciones numéricas (bisección en escala logarítmica, g creciente en x)
  function biseca(g, lo, hi) { for (let i = 0; i < 300; i++) { const m = Math.sqrt(lo * hi); if (g(m) < 0) lo = m; else hi = m; } return Math.sqrt(lo * hi); }
  const solAgua = (Kps, a, b) => (Kps / (a ** a * b ** b)) ** (1 / (a + b));

  /* ---------- Solubilidad → Kps ---------- */
  function deSolubilidad(sc) {
    const a = lee(sc, 'a', 'el número de cationes', { entero: true }), b = lee(sc, 'b', 'el número de aniones', { entero: true });
    const dato = lee(sc, 's', 'la solubilidad'), enG = sc.uni === 'g', M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    if (enG && !M) throw new Error('Para la solubilidad en g/L hace falta la masa molar (o la fórmula)');
    const s = enG ? dato / M : dato;
    if (enG) pasos.push({ t: 'De g/L a mol/L', html: `$s = {${f(dato)} "g/L"}/{${f(M, 4)} "g/mol"} = ${f(s)} "mol/L"$` });
    const ca = a * s, cb = b * s, Kps = ca ** a * cb ** b;
    pasos.push({ t: 'Concentración de los iones', html: `Cada mol de sal que se disuelve da $${a}$ mol de A y $${b}$ de B: $[A] = ${ns(a)} = ${f(ca)}$ M y $[B] = ${ns(b)} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Producto de solubilidad', html: `$K_{"ps"} = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Kps)}</b>. En general, $K_{"ps"} = ${a ** a * b ** b === 1 ? '' : a ** a * b ** b + ' '}s^{${a + b}}$.` });
    return { modo: 'kps', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  /* ---------- Kps → solubilidad ---------- */
  function deKps(sc) {
    const a = lee(sc, 'a', 'el número de cationes', { entero: true }), b = lee(sc, 'b', 'el número de aniones', { entero: true });
    const Kps = lee(sc, 'Kps', 'el Kps'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s = solAgua(Kps, a, b), ca = a * s, cb = b * s;
    const k = a ** a * b ** b;
    pasos.push({ t: 'Kps en función de la solubilidad', html: `Si se disuelven $s$ mol/L, $[A] = ${a === 1 ? '' : a + ' '}s$ y $[B] = ${b === 1 ? '' : b + ' '}s$, así que $K_{"ps"} = (${a === 1 ? '' : a} s)${ex(a)} (${b === 1 ? '' : b} s)${ex(b)} = ${k === 1 ? '' : k + ' '}s^{${a + b}}$.` });
    pasos.push({ t: 'Despejar la solubilidad', html: `$s = (K_{"ps"}/${k})^{1/${a + b}} = (${f(Kps)}${k === 1 ? '' : '/' + k})^{1/${a + b}}$ = <b>${f(s)} mol/L</b>` });
    pasos.push({ t: 'Concentración de los iones', html: `$[A] = ${f(ca)}$ M y $[B] = ${f(cb)}$ M.` });
    if (M) pasos.push({ t: 'En gramos por litro', html: `$s = ${f(s)} · ${f(M, 4)}$ = <b>${f(s * M)} g/L</b>` });
    return { modo: 'solub', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  /* ---------- Efecto del ion común ---------- */
  function ionComun(sc) {
    const a = lee(sc, 'a', 'el número de cationes', { entero: true }), b = lee(sc, 'b', 'el número de aniones', { entero: true });
    const Kps = lee(sc, 'Kps', 'el Kps'), C = lee(sc, 'C', 'la concentración del ion común'), M = masaM(sc), cat = sc.ion === 'cat', pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b), ion = cat ? 'A' : 'B', otro = cat ? 'B' : 'A', pc = cat ? a : b, po = cat ? b : a;
    const g = (s) => (a * s + (cat ? C : 0)) ** a * (b * s + (cat ? 0 : C)) ** b - Kps;
    const s = g(s0) <= 0 ? s0 : biseca((x) => g(x), s0 * 1e-80, s0);
    pasos.push({ t: 'En agua pura', html: `Sin ion común, $s_{0} = (K_{"ps"}/${a ** a * b ** b})^{1/${a + b}} = ${f(s0)}$ mol/L.` });
    pasos.push({ t: 'Con el ion común', html: `La disolución ya tiene $[${ion}] = ${f(C)}$ M. Si se disuelven $s$ mol/L, $[${ion}] = ${ns(cat ? a : b)} + ${f(C)}$ y $[${otro}] = ${ns(po)}$, así que $K_{"ps"} = ${cat ? `(${ns(a)} + ${f(C)})${ex(a)}(${ns(b)})${ex(b)}` : `(${ns(a)})${ex(a)}(${ns(b)} + ${f(C)})${ex(b)}`}$.` });
    const sap = (Kps / C ** pc) ** (1 / po) / po, err = Math.abs(sap - s) / s;
    pasos.push({ t: 'Aproximación', html: `Como $s$ es mucho menor que $C$, $${pc === 1 ? '' : pc + ' '}s + C ≈ C$ y $K_{"ps"} ≈ C${ex(pc)} · ${po === 1 ? 's' : `(${po} s)${ex(po)}`}$, de donde $s ≈ ${f(sap)}$ mol/L${err < 0.05 ? ` (un ${f(100 * err, 2)} % de diferencia)` : ` (no es buena: difiere un ${f(100 * err, 2)} %)`}.` });
    pasos.push({ t: 'Resultado', html: `Resolviendo la ecuación entera: <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}. Es ${f(s0 / s, 3)} veces menos soluble que en agua pura: el ion común desplaza el equilibrio hacia el sólido.` });
    return { modo: 'comun', a, b, Kps, C, cat, s, s0, g: M ? s * M : null, M, ca: a * s + (cat ? C : 0), cb: b * s + (cat ? 0 : C), factor: s0 / s, pasos };
  }

  /* ---------- ¿Precipita al mezclar? ---------- */
  function precipita(sc) {
    const a = lee(sc, 'a', 'el número de cationes', { entero: true }), b = lee(sc, 'b', 'el número de aniones', { entero: true });
    const Kps = lee(sc, 'Kps', 'el Kps'), c1 = lee(sc, 'c1', 'la concentración del catión'), V1 = lee(sc, 'V1', 'el volumen de la disolución del catión');
    const c2 = lee(sc, 'c2', 'la concentración del anión'), V2 = lee(sc, 'V2', 'el volumen de la disolución del anión'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const Vt = V1 + V2, ca = (c1 * V1) / Vt, cb = (c2 * V2) / Vt, Q = ca ** a * cb ** b, ratio = Q / Kps;
    pasos.push({ t: 'Concentraciones tras mezclar', html: `El volumen total es ${f(V1)} + ${f(V2)} = ${f(Vt)} mL y cada ion se diluye: $[A]_{0} = {${f(c1)} · ${f(V1)}}/{${f(Vt)}} = ${f(ca)}$ M, &ensp; $[B]_{0} = {${f(c2)} · ${f(V2)}}/{${f(Vt)}} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Producto iónico Q', html: `$Q = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Q)}</b>, frente a $K_{"ps"} = ${f(Kps)}$: $Q / K_{"ps"} = ${f(ratio)}$.` });
    const r = { modo: 'precipita', a, b, Kps, ca0: ca, cb0: cb, Q, ratio, Vt, M, pasos, precipita: Q > Kps * (1 + 1e-12) };
    if (!r.precipita) {
      pasos.push({ t: 'Conclusión', html: `${Q < Kps ? '$Q < K_{"ps"}$: la disolución no está saturada' : '$Q = K_{"ps"}$: justo saturada'}, <b>no precipita</b> y todo queda disuelto.` });
    } else {
      pasos.push({ t: 'Conclusión', html: `$Q > K_{"ps"}$: la disolución está sobresaturada y <b>precipita</b> sal hasta que el producto iónico vuelva a valer $K_{"ps"}$.` });
      // el ion limitante queda en y; el otro, por la estequiometría de lo que precipita
      const ea = ca / a, eb = cb / b; // moles de sal que cabrían por litro con cada ion
      const limA = ea <= eb, e = limA ? eb - ea : ea - eb;
      const quedaA = (y) => (limA ? y : a * (y / b + e)), quedaB = (y) => (limA ? b * (y / a + e) : y);
      const hi = limA ? ca : cb, y = biseca((v) => quedaA(v) ** a * quedaB(v) ** b - Kps, hi * 1e-80, hi);
      const cA = quedaA(y), cB = quedaB(y), x = (ca - cA) / a, mol = (x * Vt) / 1000;
      pasos.push({ t: 'Lo que precipita', html: `Si precipitan $x$ mol/L de sal, quedan $[A] = ${f(ca)} − ${a === 1 ? '' : a + ' '}x$ y $[B] = ${f(cb)} − ${b === 1 ? '' : b + ' '}x$. Se impone $(${f(ca)} − ${a === 1 ? '' : a + ' '}x)${ex(a)} (${f(cb)} − ${b === 1 ? '' : b + ' '}x)${ex(b)} = ${f(Kps)}$ y se resuelve numéricamente: $x = ${f(x)}$ mol/L.` });
      pasos.push({ t: 'En la disolución queda', html: `$[A] = ${f(cA)}$ M y $[B] = ${f(cB)}$ M (el ${limA ? 'catión' : 'anión'} es el limitante y casi se agota).` });
      pasos.push({ t: 'Sólido formado', html: `$n = x V = ${f(x)} · ${f(Vt / 1000)}$ L = <b>${f(mol)} mol</b>${M ? `, que son <b>${f(mol * M)} g</b> de precipitado` : ''}.` });
      Object.assign(r, { x, mol, masa: M ? mol * M : null, cA, cB, limitante: limA ? 'catión' : 'anión', porciento: limA ? (100 * (ca - cA)) / ca : (100 * (cb - cB)) / cb });
    }
    return r;
  }

  /* ---------- Precipitación fraccionada ---------- */
  function selectiva(sc) {
    const cat = sc.comun === 'cat', S = [1, 2].map((i) => {
      const a = lee(sc, 'a' + i, `el número de cationes de la sal ${i}`, { entero: true }), b = lee(sc, 'b' + i, `el número de aniones de la sal ${i}`, { entero: true });
      const Kps = lee(sc, 'Kps' + i, `el Kps de la sal ${i}`), c = lee(sc, 'c' + i, `la concentración del ion de la sal ${i} que no es el común`);
      const p = cat ? a : b, q = cat ? b : a; // exponentes del ion que se añade y del otro
      return { i, a, b, Kps, c, p, q, X: (Kps / c ** q) ** (1 / p) };
    });
    const ion = cat ? 'catión' : 'anión', add = cat ? 'A' : 'B', otro = cat ? 'B' : 'A';
    const pasos = [{ t: 'Planteamiento', html: `Se añade poco a poco el ${ion} que comparten las dos sales (le llamamos $${add}$). Una sal empieza a precipitar cuando $Q = K_{"ps"}$, es decir, cuando $[${add}]$ alcanza $[${add}] = (K_{"ps"} / [${otro}]^{q})^{1/p}$, con $p$ el exponente de $${add}$ en el Kps y $q$ el del otro ion.` }];
    for (const s of S) pasos.push({ t: `Sal ${s.i}`, html: `$K_{"ps"} = ${f(s.Kps)}$ con $[${otro}] = ${f(s.c)}$ M: empieza a precipitar con $[${add}] = (${f(s.Kps)} / ${f(s.c)}${ex(s.q)})^{1/${s.p}}$ = <b>${f(s.X)} M</b>.` });
    const [p, q] = S[0].X <= S[1].X ? [S[0], S[1]] : [S[1], S[0]];
    pasos.push({ t: 'Cuál precipita primero', html: `Precipita antes la <b>sal ${p.i}</b>, porque necesita menos ${ion} (${f(p.X)} M frente a ${f(q.X)} M).` });
    const resta = (p.Kps / q.X ** p.p) ** (1 / p.q), frac = resta / p.c;
    pasos.push({ t: `Cuánto queda de la sal ${p.i} cuando empieza la ${q.i}`, html: `Al llegar a $[${add}] = ${f(q.X)}$ M, el ion $${otro}$ de la sal ${p.i} cumple $K_{"ps"} = ${f(p.Kps)}$, así que le quedan $[${otro}] = (${f(p.Kps)} / ${f(q.X)}${ex(p.p)})^{1/${p.q}}$ = <b>${f(resta)} M</b>: un <b>${f(100 * frac)} %</b> de lo que había (${f(p.c)} M).` });
    const sep = frac < 1e-3;
    pasos.push({ t: 'Separación', html: `Ha precipitado el ${f(100 * (1 - frac), 6)} % de la sal ${p.i} antes de que empiece la ${q.i}. ${sep ? 'Se considera una <b>separación cuantitativa</b> (queda menos del 0,1 %).' : 'No llega a ser una separación cuantitativa (para eso tendría que quedar menos del 0,1 %): precipitarían juntas en parte.'}` });
    return { modo: 'selectiva', cat, ion, S, primera: p.i, p, q, resta, frac, sep, pasos };
  }

  /* ---------- Efecto del pH (SO-1) ---------- */
  // pKa sucesivos «6,35 ; 10,33» → [6.35, 10.33]
  const lista = (t, nom) => {
    const xs = String(t ?? '').split(';').map((x) => x.trim()).filter(Boolean).map(leeNum);
    if (!xs.length || xs.some((x) => !isFinite(x))) throw new Error(`${nom}: escribe números separados por «;», como 6,35 ; 10,33`);
    return xs;
  };
  const pHde = (sc) => { const v = leeNum(sc.pH); if (!isFinite(v) || v < 0 || v > 14) throw new Error('El pH debe ser un número entre 0 y 14'); return v; };
  // fracción del anión en su forma completamente desprotonada a un pH, con los pKa del ácido (de más ácido a menos)
  const alfa0 = (pKas, pH) => {
    const h = 10 ** -pH, Ka = pKas.map((p) => 10 ** -p); let suma = 1, prod = 1;
    for (let k = 1; k <= Ka.length; k++) { prod *= Ka[Ka.length - k]; suma += h ** k / prod; }
    return 1 / suma;
  };
  function ph(sc) {
    const a = lee(sc, 'a', 'el número de cationes', { entero: true }), b = lee(sc, 'b', 'el número de aniones', { entero: true }), Kps = lee(sc, 'Kps', 'el Kps'), pH = pHde(sc);
    const oh = sc.anion === 'oh', pKas = oh ? [] : lista(sc.pkas, 'Los pKa del ácido conjugado del anión'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b);
    // solubilidad a un pH
    const sDe = (pHx) => {
      if (oh) { const OH = 10 ** (pHx - 14); return Math.min(Kps / OH ** b / a, Infinity) / 1; } // [A] = a·s → s = [A]/a con [A]^a [OH]^b = Kps
      return (Kps / (a ** a * b ** b * alfa0(pKas, pHx) ** b)) ** (1 / (a + b));
    };
    let s;
    if (oh) {
      const OH = 10 ** (pH - 14), A = (Kps / OH ** b) ** (1 / a);
      s = A / a;
      pasos.push({ t: 'Hidróxido: el pH fija [OH⁻]', html: `El anión es el OH⁻, así que el pH lo fija desde fuera: $[OH^{−}] = 10^{pH−14} = 10^{${f(pH - 14, 3)}} = ${f(OH)}$ M. El equilibrio $K_{"ps"} = [A]${ex(a)}[OH^{−}]${ex(b)}$ da $[A] = (K_{"ps"}/[OH^{−}]${ex(b)})^{1/${a}} = ${f(A)}$ M.` });
      pasos.push({ t: 'Solubilidad', html: `La solubilidad es lo que se disuelve del sólido: $s = [A]/${a} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. En agua pura sería $s_{0} = ${f(s0)}$ mol/L (el pH que tendría esa disolución es otro: aquí el pH está mantenido por un tampón).` });
    } else {
      const al = alfa0(pKas, pH);
      s = sDe(pH);
      pasos.push({ t: 'El anión se protona', html: `El anión B es la base conjugada de un ácido débil con $pK_a$ = ${pKas.map((x) => f(x, 3)).join('; ')}. A pH ${f(pH, 3)} solo una fracción $α = ${f(al)}$ del anión total está como B libre; el resto está protonado (HB, H₂B…) y no cuenta en el $K_{"ps"}$.` });
      pasos.push({ t: 'Solubilidad', html: `$K_{"ps"} = [A]${ex(a)}[B]${ex(b)} = (${a === 1 ? '' : a + ' '}s)${ex(a)}(${b === 1 ? '' : b + ' '}s α)${ex(b)}$ ⇒ $s = (K_{"ps"}/(${a ** a * b ** b} α${ex(b)}))^{1/${a + b}} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. En medio donde el anión no se protona sería $s_{0} = ${f(s0)}$ mol/L.` });
    }
    pasos.push({ t: 'Efecto del pH', html: `A pH ${f(pH, 3)} la sal es <b>${f(s / s0, 3)} veces ${s > s0 ? 'más' : 'menos'} soluble</b> que sin tener en cuenta la protonación del anión${oh ? ' en agua pura' : ''}. ${oh ? 'Un pH ácido (poca OH⁻) disuelve el hidróxido; uno básico lo hace precipitar.' : 'Al bajar el pH el anión se protona, el equilibrio de disolución se desplaza hacia la derecha y la sal se disuelve más.'}` });
    const r = { modo: 'ph', a, b, Kps, pH, s, s0, factor: s / s0, g: M ? s * M : null, M, oh, pKas, pasos };
    const curva = []; for (let x = 0; x <= 14.0001; x += 0.25) curva.push([x, sDe(x)]);
    r.curva = curva;
    if (oh && String(sc.C ?? '').trim() !== '') {
      const C = lee(sc, 'C', 'la concentración del catión'), pIni = 14 + lg10((Kps / C ** a) ** (1 / b)), Cres = C / 1000, pFin = 14 + lg10((Kps / Cres ** a) ** (1 / b));
      Object.assign(r, { C, pHini: pIni, pHfin: pFin });
      pasos.push({ t: `pH al que empieza a precipitar (${f(C)} M de catión)`, html: `Empieza cuando $Q = K_{"ps"}$: $[OH^{−}] = (K_{"ps"}/[A]${ex(a)})^{1/${b}} = (${f(Kps)}/${f(C)}${ex(a)})^{1/${b}} = ${f((Kps / C ** a) ** (1 / b))}$ M ⇒ $pOH = ${f(14 - pIni, 4)}$ ⇒ <b>pH = ${f(pIni, 4)}</b>.` });
      pasos.push({ t: 'pH al que la precipitación es cuantitativa', html: `Cuando queda el 0,1 % del catión ($[A] = ${f(Cres)}$ M): $[OH^{−}] = (K_{"ps"}/${f(Cres)}${ex(a)})^{1/${b}}$ ⇒ <b>pH = ${f(pFin, 4)}</b>. Entre pH ${f(pIni, 3)} y ${f(pFin, 3)} está el intervalo de precipitación; a un pH mayor el hidróxido ha precipitado casi del todo.` });
    }
    if (oh && ['Al(OH)3', 'Zn(OH)2', 'Pb(OH)2', 'Cr(OH)3'].includes(sc.formula)) pasos.push({ t: 'Aviso: anfoterismo', html: `Este hidróxido es anfótero: en medio muy básico se vuelve a disolver formando hidroxocomplejos (por ejemplo $Al(OH)_{4}^{−}$). Este modo no los incluye, así que a pH alto la solubilidad real es mayor que la calculada; el modo de complejos lo trata con la constante de formación.` });
    return r;
  }
  const lg10 = Math.log10;

  /* ---------- Complejos (SO-2) ---------- */
  // sal A_aB_b cuyo catión forma complejos A(L)_n con un ligando L (NH3, OH⁻, CN⁻…) con constantes de formación globales β_n
  function complejo(sc) {
    const a = lee(sc, 'a', 'el número de cationes', { entero: true }), b = lee(sc, 'b', 'el número de aniones', { entero: true }), Kps = lee(sc, 'Kps', 'el Kps');
    const C0 = lee(sc, 'L0', 'la concentración inicial del ligando'), logb = lista(sc.logb, 'Los logaritmos de las constantes de formación (log β₁; log β₂…)');
    const M = masaM(sc), pasos = [cabecera(sc, a, b, M)], lig = vacio(sc.lig) ? 'L' : sc.lig;
    const beta = logb.map((x) => (x === null ? null : 10 ** x)), n = beta.length;
    const nb = (L) => { let S = 1, N = 0; for (let k = 0; k < n; k++) if (beta[k]) { const t = beta[k] * L ** (k + 1); S += t; N += (k + 1) * t; } return [S, N / S]; }; // [1 + Σβ L^k, ligandos medios n̄]
    // ligando libre para una solubilidad s: L + a·s·n̄(L) = C0 (monótona en L)
    const libre = (s) => { let lo = 0, hi = C0; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (m + a * s * nb(m)[1] < C0) lo = m; else hi = m; } return (lo + hi) / 2; };
    const g = (s) => { const L = libre(s), [S] = nb(L); return Math.log((a * s / S) ** a * (b * s) ** b / Kps); };
    const s0 = solAgua(Kps, a, b);
    let lo = s0, hi = Math.max(s0 * 2, C0 / a * 2); while (g(hi) < 0 && hi < 1e6) hi *= 2;
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (g(m) < 0) lo = m; else hi = m; }
    const s = (lo + hi) / 2, L = libre(s), [S, nbar] = nb(L), Alibre = a * s / S;
    const frac = (k) => (k === 0 ? 1 : beta[k - 1] ? beta[k - 1] * L ** k : 0) / S;
    pasos.push({ t: 'Complejos del catión', html: `El catión A forma complejos con ${esc2(lig)}: $A + k ${lig} ⇌ A(${lig})_{k}$ con $β_k$ ($log β$ = ${logb.map((x, k) => `${k + 1}: ${x === null ? '—' : f(x, 3)}`).join('; ')}). Solo una fracción del catión disuelto está libre: $[A]_{"libre"} = [A]_{"total"}/(1 + Σ β_k [${lig}]^{k})$.` });
    pasos.push({ t: 'Equilibrios acoplados', html: `Se imponen dos condiciones: $K_{"ps"} = [A]_{"libre"}${ex(a)}[B]${ex(b)}$ con $[A]_{"total"} = ${a === 1 ? '' : a + ' '}s$ y $[B] = ${b === 1 ? '' : b + ' '}s$, y el balance del ligando, $[${lig}]_{0} = [${lig}] + [A]_{"total"} · \bar n$, donde $\bar n$ es el número medio de ligandos por catión. Se resuelven juntas por bisección.` });
    pasos.push({ t: 'Resultado', html: `Con ${f(C0)} M de ${lig} inicial queda libre $[${lig}] = ${f(L)}$ M y $\bar n = ${f(nbar)}$. La solubilidad es <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}, frente a $s_{0} = ${f(s0)}$ mol/L en agua: <b>${f(s / s0, 3)} veces</b> mayor. El catión libre es $[A] = ${f(Alibre)}$ M.` });
    const especies = beta.map((b2, k) => ({ k: k + 1, c: a * s * frac(k + 1) })).filter((e) => e.c > 0);
    pasos.push({ t: 'Reparto del catión disuelto', html: `Libre: ${f(100 * frac(0), 4)} %${especies.map((e) => `; ${'A(' + lig + ')'}<sub>${e.k}</sub>: ${f(100 * frac(e.k), 4)} %`).join('')}.` });
    const curva = []; for (let x = -3; x <= 1.0001; x += 0.1) { const c0 = 10 ** x; curva.push([x, solComp(c0)]); }
    function solComp(c0) {
      const lib = (ss) => { let l = 0, h = c0; for (let i = 0; i < 100; i++) { const m = (l + h) / 2; if (m + a * ss * nb(m)[1] < c0) l = m; else h = m; } return (l + h) / 2; };
      const gg = (ss) => { const [Sx] = nb(lib(ss)); return Math.log((a * ss / Sx) ** a * (b * ss) ** b / Kps); };
      let l = s0, h = Math.max(s0 * 2, c0 / a * 2); while (gg(h) < 0 && h < 1e6) h *= 2;
      for (let i = 0; i < 100; i++) { const m = (l + h) / 2; if (gg(m) < 0) l = m; else h = m; }
      return (l + h) / 2;
    }
    return { modo: 'complejo', a, b, Kps, L0: C0, lig, s, s0, factor: s / s0, L, nbar, Alibre, g: M ? s * M : null, M, curva, pasos };
  }
  const esc2 = (t) => String(t).replace(/[<>&]/g, '');

  function resolver(sc) {
    if (sc.modo === 'ph') return ph(sc);
    if (sc.modo === 'complejo') return complejo(sc);
    if (sc.modo === 'solub') return deKps(sc);
    if (sc.modo === 'comun') return ionComun(sc);
    if (sc.modo === 'precipita') return precipita(sc);
    if (sc.modo === 'selectiva') return selectiva(sc);
    return deSolubilidad(sc);
  }

  const ejemplos = [
    { clave: 'ag2cro4', nombre: 'Kps del Ag₂CrO₄ a partir de su solubilidad', sc: { modo: 'kps', formula: 'Ag2CrO4', a: '2', b: '1', s: '6.5e-5', uni: 'mol', M: '' } },
    { clave: 'baso4-g', nombre: 'Kps del BaSO₄ con la solubilidad en g/L', sc: { modo: 'kps', formula: 'BaSO4', a: '1', b: '1', s: '2.4e-3', uni: 'g', M: '233.38' } },
    { clave: 'agcl', nombre: 'Solubilidad del AgCl en agua', sc: { modo: 'solub', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', M: '' } },
    { clave: 'caoh2', nombre: 'Solubilidad del Ca(OH)₂ en agua', sc: { modo: 'solub', formula: 'Ca(OH)2', a: '1', b: '2', Kps: '5.5e-6', M: '' } },
    { clave: 'agcl-nacl', nombre: 'AgCl en NaCl 0,10 M (ion común)', sc: { modo: 'comun', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', ion: 'an', C: '0.10', M: '' } },
    { clave: 'pbi2-mezcla', nombre: 'Mezcla de Pb²⁺ y I⁻: ¿precipita PbI₂?', sc: { modo: 'precipita', formula: 'PbI2', a: '1', b: '2', Kps: '9.8e-9', c1: '0.01', V1: '50', c2: '0.01', V2: '50', M: '' } },
    { clave: 'agcl-mezcla', nombre: 'Mezcla de Ag⁺ y Cl⁻: cuánto AgCl precipita', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '0.10', V1: '50', c2: '0.10', V2: '50', M: '143.32' } },
    { clave: 'sin-precipitado', nombre: 'Disolución muy diluida: no precipita', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '1e-6', V1: '100', c2: '1e-6', V2: '100', M: '' } },
    { clave: 'mg-oh-ph', nombre: 'Mg(OH)₂ en un tampón de pH 9: solubilidad y pH de precipitación', sc: { modo: 'ph', sal: 'Mg(OH)2', formula: 'Mg(OH)2', a: '1', b: '2', Kps: '1.8e-11', anion: 'oh', pkas: '', pH: '9', C: '0.01', M: '' } },
    { clave: 'caco3-ph', nombre: 'CaCO₃ a pH 5: se disuelve en medio ácido', sc: { modo: 'ph', sal: 'CaCO3', formula: 'CaCO3', a: '1', b: '1', Kps: '3.4e-9', anion: 'base', pkas: '6,35 ; 10,33', pH: '5', C: '', M: '' } },
    { clave: 'caf2-ph', nombre: 'CaF₂ a pH 3: el F⁻ se protona', sc: { modo: 'ph', sal: 'CaF2', formula: 'CaF2', a: '1', b: '2', Kps: '3.9e-11', anion: 'base', pkas: '3,17', pH: '3', C: '', M: '' } },
    { clave: 'agcl-nh3', nombre: 'AgCl en amoníaco 1 M: se disuelve por el complejo', sc: { modo: 'complejo', sal: 'AgCl', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', lig: 'NH3', logb: '3,32 ; 7,23', L0: '1', M: '' } },
    { clave: 'cuoh2-nh3', nombre: 'Cu(OH)₂ en amoníaco 2 M', sc: { modo: 'complejo', sal: 'Cu(OH)2', formula: 'Cu(OH)2', a: '1', b: '2', Kps: '2.2e-20', lig: 'NH3', logb: '4,04 ; 7,47 ; 10,27 ; 11,75', L0: '2', M: '' } },
    { clave: 'hidroxidos-separar', nombre: 'Separar Fe³⁺ y Mg²⁺ con OH⁻ (hidróxidos a pH controlado)', sc: { modo: 'selectiva', comun: 'an', a1: '1', b1: '3', Kps1: '4e-38', c1: '0.01', a2: '1', b2: '2', Kps2: '1.8e-11', c2: '0.01' } },
    { clave: 'cl-i-ag', nombre: 'Separar I⁻ y Cl⁻ añadiendo Ag⁺', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '8.5e-17', c1: '0.10', a2: '1', b2: '1', Kps2: '1.8e-10', c2: '0.10' } },
    { clave: 'mohr', nombre: 'Cl⁻ y CrO₄²⁻ con Ag⁺ (método de Mohr)', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '1.8e-10', c1: '0.10', a2: '2', b2: '1', Kps2: '1.1e-12', c2: '1e-3' } },
  ];

  return { resolver, ejemplos, SALES, f };
})();
if (typeof module !== 'undefined') module.exports = Solubilidad;
