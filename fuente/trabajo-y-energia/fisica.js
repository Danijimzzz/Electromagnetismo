/* =====================================================================
   Trabajo y energía (sin DOM): un bloque que baja por una rampa, recorre un
   tramo horizontal y comprime un muelle, con rozamiento en cada tramo.
   Resultados analíticos con el desarrollo paso a paso y una simulación en el
   tiempo para la animación y las barras de energía. Unidades del SI.
   ===================================================================== */
const Energia = (() => {
  const rad = (g) => (g * Math.PI) / 180;
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(2).replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d + 1));
    return s.replace('.', ',').replace('-', '−');
  };

  // escena: { m, g, h, ang, mu1, d, mu2, k, v0 }
  function leer(sc) {
    const n = (k, nom, min = 0, estricto = false) => {
      const v = +String(sc[k]).replace(',', '.');
      if (!isFinite(v) || (estricto ? v <= min : v < min)) throw new Error(`${nom} debe ser ${estricto ? 'mayor que' : 'al menos'} ${min}`);
      return v;
    };
    const o = { m: n('m', 'La masa', 0, true), g: n('g', 'La gravedad', 0, true), h: n('h', 'La altura'), ang: n('ang', 'El ángulo', 0, true),
      mu1: n('mu1', 'El rozamiento de la rampa'), d: n('d', 'La longitud del tramo horizontal'), mu2: n('mu2', 'El rozamiento del tramo horizontal'), k: n('k', 'La constante del muelle'), v0: n('v0', 'La velocidad inicial') };
    if (o.ang >= 90) throw new Error('El ángulo debe ser menor que 90°');
    o.L = o.h / Math.sin(rad(o.ang));
    return o;
  }

  /* ---------- Solución analítica con el desarrollo ---------- */
  function resolver(sc) {
    const p = leer(sc), { m, g, h, ang, mu1, d, mu2, k, v0, L } = p;
    const pasos = [], res = {};
    const Ei = 0.5 * m * v0 * v0 + m * g * h;
    pasos.push({ t: 'Energía inicial', html: `$E_0 = 1/2 m v_0^2 + m g h = 1/2 · ${f(m)} · ${f(v0)}^2 + ${f(m)} · ${f(g)} · ${f(h)}$ = <b>${f(Ei)} J</b>` });
    // ¿arranca? En reposo en la rampa solo baja si tan θ > μ
    const tan = Math.tan(rad(ang));
    if (v0 === 0 && h > 0 && mu1 >= tan) {
      pasos.push({ t: 'Rampa', html: `En reposo el bloque no se mueve: $μ_1 = ${f(mu1)} ≥ tg θ = ${f(tan)}$ (el rozamiento estático puede sujetarlo).` });
      return { p, pasos, res: { quieto: true }, Ei };
    }
    // rampa: W_roz = −μ m g cos θ · L
    const Wr1 = -mu1 * m * g * Math.cos(rad(ang)) * L;
    let vb2 = v0 * v0 + 2 * g * h + (2 * Wr1) / m;
    if (h > 0) pasos.push({ t: 'Bajada por la rampa', html: `Longitud $L = h/{sen θ} = ${f(L)} "m"$. Trabajo del rozamiento $W_r1 = −μ_1 m g cos θ · L$ = <b>${f(Wr1)} J</b>.<br>$1/2 m v_B^2 = E_0 + W_r1 ⇒ v_B = √(v_0^2 + 2 g h − {2 μ_1 g h}/{tg θ})$ = <b>${vb2 > 0 ? f(Math.sqrt(vb2)) : '0'} m/s</b>` });
    if (vb2 <= 0) {
      // se para en la rampa (solo si sube con v0... aquí baja, así que v² < 0 significa que frena antes de llegar)
      const s = (v0 * v0) / (2 * g * (mu1 * Math.cos(rad(ang)) - Math.sin(rad(ang))));
      pasos.push({ t: 'Se para en la rampa', html: `El rozamiento frena el bloque tras recorrer $s = v_0^2/(2 g (μ_1 cos θ − sen θ))$ = <b>${f(s)} m</b>.` });
      res.paraRampa = s;
      return { p, pasos, res, Ei };
    }
    res.vB = Math.sqrt(vb2);
    // tramo horizontal
    const Wr2 = -mu2 * m * g * d;
    const vc2 = vb2 + (2 * Wr2) / m;
    if (vc2 <= 0) {
      const s = vb2 / (2 * mu2 * g);
      pasos.push({ t: 'Tramo horizontal', html: `El rozamiento lo frena antes del muelle: $1/2 m v_B^2 = μ_2 m g s ⇒ s = v_B^2/(2 μ_2 g)$ = <b>${f(s)} m</b> (de ${f(d)} m).` });
      res.paraLlano = s;
      res.calor = Ei;
      pasos.push({ t: 'Balance', html: `Toda la energía inicial se disipa por rozamiento: Q = ${f(Ei)} J.` });
      return { p, pasos, res, Ei };
    }
    res.vC = Math.sqrt(vc2);
    pasos.push({ t: 'Tramo horizontal', html: `$W_r2 = −μ_2 m g d$ = <b>${f(Wr2)} J</b> ⇒ $v_C = √(v_B^2 − 2 μ_2 g d)$ = <b>${f(res.vC)} m/s</b> al llegar al muelle.` });
    if (k > 0) {
      // compresión máxima con rozamiento μ₂ bajo el muelle: ½ k x² + μ₂ m g x = ½ m v_C²
      const a = 0.5 * k, b = mu2 * m * g, c = -0.5 * m * vc2;
      const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      res.x = x;
      res.Fmax = k * x;
      pasos.push({ t: 'Compresión del muelle', html: `$1/2 k x^2 + μ_2 m g x = 1/2 m v_C^2 ⇒ ${f(a)} x^2 + ${f(b)} x − ${f(-c)} = 0$ ⇒ <b>x = ${f(x)} m</b>. Fuerza máxima del muelle $k x$ = <b>${f(res.Fmax)} N</b>, energía elástica $1/2 k x^2$ = <b>${f(0.5 * k * x * x)} J</b>.` });
      // ¿vuelve? el muelle lo empuja si k x > μ m g
      res.vuelve = k * x > mu2 * m * g;
      pasos.push({ t: 'Después', html: res.vuelve ? `Como $k x = ${f(k * x)} "N" > μ_2 m g = ${f(mu2 * m * g)} "N"$, el muelle lo devuelve hacia la rampa. La animación sigue el movimiento completo.` : `Como $k x ≤ μ_2 m g$, el rozamiento estático lo mantiene comprimido: se queda ahí.` });
    } else pasos.push({ t: 'Sin muelle', html: `Sigue con $v_C$ = ${f(res.vC)} m/s al final del tramo.` });
    return { p, pasos, res, Ei };
  }

  /* ---------- Simulación en el tiempo ---------- */
  // coordenada s a lo largo del recorrido: 0 en lo alto de la rampa, L al pie, L + d en el muelle.
  // RK4 con el sentido del rozamiento fijo en cada paso; los pasos se recortan para caer justo en
  // los cambios de tramo (pie de la rampa y muelle), así la energía se conserva salvo el calor.
  function simular(sc, tmax = 30, dt = 1 / 600) {
    const p = leer(sc), { m, g, ang, mu1, d, mu2, k, v0, L } = p;
    const th = rad(ang), sin = Math.sin(th), cos = Math.cos(th);
    const bordes = [L, L + d];
    const tramo = (s, sv) => s < L || (s === L && sv < 0); // en la rampa
    const Fap = (s, enRampa) => (enRampa ? m * g * sin : 0) - (s > L + d ? k * (s - L - d) : 0);
    const roz = (enRampa) => (enRampa ? mu1 * m * g * cos : mu2 * m * g);
    let s = 0, v = v0, Q = 0, t = 0;
    const out = [];
    const estado = () => {
      const x = Math.max(0, s - L - d), y = s < L ? (L - s) * sin : 0;
      return { t, s, v, K: 0.5 * m * v * v, Ug: m * g * y, Ue: 0.5 * k * x * x, Q, y, x };
    };
    // un paso RK4 de duración h con el rozamiento en sentido −dir y el tramo fijo
    const paso = (h, dir, enRampa) => {
      const fr = roz(enRampa) * dir;
      const a = (x) => (Fap(x, enRampa) - fr) / m;
      const k1v = a(s), k1s = v;
      const k2v = a(s + (h / 2) * k1s), k2s = v + (h / 2) * k1v;
      const k3v = a(s + (h / 2) * k2s), k3s = v + (h / 2) * k2v;
      const k4v = a(s + h * k3s), k4s = v + h * k3v;
      return { s: s + (h / 6) * (k1s + 2 * k2s + 2 * k3s + k4s), v: v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v) };
    };
    out.push(estado());
    let quieto = 0, siguiente = 1 / 60;
    while (t < tmax) {
      let dir = Math.sign(v);
      const enRampa = tramo(s, dir || Math.sign(Fap(s, s < L)));
      if (dir === 0) {
        // en reposo: el rozamiento estático lo sujeta si puede
        const F = Fap(s, enRampa);
        if (Math.abs(F) <= roz(enRampa) + 1e-9) { quieto += dt; t += dt; if (quieto > 0.5) break; if (t >= siguiente) { out.push(estado()); siguiente += 1 / 60; } continue; }
        dir = Math.sign(F);
      }
      quieto = 0;
      let h = dt, n = paso(h, dir, enRampa);
      // ¿se para dentro del paso? busca el instante con v = 0
      if (Math.sign(n.v) === -dir) {
        let lo = 0, hi = h;
        for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (Math.sign(paso(mid, dir, enRampa).v) === -dir) hi = mid; else lo = mid; }
        h = lo; n = paso(h, dir, enRampa); n.v = 0; n.para = true;
      }
      // ¿cruza un cambio de tramo? recorta el paso para caer justo en él
      for (const b of bordes) {
        if ((s - b) * (n.s - b) < 0) {
          let lo = 0, hi = h;
          for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if ((s - b) * (paso(mid, dir, enRampa).s - b) < 0) hi = mid; else lo = mid; }
          h = hi; n = paso(h, dir, enRampa); n.s = b;
          break;
        }
      }
      Q += roz(enRampa) * Math.abs(n.s - s);
      s = n.s; v = n.v; t += h;
      if (s < 0) { s = 0; v = 0; }
      if (t >= siguiente || n.para) { out.push(estado()); if (t >= siguiente) siguiente += 1 / 60; }
    }
    out.push(estado());
    return { p, puntos: out, E0: out[0].K + out[0].Ug };
  }

  const ejemplos = [
    { clave: 'rampa-muelle', nombre: 'Rampa, llano y muelle', sc: { m: 2, g: 9.8, h: 5, ang: 30, mu1: 0.1, d: 4, mu2: 0.2, k: 200, v0: 0 } },
    { clave: 'sin-rozamiento', nombre: 'Sin rozamiento: oscila para siempre', sc: { m: 1, g: 9.8, h: 2, ang: 45, mu1: 0, d: 3, mu2: 0, k: 100, v0: 0 } },
    { clave: 'para-llano', nombre: 'Se para antes del muelle', sc: { m: 2, g: 9.8, h: 5, ang: 30, mu1: 0.1, d: 10, mu2: 0.5, k: 200, v0: 0 } },
    { clave: 'no-arranca', nombre: 'El rozamiento lo sujeta en la rampa', sc: { m: 2, g: 9.8, h: 1, ang: 20, mu1: 0.5, d: 4, mu2: 0.2, k: 200, v0: 0 } },
    { clave: 'empujon', nombre: 'Con un empujón inicial', sc: { m: 2, g: 9.8, h: 1, ang: 20, mu1: 0.5, d: 4, mu2: 0.2, k: 200, v0: 3 } },
    { clave: 'muelle-duro', nombre: 'Muelle duro que lo devuelve a la rampa', sc: { m: 0.5, g: 9.8, h: 3, ang: 40, mu1: 0.05, d: 2, mu2: 0.05, k: 800, v0: 0 } },
  ];

  return { resolver, simular, leer, f, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Energia;
