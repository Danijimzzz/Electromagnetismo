/* Ciencify: registro del service worker y avisos (fuente/pwa.js). Generado: no se edita a mano. */
(() => {
  if (!('serviceWorker' in navigator)) return; // sin https (o file://) no hay service worker
  const origen = document.currentScript && document.currentScript.src, sw = new URL('../sw.js', origen || location.href).href;
  const css = document.createElement('style');
  css.textContent = ".pwa-aviso{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;display:flex;align-items:center;gap:10px;flex-wrap:wrap;max-width:calc(100vw - 32px);padding:10px 14px;background:var(--panel,#fff);color:var(--ink,#1a2128);border:1px solid var(--line,#d5dbd5);border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.2);font:14px/1.4 var(--f-ui,system-ui,sans-serif)}\n.pwa-aviso button{font:600 13px var(--f-ui,system-ui,sans-serif);padding:6px 12px;border-radius:8px;border:1px solid var(--accent,#0d6b66);background:transparent;color:var(--accent,#0d6b66);cursor:pointer}\n.pwa-aviso .si{background:var(--accent,#0d6b66);color:var(--panel,#fff)}\n.pwa-aviso button:focus-visible{outline:2px solid var(--accent,#0d6b66);outline-offset:2px}";
  document.head.appendChild(css);

  let recarga = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (recarga) location.reload(); });

  const aviso = (reg) => {
    if (document.querySelector('.pwa-aviso')) return;
    const d = document.createElement('div'); d.className = 'pwa-aviso'; d.setAttribute('role', 'status');
    d.innerHTML = '<span>Es gibt eine neue Version von Ciencify.</span><button type="button" class="si">Aktualisieren</button><button type="button" class="no">Jetzt nicht</button>';
    d.querySelector('.si').onclick = () => { recarga = true; (reg.waiting || reg.installing || reg.active).postMessage('SKIP_WAITING'); setTimeout(() => location.reload(), 1500); };
    d.querySelector('.no').onclick = () => d.remove();
    document.body.appendChild(d);
  };
  const vigila = (reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) aviso(reg);
    reg.addEventListener('updatefound', () => {
      const n = reg.installing;
      if (n) n.addEventListener('statechange', () => { if (n.state === 'installed' && navigator.serviceWorker.controller) aviso(reg); });
    });
  };

  const barra = () => {
    const b = document.getElementById('pwa-barra'); if (!b) return;
    const estado = document.getElementById('pwa-estado'), todo = document.getElementById('pwa-todo'), inst = document.getElementById('pwa-instalar');
    b.hidden = false;
    const instalada = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !instalada;
    if (ios) estado.textContent = 'Auf iPhone und iPad: Tippe auf Teilen und „Zum Home-Bildschirm“.';
    let aplaza = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); aplaza = e; if (!instalada) inst.hidden = false; });
    window.addEventListener('appinstalled', () => { inst.hidden = true; estado.textContent = 'Installiert.'; });
    inst.onclick = async () => { if (!aplaza) return; aplaza.prompt(); await aplaza.userChoice; aplaza = null; inst.hidden = true; };
    caches.keys().then(async (ks) => { for (const k of ks) if (k.startsWith('ciencify-') && await (await caches.open(k)).match(new URL('guardado-todo', sw))) { estado.textContent = 'Alles gespeichert: funktioniert offline.'; return; } }).catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => {
      const m = e.data || {};
      if (m.tipo === 'progreso') estado.textContent = 'Speichern… ' + Math.round(100 * m.hechas / m.total) + ' %';
      if (m.tipo === 'fin') { todo.disabled = false; estado.textContent = m.fallos ? 'Es konnte nicht alles gespeichert werden (' + m.fallos + ' Seiten). Versuche es erneut mit Internetverbindung.' : 'Alles gespeichert: funktioniert offline.'; }
    });
    todo.onclick = async () => {
      const reg = await navigator.serviceWorker.ready;
      todo.disabled = true; estado.textContent = 'Speichern… 0 %';
      reg.active.postMessage('GUARDAR_TODO');
    };
  };

  const arranca = () => navigator.serviceWorker.register(sw).then((reg) => {
    vigila(reg); barra();
    // buscar versión nueva al volver a la pestaña (si pasó más de una hora desde la última vez)
    let ultima = Date.now();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - ultima > 36e5) { ultima = Date.now(); reg.update().catch(() => {}); } });
  }).catch(() => {});
  if (document.readyState === 'complete') arranca(); else addEventListener('load', arranca);
})();
