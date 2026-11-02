# CLAUDE.md · Ciencify

Web estática de simuladores y calculadoras de ciencias para la carrera, en español, gratis y sin registro. <!--n-->104 herramientas disponibles en 7 asignaturas<!--/n--> (Electromagnetismo, Física general, Química, Matemáticas, Estadística, Circuitos y Economía), más las que salen como «Próximamente». Sin framework ni dependencias: JS puro concatenado por `fuente/build.sh`. Producción: https://simulaciencia.vercel.app/ y https://electromagnetismo.aceropuro30.workers.dev (las dos se despliegan solas desde `main`).

## Mapa

| Ruta | Qué es |
| --- | --- |
| `fuente/build.sh` | Genera todo `publico/`: Electrostática, y llama a `portal.js` y a `herramientas.js`. |
| `fuente/herramientas.js` | Genera la página de cada herramienta con los datos del catálogo. |
| `fuente/catalogo.js` | Asignaturas y herramientas: clave, nombre, icono, `disponible`, desc, búsqueda y, para generar la página, `scripts`, `titulo`, `descripcion`, `carpeta` y `guarda` (ver cabecera de herramientas.js). **Único sitio donde se da de alta una herramienta.** |
| `fuente/portal.js` | Calcula del catálogo las cifras de README.md y de la primera frase de este fichero (entre marcas `<!-- … -->`: no editarlas a mano). Genera portada, páginas de asignatura, novedades y foro desde el catálogo (lo llama build.sh), copia las páginas legales y escribe `ads.txt`, `sitemap.xml`, `robots.txt` y la etiqueta canonical de sus páginas (la dirección principal es `web` en catalogo.js). |
| `fuente/legal/` | Aviso legal, privacidad, cookies, contacto y `legal.css`. Las líneas `data-sin-anuncios` / `data-con-anuncios` salen o no según `anuncios.js`. |
| `fuente/anuncios.js` | Google AdSense: apagado mientras `cliente` esté vacío. Con el ID: código y verificación en la cabeza, un hueco por página (debajo de los resultados, nunca en el lienzo), «Preferencias de cookies» en el pie y `ads.txt`. Las pruebas cortan las peticiones a Google (`pruebas/sin-anuncios.js`). |
| `fuente/diseno.js` | Pasa cada `pagina.html` y mete cabecera del portal, color de la asignatura, miga, CSS común y, al final, «Herramientas relacionadas» (o «Más fenómenos»). |
| `fuente/seo.js` | Datos estructurados (JSON-LD: aplicación educativa o recurso explicativo + miga) en la cabeza de cada herramienta y fenómeno. El `<title>` de cada `pagina.html` empieza por lo que se busca («Calculadora de…», «Simulador de…») y cabe en ~60 letras; la verificación de Search Console va en `catalogo.js` (`google`). |
| `fuente/electrostatica-teoria.html` | Texto de Electrostática debajo del lienzo (solo en la web). |
| `fuente/estilos.css`, `DISENO.md` | Hoja común y guía de diseño. |
| `fuente/plantilla/` | Plantilla de herramienta: `pagina.html`, `calculo.js`, `app.js` y `prueba.js` (funcionan tal cual). |
| `fuente/nueva.js` | `node fuente/nueva.js <asignatura> <clave> "<Nombre>"`: copia la plantilla y la da de alta en catalogo.js y version.js. |
| `fuente/herramienta.js` | `Herramienta`: ayudantes comunes de las app.js (`$`, `esc`, `copia`, `vacio`, `leeSI`, `txt`, `marcas`, `lienzo`). Va en cada página tras version.js. |
| `fuente/calculadora.js` | `Calculadora`: formato, lectura de campos, gráfica e interfaz entera (`monta`) de las herramientas sencillas (datos → resultados, gráfica, tabla y desarrollo): toda Economía, Estadística descriptiva, Física moderna, Métodos numéricos… Su prueba común está en `pruebas/herramientas/comun/calculadora.js`. |
| `fuente/economia/comun.js` | Común de Economía (`Eco`: dinero y porcentajes); va en `scripts` tras calculadora.js. |
| `fuente/biblioteca.js` | Barra lateral «Mis ejercicios», común a todas las herramientas. |
| `fuente/practica.js` | Modo práctica común (datos al azar, corrige respuestas). |
| `fuente/buscador.js` | Buscador global (`/` o Ctrl+K en cualquier página): `portal.js` escribe `publico/buscador.js` (índice sacado de `catalogo.js` + código + CSS) y `portal.js`/`diseno.js` enganchan su `<script defer>`. En la portada enfoca `#buscar`; en Electrostática Ctrl+K sigue siendo de sus problemas. Las herramientas y fenómenos nuevos entran solos. |
| `fuente/pwa.js` | Web instalable y sin conexión: `portal.js` escribe `manifest.webmanifest`, `sw.js` (service worker: páginas «primero la red», copia sin conexión, `offline.html`, «Guardar todo» en la portada y rehacerlo solo en cada versión), `pwa.js` (registro, aviso «Hay una versión nueva» y botones) y `_headers`; iconos de `fuente/pwa/` (`node fuente/pwa/iconos.js` los rehace desde `icono.svg`). Prueba: `pruebas/pwa.js` (servidor local). |
| `fuente/tema.js` | Botón claro/oscuro (`simu-tema`). |
| `fuente/version.js` | Versiones y novedades: `registros.web` y uno por herramienta. |
| `fuente/mates.js` | `Mates`: fórmulas `$…$` → MathML. |
| `fuente/compartir.js` | Copiar enlace, texto o LaTeX e imprimir o PDF la solución (Matemáticas y Electromagnetismo); va en `scripts` antes del app.js. |
| `fuente/matematicas/` | Común de Matemáticas: `algebra.js` (fracciones, complejos, matrices) y `expresion.js` (expresiones simbólicas). |
| `fuente/quimica/` | Común de Química: elementos, fórmulas, configuración, disoluciones. |
| `fuente/esquema.js` y `fuente/simulador/` | Simulador de circuitos (`/circuitos/simulador/`, sustituye a las antiguas Continua, Alterna y Transitorios): `esquema.js` es el editor SVG compartido (arrastrar, cablear, girar, deshacer); `componentes.js` (47 componentes y su paleta), `extraer.js` (esquema → circuito), `motor.js` (análisis nodal modificado: continua, fasores, Bode, trifásica y transitorio), `ejemplos.js`, `importar.js` (trae lo guardado con las antiguas) y `continua.js` / `alterna.js` (el desarrollo paso a paso). Las redirecciones de las URLs antiguas están en `catalogo.js` (`redirecciones`). |
| `fuente/<clave>/` | Una carpeta por herramienta (ver abajo). |
| `fuente/fenomenos/` | «Física en la vida real»: `animacion.js` (motor: avanza sola, parar, adelante y atrás, línea de tiempo, dato destacado, «Pruébalo tú» y sonido opcional), `dibujo.js` (ayudantes de dibujo con cámara: rótulos, signos, flechas, chispas), `estilos.css` y una carpeta por fenómeno (`pagina.html` con etiquetas, «Un poco de historia» y el recuadro de la herramienta + `escena.js` con los pasos, el dibujo y los datos para abrir la herramienta relacionada + `imagen.webp`, la imagen de su tarjeta en `/fenomenos/`). **Todo fenómeno disponible lleva imagen, no letra**: se elige el paso con `imagen: N` en `catalogo.js` y se genera con `node pruebas/imagenes-fenomenos.js [clave]` (paso N sin rótulos, 640 × 360); comprobar.js falla si falta. Se dan de alta en `catalogo.js` (`fenomenos.lista`); `portal.js` hace el índice `/fenomenos/` y el bloque «En la vida real» de cada asignatura, y `diseno.js` el de cada herramienta. Sin Mis ejercicios ni práctica; versión común `fenomenos` en version.js. Seguimiento en la base de Notion «Fenómenos (Física en la vida real)». |
| `fuente/{engine,fmt,physics,presets,canvas,app}.js`, `shell.html`, `guia/` | Simulador de Electrostática: arquitectura propia y más antigua. |
| `interno/linea-tiempo/` | Línea del tiempo interna (hecho, planeado y futuro, con detalle al pulsar). **Fuera de `publico/`: no se despliega, no sale en el sitemap, ninguna página la enlaza y lleva `noindex`.** `node interno/linea-tiempo/generar.js` escribe `index.html` (se abre a mano en el navegador) con lo hecho de `version.js`, lo pendiente de `catalogo.js` y lo planeado/futuro de `planes.js` (se edita a mano). `plantilla.html` es el diseño. Rehacerla y commitear `index.html` al subir versión. |
| `privado/tema3-pdf.js` | Ejercicios del PDF de la asignatura. **Nunca van a `publico/`.** |
| `pruebas/comprobar.js` | Comprobación común (build, publico/ limpio, diseño, Electrostática, portal, Mis ejercicios, práctica) y bucle de herramientas. `esperados*.json`: resultados de referencia. |
| `pruebas/herramientas/<carpeta>.js` (y `fenomenos/<clave>.js`, con lo común en `fenomenos/comun.js`) | Lo de cada herramienta: cálculos a mano en Node y su página en Chromium. |
| `pruebas/accesibilidad.js` | axe-core (WCAG 2 A/AA y buenas prácticas) en todas las páginas de `publico/` en claro, oscuro y 390 px; falla con cualquier infracción (`EXCEPCIONES` vacío). `AX_DETALLE=ruta.json` guarda el detalle. En CI se instala con `npm install --no-save axe-core@4.10.2`. |
| `fuente/accesibilidad.js` | Script en línea de cada herramienta: pone `tabindex="0"` a las regiones que se desbordan (fórmulas y tablas anchas) para llegar con teclado. |
| `pruebas/humo.js` | Prueba de humo igual para todas: cambiar un dato, guardarlo, recargar y verlo; modo oscuro y 390 px. |
| `pruebas/capturas.js` | Rehace las capturas de la guía de Electrostática. |
| `publico/` | Lo único que se publica. Generado: no se edita a mano. |
| `vercel.json`, `wrangler.jsonc`, `publico/_redirects` | Vercel y Cloudflare sirven `publico/` tal cual; redirecciones de URLs antiguas. |

## Anatomía de una herramienta

`fuente/<clave>/` con:
- `pagina.html`: `<title>`, `<meta description>`, `<style>` solo con lo propio, `<header class="top">` (diseno.js lo sustituye), `.wrap > h1 + .lead + .layout(.card datos | resultados) + section.teoria`, y `<footer>` que acaba en `<span id="ver"></span>`.
- `fisica.js` o `calculo.js` (sin DOM): `const Nombre = (() => { … return { resolver, ejemplos, … }; })();` y última línea `if (typeof module !== 'undefined') module.exports = Nombre;` (build.sh la quita; comprobar.js la usa con `require`).
- `app.js` (interfaz): IIFE con `const { $, esc, copia, … } = Herramienta;`, estado `sc` guardado en `localStorage[CLAVE]`, `formulario()`, `calcula()`, `dibuja()` en `<canvas>`, `<select id="ejemplos">`, y expone `window.<Nombre>App = { abrirEjemplo, azar, enunciado, resultado, estado }` para práctica y pruebas.

Excepciones: `electrostatica` (shell.html + scripts raíz, su propia biblioteca), `tabla-periodica` (sin estado), `magnetostatica` (fisica + ejemplos + app). La carpeta no siempre coincide con la clave del catálogo: `estadistica/` → `distribuciones`.

**Crear una nueva**
1. `node fuente/nueva.js <asignatura> <clave> "<Nombre>"`: crea `fuente/<clave>/` y `pruebas/herramientas/<clave>.js` desde `fuente/plantilla/` (un ejemplo que ya funciona y pasa las pruebas), y da de alta la herramienta en `catalogo.js` (o completa su «Próximamente») y en `version.js` (0.1).
2. Cambiar el ejemplo por lo de verdad: `calculo.js` con `resolver` y `ejemplos`, `app.js`, `pagina.html` siguiendo `DISENO.md`, y en la prueba los resultados de los ejemplos calculados a mano.
3. `catalogo.js`: revisar `desc`, `buscar`, `icono`, `titulo` y `descripcion`. Si la carpeta no es la clave, `carpeta: '…'`; si el estado no va en `localStorage['<carpeta>-v1']`, `guarda: '…'`.
4. `practica.js`: entrada en `CONF` si la página no sigue la estructura estándar o la herramienta genera sus propios ejercicios (`genera: () => window.XApp?.azar()`).
5. `version.js`: las novedades de la 0.1 y una entrada en `web` con «Nueva herramienta: …, en <Asignatura>.».
6. `sh fuente/build.sh && node pruebas/comprobar.js --solo <clave>` mientras se trabaja y `node pruebas/comprobar.js` entero al final.

## Contratos compartidos

- **`Biblioteca.monta(carpeta, clave)`** y **`Practica.monta(carpeta, clave)`**: herramientas.js los añade al final de cada página con la clave de `guarda`. Con `null` no hacen nada.
- **Estado de la app**: cada app guarda su estado entero en `localStorage[guarda]` (string JSON) en cada cambio. Mis ejercicios copia ese string; abrir un ejercicio lo escribe en esa clave y recarga la página.
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
- Números con coma decimal y `·10<sup>n</sup>`; los campos aceptan `3e8`, `3·10^8` y coma; con `Herramienta.leeSI` también prefijos y unidades (`4k7`, `100n`, `10 µF`), como en el Simulador de circuitos.
- Colores solo con variables CSS y su valor en modo oscuro; las gráficas los leen con `getComputedStyle` y se redibujan con `matchMedia('(prefers-color-scheme: dark)')`.
- Resultados de Electromagnetismo con la forma del solucionario oficial (no solo el valor).

## Probar y publicar

```sh
sh fuente/build.sh                      # regenera publico/ (hay que hacerlo y commitear publico/)
node pruebas/comprobar.js               # todo: ejercicios, publico/ limpio, diseño y navegador (varios minutos)
node pruebas/comprobar.js --solo CARPETA  # solo una herramienta (unos 15 s); --solo electrostatica para el simulador
node pruebas/comprobar.js --sin-navegador   # solo cálculos (rápido)
node pruebas/comprobar.js --parte 2/4   # solo el trozo 2 de 4 de las herramientas (CI corre los 4 a la vez; lo común va en el 1)
node pruebas/humo.js [--solo CARPETA]  # solo la prueba de humo (necesita publico/ compilado)
node pruebas/accesibilidad.js [--solo CARPETA] [--vista claro|oscuro|movil]  # solo axe-core (necesita publico/ y axe-core)
node pruebas/comprobar.js --actualizar  # reescribe esperados*.json si el cambio de forma es intencionado
sh fuente/build.sh privado SALIDA.html  # versión privada con el Tema 3 (artifact de claude.ai)
```
Playwright: en este contenedor ya está; en otro, `npm install --no-save playwright@1.56.1`. Usa `CHROMIUM` o `/opt/pw-browsers/chromium` si existe. GitHub Actions (`.github/workflows/comprobar.yml`) corre lo mismo en 4 trozos paralelos (`--parte N/4`) y además falla si `publico/` no está al día con `fuente/`. Publicar = fusionar en `main`.

## Flujo de trabajo

- Cada hilo trabaja en su rama `claude/*`, hace commit y push **solo de trabajo terminado y probado**. Los hilos **no abren ni fusionan PR**.
- La tarea programada «PR diario de SimulaCiencia» (04:00, Europe/Madrid) junta todas las ramas `claude/*` sin fusionar en un PR, sube una vez la versión de la web, pasa las pruebas, fusiona si CI está en verde y registra en Notion.
- La web se lanzó en la 1.0 (sus novedades de la beta, 0.1 a 0.57, quedan juntas en esa tarjeta y el detalle en Notion); las herramientas siguen en 0.x hasta darse por terminadas. Algo nuevo sube el segundo número (1.1); un arreglo añade el tercero (1.0.1). Herramienta nueva = su registro empieza en 0.1. Las novedades de `version.js` son solo para usuarios (nada de pruebas, CI ni refactorizaciones). Cada versión nueva de la web se escribe visual: `titulo`, `subtitulo` y `secciones` (`{ icono, titulo, puntos }`, con `**negrita**`, `@asignatura` para sus herramientas y `#asignatura/herramienta` para una tarjeta con enlace a una herramienta nueva: **toda herramienta nueva lleva su tarjeta en las novedades**), como la 1.0.
- Notion, base de datos «Versiones»: título «Web 0.X» o «<Herramienta> 0.X», propiedades Herramienta, Tipo (Mayor / Menor / Arreglo), Estado, Fecha, PR y Novedades (aquí sí todo, también lo interno). PENDIENTE: confirmar qué cambio cuenta como «Mayor» frente a «Menor».
- Antes de implementar mejoras o diseños, proponer y esperar el visto bueno de Dani.

## Reglas para Claude

- Leer solo lo necesario: este fichero, la herramienta afectada y, si hace falta, una herramienta parecida. No leer `publico/` (es generado y enorme) ni `pruebas/` entero: la prueba de una herramienta está en `pruebas/herramientas/<carpeta>.js`.
- Para cambios pequeños, editar con reemplazos puntuales; no reescribir ficheros enteros.
- Antes de escribir un ayudante, mirar `fuente/herramienta.js` (y `mates.js`, `matematicas/`, `quimica/`) y reutilizarlo; no copiarlo de otra herramienta. El formato de números `f()` y la lectura de campos `lee()` siguen siendo de cada herramienta (cambian las cifras que se muestran), igual que las constantes físicas (cada una usa el valor del solucionario de su tema).
- Tras tocar `fuente/`, `sh fuente/build.sh` y commitear también `publico/`.
- No publicar nada de `privado/` ni del PDF de la asignatura.
