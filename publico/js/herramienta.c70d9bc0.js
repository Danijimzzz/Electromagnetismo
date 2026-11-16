const Herramienta = (() => {
  const $ = (q) => document.querySelector(q);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const PREFIJOS = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9, R: 1 };
  const leeSI = (s, base = 1) => {
    let t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
    const sinUnidad = t.replace(/(Ω|ohmios?|ohms?|Hz|var|VA|V|A|F|H|W|S|s)$/, ''), unidad = sinUnidad !== t;
    t = sinUnidad;
    let m = t.match(/^([+-]?)(\d*)([pnuµμmkKMGR])(\d+)$/);
    if (m) return +`${m[1]}${m[2] || 0}.${m[4]}` * PREFIJOS[m[3]];
    m = t.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([pnuµμmkKMG]?)$/i);
    if (!m) return NaN;
    return +m[1] * (m[2] ? PREFIJOS[m[2]] : unidad ? 1 : base);
  };
  const UNIDADES = { m: 1, Hz: 1, F: 1, H: 1, A: 1, V: 1, 'Ω': 1, ohm: 1, ohmios: 1, T: 1, W: 1, S: 1, s: 1, C: 1, N: 1, J: 1 };
  const PREF_UN = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3, c: 1e-2, k: 1e3, M: 1e6, G: 1e9 };
  const leeUn = (s) => {
    const t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
    const m = t.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(ohmios|ohm|Hz|[mFHAVΩTWSsCNJ]|[pnuµμmckMG](?:Hz|[mFHAVΩTWSsCNJ]))$/);
    if (!m) return undefined;
    const u = m[2];
    if (UNIDADES[u] !== undefined) return +m[1];
    const pre = u[0], r = u.slice(1);
    if (PREF_UN[pre] === undefined || UNIDADES[r] === undefined) return undefined;
    if (pre === 'c' && r !== 'm') return undefined;
    return +m[1] * PREF_UN[pre];
  };
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<[^>]+>/g, '');
  const marcas = (a, b, n = 6) => {
    const p0 = (b - a) / n, e = 10 ** Math.floor(Math.log10(p0)), paso = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0) || 10 * e;
    const out = []; if (!(paso > 0) || !isFinite(paso) || !(b > a)) return out; // paso nulo (desbordamiento) o eje sin rango: nada que marcar
    for (let k = 0, v = Math.ceil(a / paso) * paso; k <= 200 && v <= b + paso * 1e-9; v = Math.ceil(a / paso) * paso + ++k * paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : v);
    return out;
  };
  const lienzo = (c) => {
    if (typeof c === 'string') c = $(c);
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    const cambia = c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr);
    if (cambia) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    return { g, w, h, c, cambia };
  };
  const accesible = (doc = typeof document !== 'undefined' ? document : null) => {
    if (!doc) return;
    const RES = '#resumen, #res, #resumen-d, #resumen-r, #resumen-c, #resumen-este, #resumen-emp, #resumen-nq, #resumen-conf, #res-masa, #res-dil, #res-mez';
    for (const e of doc.querySelectorAll(RES)) if (!e.hasAttribute('aria-live')) e.setAttribute('aria-live', 'polite');
    for (const e of doc.querySelectorAll('.error')) if (!e.hasAttribute('role')) e.setAttribute('role', 'alert');
    const res = doc.querySelector('#resumen, #res');
    if (res) for (const c of doc.querySelectorAll('canvas')) if (!c.hasAttribute('aria-describedby') && !c.closest('#resumen, #res') && !c.hasAttribute('aria-hidden')) c.setAttribute('aria-describedby', res.id);
  };
  accesible();
  const nombreArchivo = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'grafica';
  const celda = (v) => (typeof v === 'number' ? (Number.isFinite(v) ? String(+v.toPrecision(10)).replace('.', ',') : '') : String(v ?? '').replace(/[\t\r\n]+/g, ' '));
  const tabla = (cab, filas) => [cab, ...filas].filter(Boolean).map((f) => f.map(celda).join('\t')).join('\n');
  const color = (nom, otro) => { try { return getComputedStyle(document.documentElement).getPropertyValue(nom).trim() || otro; } catch (e) { return otro; } };
  const png = (c, o = {}) => new Promise((ok, no) => {
    if (typeof c === 'string') c = $(c);
    if (!c || !c.width || !c.height) { no(new Error('la gráfica aún no está dibujada')); return; }
    const k = c.width / (c.clientWidth || c.width), pad = Math.round(12 * k), tam = Math.round(14 * k);
    const titulo = o.titulo || $('h1')?.textContent.trim() || '', pie = 'Ciencify · ' + (typeof location !== 'undefined' && /^https?:/.test(location.protocol) ? location.host + location.pathname : 'ciencias gratis y sin registro');
    const alto = c.height + pad * 2 + tam * 2.4 + (titulo ? tam * 1.6 : 0), z = document.createElement('canvas');
    z.width = c.width + pad * 2; z.height = Math.round(alto);
    const g = z.getContext('2d'), fam = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    g.fillStyle = color('--panel', '#ffffff'); g.fillRect(0, 0, z.width, z.height);
    g.textBaseline = 'top'; let y = pad;
    if (titulo) { g.fillStyle = color('--ink', '#111'); g.font = `600 ${tam}px ${fam}`; g.fillText(titulo, pad, y); y += tam * 1.6; }
    g.drawImage(c, pad, y); y += c.height + pad * 0.5;
    g.fillStyle = color('--muted', '#555'); g.font = `${Math.round(tam * 0.85)}px ${fam}`; g.fillText(pie, pad, y);
    z.toBlob((b) => (b ? ok(b) : no(new Error('el navegador no pudo crear la imagen'))), 'image/png');
  });
  const copiaTexto = async (t) => {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) { /* sin permiso o sin https: se prueba con el método antiguo */ }
    const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.setAttribute('aria-hidden', 'true'); a.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(a); a.select(); let r = false; try { r = document.execCommand('copy'); } catch (e) { r = false; } a.remove(); return r;
  };
  const exportar = (c, o = {}) => {
    if (typeof c === 'string') c = $(c);
    if (!c) return null;
    if (c._exporta) { Object.assign(c._exporta.o, o); return c._exporta.barra; }
    const barra = document.createElement('div'), aviso = document.createElement('span'), cual = o.etiqueta ? ` de ${o.etiqueta}` : '';
    barra.className = 'exportar'; barra.setAttribute('role', 'group'); barra.setAttribute('aria-label', 'Exportar' + cual);
    aviso.className = 'exportar-aviso'; aviso.setAttribute('role', 'status'); aviso.setAttribute('aria-live', 'polite');
    const di = (t) => { aviso.textContent = t; clearTimeout(di.t); di.t = setTimeout(() => { aviso.textContent = ''; }, 3500); };
    const boton = (txt, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = txt; b.setAttribute('aria-label', label); b.addEventListener('click', fn); barra.appendChild(b); return b; };
    boton('Descargar PNG', 'Descargar la gráfica' + cual + ' como imagen PNG', async () => {
      try {
        const b = await png(c, c._exporta.o), a = document.createElement('a');
        a.href = URL.createObjectURL(b); a.download = nombreArchivo(c._exporta.o.nombre || c.id || 'grafica') + '.png'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000); di('Imagen descargada');
      } catch (e) { di('No se pudo crear la imagen: ' + e.message); }
    });
    if (o.datos) boton('Copiar datos', 'Copiar los datos' + cual + ' al portapapeles', async () => {
      let d; try { d = c._exporta.o.datos; d = typeof d === 'function' ? d() : d; } catch (e) { d = null; }
      const t = typeof d === 'string' ? d : d && Array.isArray(d.filas) ? tabla(d.cab, d.filas) : '';
      if (!t) { di('Todavía no hay datos que copiar'); return; }
      di((await copiaTexto(t)) ? 'Datos copiados: pégalos en una hoja de cálculo' : 'No se pudo copiar: el navegador no lo permite');
    });
    barra.appendChild(aviso);
    c._exporta = { o, barra };
    const p = c.parentElement, ref = p && p.children.length === 1 && !p.matches('.card, .layout, .wrap, main, body') ? p : c;
    ref.insertAdjacentElement('afterend', barra);
    return barra;
  };
  if (typeof location !== 'undefined' && typeof Pagina !== 'undefined' && Pagina.guarda) {
    const m = /[#&]d=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (m) {
      try { const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))); JSON.parse(json); localStorage.setItem(Pagina.guarda, json); } catch (e) { /* enlace roto o sin almacenamiento */ }
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
    }
  }
  const enlaceA = (carpeta, estado) => `${carpeta.includes('/') ? '../../' : '../'}${carpeta}/#d=${btoa(unescape(encodeURIComponent(JSON.stringify(estado)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  const ajuste = (() => {
    const CLAVE = 'simu-ajuste', ANTIGUAS = ['quimica-ajuste', 'fisica-constantes'];
    const lee = (k) => { try { const g = JSON.parse(localStorage.getItem(k)); return g && typeof g === 'object' ? g : null; } catch (e) { return null; } };
    const leer = () => {
      const a = lee(CLAVE); if (a) return a;
      const q = lee(ANTIGUAS[0]), f = lee(ANTIGUAS[1]);
      if (!q && !f) return {};
      const m = { ...(q ? { masas: !!q.masas, constantes: q.constantes !== false } : {}), ...(f && f.g ? { g: f.g } : {}) };
      try { localStorage.setItem(CLAVE, JSON.stringify(m)); for (const k of ANTIGUAS) localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ }
      return m;
    };
    const escribe = (parte) => {
      try { localStorage.setItem(CLAVE, JSON.stringify({ ...leer(), ...parte })); } catch (e) { /* sin almacenamiento */ }
      try { dispatchEvent(new Event(CLAVE)); } catch (e) { /* sin ventana */ }
    };
    return { CLAVE, EVENTO: CLAVE, leer, escribe };
  })();
  return { $, esc, copia, vacio, leeSI, leeUn, txt, marcas, lienzo, accesible, exportar, png, tabla, nombreArchivo, enlaceA, ajuste };
})();

