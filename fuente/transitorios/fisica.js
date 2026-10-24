/* =====================================================================
   Transitorios en circuitos (sin DOM): carga y descarga de un
   condensador (RC), subida y bajada de la corriente en una bobina (RL) y
   circuito RLC en serie con un escalón de tensión (sobreamortiguado,
   crítico o subamortiguado). El interruptor se cierra en t = 0.
   Unidades: V, Ω, μF, mH, A y s.
   ===================================================================== */
const Transitorios = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const PREF = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, un, d = 4) => {
    if (!isFinite(x)) return `${f(x)} ${un}`;
    if (Math.abs(x) < 1e-15) return `0 ${un}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', ',').replace('-', '−')} ${p[1]}${un}`;
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, signo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }
  // e^(−t/τ) con τ en segundos
  const ex = (tau) => `e<sup>−t/${f(tau)}</sup>`;
  const sgn = (x) => (x < 0 ? '−' : '+');

  /* ---------- RC ---------- */
  // sc: { proceso: 'carga'|'descarga', V, V0, R, C (μF), t, Vobj }
  function rc(sc) {
    const carga = sc.proceso !== 'descarga', R = lee(sc, 'R', 'la resistencia'), C = lee(sc, 'C', 'la capacidad') * 1e-6, tau = R * C, pasos = [];
    const V = carga ? lee(sc, 'V', 'la tensión de la fuente', { cero: true }) : 0, V0 = lee(sc, 'V0', 'la tensión inicial del condensador', { opcional: carga, signo: true }) ?? 0;
    if (V === V0) throw new Error(carga ? 'El condensador ya está a la tensión de la fuente: no hay transitorio' : 'Con el condensador descargado no hay nada que descargar');
    const Vc = (t) => V + (V0 - V) * Math.exp(-t / tau), I = (t) => ((V - V0) / R) * Math.exp(-t / tau);
    pasos.push({ t: 'Constante de tiempo', html: `τ = R C = ${u(R, 'Ω')}·${u(C, 'F')} = <b>${u(tau, 's')}</b>. En un tiempo τ el condensador recorre el 63 % del camino; en 5τ = ${u(5 * tau, 's')}, el 99,3 %: se da por terminado.` });
    const VcTxt = carga ? (V0 === 0 ? `${f(V)}·(1 − ${ex(tau)})` : `${f(V)} ${sgn(V0 - V)} ${f(Math.abs(V0 - V))}·${ex(tau)}`) : `${f(V0)}·${ex(tau)}`;
    pasos.push({ t: carga ? 'Carga' : 'Descarga', html: `${carga ? `Al cerrar, la tensión del condensador va de ${f(V0)} V a ${f(V)} V: V<sub>C</sub>(t) = V + (V<sub>0</sub> − V)·e<sup>−t/τ</sup>` : `Sin fuente, el condensador se descarga a través de R: V<sub>C</sub>(t) = V<sub>0</sub>·e<sup>−t/τ</sup>`} ⇒ <b>V<sub>C</sub>(t) = ${VcTxt} V</b>` });
    pasos.push({ t: 'Corriente', html: `i(t) = C dV<sub>C</sub>/dt = ${carga ? '(V − V<sub>0</sub>)/R' : '−V<sub>0</sub>/R'}·e<sup>−t/τ</sup> = <b>${f((V - V0) / R)}·${ex(tau)} A</b>. Empieza en ${u((V - V0) / R, 'A')} (el condensador se comporta como un cable) y tiende a 0 (como un circuito abierto)${carga ? '' : '; el signo menos indica que circula al revés que en la carga'}.` });
    pasos.push({ t: 'Carga y energía', html: `q = C V<sub>C</sub>: de ${u(C * V0, 'C')} a ${u(C * V, 'C')}. Energía en el condensador: de ½CV<sub>0</sub><sup>2</sup> = ${u(0.5 * C * V0 * V0, 'J')} a ½CV<sup>2</sup> = ${u(0.5 * C * V * V, 'J')}. En la resistencia se disipan ${u(0.5 * C * (V - V0) ** 2, 'J')}${carga && V0 === 0 ? ', lo mismo que se queda en el condensador: la fuente da el doble' : ''}.` });
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `t/τ = ${f(t / tau)}: V<sub>C</sub> = <b>${f(Vc(t))} V</b>, i = <b>${u(I(t), 'A')}</b>, V<sub>R</sub> = R i = ${f(R * I(t))} V.` });
    const Vo = lee(sc, 'Vobj', 'la tensión que se quiere alcanzar', { opcional: true, signo: true });
    let tObj = null;
    if (Vo !== null) {
      const fr = (Vo - V) / (V0 - V);
      if (!(fr > 0 && fr <= 1)) throw new Error(`El condensador no llega a ${f(Vo)} V: va de ${f(V0)} V a ${f(V)} V`);
      tObj = -tau * Math.log(fr);
      pasos.push({ t: `Tiempo hasta V<sub>C</sub> = ${f(Vo)} V`, html: `${f(Vo)} = ${VcTxt} ⇒ e<sup>−t/τ</sup> = ${f(fr)} ⇒ t = −τ ln ${f(fr)} = <b>${u(tObj, 's')}</b> (${f(tObj / tau)} τ)` });
    }
    return { modo: 'rc', carga, V, V0, R, C, tau, Vc, I, VcTxt, t, Vct: t !== null ? Vc(t) : null, It: t !== null ? I(t) : null, Vo, tObj, I0: (V - V0) / R, Ef: 0.5 * C * V * V, Ed: 0.5 * C * (V - V0) ** 2, T: 5 * tau, pasos };
  }

  /* ---------- RL ---------- */
  // sc: { proceso: 'subida'|'bajada', V, R, L (mH), t, Iobj }; en la bajada la corriente inicial es V/R
  function rl(sc) {
    const sube = sc.proceso !== 'bajada', V = lee(sc, 'V', 'la tensión de la fuente'), R = lee(sc, 'R', 'la resistencia'), L = lee(sc, 'L', 'la inductancia') * 1e-3, tau = L / R, Inf = V / R, pasos = [];
    const I0 = sube ? 0 : Inf, Ifin = sube ? Inf : 0;
    const I = (t) => Ifin + (I0 - Ifin) * Math.exp(-t / tau), VL = (t) => (sube ? V : -V) * Math.exp(-t / tau);
    pasos.push({ t: 'Constante de tiempo', html: `τ = L/R = ${u(L, 'H')} / ${u(R, 'Ω')} = <b>${u(tau, 's')}</b>` });
    const ITxt = sube ? `${f(Inf)}·(1 − ${ex(tau)})` : `${f(Inf)}·${ex(tau)}`;
    pasos.push({ t: sube ? 'La corriente sube' : 'La corriente baja', html: sube ? `Al cerrar, la bobina se opone al cambio y la corriente crece poco a poco hasta I<sub>∞</sub> = V/R = ${u(Inf, 'A')}: i(t) = (V/R)·(1 − e<sup>−t/τ</sup>) ⇒ <b>i(t) = ${ITxt} A</b>` : `Se quita la fuente y el circuito se cierra por R: la corriente, que era V/R = ${u(Inf, 'A')}, no cae de golpe: i(t) = I<sub>0</sub>·e<sup>−t/τ</sup> ⇒ <b>i(t) = ${ITxt} A</b>` });
    pasos.push({ t: 'Tensión en la bobina', html: `V<sub>L</sub> = L di/dt = <b>${f(sube ? V : -V)}·${ex(tau)} V</b>. ${sube ? 'Al principio toda la tensión está en la bobina (se comporta como un circuito abierto) y al final nada (como un cable).' : 'Cambia de signo: la bobina hace de fuente y mantiene la corriente mientras gasta su energía.'}` });
    pasos.push({ t: 'Energía', html: `${sube ? 'Al final' : 'Al principio'} la bobina guarda ½ L I<sup>2</sup> = ½·${u(L, 'H')}·(${u(Inf, 'A')})<sup>2</sup> = <b>${u(0.5 * L * Inf * Inf, 'J')}</b>${sube ? '' : ', que acaba disipada en la resistencia'}.` });
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `t/τ = ${f(t / tau)}: i = <b>${u(I(t), 'A')}</b>, V<sub>L</sub> = <b>${f(VL(t))} V</b>, V<sub>R</sub> = R i = ${f(R * I(t))} V.` });
    const Io = lee(sc, 'Iobj', 'la corriente que se quiere alcanzar', { opcional: true, cero: true });
    let tObj = null;
    if (Io !== null) {
      const fr = (Io - Ifin) / (I0 - Ifin);
      if (!(fr > 0 && fr <= 1)) throw new Error(`La corriente no llega a ${f(Io)} A: va de ${f(I0)} A a ${f(Ifin)} A`);
      tObj = -tau * Math.log(fr);
      pasos.push({ t: `Tiempo hasta i = ${f(Io)} A`, html: `${f(Io)} = ${ITxt} ⇒ e<sup>−t/τ</sup> = ${f(fr)} ⇒ t = −τ ln ${f(fr)} = <b>${u(tObj, 's')}</b> (${f(tObj / tau)} τ)` });
    }
    return { modo: 'rl', sube, V, R, L, tau, Inf, I0, I, VL, ITxt, t, It: t !== null ? I(t) : null, VLt: t !== null ? VL(t) : null, Io, tObj, E: 0.5 * L * Inf * Inf, T: 5 * tau, pasos };
  }

  /* ---------- RLC en serie ---------- */
  // sc: { V (escalón; 0 = respuesta libre), R, L (mH), C (μF), V0 (V del condensador en t = 0), I0, t }
  function rlc(sc) {
    const V = lee(sc, 'V', 'la tensión de la fuente', { cero: true }), R = lee(sc, 'R', 'la resistencia', { cero: true }), L = lee(sc, 'L', 'la inductancia') * 1e-3, C = lee(sc, 'C', 'la capacidad') * 1e-6;
    const V0 = lee(sc, 'V0', 'la tensión inicial del condensador', { opcional: true, signo: true }) ?? 0, I0 = lee(sc, 'I0', 'la corriente inicial', { opcional: true, signo: true }) ?? 0;
    if (V === V0 && I0 === 0) throw new Error('Con el condensador ya a la tensión de la fuente y sin corriente no hay transitorio');
    const a = R / (2 * L), w0 = 1 / Math.sqrt(L * C), Rc = 2 * Math.sqrt(L / C), A0 = V0 - V, D0 = I0 / C, pasos = [];
    const rel = (a - w0) / w0, tipo = Math.abs(rel) < 1e-9 ? 'critico' : a > w0 ? 'sobre' : 'sub';
    pasos.push({ t: 'Ecuación', html: `Por la ley de las mallas, V = R i + L di/dt + V<sub>C</sub> con i = C dV<sub>C</sub>/dt: L C V<sub>C</sub>″ + R C V<sub>C</sub>′ + V<sub>C</sub> = V. La ecuación característica es s<sup>2</sup> + (R/L) s + 1/(LC) = 0, con α = R/(2L) = <b>${f(a)} s<sup>−1</sup></b> y ω<sub>0</sub> = 1/√(LC) = <b>${f(w0)} rad/s</b>.` });
    let Vc, dV, txt, s1 = null, s2 = null, wd = null, A, B;
    if (tipo === 'sub') {
      wd = Math.sqrt(w0 * w0 - a * a); A = A0; B = (D0 + a * A) / wd;
      Vc = (t) => V + Math.exp(-a * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
      dV = (t) => Math.exp(-a * t) * ((-a * A + wd * B) * Math.cos(wd * t) + (-a * B - wd * A) * Math.sin(wd * t));
      txt = `${V ? `${f(V)} + ` : ''}e<sup>−${f(a)}t</sup>·(${f(A)} cos ${f(wd)}t ${sgn(B)} ${f(Math.abs(B))} sen ${f(wd)}t)`;
      pasos.push({ t: 'Subamortiguado', html: `α &lt; ω<sub>0</sub> (R = ${u(R, 'Ω')} es menor que la resistencia crítica 2√(L/C) = ${u(Rc, 'Ω')}): raíces complejas s = −α ± jω<sub>d</sub>, con ω<sub>d</sub> = √(ω<sub>0</sub><sup>2</sup> − α<sup>2</sup>) = <b>${f(wd)} rad/s</b>. La tensión oscila con periodo 2π/ω<sub>d</sub> = ${u((2 * Math.PI) / wd, 's')} mientras se amortigua.` });
    } else if (tipo === 'critico') {
      A = A0; B = D0 + a * A;
      Vc = (t) => V + (A + B * t) * Math.exp(-a * t);
      dV = (t) => (B - a * (A + B * t)) * Math.exp(-a * t);
      txt = `${V ? `${f(V)} + ` : ''}(${f(A)} ${sgn(B)} ${f(Math.abs(B))} t)·e<sup>−${f(a)}t</sup>`;
      pasos.push({ t: 'Amortiguamiento crítico', html: `α = ω<sub>0</sub> (R = 2√(L/C) = ${u(Rc, 'Ω')}): raíz doble s = −α. Es el caso que llega antes al final sin oscilar.` });
    } else {
      const r = Math.sqrt(a * a - w0 * w0); s1 = -a + r; s2 = -a - r; A = (D0 - s2 * A0) / (s1 - s2); B = A0 - A;
      Vc = (t) => V + A * Math.exp(s1 * t) + B * Math.exp(s2 * t);
      dV = (t) => A * s1 * Math.exp(s1 * t) + B * s2 * Math.exp(s2 * t);
      txt = `${V ? `${f(V)} ` : ''}${V ? sgn(A) + ' ' : A < 0 ? '−' : ''}${f(Math.abs(A))}·e<sup>${f(s1)}t</sup> ${sgn(B)} ${f(Math.abs(B))}·e<sup>${f(s2)}t</sup>`;
      pasos.push({ t: 'Sobreamortiguado', html: `α > ω<sub>0</sub> (R = ${u(R, 'Ω')} es mayor que la resistencia crítica 2√(L/C) = ${u(Rc, 'Ω')}): dos raíces reales s = −α ± √(α<sup>2</sup> − ω<sub>0</sub><sup>2</sup>) = <b>${f(s1)}</b> y <b>${f(s2)} s<sup>−1</sup></b>. Llega al final sin oscilar, despacio.` });
    }
    pasos.push({ t: 'Condiciones iniciales', html: `V<sub>C</sub>(0) = ${f(V0)} V y V<sub>C</sub>′(0) = i(0)/C = ${f(D0)} V/s (la tensión del condensador y la corriente de la bobina no pueden saltar). De ahí las constantes: <b>V<sub>C</sub>(t) = ${txt} V</b>` });
    const I = (t) => C * dV(t), Q = w0 * L / (R || 1e-300);
    pasos.push({ t: 'Corriente', html: `i(t) = C dV<sub>C</sub>/dt. Al final, V<sub>C</sub> → ${f(V)} V e i → 0. Factor de calidad Q = ω<sub>0</sub>L/R = ${R ? f(Q) : '∞'}${R ? '' : ': sin resistencia la oscilación no se amortigua nunca'}.` });
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `V<sub>C</sub> = <b>${f(Vc(t))} V</b>, i = <b>${u(I(t), 'A')}</b>` });
    // cuánto dibujar: unas cuantas constantes de tiempo del término más lento
    const lento = tipo === 'sobre' ? -1 / s1 : 1 / (a || w0 / 20), T = tipo === 'sub' ? Math.min(5 * lento, 12 * (2 * Math.PI) / wd) : 6 * lento;
    let pico = null;
    if (tipo === 'sub' && V !== V0) { const tp = (Math.PI) / wd; pico = { t: tp, V: Vc(tp), sobre: Math.abs((Vc(tp) - V) / (V0 - V)) * 100 }; }
    return { modo: 'rlc', V, R, L, C, V0, I0, a, w0, wd, s1, s2, Rc, tipo, Vc, I, txt, t, Vct: t !== null ? Vc(t) : null, It: t !== null ? I(t) : null, Q: R ? Q : Infinity, T, pico, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'rl') return rl(sc);
    if (sc.modo === 'rlc') return rlc(sc);
    return rc(sc);
  }

  const ejemplos = [
    { clave: 'carga', nombre: 'Carga de un condensador', sc: { modo: 'rc', proceso: 'carga', V: '12', V0: '', R: '10000', C: '100', t: '1', Vobj: '' } },
    { clave: 'descarga', nombre: 'Descarga de un condensador', sc: { modo: 'rc', proceso: 'descarga', V: '', V0: '9', R: '2000', C: '470', t: '', Vobj: '3' } },
    { clave: 'carga-v0', nombre: 'Condensador que ya tenía carga', sc: { modo: 'rc', proceso: 'carga', V: '10', V0: '4', R: '1000', C: '1000', t: '0,5', Vobj: '9' } },
    { clave: 'flash', nombre: 'Flash de una cámara', sc: { modo: 'rc', proceso: 'carga', V: '300', V0: '', R: '1000', C: '200', t: '', Vobj: '290' } },
    { clave: 'rl-sube', nombre: 'Corriente que sube en una bobina', sc: { modo: 'rl', proceso: 'subida', V: '12', R: '6', L: '300', t: '0,05', Iobj: '' } },
    { clave: 'rl-baja', nombre: 'Bobina que se descarga por una resistencia', sc: { modo: 'rl', proceso: 'bajada', V: '24', R: '12', L: '600', t: '', Iobj: '0,5' } },
    { clave: 'rlc-sub', nombre: 'RLC subamortiguado (oscila)', sc: { modo: 'rlc', V: '10', R: '20', L: '100', C: '10', V0: '', I0: '', t: '' } },
    { clave: 'rlc-critico', nombre: 'RLC con amortiguamiento crítico', sc: { modo: 'rlc', V: '10', R: '200', L: '100', C: '10', V0: '', I0: '', t: '' } },
    { clave: 'rlc-sobre', nombre: 'RLC sobreamortiguado', sc: { modo: 'rlc', V: '10', R: '1000', L: '100', C: '10', V0: '', I0: '', t: '' } },
    { clave: 'lc', nombre: 'Condensador cargado que se descarga en una bobina', sc: { modo: 'rlc', V: '0', R: '5', L: '50', C: '20', V0: '20', I0: '', t: '0,001' } },
  ];

  return { resolver, rc, rl, rlc, ejemplos, f, u };
})();
if (typeof module !== 'undefined') module.exports = Transitorios;
