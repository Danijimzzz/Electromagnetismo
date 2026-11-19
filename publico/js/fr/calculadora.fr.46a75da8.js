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
    if (vacio(sc[k])) { if (def !== undefined) return def; throw new Error(`${nom} manque`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${mayus(nom)} doit être un nombre`);
    if (entero && !Number.isInteger(v)) throw new Error(`${mayus(nom)} doit être un nombre entier`);
    if (v < min || (minEx && v === min)) throw new Error(`${mayus(nom)} doit être ${minEx ? 'supérieur à' : 'au moins égal à'} ${String(min).replace('.', ',')}`);
    if (v > max || (maxEx && v === max)) throw new Error(`${mayus(nom)} doit être ${maxEx ? 'inférieur à' : 'au plus égal à'} ${String(max).replace('.', ',')}`);
    return v;
  }
  function lista(texto, nom) {
    const tk = String(texto ?? '').split(/[\s;]+/).filter(Boolean);
    const v = tk.map(leeNum), i = v.findIndex((x) => !isFinite(x));
    if (i >= 0) throw new Error(`Dans ${nom}, « ${tk[i]} » n’est pas un nombre (séparez les valeurs par des espaces ou « ; » et utilisez la virgule décimale)`);
    return v;
  }
  function filas(texto, n, nom) {
    const out = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const tk = (/[;\t]/.test(l) ? l.split(/\s*[;\t]\s*/) : l.split(/\s+/)).filter((t) => t !== ''), v = tk.map(leeNum);
      if (!out.length && v.some((x) => !isFinite(x)) && tk.some((t) => /[a-zñáéíóú]/i.test(t))) return; // cabecera
      if (tk.length !== n) throw new Error(`${mayus(nom)}, ligne ${i + 1} : saisissez ${n} nombres séparés par des espaces, des tabulations ou « ; »`);
      if (v.some((x) => !isFinite(x))) throw new Error(`${mayus(nom)}, ligne ${i + 1} : « ${l} » ne sont pas des nombres`);
      out.push(v);
    });
    return out;
  }

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
  const rango = (vals, { cero = false, aire = 0.08 } = {}) => {
    const v = vals.filter(isFinite); let a = Math.min(...v, ...(cero ? [0] : [])), b = Math.max(...v, ...(cero ? [0] : []));
    if (!isFinite(a)) return [0, 1];
    const m = (b - a || Math.abs(b) || 1) * aire;
    return [cero && a >= 0 ? 0 : a - m, cero && b <= 0 ? 0 : b + m];
  };
  const colores = (extra = []) => { const cs = getComputedStyle(document.documentElement), col = {}; for (const k of ['--ink', '--muted', '--line', '--accent', '--serie-1', '--serie-2', '--serie-3', ...extra]) col[k] = cs.getPropertyValue(k).trim(); return col; };


  const puntosSeries = (cfg) => { if (!cfg) return null; const filas = []; (cfg.series || []).forEach((q, i) => (q.pts || []).forEach(([x, y]) => filas.push([`Série ${i + 1}`, +x.toFixed(6), +y.toFixed(6)]))); return filas.length ? { cab: ['Série', cfg.ejeX || 'x', cfg.ejeY || 'y'], filas } : null; };
  function monta(o) {
    const { $, esc, copia } = Herramienta;
    const C = o.C, CLAVE = `${o.carpeta}-v1`;
    let sc = copia(C.ejemplos[0].sc);
    try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
    const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
    let sol = null, col = {};

    const campo = (c) => {
      const id = `f-${c.k}`, v = sc[c.k] ?? '';
      const et = `<label for="${id}"${c.tipo === 'area' ? ' class="ancho"' : ''}>${c.nom}${c.un ? ` <small>(${c.un})</small>` : ''}${c.ayuda ? ` <small>${c.ayuda}</small>` : ''}</label>`;
      if (c.tipo === 'sel') return et + `<select id="${id}" class="in" data-k="${c.k}">${c.ops.map(([val, t]) => `<option value="${val}"${val === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
      if (c.tipo === 'area') return et + `<textarea id="${id}" class="in ancho" data-k="${c.k}" rows="${c.filas || 7}" spellcheck="false" autocomplete="off">${esc(v)}</textarea>`;
      return et + `<input id="${id}" class="in" data-k="${c.k}" value="${esc(v)}"${c.tipo === 'texto' ? '' : ' inputmode="decimal"'} autocomplete="off">`;
    };
    function formulario() {
      const cs = o.campos(sc);
      for (const c of cs) if (c.tipo === 'sel' && !c.ops.some(([val]) => val === sc[c.k])) sc[c.k] = c.ops[0][0];
      $('#campos').innerHTML = cs.map((c) => (c.sep ? `<div class="sep">${c.sep}</div>` : '') + (c.k ? campo(c) : '')).join(''); // un {sep} suelto es solo un título: sin campo fantasma «undefined»
      if (o.acciones && !$('#acciones')) { const d = document.createElement('div'); d.id = 'acciones'; d.className = 'controles'; d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Raccourcis'); d.style.margin = '8px 0'; $('#nota').after(d); }
      if (o.nota) $('#nota').innerHTML = typeof o.nota === 'function' ? o.nota(sc) : o.nota;
    }
    $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k || t.tagName === 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
    $('#campos').addEventListener('change', (e) => { const t = e.target; if (!t.dataset.k || t.tagName !== 'SELECT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; formulario(); calcula(); });

    const sel = $('#ejemplos');
    sel.innerHTML = '<option value="">Exemples…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
    sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
    function abrirEjemplo(clave) {
      const e = C.ejemplos.find((x) => x.clave === clave);
      if (!e) return;
      sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
    }
    function azar() { if (!o.azar) return; sc = o.azar(); formulario(); calcula(); sel.value = ''; }
    function pon(cambios) { Object.assign(sc, cambios); formulario(); calcula(); sel.value = ''; }

    let accs = [];
    function pintaAcciones() {
      const d = $('#acciones'); if (!d) return;
      accs = o.acciones(sol, sc) || [];
      d.innerHTML = accs.map((a, i) => `<button type="button" class="btn" style="white-space:normal;text-align:left" data-i="${i}">${a.texto}</button>`).join('');
    }
    document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('#acciones button[data-i]'); if (b && accs[+b.dataset.i]) pon(accs[+b.dataset.i].cambios); });

    function calcula() {
      const err = $('#error');
      let filas;
      try {
        sol = C.resolver(sc); filas = o.resumen(sol);
        if (/\b(NaN|Infinity)\b/.test(JSON.stringify([filas, sol.pasos]))) throw new Error('Avec ces données, le résultat sort de la plage calculable (trop grand, trop petit ou indéfini). Essayez des valeurs plus modérées.');
      } catch (e) {
        sol = null; err.textContent = e.message; err.hidden = false;
        if ($('#acciones')) $('#acciones').innerHTML = '';
        for (const s of ['#resumen', '#pasos', '#leyenda', '#tabla', '#usar-en']) { const el = $(s); if (el) el.innerHTML = ''; }
        dibuja(); return;
      }
      err.hidden = true; guarda();
      pintaAcciones();
      $('#resumen').innerHTML = filas.map(([t, v, ancho]) => `<div${ancho ? ' class="ancho"' : ''}><span>${t}</span><b>${v}</b></div>`).join('');
      if (o.usarEn) {
        let ue = $('#usar-en');
        if (!ue) { ue = document.createElement('div'); ue.id = 'usar-en'; ue.className = 'controles'; ue.setAttribute('role', 'group'); ue.setAttribute('aria-label', 'Utiliser le résultat dans un autre outil'); $('#resumen').insertAdjacentElement('afterend', ue); }
        ue.innerHTML = (o.usarEn(sol, sc) || []).map((l) => `<a class="btn" data-usar="${esc(l.carpeta)}" href="${esc(Herramienta.enlaceA(l.carpeta, l.estado))}">${l.texto}</a>`).join('');
      }
      $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
      const tb = $('#tabla'); if (tb) { const h = o.tabla ? o.tabla(sol) : ''; tb.innerHTML = h; tb.closest('.card').hidden = !h; }
      $('#leyenda').innerHTML = o.leyenda ? o.leyenda(sol) : '';
      dibuja();
    }

    function dibuja() {
      const c = $('#grafica'); if (!c) return;
      const cfg = sol && o.grafica ? o.grafica(sol, col) : null;
      cfgs['#grafica'] = cfg;
      if (sol && o.grafica) { const cd = c.closest('.card'); if (cd) cd.hidden = !cfg; }
      if (!cfg) Herramienta.lienzo(c);
      else { const r = grafica(c, cfg, col); if (r && o.despues) o.despues(r, sol, col); }
      const c2 = $('#grafica2');
      if (c2) {
        const cfg2 = sol && o.grafica2 ? o.grafica2(sol, col) : null, card = c2.closest('.card');
        cfgs['#grafica2'] = cfg2;
        if (card) card.hidden = !cfg2;
        if (!cfg2) Herramienta.lienzo(c2);
        else { const r2 = grafica(c2, cfg2, col); if (r2 && o.despues2) o.despues2(r2, sol, col); }
        const l2 = $('#leyenda2'); if (l2) l2.innerHTML = cfg2 && o.leyenda2 ? o.leyenda2(sol) : '';
      }
    }
    let cfgs = {};
    function botonesGrafica() {
      for (const [id, ley, sufijo] of [['#grafica', '#leyenda', ''], ['#grafica2', '#leyenda2', '-2']]) {
        const c = $(id); if (!c) continue;
        c.setAttribute('role', 'img'); const l = $(ley); if (l) c.setAttribute('aria-describedby', l.id);
        Herramienta.exportar(c, { nombre: `${o.carpeta}${sufijo}`, titulo: (c.closest('.card')?.querySelector('h2')?.textContent || '').trim(), datos: () => {
          const cfg = cfgs[id]; if (!cfg) return null;
          if (id === '#grafica' && o.datosExporta) { const propios = o.datosExporta(sol); if (propios) return propios; }
          const filas = []; (cfg.series || []).forEach((sr, k) => { if (sr.tipo === 'barras' || sr.tipo === 'puntos' || !sr.tipo || sr.tipo === 'linea' || sr.tipo === 'area') for (const [x, y] of sr.pts) filas.push([`Série ${k + 1}${sr.tipo === 'puntos' ? ' (points)' : ''}`, x, y]); });
          return { cab: ['Série', cfg.ejeX || 'x', cfg.ejeY || 'y'], filas };
        } });
      }
    }
    const leeColores = () => { col = colores(o.colores || []); };
    window.addEventListener('resize', dibuja);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { leeColores(); dibuja(); });

    const ver = $('#ver'); if (ver) ver.textContent = Version.de(o.carpeta).current;
    leeColores(); botonesGrafica(); formulario(); calcula();
    const enunciado = () => (o.enunciado ? o.enunciado(sc, sol) : undefined);
    return (window[o.app] = { abrirEjemplo, azar, pon, enunciado, resultado: () => sol, estado: () => copia(sc) });
  }
  return { f, num, leeNum, vacio, lee, lista, filas, grafica, rango, colores, monta };
})();

