/* =====================================================================
   Óptica geométrica de lentes delgadas y espejos esféricos (sin DOM), en aproximación
   paraxial y con la convención «real es positivo»: 1/s + 1/s′ = 1/f, m = −s′/s.
   f > 0 en la lente convergente y el espejo cóncavo, f < 0 en la divergente y el convexo;
   s > 0 es un objeto real (delante del elemento) y s′ > 0 una imagen real (detrás de la
   lente o delante del espejo). La interfaz está en app.js y la prueba en
   pruebas/herramientas/optica.js.
     resolver(sc)  { tipo, f, s, h } (texto) → { fs, sp, m, hp, real, derecha, tam, pasos, … }
     resolver(sc) con sc.modo = 'sistema': varias lentes seguidas (sc.datos: una línea por lente,
                   «tipo f separación»); la imagen de cada una es el objeto de la siguiente y se
                   comprueba con las matrices de rayos (ABCD).
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     TIPOS         los cuatro elementos: clave, nombre, lente o espejo y signo de f
   ===================================================================== */
const Optica = (() => {
  const TIPOS = [
    { clave: 'convergente', nombre: 'Lente convergente', lente: true, signo: 1 },
    { clave: 'divergente', nombre: 'Lente divergente', lente: true, signo: -1 },
    { clave: 'concavo', nombre: 'Espejo cóncavo', lente: false, signo: 1 },
    { clave: 'convexo', nombre: 'Espejo convexo', lente: false, signo: -1 },
  ];
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser mayor que 0`);
    return v;
  }

  /* ---------- Sistema de varias lentes ---------- */
  // una línea por lente: [convergente|divergente] f [separación con la lente anterior]
  function leeElementos(texto) {
    const lineas = String(texto ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Escribe al menos una lente: una línea por lente, por ejemplo «convergente 10» y «divergente 15 8»');
    if (lineas.length > 6) throw new Error('Como mucho 6 lentes');
    return lineas.map((l, i) => {
      const tk = l.split(/[\s;]+/).filter(Boolean), nombre = `la lente ${i + 1}`;
      let signo = 0;
      if (/^[a-zñ]/i.test(tk[0])) {
        const t = tk.shift().toLowerCase();
        if (/^(conv|c$)/.test(t)) signo = 1; else if (/^(div|d$)/.test(t)) signo = -1; else throw new Error(`En ${nombre} escribe «convergente» o «divergente» (o solo el número, con signo)`);
      }
      const fv = leeNum(tk[0]);
      if (tk[0] === undefined || !isFinite(fv)) throw new Error(`Falta la distancia focal de ${nombre}`);
      if (fv === 0) throw new Error(`La distancia focal de ${nombre} no puede ser 0`);
      const fs = signo ? signo * Math.abs(fv) : fv;
      let d = 0;
      if (i > 0) {
        if (tk[1] === undefined) throw new Error(`Falta la separación entre la lente ${i} y la ${i + 1} (tercer número de la línea ${i + 1})`);
        d = leeNum(tk[1]);
        if (!isFinite(d) || d < 0) throw new Error(`La separación de ${nombre} debe ser un número mayor o igual que 0`);
      }
      return { fs, d };
    });
  }

  function sistema(sc) {
    const s0 = lee(sc, 's', 'la distancia del objeto'), h = lee(sc, 'h', 'la altura del objeto'), E = leeElementos(sc.datos);
    const filas = [], pasos = [], fmt = (v) => (isFinite(v) ? f(v) : '∞'), mul = (P, Q) => [P[0] * Q[0] + P[1] * Q[2], P[0] * Q[1] + P[1] * Q[3], P[2] * Q[0] + P[3] * Q[2], P[2] * Q[1] + P[3] * Q[3]];
    let x = 0, M = [1, 0, 0, 1]; // matriz de rayos (A, B, C, D) de la primera a la última lente
    pasos.push({ t: 'Convención', html: `Cada lente forma una imagen y esa imagen es el objeto de la siguiente. $s_i$ es la distancia del objeto a la lente $i$ (positiva si es real, negativa si es virtual) y $s′_i$ la de su imagen (positiva a la derecha). En cada lente se cumple $1/s_i + 1/s′_i = 1/f_i$, y la separación pasa la imagen anterior a objeto: $s_i = d_i − s′_{i−1}$.` });
    pasos.push({ t: 'Datos', html: `Objeto a $s_1 = ${f(s0)} "cm"$ de la primera lente, con $h = ${f(h)} "cm"$. ${E.map((e, i) => `Lente ${i + 1}: $f_${i + 1} = ${f(e.fs)} "cm"$${i ? `, a $d_${i + 1} = ${f(e.d)} "cm"$ de la anterior` : ''}`).join('; ')}.` });
    E.forEach((e, i) => {
      x = i ? x + e.d : 0;
      const prev = i ? filas[i - 1] : null, s = i ? e.d - prev.sp : s0, fs = e.fs;
      let sp, m;
      if (s === 0) { sp = 0; m = 1; } // la imagen anterior cae justo en la lente: pasa sin cambio
      else {
        const u = isFinite(s) ? 1 / s : 0, v = 1 / fs - u;
        sp = Math.abs(v) < 1e-12 / Math.abs(fs) ? Infinity : 1 / v;
        m = !isFinite(sp) ? NaN : u === 0 ? 0 : -u / v;
      }
      filas.push({ i: i + 1, fs, d: e.d, x, s, sp, m, real: isFinite(sp) && sp > 0, enInfinito: !isFinite(sp), objetoVirtual: s < 0 });
      M = mul([1, 0, -1 / fs, 1], mul(i ? [1, e.d, 0, 1] : [1, 0, 0, 1], M));
      const nat = !isFinite(sp) ? 'los rayos salen paralelos: la imagen está en el infinito' : sp > 0 ? 'imagen real' : 'imagen virtual';
      let html;
      if (!isFinite(s)) html = `Los rayos llegan paralelos (la imagen anterior estaba en el infinito): $1/s_${i + 1} = 0$ y $s′_${i + 1} = f_${i + 1} = ${f(fs)} "cm"$ (la imagen se forma en el plano focal).`;
      else html = `${i ? `$s_${i + 1} = d_${i + 1} − s′_${i} = ${f(e.d)} − (${fmt(prev.sp)}) = ${f(s)} "cm"$${s < 0 ? ' (objeto virtual: los rayos llegan convergiendo hacia un punto situado detrás de la lente)' : ''}.<br>` : ''}$1/s′_${i + 1} = 1/f_${i + 1} − 1/s_${i + 1} = 1/(${f(fs)}) − 1/(${f(s)})$ ⇒ $s′_${i + 1} = ${fmt(sp)} "cm"$ (${nat})${isFinite(m) ? `, $m_${i + 1} = −s′_${i + 1}/s_${i + 1} = ${f(m)}$` : ''}.`;
      pasos.push({ t: `Lente ${i + 1}`, html });
    });
    const n = filas.length, U = filas[n - 1], spF = U.sp, xImg = isFinite(spF) ? U.x + spF : Infinity;
    // rayos desde la punta del objeto: paralelo al eje y por el centro de la primera lente
    const traza = (y0, th0) => { let y = y0, th = th0, xa = -s0; const pts = [[xa, y]]; for (const r of filas) { y += th * (r.x - xa); xa = r.x; pts.push([xa, y]); th -= y / r.fs; } return { pts, y, th, xa }; };
    const A = traza(h, 0), B = traza(h, -h / s0);
    const hp = isFinite(spF) ? B.y + B.th * spF : NaN, mTot = isFinite(hp) ? hp / h : NaN;
    const feq = Math.abs(M[2]) > 1e-12 ? -1 / M[2] : Infinity;
    const real = isFinite(spF) && spF > 0, derecha = isFinite(mTot) && mTot > 0, tam = !isFinite(mTot) ? '' : Math.abs(Math.abs(mTot) - 1) < 1e-9 ? 'igual' : Math.abs(mTot) > 1 ? 'mayor' : 'menor';
    pasos.push({ t: 'Aumento total', html: isFinite(mTot) ? `$m = ${filas.map((r) => `m_${r.i}`).join(' · ')} = ${filas.map((r) => `(${fmt(r.m)})`).join(' · ')} = ${f(mTot)}$, que coincide con $h′/h$ siguiendo el rayo que pasa por el centro de la primera lente. La imagen final está a $${f(spF)} "cm"$ de la última lente: ${real ? 'real' : 'virtual'}, ${derecha ? 'derecha' : 'invertida'} y de tamaño ${tam === 'igual' ? 'igual' : tam}. $h′ = m·h = ${f(hp)} "cm"$.` : 'La imagen final está en el infinito: para ese objeto el sistema es afocal y no se puede dar un aumento lateral (se usa el aumento angular).' });
    if (n > 1) pasos.push({ t: 'Lente equivalente', html: isFinite(feq) ? `Con las matrices de rayos de las $${n}$ lentes, el sistema equivale a una lente de $f = −1/C = ${f(feq)} "cm"$ (potencia $${f(100 / feq)} "D"$)${n === 2 ? `. Para dos lentes delgadas, $1/f = 1/f_1 + 1/f_2 − d/(f_1 f_2) = ${f(1 / feq)} "cm"^{−1}$` : ''}.` : 'La matriz de rayos tiene $C = 0$: el sistema es afocal (un haz paralelo sale paralelo, como un telescopio).' });
    return { modo: 'sistema', s: s0, h, filas, n, sp: spF, m: mTot, hp, real, derecha, tam, enfoque: !isFinite(spF), feq, potencia: isFinite(feq) ? 100 / feq : 0, xImg, rayoA: A, rayoB: B, pasos, lente: true };
  }

  function resolver(sc) {
    if (sc.modo === 'sistema') return sistema(sc);
    const T = TIPOS.find((x) => x.clave === sc.tipo);
    if (!T) throw new Error('Elige el tipo de lente o de espejo');
    const fm = lee(sc, 'f', 'la distancia focal'), s = lee(sc, 's', 'la distancia del objeto'), h = lee(sc, 'h', 'la altura del objeto');
    const fs = T.signo * fm, enfoque = Math.abs(s - fs) < 1e-9 * Math.max(s, fm);
    const sp = enfoque ? Infinity : 1 / (1 / fs - 1 / s), m = enfoque ? Infinity : -sp / s, hp = m * h;
    const real = !enfoque && sp > 0, derecha = !enfoque && m > 0;
    const tam = enfoque ? '' : Math.abs(Math.abs(m) - 1) < 1e-9 ? 'igual' : Math.abs(m) > 1 ? 'mayor' : 'menor';
    const potencia = 100 / fs, radio = 2 * fs; // dioptrías (f en cm) y radio de curvatura del espejo
    const pasos = [
      { t: 'Convención', html: `Se usa «real es positivo»: $f > 0$ en ${T.lente ? 'la lente convergente' : 'el espejo cóncavo'} y $f < 0$ en ${T.lente ? 'la divergente' : 'el convexo'}. Aquí $f = ${f(fs)} "cm"$.` },
      { t: 'Datos', html: `$f = ${f(fs)} "cm"$, $s = ${f(s)} "cm"$, $h = ${f(h)} "cm"$` },
    ];
    if (enfoque) {
      pasos.push({ t: 'Posición de la imagen', html: `$1/s′ = 1/f − 1/s = 0$: el objeto está en el foco, los rayos salen paralelos y la imagen se forma en el infinito.` });
    } else {
      pasos.push(
        { t: 'Posición de la imagen', html: `$1/s′ = 1/f − 1/s = 1/(${f(fs)}) − 1/${f(s)} = ${f(1 / sp)} "cm"^{−1}$` },
        { t: 'Distancia de la imagen', html: `$s′ = ${f(sp)} "cm"$ ⇒ ${real ? `imagen real, ${T.lente ? 'al otro lado de la lente' : 'delante del espejo'}` : `imagen virtual, ${T.lente ? 'al mismo lado que el objeto' : 'detrás del espejo'}`}` },
        { t: 'Aumento lateral', html: `$m = −s′/s = −(${f(sp)})/${f(s)} = ${f(m)}$ ⇒ imagen ${derecha ? 'derecha' : 'invertida'} y de tamaño ${tam === 'igual' ? 'igual' : tam}` },
        { t: 'Altura de la imagen', html: `$h′ = m·h = ${f(m)}·${f(h)} = ${f(hp)} "cm"$` },
      );
    }
    pasos.push(T.lente
      ? { t: 'Potencia', html: `$P = 1/f = 1/(${f(fs / 100)} "m") = ${f(potencia)} "D"$` }
      : { t: 'Radio de curvatura', html: `$R = 2f = ${f(radio)} "cm"$ (el centro de curvatura está a ${f(Math.abs(radio))} cm del espejo, ${fs > 0 ? 'delante' : 'detrás'})` });
    return { tipo: T.clave, lente: T.lente, fs, s, h, sp, m, hp, real, derecha, tam, enfoque, potencia, radio, pasos };
  }

  const ejemplos = [
    { clave: 'lupa', nombre: 'Lupa: objeto dentro del foco', sc: { tipo: 'convergente', f: '10', s: '6', h: '2' } },
    { clave: 'proyector', nombre: 'Lente convergente: imagen real invertida', sc: { tipo: 'convergente', f: '10', s: '30', h: '2' } },
    { clave: 'mirilla', nombre: 'Lente divergente (mirilla)', sc: { tipo: 'divergente', f: '15', s: '40', h: '4' } },
    { clave: 'afeitado', nombre: 'Espejo de afeitar (cóncavo)', sc: { tipo: 'concavo', f: '40', s: '15', h: '3' } },
    { clave: 'maquillaje', nombre: 'Espejo cóncavo: imagen real', sc: { tipo: 'concavo', f: '20', s: '50', h: '5' } },
    { clave: 'sis-dos', nombre: 'Dos lentes convergentes seguidas', sc: { modo: 'sistema', s: '30', h: '2', datos: 'convergente 10\nconvergente 5 25' } },
    { clave: 'sis-conv-div', nombre: 'Sistema con objeto virtual: convergente + divergente', sc: { modo: 'sistema', s: '60', h: '4', datos: 'convergente 20\ndivergente 10 10' } },
    { clave: 'sis-contacto', nombre: 'Dos lentes en contacto (f equivalente)', sc: { modo: 'sistema', s: '60', h: '2', datos: 'convergente 20\nconvergente 30 0' } },
    { clave: 'sis-microscopio', nombre: 'Microscopio compuesto (objetivo y ocular)', sc: { modo: 'sistema', s: '1.2', h: '0.1', datos: 'convergente 1\nconvergente 5 9' } },
    { clave: 'sis-afocal', nombre: 'Imagen final en el infinito', sc: { modo: 'sistema', s: '30', h: '2', datos: 'convergente 10\nconvergente 5 20' } },
    { clave: 'retrovisor', nombre: 'Retrovisor (espejo convexo)', sc: { tipo: 'convexo', f: '30', s: '200', h: '150' } },
  ];

  return { resolver, ejemplos, f, TIPOS };
})();
if (typeof module !== 'undefined') module.exports = Optica;
