/* =====================================================================
   Convergencia de series: interfaz (término general, primer n; veredicto,
   suma, tabla de criterios, sumas parciales dibujadas y desarrollo). El
   cálculo está en series/calculo.js (Series); los ayudantes comunes ($, esc,
   copia, txt, marcas, lienzo) en herramienta.js. Guarda sc en localStorage
   ['series-v1'] y expone window.SeriesApp para práctica y pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = Series, f = P.fh, CLAVE = 'series-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};
  const M = (s) => Mates.html(`$${s}$`);

  /* ---------- Formulario ---------- */
  const fila = (k, nom, ph) => `<label for="f-${k}">${nom}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" placeholder="${ph}" autocomplete="off" spellcheck="false">`;
  function formulario() { $('#campos').innerHTML = fila('an', 'Término general aₙ', '1/n^2') + fila('n0', 'Primer valor de n', '1'); }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  // un ejercicio al azar con suma que se pueda preguntar, para el modo práctica
  const AZAR = ['1/#^n', '3/#^n', '(1/#)^n', 'n/2^n', '#^n/n!', '1/(n(n+1))', '(-1)^n/n', '(-1)^n/n^2', '1/n^2'];
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), an = AZAR[ent(0, AZAR.length - 1)].replace(/#/g, String(ent(2, 5)));
    sc = { an, n0: an.includes('!') ? '0' : '1' };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => `Estudia la convergencia de la serie <b>Σ ${esc(sc.an)}</b> (desde n = ${esc(sc.n0)}): ¿cuánto vale el límite de aₙ y la suma de la serie?`;

  /* ---------- Cálculo ---------- */
  const dato = (t, v, c = '') => `<div${c ? ` class="${c}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const etiqueta = { converge: 'Converge', diverge: 'Diverge', 'no concluye': 'No decide', 'no aplica': 'No se aplica' };
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#criterios').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const v = sol.veredicto === 'converge' ? (sol.absoluta === true ? 'Converge absolutamente' : sol.absoluta === false ? 'Converge condicionalmente' : 'Converge') : sol.veredicto === 'diverge' ? 'Diverge' : 'No se puede decidir';
    let h = dato('Veredicto', `<span class="veredicto ${sol.veredicto}">${v}</span>`, 'ancho');
    if (sol.suma !== undefined) h += dato('Suma de la serie', `S ${sol.sumaExacta !== undefined ? '=' : '≈'} ${f(sol.suma, 7)}`, 'num');
    h += dato('Límite de aₙ', sol.limite === undefined ? '—' : f(sol.limite, 5), 'num');
    $('#resumen').innerHTML = h;
    // «Usar en…»: la serie como desarrollo de Taylor
    { const ue = $('#usar-en'), d = sol.desarrollo; ue.hidden = !d; ue.innerHTML = d ? `<a class="btn" data-usar="taylor" href="${esc(Herramienta.enlaceA('taylor', { modo: 'polinomio', f: d.f, a: '0', n: String(d.n), x0: d.x0 }))}">Ver esta serie como desarrollo de Taylor →</a>` : ''; }
    $('#criterios').innerHTML = `<table class="criterios"><thead><tr><th>Criterio</th><th>Resultado</th></tr></thead><tbody>${sol.pruebas.map((p) => `<tr><td>${esc(p.nombre)}${p.valor !== undefined ? ` <small>(${f(p.valor, 4)})</small>` : ''}</td><td>${etiqueta[p.veredicto] || p.veredicto}</td></tr>`).join('')}</tbody></table>`;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').innerHTML = `${M(`S_N = ∑_{n=${sol.n0}}^{N} ${sol.T}`)} para los primeros ${sol.parciales.length} valores de N` + (sol.suma !== undefined ? '; la línea discontinua es la suma estimada.' : '.');
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const S = sol.parciales, n = S.length;
    let lo = Math.min(...S, sol.suma ?? Infinity), hi = Math.max(...S, sol.suma ?? -Infinity);
    if (!isFinite(lo) || !isFinite(hi)) return;
    if (hi - lo < 1e-12) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const ml = 56, mr = 14, mt = 12, mb = 28;
    const X = (i) => ml + (i / (n - 1)) * (w - ml - mr), Y = (v) => h - mb - ((v - lo) / (hi - lo)) * (h - mt - mb);
    g.font = '12px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(lo, hi, 5)) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(txt(f(v, 3)), ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const i of marcas(0, n - 1, 6)) if (Number.isInteger(i)) g.fillText(String(sol.n0 + i), X(i), h - mb + 6);
    if (sol.suma !== undefined) { g.strokeStyle = col['--serie-2']; g.lineWidth = 1.6; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(ml, Y(sol.suma)); g.lineTo(w - mr, Y(sol.suma)); g.stroke(); g.setLineDash([]); }
    g.strokeStyle = col['--accent']; g.fillStyle = col['--accent']; g.lineWidth = 1.6;
    g.beginPath(); S.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)))); g.stroke();
    S.forEach((v, i) => { g.beginPath(); g.arc(X(i), Y(v), 2.6, 0, 7); g.fill(); });
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('series').current;
  colores(); formulario(); calcula();
  Herramienta.exportar('#grafica', { nombre: 'convergencia-de-series', titulo: 'Convergencia de series', etiqueta: 'las sumas parciales', datos: () => sol && sol.parciales ? { cab: ['n', 'suma parcial'], filas: sol.parciales.map((s, i) => [sol.n0 + i, s]) } : null });
  window.SeriesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { veredicto: sol.veredicto, suma: sol.suma }, estado: () => copia(sc) };
})();
