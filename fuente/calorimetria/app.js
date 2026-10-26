/* =====================================================================
   Calorimetría: interfaz (lista de cuerpos, equilibrio, tabla de calores,
   curvas de calentamiento y desarrollo; problemas al revés con «?») y
   pestaña de dilatación térmica. El cálculo está en fisica.js (Calor).
   ===================================================================== */
(() => {
  const { $, esc } = Herramienta;
  const K = Calor, f = K.f;
  const CLAVE = 'calorimetria-v1', MAX = 5;
  const COL = ['--c1', '--c2', '--c3', '--c4', '--c5'];
  const txt = (s) => String(s).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '');
  const coma = (v) => String(v ?? '').replace('.', ',');
  // campos de cada cuerpo según la sustancia
  const CAMPOS = [
    { k: 'm', nom: 'Masa', u: 'g', si: (s) => s !== 'calorimetro' && s !== 'calentador' },
    { k: 'C', nom: 'Capacidad calorífica C', u: 'J/K', si: (s) => s === 'calorimetro' },
    { k: 'me', nom: 'o equivalente en agua', u: 'g', si: (s) => s === 'calorimetro' },
    { k: 'P', nom: 'Potencia P', u: 'W', si: (s) => s === 'calentador' },
    { k: 't', nom: 'Tiempo t', u: 's', si: (s) => s === 'calentador' },
    { k: 'eta', nom: 'Rendimiento η', u: '%', si: (s) => s === 'calentador' },
    { k: 'T0', nom: 'Temperatura inicial', u: '°C', si: (s) => s !== 'calentador' },
    { k: 'estado', nom: 'Estado inicial', sel: [['', 'Automático'], ['solido', 'Sólido'], ['liquido', 'Líquido'], ['gas', 'Gas']], si: (s) => !['calorimetro', 'vidrio', 'laton', 'aceite', 'calentador'].includes(s) },
    { k: 'nombre', nom: 'Nombre', si: (s) => s === 'otra', texto: true },
    { k: 'cs', nom: 'c del sólido', u: 'J/(kg·K)', si: (s) => s === 'otra' },
    { k: 'cl', nom: 'c del líquido', u: 'J/(kg·K)', si: (s) => s === 'otra' },
    { k: 'cg', nom: 'c del gas', u: 'J/(kg·K)', si: (s) => s === 'otra' },
    { k: 'Tf', nom: 'Temperatura de fusión', u: '°C', si: (s) => s === 'otra' },
    { k: 'Lf', nom: 'Calor latente de fusión', u: 'J/kg', si: (s) => s === 'otra' },
    { k: 'Tv', nom: 'Temperatura de ebullición', u: '°C', si: (s) => s === 'otra' },
    { k: 'Lv', nom: 'Calor latente de vaporización', u: 'J/kg', si: (s) => s === 'otra' },
  ];

  const BASE_D = { tipo: 'lineal', mat: 'acero', coef: '', rec: 'vidrio', medida: '', T0: '20', T1: '', objetivo: '' };
  let cuerpos = K.ejemplos[0].cuerpos.map((c) => ({ ...c })), Tfin = '', tab = 'mezcla', dil = { ...BASE_D, ...K.ejemplosDil[0].sc };
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (Array.isArray(g) && g.length) cuerpos = g; // estado antiguo: solo la lista de cuerpos
    else if (g && Array.isArray(g.cuerpos) && g.cuerpos.length) { cuerpos = g.cuerpos; Tfin = g.Tfin || ''; tab = g.tab === 'dilatacion' ? 'dilatacion' : 'mezcla'; dil = { ...BASE_D, ...g.dil }; }
  } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify({ cuerpos, Tfin, tab, dil })); } catch (e) {} };
  let res = null;
  const col = {};
  const colores = () => { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', ...COL]) col[k] = cs.getPropertyValue(k).trim(); };

  /* ---------- Formulario ---------- */
  function pinta() {
    $('#cuerpos').innerHTML = cuerpos.map((c, i) => {
      const s = c.sustancia || 'agua';
      const filas = CAMPOS.filter((x) => !x.si || x.si(s)).map((x) => {
        const id = `c${i}-${x.k}`;
        const ctl = x.sel ? `<select id="${id}" class="in" data-i="${i}" data-k="${x.k}">${x.sel.map(([v, t]) => `<option value="${v}"${(c[x.k] || '') === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`
          : `<input id="${id}" class="in" data-i="${i}" data-k="${x.k}" value="${esc(x.texto ? c[x.k] : coma(c[x.k]))}" autocomplete="off">`;
        return `<label for="${id}">${x.nom}${x.u ? ` <small>(${x.u})</small>` : ''}</label>${ctl}`;
      }).join('');
      return `<div class="cuerpo" style="--cc:var(${COL[i % COL.length]})"><div class="cab"><span>Cuerpo ${i + 1}</span>${cuerpos.length > 2 ? `<button class="quita" type="button" data-quita="${i}" aria-label="Quitar el cuerpo ${i + 1}">×</button>` : ''}</div>
        <div class="campos"><label for="c${i}-sustancia">Sustancia</label><select id="c${i}-sustancia" class="in" data-i="${i}" data-k="sustancia">${Object.entries(K.SUSTANCIAS).map(([k, v]) => `<option value="${k}"${k === s ? ' selected' : ''}>${v.nombre}</option>`).join('')}</select>${filas}</div></div>`;
    }).join('');
    $('#anade').hidden = cuerpos.length >= MAX;
  }
  $('#cuerpos').addEventListener('input', (e) => {
    const t = e.target, i = +t.dataset.i, k = t.dataset.k;
    if (k === undefined) return;
    cuerpos[i][k] = t.value;
    $('#ejemplos').value = '';
    if (k === 'sustancia') { pinta(); const n = document.getElementById(`c${i}-sustancia`); if (n) n.focus(); }
    calcula(true);
  });
  $('#cuerpos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quita]'); if (!b) return;
    cuerpos.splice(+b.dataset.quita, 1); $('#ejemplos').value = ''; pinta(); calcula(true);
  });
  $('#anade').addEventListener('click', () => { if (cuerpos.length >= MAX) return; cuerpos.push({ sustancia: 'agua', m: '100', T0: '20' }); $('#ejemplos').value = ''; pinta(); calcula(true); });
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + K.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = K.ejemplos.find((x) => x.clave === clave); if (!e) return;
    cuerpos = e.cuerpos.map((c) => ({ ...c })); Tfin = e.Tfin || ''; $('#tfin').value = coma(Tfin); pinta(); sel.value = clave; pestana('mezcla'); calcula(true);
  }
  $('#tfin').addEventListener('input', (e) => { Tfin = e.target.value; $('#ejemplos').value = ''; calcula(true); });

  /* ---------- Resultados ---------- */
  function calcula(guardar) {
    const err = $('#error');
    try { res = K.resolver({ cuerpos, Tfin }); } catch (e) {
      err.textContent = e.message; err.hidden = false; res = null;
      for (const id of ['#te', '#estados', '#tabla', '#balance', '#pasos', '#ley-curvas']) $(id).innerHTML = '';
      lienzo($('#curvas'));
      return;
    }
    err.hidden = true;
    if (guardar) guarda();
    const I = res.incognita;
    const sin = I ? I.nombre.replace(/^(el|la|las) /, '') : '';
    $('#te').innerHTML = I ? `${esc(sin[0].toUpperCase() + sin.slice(1))} = ${f(I.valor)} ${esc(I.unidad)} <small>(${esc(I.quien)})</small>`
      : `T<sub>e</sub> = ${f(res.Te)} °C <small>${res.enCambio ? '(no llega para completar el cambio de fase)' : ''}</small>`;
    $('#estados').innerHTML = (I ? `<li>Equilibrio a T<sub>e</sub> = ${f(res.Te)} °C</li>` : '') + res.cuerpos.map((c) => `<li>${esc(c.nombre)}: ${c.b.calentador ? c.estado : c.b.C !== undefined ? `calorímetro ${c.estado}` : `al final, ${c.estado}`}</li>`).join('');
    $('#tabla').innerHTML = `<thead><tr><th>Cuerpo</th><th>T inicial (°C)</th><th>Q (J)</th><th></th></tr></thead><tbody>${res.cuerpos.map((c, i) => `<tr><td><span style="color:var(${COL[i % COL.length]})">●</span> ${esc(c.nombre)}</td><td>${c.b.calentador ? '—' : f(c.b.T0)}</td><td>${f(c.Q)}</td><td>${Math.abs(c.Q) < 1e-9 ? '' : c.Q > 0 ? 'absorbe' : 'cede'}</td></tr>`).join('')}<tr><td><b>Total</b></td><td></td><td><b>${f(res.cuerpos.reduce((s, c) => s + c.Q, 0))}</b></td><td></td></tr></tbody>`;
    const tot = res.cedido + res.absorbido || 1;
    $('#balance').innerHTML = `<span style="width:${(100 * res.cedido) / tot}%;background:var(--calor)"></span><span style="flex:1;background:var(--frio)"></span>`;
    $('#pasos').innerHTML = res.pasos.map((p) => `<li><strong>${esc(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#ley-curvas').innerHTML = res.cuerpos.map((c, i) => `<span><i style="background:var(${COL[i % COL.length]})"></i>${esc(c.nombre)}</span>`).join('') + '<span>· eje horizontal: calor absorbido (kJ)</span>';
    dibuja();
  }

  const lienzo = (c) => Herramienta.lienzo(c);
  const paso = (rango, n = 5) => { const r = rango / n, p = 10 ** Math.floor(Math.log10(r || 1)), m = r / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  function dibuja() {
    if (!res) return;
    const { g, w, h } = lienzo($('#curvas'));
    const curvas = res.cuerpos.map((c) => (c.b.calentador ? [] : K.curva(c).map(([q, T]) => [q / 1000, T])));
    let q0 = 0, q1 = 0, T0 = res.Te, T1 = res.Te;
    for (const cv of curvas) for (const [q, T] of cv) { q0 = Math.min(q0, q); q1 = Math.max(q1, q); T0 = Math.min(T0, T); T1 = Math.max(T1, T); }
    if (q1 - q0 < 1e-9) { q0 -= 1; q1 += 1; }
    if (T1 - T0 < 1e-9) { T0 -= 1; T1 += 1; }
    const mT = (T1 - T0) * 0.08; T0 -= mT; T1 += mT;
    const l = 46, r = 12, top = 10, b = 24;
    const X = (q) => l + ((q - q0) / (q1 - q0)) * (w - l - r), Y = (T) => h - b - ((T - T0) / (T1 - T0)) * (h - top - b);
    g.font = '11px "IBM Plex Mono", monospace'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    g.textAlign = 'right'; g.textBaseline = 'middle';
    const sT = paso(T1 - T0, 5);
    for (let T = Math.ceil(T0 / sT) * sT; T <= T1; T += sT) { g.beginPath(); g.moveTo(l, Y(T)); g.lineTo(w - r, Y(T)); g.stroke(); g.fillText(txt(f(T, 3)), l - 4, Y(T)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    const sQ = paso(q1 - q0, 6);
    for (let q = Math.ceil(q0 / sQ) * sQ; q <= q1 + 1e-9; q += sQ) g.fillText(txt(f(q, 3)), X(q), h - b + 5);
    g.textAlign = 'left'; g.fillText('°C', 4, top - 4);
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(0), top); g.lineTo(X(0), h - b); g.stroke();
    // temperatura de equilibrio
    g.setLineDash([4, 3]); g.strokeStyle = col['--ink']; g.beginPath(); g.moveTo(l, Y(res.Te)); g.lineTo(w - r, Y(res.Te)); g.stroke(); g.setLineDash([]);
    g.lineWidth = 2.4; g.lineJoin = 'round';
    curvas.forEach((cv, i) => {
      if (!cv.length) return;
      g.strokeStyle = col[COL[i % COL.length]]; g.beginPath();
      cv.forEach(([q, T], k) => (k ? g.lineTo(X(q), Y(T)) : g.moveTo(X(q), Y(T)))); g.stroke();
      g.fillStyle = col[COL[i % COL.length]]; g.beginPath(); g.arc(X(cv[0][0]), Y(cv[0][1]), 3.5, 0, 2 * Math.PI); g.fill();
    });
  }
  /* ---------- Pestañas ---------- */
  function pestana(t) {
    tab = t; guarda();
    for (const k of ['mezcla', 'dilatacion']) { $('#tab-' + k).setAttribute('aria-selected', t === k); $('#panel-' + k).hidden = t !== k; }
    if (t === 'mezcla') dibuja(); else dibujaD();
  }
  for (const k of ['mezcla', 'dilatacion']) $('#tab-' + k).addEventListener('click', () => pestana(k));

  /* ---------- Dilatación ---------- */
  const CAMPOS_D = [
    { k: 'tipo', nom: 'Dilatación', sel: [['lineal', 'Lineal (una barra)'], ['superficial', 'Superficial (una chapa)'], ['volumen', 'De volumen'], ['rebose', 'Líquido que rebosa del recipiente']] },
    { k: 'mat', nom: 'Material', sel: Object.entries(K.DILATA).map(([k, v]) => [k, v.nombre]) },
    { k: 'coef', nom: 'Coeficiente (α si es sólido, β si es líquido)', u: '1/K', si: (d) => d.mat === 'otro' },
    { k: 'rec', nom: 'Recipiente', sel: Object.entries(K.DILATA).filter(([, v]) => v.a !== undefined).map(([k, v]) => [k, v.nombre]), si: (d) => d.tipo === 'rebose' },
    { k: 'medida', nom: 'Medida inicial', u: (d) => ({ lineal: 'm', superficial: 'm²', volumen: 'L', rebose: 'L' })[d.tipo] },
    { k: 'T0', nom: 'Temperatura inicial', u: '°C' },
    { k: 'T1', nom: 'Temperatura final', u: '°C' },
    { k: 'objetivo', nom: '¿A qué temperatura mide…? (opcional)', u: (d) => ({ lineal: 'm', superficial: 'm²', volumen: 'L' })[d.tipo], si: (d) => d.tipo !== 'rebose' },
  ];
  let resD = null;
  function pintaD() {
    $('#campos-d').innerHTML = CAMPOS_D.filter((x) => !x.si || x.si(dil)).map((x) => {
      const id = 'd-' + x.k, u = typeof x.u === 'function' ? x.u(dil) : x.u;
      const ctl = x.sel ? `<select id="${id}" class="in ancho" data-k="${x.k}">${x.sel.map(([v, t]) => `<option value="${v}"${dil[x.k] === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`
        : `<input id="${id}" class="in" data-k="${x.k}" value="${esc(coma(dil[x.k]))}" inputmode="decimal" autocomplete="off">`;
      return `<label for="${id}"${x.sel ? ' class="ancho"' : ''}>${x.nom}${u ? ` <small>(${u})</small>` : ''}</label>${ctl}`;
    }).join('');
  }
  $('#campos-d').addEventListener('input', (e) => {
    const k = e.target.dataset.k; if (!k) return;
    dil[k] = e.target.value; $('#ejemplos-d').value = '';
    if (e.target.tagName === 'SELECT') { pintaD(); const n = document.getElementById('d-' + k); if (n) n.focus(); }
    calculaD(true);
  });
  const selD = $('#ejemplos-d');
  selD.innerHTML = '<option value="">Ejemplos…</option>' + K.ejemplosDil.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  selD.addEventListener('change', () => { if (selD.value) abrirEjemploD(selD.value); });
  function abrirEjemploD(clave) {
    const e = K.ejemplosDil.find((x) => x.clave === clave); if (!e) return;
    dil = { ...BASE_D, ...e.sc }; pintaD(); selD.value = clave; pestana('dilatacion'); calculaD(true);
  }
  function calculaD(guardar) {
    const err = $('#error-d');
    try { resD = K.dilatacion(dil); } catch (e) { err.textContent = e.message; err.hidden = false; resD = null; $('#resumen-d').innerHTML = ''; $('#pasos-d').innerHTML = ''; lienzo($('#barra')); return; }
    err.hidden = true;
    if (guardar) guarda();
    const r = resD.res, U = resD.U, filas = [];
    if (r.betaAp !== undefined) filas.push(['Coeficiente aparente', f(r.betaAp) + ' K⁻¹']);
    if (r.dX !== undefined) filas.push([resD.tipo === 'rebose' ? 'Volumen que rebosa' : 'Variación', f(r.dX) + ' ' + U]);
    if (r.X1 !== undefined && resD.tipo !== 'rebose') filas.push(['Medida final', f(r.X1) + ' ' + U]);
    if (r.Tobjetivo !== undefined) filas.push([`Mide ${f(K.leeNum(dil.objetivo))} ${U} a`, f(r.Tobjetivo) + ' °C']);
    $('#resumen-d').innerHTML = filas.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
    $('#pasos-d').innerHTML = resD.pasos.map((p) => `<li><strong>${esc(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibujaD();
  }
  // antes (contorno) y después (relleno), con la variación exagerada para que se vea
  function dibujaD() {
    if (!resD || $('#panel-dilatacion').hidden) return;
    const { g, w, h } = lienzo($('#barra'));
    const r = resD.res, rel = r.X1 !== undefined ? r.X1 / resD.X0 - 1 : r.Tobjetivo !== undefined ? K.leeNum(dil.objetivo) / resD.X0 - 1 : 0;
    const ex = rel ? Math.min(0.25 / Math.abs(rel), 1e6) : 1, vis = rel * ex;
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'top'; g.textAlign = 'left';
    const W0 = (w - 40) / 1.3, x0 = 20;
    if (resD.tipo === 'lineal') {
      const y = h / 2 - 10;
      g.fillStyle = col['--c2']; g.globalAlpha = 0.35; g.fillRect(x0, y, W0 * (1 + vis), 20); g.globalAlpha = 1;
      g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.strokeRect(x0, y, W0, 20);
    } else if (resD.tipo === 'superficial') {
      const L = Math.min(W0, h - 50) * 0.8, k = Math.sqrt(1 + vis);
      g.fillStyle = col['--c2']; g.globalAlpha = 0.35; g.fillRect(x0, 14, L * k, L * k); g.globalAlpha = 1;
      g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.strokeRect(x0, 14, L, L);
    } else {
      // vaso: el nivel del líquido sube (en el rebose, por encima del borde)
      const ancho = 90, alto = h - 60, bx = x0 + 30, by = h - 24, nivel = alto * 0.75, sube = nivel * vis;
      g.fillStyle = col['--c1']; g.globalAlpha = 0.35; g.fillRect(bx, by - nivel - sube, ancho, nivel + sube); g.globalAlpha = 1;
      g.strokeStyle = col['--ink']; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by - alto * (resD.tipo === 'rebose' ? 0.75 : 1)); g.lineTo(bx, by); g.lineTo(bx + ancho, by); g.lineTo(bx + ancho, by - alto * (resD.tipo === 'rebose' ? 0.75 : 1)); g.stroke();
      g.setLineDash([4, 3]); g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(bx - 10, by - nivel); g.lineTo(bx + ancho + 10, by - nivel); g.stroke(); g.setLineDash([]);
    }
    g.fillStyle = col['--muted']; g.fillText(`Contorno: a ${txt(f(resD.T0))} °C · relleno: ${r.Tobjetivo !== undefined && r.X1 === undefined ? `a ${txt(f(r.Tobjetivo))} °C` : `a ${txt(f(resD.T1))} °C`}${ex > 1.5 ? ` · variación exagerada ×${txt(f(ex, 2))}` : ''}`, 8, h - 18);
  }

  /* ---------- Modo práctica: un ejercicio con enunciado ---------- */
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)];
    const tipos = [
      () => ({ cuerpos: [{ sustancia: de(['cobre', 'aluminio', 'hierro', 'plomo']), m: String(ent(5, 30) * 10), T0: String(ent(6, 20) * 10) }, { sustancia: 'agua', m: String(ent(10, 50) * 10), T0: String(ent(10, 25)) }] }),
      () => ({ cuerpos: [{ sustancia: 'agua', m: String(ent(2, 8) * 10), T0: '-' + ent(5, 20) }, { sustancia: 'agua', m: String(ent(20, 50) * 10), T0: String(ent(40, 80)) }] }),
      () => ({ cuerpos: [{ sustancia: 'agua', m: String(ent(5, 20)), T0: '100', estado: 'gas' }, { sustancia: 'agua', m: String(ent(20, 50) * 10), T0: String(ent(10, 25)) }] }),
      () => ({ Tfin: String(ent(22, 30)), cuerpos: [{ sustancia: 'otra', nombre: 'Metal', m: String(ent(5, 20) * 10), T0: '100', cs: '?' }, { sustancia: 'agua', m: String(ent(15, 40) * 10), T0: String(ent(15, 20)) }] }),
      () => ({ Tfin: '100', cuerpos: [{ sustancia: 'agua', m: String(ent(5, 20) * 100), T0: String(ent(10, 25)) }, { sustancia: 'calentador', P: String(de([1000, 1500, 2000, 2200])), t: '?', eta: String(de([80, 90, 100])) }] }),
    ];
    if (Math.random() < 0.25) {
      dil = de([{ ...BASE_D, tipo: 'lineal', mat: de(['acero', 'aluminio', 'cobre']), medida: String(ent(5, 50)), T0: String(ent(0, 20)), T1: String(ent(40, 120)) },
        { ...BASE_D, tipo: 'rebose', mat: de(['mercurio', 'agua', 'glicerina']), rec: de(['vidrio', 'pyrex']), medida: String(ent(1, 5)), T0: '20', T1: String(ent(50, 90)) }]);
      pintaD(); selD.value = ''; pestana('dilatacion'); calculaD(true); return;
    }
    const d = de(tipos)(); cuerpos = d.cuerpos; Tfin = d.Tfin || ''; $('#tfin').value = Tfin; pinta(); sel.value = ''; pestana('mezcla'); calcula(true);
  }
  const enunciado = () => {
    const e = (x) => esc(String(x).replace('.', ',')), nom = (c) => K.SUSTANCIAS[c.sustancia]?.nombre.toLowerCase();
    if (tab === 'dilatacion') {
      if (dil.tipo === 'rebose') return `Un recipiente de ${e(K.DILATA[dil.rec].nombre.toLowerCase())} de ${e(dil.medida)} L está lleno de ${e(K.DILATA[dil.mat].nombre.replace(' (líquido)', '').toLowerCase())} a ${e(dil.T0)} °C. ¿Cuánto líquido rebosa al calentarlo a ${e(dil.T1)} °C?`;
      return `Una barra de ${e(nom({ sustancia: dil.mat }) || K.DILATA[dil.mat].nombre.toLowerCase())} mide ${e(dil.medida)} m a ${e(dil.T0)} °C. ¿Cuánto se alarga y cuánto mide a ${e(dil.T1)} °C?`;
    }
    const [a, b] = cuerpos;
    if (b.sustancia === 'calentador') return `Un hervidor de ${e(b.P)} W con un rendimiento del ${e(b.eta)} % calienta ${e(a.m)} g de agua a ${e(a.T0)} °C. ¿Cuánto tarda en llegar a 100 °C?`;
    if (a.cs === '?') return `Una pieza de ${e(a.m)} g de un metal desconocido a ${e(a.T0)} °C se echa en ${e(b.m)} g de agua a ${e(b.T0)} °C y el equilibrio queda a ${e(Tfin)} °C. ¿Cuál es el calor específico del metal?`;
    const desc = (c) => (c.estado === 'gas' ? `${e(c.m)} g de vapor a ${e(c.T0)} °C` : +c.T0 < 0 && c.sustancia === 'agua' ? `${e(c.m)} g de hielo a ${e(c.T0)} °C` : `${e(c.m)} g de ${e(nom(c))} a ${e(c.T0)} °C`);
    return `Se mezclan ${desc(a)} y ${desc(b)} en un recipiente aislado. ¿Cuál es la temperatura de equilibrio?`;
  };

  addEventListener('resize', () => { dibuja(); dibujaD(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); dibujaD(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('calorimetria').current;
  $('#tfin').value = coma(Tfin);
  colores(); pinta(); pintaD(); calcula(false); calculaD(false); pestana(tab);
  window.CalorApp = { abrirEjemplo, abrirEjemploD, pestana, azar, enunciado, resultado: () => res, dilatacion: () => resD, cuerpos: () => JSON.parse(JSON.stringify(cuerpos)) };
})();
