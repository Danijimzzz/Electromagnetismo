/* =====================================================================
   Transitorios en circuitos (sin DOM): carga y descarga de un
   condensador (RC), subida y bajada de la corriente en una bobina (RL),
   las dos también conmutando en t₁ a una descarga por R₂; RLC en serie
   con un escalón de tensión y RLC en paralelo con uno de corriente
   (sobreamortiguado, crítico o subamortiguado), y cualquier circuito de
   primer orden por el método de los tres valores, que se resuelve en
   continua con Continua (circuitos/fisica.js, va antes en la página).
   El interruptor actúa en t = 0. Unidades: V, Ω, μF, mH, A y s.
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
  // con prefijo (4k7, 100n, 5m) o unidad el valor va en unidades del SI; un número solo, en las del campo (base)
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, signo = false, base = 1 } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = Herramienta.leeSI(sc[k], base);
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
    const carga = sc.proceso !== 'descarga', R = lee(sc, 'R', 'la resistencia'), C = lee(sc, 'C', 'la capacidad', { base: 1e-6 }), tau = R * C, pasos = [];
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

  /* ---------- RC que conmuta: carga por R y, en t₁, descarga por R₂ ---------- */
  function rcConmuta(sc) {
    const R = lee(sc, 'R', 'la resistencia de carga R'), R2 = lee(sc, 'R2', 'la resistencia de descarga R₂'), C = lee(sc, 'C', 'la capacidad', { base: 1e-6 }), t1 = lee(sc, 't1', 'el instante t₁ en que conmuta');
    const V = lee(sc, 'V', 'la tensión de la fuente', { cero: true }), V0 = lee(sc, 'V0', 'la tensión inicial del condensador', { opcional: true, signo: true }) ?? 0;
    const tau = R * C, tau2 = R2 * C, V1 = V + (V0 - V) * Math.exp(-t1 / tau);
    const Vc = (t) => (t < t1 ? V + (V0 - V) * Math.exp(-t / tau) : V1 * Math.exp(-(t - t1) / tau2));
    const I = (t) => (t < t1 ? ((V - V0) / R) * Math.exp(-t / tau) : (-V1 / R2) * Math.exp(-(t - t1) / tau2));
    const VcTxt = `${t1 > 0 ? `${V0 === 0 ? `${f(V)}·(1 − ${ex(tau)})` : `${f(V)} ${sgn(V0 - V)} ${f(Math.abs(V0 - V))}·${ex(tau)}`} hasta t₁; después ` : ''}${f(V1)}·e<sup>−(t − ${f(t1)})/${f(tau2)}</sup>`;
    const pasos = [
      { t: 'Hasta t₁: carga por R', html: `τ<sub>1</sub> = R C = ${u(R, 'Ω')}·${u(C, 'F')} = <b>${u(tau, 's')}</b>; V<sub>C</sub>(t) = V + (V<sub>0</sub> − V)·e<sup>−t/τ₁</sup>. En t<sub>1</sub> = ${u(t1, 's')} (${f(t1 / tau)} τ<sub>1</sub>) llega a V<sub>C</sub>(t<sub>1</sub>) = <b>${f(V1)} V</b>` },
      { t: 'Desde t₁: descarga por R₂', html: `Se quita la fuente y el condensador se descarga por R<sub>2</sub>: τ<sub>2</sub> = R<sub>2</sub> C = <b>${u(tau2, 's')}</b>. La tensión no salta, pero la corriente sí: pasa de ${u((V - V1) / R, 'A')} a <b>${u(-V1 / R2, 'A')}</b> (al revés y con R<sub>2</sub>). V<sub>C</sub>(t) = ${f(V1)}·e<sup>−(t − t₁)/τ₂</sup>` },
      { t: 'Energía', html: `En t<sub>1</sub> el condensador guarda ½CV<sub>C</sub><sup>2</sup> = ${u(0.5 * C * V1 * V1, 'J')}, que acaba disipada en R<sub>2</sub>.` },
    ];
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `${t < t1 ? 'Todavía cargando' : 'Ya descargando'}: V<sub>C</sub> = <b>${f(Vc(t))} V</b>, i = <b>${u(I(t), 'A')}</b>` });
    return { modo: 'rc', conmuta: true, carga: true, V, V0, R, R2, C, tau, tau2, t1, V1, Vc, I, VcTxt, t, Vct: t !== null ? Vc(t) : null, It: t !== null ? I(t) : null, Vo: null, tObj: null, I0: (V - V0) / R, Ef: 0.5 * C * V1 * V1, T: t1 + 5 * tau2, pasos };
  }

  /* ---------- RL ---------- */
  // sc: { proceso: 'subida'|'bajada'|'conmuta', V, R, R2 (descarga), I0 (opcional), t1, L (mH), t, Iobj }
  function rl(sc) {
    const proceso = ['bajada', 'conmuta'].includes(sc.proceso) ? sc.proceso : 'subida', sube = proceso !== 'bajada';
    const V = lee(sc, 'V', 'la tensión de la fuente'), R = lee(sc, 'R', 'la resistencia'), L = lee(sc, 'L', 'la inductancia', { base: 1e-3 }), Inf = V / R, pasos = [];
    if (proceso === 'conmuta') {
      const R2 = lee(sc, 'R2', 'la resistencia de descarga R₂'), t1 = lee(sc, 't1', 'el instante t₁ en que conmuta'), tau = L / R, tau2 = L / R2, I1 = Inf * (1 - Math.exp(-t1 / tau));
      const I = (t) => (t < t1 ? Inf * (1 - Math.exp(-t / tau)) : I1 * Math.exp(-(t - t1) / tau2)), VL = (t) => (t < t1 ? V * Math.exp(-t / tau) : -I1 * R2 * Math.exp(-(t - t1) / tau2));
      pasos.push({ t: 'Hasta t₁: la corriente sube', html: `τ<sub>1</sub> = L/R = <b>${u(tau, 's')}</b>; i(t) = (V/R)(1 − e<sup>−t/τ₁</sup>). En t<sub>1</sub> = ${u(t1, 's')} vale i(t<sub>1</sub>) = <b>${u(I1, 'A')}</b>` });
      pasos.push({ t: 'Desde t₁: se quita la fuente y se descarga por R₂', html: `La corriente de la bobina no salta: sigue siendo ${u(I1, 'A')}, ahora por R<sub>2</sub>. La tensión de la bobina sí salta, a V<sub>L</sub>(t<sub>1</sub><sup>+</sup>) = −i·R<sub>2</sub> = <b>${f(-I1 * R2)} V</b>${R2 > R ? ` (${f((I1 * R2) / V)} veces la de la fuente: es el pico que hace saltar chispas al abrir un interruptor)` : ''}. τ<sub>2</sub> = L/R<sub>2</sub> = <b>${u(tau2, 's')}</b>; i(t) = ${f(I1)}·e<sup>−(t − t₁)/τ₂</sup>` });
      pasos.push({ t: 'Energía', html: `En t<sub>1</sub> la bobina guarda ½LI<sup>2</sup> = ${u(0.5 * L * I1 * I1, 'J')}, que se disipa en R<sub>2</sub>.` });
      const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
      if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `i = <b>${u(I(t), 'A')}</b>, V<sub>L</sub> = <b>${f(VL(t))} V</b>` });
      return { modo: 'rl', conmuta: true, sube: true, V, R, R2, L, tau, tau2, t1, I1, Inf, I0: 0, I, VL, ITxt: `${f(Inf)}·(1 − ${ex(tau)}) hasta t₁; después ${f(I1)}·e<sup>−(t − ${f(t1)})/${f(tau2)}</sup>`, t, It: t !== null ? I(t) : null, VLt: t !== null ? VL(t) : null, Io: null, tObj: null, E: 0.5 * L * I1 * I1, pico: -I1 * R2, T: t1 + 5 * tau2, pasos };
    }
    // en la bajada la bobina se descarga por R₂ (si no se da, por la misma R)
    const R2 = sube ? R : lee(sc, 'R2', 'la resistencia de descarga R₂', { opcional: true }) ?? R, tau = L / (sube ? R : R2);
    const Ii = lee(sc, 'I0', 'la corriente inicial', { opcional: true, signo: true }), I0 = Ii ?? (sube ? 0 : Inf), Ifin = sube ? Inf : 0;
    if (I0 === Ifin) throw new Error('La corriente ya está en su valor final: no hay transitorio');
    const I = (t) => Ifin + (I0 - Ifin) * Math.exp(-t / tau), VL0 = sube ? V - R * I0 : -I0 * R2, VL = (t) => VL0 * Math.exp(-t / tau);
    pasos.push({ t: 'Constante de tiempo', html: `τ = L/R${sube || R2 === R ? '' : '<sub>2</sub>'} = ${u(L, 'H')} / ${u(sube ? R : R2, 'Ω')} = <b>${u(tau, 's')}</b>` });
    const ITxt = !I0 ? `${f(Inf)}·(1 − ${ex(tau)})` : !Ifin ? `${f(I0)}·${ex(tau)}` : `${f(Ifin)} ${sgn(I0 - Ifin)} ${f(Math.abs(I0 - Ifin))}·${ex(tau)}`;
    pasos.push({ t: sube ? 'La corriente sube' : 'La corriente baja', html: sube ? `Al cerrar, la bobina se opone al cambio y la corriente va de ${u(I0, 'A')} a I<sub>∞</sub> = V/R = ${u(Inf, 'A')}: i(t) = I<sub>∞</sub> + (I<sub>0</sub> − I<sub>∞</sub>)·e<sup>−t/τ</sup> ⇒ <b>i(t) = ${ITxt} A</b>` : `Se quita la fuente y el circuito se cierra por ${R2 === R ? 'R' : 'R<sub>2</sub>'}: la corriente, que era ${Ii === null ? `V/R = ${u(Inf, 'A')}` : u(I0, 'A')}, no cae de golpe: i(t) = I<sub>0</sub>·e<sup>−t/τ</sup> ⇒ <b>i(t) = ${ITxt} A</b>` });
    pasos.push({ t: 'Tensión en la bobina', html: `V<sub>L</sub> = L di/dt = <b>${f(VL0)}·${ex(tau)} V</b>. ${sube ? 'Al principio casi toda la tensión está en la bobina (se comporta como un circuito abierto) y al final nada (como un cable).' : `Cambia de signo: la bobina hace de fuente y mantiene la corriente mientras gasta su energía.${R2 !== R ? ` Justo al abrir vale −I<sub>0</sub>·R<sub>2</sub> = ${f(VL0)} V${R2 > R ? `, ${f(-VL0 / V)} veces la de la fuente` : ''}.` : ''}`}` });
    const Iw = sube ? Inf : I0;
    pasos.push({ t: 'Energía', html: `${sube ? 'Al final' : 'Al principio'} la bobina guarda ½ L I<sup>2</sup> = ½·${u(L, 'H')}·(${u(Iw, 'A')})<sup>2</sup> = <b>${u(0.5 * L * Iw * Iw, 'J')}</b>${sube ? '' : ', que acaba disipada en la resistencia'}.` });
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `t/τ = ${f(t / tau)}: i = <b>${u(I(t), 'A')}</b>, V<sub>L</sub> = <b>${f(VL(t))} V</b>, V<sub>R</sub> = R i = ${f((sube ? R : R2) * I(t))} V.` });
    const Io = lee(sc, 'Iobj', 'la corriente que se quiere alcanzar', { opcional: true, signo: true });
    let tObj = null;
    if (Io !== null) {
      const fr = (Io - Ifin) / (I0 - Ifin);
      if (!(fr > 0 && fr <= 1)) throw new Error(`La corriente no llega a ${f(Io)} A: va de ${f(I0)} A a ${f(Ifin)} A`);
      tObj = -tau * Math.log(fr);
      pasos.push({ t: `Tiempo hasta i = ${f(Io)} A`, html: `${f(Io)} = ${ITxt} ⇒ e<sup>−t/τ</sup> = ${f(fr)} ⇒ t = −τ ln ${f(fr)} = <b>${u(tObj, 's')}</b> (${f(tObj / tau)} τ)` });
    }
    return { modo: 'rl', sube, V, R, R2, L, tau, Inf, I0, I, VL, ITxt, t, It: t !== null ? I(t) : null, VLt: t !== null ? VL(t) : null, Io, tObj, E: 0.5 * L * Iw * Iw, T: 5 * tau, pasos };
  }

  /* ---------- Segundo orden: x″ + 2α x′ + ω₀² x = ω₀² x_f, con x(0) y x′(0) ---------- */
  function segundo(a, w0, xf, x0, dx0) {
    const A0 = x0 - xf, rel = (a - w0) / w0, tipo = Math.abs(rel) < 1e-9 ? 'critico' : a > w0 ? 'sobre' : 'sub';
    let X, dX, txt, s1 = null, s2 = null, wd = null, A, B;
    if (tipo === 'sub') {
      wd = Math.sqrt(w0 * w0 - a * a); A = A0; B = (dx0 + a * A) / wd;
      X = (t) => xf + Math.exp(-a * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
      dX = (t) => Math.exp(-a * t) * ((-a * A + wd * B) * Math.cos(wd * t) + (-a * B - wd * A) * Math.sin(wd * t));
      txt = `${xf ? `${f(xf)} + ` : ''}${a ? `e<sup>−${f(a)}t</sup>·` : ''}(${f(A)} cos ${f(wd)}t ${sgn(B)} ${f(Math.abs(B))} sen ${f(wd)}t)`;
    } else if (tipo === 'critico') {
      A = A0; B = dx0 + a * A;
      X = (t) => xf + (A + B * t) * Math.exp(-a * t);
      dX = (t) => (B - a * (A + B * t)) * Math.exp(-a * t);
      txt = `${xf ? `${f(xf)} + ` : ''}(${f(A)} ${sgn(B)} ${f(Math.abs(B))} t)·e<sup>−${f(a)}t</sup>`;
    } else {
      const r = Math.sqrt(a * a - w0 * w0); s1 = -a + r; s2 = -a - r; A = (dx0 - s2 * A0) / (s1 - s2); B = A0 - A;
      X = (t) => xf + A * Math.exp(s1 * t) + B * Math.exp(s2 * t);
      dX = (t) => A * s1 * Math.exp(s1 * t) + B * s2 * Math.exp(s2 * t);
      txt = `${xf ? `${f(xf)} ` : ''}${xf ? sgn(A) + ' ' : A < 0 ? '−' : ''}${f(Math.abs(A))}·e<sup>${f(s1)}t</sup> ${sgn(B)} ${f(Math.abs(B))}·e<sup>${f(s2)}t</sup>`;
    }
    // cuánto dibujar: unas cuantas constantes de tiempo del término más lento
    const lento = tipo === 'sobre' ? -1 / s1 : 1 / (a || w0 / 20), T = tipo === 'sub' ? Math.min(5 * lento, 12 * (2 * Math.PI) / wd) : 6 * lento;
    let pico = null;
    if (tipo === 'sub' && x0 !== xf) {
      // primer extremo: dX = e^(−αt)(P cos ω_d t + Q sen ω_d t) se anula en ω_d t = δ + π/2 + kπ (con x′(0) = 0 es π/ω_d)
      const P = -a * A + wd * B, Qs = -a * B - wd * A, d = Math.atan2(Qs, P), per = Math.PI / wd;
      let tp = (d + Math.PI / 2) / wd; tp -= Math.floor(tp / per) * per; if (tp < 1e-9 * per) tp += per;
      pico = { t: tp, V: X(tp), sobre: Math.abs((X(tp) - xf) / (x0 - xf)) * 100 };
    }
    return { tipo, X, dX, txt, s1, s2, wd, A, B, T, pico };
  }
  // primer instante en que x(t) vale obj (null si no llega)
  function hasta(X, obj, T) {
    const n = 4000, t1 = 3 * T;
    let ta = 0, ya = X(0) - obj;
    if (Math.abs(ya) < 1e-12) return 0;
    for (let k = 1; k <= n; k++) {
      const tb = (t1 * k) / n, yb = X(tb) - obj;
      if (ya * yb <= 0) { let a = ta, b = tb; for (let j = 0; j < 60; j++) { const m = (a + b) / 2; if ((X(a) - obj) * (X(m) - obj) <= 0) b = m; else a = m; } return (a + b) / 2; }
      ta = tb; ya = yb;
    }
    return null;
  }
  const TIPO_TXT = { sub: 'Subamortiguado', critico: 'Amortiguamiento crítico', sobre: 'Sobreamortiguado' };
  function pasoTipo(s, a, w0, R, Rc, serie) {
    if (s.tipo === 'sub') return { t: TIPO_TXT.sub, html: `α &lt; ω<sub>0</sub> (R = ${u(R, 'Ω')} es ${serie ? 'menor' : 'mayor'} que la resistencia crítica ${serie ? '2√(L/C)' : '½√(L/C)'} = ${u(Rc, 'Ω')}): raíces complejas s = −α ± jω<sub>d</sub>, con ω<sub>d</sub> = √(ω<sub>0</sub><sup>2</sup> − α<sup>2</sup>) = <b>${f(s.wd)} rad/s</b>. Oscila con periodo 2π/ω<sub>d</sub> = ${u((2 * Math.PI) / s.wd, 's')} mientras se amortigua.` };
    if (s.tipo === 'critico') return { t: TIPO_TXT.critico, html: `α = ω<sub>0</sub> (R = ${serie ? '2√(L/C)' : '½√(L/C)'} = ${u(Rc, 'Ω')}): raíz doble s = −α. Es el caso que llega antes al final sin oscilar.` };
    return { t: TIPO_TXT.sobre, html: `α > ω<sub>0</sub> (R = ${u(R, 'Ω')} es ${serie ? 'mayor' : 'menor'} que la resistencia crítica ${serie ? '2√(L/C)' : '½√(L/C)'} = ${u(Rc, 'Ω')}): dos raíces reales s = −α ± √(α<sup>2</sup> − ω<sub>0</sub><sup>2</sup>) = <b>${f(s.s1)}</b> y <b>${f(s.s2)} s<sup>−1</sup></b>. Llega al final sin oscilar, despacio.` };
  }

  /* ---------- RLC en serie ---------- */
  // sc: { V (escalón; 0 = respuesta libre), R, L (mH), C (μF), V0 (V del condensador en t = 0), I0, t, Vobj }
  function rlc(sc) {
    const V = lee(sc, 'V', 'la tensión de la fuente', { cero: true }), R = lee(sc, 'R', 'la resistencia', { cero: true }), L = lee(sc, 'L', 'la inductancia', { base: 1e-3 }), C = lee(sc, 'C', 'la capacidad', { base: 1e-6 });
    const V0 = lee(sc, 'V0', 'la tensión inicial del condensador', { opcional: true, signo: true }) ?? 0, I0 = lee(sc, 'I0', 'la corriente inicial', { opcional: true, signo: true }) ?? 0;
    if (V === V0 && I0 === 0) throw new Error('Con el condensador ya a la tensión de la fuente y sin corriente no hay transitorio');
    const a = R / (2 * L), w0 = 1 / Math.sqrt(L * C), Rc = 2 * Math.sqrt(L / C), D0 = I0 / C, pasos = [];
    pasos.push({ t: 'Ecuación', html: `Por la ley de las mallas, V = R i + L di/dt + V<sub>C</sub> con i = C dV<sub>C</sub>/dt: L C V<sub>C</sub>″ + R C V<sub>C</sub>′ + V<sub>C</sub> = V. La ecuación característica es s<sup>2</sup> + (R/L) s + 1/(LC) = 0, con α = R/(2L) = <b>${f(a)} s<sup>−1</sup></b> y ω<sub>0</sub> = 1/√(LC) = <b>${f(w0)} rad/s</b>.` });
    const s = segundo(a, w0, V, V0, D0), Vc = s.X;
    pasos.push(pasoTipo(s, a, w0, R, Rc, true));
    pasos.push({ t: 'Condiciones iniciales', html: `V<sub>C</sub>(0) = ${f(V0)} V y V<sub>C</sub>′(0) = i(0)/C = ${f(D0)} V/s (la tensión del condensador y la corriente de la bobina no pueden saltar). De ahí las constantes: <b>V<sub>C</sub>(t) = ${s.txt} V</b>` });
    const I = (t) => C * s.dX(t), Q = w0 * L / (R || 1e-300);
    pasos.push({ t: 'Corriente', html: `i(t) = C dV<sub>C</sub>/dt. Al final, V<sub>C</sub> → ${f(V)} V e i → 0. Factor de calidad Q = ω<sub>0</sub>L/R = ${R ? f(Q) : '∞'}${R ? '' : ': sin resistencia la oscilación no se amortigua nunca'}.${s.pico ? ` El primer pico de V<sub>C</sub> llega en t = ${u(s.pico.t, 's')} con ${f(s.pico.V)} V (sobreoscilación del ${f(s.pico.sobre, 3)} %).` : ''}` });
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `V<sub>C</sub> = <b>${f(Vc(t))} V</b>, i = <b>${u(I(t), 'A')}</b>` });
    const Vo = lee(sc, 'Vobj', 'la tensión que se quiere alcanzar', { opcional: true, signo: true });
    let tObj = null;
    if (Vo !== null) {
      tObj = hasta(Vc, Vo, s.T);
      if (tObj === null) throw new Error(`La tensión del condensador no llega a ${f(Vo)} V`);
      pasos.push({ t: `Tiempo hasta V<sub>C</sub> = ${f(Vo)} V`, html: `La ecuación ${f(Vo)} = ${s.txt} no se despeja a mano${s.tipo === 'sub' ? ' (mezcla exponenciales y senos)' : ''}: se busca numéricamente la primera vez que se cumple, <b>t = ${u(tObj, 's')}</b>.` });
    }
    return { modo: 'rlc', V, R, L, C, V0, I0, a, w0, wd: s.wd, s1: s.s1, s2: s.s2, Rc, tipo: s.tipo, Vc, I, txt: s.txt, t, Vct: t !== null ? Vc(t) : null, It: t !== null ? I(t) : null, Q: R ? Q : Infinity, T: s.T, pico: s.pico, Vo, tObj, pasos };
  }

  /* ---------- RLC en paralelo con una fuente de corriente ---------- */
  // sc: { I (escalón de corriente; 0 = respuesta libre), R (vacía = sin resistencia), L (mH), C (μF), V0 (tensión común en t = 0), I0 (corriente de la bobina en t = 0), t, Iobj }
  function rlcp(sc) {
    const Ig = lee(sc, 'I', 'la corriente de la fuente', { cero: true, signo: true }), R = lee(sc, 'R', 'la resistencia', { opcional: true }), L = lee(sc, 'L', 'la inductancia', { base: 1e-3 }), C = lee(sc, 'C', 'la capacidad', { base: 1e-6 });
    const V0 = lee(sc, 'V0', 'la tensión inicial del condensador', { opcional: true, signo: true }) ?? 0, I0 = lee(sc, 'I0', 'la corriente inicial de la bobina', { opcional: true, signo: true }) ?? 0;
    if (Ig === I0 && V0 === 0) throw new Error('Con la bobina ya llevando la corriente de la fuente y el condensador descargado no hay transitorio');
    const a = R === null ? 0 : 1 / (2 * R * C), w0 = 1 / Math.sqrt(L * C), Rc = 0.5 * Math.sqrt(L / C), pasos = [];
    pasos.push({ t: 'Ecuación', html: `Los tres elementos comparten la tensión v = L di<sub>L</sub>/dt, y la fuente reparte su corriente: I = v/R + i<sub>L</sub> + C dv/dt. Con i<sub>L</sub> como incógnita: L C i<sub>L</sub>″ + (L/R) i<sub>L</sub>′ + i<sub>L</sub> = I. La ecuación característica es s<sup>2</sup> + s/(RC) + 1/(LC) = 0, con α = 1/(2RC) = <b>${f(a)} s<sup>−1</sup></b> y ω<sub>0</sub> = 1/√(LC) = <b>${f(w0)} rad/s</b>.${R === null ? ' Sin resistencia, α = 0.' : ''}` });
    const s = segundo(a, w0, Ig, I0, V0 / L), IL = s.X, v = (t) => L * s.dX(t);
    pasos.push(pasoTipo(s, a, w0, R === null ? Infinity : R, Rc, false));
    pasos.push({ t: 'Condiciones iniciales', html: `i<sub>L</sub>(0) = ${u(I0, 'A')} e i<sub>L</sub>′(0) = v(0)/L = ${f(V0 / L)} A/s (la corriente de la bobina y la tensión del condensador no pueden saltar). De ahí: <b>i<sub>L</sub>(t) = ${s.txt} A</b>` });
    pasos.push({ t: 'Tensión', html: `v(t) = L di<sub>L</sub>/dt. Al final, i<sub>L</sub> → ${u(Ig, 'A')} (toda la corriente va por la bobina, que es un cable en continua) y v → 0. Factor de calidad Q = R/(ω<sub>0</sub>L) = ${R === null ? '∞' : f(R / (w0 * L))}.` });
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `i<sub>L</sub> = <b>${u(IL(t), 'A')}</b>, v = <b>${f(v(t))} V</b>` });
    const Io = lee(sc, 'Iobj', 'la corriente que se quiere alcanzar', { opcional: true, signo: true });
    let tObj = null;
    if (Io !== null) {
      tObj = hasta(IL, Io, s.T);
      if (tObj === null) throw new Error(`La corriente de la bobina no llega a ${f(Io)} A`);
      pasos.push({ t: `Tiempo hasta i<sub>L</sub> = ${f(Io)} A`, html: `Se busca numéricamente la primera vez que ${s.txt} = ${f(Io)}: <b>t = ${u(tObj, 's')}</b>.` });
    }
    return { modo: 'rlcp', I: IL, Ig, R, L, C, V0, I0, a, w0, wd: s.wd, s1: s.s1, s2: s.s2, Rc, tipo: s.tipo, v, txt: s.txt, t, ILt: t !== null ? IL(t) : null, vt: t !== null ? v(t) : null, T: s.T, pico: s.pico, Io, tObj, pasos };
  }

  /* ---------- Primer orden cualquiera: método de los tres valores ---------- */
  // sc: { elementos: [{ t: 'R'|'V'|'I'|'C'|'L', a, b, v, cuando: 'siempre'|'antes'|'despues' }], x0 (opcional), t, obj }
  // Un solo condensador o una sola bobina; el interruptor se acciona en t = 0. Se resuelve con Continua (circuitos/fisica.js).
  function componente(els, n) {
    const dentro = new Set([n]); let cambia = true;
    while (cambia) { cambia = false; for (const e of els) if (dentro.has(e.a) !== dentro.has(e.b)) { dentro.add(e.a); dentro.add(e.b); cambia = true; } }
    return els.filter((e) => dentro.has(e.a));
  }
  function primer(sc) {
    const crudos = (sc.elementos || []).map((e, i) => ({ ...e, i, a: String(e.a ?? '').trim(), b: String(e.b ?? '').trim() }));
    if (!crudos.length) throw new Error('Añade los elementos del circuito');
    const nom = Continua.nombres(crudos), alm = crudos.filter((e) => e.t === 'C' || e.t === 'L');
    if (alm.length !== 1) throw new Error('El circuito tiene que tener un solo condensador o una sola bobina (si no, no es de primer orden)');
    const S = alm[0], esC = S.t === 'C', nS = nom[S.i];
    if ((S.cuando || 'siempre') !== 'siempre') throw new Error(`${nS} tiene que estar siempre conectado`);
    const val = Herramienta.leeSI(S.v, esC ? 1e-6 : 1e-3);
    if (!(val > 0)) throw new Error(`${nS}: ${esC ? 'la capacidad' : 'la inductancia'} debe ser un número mayor que 0`);
    const quita = (lista) => lista.map(({ i, cuando, ...e }) => e);
    // resuelve en continua la parte del circuito unida al elemento y devuelve su tensión (C) o su corriente (L)
    const estable = (lista, cuando) => {
      const parte = componente(lista, S.a), k = parte.indexOf(S);
      if (!parte.some((e) => e.t === 'V' || e.t === 'I')) return { x: 0, nota: 'no hay fuentes, así que todo está a 0' };
      let sol;
      try { sol = Continua.resolver({ elementos: quita(parte), carga: '' }); } catch (e) { throw new Error(`${cuando}: ${e.message}`); }
      return { x: esC ? sol.els[k].U : sol.els[k].I, sol };
    };
    const antes = crudos.filter((e) => (e.cuando || 'siempre') !== 'despues'), despues = crudos.filter((e) => (e.cuando || 'siempre') !== 'antes');
    const xu = esC ? 'V' : 'A', xn = esC ? `V<sub>${nS}</sub>` : `i<sub>${nS}</sub>`, que = esC ? `la tensión de ${nS} (de ${S.a} a ${S.b})` : `la corriente de ${nS} (de ${S.a} a ${S.b})`;
    const pasos = [], dado = lee(sc, 'x0', 'el valor inicial', { opcional: true, signo: true });
    const lista = (ls) => ls.map((e) => nom[e.i]).join(', ');
    let x0;
    if (dado !== null) { x0 = dado; pasos.push({ t: 'Antes de t = 0', html: `Se da el valor inicial: ${xn}(0<sup>−</sup>) = <b>${f(x0)} ${xu}</b>` }); }
    else { const r = estable(antes, 'Antes de t = 0'); x0 = r.x; pasos.push({ t: 'Antes de t = 0: régimen permanente', html: `Con ${lista(antes)}, en continua ${esC ? 'el condensador es un circuito abierto' : 'la bobina es un cortocircuito'}${r.nota ? `; ${r.nota}` : ''}. Resolviendo el circuito: ${xn}(0<sup>−</sup>) = <b>${f(x0)} ${xu}</b>` }); }
    pasos.push({ t: 'Justo después de t = 0', html: `${esC ? 'La tensión de un condensador' : 'La corriente de una bobina'} no puede saltar: ${xn}(0<sup>+</sup>) = ${xn}(0<sup>−</sup>) = <b>${f(x0)} ${xu}</b>` });
    const fin = estable(despues, 'Después de t = 0'), xf = fin.x;
    pasos.push({ t: 'Cuando t → ∞: régimen permanente', html: `Con ${lista(despues)} y ${esC ? 'el condensador abierto' : 'la bobina en cortocircuito'}${fin.nota ? `; ${fin.nota}` : ''}: ${xn}(∞) = <b>${f(xf)} ${xu}</b>` });
    const resto = componente(despues.filter((e) => e !== S), S.a);
    if (!resto.some((e) => e.a === S.b || e.b === S.b)) throw new Error(`Después de t = 0 no hay ningún camino entre ${S.a} y ${S.b} aparte de ${nS}: no se puede ${esC ? 'cargar ni descargar' : 'cargar ni descargar'}`);
    let th;
    try { th = Continua.resolver({ elementos: quita(resto), carga: 'nudos', thA: S.a, thB: S.b }).thev; } catch (e) { throw new Error(`Para la resistencia de Thévenin: ${e.message}`); }
    const Rth = th.Rth;
    if (!(Rth > 0)) throw new Error(`La resistencia que ve ${nS} sale ${f(Rth)} Ω: tiene que ser positiva para que haya un transitorio`);
    const tau = esC ? Rth * val : val / Rth;
    pasos.push({ t: `Constante de tiempo: la resistencia que ve ${nS}`, html: `Se quita ${nS}, se apagan las fuentes del circuito de después (tensión → cortocircuito, corriente → abierto) y la resistencia entre ${S.a} y ${S.b} es R<sub>th</sub> = <b>${f(Rth)} Ω</b>, así que τ = ${esC ? 'R<sub>th</sub>·C' : 'L/R<sub>th</sub>'} = <b>${u(tau, 's')}</b>` });
    if (Math.abs(x0 - xf) < 1e-12 * Math.max(1, Math.abs(xf))) throw new Error(`${que[0].toUpperCase() + que.slice(1)} ya vale lo mismo antes y después: no hay transitorio`);
    const X = (t) => xf + (x0 - xf) * Math.exp(-t / tau), dX = (t) => (-(x0 - xf) / tau) * Math.exp(-t / tau), otra = (t) => val * dX(t);
    const xTxt = xf ? `${f(xf)} ${sgn(x0 - xf)} ${f(Math.abs(x0 - xf))}·${ex(tau)}` : `${f(x0)}·${ex(tau)}`;
    pasos.push({ t: 'Método de los tres valores', html: `x(t) = x(∞) + [x(0<sup>+</sup>) − x(∞)]·e<sup>−t/τ</sup> ⇒ <b>${xn}(t) = ${xTxt} ${xu}</b><br>${esC ? `Corriente del condensador: i = C dV/dt = <b>${f(val * (-(x0 - xf) / tau))}·${ex(tau)} A</b>` : `Tensión de la bobina: v = L di/dt = <b>${f(val * (-(x0 - xf) / tau))}·${ex(tau)} V</b>`}` });
    const t = lee(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) pasos.push({ t: `En t = ${u(t, 's')}`, html: `${xn} = <b>${f(X(t))} ${xu}</b>, ${esC ? `i = ${u(otra(t), 'A')}` : `v = ${f(otra(t))} V`}` });
    const ob = lee(sc, 'obj', 'el valor que se quiere alcanzar', { opcional: true, signo: true });
    let tObj = null;
    if (ob !== null) {
      const fr = (ob - xf) / (x0 - xf);
      if (!(fr > 0 && fr <= 1)) throw new Error(`${que[0].toUpperCase() + que.slice(1)} no llega a ${f(ob)} ${xu}: va de ${f(x0)} a ${f(xf)}`);
      tObj = -tau * Math.log(fr);
      pasos.push({ t: `Tiempo hasta ${f(ob)} ${xu}`, html: `e<sup>−t/τ</sup> = ${f(fr)} ⇒ t = −τ ln ${f(fr)} = <b>${u(tObj, 's')}</b>` });
    }
    // para dibujar: el equivalente de Thévenin que ve el elemento después de t = 0
    const comun = { modo: 'primer', nombre: nS, esC, x0, xf, Rth, tau, t, tObj, T: 5 * tau, pasos, xTxt, R: Rth };
    if (esC) return { ...comun, base: 'rc', carga: true, V: xf, V0: x0, C: val, Vc: X, I: otra, VcTxt: xTxt, Vct: t !== null ? X(t) : null, It: t !== null ? otra(t) : null, Vo: ob, I0: otra(0), Ef: 0.5 * val * xf * xf };
    return { ...comun, base: 'rl', sube: true, V: xf * Rth, L: val, I: X, VL: otra, Inf: xf, I0: x0, ITxt: xTxt, It: t !== null ? X(t) : null, VLt: t !== null ? otra(t) : null, Io: ob, E: 0.5 * val * xf * xf };
  }

  function resolver(sc) {
    if (sc.modo === 'rl') return rl(sc);
    if (sc.modo === 'rlc') return rlc(sc);
    if (sc.modo === 'rlcp') return rlcp(sc);
    if (sc.modo === 'primer') return primer(sc);
    if (sc.proceso === 'conmuta') return rcConmuta(sc);
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
    { clave: 'rc-conmuta', nombre: 'Se carga por R y se descarga por otra R₂', sc: { modo: 'rc', proceso: 'conmuta', V: '12', V0: '', R: '1000', R2: '4700', C: '100', t1: '0,2', t: '' } },
    { clave: 'rl-chispa', nombre: 'Pico de tensión al abrir el interruptor de una bobina', sc: { modo: 'rl', proceso: 'conmuta', V: '12', R: '6', R2: '1000', L: '300', t1: '0,2', t: '' } },
    { clave: 'rl-i0', nombre: 'Bobina que ya llevaba corriente', sc: { modo: 'rl', proceso: 'subida', V: '12', R: '6', L: '300', I0: '0,5', t: '', Iobj: '1,5' } },
    { clave: 'rlc-tiempo', nombre: 'RLC: cuándo llega el condensador a 12 V', sc: { modo: 'rlc', V: '10', R: '20', L: '100', C: '10', V0: '', I0: '', t: '', Vobj: '12' } },
    { clave: 'rlcp-sub', nombre: 'RLC en paralelo con una fuente de corriente', sc: { modo: 'rlcp', I: '1', R: '200', L: '100', C: '10', V0: '', I0: '', t: '', Iobj: '' } },
    { clave: 'rlcp-sobre', nombre: 'RLC en paralelo sobreamortiguado', sc: { modo: 'rlcp', I: '0,5', R: '20', L: '100', C: '10', V0: '', I0: '', t: '', Iobj: '' } },
    { clave: 'primer-rc', nombre: 'Interruptor que conecta una segunda resistencia (RC)', sc: { modo: 'primer', elementos: [{ t: 'V', a: 'a', b: '0', v: '12', cuando: 'siempre' }, { t: 'R', a: 'a', b: 'b', v: '4k', cuando: 'siempre' }, { t: 'C', a: 'b', b: '0', v: '100', cuando: 'siempre' }, { t: 'R', a: 'b', b: '0', v: '4k', cuando: 'despues' }], x0: '', t: '', obj: '' } },
    { clave: 'primer-rl', nombre: 'Se desconecta la fuente de una bobina (RL)', sc: { modo: 'primer', elementos: [{ t: 'V', a: 'a', b: '0', v: '10', cuando: 'antes' }, { t: 'R', a: 'a', b: '0', v: '10', cuando: 'siempre' }, { t: 'R', a: 'a', b: 'b', v: '2', cuando: 'siempre' }, { t: 'L', a: 'b', b: '0', v: '100', cuando: 'siempre' }], x0: '', t: '', obj: '' } },
  ];

  return { resolver, rc, rl, rlc, rlcp, primer, ejemplos, f, u };
})();
if (typeof module !== 'undefined') module.exports = Transitorios;
