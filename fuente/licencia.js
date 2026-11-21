/* ===== Licencia del código (AGPL-3.0) =====
   Aviso discreto en el pie de todas las páginas: tras el enlace «Cookies» pone «Licencia AGPL-3.0» (el texto
   de /LICENSE en el repositorio) y «Código fuente». Los textos son frases del pie que traducen los
   diccionarios de fuente/i18n/<idioma>/_comun.json. La marca «Ciencify», el logo, los textos y las
   imágenes no entran en la AGPL (README.md). Lo llaman diseno.js y portal.js. */
const REPO = 'https://github.com/Danijimzzz/Electromagnetismo';
const pie = (html) => html.replace(/(<a href="[^"]*cookies\.html">Cookies<\/a>)(?! · <a href="[^"]*LICENSE)/g, `$1 · <a href="${REPO}/blob/main/LICENSE" rel="noopener">Licencia AGPL-3.0</a> · <a href="${REPO}" rel="noopener">Código fuente</a>`);
if (typeof module !== 'undefined') module.exports = { pie, REPO };
