# Revisión de datos escritos de memoria (6.1 · 2 nov 2026)

Se contrastó cada dato con valores de referencia. Resultado: **no había errores de fondo**; el único retoque es de redacción.

| Dato | Dónde | Referencia | Resultado |
| --- | --- | --- | --- |
| Masas atómicas de los 118 elementos | `quimica/elementos.js` | paquete `mendeleev` 1.3 (IUPAC) | Coinciden (< 0,011 u) |
| Electronegatividad de Pauling | idem | `mendeleev` / CRC | Coinciden salvo Tc, Lu, W, Pt, Au, Hg, Tl, Pb, Bi, U y los transuránidos: los valores de la tabla son los de la convención de Wikipedia/CRC (p. ej. W 2,36, Pb 2,33, Au 2,54), no un error |
| 1.ª energía de ionización | idem | `mendeleev` | Coinciden salvo Tc, Ta, W, Os, Ir, Ac, Th (diferencias de 10–25 kJ/mol, valores CRC antiguos) |
| Constantes de Van der Waals (a, b) | `gases/fisica.js` | CRC, tabla de gases reales | He, H₂, N₂, O₂, Ar, CO₂, NH₃ y H₂O coinciden (a en L²·bar/mol², b en L/mol) |
| Diámetros cinéticos de las moléculas | idem | Breck | Coinciden |
| Masas y radios de planetas y Luna | `gravitacion/calculo.js` | NASA Planetary Fact Sheet | Coinciden |
| GPS: 3,874 km/s, −7,2 µs, +45,7 µs, +38,5 µs/día, 11,5 km/día | `fenomenos/gps-relatividad` | Ashby, Living Reviews in Relativity | Coinciden |
| Línea de alta tensión: 10 MW, 400 kV, R del cable, pérdida de ~3 kW | `fenomenos/transporte-alta-tension` | recalculado a mano | Coincide |
| Microondas: 2,45 GHz, fuga 5 mW/cm² a 5 cm, 1361 W/m², 10⁻⁵ eV | `fenomenos/microondas` | norma IEC/FDA, constante solar | Coincide |
| Rayo: C = 44,27 nF, Q = 4,43 C, U = 221 MJ = 61 kWh | `fenomenos/rayo` | recalculado | Coincide (100 MV, 30 kA y 50 m por salto son valores típicos) |
| Auroras: r = 2,38 m, paso 25,9 m, 557,7 nm = 2,22 eV, 35 eV por ionización | `fenomenos/auroras` | recalculado | Coincide |
| Altavoz y motor: F = 1,57 N, τ = 6·10⁻³ N·m | `fenomenos/altavoz-motor` | recalculado | Coincide |
| Cocina de inducción: ε = 9,47 V, 377 A, R = 25,1 mΩ, Foucault 1855 | `fenomenos/cocina-induccion` | recalculado | Coincide |
| Cargador: f₀ = 110 kHz, M = 2,63 → 1,52 µH, ε ≈ 2,1 V | `fenomenos/cargador-inalambrico` | recalculado con la fórmula exacta de Maxwell | La página usa la aproximación de receptora pequeña (error del 4 % a 0 cm y del 2 % a 2 cm; con la fórmula exacta bajaría un 46 % y no un 42 %): ahora lo dice el texto |
| Ejemplo de Phillips (diez años de un país) | `phillips-okun/calculo.js` | — | Son datos inventados y la propia herramienta los llama «datos de ejemplo» |
| Constantes CODATA 2022 no exactas (ε₀, μ₀, k_e, Z₀, μ_B, μ_N, m_e, m_p, m_n, u, m_ec², m_pc², a₀, r_e, λ_C, α, R∞, E_h; G sin cambio) | `unidades/calculo.js` (`N22`) | CODATA 2022 (NIST SP 961, Mohr et al., Rev. Mod. Phys. 2025), escritas de memoria | La prueba exige que las dos ediciones cumplan α = μ₀ce²/2h, c²ε₀μ₀ = 1, R∞, E_h, λ_C, m_ec², m_pc², a₀, r_e, μ_B y μ_N con ≤ 3·10⁻⁹: cuadran a ~10⁻¹¹ (R∞, E_h, α, λ_C, Z₀), lo que descarta una cifra mal puesta. **Falta contrastar las incertidumbres entre paréntesis con la tabla del NIST** |
| Cuentas del PGC en la amortización y la venta del inmovilizado: 681, 281, 572, 671, 771, 21x | `amortizacion-inmovilizado/calculo.js` | Plan General de Contabilidad, RD 1514/2007 (cuadro de cuentas), de memoria | Coinciden: 681 Amortización del inmovilizado material, 281 Amortización acumulada del inmovilizado material, 671 Pérdidas procedentes del inmovilizado material, 771 Beneficios procedentes del inmovilizado material. Se vende a final de año y no se cuenta el IVA |
| Convenciones de cada herramienta financiera (paso «Convención») | `interes`, `prestamos`, `rentas`, `ahorro`, `bonos`, `van-tir`, `amortizacion-inmovilizado`, `black-scholes`, `tipos-cambio` | leídas del código de cada una | Coinciden con lo que calculan (base 365/360 solo en Interés; tipo equivalente en Rentas y Ahorro; TIN/m en Préstamos; cupón corrido lineal en Bonos) |
| Ejemplos de empalme (índices de precios de dos bases), de Lorenz (dos países) y de punto muerto con varios productos | `numeros-indice`, `lorenz-gini`, `punto-muerto` | inventados para la herramienta | Son datos de ejemplo; resultados calculados a mano en las pruebas |
