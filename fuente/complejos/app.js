/* =====================================================================
   Números complejos: interfaz (operación, datos, plano de Argand,
   resultados y desarrollo). El cálculo está en complejos/calculo.js
   (Complejos).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const K = Complejos, f = K.f, CLAVE = 'complejos-v1';

  let sc = copia(K.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && K.OPS[g.op]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, modo = 'text') => `<label for="f-${k}">${nom}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="${modo}" autocomplete="off" spellcheck="false">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const DOS = ['suma', 'resta', 'producto', 'cociente'];
  function formulario() {
    let h = elige('op', 'Qué calcular', Object.entries(K.OPS));
    if (sc.op === 'ecuacion') h += '<div class="sep">a z² + b z + c = 0</div>' + fila('a', 'Coeficiente a') + fila('b', 'Coeficiente b') + fila('c', 'Coeficiente c');
    else if (DOS.includes(sc.op)) h += fila('z1', 'z₁') + fila('z2', 'z₂');
    else if (sc.op === 'polinomio') h += fila('p', 'Polinomio en z <small>(= 0)</small>');
    else if (sc.op === 'region') h += fila('cond', 'Condiciones');
    else if (sc.op === 'potenciaC') h += fila('z1', 'Base z') + fila('z2', 'Exponente w');
    else h += fila('z1', 'z') + (sc.op === 'potencia' ? fila('n', 'Exponente n', 'numeric') : sc.op === 'raices' ? fila('n', 'Índice n', 'numeric') : '');
    h += elige('unidad', 'Ángulos en', [['grados', 'grados (°)'], ['radianes', 'radianes']]);
    $('#campos').innerHTML = h;
    $('#nota').textContent = sc.op === 'ecuacion' ? 'Los coeficientes pueden ser complejos en forma binómica: 1, −3i, 2 + i, 1/2.' : sc.op === 'polinomio' ? 'Escribe el polinomio con z: z^3 − 8, z^4 + 5z^2 + 4, (1 + i)z^3 − 2. Los coeficientes pueden ser complejos.' : sc.op === 'region' ? 'Separa las condiciones con comas: |z − 1| < 2, Re z > 0, Im z ≤ 1, 0 ≤ arg z ≤ π/2, |z − i| = |z + 1|.' : sc.op === 'exponencial' ? 'Escribe z en binómica, con la parte imaginaria en radianes: 1 + iπ/2, 2 − 3i.' : 'Escribe 3 − 2i, 1/2 + i, 2∠60° (o 2_60), 2(cos 60° + i sen 60°) o 2e^(iπ/3). Un ángulo con π va en radianes y uno con ° en grados.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'op') { const ej = K.ejemplos.find((x) => x.sc.op === t.value); if (ej) sc = { ...copia(ej.sc), unidad: sc.unidad }; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + K.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = K.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar con números pequeños, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = () => { let x; do x = ent(-5, 5); while (!x); return x; };
    const z = () => { const a = nz(), b = nz(); return `${a}${b < 0 ? '−' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}i`.replace(/^-/, '−'); };
    const op = ['formas', 'suma', 'producto', 'cociente', 'potencia', 'raices', 'ecuacion'][ent(0, 6)];
    if (op === 'ecuacion') { const p = nz(), q = ent(1, 4); sc = { op, a: '1', b: String(-2 * p).replace('-', '−'), c: String(p * p + q * q), unidad: 'grados' }; }
    else if (op === 'raices') sc = { op, z1: [`${ent(1, 3) ** 3}`, `−${ent(1, 3) ** 3}`, `${ent(2, 5)}i`, `${ent(1, 4)}∠${ent(1, 5) * 30}°`][ent(0, 3)], n: String(ent(2, 4)), unidad: 'grados' };
    else if (op === 'potencia') sc = { op, z1: z(), n: String(ent(2, 5)), unidad: 'grados' };
    else sc = { op, z1: z(), z2: z(), unidad: 'grados' };
    formulario(); calcula(); sel.value = '';
  }
  const ENUN = {
    formas: () => `Escribe <b>z = ${esc(sc.z1)}</b> en forma polar: calcula su módulo y su argumento en grados.`,
    suma: () => `Calcula <b>(${esc(sc.z1)}) + (${esc(sc.z2)})</b> en forma binómica.`,
    resta: () => `Calcula <b>(${esc(sc.z1)}) − (${esc(sc.z2)})</b> en forma binómica.`,
    producto: () => `Calcula <b>(${esc(sc.z1)}) · (${esc(sc.z2)})</b> en forma binómica.`,
    cociente: () => `Calcula <b>(${esc(sc.z1)}) / (${esc(sc.z2)})</b> en forma binómica.`,
    potencia: () => `Calcula <b>(${esc(sc.z1)})<sup>${esc(sc.n)}</sup></b> con la fórmula de De Moivre.`,
    raices: () => `Calcula las raíces de índice <b>${esc(sc.n)}</b> de <b>${esc(sc.z1)}</b>.`,
    ecuacion: () => `Resuelve la ecuación <b>z² ${sc.b.startsWith('−') ? '−' : '+'} ${esc(sc.b.replace('−', ''))}z + ${esc(sc.c)} = 0</b>.`,
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  function calcula() {
    const err = $('#error');
    try { sol = K.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    const F = sol.formas;
    if (sol.op === 'raices') h = sol.raices.map((q) => dato(`w${'₀₁₂₃₄₅₆₇₈₉'[q.k] ?? q.k}`, `${M(`${f(sol.R)}_{${angulo(q.t)}}`)} = ${K.bin(q.z)}`)).join('');
    else if (sol.op === 'polinomio') h = sol.sols.map((q, k) => dato(`z${'₁₂₃₄₅₆₇₈₉'[k] ?? k + 1}${q.mult > 1 ? ` (${q.mult === 2 ? 'doble' : 'triple'})` : ''}`, q.ex ? M(Algebra.txt(q.ex)) : K.bin(q.z, 5))).join('');
    else if (sol.op === 'region') h = dato('La región', sol.vacia ? 'Vacía: ningún punto cumple todas las condiciones' : sol.desc.join('<br>')) + (sol.punto ? dato('Un punto que la cumple', Mates.html(`$z = ${sol.punto}$`)) : '');
    else if (sol.op === 'ecuacion') {
      // con raíces, la exacta y el decimal al lado; si no, el número tal cual (lo que se pregunta en el modo práctica)
      const sz = (e, z) => (e && /√/.test(Algebra.txt(e)) ? `${M(Algebra.txt(e))} ≈ ${K.bin(z)}` : K.bin(z));
      h = dato('Solución z₁', sz(sol.e1, sol.z1)) + dato('Solución z₂', sz(sol.e2, sol.z2));
    }
    else {
      // el resultado de una operación sin raíces ni fracciones va como texto (así el modo práctica lo pregunta, como en la ecuación);
      // con ellas, la forma exacta y el decimal al lado
      const bino = sol.op === 'formas' ? M(F.binomica) : /[√π/]/.test(F.binomica) ? `${M(F.binomica)} ≈ ${K.bin(sol.z)}` : K.bin(sol.z);
      h = dato(sol.op === 'formas' ? 'Forma binómica' : 'Resultado (binómica)', bino) + dato('Forma polar', M(F.polar)) + dato('Módulo', M(F.rT)) + dato('Argumento', M(F.tT));
      if (sol.op === 'formas') h += dato('Trigonométrica', M(F.trig)) + dato('Exponencial', M(F.expo)) + dato('Conjugado', K.bin(sol.conj)) + (sol.inv ? dato('Inverso', sol.ex ? M(Algebra.txt(Algebra.div(Algebra.c1, sol.ex))) : K.bin(sol.inv)) : '');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = { formas: 'El afijo de z, su módulo (la longitud de la flecha), su argumento (el arco) y el conjugado, simétrico respecto al eje real.', potencia: 'Al elevar a n, el módulo se eleva a n y el argumento se multiplica por n.', raices: 'Las raíces están en una circunferencia y forman un polígono regular.', ecuacion: 'Las soluciones en el plano complejo.', polinomio: 'Las soluciones de la ecuación en el plano complejo.', region: 'Los puntos que cumplen todas las condiciones, sombreados, con su frontera.', logaritmo: 'z y su logaritmo principal: la parte real es ln|z| y la imaginaria, el argumento.', exponencial: 'z = a + bi y eᶻ, de módulo eᵃ y argumento b.', potenciaC: 'La base, el exponente y el valor principal de zʷ.' }[sol.op] || (sol.op === 'suma' || sol.op === 'resta' ? 'La suma es la diagonal del paralelogramo que forman los dos vectores.' : 'En el producto se suman los argumentos y se multiplican los módulos; en el cociente se restan y se dividen.');
    dibuja();
  }
  const angulo = (t) => (sc.unidad === 'radianes' ? (K.piFrac(t) ?? `${f(t)} rad`) : `${f((t * 180) / Math.PI, 4)}°`);

  /* ---------- Plano de Argand ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel', '--z1', '--z2', '--z3']) col[k] = cs.getPropertyValue(k).trim(); }
  const marcas = Herramienta.marcas;
  function dibuja() {
    const c = $('#plano'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    if (!sol) return;
    colores();
    const pts = sol.puntos.filter((p) => isFinite(p.z.re) && isFinite(p.z.im));
    let L = Math.max(1, ...pts.flatMap((p) => [Math.abs(p.z.re), Math.abs(p.z.im)])) * 1.25;
    if (sol.op === 'region') L = sol.L;
    if (sol.op === 'suma' || sol.op === 'resta') L = Math.max(L, ...sol.puntos.map((p) => K.mod(p.z) * 1.1));
    // misma escala en los dos ejes
    const m = 26, esc = Math.min(w - 2 * m, h - 2 * m) / (2 * L), cx = w / 2, cy = h / 2;
    const X = (x) => cx + x * esc, Y = (y) => cy - y * esc;
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1;
    const Lx = (w / 2 - m) / esc, Ly = (h / 2 - m) / esc, num = (v) => f(v, 3).replace(/<[^>]+>/g, '');
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(-Lx, Lx, Math.max(4, Math.round(w / 90)))) { g.beginPath(); g.moveTo(X(v), m / 2); g.lineTo(X(v), h - m / 2); g.stroke(); if (v) g.fillText(num(v), X(v), cy + 4); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(-Ly, Ly, Math.max(4, Math.round(h / 70)))) { g.beginPath(); g.moveTo(m / 2, Y(v)); g.lineTo(w - m / 2, Y(v)); g.stroke(); if (v) g.fillText(`${num(v)}i`, cx - 4, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.3; g.beginPath(); g.moveTo(m / 2, cy); g.lineTo(w - m / 2, cy); g.moveTo(cx, h - m / 2); g.lineTo(cx, m / 2); g.stroke();
    g.fillStyle = col['--ink']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillText('Re', w - m / 2, cy - 4); g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('Im', cx + 6, m / 2);
    const C = { 0: col['--muted'], 1: col['--z1'], 2: col['--z2'], 3: col['--z3'] };
    const flecha = (z, color, discont = false, desde = { re: 0, im: 0 }) => {
      const x0 = X(desde.re), y0 = Y(desde.im), x1 = X(z.re), y1 = Y(z.im), a = Math.atan2(y1 - y0, x1 - x0), lg = Math.hypot(x1 - x0, y1 - y0);
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2; g.setLineDash(discont ? [5, 4] : []);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
      if (lg > 8) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 9 * Math.cos(a - 0.4), y1 - 9 * Math.sin(a - 0.4)); g.lineTo(x1 - 9 * Math.cos(a + 0.4), y1 - 9 * Math.sin(a + 0.4)); g.closePath(); g.fill(); }
      g.lineWidth = 1;
    };
    const punto = (p) => {
      const x = X(p.z.re), y = Y(p.z.im);
      g.fillStyle = C[p.c]; g.beginPath(); g.arc(x, y, 4.5, 0, 2 * Math.PI); g.fill();
      g.font = '600 12.5px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = p.z.re >= 0 ? 'left' : 'right'; g.textBaseline = p.z.im >= 0 ? 'bottom' : 'top';
      g.fillText(p.n, x + (p.z.re >= 0 ? 7 : -7), y + (p.z.im >= 0 ? -4 : 4));
    };
    if (sol.op === 'raices') {
      g.strokeStyle = col['--z3']; g.setLineDash([4, 4]); g.beginPath(); g.arc(cx, cy, sol.R * esc, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
      g.globalAlpha = 0.15; g.fillStyle = col['--z3']; g.beginPath(); sol.raices.forEach((q, i) => (i ? g.lineTo(X(q.z.re), Y(q.z.im)) : g.moveTo(X(q.z.re), Y(q.z.im)))); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = col['--z3']; g.stroke();
      flecha(sol.puntos[0].z, C[1]);
      sol.puntos.forEach(punto);
      return;
    }
    if (sol.op === 'region') {
      // se sombrea cada celda cuyo centro cumple las condiciones; la frontera, más oscura
      const paso = 3, tol = 1.6 / esc;
      g.fillStyle = col['--z3'];
      for (let px = 0; px < w; px += paso) for (let py = 0; py < h; py += paso) {
        const z = K.Z((px + paso / 2 - cx) / esc, (cy - py - paso / 2) / esc);
        if (sol.dentro(z, tol)) { g.globalAlpha = 0.22; g.fillRect(px, py, paso, paso); }
        if (sol.frontera(z, tol) && sol.dentro(z, 3 * tol)) { g.globalAlpha = 0.9; g.fillRect(px, py, paso, paso); }
      }
      g.globalAlpha = 1;
      sol.puntos.forEach(punto);
      return;
    }
    if (sol.op === 'polinomio') { sol.puntos.forEach(punto); return; }
    if (sol.op === 'logaritmo' || sol.op === 'exponencial') { flecha(sol.puntos[0].z, C[1]); flecha(sol.puntos[1].z, C[3]); sol.puntos.forEach(punto); return; }
    if (sol.op === 'potenciaC') { sol.puntos.forEach((p) => { flecha(p.z, C[p.c]); punto(p); }); return; }
    if (sol.op === 'ecuacion' || sol.op === 'potencia') { sol.puntos.forEach((p) => { flecha(p.z, C[p.c]); punto(p); }); return; }
    if (sol.op === 'formas') {
      const z = sol.z, r = K.mod(z), t = K.arg(z);
      if (r) { g.strokeStyle = col['--accent']; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, Math.min(34, r * esc * 0.45), 0, -t, t > 0); g.stroke(); g.lineWidth = 1; }
      // proyecciones sobre los ejes
      g.strokeStyle = col['--muted']; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(z.re), Y(z.im)); g.lineTo(X(z.re), cy); g.moveTo(X(z.re), Y(z.im)); g.lineTo(cx, Y(z.im)); g.stroke(); g.setLineDash([]);
      flecha(sol.conj, C[0], true); flecha(z, C[1]);
      sol.puntos.forEach(punto);
      return;
    }
    const [p1, p2, p3] = sol.puntos;
    if (sol.op === 'suma' || sol.op === 'resta') {
      // regla del paralelogramo
      const otro = sol.op === 'suma' ? p2.z : K.Z(-p2.z.re, -p2.z.im);
      g.strokeStyle = col['--muted']; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(p1.z.re), Y(p1.z.im)); g.lineTo(X(p3.z.re), Y(p3.z.im)); g.lineTo(X(otro.re), Y(otro.im)); g.stroke(); g.setLineDash([]);
      if (sol.op === 'resta') flecha(otro, C[2], true);
    }
    flecha(p1.z, C[1]); flecha(p2.z, C[2]); flecha(p3.z, C[3]);
    [p1, p2, p3].forEach(punto);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('complejos').current;
  formulario(); calcula();
  Herramienta.exportar('#plano', { nombre: 'plano-de-argand', titulo: 'Plano de Argand', etiqueta: 'el plano de Argand' });
  window.ComplejosApp = { abrirEjemplo, azar, enunciado: () => (ENUN[sc.op] || ENUN.formas)(), resultado: () => sol && { op: sol.op, z: sol.z, z1: sol.z1, z2: sol.z2, raices: sol.raices }, estado: () => copia(sc) };
})();
