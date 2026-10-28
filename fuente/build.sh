#!/bin/sh
# Concatena las fuentes en una sola página. Las capturas de guia/*.webp se incrustan en base64.
#   sh fuente/build.sh                 → la web pública (Vercel y Cloudflare): el simulador en
#                                        ../publico/electromagnetismo/electrostatica/index.html, con los ejercicios
#                                        de ejemplo de presets.js, y la portada y las páginas de asignatura que
#                                        portal.js genera a partir de catalogo.js.
#   sh fuente/build.sh privado SALIDA  → SALIDA, la versión privada del artifact de claude.ai: sin <!doctype>
#                                        (el artifact añade el esqueleto) y con los ejercicios del Tema 3
#                                        de ../privado/tema3-pdf.js, que nunca se publican.
cd "$(dirname "$0")"
if [ "$1" = privado ]; then presets=../privado/tema3-pdf.js; out=${2:?falta el archivo de salida}; else presets=presets.js; out=../publico/electromagnetismo/electrostatica/index.html; node portal.js || exit 1; mkdir -p "$(dirname "$out")"; fi
{
  if [ "$1" != privado ]; then
    printf '<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    # Icono de la pestaña (fuente/icono.svg, incrustado) y lo que se ve al instalar o compartir el enlace.
    printf '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,'; base64 < icono.svg | tr -d '\n'; printf '">\n'
    printf '<link rel="apple-touch-icon" href="../../apple-touch-icon.png">\n'
    printf '<meta property="og:title" content="Simulador de Electrostática">\n<meta property="og:description" content="Campo, potencial y energía de cargas, hilos, planos y esferas, con el desarrollo paso a paso">\n'
    web=$(node -p "require('./catalogo.js').web")
    printf '<link rel="canonical" href="%s/electromagnetismo/electrostatica/">\n' "$web"
    printf '<meta property="og:image" content="%s/og.png">\n<meta name="twitter:card" content="summary_large_image">\n' "$web"
    # lo que sale en Google bajo el título y los datos estructurados (seo.js)
    desc='Simulador de electrostática en español: campo eléctrico, potencial, fuerza y energía de cargas puntuales, hilos, planos, esferas y dipolos, con líneas de campo, vista 3D y el desarrollo paso a paso como en el solucionario.'
    printf '<meta name="description" content="%s">\n' "$desc"
    node seo.js electromagnetismo electrostatica "$desc"
  fi
  # Las líneas data-solo-web (enlaces a las páginas legales de publico/) no van en la versión privada.
  # en la web, el diseño común de las herramientas (diseno.js); en la versión privada, sin enlaces a la web
  if [ "$1" = privado ]; then grep -v 'data-solo-web' shell.html; else node diseno.js electrostatica < shell.html || exit 1; fi; echo '<script>'
  for f in version engine fmt physics $presets canvas app; do case $f in *.js) src=$f ;; *) src=$f.js ;; esac; grep -v "^if (typeof module" "$src"; echo; done
  printf 'window.GUIA_IMG = {\n'
  for img in guia/*.webp; do [ -e "$img" ] || continue; printf '  "%s": "data:image/webp;base64,' "$(basename "$img" .webp)"; base64 < "$img" | tr -d '\n'; printf '",\n'; done
  printf '};\n'
  echo '</script>'
  if [ "$1" != privado ]; then printf '</html>\n'; fi
} > "$out"

# Las demás herramientas: una página cada una, con lo que dice catalogo.js (herramientas.js)
if [ "$1" != privado ]; then node herramientas.js || exit 1; fi
