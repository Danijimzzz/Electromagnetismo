/* =====================================================================
   Calculadora: lo común de las herramientas sencillas (datos → resultados,
   gráfica y desarrollo), para no repetirlo en cada app.js. Lo usan las de
   Economía (con economia/comun.js) y otras como Estadística descriptiva.
   Va en «scripts» de catalogo.js antes del calculo.js de la herramienta; en
   Node, cada calculo.js lo pide con require.
     f(x, d)          número con coma decimal, d cifras significativas y ·10ⁿ
     num(x, dec)      número con dec decimales fijos y punto de miles (1.234,50)
     leeNum(s)        número de un campo: coma o punto decimal, 3e8, 3·10^8,
                      espacios y un % o € al final (se quitan)
     lee(sc, k, nom, { min, minEx, max, maxEx, entero, def })   campo validado
                      (def: valor si está vacío; si no, «Falta …»)
     lista(texto, nom)   números separados por espacios, «;» o saltos de línea
     filas(texto, n, nom) tabla de n columnas (una fila por línea; se salta
                      una cabecera de texto)
     grafica(canvas, cfg, col)   ejes, rejilla y series; devuelve { X, Y, g }
     rango(vals, { cero })       límites de un eje con aire
     colores(extra)   colores de la página para grafica()
     monta(o)         la interfaz entera (ver más abajo)
   La página sigue la plantilla: #ejemplos, #campos, #nota, #error,
   #resumen, #grafica, #leyenda, #pasos y, si hay tabla, #tabla.
     Calculadora.monta({
       C,            el cálculo: { resolver(sc), ejemplos }
       carpeta,      la de catalogo.js; el estado va en localStorage['<carpeta>-v1']
       app,          nombre de window.<app> para el modo práctica y las pruebas
       campos(sc),   lista de campos: { k, nom, un, tipo: 'num' | 'sel' | 'area' | 'texto',
                     ops: [[valor, texto]], sep: 'título de grupo', ayuda, filas }
       resumen(sol), [[etiqueta, valor HTML, ancho?]] de la tarjeta de resultados
       tabla(sol),   HTML de la tabla (opcional)
       grafica(sol, col), configuración de grafica() o null
       despues(r, sol, col), dibujo extra sobre la gráfica (r = { X, Y, g, w, h })
       leyenda(sol), HTML bajo la gráfica
       grafica2(sol, col), despues2, leyenda2(sol)   segunda gráfica (opcional: hace falta
                     <canvas id="grafica2"> y <p id="leyenda2"> en una tarjeta de la página)
       usar,         botones «Usar en…» (opcional): [{ a: 'carpeta-destino', nombre, datos(sol, sc) }]
                     que abren esa herramienta con los datos que devuelve datos(), en el
                     formato de estado de la otra (la dirección lleva #d=, como «Copiar enlace»)
       nota,         texto de ayuda bajo los datos
       azar(),       sc al azar para el modo práctica (opcional)
       enunciado(sc, sol), enunciado del modo práctica (opcional)
     })
   Un cambio en un desplegable vuelve a pintar el formulario (los campos pueden
   depender del modo elegido). Cada gráfica lleva su botón «Guardar gráfica (PNG)» y se
   describe con su leyenda (role="img" y aria-describedby) para lectores de pantalla.
   window.<app>.pon(cambios) cambia unos datos desde
   fuera del formulario (por ejemplo, al mover o acercar la gráfica) y recalcula.
   ===================================================================== */
const Calculadora = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e9 || a < 1e-4 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const num = (x, dec = 2) => {
    if (!isFinite(x)) return '—';
    const [e, d] = Math.abs(x).toFixed(dec).split('.');
    const s = e.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '');
    return (x < 0 && +s.replace(/\./g, '').replace(',', '.') !== 0 ? '−' : '') + s;
  };
  const leeNum = (s) => {
    const t = String(s ?? '').trim().replace(/\s/g, '').replace(/[%€$]$/, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
    return t === '' ? NaN : +t;
  };
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { min = -Infinity, minEx = false, max = Infinity, maxEx = false, entero = false, def } = {}) {
    if (vacio(sc[k])) { if (def !== undefined) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${mayus(nom)} debe ser un número`);
    if (entero && !Number.isInteger(v)) throw new Error(`${mayus(nom)} debe ser un número entero`);
    if (v < min || (minEx && v === min)) throw new Error(`${mayus(nom)} debe ser ${minEx ? 'mayor que' : 'como mínimo'} ${String(min).replace('.', ',')}`);
    if (v > max || (maxEx && v === max)) throw new Error(`${mayus(nom)} debe ser ${maxEx ? 'menor que' : 'como mucho'} ${String(max).replace('.', ',')}`);
    return v;
  }
  function lista(texto, nom) {
    const tk = String(texto ?? '').split(/[\s;]+/).filter(Boolean);
    const v = tk.map(leeNum), i = v.findIndex((x) => !isFinite(x));
    if (i >= 0) throw new Error(`En ${nom}, «${tk[i]}» no es un número (separa los valores con espacios o «;» y usa la coma decimal)`);
    return v;
  }
  function filas(texto, n, nom) {
    const out = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const tk = (/[;\t]/.test(l) ? l.split(/\s*[;\t]\s*/) : l.split(/\s+/)).filter((t) => t !== ''), v = tk.map(leeNum);
      if (!out.length && v.some((x) => !isFinite(x)) && tk.some((t) => /[a-zñáéíóú]/i.test(t))) return; // cabecera
      if (tk.length !== n) throw new Error(`${mayus(nom)}, fila ${i + 1}: escribe ${n} números separados por espacios, tabuladores o «;»`);
      if (v.some((x) => !isFinite(x))) throw new Error(`${mayus(nom)}, fila ${i + 1}: «${l}» no son números`);
      out.push(v);
    });
    return out;
  }

  /* ---------- Gráfica ---------- */
  // cfg: { x: [a, b], y: [a, b], series: [{ pts: [[x, y]…], color, tipo: 'linea' | 'puntos' | 'barras' | 'area', ancho, discontinua, grosor }],
  //        fx, fy (texto de las marcas), ejeX, ejeY (nombres), verticales: [{ x, color, texto }], horizontales: [{ y, color, texto }],
  //        etiquetas: [{ x, y, texto, color, alinea }] }
  // col: colores leídos con getComputedStyle (--ink, --muted, --line y los de las series)
  function grafica(c, cfg, col) {
    const { g, w, h } = Herramienta.lienzo(c);
    if (!w || !h) return null;
    const fx = cfg.fx || ((v) => Herramienta.txt(f(v))), fy = cfg.fy || ((v) => Herramienta.txt(f(v)));
    let [x0, x1] = cfg.x, [y0, y1] = cfg.y;
    if (x1 === x0) { x0 -= 1; x1 += 1; }
    if (y1 === y0) { y0 -= 1; y1 += 1; }
    g.font = '12px system-ui, sans-serif';
    const my = Herramienta.marcas(y0, y1, 5), mx = Herramienta.marcas(x0, x1, Math.max(3, Math.min(8, Math.floor(w / 90))));
    const ml = Math.max(40, ...my.map((v) => g.measureText(fy(v)).width + 14)), mr = 14, mt = 14, mb = cfg.ejeX ? 44 : 28;
    const X = (v) => ml + ((v - x0) / (x1 - x0)) * (w - ml - mr), Y = (v) => h - mb - ((v - y0) / (y1 - y0)) * (h - mt - mb);
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of my) { g.beginPath(); g.moveTo(ml, Y(v)); g.lineTo(w - mr, Y(v)); g.stroke(); g.fillText(fy(v), ml - 6, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of mx) g.fillText(fx(v), X(v), h - mb + 6);
    if (y0 < 0 && y1 > 0) { g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(ml, Y(0)); g.lineTo(w - mr, Y(0)); g.stroke(); }
    if (cfg.ejeX) { g.fillText(cfg.ejeX, (ml + w - mr) / 2, h - 18); }
    if (cfg.ejeY) { g.save(); g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(cfg.ejeY, ml + 4, 0); g.restore(); }
    g.save(); g.beginPath(); g.rect(ml, mt - 4, w - ml - mr, h - mt - mb + 8); g.clip();
    for (const s of cfg.series || []) {
      const color = col[s.color] || s.color || col['--ink'];
      g.strokeStyle = color; g.fillStyle = color; g.lineWidth = s.grosor || 2.4;
      g.setLineDash(s.discontinua ? [6, 4] : []);
      if (s.tipo === 'puntos') for (const [x, y] of s.pts) { g.beginPath(); g.arc(X(x), Y(y), s.radio || 4, 0, 2 * Math.PI); g.fill(); }
      else if (s.tipo === 'barras') {
        const an = s.ancho ?? (s.pts.length > 1 ? Math.abs(s.pts[1][0] - s.pts[0][0]) * 0.7 : 1);
        for (const [x, y] of s.pts) { const a = X(x - an / 2), b = X(x + an / 2), base = Y(Math.max(y0, Math.min(0, y1))); g.globalAlpha = s.alfa ?? 0.85; g.fillRect(a + (s.desplaza || 0), Math.min(Y(y), base), b - a, Math.abs(base - Y(y))); g.globalAlpha = 1; }
      } else if (s.tipo === 'area') {
        if (s.pts.length) { g.globalAlpha = s.alfa ?? 0.18; g.beginPath(); g.moveTo(X(s.pts[0][0]), Y(s.base ?? 0)); for (const [x, y] of s.pts) g.lineTo(X(x), Y(y)); g.lineTo(X(s.pts[s.pts.length - 1][0]), Y(s.base ?? 0)); g.closePath(); g.fill(); g.globalAlpha = 1; }
      } else { g.beginPath(); s.pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); }
      g.setLineDash([]);
    }
    for (const v of cfg.verticales || []) { g.strokeStyle = col[v.color] || col['--muted']; g.lineWidth = 1.2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(v.x), mt); g.lineTo(X(v.x), h - mb); g.stroke(); g.setLineDash([]); }
    for (const v of cfg.horizontales || []) { g.strokeStyle = col[v.color] || col['--muted']; g.lineWidth = 1.2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(ml, Y(v.y)); g.lineTo(w - mr, Y(v.y)); g.stroke(); g.setLineDash([]); }
    g.restore();
    g.font = '600 12px system-ui, sans-serif';
    for (const v of cfg.verticales || []) if (v.texto) { g.fillStyle = col[v.color] || col['--muted']; g.textAlign = X(v.x) > w - 120 ? 'right' : 'left'; g.textBaseline = 'top'; g.fillText(v.texto, X(v.x) + (g.textAlign === 'left' ? 4 : -4), mt); }
    for (const v of cfg.horizontales || []) if (v.texto) { g.fillStyle = col[v.color] || col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(v.texto, w - mr - 2, Y(v.y) - 2); }
    for (const e of cfg.etiquetas || []) { g.fillStyle = col[e.color] || col['--ink']; g.textAlign = e.alinea || 'left'; g.textBaseline = 'bottom'; g.fillText(e.texto, X(e.x) + (e.alinea === 'right' ? -6 : 6), Y(e.y) - 4); }
    return { X, Y, g, w, h };
  }
  // límites con un poco de aire alrededor de unos valores (incluido el 0 si se pide)
  const rango = (vals, { cero = false, aire = 0.08 } = {}) => {
    const v = vals.filter(isFinite); let a = Math.min(...v, ...(cero ? [0] : [])), b = Math.max(...v, ...(cero ? [0] : []));
    if (!isFinite(a)) return [0, 1];
    const m = (b - a || Math.abs(b) || 1) * aire;
    return [cero && a >= 0 ? 0 : a - m, cero && b <= 0 ? 0 : b + m];
  };
  // colores de la página para grafica()
  const colores = (extra = []) => { const cs = getComputedStyle(document.documentElement), col = {}; for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--serie-3', ...extra]) col[k] = cs.getPropertyValue(k).trim(); return col; };


  /* ---------- Interfaz ---------- */
  function monta(o) {
    const { $, esc, copia } = Herramienta;
    const C = o.C, CLAVE = `${o.carpeta}-v1`;
    let sc = copia(C.ejemplos[0].sc);
    try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
    const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
    let sol = null, col = {};

    /* ---------- Formulario ---------- */
    const campo = (c) => {
      const id = `f-${c.k}`, v = sc[c.k] ?? '';
      const et = `<label for="${id}"${c.tipo === 'area' ? ' class="ancho"' : ''}>${c.nom}${c.un ? ` <small>(${c.un})</small>` : ''}${c.ayuda ? ` <small>${c.ayuda}</small>` : ''}</label>`;
      if (c.tipo === 'sel') return et + `<select id="${id}" class="in" data-k="${c.k}">${c.ops.map(([val, t]) => `<option value="${val}"${val === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
      if (c.tipo === 'area') return et + `<textarea id="${id}" class="in ancho" data-k="${c.k}" rows="${c.filas || 7}" spellcheck="false" autocomplete="off">${esc(v)}</textarea>`;
      return et + `<input id="${id}" class="in" data-k="${c.k}" value="${esc(v)}"${c.tipo === 'texto' ? '' : ' inputmode="decimal"'} autocomplete="off">`;
    };
    function formulario() {
      const cs = o.campos(sc);
      // los desplegables empiezan en su primera opción si el estado no trae valor
      for (const c of cs) if (c.tipo === 'sel' && !c.ops.some(([val]) => val === sc[c.k])) sc[c.k] = c.ops[0][0];
      $('#campos').innerHTML = cs.map((c) => (c.sep ? `<div class="sep">${c.sep}</div>` : '') + campo(c)).join('');
      if (o.nota) $('#nota').innerHTML = o.nota;
    }
    $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k || t.tagName === 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
    $('#campos').addEventListener('change', (e) => { const t = e.target; if (!t.dataset.k || t.tagName !== 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; formulario(); calcula(); });

    /* ---------- Ejemplos ---------- */
    const sel = $('#ejemplos');
    sel.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
    sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
    function abrirEjemplo(clave) {
      const e = C.ejemplos.find((x) => x.clave === clave);
      if (!e) return;
      sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
    }
    function azar() { if (!o.azar) return; sc = o.azar(); formulario(); calcula(); sel.value = ''; }
    function pon(cambios) { Object.assign(sc, cambios); formulario(); calcula(); sel.value = ''; }

    /* ---------- Cálculo ---------- */
    function calcula() {
      const err = $('#error');
      try { sol = C.resolver(sc); } catch (e) {
        sol = null; err.textContent = e.message; err.hidden = false;
        for (const s of ['#resumen', '#pasos', '#leyenda', '#tabla']) { const el = $(s); if (el) el.innerHTML = ''; }
        dibuja(); return;
      }
      err.hidden = true; guarda();
      $('#resumen').innerHTML = o.resumen(sol).map(([t, v, ancho]) => `<div${ancho ? ' class="ancho"' : ''}><span>${t}</span><b>${v}</b></div>`).join('');
      $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
      const tb = $('#tabla'); if (tb) { const h = o.tabla ? o.tabla(sol) : ''; tb.innerHTML = h; tb.closest('.card').hidden = !h; }
      $('#leyenda').innerHTML = o.leyenda ? o.leyenda(sol) : '';
      dibuja();
    }

    /* ---------- Gráfica ---------- */
    function dibuja() {
      const c = $('#grafica'); if (!c) return;
      const cfg = sol && o.grafica ? o.grafica(sol, col) : null;
      if (!cfg) Herramienta.lienzo(c);
      else { const r = grafica(c, cfg, col); if (r && o.despues) o.despues(r, sol, col); }
      const c2 = $('#grafica2');
      if (c2) {
        const cfg2 = sol && o.grafica2 ? o.grafica2(sol, col) : null, card = c2.closest('.card');
        if (card) card.hidden = !cfg2;
        if (!cfg2) Herramienta.lienzo(c2);
        else { const r2 = grafica(c2, cfg2, col); if (r2 && o.despues2) o.despues2(r2, sol, col); }
        const l2 = $('#leyenda2'); if (l2) l2.innerHTML = cfg2 && o.leyenda2 ? o.leyenda2(sol) : '';
      }
    }
    // guardar la gráfica como imagen PNG (sobre el color de fondo de la tarjeta) y describirla para lectores de pantalla
    function guardaPNG(c, nombre) {
      const out = document.createElement('canvas'); out.width = c.width; out.height = c.height;
      const g = out.getContext('2d'), fondo = getComputedStyle(document.documentElement).getPropertyValue('--panel').trim() || '#ffffff';
      g.fillStyle = fondo; g.fillRect(0, 0, out.width, out.height); g.drawImage(c, 0, 0);
      return new Promise((ok) => out.toBlob((b) => {
        if (!b) return ok(false);
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000); ok(true);
      }, 'image/png'));
    }
    function botonesGrafica() {
      for (const [id, ley, sufijo] of [['#grafica', '#leyenda', ''], ['#grafica2', '#leyenda2', '-2']]) {
        const c = $(id); if (!c) continue;
        c.setAttribute('role', 'img'); const l = $(ley); if (l) c.setAttribute('aria-describedby', l.id);
        if (c.parentElement.querySelector('.guardar-png')) continue;
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn guardar-png'; b.textContent = 'Guardar gráfica (PNG)'; b.style.marginTop = '8px';
        const msg = document.createElement('span'); msg.className = 'leyenda'; msg.setAttribute('role', 'status'); msg.style.marginLeft = '8px';
        b.addEventListener('click', async () => { const ok = await guardaPNG(c, `${o.carpeta}-grafica${sufijo}.png`); msg.textContent = ok ? 'Imagen guardada' : 'No se ha podido guardar la imagen'; setTimeout(() => { msg.textContent = ''; }, 2500); });
        (l || c).before(b); b.after(msg);
      }
    }
    /* ---------- «Usar en…» ---------- */
    function botonesUsar() {
      if (!o.usar || !o.usar.length) return;
      const card = $('#resumen') && $('#resumen').closest('.card'); if (!card || card.querySelector('.usar-en')) return;
      const caja = document.createElement('div'); caja.className = 'controles usar-en'; caja.setAttribute('role', 'group'); caja.setAttribute('aria-label', 'Usar estos datos en otra herramienta'); caja.style.marginTop = '10px';
      caja.innerHTML = o.usar.map((u, i) => `<a class="btn" href="#" data-i="${i}">Usar en ${esc(u.nombre)} →</a>`).join('');
      card.appendChild(caja);
      caja.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault();
        const u = o.usar[+a.dataset.i]; if (!sol) { const er = $('#error'); er.textContent = 'Corrige primero los datos para poder usarlos en otra herramienta'; er.hidden = false; return; }
        const datos = JSON.stringify(u.datos(sol, sc)), b64 = btoa(unescape(encodeURIComponent(datos))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        location.href = `../${u.a}/#d=${b64}`;
      });
    }
    const leeColores = () => { col = colores(o.colores || []); };
    window.addEventListener('resize', dibuja);
    // tema.js también avisa a este oyente al pulsar el botón claro/oscuro
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { leeColores(); dibuja(); });

    const ver = $('#ver'); if (ver) ver.textContent = Version.de(o.carpeta).current;
    leeColores(); botonesGrafica(); botonesUsar(); formulario(); calcula();
    const enunciado = () => (o.enunciado ? o.enunciado(sc, sol) : undefined);
    return (window[o.app] = { abrirEjemplo, azar, pon, enunciado, resultado: () => sol, estado: () => copia(sc) });
  }
  return { f, num, leeNum, vacio, lee, lista, filas, grafica, rango, colores, monta };
})();
if (typeof module !== 'undefined') module.exports = Calculadora;
