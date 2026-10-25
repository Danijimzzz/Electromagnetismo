/* =====================================================================
   Series de Fourier: interfaz (tramos de la función en un periodo o en
   [0, L] con su extensión, número de armónicos y x₀; gráfica de f y de la
   suma parcial, que se puede animar armónico a armónico; espectro de
   amplitudes; resultados y desarrollo). El cálculo está en
   fourier/calculo.js (Fourier) y las expresiones en matematicas/expresion.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const F = Fourier, CLAVE = 'fourier-v1', MAXT = 4;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const fH = (x, d = 4) => F.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const sup = (e) => [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '−' ? '⁻' : c)).join('');
  const txt = (s) => s.replace(/<sup>(.*?)<\/sup>/g, (_, e) => sup(e)).replace(/<[^>]+>/g, '');
  const sub = (k) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && Array.isArray(g.tramos) && g.tramos.length) sc = { ...sc, ...g }; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, k = 1, anda = false, tA = 0;

  /* ---------- Formulario ---------- */
  const campo = (i, c, nom, ancho = '') => `<input class="in${ancho}" data-i="${i}" data-c="${c}" value="${esc(sc.tramos[i][c] ?? '')}" aria-label="${nom} del tramo ${i + 1}" autocomplete="off" spellcheck="false">`;
  function formulario() {
    const o = (v, t) => `<option value="${v}"${sc.ext === v ? ' selected' : ''}>${t}</option>`;
    $('#ext').innerHTML = o('periodica', 'La función en un periodo') + o('par', 'Extensión par de [0, L] (cosenos)') + o('impar', 'Extensión impar de [0, L] (senos)');
    $('#tramos').innerHTML = sc.tramos.map((t, i) => `<div class="tramo"><span class="tn">${sc.tramos.length > 1 ? `f${sub(i + 1)}` : 'f'}(x) =</span>${campo(i, 'f', 'Función', ' tf')}<span>si</span>${campo(i, 'a', 'Desde', ' te')}<span>≤ x &lt;</span>${campo(i, 'b', 'Hasta', ' te')}${sc.tramos.length > 1 ? `<button class="btn quita" type="button" data-quita="${i}" aria-label="Quitar el tramo ${i + 1}">×</button>` : ''}</div>`).join('');
    $('#mas').hidden = sc.tramos.length >= MAXT;
    $('#f-N').value = sc.N ?? ''; $('#f-x0').value = sc.x0 ?? '';
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#tramos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.c) return; sc.tramos[+t.dataset.i][t.dataset.c] = t.value; cambia(); });
  $('#tramos').addEventListener('click', (e) => { const b = e.target.closest('[data-quita]'); if (!b) return; sc.tramos.splice(+b.dataset.quita, 1); formulario(); cambia(); });
  $('#mas').addEventListener('click', () => { const u = sc.tramos[sc.tramos.length - 1]; sc.tramos.push({ f: '0', a: u?.b ?? '0', b: '' }); formulario(); cambia(); $(`#tramos [data-i="${sc.tramos.length - 1}"][data-c="b"]`).focus(); });
  $('#ext').addEventListener('change', (e) => { sc.ext = e.target.value; cambia(); });
  $('#f-N').addEventListener('input', (e) => { sc.N = e.target.value; cambia(); });
  $('#f-x0').addEventListener('input', (e) => { sc.x0 = e.target.value; cambia(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + F.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), h = String(ent(1, 4));
    const tipos = [
      () => ({ ext: 'periodica', tramos: [{ f: `-${h}`, a: '-π', b: '0' }, { f: h, a: '0', b: 'π' }] }),
      () => ({ ext: 'periodica', tramos: [{ f: h === '1' ? 'x' : `${h}x`, a: '-π', b: 'π' }] }),
      () => ({ ext: 'periodica', tramos: [{ f: 'x^2', a: '-π', b: 'π' }] }),
      () => ({ ext: 'periodica', tramos: [{ f: h, a: '0', b: '1' }, { f: '0', a: '1', b: '2' }] }),
      () => ({ ext: 'periodica', tramos: [{ f: '0', a: '-π', b: '0' }, { f: h, a: '0', b: 'π' }] }),
      () => ({ ext: 'par', tramos: [{ f: 'x', a: '0', b: 'π' }] }),
      () => ({ ext: 'impar', tramos: [{ f: h, a: '0', b: 'π' }] }),
    ];
    sc = { ...tipos[ent(0, tipos.length - 1)](), N: String(ent(3, 7)), x0: '' };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const tr = sc.tramos.map((t) => `${esc(t.f)} si ${esc(t.a)} ≤ x &lt; ${esc(t.b)}`).join('; ');
    return sc.ext === 'periodica' ? `Calcula la serie de Fourier de la función periódica <b>f(x) = ${tr}</b>: el coeficiente a₀ y los primeros aₙ y bₙ.` : `Desarrolla en serie de <b>${sc.ext === 'par' ? 'cosenos' : 'senos'}</b> la función <b>f(x) = ${tr}</b>: el coeficiente a₀ y los primeros coeficientes.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      dibuja(); return;
    }
    err.hidden = true; guarda();
    const { an, bn } = sol, tres = (cs) => [1, 2, 3].map((n) => fH(cs[n], 4)).join('; ');
    let h = dato('Serie de Fourier', M(`f(x) ∼ ${sol.primeros}`), 'ancho');
    const desde = (d) => (d === 2 ? ' <small>(n ≥ 2)</small>' : '');
    if (sol.gA || sol.gB) h += dato('Término general', [sol.gA ? M(`a_n = ${sol.gA}`) + desde(sol.desdeA) : '', sol.gB ? M(`b_n = ${sol.gB}`) + desde(sol.desdeB) : ''].filter(Boolean).join('&emsp;'), 'ancho');
    if (sol.cnTxt && sol.cnTxt !== '0') h += dato('Forma compleja', M(`c_n = ${sol.cnTxt}`), 'ancho');
    h += dato('a₀', fH(an[0], 5), 'num');
    if (!sol.impar) h += dato('a₁; a₂; a₃', tres(an), 'num');
    if (!sol.par) h += dato('b₁; b₂; b₃', tres(bn), 'num');
    if (sol.x0 !== null) h += dato(`S${sub(sol.N)}(x₀), con x₀ = ${fH(sol.x0, 4)}`, fH(sol.sx0, 6), 'num');
    h += dato(`Energía en ${sol.N} armónicos`, `${fH((100 * sol.parcial) / sol.energia, 4)} %`);
    if (sol.sumas.length) h += dato('Suma de una serie', sol.sumas.map((q) => M(q.txt)).join('<br>'), 'ancho');
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    const rg = $('#armonicos'); rg.max = sol.N; k = anda ? Math.min(k, sol.N) : sol.N; rg.value = k;
    cacheV = null; pintaK(); dibuja();
  }
  function pintaK() {
    if (!sol) return;
    $('#vk').textContent = k;
    $('#leyenda').innerHTML = `f(x) en negro y la suma parcial ${Mates.html(`$S_{${k}}(x)$`)}, con ${k === 1 ? 'el primer armónico' : `los ${k} primeros armónicos`}, en color. ` + (sol.saltos.length ? 'Cerca de los saltos la suma se pasa siempre un poco (fenómeno de Gibbs).' : 'Como f es continua, la suma se pega enseguida a la función.');
  }
  $('#armonicos').addEventListener('input', (e) => { k = +e.target.value; if (anda) para(); pintaK(); dibuja(); });
  $('#animar').addEventListener('click', () => (anda ? para() : arranca()));
  function arranca() { if (!sol) return; anda = true; k = 1; tA = 0; $('#armonicos').value = 1; $('#animar').textContent = '⏸ Parar'; pintaK(); dibuja(); }
  function para() { anda = false; $('#animar').textContent = '▶ Sumar armónicos'; }

  /* ---------- Gráficas ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel']) col[c] = cs.getPropertyValue(c).trim(); }
  const marcas = (a, b, n = 6) => {
    const p0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(p0)), paso = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0) || 10 * e;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  };
  const lienzo = (sel) => {
    const c = $(sel), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  };
  let cacheV = null;
  function ventana() {
    const x1 = sol.s0 - sol.T, x2 = sol.s0 + 2 * sol.T, xs = [], ys = [];
    for (let i = 0; i <= 900; i++) { const x = x1 + ((x2 - x1) * i) / 900; let y; try { y = sol.fper(x); } catch (e) { y = NaN; } xs.push(x); ys.push(isFinite(y) ? y : NaN); }
    const ok = ys.filter(isFinite);
    let y1 = Math.min(0, ...ok), y2 = Math.max(0, ...ok);
    if (y2 - y1 < 1e-9) { y1 -= 1; y2 += 1; }
    const pad = (y2 - y1) * 0.18;
    // marcas del eje x en múltiplos de π si el periodo lleva π
    const conPi = F.exacto(sol.T)?.k === 1;
    return { x1, x2, y1: y1 - pad, y2: y2 + pad, xs, ys, conPi };
  }
  function dibuja() { grafica(); espectro(); }
  function grafica() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    if (!col['--ink']) colores();
    if (!cacheV) cacheV = ventana();
    const V = cacheV, mL = 40, mR = 12, mT = 12, mB = 26;
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    // el periodo de partida, sombreado
    g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.55; g.fillRect(X(sol.s0), mT, X(sol.s0 + sol.T) - X(sol.s0), h - mT - mB); g.globalAlpha = 1; g.fillStyle = col['--muted'];
    g.textAlign = 'center'; g.textBaseline = 'top';
    const xm = V.conPi ? (() => { const out = [], paso = Math.PI / (sol.T > 3 * Math.PI ? 1 : 2); for (let v = Math.ceil(V.x1 / paso) * paso; v <= V.x2 + 1e-9; v += paso) out.push(Math.abs(v) < 1e-9 ? 0 : v); return out; })() : marcas(V.x1, V.x2, Math.max(4, Math.round(w / 80)));
    const etq = (v) => { if (!V.conPi) return txt(fH(v, 3)); const q = Math.round((2 * v) / Math.PI); return q === 0 ? '0' : q % 2 ? `${q === 1 ? '' : q === -1 ? '−' : String(q).replace('-', '−')}π/2` : `${q / 2 === 1 ? '' : q / 2 === -1 ? '−' : String(q / 2).replace('-', '−')}π`; };
    for (const v of xm) { g.beginPath(); g.moveTo(X(v), mT); g.lineTo(X(v), h - mB); g.stroke(); g.fillText(etq(v), X(v), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(V.y1, V.y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(txt(fH(v, 3)), mL - 5, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); if (V.x1 < 0 && V.x2 > 0) { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); } g.stroke();
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    // f, sin unir los saltos
    const salto = 0.08 * (V.y2 - V.y1);
    g.strokeStyle = col['--ink']; g.lineWidth = 2.4; g.beginPath();
    let prev = null;
    V.xs.forEach((x, i) => { const y = V.ys[i]; if (!isFinite(y)) { prev = null; return; } if (prev !== null && Math.abs(y - prev) < salto) g.lineTo(X(x), Y(y)); else g.moveTo(X(x), Y(y)); prev = y; });
    g.stroke();
    // la suma parcial
    g.strokeStyle = col['--accent']; g.lineWidth = 2.2; g.beginPath();
    for (let i = 0; i <= 1400; i++) { const x = V.x1 + ((V.x2 - V.x1) * i) / 1400, y = sol.S(x, k); i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
    g.stroke();
    // la media en los saltos
    for (const s of sol.saltos) for (let m = -1; m <= 2; m++) { const x = s.x + (m - 1) * sol.T; if (x < V.x1 || x > V.x2) continue; g.fillStyle = col['--panel']; g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.arc(X(x), Y(s.media), 3.5, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    if (sol.x0 !== null && sol.x0 >= V.x1 && sol.x0 <= V.x2) { g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(sol.x0), Y(sol.S(sol.x0, k)), 4.5, 0, 2 * Math.PI); g.fill(); }
    g.restore();
    g.fillStyle = col['--accent']; g.font = '600 13px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillText(`S${sub(k)}(x)`, w - mR - 6, mT + 4);
  }
  function espectro() {
    const { g, w, h } = lienzo('#espectro');
    if (!sol) return;
    const n = sol.N, A = [Math.abs(sol.an[0] / 2)]; for (let j = 1; j <= n; j++) A.push(Math.hypot(sol.an[j], sol.bn[j]));
    const mx = Math.max(1e-12, ...A), mL = 40, mR = 10, mT = 14, mB = 22, ancho = (w - mL - mR) / (n + 1);
    const Y = (v) => h - mB - (v / mx) * (h - mT - mB);
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(0, mx, 3)) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(txt(fH(v, 2)), mL - 5, Y(v)); }
    A.forEach((v, j) => {
      const x = mL + j * ancho + ancho * 0.18;
      g.fillStyle = j <= k ? col['--accent'] : col['--line']; g.fillRect(x, Y(v), ancho * 0.64, h - mB - Y(v));
      if (n <= 30 || j % 5 === 0) { g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(String(j), x + ancho * 0.32, h - mB + 4); }
    });
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; if (tA > 0.6) { tA = 0; k = k >= sol.N ? 1 : k + 1; $('#armonicos').value = k; pintaK(); dibuja(); } }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('fourier').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.FourierApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { an: sol.an, bn: sol.bn, sx0: sol.sx0, gA: sol.gA, gB: sol.gB }, estado: () => copia(sc), armonicos: (n) => { k = Math.max(1, Math.min(sol ? sol.N : 1, n)); $('#armonicos').value = k; pintaK(); dibuja(); } };
})();
