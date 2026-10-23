/* =====================================================================
   Tabla periódica interactiva: rejilla de 18 grupos, colores por categoría
   o por propiedad, buscador y ficha del elemento elegido (#Fe en la dirección).
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
  };
  const BLOQUES = { s: '#e07a5f', p: '#3d8bbd', d: '#d9a441', f: '#8e6fc1' };
  const ESTADOS = { gas: '#5aa9e6', 'líquido': '#2bb39a', 'sólido': '#9aa5ad' };
  let modo = 'cat', sel = null, filtroCat = null;
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

  function pinta() {
    const p = PROPS[modo], vals = p ? E.lista.map(p.v).filter((x) => x != null) : [];
    const lo = Math.min(...vals), hi = Math.max(...vals);
    for (const e of E.lista) {
      const c = celdas[e.Z], v = c.querySelector('.v');
      let fondo, osc = false;
      if (modo === 'cat') { fondo = `var(--c-${e.cat})`; v.textContent = e.nombre; }
      else if (modo === 'bloque') { const b = E.bloque(e.Z); fondo = `color-mix(in srgb, ${BLOQUES[b]} 35%, var(--panel))`; v.textContent = b; }
      else if (modo === 'estado') { fondo = e.estado ? `color-mix(in srgb, ${ESTADOS[e.estado]} 35%, var(--panel))` : 'var(--bg)'; v.textContent = e.estado || '?'; }
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
        <dt>Electrones por capa</dt><dd class="capas">${E.capas(e.Z).map((k, i) => `<span>${'KLMNOPQ'[i]} ${k}</span>`).join('')}</dd>
        <dt>Electronegatividad</dt><dd>${coma(e.en, e.en == null ? null : 2)}</dd>
        <dt>1.ª ionización</dt><dd>${e.ei == null ? '—' : coma(e.ei) + ' kJ/mol'}</dd>
        <dt>Radio atómico</dt><dd>${e.radio == null ? '—' : coma(e.radio) + ' pm'}</dd>
        <dt>Estado a 25 °C</dt><dd>${e.estado || 'desconocido'}</dd>
      </dl>
      ${e.Z > 100 ? '<p class="nota">Elemento sintético de vida muy corta: la configuración es la prevista y casi no hay propiedades medidas.</p>' : ''}`;
  }
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
  const sc = $('#color');
  sc.value = modo;
  sc.addEventListener('change', () => { modo = sc.value; filtroCat = null; try { localStorage.setItem('tabla-color', modo); } catch (e) { /* sin almacenamiento */ } pinta(); if (sel) ficha(E.lista[sel - 1]); });
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
  window.TablaApp = { elige, get modo() { return modo; }, colorea: (m) => { sc.value = m; sc.dispatchEvent(new Event('change')); } };
})();
