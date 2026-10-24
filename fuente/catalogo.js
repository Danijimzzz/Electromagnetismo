/* =====================================================================
   Catálogo de la web: asignaturas y herramientas. portal.js genera con él la portada
   (publico/index.html) y una página por asignatura (publico/<asignatura>/index.html).
   Cada herramienta disponible vive en publico/<asignatura>/<herramienta>/index.html.
   Las que tienen disponible: false salen como «Próximamente», sin enlace ni página propia.
   ===================================================================== */
const Catalogo = {
  marca: ['Simula', 'Ciencia'], // nombre provisional: la segunda parte va en cursiva
  lema: 'Simuladores y calculadoras para resolver problemas de la carrera paso a paso, con la misma notación que en clase. Gratis y sin registrarse.',
  asignaturas: [
    {
      clave: 'electromagnetismo', nombre: 'Electromagnetismo', icono: 'E', color: '#c2412a', colorOscuro: '#ef7a62',
      resumen: 'Electrostática, magnetostática, inducción y dieléctricos, con el desarrollo completo de cada resultado.',
      herramientas: [
        { clave: 'electrostatica', nombre: 'Electrostática', icono: 'E', disponible: true, desc: 'Cargas, hilos, planos y esferas. Campo, potencial, energía y Gauss.', buscar: 'campo eléctrico potencial coulomb gauss carga hilo plano esfera dipolo' },
        { clave: 'magnetostatica', nombre: 'Magnetostática (Biot-Savart)', icono: 'B', disponible: true, desc: 'B de hilos, espiras, arcos, solenoides y toroides.', buscar: 'campo magnético biot savart ampère espira solenoide toroide' },
        { clave: 'condensadores', nombre: 'Dieléctricos y condensadores', icono: 'C', disponible: true, desc: 'Planos, cilíndricos y esféricos con capas de dieléctrico: capacidad, energía, D, P y polarización.', buscar: 'capacidad condensador dieléctrico polarización' },
        { clave: 'induccion', nombre: 'Autoinducción e inducción mutua', icono: 'L', disponible: true, desc: 'L de solenoides, toroides y coaxiales, M entre circuitos, energía magnética y circuito RL.', buscar: 'inductancia autoinducción inducción mutua faraday bobina circuito rl henrio' },
      ],
    },
    {
      clave: 'fisica', nombre: 'Física general', icono: 'F', color: '#2a5db5', colorOscuro: '#74a2f2',
      resumen: 'Mecánica y termodinámica de primer curso: energía, cinemática y calor.',
      herramientas: [
        { clave: 'trabajo-y-energia', nombre: 'Trabajo y energía', icono: 'W', disponible: true, desc: 'Conservación de la energía en rampas y muelles, con barras de energía.', buscar: 'energía cinética potencial muelle rampa rozamiento' },
        { clave: 'tiro-parabolico', nombre: 'Tiro parabólico y cinemática', icono: 'v', disponible: true, desc: 'Trayectorias con y sin rozamiento del aire, alcance, altura máxima, MRU y MRUA con gráficas x(t), v(t), a(t).', buscar: 'tiro parabólico proyectil cinemática mru mrua caída libre' },
        { clave: 'calorimetria', nombre: 'Calorimetría y cambios de fase', icono: 'Q', disponible: true, desc: 'Temperatura de equilibrio con hielo, vapor, metales y calorímetro, y cuánto cambia de fase.', buscar: 'calor específico latente equilibrio térmico' },
        { clave: 'dinamica', nombre: 'Dinámica y diagramas de fuerzas', icono: 'F', disponible: true, desc: 'Planos inclinados, rozamiento, poleas y Atwood con el diagrama de fuerzas y las leyes de Newton.', buscar: 'dinámica fuerzas newton diagrama de cuerpo libre plano inclinado rozamiento estático dinámico normal tensión polea atwood' },
        { clave: 'solido-rigido', nombre: 'Sólido rígido', icono: 'I', disponible: true, desc: 'Momentos de inercia y Steiner, rodadura por un plano, poleas con masa y momento angular.', buscar: 'sólido rígido momento de inercia steiner rodadura rueda plano inclinado polea momento angular rotación torque par patinadora' },
        { clave: 'ondas', nombre: 'Ondas mecánicas', icono: '∿', disponible: true, desc: 'Ecuación de onda, estacionarias en cuerdas y tubos, efecto Doppler y nivel sonoro, con animación.', buscar: 'ondas mecánicas onda armónica ecuación longitud de onda frecuencia estacionaria armónicos cuerda tubo doppler sonido decibelios intensidad' },
      ],
    },
    {
      clave: 'quimica', nombre: 'Química', icono: 'Q', color: '#1d7a3e', colorOscuro: '#5fcf8a',
      resumen: 'Tabla periódica, estequiometría y disoluciones para química general.',
      herramientas: [
        { clave: 'tabla-periodica', nombre: 'Tabla periódica interactiva', icono: 'Z', disponible: true, desc: 'Ficha de cada elemento y tendencias coloreadas.', buscar: 'elementos tabla periódica electronegatividad radio atómico' },
        { clave: 'masa-molar', nombre: 'Masa molar y estequiometría', icono: 'M', disponible: true, desc: 'Reactivo limitante, rendimiento, moles, gramos y litros.', buscar: 'masa molar moles estequiometría reactivo limitante' },
        { clave: 'configuracion-electronica', nombre: 'Configuración electrónica', icono: 'e', disponible: true, desc: 'Diagrama de Moeller, excepciones y números cuánticos.', buscar: 'configuración electrónica moeller números cuánticos orbitales' },
        { clave: 'disoluciones', nombre: 'Disoluciones y concentraciones', icono: 'c', disponible: true, desc: 'Molaridad, molalidad, fracción molar, % y ppm; preparar desde un reactivo comercial y diluir.', buscar: 'molaridad molalidad concentración dilución' },
      ],
    },
    {
      clave: 'matematicas', nombre: 'Matemáticas', icono: '∑', color: '#6b3fa0', colorOscuro: '#b892ec',
      resumen: 'Álgebra y cálculo de la carrera, con cada paso explicado.',
      herramientas: [
        { clave: 'matrices', nombre: 'Matrices paso a paso', icono: 'A', disponible: true, desc: 'Determinante, inversa, rango, Gauss-Jordan y valores propios, con fracciones exactas y complejos.', buscar: 'matriz determinante inversa gauss jordan rango autovalores valores propios diagonalizar sarrus laplace adjunta' },
        { clave: 'sistemas', nombre: 'Sistemas de ecuaciones lineales', icono: 'x', disponible: true, desc: 'Rouché-Frobenius, Gauss, Cramer e inversa, en paramétricas, también con complejos.', buscar: 'sistema ecuaciones lineales gauss cramer rouché frobenius compatible indeterminado incompatible paramétrica complejos' },
        { clave: 'estadistica', nombre: 'Distribuciones de probabilidad', icono: 'σ', disponible: true, desc: 'Normal, binomial, Poisson, t y χ² con el área sombreada, cuantiles y valores críticos.', buscar: 'estadística probabilidad distribución normal binomial poisson student chi cuadrado tipificar cuantil valor crítico' },
        { clave: 'campos-vectoriales', nombre: 'Campos vectoriales', icono: '∇', desc: 'Gradiente, divergencia, rotacional y flujo.', buscar: 'gradiente divergencia rotacional flujo' },
      ],
    },
    {
      clave: 'laboratorio', nombre: 'Laboratorio', icono: 'Ω', color: '#b0700a', colorOscuro: '#e6a640',
      resumen: 'Circuitos y medidas para las prácticas.',
      herramientas: [
        { clave: 'alterna', nombre: 'Corriente alterna y fasores', icono: '∿', disponible: true, desc: 'Circuitos RLC en serie y en paralelo con fasores, potencias, factor de potencia y resonancia.', buscar: 'corriente alterna fasores impedancia rlc reactancia potencia activa reactiva aparente factor de potencia resonancia condensador bobina' },
        { clave: 'circuitos', nombre: 'Circuitos de corriente continua', icono: 'I', disponible: true, desc: 'Método de los nudos con Kirchhoff, corrientes, potencias, Thévenin, Norton y máxima potencia.', buscar: 'circuito corriente continua kirchhoff nudos mallas thévenin norton resistencia fuente tensión corriente potencia balance' },
      ],
    },
  ],
};
if (typeof module !== 'undefined') module.exports = Catalogo;
