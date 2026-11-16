/* =====================================================================
   «Enunciado» común a todas las herramientas con datos que guardar (como el de Electrostática):
   un apartado plegable bajo el título donde se escribe el enunciado del ejercicio. Sale al imprimir
   (la página o la «Hoja para imprimir» de Mis ejercicios) con el título «Enunciado» y, si lleva
   fórmulas entre $…$, en MathML (mates.js).
   Dónde se guarda: DENTRO del estado de la app, en el campo `_enunciado` del JSON de localStorage[guarda].
   Así viaja solo con el ejercicio: Mis ejercicios (guardar, abrir, exportar .simu.json), la copia de
   seguridad (.copia.json), el enlace (#d=…) y la hoja de impresión lo llevan sin cambiar nada en
   biblioteca.js, y los ejercicios y archivos de antes (sin el campo) siguen valiendo con enunciado vacío.
   Las apps no conocen el campo (lo ignoran o lo conservan): por eso el texto se mezcla con el estado en
   los momentos en que alguien lo lee («simu-guardar», que Mis ejercicios lanza antes de leerlo), al
   escribir, al ocultar o cerrar la página, antes de imprimir y al entrar en el modo práctica (nunca desde un
   marco: la hoja de impresión abre cada ejercicio en uno oculto).
   Cómo se pone: herramientas.js añade Enunciado.monta(carpeta, clave) a cada página con estado, salvo
   las del catálogo con `enunciado: false` (ver DISENO.md). Las funciones de arriba (de, con) no tocan el
   DOM y se prueban en Node (pruebas/enunciado.js).
   ===================================================================== */
const Enunciado = (() => {
  const CAMPO = '_enunciado', MAX = 5000;
  const objeto = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  // el enunciado dentro de un estado guardado (cadena JSON); '' si no hay o no se puede leer
  const de = (datos) => { try { const o = JSON.parse(datos); return objeto(o) && typeof o[CAMPO] === 'string' ? o[CAMPO] : ''; } catch (e) { return ''; } };
  // el mismo estado con el enunciado puesto (o quitado si está vacío); null si el estado no es un objeto JSON (no se toca)
  function con(datos, texto) {
    let o; try { o = JSON.parse(datos); } catch (e) { return null; }
    if (!objeto(o)) return null;
    const t = String(texto ?? '').slice(0, MAX);
    if (t.trim()) o[CAMPO] = t; else delete o[CAMPO];
    return JSON.stringify(o);
  }
  // sin el campo: lo que ven las apps y las pruebas de resultados
  const sin = (datos) => con(datos, '') ?? datos;

  // El texto se lee al cargar este fichero, antes que las apps (herramientas.js lo pone justo tras herramienta.js): algunas guardan su
  // estado al arrancar y lo reescriben sin el campo antes de que monta() llegue
  const INICIAL = (() => { try { return typeof Pagina !== 'undefined' && Pagina.guarda ? de(localStorage.getItem(Pagina.guarda) || '') : ''; } catch (e) { return ''; } })();
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CSS = `
.enun-bloque { max-width: 1300px; margin: 0 0 14px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px }
.enun-bloque > summary { cursor: pointer; padding: 9px 14px; font: 600 13.5px var(--f-ui, system-ui); color: var(--muted); list-style: none; display: flex; align-items: center; gap: 8px; border-radius: 12px }
.enun-bloque > summary::-webkit-details-marker { display: none }
.enun-bloque > summary::before { content: '▸'; color: var(--accent); font-size: 12px } .enun-bloque[open] > summary::before { content: '▾' }
.enun-bloque > summary:hover, .enun-bloque > summary:focus-visible { color: var(--accent) }
.enun-bloque[open] > summary { color: var(--accent) }
.enun-bloque .enun-n { margin-left: auto; font-weight: 400; font-size: 12px; color: var(--muted) }
.enun-bloque .enun-cuerpo { padding: 0 14px 12px }
.enun-bloque textarea { display: block; width: 100%; box-sizing: border-box; min-height: 4.6em; resize: vertical; font: 15px/1.5 var(--f-ui, system-ui); color: var(--ink); background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px }
.enun-bloque textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px }
.enun-bloque .enun-ayuda { margin: 6px 0 0; font-size: 12.5px; color: var(--muted) }
.enun-bloque .enun-imp { display: none }
body:has(.prac) .enun-bloque { display: none }
@media print {
  .enun-bloque { border: 0; border-left: 3px solid #555; border-radius: 0; background: none; margin: 0 0 12px; break-inside: avoid }
  .enun-bloque > summary, .enun-bloque .enun-cuerpo, .enun-bloque .enun-ayuda { display: none !important }
  .enun-bloque.vacio { display: none !important }
  .enun-bloque .enun-imp { display: block; padding: 2px 0 2px 12px; color: #000; font: 11.5pt/1.45 var(--f-ui, system-ui); white-space: pre-wrap }
  .enun-bloque .enun-imp::before { content: 'Enunciado'; display: block; font: 700 9.5pt var(--f-ui, system-ui); text-transform: uppercase; letter-spacing: .06em; color: #444; margin-bottom: 3px }
}`;

  function monta(carpeta, clave) {
    if (!clave || document.querySelector('.enun-bloque')) return null;
    const ancla = document.querySelector('main .lead, .wrap .lead, main h1, .wrap h1');
    if (!ancla) return null;
    const leeAlm = () => { try { return localStorage.getItem(clave); } catch (e) { return null; } };
    let texto = INICIAL, pendiente = false;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const sec = document.createElement('details'); sec.className = 'enun-bloque';
    sec.innerHTML = `<summary><span>Enunciado del ejercicio</span><span class="enun-n" aria-hidden="true"></span></summary>
<div class="enun-cuerpo"><textarea id="enunciado-texto" maxlength="${MAX}" rows="4" aria-label="Enunciado del ejercicio" placeholder="Escribe aquí el enunciado del ejercicio (opcional). Se guarda con el ejercicio en «Mis ejercicios» y sale al imprimir."></textarea>
<p class="enun-ayuda">Las fórmulas van entre $…$, por ejemplo $E = k·q/r^2$.</p></div>
<div class="enun-imp" aria-hidden="true"></div>`;
    ancla.after(sec);
    const area = sec.querySelector('textarea'), imp = sec.querySelector('.enun-imp'), n = sec.querySelector('.enun-n');
    // la versión para imprimir: el texto tal cual (con saltos de línea) y las fórmulas en MathML
    function pintaImp() {
      const t = texto.trim();
      sec.classList.toggle('vacio', !t);
      n.textContent = t ? (t.length > 60 ? t.slice(0, 57).replace(/\s+\S*$/, '') + '…' : t).replace(/\s+/g, ' ') : 'opcional';
      imp.innerHTML = t && typeof Mates !== 'undefined' && t.includes('$') ? Mates.html(esc(t)) : esc(t);
    }
    // mezcla el texto con el estado guardado (si la app todavía no ha guardado nada, no hay estado al que añadirlo).
    // En un marco (la hoja de impresión abre cada ejercicio en uno oculto) no escribe nunca: pisaría el estado del ejercicio siguiente
    const enMarco = window.top !== window;
    function guarda() {
      pendiente = false; if (enMarco) return;
      const datos = leeAlm(); if (datos == null) return;
      const nuevo = con(datos, texto); if (nuevo != null && nuevo !== datos) { try { localStorage.setItem(clave, nuevo); } catch (e) { /* sin almacenamiento */ } }
    }
    area.value = texto; sec.open = !!texto.trim(); pintaImp();
    area.addEventListener('input', () => { texto = area.value; pintaImp(); pendiente = true; guarda(); });
    // Mis ejercicios lanza «simu-guardar» justo antes de leer el estado (guardar, enlace, hoja); también al irse la página
    addEventListener('simu-guardar', guarda);
    addEventListener('pagehide', guarda);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') guarda(); });
    addEventListener('beforeprint', guarda);
    // el modo práctica guarda el estado de antes al entrar: que lleve el enunciado
    document.addEventListener('click', (e) => { if (e.target.closest?.('.prac-btn')) guarda(); }, true);
    return (window.EnunciadoApp = { get texto() { return texto; }, pon(t) { texto = String(t ?? '').slice(0, MAX); area.value = texto; sec.open = !!texto.trim(); pintaImp(); guarda(); }, guarda });
  }
  return { monta, de, con, sin, CAMPO, MAX };
})();
if (typeof module !== 'undefined') module.exports = Enunciado;
