/* =====================================================================
   Calorimetría: interfaz (lista de cuerpos, equilibrio, tabla de calores,
   curvas de calentamiento y desarrollo). El cálculo está en fisica.js (Calor).
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
    { k: 'm', nom: 'Masa', u: 'g', si: (s) => s !== 'calorimetro' },
    { k: 'C', nom: 'Capacidad calorífica C', u: 'J/K', si: (s) => s === 'calorimetro' },
    { k: 'T0', nom: 'Temperatura inicial', u: '°C' },
    { k: 'estado', nom: 'Estado inicial', sel: [['', 'Automático'], ['solido', 'Sólido'], ['liquido', 'Líquido'], ['gas', 'Gas']], si: (s) => s !== 'calorimetro' && s !== 'vidrio' },
    { k: 'nombre', nom: 'Nombre', si: (s) => s === 'otra', texto: true },
    { k: 'cs', nom: 'c del sólido', u: 'J/(kg·K)', si: (s) => s === 'otra' },
    { k: 'cl', nom: 'c del líquido', u: 'J/(kg·K)', si: (s) => s === 'otra' },
    { k: 'cg', nom: 'c del gas', u: 'J/(kg·K)', si: (s) => s === 'otra' },
    { k: 'Tf', nom: 'Temperatura de fusión', u: '°C', si: (s) => s === 'otra' },
    { k: 'Lf', nom: 'Calor latente de fusión', u: 'J/kg', si: (s) => s === 'otra' },
    { k: 'Tv', nom: 'Temperatura de ebullición', u: '°C', si: (s) => s === 'otra' },
    { k: 'Lv', nom: 'Calor latente de vaporización', u: 'J/kg', si: (s) => s === 'otra' },
  ];

  let cuerpos = K.ejemplos[0].cuerpos.map((c) => ({ ...c }));
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (Array.isArray(g) && g.length) cuerpos = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cuerpos)); } catch (e) {} };
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
          : `<input id="${id}" class="in" data-i="${i}" data-k="${x.k}" value="${esc(x.texto ? c[x.k] : coma(c[x.k]))}" ${x.texto ? '' : 'inputmode="decimal"'} autocomplete="off">`;
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
    cuerpos = e.cuerpos.map((c) => ({ ...c })); pinta(); sel.value = clave; calcula(true);
  }

  /* ---------- Resultados ---------- */
  function calcula(guardar) {
    const err = $('#error');
    try { res = K.equilibrio({ cuerpos }); } catch (e) {
      err.textContent = e.message; err.hidden = false; res = null;
      for (const id of ['#te', '#estados', '#tabla', '#balance', '#pasos', '#ley-curvas']) $(id).innerHTML = '';
      lienzo($('#curvas'));
      return;
    }
    err.hidden = true;
    if (guardar) guarda();
    $('#te').innerHTML = `T<sub>e</sub> = ${f(res.Te)} °C <small>${res.enCambio ? '(no llega para completar el cambio de fase)' : ''}</small>`;
    $('#estados').innerHTML = res.cuerpos.map((c) => `<li>${esc(c.nombre)}: ${c.b.C !== undefined ? `calorímetro ${c.estado}` : `al final, ${c.estado}`}</li>`).join('');
    $('#tabla').innerHTML = `<thead><tr><th>Cuerpo</th><th>T inicial (°C)</th><th>Q (J)</th><th></th></tr></thead><tbody>${res.cuerpos.map((c, i) => `<tr><td><span style="color:var(${COL[i % COL.length]})">●</span> ${esc(c.nombre)}</td><td>${f(c.b.T0)}</td><td>${f(c.Q)}</td><td>${Math.abs(c.Q) < 1e-9 ? '' : c.Q > 0 ? 'absorbe' : 'cede'}</td></tr>`).join('')}<tr><td><b>Total</b></td><td></td><td><b>${f(res.cuerpos.reduce((s, c) => s + c.Q, 0))}</b></td><td></td></tr></tbody>`;
    const tot = res.cedido + res.absorbido || 1;
    $('#balance').innerHTML = `<span style="width:${(100 * res.cedido) / tot}%;background:var(--calor)"></span><span style="flex:1;background:var(--frio)"></span>`;
    $('#pasos').innerHTML = res.pasos.map((p) => `<li><strong>${esc(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#ley-curvas').innerHTML = res.cuerpos.map((c, i) => `<span><i style="background:var(${COL[i % COL.length]})"></i>${esc(c.nombre)}</span>`).join('') + '<span>· eje horizontal: calor absorbido (kJ)</span>';
    dibuja();
  }

  const lienzo = (c) => Herramienta.lienzo(c);
  const paso = (rango, n = 5) => { const r = rango / n, p = 10 ** Math.floor(Math.log10(r || 1)), m = r / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  function dibuja() {
    if (!res) return;
    const { g, w, h } = lienzo($('#curvas'));
    const curvas = res.cuerpos.map((c) => K.curva(c).map(([q, T]) => [q / 1000, T]));
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
      g.strokeStyle = col[COL[i % COL.length]]; g.beginPath();
      cv.forEach(([q, T], k) => (k ? g.lineTo(X(q), Y(T)) : g.moveTo(X(q), Y(T)))); g.stroke();
      g.fillStyle = col[COL[i % COL.length]]; g.beginPath(); g.arc(X(cv[0][0]), Y(cv[0][1]), 3.5, 0, 2 * Math.PI); g.fill();
    });
  }
  addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('calorimetria').current;
  colores(); pinta(); calcula(false);
  window.CalorApp = { abrirEjemplo, resultado: () => res, cuerpos: () => JSON.parse(JSON.stringify(cuerpos)) };
})();
