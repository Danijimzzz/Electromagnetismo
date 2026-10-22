#!/bin/sh
# Concatena las fuentes en ../index.html (la página que sirve Vercel).
# Las capturas de guia/*.webp se incrustan en base64 para que la página siga siendo un solo archivo.
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  # Icono de la pestaña (fuente/icono.svg, incrustado) y lo que se ve al instalar o compartir el enlace.
  printf '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,'; base64 < icono.svg | tr -d '\n'; printf '">\n'
  printf '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
  printf '<meta property="og:title" content="Simulador de Electrostática">\n<meta property="og:description" content="Tema 3 · Electromagnetismo y Ondas">\n'
  printf '<meta property="og:image" content="https://electromagnetismo-two.vercel.app/og.png">\n<meta name="twitter:card" content="summary_large_image">\n'
  cat shell.html; echo '<script>'
  for f in version engine fmt physics presets canvas app; do grep -v "^if (typeof module" $f.js; echo; done
  printf 'window.GUIA_IMG = {\n'
  for img in guia/*.webp; do [ -e "$img" ] || continue; printf '  "%s": "data:image/webp;base64,' "$(basename "$img" .webp)"; base64 < "$img" | tr -d '\n'; printf '",\n'; done
  printf '};\n'
  echo '</script>'; printf '</html>\n'
} > ../index.html
