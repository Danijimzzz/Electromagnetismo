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
    printf '<meta property="og:image" content="https://electromagnetismo-two.vercel.app/og.png">\n<meta name="twitter:card" content="summary_large_image">\n'
  fi
  # Las líneas data-solo-web (enlaces a las páginas legales de publico/) no van en la versión privada.
  if [ "$1" = privado ]; then grep -v 'data-solo-web' shell.html; else cat shell.html; fi; echo '<script>'
  for f in version engine fmt physics $presets canvas app; do case $f in *.js) src=$f ;; *) src=$f.js ;; esac; grep -v "^if (typeof module" "$src"; echo; done
  printf 'window.GUIA_IMG = {\n'
  for img in guia/*.webp; do [ -e "$img" ] || continue; printf '  "%s": "data:image/webp;base64,' "$(basename "$img" .webp)"; base64 < "$img" | tr -d '\n'; printf '",\n'; done
  printf '};\n'
  echo '</script>'
  if [ "$1" != privado ]; then printf '</html>\n'; fi
} > "$out"

# Herramientas nuevas: cada una es una página con su HTML y sus scripts concatenados.
#   herramienta CARPETA SALIDA TÍTULO DESCRIPCIÓN scripts…
herramienta() {
  dir=$1; out=$2; tit=$3; des=$4; shift 4
  mkdir -p "$(dirname "$out")"
  {
    printf '<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    printf '<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,'; base64 < icono.svg | tr -d '\n'; printf '">\n'
    printf '<link rel="apple-touch-icon" href="../../apple-touch-icon.png">\n'
    printf '<meta property="og:title" content="%s">\n<meta property="og:description" content="%s">\n' "$tit" "$des"
    printf '<meta property="og:image" content="https://electromagnetismo-two.vercel.app/og.png">\n<meta name="twitter:card" content="summary_large_image">\n'
    cat "$dir/pagina.html"; echo '<script>'
    for src in "$@"; do grep -v "^if (typeof module" "$src"; echo; done
    echo '</script>'; printf '</html>\n'
  } > "$out"
}
if [ "$1" != privado ]; then
  herramienta magnetostatica ../publico/electromagnetismo/magnetostatica/index.html "Calculadora de campo magnético (Biot-Savart)" "Campo magnético de hilos, espiras, solenoides y toroides, y fuerzas magnéticas, paso a paso" \
    version.js engine.js magnetostatica/fisica.js magnetostatica/ejemplos.js magnetostatica/app.js
  herramienta tabla-periodica ../publico/quimica/tabla-periodica/index.html "Tabla periódica interactiva" "Ficha de cada elemento con masa, configuración electrónica, electronegatividad y radio, y tendencias coloreadas" \
    version.js quimica/elementos.js tabla-periodica/app.js
  herramienta trabajo-y-energia ../publico/fisica/trabajo-y-energia/index.html "Trabajo y energía: rampa, rozamiento y muelle" "Simulador de conservación de la energía con rozamiento y muelle: animación, barras de energía y desarrollo paso a paso" \
    version.js trabajo-y-energia/fisica.js trabajo-y-energia/app.js
  herramienta masa-molar ../publico/quimica/masa-molar/index.html "Masa molar y estequiometría" "Masa molar y composición de cualquier fórmula, ajuste de reacciones, reactivo limitante y rendimiento, paso a paso" \
    version.js quimica/elementos.js quimica/formulas.js masa-molar/app.js
  herramienta configuracion-electronica ../publico/quimica/configuracion-electronica/index.html "Configuración electrónica" "Configuración electrónica de elementos e iones con el diagrama de Moeller, la regla de Hund y los números cuánticos" \
    version.js quimica/elementos.js quimica/configuracion.js configuracion-electronica/app.js
  herramienta condensadores ../publico/electromagnetismo/condensadores/index.html "Condensadores con dieléctricos" "Capacidad, energía, campos E, D y P y cargas de polarización en condensadores planos, cilíndricos y esféricos con dieléctricos" \
    version.js condensadores/fisica.js condensadores/app.js
  herramienta tiro-parabolico ../publico/fisica/tiro-parabolico/index.html "Tiro parabólico y cinemática" "Simulador de tiro parabólico con y sin rozamiento: alcance, altura máxima, tiempo de vuelo, gráficas x(t), v(t), a(t) y MRU y MRUA paso a paso" \
    version.js tiro-parabolico/fisica.js tiro-parabolico/app.js
  herramienta disoluciones ../publico/quimica/disoluciones/index.html "Disoluciones y concentraciones" "Calculadora de disoluciones: molaridad, molalidad, fracción molar, % en masa y ppm, preparar desde un reactivo comercial y diluir, paso a paso" \
    version.js quimica/elementos.js quimica/formulas.js quimica/disoluciones.js disoluciones/app.js
  herramienta calorimetria ../publico/fisica/calorimetria/index.html "Calorimetría y cambios de fase" "Temperatura de equilibrio al mezclar agua, hielo, vapor y metales, con cambios de fase y calorímetro, paso a paso" \
    version.js calorimetria/fisica.js calorimetria/app.js
  herramienta induccion ../publico/electromagnetismo/induccion/index.html "Autoinducción e inducción mutua" "Coeficiente de autoinducción de solenoides, toroides y cables coaxiales, inducción mutua, energía magnética y circuito RL, paso a paso" \
    version.js induccion/fisica.js induccion/app.js
  herramienta matrices ../publico/matematicas/matrices/index.html "Matrices paso a paso" "Calculadora de matrices con fracciones exactas y complejos: determinante, inversa, rango, Gauss-Jordan y valores y vectores propios, paso a paso" \
    version.js matematicas/algebra.js matrices/calculo.js matrices/app.js
  herramienta sistemas ../publico/matematicas/sistemas/index.html "Sistemas de ecuaciones lineales" "Calculadora de sistemas de ecuaciones paso a paso: Rouché-Frobenius, Gauss, Gauss-Jordan, Cramer y matriz inversa, en paramétricas y con números complejos" \
    version.js matematicas/algebra.js sistemas/calculo.js sistemas/app.js
  herramienta estadistica ../publico/matematicas/estadistica/index.html "Distribuciones de probabilidad" "Calculadora de la normal, binomial, Poisson, t de Student y chi cuadrado con el área sombreada: probabilidades, cuantiles y valores críticos paso a paso" \
    version.js estadistica/calculo.js estadistica/app.js
  herramienta alterna ../publico/laboratorio/alterna/index.html "Corriente alterna y fasores" "Calculadora de corriente alterna: circuitos RLC en serie y en paralelo con impedancias complejas, diagrama de fasores, potencias, factor de potencia y resonancia, paso a paso" \
    version.js alterna/fisica.js alterna/app.js
  herramienta dinamica ../publico/fisica/dinamica/index.html "Dinámica y diagramas de fuerzas" "Calculadora de dinámica con el diagrama de fuerzas: plano inclinado con rozamiento estático y dinámico, fuerza con ángulo, poleas y máquina de Atwood, paso a paso" \
    version.js dinamica/fisica.js dinamica/app.js
fi
