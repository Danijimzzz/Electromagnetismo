/* =====================================================================
   PIB, IPC e inflación (sin DOM): con los precios y las cantidades de
   varios bienes en varios años, el PIB nominal, el real (a precios del año
   base), el deflactor, el crecimiento real y la inflación; con una serie
   en euros corrientes y el IPC, la misma serie en euros constantes
   (deflactar) y las tasas de inflación y de crecimiento real; y los
   agregados de la contabilidad nacional por el lado del gasto (PIB, PNB,
   PNN y renta nacional). Formato de economia/comun.js; interfaz en
   pib-ipc/app.js.
     resolver(sc)  { modo: 'pib', anos, bienes, base } | { modo: 'deflactar', serie, ref } | { modo: 'agregados', c, i, g, x, m, rfn, amort, tin }
   ===================================================================== */
const PibIpc = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee, vacio } = K;
  const MODOS = { pib: 'PIB nominal y real', deflactar: 'Deflactar (IPC)', agregados: 'Del PIB a la renta' };
  // número sin punto de miles dentro de una fórmula
  const m = (x) => f(x, 9).replace(/\./g, ''), pc = (x) => `${f(100 * x, 4)} %`;

  function pib(sc) {
    const lineas = String(sc.bienes ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/[a-zñáéíóú]/i.test(l.replace(/e[+-]?\d/gi, '')));
    if (!lineas.length) throw new Error('Escribe un bien por línea: el precio y la cantidad de cada año');
    const ncol = lineas[0].split(/[\s;\t]+/).length;
    if (ncol < 4 || ncol % 2) throw new Error('Cada bien necesita un precio y una cantidad por año: al menos 4 números (dos años) y siempre un número par');
    const d = K.filas(sc.bienes, ncol, 'los bienes'), n = ncol / 2;
    if (d.some((r) => r.some((x) => x < 0))) throw new Error('Los precios y las cantidades no pueden ser negativos');
    const an = vacio(sc.anos) ? Array.from({ length: n }, (_, k) => k + 1) : K.lista(sc.anos, 'los años');
    if (an.length !== n) throw new Error(`Hay ${n} años en la tabla de bienes y ${an.length} en la lista de años`);
    const kb = vacio(sc.base) ? 0 : an.indexOf(lee(sc, 'base', 'el año base'));
    if (kb < 0) throw new Error('El año base tiene que ser uno de los de la lista');
    const p = (r, k) => r[2 * k], q = (r, k) => r[2 * k + 1];
    const anos = an.map((a, k) => { const nom = d.reduce((s, r) => s + p(r, k) * q(r, k), 0), real = d.reduce((s, r) => s + p(r, kb) * q(r, k), 0); return { a, nom, real, def: real > 0 ? (100 * nom) / real : null }; });
    if (anos.some((x) => !(x.real > 0))) throw new Error('Algún año sale con PIB real 0: revisa las cantidades');
    anos.forEach((x, k) => { if (k) { x.crec = x.real / anos[k - 1].real - 1; x.infl = x.def / anos[k - 1].def - 1; x.crecNom = x.nom / anos[k - 1].nom - 1; } });
    const u = anos[n - 1], pasos = [];
    pasos.push({ t: 'PIB nominal', html: `Cada año, las cantidades producidas a los precios de ese año: $"PIB"_t = ∑ p_t q_t$. ${anos.map((x) => `en ${f(x.a)}, ${m(x.nom)}`).join('; ').replace('e', 'E')}.` });
    pasos.push({ t: `PIB real (a precios de ${f(an[kb])})`, html: `Las cantidades de cada año a los precios del año base, para que solo cambie lo que se produce: $"PIB real"_t = ∑ p_{${f(an[kb])}} q_t$. ${anos.map((x) => `en ${f(x.a)}, ${m(x.real)}`).join('; ').replace('e', 'E')}.` });
    pasos.push({ t: 'Deflactor del PIB', html: `$"deflactor" = 100 · {"PIB nominal"}/{"PIB real"}$: en ${f(u.a)}, $100 · ${m(u.nom)}/${m(u.real)} = ${f(u.def, 6)}$. Mide cuánto han subido los precios de todo lo que se produce desde el año base.` });
    pasos.push({ t: 'Crecimiento e inflación', html: anos.slice(1).map((x, k) => `De ${f(anos[k].a)} a ${f(x.a)}: el PIB real crece $${m(x.real)}/${m(anos[k].real)} − 1 = ${pc(x.crec)}$ y la inflación (del deflactor) es $${f(x.def, 6)}/${f(anos[k].def, 6)} − 1 = ${pc(x.infl)}$. El nominal crece ${pc(x.crecNom)}, casi la suma de los dos.`).join('<br>') });
    return { modo: 'pib', anos, base: an[kb], nb: d.length, pasos };
  }

  function deflactar(sc) {
    const d = K.filas(sc.serie, 3, 'la serie');
    if (d.length < 2) throw new Error('Escribe al menos dos años, uno por línea: «año valor IPC»');
    if (d.some((r) => r[2] <= 0)) throw new Error('El IPC tiene que ser positivo');
    const ref = vacio(sc.ref) ? d[0][0] : lee(sc, 'ref', 'el año de referencia'), kr = d.findIndex((r) => r[0] === ref);
    if (kr < 0) throw new Error('El año de referencia tiene que ser uno de los de la tabla');
    const ir = d[kr][2], filas = d.map(([a, x, ipc], k) => ({ a, x, ipc, real: (x * ir) / ipc, infl: k ? ipc / d[k - 1][2] - 1 : null }));
    filas.forEach((r, k) => { if (k) { r.crecNom = r.x / filas[k - 1].x - 1; r.crecReal = r.real / filas[k - 1].real - 1; } });
    const n = filas.length - 1, u = filas[n], p0 = filas[0], pasos = [];
    pasos.push({ t: 'Inflación', html: `Con el IPC: $π_t = {"IPC"_t}/{"IPC"_{t−1}} − 1$. ${filas.slice(1).map((r) => `${f(r.a)}: ${pc(r.infl)}`).join('; ')}.` });
    pasos.push({ t: `En euros de ${f(ref)}`, html: `Para quitar la subida de los precios se divide entre el IPC y se multiplica por el del año de referencia: $"real"_t = "nominal"_t · {"IPC"_{${f(ref)}}}/{"IPC"_t}$. En ${f(u.a)}: $${m(u.x)} · ${m(ir)}/${m(u.ipc)} = ${m(+u.real.toFixed(2))}$.` });
    const tN = u.x / p0.x - 1, tR = u.real / p0.real - 1;
    pasos.push({ t: 'Lo que ha cambiado de verdad', html: `De ${f(p0.a)} a ${f(u.a)} el valor nominal sube un ${pc(tN)} pero los precios suben un ${pc(u.ipc / p0.ipc - 1)}, así que en términos reales ${tR >= 0 ? 'sube' : 'baja'} un <b>${pc(Math.abs(tR))}</b>: $(1 + ${f(tN, 6)})/(1 + ${f(u.ipc / p0.ipc - 1, 6)}) − 1 = ${f(tR, 6)}$.${tR < 0 ? ' Aunque el número sea mayor, con él se puede comprar menos.' : ''}` });
    return { modo: 'deflactar', ref, filas, tN, tR, pasos };
  }

  function agregados(sc) {
    const L = (k, nom, o = {}) => lee(sc, k, nom, o);
    const c = L('c', 'el consumo', { min: 0 }), i = L('i', 'la inversión'), g = L('g', 'el gasto público', { min: 0 }), x = L('x', 'las exportaciones', { min: 0 }), mm = L('m', 'las importaciones', { min: 0 });
    const rfn = L('rfn', 'las rentas netas del exterior', { def: 0 }), am = L('amort', 'las amortizaciones', { min: 0, def: 0 }), ti = L('tin', 'los impuestos indirectos netos', { def: 0 });
    const pib = c + i + g + x - mm, pnb = pib + rfn, pnn = pnb - am, rn = pnn - ti, pasos = [];
    pasos.push({ t: 'PIB por el lado del gasto', html: `Todo lo que se produce lo compra alguien: los hogares (consumo), las empresas (inversión), el sector público o el resto del mundo (exportaciones netas): $"PIB"_{pm} = C + I + G + X − M = ${m(c)} + ${m(i)} + ${m(g)} + ${m(x)} − ${m(mm)} = ${m(pib)}$.` });
    pasos.push({ t: 'PNB', html: `El producto de los factores del país, estén donde estén: se suman las rentas que cobran del exterior y se restan las que se pagan fuera, $"PNB"_{pm} = "PIB"_{pm} + "RFN" = ${m(pib)} ${rfn < 0 ? '−' : '+'} ${m(Math.abs(rfn))} = ${m(pnb)}$.` });
    pasos.push({ t: 'PNN', html: `Sin el desgaste del capital: $"PNN"_{pm} = "PNB"_{pm} − "amortizaciones" = ${m(pnb)} − ${m(am)} = ${m(pnn)}$.` });
    pasos.push({ t: 'Renta nacional', html: `A coste de los factores, quitando los impuestos indirectos netos de subvenciones, que no cobra ningún factor: $"RN" = "PNN"_{cf} = ${m(pnn)} − ${m(ti)} = ${m(rn)}$. Es lo que se reparten los salarios, los alquileres, los intereses y los beneficios.` });
    pasos.push({ t: 'Peso de cada componente', html: `Consumo ${pc(c / pib)}, inversión ${pc(i / pib)}, gasto público ${pc(g / pib)} y saldo exterior ${pc((x - mm) / pib)} del PIB. Grado de apertura: $(X + M)/"PIB" = ${pc((x + mm) / pib)}$.` });
    return { modo: 'agregados', c, i, g, x, m: mm, rfn, am, ti, pib, pnb, pnn, rn, pasos };
  }

  const resolver = (sc) => (sc.modo === 'deflactar' ? deflactar(sc) : sc.modo === 'agregados' ? agregados(sc) : pib(sc));

  const ejemplos = [
    { clave: 'tres-bienes', nombre: 'Una economía con tres bienes en tres años', sc: { modo: 'pib', anos: '2022 2023 2024', base: '2022', bienes: '10 100 12 105 13 110\n5 200 5,5 210 6 200\n20 50 22 55 25 60' } },
    { clave: 'dos-bienes', nombre: 'Pizzas y libros: crece el PIB nominal pero no el real', sc: { modo: 'pib', anos: '2023 2024', base: '2023', bienes: '8 100 10 100\n15 40 18 38' } },
    { clave: 'salario', nombre: '¿Ha subido mi sueldo de verdad?', sc: { modo: 'deflactar', ref: '2020', serie: 'año sueldo IPC\n2020 20000 100\n2021 20600 103,1\n2022 21500 111,8\n2023 22300 115,6\n2024 22900 118,9' } },
    { clave: 'agregados', nombre: 'Del PIB a la renta nacional', sc: { modo: 'agregados', c: '600', i: '150', g: '200', x: '250', m: '230', rfn: '-15', amort: '120', tin: '90' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, (sc) => {
    if (sc.modo === 'agregados') return { c: String(AZ.toma([400, 600, 800])), i: String(AZ.toma([100, 150, 200, 250])), g: String(AZ.toma([150, 200, 300])), x: String(AZ.toma([200, 250, 300])), m: String(AZ.toma([180, 230, 280])), rfn: String(AZ.toma([-30, -15, 0, 20])), amort: String(AZ.toma([80, 100, 120])), tin: String(AZ.toma([60, 90, 120])) };
    const n = AZ.toma([2, 3]), a0 = AZ.toma([2020, 2022, 2023]), anos = Array.from({ length: sc.modo === 'pib' ? n : 5 }, (_, k) => a0 + k);
    if (sc.modo === 'deflactar') {
      let ipc = 100, sue = AZ.toma([18000, 20000, 25000]); const filas = ['año sueldo IPC'];
      anos.forEach((a, k) => { if (k) { ipc *= 1 + AZ.toma([0.01, 0.02, 0.03, 0.05]); sue += 50 * AZ.e(4, 16); } filas.push(`${a} ${sue} ${AZ.t(ipc, 1)}`); });
      return { ref: String(a0), serie: filas.join('\n') };
    }
    const bienes = Array.from({ length: AZ.toma([2, 3]) }, () => { let p = AZ.toma([5, 8, 10, 20]), q = AZ.toma([50, 100, 200]); return anos.map(() => { const t = `${AZ.t(p, 2)} ${q}`; p *= 1 + AZ.toma([0.05, 0.1]); q = Math.round(q * (1 + AZ.toma([-0.05, 0, 0.05, 0.1]))); return t; }).join(' '); });
    return { anos: anos.join(' '), base: String(a0), bienes: bienes.join('\n') };
  }, null, (sc) => resolver(sc));
  const enunciado = (sc) => sc.modo === 'agregados'
    ? `En una economía el consumo es ${sc.c}, la inversión ${sc.i}, el gasto público ${sc.g}, las exportaciones ${sc.x} y las importaciones ${sc.m}; la renta neta de factores del exterior es ${sc.rfn}, la amortización ${sc.amort} y los impuestos indirectos netos ${sc.tin}. Calcula el PIB a precios de mercado, el PNB, el PNN y la renta nacional.`
    : sc.modo === 'deflactar'
      ? `Con la serie de sueldos y del IPC de la tabla, expresa el último sueldo en euros de ${sc.ref} y calcula la variación nominal y la real del sueldo y la inflación del último año.`
      : `Con los precios y las cantidades de ${sc.bienes.split('\n').length} bienes en ${sc.anos.split(' ').join(', ')}, calcula el PIB nominal y el real (a precios de ${sc.base}), el deflactor, el crecimiento real y la inflación del último año.`;

  return { azar, enunciado, resolver, ejemplos, MODOS };
})();
if (typeof module !== 'undefined') module.exports = PibIpc;
