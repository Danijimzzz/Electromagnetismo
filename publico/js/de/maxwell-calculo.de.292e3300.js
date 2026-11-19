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
    if (vacio(sc[k])) throw new Error(`${nom} fehlt`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (signo === 'pos' && v <= 0) throw new Error(`${may(nom)} muss größer als 0 sein`);
    if (signo === 'no0' && v < 0) throw new Error(`${may(nom)} darf nicht negativ sein`);
    return v;
  }

  const campos = {
    gauss: [['Q', 'Gesamtladung Q', 'nC'], ['R', 'Radius der geladenen Kugel R', 'm'], ['r', 'Radius der Gaußschen Fläche r', 'm']],
    gaussmag: [['Bx', 'Feld B in x', 'T'], ['By', 'Feld B in y', 'T'], ['Bz', 'Feld B in z', 'T'], ['L', 'Würfelkante L', 'm']],
    faraday: [['B0', 'Feldamplitude B₀', 'mT'], ['fr', 'Frequenz f', 'Hz'], ['A', 'Fläche jeder Windung A', 'cm²'], ['N', 'Windungszahl N', '']],
    ampere: [['I', 'Strom I, der den Kondensator lädt', 'A'], ['R', 'Plattenradius R', 'cm'], ['r', 'Abstand zur Achse r', 'cm']],
    onda: [['E0', 'Amplitude des elektrischen Feldes E₀', 'V/m'], ['fr', 'Frequenz f', 'Hz']],
    continuidad: [['sigma', 'Leitfähigkeit σ', 'S/m'], ['er', 'Relative Permittivität ε<sub>r</sub>', ''], ['rho0', 'Anfängliche Ladungsdichte ρ₀', 'µC/m³'], ['t', 'Zeitpunkt t (leer = nur τ)', 's'], ['fr', 'Frequenz f für σ/ωε (leer = nein)', 'Hz']],
    campo: [['Ex', 'Feld E, x-Komponente', 'V/m'], ['Ey', 'Feld E, y-Komponente', 'V/m'], ['Ez', 'Feld E, z-Komponente', 'V/m'], ['Bx', 'Feld B, x-Komponente (leer = unbekannt)', 'T'], ['By', 'Feld B, y-Komponente', 'T'], ['Bz', 'Feld B, z-Komponente', 'T'], ['rho', 'Ladungsdichte ρ (leer = 0)', 'C/m³'], ['Jx', 'Strom J, x-Komponente (leer = 0)', 'A/m²'], ['Jy', 'Strom J, y-Komponente', 'A/m²'], ['Jz', 'Strom J, z-Komponente', 'A/m²']],
  };
  const nombres = { gauss: 'Gauß für E', gaussmag: 'Gauß für B', faraday: 'Faraday', ampere: 'Ampère–Maxwell', onda: 'Die elektromagnetische Welle', continuidad: 'Kontinuität: Ladungsrelaxation', campo: 'Erfüllt dieses Feld die Gleichungen?' };

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
    if (!n || malos * 2 > n + malos) throw new Error('Das Feld lässt sich in den Testpunkten nicht auswerten (Division durch null oder fehlende Variable?)');
    return { abs: r, rel: esc2 > 0 ? r / esc2 : 0, escala: esc2 };
  }
  function resolverCampo(sc) {
    const E = ['Ex', 'Ey', 'Ez'].map((k) => lc(sc[k], `E${k[1]}`) || CERO), Bv = ['Bx', 'By', 'Bz'].map((k) => lc(sc[k], `B${k[1]}`)), conB = Bv.some(Boolean), B = Bv.map((b) => b || CERO);
    if (E.every((e) => e === CERO)) throw new Error('Gib mindestens eine Komponente von E ein');
    const rho = lc(sc.rho, 'ρ') || CERO, J = ['Jx', 'Jy', 'Jz'].map((k) => lc(sc[k], `J${k[1]}`) || CERO);
    for (const [n, nom] of [...E.map((e, i) => [e, 'E' + 'xyz'[i]]), ...B.map((b, i) => [b, 'B' + 'xyz'[i]]), ...J.map((j, i) => [j, 'J' + 'xyz'[i]]), [rho, 'ρ']]) if (PUNTOS.filter((P) => !isFinite(val(n, P))).length * 2 >= PUNTOS.length) throw new Error(`${nom} lässt sich in den Testpunkten nicht auswerten (Division durch null?)`);
    const V = ['x', 'y', 'z'], rot = (F) => [rest(dv(F[2], 'y'), dv(F[1], 'z')), rest(dv(F[0], 'z'), dv(F[2], 'x')), rest(dv(F[1], 'x'), dv(F[0], 'y'))];
    const div = (F) => suma(dv(F[0], 'x'), dv(F[1], 'y'), dv(F[2], 'z'));
    const divE = div(E), rotE = rot(E), dBdt = B.map((b) => dv(b, 't')), dEdt = E.map((e) => dv(e, 't'));
    const eqs = [];
    eqs.push({ n: 'Gauß für E', f: '∇·E = ρ/ε₀', ...residuo([por(E0V, divE)], [rho]), t: `$∇·E = ${tx(divE)}$`, extra: `Erforderliche ρ = ε₀∇·E = ${tx(por(E0V, divE))}` });
    let divB = null;
    if (conB) { divB = div(B); eqs.push({ n: 'Gauß für B', f: '∇·B = 0', ...residuo([divB], [CERO]), t: `$∇·B = ${tx(divB)}$` }); }
    if (conB) eqs.push({ n: 'Faraday', f: '∇×E = −∂B/∂t', ...residuo(rotE, dBdt.map(neg)), t: `$∇×E = (${rotE.map(tx).join(', ')})$ y $−∂B/∂t = (${dBdt.map((d) => tx(neg(d))).join(', ')})$` });
    let rotB = null;
    if (conB) { rotB = rot(B); eqs.push({ n: 'Ampère–Maxwell', f: '∇×B = μ₀J + μ₀ε₀ ∂E/∂t', ...residuo(rotB.map((b) => por(1 / MU0, b)), J.map((j, i) => suma(j, por(E0V, dEdt[i])))), t: `$∇×B = (${rotB.map(tx).join(', ')})$` }); }
    for (const q of eqs) q.ok = q.rel <= 1e-6;
    const fallan = eqs.filter((q) => !q.ok), pasos = [];
    pasos.push({ t: 'Ansatz', html: `Jede Maxwell-Gleichung wird mit den exakten partiellen Ableitungen dessen geprüft, was du eingegeben hast (Variablen $x$, $y$, $z$, $t$ in m und s). Dann wird die Differenz zwischen beiden Seiten in ${PUNTOS.length} Testpunkten ausgewertet und akzeptiert, wenn sie kleiner als $10^{−6}$ der Größe der Terme ist.` });
    pasos.push({ t: 'Divergenz von E', html: `$∇·E = {∂E_x}/{∂x} + {∂E_y}/{∂y} + {∂E_z}/{∂z} = ${tx(divE)}$. Gauß verlangt $∇·E = ρ/ε_0$:` + (eqs[0].ok ? `ist mit ρ = ${tx(rho)} erfüllt.` : `ist mit ρ = ${tx(rho)} nicht erfüllt; erforderlich wäre $ρ = ε_0 ∇·E = ${tx(por(E0V, divE))}$ (relative Differenz ${f(eqs[0].rel)}).`) });
    if (conB) {
      pasos.push({ t: 'Divergenz von B', html: `$∇·B = ${tx(divB)}$. Gauß für B verlangt, dass sie 0 ist:` + (eqs[1].ok ? 'stimmt.' : `ist nicht erfüllt (relative Differenz ${f(eqs[1].rel)}): Ein solches B-Feld würde einen magnetischen Monopol bedeuten.`) });
      pasos.push({ t: 'Rotation von E', html: `$∇×E = (${rotE.map(tx).join(', ')})$ und $−{∂B}/{∂t} = (${dBdt.map((d) => tx(neg(d))).join(', ')})$. Faraday:` + (eqs[2].ok ? 'coinciden.' : `stimmen nicht überein (relative Abweichung ${f(eqs[2].rel)}).`) });
      pasos.push({ t: 'Rotation von B', html: `$∇×B = (${rotB.map(tx).join(', ')})$ und $μ_0 J + μ_0 ε_0 {∂E}/{∂t} = μ_0 (${J.map((j, i) => tx(suma(j, por(E0V, dEdt[i])))).join(', ')})$. Ampère–Maxwell:` + (eqs[3].ok ? 'coinciden.' : `stimmen nicht überein (relative Abweichung ${f(eqs[3].rel)}).`) });
    } else {
      pasos.push({ t: 'Was B ist', html: `Nur mit E liefert Faraday $∂B/∂t = −∇×E = (${rotE.map((r2) => tx(neg(r2))).join(', ')})$. Durch Integration über $t$ (plus ein beliebiges statisches Feld) ergibt sich B; gib es in die B-Felder ein, um Gauß für B und Ampère–Maxwell zu prüfen.` });
    }
    pasos.push({ t: 'Fazit', html: conB ? (fallan.length ? `Das Feld erfüllt <b>nicht</b>: ${fallan.map((q) => q.n).join(', ')}. Es kann mit diesen Quellen kein elektromagnetisches Feld sein.` : 'Erfüllt alle vier Gleichungen: Es ist ein mögliches elektromagnetisches Feld mit diesen Quellen.') : (eqs[0].ok ? 'Erfüllt Gauß für E; gib das B-Feld ein, um fortzufahren.' : 'Erfüllt Gauß für E mit dieser ρ nicht.') });
    const ok = conB && !fallan.length;
    return { modo: 'campo', eqs, conB, ok, fallan, divE: tx(divE), rotE: rotE.map(tx), dBdt: dBdt.map((d) => tx(neg(d))), pasos, grafica: { barras: eqs.map((q) => ({ n: q.n, v: q.rel })), yl: 'relative Differenz zwischen beiden Seiten', cero: true } };
  }

  function resolver(sc) {
    const modo = sc.modo || 'gauss';
    if (modo === 'campo') return resolverCampo(sc);
    if (!campos[modo]) throw new Error('Diese Gleichung existiert nicht');
    let r;
    if (modo === 'gauss') {
      const Q = lee(sc, 'Q', 'die Ladung', 'cualquiera') * 1e-9, R = lee(sc, 'R', 'der Kugelradius'), rr = lee(sc, 'r', 'der Radius der Fläche');
      if (Q === 0) throw new Error('Die Ladung darf nicht 0 sein');
      const k = 1 / (4 * Math.PI * E0V), dentro = rr < R, Qint = dentro ? Q * (rr / R) ** 3 : Q, Phi = Qint / E0V;
      const Ef = (x) => (x < R ? (k * Q * x) / R ** 3 : (k * Q) / x ** 2), E = Ef(rr);
      const pasos = [
        { t: 'Gaußsches Gesetz', html: `$∮ E·dS = Q_{enc}/ε_0$, mit $ε_0 = 8,854·10^{−12} "F/m"$` },
        { t: 'Eingeschlossene Ladung', html: dentro ? `Die Fläche ($r = ${fm(rr)} "m"$) liegt innerhalb der Kugel ($R = ${fm(R)} "m"$): Sie schließt nur den Anteil $(r/R)^3$ der Ladung ein. $Q_{enc} = Q (r/R)^3 = ${fm(Qint)} "C"$` : `Die Fläche ($r = ${fm(rr)} "m"$) umschließt die gesamte Kugel ($R = ${fm(R)} "m"$): $Q_{enc} = Q = ${fm(Q)} "C"$` },
        { t: 'Fluss', html: `$Φ_E = Q_{enc}/ε_0 = {${fm(Qint)}}/{8,854·10^{−12}} = ${fm(Phi)} "V·m"$` },
        { t: 'Feld auf der Fläche', html: `Aus Symmetriegründen ist E radial und auf der Kugel mit Radius $r$ konstant, also $E·4π r^2 = Φ_E$ und $E = Φ_E/{4π r^2} = ${fm(E)} "V/m"$` + (dentro ? `, also $E = {Q r}/{4π ε_0 R^3}$` : `, also $E = Q/{4π ε_0 r^2}$`) },
      ];
      r = { Q, R, r: rr, dentro, Qint, Phi, E, pasos, grafica: { xl: 'r (m)', yl: 'E (V/m)', series: [{ n: 'E(r)', c: '--e', pts: lineas(0, 3 * Math.max(R, rr), (x) => Math.abs(Ef(x))) }], marca: rr } };
    } else if (modo === 'gaussmag') {
      const B = [lee(sc, 'Bx', 'die x-Komponente von B', 'cualquiera'), lee(sc, 'By', 'die y-Komponente von B', 'cualquiera'), lee(sc, 'Bz', 'die z-Komponente von B', 'cualquiera')], L = lee(sc, 'L', 'die Würfelkante');
      if (!B.some((b) => b !== 0)) throw new Error('B darf nicht in allen Komponenten null sein');
      const A = L * L, caras = [];
      ['x', 'y', 'z'].forEach((e, i) => { caras.push({ n: `+${e}`, v: B[i] * A }); caras.push({ n: `−${e}`, v: -B[i] * A }); });
      const total = caras.reduce((s, c) => s + c.v, 0);
      const pasos = [
        { t: 'Gaußsches Gesetz für B', html: `$∮ B·dS = 0$: Es gibt keine magnetischen Ladungen, die B-Linien beginnen und enden also nirgends, und alles, was in eine geschlossene Fläche eintritt, tritt wieder aus.` },
        { t: 'Fläche jeder Seite', html: `$A = L^2 = (${fm(L)})^2 = ${fm(A)} "m"^2$` },
        { t: 'Fluss durch jede Seite', html: `Bei nach außen gerichteter Normale ist er auf der Seite $+x$ gleich $Φ = B_x A = ${fm(B[0] * A)} "Wb"$, und auf der gegenüberliegenden Seite $−x$ wechselt die Normale das Vorzeichen: $Φ = −B_x A = ${fm(-B[0] * A)} "Wb"$. Genauso für y und z: $±B_y A = ±${fm(Math.abs(B[1] * A))} "Wb"$ und $±B_z A = ±${fm(Math.abs(B[2] * A))} "Wb"$.` },
        { t: 'Gesamtfluss', html: `$Φ_B = Σ Φ_{Seiten} = 0$: Was durch eine Seite eintritt, tritt durch die gegenüberliegende aus.` },
        { t: 'Differentialform', html: `Wendet man den Divergenzsatz auf einen sehr kleinen Würfel an, gilt $∇·B = {∂B_x}/{∂x} + {∂B_y}/{∂y} + {∂B_z}/{∂z} = 0$. In einem homogenen Feld sind alle drei Ableitungen 0, ebenso im Feld eines Magneten oder eines Stroms.` },
      ];
      r = { B, L, A, caras, total, pasos, grafica: { barras: caras.map((c) => ({ n: c.n, v: c.v })), yl: 'Φ (Wb)' } };
    } else if (modo === 'faraday') {
      const B0 = lee(sc, 'B0', 'die Feldamplitude') * 1e-3, fr = lee(sc, 'fr', 'die Frequenz'), A = lee(sc, 'A', 'die Fläche') * 1e-4, N = lee(sc, 'N', 'die Windungszahl');
      if (!Number.isInteger(N)) throw new Error('Die Windungszahl muss ganzzahlig sein');
      const w = 2 * Math.PI * fr, Phi0 = N * B0 * A, emax = Phi0 * w, T = 1 / fr;
      const pasos = [
        { t: 'Faradaysches Gesetz', html: `$ε = −{dΦ}/{dt}$ mit $Φ = N ∫ B·dS$ (Flussverkettung der $N$ Windungen)` },
        { t: 'Fluss', html: `Mit $B(t) = B_0 sin ωt$ senkrecht zur Spule gilt $Φ(t) = N B_0 A sin ωt$. Ihre Amplitude ist $N B_0 A = ${N} · ${fm(B0)} · ${fm(A)} = ${fm(Phi0)} "Wb"$` },
        { t: 'Kreisfrequenz', html: `$ω = 2π f = 2π · ${fm(fr)} = ${fm(w)} "rad/s"$` },
        { t: 'Elektromotorische Kraft', html: `$ε(t) = −{dΦ}/{dt} = −N B_0 A ω cos ωt$, mit der Amplitude $ε_{max} = Φ_0 ω = ${fm(Phi0)} · ${fm(w)} = ${fm(emax)} "V"$` },
        { t: 'Effektivwert', html: `$ε_{eff} = ε_{max}/√2 = ${fm(emax / Math.SQRT2)} "V"$. Die EMK ist gegenüber dem Fluss um 90° phasenverschoben: Sie ist maximal, wenn der Fluss durch null geht, also wenn er sich am schnellsten ändert.` },
        { t: 'Differentialform', html: `Nach Stokes ist $∮ E·dl = −{dΦ}/{dt}$ äquivalent zu $∇ × E = −{∂B}/{∂t}$: Ein sich änderndes Magnetfeld erzeugt ein elektrisches Feld mit Zirkulation.` },
      ];
      const nt = (t) => Math.sin(w * t), ne = (t) => -Math.cos(w * t);
      r = { B0, fr, A, N, w, Phi0, emax, T, pasos, grafica: { xl: 't (s)', yl: 'bezogen auf das Maximum', series: [{ n: `Φ (max. ${f(Phi0)} Wb)`, c: '--b', pts: lineas(0, 2 * T, nt, 200) }, { n: `ε (max. ${f(emax)} V)`, c: '--e', pts: lineas(0, 2 * T, ne, 200) }] } };
    } else if (modo === 'ampere') {
      const I = lee(sc, 'I', 'der Strom'), R = lee(sc, 'R', 'der Plattenradius') * 1e-2, rr = lee(sc, 'r', 'der Abstand zur Achse') * 1e-2;
      const dEdt = I / (E0V * Math.PI * R ** 2), dentro = rr < R, Id = dentro ? I * (rr / R) ** 2 : I, B = (MU0 * Id) / (2 * Math.PI * rr);
      const Bf = (x) => (x < R ? (MU0 * I * x) / (2 * Math.PI * R ** 2) : (MU0 * I) / (2 * Math.PI * x));
      const pasos = [
        { t: 'Ampère-Maxwell-Gesetz', html: `$∮ B·dl = μ_0 (I_{enc} + ε_0 {dΦ_E}/{dt})$: Der zweite Summand ist der Verschiebungsstrom $I_d$.` },
        { t: 'Feld zwischen den Platten', html: `Zwischen den Platten ist das Feld homogen, $E = σ/ε_0 = Q/{ε_0 π R^2}$, und wächst, während Ladung zufließt: $dE/dt = I/{ε_0 π R^2} = ${fm(I)}/{8,854·10^{−12}·π·(${fm(R)})^2} = ${fm(dEdt)} "V/(m·s)"$` },
        { t: 'Eingeschlossener Verschiebungsstrom', html: dentro ? `Ein Kreis mit Radius $r = ${fm(rr)} "m"$ (innerhalb der Platten) umfasst den Anteil $r^2/R^2$ des Flusses: $I_d = ε_0 π r^2 dE/dt = I r^2/R^2 = ${fm(Id)} "A"$` : `Ein Kreis mit Radius $r = ${fm(rr)} "m"$ (außerhalb der Platten) umfasst das gesamte Feld: $I_d = ε_0 π R^2 dE/dt = I = ${fm(Id)} "A"$. Das ist derselbe Strom, der durch das Kabel kommt: Das Ampèresche Gesetz ohne $I_d$ wäre nicht erfüllt.` },
        { t: 'Magnetfeld', html: `Aus Symmetriegründen ist B tangential zum Kreis: $B · 2π r = μ_0 I_d$, also $B = {μ_0 I_d}/{2π r} = ${fm(B)} "T"$` + (dentro ? `, also $B = {μ_0 I r}/{2π R^2}$` : `, also $B = {μ_0 I}/{2π r}$, genau wie bei einem Draht`) },
        { t: 'Differentialform', html: `Nach Stokes: $∇ × B = μ_0 J + μ_0 ε_0 {∂E}/{∂t}$. Maxwell fügte den letzten Term hinzu; mit ihm sagen die Gleichungen Wellen voraus.` },
      ];
      r = { I, R, r: rr, dEdt, dentro, Id, B, pasos, grafica: { xl: 'r (m)', yl: 'B (T)', series: [{ n: 'B(r)', c: '--b', pts: lineas(0, 3 * Math.max(R, rr), Bf) }], marca: rr } };
    } else if (modo === 'continuidad') {
      const sigma = lee(sc, 'sigma', 'die Leitfähigkeit'), er = lee(sc, 'er', 'die relative Permittivität'), rho0 = lee(sc, 'rho0', 'die anfängliche Ladungsdichte', 'cualquiera') * 1e-6;
      if (er < 1) throw new Error('Die relative Permittivität muss mindestens 1 betragen');
      if (rho0 === 0) throw new Error('Die anfängliche Ladungsdichte darf nicht 0 sein');
      const t = vacio(sc.t) ? null : lee(sc, 't', 'der Zeitpunkt', 'no0'), fr = vacio(sc.fr) ? null : lee(sc, 'fr', 'die Frequenz');
      const eps = er * E0V, tau = eps / sigma, rho = (x) => rho0 * Math.exp(-x / tau), Q = (x) => rho(x) / rho0;
      const t1 = tau * Math.log(100), th = tau * Math.LN2, rt = t === null ? null : rho(t), ratio = fr === null ? null : sigma / (2 * Math.PI * fr * eps);
      const pasos = [
        { t: 'Kontinuitätsgleichung', html: `Ladung wird weder erzeugt noch vernichtet: $∇·J + {∂ρ}/{∂t} = 0$. Sie ergibt sich, wenn man die Divergenz des Ampère-Maxwell-Gesetzes bildet, $∇·(∇ × B) = 0 = μ_0 ∇·J + μ_0 ε_0 {∂(∇·E)}/{∂t}$, und das Gaußsche Gesetz $∇·E = ρ/ε_0$ verwendet.` },
        { t: 'Ohmsches und Gaußsches Gesetz', html: `In einem ohmschen Medium gilt $J = σ E$, und mit dem Gaußschen Gesetz im Material $∇·E = ρ/ε$, mit $ε = ε_r ε_0 = ${fm(er)} · 8,854·10^{−12} = ${fm(eps)} "F/m"$. Dann ist $∇·J = σ ρ/ε$.` },
        { t: 'Relaxationsgleichung', html: `$σ/ε ρ + {∂ρ}/{∂t} = 0$ ⇒ $ρ(t) = ρ_0 e^{−t/τ}$, mit der Relaxationszeitkonstante $τ = ε/σ = {${fm(eps)}}/{${fm(sigma)}} = ${fm(tau)} "s"$.` },
        { t: 'Charakteristische Zeiten', html: `Bei $t = τ$ bleiben 36,8 % der Ladung übrig; die Hälfte bei $τ ln 2 = ${fm(th)} "s"$; und 1 % bei $τ ln 100 = ${fm(t1)} "s"$. ${tau < 1e-12 ? 'In einem guten Leiter ist sie so kurz, dass die freie Ladung praktisch augenblicklich an die Oberfläche wandert.' : tau > 1e-3 ? 'In einem guten Isolator dauert es sehr lange, bis die Ladung abfließt.' : ''}` },
      ];
      if (t !== null) pasos.push({ t: `Bei t = ${f(t)} s`, html: `$ρ = ρ_0 e^{−t/τ}$ = ${fm(rho0)} · e^{−${fm(t / tau)}} = <b>${fm(rt)} "C/m"^3</b>, also ${fm(100 * Math.exp(-t / tau))} % des Anfangswerts. Die abgeflossene Ladung, ${fm(100 * (1 - Math.exp(-t / tau)))} %, ist als Leitungsstrom über die Oberfläche ausgetreten.` });
      if (ratio !== null) pasos.push({ t: 'Leiter oder Dielektrikum bei dieser Frequenz?', html: `$σ/(ω ε) = ${fm(sigma)}/(2π · ${fm(fr)} · ${fm(eps)}) = ${fm(ratio)}$ ($= 1/(ω τ)$): ${ratio > 10 ? 'der Leitungsstrom überwiegt gegenüber dem Verschiebungsstrom: Es verhält sich wie ein guter Leiter' : ratio < 0.1 ? 'der Verschiebungsstrom überwiegt: Es verhält sich wie ein Dielektrikum' : 'beide Ströme sind vergleichbar'}.` });
      const T = 5 * tau;
      r = { sigma, er, eps, rho0, tau, t, rt, th, t1, ratio, pasos, grafica: { xl: 't (s)', yl: 'ρ/ρ₀', series: [{ n: 'ρ(t)/ρ₀', c: '--e', pts: lineas(0, T, Q, 200) }], ...(t !== null && t <= T ? { marca: t } : {}) } };
    } else {
      const E0 = lee(sc, 'E0', 'die Amplitude von E'), fr = lee(sc, 'fr', 'die Frequenz');
      const B0 = E0 / C, lam = C / fr, I = (E0 * E0) / (2 * MU0 * C), u = (E0V * E0 * E0) / 2, eta = MU0 * C;
      const pasos = [
        { t: 'Wellengeschwindigkeit', html: `Kombiniert man die Gleichungen von Faraday und Ampère–Maxwell im Vakuum, erhält man $∇^2 E = μ_0 ε_0 {∂^2 E}/{∂t^2}$, eine Wellengleichung mit $c = 1/√{μ_0 ε_0} = 1/√{${fm(MU0)} · ${fm(E0V)}} = ${fm(C)} "m/s"$` },
        { t: 'Amplitude von B', html: `Faraday liefert $E_0 = c B_0$, also $B_0 = E_0/c = ${fm(E0)}/${fm(C)} = ${fm(B0)} "T"$` },
        { t: 'Wellenlänge', html: `$λ = c/f = ${fm(C)}/${fm(fr)} = ${fm(lam)} "m"$` },
        { t: 'Intensität', html: `$I = ⟨S⟩ = {E_0^2}/{2 μ_0 c} = {(${fm(E0)})^2}/{2 · ${fm(MU0)} · ${fm(C)}} = ${fm(I)} "W/m"^2$, mit der Vakuumimpedanz $η = μ_0 c = ${fm(eta)} "Ω"$` },
        { t: 'Gespeicherte Energie', html: `Die mittlere Energiedichte beträgt $u = 1/2 ε_0 E_0^2 = ${fm(u)} "J/m"^3$, je zur Hälfte elektrisch und magnetisch; die Welle transportiert sie mit der Geschwindigkeit $c$ ($I = u c$).` },
      ];
      const k = (2 * Math.PI) / lam;
      r = { E0, fr, B0, lam, I, u, eta, c: C, pasos, grafica: { xl: 'z (m)', yl: 'relativ zur Amplitude', series: [{ n: `E (${f(E0)} V/m)`, c: '--e', pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }, { n: `B (${f(B0)} T)`, c: '--b', d: 1, pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }] } };
    }
    return { modo, ...r };
  }

  const ejemplos = [
    { clave: 'esfera-fuera', nombre: 'Gauß: geladene Kugel, von außen', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,3' } },
    { clave: 'esfera-dentro', nombre: 'Gauß: geladene Kugel, von innen', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,05' } },
    { clave: 'cubo', nombre: 'Gauß für B: ein Würfel in einem homogenen Feld', sc: { modo: 'gaussmag', Bx: '0,2', By: '-0,1', Bz: '0,3', L: '0,5' } },
    { clave: 'bobina', nombre: 'Faraday: Spule mit 200 Windungen bei 50 Hz', sc: { modo: 'faraday', B0: '100', fr: '50', A: '20', N: '200' } },
    { clave: 'condensador-dentro', nombre: 'Ampère–Maxwell: im Inneren eines Kondensators', sc: { modo: 'ampere', I: '2', R: '5', r: '2' } },
    { clave: 'condensador-fuera', nombre: 'Ampère–Maxwell: außerhalb eines Kondensators', sc: { modo: 'ampere', I: '2', R: '5', r: '10' } },
    { clave: 'fm', nombre: 'Welle: UKW-Sender mit 100 MHz', sc: { modo: 'onda', E0: '1', fr: '1e8' } },
    { clave: 'relajacion-agua', nombre: 'Kontinuität: Ladungsrelaxation in destilliertem Wasser', sc: { modo: 'continuidad', sigma: '5,5e-6', er: '80', rho0: '10', t: '2e-4', fr: '1e3' } },
    { clave: 'relajacion-cobre', nombre: 'Kontinuität: Ladungsrelaxation in Kupfer', sc: { modo: 'continuidad', sigma: '5,96e7', er: '1', rho0: '1', t: '', fr: '1e9' } },
    { clave: 'campo-onda', nombre: 'Feld: ebene Welle im Vakuum (erfüllt alles)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/299792458', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-mal', nombre: 'Feld: Welle mit zu großem B (verletzt Faraday)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/100000000', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-coulomb', nombre: 'Feld: Punktladung (∇·E = 0 außerhalb des Ursprungs)', sc: { modo: 'campo', Ex: '9 x/(x^2+y^2+z^2)^(3/2)', Ey: '9 y/(x^2+y^2+z^2)^(3/2)', Ez: '9 z/(x^2+y^2+z^2)^(3/2)', Bx: '0', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-uniforme', nombre: 'Feld: lineares E ohne Ladungen (verletzt Gauß)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '', By: '', Bz: '', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-rho', nombre: 'Feld: E = 5x mit ρ = 5ε₀ (erfüllt Gauß)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '0', By: '0', Bz: '0', rho: '4.4270939064*10^(-11)', Jx: '', Jy: '', Jz: '' } },
  ];

  return { resolver, ejemplos, campos, nombres, f, constantes: { E0V, MU0, C } };
})();

