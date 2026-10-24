/* =====================================================================
   pH y valoraciones: interfaz (modo, datos, resultados, vaso con las
   partículas y el color del indicador universal, la bureta y la curva de
   valoración, y desarrollo). El cálculo está en ph/calculo.js (PH).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const P = PH, f = P.f, f2 = P.f2, CLAVE = 'ph-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['fuerte', 'Ácido o base fuerte'], ['debil', 'Ácido o base débil'], ['tampon', 'Disolución reguladora (tampón)'], ['mezcla', 'Mezcla de ácido y base fuertes'], ['valoracion', 'Valoración']];

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const especie = elige.bind(null, 'especie', 'Qué es');
  const NOTAS = {
    fuerte: 'Pon 2 en H⁺ u OH⁻ por fórmula para H₂SO₄ (tomando las dos disociaciones completas) o Ba(OH)₂. Se admite 1e-8 o 1·10^-8.',
    debil: 'Escribe la constante o su pK, una de las dos. Para una base, Kb (amoniaco 1,8·10^-5).',
    tampon: 'La constante es la del ácido débil (HA/A⁻) o la de la base débil (B/BH⁺). Para ver cómo amortigua, añade un ácido o una base fuerte.',
    mezcla: 'Ácido fuerte monoprótico y base fuerte con un OH⁻; para otros, multiplica la concentración por los H⁺ u OH⁻ que dan.',
    valoracion: 'La gráfica es la curva de valoración. El volumen añadido es opcional: con él se calcula el pH en ese punto.',
  };
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    const kk = (b) => fila('K', b ? 'Constante Kb' : 'Constante Ka') + fila('pK', b ? 'o bien pKb' : 'o bien pKa');
    if (sc.modo === 'fuerte') {
      h += especie([['acido', 'Un ácido fuerte'], ['base', 'Una base fuerte']]) + fila('C', 'Concentración', 'mol/L') + fila('n', sc.especie === 'base' ? 'OH⁻ por fórmula' : 'H⁺ por fórmula');
    } else if (sc.modo === 'debil') {
      h += especie([['acido', 'Un ácido débil'], ['base', 'Una base débil']]) + fila('C', 'Concentración inicial', 'mol/L') + kk(sc.especie === 'base');
    } else if (sc.modo === 'tampon') {
      const b = sc.especie === 'base';
      h += especie([['acido', 'Ácido débil y su sal (HA/A⁻)'], ['base', 'Base débil y su sal (B/BH⁺)']]) + kk(b) + fila('Cd', b ? 'Concentración de la base [B]' : 'Concentración del ácido [HA]', 'mol/L') + fila('Cs', b ? 'Concentración de la sal [BH⁺]' : 'Concentración de la sal [A⁻]', 'mol/L');
      h += sep('Añadir') + elige('anade', 'Se añade', [['nada', 'Nada'], ['acido', 'Un ácido fuerte'], ['base', 'Una base fuerte']]);
      if (sc.anade === 'acido' || sc.anade === 'base') h += fila('V', 'Volumen del tampón', 'mL') + fila('Cad', 'Concentración de lo añadido', 'mol/L') + fila('Vad', 'Volumen añadido', 'mL');
    } else if (sc.modo === 'mezcla') {
      h += fila('Ca', 'Concentración del ácido', 'mol/L') + fila('Va', 'Volumen del ácido', 'mL') + fila('Cb', 'Concentración de la base', 'mol/L') + fila('Vb', 'Volumen de la base', 'mL');
    } else {
      h += elige('tipo', 'Qué se valora', [['af-bf', 'Ácido fuerte con base fuerte'], ['ad-bf', 'Ácido débil con base fuerte'], ['bf-af', 'Base fuerte con ácido fuerte'], ['bd-af', 'Base débil con ácido fuerte']]);
      const debil = sc.tipo === 'ad-bf' || sc.tipo === 'bd-af', b = sc.tipo === 'bf-af' || sc.tipo === 'bd-af';
      h += fila('C', `Concentración ${b ? 'de la base' : 'del ácido'}`, 'mol/L') + fila('V', 'Volumen que se valora', 'mL') + fila('Ct', 'Concentración del valorante', 'mol/L') + (debil ? kk(b) : '') + sep('Opcional') + fila('Vt', 'Volumen de valorante añadido', 'mL');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';
  $('#campos').addEventListener('input', (e) => {
    const t = e.target; if (t.tagName !== 'INPUT') return;
    sc[t.dataset.k] = t.value;
    // K y pK son la misma información: al escribir una se vacía la otra
    if ((t.dataset.k === 'K' || t.dataset.k === 'pK') && t.value.trim()) { const o = t.dataset.k === 'K' ? 'pK' : 'K'; sc[o] = ''; const el = $(`#f-${o}`); if (el) el.value = ''; }
    $('#ejemplos').value = ''; calcula();
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(P.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { const ej = P.ejemplos.find((x) => x.sc.modo === sc.modo && x.sc[t.dataset.k] === t.value); if (ej) for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; if (t.dataset.k === 'tipo' && vacioC(sc.K) && vacioC(sc.pK)) sc.K = '1.8e-5'; if (t.dataset.k === 'anade' && vacioC(sc.V)) Object.assign(sc, { V: '100', Cad: '0.1', Vad: '10' }); }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#grafica').hidden = true;
      dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = 'El color es el que tomaría el indicador universal. En rojo los H₃O⁺ y en azul los OH⁻ (no a escala: cada unidad de pH es diez veces más).';
    if (sol.modo === 'fuerte') h = dato('pH', `pH = ${f2(sol.pH)}`) + dato('pOH', `pOH = ${f2(14 - sol.pH)}`) + dato('[H₃O⁺]', `${f(sol.h)} M`);
    else if (sol.modo === 'debil') { h = dato('pH', `pH = ${f2(sol.pH)}`) + dato(sol.base ? '[OH⁻]' : '[H₃O⁺]', `${f(sol.x)} M`) + dato('Grado de disociación', `α = ${f(100 * sol.alfa)} %`); ley += sol.base ? ' En gris las moléculas de B sin reaccionar y en verde los BH⁺.' : ' En gris las moléculas de HA sin disociar y en verde los A⁻.'; }
    else if (sol.modo === 'tampon') { h = dato('pH del tampón', `pH = ${f2(sol.pH0)}`) + (sol.anade !== 'nada' ? dato('Tras añadir', `pH = ${f2(sol.pH)}`) + dato('En agua pura sería', `pH = ${f2(sol.pHagua)}`) : '') + dato('pKa del par', `pK<sub>a</sub> = ${f2(sol.pKa)}`); ley += ' En gris la forma ácida del par y en verde la básica.'; }
    else if (sol.modo === 'mezcla') h = dato('pH', `pH = ${f2(sol.pH)}`) + dato('Moles de ácido', `${f(sol.na)} mol`) + dato('Moles de base', `${f(sol.nb)} mol`);
    else {
      h = dato('Volumen de equivalencia', `V<sub>eq</sub> = ${f(sol.Veq)} mL`) + dato('pH en la equivalencia', `pH = ${f2(sol.pHeq)}`) + (sol.debilV ? dato('A mitad', `pH = pK<sub>a</sub> = ${f2(sol.pKa)}`) : '') + dato('Indicador', sol.ind[0]) + (sol.pHv !== null ? dato(`Con ${txt(f(sol.v))} mL`, `pH = ${f2(sol.pHv)}`) : '');
      ley = `Se va añadiendo ${sol.nomT} con la bureta y el ${sol.ind[0]} cambia de color al llegar a la equivalencia. La curva es la exacta; el punto naranja es el volumen que has pedido.`;
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#grafica').hidden = sol.modo !== 'valoracion';
    tA = 0; particulas(); dibuja(); grafica();
  }

  /* ---------- Colores ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--suelo', '--cuerpo', '--panel', '--tension']) col[k] = cs.getPropertyValue(k).trim(); }
  // indicador universal: rojo, naranja, amarillo, verde, azul, violeta
  const UNIV = [[0, [214, 40, 40]], [3, [240, 130, 40]], [5, [242, 200, 50]], [7, [70, 170, 70]], [9, [40, 110, 200]], [11, [70, 60, 170]], [14, [120, 40, 140]]];
  const mezclaRGB = (a, b, s) => a.map((x, i) => Math.round(x + (b[i] - x) * s));
  function universal(pH) {
    const p = Math.max(0, Math.min(14, pH));
    for (let i = 1; i < UNIV.length; i++) if (p <= UNIV[i][0]) { const [p0, c0] = UNIV[i - 1], [p1, c1] = UNIV[i]; return mezclaRGB(c0, c1, (p - p0) / (p1 - p0)); }
    return UNIV[UNIV.length - 1][1];
  }
  const NOMBRES = { rojo: [214, 50, 40], amarillo: [240, 200, 50], azul: [40, 100, 210], rosa: [224, 80, 156], incoloro: null };
  // color del indicador de la valoración a ese pH (incoloro = el del agua)
  function deIndicador(ind, pH, agua) {
    const a = NOMBRES[ind[3]] || agua, b = NOMBRES[ind[4]] || agua, s = Math.max(0, Math.min(1, (pH - ind[1]) / (ind[2] - ind[1])));
    return mezclaRGB(a, b, s);
  }
  const rgba = (c, al = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${al})`;
  const hexRGB = (h) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(h || ''); return m ? [1, 2, 3].map((i) => parseInt(m[i], 16)) : [200, 220, 240]; };

  /* ---------- Animación ---------- */
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  let tA = 0, parts = [];
  // partículas del vaso (posiciones en 0..1 dentro del líquido)
  function particulas() {
    parts = [];
    if (!sol || sol.modo === 'valoracion') return;
    const pH = sol.modo === 'tampon' ? sol.pH : sol.pH, nH = Math.round(Math.max(0, Math.min(26, (7 - pH) * 3.5))) || (pH < 7 ? 1 : 0), nOH = Math.round(Math.max(0, Math.min(26, (pH - 7) * 3.5))) || (pH > 7 ? 1 : 0);
    const add = (n, tipo) => { for (let i = 0; i < n; i++) parts.push({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, tipo }); };
    add(nH || (pH >= 6.99 && pH <= 7.01 ? 1 : 0), 'H'); add(nOH || (pH >= 6.99 && pH <= 7.01 ? 1 : 0), 'OH');
    if (sol.modo === 'debil' || sol.modo === 'tampon') {
      // fracción en forma básica del par
      const fb = sol.modo === 'debil' ? sol.alfa : 1 / (1 + 10 ** (sol.pKa - sol.pH)), tot = 26, nb = sol.modo === 'debil' ? Math.max(1, Math.round(tot * fb)) : Math.round(tot * fb);
      add(tot - nb, sol.base && sol.modo === 'debil' ? 'B' : 'HA'); add(nb, sol.base && sol.modo === 'debil' ? 'BH' : 'A');
    }
  }
  function mueve(dt) {
    for (const q of parts) {
      q.vx += (Math.random() - 0.5) * dt * 0.8; q.vy += (Math.random() - 0.5) * dt * 0.8;
      const v = Math.hypot(q.vx, q.vy); if (v > 0.3) { q.vx *= 0.3 / v; q.vy *= 0.3 / v; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.x < 0 || q.x > 1) { q.vx = -q.vx; q.x = Math.max(0, Math.min(1, q.x)); }
      if (q.y < 0 || q.y > 1) { q.vy = -q.vy; q.y = Math.max(0, Math.min(1, q.y)); }
    }
  }
  // volumen añadido en la animación de la valoración: de 0 a 2·Veq y una pausa
  const vAnim = (t) => { const ciclo = 11, s = (t % ciclo) / 9.5; return Math.min(1, s) * 2 * sol.Veq; };

  function lienzo(c) {
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    return { g, w, h };
  }
  function dibuja() {
    const L = lienzo($('#escena'));
    if (!L || !sol) return;
    const { g, w, h } = L;
    if (!col['--ink']) colores();
    const agua = hexRGB(col['--bg'] === '#11151b' ? '#2b4f7e' : '#cfe3f7');
    if (sol.modo !== 'valoracion') {
      // vaso con el indicador universal
      const bw = Math.min(w * 0.42, 300), bx = w * 0.12, by = h * 0.12, bh = h * 0.6, ySup = by + bh * 0.18;
      g.fillStyle = rgba(universal(sol.pH), 0.55); g.fillRect(bx, ySup, bw, by + bh - ySup);
      g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 4, by); g.lineTo(bx, by + bh); g.lineTo(bx + bw, by + bh); g.lineTo(bx + bw + 4, by); g.stroke();
      const COL = { H: col['--peso'], OH: col['--tension'], HA: col['--suelo'], B: col['--suelo'], A: col['--normal'], BH: col['--normal'] };
      const ETQ = { H: 'H₃O⁺', OH: 'OH⁻', HA: 'HA', A: 'A⁻', B: 'B', BH: 'BH⁺' };
      for (const q of parts) {
        const x = bx + 10 + q.x * (bw - 20), y = ySup + 10 + q.y * (by + bh - ySup - 20);
        if (q.tipo === 'HA' || q.tipo === 'B') { punto(g, x - 4, y, 5, COL[q.tipo]); punto(g, x + 4, y, 4, COL[q.tipo]); } else punto(g, x, y, q.tipo === 'H' || q.tipo === 'OH' ? 4.5 : 5, COL[q.tipo]);
      }
      // leyenda de las partículas
      const tipos = [...new Set(parts.map((q) => q.tipo))];
      tipos.forEach((t, i) => { punto(g, bx + bw + 30, by + 20 + i * 20, 5, COL[t]); texto(g, bx + bw + 42, by + 20 + i * 20, ETQ[t], col['--ink'], 'left'); });
      // escala de pH
      const sx = 20, sw = w - 40, sy = h - 34;
      for (let i = 0; i < sw; i++) { g.fillStyle = rgba(universal((14 * i) / sw)); g.fillRect(sx + i, sy, 1.5, 12); }
      for (let p = 0; p <= 14; p += 2) texto(g, sx + (sw * p) / 14, sy + 22, String(p), col['--muted']);
      const xm = sx + (sw * Math.max(0, Math.min(14, sol.pH))) / 14;
      g.fillStyle = col['--ink']; g.beginPath(); g.moveTo(xm, sy - 2); g.lineTo(xm - 6, sy - 12); g.lineTo(xm + 6, sy - 12); g.closePath(); g.fill();
      texto(g, xm, sy - 20, `pH ${txt(f2(sol.pH))}`, col['--ink'], 'center', '600 ');
      if (sol.modo === 'tampon' && sol.anade !== 'nada') {
        const x0 = sx + (sw * sol.pH0) / 14, xa = sx + (sw * sol.pHagua) / 14;
        g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x0, sy - 4); g.lineTo(x0, sy + 14); g.moveTo(xa, sy - 4); g.lineTo(xa, sy + 14); g.stroke(); g.setLineDash([]);
        texto(g, xa, sy - 6, 'agua', col['--muted']);
      }
      return;
    }
    // valoración: bureta y matraz
    const v = vAnim(tA), pH = sol.ph(v), cx = w * 0.3, top = 10, bH = h * 0.42, bW = 16;
    const lleno = 1 - v / (2.4 * sol.Veq);
    g.strokeStyle = col['--suelo']; g.lineWidth = 2; g.strokeRect(cx - bW / 2, top, bW, bH);
    g.fillStyle = rgba(agua, 0.9); g.fillRect(cx - bW / 2 + 2, top + bH * (1 - lleno), bW - 4, bH * lleno - 2);
    for (let k = 1; k < 10; k++) { g.beginPath(); g.moveTo(cx - bW / 2, top + (bH * k) / 10); g.lineTo(cx - bW / 2 + 5, top + (bH * k) / 10); g.stroke(); }
    g.beginPath(); g.moveTo(cx, top + bH); g.lineTo(cx, top + bH + 16); g.stroke();
    texto(g, cx + bW, top + 14, sol.nomT, col['--muted'], 'left');
    const yf = top + bH + 34, fh = h - yf - 24, fw = Math.min(w * 0.34, 200);
    const cMat = deIndicador(sol.ind, pH, agua);
    const yl = yf + fh * 0.5, al = 12 + (fw / 2 - 12) * (0.2 / 0.7); // nivel del líquido y su semiancho en el cono
    g.fillStyle = rgba(cMat, 0.75);
    g.beginPath(); g.moveTo(cx - al, yl); g.lineTo(cx - fw / 2, yf + fh); g.lineTo(cx + fw / 2, yf + fh); g.lineTo(cx + al, yl); g.closePath(); g.fill();
    if (anda && v < 2 * sol.Veq) { const yd = top + bH + 18 + ((tA * 3) % 1) * (yl - top - bH - 18); punto(g, cx, yd, 3, rgba(agua)); }
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 12, yf); g.lineTo(cx - 12, yf + fh * 0.3); g.lineTo(cx - fw / 2, yf + fh); g.lineTo(cx + fw / 2, yf + fh); g.lineTo(cx + 12, yf + fh * 0.3); g.lineTo(cx + 12, yf); g.stroke();
    texto(g, cx + fw / 2 + 12, yf + fh * 0.7, `${sol.nomV} + ${sol.ind[0]}`, col['--muted'], 'left');
    texto(g, w * 0.58, h * 0.25, `V = ${txt(f(v))} mL`, col['--ink'], 'left', '600 ');
    texto(g, w * 0.58, h * 0.25 + 22, `pH = ${txt(f2(pH))}`, col['--ink'], 'left', '600 ');
    texto(g, w * 0.58, h * 0.25 + 44, v < sol.Veq * 0.98 ? 'antes de la equivalencia' : v <= sol.Veq * 1.02 ? 'punto de equivalencia' : 'pasada la equivalencia', col['--muted'], 'left');
  }

  /* ---------- Curva de valoración ---------- */
  function grafica() {
    const c = $('#grafica');
    if (c.hidden || !sol || sol.modo !== 'valoracion') return;
    const L = lienzo(c); if (!L) return;
    const { g, w, h } = L;
    if (!col['--ink']) colores();
    const ml = 40, mr = 14, mt = 14, mb = 30, Vm = 2 * sol.Veq;
    const X = (v) => ml + (v / Vm) * (w - ml - mr), Y = (p) => mt + ((14 - p) / 14) * (h - mt - mb);
    // franja de viraje del indicador
    g.fillStyle = col['--line']; g.globalAlpha = 0.5; g.fillRect(ml, Y(sol.ind[2]), w - ml - mr, Y(sol.ind[1]) - Y(sol.ind[2])); g.globalAlpha = 1;
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    for (let p = 0; p <= 14; p += 2) { g.beginPath(); g.moveTo(ml, Y(p)); g.lineTo(w - mr, Y(p)); g.stroke(); texto(g, ml - 6, Y(p), String(p), col['--muted'], 'right'); }
    g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(sol.Veq), mt); g.lineTo(X(sol.Veq), h - mb); g.stroke(); g.setLineDash([]);
    texto(g, X(sol.Veq), h - 12, `V_eq = ${txt(f(sol.Veq))} mL`.replace('V_eq', 'Veq'), col['--muted']);
    texto(g, X(0), h - 12, '0', col['--muted'], 'left'); texto(g, X(Vm), h - 12, `${txt(f(Vm))} mL`, col['--muted'], 'right');
    texto(g, w - mr, Y(sol.ind[2]) - 8, sol.ind[0], col['--muted'], 'right');
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
    sol.curva.forEach(([v, p], i) => (i ? g.lineTo(X(v), Y(p)) : g.moveTo(X(v), Y(p))));
    g.stroke();
    punto(g, X(sol.Veq), Y(sol.pHeq), 4, col['--ink']);
    if (sol.pHv !== null && sol.v <= Vm) punto(g, X(sol.v), Y(sol.pHv), 5.5, col['--roz']);
    const v = vAnim(tA); punto(g, X(v), Y(sol.ph(v)), 4.5, col['--peso']);
    texto(g, ml + 4, 6, 'pH', col['--muted'], 'left');
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; mueve(dt); dibuja(); grafica(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); grafica(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); grafica(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('ph').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.PHApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, pH: sol.pH, Veq: sol.Veq, pHeq: sol.pHeq, pHv: sol.pHv }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();
