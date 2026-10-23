/* =====================================================================
   Sistemas de ecuaciones lineales: interfaz (método, nombres de las
   incógnitas, coeficientes, resultado y desarrollo). El cálculo está en
   sistemas/calculo.js (Sistemas) y matematicas/algebra.js (Algebra).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const X = Sistemas, CLAVE = 'sistemas-v1', MAX = 6;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));

  let sc = copia(X.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && Array.isArray(g.M) && g.M.length) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };

  const selMet = $('#metodo');
  selMet.innerHTML = X.METODOS.map(([k, t]) => `<option value="${k}">${t}</option>`).join('');
  selMet.addEventListener('change', () => { sc.metodo = selMet.value; $('#ejemplos').value = ''; calcula(); });
  $('#vars').addEventListener('input', () => { sc.vars = $('#vars').value; $('#ejemplos').value = ''; cabeceras(); calcula(); });

  /* ---------- Editor ---------- */
  const opciones = (v) => Array.from({ length: MAX }, (_, i) => `<option${i + 1 === v ? ' selected' : ''}>${i + 1}</option>`).join('');
  function nombres() { try { return X.nombres(sc.M[0].length - 1, sc.vars); } catch (e) { return X.nombres(sc.M[0].length - 1); } }
  function editor() {
    const m = sc.M.length, n = sc.M[0].length - 1;
    $('#ed').innerHTML = `<div class="editor-cab"><label>Ecuaciones <select data-d="m" class="in" aria-label="Número de ecuaciones">${opciones(m)}</select></label><label>Incógnitas <select data-d="n" class="in" aria-label="Número de incógnitas">${opciones(n)}</select></label><button class="btn" type="button" data-acc="ceros">Ceros</button></div>
      <div class="rejilla" style="grid-template-columns:repeat(${n}, minmax(44px, 64px)) minmax(50px, 72px)">
        <span class="cabeza" id="cab"></span>
        ${sc.M.map((f, i) => f.map((v, j) => `<input data-i="${i}" data-j="${j}" value="${esc(v)}"${j === n ? ' class="sep-b"' : ''} aria-label="Ecuación ${i + 1}, ${j === n ? 'término independiente' : `coeficiente ${j + 1}`}" autocomplete="off" spellcheck="false">`).join('')).join('')}
      </div>`;
    cabeceras();
  }
  // nombres de las columnas encima de la rejilla
  function cabeceras() {
    const c = $('#cab');
    if (!c) return;
    const v = nombres();
    c.outerHTML = `<span id="cab" style="display:contents">${v.map((x) => `<span class="cabeza">${x}</span>`).join('')}<span class="cabeza">= b</span></span>`;
  }
  const ed = $('#ed');
  ed.addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; sc.M[+t.dataset.i][+t.dataset.j] = t.value; $('#ejemplos').value = ''; calcula(); });
  ed.addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    const M = sc.M, m = t.dataset.d === 'm' ? +t.value : M.length, n = t.dataset.d === 'n' ? +t.value : M[0].length - 1, n0 = M[0].length - 1;
    sc.M = Array.from({ length: m }, (_, i) => [...Array.from({ length: n }, (_, j) => (M[i] && j < n0 ? M[i][j] : '0')), M[i] ? M[i][n0] : '0']);
    if (t.dataset.d === 'n') { sc.vars = ''; $('#vars').value = ''; }
    $('#ejemplos').value = ''; editor(); calcula();
  });
  ed.addEventListener('click', (e) => { if (e.target.dataset.acc !== 'ceros') return; sc.M = sc.M.map((f) => f.map(() => '0')); $('#ejemplos').value = ''; editor(); calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + X.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = X.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = { vars: '', ...copia(e.sc) };
    rellena(); calcula(); sel.value = clave;
  }
  function rellena() { selMet.value = sc.metodo || 'gauss'; $('#vars').value = sc.vars || ''; editor(); }

  /* ---------- Cálculo ---------- */
  let sol = null;
  function calcula() {
    const err = $('#error');
    try { sol = X.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#tipo').textContent = ''; $('#pasos').innerHTML = ''; return; }
    err.hidden = true; guarda();
    $('#res').innerHTML = sol.res;
    $('#tipo').textContent = `Sistema ${sol.descripcion}.`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
  }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('sistemas').current;
  rellena(); calcula();
  window.SistemasApp = { abrirEjemplo, resultado: () => sol && { tipo: sol.tipo, res: sol.res }, estado: () => copia(sc) };
})();
