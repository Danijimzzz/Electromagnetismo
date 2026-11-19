const Doppler = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const fq = (x) => f(x, Math.min(12, Math.max(4, Math.floor(Math.log10(Math.abs(x) || 1)) + 2)));
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} doit être un nombre`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} doit être ${cero ? 'positif ou nul' : 'strictement positif'}`);
    return v;
  }
  const sentido = (v, quien) => (v > 0 ? `${quien} s’approche` : v < 0 ? `${quien} s’éloigne` : `${quien} est immobile`);
  const tono = (fp, fr) => (fp > fr ? 'Le son est plus aigu que celui émis.' : fp < fr ? 'Le son est plus grave que celui émis.' : 'Le son est identique à celui émis.');

  function recta(sc) {
    const fr = lee(sc, 'f', 'la fréquence émise'), v = lee(sc, 'v', 'la vitesse du son');
    const vF0 = lee(sc, 'vF', 'la vitesse de la source', { opcional: true, signo: true }) ?? 0;
    const vO0 = lee(sc, 'vO', 'la vitesse de l’observateur', { opcional: true, signo: true }) ?? 0;
    const w = lee(sc, 'w', 'la vitesse du vent', { opcional: true, signo: true }) ?? 0;
    const aF = lee(sc, 'aF', 'l’angle de la source', { opcional: true, signo: true }) ?? 0;
    const aO = lee(sc, 'aO', 'l’angle de l’observateur', { opcional: true, signo: true }) ?? 0;
    const cos = (a) => (Math.abs(a % 180) === 90 ? 0 : Math.cos((a * Math.PI) / 180));
    const vF = vF0 * cos(aF), vO = vO0 * cos(aO);
    const ve = v + w; // velocidad del sonido respecto al suelo, de la fuente al observador
    if (ve <= 0) throw new Error('Le vent de face est aussi fort que le son : l’onde n’atteint pas l’observateur');
    if (vF >= ve) throw new Error('La source va vers l’observateur à la vitesse du son ou plus vite : une onde de choc se forme et la formule de Doppler ne s’applique pas (voir l’onglet « Onde de choc »)');
    if (-vO >= ve) throw new Error('L’observateur s’éloigne à la vitesse du son ou plus : l’onde ne l’atteint pas');
    const fp = (fr * (ve + vO)) / (ve - vF), lam = ve / fr, lamp = (ve - vF) / fr;
    const pasos = [
      { t: 'Convention de signes', html: `Les vitesses sont positives quand la source et l’observateur se rapprochent l’un de l’autre : ${sentido(vF, 'la source')} ($v_F = ${f(vF)}$ m/s) et ${sentido(vO, 'l’observateur')} ($v_O = ${f(vO)}$ m/s).` },
    ];
    if (aF || aO) pasos.unshift({ t: 'Vitesses qui forment un angle', html: `Seule compte la composante de chaque vitesse le long de la droite qui joint la source et l’observateur ; la composante perpendiculaire ne rapproche ni n’éloigne et ne change pas le ton :${aF ? ` $v_F = ${f(vF0)} · cos ${f(aF)}° = ${f(vF)}$ m/s` : ''}${aF && aO ? ',' : ''}${aO ? ` $v_O = ${f(vO0)} · cos ${f(aO)}° = ${f(vO)}$ m/s` : ''}.` });
    if (w) pasos.push({ t: 'Vent', html: `L’air se déplace ${w > 0 ? 'de la source vers l’observateur' : 'de l’observateur vers la source'}, donc par rapport au sol le son va vers l’observateur à $v + w = ${f(v)} ${w < 0 ? '−' : '+'} ${f(Math.abs(w))} = ${f(ve)}$ m/s. Dans la formule, on met cette vitesse à la place de $v$.` });
    const V = w ? 'v + w' : 'v', Vn = w ? `${f(ve)}` : f(v);
    pasos.push({ t: 'Fréquence entendue', html: `$f′ = f (${V} + v_O)/(${V} − v_F) = ${fq(fr)} · (${Vn} + ${p(vO)})/(${Vn} − ${p(vF)})$ = <b>${fq(fp)} Hz</b><br>${tono(fp, fr)} La variation est de ${fp >= fr ? '+' : '−'}${fq(Math.abs(fp - fr))} Hz (${f((100 * (fp - fr)) / fr, 3)} %).` });
    pasos.push({ t: 'Longueur d’onde entre les deux', html: `$λ′ = (${V} − v_F)/f = (${Vn} − ${p(vF)})/${fq(fr)}$ = <b>${f(lamp)} m</b><br>Avec la source immobile, on aurait $λ = ${V}/f = ${f(lam)}$ m. Le mouvement de l’observateur ne change pas λ : il change la rapidité avec laquelle les fronts lui parviennent.` });
    return { modo: 'recta', fr, v, vF, vO, vF0, vO0, aF, aO, w, ve, fp, lam, lamp, pasos };
  }

  function paso(sc) {
    const v = lee(sc, 'v', 'la vitesse du son');
    let fr, u, f1, f2;
    const pasos = [];
    if (sc.datos === 'oidas') {
      f1 = lee(sc, 'f1', 'la fréquence entendue pendant le rapprochement'); f2 = lee(sc, 'f2', 'la fréquence entendue pendant l’éloignement');
      if (f2 >= f1) throw new Error('Quand la source s’approche, le son est plus aigu que quand elle s’éloigne : f₁ doit être supérieure à f₂');
      u = (v * (f1 - f2)) / (f1 + f2); fr = (2 * f1 * f2) / (f1 + f2);
      pasos.push({ t: 'Les deux équations', html: `Rapprochement : $f_1 = f v/(v − u)$ &nbsp; Éloignement : $f_2 = f v/(v + u)$` });
      pasos.push({ t: 'Vitesse de la source', html: `En divisant l’une par l’autre, $f$ disparaît : $f_1/f_2 = (v + u)/(v − u)$, et en isolant $u = v (f_1 − f_2)/(f_1 + f_2) = ${f(v)} · (${fq(f1)} − ${fq(f2)})/(${fq(f1)} + ${fq(f2)})$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h)` });
      pasos.push({ t: 'Fréquence émise', html: `$f = f_1 (v − u)/v = 2 f_1 f_2/(f_1 + f_2) = 2 · ${fq(f1)} · ${fq(f2)}/(${fq(f1)} + ${fq(f2)})$ = <b>${fq(fr)} Hz</b>` });
    } else {
      fr = lee(sc, 'f', 'la fréquence émise'); u = lee(sc, 'vF', 'la vitesse de la source');
      if (u >= v) throw new Error('La source va à la vitesse du son ou plus vite : une onde de choc se forme (voir l’onglet « Onde de choc »)');
      f1 = (fr * v) / (v - u); f2 = (fr * v) / (v + u);
      pasos.push({ t: 'Pendant le rapprochement', html: `$f_1 = f v/(v − v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} − ${f(u)})$ = <b>${fq(f1)} Hz</b>` });
      pasos.push({ t: 'Une fois passée, pendant l’éloignement', html: `$f_2 = f v/(v + v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} + ${f(u)})$ = <b>${fq(f2)} Hz</b>` });
    }
    const salto = f1 - f2;
    pasos.push({ t: 'Saut de fréquence au passage', html: `$Δf = f_1 − f_2 = ${fq(f1)} − ${fq(f2)}$ = <b>${fq(salto)} Hz</b>, ${f((1200 * Math.log2(f1 / f2)) / 100, 3)} demi-tons (en musique, un demi-ton correspond à un rapport de $2^{1/12}$).` });
    const d = lee(sc, 'd', 'la distance à la route', { opcional: true, cero: true }) ?? 0;
    let curva = null;
    if (d > 0) {
      const L = Math.max(8 * d, 40), xs = [];
      for (let i = 0; i <= 200; i++) { const x = -L + (2 * L * i) / 200, c = -x / Math.hypot(x, d); xs.push({ x, t: x / u, tr: x / u + Math.hypot(x, d) / v, fp: (fr * v) / (v - u * c) }); }
      curva = { d, L, puntos: xs };
      pasos.push({ t: `Observateur à ${f(d)} m de la route`, html: `Seule compte la composante de la vitesse de la source dans la direction de l’observateur, $v_F cos α$, avec α l’angle entre la route et la droite source–observateur : $f′ = f v/(v − v_F cos α)$. Loin, cos α ≈ ±1 et on entend $f_1$ et $f_2$ ; juste en face, cos α = 0 et on entend la fréquence émise, ${fq(fr)} Hz. Le graphique montre le changement graduel en fonction de l’instant où on l’entend : le son met $r/v$ pour arriver, donc le ton entendu juste quand la source passe en face est déjà plus grave que $f$.` });
    }
    return { modo: 'paso', datos: sc.datos === 'oidas' ? 'oidas' : 'fuente', fr, v, u, f1, f2, salto, d, curva, pasos };
  }

  function eco(sc) {
    const fr = lee(sc, 'f', 'la fréquence émise'), v = lee(sc, 'v', 'la vitesse de l’onde');
    const vE = lee(sc, 'vE', 'la vitesse de l’émetteur', { opcional: true, signo: true }) ?? 0;
    if (Math.abs(vE) >= v) throw new Error('L’émetteur va à la vitesse de l’onde ou plus vite : la formule de Doppler ne s’applique pas');
    let u;
    const pasos = [{ t: 'Deux effets Doppler successifs', html: `1) L’obstacle reçoit l’onde comme un observateur : $f_R = f (v + u)/(v − v_E)$<br>2) Il la renvoie comme une source qui se déplace avec lui, et l’émetteur l’entend : $f″ = f_R (v + v_E)/(v − u)$<br>Vitesses positives quand elles se rapprochent : $v_E$ celle de l’émetteur, $u$ celle de l’obstacle.` }];
    if (sc.buscar === 'velocidad') {
      const df = lee(sc, 'df', 'la différence de fréquences', { signo: true });
      const r = (fr + df) / fr, k = (r * (v - vE)) / (v + vE);
      if (!(r > 0)) throw new Error('La fréquence de l’écho doit être positive : la différence est trop négative');
      u = (v * (k - 1)) / (k + 1);
      pasos.push({ t: 'Vitesse de l’obstacle', html: `L’écho arrive avec $f″ = f + Δf = ${fq(fr)} + ${p(df)} = ${fq(fr + df)}$ Hz. À partir de $f″/f = (v + u)(v + v_E)/((v − u)(v − v_E))$, avec $k = (f″/f)(v − v_E)/(v + v_E) = ${f(k, 6)}$, on obtient $u = v (k − 1)/(k + 1)$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h), ${u > 0 ? 'en se rapprochant' : u < 0 ? 'en s’éloignant' : 'immobile'}.` });
    } else {
      u = lee(sc, 'u', 'la vitesse de l’obstacle', { signo: true });
    }
    if (Math.abs(u) >= v) throw new Error('L’obstacle va à la vitesse de l’onde ou plus vite : la formule de Doppler ne s’applique pas');
    const fR = (fr * (v + u)) / (v - vE), fpp = (fR * (v + vE)) / (v - u), df = fpp - fr;
    if (sc.buscar !== 'velocidad') {
      pasos.push({ t: 'Fréquence reçue par l’obstacle', html: `$f_R = ${fq(fr)} · (${f(v)} + ${p(u)})/(${f(v)} − ${p(vE)})$ = <b>${fq(fR)} Hz</b>` });
      pasos.push({ t: 'Fréquence de l’écho', html: `$f″ = ${fq(fR)} · (${f(v)} + ${p(vE)})/(${f(v)} − ${p(u)})$ = <b>${fq(fpp)} Hz</b>` });
    }
    pasos.push({ t: 'Battements', html: `En mélangeant l’onde émise avec l’écho, on entend (ou on mesure) $Δf = f″ − f$ = <b>${fq(df)} Hz</b>${Math.abs(u) + Math.abs(vE) < 0.01 * v ? `<br>Avec des vitesses très inférieures à v, l’approximation $Δf ≈ 2 (u + v_E) f/v = ${f((2 * (u + vE) * fr) / v)}$ Hz est valable, celle qu’utilisent les radars routiers.` : ''}` });
    return { modo: 'eco', buscar: sc.buscar === 'velocidad' ? 'velocidad' : 'frecuencia', fr, v, vE, u, fR, fpp, df, pasos };
  }

  function choque(sc) {
    const v = lee(sc, 'v', 'la vitesse du son'), vF = lee(sc, 'vF', 'la vitesse de la source');
    if (vF <= v) throw new Error('Pour qu’il y ait une onde de choc, la source doit aller plus vite que le son (nombre de Mach supérieur à 1)');
    const M = vF / v, th = Math.asin(v / vF), gr = (th * 180) / Math.PI;
    const pasos = [
      { t: 'Nombre de Mach', html: `$M = v_F/v = ${f(vF)}/${f(v)}$ = <b>${f(M)}</b>` },
      { t: 'Demi-angle du cône de Mach', html: `Les fronts d’onde restent en arrière et leur enveloppe est un cône : $sin θ = v/v_F = 1/M = ${f(1 / M)}$, donc θ = <b>${f(gr)}°</b>` },
    ];
    const h = lee(sc, 'h', 'la hauteur', { opcional: true });
    let x = null, t = null, r = null;
    if (h) {
      x = h / Math.tan(th); t = x / vF; r = h / Math.sin(th);
      pasos.push({ t: 'Quand on entend le bang', html: `Le cône atteint le sol derrière l’avion. Quand tu l’entends, l’avion est déjà passé au-dessus de toi et se trouve à une distance horizontale $x = h/tan θ = ${f(h)}/tan ${f(gr)}°$ = <b>${f(x)} m</b>.<br>Il s’est écoulé un temps $t = x/v_F$ = <b>${f(t)} s</b> depuis qu’il était au-dessus de toi, et il se trouve à $r = h/sin θ = ${f(r)}$ m de toi.` });
    }
    return { modo: 'choque', v, vF, M, th, gr, h, x, t, r, pasos };
  }

  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C = SI.c;
  function luz(sc) {
    const lam = lee(sc, 'lam', 'la longueur d’onde émise');
    const pasos = [];
    let beta, lamO, geo = sc.geo === 'transversal' ? 'transversal' : 'radial';
    if (sc.dato === 'observado') {
      geo = 'radial';
      lamO = lee(sc, 'lamO', 'la longueur d’onde observée');
      const R = lamO / lam; beta = (R * R - 1) / (R * R + 1);
      pasos.push({ t: 'Vitesse à partir du décalage', html: `Pour une source qui s’éloigne en ligne droite, $λ′/λ = √((1 + β)/(1 − β))$. Avec $R = λ′/λ = ${f(lamO)}/${f(lam)} = ${f(R, 6)}$, on isole $β = (R^2 − 1)/(R^2 + 1)$ = <b>${f(beta)}</b>, c’est-à-dire $v = β c$ = <b>${f(beta * C)} m/s</b> ${beta > 0 ? 'en s’éloignant' : beta < 0 ? 'en se rapprochant' : '(immobile)'}.` });
    } else {
      beta = lee(sc, 'beta', 'β = v/c', { signo: true });
      if (Math.abs(beta) >= 1) throw new Error('Rien ne va à la vitesse de la lumière ou plus vite : β doit être compris entre −1 et 1');
    }
    const g = 1 / Math.sqrt(1 - beta * beta);
    const k = geo === 'transversal' ? g : Math.sqrt((1 + beta) / (1 - beta)); // λ′/λ
    lamO = lam * k;
    const z = k - 1, kc = geo === 'transversal' ? 1 : 1 + beta, nu = C / (lam * 1e-9);
    if (sc.dato !== 'observado') {
      pasos.push({ t: 'Convention', html: `$β = v/c = ${f(beta)}$, positive si la source s’éloigne et négative si elle se rapproche. Facteur de Lorentz $γ = 1/√(1 − β^2) = ${f(g, 6)}$.` });
      pasos.push(geo === 'transversal'
        ? { t: 'Doppler transverse', html: `Si la source se déplace perpendiculairement à la ligne de visée, il n’y a pas d’effet classique, mais son horloge ralentit (dilatation du temps) : $λ′ = γ λ = ${f(g, 6)} · ${f(lam)}$ = <b>${f(lamO)} nm</b>. C’est un effet purement relativiste.` }
        : { t: 'Doppler relativiste', html: `$λ′ = λ √((1 + β)/(1 − β)) = ${f(lam)} · √((1 + ${p(beta)})/(1 − ${p(beta)}))$ = <b>${f(lamO)} nm</b>` });
    }
    pasos.push({ t: 'Fréquence et décalage', html: `$f = c/λ = ${f(nu)}$ Hz et $f′ = f λ/λ′ = ${f(nu / k)}$ Hz. Décalage $z = λ′/λ − 1$ = <b>${f(z)}</b> : ${z > 0 ? 'vers le rouge (la source s’éloigne ou son horloge ralentit)' : z < 0 ? 'vers le bleu (la source se rapproche)' : 'aucun'}.` });
    pasos.push({ t: 'Comparaison avec la formule classique', html: geo === 'transversal' ? `Classiquement, une source qui se déplace perpendiculairement à la ligne de visée ne change pas la couleur : $λ′ = λ$. La différence, $${f(lamO - lam)}$ nm, vient uniquement de la dilatation du temps.` : `Pour $|β| ≪ 1$, on a $λ′ ≈ λ (1 + β) = ${f(lam * kc)}$ nm (ou $z ≈ β$), qui s’écarte de la valeur exacte de ${f((100 * Math.abs(lam * kc - lamO)) / lamO, 3)} %.` });
    return { modo: 'luz', dato: sc.dato === 'observado' ? 'observado' : 'fuente', geo, lam, lamO, beta, g, z, k, nu, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'luz') return luz(sc);
    if (sc.modo === 'paso') return paso(sc);
    if (sc.modo === 'eco') return eco(sc);
    if (sc.modo === 'choque') return choque(sc);
    return recta(sc);
  }

  const ejemplos = [
    { clave: 'ambulancia', nombre: 'Ambulance qui s’approche d’un piéton', sc: { modo: 'recta', f: '700', v: '340', vF: '25', vO: '0', w: '' } },
    { clave: 'dos-coches', nombre: 'Deux voitures qui s’éloignent', sc: { modo: 'recta', f: '500', v: '340', vF: '-20', vO: '-15', w: '' } },
    { clave: 'viento', nombre: 'Sirène avec vent arrière', sc: { modo: 'recta', f: '1000', v: '340', vF: '0', vO: '10', w: '15' } },
    { clave: 'tren', nombre: 'Train qui traverse une gare', sc: { modo: 'paso', datos: 'fuente', f: '440', v: '343', vF: '30', d: '15' } },
    { clave: 'moto', nombre: 'Vitesse d’une moto d’après son bruit', sc: { modo: 'paso', datos: 'oidas', f1: '520', f2: '440', v: '340' } },
    { clave: 'radar', nombre: 'Radar routier', sc: { modo: 'eco', buscar: 'frecuencia', f: '24e9', v: '3e8', vE: '0', u: '33' } },
    { clave: 'murcielago', nombre: 'Chauve-souris qui vole vers un mur', sc: { modo: 'eco', buscar: 'frecuencia', f: '40000', v: '340', vE: '6', u: '0' } },
    { clave: 'ecografia', nombre: 'Vitesse du sang avec une échographie Doppler', sc: { modo: 'eco', buscar: 'velocidad', f: '5e6', v: '1540', vE: '0', df: '1300' } },
    { clave: 'avion', nombre: 'Avion supersonique et bang', sc: { modo: 'choque', v: '340', vF: '680', h: '8000' } },
    { clave: 'cruce', nombre: 'Voiture qui passe en biais', sc: { modo: 'recta', f: '600', v: '340', vF: '30', vO: '0', w: '', aF: '60', aO: '' } },
    { clave: 'galaxia', nombre: 'Vitesse d’une galaxie d’après son décalage vers le rouge', sc: { modo: 'luz', dato: 'observado', lam: '656,3', lamO: '721,9' } },
    { clave: 'estrella', nombre: 'Étoile qui s’approche à 0,1c', sc: { modo: 'luz', dato: 'fuente', geo: 'radial', lam: '500', beta: '-0,1' } },
    { clave: 'transversal', nombre: 'Doppler transverse à 0,6c', sc: { modo: 'luz', dato: 'fuente', geo: 'transversal', lam: '500', beta: '0,6' } },
  ];

  return { resolver, recta, paso, eco, choque, luz, ejemplos, f, fq, C };
})();

