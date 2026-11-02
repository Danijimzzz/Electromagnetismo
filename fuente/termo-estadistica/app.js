/* =====================================================================
   Interfaz de Termodinámica estadística: cinco modos (dos niveles, oscilador de
   Einstein, niveles propios, sólido de Einstein y dos sólidos en contacto), con
   resultados, gráfica y desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en termo-estadistica/calculo.js.
   ===================================================================== */
(() => {
  const T = TermoEstadistica, { f } = T, txt = (x) => Herramienta.txt(f(x));
  const dato = (e, v) => [e, v];
  Calculadora.monta({
    C: T, carpeta: 'termo-estadistica', app: 'TermoEstadisticaApp',
    nota: 'Energías en meV (1 meV equivale a 11,6 K), temperaturas en K y frecuencias en THz. Se admite coma decimal, 3e8 y 3·10^8.',
    campos: (sc) => {
      const modo = sc.modo || 'dos';
      const m = { k: 'modo', nom: 'Sistema', tipo: 'sel', ops: [['dos', 'Dos niveles'], ['oscilador', 'Oscilador armónico (Einstein)'], ['niveles', 'Niveles propios (rotor, átomo…)'], ['einstein', 'Sólido de Einstein: Ω y S'], ['contacto', 'Dos sólidos en contacto']] };
      const Tk = { k: 'T', nom: 'Temperatura T', un: 'K', sep: 'Condiciones' };
      if (modo === 'oscilador') return [m, { k: 'nu', nom: 'Frecuencia ν', un: 'THz', sep: 'Oscilador' }, Tk];
      if (modo === 'niveles') return [m, { k: 'lista', nom: 'Niveles: energía (meV) y degeneración', tipo: 'area', filas: 8, ayuda: 'una pareja por línea', sep: 'Niveles' }, Tk];
      if (modo === 'einstein') return [m, { k: 'N', nom: 'Osciladores N', sep: 'Sólido' }, { k: 'q', nom: 'Cuantos de energía q' }, { k: 'eps', nom: 'Cuanto ε', un: 'meV', ayuda: 'para la temperatura' }];
      if (modo === 'contacto') return [m, { k: 'NA', nom: 'Osciladores de A (N_A)', sep: 'Sólidos' }, { k: 'NB', nom: 'Osciladores de B (N_B)' }, { k: 'qt', nom: 'Cuantos totales q', ayuda: 'hasta 20000' }, { k: 'qA0', nom: 'Cuantos de A al empezar', sep: 'Situación inicial' }];
      return [m, { k: 'dE', nom: 'Separación ΔE', un: 'meV', sep: 'Niveles' }, { k: 'g0', nom: 'Degeneración g₀ del fundamental' }, { k: 'g1', nom: 'Degeneración g₁ del excitado' }, Tk];
    },
    resumen: (s) => {
      const comun = (extra = []) => extra.concat([
        dato('Función de partición Z', f(s.Z, 6)), dato('Energía media U', `${f(s.Umev, 5)} meV (${f(s.UkJ, 4)} kJ/mol)`), dato('Entropía S/k', f(s.Sk, 5)),
        dato('Entropía molar', `${f(s.Sm, 5)} J/(mol·K)`), dato('Capacidad calorífica C<sub>V</sub>/k', f(s.Cvk, 5)), dato('Energía libre F', `${f(s.Fmev, 5)} meV`)]);
      if (s.modo === 'dos') return comun([dato('Población del fundamental', `${f(s.p[0] * 100, 5)} %`), dato('Población del excitado', `${f(s.p[1] * 100, 5)} %`), dato('θ = ΔE/k', `${f(s.theta, 5)} K`)]);
      if (s.modo === 'oscilador') return [dato('θ<sub>E</sub> = hν/k', `${f(s.theta, 5)} K`), dato('Ocupación media ⟨n⟩', f(s.nm, 5)), dato('Función de partición Z', f(s.Z, 6)), dato('Energía térmica U', `${f(s.Umev, 5)} meV`), dato('Punto cero', `${f(s.U0 / T.meV, 5)} meV`), dato('Entropía S/k', f(s.Sk, 5)), dato('Entropía molar', `${f(s.Sm, 5)} J/(mol·K)`), dato('Capacidad calorífica C<sub>V</sub>/k', f(s.Cvk, 5))];
      if (s.modo === 'niveles') return comun([dato('Niveles', String(s.n)), dato('Probabilidad del fundamental', `${f(s.p[s.E.indexOf(s.E0)] * 100, 5)} %`)]);
      if (s.modo === 'einstein') return [dato('Microestados Ω', omega(s)), dato('Entropía S/k = ln Ω', f(s.Sk, 6)), dato('Entropía S', `${f(s.Sk * T.kB, 5)} J/K`), dato('Energía U = q·ε', `${f(s.Umev, 5)} meV`), dato('Temperatura T', s.q >= 1 ? `${f(s.T, 5)} K` : '0')];
      return [dato('Reparto más probable q<sub>A</sub>*', String(s.qm)), dato('Probabilidad del máximo', `${f(s.pmax * 100, 5)} %`), dato('Desviación típica de q<sub>A</sub>', f(s.sd, 4)), dato(`Probabilidad a ±${s.ancho} cuantos`, `${f(s.dentro * 100, 5)} %`), dato('Entropía inicial / final', `${f(s.S0, 5)} / ${f(s.Sf, 5)} k`), dato('Aumento de entropía ΔS', `${f(s.dS, 4)} k`), dato('Sentido del flujo', s.flujo)];
    },
    grafica: (s) => {
      if (s.modo === 'dos' || s.modo === 'oscilador') {
        const osc = s.modo === 'oscilador', pts = s.curva, ymax = Math.max(...pts.map((p) => p[1]), s.Cvk) * 1.1;
        return { x: [0, s.Tmax], y: [0, osc ? Math.max(1.1, ymax) : ymax], fx: txt, fy: txt, ejeX: 'Temperatura (K)', ejeY: 'C_V / k',
          series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.T, s.Cvk]], color: '--ink', radio: 5 }], horizontales: osc ? [{ y: 1, color: '--serie-2', texto: 'Dulong-Petit' }] : [], verticales: [{ x: s.theta, color: '--muted', texto: osc ? 'θ_E' : 'θ' }] };
      }
      if (s.modo === 'niveles') {
        const n = Math.min(s.n, 40), orden = s.E.map((e, i) => [e, i]).sort((a, b) => a[0] - b[0]).slice(0, n), pts = orden.map(([, i], k) => [k, s.p[i]]);
        return { x: [-0.8, n - 0.2], y: [0, Math.max(...pts.map((p) => p[1])) * 1.1], fx: (v) => (Number.isInteger(v) ? String(v) : ''), fy: txt, ejeX: 'Nivel (ordenado por energía)', ejeY: 'probabilidad de cada nivel', series: [{ tipo: 'barras', pts, ancho: 0.7, color: '--serie-1' }] };
      }
      if (s.modo === 'einstein') {
        const pts = s.curva, y1 = Math.max(...pts.map((p) => p[1])) * 1.05, q = s.q, y = s.ln, tang = s.q >= 1 ? [[0, y - s.slope * q], [s.qmax, y + s.slope * (s.qmax - q)]] : [];
        return { x: [0, s.qmax], y: [0, y1], fx: txt, fy: txt, ejeX: 'Cuantos de energía q', ejeY: 'ln Ω',
          series: [{ pts, color: '--serie-1' }, ...(tang.length ? [{ pts: tang, color: '--serie-2', discontinua: true, grosor: 1.6 }] : []), { tipo: 'puntos', pts: [[q, y]], color: '--ink', radio: 5 }] };
      }
      const pts = s.curva, pm = s.pmax * 1.1;
      return { x: [0, s.q], y: [0, pm], fx: txt, fy: (v) => txt(v * 100) + ' %', ejeX: 'Cuantos de energía en A (q_A)', ejeY: 'probabilidad de cada reparto',
        series: [{ tipo: 'area', pts, color: '--serie-1', alfa: 0.25 }, { pts, color: '--serie-1' }], verticales: [{ x: s.qm, color: '--serie-2', texto: 'equilibrio' }, { x: s.qA0, color: '--muted', texto: 'inicio' }] };
    },
    leyenda: (s) => ({
      dos: `Curva de Schottky: la capacidad calorífica C_V/k del sistema de dos niveles. Es máxima cuando k_BT es del orden de ΔE y se anula a temperaturas muy altas y muy bajas. Punto: tu temperatura.`,
      oscilador: 'Capacidad calorífica de Einstein: sube desde 0 y se aproxima al límite clásico de Dulong-Petit (línea roja). Punto: tu temperatura; línea gris: θ_E.',
      niveles: 'Probabilidad de cada nivel de energía (ordenados de menor a mayor); si un nivel tiene varios estados, su peso incluye la degeneración.',
      einstein: 'Curva azul: ln Ω frente a q. La recta roja discontinua es su tangente en tu punto: su pendiente vale ε/k_BT, así que cuanto más empinada, más fría está la muestra.',
      contacto: 'Probabilidad de cada reparto de los cuantos entre A y B. Hay un pico muy estrecho en el reparto más probable (equilibrio térmico); con muchos osciladores el sistema casi nunca se aleja de él.',
    }[s.modo]),
    azar: () => ({ modo: 'dos', T: String(Math.round(50 + Math.random() * 450)), dE: String(Math.round(2 + Math.random() * 38)), g0: '1', g1: String(1 + Math.floor(Math.random() * 4)) }),
    enunciado: (sc, s) => (s && s.modo === 'dos' ? `Un sistema de dos niveles (ΔE = ${sc.dE} meV, g₀ = ${sc.g0}, g₁ = ${sc.g1}) está a ${sc.T} K. Calcula la función de partición, las poblaciones y la entropía.` : undefined),
  });
  function omega(s) { return s.ln < 34 ? f(Math.round(Math.exp(s.ln)), 8) : `${f(Math.pow(10, (s.ln / Math.LN10) % 1), 3)}·10<sup>${Math.floor(s.ln / Math.LN10)}</sup>`; }
})();
