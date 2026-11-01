/* =====================================================================
   Simulador de circuitos · del dibujo al circuito (sin DOM). `extraer(sc)`
   convierte las piezas y los cables del esquema en el circuito del motor
   (motor.js): une por coordenadas patillas y extremos de cable en nudos,
   nombra los nudos (tierra = 0, etiquetas de nudo, n1, n2…) y expande cada
   componente en sus elementos (un potenciómetro son dos resistencias, un
   transformador real son seis elementos, una fuente trifásica son tres).
   Devuelve { net, nudoDe(x, y), pinNet, nets, sondas, medidores, elementosDe }
   o lanza un Error con la propiedad `comp` (nombre de la pieza culpable).
   ===================================================================== */
const ExtraerSim = (() => {
  const cat = CompSim.C, clave = Esquema.clave;
  const aviso = (id, msg) => { const e = new Error(msg); e.comp = id; throw e; };

  function extraer(sc) {
    const comps = sc.componentes || [];
    if (!comps.length) throw new Error('Arrastra componentes al esquema para empezar');
    const lee = (c, k, nom, { vacio = false, base } = {}) => {
      const d = cat[c.t].campos.find((f) => f.k === k), t = String(c.v[k] ?? '').trim();
      if (t === '') { if (vacio) return undefined; aviso(c.id, `${c.id}: falta ${nom || d?.nom?.toLowerCase() || k}`); }
      const x = Herramienta.leeSI(t, base ?? d?.base ?? 1);
      if (!isFinite(x)) aviso(c.id, `${c.id}: «${t}» no es un número válido en ${nom || d?.nom?.toLowerCase() || k}`);
      return x;
    };
    // nudos por unión de coordenadas
    const padre = new Map(), raiz = (k) => { if (!padre.has(k)) padre.set(k, k); while (padre.get(k) !== k) { padre.set(k, padre.get(padre.get(k))); k = padre.get(k); } return k; };
    const une = (a, b) => padre.set(raiz(a), raiz(b));
    for (const w of sc.cables || []) une(clave(w.a), clave(w.b));
    const pinesDe = new Map(); // compId → claves de sus patillas
    for (const c of comps) { const ps = Esquema.pines(c, cat).map(clave); pinesDe.set(c.id, ps); ps.forEach((k) => raiz(k)); }
    // etiquetas de nudo: mismas etiquetas, mismo nudo
    const porNombre = new Map();
    for (const c of comps) if (c.t === 'ETIQ') { const n = String(c.v.nombre || '').trim(); if (!n) aviso(c.id, `${c.id}: la etiqueta no tiene nombre`); const k = pinesDe.get(c.id)[0]; if (porNombre.has(n)) une(k, porNombre.get(n)); else porNombre.set(n, k); }
    // nombres de nudo
    const nombre = new Map(), usados = new Set();
    for (const c of comps) if (c.t === 'GND') nombre.set(raiz(pinesDe.get(c.id)[0]), '0');
    for (const [n, k] of porNombre) { const r = raiz(k); if (!nombre.has(r)) { if (n === '0') nombre.set(r, '0'); else { nombre.set(r, n); usados.add(n); } } }
    if (![...nombre.values()].includes('0')) throw new Error('Falta la tierra: añade una tierra (GND) al nudo de referencia');
    let nn = 0;
    const nudoDeClave = (k) => { const r = raiz(k); if (!nombre.has(r)) { let q; do { q = `n${++nn}`; } while (usados.has(q)); nombre.set(r, q); usados.add(q); } return nombre.get(r); };
    // patillas sueltas
    const cuenta = new Map(); for (const c of comps) for (const k of pinesDe.get(c.id)) cuenta.set(raiz(k), (cuenta.get(raiz(k)) || 0) + 1);
    for (const w of sc.cables || []) { cuenta.set(raiz(clave(w.a)), (cuenta.get(raiz(clave(w.a))) || 0) + 2); }
    for (const c of comps) { if (['GND', 'ETIQ', 'SONDA'].includes(c.t)) continue; for (const k of pinesDe.get(c.id)) if ((cuenta.get(raiz(k)) || 0) < 2) aviso(c.id, `${c.id}: tiene una patilla sin conectar`); }
    const pinNet = {}; for (const c of comps) pinNet[c.id] = pinesDe.get(c.id).map(nudoDeClave);

    const el = [], elementosDe = {}, sondas = [], medidores = [], ids = new Set(comps.map((c) => c.id));
    const add = (c, e) => { el.push(e); (elementosDe[c.id] ||= []).push(e.id); };
    const interno = (c, s) => `${c.id}~${s}`;
    const onda = (c) => {
      const f = c.v.forma || 'cc', o = { tipo: f };
      if (f === 'cc') o.v = lee(c, 'v', 'el valor');
      else if (['seno', 'cuadrada', 'triangular', 'diente'].includes(f)) { o.A = lee(c, 'A', 'la amplitud'); o.f = lee(c, 'f', 'la frecuencia'); if (!(o.f > 0)) aviso(c.id, `${c.id}: la frecuencia debe ser mayor que 0`); o.off = lee(c, 'off', 'la continua añadida', { vacio: true }) || 0; o.eficaz = c.v.eficaz === 'eficaz'; if (f === 'seno') o.fase = lee(c, 'fase', 'la fase', { vacio: true }) || 0; if (f === 'cuadrada') o.duty = (lee(c, 'duty', 'el ciclo de trabajo', { vacio: true }) ?? 50) / 100; }
      else if (f === 'escalon') { o.v1 = lee(c, 'v1', 'el nivel bajo'); o.v2 = lee(c, 'v2', 'el nivel alto'); o.t0 = lee(c, 't0', 'el instante', { vacio: true }) || 0; }
      else if (f === 'pulso') { o.v1 = lee(c, 'v1', 'el nivel bajo'); o.v2 = lee(c, 'v2', 'el nivel alto'); for (const [k, n] of [['td', 'el retardo'], ['tr', 'el tiempo de subida'], ['tf', 'el tiempo de bajada']]) o[k] = lee(c, k, n, { vacio: true }) || 0; o.pw = lee(c, 'pw', 'el ancho'); o.per = lee(c, 'per', 'el periodo'); }
      return o;
    };
    for (const c of comps) {
      const p = pinNet[c.id], d = cat[c.t], id = c.id;
      switch (c.t) {
        case 'R': add(c, { id, t: 'R', p, R: lee(c, 'R') }); break;
        case 'LAMP': add(c, { id, t: 'R', p, R: lee(c, 'R') }); break;
        case 'POT': { const R = lee(c, 'R'), x = Math.min(0.999, Math.max(0.001, lee(c, 'pos', 'la posición'))); add(c, { id: `${id}a`, t: 'R', p: [p[0], p[2]], R: R * x }); add(c, { id: `${id}b`, t: 'R', p: [p[2], p[1]], R: R * (1 - x) }); break; }
        case 'C': case 'CP': add(c, { id, t: 'C', p, C: lee(c, 'C') }); break;
        case 'L': add(c, { id, t: 'L', p, L: lee(c, 'L') }); break;
        case 'ZRL': { const m = interno(c, 'm'); add(c, { id: `${id}r`, t: 'R', p: [p[0], m], R: lee(c, 'R') }); add(c, { id: `${id}l`, t: 'L', p: [m, p[1]], L: lee(c, 'L') }); break; }
        case 'ZRC': { const m = interno(c, 'm'); add(c, { id: `${id}r`, t: 'R', p: [p[0], m], R: lee(c, 'R') }); add(c, { id: `${id}c`, t: 'C', p: [m, p[1]], C: lee(c, 'C') }); break; }
        case 'V': add(c, { id, t: 'V', p, onda: onda(c) }); break;
        case 'PILA': add(c, { id, t: 'V', p, onda: { tipo: 'cc', v: lee(c, 'v', 'la tensión') } }); break;
        case 'I': add(c, { id, t: 'I', p, onda: onda(c) }); break;
        case 'GND': case 'ETIQ': break;
        case 'SONDA': sondas.push({ id, net: p[0], canal: +(c.v.canal || 1) }); break;
        case 'VV': add(c, { id, t: 'VV', p, k: lee(c, 'k', 'la ganancia') }); break;
        case 'IV': add(c, { id, t: 'IV', p, g: lee(c, 'g', 'la transconductancia') }); break;
        case 'VI': case 'II': {
          const x = comps.find((q) => q.id.toLowerCase() === String(c.v.ctrl || '').trim().toLowerCase());
          if (!x) aviso(id, `${id}: no hay ningún componente llamado ${c.v.ctrl}`);
          add(c, c.t === 'VI' ? { id, t: 'VI', p, r: lee(c, 'r', 'la transresistencia'), ctrl: x.id } : { id, t: 'II', p, beta: lee(c, 'beta', 'la ganancia'), ctrl: x.id }); break;
        }
        case 'SW': add(c, { id, t: 'SW', p, estado: c.v.estado, tc: lee(c, 'tc', 'el instante', { vacio: true }) }); break;
        case 'SPDT': { const tc = lee(c, 'tc', 'el instante', { vacio: true }); add(c, { id: `${id}a`, t: 'SW', p: [p[0], p[1]], estado: c.v.estado === 'arriba' ? 'cerrado' : 'abierto', tc }); add(c, { id: `${id}b`, t: 'SW', p: [p[0], p[2]], estado: c.v.estado === 'arriba' ? 'abierto' : 'cerrado', tc }); break; }
        case 'TR': add(c, { id, t: 'TR', p, n: lee(c, 'n', 'la relación') }); break;
        case 'TRR': {
          const m1 = interno(c, 'a'), m2 = interno(c, 'b'), m3 = interno(c, 'c'), m4 = interno(c, 'd');
          add(c, { id: `${id}Rp`, t: 'R', p: [p[0], m1], R: lee(c, 'Rp') }); add(c, { id: `${id}Lp`, t: 'L', p: [m1, m2], L: lee(c, 'Lp') }); add(c, { id: `${id}Lm`, t: 'L', p: [m2, p[1]], L: lee(c, 'Lm') });
          add(c, { id: `${id}T`, t: 'TR', p: [m2, p[1], m3, p[3]], n: lee(c, 'n', 'la relación') }); add(c, { id: `${id}Ls`, t: 'L', p: [m3, m4], L: lee(c, 'Ls') }); add(c, { id: `${id}Rs`, t: 'R', p: [m4, p[2]], R: lee(c, 'Rs') }); break;
        }
        case 'KL': add(c, { id: `${id}1`, t: 'L', p: [p[0], p[1]], L: lee(c, 'L1') }); add(c, { id: `${id}2`, t: 'L', p: [p[2], p[3]], L: lee(c, 'L2') }); add(c, { id: `${id}K`, t: 'K', l1: `${id}1`, l2: `${id}2`, k: lee(c, 'k', 'el acoplamiento') }); break;
        case 'D': case 'LED': add(c, { id, t: c.t, p, Is: lee(c, 'Is'), n: lee(c, 'n') }); break;
        case 'Z': add(c, { id, t: 'Z', p, Vz: lee(c, 'Vz'), Is: lee(c, 'Is') }); break;
        case 'BJT': case 'PNP': add(c, { id, t: 'BJT', p, bf: lee(c, 'bf'), Is: lee(c, 'Is'), pnp: !!d.pnp }); break;
        case 'NMOS': case 'PMOS': add(c, { id, t: 'MOS', p, k: lee(c, 'k'), Vth: lee(c, 'Vth'), lambda: lee(c, 'lambda'), pmos: !!d.pmos }); break;
        case 'AO': add(c, { id, t: 'AO', p }); break;
        case 'AOR': add(c, { id, t: 'AOR', p, A: lee(c, 'A'), Vsat: lee(c, 'Vsat') }); break;
        case 'COMP': add(c, { id, t: 'COMP', p, Vsat: lee(c, 'Vsat') }); break;
        case 'VM': add(c, { id, t: 'VM', p }); medidores.push({ id, medida: 'V', de: id }); break;
        case 'AM': add(c, { id, t: 'AM', p }); medidores.push({ id, medida: 'I', de: id }); break;
        case 'WM': add(c, { id: `${id}i`, t: 'AM', p: [p[0], p[1]] }); add(c, { id: `${id}v`, t: 'VM', p: [p[2], p[3]] }); medidores.push({ id, medida: 'P', i: `${id}i`, v: `${id}v` }); break;
        case 'FT': { const Vf = lee(c, 'Vf'), f = lee(c, 'f'); for (const e of SimCircuitos.trifasica(id, [p[0], p[1], p[2], p[3]], Vf, f)) add(c, e); break; }
        case 'FTD': { const VL = lee(c, 'VL'), f = lee(c, 'f'); [[p[0], p[1], 30, 'RS'], [p[1], p[2], -90, 'ST'], [p[2], p[0], 150, 'TR']].forEach(([a, b, fa, n]) => add(c, { id: `${id}${n}`, t: 'V', p: [a, b], onda: { tipo: 'seno', A: VL, eficaz: true, f, fase: fa } })); break; }
        case 'CT': { const R = lee(c, 'R'), L = lee(c, 'L', 'la inductancia', { vacio: true }) || 0; ['R', 'S', 'T'].forEach((n, i) => { const m = interno(c, n); if (L > 0) { add(c, { id: `${id}${n}r`, t: 'R', p: [p[i], m], R }); add(c, { id: `${id}${n}l`, t: 'L', p: [m, p[3]], L }); } else add(c, { id: `${id}${n}r`, t: 'R', p: [p[i], p[3]], R }); }); break; }
        case 'CTD': { const R = lee(c, 'R'), L = lee(c, 'L', 'la inductancia', { vacio: true }) || 0; [[0, 1, 'RS'], [1, 2, 'ST'], [2, 0, 'TR']].forEach(([i, j, n]) => { const m = interno(c, n); if (L > 0) { add(c, { id: `${id}${n}r`, t: 'R', p: [p[i], m], R }); add(c, { id: `${id}${n}l`, t: 'L', p: [m, p[j]], L }); } else add(c, { id: `${id}${n}r`, t: 'R', p: [p[i], p[j]], R }); }); break; }
        default:
          if (d.fn) add(c, { id, t: 'GATE', fn: d.fn, Vcc: lee(c, 'Vcc'), p }); else aviso(id, `${id}: componente sin modelo`);
      }
    }
    const net = { elementos: el };
    return { net, pinNet, sondas, medidores, elementosDe, nudoDe: (x, y) => nudoDeClave(`${x},${y}`) };
  }
  return { extraer };
})();
if (typeof module !== 'undefined') module.exports = ExtraerSim;
