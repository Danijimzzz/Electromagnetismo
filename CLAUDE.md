# CLAUDE.md · SimulaCiencia

Web estática de simuladores y calculadoras de ciencias para la carrera, en español, gratis y sin registro. 40 herramientas disponibles en 6 asignaturas (Electromagnetismo, Física general, Química, Matemáticas, Estadística, Circuitos) más Economía con todo «Próximamente». Sin framework ni dependencias: JS puro concatenado por `fuente/build.sh`. Producción: https://simulaciencia.vercel.app/ y https://electromagnetismo.aceropuro30.workers.dev (las dos se despliegan solas desde `main`).

## Mapa

| Ruta | Qué es |
| --- | --- |
| `fuente/build.sh` | Genera todo `publico/`. Una línea `herramienta …` por herramienta. |
| `fuente/catalogo.js` | Asignaturas y herramientas (clave, nombre, icono, `disponible`, desc, palabras de búsqueda). |
| `fuente/portal.js` | Genera portada, páginas de asignatura, novedades y foro desde el catálogo (lo llama build.sh). |
| `fuente/diseno.js` | Pasa cada `pagina.html` y mete cabecera del portal, color de la asignatura, miga y CSS común. |
| `fuente/estilos.css`, `DISENO.md`, `fuente/plantilla/pagina.html` | Hoja común, guía de diseño y plantilla de página. |
| `fuente/biblioteca.js` | Barra lateral «Mis ejercicios», común a todas las herramientas. |
| `fuente/practica.js` | Modo práctica común (datos al azar, corrige respuestas). |
| `fuente/tema.js` | Botón claro/oscuro (`simu-tema`). |
| `fuente/version.js` | Versiones y novedades: `registros.web` y uno por herramienta. |
| `fuente/mates.js` | `Mates`: fórmulas `$…$` → MathML. |
| `fuente/matematicas/` | Común de Matemáticas: `algebra.js` (fracciones, complejos, matrices) y `expresion.js` (expresiones simbólicas). |
| `fuente/quimica/` | Común de Química: elementos, fórmulas, configuración, disoluciones. |
| `fuente/<clave>/` | Una carpeta por herramienta (ver abajo). |
| `fuente/{engine,fmt,physics,presets,canvas,app}.js`, `shell.html`, `guia/` | Simulador de Electrostática: arquitectura propia y más antigua. |
| `privado/tema3-pdf.js` | Ejercicios del PDF de la asignatura. **Nunca van a `publico/`.** |
| `pruebas/comprobar.js` | Toda la comprobación (Node + Playwright). `esperados*.json`: resultados de referencia. |
| `pruebas/capturas.js` | Rehace las capturas de la guía de Electrostática. |
| `publico/` | Lo único que se publica. Generado: no se edita a mano. |
| `vercel.json`, `wrangler.jsonc`, `publico/_redirects` | Vercel y Cloudflare sirven `publico/` tal cual; redirecciones de URLs antiguas. |

## Anatomía de una herramienta

`fuente/<clave>/` con:
- `pagina.html`: `<title>`, `<meta description>`, `<style>` solo con lo propio, `<header class="top">` (diseno.js lo sustituye), `.wrap > h1 + .lead + .layout(.card datos | resultados) + section.teoria`, y `<footer>` que acaba en `<span id="ver"></span>`.
- `fisica.js` o `calculo.js` (sin DOM): `const Nombre = (() => { … return { resolver, ejemplos, … }; })();` y última línea `if (typeof module !== 'undefined') module.exports = Nombre;` (build.sh la quita; comprobar.js la usa con `require`).
- `app.js` (interfaz): IIFE con `$`, estado `sc` guardado en `localStorage[CLAVE]`, `formulario()`, `calcula()`, `dibuja()` en `<canvas>`, `<select id="ejemplos">`, y expone `window.<Nombre>App = { abrirEjemplo, azar, enunciado, resultado, estado }` para práctica y pruebas.

Excepciones: `electrostatica` (shell.html + scripts raíz, su propia biblioteca), `tabla-periodica` (sin estado), `magnetostatica` (fisica + ejemplos + app). La carpeta no siempre coincide con la clave del catálogo: `estadistica/` → `distribuciones`, `circuitos/` → `continua`.

**Crear una nueva**
1. Copiar `fuente/plantilla/pagina.html` a `fuente/<clave>/pagina.html` y seguir `DISENO.md`.
2. Escribir `fisica.js`/`calculo.js` con `ejemplos` y `app.js` siguiendo una herramienta parecida.
3. `catalogo.js`: entrada con `disponible: true` (o pasar a `true` una «Próximamente»).
4. `build.sh`: `herramienta <carpeta> ../publico/<asignatura>/<clave>/index.html "Título" "Descripción" version.js mates.js <carpeta>/fisica.js <carpeta>/app.js`.
5. `biblioteca.js`: añadir `'<carpeta>': '<clave-ls>-v1'` a `CLAVES` (si no, no hay Mis ejercicios ni práctica).
6. `practica.js`: entrada en `CONF` si la página no sigue la estructura estándar o la herramienta genera sus propios ejercicios (`genera: () => window.XApp?.azar()`).
7. `version.js`: registro `'<carpeta>': [{ v: '0.1', … }]` y una entrada en `web` con «Nueva herramienta: …, en <Asignatura>.».
8. `pruebas/comprobar.js`: resultados de los ejemplos calculados a mano y un bloque de navegador.
9. `sh fuente/build.sh` y `node pruebas/comprobar.js`.

## Contratos compartidos

- **`Biblioteca.monta(carpeta)`** y **`Practica.monta(carpeta, clave)`**: build.sh los añade al final de cada página. No hacen nada si la carpeta no está en `Biblioteca.CLAVES`.
- **Estado de la app**: cada app guarda su estado entero en `localStorage[CLAVES[carpeta]]` (string JSON) en cada cambio. Mis ejercicios copia ese string; abrir un ejercicio lo escribe en esa clave y recarga la página.
- **Claves de localStorage**: `<app>-v1` (estado de cada app); `simu-ejercicios:<carpeta>` (`{items:[{id,titulo,carpeta,fijado,datos,actualizado}]}`); `simu-ejercicios-ui` (barra abierta y carpetas cerradas); `simu-tema` (`dark`/`light`); Electrostática: `electro-sim-lib-v2`, `electro-sim-cur-v2`, `electro-sim-ui-v2`.
- **sessionStorage**: `simu-ejercicios-activo:<carpeta>` (ejercicio abierto) y `simu-practica:<carpeta>` (datos de antes de practicar).
- **Evento `simu-guardar`** (en `window`): Mis ejercicios lo lanza justo antes de leer el estado. Una app que guarda con retraso tiene que escucharlo y guardar al momento (hoy solo `magnetostatica/app.js`).
- **`.simu.json`**: `{ formato: 'simulaciencia-ejercicios', version: 1, herramienta: '<carpeta>', guardado: ISO, ejercicios: [{ titulo, carpeta?, fijado?, datos }] }`, con `datos` = el string del estado. Al importar se rechaza si `herramienta` es otra.
- **`.emsim.json`** (solo Electrostática): `{ formato: 'simulador-electrostatica', version: 3, problemas: [{ titulo, enunciado, carpeta?, etiquetas?, escena }] }`.
- **Ejemplos en la barra**: biblioteca.js lee las opciones de los `<select id="ejemplo…">` de la página (con `optgroup`) y oculta el desplegable.
- **Versión en el pie**: `Version.de('<carpeta>').current` en `#ver` (las claves de version.js son las carpetas).

## Convenciones

- Todo en español: código, comentarios, nombres (`calcula`, `dibuja`, `guarda`, `sc`, `sol`, `pasos`) y textos con frases completas.
- Cada fichero empieza con un bloque `/* ===== … ===== */` que dice qué hace y dónde está lo demás.
- Funciones pequeñas en una línea, estilo compacto; sin dependencias ni módulos ES (globales + IIFE).
- Números con coma decimal y `·10<sup>n</sup>`; los campos aceptan `3e8`, `3·10^8` y coma.
- Colores solo con variables CSS y su valor en modo oscuro; las gráficas los leen con `getComputedStyle` y se redibujan con `matchMedia('(prefers-color-scheme: dark)')`.
- Resultados de Electromagnetismo con la forma del solucionario oficial (no solo el valor).

## Probar y publicar

```sh
sh fuente/build.sh                      # regenera publico/ (hay que hacerlo y commitear publico/)
node pruebas/comprobar.js               # todo: ejercicios, publico/ limpio, diseño y navegador (varios minutos)
node pruebas/comprobar.js --sin-navegador   # solo cálculos (rápido)
node pruebas/comprobar.js --actualizar  # reescribe esperados*.json si el cambio de forma es intencionado
sh fuente/build.sh privado SALIDA.html  # versión privada con el Tema 3 (artifact de claude.ai)
```
Playwright: en este contenedor ya está; en otro, `npm install --no-save playwright@1.56.1`. Usa `CHROMIUM` o `/opt/pw-browsers/chromium` si existe. GitHub Actions (`.github/workflows/comprobar.yml`) corre lo mismo y además falla si `publico/` no está al día con `fuente/`. Publicar = fusionar en `main`.

## Flujo de trabajo

- Cada hilo trabaja en su rama `claude/*`, hace commit y push **solo de trabajo terminado y probado**. Los hilos **no abren ni fusionan PR**.
- La tarea programada «PR diario de SimulaCiencia» (04:00, Europe/Madrid) junta todas las ramas `claude/*` sin fusionar en un PR, sube una vez la versión de la web, pasa las pruebas, fusiona si CI está en verde y registra en Notion.
- Versiones beta 0.x (la 1.0 es el lanzamiento). Algo nuevo sube el segundo número (0.48); un arreglo añade el tercero (0.47.1). Herramienta nueva = su registro empieza en 0.1. Las novedades de `version.js` son solo para usuarios (nada de pruebas, CI ni refactorizaciones).
- Notion, base de datos «Versiones»: título «Web 0.X» o «<Herramienta> 0.X», propiedades Herramienta, Tipo (Mayor / Menor / Arreglo), Estado, Fecha, PR y Novedades (aquí sí todo, también lo interno). PENDIENTE: confirmar qué cambio cuenta como «Mayor» frente a «Menor».
- Antes de implementar mejoras o diseños, proponer y esperar el visto bueno de Dani.

## Reglas para Claude

- Leer solo lo necesario: este fichero, la herramienta afectada y, si hace falta, una herramienta parecida. No leer `publico/` (es generado y enorme) ni `comprobar.js` entero: buscar con grep el bloque de la herramienta.
- Para cambios pequeños, editar con reemplazos puntuales; no reescribir ficheros enteros.
- Antes de escribir un ayudante (`esc`, formato de números, lectura de campos, lienzo, flechas, ejes), buscar si ya existe en un fichero común y reutilizarlo; no copiarlo de otra herramienta.
- Tras tocar `fuente/`, `sh fuente/build.sh` y commitear también `publico/`.
- No publicar nada de `privado/` ni del PDF de la asignatura.
