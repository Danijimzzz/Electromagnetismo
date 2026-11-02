/* =====================================================================
   Simulador de circuitos · importar y exportar redes en texto tipo SPICE
   (sin DOM). `exporta(sc)` escribe el esquema como lista de elementos entre
   nudos (R C L V I E G H F D Q M K, con sus .model, .op y .tran);
   `importa(texto)` hace lo contrario y devuelve { sc, avisos }: cada pieza
   se coloca suelta con una etiqueta de nudo en cada patilla (el nudo 0 lleva
   una tierra), como ImportarSim, así que el circuito es siempre correcto y
   se puede recolocar. Lo que no tiene equivalente (interruptores, puertas,
   transformadores, subcircuitos, PWL…) se avisa en vez de callar.
   Va en scripts tras extraer.js y antes de app.js; la prueba está en
   pruebas/herramientas/simulador.js. La interfaz (panel SPICE) está en app.js.
   ===================================================================== */
const SpiceSim = (() => {
  const SUF = { f: 1e-15, p: 1e-12, n: 1e-9, u: 1e-6, m: 1e-3, k: 1e3, meg: 1e6, g: 1e9, t: 1e12, mil: 25.4e-6 };
  // número de SPICE («4k7» no: «4.7k», «1meg», «10uF», «1e-9») → número, NaN si no se entiende
  function num(s) {
    const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(meg|mil|[fpnumgt]|k)?[a-z]*$/i.exec(String(s ?? '').trim());
    return m ? +m[1] * (m[2] ? SUF[m[2].toLowerCase()] : 1) : NaN;
  }
  const sp = (x) => String(+x.toPrecision(10));
  // número → texto de un campo del simulador (con prefijo o unidad, para que leeSI no aplique la base del campo)
  const PRE = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  function campo(x, un = '') {
    if (x === 0) return `0${un}`;
    const a = Math.abs(x), p = PRE.find(([v]) => a >= v * 0.9999999);
    if (!p || a >= 1e12) return `${String(+x.toPrecision(10)).replace('.', ',')}${un}`;
    const mant = +(x / p[0]).toPrecision(6);
    if (Math.abs(mant * p[0] - x) > 1e-9 * a) return `${String(+x.toPrecision(10))}${un}`;
    return `${String(mant).replace('.', ',')}${p[1] || un}`;
  }

  /* ---------- Exportar ---------- */
  function exporta(sc) {
    const C = CompSim.C, ext = ExtraerSim.extraer(sc), comps = sc.componentes, avisos = [], lin = [], modelos = [];
    const nudo = (s) => String(s).replace(/[^\w]/g, '_'), N = (c) => ext.pinNet[c.id].map(nudo);
    const letraDe = { R: 'R', LAMP: 'R', POT: 'R', ZRL: 'R', ZRC: 'R', C: 'C', CP: 'C', L: 'L', KL: 'L', V: 'V', PILA: 'V', AM: 'V', I: 'I', VV: 'E', AOR: 'E', IV: 'G', VI: 'H', II: 'F', D: 'D', Z: 'D', LED: 'D', BJT: 'Q', PNP: 'Q', NMOS: 'M', PMOS: 'M' };
    // nombre SPICE: el mismo id si ya empieza por la letra; si no, la letra y la cifra final (E1 → V1) o, si choca, la letra y el id entero
    const nombres = {}, tomados = new Set();
    for (const c of comps) {
      const l = letraDe[c.t]; if (!l) continue;
      let n = c.id.toUpperCase().startsWith(l) ? c.id : l + (/\d+$/.exec(c.id) || [''])[0];
      if (tomados.has(n.toUpperCase()) || n === l) n = l + c.id;
      tomados.add(n.toUpperCase()); nombres[c.id] = n;
    }
    const nombre = (c) => nombres[c.id];
    const v = (c, k) => { const d = C[c.t].campos.find((f) => f.k === k); return Herramienta.leeSI(c.v[k], d?.base ?? 1); };
    const noSale = (c, motivo) => { lin.push(`* ${c.id} (${C[c.t].nombre}): ${motivo}`); avisos.push(`${c.id}: ${motivo}`); };
    const onda = (c) => {
      const f = c.v.forma || 'cc', A = () => v(c, 'A') * (c.v.eficaz === 'eficaz' ? Math.SQRT2 : 1), off = () => (String(c.v.off ?? '').trim() ? v(c, 'off') : 0);
      switch (f) {
        case 'cc': return `DC ${sp(v(c, 'v'))}`;
        case 'seno': return `SIN(${sp(off())} ${sp(A())} ${sp(v(c, 'f'))} 0 0 ${sp(String(c.v.fase ?? '').trim() ? v(c, 'fase') : 0)})`;
        case 'cuadrada': { const T = 1 / v(c, 'f'), d = String(c.v.duty ?? '').trim() ? v(c, 'duty') / 100 : 0.5; return `PULSE(${sp(off() - A())} ${sp(off() + A())} 0 1n 1n ${sp(d * T)} ${sp(T)})`; }
        case 'pulso': { const g = (k) => (String(c.v[k] ?? '').trim() ? v(c, k) : 0); return `PULSE(${sp(g('v1'))} ${sp(g('v2'))} ${sp(g('td'))} ${sp(g('tr'))} ${sp(g('tf'))} ${sp(g('pw'))} ${sp(g('per'))})`; }
        case 'escalon': return `PULSE(${sp(v(c, 'v1'))} ${sp(v(c, 'v2'))} ${sp(String(c.v.t0 ?? '').trim() ? v(c, 't0') : 0)} 1n 1n 1e9 2e9)`;
        default: avisos.push(`${c.id}: la onda ${f} no existe en SPICE; se exporta solo su continua`); return `DC ${sp(String(c.v.off ?? '').trim() ? v(c, 'off') : 0)}`;
      }
    };
    const ctrlDe = (c) => {
      const x = comps.find((q) => q.id.toLowerCase() === String(c.v.ctrl || '').trim().toLowerCase());
      if (x && ['V', 'PILA', 'AM'].includes(x.t)) return nombre(x);
      noSale(c, 'en SPICE la corriente de control tiene que pasar por una fuente de tensión (o amperímetro)'); return null;
    };
    lin.push(`* Ciencify · Simulador de circuitos · ${new Date().toISOString().slice(0, 10)}`);
    for (const c of comps) {
      const p = N(c), n = nombre(c), t = c.t;
      switch (t) {
        case 'R': case 'LAMP': lin.push(`${n} ${p[0]} ${p[1]} ${sp(v(c, 'R'))}`); break;
        case 'C': case 'CP': lin.push(`${n} ${p[0]} ${p[1]} ${sp(v(c, 'C'))}`); break;
        case 'L': lin.push(`${n} ${p[0]} ${p[1]} ${sp(v(c, 'L'))}`); break;
        case 'POT': { const R = v(c, 'R'), x = Math.min(0.999, Math.max(0.001, v(c, 'pos'))); lin.push(`${n}a ${p[0]} ${p[2]} ${sp(R * x)}`, `${n}b ${p[2]} ${p[1]} ${sp(R * (1 - x))}`); break; }
        case 'ZRL': lin.push(`R${c.id}r ${p[0]} ${nudo(c.id)}_m ${sp(v(c, 'R'))}`, `L${c.id}l ${nudo(c.id)}_m ${p[1]} ${sp(v(c, 'L'))}`); break;
        case 'ZRC': lin.push(`R${c.id}r ${p[0]} ${nudo(c.id)}_m ${sp(v(c, 'R'))}`, `C${c.id}c ${nudo(c.id)}_m ${p[1]} ${sp(v(c, 'C'))}`); break;
        case 'V': lin.push(`${n} ${p[0]} ${p[1]} ${onda(c)}`); break;
        case 'PILA': lin.push(`${n} ${p[0]} ${p[1]} DC ${sp(v(c, 'v'))}`); break;
        case 'I': lin.push(`${n} ${p[0]} ${p[1]} ${onda(c)}`); break;
        case 'AM': lin.push(`${n} ${p[0]} ${p[1]} DC 0`); break;
        case 'VV': lin.push(`${n} ${p[0]} ${p[1]} ${p[2]} ${p[3]} ${sp(v(c, 'k'))}`); break;
        case 'IV': lin.push(`${n} ${p[0]} ${p[1]} ${p[2]} ${p[3]} ${sp(v(c, 'g'))}`); break;
        case 'VI': { const q = ctrlDe(c); if (q) lin.push(`${n} ${p[0]} ${p[1]} ${q} ${sp(v(c, 'r'))}`); break; }
        case 'II': { const q = ctrlDe(c); if (q) lin.push(`${n} ${p[0]} ${p[1]} ${q} ${sp(v(c, 'beta'))}`); break; }
        case 'KL': lin.push(`L${c.id}1 ${p[0]} ${p[1]} ${sp(v(c, 'L1'))}`, `L${c.id}2 ${p[2]} ${p[3]} ${sp(v(c, 'L2'))}`, `K${c.id} L${c.id}1 L${c.id}2 ${sp(v(c, 'k'))}`); break;
        case 'D': case 'LED': { const m = `${t === 'LED' ? 'LED' : 'D'}_${nudo(c.id)}`; lin.push(`${n} ${p[0]} ${p[1]} ${m}`); modelos.push(`.model ${m} D(IS=${sp(v(c, 'Is'))} N=${sp(v(c, 'n'))})`); break; }
        case 'Z': { const m = `DZ_${nudo(c.id)}`; lin.push(`${n} ${p[0]} ${p[1]} ${m}`); modelos.push(`.model ${m} D(IS=${sp(v(c, 'Is'))} BV=${sp(v(c, 'Vz'))} IBV=1m)`); break; }
        case 'BJT': case 'PNP': { const m = `Q_${nudo(c.id)}`; lin.push(`${n} ${p[0]} ${p[1]} ${p[2]} ${m}`); modelos.push(`.model ${m} ${t === 'BJT' ? 'NPN' : 'PNP'}(BF=${sp(v(c, 'bf'))} IS=${sp(v(c, 'Is'))})`); break; }
        case 'NMOS': case 'PMOS': { const m = `M_${nudo(c.id)}`, vth = v(c, 'Vth'); lin.push(`${n} ${p[0]} ${p[1]} ${p[2]} ${p[2]} ${m}`); modelos.push(`.model ${m} ${t === 'NMOS' ? 'NMOS' : 'PMOS'}(LEVEL=1 KP=${sp(v(c, 'k'))} VTO=${sp(t === 'NMOS' ? vth : -vth)} LAMBDA=${sp(v(c, 'lambda'))})`); break; }
        case 'AOR': lin.push(`${n} ${p[2]} 0 ${p[0]} ${p[1]} ${sp(v(c, 'A'))}`); avisos.push(`${c.id}: se exporta como fuente controlada de ganancia A, sin la saturación de ±${c.v.Vsat} V`); break;
        case 'GND': case 'ETIQ': case 'SONDA': break;
        case 'VM': lin.push(`* ${c.id}: voltímetro entre ${p[0]} y ${p[1]}`); break;
        case 'SW': case 'SPDT': noSale(c, 'los interruptores no se exportan (en SPICE llevan un modelo propio)'); break;
        case 'TR': case 'TRR': noSale(c, 'el transformador ideal o real no tiene equivalente directo; usa bobinas acopladas (K)'); break;
        case 'AO': noSale(c, 'el operacional ideal no existe en SPICE; usa el real con ganancia grande'); break;
        default: noSale(c, `${C[t].nombre} no se puede exportar`);
      }
    }
    lin.push(...modelos, '.op');
    const tf = Herramienta.leeSI(sc.analisis?.tfin || '', 1); if (isFinite(tf) && tf > 0) lin.push(`.tran ${sp(tf / 1000)} ${sp(tf)}`);
    lin.push('.end');
    return { texto: lin.join('\n') + '\n', avisos, nombres };
  }

  /* ---------- Importar ---------- */
  function importa(texto) {
    const avisos = [], filas = [];
    // líneas lógicas: sin comentarios, con las continuaciones («+») unidas
    String(texto ?? '').replace(/\r/g, '').split('\n').forEach((l, i) => {
      const t = l.replace(/[;$].*$/, '');
      if (/^\s*\*/.test(t) || !t.trim()) return;
      if (/^\s*\+/.test(t) && filas.length) filas[filas.length - 1].s += ' ' + t.replace(/^\s*\+/, ''); else filas.push({ n: i + 1, s: t.trim() });
    });
    const trocea = (s) => s.replace(/\s*=\s*/g, '=').replace(/[(),]/g, ' ').trim().split(/\s+/);
    // la primera línea es el título (se ignora) salvo que ya sea un elemento o una orden
    if (filas.length && !/^\./.test(filas[0].s)) {
      const t = trocea(filas[0].s), l = t[0][0].toUpperCase(), ok = { R: 4, C: 4, L: 4, V: 3, I: 3, E: 6, G: 6, H: 5, F: 5, D: 4, Q: 5, M: 6, K: 4 }[l];
      const dato = { R: 3, C: 3, L: 3, E: 5, G: 5, H: 4, F: 4, K: 3 }[l];
      if (!(ok && t.length >= ok && (dato === undefined || isFinite(num(t[dato]))))) filas.shift();
    }
    const modelos = {};
    for (const f of filas) {
      if (!/^\.model\b/i.test(f.s)) continue;
      const t = trocea(f.s), par = {}; t.slice(3).forEach((q) => { const [k, x] = q.split('='); if (x !== undefined) par[k.toUpperCase()] = num(x); });
      modelos[t[1].toLowerCase()] = { tipo: (t[2] || '').toUpperCase(), par };
    }
    const comps = [], cableado = []; let tfin = null;
    const usados = new Set(), ids = new Map();
    const idUnico = (nom) => { let id = nom, k = 1; while (usados.has(id.toLowerCase())) id = `${nom}_${++k}`; usados.add(id.toLowerCase()); return id; };
    const nodos = (t, n) => t.slice(1, 1 + n);
    const w = (f, m) => avisos.push(`Línea ${f.n}: ${m}`);
    const campoNum = (f, s, q, un = '') => { const x = num(s); if (!isFinite(x)) { w(f, `no entiendo el valor «${s}» de ${q}`); return null; } return campo(x, un); };
    const onda = (f, t, un, v) => {
      let dc = null, i = 3;
      const sal = (k) => { const x = num(t[k]); return isFinite(x) ? x : null; };
      for (; i < t.length; i++) {
        const u = t[i].toUpperCase();
        if (u === 'DC') { dc = t[++i]; } else if (u === 'AC') { i++; if (isFinite(num(t[i + 1]))) i++; w(f, 'se ignora el valor AC (el simulador saca los fasores de las fuentes sinusoidales)'); }
        else if (u === 'SIN' || u === 'PULSE') {
          const a = []; while (isFinite(num(t[i + 1])) && i + 1 < t.length) a.push(num(t[++i]));
          if (u === 'SIN') {
            if (a[3] || a[4]) w(f, 'se ignoran el retardo y el amortiguamiento de la sinusoidal');
            Object.assign(v, { forma: 'seno', off: campo(a[0] || 0, un), A: campo(a[1] ?? 0, un), eficaz: 'de pico', f: campo(a[2] ?? 0, 'Hz'), fase: String(a[5] || 0) });
          } else Object.assign(v, { forma: 'pulso', v1: campo(a[0] ?? 0, un), v2: campo(a[1] ?? 0, un), td: campo(a[2] || 0, 's'), tr: campo(a[3] || 0, 's'), tf: campo(a[4] || 0, 's'), pw: campo(a[5] ?? 0, 's'), per: campo(a[6] ?? 0, 's') });
        } else if (['PWL', 'EXP', 'SFFM', 'AM'].includes(u)) { w(f, `la onda ${u} no se puede importar; se deja la fuente en 0`); break; }
        else if (dc === null && isFinite(num(t[i]))) dc = t[i];
      }
      if (v.forma === 'cc' || !v.forma) { v.forma = 'cc'; v.v = dc === null ? '0' : (campoNum(f, dc, 'la fuente', un) ?? '0'); }
      return v;
    };
    const pend = [];
    for (const f of filas) {
      if (/^\./.test(f.s)) {
        const t = trocea(f.s), o = t[0].toLowerCase();
        if (o === '.tran') { const x = num(t[2]); if (isFinite(x)) tfin = campo(x, 's'); }
        else if (['.subckt', '.ends', '.param', '.include', '.lib', '.ic', '.func', '.global'].includes(o)) w(f, `la orden ${o} no está soportada y se ignora`);
        else if (['.ac', '.dc', '.noise', '.four'].includes(o)) w(f, `el análisis ${o} se ignora: el simulador tiene sus pestañas de Bode, fasores y continua`);
        continue;
      }
      const t = trocea(f.s), nom = t[0], L = nom[0].toUpperCase();
      if (!/^[A-Za-z]/.test(nom)) { w(f, `línea no reconocida: «${f.s.slice(0, 40)}»`); continue; }
      const min = { R: 4, C: 4, L: 4, V: 3, I: 3, E: 6, G: 6, H: 5, F: 5, D: 4, Q: 5, M: 6, K: 4 }[L];
      if (!min) { w(f, `${nom}: el elemento tipo ${L} no está soportado (${L === 'X' ? 'subcircuitos' : L === 'S' || L === 'W' ? 'interruptores' : L === 'B' ? 'fuentes con expresión' : L === 'T' ? 'líneas de transmisión' : 'no existe en el simulador'}) y se omite`); continue; }
      if (t.length < min) { w(f, `${nom}: faltan datos`); continue; }
      let pines, tipo, v = null;
      try {
        switch (L) {
          case 'R': case 'C': case 'L': {
            tipo = L; const x = campoNum(f, t[3], nom, { R: 'Ω', C: 'F', L: 'H' }[L]); if (x === null) continue;
            pines = nodos(t, 2); v = { [L]: x }; break;
          }
          case 'V': case 'I': tipo = L; pines = nodos(t, 2); v = onda(f, t, L === 'V' ? 'V' : 'A', { ...CompSim.vacio(L) }); break;
          case 'E': case 'G': {
            if (/^(poly|value|table|laplace)$/i.test(t[3])) { w(f, `${nom}: las fuentes con ${t[3].toUpperCase()} no están soportadas y se omiten`); continue; }
            tipo = L === 'E' ? 'VV' : 'IV'; const x = campoNum(f, t[5], nom, L === 'G' ? 'S' : ''); if (x === null) continue;
            pines = nodos(t, 4); v = L === 'E' ? { k: x } : { g: x }; break;
          }
          case 'H': case 'F': {
            tipo = L === 'H' ? 'VI' : 'II'; const x = campoNum(f, t[4], nom, L === 'H' ? 'Ω' : ''); if (x === null) continue;
            pines = nodos(t, 2); v = L === 'H' ? { r: x, ctrl: t[3] } : { beta: x, ctrl: t[3] }; break;
          }
          case 'K': pend.push({ f, nom, l1: t[1], l2: t[2], k: num(t[3]) }); continue;
          case 'D': {
            const m = modelos[(t[3] || '').toLowerCase()]; if (!m) w(f, `${nom}: el modelo «${t[3]}» no está definido; se usan los valores por omisión`);
            const par = m ? m.par : {}, led = /^led/i.test(t[3] || '');
            if (par.BV > 0) { tipo = 'Z'; v = { Vz: campo(par.BV, 'V'), Is: campo(par.IS ?? 1e-14, 'A') }; } else { tipo = led ? 'LED' : 'D'; v = { Is: campo(par.IS ?? (led ? 1e-18 : 1e-14), 'A'), n: String(par.N ?? (led ? 2 : 1)).replace('.', ',') }; }
            pines = nodos(t, 2); break;
          }
          case 'Q': {
            const mod = t.slice(4).find((q) => modelos[q.toLowerCase()]) || t[4], m = modelos[(mod || '').toLowerCase()]; if (!m) w(f, `${nom}: el modelo «${mod}» no está definido; se toma un NPN con β = 100`);
            const par = m ? m.par : {}; tipo = m && m.tipo === 'PNP' ? 'PNP' : 'BJT'; v = { bf: String(par.BF ?? 100).replace('.', ','), Is: campo(par.IS ?? 1e-14, 'A') }; pines = nodos(t, 3); break;
          }
          case 'M': {
            const m = modelos[(t[5] || '').toLowerCase()]; if (!m) w(f, `${nom}: el modelo «${t[5]}» no está definido; se usan los valores por omisión`);
            const par = m ? m.par : {}, g = (k) => { const q = t.find((s) => s.toUpperCase().startsWith(k + '=')); return q ? num(q.slice(k.length + 1)) : 1; };
            tipo = m && m.tipo === 'PMOS' ? 'PMOS' : 'NMOS'; v = { k: campo((par.KP ?? 2e-5) * g('W') / g('L')), Vth: campo(Math.abs(par.VTO ?? 1), 'V'), lambda: String(par.LAMBDA ?? 0).replace('.', ',') }; pines = nodos(t, 3); break;
          }
        }
      } catch (e) { w(f, `${nom}: no se entiende (${e.message})`); continue; }
      comps.push({ nom, id: idUnico(nom), t: tipo, v, pines: pines.map((q) => q.toLowerCase()), nombres: pines });
    }
    // bobinas acopladas: las dos bobinas y el K se juntan en una pieza «Bobinas acopladas»
    for (const k of pend) {
      const a = comps.find((c) => c.t === 'L' && c.nom.toLowerCase() === k.l1.toLowerCase()), b = comps.find((c) => c.t === 'L' && c.nom.toLowerCase() === k.l2.toLowerCase());
      if (!a || !b || a === b || !isFinite(k.k)) { w(k.f, `${k.nom}: no encuentro sus dos bobinas`); continue; }
      comps.splice(comps.indexOf(a), 1); comps.splice(comps.indexOf(b), 1);
      comps.push({ nom: k.nom, id: idUnico(k.nom), t: 'KL', v: { L1: a.v.L, L2: b.v.L, k: String(k.k).replace('.', ',') }, pines: [...a.pines, ...b.pines], nombres: [...a.nombres, ...b.nombres] });
    }
    // fuentes controladas por corriente: la fuente de control tiene que existir
    for (const c of comps) if (c.t === 'VI' || c.t === 'II') { const x = comps.find((q) => q.nom.toLowerCase() === c.v.ctrl.toLowerCase() && ['V', 'AM'].includes(q.t)); if (x) c.v.ctrl = x.id; else avisos.push(`${c.nom}: no encuentro la fuente de tensión ${c.v.ctrl} que mide la corriente de control`); }
    if (!comps.length) return { sc: null, avisos: avisos.length ? avisos : ['No he encontrado ningún elemento (R, C, L, V, I, E, G, H, F, D, Q, M, K)'] };

    // colocación: cuadrícula de tres columnas, cada pieza con una etiqueta de nudo en cada patilla
    const piezas = [], cables = [], bautiza = {}; let g = 0, n = 0;
    const etiqueta = (nombre) => { const k = nombre.toLowerCase(); return bautiza[k] ||= nombre; };
    comps.forEach((c, i) => {
      const col = i % 3, fila = Math.floor(i / 3), x = 7 + col * 19, y = 6 + fila * 10;
      const vac = CompSim.vacio(c.t), pieza = { id: c.id, t: c.t, x, y, rot: 0, espejo: false, v: { ...vac, ...c.v } };
      piezas.push(pieza);
      Esquema.pines(pieza, CompSim.C).forEach(([px, py], k) => {
        const nombre = c.nombres[k]; if (nombre === undefined) return;
        const izq = px <= x, arriba = py < y && px > x && px < x + 4, abajo = py > y && px > x && px < x + 4;
        const [dx, dy, rot] = izq ? [-2, 0, 2] : arriba ? [0, -2, 3] : abajo ? [0, 2, 1] : [2, 0, 0];
        const ex = px + dx, ey = py + dy;
        cables.push({ a: [px, py], b: [ex, ey] });
        if (['0', 'gnd'].includes(nombre.toLowerCase())) piezas.push({ id: `GND${++g}`, t: 'GND', x: ex, y: ey, rot: 0, espejo: false, v: CompSim.vacio('GND') });
        else piezas.push({ id: `N${++n}`, t: 'ETIQ', x: ex, y: ey, rot, espejo: false, v: { nombre: etiqueta(nombre) } });
      });
    });
    const sc = { version: 2, componentes: piezas, cables, analisis: tfin ? { tfin } : {}, vista: null };
    if (!comps.some((c) => c.pines.some((q) => ['0', 'gnd'].includes(q)))) avisos.push('La red no tiene nudo 0 (tierra): añade una tierra al esquema para poder resolverla');
    return { sc, avisos };
  }
  return { num, campo, exporta, importa };
})();
if (typeof module !== 'undefined') module.exports = SpiceSim;
