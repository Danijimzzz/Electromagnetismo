/* =====================================================================
   Versiones y novedades: la web (portada, asignaturas, buscador) tiene su número y cada
   herramienta el suyo. La web se lanzó en la 1.0, que junta en una sola tarjeta todo lo de la
   beta (0.1 a 0.57, con el detalle en Notion); las herramientas siguen en 0.x hasta que se dan
   por terminadas. Sube el segundo número si hay algo nuevo (1.1) y añade un tercero si es solo
   un arreglo (1.0.1).
   En las novedades de la web se anuncia también cada herramienta nueva.
   Las notas son para los usuarios: solo funciones nuevas, arreglos visibles y cambios
   en la interfaz. Lo interno (pruebas, CI, build, despliegue, refactorizaciones) no se anota;
   el historial completo para desarrolladores está en Notion.
   ===================================================================== */
const Version = (() => {
  const registros = {
    web: [
      { v: '1.18', fecha: '2026-11-16', titulo: 'Más ligera y más rápida', subtitulo: 'Sin herramientas nuevas: la web pesa menos de la mitad, abre antes la segunda vez que entras y las constantes de clase se eligen una sola vez.', secciones: [
        { icono: '⚡', titulo: 'Carga más rápida', puntos: [
          '**La mitad de peso:** lo que compartían todas las herramientas (Mis ejercicios, el modo práctica, las fórmulas…) se baja una sola vez y se guarda en el navegador, en vez de repetirse en cada página. De unos 28 MB a unos 13 MB en total.',
          '**Abre antes la segunda vez:** si ya entraste a una herramienta, las siguientes cargan casi solo con lo que es suyo. Y sin conexión funcionan igual que antes.',
          '**Electrostática, mucho más ligera:** la página pasa de 1,2 MB a unos 70 KB; el código del simulador se guarda en el navegador y las capturas de la guía solo se bajan cuando abres la guía.',
        ] },
        { icono: '🧪', titulo: 'Constantes y masas «de clase»', puntos: [
          '**Una sola elección:** el interruptor de constantes «de clase» o exactas (R, F, masas molares) de Química y el de la gravedad g de Física se guardan juntos. Lo que ya habías elegido se conserva.',
        ] },
        { icono: '🛟', titulo: 'Tus ejercicios, a salvo', puntos: [
          '**Copias de seguridad de siempre:** una copia de seguridad o un archivo .simu.json guardados con versiones anteriores se siguen abriendo en esta, con todos sus datos.',
        ] },
      ] },
      { v: '1.17', fecha: '2026-11-15', titulo: 'Química orgánica con anillos y benceno', subtitulo: 'La herramienta de Nomenclatura orgánica ya nombra ciclos y derivados del benceno, y los enseña en 3D.', secciones: [
        { icono: '⚗️', titulo: 'Química', puntos: [
          '#quimica/organica',
          '**Anillos y benceno:** escribe un ciclohexano, un ciclopentano o un derivado del benceno y obtén su nombre IUPAC (ciclohexanol, 1,2-dimetilciclohexano, tolueno, fenol, anilina, ácido benzoico…), con el anillo como padre o como sustituyente según las reglas.',
          '**Cis y trans, y orto, meta y para:** los estereoisómeros de un anillo (cis-1,2-dimetilciclohexano como forma meso, la pareja trans) con su nombre y R/S, y la posición de dos sustituyentes del benceno.',
          '**En 3D:** el anillo en silla o plano con los sustituyentes por encima o por debajo del plano, y 22 ejemplos nuevos.',
        ] },
      ] },
      { v: '1.16', fecha: '2026-11-15', titulo: 'Cada número, contrastado', subtitulo: 'Sin herramientas nuevas: esta versión comprueba con programas externos los datos, las fórmulas y los ejemplos de la web, y estrena un detalle de Gases reales.', secciones: [
        { icono: '🔎', titulo: 'Datos y resultados comprobados', puntos: [
          '**Química:** más de 200 datos (entalpías y entropías de formación, energías de ionización y de sublimación, productos de solubilidad y constantes de Henry) se han contrastado con fuentes abiertas; las diferencias entre tablas distintas están explicadas.',
          '**Matemáticas:** más de 180 resultados (integrales, límites, series, autovalores, ecuaciones diferenciales, desarrollos de Taylor y transformadas de Laplace) coinciden con los de un programa de cálculo simbólico independiente.',
          '**Preguntas frecuentes:** se han recalculado todos los ejemplos resueltos de las 111 herramientas, y los datos de los fenómenos de «Física en la vida real» (fibra óptica, pantalla táctil, resonancia magnética, radio, transformador…) se han vuelto a comprobar.',
        ] },
        { icono: '🧪', titulo: 'Gases', puntos: [
          '**Gas real:** Redlich-Kwong puede usar la temperatura y la presión críticas reales del gas (He, H₂, N₂, O₂, Ar, CO₂, NH₃ y H₂O) en vez de las que salen de las constantes de Van der Waals.',
        ] },
        { icono: '🐞', titulo: 'Informar de un error', puntos: [
          '**En el pie de cada herramienta:** si ves un resultado raro o un fallo, «Informar de un error» abre un correo ya con el nombre de la herramienta, para que solo tengas que contar qué esperabas y qué pasó.',
        ] },
        { icono: '🌍', titulo: 'Gravedad a tu gusto', puntos: [
          '**Un solo valor de g:** en Trabajo y energía, Tiro parabólico, Dinámica, Fluidos y Sólido rígido puedes elegir 9,8, 9,81 o 9,80665 m/s² y vale para todas. Si no tocas nada, cada herramienta usa el suyo de siempre.',
        ] },
        { icono: '⌨️', titulo: 'Teclado', puntos: [
          '**Se puede usar solo con el teclado:** con la tecla Tab se llega a todos los controles de cada herramienta, incluido el cuadro de texto de Sistemas de ecuaciones, y se puede cambiar un dato escribiendo.',
        ] },
      ] },
      { v: '1.15', fecha: '2026-11-11', titulo: 'Fase 10, terminada: más herramientas con más recursos', subtitulo: 'Sin herramientas nuevas, pero Matemáticas, Estadística, Economía y Física general aprenden cosas nuevas, y las herramientas se hablan más entre sí.', secciones: [
        { icono: '🛠️', titulo: 'En todas las herramientas', puntos: [
          '**Más botones «Usar en…»:** llevan un resultado a otra herramienta con los datos ya puestos (de Series a Taylor, de Laplace a Control, de Interés a Ahorro y Rentas, de Gases a Ciclos termodinámicos y de Tiro parabólico a Trabajo y energía, entre otros).',
          '**Casos límite en Matemáticas:** se han probado más de 7.000 datos incómodos (vacíos, ceros, enormes, con paréntesis sin cerrar…) y las herramientas dan un mensaje claro en vez de un resultado raro o una página colgada.',
        ] },
        { icono: '📐', titulo: 'Matemáticas', puntos: [
          '**Taylor:** radio e intervalo de convergencia de cualquier función, límites en el infinito y botón para dibujar la función con su polinomio en el Graficador.',
          '**Series:** criterio de la integral con primitiva, suma de las que convergen muy despacio con el resto acotado y botón para ver la serie como desarrollo de Taylor.',
          '**Derivadas:** más integrales y límites resueltos y comprobados; los límites numéricos se contrastan cerca del punto.',
          '**Matrices y Complejos:** núcleo, imagen y subespacios, vectores propios no racionales y casillas que aceptan cuentas.',
          '**Superficies:** puntos sin derivada (picos y aristas) y puntos críticos fuera del rango dibujado.',
          '**Laplace:** estabilidad de F(s) por sus polos y botón para usarla como lazo abierto en Control. **EDO:** botón para resolver con Laplace.',
        ] },
        { icono: '📊', titulo: 'Estadística', puntos: [
          '**Distribuciones:** teorema central del límite, exacto frente a aproximado y dos curvas a la vez.',
          '**Intervalos:** cuatro métodos para la proporción, de predicción y de tolerancia.',
          '**Regresión y Regresión múltiple:** z de Fisher, comparación de correlaciones, ajuste ponderado, datos casi colineales y aviso de VIF.',
          '**Probabilidad, Descriptiva y Errores:** variable aleatoria discreta, tabla 2 × 2, medias geométrica, armónica y ponderada, y propagación con variables correlacionadas.',
          '**Botones «Usar en…»** entre Descriptiva, Intervalos, Contrastes, ANOVA y No paramétricos.',
        ] },
        { icono: '💶', titulo: 'Economía', puntos: [
          '**Modo práctica propio** en 21 herramientas: ejercicios al azar de cada una, con su enunciado y la corrección de lo que escribes.',
          '**Convención visible:** el desarrollo de Interés, Préstamos, Rentas, Ahorro, Bonos, VAN y TIR, Amortización, Black-Scholes y Tipos de cambio termina diciendo qué base de días, qué tipo por periodo y qué redondeo usa.',
          '**Punto muerto:** varios productos con su mezcla de ventas y una tabla de sensibilidad.',
          '**Lorenz y Gini:** compara dos distribuciones en la misma gráfica.',
          '**Amortización del inmovilizado:** venta del bien en un año, con su beneficio o pérdida y los asientos del Plan General Contable.',
          '**Números índice:** empalma dos series con bases distintas.',
          '**Regresión sobre datos económicos:** gráfica de residuos y botón para añadir más variables en Regresión múltiple.',
          '**Teoría de juegos:** matrices 3 × 3 con eliminación de estrategias dominadas ronda a ronda.',
          '**Más «Usar en…»:** de Interés a Ahorro y Rentas, de Multiplicador a IS-LM y del PIB a Números índice.',
        ] },
        { icono: '🔭', titulo: 'Física general', puntos: [
          '**Unidades:** las constantes pasan a CODATA 2022, con la edición de 2018 como opción.',
          '**Ondas:** la velocidad del sonido se puede dar con la temperatura del aire.',
          '**Botones «Usar en…»:** de Tiro parabólico a Trabajo y energía, de Gases a Ciclos termodinámicos (cuando es un ciclo de Carnot) y de Gravitación a Física moderna.',
        ] },
      ] },
      { v: '1.14.1', fecha: '2026-11-10', cambios: [
        'Ajustador de reacciones: la ecuación iónica neta sale también con las sales de amonio escritas con paréntesis, como (NH₄)₂CO₃, y con los acetatos escritos como CH₃COONa; con un carbonato y un ácido explica que el H₂CO₃ se descompone en CO₂ y agua.',
        'Gases: la constante R se puede cambiar entre la «de clase» (8,314) y la exacta, con el mismo ajuste que las herramientas de Química.',
        'Límites de cada herramienta puestos al día: ANOVA ya no dice que le falta Tukey, y Lewis y VSEPR, Formulación, Markowitz y Black-Scholes explican ahora qué casos no cubren.',
        'Historial de cada herramienta al día: veinte herramientas que mejoraron en la 1.13 enseñan ya sus cambios y su versión 0.2 en el pie.',
      ] },
      { v: '1.14', fecha: '2026-11-10', titulo: 'Animaciones de «Física en la vida real» más claras', subtitulo: 'Se leen bien en el móvil, cambian de paso con un fundido y siete escenas tienen el dibujo rehecho.', secciones: [
        { icono: '🎬', titulo: 'Animaciones', puntos: [
          '**En el móvil se leen bien:** los recuadros con fórmulas y gráficas crecen para que su texto quepa y los rótulos ya no se pisan ni se cortan por el borde.',
          '**Fundido entre pasos:** el dibujo de un paso se funde con el del siguiente en vez de cambiar de golpe.',
          '**Rótulos en su sitio:** se han corregido los textos que se montaban unos sobre otros en 16 fenómenos.',
        ] },
        { icono: '🎨', titulo: 'Siete escenas con el dibujo rehecho', puntos: [
          '#fenomenos/detector-metales',
          '**El detector de metales:** campo de las bobinas, moneda enterrada y sus corrientes de Foucault sobre un terreno con capas.',
          '#fenomenos/cargador-inalambrico',
          '**El cargador inalámbrico:** la base, el móvil y el campo que los une, sobre una mesa con luz.',
          '#fenomenos/altavoz-motor',
          '**El altavoz y el motor:** el imán, el cono y las ondas de sonido con volumen y brillo.',
          '#fenomenos/pantalla-tactil',
          '**La pantalla táctil:** el móvil visto desde arriba y el dedo con su halo sobre el cristal.',
          '#fenomenos/resonancia-magnetica',
          '**La resonancia magnética:** una sala con el túnel, la camilla y el paciente.',
          '#fenomenos/frenado-magnetico',
          '**El freno magnético y el tren:** paisaje, estela de velocidad y el colchón magnético bajo el tren.',
          '#fenomenos/radio-am-fm',
          '**La radio AM y FM:** un atardecer con las antenas y las trazas como en un osciloscopio.',
        ] },
      ] },
      { v: '1.13', fecha: '2026-11-08', titulo: 'Fase 10: mejor, más completo y más accesible', subtitulo: 'Ninguna herramienta nueva, pero casi todas con más cálculos, más ejemplos, gráficas que se descargan y botones para llevar un resultado a otra herramienta.', secciones: [
        { icono: '🛠️', titulo: 'En todas las herramientas', puntos: [
          '**Descargar PNG y Copiar datos** bajo cada gráfica: la imagen sale sobre el fondo de la página con su título, y los datos se pegan en una hoja de cálculo con coma decimal.',
          '**«Usar en…»**: botones que llevan un resultado a otra herramienta de la misma asignatura (por ejemplo, el equilibrio de Oferta y demanda a Excedentes, o la ΔG° de Termoquímica a Equilibrio).',
          '**Mis ejercicios más fiable:** al abrir un ejercicio ya no se puede pisar con un cálculo pendiente, y la lista se actualiza sola entre pestañas.',
          '**Casos límite:** las herramientas explican con un aviso los datos que dan un resultado fuera de rango (infinito, indefinido), y se han arreglado cuatro páginas que se colgaban con valores extremos.',
          '**Límites de cada herramienta:** las más delicadas (orgánica, termodinámica estadística, ANOVA, gases, Simulador de circuitos) dicen qué casos no cubren.',
        ] },
        { icono: '🧲', titulo: 'Electromagnetismo', puntos: [
          '#electromagnetismo/magnetostatica',
          '**Dipolo magnético y potencial vector A:** momento dipolar de espiras, solenoides y discos, y A comparado con el exacto de Biot-Savart.',
          '#electromagnetismo/ondas-em',
          '**Plasma e ionosfera y suma de dos ondas:** frecuencia de plasma, velocidades de fase y de grupo, batidos y ondas estacionarias con su ROE.',
          '#electromagnetismo/maxwell',
          '**¿Este campo cumple las ecuaciones?** Escribe E y B como expresiones y se comprueban sus divergencias y rotacionales.',
          '#electromagnetismo/lineas-transmision',
          '**Líneas con pérdidas, transitorios con reflexiones y adaptación con stub** simple y doble.',
          '#electromagnetismo/fresnel',
          '**Capas delgadas y antirreflejantes** con R, T y la fase frente al ángulo.',
          '#electromagnetismo/laplace-numerica',
          '**Laplace y Poisson:** densidad de carga, bordes aislantes, hasta tres electrodos circulares, capacidad y energía.',
          '#electromagnetismo/imagenes',
          '**Método de las imágenes:** cuña conductora, planos paralelos, varias cargas y dipolo frente a un plano.',
          '#electromagnetismo/guias-onda',
          '**Guía circular** (modos TE y TM) y botón para cerrarla en una cavidad.',
          '#electromagnetismo/antena',
          '**Arrays de antenas,** diagrama de radiación en 3D y enlace de Friis.',
          '#electromagnetismo/fuerza',
          '**Fuerza magnética:** trayectoria con E y B cualesquiera (hélice, deriva E×B), espejo magnético y vista 3D.',
          '#electromagnetismo/induccion',
          '**Fuerza entre dos espiras** con la inducción mutua exacta.',
          '#electromagnetismo/faraday',
          '**Barra en raíles inclinados y corrientes de Foucault** en discos y núcleos laminados.',
          '**Modo práctica de Electrostática:** comprueba las dimensiones de tu respuesta (N/C, V, N, J…) y señala qué término falla.',
        ] },
        { icono: '⚡', titulo: 'Circuitos', puntos: [
          '#circuitos/bode',
          '**Bode con Q alto:** los filtros muy selectivos ya no pierden el pico de resonancia ni la frecuencia de corte.',
          '#circuitos/control',
          '**Control:** respuesta al escalón y Bode de lazo abierto con los márgenes de fase y de ganancia.',
          '#circuitos/transformada-z',
          '**Transformada z:** modo inverso con la región de convergencia y FFT con relleno de ceros y fase.',
          '#circuitos/semiconductores',
          '**Semiconductores:** pnp, canal p, Zener, pequeña señal y estabilidad térmica.',
          '#circuitos/convolucion',
          '**Convolución discreta** y filtros RL, RC paso alto y RLC paso banda.',
          '#circuitos/puertas-logicas',
          '**Puertas lógicas:** cada salida con solo NAND o solo NOR, riesgos estáticos y lógica secuencial.',
          '#circuitos/resistencias',
          '**Resistencias:** el divisor en el peor caso con la tolerancia, aviso de potencia y series E3 y E192.',
          '#circuitos/simulador',
          '**Simulador de circuitos:** seis ejemplos nuevos y un barrido que se afina solo cerca de las resonancias.',
        ] },
        { icono: '🔭', titulo: 'Física general', puntos: [
          '#fisica/optica',
          '**Óptica:** sistemas de varias lentes con matrices ABCD.',
          '#fisica/gases',
          '**Gases:** cada constante con su fuente y aviso cuando el método numérico pierde precisión.',
          '#fisica/osc-acopladas',
          '**Oscilaciones acopladas:** casos de acoplo nulo y de modos simétricos.',
          '#fisica/relatividad',
          '**Relatividad:** casos límite explicados.',
        ] },
        { icono: '📊', titulo: 'Estadística', puntos: [
          '#estadistica/anova',
          '**ANOVA de uno y dos factores** con comparaciones de Tukey, Holm y Scheffé, Welch y tamaño del efecto ω².',
          '#estadistica/contrastes',
          '**Contrastes:** potencia, datos apareados y normalidad.',
          '#estadistica/no-parametricos',
          '**No paramétricos:** Kruskal-Wallis con Dunn, Spearman, Kendall y Hodges-Lehmann.',
          '#estadistica/chi2-bondad',
          '**χ²:** test exacto de Fisher, McNemar y residuos.',
          '#estadistica/distribuciones',
          '**Cinco distribuciones nuevas:** gamma, beta, lognormal, Weibull y binomial negativa.',
        ] },
        { icono: '📐', titulo: 'Matemáticas', puntos: [
          '#matematicas/derivadas',
          '**Integrales:** resuelve ahora casos que antes se quedaban sin primitiva, y avisa cuando no la tiene elemental.',
          '#matematicas/campos',
          '**Coordenadas cilíndricas y esféricas** para ∇f, ∇·F y ∇×F.',
          '#matematicas/graficador',
          '**Graficador:** estudio de funciones con valor absoluto.',
          '**Series, métodos numéricos, EDOs y Lagrange:** conclusiones más honestas (series p casi 1, orden de Newton, falta de unicidad, casos singulares).',
        ] },
        { icono: '⚗️', titulo: 'Química', puntos: [
          '#quimica/redox',
          '**Redox:** pilas con Nernst y electrólisis de Faraday.',
          '#quimica/termoquimica',
          '**Termoquímica:** ΔS°, ΔG°, ciclo de Born-Haber y botón «Calcular K en Equilibrio».',
          '#quimica/equilibrio',
          '**Equilibrio:** fases, K desde ΔG° y dos equilibrios acoplados.',
          '#quimica/cinetica',
          '**Cinética:** reacciones consecutivas, reversibles y mecanismos con etapa lenta.',
          '#quimica/disoluciones',
          '**Disoluciones:** solubilidad frente a la temperatura y ley de Henry.',
          '#quimica/vsepr',
          '**Lewis y VSEPR:** cargas formales, resonancia, octeto expandido y varios átomos centrales.',
          '#quimica/formulacion',
          '**Formulación:** complejos, hidratos y compuestos con nombre propio.',
          '#quimica/organica',
          '**Orgánica:** escribe la fórmula semidesarrollada como en clase.',
          '**Ajuste común «de clase / exactas»** para R, F y masas atómicas en Equilibrio, Cinética, Redox y Masa molar.',
          '**Tabla periódica y configuración electrónica** comprobadas con los 118 elementos; pH con 12 indicadores y Solubilidad con 54 sales.',
        ] },
        { icono: '💶', titulo: 'Economía', puntos: [
          '#economia/black-scholes',
          '**Black-Scholes:** casos límite y volatilidad implícita.',
          '#economia/markowitz',
          '**Markowitz:** correlación ±1, sin ventas en corto por defecto y cartera tangente como objetivo.',
          '#economia/prestamos',
          '**Préstamos:** carencia y amortización anticipada con los intereses ahorrados.',
          '#economia/van-tir',
          '**VAN y TIR:** varias TIR, TIR modificada y comparación de dos proyectos.',
          '#economia/tipos-cambio',
          '**Tipos de cambio:** paridad de los tipos de interés y arbitraje.',
          '**Solow, bonos, rentas, interés, ahorro, ratios, beneficio, costes, IS-LM, Phillips y Okun** con más cálculos, gráficas y ejemplos, y botones «Usar en…» entre Oferta y demanda, Excedentes, Elasticidades, Costes, IS-LM y Multiplicador.',
        ] },
      ] },
      { v: '1.12.1', fecha: '2026-11-06', cambios: ['La web se prepara para mostrar publicidad de Google: en el pie de las páginas aparece «Preferencias de cookies» para elegir qué aceptas, y las políticas de cookies y privacidad lo explican.'] },
      { v: '1.12', fecha: '2026-11-03', titulo: 'Fase 9: siete herramientas y siete fenómenos nuevos', subtitulo: 'Control, transformada z, semiconductores, orgánica en 3D, cavidades resonantes, termodinámica estadística, la cartera de Markowitz y siete fenómenos de la vida real.', secciones: [
        { icono: '⚡', titulo: 'Circuitos', puntos: [
          '#circuitos/transformada-z',
          '**Transformada z y FFT:** polos, ceros, estabilidad, respuesta al impulso y respuesta en frecuencia de un sistema, y la FFT de una señal con ventanas, picos, resolución y aliasing.',
          '#circuitos/control',
          '**Routh, lugar de las raíces y Nyquist:** estabilidad de un sistema realimentado con el rango de K, las ramas con sus asíntotas y puntos de ruptura, y los márgenes de ganancia y de fase.',
          '#circuitos/semiconductores',
          '**Diodo, BJT y MOSFET:** recta de carga y punto de trabajo Q sobre las curvas del dispositivo, con la región en que trabaja y el desarrollo paso a paso.',
        ] },
        { icono: '🧲', titulo: 'Electromagnetismo', puntos: [
          '#electromagnetismo/cavidades',
          '**Cavidades rectangulares, cilíndricas y esféricas:** frecuencia de cada modo TE y TM, factor de calidad Q, ancho de banda y mapa del campo en el plano de corte.',
        ] },
        { icono: '🔭', titulo: 'Física general', puntos: [
          '#fisica/termo-estadistica',
          '**Función de partición y entropía:** poblaciones de Boltzmann, energía, entropía y calor específico de dos niveles y osciladores de Einstein, y S = k·ln Ω de sólidos en contacto.',
        ] },
        { icono: '⚗️', titulo: 'Química', puntos: [
          '#quimica/organica',
          '**Nombre IUPAC e isomería en 3D:** escribe una molécula y obtén su nombre, sus centros R/S, los dobles enlaces E/Z y todos sus estereoisómeros, con la molécula en 3D que se gira con el ratón.',
        ] },
        { icono: '💶', titulo: 'Economía', puntos: [
          '#economia/markowitz',
          '**Frontera eficiente y CAPM:** cartera de mínima varianza y tangente, ratio de Sharpe, beta, alfa y línea del mercado de valores.',
        ] },
        { icono: '🌍', titulo: 'Nuevos fenómenos en Física en la vida real', puntos: [
          '#fenomenos/radio-am-fm',
          '**La radio AM y FM:** la portadora, la modulación y el circuito resonante que sintoniza una emisora. Se abre en Diagramas de Bode.',
          '#fenomenos/fibra-optica',
          '**La fibra óptica:** por qué la luz no se sale de un hilo de vidrio (reflexión total). Se abre en Reflexión y transmisión.',
          '#fenomenos/pantalla-tactil',
          '**La pantalla táctil:** el dedo y un electrodo forman un condensador de unos pocos pF. Se abre en Dieléctricos y condensadores.',
          '#fenomenos/frenado-magnetico',
          '**El freno magnético y el tren de levitación:** corrientes de Foucault y ley de Lenz. Se abre en Inducción: Faraday y Lenz.',
          '#fenomenos/transformador-poste',
          '**El transformador del poste:** de 20 000 V a 400 V y por qué zumba a 100 Hz. Se abre en Autoinducción e inducción mutua.',
          '#fenomenos/detector-metales',
          '**El detector de metales:** una bobina, corrientes de Foucault y un eco. Se abre en Autoinducción e inducción mutua.',
          '#fenomenos/resonancia-magnetica',
          '**La resonancia magnética:** protones en un imán de 1,5 T y ondas de radio de 63,9 MHz. Se abre en Magnetostática.',
        ] },
      ] },
      { v: '1.11', fecha: '2026-11-02', titulo: 'Fase 8: más profundidad en cada asignatura', subtitulo: 'Once herramientas nuevas y mejoras en el Simulador de circuitos, las ondas, los gases, el pH y las integrales.', secciones: [
        { icono: '⚡', titulo: 'Simulador de circuitos', puntos: [
          '**Importar y exportar SPICE:** pega una red escrita en SPICE (R, C, L, fuentes, diodos, transistores…) y se dibuja como esquema, o saca la tuya como texto. Avisa de lo que no puede traducir (interruptores, transformadores y subcircuitos).',
          '**Pestaña Barrido:** cambia un valor del circuito (una resistencia, un condensador, la frecuencia…) en un rango lineal o logarítmico y mira cómo cambia una tensión, una corriente o una potencia, con el máximo y el mínimo marcados y una tabla.',
          '**Potencia en Thévenin y Norton:** la curva de la potencia que recibe una carga según su valor, con el máximo cuando la carga vale R<sub>Th</sub>.',
        ] },
        { icono: '🌊', titulo: 'Ondas electromagnéticas', puntos: [
          '**Polarizadores:** ley de Malus con luz natural, lineal o circular a través de hasta 6 polarizadores, con la intensidad tras cada uno.',
          '**Vector de Poynting:** el balance de energía de un hilo con corriente, un condensador que se carga y un cable coaxial, comprobando que el flujo de S es la potencia. Se abre en @electromagnetismo/ondas-em.',
        ] },
        { icono: '🔭', titulo: 'Física general', puntos: [
          '#fisica/osc-acopladas',
          '**Dos masas, tres muelles:** modos normales y frecuencias, el movimiento de cada masa, el batido y cuánto tarda la energía en pasar de una a otra.',
          '#fisica/relatividad',
          '**Lorentz y Minkowski:** transforma un evento con su diagrama de ejes inclinados, suma velocidades con rapideces y calcula el intervalo entre dos eventos (tiempo propio, distancia propia y causalidad).',
        ] },
        { icono: '⚗️', titulo: 'Química', puntos: [
          '#quimica/solubilidad',
          '**Kps y solubilidad** de sales poco solubles, ion común, si precipita al mezclar y precipitación fraccionada, con 15 sales de ejemplo y un diagrama logarítmico.',
          '**Gases reales:** @quimica/gases compara ahora Van der Waals con Redlich-Kwong y dibuja el factor de compresibilidad Z frente a la presión.',
          '**Diagrama de especies** en @quimica/ph para los ácidos polipróticos: la fracción de cada forma frente al pH, con los pK marcados.',
        ] },
        { icono: '∑', titulo: 'Matemáticas', puntos: [
          '#matematicas/series',
          '**¿Converge o diverge?** Condición necesaria, serie geométrica y p, cociente, raíz, comparación y Leibniz, con la suma y las sumas parciales dibujadas.',
          '#matematicas/lagrange',
          '**Extremos con restricción:** plantea ∇f = λ∇g, clasifica cada punto crítico y dibuja las curvas de nivel con la restricción.',
          '**Integrales paso a paso:** @matematicas/derivadas explica ahora la sustitución y la integración por partes (elección de u y dv, tabla de signos, integral cíclica).',
        ] },
        { icono: '📊', titulo: 'Estadística', puntos: [
          '#estadistica/anova',
          '**ANOVA de un factor** con su tabla, F, p-valor, η² y comparaciones por parejas con Bonferroni.',
          '#estadistica/regresion-multiple',
          '**Regresión lineal múltiple** hasta con 6 variables: coeficientes con t y p-valor, R² ajustado, ANOVA, VIF y predicción con intervalos.',
          '#estadistica/no-parametricos',
          '**Mann-Whitney y Wilcoxon** con la tabla de rangos, el p-valor exacto o aproximado y la conclusión paso a paso.',
        ] },
        { icono: '💶', titulo: 'Economía', puntos: [
          '#economia/solow',
          '**Modelo de Solow:** estado estacionario, regla de oro, convergencia y la trayectoria del capital.',
          '#economia/bonos',
          '**Bonos y duración:** precio, TIR, duración de Macaulay y modificada, convexidad y variación del precio con los tipos.',
          '#economia/black-scholes',
          '**Black-Scholes:** call y put europeas, paridad call-put y las griegas.',
        ] },
      ] },
      { v: '1.10', fecha: '2026-11-02', titulo: 'Fase 7: estudia en cualquier sitio', subtitulo: 'Ciencify se instala como una app, funciona sin conexión, guarda y comparte tus ejercicios de más formas y te recuerda por dónde ibas.', secciones: [
        { icono: '📲', titulo: 'Instalable y sin conexión', puntos: [
          '**Instala Ciencify** como una app: en el móvil o el ordenador, desde el menú del navegador («Instalar» o «Añadir a pantalla de inicio») o con el botón de la portada. Se abre sin barras del navegador y con su icono.',
          '**Funciona sin conexión:** lo que ya abriste sigue disponible sin cobertura, y con **Guardar todo para usar sin conexión** (al final de la portada) tienes las 90+ herramientas y todos los fenómenos en el dispositivo.',
          '**Siempre al día:** con conexión ves la versión nueva; si hay una, te lo avisa y pulsas **Actualizar**. Si habías guardado todo, se vuelve a guardar sola.',
        ] },
        { icono: '💾', titulo: 'Tus ejercicios, a salvo', puntos: [
          '**Copia de seguridad de todo:** en **Mis ejercicios**, de cualquier herramienta, pulsa «Copia de seguridad de todo» y descargas **un solo archivo** con los ejercicios de todas las herramientas y tus problemas de Electrostática.',
          '**Restaurar copia:** súbela en «Restaurar copia…» (o arrástrala a la barra) en este u otro navegador. Se **suma** a lo que ya tienes: no borra ni duplica nada.',
          'Haz una de vez en cuando: si borras los datos del navegador, los ejercicios guardados se pierden.',
        ] },
        { icono: '📋', titulo: 'Copiar, LaTeX e imprimir en 90 herramientas', puntos: [
          '**Copiar como texto, Copiar en LaTeX e Imprimir o PDF**, que antes solo tenían Matemáticas y Electromagnetismo, ya están en Física, Química, Estadística, Circuitos y Economía. Sacan solo el ejercicio: resultados y desarrollo, sin menús ni teoría.',
          '**Copiar tabla** (donde la herramienta tiene una tabla, como los cuadros de amortización o las iteraciones): se pega en Excel o en Google Sheets con las columnas separadas, y en LaTeX sale como `tabular`.',
        ] },
        { icono: '🔗', titulo: 'Comparte un ejercicio con un enlace', puntos: [
          '**Copiar enlace con estos datos**, en «Mis ejercicios» de todas las herramientas: quien lo abra ve la herramienta con tus números ya puestos, sin archivos ni cuentas.',
        ] },
        { icono: '🖨️', titulo: 'Hoja de ejercicios para imprimir', puntos: [
          '**Elige varios ejercicios guardados** en «Mis ejercicios» → «Hoja para imprimir…» y sácalos juntos en una sola hoja, cada uno con sus datos, resultados, gráfica y desarrollo paso a paso. Sale en claro, lista para imprimir o guardar en PDF.',
        ] },
        { icono: '⭐', titulo: 'Tu espacio en la portada', puntos: [
          '**Continúa donde lo dejaste:** la portada te muestra la última herramienta que abriste, tus **favoritas** (botón ☆ **Favorita** en cada herramienta) y las últimas usadas.',
          'Todo queda **solo en tu navegador**: sin cuentas ni envíos, y «Olvidar mis datos» lo borra.',
        ] },
        { icono: '🔥', titulo: 'La herramienta del momento', puntos: [
          '**Una llama animada marca la herramienta más usada de cada asignatura**, en la portada, en la página de la asignatura y en la propia herramienta. Se calcula con las visitas del último mes y se actualiza sola.',
          'Solo se cuenta **cuántas veces se abre cada herramienta**: sin cookies, sin guardar tu IP y sin saber qué haces dentro. Con «No rastrear» activado, no cuentas.',
        ] },
        { icono: '🔎', titulo: 'Más fácil de encontrar', puntos: [
          '**Preguntas frecuentes en cada herramienta:** al final de las 93 herramientas, «¿Cómo se calcula…?» con un ejemplo resuelto con números, para repasar la fórmula sin salir de la página.',
          '**Herramientas relacionadas entre asignaturas:** desde Ondas electromagnéticas llegas a Ondas mecánicas, desde Laplace a Bode, desde VAN y TIR a Interés… más fácil saltar de una a otra.',
        ] },
      ] },
      { v: '1.9', fecha: '2026-11-02', titulo: 'Fase 6: Ciencify, más rápida y más accesible', subtitulo: 'La web estrena nombre y buscador global, pesa casi la mitad y se puede usar mejor con teclado y lector de pantalla.', secciones: [
        { icono: '🏷️', titulo: 'Nueva imagen', puntos: [
          '**SimulaCiencia ahora se llama Ciencify:** nuevo nombre en la cabecera, las pestañas, los avisos legales y la imagen que sale al compartir el enlace. Tus ejercicios guardados y tus archivos `.simu.json` siguen funcionando igual.',
        ] },
        { icono: '🔎', titulo: 'Buscador en todas partes', puntos: [
          '**Buscador en todas las páginas:** pulsa **/** o **Ctrl+K** (⌘K en Mac) y escribe. Encuentra herramientas, fenómenos de la vida real y asignaturas sin tildes ni mayúsculas, y con las flechas e Intro entras directo.',
          '**Se acuerda de lo último que abriste** y funciona también tocando el campo de búsqueda de la cabecera, en el móvil y en modo oscuro.',
        ] },
        { icono: '⚡', titulo: 'Más rápida y más accesible', puntos: [
          '**Las páginas pesan casi la mitad:** el sitio baja de **33,6 MB a 19,7 MB**, así que cada herramienta carga antes, sobre todo en el móvil.',
          '**Teclado en el lienzo de @electromagnetismo/electrostatica:** Intro elige la siguiente carga o punto, las flechas lo mueven (con Mayús, paso fino), Esc lo suelta y +, − y 0 acercan, alejan y encuadran. Un lector de pantalla dice dónde está.',
          '**Resultados que se anuncian:** al cambiar un dato, los lectores de pantalla leen los resultados nuevos, avisan de los errores y describen cada gráfica con ellos.',
          '**Complejos:** el modo práctica ya pregunta también sumas, productos, cocientes y potencias.',
          '**Accesible desde el teclado:** las fórmulas y tablas anchas se pueden recorrer con el tabulador, también en el móvil.',
          '**Más legible:** el gris de los textos secundarios en modo oscuro y los colores de **Electromagnetismo** y **Circuitos** tienen más contraste.',
          '**Mejor con lectores de pantalla:** cada página tiene su zona principal marcada, las tablas con columnas sin título ya lo dicen y las pestañas de **Trabajo y energía** se leen como pestañas.',
        ] },
        { icono: '✅', titulo: 'Datos revisados', puntos: [
          '**Revisados los datos de varios fenómenos** (GPS, alta tensión, microondas, rayo, auroras, altavoz, inducción y cargador) y de la tabla periódica, Van der Waals y planetas; el cargador inalámbrico aclara ahora su aproximación.',
        ] },
      ] },
      { v: '1.8', fecha: '2026-11-02', titulo: 'Fase 5: cinco fenómenos más de la vida real', subtitulo: 'El rayo, las auroras boreales, el altavoz y el motor, la cocina de inducción y el cargador inalámbrico, cada uno con su animación paso a paso.', secciones: [
        { icono: '🌍', titulo: 'Nuevos fenómenos en Física en la vida real', puntos: [
          '#fenomenos/rayo',
          '**Seis pasos animados:** cómo se carga una nube de tormenta, por qué la nube y el suelo son un **condensador gigante de 44 nF a 100 MV** y cómo baja el canal que acaba en un rayo.',
          '**Cuánta carga, corriente y energía:** unos **4,4 C**, **30 kA** y **220 MJ** (unos 61 kWh) en un solo rayo, con el trueno que llega 3 s por kilómetro.',
          '**«Pruébalo tú»:** cuenta los segundos entre el relámpago y el trueno y mira a qué distancia ha caído. Se abre en Dieléctricos y condensadores con los datos de la nube.',
          '#fenomenos/auroras',
          '**Seis pasos animados:** del viento solar al polo: cómo un electrón gira en el campo de la Tierra, dibuja una hélice, rebota en el espejo magnético y acaba chocando con el oxígeno, que brilla en **verde** (557,7 nm) y en **rojo** (630 nm).',
          '**Las cuentas de verdad:** un electrón de 5 keV en un campo de 50 µT gira en un círculo de **2,38 m** a 1,40 MHz y avanza 25,9 m por vuelta; solo llegan al aire los que salen a menos de 2,8° del campo.',
          '**«Pruébalo tú»:** cambia la energía del electrón y mira cómo se estira la hélice. Se abre en Fuerza magnética con los datos ya puestos.',
          '#fenomenos/altavoz-motor',
          '**Seis pasos animados:** cómo una corriente en un campo magnético recibe una fuerza (F = I L B), cómo esa fuerza mueve el cono de un altavoz y cómo hace girar la bobina de un motor.',
          '**El conmutador:** por qué hay que invertir la corriente cada media vuelta para que el motor no se frene.',
          '**«Pruébalo tú»:** cambia la corriente del altavoz o el ángulo de la bobina y mira la fuerza y el par. Se abre en Fuerza magnética con los datos ya puestos.',
          '#fenomenos/cocina-induccion',
          '**Seis pasos animados:** cómo una placa de inducción calienta la sartén sin llama: la bobina con corriente alterna de **25 kHz**, la ley de Faraday en la base de la sartén y las corrientes de Foucault que la calientan por efecto Joule (**≈ 1800 W**).',
          '**El imán que cae despacio:** por un tubo de plástico cae en 0,32 s; por uno de cobre tarda varios segundos, porque la ley de Lenz lo frena.',
          '**«Pruébalo tú»:** cambia la frecuencia de la bobina y mira cómo la potencia crece con f². Se abre en Inducción: Faraday y Lenz con los datos de la sartén.',
          '#fenomenos/cargador-inalambrico',
          '**Seis pasos animados:** cómo la bobina de la base crea un campo magnético que cambia, cómo atraviesa la bobina del móvil y por qué, por la ley de Faraday, aparece una tensión sin ningún cable.',
          '**Resonancia y rectificador:** por qué los cargadores trabajan a unos **110 kHz** y cómo se pasa de corriente alterna a la continua que necesita la batería.',
          '**«Pruébalo tú»:** cambia la frecuencia y mira cómo sube la tensión, o separa las bobinas y mira cómo cae la inducción mutua. Se abre en Autoinducción e inducción mutua con los datos puestos.',
        ] },
      ] },
      { v: '1.7', fecha: '2026-11-01', titulo: 'Fase 4: matemáticas, química, circuitos y economía', subtitulo: 'Ocho novedades: integrales dobles y triples, superficies en 3D, formulación, redox, moléculas en 3D, la carta de Smith, el balance de una empresa y el arcoíris.', secciones: [
        { icono: '⚡', titulo: 'Nuevas herramientas en Electromagnetismo', puntos: [
          '#electromagnetismo/lineas-transmision',
          '**ROE y ondas estacionarias:** pon la impedancia de la línea, la carga R + jX, la frecuencia y la longitud, y obtén el coeficiente de reflexión, la ROE, la pérdida de retorno y la impedancia de entrada.',
          '**La carta de Smith dibujada:** el punto de la carga, el círculo de ROE y el recorrido hacia el generador, con el perfil de la tensión y la corriente a lo largo de la línea.',
          '**Adaptación de impedancias:** dónde poner un stub en paralelo y cuánto mide, en cortocircuito o en abierto, o un transformador λ/4. Con desarrollo paso a paso, ejemplos y **modo práctica**.',
        ] },
        { icono: '∑', titulo: 'Nuevas herramientas en Matemáticas', puntos: [
          '#matematicas/integrales-multiples',
          '**Integrales dobles y triples:** en cartesianas (con dy dx o dx dy), en polares, en cilíndricas y en esféricas, con los límites de fuera adentro.',
          '**Cada paso:** el cambio de variables con su jacobiano, el integrando transformado y cada integral iterada de dentro afuera con su primitiva; si alguna no sale, sigue en numérico y lo avisa.',
          '**La región se ve:** el plano sombreado con el barrido de la integral interior, o el sólido en perspectiva que se gira arrastrando. Da el valor exacto, el área o volumen y el valor medio.',
          '**13 ejemplos de clase** (cardioide, esfera, cono, tetraedro, e^(y²) cambiando el orden…) y **modo práctica**.',
          '#matematicas/superficies',
          '**Superficie en 3D que se gira:** escribe z = f(x, y) y arrástrala (rueda para acercar, flechas del teclado) con el plano tangente y el mapa de curvas de nivel proyectado en el suelo.',
          '**Mapa de curvas de nivel:** con el gradiente (perpendicular a la curva), la tangente a la curva de nivel y los puntos críticos marcados; pulsa en el mapa para mover el punto.',
          '**Todo en el punto:** gradiente y módulo, plano tangente con su normal, derivada direccional en la dirección que quieras y aproximación lineal con su error.',
          '**Puntos críticos** clasificados con el hessiano (mínimo, máximo o silla), **8 ejemplos** y **modo práctica**.',
        ] },
        { icono: '🧪', titulo: 'Nuevas herramientas en Química', puntos: [
          '#quimica/formulacion',
          '**De fórmula a nombre y de nombre a fórmula:** escribe Fe2O3 o «sulfato de aluminio» y te da el otro lado, con las tres nomenclaturas (sistemática, de Stock y tradicional).',
          '**Casi 3.000 compuestos:** óxidos, peróxidos, hidruros, hidróxidos, ácidos, sales binarias, oxisales, sales ácidas y compuestos entre no metales.',
          '**Paso a paso:** el tipo de compuesto, los estados de oxidación y el cruce de cargas, con sugerencias si te equivocas al escribir.',
          '**Modo práctica** con compuestos al azar, en los dos sentidos.',
          '#quimica/redox',
          '**Ajuste redox por ion-electrón:** escribe la reacción iónica, elige medio ácido o básico y te la ajusta.',
          '**Cada paso:** los números de oxidación, qué se oxida y qué se reduce, las dos semirreacciones (elemento, oxígeno con H₂O, hidrógeno con H⁺ y carga con electrones), los electrones igualados, la suma y el paso a medio básico con OH⁻.',
          '**Con comprobación y gráfica** del cambio del número de oxidación, **10 ejemplos de clase** (permanganato, dicromato, agua oxigenada, dismutación del cloro…) y **modo práctica**.',
          '#quimica/vsepr',
          '**Escribe una molécula o un ion** (H2O, SF4, NH4+, SO4 2-…) o elige un tipo AXₙEₘ y obtén los dominios de electrones, la geometría y los ángulos de enlace.',
          '**La molécula en 3D:** gírala con el ratón, el dedo o las flechas del teclado; los pares libres salen como nubes y el momento dipolar como una flecha.',
          '**Hibridación y polaridad,** con la suma vectorial de los enlaces explicada paso a paso, la tabla de las 14 geometrías (lineal, tetraédrica, balancín, forma de T, plana cuadrada…) y 23 ejemplos.',
          '**Modo práctica:** adivina la geometría, la hibridación y si la molécula es polar.',
        ] },
        { icono: '💶', titulo: 'Nuevas herramientas en Economía', puntos: [
          '#economia/balance',
          '**Cuenta de pérdidas y ganancias:** de las ventas al resultado del ejercicio, pasando por el EBITDA, el resultado de explotación, el financiero, el BAI y el impuesto.',
          '**Balance de situación:** activo, patrimonio neto y pasivo, con el resultado del ejercicio dentro del patrimonio neto. Comprueba que cuadra y te dice cuánto falta si no.',
          '**Fondo de maniobra y balance dibujado** en dos columnas, con las dos cuentas escritas en tablas.',
          '**4 ejemplos** (pyme, pérdidas, comercio, empresa nueva), desarrollo paso a paso y **modo práctica**.',
        ] },
        { icono: '✦', titulo: 'Nuevos fenómenos en Física en la vida real', puntos: [
          '#fenomenos/arcoiris',
          '**Seis pasos animados:** cómo la luz del Sol entra en una gota de lluvia, se dobla, rebota en el fondo y sale, y por qué los rayos se amontonan justo a **42°** del eje contrario al Sol.',
          '**Cada color a su ángulo:** el rojo sale a 42,4° y el violeta a 40,6°, por eso el rojo queda por fuera del arco. También sale el arcoíris secundario, a 51°.',
          '**«Pruébalo tú»:** cambia el ángulo con que el rayo entra en la gota y mira a qué ángulo sale. Se abre en Reflexión y transmisión (Fresnel) con los datos de la gota.',
        ] },
      ] },
      { v: '1.6', fecha: '2026-11-01', titulo: 'Fase 3: ondas, circuitos y la vida real', subtitulo: 'Diez herramientas nuevas y cuatro fenómenos: de las ecuaciones de Maxwell a las antenas, de los filtros de Bode a las lentes, y por qué el cielo es azul.', secciones: [
        { icono: '⚡', titulo: 'Nuevas herramientas en Electromagnetismo', puntos: [
          '#electromagnetismo/maxwell',
          '**Forma integral y diferencial:** Gauss para E y para B, Faraday y Ampère–Maxwell, con lo que dice cada una y el simulador donde verla en acción.',
          '**Una calculadora por ecuación:** flujo y campo de una esfera cargada, flujo de B por un cubo, fem de una bobina, corriente de desplazamiento y campo en un condensador, y la velocidad de la luz con la onda plana.',
          '**Paso a paso, con gráfica,** modo práctica y para copiar o imprimir la solución.',
          '#electromagnetismo/fresnel',
          '**Coeficientes de Fresnel:** ángulo de refracción, reflexión y transmisión de las polarizaciones TE y TM, y la reflectancia y la transmitancia, con índices n o con εr y μr.',
          '**Ángulo de Brewster y ángulo crítico**, y en la reflexión total el desfase de cada polarización y la profundidad de la onda evanescente.',
          '**Dibujo de los rayos** y gráfica de la reflectancia según el ángulo, con el desarrollo paso a paso y modo práctica.',
          '#electromagnetismo/guias-onda',
          '**Frecuencia de corte y modos:** elige el tamaño de la guía, el relleno, la frecuencia y el modo (TE o TM) y mira si se propaga o se atenúa.',
          '**Todo lo que cae en el examen:** β, longitud de onda en la guía, velocidades de fase y de grupo, impedancia de onda, modo dominante y banda monomodo.',
          '**El campo dentro de la guía** dibujado en la sección, con ejemplos como la WR-90 de banda X y el **modo práctica**.',
          '#electromagnetismo/antena',
          '**Tres tipos de dipolo:** corto (Hertz), de media onda o de cualquier longitud hasta 3λ, con lóbulos laterales cuando es largo.',
          '**Diagrama de radiación polar** con el punto que tú eliges, y el círculo de la antena isótropa para compararlo.',
          '**Resistencia de radiación, potencia radiada, directividad (en dBi) y ancho de haz**, y el campo E, B y la densidad de potencia a la distancia que quieras.',
          '**Desarrollo paso a paso**, ejemplos listos y **modo práctica**.',
          '#electromagnetismo/imagenes',
          '**Cinco casos:** plano a tierra, esfera a tierra, esfera aislada (neutra o con carga) o a un potencial, y una carga dentro de una cavidad esférica.',
          '**Cargas imagen, fuerza y carga inducida:** su valor y posición, la fuerza sobre la carga, la densidad superficial σ y el trabajo para llevarla al infinito.',
          '**Potencial y campo en cualquier punto,** con el dibujo de las líneas de campo, la carga inducida sobre el conductor y el desarrollo paso a paso.',
          '**Modo práctica** con ejercicios al azar de cada caso.',
          '#electromagnetismo/laplace-numerica',
          '**Bordes y electrodo editables:** elige el potencial de cada uno de los cuatro lados de la caja y, si quieres, coloca un electrodo rectangular en su interior.',
          '**Mapa de color, equipotenciales y campo:** el potencial se pinta con un mapa de color, con sus líneas equipotenciales y las flechas del campo eléctrico.',
          '**Relajación a la vista:** compara Jacobi, Gauss-Seidel y SOR y mira cuántas vueltas necesita cada uno.',
          '**Sonda:** pulsa en el mapa para leer el potencial y el campo en cualquier punto, y compáralo con la solución exacta en serie.',
          '**Desarrollo paso a paso** y **modo práctica**.',
        ] },
        { icono: '🔌', titulo: 'Nuevas herramientas en Circuitos', puntos: [
          '#circuitos/bode',
          '**Ocho filtros:** RC y RL paso bajo y paso alto, y RLC en serie paso bajo, paso alto, paso banda y rechazo de banda.',
          '**Diagrama de Bode completo:** magnitud en dB y fase en grados, con las asíntotas y la frecuencia que tú elijas marcada.',
          '**Todos los datos del filtro:** frecuencia de corte o propia, factor de calidad Q, amortiguamiento, ancho de banda y pico de resonancia, con el **desarrollo paso a paso**.',
          'Admite valores como 4k7, 100n o 10 µF, y da lo mismo que el análisis en frecuencia del Simulador de circuitos.',
          '#circuitos/convolucion',
          '**Convolución animada:** elige dos señales (pulsos, escalón, exponencial, impulso) y mira cómo se refleja una, se desliza sobre la otra y el área del producto va dibujando la salida.',
          '**Señal y sistema:** pasa una entrada por un filtro RC, un RLC serie, una media móvil o un retardo.',
          '**Respuesta al escalón:** tiempo de subida, sobreoscilación y tiempo de establecimiento, con el desarrollo paso a paso.',
        ] },
        { icono: '🪐', titulo: 'Nuevas herramientas en Física general', puntos: [
          '#fisica/gravitacion',
          '**Gravitación y órbitas:** la fuerza entre dos masas, un satélite en órbita circular con su velocidad, periodo y energías, y la **velocidad de escape** de la Tierra, la Luna, Marte y más planetas.',
          'Dale el periodo y te dice **a qué altura orbita** (así sale la órbita geoestacionaria), o dale el semieje y la excentricidad y mira la **elipse de Kepler** con el periodo, el perihelio, el afelio y las velocidades en cada punto.',
          'Con la gráfica, el desarrollo paso a paso y **modo práctica**.',
          '#fisica/optica',
          '**Cuatro elementos:** lente convergente, lente divergente, espejo cóncavo y espejo convexo.',
          '**Diagrama de rayos** con los tres rayos principales y las prolongaciones virtuales, que se redibuja al cambiar la distancia focal o mover el objeto.',
          '**Todo lo que se pide en clase:** posición y altura de la imagen, aumento, si es real o virtual, derecha o invertida, potencia en dioptrías y radio del espejo, con el desarrollo paso a paso.',
          'Seis ejemplos (lupa, proyector, mirilla, espejo de afeitar, retrovisor…) y **modo práctica**.',
        ] },
        { icono: '✦', titulo: 'Nuevos fenómenos en Física en la vida real', puntos: [
          '#fenomenos/tension-paso',
          '**Paso a paso:** cómo se reparte la corriente por el suelo, cuánto baja el potencial al alejarte y qué tensión hay entre tus dos pies.',
          '**Pruébalo tú:** mueve el deslizador y mira cómo cae la corriente por tu cuerpo al alejarte del cable.',
          '**Se abre en Electrostática** con los datos del suelo ya puestos.',
          '#fenomenos/gps-relatividad',
          '**Seis pasos animados:** cómo tu móvil calcula su posición con la señal de los satélites, y por qué un error de una millonésima de segundo son 300 m.',
          '**Dos relatividades enfrentadas:** el reloj de un satélite se **atrasa 7,2 µs al día** por ir deprisa y se **adelanta 45,7 µs** por sentir menos gravedad; el saldo es de **+38,5 µs al día**.',
          '**«Pruébalo tú»:** cambia la velocidad del satélite o la altura de la órbita y mira cuándo gana cada efecto, y el mapa del error si no se corrigiera.',
          '#fenomenos/cielo-azul',
          '**Seis pasos animados:** cómo la luz blanca del Sol se dispersa en la atmósfera, por qué el azul se dispersa unas 6 veces más que el rojo y por qué el atardecer se vuelve rojo.',
          '**«Pruébalo tú»:** cambia la longitud de onda de la luz y mira cuánto más se dispersa el azul que el rojo. Se abre en Ondas electromagnéticas.',
          '#fenomenos/olla-presion',
          '**Por qué el agua hierve a 70 °C en el Everest** y a 121 °C en una olla a presión: la temperatura de ebullición depende de la presión.',
          '**«Pruébalo tú»:** cambia la altitud o la presión de la olla y mira a qué temperatura hierve el agua. Se abre en Calorimetría con los datos ya puestos.',
        ] },
        { icono: 'γ', titulo: 'Mejoras en Física moderna', puntos: [
          '#fisica/fisica-moderna',
          'La **dilatación del tiempo** muestra ahora la **diferencia entre los dos relojes**, aunque sea diminuta, y se abre desde el fenómeno con los datos del satélite.',
        ] },
      ] },
      { v: '1.5', fecha: '2026-11-01', titulo: 'Simulador de circuitos', subtitulo: 'Un solo simulador para continua y alterna, y las puertas lógicas ahora también desde ecuaciones.', secciones: [
        { icono: '🔌', titulo: 'Nueva herramienta en Circuitos', puntos: [
          '#circuitos/simulador',
          '**Editor de arrastrar y soltar:** pon resistencias, condensadores, bobinas, fuentes, transistores, operacionales, puertas lógicas y más (47 componentes), gíralos, refléjalos y únelos con cables.',
          '**Continua y alterna a la vez:** punto de operación, fasores, osciloscopio con la forma de onda completa y diagrama de Bode.',
          '**Instrumentos y trifásica:** amperímetro, voltímetro, vatímetro, sondas del osciloscopio y fuentes y cargas trifásicas.',
          '**Corriente animada** y cables coloreados según su tensión, **desarrollo paso a paso** cuando el circuito se puede resolver a mano y **modo práctica**.',
        ] },
        { icono: '🔌', titulo: 'Mejoras en Tablas de verdad y puertas lógicas', puntos: [
          '#circuitos/puertas-logicas',
          '**Desde las ecuaciones:** escribe una o varias ecuaciones (F = A·B + C\'), con paréntesis, NOT, AND, OR y XOR, y mira su tabla de verdad, los minitérminos y maxitérminos, y el circuito de puertas.',
          'El circuito sale **tal como lo escribiste** y, con «Simplificar», en suma de productos o producto de sumas.',
          'Botones para insertar los símbolos sin buscarlos en el teclado.',
        ] },
      ] },
      { v: '1.4.1', fecha: '2026-11-01', titulo: 'Puertas lógicas más fáciles', subtitulo: 'Un editor para arrastrar y unir puertas, y las ecuaciones primero normales y luego simplificadas.', secciones: [
        { icono: '🔌', titulo: 'Mejoras en Tablas de verdad y puertas lógicas', puntos: [
          '#circuitos/puertas-logicas',
          '**Editor gráfico:** arrastra las puertas al dibujo, muévelas y únelas con el ratón, de una salida a una entrada. Doble clic para marcar una puerta como salida.',
          '**Ecuaciones normales y simplificadas:** primero salen las formas canónicas (minitérminos y maxitérminos) y con el botón **Simplificar ecuaciones** aparecen las simplificadas y el circuito más pequeño.',
          '**Tablas más legibles:** una línea más gruesa separa las filas de 4 en 4.',
          'Un **botón en el circuito** cambia entre el de la suma de productos y el del producto de sumas.',
        ] },
      ] },
      { v: '1.4', fecha: '2026-11-01', titulo: 'Diez herramientas nuevas', subtitulo: 'Probabilidad, termoquímica, oscilaciones, teoría de juegos y mucho más, en cinco asignaturas.', secciones: [
        { icono: '🔌', titulo: 'Nueva herramienta en Circuitos', puntos: [
          '#circuitos/puertas-logicas',
          '**Desde la tabla de verdad:** rellena las salidas y obtén los minitérminos, los maxitérminos y la ecuación simplificada, con el mapa de Karnaugh y el circuito de puertas dibujado.',
          '**Desde las puertas:** añade AND, OR, NOT, NAND, NOR, XOR o XNOR, marca las salidas y mira la tabla de verdad y las ecuaciones de tu circuito.',
          'Casillas **indiferentes (X)**, hasta 5 variables y 4 salidas, y modo práctica con los minitérminos.',
        ] },
        { icono: '📈', titulo: 'Nueva herramienta en Economía', puntos: [
          '#economia/multiplicador',
          '**Multiplicador keynesiano:** la renta de equilibrio del modelo renta-gasto, con impuestos e importaciones.',
          'Los **multiplicadores del gasto, de los impuestos y del presupuesto equilibrado**, y las rondas en las que se reparte el efecto.',
          'Cuánto **gasto público** haría falta para cerrar la brecha con el pleno empleo.',
        ] },
        { icono: '📈', titulo: 'Nueva herramienta en Economía', puntos: [
          '#economia/is-lm',
          '**Modelo IS-LM:** las curvas IS y LM con su equilibrio, y qué pasa si el gobierno gasta más, baja impuestos o el banco central aumenta el dinero.',
          '**Multiplicadores y efecto expulsión**, con las curvas nuevas dibujadas junto a las antiguas.',
        ] },
        { icono: '🎱', titulo: 'Nueva herramienta en Física general', puntos: [
          '#fisica/choques',
          '**Choques y momento lineal:** elástico, inelástico con coeficiente de restitución o con los cuerpos pegados, en una dimensión o en dos.',
          'Velocidades finales, **momento lineal** y **energía perdida**, con el desarrollo paso a paso y un dibujo de antes y después.',
        ] },
        { icono: '🔥', titulo: 'Nueva herramienta en Química', puntos: [
          '#quimica/termoquimica',
          '**Entalpías de formación:** la ΔH de una reacción con una tabla de unas 60 sustancias, y el calor para los gramos que quieras.',
          '**Ley de Hess:** escribe las reacciones con su ΔH y la calculadora dice cuáles invertir o multiplicar.',
          '**Espontaneidad:** energía libre de Gibbs y temperatura de equilibrio.',
        ] },
        { icono: '🎲', titulo: 'Nueva herramienta en Estadística', puntos: [
          '#estadistica/probabilidad',
          '**Combinatoria:** variaciones, permutaciones y combinaciones, con y sin repetición, con el resultado exacto.',
          '**Sucesos:** unión, intersección, condicionada, independencia y leyes de De Morgan, con un diagrama de áreas.',
          '**Probabilidad total y Bayes:** hasta cuatro causas, el diagrama de árbol dibujado y modo práctica.',
        ] },
        { icono: '📏', titulo: 'Nueva herramienta en Física general', puntos: [
          '#fisica/unidades',
          '**Conversor de unidades:** 24 magnitudes, del metro al año luz y del julio al electronvoltio, con el desarrollo paso a paso y el valor en todas las unidades a la vez.',
          '**Constantes CODATA 2018** con buscador: c, h, e, ε₀, μ₀, la masa del electrón y muchas más.',
        ] },
        { icono: '⚗️', titulo: 'Nueva herramienta en Química', puntos: [
          '#quimica/equilibrio',
          '**Kc y Kp:** a partir de las concentraciones iniciales y la de equilibrio de una especie, con la tabla ICE paso a paso.',
          '**Concentraciones de equilibrio** con Kc, sea la ecuación de segundo grado o de más, y el grado de disociación.',
          '**Cociente de reacción Q:** compáralo con K y mira hacia dónde avanza la reacción.',
          '**Le Chatelier con números:** añade o quita una especie, cambia el volumen o la temperatura y obtén el nuevo equilibrio, con la gráfica de las concentraciones y modo práctica.',
        ] },
        { icono: '〰️', titulo: 'Nueva herramienta en Física general', puntos: [
          '#fisica/oscilaciones',
          '**Oscilaciones:** movimiento armónico simple de un muelle o un péndulo, oscilador amortiguado (subamortiguado, crítico y sobreamortiguado) y oscilador forzado con su resonancia, con la gráfica y el desarrollo paso a paso.',
        ] },
        { icono: '♟️', titulo: 'Nueva herramienta en Economía', puntos: [
          '#economia/teoria-juegos',
          '**Teoría de juegos:** escribe la matriz de pagos de un juego de dos jugadores y obtén los equilibrios de Nash (puros y mixtos), las estrategias dominantes y si el resultado es eficiente.',
          'Con **la gráfica de las mejores respuestas**, donde se cruzan los equilibrios, y ejemplos como el dilema del prisionero, la gallina o cara o cruz.',
        ] },
      ] },
      { v: '1.3.2', fecha: '2026-10-31', cambios: ['Quitada la franja oscura que se veía sobre la barra de arriba.', 'En el móvil, la portada vuelve a mostrar Novedades y Física en la vida real junto a las asignaturas.'] },
      { v: '1.3.1', fecha: '2026-10-31', cambios: ['La cabecera se ve más compacta en el móvil: logo, Foro y modo oscuro en una fila y el buscador debajo.'] },
      { v: '1.3', fecha: '2026-10-31', titulo: 'Nuevo aspecto: Liquid Glass', subtitulo: 'Cristal translúcido, esquinas redondeadas y fondos con color en toda la web.', secciones: [
        { icono: '🫧', titulo: 'Un diseño renovado', puntos: [
          '**Cabecera flotante de cristal** con buscador y botones redondeados, en todas las páginas.',
          '**Tarjetas, campos, botones y pestañas translúcidos** en las 68 herramientas y en Electrostática; las gráficas y las fórmulas se ven igual que antes.',
          '**Portada, asignaturas, novedades y foro** con fondos de color suaves y tarjetas que se elevan al pasar el ratón.',
          'Funciona en **modo claro, oscuro y móvil**, y si tu dispositivo pide menos transparencia o más contraste, la web vuelve a fondos sólidos.',
        ] },
      ] },
      { v: '1.2', fecha: '2026-10-31', titulo: 'Costes y beneficio de la empresa', subtitulo: 'Dos herramientas nuevas de Economía para ver cuánto cuesta producir y cuánto producir para ganar más.', secciones: [
        { icono: '🏭', titulo: 'Nuevas herramientas en Economía', puntos: [
          '#economia/costes',
          '#economia/beneficio',
          '**Costes de producción:** coste total, medio y marginal de una empresa, con su gráfica.',
          '**Maximización del beneficio:** la cantidad y el precio óptimos en competencia perfecta y en monopolio, con el precio de cierre, el índice de Lerner y la pérdida de eficiencia.',
        ] },
      ] },
      { v: '1.1', fecha: '2026-10-31', titulo: 'Sistemas de numeración', subtitulo: 'Pasa un número entre decimal, binario, complemento a 2, hexadecimal y BCD.', secciones: [
        { icono: '🔢', titulo: 'Nueva herramienta en Circuitos', puntos: [
          '**Sistemas de numeración:** escribe un número en cualquier sistema y míralo en todos los demás, con el desarrollo paso a paso.',
          '**Complemento a 2** con 4, 8, 16 o 32 bits, y aviso si el número no cabe.',
          'Los **bits con su peso** a la vista, y modo práctica para pasar a decimal.',
        ] },
      ] },
      { v: '1.0', fecha: '2026-10-28', titulo: 'Ciencify 1.0', subtitulo: '65 herramientas y 12 fenómenos para estudiar ciencias, gratis y sin registro.', secciones: [
        { icono: '🧭', titulo: 'Una web para toda la carrera', puntos: [
          '**Siete asignaturas:** Electromagnetismo, Física general, Química, Matemáticas, Estadística, Circuitos y Economía.',
          '**Un buscador** para encontrar cualquier herramienta al momento.',
          'Las herramientas que están por llegar aparecen ya como **«Próximamente»**.',
        ] },
        { icono: '🧰', titulo: 'Las herramientas', puntos: ['@electromagnetismo', '@fisica', '@quimica', '@matematicas', '@estadistica', '@circuitos', '@economia'] },
        { icono: '📐', titulo: 'Así funciona cada herramienta', puntos: [
          '**Resultados claros**, con su gráfica o animación.',
          '**El desarrollo paso a paso**, con las fórmulas escritas como en los libros.',
          '**Escribe como en clase:** coma decimal, potencias de diez y unidades como 4k7 o 10 µF.',
        ] },
        { icono: '📚', titulo: 'Para estudiar', puntos: [
          '**Mis ejercicios:** guarda tus ejercicios en carpetas, fija los importantes, abre los de ejemplo y expórtalos a un archivo.',
          '**Modo práctica:** un ejercicio con datos al azar que corrige tus respuestas y luego te enseña la solución.',
          '**Compartir**, en Matemáticas y Electromagnetismo: enlace al ejercicio, la solución en texto o en LaTeX, e imprimirla o guardarla en PDF.',
        ] },
        { icono: '⚡', titulo: 'Física en la vida real', puntos: [
          '**12 fenómenos que has visto alguna vez:** la chispa al tocar el pomo de la puerta, la jaula de Faraday (por qué no hay cobertura en el ascensor), el pájaro posado en un cable, la sirena de la ambulancia que pasa, tapar la manguera con el dedo o la rejilla del microondas. Y muy pronto, el rayo.',
          'Cada uno trae **una animación paso a paso**, un poco de historia, «Pruébalo tú», sonido opcional y la herramienta que lo calcula.',
        ] },
        { icono: '✨', titulo: 'Comodidad', puntos: [
          '**Modo claro y oscuro.**',
          '**Herramientas relacionadas** al final de cada herramienta.',
          '**Diseño pensado también para el móvil.**',
        ] },
      ] },
    ],
    control: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Dos pestañas nuevas: «Escalón», con la respuesta al escalón del lazo cerrado (valor final, error, tiempo de subida, sobreoscilación y establecimiento), y «Bode», con el diagrama de lazo abierto y los márgenes de fase y de ganancia.', 'Los errores de datos (ganancia 0, numerador de más grado que el denominador) se avisan igual en todas las pestañas, y las gráficas se pueden descargar en PNG o copiar sus datos.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: escribe la ganancia de lazo K·N(s)/D(s) (como expresión, s^2+3s+2, o con los coeficientes) y estudia la estabilidad de tres maneras: la tabla de Routh con el rango de K estable (con el cero en la primera columna y la fila de ceros), el lugar de las raíces con asíntotas, puntos de ruptura, ángulos de salida y cruces con el eje imaginario, y el diagrama de Nyquist con los márgenes de ganancia y de fase y el recuento de vueltas alrededor de −1. Con nueve ejemplos, desarrollo paso a paso y modo práctica.'] },
    ],
    'termo-estadistica': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Explica a la vista qué no cubre: las estadísticas de Fermi-Dirac y de Bose-Einstein y el modelo de Debye.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: cinco modos. Dos niveles (con degeneraciones), oscilador de Einstein, niveles propios (un rotor, un átomo…) con su función de partición, poblaciones de Boltzmann, energía, entropía, energía libre y capacidad calorífica, y la entropía S = k ln Ω de un sólido de Einstein y de dos sólidos que se reparten la energía, con su desarrollo paso a paso.'] },
    ],
    markowitz: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Dos activos con correlación +1 o −1 (con cartera sin riesgo y aviso de arbitraje); modo sin ventas en corto por defecto, indicado en los resultados; botón para usar la rentabilidad de la cartera tangente como objetivo.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: frontera eficiente de Markowitz con de 2 a 6 activos y su matriz de correlaciones (con o sin ventas en corto), cartera de mínima varianza, cartera tangente con ratio de Sharpe y línea del mercado de capitales, cartera para una rentabilidad objetivo, y CAPM con beta, rentabilidad exigida, alfa y línea del mercado de valores. Con tabla de pesos y desarrollo paso a paso.'] },
    ],
    cavidades: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Curva de resonancia con el factor de calidad y el acoplo, y descarga de la gráfica. Los campos admiten unidades.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: cavidades rectangulares, cilíndricas y esféricas de paredes conductoras. Frecuencia de resonancia de cualquier modo TE o TM, factor de calidad de las paredes y del dieléctrico, ancho de banda, tabla de los modos más bajos y mapa del campo eléctrico o magnético en el plano de corte que elijas. Con desarrollo paso a paso.'] },
    ],
    organica: [
      { v: '0.3', fecha: '2026-11-15', cambios: ['Anillos y benceno: la herramienta lee ciclos (ciclopropano a ciclododecano, con dobles enlaces) y el benceno con sus derivados, los nombra (ciclo o benceno como padre o como sustituyente, tolueno, fenol, anilina, ácido benzoico, orto, meta y para), saca el cis/trans y los estereoisómeros de un anillo, el R/S de sus centros, y los dibuja en 3D. Quedan fuera los heterociclos y las moléculas con más de un anillo.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Entrada con la fórmula semidesarrollada como se escribe en clase (CH₃-CH(OH)-CH₃), con botones para los grupos, además de SMILES; el resultado enseña también la fórmula semidesarrollada.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: escribe una molécula (cadenas con ramas, dobles y triples enlaces, alcoholes, aldehídos, cetonas, ácidos, ésteres, amidas, nitrilos, aminas, éteres y halógenos) y obtén su nombre IUPAC, los grupos funcionales, la fórmula y la masa molar. Marca los centros quirales (R/S) y los dobles enlaces E/Z con las reglas de Cahn-Ingold-Prelog, lista todos los estereoisómeros (enantiómeros, diastereoisómeros y formas meso) y las isomerías de cadena, posición y función. La molécula se ve en 3D con los hidrógenos y se gira con el ratón o el dedo. Con desarrollo paso a paso.'] },
    ],
    'transformada-z': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Nuevo modo «Transformada inversa» con la región de convergencia a elegir (causal, anticausal o bilateral), aviso de cancelaciones polo-cero y sistema nulo, FFT con relleno de ceros y pestaña de fase, y exportar las gráficas.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: transformada z de una señal o de un sistema (polos, ceros, estabilidad, respuesta al impulso y respuesta en frecuencia) y FFT con ventanas, picos, resolución y aliasing.'] },
    ],
    semiconductores: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Transistores pnp y de canal p, diodo Zener, pequeña señal, estabilidad térmica y casos extremos mejor avisados; las gráficas se pueden descargar o copiar.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: elige un diodo, un transistor BJT (polarización fija o por divisor de tensión) o un MOSFET, escribe el circuito (admite 4k7, 1M, 100n) y mira la recta de carga, el punto de trabajo Q sobre las curvas del dispositivo, la región en que trabaja (corte, activa, saturación o triodo), las tensiones y corrientes y el desarrollo paso a paso.'] },
    ],
    relatividad: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Casos límite explicados: velocidad cero, velocidades casi iguales a la de la luz y sucesos sobre el cono de luz.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: transformación de Lorentz de un evento con su diagrama de Minkowski (ejes inclinados de la nave y rayas paralelas para leer las coordenadas), suma y resta de velocidades con las rapideces e intervalo entre dos eventos con tiempo propio, distancia propia y causalidad. Con desarrollo paso a paso.'] },
    ],
    'osc-acopladas': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Casos de acoplo nulo (dos osciladores independientes) y de modos simétricos explicados en el desarrollo.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: dos masas con tres muelles, sus modos normales y frecuencias, la posición de cada masa en el tiempo según cómo las sueltes, el batido y el tiempo que tarda la energía en pasar de una masa a la otra. Con desarrollo paso a paso.'] },
    ],
    solubilidad: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['54 sales con su Kps, efecto del pH y de la formación de complejos sobre la solubilidad, y botón para llevar un hidróxido poco soluble a la herramienta de pH. La gráfica se descarga en PNG.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: Kps a partir de la solubilidad (en mol/L o g/L) y solubilidad a partir del Kps, efecto del ion común, ¿precipita al mezclar dos disoluciones? (con lo que queda disuelto y los gramos de precipitado) y precipitación fraccionada de dos sales. Con 15 sales de ejemplo, el desarrollo paso a paso y un diagrama logarítmico [catión]–[anión] con la recta de saturación.'] },
    ],
    lagrange: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Trata los casos singulares: función objetivo constante y puntos donde el gradiente de la restricción se anula.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: extremos de f(x, y) o f(x, y, z) con una restricción g = c. Plantea ∇f = λ∇g, halla los puntos críticos con su λ, dice si cada uno es máximo, mínimo o de silla y dibuja las curvas de nivel con la restricción.'] },
    ],
    series: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['Criterio de la integral: busca la primitiva, calcula la integral impropia y decide series como Σ 1/(n ln n) o Σ 1/(n ln² n), que antes quedaban sin decidir.', 'Si no hay primitiva elemental, la integral se estima numéricamente y se avisa de que es una estimación.', 'La suma de las series que convergen muy despacio se da con el resto encerrado entre dos integrales.', 'Si la serie es un desarrollo de Taylor conocido (geométrica, exponencial), un botón la abre en Taylor para ver la suma como límite de los polinomios.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Conclusiones más cuidadas en los casos dudosos, como las series p con exponente muy cercano a 1.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: dice si una serie numérica converge o diverge con la condición necesaria, la serie geométrica y la serie p, los criterios del cociente, de la raíz, de comparación y de Leibniz, la convergencia absoluta o condicional, la suma y las sumas parciales dibujadas.'] },
    ],
    'no-parametricos': [
      { v: '0.3', fecha: '2026-11-10', cambios: ['«Usar en…»: los grupos de Kruskal-Wallis en el ANOVA y la muestra de Wilcoxon en Estadística descriptiva.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Kruskal-Wallis con las comparaciones de Dunn, test de los signos, correlaciones de Spearman y de Kendall, tamaño del efecto y estimador de Hodges-Lehmann.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: U de Mann-Whitney para dos muestras independientes y test de Wilcoxon de los rangos con signo, para datos apareados o para la mediana de una muestra, bilaterales o unilaterales. Da la tabla de rangos (con la media de los rangos en los empates), el p-valor exacto si hay pocos datos y no hay empates o por aproximación normal con la corrección de empates y de continuidad, la gráfica y la conclusión paso a paso. Con 4 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    'regresion-multiple': [
      { v: '0.2', fecha: '2026-11-10', cambios: ['Los datos casi colineales (como los clásicos de Longley, con VIF de más de 1000) ya se calculan bien: antes se rechazaban como multicolinealidad perfecta.', 'Paso nuevo de multicolinealidad con el VIF de cada variable y un aviso cuando es fuerte.', 'Dos ejemplos clásicos: las pérdidas de una planta química (stack loss) y el empleo de Longley.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: regresión lineal con hasta 6 variables explicativas por mínimos cuadrados, con los datos pegados desde una hoja de cálculo. Da el plano ajustado, los coeficientes con su error típico, t, p-valor e intervalo de confianza, R² y R² ajustado, el contraste F global con la tabla ANOVA, el VIF para detectar multicolinealidad, los valores observados frente a ajustados y una predicción con el intervalo de la media y el de un valor individual, paso a paso. Con 3 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    anova: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['«Usar en…»: los mismos grupos en Kruskal-Wallis y todos los datos juntos en Estadística descriptiva.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['ANOVA de dos factores (con y sin interacción), comparaciones por parejas de Tukey, Holm, Scheffé y Games-Howell además de Bonferroni, ANOVA de Welch para varianzas distintas, comprobación de los supuestos, tamaño del efecto ω² y contrastes planificados.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: ANOVA de un factor para comparar las medias de dos o más grupos escritos uno por línea. Da la tabla ANOVA (entre y dentro de los grupos), F con su valor crítico y p-valor, el tamaño del efecto η², las medias y varianzas de cada grupo, las comparaciones por parejas con la corrección de Bonferroni, la gráfica de los datos y el desarrollo paso a paso. Con 3 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    'black-scholes': [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Casos límite (vencimiento o volatilidad cero) y volatilidad implícita a partir del precio de mercado de la opción.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: precio de una call y una put europeas con la fórmula de Black-Scholes (con dividendo), d₁ y d₂, comprobación de la paridad call-put y las griegas (delta, gamma, vega, theta y rho), con la gráfica del valor de la opción hoy y al vencimiento y el desarrollo paso a paso.'] },
    ],
    bonos: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Más cálculos de bonos con su gráfica y mejor desarrollo paso a paso.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: precio de un bono con cupón anual, semestral, trimestral o mensual a partir de la TIR (o la TIR a partir del precio), rentabilidad corriente, duración de Macaulay y modificada, convexidad y variación del precio al cambiar los tipos, con la curva precio-TIR, la tabla de flujos y el desarrollo paso a paso.'] },
    ],
    solow: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Gráfica del modelo con la senda del capital y el estado estacionario, y más ejemplos.'] },
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: estado estacionario, regla de oro, velocidad de convergencia y semivida, y trayectoria del capital desde el valor inicial en el modelo de Solow con función Cobb-Douglas, con el diagrama de Solow, la tabla año a año y el desarrollo paso a paso.'] },
    ],
    'integrales-multiples': [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: integrales dobles (en cartesianas, con dy dx o dx dy, y en polares) y triples (en cartesianas, cilíndricas y esféricas) sobre la región que escribas con sus límites, de fuera adentro. Dibuja la región o el sólido en perspectiva, que se gira arrastrando; escribe el cambio de variables con su jacobiano, el integrando transformado y cada integral iterada de dentro afuera con su primitiva (y la numérica si alguna no sale), y da el valor exacto, el área o volumen de la región y el valor medio. Con 13 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    formulacion: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Compuestos de coordinación ([Cu(NH₃)₄]SO₄, K₃[Fe(CN)₆]…) con estado de oxidación, número de coordinación y geometría; hidratos (CuSO₄·5H₂O); más de 40 compuestos con nombre propio y los prefijos meta, orto y piro.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe una fórmula y obtén su nombre, o escribe un nombre y obtén su fórmula, en nomenclatura sistemática, de Stock y tradicional. Reconoce óxidos, peróxidos, hidruros, hidróxidos, hidrácidos, oxoácidos, sales binarias, oxisales, sales ácidas y compuestos entre no metales (casi 3.000 compuestos), con el desarrollo paso a paso (tipo de compuesto, estados de oxidación y cruce de cargas), sugerencias si te equivocas, ejemplos, tabla de oxoácidos, modo práctica y enlace para compartir.'] },
    ],
    balance: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Botones para llevar los datos a otras herramientas.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: la cuenta de pérdidas y ganancias (EBITDA, resultado de explotación, financiero, BAI, impuesto y resultado del ejercicio) y el balance de situación con el resultado dentro del patrimonio neto, comprobando que cuadra, el fondo de maniobra y el balance dibujado en dos columnas, con cuatro ejemplos, desarrollo paso a paso y modo práctica.'] },
    ],
    redox: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Pestañas nuevas: «Pilas y Nernst» (potencial de la pila, ΔG°, K, ecuación de Nernst, puente salino y sentido de los electrones) y «Electrólisis» (leyes de Faraday: masa, tiempo, volumen de gas y orden de descarga), con tabla de potenciales estándar.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: ajusta reacciones redox por el método del ion-electrón en medio ácido o básico, con los números de oxidación, las dos semirreacciones (elemento, oxígeno con H₂O, hidrógeno con H⁺ y carga con electrones), la igualación de electrones, la suma, el paso a medio básico con OH⁻ y la comprobación átomo a átomo, con una gráfica del cambio de número de oxidación y diez reacciones de ejemplo.'] },
    ],
    'lineas-transmision': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Líneas con pérdidas, transitorios con reflexiones, adaptación con stub en serie y con doble stub, anchos de banda y lectura de la carta de Smith.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: línea de transmisión sin pérdidas con una carga R + jX: coeficiente de reflexión, ROE, pérdida de retorno, impedancia de entrada, máximos y mínimos de tensión y adaptación con un stub en paralelo (en cortocircuito o en abierto) o con un transformador λ/4. Con la carta de Smith dibujada (círculo de ROE y recorrido hacia el generador), el perfil de la onda estacionaria, el desarrollo paso a paso, ejemplos y modo práctica.'] },
    ],
    superficies: [
      { v: '0.2', fecha: '2026-11-10', cambios: ['Puntos sin derivada: el vértice de un cono o la arista de un valor absoluto se clasifican como mínimo, máximo o ninguno comparando la función alrededor.', 'Avisa de los puntos críticos que quedan fuera del rango dibujado.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe una función de dos variables z = f(x, y) y mírala como una superficie 3D que se gira arrastrando (con rueda para acercar y flechas del teclado) y como un mapa de curvas de nivel, que también se proyecta en el suelo.', 'Elige un punto, o púlsalo en el mapa: sale el gradiente y su módulo, el plano tangente con su normal, la tangente a la curva de nivel, la derivada direccional en la dirección que quieras y la aproximación lineal con su error.', 'Los puntos críticos del rango, clasificados con el hessiano como mínimo, máximo o punto de silla.', 'Desarrollo paso a paso, 8 ejemplos (paraboloide, silla, cono, campana de Gauss, huevera…) y modo práctica con ejercicios al azar.'] },
    ],
    vsepr: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Estructura de Lewis con cargas formales, resonancia, orden de enlace y octeto expandido o limitado, y moléculas con varios átomos centrales (etanol, ácido acético, eteno…).'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe una molécula o un ion (H2O, SF4, NH4+, SO4 2-…) o elige un tipo AXₙEₘ y mira sus dominios de electrones, geometría electrónica y molecular, ángulos de enlace, hibridación y polaridad, paso a paso, con la molécula en 3D que se gira con el ratón, el dedo o el teclado (pares libres y momento dipolar incluidos), 22 ejemplos, la tabla de las 14 geometrías y modo práctica.'] },
    ],
    maxwell: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Nuevo modo «¿Este campo cumple las ecuaciones?»: escribe E y B como expresiones y comprueba divergencias y rotacionales exactos.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: las cuatro ecuaciones de Maxwell en forma integral y diferencial con su significado y enlaces a los simuladores de Electromagnetismo, y una calculadora paso a paso para cada una: ley de Gauss (flujo y campo de una esfera cargada, dentro y fuera), Gauss para B (flujo por un cubo), Faraday (fem de una bobina), Ampère–Maxwell (corriente de desplazamiento y campo B en un condensador) y la velocidad de la luz con la onda plana, con gráfica, modo práctica y enlace para compartir.'] },
    ],
    fresnel: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Capas delgadas (antirreflejantes y multicapa) y gráficas de R, T y de la fase frente al ángulo.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: una onda plana llega con un ángulo a la frontera entre dos medios (por índices n o por εr y μr) y salen el ángulo de refracción, los coeficientes de reflexión y transmisión de las polarizaciones TE y TM, las reflectancias y transmitancias, el ángulo de Brewster, el ángulo crítico y, en la reflexión total, los desfases y la profundidad de la onda evanescente, con el desarrollo paso a paso, el dibujo de los rayos y la gráfica de la reflectancia según el ángulo.'] },
    ],
    gravitacion: [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Botón «Usar en…» para llevar la velocidad orbital o de escape a Física moderna y ver cuánto se atrasa un reloj a esa velocidad.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: calcula la fuerza de atracción entre dos masas, la velocidad, el periodo y la energía de un satélite en órbita circular, la velocidad de escape, la órbita que corresponde a un periodo (geoestacionaria) y las leyes de Kepler en una órbita elíptica con la elipse dibujada, con el desarrollo paso a paso y modo práctica.'] },
    ],
    convolucion: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Nuevo modo «Discreta» (secuencias x[n] y h[n] con tabla de la suma), filtros RL, RC paso alto y RLC paso banda, y exportar las gráficas.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: refleja y desliza dos señales (pulsos rectangulares, triangulares y senoidales, escalón, exponencial e impulso) y mira cómo se dibuja su convolución, animada o moviendo el instante a mano.', 'Señal y sistema: pasa una entrada por un filtro RC, un RLC serie, una media móvil o un retardo y obtén la respuesta al escalón con el tiempo de subida, la sobreoscilación y el tiempo de establecimiento.', 'Desarrollo paso a paso con la solución exacta de los casos de clase y la comprobación con las áreas, ejemplos y modo práctica.'] },
    ],
    'laplace-numerica': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Ecuación de Poisson con densidad de carga, bordes aislantes, hasta tres electrodos circulares, cargas, capacidad, energía y comparación de métodos.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: fija el potencial de los cuatro bordes de una caja (y de un electrodo interior) y resuelve la ecuación de Laplace por relajación con Jacobi, Gauss-Seidel o SOR; muestra el mapa de color, las equipotenciales, el campo eléctrico y una sonda movible con el potencial y el campo en cualquier punto, el desarrollo paso a paso, la comparación con la solución exacta en serie y el modo práctica.'] },
    ],
    imagenes: [
      { v: '0.2.1', fecha: '2026-11-15', cambios: ['La constante ε₀ es la misma que en el resto de Electromagnetismo (CODATA 2018).'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Cuña conductora de ángulo π/n, planos paralelos, varias cargas y dipolo frente a un plano.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: una carga puntual frente a un plano conductor a tierra, una esfera conductora (a tierra, aislada con una carga Q o a un potencial V₀) o dentro de una cavidad esférica, con la carga imagen y su posición, la fuerza sobre la carga, la carga inducida y su densidad superficial σ, el trabajo para llevarla al infinito y el potencial y el campo en un punto.', 'Dibujo con las líneas de campo, las cargas imagen y la carga inducida sobre el conductor, y modo práctica con enunciado.'] },
    ],
    'guias-onda': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Guía circular (modos TE y TM), cierre de la guía en una cavidad y botón «Abrir en Cavidades».'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: modos TE y TM de una guía de onda rectangular (vacía o rellena de dieléctrico): frecuencia y longitud de onda de corte, constante de fase, longitud de onda en la guía, velocidades de fase y de grupo, impedancia de onda o atenuación si no se propaga, modo dominante y banda monomodo, con el campo eléctrico del modo dibujado en la sección, desarrollo paso a paso y modo práctica.'] },
    ],
    antena: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Nuevos arrays de antenas con su diagrama, vista 3D del diagrama de radiación (con alternativa plana y descripción en texto), enlace de Friis y descarga de la gráfica como imagen. Los campos admiten unidades.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: dipolo corto, de media onda o de longitud cualquiera, con diagrama de radiación polar, resistencia de radiación, potencia radiada, directividad, ancho de haz y campo lejano, paso a paso.'] },
    ],
    bode: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Los filtros de factor de calidad alto (Q grande) ya no pierden el pico de resonancia ni la frecuencia de corte: la rejilla se afina sola alrededor de ella. Las dos gráficas llevan «Descargar PNG» y «Copiar datos».'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: elige un filtro RC, RL o RLC (paso bajo, paso alto, paso banda o rechazo de banda), escribe R, L y C (admite 4k7, 100n, 10 µF) y obtén su diagrama de Bode de magnitud y fase con las asíntotas, la frecuencia de corte, el factor de calidad Q, el ancho de banda, el pico de resonancia y el desarrollo paso a paso.'] },
    ],
    optica: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Sistemas de varias lentes: imagen intermedia que hace de objeto (también virtual), lente equivalente y microscopio, comprobados con matrices de rayos.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: elige una lente (convergente o divergente) o un espejo (cóncavo o convexo), la distancia focal y el objeto, y mira el diagrama de rayos con la imagen, su posición, el aumento, si es real o virtual y derecha o invertida, la potencia en dioptrías o el radio del espejo, paso a paso. Con seis ejemplos y modo práctica.'] },
    ],
    simulador: [
      { v: '0.4', fecha: '2026-11-08', cambios: ['Seis ejemplos nuevos, el barrido se afina solo cerca de las resonancias (el Bode no pierde el pico) y las gráficas se pueden descargar en PNG o copiar sus datos.'] },
      { v: '0.3', fecha: '2026-11-02', cambios: ['Nueva pestaña «Barrido»: elige un valor del circuito (una resistencia, un condensador, la amplitud o la frecuencia de una fuente…), un rango en escala lineal o logarítmica y lo que quieres medir (tensión, corriente o potencia de un componente, o la tensión de un nudo), en continua o en alterna con valores eficaces, y sale la gráfica con el máximo y el mínimo marcados y una tabla.', 'La pestaña Thévenin y Norton dibuja ahora la potencia que recibe una carga según su valor, con el máximo marcado cuando la carga vale R<sub>Th</sub>.'] },
      { v: '0.2', fecha: '2026-11-02', cambios: ['Importar y exportar redes en texto tipo SPICE: el botón «SPICE» escribe la red del esquema (R, C, L, fuentes de continua, seno y pulso, fuentes controladas, bobinas acopladas, diodos, transistores) o dibuja la que pegues o abras de un archivo .cir, con avisos de lo que no se puede traducir.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: dibuja el circuito arrastrando componentes (resistencias, condensadores, bobinas, fuentes de continua y de alterna, diodos, transistores, operacionales, transformadores, trifásica y puertas lógicas), únelos con cables y mira tensiones, corrientes, fasores, osciloscopio y diagrama de Bode.'] },
    ],
    'teoria-juegos': [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Matrices 3 × 3: equilibrios de Nash en estrategias puras y eliminación iterativa de estrategias dominadas, ronda a ronda, con ejemplos (incluido piedra, papel o tijera).'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe la matriz de pagos de un juego de dos jugadores con dos estrategias y obtén las mejores respuestas, las estrategias dominantes, los equilibrios de Nash puros y mixtos, la eficiencia de Pareto y el tipo de juego (dilema del prisionero, coordinación, gallina…), con la gráfica de las curvas de mejor respuesta y el desarrollo paso a paso.'] },
    ],
    'puertas-logicas': [
      { v: '0.4', fecha: '2026-11-08', cambios: ['Cada salida muestra ahora cómo hacerla solo con puertas NAND o solo con NOR, cuántas puertas hacen falta y si la suma de productos tiene riesgos estáticos (glitches) con el término de consenso que los evita.', 'Nueva sección de lógica secuencial: tablas características y de excitación de los biestables D, T, JK y SR, contador síncrono de 1 a 4 bits con sus ecuaciones de entrada y pulsos de reloj.'] },
      { v: '0.3', fecha: '2026-11-01', cambios: ['Nuevo modo «Ecuaciones»: se escriben ecuaciones booleanas (con NOT, AND, OR, XOR, paréntesis y varias salidas) y salen la tabla de verdad, los minitérminos y maxitérminos, el mapa de Karnaugh y el circuito de puertas, tal como está escrito o simplificado.', 'Los modos pasan a llamarse Tabla, Puertas y Ecuaciones.'] },
      { v: '0.2', fecha: '2026-11-01', cambios: ['Editor gráfico de puertas: se arrastran desde la paleta, se mueven y se unen con el ratón (el cable suelto en el vacío se quita; doble clic marca la salida), con las puertas en cualquier orden.', 'Las ecuaciones salen primero en forma canónica y el botón «Simplificar ecuaciones» añade las simplificadas y el circuito más pequeño.', 'Las tablas de verdad llevan una línea más gruesa cada 4 filas.', 'Un botón en el circuito cambia entre la suma de productos y el producto de sumas.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: dos modos. Desde la tabla de verdad (1 a 5 variables, hasta 4 salidas y casillas indiferentes X) da los minitérminos Σm, los maxitérminos ΠM, las formas canónicas y la forma simplificada por Quine-McCluskey en suma de productos y en producto de sumas, con el mapa de Karnaugh y el circuito de puertas dibujado. Desde las puertas (AND, OR, NOT, NAND, NOR, XOR y XNOR de 2 a 4 entradas) da la ecuación de cada puerta, la tabla de verdad con todas las puertas y las mismas ecuaciones. Con ejemplos (mayoría, semisumador, sumador completo, primos en BCD, multiplexor y XOR con NAND), desarrollo paso a paso y botón para copiar las ecuaciones.'] },
    ],
    multiplicador: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'Botón «Usar en…» para llevar el modelo (sin impuestos proporcionales ni exterior) a IS-LM.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Más ejemplos.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: renta de equilibrio del modelo renta-gasto con impuestos e importaciones, multiplicador del gasto, de los impuestos fijos y del presupuesto equilibrado, efecto de un cambio de gasto o de impuestos con sus rondas, brecha con el pleno empleo y la cruz keynesiana, con el desarrollo paso a paso.'] },
    ],
    'is-lm': [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Casos clásico y keynesiano con aviso de la eficacia de cada política.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: curvas IS y LM, renta y tipo de interés de equilibrio, y el efecto de subir el gasto, bajar impuestos o aumentar el dinero (multiplicadores y efecto expulsión), con la gráfica y el desarrollo paso a paso.'] },
    ],
    choques: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: choques elásticos, inelásticos (con coeficiente de restitución) y perfectamente inelásticos de dos cuerpos, en una dimensión o en dos con la normal del choque.', 'Velocidades finales, momento lineal total y energía cinética perdida, con el desarrollo paso a paso.', 'Dibujo de los dos cuerpos antes y después, con sus velocidades.', 'Ejemplos de choque elástico, coches pegados, inelástico y billar, y modo práctica con enunciado escrito.'] },
    ],
    termoquimica: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Entropías S° y energías de Gibbs de formación: ΔS°, ΔG° y temperatura de equilibrio; ciclo de Born-Haber; y botón «Calcular K en Equilibrio» que lleva la reacción y su ΔG°.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: entalpía de una reacción a partir de las entalpías de formación (con una tabla de unas 60 sustancias y calor para una masa dada), ley de Hess que calcula por cuánto hay que multiplicar o dar la vuelta a cada reacción, y energía libre de Gibbs con la temperatura de equilibrio, con el diagrama de entalpías y el desarrollo paso a paso.'] },
    ],
    probabilidad: [
      { v: '0.2', fecha: '2026-11-10', cambios: ['Variable aleatoria discreta: con la tabla de valores y probabilidades salen la esperanza, la varianza, la desviación típica, la función de distribución F(x), las probabilidades en un punto y el cambio Y = aX + b; si falta una probabilidad, se calcula para que sumen 1.', 'Tabla 2 × 2 de dos sucesos: con los casos (o las probabilidades) de cada casilla da los totales, la unión, la intersección, las condicionadas y si son independientes.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: combinatoria (variaciones, permutaciones y combinaciones, con o sin repetición), probabilidad de la unión, la intersección y la condicionada de dos sucesos, y probabilidad total con el teorema de Bayes y su diagrama de árbol.'] },
    ],
    unidades: [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Las constantes pasan a la edición CODATA 2022, con la de 2018 como opción para comparar con apuntes y solucionarios antiguos.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: convierte un valor entre las unidades de 24 magnitudes (longitud, masa, tiempo, velocidad, presión, energía, potencia, temperatura, carga, campo eléctrico y magnético…), con el desarrollo paso a paso por la unidad base del SI y el factor directo, el valor en todas las unidades a la vez y un botón para intercambiarlas. Incluye la tabla de constantes físicas CODATA 2018 con buscador.'] },
    ],
    equilibrio: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Fases (s), (l), (g) y (aq), sin sólidos ni líquidos puros en K; K a partir de ΔG°; dos equilibrios acoplados; gráfica de Q frente al avance, que se descarga en PNG; y ajuste de constantes «de clase» o exactas.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: Kc y Kp a partir de un equilibrio medido, concentraciones de equilibrio con la tabla ICE (para cualquier grado, no solo segundo), cociente de reacción Q frente a K y Le Chatelier con números (añadir o quitar una especie, cambiar el volumen o la temperatura con Van\'t Hoff, gas inerte y catalizador), con la gráfica de las concentraciones y modo práctica.'] },
    ],
    oscilaciones: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: movimiento armónico simple de una masa en un muelle o un péndulo (periodo, velocidad y aceleración máximas, energía, posición en un instante y periodo exacto del péndulo), oscilador amortiguado (subamortiguado, crítico y sobreamortiguado, con factor de calidad y decremento logarítmico) y oscilador forzado con su amplitud, desfase y resonancia, con la gráfica y el desarrollo.'] },
    ],
    beneficio: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Competencia perfecta con el coste cúbico de Costes de producción: cantidad óptima, regla de cierre y precio de beneficio nulo.'] },
      { v: '0.1', fecha: '2026-10-31', cambios: ['Primera versión: cantidad y precio que maximizan el beneficio en competencia perfecta (precio de cierre y de beneficio nulo) y en monopolio (índice de Lerner, comparación con la competencia y pérdida de eficiencia), con la gráfica de ingreso marginal, coste marginal y coste medio.'] },
    ],
    costes: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Se puede partir del coste marginal, y hay más ejemplos.'] },
      { v: '0.1', fecha: '2026-10-31', cambios: ['Primera versión: a partir de la función de costes con costes fijos y términos de primer, segundo y tercer grado, el coste variable, total, medio (fijo, variable y total) y marginal de una producción, el mínimo de explotación (precio de cierre) y el óptimo de explotación (umbral de rentabilidad), con la gráfica de las curvas.'] },
    ],
    'sistemas-numericos': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Nuevos modos: fracciones con coma (con expansión periódica), coma flotante IEEE 754 de 32 y 64 bits, y suma y resta en complemento a 2 con acarreos y desbordamiento; además octal y código Gray.'] },
      { v: '0.1', fecha: '2026-10-31', cambios: ['Primera versión: pasa un número entero entre decimal, binario, complemento a 2 (4, 8, 16 o 32 bits), hexadecimal y BCD, con el desarrollo paso a paso (divisiones entre 2, grupos de 4 bits, invertir y sumar 1), los bits con su peso y ejemplos de cada sistema.'] },
    ],
    excedentes: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Curvas inversas y por dos puntos, e impuesto ad valorem.'] },
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: el excedente del consumidor y del productor en el equilibrio y lo que pasa con un impuesto o una subvención por unidad o con un precio máximo o mínimo: los precios, la recaudación o el gasto, quién soporta el impuesto y la pérdida irrecuperable de eficiencia, sombreados en la gráfica.'] },
    ],
    'oferta-demanda': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Curvas dadas por dos puntos o en forma inversa, y botones para llevar el equilibrio a otras herramientas.'] },
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: el precio y la cantidad de equilibrio con una demanda y una oferta lineales, las elasticidades en ese punto, la escasez o el excedente de un precio máximo o mínimo y el nuevo equilibrio cuando se desplaza la demanda, la oferta o las dos, con la gráfica y el desarrollo.'] },
    ],
    'chi2-bondad': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Test exacto de Fisher, test de McNemar para datos apareados y residuos de cada casilla para ver cuáles se apartan de lo esperado.'] },
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: bondad de ajuste a una distribución uniforme, a unas proporciones dadas o a una binomial, Poisson o normal (con los parámetros dados o estimados de los datos), juntando las clases con frecuencia esperada menor que 5; y tablas de contingencia para la independencia o la homogeneidad, con la corrección de Yates y la V de Cramér. Con la tabla de esperadas, la gráfica y el desarrollo.'] },
    ],
    contrastes: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Potencia del contraste y tamaño del efecto, datos escritos en lista, muestras apareadas, comprobación de la normalidad y comparación de varias varianzas. Las gráficas se descargan en PNG y sus datos se copian.'] },
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: contrastes de una media (z o t de Student), una proporción, una varianza, dos medias (también con Welch), dos proporciones y dos varianzas, bilaterales o unilaterales, con el estadístico, la región crítica sombreada en la gráfica, el p-valor y la conclusión paso a paso.'] },
    ],
    errores: [
      { v: '0.2', fecha: '2026-11-10', cambios: ['Variables correlacionadas: con el coeficiente de correlación o la covarianza de cada par se añade el término cruzado, y se ve cuánto cambia el error respecto a suponerlas independientes.', 'Media ponderada de varias medidas de lo mismo, con pesos 1/σ², su incertidumbre y el χ² reducido, que dice si son compatibles entre sí.', 'Comparación con el valor aceptado: la discrepancia, cuántas σ son y si el resultado es compatible, dudoso o incompatible.'] },
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: la incertidumbre de una magnitud calculada con las derivadas parciales (suma cuadrática o cota lineal), el error relativo, lo que pesa cada medida y el resultado redondeado como en el laboratorio; también el error de una serie de medidas repetidas.'] },
    ],
    graficador: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Estudio completo de funciones con valor absoluto, y descarga de la gráfica en PNG con sus datos.'] },
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: dibuja hasta tres funciones a la vez, se mueve arrastrando y se acerca con la rueda o los botones, y da el dominio, los cortes con los ejes, las asíntotas, los máximos y mínimos y la inflexión de f, los cortes entre las curvas y una tabla de valores, con el desarrollo.'] },
    ],
    'metodos-numericos': [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Avisa cuando Newton converge despacio por una raíz doble y cuando el método de Euler se vuelve inestable por un paso demasiado grande.', 'Arreglo: una tolerancia más pequeña que la precisión del ordenador (como 1e-320) se avisa en vez de mostrar «Infinity iteraciones».'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: raíces de ecuaciones por bisección, Newton-Raphson, secante y punto fijo; integrales por trapecios y Simpson; y ecuaciones diferenciales por Euler, Heun y Runge-Kutta 4, con la tabla de iteraciones, una gráfica de lo que hace cada método y el desarrollo.'] },
    ],
    'fisica-moderna': [
      { v: '0.2', fecha: '2026-11-01', cambios: ['Dilatación del tiempo: muestra la diferencia entre los dos relojes (γ − 1 y Δt − Δt₀), también con velocidades pequeñas, y se abre desde «El GPS y la relatividad».'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: efecto fotoeléctrico (energía del fotón, trabajo de extracción de varios metales, energía cinética y velocidad máximas, potencial de frenado y umbral), longitud de onda de De Broglie, dilatación del tiempo, contracción de longitudes y energía y momento relativistas, con su gráfica y el desarrollo.'] },
    ],
    'lorenz-gini': [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'Se puede comparar con una segunda distribución en la misma gráfica: el Gini de cada una, los extremos y si una curva de Lorenz queda siempre por encima o se cruzan.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: la curva de Lorenz y el índice de Gini a partir de las rentas de cada persona, de tramos de renta o de quintiles, por el área y con la fórmula de clase, con lo que se lleva el 20 % más pobre y el más rico (S80/S20), la tabla y el desarrollo.'] },
    ],
    'phillips-okun': [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Las curvas de Phillips y de Okun llevan ahora su rótulo y su explicación.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: la ley de Okun (el paro con un crecimiento o el crecimiento para bajar el paro), la brecha de producción con el paro natural, la curva de Phillips con expectativas y shocks de oferta (estanflación) y el ajuste de una curva de Phillips a datos de paro e inflación, con la gráfica y el desarrollo.'] },
    ],
    'tipos-cambio': [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Paridad de los tipos de interés: tipo a plazo, prima o descuento, paridad descubierta y arbitraje con el tipo a plazo de mercado.', 'Aviso de que los tipos de los ejemplos son ilustrativos.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: cambiar euros por dólares, libras, yenes y otras monedas (y al revés) con comisión, el tipo de cambio cruzado, la apreciación o depreciación del euro, la paridad del poder adquisitivo con el tipo de cambio real (como el índice Big Mac) y la PPA relativa con la inflación de los dos países, con su gráfica y el desarrollo.'] },
    ],
    elasticidades: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Elasticidad de la oferta y curva isoelástica.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: elasticidad precio de la demanda, renta y cruzada entre dos situaciones, sobre el valor inicial y de arco, con su clasificación y el efecto sobre el ingreso total, y la elasticidad en un punto de una demanda lineal con el precio que hace máximo el ingreso, con la gráfica.'] },
    ],
    'pib-ipc': [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'Botón «Usar en…» para ver el PIB real como número índice.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: PIB nominal y real de una economía con varios bienes y años, deflactor, crecimiento real e inflación; deflactar una serie con el IPC para tenerla en euros constantes; y los agregados de la contabilidad nacional del PIB a la renta nacional, con gráfica y tabla.'] },
    ],
    'numeros-indice': [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'Nuevo modo «Empalmar dos series con bases distintas»: el coeficiente de empalme, la serie unida en la base que elijas y su gráfica.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: índices simples de una serie con la base que elijas (cambio de base), tasas de variación, tasa acumulada y tasa media acumulativa, e índices de precios de Laspeyres, Paasche y Fisher, de cantidades y de valor de una cesta de productos, con la gráfica y la tabla.'] },
    ],
    ratios: [
      { v: '0.2', fecha: '2026-11-08', cambios: ['Comparar dos empresas o dos años ratio a ratio.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: a partir del balance y la cuenta de resultados, el fondo de maniobra, los ratios de liquidez, tesorería, disponibilidad, garantía, endeudamiento, autonomía y calidad de la deuda con su valor recomendado y su valoración, la rentabilidad económica (margen por rotación), la financiera y el apalancamiento, con el balance dibujado.'] },
    ],
    'punto-muerto': [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'Varios productos con su mezcla de ventas (margen medio ponderado y punto muerto de cada uno) y una tabla de sensibilidad del punto muerto y el beneficio al cambiar precio, coste variable o costes fijos un 10 y un 20 %.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: punto muerto en unidades y en euros, margen de contribución, beneficio con las ventas previstas, margen de seguridad, apalancamiento operativo y ventas para un beneficio objetivo, con la gráfica de ingresos y costes.'] },
    ],
    ahorro: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Fase de retirada: cuánto dura el dinero y la retirada máxima sostenible.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: plan de ahorro con capital inicial y aportaciones mensuales, trimestrales o anuales (también subiendo con la inflación), saldo final en euros de entonces y de hoy, tipo real de Fisher, aportación necesaria para un objetivo y pérdida de poder adquisitivo de un dinero parado, con la gráfica y la tabla año a año.'] },
    ],
    'van-tir': [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Varias TIR cuando los flujos cambian de signo, TIR modificada y comparación de dos proyectos con la tasa de Fisher.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: valor actual neto, tasa interna de rentabilidad, plazo de recuperación simple y descontado e índice de rentabilidad de una inversión, con la decisión, la tabla de flujos actualizados y la gráfica del VAN según la tasa.'] },
    ],
    'amortizacion-inmovilizado': [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.', 'Venta del bien en un año: amortización acumulada, valor neto contable, beneficio o pérdida y el asiento con las cuentas del Plan General Contable (681, 281, 572, 671 y 771).'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: cuadro de amortización de un bien por el método lineal, la suma de dígitos, el degresivo de porcentaje constante y las unidades de producción, con la cuota de cada año, la amortización acumulada, el valor neto contable y su gráfica.'] },
    ],
    prestamos: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Periodo de carencia de capital y amortización anticipada reduciendo la cuota o el plazo, con los intereses ahorrados.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: cuota y cuadro de amortización completo de un préstamo por el sistema francés, el de cuota de amortización constante y el americano, con pagos anuales, semestrales, trimestrales o mensuales, los intereses totales y la TAE, también con comisión de apertura.'] },
    ],
    rentas: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Rentas variables: términos en progresión aritmética o geométrica, con valor actual y valor final.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: valor actual, valor final, término y número de términos de rentas constantes pospagables o prepagables, temporales o perpetuas, inmediatas o diferidas, con términos anuales, semestrales, trimestrales o mensuales, la tabla de términos y su gráfica.'] },
    ],
    interes: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['Modo práctica propio: ejercicios al azar de esta herramienta, con su enunciado y la corrección de lo que escribes.', 'El desarrollo termina con un paso «Convención» que dice qué base de días, qué tipo por periodo y qué redondeo se usan.', 'Botones «Usar en…» para llevar el capital, el plazo y la TAE a Ahorro e inflación y a Rentas.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Tiempo en meses o días (año de 365 o 360 días) y capitalización continua.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: capital final, capital inicial, tipo de interés y tiempo en capitalización simple y compuesta (anual, semestral, trimestral, mensual o diaria), el paso del TIN a la TAE y al revés, la comparación simple frente a compuesta año a año y su gráfica.'] },
    ],
    descriptiva: [
      { v: '0.2', fecha: '2026-11-10', cambios: ['Medias geométrica y armónica, con la desigualdad H ≤ G ≤ x̄ y cuándo toca cada una.', 'Media ponderada: una lista de pesos (créditos, porcentajes) junto a los datos.', '«Usar en…»: lleva la media, la desviación y N al intervalo de confianza y al contraste de la media, y la lista de datos a Wilcoxon.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: con una lista de datos, una tabla de frecuencias o datos agrupados en intervalos, saca la tabla de frecuencias, la media, la mediana, la moda, los cuartiles y cualquier percentil, la varianza y la desviación típica (de la población o de una muestra), el coeficiente de variación, la asimetría, la curtosis y los atípicos, con el histograma y el diagrama de caja.'] },
    ],
    'regresion-economia': [
      { v: '0.2', fecha: '2026-11-11', cambios: ['Gráfica de residuos, con un aviso si tienen forma de curva, y botón «Usar en…» para añadir más variables en Regresión múltiple.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: regresión por mínimos cuadrados con datos económicos en forma lineal, doble logarítmica (elasticidad) o semilogarítmica (tasa de crecimiento), con R² y R² ajustado, errores típicos, t, p-valor, intervalo de la pendiente, la lectura económica de cada coeficiente y una predicción.'] },
    ],
    ajustador: [
      { v: '0.2.1', fecha: '2026-11-10', cambios: ['La ecuación iónica neta sale también con las sales de amonio escritas con paréntesis, como (NH₄)₂CO₃, y con los acetatos escritos como CH₃COONa. Si escribes H₂CO₃ como producto, explica que se descompone en CO₂ y agua. Ejemplo nuevo: carbonato de sodio con ácido clorhídrico.'] },
      { v: '0.2', fecha: '2026-11-08', cambios: ['Avisa cuando una reacción admite varios ajustes independientes o ninguno; ecuación iónica completa y neta con los iones espectadores; tipo de reacción; y botón para llevar la reacción ajustada a Masa molar.'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: ajusta reacciones moleculares e iónicas por el método algebraico, con una incógnita por especie, el balance de cada elemento y de la carga, los coeficientes enteros y la comprobación átomo a átomo, con una gráfica de los átomos a cada lado y diez reacciones de ejemplo.'] },
    ],
    electrostatica: [
      { v: '0.7', fecha: '2026-11-08', cambios: ['El modo práctica comprueba las dimensiones: si tu respuesta no sale en N/C, V, N, J… te lo dice, y si sumas términos con unidades distintas señala cuál falla.'] },
      { v: '0.6', fecha: '2026-10-26', cambios: ['Tubo cilíndrico con carga superficial σ y cilindros huecos (con radio interior), para resolver cables coaxiales.', 'Densidades que no son uniformes en esferas y cilindros (ρ₀·r/R, ρ₀·R/r, ρ₀(1 − r/R) y ρ₀(1 − r²/R²)) y en varillas (λ que crece o decrece a lo largo), con Gauss y la carga encerrada.', 'Arcos cargados: semicircunferencias, cuartos de anillo o cualquier ángulo, con el campo y el potencial en el centro.', 'Corteza esférica conductora con radio interior y exterior: si dentro hay una carga centrada, se induce −q en la cara interior y +q en la exterior.', 'Seis ejercicios de ejemplo nuevos con todo esto.', 'La guía enlaza con la herramienta de Condensadores.'] },
      { v: '0.5.1', fecha: '2026-10-23', cambios: ['El simulador tiene ahora su propia dirección, /electromagnetismo/electrostatica/. Tus problemas guardados siguen ahí. El botón «Todas las herramientas» de la barra lateral vuelve a la portada.'] },
    { v: '0.5', fecha: '2026-10-23', cambios: ['Doce ejercicios de ejemplo con enunciados propios: los mismos tipos de pregunta que en clase, con otras figuras y otros números. La guía de uso tiene capturas nuevas hechas con ellos.', 'La web tiene icono propio: un dipolo con sus líneas de campo, en la pestaña del navegador, en la pantalla de inicio del móvil y en la vista previa al compartir el enlace.', 'Páginas de aviso legal, privacidad, cookies y contacto, enlazadas al pie de la barra lateral.'] },
    { v: '0.4', fecha: '2026-10-22', cambios: ['Número de versión visible y este apartado de novedades.', 'Arreglo: en la vista 3D los cilindros se dibujan con su radio real, aparecen las superficies de Gauss, y las esferas, cascarones y conductores tienen volumen en lugar de parecer círculos planos.'] },
    { v: '0.3', fecha: '2026-10-22', cambios: ['Guía de uso con capturas (botón ?, barra lateral o F1).', 'Los resultados se escriben con la misma forma que el solucionario oficial: perfiles por tramos, factor común en logaritmos y radicales, y la pregunta V_A − V_B.'] },
    { v: '0.2', fecha: '2026-10-22', cambios: ['Anillos, discos, cortezas y conductores.', 'Varias incógnitas, modo numérico SI, flujo de Gauss y gráficas E(z) y V(z).', 'Modo práctica, exportar la solución, deshacer y rehacer, mapa de color y vista 3D.', 'Búsqueda, carpetas y etiquetas en la barra lateral.'] },
    { v: '0.1', fecha: '2026-10-22', cambios: ['Primera versión: cargas, hilos, planos y esferas con el desarrollo paso a paso y 12 ejercicios resueltos.', 'Barra lateral con tus problemas, los importados y los ejercicios; título y enunciado editables; archivos .emsim.json.'] },
    ],
    magnetostatica: [
      { v: '0.3', fecha: '2026-11-08', cambios: ['Nueva pregunta «Dipolo magnético»: momento dipolar de espiras, solenoides y discos, campo del dipolo comparado con el exacto de Biot-Savart.', 'Nueva pregunta «Potencial vector A» para espiras, espiras rectangulares y solenoides (también el ideal).', 'Vista 3D de las líneas de campo, que se gira con el ratón o con el teclado, con una descripción en texto y la vista plana como alternativa.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevas fuentes: cilindro con corriente (macizo, hueco o con J proporcional a r, para cables coaxiales), lámina de corriente K, espira rectangular de una pieza y disco cargado que gira.', 'Nueva pregunta «Perfil de |B|»: la gráfica del módulo del campo a lo largo de una recta entre dos puntos.', 'Mapa de color de |B| y líneas de campo continuas en el dibujo.', 'Seis ejercicios de ejemplo nuevos con todo esto.', 'Los números decimales se escriben con coma.', 'Botones para copiar el enlace del ejercicio, copiar la solución de cada pregunta como texto o en LaTeX e imprimirla o guardarla en PDF.'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['Arreglo: el ejemplo resuelto de la teoría explica dónde abrirlo ahora, en «Ejercicios de ejemplo» de la barra Mis ejercicios.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: campo magnético de hilos, segmentos, hilos semiinfinitos, espiras, arcos, solenoides y toroides con Biot-Savart, y fuerza sobre cargas en movimiento y sobre conductores, con el desarrollo paso a paso en la forma μ₀I/(πa) o en unidades del SI.', 'Dibujo del campo B en el plano XY, XZ o YZ, con puntos que se pueden arrastrar y ocho ejemplos resueltos.'] },
    ],
    'tabla-periodica': [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Más datos en la ficha: afinidad electrónica, estados de oxidación, densidad y puntos de fusión y ebullición, y la tabla se puede colorear por ellos.', 'Botones para abrir el elemento en Configuración electrónica (con la Zef) y en Masa molar.', 'Compara hasta tres elementos en una tabla, con el mayor de cada propiedad marcado.', 'Ponte a prueba: preguntas al azar de nombres y símbolos, grupo y periodo, configuración, electrones de valencia y tendencias.', 'En el móvil las casillas muestran solo el número y el símbolo, y la tabla ocupa menos.', 'Nota sobre el grupo 3: dónde van La, Ac, Lu y Lr según la IUPAC.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: cada elemento tiene su ficha con la masa atómica y molar, el grupo, el periodo, el bloque, la configuración electrónica (abreviada, completa y por capas), la electronegatividad, la energía de ionización, el radio y el estado.', 'La tabla se puede colorear por categoría, electronegatividad, energía de ionización, radio, masa, bloque o estado, y tiene un buscador por nombre, símbolo o número atómico.'] },
    ],
    'trabajo-y-energia': [
      { v: '0.3', fecha: '2026-11-15', cambios: ['Interruptor de la gravedad: elige 9,8, 9,81 o 9,80665 m/s² y se pone en el campo «Gravedad» de esta herramienta y de las demás de Física; por defecto cada una conserva su valor.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevos problemas: rizo (altura mínima para dar la vuelta, velocidad y normal arriba, o dónde se despega), péndulo (velocidad y tensión en cada ángulo, si da la vuelta o se afloja el hilo), montaña rusa sin rozamiento por varios puntos y trabajo de una fuerza variable con la gráfica F(x), su área y la potencia.', 'En la rampa, los problemas al revés: altura mínima para llegar al muelle, rozamiento del llano para que se pare justo antes y constante del muelle para una compresión dada.', 'Modo práctica con enunciado escrito para cada tipo de problema.'] },
      { v: '0.1.3', fecha: '2026-10-25', cambios: ['Arreglo: en el móvil, las fórmulas largas del desarrollo se cortaban por la derecha; ahora bajan de línea en cada igual.'] },
      { v: '0.1.2', fecha: '2026-10-24', cambios: ['Las fórmulas del desarrollo y de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Los resultados salen arriba, en una tarjeta destacada, y la lectura de t y v tiene ancho fijo: ya no mueve la barra de tiempo al reproducir.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: un bloque baja por una rampa con rozamiento, recorre un tramo horizontal y comprime un muelle. Animación con barras de energía cinética, gravitatoria, elástica y calor, gráfica de las energías en el tiempo y el desarrollo paso a paso con la velocidad al pie de la rampa, al llegar al muelle y la compresión máxima.', 'Seis ejemplos: sin rozamiento, se para antes del muelle, el rozamiento lo sujeta, con empujón inicial y muelle duro.'] },
    ],
    'masa-molar': [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nueva pestaña «Fórmula empírica»: de la composición centesimal, de los gramos de cada elemento o de un análisis por combustión a la fórmula empírica y, con la masa molar, a la molecular, paso a paso.', 'Reactivos impuros (con su pureza) y en disolución (con su molaridad y su volumen) en la estequiometría.', 'Gases a cualquier temperatura y presión con PV = nRT, y el volumen de los productos que lleven (g).', 'Rendimiento al revés: escribe la masa obtenida de verdad y calcula el rendimiento.', 'Acepta los estados (s), (l), (g) y (aq), las cargas sin ^ (Fe3+, NO3-, SO42-), el + sin espacios, la doble flecha ⇌ y los electrones de las semirreacciones.', 'Tabla de moles al principio, lo que cambia y al final, y un resumen con el limitante, lo que se forma y lo que sobra.', 'Modo práctica también para la estequiometría y la fórmula empírica.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: masa molar y composición centesimal de cualquier fórmula, con paréntesis, hidratos e iones, y conversor entre gramos, moles, partículas y litros de gas.', 'Estequiometría: ajusta la reacción sola (también las iónicas), calcula el reactivo limitante, lo que se forma con el rendimiento que digas y lo que sobra, paso a paso.', 'Masas atómicas de la IUPAC o redondeadas como en clase.'] },
    ],
    'configuracion-electronica': [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Electrones de valencia como en clase (el Fe tiene 4s² 3d⁶, ocho), no solo los de la capa más externa.', 'Nueva pestaña «¿Qué elemento es?»: escribe una configuración y dice de qué elemento es y si es el estado fundamental, uno excitado o una configuración imposible (2p⁷, 2d¹).', 'Nueva pestaña «Números cuánticos»: comprueba si un conjunto (n, l, m_l, s) está permitido y a qué orbital corresponde.', 'Tabla con los cuatro números cuánticos de cada electrón de valencia.', 'Carga nuclear efectiva con las reglas de Slater, paso a paso.', 'Especies isoelectrónicas (Na⁺, Mg²⁺, F⁻…) ordenadas de mayor a menor radio.', 'Los ejemplos están ahora en la barra lateral, con Mis ejercicios.'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['El aviso de excepción al orden de llenado sale solo en los átomos neutros, no en sus iones, y muestra justo los subniveles que cambian (Pt: se esperaría 6s² 5d⁸ y tiene 6s¹ 5d⁹).'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: configuración electrónica de cualquier elemento o ion por orden de llenado, abreviada y por capas, con el diagrama de Moeller, el diagrama de orbitales con la regla de Hund, los electrones desapareados y los números cuánticos del electrón diferenciador.', 'Avisa de las excepciones como el cromo o el cobre, y en los cationes quita primero los electrones de la capa más externa.'] },
    ],
    condensadores: [
      { v: '0.3', fecha: '2026-11-08', cambios: ['Al conectar dos condensadores cargados, las capacidades admiten unidades y prefijos (2200 nF, 4,7 µF…).'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Cilíndricos y esféricos con el dieléctrico por sectores, en paralelo: por ejemplo, media esfera con un material y la otra media con otro.', 'Permitividad que cambia con la posición, de ε₁ en una armadura a ε₂ en la otra, con las cargas de polarización de las caras y del volumen.', 'Fuerza entre las armaduras y fuerza que mete un dieléctrico a medio introducir.', 'Rigidez dieléctrica: escribe la de cada capa y sale la tensión máxima antes de la ruptura.', 'Asociaciones de condensadores en serie, en paralelo y mixtas, con la carga, la tensión y la energía de cada uno, y dos condensadores cargados que se conectan, con la energía que se pierde.', 'La carga libre de cada armadura en el desarrollo.', 'Botones para copiar el enlace del ejercicio, copiar la solución como texto o en LaTeX e imprimirla o guardarla en PDF.', 'El desarrollo paso a paso escribe las fórmulas como en los libros: fracciones, raíces, exponentes y subíndices de verdad.', 'La capacidad sale también en letras, como en los apuntes (por ejemplo C = 4πε₀εᵣab/(b − a), o la suma de cada capa en serie).', 'Enlace al simulador de Electrostática desde la teoría.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: condensadores planos, cilíndricos y esféricos con capas de dieléctrico en serie o, en el plano, ocupando parte del área. Capacidad, carga, tensión y energía; campos E, D y P en cada capa y cargas de polarización, con el desarrollo paso a paso.', 'Compara con el condensador vacío: qué pasa al meter el dieléctrico con la batería conectada o con el condensador aislado.', 'Dibujo del corte con las líneas de campo y gráfica de E a lo largo del condensador.'] },
    ],
    'tiro-parabolico': [
      { v: '0.4', fecha: '2026-11-15', cambios: ['Interruptor de la gravedad: elige 9,8, 9,81 o 9,80665 m/s² y se pone en el campo «Gravedad» de esta herramienta y de las demás de Física; por defecto cada una conserva su valor.'] },
      { v: '0.3', fecha: '2026-11-11', cambios: ['Botón «Usar en…» para comprobar por energía, en Trabajo y energía, la velocidad con la que cae el proyectil (sin rozamiento).'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Ángulo de alcance máximo cuando se lanza desde otra altura, con su desarrollo.', 'Blanco: además de los ángulos para acertar, la velocidad que hace falta con el ángulo dado.', 'Opción para dibujar varios tiros con la misma velocidad y la parábola de seguridad.', 'Movimiento rectilíneo con un segundo móvil: cuándo y dónde se encuentran (persecuciones y cruces).', 'Nueva pestaña de movimiento circular (MCU y MCUA): velocidad angular, periodo, aceleraciones normal y tangencial, cuándo se para o da n vueltas, con animación y gráficas θ(t) y ω(t).', 'Modo práctica con enunciado: tiros, blancos, frenadas, encuentros y giros.'] },
      { v: '0.1.3', fecha: '2026-10-25', cambios: ['Arreglo: en el móvil, las fórmulas largas del desarrollo se cortaban por la derecha; ahora bajan de línea en cada igual.'] },
      { v: '0.1.2', fecha: '2026-10-24', cambios: ['Las fórmulas del desarrollo y de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Los resultados salen arriba, en una tarjeta destacada, y la lectura de t, x, y y v tiene ancho fijo: ya no se mueve al reproducir.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: tiro parabólico desde cualquier altura hasta cualquier altura, con el tiempo de vuelo, la altura máxima, el alcance y la velocidad al caer, y el desarrollo paso a paso. Trayectoria animada con los vectores de velocidad y gráficas de posición, velocidad y aceleración frente al tiempo.', 'Rozamiento del aire lineal o cuadrático, comparado con la trayectoria sin rozamiento.', 'Blanco: dice si el proyectil pasa por un punto y con qué dos ángulos se acierta.', 'Movimiento rectilíneo (MRU y MRUA): posición y velocidad en un instante, cuándo pasa por un punto y cuándo se para, con las gráficas x(t), v(t) y a(t).'] },
    ],
    disoluciones: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Propiedades coligativas: descenso crioscópico, aumento ebulloscópico, presión osmótica y presión de vapor (Raoult) en agua y otros seis disolventes, con el factor de van \'t Hoff deducido de la fórmula.', 'La masa molar de un soluto a partir de la crioscopía, la ebulloscopía o la presión osmótica.', 'Preparar una disolución también en g/L, % m/v, % en masa, molalidad o normalidad, con el agua que hay que añadir.', 'Normalidad, con los equivalentes por mol sacados de la fórmula del ácido o la base.', 'Diluir con la unidad que quieras en cada dato (mol/L, mmol/L, g/L, mg/L, % m/v; L, mL o µL).', 'Aviso de seguridad al diluir cualquier ácido concentrado (siempre el ácido sobre el agua) y al disolver sosa o potasa.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: da la concentración de una disolución como molaridad, molalidad, fracción molar, % en masa, % masa/volumen, g/L o ppm y obtén todas las demás, con la densidad para pasar de masa a volumen y el desarrollo con su base de cálculo.', 'Preparar una disolución: los gramos de sólido (con su pureza) o los mililitros de reactivo comercial (con su riqueza y densidad) que hay que medir.', 'Diluciones con C₁V₁ = C₂V₂, despejando el dato que falte, y mezcla de dos disoluciones del mismo soluto.'] },
    ],
    calorimetria: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Problemas al revés: escribe ? en el dato que no conoces (masa, temperatura inicial, calor específico, capacidad del calorímetro o tiempo) y pon la temperatura final.', 'Calorímetro por su equivalente en agua.', 'Calentador con potencia, tiempo y rendimiento (Q = η P t), por ejemplo un hervidor.', 'Más sustancias: plata, oro, mercurio, latón y aceite de oliva.', 'Nueva pestaña de dilatación térmica: lineal, superficial, de volumen y líquido que rebosa del recipiente, con la temperatura a la que se alcanza una medida.', 'Modo práctica con enunciado: mezclas, problemas al revés, hervidores y dilataciones.'] },
      { v: '0.1.2', fecha: '2026-10-24', cambios: ['Las fórmulas del desarrollo y de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['La temperatura de equilibrio sale en una tarjeta destacada, separada de la tabla de calores.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: temperatura de equilibrio al mezclar hasta cinco cuerpos de agua, hielo, vapor, metales, etanol, vidrio, un calorímetro o una sustancia con tus datos, con los cambios de fase que hagan falta.', 'Si la energía no llega para fundir todo el hielo o condensar todo el vapor, dice cuántos gramos quedan de cada fase.', 'Tabla con el calor de cada cuerpo, el desarrollo etapa por etapa (m c ΔT y m L) y la curva de calentamiento de cada uno.'] },
    ],
    induccion: [
      { v: '0.3', fecha: '2026-11-08', cambios: ['Nueva pestaña «Fuerza entre espiras»: fuerza y sentido entre dos espiras coaxiales con la inducción mutua exacta, la gráfica frente a la distancia y la comparación con el límite de dipolo.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Toroide con entrehierro: reluctancia del núcleo y del hueco de aire y la autoinducción que queda.', 'Inducción mutua de dos espiras coaxiales a una distancia y de una bobina girada dentro de un solenoide.', 'Bobinas acopladas en serie y en paralelo, con los flujos que se suman o que se oponen.', 'Circuito RL: balance de energía (lo que da la fuente, lo que guarda la bobina y lo que se disipa en la resistencia) y una fuente que se conecta y desconecta una y otra vez, con la corriente máxima, mínima y media.', 'Los dibujos usan azul para el campo y el segundo circuito, y la gráfica del RL distingue corriente y tensión.', 'Botones para copiar el enlace del ejercicio, copiar la solución como texto o en LaTeX e imprimirla o guardarla en PDF.', 'El desarrollo paso a paso escribe las fórmulas como en los libros: fracciones, raíces, exponentes y subíndices de verdad.', 'El resultado sale también en letras, como en los apuntes (por ejemplo L = μ₀N²h ln(b/a)/(2π) o la corriente del circuito RL).', 'Enlace a Faraday y Lenz desde la teoría.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: coeficiente de autoinducción de solenoides (con núcleo), toroides de sección rectangular y circular, cables coaxiales y líneas bifilares, con el desarrollo desde la ley de Ampère.', 'Inducción mutua entre dos solenoides, dos espiras, un hilo y una espira, y una bobina sobre un toroide, o a partir de L₁, L₂ y k, con el coeficiente de acoplamiento.', 'Flujo, energía magnética y fem inducida si das la corriente o cómo cambia.', 'Circuito RL al cerrar el interruptor o al quitar la fuente: constante de tiempo, corriente y tensión en la bobina en cualquier instante y su gráfica.'] },
    ],
    matrices: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['Núcleo, imagen y subespacios: bases, dimensión y ecuaciones paramétricas e implícitas desde la escalonada reducida, con el teorema del rango.', 'Vectores propios de los valores no racionales: numéricos con cuatro cifras y, en 2 × 2, también con radicales.', 'Las casillas aceptan cuentas que den una fracción exacta, como sqrt(4), e^(iπ) o cos(π), y enseñan el valor leído.', 'Arreglo: con números enormes en la matriz, los valores propios ya no dejan la página colgada, y una letra en las casillas de Jordan o de la diagonalización ortogonal avisa en vez de fallar.'] },
      { v: '0.2', fecha: '2026-10-25', cambios: ['Matrices con un parámetro (k, a, m…): el determinante y el rango discutidos según su valor, y la inversa cuando existe.', 'Ecuaciones matriciales AX = B, XA = B y AX + B = C, paso a paso.', 'Aⁿ por diagonalización (P·Dⁿ·P⁻¹), también para potencias grandes.', 'Nuevas operaciones: matriz adjunta y de cofactores, descomposición LU, diagonalización ortogonal de matrices simétricas y forma de Jordan en 2×2 y 3×3.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: determinante por Gauss, por Sarrus o por Laplace; inversa por Gauss-Jordan o por adjuntos; rango; forma escalonada y escalonada reducida, con cada operación entre filas y la matriz después de cada paso.', 'Valores y vectores propios con el polinomio característico, las raíces exactas (también con radicales o complejas) y si la matriz es diagonalizable, con P y D.', 'Suma, resta, producto (elemento a elemento), producto por un número, potencia y traspuesta.', 'Fracciones exactas y números complejos en cualquier casilla: 3/4, 0,25, 2−3i o (1+i)/2.'] },
    ],
    derivadas: [
      { v: '0.3', fecha: '2026-11-02', cambios: ['Integrales por sustitución y por partes con el paso a paso completo: la elección de u y dv, du y v, la tabla de signos del método de la tabla, la integral cíclica (e^x cos x) y ln, arctg y arcsen por partes.', 'Arreglo: en los límites con potencias como (sen x / x)^(1/x²), el valor ya no se estropea por las restas con números casi iguales: se contrasta con la función cerca del punto.'] },
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: una función constante ya no sale con un punto crítico falso.', 'Integrales impropias: con límites en ∞ o con una asíntota dentro, diciendo si convergen o divergen.', 'Nuevas primitivas: productos de senos y cosenos (sen 3x cos 2x) y cambios trigonométricos (√(1 − x²)).', 'Límites con L’Hôpital, también 0·∞, 1^∞, 0⁰, ∞⁰ e ∞ − ∞.', 'Área entre dos curvas y volumen de revolución (discos y capas).', 'Estudio completo de una función: dominio, simetría, cortes, asíntotas, monotonía y curvatura.', 'Derivación implícita y derivadas parciales, con los puntos críticos y la matriz hessiana.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: derivadas de orden 1 a 4 con la regla de cada paso (suma, producto, cociente, cadena, derivación logarítmica) y el resultado simplificado.', 'Recta tangente en un punto y puntos críticos con su tipo.', 'Primitivas por la tabla, sustitución, partes (también dos veces), fracciones simples e identidades trigonométricas, comprobadas derivándolas.', 'Integral definida con la regla de Barrow, o numérica si no hay primitiva elemental, y el área encerrada.', 'Gráfica de f y f′ con la tangente que recorre la curva, o del área que se va llenando con la primitiva.'] },
    ],
    laplace: [
      { v: '0.2', fecha: '2026-10-25', cambios: ['Escalón u(t − a), delta δ(t − a) y retrasos e^{−as}, en la directa, en la inversa y en las ecuaciones diferenciales.', 'sen²t, cos²t y productos de senos y cosenos (linealizando), y funciones definidas a trozos.', 'Convolución y función de transferencia H(s), con la respuesta al impulso y al escalón.', 'Sistemas de dos ecuaciones diferenciales por Laplace.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.', 'Dice si F(s) es estable, marginalmente estable o inestable según sus polos, y la lleva a Control como lazo abierto.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: transformada directa de sumas de términos c·tⁿ·e^(at)·sen(bt) o cos(bt), senh y cosh, con la fila de la tabla y la propiedad que usa cada término, y F(s) con denominador común.', 'Inversa por fracciones simples: polos simples, múltiples y complejos (también dobles), con los coeficientes, la fila de la tabla y los valores inicial y final.', 'Ecuaciones diferenciales de primer y segundo orden con condiciones iniciales: transformar, despejar Y(s) y volver.', 'Plano s con los polos y los ceros, y gráfica animada de f(t) con cada término por separado.'] },
    ],
    interferencia: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevo montaje «Abertura circular»: disco de Airy y criterio de Rayleigh, con el límite de resolución de un ojo o un telescopio y si dos objetos se distinguen.', 'Red de difracción: poder de resolución en cada orden y la mínima diferencia de longitudes de onda que separa.', 'Nuevos montajes «Cuña de aire» y «Anillos de Newton», también al revés: el grosor de un pelo o el radio de una lente a partir de lo que se mide.', 'Cursor en la gráfica de intensidad: pasa el ratón o el dedo para leer la intensidad en cualquier punto de la pantalla.', 'El desarrollo se ve con fórmulas bien escritas.', 'Más tipos de ejercicio en el modo práctica.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: doble rendija de Young con la interfranja, la posición y el ángulo de cada máximo, la intensidad en un punto y la envolvente de difracción si das la anchura de las rendijas.', 'Rendija simple: mínimos, anchura del máximo central e intensidad.', 'Red de difracción: ángulos de cada orden, orden máximo y separación de dos longitudes de onda con el poder de resolución.', 'Láminas delgadas: colores que se refuerzan y se anulan y espesores para reforzar o quitar el reflejo.', 'Ondas que salen de las rendijas animadas y el patrón en la pantalla con el color de la luz.'] },
    ],
    'ondas-em': [
      { v: '0.4', fecha: '2026-11-08', cambios: ['Nuevo cálculo «Plasma e ionosfera»: frecuencia de plasma, relación de dispersión, velocidades de fase y de grupo, onda evanescente y ley de la secante en incidencia oblicua.', 'Nuevo cálculo «Suma de dos ondas»: batidos, onda estacionaria con su ROE y polarización resultante de dos ondas perpendiculares.', 'Nuevo cálculo «Láminas de retardo»: hasta cuatro polarizadores y láminas λ/4 o λ/2 con el cálculo de Jones y el estado de polarización tras cada elemento.', 'Botón «Abrir en Fresnel» en la incidencia sobre un dieléctrico y descarga del dibujo como imagen.'] },
      { v: '0.3', fecha: '2026-11-02', cambios: ['Nuevo cálculo «Polarizadores»: ley de Malus con luz natural, lineal o circular por hasta 6 polarizadores, con la intensidad tras cada uno.', 'Nuevo cálculo «Vector de Poynting»: balance de energía de un hilo con corriente, un condensador que se carga y un cable coaxial, comprobando que el flujo de S es la potencia.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['La onda puede ir en cualquier dirección (escribiendo las componentes de k y de E) y tener una fase inicial.', 'Polarización circular y elíptica, con el sentido de giro y la expresión de E y B con sus dos componentes.', 'Nuevo cálculo: la onda a partir de su expresión E(r, t) o B(r, t), por ejemplo 30 cos(2,094y + 6,283e8t) k: dirección de propagación, velocidad, medio y el otro campo.', 'Nuevo cálculo: incidencia normal sobre un conductor perfecto (onda estacionaria, nodos, presión y corriente superficial) o sobre otro medio (coeficientes de reflexión y transmisión).', 'En el desarrollo, B̂ = k̂ × Ê ya no escribe paréntesis de más alrededor de los vectores unitarios.', 'Botones para copiar el enlace del ejercicio, copiar la solución como texto o en LaTeX e imprimirla o guardarla en PDF.', 'El desarrollo paso a paso escribe las fórmulas como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: onda plana en el vacío o en un material a partir de f, λ, ω o k, con λ, k, el campo B y su dirección (B̂ = k̂ × Ê) y las expresiones de E(r, t) y B(r, t).', 'Intensidad, densidad de energía y presión de radiación, también de una fuente puntual a una distancia.', 'Medios con pérdidas: tangente de pérdidas, atenuación, profundidad de penetración e impedancia compleja.', 'La onda dibujada en 3D con E y B moviéndose.'] },
    ],
    intervalos: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['Proporción con cuatro métodos a elegir: el normal de clase (Wald), Wilson, el exacto de Clopper-Pearson y Agresti-Coull, con los cuatro intervalos comparados en el desarrollo.', 'Intervalo de predicción de una observación futura, x̄ ± t·s·√(1 + 1/n), y de tolerancia para una proporción de la población.', 'Con una lista de datos, un enlace la abre en Estadística descriptiva.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Datos apareados (antes y después, o dos medidas del mismo individuo): intervalo de la media de las diferencias, a partir de las dos listas o de d̄ y s_d.', 'Cociente de varianzas σ₁²/σ₂² con la F de Snedecor, y el de las desviaciones σ₁/σ₂, para saber si se pueden suponer varianzas iguales.', 'Cotas: cualquier intervalo puede ser bilateral, una cota inferior (a; +∞) o una cota superior (−∞; b), con toda α en una cola.', 'Población finita: da su tamaño N y se aplica el factor de corrección, también en el tamaño de la muestra.', 'Contraste con el intervalo: escribe un valor y te dice si se rechaza H₀ con ese nivel de significación.', 'Tamaño de muestra también para comparar dos medias o dos proporciones.', 'La gráfica muestra la F y las cotas con α en una sola cola, y en Welch se ven los grados de libertad sin redondear.', 'Nuevos ejercicios en el modo práctica: cotas de una media y datos apareados.'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['Una proporción con 0 éxitos, o con todos, ya no da un intervalo de un solo punto: se usa el intervalo de Wilson. Con pocos éxitos o fracasos también se muestra el de Wilson al lado del de siempre.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: intervalo de confianza de una media con σ conocida (z) o desconocida (t de Student), a partir de x̄, s y n o de la lista de datos, también si te dan la desviación con n.', 'Intervalos de una proporción, de la varianza y la desviación típica (con la χ²), de la diferencia de medias (σ conocidas, iguales o Welch) y de la diferencia de proporciones.', 'Tamaño de muestra para un error máximo en una media o una proporción.', 'Gráfica de la distribución con el área de confianza y simulación de 100 muestras que muestra cuántos intervalos aciertan.'] },
    ],
    fuerza: [
      { v: '0.3', fecha: '2026-11-08', cambios: ['Trayectoria de una partícula con E y B cualesquiera (hélice, deriva E×B), espejo magnético con cono de pérdidas y vista 3D con alternativa plana y descripción en texto.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Carga que entra en una franja de campo: si la atraviesa, el ángulo con el que sale y cuánto se ha desplazado; si no, dónde vuelve a salir.', 'Campos E y B cruzados: velocidad de deriva E/B y la cicloide animada, también con velocidad inicial (cicloide acortada o con bucles).', 'Efecto Hall: tensión Hall, densidad de portadores, coeficiente de Hall y qué cara queda a más potencial.', 'Par sobre una espira o bobina: momento magnético, par, energía y trabajo para girarla.', 'Espectrómetro de masas con dos isótopos: la separación entre los impactos.', 'El campo B se dibuja en azul en todas las animaciones.', 'Botones para copiar el enlace del ejercicio, copiar la solución como texto o en LaTeX e imprimirla o guardarla en PDF.', 'El desarrollo paso a paso escribe las fórmulas como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: fuerza sobre una carga en un campo uniforme, con el radio, el periodo y el sentido de giro, o la hélice si v no es perpendicular a B. La velocidad se puede dar en m/s, por su energía en eV o por la ddp que la acelera.', 'Fuerza de Lorentz con vectores: v × B con su determinante y F = q(E + v × B).', 'Selector de velocidades y espectrómetro de masas, ciclotrón con la frecuencia, la energía de salida y las vueltas.', 'Fuerza sobre un hilo (y la corriente para que flote) y entre dos hilos paralelos.', 'Animación de cada situación.'] },
    ],
    campos: [
      { v: '0.2.1', fecha: '2026-10-28', cambios: ['Arreglo: el párrafo sobre el teorema de Stokes de la teoría ya se lee como texto normal, no como una fórmula.'] },
      { v: '0.2', fecha: '2026-10-25', cambios: ['La función potencial con su expresión, φ = x²y + y³ + K, integrando componente a componente.', 'Integral de línea por una poligonal (como el contorno de un triángulo), tramo a tramo.', 'Nuevo modo ∫ f ds: longitud, masa y centro de masas de un alambre.', 'Teorema de Green en triángulos, polígonos y regiones entre dos curvas, con el área.', 'Nuevo modo de flujo por una superficie r(u, v) con el teorema de Stokes, y nuevo modo del teorema de la divergencia en una caja, una esfera o un cilindro, con la figura en 3D.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: gradiente, derivada direccional y laplaciano de un campo escalar, con su mapa de color y las curvas de nivel.', 'Divergencia y rotacional de un campo vectorial en el plano o en el espacio y, si es conservativo, su potencial.', 'Integral de línea (trabajo) a lo largo de una curva r(t), comparada con la diferencia de potencial cuando el campo es conservativo.', 'Teorema de Green en un círculo o un rectángulo: circulación y flujo por el borde frente a las integrales dobles.', 'Gráfica con partículas que siguen el campo y un molinillo que gira con el rotacional; tocándola se mueve el punto.'] },
    ],
    cinetica: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Coeficiente de A en la reacción (2 A → productos), con las dos formas de definir k explicadas.', 'La constante también sale de la vida media, del porcentaje que ha reaccionado en un tiempo o de dos medidas.', 'Arrhenius con tres o más temperaturas: recta de ajuste de ln k frente a 1/T con su R².', 'Diagrama de energía con Eₐ, ΔH y la Eₐ de la reacción inversa.', 'Catalizador: cuánto se multiplica k al bajar la energía de activación.', 'Aviso cuando dos rectas se ajustan casi igual y los datos no bastan para decidir el orden.', 'Velocidades iniciales con tres reactivos.', 'Tiempo también en días y en años.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: leyes integradas de orden 0, 1 y 2 con la concentración a cualquier tiempo, la vida media y cuánto se tarda en llegar a una concentración.', 'Orden y constante a partir de una tabla de concentraciones frente al tiempo, con las tres rectas ([A], ln [A] y 1/[A]) y su R².', 'Método de las velocidades iniciales con uno o dos reactivos: órdenes, constante con sus unidades y ley de velocidad.', 'Ecuación de Arrhenius: energía de activación con dos temperaturas o la constante a otra temperatura, con la gráfica de ln k frente a 1/T.', 'Vaso animado en el que las moléculas de reactivo se convierten en producto.'] },
    ],
    edos: [
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: avisa cuando la solución explota (y′ = y²) y corta la gráfica ahí.', 'Solución exacta de ecuaciones separables (como la logística), de Bernoulli y exactas, con factor integrante.', 'Euler mejorado (Heun) y punto medio, con una tabla que compara el error según h.', 'Variación de parámetros cuando g(x) no admite coeficientes indeterminados (tg x, 1/cos x, eˣ/x).', 'Ecuaciones de orden 3 y 4 con coeficientes constantes, y de Cauchy-Euler.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.', 'Las ecuaciones de 2.º orden se pueden resolver con Laplace desde un botón, con sus condiciones iniciales.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuaciones de primer orden y′ = f(x, y) con el campo de pendientes, el método de Euler (con su tabla) y RK4, y la solución exacta cuando es lineal con coeficiente constante.', 'Ecuaciones lineales de segundo orden con coeficientes constantes: ecuación característica, solución homogénea, particular por coeficientes indeterminados (también con resonancia) y constantes por las condiciones iniciales.', 'Sistemas x′ = f(x, y), y′ = g(x, y): puntos críticos con su tipo (silla, nodo, foco o centro) por los autovalores del jacobiano, solución exacta si es lineal y diagrama de fases con trayectorias.', 'Gráfica animada; tocándola se cambia el punto inicial.'] },
    ],
    fourier: [
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: avisa si la función no es integrable (1/x en [−1, 1]) en vez de dar coeficientes sin sentido.', 'Arreglo: en el móvil las fórmulas largas ya no se salen de la pantalla.', 'Término general en más casos: eˣ, |sen x| o funciones trapezoidales.', 'Los huecos entre tramos se rellenan con 0.', 'Forma compleja (cₙ) y forma amplitud-fase, con el espectro de fase.', 'Suma de series numéricas con Parseval o con un punto (Σ 1/n² = π²/6).', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: serie de Fourier de una función periódica dada hasta en cuatro tramos (1, x, x^2, |x|, sen x…), o desarrollo en senos o en cosenos de una función en [0, L].', 'Coeficientes a₀, aₙ y bₙ exactos (con π) y su término general cuando siguen una ley, como 2(1 − (−1)ⁿ)/(nπ), con la paridad de la función.', 'Convergencia en los saltos (a la media de los límites laterales), suma parcial en un punto e igualdad de Parseval.', 'Gráfica de la función y de la suma parcial, que se puede ver sumando armónicos uno a uno, y el espectro de amplitudes.'] },
    ],
    taylor: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['Radio e intervalo de convergencia de cualquier función: el radio (también √5, π/2 o 2π), la singularidad que lo fija, aunque sea compleja, y qué pasa en cada extremo.', 'Límites en el infinito (escribe inf o -inf) y de potencias con la x en el exponente, como (1 + 1/x)^x = e.', 'Un botón dibuja la función y su polinomio juntos en el Graficador.'] },
      { v: '0.2.1', fecha: '2026-10-28', cambios: ['Arreglo: el párrafo sobre los límites con desarrollos de la teoría ya se lee como texto normal, no como una fórmula.'] },
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: con aˣ los coeficientes salen claros, (ln 2)²/2 en vez de 0,240227.', 'Arreglo: en el móvil las fórmulas largas ya no se salen de la pantalla.', 'Singularidades evitables: sen x / x o (eˣ − 1)/x en 0 ya tienen desarrollo.', 'Radio de convergencia para cualquier función, con un aviso si el punto cae fuera.', 'Límites con Taylor, como lím (sen x − x)/x³.', 'Grado hasta 25.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: polinomio de Taylor o de Maclaurin de cualquier grado hasta 15 de una función escrita como en papel (e^x, sen x, ln(1+x), √x, arctg x…) en un punto que puede llevar π, con cada derivada, su valor exacto y los coeficientes.', 'Aproximación de f(x₀) con el error cometido y la cota del resto de Lagrange.', 'Reconoce los desarrollos conocidos (e^x, sen x, cos x, ln(1+x), la serie geométrica, arctg x y la binómica) y da su término general y dónde convergen.', 'Gráfica de la función con los polinomios de cada grado, que se pueden recorrer o ver acercarse uno tras otro.'] },
    ],
    complejos: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['Entrada flexible: además de las cuatro formas de siempre, se puede escribir cualquier cuenta, como sqrt(-4), e^(iπ) + 1, i^i o (2 + 3i)/(1 − i); se calcula y se enseña el valor leído.'] },
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: ya entiende raíces en forma binómica, como 1 + √3 i.', 'Arreglo: la exponencial sale como e^{−iπ/2}, la trigonométrica con paréntesis y la polar con el módulo exacto (5√2).', 'Logaritmo complejo, eᶻ y potencias con exponente fraccionario o complejo (z^{1/2}, iⁱ).', 'Ecuaciones polinómicas de grado 3 y 4, y zⁿ = w directamente.', 'Regiones del plano dibujadas: |z − 1| < 2, Re z > 0, arg z entre dos ángulos…', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: escribe un complejo en forma binómica, polar, trigonométrica o exponencial y obtén las otras, con el módulo exacto y el argumento en su cuadrante.', 'Suma, resta, producto y cociente con fracciones exactas, potencias con De Moivre, raíces n-ésimas y ecuaciones de segundo grado.', 'Plano complejo con los afijos, el paralelogramo de la suma y el polígono de las raíces.'] },
    ],
    sistemas: [
      { v: '0.3', fecha: '2026-10-25', cambios: ['Discusión de un sistema según un parámetro (Rouché): los valores especiales de k con SCD, SCI o SI en cada caso.', 'Las ecuaciones se pueden escribir como texto, «2x + y − z = 8», además de con la rejilla de coeficientes.', 'Interpretación geométrica: las rectas en el plano o los planos en el espacio, y cómo se cortan.', 'Sistemas incompatibles con más ecuaciones que incógnitas: solución por mínimos cuadrados.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.'] },
      { v: '0.2', fecha: '2026-10-24', cambios: ['Métodos de reducción, igualación y sustitución para sistemas de 2 o 3 ecuaciones con solución única, con cada ecuación numerada y cada paso explicado.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: hasta seis ecuaciones con seis incógnitas. Dice si el sistema es compatible determinado, indeterminado o incompatible con el teorema de Rouché-Frobenius y lo resuelve por Gauss con sustitución hacia atrás, por Gauss-Jordan, por la regla de Cramer o con la matriz inversa.', 'Si tiene infinitas soluciones, las da en forma paramétrica (λ, μ…).', 'Coeficientes con fracciones exactas, decimales o números complejos, como las mallas de un circuito de alterna, y nombres propios para las incógnitas (I1, I2…).', 'Comprobación de la solución sustituyendo en cada ecuación.'] },
    ],
    regresion: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['Intervalo de confianza de la correlación ρ con la z de Fisher y comparación con la correlación de otra muestra.', 'Ajuste ponderado: si cada y tiene su incertidumbre, la recta se ajusta con pesos 1/σ², con los errores de la pendiente y la ordenada, el χ² reducido, las barras de error en la gráfica y la incertidumbre de la estimación.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Error de la pendiente y de la ordenada, con su intervalo de confianza, para los informes de prácticas, y banda de confianza de la recta en la gráfica.', 'Intervalos de confianza de la media de y y de predicción de un valor nuevo para la x que elijas.', 'Nuevos ajustes: recta por el origen (y = bx, con su incertidumbre) e hiperbólica (y = a + b/x).', 'Comparación de todos los ajustes ordenados por R², para ver cuál es mejor.', 'Gráfica de residuos y aviso de los puntos atípicos (residuo mayor que dos veces el error típico).', 'Coeficiente de correlación de Spearman, la relación b·b′ = r² y el ángulo entre las dos rectas.', 'Datos en una tabla de doble entrada, como en los ejercicios de clase.', 'Puedes elegir si las varianzas y la covarianza se dividen entre n o entre n − 1.'] },
      { v: '0.1.2', fecha: '2026-10-25', cambios: ['El ajuste parabólico funciona con x grandes, como los años (2015, 2016…): antes decía que faltaban valores de x distintos.', 'En los ajustes exponencial y potencial, una a muy pequeña se escribe en notación científica en vez de 0.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: escribe o pega tus datos (x, y), con frecuencias si las tienes, y obtén medias, varianzas, covarianza, el coeficiente de correlación con su contraste y las dos rectas de regresión, con la tabla de cálculos y la nube de puntos.', 'Ajustes exponencial, potencial, logarítmico y parabólico, con R² para compararlos con la recta, y los residuos.', 'Estimaciones de y a partir de x y de x a partir de y, avisando si es una extrapolación.', 'Añade puntos pulsando en la gráfica.'] },
    ],
    estadistica: [
      { v: '0.3', fecha: '2026-11-10', cambios: ['Teorema central del límite: el histograma de las medias de 2000 muestras simuladas junto a la normal que predice, para cualquier distribución y tamaño de muestra.', 'Aproximaciones con la fila «exacta, aproximada y error», con y sin corrección de continuidad; también la hipergeométrica por la binomial.', 'Comparar con una segunda distribución superpuesta en la gráfica, con sus medias, varianzas y la misma probabilidad.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevas distribuciones: F de Snedecor, uniforme continua, geométrica e hipergeométrica.', 'Valores críticos unilaterales y bilaterales, con los dos valores de la χ² y de la F.', 'Hallar μ o σ de una normal a partir de una probabilidad, como en los ejercicios de «¿qué media hace falta para que…?».', 'P(|X − μ| ≤ c), a una distancia c de la media, con la cota de Chebyshev al lado.', 'Aproximaciones de la binomial por la Poisson y de la Poisson por la normal, además de la binomial por la normal.', 'Las colas muy lejanas ya no salen como 0: se escriben en notación científica.', 'Tabla de valores de las discretas con un botón para copiarla.', 'Arrastra los valores sobre la gráfica para mover el área.', 'Modo práctica con ejercicios al azar de todas las distribuciones.'] },
      { v: '0.1.2', fecha: '2026-10-25', cambios: ['En la binomial, al calcular un cuantil, la probabilidad del cuantil ya no cambia la probabilidad de éxito p.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: normal, t de Student, chi cuadrado, exponencial, binomial y Poisson, con su media y su varianza.', 'Probabilidades P(X ≤ a), P(X ≥ a), entre dos valores y, en las discretas, P(X = k) y con desigualdad estricta; cuantiles y valores críticos bilaterales.', 'Gráfica con el área (o las barras) que se pide sombreada.', 'Desarrollo como en clase: tipificación Z = (X − μ)/σ y Φ(z), fórmula de la binomial y de la Poisson término a término, y aproximación de la binomial por la normal con corrección de continuidad.'] },
    ],
    dinamica: [
      { v: '0.3', fecha: '2026-11-15', cambios: ['Interruptor de la gravedad: elige 9,8, 9,81 o 9,80665 m/s² y se pone en el campo «Gravedad» de esta herramienta y de las demás de Física; por defecto cada una conserva su valor.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Bloques lanzados con velocidad inicial: frenan, se paran y se quedan quietos o vuelven, con la distancia y el tiempo de frenada.', 'Nuevos problemas: dos bloques en contacto o unidos por una cuerda, con la fuerza entre ellos; curvas con y sin peralte (velocidades máxima y mínima y si derrapa); péndulo cónico; loma y hondonada, y muelles (ley de Hooke, serie y paralelo, equilibrio en un plano y periodo de oscilación).', 'Fuerza mínima para que un bloque empiece a subir y el ángulo con el que menos cuesta, y el coeficiente de rozamiento a partir de una aceleración medida.', 'El dibujo se anima: el bloque se mueve, frena y vuelve, las masas de Atwood suben y bajan, el péndulo cónico gira y el muelle oscila. Se puede pausar.', 'Las fórmulas del desarrollo se ven como en los libros, y los ejemplos usan coma decimal.', 'Modo práctica con enunciado escrito para cada tipo de problema.'] },
      { v: '0.1.2', fecha: '2026-10-25', cambios: ['Arreglo: en el diagrama de fuerzas, el nombre del bloque ya no queda tapado por las flechas, el bloque se ve más grande y la flecha de la aceleración no cruza la normal.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: bloque en un plano horizontal o inclinado con rozamiento estático y dinámico, una fuerza aplicada con ángulo y, si quieres, una masa colgando de una polea. Dice si el bloque se mueve o el rozamiento lo sujeta y da la normal, el rozamiento, la aceleración y la tensión, con el desarrollo paso a paso.', 'Máquina de Atwood, también con una polea con masa.', 'Dibujo con el diagrama de fuerzas a escala y la aceleración, y la velocidad y el tiempo al recorrer una distancia.'] },
    ],
    'solido-rigido': [
      { v: '0.3', fecha: '2026-11-15', cambios: ['Interruptor de la gravedad: elige 9,8, 9,81 o 9,80665 m/s² y se pone en el campo «Gravedad» de esta herramienta y de las demás de Física; por defecto cada una conserva su valor.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Rodadura, polea y péndulo animados: se ve la rueda girar mientras baja.', 'Momento de inercia de un cuerpo compuesto: varias piezas (varillas, discos, esferas, masas puntuales…) cada una a su distancia del eje.', 'Choques que hacen girar: bala que se incrusta en una varilla colgada (y hasta dónde sube) y persona que salta a una plataforma.', 'Péndulo físico (periodo y longitud equivalente) y varilla que cae girando por su base.', 'Equilibrio estático: escalera apoyada en una pared (¿resbala?, ¿hasta dónde se puede subir?) y viga sobre dos apoyos con cargas.', 'Fórmulas del desarrollo bien escritas y ejemplos con coma decimal.', 'Modo práctica con enunciado.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: momentos de inercia de esferas, cilindros, aros, varillas, discos y placas, con el teorema de Steiner y el radio de giro.', 'Rodadura por un plano inclinado: aceleración, velocidad al final, rozamiento necesario para que no deslice y qué pasa si no basta; comparación del tiempo que tarda cada cuerpo.', 'Polea con masa de la que cuelga un cuerpo: aceleración, tensión y balance de energía.', 'Conservación del momento angular, como la patinadora que encoge los brazos, con la variación de la energía cinética.'] },
    ],
    ondas: [
      { v: '0.3', fecha: '2026-11-11', cambios: ['La velocidad del sonido se puede dar con la temperatura del aire (v = 331,3·√(1 + T/273,15)) en los tubos y en el efecto Doppler, y el desarrollo enseña el valor que se usa.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Superposición: pulsaciones de dos frecuencias cercanas, con la envolvente, y dos ondas desfasadas (por la diferencia de caminos o por el desfase).', 'Energía y potencia que transporta una onda en una cuerda.', 'Reflexión y transmisión entre dos cuerdas: coeficientes, amplitudes, reparto de la potencia y animación del pulso.', 'Enlace a Efecto Doppler para los casos con viento, ángulo o cono de Mach.', 'Fórmulas del desarrollo bien escritas y ejemplos con coma decimal.', 'Modo práctica con enunciado.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuación de una onda armónica con ω y k en múltiplos de π, posición, velocidad y aceleración de un punto del medio y desfase entre dos puntos.', 'Ondas estacionarias en cuerdas y en tubos abiertos o cerrados: frecuencia de cada armónico, nodos y vientres, y velocidad en la cuerda con √(T/μ).', 'Efecto Doppler con la fuente y el observador moviéndose, y nivel sonoro en decibelios a distintas distancias y con varias fuentes.', 'Animación de la onda, de la onda estacionaria y de los frentes de onda del Doppler.'] },
    ],
    gases: [
      { v: '0.6', fecha: '2026-11-15', cambios: ['Gas real: Redlich-Kwong puede usar la temperatura y la presión críticas reales del gas (CRC) en vez de las que salen de a y b de Van der Waals.'] },
      { v: '0.5', fecha: '2026-11-11', cambios: ['Botón «Usar en…» que lleva un ciclo de dos isotermas y dos adiabáticas a Ciclos termodinámicos como ciclo de Carnot.'] },
      { v: '0.4', fecha: '2026-11-10', cambios: ['La constante R sigue el mismo ajuste que las herramientas de Química: 8,314 J/(mol·K) «de clase» por defecto o la exacta, 8,314462618, con el valor usado a la vista en el desarrollo.'] },
      { v: '0.3', fecha: '2026-11-02', cambios: ['Gases reales comparados: además de Van der Waals, la ecuación de Redlich-Kwong (con las mismas constantes críticas), y una gráfica del factor de compresibilidad Z frente a la presión con el gas ideal, Van der Waals y Redlich-Kwong a la temperatura del estado.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Mezclas de gases con la ley de Dalton: presiones parciales, fracciones molares, masa molar media y densidad, con un gráfico de barras.', 'Gases reales con la ecuación de Van der Waals: presión, factor de compresibilidad Z, comparación con el gas ideal, punto crítico y la isoterma dibujada.', 'Teoría cinética con el recorrido libre medio, el número de choques por segundo y la densidad de moléculas.', 'Caja de partículas animada que se mueve más rápido o más despacio según la temperatura.', 'Las fórmulas del desarrollo y de la teoría se ven como en los apuntes.', 'Los ejemplos usan coma decimal.', 'Modo práctica con enunciado escrito.', 'Enlace a Ciclos termodinámicos para Otto, Diesel, Brayton y Stirling.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuación de estado PV = nRT con P, V, T y n en varias unidades, los moles a partir de la masa y la densidad del gas.', 'Transformaciones isoterma, isobara, isocora y adiabática encadenadas, con el trabajo, el calor y la variación de energía interna de cada tramo, y ciclos con su rendimiento comparado con el de Carnot.', 'Diagrama P-V con las isotermas y el área del ciclo.', 'Teoría cinética: velocidades cuadrática media, media y más probable, energía cinética media y la distribución de Maxwell.'] },
    ],
    ciclos: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevos ciclos Brayton (turbina de gas) y Stirling, este con y sin regenerador.', 'Ciclo propio: das la presión y el volumen de tres o cuatro estados y el tipo de cada tramo (isocora, isobara, recta, isoterma o adiabática).', 'Diagrama T-S animado junto al p-V y la variación de entropía de cada tramo en la tabla y en el desarrollo.', 'Potencia de un motor Otto o Diesel a partir de las revoluciones por minuto y el número de cilindros.', 'Modo práctica con enunciado: ejercicios al azar de cada ciclo y de máquinas térmicas.', 'Enlace a Gases ideales para encadenar transformaciones.'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['Arreglo: en el móvil, las fórmulas largas del desarrollo se cortaban por la derecha; ahora bajan de línea en cada igual.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ciclos de Carnot, Otto y Diesel con un gas ideal, con la tabla de estados, el trabajo, el calor y la energía interna de cada tramo y el rendimiento comparado con su fórmula y con Carnot.', 'Máquinas térmicas, frigoríficos y bombas de calor: el dato que falta, el rendimiento o la eficiencia, el límite de Carnot y si la máquina es posible, con la entropía del universo.', 'Diagrama p-V con un punto que recorre el ciclo y el cilindro con el émbolo, y el esquema de flujos de energía de las máquinas.'] },
    ],
    ph: [
      { v: '0.3', fecha: '2026-11-02', cambios: ['Diagrama de especies de los ácidos polipróticos: la fracción de cada forma (H₃A, H₂A⁻, HA²⁻, A³⁻) frente al pH, con los pK marcados y el pH de tu cálculo o del punto de la valoración.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Hidrólisis de sales: pH del acetato de sodio, del cloruro de amonio o de una sal neutra, con la constante de hidrólisis.', 'Al revés: Ka o Kb a partir del pH medido, y la concentración que hace falta para un pH.', 'Preparar un tampón: el cociente sal/ácido y los gramos de sal para un pH dado.', 'Ácidos polipróticos (carbónico, fosfórico, sulfúrico con su segunda constante) y su valoración con una equivalencia por protón.', 'Mezclas de un ácido débil con una base fuerte, o al revés, como modo propio.', 'Agua a otra temperatura: Kw y el pH neutro cambian (6,63 a 50 °C).'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['Valoraciones de un ácido o una base débil: con muy poco valorante añadido, o muy cerca del punto de equivalencia, el pH ya sale bien. Antes se usaba Henderson-Hasselbalch también ahí y daba un pH equivocado (por ejemplo 2,05 en vez de 2,91 al empezar a valorar el ácido acético).'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: pH de ácidos y bases fuertes (también muy diluidos) y débiles, con el grado de disociación y la aproximación comprobada.', 'Mezclas de un ácido fuerte con una base fuerte y disoluciones reguladoras con Henderson-Hasselbalch, también al añadirles ácido o base.', 'Valoraciones de ácidos y bases fuertes y débiles: volumen y pH de equivalencia, pH a mitad, el pH con el volumen que pidas, el indicador adecuado y la curva.', 'Vaso con el color del indicador universal y las partículas, y una bureta que valora mientras se dibuja la curva.'] },
    ],
    fluidos: [
      { v: '0.3', fecha: '2026-11-15', cambios: ['Interruptor de la gravedad: elige 9,8, 9,81 o 9,80665 m/s² y se pone en el campo «Gravedad» de esta herramienta y de las demás de Física; por defecto cada una conserva su valor.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Viscosidad: ley de Poiseuille en un tubo (caudal o diferencia de presión, perfil de velocidades y número de Reynolds) y ley de Stokes para una esfera que cae (velocidad límite o viscosidad a partir de ella).', 'Tubo de Pitot y medidor de Venturi con manómetro: la velocidad o el caudal a partir del desnivel.', 'Fuerza y centro de presiones sobre una presa o una compuerta sumergida, con el momento en la base.', 'Tensión superficial y capilaridad con la ley de Jurin, también para líquidos que no mojan como el mercurio.', 'Los ejemplos escriben los decimales con coma.', 'Modo práctica con enunciado: ejercicios al azar de cada tipo.'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['Arreglo: en el móvil, las fórmulas largas del desarrollo se cortaban por la derecha; ahora bajan de línea en cada igual.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: presión manométrica y absoluta a una profundidad, con la fuerza sobre el fondo, y alturas o densidades en un tubo en U con dos líquidos.', 'Prensa hidráulica: la fuerza que se consigue o la que hace falta para levantar una masa, con los recorridos de los émbolos.', 'Empuje de Arquímedes: si un cuerpo flota (y cuánto se sumerge) o se hunde (peso aparente y aceleración), y la densidad a partir del peso en el aire y dentro del fluido.', 'Tuberías con la ecuación de continuidad y Bernoulli, y el chorro de un depósito con Torricelli: velocidad, alcance, caudal y tiempo de vaciado.', 'Una animación de cada caso.'] },
    ],
    doppler: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Velocidades en ángulo: la fuente y el observador pueden moverse en cualquier dirección y solo cuenta la componente a lo largo de la recta que los une.', 'Nueva pestaña «Luz»: Doppler relativista con corrimiento al rojo o al azul, la velocidad de una galaxia a partir de la longitud de onda que llega, el Doppler transversal y la comparación con la fórmula clásica, sobre el espectro visible.', 'La gráfica de la fuente que pasa muestra la frecuencia que se oye en cada instante, con el retraso del sonido.', 'Modo práctica con enunciado: ejercicios al azar de cada tipo.'] },
      { v: '0.1.2', fecha: '2026-10-25', cambios: ['Arreglo: en el móvil, las fórmulas largas del desarrollo se cortaban por la derecha; ahora bajan de línea en cada igual.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: frecuencia que se oye con la fuente, el observador y el viento moviéndose, con la longitud de onda delante de la fuente.', 'Una fuente que pasa de largo: lo que se oye antes y después, el salto en hercios y semitonos y, al revés, su velocidad a partir de las dos frecuencias. Con el observador a un lado de la carretera, la gráfica del cambio gradual.', 'Eco en un obstáculo que se mueve (radar de tráfico, murciélago, ecografía Doppler): la frecuencia del eco y las pulsaciones, o la velocidad del obstáculo a partir de ellas.', 'Onda de choque: número de Mach, semiángulo del cono y cuándo se oye el estampido.', 'Animación de los frentes de onda y botón para escuchar la diferencia.'] },
    ],
    resistencias: [
      { v: '0.3', fecha: '2026-11-08', cambios: ['El divisor de tensión da la salida en el peor caso con la tolerancia y avisa si las resistencias de 1/4 W no aguantan la potencia (también en el LED); nuevas series E3 y E192.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevo modo de asociación: escribe 100 + (220 ‖ 330) y sale la resistencia equivalente paso a paso, y con una tensión, la corriente y la potencia.', 'Nuevo modo para conseguir un valor que no existe con dos normalizadas en serie o en paralelo (5 kΩ = 10 kΩ ‖ 10 kΩ).', 'Nuevos modos de resistencia para un LED, con el valor normalizado y la potencia que debe aguantar, y de divisor de tensión con normalizadas, también con carga.', 'Código impreso de los condensadores (104, 472J, 104K 2A, 4n7) con la tolerancia y la tensión, y el código de colores de las bobinas en μH.', 'Avisa si parece que estás leyendo la resistencia al revés y te dice qué valor saldría desde el otro extremo.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: elige los colores de una resistencia de 3, 4, 5 o 6 bandas y obtén el valor, la tolerancia, el margen del valor real y el coeficiente de temperatura, con el dibujo de la resistencia.', 'Del valor a los colores: escribe 4k7, 2M2 o 470R y te da las bandas y el valor normalizado más cercano de las series E6 a E96.', 'Códigos SMD de 3 y 4 cifras, con R y EIA-96.'] },
    ],
    faraday: [
      { v: '0.3', fecha: '2026-11-08', cambios: ['Barra en raíles inclinados con g, corriente y potencia en el límite, y corrientes de Foucault en discos y núcleos laminados.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Hilo recto y espira rectangular: la espira se aleja o se acerca, o la corriente del hilo cambia, con el flujo integrado, la fem, el sentido y la fuerza sobre la espira.', 'Campo que cambia con una función del tiempo (B₀ + kt, B₀ + kt², B₀ sen ωt o B₀ e^(−t/τ)): fem en cualquier instante y gráficas de B(t) y ε(t).', 'Barra con masa: velocidad límite al tirar de ella o al caer por raíles verticales, y la distancia que recorre una barra lanzada hasta pararse, con v(t).', 'Varilla que gira por un extremo y disco de Faraday: ε = ½BωL².', 'Alternador: el par que hay que hacer para mantener el giro y la energía de cada vuelta.', 'Botones para copiar el enlace del ejercicio, copiar la solución como texto o en LaTeX e imprimirla o guardarla en PDF.', 'El desarrollo paso a paso escribe las fórmulas como en los libros: fracciones, raíces, exponentes y subíndices de verdad.', 'Enlace a Autoinducción e inducción mutua desde la teoría.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: fem y corriente inducidas en una barra que se desliza sobre unos raíles, con la fuerza que la frena y la potencia.', 'Bobina que gira en un campo (alternador): flujo y fem en función del tiempo, valores máximo y eficaz.', 'Flujo que cambia en un tiempo porque cambia el campo o el ángulo: fem media, corriente y carga.', 'Espira que atraviesa una región con campo: fem al entrar y al salir, fuerza y calor.', 'Sentido de la corriente por la ley de Lenz y animación con la gráfica de Φ y ε.'] },
    ],
    // «Física en la vida real» (todos los fenómenos comparten versión)
    fenomenos: [
      { v: '0.9', fecha: '2026-11-10', cambios: ['Las animaciones se leen bien en el móvil: los recuadros con fórmulas y gráficas crecen para que su texto quepa, y los rótulos ya no se pisan ni se cortan por el borde.', 'El dibujo de un paso se funde con el del siguiente en vez de cambiar de golpe.', 'Siete fenómenos con el dibujo rehecho, con paisaje, volumen y brillos: el detector de metales, el cargador inalámbrico, el altavoz y el motor, la pantalla táctil, la resonancia magnética, el freno magnético y la radio AM y FM.'] },
      { v: '0.8', fecha: '2026-11-03', cambios: ['Siete fenómenos nuevos: la radio AM y FM, la fibra óptica, la pantalla táctil, el freno magnético y el tren de levitación, el transformador del poste, el detector de metales y la resonancia magnética, cada uno con su animación paso a paso, su «Pruébalo tú» y su herramienta relacionada.'] },
      { v: '0.7', fecha: '2026-11-02', cambios: ['Fenómeno nuevo: el rayo, con la nube y el suelo como un condensador gigante (44 nF a 100 MV), la carga de 4,4 C, el campo que rompe el aire, el líder escalonado, la descarga de retorno de 30 kA, la energía de 220 MJ y el trueno (los segundos que tarda según la distancia), que se abre en Dieléctricos y condensadores con los datos puestos.', 'Fenómeno nuevo: las auroras boreales, con el viento solar, un electrón girando en un campo magnético (fuerza de Lorentz, radio y frecuencia de giro), la hélice que dibuja al avanzar a lo largo del campo, el espejo magnético y el cono de pérdida que decide quién llega al polo, y el choque con el oxígeno que da el verde, el rojo y el violeta, que se abre en Fuerza magnética.', 'Fenómeno nuevo: el altavoz y el motor eléctrico, con la fuerza de un campo magnético sobre una corriente (F = I L B), la bobina móvil del altavoz, el par sobre la bobina de un motor y el conmutador, que se abre en Fuerza magnética.', 'Fenómeno nuevo: la cocina de inducción, con la bobina de 25 kHz, la ley de Faraday en la base de la sartén, las corrientes de Foucault, el calor por efecto Joule (P ∝ f²) y el imán que cae despacio por un tubo de cobre, que se abre en Inducción: Faraday y Lenz.', 'Fenómeno nuevo: el cargador inalámbrico, con la bobina de la base que crea un campo alterno, el flujo en la bobina del móvil, la ley de Faraday (ε = −M dI/dt), la resonancia y el rectificador, y cómo cae la inducción mutua al separar las bobinas, que se abre en Autoinducción e inducción mutua.'] },
      { v: '0.6', fecha: '2026-11-01', cambios: ['Fenómeno nuevo: el arcoíris, con la luz del Sol, la refracción al entrar en la gota (ley de Snell), el rebote en el fondo, por qué los rayos se amontonan a 42° (desviación mínima de Descartes), los colores según el índice de refracción de cada uno y el cálculo, que se abre en Reflexión y transmisión (Fresnel) con los datos de la gota.'] },
      { v: '0.5', fecha: '2026-11-01', cambios: ['Fenómeno nuevo: por qué el cielo es azul y el atardecer rojo, con la luz del Sol, la molécula de aire como dipolo, la dispersión de Rayleigh (1/λ⁴), por qué no es violeta y la luz que sobrevive con el Sol en el horizonte, que se abre en Ondas electromagnéticas.', 'Fenómeno nuevo: el GPS y la relatividad, con el atraso de 7,2 µs al día por la velocidad del satélite, el adelanto de 45,7 µs por la gravedad, el saldo de 38,5 µs y el error de 11,5 km al día si no se corrigiera, que se abre en Física moderna.', 'Fenómeno nuevo: la tensión de paso, con la corriente de un cable caído repartiéndose por el suelo, el potencial V = ρI/2πr, la tensión entre los dos pies y la corriente por el cuerpo según lo cerca que estés, que se abre en Electrostática.', 'Fenómeno nuevo: la olla a presión y el agua en la montaña, con la presión y la temperatura de ebullición, por qué el agua hierve a unos 70 °C en el Everest y a 121 °C en una olla a presión, por qué esta cuece cuatro veces más rápido y la ecuación de Clausius-Clapeyron, que se abre en Calorimetría.'] },
      { v: '0.4', fecha: '2026-10-28', cambios: ['Fenómeno nuevo: el airbag y el cinturón, con la inercia, la energía cinética de un choque a 50 km/h y la fuerza que te frena en 5 cm o en 50 cm, el impulso y el airbag, que se abre en Trabajo y energía.', 'Fenómeno nuevo: la línea de alta tensión y el suelo, con el cable y el suelo como un condensador, el método de las imágenes, el campo eléctrico bajo la línea, el fluorescente que se enciende solo y si es peligroso, que se abre en Electrostática.'] },
      { v: '0.3', fecha: '2026-10-28', cambios: ['Fenómeno nuevo: el radar de tráfico y la sirena, con el efecto Doppler de una ambulancia que pasa (y su sonido) y el eco de las microondas de un radar, que se abre en Efecto Doppler.', 'Fenómeno nuevo: tapar la manguera con el dedo, con la ecuación de continuidad, el alcance del chorro y Bernoulli, que se abre en Fluidos.', 'Fenómeno nuevo: la datación por carbono 14, con la desintegración de primer orden, la vida media y la edad de un hueso (y el sonido de un contador Geiger), que se abre en Cinética química.', 'Fenómeno nuevo: la lluvia ácida y el pH del mar, con el pH de la lluvia limpia, los ácidos fuertes que la vuelven ácida, el tampón de los lagos sobre caliza y la acidificación del mar (con el sonido de la lluvia), que se abre en pH y valoraciones.', 'Fenómeno nuevo: por qué la luz viaja en alta tensión, con las pérdidas por efecto Joule en los cables a 230 V y a 400 kV, el transformador y la red de la central al enchufe (con el zumbido de los transformadores), que se abre en Circuitos de continua.', 'Fenómeno nuevo: la rejilla del microondas, con el agua que gira y se calienta, la onda estacionaria entre las paredes, la velocidad de la luz medida con chocolate y por qué la rejilla de la puerta deja pasar la luz pero no las microondas, que se abre en Ondas electromagnéticas.', 'Fenómeno nuevo: la jaula de Faraday, con el coche alcanzado por un rayo, la carga que se queda por fuera de un conductor, el apantallamiento y por qué no hay cobertura en el ascensor (con truenos y chispas), que se abre en Ondas electromagnéticas.'] },
      { v: '0.2', fecha: '2026-10-26', cambios: ['Dos fenómenos nuevos: la chispa al tocar el pomo, con el cuerpo como condensador y su descarga, que se abre en Transitorios, y el pájaro posado en un cable, con la ley de Ohm y las resistencias en paralelo, que se abre en Circuitos de continua.', 'Cada fenómeno trae «Un poco de historia»: de Tales de Mileto y Plinio el Viejo a Franklin, Ohm y Kirchhoff.', 'Página renovada: título más grande con etiquetas, línea de tiempo con el nombre de cada paso, el dato clave de cada paso destacado y el recuadro de la herramienta con los resultados que vas a obtener.', 'Animación más viva: la cámara se acerca a la punta del mástil y vuelve, con lluvia, relámpagos lejanos, olas y el barco que se balancea; partículas que recorren las líneas de campo, un medidor de aguja y rótulos que se escriben solos.', 'El Fuego de San Telmo brilla de verdad, con resplandor, chispas y luz sobre las velas, y en el último paso puedes cambiar el radio de la punta para ver cuándo deja de brillar. Los otros dos fenómenos también traen su «Pruébalo tú».', 'Sonido opcional (lluvia, truenos, chisporroteo y el chasquido de la chispa), apagado al abrir.'] },
      { v: '0.1', fecha: '2026-10-26', cambios: ['Primer fenómeno: el fuego de San Telmo, en 6 pasos, desde la nube de tormenta hasta la luz azul de las puntas, con el cálculo del efecto punta y un enlace que abre Electrostática con los datos puestos.'] },
    ],
  };
  // una versión con secciones (título, subtítulo y bloques de puntos) cuenta cada punto como un cambio;
  // «**texto**» es negrita y «@asignatura» pone sus herramientas (las dibuja portal.js con el catálogo)
  for (const r of Object.values(registros).flat()) if (r.secciones) r.cambios = r.secciones.flatMap((s) => s.puntos);
  const de = (h) => ({ current: registros[h][0].v, log: registros[h] });
  // Version.current y Version.log son los del simulador de electrostática
  return { registros, de, ...de('electrostatica') };
})();


/* =====================================================================
   Motor de cálculo (sin DOM). Unidades: longitud en unidades de "a",
   ε₀ = 1 internamente; los resultados se muestran como coef·símbolos/(πε₀aⁿ).
   ===================================================================== */
const Engine = (() => {
  const PI = Math.PI;

  /* ---------- Parser de expresiones: 2*sqrt(3), 5/2, -1/(4pi), √3 ---------- */
  const FUN = {
    sqrt: Math.sqrt, ln: Math.log, log: Math.log10, exp: Math.exp, abs: Math.abs,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
  };
  function parseExpr(src, unit, vars) {
    if (typeof src === 'number') return src;
    let s = String(src ?? '').trim();
    if (!s) throw new Error('vacío');
    s = s.replace(/π/g, 'pi').replace(/λ/g, 'lambda').replace(/σ/g, 'sigma').replace(/ρ/g, 'rho').replace(/ε₀|ε0|ε/g, 'eps0').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/²/g, '^2').replace(/³/g, '^3').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/,/g, '.');
    const toks = [];
    const re = /\s*(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+|[A-Za-z_][A-Za-z_0-9]*|√|[-+*/^()])/y;
    let m;
    re.lastIndex = 0;
    while (re.lastIndex < s.length) {
      const at = re.lastIndex;
      m = re.exec(s);
      if (!m) { if (/^\s*$/.test(s.slice(at))) break; throw new Error('símbolo no válido: ' + s.slice(at, at + 3)); }
      toks.push(m[1]);
    }
    let i = 0;
    const peek = () => toks[i];
    const eat = (t) => { if (toks[i] !== t) throw new Error('se esperaba ' + t); i++; };
    const startsPrimary = (t) => t !== undefined && (/^[\d.A-Za-z_(]/.test(t) || t === '√');
    function expr() {
      let v = term();
      while (peek() === '+' || peek() === '-') { const op = toks[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        const t = peek();
        if (t === '*') { i++; v *= unary(); }
        else if (t === '/') { i++; v /= unary(); }
        else if (startsPrimary(t)) v *= power();
        else return v;
      }
    }
    function unary() {
      if (peek() === '-') { i++; return -unary(); }
      if (peek() === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (peek() === '^') { i++; return Math.pow(b, unary()); }
      return b;
    }
    function primary() {
      const t = toks[i++];
      if (t === undefined) throw new Error('expresión incompleta');
      if (t === '(') { const v = expr(); eat(')'); return v; }
      if (t === '√') return power();
      if (/^[\d.]/.test(t)) return parseFloat(t);
      const id = t.toLowerCase();
      if (id === 'pi') return PI;
      if (id === 'e') return Math.E;
      if (vars && t in vars) return vars[t];
      if (unit && t === unit) return 1;
      if (FUN[id]) {
        if (peek() === '(') { i++; const v = expr(); eat(')'); return FUN[id](v); }
        return FUN[id](power());
      }
      throw new Error('desconocido: ' + t);
    }
    const v = expr();
    if (i < toks.length) throw new Error('sobra: ' + toks[i]);
    if (!isFinite(v)) throw new Error('no es un número finito');
    return v;
  }

  /* ---------- Vectores numéricos ---------- */
  const V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (a) => Math.hypot(a[0], a[1], a[2]),
  };
  V3.unit = (a) => { const n = V3.norm(a); return n ? V3.sc(a, 1 / n) : [0, 0, 0]; };

  /* ---------- Reconocer números "bonitos": (n/d)·√r ---------- */
  const RADS = [1, 2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 29, 30, 31, 33, 34, 35, 37, 38, 39, 41, 42, 43, 46, 47, 51, 53, 55];
  function rat(x, maxDen, tol = 1e-11) {
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0, y = x;
    for (let it = 0; it < 40; it++) {
      const a = Math.floor(y);
      const h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(x - h1 / k1) <= tol * Math.abs(x)) return [h1, k1];
      const f = y - a;
      if (f < 1e-14) break;
      y = 1 / f;
    }
    return null;
  }
  const MIXR = [2, 3, 5, 6, 7, 10, 15];
  // x = (a + b·√r)/d con enteros pequeños
  function identifyMix(x) {
    for (let d = 1; d <= 96; d++) {
      const X = x * d;
      for (let m = 1; m <= 60; m++) for (const sg of [1, -1]) {
        const b = sg * m;
        for (const r of MIXR) {
          const a = X - b * Math.sqrt(r), ar = Math.round(a);
          if (ar === 0 || Math.abs(ar) > 5000) continue;
          if (Math.abs(a - ar) <= 1e-10 * Math.max(Math.abs(X), Math.abs(b * Math.sqrt(r)))) {
            const g = gcd3(Math.abs(ar), m, d);
            return { mix: true, a: ar / g, b: b / g, r, d: d / g };
          }
        }
      }
    }
    return null;
  }
  const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
  const gcd3 = (a, b, c) => gcd2(gcd2(a, b), c);
  // devuelve {s, n, d, r} o {mix, a, b, r, d}; score = complejidad (menor = más simple)
  function identify(x, allowMix = true) {
    if (!isFinite(x)) return null;
    if (Math.abs(x) < 1e-12) return { s: 1, n: 0, d: 1, r: 1, score: 0 };
    const s = x < 0 ? -1 : 1, ax = Math.abs(x);
    for (const r of RADS) {
      const q = rat(ax / Math.sqrt(r), 1000, 1e-11);
      if (q && q[0] < 1e6) return { s, n: q[0], d: q[1], r, score: q[1] + (r > 1 ? 3 : 0) };
    }
    if (allowMix) { const m = identifyMix(x); if (m) return { ...m, score: m.d + 6 }; }
    const q = rat(ax, 100000, 2e-14);
    if (q && q[0] < 1e7) return { s, n: q[0], d: q[1], r: 1, score: q[1] };
    return null;
  }

  /* ---------- Ex: número exacto = parte algebraica + Σ α·ln β ---------- */
  class Ex {
    constructor(a = 0, L = []) { this.a = a; this.L = L; }
    static of(x) { return x instanceof Ex ? x : new Ex(x); }
    static ln(al, be) { const e = new Ex(0); addLn(e.L, al, be); return e; }
    value() { return this.a + this.L.reduce((s, t) => s + t.al * Math.log(t.be), 0); }
    add(o) { o = Ex.of(o); const r = new Ex(this.a + o.a, this.L.map((t) => ({ ...t }))); for (const t of o.L) addLn(r.L, t.al, t.be); return r; }
    sub(o) { return this.add(Ex.of(o).scale(-1)); }
    scale(k) { return new Ex(this.a * k, this.L.map((t) => ({ al: t.al * k, be: t.be }))); }
    mul(o) {
      o = Ex.of(o);
      if (!o.L.length) return this.scale(o.a);
      if (!this.L.length) return o.scale(this.a);
      return new Ex(this.value() * o.value());
    }
    isZero() { return Math.abs(this.value()) < 1e-13 && Math.abs(this.a) < 1e-13; }
  }
  function addLn(L, al, be) {
    if (Math.abs(al) < 1e-15 || !(be > 0) || Math.abs(Math.log(be)) < 1e-13) return;
    for (const t of L) {
      const s = Math.max(Math.abs(t.al), Math.abs(al));
      if (Math.abs(t.al - al) < 1e-9 * s) { t.be *= be; prune(L); return; }
      if (Math.abs(t.al + al) < 1e-9 * s) { t.be /= be; prune(L); return; }
    }
    L.push({ al, be });
  }
  function prune(L) { for (let i = L.length - 1; i >= 0; i--) if (Math.abs(Math.log(L[i].be)) < 1e-12) L.splice(i, 1); }

  /* ---------- Poly: combinación lineal de monomios simbólicos ---------- */
  const splitKey = (k) => (k ? k.split('*') : []);
  const joinKey = (arr) => arr.slice().sort().join('*');
  class Poly {
    constructor(m) { this.m = m || new Map(); }
    static sym(name, c = 1) { const p = new Poly(); p.m.set(name || '', Ex.of(c)); return p; }
    static num(c) { return Poly.sym('', c); }
    static zero() { return new Poly(); }
    add(o) {
      const r = new Poly(new Map(this.m));
      for (const [k, c] of o.m) r.m.set(k, r.m.has(k) ? r.m.get(k).add(c) : c);
      return r.clean();
    }
    sub(o) { return this.add(o.scale(-1)); }
    scale(k) { const r = new Poly(); for (const [kk, c] of this.m) r.m.set(kk, c.mul(k)); return r.clean(); }
    mul(o) {
      let r = new Poly();
      for (const [k1, c1] of this.m) for (const [k2, c2] of o.m) {
        const k = joinKey([...splitKey(k1), ...splitKey(k2)]);
        r = r.add(Poly.sym(k, c1.mul(c2)));
      }
      return r;
    }
    value(vals = {}) {
      let s = 0;
      for (const [k, c] of this.m) s += c.value() * splitKey(k).reduce((p, n) => p * (vals[n] ?? 1), 1);
      return s;
    }
    clean() {
      let mx = 0;
      for (const c of this.m.values()) mx = Math.max(mx, Math.abs(c.value()), Math.abs(c.a));
      for (const [k, c] of [...this.m]) if (Math.abs(c.value()) <= 1e-11 * Math.max(mx, 1e-300) && Math.abs(c.a) <= 1e-11 * Math.max(mx, 1e-300) && !c.L.length) this.m.delete(k);
      return this;
    }
    keys() { return [...this.m.keys()]; }
    isZero() { return this.m.size === 0; }
    coef(k) { return this.m.get(k) || new Ex(0); }
  }
  // Vectores de Poly
  const VP = {
    zero: () => [Poly.zero(), Poly.zero(), Poly.zero()],
    fromNum: (P, v) => v.map((x) => P.scale(x)),
    add: (a, b) => a.map((p, i) => p.add(b[i])),
    scaleP: (a, P) => a.map((p) => p.mul(P)),
    dot: (a, b) => a[0].mul(b[0]).add(a[1].mul(b[1])).add(a[2].mul(b[2])),
    cross: (a, b) => [
      a[1].mul(b[2]).sub(a[2].mul(b[1])),
      a[2].mul(b[0]).sub(a[0].mul(b[2])),
      a[0].mul(b[1]).sub(a[1].mul(b[0])),
    ],
    dotNum: (a, v) => a[0].scale(v[0]).add(a[1].scale(v[1])).add(a[2].scale(v[2])),
    value: (a, vals) => a.map((p) => p.value(vals)),
    keys: (a) => [...new Set(a.flatMap((p) => p.keys()))],
  };

  /* ---------- Tipos de símbolo (dimensiones) ---------- */
  // m: exponente tal que símbolo·a^m es una carga
  const KINDS = {
    q: { m: 0, label: 'Carga', hint: 'q', si: 'C' },
    lambda: { m: 1, label: 'Densidad lineal', hint: 'λ', si: 'C/m' },
    sigma: { m: 2, label: 'Densidad superficial', hint: 'σ', si: 'C/m²' },
    rho: { m: 3, label: 'Densidad volumétrica', hint: 'ρ', si: 'C/m³' },
    p: { m: -1, label: 'Momento dipolar', hint: 'p', si: 'C·m' },
  };
  // exponente de longitud de cada magnitud física (con ε₀ dividiendo)
  const QTY = {
    E: { L: -2, eps: true, si: 'N/C' }, V: { L: -1, eps: true, si: 'V' }, F: { L: -2, eps: true, si: 'N' },
    U: { L: -1, eps: true, si: 'J' }, T: { L: -1, eps: true, si: 'N·m' }, Phi: { L: 0, eps: true, si: 'N·m²/C' },
  };
  const EPS0 = 8.8541878128e-12;

  /* ---------- Integrales elípticas (AGM) y Gauss-Legendre ---------- */
  function ellipKE(m) {
    let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), sum = m / 2, p = 0.5;
    for (let i = 0; i < 30 && Math.abs(c) > 1e-15; i++) {
      const an = (a + b) / 2; c = (a - b) / 2; b = Math.sqrt(a * b); a = an;
      p *= 2; sum += p * c * c;
    }
    const K = PI / (2 * a);
    return [K, K * (1 - sum)];
  }
  function gaussLegendre(n) {
    const x = [], w = [];
    for (let i = 1; i <= n; i++) {
      let z = Math.cos(PI * (i - 0.25) / (n + 0.5)), pp;
      for (let it = 0; it < 100; it++) {
        let p1 = 1, p2 = 0;
        for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
        pp = n * (z * p1 - p2) / (z * z - 1);
        const z1 = z; z = z1 - p1 / pp;
        if (Math.abs(z - z1) < 1e-15) break;
      }
      x.push(z); w.push(2 / ((1 - z * z) * pp * pp));
    }
    return { x, w };
  }
  const GL = {};
  const gl = (n) => GL[n] || (GL[n] = gaussLegendre(n));


  return { PI, EPS0, parseExpr, V3, identify, Ex, Poly, VP, KINDS, QTY, splitKey, joinKey, ellipKE, gl };
})();


/* =====================================================================
   Formato: convierte números, Ex, Poly y vectores en HTML legible.
   ===================================================================== */
const Fmt = (() => {
  const { identify, KINDS, QTY, splitKey, PI, EPS0 } = Engine;
  let kinds = {}; // símbolo -> tipo (q, lambda, sigma, rho, p)
  let unit = 'a';
  let mode = 'sym';
  let order = []; // orden opcional de los símbolos en los productos (p. ej. ['q0', 'p0'])
  const setContext = (k, u, md, ord) => { kinds = k; unit = u || 'a'; mode = md || 'sym'; order = ord || []; };
  const siUnit = (qty) => QTY[qty]?.si || KINDS[qty]?.si || '';
  const siFactor = (qty) => (QTY[qty]?.eps ? 1 / EPS0 : 1);

  const GREEK = { lambda: 'λ', sigma: 'σ', rho: 'ρ', alpha: 'α', beta: 'β', mu: 'μ', eta: 'η', tau: 'τ', theta: 'θ', phi: 'φ', omega: 'ω', delta: 'δ', kappa: 'κ', gamma: 'γ', xi: 'ξ' };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function sym(name) {
    if (!name) return '';
    name = String(name).replace(/^§/, '');
    const m = String(name).match(/^([A-Za-zλσρ]+?)_?(\d*)$/);
    if (!m) return `<i>${esc(name)}</i>`;
    const base = GREEK[m[1].toLowerCase()] || m[1];
    return `<i>${esc(base)}</i>${m[2] ? `<sub>${m[2]}</sub>` : ''}`;
  }
  const sup = (n) => (n === 1 ? '' : `<sup>${n}</sup>`);
  const unitPow = (n) => (n ? `<i>${esc(unit)}</i>${sup(n)}` : '');
  function mono(key) {
    const cnt = {};
    for (const s of splitKey(key)) cnt[s] = (cnt[s] || 0) + 1;
    const rank = (s) => { const i = order.indexOf(s); return i < 0 ? order.length : i; };
    return Object.keys(cnt).sort((x, y) => rank(x) - rank(y) || (x < y ? -1 : x > y ? 1 : 0)).map((s) => sym(s) + sup(cnt[s])).join('');
  }
  const frac = (n, d) => (d ? `<span class="fr"><span class="nu">${n || '1'}</span><span class="de">${d}</span></span>` : n || '1');
  const uv = (c) => `<span class="uv">u<sub>${c}</sub></span>`;
  const MINUS = '−';

  // número bonito en línea: 3√3/16, (3 − 2√3)/32
  function mixTop(id) {
    const A = Math.abs(id.a), B = Math.abs(id.b);
    const bs = `${B !== 1 ? B : ''}√${id.r}`;
    if (id.a > 0) return { neg: false, s: `(${A} ${id.b < 0 ? MINUS : '+'} ${bs})` };
    if (id.b > 0) return { neg: false, s: `(${bs} ${MINUS} ${A})` };
    return { neg: true, s: `(${A} + ${bs})` };
  }
  function niceInline(id, withSign = true) {
    if (id.mix) { const t = mixTop(id); return (withSign && t.neg ? MINUS : '') + t.s + (id.d !== 1 ? '/' + id.d : ''); }
    const body = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}${id.d !== 1 ? '/' + id.d : ''}`;
    return (withSign && id.s < 0 ? MINUS : '') + body;
  }
  const idNeg = (id) => (id.mix ? mixTop(id).neg : id.s < 0);
  function dec(x) {
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    let s = a >= 1e4 || a < 1e-3 ? x.toExponential(3).replace('e', '·10^') : String(+x.toPrecision(4));
    s = s.replace(/·10\^([+-]?\d+)/, (_, e) => `·10<sup>${+e}</sup>`);
    return s.replace('-', MINUS);
  }
  // número geométrico (sin π ni ε₀)
  function num(x) {
    const id = identify(x);
    return id ? niceInline(id) : dec(x);
  }
  function numFrac(x) {
    const id = identify(x);
    if (!id) return dec(x);
    if (id.mix) { const t = mixTop(id); return (t.neg ? MINUS : '') + (id.d === 1 ? t.s : frac(t.s, String(id.d))); }
    const top = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}`;
    return (id.s < 0 ? MINUS : '') + (id.d === 1 ? top : frac(top, String(id.d)));
  }
  const vecNum = (v) => `(${v.map(num).join(', ')})`;
  const pt = (v) => `(${v.map(num).join(', ')})`;

  // elige representación de un Ex: sobre π o no, con logaritmos
  // pi: 'den' (…/π), 'none', 'num' (π·…)
  function rep(ex) {
    let best = null;
    for (const pi of ['den', 'none', 'num']) {
      const k = pi === 'den' ? PI : pi === 'num' ? 1 / PI : 1;
      const a = identify(ex.a * k, !ex.L.length);
      if (!a) continue;
      const ls = ex.L.map((t) => {
        let al = t.al * k, be = t.be;
        if (be < 1) { al = -al; be = 1 / be; }
        return { al: identify(al, false), be: identify(be, false), bev: be };
      });
      if (ls.some((l) => !l.al || !l.be)) continue;
      const score = a.score + ls.reduce((s2, l) => s2 + l.al.score + l.be.score, 0) + (pi === 'num' ? 2 : 0);
      if (!best || score < best.score) best = { pi, a, ls, score };
    }
    return best || { pi: 'den', dec: ex.value() * PI };
  }
  function aExpFor(key, qty) {
    const ms = splitKey(key).reduce((s, n) => s + (KINDS[kinds[n]]?.m ?? 0), 0);
    if (QTY[qty]) return QTY[qty].L + ms;
    if (KINDS[qty]) return -KINDS[qty].m + ms;
    return 0;
  }
  const hasEps = (qty) => !!QTY[qty]?.eps;

  // un término: devuelve {neg, html} (html sin signo)
  function term(ex, key, qty) {
    if (mode === 'si') {
      const v = ex.value() * siFactor(qty);
      const syms = mono(key);
      return { neg: v < 0, html: `${dec(Math.abs(v))}${syms ? '·' + syms : ''} <span class="unit">${siUnit(qty)}</span>` };
    }
    const r = rep(ex);
    const n = aExpFor(key, qty);
    const piTop = r.pi === 'num' ? 'π' : '';
    const syms = mono(key) + (n > 0 ? unitPow(n) : '');
    const denTail = (r.pi === 'den' ? 'π' : '') + (hasEps(qty) ? 'ε<sub>0</sub>' : '') + (n < 0 ? unitPow(-n) : '');
    if (r.dec === undefined && !r.ls.length) {
      const a = r.a;
      if (a.mix) {
        // (3 − 2√3) = −√3(2 − √3): si a = ±r se saca √r factor común
        if (Math.abs(a.a) === a.r) {
          const c = a.a / a.r, B = Math.abs(a.b), C = Math.abs(c);
          const inner = `(${B} ${Math.sign(c) === Math.sign(a.b) ? '+' : MINUS} ${C !== 1 ? C : ''}√${a.r})`;
          return { neg: a.b < 0, html: `${frac(piTop + syms + '√' + a.r, `${a.d !== 1 ? a.d : ''}${denTail}`)}·${inner}` };
        }
        const t = mixTop(a);
        return { neg: t.neg, html: frac(t.s + piTop + syms, `${a.d !== 1 ? a.d : ''}${denTail}`) };
      }
      // denominador puramente numérico y sin potencias de la unidad: −(9/2)q₀
      if (!denTail && a.d !== 1 && syms && !piTop && n === 0) return { neg: a.s < 0, html: `${numFrac(Math.abs(a.s * a.n * Math.sqrt(a.r) / a.d))}${syms}` };
      const top = `${a.n !== 1 || (a.r === 1 && !syms && !piTop) ? a.n : ''}${a.r > 1 ? '√' + a.r : ''}${piTop}${syms}`;
      const den = `${a.d !== 1 ? a.d : ''}${denTail}`;
      return { neg: a.s < 0, html: frac(top, den) };
    }
    let coef, neg = false;
    if (r.dec !== undefined) { coef = dec(Math.abs(r.dec)); neg = r.dec < 0; }
    else {
      const parts = [];
      if (r.a.n) parts.push({ neg: idNeg(r.a), s: niceInline(r.a, false) });
      for (const l of r.ls) {
        const c = niceInline(l.al, false);
        parts.push({ neg: l.al.s < 0, s: `${c === '1' ? '' : c + '·'}ln ${niceInline(l.be, false)}` });
      }
      if (parts.length === 1) { neg = parts[0].neg; coef = parts[0].s; }
      else {
        if (parts.every((p) => p.neg)) { neg = true; parts.forEach((p) => (p.neg = false)); }
        coef = '(' + parts.map((p, i) => (i ? (p.neg ? ` ${MINUS} ` : ' + ') : p.neg ? MINUS : '') + p.s).join('') + ')';
      }
    }
    const tail = frac(piTop + syms, denTail);
    return { neg, html: `${coef}${tail === '1' ? '' : '·' + tail}` };
  }
  function joinTerms(ts) {
    if (!ts.length) return '0';
    return ts.map((t, i) => (i === 0 ? (t.neg ? MINUS : '') : t.neg ? ` ${MINUS} ` : ' + ') + t.html).join('');
  }
  function poly(P, qty) {
    return factorLog(P, qty) || joinTerms(P.keys().sort().map((k) => term(P.coef(k), k, qty)));
  }

  // ln β con la base más pequeña posible: ln 8 → 3·ln 2
  function lnBase(al, be) {
    if (be < 1) { al = -al; be = 1 / be; }
    for (let k = 6; k >= 2; k--) {
      const id = identify(be ** (1 / k), false);
      if (id && id.r === 1 && id.d <= 20 && id.n <= 1000 && id.n !== id.d) return { al: al * k, be: id.n / id.d };
    }
    return { al, be };
  }
  // Un solo logaritmo y algún término algebraico: se saca factor común el coeficiente del
  // logaritmo, como en los solucionarios: −(4σa/ε₀)(3/8 + ln 2), (1/2πε₀)(λ ln 2 − b/4a²)
  function factorLog(P, qty) {
    if (mode === 'si') return null;
    const keys = P.keys(), alg = [], logs = [];
    for (const k of keys) {
      const ex = P.coef(k);
      if (Math.abs(ex.a) > 1e-14) alg.push({ k, v: ex.a });
      for (const t of ex.L) logs.push({ k, ...lnBase(t.al, t.be) });
    }
    if (logs.length !== 1 || !alg.length) return null;
    const lg = logs[0], same = keys.length === 1, eps0 = hasEps(qty) ? 'ε<sub>0</sub>' : '';
    for (const piDen of [true, false]) {
      const al = identify(Math.abs(lg.al) * (piDen ? PI : 1), false);
      if (!al || al.r !== 1 || al.d > 100) continue;
      const be = identify(lg.be, false);
      const items = alg.map((o) => ({ ...o, id: identify(o.v / lg.al, false) }));
      if (!be || items.some((o) => !o.id || o.id.d > 1000)) continue;
      const neg = lg.al < 0, n0 = aExpFor(lg.k, qty);
      // factor de fuera: coeficiente del logaritmo (y símbolos si todos los términos los comparten)
      const top = `${al.n !== 1 || !same ? al.n : ''}${same ? mono(lg.k) + (n0 > 0 ? unitPow(n0) : '') : ''}`;
      const den = `${al.d !== 1 ? al.d : ''}${piDen ? 'π' : ''}${eps0}${same && n0 < 0 ? unitPow(-n0) : ''}`;
      const inside = (k, body, isLn) => {
        if (same) return body;
        const n = aExpFor(k, qty), syms = mono(k) + (n > 0 ? unitPow(n) : '');
        if (isLn) return `${syms}${syms ? ' ' : ''}${body}${n < 0 ? '/' + unitPow(-n) : ''}`;
        return null;
      };
      const parts = items.map((o) => {
        const id = o.id;
        if (same) return { neg: id.s < 0, s: numFrac(Math.abs(o.v / lg.al)) };
        const n = aExpFor(o.k, qty);
        const t = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}`;
        const syms = mono(o.k) + (n > 0 ? unitPow(n) : '');
        return { neg: id.s < 0, s: frac((t === '1' && syms ? '' : t) + syms, `${id.d !== 1 ? id.d : ''}${n < 0 ? unitPow(-n) : ''}`) };
      });
      const lnS = { neg: false, s: inside(lg.k, `ln ${niceInline(be, false)}`, true), ln: true };
      // primero los términos positivos; si todos lo son, los algebraicos delante del logaritmo
      const all = [...parts, lnS];
      if (all.every((p) => !p.neg)) all.sort((x, y) => (x.ln ? 1 : 0) - (y.ln ? 1 : 0));
      else all.sort((x, y) => (x.neg ? 1 : 0) - (y.neg ? 1 : 0));
      const inner = all.map((p, i) => (i === 0 ? (p.neg ? MINUS : '') : p.neg ? ` ${MINUS} ` : ' + ') + p.s).join('');
      return `${neg ? MINUS : ''}${frac(top || '1', den)}·(${inner})`;
    }
    return null;
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // Suma de varios símbolos con el mismo denominador πε₀: se saca factor común el término
  // con menor potencia de la unidad, como en los solucionarios: (1/2πε₀a)(λ − 2b/(3a²√3))
  function factorSum(P, qty) {
    if (mode === 'si') return null;
    const keys = P.keys();
    if (keys.length < 2 || keys.some((k) => P.coef(k).L.length || !k)) return null;
    const ts = keys.map((k) => ({ k, v: P.coef(k).a, n: aExpFor(k, qty) }));
    const lead = ts.reduce((b, t) => (t.n > b.n || (t.n === b.n && t.v > b.v) ? t : b));
    const L = identify(Math.abs(lead.v) * PI, false);
    if (!L || L.r !== 1 || L.d > 100) return null;
    const inner = [];
    for (const t of ts) {
      const syms = mono(t.k), dn = t.n - lead.n, r = t.v / lead.v;
      if (t === lead) { inner.unshift({ neg: false, s: syms, lead: true }); continue; }
      const id = identify(Math.abs(r), false);
      if (!id || id.d > 1000) return null;
      // radical en el denominador cuando la fracción lo permite: 2√3/9 → 2/(3√3)
      let top = `${id.n !== 1 || id.r === 1 ? id.n : ''}${id.r > 1 ? '√' + id.r : ''}`, den = `${id.d !== 1 ? id.d : ''}`;
      if (id.r > 1 && id.d % id.r === 0) { top = `${id.n}`; den = `${id.d / id.r !== 1 ? id.d / id.r : ''}`; }
      const radDen = id.r > 1 && id.d % id.r === 0 ? '√' + id.r : '';
      const num = (top === '1' ? '' : top) + syms + (dn > 0 ? unitPow(dn) : '');
      inner.push({ neg: r < 0, s: frac(num || '1', `${den}${dn < 0 ? unitPow(-dn) : ''}${radDen}`) });
    }
    inner.sort((x, y) => (x.neg ? 1 : 0) - (y.neg ? 1 : 0));
    const den = `${L.d !== 1 ? L.d : ''}π${hasEps(qty) ? 'ε<sub>0</sub>' : ''}${lead.n < 0 ? unitPow(-lead.n) : ''}`;
    const top = `${L.n}${lead.n > 0 ? unitPow(lead.n) : ''}`;
    const body = inner.map((p, i) => (i === 0 ? (p.neg ? MINUS : '') : p.neg ? ` ${MINUS} ` : ' + ') + p.s).join('');
    return { neg: lead.v < 0, html: `${frac(top, den)}·(${body})` };
  }
  // vector de Poly, factorizando cuando hay un único monomio
  // opts.unitForm: si los radicales de las componentes no coinciden, escribe |v|·(û)
  function vec(vp, qty, opts = {}) {
    const keys = [...new Set(vp.flatMap((p) => p.keys()))];
    const comps = ['x', 'y', 'z'];
    if (!keys.length) return '0';
    if (mode === 'si' && keys.length === 1) {
      const k = keys[0], f = siFactor(qty);
      return `(${vp.map((p) => dec(p.coef(k).value() * f)).join(', ')})${k ? '·' + mono(k) : ''} <span class="unit">${siUnit(qty)}</span>`;
    }
    if (keys.length === 1) {
      const key = keys[0];
      const exs = vp.map((p) => p.coef(key));
      if (exs.every((e) => !e.L.length)) {
        for (const piDen of [true, false]) {
          const k = piDen ? PI : 1;
          const ids = exs.map((e) => identify(e.a * k, false));
          if (ids.some((x) => !x)) continue;
          const nz = ids.map((id, i) => ({ id, i })).filter((o) => o.id.n !== 0);
          if (!nz.length) return '0';
          const L = nz.reduce((l, o) => (l * o.id.d) / gcd(l, o.id.d), 1);
          const ints = nz.map((o) => (o.id.n * L) / o.id.d);
          let g = ints.reduce((a, b) => gcd(a, b), 0);
          const neg = nz.every((o) => o.id.s < 0);
          const n = aExpFor(key, qty);
          // si hay un solo componente o todos llevan el mismo radical, el radical sale fuera
          const single = nz.length === 1;
          const r0 = nz[0].id.r, sameRad = r0 > 1 && nz.every((o) => o.id.r === r0);
          if (opts.unitForm && !sameRad && !single && nz.some((o) => o.id.r !== r0)) {
            const m = Math.hypot(...exs.map((e) => e.a)), mid = identify(m * k, false);
            const us = nz.map((o) => identify(exs[o.i].a / m, false));
            if (mid && mid.r === 1 && us.every((u) => u && u.d <= 20)) {
              const syms = mono(key) + (n > 0 ? unitPow(n) : '');
              const den = `${mid.d !== 1 ? mid.d : ''}${piDen ? 'π' : ''}${hasEps(qty) ? 'ε<sub>0</sub>' : ''}${n < 0 ? unitPow(-n) : ''}`;
              const inner = nz.map((o, j) => (j === 0 ? (us[j].s < 0 ? MINUS : '') : us[j].s < 0 ? ` ${MINUS} ` : ' + ') + numFrac(Math.abs(exs[o.i].a / m)) + ' ' + uv(comps[o.i])).join('');
              return `${frac(`${mid.n !== 1 || !syms ? mid.n : ''}${syms}`, den)}·(${inner})`;
            }
          }
          const rad = (single || sameRad) && r0 > 1 ? '√' + r0 : '';
          const syms = mono(key) + (n > 0 ? unitPow(n) : '');
          const top = `${g !== 1 || (!syms && !rad) ? g : ''}${rad}${syms}`;
          const den = `${L !== 1 ? L : ''}${piDen ? 'π' : ''}${hasEps(qty) ? 'ε<sub>0</sub>' : ''}${n < 0 ? unitPow(-n) : ''}`;
          const front = (neg ? MINUS : '') + frac(top, den);
          if (single) return `${front} ${uv(comps[nz[0].i])}`;
          const inner = nz.map((o, j) => {
            const m = ints[j] / g;
            const sgn = (o.id.s < 0) !== neg;
            const r = sameRad ? 1 : o.id.r;
            const c = `${m !== 1 || r === 1 ? m : ''}${r > 1 ? '√' + r : ''}`;
            const c2 = m === 1 && r === 1 ? '' : c;
            return (j === 0 ? (sgn ? MINUS : '') : sgn ? ` ${MINUS} ` : ' + ') + c2 + ' ' + uv(comps[o.i]);
          }).join('');
          return `${front}·(${inner})`;
        }
      }
    }
    // caso general: componente a componente
    return joinTerms(vp.map((p, i) => {
      if (p.isZero()) return null;
      if (p.keys().length === 1) { const t = term(p.coef(p.keys()[0]), p.keys()[0], qty); return { neg: t.neg, html: `${t.html} ${uv(comps[i])}` }; }
      const fs = factorSum(p, qty);
      if (fs) return { neg: fs.neg, html: `${fs.html} ${uv(comps[i])}` };
      return { neg: false, html: `(${poly(p, qty)}) ${uv(comps[i])}` };
    }).filter(Boolean));
  }
  // módulo de un vector de un solo monomio
  function modulus(vp, qty) {
    const keys = [...new Set(vp.flatMap((p) => p.keys()))];
    if (keys.length !== 1) return null;
    const exs = vp.map((p) => p.coef(keys[0]));
    if (exs.some((e) => e.L.length)) return null;
    const m = Math.hypot(...exs.map((e) => e.a));
    if (mode === 'si') return `${dec(m * siFactor(qty))}${keys[0] ? '·' + mono(keys[0]) : ''} <span class="unit">${siUnit(qty)}</span>`;
    return term(new Engine.Ex(m), keys[0], qty).html;
  }

  return { setContext, aExpFor, hasEps, getMode: () => mode, sym, mono, frac, uv, num, numFrac, dec, vecNum, pt, poly, vec, modulus, term, joinTerms, esc, unitPow, MINUS, getUnit: () => unit };
})();


/* =====================================================================
   Física: tipos de fuente, superposición, incógnitas y preguntas.
   Para añadir un tipo de fuente nuevo basta con añadir una entrada a
   SOURCES; para una pregunta nueva, una entrada a ANALYSES.
   ===================================================================== */
const Physics = (() => {
  const { PI, parseExpr, V3, Ex, Poly, VP, KINDS } = Engine;
  const F = Fmt;
  const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const AXI = { x: 0, y: 1, z: 2 };
  const uvAxis = (k, sgn = 1) => (sgn < 0 ? F.MINUS : '') + F.uv(k);
  const E_ = 'E<sub></sub>';
  const vecE = (sub) => `<span class="vv">E</span>${sub ? `<sub>${sub}</sub>` : ''}`;
  const eps = 'ε<sub>0</sub>';

  /* --------- densidades no uniformes: ρ(r) = ρ₀ Σ cₙ (r/R)ⁿ --------- */
  const PERFILES = {
    uniforme: { t: [[0, 1]], txt: 'ρ' },
    lineal: { t: [[1, 1]], txt: 'ρ<sub>0</sub> r/R' },
    inversa: { t: [[-1, 1]], txt: 'ρ<sub>0</sub> R/r' },
    resta: { t: [[0, 1], [1, -1]], txt: 'ρ<sub>0</sub>(1 − r/R)' },
    parabola: { t: [[0, 1], [2, -1]], txt: 'ρ<sub>0</sub>(1 − r<sup>2</sup>/R<sup>2</sup>)' },
  };
  const PERF_OPC = [['uniforme', 'uniforme'], ['lineal', 'ρ₀·r/R (crece)'], ['inversa', 'ρ₀·R/r'], ['resta', 'ρ₀·(1 − r/R)'], ['parabola', 'ρ₀·(1 − r²/R²)']];
  const perfil = (src) => PERFILES[src.perfil] || PERFILES.uniforme;
  // ∫_{R1}^{r} rʹ^(n+k−1) dr / R^n para cada término (k = 3 en esferas, 2 en cilindros)
  const momento = (pf, R, R1, r, k) => pf.t.reduce((acc, [n, c]) => acc + (c * (r ** (n + k) - R1 ** (n + k))) / ((n + k) * R ** n), 0);
  // inducción en una corteza conductora: si una fuente con carga total Q está dentro del hueco, su efecto fuera del
  // hueco es el de una corteza de carga Q en el radio exterior (−Q en la cara interior, +Q en la exterior)
  function conInduccion(def, ind) {
    const d = Object.create(def);
    const dentro = (X) => V3.norm(V3.sub(X, ind.pos));
    d.E = function (g, X) {
      const r = dentro(X);
      if (r < ind.R1 - 1e-12) return def.E.call(this, g, X);
      if (r < ind.R2 - 1e-12) return [0, 0, 0];
      return V3.sc(V3.sub(X, ind.pos), ind.Q / (4 * PI * r ** 3));
    };
    d.V = function (g, X) {
      const r = dentro(X);
      if (r < ind.R1 - 1e-12) { const v = def.V.call(this, g, X); return v && v.add(new Ex(-ind.Q / (4 * PI * ind.R1) + ind.Q / (4 * PI * ind.R2))); }
      return new Ex(ind.Q / (4 * PI * Math.max(r, ind.R2)));
    };
    d.explainE = function (g, X, nm) {
      const r = dentro(X), L = r < ind.R1 - 1e-12 ? def.explainE.call(this, g, X, nm) : [];
      L.push(r < ind.R1 - 1e-12 ? `Está dentro del hueco de la corteza conductora: la carga inducida en su cara interior (−Q) no crea campo en el hueco porque la carga está centrada.`
        : r < ind.R2 - 1e-12 ? `P está dentro del conductor: la carga −Q inducida en la cara interior anula el campo de ${nm} (E = 0).`
          : `Fuera de la corteza conductora, ${nm} y la carga −Q inducida en la cara interior se anulan; queda la +Q de la cara exterior: ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, con Q = ${F.num(ind.Q / (ind.Q || 1))}·(carga de ${nm}).`);
      return L;
    };
    return d;
  }
  // campo y potencial de una curva cargada (λ(s) ds) por cuadratura de Gauss-Legendre por tramos
  function curva(pt, lam, s0, s1, X, tramos = 16) {
    const { x, w } = Engine.gl(24);
    let E = [0, 0, 0], V = 0;
    for (let k = 0; k < tramos; k++) {
      const a = s0 + ((s1 - s0) * k) / tramos, b = s0 + ((s1 - s0) * (k + 1)) / tramos;
      for (let i = 0; i < x.length; i++) {
        const t = (a + b) / 2 + ((b - a) / 2) * x[i], wt = ((b - a) / 2) * w[i] * lam(t);
        const r = V3.sub(X, pt.p(t)), n = V3.norm(r);
        if (n < 1e-9) return null;
        E = V3.add(E, V3.sc(r, (wt * pt.ds(t)) / (4 * PI * n ** 3))); V += (wt * pt.ds(t)) / (4 * PI * n);
      }
    }
    // los ceros por simetría salen como 1e-17: se limpian para que el resultado sea exacto
    const m = V3.norm(E);
    return { E: E.map((c) => (Math.abs(c) < 1e-11 * m ? 0 : c)), V };
  }

  /* --------------------------- FUENTES --------------------------- */
  const SOURCES = {
    point: {
      label: 'Carga puntual', short: 'Carga', kind: 'q', prefix: 'q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Posición' }],
      defaults: () => ({ pos: ['0', '0', '0'], s: { c: '1', sym: 'q' } }),
      geom: (src, P) => ({ pos: src.pos.map(P) }),
      E(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        if (n < 1e-9) return null;
        return V3.sc(r, 1 / (4 * PI * n ** 3));
      },
      V(g, X) { const n = V3.norm(V3.sub(X, g.pos)); return n < 1e-9 ? null : new Ex(1 / (4 * PI * n)); },
      explainE(g, X, nm) {
        const r = V3.sub(X, g.pos);
        return [`<span class="vv">r</span> = P − <span class="vv">r</span><sub>${nm}</sub> = ${F.vecNum(r)}, &nbsp;|<span class="vv">r</span>| = ${F.num(V3.norm(r))}`,
          `${vecE()} = ${F.frac('q <span class="vv">r</span>', `4π${eps}|<span class="vv">r</span>|<sup>3</sup>`)}`];
      },
      explainV(g, A, B) {
        return `V = ${F.frac('q', `4π${eps}r`)}, &nbsp; r<sub>A</sub> = ${F.num(V3.norm(V3.sub(A, g.pos)))}, r<sub>B</sub> = ${F.num(V3.norm(V3.sub(B, g.pos)))}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    line: {
      label: 'Hilo infinito', short: 'Hilo', kind: 'lambda', prefix: 'λ', absV: false,
      fields: [
        { k: 'pos', t: 'vec3', label: 'Pasa por' },
        { k: 'dir', t: 'select', label: 'Paralelo a', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] },
        { k: 'mode', t: 'select', label: 'Carga', structural: true, options: [['lambda', 'lineal λ (hilo fino)'], ['rho', 'volumétrica ρ (cilindro de radio R)'], ['sigma', 'superficial σ (tubo de radio R)']] },
        { k: 'R', t: 'expr', label: 'Radio R', show: (s) => s.mode === 'rho' || s.mode === 'sigma' },
        { k: 'R1', t: 'expr', label: 'Radio interior (0 = macizo)', show: (s) => s.mode === 'rho', optional: true },
        { k: 'perfil', t: 'select', label: 'Densidad', options: PERF_OPC, show: (s) => s.mode === 'rho' },
      ],
      defaults: () => ({ pos: ['0', '0', '0'], dir: 'z', mode: 'lambda', R: '1', s: { c: '1', sym: 'lambda' } }),
      kindOf: (src) => (src.mode === 'rho' ? 'rho' : src.mode === 'sigma' ? 'sigma' : 'lambda'),
      geom(src, P) {
        const g = { pos: src.pos.map(P), u: AX[src.dir], dir: src.dir, mode: src.mode, R: src.mode === 'rho' || src.mode === 'sigma' ? P(src.R) : 0, R1: src.mode === 'rho' && String(src.R1 ?? '').trim() ? P(src.R1) : 0, pf: perfil(src) };
        if (g.R1 >= g.R && g.R1 > 0) throw new Error('el radio interior debe ser menor que R');
        return g;
      },
      // carga por unidad de longitud dentro de un radio d (ρ = 1 o σ = 1)
      lam(g, d) { return g.mode === 'sigma' ? (d >= g.R ? 2 * PI * g.R : 0) : 2 * PI * momento(g.pf, g.R, g.R1, Math.min(Math.max(d, g.R1), g.R), 2); },
      perp(g, X) { const w = V3.sub(X, g.pos); return V3.sub(w, V3.sc(g.u, V3.dot(w, g.u))); },
      E(g, X) {
        const pv = this.perp(g, X), d = V3.norm(pv);
        if (g.mode === 'rho' || g.mode === 'sigma') {
          if (g.mode === 'sigma' && Math.abs(d - g.R) < 1e-9) return null;
          if (d < 1e-12) return [0, 0, 0];
          return V3.sc(pv, this.lam(g, d) / (2 * PI * d * d));
        }
        if (d < 1e-9) return null;
        return V3.sc(pv, 1 / (2 * PI * d * d));
      },
      V(g, X) {
        const d = V3.norm(this.perp(g, X));
        if (g.mode === 'sigma') return d <= g.R ? new Ex(0) : Ex.ln(-g.R, d / g.R);
        if (g.mode === 'rho' && g.pf === PERFILES.uniforme && g.R1 === 0) {
          if (d <= g.R) return new Ex(-d * d / 4);
          return new Ex(-g.R * g.R / 4).add(Ex.ln(-g.R * g.R / 2, d / g.R));
        }
        if (g.mode === 'rho') {
          // V(d) = −∫ E dd con V = 0 en el eje (o en R₁): para cada término ρ₀ cₙ (r/R)ⁿ
          const Vin = (x) => {
            let v = new Ex(0);
            for (const [n, c] of g.pf.t) { const k = c / ((n + 2) * g.R ** n); v = v.add(new Ex((-k * (x ** (n + 2) - g.R1 ** (n + 2))) / (n + 2))); if (g.R1 > 0) v = v.add(Ex.ln(k * g.R1 ** (n + 2), x / g.R1)); }
            return v;
          };
          if (d <= g.R1) return new Ex(0);
          if (d <= g.R) return Vin(d);
          return Vin(g.R).add(Ex.ln(-this.lam(g, g.R) / (2 * PI), d / g.R));
        }
        if (d < 1e-9) return null;
        return Ex.ln(-1 / (2 * PI), d);
      },
      explainE(g, X) {
        const pv = this.perp(g, X), d = V3.norm(pv);
        const L = [`Distancia perpendicular al eje: <span class="vv">d</span> = ${F.vecNum(pv)}, &nbsp;d = ${F.num(d)}`];
        if (g.mode === 'sigma') {
          L.push(d < g.R ? `P está dentro del tubo (d &lt; R = ${F.num(g.R)}): el cilindro de Gauss no encierra carga, ${vecE()} = 0`
            : `P está fuera del tubo (d &gt; R = ${F.num(g.R)}). Gauss: λ = 2πRσ y ${vecE()} = ${F.frac('σ R', `${eps}d`)} û<sub>d</sub>`);
        } else if (g.mode === 'rho' && (g.pf !== PERFILES.uniforme || g.R1 > 0)) {
          const zona = d < g.R1 ? 'en el hueco' : d <= g.R ? 'dentro del cilindro' : 'fuera del cilindro';
          L.push(`ρ(r) = ${g.pf.txt}${g.R1 ? `, entre R<sub>1</sub> = ${F.num(g.R1)} y R = ${F.num(g.R)}` : ''}. P está ${zona} (d = ${F.num(d)}).`);
          L.push(`Gauss en un cilindro de radio d y altura h: ${vecE()} 2π d h = ${F.frac('h', eps)} ∫ ρ(r) 2π r dr ⇒ λ<sub>enc</sub> = ${F.num(this.lam(g, d) / PI)}π (por unidad de ρ<sub>0</sub>) y ${vecE()} = ${F.frac('λ<sub>enc</sub>', `2π${eps}d`)} û<sub>d</sub>`);
        } else if (g.mode === 'rho') {
          L.push(d <= g.R
            ? `P está dentro del cilindro (d ≤ R = ${F.num(g.R)}). Gauss: ${vecE()} = ${F.frac('ρ d', `2${eps}`)} û<sub>d</sub>`
            : `P está fuera del cilindro (d &gt; R = ${F.num(g.R)}). Gauss: ${vecE()} = ${F.frac('ρ R<sup>2</sup>', `2${eps}d`)} û<sub>d</sub>`);
        } else L.push(`${vecE()} = ${F.frac('λ', `2π${eps}d`)} û<sub>d</sub>`);
        return L;
      },
      explainV(g, A, B) {
        const dA = V3.norm(this.perp(g, A)), dB = V3.norm(this.perp(g, B));
        const ds = `d<sub>A</sub> = ${F.num(dA)}, d<sub>B</sub> = ${F.num(dB)}`;
        if (g.mode === 'sigma') return `V constante dentro del tubo y V<sub>B</sub> − V<sub>A</sub> = −${F.frac('σR', eps)} ln${F.frac('d<sub>B</sub>', 'd<sub>A</sub>')} fuera; ${ds}`;
        if (g.mode === 'rho') return `Integrando ${vecE()} de A a B (${g.pf === PERFILES.uniforme && !g.R1 ? `dentro: ${F.frac('ρd', `2${eps}`)}, fuera: ${F.frac('ρR<sup>2</sup>', `2${eps}d`)}` : `con ρ(r) = ${g.pf.txt}`}); ${ds}`;
        return `V<sub>B</sub> − V<sub>A</sub> = −${F.frac('λ', `2π${eps}`)} ln${F.frac('d<sub>B</sub>', 'd<sub>A</sub>')}, &nbsp; ${ds}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    plane: {
      label: 'Plano infinito', short: 'Plano', kind: 'sigma', prefix: 'σ', absV: false,
      fields: [
        { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['x', 'eje X (plano x = cte)'], ['y', 'eje Y (plano y = cte)'], ['z', 'eje Z (plano z = cte)']] },
        { k: 'at', t: 'expr', label: 'Posición (cte)' },
      ],
      defaults: () => ({ axis: 'x', at: '0', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ k: src.axis, i: AXI[src.axis], c: P(src.at) }),
      E(g, X) {
        const dn = X[g.i] - g.c;
        if (Math.abs(dn) < 1e-12) return null;
        return V3.sc(AX[g.k], Math.sign(dn) / 2);
      },
      V(g, X) { return new Ex(-Math.abs(X[g.i] - g.c) / 2); },
      explainE(g, X) {
        const dn = X[g.i] - g.c;
        return [`P está en ${g.k} = ${F.num(X[g.i])}, ${dn > 0 ? 'por encima' : 'por debajo'} del plano ${g.k} = ${F.num(g.c)}`,
          `${vecE()} = ${F.frac('σ', `2${eps}`)} (${uvAxis(g.k, Math.sign(dn))})`];
      },
      explainV(g, A, B) {
        return `V<sub>B</sub> − V<sub>A</sub> = −${F.frac('σ', `2${eps}`)}(|${g.k}<sub>B</sub> − ${F.num(g.c)}| − |${g.k}<sub>A</sub> − ${F.num(g.c)}|)`;
      },
      anchors: () => [],
    },

    slab: {
      label: 'Lámina gruesa', short: 'Lámina', kind: 'rho', prefix: 'ρ', absV: false,
      fields: [
        { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['x', 'eje X'], ['y', 'eje Y'], ['z', 'eje Z']] },
        { k: 'at', t: 'expr', label: 'Plano central' },
        { k: 'w', t: 'expr', label: 'Anchura' },
      ],
      defaults: () => ({ axis: 'x', at: '0', w: '2', s: { c: '1', sym: 'rho' } }),
      geom: (src, P) => ({ k: src.axis, i: AXI[src.axis], c: P(src.at), w: P(src.w) }),
      E(g, X) {
        const dn = X[g.i] - g.c;
        const m = Math.abs(dn) <= g.w / 2 ? dn : (Math.sign(dn) * g.w) / 2;
        return V3.sc(AX[g.k], m);
      },
      V(g, X) {
        const dn = Math.abs(X[g.i] - g.c);
        return new Ex(dn <= g.w / 2 ? -dn * dn / 2 : -(g.w / 2) * dn + (g.w * g.w) / 8);
      },
      explainE(g, X) {
        const dn = X[g.i] - g.c;
        const inside = Math.abs(dn) <= g.w / 2;
        return [`Distancia al plano central: ${g.k} − ${F.num(g.c)} = ${F.num(dn)} (semianchura ${F.num(g.w / 2)})`,
          inside ? `P está dentro: ${vecE()} = ${F.frac('ρ d', eps)} ${F.uv(g.k)} con d = ${F.num(dn)}`
            : `P está fuera: ${vecE()} = ${F.frac('ρ w', `2${eps}`)} (${uvAxis(g.k, Math.sign(dn))})`];
      },
      explainV(g, A, B) {
        return `Integrando ${vecE()} a lo largo de ${g.k} (dentro ${F.frac('ρd', eps)}, fuera ${F.frac('ρw', `2${eps}`)})`;
      },
      anchors: () => [],
    },

    sphere: {
      label: 'Esfera / corona', short: 'Esfera', kind: 'rho', prefix: 'ρ', absV: true,
      fields: [
        { k: 'pos', t: 'vec3', label: 'Centro' },
        { k: 'R1', t: 'expr', label: 'Radio interior (0 = maciza)' },
        { k: 'R2', t: 'expr', label: 'Radio exterior' },
        { k: 'perfil', t: 'select', label: 'Densidad', options: PERF_OPC },
      ],
      defaults: () => ({ pos: ['0', '0', '0'], R1: '0', R2: '1', perfil: 'uniforme', s: { c: '1', sym: 'rho' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R1: P(src.R1), R2: P(src.R2), pf: perfil(src) }),
      Q: (g, r) => 4 * PI * momento(g.pf, g.R2, g.R1, Math.min(Math.max(r, g.R1), g.R2), 3),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < 1e-12) return [0, 0, 0];
        return V3.sc(rv, this.Q(g, r) / (4 * PI * r ** 3));
      },
      V(g, X) {
        const r = Math.max(V3.norm(V3.sub(X, g.pos)), g.R1);
        const Qt = this.Q(g, g.R2);
        if (r >= g.R2) return new Ex(Qt / (4 * PI * r));
        // V(r) = V(R₂) + ∫_r^{R₂} Q(rʹ)/(4π rʹ²) drʹ, término a término
        const sum = g.pf.t.reduce((acc, [n, c]) => acc + (c / ((n + 3) * g.R2 ** n)) * ((g.R2 ** (n + 2) - r ** (n + 2)) / (n + 2) + (g.R1 > 0 ? g.R1 ** (n + 3) * (1 / g.R2 - 1 / r) : 0)), 0);
        return new Ex(Qt / (4 * PI * g.R2) + sum);
      },
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        const zone = r >= g.R2 ? 'exterior' : r >= g.R1 ? (g.R1 ? 'dentro de la corona' : 'interior') : 'hueco interior';
        return [`r = |P − C| = ${F.num(r)} → región: ${zone}`,
          g.pf === PERFILES.uniforme ? `Gauss: ${vecE()} = ${F.frac('Q<sub>enc</sub>(r)', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, &nbsp;Q<sub>enc</sub> = ρ·${F.frac('4π', '3')}(r<sub>c</sub><sup>3</sup> − R<sub>1</sub><sup>3</sup>) = ${F.num(this.Q(g, r) / PI)}π ρ`
            : `Densidad no uniforme ρ(r) = ${g.pf.txt.replace(/R/g, 'R<sub>2</sub>')}. Gauss: ${vecE()} = ${F.frac('Q<sub>enc</sub>(r)', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>, &nbsp;Q<sub>enc</sub> = ∫ ρ(rʹ) 4π rʹ<sup>2</sup> drʹ = ${F.num(this.Q(g, r) / PI)}π ρ<sub>0</sub>`];
      },
      explainV(g, A, B) {
        return `V(r) por Gauss (V(∞) = 0), &nbsp; r<sub>A</sub> = ${F.num(V3.norm(V3.sub(A, g.pos)))}, r<sub>B</sub> = ${F.num(V3.norm(V3.sub(B, g.pos)))}`;
      },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    shell: {
      label: 'Esfera hueca (σ)', short: 'Cascarón', kind: 'sigma', prefix: 'σ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], R: '1', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R: P(src.R) }),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R - 1e-12) return [0, 0, 0];
        return V3.sc(rv, (g.R * g.R) / r ** 3);
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(r >= g.R ? (g.R * g.R) / r : g.R); },
      Qtot: (g) => 4 * PI * g.R * g.R,
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`r = |P − C| = ${F.num(r)}, R = ${F.num(g.R)} → ${r < g.R ? 'dentro' : 'fuera'}`,
          r < g.R ? `Gauss: no hay carga encerrada → ${vecE()} = 0` : `Gauss: ${vecE()} = ${F.frac('σR<sup>2</sup>', `${eps}r<sup>2</sup>`)} û<sub>r</sub> &nbsp;(Q = 4πR²σ)`];
      },
      explainV() { return `V = ${F.frac('σR<sup>2</sup>', `${eps}r`)} fuera, V = ${F.frac('σR', eps)} dentro (constante)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    conductor: {
      label: 'Esfera conductora (Q)', short: 'Conductor', kind: 'q', prefix: 'Q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], R: '1', s: { c: '1', sym: 'q' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), R: P(src.R) }),
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R - 1e-12) return [0, 0, 0];
        return V3.sc(rv, 1 / (4 * PI * r ** 3));
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(1 / (4 * PI * Math.max(r, g.R))); },
      Qtot: () => 1,
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`Conductor en equilibrio: la carga se reparte por la superficie y el interior es equipotencial.`,
          r < g.R ? `r = ${F.num(r)} &lt; R → ${vecE()} = 0` : `r = ${F.num(r)} ≥ R → ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>`];
      },
      explainV() { return `V = ${F.frac('Q', `4π${eps}r`)} fuera; V = ${F.frac('Q', `4π${eps}R`)} en todo el conductor`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    ring: {
      label: 'Anillo (λ)', short: 'Anillo', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Eje del anillo', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', s: { c: '1', sym: 'lambda' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), n: AX[src.axis], axis: src.axis, R: P(src.R) }),
      Qtot: (g) => 2 * PI * g.R,
      E(g, X) { const r = ringAt(g.R, 2 * PI * g.R, g, X); return r && r.E; },
      V(g, X) { const r = ringAt(g.R, 2 * PI * g.R, g, X); return r && new Ex(r.V); },
      explainE(g, X) {
        const { z, rho } = local(g, X);
        return rho < 1e-9 ? [`P está sobre el eje, a z = ${F.num(z)} del centro`, `${vecE()} = ${F.frac('λR z', `2${eps}(z<sup>2</sup> + R<sup>2</sup>)<sup>3/2</sup>`)} n̂`]
          : [`P está fuera del eje (ρ = ${F.num(rho)}, z = ${F.num(z)}): el campo se obtiene con integrales elípticas K(m), E(m) (resultado numérico).`];
      },
      explainV() { return `En el eje: V = ${F.frac('λR', `2${eps}√(z<sup>2</sup> + R<sup>2</sup>)`)}`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    disk: {
      label: 'Disco (σ)', short: 'Disco', kind: 'sigma', prefix: 'σ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Eje del disco', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']] }, { k: 'R', t: 'expr', label: 'Radio R' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', s: { c: '1', sym: 'sigma' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), n: AX[src.axis], axis: src.axis, R: P(src.R) }),
      Qtot: (g) => PI * g.R * g.R,
      E(g, X) { const r = diskAt(g, X, true); return r && r.E; },
      V(g, X) { const r = diskAt(g, X, false); return r && new Ex(r.V); },
      explainE(g, X) {
        const { z, rho } = local(g, X);
        return rho < 1e-9 ? [`P está sobre el eje, a z = ${F.num(z)} del centro`, `${vecE()} = ${F.frac('σ', `2${eps}`)}(1 − ${F.frac('|z|', '√(z<sup>2</sup> + R<sup>2</sup>)')}) (±n̂)`]
          : [`P está fuera del eje (ρ = ${F.num(rho)}, z = ${F.num(z)}): se suman anillos de radio r′ (integración numérica).`];
      },
      explainV() { return `En el eje: V = ${F.frac('σ', `2${eps}`)}(√(z<sup>2</sup> + R<sup>2</sup>) − |z|)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    rod: {
      label: 'Varilla finita', short: 'Varilla', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'A', t: 'vec3', label: 'Extremo 1' }, { k: 'B', t: 'vec3', label: 'Extremo 2' }, { k: 'perfil', t: 'select', label: 'Densidad', options: [['uniforme', 'uniforme λ'], ['lineal', 'λ₀·s/L (0 en el extremo 1)'], ['resta', 'λ₀·(1 − s/L)']] }],
      defaults: () => ({ A: ['0', '0', '0'], B: ['0', '1', '0'], perfil: 'uniforme', s: { c: '1', sym: 'lambda' } }),
      geom(src, P) {
        const A = src.A.map(P), B = src.B.map(P), L = V3.norm(V3.sub(B, A)), perfil = ['lineal', 'resta'].includes(src.perfil) ? src.perfil : 'uniforme';
        return { A, B, L, u: V3.unit(V3.sub(B, A)), perfil };
      },
      Qtot: (g) => (g.perfil === 'uniforme' ? g.L : g.L / 2),
      // densidad no uniforme: se integra a lo largo de la varilla
      noUni(g, X) {
        const lam = g.perfil === 'lineal' ? (t) => t / g.L : (t) => 1 - t / g.L;
        return curva({ p: (t) => V3.add(g.A, V3.sc(g.u, t)), ds: () => 1 }, lam, 0, g.L, X);
      },
      loc(g, X) {
        const w = V3.sub(X, g.A), s = V3.dot(w, g.u), pv = V3.sub(w, V3.sc(g.u, s));
        return { s, pv, d: V3.norm(pv), rA: V3.norm(w), rB: V3.norm(V3.sub(X, g.B)) };
      },
      E(g, X) {
        const { s, pv, d, rA, rB } = this.loc(g, X);
        if (rA < 1e-9 || rB < 1e-9 || (d < 1e-9 && s >= 0 && s <= g.L)) return null;
        if (g.perfil !== 'uniforme') { const c = this.noUni(g, X); return c && c.E; }
        let E = V3.sc(g.u, 1 / rB - 1 / rA);
        if (d > 1e-12) E = V3.add(E, V3.sc(pv, (s / rA - (s - g.L) / rB) / (d * d)));
        return V3.sc(E, 1 / (4 * PI));
      },
      V(g, X) {
        const { s, d, rA, rB } = this.loc(g, X);
        if (d < 1e-9 && s >= 0 && s <= g.L) return null;
        if (g.perfil !== 'uniforme') { const c = this.noUni(g, X); return c && new Ex(c.V); }
        let n = rA + s, m = rB + s - g.L;
        if (n < 1e-9 || m < 1e-9) { n = rB - s + g.L; m = rA - s; }
        return Ex.ln(1 / (4 * PI), n / m);
      },
      explainE(g, X) {
        if (g.perfil !== 'uniforme') return [`Densidad no uniforme λ(s) = ${g.perfil === 'lineal' ? 'λ<sub>0</sub> s/L' : 'λ<sub>0</sub>(1 − s/L)'}, con s medido desde el extremo 1 (L = ${F.num(g.L)}).`, `d<span class="vv">E</span> = ${F.frac('λ(s) ds', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>: se integra a lo largo de la varilla (con λ(s) lineal, cada componente es una integral elemental; aquí se hace numéricamente).`];
        
        const { s, d, rA, rB } = this.loc(g, X);
        return [`Longitud L = ${F.num(g.L)}; proyección de P sobre la varilla s = ${F.num(s)}, distancia d = ${F.num(d)}, r<sub>1</sub> = ${F.num(rA)}, r<sub>2</sub> = ${F.num(rB)}`,
          `Integrando d<span class="vv">E</span> = ${F.frac('λ dl', `4π${eps}r<sup>2</sup>`)}: E<sub>∥</sub> = ${F.frac('λ', `4π${eps}`)}(${F.frac(1, 'r<sub>2</sub>')} − ${F.frac(1, 'r<sub>1</sub>')}), E<sub>⊥</sub> = ${F.frac('λ', `4π${eps}d`)}(${F.frac('s', 'r<sub>1</sub>')} − ${F.frac('s − L', 'r<sub>2</sub>')})`];
      },
      explainV(g) { return g.perfil !== 'uniforme' ? `V = ∫ ${F.frac('λ(s) ds', `4π${eps}r`)} con λ(s) = ${g.perfil === 'lineal' ? 'λ<sub>0</sub> s/L' : 'λ<sub>0</sub>(1 − s/L)'} (integral numérica)` : `V = ${F.frac('λ', `4π${eps}`)} ln${F.frac('r<sub>1</sub> + s', 'r<sub>2</sub> + s − L')}`; },
      anchors: (src, g) => [{ path: ['A'], at: g.A }, { path: ['B'], at: g.B }],
    },

    arc: {
      label: 'Arco (λ)', short: 'Arco', kind: 'lambda', prefix: 'λ', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'axis', t: 'select', label: 'Perpendicular a', options: [['z', 'eje Z (en el plano XY)'], ['y', 'eje Y (en el plano ZX)'], ['x', 'eje X (en el plano YZ)']] }, { k: 'R', t: 'expr', label: 'Radio R' }, { k: 't1', t: 'expr', label: 'Desde el ángulo (°)' }, { k: 't2', t: 'expr', label: 'Hasta el ángulo (°)' }],
      defaults: () => ({ pos: ['0', '0', '0'], axis: 'z', R: '1', t1: '0', t2: '180', s: { c: '1', sym: 'lambda' } }),
      geom(src, P) {
        const base = { z: [[1, 0, 0], [0, 1, 0]], y: [[0, 0, 1], [1, 0, 0]], x: [[0, 1, 0], [0, 0, 1]] }[src.axis] || [[1, 0, 0], [0, 1, 0]];
        const t1 = (+String(src.t1).replace(',', '.') * PI) / 180, t2 = (+String(src.t2).replace(',', '.') * PI) / 180;
        if (!isFinite(t1) || !isFinite(t2) || Math.abs(t2 - t1) < 1e-9) throw new Error('los ángulos del arco deben ser números distintos');
        return { pos: src.pos.map(P), axis: src.axis, n: AX[src.axis], e1: base[0], e2: base[1], R: P(src.R), t1: Math.min(t1, t2), t2: Math.max(t1, t2) };
      },
      Qtot: (g) => g.R * (g.t2 - g.t1),
      at(g, X) { return curva({ p: (t) => V3.add(g.pos, V3.add(V3.sc(g.e1, g.R * Math.cos(t)), V3.sc(g.e2, g.R * Math.sin(t)))), ds: () => g.R }, () => 1, g.t1, g.t2, X); },
      E(g, X) { const c = this.at(g, X); return c && c.E; },
      V(g, X) { const c = this.at(g, X); return c && new Ex(c.V); },
      explainE(g, X) {
        const dc = V3.norm(V3.sub(X, g.pos)), ang = F.num(((g.t2 - g.t1) * 180) / PI);
        return dc < 1e-9 ? [`Arco de radio R = ${F.num(g.R)} y ${ang}°; P está en el centro: todos los dl están a la misma distancia R.`, `d<span class="vv">E</span> = ${F.frac('λ R dθ', `4π${eps}R<sup>2</sup>`)}(−û<sub>r</sub>) ⇒ ${vecE()} = ${F.frac('λ', `4π${eps}R`)} ∫(−cos θ, −sen θ) dθ entre ${F.num((g.t1 * 180) / PI)}° y ${F.num((g.t2 * 180) / PI)}°`]
          : [`Arco de radio R = ${F.num(g.R)} y ${ang}°: se suman las contribuciones d<span class="vv">E</span> = ${F.frac('λ dl', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub> a lo largo del arco (integral numérica).`];
      },
      explainV(g) { return `V = ∫ ${F.frac('λ dl', `4π${eps}r`)}; en el centro, V = ${F.frac('λ θ', `4π${eps}`)} con θ = ${F.num(g.t2 - g.t1)} rad`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    hollow: {
      label: 'Corteza conductora (R₁–R₂)', short: 'Corteza', kind: 'q', prefix: 'Q', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Centro' }, { k: 'R1', t: 'expr', label: 'Radio interior R₁' }, { k: 'R2', t: 'expr', label: 'Radio exterior R₂' }],
      defaults: () => ({ pos: ['0', '0', '0'], R1: '1', R2: '2', s: { c: '1', sym: 'q' } }),
      geom(src, P) { const g = { pos: src.pos.map(P), R1: P(src.R1), R2: P(src.R2) }; if (!(g.R2 > g.R1 && g.R1 > 0)) throw new Error('debe ser 0 < R₁ < R₂'); return g; },
      Qtot: () => 1,
      E(g, X) {
        const rv = V3.sub(X, g.pos), r = V3.norm(rv);
        if (r < g.R2 - 1e-12) return [0, 0, 0];
        return V3.sc(rv, 1 / (4 * PI * r ** 3));
      },
      V(g, X) { const r = V3.norm(V3.sub(X, g.pos)); return new Ex(1 / (4 * PI * Math.max(r, g.R2))); },
      explainE(g, X) {
        const r = V3.norm(V3.sub(X, g.pos));
        return [`Corteza conductora en equilibrio: su carga neta Q va a la cara exterior (R<sub>2</sub> = ${F.num(g.R2)}); en la interior (R<sub>1</sub> = ${F.num(g.R1)}) solo aparece la carga inducida por lo que haya en el hueco.`,
          r < g.R2 ? `r = ${F.num(r)} &lt; R<sub>2</sub> → la carga neta de la cara exterior no crea campo dentro` : `r = ${F.num(r)} ≥ R<sub>2</sub> → ${vecE()} = ${F.frac('Q', `4π${eps}r<sup>2</sup>`)} û<sub>r</sub>`];
      },
      explainV() { return `V = ${F.frac('Q', `4π${eps}r`)} fuera; V = ${F.frac('Q', `4π${eps}R<sub>2</sub>`)} en el conductor y en el hueco (por su carga neta)`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },

    dipole: {
      label: 'Dipolo (fuente)', short: 'Dipolo', kind: 'p', prefix: 'p', absV: true,
      fields: [{ k: 'pos', t: 'vec3', label: 'Posición' }, { k: 'p', t: 'vec3', label: 'Dirección de p (× símbolo)' }],
      defaults: () => ({ pos: ['0', '0', '0'], p: ['1', '0', '0'], s: { c: '1', sym: 'p' } }),
      geom: (src, P) => ({ pos: src.pos.map(P), p: src.p.map(P) }),
      E(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        if (n < 1e-9) return null;
        const u = V3.sc(r, 1 / n);
        return V3.sc(V3.sub(V3.sc(u, 3 * V3.dot(g.p, u)), g.p), 1 / (4 * PI * n ** 3));
      },
      V(g, X) {
        const r = V3.sub(X, g.pos), n = V3.norm(r);
        return n < 1e-9 ? null : new Ex(V3.dot(g.p, r) / (4 * PI * n ** 3));
      },
      explainE(g, X) {
        const r = V3.sub(X, g.pos);
        return [`<span class="vv">p</span> ∝ ${F.vecNum(g.p)}; <span class="vv">r</span> = ${F.vecNum(r)}, |<span class="vv">r</span>| = ${F.num(V3.norm(r))}`,
          `${vecE()} = ${F.frac(`3(<span class="vv">p</span>·û<sub>r</sub>)û<sub>r</sub> − <span class="vv">p</span>`, `4π${eps}r<sup>3</sup>`)}`];
      },
      explainV() { return `V = ${F.frac('<span class="vv">p</span>·<span class="vv">r</span>', `4π${eps}r<sup>3</sup>`)}`; },
      anchors: (src, g) => [{ path: ['pos'], at: g.pos }],
    },
  };

  /* --------- geometría local para anillos y discos --------- */
  function local(g, X) {
    const w = V3.sub(X, g.pos), z = V3.dot(w, g.n), pv = V3.sub(w, V3.sc(g.n, z)), rho = V3.norm(pv);
    return { z, rho, er: rho > 0 ? V3.sc(pv, 1 / rho) : [0, 0, 0] };
  }
  // anillo de radio R y carga Q (ε₀ = 1): campo y potencial en X
  function ringRZ(R, Q, rho, z) {
    if (rho < 1e-9 * Math.max(R, 1)) {
      const s = z * z + R * R;
      return { Er: 0, Ez: (Q * z) / (4 * PI * s ** 1.5), V: Q / (4 * PI * Math.sqrt(s)) };
    }
    const s2 = (R + rho) ** 2 + z * z, d2 = (R - rho) ** 2 + z * z;
    if (d2 < 1e-18) return null;
    const m = (4 * R * rho) / s2;
    const [K, E] = Engine.ellipKE(m);
    const pre = (Q / (4 * PI)) * (2 / PI) / Math.sqrt(s2);
    return { V: pre * K, Ez: (pre * z * E) / d2, Er: (pre / (2 * rho)) * (((rho * rho - R * R - z * z) / d2) * E + K) };
  }
  function ringAt(R, Q, g, X) {
    const { z, rho, er } = local(g, X);
    const r = ringRZ(R, Q, rho, z);
    if (!r) return null;
    return { E: V3.add(V3.sc(g.n, r.Ez), V3.sc(er, r.Er)), V: r.V };
  }
  function diskAt(g, X, needE) {
    const { z, rho, er } = local(g, X), R = g.R;
    if (rho < 1e-9) {
      const s = Math.sqrt(z * z + R * R);
      if (Math.abs(z) < 1e-12 && needE) return null;
      return { E: V3.sc(g.n, (Math.sign(z) * (1 - Math.abs(z) / s)) / 2), V: (s - Math.abs(z)) / 2 };
    }
    if (Math.abs(z) < 1e-12 && rho < R && needE) return null;
    const { x, w } = Engine.gl(24);
    const segs = rho < R ? [[0, rho], [rho, R]] : [[0, R]];
    let Er = 0, Ez = 0, V = 0;
    for (const [a, b] of segs) for (let i = 0; i < x.length; i++) {
      const r = (a + b) / 2 + ((b - a) / 2) * x[i], wt = ((b - a) / 2) * w[i];
      const q = ringRZ(r, 2 * PI * r, rho, z);
      if (!q) continue;
      Er += q.Er * wt; Ez += q.Ez * wt; V += q.V * wt;
    }
    return { E: V3.add(V3.sc(g.n, Ez), V3.sc(er, Er)), V };
  }

  /* --------------------------- CONTEXTO --------------------------- */
  function build(scen) {
    const mode = scen.mode === 'si' ? 'si' : 'sym';
    const unit = mode === 'si' ? 'm' : scen.unit || 'a';
    normUnknown(scen);
    const P = (s) => parseExpr(s, unit);
    const errors = [];
    const kinds = {};
    const anyFree = scen.analyses.some((an) => an.unk === 'libre');
    const sources = scen.sources.map((src) => {
      const def = SOURCES[src.type];
      const o = { id: src.id, src, def, name: src.name || def.prefix, kind: def.kindOf ? def.kindOf(src) : def.kind };
      try { o.g = def.geom(src, P); } catch (e) { errors.push(`${o.name}: ${e.message}`); }
      const isUnknown = !!scen.unknown?.srcs?.includes(src.id);
      if (!isUnknown) {
        try { o.S = Poly.sym(src.s.sym, P(src.s.c)); if (!(src.s.sym in kinds)) kinds[src.s.sym] = o.kind; }
        catch (e) { errors.push(`${o.name}: ${e.message}`); }
      } else {
        o.unknown = true;
        // valor como símbolo, para las preguntas que no usan la incógnita despejada
        if (anyFree && src.s?.sym) { try { o.Sfree = Poly.sym(src.s.sym, P(src.s.c || '1')); if (!(src.s.sym in kinds)) kinds[src.s.sym] = o.kind; } catch (e) { /* sin valor simbólico */ } }
      }
      return o;
    });
    // fuentes dentro del hueco de una corteza conductora: su carga se induce en las caras
    for (const h of sources.filter((o) => o.src.type === 'hollow' && o.g)) {
      for (const o of sources) {
        if (o === h || !o.g || !o.g.pos) continue;
        const t = o.src.type, dc = V3.norm(V3.sub(o.g.pos, h.g.pos)), Rs = t === 'sphere' ? o.g.R2 : t === 'point' ? 0 : o.g.R;
        if (!['point', 'sphere', 'shell', 'conductor'].includes(t) || !(dc + Rs < h.g.R1 + 1e-9)) continue;
        if (dc > 1e-9) { errors.push(`${o.name}: dentro de la corteza ${h.name} solo se resuelven cargas centradas (la carga inducida no sería uniforme)`); continue; }
        const Q = t === 'point' ? 1 : t === 'sphere' ? o.def.Q(o.g, o.g.R2) : o.def.Qtot(o.g);
        o.def = conInduccion(o.def, { pos: h.g.pos, R1: h.g.R1, R2: h.g.R2, Q });
        o.inducida = h;
      }
    }
    for (const an of scen.analyses) {
      if (an.Q?.sym && !(an.Q.sym in kinds)) kinds[an.Q.sym] = 'q';
      if (an.sym && !(an.sym in kinds)) kinds[an.sym] = 'p';
    }
    for (const uc of scen.unknown?.conds || []) if (uc.val?.sym && !(uc.val.sym in kinds)) kinds[uc.val.sym] = 'q';
    for (const k in scen.kinds || {}) if (k in kinds) kinds[k] = scen.kinds[k];
    for (const s of sources) if (s.unknown) kinds['§' + s.name] = s.kind;
    delete kinds[''];
    const ctx = { unit, mode, P, sources, kinds, errors, order: scen.order || [] };
    F.setContext(kinds, unit, mode, ctx.order);
    return ctx;
  }
  const nameHTML = (s) => F.sym(s.name);
  const strengthHTML = (s) => (s.S ? F.poly(s.S, s.kind) : '?');
  const headHTML = (s) => { const v = strengthHTML(s), n = nameHTML(s); return v === n ? n : `${n} = ${v}`; };

  function field(ctx, X) {
    let E = VP.zero();
    const parts = [], singular = [];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.E(s.g, X);
      if (!e) { singular.push(s); continue; }
      const Ep = VP.fromNum(s.S, e);
      E = VP.add(E, Ep);
      parts.push({ s, e, Ep });
    }
    return { E, parts, singular };
  }
  function potential(ctx, X) {
    let V = Poly.zero();
    const parts = [], singular = [];
    let absolute = true;
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      if (!s.def.absV) absolute = false;
      const v = s.def.V(s.g, X);
      if (!v) { singular.push(s); continue; }
      const Vp = s.S.scale(v);
      V = V.add(Vp);
      parts.push({ s, v, Vp });
    }
    return { V, parts, singular, absolute };
  }
  function diffV(ctx, A, B) {
    const a = potential(ctx, A), b = potential(ctx, B);
    const parts = [];
    for (const pb of b.parts) {
      const pa = a.parts.find((p) => p.s === pb.s);
      if (pa) parts.push({ s: pb.s, dV: pb.Vp.sub(pa.Vp) });
    }
    return { dV: b.V.sub(a.V), parts, singular: [...a.singular, ...b.singular] };
  }
  // valores numéricos (todos los símbolos = 1) para el dibujo
  function fieldNum(ctx, X) {
    let E = [0, 0, 0];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.E(s.g, X);
      if (!e) return null;
      E = V3.add(E, V3.sc(e, s.Snum ?? (s.Snum = s.S.value())));
    }
    return E;
  }
  function potNum(ctx, X) {
    let v = 0;
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const e = s.def.V(s.g, X);
      if (!e) return NaN;
      v += e.value() * (s.Snum ?? (s.Snum = s.S.value()));
    }
    return v;
  }

  function singularWarn(list) {
    return list.length ? `<div class="warn">El punto está sobre ${list.map(nameHTML).join(', ')}: ahí el campo no está definido y se ha omitido esa contribución.</div>` : '';
  }
  function fieldSteps(ctx, X, F0) {
    const rows = F0.parts.map(({ s, Ep }) => `<li><div class="st-h">${headHTML(s)} <span class="tag">${s.def.label}</span></div>
      ${s.def.explainE(s.g, X, s.name).map((l) => `<div>${l}</div>`).join('')}
      <div class="st-r">${vecE(s.name.replace(/\D/g, '') || '')} = ${F.vec(Ep, 'E')}</div></li>`);
    return `<p>Principio de superposición: ${vecE()}(P) = Σ ${vecE('i')}, con P = ${F.pt(X)}·${F.esc(ctx.unit)}.</p><ol class="steps">${rows.join('')}</ol>
      <div class="st-r">Suma: ${vecE()}(P) = ${F.vec(F0.E, 'E')}</div>`;
  }

  /* --------------------------- INCÓGNITA --------------------------- */
  const CONDS = {
    Ecomp: { label: 'Una componente de E es nula en P', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'comp', t: 'select', label: 'Componente nula', options: [['x', 'E_x = 0'], ['y', 'E_y = 0'], ['z', 'E_z = 0']] }] },
    Epar: { label: 'E en P paralelo a una dirección (dipolo en equilibrio, fuerza paralela…)', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'd', t: 'vec3', label: 'Dirección' }] },
    Ezero: { label: 'E = 0 en P (campo nulo)', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }] },
    dV: { label: 'V_B − V_A tiene un valor dado', fields: [{ k: 'A', t: 'vec3', label: 'Punto A' }, { k: 'B', t: 'vec3', label: 'Punto B' }, { k: 'val', t: 'value', label: 'V_B − V_A =' }] },
    V: { label: 'V en P tiene un valor dado', fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'val', t: 'value', label: 'V(P) =' }] },
  };
  // admite el formato antiguo {src, cond} y el nuevo {srcs: [...], conds: [...]}
  function normUnknown(scen) {
    const u = scen.unknown;
    if (!u) return null;
    if (u.src !== undefined && !u.srcs) { scen.unknown = { srcs: u.src ? [u.src] : [], conds: u.cond ? [u.cond] : [] }; }
    scen.unknown.srcs ||= []; scen.unknown.conds ||= [];
    return scen.unknown;
  }
  function solveUnknowns(ctx, scen) {
    const u = scen.unknown;
    if (!u || !u.srcs?.length) return null;
    const us = u.srcs.map((id) => ctx.sources.find((x) => x.id === id)).filter(Boolean);
    if (!us.length) return null;
    if (us.some((s) => !s.g)) return { error: 'Alguna fuente incógnita no está bien definida.' };
    if (!u.conds.length) return { error: 'Añade al menos una condición para despejar la incógnita.' };
    const P = ctx.P;
    const xP = (j, b) => Poly.sym('§' + us[j].name, b);
    const sumX = (bs) => bs.reduce((acc, b, j) => acc.add(xP(j, 1).scale(b)), Poly.zero());
    const rows = []; // { A: Poly, b: [Ex|number], t: Poly }
    const eqs = [];
    try {
      for (const c of u.conds) {
        if (c.type === 'Ecomp' || c.type === 'Ezero' || c.type === 'Epar') {
          const X = c.P.map(P);
          const F0 = field(ctx, X);
          const bs = us.map((s) => s.def.E(s.g, X));
          if (bs.some((b) => !b)) return { error: 'Un punto de condición está sobre una fuente incógnita.' };
          const Ex3 = [0, 1, 2].map((k) => F0.E[k].add(sumX(bs.map((b) => b[k]))));
          const tot = `${vecE()}(${F.pt(X)}) = ${F.vec(Ex3, 'E')}`;
          if (c.type === 'Ecomp') {
            const k = AXI[c.comp];
            rows.push({ A: F0.E[k], b: bs.map((b) => b[k]), t: Poly.zero() });
            eqs.push(`${tot}<br>E<sub>${c.comp}</sub> = 0: ${F.poly(Ex3[k], 'E')} = 0`);
          } else if (c.type === 'Ezero') {
            for (let k = 0; k < 3; k++) rows.push({ A: F0.E[k], b: bs.map((b) => b[k]), t: Poly.zero() });
            eqs.push(`${tot} = <span class="vv">0</span>`);
          } else {
            const d = V3.unit(c.d.map(P)), dv = d.map((v) => Poly.num(v));
            const A = VP.cross(dv, F0.E), bb = bs.map((b) => V3.cross(d, b));
            for (let k = 0; k < 3; k++) rows.push({ A: A[k], b: bb.map((b) => b[k]), t: Poly.zero() });
            const lhs = [0, 1, 2].map((k) => A[k].add(sumX(bb.map((b) => b[k]))));
            eqs.push(`${tot}<br>Paralelo a ${F.vecNum(c.d.map(P))} ⇔ û × ${vecE()} = <span class="vv">0</span>: ${F.vec(lhs, 'E')} = <span class="vv">0</span>`);
          }
        } else {
          const val = c.val?.sym ? Poly.sym(c.val.sym, P(c.val.c || '0')) : Poly.num(P(c.val?.c || '0'));
          if (c.type === 'dV') {
            const Av = c.A.map(P), Bv = c.B.map(P);
            const A = diffV(ctx, Av, Bv).dV;
            const bs = us.map((s) => { const vb = s.def.V(s.g, Bv), va = s.def.V(s.g, Av); return vb && va ? vb.sub(va) : null; });
            if (bs.some((b) => !b)) return { error: 'A o B están sobre una fuente incógnita.' };
            rows.push({ A, b: bs, t: val });
            eqs.push(`V<sub>B</sub> − V<sub>A</sub> = ${F.poly(A.add(sumX(bs)), 'V')} = ${F.poly(val, 'V')}`);
          } else {
            const X = c.P.map(P);
            const pot = potential(ctx, X);
            if (!pot.absolute || us.some((s) => !s.def.absV)) return { error: 'Hay hilos o planos infinitos: el potencial absoluto no está definido. Usa la condición V_B − V_A.' };
            const bs = us.map((s) => s.def.V(s.g, X));
            if (bs.some((b) => !b)) return { error: 'El punto está sobre una fuente incógnita.' };
            rows.push({ A: pot.V, b: bs, t: val });
            eqs.push(`V(${F.pt(X)}) = ${F.poly(pot.V.add(sumX(bs)), 'V')} = ${F.poly(val, 'V')}`);
          }
        }
      }
    } catch (e) { return { error: e.message }; }
    const n = us.length;
    const bnum = (b) => (b instanceof Ex ? b.value() : b);
    const live = rows.filter((r) => r.b.some((b) => Math.abs(bnum(b)) > 1e-13));
    const rhs = live.map((r) => r.t.sub(r.A));
    const out = new Array(n);
    let xHTML = null, check = '';
    // caso de una incógnita y una ecuación con logaritmo: forma exacta (…)/ln β
    if (n === 1 && live.length === 1 && live[0].b[0] instanceof Ex && live[0].b[0].L.length) {
      const b = live[0].b[0];
      if (Math.abs(b.a) < 1e-14 && b.L.length === 1) {
        let { al, be } = b.L[0];
        if (be < 1) { al = -al; be = 1 / be; }
        const xp = rhs[0].scale(1 / al);
        out[0] = xp.scale(1 / Math.log(be));
        xHTML = [F.frac(F.poly(xp, us[0].kind), 'ln ' + F.num(be))];
        // relación entre símbolos, como la dan los solucionarios: σ/λ = −3 ln 2/(2πb)
        const ks = xp.keys(), Y = ks.length === 1 && ks[0] && !ks[0].includes('*') ? ks[0] : null;
        if (Y && ctx.kinds[Y]) {
          const inv = 1 / xp.coef(Y).value(), n = KINDS[ctx.kinds[Y]].m - KINDS[us[0].kind].m;
          for (const piDen of [true, false]) {
            const id = Engine.identify(inv * (piDen ? PI : 1), false);
            if (!id || id.r !== 1) continue;
            const top = `${id.n !== 1 ? id.n + ' ' : ''}ln ${F.num(be)}`;
            const den = `${id.d !== 1 ? id.d : ''}${piDen ? 'π' : ''}${n > 0 ? F.unitPow(n) : ''}`;
            const ratio = `${F.sym(Y)}/${nameHTML(us[0])} = ${id.s < 0 ? F.MINUS : ''}${F.frac(top, den || '')}${n < 0 ? F.unitPow(-n) : ''}`;
            xHTML[0] += ` &nbsp;⇔&nbsp; ${ratio}`;
            break;
          }
        }
      }
    }
    if (!out[0]) {
      if (live.length < n) return { error: `Hay ${n} incógnitas pero solo ${live.length} ecuación(es) útiles: añade condiciones.` };
      const B = live.map((r) => r.b.map((b) => (b instanceof Ex && !b.L.length ? b.a : bnum(b))));
      const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => B.reduce((s, row) => s + row[i] * row[j], 0)));
      const Mi = invert(M);
      if (!Mi) return { error: 'Las condiciones no son independientes: no bastan para determinar las incógnitas.' };
      for (let j = 0; j < n; j++) {
        let x = Poly.zero();
        live.forEach((row, i) => {
          let c = 0;
          for (let k = 0; k < n; k++) c += Mi[j][k] * B[i][k];
          if (Math.abs(c) > 1e-15) x = x.add(rhs[i].scale(c));
        });
        out[j] = x;
      }
      const res = live.reduce((s, r, i) => s + (r.A.value() + B[i].reduce((a, b, j) => a + b * out[j].value(), 0) - r.t.value()) ** 2, 0);
      const scale = live.reduce((s, r) => s + r.A.value() ** 2 + r.t.value() ** 2, 0) + 1e-30;
      if (res > 1e-10 * scale) check = `<div class="warn">Las condiciones no se pueden cumplir todas a la vez; se muestra la solución que mejor se aproxima (mínimos cuadrados).</div>`;
    }
    us.forEach((s, j) => { s.S = out[j]; s.unknownSolved = true; });
    const lines = us.map((s, j) => `${nameHTML(s)} = ${xHTML?.[j] || F.poly(out[j], s.kind)}`);
    return {
      html: lines.join('<br>'),
      steps: `<p>Incógnitas: ${us.map(nameHTML).join(', ')}. Cada condición da una o varias ecuaciones lineales en ellas:</p>${eqs.map((e) => `<div class="eq">${e}</div>`).join('')}${check}<div class="st-r">⇒ ${lines.join(', &nbsp;')}</div>`,
      answers: us.map((s, j) => ({ label: s.name, qty: s.kind, val: out[j] })),
    };
  }
  function invert(M) {
    const n = M.length, A = M.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      const mx = Math.max(...M.map((r) => Math.max(...r.map(Math.abs))));
      if (Math.abs(A[p][c]) < 1e-12 * (mx || 1)) return null;
      [A[c], A[p]] = [A[p], A[c]];
      const d = A[c][c];
      for (let k = 0; k < 2 * n; k++) A[c][k] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r) => r.slice(n));
  }

  /* --------- Gauss: carga encerrada exacta cuando es fácil --------- */
  function insideSurf(surf, X, tol = 1e-9) {
    const w = V3.sub(X, surf.C);
    if (surf.shape === 'sphere') { const r = V3.norm(w); return r < surf.R - tol ? 1 : r > surf.R + tol ? 0 : 0.5; }
    const z = V3.dot(w, surf.n), rho = V3.norm(V3.sub(w, V3.sc(surf.n, z)));
    if (rho > surf.R + tol || Math.abs(z) > surf.h / 2 + tol) return 0;
    if (rho < surf.R - tol && Math.abs(z) < surf.h / 2 - tol) return 1;
    return null;
  }
  function qencExact(s, surf) {
    const g = s.g, t = s.src.type;
    if (s.inducida) return null;
    if (t === 'hollow') {
      if (surf.shape !== 'sphere') return null;
      const dc = V3.norm(V3.sub(g.pos, surf.C));
      return dc + g.R2 < surf.R - 1e-9 ? new Ex(1) : dc > surf.R + g.R2 + 1e-9 ? new Ex(0) : dc < 1e-12 && surf.R < g.R2 ? new Ex(0) : null;
    }
    if (t === 'point') { const k = insideSurf(surf, g.pos); return k === null ? null : new Ex(k); }
    if (t === 'dipole') return insideSurf(surf, g.pos) !== null ? new Ex(0) : null;
    if (['sphere', 'shell', 'conductor', 'ring', 'disk'].includes(t)) {
      const Rs = t === 'sphere' ? g.R2 : g.R;
      const Qt = t === 'sphere' ? s.def.Q(g, g.R2) : s.def.Qtot(g);
      if (surf.shape === 'sphere') {
        const dc = V3.norm(V3.sub(g.pos, surf.C));
        if (dc + Rs < surf.R - 1e-9) return new Ex(Qt);
        if (dc > surf.R + Rs + 1e-9) return new Ex(0);
        if (t === 'sphere' && dc < 1e-12) return new Ex(s.def.Q(g, surf.R));
      }
      return null;
    }
    if (t === 'arc') return null;
    if (t === 'line' && g.mode === 'lambda') {
      const w = V3.sub(surf.C, g.pos), dpar = V3.dot(w, g.u), dist = V3.norm(V3.sub(w, V3.sc(g.u, dpar)));
      if (surf.shape === 'sphere') return new Ex(dist < surf.R ? 2 * Math.sqrt(surf.R ** 2 - dist ** 2) : 0);
      if (Math.abs(Math.abs(V3.dot(g.u, surf.n)) - 1) < 1e-12) return new Ex(dist < surf.R ? surf.h : 0);
      return null;
    }
    if (t === 'plane') {
      const dist = Math.abs(surf.C[g.i] - g.c);
      if (surf.shape === 'sphere') return dist < surf.R ? new Ex(PI * (surf.R ** 2 - dist ** 2)) : new Ex(0);
      if (surf.n[g.i] === 1) return new Ex(dist < surf.h / 2 ? PI * surf.R ** 2 : 0);
      return null;
    }
    return null;
  }
  function fluxNum(def, g, surf) {
    const { x, w } = Engine.gl(40), NF = 96, dphi = (2 * PI) / NF;
    let phi = 0;
    const add = (X, nrm, wt) => { const e = def.E(g, X); if (e) phi += V3.dot(e, nrm) * wt; };
    if (surf.shape === 'sphere') {
      for (let i = 0; i < x.length; i++) {
        const ct = x[i], st = Math.sqrt(1 - ct * ct);
        for (let j = 0; j < NF; j++) {
          const p = (j + 0.5) * dphi, nrm = [st * Math.cos(p), st * Math.sin(p), ct];
          add(V3.add(surf.C, V3.sc(nrm, surf.R)), nrm, surf.R * surf.R * w[i] * dphi);
        }
      }
      return phi;
    }
    const n = surf.n, e1 = n[0] ? [0, 1, 0] : [1, 0, 0], e2 = V3.cross(n, e1), hh = surf.h / 2;
    for (let i = 0; i < x.length; i++) for (let j = 0; j < NF; j++) {
      const p = (j + 0.5) * dphi, rad = V3.add(V3.sc(e1, Math.cos(p)), V3.sc(e2, Math.sin(p)));
      const z = hh * x[i];
      add(V3.add(V3.add(surf.C, V3.sc(n, z)), V3.sc(rad, surf.R)), rad, surf.R * hh * w[i] * dphi);
      const r = (surf.R / 2) * (1 + x[i]), wr = (surf.R / 2) * w[i] * r * dphi;
      add(V3.add(V3.add(surf.C, V3.sc(n, hh)), V3.sc(rad, r)), n, wr);
      add(V3.add(V3.add(surf.C, V3.sc(n, -hh)), V3.sc(rad, r)), V3.sc(n, -1), wr);
    }
    return phi;
  }

  /* --------- Fórmula de E a lo largo de una recta (cargas, hilos y planos) ---------
     Si la recta atraviesa cargas, hilos o planos, el campo se da por tramos, como en
     los solucionarios: E⃗(z<a√3) = (…) u_z, E⃗(z>a√3) = (…) u_z; los tramos con la
     misma fórmula se juntan: E⃗(x<0) = … = E⃗(x>2b). */
  function profileFormula(ctx, P0, d, vname) {
    const v = F.sym(vname), u = (n) => F.unitPow(n);
    const tiny = (c) => Math.abs(c) < 1e-12;
    // |c|·a escrito como en los libros: a, 2b, a√3
    const withUnit = (c) => { const b = F.num(Math.abs(c)); return b === '1' ? u(1) : b.includes('√') ? u(1) + b : b + u(1); };
    const coefTxt = (c, tail, first) => {
      if (tiny(c)) return '';
      const neg = c < 0, body = F.num(Math.abs(c));
      const s = tail === null ? withUnit(c) : (body === '1' && tail ? '' : body) + tail;
      return (first ? (neg ? F.MINUS : '') : neg ? ` ${F.MINUS} ` : ' + ') + s;
    };
    // c1·v + c0 (el término positivo delante: a√3 − z)
    const lin = (c0, c1) => {
      const order = c1 < 0 && c0 > 0 ? [[c0, null], [c1, v]] : [[c1, v], [c0, null]];
      const parts = [];
      for (const [c, tl] of order) { const x = coefTxt(c, tl, !parts.length); if (x) parts.push(x); }
      return parts.join('') || '0';
    };
    const quad = (c0, c1, c2) => { const parts = []; for (const [c, tl] of [[c2, `${v}<sup>2</sup>`], [c1, `${u(1)}${v}`], [c0, u(2)]]) { const x = coefTxt(c, tl, !parts.length); if (x) parts.push(x); } return parts.join('') || '0'; };
    const posTxt = (t) => (tiny(t) ? '0' : coefTxt(t, null, true));
    const at = (t) => V3.add(P0, V3.sc(d, t));

    // cada fuente se convierte en una función del tramo (t de muestra) → piezas por componente
    const items = [], cuts = [], other = [];
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      const t = s.src.type;
      if (t === 'plane') {
        const i = s.g.i, c0 = P0[i] - s.g.c, c1 = d[i];
        if (!tiny(c1)) cuts.push(-c0 / c1);
        items.push((tm) => { const dn = c0 + c1 * tm; return tiny(dn) ? [] : [{ k: i, plane: s.S.scale(Math.sign(dn) / 2) }]; });
        continue;
      }
      let r0, r1, kind;
      if (t === 'point') { r0 = V3.sub(P0, s.g.pos); r1 = d; kind = 'point'; }
      else if (t === 'line' && s.g.mode === 'lambda') {
        const perp = (w) => V3.sub(w, V3.sc(s.g.u, V3.dot(w, s.g.u)));
        r0 = perp(V3.sub(P0, s.g.pos)); r1 = perp(d); kind = 'line';
      } else { other.push(nameHTML(s)); continue; }
      const S = s.S, n1 = V3.norm(r1);
      if (n1 > 1e-12 && V3.norm(V3.cross(r0, r1)) < 1e-9 * (V3.norm(r0) * n1 + 1e-30)) {
        // la recta pasa por la carga o corta al hilo: distancia con signo s(t) = s0 + n1·t
        const e = V3.sc(r1, 1 / n1), s0 = V3.dot(r0, r1) / n1;
        cuts.push(-s0 / n1);
        items.push((tm) => {
          const sg = Math.sign(s0 + n1 * tm), out = [];
          for (let k = 0; k < 3; k++) {
            if (tiny(e[k])) continue;
            if (kind === 'point') out.push({ k, S, c: sg * e[k], num: '1', den: `4π${eps}(${lin(sg * s0, sg * n1)})<sup>2</sup>` });
            else out.push({ k, S, c: e[k], num: '1', den: `2π${eps}(${lin(s0, n1)})` });
          }
          return out;
        });
        continue;
      }
      const c0 = V3.dot(r0, r0), c1 = 2 * V3.dot(r0, r1), c2 = V3.dot(r1, r1);
      const sq = c2 > 1e-12 && Math.abs(c1 * c1 - 4 * c0 * c2) < 1e-9 * (c1 * c1 + c0 * c2 + 1e-30);
      const q = sq ? lin(c1 / (2 * Math.sqrt(c2)), Math.sqrt(c2)) : quad(c0, c1, c2);
      const den = kind === 'point' ? `4π${eps}${sq ? `|${q}|<sup>3</sup>` : `(${q})<sup>3/2</sup>`}` : `2π${eps}${sq ? `(${q})<sup>2</sup>` : `(${q})`}`;
      const pieces = [];
      for (let k = 0; k < 3; k++) if (!(tiny(r0[k]) && tiny(r1[k]))) pieces.push({ k, S, c: 1, num: lin(r0[k], r1[k]), den });
      items.push(() => pieces);
    }
    if (!items.length) return other.length ? `<div class="sub hint">Sin fórmula cerrada para ${other.join(', ')}: mira la gráfica.</div>` : '';

    const bps = cuts.sort((x, y) => x - y).filter((c, i, arr) => !i || c - arr[i - 1] > 1e-9);
    const ivs = [];
    if (!bps.length) ivs.push({ t: [0.37, 1.13, 2.71], label: v });
    else {
      ivs.push({ t: [bps[0] - 1, bps[0] - 2.3, bps[0] - 0.4], label: `${v}&lt;${posTxt(bps[0])}` });
      for (let i = 0; i + 1 < bps.length; i++) { const w = bps[i + 1] - bps[i]; ivs.push({ t: [0.5, 0.31, 0.77].map((f) => bps[i] + f * w), label: `${posTxt(bps[i])}&lt;${v}&lt;${posTxt(bps[i + 1])}` }); }
      const L = bps[bps.length - 1];
      ivs.push({ t: [L + 1, L + 2.3, L + 0.4], label: `${v}&gt;${posTxt(L)}` });
    }
    const piece = (p, first) => {
      const Sh = F.poly(p.S, null), simple = !/class="fr"|[+−]/.test(Sh.replace(/^−/, ''));
      const neg = (p.c < 0) !== (simple && Sh.startsWith(F.MINUS));
      const m = Math.abs(p.c), mTxt = tiny(m - 1) ? '' : F.num(m);
      const numer = p.num === '1' ? '' : /[+−]/.test(p.num.replace(/^−/, '')) ? `(${p.num})` : p.num;
      let html;
      if (simple) html = F.frac(`${mTxt}${Sh.replace(/^−/, '')}${numer}`, p.den);
      else html = `${mTxt}${mTxt ? '·' : ''}(${Sh})·${F.frac(p.num, p.den)}`;
      return { neg: simple ? neg : p.c < 0, html };
    };
    const seen = new Map();
    for (const iv of ivs) {
      const smp = iv.t.map((t) => fieldNum(ctx, at(t))).filter(Boolean);
      const big = Math.max(1e-30, ...smp.map((e) => V3.norm(e)));
      const out = [];
      for (let k = 0; k < 3; k++) {
        if (smp.length && smp.every((e) => Math.abs(e[k]) < 1e-10 * big)) continue;
        const ps = [], keys = new Set();
        let plane = Poly.zero();
        for (const it of items) for (const p of it(iv.t[0])) {
          if (p.k !== k) continue;
          if (p.plane) { plane = plane.add(p.plane); continue; }
          const prev = ps.find((x) => F.poly(x.S, null) === F.poly(p.S, null) && x.num === p.num && x.den === p.den);
          if (prev) prev.c += p.c;
          else ps.push({ ...p });
        }
        const terms = ps.filter((p) => !tiny(p.c)).map((p) => { p.S.keys().forEach((x) => keys.add(x)); return piece(p); });
        if (!plane.isZero()) { plane.keys().forEach((x) => keys.add(x)); const h = F.poly(plane, 'E'); terms.push({ neg: h.startsWith(F.MINUS), html: h.replace(/^−/, '') }); }
        if (!terms.length) continue;
        const uk = F.uv('xyz'[k]);
        if (terms.length === 1) out.push({ neg: terms[0].neg, html: `${terms[0].html} ${uk}` });
        else if (keys.size === 1) out.push({ neg: false, html: `(${F.joinTerms(terms)}) ${uk}` });
        else terms.forEach((t) => out.push({ neg: t.neg, html: `${t.html} ${uk}` }));
      }
      const html = F.joinTerms(out);
      if (seen.has(html)) seen.get(html).push(iv.label); else seen.set(html, [iv.label]);
    }
    const E = (l) => `${vecE()}(${l})`;
    const lines = [...seen].map(([html, ls]) => `<div>${E(ls[0])} = ${html}${ls.slice(1).map((l) => ` = ${E(l)}`).join('')}</div>`).join('');
    return lines + (other.length ? `<div class="sub hint">Sin fórmula cerrada para ${other.join(', ')}: mira la gráfica.</div>` : '');
  }

  /* --------- ES-3: comprobación dimensional de la respuesta del alumno --------- */
  // dimensiones como exponentes de [C, m, N]; las de la expresión se miden escalando cada unidad por 2 y viendo cómo cambia el valor
  const DIM_Q = { E: [-1, 0, 1], V: [-1, 1, 1], F: [0, 0, 1], U: [0, 1, 1], T: [0, 1, 1], Phi: [-1, 2, 1] };
  const DIM_K = { q: [1, 0, 0], lambda: [1, -1, 0], sigma: [1, -2, 0], rho: [1, -3, 0], p: [1, 1, 0] };
  const dimTxt = (d) => { const bs = ['C', 'm', 'N'], up = (n) => (n === 1 ? '' : String(n).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).replace(/\./, ',')); const pos = [], neg = []; d.forEach((n, i) => { if (n > 0) pos.push(bs[i] + up(n)); else if (n < 0) neg.push(bs[i] + up(-n)); }); return pos.length ? pos.join('·') + (neg.length ? '/' + (neg.length > 1 ? '(' + neg.join('·') + ')' : neg[0]) : '') : neg.length ? '1/' + (neg.length > 1 ? '(' + neg.join('·') + ')' : neg[0]) : '1 (sin dimensiones)'; };
  // trozos de una expresión separados por + o − fuera de paréntesis (no cuenta el signo ni el exponente)
  function trozos(src) {
    const t = []; let nivel = 0, ini = 0;
    for (let i = 0; i < src.length; i++) { const c = src[i]; if (c === '(') nivel++; else if (c === ')') nivel--; else if (nivel === 0 && (c === '+' || c === '-') && i > ini && !/[*/^(eE+-]\s*$/.test(src.slice(ini, i).replace(/\s/g, '').slice(-1)) ) { t.push(src.slice(ini, i)); ini = i + 1; } }
    t.push(src.slice(ini)); return t.map((x) => x.trim()).filter(Boolean);
  }
  function dimension(src, ctx) {
    const norm = String(src).replace(/π/g, 'pi').replace(/λ/g, 'lambda').replace(/σ/g, 'sigma').replace(/ρ/g, 'rho').replace(/ε₀|ε0|ε/g, 'eps0');
    const ids = [...new Set(norm.match(/[A-Za-z_][A-Za-z_0-9]*/g) || [])].filter((n) => !['pi', 'e'].includes(n.toLowerCase()) && !/^(sqrt|ln|log|exp|sin|cos|tan|asin|acos|atan|abs|arctan|arcsin|arccos)$/i.test(n));
    const dims = {};
    for (const n of ids) {
      if (n === 'eps0') dims[n] = [2, -2, -1];
      else if (n === 'a' || n === ctx.unit) dims[n] = [0, 1, 0];
      else { const k = ctx.kinds[n] || (DIM_K[n] ? n : null); if (!k || !DIM_K[k]) return null; dims[n] = DIM_K[k]; }
    }
    const ev = (fl) => { const vars = {}; ids.forEach((n, i) => { vars[n] = (1.3 + 0.17 * i) * 2 ** dims[n].reduce((s, d, j) => s + d * fl[j], 0); }); try { return Engine.parseExpr(norm, null, vars); } catch (e) { return NaN; } };
    const r0 = ev([0, 0, 0]); if (!isFinite(r0) || r0 === 0) return null;
    const d = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((fl) => { const q = ev(fl) / r0; return Math.log2(Math.abs(q)) ; });
    if (d.some((x) => !isFinite(x) || Math.abs(2 * x - Math.round(2 * x)) > 1e-7)) return 'mixta';
    return d.map((x) => Math.round(2 * x) / 2);
  }
  // devuelve un aviso si la respuesta no tiene las dimensiones de la magnitud pedida, o '' si cuadran o no se puede saber
  function checkDim(raw, ans, ctx) {
    if (F.getMode() === 'si' || !ctx) return '';
    const esp = DIM_Q[ans.qty] || (DIM_K[ans.qty] ? DIM_K[ans.qty] : null); if (!esp) return '';
    const piezas = trozos(raw), ds = piezas.map((x) => dimension(x, ctx));
    if (ds.some((x) => x === null)) return '';
    if (piezas.length > 1) {
      const i = ds.findIndex((x, j) => j && (x === 'mixta' || ds[0] === 'mixta' || x.some((n, k) => Math.abs(n - ds[0][k]) > 1e-7)));
      if (i > 0) return `Los sumandos no tienen las mismas dimensiones: «${piezas[0]}» sale en ${ds[0] === 'mixta' ? '¿?' : dimTxt(ds[0])} y «${piezas[i]}» en ${ds[i] === 'mixta' ? '¿?' : dimTxt(ds[i])}.`;
    }
    const d = dimension(raw, ctx); if (d === null) return '';
    if (d === 'mixta') return 'Las dimensiones de la expresión no cuadran: hay sumandos o funciones con unidades que no se pueden combinar.';
    if (d.some((n, k) => Math.abs(n - esp[k]) > 1e-7)) return `Las dimensiones no cuadran: tu expresión sale en ${dimTxt(d)} y debería salir en ${dimTxt(esp)}.`;
    return 'Las dimensiones sí cuadran: revisa el coeficiente.';
  }

  /* --------- Modo práctica: comprobar la respuesta del alumno --------- */
  function checkAnswer(ans, inputs, ctx) {
    const si = F.getMode() === 'si';
    const names = [...new Set((ans.vec || [ans.val]).flatMap((p) => p.keys()).flatMap(Engine.splitKey))];
    const trials = si ? 1 : 3;
    const comps = ans.vec ? [0, 1, 2] : [0];
    for (let tr = 0; tr < trials; tr++) {
      const vals = {}, a = si ? 1 : 0.7 + Math.random() * 0.9, e0 = si ? Engine.EPS0 : 0.6 + Math.random() * 0.9;
      for (const k of Object.keys(ctx.kinds)) vals[k] = si ? 1 : 0.6 + Math.random() * 1.3;
      for (const k of names) vals[k] ??= si ? 1 : 0.6 + Math.random() * 1.3;
      const vars = { ...vals, eps0: e0, [ctx.unit]: a, a: ctx.unit === 'a' ? a : vals.a ?? a };
      for (const k of comps) {
        const P = ans.vec ? ans.vec[k] : ans.val;
        let exp = 0;
        for (const [key, c] of P.m) {
          const n = F.aExpFor(key, ans.qty);
          exp += c.value() * Engine.splitKey(key).reduce((p, s) => p * vals[s], 1) * a ** n * (F.hasEps(ans.qty) ? 1 / e0 : 1);
        }
        const raw = String(inputs[k] ?? '').trim();
        let got;
        try { got = raw === '' ? 0 : Engine.parseExpr(raw, null, vars); } catch (e) { return { ok: false, msg: 'No entiendo la expresión: ' + e.message }; }
        const scale = Math.max(Math.abs(exp), ...comps.map(() => 0)) || 1;
        if (Math.abs(got - exp) > 2e-3 * Math.max(Math.abs(exp), 1e-12) && !(Math.abs(exp) < 1e-12 && Math.abs(got) < 1e-9 * scale)) return { ok: false, msg: (ans.vec ? `La componente ${'xyz'[k]} no coincide.` : 'No coincide.') + ' ' + checkDim(raw, ans, ctx) };
      }
    }
    return { ok: true, msg: 'Correcto' };
  }

  /* --------------------------- PREGUNTAS --------------------------- */
  // con una incógnita despejada, cada pregunta puede usarla con su valor o como símbolo
  const UNK = { k: 'unk', t: 'select', label: 'Incógnita', options: [['sust', 'con su valor despejado'], ['libre', 'como símbolo (apartado independiente)']], show: (a, sc) => !!sc?.unknown?.srcs?.length };
  const ANALYSES = {
    E: {
      label: 'Campo eléctrico en un punto', short: 'Campo E',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, UNK],
      defaults: () => ({ P: ['1', '1', '0'] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const mod = F.modulus(F0.E, 'E');
        return {
          res: `<div>${vecE()}(P) = ${F.vec(F0.E, 'E')}</div>${mod ? `<div class="sub">|${vecE()}| = ${mod}</div>` : ''}`,
          steps: singularWarn(F0.singular) + fieldSteps(ctx, X, F0),
          marks: [{ key: 'P', at: X, label: 'P', vec: VP.value(F0.E) }],
          answers: [{ label: 'E⃗(P)', qty: 'E', vec: F0.E }],
        };
      },
    },
    V: {
      label: 'Potencial en un punto', short: 'Potencial V',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }],
      defaults: () => ({ P: ['1', '0', '0'] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), pot = potential(ctx, X);
        if (!pot.absolute) return { res: `<div class="warn">Hay hilos o planos infinitos: el potencial absoluto no está definido (no se puede tomar V(∞) = 0). Usa “Diferencia de potencial”.</div>`, marks: [{ key: 'P', at: X, label: 'P' }] };
        const rows = pot.parts.map(({ s, Vp }) => `<li><div class="st-h">${headHTML(s)}</div><div>${s.def.explainV(s.g, X, X)}</div><div class="st-r">V<sub>${F.esc(s.name)}</sub> = ${F.poly(Vp, 'V')}</div></li>`);
        return {
          res: `V(P) = ${F.poly(pot.V, 'V')}`,
          steps: singularWarn(pot.singular) + `<p>Superposición con V(∞) = 0.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">V(P) = ${F.poly(pot.V, 'V')}</div>`,
          marks: [{ key: 'P', at: X, label: 'P' }],
          answers: [{ label: 'V(P)', qty: 'V', val: pot.V }],
        };
      },
    },
    dV: {
      label: 'Diferencia de potencial V_B − V_A', short: 'V_B − V_A',
      fields: [{ k: 'A', t: 'vec3', label: 'Punto A' }, { k: 'B', t: 'vec3', label: 'Punto B' }, { k: 'sense', t: 'select', label: 'Calcular', options: [['BA', 'V_B − V_A'], ['AB', 'V_A − V_B']] }, UNK],
      defaults: () => ({ A: ['1', '0', '0'], B: ['2', '0', '0'], sense: 'BA' }),
      run(an, ctx) {
        const A = an.A.map(ctx.P), B = an.B.map(ctx.P), d = diffV(ctx, A, B);
        const ab = an.sense === 'AB', sg = ab ? -1 : 1, D = d.dV.scale(sg);
        const lab = ab ? 'V<sub>A</sub> − V<sub>B</sub>' : 'V<sub>B</sub> − V<sub>A</sub>';
        const rows = d.parts.map(({ s, dV }) => `<li><div class="st-h">${headHTML(s)}</div><div>${s.def.explainV(s.g, A, B)}</div><div class="st-r">ΔV<sub>${F.esc(s.name)}</sub> = ${F.poly(dV, 'V')}</div></li>`);
        return {
          res: `${lab} = ${F.poly(D, 'V')}`,
          steps: singularWarn(d.singular) + `<p>V<sub>B</sub> − V<sub>A</sub> = −∫<sub>A</sub><sup>B</sup> ${vecE()}·d<span class="vv">l</span>, sumando la contribución de cada fuente.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">V<sub>B</sub> − V<sub>A</sub> = ${F.poly(d.dV, 'V')}</div>${ab ? `<div class="st-r">${lab} = −(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(D, 'V')}</div>` : ''}`,
          marks: [{ key: 'A', at: A, label: 'A' }, { key: 'B', at: B, label: 'B' }],
          answers: [{ label: ab ? 'V_A − V_B' : 'V_B − V_A', qty: 'V', val: D }],
        };
      },
    },
    force: {
      label: 'Fuerza sobre una carga', short: 'Fuerza',
      fields: [{ k: 'P', t: 'vec3', label: 'Punto P' }, { k: 'Q', t: 'charge', label: 'Carga de prueba' }],
      defaults: () => ({ P: ['1', '1', '0'], Q: { c: '1', sym: 'q' } }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X), Q = Poly.sym(an.Q.sym, ctx.P(an.Q.c));
        const Fv = VP.fromNum(Q, [1, 1, 1]).map((q, i) => q.mul(F0.E[i]));
        const mod = F.modulus(Fv, 'F');
        return {
          res: `<div><span class="vv">F</span> = Q${vecE()} = ${F.vec(Fv, 'F')}</div>${mod ? `<div class="sub">|<span class="vv">F</span>| = ${mod}</div>` : ''}`,
          steps: singularWarn(F0.singular) + fieldSteps(ctx, X, F0) + `<div class="st-r"><span class="vv">F</span> = (${F.poly(Q, 'q')})·${vecE()} = ${F.vec(Fv, 'F')}</div>`,
          marks: [{ key: 'P', at: X, label: 'P', vec: VP.value(Fv) }],
          answers: [{ label: 'F⃗', qty: 'F', vec: Fv }],
        };
      },
    },
    work: {
      label: 'Trabajo para mover una carga de A a B', short: 'Trabajo',
      fields: [{ k: 'A', t: 'vec3', label: 'Desde A' }, { k: 'B', t: 'vec3', label: 'Hasta B' }, { k: 'Q', t: 'charge', label: 'Carga' }],
      defaults: () => ({ A: ['1', '0', '0'], B: ['2', '0', '0'], Q: { c: '1', sym: 'q' } }),
      run(an, ctx) {
        const A = an.A.map(ctx.P), B = an.B.map(ctx.P), d = diffV(ctx, A, B), Q = Poly.sym(an.Q.sym, ctx.P(an.Q.c));
        const W = Q.mul(d.dV);
        return {
          res: `<div>W<sub>ext</sub> = Q(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(W, 'U')}</div><div class="sub">Trabajo del campo: W<sub>campo</sub> = −W<sub>ext</sub> = ${F.poly(W.scale(-1), 'U')}</div>`,
          steps: singularWarn(d.singular) + d.parts.map(({ s, dV }) => `<div>${nameHTML(s)}: ${s.def.explainV(s.g, A, B)} → ΔV = ${F.poly(dV, 'V')}</div>`).join('') +
            `<div class="st-r">V<sub>B</sub> − V<sub>A</sub> = ${F.poly(d.dV, 'V')}</div><div class="st-r">W<sub>ext</sub> = (${F.poly(Q, 'q')})·(V<sub>B</sub> − V<sub>A</sub>) = ${F.poly(W, 'U')}</div>`,
          marks: [{ key: 'A', at: A, label: 'A' }, { key: 'B', at: B, label: 'B' }],
          answers: [{ label: 'W_ext', qty: 'U', val: W }],
        };
      },
    },
    dipole: {
      label: 'Dipolo en un punto (par, energía, equilibrio)', short: 'Dipolo en P',
      fields: [{ k: 'P', t: 'vec3', label: 'Posición' }, { k: 'p', t: 'vec3', label: 'Momento p (× símbolo)' }, { k: 'sym', t: 'sym', label: 'Símbolo' }, { k: 'rot', t: 'vec3opt', label: 'Girarlo hasta (opcional)' }],
      defaults: () => ({ P: ['0', '0', '0'], p: ['1', '0', '0'], sym: 'p', rot: ['', '', ''] }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const pn = an.p.map(ctx.P);
        const pS = Poly.sym(an.sym, 1);
        const pv = pn.map((v) => pS.scale(v));
        const tau = VP.cross(pv, F0.E), U = VP.dot(pv, F0.E).scale(-1);
        const En = VP.value(F0.E), pm = V3.norm(pn), Em = V3.norm(En);
        const crossN = V3.norm(V3.cross(pn, En)), dotN = V3.dot(pn, En);
        let eqTxt;
        if (Em < 1e-14) eqTxt = `<span class="pill"><span class="vv">E</span> = 0 en P: cualquier orientación es de equilibrio (indiferente)</span>`;
        else if (crossN < 1e-9 * pm * Em) eqTxt = dotN > 0 ? `<span class="pill ok">Equilibrio estable</span> <span class="vv">p</span> apunta como ${vecE()} (U mínima)` : `<span class="pill bad">Equilibrio inestable</span> <span class="vv">p</span> apunta contra ${vecE()} (U máxima)`;
        else eqTxt = `<span class="pill">No está en equilibrio</span> el par lo gira hacia ${vecE()}`;
        let rotHTML = '';
        const hasRot = an.rot && an.rot.some((v) => String(v).trim() !== '');
        if (hasRot) {
          const d = V3.unit(an.rot.map((v) => (String(v).trim() === '' ? 0 : ctx.P(v))));
          const pf = d.map((v) => pS.scale(v * pm));
          const Uf = VP.dot(pf, F0.E).scale(-1);
          rotHTML = `<div class="sub">Girándolo hasta ${F.vecNum(d)} (mismo |<span class="vv">p</span>|): U<sub>f</sub> = ${F.poly(Uf, 'U')}, &nbsp;W<sub>ext</sub> = U<sub>f</sub> − U<sub>i</sub> = <b>${F.poly(Uf.sub(U), 'U')}</b></div>`;
        }
        const pmod = pm === 1 ? '' : F.num(pm);
        return {
          res: `<div><span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} = ${F.vec(tau, 'T')}</div><div>U = −<span class="vv">p</span>·${vecE()} = ${F.poly(U, 'U')}</div><div class="sub">${eqTxt}</div>${rotHTML}`,
          steps: singularWarn(F0.singular.filter((s) => s.src.type !== 'dipole')) + fieldSteps(ctx, X, F0) +
            `<div class="st-r"><span class="vv">p</span> = ${F.vec(pv, 'p')} &nbsp;(|<span class="vv">p</span>| = ${pmod}${F.sym(an.sym)})</div>
             <div class="st-r">Momento de fuerzas: <span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} = ${F.vec(tau, 'T')}</div>
             <div class="st-r">Energía potencial: U = −<span class="vv">p</span>·${vecE()} = ${F.poly(U, 'U')}</div>
             <p>Equilibrio cuando <span class="vv">M</span> = 0 (<span class="vv">p</span> ∥ ${vecE()}). Estable si <span class="vv">p</span> tiene el mismo sentido que ${vecE()}; inestable si es opuesto.</p>`,
          marks: [{ key: 'P', at: X, label: 'p', vec: En, dip: pn }],
          answers: [{ label: 'M⃗', qty: 'T', vec: tau }, { label: 'U', qty: 'U', val: U }],
        };
      },
    },
    energy: {
      label: 'Energía electrostática del sistema de cargas', short: 'Energía',
      fields: [],
      defaults: () => ({}),
      run(an, ctx) {
        const pts = ctx.sources.filter((s) => s.src.type === 'point' && s.g && s.S);
        let U = Poly.zero();
        const rows = [];
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const r = V3.norm(V3.sub(pts[i].g.pos, pts[j].g.pos));
          const u = pts[i].S.mul(pts[j].S).scale(1 / (4 * PI * r));
          U = U.add(u);
          rows.push(`<li>${nameHTML(pts[i])}${nameHTML(pts[j])}: r = ${F.num(r)} → ${F.frac(`${nameHTML(pts[i])}${nameHTML(pts[j])}`, `4π${eps}r`)} = ${F.poly(u, 'U')}</li>`);
        }
        const others = ctx.sources.length - pts.length;
        return {
          res: `U = ${F.poly(U, 'U')}`,
          steps: `<p>U = Σ<sub>i&lt;j</sub> ${F.frac('q<sub>i</sub>q<sub>j</sub>', `4π${eps}r<sub>ij</sub>`)} (una vez cada pareja).</p><ol class="steps">${rows.join('')}</ol>${others ? `<div class="warn">Solo se cuentan las cargas puntuales (${others} fuente(s) de otro tipo ignoradas).</div>` : ''}`,
          marks: [],
          answers: [{ label: 'U', qty: 'U', val: U }],
        };
      },
    },
    findDipole: {
      label: 'Hallar el momento dipolar a partir del par y/o la energía', short: 'Hallar p',
      fields: [
        { k: 'P', t: 'vec3', label: 'Posición' }, { k: 'sym', t: 'sym', label: 'Símbolo de p' },
        { k: 'tau', t: 'vec3opt', label: 'Par M dado (coeficientes)' },
        { k: 'U', t: 'expr', label: 'U dada (mismo convenio, opcional)', optional: true },
        { k: 'plane', t: 'select', label: 'Restricción', options: [['none', 'ninguna'], ['z', 'en el plano XY (p_z = 0)'], ['y', 'en el plano XZ (p_y = 0)'], ['x', 'en el plano YZ (p_x = 0)']] },
      ],
      defaults: () => ({ P: ['1', '0', '0'], sym: 'b', tau: ['', '', ''], U: '', plane: 'z' }),
      run(an, ctx) {
        const X = an.P.map(ctx.P), F0 = field(ctx, X);
        const keys = VP.keys(F0.E);
        if (keys.length !== 1) return { res: `<div class="warn">Este cálculo necesita que el campo en P dependa de un solo símbolo (ahora depende de ${keys.length}).</div>` };
        const e = F0.E.map((p) => p.coef(keys[0]).value());
        const rows = [], rhs = [];
        const has = (v) => String(v ?? '').trim() !== '';
        // (p × e)_x = p_y e_z − p_z e_y, etc.
        if (an.tau.some(has)) {
          const t = an.tau.map((v) => (has(v) ? ctx.P(v) : 0));
          rows.push([0, e[2], -e[1]], [-e[2], 0, e[0]], [e[1], -e[0], 0]); rhs.push(...t);
        }
        if (has(an.U)) { rows.push([-e[0], -e[1], -e[2]]); rhs.push(ctx.P(an.U)); }
        if (an.plane !== 'none') { const r = [0, 0, 0]; r[AXI[an.plane]] = 1; rows.push(r); rhs.push(0); }
        if (!rows.length) return { res: `<div class="warn">Introduce el par <span class="vv">M</span> y/o la energía U.</div>` };
        // mínimos cuadrados: (AᵀA) p = Aᵀ b
        const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
        rows.forEach((r, k) => { for (let i = 0; i < 3; i++) { v[i] += r[i] * rhs[k]; for (let j = 0; j < 3; j++) M[i][j] += r[i] * r[j]; } });
        const p = solve3(M, v);
        if (!p) return { res: `<div class="warn">Faltan datos: con lo introducido <span class="vv">p</span> no queda determinado. Añade U o una restricción.</div>` };
        const res = rows.reduce((s, r, k) => s + (r[0] * p[0] + r[1] * p[1] + r[2] * p[2] - rhs[k]) ** 2, 0);
        const pS = Poly.sym(an.sym, 1), pv = p.map((x) => pS.scale(x));
        const Eu = V3.unit(VP.value(F0.E));
        const pm = V3.norm(p);
        return {
          res: `<div><span class="vv">p</span> = ${F.vec(pv, 'p', { unitForm: true })}</div><div class="sub">|<span class="vv">p</span>| = ${F.num(pm)}${F.sym(an.sym)}</div>${res > 1e-12 ? '<div class="warn">Los datos no son del todo compatibles; se muestra la mejor aproximación.</div>' : ''}`,
          steps: fieldSteps(ctx, X, F0) + `<p>Incógnita <span class="vv">p</span> = (p<sub>x</sub>, p<sub>y</sub>, p<sub>z</sub>). Ecuaciones: <span class="vv">M</span> = <span class="vv">p</span> × ${vecE()} (3 ecuaciones), U = −<span class="vv">p</span>·${vecE()} y la restricción elegida. Resolviendo el sistema lineal:</p><div class="st-r"><span class="vv">p</span> = ${F.vec(pv, 'p')}</div>`,
          marks: [{ key: 'P', at: X, label: 'p', vec: VP.value(F0.E), dip: p }],
          answers: [{ label: 'p⃗', qty: 'p', vec: pv }],
          action: {
            label: 'Añadir este dipolo como fuente, ya en equilibrio estable',
            make: () => ({ type: 'dipole', name: 'p', pos: an.P.slice(), p: Eu.map((x) => trimNum(x * pm)), s: { c: '1', sym: an.sym } }),
          },
        };
      },
    },
    flux: {
      label: 'Flujo de E por una superficie cerrada (Gauss)', short: 'Flujo (Gauss)',
      fields: [
        { k: 'shape', t: 'select', label: 'Superficie', structural: true, options: [['sphere', 'esfera'], ['cyl', 'cilindro']] },
        { k: 'C', t: 'vec3', label: 'Centro' }, { k: 'R', t: 'expr', label: 'Radio' },
        { k: 'axis', t: 'select', label: 'Eje', options: [['z', 'eje Z'], ['y', 'eje Y'], ['x', 'eje X']], show: (a) => a.shape === 'cyl' },
        { k: 'h', t: 'expr', label: 'Altura', show: (a) => a.shape === 'cyl' },
      ],
      defaults: () => ({ shape: 'sphere', C: ['0', '0', '0'], R: '2', axis: 'z', h: '2' }),
      run(an, ctx) {
        const surf = { shape: an.shape, C: an.C.map(ctx.P), R: ctx.P(an.R), axis: an.axis, n: AX[an.axis], h: an.shape === 'cyl' ? ctx.P(an.h) : 0 };
        let Q = Poly.zero();
        const rows = [];
        for (const s of ctx.sources) {
          if (!s.g || !s.S) continue;
          let q = qencExact(s, surf), how = 'exacto';
          if (q === null) { q = fluxNum(s.def, s.g, surf); how = 'integración numérica de E·dA'; }
          const Qi = s.S.scale(q);
          Q = Q.add(Qi);
          rows.push(`<li><div class="st-h">${headHTML(s)}</div><div>Carga encerrada (${how}): ${F.poly(Qi, 'q')}</div></li>`);
        }
        const Phi = Q.clean();
        return {
          res: `<div>Φ = ∮${vecE()}·d<span class="vv">A</span> = ${F.frac('Q<sub>enc</sub>', eps)} = ${F.poly(Phi, 'Phi')}</div><div class="sub">Q<sub>enc</sub> = ${F.poly(Phi, 'q')}</div>`,
          steps: `<p>Ley de Gauss: el flujo por una superficie cerrada solo depende de la carga encerrada. Superficie: ${an.shape === 'sphere' ? `esfera de radio ${F.num(surf.R)}` : `cilindro de radio ${F.num(surf.R)} y altura ${F.num(surf.h)}, eje ${an.axis.toUpperCase()}`} centrada en ${F.pt(surf.C)}.</p><ol class="steps">${rows.join('')}</ol><div class="st-r">Φ = ${F.poly(Phi, 'Phi')}</div>`,
          marks: [{ key: 'C', at: surf.C, label: 'C' }],
          surf,
          answers: [{ label: 'Φ', qty: 'Phi', val: Phi }],
        };
      },
    },
    profile: {
      label: 'Perfil a lo largo de una recta: E y V en función de una variable', short: 'E(z), V(z)',
      fields: [
        { k: 'P0', t: 'vec3', label: 'Punto de la recta' }, { k: 'd', t: 'vec3', label: 'Dirección' },
        { k: 'var', t: 'sym', label: 'Variable' }, { k: 't0', t: 'expr', label: 'Desde' }, { k: 't1', t: 'expr', label: 'Hasta' },
        { k: 'at', t: 'expr', label: 'Valor exacto en', optional: true }, UNK,
      ],
      defaults: () => ({ P0: ['0', '0', '0'], d: ['0', '0', '1'], var: 'z', t0: '-3', t1: '3', at: '' }),
      run(an, ctx) {
        const P0 = an.P0.map(ctx.P), d = an.d.map(ctx.P), t0 = ctx.P(an.t0), t1 = ctx.P(an.t1);
        const vname = an.var || 't';
        const at = (t) => V3.add(P0, V3.sc(d, t));
        const formula = profileFormula(ctx, P0, d, vname);
        // muestreo numérico (símbolos = 1)
        const N = 240, xs = [], Ex = [], Ey = [], Ez = [], Em = [], Vs = [];
        const absV = ctx.sources.every((s) => !s.S || s.def.absV);
        const si = F.getMode() === 'si', f = si ? 1 / Engine.EPS0 : PI;
        let V0 = null;
        for (let i = 0; i <= N; i++) {
          const t = t0 + ((t1 - t0) * i) / N, X = at(t);
          const E = fieldNum(ctx, X), V = potNum(ctx, X);
          xs.push(t);
          const ok = E && E.every(isFinite);
          Ex.push(ok ? E[0] * f : null); Ey.push(ok ? E[1] * f : null); Ez.push(ok ? E[2] * f : null); Em.push(ok ? V3.norm(E) * f : null);
          if (isFinite(V) && V0 === null) V0 = V;
          Vs.push(isFinite(V) ? (absV ? V : V - V0) * f : null);
        }
        let exact = '';
        if (String(an.at ?? '').trim() !== '') {
          const tv = ctx.P(an.at), X = at(tv), F0 = field(ctx, X), pot = potential(ctx, X);
          exact = `<div class="sub">En ${F.sym(vname)} = ${F.num(tv)}: ${vecE()} = ${F.vec(F0.E, 'E')}${pot.absolute ? `, &nbsp;V = ${F.poly(pot.V, 'V')}` : ''}</div>`;
        }
        const yl = si ? 'N/C y V' : '×(símbolo)/(πε₀)';
        return {
          res: `${formula}${exact}<canvas class="chart" aria-label="Gráfica de E y V"></canvas><div class="chart-l"></div>`,
          steps: `<p>Puntos de la recta: P(${F.sym(vname)}) = ${F.pt(P0)} + ${F.sym(vname)}·${F.vecNum(d)}. La gráfica es numérica tomando todos los símbolos = 1 ${si ? '' : '(eje vertical en unidades de símbolo/(πε₀aⁿ))'}${absV ? '' : '; V se mide respecto al primer punto porque hay hilos o planos infinitos'}.</p>`,
          marks: [{ key: 'P0', at: P0, label: 'P₀' }],
          seg: [at(t0), at(t1)],
          chart: { xs, xlabel: vname, ylabel: yl, series: [
            { name: 'E_x', ys: Ex }, { name: 'E_y', ys: Ey }, { name: 'E_z', ys: Ez }, { name: '|E|', ys: Em }, { name: absV ? 'V' : 'V − V(inicio)', ys: Vs, dashed: true },
          ] },
        };
      },
    },
  };
  function trimNum(x) {
    const id = Engine.identify(x);
    if (id) return (id.s < 0 ? '-' : '') + (id.n !== 1 || id.r === 1 ? id.n : '') + (id.r > 1 ? (id.n !== 1 ? '*' : '') + `sqrt(${id.r})` : '') + (id.d !== 1 ? '/' + id.d : '');
    return String(+x.toPrecision(8));
  }
  function solve3(M, v) {
    const A = M.map((r, i) => [...r, v[i]]);
    for (let c = 0; c < 3; c++) {
      let piv = c;
      for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-12) return null;
      [A[c], A[piv]] = [A[piv], A[c]];
      for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map((r, i) => r[3] / r[i]);
  }

  /* --------------------------- EJECUCIÓN --------------------------- */
  function run(scen) {
    const ctx = build(scen);
    const unknown = solveUnknowns(ctx, scen);
    for (const s of ctx.sources) s.Snum = s.S ? s.S.value() : 0;
    const results = scen.analyses.map((an) => {
      const def = ANALYSES[an.type];
      // «incógnita como símbolo»: la pregunta se calcula sin sustituir el valor despejado
      const swap = an.unk === 'libre' ? ctx.sources.filter((s) => s.unknown && s.Sfree) : [];
      const saved = swap.map((s) => [s.S, s.Snum]);
      swap.forEach((s) => { s.S = s.Sfree; s.Snum = s.Sfree.value(); });
      try { return def.run(an, ctx); } catch (e) { return { error: e.message }; }
      finally { swap.forEach((s, i) => { [s.S, s.Snum] = saved[i]; }); }
    });
    return { ctx, unknown, results };
  }

  return { SOURCES, ANALYSES, CONDS, run, build, checkAnswer, checkDim, normUnknown, field, potential, fieldNum, potNum, trimNum };
})();


/* =====================================================================
   Ejercicios de ejemplo precargados (enunciados propios del simulador).
   Cubren los mismos tipos de pregunta que el Tema 3; la versión privada
   cambia este archivo por privado/tema3-pdf.js (ver fuente/build.sh).
   ===================================================================== */
const Presets = (() => {
  let n = 0;
  const id = () => 'k' + ++n;
  const S = (type, name, extra, c = '1', sym) => ({ id: id(), type, name, ...extra, s: { c, sym } });
  const A = (type, extra) => ({ id: id(), type, ...extra });
  const scen = (o) => ({ unit: 'a', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, ...o });

  const list = [
    {
      key: 'p1', statement: "Cuatro partículas con la misma carga q están en los vértices de un cuadrado de lado 2a en el plano XY, en (±a, ±a, 0). Determinar: 1) la energía electrostática del sistema; 2) el campo eléctrico en cualquier punto del eje Z; 3) el momento de fuerzas sobre un dipolo p = b(u_x + u_y + u_z), que solo puede rotar, colocado en (0, 0, a).", title: '1 · Cuadrado de cuatro cargas',
      make: () => scen({
        view: { plane: 'xz', cut: '0' },
        sources: [S('point', 'q1', { pos: ['1', '1', '0'] }, '1', 'q'), S('point', 'q2', { pos: ['-1', '1', '0'] }, '1', 'q'), S('point', 'q3', { pos: ['-1', '-1', '0'] }, '1', 'q'), S('point', 'q4', { pos: ['1', '-1', '0'] }, '1', 'q')],
        analyses: [A('energy', {}), A('profile', { P0: ['0', '0', '0'], d: ['0', '0', '1'], var: 'z', t0: '-4', t1: '4', at: '' }), A('dipole', { P: ['0', '0', '1'], p: ['1', '1', '1'], sym: 'b', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'p2', statement: "Tres cargas puntuales q1 = 2q, q2 = −q y q3 = q están en los vértices de un triángulo rectángulo: q1 en el origen, q2 en (3a, 0) y q3 en (0, 4a). Obtener: 1) la energía electrostática del sistema; 2) la energía potencial de un dipolo p = p0(3u_x + 4u_y) situado en (3a, 4a).", title: '2 · Triángulo rectángulo de cargas',
      make: () => scen({
        sources: [S('point', 'q1', { pos: ['0', '0', '0'] }, '2', 'q'), S('point', 'q2', { pos: ['3', '0', '0'] }, '-1', 'q'), S('point', 'q3', { pos: ['0', '4', '0'] }, '1', 'q')],
        analyses: [A('energy', {}), A('dipole', { P: ['3', '4', '0'], p: ['3', '4', '0'], sym: 'p0', rot: ['', '', ''] })],
      }),
    },
    {
      key: 'p3', statement: "Una carga q1 = −2q0 está en (0, 2a) y una segunda carga q2, desconocida, en (3a, 0). Un dipolo p = p0(1/2 u_x + √3/2 u_y), que solo puede rotar y está en el origen, se encuentra en equilibrio. Determinar: 1) el valor de q2; 2) si el equilibrio es estable o inestable; 3) el trabajo de un agente externo para colocar el dipolo paralelo a +u_y.", title: '3 · Dipolo en equilibrio a 60°',
      make: () => {
        const q2 = S('point', 'q2', { pos: ['3', '0', '0'] }, '1', 'q0');
        return scen({
          order: ['q0', 'p0'],
          sources: [S('point', 'q1', { pos: ['0', '2', '0'] }, '-2', 'q0'), q2],
          unknown: { src: q2.id, cond: { type: 'Epar', P: ['0', '0', '0'], d: ['1/2', 'sqrt(3)/2', '0'] } },
          analyses: [A('dipole', { P: ['0', '0', '0'], p: ['1/2', 'sqrt(3)/2', '0'], sym: 'p0', rot: ['0', '1', '0'] })],
        });
      },
    },
    {
      key: 'p4', statement: "Un plano uniformemente cargado coincide con el plano XZ. Dos hilos indefinidos paralelos al eje Z cortan al plano XY en (3a, 4a), con λ1 = 2λ, y en (−3a, 4a), con λ2 = −λ. Obtener la densidad de carga del plano sabiendo que un dipolo situado en (0, a, 0) estaría en equilibrio orientado según u_x, y el campo eléctrico en ese punto.", title: '4 · Plano XZ y dos hilos',
      make: () => {
        const pl = S('plane', 'σ', { axis: 'y', at: '0' }, '1', 'sigma');
        return scen({
          sources: [pl, S('line', 'λ1', { pos: ['3', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '2', 'lambda'), S('line', 'λ2', { pos: ['-3', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '-1', 'lambda')],
          unknown: { src: pl.id, cond: { type: 'Epar', P: ['0', '1', '0'], d: ['1', '0', '0'] } },
          analyses: [A('E', { P: ['0', '1', '0'] })],
        });
      },
    },
    {
      key: 'p5', statement: "Un cilindro indefinido de radio 2a, uniformemente cargado y coaxial con el eje Z, y un plano cargado con densidad σ en y = −5a. Si en (4a, 3a, 0) se situara una carga puntual, la fuerza sería paralela al eje X. Determinar: 1) la densidad volumétrica de carga del cilindro; 2) V_B − V_A entre A(0, a, 0) y B(0, 3a, 0).", title: '5 · Cilindro grueso y plano',
      make: () => {
        const cyl = S('line', 'ρ', { pos: ['0', '0', '0'], dir: 'z', mode: 'rho', R: '2' }, '1', 'rho');
        return scen({
          sources: [cyl, S('plane', 'σ', { axis: 'y', at: '-5' }, '1', 'sigma')],
          unknown: { src: cyl.id, cond: { type: 'Epar', P: ['4', '3', '0'], d: ['1', '0', '0'] } },
          analyses: [A('E', { P: ['4', '3', '0'] }), A('dV', { A: ['0', '1', '0'], B: ['0', '3', '0'] })],
        });
      },
    },
    {
      key: 'p6', statement: "Una carga puntual q está en el origen y una esfera de radio a, uniformemente cargada, tiene su centro en (2a, 0, 0). Si el potencial en (3a, 0, 0) es q/(3πε0a), determinar la densidad de carga de la esfera y la energía potencial de un dipolo p = p(u_x + u_y) situado en (2a, 2a, 0).", title: '6 · Esfera desplazada y carga puntual',
      make: () => {
        const sph = S('sphere', 'ρ', { pos: ['2', '0', '0'], R1: '0', R2: '1' }, '1', 'rho');
        return scen({
          sources: [S('point', 'q', { pos: ['0', '0', '0'] }, '1', 'q'), sph],
          unknown: { src: sph.id, cond: { type: 'V', P: ['3', '0', '0'], val: { c: '1/(3*pi)', sym: 'q' } } },
          analyses: [A('dipole', { P: ['2', '2', '0'], p: ['1', '1', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'p7', statement: "Un hilo indefinido con densidad λ, paralelo al eje X, pasa por (0, 6a, 0). Determinar la carga que debe situarse en (0, −3a, 0) para que un dipolo p = p u_x, situado en (4a, 0, 0) y que solo puede rotar, permanezca en equilibrio. Justificar si el equilibrio es estable o inestable y obtener su energía potencial.", title: '7 · Hilo paralelo a X y carga desconocida',
      make: () => {
        const Q = S('point', 'Q', { pos: ['0', '-3', '0'] }, '1', 'q');
        return scen({
          order: ['p', 'lambda'],
          sources: [S('line', 'λ', { pos: ['0', '6', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda'), Q],
          unknown: { src: Q.id, cond: { type: 'Epar', P: ['4', '0', '0'], d: ['1', '0', '0'] } },
          analyses: [A('dipole', { P: ['4', '0', '0'], p: ['1', '0', '0'], sym: 'p', rot: ['', '', ''] })],
        });
      },
    },
    {
      key: 'p8', statement: "Una lámina indefinida de anchura 2b, uniformemente cargada, ocupa la región −b < y < b. Un hilo indefinido con densidad λ, paralelo al eje Z, pasa por (0, 4b, 0). Sabiendo que el campo eléctrico es nulo en la recta x = 0, y = 2b, obtener la densidad de la lámina y V_B − V_A entre A(0, 0, 0) y B(0, 3b, 0).", title: '8 · Lámina gruesa y campo nulo',
      make: () => {
        const sl = S('slab', 'ρ', { axis: 'y', at: '-1', w: '2' }, '1', 'rho');
        return scen({
          unit: 'b',
          sources: [sl, S('line', 'λ', { pos: ['0', '4', '0'], dir: 'z', mode: 'lambda', R: '1' }, '1', 'lambda')],
          unknown: { src: sl.id, cond: { type: 'Ezero', P: ['0', '2', '0'] } },
          analyses: [A('dV', { A: ['0', '0', '0'], B: ['0', '3', '0'] })],
        });
      },
    },
    {
      key: 'p9', statement: "Dos planos indefinidos, y = 0 con densidad 2σ e y = 2b con densidad −σ, y un hilo indefinido con densidad λ, paralelo al eje X, que pasa por (0, b, 0). Obtener: 1) el campo eléctrico en cualquier punto del plano XY; 2) la relación entre σ y λ para que V_B − V_A sea nula, con A(0, b/2, 0) y B(0, 3b, 0).", title: '9 · Dos planos distintos y un hilo', note: 'Apartado 1: el perfil a lo largo de Y usa λ como símbolo (no depende del apartado 2); en el plano XY el campo solo depende de y.',
      make: () => {
        const ln = S('line', 'λ', { pos: ['0', '1', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda');
        return scen({
          unit: 'b',
          sources: [S('plane', 'σ1', { axis: 'y', at: '0' }, '2', 'sigma'), ln, S('plane', 'σ2', { axis: 'y', at: '2' }, '-1', 'sigma')],
          unknown: { src: ln.id, cond: { type: 'dV', A: ['0', '1/2', '0'], B: ['0', '3', '0'], val: { c: '0', sym: '' } } },
          analyses: [A('profile', { P0: ['0', '0', '0'], d: ['0', '1', '0'], var: 'y', t0: '-1', t1: '4', at: '', unk: 'libre' })],
        });
      },
    },
    {
      key: 'p10', statement: "Una carga puntual Q está en el origen, centro de una corona esférica de radios R y 2R cargada con densidad ρ = 3Q/(28πR³). Obtener el trabajo realizado en contra del campo para desplazar una carga q desde (R/2, 0, 0) hasta (3R, 0, 0).", title: '10 · Carga dentro de una corona esférica',
      make: () => scen({
        unit: 'R', order: ['q', 'Q'],
        sources: [S('point', 'Q', { pos: ['0', '0', '0'] }, '1', 'Q'), S('sphere', 'ρ', { pos: ['0', '0', '0'], R1: '1', R2: '2' }, '3/(28*pi)', 'Q')],
        analyses: [A('work', { A: ['1/2', '0', '0'], B: ['3', '0', '0'], Q: { c: '1', sym: 'q' } })],
      }),
    },
    {
      key: 'p11', statement: "Un hilo indefinido con densidad λ está sobre el eje X. En (a, 2a, 0) se coloca un dipolo contenido en el plano XY que solo puede rotar; inicialmente su energía potencial es −bλ/(πaε0) y sobre él actúa un momento 3bλ/(4πaε0) u_z. 1) Determinar el momento dipolar inicial. Con el dipolo ya en equilibrio estable: 2) el campo en A(a, 4a, 0); 3) la diferencia de potencial entre A y B(a, 6a, 0).", title: '11 · Hilo en el eje X y dipolo',
      note: 'El dipolo fuente ya está en su posición de equilibrio estable (p = 5b, en la dirección +Y). Bórralo para ver solo el apartado 1.',
      make: () => scen({
        sources: [S('line', 'λ', { pos: ['0', '0', '0'], dir: 'x', mode: 'lambda', R: '1' }, '1', 'lambda'), S('dipole', 'p', { pos: ['1', '2', '0'], p: ['0', '5', '0'] }, '1', 'b')],
        analyses: [
          A('findDipole', { P: ['1', '2', '0'], sym: 'b', tau: ['0', '0', '3/(4*pi)'], U: '-1/pi', plane: 'z' }),
          A('E', { P: ['1', '4', '0'] }), A('dV', { A: ['1', '4', '0'], B: ['1', '6', '0'], sense: 'AB' }),
        ],
      }),
    },
    {
      key: 'p12', statement: "Una varilla de longitud 4a con densidad λ está en el plano XY, sobre la recta y = 3a, de x = 0 a x = 4a. 1) Campo eléctrico en el origen. 2) En el origen se coloca un dipolo contenido en el plano YZ: obtener p si el momento de fuerzas es p0λ/(30πε0a)(2u_x − u_y + 3u_z).", title: '12 · Varilla finita y dipolo en YZ',
      make: () => scen({
        sources: [S('rod', 'λ', { A: ['0', '3', '0'], B: ['4', '3', '0'] }, '1', 'lambda')],
        analyses: [A('E', { P: ['0', '0', '0'] }), A('findDipole', { P: ['0', '0', '0'], sym: 'p0', tau: ['1/(15*pi)', '-1/(30*pi)', '1/(10*pi)'], U: '', plane: 'x' })],
      }),
    },
    {
      key: 'p13', statement: "Un hilo indefinido con densidad λ coincide con el eje Z y está rodeado por un tubo cilíndrico coaxial de radio 2a con densidad superficial σ = −λ/(4πa). Obtener: 1) el campo eléctrico en (a, 0, 0); 2) el campo en (3a, 0, 0); 3) la diferencia de potencial V(a, 0, 0) − V(2a, 0, 0).", title: '13 · Hilo dentro de un tubo cargado',
      make: () => scen({
        sources: [S('line', 'λ', { pos: ['0', '0', '0'], dir: 'z', mode: 'lambda', R: '1' }, '1', 'lambda'), S('line', 'σ', { pos: ['0', '0', '0'], dir: 'z', mode: 'sigma', R: '2' }, '-1/(4*pi)', 'lambda')],
        analyses: [A('E', { P: ['1', '0', '0'] }), A('E', { P: ['3', '0', '0'] }), A('dV', { A: ['2', '0', '0'], B: ['1', '0', '0'] })],
      }),
    },
    {
      key: 'p14', statement: "Una esfera de radio a centrada en el origen tiene una densidad de carga que crece con la distancia al centro, ρ = ρ0 r/a. Obtener: 1) el campo eléctrico en (a/2, 0, 0); 2) el campo en (2a, 0, 0); 3) el potencial en el centro.", title: '14 · Esfera con ρ = ρ0 r/a',
      make: () => scen({
        sources: [S('sphere', 'ρ', { pos: ['0', '0', '0'], R1: '0', R2: '1', perfil: 'lineal' }, '1', 'rho0')],
        kinds: { rho0: 'rho' },
        analyses: [A('E', { P: ['1/2', '0', '0'] }), A('E', { P: ['2', '0', '0'] }), A('V', { P: ['0', '0', '0'] })],
      }),
    },
    {
      key: 'p15', statement: "Un cilindro indefinido de radio 2a, coaxial con el eje Z, tiene una densidad de carga ρ = ρ0(1 − r/(2a)), máxima en el eje y nula en la superficie. Obtener el campo eléctrico en (a, 0, 0) y en (0, 4a, 0).", title: '15 · Cilindro con ρ = ρ0(1 − r/R)',
      make: () => scen({
        sources: [S('line', 'ρ', { pos: ['0', '0', '0'], dir: 'z', mode: 'rho', R: '2', R1: '', perfil: 'resta' }, '1', 'rho0')],
        kinds: { rho0: 'rho' },
        analyses: [A('E', { P: ['1', '0', '0'] }), A('E', { P: ['0', '4', '0'] })],
      }),
    },
    {
      key: 'p16', statement: "Una semicircunferencia de radio a, con densidad lineal λ, está en el plano XY, centrada en el origen y en la región y > 0. Obtener: 1) el campo eléctrico en el centro; 2) el potencial en el centro; 3) el campo en (0, 0, a).", title: '16 · Semicircunferencia cargada',
      make: () => scen({
        sources: [S('arc', 'λ', { pos: ['0', '0', '0'], axis: 'z', R: '1', t1: '0', t2: '180' }, '1', 'lambda')],
        analyses: [A('E', { P: ['0', '0', '0'] }), A('V', { P: ['0', '0', '0'] }), A('E', { P: ['0', '0', '1'] })],
      }),
    },
    {
      key: 'p17', statement: "Una carga puntual q está en el centro de una corteza esférica conductora de radios a y 2a, con carga neta 2q. Obtener: 1) el campo eléctrico en (a/2, 0, 0), en (3a/2, 0, 0) y en (3a, 0, 0); 2) el potencial de la corteza.", title: '17 · Carga dentro de una corteza conductora',
      make: () => scen({
        sources: [S('point', 'q', { pos: ['0', '0', '0'] }, '1', 'q'), S('hollow', 'Q', { pos: ['0', '0', '0'], R1: '1', R2: '2' }, '2', 'q')],
        analyses: [A('E', { P: ['1/2', '0', '0'] }), A('E', { P: ['3/2', '0', '0'] }), A('E', { P: ['3', '0', '0'] }), A('V', { P: ['3/2', '0', '0'] })],
      }),
    },
    {
      key: 'p18', statement: "Una varilla de longitud 2a sobre el eje X, de x = a a x = 3a, tiene una densidad que crece linealmente desde 0, λ = λ0 (x − a)/(2a). Obtener el campo eléctrico y el potencial en el origen.", title: '18 · Varilla con densidad lineal',
      make: () => scen({
        sources: [S('rod', 'λ', { A: ['1', '0', '0'], B: ['3', '0', '0'], perfil: 'lineal' }, '1', 'lambda0')],
        kinds: { lambda0: 'lambda' },
        analyses: [A('E', { P: ['0', '0', '0'] }), A('V', { P: ['0', '0', '0'] })],
      }),
    },
  ];
  return { section: 'Ejercicios de ejemplo', list, newId: id };
})();


/* =====================================================================
   Lienzo: corte 2D (líneas de campo, equipotenciales, mapa de color,
   puntos arrastrables, cargas de prueba) y vista 3D girable.
   El fondo se guarda en una capa en caché: pasar el ratón o animar
   no recalcula el campo; al arrastrar se dibuja en calidad rápida.
   ===================================================================== */
const Canvas = (() => {
  const { V3 } = Engine;
  const AXES = { xy: [0, 1, 2], xz: [0, 2, 1], yz: [1, 2, 0] };
  const NAMES = ['X', 'Y', 'Z'];
  const AXI = { x: 0, y: 1, z: 2 };
  let cv, g, g0, W = 0, H = 0, dpr = 1;
  let view = { cx: 0, cy: 0, s: 50 }, needFit = true;
  let cam = { yaw: -0.6, pitch: 0.45, s: 50, c: [0, 0, 0] };
  let lastOut = null, lastScen = null, anchors = [], drag = null, hover = null, foco = null; // foco: clave del punto elegido con el teclado
  let bg = null, bgKey = '', outVer = 0, lastOutRef = null, fast = false, fastTimer = 0;
  let place = null, probes = [], anim = 0, legend = null;

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const is3D = () => lastScen?.view?.plane === '3d';
  const ax = () => AXES[lastScen?.view?.plane] || AXES.xy;
  const cutVal = () => { try { return Engine.parseExpr(lastScen?.view?.cut || '0', lastScen?.unit); } catch (e) { return 0; } };
  const toS = (p) => { const [a, b] = ax(); return [W / 2 + (p[a] - view.cx) * view.s, H / 2 - (p[b] - view.cy) * view.s]; };
  const toW = (x, y) => { const [a, b, c] = ax(); const p = [0, 0, 0]; p[a] = view.cx + (x - W / 2) / view.s; p[b] = view.cy - (y - H / 2) / view.s; p[c] = cutVal(); return p; };
  const el = (id) => document.getElementById(id);
  const on = (id) => !!el(id)?.checked;

  function init() {
    cv = el('cv');
    g0 = g = cv.getContext('2d');
    bg = document.createElement('canvas');
    new ResizeObserver(() => { resize(); redraw(); }).observe(cv.parentElement);
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { bgKey = ''; redraw(); });
    new MutationObserver(() => { bgKey = ''; redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { hover = null; if (!drag) redraw(); });
    // con teclado: Intro elige el siguiente punto movible, flechas lo mueven, Esc lo suelta (ver «teclado» más abajo)
    cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-describedby', 'cv-estado');
    cv.setAttribute('aria-label', 'Lienzo del campo. Intro elige el siguiente punto movible, las flechas lo mueven (con Mayús, paso fino) y Esc lo suelta. Sin punto elegido, las flechas desplazan la vista, más y menos acercan o alejan, y 0 encuadra.');
    cv.addEventListener('keydown', teclado);
    cv.addEventListener('blur', () => { if (foco) { foco = null; redraw(); } });
    cv.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 0.87); }, { passive: false });
    resize();
  }
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = Math.max(200, r.width); H = Math.max(220, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    bg.width = W * dpr; bg.height = H * dpr;
    bgKey = '';
  }
  function fit() { needFit = true; }
  function zoom(k) { if (is3D()) cam.s *= k; else view.s *= k; redraw(); }
  const redraw = () => draw(lastOut, lastScen);

  function scenePoints(out) {
    const pts = [];
    for (const s of out.ctx.sources) {
      const G = s.g; if (!G) continue;
      if (G.pos) pts.push(G.pos);
      if (G.A) pts.push(G.A, G.B);
      const R = G.R2 || G.R;
      if (R && G.pos) pts.push(V3.add(G.pos, [R, R, R]), V3.sub(G.pos, [R, R, R]));
      if (G.c !== undefined && G.i !== undefined) { const p = [0, 0, 0]; p[G.i] = G.c + (G.w ? G.w / 2 : 0); pts.push(p); if (G.w) { const q = [0, 0, 0]; q[G.i] = G.c - G.w / 2; pts.push(q); } }
    }
    for (const r of out.results) {
      for (const m of r.marks || []) pts.push(m.at);
      if (r.seg) pts.push(...r.seg);
      if (r.surf) pts.push(V3.add(r.surf.C, [r.surf.R, r.surf.R, r.surf.R]), V3.sub(r.surf.C, [r.surf.R, r.surf.R, r.surf.R]));
    }
    if (!pts.length) pts.push([0, 0, 0]);
    return pts;
  }
  function doFit(out) {
    const pts = scenePoints(out);
    if (is3D()) {
      const lo = [0, 1, 2].map((k) => Math.min(0, ...pts.map((p) => p[k]))), hi = [0, 1, 2].map((k) => Math.max(0, ...pts.map((p) => p[k])));
      cam.c = lo.map((v, k) => (v + hi[k]) / 2);
      const span = Math.max(3, ...hi.map((v, k) => v - lo[k]));
      cam.s = Math.min(W, H) / (span * 1.6);
      needFit = false;
      return;
    }
    const [a, b] = ax();
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (const p of pts) { x0 = Math.min(x0, p[a]); x1 = Math.max(x1, p[a]); y0 = Math.min(y0, p[b]); y1 = Math.max(y1, p[b]); }
    const w = Math.max(x1 - x0, 3), hh = Math.max(y1 - y0, 3);
    view.cx = (x0 + x1) / 2; view.cy = (y0 + y1) / 2;
    view.s = Math.min(W / (w * 1.3 + 1), H / (hh * 1.3 + 1));
    needFit = false;
  }
  function colors() {
    return { bg: css('--canvas'), grid: css('--grid'), axis: css('--muted'), ink: css('--ink'), pos: css('--pos'), neg: css('--neg'), fl: css('--fieldline'), eq: css('--equi'), acc: css('--accent'), dip: css('--dipole'), mark: css('--mark'), probe: css('--probe') };
  }

  /* ----------------------------- dibujo ----------------------------- */
  function draw(out, scen) {
    lastOut = out; lastScen = scen;
    if (!g0 || !out) return;
    if (out !== lastOutRef) { lastOutRef = out; outVer++; }
    if (needFit) doFit(out);
    const C = colors();
    if (is3D()) { g = g0; g.setTransform(dpr, 0, 0, dpr, 0, 0); draw3D(out, scen, C); return; }
    const has = out.ctx.sources.some((s) => s.S && s.g);
    const key = [outVer, view.cx, view.cy, view.s, W, H, scen.view.plane, scen.view.cut, on('t-lines'), on('t-equi'), on('t-grid'), on('t-cmap'), el('cmap-q')?.value, fast, C.bg].join('|');
    if (key !== bgKey) {
      bgKey = key;
      g = bg.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      legend = null;
      if (has && on('t-cmap')) drawCmap(out.ctx, C);
      drawGrid(C);
      if (has && on('t-equi')) drawEqui(out.ctx, C);
      if (has && on('t-grid')) drawArrows(out.ctx, C);
      if (has && on('t-lines')) drawLines(out.ctx, C);
    }
    g = g0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(bg, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    anchors = [];
    drawExtras(out, C);
    out.ctx.sources.forEach((s, i) => drawSource(s, i, C));
    drawMarks(out, scen, C);
    drawProbes(C);
    if (legend) drawLegend(C);
    drawHover(out.ctx, C);
    drawFoco(C);
    if (place) banner(place.hint + (place.pts.length ? ` (${place.pts.length}/${place.n})` : ''), C);
  }
  function banner(text, C) {
    g.font = '600 12.5px "IBM Plex Sans", system-ui, sans-serif';
    const tw = g.measureText(text).width;
    g.fillStyle = C.mark; g.globalAlpha = 0.92; g.fillRect(W / 2 - tw / 2 - 12, 8, tw + 24, 26); g.globalAlpha = 1;
    g.fillStyle = C.bg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, 21);
  }

  function niceStep(px) {
    const target = 46 / px;
    const p = Math.pow(10, Math.floor(Math.log10(target)));
    for (const m of [1, 2, 5, 10]) if (m * p >= target) return m * p;
    return 10 * p;
  }
  function drawGrid(C) {
    const [a, b] = ax();
    const st = niceStep(view.s);
    const p0 = toW(0, H), p1 = toW(W, 0);
    g.lineWidth = 1;
    g.strokeStyle = C.grid;
    g.beginPath();
    for (let x = Math.ceil(p0[a] / st) * st; x <= p1[a]; x += st) { const X = W / 2 + (x - view.cx) * view.s; g.moveTo(X, 0); g.lineTo(X, H); }
    for (let y = Math.ceil(p0[b] / st) * st; y <= p1[b]; y += st) { const Y = H / 2 - (y - view.cy) * view.s; g.moveTo(0, Y); g.lineTo(W, Y); }
    g.stroke();
    const [ox, oy] = toS([0, 0, 0]);
    g.strokeStyle = C.axis; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, oy); g.lineTo(W, oy); g.moveTo(ox, 0); g.lineTo(ox, H); g.stroke();
    g.fillStyle = C.axis; g.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    const u = lastOut.ctx.unit || 'a';
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let x = Math.ceil(p0[a] / st) * st; x <= p1[a]; x += st) { if (Math.abs(x) < st / 2) continue; const X = W / 2 + (x - view.cx) * view.s; g.fillText(fmtTick(x) + u, X, Math.min(Math.max(oy + 4, 4), H - 16)); }
    g.textAlign = 'left'; g.textBaseline = 'middle';
    for (let y = Math.ceil(p0[b] / st) * st; y <= p1[b]; y += st) { if (Math.abs(y) < st / 2) continue; const Y = H / 2 - (y - view.cy) * view.s; g.fillText(fmtTick(y) + u, Math.min(Math.max(ox + 5, 4), W - 40), Y); }
    g.font = 'italic 600 13px "STIX Two Text", Georgia, serif';
    g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(NAMES[a], W - 8, Math.min(Math.max(oy - 4, 16), H - 4));
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(NAMES[b], Math.min(Math.max(ox + 6, 4), W - 20), 6);
  }
  const fmtTick = (x) => String(+x.toFixed(2)).replace('-', '−');

  function E2(ctx, x, y) {
    const E = Physics.fieldNum(ctx, toW(x, y));
    if (!E) return null;
    const [a, b] = ax();
    return [E[a], -E[b]];
  }

  function drawLines(ctx, C) {
    const cell = fast ? 22 : 14, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    const occ = new Int32Array(gw * gh).fill(-1);
    const stops = [];
    const [, , c] = ax(), cut = cutVal();
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      if ((s.src.type === 'point' || s.src.type === 'dipole') && Math.abs(s.g.pos[c] - cut) < 1e-6) stops.push({ p: toS(s.g.pos), q: s.Snum });
      if (s.src.type === 'line' && s.g.mode === 'lambda' && AXI[s.g.dir] === c) stops.push({ p: toS(s.g.pos), q: s.Snum });
    }
    const seeds = [];
    for (const st of stops) {
      const n = fast ? 8 : 14;
      for (let k = 0; k < n; k++) { const t = (2 * Math.PI * k) / n + 0.2; seeds.push([st.p[0] + 9 * Math.cos(t), st.p[1] + 9 * Math.sin(t)]); }
    }
    const sp = fast ? 70 : 46;
    for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) seeds.push([x, y]);
    const h = fast ? 4.5 : 2.5, maxN = fast ? 260 : 700;
    let id = 0;
    g.strokeStyle = C.fl; g.fillStyle = C.fl; g.lineWidth = 1.1;
    for (const sd of seeds) {
      const ci = Math.floor(sd[0] / cell) + Math.floor(sd[1] / cell) * gw;
      if (occ[ci] >= 0) continue;
      const lid = id++;
      const trace = (dir) => {
        const pts = [];
        let p = sd.slice();
        for (let n = 0; n < maxN; n++) {
          const e1 = E2(ctx, p[0], p[1]); if (!e1) break;
          const n1 = Math.hypot(e1[0], e1[1]); if (n1 < 1e-14) break;
          const mid = [p[0] + (dir * h * e1[0]) / n1 / 2, p[1] + (dir * h * e1[1]) / n1 / 2];
          const e2 = E2(ctx, mid[0], mid[1]); if (!e2) break;
          const n2 = Math.hypot(e2[0], e2[1]); if (n2 < 1e-14) break;
          p = [p[0] + (dir * h * e2[0]) / n2, p[1] + (dir * h * e2[1]) / n2];
          if (p[0] < 0 || p[1] < 0 || p[0] > W || p[1] > H) break;
          if (stops.some((st) => Math.hypot(st.p[0] - p[0], st.p[1] - p[1]) < 6)) { pts.push(p); break; }
          const k = Math.floor(p[0] / cell) + Math.floor(p[1] / cell) * gw;
          if (occ[k] >= 0 && occ[k] !== lid && n > 3) break;
          pts.push(p);
        }
        return pts;
      };
      const fw = trace(1), bw = trace(-1);
      const all = [...bw.reverse(), sd, ...fw];
      if (all.length < 8) continue;
      for (const p of all) { const k = Math.floor(p[0] / cell) + Math.floor(p[1] / cell) * gw; if (k >= 0 && k < occ.length) occ[k] = lid; }
      g.beginPath(); g.moveTo(all[0][0], all[0][1]);
      for (const p of all) g.lineTo(p[0], p[1]);
      g.stroke();
      const m = Math.floor(all.length / 2), p0 = all[m - 1], p1 = all[m + 1];
      if (p0 && p1) arrowHead(p1, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 5);
    }
  }
  function arrowHead(p, ang, s) {
    g.beginPath();
    g.moveTo(p[0] + s * Math.cos(ang), p[1] + s * Math.sin(ang));
    g.lineTo(p[0] + s * Math.cos(ang + 2.5), p[1] + s * Math.sin(ang + 2.5));
    g.lineTo(p[0] + s * Math.cos(ang - 2.5), p[1] + s * Math.sin(ang - 2.5));
    g.closePath(); g.fill();
  }
  function arrow(p, v, len, color, w = 2) {
    const n = Math.hypot(v[0], v[1]); if (n < 1e-14) return;
    const q = [p[0] + (v[0] / n) * len, p[1] + (v[1] / n) * len];
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = w;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
    arrowHead(q, Math.atan2(v[1], v[0]), 6);
  }

  function drawArrows(ctx, C) {
    const sp = 40;
    const vals = [];
    for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) { const e = E2(ctx, x, y); if (e) vals.push([x, y, e, Math.hypot(e[0], e[1])]); }
    const mags = vals.map((v) => v[3]).filter((m) => m > 0).sort((p, q) => p - q);
    const ref = mags[Math.floor(mags.length * 0.9)] || 1;
    g.globalAlpha = 0.8;
    for (const [x, y, e, m] of vals) arrow([x - e[0] / m * 8, y - e[1] / m * 8], e, 6 + 12 * Math.min(1, m / ref), C.acc, 1.2);
    g.globalAlpha = 1;
  }

  function sampleV(ctx, st) {
    const nx = Math.ceil(W / st) + 1, ny = Math.ceil(H / st) + 1;
    const V = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[i + j * nx] = Physics.potNum(ctx, toW(i * st, j * st));
    return { V, nx, ny };
  }
  function drawEqui(ctx, C) {
    const st = fast ? 12 : 7;
    const { V, nx, ny } = sampleV(ctx, st);
    const fin = [...V].filter(isFinite).sort((p, q) => p - q);
    if (fin.length < 10) return;
    const lo = fin[Math.floor(fin.length * 0.04)], hi = fin[Math.floor(fin.length * 0.96)];
    if (!(hi > lo)) return;
    const NL = 13, lv = [];
    for (let k = 1; k < NL; k++) lv.push(lo + ((hi - lo) * k) / NL);
    g.strokeStyle = C.eq; g.lineWidth = 1; g.setLineDash([4, 3]);
    g.beginPath();
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const v0 = V[i + j * nx], v1 = V[i + 1 + j * nx], v2 = V[i + 1 + (j + 1) * nx], v3 = V[i + (j + 1) * nx];
      if (!(isFinite(v0) && isFinite(v1) && isFinite(v2) && isFinite(v3))) continue;
      const mn = Math.min(v0, v1, v2, v3), mx = Math.max(v0, v1, v2, v3);
      for (const L of lv) {
        if (L < mn || L > mx) continue;
        const x = i * st, y = j * st, P = [];
        const ed = (va, vb, xa, ya, xb, yb) => { if ((va - L) * (vb - L) < 0) { const t = (L - va) / (vb - va); P.push([xa + t * (xb - xa), ya + t * (yb - ya)]); } };
        ed(v0, v1, x, y, x + st, y); ed(v1, v2, x + st, y, x + st, y + st); ed(v2, v3, x + st, y + st, x, y + st); ed(v3, v0, x, y + st, x, y);
        for (let k = 0; k + 1 < P.length; k += 2) { g.moveTo(P[k][0], P[k][1]); g.lineTo(P[k + 1][0], P[k + 1][1]); }
      }
    }
    g.stroke(); g.setLineDash([]);
  }

  /* --------- mapa de color de V o |E| --------- */
  const rgb = (c) => {
    const m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return [128, 128, 128];
  };
  function drawCmap(ctx, C) {
    const q = el('cmap-q')?.value || 'V';
    const st = fast ? 8 : 4, nx = Math.ceil(W / st), ny = Math.ceil(H / st);
    const vals = new Float64Array(nx * ny);
    const absV = ctx.sources.every((s) => !s.S || s.def.absV);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const X = toW((i + 0.5) * st, (j + 0.5) * st);
      if (q === 'V') vals[i + j * nx] = Physics.potNum(ctx, X);
      else { const E = Physics.fieldNum(ctx, X); vals[i + j * nx] = E ? V3.norm(E) : NaN; }
    }
    const fin = [...vals].filter(isFinite).sort((p, r) => p - r);
    if (fin.length < 4) return;
    const pos = rgb(C.pos), neg = rgb(C.neg), base = rgb(C.bg), acc = rgb(C.acc);
    let map, lo, hi, mid = 0;
    if (q === 'V') {
      mid = absV ? 0 : fin[Math.floor(fin.length / 2)];
      const lim = Math.max(Math.abs(fin[Math.floor(fin.length * 0.03)] - mid), Math.abs(fin[Math.floor(fin.length * 0.97)] - mid)) || 1;
      lo = mid - lim; hi = mid + lim;
      map = (v) => { const t = Math.max(-1, Math.min(1, (v - mid) / lim)); const c = t >= 0 ? pos : neg, a = Math.abs(t) * 0.75; return base.map((b, k) => b + (c[k] - b) * a); };
    } else {
      lo = Math.max(fin[Math.floor(fin.length * 0.03)], 1e-30); hi = fin[Math.floor(fin.length * 0.97)];
      const l0 = Math.log(lo), l1 = Math.log(hi) - l0 || 1;
      map = (v) => { const t = Math.max(0, Math.min(1, (Math.log(Math.max(v, 1e-300)) - l0) / l1)); return base.map((b, k) => b + (acc[k] - b) * t * 0.8); };
    }
    const img = g.createImageData(nx, ny);
    for (let k = 0; k < nx * ny; k++) {
      const v = vals[k];
      const c = isFinite(v) ? map(v) : base;
      img.data[4 * k] = c[0]; img.data[4 * k + 1] = c[1]; img.data[4 * k + 2] = c[2]; img.data[4 * k + 3] = 255;
    }
    const tmp = document.createElement('canvas');
    tmp.width = nx; tmp.height = ny;
    tmp.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(tmp, 0, 0, nx * st, ny * st);
    const si = lastOut.ctx.mode === 'si';
    const f = si ? 1 / Engine.EPS0 : Math.PI;
    legend = { q, lo: lo * f, hi: hi * f, mid: mid * f, absV, si, colors: q === 'V' ? [C.neg, C.bg, C.pos] : [C.bg, C.acc] };
  }
  function drawLegend(C) {
    const w = 150, x = W - w - 14, y = H - 46;
    g.fillStyle = C.bg; g.globalAlpha = 0.88; g.fillRect(x - 8, y - 18, w + 16, 46); g.globalAlpha = 1;
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    legend.colors.forEach((c, i) => gr.addColorStop(i / (legend.colors.length - 1), c));
    g.fillStyle = gr; g.fillRect(x, y, w, 9);
    g.strokeStyle = C.axis; g.lineWidth = 0.5; g.strokeRect(x, y, w, 9);
    g.font = '10.5px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle = C.ink; g.textBaseline = 'top';
    const u = legend.si ? (legend.q === 'V' ? ' V' : ' N/C') : '';
    const fm = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(1) : String(+v.toPrecision(2))).replace('-', '−');
    g.textAlign = 'left'; g.fillText(fm(legend.lo) + u, x, y + 12);
    g.textAlign = 'right'; g.fillText(fm(legend.hi) + u, x + w, y + 12);
    g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText(legend.q === 'V' ? (legend.absV ? 'V' : 'V − V_medio') + (legend.si ? '' : ' ·πε₀a/símb.') : '|E|' + (legend.si ? '' : ' ·πε₀a²/símb.') + ' (log)', x, y - 3);
  }

  function colorOf(s, C) { return !s.S ? C.axis : s.Snum >= 0 ? C.pos : C.neg; }
  function label(text, x, y, color) {
    g.font = 'italic 14px "STIX Two Text", Georgia, serif';
    g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText(text, x, y);
  }
  const prettyName = (n) => String(n).replace(/lambda/i, 'λ').replace(/sigma/i, 'σ').replace(/rho/i, 'ρ').replace(/(\D)(\d+)$/, (_, a, d) => a + d.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[c]).join(''));

  function drawSource(s, i, C) {
    const G = s.g; if (!G) return;
    const [a, b, c] = ax(), cut = cutVal();
    const col = colorOf(s, C);
    const nm = prettyName(s.name) + (s.unknown && !s.unknownSolved ? ' ?' : '');
    const t = s.src.type;
    const addAnchors = () => { for (const an of s.def.anchors(s.src, G)) anchors.push({ p: toS(an.at), path: ['sources', i, ...an.path], at: an.at, lab: nm }); };
    g.lineWidth = 2;
    if (t === 'point' || t === 'dipole') {
      const p = toS(G.pos), inPlane = Math.abs(G.pos[c] - cut) < 1e-6;
      g.globalAlpha = inPlane ? 1 : 0.45;
      if (t === 'point') {
        g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 8, 0, 7); g.fill();
        g.strokeStyle = C.bg; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0] - 4, p[1]); g.lineTo(p[0] + 4, p[1]);
        if (s.Snum >= 0) { g.moveTo(p[0], p[1] - 4); g.lineTo(p[0], p[1] + 4); }
        g.stroke();
      } else {
        const d = [G.p[a], -G.p[b]];
        g.fillStyle = C.dip; g.beginPath(); g.arc(p[0], p[1], 4, 0, 7); g.fill();
        if (Math.hypot(...d) > 1e-12) { const n = Math.hypot(...d); arrow([p[0] - (d[0] / n) * 14, p[1] - (d[1] / n) * 14], d, 30, C.dip, 2.5); }
      }
      label(nm + (inPlane ? '' : ` (${'xyz'[c]}=${fmtTick(G.pos[c])})`), p[0] + 10, p[1] - 6, C.ink);
      g.globalAlpha = 1;
      addAnchors();
    } else if (t === 'line') {
      const di = AXI[G.dir];
      if (di === c) {
        const p = toS(G.pos);
        if (G.mode === 'rho') { g.fillStyle = col; g.globalAlpha = 0.18; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 2 * Math.PI); if (G.R1) { g.moveTo(p[0] + G.R1 * view.s, p[1]); g.arc(p[0], p[1], G.R1 * view.s, 0, 2 * Math.PI); } g.fill('evenodd'); g.globalAlpha = 1; g.strokeStyle = col; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 7); g.stroke(); }
        if (G.mode === 'sigma') { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 7); g.stroke(); g.lineWidth = 1; }
        g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.stroke();
        g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 2.5, 0, 7); g.fill();
        label(nm, p[0] + 10, p[1] - 6, C.ink);
      } else {
        const off = Math.abs(G.pos[c] - cut) > 1e-6;
        const p = toS(G.pos);
        const vert = di !== a;
        g.strokeStyle = col; g.globalAlpha = off ? 0.4 : 1;
        if (G.mode === 'rho') { g.fillStyle = col; g.globalAlpha *= 0.18; const r = G.R * view.s; if (vert) g.fillRect(p[0] - r, 0, 2 * r, H); else g.fillRect(0, p[1] - r, W, 2 * r); g.globalAlpha = off ? 0.4 : 1; }
        if (G.mode === 'sigma') { const r = G.R * view.s; g.lineWidth = 2.5; g.beginPath(); if (vert) { g.moveTo(p[0] - r, 0); g.lineTo(p[0] - r, H); g.moveTo(p[0] + r, 0); g.lineTo(p[0] + r, H); } else { g.moveTo(0, p[1] - r); g.lineTo(W, p[1] - r); g.moveTo(0, p[1] + r); g.lineTo(W, p[1] + r); } g.stroke(); }
        g.lineWidth = 3; g.setLineDash(off ? [6, 4] : []);
        g.beginPath(); if (vert) { g.moveTo(p[0], 0); g.lineTo(p[0], H); } else { g.moveTo(0, p[1]); g.lineTo(W, p[1]); } g.stroke(); g.setLineDash([]);
        label(nm, vert ? p[0] + 6 : 8, vert ? 22 : p[1] - 6, C.ink);
        g.globalAlpha = 1;
      }
      addAnchors();
    } else if (t === 'plane' || t === 'slab') {
      if (G.i === c) { label(`${nm}: plano ${'xyz'[c]} = ${fmtTick(G.c)} (paralelo a la vista)`, 8, H - 8, C.axis); return; }
      const vert = G.i === a;
      const p = toS([G.c, G.c, G.c]);
      g.strokeStyle = col; g.fillStyle = col;
      if (t === 'slab') {
        const r = (G.w / 2) * view.s;
        g.globalAlpha = 0.2; if (vert) g.fillRect(p[0] - r, 0, 2 * r, H); else g.fillRect(0, p[1] - r, W, 2 * r);
        g.globalAlpha = 1; g.lineWidth = 1.5;
        g.beginPath(); if (vert) { g.moveTo(p[0] - r, 0); g.lineTo(p[0] - r, H); g.moveTo(p[0] + r, 0); g.lineTo(p[0] + r, H); } else { g.moveTo(0, p[1] - r); g.lineTo(W, p[1] - r); g.moveTo(0, p[1] + r); g.lineTo(W, p[1] + r); } g.stroke();
        label(nm, vert ? p[0] - r + 6 : 8, vert ? 22 : p[1] - r - 4, C.ink);
      } else {
        g.lineWidth = 5; g.globalAlpha = 0.85;
        g.beginPath(); if (vert) { g.moveTo(p[0], 0); g.lineTo(p[0], H); } else { g.moveTo(0, p[1]); g.lineTo(W, p[1]); } g.stroke();
        g.globalAlpha = 1;
        label(nm, vert ? p[0] + 7 : 8, vert ? 22 : p[1] - 6, C.ink);
      }
    } else if (t === 'hollow') {
      const d = G.pos[c] - cut, p = toS(G.pos), rr = (R) => (R > Math.abs(d) ? Math.sqrt(R * R - d * d) * view.s : 0), r2 = rr(G.R2), r1 = rr(G.R1);
      if (r2 > 0) {
        g.fillStyle = C.axis; g.globalAlpha = 0.25; g.beginPath(); g.arc(p[0], p[1], r2, 0, 2 * Math.PI); if (r1 > 0) { g.moveTo(p[0] + r1, p[1]); g.arc(p[0], p[1], r1, 0, 2 * Math.PI); } g.fill('evenodd');
        g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], r2, 0, 7); g.stroke(); if (r1 > 0) { g.beginPath(); g.arc(p[0], p[1], r1, 0, 7); g.stroke(); }
      }
      label(nm, p[0] + r2 * 0.72 + 4, p[1] - r2 * 0.72, C.ink);
      addAnchors();
    } else if (t === 'arc') {
      const p = toS(G.pos), pts = [];
      for (let i = 0; i <= 64; i++) { const th = G.t1 + ((G.t2 - G.t1) * i) / 64; pts.push(toS(V3.add(G.pos, V3.add(V3.sc(G.e1, G.R * Math.cos(th)), V3.sc(G.e2, G.R * Math.sin(th)))))); }
      g.strokeStyle = col; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 2.5, 0, 7); g.fill();
      const m = pts[32]; label(nm, m[0] + 8, m[1] - 6, C.ink);
      addAnchors();
    } else if (t === 'sphere' || t === 'shell' || t === 'conductor') {
      const d = G.pos[c] - cut;
      const p = toS(G.pos);
      const rr = (R) => (R > Math.abs(d) ? Math.sqrt(R * R - d * d) * view.s : 0);
      const r2 = rr(t === 'sphere' ? G.R2 : G.R), r1 = t === 'sphere' ? rr(G.R1) : 0;
      if (r2 > 0) {
        g.fillStyle = t === 'conductor' ? C.axis : col; g.globalAlpha = t === 'shell' ? 0.06 : 0.2;
        g.beginPath(); g.arc(p[0], p[1], r2, 0, 2 * Math.PI); if (r1 > 0) { g.moveTo(p[0] + r1, p[1]); g.arc(p[0], p[1], r1, 0, 2 * Math.PI); } g.fill('evenodd');
        g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = t === 'shell' || t === 'conductor' ? 3 : 1.5;
        g.beginPath(); g.arc(p[0], p[1], r2, 0, 7); g.stroke();
        if (r1 > 0) { g.lineWidth = 1.5; g.beginPath(); g.arc(p[0], p[1], r1, 0, 7); g.stroke(); }
      }
      label(nm, p[0] + r2 * 0.72 + 4, p[1] - r2 * 0.72, C.ink);
      addAnchors();
    } else if (t === 'ring' || t === 'disk') {
      const p = toS(G.pos), ni = AXI[G.axis], r = G.R * view.s;
      g.strokeStyle = col; g.fillStyle = col;
      if (ni === c) {
        if (t === 'disk') { g.globalAlpha = 0.2; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.globalAlpha = 1; }
        g.lineWidth = t === 'ring' ? 3 : 1.5; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.stroke();
      } else {
        const horiz = ni === b; // el eje del anillo es vertical en pantalla → el anillo se ve como segmento horizontal
        const q0 = horiz ? [p[0] - r, p[1]] : [p[0], p[1] - r], q1 = horiz ? [p[0] + r, p[1]] : [p[0], p[1] + r];
        if (t === 'disk') { g.lineWidth = 5; g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.stroke(); }
        else { g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.stroke(); g.setLineDash([]); for (const q of [q0, q1]) { g.beginPath(); g.arc(q[0], q[1], 5, 0, 7); g.fill(); } }
      }
      label(nm, p[0] + r * 0.72 + 4, p[1] - r * 0.72 - 2, C.ink);
      addAnchors();
    } else if (t === 'rod') {
      const p = toS(G.A), q = toS(G.B);
      g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.lineCap = 'butt';
      label(nm, (p[0] + q[0]) / 2 + 8, (p[1] + q[1]) / 2, C.ink);
      addAnchors();
    }
  }

  // superficies de Gauss y rectas de perfil
  function drawExtras(out, C) {
    const [a, b, c] = ax(), cut = cutVal();
    g.strokeStyle = C.mark; g.lineWidth = 1.5; g.setLineDash([6, 4]);
    for (const r of out.results) {
      if (r.seg) { const p = toS(r.seg[0]), q = toS(r.seg[1]); g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); }
      if (r.surf) {
        const S = r.surf, p = toS(S.C), R = S.R * view.s;
        if (S.shape === 'sphere') { const d = Math.abs(S.C[c] - cut); if (d < S.R) { g.beginPath(); g.arc(p[0], p[1], Math.sqrt(S.R ** 2 - d * d) * view.s, 0, 7); g.stroke(); } }
        else {
          const ni = AXI[S.axis], hh = (S.h / 2) * view.s;
          if (ni === c) { g.beginPath(); g.arc(p[0], p[1], R, 0, 7); g.stroke(); }
          else if (ni === a) g.strokeRect(p[0] - hh, p[1] - R, 2 * hh, 2 * R);
          else g.strokeRect(p[0] - R, p[1] - hh, 2 * R, 2 * hh);
        }
      }
    }
    g.setLineDash([]);
  }

  function drawMarks(out, scen, C) {
    const add = (path, at, lab, vec, dip) => {
      const p = toS(at);
      if (vec) { const [a, b] = ax(); arrow(p, [vec[a], -vec[b]], 42, C.acc, 2.4); }
      if (dip) { const [a, b] = ax(); const d = [dip[a], -dip[b]]; const n = Math.hypot(...d); if (n > 1e-12) arrow([p[0] - (d[0] / n) * 13, p[1] - (d[1] / n) * 13], d, 26, C.dip, 3); }
      g.fillStyle = C.bg; g.strokeStyle = C.mark; g.lineWidth = 2;
      g.beginPath(); g.moveTo(p[0], p[1] - 6); g.lineTo(p[0] + 6, p[1]); g.lineTo(p[0], p[1] + 6); g.lineTo(p[0] - 6, p[1]); g.closePath(); g.fill(); g.stroke();
      g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.mark; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(lab, p[0] + 8, p[1] + 4);
      if (path) anchors.push({ p, path, at, lab });
    };
    const many = scen.analyses.length > 1;
    scen.analyses.forEach((an, i) => {
      for (const m of out.results[i]?.marks || []) add(m.key ? ['analyses', i, m.key] : null, m.at, `${m.label || m.key}${many ? '·' + (i + 1) : ''}`, m.vec, m.dip);
    });
    const P = out.ctx.P;
    (scen.unknown?.conds || []).forEach((cd, j) => {
      const keys = { Ecomp: ['P'], Epar: ['P'], Ezero: ['P'], dV: ['A', 'B'], V: ['P'] }[cd.type] || [];
      for (const k of keys) { try { add(['unknown', 'conds', j, k], cd[k].map(P), k + '*', null); } catch (e) { /* entrada incompleta */ } }
    });
  }

  function drawHover(ctx, C) {
    if (!hover || drag || place) return;
    const w = toW(hover[0], hover[1]);
    const E = Physics.fieldNum(ctx, w);
    const [a, b] = ax(), u = ctx.unit || 'a', si = ctx.mode === 'si';
    const Et = E ? (si ? `${(V3.norm(E) / Engine.EPS0).toPrecision(3)} N/C` : `${(V3.norm(E) * Math.PI).toPrecision(3)}/(πε₀)`) : '';
    const txt = `${'xyz'[a]} = ${w[a].toFixed(2)}${u}, ${'xyz'[b]} = ${w[b].toFixed(2)}${u}` + (E ? `   |E| ≈ ${Et}` : '');
    g.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    const tw = g.measureText(txt).width;
    g.fillStyle = C.bg; g.globalAlpha = 0.9; g.fillRect(6, H - 26, tw + 12, 20); g.globalAlpha = 1;
    g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, 12, H - 16);
  }

  /* ------------------- cargas de prueba animadas ------------------- */
  function addProbe(X, sign) {
    const E = Physics.fieldNum(lastOut.ctx, X);
    if (!E) return;
    const k = 220 / (view.s * Math.max(V3.norm(E), 1e-12)); // aceleración inicial ≈ 220 px/s²
    probes.push({ x: X.slice(), v: [0, 0, 0], k: k * sign, sign, trail: [X.slice()], alive: true, t: 0 });
    if (!anim) { let last = performance.now(); const step = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; stepProbes(dt); redraw(); anim = probes.some((p) => p.alive) ? requestAnimationFrame(step) : 0; }; anim = requestAnimationFrame(step); }
  }
  function stepProbes(dt) {
    const ctx = lastOut?.ctx; if (!ctx) return;
    const sub = 10, h = dt / sub, lim = 3 * Math.max(W, H) / view.s;
    for (const p of probes) {
      if (!p.alive) continue;
      for (let i = 0; i < sub; i++) {
        const E = Physics.fieldNum(ctx, p.x);
        if (!E || !E.every(isFinite)) { p.alive = false; break; }
        const acc = V3.sc(E, p.k);
        p.v = V3.add(p.v, V3.sc(acc, h));
        p.x = V3.add(p.x, V3.sc(p.v, h));
        if (V3.norm(V3.sub(p.x, [view.cx, view.cy, 0])) > lim && V3.norm(V3.sub(p.x, toW(W / 2, H / 2))) > lim) { p.alive = false; break; }
        if (ctx.sources.some((s) => s.g?.pos && s.src.type === 'point' && V3.norm(V3.sub(s.g.pos, p.x)) < 6 / view.s)) { p.alive = false; break; }
      }
      p.t += dt;
      if (p.t > 25) p.alive = false;
      const last = p.trail[p.trail.length - 1];
      if (V3.norm(V3.sub(p.x, last)) * view.s > 2) p.trail.push(p.x.slice());
      if (p.trail.length > 1500) p.trail.shift();
    }
  }
  function drawProbes(C) {
    for (const p of probes) {
      const col = p.sign > 0 ? C.pos : C.neg;
      g.strokeStyle = col; g.globalAlpha = 0.7; g.lineWidth = 1.6;
      g.beginPath(); p.trail.forEach((q, i) => { const s = toS(q); if (i) g.lineTo(...s); else g.moveTo(...s); }); g.stroke();
      g.globalAlpha = 1;
      const s = toS(p.x);
      g.fillStyle = C.probe || col; g.beginPath(); g.arc(s[0], s[1], 5, 0, 7); g.fill();
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(s[0], s[1], 5, 0, 7); g.stroke();
    }
  }
  function clearProbes() { probes = []; redraw(); }

  /* ----------------------------- vista 3D ----------------------------- */
  function proj(p) {
    const q = V3.sub(p, cam.c);
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = cy * q[0] - sy * q[1], y1 = sy * q[0] + cy * q[1];
    const yv = q[2] * cp - y1 * sp, depth = y1 * cp + q[2] * sp;
    const f = 1 / (1 - depth * cam.s / (Math.min(W, H) * 2.2));
    return [W / 2 + x1 * cam.s * f, H / 2 - yv * cam.s * f, depth, f];
  }
  function line3(a, b) { const p = proj(a), q = proj(b); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
  function arrow3(p0, v, len, color, w = 2) {
    const a = proj(p0), b = proj(V3.add(p0, V3.sc(V3.unit(v), len / cam.s)));
    arrow([a[0], a[1]], [b[0] - a[0], b[1] - a[1]], Math.hypot(b[0] - a[0], b[1] - a[1]), color, w);
  }
  function draw3D(out, scen, C) {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const ctx = out.ctx, L = Math.min(W, H) / cam.s * 0.5, c0 = cam.c;
    // rejilla en z = 0 y ejes
    g.strokeStyle = C.grid; g.lineWidth = 1;
    const st = niceStep(cam.s);
    const gx0 = Math.floor((c0[0] - L) / st) * st, gy0 = Math.floor((c0[1] - L) / st) * st;
    for (let x = gx0; x <= c0[0] + L; x += st) line3([x, c0[1] - L, 0], [x, c0[1] + L, 0]);
    for (let y = gy0; y <= c0[1] + L; y += st) line3([c0[0] - L, y, 0], [c0[0] + L, y, 0]);
    g.strokeStyle = C.axis; g.lineWidth = 1.4;
    g.font = 'italic 600 13px "STIX Two Text", Georgia, serif'; g.fillStyle = C.axis; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const e = [0, 0, 0]; e[k] = L * 1.05;
      line3(V3.sc(e, -1), e);
      const p = proj(V3.sc(e, 1.07)); g.fillText(NAMES[k], p[0], p[1]);
    }
    // campo: flechas en una malla 3D
    if (on('t-grid') || on('t-lines')) {
      const n = fast ? 4 : 6, vals = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        const X = [c0[0] - L * 0.8 + (1.6 * L * i) / (n - 1), c0[1] - L * 0.8 + (1.6 * L * j) / (n - 1), c0[2] - L * 0.8 + (1.6 * L * k) / (n - 1)];
        const E = Physics.fieldNum(ctx, X);
        if (E && V3.norm(E) > 0) vals.push([X, E, V3.norm(E)]);
      }
      const ms = vals.map((v) => v[2]).sort((a, b) => a - b), ref = ms[Math.floor(ms.length * 0.9)] || 1;
      g.globalAlpha = 0.55;
      for (const [X, E, m] of vals) arrow3(X, E, 8 + 14 * Math.min(1, m / ref), C.acc, 1.2);
      g.globalAlpha = 1;
    }
    if (on('t-lines')) drawLines3D(ctx, C, L);
    // fuentes, de atrás hacia delante
    const items = ctx.sources.filter((s) => s.g).map((s) => ({ s, d: proj(s.g.pos || s.g.A || c0)[2] }));
    items.sort((a, b) => a.d - b.d);
    for (const { s } of items) drawSource3D(s, C, L);
    // superficies de Gauss, discontinuas como en 2D
    g.strokeStyle = C.mark; g.lineWidth = 1.5; g.setLineDash([6, 4]);
    for (const r of out.results) {
      if (!r.surf) continue;
      const S = r.surf;
      if (S.shape === 'sphere') { const p = proj(S.C); g.beginPath(); g.arc(p[0], p[1], S.R * cam.s * p[3], 0, 7); g.stroke(); ring3(S.C, [0, 0, 1], S.R, 1, 0.4); }
      else cylinder3(S.C, S.n, S.R, S.h, 0, 1);
    }
    g.setLineDash([]);
    for (const r of out.results) for (const m of r.marks || []) {
      const p = proj(m.at);
      if (m.vec) arrow3(m.at, m.vec, 42, C.acc, 2.4);
      if (m.dip && V3.norm(m.dip) > 0) arrow3(V3.sub(m.at, V3.sc(V3.unit(m.dip), 13 / cam.s)), m.dip, 26, C.dip, 3);
      g.fillStyle = C.bg; g.strokeStyle = C.mark; g.lineWidth = 2;
      g.beginPath(); g.arc(p[0], p[1], 5, 0, 7); g.fill(); g.stroke();
      g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.mark; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(m.label || m.key || '', p[0] + 7, p[1] + 3);
    }
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.axis; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText('Arrastra para girar · Ctrl + rueda o +/− para acercar', 10, H - 8);
  }
  function drawLines3D(ctx, C, L) {
    const lim = L * 1.2;
    g.strokeStyle = C.fl; g.lineWidth = 1; g.globalAlpha = 0.85;
    const dirs = [];
    const N = fast ? 8 : 14;
    for (let i = 0; i < N; i++) { const z = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - z * z), t = i * 2.39996; dirs.push([r * Math.cos(t), r * Math.sin(t), z]); }
    const h = 1.5 / cam.s;
    for (const s of ctx.sources) {
      if (!s.g || !s.S || s.src.type !== 'point') continue;
      const sgn = s.Snum >= 0 ? 1 : -1;
      for (const d of dirs) {
        let p = V3.add(s.g.pos, V3.sc(d, 8 / cam.s));
        const pts = [p];
        for (let n = 0; n < (fast ? 250 : 600); n++) {
          const E = Physics.fieldNum(ctx, p); if (!E) break;
          const m = V3.norm(E); if (m < 1e-14) break;
          p = V3.add(p, V3.sc(E, (sgn * h * 2) / m));
          if (Math.abs(p[0] - cam.c[0]) > lim || Math.abs(p[1] - cam.c[1]) > lim || Math.abs(p[2] - cam.c[2]) > lim) break;
          pts.push(p);
          if (ctx.sources.some((o) => o !== s && o.src.type === 'point' && V3.norm(V3.sub(o.g.pos, p)) < 6 / cam.s)) break;
        }
        g.beginPath(); pts.forEach((q, i) => { const pp = proj(q); if (i) g.lineTo(pp[0], pp[1]); else g.moveTo(pp[0], pp[1]); }); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
  function circle3(c, n, R) {
    const e1 = Math.abs(n[0]) < 0.9 ? V3.unit(V3.cross(n, [1, 0, 0])) : V3.unit(V3.cross(n, [0, 1, 0])), e2 = V3.cross(n, e1);
    const pts = [];
    for (let i = 0; i <= 48; i++) { const t = (2 * Math.PI * i) / 48; pts.push(proj(V3.add(c, V3.add(V3.sc(e1, R * Math.cos(t)), V3.sc(e2, R * Math.sin(t)))))); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  }
  // cilindro de eje u y radio R entre c − u·h/2 y c + u·h/2. Es convexo, así que su contorno
  // en pantalla es la envolvente convexa de las dos tapas proyectadas (vale también en perspectiva).
  function cylinder3(c, u, R, h, fill, rings) {
    const e1 = Math.abs(u[0]) < 0.9 ? V3.unit(V3.cross(u, [1, 0, 0])) : V3.unit(V3.cross(u, [0, 1, 0])), e2 = V3.cross(u, e1);
    const pts = [];
    for (const k of [-0.5, 0.5]) for (let i = 0; i < 48; i++) {
      const t = (2 * Math.PI * i) / 48;
      pts.push(proj(V3.add(V3.add(c, V3.sc(u, h * k)), V3.add(V3.sc(e1, R * Math.cos(t)), V3.sc(e2, R * Math.sin(t))))).concat(k));
    }
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const crs = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length > 1 && crs(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length > 1 && crs(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    const hull = lo.slice(0, -1).concat(hi.slice(0, -1));
    g.beginPath(); hull.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    if (fill) { g.globalAlpha = fill; g.fill(); g.globalAlpha = 1; }
    // lados: solo las aristas que unen una tapa con la otra (el resto del contorno lo dibujan las tapas)
    g.beginPath();
    hull.forEach((p, i) => { const q = hull[(i + 1) % hull.length]; if (p[4] !== q[4]) { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } });
    g.stroke();
    for (let k = 0; k <= rings; k++) { circle3(V3.add(c, V3.sc(u, h * (k / rings - 0.5))), u, R); g.stroke(); }
  }
  // circunferencia de centro c, normal n y radio R: la mitad delantera más marcada que la trasera
  function ring3(c, n, R, front, back) {
    const e1 = Math.abs(n[0]) < 0.9 ? V3.unit(V3.cross(n, [1, 0, 0])) : V3.unit(V3.cross(n, [0, 1, 0])), e2 = V3.cross(n, e1), d0 = proj(c)[2];
    const pts = [];
    for (let i = 0; i <= 64; i++) { const t = (2 * Math.PI * i) / 64; pts.push(proj(V3.add(c, V3.add(V3.sc(e1, R * Math.cos(t)), V3.sc(e2, R * Math.sin(t)))))); }
    for (const [side, a] of [[true, front], [false, back]]) {
      g.globalAlpha = a; g.beginPath();
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i];
        if ((p[2] + q[2] > 2 * d0) !== side) continue;
        if (i === 1 || (pts[i - 2][2] + p[2] > 2 * d0) !== side) g.moveTo(p[0], p[1]);
        g.lineTo(q[0], q[1]);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  // esfera con volumen: relleno, sombra suave en el borde (sin reflejo), ecuador y dos meridianos
  function sphere3(c, R, col, fill) {
    const p = proj(c), r = R * cam.s * p[3];
    g.fillStyle = col; g.globalAlpha = fill; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill();
    const gr = g.createRadialGradient(p[0], p[1], r * 0.55, p[0], p[1], r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill();
    g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1;
    for (const n of [[0, 0, 1], [1, 0, 0], [0, 1, 0]]) ring3(c, n, R, 0.55, 0.15);
    g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.stroke();
    return p;
  }
  function drawSource3D(s, C, L) {
    const G = s.g, t = s.src.type, col = colorOf(s, C), nm = prettyName(s.name);
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
    let lp = null;
    if (t === 'point') { const p = proj(G.pos); g.beginPath(); g.arc(p[0], p[1], 7 * p[3], 0, 7); g.fill(); lp = p; }
    else if (t === 'dipole') { arrow3(V3.sub(G.pos, V3.sc(V3.unit(G.p), 14 / cam.s)), G.p, 30, C.dip, 2.5); lp = proj(G.pos); }
    else if (t === 'line' && G.mode === 'rho') {
      // cilindro macizo de radio R (centrado en la proyección de la cámara sobre su eje)
      const c = V3.add(G.pos, V3.sc(G.u, V3.dot(V3.sub(cam.c, G.pos), G.u)));
      g.lineWidth = 1.5; cylinder3(c, G.u, G.R, L * 2.4, 0.18, 4);
      lp = proj(V3.add(V3.add(c, V3.sc(G.u, L)), V3.sc(Math.abs(G.u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], G.R)));
    } else if (t === 'line' && G.mode === 'sigma') {
      const c = V3.add(G.pos, V3.sc(G.u, V3.dot(V3.sub(cam.c, G.pos), G.u)));
      g.lineWidth = 2; cylinder3(c, G.u, G.R, L * 2.4, 0.06, 4);
      lp = proj(V3.add(V3.add(c, V3.sc(G.u, L)), V3.sc(Math.abs(G.u[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], G.R)));
    } else if (t === 'hollow') {
      sphere3(G.pos, G.R1, col, 0.05); const p = sphere3(G.pos, G.R2, C.axis, 0.18), R = G.R2 * cam.s * p[3];
      lp = [p[0] + R * 0.7, p[1] - R * 0.7];
    } else if (t === 'arc') {
      g.lineWidth = 4; g.beginPath();
      for (let i = 0; i <= 64; i++) { const th = G.t1 + ((G.t2 - G.t1) * i) / 64, q = proj(V3.add(G.pos, V3.add(V3.sc(G.e1, G.R * Math.cos(th)), V3.sc(G.e2, G.R * Math.sin(th))))); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
      g.stroke(); lp = proj(V3.add(G.pos, V3.add(V3.sc(G.e1, G.R * Math.cos((G.t1 + G.t2) / 2)), V3.sc(G.e2, G.R * Math.sin((G.t1 + G.t2) / 2)))));
    } else if (t === 'line') {
      g.lineWidth = 3;
      line3(V3.sub(G.pos, V3.sc(G.u, L * 1.2)), V3.add(G.pos, V3.sc(G.u, L * 1.2))); lp = proj(V3.add(G.pos, V3.sc(G.u, L)));
    } else if (t === 'plane' || t === 'slab') {
      const offs = t === 'slab' ? [-G.w / 2, G.w / 2] : [0];
      for (const o of offs) {
        const k1 = (G.i + 1) % 3, k2 = (G.i + 2) % 3, corner = (u, v) => { const p = cam.c.slice(); p[G.i] = G.c + o; p[k1] = cam.c[k1] + u * L; p[k2] = cam.c[k2] + v * L; return proj(p); };
        const q = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
        g.globalAlpha = 0.14; g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
        g.globalAlpha = 0.6; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
        lp = q[2];
      }
    } else if (t === 'sphere' || t === 'shell' || t === 'conductor') {
      const p = sphere3(G.pos, t === 'sphere' ? G.R2 : G.R, t === 'conductor' ? C.axis : col, t === 'shell' ? 0.1 : 0.24), R = (t === 'sphere' ? G.R2 : G.R) * cam.s * p[3];
      lp = [p[0] + R * 0.7, p[1] - R * 0.7];
    } else if (t === 'ring' || t === 'disk') {
      circle3(G.pos, G.n, G.R);
      if (t === 'disk') { g.globalAlpha = 0.2; g.fill(); g.globalAlpha = 1; }
      g.lineWidth = t === 'ring' ? 3 : 1.5; g.stroke();
      lp = proj(V3.add(G.pos, V3.sc(G.n, 0.2)));
    } else if (t === 'rod') { g.lineWidth = 5; line3(G.A, G.B); lp = proj(G.B); }
    if (lp) label(nm, lp[0] + 8, lp[1] - 4, C.ink);
  }

  /* --------------------------- interacción --------------------------- */
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function setPlace(spec) {
    place = spec ? { ...spec, pts: [] } : null;
    cv.classList.toggle('placing', !!place);
    redraw();
    if (place) decir(`${place.hint || 'Colocar'}. Con teclado: flechas para mover la vista e Intro para colocarlo en el centro del lienzo.`);
  }
  function down(e) {
    const p = pos(e);
    if (place && !is3D()) {
      const w = toW(p[0], p[1]);
      const snap = e.shiftKey ? 0.01 : 0.25, [a, b] = ax();
      for (const k of [a, b]) w[k] = +(Math.round(w[k] / snap) * snap).toFixed(2);
      place.pts.push(w);
      if (place.pts.length >= place.n) { const sp = place; place = null; cv.classList.remove('placing'); sp.done(sp.pts); }
      else redraw();
      return;
    }
    if (is3D()) { drag = { rot: p, y0: cam.yaw, p0: cam.pitch }; cv.setPointerCapture(e.pointerId); return; }
    let best = null, bd = 14;
    for (const an of anchors) { const d = Math.hypot(an.p[0] - p[0], an.p[1] - p[1]); if (d < bd) { bd = d; best = an; } }
    drag = best ? { anchor: best } : { pan: p, c0: [view.cx, view.cy] };
    if (best) { fast = true; }
    cv.setPointerCapture(e.pointerId);
    cv.classList.add('dragging');
  }
  function move(e) {
    const p = pos(e);
    if (!drag) {
      hover = is3D() ? null : p;
      const near = anchors.some((an) => Math.hypot(an.p[0] - p[0], an.p[1] - p[1]) < 14);
      cv.style.cursor = place ? 'copy' : is3D() ? 'grab' : near ? 'grab' : 'crosshair';
      if (!is3D()) redraw();
      return;
    }
    if (drag.rot) {
      cam.yaw = drag.y0 + (p[0] - drag.rot[0]) * 0.01;
      cam.pitch = Math.max(-1.5, Math.min(1.5, drag.p0 + (p[1] - drag.rot[1]) * 0.01));
      fast = true; redraw();
      return;
    }
    if (drag.pan) {
      view.cx = drag.c0[0] - (p[0] - drag.pan[0]) / view.s;
      view.cy = drag.c0[1] + (p[1] - drag.pan[1]) / view.s;
      fast = true; redraw();
      return;
    }
    const w = toW(p[0], p[1]);
    const snap = e.shiftKey ? 0.01 : 0.25;
    const [a, b] = ax();
    for (const k of [a, b]) App.onDrag([...drag.anchor.path, k], String(+(Math.round(w[k] / snap) * snap).toFixed(2)));
  }
  function up() {
    const was = drag; drag = null; cv.classList.remove('dragging');
    if (was && (was.anchor ? App.endDrag?.() : true)) { /* fin del arrastre */ }
    clearTimeout(fastTimer);
    fastTimer = setTimeout(() => { fast = false; redraw(); }, 120);
  }
  /* ------------------------- teclado ------------------------- */
  // Cada punto que se arrastra con el ratón (cargas, extremos, puntos de cálculo) se elige con Intro y se mueve con las flechas;
  // lo que pasa se dice en la región #cv-estado (aria-live) para quien usa lector de pantalla.
  const clave = (an) => JSON.stringify(an.path);
  const decir = (t) => { const e = el('cv-estado'); if (e) e.textContent = t; };
  const coma = (x) => String(+x.toFixed(2)).replace('.', ',').replace('-', '−');
  function dondeEsta(an) {
    const [a, b] = ax(), u = lastOut?.ctx?.unit || 'a';
    return `${an.lab}, en ${'xyz'[a]} = ${coma(an.at[a])}${u}, ${'xyz'[b]} = ${coma(an.at[b])}${u}`;
  }
  function elegido() { return foco ? anchors.find((an) => clave(an) === foco) : null; }
  function elige(dir) {
    if (!anchors.length) { decir('No hay ningún punto que se pueda mover.'); return; }
    const i = anchors.findIndex((an) => clave(an) === foco), j = ((i < 0 ? (dir > 0 ? -1 : 0) : i) + dir + anchors.length) % anchors.length;
    foco = clave(anchors[j]); redraw();
    decir(`Punto ${j + 1} de ${anchors.length}: ${dondeEsta(anchors[j])}. Flechas para moverlo.`);
  }
  function teclado(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, flecha = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[k];
    if (is3D()) {
      if (!flecha) return;
      e.preventDefault(); cam.yaw += flecha[0] * 0.1; cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch - flecha[1] * 0.1)); redraw(); return;
    }
    if (place) {
      if (k === 'Enter') {
        e.preventDefault();
        const w = toW(W / 2, H / 2), [a, b] = ax();
        for (const c of [a, b]) w[c] = +(Math.round(w[c] / 0.25) * 0.25).toFixed(2);
        place.pts.push(w);
        if (place.pts.length >= place.n) { const sp = place; place = null; cv.classList.remove('placing'); sp.done(sp.pts); decir('Punto colocado.'); }
        else { redraw(); decir(`Punto ${place.pts.length} de ${place.n} colocado.`); }
        return;
      }
    }
    if (flecha) {
      e.preventDefault();
      const an = elegido();
      if (an) {
        const [a, b] = ax(), paso = e.shiftKey ? 0.01 : 0.25, nuevo = { [a]: an.at[a] + flecha[0] * paso, [b]: an.at[b] + flecha[1] * paso };
        for (const c of [a, b]) App.onDrag([...an.path, c], String(+(Math.round(nuevo[c] / paso) * paso).toFixed(2)));
        App.endDrag?.();
        const ant = clave(an);
        setTimeout(() => { const nu = anchors.find((x) => clave(x) === ant); if (nu) decir(`${coma(nu.at[a])}${lastOut?.ctx?.unit || 'a'}, ${coma(nu.at[b])}${lastOut?.ctx?.unit || 'a'}`); }, 150);
      } else { view.cx += (flecha[0] * 30) / view.s; view.cy += (flecha[1] * 30) / view.s; redraw(); }
    } else if (k === 'Enter' || k === ' ') { e.preventDefault(); elige(e.shiftKey ? -1 : 1); }
    else if (k === 'Escape' && foco) { foco = null; redraw(); decir('Punto soltado.'); }
    else if (k === '+' || k === '=') { e.preventDefault(); zoom(1.15); }
    else if (k === '-' || k === '_') { e.preventDefault(); zoom(0.87); }
    else if (k === '0' || k === 'Home') { e.preventDefault(); fit(); redraw(); }
  }
  // el anillo alrededor del punto elegido con el teclado
  function drawFoco(C) {
    const an = elegido(); if (!an) return;
    g.save(); g.strokeStyle = C.ink; g.lineWidth = 2; g.setLineDash([4, 3]);
    g.beginPath(); g.arc(an.p[0], an.p[1], 15, 0, 7); g.stroke(); g.restore();
  }
  function snapshot() { try { return cv.toDataURL('image/png'); } catch (e) { return ''; } }

  return { init, draw, fit, zoom, setPlace, addProbe, clearProbes, snapshot, isPlacing: () => !!place, toWorldCenter: () => toW(W / 2, H / 2) };
})();


/* =====================================================================
   Interfaz: barra lateral (biblioteca, buscador, carpetas), editor del
   problema, resultados, modo práctica, exportar, deshacer/rehacer,
   colocar con clic, gráficas y archivos .emsim.json.
   ===================================================================== */
(() => {
  const { SOURCES, ANALYSES, CONDS } = Physics;
  const { KINDS } = Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  };
  const K_LIB = 'electro-sim-lib-v2', K_CUR = 'electro-sim-cur-v2', K_UI = 'electro-sim-ui-v2';
  const FORMAT = 'simulador-electrostatica';
  let uid = 0;
  const newId = () => 'u' + Date.now().toString(36) + (uid++).toString(36);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const blankScene = () => ({ unit: 'a', mode: 'sym', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, sources: [], analyses: [] });
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const arrows = (s) => String(s).replace(/(.)⃗/g, '<span class="vv">$1</span>');

  /* ---------------- estado ---------------- */
  let lib = store.get(K_LIB, { items: [] });
  let ui = { side: true, presetsOpen: true, folders: {}, practice: false, ...store.get(K_UI, {}) };
  let cur = null; // { ref: {kind: 'preset'|'lib', id}, title, statement, folder, tags, scene }
  let scen = null; // atajo a cur.scene
  let out = null;
  let query = '';
  const isMobile = () => matchMedia('(max-width: 900px)').matches;
  const saveUI = () => store.set(K_UI, ui);

  function validScene(s) {
    if (!s || !Array.isArray(s.sources)) throw new Error('falta la lista de fuentes');
    const sc = { ...blankScene(), ...s };
    sc.view = { plane: 'xy', cut: '0', ...(s.view || {}) };
    sc.kinds = s.kinds || {};
    sc.mode = s.mode === 'si' ? 'si' : 'sym';
    sc.sources = s.sources.filter((x) => SOURCES[x.type]).map((x) => ({ id: x.id || newId(), ...x }));
    sc.analyses = (s.analyses || []).filter((x) => ANALYSES[x.type]).map((x) => ({ id: x.id || newId(), ...x }));
    Physics.normUnknown(sc);
    if (sc.unknown) {
      sc.unknown.srcs = sc.unknown.srcs.filter((id) => sc.sources.some((x) => x.id === id));
      sc.unknown.conds = sc.unknown.conds.filter((c) => CONDS[c.type]);
    }
    return sc;
  }

  function openRef(ref, { focus = null } = {}) {
    cancelPlace();
    if (ref.kind === 'preset') {
      const p = Presets.list.find((x) => x.key === ref.id);
      if (!p) return openRef({ kind: 'preset', id: Presets.list[0].key });
      cur = { ref, title: p.title, statement: p.statement || '', note: p.note || '', scene: validScene(p.make()) };
    } else {
      const it = lib.items.find((x) => x.id === ref.id);
      if (!it) return openRef({ kind: 'preset', id: Presets.list[0].key });
      cur = { ref, title: it.title, statement: it.statement || '', folder: it.folder || '', tags: it.tags || [], note: '', scene: validScene(clone(it.scene)) };
    }
    scen = cur.scene;
    store.set(K_CUR, cur);
    resetHistory();
    Canvas.clearProbes();
    if (isMobile()) setSide(false);
    Canvas.fit();
    renderSidebar();
    renderAll();
    if (focus) { const t = $(focus); t.focus(); t.select?.(); }
  }

  // guarda el trabajo en curso y, si es un problema propio, lo actualiza en la biblioteca
  function persist() {
    store.set(K_CUR, cur);
    if (cur.ref.kind !== 'lib') return;
    const it = lib.items.find((x) => x.id === cur.ref.id);
    if (!it) return;
    Object.assign(it, { scene: clone(scen), title: cur.title, statement: cur.statement, folder: cur.folder || '', tags: cur.tags || [], updated: Date.now() });
    store.set(K_LIB, lib);
  }

  function addToLib({ title, statement, scene, origin = 'mio', file, folder = '', tags = [] }) {
    const it = { id: newId(), title: title || 'Problema sin título', statement: statement || '', scene: clone(scene), origin, file, folder, tags, updated: Date.now() };
    lib.items.unshift(it);
    store.set(K_LIB, lib);
    return it;
  }

  /* ---------------- barra lateral ---------------- */
  function setSide(open) {
    const app = $('#app');
    if (isMobile()) app.classList.toggle('mobile-open', open);
    else { ui.side = open; saveUI(); app.classList.toggle('closed', !open); }
    setTimeout(() => Canvas.draw(out, scen), 220);
  }
  let menuFor = null;
  function closeMenu() { menuFor = null; document.querySelectorAll('.menu').forEach((m) => m.remove()); }
  function openMenu(anchor, key, actions) {
    if (menuFor === key) return closeMenu();
    closeMenu(); menuFor = key;
    const m = h('div', { class: 'menu', role: 'menu' }, actions.map((a) => {
      const b = h('button', { role: 'menuitem', class: a.danger ? 'danger' : '' }, a.label);
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (a.confirm && !b.dataset.armed) { b.dataset.armed = '1'; b.textContent = a.confirm; return; }
        closeMenu(); a.run();
      });
      return b;
    }));
    anchor.append(m);
  }
  function itemRow({ ref, title, sub, actions }) {
    const active = cur && cur.ref.kind === ref.kind && cur.ref.id === ref.id;
    const row = h('div', { class: 'item' + (active ? ' active' : ''), role: 'listitem' },
      h('button', { class: 'it', title, onclick: () => openRef(ref) }, h('span', { class: 'it-t' }, title), sub ? h('span', { class: 'it-s' }, sub) : null));
    row.append(h('button', { class: 'more', 'aria-label': 'Opciones de ' + title, title: 'Opciones', onclick: (e) => { e.stopPropagation(); openMenu(row, ref.kind + ref.id, actions); } }, '⋯'));
    return row;
  }
  function libActions(it) {
    return [
      { label: 'Renombrar', run: () => openRef({ kind: 'lib', id: it.id }, { focus: '#title' }) },
      { label: 'Mover a carpeta / etiquetas', run: () => openRef({ kind: 'lib', id: it.id }, { focus: '#folder' }) },
      { label: 'Duplicar', run: () => { const c = addToLib({ ...it, title: it.title + ' (copia)', origin: 'mio' }); openRef({ kind: 'lib', id: c.id }); } },
      { label: 'Guardar en archivo', run: () => saveJSON(slug(it.title) + '.emsim.json', pack([it])) },
      { label: 'Eliminar', confirm: 'Pulsa otra vez para eliminar', danger: true, run: () => {
        lib.items = lib.items.filter((x) => x.id !== it.id); store.set(K_LIB, lib);
        if (cur.ref.kind === 'lib' && cur.ref.id === it.id) openRef({ kind: 'preset', id: Presets.list[0].key }); else renderSidebar();
        flash('Problema eliminado');
      } },
    ];
  }
  const matches = (it) => !query || norm([it.title, it.statement, it.folder, ...(it.tags || [])].join(' ')).includes(query);
  const subOf = (it) => [it.origin === 'importado' ? it.file : '', ...(it.tags || []).map((t) => '#' + t)].filter(Boolean).join(' ');
  // agrupa por carpeta: primero los sueltos, luego cada carpeta plegable
  function grouped(items) {
    const loose = items.filter((x) => !x.folder), folders = {};
    for (const it of items) if (it.folder) (folders[it.folder] ||= []).push(it);
    const row = (it) => itemRow({ ref: { kind: 'lib', id: it.id }, title: it.title, sub: subOf(it), actions: libActions(it) });
    const outEls = loose.map(row);
    for (const name of Object.keys(folders).sort((a, b) => a.localeCompare(b, 'es'))) {
      const open = query || !ui.folders[name];
      outEls.push(h('div', { class: 'fold' },
        h('button', { class: 'fold-h', 'aria-expanded': String(!!open), onclick: () => { ui.folders[name] = !ui.folders[name]; saveUI(); renderSidebar(); } },
          h('span', { class: 'chev' }, open ? '▾' : '▸'), h('span', { class: 'fold-n' }, name), h('span', { class: 'count' }, String(folders[name].length))),
        open ? h('div', { class: 'fold-l' }, folders[name].map(row)) : null));
    }
    return outEls;
  }
  function renderSidebar() {
    const box = $('#side-list');
    box.replaceChildren();
    const byDate = (a, b) => b.updated - a.updated;
    const mine = lib.items.filter((x) => x.origin !== 'importado' && matches(x)).sort(byDate);
    const imp = lib.items.filter((x) => x.origin === 'importado' && matches(x)).sort(byDate);
    const pres = Presets.list.filter((p) => matches({ title: p.title, statement: p.statement }));
    const section = (title, key, items, empty) => {
      const open = query || !key || ui[key] !== false;
      const head = h('button', { class: 'sec-h', 'aria-expanded': key ? String(!!open) : null, onclick: key && !query ? () => { ui[key] = !open; saveUI(); renderSidebar(); } : null }, h('span', {}, title), key && !query ? h('span', { class: 'chev' }, open ? '▾' : '▸') : h('span', { class: 'count' }, items.length ? String(items.length) : ''));
      const list = h('div', open && items.length ? { class: 'sec-l', role: 'list' } : { class: 'sec-l' }, open ? (items.length ? items : empty ? h('p', { class: 'side-empty' }, empty) : null) : null);
      box.append(h('section', { class: 'sec' }, head, list));
    };
    if (!query || mine.length) section('Mis problemas', null, grouped(mine), query ? '' : 'Aún no tienes problemas propios. Crea uno nuevo o guarda un ejercicio de ejemplo.');
    if (imp.length) section('Importados', null, grouped(imp), '');
    if (!query || pres.length) section(Presets.section, 'presetsOpen', pres.map((p) => itemRow({ ref: { kind: 'preset', id: p.key }, title: p.title, actions: [
      { label: 'Duplicar en Mis problemas', run: () => { const c = addToLib({ title: p.title, statement: p.statement, scene: p.make() }); openRef({ kind: 'lib', id: c.id }); } },
      { label: 'Guardar en archivo', run: () => saveJSON(slug(p.title) + '.emsim.json', pack([{ title: p.title, statement: p.statement, scene: p.make() }])) },
    ] })), '');
    if (query && !mine.length && !imp.length && !pres.length) box.append(h('p', { class: 'side-empty' }, `Nada coincide con «${$('#search').value}».`));
    $('#save-lib').disabled = !lib.items.length;
    const dl = $('#folders-dl');
    dl.replaceChildren(...[...new Set(lib.items.map((x) => x.folder).filter(Boolean))].map((f) => h('option', { value: f })));
  }

  /* ---------------- archivos ---------------- */
  const slug = (t) => (norm(t).replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'problema');
  function pack(items) {
    return { formato: FORMAT, version: 3, guardado: new Date().toISOString(), problemas: items.map((i) => ({ titulo: i.title, enunciado: i.statement || '', carpeta: i.folder || undefined, etiquetas: i.tags?.length ? i.tags : undefined, escena: i.scene })) };
  }
  function unpack(obj) {
    if (obj?.formato === FORMAT && Array.isArray(obj.problemas)) return obj.problemas.map((p) => ({ title: p.titulo || 'Problema sin título', statement: p.enunciado || '', folder: p.carpeta || '', tags: Array.isArray(p.etiquetas) ? p.etiquetas : [], scene: validScene(p.escena) }));
    if (obj?.sources) return [{ title: 'Escena importada', statement: '', scene: validScene(obj) }];
    throw new Error('no es un archivo del simulador');
  }
  const dlPromise = window.claude?.use ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  async function saveFile(filename, text, mime) {
    const dl = await Promise.race([dlPromise, new Promise((r) => setTimeout(() => r(null), 1500))]);
    if (dl) {
      try { await dl.save({ filename, data: text }); flash('Archivo guardado: ' + filename); }
      catch (e) { flash(e?.code === 'declined' ? 'Guardado cancelado' : 'No se pudo guardar el archivo aquí (' + (e?.code || 'error') + ')'); }
      return;
    }
    // fuera del visor de Claude (archivo abierto en un navegador normal)
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: mime })), download: filename });
    document.body.append(a); a.click(); a.remove();
    flash('Archivo guardado: ' + filename);
  }
  const saveJSON = (filename, obj) => saveFile(filename, JSON.stringify(obj, null, 2), 'application/json');
  async function importFiles(files) {
    let n = 0, first = null;
    const bad = [];
    for (const f of files) {
      try {
        const probs = unpack(JSON.parse(await f.text()));
        for (const p of probs) { const it = addToLib({ ...p, origin: 'importado', file: f.name }); first ||= it; n++; }
      } catch (e) { bad.push(`${f.name}: ${e.message}`); }
    }
    if (first) openRef({ kind: 'lib', id: first.id }); else renderSidebar();
    flash(n ? `${n} problema${n > 1 ? 's' : ''} importado${n > 1 ? 's' : ''}` + (bad.length ? `; no se pudo leer ${bad.join(', ')}` : '') : 'No se pudo leer: ' + bad.join(', '));
  }

  /* ---------------- campos de formulario ---------------- */
  const getPath = (o, p) => p.reduce((a, k) => a?.[k], o);
  const setPath = (o, p, v) => { const last = p[p.length - 1]; getPath(o, p.slice(0, -1))[last] = v; };
  function input(path, opts = {}) {
    const val = getPath(scen, path) ?? '';
    const el = h('input', { type: 'text', id: 'f-' + path.join('-'), class: 'in ' + (opts.cls || ''), value: val, placeholder: opts.ph || '', 'aria-label': opts.aria || path.join(' '), spellcheck: 'false', autocomplete: 'off' });
    el.dataset.path = JSON.stringify(path);
    el.addEventListener('input', () => { setPath(scen, path, el.value); opts.structural ? renderAll() : schedule(); });
    return el;
  }
  function select(path, options, opts = {}) {
    const val = getPath(scen, path);
    const el = h('select', { class: 'in', id: 'f-' + path.join('-'), 'aria-label': opts.aria || path.join(' ') },
      options.map(([v, l]) => h('option', { value: v, selected: v === val }, l)));
    el.addEventListener('change', () => { setPath(scen, path, el.value); opts.structural === false ? schedule() : renderAll(); });
    return el;
  }
  const fieldRow = (label, ...ctrl) => h('label', { class: 'row' }, h('span', { class: 'lab' }, label), h('span', { class: 'ctl' }, ...ctrl));
  function buildField(f, base, obj) {
    const p = [...base, f.k];
    if (f.show && !f.show(obj, scen)) return null;
    switch (f.t) {
      case 'vec3':
      case 'vec3opt':
        return fieldRow(f.label, h('span', { class: 'vec' }, ['x', 'y', 'z'].map((c, i) => h('span', { class: 'vc' }, h('i', {}, c), input([...p, i], { cls: 'num', ph: f.t === 'vec3opt' ? '—' : '0', aria: `${f.label} ${c}` })))));
      case 'expr': return fieldRow(f.label, input(p, { cls: 'num', ph: f.optional ? 'opcional' : '0' }));
      case 'sym': return fieldRow(f.label, input(p, { cls: 'sym', ph: 'p' }));
      case 'select': return fieldRow(f.label, select(p, f.options, { structural: !!f.structural }));
      case 'charge': return fieldRow(f.label, h('span', { class: 'chg' }, input([...p, 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...p, 'sym'], { cls: 'sym', ph: 'q', aria: 'símbolo' })));
      case 'value': return fieldRow(f.label, h('span', { class: 'chg' }, input([...p, 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...p, 'sym'], { cls: 'sym', ph: 'q', aria: 'símbolo' }), h('span', { class: 'x tail' }, scen.mode === 'si' ? 'SI' : '/(ε₀ aⁿ)')));
    }
    return null;
  }

  /* ---------------- colocar con clic en el lienzo ---------------- */
  const PLACE_KEYS = ['pos', 'A', 'B', 'P', 'C', 'P0'];
  const PERP = { xy: 2, xz: 1, yz: 0 };
  const AXI = { x: 0, y: 1, z: 2 };
  let placing = null; // { kind, type }
  const placeFields = (def) => def.fields.filter((f) => f.t === 'vec3' && PLACE_KEYS.includes(f.k));
  const coord = (v) => String(+v.toFixed(2));
  function ptToStr(p) {
    const perp = PERP[scen.view.plane];
    return p.map((v, i) => (i === perp ? String(scen.view.cut ?? '0') : coord(v)));
  }
  function applyPts(obj, def, pts, planeLike) {
    if (!pts) return;
    if (planeLike) obj.at = coord(pts[0][AXI[obj.axis]]);
    else placeFields(def).forEach((f, i) => { if (pts[i]) obj[f.k] = ptToStr(pts[i]); });
  }
  function markChips() {
    document.querySelectorAll('[data-place]').forEach((c) => c.classList.toggle('on', !!placing && c.dataset.place === placing.kind + ':' + placing.type));
  }
  function cancelPlace() {
    if (!placing) return;
    placing = null; Canvas.setPlace(null); markChips();
  }
  function chipAdd(kind, type) {
    const make = (pts) => (kind === 'src' ? addSource(type, null, pts) : kind === 'an' ? addAnalysis(type, pts) : Canvas.addProbe(pts[0], type === '+' ? 1 : -1));
    if (placing && placing.kind === kind && placing.type === type) { cancelPlace(); if (kind !== 'probe') make(null); return; }
    cancelPlace();
    const def = kind === 'src' ? SOURCES[type] : kind === 'an' ? ANALYSES[type] : null;
    const planeLike = kind === 'src' && (type === 'plane' || type === 'slab');
    const fs = def ? placeFields(def) : [{ label: 'punto de salida' }];
    const n = planeLike ? 1 : fs.length;
    if (scen.view.plane === '3d') {
      if (kind === 'probe') return flash('Las cargas de prueba se sueltan en una vista 2D (XY, XZ o YZ).');
      return make(null);
    }
    if (!n) return make(null);
    placing = { kind, type };
    markChips();
    $('#cv').scrollIntoView({ block: 'nearest', behavior: 'instant' });
    const what = planeLike ? 'un punto del plano' : fs.map((f) => f.label.toLowerCase()).join(', luego ');
    Canvas.setPlace({
      hint: `Clic en el lienzo: ${what}` + (kind === 'probe' ? ' · Esc: cancelar' : ' · Esc: cancelar, botón otra vez: por defecto'),
      n, done: (pts) => { placing = null; markChips(); make(pts); },
    });
  }

  /* ---------------- fuentes ---------------- */
  function addSource(type, copyOf, pts) {
    const def = SOURCES[type];
    const n = scen.sources.filter((s) => SOURCES[s.type].prefix === def.prefix).length + 1;
    const src = copyOf ? { ...clone(copyOf), id: newId(), name: (copyOf.name || def.prefix) + '′' } : { id: newId(), type, name: def.prefix + n, ...def.defaults() };
    if (scen.mode === 'si' && !copyOf) src.s = { c: '1e-9', sym: '' };
    applyPts(src, def, pts, type === 'plane' || type === 'slab');
    scen.sources.push(src);
    if (!pts) Canvas.fit();
    renderAll();
    if (!pts) requestAnimationFrame(() => document.querySelector(`.src[data-id="${src.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  function addAnalysis(type, pts) {
    const def = ANALYSES[type];
    const an = { id: newId(), type, ...def.defaults() };
    if (scen.mode === 'si' && an.Q) an.Q = { c: '1e-9', sym: '' };
    applyPts(an, def, pts, false);
    scen.analyses.push(an);
    renderAll();
    if (!pts) requestAnimationFrame(() => document.querySelector(`.an[data-id="${an.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  const isUnk = (id) => !!scen.unknown?.srcs?.includes(id);
  function renderSources() {
    const box = $('#sources');
    box.replaceChildren();
    scen.sources.forEach((src, i) => {
      const def = SOURCES[src.type];
      const unk = isUnk(src.id);
      const base = ['sources', i];
      box.append(h('div', { class: 'card src' + (unk ? ' unk' : ''), 'data-id': src.id },
        h('div', { class: 'card-h' },
          h('span', { class: 'badge b-' + src.type }, def.label),
          input([...base, 'name'], { cls: 'name', aria: 'nombre' }),
          h('button', { class: 'icon', title: 'Duplicar fuente', 'aria-label': 'Duplicar fuente', onclick: () => addSource(src.type, src) }, '⧉'),
          h('button', { class: 'icon del', title: 'Eliminar fuente', 'aria-label': 'Eliminar fuente', onclick: () => { if (unk) scen.unknown.srcs = scen.unknown.srcs.filter((x) => x !== src.id); scen.sources.splice(i, 1); renderAll(); } }, '×')),
        unk ? h('div', { class: 'row unkrow' }, h('span', { class: 'lab' }, 'Valor'), h('span', { class: 'ctl' }, h('span', { class: 'pill' }, 'incógnita'))) :
          fieldRow('Valor', h('span', { class: 'chg' }, input([...base, 's', 'c'], { cls: 'num', aria: 'coeficiente' }), h('span', { class: 'x' }, '×'), input([...base, 's', 'sym'], { cls: 'sym', aria: 'símbolo', ph: scen.mode === 'si' ? '(nada)' : '' }), scen.mode === 'si' ? h('span', { class: 'x tail' }, KINDS[def.kindOf ? def.kindOf(src) : def.kind]?.si || '') : null)),
        def.fields.map((f) => buildField({ ...f, structural: f.structural || f.k === 'mode' }, base, src))));
    });
    if (!scen.sources.length) box.append(h('p', { class: 'empty' }, 'Aún no hay fuentes. Pulsa un botón de arriba (Carga, Hilo, Plano…) y haz clic en el lienzo para colocarla.'));
  }

  /* ---------------- incógnitas ---------------- */
  const defaultCond = () => ({ type: 'Ezero', P: ['1', '0', '0'], comp: 'x', d: ['0', '1', '0'], A: ['1', '0', '0'], B: ['2', '0', '0'], val: { c: '0', sym: '' } });
  function renderUnknown() {
    const box = $('#unknown');
    box.replaceChildren();
    if (!scen.sources.length) { box.append(h('p', { class: 'empty' }, 'Añade primero las fuentes.')); return; }
    const u = scen.unknown;
    const list = h('div', { class: 'unk-list', role: 'group', 'aria-label': 'Fuentes desconocidas' }, scen.sources.map((s) => {
      const cb = h('input', { type: 'checkbox', id: 'unk-' + s.id, checked: isUnk(s.id) });
      cb.addEventListener('change', () => {
        scen.unknown ||= { srcs: [], conds: [] };
        const U = scen.unknown;
        U.srcs = cb.checked ? [...U.srcs, s.id] : U.srcs.filter((x) => x !== s.id);
        if (cb.checked && !U.conds.length) U.conds.push(defaultCond());
        renderAll();
      });
      return h('label', { class: 'unk-o' }, cb, h('span', { class: 'math', html: Fmt.sym(s.name || SOURCES[s.type].prefix) }), h('span', { class: 'it-s' }, SOURCES[s.type].label));
    }));
    box.append(h('div', { class: 'lab' }, 'Fuentes cuyo valor es desconocido:'), list);
    if (!u || !u.srcs.length) return;
    u.conds.forEach((c, j) => {
      for (const k of ['P', 'd', 'A', 'B']) c[k] ??= ['0', '0', '0'];
      c.val ??= { c: '0', sym: '' };
      c.comp ??= 'x';
      const base = ['unknown', 'conds', j];
      box.append(h('div', { class: 'card cond' },
        h('div', { class: 'card-h' }, h('h3', {}, 'Condición ' + (j + 1)), h('button', { class: 'icon del', title: 'Quitar condición', 'aria-label': 'Quitar condición', onclick: () => { u.conds.splice(j, 1); renderAll(); } }, '×')),
        fieldRow('Tipo', select([...base, 'type'], Object.entries(CONDS).map(([k, v]) => [k, v.label]))),
        CONDS[c.type].fields.map((f) => buildField(f, base, c))));
    });
    box.append(h('div', { class: 'tools' },
      h('button', { class: 'chip', onclick: () => { u.conds.push(defaultCond()); renderAll(); } }, '+ Añadir condición'),
      h('span', { class: 'hint' }, `${u.srcs.length} incógnita${u.srcs.length > 1 ? 's' : ''}: hacen falta otras tantas ecuaciones (E = 0 cuenta como tres).`)));
    box.append(h('div', { class: 'card an unk-card', id: 'unk-card' },
      h('div', { class: 'result', id: 'unk-res' }),
      h('div', { class: 'prac', id: 'prac-unk' }),
      h('details', { class: 'steps-d', id: 'unk-steps' }, h('summary', {}, 'Ver desarrollo'), h('div', { class: 'steps-b' }))));
  }

  /* ---------------- símbolos ---------------- */
  function renderSymbols(ctx) {
    const box = $('#symbols');
    box.replaceChildren();
    const names = Object.keys(ctx.kinds).filter((k) => !k.startsWith('§') && k);
    if (!names.length) box.append(h('p', { class: 'empty' }, scen.mode === 'si' ? 'En modo SI no hacen falta símbolos: escribe los valores numéricos.' : 'Aparecerán aquí cuando uses símbolos (q, λ, σ…).'));
    names.forEach((n) => {
      const sel = h('select', { class: 'in', id: 'kind-' + n, 'aria-label': 'Tipo de ' + n }, Object.entries(KINDS).map(([k, v]) => h('option', { value: k, selected: ctx.kinds[n] === k }, `${v.label} (${v.hint})`)));
      sel.addEventListener('change', () => { scen.kinds[n] = sel.value; schedule(); });
      box.append(h('label', { class: 'row' }, h('span', { class: 'lab math', html: Fmt.sym(n) }), h('span', { class: 'ctl' }, sel)));
    });
  }

  /* ---------------- preguntas ---------------- */
  function renderAnalyses() {
    const box = $('#analyses');
    box.replaceChildren();
    scen.analyses.forEach((an, i) => {
      const def = ANALYSES[an.type];
      const base = ['analyses', i];
      box.append(h('section', { class: 'card an', 'data-i': i, 'data-id': an.id },
        h('div', { class: 'card-h' }, h('h3', {}, def.label), h('button', { class: 'icon del', title: 'Quitar pregunta', 'aria-label': 'Quitar pregunta', onclick: () => { scen.analyses.splice(i, 1); renderAll(); } }, '×')),
        def.fields.length ? h('div', { class: 'an-f' }, def.fields.map((f) => buildField(f, base, an))) : null,
        h('div', { class: 'result math', id: 'res-' + i }),
        h('div', { class: 'prac', id: 'prac-' + i }),
        h('div', { class: 'act', id: 'act-' + i }),
        h('details', { class: 'steps-d', id: 'steps-' + i }, h('summary', {}, 'Ver desarrollo paso a paso'), h('div', { class: 'steps-b math' }))));
    });
    if (!scen.analyses.length) box.append(h('p', { class: 'empty' }, 'Aún no hay preguntas. Elige arriba qué quieres calcular: campo, potencial, fuerza, dipolo, flujo, perfil…'));
  }

  /* ---------------- modo práctica ---------------- */
  const pracVals = {};
  function renderPractice(box, key, answers, getAnswers) {
    const card = box.closest('.card');
    card.classList.toggle('has-ans', !!answers?.length);
    if (!ui.practice || !answers?.length) { box.replaceChildren(); box.dataset.sig = ''; return; }
    const sig = answers.map((a) => a.label + (a.vec ? '3' : '1')).join('|') + scen.mode;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    box.replaceChildren();
    const si = scen.mode === 'si';
    answers.forEach((ans, j) => {
      const k = key + ':' + j;
      const vals = (pracVals[k] ||= ['', '', '']);
      const n = ans.vec ? 3 : 1;
      const unit = si ? (Engine.QTY[ans.qty]?.si || KINDS[ans.qty]?.si || '') : '';
      const ins = Array.from({ length: n }, (_, c) => {
        const el = h('input', { type: 'text', class: 'in num', value: vals[c], 'aria-label': `${ans.label} ${n > 1 ? 'xyz'[c] : ''}`, spellcheck: 'false', autocomplete: 'off',
          placeholder: si ? (unit ? 'valor en ' + unit : 'valor') : n > 1 ? 'xyz'[c] + ': p. ej. q/(4*pi*eps0*a^2)' : 'p. ej. q/(4*pi*eps0*a)' });
        el.addEventListener('input', () => { vals[c] = el.value; msg.textContent = ''; msg.className = 'pill'; });
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
        return el;
      });
      const msg = h('span', { class: 'pill', role: 'status' });
      const check = () => {
        const a = getAnswers()?.[j];
        if (!a) return;
        const r = Physics.checkAnswer(a, vals, out.ctx);
        msg.textContent = r.ok ? '✓ ' + r.msg : '✗ ' + r.msg;
        msg.className = 'pill ' + (r.ok ? 'ok' : 'bad');
      };
      box.append(h('div', { class: 'prac-r' },
        h('span', { class: 'lab math', html: arrows(ans.label) + ' =' }),
        h('span', { class: n > 1 ? 'vec' : 'one' }, ins),
        h('span', { class: 'tools' }, h('button', { class: 'btn', onclick: check }, 'Comprobar'), msg)));
    });
    box.append(h('div', { class: 'tools' },
      h('button', { class: 'btn ghost', onclick: (e) => { const on = card.classList.toggle('reveal'); e.target.textContent = on ? 'Ocultar solución' : 'Mostrar solución'; } }, card.classList.contains('reveal') ? 'Ocultar solución' : 'Mostrar solución'),
      h('span', { class: 'hint' }, si ? 'Admite 8.99e9, 2/3…' : 'Escribe con q, lambda, sigma, rho, a, eps0, pi, sqrt(…); no importa el orden.')));
  }

  /* ---------------- gráficas E(z), V(z) ---------------- */
  const chartHidden = {};
  const SERIES_COL = ['--neg', '--ok', '--dipole', '--accent', '--mark'];
  function niceTicks(lo, hi, n) {
    const span = hi - lo || 1, raw = span / n, p = 10 ** Math.floor(Math.log10(raw));
    const st = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || raw;
    const t = [];
    for (let v = Math.ceil(lo / st) * st; v <= hi + st * 1e-9; v += st) t.push(Math.abs(v) < st * 1e-9 ? 0 : v);
    return t;
  }
  const tickTxt = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v) ? v.toExponential(1) : String(+v.toPrecision(3)));
  function drawChart(cv, ch, key, hoverI = null) {
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const dpr = window.devicePixelRatio || 1, W = Math.max(220, cv.clientWidth), H = 200;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hid = chartHidden[key] || new Set();
    const ser = ch.series.map((s, i) => ({ ...s, col: css(SERIES_COL[i % SERIES_COL.length]), i })).filter((s) => s.live && !hid.has(s.name));
    const all = ser.flatMap((s) => s.ys.filter((v) => v != null && isFinite(v))).sort((a, b) => a - b);
    const q = (f) => all[Math.min(all.length - 1, Math.floor(f * (all.length - 1)))];
    let lo = all.length ? Math.min(0, q(0.03)) : -1, hi = all.length ? Math.max(0, q(0.97)) : 1;
    if (hi - lo < 1e-12) { hi += 1; lo -= 1; }
    const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    const L = 46, R = 10, T = 10, B = 26, x0 = ch.xs[0], x1 = ch.xs[ch.xs.length - 1];
    const X = (x) => L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R), Y = (y) => T + ((hi - y) / (hi - lo)) * (H - T - B);
    g.clearRect(0, 0, W, H);
    g.font = '10.5px "IBM Plex Mono", ui-monospace, monospace';
    g.strokeStyle = css('--grid'); g.fillStyle = css('--muted'); g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const t of niceTicks(lo, hi, 4)) { g.beginPath(); g.moveTo(L, Y(t)); g.lineTo(W - R, Y(t)); g.stroke(); g.fillText(tickTxt(t), L - 5, Y(t)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of niceTicks(x0, x1, 6)) { g.beginPath(); g.moveTo(X(t), T); g.lineTo(X(t), H - B); g.stroke(); g.fillText(tickTxt(t), X(t), H - B + 5); }
    g.strokeStyle = css('--muted'); g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(W - R, Y(0)); g.stroke();
    g.textAlign = 'right'; g.fillText(ch.xlabel, W - R, H - B - 14);
    g.save(); g.beginPath(); g.rect(L, T, W - L - R, H - T - B); g.clip();
    const jump = (hi - lo) * 2;
    for (const s of ser) {
      g.strokeStyle = s.col; g.lineWidth = 1.8; g.setLineDash(s.dashed ? [6, 4] : []);
      g.beginPath();
      let pen = false, prev = null;
      s.ys.forEach((y, i) => {
        if (y == null || !isFinite(y) || (prev != null && Math.abs(y - prev) > jump)) { pen = false; prev = y; return; }
        const px = X(ch.xs[i]), py = Y(Math.max(lo - jump, Math.min(hi + jump, y)));
        pen ? g.lineTo(px, py) : g.moveTo(px, py);
        pen = true; prev = y;
      });
      g.stroke();
    }
    g.setLineDash([]);
    g.restore();
    if (hoverI != null) {
      const px = X(ch.xs[hoverI]);
      g.strokeStyle = css('--ink'); g.globalAlpha = 0.4; g.beginPath(); g.moveTo(px, T); g.lineTo(px, H - B); g.stroke(); g.globalAlpha = 1;
      const lines = [`${ch.xlabel} = ${tickTxt(ch.xs[hoverI])}`, ...ser.map((s) => `${s.name.replace('_', '')} = ${s.ys[hoverI] == null ? '—' : tickTxt(s.ys[hoverI])}`)];
      const tw = Math.max(...lines.map((t) => g.measureText(t).width)) + 14, th = lines.length * 14 + 8;
      const bx = px + tw + 12 > W ? px - tw - 8 : px + 8;
      g.fillStyle = css('--panel'); g.globalAlpha = 0.94; g.fillRect(bx, T + 2, tw, th); g.globalAlpha = 1;
      g.strokeStyle = css('--line'); g.strokeRect(bx, T + 2, tw, th);
      g.textAlign = 'left'; g.textBaseline = 'top';
      lines.forEach((t, k) => { g.fillStyle = k ? ser[k - 1].col : css('--ink'); g.fillText(t, bx + 7, T + 7 + k * 14); });
    }
  }
  function mountChart(box, ch, key) {
    const cv = box.querySelector('canvas.chart'), leg = box.querySelector('.chart-l');
    if (!cv) return;
    // las componentes idénticamente nulas no se dibujan
    const mx = Math.max(1e-300, ...ch.series.flatMap((s) => s.ys.filter((v) => v != null && isFinite(v)).map(Math.abs)));
    ch.series.forEach((s) => { s.live = s.ys.some((v) => v != null && isFinite(v) && Math.abs(v) > 1e-9 * mx); });
    const hid = (chartHidden[key] ||= new Set());
    leg.replaceChildren(...ch.series.map((s, i) => !s.live ? null : h('button', { class: 'ser' + (hid.has(s.name) ? ' off' : ''), 'aria-pressed': String(!hid.has(s.name)), onclick: () => { hid.has(s.name) ? hid.delete(s.name) : hid.add(s.name); mountChart(box, ch, key); } },
      h('span', { class: 'sw' + (s.dashed ? ' dash' : ''), style: `border-color:var(${SERIES_COL[i % SERIES_COL.length]})` }), h('span', { html: s.name.replace(/_(\w)/, '<sub>$1</sub>') }))).filter(Boolean),
      h('span', { class: 'hint' }, ch.ylabel));
    drawChart(cv, ch, key);
    const idx = (e) => { const r = cv.getBoundingClientRect(), f = (e.clientX - r.left - 46) / (r.width - 56); return Math.max(0, Math.min(ch.xs.length - 1, Math.round(f * (ch.xs.length - 1)))); };
    cv.onpointermove = (e) => drawChart(cv, ch, key, idx(e));
    cv.onpointerleave = () => drawChart(cv, ch, key);
  }

  /* ---------------- cálculo ---------------- */
  let pending = 0;
  function schedule() { if (!pending) pending = requestAnimationFrame(() => { pending = 0; compute(); }); }
  function compute() {
    persist();
    try { out = Physics.run(scen); } catch (e) { out = null; $('#errors').textContent = 'Error: ' + e.message; $('#errors').hidden = false; return; }
    const { ctx, unknown, results } = out;
    $('#errors').textContent = ctx.errors.length ? 'Revisa: ' + ctx.errors.join(' · ') : '';
    $('#errors').hidden = !ctx.errors.length;
    if (unknown && $('#unk-res')) {
      $('#unk-res').innerHTML = unknown.error ? `<div class="warn">${unknown.error}</div>` : `<div class="math big">${unknown.html}</div>`;
      $('#unk-steps .steps-b').innerHTML = unknown.steps || '';
      $('#unk-steps').hidden = !unknown.steps;
      renderPractice($('#prac-unk'), 'unk', unknown.error ? null : unknown.answers, () => out.unknown?.answers);
    }
    results.forEach((res, i) => {
      const r = $('#res-' + i), st = $('#steps-' + i + ' .steps-b'), act = $('#act-' + i);
      if (!r) return;
      r.innerHTML = res.error ? `<div class="warn">No se pudo calcular: ${Fmt.esc(res.error)}</div>` : res.res;
      st.innerHTML = res.steps || '';
      $('#steps-' + i).hidden = !res.steps;
      act.replaceChildren();
      if (res.action) act.append(h('button', { class: 'btn ghost', onclick: () => { scen.sources.push({ id: newId(), ...res.action.make() }); renderAll(); } }, res.action.label));
      if (res.chart) mountChart(r, res.chart, scen.analyses[i].id);
      renderPractice($('#prac-' + i), scen.analyses[i].id, res.error ? null : res.answers, () => out.results[i]?.answers);
    });
    renderSymbolsIfChanged(ctx);
    Canvas.draw(out, scen);
    scheduleCommit();
  }
  let lastSyms = '';
  function renderSymbolsIfChanged(ctx) {
    const sig = JSON.stringify(ctx.kinds) + scen.mode;
    if (sig !== lastSyms) { lastSyms = sig; renderSymbols(ctx); }
  }
  function renderHeader() {
    $('#title').value = cur.title;
    const st = $('#statement');
    st.value = cur.statement;
    autosize(st);
    const isPreset = cur.ref.kind === 'preset';
    const it = !isPreset && lib.items.find((x) => x.id === cur.ref.id);
    $('#origin').textContent = isPreset ? 'Ejemplo' : it?.origin === 'importado' ? 'Importado' : 'Mi problema';
    $('#banner').hidden = !isPreset;
    $('#meta').hidden = isPreset;
    if (!isPreset) { $('#folder').value = cur.folder || ''; $('#tags').value = (cur.tags || []).join(', '); }
    $('#note').textContent = cur.note || '';
    $('#note').hidden = !cur.note;
  }
  function renderAll() {
    const ae = document.activeElement?.id;
    renderHeader();
    const si = scen.mode === 'si';
    $('#mode').value = si ? 'si' : 'sym';
    $('#unit').value = si ? 'm' : scen.unit || 'a';
    $('#unit').disabled = si;
    $('#hint-src').innerHTML = si
      ? 'Modo numérico SI: longitudes en metros y valores en unidades SI (C, C/m, C/m²…), p. ej. <code>2e-9</code>. Deja el símbolo vacío.'
      : 'Longitudes en unidades de la escala (<code>a</code>). Admite <code>5/2</code>, <code>2*sqrt(3)</code>, <code>√7</code>, <code>pi</code>. Valor = coeficiente × símbolo.';
    $('#hint-an').textContent = si
      ? 'Resultados numéricos en unidades SI (ε₀ = 8,854·10⁻¹² F/m).'
      : 'Resultados exactos en la forma del libro: coeficiente · símbolos / (π ε₀ aⁿ). Abre “Ver desarrollo” para seguir cada paso.';
    const plane = scen.view?.plane || 'xy';
    $('#plane').value = plane;
    $('#cut').value = scen.view?.cut ?? '0';
    $('#cut-w').hidden = plane === '3d';
    $('#cut-l').textContent = { xy: 'z', xz: 'y', yz: 'x' }[plane] + ' =';
    $('#app').classList.toggle('practice', !!ui.practice);
    $('#practice').checked = !!ui.practice;
    renderSources(); renderUnknown(); renderAnalyses();
    lastSyms = '';
    compute();
    if (ae && ae !== 'title' && document.getElementById(ae)) document.getElementById(ae).focus();
  }
  function autosize(t) { t.style.height = 'auto'; t.style.height = Math.max(60, t.scrollHeight + 2) + 'px'; }

  /* ---------------- deshacer / rehacer ---------------- */
  let hist = { past: [], future: [], last: '' }, commitT = 0;
  function resetHistory() { clearTimeout(commitT); hist = { past: [], future: [], last: JSON.stringify(scen) }; updateHistBtns(); }
  function commit() {
    clearTimeout(commitT);
    const s = JSON.stringify(scen);
    if (s === hist.last) return;
    hist.past.push(hist.last);
    if (hist.past.length > 150) hist.past.shift();
    hist.last = s; hist.future = [];
    updateHistBtns();
  }
  function scheduleCommit() { clearTimeout(commitT); commitT = setTimeout(commit, 450); }
  function restore(s) { cur.scene = scen = JSON.parse(s); hist.last = s; renderAll(); updateHistBtns(); }
  function undo() { commit(); if (!hist.past.length) return flash('Nada que deshacer'); hist.future.push(hist.last); restore(hist.past.pop()); }
  function redo() { commit(); if (!hist.future.length) return flash('Nada que rehacer'); hist.past.push(hist.last); restore(hist.future.pop()); }
  function updateHistBtns() { $('#undo').disabled = !hist.past.length; $('#redo').disabled = !hist.future.length; }

  /* ---------------- exportar la solución ---------------- */
  function describe(def, obj) {
    const parts = [];
    for (const f of def.fields) {
      if (f.show && !f.show(obj, scen)) continue;
      const v = obj[f.k];
      if (v == null || v === '') continue;
      if (Array.isArray(v)) { if (v.every((x) => x === '')) continue; parts.push(`${f.label} = (${v.map((x) => x || '0').join(', ')})`); }
      else if (typeof v === 'object') parts.push(`${f.label} = ${v.c}${v.sym ? '·' + v.sym : ''}`);
      else if (f.t === 'select') parts.push(`${f.label}: ${(f.options.find((o) => o[0] === v) || [v, v])[1]}`);
      else parts.push(`${f.label} = ${v}`);
    }
    return parts.join('; ');
  }
  function toText(node) {
    if (node.nodeType === 3) return node.textContent.replace(/ /g, ' ');
    if (node.nodeType !== 1) return '';
    const kids = () => [...node.childNodes].map(toText).join('');
    const tag = node.tagName.toLowerCase(), cl = node.classList;
    if (tag === 'canvas' || tag === 'button' || cl.contains('chart-l')) return '';
    if (cl.contains('fr')) {
      const [nu, de] = [...node.children].map((c) => toText(c).trim());
      const wrap = (t) => (/^[\w.√²³πε₀λσρ]+$/u.test(t) ? t : `(${t})`);
      return `${wrap(nu)}/${wrap(de)}`;
    }
    if (tag === 'sup') { const t = kids(); return t.length > 1 ? `^(${t})` : '^' + t; }
    if (tag === 'sub') { const t = kids(); return t.length > 1 ? `_(${t})` : '_' + t; }
    if (cl.contains('vv') || cl.contains('uv')) return kids() + '⃗';
    if (tag === 'br') return '\n';
    if (tag === 'li') return '\n- ' + kids().trim();
    if (tag === 'div' || tag === 'p' || tag === 'ol' || tag === 'ul') return '\n' + kids() + '\n';
    return kids();
  }
  const htmlText = (html) => { const d = document.createElement('div'); d.innerHTML = html; return toText(d).replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim(); };
  function exportMD() {
    const L = [`# ${cur.title}`, ''];
    if (cur.statement.trim()) L.push(...cur.statement.trim().split('\n').map((l) => '> ' + l), '');
    L.push(`*Unidad de longitud: ${scen.mode === 'si' ? 'm (modo numérico SI)' : scen.unit || 'a'}*`, '', '## Datos', '');
    for (const s of scen.sources) {
      const def = SOURCES[s.type];
      L.push(`- **${s.name}** (${def.label}): ${isUnk(s.id) ? 'valor desconocido' : `valor = ${s.s.c}${s.s.sym ? '·' + s.s.sym : ''}`}; ${describe(def, s)}`);
    }
    if (out?.unknown) {
      L.push('', '## Incógnitas', '');
      scen.unknown.conds.forEach((c, j) => L.push(`- Condición ${j + 1}: ${CONDS[c.type].label}; ${describe(CONDS[c.type], c)}`));
      L.push('', '**Resultado:** ' + (out.unknown.error || htmlText(out.unknown.html)).replace(/\n/g, '; '), '');
      if (out.unknown.steps) L.push('**Desarrollo**', '', htmlText(out.unknown.steps), '');
    }
    L.push('', '## Preguntas');
    scen.analyses.forEach((an, i) => {
      const def = ANALYSES[an.type], res = out?.results[i] || {};
      L.push('', `### ${i + 1}. ${def.label}`, '');
      const d = describe(def, an);
      if (d) L.push(d, '');
      L.push('**Resultado:**', '', res.error ? 'No se pudo calcular: ' + res.error : htmlText(res.res), '');
      if (res.steps) L.push('**Desarrollo**', '', htmlText(res.steps), '');
    });
    L.push('', '---', `*Generado con el Simulador de Electrostática · ${new Date().toLocaleString('es-ES')}*`, '');
    saveFile(slug(cur.title) + '-solucion.md', L.join('\n'), 'text/markdown');
  }
  function exportHTML() {
    const esc = Fmt.esc;
    const styles = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    const img = Canvas.snapshot();
    const charts = {};
    scen.analyses.forEach((an, i) => { const c = $(`#res-${i} canvas.chart`); if (c) charts[i] = c.toDataURL('image/png'); });
    const srcRows = scen.sources.map((s) => { const def = SOURCES[s.type]; return `<li><b>${esc(s.name)}</b> (${esc(def.label)}): ${isUnk(s.id) ? '<i>valor desconocido</i>' : `valor = ${esc(s.s.c)}${s.s.sym ? '·' + esc(s.s.sym) : ''}`}; ${esc(describe(def, s))}</li>`; }).join('');
    let unk = '';
    if (out?.unknown) {
      unk = `<section class="card"><h2>Incógnitas</h2><ul>${scen.unknown.conds.map((c, j) => `<li>Condición ${j + 1}: ${esc(CONDS[c.type].label)}; ${esc(describe(CONDS[c.type], c))}</li>`).join('')}</ul>
        <div class="result math">${out.unknown.error ? `<div class="warn">${out.unknown.error}</div>` : out.unknown.html}</div>${out.unknown.steps ? `<h4>Desarrollo</h4><div class="steps-b math">${out.unknown.steps}</div>` : ''}</section>`;
    }
    const qs = scen.analyses.map((an, i) => {
      const def = ANALYSES[an.type], res = out?.results[i] || {};
      const body = res.error ? `<div class="warn">No se pudo calcular: ${esc(res.error)}</div>` : String(res.res || '').replace(/<canvas class="chart"[^>]*><\/canvas><div class="chart-l"><\/div>/, charts[i] ? `<img class="chart-img" alt="Gráfica" src="${charts[i]}">` : '');
      return `<section class="card"><h3>${i + 1}. ${esc(def.label)}</h3><p class="hint">${esc(describe(def, an))}</p><div class="result math">${body}</div>${res.steps ? `<h4>Desarrollo</h4><div class="steps-b math">${res.steps}</div>` : ''}</section>`;
    }).join('');
    const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(cur.title)} · solución</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=STIX+Two+Text:ital,wght@0,400;0,600;1,400;1,600&display=swap">
<style>${styles}
body { max-width: 860px; margin: 0 auto; padding: 24px 16px 60px; font: 14px/1.5 var(--f-ui) }
h1 { font: 600 26px var(--f-math); margin: 0 0 8px } h2 { font: 600 13px var(--f-ui); text-transform: uppercase; letter-spacing: .08em; color: var(--muted) } h3 { font: 600 15px var(--f-ui); margin: 0 } h4 { font: 600 12.5px var(--f-ui); color: var(--muted); margin: 8px 0 0 }
.card { margin: 12px 0; break-inside: avoid } .stmt { white-space: pre-wrap; font: 15px/1.5 var(--f-math); background: var(--accent-soft); padding: 10px 12px; border-radius: 8px }
.snap { width: 100%; border: 1px solid var(--line); border-radius: 8px } .chart-img { width: 100%; max-width: 640px; display: block } .printbar { display: flex; gap: 8px; margin: 10px 0 }
@media print { .printbar { display: none } body { padding: 0 } :root { --bg: #fff } }
</style></head><body>
<div class="printbar"><button class="btn ghost" onclick="print()">Imprimir o guardar como PDF</button></div>
<h1>${esc(cur.title)}</h1>${cur.statement.trim() ? `<div class="stmt">${esc(cur.statement.trim())}</div>` : ''}
<p class="hint">Unidad de longitud: ${scen.mode === 'si' ? 'm (modo numérico SI)' : esc(scen.unit || 'a')}</p>
${img ? `<img class="snap" alt="Esquema del problema" src="${img}">` : ''}
<section class="card"><h2>Datos</h2><ul>${srcRows}</ul></section>${unk}<h2>Preguntas</h2>${qs}
<p class="hint">Generado con el Simulador de Electrostática · ${esc(new Date().toLocaleString('es-ES'))}</p></body></html>`;
    saveFile(slug(cur.title) + '-solucion.html', doc, 'text/html');
  }

  /* ---------------- controles fijos ---------------- */
  const typing = (t) => !!t && (t.id === 'title' || t.id === 'statement' || t.id === 'search' || t.id === 'folder' || t.id === 'tags' || !!t.closest?.('.prac'));
  function initControls() {
    $('#side-close').addEventListener('click', () => setSide(false));
    $('#side-open').addEventListener('click', () => setSide(true));
    $('#scrim').addEventListener('click', () => setSide(false));
    document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) closeMenu(); });
    document.addEventListener('keydown', (e) => {
      const mod = (e.ctrlKey || e.metaKey) && !e.altKey, k = e.key.toLowerCase();
      if (mod && k === 'z' && !typing(e.target)) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && k === 'y' && !typing(e.target)) { e.preventDefault(); redo(); }
      else if (mod && k === 's') { e.preventDefault(); $('#save-cur').click(); }
      else if (mod && k === 'o') { e.preventDefault(); $('#file').click(); }
      else if (mod && k === 'k') { e.preventDefault(); if (isMobile()) setSide(true); else if (!ui.side) setSide(true); $('#search').focus(); }
      else if ((e.key === 'F1' || (e.key === '?' && !typing(e.target) && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) && !$('#guide').open) { e.preventDefault(); openGuide(); }
      else if (e.key === 'Escape') { if (placing) cancelPlace(); closeMenu(); if (isMobile()) setSide(false); }
    });
    $('#guide-open').addEventListener('click', () => openGuide());
    $('#help').addEventListener('click', () => openGuide());
    $('#ver').addEventListener('click', () => openGuide('g-novedades'));
    for (const el of document.querySelectorAll('.ver-n')) el.textContent = Version.current;
    // cada versión es un desplegable; solo la actual empieza abierta
    // Índice de versiones: cada versión mayor (1, 2…; la beta es la 0) se despliega y dentro lleva sus subversiones (0.5, 0.4…).
    const mayores = [];
    for (const r of Version.log) {
      const m = r.v.split('.')[0];
      if (mayores.at(-1)?.m !== m) mayores.push({ m, rs: [] });
      mayores.at(-1).rs.push(r);
    }
    $('#ver-log').replaceChildren(...mayores.map((g, i) => h('details', { open: i === 0 },
      h('summary', {}, g.m === '0' ? 'Beta (0.x)' : `Versión ${g.m}`, h('span', { class: 'ver-c' }, g.rs.length === 1 ? '1 versión' : `${g.rs.length} versiones`)),
      ...g.rs.map((r) => h('details', { class: 'ver-sub', open: r.v === Version.current }, h('summary', {}, `${r.v} · ${r.fecha.split('-').reverse().join('/')}`), h('ul', {}, r.cambios.map((c) => h('li', {}, c))))))));
    $('#guide-x').addEventListener('click', () => $('#guide').close());
    $('#guide').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
    $('#guide-nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showGuide(b.dataset.g); });
    $('#guide-c').addEventListener('scroll', () => {
      const c = $('#guide-c'), top = c.getBoundingClientRect().top + 60;
      let id = null;
      for (const s of c.querySelectorAll('section')) if (s.getBoundingClientRect().top <= top) id = s.id;
      markGuide(id || 'g-vista');
    }, { passive: true });
    $('#new').addEventListener('click', () => { const it = addToLib({ title: 'Problema sin título', statement: '', scene: blankScene() }); openRef({ kind: 'lib', id: it.id }, { focus: '#title' }); });
    $('#open').addEventListener('click', () => $('#file').click());
    $('#file').addEventListener('change', (e) => { importFiles([...e.target.files]); e.target.value = ''; });
    $('#save-lib').addEventListener('click', () => saveJSON('mis-problemas.emsim.json', pack(lib.items)));
    $('#save-cur').addEventListener('click', () => saveJSON(slug(cur.title) + '.emsim.json', pack([cur])));
    $('#export').addEventListener('click', (e) => { e.stopPropagation(); openMenu($('#export-w'), 'export', [
      { label: 'Página para imprimir o PDF (.html)', run: exportHTML },
      { label: 'Texto Markdown (.md)', run: exportMD },
    ]); });
    $('#keep').addEventListener('click', () => { const it = addToLib({ title: cur.title, statement: cur.statement, scene: scen }); openRef({ kind: 'lib', id: it.id }); flash('Guardado en Mis problemas'); });
    $('#title').addEventListener('input', (e) => { cur.title = e.target.value; persist(); renderSidebar(); });
    $('#statement').addEventListener('input', (e) => { cur.statement = e.target.value; autosize(e.target); persist(); });
    $('#folder').addEventListener('change', (e) => { cur.folder = e.target.value.trim(); persist(); renderSidebar(); });
    $('#tags').addEventListener('change', (e) => { cur.tags = e.target.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean); persist(); renderSidebar(); });
    $('#search').addEventListener('input', (e) => { query = norm(e.target.value.trim()); renderSidebar(); });
    $('#unit').addEventListener('input', (e) => { scen.unit = e.target.value.trim() || 'a'; schedule(); });
    $('#mode').addEventListener('change', (e) => { scen.mode = e.target.value; renderAll(); flash(scen.mode === 'si' ? 'Modo numérico SI: usa valores en unidades SI y longitudes en metros' : 'Modo simbólico'); });
    $('#practice').addEventListener('change', (e) => { ui.practice = e.target.checked; saveUI(); document.querySelectorAll('.card.reveal').forEach((c) => c.classList.remove('reveal')); renderAll(); });
    $('#undo').addEventListener('click', undo);
    $('#redo').addEventListener('click', redo);
    $('#plane').addEventListener('change', (e) => { cancelPlace(); scen.view.plane = e.target.value; Canvas.fit(); renderAll(); });
    $('#cut').addEventListener('input', (e) => { scen.view.cut = e.target.value; schedule(); });
    const chipsS = $('#chips-src');
    for (const [k, d] of Object.entries(SOURCES)) chipsS.append(h('button', { class: 'chip', 'data-place': 'src:' + k, title: 'Añadir ' + d.label.toLowerCase() + ' (clic en el lienzo para colocarla)', onclick: () => chipAdd('src', k) }, '+ ' + (d.short || d.label)));
    const chipsA = $('#chips-an');
    for (const [k, d] of Object.entries(ANALYSES)) chipsA.append(h('button', { class: 'chip', 'data-place': 'an:' + k, title: d.label, onclick: () => chipAdd('an', k) }, '+ ' + (d.short || d.label)));
    $('#probe-p').addEventListener('click', () => chipAdd('probe', '+'));
    $('#probe-n').addEventListener('click', () => chipAdd('probe', '-'));
    $('#probe-x').addEventListener('click', () => { cancelPlace(); Canvas.clearProbes(); });
    for (const id of ['t-lines', 't-equi', 't-grid', 't-cmap', 'cmap-q']) $('#' + id).addEventListener('change', () => { ui[id] = $('#' + id).type === 'checkbox' ? $('#' + id).checked : $('#' + id).value; saveUI(); Canvas.draw(out, scen); });
    for (const id of ['t-lines', 't-equi', 't-grid', 't-cmap']) if (typeof ui[id] === 'boolean') $('#' + id).checked = ui[id];
    if (ui['cmap-q']) $('#cmap-q').value = ui['cmap-q'];
    $('#zin').addEventListener('click', () => Canvas.zoom(1.25));
    $('#zout').addEventListener('click', () => Canvas.zoom(0.8));
    $('#zfit').addEventListener('click', () => { Canvas.fit(); Canvas.draw(out, scen); });
    // arrastrar archivos sobre la página
    window.addEventListener('dragover', (e) => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); document.body.classList.add('dropping'); } });
    window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dropping'); });
    window.addEventListener('drop', (e) => { document.body.classList.remove('dropping'); if (e.dataTransfer?.files?.length) { e.preventDefault(); importFiles([...e.dataTransfer.files]); } });
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => out && out.results.forEach((res, i) => res.chart && mountChart($('#res-' + i), res.chart, scen.analyses[i].id)), 150); });
    if (!ui.side) $('#app').classList.add('closed');
  }
  // guía de uso: las capturas van incrustadas en GUIA_IMG (las añade build.sh) y se cargan al abrirla
  function openGuide(id) {
    if (isMobile()) setSide(false);
    for (const el of document.querySelectorAll('#guide .sec-name')) el.textContent = Presets.section;
    for (const img of document.querySelectorAll('#guide img[data-img]')) if (!img.src && window.GUIA_IMG?.[img.dataset.img]) img.src = GUIA_IMG[img.dataset.img];
    $('#guide').showModal();
    if (id) showGuide(id); else { $('#guide-c').scrollTop = 0; markGuide('g-vista'); }
  }
  function markGuide(id) {
    for (const b of document.querySelectorAll('#guide-nav button')) {
      const on = b.dataset.g === id;
      if (on && !b.classList.contains('on') && isMobile()) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      b.classList.toggle('on', on);
    }
  }
  function showGuide(id) { $('#guide-c').scrollTop = $('#' + id).offsetTop - 8; markGuide(id); }
  function flash(t) { const f = $('#flash'); f.textContent = t; f.hidden = false; clearTimeout(flash.t); flash.t = setTimeout(() => (f.hidden = true), 2600); }

  // al arrastrar en el lienzo
  function onDrag(path, val) {
    setPath(scen, path, val);
    const el = document.querySelector(`[data-path='${JSON.stringify(path)}']`);
    if (el) el.value = val;
    schedule();
  }

  window.App = { onDrag, endDrag: () => setTimeout(commit, 30), get scen() { return scen; } };
  initControls();
  Canvas.init();
  const saved = store.get(K_CUR, null);
  if (saved?.scene && saved.ref) {
    try { cur = { ...saved, scene: validScene(saved.scene) }; scen = cur.scene; resetHistory(); Canvas.fit(); renderSidebar(); renderAll(); }
    catch (e) { openRef({ kind: 'preset', id: Presets.list[0].key }); }
  } else openRef({ kind: 'preset', id: Presets.list[0].key });
})();

