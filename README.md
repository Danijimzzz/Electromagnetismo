# Simulador de Electrostática

Simulador del Tema 3 (Electromagnetismo y Ondas). Es una página estática: `index.html`.

- Código fuente: `fuente/` (engine, fmt, physics, presets, canvas, app y shell.html). Las capturas de la guía de uso están en `fuente/guia/` y `build.sh` las incrusta en la página.
- Para regenerar `index.html` tras cambiar las fuentes: `sh fuente/build.sh`.
- Vercel sirve `index.html` tal cual, sin paso de compilación.
- Icono: `fuente/icono.svg` (se incrusta en la pestaña). `apple-touch-icon.png` (180×180) y `og.png` (1200×630, vista previa al compartir) están en la raíz; si cambias el icono, vuelve a generarlas a partir del SVG.

Los problemas guardados viven en el almacenamiento local de cada navegador. Para pasarlos de un dispositivo a otro, expórtalos como `.emsim.json` e impórtalos en el otro.

## Versión

El número de versión y las novedades están en `fuente/version.js`; la página los muestra en la barra lateral y en la guía. Súbelo con cada cambio publicado: el primer número si hay algo nuevo (7.0) y el segundo si es solo un arreglo (6.1).

## Comprobación antes de fusionar

`node pruebas/comprobar.js` regenera `index.html`, resuelve los 12 ejercicios y compara cada resultado con `pruebas/esperados.json` (la forma del solucionario, no solo el valor). Después abre la página en Chromium, abre cada ejercicio y la guía, y falla si hay errores en la consola. Necesita `playwright` (`npm install --no-save playwright`). La misma comprobación corre en GitHub Actions en cada pull request.

Si un cambio de forma es intencionado, ejecuta `node pruebas/comprobar.js --actualizar` y revisa el diff de `esperados.json`.
