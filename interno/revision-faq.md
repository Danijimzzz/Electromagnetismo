# Revisión de las cifras de las preguntas frecuentes (TRV.10.7 · Fase 14, 2026-11-15)

Se recalcularon **todas** las cuentas con números de las respuestas de `fuente/preguntas/*.js` (≈ 190 respuestas con ejemplo resuelto en las siete asignaturas): a mano o con Python (`scipy`) las que llevan tablas o distribuciones (t, F, χ², Mann-Whitney exacto, binomial, préstamo, bono, Markowitz, Solow). **Resultado: ningún número mal.** Casos que se miraron con más cuidado y salen bien: λ_g = 3,97 cm en la guía, f₀ = 5,299 GHz del cubo TE101 y 4,590 GHz con Q_c ≈ 15 800 de la cavidad cilíndrica, R = 5,7 mm del electrón, VAN = 41,32 y TIR = 13,07 %, cuota de 860,66 €, p exacto 4/462 de Mann-Whitney, F₂,₁₂;0,95 = 3,885, bono de 1 027,75 €, riesgo mínimo de Markowitz 9,79 %.

**Parte automática:** `node pruebas/faq-cifras.js` evalúa por código las cuentas que se pueden leer sola (hoy 22: «a · b / c ≈ resultado», con la precisión con la que está escrito el resultado) y falla si alguna no cuadra. El resto no se puede evaluar sin conocer el significado de cada símbolo, así que su control es esta revisión; `--lista` muestra las que quedan sin evaluar.

**Si se cambia una respuesta con cifras:** volver a hacer la cuenta y, si es una cuenta suelta, escribirla como «a · b / c ≈ resultado» para que la pruebe el código.
