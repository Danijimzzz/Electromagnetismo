/* ===== Preguntas frecuentes de Química (para seo.js y diseno.js; ver ../preguntas.js) ===== */
module.exports = {
  'tabla-periodica': [
    ['¿Cómo se lee la tabla periódica?', 'Los elementos de una misma columna (grupo) tienen igual número de electrones de valencia, y cada fila (periodo) corresponde a una capa. El radio atómico crece hacia abajo y hacia la izquierda; la energía de ionización y la electronegatividad crecen hacia arriba y hacia la derecha.'],
    ['¿Qué datos da la ficha de cada elemento?', 'Número atómico, masa atómica, configuración electrónica, electronegatividad, estados de oxidación, punto de fusión y ebullición y densidad. Con ellos se comparan tendencias de elementos del mismo grupo o periodo.'],
  ],
  'masa-molar': [
    ['¿Cómo se calcula la masa molar y los moles de una sustancia?', 'La masa molar es la suma de las masas atómicas de la fórmula, y n = m/M. Para H₂O, M = 2 · 1,008 + 16,00 = 18,02 g/mol, y 36 g son 36 / 18,02 ≈ 2 mol.'],
    ['¿Cómo se halla el reactivo limitante?', 'Se divide el número de moles de cada reactivo por su coeficiente estequiométrico y el menor cociente señala el limitante. En 2 H₂ + O₂ → 2 H₂O con 3 mol de H₂ y 2 mol de O₂: 3/2 = 1,5 y 2/1 = 2, así que el limitante es H₂ y salen 3 mol de agua. El rendimiento es lo obtenido dividido por lo teórico, por 100.'],
  ],
  'configuracion-electronica': [
    ['¿Cómo se escribe una configuración electrónica?', 'Se llenan los orbitales según el diagrama de Moeller: 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s… Para el hierro (Z = 26): 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶.'],
    ['¿Cuáles son las excepciones y los números cuánticos?', 'El cromo es [Ar] 4s¹ 3d⁵ y el cobre [Ar] 4s¹ 3d¹⁰, porque una subcapa semillena o llena es más estable. Los números cuánticos son n (1, 2, 3…), l (de 0 a n − 1), m (de −l a +l) y s (±½).'],
  ],
  cinetica: [
    ['¿Cómo se calcula la vida media de una reacción?', 'Orden 0: t½ = [A]₀/(2k); orden 1: t½ = ln 2/k; orden 2: t½ = 1/(k·[A]₀). Con orden 1 y k = 0,0231 min⁻¹, t½ = 0,693 / 0,0231 = 30 min.'],
    ['¿Cómo influye la temperatura en la velocidad?', 'Con la ecuación de Arrhenius, k = A·e^(−Eₐ/RT), y ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂). Con Eₐ = 50 kJ/mol, subir de 300 K a 310 K multiplica k por e^0,647 ≈ 1,9: casi se duplica.'],
  ],
  ph: [
    ['¿Cómo se calcula el pH de un ácido?', 'Ácido fuerte: pH = −log C. Ácido débil: [H₃O⁺] ≈ √(Kₐ·C). Para ácido acético 0,1 M (Kₐ = 1,8·10⁻⁵), [H₃O⁺] ≈ 1,34·10⁻³ M y pH ≈ 2,87.'],
    ['¿Cómo se calcula el pH de un tampón y de una valoración?', 'Henderson-Hasselbalch: pH = pKₐ + log([A⁻]/[HA]); con [A⁻] = [HA] y pKₐ = 4,76, pH = 4,76. En una valoración, el punto de equivalencia llega cuando los moles de ácido igualan a los de base; entre ácido y base fuertes el pH ahí es 7.'],
  ],
  disoluciones: [
    ['¿Cómo se calcula la molaridad?', 'M = moles de soluto / litros de disolución. Con 10 g de NaCl (58,44 g/mol) en 250 mL: n = 0,171 mol y M = 0,171 / 0,25 ≈ 0,68 mol/L. La molalidad usa kg de disolvente, no litros de disolución.'],
    ['¿Cómo se prepara una dilución?', 'Con C₁V₁ = C₂V₂. Para preparar 500 mL de HCl 0,1 M desde uno 12 M, V₁ = 0,1 · 500 / 12 ≈ 4,17 mL de ácido concentrado, que se completan con agua hasta 500 mL.'],
  ],
  ajustador: [
    ['¿Cómo se ajusta una reacción química por el método algebraico?', 'Cada coeficiente es una incógnita y se escribe una ecuación por elemento (y otra por la carga, si es iónica); al resolver y pasar a enteros salen los coeficientes. C₃H₈ + O₂ → CO₂ + H₂O queda C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O.'],
    ['¿Cómo se comprueba que está bien ajustada?', 'Debe haber el mismo número de átomos de cada elemento y la misma carga total a los dos lados. En el ejemplo, hay 10 átomos de O a cada lado (6 + 4 = 10).'],
  ],
  vsepr: [
    ['¿Cómo se predice la geometría de una molécula con VSEPR?', 'Los pares de electrones del átomo central se repelen y se colocan lo más lejos posible: 2 pares, lineal (180°); 3, trigonal plana (120°); 4, tetraédrica (109,5°); 5, bipirámide trigonal; 6, octaédrica (90°). El agua tiene 4 pares, 2 libres, y es angular (≈104,5°).'],
    ['¿Cómo se sabe la hibridación y si es polar?', '4 pares son sp³, 3 son sp² y 2 son sp. Una molécula es polar si los dipolos de sus enlaces no se cancelan: el CO₂ (lineal) es apolar y el H₂O (angular) es polar.'],
  ],
  organica: [
    ['¿Cómo se nombra un compuesto orgánico?', 'Se elige el grupo principal (ácido > éster > amida > nitrilo > aldehído > cetona > alcohol > amina), la cadena con más grupos principales, enlaces múltiples y carbonos, y se numera para dar los localizadores más bajos. El CH₃–CH(OH)–CH₃ es propan-2-ol y el CH₃–CH(CH₃)–CH₃ es 2-metilpropano.'],
    ['¿Cómo se nombra un ciclo o un derivado del benceno?', 'Se antepone «ciclo» al alcano: C₆H₁₂ es el ciclohexano. El anillo se numera dando el 1 al grupo principal (ciclohexanol) o, si no lo hay, a un carbono del doble enlace y después a los sustituyentes con los localizadores más bajos: el 1,2-dimetilciclohexano. Si el anillo tiene tantos carbonos como la cadena o más, es el padre; si no, pasa a sustituyente (ciclohexil). Del benceno se aceptan tolueno, fenol, anilina y ácido benzoico, y con dos sustituyentes se habla de orto (1,2), meta (1,3) y para (1,4): el 1,4-dimetilbenceno es el p-xileno.'],
    ['¿Qué es el cis y el trans en un anillo?', 'En un anillo no se puede girar, así que dos sustituyentes pueden quedar del mismo lado del plano (cis) o de lados opuestos (trans). El 1,2-dimetilciclohexano tiene tres estereoisómeros: el cis, que es una forma meso (un plano de simetría, aquiral), y el trans, que forma una pareja de enantiómeros (1R,2R) y (1S,2S).'],
    ['¿Cómo se sabe si un centro es R o S, o un doble enlace E o Z?', 'Con las reglas de Cahn-Ingold-Prelog: se ordenan los sustituyentes por número atómico. Con el de menor prioridad detrás, si los otros tres giran en sentido horario es R y si giran en sentido antihorario, S. En un doble enlace, si los de mayor prioridad están del mismo lado es Z y si no, E. Con n centros quirales hay como máximo 2ⁿ estereoisómeros.'],
  ],
  formulacion: [
    ['¿Cómo se nombra un compuesto inorgánico?', 'Hay tres nomenclaturas: sistemática (prefijos), de Stock (número romano) y tradicional. El Fe₂O₃ es trióxido de dihierro, óxido de hierro(III) u óxido férrico; el CO₂ es dióxido de carbono.'],
    ['¿Y los hidróxidos, ácidos y sales?', 'Ca(OH)₂ es hidróxido de calcio, H₂SO₄ es ácido sulfúrico (tetraoxidosulfato de dihidrógeno) y NaCl es cloruro de sodio. La herramienta pasa de fórmula a nombre y de nombre a fórmula.'],
  ],
  solubilidad: [
    ['¿Cómo se calcula la solubilidad a partir del Kps?', 'Para una sal AₐB_b, Kps = aᵃ·bᵇ·s^(a+b), así que s = (Kps/(aᵃ·bᵇ))^(1/(a+b)). Para el AgCl (Kps = 1,8·10⁻¹⁰), s = √(1,8·10⁻¹⁰) ≈ 1,3·10⁻⁵ mol/L; para el Ca(OH)₂ (Kps = 5,5·10⁻⁶), Kps = 4s³ y s ≈ 0,011 mol/L.'],
    ['¿Cómo se calcula el Kps a partir de la solubilidad?', 'Se pasa la solubilidad a mol/L (g/L entre la masa molar), se multiplica por los coeficientes para tener la concentración de cada ion y se sustituye en Kps = [A]ᵃ[B]ᵇ. Para el Ag₂CrO₄ con s = 6,5·10⁻⁵ M: [Ag⁺] = 1,3·10⁻⁴ M, [CrO₄²⁻] = 6,5·10⁻⁵ M y Kps = 4s³ ≈ 1,1·10⁻¹².'],
    ['¿Qué es el efecto del ion común?', 'Si la disolución ya contiene uno de los iones de la sal, esta se disuelve menos. El AgCl en NaCl 0,10 M cumple s(s + 0,10) = 1,8·10⁻¹⁰, de donde s ≈ 1,8·10⁻⁹ mol/L: unas 7 400 veces menos soluble que en agua pura.'],
    ['¿Cómo saber si una sal precipita al mezclar dos disoluciones?', 'Se calculan las concentraciones tras mezclar (se diluyen), el producto iónico Q = [A]ᵃ[B]ᵇ y se compara con Kps: si Q > Kps precipita, y si Q < Kps no. Con 50 mL de Pb²⁺ 0,01 M y 50 mL de I⁻ 0,01 M, Q = 0,005·0,005² = 1,25·10⁻⁷, mayor que el Kps del PbI₂ (9,8·10⁻⁹), y precipita.'],
  ],
  equilibrio: [
    ['¿Cómo se calculan Kc y Kp?', 'Para aA + bB ⇌ cC + dD, Kc = [C]ᶜ[D]ᵈ / ([A]ᵃ[B]ᵇ) y Kp = Kc·(RT)^Δn, con Δn la variación de moles de gas. En N₂ + 3 H₂ ⇌ 2 NH₃, Δn = −2.'],
    ['¿Cómo se resuelve un equilibrio con la tabla ICE?', 'Se escriben las concentraciones iniciales, el cambio (±x según coeficientes) y las del equilibrio, y se sustituyen en Kc. En H₂ + I₂ ⇌ 2 HI con Kc = 50 y 1 M de cada reactivo: 4x²/(1 − x)² = 50, x ≈ 0,78 y [HI] ≈ 1,56 M, [H₂] = [I₂] ≈ 0,22 M.'],
    ['¿Cómo se desplaza el equilibrio (Le Chatelier)?', 'Se compara el cociente de reacción Q con K: si Q < K el equilibrio avanza hacia productos, y si Q > K hacia reactivos. Añadir reactivo o quitar producto lo desplaza a la derecha; aumentar la presión, hacia el lado con menos moles de gas.'],
  ],
  redox: [
    ['¿Cómo se ajusta una reacción redox por ion-electrón?', 'Se separan las semirreacciones; se ajustan los átomos distintos de O e H, el O con H₂O y el H con H⁺ (en medio básico se añaden OH⁻ y se simplifica); se igualan los electrones y se suman. Por ejemplo, MnO₄⁻ + 8 H⁺ + 5 e⁻ → Mn²⁺ + 4 H₂O.'],
    ['¿Qué se oxida y qué se reduce?', 'Se oxida el que pierde electrones (es el agente reductor) y se reduce el que los gana (agente oxidante). En Zn + Cu²⁺ → Zn²⁺ + Cu, el zinc se oxida (cede 2 e⁻) y el cobre se reduce.'],
  ],
  termoquimica: [
    ['¿Cómo se calcula la entalpía de una reacción?', 'ΔH° = Σ n·ΔH_f°(productos) − Σ n·ΔH_f°(reactivos). Para CH₄ + 2 O₂ → CO₂ + 2 H₂O(l): −393,5 + 2(−285,8) − (−74,8) ≈ −890,3 kJ.'],
    ['¿Cómo se usan la ley de Hess y la energía libre de Gibbs?', 'Con Hess se suman las reacciones y sus ΔH; invertir una reacción cambia el signo y multiplicarla multiplica su ΔH. Con Gibbs, ΔG = ΔH − TΔS y la reacción es espontánea si ΔG < 0: con ΔH = −100 kJ y ΔS = −0,2 kJ/K a 298 K, ΔG ≈ −40,4 kJ.'],
  ],
};
