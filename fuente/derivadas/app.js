/* =====================================================================
   Derivadas e integrales: interfaz (dos modos: derivada de orden 1 a 4
   con sus reglas, recta tangente y puntos críticos; primitiva con el
   método usado e integral definida con su área). La gráfica muestra f y
   f′ con la tangente que recorre la curva, o f con el área que se va
   llenando y la primitiva F. Tocando la gráfica se cambia x₀. El cálculo
   está en derivadas/calculo.js (Derivadas).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const DV = Derivadas, CLAVE = 'derivadas-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const fH = (x, d = 4) => DV.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const sup = (e) => [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '−' ? '⁻' : c)).join('');
  const txt = (s) => s.replace(/<sup>(.*?)<\/sup>/g, (_, e) => sup(e)).replace(/<[^>]+>/g, '');
  const coma = (v) => String(v).replace('.', ',');
  const MODOS = {
    derivada: { nom: 'Derivada', campos: [['f', 'f(x) =', ''], ['orden', 'Orden', '1 a 4'], ['x0', 'En x₀ =', 'opcional: tangente']] },
    integral: { nom: 'Integral', campos: [['f', 'f(x) =', ''], ['a', 'Desde a =', 'opcional'], ['b', 'Hasta b =', 'opcional']] },
  };
  const primero = (m) => DV.ejemplos.find((e) => e.sc.modo === m);

  let sc = copia(DV.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS[g.modo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, V = null, anda = false, u = 1;

  /* ---------- Formulario ---------- */
  function formulario() {
    $('#modo').innerHTML = Object.entries(MODOS).map(([k, m]) => `<option value="${k}"${sc.modo === k ? ' selected' : ''}>${m.nom}</option>`).join('');
    $('#campos').innerHTML = MODOS[sc.modo].campos.map(([k, et, ay]) => k === 'orden'
      ? `<label for="f-orden">${et}</label><select id="f-orden" class="in" data-c="orden">${[1, 2, 3, 4].map((n) => `<option value="${n}"${String(sc.orden) === String(n) ? ' selected' : ''}>${['f′', 'f″', 'f‴', 'f⁽⁴⁾'][n - 1]}</option>`).join('')}</select>`
      : `<label for="f-${k}">${et}${ay ? ` <small>(${ay})</small>` : ''}</label><input id="f-${k}" class="in${k === 'f' ? ' larga' : ''}" data-c="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`).join('');
    $('#nota-datos').innerHTML = sc.modo === 'derivada' ? 'Escribe f con x: x^2 sen(x), (x^2 + 1)/(x − 1), e^(−x^2), ln(sqrt(x^2 + 1)), x^x… Toca la gráfica para poner la tangente en otro punto.'
      : 'Polinomios, raíces, sen, cos, e^x, ln, cocientes de polinomios y productos: x e^(x^2), x^2 e^x, x ln(x), (3x + 5)/(x^2 + 2x − 3)… Con a y b sale la integral definida.';
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.c || t.tagName === 'SELECT') return; sc[t.dataset.c] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName !== 'SELECT') return; sc[t.dataset.c] = t.value; cambia(); });
  $('#modo').addEventListener('change', (e) => { const fx = sc.f; sc = copia(primero(e.target.value).sc); if (fx) sc.f = fx; formulario(); cambia(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + Object.entries(MODOS).map(([k, m]) => `<optgroup label="${m.nom}">${DV.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = DV.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; }, de = (xs) => xs[ent(0, xs.length - 1)];
    const k = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));
    const der = [
      () => `${k(nz(-3, 4))}x^${ent(2, 4)} ${de(['sen', 'cos'])}(${k(ent(1, 3))}x)`,
      () => `(${k(nz(-3, 3))}x^2 + ${ent(1, 5)})/(x - ${ent(1, 4)})`,
      () => `e^(${k(nz(-3, 3))}x^2)`,
      () => `ln(${k(ent(1, 3))}x^2 + ${ent(1, 4)})`,
      () => `x^${ent(2, 3)} e^(${nz(-2, 2)}x)`,
      () => `sqrt(${ent(1, 4)}x^2 + ${ent(1, 5)})`,
      () => `arctg(${ent(2, 4)}x)`,
    ];
    const inte = [
      () => [`${nz(-4, 5)}x^${ent(2, 4)} - ${ent(1, 6)}x + ${ent(1, 5)}`, '0', String(ent(1, 3))],
      () => [`x e^(${k(nz(-2, 2))}x^2)`, '0', '1'],
      () => [`x ${de(['e^x', 'sen(x)', 'cos(x)'])}`, '0', String(ent(1, 2))],
      () => [`x^${ent(1, 2)} ln(x)`, '1', String(ent(2, 4))],
      () => { const p = ent(1, 3); let q; do q = ent(-3, 3); while (q === -p || q === 0); return [`${ent(1, 5)}/((x + ${p})(x ${q < 0 ? '-' : '+'} ${Math.abs(q)}))`, String(Math.max(0, -q) + 1), String(Math.max(0, -q) + ent(2, 4))]; },
      () => [`1/(x^2 + ${de([1, 4, 9])})`, '0', String(ent(1, 3))],
      () => [`${de(['sen', 'cos'])}(${ent(1, 3)}x)`, '0', de(['pi/2', 'pi/4', 'pi'])],
    ];
    if (Math.random() < 0.5) sc = { modo: 'derivada', f: de(der)(), orden: String(ent(1, 2)), x0: String(ent(0, 2)) };
    else { const [fx, a, b] = de(inte)(); sc = { modo: 'integral', f: fx, a, b }; }
    try { DV.resolver(sc); } catch (e) { sc = copia(DV.ejemplos[0].sc); sc.x0 = '1'; }
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => sc.modo === 'derivada'
    ? `Deriva <b>f(x) = ${esc(sc.f)}</b>${Number(sc.orden) > 1 ? ` hasta la derivada ${['', 'primera', 'segunda', 'tercera', 'cuarta'][Number(sc.orden)]}` : ''} y da su valor en x = ${esc(sc.x0 || '0')}.`
    : `Calcula la primitiva de <b>f(x) = ${esc(sc.f)}</b> y la integral definida entre ${esc(sc.a)} y ${esc(sc.b)}.`;

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  const prima = (k) => (k <= 3 ? `f${'′'.repeat(k)}` : `f^{(${k})}`);
  function calcula() {
    const err = $('#error');
    try { sol = DV.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.modo === 'derivada') {
      sol.txt.forEach((t, i) => { h += dato(i ? `Derivada ${['', 'segunda', 'tercera', 'cuarta'][i]}` : 'Derivada', M(`${prima(i + 1)}(x) = ${t}`), 'ancho'); });
      if (sol.x0 !== undefined) {
        sol.vals.slice(1).forEach((v, i) => { h += dato(`${txt(prima(i + 1).replace(/\^\{\((\d)\)\}/, '⁽$1⁾'))}(${fH(sol.x0)})`, fH(v, 6), 'num'); });
        h += dato('Recta tangente', M(sol.tangente), 'ancho');
      }
      if (sol.constante) h += dato('Puntos críticos', 'Ninguno: f′ = 0 en todo x (f es constante)', 'ancho');
      else if (sol.crit.length) h += dato('Puntos críticos', sol.crit.slice(0, 4).map((q) => `x = ${fH(q.x)}: ${q.tipo}`).join('<br>'), 'ancho');
    } else {
      h += dato('Primitiva', sol.F ? M(`∫ f(x) dx = ${sol.Ftxt} + C`) : 'No es elemental (o no sé hacerla)', 'ancho');
      if (sol.a !== undefined) {
        h += dato(`Integral de ${fH(sol.a)} a ${fH(sol.b)}`, fH(sol.val, 6), 'num');
        if (Math.abs(sol.area - Math.abs(sol.val)) > 1e-4 * Math.max(1, sol.area)) h += dato('Área encerrada', fH(sol.area, 6));
      }
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').innerHTML = sol.modo === 'derivada'
      ? `En color, f(x); en azul, f′(x)${sol.x0 !== undefined ? `; la recta es la tangente en x₀ = ${fH(sol.x0)}` : ''}. Con ▶ Animar la tangente recorre la curva y su pendiente es el valor de f′. Toca la gráfica para poner x₀ en otro sitio.`
      : `En color, f(x)${sol.a !== undefined ? ', con el área entre a y b (arriba del eje suma, debajo resta)' : ''}${sol.F ? '; en azul, la primitiva F(x)' : ''}. Con ▶ Animar el área se va llenando.`;
    V = null; if (!anda) u = 1; dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); }
  const marcas = (a, b, n = 6) => {
    const p0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(p0)), paso = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0) || 10 * e;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  };
  const lienzo = (s) => {
    const c = $(s), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  };
  // rango vertical sin dejar que una asíntota lo aplaste todo: percentiles 5 y 95
  const rango = (vs) => {
    const ok = vs.filter((v) => isFinite(v)).sort((a, b) => a - b);
    if (!ok.length) return [-1, 1];
    let a = ok[Math.floor(ok.length * 0.04)], b = ok[Math.ceil(ok.length * 0.96) - 1];
    a = Math.min(a, 0); b = Math.max(b, 0);
    if (b - a < 1e-9) { a -= 1; b += 1; }
    const p = (b - a) * 0.12; return [a - p, b + p];
  };
  function ventana() {
    let x1, x2;
    if (sol.modo === 'derivada') { const c = sol.x0 ?? 0; x1 = c - 4; x2 = c + 4; }
    else if (sol.a !== undefined) { const lo = Math.min(sol.a, sol.b), hi = Math.max(sol.a, sol.b), m = (hi - lo) * 0.35 + 0.3; x1 = lo - m; x2 = hi + m; }
    else { x1 = -4; x2 = 4; }
    const xs = [], ys = [], y2 = [];
    for (let i = 0; i <= 900; i++) {
      const x = x1 + ((x2 - x1) * i) / 900;
      xs.push(x); ys.push(sol.f(x));
      y2.push(sol.modo === 'derivada' ? sol.d(1)(x) : sol.Ff ? sol.Ff(x) - (sol.a !== undefined ? sol.Ff(sol.a) : 0) : NaN);
    }
    const [ya, yb] = rango([...ys, ...ys, ...y2]);
    return { x1, x2, y1: ya, y2: yb, xs, ys, y2s: y2 };
  }
  const mL = 44, mR = 12, mT = 12, mB = 26;
  let trans = null;
  function ejes(g, w, h, X, Y) {
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(V.x1, V.x2, Math.max(4, Math.round(w / 80)))) { g.beginPath(); g.moveTo(X(v), mT); g.lineTo(X(v), h - mB); g.stroke(); g.fillText(txt(fH(v, 3)), X(v), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(V.y1, V.y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(txt(fH(v, 3)), mL - 5, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath();
    if (V.y1 < 0 && V.y2 > 0) { g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); }
    if (V.x1 < 0 && V.x2 > 0) { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); }
    g.stroke();
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('x', w - mR - 2, h - mB - 3);
  }
  // una curva, cortada donde salta (asíntotas)
  const linea = (g, xs, ys, X, Y, h) => { g.beginPath(); let dentro = false, py0 = 0; xs.forEach((x, i) => { const y = ys[i]; if (!isFinite(y)) { dentro = false; return; } const px = X(x), py = Y(y); if (dentro && Math.abs(py - py0) < h * 1.5) g.lineTo(px, py); else g.moveTo(px, py); dentro = true; py0 = py; }); g.stroke(); };
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    trans = null;
    if (!sol) return;
    if (!col['--ink']) colores();
    if (!V) V = ventana();
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    trans = (px) => V.x1 + ((px - mL) / (w - mL - mR)) * (V.x2 - V.x1);
    ejes(g, w, h, X, Y);
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    if (sol.modo === 'integral' && sol.a !== undefined) {
      // el área hasta donde va la animación: azul arriba del eje, roja debajo
      const lo = Math.min(sol.a, sol.b), hi = Math.max(sol.a, sol.b), fin = lo + (hi - lo) * u, n = 300;
      for (const [sg, c] of [[1, '--z1'], [-1, '--z2']]) {
        g.fillStyle = col[c]; g.globalAlpha = 0.22; g.beginPath(); g.moveTo(X(lo), Y(0));
        for (let i = 0; i <= n; i++) { const x = lo + ((fin - lo) * i) / n, y = sol.f(x); g.lineTo(X(x), Y(isFinite(y) && sg * y > 0 ? y : 0)); }
        g.lineTo(X(fin), Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1;
      }
      g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath();
      for (const x of [sol.a, sol.b]) { g.moveTo(X(x), mT); g.lineTo(X(x), h - mB); }
      g.stroke(); g.setLineDash([]);
    }
    // f′ o la primitiva
    if (V.y2s.some(isFinite)) { g.strokeStyle = col['--z1']; g.lineWidth = 1.8; g.setLineDash(sol.modo === 'integral' ? [6, 4] : []); linea(g, V.xs, V.y2s, X, Y, h); g.setLineDash([]); }
    g.strokeStyle = col['--accent']; g.lineWidth = 2.6; linea(g, V.xs, V.ys, X, Y, h);
    if (sol.modo === 'derivada') {
      // tangente: en x₀ quieta, o recorriendo la ventana con la animación
      const x0 = anda || sol.x0 === undefined ? V.x1 + (V.x2 - V.x1) * (anda ? u : 0.5) : sol.x0, y0 = sol.f(x0), m = sol.d(1)(x0);
      if (isFinite(y0) && isFinite(m)) {
        const L = (V.x2 - V.x1) * 0.28;
        g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(x0 - L), Y(y0 - m * L)); g.lineTo(X(x0 + L), Y(y0 + m * L)); g.stroke();
        g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(x0), Y(y0), 5, 0, 2 * Math.PI); g.fill();
        g.fillStyle = col['--z1']; g.beginPath(); g.arc(X(x0), Y(m), 4, 0, 2 * Math.PI); g.fill();
        g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--ink']; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText(`pendiente ${txt(fH(m, 3))}`, mL + 8, mT + 6);
      }
      for (const q of sol.crit) { g.fillStyle = col['--panel']; g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.arc(X(q.x), Y(q.y), 4, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    }
    g.restore();
    g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillStyle = col['--accent']; g.fillText('f(x)', w - mR - (sol.modo === 'derivada' || sol.F ? 52 : 6), mT + 4);
    if (sol.modo === 'derivada' || sol.F) { g.fillStyle = col['--z1']; g.fillText(sol.modo === 'derivada' ? 'f′(x)' : 'F(x)', w - mR - 6, mT + 4); }
  }
  $('#grafica').addEventListener('click', (e) => {
    if (!sol || !trans || sol.modo !== 'derivada') return;
    const r = e.target.getBoundingClientRect(), x = trans(e.clientX - r.left);
    sc.x0 = coma(+x.toPrecision(3)); formulario(); cambia();
  });
  $('#animar').addEventListener('click', () => (anda ? para() : arranca()));
  function arranca() { if (!sol) return; anda = true; u = 0; $('#animar').textContent = '⏸ Parar'; }
  function para() { anda = false; u = 1; $('#animar').textContent = '▶ Animar'; dibuja(); }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { u += dt / (sol.modo === 'derivada' ? 6 : 3); if (u >= 1) { u = 1; anda = false; $('#animar').textContent = '▶ Animar'; } dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('derivadas').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.DerivadasApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, txt: sol.txt ?? sol.Ftxt, val: sol.val, m: sol.m, crit: sol.crit?.map((q) => q.tipo) }, estado: () => copia(sc) };
})();
