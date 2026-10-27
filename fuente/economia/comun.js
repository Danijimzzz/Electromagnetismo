/* =====================================================================
   Común de las herramientas de Economía (Eco): formato de números, euros y
   porcentajes, lectura de campos, listas y tablas, y una gráfica sencilla
   (líneas, puntos y barras) para el <canvas>. Lo cargan antes de su
   calculo.js las herramientas de fuente/<clave>/ de Economía (ver «scripts»
   en catalogo.js); en Node, cada calculo.js lo pide con require.
     f(x, d)          número con coma decimal, d cifras significativas y ·10ⁿ
     num(x, dec)      número con dec decimales fijos y punto de miles (1.234,50)
     dinero(x, dec)   «1.234,56 €»
     pct(x, dec)      fracción → «3,25 %»
     leeNum(s)        número de un campo: coma o punto decimal, 3e8, 3·10^8,
                      espacios y un % o € al final (se quitan)
     lee(sc, k, nom, { min, minEx, max, maxEx, entero, def })   campo validado
                      (def: valor si está vacío; si no, «Falta …»)
     lista(texto, nom)   números separados por espacios, «;» o saltos de línea
     filas(texto, n, nom) tabla de n columnas (una fila por línea; se salta
                      una cabecera de texto)
     grafica(canvas, cfg, col)   ejes, rejilla y series; devuelve { X, Y, g }
   ===================================================================== */
const Eco = (() => {
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
  const dinero = (x, dec = 2) => `${num(x, dec)} €`;
  const pct = (x, dec = 2) => `${num(100 * x, dec)} %`;
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

  return { f, num, dinero, pct, leeNum, vacio, lee, lista, filas, grafica, rango, colores };
})();
if (typeof module !== 'undefined') module.exports = Eco;
