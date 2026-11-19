/* ===== Impresión: modo claro y desarrollos abiertos (Web 1.23) =====
   El estilo de la hoja está en imprimir-css.js (lo mete diseno.js). Aquí solo lo que necesita script: al imprimir se
   pasa a modo claro, se abren los desarrollos plegados y se redibujan los lienzos; al terminar se deja todo como estaba.
   Va en todas las páginas de herramienta (antes lo hacía compartir.js solo en Matemáticas y Electromagnetismo). */
(() => {
  // Tipografía de la hoja (IBM Plex, en fuentes/): se declara aquí y se baja cuando el navegador está libre, para que ya esté al imprimir
  const raiz = (document.querySelector('header.top .logo') || {}).getAttribute ? document.querySelector('header.top .logo').getAttribute('href') : '../../';
  const CARAS = [['IBM Plex Serif', 'italic', 400, 'plex-serif-it-400'], ['IBM Plex Serif', 'normal', 400, 'plex-serif-400'], ['IBM Plex Serif', 'normal', 600, 'plex-serif-600'], ['IBM Plex Sans', 'normal', '400 600', 'plex-sans'], ['IBM Plex Mono', 'normal', 400, 'plex-mono-400'], ['IBM Plex Mono', 'normal', 500, 'plex-mono-500']];
  const st = document.createElement('style');
  st.textContent = CARAS.map(([f, e, w, n]) => `@font-face { font-family: "${f}"; font-style: ${e}; font-weight: ${w}; font-display: swap; src: url(${raiz}fuentes/${n}.woff2) format("woff2") }`).join('\n');
  document.head.appendChild(st);
  const baja = () => { if (document.fonts && document.fonts.load) CARAS.forEach(([f, e, w]) => document.fonts.load(`${e} ${String(w).split(' ')[0]} 12pt "${f}"`).catch(() => {})); };
  (window.requestIdleCallback || ((f) => setTimeout(f, 3000)))(() => setTimeout(baja, 2500));
  let tema = null, cerrados = [], hecho = false;
  addEventListener('beforeprint', () => {
    if (hecho) return; hecho = true; baja();
    tema = document.documentElement.getAttribute('data-theme'); document.documentElement.setAttribute('data-theme', 'light');
    cerrados = [...document.querySelectorAll('details:not([open])')].filter((d) => !d.classList.contains('enun-bloque')); cerrados.forEach((d) => { d.open = true; });
    dispatchEvent(new Event('resize'));
  });
  addEventListener('afterprint', () => {
    if (!hecho) return; hecho = false;
    if (tema === null) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', tema);
    cerrados.forEach((d) => { d.open = false; }); cerrados = []; dispatchEvent(new Event('resize'));
  });
})();
