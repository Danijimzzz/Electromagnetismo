#!/bin/sh
# Concatena las fuentes en ../index.html (la página que sirve Vercel).
# Las capturas de guia/*.webp se incrustan en base64 para que la página siga siendo un solo archivo.
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  cat shell.html; echo '<script>'
  for f in engine fmt physics presets canvas app; do grep -v "^if (typeof module" $f.js; echo; done
  printf 'window.GUIA_IMG = {\n'
  for img in guia/*.webp; do [ -e "$img" ] || continue; printf '  "%s": "data:image/webp;base64,' "$(basename "$img" .webp)"; base64 < "$img" | tr -d '\n'; printf '",\n'; done
  printf '};\n'
  echo '</script>'; printf '</html>\n'
} > ../index.html
