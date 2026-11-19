const Energia = (() => {
  const rad = (g) => (g * Math.PI) / 180;
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(2).replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d + 1));
    return s.replace('.', ',').replace('-', '−');
  };

  function leer(sc) {
    const n = (k, nom, min = 0, estricto = false) => {
      const v = +String(sc[k]).replace(',', '.');
      if (!isFinite(v) || (estricto ? v <= min : v < min)) throw new Error(`${nom} doit être ${estricto ? 'strictement supérieur à' : 'au moins égal à'} ${min}`);
      return v;
    };
    const o = { m: n('m', 'La masse', 0, true), g: n('g', 'La gravité', 0, true), h: n('h', 'La hauteur'), ang: n('ang', 'L’angle', 0, true),
      mu1: n('mu1', 'Le frottement de la rampe'), d: n('d', 'La longueur du tronçon horizontal'), mu2: n('mu2', 'Le frottement du tronçon horizontal'), k: n('k', 'La constante du ressort'), v0: n('v0', 'La vitesse initiale') };
    if (o.ang >= 90) throw new Error('L’angle doit être inférieur à 90°');
    o.L = o.h / Math.sin(rad(o.ang));
    return o;
  }

  function rampaDirecta(sc) {
    const p = leer(sc), { m, g, h, ang, mu1, d, mu2, k, v0, L } = p;
    const pasos = [], res = {};
    const Ei = 0.5 * m * v0 * v0 + m * g * h;
    pasos.push({ t: 'Énergie initiale', html: `$E_0 = 1/2 m v_0^2 + m g h = 1/2 · ${f(m)} · ${f(v0)}^2 + ${f(m)} · ${f(g)} · ${f(h)}$ = <b>${f(Ei)} J</b>` });
    const tan = Math.tan(rad(ang));
    if (v0 === 0 && h > 0 && mu1 >= tan) {
      pasos.push({ t: 'Rampe', html: `Au repos, le bloc ne bouge pas : $μ_1 = ${f(mu1)} ≥ tan θ = ${f(tan)}$ (le frottement statique peut le retenir).` });
      return { p, pasos, res: { quieto: true }, Ei };
    }
    const Wr1 = -mu1 * m * g * Math.cos(rad(ang)) * L;
    let vb2 = v0 * v0 + 2 * g * h + (2 * Wr1) / m;
    if (h > 0) pasos.push({ t: 'Descente de la rampe', html: `Longueur $L = h/{sin θ} = ${f(L)} "m"$. Travail du frottement $W_f1 = −μ_1 m g cos θ · L$ = <b>${f(Wr1)} J</b>.<br>$1/2 m v_B^2 = E_0 + W_r1 ⇒ v_B = √(v_0^2 + 2 g h − {2 μ_1 g h}/{tg θ})$ = <b>${vb2 > 0 ? f(Math.sqrt(vb2)) : '0'} m/s</b>` });
    if (vb2 <= 0) {
      const s = (v0 * v0) / (2 * g * (mu1 * Math.cos(rad(ang)) - Math.sin(rad(ang))));
      pasos.push({ t: 'Il s’arrête sur la rampe', html: `Le frottement freine le bloc après un parcours $s = v_0^2/(2 g (μ_1 cos θ − sin θ))$ = <b>${f(s)} m</b>.` });
      res.paraRampa = s;
      return { p, pasos, res, Ei };
    }
    res.vB = Math.sqrt(vb2);
    const Wr2 = -mu2 * m * g * d;
    const vc2 = vb2 + (2 * Wr2) / m;
    if (vc2 <= 0) {
      const s = vb2 / (2 * mu2 * g);
      pasos.push({ t: 'Tronçon horizontal', html: `Le frottement l’arrête avant le ressort : $1/2 m v_B^2 = μ_2 m g s ⇒ s = v_B^2/(2 μ_2 g)$ = <b>${f(s)} m</b> (sur ${f(d)} m).` });
      res.paraLlano = s;
      res.calor = Ei;
      pasos.push({ t: 'Bilan', html: `Toute l’énergie initiale est dissipée par frottement : Q = ${f(Ei)} J.` });
      return { p, pasos, res, Ei };
    }
    res.vC = Math.sqrt(vc2);
    pasos.push({ t: 'Tronçon horizontal', html: `$W_f2 = −μ_2 m g d$ = <b>${f(Wr2)} J</b> ⇒ $v_C = √(v_B^2 − 2 μ_2 g d)$ = <b>${f(res.vC)} m/s</b> en arrivant au ressort.` });
    if (k > 0) {
      const a = 0.5 * k, b = mu2 * m * g, c = -0.5 * m * vc2;
      const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      res.x = x;
      res.Fmax = k * x;
      pasos.push({ t: 'Compression du ressort', html: `$1/2 k x^2 + μ_2 m g x = 1/2 m v_C^2 ⇒ ${f(a)} x^2 + ${f(b)} x − ${f(-c)} = 0$ ⇒ <b>x = ${f(x)} m</b>. Force maximale du ressort $k x$ = <b>${f(res.Fmax)} N</b>, énergie élastique $1/2 k x^2$ = <b>${f(0.5 * k * x * x)} J</b>.` });
      res.vuelve = k * x > mu2 * m * g;
      pasos.push({ t: 'Ensuite', html: res.vuelve ? `Comme $k x = ${f(k * x)} "N" > μ_2 m g = ${f(mu2 * m * g)} "N"$, le ressort le renvoie vers la rampe. L’animation suit le mouvement complet.` : `Comme $k x ≤ μ_2 m g$, le frottement statique le maintient comprimé : il reste là.` });
    } else pasos.push({ t: 'Sans ressort', html: `Il continue avec $v_C$ = ${f(res.vC)} m/s à la fin du tronçon.` });
    return { p, pasos, res, Ei };
  }

  function simular(sc, tmax = 30, dt = 1 / 600) {
    const p = leer(sc), { m, g, ang, mu1, d, mu2, k, v0, L } = p;
    const th = rad(ang), sin = Math.sin(th), cos = Math.cos(th);
    const bordes = [L, L + d];
    const tramo = (s, sv) => s < L || (s === L && sv < 0); // en la rampa
    const Fap = (s, enRampa) => (enRampa ? m * g * sin : 0) - (s > L + d ? k * (s - L - d) : 0);
    const roz = (enRampa) => (enRampa ? mu1 * m * g * cos : mu2 * m * g);
    let s = 0, v = v0, Q = 0, t = 0;
    const out = [];
    const estado = () => {
      const x = Math.max(0, s - L - d), y = s < L ? (L - s) * sin : 0;
      return { t, s, v, K: 0.5 * m * v * v, Ug: m * g * y, Ue: 0.5 * k * x * x, Q, y, x };
    };
    const paso = (h, dir, enRampa) => {
      const fr = roz(enRampa) * dir;
      const a = (x) => (Fap(x, enRampa) - fr) / m;
      const k1v = a(s), k1s = v;
      const k2v = a(s + (h / 2) * k1s), k2s = v + (h / 2) * k1v;
      const k3v = a(s + (h / 2) * k2s), k3s = v + (h / 2) * k2v;
      const k4v = a(s + h * k3s), k4s = v + h * k3v;
      return { s: s + (h / 6) * (k1s + 2 * k2s + 2 * k3s + k4s), v: v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v) };
    };
    out.push(estado());
    let quieto = 0, siguiente = 1 / 60;
    while (t < tmax) {
      let dir = Math.sign(v);
      const enRampa = tramo(s, dir || Math.sign(Fap(s, s < L)));
      if (dir === 0) {
        const F = Fap(s, enRampa);
        if (Math.abs(F) <= roz(enRampa) + 1e-9) { quieto += dt; t += dt; if (quieto > 0.5) break; if (t >= siguiente) { out.push(estado()); siguiente += 1 / 60; } continue; }
        dir = Math.sign(F);
      }
      quieto = 0;
      let h = dt, n = paso(h, dir, enRampa);
      if (Math.sign(n.v) === -dir) {
        let lo = 0, hi = h;
        for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (Math.sign(paso(mid, dir, enRampa).v) === -dir) hi = mid; else lo = mid; }
        h = lo; n = paso(h, dir, enRampa); n.v = 0; n.para = true;
      }
      for (const b of bordes) {
        if ((s - b) * (n.s - b) < 0) {
          let lo = 0, hi = h;
          for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if ((s - b) * (paso(mid, dir, enRampa).s - b) < 0) hi = mid; else lo = mid; }
          h = hi; n = paso(h, dir, enRampa); n.s = b;
          break;
        }
      }
      Q += roz(enRampa) * Math.abs(n.s - s);
      s = n.s; v = n.v; t += h;
      if (s < 0) { s = 0; v = 0; }
      if (t >= siguiente || n.para) { out.push(estado()); if (t >= siguiente) siguiente += 1 / 60; }
    }
    out.push(estado());
    return { p, puntos: out, E0: out[0].K + out[0].Ug };
  }

  function rampa(sc) {
    const r = rampaDirecta(sc), { m, g, h, ang, mu1, d, mu2, k, v0 } = r.p, th = rad(ang);
    const num = (x) => +String(x ?? '').trim().replace(',', '.');
    const fac = 1 - mu1 / Math.tan(th);
    if (fac > 1e-12) {
      const hmin = Math.max(0, (2 * mu2 * g * d - v0 * v0) / (2 * g * fac));
      r.res.hmin = hmin;
      r.pasos.push({ t: 'Problème inversé : hauteur minimale pour atteindre le ressort', html: `Il arrive juste avec $v_C = 0$ : $v_0^2 + 2 g h (1 − μ_1/{tan θ}) − 2 μ_2 g d = 0 ⇒ h_{min} = {2 μ_2 g d − v_0^2}/{2 g (1 − μ_1/{tan θ})}$ = <b>${f(hmin)} m</b>` });
    }
    if (r.res.vB !== undefined && d > 0) {
      const mu = (r.res.vB * r.res.vB) / (2 * g * d);
      r.res.mu2Para = mu;
      r.pasos.push({ t: 'Problème inversé : frottement du plat pour qu’il s’arrête juste en arrivant au ressort', html: `$1/2 m v_B^2 = μ_2 m g d ⇒ μ_2 = v_B^2/(2 g d) = ${f(r.res.vB)}^2/(2 · ${f(g)} · ${f(d)})$ = <b>${f(mu)}</b>` });
    }
    const xo = num(sc.xobj);
    if (isFinite(xo) && xo > 0 && r.res.vC !== undefined) {
      const kn = (m * r.res.vC * r.res.vC - 2 * mu2 * m * g * xo) / (xo * xo);
      r.res.kPara = kn;
      r.pasos.push({ t: `Problème inversé : ressort nécessaire pour qu’il se comprime de ${f(xo)} m`, html: kn > 0 ? `$1/2 k x^2 + μ_2 m g x = 1/2 m v_C^2 ⇒ k = {m v_C^2 − 2 μ_2 m g x}/{x^2}$ = <b>${f(kn)} N/m</b>` : `Avec ce frottement, le bloc s’arrête avant de le comprimer de ${f(xo)} m, quel que soit le ressort.` });
    }
    return r;
  }

  function porCamino(camino, { m, g, v0, tmax = 20, suelta }) {
    const E = 0.5 * m * v0 * v0 + m * g * camino.at(0).y, out = [];
    let s = 0, v = v0, t = 0, siguiente = 0, libre = null;
    const dt = 1 / 1200;
    const pon = (x, y, vv) => out.push({ t, s, v: vv, x: 0, px: x, py: y, K: 0.5 * m * vv * vv, Ug: m * g * y, Ue: 0, Q: 0 });
    while (t < tmax) {
      if (libre) {
        libre.vy -= g * dt; libre.x += libre.vx * dt; libre.y += libre.vy * dt; t += dt;
        const vv = Math.hypot(libre.vx, libre.vy);
        if (t >= siguiente) { pon(libre.x, libre.y, vv); siguiente += 1 / 60; }
        if (libre.choca(libre)) { pon(libre.x, libre.y, vv); break; }
        continue;
      }
      const a = (q) => -g * Math.sin(camino.at(q).ang);
      const v1 = v + a(s) * dt, s1 = s + 0.5 * (v + v1) * dt;
      s = Math.min(Math.max(s1, 0), camino.S);
      const y = camino.at(s).y, v2 = Math.sqrt(Math.max(0, (2 * (E - m * g * y)) / m));
      v = Math.sign(v1 || 1) * v2; t += dt;
      const q = camino.at(s);
      if (t >= siguiente) { pon(q.x, q.y, Math.abs(v)); siguiente += 1 / 60; }
      if (s >= camino.S || (s <= 0 && v < 0)) { pon(q.x, q.y, Math.abs(v)); break; }
      if (suelta) { const o = suelta(s, v); if (o) { libre = { ...o }; } }
    }
    return { puntos: out, E0: E };
  }

  function rizo(sc) {
    const n = (k, nom, { min = 0, estricto = true } = {}) => { const v = +String(sc[k] ?? '').trim().replace(',', '.'); if (!isFinite(v) || (estricto ? v <= min : v < min)) throw new Error(`${nom} doit être ${estricto ? 'strictement supérieur à' : 'au moins égal à'} ${min}`); return v; };
    const m = n('m', 'La masse'), g = n('g', 'La gravité'), h = n('h', 'La hauteur', { estricto: false }), R = n('R', 'Le rayon de la boucle'), v0 = String(sc.v0 ?? '').trim() === '' ? 0 : n('v0', 'La vitesse initiale', { estricto: false });
    const pasos = [], res = {};
    const E = 0.5 * v0 * v0 + g * h; // energía por unidad de masa, con el fondo del rizo como cero
    res.vAbajo = Math.sqrt(2 * E);
    pasos.push({ t: 'En bas, à l’entrée de la boucle', html: `Sans frottement, l’énergie se conserve : $1/2 m v_0^2 + m g h = 1/2 m v_A^2 ⇒ v_A = √(v_0^2 + 2 g h) = √(${f(v0)}^2 + 2 · ${f(g)} · ${f(h)})$ = <b>${f(res.vAbajo)} m/s</b>` });
    const hmin = Math.max(0, 2.5 * R - (v0 * v0) / (2 * g));
    res.hmin = hmin;
    pasos.push({ t: 'Hauteur minimale pour faire le tour complet', html: `En haut (hauteur 2R), la normale ne peut pas être négative : $m g + N = m v^2/R$ avec $N ≥ 0 ⇒ v_{haut}^2 ≥ g R$. Avec l’énergie : $v_0^2 + 2 g h − 4 g R ≥ g R ⇒ h ≥ 5R/2 − v_0^2/(2g)$ = <b>${f(hmin)} m</b>` });
    const vt2 = 2 * E - 4 * g * R;
    if (vt2 >= g * R - 1e-9) {
      res.completa = true; res.vArriba = Math.sqrt(vt2); res.Narriba = m * (vt2 / R - g); res.Nabajo = m * (2 * E / R + g);
      pasos.push({ t: 'Tout en haut', html: `$v_B = √(v_A^2 − 4 g R)$ = <b>${f(res.vArriba)} m/s</b>, &ensp; $N_B = m (v_B^2/R − g)$ = <b>${f(res.Narriba)} N</b> (vers le bas, vers le centre) : <b>il fait le tour complet</b>.<br>En bas, $N_A = m (v_A^2/R + g)$ = ${f(res.Nabajo)} N : ${f(res.Nabajo / (m * g))} fois son poids.` });
    } else if (E <= g * R) {
      res.completa = false; res.ymax = E / g;
      pasos.push({ t: 'Il ne dépasse pas la moitié', html: `Il ne monte que jusqu’à $y = v_A^2/(2g)$ = <b>${f(res.ymax)} m</b> ≤ R : là il s’arrête, toujours en appui (la normale ne s’annule pas sous le centre), et redescend.` });
    } else {
      const c = (2 * g * R - 2 * E) / (3 * g * R), y = R * (1 - c), vd = Math.sqrt(2 * E - 2 * g * y);
      res.completa = false; res.ydesp = y; res.vdesp = vd; res.angDesp = (Math.acos(c) * 180) / Math.PI;
      pasos.push({ t: 'Il décolle avant d’arriver en haut', html: `À un angle φ depuis le bas : $N = m v^2/R + m g cos φ$ avec $v^2 = v_A^2 − 2 g R (1 − cos φ)$. Elle s’annule quand $cos φ = {2 g R − v_A^2}/{3 g R} = ${f(c)}$ ⇒ φ = ${f(res.angDesp)}°, à la hauteur $y = R (1 − cos φ)$ = <b>${f(y)} m</b>, avec $v$ = ${f(vd)} m/s. À partir de là, il retombe comme un projectile.` });
    }
    const th = rad(40), hh = Math.max(h, 0.05), Li = hh / Math.sin(th), Lx = hh / Math.tan(th), a1 = 0.6 * R, Lr = 2 * Math.PI * R, xc = Lx + a1;
    const camino = { S: Li + a1 + Lr + 1.5 * R, at: (q) => {
      if (q < Li) return { x: q * Math.cos(th), y: hh - q * Math.sin(th), ang: -th };
      if (q < Li + a1) return { x: Lx + (q - Li), y: 0, ang: 0 };
      if (q < Li + a1 + Lr) { const phi = (q - Li - a1) / R; return { x: xc + R * Math.sin(phi), y: R - R * Math.cos(phi), ang: phi, phi }; }
      return { x: xc + (q - Li - a1 - Lr), y: 0, ang: 0 };
    } };
    const suelta = (q, v) => {
      const p = camino.at(q);
      if (p.phi === undefined || p.phi <= Math.PI / 2 || p.phi >= 1.5 * Math.PI) return null;
      if (v * v / R + g * Math.cos(p.phi) >= 0) return null;
      return { x: p.x, y: p.y, vx: v * Math.cos(p.phi), vy: v * Math.sin(p.phi), choca: (o) => Math.hypot(o.x - xc, o.y - R) >= R || o.y <= 0 };
    };
    const sim = porCamino(camino, { m, g, v0, tmax: 15, suelta });
    sim.p = { modo: 'rizo', m, g, h: hh, R, v0, Lx, xc, ang: 40 };
    pasos.unshift({ t: 'Énergie initiale', html: `$E_0 = 1/2 m v_0^2 + m g h = ${f(0.5 * m * v0 * v0 + m * g * h)} "J"$ (le bas de la boucle est la hauteur zéro)` });
    return { p: sim.p, pasos, res, Ei: 0.5 * m * v0 * v0 + m * g * h, sim };
  }

  function pendulo(sc) {
    const vac = (k) => String(sc[k] ?? '').trim() === '';
    const n = (k, nom, { min = 0, estricto = true, max = Infinity } = {}) => { const v = +String(sc[k] ?? '').trim().replace(',', '.'); if (!isFinite(v) || (estricto ? v <= min : v < min) || v > max) throw new Error(`${nom} doit être compris entre ${min} et ${max}`); return v; };
    const m = n('m', 'La masse'), g = n('g', 'La gravité'), L = n('L', 'La longueur');
    const pasos = [], res = {};
    let vb, th0;
    if (!vac('v0')) {
      vb = n('v0', 'La vitesse au point le plus bas', { estricto: false });
      pasos.push({ t: 'Vitesse en bas', html: `Il est lancé depuis le point le plus bas avec $v_A$ = ${f(vb)} m/s.` });
      const c = 1 - (vb * vb) / (2 * g * L);
      th0 = c >= -1 ? Math.acos(c) : null;
    } else {
      th0 = rad(n('th0', 'L’angle initial', { max: 180 }));
      vb = Math.sqrt(2 * g * L * (1 - Math.cos(th0)));
      pasos.push({ t: 'Vitesse au point le plus bas', html: `Il est lâché depuis θ<sub>0</sub> = ${f(th0 * 180 / Math.PI)}°, à une hauteur $h = L (1 − cos θ_0) = ${f(L * (1 - Math.cos(th0)))} "m"$ au-dessus du point le plus bas :<br>$m g L (1 − cos θ_0) = 1/2 m v_A^2 ⇒ v_A = √(2 g L (1 − cos θ_0))$ = <b>${f(vb)} m/s</b>` });
    }
    res.vAbajo = vb; res.Tabajo = m * (g + (vb * vb) / L);
    pasos.push({ t: 'Tension au point le plus bas', html: `$T − m g = m v_A^2/L ⇒ T_A = m (g + v_A^2/L)$ = <b>${f(res.Tabajo)} N</b>${th0 !== null && vac('v0') ? ` ($= m g (3 − 2 cos θ_0)$)` : ''}` });
    if (vb * vb >= 5 * g * L - 1e-9) {
      res.vuelta = true; res.vArriba = Math.sqrt(vb * vb - 4 * g * L); res.Tarriba = m * ((res.vArriba ** 2) / L - g);
      pasos.push({ t: 'Il fait le tour complet', html: `$v_A^2 ≥ 5 g L$ = ${f(5 * g * L)} : en haut $v = √(v_A^2 − 4 g L)$ = <b>${f(res.vArriba)} m/s</b> et $T = m (v^2/L − g)$ = ${f(res.Tarriba)} N.` });
    } else if (vb * vb > 2 * g * L) {
      const c = (2 * g * L - vb * vb) / (3 * g * L);
      res.angAfloja = (Math.acos(-c) * 180) / Math.PI; res.vuelta = false;
      pasos.push({ t: 'Le fil se détend', html: `Il dépasse l’horizontale mais n’arrive pas en haut avec de la tension : $T = m (v^2/L − g cos α)$ s’annule pour α = ${f(180 - res.angAfloja)}° par rapport à la verticale du haut, c’est-à-dire à ${f(res.angAfloja)}° depuis le bas. À partir de là, il retombe comme un projectile.` });
    } else if (th0 !== null) res.amplitud = th0 * 180 / Math.PI;
    if (!vac('th')) {
      const a = rad(n('th', 'L’angle demandé', { estricto: false, max: 180 })), v2 = vb * vb - 2 * g * L * (1 - Math.cos(a));
      if (v2 < 0) pasos.push({ t: `En θ = ${f(a * 180 / Math.PI)}°`, html: 'Il n’atteint pas cet angle.' });
      else {
        res.vEn = Math.sqrt(v2); res.TEn = m * (v2 / L + g * Math.cos(a));
        pasos.push({ t: `En θ = ${f(a * 180 / Math.PI)}°`, html: `$v = √(v_A^2 − 2 g L (1 − cos θ))$ = <b>${f(res.vEn)} m/s</b>, &ensp; $T = m (v^2/L + g cos θ)$ = <b>${f(res.TEn)} N</b>` });
      }
    }
    if (th0 !== null && th0 < rad(20) && !res.vuelta) pasos.push({ t: 'Période (petites oscillations)', html: `$T = 2 π √(L/g)$ = <b>${f(2 * Math.PI * Math.sqrt(L / g))} s</b>` });
    const out = [], dt = 1 / 1200;
    let th = th0 !== null && vac('v0') ? th0 : 0, w = vac('v0') ? 0 : vb / L, t = 0, sig = 0, libre = null;
    const tmax = Math.min(12, 2.5 * 2 * Math.PI * Math.sqrt(L / g) * (th0 !== null ? 1 + (th0 * th0) / 16 : 1.5));
    while (t < tmax) {
      if (libre) { libre.vy -= g * dt; libre.x += libre.vx * dt; libre.y += libre.vy * dt; t += dt; if (t >= sig) { const vv = Math.hypot(libre.vx, libre.vy); out.push({ t, s: 0, v: vv, x: 0, px: libre.x, py: libre.y, K: 0.5 * m * vv * vv, Ug: m * g * (libre.y + L), Ue: 0, Q: 0, libre: true }); sig += 1 / 60; } if (Math.hypot(libre.x, libre.y) >= L) break; continue; }
      const f1 = (q) => -(g / L) * Math.sin(q);
      const k1 = w, l1 = f1(th), k2 = w + 0.5 * dt * l1, l2 = f1(th + 0.5 * dt * k1), k3 = w + 0.5 * dt * l2, l3 = f1(th + 0.5 * dt * k2), k4 = w + dt * l3, l4 = f1(th + dt * k3);
      th += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4); w += (dt / 6) * (l1 + 2 * l2 + 2 * l3 + l4); t += dt;
      const v = Math.abs(w) * L, y = L * (1 - Math.cos(th));
      if (t >= sig) { out.push({ t, s: th, v, x: 0, px: L * Math.sin(th), py: -L * Math.cos(th), K: 0.5 * m * v * v, Ug: m * g * y, Ue: 0, Q: 0 }); sig += 1 / 60; }
      if (w * w * L + g * Math.cos(th) < 0) libre = { x: L * Math.sin(th), y: -L * Math.cos(th), vx: w * L * Math.cos(th), vy: w * L * Math.sin(th) };
    }
    const sim = { puntos: out, E0: 0.5 * m * vb * vb, p: { modo: 'pendulo', m, g, L } };
    return { p: sim.p, pasos, res, Ei: sim.E0, sim };
  }

  function montana(sc) {
    const n = (k, nom, { min = 0, estricto = true } = {}) => { const v = +String(sc[k] ?? '').trim().replace(',', '.'); if (!isFinite(v) || (estricto ? v <= min : v < min)) throw new Error(`${nom} doit être ${estricto ? 'strictement supérieur à' : 'au moins égal à'} ${min}`); return v; };
    const m = n('m', 'La masse'), g = n('g', 'La gravité'), sep = n('sep', 'La distance entre les points'), v0 = String(sc.v0 ?? '').trim() === '' ? 0 : n('v0', 'La vitesse initiale', { estricto: false });
    const hs = String(sc.alturas ?? '').split(/[;\s]+|,\s+/).map((x) => x.trim()).filter(Boolean).map((x) => +x.replace(',', '.'));
    if (hs.length < 2 || hs.some((x) => !isFinite(x) || x < 0)) throw new Error('Écris au moins deux hauteurs, séparées par des points-virgules ou des espaces (par exemple 30 ; 10 ; 22)');
    if (hs.length > 12) throw new Error('12 points au maximum');
    const pasos = [], res = { v: [] }, h0 = hs[0], E = 0.5 * v0 * v0 + g * h0;
    pasos.push({ t: 'Conservation de l’énergie', html: `Sans frottement, en chaque point $1/2 v^2 + g h = 1/2 v_0^2 + g h_1$, donc $v = √(v_0^2 + 2 g (h_1 − h))$. Avec $v_0$ = ${f(v0)} m/s et $h_1$ = ${f(h0)} m, il peut monter au plus jusqu’à $h_{max} = h_1 + v_0^2/(2g)$ = <b>${f(E / g)} m</b>.` });
    let llega = hs.length;
    for (let i = 1; i < hs.length; i++) {
      const v2 = 2 * (E - g * hs[i]);
      if (v2 < -1e-9) { llega = i; pasos.push({ t: `Point ${i + 1} (h = ${f(hs[i])} m)`, html: `<b>Il n’y arrive pas</b> : il faudrait $h ≤ ${f(E / g)} "m"$. Il s’arrête avant et revient en arrière.` }); break; }
      res.v.push(Math.sqrt(Math.max(0, v2)));
      pasos.push({ t: `Point ${i + 1} (h = ${f(hs[i])} m)`, html: `$v_${i + 1} = √(${f(v0)}^2 + 2 · ${f(g)} · (${f(h0)} − ${f(hs[i])}))$ = <b>${f(Math.sqrt(Math.max(0, v2)))} m/s</b> (${f(Math.sqrt(Math.max(0, v2)) * 3.6)} km/h)` });
    }
    res.llega = llega; res.vmax = Math.sqrt(2 * (E - g * Math.min(...hs.slice(0, llega))));
    const xs = hs.map((_, i) => i * sep), pt = [];
    const cr = (p0, p1, p2, p3, u) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
    for (let i = 0; i < hs.length - 1; i++) for (let j = 0; j < 40; j++) {
      const u = j / 40, H = (k) => hs[Math.max(0, Math.min(hs.length - 1, k))];
      pt.push({ x: xs[i] + u * sep, y: Math.max(0, cr(H(i - 1), H(i), H(i + 1), H(i + 2), u)) });
    }
    pt.push({ x: xs[xs.length - 1], y: hs[hs.length - 1] });
    const sAc = [0]; for (let i = 1; i < pt.length; i++) sAc.push(sAc[i - 1] + Math.hypot(pt[i].x - pt[i - 1].x, pt[i].y - pt[i - 1].y));
    const camino = { S: sAc[sAc.length - 1], pt, at: (q) => {
      let i = 1; while (i < sAc.length - 1 && sAc[i] < q) i++;
      const a = pt[i - 1], b = pt[i], u = (q - sAc[i - 1]) / Math.max(sAc[i] - sAc[i - 1], 1e-12);
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, ang: Math.atan2(b.y - a.y, b.x - a.x) };
    } };
    const sim = porCamino(camino, { m, g, v0, tmax: 25 });
    sim.p = { modo: 'montana', m, g, hs, sep, pt };
    pasos.unshift({ t: 'Énergie initiale', html: `$E_0 = 1/2 m v_0^2 + m g h_1 = ${f(0.5 * m * v0 * v0 + m * g * h0)} "J"$` });
    return { p: sim.p, pasos, res, Ei: 0.5 * m * v0 * v0 + m * g * h0, sim };
  }

  function fuerza(sc) {
    const vac = (k) => String(sc[k] ?? '').trim() === '', num = (k) => +String(sc[k]).trim().replace(',', '.');
    const pares = String(sc.puntos ?? '').split(';').map((x) => x.trim()).filter(Boolean).map((q) => q.split(/\s+|,\s*(?=[−-]?\d)/).filter(Boolean).map((z) => +z.replace(',', '.').replace('−', '-')));
    if (pares.length < 2 || pares.some((q) => q.length !== 2 || !q.every(isFinite))) throw new Error('Écris les points du graphique sous la forme « x F ; x F ; … » (par exemple 0 0 ; 2 10 ; 5 10 ; 7 0)');
    for (let i = 1; i < pares.length; i++) if (pares[i][0] <= pares[i - 1][0]) throw new Error('Les x des points doivent être par ordre croissant');
    const pasos = [], res = {};
    let W = 0; const trozos = [];
    for (let i = 1; i < pares.length; i++) { const [x1, F1] = pares[i - 1], [x2, F2] = pares[i], a = 0.5 * (F1 + F2) * (x2 - x1); W += a; trozos.push(`½(${f(F1)} + ${f(F2)})·${f(x2 - x1)}`); }
    res.W = W;
    pasos.push({ t: 'Travail = aire sous le graphique de F(x)', html: `La force varie avec la position, donc $W = ∫ F dx$ : l’aire entre le graphique et l’axe (négative là où F < 0). Avec des segments droits, chacun est un trapèze :<br>W = ${trozos.join(' + ')} = <b>${f(W)} J</b>` });
    if (!vac('m')) {
      const m = num('m'), v0 = vac('v0') ? 0 : num('v0');
      if (!(m > 0)) throw new Error('La masse doit être supérieure à 0');
      const v2 = v0 * v0 + (2 * W) / m;
      res.v = v2 >= 0 ? Math.sqrt(v2) : null;
      pasos.push({ t: 'Théorème de l’énergie cinétique', html: v2 >= 0 ? `Si c’est la seule force qui travaille : $W = 1/2 m v^2 − 1/2 m v_0^2 ⇒ v = √(v_0^2 + 2 W/m) = √(${f(v0)}^2 + 2 · ${f(W)}/${f(m)})$ = <b>${f(res.v)} m/s</b>` : 'Le travail est négatif et supérieur à l’énergie cinétique initiale : le corps s’arrête avant la fin.' });
      if (res.v !== null) { const Ff = pares[pares.length - 1][1]; res.Pfin = Ff * res.v; pasos.push({ t: 'Puissance instantanée à la fin', html: `$P = F v = ${f(Ff)} · ${f(res.v)}$ = <b>${f(res.Pfin)} W</b>` }); }
    }
    if (!vac('t')) { const tt = num('t'); if (!(tt > 0)) throw new Error('Le temps doit être supérieur à 0'); res.Pmedia = W / tt; pasos.push({ t: 'Puissance moyenne', html: `$P_m = W/t = ${f(W)}/${f(tt)}$ = <b>${f(res.Pmedia)} W</b> (${f(res.Pmedia / 735.5)} ch)` }); }
    return { p: { modo: 'fuerza', pares }, pasos, res, Ei: 0, sim: null };
  }

  function resolver(sc) {
    const modo = sc.modo || 'rampa';
    if (modo === 'rizo') return rizo(sc);
    if (modo === 'pendulo') return pendulo(sc);
    if (modo === 'montana') return montana(sc);
    if (modo === 'fuerza') return fuerza(sc);
    return rampa(sc);
  }

  const ejemplos = [
    { clave: 'rampa-muelle', nombre: 'Rampe, plat et ressort', sc: { m: 2, g: 9.8, h: 5, ang: 30, mu1: 0.1, d: 4, mu2: 0.2, k: 200, v0: 0 } },
    { clave: 'sin-rozamiento', nombre: 'Sans frottement : il oscille indéfiniment', sc: { m: 1, g: 9.8, h: 2, ang: 45, mu1: 0, d: 3, mu2: 0, k: 100, v0: 0 } },
    { clave: 'para-llano', nombre: 'Il s’arrête avant le ressort', sc: { m: 2, g: 9.8, h: 5, ang: 30, mu1: 0.1, d: 10, mu2: 0.5, k: 200, v0: 0 } },
    { clave: 'no-arranca', nombre: 'Le frottement le retient sur la rampe', sc: { m: 2, g: 9.8, h: 1, ang: 20, mu1: 0.5, d: 4, mu2: 0.2, k: 200, v0: 0 } },
    { clave: 'empujon', nombre: 'Avec une poussée initiale', sc: { m: 2, g: 9.8, h: 1, ang: 20, mu1: 0.5, d: 4, mu2: 0.2, k: 200, v0: 3 } },
    { clave: 'muelle-duro', nombre: 'Ressort raide qui le renvoie vers la rampe', sc: { m: 0.5, g: 9.8, h: 3, ang: 40, mu1: 0.05, d: 2, mu2: 0.05, k: 800, v0: 0 } },
    { clave: 'rizo-justo', nombre: 'Boucle : hauteur minimale pour faire le tour', sc: { modo: 'rizo', m: '0,5', g: '9,8', h: '6', R: '2', v0: '' } },
    { clave: 'rizo-despega', nombre: 'Boucle : il décolle avant d’arriver en haut', sc: { modo: 'rizo', m: '0,5', g: '9,8', h: '4', R: '2', v0: '' } },
    { clave: 'pendulo', nombre: 'Pendule lâché à 60°', sc: { modo: 'pendulo', m: '0,2', g: '9,8', L: '1', th0: '60', th: '30', v0: '' } },
    { clave: 'pendulo-vuelta', nombre: 'Pendule lancé : fait-il le tour ?', sc: { modo: 'pendulo', m: '0,2', g: '9,8', L: '0,8', th0: '', th: '', v0: '7' } },
    { clave: 'montana', nombre: 'Montagnes russes sans frottement', sc: { modo: 'montana', m: '400', g: '9,8', alturas: '30; 8; 22; 4; 25; 12', sep: '15', v0: '2' } },
    { clave: 'fuerza-variable', nombre: 'Travail d’une force variable (graphique F-x)', sc: { modo: 'fuerza', puntos: '0 0; 2 20; 6 20; 8 0; 10 −10', m: '4', v0: '0', t: '3' } },
  ];

  return { resolver, simular, leer, f, ejemplos };
})();

