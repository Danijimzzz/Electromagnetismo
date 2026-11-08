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
  const MODOS = { entero: 'Número entero entre sistemas', fraccion: 'Fracciones con coma', ieee: 'Coma flotante IEEE 754', aritmetica: 'Suma y resta en complemento a 2' };
  const campo = (k, nom, ph = '') => `<label for="f-${k}">${nom}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false"${ph ? ` placeholder="${ph}"` : ''}>`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === String(v) ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const bitsSel = () => elige('bits', 'Bits', P.BITS.map((b) => [b, `${b} bits`]));
  function formulario() {
    if (!MODOS[sc.modo]) sc.modo = 'entero';
    const m = sc.modo, cab = elige('modo', 'Qué quieres hacer', Object.entries(MODOS));
    if (m === 'fraccion') {
      $('#campos').innerHTML = cab + elige('dir', 'Sentido', [['a', 'De decimal a otra base'], ['de', 'De otra base a decimal']]) + elige('dest', 'Base', [[2, 'Binario'], [8, 'Octal'], [16, 'Hexadecimal']]) + campo('valor', sc.dir === 'de' ? 'Número en esa base' : 'Número (decimal o fracción)', sc.dir === 'de' ? '101,011' : '0,1 ó 1/3') + (sc.dir === 'de' ? '' : campo('nf', 'Dígitos que se guardan tras la coma'));
      $('#nota').textContent = 'La coma es la separadora decimal. Una fracción como 1/3 se convierte exactamente, y se detecta si la expansión se repite (periodo entre paréntesis).';
    } else if (m === 'ieee') {
      $('#campos').innerHTML = cab + elige('prec', 'Precisión', [[32, 'Simple (32 bits)'], [64, 'Doble (64 bits)']]) + campo('valor', 'Número', '0,1 ó 0x40490FDB');
      $('#nota').textContent = 'Escribe un decimal (0,1; −118,625; 1e-5), inf, nan, o un patrón en hexadecimal que empiece por 0x (8 cifras para 32 bits, 16 para 64).';
    } else if (m === 'aritmetica') {
      $('#campos').innerHTML = cab + bitsSel() + campo('a', 'Primer número (decimal)') + elige('op', 'Operación', [['+', 'Suma  a + b'], ['-', 'Resta  a − b']]) + campo('b', 'Segundo número (decimal)');
      $('#nota').textContent = 'Los números van en decimal y se pasan a complemento a 2 con el número de bits elegido. Se muestra la suma bit a bit con sus acarreos y si hay desbordamiento.';
    } else {
      $('#campos').innerHTML = cab + `<label for="f-base">Sistema de partida</label><select id="f-base" class="in" data-k="base">${opciones(P.BASES, sc.base)}</select>`
      + `<label for="f-valor">Número</label><input id="f-valor" class="in" data-k="valor" value="${esc(sc.valor ?? '')}" autocomplete="off" spellcheck="false">`
      + `<label for="f-bits">Bits del complemento a 2</label><select id="f-bits" class="in" data-k="bits">${P.BITS.map((b) => `<option value="${b}"${String(b) === String(sc.bits) ? ' selected' : ''}>${b} bits</option>`).join('')}</select>`;
      $('#nota').textContent = 'Solo números enteros. Se admiten espacios entre los grupos de bits y los prefijos 0b, 0o y 0x. En BCD, cada dígito decimal son 4 bits; en Gray, cada bit es el binario XOR el bit de su izquierda.';
    }
  }
  const lee = (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; if (['modo', 'dir'].includes(t.dataset.k) && e.type === 'change') { if (t.dataset.k === 'modo') sc = { ...nuevo(t.value), bits: sc.bits || '8' }; formulario(); } calcula(); };
  // valores de partida al cambiar de modo
  const nuevo = (m) => ({ entero: { modo: 'entero', base: 'dec', valor: '−45' }, fraccion: { modo: 'fraccion', dir: 'a', dest: '2', valor: '0,1', nf: '12' }, ieee: { modo: 'ieee', prec: '32', valor: '0,1' }, aritmetica: { modo: 'aritmetica', a: '100', b: '50', op: '+' } }[m] || { modo: 'entero', base: 'dec', valor: '−45' });
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
  const enunciado = () => sc.modo === 'fraccion' ? (sc.dir === 'de' ? `Pasa a decimal el número <b>${esc(sc.valor)}</b>, escrito en ${P.BASE_DEST[sc.dest] || 'binario'} con coma.` : `Pasa a ${P.BASE_DEST[sc.dest] || 'binario'} el número <b>${esc(sc.valor)}</b>, indicando si su expansión es finita o periódica.`)
    : sc.modo === 'ieee' ? `Escribe <b>${esc(sc.valor)}</b> en coma flotante IEEE 754 de ${sc.prec === '64' || sc.prec === 64 ? 64 : 32} bits: signo, exponente, mantisa y patrón hexadecimal.`
    : sc.modo === 'aritmetica' ? `Calcula ${esc(sc.a)} ${sc.op === '-' ? '−' : '+'} ${esc(sc.b)} en complemento a 2 con ${esc(sc.bits)} bits, indicando si hay desbordamiento.`
    : `Pasa a decimal el número <b>${esc(sc.valor)}</b>, escrito en ${P.BASES[sc.base]}${sc.base === 'c2' ? ' (el primer bit es el de signo)' : ''}.`;

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
    $('#bits').innerHTML = sol.modo ? '' : bits();
    if (sol.modo) $('#leyenda').textContent = '';
    else $('#leyenda').textContent = sol.c2 ? `Patrón de ${sol.n} bits en complemento a 2: el primer bit pesa en negativo.` : `Binario de ${Math.abs(sol.v)} (no cabe en ${sol.n} bits en complemento a 2). Cada bit a 1 suma su peso.`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('sistemas-numericos').current;
  formulario(); calcula();
  window.SistemasNumericosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { v: sol.v, modo: sol.modo || 'entero' }, estado: () => copia(sc) };
})();
