/* =====================================================================
   Tabla periódica interactiva: rejilla de 18 grupos, colores por categoría
   o por propiedad, buscador, ficha del elemento elegido (#Fe en la
   dirección) con enlaces a Configuración electrónica y Masa molar,
   comparación de hasta tres elementos y preguntas para practicar.
   Los datos están en quimica/elementos.js.
   ===================================================================== */
(() => {
  const E = Elementos, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const coma = (x, d) => (x == null ? '—' : (d == null ? String(x) : x.toFixed(d)).replace('.', ','));
  const PROPS = {
    en: { nombre: 'Electronegatividad', v: (e) => e.en, f: (x) => coma(x, 2), u: '' },
    ei: { nombre: '1.ª energía de ionización', v: (e) => e.ei, f: (x) => coma(x), u: 'kJ/mol' },
    radio: { nombre: 'Radio atómico', v: (e) => e.radio, f: (x) => coma(x), u: 'pm' },
    masa: { nombre: 'Masa atómica', v: (e) => e.masa, f: (x) => coma(x), u: 'u' },
    ae: { nombre: 'Afinidad electrónica', v: (e) => e.ae, f: (x) => coma(x), u: 'kJ/mol' },
    densidad: { nombre: 'Densidad', v: (e) => e.densidad, f: (x) => coma(+x.toPrecision(3)), u: 'g/cm³' },
    fusion: { nombre: 'Punto de fusión', v: (e) => e.fusion, f: (x) => coma(Math.round(x)), u: '°C' },
    ebullicion: { nombre: 'Punto de ebullición', v: (e) => e.ebullicion, f: (x) => coma(Math.round(x)), u: '°C' },
  };
  const BLOQUES = { s: '#e07a5f', p: '#3d8bbd', d: '#d9a441', f: '#8e6fc1' };
  const ESTADOS = { gas: '#5aa9e6', 'líquido': '#2bb39a', 'sólido': '#9aa5ad' };
  let modo = 'cat', sel = null, filtroCat = null, T = 298;
  try { modo = localStorage.getItem('tabla-color') || 'cat'; } catch (e) { /* sin almacenamiento */ }

  const tabla = $('#tabla'), celdas = {};
  // fila 1: números de grupo; filas 2–8: periodos; 9: separación; 10–11: lantánidos y actínidos
  const filaRej = (f) => (f <= 7 ? f + 1 : f + 1);
  for (let g = 1; g <= 18; g++) { const d = document.createElement('div'); d.className = 'grupo-h'; d.style.gridRow = 1; d.style.gridColumn = g; d.textContent = g; tabla.append(d); }
  for (const e of E.lista) {
    const b = document.createElement('button');
    b.className = 'el'; b.type = 'button';
    b.style.gridRow = filaRej(e.fila); b.style.gridColumn = e.col;
    b.innerHTML = `<span class="z">${e.Z}</span><span class="s">${e.simbolo}</span><span class="v"></span>`;
    b.title = `${e.nombre} (${e.Z})`; b.setAttribute('aria-label', `${e.nombre}, número atómico ${e.Z}`);
    b.addEventListener('click', () => elige(e.Z));
    tabla.append(b); celdas[e.Z] = b;
  }
  for (const [fila, txt] of [[6, '57–71'], [7, '89–103']]) {
    const d = document.createElement('div'); d.className = 'el hueco'; d.style.gridRow = filaRej(fila); d.style.gridColumn = 3; d.textContent = txt; tabla.append(d);
  }

  // estado de un elemento a T kelvin con los puntos de fusión y ebullición de la tabla (a 1 atm); sin datos, null
  const estadoA = (e, K) => (e.fusion == null || e.ebullicion == null ? null : K < e.fusion + 273.15 ? 'sólido' : K < e.ebullicion + 273.15 ? 'líquido' : 'gas');
  const INI = { 'sólido': 'S', 'líquido': 'L', gas: 'G' };
  function pinta() {
    const p = PROPS[modo], vals = p ? E.lista.map(p.v).filter((x) => x != null) : [];
    const lo = Math.min(...vals), hi = Math.max(...vals);
    for (const e of E.lista) {
      const c = celdas[e.Z], v = c.querySelector('.v');
      let fondo, osc = false;
      if (modo === 'cat') { fondo = `var(--c-${e.cat})`; v.textContent = e.nombre; }
      else if (modo === 'bloque') { const b = E.bloque(e.Z); fondo = `color-mix(in srgb, ${BLOQUES[b]} 35%, var(--panel))`; v.textContent = b; }
      else if (modo === 'estado') { fondo = e.estado ? `color-mix(in srgb, ${ESTADOS[e.estado]} 35%, var(--panel))` : 'var(--bg)'; v.textContent = e.estado || '?'; }
      else if (modo === 'temperatura') { const st = estadoA(e, T); fondo = st ? `color-mix(in srgb, ${ESTADOS[st]} 35%, var(--panel))` : 'var(--bg)'; v.textContent = st ? `${INI[st]} · ${st}` : '?'; }
      else {
        const x = p.v(e);
        const t = x == null ? 0 : (x - lo) / (hi - lo || 1);
        fondo = x == null ? 'var(--bg)' : `color-mix(in srgb, var(--heat) ${Math.round(8 + 80 * t)}%, var(--panel))`;
        osc = t > 0.55;
        v.textContent = x == null ? '—' : p.f(x);
      }
      c.style.setProperty('--cell', fondo);
      c.classList.toggle('osc', osc);
      c.classList.toggle('apagado', !!filtroCat && e.cat !== filtroCat);
    }
    const ley = $('#leyenda');
    if (modo === 'cat') ley.innerHTML = Object.entries(E.CATEGORIAS).map(([k, n]) => `<button data-cat="${k}" class="${filtroCat === k ? 'on' : ''}"><b style="background:var(--c-${k})"></b>${n}</button>`).join('');
    else if (modo === 'bloque') ley.innerHTML = Object.entries(BLOQUES).map(([k, c]) => `<span><b style="background:color-mix(in srgb, ${c} 35%, var(--panel))"></b> bloque ${k}</span>`).join('');
    else if (modo === 'temperatura') {
      const n = { 'sólido': 0, 'líquido': 0, gas: 0, '?': 0 }; for (const e of E.lista) n[estadoA(e, T) || '?']++;
      ley.innerHTML = Object.entries(ESTADOS).map(([k, c]) => `<span><b style="background:color-mix(in srgb, ${c} 35%, var(--panel))"></b> ${INI[k]} · ${k}: ${n[k]}</span>`).join('') + `<span>? sin datos: ${n['?']}</span><span>a 1 atm, con los puntos de fusión y ebullición de la ficha</span>`;
    }
    else if (modo === 'estado') ley.innerHTML = Object.entries(ESTADOS).map(([k, c]) => `<span><b style="background:color-mix(in srgb, ${c} 35%, var(--panel))"></b> ${k}</span>`).join('') + '<span>? desconocido</span>';
    else ley.innerHTML = `<span>${p.nombre}:</span><span>${p.f(lo)}</span><span class="escala"></span><span>${p.f(hi)} ${p.u}</span><span>· gris: sin datos</span>`;
    ley.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { filtroCat = filtroCat === b.dataset.cat ? null : b.dataset.cat; pinta(); }));
  }

  function ficha(e) {
    const c = celdas[e.Z];
    const masa = e.masaEstable ? `[${e.masa}]` : coma(e.masa);
    $('#ficha').innerHTML = `
      <div class="cab"><div class="grande${c.classList.contains('osc') ? ' osc' : ''}" style="--cell:${c.style.getPropertyValue('--cell')}"><span>${e.Z}</span><b>${e.simbolo}</b></div>
      <div><h2>${esc(e.nombre)}</h2><div class="cat">${e.categoria}</div></div></div>
      <dl>
        <dt>Número atómico</dt><dd>${e.Z}</dd>
        <dt>Masa atómica</dt><dd>${masa} u${e.masaEstable ? ' (isótopo más estable)' : ''}</dd>
        <dt>Masa molar</dt><dd>${e.masaEstable ? '—' : coma(e.masa) + ' g/mol'}</dd>
        <dt>Grupo</dt><dd>${e.grupo ?? (e.Z < 89 ? 'lantánidos' : 'actínidos')}</dd>
        <dt>Periodo</dt><dd>${e.periodo}</dd>
        <dt>Bloque</dt><dd>${E.bloque(e.Z)}</dd>
        <dt>Configuración</dt><dd class="conf">${E.abreviada(e.Z)}</dd>
        <dt>Completa</dt><dd class="conf">${E.texto(E.configuracion(e.Z))}</dd>
        ${valenciaFicha(e)}
        <dt>Electrones por capa</dt><dd class="capas">${E.capas(e.Z).map((k, i) => `<span>${'KLMNOPQ'[i]} ${k}</span>`).join('')}</dd>
        <dt>Electronegatividad</dt><dd>${coma(e.en, e.en == null ? null : 2)}</dd>
        <dt>1.ª ionización</dt><dd>${e.ei == null ? '—' : coma(e.ei) + ' kJ/mol'}</dd>
        <dt>Radio atómico</dt><dd>${e.radio == null ? '—' : coma(e.radio) + ' pm'}</dd>
        <dt>Afinidad electrónica</dt><dd>${e.aeInestable ? 'no forma un anión estable' : e.ae == null ? '—' : coma(e.ae) + ' kJ/mol'}</dd>
        <dt>Estados de oxidación</dt><dd>${e.oxidacion || '—'}</dd>
        <dt>Estado a 25 °C</dt><dd>${e.estado || 'desconocido'}</dd>
        ${modo === 'temperatura' ? `<dt>Estado a ${T} K</dt><dd>${estadoA(e, T) || 'sin datos'}</dd>` : ''}
        <dt>Densidad</dt><dd>${dens(e)}</dd>
        <dt>Punto de fusión</dt><dd>${temp(e.fusion)}</dd>
        <dt>Punto de ebullición</dt><dd>${temp(e.ebullicion)}</dd>
      </dl>
      ${NOTA_F[e.Z] ? `<p class="nota">${NOTA_F[e.Z]}</p>` : ''}
      ${e.Z > 100 ? '<p class="nota">Elemento sintético de vida muy corta: la configuración es la prevista y casi no hay propiedades medidas.</p>' : ''}
      <div class="acciones"><a class="btn" href="../configuracion-electronica/#${e.simbolo}">Configuración y Zef</a><a class="btn" href="../masa-molar/#${e.simbolo}">Masa molar</a><button class="btn" type="button" id="comparar"${comp.includes(e.Z) ? ' disabled' : ''}>${comp.includes(e.Z) ? 'Ya en la comparación' : comp.length >= 3 ? 'Comparar (cambia el primero)' : 'Comparar'}</button></div>`;
    $('#comparar').addEventListener('click', () => compara(e.Z));
  }
  /* Capa de valencia (TP-3): configuración abreviada, electrones de valencia y desapareados con Configuracion, e iones habituales
     (los estados de oxidación de la ficha: cationes de metales y aniones de los grupos 15–17) con su configuración */
  const sup = (k, sg) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]) + sg;
  function ionesHabituales(e) {
    const out = [], q = new Set();
    if (['a', 't', 'm', 'p', 'l', 'c'].includes(e.cat)) for (const m of String(e.oxidacion || '').matchAll(/\+(\d)/g)) if (+m[1] >= 1 && +m[1] <= 4 && e.Z > +m[1]) q.add(+m[1]);
    if (e.grupo >= 15 && e.grupo <= 17 && ['n', 'h'].includes(e.cat)) q.add(-(18 - e.grupo));
    for (const c of [...q].sort((a, b) => a - b)) {
      let a; try { a = Configuracion.analizar(e.simbolo, c); } catch (err) { continue; }
      out.push(`<span class="ion">${e.simbolo}<sup>${c > 0 ? (c > 1 ? c : '') + '+' : (c < -1 ? -c : '') + '−'}</sup>: ${a.abreviada || '—'}${a.desapareados ? ` · ${a.desapareados} desapareado${a.desapareados > 1 ? 's' : ''}` : ''}</span>`);
    }
    return out;
  }
  function valenciaFicha(e) {
    if (e.Z > 118) return '';
    const a = Configuracion.analizar(e.simbolo), ions = ionesHabituales(e);
    return `<dt>Capa de valencia</dt><dd class="conf">${a.valencia.texto || '—'}</dd>
        <dt>Electrones de valencia</dt><dd>${a.valencia.n}</dd>
        <dt>Desapareados</dt><dd>${a.desapareados} (${a.magnetismo})</dd>
        <dt>Iones habituales</dt><dd>${ions.length ? ions.join('<br>') : 'no forma iones sencillos'}</dd>`;
  }
  const dens = (e) => (e.densidad == null ? '—' : e.estado === 'gas' ? `${coma(+(e.densidad * 1000).toPrecision(4))} g/L (gas, a 0 °C y 1 atm)` : `${coma(+e.densidad.toPrecision(4))} g/cm³`);
  const temp = (t) => (t == null ? '—' : `${coma(t).replace('-', '−')} °C (${coma(+(t + 273.15).toFixed(t % 1 ? 2 : 0))} K)`);
  // lantano, actinio, lutecio y laurencio: dónde va el grupo 3 se ha discutido
  const NOTA_F = {
    57: 'Aquí el lantano va en el bloque f, con los lantánidos. Según la recomendación de la IUPAC el grupo 3 es Sc, Y, Lu, Lr; muchos libros ponen La y Ac en su lugar. Su configuración, [Xe] 5d¹ 6s², no tiene electrones 4f.',
    89: 'Aquí el actinio va en el bloque f, con los actínidos. Según la recomendación de la IUPAC el grupo 3 es Sc, Y, Lu, Lr; muchos libros ponen La y Ac en su lugar.',
    71: 'El lutecio cierra los lantánidos con la 4f llena ([Xe] 4f¹⁴ 5d¹ 6s²). Por eso la IUPAC lo pone en el grupo 3, debajo del itrio; muchos libros ponen ahí el lantano.',
    103: 'El laurencio cierra los actínidos. Como el lutecio, la IUPAC lo pone en el grupo 3; muchos libros ponen ahí el actinio.',
  };

  /* ---------- Comparar hasta tres elementos ---------- */
  let comp = [];
  const FILAS_C = [
    ['Número atómico', (e) => e.Z], ['Masa atómica (u)', (e) => e.masa], ['Electronegatividad', (e) => e.en], ['1.ª ionización (kJ/mol)', (e) => e.ei],
    ['Afinidad electrónica (kJ/mol)', (e) => (e.aeInestable ? null : e.ae)], ['Radio atómico (pm)', (e) => e.radio], ['Densidad (g/cm³)', (e) => e.densidad],
    ['Punto de fusión (°C)', (e) => e.fusion], ['Punto de ebullición (°C)', (e) => e.ebullicion],
  ];
  function compara(Z) { if (comp.includes(Z)) return; comp.push(Z); if (comp.length > 3) comp.shift(); muestraComp(); ficha(E.lista[Z - 1]); }
  function muestraComp() {
    const c = $('#comparacion');
    c.hidden = !comp.length;
    if (!comp.length) return;
    const els = comp.map((z) => E.lista[z - 1]), num = (x) => (x == null ? '—' : coma(+x.toPrecision(4)).replace('-', '−'));
    c.innerHTML = `<h2>Comparación</h2><div class="tablawrap"><table><thead><tr><th></th>${els.map((e) => `<th>${e.simbolo} · ${esc(e.nombre)} <button class="quita" type="button" data-quita="${e.Z}" aria-label="Quitar ${esc(e.nombre)}">×</button></th>`).join('')}</tr></thead><tbody>
      ${FILAS_C.map(([n, v]) => { const xs = els.map(v), ok = xs.filter((x) => x != null), mx = ok.length > 1 ? Math.max(...ok) : null; return `<tr><td>${n}</td>${xs.map((x) => `<td${x != null && x === mx ? ' class="max"' : ''}>${num(x)}</td>`).join('')}</tr>`; }).join('')}
      <tr><td>Configuración</td>${els.map((e) => `<td class="conf">${E.abreviada(e.Z)}</td>`).join('')}</tr>
      <tr><td>Estados de oxidación</td>${els.map((e) => `<td>${e.oxidacion || '—'}</td>`).join('')}</tr></tbody></table></div>
      <p class="nota">En negrita, el mayor de cada fila.${comp.length < 3 ? ' Elige otro elemento y pulsa «Comparar» para añadirlo.' : ''}</p>`;
    c.querySelectorAll('[data-quita]').forEach((b) => b.addEventListener('click', () => { comp = comp.filter((z) => z !== +b.dataset.quita); muestraComp(); if (sel) ficha(E.lista[sel - 1]); }));
  }

  /* ---------- Preguntas para practicar ---------- */
  const SUPN = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
  // una configuración en un conjunto ordenado de orbitales: «[Ar] 4s2 3d6» = «[Ar] 3d⁶ 4s²»
  const confNorm = (t) => { const x = String(t).replace(/[⁰-⁹¹²³]/g, (c) => SUPN[c]).replace(/\s+/g, ''), core = (/^\[(\w+)\]/.exec(x) || [])[1] || ''; return core.toLowerCase() + '|' + [...x.replace(/^\[\w+\]/, '').matchAll(/(\d[spdf])(\d+)/gi)].map((m) => m[1].toLowerCase() + m[2]).sort().join(' '); };
  const valencia = (e) => (e.grupo === 18 ? (e.Z === 2 ? 2 : 8) : e.grupo <= 2 ? e.grupo : e.grupo - 10);
  let preg = null;
  function pregunta() {
    const azar = (xs) => xs[Math.floor(Math.random() * xs.length)], hasta = (n) => E.lista.filter((e) => e.Z <= n);
    const princ = hasta(56).filter((e) => e.grupo && (e.grupo <= 2 || e.grupo >= 13));
    const tipos = [
      () => { const e = azar(hasta(56)); return { t: `¿Cómo se llama el elemento de símbolo <b>${e.simbolo}</b>?`, ok: (r) => norm(r) === norm(e.nombre), sol: e.nombre, Z: e.Z }; },
      () => { const e = azar(hasta(56)); return { t: `¿Cuál es el símbolo del <b>${e.nombre.toLowerCase()}</b>?`, ok: (r) => r.trim() === e.simbolo, sol: e.simbolo, Z: e.Z }; },
      () => { const e = azar(hasta(86).filter((x) => x.grupo)); return { t: `¿En qué grupo y periodo está el <b>${e.nombre.toLowerCase()}</b> (${e.simbolo})? Escribe los dos números, por ejemplo 8 y 4.`, ok: (r) => { const n = (r.match(/\d+/g) || []).map(Number); return n[0] === e.grupo && n[1] === e.periodo; }, sol: `grupo ${e.grupo}, periodo ${e.periodo}`, Z: e.Z }; },
      () => { const e = azar(hasta(36).filter((x) => x.Z > 2)); return { t: `Escribe la configuración electrónica abreviada del <b>${e.nombre.toLowerCase()}</b> (${e.simbolo}), por ejemplo [Ne] 3s2 3p4.`, ok: (r) => confNorm(r) === confNorm(E.abreviada(e.Z)), sol: E.abreviada(e.Z), Z: e.Z }; },
      () => { const e = azar(princ); return { t: `¿Cuántos electrones de valencia tiene el <b>${e.nombre.toLowerCase()}</b> (${e.simbolo})?`, ok: (r) => +r.trim() === valencia(e), sol: String(valencia(e)), Z: e.Z }; },
      () => {
        const [k, nom, mas] = azar([['en', 'electronegatividad', 'más'], ['ei', 'energía de ionización', 'más'], ['radio', 'radio atómico', 'más']]);
        const a = azar(princ.filter((x) => x[k] != null)), vec = princ.filter((x) => x !== a && x[k] != null && x[k] !== a[k] && (x.grupo === a.grupo || x.periodo === a.periodo));
        if (!vec.length) return null;
        const b = azar(vec), g = a[k] > b[k] ? a : b;
        return { t: `¿Cuál tiene ${mas} ${nom}, el <b>${a.simbolo}</b> o el <b>${b.simbolo}</b>? Escribe el símbolo.`, ok: (r) => r.trim() === g.simbolo, sol: `${g.simbolo} (${a.simbolo}: ${PROPS[k].f(a[k])}, ${b.simbolo}: ${PROPS[k].f(b[k])} ${PROPS[k].u})`.replace(/ \)/, ')'), Z: g.Z };
      },
    ];
    do preg = azar(tipos)(); while (!preg);
    $('#q-texto').innerHTML = preg.t; $('#q-resp').value = ''; $('#q-res').textContent = ''; $('#q-res').className = 'q-res';
  }
  function corrige() {
    if (!preg) return;
    const r = $('#q-resp').value, bien = !!r.trim() && preg.ok(r);
    $('#q-res').textContent = bien ? '¡Bien!' : r.trim() ? 'No es eso. Prueba otra vez o mira la solución.' : 'Escribe una respuesta.';
    $('#q-res').className = 'q-res ' + (bien ? 'bien' : 'mal');
  }
  $('#q-otra').addEventListener('click', pregunta);
  $('#q-comprobar').addEventListener('click', corrige);
  $('#q-resp').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') corrige(); });
  $('#q-sol').addEventListener('click', () => { if (!preg) return; $('#q-res').textContent = 'Solución: ' + preg.sol; $('#q-res').className = 'q-res'; elige(preg.Z); });
  function elige(Z, conHash = true) {
    if (sel) celdas[sel].classList.remove('sel');
    sel = Z; celdas[Z].classList.add('sel');
    ficha(E.lista[Z - 1]);
    if (conHash) try { history.replaceState(null, '', '#' + E.lista[Z - 1].simbolo); } catch (e) { /* file:// */ }
  }

  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  $('#buscar').addEventListener('input', (ev) => {
    const q = norm(ev.target.value);
    let primero = null;
    for (const e of E.lista) {
      const ok = !q || String(e.Z) === q || norm(e.simbolo) === q || norm(e.nombre).startsWith(q) || (q.length > 2 && norm(e.nombre).includes(q));
      celdas[e.Z].classList.toggle('apagado', !ok || (!!filtroCat && e.cat !== filtroCat));
      if (ok && q && !primero) primero = e.Z;
    }
    if (primero) elige(primero);
  });
  const ctl = $('#ctl-temp');
  function fijaT(K) {
    T = Math.min(6000, Math.max(0, Math.round(+K) || 0)); $('#temp').value = T; $('#temp-n').value = T;
    $('#temp-txt').textContent = `= ${coma(+(T - 273.15).toFixed(2))} °C`.replace('= -', '= −');
    if (modo === 'temperatura') { pinta(); if (sel) ficha(E.lista[sel - 1]); }
  }
  $('#temp').addEventListener('input', (ev) => fijaT(ev.target.value));
  $('#temp-n').addEventListener('input', (ev) => { if (ev.target.value !== '') fijaT(ev.target.value); });
  $('#temp').setAttribute('aria-label', 'Temperatura en kelvin');
  const sc = $('#color');
  if (modo === 'temperatura') { ctl.hidden = false; }
  sc.value = modo; fijaT(T);
  sc.addEventListener('change', () => { modo = sc.value; ctl.hidden = modo !== 'temperatura'; if (modo === 'temperatura') fijaT(T); filtroCat = null; try { localStorage.setItem('tabla-color', modo); } catch (e) { /* sin almacenamiento */ } pinta(); if (sel) ficha(E.lista[sel - 1]); });
  // flechas del teclado para moverse por la tabla
  tabla.addEventListener('keydown', (ev) => {
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[ev.key];
    if (!d || !sel) return;
    const a = E.lista[sel - 1], dest = E.lista.find((e) => e.fila === a.fila + d[0] && e.col === a.col + d[1]);
    if (dest) { ev.preventDefault(); elige(dest.Z); celdas[dest.Z].focus(); }
  });
  const ver = $('#ver'); if (ver) ver.textContent = Version.de('tabla-periodica').current;
  pinta();
  const h = decodeURIComponent(location.hash.slice(1));
  elige((E.porSimbolo[h] || E.lista[25]).Z, false);
  pregunta();
  window.TablaApp = { elige, temperatura: (K) => { sc.value = 'temperatura'; sc.dispatchEvent(new Event('change')); fijaT(K); }, estadoA, compara, get comparando() { return [...comp]; }, pregunta: () => { pregunta(); return { texto: preg.t, solucion: preg.sol }; }, responde: (r) => { $('#q-resp').value = r; corrige(); return $('#q-res').classList.contains('bien'); }, get modo() { return modo; }, colorea: (m) => { sc.value = m; sc.dispatchEvent(new Event('change')); } };
})();
