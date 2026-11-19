/* ===== Impresión y PDF: estilo común de todas las herramientas y fenómenos (Web 1.23) =====
   Formato «editorial»: marca Ciencify arriba (.imp-marca, que pone diseno.js), título en cursiva serif, el enunciado
   con su barra de color, datos y resultados limpios (sin botones, desplegables, publicidad ni enlaces), pie con la
   dirección y «página X / N». Lo mete diseno.js en la hoja común de cada página (CSS) y, por página, el @page con su
   dirección (PAGINA). El modo claro y los desarrollos abiertos los pone imprimir.js al imprimir.
   La hoja de varios ejercicios («Mis ejercicios») tiene su propio estilo en biblioteca.js, con la misma estética. */
const CSS = `
.imp-marca { display:none }
@media print {
  :root { --i-serif:"IBM Plex Serif", Georgia, serif; --i-sans:"IBM Plex Sans", system-ui, sans-serif; --i-mono:"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace }
  header.top, .miga, .prac-btn, .fav-btn, .bib, .bib-scrim, .bib-aviso, .bib-btn, footer, .teoria, .preguntas, .limites, .compartir, .anuncio, .adsbygoogle, .relacionadas, .vida-real, .llama, .lg, .lg-ban, #ejemplos, .controles, .nota:empty, .error, .chips, .stage-bar, .x, .tools, .exportar, .exportar-aviso, .enun-bloque > summary, .enun-cuerpo, .enun-ayuda, .sv-ads { display:none !important }
  html, body { background:#fff !important; color:#222 !important }
  body { padding:0 !important; font:10pt/1.45 var(--i-sans) !important }
  .wrap { max-width:none !important; padding:0 !important; margin:0 !important }
  .imp-marca { display:flex !important; align-items:baseline; justify-content:space-between; padding-bottom:10pt; margin-bottom:14pt; border-bottom:1.5pt solid var(--accent) }
  .imp-marca .mk { font:600 15pt var(--i-serif); color:#111 } .imp-marca .mk i { color:var(--marca, #0d6b66) }
  .imp-marca .as { font:500 7.5pt var(--i-mono); letter-spacing:.1em; text-transform:uppercase; color:var(--accent) }
  h1 { font:italic 400 24pt/1.2 var(--i-serif) !important; letter-spacing:-.01em; margin:0 0 10pt !important }
  .lead { color:#555 !important; font-size:9.5pt !important; margin:0 0 12pt !important }
  .layout { display:block !important }
  .card { background:none !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; backdrop-filter:none !important; padding:0 !important; margin:0 0 14pt !important; break-inside:avoid }
  .card h2 { font:500 7.5pt var(--i-mono) !important; text-transform:uppercase; letter-spacing:.14em; color:#222 !important; border-bottom:.5pt solid var(--accent); padding-bottom:3pt; margin:0 0 6pt !important; break-after:avoid }
  .destacado { border-left:3pt solid var(--accent) !important; padding-left:10pt !important }
  .campos select, .campos input, .campos textarea, select.in, input.in { -webkit-appearance:none !important; appearance:none !important; background:none !important; border:0 !important; padding:0 !important; box-shadow:none !important; color:#222 !important }
  .pasos li, .resumen > * { break-inside:avoid }
  canvas { max-height:9cm; object-fit:contain }
  .cvwrap { height:9cm !important; min-height:0 !important }
  .enun-bloque { border:0 !important; border-left:2pt solid var(--accent) !important; background:none !important; padding:0 0 0 12pt !important; margin:0 0 12pt !important; break-inside:avoid }
}`;
// (se escribe «content :» con espacio a propósito: i18n.js traduce los «content:» de los <style> y esta dirección no es texto)
// @page con la dirección de la herramienta y «página X / N» (en navegadores sin cuadros de margen se ignora y sale el pie del propio navegador)
const PAGINA = (url, ver) => `@page { size:A4; margin:1.4cm 1.5cm 1.8cm; @bottom-left { content :"${url}${ver ? '\\00a0·\\00a0v' + ver : ''}"; font:7pt "IBM Plex Mono", ui-monospace, monospace; color:#666 } @bottom-right { content :counter(page) " / " counter(pages); font:7pt "IBM Plex Mono", ui-monospace, monospace; color:#666 } }`;
module.exports = { CSS, PAGINA };
