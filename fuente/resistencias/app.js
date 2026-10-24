/* =====================================================================
   Código de colores de resistencias: interfaz (modo, bandas de colores,
   dibujo de la resistencia, resultados y desarrollo). El cálculo está en
   resistencias/calculo.js (Resistencias).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const R = Resistencias, ohm = R.ohm, CLAVE = 'resistencias-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const COL = Object.fromEntries(R.COLORES.map((c) => [c.k, c]));
  const MODOS = [['colores', 'De los colores al valor'], ['valor', 'Del valor a los colores'], ['smd', 'Código SMD (resistencias de montaje superficial)']];

  let sc = copia(R.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null;

  // qué colores admite cada banda según cuántas tenga la resistencia
  function tipos(n) {
    if (n === 3) return ['cifra', 'cifra', 'mult'];
    if (n === 4) return ['cifra', 'cifra', 'mult', 'tol'];
    if (n === 5) return ['cifra', 'cifra', 'cifra', 'mult', 'tol'];
    return ['cifra', 'cifra', 'cifra', 'mult', 'tol', 'tc'];
  }
  const LISTA = { cifra: R.CIFRAS, mult: R.MULTS, tol: R.TOLS.filter((c) => c.k !== 'ninguno'), tc: R.TCS };
  const NOMBRE = { cifra: 'Cifra', mult: 'Multiplicador', tol: 'Tolerancia', tc: 'Temperatura' };
  const MULT = { '-2': '×0,01', '-1': '×0,1', 0: '×1', 1: '×10', 2: '×100', 3: '×1k', 4: '×10k', 5: '×100k', 6: '×1M', 7: '×10M', 8: '×100M', 9: '×1G' };
  const etiqueta = (c, tipo) => (tipo === 'cifra' ? c.d : tipo === 'mult' ? MULT[c.m] : tipo === 'tol' ? `±${String(c.tol).replace('.', ',')}%` : `${c.tc} ppm`);

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un, modo = 'decimal') => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="${modo}" autocomplete="off" spellcheck="false">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS), extra = '';
    if (sc.modo === 'colores') {
      h += elige('bandas', 'Número de bandas', [['3', '3 bandas'], ['4', '4 bandas'], ['5', '5 bandas (precisión)'], ['6', '6 bandas (con temperatura)']]);
      const t = tipos(+sc.bandas || 4);
      extra = t.map((tipo, i) => {
        const k = `b${i + 1}`, lista = LISTA[tipo];
        if (!lista.some((c) => c.k === sc[k])) sc[k] = (tipo === 'cifra' ? (i === 0 ? 'marron' : 'negro') : tipo === 'mult' ? 'rojo' : tipo === 'tol' ? (+sc.bandas >= 5 ? 'marron' : 'oro') : 'marron');
        return `<div class="banda" role="radiogroup" aria-label="Banda ${i + 1}: ${NOMBRE[tipo].toLowerCase()}"><div class="banda-t">Banda ${i + 1} <small>${NOMBRE[tipo]}</small></div><div class="chips">${lista.map((c) => `<button type="button" class="chip${sc[k] === c.k ? ' sel' : ''}" role="radio" aria-checked="${sc[k] === c.k}" data-b="${k}" data-c="${c.k}" title="${c.n}: ${etiqueta(c, tipo)}" style="--c:${c.hex}"><span>${etiqueta(c, tipo)}</span></button>`).join('')}</div></div>`;
      }).join('');
    } else if (sc.modo === 'valor') {
      h += fila('valor', 'Valor de la resistencia', 'Ω', 'text') + elige('bandas', 'Número de bandas', [['4', '4 bandas (2 cifras)'], ['5', '5 bandas (3 cifras)']]);
      h += elige('serie', 'Serie para el valor normalizado', ['E6', 'E12', 'E24', 'E48', 'E96'].map((s) => [s, `${s} (±${{ E6: 20, E12: 10, E24: 5, E48: 2, E96: 1 }[s]} %)`]));
      h += elige('tol', 'Tolerancia', LISTA.tol.map((c) => [c.k, `±${String(c.tol).replace('.', ',')} % (${c.n.toLowerCase()})`]));
    } else {
      h += fila('codigo', 'Código impreso', '', 'text');
    }
    $('#campos').innerHTML = h;
    $('#bandas').innerHTML = extra;
    $('#nota').textContent = sc.modo === 'colores' ? 'Empieza a leer por el lado contrario a la banda de tolerancia (oro, plata o la que está más separada).' : sc.modo === 'valor' ? 'Puedes escribir 4700, 4,7k, 4k7, 2M2, 470R o 0R47.' : 'Ejemplos: 472 (4,7 kΩ), 1002 (10 kΩ), 4R7 (4,7 Ω), 01C (10 kΩ en EIA-96).';
  }
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(R.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (t.dataset.k === 'bandas' && sc.modo === 'colores') {
      // al pasar de 4 a 5 bandas se conserva el valor si se puede
      const ej = R.ejemplos.find((x) => x.sc.modo === 'colores' && x.sc.bandas === t.value);
      if (ej) for (const [k, v] of Object.entries(ej.sc)) if (k.startsWith('b') && k !== 'bandas') sc[k] = v;
    } else if (t.dataset.k === 'bandas' && sc.modo === 'valor') sc.tol = t.value === '5' ? 'marron' : 'oro';
    for (const [k, v] of Object.entries(R.ejemplos.find((x) => x.sc.modo === sc.modo).sc)) if (vacioC(sc[k])) sc[k] = v;
    $('#ejemplos').value = ''; formulario(); calcula();
  });
  $('#bandas').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    sc[b.dataset.b] = b.dataset.c; $('#ejemplos').value = '';
    for (const x of $('#bandas').querySelectorAll(`.chip[data-b="${b.dataset.b}"]`)) { x.classList.toggle('sel', x === b); x.setAttribute('aria-checked', String(x === b)); }
    calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + R.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = R.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // una resistencia de 4 o 5 bandas con colores al azar (para el modo práctica)
  function azar() {
    const toma = (l) => l[Math.floor(Math.random() * l.length)];
    const n = Math.random() < 0.7 ? 4 : 5;
    sc = { modo: 'colores', bandas: String(n), b1: toma(R.CIFRAS.slice(1)).k, b2: toma(R.CIFRAS).k };
    if (n === 5) sc.b3 = toma(R.CIFRAS).k;
    sc[`b${n - 1}`] = toma(R.MULTS.filter((c) => c.m >= -1 && c.m <= 5)).k;
    sc[`b${n}`] = n === 5 ? toma(['marron', 'rojo']) : toma(['oro', 'plata', 'oro']);
    formulario(); calcula(); sel.value = '';
  }

  /* ---------- Dibujo ---------- */
  function dibujo(bandas, n) {
    const w = 360, h = 110, x0 = 70, x1 = 290, cy = 55, prec = n >= 5;
    const cuerpo = prec ? '#9cc3e6' : '#e8d2a6', borde = prec ? '#6f9cc6' : '#c2a774';
    // las cifras y el multiplicador juntos a la izquierda; la tolerancia separada a la derecha
    const izq = n === 3 ? 3 : n === 6 ? 4 : n - 1, der = bandas.length - izq;
    const pos = bandas.map((_, i) => (i < izq ? x0 + 30 + i * 26 : der === 1 ? x1 - 34 : x1 - 46 + (i - izq) * 22));
    const b = bandas.map((k, i) => (COL[k].hex ? `<rect x="${pos[i]}" y="${cy - 30}" width="13" height="60" fill="${COL[k].hex}" stroke="rgba(0,0,0,.25)" stroke-width="0.6"/>` : '')).join('');
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Resistencia con las bandas ${bandas.map((k) => COL[k].n.toLowerCase()).join(', ')}">
<line x1="0" y1="${cy}" x2="${x0 + 4}" y2="${cy}" stroke="#9aa1a8" stroke-width="5" stroke-linecap="round"/><line x1="${x1 - 4}" y1="${cy}" x2="${w}" y2="${cy}" stroke="#9aa1a8" stroke-width="5" stroke-linecap="round"/>
<path d="M${x0} ${cy - 26} q0 -10 14 -10 h22 q10 0 14 6 h${x1 - x0 - 100} q4 -6 14 -6 h22 q14 0 14 10 v52 q0 10 -14 10 h-22 q-10 0 -14 -6 h-${x1 - x0 - 100} q-4 6 -14 6 h-22 q-14 0 -14 -10 z" fill="${cuerpo}" stroke="${borde}" stroke-width="1.5"/>
<clipPath id="cuerpo"><path d="M${x0} ${cy - 26} q0 -10 14 -10 h22 q10 0 14 6 h${x1 - x0 - 100} q4 -6 14 -6 h22 q14 0 14 10 v52 q0 10 -14 10 h-22 q-10 0 -14 -6 h-${x1 - x0 - 100} q-4 6 -14 6 h-22 q-14 0 -14 -10 z"/></clipPath>
<g clip-path="url(#cuerpo)">${b}</g></svg>`;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const nombres = (ks) => ks.map((k) => `<i class="mini" style="--c:${COL[k].hex}"></i>${COL[k].n.toLowerCase()}`).join(' ');
  function calcula() {
    const err = $('#error');
    try { sol = R.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#dibujo').innerHTML = ''; $('#colores-res').innerHTML = '';
      return;
    }
    err.hidden = true; guarda();
    let h = '', d = '', cr = '';
    if (sol.modo === 'colores') {
      h = dato('Resistencia', `R = ${ohm(sol.R)}`) + dato('Tolerancia', `±${String(sol.tol).replace('.', ',')} %`) + dato('Valor real entre', `${ohm(sol.min, 5)} y ${ohm(sol.max, 5)}`) + (sol.tc !== null ? dato('Coeficiente de temperatura', `${sol.tc} ppm/K`) : '');
      d = dibujo(sol.bandas, sol.n);
    } else if (sol.modo === 'valor') {
      h = dato('Resistencia', `R = ${ohm(sol.R)}`) + dato(`Normalizado más cercano (${sol.serie})`, `${ohm(sol.Rn)}`) + (Math.abs(sol.err) > 1e-9 ? dato('Diferencia', `${String(+Math.abs(sol.err).toPrecision(3)).replace('.', ',')} %`) : '');
      cr = `<p><b>Colores:</b> ${nombres(sol.bandas)}</p>` + (Math.abs(sol.err) > 1e-9 ? `<p><b>Del normalizado (${ohm(sol.Rn)}):</b> ${nombres(sol.bandasN)}</p>` : '');
      d = dibujo(sol.bandas, sol.n);
    } else {
      h = dato('Resistencia', `R = ${ohm(sol.R)}`) + dato('Tipo de código', sol.como);
    }
    $('#resumen').innerHTML = h; $('#dibujo').innerHTML = d; $('#colores-res').innerHTML = cr;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('resistencias').current;
  formulario(); calcula();
  window.ResistenciasApp = { abrirEjemplo, azar, colores: () => (sol && sol.bandas ? sol.bandas.map((k) => COL[k].n.toLowerCase()).join(', ') : ''), resultado: () => sol && { modo: sol.modo, R: sol.R, Rn: sol.Rn, bandas: sol.bandas, min: sol.min, max: sol.max }, estado: () => copia(sc) };
})();
