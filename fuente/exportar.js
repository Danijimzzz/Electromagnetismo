/* =====================================================================
   Exportar gráfica y datos (común a las herramientas de Electromagnetismo; si el ayudante
   común de herramienta.js llega antes, este fichero se sustituye por él con las mismas llamadas).
     Exportar.monta(lienzo, { nombre, datos })
        añade bajo el lienzo los botones «Guardar imagen (PNG)» y «Copiar datos» (los
        mismos en todas las herramientas). datos() devuelve { cabecera: [..], filas: [[..], ..] }
        con lo que se ve en la gráfica; el texto copiado va separado por tabuladores
        (se pega directo en una hoja de cálculo) y con coma decimal.
     Exportar.tsv(datos)   el texto de los datos (para las pruebas)
     Exportar.png(lienzo, nombre)   descarga el lienzo sobre el fondo de la página
   Un aviso con aria-live dice «Imagen guardada» o «Datos copiados».
   ===================================================================== */
const Exportar = (() => {
  const num = (v) => (typeof v === 'number' ? (isFinite(v) ? String(+v.toPrecision(7)).replace('.', ',') : '') : String(v ?? ''));
  const tsv = (d) => [d.cabecera, ...d.filas].map((f) => f.map(num).join('\t')).join('\n');
  const nombreArchivo = (s) => String(s || 'grafica').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'grafica';
  function png(c, nombre) {
    const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
    const g = o.getContext('2d'); g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#fff'; g.fillRect(0, 0, o.width, o.height); g.drawImage(c, 0, 0);
    return new Promise((ok) => o.toBlob((b) => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombreArchivo(nombre) + '.png';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); ok(true);
    }, 'image/png'));
  }
  async function copia(texto) {
    try { await navigator.clipboard.writeText(texto); return true; } catch (e) { /* sin permiso: copia clásica */ }
    const t = document.createElement('textarea'); t.value = texto; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* nada */ } t.remove(); return ok;
  }
  function monta(c, { nombre, datos } = {}) {
    if (typeof c === 'string') c = document.querySelector(c);
    if (!c || c.dataset.exportar) return;
    c.dataset.exportar = '1';
    const caja = document.createElement('div'); caja.className = 'controles exportar';
    caja.innerHTML = '<button type="button" class="btn" data-x="png">Guardar imagen (PNG)</button>' + (datos ? '<button type="button" class="btn" data-x="datos">Copiar datos</button>' : '') + '<span class="nota" role="status" aria-live="polite"></span>';
    const aviso = caja.querySelector('span'), di = (t) => { aviso.textContent = t; setTimeout(() => { if (aviso.textContent === t) aviso.textContent = ''; }, 3500); };
    caja.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.x === 'png') { await png(c, nombre); di('Imagen guardada.'); }
      else { const d = datos(); di(d && d.filas && d.filas.length ? ((await copia(tsv(d))) ? 'Datos copiados.' : 'No se pudo copiar.') : 'No hay datos que copiar.'); }
    });
    c.insertAdjacentElement('afterend', caja);
    const hermano = c.nextElementSibling; // la leyenda, si la hay, queda justo debajo del lienzo
    if (hermano && hermano !== caja && hermano.classList.contains('leyenda')) hermano.insertAdjacentElement('afterend', caja);
    return caja;
  }
  return { monta, tsv, png, num, nombreArchivo };
})();
if (typeof module !== 'undefined') module.exports = Exportar;
