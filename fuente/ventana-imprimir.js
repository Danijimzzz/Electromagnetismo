/* ===== Ventana de «Imprimir» y «Descargar PDF» (Web 1.23) =====
   Una sola ventana para las dos acciones y para todos los sitios desde los que se abre (menú ⋮ de un ejercicio,
   «Seleccionar», menú de la barra «Mis ejercicios»): Biblioteca.abrirVentanaExportar({ ids, accion, origen }) la abre
   con los ejercicios elegidos y, al aceptar, biblioteca.js monta la hoja con las opciones y abre la impresión del navegador.
   «Descargar PDF» es la misma ventana con otro botón: el navegador no deja guardar un PDF sin su ventana de impresión,
   así que se avisa de que hay que elegir «Guardar como PDF» como destino; el nombre del archivo sale del título de la hoja.
   Opciones (se recuerdan en localStorage['simu-imprimir']): disposición (seguidos o cada ejercicio en página nueva), índice
   (títulos o con enunciado), contenido (enunciado, datos, resultados, desarrollo, escena y gráficas), tipo de hoja
   (solución completa, solo enunciados con espacio para resolver, solo resultados) y color o ahorrar tinta.
   También aquí: el CSS de las opciones de la hoja y el índice en línea de tiempo (indiceHTML). */
const VentanaImprimir = (() => {
  const K = 'simu-imprimir';
  const BASE = { disposicion: 'seguidos', indice: true, estilo: 'titulos', tipo: 'completa', tinta: 'color', enun: true, datos: true, res: true, des: true, esc: true };
  const lee = () => { try { return { ...BASE, ...JSON.parse(localStorage.getItem(K) || '{}') }; } catch (e) { return { ...BASE }; } };
  const guarda = (o) => { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ----- estilo de la ventana (en pantalla) y de las opciones de la hoja (al imprimir) -----
  const CSS = `
.vi-velo { position: fixed; inset: 0; z-index: 1200; background: rgba(20, 30, 40, .38); display: grid; place-items: center; padding: 16px; overflow: auto }
.vi { width: min(640px, 100%); max-height: calc(100vh - 32px); overflow: auto; color: var(--ink); background: var(--vidrio-fuerte, var(--panel)); border: 1px solid var(--vidrio-borde, var(--line)); border-radius: 22px; box-shadow: 0 24px 60px rgba(20, 40, 60, .28); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none); padding: 20px 24px 16px; font: 14px/1.45 var(--f-ui, system-ui) }
.vi h2 { margin: 0 0 2px; font: 600 18px var(--f-ui, system-ui) } .vi .vi-sub { margin: 0 0 12px; color: var(--muted); font-size: 13px }
.vi-lista { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 4px } .vi-ch { background: color-mix(in srgb, var(--ink) 7%, transparent); border-radius: 99px; padding: 3px 11px; font-size: 12.5px } .vi-ch b { color: var(--accent); margin-right: 5px }
.vi-sec { border-top: 1px solid var(--line); padding: 10px 0 4px; margin-top: 10px } .vi-sec h3 { margin: 0 0 8px; font: 600 11px var(--f-ui, system-ui); text-transform: uppercase; letter-spacing: .1em; color: var(--muted) }
.vi-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px }
.vi-op { display: flex; gap: 10px; align-items: center; border: 1.5px solid var(--line); border-radius: 14px; padding: 9px 12px; background: var(--vidrio, transparent); cursor: pointer } .vi-op:has(input:checked) { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent) } .vi-op:has(input:focus-visible), .vi-pill label:has(input:focus-visible), .vi-chk:has(input:focus-visible), .vi-fila label:has(input:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px }
.vi input[type=radio], .vi input[type=checkbox] { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none }
.vi-op b { display: block; font-size: 13.5px } .vi-op small, .vi-fila small { display: block; color: var(--muted); font-size: 12px }
.vi-ico { flex: 0 0 34px; height: 42px; border-radius: 5px; border: 1.2px solid var(--muted); padding: 4px; display: flex; flex-direction: column; gap: 3px } .vi-ico i { display: block; height: 3px; background: var(--muted); border-radius: 2px; opacity: .5 } .vi-ico i.g { height: 4px; opacity: .85 }
.vi-fila { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 5px 0 } .vi-fila > span:first-child { min-width: 0 }
.vi-sw { flex: 0 0 38px; height: 22px; border-radius: 99px; background: var(--line); position: relative; cursor: pointer } .vi-sw::after { content: ''; position: absolute; left: 2px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .3) } .vi-sw:has(input:checked) { background: var(--accent) } .vi-sw:has(input:checked)::after { left: 18px }
.vi-in { width: min(320px, 100%); font: 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--vidrio, var(--panel)); border: 1px solid var(--line); border-radius: 10px; padding: 6px 10px }
.vi-pill { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--line); border-radius: 99px; overflow: hidden } .vi-pill label { padding: 5px 13px; font-size: 13px; cursor: pointer } .vi-pill label:has(input:checked) { background: var(--accent); color: #fff }
.vi-chk { display: inline-flex; gap: 7px; align-items: center; margin: 0 14px 6px 0; font-size: 13.5px; cursor: pointer } .vi-chk::before { content: ''; flex: 0 0 17px; height: 17px; border-radius: 5px; border: 1.5px solid var(--muted); box-sizing: border-box; display: grid; place-items: center; font-size: 12px; color: #fff } .vi-chk:has(input:checked)::before { content: '✓'; background: var(--accent); border-color: var(--accent) }
.vi-aviso { margin: 10px 0 0; padding: 8px 12px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 10%, transparent); font-size: 13px }
.vi-pie { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line) } .vi-pie button { font: 600 13.5px var(--f-ui, system-ui); border-radius: 99px; padding: 8px 18px; border: 1px solid var(--vidrio-borde, var(--line)); background: var(--vidrio, var(--panel)); color: var(--ink); cursor: pointer } .vi-pie button.vi-ok { background: var(--accent); border-color: var(--accent); color: #fff }
@media (max-width: 700px) { .vi-velo { align-items: end; padding: 0 } .vi { border-radius: 22px 22px 0 0; max-height: 92vh } .vi-dos { grid-template-columns: 1fr } }
@media print { .vi-velo { display: none !important } }
/* la hoja: opciones (clases de #hoja-imp que pone biblioteca.js) */
@media print {
  #hoja-imp .hoja-indice { break-after: page; padding-bottom: 8pt }
  #hoja-imp .hoja-indice h2.i-tit { font: italic 400 36pt/1.15 var(--i-serif); text-transform: none; letter-spacing: -.01em; color: #111; border: 0; padding: 0; margin: 4pt 0 4pt }
  #hoja-imp .hoja-indice .i-sub { color: #777; font-size: 9pt; margin: 0 0 22pt }
  #hoja-imp .hoja-indice ol { list-style: none; margin: 0; padding: 0 0 0 38pt; position: relative }
  #hoja-imp .hoja-indice ol::before { content: ''; position: absolute; left: 11pt; top: 6pt; bottom: 24pt; width: 1.2pt; background: linear-gradient(var(--accent, #555), color-mix(in srgb, var(--accent, #555) 30%, #fff)) }
  #hoja-imp .hoja-indice li { position: relative; margin: 0 0 18pt; break-inside: avoid; counter-increment: i-n }
  #hoja-imp .hoja-indice li::before { content: counter(i-n); position: absolute; left: -38pt; top: -2pt; width: 23pt; height: 23pt; border-radius: 50%; background: #fff; border: 1.5pt solid var(--accent, #555); color: var(--accent, #555); font: 600 9.5pt var(--i-sans, system-ui); display: grid; place-items: center }
  #hoja-imp .hoja-indice ol { counter-reset: i-n }
  #hoja-imp .hoja-indice li a { color: inherit; text-decoration: none }
  #hoja-imp .hoja-indice .i-t { font: 600 12.5pt var(--i-serif) } #hoja-imp .hoja-indice .i-q { font: italic 9pt/1.4 var(--i-serif); color: #666; margin: 2pt 0 3pt } #hoja-imp .hoja-indice .i-g { font: 500 6.5pt var(--i-mono); letter-spacing: .12em; text-transform: uppercase; color: #888 }
  #hoja-imp.hoja-sep section.hoja-ej { break-before: page; border-top: 0; padding-top: 0 } #hoja-imp.hoja-sep section.hoja-ej:first-of-type { break-before: auto }
  #hoja-imp.hoja-sep .hoja-indice + section.hoja-ej { break-before: auto }
  #hoja-imp.sin-enun .hoja-enun, #hoja-imp.sin-enun .stmt { display: none }
  #hoja-imp.sin-datos [data-h=datos] { display: none }
  #hoja-imp.sin-res [data-h=resultados], #hoja-imp.sin-res .result { display: none }
  #hoja-imp.sin-des [data-h=desarrollo], #hoja-imp.sin-des .steps-b, #hoja-imp.sin-des h4 { display: none }
  #hoja-imp.sin-esc [data-h=escena], #hoja-imp.sin-esc img, #hoja-imp.sin-esc canvas { display: none }
  #hoja-imp.solo-enun section.hoja-ej::after, #hoja-imp.solo-enun.uno .hoja-fin::after { content: ''; display: block; height: 7cm; margin-top: 10pt; border: .5pt dashed #bbb; border-radius: 6pt }
  #hoja-imp.bn { --accent: #222; --marca: #222 } #hoja-imp.bn img, #hoja-imp.bn canvas { filter: grayscale(1) } #hoja-imp.bn * { color: #000 !important }
}`;
  let hecho = false;
  const estilos = () => { if (hecho) return; hecho = true; const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); };

  // ----- índice en línea de tiempo (sin número de página: el navegador no sabe dónde cae cada ejercicio hasta imprimir) -----
  const indiceHTML = (titulo, sub, filas, conEnun) => `<div class="hoja-indice"><h2 class="i-tit">Índice</h2><p class="i-sub">${esc(sub)}</p><ol>${filas.map((f, i) => `<li><a href="#hoja-ej-${i + 1}"><div class="i-t">${esc(f.titulo)}</div>${conEnun && f.enun ? `<div class="i-q">${esc(f.enun)}</div>` : ''}${f.carpeta ? `<div class="i-g">${esc(f.carpeta)}</div>` : ''}</a></li>`).join('')}</ol></div>`;

  // ----- la ventana -----
  const ICO = { seg: '<i class="g"></i><i></i><i></i><i class="g"></i><i></i><i></i><i></i>', pag: '<i class="g"></i><i></i><i></i><i></i><i></i><i></i><i></i>' };
  const radios = (nombre, opciones, v) => opciones.map(([val, txt]) => `<label><input type="radio" name="${nombre}" value="${val}"${v === val ? ' checked' : ''}>${txt}</label>`).join('');
  const chk = (nombre, txt, v) => `<label class="vi-chk"><input type="checkbox" name="${nombre}"${v ? ' checked' : ''}>${txt}</label>`;

  // titulo: nombre de la herramienta (título de la hoja); items: [{ titulo, carpeta }]; accion: 'imprimir' | 'pdf'; imprime(opciones) monta la hoja y abre la impresión
  function abre({ titulo, items, accion = 'imprimir', origen = '', imprime }) {
    if (!items || !items.length || typeof imprime !== 'function') return null;
    estilos();
    const o = lee(), varios = items.length > 1, previo = document.activeElement, pdf = accion === 'pdf';
    const velo = document.createElement('div'); velo.className = 'vi-velo';
    velo.innerHTML = `<form class="vi" role="dialog" aria-modal="true" aria-labelledby="vi-t" data-origen="${esc(origen)}">
<h2 id="vi-t">${pdf ? 'Descargar PDF' : 'Imprimir hoja de ejercicios'}</h2>
<p class="vi-sub">${items.length === 1 ? '1 ejercicio seleccionado' : `${items.length} ejercicios seleccionados`} · ${esc(titulo)}</p>
<div class="vi-lista">${items.map((it, i) => `<span class="vi-ch"><b>${i + 1}</b>${esc(it.titulo)}</span>`).join('')}</div>
${varios ? `<div class="vi-sec"><h3>Disposición</h3><div class="vi-dos">
<label class="vi-op"><input type="radio" name="disposicion" value="seguidos"${o.disposicion === 'seguidos' ? ' checked' : ''}><span class="vi-ico">${ICO.seg}</span><span><b>Juntos, seguidos</b><small>Ocupa menos páginas</small></span></label>
<label class="vi-op"><input type="radio" name="disposicion" value="paginas"${o.disposicion === 'paginas' ? ' checked' : ''}><span class="vi-ico">${ICO.pag}</span><span><b>Cada ejercicio en página nueva</b><small>Fácil de separar y repartir</small></span></label></div></div>
<div class="vi-sec"><h3>Índice</h3>
<div class="vi-fila"><span><b>Añadir un índice al principio</b><small>Lista los ejercicios en una página</small></span><label class="vi-sw"><input type="checkbox" name="indice"${o.indice ? ' checked' : ''} aria-label="Añadir un índice al principio"></label></div>
<div class="vi-fila"><label for="vi-tit">Título de la hoja</label><input class="vi-in" id="vi-tit" name="titulo" value="${esc(titulo)}" maxlength="120"></div>
<div class="vi-fila"><span>Estilo del índice</span><span class="vi-pill">${radios('estilo', [['titulos', 'Solo títulos'], ['enunciado', 'Con enunciado']], o.estilo)}</span></div></div>` : `<div class="vi-sec"><div class="vi-fila"><label for="vi-tit">Título de la hoja</label><input class="vi-in" id="vi-tit" name="titulo" value="${esc(items[0].titulo)}" maxlength="120"></div></div>`}
<div class="vi-sec"><h3>Contenido</h3>${chk('enun', 'Enunciado', o.enun)}${chk('datos', 'Datos', o.datos)}${chk('res', 'Resultados', o.res)}${chk('des', 'Desarrollo paso a paso', o.des)}${chk('esc', 'Escena y gráficas', o.esc)}</div>
<div class="vi-sec"><h3>Tipo de hoja y estilo</h3><div class="vi-fila"><span class="vi-pill">${radios('tipo', [['completa', 'Solución completa'], ['enunciados', 'Solo enunciados'], ['resultados', 'Solo resultados']], o.tipo)}</span><span class="vi-pill">${radios('tinta', [['color', 'Color'], ['bn', 'Ahorrar tinta']], o.tinta)}</span></div></div>
${pdf ? '<p class="vi-aviso">Se abrirá la ventana de impresión del navegador: elige «Guardar como PDF» como destino.</p>' : ''}
<div class="vi-pie"><button type="button" data-a="cancelar">Cancelar</button><button type="submit" class="vi-ok">${pdf ? 'Descargar PDF' : 'Imprimir'}</button></div></form>`;
    document.body.appendChild(velo);
    const f = velo.querySelector('form');
    const cierra = () => { velo.remove(); document.removeEventListener('keydown', tecla, true); if (previo && previo.focus) previo.focus(); };
    const tecla = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cierra(); return; }
      if (e.key !== 'Tab') return;
      const t = [...f.querySelectorAll('input:not([type=hidden]), button')].filter((x) => !x.disabled), a = t[0], z = t[t.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', tecla, true);
    velo.addEventListener('mousedown', (e) => { if (e.target === velo) cierra(); });
    f.querySelector('[data-a=cancelar]').addEventListener('click', cierra);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(f), v = (n) => d.get(n), b = (n) => d.get(n) !== null;
      const nuevo = { disposicion: varios ? v('disposicion') : o.disposicion, indice: varios ? b('indice') : o.indice, estilo: varios ? v('estilo') : o.estilo, tipo: v('tipo'), tinta: v('tinta'), enun: b('enun'), datos: b('datos'), res: b('res'), des: b('des'), esc: b('esc') };
      guarda(nuevo);
      const titulo = (v('titulo') || '').trim();
      cierra();
      imprime({ ...nuevo, indice: varios && nuevo.indice, titulo: titulo || undefined, accion });
    });
    f.querySelector('.vi-ok').focus();
    return velo;
  }
  return { abre, indiceHTML, estilos, lee, BASE };
})();
if (typeof module !== 'undefined') module.exports = VentanaImprimir;
