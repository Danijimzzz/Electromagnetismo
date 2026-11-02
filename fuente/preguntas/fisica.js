/* ===== Preguntas frecuentes de Física general (para seo.js y diseno.js; ver ../preguntas.js) ===== */
module.exports = {
  'trabajo-y-energia': [
    ['¿Cómo se usa la conservación de la energía mecánica?', 'Sin rozamiento, ½mv² + mgh + ½kx² se mantiene constante. Una bola que cae 5 m desde el reposo llega con v = √(2gh) = √(2 · 9,8 · 5) ≈ 9,9 m/s. Con rozamiento, la energía final es la inicial menos el trabajo de la fuerza de rozamiento.'],
    ['¿Cómo se calcula el trabajo de una fuerza?', 'W = F·d·cos θ, y el trabajo total es igual a la variación de energía cinética. Una fuerza de 10 N que arrastra un objeto 3 m con un ángulo de 60° realiza W = 10 · 3 · 0,5 = 15 J.'],
  ],
  'tiro-parabolico': [
    ['¿Cómo se calculan el alcance y la altura máxima de un tiro parabólico?', 'Alcance R = v₀²·sen 2θ/g (máximo a 45°) y altura máxima h = v₀²·sen²θ/(2g). Con v₀ = 20 m/s y θ = 45°: R = 400/9,8 ≈ 40,8 m y h ≈ 10,2 m.'],
    ['¿Cómo se resuelve un problema de encuentro entre móviles?', 'Se escribe la posición de cada móvil (MRU: x = x₀ + vt; MRUA: x = x₀ + v₀t + ½at²) y se igualan. Si A sale a 20 m/s y B va 100 m por delante a 10 m/s en el mismo sentido, 20t = 100 + 10t, luego se encuentran a los 10 s.'],
  ],
  calorimetria: [
    ['¿Cómo se calcula la temperatura de equilibrio?', 'Se impone que el calor ganado y el cedido suman cero, Σ m·c·(T_eq − Tᵢ) = 0. Al mezclar 200 g de agua a 20 °C con 100 g a 80 °C, T_eq = (200 · 20 + 100 · 80)/300 = 40 °C.'],
    ['¿Cómo se calcula el calor de un cambio de fase?', 'Q = m·L, con L_fusión del hielo ≈ 334 kJ/kg y L_vaporización del agua ≈ 2257 kJ/kg. Fundir 100 g de hielo a 0 °C necesita 0,1 · 334 = 33,4 kJ; sin cambio de fase, Q = m·c·ΔT.'],
  ],
  dinamica: [
    ['¿Cómo se calcula la aceleración en un plano inclinado con rozamiento?', 'Bajando, a = g(sen θ − μ·cos θ). Con θ = 30° y μ = 0,2, a = 9,8 · (0,5 − 0,2 · 0,866) ≈ 3,2 m/s². Solo desliza si tan θ > μ.'],
    ['¿Cómo se resuelve una máquina de Atwood?', 'a = (m₂ − m₁)g/(m₁ + m₂) y T = 2m₁m₂g/(m₁ + m₂). Con 3 kg y 1 kg: a = 2 · 9,8/4 = 4,9 m/s² y T = 2 · 3 · 1 · 9,8/4 = 14,7 N.'],
  ],
  'solido-rigido': [
    ['¿Cómo se calcula un momento de inercia?', 'Cilindro macizo ½MR², aro MR², esfera maciza ⅖MR², varilla por su centro ML²/12; para un eje paralelo, el teorema de Steiner: I = I_cm + Md². Una varilla de 2 kg y 1 m girando por un extremo: I = 2/12 + 2 · 0,5² ≈ 0,67 kg·m².'],
    ['¿Cómo se resuelve la rodadura sin deslizamiento?', 'Se cumple v = ωR y a = g·sen θ/(1 + I/MR²). Para un cilindro macizo en un plano de 30°, a = ⅔ · 9,8 · 0,5 ≈ 3,27 m/s², menos que si deslizase sin rozamiento.'],
  ],
  ondas: [
    ['¿Qué es la ecuación de una onda armónica y cómo se calcula su velocidad?', 'y(x, t) = A·sen(kx − ωt), con v = λf = ω/k. En una cuerda, v = √(T/μ): con T = 100 N y μ = 0,01 kg/m, v = 100 m/s.'],
    ['¿Cómo se calculan las frecuencias de las ondas estacionarias?', 'En una cuerda con los dos extremos fijos, fₙ = n·v/(2L); en un tubo cerrado por un extremo, f = (2n − 1)·v/(4L). Una cuerda de 0,5 m con v = 100 m/s tiene f₁ = 100 Hz. Dos ondas de frecuencias parecidas producen pulsaciones de frecuencia |f₁ − f₂|.'],
  ],
  doppler: [
    ['¿Cómo se calcula la frecuencia que percibe el observador?', 'f′ = f·(v ± v_o)/(v ∓ v_s): el observador que se acerca suma, la fuente que se acerca resta. Una ambulancia de 700 Hz a 30 m/s con v = 340 m/s se oye a 700 · 340/310 ≈ 768 Hz al acercarse y a 700 · 340/370 ≈ 643 Hz al alejarse.'],
    ['¿Qué pasa si el movimiento no es en línea recta?', 'Solo cuenta la componente de la velocidad en la recta que une fuente y observador, v·cos θ. Con movimiento perpendicular a esa recta no hay desplazamiento de frecuencia en ese instante.'],
  ],
  interferencia: [
    ['¿Cómo se calcula la separación de las franjas en el experimento de Young?', 'Δy = λ·L/d. Con λ = 600 nm, L = 2 m y d = 0,5 mm, Δy = 600·10⁻⁹ · 2 / 5·10⁻⁴ = 2,4 mm entre franjas brillantes.'],
    ['¿Y la difracción por una rendija o una red?', 'En una rendija de anchura a, el primer mínimo está en sen θ = λ/a; en una red de paso d, los máximos cumplen d·sen θ = mλ; el criterio de Rayleigh da θ_min = 1,22λ/D. Una red de 500 líneas/mm (d = 2 μm) con luz de 500 nm da el primer orden a θ = arcsen 0,25 ≈ 14,5°.'],
  ],
  ciclos: [
    ['¿Cómo se calcula el rendimiento de un ciclo de Carnot?', 'η = 1 − T_f/T_c, con temperaturas absolutas. Entre 600 K y 300 K, η = 1 − 300/600 = 50 %. Ningún motor entre esas temperaturas puede superarlo.'],
    ['¿Y el de un ciclo Otto?', 'η = 1 − 1/r^(γ−1), con r la relación de compresión. Con r = 8 y γ = 1,4, η = 1 − 8^(−0,4) ≈ 56,5 %. Los ciclos Diesel y Brayton tienen sus propias fórmulas, que dependen también de la relación de combustión o de presiones.'],
  ],
  fluidos: [
    ['¿Cómo se calcula la presión a una profundidad y el empuje de Arquímedes?', 'p = p₀ + ρ·g·h y E = ρ_fluido·V_sumergido·g. A 10 m de profundidad en agua la presión aumenta ρgh = 1000 · 9,8 · 10 = 98 kPa, casi 1 atm más.'],
    ['¿Cómo se aplican Bernoulli y Torricelli?', 'p + ½ρv² + ρgh es constante a lo largo de una línea de corriente, y la continuidad dice A₁v₁ = A₂v₂. Un depósito que vierte por un orificio a 2 m bajo la superficie lo hace a v = √(2gh) = √(2 · 9,8 · 2) ≈ 6,3 m/s.'],
  ],
  gases: [
    ['¿Cómo se usa la ecuación de los gases ideales?', 'pV = nRT, con R = 8,314 J/(mol·K) = 0,082 atm·L/(mol·K). Un mol a 273,15 K y 1 atm ocupa V = 0,082 · 273,15 / 1 ≈ 22,4 L.'],
    ['¿Cómo se calcula el trabajo en cada transformación?', 'Isoterma: W = nRT·ln(V₂/V₁); isóbara: W = p·ΔV; isócora: W = 0; adiabática: pV^γ constante. Un mol a 300 K que duplica su volumen a temperatura constante realiza W = 8,314 · 300 · ln 2 ≈ 1,73 kJ.'],
  ],
  choques: [
    ['¿Cómo se calculan las velocidades tras un choque elástico?', 'Se conservan el momento y la energía cinética. En 1D, v₁′ = ((m₁ − m₂)v₁ + 2m₂v₂)/(m₁ + m₂). Con m₁ = 2 kg a 3 m/s contra m₂ = 1 kg en reposo, v₁′ = 1 m/s y v₂′ = 4 m/s (el momento, 6 kg·m/s, se conserva).'],
    ['¿Y en un choque perfectamente inelástico?', 'Los cuerpos quedan unidos: v′ = (m₁v₁ + m₂v₂)/(m₁ + m₂). En el mismo ejemplo, v′ = 6/3 = 2 m/s, y la energía cinética baja de 9 J a 6 J, de modo que se pierden 3 J.'],
  ],
  oscilaciones: [
    ['¿Cómo se calculan la frecuencia y el periodo de un oscilador?', 'Muelle: ω = √(k/m) y T = 2π√(m/k); péndulo simple: T = 2π√(L/g). Con k = 100 N/m y m = 1 kg, ω = 10 rad/s y T ≈ 0,63 s; un péndulo de 1 m tiene T ≈ 2,0 s.'],
    ['¿Qué diferencia hay entre un oscilador subamortiguado, crítico y sobreamortiguado?', 'Con rozamiento b y masa m, si b < 2√(km) el sistema oscila con frecuencia ω′ = √(ω₀² − (b/2m)²) y amplitud decreciente; si b = 2√(km) vuelve al equilibrio sin oscilar y lo más rápido posible; si b > 2√(km) vuelve lentamente. Con fuerza externa, hay resonancia cuando ω se acerca a la frecuencia natural.'],
  ],
  gravitacion: [
    ['¿Cómo se calcula la velocidad de un satélite en órbita circular?', 'v = √(GM/r) y T = 2π√(r³/GM). Para la Tierra (GM = 3,986·10¹⁴ m³/s²) a 400 km de altura, r = 6771 km y v ≈ 7,67 km/s.'],
    ['¿Cuál es la velocidad de escape y la órbita geoestacionaria?', 'v_esc = √(2GM/r); desde la superficie terrestre son unos 11,2 km/s. Un satélite geoestacionario tarda 24 h en dar una vuelta: su radio es de unos 42 164 km, a 35 786 km de altura.'],
  ],
  optica: [
    ['¿Cómo se calcula la imagen de una lente delgada?', 'Con la ecuación 1/s′ − 1/s = 1/f′ (convenio DIN) y aumento m = s′/s. Con f′ = 10 cm y objeto a s = −30 cm: 1/s′ = 1/10 − 1/30, luego s′ = 15 cm y m = −0,5, imagen real, invertida y a la mitad de tamaño.'],
    ['¿Y la de un espejo esférico?', 'Con la distancia focal f = R/2 y, tomando las distancias reales como positivas, 1/s + 1/s′ = 1/f. Un espejo cóncavo con R = 40 cm (f = 20 cm) y un objeto a 30 cm forman la imagen a s′ = 60 cm.'],
  ],
  'fisica-moderna': [
    ['¿Cómo se resuelve el efecto fotoeléctrico?', 'E_c = hf − W₀, y solo hay emisión si f supera la frecuencia umbral f₀ = W₀/h. Con luz de 200 nm (6,2 eV) sobre un metal de W₀ = 2,3 eV, E_c = 3,9 eV.'],
    ['¿Cómo se calculan la dilatación del tiempo y la longitud de De Broglie?', 'γ = 1/√(1 − v²/c²), Δt = γΔt₀ y L = L₀/γ; a v = 0,8c, γ = 1,67. La longitud de De Broglie es λ = h/p = h/(mv).'],
  ],
  unidades: [
    ['¿Cómo se convierten unidades?', 'Se multiplica por el factor de conversión de modo que se cancele la unidad de partida. Por ejemplo, 90 km/h = 90 / 3,6 = 25 m/s; y 1 atm = 101 325 Pa, 1 cal = 4,184 J, 1 eV = 1,602·10⁻¹⁹ J.'],
    ['¿Qué valores tienen las constantes más usadas?', 'c = 299 792 458 m/s, h = 6,626·10⁻³⁴ J·s, e = 1,602·10⁻¹⁹ C, k_B = 1,381·10⁻²³ J/K y N_A = 6,022·10²³ mol⁻¹, según CODATA.'],
  ],
};
