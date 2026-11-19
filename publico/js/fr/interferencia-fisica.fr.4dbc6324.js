const Interferencia = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, entero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} doit être un nombre`);
    if (!signo && v <= 0) throw new Error(`${may(nom)} doit être strictement positif`);
    if (entero && !Number.isInteger(v)) throw new Error(`${may(nom)} doit être un nombre entier`);
    return v;
  }
  const grados = (r) => (r * 180) / Math.PI;
  const sinc2 = (b) => (Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2);
  function color(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) r = 1;
    const k = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
    if (nm < 380 || nm > 780) return [150, 150, 150];
    return [r, g, b].map((c) => Math.round(255 * (c * k) ** 0.8));
  }
  const nombreColor = (nm) => (nm < 380 ? 'ultravioleta' : nm < 450 ? 'violeta' : nm < 495 ? 'azul' : nm < 570 ? 'verde' : nm < 590 ? 'amarillo' : nm < 620 ? 'naranja' : nm <= 750 ? 'rojo' : 'infrarrojo');
  const G = (x, d) => `{${f(x, d)}}`;
  const J1 = (x) => { let s = 0; const N = 64; for (let k = 0; k < N; k++) { const t = ((k + 0.5) * Math.PI) / N; s += Math.cos(t - x * Math.sin(t)); } return s / N; };
  const airy = (u) => (Math.abs(u) < 1e-6 ? 1 : ((2 * J1(u)) / u) ** 2);
  const ord = (m) => (m === 0 ? 'central' : `d’ordre ${m}`);

  function young(sc) {
    const l0 = lee(sc, 'lambda', 'la longueur d’onde λ'), d = lee(sc, 'd', 'l’écart entre les fentes d') * 1e-3, L = lee(sc, 'L', 'la distance à l’écran L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'l’indice du milieu n'), lam = (l0 * 1e-9) / n, a = lee(sc, 'a', 'la largeur de chaque fente a', { opcional: true });
    const aa = a === null ? null : a * 1e-3, pasos = [];
    if (aa !== null && aa >= d) throw new Error('La largeur de chaque fente doit être inférieure à l’écart entre elles');
    const dy = (lam * L) / d, mmax = Math.floor(d / lam - 1e-12);
    pasos.push({ t: 'Données', html: `$λ = ${f(l0)}$ nm${n !== 1 ? `, dans un milieu d’indice $n = ${f(n)}$ : $λ_n = λ/n = ${f(lam * 1e9)}$ nm` : ''} (${nombreColor(l0)}), $d = ${f(d * 1e3)}$ mm, $L = ${f(L)}$ m${aa !== null ? `, largeur des fentes $a = ${f(a)}$ mm` : ''}` });
    pasos.push({ t: 'Condition d’interférence', html: `La différence de marche entre les deux fentes jusqu’à un point de l’écran est $Δ = d sin θ$. Il y a un maximum (frange brillante) quand $Δ = mλ$ et un minimum (frange sombre) quand $Δ = (m + ½)λ$, avec m = 0, ±1, ±2…<br>Pour de petits angles, $sin θ ≈ tan θ = y/L$, donc les maxima sont en $y_m = mλL/d$.` });
    pasos.push({ t: 'Interfrange', html: `Distance entre deux franges brillantes (ou deux sombres) consécutives : $Δy = λL/d = {${f(lam)} · ${f(L)}}/${G(d)}$ = <b>${f(dy * 1e3)} mm</b>` });
    const m = lee(sc, 'm', 'l’ordre m', { opcional: true, signo: true, entero: true });
    let ym = null, th = null;
    if (m !== null) {
      if (Math.abs(m) > mmax) throw new Error(`Il n’y a pas de maximum d’ordre ${m} : au plus m = ${mmax} (sin θ = mλ/d ne peut pas dépasser 1)`);
      th = Math.asin((m * lam) / d); ym = L * Math.tan(th);
      pasos.push({ t: `Maximum ${ord(m)}`, html: `$sen θ_{${m}} = mλ/d = {${m} · ${f(lam)}}/${G(d)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b><br>$y_{${m}} = L tan θ$ = <b>${f(ym * 1e3)} mm</b>${Math.abs(th) < 0.1 ? ` (avec l’approximation, $m Δy = ${f(m * dy * 1e3)}$ mm)` : ''}<br>Le minimum suivant est en $y = {(m + ½)λL}/d = ${f((m + 0.5) * dy * 1e3)}$ mm.` });
    }
    const y = lee(sc, 'y', 'la position y sur l’écran', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) {
      const yy = y * 1e-3, s = yy / Math.hypot(yy, L), delta = (2 * Math.PI * d * s) / lam, beta = aa !== null ? (Math.PI * aa * s) / lam : 0;
      Iy = Math.cos(delta / 2) ** 2 * sinc2(beta);
      pasos.push({ t: `Intensité en y = ${f(y)} mm`, html: `Différence de marche $Δ = d sin θ = ${f(d * s * 1e9)}$ nm $= ${f((d * s) / lam)} λ$, déphasage $δ = 2πΔ/λ = ${f(delta)}$ rad<br>$I/I_{"máx"} = cos^2(δ/2)${aa !== null ? ' · (sin β/β)^2' : ''}$ = <b>${f(Iy)}</b>${Iy > 0.95 ? ' (frange brillante)' : Iy < 0.05 ? ' (frange sombre)' : ''}` });
    }
    let h = `L’ordre maximal visible est $m_{"max"} = ⌊d/λ⌋$ = <b>${mmax}</b> (soit ${2 * mmax + 1} maxima au total si l’écran était infini).`;
    if (aa !== null) {
      const ya = (lam * L) / aa, perd = [], q = d / aa, nc = Math.abs(q - Math.round(q)) < 1e-6 ? 2 * Math.round(q) - 1 : 2 * Math.floor(q) + 1;
      for (let k = 1; k * aa < d * 1.0000001 && k < 50; k++) if (Math.abs(((k * d) / aa) - Math.round((k * d) / aa)) < 1e-6) perd.push(Math.round((k * d) / aa));
      h += `<br>Chaque fente diffracte : l’enveloppe a son premier minimum en $a sin θ = λ$, $y = λL/a = ${f(ya * 1e3)}$ mm, donc à l’intérieur du maximum central de diffraction il y a <b>${nc} franges brillantes</b> ($d/a = ${f(d / aa)}$).${perd.length ? ` Les ordres ${perd.map((q) => `±${q}`).join(', ')} manquent, car ils tombent exactement sur un minimum de diffraction.` : ''}`;
    }
    pasos.push({ t: 'Combien de franges', html: h });
    return { modo: 'young', l0, lam, d, L, n, a: aa, dy, mmax, m, th, ym, y, Iy, I: (yy) => { const s = yy / Math.hypot(yy, L); return Math.cos((Math.PI * d * s) / lam) ** 2 * (aa !== null ? sinc2((Math.PI * aa * s) / lam) : 1); }, ancho: aa !== null ? (2 * lam * L) / aa * 1.3 : 10 * dy, pasos };
  }

  function rendija(sc) {
    const l0 = lee(sc, 'lambda', 'la longueur d’onde λ'), a = lee(sc, 'a', 'la largeur de la fente a') * 1e-3, L = lee(sc, 'L', 'la distance à l’écran L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'l’indice du milieu n'), lam = (l0 * 1e-9) / n, pasos = [];
    pasos.push({ t: 'Données', html: `$λ = ${f(l0)}$ nm${n !== 1 ? ` (dans le milieu $λ/n = ${f(lam * 1e9)}$ nm)` : ''}, $a = ${f(a * 1e3)}$ mm, $L = ${f(L)}$ m` });
    pasos.push({ t: 'Minima de diffraction', html: `En divisant la fente en deux moitiés, la lumière de chaque point d’une moitié s’annule avec celle du point correspondant de l’autre quand $a sin θ = mλ$, avec m = ±1, ±2… (m = 0 est le maximum central, pas un minimum).` });
    const m = vacio(sc.m) ? 1 : lee(sc, 'm', 'l’ordre m', { entero: true });
    if (m * lam > a) throw new Error(`Il n’y a pas de minimum d’ordre ${m} : a sin θ = mλ exige sin θ = ${f((m * lam) / a)} > 1`);
    const th = Math.asin((m * lam) / a), ym = L * Math.tan(th), th1 = Math.asin(Math.min(1, lam / a)), ancho = 2 * L * Math.tan(th1);
    pasos.push({ t: `Minimum d’ordre ${m}`, html: `$sin θ_{${m}} = mλ/a = {${m} · ${f(lam)}}/${G(a)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b>, $y_{${m}} = L tan θ$ = <b>${f(ym * 1e3)} mm</b>` });
    pasos.push({ t: 'Largeur du maximum central', html: `Il va du minimum −1 au +1 : $2L tan θ_1 ≈ 2λL/a$ = <b>${f(ancho * 1e3)} mm</b>. Les maxima secondaires sont deux fois moins larges et beaucoup plus faibles (le premier a 4,7 % de l’intensité centrale). Plus la fente est étroite, plus la lumière s’étale.` });
    const y = lee(sc, 'y', 'la position y', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) { const s = (y * 1e-3) / Math.hypot(y * 1e-3, L), b = (Math.PI * a * s) / lam; Iy = sinc2(b); pasos.push({ t: `Intensité en y = ${f(y)} mm`, html: `$β = πa sin θ/λ = ${f(b)}$ rad ⇒ $I/I_0 = (sin β/β)^2$ = <b>${f(Iy)}</b>` }); }
    return { modo: 'rendija', l0, lam, a, L, n, m, th, ym, ancho, y, Iy, I: (yy) => sinc2((Math.PI * a * (yy / Math.hypot(yy, L))) / lam), anchoV: Math.min(3.2 * ancho, 4 * L), pasos };
  }

  function circular(sc) {
    const l0 = lee(sc, 'lambda', 'la longueur d’onde λ'), D = lee(sc, 'D', 'le diamètre de l’ouverture D') * 1e-3;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'l’indice du milieu n'), lam = (l0 * 1e-9) / n, pasos = [];
    const L = lee(sc, 'L', 'la distance à l’écran L', { opcional: true }), dist = lee(sc, 'dist', 'la distance aux objets', { opcional: true }), sep = lee(sc, 'sep', 'la séparation des objets', { opcional: true });
    if (1.22 * lam >= D) throw new Error('L’ouverture est plus petite que la longueur d’onde : il n’y a pas de disque d’Airy (1,22 λ/D > 1)');
    const thR = Math.asin((1.22 * lam) / D);
    pasos.push({ t: 'Disque d’Airy', html: `Une ouverture circulaire de diamètre D diffracte la lumière en un disque central brillant entouré d’anneaux. Le premier minimum est en $sin θ = 1,22 λ/D = {1,22 · ${f(lam)}}/${G(D)} = ${f(Math.sin(thR))}$ ⇒ θ = <b>${f(thR)} rad</b> (${f(grados(thR))}°)${n !== 1 ? `, avec $λ/n = ${f(lam * 1e9)}$ nm dans le milieu` : ''}.` });
    let r = null;
    if (L !== null) { r = L * Math.tan(thR); pasos.push({ t: 'Taille du disque', html: `Sur un écran (ou dans le plan focal) à $L = ${f(L)}$ m, le rayon du disque central est $r = L tan θ ≈ 1,22 λL/D$ = <b>${f(r * 1e3)} mm</b>.` }); }
    pasos.push({ t: 'Critère de Rayleigh', html: `Deux points se distinguent si le maximum de l’un tombe au moins sur le premier minimum de l’autre : la séparation angulaire minimale est $θ_{"min"} ≈ 1,22 λ/D$ = <b>${f(thR)} rad</b>. C’est la limite de résolution de l’instrument : plus le diamètre est grand et plus la longueur d’onde est petite, plus on voit de détails.` });
    let smin = null, res = null, thS = null;
    if (dist !== null) {
      smin = dist * thR;
      pasos.push({ t: `Objets à ${f(dist)} m`, html: `La séparation minimale que l’on distingue est $s_{"min"} = θ_{"min"} · d = ${f(thR)} · ${f(dist)}$ = <b>${f(smin * 1e3)} mm</b>${smin > 1 ? ` (${f(smin / 1e3)} km)` : ''}.` });
      if (sep !== null) { thS = (sep * 1e-3) / dist; res = thS >= thR; pasos.push({ t: 'Distinguables ?', html: `Les deux objets sont vus sous un angle $θ = s/d = ${f(sep * 1e-3)}/${f(dist)} = ${f(thS)}$ rad, ${res ? 'supérieur' : 'inférieur'} à $θ_{"min"}$ : <b>${res ? 'on les distingue' : 'on ne les distingue pas'}</b>${res ? '' : ', ils apparaissent comme un seul point'}.` }); }
    }
    const esc = L ?? 1, k = (Math.PI * D) / lam, s2 = thS !== null ? thS / 2 : null;
    const un = (y) => airy(k * Math.sin(Math.atan(y / esc)));
    const dos = s2 === null ? null : (y) => (airy(k * Math.sin(Math.atan(y / esc) - s2)) + airy(k * Math.sin(Math.atan(y / esc) + s2)));
    let norma = 1;
    if (dos) { norma = 0; for (let i = 0; i <= 400; i++) norma = Math.max(norma, dos(((i / 400) - 0.5) * 2 * esc * Math.tan(thR + 2 * s2))); }
    const ancho = 2 * esc * Math.tan(Math.min(1.4, 2.6 * thR + (s2 ?? 0) * 2));
    return { modo: 'circular', l0, lam, D, n, L, dist, sep, thR, r, smin, thS, res, eje: L !== null ? 'y (mm)' : 'θ (mrad)', I: dos ? (y) => dos(y) / norma : un, Iuno: un, s2, ancho, ym: null, y: null, pasos };
  }

  function red(sc) {
    const l0 = lee(sc, 'lambda', 'la longueur d’onde λ'), N = lee(sc, 'N', 'le nombre de traits par mm'), d = 1e-3 / N, lam = l0 * 1e-9, pasos = [];
    const L = lee(sc, 'L', 'la distance à l’écran L', { opcional: true }), l2 = lee(sc, 'lambda2', 'la deuxième longueur d’onde', { opcional: true }), W = lee(sc, 'W', 'la largeur éclairée', { opcional: true });
    pasos.push({ t: 'Pas du réseau', html: `Avec ${f(N)} traits par mm, la distance entre fentes est $d = 1/N = ${f(d * 1e3)}$ mm $= ${f(d * 1e9)}$ nm` });
    const mmax = Math.floor(d / lam - 1e-12);
    if (mmax < 1) throw new Error('Avec ce réseau et cette λ, il n’y a même pas de premier ordre (λ > d)');
    const ords = [];
    for (let m = 1; m <= mmax; m++) { const th = Math.asin((m * lam) / d); ords.push({ m, th, y: L !== null && th < 1.5 ? L * Math.tan(th) : null }); }
    pasos.push({ t: 'Équation du réseau', html: `Les fentes interfèrent de façon constructive quand $d sin θ = mλ$. Avec de nombreuses fentes, les maxima sont très fins et brillants.<br>${ords.map((o) => `m = ${o.m}: $sen θ = ${f((o.m * lam) / d)}$ ⇒ θ = <b>${f(grados(o.th))}°</b>${o.y !== null ? `, $y = L tan θ = ${f(o.y * 100)}$ cm` : ''}`).join('<br>')}` });
    pasos.push({ t: 'Ordre maximal', html: `$sin θ ≤ 1$ ⇒ $m ≤ d/λ = ${f(d / lam)}$ ⇒ <b>m<sub>max</sub> = ${mmax}</b>, donc on voit ${2 * mmax + 1} maxima en comptant le central.` });
    let sep = null, R = null, dlmin = null;
    if (W !== null) {
      const Nt = W * N; R = Nt * mmax; dlmin = l0 / Nt;
      pasos.push({ t: 'Pouvoir de résolution (Rayleigh)', html: `Avec $N = ${f(Nt)}$ fentes éclairées, chaque maximum est si fin que deux longueurs d’onde sont séparées si $λ/Δλ ≤ R = mN$. Au premier ordre, $R = ${f(Nt)}$ et on distingue $Δλ_{"min"} = λ/(mN) = ${f(l0)}/${G(Nt)}$ = <b>${f(dlmin, 3)} nm</b> ; à l’ordre ${mmax}, $R = ${f(R)}$ et $Δλ_{"min"} = ${f(l0 / R, 3)}$ nm.` });
    }
    if (l2 !== null) {
      const t1 = Math.asin(lam / d), t2 = (l2 * 1e-9) / d <= 1 ? Math.asin((l2 * 1e-9) / d) : NaN;
      sep = grados(t2 - t1);
      let h = `Au premier ordre, $λ_2 = ${f(l2)}$ nm sort à θ = ${isFinite(t2) ? `${f(grados(t2))}°` : 'aucun'} : séparation angulaire $Δθ$ = <b>${f(Math.abs(sep))}°</b>${L !== null && isFinite(t2) ? `, sur l’écran ${f(Math.abs(L * (Math.tan(t2) - Math.tan(t1))) * 1000)} mm` : ''}.`;
      if (W !== null) { const Nt = W * N, dl = Math.abs(l2 - l0), lm = (l0 + l2) / 2; h += `<br>Pour les séparer au premier ordre, il faut $λ/Δλ = ${f(lm)}/${G(dl)} = ${f(lm / dl)}$ et le réseau donne $R = ${f(Nt)}$ : ${Nt >= lm / dl ? '<b>elles sont résolues</b>' : '<b>elles ne sont pas résolues</b>'}.`; }
      pasos.push({ t: 'Deux longueurs d’onde', html: h });
    }
    return { modo: 'red', l0, lam, N, d, L, mmax, ords, l2, sep, R, dlmin, W, pasos };
  }

  function lamina(sc) {
    const nf = lee(sc, 'nl', 'l’indice de la lame n'), n1 = vacio(sc.n1) ? 1 : lee(sc, 'n1', 'l’indice du milieu supérieur'), n2 = vacio(sc.n2) ? 1 : lee(sc, 'n2', 'l’indice du milieu inférieur'), pasos = [];
    const salto1 = nf > n1, salto2 = n2 > nf, medio = salto1 !== salto2;
    pasos.push({ t: 'Changements de phase à la réflexion', html: `Une onde qui se réfléchit sur un milieu d’indice plus élevé change de phase de π (comme une demi-longueur d’onde) ; si l’indice est plus faible, elle ne change pas.<br>En haut (${f(n1)} → ${f(nf)}) : ${salto1 ? 'change de π' : 'pas de changement'}. &ensp; En bas (${f(nf)} → ${f(n2)}) : ${salto2 ? 'change de π' : 'pas de changement'}.<br>${medio ? 'Une seule des deux change : il y a un déphasage supplémentaire d’une demi-longueur d’onde.' : 'Les deux pareilles : il n’y a pas de déphasage supplémentaire.'}` });
    const condC = medio ? '$2nt = (m + ½)λ$' : '$2nt = mλ$', condD = medio ? '$2nt = mλ$' : '$2nt = (m + ½)λ$';
    pasos.push({ t: 'Condition', html: `Le rayon qui entre dans la lame parcourt 2t de plus, soit un chemin optique 2nt. En réflexion :<br>renforcement (on voit brillant) : ${condC} ; &ensp; annulation : ${condD}, avec m = ${medio ? '0, 1, 2…' : '1, 2, 3…'}` });
    const t = lee(sc, 't', 'l’épaisseur t', { opcional: true }), l0 = lee(sc, 'lambda', 'la longueur d’onde λ', { opcional: true });
    let refuerzan = [], anulan = [], tmin = null, tmin2 = null;
    if (t !== null) {
      const op = 2 * nf * t;
      for (let m = 0; m < 200; m++) { const lc = op / (medio ? m + 0.5 : m), ld = op / (medio ? m : m + 0.5); if (isFinite(lc) && lc >= 380 && lc <= 750) refuerzan.push(lc); if (isFinite(ld) && ld > 0 && ld >= 380 && ld <= 750) anulan.push(ld); }
      pasos.push({ t: `Avec t = ${f(t)} nm`, html: `Chemin optique supplémentaire $2nt = 2 · ${f(nf)} · ${f(t)} = ${f(op)}$ nm<br>Renforcées dans le visible : ${refuerzan.length ? refuerzan.map((l) => `<b>${f(l)} nm</b> (${nombreColor(l)})`).join(', ') : 'aucune'}<br>Annulées : ${anulan.length ? anulan.map((l) => `${f(l)} nm (${nombreColor(l)})`).join(', ') : 'aucune'}${t < 30 ? '<br>Avec une épaisseur si petite devant λ, la lame paraît sombre en réflexion s’il y a un déphasage supplémentaire (comme le haut d’une bulle de savon sur le point d’éclater).' : ''}` });
    }
    if (l0 !== null) {
      tmin = medio ? l0 / (4 * nf) : l0 / (2 * nf); tmin2 = medio ? l0 / (2 * nf) : l0 / (4 * nf);
      pasos.push({ t: `Épaisseurs pour λ = ${f(l0)} nm`, html: `Épaisseur minimale avec renforcement : $t = ${medio ? 'λ/(4n)' : 'λ/(2n)'}$ = <b>${f(tmin)} nm</b><br>Épaisseur minimale qui annule la réflexion (antireflet) : $t = ${medio ? 'λ/(2n)' : 'λ/(4n)'}$ = <b>${f(tmin2)} nm</b>${!medio && n1 < nf && nf < n2 ? `<br>Pour l’annuler complètement, $n = √(n_1 n_2) = ${f(Math.sqrt(n1 * n2))}$ égalise les deux réflexions.` : ''}` });
    }
    if (t === null && l0 === null) throw new Error('Donne l’épaisseur t, la longueur d’onde λ ou les deux');
    return { modo: 'lamina', nf, n1, n2, medio, t, l0, refuerzan, anulan, tmin, tmin2, pasos, R: (lnm, tt = t) => { const d = (2 * Math.PI * 2 * nf * tt) / lnm + (medio ? Math.PI : 0); return Math.cos(d / 2) ** 2; } };
  }

  function cuna(sc) {
    const l0 = lee(sc, 'lambda', 'la longueur d’onde λ'), Lc = lee(sc, 'Lc', 'la longueur des plaques') * 1e-2;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'l’indice de ce qui se trouve dans le coin'), lam = l0 * 1e-9, pasos = [];
    const h0 = lee(sc, 'h', 'l’épaisseur de la cale', { opcional: true }), dx0 = lee(sc, 'dx', 'l’interfrange mesuré', { opcional: true });
    if (h0 === null && dx0 === null) throw new Error('Donne l’épaisseur de la cale h ou l’interfrange mesuré');
    pasos.push({ t: 'Pourquoi des franges apparaissent', html: `La lumière se réfléchit en haut et en bas de la couche ${n === 1 ? 'd’air' : `d’indice ${f(n)}`} ; la réflexion du bas change de phase de π, donc à une distance x du contact, avec une épaisseur $t = αx$, il y a une frange sombre si $2nt = mλ$ et brillante si $2nt = (m + ½)λ$. Juste au contact (t = 0), la frange est sombre.` });
    let h, dx;
    if (h0 !== null) {
      h = h0 * 1e-6; dx = (lam * Lc) / (2 * n * h);
      pasos.push({ t: 'Interfrange', html: `L’angle du coin est $α ≈ h/L = ${f(h)}/${f(Lc)} = ${f(h / Lc)}$ rad. Entre deux franges sombres, l’épaisseur augmente de λ/(2n) : $Δx = λ/(2nα) = λL/(2nh) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(h)}}$ = <b>${f(dx * 1e3)} mm</b>` });
    } else {
      dx = dx0 * 1e-3; h = (lam * Lc) / (2 * n * dx);
      pasos.push({ t: 'Épaisseur à partir des franges', html: `De $Δx = λL/(2nh)$ on tire $h = λL/(2nΔx) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(dx)}}$ = <b>${f(h * 1e6)} µm</b>. C’est ainsi que l’on mesure l’épaisseur d’un cheveu ou d’une feuille de papier.` });
    }
    const N = Math.floor((2 * n * h) / lam + 1e-9) + 1;
    pasos.push({ t: 'Combien de franges', html: `À l’extrémité, $2nh/λ = ${f((2 * n * h) / lam)}$, donc on voit <b>${N} franges sombres</b> en comptant celle du contact (une tous les ${f(dx * 1e3)} mm).` });
    const alfa = h / Lc;
    return { modo: 'cuna', l0, lam, Lc, n, h, dx, N, alfa, eje: 'x (mm)', desde0: true, I: (x) => Math.sin((2 * Math.PI * n * alfa * Math.max(0, x)) / lam) ** 2, ancho: Math.min(Lc, 12 * dx), ym: null, y: null, pasos };
  }

  function anillos(sc) {
    const l0 = lee(sc, 'lambda', 'la longueur d’onde λ'), lam = l0 * 1e-9, n = vacio(sc.n) ? 1 : lee(sc, 'n', 'l’indice de ce qui se trouve entre la lentille et le verre');
    const m = vacio(sc.m) ? 5 : lee(sc, 'm', 'le numéro de l’anneau m', { entero: true });
    const R0 = lee(sc, 'R', 'le rayon de courbure de la lentille', { opcional: true }), rm0 = lee(sc, 'rm', 'le rayon mesuré de l’anneau', { opcional: true }), pasos = [];
    if (R0 === null && rm0 === null) throw new Error('Donne le rayon de courbure R ou le rayon mesuré d’un anneau');
    pasos.push({ t: 'Épaisseur de la couche', html: `Entre la lentille et le verre, il reste une couche ${n === 1 ? 'd’air' : `d’indice ${f(n)}`} qui, à une distance r du centre, mesure $t ≈ r^2/(2R)$. Comme dans le coin, la réflexion du bas change de phase de π : anneau sombre si $2nt = mλ$ et brillant si $2nt = (m + ½)λ$. Le centre est sombre.` });
    let R;
    if (R0 !== null) R = R0;
    else { const rm = rm0 * 1e-3; R = (n * rm * rm) / (m * lam); pasos.push({ t: 'Rayon de courbure', html: `De $r_m^2 = mλR/n$ on tire $R = n r_m^2/(mλ) = {${f(n)} · (${f(rm)})^2}/{${m} · ${f(lam)}}$ = <b>${f(R)} m</b>` }); }
    const ro = Math.sqrt((m * lam * R) / n), rb = Math.sqrt(((m - 0.5) * lam * R) / n);
    pasos.push({ t: `Anneau ${m}`, html: `Sombre : $r_m = √(mλR/n) = √({${m} · ${f(lam)} · ${f(R)}}/${G(n)})$ = <b>${f(ro * 1e3)} mm</b><br>Le brillant d’avant : $r = √({(m − ½)λR}/n)$ = <b>${f(rb * 1e3)} mm</b><br>Les anneaux se resserrent vers l’extérieur parce que le rayon croît comme $√m$.` });
    return { modo: 'anillos', l0, lam, n, m, R, ro, rb, eje: 'r (mm)', I: (r) => Math.sin((Math.PI * n * r * r) / (lam * R)) ** 2, ancho: 2 * Math.sqrt(((m + 3) * lam * R) / n), ym: ro, y: null, pasos };
  }

  const MODOS = { young, rendija, circular, red, lamina, cuna, anillos };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : young(sc); }

  const ejemplos = [
    { clave: 'young', nombre: 'Young avec un laser rouge', sc: { modo: 'young', lambda: '633', d: '0,25', L: '1,5', n: '', a: '', m: '3', y: '' } },
    { clave: 'young-y', nombre: 'Intensité en un point de l’écran', sc: { modo: 'young', lambda: '550', d: '0,1', L: '2', n: '', a: '', m: '', y: '5,5' } },
    { clave: 'young-a', nombre: 'Doubles fentes avec diffraction (ordres manquants)', sc: { modo: 'young', lambda: '600', d: '0,3', L: '1', n: '', a: '0,1', m: '1', y: '' } },
    { clave: 'young-agua', nombre: 'Young sous l’eau', sc: { modo: 'young', lambda: '589', d: '0,2', L: '1', n: '1,33', a: '', m: '1', y: '' } },
    { clave: 'rendija', nombre: 'Fente simple', sc: { modo: 'rendija', lambda: '500', a: '0,05', L: '1,2', n: '', m: '1', y: '' } },
    { clave: 'rendija-2', nombre: 'Deuxième minimum d’une fente étroite', sc: { modo: 'rendija', lambda: '633', a: '0,02', L: '2', n: '', m: '2', y: '10' } },
    { clave: 'ojo', nombre: 'Les phares d’une voiture : en voit-on deux ou un ?', sc: { modo: 'circular', lambda: '550', D: '5', L: '', dist: '10000', sep: '1400', n: '' } },
    { clave: 'telescopio', nombre: 'Télescope de 10 cm et son disque d’Airy', sc: { modo: 'circular', lambda: '550', D: '100', L: '1', dist: '', sep: '', n: '' } },
    { clave: 'red', nombre: 'Réseau de 600 traits/mm', sc: { modo: 'red', lambda: '500', N: '600', L: '1', lambda2: '', W: '' } },
    { clave: 'sodio', nombre: 'Doublet du sodium (589,0 et 589,6 nm)', sc: { modo: 'red', lambda: '589', N: '300', L: '2', lambda2: '589,6', W: '5' } },
    { clave: 'pompa', nombre: 'Bulle de savon', sc: { modo: 'lamina', nl: '1,33', n1: '1', n2: '1', t: '400', lambda: '' } },
    { clave: 'antirreflejo', nombre: 'Couche antireflet sur des lunettes', sc: { modo: 'lamina', nl: '1,38', n1: '1', n2: '1,52', t: '', lambda: '550' } },
    { clave: 'aceite', nombre: 'Tache d’huile sur l’eau', sc: { modo: 'lamina', nl: '1,45', n1: '1', n2: '1,33', t: '300', lambda: '' } },
    { clave: 'cuna', nombre: 'Coin d’air avec une feuille de papier comme cale', sc: { modo: 'cuna', lambda: '589', Lc: '10', h: '50', dx: '', n: '' } },
    { clave: 'pelo', nombre: 'Épaisseur d’un cheveu d’après les franges', sc: { modo: 'cuna', lambda: '633', Lc: '8', h: '', dx: '0,5', n: '' } },
    { clave: 'newton', nombre: 'Anneaux de Newton', sc: { modo: 'anillos', lambda: '589', R: '1', m: '5', rm: '', n: '' } },
    { clave: 'newton-r', nombre: 'Rayon d’une lentille d’après ses anneaux', sc: { modo: 'anillos', lambda: '546', R: '', m: '10', rm: '2,5', n: '' } },
  ];
  return { resolver, color, nombreColor, ejemplos, f };
})();

