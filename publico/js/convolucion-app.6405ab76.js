(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const C = Convolucion, f = C.f, ft = C.ft, CLAVE = 'convolucion-v1';

  let sc = copia(C.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = { ...sc, ...g }; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, vista = null, frac = 0, anda = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${Object.entries(lista).map(([c, v]) => `<option value="${c}"${sc[k] === c ? ' selected' : ''}>${v.nom}</option>`).join('')}</select>`;
  const camposDe = (lista, tipo, pref) => lista[tipo].par.map((k) => fila(pref + k, tipo === 'imp' && k === 'A' ? 'Área del impulso' : C.ETIQ[k], C.UNID[k])).join('');
  function formulario() {
    document.querySelectorAll('.modos button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.modo === sc.modo)));
    const senal = (p, tit) => `<div class="sep">${tit}</div>${elige(p + 't', 'Tipo', C.TIPOS)}${camposDe(C.TIPOS, C.TIPOS[sc[p + 't']] ? sc[p + 't'] : 'rect', p)}`;
    if (sc.modo === 'disc') {
      $('#campos').innerHTML = `<div class="sep">Secuencias</div>${fila('dx', 'x[n]', 'valores separados por espacios')}${fila('dnx', 'Índice del primer valor de x', 'n')}${fila('dh', 'h[n]', 'valores separados por espacios')}${fila('dnh', 'Índice del primer valor de h', 'n')}`;
      $('#nota').textContent = 'Escribe los valores separados por espacios, «;» o saltos de línea (la coma es decimal). El subrayado de la gráfica marca el origen n = 0 si cae dentro. Hasta 64 valores por secuencia.';
    } else if (sc.modo === 'sistema') {
      const sis = C.SISTEMAS[sc.sis] ? sc.sis : 'rc';
      $('#campos').innerHTML = senal('x', 'Entrada') + `<div class="sep">Sistema</div>${elige('sis', 'Tipo', C.SISTEMAS)}${camposDe(C.SISTEMAS, sis, '')}`;
      $('#nota').textContent = 'Los tiempos van en segundos y los componentes en ohmios, henrios y faradios; admiten prefijos (2m, 10µ, 4k7, 100n) y coma decimal.';
    } else {
      $('#campos').innerHTML = senal('x', 'Primera señal, x(t)') + senal('h', 'Segunda señal, h(t)');
      $('#nota').textContent = 'Los tiempos admiten prefijos (2m, 10µ) y coma decimal. Un impulso δ no se dibuja como curva, sino como flecha.';
    }
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k || t.tagName === 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName !== 'SELECT' || !t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; formulario(); calcula(); });
  document.querySelectorAll('.modos button').forEach((b) => b.addEventListener('click', () => { sc.modo = b.dataset.modo; $('#ejemplos').value = ''; formulario(); calcula(); }));

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); frac = 0; formulario(); calcula(); sel.value = clave;
  }

  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (xs) => xs[ent(0, xs.length - 1)];
    const base = copia(C.ejemplos[0].sc);
    if (Math.random() < 0.25) {
      const lista = (n) => Array.from({ length: n }, () => String(ent(-3, 5) || 1)).join(' ');
      sc = { ...base, modo: 'disc', dx: lista(ent(2, 5)), dh: lista(ent(2, 4)), dnx: '0', dnh: '0' };
      formulario(); calcula(); sel.value = ''; frac = 0.5; pinta(); return;
    }
    const una = (p) => {
      const t = de(['rect', 'rect', 'tri', 'exp', 'sen']), o = { [p + 't']: t, [p + 'A']: String(ent(1, 3)), [p + 'T']: String(ent(1, 4)), [p + 'a']: String(de([0, 0, 1])), [p + 'tau']: String(ent(1, 3)) };
      return o;
    };
    if (Math.random() < 0.4) {
      const R = de(['1k', '2k', '4k7', '10k']), Cc = de(['10n', '100n', '1µ']), tau = Herramienta.leeSI(R) * Herramienta.leeSI(Cc);
      const entrada = de(['esc', 'rect']);
      sc = { ...base, modo: 'sistema', sis: 'rc', R, C: Cc, xt: entrada, xA: String(ent(1, 5)), xa: '0', xT: String(Math.round(tau * ent(1, 4) * 1e9) / 1e9) };
    } else {
      sc = { ...base, ...una('x'), ...una('h'), modo: 'conv' };
      if (Math.random() < 0.2) Object.assign(sc, { ht: 'imp', hA: String(ent(1, 3)), ha: String(ent(1, 3)) });
    }
    formulario(); calcula(); sel.value = ''; frac = 0.5; pinta();
  }
  const nombreSenal = (p) => {
    const t = sc[p + 't'], v = (k) => esc(sc[p + k] ?? '');
    return { rect: `un pulso rectangular de amplitud ${v('A')} y duración ${v('T')} s que empieza en t = ${v('a')} s`, tri: `un pulso triangular de altura ${v('A')} y base ${v('T')} s desde t = ${v('a')} s`, sen: `un medio seno de amplitud ${v('A')} y duración ${v('T')} s desde t = ${v('a')} s`, esc: `un escalón de altura ${v('A')} en t = ${v('a')} s`, exp: `${v('A')}·e<sup>−(t − ${v('a')})/${v('tau')}</sup> para t ≥ ${v('a')}`, imp: `un impulso de área ${v('A')} en t = ${v('a')} s` }[t] || '';
  };
  const enunciado = () => sc.modo === 'disc'
    ? `Calcula la convolución discreta y[n] = (x * h)[n] de x[n] = {${esc(sc.dx)}} (empieza en n = ${esc(sc.dnx || 0)}) y h[n] = {${esc(sc.dh)}} (empieza en n = ${esc(sc.dnh || 0)}): la secuencia y[n] completa, su longitud, su valor máximo y el instante en que se alcanza.`
    : sc.modo === 'sistema'
    ? `${{ rc: `Un filtro RC con R = ${esc(sc.R)} Ω y C = ${esc(sc.C)} F`, rl: `Un filtro RL con R = ${esc(sc.R)} Ω y L = ${esc(sc.L)} H`, ph: `Un filtro RC paso alto con R = ${esc(sc.R)} Ω y C = ${esc(sc.C)} F`, bp: `Un filtro RLC paso banda con R = ${esc(sc.R)} Ω, L = ${esc(sc.L)} H y C = ${esc(sc.C)} F`, rlc: `Un filtro RLC serie con R = ${esc(sc.R)} Ω, L = ${esc(sc.L)} H y C = ${esc(sc.C)} F`, media: `Una media móvil de ventana ${esc(sc.mT)} s`, ret: `Un retardo puro de ${esc(sc.ma)} s` }[sc.sis] || 'Un sistema'} recibe ${nombreSenal('x')}. Calcula la salida y(t) = (x * h)(t): su valor máximo, el instante en que se alcanza y, de la respuesta al escalón del filtro, la ganancia en continua, el tiempo de subida, la sobreoscilación y el tiempo de establecimiento.`
    : `Calcula la convolución y(t) = (x * h)(t) de x(t), ${nombreSenal('x')}, y h(t), ${nombreSenal('h')}: su valor máximo, el instante en que se alcanza, y su empieza, termina y área.`;

  const dato = (t, v, num = true) => `<div${num ? ' class="num"' : ''}><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = C.resolver(sc); } catch (e) {
      sol = null; vista = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; pinta(); return;
    }
    err.hidden = true; guarda();
    if (sol.modo === 'disc') {
      vista = {};
      $('#resumen').innerHTML = dato('Longitud de y', `${sol.L} valores`) + dato('Empieza en', `n = ${sol.n0}`) + dato('Valor máximo', `y = ${f(sol.ymax)} en n = ${sol.tymax}`) + dato('Suma de y', `∑y = ${f(sol.sumaY)}`);
      $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
      pinta(); return;
    }
    const { x, h, un } = sol, T = (v) => ft(v, un);
    const hl = h.fin - h.ini;
    const v0 = Math.min(x.ini, h.ini, sol.tmin - hl), v1 = Math.max(x.fin, h.fin, sol.tmaxT), pad = (v1 - v0) * 0.03;
    vista = { v0: v0 - pad, v1: v1 + pad };
    let r = dato('Valor máximo', `y<sub>máx</sub> = ${f(sol.ymax)}`) + dato('Instante del máximo', `t = ${T(sol.tymax)}`) + dato('La salida empieza en', `t = ${T(sol.tmin)}`);
    if (sol.modo === 'sistema' && sol.esc) {
      const e = sol.esc;
      r += dato('Ganancia en continua', `H(0) = ${f(e.final)}`) + (e.cero ? dato('Pico de la respuesta al escalón', `${f(e.pico)} en t = ${T(e.tpico)}`) + dato('Establecimiento (2 % del pico)', T(e.establecimiento)) : dato('Tiempo de subida (10–90 %)', T(e.subida)) + dato('Sobreoscilación', `${f(100 * e.sobre)} %`) + dato('Establecimiento (2 %)', T(e.establecimiento)));
      if (sol.sis === 'rc' || sol.sis === 'rl' || sol.sis === 'ph') r += dato('Constante de tiempo', `τ = ${T(h.tau)}`);
      if (sol.sis === 'bp') r += dato('Frecuencia central', `ω<sub>0</sub> = ${f(h.w0)} rad/s`) + dato('Amortiguamiento', `ζ = ${f(h.z)}`);
      if (sol.sis === 'rlc') r += dato('Frecuencia natural', `ω<sub>0</sub> = ${f(h.w0)} rad/s`) + dato('Amortiguamiento', `ζ = ${f(h.z)}`);
    } else if (sol.modo === 'conv') {
      r += (x.esc || h.esc || x.inf || h.inf ? dato('La salida termina', '∞ (se apaga o no acaba)', false) : dato('La salida termina en', `t = ${T(sol.tmaxT)}`));
      r += Number.isFinite(sol.areaY) ? dato('Área de y(t)', `∫y = ${f(sol.areaY)}`) : dato('Área de y(t)', '∞', false);
      if (Number.isFinite(sol.final)) r += dato('Valor final', `y(∞) = ${f(sol.final)}`);
    }
    $('#resumen').innerHTML = r;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    pinta();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--serie-3']) col[k] = cs.getPropertyValue(k).trim(); }
  const ML = 52, MR = 14;
  const tAct = () => sol.tmin + frac * (sol.tmaxT - sol.tmin);
  const ejeT = (g, w, h, X, mb) => {
    const [k, u] = C.unidad(Math.max(Math.abs(vista.v0), Math.abs(vista.v1), 1e-300) / 2);
    g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.textAlign = 'center'; g.textBaseline = 'top'; g.font = '12px system-ui, sans-serif';
    for (const v of marcas(vista.v0, vista.v1, 7)) { g.beginPath(); g.moveTo(X(v), 0); g.lineTo(X(v), h - mb); g.stroke(); g.fillText(txt(f(v / k)), X(v), h - mb + 5); }
    g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText(`t (${u})`, w - 4, 3);
  };
  const flecha = (g, x0, y0, y1, c) => { g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y1); g.stroke(); const s = y1 < y0 ? 1 : -1; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0 - 5, y1 + s * 9); g.lineTo(x0 + 5, y1 + s * 9); g.closePath(); g.fill(); };

  const nAct = () => sol.n0 + Math.round(frac * (sol.L - 1));
  const hRef = (k, n) => { const j = n - sol.nh - k; return j >= 0 && j < sol.h.length ? sol.h[j] : 0; };   // h[n − k]
  const xEn = (k) => { const i = k - sol.nx; return i >= 0 && i < sol.x.length ? sol.x[i] : 0; };
  function ejeN(g, w, h, X, mb, a, b) {
    g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.textAlign = 'center'; g.textBaseline = 'top'; g.font = '12px system-ui, sans-serif';
    for (const v of marcas(a, b, 12)) if (Number.isInteger(v)) { g.beginPath(); g.moveTo(X(v), 0); g.lineTo(X(v), h - mb); g.stroke(); g.fillText(String(v).replace('-', '−'), X(v), h - mb + 5); }
    g.textAlign = 'right'; g.fillText('n', w - 4, 3);
  }
  function tallos(g, X, Y, ns, vs, c, alfa = 1) {
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = 2.4; g.globalAlpha = alfa;
    ns.forEach((n, i) => { if (!vs[i]) return; g.beginPath(); g.moveTo(X(n), Y(0)); g.lineTo(X(n), Y(vs[i])); g.stroke(); g.beginPath(); g.arc(X(n), Y(vs[i]), 4, 0, 2 * Math.PI); g.fill(); });
    g.globalAlpha = 1;
  }
  function dibujaDiscEntrada() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    const a = sol.nx - sol.h.length + 1 - 0.7, b = sol.nx + sol.x.length + sol.h.length - 2 + 0.7, mt = 26, mb = 22, n = nAct();
    const X = (v) => ML + ((v - a) / (b - a)) * (w - ML - MR), m = Math.max(...sol.x.map(Math.abs), ...sol.h.map(Math.abs)) * 1.15, Y = (v) => (mt + h - mb) / 2 - (v / m) * ((h - mb - mt) / 2);
    g.lineWidth = 1; ejeN(g, w, h, X, mb, a, b);
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(ML, Y(0)); g.lineTo(w - MR, Y(0)); g.stroke();
    const ks = [], xs = [], hs = [], ps = [];
    for (let k = Math.ceil(a); k <= Math.floor(b); k++) { ks.push(k); xs.push(xEn(k)); hs.push(hRef(k, n)); ps.push(xEn(k) * hRef(k, n)); }
    tallos(g, (v) => X(v), Y, ks, xs, col['--serie-1']);
    tallos(g, (v) => X(v), Y, ks, hs, col['--serie-2']);
    tallos(g, (v) => X(v), Y, ks, ps, col['--serie-3']);
    g.setLineDash([4, 4]); g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(X(n), mt - 6); g.lineTo(X(n), h - mb); g.stroke(); g.setLineDash([]);
    g.font = '12px system-ui, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    let lx = ML + 4;
    for (const [c, s2] of [[col['--serie-1'], 'x[k]'], [col['--serie-2'], 'h[n − k]'], [col['--serie-3'], 'producto']]) { g.fillStyle = c; g.fillRect(lx, 8, 14, 4); g.fillStyle = col['--ink']; g.fillText(s2, lx + 19, 10); lx += 26 + g.measureText(s2).width + 12; }
  }
  function dibujaDiscSalida() {
    const { g, w, h } = lienzo('#salida');
    if (!sol || !w || !h) return;
    const a = sol.n0 - 1, b = sol.n0 + sol.L, mt = 10, mb = 22, n = nAct(), ns = sol.y.map((_, i) => sol.n0 + i);
    let lo = Math.min(0, ...sol.y), hi = Math.max(0, ...sol.y); if (hi - lo < 1e-300) hi = lo + 1;
    const pad = (hi - lo) * 0.1; hi += pad; if (lo < 0) lo -= pad;
    const X = (v) => ML + ((v - a) / (b - a)) * (w - ML - MR), Y = (v) => h - mb - ((v - lo) / (hi - lo)) * (h - mb - mt);
    g.lineWidth = 1; ejeN(g, w, h, X, mb, a, b);
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line'];
    for (const v of marcas(lo, hi, 4)) { g.beginPath(); g.moveTo(ML, Y(v)); g.lineTo(w - MR, Y(v)); g.stroke(); g.fillText(txt(f(v, 3)), ML - 6, Y(v)); }
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(ML, Y(0)); g.lineTo(w - MR, Y(0)); g.stroke();
    tallos(g, X, Y, ns, sol.y, col['--serie-3'], 0.3);
    tallos(g, X, Y, ns.filter((v) => v <= n), sol.y.filter((_, i) => ns[i] <= n), col['--serie-3']);
    g.fillStyle = col['--ink']; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '12px system-ui, sans-serif'; g.fillText('y[n] = (x * h)[n]', ML + 4, 2);
  }

  function dibujaEntrada() {
    if (sol && sol.modo === 'disc') return dibujaDiscEntrada();
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !vista || !w || !h) return;
    const { x, h: hs } = sol, t0 = tAct(), mt = 26, mb = 22;
    const X = (t) => ML + ((t - vista.v0) / (vista.v1 - vista.v0)) * (w - ML - MR);
    const nx = nrm(x), nh = nrm(hs), neg = x.A < 0 || hs.A < 0 || hs.tipo === 'rlc' || hs.tipo === 'ph' || hs.tipo === 'bp';
    const lo = neg ? -1.25 : -0.1, hi = 1.25;
    const Y = (v) => h - mb - ((v - lo) / (hi - lo)) * (h - mb - mt);
    g.lineWidth = 1; ejeT(g, w, h, X, mb);
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(ML, Y(0)); g.lineTo(w - MR, Y(0)); g.stroke();
    const N = 700, dt = (vista.v1 - vista.v0) / N;
    const curva = (fn, c, ancho) => { g.strokeStyle = c; g.lineWidth = ancho; g.beginPath(); for (let i = 0; i <= N; i++) { const t = vista.v0 + i * dt, v = fn(t); i ? g.lineTo(X(t), Y(v)) : g.moveTo(X(t), Y(v)); } g.stroke(); };
    const prod = (t) => (x.delta || hs.delta ? 0 : (x.val(t) * hs.val(t0 - t)) / (nx * nh));
    if (!x.delta && !hs.delta) {
      g.fillStyle = col['--serie-3']; g.globalAlpha = 0.32; g.beginPath(); g.moveTo(X(vista.v0), Y(0));
      for (let i = 0; i <= N; i++) { const t = vista.v0 + i * dt; g.lineTo(X(t), Y(prod(t))); }
      g.lineTo(X(vista.v1), Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1;
      curva(prod, col['--serie-3'], 1.6);
    }
    if (x.delta) flecha(g, X(x.a), Y(0), Y(Math.sign(x.A)), col['--serie-1']); else curva((t) => x.val(t) / nx, col['--serie-1'], 2.4);
    if (hs.delta) flecha(g, X(t0 - hs.a), Y(0), Y(Math.sign(hs.A)), col['--serie-2']); else curva((t) => hs.val(t0 - t) / nh, col['--serie-2'], 2.4);
    if (x.delta || hs.delta) {
      const d = x.delta ? x : hs, o = x.delta ? hs : x, tp = x.delta ? x.a : t0 - hs.a, v = (d.A * (x.delta ? hs.val(t0 - tp) : x.val(tp))) / (x.delta ? nh : nx);
      if (v) flecha(g, X(tp), Y(0), Y(Math.max(-1.2, Math.min(1.2, v))), col['--serie-3']);
    }
    g.setLineDash([4, 4]); g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(X(t0), mt - 6); g.lineTo(X(t0), h - mb); g.stroke(); g.setLineDash([]);
    g.font = '12px system-ui, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    let lx = ML + 4;
    for (const [c, s] of [[col['--serie-1'], 'x(τ)'], [col['--serie-2'], 'h(t − τ)'], [col['--serie-3'], 'producto']]) { g.fillStyle = c; g.fillRect(lx, 8, 14, 4); g.fillStyle = col['--ink']; g.fillText(s, lx + 19, 10); lx += 26 + g.measureText(s).width + 12; }
  }
  const nrm = (s) => { if (s.delta) return Math.abs(s.A) || 1; let m = 0; for (let i = 0; i <= 400; i++) m = Math.max(m, Math.abs(s.val(s.ini + ((s.fin - s.ini) * i) / 400))); return m || 1; };

  function dibujaSalida() {
    if (sol && sol.modo === 'disc') return dibujaDiscSalida();
    const { g, w, h } = lienzo('#salida');
    if (!sol || !vista || !w || !h) return;
    const t0 = tAct(), mt = 10, mb = 22, { t, y } = sol;
    let lo = Math.min(0, ...y), hi = Math.max(0, ...y);
    if (hi - lo < 1e-300) hi = lo + 1;
    const pad = (hi - lo) * 0.08; lo -= lo < 0 ? pad : 0; hi += pad;
    const X = (tt) => ML + ((tt - vista.v0) / (vista.v1 - vista.v0)) * (w - ML - MR), Y = (v) => h - mb - ((v - lo) / (hi - lo)) * (h - mb - mt);
    g.lineWidth = 1; ejeT(g, w, h, X, mb);
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line'];
    for (const v of marcas(lo, hi, 4)) { g.beginPath(); g.moveTo(ML, Y(v)); g.lineTo(w - MR, Y(v)); g.stroke(); g.fillText(txt(f(v, 3)), ML - 6, Y(v)); }
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(ML, Y(0)); g.lineTo(w - MR, Y(0)); g.stroke();
    const traza = (hasta, c, ancho, alfa) => { g.strokeStyle = c; g.lineWidth = ancho; g.globalAlpha = alfa; g.beginPath(); let ini = true; for (let i = 0; i < t.length && t[i] <= hasta; i++) { ini ? g.moveTo(X(t[i]), Y(y[i])) : g.lineTo(X(t[i]), Y(y[i])); ini = false; } g.stroke(); g.globalAlpha = 1; };
    traza(Infinity, col['--serie-3'], 1.4, 0.3);
    traza(t0, col['--serie-3'], 2.6, 1);
    const y0 = sol.valorEn(t0);
    g.fillStyle = col['--serie-3']; g.beginPath(); g.arc(X(t0), Y(y0), 5, 0, 2 * Math.PI); g.fill();
    g.fillStyle = col['--ink']; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = '12px system-ui, sans-serif'; g.fillText('y(t) = (x * h)(t)', ML + 4, 2);
  }
  function pinta() {
    dibujaEntrada(); dibujaSalida();
    const t0v = $('#t0v'), r = $('#t0');
    if (!sol) { t0v.textContent = ''; return; }
    if (sol.modo === 'disc') {
      const n = nAct(), ks = []; let tot = 0;
      for (let k = sol.nx; k < sol.nx + sol.x.length; k++) { const p = xEn(k) * hRef(k, n); tot += p; if (p) ks.push(`${f(xEn(k))}·${f(hRef(k, n))}`); }
      r.value = Math.round(frac * 1000); t0v.textContent = `n = ${n}`;
      $('#leyenda').innerHTML = `En <b>n = ${n}</b> se suman los productos solapados: <b class="y1">y[${n}] = ${ks.length ? ks.join(' + ') + ' = ' : ''}${f(tot)}</b>. Cada secuencia se dibuja a su propia escala.`;
      return;
    }
    const t0 = tAct(), y0 = sol.valorEn(t0);
    r.value = Math.round(frac * 1000); t0v.textContent = `${ft(t0, sol.un)}`;
    $('#leyenda').innerHTML = `En <b>t = ${ft(t0, sol.un)}</b> el área del producto vale <b class="y1">y(t) = ${f(y0)}</b>. Cada señal se dibuja a su propia escala; la curva de abajo es la salida real.`;
  }
  window.addEventListener('resize', pinta);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); pinta(); });

  const DUR = 7, PAUSA_FINAL = 0.9;
  let ultimo = 0, espera = 0;
  const boton = () => { $('#play').textContent = anda ? '⏸ Pausa' : '▶ Animar'; };
  function bucle(ts) {
    const dt = Math.min(0.1, (ts - ultimo) / 1000); ultimo = ts;
    if (anda && sol) {
      if (frac >= 1) { espera += dt; if (espera >= PAUSA_FINAL) { frac = 0; espera = 0; } } else frac = Math.min(1, frac + dt / DUR);
      pinta();
    }
    requestAnimationFrame(bucle);
  }
  $('#play').addEventListener('click', () => { anda = !anda; if (anda && frac >= 1) frac = 0; boton(); });
  $('#t0').addEventListener('input', (e) => { anda = false; boton(); frac = +e.target.value / 1000; pinta(); });
  function fijar(t) { anda = false; boton(); frac = sol && sol.tmaxT > sol.tmin ? Math.max(0, Math.min(1, (t - sol.tmin) / (sol.tmaxT - sol.tmin))) : 0; pinta(); }

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('convolucion').current;
  const muestras = () => {
    if (!sol) return { cab: ['t', 'y'], filas: [] };
    if (sol.modo === 'disc') return { cab: ['n', 'x[n]', 'h[n]', 'y[n]'], filas: sol.y.map((v, i) => [sol.n0 + i, xEn(sol.n0 + i), sol.h[sol.n0 + i - sol.nh] ?? 0, v]) };
    const paso = Math.max(1, Math.floor(sol.t.length / 200)), filas = [];
    for (let i = 0; i < sol.t.length; i += paso) filas.push([sol.t[i], sol.y[i]]);
    return { cab: ['t (s)', 'y(t)'], filas };
  };
  const entrada = () => {
    if (!sol) return { cab: ['t', 'x', 'h'], filas: [] };
    if (sol.modo === 'disc') return muestras();
    const filas = [], n = 200;
    for (let i = 0; i <= n; i++) { const t = vista.v0 + ((vista.v1 - vista.v0) * i) / n; filas.push([t, sol.x.delta ? 0 : sol.x.val(t), sol.h.delta ? 0 : sol.h.val(t)]); }
    return { cab: ['t (s)', 'x(t)', 'h(t)'], filas };
  };
  Herramienta.exportar('#grafica', { nombre: 'convolucion-senales', titulo: 'Señales x y h', datos: entrada });
  Herramienta.exportar('#salida', { nombre: 'convolucion-salida', titulo: 'Convolución y', datos: muestras });
  colores(); formulario(); boton(); calcula();
  requestAnimationFrame(bucle);
  window.ConvolucionApp = {
    abrirEjemplo, azar, enunciado, estado: () => copia(sc), fijar, pausa: () => { anda = false; boton(); },
    resultado: () => sol && sol.modo === 'disc' ? { ymax: sol.ymax, tymax: sol.tymax, tmin: sol.tmin, tmax: sol.tmaxT, area: sol.sumaY, y: sol.y.slice(), n0: sol.n0 } : sol && { ymax: sol.ymax, tymax: sol.tymax, tmin: sol.tmin, tmax: sol.tmaxT, area: sol.areaY, final: sol.final, subida: sol.esc?.subida, sobre: sol.esc?.sobre, establecimiento: sol.esc?.establecimiento },
  };
})();

