const Ajuste = (() => {
  const DEF = { masas: false, constantes: true };
  const EVENTO = () => Herramienta.ajuste.EVENTO;
  const guardado = () => Herramienta.ajuste.leer().masas !== undefined;
  const leer = (def = DEF) => {
    const g = Herramienta.ajuste.leer();
    return g.masas !== undefined ? { masas: !!g.masas, constantes: g.constantes !== false } : { ...DEF, ...def };
  };
  const valores = (def) => {
    const a = leer(def);
    return { ...a, R: a.constantes ? 8.314 : 8.314462618, Ratm: a.constantes ? 0.082 : 0.082057366, Rbar: a.constantes ? 0.083145 : 0.08314462618, F: a.constantes ? 96500 : 96485.33212 };
  };
  const texto = (x) => String(x).replace('.', ',');
  const escribe = (a) => Herramienta.ajuste.escribe({ masas: !!a.masas, constantes: a.constantes !== false });
  function monta(el, opc = {}) {
    const hay = (id) => `<label class="opcion"><input type="checkbox" id="${id}"> `;
    const caja = document.createElement('div');
    caja.className = 'ajuste-clase'; caja.setAttribute('role', 'group'); caja.setAttribute('aria-label', 'Konstanten und Massen aus dem Unterricht oder exakte');
    caja.innerHTML = (opc.constantes === false ? '' : `${hay('aj-const')}Konstanten „wie im Unterricht“ (R = 8,314 J/(mol·K), 0,082 atm·L/(mol·K)${opc.F === false ? '' : ', F = 96 500 C/mol'}); ohne Haken die exakten</label>`)
      + (opc.masas === false ? '' : `${hay('aj-masas')}Massen „wie im Unterricht“ (Cl = 35,5; Cu = 63,5; übrige ganzzahlig); ohne Haken die aus dem Periodensystem</label>`)
      + '<p class="nota" id="aj-valor"></p>';
    el.appendChild(caja);
    const pinta = () => {
      const a = leer(opc.def), v = valores(opc.def);
      const c = caja.querySelector('#aj-const'), m = caja.querySelector('#aj-masas');
      if (c) c.checked = a.constantes; if (m) m.checked = a.masas;
      caja.querySelector('#aj-valor').textContent = `En uso: ${opc.constantes === false ? '' : `R = ${texto(v.R)} J/(mol·K), ${texto(v.Ratm)} atm·L/(mol·K)${opc.F === false ? '' : `, F = ${texto(v.F)} C/mol`}`}${opc.constantes === false || opc.masas === false ? '' : '; '}${opc.masas === false ? '' : (a.masas ? 'masas de clase' : 'exakte Massen des Periodensystems')}.`;
    };
    caja.addEventListener('change', () => { escribe({ masas: caja.querySelector('#aj-masas') ? caja.querySelector('#aj-masas').checked : leer(opc.def).masas, constantes: caja.querySelector('#aj-const') ? caja.querySelector('#aj-const').checked : leer(opc.def).constantes }); });
    addEventListener(EVENTO(), pinta); pinta();
    return caja;
  }
  return { leer, valores, texto, monta, escribe, guardado };
})();

