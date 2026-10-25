/* =====================================================================
   Configuración electrónica: interfaz. El cálculo está en
   quimica/configuracion.js (Configuracion) y quimica/elementos.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const C = Configuracion, LETRA = 'spdf', CAPAS = 'KLMNOPQ';
  const SUP = (k) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CLAVE = 'configuracion-v1';
  const cargaTxt = (q) => (q ? `<sup>${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}</sup>` : '');

  const entrada = $('#entrada');
  let inicial = 'Fe';
  try { inicial = localStorage.getItem(CLAVE) || inicial; } catch (e) {}
  if (location.hash.length > 1) inicial = decodeURIComponent(location.hash.slice(1));
  entrada.value = inicial;
  $('#chips').innerHTML = C.ejemplos.map((x) => `<button class="chip" type="button" data-x="${esc(x)}">${esc(x)}</button>`).join('');
  $('#chips').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) { entrada.value = b.dataset.x; muestra(); } });
  entrada.addEventListener('input', muestra);
  addEventListener('hashchange', () => { if (location.hash.length > 1) { entrada.value = decodeURIComponent(location.hash.slice(1)); muestra(); } });

  function muestra() {
    const err = $('#error');
    let r;
    try { r = C.analizar(entrada.value); } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    err.hidden = true;
    try { localStorage.setItem(CLAVE, entrada.value); } catch (e) {}
    history.replaceState(null, '', '#' + encodeURIComponent(entrada.value.trim()));
    const el = r.el, q = r.carga;
    $('#z').textContent = el.Z;
    $('#sim').innerHTML = el.simbolo + cargaTxt(q);
    $('#nombre').textContent = q ? `Ion ${el.nombre.toLowerCase()} ${q > 0 ? `(${q}+)` : `(${-q}−)`}` : el.nombre;
    $('#subtitulo').textContent = `Z = ${el.Z} · ${r.electrones} electrones · ${el.categoria}${el.grupo ? ` · grupo ${el.grupo}` : ''} · periodo ${el.periodo} · bloque ${r.bloque}`;
    $('#llenado').textContent = r.porLlenado || '(sin electrones)';
    $('#abreviada').textContent = r.abreviada;
    $('#capas-txt').textContent = r.porCapas;
    $('#capas').textContent = r.capas.map((k, i) => `${CAPAS[i]} (n = ${i + 1}): ${k}`).join(' · ');
    $('#valencia').textContent = `n = ${r.capaValencia}, con ${r.electronesValencia} electr${r.electronesValencia === 1 ? 'ón' : 'ones'}`;
    $('#desap').textContent = `${r.desapareados} · ${r.magnetismo}`;
    const ex = $('#excepcion');
    ex.hidden = !r.excepcion;
    if (r.excepcion) ex.innerHTML = `<b>Excepción al orden de llenado.</b> Por la regla se esperaría ${esc(r.cambio.esperada)}, pero tiene ${esc(r.cambio.real)}: ${/d[⁵]|d¹⁰|f⁷|f¹⁴/.test(r.cambio.real) ? 'un subnivel lleno o semilleno es más estable' : 'los dos subniveles tienen energías muy parecidas y la repulsión entre electrones decide el reparto'}.`;
    $('#en-tabla').href = '../tabla-periodica/#' + el.simbolo;
    moeller(r); orbitales(r);
  }

  /* ---------- Diagrama de Moeller ---------- */
  function moeller(r) {
    const svg = $('#moeller'), ocupados = new Map(r.cajas.map((c) => [c.nombre, c.e]));
    const X = (l) => 42 + l * 66, Y = (n) => 22 + (n - 1) * 40;
    let h = '';
    // diagonales n + l = cte, de arriba a la derecha hacia abajo a la izquierda
    for (let s = 1; s <= 8; s++) {
      const celdas = [];
      for (let l = 3; l >= 0; l--) { const n = s - l; if (n > l && n >= 1 && n <= 7) celdas.push([n, l]); }
      if (!celdas.length) continue;
      const [a, b] = [celdas[0], celdas[celdas.length - 1]];
      const x1 = X(a[1]) + 16, y1 = Y(a[0]) - 12, x2 = X(b[1]) - 20, y2 = Y(b[0]) + 16;
      h += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line)" stroke-width="2" marker-end="url(#punta)"/>`;
    }
    let orden = 0;
    const num = {};
    for (const o of C.ORDEN) if (ocupados.has(o)) num[o] = ++orden;
    for (let n = 1; n <= 7; n++) for (let l = 0; l < Math.min(n, 4); l++) {
      const o = `${n}${LETRA[l]}`, e = ocupados.get(o);
      if (e) h += `<rect x="${X(l) - 24}" y="${Y(n) - 15}" width="48" height="28" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/>`;
      h += `<text x="${X(l)}" y="${Y(n) + 5}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="16" fill="${e ? 'var(--ink)' : 'var(--muted)'}">${o}${e ? `<tspan font-size="11" dy="-7">${e}</tspan>` : ''}</text>`;
      if (e) h += `<text x="${X(l) + 21}" y="${Y(n) + 10}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8" fill="var(--accent)">${num[o]}</text>`;
    }
    svg.innerHTML = `<defs><marker id="punta" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--line)"/></marker></defs>${h}`;
  }

  /* ---------- Orbitales con flechas ---------- */
  function orbitales(r) {
    $('#orbitales').innerHTML = r.cajas.map((c) => `<div class="subnivel"><div class="cajas">${c.orbitales.map((k) => `<span class="caja${k === 1 ? ' uno' : ''}">${k === 2 ? '↑↓' : k === 1 ? '↑' : ''}</span>`).join('')}</div><small>${c.nombre}${SUP(c.e)}</small></div>`).join('');
    const d = r.diferenciador;
    $('#cuanticos').innerHTML = d ? [['n', d.n, 'principal'], ['l', d.l, `secundario (${LETRA[d.l]})`], ['m<sub>l</sub>', String(d.ml).replace('-', '−'), 'magnético'], ['s', d.ms, 'espín']].map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><span>${c}</span></div>`).join('') : '';
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('configuracion-electronica').current;
  muestra();
  window.ConfigApp = { muestra: (x) => { entrada.value = x; muestra(); } };
})();
