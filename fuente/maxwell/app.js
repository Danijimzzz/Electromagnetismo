/* =====================================================================
   Ecuaciones de Maxwell: interfaz (elegir la ecuación, datos, resultados,
   gráfica de la magnitud que cambia y desarrollo paso a paso). El cálculo
   está en maxwell/calculo.js (Maxwell); la teoría y los enlaces a los demás
   simuladores, en pagina.html.
   Guarda el estado entero (sc) en localStorage[CLAVE] en cada cambio: es lo
   que copia Mis ejercicios. Expone window.MaxwellApp para práctica y pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const M = Maxwell, f = M.f, CLAVE = 'maxwell-v1';
  const MODOS = Object.keys(M.campos);

  let sc = copia(M.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.includes(g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="${sc.modo === 'campo' ? 'text' : 'decimal'}" autocomplete="off">`;
  function formulario() {
    $('#modo').innerHTML = MODOS.map((m) => `<option value="${m}">${M.nombres[m]}</option>`).join('');
    $('#modo').value = sc.modo;
    $('#campos').innerHTML = M.campos[sc.modo].map(([k, nom, un]) => fila(k, nom, un)).join('');
    $('#nota').textContent = sc.modo === 'campo' ? 'Escribe cada componente como expresión en x, y, z (m) y t (s): 5 x, 100 cos(299792458 t − z), x/(x^2+y^2+z^2)^(3/2). Las potencias de diez se escriben 10^8, no 1e8. Si dejas B en blanco se calcula ∂B/∂t = −∇×E.' : 'Se admite coma decimal, 3e8 y 3·10^8.';
    document.querySelectorAll('.eq[data-modo]').forEach((e) => e.classList.toggle('activa', e.dataset.modo === sc.modo));
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#modo').addEventListener('change', () => {
    const e = M.ejemplos.find((x) => x.sc.modo === $('#modo').value);
    sc = copia(e.sc); formulario(); calcula(); $('#ejemplos').value = e.clave;
  });
  // pulsar una ecuación de la teoría abre su calculadora
  document.querySelectorAll('.eq[data-modo]').forEach((e) => e.addEventListener('click', (ev) => {
    if (ev.target.closest('a')) return;
    if (sc.modo !== e.dataset.modo) { sc = copia(M.ejemplos.find((x) => x.sc.modo === e.dataset.modo).sc); formulario(); calcula(); }
    $('#modo').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + M.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = M.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const modo = de(MODOS.filter((m) => m !== 'campo'));
    if (modo === 'gauss') { const R = de([0.05, 0.1, 0.2]); sc = { modo, Q: String(de([1, 2, 5, 10])), R: c(R), r: c(de([R / 2, 2 * R, 3 * R])) }; }
    else if (modo === 'gaussmag') sc = { modo, Bx: c(de([0.1, 0.2, -0.3])), By: c(de([0.5, -0.4, 0.2])), Bz: c(de([0.3, -0.1, 0.6])), L: c(de([0.2, 0.5, 1])) };
    else if (modo === 'faraday') sc = { modo, B0: String(de([50, 100, 200])), fr: String(de([50, 60, 100])), A: String(de([10, 20, 50])), N: String(de([50, 100, 200, 500])) };
    else if (modo === 'ampere') { const R = de([2, 4, 5]); sc = { modo, I: String(de([1, 2, 5])), R: String(R), r: String(de([R / 2, 2 * R, 3 * R])) }; }
    else sc = { modo, E0: String(de([1, 10, 50, 100])), fr: de(['1e6', '1e8', '9e8', '5e14']) };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const v = (k) => esc(sc[k]);
    if (sc.modo === 'campo') return `Un campo tiene E = (${v('Ex')}; ${v('Ey')}; ${v('Ez')}) V/m y B = (${v('Bx')}; ${v('By')}; ${v('Bz')}) T. ¿Cumple las cuatro ecuaciones de Maxwell? Si no, di cuál falla.`;
    if (sc.modo === 'gauss') return `Una esfera de radio ${v('R')} m tiene una carga Q = ${v('Q')} nC repartida uniformemente en su volumen. Con la ley de Gauss calcula el flujo del campo eléctrico y el campo E sobre una superficie esférica concéntrica de radio ${v('r')} m.`;
    if (sc.modo === 'gaussmag') return `Un cubo de lado ${v('L')} m está en un campo magnético uniforme B = (${v('Bx')}, ${v('By')}, ${v('Bz')}) T. Calcula el flujo por cada cara y el flujo total.`;
    if (sc.modo === 'faraday') return `Una bobina de ${v('N')} espiras de ${v('A')} cm² está en un campo B(t) = ${v('B0')}·sen(2π·${v('fr')}·t) mT perpendicular a ella. Calcula la amplitud del flujo, la fem máxima y la fem eficaz.`;
    if (sc.modo === 'ampere') return `Un condensador de placas circulares de radio ${v('R')} cm se carga con una corriente de ${v('I')} A. Calcula dE/dt entre las placas, la corriente de desplazamiento encerrada y el campo magnético a ${v('r')} cm del eje.`;
    return `Una onda plana en el vacío tiene E₀ = ${v('E0')} V/m y frecuencia ${v('fr')} Hz. Calcula c a partir de μ₀ y ε₀, B₀, la longitud de onda y la intensidad.`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const RES = {
    gauss: (s) => dato('Carga encerrada', `Q<sub>enc</sub> = <b>${f(s.Qint)} C</b>`) + dato('Flujo de E', `Φ<sub>E</sub> = <b>${f(s.Phi)} V·m</b>`) + dato('Campo en la superficie', `E = <b>${f(s.E)} V/m</b>`) + dato('Superficie', s.dentro ? 'dentro de la esfera' : 'fuera de la esfera'),
    gaussmag: (s) => dato('Flujo por la cara +x', `Φ = <b>${f(s.caras[0].v)} Wb</b>`) + dato('Flujo por la cara +y', `Φ = <b>${f(s.caras[2].v)} Wb</b>`) + dato('Flujo por la cara +z', `Φ = <b>${f(s.caras[4].v)} Wb</b>`) + dato('Flujo total', `Φ<sub>B</sub> = <b>${f(Math.abs(s.total) < 1e-12 ? 0 : s.total)} Wb</b>`),
    faraday: (s) => dato('Amplitud del flujo', `Φ<sub>0</sub> = <b>${f(s.Phi0)} Wb</b>`) + dato('Frecuencia angular', `ω = ${f(s.w)} rad/s`) + dato('Fem máxima', `ε<sub>máx</sub> = <b>${f(s.emax)} V</b>`) + dato('Fem eficaz', `ε<sub>ef</sub> = <b>${f(s.emax / Math.SQRT2)} V</b>`),
    ampere: (s) => dato('Variación del campo E', `dE/dt = <b>${f(s.dEdt)} V/(m·s)</b>`) + dato('Corriente de desplazamiento', `I<sub>d</sub> = <b>${f(s.Id)} A</b>`) + dato('Campo magnético', `B = <b>${f(s.B)} T</b>`) + dato('Punto', s.dentro ? 'entre las placas' : 'fuera de las placas'),
    onda: (s) => dato('Velocidad de la luz', `c = <b>${f(s.c)} m/s</b>`) + dato('Amplitud de B', `B<sub>0</sub> = <b>${f(s.B0)} T</b>`) + dato('Longitud de onda', `λ = <b>${f(s.lam)} m</b>`) + dato('Intensidad', `I = <b>${f(s.I)} W/m<sup>2</sup></b>`) + dato('Impedancia del vacío', `η = ${f(s.eta)} Ω`),
  };
  const SINO = (b) => (b ? '<b>sí</b>' : '<b>no</b>');
  RES.campo = (s) => s.eqs.map((q) => dato(q.n, `${q.f}: ${q.ok ? '✓ se cumple' : '✗ falla'} <small>(diferencia relativa ${f(q.rel)})</small>`)).join('') + dato('Campo electromagnético posible', s.conB ? SINO(s.ok) : 'falta B para decidirlo') + (s.eqs[0].ok ? '' : dato('ρ que haría falta', `ε₀∇·E = ${esc(s.eqs[0].extra.replace('ρ necesaria = ε₀∇·E = ', ''))} C/m³`));
  const LEYENDA = {
    campo: 'Diferencia relativa entre los dos miembros de cada ecuación (0 = se cumple; por encima de 10⁻⁶ falla).',
    gauss: 'Módulo del campo de la esfera cargada: crece dentro y cae como 1/r² fuera. La línea marca la superficie elegida.',
    gaussmag: 'Flujo de B por cada cara del cubo: cada una tiene su opuesta con el signo contrario, así que suman cero.',
    faraday: 'Dos periodos: el flujo Φ y la fem ε = −dΦ/dt, desfasados 90°.',
    ampere: 'Módulo de B según la distancia al eje: crece dentro de las placas y baja como 1/r fuera. La línea marca el punto elegido.',
    onda: 'E y B de la onda a lo largo de z: oscilan en fase y E₀ = c·B₀. Se dibujan relativos a su amplitud.',
  };
  function calcula() {
    const err = $('#error');
    try { sol = M.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    $('#res').innerHTML = RES[sol.modo](sol);
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = LEYENDA[sol.modo];
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--e', '--b']) col[k] = cs.getPropertyValue(k).trim(); }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const G = sol.grafica, ml = 64, mr = 14, mt = 14, mb = 34;
    g.font = '12px system-ui, sans-serif';
    const ejeY = (a, b, Y) => { g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle'; for (const y of marcas(a, b, 4)) { g.beginPath(); g.moveTo(ml, Y(y)); g.lineTo(w - mr, Y(y)); g.stroke(); g.fillText(txt(f(y, 3)), ml - 6, Y(y)); } };
    if (G.barras) {
      const vmax = Math.max(...G.barras.map((b) => Math.abs(b.v)), 1e-300) * 1.15, Y = (v) => mt + ((vmax - v) / (2 * vmax)) * (h - mt - mb), n = G.barras.length, ancho = (w - ml - mr) / n;
      ejeY(-vmax, vmax, Y);
      G.barras.forEach((b, i) => {
        const x = ml + i * ancho + ancho * 0.2;
        g.fillStyle = b.v >= 0 ? col['--e'] : col['--b']; g.fillRect(x, Math.min(Y(0), Y(b.v)), ancho * 0.6, Math.abs(Y(b.v) - Y(0)));
        g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(b.n, x + ancho * 0.3, h - mb + 8);
      });
      g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ml, Y(0)); g.lineTo(w - mr, Y(0)); g.stroke();
      return;
    }
    const pts = G.series.flatMap((s) => s.pts), x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
    let y0 = Math.min(...pts.map((p) => p[1]), 0), y1 = Math.max(...pts.map((p) => p[1]));
    const dy = (y1 - y0) * 0.08 || 1; if (y0 < 0) y0 -= dy; y1 += dy;
    const X = (x) => ml + ((x - x0) / (x1 - x0)) * (w - ml - mr), Y = (y) => h - mb - ((y - y0) / (y1 - y0)) * (h - mt - mb);
    ejeY(y0, y1, Y);
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const x of marcas(x0, x1, 5)) g.fillText(txt(f(x, 3)), X(x), h - mb + 6);
    g.textAlign = 'right'; g.fillText(G.xl, w - mr, h - 14);
    if (y0 < 0) { g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ml, Y(0)); g.lineTo(w - mr, Y(0)); g.stroke(); }
    if (G.marca !== undefined) { g.strokeStyle = col['--accent']; g.setLineDash([5, 4]); g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(G.marca), mt); g.lineTo(X(G.marca), h - mb); g.stroke(); g.setLineDash([]); }
    G.series.forEach((s, i) => {
      g.strokeStyle = col[s.c]; g.lineWidth = 2.4; g.setLineDash(s.d ? [7, 5] : []); g.beginPath(); s.pts.forEach(([x, y], j) => (j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); g.setLineDash([]);
      g.fillStyle = col[s.c]; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(txt(s.n), ml + 8, mt + 2 + i * 16);
    });
  }
  Herramienta.exportar('#grafica', { nombre: 'maxwell', titulo: 'Ecuaciones de Maxwell' });
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('maxwell').current;
  colores(); formulario(); calcula();
  window.MaxwellApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { ok: sol.ok, modo: sol.modo, Phi: sol.Phi, E: sol.E, B: sol.B, emax: sol.emax, total: sol.total, B0: sol.B0 }, estado: () => copia(sc) };
})();
