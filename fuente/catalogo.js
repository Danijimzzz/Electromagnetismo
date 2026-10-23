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
        { clave: 'induccion', nombre: 'Autoinducción e inducción mutua', icono: 'L', desc: 'L de solenoides y toroides, M entre circuitos y energía magnética.', buscar: 'inductancia autoinducción inducción mutua faraday' },
      ],
    },
    {
      clave: 'fisica', nombre: 'Física general', icono: 'F', color: '#2a5db5', colorOscuro: '#74a2f2',
      resumen: 'Mecánica y termodinámica de primer curso: energía, cinemática y calor.',
      herramientas: [
        { clave: 'trabajo-y-energia', nombre: 'Trabajo y energía', icono: 'W', disponible: true, desc: 'Conservación de la energía en rampas y muelles, con barras de energía.', buscar: 'energía cinética potencial muelle rampa rozamiento' },
        { clave: 'tiro-parabolico', nombre: 'Tiro parabólico y cinemática', icono: 'v', disponible: true, desc: 'Trayectorias con y sin rozamiento del aire, alcance, altura máxima, MRU y MRUA con gráficas x(t), v(t), a(t).', buscar: 'tiro parabólico proyectil cinemática mru mrua caída libre' },
        { clave: 'calorimetria', nombre: 'Calorimetría y cambios de fase', icono: 'Q', disponible: true, desc: 'Temperatura de equilibrio con hielo, vapor, metales y calorímetro, y cuánto cambia de fase.', buscar: 'calor específico latente equilibrio térmico' },
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
        { clave: 'matrices', nombre: 'Matrices paso a paso', icono: 'A', desc: 'Determinantes, inversas, Gauss y autovalores.', buscar: 'matriz determinante inversa gauss autovalores' },
        { clave: 'campos-vectoriales', nombre: 'Campos vectoriales', icono: '∇', desc: 'Gradiente, divergencia, rotacional y flujo.', buscar: 'gradiente divergencia rotacional flujo' },
      ],
    },
    {
      clave: 'laboratorio', nombre: 'Laboratorio', icono: 'Ω', color: '#b0700a', colorOscuro: '#e6a640',
      resumen: 'Circuitos y medidas para las prácticas.',
      herramientas: [
        { clave: 'circuitos', nombre: 'Circuitos de corriente continua', icono: 'I', desc: 'Mallas, nudos, Thévenin y potencias.', buscar: 'circuito kirchhoff mallas nudos thévenin resistencia' },
      ],
    },
  ],
};
if (typeof module !== 'undefined') module.exports = Catalogo;
