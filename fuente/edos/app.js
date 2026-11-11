/* =====================================================================
   Ecuaciones diferenciales: interfaz (tres modos: primer orden con Euler
   y RK4, segundo orden con coeficientes constantes y sistemas 2×2; campo
   de pendientes o diagrama de fases con trayectorias, x(t) e y(t), y una
   animación que recorre la solución). Tocando la gráfica se cambia el
   punto inicial. El cálculo está en edos/calculo.js (EDOs) y las
   expresiones en matematicas/expresion.js.
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const D = EDOs, CLAVE = 'edos-v1';
  const fH = (x, d = 4) => D.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const sup = (e) => [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '−' ? '⁻' : c)).join('');
  const txt = (s) => s.replace(/<sup>(.*?)<\/sup>/g, (_, e) => sup(e)).replace(/<[^>]+>/g, '');
  const coma = (v) => String(v).replace('.', ',');
  const MODOS = {
    primer: { nom: 'Primer orden: y′ = f(x, y)', campos: [['f', 'y′ =', 'función de x e y'], ['x0', 'x₀', ''], ['y0', 'y(x₀)', ''], ['x1', 'Hasta x =', ''], ['h', 'Paso h de Euler', '']] },
    segundo: { nom: 'Segundo orden: a y″ + b y′ + c y = g(x)', campos: [['a', 'a', 'coeficiente de y″'], ['b', 'b', 'de y′'], ['c', 'c', 'de y'], ['g', 'g(x)', '0 si es homogénea'], ['x0', 'x₀', ''], ['y0', 'y(x₀)', ''], ['v0', 'y′(x₀)', ''], ['x1', 'Hasta x =', '']] },
    superior: { nom: 'Orden 3 o 4, o Cauchy-Euler', campos: [['ec', 'Ecuación', "con y', y'', y''', y''''"], ['x0', 'x₀', ''], ['ini', 'y(x₀); y′(x₀); …', 'separadas por ;'], ['x1', 'Hasta x =', '']] },
    sistema: { nom: 'Sistema: x′ = f(x, y), y′ = g(x, y)', campos: [['f', 'x′ =', 'función de x e y'], ['g', 'y′ =', 'función de x e y'], ['x0', 'x(0)', ''], ['y0', 'y(0)', ''], ['t1', 'Hasta t =', '']] },
  };
  const primero = (m) => D.ejemplos.find((e) => e.sc.modo === m);

  let sc = copia(D.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS[g.modo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, V = null, extra = null, anda = false, u = 1;

  /* ---------- Formulario ---------- */
  function formulario() {
    $('#modo').innerHTML = Object.entries(MODOS).map(([k, m]) => `<option value="${k}"${sc.modo === k ? ' selected' : ''}>${m.nom}</option>`).join('');
    $('#campos').innerHTML = MODOS[sc.modo].campos.map(([k, et, ay]) => `<label for="f-${k}">${et}${ay ? ` <small>(${ay})</small>` : ''}</label><input id="f-${k}" class="in${k === 'f' || k === 'g' || k === 'ec' ? ' larga' : ''}" data-c="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`).join('');
    $('#nota-datos').innerHTML = sc.modo === 'primer' ? 'Escribe f con x e y: x + y, 4 − 2y, y(1 − y), sen x − y… Si dejas h vacío se usan 10 pasos.' : sc.modo === 'segundo' ? 'g(x) puede ser una suma de polinomios, exponenciales, senos y cosenos: x, e^(3x), 3 cos(2x), x e^x… Si es otra (tg x, 1/cos x, eˣ/x) se usa variación de parámetros.' : sc.modo === 'superior' ? "Escribe la ecuación con y', y'', y''' e y'''' (o ′ ″ ‴): y''' − 3y'' + 3y' − y = e^x. Si cada derivada va por x^k, es de Cauchy-Euler: x^2 y'' − 2x y' + 2y = x^3." : 'Escribe x′ y y′ con x e y: y, −x, 2x − x y, −sen x − 0,3y… Toca el diagrama para empezar desde otro punto.';
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.c) return; sc[t.dataset.c] = t.value; cambia(); });
  $('#modo').addEventListener('change', (e) => { sc = copia(primero(e.target.value).sc); formulario(); cambia(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + Object.entries(MODOS).map(([k, m]) => `<optgroup label="${m.nom.split(':')[0]}">${D.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = D.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; };
    const lin = (k, v, c = '') => (k === 0 ? '' : `${k < 0 ? '-' : c}${Math.abs(k) === 1 ? '' : Math.abs(k)}${v}`);
    const tipos = [
      () => { const k = nz(-3, 2), c = ent(1, 6); return { modo: 'primer', f: `${c} ${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}y`, x0: '0', y0: String(ent(0, 3)), x1: '1', h: '0,2' }; },
      () => ({ modo: 'primer', f: `${lin(nz(-2, 2), 'x')} ${['+', '-'][ent(0, 1)]} y`, x0: '0', y0: String(ent(1, 3)), x1: '1', h: '0,25' }),
      () => { let r1 = nz(-3, 2), r2 = nz(-3, 2); if (r1 === r2) r2 = r1 - 1 || -2; return { modo: 'segundo', a: '1', b: String(-(r1 + r2)), c: String(r1 * r2), g: '0', x0: '0', y0: String(ent(0, 2)), v0: String(ent(-2, 2)), x1: '3' }; },
      () => { const al = ent(-2, 0), be = ent(1, 3); return { modo: 'segundo', a: '1', b: String(-2 * al), c: String(al * al + be * be), g: ['0', String(ent(1, 5)), 'x', `e^(${ent(1, 2) === 1 ? '' : 2}x)`][ent(0, 3)], x0: '0', y0: String(ent(0, 2)), v0: String(ent(0, 2)), x1: '6' }; },
      () => { let a, b, c, d; do { a = ent(-3, 3); b = ent(-3, 3); c = ent(-3, 3); d = ent(-3, 3); } while (a * d - b * c === 0 || (!b && !c)); const t = (p, q) => `${lin(p, 'x')}${q ? `${p ? (q < 0 ? ' - ' : ' + ') : q < 0 ? '-' : ''}${Math.abs(q) === 1 ? '' : Math.abs(q)}y` : ''}` || '0'; return { modo: 'sistema', f: t(a, b), g: t(c, d), x0: String(nz(-2, 2)), y0: String(ent(-2, 2)), t1: '3' }; },
    ];
    sc = tipos[ent(0, tipos.length - 1)]();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'primer') return `Resuelve <b>y′ = ${esc(sc.f)}</b> con y(${esc(sc.x0)}) = ${esc(sc.y0)}: aproxima y(${esc(sc.x1)}) con el método de Euler de paso h = ${esc(sc.h || '')} y compáralo con la solución exacta si la tiene.`;
    if (sc.modo === 'segundo') { const t = (k, s, p) => { const v = Number(String(k).replace(',', '.')); return !v ? '' : `${v < 0 ? ' − ' : p ? '' : ' + '}${Math.abs(v) === 1 ? '' : coma(Math.abs(v))}${s}`; }; return `Resuelve <b>${t(sc.a, 'y″', true)}${t(sc.b, 'y′')}${t(sc.c, 'y')} = ${esc(sc.g || '0')}</b> con y(${esc(sc.x0)}) = ${esc(sc.y0)} y y′(${esc(sc.x0)}) = ${esc(sc.v0)}, y da y(${esc(sc.x1)}).`; }
    if (sc.modo === 'superior') return `Resuelve <b>${esc(sc.ec)}</b> con las condiciones iniciales ${esc(sc.ini)} en x = ${esc(sc.x0)}, y da y(${esc(sc.x1)}).`;
    return `Estudia el sistema <b>x′ = ${esc(sc.f)}, y′ = ${esc(sc.g)}</b>: sus puntos críticos y su tipo, y la solución que sale de (${esc(sc.x0)}, ${esc(sc.y0)}) hasta t = ${esc(sc.t1)}.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  function calcula() {
    const err = $('#error');
    try { sol = D.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      $('#tiempo').hidden = true; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.modo === 'primer') {
      if (sol.exacta) h += dato('Solución exacta', M(`y(x) = ${sol.exacta.txt}`), 'ancho');
      else if (sol.implicita) h += dato('Solución (implícita)', M(sol.implicita), 'ancho');
      if (sol.explota !== null) h += dato('La solución explota', `cerca de x ≈ ${fH(sol.explota, 4)} (asíntota vertical): y(${fH(sol.x1)}) no existe`, 'ancho');
      else {
        h += dato(`y(${fH(sol.x1)}) con Euler`, fH(sol.yEu, 6), 'num');
        h += dato(`y(${fH(sol.x1)}) con RK4`, fH(sol.yRK, 6), 'num');
        if (sol.exacta) h += dato(`y(${fH(sol.x1)}) exacta`, fH(sol.yEx, 6), 'num');
        h += dato('Error de Euler', fH(Math.abs(sol.yEu - (sol.exacta ? sol.yEx : sol.yRK)), 4));
        if (sol.metodos) h += dato(`Errores con h = ${fH(sol.h)}`, sol.metodos.filter((q) => q.nom !== 'Euler').map((q) => `${q.nom}: ${fH(q.err, 2)}`).join('; '));
      }
    } else if (sol.modo === 'segundo') {
      h += dato('Solución', M(`y(x) = ${sol.txt}`), 'ancho');
      h += dato('Raíces', Mates.html(sol.raices.replace(/, (reales|doble|complejas).*$/, '')));
      h += dato('Comportamiento', sol.tipo);
      h += dato(`y(${fH(sol.x1)})`, fH(sol.y(sol.x1), 6), 'num');
    } else {
      if (sol.sol) h += dato('Solución', M(`x(t) = ${sol.sol.xTxt}`) + '<br>' + M(`y(t) = ${sol.sol.yTxt}`), 'ancho');
      for (const q of sol.puntos.slice(0, 4)) h += dato(`Punto crítico (${fH(q.x, 3)}, ${fH(q.y, 3)})`, q.tp.nom.replace(/ \(.*\)$/, ''));
      const fin = sol.tray[sol.tray.length - 1];
      h += dato(`x(${fH(fin.t, 4)})`, fH(fin.Y[0], 5), 'num') + dato(`y(${fH(fin.t, 4)})`, fH(fin.Y[1], 5), 'num');
    }
    $('#resumen').innerHTML = h;
    // «Usar en…»: la ecuación de 2.º orden con sus condiciones iniciales, resuelta con Laplace (si parte de t = 0)
    { const ue = $('#usar-en'), ok = sol.modo === 'segundo' && !sol.superior && sol.x0 === 0; ue.hidden = !ok; ue.innerHTML = ok ? `<a class="btn" data-usar="matematicas/laplace" href="${esc(Herramienta.enlaceA('laplace', { modo: 'edo', a: sc.a, b: sc.b, c: sc.c, g: sc.g, y0: sc.y0, v0: sc.v0 }))}">Resolver con Laplace →</a>` : ''; }
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#tiempo').hidden = sol.modo !== 'sistema';
    $('#leyenda').innerHTML = sol.modo === 'primer' ? `Campo de pendientes de y′ = f(x, y). En color, los pasos de Euler con h = ${fH(sol.h)}; en negro, ${sol.exacta ? 'la solución exacta' : 'la solución con RK4'}. Toca la gráfica para empezar en otro punto.`
      : sol.modo === 'segundo' ? `La solución y(x) con y(${fH(sol.x0)}) = ${fH(sol.y0)} y y′(${fH(sol.x0)}) = ${fH(sol.v0)}. Con ▶ Animar un punto recorre la curva.`
        : 'Diagrama de fases: las flechas son la velocidad (x′, y′); en gris, otras trayectorias; en color, la que sale del punto inicial. Toca el diagrama para empezar en otro punto.';
    V = null; extra = null; if (!anda) u = 1; dibuja();
  }

  /* ---------- Gráficas ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); }
  const marcas = Herramienta.marcas;
  const lienzo = (s) => Herramienta.lienzo(s);
  const rango = (vs, pad = 0.12, min = 1) => {
    const ok = vs.filter((v) => isFinite(v) && Math.abs(v) < 1e9);
    let a = Math.min(...ok), b = Math.max(...ok);
    if (!ok.length) { a = -1; b = 1; }
    if (b - a < 1e-9 * min) { a -= min; b += min; }
    const p = (b - a) * pad; return [a - p, b + p];
  };
  function ventana() {
    if (sol.modo === 'primer') {
      // si la solución explota, la ventana llega solo hasta poco antes de la asíntota
      const xm = sol.explota !== null ? sol.x0 + 0.9 * (sol.explota - sol.x0) : Infinity;
      const ys = [...sol.fino.filter((q) => q.t <= xm).map((q) => q.Y[0]), ...sol.eul.filter((q) => q.x <= xm).map((q) => q.y)];
      const [y1, y2] = rango(ys, 0.15), dx = (sol.x1 - sol.x0) * 0.04;
      return { x1: sol.x0 - dx, x2: sol.x1 + dx, y1, y2 };
    }
    if (sol.modo === 'segundo') {
      const xs = [], ys = [];
      for (let i = 0; i <= 800; i++) { const x = sol.x0 + ((sol.x1 - sol.x0) * i) / 800; xs.push(x); ys.push(sol.y(x)); }
      const [y1, y2] = rango([...ys, 0], 0.14);
      return { x1: sol.x0, x2: sol.x1, y1, y2, xs, ys };
    }
    // sistema: los puntos críticos y el punto inicial; la trayectoria si no se va muy lejos
    const bx = [sol.x0, ...sol.puntos.map((q) => q.x)], by = [sol.y0, ...sol.puntos.map((q) => q.y)];
    let [x1, x2] = rango(bx, 0.6, 2), [y1, y2] = rango(by, 0.6, 2);
    const tx = sol.tray.map((q) => q.Y[0]), ty = sol.tray.map((q) => q.Y[1]), [ax, bx2] = rango(tx, 0.1), [ay, by2] = rango(ty, 0.1);
    if (bx2 - ax < 4 * (x2 - x1)) { x1 = Math.min(x1, ax); x2 = Math.max(x2, bx2); }
    if (by2 - ay < 4 * (y2 - y1)) { y1 = Math.min(y1, ay); y2 = Math.max(y2, by2); }
    return { x1, x2, y1, y2 };
  }
  const mL = 44, mR = 12, mT = 12, mB = 26;
  let trans = null;
  function ejes(g, w, h, X, Y, etX = 'x', etY = 'y') {
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(V.x1, V.x2, Math.max(4, Math.round(w / 80)))) { g.beginPath(); g.moveTo(X(v), mT); g.lineTo(X(v), h - mB); g.stroke(); g.fillText(txt(fH(v, 3)), X(v), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(V.y1, V.y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(txt(fH(v, 3)), mL - 5, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath();
    if (V.y1 < 0 && V.y2 > 0) { g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); }
    if (V.x1 < 0 && V.x2 > 0) { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); }
    g.stroke();
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(etX, w - mR - 2, h - mB - 3);
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(etY, mL + 4, mT + 2);
  }
  const flecha = (g, x, y, dx, dy, L, punta = true) => {
    const n = Math.hypot(dx, dy); if (!(n > 0) || !isFinite(n)) return;
    const ux = dx / n, uy = dy / n, x2 = x + ux * L / 2, y2 = y + uy * L / 2;
    g.moveTo(x - ux * L / 2, y - uy * L / 2); g.lineTo(x2, y2);
    if (punta) { const a = 3.2; g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.5 - uy * a, y2 - uy * a * 1.5 + ux * a); g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.5 + uy * a, y2 - uy * a * 1.5 - ux * a); }
  };
  const linea = (g, pts, X, Y) => { g.beginPath(); let dentro = false; for (const [x, y] of pts) { if (!isFinite(y) || !isFinite(x)) { dentro = false; continue; } const px = X(x), py = Y(y); if (dentro) g.lineTo(px, py); else g.moveTo(px, py); dentro = true; } g.stroke(); };
  function dibuja() { grafica(); tiempo(); }
  function grafica() {
    const { g, w, h } = lienzo('#grafica');
    trans = null;
    if (!sol) return;
    if (!col['--ink']) colores();
    if (!V) V = ventana();
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    trans = { x: (px) => V.x1 + ((px - mL) / (w - mL - mR)) * (V.x2 - V.x1), y: (py) => V.y2 - ((py - mT) / (h - mT - mB)) * (V.y2 - V.y1) };
    ejes(g, w, h, X, Y);
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    const sx = (w - mL - mR) / (V.x2 - V.x1), sy = (h - mT - mB) / (V.y2 - V.y1);
    if (sol.modo === 'primer') {
      // campo de pendientes
      const nx = Math.max(10, Math.round((w - mL - mR) / 30)), ny = Math.max(8, Math.round((h - mT - mB) / 30));
      g.strokeStyle = col['--muted']; g.globalAlpha = 0.55; g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = V.x1 + ((i + 0.5) / nx) * (V.x2 - V.x1), y = V.y1 + ((j + 0.5) / ny) * (V.y2 - V.y1); let m; try { m = sol.F(x, y); } catch (e) { m = NaN; } if (isFinite(m)) flecha(g, X(x), Y(y), sx, -m * sy, 16, false); }
      g.stroke(); g.globalAlpha = 1;
      // solución exacta o RK4
      g.strokeStyle = col['--ink']; g.lineWidth = 2.2;
      linea(g, sol.exacta ? Array.from({ length: 401 }, (_, i) => { const x = sol.x0 + ((sol.x1 - sol.x0) * i) / 400; return [x, sol.exacta.y(x)]; }) : sol.fino.map((q) => [q.t, q.Y[0]]), X, Y);
      // Euler, paso a paso
      const n = Math.max(1, Math.ceil(u * (sol.eul.length - 1)));
      g.strokeStyle = col['--accent']; g.lineWidth = 2; linea(g, sol.eul.slice(0, n + 1).map((q) => [q.x, q.y]), X, Y);
      g.fillStyle = col['--accent']; for (const q of sol.eul.slice(0, n + 1)) { g.beginPath(); g.arc(X(q.x), Y(q.y), 3, 0, 2 * Math.PI); g.fill(); }
    } else if (sol.modo === 'segundo') {
      g.strokeStyle = col['--ink']; g.globalAlpha = 0.25; g.lineWidth = 2.2; linea(g, V.xs.map((x, i) => [x, V.ys[i]]), X, Y); g.globalAlpha = 1;
      const n = Math.round(u * (V.xs.length - 1));
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; linea(g, V.xs.slice(0, n + 1).map((x, i) => [x, V.ys[i]]), X, Y);
      g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(V.xs[n]), Y(V.ys[n]), 5, 0, 2 * Math.PI); g.fill();
      g.fillStyle = col['--panel']; g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.arc(X(sol.x0), Y(sol.y0), 3.5, 0, 2 * Math.PI); g.fill(); g.stroke();
    } else {
      // flechas del campo de direcciones
      const nx = Math.max(10, Math.round((w - mL - mR) / 34)), ny = Math.max(8, Math.round((h - mT - mB) / 34));
      g.strokeStyle = col['--muted']; g.globalAlpha = 0.6; g.lineWidth = 1.1; g.beginPath();
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = V.x1 + ((i + 0.5) / nx) * (V.x2 - V.x1), y = V.y1 + ((j + 0.5) / ny) * (V.y2 - V.y1); let a, b; try { a = sol.F(x, y); b = sol.G(x, y); } catch (e) { a = NaN; } if (isFinite(a) && isFinite(b)) flecha(g, X(x), Y(y), a * sx, -b * sy, 15); }
      g.stroke(); g.globalAlpha = 1;
      // otras trayectorias, hacia delante y hacia atrás
      if (!extra) {
        extra = []; const T = Math.min(Math.max(sol.t1, 4), 30);
        const ida = (t, Y) => [sol.F(Y[0], Y[1]), sol.G(Y[0], Y[1])], vuelta = (t, Y) => [-sol.F(Y[0], Y[1]), -sol.G(Y[0], Y[1])];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
          const p = [V.x1 + ((i + 0.5) / 4) * (V.x2 - V.x1), V.y1 + ((j + 0.5) / 3) * (V.y2 - V.y1)];
          for (const fn of [ida, vuelta]) extra.push(D.rk4(fn, 0, p, T, 500).map((q) => q.Y).filter((q) => q[0] > V.x1 - (V.x2 - V.x1) && q[0] < V.x2 + (V.x2 - V.x1) && q[1] > V.y1 - (V.y2 - V.y1) && q[1] < V.y2 + (V.y2 - V.y1)));
        }
      }
      g.strokeStyle = col['--muted']; g.globalAlpha = 0.45; g.lineWidth = 1.2; for (const t of extra) linea(g, t, X, Y); g.globalAlpha = 1;
      const n = Math.max(1, Math.round(u * (sol.tray.length - 1)));
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; linea(g, sol.tray.slice(0, n + 1).map((q) => q.Y), X, Y);
      // puntos críticos
      for (const q of sol.puntos) { g.beginPath(); g.arc(X(q.x), Y(q.y), 4.5, 0, 2 * Math.PI); if (q.tp.est) { g.fillStyle = col['--ink']; g.fill(); } else { g.fillStyle = col['--panel']; g.fill(); g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.stroke(); } }
      g.fillStyle = col['--panel']; g.strokeStyle = col['--accent']; g.lineWidth = 2; g.beginPath(); g.arc(X(sol.x0), Y(sol.y0), 4, 0, 2 * Math.PI); g.fill(); g.stroke();
      const q = sol.tray[n].Y; g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(q[0]), Y(q[1]), 5.5, 0, 2 * Math.PI); g.fill();
    }
    g.restore();
  }
  function tiempo() {
    if (!sol || sol.modo !== 'sistema') return;
    const { g, w, h } = lienzo('#tiempo');
    const tr = sol.tray, t2 = tr[tr.length - 1].t, [y1, y2] = rango(tr.flatMap((q) => q.Y), 0.1);
    const X = (t) => mL + (t / t2) * (w - mL - mR), Y = (y) => mT + ((y2 - y) / (y2 - y1)) * (h - mT - mB);
    const V0 = V; V = { x1: 0, x2: t2, y1, y2 }; ejes(g, w, h, X, Y, 't', ''); V = V0;
    const n = Math.max(1, Math.round(u * (tr.length - 1)));
    for (const [k, c] of [[0, '--z1'], [1, '--z2']]) {
      g.strokeStyle = col[c]; g.lineWidth = 2; linea(g, tr.slice(0, n + 1).map((q) => [q.t, q.Y[k]]), X, Y);
      g.fillStyle = col[c]; g.beginPath(); g.arc(X(tr[n].t), Y(tr[n].Y[k]), 4, 0, 2 * Math.PI); g.fill();
    }
    g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'top';
    g.fillStyle = col['--z1']; g.fillText('x(t)', w - mR - 46, mT + 4); g.fillStyle = col['--z2']; g.fillText('y(t)', w - mR - 6, mT + 4);
  }
  // tocar la gráfica cambia el punto inicial
  $('#grafica').addEventListener('click', (e) => {
    if (!sol || !trans || sol.modo === 'segundo') return;
    const r = e.target.getBoundingClientRect(), x = trans.x(e.clientX - r.left), y = trans.y(e.clientY - r.top);
    const red = (v) => coma(+v.toPrecision(3));
    if (sol.modo === 'primer') { if (x < sol.x1) sc.x0 = red(x); sc.y0 = red(y); } else { sc.x0 = red(x); sc.y0 = red(y); }
    formulario(); cambia(); if (!anda) arranca();
  });
  $('#animar').addEventListener('click', () => (anda ? para() : arranca()));
  function arranca() { if (!sol) return; anda = true; u = 0; $('#animar').textContent = '⏸ Parar'; }
  function para() { anda = false; u = 1; $('#animar').textContent = '▶ Animar'; dibuja(); }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { u += dt / (sol.modo === 'primer' ? 3 : 5); if (u >= 1) { u = 1; anda = false; $('#animar').textContent = '▶ Animar'; } dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { extra = null; dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('edos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  Herramienta.exportar('#grafica', { nombre: 'ecuaciones-diferenciales', titulo: 'Ecuaciones diferenciales', etiqueta: 'la solución', datos: () => sol && sol.eul ? { cab: ['x', 'y (Euler)'], filas: sol.eul.map((q) => [q.x, q.y]) } : null });
  window.EDOsApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, yEu: sol.yEu, yRK: sol.yRK, yEx: sol.yEx, txt: sol.exacta?.txt ?? sol.txt ?? sol.sol?.xTxt, puntos: sol.puntos?.map((q) => q.tp.nom) }, estado: () => copia(sc) };
})();
