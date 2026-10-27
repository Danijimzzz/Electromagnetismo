/* =====================================================================
   Ajustador de reacciones (sin DOM): ajusta una ecuación química por álgebra
   lineal con Formulas.ajustar (quimica/formulas.js) y escribe el desarrollo
   de clase: una incógnita por especie, una ecuación por elemento (y la de la
   carga), a = 1, el resto despejado en fracciones, el mínimo común múltiplo
   y la comprobación átomo a átomo. La interfaz está en ajustador/app.js y la
   prueba en pruebas/herramientas/ajustador.js.
     resolver(sc)  { ecuacion } → { html, especies, elementos, tabla, pasos }
     ejemplos      [{ clave, nombre, sc }]
   ===================================================================== */
const Ajustador = (() => {
  const LETRAS = 'abcdfghjkmnpqrstuvw'; // sin e (electrón), i, l ni o, que se confunden
  const mcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const frac = (n, d) => { const g = mcd(n, d) || 1; n /= g; d /= g; return d === 1 ? String(n) : `{${n}}/{${d}}`; };
  // un término «3a» o «a» de una ecuación de balance
  const termino = (n, x) => (n === 1 ? x : `${n}${x}`);
  const lado = (L) => (L.length ? L.join(' + ') : '0');
  const sinEtiquetas = (h) => String(h).replace(/<small class="estado">.*?<\/small>/g, '');

  function resolver(sc) {
    const texto = String(sc.ecuacion ?? '').trim();
    if (!texto) throw new Error('Escribe la reacción, por ejemplo C3H8 + O2 -> CO2 + H2O');
    const aj = Formulas.ajustar(texto);
    const sp = aj.especies, n = sp.length;
    if (n > LETRAS.length) throw new Error(`Como mucho ${LETRAS.length} especies`);
    sp.forEach((s, j) => (s.letra = LETRAS[j]));
    const R = sp.filter((s) => s.reactivo), P = sp.filter((s) => !s.reactivo);
    const elementos = [...new Set(sp.flatMap((s) => Object.keys(s.atomos)))];
    const hayCarga = sp.some((s) => s.carga);
    const nom = (s) => sinEtiquetas(s.html);

    // una ecuación por elemento: átomos a la izquierda = átomos a la derecha
    const balance = elementos.map((el) => {
      const iz = R.filter((s) => s.atomos[el]).map((s) => termino(s.atomos[el], s.letra));
      const de = P.filter((s) => s.atomos[el]).map((s) => termino(s.atomos[el], s.letra));
      return `${el}: $${lado(iz)} = ${lado(de)}$`;
    });
    if (hayCarga) {
      const q = (L) => L.filter((s) => s.carga).map((s) => `${s.carga < 0 ? '−' : ''}${termino(Math.abs(s.carga), s.letra)}`).join(' + ').replace(/\+ −/g, '− ') || '0';
      balance.push(`Carga: $${q(R)} = ${q(P)}$`);
    }
    // con la primera especie a 1, las demás salen en fracciones; el mcm de los denominadores las hace enteras
    const c0 = sp[0].coef;
    const fracs = sp.map((s) => `$${s.letra} = ${frac(s.coef, c0)}$`);
    const enteros = sp.every((s) => s.coef % c0 === 0);

    // comprobación: átomos de cada elemento a cada lado
    const tabla = elementos.map((el) => ({ el, iz: R.reduce((t, s) => t + s.coef * (s.atomos[el] || 0), 0), de: P.reduce((t, s) => t + s.coef * (s.atomos[el] || 0), 0) }));
    const cargas = hayCarga ? { iz: R.reduce((t, s) => t + s.coef * s.carga, 0), de: P.reduce((t, s) => t + s.coef * s.carga, 0) } : null;

    const pasos = [
      { t: 'Una incógnita por especie', html: sp.map((s) => `$${s.letra}$ ${nom(s)}`).join(', ') + ': <br>' + `${R.map((s) => `$${s.letra}$ ${nom(s)}`).join(' + ')} → ${P.map((s) => `$${s.letra}$ ${nom(s)}`).join(' + ')}` },
      { t: hayCarga ? 'Balance de cada elemento y de la carga' : 'Balance de cada elemento', html: `Los átomos de cada elemento${hayCarga ? ' y la carga total' : ''} tienen que ser los mismos a los dos lados:<br>` + balance.join('<br>') },
      { t: `Se toma $${sp[0].letra} = 1$`, html: `El sistema es homogéneo y le falta una ecuación: una incógnita queda libre. Con $${sp[0].letra} = 1$, despejando:<br>` + fracs.join(', ') },
      ...(enteros ? [] : [{ t: 'Coeficientes enteros', html: `Se multiplica todo por ${c0}, el mínimo común múltiplo de los denominadores: ` + sp.map((s) => `$${s.letra} = ${s.coef}$`).join(', ') }]),
      { t: 'Reacción ajustada', html: aj.html },
      { t: 'Comprobación', html: tabla.map((r) => `${r.el}: ${r.iz} = ${r.de}`).join(' · ') + (cargas ? ` · carga: ${cargas.iz} = ${cargas.de}` : '') },
    ];
    return { html: aj.html, especies: sp, elementos, tabla, cargas, pasos };
  }

  const ejemplos = [
    { clave: 'propano', nombre: 'Combustión del propano', sc: { ecuacion: 'C3H8 + O2 -> CO2 + H2O' } },
    { clave: 'glucosa', nombre: 'Respiración: combustión de la glucosa', sc: { ecuacion: 'C6H12O6 + O2 -> CO2 + H2O' } },
    { clave: 'oxido-hierro', nombre: 'Oxidación del hierro', sc: { ecuacion: 'Fe + O2 -> Fe2O3' } },
    { clave: 'clorato', nombre: 'Descomposición del clorato de potasio', sc: { ecuacion: 'KClO3 -> KCl + O2' } },
    { clave: 'amoniaco', nombre: 'Oxidación del amoniaco (Ostwald)', sc: { ecuacion: 'NH3 + O2 -> NO + H2O' } },
    { clave: 'octano', nombre: 'Combustión del octano', sc: { ecuacion: 'C8H18 + O2 -> CO2 + H2O' } },
    { clave: 'aluminio', nombre: 'Aluminio con ácido sulfúrico', sc: { ecuacion: 'Al + H2SO4 -> Al2(SO4)3 + H2' } },
    { clave: 'cobre-nitrico', nombre: 'Cobre con ácido nítrico', sc: { ecuacion: 'Cu + HNO3 -> Cu(NO3)2 + NO + H2O' } },
    { clave: 'permanganato', nombre: 'Permanganato con ácido clorhídrico', sc: { ecuacion: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O' } },
    { clave: 'redox-ionica', nombre: 'Redox iónica: permanganato y hierro(II)', sc: { ecuacion: 'MnO4^- + Fe^2+ + H^+ -> Mn^2+ + Fe^3+ + H2O' } },
  ];

  return { resolver, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Ajustador;
