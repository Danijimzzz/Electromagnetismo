/* =====================================================================
   Elasticidades (sin DOM): elasticidad precio de la demanda, renta y
   cruzada entre dos situaciones (con la variación sobre el valor inicial
   y con el método del punto medio, o de arco), su clasificación (elástica
   o inelástica, bien normal, de lujo o inferior, sustitutivos o
   complementarios) y el efecto sobre el ingreso total; y la elasticidad
   en un punto de una demanda lineal Q = a − bP, con el precio que hace
   máximo el ingreso. Formato de economia/comun.js; interfaz en
   elasticidades/app.js.
     resolver(sc)  { tipo: 'precio' | 'renta' | 'cruzada', x0, q0, x1, q1 } | { tipo: 'lineal', a, b, p } → { e, eArco, pasos }
   ===================================================================== */
const Elasticidades = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const TIPOS = { precio: 'Precio de la demanda', renta: 'Renta', cruzada: 'Cruzada', lineal: 'Demanda lineal Q = a − bP' };
  // qué es la x en cada tipo
  const X = { precio: ['el precio', 'P'], renta: ['la renta', 'R'], cruzada: ['el precio del otro bien', 'P_y'] };
  const n = (x) => f(x, 8).replace(/\./g, ''), e4 = (x) => f(x, 4), pc = (x) => `${f(100 * x, 4)} %`;

  function clasifica(tipo, e) {
    const a = Math.abs(e);
    if (tipo === 'precio') return a > 1 + 1e-9 ? ['elástica', `la cantidad cambia más que el precio (|ε| > 1)`] : a < 1 - 1e-9 ? (a < 1e-9 ? ['perfectamente inelástica', 'la cantidad no cambia con el precio'] : ['inelástica', 'la cantidad cambia menos que el precio (|ε| < 1)']) : ['unitaria', 'la cantidad cambia en la misma proporción que el precio'];
    if (tipo === 'renta') return e < -1e-9 ? ['bien inferior', 'al subir la renta se compra menos (ε < 0)'] : e > 1 + 1e-9 ? ['bien normal de lujo', 'al subir la renta se compra proporcionalmente más (ε > 1)'] : ['bien normal de primera necesidad', 'al subir la renta se compra algo más, pero en menor proporción (0 < ε < 1)'];
    return e > 1e-9 ? ['bienes sustitutivos', 'si sube el precio del otro, se compra más de este (ε > 0)'] : e < -1e-9 ? ['bienes complementarios', 'si sube el precio del otro, se compra menos de este (ε < 0)'] : ['bienes independientes', 'el precio del otro no afecta'];
  }

  function arco(sc, tipo) {
    const [nom, s] = X[tipo];
    const x0 = lee(sc, 'x0', `${nom} inicial`, { min: 0, minEx: true }), x1 = lee(sc, 'x1', `${nom} final`, { min: 0, minEx: true });
    const q0 = lee(sc, 'q0', 'la cantidad inicial', { min: 0, minEx: true }), q1 = lee(sc, 'q1', 'la cantidad final', { min: 0 });
    if (x0 === x1) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no cambia: hace falta una variación para calcular la elasticidad`);
    const vq = (q1 - q0) / q0, vx = (x1 - x0) / x0, e = vq / vx;
    const vqm = (q1 - q0) / ((q0 + q1) / 2), vxm = (x1 - x0) / ((x0 + x1) / 2), ea = vqm / vxm;
    const [clase, por] = clasifica(tipo, ea), pasos = [];
    pasos.push({ t: 'Variaciones porcentuales', html: `$${s}$ pasa de ${n(x0)} a ${n(x1)}: $Δ${s}/${s}_0 = (${n(x1)} − ${n(x0)})/${n(x0)} = ${pc(vx)}$. La cantidad pasa de ${n(q0)} a ${n(q1)}: $ΔQ/Q_0 = (${n(q1)} − ${n(q0)})/${n(q0)} = ${pc(vq)}$.` });
    pasos.push({ t: 'Elasticidad sobre el valor inicial', html: `$ε = {ΔQ/Q_0}/{Δ${s}/${s}_0} = ${f(vq, 6)}/${f(vx, 6)} = ${e4(e)}$. ¡Ojo! Si el cambio fuera al revés (de ${n(x1)} a ${n(x0)}) saldría otro número: ${e4(((q0 - q1) / q1) / ((x0 - x1) / x1))}.` });
    pasos.push({ t: 'Elasticidad de arco (punto medio)', html: `Para que no dependa del sentido se divide entre la media: $Q_m = ${n((q0 + q1) / 2)}$ y $${s}_m = ${n((x0 + x1) / 2)}$, así que $ΔQ/Q_m = ${f(vqm, 6)}$, $Δ${s}/${s}_m = ${f(vxm, 6)}$ y $ε = ${f(vqm, 6)}/${f(vxm, 6)} = ${e4(ea)}$.` });
    pasos.push({ t: 'Qué tipo es', html: `<b>${clase[0].toUpperCase() + clase.slice(1)}</b>: ${por}.` });
    let it0 = null, it1 = null;
    if (tipo === 'precio') {
      it0 = x0 * q0; it1 = x1 * q1;
      pasos.push({ t: 'Ingreso total', html: `$IT = P · Q$: de ${n(it0)} a ${n(it1)}. ${Math.abs(it1 - it0) < 1e-9 * it0 ? 'No cambia: es lo que pasa con elasticidad unitaria.' : (it1 > it0) === (x1 > x0) ? `${x1 > x0 ? 'Subir' : 'Bajar'} el precio ${x1 > x0 ? 'sube' : 'baja'} el ingreso: con demanda inelástica, el ingreso va en el mismo sentido que el precio.` : `${x1 > x0 ? 'Subir' : 'Bajar'} el precio ${it1 > it0 ? 'sube' : 'baja'} el ingreso: con demanda elástica, el ingreso va en sentido contrario al precio.`}` });
    }
    return { tipo, x0, x1, q0, q1, vq, vx, e, ea, clase, it0, it1, pasos };
  }

  function lineal(sc) {
    const a = lee(sc, 'a', 'el término a', { min: 0, minEx: true }), b = lee(sc, 'b', 'la pendiente b', { min: 0, minEx: true }), p = lee(sc, 'p', 'el precio', { min: 0 });
    const q = a - b * p;
    if (q <= 0) throw new Error(`A ese precio no se demanda nada: el precio tiene que ser menor que a/b = ${f(a / b)}`);
    const e = (-b * p) / q, pm = a / (2 * b), [clase, por] = clasifica('precio', e), pasos = [];
    pasos.push({ t: 'Cantidad demandada', html: `$Q = a − b P = ${n(a)} − ${n(b)} · ${n(p)} = ${n(q)}$` });
    pasos.push({ t: 'Elasticidad en el punto', html: `$ε = {dQ}/{dP} · P/Q = −b · P/Q = −${n(b)} · ${n(p)}/${n(q)} = ${e4(e)}$: demanda <b>${clase}</b> en este punto (${por}).` });
    pasos.push({ t: 'A lo largo de la recta', html: `La pendiente es la misma en toda la recta, pero la elasticidad no: vale 0 donde P = 0, −∞ donde Q = 0 y −1 justo en el punto medio, $P = a/(2b) = ${n(pm)}$. Por encima de ese precio la demanda es elástica y por debajo, inelástica.` });
    pasos.push({ t: 'Ingreso máximo', html: `$IT = P · Q = P (a − b P)$ es máximo donde $dIT/dP = a − 2bP = 0$, es decir, en $P = ${n(pm)}$, con $Q = ${n(a / 2)}$ e $IT = ${n((a * a) / (4 * b))}$. Con tu precio, $IT = ${n(p * q)}$: ${Math.abs(p - pm) < 1e-9 ? 'ya es el máximo' : p > pm ? 'como la demanda es elástica, bajar el precio subiría el ingreso' : 'como la demanda es inelástica, subir el precio subiría el ingreso'}.` });
    return { tipo: 'lineal', a, b, p, q, e, ea: e, clase, pm, it: p * q, itMax: (a * a) / (4 * b), pasos };
  }

  const resolver = (sc) => (sc.tipo === 'lineal' ? lineal(sc) : arco(sc, TIPOS[sc.tipo] ? sc.tipo : 'precio'));

  const ejemplos = [
    { clave: 'cine', nombre: 'Entradas de cine que suben de 8 a 10 €', sc: { tipo: 'precio', x0: '8', q0: '500', x1: '10', q1: '400' } },
    { clave: 'gasolina', nombre: 'Gasolina: una demanda inelástica', sc: { tipo: 'precio', x0: '1,5', q0: '1000', x1: '1,8', q1: '950' } },
    { clave: 'lujo', nombre: 'Viajes al subir el sueldo: un bien de lujo', sc: { tipo: 'renta', x0: '20000', q0: '2', x1: '22000', q1: '3' } },
    { clave: 'inferior', nombre: 'Bocadillos al subir la renta: un bien inferior', sc: { tipo: 'renta', x0: '1500', q0: '20', x1: '1800', q1: '16' } },
    { clave: 'cafe-te', nombre: 'Café y té: elasticidad cruzada', sc: { tipo: 'cruzada', x0: '10', q0: '100', x1: '12', q1: '115' } },
    { clave: 'lineal', nombre: 'Demanda lineal Q = 100 − 2P a 30 €', sc: { tipo: 'lineal', a: '100', b: '2', p: '30' } },
  ];

  return { resolver, ejemplos, TIPOS, X };
})();
if (typeof module !== 'undefined') module.exports = Elasticidades;
