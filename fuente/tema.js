/* =====================================================================
   Botón de modo claro / oscuro de la barra de arriba (portada, asignaturas,
   novedades y todas las herramientas). Mientras no se pulsa, la web sigue el
   modo del sistema; al pulsarlo se fija data-theme en <html> y se guarda en el
   navegador. Las páginas ya tienen los colores para :root[data-theme=…].
   portal.js y diseno.js meten SCRIPT al principio de cada página (así no hay
   destello del otro modo al cargar), CSS con sus estilos y BOTON en la cabecera.
   ===================================================================== */
const CLAVE = 'simu-tema';

// Va en línea y antes del contenido. Las gráficas se redibujan cuando cambia
// matchMedia('(prefers-color-scheme: dark)'); al pulsar el botón se avisa a esos mismos oyentes.
const SCRIPT = `(() => {
  const raiz = document.documentElement, mq = matchMedia('(prefers-color-scheme: dark)'), oyentes = [];
  try { const t = localStorage.getItem('${CLAVE}'); if (t === 'dark' || t === 'light') raiz.dataset.theme = t; } catch (e) { /* sin almacenamiento */ }
  const orig = MediaQueryList.prototype.addEventListener;
  MediaQueryList.prototype.addEventListener = function (tipo, f, ...r) { if (tipo === 'change' && /prefers-color-scheme/.test(this.media)) oyentes.push(f); return orig.call(this, tipo, f, ...r); };
  const oscuro = () => (raiz.dataset.theme ? raiz.dataset.theme === 'dark' : mq.matches);
  const rotula = () => document.querySelectorAll('.tema').forEach((b) => { const t = oscuro() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'; b.title = t; b.setAttribute('aria-label', t); });
  document.addEventListener('DOMContentLoaded', rotula);
  mq.addEventListener('change', rotula);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tema')) return;
    raiz.dataset.theme = oscuro() ? 'light' : 'dark';
    try { localStorage.setItem('${CLAVE}', raiz.dataset.theme); } catch (e) { /* sin almacenamiento */ }
    rotula();
    for (const f of oyentes) { try { f.call(mq, { matches: oscuro(), media: mq.media }); } catch (err) { console.error(err); } }
  });
})();`;

const luna = '<svg class="luna" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg>';
const sol = '<svg class="sol" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const BOTON = `<button class="tema" type="button" title="Cambiar de modo claro u oscuro" aria-label="Cambiar de modo claro u oscuro">${luna}${sol}</button>`;

// en modo claro se ve la luna (pasar a oscuro) y en modo oscuro el sol
const CSS = `
.tema { flex:0 0 auto; margin-left:auto; width:36px; height:36px; display:grid; place-items:center; padding:0; border:1px solid var(--line); border-radius:8px; background:var(--bg); color:var(--ink); cursor:pointer }
.buscar ~ .tema, form ~ .tema { margin-left:0 }
.tema:hover { border-color:var(--accent); color:var(--accent) }
.tema:focus-visible { outline:2px solid var(--accent); outline-offset:1px }
.tema .sol { display:none }
:root[data-theme="dark"] .tema .sol { display:block } :root[data-theme="dark"] .tema .luna { display:none }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .tema .sol { display:block } :root:not([data-theme="light"]) .tema .luna { display:none } }
@media (max-width:700px) { .top > .tema { margin-left:auto } .top > nav { order:1 } }
`;

if (typeof module !== 'undefined') module.exports = { SCRIPT, CSS, BOTON, CLAVE };
