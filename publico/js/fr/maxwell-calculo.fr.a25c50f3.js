const Maxwell = (() => {
  const Ex_ = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const E0V = 8.8541878128e-12, MU0 = 1.25663706212e-6, C = 1 / Math.sqrt(E0V * MU0);
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const fm = (x, d) => f(x, d).replace(/<sup>(.*?)<\/sup>/, '^{$1}');
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, signo = 'pos') {
    if (vacio(sc[k])) throw new Error(`${nom} manquant`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} doit être un nombre`);
    if (signo === 'pos' && v <= 0) throw new Error(`${may(nom)} doit être supérieur à 0`);
    if (signo === 'no0' && v < 0) throw new Error(`${may(nom)} ne peut pas être négatif`);
    return v;
  }

  const campos = {
    gauss: [['Q', 'Charge totale Q', 'nC'], ['R', 'Rayon de la sphère chargée R', 'm'], ['r', 'Rayon de la surface gaussienne r', 'm']],
    gaussmag: [['Bx', 'Champ B en x', 'T'], ['By', 'Champ B en y', 'T'], ['Bz', 'Champ B en z', 'T'], ['L', 'Côté du cube L', 'm']],
    faraday: [['B0', 'Amplitude du champ B₀', 'mT'], ['fr', 'Fréquence f', 'Hz'], ['A', 'Aire de chaque spire A', 'cm²'], ['N', 'Nombre de spires N', '']],
    ampere: [['I', 'Courant I qui charge le condensateur', 'A'], ['R', 'Rayon des armatures R', 'cm'], ['r', 'Distance à l\'axe r', 'cm']],
    onda: [['E0', 'Amplitude du champ électrique E₀', 'V/m'], ['fr', 'Fréquence f', 'Hz']],
    continuidad: [['sigma', 'Conductivité σ', 'S/m'], ['er', 'Permittivité relative ε<sub>r</sub>', ''], ['rho0', 'Densité de charge initiale ρ₀', 'µC/m³'], ['t', 'Instant t (vide = seulement τ)', 's'], ['fr', 'Fréquence f pour σ/ωε (vide = non)', 'Hz']],
    campo: [['Ex', 'Champ E, composante x', 'V/m'], ['Ey', 'Champ E, composante y', 'V/m'], ['Ez', 'Champ E, composante z', 'V/m'], ['Bx', 'Champ B, composante x (vide = inconnu)', 'T'], ['By', 'Champ B, composante y', 'T'], ['Bz', 'Champ B, composante z', 'T'], ['rho', 'Densité de charge ρ (vide = 0)', 'C/m³'], ['Jx', 'Courant J, composante x (vide = 0)', 'A/m²'], ['Jy', 'Courant J, composante y', 'A/m²'], ['Jz', 'Courant J, composante z', 'A/m²']],
  };
  const nombres = { gauss: 'Gauss pour E', gaussmag: 'Gauss pour B', faraday: 'Faraday', ampere: 'Ampère–Maxwell', onda: 'L\'onde électromagnétique', continuidad: 'Continuité : relaxation de la charge', campo: 'Ce champ vérifie-t-il les équations ?' };

  const lineas = (a, b, g, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, g(x)]; });


  const VARS = ['x', 'y', 'z', 't'], PUNTOS = [[0.31, -0.52, 0.77, 0], [-0.43, 0.28, 0.61, 1e-9], [0.67, 0.35, -0.29, 2.7e-9], [0.18, -0.74, -0.46, 0.13], [-0.55, -0.21, 0.38, 0.61], [0.92, 0.47, 0.83, 3.1e-9]];
  const val = (n, P) => Ex_.valor(n, P[0], { y: P[1], z: P[2], t: P[3] });
  const lc = (src, nom) => (vacio(src) ? null : Ex_.lee(src, nom, VARS));
  const tx = (n) => Ex_.texto(n);
  const CERO = Ex_.N(0), suma = (...l) => l.reduce((a, b) => Ex_.simp({ t: '+', a, b }));
  const neg = (a) => Ex_.simp({ t: 'neg', a }), rest = (a, b) => Ex_.simp({ t: '-', a, b });
  const dv = (n, v) => (n ? Ex_.deriva(n, v) : CERO);
  const por = (c, a) => Ex_.simp({ t: '*', a: Ex_.N(c), b: a });
  function residuo(izq, der) {
    let r = 0, esc2 = 0, n = 0, malos = 0;
    for (const P of PUNTOS) {
      for (let c = 0; c < izq.length; c++) {
        const a = val(izq[c], P), b = val(der[c], P); if (!isFinite(a) || !isFinite(b)) { malos++; continue; }
        n++; r = Math.max(r, Math.abs(a - b)); esc2 = Math.max(esc2, Math.abs(a), Math.abs(b));
      }
    }
    if (!n || malos * 2 > n + malos) throw new Error('Impossible d\'évaluer le champ aux points d\'essai (division par zéro ou variable manquante ?)');
    return { abs: r, rel: esc2 > 0 ? r / esc2 : 0, escala: esc2 };
  }
  function resolverCampo(sc) {
    const E = ['Ex', 'Ey', 'Ez'].map((k) => lc(sc[k], `E${k[1]}`) || CERO), Bv = ['Bx', 'By', 'Bz'].map((k) => lc(sc[k], `B${k[1]}`)), conB = Bv.some(Boolean), B = Bv.map((b) => b || CERO);
    if (E.every((e) => e === CERO)) throw new Error('Écrivez au moins une composante de E');
    const rho = lc(sc.rho, 'ρ') || CERO, J = ['Jx', 'Jy', 'Jz'].map((k) => lc(sc[k], `J${k[1]}`) || CERO);
    for (const [n, nom] of [...E.map((e, i) => [e, 'E' + 'xyz'[i]]), ...B.map((b, i) => [b, 'B' + 'xyz'[i]]), ...J.map((j, i) => [j, 'J' + 'xyz'[i]]), [rho, 'ρ']]) if (PUNTOS.filter((P) => !isFinite(val(n, P))).length * 2 >= PUNTOS.length) throw new Error(`${nom} ne peut pas être évalué aux points d'essai (division par zéro ?)`);
    const V = ['x', 'y', 'z'], rot = (F) => [rest(dv(F[2], 'y'), dv(F[1], 'z')), rest(dv(F[0], 'z'), dv(F[2], 'x')), rest(dv(F[1], 'x'), dv(F[0], 'y'))];
    const div = (F) => suma(dv(F[0], 'x'), dv(F[1], 'y'), dv(F[2], 'z'));
    const divE = div(E), rotE = rot(E), dBdt = B.map((b) => dv(b, 't')), dEdt = E.map((e) => dv(e, 't'));
    const eqs = [];
    eqs.push({ n: 'Gauss pour E', f: '∇·E = ρ/ε₀', ...residuo([por(E0V, divE)], [rho]), t: `$∇·E = ${tx(divE)}$`, extra: `ρ nécessaire = ε₀∇·E = ${tx(por(E0V, divE))}` });
    let divB = null;
    if (conB) { divB = div(B); eqs.push({ n: 'Gauss pour B', f: '∇·B = 0', ...residuo([divB], [CERO]), t: `$∇·B = ${tx(divB)}$` }); }
    if (conB) eqs.push({ n: 'Faraday', f: '∇×E = −∂B/∂t', ...residuo(rotE, dBdt.map(neg)), t: `$∇×E = (${rotE.map(tx).join(', ')})$ y $−∂B/∂t = (${dBdt.map((d) => tx(neg(d))).join(', ')})$` });
    let rotB = null;
    if (conB) { rotB = rot(B); eqs.push({ n: 'Ampère–Maxwell', f: '∇×B = μ₀J + μ₀ε₀ ∂E/∂t', ...residuo(rotB.map((b) => por(1 / MU0, b)), J.map((j, i) => suma(j, por(E0V, dEdt[i])))), t: `$∇×B = (${rotB.map(tx).join(', ')})$` }); }
    for (const q of eqs) q.ok = q.rel <= 1e-6;
    const fallan = eqs.filter((q) => !q.ok), pasos = [];
    pasos.push({ t: 'Mise en équation', html: `Chaque équation de Maxwell est vérifiée avec les dérivées partielles exactes de ce que vous avez écrit (variables $x$, $y$, $z$, $t$ en m et s). Ensuite, on évalue la différence entre les deux membres en ${PUNTOS.length} points d'essai et on l'accepte si elle est inférieure à $10^{−6}$ de la taille des termes.` });
    pasos.push({ t: 'Divergence de E', html: `$∇·E = {∂E_x}/{∂x} + {∂E_y}/{∂y} + {∂E_z}/{∂z} = ${tx(divE)}$. Gauss exige $∇·E = ρ/ε_0$ : ` + (eqs[0].ok ? `elle est vérifiée avec ρ = ${tx(rho)}.` : `elle n'est pas vérifiée avec ρ = ${tx(rho)} ; il faudrait $ρ = ε_0 ∇·E = ${tx(por(E0V, divE))}$ (différence relative ${f(eqs[0].rel)}).`) });
    if (conB) {
      pasos.push({ t: 'Divergence de B', html: `$∇·B = ${tx(divB)}$. Gauss pour B exige qu'elle soit nulle : ` + (eqs[1].ok ? 'elle est vérifiée.' : `elle n'est pas vérifiée (différence relative ${f(eqs[1].rel)}) : un tel champ B impliquerait un monopôle magnétique.`) });
      pasos.push({ t: 'Rotationnel de E', html: `$∇×E = (${rotE.map(tx).join(', ')})$ et $−{∂B}/{∂t} = (${dBdt.map((d) => tx(neg(d))).join(', ')})$. Faraday : ` + (eqs[2].ok ? 'coinciden.' : `ne coïncident pas (différence relative ${f(eqs[2].rel)}).`) });
      pasos.push({ t: 'Rotationnel de B', html: `$∇×B = (${rotB.map(tx).join(', ')})$ et $μ_0 J + μ_0 ε_0 {∂E}/{∂t} = μ_0 (${J.map((j, i) => tx(suma(j, por(E0V, dEdt[i])))).join(', ')})$. Ampère–Maxwell : ` + (eqs[3].ok ? 'coinciden.' : `ne coïncident pas (différence relative ${f(eqs[3].rel)}).`) });
    } else {
      pasos.push({ t: 'Quel est B', html: `Avec E seul, Faraday donne $∂B/∂t = −∇×E = (${rotE.map((r2) => tx(neg(r2))).join(', ')})$. En intégrant en $t$ (plus un champ statique arbitraire) on obtient B ; écrivez-le dans les champs de B pour vérifier Gauss pour B et Ampère–Maxwell.` });
    }
    pasos.push({ t: 'Conclusion', html: conB ? (fallan.length ? `Le champ <b>ne vérifie pas</b> : ${fallan.map((q) => q.n).join(', ')}. Il ne peut pas être un champ électromagnétique avec ces sources.` : 'Il vérifie les quatre équations : c\'est un champ électromagnétique possible avec ces sources.') : (eqs[0].ok ? 'Il vérifie Gauss pour E ; donnez le champ B pour continuer.' : 'Il ne vérifie pas Gauss pour E avec cette ρ.') });
    const ok = conB && !fallan.length;
    return { modo: 'campo', eqs, conB, ok, fallan, divE: tx(divE), rotE: rotE.map(tx), dBdt: dBdt.map((d) => tx(neg(d))), pasos, grafica: { barras: eqs.map((q) => ({ n: q.n, v: q.rel })), yl: 'différence relative entre les deux membres', cero: true } };
  }

  function resolver(sc) {
    const modo = sc.modo || 'gauss';
    if (modo === 'campo') return resolverCampo(sc);
    if (!campos[modo]) throw new Error('Cette équation n\'existe pas');
    let r;
    if (modo === 'gauss') {
      const Q = lee(sc, 'Q', 'la charge', 'cualquiera') * 1e-9, R = lee(sc, 'R', 'le rayon de la sphère'), rr = lee(sc, 'r', 'le rayon de la surface');
      if (Q === 0) throw new Error('La charge ne peut pas être 0');
      const k = 1 / (4 * Math.PI * E0V), dentro = rr < R, Qint = dentro ? Q * (rr / R) ** 3 : Q, Phi = Qint / E0V;
      const Ef = (x) => (x < R ? (k * Q * x) / R ** 3 : (k * Q) / x ** 2), E = Ef(rr);
      const pasos = [
        { t: 'Loi de Gauss', html: `$∮ E·dS = Q_{enc}/ε_0$, avec $ε_0 = 8,854·10^{−12} "F/m"$` },
        { t: 'Charge renfermée', html: dentro ? `La surface ($r = ${fm(rr)} "m"$) est à l'intérieur de la sphère ($R = ${fm(R)} "m"$) : elle ne renferme que la fraction $(r/R)^3$ de la charge. $Q_{enc} = Q (r/R)^3 = ${fm(Qint)} "C"$` : `La surface ($r = ${fm(rr)} "m"$) renferme toute la sphère ($R = ${fm(R)} "m"$) : $Q_{enc} = Q = ${fm(Q)} "C"$` },
        { t: 'Flux', html: `$Φ_E = Q_{enc}/ε_0 = {${fm(Qint)}}/{8,854·10^{−12}} = ${fm(Phi)} "V·m"$` },
        { t: 'Champ sur la surface', html: `Par symétrie, E est radial et constant sur la sphère de rayon $r$, donc $E·4π r^2 = Φ_E$ et $E = Φ_E/{4π r^2} = ${fm(E)} "V/m"$` + (dentro ? `, c'est-à-dire $E = {Q r}/{4π ε_0 R^3}$` : `, c'est-à-dire $E = Q/{4π ε_0 r^2}$`) },
      ];
      r = { Q, R, r: rr, dentro, Qint, Phi, E, pasos, grafica: { xl: 'r (m)', yl: 'E (V/m)', series: [{ n: 'E(r)', c: '--e', pts: lineas(0, 3 * Math.max(R, rr), (x) => Math.abs(Ef(x))) }], marca: rr } };
    } else if (modo === 'gaussmag') {
      const B = [lee(sc, 'Bx', 'la composante x de B', 'cualquiera'), lee(sc, 'By', 'la composante y de B', 'cualquiera'), lee(sc, 'Bz', 'la composante z de B', 'cualquiera')], L = lee(sc, 'L', 'le côté du cube');
      if (!B.some((b) => b !== 0)) throw new Error('B ne peut pas être nul sur toutes ses composantes');
      const A = L * L, caras = [];
      ['x', 'y', 'z'].forEach((e, i) => { caras.push({ n: `+${e}`, v: B[i] * A }); caras.push({ n: `−${e}`, v: -B[i] * A }); });
      const total = caras.reduce((s, c) => s + c.v, 0);
      const pasos = [
        { t: 'Loi de Gauss pour B', html: `$∮ B·dS = 0$ : il n'y a pas de charges magnétiques, donc les lignes de B ne naissent ni ne meurent nulle part et tout ce qui entre dans une surface fermée en ressort.` },
        { t: 'Aire de chaque face', html: `$A = L^2 = (${fm(L)})^2 = ${fm(A)} "m"^2$` },
        { t: 'Flux à travers chaque face', html: `Avec la normale vers l'extérieur, sur la face $+x$ on a $Φ = B_x A = ${fm(B[0] * A)} "Wb"$ et sur la face opposée, $−x$, la normale change de signe : $Φ = −B_x A = ${fm(-B[0] * A)} "Wb"$. De même pour y et z : $±B_y A = ±${fm(Math.abs(B[1] * A))} "Wb"$ et $±B_z A = ±${fm(Math.abs(B[2] * A))} "Wb"$.` },
        { t: 'Flux total', html: `$Φ_B = Σ Φ_{faces} = 0$ : ce qui entre par une face sort par la face opposée.` },
        { t: 'Forme différentielle', html: `En appliquant le théorème de la divergence à un tout petit cube, $∇·B = {∂B_x}/{∂x} + {∂B_y}/{∂y} + {∂B_z}/{∂z} = 0$. Dans un champ uniforme, les trois dérivées sont nulles, et aussi dans celui d'un aimant ou d'un courant.` },
      ];
      r = { B, L, A, caras, total, pasos, grafica: { barras: caras.map((c) => ({ n: c.n, v: c.v })), yl: 'Φ (Wb)' } };
    } else if (modo === 'faraday') {
      const B0 = lee(sc, 'B0', 'l\'amplitude du champ') * 1e-3, fr = lee(sc, 'fr', 'la fréquence'), A = lee(sc, 'A', 'l\'aire') * 1e-4, N = lee(sc, 'N', 'le nombre de spires');
      if (!Number.isInteger(N)) throw new Error('Le nombre de spires doit être entier');
      const w = 2 * Math.PI * fr, Phi0 = N * B0 * A, emax = Phi0 * w, T = 1 / fr;
      const pasos = [
        { t: 'Loi de Faraday', html: `$ε = −{dΦ}/{dt}$ avec $Φ = N ∫ B·dS$ (flux total des $N$ spires)` },
        { t: 'Flux', html: `Avec $B(t) = B_0 sin ωt$ perpendiculaire à la bobine, $Φ(t) = N B_0 A sin ωt$. Son amplitude est $N B_0 A = ${N} · ${fm(B0)} · ${fm(A)} = ${fm(Phi0)} "Wb"$` },
        { t: 'Pulsation', html: `$ω = 2π f = 2π · ${fm(fr)} = ${fm(w)} "rad/s"$` },
        { t: 'Force électromotrice', html: `$ε(t) = −{dΦ}/{dt} = −N B_0 A ω cos ωt$, d'amplitude $ε_{max} = Φ_0 ω = ${fm(Phi0)} · ${fm(w)} = ${fm(emax)} "V"$` },
        { t: 'Valeur efficace', html: `$ε_{eff} = ε_{max}/√2 = ${fm(emax / Math.SQRT2)} "V"$. La f.é.m. est déphasée de 90° par rapport au flux : elle est maximale quand le flux passe par zéro, c'est-à-dire quand il varie le plus vite.` },
        { t: 'Forme différentielle', html: `Par Stokes, $∮ E·dl = −{dΦ}/{dt}$ équivaut à $∇ × E = −{∂B}/{∂t}$ : un champ magnétique qui varie crée un champ électrique avec circulation.` },
      ];
      const nt = (t) => Math.sin(w * t), ne = (t) => -Math.cos(w * t);
      r = { B0, fr, A, N, w, Phi0, emax, T, pasos, grafica: { xl: 't (s)', yl: 'relatif au maximum', series: [{ n: `Φ (max. ${f(Phi0)} Wb)`, c: '--b', pts: lineas(0, 2 * T, nt, 200) }, { n: `ε (max. ${f(emax)} V)`, c: '--e', pts: lineas(0, 2 * T, ne, 200) }] } };
    } else if (modo === 'ampere') {
      const I = lee(sc, 'I', 'le courant'), R = lee(sc, 'R', 'le rayon des armatures') * 1e-2, rr = lee(sc, 'r', 'la distance à l\'axe') * 1e-2;
      const dEdt = I / (E0V * Math.PI * R ** 2), dentro = rr < R, Id = dentro ? I * (rr / R) ** 2 : I, B = (MU0 * Id) / (2 * Math.PI * rr);
      const Bf = (x) => (x < R ? (MU0 * I * x) / (2 * Math.PI * R ** 2) : (MU0 * I) / (2 * Math.PI * x));
      const pasos = [
        { t: 'Loi d\'Ampère–Maxwell', html: `$∮ B·dl = μ_0 (I_{enc} + ε_0 {dΦ_E}/{dt})$ : le second terme est le courant de déplacement $I_d$.` },
        { t: 'Champ entre les armatures', html: `Entre les armatures, le champ est uniforme, $E = σ/ε_0 = Q/{ε_0 π R^2}$, et il croît à mesure que la charge arrive : $dE/dt = I/{ε_0 π R^2} = ${fm(I)}/{8,854·10^{−12}·π·(${fm(R)})^2} = ${fm(dEdt)} "V/(m·s)"$` },
        { t: 'Courant de déplacement enlacé', html: dentro ? `Un cercle de rayon $r = ${fm(rr)} "m"$ (entre les armatures) enlace la fraction $r^2/R^2$ du flux : $I_d = ε_0 π r^2 dE/dt = I r^2/R^2 = ${fm(Id)} "A"$` : `Un cercle de rayon $r = ${fm(rr)} "m"$ (en dehors des armatures) enlace tout le champ : $I_d = ε_0 π R^2 dE/dt = I = ${fm(Id)} "A"$. C'est le même courant que celui qui arrive par le fil : la loi d'Ampère sans $I_d$ ne serait pas vérifiée.` },
        { t: 'Champ magnétique', html: `Par symétrie, B est tangent au cercle : $B · 2π r = μ_0 I_d$, donc $B = {μ_0 I_d}/{2π r} = ${fm(B)} "T"$` + (dentro ? `, soit $B = {μ_0 I r}/{2π R^2}$` : `, soit $B = {μ_0 I}/{2π r}$, comme celui d'un fil`) },
        { t: 'Forme différentielle', html: `Par Stokes : $∇ × B = μ_0 J + μ_0 ε_0 {∂E}/{∂t}$. Maxwell a ajouté le dernier terme ; avec lui, les équations prédisent des ondes.` },
      ];
      r = { I, R, r: rr, dEdt, dentro, Id, B, pasos, grafica: { xl: 'r (m)', yl: 'B (T)', series: [{ n: 'B(r)', c: '--b', pts: lineas(0, 3 * Math.max(R, rr), Bf) }], marca: rr } };
    } else if (modo === 'continuidad') {
      const sigma = lee(sc, 'sigma', 'la conductivité'), er = lee(sc, 'er', 'la permittivité relative'), rho0 = lee(sc, 'rho0', 'la densité de charge initiale', 'cualquiera') * 1e-6;
      if (er < 1) throw new Error('La permittivité relative doit être au moins égale à 1');
      if (rho0 === 0) throw new Error('La densité de charge initiale ne peut pas être 0');
      const t = vacio(sc.t) ? null : lee(sc, 't', 'l\'instant', 'no0'), fr = vacio(sc.fr) ? null : lee(sc, 'fr', 'la fréquence');
      const eps = er * E0V, tau = eps / sigma, rho = (x) => rho0 * Math.exp(-x / tau), Q = (x) => rho(x) / rho0;
      const t1 = tau * Math.log(100), th = tau * Math.LN2, rt = t === null ? null : rho(t), ratio = fr === null ? null : sigma / (2 * Math.PI * fr * eps);
      const pasos = [
        { t: 'Équation de continuité', html: `La charge ne se crée ni ne se détruit : $∇·J + {∂ρ}/{∂t} = 0$. Elle découle de la divergence d'Ampère–Maxwell, $∇·(∇ × B) = 0 = μ_0 ∇·J + μ_0 ε_0 {∂(∇·E)}/{∂t}$, et de l'utilisation de Gauss, $∇·E = ρ/ε_0$.` },
        { t: 'Loi d\'Ohm et Gauss', html: `Dans un milieu ohmique, $J = σ E$, et avec Gauss dans le matériau, $∇·E = ρ/ε$, avec $ε = ε_r ε_0 = ${fm(er)} · 8,854·10^{−12} = ${fm(eps)} "F/m"$. Donc $∇·J = σ ρ/ε$.` },
        { t: 'Équation de relaxation', html: `$σ/ε ρ + {∂ρ}/{∂t} = 0$ ⇒ $ρ(t) = ρ_0 e^{−t/τ}$, avec la constante de relaxation $τ = ε/σ = {${fm(eps)}}/{${fm(sigma)}} = ${fm(tau)} "s"$.` },
        { t: 'Temps caractéristiques', html: `À $t = τ$, il reste 36,8 % de la charge ; la moitié à $τ ln 2 = ${fm(th)} "s"$ ; et 1 % à $τ ln 100 = ${fm(t1)} "s"$. ${tau < 1e-12 ? 'Dans un bon conducteur, elle est si courte que la charge libre rejoint la surface de façon pratiquement instantanée.' : tau > 1e-3 ? 'Dans un bon isolant, la charge met très longtemps à s\'évacuer.' : ''}` },
      ];
      if (t !== null) pasos.push({ t: `À t = ${f(t)} s`, html: `$ρ = ρ_0 e^{−t/τ}$ = ${fm(rho0)} · e^{−${fm(t / tau)}} = <b>${fm(rt)} "C/m"^3</b>, soit ${fm(100 * Math.exp(-t / tau))} % de la valeur initiale. La charge évacuée, ${fm(100 * (1 - Math.exp(-t / tau)))} %, est sortie par la surface sous forme de courant de conduction.` });
      if (ratio !== null) pasos.push({ t: 'Conducteur ou diélectrique à cette fréquence ?', html: `$σ/(ω ε) = ${fm(sigma)}/(2π · ${fm(fr)} · ${fm(eps)}) = ${fm(ratio)}$ ($= 1/(ω τ)$): ${ratio > 10 ? 'le courant de conduction domine sur le courant de déplacement : il se comporte comme un bon conducteur' : ratio < 0.1 ? 'le courant de déplacement domine : il se comporte comme un diélectrique' : 'les deux courants sont comparables'}.` });
      const T = 5 * tau;
      r = { sigma, er, eps, rho0, tau, t, rt, th, t1, ratio, pasos, grafica: { xl: 't (s)', yl: 'ρ/ρ₀', series: [{ n: 'ρ(t)/ρ₀', c: '--e', pts: lineas(0, T, Q, 200) }], ...(t !== null && t <= T ? { marca: t } : {}) } };
    } else {
      const E0 = lee(sc, 'E0', 'l\'amplitude de E'), fr = lee(sc, 'fr', 'la fréquence');
      const B0 = E0 / C, lam = C / fr, I = (E0 * E0) / (2 * MU0 * C), u = (E0V * E0 * E0) / 2, eta = MU0 * C;
      const pasos = [
        { t: 'Vitesse des ondes', html: `En combinant les équations de Faraday et d'Ampère–Maxwell dans le vide, on obtient $∇^2 E = μ_0 ε_0 {∂^2 E}/{∂t^2}$, une équation d'onde avec $c = 1/√{μ_0 ε_0} = 1/√{${fm(MU0)} · ${fm(E0V)}} = ${fm(C)} "m/s"$` },
        { t: 'Amplitude de B', html: `Faraday donne $E_0 = c B_0$, donc $B_0 = E_0/c = ${fm(E0)}/${fm(C)} = ${fm(B0)} "T"$` },
        { t: 'Longueur d\'onde', html: `$λ = c/f = ${fm(C)}/${fm(fr)} = ${fm(lam)} "m"$` },
        { t: 'Intensité', html: `$I = ⟨S⟩ = {E_0^2}/{2 μ_0 c} = {(${fm(E0)})^2}/{2 · ${fm(MU0)} · ${fm(C)}} = ${fm(I)} "W/m"^2$, avec l'impédance du vide $η = μ_0 c = ${fm(eta)} "Ω"$` },
        { t: 'Énergie stockée', html: `La densité moyenne d'énergie est $u = 1/2 ε_0 E_0^2 = ${fm(u)} "J/m"^3$, moitié électrique et moitié magnétique ; l'onde la transporte à la vitesse $c$ ($I = u c$).` },
      ];
      const k = (2 * Math.PI) / lam;
      r = { E0, fr, B0, lam, I, u, eta, c: C, pasos, grafica: { xl: 'z (m)', yl: 'relatif à l\'amplitude', series: [{ n: `E (${f(E0)} V/m)`, c: '--e', pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }, { n: `B (${f(B0)} T)`, c: '--b', d: 1, pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }] } };
    }
    return { modo, ...r };
  }

  const ejemplos = [
    { clave: 'esfera-fuera', nombre: 'Gauss : sphère chargée, vue de l\'extérieur', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,3' } },
    { clave: 'esfera-dentro', nombre: 'Gauss : sphère chargée, vue de l\'intérieur', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,05' } },
    { clave: 'cubo', nombre: 'Gauss pour B : un cube dans un champ uniforme', sc: { modo: 'gaussmag', Bx: '0,2', By: '-0,1', Bz: '0,3', L: '0,5' } },
    { clave: 'bobina', nombre: 'Faraday : bobine de 200 spires à 50 Hz', sc: { modo: 'faraday', B0: '100', fr: '50', A: '20', N: '200' } },
    { clave: 'condensador-dentro', nombre: 'Ampère–Maxwell : à l\'intérieur d\'un condensateur', sc: { modo: 'ampere', I: '2', R: '5', r: '2' } },
    { clave: 'condensador-fuera', nombre: 'Ampère–Maxwell : à l\'extérieur d\'un condensateur', sc: { modo: 'ampere', I: '2', R: '5', r: '10' } },
    { clave: 'fm', nombre: 'Onde : émetteur FM à 100 MHz', sc: { modo: 'onda', E0: '1', fr: '1e8' } },
    { clave: 'relajacion-agua', nombre: 'Continuité : relaxation de la charge dans l\'eau distillée', sc: { modo: 'continuidad', sigma: '5,5e-6', er: '80', rho0: '10', t: '2e-4', fr: '1e3' } },
    { clave: 'relajacion-cobre', nombre: 'Continuité : relaxation de la charge dans le cuivre', sc: { modo: 'continuidad', sigma: '5,96e7', er: '1', rho0: '1', t: '', fr: '1e9' } },
    { clave: 'campo-onda', nombre: 'Champ : onde plane dans le vide (tout est vérifié)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/299792458', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-mal', nombre: 'Champ : onde avec un B trop grand (Faraday échoue)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/100000000', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-coulomb', nombre: 'Champ : charge ponctuelle (∇·E = 0 hors de l\'origine)', sc: { modo: 'campo', Ex: '9 x/(x^2+y^2+z^2)^(3/2)', Ey: '9 y/(x^2+y^2+z^2)^(3/2)', Ez: '9 z/(x^2+y^2+z^2)^(3/2)', Bx: '0', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-uniforme', nombre: 'Champ : E linéaire sans charges (Gauss échoue)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '', By: '', Bz: '', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-rho', nombre: 'Champ : E = 5x avec ρ = 5ε₀ (Gauss vérifié)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '0', By: '0', Bz: '0', rho: '4.4270939064*10^(-11)', Jx: '', Jy: '', Jz: '' } },
  ];

  return { resolver, ejemplos, campos, nombres, f, constantes: { E0V, MU0, C } };
})();

