# Simulador de Electrostática

Simulador de electrostática (Electromagnetismo y Ondas). Es una página estática: `publico/index.html`.

- Código fuente: `fuente/` (engine, fmt, physics, presets, canvas, app y shell.html). Las capturas de la guía de uso están en `fuente/guia/` y `build.sh` las incrusta en la página.
- Para regenerar `publico/index.html` tras cambiar las fuentes: `sh fuente/build.sh`.
- **Solo se publica la carpeta `publico/`** (página, iconos y lo que se añada para la web). Vercel la sirve tal cual por `vercel.json`; en Cloudflare Pages el proyecto se configura con *Framework: None*, sin comando de compilación y *Output directory* `publico`. No pongas ahí nada más: la comprobación falla si aparece otro archivo.
- Icono: `fuente/icono.svg` (se incrusta en la pestaña). `publico/apple-touch-icon.png` (180×180) y `publico/og.png` (1200×630, vista previa al compartir); si cambias el icono, vuelve a generarlas a partir del SVG.

## Ejercicios: web pública y versión privada

- `fuente/presets.js`: los 12 ejercicios de ejemplo de la web pública, con enunciados propios.
- `privado/tema3-pdf.js`: los 12 ejercicios del Tema 3 del PDF de la asignatura. **No se publican**: solo entran en la versión privada del artifact de claude.ai, que se genera con `sh fuente/build.sh privado SALIDA.html` (sin `<!doctype>`, el artifact añade el esqueleto).
- Capturas de la guía: `node pruebas/capturas.js` las rehace a partir de la web pública (todas menos `editar.webp`).

Los problemas guardados viven en el almacenamiento local de cada navegador. Para pasarlos de un dispositivo a otro, expórtalos como `.emsim.json` e impórtalos en el otro.

## Versión

El número de versión y las novedades están en `fuente/version.js`; la página los muestra en la barra lateral y en la guía. Súbelo con cada cambio publicado: el primer número si hay algo nuevo (7.0) y el segundo si es solo un arreglo (6.1).

## Comprobación antes de fusionar

`node pruebas/comprobar.js` regenera la web pública y la privada, y resuelve los dos juegos de ejercicios: los del Tema 3 contra `pruebas/esperados.json` (la forma del solucionario, no solo el valor) y los de ejemplo contra `pruebas/esperados-ejemplos.json`. También comprueba que `publico/` no contiene nada del PDF. Después abre las dos páginas en Chromium, abre cada ejercicio y la guía, y falla si hay errores en la consola. Necesita `playwright` (`npm install --no-save playwright`). La misma comprobación corre en GitHub Actions en cada pull request.

Si un cambio de forma es intencionado, ejecuta `node pruebas/comprobar.js --actualizar` y revisa el diff de los esperados.
