/* ===== Preguntas frecuentes de Economía (para seo.js y diseno.js; ver ../preguntas.js) ===== */
module.exports = {
  'oferta-demanda': [
    ['¿Cómo se calcula el equilibrio de mercado?', 'Se igualan oferta y demanda, Qd = Qs. Con Qd = 100 − 2P y Qs = 20 + 2P: 80 = 4P, luego P = 20 y Q = 60.'],
    ['¿Qué pasa si el precio se fija por debajo del equilibrio?', 'Hay escasez. Con un precio máximo de 15 en el ejemplo anterior, Qd = 70 y Qs = 50, así que faltan 20 unidades.'],
  ],
  elasticidades: [
    ['¿Cómo se calcula la elasticidad precio de la demanda?', 'ε = (ΔQ/Q)/(ΔP/P), o en un punto, ε = (dQ/dP)·(P/Q). Con Qd = 100 − 2P en P = 20 y Q = 60, ε = −2 · 20/60 ≈ −0,67: demanda inelástica.'],
    ['¿Y entre dos puntos, la de renta y la cruzada?', 'Con el punto medio: si P pasa de 10 a 12 y Q de 50 a 40, ε = (−10/45)/(2/11) ≈ −1,22 (elástica). La elasticidad renta es mayor que 1 en bienes de lujo y negativa en inferiores; la cruzada es positiva en sustitutivos y negativa en complementarios.'],
  ],
  excedentes: [
    ['¿Cómo se calcula el excedente del consumidor?', 'Es el área entre la curva de demanda y el precio. Con P = 50 − Q y un precio de 20, Q = 30 y el excedente es ½ · 30 · 30 = 450. El del productor es el área entre el precio y la curva de oferta.'],
    ['¿Cómo se calcula la pérdida de eficiencia de un impuesto?', 'Es el triángulo ½ · t · (Q₀ − Q₁). Con Qd = 100 − 2P, Qs = 20 + 2P y un impuesto de 4 € por unidad, el equilibrio pasa de Q = 60 a Q = 56 (P = 22), la recaudación es 4 · 56 = 224 y la pérdida es ½ · 4 · 4 = 8.'],
  ],
  costes: [
    ['¿Cómo se calculan el coste medio y el marginal?', 'CMe = CT/Q y CMg = dCT/dQ. Con CT = 100 + 10Q + Q² y Q = 10: CT = 300, CMe = 30 y CMg = 10 + 2Q = 30.'],
    ['¿Qué son el óptimo y el mínimo de explotación?', 'El óptimo de explotación es el mínimo del coste medio, donde CMg = CMe (en el ejemplo, Q = 10). El mínimo de explotación es el mínimo del coste variable medio, el precio bajo el cual la empresa deja de producir.'],
  ],
  beneficio: [
    ['¿Cómo maximiza el beneficio una empresa en competencia perfecta?', 'Produce donde P = CMg. Con P = 30 y CT = 100 + 10Q + Q²: 10 + 2Q = 30, Q = 10; ingreso 300, coste 300 y beneficio 0.'],
    ['¿Y un monopolio?', 'Donde IMg = CMg, y cobra el precio de la demanda para esa cantidad. Con P = 50 − Q, IMg = 50 − 2Q; si CMg = 10, Q = 20 y P = 30, con margen (30 − 10) · 20 = 400 antes de costes fijos.'],
  ],
  'teoria-juegos': [
    ['¿Qué es un equilibrio de Nash?', 'Una combinación de estrategias en la que ningún jugador mejora cambiando solo la suya. En el dilema del prisionero, el equilibrio es que ambos confiesen (5 y 5 años) aunque ambos callar (1 y 1) sería mejor para los dos.'],
    ['¿Cómo se halla en una matriz 2×2?', 'Se marca la mejor respuesta de cada jugador a cada estrategia del otro; las casillas con las dos marcas son equilibrios de Nash.'],
  ],
  'pib-ipc': [
    ['¿Cómo se pasa del PIB nominal al real?', 'PIB real = PIB nominal/deflactor · 100. Con un PIB nominal de 1200 y un deflactor de 120, el PIB real es 1000.'],
    ['¿Cómo se calcula la inflación?', 'π = (IPCₜ − IPCₜ₋₁)/IPCₜ₋₁ · 100. Si el IPC pasa de 105 a 107,1, la inflación es (2,1/105) · 100 = 2 %.'],
  ],
  multiplicador: [
    ['¿Cómo se calcula el multiplicador del gasto?', 'k = 1/(1 − c), con c la propensión marginal a consumir (con impuestos proporcionales, 1/(1 − c(1 − t))). Con c = 0,8, k = 5: un aumento del gasto de 10 eleva la renta en 50.'],
    ['¿Cómo se halla la renta de equilibrio?', 'De Y = C + I + G. Con C = 100 + 0,8Y, I = 50 y G = 50: Y = 200 + 0,8Y, luego Y = 1000.'],
  ],
  'is-lm': [
    ['¿Cómo se halla el equilibrio IS-LM?', 'Se resuelven a la vez las dos curvas. Con IS: Y = 2000 − 100r y LM: Y = 1000 + 100r, igualando sale r = 5 e Y = 1500.'],
    ['¿Qué efecto tienen las políticas fiscal y monetaria?', 'Una expansión fiscal desplaza la IS a la derecha y sube la renta y el tipo de interés. Una expansión monetaria desplaza la LM a la derecha y sube la renta y baja el tipo de interés.'],
  ],
  'phillips-okun': [
    ['¿Qué dice la ley de Okun?', 'Que el paro por encima del natural reduce el PIB respecto al potencial: (Y − Y*)/Y* = −β(u − uₙ). Con β = 2 y un paro 2 puntos sobre el natural, el PIB queda un 4 % por debajo del potencial.'],
    ['¿Y la curva de Phillips?', 'Relaciona inflación y paro: π = πᵉ − α(u − uₙ). Con α = 0,5 y un paro 2 puntos por debajo del natural, la inflación es 1 punto mayor que la esperada.'],
  ],
  'tipos-cambio': [
    ['¿Cómo se calcula el tipo de cambio real?', 'ε = e·P*/P, con e en unidades de moneda nacional por unidad de extranjera. Con e = 0,9 €/$, P* = 100 $ y P = 95 €: ε = 0,9 · 100/95 ≈ 0,947.'],
    ['¿Qué es la paridad del poder adquisitivo?', 'Que el tipo de cambio iguala el precio de una misma cesta en los dos países, e = P/P*. Si la cesta cuesta 90 € en la zona euro y 100 $ en EE. UU., e = 0,9 €/$.'],
  ],
  interes: [
    ['¿Cuál es la diferencia entre interés simple y compuesto?', 'Simple: Cₙ = C₀(1 + i·n); compuesto: Cₙ = C₀(1 + i)ⁿ. Con 1000 € al 5 % durante 3 años: 1150 € con interés simple y 1157,63 € con compuesto.'],
    ['¿Cómo se pasa del TIN a la TAE?', 'TAE = (1 + i_m)^m − 1. Un TIN del 6 % con pago mensual es 0,5 % al mes y da una TAE de 1,005¹² − 1 ≈ 6,17 %.'],
  ],
  prestamos: [
    ['¿Cómo se calcula la cuota de un préstamo por el sistema francés?', 'a = C·i/(1 − (1 + i)⁻ⁿ). Con 10 000 € al 6 % anual (0,5 % mensual) en 12 meses, a = 10 000 · 0,005/(1 − 1,005⁻¹²) ≈ 860,66 €.'],
    ['¿Cómo se reparte cada cuota entre intereses y capital?', 'Los intereses son el tipo por el capital pendiente. En la primera cuota del ejemplo: 50 € de intereses y 810,66 € de capital. En el sistema de amortización constante se devuelve siempre C/n (833,33 € en el ejemplo) y la cuota va bajando.'],
  ],
  'van-tir': [
    ['¿Cómo se calcula el VAN?', 'VAN = −I + Σ Fₜ/(1 + k)ᵗ. Con una inversión de 1000, flujos de 600 y 600 y k = 10 %: VAN = −1000 + 545,45 + 495,87 ≈ 41,32; es positivo, así que el proyecto interesa.'],
    ['¿Y la TIR y el payback?', 'La TIR es la tasa que hace el VAN igual a cero (en el ejemplo, ≈ 13,07 %) y el proyecto se acepta si supera la tasa exigida. El payback es el tiempo en recuperar la inversión: 1 + 400/600 ≈ 1,67 años.'],
  ],
  rentas: [
    ['¿Cómo se calcula el valor actual de una renta constante?', 'Pospagable: V₀ = a·(1 − (1 + i)⁻ⁿ)/i. Con a = 100 € durante 5 años al 4 %: V₀ = 100 · 4,4518 ≈ 445,18 €. Si es prepagable, se multiplica por (1 + i): ≈ 462,99 €.'],
    ['¿Y el valor final?', 'V_n = a·((1 + i)ⁿ − 1)/i. En el mismo ejemplo, V₅ = 100 · 5,4163 ≈ 541,63 €.'],
  ],
  ahorro: [
    ['¿Cuánto se acumula con aportaciones periódicas?', 'V = A·((1 + i)ⁿ − 1)/i. Con 2400 € al año durante 20 años al 3 %: 2400 · 26,87 ≈ 64 489 €.'],
    ['¿Cómo afecta la inflación?', 'El tipo real es (1 + i)/(1 + π) − 1, aproximadamente i − π. Con un 3 % nominal y un 2 % de inflación, el tipo real es 1,03/1,02 − 1 ≈ 0,98 %.'],
  ],
  'punto-muerto': [
    ['¿Cómo se calcula el punto muerto?', 'Q* = CF/(p − cv). Con costes fijos de 10 000 €, precio 25 € y coste variable unitario 15 €: Q* = 10 000/10 = 1000 unidades, con ingresos de 25 000 €.'],
    ['¿Cuánto hay que vender para un beneficio objetivo?', 'Q = (CF + B)/(p − cv). Para ganar 5000 € en el ejemplo: (10 000 + 5000)/10 = 1500 unidades.'],
  ],
  ratios: [
    ['¿Cómo se calcula la liquidez?', 'Liquidez general = activo corriente/pasivo corriente. Con 300 de activo corriente y 200 de pasivo corriente, la ratio es 1,5, por encima de 1: la empresa puede pagar sus deudas a corto plazo.'],
    ['¿Y las rentabilidades ROE y ROA?', 'ROE = beneficio neto/fondos propios; ROA = beneficio/activo total. Con un beneficio de 50, fondos propios de 400 y activo de 1000: ROE = 12,5 % y ROA = 5 %.'],
  ],
  'amortizacion-inmovilizado': [
    ['¿Cómo se amortiza por el método lineal?', 'Cuota = (valor de adquisición − valor residual)/años. Con 10 000 €, residual 1000 € y 5 años: 1800 € al año.'],
    ['¿Y por suma de dígitos?', 'La cuota de cada año es (años que quedan/suma de dígitos) × base amortizable. Con 5 años la suma es 15: el primer año 5/15 · 9000 = 3000 € y el segundo 4/15 · 9000 = 2400 €.'],
  ],
  balance: [
    ['¿Qué ecuación cumple el balance?', 'Activo = Pasivo + Patrimonio neto. Un activo de 500 financiado con 300 de deudas y 200 de patrimonio neto cuadra.'],
    ['¿Cómo se pasa de ventas a beneficio neto?', 'Ventas − gastos de explotación = BAII; − gastos financieros = BAI; − impuestos = beneficio neto. Con ventas 1000, gastos 700, intereses 50 y un impuesto del 25 %: BAII 300, BAI 250 y beneficio neto 187,5.'],
  ],
  'numeros-indice': [
    ['¿Cómo se calcula un número índice y se cambia de base?', 'Índice simple: I = (Xₜ/X₀) · 100. Para cambiar la base se divide por el índice del nuevo año base y se multiplica por 100: un índice de 150 con un nuevo base de 120 pasa a 150/120 · 100 = 125.'],
    ['¿Cómo se calcula la tasa de variación?', 'Tasa = (Iₜ/Iₜ₋₁ − 1) · 100. Si el índice pasa de 110 a 121, la tasa es del 10 %.'],
  ],
  'regresion-economia': [
    ['¿Cómo se interpreta una recta de regresión en economía?', 'La pendiente es el efecto marginal. En la función de consumo C = 200 + 0,8Y, cada euro más de renta aumenta el consumo en 0,8 € (propensión marginal a consumir); el R² dice qué parte de la variación explica la renta.'],
    ['¿Y un ajuste logarítmico o exponencial?', 'En ln Q = a + b ln P, b es la elasticidad constante: con b = −1,5, un 1 % más de precio reduce la cantidad un 1,5 %. En ln y = a + bt, b es la tasa de crecimiento.'],
  ],
  'lorenz-gini': [
    ['¿Cómo se calcula el índice de Gini?', 'G = 1 − Σ(xᵢ − xᵢ₋₁)(yᵢ + yᵢ₋₁), con x e y las proporciones acumuladas de población y de renta. Para 4 personas con rentas 10, 20, 30 y 40: y = 0,1; 0,3; 0,6; 1, y G = 1 − 0,25 · 3,0 = 0,25.'],
    ['¿Qué es la curva de Lorenz?', 'Muestra qué porcentaje acumulado de la renta posee cada porcentaje acumulado de la población. Con igualdad perfecta es la diagonal (G = 0); cuanto más se curva, mayor es la desigualdad (G cerca de 1).'],
  ],
};
