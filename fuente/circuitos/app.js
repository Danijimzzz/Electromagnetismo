/* =====================================================================
   Circuitos de corriente continua: interfaz (lista de elementos, fuentes
   dependientes, Thévenin visto por una resistencia o entre dos nudos,
   superposición y mallas, resultado, esquema con potenciales y corrientes
   en el que se pueden mover los nudos y dibujar elementos, y desarrollo).
   El cálculo está en circuitos/fisica.js (Continua).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const C = Continua, f = C.f, CLAVE = 'circuitos-v1', MAX = 16;
  const txt = (h) => String(h).replace(/<[^>]+>/g, '');
  const VALOR = { R: '10', V: '5', I: '1', C: '10', L: '10', VV: '2', VI: '5', IV: '0,5', II: '2' };

  let sc = copia(C.ejemplos[1].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && Array.isArray(g.elementos) && g.elementos.length) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {}, modo = 'ver';
  const nudosDe = () => [...new Set(sc.elementos.flatMap((e) => [String(e.a ?? '').trim(), String(e.b ?? '').trim()]).filter(Boolean))];

  /* ---------- Lista de elementos ---------- */
  function lista() {
    const nom = C.nombres(sc.elementos);
    const campo = (i, k, v, et, extra = '') => `<input class="in" data-i="${i}" data-k="${k}" value="${esc(v ?? '')}" aria-label="${nom[i]}: ${et}" autocomplete="off" spellcheck="false"${extra}>`;
    $('#lista').innerHTML = '<span class="cab">Elemento</span><span class="cab">Nudo A</span><span class="cab">Nudo B</span><span class="cab">Valor</span><span></span>' + sc.elementos.map((e, i) => {
      const T = C.TIPOS[e.t];
      let h = `<b title="${T.nombre}">${nom[i].replace(/^(\w)(\w*?\d+)$/, '$1<sub>$2</sub>')}</b>${campo(i, 'a', e.a, 'nudo A')}${campo(i, 'b', e.b, 'nudo B')}<span class="valor">${campo(i, 'v', e.v, `${T.k ? `factor ${T.k}` : 'valor'} en ${T.un}`, ' inputmode="decimal"')}<small>${T.un}</small></span><button class="x" type="button" data-quita="${i}" aria-label="Quitar ${nom[i]}">×</button>`;
      if (T.ctrl === 'V') h += `<span class="ctrl">${T.nombre}: ${T.k}·(V de ${campo(i, 'c', e.c, 'nudo + de la tensión que la controla')} − V de ${campo(i, 'd', e.d, 'nudo − de la tensión que la controla')})</span>`;
      if (T.ctrl === 'I') h += `<span class="ctrl">${T.nombre}: ${T.k}·I de <select class="in" data-i="${i}" data-k="x" aria-label="${nom[i]}: elemento cuya corriente la controla"><option value="">…</option>${nom.map((m, j) => (j === i ? '' : `<option${String(e.x ?? '').toUpperCase() === m.toUpperCase() ? ' selected' : ''}>${m}</option>`)).join('')}</select> (de A a B)</span>`;
      return h;
    }).join('');
    const sel = $('#carga');
    sel.innerHTML = '<option value="">(ninguno)</option>' + sc.elementos.map((e, i) => (e.t === 'R' ? `<option value="${i}"${String(sc.carga) === String(i) ? ' selected' : ''}>Visto por ${nom[i]}</option>` : '')).join('') + `<option value="nudos"${sc.carga === 'nudos' ? ' selected' : ''}>Entre dos nudos…</option>`;
    if (sc.carga !== '' && sc.carga !== 'nudos' && !(sc.elementos[+sc.carga] && sc.elementos[+sc.carga].t === 'R')) sc.carga = '';
    nudosTh();
    $('#superp').checked = !!sc.superposicion; $('#mallas').checked = !!sc.mallas;
    for (const b of document.querySelectorAll('[data-add], [data-dep]')) b.disabled = sc.elementos.length >= MAX;
  }
  function nudosTh() {
    const ns = nudosDe(), en = sc.carga === 'nudos';
    $('#th-nudos').hidden = !en;
    if (!en) return;
    if (!ns.includes(sc.thA)) sc.thA = ns.find((n) => n !== '0') || ns[0];
    if (!ns.includes(sc.thB)) sc.thB = ns.includes('0') && sc.thA !== '0' ? '0' : ns.find((n) => n !== sc.thA);
    for (const k of ['thA', 'thB']) $(`#${k}`).innerHTML = ns.map((n) => `<option${n === sc[k] ? ' selected' : ''}>${esc(n)}</option>`).join('');
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#lista').addEventListener('input', (e) => { const t = e.target; if (t.dataset.i === undefined || t.tagName !== 'INPUT') return; sc.elementos[+t.dataset.i][t.dataset.k] = t.value; if (t.dataset.k !== 'v') nudosTh(); cambia(); });
  $('#lista').addEventListener('change', (e) => { const t = e.target; if (t.tagName !== 'SELECT') return; sc.elementos[+t.dataset.i][t.dataset.k] = t.value; cambia(); });
  $('#lista').addEventListener('click', (e) => { const q = e.target.dataset.quita; if (q !== undefined) quita(+q); });
  function quita(i) {
    const antes = C.nombres(sc.elementos), fuera = antes[i];
    sc.elementos.splice(i, 1);
    // las fuentes dependientes siguen apuntando al mismo elemento aunque cambie su nombre
    const despues = C.nombres(sc.elementos), mapa = Object.fromEntries(antes.filter((_, j) => j !== i).map((m, j) => [m.toUpperCase(), despues[j]]));
    for (const el of sc.elementos) if (el.x !== undefined) el.x = String(el.x).toUpperCase() === fuera.toUpperCase() ? '' : mapa[String(el.x).toUpperCase()] ?? el.x;
    if (sc.carga !== '' && sc.carga !== 'nudos') { if (+sc.carga === i) sc.carga = ''; else if (+sc.carga > i) sc.carga = String(+sc.carga - 1); }
    lista(); cambia();
  }
  function anade(t, a, b) {
    if (sc.elementos.length >= MAX) return;
    const ult = sc.elementos[sc.elementos.length - 1], el = { t, a: a ?? (ult ? ult.b : 'a'), b: b ?? '0', v: VALOR[t] };
    const ns = nudosDe();
    if (C.TIPOS[t].ctrl === 'V') { el.c = ns.find((n) => n !== '0' && n !== el.a) || ns[0] || 'a'; el.d = '0'; }
    if (C.TIPOS[t].ctrl === 'I') el.x = C.nombres(sc.elementos).find((m, j) => sc.elementos[j].t === 'R') || '';
    sc.elementos.push(el);
    lista(); cambia();
  }
  for (const b of document.querySelectorAll('[data-add]')) b.addEventListener('click', () => anade(b.dataset.add));
  $('[data-dep]').addEventListener('change', (e) => { const t = e.target; if (t.value) anade(t.value); t.value = ''; });
  $('#carga').addEventListener('change', () => { sc.carga = $('#carga').value; nudosTh(); cambia(); });
  for (const k of ['thA', 'thB']) $(`#${k}`).addEventListener('change', () => { sc[k] = $(`#${k}`).value; cambia(); });
  $('#superp').addEventListener('change', () => { sc.superposicion = $('#superp').checked; cambia(); });
  $('#mallas').addEventListener('change', () => { sc.mallas = $('#mallas').checked; cambia(); });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    lista(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = C.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; guarda(); dibuja(); return; }
    err.hidden = true; guarda();
    let h = dato('Potenciales', sol.nudos.filter((n) => n !== sol.ref).map((n) => `V<sub>${esc(n)}</sub> = <b>${f(sol.V[n])} V</b>`).join(', ') || '—');
    h += dato('Potencia entregada', `${f(sol.ent)} W (= consumida)`);
    if (sol.thev) {
      const t = sol.thev;
      h += dato(t.carga ? `Thévenin visto por ${t.carga}` : `Thévenin entre ${esc(t.a)} y ${esc(t.b)}`, `V<sub>th</sub> = <b>${f(t.Vth)} V</b>, R<sub>th</sub> = <b>${f(t.Rth)} Ω</b>`);
      h += dato('Norton y máxima potencia', t.ideal ? 'No hay: R<sub>th</sub> = 0 (fuente de tensión ideal)' : `I<sub>N</sub> = ${f(t.IN)} A${t.Rth > 0 ? `, P<sub>máx</sub> = ${f(t.Pmax)} W` : ''}`);
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }

  /* ---------- Esquema ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--fuente', '--corr', '--cable', '--panel']) col[k] = cs.getPropertyValue(k).trim(); }
  function etiqueta(g, x, y, t, color, fuente = '12px') {
    g.font = `${fuente} "IBM Plex Sans", system-ui, sans-serif`;
    const w = g.measureText(t).width;
    g.fillStyle = col['--bg']; g.globalAlpha = 0.88; g.fillRect(x - w / 2 - 3, y - 8, w + 6, 16); g.globalAlpha = 1;
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y);
  }
  // ¿se cortan los segmentos pq y rs (sin contar los extremos comunes)?
  const corta = ([p, q], [r, s]) => {
    const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
    return o(p, q, r) * o(p, q, s) < 0 && o(r, s, p) * o(r, s, q) < 0;
  };
  // posiciones: las que el usuario ha movido y, las demás, en una elipse con la referencia abajo y el orden con menos cruces
  let ordenGuardado = { clave: '', orden: [] };
  function posiciones(nudos, ref, w, h) {
    const cx = w / 2, cy = h / 2 + 4, rx = Math.max(60, w / 2 - 70), ry = Math.max(50, h / 2 - 44);
    const otros = nudos.filter((n) => n !== ref), n = otros.length + 1;
    const pares = [...new Set(sc.elementos.map((e) => [String(e.a).trim(), String(e.b).trim()].sort().join('|')))].map((k) => k.split('|'));
    const clave = nudos.join(',') + '#' + pares.map((q) => q.join('-')).join(',');
    if (ordenGuardado.clave !== clave) {
      // en la elipse, o con un nudo en el centro (así el puente de Wheatstone se dibuja sin cruces)
      const sitio = (orden, centro) => { const m = centro ? n - 1 : n; return { ...Object.fromEntries([ref, ...orden.filter((q) => q !== centro)].map((q, k) => { const a = Math.PI / 2 + (2 * Math.PI * k) / m; return [q, [Math.cos(a), Math.sin(a)]]; })), ...(centro ? { [centro]: [0, -0.1] } : {}) }; };
      const cruces = (orden, centro) => { const s = sitio(orden, centro), seg = pares.filter(([a, b]) => s[a] && s[b]).map(([a, b]) => [s[a], s[b]]); let c = 0; for (let i = 0; i < seg.length; i++) for (let j = i + 1; j < seg.length; j++) if (corta(seg[i], seg[j])) c++; return c; };
      let mejor = otros, centro = null, cm = cruces(otros);
      const perm = (resto, hecho, cen) => { if (!cm) return; if (!resto.length) { const c = cruces(hecho, cen); if (c < cm) { cm = c; mejor = hecho; centro = cen; } return; } resto.forEach((q, i) => perm([...resto.slice(0, i), ...resto.slice(i + 1)], [...hecho, q], cen)); };
      if (otros.length <= 7) perm(otros, [], null);
      if (otros.length >= 3 && otros.length <= 6) for (const q of otros) perm(otros.filter((x) => x !== q), [q], q);
      ordenGuardado = { clave, orden: mejor, centro };
    }
    const s0 = (() => { const { orden, centro } = ordenGuardado, m = centro ? n - 1 : n; return { ...Object.fromEntries([ref, ...orden.filter((q) => q !== centro)].map((q, k) => { const a = Math.PI / 2 + (2 * Math.PI * k) / m; return [q, [Math.cos(a), Math.sin(a)]]; })), ...(centro ? { [centro]: [0, -0.1] } : {}) }; })();
    const pos = Object.fromEntries(Object.entries(s0).map(([q, [x, y]]) => [q, [cx + rx * x, cy + ry * y]]));
    if (n === 2) { pos[ref] = [cx, cy + ry]; pos[ordenGuardado.orden[0]] = [cx, cy - ry]; }
    for (const q of nudos) { const m = sc.pos && sc.pos[q]; if (m) pos[q] = [m[0] * w, m[1] * h]; }
    return pos;
  }
  let ultimo = { pos: {}, w: 0, h: 0 }, arrastre = null;
  function simbolo(g, e) {
    g.fillStyle = col['--bg']; g.fillRect(-20, -13, 40, 26);
    g.strokeStyle = col['--cable']; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-14, 0); g.moveTo(14, 0); g.lineTo(20, 0); g.stroke();
    const fuente = () => { g.strokeStyle = col['--fuente']; g.fillStyle = col['--fuente']; g.lineWidth = 1.8; };
    const flecha = () => { g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.stroke(); g.beginPath(); g.moveTo(7, 0); g.lineTo(2, -4); g.lineTo(2, 4); g.closePath(); g.fill(); };
    const masmenos = () => { g.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', -5, 0); g.fillText('−', 5, 0); };
    if (e.t === 'R') { g.fillStyle = col['--panel']; g.fillRect(-14, -6, 28, 12); g.strokeRect(-14, -6, 28, 12); }
    else if (e.t === 'C') { g.beginPath(); g.moveTo(-14, 0); g.lineTo(-3, 0); g.moveTo(3, 0); g.lineTo(14, 0); g.moveTo(-3, -10); g.lineTo(-3, 10); g.moveTo(3, -10); g.lineTo(3, 10); g.stroke(); }
    else if (e.t === 'L') { g.beginPath(); g.moveTo(-14, 0); for (let k = 0; k < 4; k++) g.arc(-10.5 + 7 * k, 0, 3.5, Math.PI, 0); g.lineTo(14, 0); g.stroke(); }
    else if (e.t === 'V') {
      // de A (+, placa larga) a B (−, placa corta)
      fuente(); g.lineWidth = 2;
      g.beginPath(); g.moveTo(-14, 0); g.lineTo(-4, 0); g.moveTo(4, 0); g.lineTo(14, 0); g.moveTo(-4, -11); g.lineTo(-4, 11); g.moveTo(4, -6); g.lineTo(4, 6); g.stroke();
      g.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+', -11, -8);
    } else if (e.t === 'I') { fuente(); g.beginPath(); g.arc(0, 0, 11, 0, 2 * Math.PI); g.stroke(); flecha(); }
    else {
      // dependiente: rombo con + − (tensión) o flecha (corriente)
      fuente(); g.beginPath(); g.moveTo(-13, 0); g.lineTo(0, -12); g.lineTo(13, 0); g.lineTo(0, 12); g.closePath(); g.stroke();
      if (e.t[0] === 'V') masmenos(); else flecha();
    }
  }
  function dibuja() {
    const c = $('#esquema'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    colores();
    const nom = C.nombres(sc.elementos), els = sc.elementos.map((e, i) => ({ ...e, a: String(e.a ?? '').trim(), b: String(e.b ?? '').trim(), n: nom[i], r: sol && sol.els[i] })).filter((e) => e.a && e.b && e.a !== e.b);
    const nudos = nudosDe(), ref = sol ? sol.ref : nudos.includes('0') ? '0' : nudos[0];
    if (!nudos.length) return;
    const pos = posiciones(nudos, ref, w, h), cx = w / 2, cy = h / 2 + 4;
    ultimo = { pos, w, h };
    // elementos entre el mismo par de nudos: curvas separadas
    const pares = {};
    for (const e of els) { const k = [e.a, e.b].sort().join('|'); (pares[k] ||= []).push(e); }
    const puestos = [];
    for (const grupo of Object.values(pares)) grupo.forEach((e, j) => {
      const [x1, y1] = pos[e.a], [x2, y2] = pos[e.b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L, sgn = e.a < e.b ? 1 : -1, off = (j - (grupo.length - 1) / 2) * Math.min(110, L * 0.6) * sgn;
      const qx = (x1 + x2) / 2 + nx * off * 2, qy = (y1 + y2) / 2 + ny * off * 2;
      // el símbolo va en el punto de la curva más alejado de los ya dibujados (así no se pisan dos que se cruzan)
      const punto = (t) => [(1 - t) ** 2 * x1 + 2 * t * (1 - t) * qx + t * t * x2, (1 - t) ** 2 * y1 + 2 * t * (1 - t) * qy + t * t * y2];
      const tt = [0.5, 0.38, 0.62, 0.28, 0.72, 0.22, 0.78].find((t) => { const [px, py] = punto(t); return puestos.every(([ax, ay]) => Math.hypot(px - ax, py - ay) > 64); }) ?? 0.5;
      const [mx, my] = punto(tt), tx = 2 * (1 - tt) * (qx - x1) + 2 * tt * (x2 - qx), ty = 2 * (1 - tt) * (qy - y1) + 2 * tt * (y2 - qy), tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
      puestos.push([mx, my]);
      g.strokeStyle = col['--cable']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(qx, qy, x2, y2); g.stroke();
      g.save(); g.translate(mx, my); g.rotate(Math.atan2(uy, ux)); simbolo(g, e); g.restore();
      // nombre y valor a un lado; corriente al otro (normal a la curva en el símbolo)
      const nx2 = -uy, ny2 = ux, lado = off ? Math.sign(off) : (nx * (mx - cx) + ny * (my - cy)) >= 0 ? 1 : -1, k2 = lado * Math.sign(nx2 * nx + ny2 * ny || 1);
      const T = C.TIPOS[e.t], valor = T.ctrl === 'V' ? `${e.v}·V(${e.c},${e.d})` : T.ctrl === 'I' ? `${e.v}·I(${e.x})` : `${String(e.v).replace('.', ',')} ${T.un}`;
      etiqueta(g, mx + nx2 * 25 * k2, my + ny2 * 25 * k2, `${e.n} = ${valor}`, 'RCL'.includes(e.t) ? col['--ink'] : col['--fuente']);
      const I = e.r ? e.r.I : 0;
      if (Math.abs(I) > 1e-12) {
        const s = I > 0 ? 1 : -1, ax = mx - nx2 * 22 * k2, ay = my - ny2 * 22 * k2;
        g.strokeStyle = col['--corr']; g.fillStyle = col['--corr']; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(ax - ux * 12 * s, ay - uy * 12 * s); g.lineTo(ax + ux * 10 * s, ay + uy * 10 * s); g.stroke();
        g.beginPath(); g.moveTo(ax + ux * 14 * s, ay + uy * 14 * s); g.lineTo(ax + ux * 7 * s - uy * 4, ay + uy * 7 * s + ux * 4); g.lineTo(ax + ux * 7 * s + uy * 4, ay + uy * 7 * s - ux * 4); g.closePath(); g.fill();
        etiqueta(g, ax - nx2 * 15 * k2, ay - ny2 * 15 * k2, `${txt(f(Math.abs(I)))} A`, col['--corr'], '11px');
      }
    });
    // línea que se está dibujando
    if (arrastre && arrastre.dibuja) {
      const [x1, y1] = pos[arrastre.desde];
      g.strokeStyle = col['--accent']; g.lineWidth = 2; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(arrastre.x, arrastre.y); g.stroke(); g.setLineDash([]);
    }
    // nudos
    for (const q of nudos) {
      const [x, y] = pos[q];
      g.fillStyle = modo === 'ver' ? col['--cable'] : col['--accent']; g.beginPath(); g.arc(x, y, modo === 'ver' ? 4.5 : 6, 0, 2 * Math.PI); g.fill();
      etiqueta(g, x, y + (y > cy + 1 ? 16 : -16), sol ? `${q}: ${txt(f(sol.V[q]))} V` : q, col['--accent'], '600 12px');
      if (q === ref) {
        g.strokeStyle = col['--cable']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 5);
        for (const [hw, dy] of [[9, 26], [6, 30], [3, 34]]) { g.moveTo(x - hw, y + dy - 2); g.lineTo(x + hw, y + dy - 2); }
        g.stroke();
      }
    }
  }

  /* ---------- Mover nudos y dibujar elementos ---------- */
  const lienzo = $('#esquema');
  const punto = (ev) => { const r = lienzo.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  const nudoEn = (x, y) => Object.entries(ultimo.pos).find(([, [px, py]]) => Math.hypot(px - x, py - y) < 16)?.[0];
  function pon(q, x, y) { sc.pos = sc.pos || {}; sc.pos[q] = [Math.min(0.97, Math.max(0.03, x / ultimo.w)), Math.min(0.95, Math.max(0.05, y / ultimo.h))]; }
  function nuevoNudo() { const ns = nudosDe(); return 'abcdefghijkmnpqrstuvwxyz'.split('').find((l) => !ns.includes(l)) || `n${ns.length}`; }
  lienzo.addEventListener('pointerdown', (ev) => {
    if (modo === 'ver') return;
    const [x, y] = punto(ev), q = nudoEn(x, y);
    if (!q) return;
    ev.preventDefault(); lienzo.setPointerCapture(ev.pointerId);
    // fija todas las posiciones al empezar, para que no salten al cambiar el circuito
    for (const [n, [px, py]] of Object.entries(ultimo.pos)) if (!(sc.pos && sc.pos[n])) pon(n, px, py);
    arrastre = { desde: q, x, y, dibuja: modo === 'dibujar' };
  });
  lienzo.addEventListener('pointermove', (ev) => {
    if (!arrastre) return;
    const [x, y] = punto(ev);
    arrastre.x = x; arrastre.y = y;
    if (!arrastre.dibuja) pon(arrastre.desde, x, y);
    dibuja();
  });
  lienzo.addEventListener('pointerup', (ev) => {
    if (!arrastre) return;
    const a = arrastre; arrastre = null;
    if (a.dibuja) {
      const [x, y] = punto(ev);
      let b = nudoEn(x, y);
      if (b === a.desde) { dibuja(); return; }
      if (!b) { b = nuevoNudo(); pon(b, x, y); }
      $('#ejemplos').value = '';
      anade($('#tipo-dibujo').value, a.desde, b);
    } else { guarda(); dibuja(); }
  });
  for (const b of document.querySelectorAll('[data-modo]')) b.addEventListener('click', () => {
    modo = b.dataset.modo;
    for (const o of document.querySelectorAll('[data-modo]')) o.setAttribute('aria-selected', String(o === b));
    lienzo.classList.toggle('activo', modo !== 'ver');
    $('#tipo-dibujo').hidden = modo !== 'dibujar';
    $('#ayuda-esquema').textContent = modo === 'mover' ? 'Arrastra un nudo para colocarlo donde quieras.' : modo === 'dibujar' ? 'Arrastra de un nudo a otro para poner un elemento entre ellos, o a un sitio vacío para crear un nudo nuevo.' : 'Cada nudo con su potencial; cada elemento, con la corriente que lo recorre (la flecha indica el sentido real).';
    dibuja();
  });
  $('#ordenar').addEventListener('click', () => { delete sc.pos; ordenGuardado.clave = ''; guarda(); dibuja(); });
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('circuitos').current;
  lista(); calcula();
  window.CircuitosApp = { abrirEjemplo, resultado: () => sol && { V: sol.V, thev: sol.thev, ent: sol.ent }, estado: () => copia(sc), anade, posiciones: () => ultimo.pos };
})();
