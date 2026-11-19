const RadioAmFm = (() => {
  const CLUZ = 3e8, L = 253.3e-6, C0 = 100e-12, R = 10, RDET = 1e4, CDET = 2.2e-9, FM_MHZ = 98.5;
  const ESTACIONES = [{ n: 'A', f: 855, tipo: 'AM' }, { n: 'B', f: 1000, tipo: 'AM' }, { n: 'C', f: 1215, tipo: 'AM' }];
  const f0De = (Cpf) => 1 / (2 * Math.PI * Math.sqrt(L * Cpf * 1e-12)) / 1e3;
  const Qde = (f0k) => (2 * Math.PI * f0k * 1e3 * L) / R;
  const gananciaDe = (f, f0k) => { const Q = Qde(f0k), x = f / f0k - f0k / f; return 1 / Math.sqrt(1 + Q * Q * x * x); };
  const dB = (g) => 20 * Math.log10(g);
  const cercana = (f0k) => ESTACIONES.find((e) => Math.abs(e.f - f0k) <= 3);
  const f0 = f0De(C0 * 1e12), Q0 = Qde(f0), BW0 = f0 / Q0, g9 = gananciaDe(f0 + 9, f0);
  const datos = { L, C0, R, f0, Q0, BW0, g9, g9dB: dB(g9), lamAM: CLUZ / 1e6, lamAudio: CLUZ / 1e3, lamFM: CLUZ / (FM_MHZ * 1e6), tau: RDET * CDET, ESTACIONES };

  const n = (x, d = 1) => x.toFixed(d).replace('.', ',');
  const entero = (x) => String(Math.round(x));
  const miles = (x) => entero(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const pasos = [
    { titulo: 'Toutes les stations sonnent en même temps', corto: 'Stations', dato: { valor: '530–1700 kHz', texto: 'est la bande des ondes moyennes (AM) ; la FM va de 87,5 à 108 MHz.' }, texto: 'En ce moment, dans l\'air qui vous entoure, il y a des dizaines de stations de radio, toutes en même temps, et l\'antenne de votre radio en reçoit un peu de chacune. Pourtant, vous n\'entendez que celle que vous choisissez.\n\nComment la radio en sépare-t-elle une de toutes les autres ? Chaque station utilise **sa propre fréquence**, comme une voie différente de l\'autoroute. Les stations AM sont espacées d\'environ 9 kHz dans la bande des ondes moyennes et les stations FM de 200 kHz dans leur bande. Tourner la molette du cadran, c\'est choisir la voie.' },
    { titulo: 'Le son seul ne peut pas être émis', corto: 'Porteuse', dato: { valor: '75 m', texto: 'est l\'antenne quart d\'onde pour 1 MHz ; pour le son de 1 kHz, il en faudrait 75 km.' }, texto: `Une antenne émet bien si elle mesure le quart de la longueur d'onde, $λ = c/f$. Pour un son de 1 kHz, $λ = {3·10^8}/{10^3} = 300 "km"$ : une antenne de 75 km. Impossible.\n\nLa solution consiste à **monter le son sur une onde beaucoup plus rapide**, la porteuse. À 1 MHz, la longueur d'onde est $λ = 300 "m"$ et l'antenne de 75 m est déjà une tour ordinaire. La porteuse ne transporte aucune information par elle-même : le son est caché dans une petite variation de celle-ci, et cela s'appelle moduler.` },
    { titulo: 'AM : change la hauteur de l\'onde', corto: 'AM', dato: { valor: '9 kHz', texto: 'de largeur, c\'est ce qu\'occupe une station AM : le double de la fréquence la plus haute du son (4,5 kHz).' }, texto: 'Dans la **modulation d\'amplitude**, la porteuse garde sa fréquence, mais son amplitude monte et descend en suivant le son $m(t)$ :\n\n$s(t) = A [1 + 0,6 · m(t)] cos(ω_p t)$\n\nLe contour de l\'onde (l\'enveloppe, tracée en pointillés dans l\'animation) est une copie du son. Comme le son a des fréquences allant jusqu\'à 4,5 kHz, la station occupe de $f_p − 4,5$ à $f_p + 4,5$ kHz, soit 9 kHz au total. C\'est pourquoi les stations AM sont espacées de 9 kHz. C\'est simple, mais n\'importe quel bruit (un orage, un moteur) modifie aussi l\'amplitude et s\'entend.' },
    { titulo: 'FM : change le rythme de l\'onde', corto: 'FM', dato: { valor: '±75 kHz', texto: 'est de combien la fréquence de la porteuse s\'écarte avec le son le plus fort ; chaque canal occupe 200 kHz.' }, texto: `Dans la **modulation de fréquence**, l'amplitude ne change jamais et c'est la fréquence qui monte et descend : plus rapide quand le son est positif et plus lente quand il est négatif. Les stations FM émettent à environ ${n(FM_MHZ)} MHz (longueur d'onde $λ$ = ${n(datos.lamFM, 2)} m, antenne d'environ ${entero(datos.lamFM * 25)} cm) et s'écartent de ±75 kHz.\n\nAvec l'amplitude fixe, le récepteur peut **écrêter** la hauteur de l'onde sans perdre le son, et le bruit, qui s'introduit justement dans l'amplitude, disparaît. C'est pourquoi la FM sonne propre, et elle a aussi de la place pour davantage d'aigus (jusqu'à 15 kHz) et pour la stéréo. En contrepartie, elle occupe plus de bande, environ 200 kHz par station, et ne porte que jusqu'à l'horizon.` },
    { titulo: 'Accorder : un circuit qui résonne', corto: 'Accord', dato: { valor: `f₀ = ${entero(f0)} kHz`, texto: `avec L = ${n(L * 1e6)} µH et C = 100 pF ; la bande passante n'est que de ${n(BW0)} kHz (Q = ${entero(Q0)}).` }, texto: `Le cadran de la radio déplace un condensateur variable qui, avec la bobine de l'antenne, forme un circuit RLC série. Ce circuit répond fortement à une fréquence, celle de résonance, et faiblement aux autres :\n\n$f_0 = {1}/{2π√(L C)} = {1}/{2π√(${n(L * 1e6)}·10^{−6} · 10^{−10})} = ${entero(f0)} "kHz"$\n\nSon facteur de qualité est $Q = {ω_0 L}/R$ = ${entero(Q0)} (avec R = 10 Ω de fil de la bobine) et la largeur de bande est $Δf = f_0/Q$ = **${n(BW0, 2)} kHz**. Une station voisine à 9 kHz entre avec $|H|$ = ${n(g9, 2)} (${n(datos.g9dB)} dB) : elle s'entend nettement moins, mais ne disparaît pas. C'est pourquoi les radios modernes mélangent en outre le signal avec celui d'un oscillateur pour le ramener à une fréquence fixe (455 kHz en AM, 10,7 MHz en FM) où l'on peut utiliser de bien meilleurs filtres : c'est le superhétérodyne.`, dura: 11000 },
    { titulo: 'Extraire le son : diode et condensateur', corto: 'Détecteur', dato: { valor: `${n(datos.tau * 1e6, 0)} µs`, texto: 'est le RC du détecteur : très supérieur à 1 µs de la porteuse et très inférieur à 200 µs du son de 5 kHz.' }, texto: `Une fois accordé, le signal AM reste la porteuse de 1 MHz à hauteur variable : aucun haut-parleur ne pourrait la suivre. Il faut ne garder que l'enveloppe.\n\nUne **diode** ne laisse passer que les alternances positives et un **condensateur avec une résistance** se charge à chaque crête et se décharge lentement entre deux crêtes. La constante $τ = R C = 10 "kΩ" · 2,2 "nF" = ${n(datos.tau * 1e6, 0)} "µs"$ joue le rôle de filtre passe-bas : elle suit la montée et la descente de l'enveloppe (200 µs pour 5 kHz) mais pas les 1 000 cycles de la porteuse par milliseconde. Ce qui reste est le son, qu'un amplificateur envoie au haut-parleur. En FM, le détecteur est différent (un discriminateur qui convertit chaque variation de fréquence en tension), mais la fin est la même.` },
  ];

  const ejercicio = () => ({ tipo: 'rlc-banda', R: '10', L: '0,2533', C: '0,0001', f: '1009k', fmin: '100k', fmax: '10M' });
  function abrirEnBode(destino) {
    try { localStorage.setItem('bode-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [0, 1, 2, 3, 4, 5].map(() => ({ x: 8, y: 4.5, z: 1 }));
  const prueba = { etiqueta: 'la capacité du condensateur (pF)', min: 35, max: 356, paso: 1, valor: 100, C: 100,
    muestra: (Cpf) => { const f = f0De(Cpf), e = cercana(f); return `C = ${Cpf} pF → ${entero(f)} kHz${e ? ` · on entend la station ${e.n}` : ' · seulement du bruit entre les stations'}`; }, cambia: (Cpf) => { prueba.C = Cpf; } };
  pasos[4].prueba = prueba;

  const NC = 26;
  const audio = (u) => 0.62 * Math.sin(2 * Math.PI * 2 * u) + 0.38 * Math.sin(2 * Math.PI * 3 * u + 1);
  const integral = (u) => (-0.62 * Math.cos(2 * Math.PI * 2 * u)) / (2 * Math.PI * 2) - (0.38 * Math.cos(2 * Math.PI * 3 * u + 1)) / (2 * Math.PI * 3);
  const portadora = (u) => Math.cos(2 * Math.PI * NC * u);
  const envolvente = (u) => (1 + 0.6 * audio(u)) / 1.6;
  const am = (u) => envolvente(u) * portadora(u);
  const fm = (u) => Math.cos(2 * Math.PI * (NC * u + 0.35 * NC * integral(u) * 0.98));
  const detectada = (u) => Math.max(0, am(u));

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 0.4 : reloj;
    const tau = quieto ? 0.13 : (r * 0.05) % 1;
    const M = Dibujo.mezcla;
    g.fillStyle = c.sala; g.fillRect(0, 0, w, h);
    if (paso > 0) { g.fillStyle = M(c.sala, c.portadora, 0.12); g.fillRect(0, 0, w, h); v.pantalla(); v.brillo(8, 4.5, 10, c.sala, 0.9); v.vineta(0.14); v.mundo(); }

    function traza(fn, yc, amp, color, { x0 = 3.5, x1 = 15.3, ancho = 0.04, a = 1, n = 520, pasoU = 0 } = {}) {
      g.lineJoin = 'round'; g.beginPath();
      for (let j = 0; j <= n; j++) { const u = j / n, x = x0 + u * (x1 - x0), y = yc - amp * fn(u - tau * pasoU); j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
      g.strokeStyle = rgba(color, 0.16 * a); g.lineWidth = Math.max(4, ancho * 3.6 * v.K); g.stroke();   // halo de la traza, como en un osciloscopio
      g.strokeStyle = rgba(color, a); g.lineWidth = Math.max(1.4, ancho * v.K); g.stroke();
    }
    const ejeFila = (yc, a = 1) => { g.strokeStyle = rgba(c.rotulo, 0.25 * a); g.lineWidth = 1; g.beginPath(); g.moveTo(X(3.5), Y(yc)); g.lineTo(X(15.3), Y(yc)); g.stroke(); };
    const fila = (yc, a = 1) => { v.panel(0.4, yc - 1.02, 15.2, 2.04, 0.5 * a, true); ejeFila(yc, a); };

    function torre(x, suelo, alto, color, a = 1) {
      g.strokeStyle = rgba(color, a); g.lineWidth = Math.max(1.8, 0.05 * v.K);
      g.beginPath(); g.moveTo(X(x - 0.22), Y(suelo)); g.lineTo(X(x), Y(suelo - alto)); g.lineTo(X(x + 0.22), Y(suelo)); g.stroke();
      for (let k = 1; k < 5; k++) { const yy = suelo - (alto * k) / 5, e = 0.22 * (1 - k / 5); g.beginPath(); g.moveTo(X(x - e), Y(yy)); g.lineTo(X(x + e), Y(yy)); g.stroke(); }
    }

    if (paso === 0) {
      const suelo = 7.0;
      v.degradado(-1, suelo, M(c.sala, c.am, 0.32), M(c.sala, c.audio, 0.28)); v.brillo(12.5, suelo - 0.2, 6, c.audio, 0.3);
      v.colinas(suelo - 0.4, 1.3, suelo, M(c.suelo, c.sala, 0.6), 4); v.colinas(suelo - 0.05, 0.7, suelo, M(c.suelo, c.sala, 0.3), 8);
      v.degradado(suelo, 10, M(c.suelo, c.sala, 0.1), M(c.suelo, '#000000', 0.35));
      const antenas = [{ x: 2.0, col: c.am, rot: 'A · 855 kHz', fase: 0 }, { x: 5.0, col: c.audio, rot: 'B · 1000 kHz', fase: 0.3 }, { x: 8.0, col: c.fm, rot: 'C · FM 98,5 MHz', fase: 0.6 }];
      const sale = suave(tramo(t, 0.02, 0.2));
      for (const a of antenas) {
        for (let k = 0; k < 4; k++) {
          const s = ((quieto ? 0.1 : r * 0.12) + a.fase + k / 4) % 1, rad = 0.4 + s * 9;
          g.strokeStyle = rgba(a.col, 0.8 * (1 - s) * sale); g.lineWidth = Math.max(1.5, 0.045 * v.K);
          g.beginPath(); g.arc(X(a.x), Y(suelo - 1.9), rad * v.K, -Math.PI * 0.42, Math.PI * 0.2); g.stroke();
        }
        torre(a.x, suelo, 1.9, c.torre);
        v.brillo(a.x, suelo - 1.95, 0.7, a.col, 0.5 * sale); punto(a.x, suelo - 1.95, 0.08, a.col);
        rotulo(a.rot, a.x, suelo + 0.55, { al: 'center', tam: 11.5, peso: 700, color: a.col, escribe: tramo(t, 0.2 + a.fase * 0.3, 0.5 + a.fase * 0.3) });
      }
      const rx = 13.4, ry = 6.6;
      g.strokeStyle = c.rotulo; g.lineWidth = Math.max(1.6, 0.04 * v.K); g.beginPath(); g.moveTo(X(rx + 0.9), Y(ry - 0.6)); g.lineTo(X(rx + 1.2), Y(ry - 2.2)); g.stroke();
      punto(rx + 1.2, ry - 2.2, 0.07, c.rotulo);
      g.fillStyle = c.radio; g.beginPath(); g.roundRect(X(rx - 1.5), Y(ry - 0.6), 3 * v.K, 1.7 * v.K, 0.15 * v.K); g.fill();
      g.strokeStyle = c.rotulo; g.lineWidth = Math.max(1.4, 0.03 * v.K); g.stroke();
      g.fillStyle = rgba(c.sala, 0.8); g.beginPath(); g.arc(X(rx - 0.75), Y(ry + 0.25), 0.5 * v.K, 0, 2 * Math.PI); g.fill();
      for (let k = -1; k <= 1; k++) { g.strokeStyle = rgba(c.rotulo, 0.4); g.beginPath(); g.moveTo(X(rx - 1.1), Y(ry + 0.25 + k * 0.2)); g.lineTo(X(rx - 0.4), Y(ry + 0.25 + k * 0.2)); g.stroke(); }
      g.fillStyle = rgba(c.sala, 0.9); g.fillRect(X(rx + 0.0), Y(ry - 0.25), 1.3 * v.K, 0.3 * v.K);
      const aguja = 0.15 + 0.7 * suave(tramo(t, 0.5, 0.9)); g.strokeStyle = c.resalta; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath(); g.moveTo(X(rx + aguja * 1.3), Y(ry - 0.3)); g.lineTo(X(rx + aguja * 1.3), Y(ry + 0.1)); g.stroke();
      rotulo('votre radio', rx, ry + 1.65, { al: 'center', tam: 12, peso: 700, escribe: tramo(t, 0.4, 0.7) });
      rotulo('elle reçoit les trois… et en choisit une', 8, 1.2, { al: 'center', tam: 13, peso: 700, escribe: tramo(t, 0.55, 0.95) });
    }

    if (paso === 1) {
      const a = suave(tramo(t, 0.03, 0.3));
      for (const [x0, ancho, titulo, col, ciclos, lam, ant] of [[0.5, 7.3, 'son : 1 kHz', c.audio, 1.2, 'λ = 300 km', 'antenne de 75 km'], [8.2, 7.3, 'porteuse : 1 MHz', c.am, 26, 'λ = 300 m', 'antenne de 75 m']]) {
        v.panel(x0, 0.5, ancho, 8.0, 0.75, true);
        rotulo(titulo, x0 + ancho / 2, 1.1, { al: 'center', tam: 14, peso: 700, color: col, escribe: tramo(t, 0.1, 0.35) });
        const yc = 2.9, ini = x0 + 0.5, fin = x0 + ancho - 0.5;
        g.strokeStyle = rgba(col, a); g.lineWidth = Math.max(1.6, 0.05 * v.K); g.beginPath();
        for (let j = 0; j <= 300; j++) { const u = j / 300, y = yc - 0.55 * Math.sin(2 * Math.PI * ciclos * u - (quieto ? 0.5 : r * (ciclos > 5 ? 3 : 1.2))); j ? g.lineTo(X(ini + u * (fin - ini)), Y(y)) : g.moveTo(X(ini), Y(y)); }
        g.stroke();
        rotulo(lam, x0 + ancho / 2, 3.85, { al: 'center', tam: 13, peso: 700, escribe: tramo(t, 0.3, 0.55) });
        const base = 8.0, cx = x0 + ancho / 2, alto = ciclos > 5 ? 2.0 : 2.7;
        torre(cx, base, alto, c.torre, a);
        if (ciclos <= 5) {
          g.strokeStyle = rgba(c.resalta, a); g.lineWidth = Math.max(2, 0.06 * v.K); g.setLineDash([6, 5]); g.beginPath(); g.moveTo(X(cx - 0.4), Y(base - alto - 0.05)); g.lineTo(X(cx + 0.4), Y(base - alto - 0.05)); g.stroke(); g.setLineDash([]);
          v.flecha(cx, base - alto - 0.2, cx, base - alto - 0.9, c.resalta, a, 0.04);
        }
        rotulo(ant, cx + 0.6, ciclos > 5 ? 7.0 : 6.7, { tam: 12.5, peso: 700, color: ciclos > 5 ? c.fm : c.resalta, escribe: tramo(t, 0.5, 0.8) });
      }
      rotulo('imposible', 3.5, 4.55, { al: 'right', tam: 12, color: c.resalta, peso: 700, escribe: tramo(t, 0.6, 0.85) });
      rotulo('c\'est possible', 11.0, 6.2, { al: 'right', tam: 12, color: c.fm, peso: 700, escribe: tramo(t, 0.7, 0.95) });
    }

    if (paso === 2) {
      const filas = [{ y: 2.1, fn: audio, col: c.audio, rot: 'sonido m(t)' }, { y: 4.6, fn: portadora, col: c.portadora, rot: 'portadora' }, { y: 7.1, fn: am, col: c.am, rot: 'AM' }];
      filas.forEach((f, k) => {
        const a = suave(tramo(t, 0.04 + k * 0.22, 0.2 + k * 0.22));
        fila(f.y, a); traza(f.fn, f.y, 0.78, f.col, { a, ancho: k === 1 ? 0.025 : 0.05, pasoU: 1 });
        rotulo(f.rot, 0.8, f.y, { tam: 13, peso: 700, color: f.col, fondo: false, escribe: tramo(t, 0.1 + k * 0.22, 0.3 + k * 0.22) });
      });
      const aE = suave(tramo(t, 0.5, 0.75)); g.setLineDash([7, 6]);
      traza(envolvente, 7.1, 0.78, c.resalta, { a: aE, ancho: 0.03, pasoU: 1 }); traza((u) => -envolvente(u), 7.1, 0.78, c.resalta, { a: aE, ancho: 0.03, pasoU: 1 }); g.setLineDash([]);
      rotulo('l\'enveloppe copie le son', 15.0, 8.35, { al: 'right', tam: 12, color: c.resalta, peso: 700, fondo: false, escribe: tramo(t, 0.7, 0.95) });
      rotulo('pas à l\'échelle : la vraie porteuse a 1000 cycles par ms', 0.8, 8.35, { tam: 10.5, fondo: false, escribe: tramo(t, 0.2, 0.4) });
    }

    if (paso === 3) {
      const filas = [{ y: 2.1, fn: audio, col: c.audio, rot: 'sonido m(t)' }, { y: 4.6, fn: fm, col: c.fm, rot: 'FM' }, { y: 7.1, fn: null, col: c.ruido, rot: 'avec bruit' }];
      const ruido = (u) => { let s = 0; for (const [p, q] of [[0.17, 0.55], [0.42, 0.8], [0.66, 0.5], [0.87, 0.7]]) s += q * Math.exp(-(((u - p) * 90) ** 2)); return s; };
      filas.forEach((f, k) => {
        const a = suave(tramo(t, 0.04 + k * 0.22, 0.2 + k * 0.22));
        fila(f.y, a);
        if (f.fn) traza(f.fn, f.y, 0.78, f.col, { a, ancho: k === 0 ? 0.05 : 0.035, pasoU: 1 });
        else {
          g.strokeStyle = rgba(c.fm, a); g.lineWidth = Math.max(1.4, 0.035 * v.K); g.beginPath();
          for (let j = 0; j <= 520; j++) { const u = j / 520, x = 3.5 + u * 11.8, y = f.y - 0.78 * fm(u - tau) * (1 + ruido(u - tau) * 0.9); j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
          g.stroke();
          g.setLineDash([6, 5]); g.strokeStyle = rgba(c.ruido, a * 0.9); g.lineWidth = Math.max(1.2, 0.025 * v.K);
          for (const s of [1, -1]) { g.beginPath(); g.moveTo(X(3.5), Y(f.y - s * 0.78)); g.lineTo(X(15.3), Y(f.y - s * 0.78)); g.stroke(); } g.setLineDash([]);
        }
        rotulo(f.rot, 0.8, f.y, { tam: 13, peso: 700, color: f.col, fondo: false, escribe: tramo(t, 0.1 + k * 0.22, 0.3 + k * 0.22) });
      });
      rotulo('le bruit gonfle l\'amplitude…', 15.1, 5.75, { al: 'right', tam: 12, color: c.ruido, peso: 700, fondo: false, escribe: tramo(t, 0.55, 0.8) });
      rotulo('…et le limiteur du récepteur l\'écrête : le son reste dans la fréquence', 15.1, 8.35, { al: 'right', tam: 12, color: c.fm, peso: 700, fondo: false, escribe: tramo(t, 0.75, 1) });
    }

    if (paso === 4) {
      const Cpf = prueba.C, f0k = f0De(Cpf), Qk = Qde(f0k), e = cercana(f0k);
      const a = suave(tramo(t, 0.03, 0.3));
      const x0 = 0.9, x1 = 5.6, y0 = 1.9, y1 = 5.4;
      v.panel(0.4, 0.5, 5.8, 6.5, 0.7, true);
      g.strokeStyle = rgba(c.rotulo, a); g.lineWidth = Math.max(1.8, 0.045 * v.K); g.lineJoin = 'round';
      const lin = (xa, ya, xb, yb) => { g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xb), Y(yb)); g.stroke(); };
      lin(x0, y0, 1.7, y0); lin(4.3, y0, x1, y0); lin(x1, y0, x1, 3.0); lin(x1, 4.0, x1, y1); lin(x1, y1, x0, y1); lin(x0, y1, x0, 4.4); lin(x0, 3.0, x0, y0);
      g.beginPath(); for (let k = 0; k < 4; k++) g.arc(X(2.0 + k * 0.6), Y(y0), 0.3 * v.K, Math.PI, 0); g.stroke();
      lin(x1 - 0.5, 3.0, x1 + 0.5, 3.0); lin(x1 - 0.5, 4.0, x1 + 0.5, 4.0);
      v.flecha(x1 - 0.8, 4.35, x1 + 0.7, 2.65, c.resalta, a, 0.035);
      g.fillStyle = rgba(c.sala, 0.9); g.fillRect(X(2.4), Y(y1 - 0.2), 1.6 * v.K, 0.4 * v.K); g.strokeRect(X(2.4), Y(y1 - 0.2), 1.6 * v.K, 0.4 * v.K);
      g.fillStyle = rgba(c.sala, 0.9); g.beginPath(); g.arc(X(x0), Y(3.7), 0.4 * v.K, 0, 2 * Math.PI); g.fill(); g.stroke();
      g.beginPath(); for (let k = 0; k <= 20; k++) { const xx = x0 - 0.22 + 0.44 * (k / 20); k ? g.lineTo(X(xx), Y(3.7 - 0.12 * Math.sin(k / 20 * 2 * Math.PI))) : g.moveTo(X(xx), Y(3.7)); } g.stroke();
      rotulo('antena', x0 + 0.3, 2.65, { tam: 11, fondo: false, escribe: tramo(t, 0.3, 0.5) });
      rotulo(`L = ${n(L * 1e6)} µH`, 3.15, y0 - 0.65, { al: 'center', tam: 11.5, peso: 700, fondo: false, escribe: tramo(t, 0.35, 0.55) });
      rotulo(`C = ${Cpf} pF`, x1 - 0.75, 3.5, { al: 'right', tam: 11.5, peso: 700, color: c.resalta, fondo: false });
      rotulo('R = 10 Ω', 3.2, y1 + 0.55, { al: 'center', tam: 11.5, peso: 700, fondo: false, escribe: tramo(t, 0.45, 0.65) });
      rotulo('la sortie se mesure aux bornes de R', 3.2, 6.35, { al: 'center', tam: 11, fondo: false, escribe: tramo(t, 0.55, 0.75) });
      const gx0 = 7.2, gx1 = 15.3, gy0 = 3.6, gy1 = 0.9, fa = 500, fb = 1700;
      const px = (f) => gx0 + ((f - fa) / (fb - fa)) * (gx1 - gx0), py = (q) => gy0 + (gy1 - gy0) * q;
      v.panel(6.6, 0.4, 9.2, 4.6, 0.8, true);
      rotulo('toute la bande', 6.9, 0.8, { tam: 12, peso: 700, fondo: false });
      g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx0), Y(gy1 - 0.1)); g.lineTo(X(gx0), Y(gy0)); g.lineTo(X(gx1), Y(gy0)); g.stroke();
      for (const e2 of ESTACIONES) {
        const sono = e && e.n === e2.n;
        g.strokeStyle = rgba(sono ? c.resalta : c.portadora, sono ? 1 : 0.6); g.lineWidth = Math.max(1.4, 0.03 * v.K); g.setLineDash(sono ? [] : [4, 4]); g.beginPath(); g.moveTo(X(px(e2.f)), Y(gy0)); g.lineTo(X(px(e2.f)), Y(gy1 - 0.05)); g.stroke(); g.setLineDash([]);
        rotulo(e2.n, px(e2.f), gy0 + 0.25, { al: 'center', tam: 11.5, peso: 700, color: sono ? c.resalta : c.rotulo, fondo: false });
      }
      g.strokeStyle = c.am; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let f = fa; f <= fb; f += 0.5) { const q = gananciaDe(f, f0k); f > fa ? g.lineTo(X(px(f)), Y(py(q))) : g.moveTo(X(px(f)), Y(py(q))); }
      g.stroke(); punto(px(f0k), py(1), 0.1, c.resalta);
      rotulo('500 kHz', gx0, gy0 + 0.25, { tam: 10, fondo: false, al: 'left' }); rotulo('1700 kHz', gx1, gy0 + 0.25, { tam: 10, fondo: false, al: 'right' });
      const zx0 = 7.2, zx1 = 15.3, zy0 = 7.5, zy1 = 5.6, zq = (f) => zx0 + ((f - f0k + 25) / 50) * (zx1 - zx0), zy = (q) => zy0 + (zy1 - zy0) * q;
      v.panel(6.6, 5.2, 9.2, 3.7, 0.8, true);
      rotulo(`agrandi : ${entero(f0k)} kHz ± 25 kHz`, 6.9, 5.55, { tam: 12, peso: 700, fondo: false });
      g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(zx0), Y(zy1 - 0.1)); g.lineTo(X(zx0), Y(zy0)); g.lineTo(X(zx1), Y(zy0)); g.stroke();
      for (const s of [-1, 1]) { const q = gananciaDe(f0k + 9 * s, f0k); g.strokeStyle = rgba(c.portadora, 0.8); g.setLineDash([4, 4]); g.lineWidth = Math.max(1.2, 0.03 * v.K); g.beginPath(); g.moveTo(X(zq(f0k + 9 * s)), Y(zy0)); g.lineTo(X(zq(f0k + 9 * s)), Y(zy(q))); g.stroke(); g.setLineDash([]); punto(zq(f0k + 9 * s), zy(q), 0.08, c.ruido); }
      g.strokeStyle = c.am; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let f = f0k - 25; f <= f0k + 25; f += 0.2) { const q = gananciaDe(f, f0k); f > f0k - 25 ? g.lineTo(X(zq(f)), Y(zy(q))) : g.moveTo(X(zq(f)), Y(zy(q))); }
      g.stroke();
      rotulo(`voisine à 9 kHz : ${n(dB(gananciaDe(f0k + 9, f0k))).replace('-', '−')} dB`, 15.5, zy(gananciaDe(f0k + 9, f0k)) - 0.75, { al: 'right', tam: 11, color: c.ruido, peso: 700, fondo: false });
      rotulo(`Q = ${entero(Qk)} · Δf = ${n(f0k / Qk)} kHz`, 15.1, 8.55, { al: 'right', tam: 11.5, peso: 700, fondo: false });
    }

    if (paso === 5) {
      const filas = [{ y: 2.1, fn: am, col: c.am, rot: 'sintonizada' }, { y: 4.6, fn: detectada, col: c.audio, rot: 'après la diode' }, { y: 7.1, fn: audio, col: c.fm, rot: 'après le filtre' }];
      filas.forEach((f, k) => {
        const a = suave(tramo(t, 0.04 + k * 0.22, 0.2 + k * 0.22));
        fila(f.y, a);
        if (k === 1) {
          g.strokeStyle = rgba(c.audio, a); g.lineWidth = Math.max(1.3, 0.03 * v.K); g.beginPath();
          for (let j = 0; j <= 520; j++) { const u = j / 520, y = f.y - 0.78 * detectada(u - tau); j ? g.lineTo(X(3.5 + u * 11.8), Y(y)) : g.moveTo(X(3.5), Y(y)); } g.stroke();
          g.setLineDash([7, 6]); traza((u) => envolvente(u), f.y, 0.78, c.resalta, { a: a * suave(tramo(t, 0.45, 0.7)), ancho: 0.03, pasoU: 1 }); g.setLineDash([]);
        } else if (k === 2) traza(audio, f.y, 0.78, f.col, { a, ancho: 0.06, pasoU: 1 });
        else traza(f.fn, f.y, 0.78, f.col, { a, ancho: 0.035, pasoU: 1 });
        rotulo(f.rot, 0.8, f.y, { tam: 12.5, peso: 700, color: f.col, fondo: false, escribe: tramo(t, 0.1 + k * 0.22, 0.3 + k * 0.22) });
      });
      rotulo('diode : ne passe que le positif', 15.1, 3.55, { al: 'right', tam: 12, fondo: false, escribe: tramo(t, 0.4, 0.65) });
      rotulo('RC = 22 µs : elle suit l\'enveloppe, pas la porteuse', 15.1, 6.05, { al: 'right', tam: 12, fondo: false, escribe: tramo(t, 0.65, 0.95) });
      rotulo('→ vers le haut-parleur : c\'est le son', 15.1, 8.35, { al: 'right', tam: 12.5, peso: 700, color: c.fm, fondo: false, escribe: tramo(t, 0.8, 1) });
    }
  }

  const COLORES = ['sala', 'suelo', 'torre', 'am', 'fm', 'audio', 'portadora', 'ruido', 'radio', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnBode, f0De, Qde, gananciaDe, cercana };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: RadioAmFm.pasos, dibuja: RadioAmFm.dibuja, colores: RadioAmFm.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); RadioAmFm.abrirEnBode(e.currentTarget.getAttribute('href')); });
}

