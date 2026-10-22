#!/bin/sh
# Concatena las fuentes en ../index.html (la página que sirve Vercel)
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  cat shell.html; echo '<script>'
  for f in engine fmt physics presets canvas app; do grep -v "^if (typeof module" $f.js; echo; done
  echo '</script>'; printf '</html>\n'
} > ../index.html
