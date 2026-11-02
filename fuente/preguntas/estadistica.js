/* ===== Preguntas frecuentes de Estadística (para seo.js y diseno.js; ver ../preguntas.js) ===== */
module.exports = {
  distribuciones: [
    ['¿Cómo se calcula una probabilidad en la distribución normal?', 'Se tipifica, z = (x − μ)/σ, y se busca el área hasta z. Con μ = 100 y σ = 15, P(X < 130) corresponde a z = 2, que da 0,9772.'],
    ['¿Cómo se calculan las probabilidades binomial y de Poisson?', 'Binomial: P(k) = C(n, k)·pᵏ(1 − p)ⁿ⁻ᵏ, con media np. Con n = 10 y p = 0,5, P(3) = 120/1024 ≈ 0,117. Poisson: P(k) = e⁻λ·λᵏ/k!; con λ = 2, P(0) = e⁻² ≈ 0,135.'],
  ],
  regresion: [
    ['¿Cómo se calcula la recta de regresión?', 'y = a + bx, con b = Sₓᵧ/Sₓₓ y a = ȳ − b·x̄. Con los puntos (1, 2), (2, 4), (3, 5), (4, 4), (5, 5): x̄ = 3, ȳ = 4, Sₓᵧ = 6, Sₓₓ = 10, luego b = 0,6 y a = 2,2.'],
    ['¿Cómo se interpreta el coeficiente de correlación?', 'r = Sₓᵧ/√(SₓₓSᵧᵧ) va de −1 a 1, y R² = r² es la parte de la variabilidad de y explicada por la recta. En el ejemplo anterior, r = 6/√60 ≈ 0,77 y R² = 0,6. Spearman usa los rangos en lugar de los valores.'],
  ],
  intervalos: [
    ['¿Cómo se calcula el intervalo de confianza de una media?', 'Con σ conocida: x̄ ± z·σ/√n; con σ desconocida, x̄ ± t·s/√n. Con x̄ = 50, s = 10, n = 25 y 95 % (t₂₄ = 2,064): 50 ± 4,13, es decir, (45,87; 54,13).'],
    ['¿Y el de una proporción?', 'p̂ ± z·√(p̂(1 − p̂)/n). Si 120 de 400 personas responden que sí, p̂ = 0,3 y, al 95 %, el intervalo es 0,3 ± 1,96 · 0,0229 = (0,255; 0,345).'],
  ],
  errores: [
    ['¿Cómo se propaga el error en una magnitud calculada?', 'σ_f = √(Σ(∂f/∂xᵢ · σᵢ)²). Para f = x·y con x = 10 ± 0,1 e y = 5 ± 0,1, los errores relativos se suman en cuadratura: √(0,01² + 0,02²) ≈ 2,2 %, así que f = 50 ± 1,1.'],
    ['¿Cómo se redondea una medida con su incertidumbre?', 'La incertidumbre se da con una o dos cifras significativas y el valor se redondea hasta la misma cifra decimal. Para sumas y restas, σ = √(σ₁² + σ₂²).'],
  ],
  contrastes: [
    ['¿Cómo se hace un contraste de hipótesis?', 'Se plantean H₀ y H₁, se calcula el estadístico, se compara con la región crítica (o el p-valor con α) y se decide. Para una media con σ conocida, z = (x̄ − μ₀)/(σ/√n): con x̄ = 52, μ₀ = 50, σ = 10 y n = 100, z = 2 > 1,96, luego se rechaza H₀ al 5 % (p ≈ 0,046).'],
    ['¿Qué es el p-valor y qué errores se pueden cometer?', 'Es la probabilidad de obtener un resultado igual o más extremo si H₀ es cierta; se rechaza H₀ si p < α. El error de tipo I (α) es rechazar una H₀ cierta; el de tipo II (β), no rechazar una H₀ falsa.'],
  ],
  descriptiva: [
    ['¿Cómo se calculan la media, la mediana y la desviación típica?', 'Con los datos 2, 3, 3, 5, 7: media 4, mediana 3 y moda 3. La varianza muestral es s² = Σ(x − x̄)²/(n − 1) = 16/4 = 4, luego s = 2.'],
    ['¿Cómo se detectan datos atípicos?', 'Con los cuartiles: IQR = Q₃ − Q₁, y son atípicos los valores fuera de [Q₁ − 1,5·IQR, Q₃ + 1,5·IQR], que son también los extremos de los bigotes del diagrama de caja.'],
  ],
  probabilidad: [
    ['¿Cómo se aplica el teorema de Bayes?', 'P(A|B) = P(B|A)·P(A)/P(B). Si una enfermedad afecta al 1 %, el test detecta el 99 % de los enfermos y da falsos positivos al 5 %: P(enfermo | +) = 0,0099/(0,0099 + 0,0495) ≈ 16,7 %.'],
    ['¿Cuándo se usan permutaciones, variaciones y combinaciones?', 'Permutaciones, n!, si se ordenan todos; variaciones, n!/(n − k)!, si importa el orden al elegir k; combinaciones, C(n, k) = n!/(k!(n − k)!), si no importa. Hay C(5, 2) = 10 formas de elegir 2 de 5 elementos.'],
  ],
  'chi2-bondad': [
    ['¿Cómo se hace un contraste χ² de bondad de ajuste?', 'χ² = Σ(O − E)²/E, con k − 1 − (parámetros estimados) grados de libertad. Un dado lanzado 60 veces da 8, 10, 12, 9, 11 y 10; con E = 10 en cada cara, χ² = 1,0 con 5 grados de libertad, por debajo del valor crítico 11,07, y no se rechaza que sea equilibrado.'],
    ['¿Y el de independencia en una tabla de contingencia?', 'La frecuencia esperada de cada casilla es E = (total de fila · total de columna)/total, y los grados de libertad son (filas − 1)(columnas − 1). Una tabla 2×2 tiene 1 grado de libertad y su valor crítico al 5 % es 3,84.'],
  ],
};
