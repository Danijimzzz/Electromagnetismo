/* =====================================================================
   Campos vectoriales: interfaz (cuatro modos: gradiente de un campo
   escalar, divergencia y rotacional de un campo vectorial, integral de
   línea y teorema de Green). La gráfica es el plano z = z₀: mapa de color
   y curvas de nivel para f, flechas y partículas que siguen el campo para
   F, la curva con un punto que la recorre y la región de Green. Tocando
   la gráfica se cambia el punto. El cálculo está en campos/calculo.js
   (Campos) y las expresiones en matematicas/expresion.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const C = Campos, CLAVE = 'campos-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const fH = (x, d = 4) => C.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const coma = (v) => String(v).replace('.', ',');
  const MODOS = [['escalar', 'Gradiente de un campo escalar f'], ['vectorial', 'Divergencia y rotacional de F'], ['linea', 'Integral de línea (trabajo)'], ['green', 'Teorema de Green']];
  const REGION = { circulo: { cx: '0', cy: '0', rad: '1' }, rectangulo: { x1: '0', x2: '2', y1: '0', y2: '1' } };

  let sc = copia(C.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, V = null, trans = null, anda = true, u = 0, giro = 0, parts = [], fondo = null;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, ay = '', larga = false) => `<label for="f-${k}">${nom}${ay ? ` <small>${ay}</small>` : ''}</label><input id="f-${k}" class="in${larga ? ' larga' : ''}" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const campoF = (conR = true) => sep('Campo F = (P, Q, R)') + fila('P', 'P', 'función de x, y, z', true) + fila('Q', 'Q', '', true) + (conR ? fila('R', 'R', 'vacía en el plano', true) : '');
  const punto = () => sep('Punto') + fila('x0', 'x₀') + fila('y0', 'y₀') + fila('z0', 'z₀', 'si hay z');
  const NOTAS = {
    escalar: 'Escribe f con x, y (y z si quieres): x^2 + y^2, x y z, e^x sen y… La dirección u es opcional y no hace falta que sea unitaria.',
    vectorial: 'Escribe las componentes con x, y, z. Si R está vacía y no hay z, el campo es plano. Toca la gráfica para mover el punto.',
    linea: 'La curva r(t) = (x(t), y(t), z(t)) va de t inicial a t final; por ejemplo cos t, sen t con t de 0 a 2π.',
    green: 'La curva es el borde de la región, recorrido en sentido antihorario. Con un círculo, toca la gráfica para mover su centro.',
  };
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    if (sc.modo === 'escalar') h += fila('f', 'f(x, y, z) =', '', true) + punto() + fila('u', 'Dirección u', '(opcional) 1, 2');
    else if (sc.modo === 'vectorial') h += campoF() + punto();
    else if (sc.modo === 'linea') h += campoF() + sep('Curva r(t)') + fila('cx', 'x(t)', '', true) + fila('cy', 'y(t)', '', true) + fila('cz', 'z(t)', 'vacía en el plano', true) + fila('a', 't inicial') + fila('b', 't final');
    else {
      h += sep('Campo F = (P, Q)') + fila('P', 'P', 'función de x e y', true) + fila('Q', 'Q', '', true) + sep('Región') + elige('region', 'Forma', [['circulo', 'Círculo'], ['rectangulo', 'Rectángulo']]);
      h += sc.region === 'rectangulo' ? fila('x1', 'x mínima') + fila('x2', 'x máxima') + fila('y1', 'y mínima') + fila('y2', 'y máxima') : fila('cx', 'Centro x') + fila('cy', 'Centro y') + fila('rad', 'Radio');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    if (t.dataset.k === 'modo') sc = copia(C.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { sc.region = t.value; Object.assign(sc, REGION[t.value]); }
    formulario(); cambia();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${C.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; };
    const k = (n, v) => `${n < 0 ? '-' : ''}${Math.abs(n) === 1 ? '' : Math.abs(n)}${v}`;
    const mas = (a, b) => `${a} ${b.startsWith('-') ? '- ' + b.slice(1) : '+ ' + b}`;
    const tipos = [
      () => ({ modo: 'escalar', f: mas(k(nz(-3, 3), 'x^2'), k(nz(-3, 3), 'y^2')), x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: '', u: `${nz(-2, 2)}, ${ent(-2, 2)}` }),
      () => ({ modo: 'escalar', f: mas(k(nz(-3, 3), 'x y'), k(nz(-3, 3), 'z^2')), x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: String(nz(-2, 2)), u: `${ent(0, 2)}, ${nz(-2, 2)}, ${ent(0, 2)}` }),
      () => ({ modo: 'vectorial', P: mas(k(nz(-2, 2), 'x'), k(nz(-2, 2), 'y')), Q: mas(k(nz(-2, 2), 'x'), k(nz(-2, 2), 'y')), R: '', x0: String(ent(-2, 2)), y0: String(ent(-2, 2)), z0: '' }),
      () => ({ modo: 'vectorial', P: k(nz(-2, 2), 'y z'), Q: k(nz(-2, 2), 'x z'), R: k(nz(-2, 2), 'x y'), x0: String(nz(-2, 2)), y0: String(nz(-2, 2)), z0: String(nz(-2, 2)) }),
      () => { const m = nz(-3, 3); return { modo: 'linea', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x^2'), R: '', cx: 't', cy: k(m, 't'), cz: '', a: '0', b: String(ent(1, 2)) }; },
      () => ({ modo: 'linea', P: k(nz(-2, 2), 'y'), Q: k(nz(-2, 2), 'x'), R: '', cx: `${ent(1, 3)} cos t`.replace(/^1 /, ''), cy: `${ent(1, 3)} sen t`.replace(/^1 /, ''), cz: '', a: '0', b: ['π/2', 'π', '2π'][ent(0, 2)] }),
      () => ({ modo: 'green', P: k(nz(-3, 3), 'y'), Q: k(nz(-3, 3), 'x'), region: 'circulo', cx: '0', cy: '0', rad: String(ent(1, 3)) }),
      () => { const x2 = ent(1, 3), y2 = ent(1, 3); return { modo: 'green', P: k(nz(-2, 2), 'x y'), Q: k(nz(-2, 2), 'x^2'), region: 'rectangulo', x1: '0', x2: String(x2), y1: '0', y2: String(y2) }; },
    ];
    sc = tipos[ent(0, tipos.length - 1)]();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const F = () => `F = (${esc(sc.P || '0')}, ${esc(sc.Q || '0')}${sc.R ? `, ${esc(sc.R)}` : ''})`;
    const P = () => `(${esc(sc.x0)}, ${esc(sc.y0)}${sc.z0 ? `, ${esc(sc.z0)}` : ''})`;
    if (sc.modo === 'escalar') return `Calcula el gradiente de <b>f = ${esc(sc.f)}</b> en el punto ${P()}${sc.u ? ` y la derivada direccional en la dirección (${esc(sc.u)})` : ''}, y su laplaciano.`;
    if (sc.modo === 'vectorial') return `Calcula la divergencia y el rotacional de <b>${F()}</b> en ${P()}. ¿Es conservativo?`;
    if (sc.modo === 'linea') return `Calcula el trabajo de <b>${F()}</b> a lo largo de r(t) = (${esc(sc.cx)}, ${esc(sc.cy)}${sc.cz ? `, ${esc(sc.cz)}` : ''}) con t de ${esc(sc.a)} a ${esc(sc.b)}.`;
    const reg = sc.region === 'rectangulo' ? `el rectángulo [${esc(sc.x1)}, ${esc(sc.x2)}] × [${esc(sc.y1)}, ${esc(sc.y2)}]` : `el círculo de centro (${esc(sc.cx)}, ${esc(sc.cy)}) y radio ${esc(sc.rad)}`;
    return `Comprueba el teorema de Green para <b>${F()}</b> en ${reg}: calcula la circulación por el borde y la integral doble del rotacional.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  const vec = (vs) => `(${vs.join(', ')})`;
  // decimal (lo que se pregunta en el modo práctica) y, si lo hay, el valor exacto al lado
  const nx = (x, d = 5) => { const e = C.ex(x, d); return e === C.f(x, d) ? fH(x, d) : `${fH(x, d)} <small>= ${M(e)}</small>`; };
  function calcula() {
    const err = $('#error');
    try { sol = C.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      V = null; dibuja(); return;
    }
    err.hidden = true; guarda();
    const d3 = sol.d3, pt = sol.p ? vec((d3 ? sol.p : sol.p.slice(0, 2)).map((v) => fH(v, 3))) : '';
    let h = '';
    if (sol.modo === 'escalar') {
      h += dato('Gradiente', M(`∇f = ${vec(sol.grTxt)}`), 'ancho');
      h += dato(`∇f en ${pt}`, M(vec((d3 ? sol.g0 : sol.g0.slice(0, 2)).map((v) => C.ex(v)))));
      h += dato('|∇f|', nx(sol.mod), 'num');
      if (sol.du !== null) h += dato('Derivada direccional Dᵤf', nx(sol.du), 'num');
      h += dato('Laplaciano', M(`∇² f = ${sol.lapTxt}`) + (sol.armonica ? ' (armónica)' : ''));
    } else if (sol.modo === 'vectorial') {
      h += dato(`Divergencia en ${pt}`, nx(sol.div), 'num');
      h += dato(`Rotacional en ${pt}`, d3 ? M(vec(sol.rot0.map((v) => C.ex(v)))) : nx(sol.rot0[2]), d3 ? '' : 'num');
      h += dato('¿Conservativo?', sol.cons ? 'Sí' : 'No');
      if (sol.phi !== null) h += dato(`Potencial φ${pt}`, nx(sol.phi), 'num');
    } else if (sol.modo === 'linea') {
      h += dato('Trabajo W', nx(sol.W, 5), 'num');
      if (sol.dphi !== null) h += dato('φ(B) − φ(A)', nx(sol.dphi, 5), 'num');
      h += dato('Longitud', nx(sol.L, 5), 'num');
      h += dato('¿Conservativo?', sol.cons ? 'Sí: no depende del camino' : 'No');
    } else {
      h += dato('Circulación ∮ F · dr', nx(sol.circula, 5), 'num');
      h += dato('∬ rot F dA', nx(sol.dobleR, 5), 'num');
      h += dato('Flujo ∮ F · n ds', nx(sol.flujo, 5), 'num');
      h += dato('∬ div F dA', nx(sol.dobleD, 5), 'num');
      if (sol.singular) h += dato('Atención', 'No coinciden: hay un punto de D donde F no está definido y Green no vale', 'ancho');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    const corte = d3 && sol.modo !== 'green' ? ` Es el corte por el plano z = ${fH(sol.p ? sol.p[2] : 0, 3)}${sol.modo === 'linea' ? ' y la curva vista desde arriba' : ''}.` : '';
    $('#leyenda').innerHTML = (sol.modo === 'escalar' ? `Mapa de color de f (azul, valores bajos; naranja, altos) con sus curvas de nivel y, en flechas grises, el gradiente. En color, ∇f en el punto${sol.u ? ' y en azul la dirección u' : ''}. Toca la gráfica para mover el punto.`
      : sol.modo === 'vectorial' ? 'Las flechas son la dirección del campo y las partículas lo siguen. El molinillo del punto gira según el rotacional. Toca la gráfica para mover el punto.'
        : sol.modo === 'linea' ? 'La curva va de A (hueco) a B (relleno). El punto que la recorre lleva la fuerza F (en color) y la velocidad r′(t) (en azul): el trabajo crece cuando van en el mismo sentido.'
          : 'La región D sombreada y su borde recorrido en sentido antihorario. Las partículas siguen el campo: si giran, hay circulación; si salen, hay flujo.') + corte;
    V = null; fondo = null; parts = []; dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); fondo = null; }
  const marcas = (a, b, n = 6) => {
    const p0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(p0)), paso = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0) || 10 * e;
    const out = []; for (let v = Math.ceil(a / paso) * paso; v <= b + paso * 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  };
  const lienzo = (s) => {
    const c = $(s), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); fondo = null; }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h };
  };
  const mL = 40, mR = 12, mT = 12, mB = 26;
  // ventana con la misma escala en x y en y, para que los círculos sean círculos
  function ventana(w, h) {
    let xs, ys;
    if (sol.modo === 'linea') { xs = []; ys = []; for (let i = 0; i <= 200; i++) { const q = sol.r(sol.a + ((sol.b - sol.a) * i) / 200); if (isFinite(q[0]) && isFinite(q[1])) { xs.push(q[0]); ys.push(q[1]); } } }
    else if (sol.modo === 'green') { const r = sol.reg; xs = r.tipo === 'circulo' ? [r.cx - r.R, r.cx + r.R] : [r.x1, r.x2]; ys = r.tipo === 'circulo' ? [r.cy - r.R, r.cy + r.R] : [r.y1, r.y2]; }
    else { const L = Math.max(2.5, 1.5 * Math.max(Math.abs(sol.p[0]), Math.abs(sol.p[1])) + 0.5); xs = [-L, L, sol.p[0]]; ys = [-L, L, sol.p[1]]; }
    let x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
    const lado = Math.max(x2 - x1, y2 - y1, 1) * (sol.modo === 'escalar' || sol.modo === 'vectorial' ? 1 : 1.5);
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, ax = w - mL - mR, ay = h - mT - mB, k = Math.max(lado / ax, lado / ay);
    return { x1: cx - (ax * k) / 2, x2: cx + (ax * k) / 2, y1: cy - (ay * k) / 2, y2: cy + (ay * k) / 2 };
  }
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
    g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('x', w - mR - 2, h - mB - 3);
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('y', mL + 4, mT + 2);
  }
  const flecha = (g, x, y, dx, dy, L, a = 3.2) => {
    const n = Math.hypot(dx, dy); if (!(n > 0) || !isFinite(n)) return;
    const ux = dx / n, uy = dy / n, x2 = x + ux * L, y2 = y + uy * L;
    g.moveTo(x, y); g.lineTo(x2, y2);
    g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.6 - uy * a, y2 - uy * a * 1.6 + ux * a); g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.6 + uy * a, y2 - uy * a * 1.6 - ux * a);
  };
  const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); const n = m ? parseInt(m[1], 16) : 0x888888; return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mezcla = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const z0 = () => (sol.p ? sol.p[2] : 0);
  const Fxy = (x, y) => { try { const v = sol.F(x, y, z0()); return isFinite(v[0]) && isFinite(v[1]) ? v : null; } catch (e) { return null; } };
  // mapa de color de f y curvas de nivel (marching squares), guardado en un lienzo aparte
  function mapa(w, h, X, Y) {
    const c = document.createElement('canvas'), dpr = window.devicePixelRatio || 1;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const paso = 4, nx = Math.ceil((w - mL - mR) / paso) + 1, ny = Math.ceil((h - mT - mB) / paso) + 1, val = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = V.x1 + ((i * paso) / (w - mL - mR)) * (V.x2 - V.x1), y = V.y2 - ((j * paso) / (h - mT - mB)) * (V.y2 - V.y1); let v; try { v = sol.F(x, y, z0()); } catch (e) { v = NaN; } val.push(isFinite(v) ? v : NaN); }
    const ok = val.filter(isFinite).sort((a, b) => a - b);
    if (!ok.length) return c;
    const lo = ok[Math.floor(ok.length * 0.02)], hi = ok[Math.floor(ok.length * 0.98)] + 1e-12;
    const c1 = hex(col['--z1']), c2 = hex(col['--z2']), cb = hex(col['--bg']);
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const v = val[j * nx + i]; if (!isFinite(v)) continue;
      const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo))), rgb = t < 0.5 ? mezcla(c1, cb, t * 2) : mezcla(cb, c2, (t - 0.5) * 2);
      g.fillStyle = `rgba(${rgb.join(',')},0.55)`; g.fillRect(mL + i * paso, mT + j * paso, paso, paso);
    }
    g.strokeStyle = col['--ink']; g.globalAlpha = 0.45; g.lineWidth = 1; g.beginPath();
    for (const nivel of marcas(lo, hi, 10)) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const q = [val[j * nx + i], val[j * nx + i + 1], val[(j + 1) * nx + i + 1], val[(j + 1) * nx + i]].map((v) => v - nivel);
      if (!q.every(isFinite)) continue;
      const pts = [], esq = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (let k = 0; k < 4; k++) { const a = q[k], b = q[(k + 1) % 4]; if ((a < 0) !== (b < 0)) { const s = a / (a - b), p = esq[k], r = esq[(k + 1) % 4]; pts.push([mL + (i + p[0] + (r[0] - p[0]) * s) * paso, mT + (j + p[1] + (r[1] - p[1]) * s) * paso]); } }
      for (let k = 0; k + 1 < pts.length; k += 2) { g.moveTo(...pts[k]); g.lineTo(...pts[k + 1]); }
    }
    g.stroke();
    return c;
  }
  // flechas del campo, todas del mismo largo; la opacidad dice el módulo
  function flechas(g, w, h, X, Y, campo) {
    const nx = Math.max(10, Math.round((w - mL - mR) / 34)), ny = Math.max(8, Math.round((h - mT - mB) / 34)), vs = [];
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = V.x1 + ((i + 0.5) / nx) * (V.x2 - V.x1), y = V.y1 + ((j + 0.5) / ny) * (V.y2 - V.y1), v = campo(x, y); if (v) vs.push([x, y, v[0], v[1], Math.hypot(v[0], v[1])]); }
    const ms = vs.map((q) => q[4]).sort((a, b) => a - b), ref = ms[Math.floor(ms.length * 0.9)] || 1;
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2;
    for (const [x, y, a, b, m] of vs) { g.globalAlpha = 0.25 + 0.6 * Math.min(1, m / ref); g.beginPath(); flecha(g, X(x) - (a / m) * 7, Y(y) + (b / m) * 7, a, -b, 14); g.stroke(); }
    g.globalAlpha = 1;
    return ref;
  }
  function particulas(g, X, Y, ref, dt) {
    const nueva = () => ({ x: V.x1 + Math.random() * (V.x2 - V.x1), y: V.y1 + Math.random() * (V.y2 - V.y1), vida: 1 + Math.random() * 3 });
    while (parts.length < 160) parts.push(nueva());
    const vel = (V.x2 - V.x1) / 8;
    g.fillStyle = col['--accent'];
    for (let i = 0; i < parts.length; i++) {
      const q = parts[i], v = Fxy(q.x, q.y);
      if (dt) {
        q.vida -= dt;
        if (v) { const m = Math.hypot(v[0], v[1]); if (m > 0) { const s = (vel * dt * Math.min(1.5, m / ref)) / m; q.x += v[0] * s; q.y += v[1] * s; } }
        if (!v || q.vida < 0 || q.x < V.x1 || q.x > V.x2 || q.y < V.y1 || q.y > V.y2) { parts[i] = nueva(); continue; }
      }
      g.globalAlpha = Math.min(1, q.vida, 0.85); g.beginPath(); g.arc(X(q.x), Y(q.y), 2.2, 0, 2 * Math.PI); g.fill();
    }
    g.globalAlpha = 1;
  }
  const circulo = (g, x, y, r, relleno, borde, lw = 1.8) => { g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); if (relleno) { g.fillStyle = relleno; g.fill(); } if (borde) { g.strokeStyle = borde; g.lineWidth = lw; g.stroke(); } };
  function dibuja(dt = 0) {
    const { g, w, h } = lienzo('#grafica');
    trans = null;
    if (!sol) return;
    if (!col['--ink']) colores();
    if (!V) V = ventana(w, h);
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    trans = { x: (px) => V.x1 + ((px - mL) / (w - mL - mR)) * (V.x2 - V.x1), y: (py) => V.y2 - ((py - mT) / (h - mT - mB)) * (V.y2 - V.y1) };
    if (sol.modo === 'escalar') { if (!fondo) fondo = mapa(w, h, X, Y); g.drawImage(fondo, 0, 0, w, h); }
    ejes(g, w, h, X, Y);
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    if (sol.modo === 'escalar') {
      flechas(g, w, h, X, Y, (x, y) => { try { const v = sol.G(x, y, z0()); return isFinite(v[0]) && isFinite(v[1]) ? v : null; } catch (e) { return null; } });
      const P0 = [X(sol.p[0]), Y(sol.p[1])], gm = Math.hypot(sol.g0[0], sol.g0[1]);
      g.lineWidth = 2.6; g.strokeStyle = col['--accent']; g.beginPath(); flecha(g, P0[0], P0[1], sol.g0[0], -sol.g0[1], 56, 5); g.stroke();
      if (sol.u) { g.strokeStyle = col['--z1']; g.beginPath(); flecha(g, P0[0], P0[1], sol.u[0], -sol.u[1], 44, 5); g.stroke(); }
      circulo(g, P0[0], P0[1], 4.5, col['--panel'], col['--ink']);
      if (gm > 0) { g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--accent']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('∇f', P0[0] + (sol.g0[0] / gm) * 64, P0[1] - (sol.g0[1] / gm) * 64); }
    } else {
      if (sol.modo === 'green') {
        g.beginPath(); for (let i = 0; i <= 120; i++) { const q = sol.borde(i / 120); i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])); }
        g.closePath(); g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.8; g.fill(); g.globalAlpha = 1;
      }
      const ref = flechas(g, w, h, X, Y, Fxy);
      particulas(g, X, Y, ref, anda ? dt : 0);
      if (sol.modo === 'vectorial') {
        // molinillo: gira con la mitad del rotacional (la velocidad angular del fluido)
        const P0 = [X(sol.p[0]), Y(sol.p[1])], r = 18;
        g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.beginPath();
        for (let k = 0; k < 4; k++) { const a = giro + (k * Math.PI) / 2; g.moveTo(P0[0], P0[1]); g.lineTo(P0[0] + r * Math.cos(a), P0[1] - r * Math.sin(a)); }
        g.stroke(); g.fillStyle = col['--ink']; for (let k = 0; k < 4; k++) { const a = giro + (k * Math.PI) / 2; circulo(g, P0[0] + r * Math.cos(a), P0[1] - r * Math.sin(a), 3.2, col['--accent']); }
        circulo(g, P0[0], P0[1], 3.5, col['--panel'], col['--ink'], 1.5);
      } else if (sol.modo === 'linea') {
        const n = 300, pts = []; for (let i = 0; i <= n; i++) pts.push(sol.r(sol.a + ((sol.b - sol.a) * i) / n));
        g.strokeStyle = col['--ink']; g.lineWidth = 2.4; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])))); g.stroke();
        circulo(g, X(sol.A[0]), Y(sol.A[1]), 5, col['--panel'], col['--ink']); circulo(g, X(sol.B[0]), Y(sol.B[1]), 4, col['--ink']);
        const t = sol.a + (sol.b - sol.a) * u, q = sol.r(t), e = 1e-4 * (sol.b - sol.a), q2 = sol.r(Math.min(sol.b, t + e)), q1 = sol.r(Math.max(sol.a, t - e)), F = Fxy(q[0], q[1]) && sol.F(q[0], q[1], q[2]);
        if (F) { g.strokeStyle = col['--accent']; g.lineWidth = 2.6; g.beginPath(); flecha(g, X(q[0]), Y(q[1]), F[0], -F[1], 46, 5); g.stroke(); }
        g.strokeStyle = col['--z1']; g.lineWidth = 2.2; g.beginPath(); flecha(g, X(q[0]), Y(q[1]), q2[0] - q1[0], -(q2[1] - q1[1]), 34, 4.5); g.stroke();
        circulo(g, X(q[0]), Y(q[1]), 5.5, col['--accent']);
      } else {
        g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= 120; i++) { const q = sol.borde(i / 120); i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])); } g.closePath(); g.stroke();
        // flechas de sentido antihorario sobre el borde
        g.fillStyle = col['--ink'];
        for (const s of [0.125, 0.375, 0.625, 0.875]) { const a = sol.borde(s), b = sol.borde(s + 0.004), dx = X(b[0]) - X(a[0]), dy = Y(b[1]) - Y(a[1]); g.beginPath(); flecha(g, X(a[0]) - dx, Y(a[1]) - dy, dx, dy, 2, 6); g.stroke(); }
        const q = sol.borde(u % 1); circulo(g, X(q[0]), Y(q[1]), 5.5, col['--accent']);
      }
    }
    g.restore();
  }
  // tocar la gráfica mueve el punto (o el centro del círculo de Green)
  $('#grafica').addEventListener('click', (e) => {
    if (!sol || !trans || sol.modo === 'linea' || (sol.modo === 'green' && sc.region !== 'circulo')) return;
    const r = e.target.getBoundingClientRect(), x = trans.x(e.clientX - r.left), y = trans.y(e.clientY - r.top);
    const red = (v) => coma(+v.toPrecision(3));
    if (sol.modo === 'green') { sc.cx = red(x); sc.cy = red(y); } else { sc.x0 = red(x); sc.y0 = red(y); }
    const V0 = sol.modo === 'green' ? null : V;
    formulario(); cambia(); if (V0 && sol) { V = V0; fondo = null; dibuja(); }
  });
  $('#animar').addEventListener('click', () => { anda = !anda; $('#animar').textContent = anda ? '⏸ Parar' : '▶ Animar'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) {
      u = sol.modo === 'linea' ? (u + dt / 5) % 1 : sol.modo === 'green' ? (u + dt / 6) % 1 : u;
      if (sol.modo === 'vectorial') giro += Math.max(-4, Math.min(4, sol.rot0[2] / 2)) * dt;
      dibuja(dt);
    }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { V = null; fondo = null; parts = []; dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('campos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.CamposApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, g0: sol.g0, du: sol.du, div: sol.div, rot0: sol.rot0, phi: sol.phi, W: sol.W, circula: sol.circula, dobleR: sol.dobleR, flujo: sol.flujo, dobleD: sol.dobleD }, estado: () => copia(sc) };
})();
