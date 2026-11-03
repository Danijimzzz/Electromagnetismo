/* ===== Preguntas frecuentes de Electromagnetismo (para seo.js y diseno.js; ver ../preguntas.js) ===== */
module.exports = {
  electrostatica: [
    ['¿Cómo se calcula el campo eléctrico de varias cargas puntuales?', 'Con el principio de superposición: el campo en un punto es la suma vectorial del campo de cada carga, E = Σ k·qᵢ/rᵢ² en la dirección que une la carga con el punto, con k = 8,99·10⁹ N·m²/C². Por ejemplo, una carga de 2 nC a 3 cm crea E = 8,99·10⁹ · 2·10⁻⁹ / 0,03² ≈ 2,0·10⁴ N/C.'],
    ['¿Cómo se usa la ley de Gauss para hallar el campo?', 'Se elige una superficie gaussiana con la simetría del problema (esfera, cilindro o caja) y se aplica ∮E·dS = Q_int/ε₀. Fuera de una esfera cargada con Q, E = Q/(4πε₀r²); para un hilo infinito con densidad λ, E = λ/(2πε₀r); y para un plano infinito con densidad σ, E = σ/(2ε₀).'],
    ['¿Cómo se calculan el potencial y la energía de un sistema de cargas?', 'El potencial es escalar y se suma con su signo, V = Σ k·qᵢ/rᵢ. La energía del sistema es la suma de todos los pares, U = Σ k·qᵢqⱼ/rᵢⱼ. Por ejemplo, dos cargas de 1 nC a 10 cm tienen U = 8,99·10⁹ · 10⁻¹⁸ / 0,1 ≈ 9,0·10⁻⁸ J.'],
  ],
  magnetostatica: [
    ['¿Cómo se calcula el campo magnético de un hilo con corriente?', 'Con la ley de Biot-Savart. Para un hilo infinito, B = μ₀I/(2πr). Por ejemplo, con I = 10 A a 5 cm del hilo, B = 4π·10⁻⁷ · 10 / (2π · 0,05) = 4·10⁻⁵ T, es decir, 40 μT.'],
    ['¿Y el de una espira, un solenoide o un toroide?', 'En el centro de una espira de radio R, B = μ₀I/(2R). En un solenoide largo, B = μ₀nI, con n espiras por metro; en un toroide de N espiras, B = μ₀NI/(2πr) dentro de él. Por ejemplo, un solenoide de 1000 espiras/m con 2 A da B = 4π·10⁻⁷ · 1000 · 2 ≈ 2,5·10⁻³ T.'],
  ],
  condensadores: [
    ['¿Cómo se calcula la capacidad de un condensador?', 'Plano: C = ε₀εᵣA/d. Cilíndrico: C = 2πε₀εᵣL/ln(b/a). Esférico: C = 4πε₀εᵣ·ab/(b − a). Por ejemplo, un condensador plano de aire con A = 100 cm² y d = 1 mm tiene C = 8,85·10⁻¹² · 0,01 / 0,001 ≈ 88,5 pF.'],
    ['¿Cómo se calcula su energía y qué pasa al meter un dieléctrico?', 'U = ½CV² = Q²/(2C). Un dieléctrico multiplica la capacidad por εᵣ: si la batería sigue conectada, V es constante y Q aumenta; si se desconectó, Q es constante y V se divide por εᵣ. Con C = 88,5 pF a 100 V, U = ½ · 88,5·10⁻¹² · 100² ≈ 4,4·10⁻⁷ J.'],
  ],
  induccion: [
    ['¿Cómo se calcula la autoinducción de un solenoide?', 'L = μ₀N²A/ℓ. Por ejemplo, con N = 500 espiras, A = 4 cm² y ℓ = 20 cm: L = 4π·10⁻⁷ · 500² · 4·10⁻⁴ / 0,2 ≈ 0,63 mH. La energía almacenada es U = ½LI².'],
    ['¿Cómo se comporta un circuito RL?', 'La corriente crece como i(t) = (V/R)(1 − e^(−t/τ)), con constante de tiempo τ = L/R. Con L = 10 mH y R = 5 Ω, τ = 2 ms y la corriente alcanza el 63 % de V/R en ese tiempo.'],
  ],
  faraday: [
    ['¿Cómo se calcula la fem inducida?', 'Con la ley de Faraday, ε = −dΦ/dt. Para una barra de longitud l que se mueve a velocidad v perpendicular a un campo B, ε = B·l·v. Por ejemplo, con B = 0,5 T, l = 0,2 m y v = 3 m/s, ε = 0,3 V.'],
    ['¿Qué dice la ley de Lenz y cómo se calcula un alternador?', 'Que la corriente inducida crea un campo que se opone a la variación del flujo que la produce; es el signo menos de la ley de Faraday. En un alternador de N espiras, ε = N·B·A·ω·sen(ωt), con máximo N·B·A·ω: con N = 100, B = 0,2 T, A = 0,01 m² y ω = 100π rad/s, ε_máx ≈ 63 V.'],
  ],
  fuerza: [
    ['¿Cómo se calcula la fuerza magnética sobre una carga?', 'Con la fuerza de Lorentz, F = q(E + v × B); si solo hay campo magnético, F = q·v·B·sen θ y es perpendicular a la velocidad. Un electrón a 10⁶ m/s perpendicular a B = 1 mT sufre F = 1,6·10⁻¹⁹ · 10⁶ · 10⁻³ = 1,6·10⁻¹⁶ N.'],
    ['¿Cómo se calculan el radio y el periodo de la órbita de una carga?', 'R = mv/(qB) y T = 2πm/(qB); el periodo no depende de la velocidad. Para el electrón del ejemplo anterior, R = 9,11·10⁻³¹ · 10⁶ / (1,6·10⁻¹⁹ · 10⁻³) ≈ 5,7 mm.'],
  ],
  'ondas-em': [
    ['¿Cómo se relacionan la longitud de onda, la frecuencia y el número de onda?', 'c = λ·f, k = 2π/λ y ω = 2πf. En el vacío, una onda de 100 MHz tiene λ = 3·10⁸ / 10⁸ = 3 m y k = 2π/3 ≈ 2,09 rad/m.'],
    ['¿Cómo se calculan el campo B, la intensidad y la presión de radiación?', 'En una onda plana, B₀ = E₀/c, la intensidad es I = ½ε₀cE₀² y la presión de radiación sobre una superficie que absorbe es I/c. Con E₀ = 100 V/m: B₀ ≈ 3,3·10⁻⁷ T e I ≈ 13,3 W/m².'],
  ],
  fresnel: [
    ['¿Cómo se calcula la reflectancia en incidencia normal?', 'R = ((n₂ − n₁)/(n₂ + n₁))². De aire (n = 1) a vidrio (n = 1,5): R = (0,5/2,5)² = 0,04, es decir, se refleja un 4 % de la luz.'],
    ['¿Qué son el ángulo de Brewster y la reflexión total?', 'El ángulo de Brewster cumple tan θ_B = n₂/n₁ y en él no se refleja la luz polarizada en el plano de incidencia: de aire a vidrio es arctan 1,5 ≈ 56,3°. La reflexión total ocurre al pasar a un medio de menos índice a partir del ángulo crítico sen θ_c = n₂/n₁; de vidrio a aire, θ_c ≈ 41,8°.'],
  ],
  'laplace-numerica': [
    ['¿Cómo se resuelve la ecuación de Laplace por relajación?', 'Se divide la caja en una malla y cada punto interior se sustituye por la media de sus cuatro vecinos, V(i,j) = ¼[V(i+1,j) + V(i−1,j) + V(i,j+1) + V(i,j−1)], repitiendo hasta que el cambio sea menor que la tolerancia. Jacobi usa los valores de la iteración anterior, Gauss-Seidel los más recientes y SOR los acelera con un factor entre 1 y 2.'],
    ['¿Se puede comprobar el resultado a mano?', 'Sí, en casos simétricos. Si un borde de una caja cuadrada está a 100 V y los otros tres a 0 V, el potencial en el centro es la media de los cuatro bordes, 25 V, y la solución numérica debe acercarse a ese valor.'],
  ],
  imagenes: [
    ['¿Cómo se resuelve una carga frente a un plano conductor?', 'Se sustituye el plano (a tierra) por una carga imagen −q a la misma distancia al otro lado. La fuerza sobre q es F = k·q²/(2d)² y la carga inducida total en el plano es −q. Con q = 1 nC y d = 5 cm, F = 8,99·10⁹ · 10⁻¹⁸ / 0,1² ≈ 9,0·10⁻⁷ N.'],
    ['¿Y frente a una esfera conductora?', 'Para una esfera a tierra de radio R y una carga q a distancia d > R del centro, la imagen vale q′ = −qR/d y está a R²/d del centro. Con q = 2 nC, d = 10 cm y R = 5 cm, q′ = −1 nC a 2,5 cm del centro.'],
  ],
  'lineas-transmision': [
    ['¿Cómo se calculan el coeficiente de reflexión y la ROE?', 'Γ = (Z_L − Z₀)/(Z_L + Z₀) y ROE = (1 + |Γ|)/(1 − |Γ|). Con Z₀ = 50 Ω y Z_L = 100 Ω, Γ = 1/3 y ROE = 2.'],
    ['¿Cómo se usa la carta de Smith?', 'Se normaliza la carga, z = Z_L/Z₀, y se marca en la carta; avanzar hacia el generador es girar en sentido horario, y una vuelta completa equivale a λ/2 de línea. En una línea sin pérdidas de longitud λ/4, Z_in = Z₀²/Z_L: con Z₀ = 50 Ω y Z_L = 100 Ω, Z_in = 25 Ω.'],
  ],
  'guias-onda': [
    ['¿Cómo se calcula la frecuencia de corte de una guía rectangular?', 'Para el modo TE_mn, f_c = (c/2)·√((m/a)² + (n/b)²). Para el modo fundamental TE₁₀ de una guía WR-90 con a = 22,86 mm, f_c = c/(2a) ≈ 6,56 GHz.'],
    ['¿Cómo se calcula la longitud de onda en la guía?', 'Solo se propaga si f > f_c, y entonces λ_g = λ/√(1 − (f_c/f)²). A 10 GHz, λ = 3 cm y f_c = 6,56 GHz: λ_g = 3 / √(1 − 0,43) ≈ 3,97 cm.'],
  ],
  maxwell: [
    ['¿Cuáles son las ecuaciones de Maxwell?', 'En forma diferencial: ∇·E = ρ/ε₀ (Gauss), ∇·B = 0 (no hay monopolos magnéticos), ∇×E = −∂B/∂t (Faraday) y ∇×B = μ₀J + μ₀ε₀ ∂E/∂t (Ampère-Maxwell).'],
    ['¿Cómo se pasa de la forma integral a la diferencial?', 'Con los teoremas de la divergencia y de Stokes: ∮E·dS = Q/ε₀ se convierte en ∇·E = ρ/ε₀, y ∮E·dl = −dΦ_B/dt en ∇×E = −∂B/∂t. De las cuatro sale la velocidad de las ondas electromagnéticas, 1/√(μ₀ε₀) = c.'],
  ],
  antena: [
    ['¿Qué resistencia de radiación y directividad tiene un dipolo de media onda?', 'Su resistencia de radiación es de unos 73 Ω y su directividad 1,64 (2,15 dBi). El diagrama de radiación es proporcional a [cos(π/2·cos θ)/sen θ]², con máximo perpendicular al hilo y nulo en su eje.'],
    ['¿Cómo se calcula la potencia radiada?', 'P_rad = ½·I₀²·R_rad. Un dipolo de media onda con I₀ = 1 A radia ½ · 1² · 73 ≈ 36,5 W. Para un dipolo corto (de Hertz), R_rad = 80π²(l/λ)².'],
  ],
  cavidades: [
    ['¿Cómo se calcula la frecuencia de resonancia de una cavidad rectangular?', 'f₀ = (v/2)·√((m/a)² + (n/b)² + (p/d)²), con v = c/√εr. Por ejemplo, un cubo de aire de 40 mm de lado en el modo TE101 resuena a (c/2·0,04)·√2 = 5,300 GHz; ese mismo valor lo tienen el TE011 y el TM110 (modos degenerados).'],
    ['¿Qué es el factor de calidad Q de una cavidad y cómo se calcula?', 'Q = ω₀·(energía almacenada)/(potencia perdida) y mide lo estrecha que es la resonancia: Δf = f₀/Q. Las paredes dan Q_c = 2Γ/δ, con δ = 1/√(π f₀ μ₀ σ) y Γ = ∫|H|²dV / ∮|H_t|²dS; el dieléctrico da Q_d = 1/tg δ y se combinan con 1/Q = 1/Q_c + 1/Q_d. Una cavidad cilíndrica de cobre de R = 25 mm y L = 40 mm en el modo TM010 resuena a 4,590 GHz con Q_c ≈ 15 800.'],
  ],
};
