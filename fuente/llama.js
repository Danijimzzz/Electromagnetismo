/* =====================================================================
   La llama 🔥: marca, con una llama animada, la herramienta más usada de cada asignatura (en la
   portada, en la página de la asignatura y en la propia herramienta). portal.js escribe
   publico/llama.js (código + CSS) con archivo(); portal.js y diseno.js enganchan la etiqueta
   ETIQUETA(raiz) en cada página, igual que el buscador.
   Los datos son un JSON { "<asignatura>": "<asignatura>/<herramienta>", … } (una por asignatura)
   que da el contador de visitas (Catalogo.conteo: dirección que lo sirve; vacía, no hay llama).
   Solo se cuentan visitas por página (worker/contador.mjs, Cloudflare Worker + D1): sin cookies,
   sin identificadores y sin eventos. Cada página de herramienta avisa una vez por sesión y
   herramienta (POST «visita» junto a la dirección del contador); no cuenta con «No rastrear»,
   con navegadores automáticos ni desde localhost. La respuesta se guarda una hora en sessionStorage para no pedirla en cada página. Respeta
   prefers-reduced-motion (la llama queda quieta).
   ===================================================================== */
const Catalogo = require('./catalogo.js');

const ETIQUETA = (raiz) => `<script src="${raiz}llama.js" defer></script>`;

const CSS = `
:root { --llama-1:#e8590c; --llama-2:#ffd43b }
:root[data-theme="dark"] { --llama-1:#ff8a3d; --llama-2:#ffe066 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --llama-1:#ff8a3d; --llama-2:#ffe066 } }
.llama { display:inline-block; width:1.15em; height:1.15em; vertical-align:-.2em; pointer-events:none }
.llama svg { width:100%; height:100%; display:block; overflow:visible }
.llama .ext, .llama .int { transform-box:fill-box; transform-origin:50% 100% }
.llama .ext { fill:var(--llama-1) } .llama .int { fill:var(--llama-2) }
.llama-ficha { position:relative }
.llama-ficha > .llama { position:absolute; top:8px; right:10px; width:1.35em; height:1.35em }
@media (prefers-reduced-motion: no-preference) {
  .llama .ext { animation:llama-ext 1.3s ease-in-out infinite } .llama .int { animation:llama-int .9s ease-in-out infinite }
}
@keyframes llama-ext { 0%,100% { transform:scale(1,1) rotate(-2deg) } 30% { transform:scale(1.07,.93) rotate(2.5deg) } 60% { transform:scale(.94,1.1) rotate(-1.5deg) } 80% { transform:scale(1.03,.98) rotate(1deg) } }
@keyframes llama-int { 0%,100% { transform:scale(1,1) } 35% { transform:scale(.88,1.14) } 70% { transform:scale(1.1,.9) } }
@media print { .llama { display:none } }
`;

const CLIENTE = `(() => {
  const FUENTE = window.LLAMA_FUENTE || ${JSON.stringify(Catalogo.conteo || '')}, K = 'simu-llama', HORA = 36e5;
  // sin contador, o en pruebas locales (file:// y localhost), no hay llama ni cuenta
  if (!FUENTE || (!window.LLAMA_FUENTE && (location.protocol === 'file:' || /^(localhost|127\\.|\\[::1\\])/.test(location.hostname)))) return;
  const SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ext" d="M12 1.5c.9 3.6 5.6 5.7 5.6 11.2A5.6 5.6 0 0 1 12 22.5a5.6 5.6 0 0 1-5.6-9.8c0-1.9.9-3.3 2-4.6.1 1.5.8 2.6 1.9 3.1C10 7.6 10.3 4.4 12 1.5z"/><path class="int" d="M12 22.5a3.3 3.3 0 0 1-3.3-3.3c0-2 1.6-3 2.3-4.8.7 1.2 1.2 1.5 1.8 2.4.6.8 1.5 1.5 1.5 2.4A3.3 3.3 0 0 1 12 22.5z"/></svg>';
  const crea = (titulo) => { const s = document.createElement('span'); s.className = 'llama'; s.setAttribute('role', 'img'); s.setAttribute('aria-label', titulo); s.title = titulo; s.innerHTML = SVG; return s; };
  const ruta = (u) => { try { return new URL(u, location.href).pathname.split('/').filter((x) => x && !/\\.html?$/.test(x)).slice(-2).join('/'); } catch (e) { return ''; } };
  function marca(datos) {
    const tops = new Set(Object.values(datos).filter((v) => typeof v === 'string'));
    if (!tops.size) return;
    const st = document.createElement('style'); st.textContent = ${JSON.stringify(CSS)}; document.head.appendChild(st);
    const TIT = 'La herramienta más usada de la asignatura';
    // tarjetas de la portada y de la asignatura
    for (const a of document.querySelectorAll('.mini a[href], a.card[href]')) {
      if (!tops.has(ruta(a.getAttribute('href'))) || a.querySelector('.llama')) continue;
      a.classList.add('llama-ficha'); a.appendChild(crea(TIT));
    }
    // la propia herramienta, junto al título
    const aqui = location.pathname.split('/').filter((x) => x && !/\\.html?$/.test(x)).slice(-2).join('/'), h1 = document.querySelector('.wrap > h1, main h1, h1');
    if (h1 && tops.has(aqui) && !h1.querySelector('.llama')) { h1.append(' ', crea(TIT)); }
  }
  // una visita por sesión y herramienta, al contador (sin cookies ni identificadores)
  (() => {
    const q = location.pathname.split('/').filter((x) => x && !/\\.html?$/.test(x)), r = q.slice(-2).join('/');
    const prueba = !!window.LLAMA_FUENTE;
    if (q.length < 2 || q[q.length - 2] === 'fenomenos' || !/^[a-z0-9-]+\\/[a-z0-9-]+$/.test(r)) return;
    if (navigator.doNotTrack === '1' || (navigator.webdriver && !prueba)) return;
    try { if (sessionStorage.getItem('simu-visita:' + r)) return; sessionStorage.setItem('simu-visita:' + r, '1'); } catch (e) { /* sin almacenamiento: se cuenta cada vez */ }
    try { fetch(FUENTE.replace(/populares$/, 'visita'), { method: 'POST', body: JSON.stringify({ r }), keepalive: true }).catch(() => {}); } catch (e) { /* sin red */ }
  })();
  let datos = null; try { const g = JSON.parse(sessionStorage.getItem(K)); if (g && Date.now() - g.t < HORA) datos = g.d; } catch (e) { /* sin almacenamiento */ }
  if (datos) { marca(datos); return; }
  fetch(FUENTE, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (!d || typeof d !== 'object') return;
    try { sessionStorage.setItem(K, JSON.stringify({ t: Date.now(), d })); } catch (e) { /* sin almacenamiento */ }
    marca(d);
  }).catch(() => { /* sin conexión o sin contador: sin llama */ });
})();`;

const archivo = () => `/* La llama de la herramienta más usada: generado por fuente/llama.js */\n${CLIENTE}\n`;

module.exports = { ETIQUETA, archivo, CSS };
