/* =====================================================================
   Ondas electromagnéticas planas (sin DOM): onda plana armónica en el
   vacío o en un medio (εr, μr) con su frecuencia, longitud de onda,
   número de onda, el campo B con su dirección (k̂ × Ê), la expresión de
   E(r, t) y B(r, t), la impedancia, la intensidad y la presión de
   radiación; intensidad de una fuente puntual; y medios con pérdidas
   (conductividad σ): atenuación, profundidad de penetración e impedancia
   compleja. Unidades del SI.
   ===================================================================== */
const OndasEM = (() => {
  const C0 = 299792458, MU0 = 1.25663706212e-6, EPS0 = 8.8541878128e-12;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−').replace(/^(−?)1·10/, '$110');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/^(-?)10\^/, '$11e').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número (se admite 3e8 o 3·10^8)`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${may(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }

  /* ---------- Direcciones ---------- */
  const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const GORRO = { x: 'î', y: 'ĵ', z: 'k̂' };
  const dir = (s) => { const m = /^([+-]?)([xyz])$/.exec(s || ''); if (!m) throw new Error('Dirección no válida'); const e = EJES[m[2]].map((c) => (m[1] === '-' ? -c : c)); return { v: e, eje: m[2], signo: m[1] === '-' ? -1 : 1 }; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nomDir = (v) => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : ''}${GORRO['xyz'[i]]}`; };
  const dirExp = (v) => { const t = nomDir(v); return t[0] === '−' ? `(${t})` : t; };
  const dirTxt = (v) => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : '+'}${'xyz'[i]}`; };

  /* ---------- Espectro ---------- */
  const COLORES = [[380, 'violeta'], [450, 'azul'], [495, 'verde'], [570, 'amarillo'], [590, 'naranja'], [620, 'rojo'], [750, '']];
  function banda(fr) {
    const l = C0 / fr;
    if (l > 1) return 'ondas de radio';
    if (l > 1e-3) return 'microondas';
    if (l > 750e-9) return 'infrarrojo';
    if (l >= 380e-9) { const nm = l * 1e9; let c = 'rojo'; for (let i = 0; i < COLORES.length - 1; i++) if (nm >= COLORES[i][0] && nm < COLORES[i + 1][0]) c = COLORES[i][1]; return `luz visible (${c})`; }
    if (l > 10e-9) return 'ultravioleta';
    if (l > 10e-12) return 'rayos X';
    return 'rayos gamma';
  }

  /* ---------- Medio ---------- */
  function medio(sc) {
    const vacioM = sc.medio !== 'medio';
    const er = vacioM ? 1 : lee(sc, 'er', 'la permitividad relativa εr'), mr = vacioM || vacio(sc.mr) ? 1 : lee(sc, 'mr', 'la permeabilidad relativa μr');
    const eps = er * EPS0, mu = mr * MU0, v = 1 / Math.sqrt(eps * mu), n = Math.sqrt(er * mr), eta = Math.sqrt(mu / eps);
    return { vacioM, er, mr, eps, mu, v, n, eta };
  }
  // frecuencia a partir del dato que se dé (f, λ, ω o k) en un medio de velocidad v
  function frecuencia(sc, v) {
    const dato = ['f', 'lambda', 'omega', 'k'].includes(sc.dato) ? sc.dato : 'f';
    const x = lee(sc, 'valor', { f: 'la frecuencia f', lambda: 'la longitud de onda λ', omega: 'la frecuencia angular ω', k: 'el número de onda k' }[dato]);
    const fr = dato === 'f' ? x : dato === 'lambda' ? v / x : dato === 'omega' ? x / (2 * Math.PI) : (x * v) / (2 * Math.PI);
    return { dato, x, fr, w: 2 * Math.PI * fr, k: (2 * Math.PI * fr) / v, lam: v / fr, T: 1 / fr };
  }
  const medioTxt = (M) => (M.vacioM ? 'En el vacío: v = c = 1/√(μ<sub>0</sub>ε<sub>0</sub>) = 2,998·10<sup>8</sup> m/s, η<sub>0</sub> = √(μ<sub>0</sub>/ε<sub>0</sub>) = 376,7 Ω'
    : `Medio con ε<sub>r</sub> = ${f(M.er)}${M.mr !== 1 ? ` y μ<sub>r</sub> = ${f(M.mr)}` : ''}: índice n = √(ε<sub>r</sub>μ<sub>r</sub>) = ${f(M.n)}, v = c/n = ${f(M.v)} m/s, η = √(μ/ε) = η<sub>0</sub>·√(μ<sub>r</sub>/ε<sub>r</sub>) = ${f(M.eta)} Ω`);

  /* ---------- Onda plana ---------- */
  function onda(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'la amplitud E₀'), pasos = [];
    const K = dir(sc.prop || '+z'), Ed = dir(sc.pol || '+x');
    if (K.eje === Ed.eje) throw new Error('E tiene que ser perpendicular a la dirección de propagación (la onda es transversal)');
    const Bv = cruz(K.v, Ed.v), B0 = E0 / M.v;
    pasos.push({ t: 'Medio', html: medioTxt(M) });
    const fTxt = { f: `f = ${f(F.fr)} Hz ⇒ ω = 2πf = ${f(F.w)} rad/s`, lambda: `λ = ${f(F.x)} m ⇒ f = v/λ = ${f(M.v)}/${f(F.x)} = ${f(F.fr)} Hz, ω = 2πf = ${f(F.w)} rad/s`, omega: `ω = ${f(F.w)} rad/s ⇒ f = ω/(2π) = ${f(F.fr)} Hz`, k: `k = ${f(F.x)} rad/m ⇒ ω = kv = ${f(F.w)} rad/s, f = ${f(F.fr)} Hz` }[F.dato];
    pasos.push({ t: 'Frecuencia, longitud de onda y número de onda', html: `${fTxt}<br>λ = v/f = <b>${f(F.lam)} m</b>, &ensp; k = 2π/λ = ω/v = <b>${f(F.k)} rad/m</b>, &ensp; T = 1/f = ${f(F.T)} s${M.vacioM ? '' : `<br>En el vacío tendría λ<sub>0</sub> = c/f = ${f(C0 / F.fr)} m: dentro del medio λ = λ<sub>0</sub>/n.`}<br>Zona del espectro: ${banda(F.fr)}` });
    const ar = K.eje, s = K.signo > 0 ? '−' : '+', fase = `${f(F.k)}${ar} ${s} ${f(F.w)}t`;
    const Eexp = `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} V/m`, Bexp = `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} T`;
    pasos.push({ t: 'Campo magnético', html: `En una onda plana E, B y la dirección de propagación son perpendiculares entre sí y B<sub>0</sub> = E<sub>0</sub>/v = ${f(E0)}/${f(M.v)} = <b>${f(B0)} T</b><br>La dirección de B sale de k̂ = Ê × B̂, es decir B̂ = k̂ × Ê = (${nomDir(K.v)}) × (${nomDir(Ed.v)}) = <b>${nomDir(Bv)}</b>` });
    pasos.push({ t: 'Expresiones', html: `Con la forma cos(k·r − ωt), que avanza hacia ${dirTxt(K.v)}:<br>${Eexp}<br>${Bexp}` });
    const I = (E0 * E0) / (2 * M.eta), u = 0.5 * M.eps * E0 * E0;
    pasos.push({ t: 'Energía e intensidad', html: `Vector de Poynting S = (E × B)/μ, en la dirección ${nomDir(K.v)}. Su valor medio es la intensidad:<br>I = E<sub>0</sub><sup>2</sup>/(2η) = ${f(E0)}<sup>2</sup>/(2·${f(M.eta)}) = <b>${f(I)} W/m<sup>2</sup></b><br>Densidad media de energía u = ½εE<sub>0</sub><sup>2</sup> = ${f(u)} J/m<sup>3</sup> (la mitad en E y la mitad en B), y I = u·v.<br>Valores eficaces: E<sub>ef</sub> = E<sub>0</sub>/√2 = ${f(E0 / Math.SQRT2)} V/m, B<sub>ef</sub> = ${f(B0 / Math.SQRT2)} T` });
    pasos.push({ t: 'Presión de radiación', html: `Sobre una superficie que la absorbe, p = I/v = ${f(I / M.v)} Pa; si la refleja del todo, p = 2I/v = ${f((2 * I) / M.v)} Pa.` });
    return { modo: 'onda', M, F, E0, B0, K, Ed, Bv, I, u, Eexp, Bexp, fase, pa: I / M.v, alfa: 0, pasos };
  }

  /* ---------- Intensidad ---------- */
  function intensidad(sc) {
    const M = medio(sc), pasos = [], de = ['fuente', 'I', 'E0'].includes(sc.de) ? sc.de : 'fuente';
    let I, P = null, r = null;
    pasos.push({ t: 'Medio', html: medioTxt(M) });
    if (de === 'fuente') {
      P = lee(sc, 'P', 'la potencia P'); r = lee(sc, 'r', 'la distancia r'); I = P / (4 * Math.PI * r * r);
      pasos.push({ t: 'Intensidad a una distancia r', html: `Una fuente puntual reparte la potencia por igual en una esfera de área 4πr<sup>2</sup>:<br>I = P/(4πr<sup>2</sup>) = ${f(P)}/(4π·${f(r)}<sup>2</sup>) = <b>${f(I)} W/m<sup>2</sup></b>` });
    } else if (de === 'I') I = lee(sc, 'I', 'la intensidad I');
    let E0 = de === 'E0' ? lee(sc, 'E0', 'la amplitud E₀') : Math.sqrt(2 * M.eta * I);
    if (de === 'E0') { I = (E0 * E0) / (2 * M.eta); pasos.push({ t: 'Intensidad', html: `I = E<sub>0</sub><sup>2</sup>/(2η) = ${f(E0)}<sup>2</sup>/(2·${f(M.eta)}) = <b>${f(I)} W/m<sup>2</sup></b>` }); }
    else pasos.push({ t: 'Amplitud del campo eléctrico', html: `I = E<sub>0</sub><sup>2</sup>/(2η) ⇒ E<sub>0</sub> = √(2ηI) = √(2·${f(M.eta)}·${f(I)}) = <b>${f(E0)} V/m</b>` });
    const B0 = E0 / M.v;
    pasos.push({ t: 'Campo magnético y valores eficaces', html: `B<sub>0</sub> = E<sub>0</sub>/v = <b>${f(B0)} T</b><br>E<sub>ef</sub> = E<sub>0</sub>/√2 = ${f(E0 / Math.SQRT2)} V/m, &ensp; B<sub>ef</sub> = ${f(B0 / Math.SQRT2)} T` });
    const u = I / M.v, A = lee(sc, 'A', 'el área A', { opcional: true });
    pasos.push({ t: 'Energía y presión de radiación', html: `u = I/v = ${f(u)} J/m<sup>3</sup><br>p = I/v = ${f(I / M.v)} Pa si se absorbe y 2I/v = ${f((2 * I) / M.v)} Pa si se refleja${A !== null ? `<br>Sobre A = ${f(A)} m<sup>2</sup>: potencia que llega I·A = ${f(I * A)} W, fuerza ${f((I * A) / M.v)} N (absorbe) o ${f((2 * I * A) / M.v)} N (refleja)` : ''}` });
    return { modo: 'intensidad', M, de, P, r, I, E0, B0, u, A, pa: I / M.v, pasos };
  }

  /* ---------- Medio con pérdidas ---------- */
  function perdidas(sc) {
    const er = lee(sc, 'er', 'la permitividad relativa εr'), mr = vacio(sc.mr) ? 1 : lee(sc, 'mr', 'la permeabilidad relativa μr'), sg = lee(sc, 'sigma', 'la conductividad σ', { cero: true });
    const fr = lee(sc, 'valor', 'la frecuencia f'), w = 2 * Math.PI * fr, eps = er * EPS0, mu = mr * MU0, pasos = [];
    const tg = sg / (w * eps), raiz = Math.sqrt(1 + tg * tg), base = w * Math.sqrt((mu * eps) / 2);
    const alfa = base * Math.sqrt(raiz - 1), beta = base * Math.sqrt(raiz + 1), delta = alfa > 0 ? 1 / alfa : Infinity;
    const etaM = Math.sqrt(mu / eps) / Math.sqrt(raiz), th = 0.5 * Math.atan(tg), vf = w / beta, lam = (2 * Math.PI) / beta;
    const tipo = tg > 100 ? 'buen conductor' : tg < 0.01 ? 'buen dieléctrico (pocas pérdidas)' : 'medio con pérdidas moderadas';
    pasos.push({ t: 'Tangente de pérdidas', html: `ω = 2πf = ${f(w)} rad/s, ε = ε<sub>r</sub>ε<sub>0</sub> = ${f(eps)} F/m<br>σ/(ωε) = ${f(sg)}/(${f(w)}·${f(eps)}) = <b>${f(tg)}</b> ⇒ ${tipo}${tg > 100 ? ' (domina la corriente de conducción)' : tg < 0.01 ? ' (domina la de desplazamiento)' : ''}` });
    let h = `La constante de propagación es γ = α + jβ = √(jωμ(σ + jωε)), con<br>α = ω√(με/2)·√(√(1 + (σ/ωε)<sup>2</sup>) − 1) = <b>${f(alfa)} Np/m</b><br>β = ω√(με/2)·√(√(1 + (σ/ωε)<sup>2</sup>) + 1) = <b>${f(beta)} rad/m</b>`;
    if (tg > 100) h += `<br>En un buen conductor α ≈ β ≈ √(πfμσ) = ${f(Math.sqrt(Math.PI * fr * mu * sg))}`;
    else if (tg < 0.01 && sg > 0) h += `<br>Con pocas pérdidas α ≈ (σ/2)√(μ/ε) = ${f((sg / 2) * Math.sqrt(mu / eps))} y β ≈ ω√(με) = ${f(w * Math.sqrt(mu * eps))}`;
    pasos.push({ t: 'Atenuación y fase', html: h });
    pasos.push({ t: 'Profundidad de penetración', html: sg === 0 ? 'Sin conductividad no hay pérdidas: la onda no se atenúa (δ = ∞).' : `δ = 1/α = <b>${f(delta)} m</b>: a esa profundidad la amplitud baja a 1/e = 37 % y la intensidad a 1/e<sup>2</sup> = 13,5 %.` });
    pasos.push({ t: 'Velocidad, longitud de onda e impedancia', html: `v = ω/β = ${f(vf)} m/s, &ensp; λ = 2π/β = ${f(lam)} m<br>η = √(jωμ/(σ + jωε)) = |η|∠θ = <b>${f(etaM)} Ω ∠${f((th * 180) / Math.PI)}°</b>: el campo B va ${f((th * 180) / Math.PI)}° retrasado respecto a E.` });
    const E0 = lee(sc, 'E0', 'la amplitud E₀', { opcional: true }), d = lee(sc, 'd', 'la profundidad d', { opcional: true, cero: true });
    let Ed = null;
    if (E0 !== null) {
      let g = `E(z, t) = ${f(E0)} e<sup>−${f(alfa)}z</sup> cos(${f(beta)}z − ${f(w)}t) V/m`;
      if (d !== null) { Ed = E0 * Math.exp(-alfa * d); g += `<br>A z = ${f(d)} m: E = E<sub>0</sub>e<sup>−αz</sup> = ${f(E0)}·e<sup>−${f(alfa * d)}</sup> = <b>${f(Ed)} V/m</b> (${f(100 * Math.exp(-alfa * d))} % de la amplitud)`; }
      g += `<br>Intensidad al entrar: I = E<sub>0</sub><sup>2</sup>cos θ/(2|η|) = ${f((E0 * E0 * Math.cos(th)) / (2 * etaM))} W/m<sup>2</sup>`;
      pasos.push({ t: 'Campo dentro del medio', html: g });
    }
    return { modo: 'perdidas', er, mr, sg, fr, w, tg, tipo, alfa, beta, delta, etaM, th, vf, lam, E0, d, Ed, M: { eps, mu, v: vf, eta: etaM }, F: { fr, w, k: beta, lam }, pasos };
  }

  const MODOS = { onda, intensidad, perdidas };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : onda(sc); }

  const ejemplos = [
    { clave: 'fm', nombre: 'Onda de radio FM en el vacío', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '100e6', E0: '0,05', prop: '+z', pol: '+x', er: '', mr: '' } },
    { clave: 'laser', nombre: 'Luz de un láser rojo (λ = 633 nm)', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '633e-9', E0: '1000', prop: '+x', pol: '+y', er: '', mr: '' } },
    { clave: 'agua', nombre: 'Luz que entra en el agua', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '5e14', E0: '200', prop: '+z', pol: '+y', er: '1,77', mr: '1' } },
    { clave: 'expresion', nombre: 'Desde k: E = 30 cos(2,09y + ωt) k̂', sc: { modo: 'onda', medio: 'vacio', dato: 'k', valor: '2,094', E0: '30', prop: '-y', pol: '+z', er: '', mr: '' } },
    { clave: 'dielectrico', nombre: 'Microondas en un dieléctrico (εr = 4)', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '2,45e9', E0: '100', prop: '+z', pol: '+x', er: '4', mr: '1' } },
    { clave: 'sol', nombre: 'Luz del Sol en la Tierra', sc: { modo: 'intensidad', medio: 'vacio', de: 'I', I: '1361', P: '', r: '', E0: '', A: '1' } },
    { clave: 'bombilla', nombre: 'Bombilla de 100 W a 2 m', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '100', r: '2', I: '', E0: '', A: '' } },
    { clave: 'antena', nombre: 'Antena de 50 kW a 10 km', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '50000', r: '10000', I: '', E0: '', A: '' } },
    { clave: 'vela', nombre: 'Vela solar que refleja (E₀ dado)', sc: { modo: 'intensidad', medio: 'vacio', de: 'E0', E0: '1012', P: '', r: '', I: '', A: '100' } },
    { clave: 'cobre', nombre: 'Cobre a 1 MHz (buen conductor)', sc: { modo: 'perdidas', er: '1', mr: '1', sigma: '5,8e7', valor: '1e6', E0: '1', d: '0,0001' } },
    { clave: 'mar', nombre: 'Agua de mar a 1 kHz', sc: { modo: 'perdidas', er: '81', mr: '1', sigma: '4', valor: '1000', E0: '1', d: '10' } },
    { clave: 'tierra', nombre: 'Tierra húmeda a 1 MHz', sc: { modo: 'perdidas', er: '10', mr: '1', sigma: '0,01', valor: '1e6', E0: '10', d: '5' } },
    { clave: 'baquelita', nombre: 'Dieléctrico con pocas pérdidas', sc: { modo: 'perdidas', er: '4,9', mr: '1', sigma: '1e-6', valor: '1e8', E0: '5', d: '100' } },
  ];
  return { resolver, onda, intensidad, perdidas, banda, ejemplos, f, C0, MU0, EPS0 };
})();
if (typeof module !== 'undefined') module.exports = OndasEM;
