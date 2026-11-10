/* =====================================================================
   Ajuste común de Química (QU-3): constantes y masas «de clase» o exactas.
   Lo leen Equilibrio, Cinética, Redox, Masa molar y Gases (Física general) y lo cambia el interruptor
   que monta Ajuste.monta() en cada una; se guarda en localStorage['quimica-ajuste']
   y avisa a las demás con el evento «quimica-ajuste» de window.
     leer()      { masas, constantes }: masas = true → Cl 35,5, Cu 63,5…; constantes = true →
                 R = 8,314 J/(mol·K), 0,082 atm·L/(mol·K) y F = 96 500 C/mol (por defecto)
     valores()   además R, Ratm, Rbar y F con el número ya elegido (exactos de CODATA 2018 si no)
     monta(el, { masas, constantes, F })  pinta las casillas en el elemento; F: false no nombra la constante
                 de Faraday (Gases, que solo usa R)
     texto(x)    un número con coma decimal para los desarrollos
   ===================================================================== */
const Ajuste = (() => {
  const CLAVE = 'quimica-ajuste';
  const DEF = { masas: false, constantes: true };
  // def: lo que vale si nadie ha tocado el ajuste (Equilibrio y Cinética arrancan «de clase»; Redox, exactas)
  const guardado = () => { try { return !!JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { return false; } };
  const leer = (def = DEF) => {
    try { const g = JSON.parse(localStorage.getItem(CLAVE)); return g ? { masas: !!g.masas, constantes: g.constantes !== false } : { ...DEF, ...def }; } catch (e) { return { ...DEF, ...def }; }
  };
  const valores = (def) => {
    const a = leer(def);
    return { ...a, R: a.constantes ? 8.314 : 8.314462618, Ratm: a.constantes ? 0.082 : 0.082057366, Rbar: a.constantes ? 0.083145 : 0.08314462618, F: a.constantes ? 96500 : 96485.33212 };
  };
  const texto = (x) => String(x).replace('.', ',');
  function escribe(a) {
    try { localStorage.setItem(CLAVE, JSON.stringify(a)); } catch (e) { /* sin almacenamiento */ }
    try { dispatchEvent(new Event('quimica-ajuste')); } catch (e) { /* sin ventana */ }
  }
  // Pinta las casillas dentro de `el` (un elemento): la de constantes y/o la de masas. Devuelve el elemento creado.
  function monta(el, opc = {}) {
    const hay = (id) => `<label class="opcion"><input type="checkbox" id="${id}"> `;
    const caja = document.createElement('div');
    caja.className = 'ajuste-clase'; caja.setAttribute('role', 'group'); caja.setAttribute('aria-label', 'Constantes y masas de clase o exactas');
    caja.innerHTML = (opc.constantes === false ? '' : `${hay('aj-const')}Constantes «de clase» (R = 8,314 J/(mol·K), 0,082 atm·L/(mol·K)${opc.F === false ? '' : ', F = 96 500 C/mol'}); sin marcar, las exactas</label>`)
      + (opc.masas === false ? '' : `${hay('aj-masas')}Masas «de clase» (Cl = 35,5; Cu = 63,5; resto enteras); sin marcar, las de la tabla periódica</label>`)
      + '<p class="nota" id="aj-valor"></p>';
    el.appendChild(caja);
    const pinta = () => {
      const a = leer(opc.def), v = valores(opc.def);
      const c = caja.querySelector('#aj-const'), m = caja.querySelector('#aj-masas');
      if (c) c.checked = a.constantes; if (m) m.checked = a.masas;
      caja.querySelector('#aj-valor').textContent = `En uso: ${opc.constantes === false ? '' : `R = ${texto(v.R)} J/(mol·K), ${texto(v.Ratm)} atm·L/(mol·K)${opc.F === false ? '' : `, F = ${texto(v.F)} C/mol`}`}${opc.constantes === false || opc.masas === false ? '' : '; '}${opc.masas === false ? '' : (a.masas ? 'masas de clase' : 'masas exactas de la tabla periódica')}.`;
    };
    caja.addEventListener('change', () => { escribe({ masas: caja.querySelector('#aj-masas') ? caja.querySelector('#aj-masas').checked : leer(opc.def).masas, constantes: caja.querySelector('#aj-const') ? caja.querySelector('#aj-const').checked : leer(opc.def).constantes }); });
    addEventListener('quimica-ajuste', pinta); pinta();
    return caja;
  }
  return { leer, valores, texto, monta, escribe, guardado };
})();
if (typeof module !== 'undefined') module.exports = Ajuste;
