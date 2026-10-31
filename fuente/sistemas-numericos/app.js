/* =====================================================================
   Sistemas de numeración · interfaz: sistema de partida, número y bits,
   ejemplos, resultados en todos los sistemas, los bits con su peso y el
   desarrollo. El cálculo está en sistemas-numericos/calculo.js (SistemasNumericos);
   los ayudantes comunes ($, esc, copia) en herramienta.js.
   Guarda el estado entero (sc) en localStorage[CLAVE] en cada cambio: es lo
   que copia Mis ejercicios (biblioteca.js). Expone window.SistemasNumericosApp
   para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const P = SistemasNumericos, CLAVE = 'sistemas-numericos-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null;

  /* ---------- Formulario ---------- */
  const opciones = (obj, sel) => Object.entries(obj).map(([k, n]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${n}</option>`).join('');
  function formulario() {
    $('#campos').innerHTML = `<label for="f-base">Sistema de partida</label><select id="f-base" class="in" data-k="base">${opciones(P.BASES, sc.base)}</select>`
      + `<label for="f-valor">Número</label><input id="f-valor" class="in" data-k="valor" value="${esc(sc.valor ?? '')}" autocomplete="off" spellcheck="false">`
      + `<label for="f-bits">Bits del complemento a 2</label><select id="f-bits" class="in" data-k="bits">${P.BITS.map((b) => `<option value="${b}"${String(b) === String(sc.bits) ? ' selected' : ''}>${b} bits</option>`).join('')}</select>`;
    $('#nota').textContent = 'Solo números enteros. Se admiten espacios entre los grupos de bits y los prefijos 0b y 0x. En BCD, cada dígito decimal son 4 bits.';
  }
  const lee = (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', lee);
  $('#campos').addEventListener('change', lee);

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar para el modo práctica: pasar a decimal
  const azar = () => { sc = P.azar(); formulario(); calcula(); sel.value = ''; };
  const enunciado = () => `Pasa a decimal el número <b>${esc(sc.valor)}</b>, escrito en ${P.BASES[sc.base]}${sc.base === 'c2' ? ' (el primer bit es el de signo)' : ''}.`;

  /* ---------- Resultados ---------- */
  const dato = (f) => `<div${f.k === 'dec' ? ' class="pr"' : ''}><span>${f.t}</span><b>${esc(f.v)}</b></div>`;
  // los bits del patrón en C2 (o los del binario si no cabe) con el peso de cada uno
  function bits() {
    const b = sol.c2 || sol.bm.padStart(Math.ceil(sol.bm.length / 4) * 4, '0'), L = b.length, c2 = !!sol.c2;
    return `<div class="bits">` + [...b].map((x, i) => {
      const e = L - 1 - i, peso = c2 && i === 0 ? `−2<sup>${e}</sup>` : `2<sup>${e}</sup>`;
      return `<div class="bit${x === '1' ? ' uno' : ''}${(i + 1) % 4 === 0 && i < L - 1 ? ' fin' : ''}"><small>${peso}</small><b>${x}</b></div>`;
    }).join('') + `</div>`;
  }
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#bits').innerHTML = ''; $('#leyenda').textContent = ''; return;
    }
    err.hidden = true; guarda();
    $('#resumen').innerHTML = sol.filas.map(dato).join('');
    $('#bits').innerHTML = bits();
    $('#leyenda').textContent = sol.c2 ? `Patrón de ${sol.n} bits en complemento a 2: el primer bit pesa en negativo.` : `Binario de ${Math.abs(sol.v)} (no cabe en ${sol.n} bits en complemento a 2). Cada bit a 1 suma su peso.`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('sistemas-numericos').current;
  formulario(); calcula();
  window.SistemasNumericosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { v: sol.v }, estado: () => copia(sc) };
})();
