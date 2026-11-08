/* =====================================================================
   Método de las imágenes: interfaz (modo, datos de la carga y del conductor,
   punto opcional, resultados, desarrollo y dibujo con las líneas de campo,
   la carga inducida y las cargas imagen). El cálculo está en calculo.js
   (Imagenes) y los ayudantes comunes ($, esc, copia, lienzo) en herramienta.js.
   Guarda el estado entero (sc) en localStorage['imagenes-v1'] en cada cambio
   (lo que copia Mis ejercicios). Expone window.ImagenesApp para el modo
   práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const P = Imagenes, f = P.f, u = P.u, CLAVE = 'imagenes-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && P.MODOS[g.modo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  function formulario() {
    const M = P.MODOS[sc.modo];
    $('#campos').innerHTML = `<label for="f-modo">Conductor</label><select id="f-modo" class="in" data-k="modo">${Object.entries(P.MODOS).map(([k, m]) => `<option value="${k}"${sc.modo === k ? ' selected' : ''}>${m.nombre}</option>`).join('')}</select>`
      + M.campos.map(([k, nom, un]) => fila(k, nom, un)).join('')
      + (M.punto.length ? '<div class="sep">Punto donde calcular V y E (opcional)</div>' + M.punto.map(([k, nom, un]) => fila(k, nom, un)).join('') : '');
    $('#nota').textContent = M.plana ? ({ cuna: 'Un plano es φ = 0 y el otro φ = π/n; q está a la distancia r₀ de la arista y a φ₀ del primero. Con n = 1 es un solo plano.', paralelos: 'Los planos son z = 0 y z = L; q está en el eje a la altura d. El punto se da por ρ (distancia al eje) y z.', varias: 'El plano es z = 0; cada carga se da por su posición (x, z) con z > 0. Deja vacías las cargas 2 y 3 si no las necesitas.', dipolo: 'El dipolo está a la altura d del plano z = 0; θ es el ángulo entre p y la normal al plano (θ = 0: perpendicular). Se admite coma decimal y unidades.' })[sc.modo]
      : sc.modo === 'plano' ? 'El plano es z = 0 y q está en z = d. El punto se da por ρ (distancia al eje) y z (siempre mayor que 0).'
      : sc.modo === 'cavidad' ? 'El punto se da en polares desde el centro; θ se mide desde la recta del centro a q. El punto tiene que estar dentro de la cavidad.'
        : 'El punto se da en polares desde el centro; θ se mide desde la recta del centro a q. Tiene que estar fuera de la esfera. Se admite coma decimal y 3e8.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT' || !t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc.modo = t.value;
    // al cambiar de conductor, rellena lo que falte con los datos de su ejemplo
    const ej = P.ejemplos.find((x) => x.sc.modo === sc.modo);
    if (ej) for (const [k, v] of Object.entries(ej.sc)) if (k !== 'modo' && (sc[k] === undefined || sc[k] === '')) sc[k] = v;
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Modo práctica: un ejercicio al azar y su enunciado ---------- */
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const q = String(de([1, 2, 3, 5, 8, 10, -2, -5])), modo = de(Object.keys(P.MODOS));
    if (modo === 'plano') sc = { modo, q, d: String(ent(2, 10)), rho: String(ent(0, 8)), z: String(ent(1, 12)) };
    else {
      const R = ent(3, 10), cav = modo === 'cavidad', a = cav ? ent(1, R - 1) : R + ent(2, 3 * R);
      sc = { modo, q, a: String(a), R: String(R), r: String(cav ? c(ent(1, R * 10 - 1) / 10) : R + ent(1, 10)), th: String(de([0, 30, 60, 90, 120, 180])) };
      if (modo === 'esfera-aislada') sc.Q = String(de([0, 0, 5, -5, 10]));
      if (modo === 'esfera-potencial') sc.V0 = String(de([100, 200, 500, -300, 1000]));
    }
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const q = `${esc(sc.q)} nC`;
    if (sc.modo === 'cuna') return `Una carga puntual q = ${q} está a ${esc(sc.r0)} cm de la arista de dos planos conductores a tierra que forman un ángulo de 180°/${esc(sc.n)}, y a ${esc(sc.ph)}° de uno de ellos. Calcula las cargas imagen y la fuerza sobre q.`;
    if (sc.modo === 'paralelos') return `Una carga puntual q = ${q} está entre dos planos conductores paralelos a tierra separados ${esc(sc.L)} cm, a ${esc(sc.d)} cm del primero. Calcula la fuerza sobre q y la carga inducida en cada plano.`;
    if (sc.modo === 'varias') return `Frente a un plano conductor a tierra z = 0 hay cargas puntuales: q₁ = ${q} en (${esc(sc.x1)}; ${esc(sc.z1)}) cm${sc.q2 ? `, q₂ = ${esc(sc.q2)} nC en (${esc(sc.x2)}; ${esc(sc.z2)}) cm` : ''}${sc.q3 ? `, q₃ = ${esc(sc.q3)} nC en (${esc(sc.x3)}; ${esc(sc.z3)}) cm` : ''}. Calcula la fuerza sobre cada carga y la energía del sistema.`;
    if (sc.modo === 'dipolo') return `Un dipolo de momento p = ${esc(sc.p)} nC·cm está a ${esc(sc.d)} cm de un plano conductor a tierra, con p formando ${esc(sc.th)}° con la normal. Calcula la fuerza y el par sobre el dipolo.`;
    if (sc.modo === 'plano') return `Una carga puntual q = ${q} está a ${esc(sc.d)} cm de un plano conductor indefinido a tierra. Calcula la carga imagen, la fuerza sobre q, la densidad de carga inducida bajo ella y el trabajo para llevarla al infinito${sc.rho !== '' && sc.z !== '' ? `, y el potencial y el campo en el punto ρ = ${esc(sc.rho)} cm, z = ${esc(sc.z)} cm` : ''}.`;
    const pt = sc.r !== '' && sc.th !== '' ? `, y el potencial y el campo en el punto r = ${esc(sc.r)} cm, θ = ${esc(sc.th)}°` : '';
    if (sc.modo === 'cavidad') return `Una carga puntual q = ${q} está a ${esc(sc.a)} cm del centro de una cavidad esférica de ${esc(sc.R)} cm de radio en un conductor. Calcula la carga imagen y su posición, la fuerza sobre q y la densidad de carga inducida en el punto más cercano${pt}.`;
    const esfera = sc.modo === 'esfera-tierra' ? 'una esfera conductora a tierra' : sc.modo === 'esfera-aislada' ? `una esfera conductora aislada con carga Q = ${esc(sc.Q || '0')} nC` : `una esfera conductora mantenida a V₀ = ${esc(sc.V0 || '0')} V`;
    return `Una carga puntual q = ${q} está a ${esc(sc.a)} cm del centro de ${esfera} de radio ${esc(sc.R)} cm. Calcula las cargas imagen, la fuerza sobre q, la carga de la esfera y la densidad de carga inducida en el punto más cercano${sc.modo === 'esfera-tierra' ? ', el trabajo para llevar q al infinito' : ''}${pt}.`;
  };

  /* ---------- Cálculo y resultados ---------- */
  const caja = (n, v, extra) => `<div><span>${n}</span><b>${v}</b>${extra ? `<small>${extra}</small>` : ''}</div>`;
  const cm = (x) => `${f(x * 100)} cm`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const s = sol, im = s.imagenes[0];
    if (s.plana) {
      $('#resumen').innerHTML = s.cajas.map(([n, v, e]) => caja(n, v, e)).join('');
      $('#pasos').innerHTML = s.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
      $('#leyenda').textContent = 'Líneas de campo de las cargas reales con sus imágenes (dibujadas con trazo discontinuo, dentro del conductor). El conductor es la zona sombreada.';
      dibuja(); return;
    }
    let h = '';
    if (im) h += caja('Carga imagen q′', u(im.q, 'C'), s.esfera ? `a a′ = ${cm(im.z)} del centro` : `en z = −${cm(s.p.d)}`);
    else h += caja('Carga imagen q′', '—', 'q está en el centro');
    if (s.q2 !== 0) h += caja('Segunda imagen q″', u(s.q2, 'C'), 'en el centro de la esfera');
    h += caja('Fuerza sobre q', u(s.Fmod, 'N'), s.Fmod === 0 ? 'nula' : s.atractiva ? `atractiva, hacia ${s.cav ? 'la pared' : s.esfera ? 'la esfera' : 'el plano'}` : 'repulsiva, se aleja de la esfera');
    if (s.modo === 'plano') h += caja('Carga inducida total', u(-s.q, 'C'), 'igual y opuesta a q');
    else if (s.cav) h += caja('Carga inducida en la pared', u(-s.q, 'C'), 'igual y opuesta a q');
    else h += caja('Carga total de la esfera', u(s.Qe, 'C'), s.modo === 'esfera-tierra' ? 'la de la imagen' : s.modo === 'esfera-aislada' ? 'la que se le dio' : 'fijada por V₀');
    if (!s.cav && s.modo !== 'plano') h += caja('Potencial de la esfera', u(s.V0, 'V'), s.modo === 'esfera-tierra' ? 'a tierra' : 'toda ella equipotencial');
    h += caja(s.modo === 'plano' ? 'σ máxima (bajo q)' : 'σ en el punto más cercano', `${f(s.sigmaMax)} C/m²`, s.modo === 'plano' ? 'en ρ = 0' : 'en θ = 0');
    if (s.W !== null) h += caja('Trabajo hasta el infinito', u(s.W, 'J'), 'para alejar q del conductor');
    if (s.pt) {
      h += caja('V en el punto', u(s.pt.V, 'V'), s.esfera ? `r = ${cm(s.pt.r)}, θ = ${f((s.pt.th * 180) / Math.PI)}°` : `ρ = ${cm(s.pt.rho)}, z = ${cm(s.pt.z)}`);
      h += caja('|E| en el punto', u(s.pt.E, 'V/m'), `E<sub>z</sub> = ${u(s.pt.Ez, 'V/m', 3)}, E<sub>ρ</sub> = ${u(s.pt.Er, 'V/m', 3)}`);
      h += caja('σ bajo el punto', `${f(s.pt.sigma)} C/m²`, 'carga inducida por unidad de superficie');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = s.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Líneas de campo de q con sus imágenes (dibujadas con trazo discontinuo, dentro del conductor). El grosor del trazo sobre el conductor indica la carga inducida.';
    dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--pos', '--neg', '--metal', '--campo']) col[k] = cs.getPropertyValue(k).trim(); }
  const texto = (g, t, x, y, c = col['--muted'], al = 'center') => { g.fillStyle = c; g.textAlign = al; g.fillText(t, x, y); };
  function dibuja() {
    const { g, w, h } = lienzo('#dibujo');
    if (!sol || !w || !h) return;
    colores();
    if (sol.plana) { dibujaPlana(g, w, h); return; }
    const s = sol, pl = !s.esfera, R = s.R, big = s.imagenes.length && s.imagenes[0].z;
    // caja del mundo: horizontal [H0, H1], vertical [V0, V1] con la vertical hacia arriba
    let H0, H1, V0, V1;
    if (pl) { const d = s.p.d, ext = Math.max(2.6 * d, s.pt ? Math.abs(s.pt.rho) * 1.25 : 0); H0 = -ext; H1 = ext; V0 = -1.1 * d; V1 = Math.max(2.4 * d, s.pt ? s.pt.z * 1.2 : 0); }
    else if (s.cav) { const e = 1.25 * R; H0 = -e; H1 = big && big < 2.2 * R ? Math.max(e, big * 1.2) : e; V0 = -e; V1 = e; }
    else { H0 = -1.5 * R; H1 = Math.max(1.25 * s.p.a, s.pt ? s.pt.z * 1.1 : 0); V1 = Math.max(1.5 * R, s.pt ? Math.abs(s.pt.rho) * 1.2 : 0, 0.28 * (H1 - H0)); V0 = -V1; }
    const m = 14, k = Math.min((w - 2 * m) / (H1 - H0), (h - 2 * m) / (V1 - V0)), ox = (w - k * (H1 - H0)) / 2, oy = (h - k * (V1 - V0)) / 2;
    // (z, ρ) del problema → píxeles: en el plano z va hacia arriba; en la esfera, hacia la derecha
    const X = (z, r) => (pl ? ox + (r - H0) * k : ox + (z - H0) * k), Y = (z, r) => (pl ? h - oy - (z - V0) * k : h - oy - (r - V0) * k);
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    // conductor
    g.fillStyle = col['--metal'];
    if (pl) g.fillRect(X(0, H0), Y(0, 0), (H1 - H0) * k, (0 - V0) * k);
    else {
      g.beginPath();
      if (s.cav) { g.rect(0, 0, w, h); g.arc(X(0, 0), Y(0, 0), R * k, 0, 2 * Math.PI, true); g.fill('evenodd'); }
      else { g.arc(X(0, 0), Y(0, 0), R * k, 0, 2 * Math.PI); g.fill(); }
    }
    // carga inducida: trazo más grueso donde hay más
    const cabe = (x) => Math.abs(x) / Math.max(Math.abs(s.sigmaMax), 1e-300);
    g.lineCap = 'butt';
    if (pl) {
      const n = Math.max(40, Math.floor(((H1 - H0) * k) / 4));
      for (let i = 0; i < n; i++) { const r0 = H0 + ((H1 - H0) * i) / n, r1 = H0 + ((H1 - H0) * (i + 1)) / n, v = Math.min(1, cabe(s.sigma((r0 + r1) / 2))); g.strokeStyle = s.q > 0 ? col['--neg'] : col['--pos']; g.lineWidth = 1 + 9 * v; g.beginPath(); g.moveTo(X(0, r0), Y(0, 0) + 1 + g.lineWidth / 2); g.lineTo(X(0, r1) + 0.5, Y(0, 0) + 1 + g.lineWidth / 2); g.stroke(); }
    } else {
      const n = 120, ancho = Math.max(...Array.from({ length: 13 }, (_, i) => Math.abs(s.sigma((Math.PI * i) / 12))), 1e-300);
      for (let i = 0; i < n; i++) {
        const a0 = (2 * Math.PI * i) / n, a1 = (2 * Math.PI * (i + 1)) / n, th = Math.abs(((a0 + a1) / 2 + Math.PI) % (2 * Math.PI) - Math.PI), sg = s.sigma(th), v = Math.min(1, Math.abs(sg) / ancho);
        const rad = R * k + (s.cav ? -1 : 1) * (2 + (1 + 9 * v) / 2);
        g.strokeStyle = sg < 0 ? col['--neg'] : col['--pos']; g.lineWidth = 1 + 9 * v;
        g.beginPath(); g.arc(X(0, 0), Y(0, 0), rad, -a1, -a0 + 0.01); g.stroke();
      }
    }
    g.lineWidth = 1.4; g.strokeStyle = col['--ink'];
    if (pl) { g.beginPath(); g.moveTo(X(0, H0), Y(0, 0)); g.lineTo(X(0, H1), Y(0, 0)); g.stroke(); }
    else { g.beginPath(); g.arc(X(0, 0), Y(0, 0), R * k, 0, 2 * Math.PI); g.stroke(); }
    // líneas de campo: salen de q en todas direcciones y se siguen con el campo de q y sus imágenes
    const L = pl ? s.p.d : s.cav ? R : s.p.a, ds = L / 70, sg = Math.sign(s.q) || 1;
    const dentro = (z, r) => (pl ? z <= 0 : s.cav ? Math.hypot(z, r) >= R : Math.hypot(z, r) <= R);
    const fuera = (z, r) => { const hx = pl ? r : z, vy = pl ? z : r; return hx < H0 - 0.05 * (H1 - H0) || hx > H1 + 0.05 * (H1 - H0) || vy < V0 - 0.05 * (V1 - V0) || vy > V1 + 0.05 * (V1 - V0); };
    const dir = (z, r) => { const c = P.campo(s.cargas, z, r); return [(sg * c.Ez) / (c.E || 1), (sg * c.Er) / (c.E || 1)]; };
    g.lineWidth = 1.2; g.strokeStyle = col['--campo']; g.fillStyle = col['--campo'];
    const N = 18;
    for (let i = 0; i < N; i++) {
      const ang = (2 * Math.PI * (i + 0.5)) / N; let z = s.pos + 0.04 * L * Math.cos(ang), r = 0.04 * L * Math.sin(ang);
      const pts = [[z, r]];
      for (let j = 0; j < 1600; j++) {
        const [a1, b1] = dir(z, r), [a2, b2] = dir(z + (a1 * ds) / 2, r + (b1 * ds) / 2);
        z += a2 * ds; r += b2 * ds; pts.push([z, r]);
        if (dentro(z, r) || fuera(z, r)) break;
      }
      g.beginPath(); pts.forEach(([zz, rr], j) => (j ? g.lineTo(X(zz, rr), Y(zz, rr)) : g.moveTo(X(zz, rr), Y(zz, rr)))); g.stroke();
      // una flecha hacia donde apunta E, hacia la mitad de la línea
      const j = Math.floor(pts.length * 0.45);
      if (j > 1 && j < pts.length - 1) {
        const [z0, r0] = pts[j - 1], [z1, r1] = pts[j + 1], an = Math.atan2(Y(z1, r1) - Y(z0, r0), X(z1, r1) - X(z0, r0)) + (sg < 0 ? Math.PI : 0), [zc, rc] = pts[j], x = X(zc, rc), y = Y(zc, rc);
        g.beginPath(); g.moveTo(x + 5 * Math.cos(an), y + 5 * Math.sin(an)); g.lineTo(x - 4 * Math.cos(an - 0.55), y - 4 * Math.sin(an - 0.55)); g.lineTo(x - 4 * Math.cos(an + 0.55), y - 4 * Math.sin(an + 0.55)); g.closePath(); g.fill();
      }
    }
    // cargas: la real, llena; las imágenes, con trazo discontinuo
    const disco = (z, r, c, real, nom, alto = false) => {
      const x = X(z, r), y = Y(z, r);
      g.beginPath(); g.arc(x, y, 8, 0, 2 * Math.PI);
      if (real) { g.fillStyle = c; g.fill(); } else { g.fillStyle = col['--panel']; g.fill(); g.setLineDash([3, 3]); g.strokeStyle = c; g.lineWidth = 1.8; g.stroke(); g.setLineDash([]); }
      texto(g, c === col['--pos'] ? '+' : '−', x, y + 0.5, real ? '#fff' : c);
      texto(g, nom, x + (pl ? 16 : 0), y + (pl ? 0 : alto ? 17 : -16), col['--ink'], pl ? 'left' : 'center');
    };
    const signo = (q) => (q > 0 ? col['--pos'] : col['--neg']);
    for (const c of s.cargas) { if (!c.real && fuera(c.z, 0)) continue; disco(c.z, 0, signo(c.q), !!c.real, c.real ? 'q' : c.nom || '', c.nom === 'q″'); }
    // cotas
    g.lineWidth = 1; g.strokeStyle = col['--muted']; g.setLineDash([2, 3]);
    if (pl) { const x = X(0, -0.6 * s.p.d - 0.001); g.beginPath(); g.moveTo(x, Y(0, 0)); g.lineTo(x, Y(s.p.d, 0)); g.stroke(); g.setLineDash([]); texto(g, `d = ${cm(s.p.d)}`, x - 6, (Y(0, 0) + Y(s.p.d, 0)) / 2, col['--muted'], 'right'); }
    else { g.beginPath(); g.moveTo(X(0, 0), Y(0, 0)); g.lineTo(X(s.pos, 0), Y(0, 0)); g.stroke(); g.setLineDash([]); texto(g, `a = ${cm(s.pos)}`, (X(0, 0) + X(s.pos, 0)) / 2, Y(0, 0) - 12 + (s.cav ? 24 : 0)); texto(g, `R = ${cm(R)}`, X(0, 0), Y(0, 0) + R * k * 0.6, col['--muted']); }
    g.setLineDash([]);
    // punto de observación y su campo
    if (s.pt) {
      const x = X(s.pt.z, s.pt.rho), y = Y(s.pt.z, s.pt.rho);
      g.fillStyle = col['--accent']; g.strokeStyle = col['--accent']; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, 4, 0, 2 * Math.PI); g.fill();
      const vx = pl ? s.pt.Er : s.pt.Ez, vy = pl ? s.pt.Ez : s.pt.Er, m0 = Math.hypot(vx, vy) || 1, lon = 38, x2 = x + (vx / m0) * lon, y2 = y - (vy / m0) * lon, an = Math.atan2(y2 - y, x2 - x);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 7 * Math.cos(an - 0.45), y2 - 7 * Math.sin(an - 0.45)); g.lineTo(x2 - 7 * Math.cos(an + 0.45), y2 - 7 * Math.sin(an + 0.45)); g.closePath(); g.fill();
      texto(g, 'E', x2 + 8 * Math.cos(an) + 4, y2 + 8 * Math.sin(an), col['--accent'], 'left');
    }
  }

  /* ---------- Dibujo de los modos planos (cuña, planos paralelos, varias cargas y dipolo): corte x-z ---------- */
  function dibujaPlana(g, w, h) {
    const s = sol, cg = s.cargas, m = 14, M = s.modo, lim = s.lim;
    let H0, H1, V0, V1;
    if (M === 'cuna') { const xs = cg.map((c) => c.x).concat(0), zs = cg.map((c) => c.z).concat(0); H0 = Math.min(...xs); H1 = Math.max(...xs); V0 = Math.min(...zs); V1 = Math.max(...zs); const pd = 0.25 * Math.max(H1 - H0, V1 - V0); H0 -= pd; H1 += pd; V0 -= pd; V1 += pd; }
    else if (M === 'paralelos') { H0 = -0.9 * lim; H1 = 0.9 * lim; V0 = -0.55 * lim; V1 = 1.55 * lim; }
    else if (M === 'varias') { const xs = cg.map((c) => c.x); H0 = Math.min(...xs) - lim; H1 = Math.max(...xs) + lim; V0 = -1.3 * lim; V1 = 1.3 * lim; }
    else { H0 = -1.8 * lim; H1 = 1.8 * lim; V0 = -1.5 * lim; V1 = 1.7 * lim; }
    const k = Math.min((w - 2 * m) / (H1 - H0), (h - 2 * m) / (V1 - V0)), ox = (w - k * (H1 - H0)) / 2, oy = (h - k * (V1 - V0)) / 2;
    const X = (x) => ox + (x - H0) * k, Y = (z) => h - oy - (z - V0) * k, big = 20 * Math.max(H1 - H0, V1 - V0);
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    // conductor
    g.fillStyle = col['--metal']; g.strokeStyle = col['--ink']; g.lineWidth = 1.4;
    if (M === 'cuna') {
      g.beginPath(); g.rect(0, 0, w, h); g.moveTo(X(0), Y(0)); g.lineTo(X(big), Y(0));
      for (let i = 0; i <= 24; i++) { const an = (s.alfa * i) / 24; g.lineTo(X(big * Math.cos(an)), Y(big * Math.sin(an))); }
      g.closePath(); g.fill('evenodd');
      g.beginPath(); g.moveTo(X(big), Y(0)); g.lineTo(X(0), Y(0)); g.lineTo(X(big * Math.cos(s.alfa)), Y(big * Math.sin(s.alfa))); g.stroke();
    } else {
      const planos = M === 'paralelos' ? [0, s.L] : [0];
      g.fillRect(0, Y(0), w, h - Y(0)); if (M === 'paralelos') g.fillRect(0, 0, w, Y(s.L));
      for (const z of planos) { g.beginPath(); g.moveTo(0, Y(z)); g.lineTo(w, Y(z)); g.stroke(); }
    }
    const dentro = (x, z) => (M === 'cuna' ? Math.atan2(z, x) >= 0 && Math.atan2(z, x) <= s.alfa : M === 'paralelos' ? z > 0 && z < s.L : z > 0);
    const fuera = (x, z) => x < H0 - 0.05 * (H1 - H0) || x > H1 + 0.05 * (H1 - H0) || z < V0 - 0.05 * (V1 - V0) || z > V1 + 0.05 * (V1 - V0);
    // líneas de campo desde cada carga real, hasta una de signo contrario
    const ds = lim / 60, N = 14; g.lineWidth = 1.2; g.strokeStyle = col['--campo']; g.fillStyle = col['--campo'];
    for (const c of cg.filter((q) => q.real)) {
      const sg = Math.sign(c.q) || 1, dir = (x, z) => { const e = P.campoXZ(cg, x, z); return [(sg * e.Ex) / (e.E || 1), (sg * e.Ez) / (e.E || 1)]; };
      for (let i = 0; i < N; i++) {
        const ang = (2 * Math.PI * (i + 0.5)) / N; let x = c.x + 0.04 * lim * Math.cos(ang), z = c.z + 0.04 * lim * Math.sin(ang);
        if (!dentro(x, z)) continue;
        const pts = [[x, z]];
        for (let j = 0; j < 2500; j++) {
          const [a1, b1] = dir(x, z), [a2, b2] = dir(x + (a1 * ds) / 2, z + (b1 * ds) / 2);
          x += a2 * ds; z += b2 * ds; pts.push([x, z]);
          if (!dentro(x, z) || fuera(x, z) || cg.some((o) => o.real && Math.sign(o.q) === -sg && Math.hypot(x - o.x, z - o.z) < 2.2 * ds)) break;
        }
        g.beginPath(); pts.forEach(([xx, zz], j) => (j ? g.lineTo(X(xx), Y(zz)) : g.moveTo(X(xx), Y(zz)))); g.stroke();
        const j = Math.floor(pts.length * 0.45);
        if (j > 1 && j < pts.length - 1) {
          const [x0, z0] = pts[j - 1], [x1, z1] = pts[j + 1], an = Math.atan2(Y(z1) - Y(z0), X(x1) - X(x0)), [xc, zc] = pts[j], px = X(xc), py = Y(zc);
          g.beginPath(); g.moveTo(px + 5 * Math.cos(an), py + 5 * Math.sin(an)); g.lineTo(px - 4 * Math.cos(an - 0.55), py - 4 * Math.sin(an - 0.55)); g.lineTo(px - 4 * Math.cos(an + 0.55), py - 4 * Math.sin(an + 0.55)); g.closePath(); g.fill();
        }
      }
    }
    // cargas: reales llenas; imágenes con trazo discontinuo
    for (const c of cg) {
      const x = X(c.x), y = Y(c.z); if (x < 0 || x > w || y < 0 || y > h) continue;
      const col1 = c.q > 0 ? col['--pos'] : col['--neg'];
      g.beginPath(); g.arc(x, y, M === 'dipolo' ? 6 : 8, 0, 2 * Math.PI);
      if (c.real) { g.fillStyle = col1; g.fill(); } else { g.fillStyle = col['--panel']; g.fill(); g.setLineDash([3, 3]); g.strokeStyle = col1; g.lineWidth = 1.8; g.stroke(); g.setLineDash([]); }
      texto(g, c.q > 0 ? '+' : '−', x, y + 0.5, c.real ? '#fff' : col1);
      if (cg.length <= 8 || c.real) texto(g, c.nom || '', x + 14, y - 12, col['--ink'], 'left');
    }
    // punto de observación
    if (s.pt) {
      const x = X(s.pt.x), y = Y(s.pt.z), m0 = Math.hypot(s.pt.Ex, s.pt.Ez) || 1, x2 = x + (s.pt.Ex / m0) * 38, y2 = y - (s.pt.Ez / m0) * 38, an = Math.atan2(y2 - y, x2 - x);
      g.fillStyle = col['--accent']; g.strokeStyle = col['--accent']; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 4, 0, 2 * Math.PI); g.fill();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 7 * Math.cos(an - 0.45), y2 - 7 * Math.sin(an - 0.45)); g.lineTo(x2 - 7 * Math.cos(an + 0.45), y2 - 7 * Math.sin(an + 0.45)); g.closePath(); g.fill();
      texto(g, 'E', x2 + 8 * Math.cos(an) + 4, y2 + 8 * Math.sin(an), col['--accent'], 'left');
    }
    if (M === 'cuna') texto(g, `α = ${f((s.alfa * 180) / Math.PI)}°`, X(0) + 34, Y(0) - 12, col['--muted']);
    if (M === 'paralelos') texto(g, `L = ${cm(s.L)}`, X(H1 - 0.12 * (H1 - H0)), (Y(0) + Y(s.L)) / 2, col['--muted']);
  }
  Herramienta.exportar('#dibujo', { nombre: 'imagenes', titulo: 'Cargas imagen y líneas de campo' });
  window.addEventListener('resize', dibuja);
  // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('imagenes').current;
  formulario(); calcula();
  window.ImagenesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, F: sol.Fz, qi: sol.imagenes[0]?.q, Q: sol.Qe, V0: sol.V0 }, estado: () => copia(sc) };
})();
