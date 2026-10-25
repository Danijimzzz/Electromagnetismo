/* =====================================================================
   Corriente alterna y fasores: interfaz (modo, conexión, datos, lista
   de elementos de una red, resultado, diagrama de fasores, ondas, triángulo
   de potencias, curva de resonancia y desarrollo).
   El cálculo está en alterna/fisica.js (Alterna).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const A = Alterna, CLAVE = 'alterna-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

  let sc = copia(A.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && ['circuito', 'correccion', 'red', 'trifasica'].includes(g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom} <small>${un}</small></label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opcion = (k, v, t, def) => `<option value="${v}"${(sc[k] ?? def) === v ? ' selected' : ''}>${t}</option>`;
  const elige = (k, nom, ops) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${ops.map(([v, t], i) => opcion(k, v, t, ops[0][0])).join('')}</select>`;
  const DATO = { P: ['Potencia activa P', 'kW'], S: ['Potencia aparente S', 'kVA'], I: ['Corriente I', 'A'], Q: ['Potencia reactiva Q', 'kvar'] };
  function formulario() {
    let h = elige('modo', 'Qué calcular', [['circuito', 'Circuito RLC en serie o en paralelo'], ['red', 'Red de alterna (método de los nudos)'], ['trifasica', 'Sistema trifásico equilibrado'], ['correccion', 'Corregir el factor de potencia']]);
    const red = sc.modo === 'red';
    if (sc.modo === 'correccion') {
      const d = DATO[sc.dato] ? sc.dato : 'P';
      h += fila('V', 'Tensión eficaz V', 'V') + fila('f', 'Frecuencia f', 'Hz') + elige('carga', 'La carga es', [['inductiva', 'Inductiva (motores)'], ['capacitiva', 'Capacitiva']]) + elige('dato', 'Dato de la carga', [['P', 'Potencia activa'], ['S', 'Potencia aparente'], ['I', 'Corriente'], ['Q', 'Potencia reactiva']]) + fila('P', DATO[d][0], DATO[d][1]) + fila('fp1', 'cos φ inicial', '') + fila('fp2', 'cos φ deseado', '');
      $('#nota').textContent = sc.carga === 'capacitiva' ? 'Una carga capacitiva se corrige con una bobina en paralelo.' : 'El condensador va en paralelo con la carga.';
    } else if (sc.modo === 'trifasica') {
      h += fila('VL', 'Tensión de línea V<sub>L</sub>', 'V') + fila('f', 'Frecuencia f', 'Hz') + elige('conexion', 'Carga conectada en', [['estrella', 'Estrella (Y)'], ['triangulo', 'Triángulo (Δ)']]) + fila('R', 'Resistencia de cada fase R', 'Ω') + fila('X', 'Reactancia de cada fase X', 'Ω') + fila('fp2', 'cos φ deseado (opcional)', '');
      $('#nota').textContent = 'Carga equilibrada: las tres fases iguales. X positiva si es inductiva y negativa si es capacitiva. Con un cos φ deseado calcula la batería de condensadores.';
    } else if (red) {
      h += fila('f', 'Frecuencia f', 'Hz');
      $('#nota').textContent = 'Cada elemento va del nudo A al nudo B; en una fuente de tensión A es el borne +, y en una de corriente la corriente va de A a B por dentro. Valores eficaces; la fase en grados. L en mH y C en μF si no pones unidad. El nudo 0 es la referencia.';
    } else {
      if (!['serie', 'paralelo'].includes(sc.conexion)) sc.conexion = 'serie';
      h += elige('conexion', 'Conexión', [['serie', 'En serie'], ['paralelo', 'En paralelo']]);
      h += elige('tipoV', 'La tensión es el valor', [['eficaz', 'Eficaz'], ['pico', 'De pico']]) + fila('V', sc.tipoV === 'pico' ? 'Tensión de pico V<sub>m</sub>' : 'Tensión eficaz V', 'V') + fila('faseV', 'Fase inicial φ (opcional)', '°');
      h += elige('unidadF', 'Frecuencia dada como', [['f', 'Frecuencia f (Hz)'], ['w', 'Pulsación ω (rad/s)']]) + fila('f', sc.unidadF === 'w' ? 'Pulsación ω' : 'Frecuencia f', sc.unidadF === 'w' ? 'rad/s' : 'Hz');
      h += fila('R', 'Resistencia R', 'Ω') + fila('L', 'Inductancia L', 'mH') + fila('C', 'Capacidad C', 'μF');
      $('#nota').textContent = 'Deja vacío un elemento si no está. Puedes usar coma o punto decimal y prefijos como 4k7, 100n o 10m.';
    }
    $('#campos').innerHTML = h;
    $('#red').hidden = !red;
    if (red) lista();
  }

  /* ---------- Lista de elementos de una red ---------- */
  function lista() {
    sc.elementos = Array.isArray(sc.elementos) && sc.elementos.length ? sc.elementos : copia(A.ejemplos.find((e) => e.sc.modo === 'red').sc.elementos);
    const nom = A.nombres(sc.elementos), campo = (i, k, v, et, extra = '') => `<input class="in" data-i="${i}" data-k="${k}" value="${esc(v ?? '')}" aria-label="${nom[i]}: ${et}" autocomplete="off" spellcheck="false"${extra}>`;
    $('#lista').innerHTML = '<span class="cab">Elemento</span><span class="cab">Nudo A</span><span class="cab">Nudo B</span><span class="cab">Valor</span><span class="cab">Fase</span><span></span>' + sc.elementos.map((e, i) => {
      const T = A.TIPOS[e.t];
      return `<b title="${T.nombre}">${nom[i].replace(/(\d+)/, '<sub>$1</sub>')}</b>${campo(i, 'a', e.a, 'nudo A')}${campo(i, 'b', e.b, 'nudo B')}<span class="valor">${campo(i, 'v', e.v, `valor en ${T.un}`, ' inputmode="decimal"')}<small>${T.un}</small></span>${'VI'.includes(e.t) ? `<span class="valor">${campo(i, 'fase', e.fase, 'fase en grados', ' inputmode="decimal"')}<small>°</small></span>` : '<span></span>'}<button class="x" type="button" data-quita="${i}" aria-label="Quitar ${nom[i]}">×</button>`;
    }).join('');
    for (const b of document.querySelectorAll('[data-add]')) b.disabled = sc.elementos.length >= 14;
  }
  $('#lista').addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined) return; sc.elementos[+t.dataset.i][t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#lista').addEventListener('click', (e) => { const q = e.target.dataset.quita; if (q === undefined) return; sc.elementos.splice(+q, 1); $('#ejemplos').value = ''; lista(); calcula(); });
  for (const b of document.querySelectorAll('[data-add]')) b.addEventListener('click', () => {
    const t = b.dataset.add, ult = sc.elementos[sc.elementos.length - 1];
    sc.elementos.push({ t, a: ult ? ult.b : 'a', b: '0', v: { R: '10', L: '10', C: '100', V: '10', I: '1' }[t], ...('VI'.includes(t) ? { fase: '0' } : {}) });
    $('#ejemplos').value = ''; lista(); calcula();
  });
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') { const ej = A.ejemplos.find((x) => x.sc.modo === t.value); for (const [k, v] of Object.entries(copia(ej.sc))) if (sc[k] === undefined || sc[k] === '' || ['P', 'conexion', 'elementos'].includes(k)) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + A.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = A.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = { ...sc, tipoV: 'eficaz', faseV: '', unidadF: 'f', dato: 'P', carga: 'inductiva', fp2: '', ...copia(e.sc) };
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    const modo = ['correccion', 'red', 'trifasica'].includes(sc.modo) ? sc.modo : 'circuito';
    try { sol = { modo, ...A[modo](sc) }; }
    catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').innerHTML = ''; guarda(); dibuja(); return; }
    err.hidden = true; guarda();
    if (sol.modo === 'correccion') {
      $('#res').innerHTML = (sol.capac ? dato('Inductancia de la bobina', `L = <b>${A.u(sol.L, 'H')}</b>`) + dato('Reactiva que consume', `Q<sub>L</sub> = ${A.u(sol.Qc, 'var')}`) : dato('Capacidad del condensador', `C = <b>${A.u(sol.C, 'F')}</b>`) + dato('Reactiva que aporta', `Q<sub>C</sub> = ${A.u(sol.Qc, 'var')}`)) + dato('Corriente de línea', `${A.u(sol.I1, 'A')} → ${A.u(sol.I2, 'A')}`);
      $('#leyenda').innerHTML = 'Izquierda: triángulo de potencias antes (<b style="color:var(--v)">S<sub>1</sub></b>) y después (<b style="color:var(--i)">S<sub>2</sub></b>). Derecha: v(t) y la corriente de línea antes y después.';
    } else if (sol.modo === 'red') {
      $('#res').innerHTML = dato('Potenciales', sol.nudos.filter((n) => n !== sol.ref).map((n) => `V<sub>${esc(n)}</sub> = <b>${A.pol(sol.V[n])} V</b>`).join('<br>')) + dato('Potencias consumidas', `P = ${A.u(sol.P, 'W')}, Q = ${A.u(sol.Q, 'var')}`);
      $('#leyenda').innerHTML = 'Fasores: el potencial de cada nudo respecto a la referencia. Ondas: v(t) de cada nudo, con valores de pico √2 veces los eficaces.';
    } else if (sol.modo === 'trifasica') {
      $('#res').innerHTML = dato('Fase', `V<sub>fase</sub> = <b>${A.f(sol.Vf)} V</b>, I<sub>fase</sub> = <b>${A.u(sol.If, 'A')}</b>`) + dato('Línea', `V<sub>L</sub> = ${A.f(sol.VL)} V, I<sub>L</sub> = <b>${A.u(sol.IL, 'A')}</b>`) + dato('Potencias', `P = ${A.u(sol.P, 'W')}, Q = ${A.u(sol.Q, 'var')}, S = ${A.u(sol.S, 'VA')}`) + dato('Factor de potencia', `cos φ = <b>${A.f(sol.fp)}</b>`) + (sol.corr ? dato('Condensadores por fase', `${A.u(sol.corr.Cy, 'F')} en estrella o ${A.u(sol.corr.Cd, 'F')} en triángulo`) : '');
      $('#leyenda').innerHTML = 'Fasores: tensiones simples <b style="color:var(--f1)">V<sub>RN</sub></b>, <b style="color:var(--f2)">V<sub>SN</sub></b> y <b style="color:var(--f3)">V<sub>TN</sub></b>, y las corrientes de línea punteadas (escala propia). Ondas: las tres tensiones simples. Abajo, el triángulo de potencias de las tres fases.';
    } else {
      $('#res').innerHTML = dato('Impedancia', `Z = ${A.bin(sol.Zt)} = <b>${A.pol(sol.Zt)} Ω</b>`) + dato('Corriente', `I = <b>${A.pol(sol.I)} A</b>`) + dato('Factor de potencia', `cos φ = <b>${A.f(sol.fp)}</b>${Math.abs(sol.fi) < 1e-5 ? ' (resistivo)' : sol.fi > 0 ? ' inductivo' : ' capacitivo'}`) + dato('Potencias', `P = ${A.u(sol.P, 'W')}, Q = ${A.u(sol.Q, 'var')}, S = ${A.u(sol.S, 'VA')}`) + (sol.res ? dato('Resonancia', `f<sub>0</sub> = ${A.u(sol.res.f0, 'Hz')}`) : '');
      $('#leyenda').innerHTML = sol.serie
        ? 'Fasores: <b style="color:var(--v)">V</b> de la fuente como suma de las tensiones de cada elemento, y <b style="color:var(--i)">I</b> (escala propia). Ondas: v(t) e i(t) con valores de pico √2 veces los eficaces.'
        : 'Fasores: <b style="color:var(--i)">I</b> total como suma de las corrientes de cada rama, y <b style="color:var(--v)">V</b> de la fuente (escala propia). Ondas: v(t) e i(t) con valores de pico √2 veces los eficaces.';
      $('#res').innerHTML += dato('Valores instantáneos', `${sol.vt}<br>${sol.it}`);
      $('#leyenda').innerHTML += ` Abajo, el triángulo de potencias${sol.res ? ' y la curva de resonancia: la corriente frente a la frecuencia, con f<sub>0</sub> y el punto de trabajo' : ''}.`;
    }
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--v', '--i', '--x', '--bg', '--f1', '--f2', '--f3']) col[k] = cs.getPropertyValue(k).trim(); }
  function lienzo(id) {
    const r = Herramienta.lienzo(id);
    r.g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    r.g.lineCap = 'round'; r.g.lineJoin = 'round';
    return r;
  }
  function flecha(g, x0, y0, x1, y1, color, ancho = 2, punteada = false) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 1) return;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho; g.setLineDash(punteada ? [5, 4] : []);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(10, L * 0.4);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  }
  // texto con un recuadro del color del fondo, para que se lea aunque caiga encima de una flecha
  function etiqueta(g, x, y, t, color, dx = 0, dy = 0) {
    const w = g.measureText(t).width, x0 = dx < 0 ? x + dx - w : dx > 0 ? x + dx : x - w / 2, y0 = dy < 0 ? y + dy - 14 : dy > 0 ? y + dy : y - 7;
    g.fillStyle = col['--bg']; g.globalAlpha = 0.85; g.fillRect(x0 - 2, y0, w + 4, 14); g.globalAlpha = 1;
    g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(t, x0, y0 + 1);
  }

  // Coloca una lista de vectores (en coordenadas físicas) dentro del lienzo, con el origen donde convenga
  function encaja(puntos, w, h, m = 26) {
    const xs = puntos.map((p) => p[0]).concat(0), ys = puntos.map((p) => p[1]).concat(0);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.min((w - 2 * m) / Math.max(x1 - x0, 1e-12), (h - 2 * m) / Math.max(y1 - y0, 1e-12));
    const ox = m + (w - 2 * m - (x1 - x0) * k) / 2 - x0 * k, oy = h - m - (h - 2 * m - (y1 - y0) * k) / 2 + y0 * k;
    return { X: (x) => ox + x * k, Y: (y) => oy - y * k, k, ox, oy };
  }

  function fasores() {
    const { g, w, h } = lienzo('#fasores');
    if (!sol) return;
    if (sol.modo === 'correccion') return triangulos(g, w, h);
    if (sol.modo === 'red' || sol.modo === 'trifasica') return estrella(g, w, h);
    const nombreV = { R: 'V_R', L: 'V_L', C: 'V_C' }, nombreI = { R: 'I_R', L: 'I_L', C: 'I_C' };
    // la magnitud principal se dibuja encadenada; la otra, sola y escalada a la mitad de la principal
    const serie = sol.serie, cadena = sol.partes.map((p) => (serie ? p.V : p.I)), total = serie ? sol.Vf : sol.I, otra = serie ? sol.I : sol.Vf;
    const pts = []; let x = 0, y = 0;
    for (const z of cadena) { x += z.re; y += z.im; pts.push([x, y]); }
    const escOtra = (A.mod(total) * 0.6) / (A.mod(otra) || 1);
    pts.push([otra.re * escOtra, otra.im * escOtra], [total.re, total.im]);
    const T = encaja(pts, w, h);
    // ejes
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(0, T.oy); g.lineTo(w, T.oy); g.moveTo(T.ox, 0); g.lineTo(T.ox, h); g.stroke();
    etiqueta(g, w - 4, T.oy, 'Re', col['--muted'], -1, -4); etiqueta(g, T.ox, 4, 'Im', col['--muted'], 4, 4);
    const cPrin = serie ? col['--v'] : col['--i'], cOtra = serie ? col['--i'] : col['--v'];
    x = 0; y = 0;
    sol.partes.forEach((p, i) => {
      const z = cadena[i], x1 = x + z.re, y1 = y + z.im;
      // L y C son colineales (los dos a 90° de R): se separan unos píxeles para que se vean los dos
      const n = Math.atan2(-(y1 - y), x1 - x) + Math.PI / 2, d = p.k === 'C' && sol.partes.some((q) => q.k === 'L') ? 6 : 0, dx = d * Math.cos(n), dy = d * Math.sin(n);
      flecha(g, T.X(x) + dx, T.Y(y) + dy, T.X(x1) + dx, T.Y(y1) + dy, col['--x'], 2, true);
      const mx = T.X(x) + (T.X(x1) - T.X(x)) * 0.3, my = T.Y(y) + (T.Y(y1) - T.Y(y)) * 0.3, lado = d ? 1 : -1;
      etiqueta(g, mx + lado * 14 * Math.cos(n), my + lado * 14 * Math.sin(n), (serie ? nombreV : nombreI)[p.k].replace('_', ''), col['--x']);
      x = x1; y = y1;
    });
    flecha(g, T.X(0), T.Y(0), T.X(total.re), T.Y(total.im), cPrin, 2.5);
    etiqueta(g, T.X(total.re), T.Y(total.im), serie ? 'V' : 'I', cPrin, total.re >= 0 ? -8 : 8, total.im >= 0 ? -4 : 4);
    flecha(g, T.X(0), T.Y(0), T.X(otra.re * escOtra), T.Y(otra.im * escOtra), cOtra, 2.5);
    etiqueta(g, T.X(otra.re * escOtra), T.Y(otra.im * escOtra), serie ? 'I' : 'V', cOtra, 0, otra.im * escOtra >= 0 ? -6 : 6);
    // ángulo φ entre V e I
    if (Math.abs(sol.fi) > 1e-3) {
      const aV = -Math.atan2(sol.Vf.im, sol.Vf.re), aI = -Math.atan2(sol.I.im, sol.I.re), r = 28;
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.arc(T.ox, T.oy, r, Math.min(aV, aI), Math.max(aV, aI)); g.stroke();
      const am = (aV + aI) / 2; etiqueta(g, T.ox + (r + 10) * Math.cos(am), T.oy + (r + 10) * Math.sin(am), 'φ', col['--muted']);
    }
  }

  function triangulos(g, w, h) {
    const P = sol.P, pts = [[P, 0], [P, sol.Q1], [P, sol.Q2]], T = encaja(pts, w, h, 30);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(0, T.oy); g.lineTo(w, T.oy); g.stroke();
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(0), col['--ink'], 2);
    etiqueta(g, T.X(P / 2), T.Y(0), `P = ${txt(A.u(P, 'W'))}`, col['--ink'], 0, 6);
    flecha(g, T.X(P), T.Y(0), T.X(P), T.Y(sol.Q2), col['--x'], 2);
    flecha(g, T.X(P), T.Y(sol.Q2), T.X(P), T.Y(sol.Q1), col['--accent'], 2, true);
    etiqueta(g, T.X(P), T.Y((sol.Q1 + sol.Q2) / 2), `${sol.capac ? 'QL' : 'QC'} = ${txt(A.u(sol.Qc, 'var'))}`, col['--accent'], -6, 0);
    etiqueta(g, T.X(P), T.Y(sol.Q2 / 2), `Q2`, col['--x'], 6, 0);
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(sol.Q1), col['--v'], 2.5);
    etiqueta(g, T.X(P / 2), T.Y(sol.Q1 / 2), 'S1', col['--v'], -8, -8);
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(sol.Q2), col['--i'], 2.5);
    etiqueta(g, T.X(P * 0.7), T.Y(sol.Q2 * 0.7), 'S2', col['--i'], 4, 8);
    etiqueta(g, 8, 8, `φ1 = ${txt(A.ang(sol.f1))}, φ2 = ${txt(A.ang(sol.f2))}`, col['--muted'], 1, 1);
  }

  // fasores que salen todos del origen: los potenciales de una red, o las tres fases
  const PALETA = ['--v', '--i', '--x', '--accent', '--f1', '--f3'];
  function vectores() {
    if (sol.modo === 'trifasica') {
      const kI = (Math.max(...sol.fases.map((p) => A.mod(p.Vs))) * 0.6) / (A.mod(sol.fases[0].IL) || 1);
      return [...sol.fases.map((p, k) => ({ z: p.Vs, nom: `V${p.q}N`, c: col[`--f${k + 1}`] })), ...sol.fases.map((p, k) => ({ z: A.mul(p.IL, A.Z(kI)), nom: `I${p.q}`, c: col[`--f${k + 1}`], punteada: true }))];
    }
    return sol.nudos.filter((n) => n !== sol.ref).map((n, k) => ({ z: sol.V[n], nom: `V${n}`, c: col[PALETA[k % PALETA.length]] }));
  }
  function estrella(g, w, h) {
    const vs = vectores(), T = encaja(vs.map((v) => [v.z.re, v.z.im]).concat(vs.map((v) => [-v.z.re * 0.05, -v.z.im * 0.05])), w, h);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(0, T.oy); g.lineTo(w, T.oy); g.moveTo(T.ox, 0); g.lineTo(T.ox, h); g.stroke();
    etiqueta(g, w - 4, T.oy, 'Re', col['--muted'], -1, -4); etiqueta(g, T.ox, 4, 'Im', col['--muted'], 4, 4);
    for (const v of vs) { flecha(g, T.X(0), T.Y(0), T.X(v.z.re), T.Y(v.z.im), v.c, v.punteada ? 1.8 : 2.5, v.punteada); etiqueta(g, T.X(v.z.re), T.Y(v.z.im), v.nom, v.c, v.z.re >= 0 ? 4 : -4, v.z.im >= 0 ? -4 : 4); }
  }

  function potencias() {
    const { g, w, h } = lienzo('#triangulo');
    if (!sol || !('Q' in sol) || sol.modo === 'correccion' || sol.modo === 'red') return;
    const P = sol.P, Q = sol.Q, T = encaja([[P, 0], [P, Q]], w, h, 30);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(0, T.oy); g.lineTo(w, T.oy); g.stroke();
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(0), col['--ink'], 2);
    etiqueta(g, T.X(P / 2), T.Y(0), `P = ${txt(A.u(P, 'W'))}`, col['--ink'], 0, Q >= 0 ? 6 : -6);
    if (Math.abs(Q) > 1e-9 * Math.max(1, sol.S)) { flecha(g, T.X(P), T.Y(0), T.X(P), T.Y(Q), col['--x'], 2); etiqueta(g, T.X(P), T.Y(Q / 2), `Q = ${txt(A.u(Q, 'var'))}`, col['--x'], -6, 0); }
    flecha(g, T.X(0), T.Y(0), T.X(P), T.Y(Q), col['--v'], 2.5);
    etiqueta(g, T.X(P / 2), T.Y(Q / 2), `S = ${txt(A.u(sol.S, 'VA'))}`, col['--v'], -8, Q >= 0 ? -8 : 8);
    etiqueta(g, 8, 8, `φ = ${txt(A.ang(sol.fi))}, cos φ = ${txt(A.f(sol.fp))}`, col['--muted'], 1, 1);
  }

  function curva() {
    const { g, w, h } = lienzo('#curva');
    if (!sol || sol.modo !== 'circuito' || !sol.res) return;
    const pts = A.barrido(sol), m = { l: 12, r: 12, t: 24, b: 24 }, Imax = Math.max(...pts.map((p) => p.I)) * 1.1, f0 = pts[0].f, f1 = pts[pts.length - 1].f;
    const X = (fr) => m.l + (Math.log(fr / f0) / Math.log(f1 / f0)) * (w - m.l - m.r), Y = (I) => h - m.b - (I / Imax) * (h - m.t - m.b);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(m.l, h - m.b); g.lineTo(w - m.r, h - m.b); g.stroke();
    g.strokeStyle = col['--i']; g.lineWidth = 2; g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(X(p.f), Y(p.I)) : g.moveTo(X(p.f), Y(p.I)))); g.stroke();
    const xr = X(sol.res.f0); g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(xr, m.t); g.lineTo(xr, h - m.b); g.stroke(); g.setLineDash([]);
    etiqueta(g, xr, h - m.b, `f0 = ${txt(A.u(sol.res.f0, 'Hz'))}`, col['--muted'], 0, 4);
    if (sol.res.B) { const a = sol.res.f0 - sol.res.B / 2, b = sol.res.f0 + sol.res.B / 2, y = Y(Math.max(...pts.map((p) => p.I)) / Math.SQRT2); if (a > f0) { g.strokeStyle = col['--x']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(a), y); g.lineTo(X(b), y); g.stroke(); etiqueta(g, X(b), y, `Δf = ${txt(A.u(sol.res.B, 'Hz'))}`, col['--x'], 6, 0); } }
    const I = A.mod(sol.I); if (sol.fr > f0 && sol.fr < f1) { g.fillStyle = col['--v']; g.beginPath(); g.arc(X(sol.fr), Y(I), 4.5, 0, 2 * Math.PI); g.fill(); }
    etiqueta(g, 8, 6, 'I frente a f (escala logarítmica)', col['--muted'], 1, 1);
  }

  function ondas() {
    const { g, w, h } = lienzo('#ondas');
    if (!sol) return;
    const m = { l: 10, r: 10, t: 16, b: 22 }, per = 2, oy = (h - m.b + m.t) / 2, amp = (h - m.t - m.b) / 2 - 4;
    const X = (t) => m.l + (t / per) * (w - m.l - m.r);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(m.l, oy); g.lineTo(w - m.r, oy); g.stroke();
    for (let k = 1; k < per * 2; k++) { g.beginPath(); g.moveTo(X(k / 2), oy - 3); g.lineTo(X(k / 2), oy + 3); g.stroke(); }
    etiqueta(g, X(1), oy + amp + 4, 'T', col['--muted'], 0, 2); etiqueta(g, X(2) - 2, oy + amp + 4, '2T', col['--muted'], -1, 2);
    const curva = (fase, a, color, ancho = 2, punteada = false) => {
      g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(punteada ? [5, 4] : []); g.beginPath();
      for (let i = 0; i <= 300; i++) { const t = (per * i) / 300, y = oy - a * amp * Math.sin(2 * Math.PI * t + fase); i ? g.lineTo(X(t), y) : g.moveTo(X(t), y); }
      g.stroke(); g.setLineDash([]);
    };
    g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    if (sol.modo === 'red' || sol.modo === 'trifasica') {
      const vs = vectores().filter((v) => !v.punteada), M = Math.max(...vs.map((v) => A.mod(v.z))) || 1;
      let x = m.l + 2;
      for (const v of vs) { curva(A.arg(v.z), A.mod(v.z) / M, v.c); const t = `${v.nom.replace(/^V/, 'v')}(t)`; g.fillStyle = v.c; g.fillText(t, x, 0); x += g.measureText(t).width + 14; }
      return;
    }
    if (sol.modo === 'correccion') {
      curva(0, 1, col['--v']);
      curva(-sol.f1, 0.85, col['--muted'], 1.5, true);
      curva(-sol.f2, 0.85 * sol.I2 / sol.I1, col['--i']);
      g.fillStyle = col['--v']; g.fillText('v(t)', m.l + 2, 0);
      g.fillStyle = col['--muted']; g.fillText(`i₁(t), pico ${txt(A.u(Math.SQRT2 * sol.I1, 'A'))}`, m.l + 40, 0);
      g.fillStyle = col['--i']; g.fillText(`i₂(t), pico ${txt(A.u(Math.SQRT2 * sol.I2, 'A'))}`, m.l + 40 + g.measureText(`i₁(t), pico ${txt(A.u(Math.SQRT2 * sol.I1, 'A'))}`).width + 14, 0);
      return;
    }
    const fV = Math.atan2(sol.Vf.im, sol.Vf.re), fI = Math.atan2(sol.I.im, sol.I.re);
    curva(fV, 1, col['--v']);
    curva(fI, 0.7, col['--i']);
    g.fillStyle = col['--v']; const tv = `v(t), pico ${txt(A.u(Math.SQRT2 * sol.V, 'V'))}`; g.fillText(tv, m.l + 2, 0);
    g.fillStyle = col['--i']; g.fillText(`i(t), pico ${txt(A.u(Math.SQRT2 * A.mod(sol.I), 'A'))}`, m.l + 16 + g.measureText(tv).width, 0);
  }
  function dibuja() {
    colores(); fasores(); ondas();
    const tri = !!sol && (sol.modo === 'circuito' || sol.modo === 'trifasica'), res = !!sol && sol.modo === 'circuito' && !!sol.res;
    $('#graficas2').hidden = !tri; $('#curva').hidden = !res; $('#graficas2').classList.toggle('una', !res);
    if (tri) { potencias(); curva(); }
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('alterna').current;
  formulario(); calcula();
  window.AlternaApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, Z: sol.Zt && A.mod(sol.Zt), fi: sol.fi, fp: sol.fp, I: sol.I && A.mod(sol.I), C: sol.C, L: sol.L, P: sol.P, IL: sol.IL, V: sol.V && sol.modo === 'red' ? Object.fromEntries(Object.entries(sol.V).map(([k, z]) => [k, A.mod(z)])) : undefined }, estado: () => copia(sc) };
})();
