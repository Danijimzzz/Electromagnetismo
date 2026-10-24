/* =====================================================================
   Versiones y novedades: la web (portada, asignaturas, buscador) tiene su número y cada
   herramienta el suyo. Hasta el lanzamiento se numera 0.x (beta); la 1.0 de una herramienta
   llega cuando se da por terminada y la 1.0 de la web será el lanzamiento. Sube el segundo
   número si hay algo nuevo (0.6) y añade un tercero si es solo un arreglo (0.5.1).
   En las novedades de la web se anuncia también cada herramienta nueva.
   Las notas son para los usuarios: solo funciones nuevas, arreglos visibles y cambios
   en la interfaz. Lo interno (pruebas, CI, build, despliegue, refactorizaciones) no se anota;
   el historial completo para desarrolladores está en Notion.
   ===================================================================== */
const Version = (() => {
  const registros = {
    web: [
      { v: '0.37', fecha: '2026-10-24', cambios: ['Nueva herramienta: Fuerza magnética, en Electromagnetismo.'] },
      { v: '0.36', fecha: '2026-10-24', cambios: ['Nueva herramienta: Campos vectoriales, en Matemáticas.'] },
      { v: '0.35', fecha: '2026-10-24', cambios: ['Nueva herramienta: Cinética química, en Química.'] },
      { v: '0.34', fecha: '2026-10-24', cambios: ['Nueva herramienta: Ecuaciones diferenciales, en Matemáticas.'] },
      { v: '0.33', fecha: '2026-10-24', cambios: ['Nueva herramienta: Series de Fourier, en Matemáticas.'] },
      { v: '0.32', fecha: '2026-10-24', cambios: ['Nueva herramienta: Series de Taylor, en Matemáticas.'] },
      { v: '0.31', fecha: '2026-10-24', cambios: ['Nueva herramienta: Ciclos termodinámicos, en Física general.'] },
      { v: '0.30', fecha: '2026-10-24', cambios: ['Nueva herramienta: pH y valoraciones, en Química.'] },
      { v: '0.29', fecha: '2026-10-24', cambios: ['Nueva herramienta: Fluidos, en Física general.'] },
      { v: '0.28', fecha: '2026-10-24', cambios: ['Nueva herramienta: Números complejos, en Matemáticas.'] },
      { v: '0.27.1', fecha: '2026-10-24', cambios: ['Efecto Doppler, Código de colores y Regresión: las fórmulas dentro del texto de la teoría se ven bien escritas.'] },
      { v: '0.27', fecha: '2026-10-24', cambios: ['Nueva herramienta: Regresión y correlación, en Estadística.'] },
      { v: '0.26', fecha: '2026-10-24', cambios: ['Nueva herramienta: Código de colores de resistencias, en Circuitos.'] },
      { v: '0.25', fecha: '2026-10-24', cambios: ['Nueva herramienta: Efecto Doppler, en Física general.'] },
      { v: '0.24', fecha: '2026-10-24', cambios: ['Modo práctica en todas las herramientas: un ejercicio con datos al azar, tapa los resultados y el desarrollo, corrige lo que escribes y luego te enseña la solución. Al salir vuelven tus datos.', 'Mis ejercicios: abrir un ejercicio guardado de Configuración electrónica ya muestra ese elemento.'] },
      { v: '0.23', fecha: '2026-10-24', cambios: ['«Mis ejercicios» en todas las herramientas: una barra lateral, como la de electrostática, para guardar los datos de cada ejercicio con su título y carpeta, fijar los importantes arriba, volver a abrirlos y exportarlos o importarlos en archivos .simu.json.'] },
      { v: '0.22.1', fecha: '2026-10-24', cambios: ['Botón «← Inicio» arriba a la izquierda en todas las herramientas, también en el simulador de electrostática, para volver a la portada.'] },
      { v: '0.22', fecha: '2026-10-24', cambios: ['Nuevas secciones en la portada: Estadística, con las distribuciones de probabilidad, y Circuitos, que reúne corriente continua y alterna. Las direcciones antiguas siguen funcionando y llevan a la nueva.'] },
      { v: '0.21', fecha: '2026-10-24', cambios: ['Sistemas de ecuaciones: nuevos métodos de reducción, igualación y sustitución.'] },
      { v: '0.20.3', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría de todas las herramientas se ven como en los libros.'] },
      { v: '0.20.2', fecha: '2026-10-24', cambios: ['Tiro parabólico, Trabajo y energía y Calorimetría: las fórmulas se ven como en los libros, con fracciones, raíces y exponentes de verdad.'] },
      { v: '0.20.1', fecha: '2026-10-24', cambios: ['Tiro parabólico, Trabajo y energía y Calorimetría: los resultados salen en una tarjeta destacada arriba y la lectura del tiempo ya no se mueve al reproducir.'] },
      { v: '0.20', fecha: '2026-10-24', cambios: ['Nueva herramienta: Inducción, leyes de Faraday y Lenz, en Electromagnetismo.'] },
      { v: '0.19', fecha: '2026-10-24', cambios: ['Nueva herramienta: Gases ideales, en Física general.'] },
      { v: '0.18', fecha: '2026-10-24', cambios: ['Nueva herramienta: Ondas mecánicas, en Física general.'] },
      { v: '0.17', fecha: '2026-10-24', cambios: ['Nueva herramienta: Sólido rígido, en Física general.'] },
      { v: '0.16', fecha: '2026-10-23', cambios: ['Nueva herramienta: Circuitos de corriente continua, en Laboratorio.'] },
      { v: '0.15', fecha: '2026-10-23', cambios: ['Nueva herramienta: Dinámica y diagramas de fuerzas, en Física general.'] },
      { v: '0.14', fecha: '2026-10-23', cambios: ['Nueva herramienta: Corriente alterna y fasores, en Laboratorio.'] },
      { v: '0.13', fecha: '2026-10-23', cambios: ['Nueva herramienta: Distribuciones de probabilidad, en Matemáticas.'] },
      { v: '0.12', fecha: '2026-10-23', cambios: ['Nueva herramienta: Sistemas de ecuaciones lineales, en Matemáticas.'] },
      { v: '0.11', fecha: '2026-10-23', cambios: ['Nueva herramienta: Matrices paso a paso, en Matemáticas.'] },
      { v: '0.10', fecha: '2026-10-23', cambios: ['Nueva herramienta: Autoinducción e inducción mutua, en Electromagnetismo.'] },
      { v: '0.9', fecha: '2026-10-23', cambios: ['Nueva herramienta: Calorimetría y cambios de fase, en Física general.'] },
      { v: '0.8', fecha: '2026-10-23', cambios: ['Nueva herramienta: Disoluciones y concentraciones, en Química.'] },
      { v: '0.7', fecha: '2026-10-23', cambios: ['Nueva herramienta: Tiro parabólico y cinemática, en Física general.'] },
      { v: '0.6', fecha: '2026-10-23', cambios: ['Nueva herramienta: Condensadores con dieléctricos, en Electromagnetismo.'] },
      { v: '0.5', fecha: '2026-10-23', cambios: ['Nueva herramienta: Configuración electrónica, en Química.'] },
      { v: '0.4', fecha: '2026-10-23', cambios: ['Nueva herramienta: Masa molar y estequiometría, en Química.'] },
      { v: '0.3', fecha: '2026-10-23', cambios: ['Nueva herramienta: Trabajo y energía, en Física general.'] },
      { v: '0.2', fecha: '2026-10-23', cambios: ['Nueva herramienta: Tabla periódica interactiva, en Química.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Portada para elegir asignatura y herramienta: Electromagnetismo, Física general, Química, Matemáticas y Laboratorio, con buscador. Las herramientas que vienen después aparecen como «Próximamente».', 'Nueva herramienta: Magnetostática, en Electromagnetismo.'] },
    ],
    electrostatica: [
      { v: '0.5.1', fecha: '2026-10-23', cambios: ['El simulador tiene ahora su propia dirección, /electromagnetismo/electrostatica/. Tus problemas guardados siguen ahí. El botón «Todas las herramientas» de la barra lateral vuelve a la portada.'] },
    { v: '0.5', fecha: '2026-10-23', cambios: ['Doce ejercicios de ejemplo con enunciados propios: los mismos tipos de pregunta que en clase, con otras figuras y otros números. La guía de uso tiene capturas nuevas hechas con ellos.', 'La web tiene icono propio: un dipolo con sus líneas de campo, en la pestaña del navegador, en la pantalla de inicio del móvil y en la vista previa al compartir el enlace.', 'Páginas de aviso legal, privacidad, cookies y contacto, enlazadas al pie de la barra lateral.'] },
    { v: '0.4', fecha: '2026-10-22', cambios: ['Número de versión visible y este apartado de novedades.', 'Arreglo: en la vista 3D los cilindros se dibujan con su radio real, aparecen las superficies de Gauss, y las esferas, cascarones y conductores tienen volumen en lugar de parecer círculos planos.'] },
    { v: '0.3', fecha: '2026-10-22', cambios: ['Guía de uso con capturas (botón ?, barra lateral o F1).', 'Los resultados se escriben con la misma forma que el solucionario oficial: perfiles por tramos, factor común en logaritmos y radicales, y la pregunta V_A − V_B.'] },
    { v: '0.2', fecha: '2026-10-22', cambios: ['Anillos, discos, cortezas y conductores.', 'Varias incógnitas, modo numérico SI, flujo de Gauss y gráficas E(z) y V(z).', 'Modo práctica, exportar la solución, deshacer y rehacer, mapa de color y vista 3D.', 'Búsqueda, carpetas y etiquetas en la barra lateral.'] },
    { v: '0.1', fecha: '2026-10-22', cambios: ['Primera versión: cargas, hilos, planos y esferas con el desarrollo paso a paso y 12 ejercicios resueltos.', 'Barra lateral con tus problemas, los importados y los ejercicios; título y enunciado editables; archivos .emsim.json.'] },
    ],
    magnetostatica: [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: campo magnético de hilos, segmentos, hilos semiinfinitos, espiras, arcos, solenoides y toroides con Biot-Savart, y fuerza sobre cargas en movimiento y sobre conductores, con el desarrollo paso a paso en la forma μ₀I/(πa) o en unidades del SI.', 'Dibujo del campo B en el plano XY, XZ o YZ, con puntos que se pueden arrastrar y ocho ejemplos resueltos.'] },
    ],
    'tabla-periodica': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: cada elemento tiene su ficha con la masa atómica y molar, el grupo, el periodo, el bloque, la configuración electrónica (abreviada, completa y por capas), la electronegatividad, la energía de ionización, el radio y el estado.', 'La tabla se puede colorear por categoría, electronegatividad, energía de ionización, radio, masa, bloque o estado, y tiene un buscador por nombre, símbolo o número atómico.'] },
    ],
    'trabajo-y-energia': [
      { v: '0.1.2', fecha: '2026-10-24', cambios: ['Las fórmulas del desarrollo y de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Los resultados salen arriba, en una tarjeta destacada, y la lectura de t y v tiene ancho fijo: ya no mueve la barra de tiempo al reproducir.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: un bloque baja por una rampa con rozamiento, recorre un tramo horizontal y comprime un muelle. Animación con barras de energía cinética, gravitatoria, elástica y calor, gráfica de las energías en el tiempo y el desarrollo paso a paso con la velocidad al pie de la rampa, al llegar al muelle y la compresión máxima.', 'Seis ejemplos: sin rozamiento, se para antes del muelle, el rozamiento lo sujeta, con empujón inicial y muelle duro.'] },
    ],
    'masa-molar': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: masa molar y composición centesimal de cualquier fórmula, con paréntesis, hidratos e iones, y conversor entre gramos, moles, partículas y litros de gas.', 'Estequiometría: ajusta la reacción sola (también las iónicas), calcula el reactivo limitante, lo que se forma con el rendimiento que digas y lo que sobra, paso a paso.', 'Masas atómicas de la IUPAC o redondeadas como en clase.'] },
    ],
    'configuracion-electronica': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: configuración electrónica de cualquier elemento o ion por orden de llenado, abreviada y por capas, con el diagrama de Moeller, el diagrama de orbitales con la regla de Hund, los electrones desapareados y los números cuánticos del electrón diferenciador.', 'Avisa de las excepciones como el cromo o el cobre, y en los cationes quita primero los electrones de la capa más externa.'] },
    ],
    condensadores: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: condensadores planos, cilíndricos y esféricos con capas de dieléctrico en serie o, en el plano, ocupando parte del área. Capacidad, carga, tensión y energía; campos E, D y P en cada capa y cargas de polarización, con el desarrollo paso a paso.', 'Compara con el condensador vacío: qué pasa al meter el dieléctrico con la batería conectada o con el condensador aislado.', 'Dibujo del corte con las líneas de campo y gráfica de E a lo largo del condensador.'] },
    ],
    'tiro-parabolico': [
      { v: '0.1.2', fecha: '2026-10-24', cambios: ['Las fórmulas del desarrollo y de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Los resultados salen arriba, en una tarjeta destacada, y la lectura de t, x, y y v tiene ancho fijo: ya no se mueve al reproducir.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: tiro parabólico desde cualquier altura hasta cualquier altura, con el tiempo de vuelo, la altura máxima, el alcance y la velocidad al caer, y el desarrollo paso a paso. Trayectoria animada con los vectores de velocidad y gráficas de posición, velocidad y aceleración frente al tiempo.', 'Rozamiento del aire lineal o cuadrático, comparado con la trayectoria sin rozamiento.', 'Blanco: dice si el proyectil pasa por un punto y con qué dos ángulos se acierta.', 'Movimiento rectilíneo (MRU y MRUA): posición y velocidad en un instante, cuándo pasa por un punto y cuándo se para, con las gráficas x(t), v(t) y a(t).'] },
    ],
    disoluciones: [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: da la concentración de una disolución como molaridad, molalidad, fracción molar, % en masa, % masa/volumen, g/L o ppm y obtén todas las demás, con la densidad para pasar de masa a volumen y el desarrollo con su base de cálculo.', 'Preparar una disolución: los gramos de sólido (con su pureza) o los mililitros de reactivo comercial (con su riqueza y densidad) que hay que medir.', 'Diluciones con C₁V₁ = C₂V₂, despejando el dato que falte, y mezcla de dos disoluciones del mismo soluto.'] },
    ],
    calorimetria: [
      { v: '0.1.2', fecha: '2026-10-24', cambios: ['Las fórmulas del desarrollo y de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['La temperatura de equilibrio sale en una tarjeta destacada, separada de la tabla de calores.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: temperatura de equilibrio al mezclar hasta cinco cuerpos de agua, hielo, vapor, metales, etanol, vidrio, un calorímetro o una sustancia con tus datos, con los cambios de fase que hagan falta.', 'Si la energía no llega para fundir todo el hielo o condensar todo el vapor, dice cuántos gramos quedan de cada fase.', 'Tabla con el calor de cada cuerpo, el desarrollo etapa por etapa (m c ΔT y m L) y la curva de calentamiento de cada uno.'] },
    ],
    induccion: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: coeficiente de autoinducción de solenoides (con núcleo), toroides de sección rectangular y circular, cables coaxiales y líneas bifilares, con el desarrollo desde la ley de Ampère.', 'Inducción mutua entre dos solenoides, dos espiras, un hilo y una espira, y una bobina sobre un toroide, o a partir de L₁, L₂ y k, con el coeficiente de acoplamiento.', 'Flujo, energía magnética y fem inducida si das la corriente o cómo cambia.', 'Circuito RL al cerrar el interruptor o al quitar la fuente: constante de tiempo, corriente y tensión en la bobina en cualquier instante y su gráfica.'] },
    ],
    matrices: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: determinante por Gauss, por Sarrus o por Laplace; inversa por Gauss-Jordan o por adjuntos; rango; forma escalonada y escalonada reducida, con cada operación entre filas y la matriz después de cada paso.', 'Valores y vectores propios con el polinomio característico, las raíces exactas (también con radicales o complejas) y si la matriz es diagonalizable, con P y D.', 'Suma, resta, producto (elemento a elemento), producto por un número, potencia y traspuesta.', 'Fracciones exactas y números complejos en cualquier casilla: 3/4, 0,25, 2−3i o (1+i)/2.'] },
    ],
    fuerza: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: fuerza sobre una carga en un campo uniforme, con el radio, el periodo y el sentido de giro, o la hélice si v no es perpendicular a B. La velocidad se puede dar en m/s, por su energía en eV o por la ddp que la acelera.', 'Fuerza de Lorentz con vectores: v × B con su determinante y F = q(E + v × B).', 'Selector de velocidades y espectrómetro de masas, ciclotrón con la frecuencia, la energía de salida y las vueltas.', 'Fuerza sobre un hilo (y la corriente para que flote) y entre dos hilos paralelos.', 'Animación de cada situación.'] },
    ],
    campos: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: gradiente, derivada direccional y laplaciano de un campo escalar, con su mapa de color y las curvas de nivel.', 'Divergencia y rotacional de un campo vectorial en el plano o en el espacio y, si es conservativo, su potencial.', 'Integral de línea (trabajo) a lo largo de una curva r(t), comparada con la diferencia de potencial cuando el campo es conservativo.', 'Teorema de Green en un círculo o un rectángulo: circulación y flujo por el borde frente a las integrales dobles.', 'Gráfica con partículas que siguen el campo y un molinillo que gira con el rotacional; tocándola se mueve el punto.'] },
    ],
    cinetica: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: leyes integradas de orden 0, 1 y 2 con la concentración a cualquier tiempo, la vida media y cuánto se tarda en llegar a una concentración.', 'Orden y constante a partir de una tabla de concentraciones frente al tiempo, con las tres rectas ([A], ln [A] y 1/[A]) y su R².', 'Método de las velocidades iniciales con uno o dos reactivos: órdenes, constante con sus unidades y ley de velocidad.', 'Ecuación de Arrhenius: energía de activación con dos temperaturas o la constante a otra temperatura, con la gráfica de ln k frente a 1/T.', 'Vaso animado en el que las moléculas de reactivo se convierten en producto.'] },
    ],
    edos: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuaciones de primer orden y′ = f(x, y) con el campo de pendientes, el método de Euler (con su tabla) y RK4, y la solución exacta cuando es lineal con coeficiente constante.', 'Ecuaciones lineales de segundo orden con coeficientes constantes: ecuación característica, solución homogénea, particular por coeficientes indeterminados (también con resonancia) y constantes por las condiciones iniciales.', 'Sistemas x′ = f(x, y), y′ = g(x, y): puntos críticos con su tipo (silla, nodo, foco o centro) por los autovalores del jacobiano, solución exacta si es lineal y diagrama de fases con trayectorias.', 'Gráfica animada; tocándola se cambia el punto inicial.'] },
    ],
    fourier: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: serie de Fourier de una función periódica dada hasta en cuatro tramos (1, x, x^2, |x|, sen x…), o desarrollo en senos o en cosenos de una función en [0, L].', 'Coeficientes a₀, aₙ y bₙ exactos (con π) y su término general cuando siguen una ley, como 2(1 − (−1)ⁿ)/(nπ), con la paridad de la función.', 'Convergencia en los saltos (a la media de los límites laterales), suma parcial en un punto e igualdad de Parseval.', 'Gráfica de la función y de la suma parcial, que se puede ver sumando armónicos uno a uno, y el espectro de amplitudes.'] },
    ],
    taylor: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: polinomio de Taylor o de Maclaurin de cualquier grado hasta 15 de una función escrita como en papel (e^x, sen x, ln(1+x), √x, arctg x…) en un punto que puede llevar π, con cada derivada, su valor exacto y los coeficientes.', 'Aproximación de f(x₀) con el error cometido y la cota del resto de Lagrange.', 'Reconoce los desarrollos conocidos (e^x, sen x, cos x, ln(1+x), la serie geométrica, arctg x y la binómica) y da su término general y dónde convergen.', 'Gráfica de la función con los polinomios de cada grado, que se pueden recorrer o ver acercarse uno tras otro.'] },
    ],
    complejos: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: escribe un complejo en forma binómica, polar, trigonométrica o exponencial y obtén las otras, con el módulo exacto y el argumento en su cuadrante.', 'Suma, resta, producto y cociente con fracciones exactas, potencias con De Moivre, raíces n-ésimas y ecuaciones de segundo grado.', 'Plano complejo con los afijos, el paralelogramo de la suma y el polígono de las raíces.'] },
    ],
    sistemas: [
      { v: '0.2', fecha: '2026-10-24', cambios: ['Métodos de reducción, igualación y sustitución para sistemas de 2 o 3 ecuaciones con solución única, con cada ecuación numerada y cada paso explicado.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: hasta seis ecuaciones con seis incógnitas. Dice si el sistema es compatible determinado, indeterminado o incompatible con el teorema de Rouché-Frobenius y lo resuelve por Gauss con sustitución hacia atrás, por Gauss-Jordan, por la regla de Cramer o con la matriz inversa.', 'Si tiene infinitas soluciones, las da en forma paramétrica (λ, μ…).', 'Coeficientes con fracciones exactas, decimales o números complejos, como las mallas de un circuito de alterna, y nombres propios para las incógnitas (I1, I2…).', 'Comprobación de la solución sustituyendo en cada ecuación.'] },
    ],
    regresion: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: escribe o pega tus datos (x, y), con frecuencias si las tienes, y obtén medias, varianzas, covarianza, el coeficiente de correlación con su contraste y las dos rectas de regresión, con la tabla de cálculos y la nube de puntos.', 'Ajustes exponencial, potencial, logarítmico y parabólico, con R² para compararlos con la recta, y los residuos.', 'Estimaciones de y a partir de x y de x a partir de y, avisando si es una extrapolación.', 'Añade puntos pulsando en la gráfica.'] },
    ],
    estadistica: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: normal, t de Student, chi cuadrado, exponencial, binomial y Poisson, con su media y su varianza.', 'Probabilidades P(X ≤ a), P(X ≥ a), entre dos valores y, en las discretas, P(X = k) y con desigualdad estricta; cuantiles y valores críticos bilaterales.', 'Gráfica con el área (o las barras) que se pide sombreada.', 'Desarrollo como en clase: tipificación Z = (X − μ)/σ y Φ(z), fórmula de la binomial y de la Poisson término a término, y aproximación de la binomial por la normal con corrección de continuidad.'] },
    ],
    alterna: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: circuitos RLC en serie y en paralelo (o solo con algunos de los elementos) con impedancias complejas en forma binómica y polar, la corriente, la tensión o la corriente de cada elemento, las potencias activa, reactiva y aparente y el factor de potencia, con el desarrollo paso a paso.', 'Diagrama de fasores y ondas v(t) e i(t) desfasadas.', 'Resonancia: frecuencia de resonancia, factor de calidad y ancho de banda.', 'Corrección del factor de potencia: el condensador que hay que poner en paralelo y cuánto baja la corriente de la línea.'] },
    ],
    dinamica: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: bloque en un plano horizontal o inclinado con rozamiento estático y dinámico, una fuerza aplicada con ángulo y, si quieres, una masa colgando de una polea. Dice si el bloque se mueve o el rozamiento lo sujeta y da la normal, el rozamiento, la aceleración y la tensión, con el desarrollo paso a paso.', 'Máquina de Atwood, también con una polea con masa.', 'Dibujo con el diagrama de fuerzas a escala y la aceleración, y la velocidad y el tiempo al recorrer una distancia.'] },
    ],
    circuitos: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: escribe el circuito como una lista de resistencias, fuentes de tensión y fuentes de corriente entre nudos, y obtén los potenciales, la corriente y la potencia de cada elemento por el método de los nudos, con las ecuaciones de Kirchhoff, el sistema en forma matricial y el balance de potencias.', 'Equivalente de Thévenin y de Norton visto por la resistencia que elijas, y máxima transferencia de potencia.', 'Esquema del circuito con el potencial de cada nudo y el sentido de cada corriente.'] },
    ],
    'solido-rigido': [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: momentos de inercia de esferas, cilindros, aros, varillas, discos y placas, con el teorema de Steiner y el radio de giro.', 'Rodadura por un plano inclinado: aceleración, velocidad al final, rozamiento necesario para que no deslice y qué pasa si no basta; comparación del tiempo que tarda cada cuerpo.', 'Polea con masa de la que cuelga un cuerpo: aceleración, tensión y balance de energía.', 'Conservación del momento angular, como la patinadora que encoge los brazos, con la variación de la energía cinética.'] },
    ],
    ondas: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuación de una onda armónica con ω y k en múltiplos de π, posición, velocidad y aceleración de un punto del medio y desfase entre dos puntos.', 'Ondas estacionarias en cuerdas y en tubos abiertos o cerrados: frecuencia de cada armónico, nodos y vientres, y velocidad en la cuerda con √(T/μ).', 'Efecto Doppler con la fuente y el observador moviéndose, y nivel sonoro en decibelios a distintas distancias y con varias fuentes.', 'Animación de la onda, de la onda estacionaria y de los frentes de onda del Doppler.'] },
    ],
    gases: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuación de estado PV = nRT con P, V, T y n en varias unidades, los moles a partir de la masa y la densidad del gas.', 'Transformaciones isoterma, isobara, isocora y adiabática encadenadas, con el trabajo, el calor y la variación de energía interna de cada tramo, y ciclos con su rendimiento comparado con el de Carnot.', 'Diagrama P-V con las isotermas y el área del ciclo.', 'Teoría cinética: velocidades cuadrática media, media y más probable, energía cinética media y la distribución de Maxwell.'] },
    ],
    ciclos: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ciclos de Carnot, Otto y Diesel con un gas ideal, con la tabla de estados, el trabajo, el calor y la energía interna de cada tramo y el rendimiento comparado con su fórmula y con Carnot.', 'Máquinas térmicas, frigoríficos y bombas de calor: el dato que falta, el rendimiento o la eficiencia, el límite de Carnot y si la máquina es posible, con la entropía del universo.', 'Diagrama p-V con un punto que recorre el ciclo y el cilindro con el émbolo, y el esquema de flujos de energía de las máquinas.'] },
    ],
    ph: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: pH de ácidos y bases fuertes (también muy diluidos) y débiles, con el grado de disociación y la aproximación comprobada.', 'Mezclas de un ácido fuerte con una base fuerte y disoluciones reguladoras con Henderson-Hasselbalch, también al añadirles ácido o base.', 'Valoraciones de ácidos y bases fuertes y débiles: volumen y pH de equivalencia, pH a mitad, el pH con el volumen que pidas, el indicador adecuado y la curva.', 'Vaso con el color del indicador universal y las partículas, y una bureta que valora mientras se dibuja la curva.'] },
    ],
    fluidos: [
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: presión manométrica y absoluta a una profundidad, con la fuerza sobre el fondo, y alturas o densidades en un tubo en U con dos líquidos.', 'Prensa hidráulica: la fuerza que se consigue o la que hace falta para levantar una masa, con los recorridos de los émbolos.', 'Empuje de Arquímedes: si un cuerpo flota (y cuánto se sumerge) o se hunde (peso aparente y aceleración), y la densidad a partir del peso en el aire y dentro del fluido.', 'Tuberías con la ecuación de continuidad y Bernoulli, y el chorro de un depósito con Torricelli: velocidad, alcance, caudal y tiempo de vaciado.', 'Una animación de cada caso.'] },
    ],
    doppler: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: frecuencia que se oye con la fuente, el observador y el viento moviéndose, con la longitud de onda delante de la fuente.', 'Una fuente que pasa de largo: lo que se oye antes y después, el salto en hercios y semitonos y, al revés, su velocidad a partir de las dos frecuencias. Con el observador a un lado de la carretera, la gráfica del cambio gradual.', 'Eco en un obstáculo que se mueve (radar de tráfico, murciélago, ecografía Doppler): la frecuencia del eco y las pulsaciones, o la velocidad del obstáculo a partir de ellas.', 'Onda de choque: número de Mach, semiángulo del cono y cuándo se oye el estampido.', 'Animación de los frentes de onda y botón para escuchar la diferencia.'] },
    ],
    resistencias: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: elige los colores de una resistencia de 3, 4, 5 o 6 bandas y obtén el valor, la tolerancia, el margen del valor real y el coeficiente de temperatura, con el dibujo de la resistencia.', 'Del valor a los colores: escribe 4k7, 2M2 o 470R y te da las bandas y el valor normalizado más cercano de las series E6 a E96.', 'Códigos SMD de 3 y 4 cifras, con R y EIA-96.'] },
    ],
    faraday: [
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: fem y corriente inducidas en una barra que se desliza sobre unos raíles, con la fuerza que la frena y la potencia.', 'Bobina que gira en un campo (alternador): flujo y fem en función del tiempo, valores máximo y eficaz.', 'Flujo que cambia en un tiempo porque cambia el campo o el ángulo: fem media, corriente y carga.', 'Espira que atraviesa una región con campo: fem al entrar y al salir, fuerza y calor.', 'Sentido de la corriente por la ley de Lenz y animación con la gráfica de Φ y ε.'] },
    ],
  };
  const de = (h) => ({ current: registros[h][0].v, log: registros[h] });
  // Version.current y Version.log son los del simulador de electrostática
  return { registros, de, ...de('electrostatica') };
})();
if (typeof module !== 'undefined') module.exports = Version;
