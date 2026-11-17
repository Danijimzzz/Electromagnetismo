(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const C = Control, f = C.f, CLAVE = 'control-v1';

  let sc = copia(C.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && ['routh', 'raices', 'nyquist', 'escalon', 'bode'].includes(g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};
  const TITULOS = { routh: 'Closed-loop poles', raices: 'Root locus', nyquist: 'Nyquist plot', escalon: 'Closed-loop step response', bode: 'Open-loop Bode plot' };

  const fila = (k, nom, un, ph) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" placeholder="${esc(ph || '')}" autocomplete="off" spellcheck="false">`;
  function formulario() {
    document.querySelectorAll('.modos button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === sc.modo)));
    $('#campos').innerHTML = fila('num', 'Numerator N(s)', '', 's+3') + fila('den', 'Denominator D(s)', '', 's(s+1)(s+2)') + fila('K', 'Gain K', '', '1');
    $('#nota').textContent = sc.modo === 'routh'
      ? 'Write the polynomials as an expression (s^2+3s+2, 2(s+1)(s+3)) or with the coefficients from highest to lowest degree (1 3 2). The table is that of D(s) + K·N(s); if you leave N(s) empty, that of the polynomial D(s) as it is.'
      : 'Write the polynomials as an expression (s^2+3s+2, 2(s+1)(s+3)) or with the coefficients from highest to lowest degree (1 3 2).';
    $('#titulo-grafica').textContent = TITULOS[sc.modo];
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  document.querySelectorAll('.modos button').forEach((b) => b.addEventListener('click', () => { sc.modo = b.dataset.modo; $('#ejemplos').value = ''; formulario(); calcula(); }));

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  const KS = { 'tercer-orden': [1, 2, 3, 4, 5, 8, 10], 'tercer-orden-k': [7, 8, 10, 12, 15], 'raices-tres': [1, 2, 3, 5], 'raices-complejos': [1, 2, 3, 5, 6], 'nyquist-tres': [1, 2, 3, 4, 5, 8, 10], 'nyquist-inestable': [2, 3, 4, 5] };
  function azar() {
    const e = C.ejemplos[Math.floor(Math.random() * C.ejemplos.length)], ks = KS[e.clave];
    sc = copia(e.sc); if (ks) sc.K = String(ks[Math.floor(Math.random() * ks.length)]);
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const L = `L(s) = K·(${sc.num || '1'}) / (${sc.den})`, K = `K = ${sc.K || '1'}`;
    return sc.modo === 'routh' ? `With ${L} and ${K}, apply the Routh criterion to the characteristic equation: how many roots are in the right half-plane and for which values of K is it stable?`
      : sc.modo === 'raices' ? `For ${L}, draw the root locus: centroid and angles of the asymptotes, breakaway points and the value of K at which it crosses the imaginary axis.`
        : sc.modo === 'escalon' ? `With ${L} and ${K} in closed loop with unity feedback, compute the step response: final value, steady-state error, rise time, overshoot and settling time.`
          : sc.modo === 'bode' ? `With ${L} and ${K}, draw the open-loop Bode plot and find the phase margin and the gain margin; is the closed loop stable?`
        : `With ${L} and ${K}, draw the Nyquist plot and find the gain and phase margins and the closed-loop poles in the right half-plane (Z = N + P).`;
  };

  const dato = (t, v, num) => `<div${num ? ' class="num"' : ''}><span>${t}</span><b>${v}</b></div>`;
  const rangoTxt = (r) => (r.estables.length ? r.estables.map((e) => (e.b === Infinity ? `K > ${f(e.a)}` : e.a === 0 ? `0 < K < ${f(e.b)}` : `${f(e.a)} < K < ${f(e.b)}`)).join(' y ') : 'no K > 0');
  function calcula() {
    const err = $('#error');
    try { sol = C.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.modo === 'routh') {
      h += dato('Stability', sol.R.estado) + dato('Roots in the right half-plane', sol.R.cambios, true);
      if (sol.R.eje) h += dato('Roots on the imaginary axis', sol.R.eje, true);
      if (sol.rk) {
        h += dato('Stable for', rangoTxt(sol.rk));
        const c = sol.rk.criticos[0];
        if (c) h += dato('Critical K', f(c.K), true) + dato('Crossover frequency', `${f(c.w)} rad/s`, true);
      }
      $('#leyenda').textContent = 'Crosses: closed-loop poles of the characteristic equation. In light red, the right half-plane (unstable). Circles: open-loop poles.';
    } else if (sol.modo === 'raices') {
      const lg = sol.lg;
      h += dato('Branches', `${lg.n}: ${lg.m} a ceros y ${lg.n - lg.m} al infinito`);
      if (lg.asint.q > 0) h += dato('Centroid', f(lg.asint.centro), true) + dato('Angles of the asymptotes', lg.asint.ang.map((a) => `${f(a)}°`).join(', '), true);
      if (lg.ruptura.length) h += dato('Breakaway points', lg.ruptura.map((r) => `${f(r.s)} (K = ${f(r.K)})`).join('; '), true);
      if (lg.cruces.length) h += dato('Crossing of the imaginary axis', lg.cruces.map((c) => `K = ${f(c.K)} at ±${f(c.w)}j`).join('; '), true);
      if (lg.angulos.length) h += dato('Departure and arrival angles', lg.angulos.map((a) => `${f(a.ang)}°`).join('; '), true);
      h += dato(`Stability with K = ${f(sol.K)}`, sol.estable ? 'estable' : 'no es estable');
      if (sol.din && sol.din.Mp !== undefined) h += dato('Dominant pair', `ωₙ = ${f(sol.din.wn)} · ζ = ${f(sol.din.zeta)} · Mₚ = ${f(sol.din.Mp)} %`);
      $('#leyenda').textContent = 'Lines: branches of the locus (K from 0 to ∞). ×: poles. ○: zeros. Diamonds: breakaway points. Red dots: crossings of the imaginary axis. Squares: closed-loop poles with the K entered. Dashed: asymptotes.';
    } else if (sol.modo === 'escalon') {
      const e = sol.es;
      h += dato('Stability', e.estable ? 'estable' : 'inestable o marginal');
      if (e.estable) h += dato('Final value', `y(∞) = ${f(e.yss)}`, true) + (e.ess !== undefined ? dato('Steady-state error', `e<sub>ss</sub> = ${f(e.ess)}`, true) : '');
      if (e.subida !== undefined) h += dato('Rise time (10–90 %)', `${f(e.subida)} s`, true) + dato('Overshoot', `${f(e.sobre)} %`, true) + dato('Peak time', `${f(e.tpico)} s`, true) + dato('Settling time (2 %)', `${f(e.ts)} s`, true);
      $('#leyenda').textContent = 'Line: output y(t) for a unit step with unity feedback. Dashed: final value. The band marks ±2 % of the final value.';
    } else if (sol.modo === 'bode') {
      h += sol.gm ? dato('Gain margin', `${f(sol.gm.GM)} (${f(sol.gm.GMdB)} dB) at ${f(sol.gm.w)} rad/s`, true) : dato('Gain margin', '∞');
      h += sol.pm ? dato('Phase margin', `${f(sol.pm.PM)}° at ${f(sol.pm.w)} rad/s`, true) : dato('Phase margin', 'no gain crossover');
      h += dato('Closed loop', sol.ny.pasaPor ? 'marginalmente estable' : sol.ny.Z === 0 ? 'estable' : 'inestable');
      if (sol.gm) h += dato('Critical K', f(sol.K * sol.gm.GM), true);
      $('#leyenda').textContent = 'Top, magnitude of L(jω) in dB; bottom, its phase. Dashed line: 0 dB and −180°. Dot: gain crossover frequency (phase margin) and phase crossover frequency (gain margin).';
    } else {
      const n = sol.ny;
      h += dato('Poles of L(s) with Re > 0 (P)', n.P, true) + dato('Clockwise encirclements of −1 (N)', n.Ncw, true) + dato('Unstable closed-loop poles (Z = N + P)', n.Z, true);
      h += dato('Stability', n.pasaPor ? 'marginal (the curve passes through −1)' : n.Z === 0 ? 'estable' : 'inestable');
      h += sol.gm ? dato('Gain margin', `${f(sol.gm.GM)} (${f(sol.gm.GMdB)} dB) at ${f(sol.gm.w)} rad/s`, true) : dato('Gain margin', '∞');
      h += sol.pm ? dato('Phase margin', `${f(sol.pm.PM)}° at ${f(sol.pm.w)} rad/s`, true) : dato('Phase margin', 'no gain crossover');
      if (sol.gm) h += dato('Critical K', f(sol.K * sol.gm.GM), true);
      $('#leyenda').textContent = 'Solid line: L(jω) for ω > 0. Dashed: ω < 0 (mirror image). Red dot: −1. Circle: |L| = 1. The arrow marks the direction of increasing ω.';
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--serie-3', '--zona']) col[k] = cs.getPropertyValue(k).trim(); }
  function plano(g, w, h, x0, x1, y0, y1, { zona, etX = 'Re', etY = 'Im' } = {}) {
    const ml = 44, mr = 12, mt = 12, mb = 28, pw = w - ml - mr, ph = h - mt - mb;
    const dx = Math.max(x1 - x0, 1e-9), dy = Math.max(y1 - y0, 1e-9), esc2 = Math.min(pw / dx, ph / dy);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ax = pw / esc2 / 2, ay = ph / esc2 / 2;
    const X = (v) => ml + (v - (cx - ax)) * esc2, Y = (v) => mt + ((cy + ay) - v) * esc2;
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1;
    if (zona && X(0) < ml + pw) { g.fillStyle = col['--zona']; const xi = Math.max(ml, X(0)); g.fillRect(xi, mt, ml + pw - xi, ph); }
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(cx - ax, cx + ax, 6)) { g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), mt + ph); g.stroke(); g.fillText(txt(f(v, 3)), X(v), mt + ph + 6); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(cy - ay, cy + ay, 6)) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(ml + pw, Y(v)); g.stroke(); g.fillText(txt(f(v, 3)), ml - 6, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    if (cx - ax < 0 && cx + ax > 0) { g.beginPath(); g.moveTo(X(0), mt); g.lineTo(X(0), mt + ph); g.stroke(); }
    if (cy - ay < 0 && cy + ay > 0) { g.beginPath(); g.moveTo(ml, Y(0)); g.lineTo(ml + pw, Y(0)); g.stroke(); }
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(etX, ml + pw - 2, mt + ph - 2); g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(etY, ml + 4, mt + 2);
    g.save(); g.beginPath(); g.rect(ml, mt, pw, ph); g.clip();
    return { X, Y, fin: () => g.restore(), caja: [cx - ax, cx + ax, cy - ay, cy + ay] };
  }
  const aspa = (g, x, y, r, c, lw = 2.4) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x - r, y + r); g.lineTo(x + r, y - r); g.stroke(); };
  const circulo = (g, x, y, r, c, relleno) => { g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); relleno ? g.fill() : g.stroke(); };
  function caja(pts, margen = 0.25, minimo = 1) {
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const ex = Math.max(x1 - x0, minimo), ey = Math.max(y1 - y0, minimo), m = Math.max(ex, ey) * margen;
    return [x0 - m, x1 + m, y0 - m, y1 + m];
  }

  function dibujaRouth(g, w, h) {
    const pts = [...sol.polosCL, ...C.raices(sol.D), ...(sol.N ? C.raices(sol.N) : [])];
    const [x0, x1, y0, y1] = caja(pts.concat(pts.map((z) => [z[0], -z[1]])), 0.3, 2);
    const p = plano(g, w, h, Math.min(x0, -0.5), Math.max(x1, 0.5), y0, y1, { zona: true });
    for (const z of C.raices(sol.D)) circulo(g, p.X(z[0]), p.Y(z[1]), 4.5, col['--muted'], false);
    for (const z of sol.polosCL) aspa(g, p.X(z[0]), p.Y(z[1]), 6, z[0] > 1e-7 ? col['--serie-2'] : col['--serie-1']);
    p.fin();
  }
  function dibujaRaices(g, w, h) {
    const lg = sol.lg, feat = [...lg.polos, ...lg.ceros, ...sol.polosCL, ...lg.ruptura.map((r) => [r.s, 0]), ...lg.cruces.map((c) => [0, c.w])];
    if (lg.asint.centro !== null) feat.push([lg.asint.centro, 0]);
    const [x0, x1, y0, y1] = caja(feat.concat(feat.map((z) => [z[0], -z[1]])), 0.35, 2);
    const p = plano(g, w, h, x0, x1, y0, y1, { zona: true });
    const [cx0, cx1, cy0, cy1] = p.caja, R = Math.hypot(cx1 - cx0, cy1 - cy0);
    if (lg.asint.q > 0) {
      g.strokeStyle = col['--muted']; g.setLineDash([6, 5]); g.lineWidth = 1.4;
      for (const a of lg.asint.ang) { const r = (a * Math.PI) / 180; g.beginPath(); g.moveTo(p.X(lg.asint.centro), p.Y(0)); g.lineTo(p.X(lg.asint.centro + R * Math.cos(r)), p.Y(R * Math.sin(r))); g.stroke(); }
      g.setLineDash([]);
    }
    g.strokeStyle = col['--serie-1']; g.lineWidth = 2.4;
    for (const rama of lg.ramas) { g.beginPath(); rama.forEach((z, i) => (i ? g.lineTo(p.X(z[0]), p.Y(z[1])) : g.moveTo(p.X(z[0]), p.Y(z[1])))); g.stroke(); }
    for (const z of lg.ceros) circulo(g, p.X(z[0]), p.Y(z[1]), 5, col['--ink'], false);
    for (const z of lg.polos) aspa(g, p.X(z[0]), p.Y(z[1]), 6, col['--ink']);
    for (const r of lg.ruptura) { g.fillStyle = col['--serie-3']; const x = p.X(r.s), y = p.Y(0); g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 6, y); g.lineTo(x, y + 6); g.lineTo(x - 6, y); g.closePath(); g.fill(); }
    for (const c of lg.cruces) for (const s of c.w ? [c.w, -c.w] : [0]) circulo(g, p.X(0), p.Y(s), 4.5, col['--serie-2'], true);
    for (const z of sol.polosCL) { g.fillStyle = col['--accent']; g.fillRect(p.X(z[0]) - 4.5, p.Y(z[1]) - 4.5, 9, 9); g.strokeStyle = col['--ink']; g.lineWidth = 1; g.strokeRect(p.X(z[0]) - 4.5, p.Y(z[1]) - 4.5, 9, 9); }
    p.fin();
  }
  function ejesXY(g, caja, x0, x1, y0, y1, { logx, etX, etY, nx = 6, ny = 5 }) {
    const [ml, mt, pw, ph] = caja, lx = (v) => (logx ? Math.log10(v) : v);
    const X = (v) => ml + ((lx(v) - lx(x0)) / (lx(x1) - lx(x0))) * pw, Y = (v) => mt + ph - ((v - y0) / (y1 - y0)) * ph;
    g.font = '12px system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'center'; g.textBaseline = 'top';
    const xs = logx ? Array.from({ length: Math.ceil(Math.log10(x1)) - Math.floor(Math.log10(x0)) + 1 }, (_, i) => 10 ** (Math.floor(Math.log10(x0)) + i)).filter((v) => v >= x0 * 0.999 && v <= x1 * 1.001) : marcas(x0, x1, nx);
    for (const v of xs) { g.beginPath(); g.moveTo(X(v), mt); g.lineTo(X(v), mt + ph); g.stroke(); g.fillText(txt(f(v, 3)), X(v), mt + ph + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(y0, y1, ny)) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(ml + pw, Y(v)); g.stroke(); g.fillText(txt(f(v, 3)), ml - 6, Y(v)); }
    g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(etX, ml + pw - 2, mt + ph - 2); g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(etY, ml + 4, mt + 2);
    g.save(); g.beginPath(); g.rect(ml, mt, pw, ph); g.clip();
    return { X, Y, fin: () => g.restore() };
  }
  function dibujaEscalon(g, w, h) {
    const e = sol.es, ml = 52, mr = 12, mt = 12, mb = 28;
    let lo = Math.min(0, ...e.y), hi = Math.max(1, ...e.y); if (!e.estable) { hi = Math.min(hi, 8); lo = Math.max(lo, -8); }
    const pad = (hi - lo) * 0.08, p = ejesXY(g, [ml, mt, w - ml - mr, h - mt - mb], 0, e.tmax, lo - pad * (lo < 0 ? 1 : 0), hi + pad, { etX: 't (s)', etY: 'y(t)' });
    if (e.estable && Number.isFinite(e.yss)) {
      g.fillStyle = col['--zona']; g.fillRect(p.X(0), p.Y(e.yss * 1.02), p.X(e.tmax) - p.X(0), p.Y(e.yss * 0.98) - p.Y(e.yss * 1.02));
      g.setLineDash([6, 5]); g.strokeStyle = col['--muted']; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.X(0), p.Y(e.yss)); g.lineTo(p.X(e.tmax), p.Y(e.yss)); g.stroke(); g.setLineDash([]);
    }
    g.strokeStyle = col['--serie-1']; g.lineWidth = 2.6; g.beginPath(); e.t.forEach((t, i) => (i ? g.lineTo(p.X(t), p.Y(e.y[i])) : g.moveTo(p.X(t), p.Y(e.y[i])))); g.stroke();
    if (e.tpico !== undefined) { g.fillStyle = col['--serie-2']; g.beginPath(); g.arc(p.X(e.tpico), p.Y(e.pico), 4.5, 0, 2 * Math.PI); g.fill(); }
    p.fin();
  }
  function dibujaBode(g, w, h) {
    const b = sol.bd, ml = 52, mr = 12, gap = 30, ph = (h - 12 - 28 - gap) / 2, w0 = b.ws[0], w1 = b.ws[b.ws.length - 1];
    const mmin = Math.floor(Math.min(...b.mag, 0) / 20) * 20, mmax = Math.ceil(Math.max(...b.mag, 0) / 20) * 20 || 20, fmin = Math.floor(Math.min(...b.fase, -180) / 45) * 45, fmax = Math.ceil(Math.max(...b.fase, 0) / 45) * 45;
    const trazo = (p, ys, c) => { g.strokeStyle = c; g.lineWidth = 2.6; g.beginPath(); b.ws.forEach((x, i) => (i ? g.lineTo(p.X(x), p.Y(ys[i])) : g.moveTo(p.X(x), p.Y(ys[i])))); g.stroke(); };
    const ref = (p, v, x0, x1) => { g.setLineDash([6, 5]); g.strokeStyle = col['--muted']; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.X(x0), p.Y(v)); g.lineTo(p.X(x1), p.Y(v)); g.stroke(); g.setLineDash([]); };
    const pm = ejesXY(g, [ml, 12, w - ml - mr, ph], w0, w1, mmin, mmax, { logx: true, etX: 'ω (rad/s)', etY: '|L| (dB)' });
    ref(pm, 0, w0, w1); trazo(pm, b.mag, col['--serie-1']);
    if (sol.pm) circulo(g, pm.X(sol.pm.w), pm.Y(0), 5, col['--accent'], true);
    if (sol.gm) circulo(g, pm.X(sol.gm.w), pm.Y(-sol.gm.GMdB), 5, col['--serie-3'], true);
    pm.fin();
    const pf = ejesXY(g, [ml, 12 + ph + gap, w - ml - mr, ph], w0, w1, fmin, fmax, { logx: true, etX: 'ω (rad/s)', etY: 'fase (°)', ny: 5 });
    ref(pf, -180, w0, w1); trazo(pf, b.fase, col['--serie-2']);
    if (sol.pm) circulo(g, pf.X(sol.pm.w), pf.Y(sol.pm.fase), 5, col['--accent'], true);
    if (sol.gm) circulo(g, pf.X(sol.gm.w), pf.Y(-180), 5, col['--serie-3'], true);
    pf.fin();
  }
  function dibujaNyquist(g, w, h) {
    const n = sol.ny, zs = n.zs, Lpc = sol.gm ? sol.gm.mod : 0, Rv = Math.max(1.6, 1.6 * Lpc);
    const dentro = zs.filter((z) => Math.hypot(z[0], z[1]) <= Rv);
    const pts = [[-1, 0], [0, 0], ...dentro, ...dentro.map((z) => [z[0], -z[1]])];
    const [x0, x1, y0, y1] = caja(pts, 0.12, 1.6);
    const p = plano(g, w, h, x0, x1, y0, y1, {});
    g.strokeStyle = col['--line']; g.lineWidth = 1.4; g.beginPath(); g.arc(p.X(0), p.Y(0), p.X(1) - p.X(0), 0, 2 * Math.PI); g.stroke();
    const traza = (signo, dash) => { g.setLineDash(dash); g.beginPath(); let en = false; zs.forEach((z) => { const out = Math.hypot(z[0], z[1]) > Rv * 4; if (out) { en = false; return; } const x = p.X(z[0]), y = p.Y(signo * z[1]); en ? g.lineTo(x, y) : g.moveTo(x, y); en = true; }); g.stroke(); g.setLineDash([]); };
    g.strokeStyle = col['--muted']; g.lineWidth = 1.6; traza(-1, [6, 5]);
    g.strokeStyle = col['--serie-1']; g.lineWidth = 2.6; traza(1, []);
    const k = zs.findIndex((z, i) => i > 40 && i < zs.length - 2 && Math.hypot(z[0], z[1]) < Rv * 0.6 && Math.hypot(z[0], z[1]) > 0.15 * Rv);
    if (k > 0) { const a = zs[k], b = zs[k + 1], x = p.X(a[0]), y = p.Y(a[1]), t = Math.atan2(p.Y(b[1]) - y, p.X(b[0]) - x); g.fillStyle = col['--serie-1']; g.beginPath(); g.moveTo(x + 11 * Math.cos(t), y + 11 * Math.sin(t)); g.lineTo(x + 11 * Math.cos(t + 2.6), y + 11 * Math.sin(t + 2.6)); g.lineTo(x + 11 * Math.cos(t - 2.6), y + 11 * Math.sin(t - 2.6)); g.closePath(); g.fill(); }
    for (const q of n.fase) circulo(g, p.X(q.z[0]), p.Y(q.z[1]), 4.5, col['--serie-3'], true);
    for (const q of n.ganancia) circulo(g, p.X(q.z[0]), p.Y(q.z[1]), 4.5, col['--accent'], true);
    aspa(g, p.X(-1), p.Y(0), 6, col['--serie-2'], 3);
    p.fin();
  }
  function datosGrafica() {
    if (!sol) return null;
    if (sol.modo === 'routh') return { cab: ['Pole', 'Re', 'Im'], filas: [...C.raices(sol.D).map((z, i) => [`lazo abierto ${i + 1}`, z[0], z[1]]), ...sol.polosCL.map((z, i) => [`lazo cerrado ${i + 1}`, z[0], z[1]])] };
    if (sol.modo === 'raices') return { cab: ['Branch', 'K', 'Re', 'Im'], filas: sol.lg.ramas.flatMap((r, i) => r.map((z) => [i + 1, z[2], z[0], z[1]])) };
    if (sol.modo === 'escalon') return { cab: ['t (s)', 'y(t)'], filas: sol.es.t.map((t, i) => [t, sol.es.y[i]]) };
    if (sol.modo === 'bode') return { cab: ['w (rad/s)', '|L| (dB)', 'Phase (°)'], filas: sol.bd.ws.map((x, i) => [x, sol.bd.mag[i], sol.bd.fase[i]]) };
    return { cab: ['w (rad/s)', 'Re L(jw)', 'Im L(jw)'], filas: sol.ny.zs.map((z, i) => [sol.ny.ws[i], z[0], z[1]]) };
  }
  function dibuja() {
    Herramienta.exportar('#grafica', { nombre: `control-${sol ? sol.modo : 'grafica'}`, titulo: sol ? { routh: 'Open- and closed-loop poles', raices: 'Root locus', nyquist: 'Nyquist plot', escalon: 'Step response', bode: 'Open-loop Bode plot' }[sol.modo] : undefined, datos: datosGrafica });
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    colores();
    ({ routh: dibujaRouth, raices: dibujaRaices, nyquist: dibujaNyquist, escalon: dibujaEscalon, bode: dibujaBode })[sol.modo](g, w, h);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('control').current;
  colores(); formulario(); calcula();
  window.ControlApp = {
    abrirEjemplo, azar, enunciado, estado: () => copia(sc),
    resultado: () => sol && (sol.modo === 'routh' ? { cambios: sol.R.cambios, estado: sol.R.estado, estables: sol.rk && sol.rk.estables } : sol.modo === 'raices' ? { ruptura: sol.lg.ruptura, cruces: sol.lg.cruces, asintotas: sol.lg.asint } : sol.modo === 'escalon' ? { estable: sol.es.estable, yss: sol.es.yss, sobre: sol.es.sobre, tpico: sol.es.tpico, ts: sol.es.ts, subida: sol.es.subida } : sol.modo === 'bode' ? { GM: sol.gm && sol.gm.GM, PM: sol.pm && sol.pm.PM, wc: sol.pm && sol.pm.w, w180: sol.gm && sol.gm.w } : { P: sol.ny.P, N: sol.ny.Ncw, Z: sol.ny.Z, GM: sol.gm && sol.gm.GM, PM: sol.pm && sol.pm.PM }),
  };
})();

