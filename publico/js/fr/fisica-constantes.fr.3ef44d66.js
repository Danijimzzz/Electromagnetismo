const Constantes = (() => {
  const SI = { c: 299792458, h: 6.62607015e-34, e: 1.602176634e-19, kB: 1.380649e-23, NA: 6.02214076e23, G: 6.6743e-11 };
  const OPCIONES_G = ['9,8', '9,81', '9,80665'];
  const leer = () => { try { const g = Herramienta.ajuste.leer().g; return { g: OPCIONES_G.includes(g) ? g : null }; } catch (e) { return { g: null }; } };
  const escribe = (g) => Herramienta.ajuste.escribe({ g });
  const aplica = (g) => { if (!g) return; for (const i of document.querySelectorAll('input[data-k="g"], input[id$="-g"], input#g')) if (i.value !== g) { i.value = g; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); } };
  function monta(el) {
    if (!el) return null;
    const caja = document.createElement('div');
    caja.className = 'ajuste-clase'; caja.setAttribute('role', 'group'); caja.setAttribute('aria-label', 'Valeur de la gravité');
    caja.innerHTML = '<label class="opcion">Gravité g pour tous les outils de Physique <select id="aj-g" class="in"><option value="">comme dans chaque outil</option>' + OPCIONES_G.map((v) => `<option value="${v}">${v} m/s²</option>`).join('') + '</select></label><p class="nota" id="aj-g-valor"></p>';
    el.appendChild(caja);
    const sel = caja.querySelector('#aj-g'), nota = caja.querySelector('#aj-g-valor');
    const pinta = () => { const g = leer().g; sel.value = g || ''; nota.textContent = g ? `Utilisée : g = ${g} m/s² (celle qui apparaît dans le champ « Gravité »).` : 'Chaque outil utilise sa valeur de départ : 9,8 ou 9,81 m/s². Modifie-la ici ou dans le champ « Gravité ».'; };
    sel.addEventListener('change', () => { escribe(sel.value || null); aplica(sel.value); });
    addEventListener(Herramienta.ajuste.EVENTO, pinta); pinta(); aplica(leer().g);
    return caja;
  }
  return { SI, OPCIONES_G, leer, monta, aplica };
})();

