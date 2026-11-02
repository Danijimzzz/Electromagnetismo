/* ===== Preguntas frecuentes de Circuitos (para seo.js y diseno.js; ver ../preguntas.js) ===== */
module.exports = {
  resistencias: [
    ['¿Cómo se lee el código de colores de una resistencia?', 'Las dos primeras bandas son cifras, la tercera el multiplicador y la cuarta la tolerancia. Marrón-negro-rojo-oro es 10 × 10² = 1 kΩ con ±5 %.'],
    ['¿Cómo se calcula la resistencia de una asociación?', 'En serie, R = R₁ + R₂ + …; en paralelo, 1/R = 1/R₁ + 1/R₂ + …. Dos de 100 Ω en paralelo dan 50 Ω y una de 330 Ω y otra de 470 Ω en serie dan 800 Ω.'],
  ],
  convolucion: [
    ['¿Cómo se calcula una convolución?', 'En continuo, y(t) = ∫x(τ)·h(t − τ) dτ; en discreto, y[n] = Σx[k]·h[n − k]. Con x = [1, 2, 3] y h = [1, 1], y = [1, 3, 5, 3].'],
    ['¿Cómo responde un filtro RC?', 'Su respuesta al impulso es h(t) = (1/RC)·e^(−t/RC) para t ≥ 0, con constante de tiempo τ = RC, y su respuesta al escalón es 1 − e^(−t/τ).'],
  ],
  bode: [
    ['¿Cómo se calcula la frecuencia de corte de un filtro RC?', 'f_c = 1/(2πRC), donde la ganancia cae 3 dB. Con R = 1 kΩ y C = 159 nF, f_c ≈ 1 kHz, y después cae 20 dB por década.'],
    ['¿Y la frecuencia de resonancia de un RLC?', 'f₀ = 1/(2π√(LC)); en serie, el factor de calidad es Q = (1/R)√(L/C). Con L = 10 mH y C = 100 nF, f₀ ≈ 5,03 kHz.'],
  ],
  'sistemas-numericos': [
    ['¿Cómo se pasa de decimal a binario y a hexadecimal?', 'Se divide entre 2 (o entre 16) y se leen los restos al revés. 13 = 1101₂ (8 + 4 + 1) y 255 = FF₁₆.'],
    ['¿Cómo se escribe un número negativo en complemento a 2 y en BCD?', 'En complemento a 2 se invierten los bits del positivo y se suma 1: con 8 bits, −5 es 11111011. En BCD cada cifra decimal ocupa 4 bits: 25 es 0010 0101.'],
  ],
  'puertas-logicas': [
    ['¿Cómo se obtiene la ecuación lógica de una tabla de verdad?', 'Con la suma de minitérminos (las filas con salida 1) o el producto de maxitérminos (las de salida 0). La puerta XOR da F = A′B + AB′.'],
    ['¿Cómo se simplifica una expresión?', 'Con álgebra de Boole, por ejemplo A + A′B = A + B, o con mapas de Karnaugh. De Morgan: (AB)′ = A′ + B′. Con puertas NAND se puede construir cualquier circuito.'],
  ],
  simulador: [
    ['¿Cómo se analiza un circuito de continua?', 'Con la ley de Ohm y el análisis nodal. En un divisor de tensión, V_R2 = V·R₂/(R₁ + R₂): con 10 V y R₁ = 1 kΩ, R₂ = 4 kΩ, V_R2 = 8 V y la corriente es 2 mA.'],
    ['¿Y uno de alterna o con transitorios?', 'En régimen sinusoidal, Z_R = R, Z_L = jωL y Z_C = 1/(jωC): una bobina de 10 mH a 50 Hz tiene X_L = 2π · 50 · 0,01 ≈ 3,14 Ω. En un transitorio RC o RL, la constante de tiempo es τ = RC o τ = L/R.'],
  ],
};
