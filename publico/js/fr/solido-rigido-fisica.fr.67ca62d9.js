const Solido = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, max = Infinity, libre = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Il manque ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} doit être un nombre`);
    if (!libre && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    if (v > max) throw new Error(`${may(nom)} ne peut pas dépasser ${f(max)}`);
    return v;
  }

  const CUERPOS = {
    'esfera': { nombre: 'Sphère pleine', k: 2 / 5, kTxt: '2/5', formula: '2/5 M R^2', med: 'R', medNom: 'Rayon R', rueda: true, eje: 'un diamètre' },
    'esfera-hueca': { nombre: 'Sphère creuse (coque)', k: 2 / 3, kTxt: '2/3', formula: '2/3 M R^2', med: 'R', medNom: 'Rayon R', rueda: true, eje: 'un diamètre' },
    'cilindro': { nombre: 'Cylindre plein ou disque', k: 1 / 2, kTxt: '1/2', formula: '1/2 M R^2', med: 'R', medNom: 'Rayon R', rueda: true, eje: 'son axe' },
    'aro': { nombre: 'Cerceau ou cylindre creux mince', k: 1, kTxt: '1', formula: 'M R^2', med: 'R', medNom: 'Rayon R', rueda: true, eje: 'son axe' },
    'varilla': { nombre: 'Tige mince', k: 1 / 12, kTxt: '1/12', formula: '1/12 M L^2', med: 'L', medNom: 'Longueur L', rueda: false, eje: 'perpendiculaire par le centre' },
    'placa': { nombre: 'Plaque rectangulaire (a × b)', placa: true, formula: '1/12 M(a^2 + b^2)', med: 'a', medNom: 'Côté a', rueda: false, eje: 'perpendiculaire par le centre' },
    'disco-diametro': { nombre: 'Disque (axe par un diamètre)', k: 1 / 4, kTxt: '1/4', formula: '1/4 M R^2', med: 'R', medNom: 'Rayon R', rueda: false, eje: 'un diamètre' },
  };
  const kPor = (C) => (C.kTxt === '1' ? '' : `${C.kTxt} · `);
  function Icm(C, M, L, b) {
    if (C.placa) return { I: (M * (L * L + b * b)) / 12, html: `$I_cm = 1/12 M(a^2 + b^2) = 1/12 · ${f(M)} · (${f(L)}^2 + ${f(b)}^2)$` };
    return { I: C.k * M * L * L, html: `$I_cm = ${C.formula} = ${kPor(C)}${f(M)} · ${f(L)}^2$` };
  }
  const kgm2 = (x) => `<b>${f(x)} kg·m²</b>`;

  function inercia(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.esfera;
    const M = lee(sc, 'M', 'la masse'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'la distance de l’axe au centre de masse', { opcional: true, cero: true }) ?? 0;
    const b = C.placa ? lee(sc, 'b', 'le côté b') : null, ic = Icm(C, M, L, b);
    const pasos = [{ t: `Moment d’inertie par rapport à un axe passant par le centre de masse (${C.eje})`, html: `${ic.html} = ${kgm2(ic.I)}` }];
    const I = ic.I + M * d * d;
    if (d) pasos.push({ t: 'Théorème de Huygens-Steiner (axes parallèles)', html: `$I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}${sc.cuerpo === 'varilla' && Math.abs(d - L / 2) < 1e-12 ? ' (par une extrémité : $1/3 M L^2$)' : ''}` });
    pasos.push({ t: 'Rayon de giration', html: `$k = √(I/M) = √(${f(I)}/${f(M)})$ = <b>${f(Math.sqrt(I / M))} m</b> : c’est la distance à laquelle il faudrait concentrer toute la masse pour avoir le même I.` });
    return { modo: 'inercia', C, M, L, b, d, Icm: ic.I, I, pasos };
  }

  function compuesto(sc) {
    const lineas = String(sc.piezas || '').split(/\n|;/).map((x) => x.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Écris au moins une pièce : « type masse dimension distance »');
    const piezas = lineas.map((l, i) => {
      const [tipo, ...nums] = l.split(/\s+/), v = nums.map(leeNum), quien = `Pièce ${i + 1}`;
      if (v.some((x) => !isFinite(x))) throw new Error(`${quien} : les données doivent être des nombres`);
      if (tipo === 'punto') {
        if (v.length < 2) throw new Error(`${quien} : une masse ponctuelle s’écrit « punto masse distance »`);
        const [M, d] = v; if (M <= 0 || d < 0) throw new Error(`${quien} : la masse doit être positive et la distance ne peut pas être négative`);
        return { nombre: 'Masse ponctuelle', M, d, Icm: 0, html: `$I = M d^2 = ${f(M)} · ${f(d)}^2$`, I: M * d * d };
      }
      const C = CUERPOS[tipo];
      if (!C) throw new Error(`${quien} : « ${tipo} » n’est pas un corps (utilise ${Object.keys(CUERPOS).join(', ')} ou punto)`);
      if (v.length < (C.placa ? 4 : 3)) throw new Error(`${quien} : s’écrit « ${tipo} masse dimension distance${C.placa ? ' b' : ''} »`);
      const [M, L, d, b] = v; if (M <= 0 || L <= 0 || d < 0 || (C.placa && !(b > 0))) throw new Error(`${quien} : masse et dimensions positives, distance non négative`);
      const ic = Icm(C, M, L, b);
      return { nombre: C.nombre, M, d, Icm: ic.I, I: ic.I + M * d * d, html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$` };
    });
    const I = piezas.reduce((s, p) => s + p.I, 0), M = piezas.reduce((s, p) => s + p.M, 0);
    const pasos = piezas.map((p, i) => ({ t: `${i + 1}. ${p.nombre} (${f(p.M)} kg à ${f(p.d)} m de l’axe)`, html: `${p.html} = ${kgm2(p.I)}` }));
    pasos.push({ t: 'Somme : le moment d’inertie est additif', html: `$I = ${piezas.map((p) => f(p.I)).join(' + ')}$ = ${kgm2(I)}, avec une masse totale de ${f(M)} kg et un rayon de giration $k = √(I/M)$ = ${f(Math.sqrt(I / M))} m.` });
    return { modo: 'compuesto', piezas, I, M, pasos };
  }

  function rodadura(sc) {
    const C = CUERPOS[sc.cuerpo];
    if (!C || !C.rueda) throw new Error('Pour rouler, choisis une sphère, un cylindre ou un cerceau');
    const g = lee(sc, 'g', 'la gravité'), M = lee(sc, 'M', 'la masse'), R = lee(sc, 'L', 'le rayon'), th = lee(sc, 'theta', 'l’angle du plan', { max: 89.9 }), d = lee(sc, 'd', 'la distance parcourue');
    const mu = lee(sc, 'mu', 'le coefficient de frottement statique', { opcional: true, cero: true });
    const t = th * RAD, k = C.k, a = (g * Math.sin(t)) / (1 + k), Fr = k * M * a, h = d * Math.sin(t), v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const muMin = (Math.tan(t) * k) / (1 + k), N = M * g * Math.cos(t);
    const Krot = 0.5 * k * M * v * v, Ktras = 0.5 * M * v * v;
    const pasos = [
      { t: 'Moment d’inertie', html: `${C.nombre} : $I = ${C.formula}$ = ${kgm2(k * M * R * R)}, c’est-à-dire $I/(M R^2) = ${C.kTxt}$` },
      { t: 'Équations du mouvement (roue sans glisser : a = αR)', html: `Translation : $M g sin θ − F_f = M a$<br>Rotation par rapport au centre : $F_f R = I α = I a/R ⇒ F_f = I a/R^2$<br>En additionnant : $M g sin θ = (M + I/R^2) a ⇒ a = {g sin θ}/(1 + I/(M R^2)) = {${f(g)} · sin ${f(th)}°}/(1 + ${C.kTxt})$ = <b>${f(a)} m/s²</b>` },
      { t: 'Frottement nécessaire', html: `$F_f = I a/R^2 = ${kPor(C)}${f(M)} · ${f(a)}$ = <b>${f(Fr)} N</b> (statique : il ne travaille pas, le point de contact ne bouge pas)<br>Pour qu’il roule sans glisser, il faut $μ_s ≥ F_f/N = tan θ · {I/(M R^2)}/{1 + I/(M R^2)}$ = <b>${f(muMin)}</b>${mu !== null ? `; avec $μ_s = ${f(mu)}$ ${mu >= muMin ? '<b>il roule bien sans glisser</b>' : '<b>ce n\u2019est pas suffisant : il glisse et tourne en même temps</b> (ce qui précède vaudrait s\u2019il roulait ; ci-dessous, ce qui se passe réellement)'}` : ''}` },
      { t: `Par l’énergie, après un parcours de ${f(d)} m (il descend de h = d sin θ = ${f(h)} m)`, html: `$M g h = 1/2 M v^2 + 1/2 I ω^2 = 1/2 (M + I/R^2) v^2 ⇒ v = √({2 g h}/{1 + I/(M R^2)})$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s<br>$t = √(2d/a)$ = <b>${f(tt)} s</b>` },
      { t: 'Répartition de l’énergie cinétique', html: `Translation $1/2 M v^2$ = ${f(Ktras)} J ; rotation $1/2 I ω^2$ = ${f(Krot)} J (${f((100 * k) / (1 + k), 3)} % du total). Plus $I/(M R^2)$ est grand, plus l’énergie part dans la rotation et plus la descente est lente : la sphère pleine l’emporte sur la sphère creuse, le cylindre et le cerceau, quelles que soient leur masse et leur rayon.` },
    ];
    let desliza = null;
    if (mu !== null && mu < muMin) {
      const a2 = g * (Math.sin(t) - mu * Math.cos(t)), I = k * M * R * R, al2 = (mu * N * R) / I, t2 = Math.sqrt((2 * d) / a2), v2 = a2 * t2, w2 = al2 * t2;
      const Q = M * g * h - 0.5 * M * v2 * v2 - 0.5 * I * w2 * w2;
      desliza = { a: a2, al: al2, t: t2, v: v2, w: w2, Q };
      pasos.push({ t: 'Comme le frottement ne suffit pas, il glisse tout en tournant', html: `Frottement dynamique (on prend $μ_d = μ_s$) : $F_f = μ N = ${f(mu)} · ${f(N)}$ = ${f(mu * N)} N<br>Translation : $a = g(sin θ − μ cos θ)$ = <b>${f(a2)} m/s²</b> ; rotation : $α = F_f R/I$ = <b>${f(al2)} rad/s²</b>, et $α R = ${f(al2 * R)} "m/s²" < a$<br>Au bas du plan : t = ${f(t2)} s, v = <b>${f(v2)} m/s</b>, ω = ${f(w2)} rad/s (moins que v/R = ${f(v2 / R)} rad/s) ; ${f(Q)} J sont perdus sous forme de chaleur à cause du frottement.` });
    }
    const carrera = Object.entries(CUERPOS).filter(([, c]) => c.rueda).map(([kk, c]) => ({ k: kk, nombre: c.nombre, a: (g * Math.sin(t)) / (1 + c.k), v: Math.sqrt((2 * g * h) / (1 + c.k)), t: Math.sqrt((2 * d * (1 + c.k)) / (g * Math.sin(t))) }));
    const A = desliza ? desliza.a : a, Al = desliza ? desliza.al : a / R, T = desliza ? desliza.t : tt;
    const mov = (x) => { const u = Math.min(Math.max(x, 0), T); return { s: 0.5 * A * u * u, phi: 0.5 * Al * u * u, v: A * u }; };
    return { modo: 'rodadura', C, g, M, R, th, d, mu, a, Fr, N, v, w: v / R, t: tt, h, muMin, rueda: mu === null || mu >= muMin, desliza, Krot, Ktras, carrera, pasos, mov, T };
  }

  function polea(sc) {
    const C = CUERPOS[sc.cuerpo] && CUERPOS[sc.cuerpo].rueda ? CUERPOS[sc.cuerpo] : CUERPOS.cilindro;
    const g = lee(sc, 'g', 'la gravité'), M = lee(sc, 'M', 'la masse de la poulie'), R = lee(sc, 'L', 'le rayon de la poulie'), m = lee(sc, 'm', 'la masse suspendue'), d = lee(sc, 'd', 'la hauteur de chute');
    const I = C.k * M * R * R, a = (m * g) / (m + I / (R * R)), T = m * (g - a), al = a / R, v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const pasos = [
      { t: 'Moment d’inertie de la poulie', html: `${C.nombre}: $I = ${C.formula} = ${kPor(C)}${f(M)} · ${f(R)}^2$ = ${kgm2(I)}` },
      { t: 'Équations (la corde ne glisse pas : a = αR)', html: `Corps suspendu : $m g − T = m a$<br>Poulie : $T R = I α = I a/R ⇒ T = I a/R^2$<br>En additionnant : $m g = (m + I/R^2) a ⇒ a = {${f(m)} · ${f(g)}}/{${f(m)} + ${f(I / (R * R))}}$ = <b>${f(a)} m/s²</b>` },
      { t: 'Tension et accélération angulaire', html: `$T = m(g − a) = ${f(m)} · (${f(g)} − ${f(a)})$ = <b>${f(T)} N</b> (inférieure au poids, ${f(m * g)} N)<br>$α = a/R$ = <b>${f(al)} rad/s²</b>` },
      { t: `Après une descente de ${f(d)} m`, html: `$v = √(2 a d)$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s, $t = √(2d/a)$ = ${f(tt)} s<br>Énergie : $m g h$ = ${f(m * g * d)} J = $1/2 m v^2 + 1/2 I ω^2$ = ${f(0.5 * m * v * v)} + ${f(0.5 * I * (v / R) ** 2)} J` },
    ];
    const mov = (x) => { const u = Math.min(Math.max(x, 0), tt); return { y: 0.5 * a * u * u, phi: (0.5 * a * u * u) / R, v: a * u }; };
    return { modo: 'polea', C, g, M, R, m, d, I, a, T, al, v, w: v / R, t: tt, pasos, mov, T_: tt };
  }

  const aRad = (w, rpm) => (rpm ? (w * 2 * Math.PI) / 60 : w), deRad = (W, rpm) => (rpm ? (W * 60) / (2 * Math.PI) : W);
  function momento(sc) {
    const I1 = lee(sc, 'I1', 'le moment d’inertie initial'), I2 = lee(sc, 'I2', 'le moment d’inertie final'), w1 = lee(sc, 'w1', 'la vitesse angulaire initiale');
    const rpm = sc.unidad !== 'rad', W1 = aRad(w1, rpm), W2 = (I1 * W1) / I2, w2 = deRad(W2, rpm);
    const L = I1 * W1, K1 = 0.5 * I1 * W1 * W1, K2 = 0.5 * I2 * W2 * W2, un = rpm ? 'rpm' : 'rad/s';
    const pasos = [
      { t: 'Sans moment de force extérieur, L se conserve', html: `$I_1 ω_1 = I_2 ω_2 ⇒ ω_2 = ω_1 · I_1/I_2 = ${f(w1)} · ${f(I1)}/${f(I2)}$ = <b>${f(w2)} ${un}</b>${rpm ? ` (= ${f(W2)} rad/s)` : ''}` },
      { t: 'Moment cinétique', html: `$L = I_1 ω_1 = ${f(I1)} · ${f(W1)}$ = <b>${f(L)} kg·m²/s</b>${rpm ? ` (avec ω₁ = ${f(w1)} tr/min = ${f(W1)} rad/s)` : ''}` },
      { t: 'L’énergie cinétique de rotation ne se conserve pas', html: `$K_1 = 1/2 I_1 ω_1^2$ = ${f(K1)} J, $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J ⇒ ΔK = <b>${f(K2 - K1)} J</b> ($K_2/K_1 = I_1/I_2$ = ${f(I1 / I2)}). ${K2 > K1 ? 'En se ramassant, il gagne de l’énergie : elle est fournie par le travail des muscles ou de celui qui tire vers l’intérieur.' : K2 < K1 ? 'De l’énergie est perdue, comme dans un choc inélastique de rotation.' : ''}` },
    ];
    return { modo: 'momento', I1, I2, w1, w2, W1, W2, L, K1, K2, rpm, pasos };
  }

  function choque(sc) {
    const m = lee(sc, 'm', sc.tipo === 'plataforma' ? 'la masse de la personne' : 'la masse de la balle'), M = lee(sc, 'M', sc.tipo === 'plataforma' ? 'la masse de la plateforme' : 'la masse de la tige');
    const L = lee(sc, 'L', sc.tipo === 'plataforma' ? 'le rayon de la plateforme' : 'la longueur de la tige'), r = lee(sc, 'r', 'la distance à l’axe', { cero: true });
    const pasos = [];
    if (sc.tipo === 'plataforma') {
      if (r > L) throw new Error('La personne doit tomber à l’intérieur de la plateforme (r ≤ R)');
      const w1 = lee(sc, 'w1', 'la vitesse angulaire de la plateforme', { cero: true }), v = lee(sc, 'v', 'la vitesse de la personne', { libre: true, opcional: true }) ?? 0;
      const Ip = 0.5 * M * L * L, W1 = aRad(w1, true), L1 = Ip * W1 + m * v * r, I2 = Ip + m * r * r, W2 = L1 / I2;
      const K1 = 0.5 * Ip * W1 * W1 + 0.5 * m * v * v, K2 = 0.5 * I2 * W2 * W2;
      pasos.push({ t: 'Moment cinétique avant', html: `Plateforme (disque) : $I_p = 1/2 M R^2 = 1/2 · ${f(M)} · ${f(L)}^2$ = ${f(Ip)} kg·m², $ω_1$ = ${f(w1)} tr/min = ${f(W1)} rad/s<br>Personne : $m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = ${f(m * v * r)} kg·m²/s ${v ? '(tangente au bord, dans le sens de rotation si elle est positive)' : '(tombe sans vitesse tangentielle)'}<br>$L = I_p ω_1 + m v r$ = <b>${f(L1)} kg·m²/s</b>` });
      pasos.push({ t: 'Ensuite ils tournent ensemble', html: `$I_2 = I_p + m r^2 = ${f(Ip)} + ${f(m)} · ${f(r)}^2$ = ${f(I2)} kg·m² ⇒ $ω_2 = L/I_2$ = <b>${f(W2)} rad/s = ${f(deRad(W2, true))} tr/min</b>` });
      pasos.push({ t: 'Énergie', html: `$K_1$ = ${f(K1)} J → $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J : <b>${f(K1 - K2)} J</b> sont perdus, comme dans tout choc parfaitement inélastique.` });
      return { modo: 'choque', tipo: 'plataforma', M, L, m, r, v, Ip, I2, W1, W2, w2: deRad(W2, true), L1, K1, K2, pasos };
    }
    if (r > L) throw new Error('La balle doit toucher la tige (r ≤ L)');
    const g = lee(sc, 'g', 'la gravité'), v = lee(sc, 'v', 'la vitesse de la balle');
    const Iv = (M * L * L) / 3, I = Iv + m * r * r, W = (m * v * r) / I, K0 = 0.5 * m * v * v, K1 = 0.5 * I * W * W;
    const dcm = (M * L / 2 + m * r) / (M + m), c = 1 - K1 / ((M + m) * g * dcm), vuelta = c < -1;
    const sube = vuelta ? null : Math.acos(c) / RAD;
    pasos.push({ t: 'Moment cinétique par rapport au pivot', html: `Juste avant, seule la balle se déplace : $L = m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = <b>${f(m * v * r)} kg·m²/s</b>. Pendant le choc, le pivot exerce une force, mais pas de moment par rapport à lui-même : L se conserve (pas la quantité de mouvement).` });
    pasos.push({ t: 'Vitesse angulaire après le choc', html: `$I = 1/3 M L^2 + m r^2 = ${f(Iv)} + ${f(m)} · ${f(r)}^2$ = ${f(I)} kg·m² ⇒ $ω = {m v r}/I$ = <b>${f(W)} rad/s</b>` });
    pasos.push({ t: 'Énergie perdue dans le choc', html: `$K_0 = 1/2 m v^2$ = ${f(K0)} J → $K = 1/2 I ω^2$ = ${f(K1)} J : <b>${f(100 * (1 - K1 / K0), 3)} %</b> sont perdus.` });
    pasos.push({ t: 'Jusqu’où il monte', html: `Le centre de masse est à $d = {M L/2 + m r}/{M + m}$ = ${f(dcm)} m du pivot. Après le choc, l’énergie se conserve : $(M + m) g d (1 − cos θ) = 1/2 I ω^2 ⇒ cos θ = ${f(c)}$ ⇒ ${vuelta ? '<b>il fait le tour complet</b> (il y a assez d’énergie pour passer par le haut)' : `<b>θ = ${f(sube)}°</b>`}` });
    return { modo: 'choque', tipo: 'bala', M, L, m, r, v, g, I, W, K0, K1, dcm, sube, vuelta, pasos };
  }

  function pendulo(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.varilla;
    const g = lee(sc, 'g', 'la gravité'), M = lee(sc, 'M', 'la masse'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'la distance du pivot au centre de masse');
    const b = C.placa ? lee(sc, 'b', 'le côté b') : null, ic = Icm(C, M, L, b), I = ic.I + M * d * d, K = (M * g * d) / I;
    const pasos = [{ t: 'Moment d’inertie par rapport au pivot', html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}` }];
    const simula = (th0, signo, tmax, hasta) => {
      const P = [{ t: 0, th: th0, w: 0 }], dt = Math.min(0.002, tmax / 4000);
      let s = P[0];
      for (let n = 0; n * dt < tmax; n++) {
        const fz = (th) => signo * K * Math.sin(th);
        const k1 = [s.w, fz(s.th)], k2 = [s.w + (dt / 2) * k1[1], fz(s.th + (dt / 2) * k1[0])], k3 = [s.w + (dt / 2) * k2[1], fz(s.th + (dt / 2) * k2[0])], k4 = [s.w + dt * k3[1], fz(s.th + dt * k3[0])];
        s = { t: s.t + dt, th: s.th + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), w: s.w + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) };
        P.push(s);
        if (hasta !== undefined && s.th >= hasta) break;
      }
      return P;
    };
    const enT = (P) => (x) => { const T = P[P.length - 1].t, u = Math.min(Math.max(x, 0), T), dt = P[1].t; const i = Math.min(P.length - 2, Math.floor(u / dt)); const a = P[i], z = P[i + 1], q = (u - a.t) / dt; return { th: a.th + (z.th - a.th) * q, w: a.w + (z.w - a.w) * q }; };
    if (sc.tipo === 'cae') {
      const th0 = lee(sc, 'th0', 'l’angle initial', { cero: true, max: 179 }), th = lee(sc, 'th', 'l’angle final', { max: 180 });
      if (th <= th0) throw new Error('L’angle final doit être supérieur à l’angle initial');
      const w = Math.sqrt(2 * K * (Math.cos(th0 * RAD) - Math.cos(th * RAD))), al = K * Math.sin(th * RAD), punta = sc.cuerpo === 'varilla' ? d + L / 2 : d;
      pasos.push({ t: 'Énergie : il tombe depuis le haut', html: `Le centre de masse descend de $d(cos θ_0 − cos θ)$ (angles mesurés depuis la verticale au-dessus du pivot) : $M g d (cos θ_0 − cos θ) = 1/2 I ω^2 ⇒ ω = √({2 M g d (cos θ_0 − cos θ)}/I)$ = <b>${f(w)} rad/s</b>` });
      pasos.push({ t: 'Accélération angulaire à cet instant', html: `$τ = M g d sin θ = I α ⇒ α = {M g d sin θ}/I$ = <b>${f(al)} rad/s²</b>. ${sc.cuerpo === 'varilla' ? `L’extrémité libre (à ${f(punta)} m) a $a_t = α r$ = <b>${f(al * punta)} m/s²</b>${al * punta > g * Math.sin(th * RAD) ? `, plus que la composante de g dans cette direction (${f(g * Math.sin(th * RAD))} m/s²) : une pièce posée à l’extrémité resterait en arrière` : ''}.` : ''}` });
      const P = simula(Math.max(th0, 0.5) * RAD, 1, 30, th * RAD);
      return { modo: 'pendulo', tipo: 'cae', C, M, L, b, d, I, w, al, punta, th0, th, pasos, mov: enT(P), T: P[P.length - 1].t };
    }
    const th0 = lee(sc, 'th0', 'l’amplitude', { opcional: true, max: 179 }) ?? 10;
    const T = 2 * Math.PI * Math.sqrt(I / (M * g * d)), Leq = I / (M * d), wmax = Math.sqrt(2 * K * (1 - Math.cos(th0 * RAD)));
    pasos.push({ t: 'Période des petites oscillations', html: `$τ = −M g d sin θ ≈ −M g d θ = I α ⇒ ω_0 = √({M g d}/I)$ = ${f(Math.sqrt(K))} rad/s ⇒ $T = 2π √(I/(M g d))$ = <b>${f(T)} s</b>` });
    pasos.push({ t: 'Longueur équivalente', html: `Il oscille exactement comme un pendule simple de longueur $L_eq = I/(M d)$ = <b>${f(Leq)} m</b>. S’il est suspendu à $L_eq$ du pivot, de l’autre côté du centre de masse, la période est la même (centre d’oscillation).` });
    pasos.push({ t: `Lâché depuis ${f(th0)}°`, html: `Au passage par le bas : $1/2 I ω^2 = M g d (1 − cos θ_0) ⇒ ω_max$ = <b>${f(wmax)} rad/s</b>${th0 > 20 ? '. Avec cette amplitude, la période réelle est un peu plus grande que celle des petites oscillations (visible dans l’animation).' : '.'}` });
    const P = simula(th0 * RAD, -1, 2 * T);
    return { modo: 'pendulo', tipo: 'oscila', C, M, L, b, d, I, periodo: T, Leq, wmax, th0, pasos, mov: enT(P), T: 2 * T };
  }

  function equilibrio(sc) {
    const g = lee(sc, 'g', 'la gravité'), M = lee(sc, 'M', 'la masse', { cero: true }), L = lee(sc, 'L', 'la longueur');
    const pasos = [];
    if (sc.tipo === 'viga') {
      const xA = lee(sc, 'xA', 'la position de l’appui A', { libre: true }), xB = lee(sc, 'xB', 'la position de l’appui B', { libre: true });
      if (xA === xB) throw new Error('Les deux appuis ne peuvent pas être au même endroit');
      for (const x of [xA, xB]) if (x < 0 || x > L) throw new Error('Les appuis doivent être sur la poutre (entre 0 et L)');
      const cargas = String(sc.cargas || '').split(/;|\n/).map((x) => x.trim()).filter(Boolean).map((c, i) => {
        const [x, m] = c.split(/\s+/).map(leeNum);
        if (!isFinite(x) || !isFinite(m) || m < 0) throw new Error(`Charge ${i + 1} : écris « position masse » avec des nombres (masse positive)`);
        if (x < 0 || x > L) throw new Error(`Charge ${i + 1} : elle doit être sur la poutre`);
        return { x, m };
      });
      const todas = [{ x: L / 2, m: M, nom: 'poids de la poutre' }, ...cargas.map((c, i) => ({ ...c, nom: `charge ${i + 1}` }))].filter((c) => c.m > 0);
      const W = todas.reduce((s, c) => s + c.m * g, 0), mA = todas.reduce((s, c) => s + c.m * g * (c.x - xA), 0);
      const RB = mA / (xB - xA), RA = W - RB;
      pasos.push({ t: 'Moments par rapport à l’appui A', html: `$Σ τ_A = 0$ : ${todas.map((c) => `${f(c.m * g)} · (${f(c.x)} − ${f(xA)})`).join(' + ')} $= R_B (${f(xB)} − ${f(xA)})$ ⇒ <b>R<sub>B</sub> = ${f(RB)} N</b>` });
      pasos.push({ t: 'Forces verticales', html: `$R_A + R_B = Σ m g$ = ${f(W)} N ⇒ <b>R<sub>A</sub> = ${f(RA)} N</b>` });
      const vuelca = RA < -1e-9 || RB < -1e-9;
      if (vuelca) pasos.push({ t: 'Elle bascule !', html: `Un appui devrait tirer vers le bas (réaction négative) : la poutre tourne autour de l’appui ${RA < 0 ? 'B' : 'A'} et bascule, à moins d’être ancrée.` });
      return { modo: 'equilibrio', tipo: 'viga', M, L, xA, xB, cargas, todas, RA, RB, vuelca, pasos };
    }
    const th = lee(sc, 'theta', 'l’angle avec le sol', { max: 89.9 }), m = lee(sc, 'm', 'la masse de la personne', { cero: true, opcional: true }) ?? 0, s = lee(sc, 's', 'où se trouve la personne', { cero: true, opcional: true }) ?? 0;
    const mu = lee(sc, 'mu', 'le frottement avec le sol', { cero: true, opcional: true });
    if (s > L) throw new Error('La personne doit être sur l’échelle (s ≤ L)');
    const t = th * RAD, N1 = (M + m) * g, N2 = (g * Math.cos(t) * (M * L / 2 + m * s)) / (L * Math.sin(t)), Fr = N2, muMin = Fr / N1;
    pasos.push({ t: 'Forces', html: `Mur lisse : il ne pousse qu’horizontalement, $N_2$. Sol : réaction normale $N_1$ et frottement $F_f$ vers le mur.<br>Verticales : $N_1 = (M + m) g$ = <b>${f(N1)} N</b> &nbsp; Horizontales : $F_f = N_2$` });
    pasos.push({ t: 'Moments par rapport au pied de l’échelle', html: `$N_2 L sen θ = M g L/2 cos θ + m g s cos θ ⇒ N_2 = {g cos θ (M L/2 + m s)}/{L sen θ}$ = <b>${f(N2)} N</b> = $F_r$` });
    pasos.push({ t: 'Glisse-t-elle ?', html: `Il faut $μ ≥ F_f/N_1$ = <b>${f(muMin)}</b>${mu !== null ? `; avec μ = ${f(mu)} ${mu >= muMin ? '<b>elle ne glisse pas</b>' : '<b>elle glisse</b>'}` : ''}.` });
    let sMax = null;
    if (mu !== null && m > 0) {
      sMax = (mu * N1 * L * Math.tan(t)) / g / m - (M * L) / (2 * m);
      pasos.push({ t: 'Jusqu’où peut-on monter ?', html: `Avec $F_f = μ N_1$ : $s_max = {μ N_1 L tan θ}/{m g} − {M L}/{2m}$ = ${f(sMax)} m ⇒ ${sMax >= L ? '<b>on peut monter jusqu’en haut</b>' : sMax <= 0 ? '<b>elle glisse dès qu’on monte</b>' : `<b>on peut monter de ${f(sMax)} m</b> sur ${f(L)} m`}.` });
    }
    return { modo: 'equilibrio', tipo: 'escalera', M, L, th, m, s, mu, N1, N2, Fr, muMin, resbala: mu !== null && mu < muMin, sMax, pasos };
  }

  function resolver(sc) {
    const fn = { rodadura, polea, momento, compuesto, choque, pendulo, equilibrio }[sc.modo];
    return fn ? fn(sc) : inercia(sc);
  }

  const G = '9,8';
  const ejemplos = [
    { clave: 'varilla-extremo', nombre: 'Tige qui tourne autour d’une extrémité (Huygens-Steiner)', sc: { modo: 'inercia', cuerpo: 'varilla', M: '2', L: '1,2', d: '0,6' } },
    { clave: 'disco', nombre: 'Disque autour de son axe', sc: { modo: 'inercia', cuerpo: 'cilindro', M: '5', L: '0,3', d: '' } },
    { clave: 'placa', nombre: 'Plaque rectangulaire', sc: { modo: 'inercia', cuerpo: 'placa', M: '3', L: '0,4', b: '0,3', d: '' } },
    { clave: 'pendulo-compuesto', nombre: 'Composé : tige avec une sphère au bout', sc: { modo: 'compuesto', piezas: 'varilla 1 0,8 0,4\nesfera 2 0,1 0,9' } },
    { clave: 'mancuerna', nombre: 'Composé : deux masses reliées par une barre', sc: { modo: 'compuesto', piezas: 'punto 1 0,25\npunto 1 0,25\nvarilla 0,2 0,5 0' } },
    { clave: 'esfera-rueda', nombre: 'Sphère qui roule sur un plan', sc: { modo: 'rodadura', cuerpo: 'esfera', g: G, M: '2', L: '0,1', theta: '30', d: '3', mu: '0,2' } },
    { clave: 'aro-desliza', nombre: 'Cerceau avec peu de frottement', sc: { modo: 'rodadura', cuerpo: 'aro', g: G, M: '1', L: '0,2', theta: '40', d: '2', mu: '0,3' } },
    { clave: 'polea', nombre: 'Poulie pleine avec un corps suspendu', sc: { modo: 'polea', cuerpo: 'cilindro', g: G, M: '4', L: '0,15', m: '2', d: '1,5' } },
    { clave: 'patinadora', nombre: 'Patineuse qui ramène les bras', sc: { modo: 'momento', I1: '4,5', w1: '60', I2: '1,5', unidad: 'rpm' } },
    { clave: 'bala-varilla', nombre: 'Balle qui se fiche dans une tige suspendue', sc: { modo: 'choque', tipo: 'bala', g: G, M: '2', L: '1', m: '0,01', v: '300', r: '0,8' } },
    { clave: 'plataforma', nombre: 'Enfant qui saute sur un manège', sc: { modo: 'choque', tipo: 'plataforma', M: '200', L: '2', w1: '10', m: '30', v: '3', r: '2' } },
    { clave: 'pendulo-fisico', nombre: 'Pendule pesant : tige suspendue par une extrémité', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'varilla', g: G, M: '1', L: '1', d: '0,5', th0: '20' } },
    { clave: 'aro-clavo', nombre: 'Cerceau suspendu à un clou', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'aro', g: G, M: '0,5', L: '0,2', d: '0,2', th0: '10' } },
    { clave: 'varilla-cae', nombre: 'Tige verticale qui tombe en tournant autour de sa base', sc: { modo: 'pendulo', tipo: 'cae', cuerpo: 'varilla', g: G, M: '1', L: '1,5', d: '0,75', th0: '0', th: '90' } },
    { clave: 'escalera', nombre: 'Échelle appuyée contre un mur lisse', sc: { modo: 'equilibrio', tipo: 'escalera', g: G, M: '10', L: '4', theta: '60', m: '70', s: '3', mu: '0,4' } },
    { clave: 'viga', nombre: 'Poutre sur deux appuis avec des charges', sc: { modo: 'equilibrio', tipo: 'viga', g: G, M: '50', L: '6', xA: '0', xB: '4', cargas: '6 30; 2 80' } },
  ];

  return { resolver, inercia, compuesto, rodadura, polea, momento, choque, pendulo, equilibrio, CUERPOS, ejemplos, f };
})();

