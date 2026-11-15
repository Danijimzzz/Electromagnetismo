# Constantes que usa cada herramienta (TRV.10.11 · Fase 14)

Sacado de `fuente/*/` buscando los valores escritos (sin contar `app.js`, fenómenos ni textos de preguntas). Sirve para ver las diferencias **dentro de un mismo tema**. Cada herramienta mantiene el valor que usa su solucionario o su tema: esto solo lo deja a la vista.

| Constante | Herramientas | Valor escrito | Comentario |
| --- | --- | --- | --- |
| c | antena, cavidades, doppler, guías de onda, líneas de transmisión, maxwell, ondas EM, unidades | 299 792 458 m/s (con `3e8` como opción «de clase» en varias) | Coherente. Las que llevan `3e8` lo ofrecen como ajuste de clase. |
| c | choques, equilibrio, física moderna, fresnel, óptica, laplace-numerica, transformada-z, solubilidad | `3e8` | Aparece en rutas de ejemplos o de clase; no cambia resultados de los ejercicios del Tema 3. |
| c | fuerza | 299 792 458 y `3e5` (km/s) | Dos unidades, mismo valor. |
| ε₀ | condensadores, ondas EM, maxwell, laplace-numerica | 8,8541878128·10⁻¹² (CODATA 2018) | Igual. |
| ε₀ | imágenes | 8,8541878128·10⁻¹² (corregido en la 1.16, antes CODATA 2010) | Igualado con el resto. |
| ε₀ | unidades | CODATA 2022 por defecto y 2018 como opción (F13) | Es lo previsto. |
| μ₀ | cavidades, faraday, inducción, fuerza | 4π·10⁻⁷ | Igual a la exacta antigua. |
| μ₀ | ondas EM, maxwell | 1,25663706212·10⁻⁶ (CODATA 2018) | Difiere de 4π·10⁻⁷ en la 10.ª cifra; sin efecto visible. |
| g | **tiro parabólico** | **9,81** | Resto de Física: 9,8. |
| g | dinámica, fluidos, oscilaciones, sólido rígido, trabajo y energía | 9,8 | Valor de clase. |
| g | faraday | 9,8 y 9,80665 | Dos valores en una herramienta (raíles inclinados con g y el resto). |
| g | errores, unidades | 9,80665 | Valor estándar. |

## Pendiente de Dani

1. ¿Qué g y qué ε₀/k usa el solucionario del Tema 3? (Electromagnetismo sigue su solucionario.) Hay que mirarlo con los apuntes delante.
2. Signo del flujo de Poynting en el condensador contra los apuntes: **no se puede comprobar sin ellos** (TRV.10.11 depende de Dani).
3. Si se quiere un solo g en Física general, es FIS.FG-1 (junto con F15.4); aquí solo se deja la tabla.
