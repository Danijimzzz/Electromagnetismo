/* =====================================================================
   Configuración electrónica: interfaz. El cálculo está en
   quimica/configuracion.js (Configuracion) y quimica/elementos.js.
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const C = Configuracion, LETRA = 'spdf', CAPAS = 'KLMNOPQ';
  const SUP = (k) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CLAVE = 'configuracion-v1';
  const cargaTxt = (q) => (q ? `<sup>${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}</sup>` : '');

  const entrada = $('#entrada');
  // estado: la pestaña y lo escrito en cada una (antes solo se guardaba el texto del elemento)
  let st = { tab: 'el', entrada: 'Fe', conf: '[Ar] 4s2 3d5', nq: { n: '3', l: '2', ml: '-2', ms: '+1/2' } };
  try { const g = localStorage.getItem(CLAVE); if (g) { let o = null; try { o = JSON.parse(g); } catch (e) {} st = o && typeof o === 'object' ? { ...st, ...o } : { ...st, entrada: g }; } } catch (e) {}
  if (location.hash.length > 1) st.entrada = decodeURIComponent(location.hash.slice(1));
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) {} };
  entrada.value = st.entrada;
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + C.ejemplos.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) { pestana('el'); entrada.value = sel.value; muestra(); } });
  entrada.addEventListener('input', () => { sel.value = ''; muestra(); });

  /* ---------- Pestañas ---------- */
  function pestana(t) {
    st.tab = t;
    for (const k of ['el', 'conf', 'nq']) { $('#tab-' + k).setAttribute('aria-selected', t === k); $('#s-' + k).hidden = t !== k; }
    guarda();
  }
  for (const k of ['el', 'conf', 'nq']) $('#tab-' + k).addEventListener('click', () => pestana(k));
  addEventListener('hashchange', () => { if (location.hash.length > 1) { entrada.value = decodeURIComponent(location.hash.slice(1)); muestra(); } });

  function muestra() {
    const err = $('#error');
    let r;
    try { r = C.analizar(entrada.value); } catch (e) { err.textContent = e.message; err.hidden = false; return; }
    err.hidden = true;
    st.entrada = entrada.value; guarda();
    history.replaceState(null, '', '#' + encodeURIComponent(entrada.value.trim()));
    const el = r.el, q = r.carga;
    $('#z').textContent = el.Z;
    $('#sim').innerHTML = el.simbolo + cargaTxt(q);
    $('#nombre').textContent = q ? `Ion ${el.nombre.toLowerCase()} ${q > 0 ? `(${q}+)` : `(${-q}−)`}` : el.nombre;
    $('#subtitulo').textContent = `Z = ${el.Z} · ${r.electrones} electrones · ${el.categoria}${el.grupo ? ` · grupo ${el.grupo}` : ''} · periodo ${el.periodo} · bloque ${r.bloque}`;
    $('#llenado').textContent = r.porLlenado || '(sin electrones)';
    $('#abreviada').textContent = r.abreviada;
    $('#capas-txt').textContent = r.porCapas;
    $('#capas').textContent = r.capas.map((k, i) => `${CAPAS[i]} (n = ${i + 1}): ${k}`).join(' · ');
    $('#valencia').textContent = `n = ${r.capaValencia}, con ${r.electronesValencia} electr${r.electronesValencia === 1 ? 'ón' : 'ones'}`;
    $('#desap').textContent = `${r.desapareados} · ${r.magnetismo}`;
    $('#val-e').textContent = `${r.valencia.n} (${r.valencia.texto})`;
    const sl = r.slater, coma = (x) => String(+x.toFixed(2)).replace('.', ',');
    $('#zef').innerHTML = sl ? `Z<sub>ef</sub> = ${coma(sl.Zef)} para un electrón ${sl.orbital}` : '—';
    $('#slater').innerHTML = sl ? `Para un electrón ${sl.orbital}: S = ${sl.partes.join(' + ') || '0'} = ${coma(sl.S)}, &nbsp; Z<sub>ef</sub> = Z − S = ${el.Z} − ${coma(sl.S)} = <b>${coma(sl.Zef)}</b>` : '';
    $('#iso').innerHTML = [...r.isoelectronicos].sort((a, b) => a.Z - b.Z).map((x) => `<span class="${x.Z === el.Z && x.carga === q ? 'yo' : ''}">${x.simbolo}${cargaTxt(x.carga)}<small>Z<sub>ef</sub> ${coma(x.zef)}</small></span>`).join('');
    $('#tabla-nq').innerHTML = r.cuanticos.length ? `<thead><tr><th>Orbital</th><th>n</th><th>l</th><th>m<sub>l</sub></th><th>s</th></tr></thead><tbody>${r.cuanticos.map((c) => `<tr><td>${c.orbital}</td><td>${c.n}</td><td>${c.l}</td><td>${String(c.ml).replace('-', '−')}</td><td>${c.ms}</td></tr>`).join('')}</tbody>` : '<tbody><tr><td>Sin electrones de valencia</td></tr></tbody>';
    const ex = $('#excepcion');
    ex.hidden = !r.excepcion;
    if (r.excepcion) ex.innerHTML = `<b>Excepción al orden de llenado.</b> Por la regla se esperaría ${esc(r.cambio.esperada)}, pero tiene ${esc(r.cambio.real)}: ${/d[⁵]|d¹⁰|f⁷|f¹⁴/.test(r.cambio.real) ? 'un subnivel lleno o semilleno es más estable' : 'los dos subniveles tienen energías muy parecidas y la repulsión entre electrones decide el reparto'}.`;
    $('#en-tabla').href = '../tabla-periodica/#' + el.simbolo;
    moeller(r); orbitales(r);
  }

  /* ---------- Diagrama de Moeller ---------- */
  function moeller(r) {
    const svg = $('#moeller'), ocupados = new Map(r.cajas.map((c) => [c.nombre, c.e]));
    const X = (l) => 42 + l * 66, Y = (n) => 22 + (n - 1) * 40;
    let h = '';
    // diagonales n + l = cte, de arriba a la derecha hacia abajo a la izquierda
    for (let s = 1; s <= 8; s++) {
      const celdas = [];
      for (let l = 3; l >= 0; l--) { const n = s - l; if (n > l && n >= 1 && n <= 7) celdas.push([n, l]); }
      if (!celdas.length) continue;
      const [a, b] = [celdas[0], celdas[celdas.length - 1]];
      const x1 = X(a[1]) + 16, y1 = Y(a[0]) - 12, x2 = X(b[1]) - 20, y2 = Y(b[0]) + 16;
      h += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--line)" stroke-width="2" marker-end="url(#punta)"/>`;
    }
    let orden = 0;
    const num = {};
    for (const o of C.ORDEN) if (ocupados.has(o)) num[o] = ++orden;
    for (let n = 1; n <= 7; n++) for (let l = 0; l < Math.min(n, 4); l++) {
      const o = `${n}${LETRA[l]}`, e = ocupados.get(o);
      if (e) h += `<rect x="${X(l) - 24}" y="${Y(n) - 15}" width="48" height="28" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/>`;
      h += `<text x="${X(l)}" y="${Y(n) + 5}" text-anchor="middle" font-family="STIX Two Text, serif" font-size="16" fill="${e ? 'var(--ink)' : 'var(--muted)'}">${o}${e ? `<tspan font-size="11" dy="-7">${e}</tspan>` : ''}</text>`;
      if (e) h += `<text x="${X(l) + 21}" y="${Y(n) + 10}" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="8" fill="var(--accent)">${num[o]}</text>`;
    }
    svg.innerHTML = `<defs><marker id="punta" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--line)"/></marker></defs>${h}`;
  }

  /* ---------- Orbitales con flechas ---------- */
  function orbitales(r) {
    $('#orbitales').innerHTML = r.cajas.map((c) => `<div class="subnivel"><div class="cajas">${c.orbitales.map((k) => `<span class="caja${k === 1 ? ' uno' : ''}">${k === 2 ? '↑↓' : k === 1 ? '↑' : ''}</span>`).join('')}</div><small>${c.nombre}${SUP(c.e)}</small></div>`).join('');
    const d = r.diferenciador;
    $('#cuanticos').innerHTML = d ? [['n', d.n, 'principal'], ['l', d.l, `secundario (${LETRA[d.l]})`], ['m<sub>l</sub>', String(d.ml).replace('-', '−'), 'magnético'], ['s', d.ms, 'espín']].map(([a, b, c]) => `<div><span>${a}</span><b>${b}</b><span>${c}</span></div>`).join('') : '';
  }

  /* ---------- ¿Qué elemento es? ---------- */
  const confTxt = $('#conf-txt');
  confTxt.value = st.conf;
  confTxt.addEventListener('input', () => { st.conf = confTxt.value; guarda(); identifica(); });
  function identifica() {
    const err = $('#error-conf');
    let r;
    try { r = C.identificar(confTxt.value); } catch (e) { err.textContent = e.message; err.hidden = false; $('#resumen-conf').innerHTML = ''; $('#conf-exp').innerHTML = ''; return; }
    err.hidden = true;
    const TIPO = { fundamental: 'Estado fundamental', excitada: 'Estado excitado', imposible: 'Imposible' };
    $('#resumen-conf').innerHTML = `<div><span>Electrones</span><b>${r.ne}</b></div><div><span>Es</span><b>${TIPO[r.tipo]}</b></div>${r.el ? `<div><span>Elemento neutro</span><b>${r.el.nombre} (${r.el.simbolo}, Z = ${r.el.Z})</b></div>` : ''}`;
    let h;
    if (r.tipo === 'imposible') h = `No puede ser: ${r.problemas.join('; ')}.`;
    else {
      h = `Con ${r.ne} electrones, si el átomo es neutro es el <b>${r.el.nombre.toLowerCase()}</b>. `;
      h += r.tipo === 'fundamental' ? 'Es su configuración en el estado fundamental.' : `No es su estado fundamental, ${esc(r.fundamental)}: hay electrones en subniveles más altos con huecos por debajo, así que es un <b>estado excitado</b> (se llega a él absorbiendo energía).`;
      if (r.iones.length) h += ` La misma configuración la tiene${r.iones.length > 1 ? 'n' : ''}, en su estado fundamental, ${r.iones.map((x) => `el ion ${x.simbolo}${cargaTxt(x.carga)}`).join(', ')}.`;
    }
    $('#conf-exp').innerHTML = h;
  }

  /* ---------- Números cuánticos ---------- */
  for (const k of ['n', 'l', 'ml', 'ms']) { const x = $('#nq-' + k); x.value = st.nq[k] ?? ''; x.addEventListener('input', () => { st.nq[k] = x.value; guarda(); nq(); }); }
  function nq() {
    const r = C.cuanticos(st.nq);
    $('#error-nq').hidden = true;
    $('#resumen-nq').innerHTML = `<div><span>¿Está permitido?</span><b>${r.valido ? 'Sí' : 'No'}</b></div>${r.valido ? `<div><span>Orbital</span><b>${r.orbital}</b></div>` : ''}${r.maximo ? `<div><span>Electrones en la capa n = ${r.n}</span><b>${r.maximo}</b></div>` : ''}`;
    $('#nq-exp').innerHTML = r.valido ? `Es un electrón de un orbital ${r.orbital} (n = ${r.n}, l = ${r.l}: subnivel ${'spdfghik'[r.l]}), en el orbital de m<sub>l</sub> = ${String(r.ml).replace('-', '−')} y con espín ${r.ms > 0 ? '+½' : '−½'}. El subnivel tiene ${2 * r.l + 1} orbital${r.l ? 'es' : ''} y caben ${2 * (2 * r.l + 1)} electrones.` : `No es posible: ${r.fallos.join('; ')}.`;
  }

  /* ---------- Modo práctica ---------- */
  const toma = (xs) => xs[Math.floor(Math.random() * xs.length)];
  function azar() {
    if (st.tab === 'conf') {
      const Z = 3 + Math.floor(Math.random() * 34), c = Elementos.configuracion(Z).map((o) => ({ ...o }));
      // a veces un estado excitado: un electrón del último subnivel sube al siguiente
      if (Math.random() < 0.4) { const u = c[c.length - 1]; u.e--; c.push({ nombre: C.ORDEN[C.ORDEN.indexOf(u.nombre) + 1], e: 1 }); }
      confTxt.value = st.conf = c.filter((o) => o.e > 0).map((o) => o.nombre + o.e).join(' '); guarda(); identifica(); return;
    }
    if (st.tab === 'nq') return; // sin números que calcular
    pestana('el'); entrada.value = String(1 + Math.floor(Math.random() * 56)); muestra();
  }
  const enunciado = () => (st.tab === 'conf' ? `¿Cuántos electrones tiene la configuración <b>${esc(confTxt.value)}</b> y de qué elemento neutro es? ¿Es su estado fundamental?` : null);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('configuracion-electronica').current;
  muestra(); identifica(); nq(); pestana(st.tab);
  window.ConfigApp = { muestra: (x) => { pestana('el'); entrada.value = x; muestra(); }, identifica: (x) => { pestana('conf'); confTxt.value = st.conf = x; identifica(); }, cuanticos: (o) => { pestana('nq'); Object.assign(st.nq, o); for (const k of ['n', 'l', 'ml', 'ms']) $('#nq-' + k).value = st.nq[k]; nq(); }, pestana, azar, enunciado, estado: () => st };
})();
