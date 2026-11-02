# Guía de diseño de las herramientas

Todas las herramientas de SimulaCiencia comparten el mismo aspecto. Esta guía dice cómo se consigue y qué tiene que seguir una herramienta nueva para encajar sin hacer nada más.

## Cómo se monta una página

Cada herramienta es una carpeta `fuente/<clave>/` con su `pagina.html` (HTML y un `<style>` con lo propio) y sus scripts. Al publicar, `fuente/build.sh` pasa la página por `fuente/diseno.js`, que añade:

- **La hoja común** `fuente/estilos.css`: colores claro y oscuro, letras y todos los componentes de esta guía. Va antes del `<style>` de la página.
- **El color de la asignatura** (`--accent` y `--accent-soft`), sacado de `fuente/catalogo.js`.
- **La cabecera del portal** (logo, asignaturas, Foro, buscador y botón de modo oscuro) en lugar del `<header class="top">` de la página.
- **La miga** encima del `<h1>`, con «Mis ejercicios» a la izquierda y «Modo práctica» a la derecha.

Después `biblioteca.js` monta la barra lateral de Mis ejercicios (con los ejemplos del `<select id="ejemplos…">`) y `practica.js` el modo práctica.

## Empezar una herramienta nueva

1. Copia `fuente/plantilla/pagina.html` a `fuente/<clave>/pagina.html` y rellena lo que va entre corchetes.
2. Añade la herramienta a `catalogo.js` (asignatura, clave, nombre, icono, descripción y palabras de búsqueda) y una línea `herramienta …` en `build.sh`.
3. Escribe solo el CSS que sea de esta herramienta. Si lo que necesitas está en esta guía, usa la clase común tal cual.
4. Pasa `node pruebas/comprobar.js`. Falla si la página vuelve a definir una regla común o pone un color fijo.

## Colores

Nunca se escribe un color fijo en una regla. Los colores salen de variables:

| Variable | Para qué |
| --- | --- |
| `--bg` | fondo de la página y de las gráficas |
| `--panel` | fondo de las tarjetas y los campos |
| `--ink` | texto |
| `--muted` | texto secundario, etiquetas, notas |
| `--line` | bordes |
| `--accent`, `--accent-soft` | color de la asignatura y su versión suave (fondo de los resultados) |
| `--error` | mensajes de error y campos mal escritos |

Los colores propios de una herramienta (las series de una gráfica, las cargas, los cuerpos…) se declaran en su `:root`, **con su valor en modo oscuro** en los dos bloques de la plantilla (`@media (prefers-color-scheme: dark)` y `:root[data-theme="dark"]`). Una herramienta no redefine las variables comunes.

Las gráficas en `<canvas>` leen los colores con `getComputedStyle(document.documentElement).getPropertyValue('--ink')` y se vuelven a dibujar con `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)`. El botón de modo oscuro avisa a esos mismos oyentes, así que no hace falta nada más.

## Letras

- `--f-ui` (IBM Plex Sans): la interfaz.
- `--f-math` (STIX Two): fórmulas, resultados y desarrollo.
- `--f-mono` (IBM Plex Mono): lecturas numéricas que cambian (animaciones).

Fórmulas: en matemáticas, química y física se escriben con `$…$` y la clase `m` (Mates las pasa a MathML); en electromagnetismo, con HTML y `<sup>`/`<sub>`.

## Estructura de la página (diseño A)

```html
<div class="wrap">
<h1>Título</h1>
<p class="lead">Qué hace, en una o dos frases.</p>
<div class="layout">
  <div class="card">…datos…</div>
  <div>…resultados, gráfica y desarrollo…</div>
</div>
<section class="teoria">…</section>
</div>
```

`.layout` pone los datos a la izquierda (`--col-datos`, 360 px) y los resultados a la derecha; por debajo de 900 px va en una sola columna. `.layout.invertido` pone los datos a la derecha.

## Componentes

| Clase | Qué es |
| --- | --- |
| `.card` + `<h2>` | Tarjeta. El `h2` es una etiqueta corta en mayúsculas pequeñas. |
| `.card.destacado` | La tarjeta de resultados: borde superior del color de la asignatura. |
| `.campos` | Rejilla de datos: etiqueta a la izquierda, campo a la derecha (`--ancho-valor`). Dentro, `<small>` para la unidad y `.ancho` para algo que ocupa las dos columnas. |
| `.sep` | Separador con título dentro de `.campos`. |
| `.in` | Campo de texto o desplegable. |
| `.btn` | Botón. |
| `.modos` | Pestañas para cambiar de modo: botones con `aria-selected="true"` en el activo. |
| `.controles` | Fila de botones y deslizadores bajo una gráfica. |
| `.tools` | Barra de herramientas encima de un editor. |
| `.nota`, `.error` | Texto de ayuda y mensaje de error (el error con `hidden` mientras no lo hay). |
| `.resumen` | Resultados principales, cada uno en un `<div><span>Etiqueta</span><b>valor</b></div>` sobre fondo suave. `div.ancho` ocupa toda la fila. |
| `.res` | Resultados secundarios en rejilla, con la etiqueta en `<span>`. |
| `canvas` | Gráfica: ancho completo, alto `--alto-grafica`. |
| `.leyenda` | Leyenda bajo una gráfica, con `<b>` para lo que se nombra. |
| `.pasos` | Tarjeta del desarrollo: `<ol>` con un `<li>` por paso y su título en `<strong>`. Dentro, `table.tabla` para tablas de valores. |
| `.mat` | Matriz entre corchetes dentro de una fórmula. |
| `.tabla-scroll` | Envoltorio de una tabla ancha que se desplaza en el móvil. |
| `.teoria` | La teoría al final: `h2` por apartado, `.f` para una fórmula destacada en caja. |

## Ajustar sin romper el diseño común

Una herramienta **no vuelve a escribir** una regla de `estilos.css` (por ejemplo `.card { … }` o `.res { … }`). Para cambiar una medida usa sus variables en el `:root` de la página:

| Variable | Valor común | Qué cambia |
| --- | --- | --- |
| `--col-datos` | `360px` | ancho de la columna de datos |
| `--ancho-etiqueta` | `minmax(0, 1fr)` | columna de las etiquetas en `.campos` |
| `--ancho-valor` | `150px` | columna de los campos en `.campos` |
| `--ancho-dato` | `190px` | ancho mínimo de cada resultado en `.resumen` y `.res` |
| `--alto-grafica` | `clamp(260px, 36vw, 380px)` | alto de las gráficas |
| `--margen-grafica` | `10px` | espacio encima de cada gráfica |
| `--letra-campo` | `13px var(--f-ui)` | letra de los campos `.in` |

Si un elemento necesita algo distinto, se le da un id o una clase propia (`#resumen b { … }`, `.fila .in { … }`), nunca se cambia la clase común para toda la página.

## Liquid Glass

El aspecto es de cristal translúcido. Las variables (`--vidrio`, `--vidrio-fuerte`, `--vidrio-borde`, `--vidrio-brillo`, `--vidrio-sombra`, `--blur` y los halos `--halo1…3` del fondo) están en `estilos.css` con su valor oscuro. Una herramienta no las redefine.

- `.card`, `.modos`, `.in`, `.btn` y la cabecera ya son de vidrio: no hace falta nada.
- **El vidrio va en el marco, nunca en el lienzo ni bajo texto largo**: `canvas` y las fórmulas siguen sobre `--bg` y `--panel`.
- `backdrop-filter` solo en cabecera, barras laterales y tarjetas principales; en pantallas estrechas el desenfoque baja a 12 px.
- Con `prefers-reduced-transparency` o `prefers-contrast: more` todo vuelve a fondos sólidos (`--panel`). Una superficie nueva de vidrio tiene que añadirse a esa regla.

## Reglas

- Sin colores fijos fuera de las variables de `:root`, y cada color propio con su valor en modo oscuro.
- Sin redefinir reglas ni variables comunes (`--bg`, `--accent`, `--f-ui`…).
- Textos en español, frases completas, sin abreviaturas raras.
- Que se vea bien a 390 px de ancho: nada de anchos fijos mayores que la pantalla; las tablas anchas van en `.tabla-scroll`.
- Todo lo que se pulsa se puede usar con el teclado: el foco ya se ve con el color de la asignatura.
- Los campos llevan `<label for>` o `aria-label`, y las gráficas, `aria-label`.
- El pie de página termina en `<span id="ver"></span>` para la versión de la herramienta (`Version.de('<clave>')`).
- Accesibilidad comprobada con axe-core (`node pruebas/accesibilidad.js`, también dentro de `comprobar.js`) en claro, oscuro y 390 px: el contenido va dentro de `<main class="wrap">` (lo hace diseno.js), el texto necesita contraste 4,5:1 (por eso `--muted` y el color de la asignatura no se aclaran a la ligera), las cabeceras de tabla no van vacías (`<span class="solo-lector">` si solo hay un icono) y los roles ARIA llevan sus hijos (un `role="tablist"` solo con `role="tab"`).
