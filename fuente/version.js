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
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: escribe la ganancia de lazo K·N(s)/D(s) (como expresión, s^2+3s+2, o con los coeficientes) y estudia la estabilidad de tres maneras: la tabla de Routh con el rango de K estable (con el cero en la primera columna y la fila de ceros), el lugar de las raíces con asíntotas, puntos de ruptura, ángulos de salida y cruces con el eje imaginario, y el diagrama de Nyquist con los márgenes de ganancia y de fase y el recuento de vueltas alrededor de −1. Con nueve ejemplos, desarrollo paso a paso y modo práctica.'] },
    ],
    'termo-estadistica': [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: cinco modos. Dos niveles (con degeneraciones), oscilador de Einstein, niveles propios (un rotor, un átomo…) con su función de partición, poblaciones de Boltzmann, energía, entropía, energía libre y capacidad calorífica, y la entropía S = k ln Ω de un sólido de Einstein y de dos sólidos que se reparten la energía, con su desarrollo paso a paso.'] },
    ],
    markowitz: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: frontera eficiente de Markowitz con de 2 a 6 activos y su matriz de correlaciones (con o sin ventas en corto), cartera de mínima varianza, cartera tangente con ratio de Sharpe y línea del mercado de capitales, cartera para una rentabilidad objetivo, y CAPM con beta, rentabilidad exigida, alfa y línea del mercado de valores. Con tabla de pesos y desarrollo paso a paso.'] },
    ],
    cavidades: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: cavidades rectangulares, cilíndricas y esféricas de paredes conductoras. Frecuencia de resonancia de cualquier modo TE o TM, factor de calidad de las paredes y del dieléctrico, ancho de banda, tabla de los modos más bajos y mapa del campo eléctrico o magnético en el plano de corte que elijas. Con desarrollo paso a paso.'] },
    ],
    organica: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: escribe una molécula (cadenas con ramas, dobles y triples enlaces, alcoholes, aldehídos, cetonas, ácidos, ésteres, amidas, nitrilos, aminas, éteres y halógenos) y obtén su nombre IUPAC, los grupos funcionales, la fórmula y la masa molar. Marca los centros quirales (R/S) y los dobles enlaces E/Z con las reglas de Cahn-Ingold-Prelog, lista todos los estereoisómeros (enantiómeros, diastereoisómeros y formas meso) y las isomerías de cadena, posición y función. La molécula se ve en 3D con los hidrógenos y se gira con el ratón o el dedo. Con desarrollo paso a paso.'] },
    ],
    'transformada-z': [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: transformada z de una señal o de un sistema (polos, ceros, estabilidad, respuesta al impulso y respuesta en frecuencia) y FFT con ventanas, picos, resolución y aliasing.'] },
    ],
    semiconductores: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: elige un diodo, un transistor BJT (polarización fija o por divisor de tensión) o un MOSFET, escribe el circuito (admite 4k7, 1M, 100n) y mira la recta de carga, el punto de trabajo Q sobre las curvas del dispositivo, la región en que trabaja (corte, activa, saturación o triodo), las tensiones y corrientes y el desarrollo paso a paso.'] },
    ],
    relatividad: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: transformación de Lorentz de un evento con su diagrama de Minkowski (ejes inclinados de la nave y rayas paralelas para leer las coordenadas), suma y resta de velocidades con las rapideces e intervalo entre dos eventos con tiempo propio, distancia propia y causalidad. Con desarrollo paso a paso.'] },
    ],
    'osc-acopladas': [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: dos masas con tres muelles, sus modos normales y frecuencias, la posición de cada masa en el tiempo según cómo las sueltes, el batido y el tiempo que tarda la energía en pasar de una masa a la otra. Con desarrollo paso a paso.'] },
    ],
    solubilidad: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: Kps a partir de la solubilidad (en mol/L o g/L) y solubilidad a partir del Kps, efecto del ion común, ¿precipita al mezclar dos disoluciones? (con lo que queda disuelto y los gramos de precipitado) y precipitación fraccionada de dos sales. Con 15 sales de ejemplo, el desarrollo paso a paso y un diagrama logarítmico [catión]–[anión] con la recta de saturación.'] },
    ],
    lagrange: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: extremos de f(x, y) o f(x, y, z) con una restricción g = c. Plantea ∇f = λ∇g, halla los puntos críticos con su λ, dice si cada uno es máximo, mínimo o de silla y dibuja las curvas de nivel con la restricción.'] },
    ],
    series: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: dice si una serie numérica converge o diverge con la condición necesaria, la serie geométrica y la serie p, los criterios del cociente, de la raíz, de comparación y de Leibniz, la convergencia absoluta o condicional, la suma y las sumas parciales dibujadas.'] },
    ],
    'no-parametricos': [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: U de Mann-Whitney para dos muestras independientes y test de Wilcoxon de los rangos con signo, para datos apareados o para la mediana de una muestra, bilaterales o unilaterales. Da la tabla de rangos (con la media de los rangos en los empates), el p-valor exacto si hay pocos datos y no hay empates o por aproximación normal con la corrección de empates y de continuidad, la gráfica y la conclusión paso a paso. Con 4 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    'regresion-multiple': [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: regresión lineal con hasta 6 variables explicativas por mínimos cuadrados, con los datos pegados desde una hoja de cálculo. Da el plano ajustado, los coeficientes con su error típico, t, p-valor e intervalo de confianza, R² y R² ajustado, el contraste F global con la tabla ANOVA, el VIF para detectar multicolinealidad, los valores observados frente a ajustados y una predicción con el intervalo de la media y el de un valor individual, paso a paso. Con 3 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    anova: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: ANOVA de un factor para comparar las medias de dos o más grupos escritos uno por línea. Da la tabla ANOVA (entre y dentro de los grupos), F con su valor crítico y p-valor, el tamaño del efecto η², las medias y varianzas de cada grupo, las comparaciones por parejas con la corrección de Bonferroni, la gráfica de los datos y el desarrollo paso a paso. Con 3 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    'black-scholes': [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: precio de una call y una put europeas con la fórmula de Black-Scholes (con dividendo), d₁ y d₂, comprobación de la paridad call-put y las griegas (delta, gamma, vega, theta y rho), con la gráfica del valor de la opción hoy y al vencimiento y el desarrollo paso a paso.'] },
    ],
    bonos: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: precio de un bono con cupón anual, semestral, trimestral o mensual a partir de la TIR (o la TIR a partir del precio), rentabilidad corriente, duración de Macaulay y modificada, convexidad y variación del precio al cambiar los tipos, con la curva precio-TIR, la tabla de flujos y el desarrollo paso a paso.'] },
    ],
    solow: [
      { v: '0.1', fecha: '2026-11-02', cambios: ['Primera versión: estado estacionario, regla de oro, velocidad de convergencia y semivida, y trayectoria del capital desde el valor inicial en el modelo de Solow con función Cobb-Douglas, con el diagrama de Solow, la tabla año a año y el desarrollo paso a paso.'] },
    ],
    'integrales-multiples': [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: integrales dobles (en cartesianas, con dy dx o dx dy, y en polares) y triples (en cartesianas, cilíndricas y esféricas) sobre la región que escribas con sus límites, de fuera adentro. Dibuja la región o el sólido en perspectiva, que se gira arrastrando; escribe el cambio de variables con su jacobiano, el integrando transformado y cada integral iterada de dentro afuera con su primitiva (y la numérica si alguna no sale), y da el valor exacto, el área o volumen de la región y el valor medio. Con 13 ejemplos de clase, modo práctica y enlace para compartir.'] },
    ],
    formulacion: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe una fórmula y obtén su nombre, o escribe un nombre y obtén su fórmula, en nomenclatura sistemática, de Stock y tradicional. Reconoce óxidos, peróxidos, hidruros, hidróxidos, hidrácidos, oxoácidos, sales binarias, oxisales, sales ácidas y compuestos entre no metales (casi 3.000 compuestos), con el desarrollo paso a paso (tipo de compuesto, estados de oxidación y cruce de cargas), sugerencias si te equivocas, ejemplos, tabla de oxoácidos, modo práctica y enlace para compartir.'] },
    ],
    balance: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: la cuenta de pérdidas y ganancias (EBITDA, resultado de explotación, financiero, BAI, impuesto y resultado del ejercicio) y el balance de situación con el resultado dentro del patrimonio neto, comprobando que cuadra, el fondo de maniobra y el balance dibujado en dos columnas, con cuatro ejemplos, desarrollo paso a paso y modo práctica.'] },
    ],
    redox: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: ajusta reacciones redox por el método del ion-electrón en medio ácido o básico, con los números de oxidación, las dos semirreacciones (elemento, oxígeno con H₂O, hidrógeno con H⁺ y carga con electrones), la igualación de electrones, la suma, el paso a medio básico con OH⁻ y la comprobación átomo a átomo, con una gráfica del cambio de número de oxidación y diez reacciones de ejemplo.'] },
    ],
    'lineas-transmision': [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: línea de transmisión sin pérdidas con una carga R + jX: coeficiente de reflexión, ROE, pérdida de retorno, impedancia de entrada, máximos y mínimos de tensión y adaptación con un stub en paralelo (en cortocircuito o en abierto) o con un transformador λ/4. Con la carta de Smith dibujada (círculo de ROE y recorrido hacia el generador), el perfil de la onda estacionaria, el desarrollo paso a paso, ejemplos y modo práctica.'] },
    ],
    superficies: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe una función de dos variables z = f(x, y) y mírala como una superficie 3D que se gira arrastrando (con rueda para acercar y flechas del teclado) y como un mapa de curvas de nivel, que también se proyecta en el suelo.', 'Elige un punto, o púlsalo en el mapa: sale el gradiente y su módulo, el plano tangente con su normal, la tangente a la curva de nivel, la derivada direccional en la dirección que quieras y la aproximación lineal con su error.', 'Los puntos críticos del rango, clasificados con el hessiano como mínimo, máximo o punto de silla.', 'Desarrollo paso a paso, 8 ejemplos (paraboloide, silla, cono, campana de Gauss, huevera…) y modo práctica con ejercicios al azar.'] },
    ],
    vsepr: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe una molécula o un ion (H2O, SF4, NH4+, SO4 2-…) o elige un tipo AXₙEₘ y mira sus dominios de electrones, geometría electrónica y molecular, ángulos de enlace, hibridación y polaridad, paso a paso, con la molécula en 3D que se gira con el ratón, el dedo o el teclado (pares libres y momento dipolar incluidos), 22 ejemplos, la tabla de las 14 geometrías y modo práctica.'] },
    ],
    maxwell: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: las cuatro ecuaciones de Maxwell en forma integral y diferencial con su significado y enlaces a los simuladores de Electromagnetismo, y una calculadora paso a paso para cada una: ley de Gauss (flujo y campo de una esfera cargada, dentro y fuera), Gauss para B (flujo por un cubo), Faraday (fem de una bobina), Ampère–Maxwell (corriente de desplazamiento y campo B en un condensador) y la velocidad de la luz con la onda plana, con gráfica, modo práctica y enlace para compartir.'] },
    ],
    fresnel: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: una onda plana llega con un ángulo a la frontera entre dos medios (por índices n o por εr y μr) y salen el ángulo de refracción, los coeficientes de reflexión y transmisión de las polarizaciones TE y TM, las reflectancias y transmitancias, el ángulo de Brewster, el ángulo crítico y, en la reflexión total, los desfases y la profundidad de la onda evanescente, con el desarrollo paso a paso, el dibujo de los rayos y la gráfica de la reflectancia según el ángulo.'] },
    ],
    gravitacion: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: calcula la fuerza de atracción entre dos masas, la velocidad, el periodo y la energía de un satélite en órbita circular, la velocidad de escape, la órbita que corresponde a un periodo (geoestacionaria) y las leyes de Kepler en una órbita elíptica con la elipse dibujada, con el desarrollo paso a paso y modo práctica.'] },
    ],
    convolucion: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: refleja y desliza dos señales (pulsos rectangulares, triangulares y senoidales, escalón, exponencial e impulso) y mira cómo se dibuja su convolución, animada o moviendo el instante a mano.', 'Señal y sistema: pasa una entrada por un filtro RC, un RLC serie, una media móvil o un retardo y obtén la respuesta al escalón con el tiempo de subida, la sobreoscilación y el tiempo de establecimiento.', 'Desarrollo paso a paso con la solución exacta de los casos de clase y la comprobación con las áreas, ejemplos y modo práctica.'] },
    ],
    'laplace-numerica': [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: fija el potencial de los cuatro bordes de una caja (y de un electrodo interior) y resuelve la ecuación de Laplace por relajación con Jacobi, Gauss-Seidel o SOR; muestra el mapa de color, las equipotenciales, el campo eléctrico y una sonda movible con el potencial y el campo en cualquier punto, el desarrollo paso a paso, la comparación con la solución exacta en serie y el modo práctica.'] },
    ],
    imagenes: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: una carga puntual frente a un plano conductor a tierra, una esfera conductora (a tierra, aislada con una carga Q o a un potencial V₀) o dentro de una cavidad esférica, con la carga imagen y su posición, la fuerza sobre la carga, la carga inducida y su densidad superficial σ, el trabajo para llevarla al infinito y el potencial y el campo en un punto.', 'Dibujo con las líneas de campo, las cargas imagen y la carga inducida sobre el conductor, y modo práctica con enunciado.'] },
    ],
    'guias-onda': [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: modos TE y TM de una guía de onda rectangular (vacía o rellena de dieléctrico): frecuencia y longitud de onda de corte, constante de fase, longitud de onda en la guía, velocidades de fase y de grupo, impedancia de onda o atenuación si no se propaga, modo dominante y banda monomodo, con el campo eléctrico del modo dibujado en la sección, desarrollo paso a paso y modo práctica.'] },
    ],
    antena: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: dipolo corto, de media onda o de longitud cualquiera, con diagrama de radiación polar, resistencia de radiación, potencia radiada, directividad, ancho de haz y campo lejano, paso a paso.'] },
    ],
    bode: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: elige un filtro RC, RL o RLC (paso bajo, paso alto, paso banda o rechazo de banda), escribe R, L y C (admite 4k7, 100n, 10 µF) y obtén su diagrama de Bode de magnitud y fase con las asíntotas, la frecuencia de corte, el factor de calidad Q, el ancho de banda, el pico de resonancia y el desarrollo paso a paso.'] },
    ],
    optica: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: elige una lente (convergente o divergente) o un espejo (cóncavo o convexo), la distancia focal y el objeto, y mira el diagrama de rayos con la imagen, su posición, el aumento, si es real o virtual y derecha o invertida, la potencia en dioptrías o el radio del espejo, paso a paso. Con seis ejemplos y modo práctica.'] },
    ],
    simulador: [
      { v: '0.3', fecha: '2026-11-02', cambios: ['Nueva pestaña «Barrido»: elige un valor del circuito (una resistencia, un condensador, la amplitud o la frecuencia de una fuente…), un rango en escala lineal o logarítmica y lo que quieres medir (tensión, corriente o potencia de un componente, o la tensión de un nudo), en continua o en alterna con valores eficaces, y sale la gráfica con el máximo y el mínimo marcados y una tabla.', 'La pestaña Thévenin y Norton dibuja ahora la potencia que recibe una carga según su valor, con el máximo marcado cuando la carga vale R<sub>Th</sub>.'] },
      { v: '0.2', fecha: '2026-11-02', cambios: ['Importar y exportar redes en texto tipo SPICE: el botón «SPICE» escribe la red del esquema (R, C, L, fuentes de continua, seno y pulso, fuentes controladas, bobinas acopladas, diodos, transistores) o dibuja la que pegues o abras de un archivo .cir, con avisos de lo que no se puede traducir.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: dibuja el circuito arrastrando componentes (resistencias, condensadores, bobinas, fuentes de continua y de alterna, diodos, transistores, operacionales, transformadores, trifásica y puertas lógicas), únelos con cables y mira tensiones, corrientes, fasores, osciloscopio y diagrama de Bode.'] },
    ],
    'teoria-juegos': [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: escribe la matriz de pagos de un juego de dos jugadores con dos estrategias y obtén las mejores respuestas, las estrategias dominantes, los equilibrios de Nash puros y mixtos, la eficiencia de Pareto y el tipo de juego (dilema del prisionero, coordinación, gallina…), con la gráfica de las curvas de mejor respuesta y el desarrollo paso a paso.'] },
    ],
    'puertas-logicas': [
      { v: '0.3', fecha: '2026-11-01', cambios: ['Nuevo modo «Ecuaciones»: se escriben ecuaciones booleanas (con NOT, AND, OR, XOR, paréntesis y varias salidas) y salen la tabla de verdad, los minitérminos y maxitérminos, el mapa de Karnaugh y el circuito de puertas, tal como está escrito o simplificado.', 'Los modos pasan a llamarse Tabla, Puertas y Ecuaciones.'] },
      { v: '0.2', fecha: '2026-11-01', cambios: ['Editor gráfico de puertas: se arrastran desde la paleta, se mueven y se unen con el ratón (el cable suelto en el vacío se quita; doble clic marca la salida), con las puertas en cualquier orden.', 'Las ecuaciones salen primero en forma canónica y el botón «Simplificar ecuaciones» añade las simplificadas y el circuito más pequeño.', 'Las tablas de verdad llevan una línea más gruesa cada 4 filas.', 'Un botón en el circuito cambia entre la suma de productos y el producto de sumas.'] },
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: dos modos. Desde la tabla de verdad (1 a 5 variables, hasta 4 salidas y casillas indiferentes X) da los minitérminos Σm, los maxitérminos ΠM, las formas canónicas y la forma simplificada por Quine-McCluskey en suma de productos y en producto de sumas, con el mapa de Karnaugh y el circuito de puertas dibujado. Desde las puertas (AND, OR, NOT, NAND, NOR, XOR y XNOR de 2 a 4 entradas) da la ecuación de cada puerta, la tabla de verdad con todas las puertas y las mismas ecuaciones. Con ejemplos (mayoría, semisumador, sumador completo, primos en BCD, multiplexor y XOR con NAND), desarrollo paso a paso y botón para copiar las ecuaciones.'] },
    ],
    multiplicador: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: renta de equilibrio del modelo renta-gasto con impuestos e importaciones, multiplicador del gasto, de los impuestos fijos y del presupuesto equilibrado, efecto de un cambio de gasto o de impuestos con sus rondas, brecha con el pleno empleo y la cruz keynesiana, con el desarrollo paso a paso.'] },
    ],
    'is-lm': [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: curvas IS y LM, renta y tipo de interés de equilibrio, y el efecto de subir el gasto, bajar impuestos o aumentar el dinero (multiplicadores y efecto expulsión), con la gráfica y el desarrollo paso a paso.'] },
    ],
    choques: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: choques elásticos, inelásticos (con coeficiente de restitución) y perfectamente inelásticos de dos cuerpos, en una dimensión o en dos con la normal del choque.', 'Velocidades finales, momento lineal total y energía cinética perdida, con el desarrollo paso a paso.', 'Dibujo de los dos cuerpos antes y después, con sus velocidades.', 'Ejemplos de choque elástico, coches pegados, inelástico y billar, y modo práctica con enunciado escrito.'] },
    ],
    termoquimica: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: entalpía de una reacción a partir de las entalpías de formación (con una tabla de unas 60 sustancias y calor para una masa dada), ley de Hess que calcula por cuánto hay que multiplicar o dar la vuelta a cada reacción, y energía libre de Gibbs con la temperatura de equilibrio, con el diagrama de entalpías y el desarrollo paso a paso.'] },
    ],
    probabilidad: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: combinatoria (variaciones, permutaciones y combinaciones, con o sin repetición), probabilidad de la unión, la intersección y la condicionada de dos sucesos, y probabilidad total con el teorema de Bayes y su diagrama de árbol.'] },
    ],
    unidades: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: convierte un valor entre las unidades de 24 magnitudes (longitud, masa, tiempo, velocidad, presión, energía, potencia, temperatura, carga, campo eléctrico y magnético…), con el desarrollo paso a paso por la unidad base del SI y el factor directo, el valor en todas las unidades a la vez y un botón para intercambiarlas. Incluye la tabla de constantes físicas CODATA 2018 con buscador.'] },
    ],
    equilibrio: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: Kc y Kp a partir de un equilibrio medido, concentraciones de equilibrio con la tabla ICE (para cualquier grado, no solo segundo), cociente de reacción Q frente a K y Le Chatelier con números (añadir o quitar una especie, cambiar el volumen o la temperatura con Van\'t Hoff, gas inerte y catalizador), con la gráfica de las concentraciones y modo práctica.'] },
    ],
    oscilaciones: [
      { v: '0.1', fecha: '2026-11-01', cambios: ['Primera versión: movimiento armónico simple de una masa en un muelle o un péndulo (periodo, velocidad y aceleración máximas, energía, posición en un instante y periodo exacto del péndulo), oscilador amortiguado (subamortiguado, crítico y sobreamortiguado, con factor de calidad y decremento logarítmico) y oscilador forzado con su amplitud, desfase y resonancia, con la gráfica y el desarrollo.'] },
    ],
    beneficio: [
      { v: '0.1', fecha: '2026-10-31', cambios: ['Primera versión: cantidad y precio que maximizan el beneficio en competencia perfecta (precio de cierre y de beneficio nulo) y en monopolio (índice de Lerner, comparación con la competencia y pérdida de eficiencia), con la gráfica de ingreso marginal, coste marginal y coste medio.'] },
    ],
    costes: [
      { v: '0.1', fecha: '2026-10-31', cambios: ['Primera versión: a partir de la función de costes con costes fijos y términos de primer, segundo y tercer grado, el coste variable, total, medio (fijo, variable y total) y marginal de una producción, el mínimo de explotación (precio de cierre) y el óptimo de explotación (umbral de rentabilidad), con la gráfica de las curvas.'] },
    ],
    'sistemas-numericos': [
      { v: '0.1', fecha: '2026-10-31', cambios: ['Primera versión: pasa un número entero entre decimal, binario, complemento a 2 (4, 8, 16 o 32 bits), hexadecimal y BCD, con el desarrollo paso a paso (divisiones entre 2, grupos de 4 bits, invertir y sumar 1), los bits con su peso y ejemplos de cada sistema.'] },
    ],
    excedentes: [
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: el excedente del consumidor y del productor en el equilibrio y lo que pasa con un impuesto o una subvención por unidad o con un precio máximo o mínimo: los precios, la recaudación o el gasto, quién soporta el impuesto y la pérdida irrecuperable de eficiencia, sombreados en la gráfica.'] },
    ],
    'oferta-demanda': [
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: el precio y la cantidad de equilibrio con una demanda y una oferta lineales, las elasticidades en ese punto, la escasez o el excedente de un precio máximo o mínimo y el nuevo equilibrio cuando se desplaza la demanda, la oferta o las dos, con la gráfica y el desarrollo.'] },
    ],
    'chi2-bondad': [
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: bondad de ajuste a una distribución uniforme, a unas proporciones dadas o a una binomial, Poisson o normal (con los parámetros dados o estimados de los datos), juntando las clases con frecuencia esperada menor que 5; y tablas de contingencia para la independencia o la homogeneidad, con la corrección de Yates y la V de Cramér. Con la tabla de esperadas, la gráfica y el desarrollo.'] },
    ],
    contrastes: [
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: contrastes de una media (z o t de Student), una proporción, una varianza, dos medias (también con Welch), dos proporciones y dos varianzas, bilaterales o unilaterales, con el estadístico, la región crítica sombreada en la gráfica, el p-valor y la conclusión paso a paso.'] },
    ],
    errores: [
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: la incertidumbre de una magnitud calculada con las derivadas parciales (suma cuadrática o cota lineal), el error relativo, lo que pesa cada medida y el resultado redondeado como en el laboratorio; también el error de una serie de medidas repetidas.'] },
    ],
    graficador: [
      { v: '0.1', fecha: '2026-10-28', cambios: ['Primera versión: dibuja hasta tres funciones a la vez, se mueve arrastrando y se acerca con la rueda o los botones, y da el dominio, los cortes con los ejes, las asíntotas, los máximos y mínimos y la inflexión de f, los cortes entre las curvas y una tabla de valores, con el desarrollo.'] },
    ],
    'metodos-numericos': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: raíces de ecuaciones por bisección, Newton-Raphson, secante y punto fijo; integrales por trapecios y Simpson; y ecuaciones diferenciales por Euler, Heun y Runge-Kutta 4, con la tabla de iteraciones, una gráfica de lo que hace cada método y el desarrollo.'] },
    ],
    'fisica-moderna': [
      { v: '0.2', fecha: '2026-11-01', cambios: ['Dilatación del tiempo: muestra la diferencia entre los dos relojes (γ − 1 y Δt − Δt₀), también con velocidades pequeñas, y se abre desde «El GPS y la relatividad».'] },
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: efecto fotoeléctrico (energía del fotón, trabajo de extracción de varios metales, energía cinética y velocidad máximas, potencial de frenado y umbral), longitud de onda de De Broglie, dilatación del tiempo, contracción de longitudes y energía y momento relativistas, con su gráfica y el desarrollo.'] },
    ],
    'lorenz-gini': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: la curva de Lorenz y el índice de Gini a partir de las rentas de cada persona, de tramos de renta o de quintiles, por el área y con la fórmula de clase, con lo que se lleva el 20 % más pobre y el más rico (S80/S20), la tabla y el desarrollo.'] },
    ],
    'phillips-okun': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: la ley de Okun (el paro con un crecimiento o el crecimiento para bajar el paro), la brecha de producción con el paro natural, la curva de Phillips con expectativas y shocks de oferta (estanflación) y el ajuste de una curva de Phillips a datos de paro e inflación, con la gráfica y el desarrollo.'] },
    ],
    'tipos-cambio': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: cambiar euros por dólares, libras, yenes y otras monedas (y al revés) con comisión, el tipo de cambio cruzado, la apreciación o depreciación del euro, la paridad del poder adquisitivo con el tipo de cambio real (como el índice Big Mac) y la PPA relativa con la inflación de los dos países, con su gráfica y el desarrollo.'] },
    ],
    elasticidades: [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: elasticidad precio de la demanda, renta y cruzada entre dos situaciones, sobre el valor inicial y de arco, con su clasificación y el efecto sobre el ingreso total, y la elasticidad en un punto de una demanda lineal con el precio que hace máximo el ingreso, con la gráfica.'] },
    ],
    'pib-ipc': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: PIB nominal y real de una economía con varios bienes y años, deflactor, crecimiento real e inflación; deflactar una serie con el IPC para tenerla en euros constantes; y los agregados de la contabilidad nacional del PIB a la renta nacional, con gráfica y tabla.'] },
    ],
    'numeros-indice': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: índices simples de una serie con la base que elijas (cambio de base), tasas de variación, tasa acumulada y tasa media acumulativa, e índices de precios de Laspeyres, Paasche y Fisher, de cantidades y de valor de una cesta de productos, con la gráfica y la tabla.'] },
    ],
    ratios: [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: a partir del balance y la cuenta de resultados, el fondo de maniobra, los ratios de liquidez, tesorería, disponibilidad, garantía, endeudamiento, autonomía y calidad de la deuda con su valor recomendado y su valoración, la rentabilidad económica (margen por rotación), la financiera y el apalancamiento, con el balance dibujado.'] },
    ],
    'punto-muerto': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: punto muerto en unidades y en euros, margen de contribución, beneficio con las ventas previstas, margen de seguridad, apalancamiento operativo y ventas para un beneficio objetivo, con la gráfica de ingresos y costes.'] },
    ],
    ahorro: [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: plan de ahorro con capital inicial y aportaciones mensuales, trimestrales o anuales (también subiendo con la inflación), saldo final en euros de entonces y de hoy, tipo real de Fisher, aportación necesaria para un objetivo y pérdida de poder adquisitivo de un dinero parado, con la gráfica y la tabla año a año.'] },
    ],
    'van-tir': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: valor actual neto, tasa interna de rentabilidad, plazo de recuperación simple y descontado e índice de rentabilidad de una inversión, con la decisión, la tabla de flujos actualizados y la gráfica del VAN según la tasa.'] },
    ],
    'amortizacion-inmovilizado': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: cuadro de amortización de un bien por el método lineal, la suma de dígitos, el degresivo de porcentaje constante y las unidades de producción, con la cuota de cada año, la amortización acumulada, el valor neto contable y su gráfica.'] },
    ],
    prestamos: [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: cuota y cuadro de amortización completo de un préstamo por el sistema francés, el de cuota de amortización constante y el americano, con pagos anuales, semestrales, trimestrales o mensuales, los intereses totales y la TAE, también con comisión de apertura.'] },
    ],
    rentas: [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: valor actual, valor final, término y número de términos de rentas constantes pospagables o prepagables, temporales o perpetuas, inmediatas o diferidas, con términos anuales, semestrales, trimestrales o mensuales, la tabla de términos y su gráfica.'] },
    ],
    interes: [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: capital final, capital inicial, tipo de interés y tiempo en capitalización simple y compuesta (anual, semestral, trimestral, mensual o diaria), el paso del TIN a la TAE y al revés, la comparación simple frente a compuesta año a año y su gráfica.'] },
    ],
    descriptiva: [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: con una lista de datos, una tabla de frecuencias o datos agrupados en intervalos, saca la tabla de frecuencias, la media, la mediana, la moda, los cuartiles y cualquier percentil, la varianza y la desviación típica (de la población o de una muestra), el coeficiente de variación, la asimetría, la curtosis y los atípicos, con el histograma y el diagrama de caja.'] },
    ],
    'regresion-economia': [
      { v: '0.1', fecha: '2026-10-27', cambios: ['Primera versión: regresión por mínimos cuadrados con datos económicos en forma lineal, doble logarítmica (elasticidad) o semilogarítmica (tasa de crecimiento), con R² y R² ajustado, errores típicos, t, p-valor, intervalo de la pendiente, la lectura económica de cada coeficiente y una predicción.'] },
    ],
    ajustador: [
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
      { v: '0.2', fecha: '2026-10-26', cambios: ['Cilíndricos y esféricos con el dieléctrico por sectores, en paralelo: por ejemplo, media esfera con un material y la otra media con otro.', 'Permitividad que cambia con la posición, de ε₁ en una armadura a ε₂ en la otra, con las cargas de polarización de las caras y del volumen.', 'Fuerza entre las armaduras y fuerza que mete un dieléctrico a medio introducir.', 'Rigidez dieléctrica: escribe la de cada capa y sale la tensión máxima antes de la ruptura.', 'Asociaciones de condensadores en serie, en paralelo y mixtas, con la carga, la tensión y la energía de cada uno, y dos condensadores cargados que se conectan, con la energía que se pierde.', 'La carga libre de cada armadura en el desarrollo.', 'Botones para copiar el enlace del ejercicio, copiar la solución como texto o en LaTeX e imprimirla o guardarla en PDF.', 'El desarrollo paso a paso escribe las fórmulas como en los libros: fracciones, raíces, exponentes y subíndices de verdad.', 'La capacidad sale también en letras, como en los apuntes (por ejemplo C = 4πε₀εᵣab/(b − a), o la suma de cada capa en serie).', 'Enlace al simulador de Electrostática desde la teoría.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: condensadores planos, cilíndricos y esféricos con capas de dieléctrico en serie o, en el plano, ocupando parte del área. Capacidad, carga, tensión y energía; campos E, D y P en cada capa y cargas de polarización, con el desarrollo paso a paso.', 'Compara con el condensador vacío: qué pasa al meter el dieléctrico con la batería conectada o con el condensador aislado.', 'Dibujo del corte con las líneas de campo y gráfica de E a lo largo del condensador.'] },
    ],
    'tiro-parabolico': [
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
      { v: '0.2', fecha: '2026-10-25', cambios: ['Matrices con un parámetro (k, a, m…): el determinante y el rango discutidos según su valor, y la inversa cuando existe.', 'Ecuaciones matriciales AX = B, XA = B y AX + B = C, paso a paso.', 'Aⁿ por diagonalización (P·Dⁿ·P⁻¹), también para potencias grandes.', 'Nuevas operaciones: matriz adjunta y de cofactores, descomposición LU, diagonalización ortogonal de matrices simétricas y forma de Jordan en 2×2 y 3×3.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: determinante por Gauss, por Sarrus o por Laplace; inversa por Gauss-Jordan o por adjuntos; rango; forma escalonada y escalonada reducida, con cada operación entre filas y la matriz después de cada paso.', 'Valores y vectores propios con el polinomio característico, las raíces exactas (también con radicales o complejas) y si la matriz es diagonalizable, con P y D.', 'Suma, resta, producto (elemento a elemento), producto por un número, potencia y traspuesta.', 'Fracciones exactas y números complejos en cualquier casilla: 3/4, 0,25, 2−3i o (1+i)/2.'] },
    ],
    derivadas: [
      { v: '0.3', fecha: '2026-11-02', cambios: ['Integrales por sustitución y por partes con el paso a paso completo: la elección de u y dv, du y v, la tabla de signos del método de la tabla, la integral cíclica (e^x cos x) y ln, arctg y arcsen por partes.'] },
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: una función constante ya no sale con un punto crítico falso.', 'Integrales impropias: con límites en ∞ o con una asíntota dentro, diciendo si convergen o divergen.', 'Nuevas primitivas: productos de senos y cosenos (sen 3x cos 2x) y cambios trigonométricos (√(1 − x²)).', 'Límites con L’Hôpital, también 0·∞, 1^∞, 0⁰, ∞⁰ e ∞ − ∞.', 'Área entre dos curvas y volumen de revolución (discos y capas).', 'Estudio completo de una función: dominio, simetría, cortes, asíntotas, monotonía y curvatura.', 'Derivación implícita y derivadas parciales, con los puntos críticos y la matriz hessiana.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: derivadas de orden 1 a 4 con la regla de cada paso (suma, producto, cociente, cadena, derivación logarítmica) y el resultado simplificado.', 'Recta tangente en un punto y puntos críticos con su tipo.', 'Primitivas por la tabla, sustitución, partes (también dos veces), fracciones simples e identidades trigonométricas, comprobadas derivándolas.', 'Integral definida con la regla de Barrow, o numérica si no hay primitiva elemental, y el área encerrada.', 'Gráfica de f y f′ con la tangente que recorre la curva, o del área que se va llenando con la primitiva.'] },
    ],
    laplace: [
      { v: '0.2', fecha: '2026-10-25', cambios: ['Escalón u(t − a), delta δ(t − a) y retrasos e^{−as}, en la directa, en la inversa y en las ecuaciones diferenciales.', 'sen²t, cos²t y productos de senos y cosenos (linealizando), y funciones definidas a trozos.', 'Convolución y función de transferencia H(s), con la respuesta al impulso y al escalón.', 'Sistemas de dos ecuaciones diferenciales por Laplace.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
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
      { v: '0.2', fecha: '2026-10-26', cambios: ['Datos apareados (antes y después, o dos medidas del mismo individuo): intervalo de la media de las diferencias, a partir de las dos listas o de d̄ y s_d.', 'Cociente de varianzas σ₁²/σ₂² con la F de Snedecor, y el de las desviaciones σ₁/σ₂, para saber si se pueden suponer varianzas iguales.', 'Cotas: cualquier intervalo puede ser bilateral, una cota inferior (a; +∞) o una cota superior (−∞; b), con toda α en una cola.', 'Población finita: da su tamaño N y se aplica el factor de corrección, también en el tamaño de la muestra.', 'Contraste con el intervalo: escribe un valor y te dice si se rechaza H₀ con ese nivel de significación.', 'Tamaño de muestra también para comparar dos medias o dos proporciones.', 'La gráfica muestra la F y las cotas con α en una sola cola, y en Welch se ven los grados de libertad sin redondear.', 'Nuevos ejercicios en el modo práctica: cotas de una media y datos apareados.'] },
      { v: '0.1.1', fecha: '2026-10-25', cambios: ['Una proporción con 0 éxitos, o con todos, ya no da un intervalo de un solo punto: se usa el intervalo de Wilson. Con pocos éxitos o fracasos también se muestra el de Wilson al lado del de siempre.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: intervalo de confianza de una media con σ conocida (z) o desconocida (t de Student), a partir de x̄, s y n o de la lista de datos, también si te dan la desviación con n.', 'Intervalos de una proporción, de la varianza y la desviación típica (con la χ²), de la diferencia de medias (σ conocidas, iguales o Welch) y de la diferencia de proporciones.', 'Tamaño de muestra para un error máximo en una media o una proporción.', 'Gráfica de la distribución con el área de confianza y simulación de 100 muestras que muestra cuántos intervalos aciertan.'] },
    ],
    fuerza: [
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
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: avisa cuando la solución explota (y′ = y²) y corta la gráfica ahí.', 'Solución exacta de ecuaciones separables (como la logística), de Bernoulli y exactas, con factor integrante.', 'Euler mejorado (Heun) y punto medio, con una tabla que compara el error según h.', 'Variación de parámetros cuando g(x) no admite coeficientes indeterminados (tg x, 1/cos x, eˣ/x).', 'Ecuaciones de orden 3 y 4 con coeficientes constantes, y de Cauchy-Euler.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuaciones de primer orden y′ = f(x, y) con el campo de pendientes, el método de Euler (con su tabla) y RK4, y la solución exacta cuando es lineal con coeficiente constante.', 'Ecuaciones lineales de segundo orden con coeficientes constantes: ecuación característica, solución homogénea, particular por coeficientes indeterminados (también con resonancia) y constantes por las condiciones iniciales.', 'Sistemas x′ = f(x, y), y′ = g(x, y): puntos críticos con su tipo (silla, nodo, foco o centro) por los autovalores del jacobiano, solución exacta si es lineal y diagrama de fases con trayectorias.', 'Gráfica animada; tocándola se cambia el punto inicial.'] },
    ],
    fourier: [
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: avisa si la función no es integrable (1/x en [−1, 1]) en vez de dar coeficientes sin sentido.', 'Arreglo: en el móvil las fórmulas largas ya no se salen de la pantalla.', 'Término general en más casos: eˣ, |sen x| o funciones trapezoidales.', 'Los huecos entre tramos se rellenan con 0.', 'Forma compleja (cₙ) y forma amplitud-fase, con el espectro de fase.', 'Suma de series numéricas con Parseval o con un punto (Σ 1/n² = π²/6).', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: serie de Fourier de una función periódica dada hasta en cuatro tramos (1, x, x^2, |x|, sen x…), o desarrollo en senos o en cosenos de una función en [0, L].', 'Coeficientes a₀, aₙ y bₙ exactos (con π) y su término general cuando siguen una ley, como 2(1 − (−1)ⁿ)/(nπ), con la paridad de la función.', 'Convergencia en los saltos (a la media de los límites laterales), suma parcial en un punto e igualdad de Parseval.', 'Gráfica de la función y de la suma parcial, que se puede ver sumando armónicos uno a uno, y el espectro de amplitudes.'] },
    ],
    taylor: [
      { v: '0.2.1', fecha: '2026-10-28', cambios: ['Arreglo: el párrafo sobre los límites con desarrollos de la teoría ya se lee como texto normal, no como una fórmula.'] },
      { v: '0.2', fecha: '2026-10-25', cambios: ['Arreglo: con aˣ los coeficientes salen claros, (ln 2)²/2 en vez de 0,240227.', 'Arreglo: en el móvil las fórmulas largas ya no se salen de la pantalla.', 'Singularidades evitables: sen x / x o (eˣ − 1)/x en 0 ya tienen desarrollo.', 'Radio de convergencia para cualquier función, con un aviso si el punto cae fuera.', 'Límites con Taylor, como lím (sen x − x)/x³.', 'Grado hasta 25.', 'Comparte el ejercicio con un enlace (lleva los datos), cópialo como texto o en LaTeX para tus apuntes, o imprímelo o guárdalo en PDF solo con los resultados y el desarrollo.', 'Aviso junto a los datos: ln es el logaritmo neperiano y log, el decimal.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: polinomio de Taylor o de Maclaurin de cualquier grado hasta 15 de una función escrita como en papel (e^x, sen x, ln(1+x), √x, arctg x…) en un punto que puede llevar π, con cada derivada, su valor exacto y los coeficientes.', 'Aproximación de f(x₀) con el error cometido y la cota del resto de Lagrange.', 'Reconoce los desarrollos conocidos (e^x, sen x, cos x, ln(1+x), la serie geométrica, arctg x y la binómica) y da su término general y dónde convergen.', 'Gráfica de la función con los polinomios de cada grado, que se pueden recorrer o ver acercarse uno tras otro.'] },
    ],
    complejos: [
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
      { v: '0.2', fecha: '2026-10-26', cambios: ['Error de la pendiente y de la ordenada, con su intervalo de confianza, para los informes de prácticas, y banda de confianza de la recta en la gráfica.', 'Intervalos de confianza de la media de y y de predicción de un valor nuevo para la x que elijas.', 'Nuevos ajustes: recta por el origen (y = bx, con su incertidumbre) e hiperbólica (y = a + b/x).', 'Comparación de todos los ajustes ordenados por R², para ver cuál es mejor.', 'Gráfica de residuos y aviso de los puntos atípicos (residuo mayor que dos veces el error típico).', 'Coeficiente de correlación de Spearman, la relación b·b′ = r² y el ángulo entre las dos rectas.', 'Datos en una tabla de doble entrada, como en los ejercicios de clase.', 'Puedes elegir si las varianzas y la covarianza se dividen entre n o entre n − 1.'] },
      { v: '0.1.2', fecha: '2026-10-25', cambios: ['El ajuste parabólico funciona con x grandes, como los años (2015, 2016…): antes decía que faltaban valores de x distintos.', 'En los ajustes exponencial y potencial, una a muy pequeña se escribe en notación científica en vez de 0.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: escribe o pega tus datos (x, y), con frecuencias si las tienes, y obtén medias, varianzas, covarianza, el coeficiente de correlación con su contraste y las dos rectas de regresión, con la tabla de cálculos y la nube de puntos.', 'Ajustes exponencial, potencial, logarítmico y parabólico, con R² para compararlos con la recta, y los residuos.', 'Estimaciones de y a partir de x y de x a partir de y, avisando si es una extrapolación.', 'Añade puntos pulsando en la gráfica.'] },
    ],
    estadistica: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevas distribuciones: F de Snedecor, uniforme continua, geométrica e hipergeométrica.', 'Valores críticos unilaterales y bilaterales, con los dos valores de la χ² y de la F.', 'Hallar μ o σ de una normal a partir de una probabilidad, como en los ejercicios de «¿qué media hace falta para que…?».', 'P(|X − μ| ≤ c), a una distancia c de la media, con la cota de Chebyshev al lado.', 'Aproximaciones de la binomial por la Poisson y de la Poisson por la normal, además de la binomial por la normal.', 'Las colas muy lejanas ya no salen como 0: se escriben en notación científica.', 'Tabla de valores de las discretas con un botón para copiarla.', 'Arrastra los valores sobre la gráfica para mover el área.', 'Modo práctica con ejercicios al azar de todas las distribuciones.'] },
      { v: '0.1.2', fecha: '2026-10-25', cambios: ['En la binomial, al calcular un cuantil, la probabilidad del cuantil ya no cambia la probabilidad de éxito p.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: normal, t de Student, chi cuadrado, exponencial, binomial y Poisson, con su media y su varianza.', 'Probabilidades P(X ≤ a), P(X ≥ a), entre dos valores y, en las discretas, P(X = k) y con desigualdad estricta; cuantiles y valores críticos bilaterales.', 'Gráfica con el área (o las barras) que se pide sombreada.', 'Desarrollo como en clase: tipificación Z = (X − μ)/σ y Φ(z), fórmula de la binomial y de la Poisson término a término, y aproximación de la binomial por la normal con corrección de continuidad.'] },
    ],
    dinamica: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Bloques lanzados con velocidad inicial: frenan, se paran y se quedan quietos o vuelven, con la distancia y el tiempo de frenada.', 'Nuevos problemas: dos bloques en contacto o unidos por una cuerda, con la fuerza entre ellos; curvas con y sin peralte (velocidades máxima y mínima y si derrapa); péndulo cónico; loma y hondonada, y muelles (ley de Hooke, serie y paralelo, equilibrio en un plano y periodo de oscilación).', 'Fuerza mínima para que un bloque empiece a subir y el ángulo con el que menos cuesta, y el coeficiente de rozamiento a partir de una aceleración medida.', 'El dibujo se anima: el bloque se mueve, frena y vuelve, las masas de Atwood suben y bajan, el péndulo cónico gira y el muelle oscila. Se puede pausar.', 'Las fórmulas del desarrollo se ven como en los libros, y los ejemplos usan coma decimal.', 'Modo práctica con enunciado escrito para cada tipo de problema.'] },
      { v: '0.1.2', fecha: '2026-10-25', cambios: ['Arreglo: en el diagrama de fuerzas, el nombre del bloque ya no queda tapado por las flechas, el bloque se ve más grande y la flecha de la aceleración no cruza la normal.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: bloque en un plano horizontal o inclinado con rozamiento estático y dinámico, una fuerza aplicada con ángulo y, si quieres, una masa colgando de una polea. Dice si el bloque se mueve o el rozamiento lo sujeta y da la normal, el rozamiento, la aceleración y la tensión, con el desarrollo paso a paso.', 'Máquina de Atwood, también con una polea con masa.', 'Dibujo con el diagrama de fuerzas a escala y la aceleración, y la velocidad y el tiempo al recorrer una distancia.'] },
    ],
    'solido-rigido': [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Rodadura, polea y péndulo animados: se ve la rueda girar mientras baja.', 'Momento de inercia de un cuerpo compuesto: varias piezas (varillas, discos, esferas, masas puntuales…) cada una a su distancia del eje.', 'Choques que hacen girar: bala que se incrusta en una varilla colgada (y hasta dónde sube) y persona que salta a una plataforma.', 'Péndulo físico (periodo y longitud equivalente) y varilla que cae girando por su base.', 'Equilibrio estático: escalera apoyada en una pared (¿resbala?, ¿hasta dónde se puede subir?) y viga sobre dos apoyos con cargas.', 'Fórmulas del desarrollo bien escritas y ejemplos con coma decimal.', 'Modo práctica con enunciado.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: momentos de inercia de esferas, cilindros, aros, varillas, discos y placas, con el teorema de Steiner y el radio de giro.', 'Rodadura por un plano inclinado: aceleración, velocidad al final, rozamiento necesario para que no deslice y qué pasa si no basta; comparación del tiempo que tarda cada cuerpo.', 'Polea con masa de la que cuelga un cuerpo: aceleración, tensión y balance de energía.', 'Conservación del momento angular, como la patinadora que encoge los brazos, con la variación de la energía cinética.'] },
    ],
    ondas: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Superposición: pulsaciones de dos frecuencias cercanas, con la envolvente, y dos ondas desfasadas (por la diferencia de caminos o por el desfase).', 'Energía y potencia que transporta una onda en una cuerda.', 'Reflexión y transmisión entre dos cuerdas: coeficientes, amplitudes, reparto de la potencia y animación del pulso.', 'Enlace a Efecto Doppler para los casos con viento, ángulo o cono de Mach.', 'Fórmulas del desarrollo bien escritas y ejemplos con coma decimal.', 'Modo práctica con enunciado.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: ecuación de una onda armónica con ω y k en múltiplos de π, posición, velocidad y aceleración de un punto del medio y desfase entre dos puntos.', 'Ondas estacionarias en cuerdas y en tubos abiertos o cerrados: frecuencia de cada armónico, nodos y vientres, y velocidad en la cuerda con √(T/μ).', 'Efecto Doppler con la fuente y el observador moviéndose, y nivel sonoro en decibelios a distintas distancias y con varias fuentes.', 'Animación de la onda, de la onda estacionaria y de los frentes de onda del Doppler.'] },
    ],
    gases: [
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
      { v: '0.2', fecha: '2026-10-26', cambios: ['Nuevo modo de asociación: escribe 100 + (220 ‖ 330) y sale la resistencia equivalente paso a paso, y con una tensión, la corriente y la potencia.', 'Nuevo modo para conseguir un valor que no existe con dos normalizadas en serie o en paralelo (5 kΩ = 10 kΩ ‖ 10 kΩ).', 'Nuevos modos de resistencia para un LED, con el valor normalizado y la potencia que debe aguantar, y de divisor de tensión con normalizadas, también con carga.', 'Código impreso de los condensadores (104, 472J, 104K 2A, 4n7) con la tolerancia y la tensión, y el código de colores de las bobinas en μH.', 'Avisa si parece que estás leyendo la resistencia al revés y te dice qué valor saldría desde el otro extremo.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas dentro del texto de la teoría se ven bien escritas, no con símbolos $.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: elige los colores de una resistencia de 3, 4, 5 o 6 bandas y obtén el valor, la tolerancia, el margen del valor real y el coeficiente de temperatura, con el dibujo de la resistencia.', 'Del valor a los colores: escribe 4k7, 2M2 o 470R y te da las bandas y el valor normalizado más cercano de las series E6 a E96.', 'Códigos SMD de 3 y 4 cifras, con R y EIA-96.'] },
    ],
    faraday: [
      { v: '0.2', fecha: '2026-10-26', cambios: ['Hilo recto y espira rectangular: la espira se aleja o se acerca, o la corriente del hilo cambia, con el flujo integrado, la fem, el sentido y la fuerza sobre la espira.', 'Campo que cambia con una función del tiempo (B₀ + kt, B₀ + kt², B₀ sen ωt o B₀ e^(−t/τ)): fem en cualquier instante y gráficas de B(t) y ε(t).', 'Barra con masa: velocidad límite al tirar de ella o al caer por raíles verticales, y la distancia que recorre una barra lanzada hasta pararse, con v(t).', 'Varilla que gira por un extremo y disco de Faraday: ε = ½BωL².', 'Alternador: el par que hay que hacer para mantener el giro y la energía de cada vuelta.', 'Botones para copiar el enlace del ejercicio, copiar la solución como texto o en LaTeX e imprimirla o guardarla en PDF.', 'El desarrollo paso a paso escribe las fórmulas como en los libros: fracciones, raíces, exponentes y subíndices de verdad.', 'Enlace a Autoinducción e inducción mutua desde la teoría.'] },
      { v: '0.1.1', fecha: '2026-10-24', cambios: ['Las fórmulas de la teoría se ven como en los libros: fracciones, raíces, exponentes y subíndices de verdad.'] },
      { v: '0.1', fecha: '2026-10-24', cambios: ['Primera versión: fem y corriente inducidas en una barra que se desliza sobre unos raíles, con la fuerza que la frena y la potencia.', 'Bobina que gira en un campo (alternador): flujo y fem en función del tiempo, valores máximo y eficaz.', 'Flujo que cambia en un tiempo porque cambia el campo o el ángulo: fem media, corriente y carga.', 'Espira que atraviesa una región con campo: fem al entrar y al salir, fuerza y calor.', 'Sentido de la corriente por la ley de Lenz y animación con la gráfica de Φ y ε.'] },
    ],
    // «Física en la vida real» (todos los fenómenos comparten versión)
    fenomenos: [
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
if (typeof module !== 'undefined') module.exports = Version;
