# Enlaces «Usar en…» entre herramientas

Generado por `node pruebas/usar-en.js --tabla` pulsando cada enlace de la web compilada: **no editar a mano**. Cada fila es un enlace que la prueba común abre y comprueba (destino correcto, datos llevados y resultado).

Hay 28 enlaces que salen de 23 herramientas y llegan a 25.

## Electromagnetismo

| Origen | Destino | Botón | Qué lleva | Sale con |
| --- | --- | --- | --- | --- |
| Ondas electromagnéticas planas | Reflexión y transmisión (Fresnel) | Abrir en Fresnel | el estado, por almacenamiento | ejemplo «vidrio» |
| Guías de onda | Cavidades resonantes | Abrir en Cavidades | el estado, por almacenamiento | los datos de partida |

## Física general

| Origen | Destino | Botón | Qué lleva | Sale con |
| --- | --- | --- | --- | --- |
| Tiro parabólico y cinemática | Trabajo y energía | Comprobar la velocidad al caer por energía → | `modo`, `m`, `g`, `alturas`, `sep`, `v0` | los datos de partida |
| Gases ideales | Ciclos termodinámicos | Analizar este ciclo de Carnot en Ciclos termodinámicos → | `modo`, `gas`, `Tc`, `Tf`, `n`, `V1`, `V2` | ejemplo «carnot» |
| Gravitación y órbitas | Física moderna: fotoeléctrico y relatividad | Dilatación del tiempo a esta velocidad → | `modo`, `uv`, `v`, `t0` | ejemplo «iss» |

## Química

| Origen | Destino | Botón | Qué lleva | Sale con |
| --- | --- | --- | --- | --- |
| Ajustador de reacciones | Masa molar y estequiometría | Calcular cantidades en Masa molar | `tab`, `ecuacion`, `cantidades` | los datos de partida |
| Termoquímica y ley de Hess | Equilibrio químico y Le Chatelier | Calcular K en Equilibrio | `modo`, `dG`, `T`, `nA`, `nB`, `nC`, `nD`, `a`, `b`, `c`, `d`, `cA`, `cB`, `cC`, `cD` | los datos de partida |
| Solubilidad y Kps | pH y valoraciones | Calcular el pH de la disolución saturada | `modo`, `especie`, `C`, `n` | ejemplo «caoh2» |

## Matemáticas

| Origen | Destino | Botón | Qué lleva | Sale con |
| --- | --- | --- | --- | --- |
| Series de Taylor | Graficador de funciones | Dibujar f y su polinomio en el Graficador → | `f`, `g`, `h`, `xmin`, `xmax`, `ymin`, `ymax` | los datos de partida |
| Ecuaciones diferenciales | Transformada de Laplace | Resolver con Laplace → | `modo`, `a`, `b`, `c`, `g`, `y0`, `v0` | ejemplo «mas» |
| Transformada de Laplace | Circuitos · Control: Routh, raíces y Nyquist | Usar F(s) como lazo abierto en Control → | `modo`, `num`, `den`, `K` | los datos de partida |
| Convergencia de series | Series de Taylor | Ver esta serie como desarrollo de Taylor → | `modo`, `f`, `a`, `n`, `x0` | los datos de partida |

## Estadística

| Origen | Destino | Botón | Qué lleva | Sale con |
| --- | --- | --- | --- | --- |
| Intervalos de confianza | Estadística descriptiva | Descriptiva de estos datos → | `formato`, `datos`, `pesos`, `div`, `pk` | ejemplo «lista» |
| Estadística descriptiva | Intervalos de confianza | Intervalo de confianza para la media → | `modo`, `sigmaC`, `nivel`, `tipoS`, `fuente`, `datos` | los datos de partida |
| Estadística descriptiva | Contrastes de hipótesis | Contraste de la media → | `tipo`, `h1`, `alfa`, `sigmaC`, `n`, `xm`, `s`, `mu0` | los datos de partida |
| Estadística descriptiva | Contrastes no paramétricos | Wilcoxon para la mediana → | `tipo`, `h1`, `alfa`, `exacto`, `cc`, `m0`, `datos` | los datos de partida |
| ANOVA de uno y dos factores | Contrastes no paramétricos | Kruskal-Wallis con estos grupos → | `tipo`, `alfa`, `post`, `datos` | los datos de partida |
| ANOVA de uno y dos factores | Estadística descriptiva | Descriptiva de todos los datos → | `formato`, `datos`, `pesos`, `div`, `pk` | los datos de partida |
| Contrastes no paramétricos | Estadística descriptiva | Descriptiva de estos datos → | `formato`, `datos`, `pesos`, `div`, `pk` | ejemplo «mediana» |
| Contrastes no paramétricos | ANOVA de uno y dos factores | ANOVA con estos grupos → | `modo`, `alfa`, `prueba`, `post`, `contrastes`, `datos` | ejemplo «kruskal» |

## Economía

| Origen | Destino | Botón | Qué lleva | Sale con |
| --- | --- | --- | --- | --- |
| Oferta y demanda | Excedentes, impuestos y eficiencia | Usar en Excedentes e impuestos → | `a`, `b`, `c`, `d`, `interv`, `v` | los datos de partida |
| Costes de producción | Maximización del beneficio | Usar en Maximización del beneficio → | `modo`, `cf`, `ca`, `cb`, `cc`, `p` | los datos de partida |
| PIB, IPC e inflación | Números índice y tasas de variación | Ver el PIB real como número índice → | `modo`, `datos`, `base` | los datos de partida |
| Multiplicador keynesiano | Modelo IS-LM | Añadir el mercado de dinero en IS-LM → | `c0`, `c1`, `T`, `I0`, `b`, `G`, `M`, `P`, `k`, `h`, `dG`, `dT`, `dM` | los datos de partida |
| Interés simple y compuesto | Ahorro e inflación a largo plazo | Ver el capital en Ahorro e inflación → | `modo`, `c0`, `a`, `m`, `r`, `pi`, `n`, `indexa` | los datos de partida |
| Interés simple y compuesto | Rentas y anualidades | Usar el tipo en Rentas → | `modo`, `pago`, `duracion`, `c`, `n`, `i`, `m`, `d` | los datos de partida |
| Balance y cuenta de resultados | Ratios financieros | Usar en Ratios financieros → | `anc`, `ex`, `re`, `di`, `pn`, `pnc`, `pc`, `ventas`, `baii`, `gf`, `t` | los datos de partida |
| Regresión sobre datos económicos | Estadística · Regresión lineal múltiple | Añadir más variables en Regresión múltiple → | `alfa`, `nivel`, `x0`, `datos` | los datos de partida |

## Herramientas sin ningún enlace (ni salen ni llegan)

- **Electromagnetismo:** Electrostática, Magnetostática (Biot-Savart), Dieléctricos y condensadores, Autoinducción e inducción mutua, Inducción: Faraday y Lenz, Fuerza magnética, Ecuación de Laplace numérica, Método de las imágenes, Líneas de transmisión y carta de Smith, Ecuaciones de Maxwell, Antena dipolo y radiación.
- **Física general:** Calorimetría y cambios de fase, Dinámica y diagramas de fuerzas, Sólido rígido, Ondas mecánicas, Efecto Doppler, Interferencia y difracción, Fluidos, Choques y momento lineal, Oscilaciones: MAS, amortiguado y forzado, Óptica geométrica: lentes y espejos, Conversor de unidades y constantes, Oscilaciones acopladas, Cinemática relativista y Minkowski, Termodinámica estadística.
- **Química:** Tabla periódica interactiva, Configuración electrónica, Cinética química, Disoluciones y concentraciones, Geometría molecular VSEPR en 3D, Formulación inorgánica, Redox por ion-electrón, Nomenclatura orgánica e isomería en 3D.
- **Matemáticas:** Matrices paso a paso, Sistemas de ecuaciones lineales, Series de Fourier, Derivadas e integrales, Campos vectoriales, Números complejos, Integrales múltiples, Superficies y curvas de nivel en 3D, Métodos numéricos, Multiplicadores de Lagrange.
- **Estadística:** Distribuciones de probabilidad, Regresión y correlación, Propagación de errores, Probabilidad, χ² de bondad de ajuste e independencia.
- **Circuitos:** Código de colores de resistencias, Convolución y señales, Diagramas de Bode y filtros, Sistemas de numeración, Tablas de verdad y puertas lógicas, Simulador de circuitos, Transformada z y FFT, Punto de trabajo y recta de carga.
- **Economía:** Elasticidades, Teoría de juegos, Curva de Phillips y ley de Okun, Tipos de cambio y PPA, Préstamos y amortización, VAN, TIR y payback, Punto muerto, Amortización del inmovilizado, Curva de Lorenz e índice de Gini, Modelo de Solow, Bonos y duración, Black-Scholes, Cartera de Markowitz y CAPM.
