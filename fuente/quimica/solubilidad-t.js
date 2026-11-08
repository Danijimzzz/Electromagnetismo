/* =====================================================================
   Solubilidad de sales frente a la temperatura y gases disueltos con la ley de Henry (sin DOM).
   Datos de quimica/datos.js (SOLUBILIDAD_T, HENRY, con su fuente en FUENTES).
     sal(sc)   modo 'sal': solubilidad a una temperatura, disolución saturada y estado de una mezcla;
               modo 'cristal': cuánto cristaliza (o cuánto más se disuelve) al cambiar de T1 a T2;
               modo 'busca': a qué temperatura una cantidad de sal satura 100 g de agua
     gas(sc)   concentración de un gas disuelto c = k_H(T)·p (o la presión que da una concentración)
     Entre los datos (cada 20 °C) se interpola linealmente; fuera de 0–100 °C se avisa.
   La interfaz está en disoluciones/app.js y la prueba en pruebas/herramientas/disoluciones.js.
   ===================================================================== */
const SolT = (() => {
  const D = typeof Datos !== 'undefined' ? Datos : require('./datos.js');
  const Fm = typeof Formulas !== 'undefined' ? Formulas : require('./formulas.js');
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `^{${sg === '-' ? '−' : ''}${+e}}`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  function num(sc, k, nom, { min = -Infinity, estricto = false, opcional = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (estricto ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${estricto ? 'mayor que' : 'mayor o igual que'} ${min}`);
    return v;
  }
  const TS = D.T_SOL;
  const conSal = (id) => { const s = D.SOLUBILIDAD_T[id]; if (!s) throw new Error('Elige una sal de la lista'); return s; };
  const S = (v, T) => {
    if (T < TS[0] || T > TS[TS.length - 1]) throw new Error(`La temperatura debe estar entre ${TS[0]} y ${TS[TS.length - 1]} °C, que es lo que cubren los datos`);
    let i = Math.min(TS.length - 2, Math.max(0, Math.floor((T - TS[0]) / 20)));
    return v[i] + ((v[i + 1] - v[i]) * (T - TS[i])) / 20;
  };
  // temperaturas (°C) a las que la solubilidad vale x, por interpolación lineal en cada tramo
  const buscaT = (v, x) => { const r = []; for (let i = 0; i < TS.length - 1; i++) { const a = v[i], b = v[i + 1]; if ((a - x) * (b - x) <= 0 && a !== b) r.push(TS[i] + (20 * (x - a)) / (b - a)); else if (a === x && !r.includes(TS[i])) r.push(TS[i]); } return [...new Set(r.map((t) => +t.toFixed(6)))]; };
  const molal = (sal, Sg) => { const M = Fm.masaMolar(sal.f).M; return { M, m: (Sg * 10) / M }; };

  function sal(sc) {
    const sl = conSal(sc.sal), modo = sc.modo === 'cristal' ? 'cristal' : sc.modo === 'busca' ? 'busca' : 'sal', pasos = [];
    const curva = Array.from({ length: 51 }, (_, i) => ({ T: 2 * i, S: S(sl.v, 2 * i) }));
    const base = { sal: sl, id: sc.sal, curva, fuente: D.FUENTES.solubilidadT };
    if (modo === 'busca') {
      const x = num(sc, 'x', 'los gramos de sal por cada 100 g de agua', { min: 0, estricto: true }), r = buscaT(sl.v, x);
      const lo = Math.min(...sl.v), hi = Math.max(...sl.v);
      pasos.push({ t: 'Qué se busca', html: `La disolución está saturada cuando $S(T) = ${f(x)} "g/100 g"$ de agua. En la tabla, ${sl.nombre.toLowerCase()} va de ${f(lo)} a ${f(hi)} g/100 g entre 0 y 100 °C.` });
      if (!r.length) { pasos.push({ t: 'Resultado', html: x < lo ? `Ni siquiera a la temperatura de menor solubilidad se alcanza ${f(x)} g/100 g: <b>está saturada a cualquier temperatura</b> (el exceso no se disuelve).` : `Ni a la temperatura de mayor solubilidad se disuelven ${f(x)} g/100 g: <b>nunca llega a saturar</b> entre 0 y 100 °C, siempre es insaturada.` }); }
      else pasos.push({ t: 'Temperatura de saturación', html: `Interpolando linealmente entre los datos de ${r.length > 1 ? 'cada tramo' : 'su tramo'}: $T = ${r.map((t) => `${f(t, 4)} "°C"`).join(r.length > 1 ? '$ y $' : '')}$. Por encima de esa temperatura (si la solubilidad crece) la disolución es insaturada y por debajo cristalizaría el exceso.` + (r.length > 1 ? ' Hay dos porque la solubilidad de esta sal sube y luego baja.' : '') });
      return { ...base, modo, x, T: r, pasos };
    }
    const T = num(sc, 'T', 'la temperatura (°C)'), S1 = S(sl.v, T), agua = num(sc, 'agua', 'la masa de agua (g)', { min: 0, estricto: true });
    const w = S1 / (100 + S1) * 100, { M, m } = molal(sl, S1);
    pasos.push({ t: 'Solubilidad a esa temperatura', html: `Entre ${f(TS[Math.min(4, Math.floor(T / 20))])} y ${f(TS[Math.min(5, Math.floor(T / 20) + 1)])} °C se interpola con la tabla: $S(${f(T)} "°C") = ${f(S1)} "g de soluto por 100 g de agua"$.` });
    if (modo === 'sal') {
      const max = (S1 * agua) / 100;
      pasos.push({ t: 'La disolución saturada', html: `Cada 100 g de agua disuelven ${f(S1)} g, así que la disolución saturada tiene $w = {S}/{100 + S} · 100 = ${f(w)} "%"$ en masa y una molalidad $m = {S/M}/{0,1} = {${f(S1)}/${f(M)}}/{0,1} = ${f(m)} "mol/kg"$ ($M = ${f(M)} "g/mol"$).` });
      pasos.push({ t: `En ${f(agua)} g de agua`, html: `Se pueden disolver como máximo $${f(S1)} · ${f(agua)}/100 = ${f(max)} "g"$.` });
      const so = num(sc, 'soluto', 'la masa de soluto (g)', { min: 0, opcional: true });
      let estado = null;
      if (so !== null) {
        estado = Math.abs(so - max) <= 1e-9 * Math.max(1, max) ? 'saturada' : so < max ? 'insaturada' : 'saturada con sólido sin disolver';
        pasos.push({ t: 'Estado de tu mezcla', html: so < max - 1e-9 ? `Con ${f(so)} g de soluto la disolución es <b>insaturada</b>: aún admite ${f(max - so)} g más.` : so > max + 1e-9 ? `Con ${f(so)} g de soluto sobran ${f(so - max)} g: la disolución está <b>saturada</b> y esa masa queda como sólido sin disolver (o como disolución sobresaturada si se ha enfriado sin cristalizar).` : `Con ${f(so)} g de soluto la disolución está justo <b>saturada</b>.` });
      }
      return { ...base, modo, T, S: S1, w, m, M, agua, max, soluto: so, estado, pasos };
    }
    // cristalización
    const T2 = num(sc, 'T2', 'la temperatura final (°C)'), S2 = S(sl.v, T2), so = num(sc, 'soluto', 'la masa de soluto (g)', { min: 0, opcional: true });
    const disuelto = so === null ? (S1 * agua) / 100 : so, cap2 = (S2 * agua) / 100, cap1 = (S1 * agua) / 100;
    if (so !== null && so > cap1 + 1e-9) throw new Error(`A ${f(T)} °C en ${f(agua)} g de agua no caben más de ${f(cap1)} g: pon una masa menor o deja el campo vacío para la saturada`);
    pasos.push({ t: 'A la temperatura final', html: `$S(${f(T2)} "°C") = ${f(S2)} "g/100 g"$, así que en ${f(agua)} g de agua caben como máximo $${f(S2)} · ${f(agua)}/100 = ${f(cap2)} "g"$.` });
    const cr = Math.max(0, disuelto - cap2), mas = Math.max(0, cap2 - disuelto);
    pasos.push({ t: so === null ? 'Disolución saturada de partida' : 'Disolución de partida', html: `${so === null ? `Saturada a ${f(T)} °C: $${f(S1)} · ${f(agua)}/100 = ${f(cap1)} "g"$ de soluto disueltos.` : `Hay ${f(so)} g disueltos (el máximo a ${f(T)} °C sería ${f(cap1)} g).`}` });
    pasos.push({ t: cr > 0 ? 'Lo que cristaliza' : 'Resultado', html: cr > 0 ? `Al pasar de ${f(T)} a ${f(T2)} °C sobran $${f(disuelto)} − ${f(cap2)} = ${f(cr)} "g"$ de soluto, que <b>cristalizan</b> (como sal anhidra; las sales hidratadas cristalizan con su agua y dan algo más).` : `No cristaliza nada: a ${f(T2)} °C la disolución todavía admite ${f(mas)} g más de soluto${S2 > S1 ? ' (la solubilidad sube con la temperatura)' : ''}.` });
    return { ...base, modo, T, T2, S: S1, S2, agua, disuelto, cristaliza: cr, admiteMas: mas, pasos };
  }

  const kH = (g, T) => g.k * Math.exp(g.C * (1 / T - 1 / D.T0));
  function gas(sc) {
    const g = D.HENRY[sc.gas]; if (!g) throw new Error('Elige un gas de la lista');
    const Tc = num(sc, 'Tg', 'la temperatura (°C)', { min: 0 }), T = Tc + 273.15;
    if (Tc > 60) throw new Error('Por encima de 60 °C la extrapolación de k_H deja de ser fiable: pon una temperatura de 0 a 60 °C');
    const k = kH(g, T), pasos = [];
    pasos.push({ t: 'Constante de Henry a esa temperatura', html: `A 25 °C $k_H = ${f(g.k)} "mol/(L·atm)"$ y varía con $T$ como $k_H(T) = k_H(298) e^{C (1/T − 1/298,15)}$ con $C = ${f(g.C)} "K"$ (más gas disuelto cuanto más fría): $k_H(${f(T)} "K") = ${f(k)} "mol/(L·atm)"$.` });
    const objetivo = num(sc, 'obj', 'la concentración que quieres (mg/L)', { min: 0, estricto: true, opcional: true });
    const p = objetivo === null ? num(sc, 'p', 'la presión parcial (atm)', { min: 0, estricto: true }) : (objetivo / 1000 / g.M) / k;
    const c = objetivo === null ? k * p : objetivo / 1000 / g.M, mgL = c * g.M * 1000;
    if (objetivo === null) pasos.push({ t: 'Ley de Henry', html: `La concentración disuelta es proporcional a la presión parcial del gas sobre el líquido: $c = k_H p = ${f(k)} · ${f(p)} = ${f(c)} "mol/L"$, es decir, $${f(c)} · ${f(g.M)} = ${f(mgL)} "mg/L"$ ($M = ${f(g.M)} "g/mol"$).` });
    else pasos.push({ t: 'Presión necesaria', html: `Se quiere $c = ${f(objetivo)} "mg/L" = ${f(c)} "mol/L"$. De $c = k_H p$: $p = c/k_H = ${f(c)}/${f(k)} = ${f(p)} "atm"$.` });
    pasos.push({ t: 'Qué supone', html: 'La ley vale para gases poco solubles que no reaccionan con el agua (O₂, N₂, He…). El CO₂, el SO₂ o el NH₃ reaccionan y se disuelven en parte como otras especies, así que la ley da solo la parte disuelta como gas. Se ignora la presión de vapor del agua.' });
    const curva = Array.from({ length: 31 }, (_, i) => ({ T: 2 * i, c: kH(g, 2 * i + 273.15) * p }));
    return { modo: 'gas', gas: g, id: sc.gas, T: Tc, k, p, c, mgL, M: g.M, curva, fuente: D.FUENTES.henry, pasos };
  }

  const ejemplos = [
    { clave: 'kno3-saturada', nombre: 'Nitrato de potasio a 50 °C en 200 g de agua', sc: { modo: 'sal', sal: 'KNO3', T: '50', agua: '200', soluto: '150' } },
    { clave: 'kno3-cristal', nombre: 'Enfriar KNO₃ saturado de 80 a 20 °C (500 g de agua)', sc: { modo: 'cristal', sal: 'KNO3', T: '80', T2: '20', agua: '500', soluto: '' } },
    { clave: 'nacl-poca', nombre: 'NaCl casi no cambia con la temperatura', sc: { modo: 'cristal', sal: 'NaCl', T: '100', T2: '0', agua: '100', soluto: '' } },
    { clave: 'busca-k2cr2o7', nombre: 'Temperatura de saturación de 40 g de K₂Cr₂O₇ en 100 g de agua', sc: { modo: 'busca', sal: 'K2Cr2O7', x: '40' } },
    { clave: 'na2so4-pico', nombre: 'Sulfato de sodio: sube y luego baja (a 45 g/100 g)', sc: { modo: 'busca', sal: 'Na2SO4', x: '45' } },
  ];
  const ejemplosGas = [
    { clave: 'o2-agua', nombre: 'Oxígeno del aire en agua a 20 °C (p = 0,2095 atm)', sc: { modo: 'gas', gas: 'O2', Tg: '20', p: '0,2095', obj: '' } },
    { clave: 'co2-refresco', nombre: 'CO₂ en un refresco embotellado a 4 atm y 5 °C', sc: { modo: 'gas', gas: 'CO2', Tg: '5', p: '4', obj: '' } },
    { clave: 'co2-presion', nombre: 'Presión de CO₂ para tener 3 g/L a 5 °C', sc: { modo: 'gas', gas: 'CO2', Tg: '5', p: '', obj: '3000' } },
  ];
  return { sal, gas, kH, S, buscaT, ejemplos, ejemplosGas, f };
})();
if (typeof module !== 'undefined') module.exports = SolT;
