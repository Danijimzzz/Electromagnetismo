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
  semiconductores: [
    ['¿Qué es la recta de carga y el punto de trabajo?', 'La recta de carga sale de la malla del circuito (V_CC = V_CE + I_C·R_C en un BJT) y el punto de trabajo Q es donde corta a la curva del dispositivo. Con V_CC = 12 V y R_C = 2,2 kΩ, la recta corta los ejes en 12 V y 5,45 mA.'],
    ['¿Cómo se sabe si un BJT está en corte, activa o saturación?', 'Si V_BB ≤ V_BE está en corte (I_C = 0). Si no, se calcula I_B suponiendo activa, I_C = β·I_B y V_CE; si sale V_CE por debajo de unos 0,2 V, está en saturación. Con 12 V, R_B = 470 kΩ, R_C = 2,2 kΩ y β = 100: I_C ≈ 2,40 mA y V_CE ≈ 6,71 V, en activa.'],
    ['¿Cómo se resuelve un diodo con una resistencia en serie?', 'Se cortan la recta I_D = (V_S − V_D)/R y la ecuación de Shockley, lo que se hace numéricamente. Con 5 V, 1 kΩ, I_S = 10 pA y n = 1 sale V_D ≈ 0,515 V e I_D ≈ 4,49 mA; el modelo de 0,7 V da 4,3 mA.'],
  ],
  bode: [
    ['¿Cómo se calcula la frecuencia de corte de un filtro RC?', 'f_c = 1/(2πRC), donde la ganancia cae 3 dB. Con R = 1 kΩ y C = 159 nF, f_c ≈ 1 kHz, y después cae 20 dB por década.'],
    ['¿Y la frecuencia de resonancia de un RLC?', 'f₀ = 1/(2π√(LC)); en serie, el factor de calidad es Q = (1/R)√(L/C). Con L = 10 mH y C = 100 nF, f₀ ≈ 5,03 kHz.'],
  ],
  control: [
    ['¿Cómo se aplica el criterio de Routh?', 'Se ordenan los coeficientes del polinomio característico en las dos primeras filas y cada fila sale de las dos anteriores; los cambios de signo de la primera columna son las raíces del semiplano derecho. Para s³ + 3s² + 2s + K la fila s¹ vale (6 − K)/3, así que es estable con 0 < K < 6.'],
    ['¿Cómo se dibuja el lugar de las raíces?', 'Las ramas nacen en los polos y mueren en los ceros o en el infinito, siguiendo asíntotas desde el centroide σ = (Σp − Σz)/(n − m). Con K/(s(s + 1)(s + 2)) el centroide es −1, las asíntotas tienen 60°, −60° y 180°, y hay una ruptura en s ≈ −0,4226.'],
    ['¿Qué dice el criterio de Nyquist?', 'Si L(jω) da N vueltas horarias alrededor de −1 y L(s) tiene P polos en el semiplano derecho, el lazo cerrado tiene Z = N + P polos inestables. Para K/(s(s + 1)(s + 2)) el margen de ganancia es 6 (15,6 dB), en ω = √2 rad/s.'],
  ],
  'sistemas-numericos': [
    ['¿Cómo se pasa de decimal a binario y a hexadecimal?', 'Se divide entre 2 (o entre 16) y se leen los restos al revés. 13 = 1101₂ (8 + 4 + 1) y 255 = FF₁₆.'],
    ['¿Cómo se escribe un número negativo en complemento a 2 y en BCD?', 'En complemento a 2 se invierten los bits del positivo y se suma 1: con 8 bits, −5 es 11111011. En BCD cada cifra decimal ocupa 4 bits: 25 es 0010 0101.'],
  ],
  'puertas-logicas': [
    ['¿Cómo se obtiene la ecuación lógica de una tabla de verdad?', 'Con la suma de minitérminos (las filas con salida 1) o el producto de maxitérminos (las de salida 0). La puerta XOR da F = A′B + AB′.'],
    ['¿Cómo se simplifica una expresión?', 'Con álgebra de Boole, por ejemplo A + A′B = A + B, o con mapas de Karnaugh. De Morgan: (AB)′ = A′ + B′. Con puertas NAND se puede construir cualquier circuito.'],
  ],
  'transformada-z': [
    ['¿Cómo se sabe si un sistema discreto es estable?', 'Un sistema causal es estable si todos los polos de H(z) tienen módulo menor que 1. En y[n] = x[n] + 0,5·y[n−1] el polo es z = 0,5 y h[n] = 0,5ⁿ se amortigua; con un polo en z = 2, h[n] = 2ⁿ crece sin límite.'],
    ['¿Qué resolución tiene una FFT y qué es la fuga espectral?', 'La resolución es Δf = fₛ/N: con fₛ = 640 Hz y N = 64 muestras, Δf = 10 Hz. Un tono de 50 Hz cae justo en un bin, pero uno de 55 Hz queda entre dos y reparte su energía en los vecinos; una ventana de Hann reduce esa fuga.'],
  ],
  simulador: [
    ['¿Cómo se analiza un circuito de continua?', 'Con la ley de Ohm y el análisis nodal. En un divisor de tensión, V_R2 = V·R₂/(R₁ + R₂): con 10 V y R₁ = 1 kΩ, R₂ = 4 kΩ, V_R2 = 8 V y la corriente es 2 mA.'],
    ['¿Y uno de alterna o con transitorios?', 'En régimen sinusoidal, Z_R = R, Z_L = jωL y Z_C = 1/(jωC): una bobina de 10 mH a 50 Hz tiene X_L = 2π · 50 · 0,01 ≈ 3,14 Ω. En un transitorio RC o RL, la constante de tiempo es τ = RC o τ = L/R.'],
  ],
};
