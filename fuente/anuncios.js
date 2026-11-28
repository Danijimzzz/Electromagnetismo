/* =====================================================================
   Anuncios de Google AdSense. Apagados mientras `cliente` esté vacío: entonces
   no se carga nada de Google, no hay huecos y no se publica ads.txt.
   Para activarlos, rellenar con lo que da AdSense y volver a compilar (build.sh):
     cliente  el ID de editor, 'ca-pub-' y 16 cifras. Con solo esto la página lleva
              la etiqueta de verificación, el código de AdSense (que también trae el
              aviso de cookies que se configura en «Privacidad y mensajes») y ads.txt.
     bloque   el ID de un bloque de anuncios de display adaptable (data-ad-slot, solo
              cifras). Sin él no se pintan huecos: hace falta tras la aprobación.
   Dónde van los huecos (diseno.js y portal.js): uno por página, debajo de los
   resultados (antes de la teoría) o al final del contenido, nunca en el lienzo ni
   entre los datos y la solución. No van en la portada, el foro, las novedades ni
   las páginas legales. La versión privada (artifact) no pasa por aquí.
   ===================================================================== */
const Anuncios = (() => {
  const cliente = '', bloque = '', bloqueLateral = '';
  if (cliente && !/^ca-pub-\d{16}$/.test(cliente)) throw new Error(`anuncios.js: «${cliente}» no es un ID de editor (ca-pub- y 16 cifras)`);
  for (const b of [bloque, bloqueLateral]) if (b && !/^\d+$/.test(b)) throw new Error(`anuncios.js: «${b}» no es un ID de bloque (solo cifras)`);
  const activos = !!cliente;

  // en el <head>: verificación del sitio, código de AdSense y el enlace «Preferencias de cookies»
  // (vuelve a abrir el aviso de Google cuando este ha cargado)
  const cabeza = () => (activos ? `<meta name="google-adsense-account" content="${cliente}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cliente}" crossorigin="anonymous"></script>
<script>window.googlefc = window.googlefc || {}; googlefc.callbackQueue = googlefc.callbackQueue || [];
document.addEventListener('click', (e) => { if (!e.target.closest('.pref-cookies')) return; e.preventDefault(); googlefc.callbackQueue.push(() => googlefc.showRevocationMessage()); });</script>
<style>.anuncio { max-width:860px; margin:28px 0 0; text-align:center; min-height:120px } .anuncio > span { display:block; font:11px/1.6 system-ui, sans-serif; letter-spacing:.06em; text-transform:uppercase; color:var(--muted, #5b6670) } .anuncio ins { display:block }</style>
` : '');
  const ins = (b) => `<ins class="adsbygoogle" style="display:block" data-ad-client="${cliente}" data-ad-slot="${b}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
  const hueco = () => (activos && bloque ? `<div class="anuncio"><span>Publicidad</span>${ins(bloque)}<script>(window.adsbygoogle = window.adsbygoogle || []).push({});</script></div>\n` : '');
  // el hueco de la columna izquierda, bajo la tarjeta de datos (escritorio): un <div> más en el primer .layout
  // de la página, que sigue al hacer scroll (sticky) mientras se lee el desarrollo de la derecha. Se crea al cargar
  // y solo si hay dos columnas a la vista; en móvil, en pestañas ocultas o en maquetas invertidas no se pone.
  const lateral = () => (activos && (bloqueLateral || bloque) ? `<style>.anuncio-lado { display:none } @media (min-width: 901px) { .anuncio-lado { display:block; grid-column:1; grid-row:2; position:sticky; top:96px; margin:8px 0 0; max-width:none; min-height:250px; min-width:0; overflow:hidden } main .layout.con-lado > :nth-child(2) { grid-row:1 / span 2 } }</style>
<script>document.addEventListener('DOMContentLoaded', () => {
  const l = document.querySelector('main .layout');
  if (!l || l.classList.contains('invertido') || l.children.length !== 2 || !l.offsetParent || !matchMedia('(min-width: 901px)').matches) return;
  l.classList.add('con-lado');
  const a = document.createElement('div'); a.className = 'anuncio anuncio-lado';
  a.innerHTML = '<span>Publicidad</span>${ins(bloqueLateral || bloque).replace(/'/g, "\\'")}';
  l.appendChild(a); (window.adsbygoogle = window.adsbygoogle || []).push({});
});</script>
` : '');
  // tras el enlace «Cookies» del pie
  const pie = (html) => (activos ? html.replace(/(<a href="[^"]*cookies\.html">Cookies<\/a>)/g, '$1 · <a href="#" class="pref-cookies">Preferencias de cookies</a>') : html);
  const adsTxt = () => (activos ? `google.com, ${cliente.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n` : null);
  return { activos, cliente, bloque, cabeza, hueco, lateral, pie, adsTxt };
})();
if (typeof module !== 'undefined') module.exports = Anuncios;
