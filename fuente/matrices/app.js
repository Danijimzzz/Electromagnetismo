/* =====================================================================
   Matrices paso a paso: interfaz (operación, método, editores de A y B,
   resultado y desarrollo). El cálculo está en matrices/calculo.js
   (Matrices) y matematicas/algebra.js (Algebra).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const X = Matrices, CLAVE = 'matrices-v1', MAX = 6;
  const vacia = (f, c) => Array.from({ length: f }, (_, i) => Array.from({ length: c }, (_, j) => (i === j ? '1' : '0')));

  let sc = copia(X.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.op && Array.isArray(g.A)) sc = g; } catch (e) {}
  if (!sc.B) sc.B = vacia(2, 2);
  if (sc.k === undefined) sc.k = '2';
  if (sc.n === undefined) sc.n = '2';
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };

  /* ---------- Controles ---------- */
  const selOp = $('#op'), selMet = $('#metodo');
  selOp.innerHTML = Object.entries(X.OPS).map(([k, o]) => `<option value="${k}">${o.nombre}</option>`).join('');
  function controles() {
    const O = X.OPS[sc.op] || X.OPS.det;
    selOp.value = sc.op;
    selMet.hidden = $('#metodo-l').hidden = !O.metodos;
    if (O.metodos) { selMet.innerHTML = O.metodos.map(([k, t]) => `<option value="${k}">${t}</option>`).join(''); selMet.value = O.metodos.some(([k]) => k === sc.metodo) ? sc.metodo : O.metodos[0][0]; }
    $('#k').hidden = $('#k-l').hidden = !O.k;
    $('#n').hidden = $('#n-l').hidden = !O.n;
    $('#k').value = sc.k; $('#n').value = sc.n;
    // en las operaciones con matrices cuadradas, A se mantiene cuadrada
    if (O.cuadrada && sc.A.length !== sc.A[0].length) redimensiona('A', Math.max(sc.A.length, sc.A[0].length), Math.max(sc.A.length, sc.A[0].length));
    editor('A'); $('#ed-B').hidden = !O.B; if (O.B) editor('B');
  }
  selOp.addEventListener('change', () => { sc.op = selOp.value; $('#ejemplos').value = ''; controles(); calcula(); });
  selMet.addEventListener('change', () => { sc.metodo = selMet.value; $('#ejemplos').value = ''; calcula(); });
  $('#k').addEventListener('input', () => { sc.k = $('#k').value; calcula(); });
  $('#n').addEventListener('input', () => { sc.n = $('#n').value; calcula(); });

  /* ---------- Editores de matriz ---------- */
  function redimensiona(m, f, c) {
    const M = sc[m];
    sc[m] = Array.from({ length: f }, (_, i) => Array.from({ length: c }, (_, j) => (M[i] && M[i][j] !== undefined ? M[i][j] : i === j ? '1' : '0')));
  }
  const opciones = (v) => Array.from({ length: MAX }, (_, i) => `<option${i + 1 === v ? ' selected' : ''}>${i + 1}</option>`).join('');
  function editor(m) {
    const M = sc[m], cuadrada = m === 'A' && (X.OPS[sc.op] || {}).cuadrada, f = M.length, c = M[0].length;
    const cab = cuadrada
      ? `<b>${m}</b><label>Tamaño <select data-m="${m}" data-d="n" class="in" aria-label="Tamaño de ${m}">${opciones(f)}</select></label>`
      : `<b>${m}</b><label>Filas <select data-m="${m}" data-d="f" class="in" aria-label="Filas de ${m}">${opciones(f)}</select></label><label>Columnas <select data-m="${m}" data-d="c" class="in" aria-label="Columnas de ${m}">${opciones(c)}</select></label>`;
    $('#ed-' + m).innerHTML = `<div class="editor-cab">${cab}<button class="btn" type="button" data-m="${m}" data-acc="id">Identidad</button><button class="btn" type="button" data-m="${m}" data-acc="ceros">Ceros</button></div>
      <div class="rejilla" style="grid-template-columns:repeat(${c}, minmax(44px, 64px))">${M.map((fi, i) => fi.map((v, j) => `<input data-m="${m}" data-i="${i}" data-j="${j}" value="${esc(v)}" aria-label="${m} fila ${i + 1} columna ${j + 1}" autocomplete="off" spellcheck="false">`).join('')).join('')}</div>`;
  }
  for (const m of ['A', 'B']) {
    const ed = $('#ed-' + m);
    ed.addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; sc[m][+t.dataset.i][+t.dataset.j] = t.value; $('#ejemplos').value = ''; calcula(); });
    ed.addEventListener('change', (e) => {
      const t = e.target;
      if (t.tagName !== 'SELECT') return;
      const v = +t.value, M = sc[m];
      if (t.dataset.d === 'n') redimensiona(m, v, v);
      else redimensiona(m, t.dataset.d === 'f' ? v : M.length, t.dataset.d === 'c' ? v : M[0].length);
      $('#ejemplos').value = ''; editor(m); calcula();
    });
    ed.addEventListener('click', (e) => {
      const a = e.target.dataset.acc;
      if (!a) return;
      const M = sc[m];
      sc[m] = M.map((f, i) => f.map((_, j) => (a === 'id' && i === j ? '1' : '0')));
      $('#ejemplos').value = ''; editor(m); calcula();
    });
  }

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + X.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = X.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = { ...sc, metodo: undefined, ...copia(e.sc) };
    controles(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  let sol = null;
  function calcula() {
    const err = $('#error');
    try { sol = X.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; return; }
    err.hidden = true; guarda();
    $('#res').innerHTML = sol.res;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('matrices').current;
  controles(); calcula();
  window.MatricesApp = { abrirEjemplo, resultado: () => sol && { op: sol.op, res: sol.res }, estado: () => copia(sc) };
})();
