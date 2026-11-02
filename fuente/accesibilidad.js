/* =====================================================================
   Regiones con barra de desplazamiento alcanzables con el teclado (fórmulas anchas,
   tablas y listas de pasos que se desbordan, sobre todo en el móvil). diseno.js mete SCRIPT
   en línea en cada herramienta: al cargar, al cambiar el tamaño y cuando la página cambia
   su contenido, pone tabindex="0" a lo que de verdad se desborda y no trae nada enfocable
   dentro, y se lo quita cuando deja de desbordarse. La comprobación con axe-core está
   en pruebas/accesibilidad.js.
   ===================================================================== */
const SCRIPT = `(() => {
  const ENFOCABLE = 'a[href],button,input,select,textarea,summary,[tabindex]';
  let espera = 0;
  const revisa = () => {
    espera = 0;
    for (const e of document.querySelectorAll('main *')) {
      const desborda = e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight;
      if (e.dataset.sf) { if (!desborda) { e.removeAttribute('tabindex'); delete e.dataset.sf; } continue; }
      if (!desborda || e.hasAttribute('tabindex') || e.matches('svg,svg *,canvas') || e.querySelector(ENFOCABLE)) continue;
      const o = getComputedStyle(e);
      if (/auto|scroll/.test(o.overflowX + o.overflowY)) { e.tabIndex = 0; e.dataset.sf = '1'; }
    }
  };
  window.revisaScroll = revisa; // también lo llama pruebas/accesibilidad.js antes de pasar axe
  const pide = () => { if (!espera) espera = setTimeout(revisa, 400); };
  addEventListener('load', () => { revisa(); const m = document.querySelector('main'); if (m) new MutationObserver(pide).observe(m, { childList: true, subtree: true, characterData: true }); });
  addEventListener('resize', pide);
})();`;

if (typeof module !== 'undefined') module.exports = { SCRIPT };
