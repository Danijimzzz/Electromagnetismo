(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const P = Imagenes, f = P.f, u = P.u, CLAVE = 'imagenes-v1';

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object' && P.MODOS[g.modo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  function formulario() {
    const M = P.MODOS[sc.modo];
    $('#campos').innerHTML = `<label for="f-modo">Conducteur</label><select id="f-modo" class="in" data-k="modo">${Object.entries(P.MODOS).map(([k, m]) => `<option value="${k}"${sc.modo === k ? ' selected' : ''}>${m.nombre}</option>`).join('')}</select>`
      + M.campos.map(([k, nom, un]) => fila(k, nom, un)).join('')
      + (M.punto.length ? '<div class="sep">Point où calculer V et E (facultatif)</div>' + M.punto.map(([k, nom, un]) => fila(k, nom, un)).join('') : '');
    $('#nota').textContent = M.plana ? ({ cuna: 'Un plan est φ = 0 et l\'autre φ = π/n ; q est à la distance r₀ de l\'arête et à φ₀ du premier. Avec n = 1, c\'est un seul plan.', paralelos: 'Les plans sont z = 0 et z = L ; q est sur l\'axe à la hauteur d. Le point est donné par ρ (distance à l\'axe) et z.', varias: 'Le plan est z = 0 ; chaque charge est donnée par sa position (x, z) avec z > 0. Laissez vides les charges 2 et 3 si vous n\'en avez pas besoin.', dipolo: 'Le dipôle est à la hauteur d du plan z = 0 ; θ est l\'angle entre p et la normale au plan (θ = 0 : perpendiculaire). La virgule décimale et les unités sont acceptées.' })[sc.modo]
      : sc.modo === 'plano' ? 'Le plan est z = 0 et q est en z = d. Le point est donné par ρ (distance à l\'axe) et z (toujours supérieur à 0).'
      : sc.modo === 'cavidad' ? 'Le point est donné en polaires depuis le centre ; θ se mesure à partir de la droite du centre à q. Le point doit se trouver à l\'intérieur de la cavité.'
        : 'Le point est donné en polaires depuis le centre ; θ se mesure à partir de la droite du centre à q. Il doit se trouver à l\'extérieur de la sphère. La virgule décimale et 3e8 sont acceptés.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT' || !t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc.modo = t.value;
    const ej = P.ejemplos.find((x) => x.sc.modo === sc.modo);
    if (ej) for (const [k, v] of Object.entries(ej.sc)) if (k !== 'modo' && (sc[k] === undefined || sc[k] === '')) sc[k] = v;
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const q = String(de([1, 2, 3, 5, 8, 10, -2, -5])), modo = de(Object.keys(P.MODOS));
    if (modo === 'plano') sc = { modo, q, d: String(ent(2, 10)), rho: String(ent(0, 8)), z: String(ent(1, 12)) };
    else {
      const R = ent(3, 10), cav = modo === 'cavidad', a = cav ? ent(1, R - 1) : R + ent(2, 3 * R);
      sc = { modo, q, a: String(a), R: String(R), r: String(cav ? c(ent(1, R * 10 - 1) / 10) : R + ent(1, 10)), th: String(de([0, 30, 60, 90, 120, 180])) };
      if (modo === 'esfera-aislada') sc.Q = String(de([0, 0, 5, -5, 10]));
      if (modo === 'esfera-potencial') sc.V0 = String(de([100, 200, 500, -300, 1000]));
    }
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const q = `${esc(sc.q)} nC`;
    if (sc.modo === 'cuna') return `Une charge ponctuelle q = ${q} se trouve à ${esc(sc.r0)} cm de l'arête de deux plans conducteurs à la terre formant un angle de 180°/${esc(sc.n)}, et à ${esc(sc.ph)}° de l'un d'eux. Calculez les charges images et la force sur q.`;
    if (sc.modo === 'paralelos') return `Une charge ponctuelle q = ${q} se trouve entre deux plans conducteurs parallèles à la terre distants de ${esc(sc.L)} cm, à ${esc(sc.d)} cm du premier. Calculez la force sur q et la charge induite sur chaque plan.`;
    if (sc.modo === 'varias') return `Devant un plan conducteur à la terre z = 0 se trouvent des charges ponctuelles : q₁ = ${q} en (${esc(sc.x1)}; ${esc(sc.z1)}) cm${sc.q2 ? `, q₂ = ${esc(sc.q2)} nC en (${esc(sc.x2)}; ${esc(sc.z2)}) cm` : ''}${sc.q3 ? `, q₃ = ${esc(sc.q3)} nC en (${esc(sc.x3)}; ${esc(sc.z3)}) cm` : ''}. Calculez la force sur chaque charge et l'énergie du système.`;
    if (sc.modo === 'dipolo') return `Un dipôle de moment p = ${esc(sc.p)} nC·cm se trouve à ${esc(sc.d)} cm d'un plan conducteur à la terre, avec p formant ${esc(sc.th)}° avec la normale. Calculez la force et le couple sur le dipôle.`;
    if (sc.modo === 'plano') return `Une charge ponctuelle q = ${q} se trouve à ${esc(sc.d)} cm d'un plan conducteur indéfini à la terre. Calculez la charge image, la force sur q, la densité de charge induite sous elle et le travail pour l'amener à l'infini${sc.rho !== '' && sc.z !== '' ? `, ainsi que le potentiel et le champ au point ρ = ${esc(sc.rho)} cm, z = ${esc(sc.z)} cm` : ''}.`;
    const pt = sc.r !== '' && sc.th !== '' ? `, ainsi que le potentiel et le champ au point r = ${esc(sc.r)} cm, θ = ${esc(sc.th)}°` : '';
    if (sc.modo === 'cavidad') return `Une charge ponctuelle q = ${q} se trouve à ${esc(sc.a)} cm du centre d'une cavité sphérique de ${esc(sc.R)} cm de rayon dans un conducteur. Calculez la charge image et sa position, la force sur q et la densité de charge induite au point le plus proche${pt}.`;
    const esfera = sc.modo === 'esfera-tierra' ? 'une sphère conductrice à la terre' : sc.modo === 'esfera-aislada' ? `une sphère conductrice isolée de charge Q = ${esc(sc.Q || '0')} nC` : `une sphère conductrice maintenue à V₀ = ${esc(sc.V0 || '0')} V`;
    return `Une charge ponctuelle q = ${q} se trouve à ${esc(sc.a)} cm du centre de ${esfera} de rayon ${esc(sc.R)} cm. Calculez les charges images, la force sur q, la charge de la sphère et la densité de charge induite au point le plus proche${sc.modo === 'esfera-tierra' ? ', le travail pour amener q à l\'infini' : ''}${pt}.`;
  };

  const caja = (n, v, extra) => `<div><span>${n}</span><b>${v}</b>${extra ? `<small>${extra}</small>` : ''}</div>`;
  const cm = (x) => `${f(x * 100)} cm`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const s = sol, im = s.imagenes[0];
    if (s.plana) {
      $('#resumen').innerHTML = s.cajas.map(([n, v, e]) => caja(n, v, e)).join('');
      $('#pasos').innerHTML = s.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
      $('#leyenda').textContent = 'Lignes de champ des charges réelles avec leurs images (dessinées en pointillés, à l\'intérieur du conducteur). Le conducteur est la zone ombrée.';
      dibuja(); return;
    }
    let h = '';
    if (im) h += caja('Charge image q′', u(im.q, 'C'), s.esfera ? `à a′ = ${cm(im.z)} du centre` : `en z = −${cm(s.p.d)}`);
    else h += caja('Charge image q′', '—', 'q est au centre');
    if (s.q2 !== 0) h += caja('Seconde image q″', u(s.q2, 'C'), 'au centre de la sphère');
    h += caja('Force sur q', u(s.Fmod, 'N'), s.Fmod === 0 ? 'nula' : s.atractiva ? `attractive, vers ${s.cav ? 'la paroi' : s.esfera ? 'la sphère' : 'le plan'}` : 'répulsive, s\'éloigne de la sphère');
    if (s.modo === 'plano') h += caja('Charge induite totale', u(-s.q, 'C'), 'égale et opposée à q');
    else if (s.cav) h += caja('Charge induite sur la paroi', u(-s.q, 'C'), 'égale et opposée à q');
    else h += caja('Charge totale de la sphère', u(s.Qe, 'C'), s.modo === 'esfera-tierra' ? 'celle de l\'image' : s.modo === 'esfera-aislada' ? 'celle qui lui a été donnée' : 'fixée par V₀');
    if (!s.cav && s.modo !== 'plano') h += caja('Potentiel de la sphère', u(s.V0, 'V'), s.modo === 'esfera-tierra' ? 'à la terre' : 'entièrement équipotentielle');
    h += caja(s.modo === 'plano' ? 'σ maximale (sous q)' : 'σ au point le plus proche', `${f(s.sigmaMax)} C/m²`, s.modo === 'plano' ? 'en ρ = 0' : 'en θ = 0');
    if (s.W !== null) h += caja('Travail jusqu\'à l\'infini', u(s.W, 'J'), 'pour éloigner q du conducteur');
    if (s.pt) {
      h += caja('V au point', u(s.pt.V, 'V'), s.esfera ? `r = ${cm(s.pt.r)}, θ = ${f((s.pt.th * 180) / Math.PI)}°` : `ρ = ${cm(s.pt.rho)}, z = ${cm(s.pt.z)}`);
      h += caja('|E| au point', u(s.pt.E, 'V/m'), `E<sub>z</sub> = ${u(s.pt.Ez, 'V/m', 3)}, E<sub>ρ</sub> = ${u(s.pt.Er, 'V/m', 3)}`);
      h += caja('σ sous le point', `${f(s.pt.sigma)} C/m²`, 'charge induite par unité de surface');
    }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = s.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Lignes de champ de q avec ses images (dessinées en pointillés, à l\'intérieur du conducteur). L\'épaisseur du trait sur le conducteur indique la charge induite.';
    dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--bg', '--panel', '--accent', '--pos', '--neg', '--metal', '--campo']) col[k] = cs.getPropertyValue(k).trim(); }
  const texto = (g, t, x, y, c = col['--muted'], al = 'center') => { g.fillStyle = c; g.textAlign = al; g.fillText(t, x, y); };
  function dibuja() {
    const { g, w, h } = lienzo('#dibujo');
    if (!sol || !w || !h) return;
    colores();
    if (sol.plana) { dibujaPlana(g, w, h); return; }
    const s = sol, pl = !s.esfera, R = s.R, big = s.imagenes.length && s.imagenes[0].z;
    let H0, H1, V0, V1;
    if (pl) { const d = s.p.d, ext = Math.max(2.6 * d, s.pt ? Math.abs(s.pt.rho) * 1.25 : 0); H0 = -ext; H1 = ext; V0 = -1.1 * d; V1 = Math.max(2.4 * d, s.pt ? s.pt.z * 1.2 : 0); }
    else if (s.cav) { const e = 1.25 * R; H0 = -e; H1 = big && big < 2.2 * R ? Math.max(e, big * 1.2) : e; V0 = -e; V1 = e; }
    else { H0 = -1.5 * R; H1 = Math.max(1.25 * s.p.a, s.pt ? s.pt.z * 1.1 : 0); V1 = Math.max(1.5 * R, s.pt ? Math.abs(s.pt.rho) * 1.2 : 0, 0.28 * (H1 - H0)); V0 = -V1; }
    const m = 14, k = Math.min((w - 2 * m) / (H1 - H0), (h - 2 * m) / (V1 - V0)), ox = (w - k * (H1 - H0)) / 2, oy = (h - k * (V1 - V0)) / 2;
    const X = (z, r) => (pl ? ox + (r - H0) * k : ox + (z - H0) * k), Y = (z, r) => (pl ? h - oy - (z - V0) * k : h - oy - (r - V0) * k);
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillStyle = col['--metal'];
    if (pl) g.fillRect(X(0, H0), Y(0, 0), (H1 - H0) * k, (0 - V0) * k);
    else {
      g.beginPath();
      if (s.cav) { g.rect(0, 0, w, h); g.arc(X(0, 0), Y(0, 0), R * k, 0, 2 * Math.PI, true); g.fill('evenodd'); }
      else { g.arc(X(0, 0), Y(0, 0), R * k, 0, 2 * Math.PI); g.fill(); }
    }
    const cabe = (x) => Math.abs(x) / Math.max(Math.abs(s.sigmaMax), 1e-300);
    g.lineCap = 'butt';
    if (pl) {
      const n = Math.min(1200, Math.max(40, Math.floor(((H1 - H0) * k) / 4))); // tope: con datos extremos k puede ser infinito
      for (let i = 0; i < n; i++) { const r0 = H0 + ((H1 - H0) * i) / n, r1 = H0 + ((H1 - H0) * (i + 1)) / n, v = Math.min(1, cabe(s.sigma((r0 + r1) / 2))); g.strokeStyle = s.q > 0 ? col['--neg'] : col['--pos']; g.lineWidth = 1 + 9 * v; g.beginPath(); g.moveTo(X(0, r0), Y(0, 0) + 1 + g.lineWidth / 2); g.lineTo(X(0, r1) + 0.5, Y(0, 0) + 1 + g.lineWidth / 2); g.stroke(); }
    } else {
      const n = 120, ancho = Math.max(...Array.from({ length: 13 }, (_, i) => Math.abs(s.sigma((Math.PI * i) / 12))), 1e-300);
      for (let i = 0; i < n; i++) {
        const a0 = (2 * Math.PI * i) / n, a1 = (2 * Math.PI * (i + 1)) / n, th = Math.abs(((a0 + a1) / 2 + Math.PI) % (2 * Math.PI) - Math.PI), sg = s.sigma(th), v = Math.min(1, Math.abs(sg) / ancho);
        const rad = R * k + (s.cav ? -1 : 1) * (2 + (1 + 9 * v) / 2);
        g.strokeStyle = sg < 0 ? col['--neg'] : col['--pos']; g.lineWidth = 1 + 9 * v;
        g.beginPath(); g.arc(X(0, 0), Y(0, 0), rad, -a1, -a0 + 0.01); g.stroke();
      }
    }
    g.lineWidth = 1.4; g.strokeStyle = col['--ink'];
    if (pl) { g.beginPath(); g.moveTo(X(0, H0), Y(0, 0)); g.lineTo(X(0, H1), Y(0, 0)); g.stroke(); }
    else { g.beginPath(); g.arc(X(0, 0), Y(0, 0), R * k, 0, 2 * Math.PI); g.stroke(); }
    const L = pl ? s.p.d : s.cav ? R : s.p.a, ds = L / 70, sg = Math.sign(s.q) || 1;
    const dentro = (z, r) => (pl ? z <= 0 : s.cav ? Math.hypot(z, r) >= R : Math.hypot(z, r) <= R);
    const fuera = (z, r) => { const hx = pl ? r : z, vy = pl ? z : r; return hx < H0 - 0.05 * (H1 - H0) || hx > H1 + 0.05 * (H1 - H0) || vy < V0 - 0.05 * (V1 - V0) || vy > V1 + 0.05 * (V1 - V0); };
    const dir = (z, r) => { const c = P.campo(s.cargas, z, r); return [(sg * c.Ez) / (c.E || 1), (sg * c.Er) / (c.E || 1)]; };
    g.lineWidth = 1.2; g.strokeStyle = col['--campo']; g.fillStyle = col['--campo'];
    const N = 18;
    for (let i = 0; i < N; i++) {
      const ang = (2 * Math.PI * (i + 0.5)) / N; let z = s.pos + 0.04 * L * Math.cos(ang), r = 0.04 * L * Math.sin(ang);
      const pts = [[z, r]];
      for (let j = 0; j < 1600; j++) {
        const [a1, b1] = dir(z, r), [a2, b2] = dir(z + (a1 * ds) / 2, r + (b1 * ds) / 2);
        z += a2 * ds; r += b2 * ds; pts.push([z, r]);
        if (dentro(z, r) || fuera(z, r)) break;
      }
      g.beginPath(); pts.forEach(([zz, rr], j) => (j ? g.lineTo(X(zz, rr), Y(zz, rr)) : g.moveTo(X(zz, rr), Y(zz, rr)))); g.stroke();
      const j = Math.floor(pts.length * 0.45);
      if (j > 1 && j < pts.length - 1) {
        const [z0, r0] = pts[j - 1], [z1, r1] = pts[j + 1], an = Math.atan2(Y(z1, r1) - Y(z0, r0), X(z1, r1) - X(z0, r0)) + (sg < 0 ? Math.PI : 0), [zc, rc] = pts[j], x = X(zc, rc), y = Y(zc, rc);
        g.beginPath(); g.moveTo(x + 5 * Math.cos(an), y + 5 * Math.sin(an)); g.lineTo(x - 4 * Math.cos(an - 0.55), y - 4 * Math.sin(an - 0.55)); g.lineTo(x - 4 * Math.cos(an + 0.55), y - 4 * Math.sin(an + 0.55)); g.closePath(); g.fill();
      }
    }
    const disco = (z, r, c, real, nom, alto = false) => {
      const x = X(z, r), y = Y(z, r);
      g.beginPath(); g.arc(x, y, 8, 0, 2 * Math.PI);
      if (real) { g.fillStyle = c; g.fill(); } else { g.fillStyle = col['--panel']; g.fill(); g.setLineDash([3, 3]); g.strokeStyle = c; g.lineWidth = 1.8; g.stroke(); g.setLineDash([]); }
      texto(g, c === col['--pos'] ? '+' : '−', x, y + 0.5, real ? '#fff' : c);
      texto(g, nom, x + (pl ? 16 : 0), y + (pl ? 0 : alto ? 17 : -16), col['--ink'], pl ? 'left' : 'center');
    };
    const signo = (q) => (q > 0 ? col['--pos'] : col['--neg']);
    for (const c of s.cargas) { if (!c.real && fuera(c.z, 0)) continue; disco(c.z, 0, signo(c.q), !!c.real, c.real ? 'q' : c.nom || '', c.nom === 'q″'); }
    g.lineWidth = 1; g.strokeStyle = col['--muted']; g.setLineDash([2, 3]);
    if (pl) { const x = X(0, -0.6 * s.p.d - 0.001); g.beginPath(); g.moveTo(x, Y(0, 0)); g.lineTo(x, Y(s.p.d, 0)); g.stroke(); g.setLineDash([]); texto(g, `d = ${cm(s.p.d)}`, x - 6, (Y(0, 0) + Y(s.p.d, 0)) / 2, col['--muted'], 'right'); }
    else { g.beginPath(); g.moveTo(X(0, 0), Y(0, 0)); g.lineTo(X(s.pos, 0), Y(0, 0)); g.stroke(); g.setLineDash([]); texto(g, `a = ${cm(s.pos)}`, (X(0, 0) + X(s.pos, 0)) / 2, Y(0, 0) - 12 + (s.cav ? 24 : 0)); texto(g, `R = ${cm(R)}`, X(0, 0), Y(0, 0) + R * k * 0.6, col['--muted']); }
    g.setLineDash([]);
    if (s.pt) {
      const x = X(s.pt.z, s.pt.rho), y = Y(s.pt.z, s.pt.rho);
      g.fillStyle = col['--accent']; g.strokeStyle = col['--accent']; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, 4, 0, 2 * Math.PI); g.fill();
      const vx = pl ? s.pt.Er : s.pt.Ez, vy = pl ? s.pt.Ez : s.pt.Er, m0 = Math.hypot(vx, vy) || 1, lon = 38, x2 = x + (vx / m0) * lon, y2 = y - (vy / m0) * lon, an = Math.atan2(y2 - y, x2 - x);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 7 * Math.cos(an - 0.45), y2 - 7 * Math.sin(an - 0.45)); g.lineTo(x2 - 7 * Math.cos(an + 0.45), y2 - 7 * Math.sin(an + 0.45)); g.closePath(); g.fill();
      texto(g, 'E', x2 + 8 * Math.cos(an) + 4, y2 + 8 * Math.sin(an), col['--accent'], 'left');
    }
  }

  function dibujaPlana(g, w, h) {
    const s = sol, cg = s.cargas, m = 14, M = s.modo, lim = s.lim;
    let H0, H1, V0, V1;
    if (M === 'cuna') { const xs = cg.map((c) => c.x).concat(0), zs = cg.map((c) => c.z).concat(0); H0 = Math.min(...xs); H1 = Math.max(...xs); V0 = Math.min(...zs); V1 = Math.max(...zs); const pd = 0.25 * Math.max(H1 - H0, V1 - V0); H0 -= pd; H1 += pd; V0 -= pd; V1 += pd; }
    else if (M === 'paralelos') { H0 = -0.9 * lim; H1 = 0.9 * lim; V0 = -0.55 * lim; V1 = 1.55 * lim; }
    else if (M === 'varias') { const xs = cg.map((c) => c.x); H0 = Math.min(...xs) - lim; H1 = Math.max(...xs) + lim; V0 = -1.3 * lim; V1 = 1.3 * lim; }
    else { H0 = -1.8 * lim; H1 = 1.8 * lim; V0 = -1.5 * lim; V1 = 1.7 * lim; }
    const k = Math.min((w - 2 * m) / (H1 - H0), (h - 2 * m) / (V1 - V0)), ox = (w - k * (H1 - H0)) / 2, oy = (h - k * (V1 - V0)) / 2;
    const X = (x) => ox + (x - H0) * k, Y = (z) => h - oy - (z - V0) * k, big = 20 * Math.max(H1 - H0, V1 - V0);
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillStyle = col['--metal']; g.strokeStyle = col['--ink']; g.lineWidth = 1.4;
    if (M === 'cuna') {
      g.beginPath(); g.rect(0, 0, w, h); g.moveTo(X(0), Y(0)); g.lineTo(X(big), Y(0));
      for (let i = 0; i <= 24; i++) { const an = (s.alfa * i) / 24; g.lineTo(X(big * Math.cos(an)), Y(big * Math.sin(an))); }
      g.closePath(); g.fill('evenodd');
      g.beginPath(); g.moveTo(X(big), Y(0)); g.lineTo(X(0), Y(0)); g.lineTo(X(big * Math.cos(s.alfa)), Y(big * Math.sin(s.alfa))); g.stroke();
    } else {
      const planos = M === 'paralelos' ? [0, s.L] : [0];
      g.fillRect(0, Y(0), w, h - Y(0)); if (M === 'paralelos') g.fillRect(0, 0, w, Y(s.L));
      for (const z of planos) { g.beginPath(); g.moveTo(0, Y(z)); g.lineTo(w, Y(z)); g.stroke(); }
    }
    const dentro = (x, z) => (M === 'cuna' ? Math.atan2(z, x) >= 0 && Math.atan2(z, x) <= s.alfa : M === 'paralelos' ? z > 0 && z < s.L : z > 0);
    const fuera = (x, z) => x < H0 - 0.05 * (H1 - H0) || x > H1 + 0.05 * (H1 - H0) || z < V0 - 0.05 * (V1 - V0) || z > V1 + 0.05 * (V1 - V0);
    const ds = lim / 60, N = 14; g.lineWidth = 1.2; g.strokeStyle = col['--campo']; g.fillStyle = col['--campo'];
    for (const c of cg.filter((q) => q.real)) {
      const sg = Math.sign(c.q) || 1, dir = (x, z) => { const e = P.campoXZ(cg, x, z); return [(sg * e.Ex) / (e.E || 1), (sg * e.Ez) / (e.E || 1)]; };
      for (let i = 0; i < N; i++) {
        const ang = (2 * Math.PI * (i + 0.5)) / N; let x = c.x + 0.04 * lim * Math.cos(ang), z = c.z + 0.04 * lim * Math.sin(ang);
        if (!dentro(x, z)) continue;
        const pts = [[x, z]];
        for (let j = 0; j < 2500; j++) {
          const [a1, b1] = dir(x, z), [a2, b2] = dir(x + (a1 * ds) / 2, z + (b1 * ds) / 2);
          x += a2 * ds; z += b2 * ds; pts.push([x, z]);
          if (!dentro(x, z) || fuera(x, z) || cg.some((o) => o.real && Math.sign(o.q) === -sg && Math.hypot(x - o.x, z - o.z) < 2.2 * ds)) break;
        }
        g.beginPath(); pts.forEach(([xx, zz], j) => (j ? g.lineTo(X(xx), Y(zz)) : g.moveTo(X(xx), Y(zz)))); g.stroke();
        const j = Math.floor(pts.length * 0.45);
        if (j > 1 && j < pts.length - 1) {
          const [x0, z0] = pts[j - 1], [x1, z1] = pts[j + 1], an = Math.atan2(Y(z1) - Y(z0), X(x1) - X(x0)), [xc, zc] = pts[j], px = X(xc), py = Y(zc);
          g.beginPath(); g.moveTo(px + 5 * Math.cos(an), py + 5 * Math.sin(an)); g.lineTo(px - 4 * Math.cos(an - 0.55), py - 4 * Math.sin(an - 0.55)); g.lineTo(px - 4 * Math.cos(an + 0.55), py - 4 * Math.sin(an + 0.55)); g.closePath(); g.fill();
        }
      }
    }
    for (const c of cg) {
      const x = X(c.x), y = Y(c.z); if (x < 0 || x > w || y < 0 || y > h) continue;
      const col1 = c.q > 0 ? col['--pos'] : col['--neg'];
      g.beginPath(); g.arc(x, y, M === 'dipolo' ? 6 : 8, 0, 2 * Math.PI);
      if (c.real) { g.fillStyle = col1; g.fill(); } else { g.fillStyle = col['--panel']; g.fill(); g.setLineDash([3, 3]); g.strokeStyle = col1; g.lineWidth = 1.8; g.stroke(); g.setLineDash([]); }
      texto(g, c.q > 0 ? '+' : '−', x, y + 0.5, c.real ? '#fff' : col1);
      if (cg.length <= 8 || c.real) texto(g, c.nom || '', x + 14, y - 12, col['--ink'], 'left');
    }
    if (s.pt) {
      const x = X(s.pt.x), y = Y(s.pt.z), m0 = Math.hypot(s.pt.Ex, s.pt.Ez) || 1, x2 = x + (s.pt.Ex / m0) * 38, y2 = y - (s.pt.Ez / m0) * 38, an = Math.atan2(y2 - y, x2 - x);
      g.fillStyle = col['--accent']; g.strokeStyle = col['--accent']; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 4, 0, 2 * Math.PI); g.fill();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 7 * Math.cos(an - 0.45), y2 - 7 * Math.sin(an - 0.45)); g.lineTo(x2 - 7 * Math.cos(an + 0.45), y2 - 7 * Math.sin(an + 0.45)); g.closePath(); g.fill();
      texto(g, 'E', x2 + 8 * Math.cos(an) + 4, y2 + 8 * Math.sin(an), col['--accent'], 'left');
    }
    if (M === 'cuna') texto(g, `α = ${f((s.alfa * 180) / Math.PI)}°`, X(0) + 34, Y(0) - 12, col['--muted']);
    if (M === 'paralelos') texto(g, `L = ${cm(s.L)}`, X(H1 - 0.12 * (H1 - H0)), (Y(0) + Y(s.L)) / 2, col['--muted']);
  }
  Herramienta.exportar('#dibujo', { nombre: 'imagenes', titulo: 'Charges images et lignes de champ' });
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('imagenes').current;
  formulario(); calcula();
  window.ImagenesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, F: sol.Fz, qi: sol.imagenes[0]?.q, Q: sol.Qe, V0: sol.V0 }, estado: () => copia(sc) };
})();

