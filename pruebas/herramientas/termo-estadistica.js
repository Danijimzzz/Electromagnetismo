/* Comprobación de Termodinámica estadística: cálculos en Node (frente a fórmulas cerradas y
   valores hechos a mano) y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo termo-estadistica). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Termodinámica estadística';
  const C = require(path.join(fuente, 'termo-estadistica', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    const k = C.kB, mev = C.meV;
    // dos niveles, ΔE = 10 meV a 300 K: x = ΔE/kT, p₁ = 1/(1 + e^x), S/k = ln Z + x·p₁, C/k = x²·p₀·p₁
    {
      const r = ej('dos'), x = 10 * mev / (k * 300), p1 = 1 / (1 + Math.exp(x));
      cerca(r.x, x, 1e-12, 'x = ΔE/kT'); cerca(r.p[1], p1, 1e-12, 'población del excitado'); cerca(r.Z, 1 + Math.exp(-x), 1e-12, 'Z');
      cerca(r.Sk, Math.log(1 + Math.exp(-x)) + x * p1, 1e-12, 'S/k'); cerca(r.Cvk, x * x * p1 * (1 - p1), 1e-12, 'C_V/k'); cerca(r.p[1], 0.40449, 5e-5, 'p₁ hecho a mano');
      cerca(r.F, r.U - 300 * r.S, 1e-27, 'F = U − TS');
    }
    // fundamental único y excitado triple: Z = 1 + 3e^{−x}; a T → ∞, S/k → ln 4 y p₁ → 3/4
    {
      const r = ej('triplete'), x = 5 * mev / (k * 100); cerca(r.Z, 1 + 3 * Math.exp(-x), 1e-12, 'Z con g₁ = 3');
      const alto = C.resolver({ modo: 'dos', T: '1e9', dE: '5', g0: '1', g1: '3' }); cerca(alto.Sk, Math.log(4), 1e-6, 'S/k a temperatura altísima'); cerca(alto.p[1], 0.75, 1e-6, 'p₁ → g₁/(g₀ + g₁)');
    }
    // hidrógeno, 10,2 eV, g = 2 y 8 a 5800 K: N₂/N₁ = 4·e^{−10,2 eV/kT} ≈ 5,48·10⁻⁹
    { const r = ej('hidrogeno'); cerca(r.p[1] / r.p[0] * 1e9, 4 * Math.exp(-10.2 * C.eV / (k * 5800)) * 1e9, 1e-6, 'N₂/N₁ del hidrógeno'); cerca(r.p[1] / r.p[0] * 1e9, 5.48, 0.01, 'N₂/N₁ hecho a mano (≈ 5,48·10⁻⁹)'); }
    // oscilador de Einstein: fórmulas cerradas frente a la suma directa sobre niveles
    {
      const r = ej('einstein-diamante'), eps = C.h * 27.5e12, E = Array.from({ length: 400 }, (_, n) => n * eps), g = E.map(() => 1), b = C.niveles(E, g, 300);
      cerca(r.Z, b.Z, 1e-9, 'Z del oscilador (suma de niveles)'); cerca(r.U, b.U, 1e-26, 'U del oscilador'); cerca(r.Sk, b.S / k, 1e-9, 'S del oscilador'); cerca(r.Cvk, b.Cv / k, 1e-9, 'C_V del oscilador');
      cerca(r.theta, 1319.8, 0.1, 'θ_E del diamante'); cerca(r.Cvk, 0.244, 2e-3, 'C_V/k de Einstein a 300 K (hecho a mano)');
      const alto = C.resolver({ modo: 'oscilador', T: '1e6', nu: '27,5' }); cerca(alto.Cvk, 1, 1e-5, 'límite de Dulong-Petit'); const bajo = C.resolver({ modo: 'oscilador', T: '5', nu: '27,5' }); cerca(bajo.Cvk, 0, 1e-90, 'C_V congelado a 5 K');
      cerca(r.F, r.U0 + r.U - 300 * r.S, 1e-25, 'F = U − TS con el punto cero');
    }
    // rotor del CO a 300 K: Z ≈ kT/B + 1/3
    { const r = ej('rotor-co'); cerca(r.Z, 300 * k / (0.2394 * mev) + 1 / 3, 0.15, 'Z del rotor ≈ kT/B + 1/3'); cerca(r.p.reduce((a, b) => a + b, 0), 1, 1e-12, 'las probabilidades suman 1'); cerca(r.Cvk, 1, 0.01, 'C_V del rotor → k'); }
    // sólido de Einstein: Ω(3, 4) = binom(6, 4) = 15, Ω(3, 6) = binom(8, 6) = 28 y ln Ω con Stirling para N grande
    {
      const r = ej('tres-cuatro'); cerca(r.Omega, 15, 1e-9, 'Ω(N = 3, q = 4)'); cerca(r.S, k * Math.log(15), 1e-30, 'S = k ln Ω'); cerca(Math.exp(C.lnOmega(3, 6)), 28, 1e-9, 'Ω(3, 6)'); cerca(Math.exp(C.lnOmega(1, 7)), 1, 1e-9, 'un solo oscilador: Ω = 1');
      const g = ej('einstein-grande'), st = 400 * Math.log(400) - 100 * Math.log(100) - 300 * Math.log(300); cerca(g.ln, st - 0.5 * Math.log(2 * Math.PI * 300 * 100 / 400), 0.4, 'ln Ω frente a Stirling con su corrección'); cerca(g.slope, Math.log(400 / 100), 0.01, 'dlnΩ/dq ≈ ln((q + N)/q)'); cerca(g.T, 10 * C.KpormeV / Math.log(4), 0.6, 'T = ε/(k·ln((q + N)/q))');
      cerca(C.lnGamma(11), Math.log(3628800), 1e-9, 'ln Γ(11)'); cerca(C.lnGamma(0.5), Math.log(Math.sqrt(Math.PI)), 1e-9, 'ln Γ(1/2)'); cerca(C.lnGamma(2e7), 2e7 * Math.log(2e7) - 2e7 - 0.5 * Math.log(2e7) + 0.5 * Math.log(2 * Math.PI) + 1 / (12 * 2e7), 1e-4, 'ln Γ de un argumento muy grande');
    }
    // dos sólidos: Σ Ω_A·Ω_B = Ω(N_A + N_B, q); el pico está en q·N_A/(N_A + N_B)
    {
      const p = ej('contacto-pequeno'); cerca(Math.exp(p.lnTot), 462, 1e-6, 'Σ Ω_A Ω_B = binom(11, 6) = 462'); cerca(p.pmax, 100 / 462, 1e-9, 'probabilidad del reparto central (10·10/462)'); cerca(p.qm, 3, 0, 'reparto más probable (simétrico)');
      const g = ej('contacto'); cerca(g.qm, 60, 1, 'q_A* = q·N_A/(N_A + N_B)'); cerca(g.lnTot, g.lnTotal, 1e-8, 'suma de repartos = un solo sólido'); cerca(g.prob.reduce((a, b) => a + b, 0), 1, 1e-12, 'probabilidades suman 1');
      if (!(g.dS > 0)) mal(`${N}: la entropía no aumenta al repartirse la energía (ΔS = ${g.dS})`);
      cerca(g.bB - g.bA > 0 ? 1 : 0, 1, 0, 'A (con toda la energía) está más caliente que B');
    }
    error({ ...C.ejemplos[0].sc, T: '0' }, 'temperatura cero'); error({ ...C.ejemplos[0].sc, dE: '-1' }, 'separación negativa'); error({ ...C.ejemplos[0].sc, g0: '1,5' }, 'degeneración no entera');
    error({ modo: 'niveles', T: '300', lista: '0 1' }, 'un solo nivel'); error({ modo: 'niveles', T: '300', lista: '0 1\n5 0' }, 'degeneración cero'); error({ modo: 'einstein', N: '0', q: '3' }, 'sin osciladores');
    error({ modo: 'contacto', NA: '3', NB: '3', qt: '6', qA0: '9' }, 'más cuantos iniciales que totales'); error({ modo: 'oscilador', T: '300', nu: '' }, 'falta la frecuencia');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos (Boltzmann, Einstein, rotor, Ω y contacto frente a fórmulas cerradas y valores a mano) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'fisica', carpeta: 'termo-estadistica', nombre: N, app: 'TermoEstadisticaApp', C, pagina, mal, malo: { k: 'T', v: '0' } });
};
