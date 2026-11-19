const Fluidos = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Il manque ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} doit être un nombre`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    return v;
  }
  const G = 9.8, ATM = 101325;
  const MATERIALES = [['l’or', 19300], ['le plomb', 11340], ['l’argent', 10490], ['le cuivre', 8960], ['le fer', 7870], ['l’aluminium', 2700]];
  const gDe = (sc) => lee(sc, 'g', 'la gravité', { opcional: true }) ?? G;
  const circulo = (dcm) => (Math.PI * (dcm / 100) ** 2) / 4; // área en m² de un círculo de diámetro en cm
  const areaPaso = (nom, A, dcm) => `$A_${nom} = {π d_${nom}^2}/{4} = {π · ${f(dcm / 100)}^2}/{4}$ = ${f(A)} m²`;

  function presion(sc) {
    const rho = lee(sc, 'rho', 'la masse volumique du liquide'), h = lee(sc, 'h', 'la profondeur', { cero: true }), g = gDe(sc);
    const p0dato = lee(sc, 'p0', 'la pression à la surface', { opcional: true, cero: true });
    const p0 = p0dato ?? ATM, A = lee(sc, 'A', 'l’aire du fond', { opcional: true });
    const pm = rho * g * h, pa = p0 + pm;
    const pasos = [
      { t: 'Pression due au liquide', html: `La pression hydrostatique ne dépend que de la profondeur, pas de la forme du récipient : $p_{man} = ρ g h = ${f(rho)} · ${f(g)} · ${f(h)}$ = <b>${f(pm)} Pa</b>. C’est celle qu’indique un manomètre (pression manométrique).` },
      { t: 'Pression absolue', html: `${p0dato === null ? 'Au-dessus de la surface se trouve l’atmosphère, $p_0 = 101325$ Pa : ' : ''}$p = p_0 + ρ g h = ${f(p0)} + ${f(pm)}$ = <b>${f(pa)} Pa</b> = ${f(pa / ATM)} atm` },
    ];
    let F = null;
    if (A) {
      F = pm * A;
      pasos.push({ t: 'Force du liquide sur le fond', html: `$F = p_{man} A = ${f(pm)} · ${f(A)}$ = <b>${f(F)} N</b><br>L’atmosphère pousse aussi à l’extérieur du récipient, donc sa part s’annule ; avec elle, on aurait $p A = ${f(pa * A)}$ N.` });
    }
    pasos.push({ t: 'De combien elle augmente avec la profondeur', html: `Dans ce liquide, la pression augmente de 1 atm tous les $h = p_{atm}/(ρ g) = 101325/(${f(rho)} · ${f(g)})$ = ${f(ATM / (rho * g))} m.` });
    return { modo: 'presion', rho, h, g, p0, pm, pa, A, F, pasos };
  }

  function tuboU(sc) {
    const rho1 = lee(sc, 'rho1', 'la masse volumique du liquide du fond'), h2 = lee(sc, 'h2', 'la hauteur de la colonne ajoutée');
    let rho2, h1;
    const pasos = [{ t: 'Même niveau, même pression', html: 'À la surface de séparation des deux liquides et à la même hauteur dans l’autre branche, il y a le même liquide au repos et connecté, donc la pression est égale. Au-dessus, chaque branche a sa colonne et, en haut, l’atmosphère : $p_0 + ρ_2 g h_2 = p_0 + ρ_1 g h_1$, c’est-à-dire $ρ_2 h_2 = ρ_1 h_1$.' }];
    if (sc.buscar === 'densidad') {
      h1 = lee(sc, 'h1', 'la hauteur de l’autre côté');
      if (h1 >= h2) throw new Error('La colonne du liquide ajouté doit être plus haute que celle de l’autre côté (c’est le moins dense)');
      rho2 = (rho1 * h1) / h2;
      pasos.push({ t: 'Masse volumique du liquide ajouté', html: `$ρ_2 = {ρ_1 h_1}/{h_2} = {${f(rho1)} · ${f(h1)}}/{${f(h2)}}$ = <b>${f(rho2)} kg/m³</b>` });
    } else {
      rho2 = lee(sc, 'rho2', 'la masse volumique du liquide ajouté');
      if (rho2 >= rho1) throw new Error('Le liquide ajouté doit être moins dense que celui du fond : sinon, il descend jusqu’au coude du tube et pousse l’autre');
      h1 = (rho2 * h2) / rho1;
      pasos.push({ t: 'Hauteur de l’autre côté', html: `Au-dessus de la surface de séparation, le liquide du fond monte dans l’autre branche de $h_1 = {ρ_2 h_2}/{ρ_1} = {${f(rho2)} · ${f(h2)}}/{${f(rho1)}}$ = <b>${f(h1)} m</b>` });
    }
    const dh = h2 - h1;
    pasos.push({ t: 'Dénivelé entre les deux surfaces', html: `$Δh = h_2 − h_1 = ${f(h2)} − ${f(h1)}$ = <b>${f(dh)} m</b> (${f(dh * 100)} cm), plus haute du côté du liquide le moins dense.` });
    return { modo: 'tuboU', buscar: sc.buscar === 'densidad' ? 'densidad' : 'altura', rho1, rho2, h1, h2, dh, pasos };
  }

  function prensa(sc) {
    const d1 = lee(sc, 'd1', 'le diamètre du petit piston'), d2 = lee(sc, 'd2', 'le diamètre du grand piston'), g = gDe(sc);
    if (d2 <= d1) throw new Error('Le grand piston doit avoir un diamètre plus grand que le petit');
    const A1 = circulo(d1), A2 = circulo(d2), k = A2 / A1;
    const pasos = [{ t: 'Aires des pistons', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let F1, F2, m = null;
    if (sc.datos === 'masa') {
      m = lee(sc, 'm', 'la masse à soulever'); F2 = m * g; F1 = F2 / k;
      pasos.push({ t: 'Poids à soulever', html: `$F_2 = m g = ${f(m)} · ${f(g)}$ = ${f(F2)} N` });
      pasos.push({ t: 'Principe de Pascal', html: `La pression se transmet également à tout le liquide : $F_1/A_1 = F_2/A_2$, donc $F_1 = {F_2 A_1}/{A_2} = F_2 (d_1/d_2)^2 = ${f(F2)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(F1)} N</b>` });
    } else {
      F1 = lee(sc, 'F1', 'la force sur le petit piston'); F2 = F1 * k;
      pasos.push({ t: 'Principe de Pascal', html: `La pression se transmet également à tout le liquide : $F_1/A_1 = F_2/A_2$, donc $F_2 = {F_1 A_2}/{A_1} = F_1 (d_2/d_1)^2 = ${f(F1)} · (${f(d2)}/${f(d1)})^2$ = <b>${f(F2)} N</b>${g ? `, le poids d’une masse de ${f(F2 / g)} kg` : ''}` });
    }
    const pr = F1 / A1;
    pasos.push({ t: 'Pression dans le liquide', html: `$p = F_1/A_1 = ${f(F1)}/${f(A1)}$ = <b>${f(pr)} Pa</b> (${f(pr / ATM)} atm au-dessus de l’atmosphérique). La force est multipliée par $A_2/A_1 = ${f(k)}$.` });
    const x1 = lee(sc, 'x1', 'la course du petit piston', { opcional: true });
    let x2 = null;
    if (x1) {
      x2 = x1 / k;
      pasos.push({ t: 'Courses', html: `Le volume de liquide qui sort d’un côté entre de l’autre : $A_1 x_1 = A_2 x_2$, donc $x_2 = {x_1 A_1}/{A_2} = ${f(x1)}/${f(k)}$ = <b>${f(x2)} cm</b><br>Ce que l’on gagne en force, on le perd en course : le travail est le même, $F_1 x_1 = F_2 x_2 = ${f((F1 * x1) / 100)}$ J.` });
    }
    return { modo: 'prensa', datos: sc.datos === 'masa' ? 'masa' : 'fuerza', d1, d2, A1, A2, k, F1, F2, m, pr, x1, x2, g, pasos };
  }

  function empuje(sc) {
    const rhoF = lee(sc, 'rhoF', 'la masse volumique du fluide'), g = gDe(sc);
    const pasos = [];
    if (sc.datos === 'pesadas') {
      const P = lee(sc, 'P', 'le poids dans l’air'), Pa = lee(sc, 'Pa', 'le poids dans le fluide', { cero: true });
      if (Pa >= P) throw new Error('Dans le fluide, le corps doit peser moins que dans l’air');
      const E = P - Pa, V = E / (rhoF * g), m = P / g, rhoC = m / V;
      pasos.push({ t: 'Poussée', html: `Ce qu’il perd en poids quand on l’immerge, c’est la poussée : $E = P − P_{ap} = ${f(P)} − ${f(Pa)}$ = <b>${f(E)} N</b>` });
      pasos.push({ t: 'Volume du corps', html: `Totalement immergé, $E = ρ_f V g$, donc $V = E/(ρ_f g) = ${f(E)}/(${f(rhoF)} · ${f(g)})$ = <b>${f(V)} m³</b> (${f(V * 1e6)} cm³)` });
      pasos.push({ t: 'Masse volumique du corps', html: `$m = P/g = ${f(m)}$ kg et $ρ = m/V = {ρ_f P}/{E} = {${f(rhoF)} · ${f(P)}}/{${f(E)}}$ = <b>${f(rhoC)} kg/m³</b>` });
      const cerca = MATERIALES.reduce((a, b) => (Math.abs(Math.log(b[1] / rhoC)) < Math.abs(Math.log(a[1] / rhoC)) ? b : a));
      pasos.push({ t: 'De quoi peut-il être fait ?', html: `En comparant avec quelques masses volumiques (or 19 300, plomb 11 340, argent 10 490, cuivre 8960, fer 7870, aluminium 2700 kg/m³), la plus proche est ${cerca[0]}${Math.abs(rhoC / cerca[1] - 1) > 0.03 ? ', mais elle ne coïncide pas : ce sera un alliage ou il aura des cavités' : ''}.` });
      return { modo: 'empuje', datos: 'pesadas', rhoF, g, P, Pa, E, V, m, rhoC, flota: false, pasos };
    }
    const rhoC = lee(sc, 'rhoC', 'la masse volumique du corps'), V = lee(sc, 'V', 'le volume du corps');
    const m = rhoC * V, P = m * g, Emax = rhoF * V * g;
    pasos.push({ t: 'Poids', html: `$P = m g = ρ V g = ${f(rhoC)} · ${f(V)} · ${f(g)}$ = <b>${f(P)} N</b>` });
    pasos.push({ t: 'Poussée avec le corps entièrement immergé', html: `$E = ρ_f V g = ${f(rhoF)} · ${f(V)} · ${f(g)}$ = <b>${f(Emax)} N</b>` });
    let flota, E, Vs = null, Pa = null, a = null;
    if (rhoC < rhoF) {
      flota = true; E = P; Vs = (rhoC * V) / rhoF;
      pasos.push({ t: 'Il flotte', html: `Comme $E > P$ (le corps est moins dense que le fluide), il monte jusqu’à ce que la partie immergée donne une poussée égale au poids : $ρ_f V_s g = ρ V g$, $V_s = {ρ V}/{ρ_f} = {${f(rhoC)} · ${f(V)}}/{${f(rhoF)}}$ = <b>${f(Vs)} m³</b><br>Immergé à ${f((100 * rhoC) / rhoF)} % et hors du fluide à ${f(100 - (100 * rhoC) / rhoF)} %.` });
      pasos.push({ t: 'Pour l’enfoncer complètement', html: `Il faut le pousser vers le bas avec $F = E − P = ${f(Emax)} − ${f(P)}$ = ${f(Emax - P)} N` });
    } else if (rhoC === rhoF) {
      flota = null; E = Emax; Pa = 0;
      pasos.push({ t: 'Il ne monte ni ne descend', html: 'Le corps a la même masse volumique que le fluide : $E = P$ partout et il reste là où on le laisse (équilibre indifférent).' });
    } else {
      flota = false; E = Emax; Pa = P - Emax; a = Pa / m;
      pasos.push({ t: 'Il coule', html: `Comme $P > E$, il va au fond. Son poids apparent est $P_{ap} = P − E = ${f(P)} − ${f(Emax)}$ = <b>${f(Pa)} N</b>` });
      pasos.push({ t: 'Accélération au lâcher', html: `Sans frottement avec le fluide, $a = (P − E)/m = g (1 − ρ_f/ρ) = ${f(Pa)}/${f(m)}$ = <b>${f(a)} m/s²</b>` });
    }
    return { modo: 'empuje', datos: 'cuerpo', rhoC, V, rhoF, g, m, P, Emax, E, flota, Vs, Pa, a, pasos };
  }

  function bernoulli(sc) {
    const rho = lee(sc, 'rho', 'la masse volumique du fluide'), d1 = lee(sc, 'd1', 'le diamètre en 1'), d2 = lee(sc, 'd2', 'le diamètre en 2'), g = gDe(sc);
    const p1 = lee(sc, 'p1', 'la pression en 1', { signo: true });
    const h1 = lee(sc, 'h1', 'la hauteur de 1', { opcional: true, signo: true }) ?? 0, h2 = lee(sc, 'h2', 'la hauteur de 2', { opcional: true, signo: true }) ?? 0;
    const A1 = circulo(d1), A2 = circulo(d2);
    const pasos = [{ t: 'Sections', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let v1, Q;
    if (sc.datos === 'Q') {
      const QL = lee(sc, 'Q', 'le débit'); Q = QL / 1000; v1 = Q / A1;
      pasos.push({ t: 'Vitesse en 1', html: `$Q = ${f(QL)}$ L/s = ${f(Q)} m³/s, y $v_1 = Q/A_1 = ${f(Q)}/${f(A1)}$ = <b>${f(v1)} m/s</b>` });
    } else {
      v1 = lee(sc, 'v1', 'la vitesse en 1'); Q = A1 * v1;
      pasos.push({ t: 'Débit', html: `$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s (${f(rho * Q)} kg/s)` });
    }
    const v2 = (v1 * A1) / A2;
    pasos.push({ t: 'Continuité', html: `Le débit est le même dans toute la conduite : $A_1 v_1 = A_2 v_2$, $v_2 = v_1 (d_1/d_2)^2 = ${f(v1)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(v2)} m/s</b>` });
    const p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
    const alt = h1 || h2;
    pasos.push({ t: 'Bernoulli', html: `$p_1 + {1}/{2} ρ v_1^2 ${alt ? '+ ρ g h_1 ' : ''}= p_2 + {1}/{2} ρ v_2^2${alt ? ' + ρ g h_2' : ''}$, donc<br>$p_2 = p_1 + {1}/{2} ρ (v_1^2 − v_2^2)${alt ? ' + ρ g (h_1 − h_2)' : ''} = ${f(p1)} + {1}/{2} · ${f(rho)} · (${f(v1)}^2 − ${f(v2)}^2)${alt ? `$ $+ ${f(rho)} · ${f(g)} · (${f(h1)} − ${p(h2)})` : ''}$ = <b>${f(p2)} Pa</b>${p2 < 0 ? '<br>Le résultat est négatif : si $p_1$ était une pression manométrique, en 2 la pression est inférieure à l’atmosphérique ; si elle était absolue, c’est impossible et le liquide bouillirait (cavitation).' : ''}` });
    pasos.push({ t: 'Différence de pression', html: `$Δp = p_1 − p_2 = ${f(p1 - p2)}$ Pa${alt ? '' : `. Là où le tuyau se rétrécit, le fluide va plus vite et la pression baisse : c’est l’effet Venturi. Avec deux tubes verticaux ouverts, le liquide monterait de ${f(Math.abs(p1 - p2) / (rho * g))} m de plus du côté ${p1 > p2 ? '1' : '2'}.`}` });
    return { modo: 'bernoulli', datos: sc.datos === 'Q' ? 'Q' : 'v1', rho, d1, d2, A1, A2, v1, v2, Q, p1, p2, h1, h2, g, pasos };
  }

  function torricelli(sc) {
    const H = lee(sc, 'H', 'la hauteur du liquide au-dessus de l’orifice'), g = gDe(sc);
    const y = lee(sc, 'y', 'la hauteur de l’orifice', { opcional: true, cero: true });
    const d = lee(sc, 'd', 'le diamètre de l’orifice', { opcional: true }), D = lee(sc, 'D', 'le diamètre du réservoir', { opcional: true });
    if (D && !d) throw new Error('Pour le temps de vidange, il faut aussi le diamètre de l’orifice');
    if (D && d && D <= d / 100) throw new Error('Le réservoir doit être plus large que l’orifice');
    const v = Math.sqrt(2 * g * H);
    const pasos = [{ t: 'Vitesse de sortie', html: `Bernoulli entre la surface (presque immobile, à la pression atmosphérique) et l’orifice (également à l’air libre) : $v = √(2 g H) = √(2 · ${f(g)} · ${f(H)})$ = <b>${f(v)} m/s</b>, la même que si le liquide tombait librement depuis la surface.` }];
    let x = null, tc = null, Q = null, A = null, tv = null;
    if (y) {
      tc = Math.sqrt((2 * y) / g); x = v * tc;
      pasos.push({ t: 'Portée du jet', html: `Il sort à l’horizontale et tombe comme un tir horizontal : il met $t = √(2 y/g) = √(2 · ${f(y)}/${f(g)})$ = ${f(tc)} s, et atteint $x = v t = 2 √(H y) = ${f(v)} · ${f(tc)}$ = <b>${f(x)} m</b><br>Avec la même hauteur totale, ${f(H + y)} m, la portée serait maximale avec l’orifice à mi-hauteur : ${f(H + y)} m.` });
    } else if (y === 0) {
      x = 0;
    }
    if (d) {
      A = circulo(d); Q = A * v;
      pasos.push({ t: 'Débit de sortie', html: `${areaPaso('o', A, d)}, $Q = A_o v = ${f(A)} · ${f(v)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
    }
    if (D) {
      const AD = (Math.PI * D * D) / 4;
      tv = (AD / A) * Math.sqrt((2 * H) / g);
      pasos.push({ t: 'Temps jusqu’à la vidange', html: `Quand le niveau baisse, la vitesse diminue. Avec $A_D v_{nivel} = A_o √(2 g z)$ et en intégrant de H à 0 : $t = (A_D/A_o) √(2 H/g) = (D/d)^2 √(2 H/g) = ${f(AD / A)} · ${f(Math.sqrt((2 * H) / g))}$ = <b>${f(tv)} s</b> (${f(tv / 60)} min), le double de ce qu’il faudrait s’il sortait toujours avec le débit initial.` });
    }
    return { modo: 'torricelli', H, y, d, D, g, v, x, tc, A, Q, tv, pasos };
  }

  function viscosidad(sc) {
    const pasos = [], g = gDe(sc);
    if (sc.tipo === 'stokes') {
      const r = lee(sc, 'r', 'le rayon de la sphère') / 1000, rhoE = lee(sc, 'rhoE', 'la masse volumique de la sphère'), rhoF = lee(sc, 'rhoF', 'la masse volumique du fluide');
      if (rhoE <= rhoF) throw new Error('La sphère doit être plus dense que le fluide pour tomber');
      let eta, v;
      pasos.push({ t: 'Forces sur la sphère', html: `Elle tombe sous son poids $ρ_e V g$, la poussée la freine avec $ρ_f V g$ et le frottement visqueux de Stokes, $F_v = 6 π η r v$, augmente avec la vitesse. Elle atteint la vitesse limite quand ils s’équilibrent : $6 π η r v = (ρ_e − ρ_f) {4}/{3} π r^3 g$.` });
      if (sc.datos === 'v') {
        v = lee(sc, 'v', 'la vitesse limite mesurée'); eta = (2 * r * r * (rhoE - rhoF) * g) / (9 * v);
        pasos.push({ t: 'Viscosité (viscosimètre à bille)', html: `$η = {2 r^2 (ρ_e − ρ_f) g}/{9 v} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(v)}}$ = <b>${f(eta)} Pa·s</b>` });
      } else {
        eta = lee(sc, 'eta', 'la viscosité'); v = (2 * r * r * (rhoE - rhoF) * g) / (9 * eta);
        pasos.push({ t: 'Vitesse limite', html: `$v_{lím} = {2 r^2 (ρ_e − ρ_f) g}/{9 η} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(eta)}}$ = <b>${f(v)} m/s</b>` });
      }
      const Re = (rhoF * v * 2 * r) / eta, tau = (2 * rhoE * r * r) / (9 * eta);
      pasos.push({ t: 'La loi de Stokes est-elle valable ?', html: `Nombre de Reynolds $Re = ρ_f v (2r)/η = ${f(Re)}$ : ${Re < 1 ? 'très inférieur à 1, l’écoulement autour de la sphère est laminaire et la loi est valable.' : 'il n’est pas petit devant 1, donc le résultat n’est qu’approximatif (un sillage apparaît et la force croît plus vite).'} Elle atteint presque la vitesse limite en quelques $τ = {2 ρ_e r^2}/{9 η} = ${f(tau)}$ s.` });
      return { modo: 'viscosidad', tipo: 'stokes', datos: sc.datos === 'v' ? 'v' : 'eta', r, rhoE, rhoF, eta, v, Re, tau, g, pasos };
    }
    const eta = lee(sc, 'eta', 'la viscosité'), L = lee(sc, 'L', 'la longueur du tube'), d = lee(sc, 'd', 'le diamètre intérieur') / 1000, r = d / 2;
    const Rh = (8 * eta * L) / (Math.PI * r ** 4);
    pasos.push({ t: 'Loi de Poiseuille', html: `Dans un tube de rayon r et de longueur L, un fluide visqueux en régime laminaire a un profil de vitesses parabolique et le débit est $Q = {π r^4 Δp}/{8 η L}$. La résistance du tube est $R = {8 η L}/{π r^4} = {8 · ${f(eta)} · ${f(L)}}/{π · (${f(r)})^4}$ = ${f(Rh)} Pa·s/m³ : en divisant le rayon par deux, le débit est divisé par 16.` });
    let Q, dp;
    if (sc.datos === 'Q') {
      Q = lee(sc, 'Q', 'le débit') / 1e6; dp = Q * Rh;
      pasos.push({ t: 'Différence de pression nécessaire', html: `$Δp = Q R = ${f(Q)} · ${f(Rh)}$ = <b>${f(dp)} Pa</b> (${f(dp / 133.32)} mmHg)` });
    } else {
      dp = lee(sc, 'dp', 'la différence de pression'); Q = dp / Rh;
      pasos.push({ t: 'Débit', html: `$Q = Δp/R = ${f(dp)}/${f(Rh)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1e6)} mL/s` });
    }
    const A = Math.PI * r * r, vm = Q / A, vmax = 2 * vm, rho = lee(sc, 'rho', 'la masse volumique du fluide', { opcional: true }) ?? 1000, Re = (rho * vm * d) / eta;
    pasos.push({ t: 'Vitesses', html: `Vitesse moyenne $v̄ = Q/(π r^2) = ${f(vm)}$ m/s ; au centre, elle est double, $v_{máx} = 2 v̄ = ${f(vmax)}$ m/s, et contre la paroi, elle est nulle.` });
    pasos.push({ t: 'L’écoulement est-il laminaire ?', html: `$Re = ρ v̄ d/η = {${f(rho)} · ${f(vm)} · ${f(d)}}/${'{'}${f(eta)}}$ = ${f(Re)} : ${Re < 2000 ? 'inférieur à environ 2000, régime laminaire et la loi de Poiseuille est valable.' : Re < 4000 ? 'entre 2000 et 4000, zone de transition : la loi de Poiseuille cesse d’être fiable.' : 'supérieur à 4000, l’écoulement est turbulent et la loi de Poiseuille n’est pas valable.'}` });
    return { modo: 'viscosidad', tipo: 'poiseuille', datos: sc.datos === 'Q' ? 'Q' : 'dp', eta, L, d, r, Rh, Q, dp, vm, vmax, rho, Re, pasos };
  }

  function medidor(sc) {
    const rhoF = lee(sc, 'rhoF', 'la masse volumique du fluide'), dh = lee(sc, 'dh', 'la dénivellation du manomètre') / 100, g = gDe(sc), pasos = [];
    const rhoM = lee(sc, 'rhoM', 'la masse volumique du liquide du manomètre', { opcional: true });
    if (rhoM !== null && rhoM <= rhoF) throw new Error('Le liquide du manomètre doit être plus dense que le fluide mesuré');
    const dp = rhoM === null ? rhoF * g * dh : (rhoM - rhoF) * g * dh;
    pasos.push({ t: 'Différence de pression', html: rhoM === null ? `Avec deux tubes verticaux ouverts, le liquide monte jusqu’à ce que son poids équilibre la pression : $Δp = ρ g Δh = ${f(rhoF)} · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` : `Dans le manomètre en U, à la hauteur de la surface la plus basse, la pression est égale dans les deux branches : $Δp = (ρ_m − ρ) g Δh = (${f(rhoM)} − ${f(rhoF)}) · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` });
    if (sc.tipo === 'venturi') {
      const d1 = lee(sc, 'd1', 'le diamètre de la conduite'), d2 = lee(sc, 'd2', 'le diamètre de l’étranglement');
      if (d2 >= d1) throw new Error('L’étranglement doit être plus étroit que la conduite');
      const A1 = circulo(d1), A2 = circulo(d2), k = (A1 / A2) ** 2 - 1, v1 = Math.sqrt((2 * dp) / (rhoF * k)), v2 = (v1 * A1) / A2, Q = A1 * v1;
      pasos.push({ t: 'Continuité et Bernoulli', html: `$v_2 = v_1 A_1/A_2$ et $p_1 − p_2 = {1}/{2} ρ (v_2^2 − v_1^2) = {1}/{2} ρ v_1^2 ((A_1/A_2)^2 − 1)$, avec $(A_1/A_2)^2 = (d_1/d_2)^4 = ${f(k + 1)}$` });
      pasos.push({ t: 'Vitesse et débit', html: `$v_1 = √({2 Δp}/{ρ ((A_1/A_2)^2 − 1)}) = √({2 · ${f(dp)}}/{${f(rhoF)} · ${f(k)}})$ = <b>${f(v1)} m/s</b>, $v_2$ = ${f(v2)} m/s<br>$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
      return { modo: 'medidor', tipo: 'venturi', rhoF, rhoM, dh, dp, d1, d2, A1, A2, v1, v2, Q, g, pasos };
    }
    const v = Math.sqrt((2 * dp) / rhoF);
    pasos.unshift({ t: 'Comment ça marche', html: 'Le tube a une ouverture face au courant, où le fluide s’immobilise, et une prise sur le côté, devant laquelle il passe à sa vitesse. Bernoulli entre les deux, à la même hauteur : $p_{total} = p + {1}/{2} ρ v^2$, donc le manomètre qui les relie mesure la pression dynamique ${1}/{2} ρ v^2$.' });
    pasos.push({ t: 'Vitesse du fluide', html: `À l’ouverture du tube de Pitot, le fluide s’arrête (pression d’arrêt) et à la prise latérale il passe à sa vitesse : $Δp = {1}/{2} ρ v^2$, donc $v = √({2 Δp}/{ρ}) = √({2 · ${f(dp)}}/{${f(rhoF)}})$ = <b>${f(v)} m/s</b> (${f(v * 3.6)} km/h). C’est ainsi que les avions mesurent leur vitesse par rapport à l’air.` });
    return { modo: 'medidor', tipo: 'pitot', rhoF, rhoM, dh, dp, v, g, pasos };
  }

  function pared(sc) {
    const rho = lee(sc, 'rho', 'la masse volumique du liquide'), b = lee(sc, 'b', 'la largeur'), hc = lee(sc, 'hc', 'la hauteur mouillée'), g = gDe(sc);
    const h0 = lee(sc, 'h0', 'la profondeur du bord supérieur', { opcional: true, cero: true }) ?? 0;
    const hg = h0 + hc / 2, A = b * hc, F = rho * g * hg * A, yc = hg + (hc * hc) / (12 * hg), M = F * (h0 + hc - yc);
    const pasos = [{ t: 'Pression sur la paroi', html: `La pression du liquide augmente avec la profondeur, $p = ρ g y$, donc elle pousse plus en bas qu’en haut. ${h0 ? `La vanne va de $y = ${f(h0)}$ m à $y = ${f(h0 + hc)}$ m.` : `La paroi est mouillée jusqu’à $H = ${f(hc)}$ m.`}` }];
    pasos.push({ t: 'Force résultante', html: `C’est la pression au centre de la surface multipliée par son aire : $F = ρ g h_G A = ${f(rho)} · ${f(g)} · ${f(hg)} · (${f(b)} · ${f(hc)})$ = <b>${f(F)} N</b>${h0 ? '' : `, c’est-à-dire $F = {1}/{2} ρ g b H^2$`}` });
    pasos.push({ t: 'Centre de poussée', html: `Comme elle pousse plus en bas, la force ne s’applique pas au centre mais plus bas : $y_P = h_G + {I_G}/{h_G A} = h_G + {h_c^2}/{12 h_G} = ${f(hg)} + {${f(hc)}^2}/{12 · ${f(hg)}}$ = <b>${f(yc)} m</b> de profondeur${h0 ? '' : ', aux deux tiers de la hauteur (à H/3 du fond)'}.` });
    pasos.push({ t: 'Moment par rapport au bord inférieur', html: `$M = F (h_0 + h_c − y_P) = ${f(F)} · ${f(h0 + hc - yc)}$ = <b>${f(M)} N·m</b> : c’est ce que doivent supporter le barrage ou les charnières du bas pour qu’il ne bascule pas.` });
    return { modo: 'pared', rho, b, hc, h0, hg, A, F, yc, M, g, pasos };
  }

  function capilar(sc) {
    const ga = lee(sc, 'gamma', 'la tension superficielle'), r = lee(sc, 'r', 'le rayon du tube') / 1000, rho = lee(sc, 'rho', 'la masse volumique du liquide'), g = gDe(sc);
    const th = lee(sc, 'theta', 'l’angle de contact', { opcional: true, cero: true }) ?? 0;
    if (th > 180) throw new Error('L’angle de contact va de 0° à 180°');
    const c = Math.abs(th - 90) < 1e-9 ? 0 : Math.cos((th * Math.PI) / 180), h = (2 * ga * c) / (rho * g * r), dp = (2 * ga * c) / r;
    const pasos = [{ t: 'Pourquoi il monte (ou descend)', html: `La tension superficielle tire sur le bord du ménisque tout le long du périmètre, $2πr$, avec un angle de contact θ = ${f(th)}° : la force verticale est $2 π r γ cos θ$. ${c > 0 ? 'Le liquide mouille le verre et monte' : c < 0 ? 'Le liquide ne mouille pas (comme le mercure) et descend' : 'Avec θ = 90°, il ne monte ni ne descend'}.` }];
    pasos.push({ t: 'Loi de Jurin', html: `La colonne monte jusqu’à ce que son poids, $ρ π r^2 h g$, égale cette force : $h = {2 γ cos θ}/{ρ g r} = {2 · ${f(ga)} · ${f(c)}}/{${f(rho)} · ${f(g)} · ${f(r)}}$ = <b>${f(h * 1000)} mm</b>${h < 0 ? ' (en dessous du niveau extérieur)' : ''}. Plus le tube est fin, plus elle monte : c’est ainsi que l’eau monte dans le papier et la sève dans les plantes.` });
    pasos.push({ t: 'Pression sous le ménisque', html: `La surface courbe fait que sous le ménisque la pression est $Δp = {2 γ cos θ}/{r} = ${f(dp)}$ Pa ${dp >= 0 ? 'inférieure' : 'supérieure'} à l’atmosphérique (loi de Laplace), exactement ce que compense la colonne : $ρ g h = ${f(rho * g * h)}$ Pa.` });
    return { modo: 'capilar', ga, r, rho, th, c, h, dp, g, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'viscosidad') return viscosidad(sc);
    if (sc.modo === 'medidor') return medidor(sc);
    if (sc.modo === 'pared') return pared(sc);
    if (sc.modo === 'capilar') return capilar(sc);
    if (sc.modo === 'tuboU') return tuboU(sc);
    if (sc.modo === 'prensa') return prensa(sc);
    if (sc.modo === 'empuje') return empuje(sc);
    if (sc.modo === 'bernoulli') return bernoulli(sc);
    if (sc.modo === 'torricelli') return torricelli(sc);
    return presion(sc);
  }

  const ejemplos = [
    { clave: 'buceo', nombre: 'Pression sur un plongeur à 20 m', sc: { modo: 'presion', rho: '1025', h: '20', p0: '', A: '', g: '9,8' } },
    { clave: 'piscina', nombre: 'Force sur le fond d’une piscine', sc: { modo: 'presion', rho: '1000', h: '2', p0: '', A: '50', g: '9,8' } },
    { clave: 'barometro', nombre: 'Baromètre à mercure de Torricelli', sc: { modo: 'presion', rho: '13600', h: '0,76', p0: '0', A: '', g: '9,8' } },
    { clave: 'tubo-aceite', nombre: 'Huile et eau dans un tube en U', sc: { modo: 'tuboU', buscar: 'altura', rho1: '1000', rho2: '800', h2: '0,1' } },
    { clave: 'tubo-densidad', nombre: 'Masse volumique d’un liquide avec un tube en U', sc: { modo: 'tuboU', buscar: 'densidad', rho1: '1000', h1: '0,068', h2: '0,08' } },
    { clave: 'elevador', nombre: 'Élévateur hydraulique d’un garage', sc: { modo: 'prensa', datos: 'masa', m: '1500', d1: '4', d2: '40', x1: '20', g: '9,8' } },
    { clave: 'prensa', nombre: 'Presse hydraulique', sc: { modo: 'prensa', datos: 'fuerza', F1: '200', d1: '2', d2: '30', x1: '', g: '9,8' } },
    { clave: 'madera', nombre: 'Bloc de bois dans l’eau', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '600', V: '0,002', rhoF: '1000', g: '9,8' } },
    { clave: 'iceberg', nombre: 'Partie visible d’un iceberg', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '917', V: '1000', rhoF: '1025', g: '9,8' } },
    { clave: 'hierro', nombre: 'Pièce de fer immergée dans l’eau', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '7870', V: '1e-4', rhoF: '1000', g: '9,8' } },
    { clave: 'corona', nombre: 'La couronne d’Archimède : est-elle en or ?', sc: { modo: 'empuje', datos: 'pesadas', P: '10', Pa: '9,4', rhoF: '1000', g: '9,8' } },
    { clave: 'venturi', nombre: 'Tube de Venturi', sc: { modo: 'bernoulli', datos: 'v1', rho: '1000', d1: '10', d2: '5', v1: '2', p1: '1,5e5', h1: '', h2: '', g: '9,8' } },
    { clave: 'casa', nombre: 'Eau qui monte au deuxième étage', sc: { modo: 'bernoulli', datos: 'Q', rho: '1000', d1: '4', d2: '2', Q: '1,5', p1: '4e5', h1: '0', h2: '6', g: '9,8' } },
    { clave: 'deposito', nombre: 'Jet d’un réservoir avec un trou', sc: { modo: 'torricelli', H: '2', y: '1', d: '2', D: '1', g: '9,8' } },
    { clave: 'sangre', nombre: 'Sang dans une artère (Poiseuille)', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'dp', eta: '4e-3', L: '0,1', d: '4', dp: '400', Q: '', rho: '1060' } },
    { clave: 'jeringa', nombre: 'Pression pour faire passer de l’eau dans une aiguille', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'Q', eta: '1e-3', L: '0,04', d: '0,5', dp: '', Q: '0,5', rho: '1000' } },
    { clave: 'glicerina', nombre: 'Bille d’acier tombant dans la glycérine (Stokes)', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'eta', r: '1', rhoE: '7800', rhoF: '1260', eta: '1,5', v: '', g: '9,8' } },
    { clave: 'viscosimetro', nombre: 'Viscosité d’une huile avec une bille qui tombe', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'v', r: '1,5', rhoE: '7800', rhoF: '900', eta: '', v: '0,12', g: '9,8' } },
    { clave: 'pitot', nombre: 'Vitesse d’un avion avec un tube de Pitot', sc: { modo: 'medidor', tipo: 'pitot', rhoF: '1,2', rhoM: '1000', dh: '25', d1: '', d2: '', g: '9,8' } },
    { clave: 'venturimetro', nombre: 'Débit avec un débitmètre de Venturi et du mercure', sc: { modo: 'medidor', tipo: 'venturi', rhoF: '1000', rhoM: '13600', dh: '4', d1: '10', d2: '5', g: '9,8' } },
    { clave: 'presa', nombre: 'Force de l’eau sur un barrage', sc: { modo: 'pared', rho: '1000', b: '50', hc: '20', h0: '', g: '9,8' } },
    { clave: 'compuerta', nombre: 'Vanne immergée dans un réservoir', sc: { modo: 'pared', rho: '1000', b: '1,5', hc: '2', h0: '3', g: '9,8' } },
    { clave: 'capilar', nombre: 'Eau qui monte dans un tube capillaire', sc: { modo: 'capilar', gamma: '0,073', r: '0,5', rho: '1000', theta: '0', g: '9,8' } },
    { clave: 'mercurio', nombre: 'Mercure qui descend dans un capillaire', sc: { modo: 'capilar', gamma: '0,49', r: '1', rho: '13600', theta: '140', g: '9,8' } },
  ];

  return { resolver, presion, tuboU, prensa, empuje, bernoulli, torricelli, viscosidad, medidor, pared, capilar, ejemplos, f, ATM };
})();

