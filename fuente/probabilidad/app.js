/* =====================================================================
   Interfaz de Probabilidad: combinatoria, sucesos y probabilidad total con
   Bayes. El cálculo está en probabilidad/calculo.js (Probabilidad) y los
   ayudantes comunes en herramienta.js. Guarda el estado entero (sc) en
   localStorage['probabilidad-v1'], que es lo que copia Mis ejercicios.
   Expone window.ProbabilidadApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, lienzo } = Herramienta;
  const P = Probabilidad, CLAVE = 'probabilidad-v1';

  let sc = copia(P.ejemplos.find((e) => e.clave === 'fabrica').sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && g.modo) sc = Object.assign(copia(P.ejemplos[0].sc), g); } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const opciones = (obj, v) => Object.entries(obj).map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${t}</option>`).join('');
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  function formulario() {
    document.querySelectorAll('.modos button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === sc.modo)));
    let h = '', nota = '';
    if (sc.modo === 'comb') {
      h = `<label for="f-ctipo">Tipo</label><select id="f-ctipo" class="in" data-k="ctipo">${opciones(P.TIPOS, sc.ctipo)}</select>`;
      if (sc.ctipo === 'permrep') h += `<label for="f-grupos">Repeticiones</label><input id="f-grupos" class="in" data-k="grupos" value="${esc(sc.grupos)}" autocomplete="off">`;
      else {
        h += fila('n', 'Elementos', 'n');
        if (sc.ctipo !== 'perm') h += fila('k', 'Elegidos', 'k');
      }
      nota = sc.ctipo === 'permrep' ? 'Cuántas veces se repite cada elemento, separadas por comas: MISSISSIPPI es 1, 4, 4, 2 (M, I, S, P).' : 'Variaciones y permutaciones: importa el orden. Combinaciones: no importa.';
    } else if (sc.modo === 'suc') {
      h = fila('pa', 'Probabilidad de A', 'P(A)') + fila('pb', 'Probabilidad de B', 'P(B)') + `<label for="f-rel">Relación</label><select id="f-rel" class="in" data-k="rel">${opciones(P.RELACIONES, sc.rel)}</select>`;
      if (['inter', 'union', 'cond'].includes(sc.rel)) h += fila('pc', sc.rel === 'inter' ? 'Intersección' : sc.rel === 'union' ? 'Unión' : 'Condicionada', sc.rel === 'inter' ? 'P(A ∩ B)' : sc.rel === 'union' ? 'P(A ∪ B)' : 'P(A | B)');
      nota = 'Las probabilidades se escriben como 0,3, 30 % o 3/10.';
    } else {
      h = `<label for="f-nb">Suceso observado</label><input id="f-nb" class="in" data-k="nb" value="${esc(sc.nb)}" maxlength="12" autocomplete="off">` +
        `<div class="ancho"><div class="causas" id="causas"><span>Causa</span><span>P(Aᵢ)</span><span>P(suceso | Aᵢ)</span>` +
        sc.filas.map((r, i) => `<input class="in" aria-label="Nombre de la causa ${i + 1}" data-fila="${i}" data-c="n" value="${esc(r.n)}" placeholder="A${i + 1}" autocomplete="off"><input class="in" aria-label="Probabilidad a priori de la causa ${i + 1}" data-fila="${i}" data-c="p" value="${esc(r.p)}" inputmode="decimal" autocomplete="off"><input class="in" aria-label="Probabilidad del suceso dada la causa ${i + 1}" data-fila="${i}" data-c="l" value="${esc(r.l)}" inputmode="decimal" autocomplete="off">`).join('') + `</div></div>` +
        `<label for="f-obs">Se sabe que</label><select id="f-obs" class="in" data-k="obs"><option value="si"${sc.obs === 'si' ? ' selected' : ''}>ha ocurrido ${esc(sc.nb || 'B')}</option><option value="no"${sc.obs === 'no' ? ' selected' : ''}>no ha ocurrido ${esc(sc.nb || 'B')}</option></select>`;
      nota = 'Deja en blanco las causas que no uses (mínimo dos). Las P(Aᵢ) tienen que sumar 1.';
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = nota;
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.fila !== undefined) sc.filas[+t.dataset.fila][t.dataset.c] = t.value;
    else if (t.dataset.k) {
      sc[t.dataset.k] = t.value;
      if (t.tagName === 'SELECT' && (t.dataset.k === 'ctipo' || t.dataset.k === 'rel')) formulario();
    } else return;
    $('#ejemplos').value = ''; calcula();
  });
  document.querySelectorAll('.modos button').forEach((b) => b.addEventListener('click', () => { sc.modo = b.dataset.modo; $('#ejemplos').value = ''; formulario(); calcula(); }));

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un problema de probabilidad total y Bayes al azar, para el modo práctica
  const azar = () => { sc = P.azar(); formulario(); calcula(); sel.value = ''; };
  const enunciado = () => {
    const r = sc.filas.filter((x) => !(x.p === '' && x.l === ''));
    return `Una fábrica tiene ${r.length} máquinas que producen ${r.map((x) => `el <b>${esc(String(+x.p * 100).replace('.', ','))} %</b> (${esc(x.n)}, con un <b>${esc(String(+String(x.l).replace(',', '.') * 100).replace('.', ','))} %</b> de piezas defectuosas)`).join(', ')}. Se elige una pieza ${sc.obs === 'no' ? 'sin defecto' : 'defectuosa'}: calcula P(${esc(sc.nb)}) y la probabilidad de que venga de cada máquina.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, pr) => `<div${pr ? ' class="pr"' : ''}><span>${esc(t)}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#tarjeta-grafica').hidden = true; dibuja(); return;
    }
    err.hidden = true; guarda();
    $('#resumen').innerHTML = sol.res.map((r) => dato(r.t, r.v, r.pr)).join('');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li>${p.t ? `<strong>${Mates.html(p.t)}</strong>` : ''}${Mates.html(p.html)}</li>`).join('');
    $('#tarjeta-grafica').hidden = sol.modo === 'comb';
    $('#titulo-grafica').textContent = sol.modo === 'bayes' ? 'Diagrama de árbol' : 'Diagrama de áreas';
    $('#leyenda').textContent = sol.modo === 'bayes'
      ? `Cada rama lleva su probabilidad; al final, la del camino completo. La causa más probable sabiendo que ${sol.obs === 'si' ? '' : 'no '}ha ocurrido ${sol.nb} es ${sol.may.n}.`
      : 'El cuadrado vale 1: el ancho reparte A y su contrario, y el alto reparte B dentro de cada uno. Las áreas son las probabilidades.';
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--rama', '--rama2']) col[k] = cs.getPropertyValue(k).trim(); }
  const num = (x) => txt(P.p(x));
  function arbol(g, w, h) {
    const fs = sol.filas, n = fs.length, nb = sol.nb, nbn = nb + '̄';
    const x0 = 14, x1 = Math.min(w * 0.36, 190), x2 = Math.min(w * 0.7, x1 + 240), top = 14, alto = h - 28, filaH = alto / (2 * n);
    g.font = '12px system-ui, sans-serif'; g.textBaseline = 'middle'; g.lineWidth = 1.8;
    const raiz = [x0 + 4, top + alto / 2];
    fs.forEach((r, i) => {
      const yc = top + (2 * i + 1) * filaH, ys = [yc - filaH / 2, yc + filaH / 2];
      g.strokeStyle = col['--rama']; g.beginPath(); g.moveTo(...raiz); g.lineTo(x1, yc); g.stroke();
      const mx = (raiz[0] + x1) / 2, my = (raiz[1] + yc) / 2;
      g.fillStyle = col['--ink']; g.textAlign = 'center'; g.fillText(num(r.p), mx, my - 9);
      g.textAlign = 'left'; g.fillText(r.n, x1 + 6, yc - 12 > top ? yc - 14 : yc - 10);
      [[r.l, r.j, nb, col['--rama']], [1 - r.l, r.jn, nbn, col['--rama2']]].forEach(([pl, pj, et, c], k) => {
        g.strokeStyle = c; g.beginPath(); g.moveTo(x1, yc); g.lineTo(x2, ys[k]); g.stroke();
        g.fillStyle = col['--ink']; g.textAlign = 'center'; g.fillText(num(pl), (x1 + x2) / 2, (yc + ys[k]) / 2 + (k ? 10 : -10));
        g.textAlign = 'left'; g.fillStyle = col['--muted']; g.fillText(`${et}`, x2 + 6, ys[k]);
        g.fillStyle = col['--ink']; g.fillText(`${num(pj)}`, x2 + 6 + g.measureText(et).width + 10, ys[k]);
      });
    });
    g.fillStyle = col['--accent']; g.beginPath(); g.arc(raiz[0], raiz[1], 4, 0, 7); g.fill();
  }
  function areas(g, w, h) {
    const m = 14, L = Math.min(w - 2 * m, h - 2 * m - 18), x0 = (w - L) / 2, y0 = m;
    const pa = sol.pa, pb = sol.pb, pi = sol.pi;
    const pbA = pa > 0 ? pi / pa : 0, pbN = pa < 1 ? (pb - pi) / (1 - pa) : 0;
    const trozos = [
      [0, 0, pa, pbA, 'A ∩ B', pi, '--accent'], [0, pbA, pa, 1 - pbA, 'A ∩ B̄', pa - pi, '--rama'],
      [pa, 0, 1 - pa, pbN, 'Ā ∩ B', pb - pi, '--rama2'], [pa, pbN, 1 - pa, 1 - pbN, 'Ā ∩ B̄', 1 - sol.pu, '--line'],
    ];
    g.font = '12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [x, y, ww, hh, et, v, c] of trozos) {
      const X = x0 + x * L, Y = y0 + y * L, W = ww * L, H = hh * L;
      g.globalAlpha = 0.32; g.fillStyle = col[c]; g.fillRect(X, Y, W, H); g.globalAlpha = 1;
      g.strokeStyle = col['--ink']; g.lineWidth = 1; g.strokeRect(X, Y, W, H);
      if (W > 48 && H > 30) { g.fillStyle = col['--ink']; g.fillText(et, X + W / 2, Y + H / 2 - 8); g.fillText(num(v), X + W / 2, Y + H / 2 + 8); }
    }
    g.fillStyle = col['--muted']; g.textBaseline = 'top';
    g.fillText(`A: ${num(pa)}`, x0 + pa * L / 2, y0 + L + 4); g.fillText(`Ā: ${num(1 - pa)}`, x0 + (pa + (1 - pa) / 2) * L, y0 + L + 4);
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h || sol.modo === 'comb') return;
    if (sol.modo === 'bayes') arbol(g, w, h); else areas(g, w, h);
  }
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('probabilidad').current;
  colores(); formulario(); calcula();
  window.ProbabilidadApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { res: sol.res.map((r) => r.v) }, estado: () => copia(sc) };
})();
