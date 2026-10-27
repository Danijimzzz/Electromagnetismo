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
  const cliente = '', bloque = '';
  if (cliente && !/^ca-pub-\d{16}$/.test(cliente)) throw new Error(`anuncios.js: «${cliente}» no es un ID de editor (ca-pub- y 16 cifras)`);
  if (bloque && !/^\d+$/.test(bloque)) throw new Error(`anuncios.js: «${bloque}» no es un ID de bloque (solo cifras)`);
  const activos = !!cliente;

  // en el <head>: verificación del sitio, código de AdSense y el enlace «Preferencias de cookies»
  // (vuelve a abrir el aviso de Google cuando este ha cargado)
  const cabeza = () => (activos ? `<meta name="google-adsense-account" content="${cliente}">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cliente}" crossorigin="anonymous"></script>
<script>window.googlefc = window.googlefc || {}; googlefc.callbackQueue = googlefc.callbackQueue || [];
document.addEventListener('click', (e) => { if (!e.target.closest('.pref-cookies')) return; e.preventDefault(); googlefc.callbackQueue.push(() => googlefc.showRevocationMessage()); });</script>
<style>.anuncio { max-width:860px; margin:28px auto 0; text-align:center; min-height:120px } .anuncio > span { display:block; font:11px/1.6 system-ui, sans-serif; letter-spacing:.06em; text-transform:uppercase; color:var(--muted, #5b6670) } .anuncio ins { display:block }</style>
` : '');
  const hueco = () => (activos && bloque ? `<aside class="anuncio" aria-label="Publicidad"><span>Publicidad</span><ins class="adsbygoogle" data-ad-client="${cliente}" data-ad-slot="${bloque}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(window.adsbygoogle = window.adsbygoogle || []).push({});</script></aside>
` : '');
  // tras el enlace «Cookies» del pie
  const pie = (html) => (activos ? html.replace(/(<a href="[^"]*cookies\.html">Cookies<\/a>)/g, '$1 · <a href="#" class="pref-cookies">Preferencias de cookies</a>') : html);
  const adsTxt = () => (activos ? `google.com, ${cliente.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n` : null);
  return { activos, cliente, bloque, cabeza, hueco, pie, adsTxt };
})();
if (typeof module !== 'undefined') module.exports = Anuncios;
