/* ===== Preguntas frecuentes de Matemáticas (para seo.js y diseno.js; ver ../preguntas.js) ===== */
module.exports = {
  matrices: [
    ['¿Cómo se calculan el determinante y la inversa de una matriz?', 'En 2×2, det = ad − bc; en 3×3, la regla de Sarrus. La inversa existe si det ≠ 0: A⁻¹ = (1/det)·adj(A)ᵗ. Para [[1, 2], [3, 4]], det = 4 − 6 = −2 y A⁻¹ = [[−2, 1], [3/2, −1/2]].'],
    ['¿Cómo se calculan los valores propios?', 'Se resuelve det(A − λI) = 0. Para [[2, 1], [1, 2]]: (2 − λ)² − 1 = 0, es decir λ² − 4λ + 3 = 0, con λ = 1 y λ = 3. El rango se halla con el método de Gauss contando las filas no nulas.'],
  ],
  sistemas: [
    ['¿Cómo se clasifica un sistema con Rouché-Frobenius?', 'Es compatible si rango(A) = rango(A|b); determinado si ese rango iguala al número de incógnitas e indeterminado si es menor. El sistema x + y = 2, 2x + 2y = 4 tiene rango 1 en ambas matrices y 2 incógnitas, luego es compatible indeterminado: infinitas soluciones.'],
    ['¿Cómo se resuelve con la regla de Cramer?', 'xᵢ = det(Aᵢ)/det(A), donde Aᵢ cambia la columna i por los términos independientes. Para x + y = 3, x − y = 1: det(A) = −2, x = −4/−2 = 2 e y = −2/−2 = 1.'],
  ],
  taylor: [
    ['¿Cómo se calcula el polinomio de Taylor?', 'P(x) = Σ f⁽ⁿ⁾(a)/n!·(x − a)ⁿ, y de Maclaurin si a = 0. Por ejemplo, eˣ ≈ 1 + x + x²/2 + x³/6, sen x ≈ x − x³/6 y cos x ≈ 1 − x²/2 + x⁴/24. Con grado 3, e^0,1 ≈ 1,105167 (el valor real es 1,105171).'],
    ['¿Cómo se acota el error?', 'Con el resto de Lagrange, R_n = f⁽ⁿ⁺¹⁾(c)/(n + 1)!·(x − a)ⁿ⁺¹ para algún c entre a y x. Con grado 2 para e^0,1: |R| ≤ e^0,1/3! · 0,1³ ≈ 1,8·10⁻⁴.'],
  ],
  fourier: [
    ['¿Cómo se calculan los coeficientes de Fourier?', 'Para periodo T y ω₀ = 2π/T: a₀ = (2/T)∫f dt, aₙ = (2/T)∫f·cos(nω₀t) dt y bₙ = (2/T)∫f·sen(nω₀t) dt, con f = a₀/2 + Σ(aₙ cos nω₀t + bₙ sen nω₀t). La onda cuadrada de ±1 y periodo 2π da aₙ = 0 y bₙ = 4/(nπ) para n impar: f = (4/π)(sen x + sen 3x/3 + sen 5x/5 + …).'],
    ['¿Qué es el fenómeno de Gibbs?', 'En un salto, la serie converge a la media de los límites laterales, pero las sumas parciales sobrepasan el valor en un 9 % del salto aproximadamente, por muchos armónicos que se sumen. La igualdad de Parseval relaciona la potencia de la señal con la de sus armónicos.'],
  ],
  edos: [
    ['¿Cómo funciona el método de Euler y el de Runge-Kutta?', 'Euler avanza con yₙ₊₁ = yₙ + h·f(xₙ, yₙ). Para y′ = y con y(0) = 1 y h = 0,1, un paso da 1,1 (exacto, e^0,1 = 1,10517). RK4 promedia cuatro pendientes por paso y es mucho más preciso, con error del orden de h⁴.'],
    ['¿Cómo se resuelve una EDO lineal de segundo orden?', 'Para y″ + by′ + cy = 0 se resuelve r² + br + c = 0: raíces reales distintas dan C₁e^(r₁x) + C₂e^(r₂x); doble, (C₁ + C₂x)e^(rx); complejas α ± iβ, e^(αx)(C₁ cos βx + C₂ sen βx). Con y″ + 4y = 0, r = ±2i y y = C₁ cos 2x + C₂ sen 2x. Hay resonancia cuando el término forzado es solución de la homogénea.'],
  ],
  laplace: [
    ['¿Cuáles son las transformadas de Laplace básicas?', 'L{tⁿ} = n!/sⁿ⁺¹, L{eᵃᵗ} = 1/(s − a), L{sen ωt} = ω/(s² + ω²) y L{cos ωt} = s/(s² + ω²). Por linealidad, L{3e²ᵗ + sen 4t} = 3/(s − 2) + 4/(s² + 16).'],
    ['¿Cómo se resuelve una EDO con Laplace?', 'Se usa L{y′} = sY − y(0) y L{y″} = s²Y − s·y(0) − y′(0), se despeja Y(s) y se invierte por fracciones simples. Para y′ + 2y = 0 con y(0) = 3: sY − 3 + 2Y = 0, Y = 3/(s + 2) e y = 3e⁻²ᵗ.'],
  ],
  derivadas: [
    ['¿Cómo se deriva un producto o una composición?', 'Producto: (uv)′ = u′v + uv′; cociente: (u/v)′ = (u′v − uv′)/v²; cadena: (f(u))′ = f′(u)·u′. Por ejemplo, (x²·sen x)′ = 2x·sen x + x²·cos x.'],
    ['¿Cómo se hallan máximos y mínimos de una función?', 'Se resuelve f′(x) = 0 y se mira el signo de f″. En f = x³ − 3x, f′ = 3x² − 3 = 0 da x = ±1; f″ = 6x es positiva en x = 1 (mínimo, f = −2) y negativa en x = −1 (máximo, f = 2).'],
    ['¿Cómo se integra por partes?', '∫u dv = uv − ∫v du. Para ∫x·eˣ dx, con u = x y dv = eˣ dx: x·eˣ − ∫eˣ dx = x·eˣ − eˣ + C.'],
  ],
  campos: [
    ['¿Cómo se calculan el gradiente y la derivada direccional?', '∇f = (fₓ, f_y, f_z) y D_u f = ∇f · u, con u unitario. Para f = x²y en (1, 2), ∇f = (2xy, x²) = (4, 1); en la dirección (3, 4)/5, D_u f = (12 + 4)/5 = 3,2.'],
    ['¿Cómo se calculan la divergencia y el rotacional?', 'div F = ∂Fₓ/∂x + ∂F_y/∂y + ∂F_z/∂z y rot F = ∇ × F. Para F = (x, y, z), div F = 3 y rot F = 0 (es conservativo). Para F = (−y, x, 0), div F = 0 y rot F = (0, 0, 2).'],
  ],
  complejos: [
    ['¿Cómo se pasa un complejo de forma binómica a polar?', 'Con r = √(a² + b²) y θ = atan2(b, a). Para 1 + i, r = √2 y θ = 45°, es decir, √2·e^(iπ/4).'],
    ['¿Cómo se calculan las raíces de un complejo?', 'ⁿ√z = r^(1/n)·e^(i(θ + 2πk)/n), con k = 0, …, n − 1 (fórmula de De Moivre). Las raíces cúbicas de 8 son 2, −1 + √3·i y −1 − √3·i.'],
  ],
  'integrales-multiples': [
    ['¿Cómo se calcula una integral doble en polares?', 'Con dA = r dr dθ. El área de un círculo de radio R es ∫₀^2π∫₀^R r dr dθ = πR².'],
    ['¿Y una triple en cilíndricas o esféricas?', 'En cilíndricas, dV = r dr dθ dz; en esféricas, dV = ρ² sen φ dρ dφ dθ. El volumen de una esfera de radio R es ∫₀^2π∫₀^π∫₀^R ρ² sen φ dρ dφ dθ = 4πR³/3.'],
  ],
  superficies: [
    ['¿Qué son las curvas de nivel de una superficie?', 'Son los puntos con f(x, y) = c para distintos valores de c, y el gradiente es perpendicular a ellas. En z = x² + y² son circunferencias de radio √c.'],
    ['¿Cómo se clasifican los puntos críticos?', 'Donde ∇f = 0, el hessiano D = fₓₓ·f_yy − fₓ_y² decide: D > 0 y fₓₓ > 0, mínimo; D > 0 y fₓₓ < 0, máximo; D < 0, punto de silla. En z = x² − y², D = −4 en el origen: silla.'],
  ],
  'metodos-numericos': [
    ['¿Cómo se halla una raíz con bisección o Newton-Raphson?', 'Bisección: con f(a)·f(b) < 0 se toma el punto medio y se queda el tramo donde cambia el signo, y el error baja a la mitad en cada paso. Newton: xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ). Para x² − 2 = 0 con x₀ = 1,5, x₁ = 1,5 − 0,25/3 ≈ 1,4167 (√2 = 1,4142).'],
    ['¿Cómo se integra con trapecios o Simpson?', 'Trapecios: (h/2)[f₀ + 2Σfᵢ + fₙ]; Simpson: (h/3)[f₀ + 4(impares) + 2(pares) + fₙ]. Para ∫₀¹ x² dx con Simpson y n = 2, (0,5/3)(0 + 4·0,25 + 1) = 1/3, que es exacto.'],
  ],
  series: [
    ['¿Cómo se sabe si una serie converge?', 'Primero la condición necesaria: si aₙ no tiende a 0, diverge. Luego se prueba el criterio del cociente (L = lím |aₙ₊₁/aₙ|: converge si L < 1, diverge si L > 1), el de la raíz o la comparación con 1/nᵖ, que converge si p > 1. Por ejemplo, Σ 2ⁿ/n! tiene L = lím 2/(n + 1) = 0 y converge; su suma desde n = 0 es e² ≈ 7,389.'],
    ['¿Qué diferencia hay entre convergencia absoluta y condicional?', 'Converge absolutamente si Σ|aₙ| converge, y condicionalmente si Σaₙ converge pero Σ|aₙ| no. Σ(−1)ⁿ/n² converge absolutamente (suma −π²/12), mientras que Σ(−1)ⁿ/n converge solo condicionalmente por el criterio de Leibniz (suma −ln 2).'],
  ],
  lagrange: [
    ['¿Cómo se usan los multiplicadores de Lagrange?', 'Para optimizar f con la restricción g = c se resuelve ∇f = λ∇g junto con g = c. Para f = x² + y² con x + y = 2: 2x = λ, 2y = λ y x + y = 2 dan x = y = 1, λ = 2 y f = 2, que es el mínimo.'],
    ['¿Cómo se sabe si el punto es máximo o mínimo?', 'Se mira el hessiano de L = f − λg en la dirección tangente a la restricción: q > 0 es mínimo y q < 0 máximo (en dos variables, el signo contrario al del hessiano orlado). Para x y con 2x + 2y = 20 sale x = y = 5, f = 25 y es un máximo.'],
  ],
  graficador: [
    ['¿Cómo se calculan el dominio, los cortes y las asíntotas de una función?', 'El dominio excluye los puntos donde se anula un denominador, hay una raíz par de un negativo o un logaritmo de algo no positivo. Los cortes son f(0) con el eje y y las soluciones de f(x) = 0 con el eje x. Para f = 1/(x − 2): dominio x ≠ 2, asíntota vertical x = 2, horizontal y = 0 y corte con el eje y en −1/2.'],
    ['¿Para qué sirve dibujar varias funciones a la vez?', 'Para ver dónde se cortan (f = g), comparar una función con su derivada o con su aproximación de Taylor, y estimar áreas entre curvas antes de integrar.'],
  ],
};
