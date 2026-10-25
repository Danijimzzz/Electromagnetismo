/* =====================================================================
   Series de Taylor: interfaz (función, punto, grado y x₀; gráfica de f
   con los polinomios de Taylor de cada grado, que se pueden recorrer o
   animar; resultados y desarrollo). El cálculo está en taylor/calculo.js
   (Taylor) y las expresiones en matematicas/expresion.js.
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const T = Taylor, CLAVE = 'taylor-v1';
  // decimal en HTML: 2,84·10<sup>−4</sup>
  const fH = (x, d = 4) => T.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  // para el lienzo: 10<sup>−7</sup> → 10⁻⁷
  const txt = (s) => s.replace(/<sup>(.*?)<\/sup>/g, (_, e) => [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '−' ? '⁻' : c)).join('')).replace(/<[^>]+>/g, '');

  let sc = copia(T.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g.f === 'string') sc = { ...sc, ...g }; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, grado = 0, anda = false;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, modo = 'text') => `<label for="f-${k}">${nom}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="${modo}" autocomplete="off" spellcheck="false">`;
  const esLimite = () => sc.modo === 'limite';
  function formulario() {
    const modo = `<label for="f-modo">Qué calcular</label><select id="f-modo" class="in" data-k="modo"><option value="polinomio">Polinomio de Taylor</option><option value="limite"${esLimite() ? ' selected' : ''}>Límite con Taylor</option></select>`;
    $('#campos').innerHTML = modo + (esLimite()
      ? fila('f', 'Función <small>(un cociente)</small>') + fila('a', 'Punto a <small>(x → a)</small>')
      : fila('f', 'Función f(x)') + fila('a', 'Punto a <small>(centro)</small>') + fila('n', `Grado n <small>(hasta ${T.MAXN})</small>`, 'numeric') + '<div class="sep">Aproximación (opcional)</div>' + fila('x0', 'Valor x₀ <small>(para f(x₀))</small>'));
    $('#control').hidden = esLimite();
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    sc[t.dataset.k] = t.value; $('#ejemplos').value = '';
    if (t.dataset.k === 'modo') { if (t.value === 'polinomio') sc = { ...sc, n: sc.n || '4', x0: sc.x0 ?? '' }; formulario(); }
    calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + T.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = T.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los que se hacen en clase, para el modo práctica
  const AZAR = [
    ['e^x', ['0'], ['0,1', '0,2', '0,3', '0,5', '−0,2']], ['sen x', ['0'], ['0,1', '0,2', '0,3', '0,5']], ['cos x', ['0'], ['0,1', '0,2', '0,3', '0,4']],
    ['ln(1+x)', ['0'], ['0,1', '0,2', '−0,1']], ['√x', ['1', '4', '9'], null], ['ln x', ['1'], ['1,1', '1,2', '0,9']], ['e^(2x)', ['0'], ['0,1', '0,2']],
    ['1/(1-x)', ['0'], ['0,1', '0,2']], ['√(1+x)', ['0'], ['0,1', '0,2']], ['arctg x', ['0'], ['0,1', '0,2']], ['x e^x', ['0'], ['0,1', '0,2']], ['1/x', ['1', '2'], null],
  ];
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), uno = (xs) => xs[ent(0, xs.length - 1)];
    const [fx, as, xs] = uno(AZAR), a = uno(as);
    const x0 = xs ? uno(xs) : String(+a + uno([0.1, 0.2, -0.1])).replace('.', ',').replace('-', '−');
    sc = { modo: 'polinomio', f: fx, a, n: String(ent(2, 4)), x0 };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => esLimite() ? `Calcula con desarrollos de Taylor el límite de <b>${esc(sc.f)}</b> cuando <b>x → ${esc(sc.a)}</b>.` : `Calcula el polinomio de Taylor de grado <b>${esc(sc.n)}</b> de <b>f(x) = ${esc(sc.f)}</b> en <b>x = ${esc(sc.a)}</b>, sus coeficientes, y úsalo para aproximar <b>f(${esc(sc.x0)})</b>. ¿Qué error se comete?`;

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  function calcula() {
    const err = $('#error');
    try { sol = T.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      dibuja(); return;
    }
    err.hidden = true; guarda();
    if (sol.modo === 'limite') {
      $('#resumen').innerHTML = dato(`Límite cuando x → ${esc(sol.aTxt)}`, sol.txt === 'no existe' ? 'No existe' : M(sol.txt), 'num ancho')
        + dato('Orden del numerador', sol.oN < 0 ? '—' : sol.oN) + dato('Orden del denominador', sol.oD);
      $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
      $('#leyenda').innerHTML = `${Mates.html(`$f(x) = ${sol.f}$`)} cerca de a` + (isFinite(sol.val) ? '; el círculo hueco marca el límite, que la función alcanza sin estar definida en a.' : '.');
      if (anda) para();
      dibuja(); return;
    }
    const n = sol.n, sub = (k) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
    let h = dato(`Polinomio de Taylor P${sub(n)}(x)`, M(`${sol.Pn}(x) = ${sol.pol}`), 'ancho');
    if (n <= 8) h += dato(`Coeficientes c₀ … c${sub(n)}`, sol.coef.map((c) => fH(c, 4)).join('; '), 'num');
    if (sol.x0 !== null) {
      h += dato(`P${sub(n)}(x₀), con x₀ = ${fH(sol.x0, 6)}`, fH(sol.px0, 7), 'num') + dato('Valor exacto f(x₀)', fH(sol.fx0, 7), 'num') + dato('Error |f(x₀) − P(x₀)|', fH(sol.err, 3), 'num');
      if (sol.cota !== null) h += dato('Cota de Lagrange', `≤ ${fH(sol.cota, 3)}`);
    }
    if (sol.conocido) h += dato('Converge', sol.conocido.conv.replace(/^para /, ''));
    else if (sol.R !== null) h += dato('Radio de convergencia', sol.R === Infinity ? '∞ (todo x)' : M(sol.Rtxt));
    if (sol.evitable) h += dato('Singularidad evitable', `f(${esc(sol.aTxt)}) = ${fH(sol.coef[0], 6)} por continuidad`);
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    const rg = $('#grado'); rg.max = n; grado = Math.min(n, anda ? grado : n); rg.value = grado;
    pintaGrado();
    dibuja();
  }
  function pintaGrado() {
    if (!sol || sol.modo === 'limite') return;
    $('#vgrado').textContent = grado;
    $('#leyenda').innerHTML = `${Mates.html(`$f(x) = ${sol.f}$`)} en negro, ${Mates.html(`$P_{${grado}}(x)$`)} en color y los de grado menor más claros. ` + (sol.x0 !== null ? 'La línea vertical marca x₀: la distancia entre los dos puntos es el error.' : 'Escribe x₀ para ver la aproximación y el error.');
  }
  $('#grado').addEventListener('input', (e) => { grado = +e.target.value; if (anda) para(); pintaGrado(); dibuja(); });
  $('#animar').addEventListener('click', () => (anda ? para() : arranca()));
  let tA = 0;
  function arranca() { if (!sol || sol.modo === 'limite') return; anda = true; grado = 0; tA = 0; $('#grado').value = 0; $('#animar').textContent = '⏸ Parar'; pintaGrado(); dibuja(); }
  function para() { anda = false; $('#animar').textContent = '▶ Ver cómo se acerca'; }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel', '--bg', '--z2']) col[k] = cs.getPropertyValue(k).trim(); }
  const marcas = Herramienta.marcas;
  let cacheVentana = null;
  function ventana() {
    const a = sol.a, W = Math.max(3, sol.x0 != null ? 1.6 * Math.abs(sol.x0 - a) : 0), x1 = a - W, x2 = a + W;
    const xs = [], ys = [];
    for (let i = 0; i <= 600; i++) { const x = x1 + ((x2 - x1) * i) / 600; let y; try { y = sol.fv(x); } catch (e) { y = NaN; } xs.push(x); ys.push(isFinite(y) ? y : NaN); }
    const ok = ys.filter(isFinite).sort((p, q) => p - q);
    let y1 = ok.length ? ok[Math.floor(ok.length * 0.03)] : -1, y2 = ok.length ? ok[Math.ceil(ok.length * 0.97) - 1] : 1;
    for (const v of sol.modo === 'limite' ? [isFinite(sol.val) ? sol.val : null] : [sol.coef[0], sol.fx0, sol.px0]) if (v !== null && isFinite(v)) { y1 = Math.min(y1, v); y2 = Math.max(y2, v); }
    if (y2 - y1 < 1e-9) { y1 -= 1; y2 += 1; }
    const pad = (y2 - y1) * 0.15;
    return { x1, x2, y1: y1 - pad, y2: y2 + pad, xs, ys };
  }
  function dibuja() {
    const c = $('#grafica'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    if (!sol) return;
    if (!col['--ink']) colores();
    const clave = JSON.stringify([sc.modo, sc.f, sc.a, sc.n, sc.x0]);
    if (!cacheVentana || cacheVentana.k !== clave) cacheVentana = { k: clave, v: ventana() };
    const V = cacheVentana.v, mL = 44, mR = 12, mT = 12, mB = 26;
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1;
    // cuadrícula y ejes
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    const num = (v) => txt(fH(v, 3));
    for (const v of marcas(V.x1, V.x2, Math.max(4, Math.round(w / 80)))) { g.beginPath(); g.moveTo(X(v), mT); g.lineTo(X(v), h - mB); g.stroke(); g.fillText(num(v), X(v), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(V.y1, V.y2, Math.max(4, Math.round(h / 60)))) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(num(v), mL - 5, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath();
    if (V.y1 < 0 && V.y2 > 0) { g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); }
    if (V.x1 < 0 && V.x2 > 0) { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); }
    g.stroke();
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    const curva = (fx) => {
      g.beginPath(); let dentro = false;
      for (const x of V.xs) {
        const y = fx(x);
        if (!isFinite(y) || Math.abs(y - (V.y1 + V.y2) / 2) > 50 * (V.y2 - V.y1)) { dentro = false; continue; }
        dentro ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); dentro = true;
      }
      g.stroke();
    };
    if (sol.modo === 'limite') {
      g.strokeStyle = col['--ink']; g.lineWidth = 2.4;
      const ys = V.ys; let i = 0; curva(() => ys[i++]);
      g.restore();
      g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath(); g.moveTo(X(sol.a), mT); g.lineTo(X(sol.a), h - mB); g.stroke(); g.setLineDash([]);
      if (isFinite(sol.val)) { g.strokeStyle = col['--accent']; g.fillStyle = col['--panel']; g.lineWidth = 2; g.beginPath(); g.arc(X(sol.a), Y(sol.val), 5, 0, 2 * Math.PI); g.fill(); g.stroke(); }
      g.fillStyle = col['--accent']; g.font = '600 13px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'top';
      g.fillText(`límite = ${txt(sol.txt === 'no existe' ? 'no existe' : fH(sol.val, 4))}`, w - mR - 6, mT + 4);
      return;
    }
    // polinomios de grado menor, más claros
    g.strokeStyle = col['--accent']; g.lineWidth = 1.3; g.globalAlpha = 0.22;
    for (let k = 0; k < grado; k++) curva((x) => sol.P(x, k));
    g.globalAlpha = 1;
    // f
    g.strokeStyle = col['--ink']; g.lineWidth = 2.4;
    const ys = V.ys; let i = 0; curva(() => ys[i++]);
    // P del grado elegido
    g.strokeStyle = col['--accent']; g.lineWidth = 2.6; g.setLineDash([]); curva((x) => sol.P(x, grado));
    g.restore();
    const punto = (x, y, color, r = 4.5) => { if (!isFinite(y)) return; g.fillStyle = color; g.beginPath(); g.arc(X(x), Y(y), r, 0, 2 * Math.PI); g.fill(); g.strokeStyle = col['--panel']; g.lineWidth = 1.5; g.stroke(); };
    // el punto a
    punto(sol.a, sol.coef[0], col['--ink']);
    g.fillStyle = col['--ink']; g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText('a', X(sol.a) + 6, Y(sol.coef[0]) - 4);
    if (sol.x0 !== null && sol.x0 >= V.x1 && sol.x0 <= V.x2) {
      const pk = sol.P(sol.x0, grado);
      g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath(); g.moveTo(X(sol.x0), mT); g.lineTo(X(sol.x0), h - mB); g.stroke(); g.setLineDash([]);
      punto(sol.x0, sol.fx0, col['--ink']); punto(sol.x0, pk, col['--accent']);
      g.fillStyle = col['--muted']; g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText('x₀', X(sol.x0) + 5, mT + 2);
      g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = X(sol.x0) > w * 0.7 ? 'right' : 'left'; g.textBaseline = 'bottom';
      g.fillText(`error = ${txt(fH(Math.abs(sol.fx0 - pk), 2))}`, X(sol.x0) + (g.textAlign === 'right' ? -8 : 8), h - mB - 4);
    }
    // grado mostrado
    g.fillStyle = col['--accent']; g.font = '600 13px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillText(`P${String(grado).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])}(x)`, w - mR - 6, mT + 4);
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) {
      tA += dt;
      if (tA > 1.1) { tA = 0; grado = grado >= sol.n ? 0 : grado + 1; $('#grado').value = grado; pintaGrado(); dibuja(); }
    }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('taylor').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.TaylorApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && (sol.modo === 'limite' ? { lim: sol.val, txt: sol.txt } : { pol: sol.pol, coef: sol.coef, px0: sol.px0, fx0: sol.fx0, err: sol.err, cota: sol.cota }), estado: () => copia(sc), grado: (k) => { grado = Math.max(0, Math.min(sol ? sol.n : 0, k)); $('#grado').value = grado; pintaGrado(); dibuja(); } };
})();
