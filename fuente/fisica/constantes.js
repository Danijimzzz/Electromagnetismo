/* =====================================================================
   Constantes comunes de Física (FIS.FG-1 y FIS.UN-2).
   SI: las constantes del SI que no cambian de una edición de CODATA a otra (c, h, e, k_B, N_A, que son exactas
   por definición, y G, que sale igual en 2018 y en 2022). Es la única fuente: Unidades las usa para su tabla y las
   herramientas que las necesitan las leen de aquí en vez de escribir el número. Las que cambian con la edición
   (m_e, μ₀, ε₀…) siguen en la tabla de Unidades.
   g: la gravedad que se usa. Por defecto cada herramienta queda como está (9,8 o 9,81); quien pulsa el interruptor
   de Constantes.monta() elige 9,8, 9,81 o 9,80665 m/s² para todas (se guarda con Herramienta.ajuste, F15.4: la misma clave y
   el mismo evento, «simu-ajuste», que las masas y constantes de Química; lo guardado antes en 'fisica-constantes' se migra solo). El valor se ve siempre en el campo «Gravedad» de la herramienta.
     SI            { c, h, e, kB, NA, G }
     OPCIONES_G    ['9,8', '9,81', '9,80665']
     leer()        { g: null | '9,8' | '9,81' | '9,80665' }
     monta(el)     pinta el interruptor al final de `el` (una tarjeta de datos) y aplica la elección al campo g
   ===================================================================== */
const Constantes = (() => {
  const SI = { c: 299792458, h: 6.62607015e-34, e: 1.602176634e-19, kB: 1.380649e-23, NA: 6.02214076e23, G: 6.6743e-11 };
  const OPCIONES_G = ['9,8', '9,81', '9,80665'];
  const leer = () => { try { const g = Herramienta.ajuste.leer().g; return { g: OPCIONES_G.includes(g) ? g : null }; } catch (e) { return { g: null }; } };
  const escribe = (g) => Herramienta.ajuste.escribe({ g });
  // pone g en todos los campos «Gravedad» de la página (data-k="g" o id que acaba en «-g») y avisa a la herramienta para que recalcule
  const aplica = (g) => { if (!g) return; for (const i of document.querySelectorAll('input[data-k="g"], input[id$="-g"], input#g')) if (i.value !== g) { i.value = g; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); } };
  function monta(el) {
    if (!el) return null;
    const caja = document.createElement('div');
    caja.className = 'ajuste-clase'; caja.setAttribute('role', 'group'); caja.setAttribute('aria-label', 'Valor de la gravedad');
    caja.innerHTML = '<label class="opcion">Gravedad g para todas las herramientas de Física <select id="aj-g" class="in"><option value="">como en cada herramienta</option>' + OPCIONES_G.map((v) => `<option value="${v}">${v} m/s²</option>`).join('') + '</select></label><p class="nota" id="aj-g-valor"></p>';
    el.appendChild(caja);
    const sel = caja.querySelector('#aj-g'), nota = caja.querySelector('#aj-g-valor');
    const pinta = () => { const g = leer().g; sel.value = g || ''; nota.textContent = g ? `En uso: g = ${g} m/s² (el que aparece en el campo «Gravedad»).` : 'Cada herramienta usa su valor de partida: 9,8 o 9,81 m/s². Cámbialo aquí o en el campo «Gravedad».'; };
    sel.addEventListener('change', () => { escribe(sel.value || null); aplica(sel.value); });
    addEventListener(Herramienta.ajuste.EVENTO, pinta); pinta(); aplica(leer().g);
    return caja;
  }
  return { SI, OPCIONES_G, leer, monta, aplica };
})();
if (typeof module !== 'undefined') module.exports = Constantes;
