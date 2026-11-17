const Personal = (() => {
  const K_REC = 'simu-recientes', K_FAV = 'simu-favoritos', MAX = 8;
  const lee = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const escribe = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const rutaDe = (p) => { const q = String(p).split('/').filter((s) => s && !/\.html?$/.test(s)); return q.length >= 2 ? q.slice(-2).join('/') : null; };
  const recientes = () => lee(K_REC).filter((x) => x && typeof x.r === 'string');
  const favoritos = () => lee(K_FAV).filter((x) => typeof x === 'string');
  function visita(ruta, ahora = Date.now()) { escribe(K_REC, [{ r: ruta, t: ahora }, ...recientes().filter((x) => x.r !== ruta)].slice(0, MAX)); }
  const esFavorita = (ruta) => favoritos().includes(ruta);
  function alterna(ruta) { const f = favoritos(), i = f.indexOf(ruta); if (i >= 0) f.splice(i, 1); else f.push(ruta); escribe(K_FAV, f); return i < 0; }
  function espacio() {
    const r = recientes();
    return { continuar: r[0] || null, favoritas: favoritos(), recientes: r.slice(1, 6) };
  }
  function borra() { try { localStorage.removeItem(K_REC); localStorage.removeItem(K_FAV); } catch (e) { /* sin almacenamiento */ } }
  function hace(t, ahora = Date.now()) {
    const m = Math.max(0, Math.round((ahora - t) / 60000));
    if (m < 2) return 'justo ahora';
    if (m < 60) return `hace ${m} min`;
    if (m < 60 * 24) return `hace ${Math.round(m / 60)} h`;
    const d = Math.round(m / 1440);
    return d === 1 ? 'ayer' : `${d} days ago`;
  }

  const CSS = '.fav-btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--vidrio, var(--panel)); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none); border: 1px solid var(--vidrio-borde, var(--line)); border-radius: 999px; padding: 5px 12px; cursor: pointer; white-space: nowrap } .fav-btn:hover, .fav-btn[aria-pressed=true] { border-color: var(--accent); color: var(--accent) } @media print { .fav-btn { display: none !important } }';
  function monta() {
    if (typeof document === 'undefined') return;
    const ruta = rutaDe(location.pathname); if (!ruta) return;
    visita(ruta);
    const sitio = document.querySelector('.miga-der'); if (!sitio || sitio.querySelector('.fav-btn')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fav-btn';
    const pinta = () => { const on = esFavorita(ruta); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Remove from your favourites (home page)' : 'Add to your favourites (home page)'; b.innerHTML = `<span aria-hidden="true">${on ? '★' : '☆'}</span> Favourite`; };
    b.addEventListener('click', () => { alterna(ruta); pinta(); });
    pinta(); sitio.append(b);
  }
  monta();
  return { rutaDe, visita, esFavorita, alterna, espacio, borra, hace, recientes, favoritos, K_REC, K_FAV };
})();

