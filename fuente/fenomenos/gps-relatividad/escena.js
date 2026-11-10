/* =====================================================================
   El GPS y la relatividad: los 6 pasos de la animación (texto y dibujo) y el
   ejercicio que se abre en Física moderna (dilatación del tiempo de un satélite
   a 3874 m/s durante un día). El motor es fenomenos/animacion.js, los ayudantes
   de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo
   se cargan los datos: pruebas/herramientas/fenomenos/gps-relatividad.js.
   ===================================================================== */
const GpsRelatividad = (() => {
  // modelo: órbita circular de 26 560 km de radio alrededor de la Tierra de 6371 km; un día son 86 400 s
  const C = 299792458, GM = 3.986004418e14, RT = 6371e3, R = 26560e3, DIA = 86400, FREC = 10.23e6;
  const vOrbita = (r) => Math.sqrt(GM / r);
  // µs que se atrasa al día un reloj que va a v m/s (relatividad especial) y que se adelanta uno a h km de altura (general)
  const srDia = (v) => ((v * v) / (2 * C * C)) * DIA * 1e6;
  const grDia = (h) => ((GM * (1 / RT - 1 / (RT + h * 1e3))) / (C * C)) * DIA * 1e6;
  const v = vOrbita(R), sr = srDia(v), gr = grDia((R - RT) / 1e3), saldo = gr - sr;
  const datos = { C, GM, RT, R, v, sr, gr, saldo, T: (2 * Math.PI * R) / v, alt: (R - RT) / 1e3, errKm: (C * saldo * 1e-6) / 1e3, minCien: 100 / (C * saldo * 1e-6 / DIA) / 60,
    fRel: saldo * 1e-6 / DIA, fPre: FREC * (1 - (saldo * 1e-6) / DIA), mU: C * 1e-6 };
  // en qué órbita se compensan los dos efectos (la altura donde gr = sr): se halla por bisección
  datos.hCero = (() => { let a = 100, b = 20000; for (let i = 0; i < 60; i++) { const m = (a + b) / 2, s = grDia(m) - srDia(vOrbita(RT + m * 1e3)); if (s < 0) a = m; else b = m; } return (a + b) / 2; })();
  const f1 = (x, d = 1) => x.toFixed(d).replace('.', ',').replace('-', '−'), f0 = (x) => Math.round(x).toLocaleString('es-ES').replace(/\s/g, '.');

  const pasos = [
    { titulo: 'Tu móvil escucha a los satélites', corto: 'GPS', dato: { valor: '1 µs ≈ 300 m', texto: 'es lo que se equivoca tu posición por cada millonésima de segundo de error en un reloj.' }, texto: 'Cada satélite del GPS envía sin parar un mensaje con la hora exacta a la que lo emite. Tu móvil lo recibe un instante después y, como la señal viaja a la velocidad de la luz, $c = 299.792.458 "m/s"$, calcula a qué distancia está el satélite: $d = c · Δt$.\n\nCon la distancia a cuatro satélites (tres para la posición y uno más para ajustar el reloj del móvil) sabe dónde estás con unos pocos metros de error. Todo depende de que los relojes de los satélites estén perfectamente sincronizados: un error de $1 "µs"$ son $c · 1 "µs" ≈ 300 "m"$.' },
    { titulo: 'Relojes atómicos en órbita', corto: 'Relojes', dato: { valor: '3,87 km/s', texto: 'es la velocidad de un satélite GPS a 20.200 km de altura: una vuelta cada 11 h 58 min.' }, texto: 'Cada satélite lleva relojes atómicos, tan exactos que no se desvían ni un segundo en cientos de miles de años. Antes de lanzarlos se ponen en hora con los de la Tierra.\n\nPero los satélites no están quietos: orbitan a $r = 26.560 "km"$ del centro de la Tierra con $v = √(G M/r) = 3874 "m/s"$, y están mucho más lejos de la masa de la Tierra que nosotros. La relatividad dice que las dos cosas cambian el ritmo de un reloj, y cada una hacia un lado.' },
    { titulo: 'Van deprisa: el reloj se atrasa', corto: 'Velocidad', dato: { valor: '−7,2 µs al día', texto: 'se atrasa el reloj de un satélite por moverse a 3,87 km/s (relatividad especial).' }, texto: 'La relatividad especial dice que un reloj en movimiento marcha más despacio visto desde la Tierra. Con velocidades pequeñas frente a la luz, cada segundo se atrasa $v^2/(2c^2) = 8,3·10^{-11} "s"$.\n\nEn un día, $86.400 "s"$, son $7,2 "µs"$ de atraso. Parece poco, pero para un reloj atómico es una barbaridad. Mueve el deslizador para ver cómo crece con la velocidad.' },
    { titulo: 'Están arriba: el reloj se adelanta', corto: 'Gravedad', dato: { valor: '+45,7 µs al día', texto: 'se adelanta por sentir menos gravedad que en el suelo (relatividad general).' }, texto: 'La relatividad general dice que un reloj marcha más deprisa cuanto menos gravedad siente. A 20.200 km de altura el potencial gravitatorio es menos negativo que en el suelo, y el reloj se adelanta $Δφ/c^2 = G M (1/R_T − 1/r)/c^2$ por segundo, con $R_T = 6371 "km"$.\n\nSale $5,29·10^{-10}$ por segundo: $45,7 "µs"$ al día, más de seis veces lo que se atrasa por la velocidad. Cambia la altura de la órbita y mira cuándo gana cada efecto.', dura: 11000 },
    { titulo: 'El saldo: adelantan 38,5 µs al día', corto: 'Saldo', dato: { valor: '+38,5 µs al día', texto: 'adelanta un reloj de un satélite GPS respecto a uno en la Tierra.' }, texto: 'Sumando los dos efectos, $−7,2 + 45,7 = +38,5 "µs"$ al día: la gravedad gana a la velocidad, y los relojes de los satélites adelantan.\n\nSe corrige de antemano: antes del lanzamiento los relojes se ajustan para que den $10,229 999 995 43 "MHz"$ en vez de $10,23 "MHz"$. Ya en órbita, con el efecto relativista, marcan justo $10,23 "MHz"$ vistos desde la Tierra.' },
    { titulo: 'Sin Einstein, el GPS fallaría', corto: 'Error', dato: { valor: '≈ 11,5 km al día', texto: 'se desviaría tu posición si no se corrigiera la relatividad.' }, texto: 'Si no se corrigiera, el error en la distancia crecería $c · 38,5 "µs" ≈ 11,5 "km"$ cada día, sin parar: en una semana, más de 80 km.\n\nSolo harían falta unos 12 minutos para equivocarte en 100 m. Cada vez que usas un mapa en el móvil estás aprovechando las dos relatividades de Einstein.', dura: 11000 },
  ];

  // ejercicio de Física moderna (formato de fisica-moderna-v1): un día del reloj del satélite a 3874 m/s
  const ejercicio = () => ({ modo: 'dilatacion', uv: 'ms', v: '3874', t0: String(DIA) });
  function abrirEnFisicaModerna(destino) {
    try { localStorage.setItem('fisica-moderna-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // la Tierra es un círculo grande bajo el dibujo y la órbita otro más grande con el mismo centro (sin escala)
  const CX = 8, CY = 12.4, RTIERRA = 6.4, ROR = 9.4, MOVIL = [CX, CY - RTIERRA];
  const cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 3 (velocidad, m/s) y del paso 4 (altura de la órbita, km)
  const pruebaVel = { etiqueta: 'la velocidad del satélite', min: 500, max: 8000, paso: 1, valor: 3874, v: 3874,
    muestra: (x) => `${f0(x)} m/s → el reloj se atrasa ${f1(srDia(x))} µs al día`,
    cambia: (x) => { pruebaVel.v = x; } };
  const pruebaAlt = { etiqueta: 'la altura de la órbita', min: 500, max: 40000, paso: 100, valor: 20200, h: 20200,
    muestra: (h) => { const g = grDia(h), s = srDia(vOrbita(RT + h * 1e3)); return `${f0(h)} km → se adelanta ${f1(g)} µs por la gravedad y se atrasa ${f1(s)} µs por la velocidad: ${g - s >= 0 ? '+' : '−'}${f1(Math.abs(g - s))} µs al día`; },
    cambia: (h) => { pruebaAlt.h = h; } };
  pasos[2].prueba = pruebaVel; pasos[3].prueba = pruebaAlt;
  // los µs de cada efecto que se dibujan en el medidor del paso
  const medidas = (paso) => paso === 2 ? { sr: srDia(pruebaVel.v), gr: 0 } : paso === 3 ? { sr: srDia(vOrbita(RT + pruebaAlt.h * 1e3)), gr: grDia(pruebaAlt.h) } : { sr, gr };

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const vi = Dibujo.vista(g, w, h, c, cam);
    vi.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto } = vi;
    const foto = window.FenomenoFoto, T = quieto ? 0 : reloj;
    const sats = [0, 1, 2, 3].map(satelite);

    espacio(); orbita(); tierra();
    if (paso === 0) senales(); else if (paso === 5) errores();
    if (paso === 1) altura();
    if (paso === 2) for (const s of sats) velocidad(s);
    movil();
    for (const s of sats) dibujaSat(s);
    if (paso === 0) rotulo('d = c · Δt', 8.1, 5.1, { al: 'center', peso: 700, color: c.senal, escribe: tramo(t, 0.3, 0.6) });
    if (paso === 0) rotulo('4 distancias → tu posición', 8, 8.5, { al: 'center', peso: 700, escribe: tramo(t, 0.5, 0.8) });
    if (paso === 1 && !foto) relojes();
    if (paso >= 2 && paso <= 4 && !foto) medidor();
   

    function satelite(k) {
      const th = ((((k * 0.62 + 0.035 * T + 1.2) % 2.48) + 2.48) % 2.48) - 1.24;
      return { th, x: CX + ROR * Math.sin(th), y: CY - ROR * Math.cos(th), k };
    }
    function espacio() {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c['espacio-alto']); gr.addColorStop(1, c.espacio);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let j = 0; j < 70; j++) { const x = vi.x0 + azar(j) * (vi.x1 - vi.x0), y = vi.y0 + azar(j + 99) * 8.5; if (Math.hypot(x - CX, y - CY) < RTIERRA + 0.2) continue; const par = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(T * 1.3 + j)); punto(x, y, 0.012 + azar(j + 40) * 0.02, c.estrella, 0.35 + 0.5 * par); }
    }
    function orbita() {
      g.strokeStyle = rgba(c.orbita, 0.55); g.lineWidth = Math.max(1, 0.025 * vi.K); g.setLineDash([0.18 * vi.K, 0.2 * vi.K]);
      g.beginPath(); g.arc(X(CX), Y(CY), ROR * vi.K, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
    }
    function tierra() {
      const gr = g.createRadialGradient(X(CX), Y(CY - RTIERRA * 0.6), RTIERRA * 0.1 * vi.K, X(CX), Y(CY), RTIERRA * vi.K);
      gr.addColorStop(0, c.tierra); gr.addColorStop(1, c['tierra-borde']);
      const at = g.createRadialGradient(X(CX), Y(CY), RTIERRA * vi.K, X(CX), Y(CY), (RTIERRA + 0.45) * vi.K);
      at.addColorStop(0, rgba(c.aire, 0.6)); at.addColorStop(1, rgba(c.aire, 0));
      g.fillStyle = at; g.beginPath(); g.arc(X(CX), Y(CY), (RTIERRA + 0.45) * vi.K, 0, 2 * Math.PI); g.fill();
      g.fillStyle = gr; g.beginPath(); g.arc(X(CX), Y(CY), RTIERRA * vi.K, 0, 2 * Math.PI); g.fill();
      // continentes (manchas fijas dentro del círculo)
      g.save(); g.beginPath(); g.arc(X(CX), Y(CY), RTIERRA * vi.K, 0, 2 * Math.PI); g.clip(); g.fillStyle = rgba(c.tierra2, 0.75);
      for (let j = 0; j < 9; j++) { const an = -Math.PI / 2 + (azar(j + 5) - 0.5) * 1.5, d = RTIERRA * (0.35 + azar(j + 11) * 0.6); g.beginPath(); g.ellipse(X(CX + d * Math.cos(an)), Y(CY + d * Math.sin(an)), (0.5 + azar(j + 2) * 0.9) * vi.K, (0.25 + azar(j + 8) * 0.45) * vi.K, an, 0, 2 * Math.PI); g.fill(); }
      g.restore();
    }
    function movil() {
      const [x, y] = MOVIL;
      g.fillStyle = c.movil; g.beginPath(); g.roundRect(X(x - 0.1), Y(y - 0.32), 0.2 * vi.K, 0.36 * vi.K, 0.04 * vi.K); g.fill();
      g.fillStyle = c.pantalla; g.fillRect(X(x - 0.07), Y(y - 0.28), 0.14 * vi.K, 0.24 * vi.K);
      punto(x, y - 0.14, 0.05, c.senal);
    }
    // satélite: cuerpo, dos paneles solares y una luz, girado según su posición en la órbita
    function dibujaSat(s) {
      if (s.x < vi.x0 - 1 || s.x > vi.x1 + 1) return;
      g.save(); g.translate(X(s.x), Y(s.y)); g.rotate(s.th);
      const K = vi.K, a = 0.32;
      g.fillStyle = c.panelsol; g.fillRect(-0.95 * K, -0.09 * K, 0.7 * K, 0.18 * K); g.fillRect(0.25 * K, -0.09 * K, 0.7 * K, 0.18 * K);
      g.strokeStyle = rgba(c.estrella, 0.5); g.lineWidth = 1; for (const x0 of [-0.95, 0.25]) for (let j = 1; j < 4; j++) { g.beginPath(); g.moveTo((x0 + 0.175 * j) * K, -0.09 * K); g.lineTo((x0 + 0.175 * j) * K, 0.09 * K); g.stroke(); }
      g.fillStyle = c.satelite; g.beginPath(); g.roundRect(-a * 0.5 * K, -a * 0.5 * K, a * K, a * K, 0.04 * K); g.fill();
      g.fillStyle = c.antena; g.fillRect(-0.1 * K, a * 0.5 * K, 0.2 * K, 0.07 * K);
      g.restore();
      const ps = 0.5 + 0.5 * Math.sin(T * 3 + s.k * 1.7); punto(s.x, s.y, 0.05, c.senal, 0.5 + 0.5 * ps);
    }
    // paso 1: de cada satélite a tu móvil sale una señal que viaja a la velocidad de la luz
    function senales() {
      for (const s of sats) {
        const a = suave(tramo(t, 0, 0.5));
        g.strokeStyle = rgba(c.senal, 0.28 * a); g.lineWidth = Math.max(1, 0.03 * vi.K); g.setLineDash([0.12 * vi.K, 0.16 * vi.K]);
        g.beginPath(); g.moveTo(X(s.x), Y(s.y)); g.lineTo(X(MOVIL[0]), Y(MOVIL[1] - 0.15)); g.stroke(); g.setLineDash([]);
        for (let j = 0; j < 3; j++) { const q = quieto ? (j + 0.4) / 3 : ((T * 0.42 + j / 3 + s.k * 0.21) % 1); punto(s.x + (MOVIL[0] - s.x) * q, s.y + (MOVIL[1] - 0.15 - s.y) * q, 0.07, c.senal, 0.9 * a); }
        // las esferas de «distancia» alrededor del satélite
        const rr = Math.hypot(MOVIL[0] - s.x, MOVIL[1] - s.y); g.strokeStyle = rgba(c.senal, 0.12 * a); g.beginPath(); g.arc(X(s.x), Y(s.y), rr * vi.K, 0, 2 * Math.PI); g.stroke();
      }
    }
    // paso 2: la altura de la órbita
    function altura() {
      const a = suave(tramo(t, 0.1, 0.5));
      vi.flecha(CX + 1.15, CY - ROR + 0.1, CX + 1.15, MOVIL[1] - 0.45, rgba(c.rotulo, 0.9), a, 0.03);
      vi.flecha(CX + 1.15, MOVIL[1] - 0.45, CX + 1.15, CY - ROR + 0.1, rgba(c.rotulo, 0.9), a, 0.03);
      rotulo('20.200 km', CX + 1.4, 4.5, { color: c.rotulo, peso: 700, escribe: tramo(t, 0.3, 0.6) });
      rotulo('v = 3,87 km/s', 12.4, 2.1, { color: c.senal, peso: 700, escribe: tramo(t, 0.45, 0.75) });
    }
    // paso 3: flechas de velocidad (más largas cuanto más rápido)
    function velocidad(s) {
      const L = 0.4 + 1.6 * (pruebaVel.v / 8000), a = suave(tramo(t, 0.1, 0.5)), dx = Math.cos(s.th), dy = Math.sin(s.th);
      vi.flecha(s.x + dx * 0.35, s.y + dy * 0.35, s.x + dx * (0.35 + L), s.y + dy * (0.35 + L), c.atraso, a, 0.045);
    }
    // pasos 1: dos relojes que van a la vez (como al salir de la fábrica)
    function relojes() {
      vi.pantalla();
      const x0 = 0.4, y0 = 0.3, an = 5.6, al = 2.5, a = suave(tramo(t, 0.05, 0.3));
      g.globalAlpha = a; vi.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      for (const [cx, nom] of [[x0 + 1.5, 'En la Tierra'], [x0 + 4.1, 'En el satélite']]) {
        const cy = y0 + 1.2, r = 0.72; g.globalAlpha = a;
        g.strokeStyle = c.rotulo; g.lineWidth = 2; g.beginPath(); g.arc(X(cx), Y(cy), r * vi.K, 0, 2 * Math.PI); g.stroke();
        for (let j = 0; j < 12; j++) { const q = (j / 12) * 2 * Math.PI; g.beginPath(); g.moveTo(X(cx + Math.sin(q) * r * 0.86), Y(cy - Math.cos(q) * r * 0.86)); g.lineTo(X(cx + Math.sin(q) * r * 0.97), Y(cy - Math.cos(q) * r * 0.97)); g.stroke(); }
        const q = quieto ? 1 : reloj * 1.4; g.strokeStyle = c.atraso; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(cx), Y(cy)); g.lineTo(X(cx + Math.sin(q) * r * 0.78), Y(cy - Math.cos(q) * r * 0.78)); g.stroke();
        g.globalAlpha = 1; rotulo(nom, cx, y0 + 2.2, { al: 'center', tam: 11.5, fondo: false, color: c.rotulo });
      }
      rotulo('sincronizados', x0 + an / 2, y0 + 0.22, { al: 'center', tam: 11.5, fondo: false, peso: 700, color: c.rotulo, escribe: tramo(t, 0.3, 0.6) });
    }
    // pasos 3 a 5: medidor de lo que adelanta o atrasa el reloj en µs al día
    function medidor() {
      vi.pantalla();
      const x0 = 0.4, y0 = 0.25, an = 15.2, al = 2.45, a = suave(tramo(t, 0.05, 0.3)), ax = x0 + 0.6, aw = an - 1.2, MIN = -10, MAX = 50;
      g.globalAlpha = a; vi.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      const gx = (m) => ax + ((m - MIN) / (MAX - MIN)) * aw, yb = y0 + 1.42, hb = 0.34, { sr: s, gr: e } = medidas(paso), net = e - s, av = suave(tramo(t, 0.15, 0.7));
      g.globalAlpha = a; g.strokeStyle = rgba(c.rotulo, 0.35); g.lineWidth = 1;
      for (let m = MIN; m <= MAX; m += 10) { g.beginPath(); g.moveTo(X(gx(m)), Y(yb + hb / 2 + 0.05)); g.lineTo(X(gx(m)), Y(yb + hb / 2 + 0.15)); g.stroke(); }
      g.strokeStyle = rgba(c.rotulo, 0.7); g.beginPath(); g.moveTo(X(gx(0)), Y(yb - hb / 2 - 0.12)); g.lineTo(X(gx(0)), Y(yb + hb / 2 + 0.15)); g.stroke(); g.globalAlpha = 1;
      for (let m = MIN; m <= MAX; m += 10) rotulo(String(m).replace('-', '−'), gx(m), yb + hb / 2 + 0.34, { al: 'center', tam: 10, fondo: false, color: c.rotulo });
      const barra = (m0, m1, color, al2 = 1) => { g.globalAlpha = a * al2; g.fillStyle = color; g.fillRect(X(Math.min(gx(m0), gx(m1))), Y(yb - hb / 2), Math.abs(gx(m1) - gx(m0)) * vi.K, hb * vi.K); g.globalAlpha = 1; };
      if (paso === 2) { barra(0, -s * av, c.atraso); if (av > 0.2) rotulo(`−${f1(s)} µs`, gx(-s * av) - 0.12, yb - 0.48, { al: 'right', tam: 12.5, peso: 700, fondo: false, color: c.atraso }); }
      if (paso === 3) {
        barra(0, -s, c.atraso, 0.5); barra(-s, -s + e * av, c.adelanto);
        rotulo(`−${f1(s)} µs`, gx(-s) - 0.12, yb - 0.48, { al: 'right', tam: 11.5, fondo: false, color: c.atraso });
        if (av > 0.2) rotulo(`+${f1(e)} µs`, gx(-s + e * av) + 0.12, yb - 0.48, { tam: 12.5, peso: 700, fondo: false, color: c.adelanto });
      }
      if (paso === 4) {
        barra(0, net * av, c.saldo);
        if (av > 0.2) rotulo(`+${f1(net)} µs al día`, gx(net * av) + 0.12, yb - 0.48, { tam: 13, peso: 700, fondo: false, color: c.saldo });
      }
      rotulo('µs al día: adelanto (+) o atraso (−) de un reloj del satélite', x0 + 0.25, y0 + 0.28, { tam: 11, fondo: false, color: c.rotulo });
    }
    // paso 6: tu posición se va desviando
    function errores() {
      const a = suave(tramo(t, 0.05, 0.4)), d = suave(tramo(t, 0.2, 0.9)), x = MOVIL[0] - 0.1, y = MOVIL[1] - 0.45;
      for (const s of sats) { g.strokeStyle = rgba(c.error, 0.25 * a); g.lineWidth = Math.max(1, 0.03 * vi.K); g.setLineDash([0.12 * vi.K, 0.16 * vi.K]); g.beginPath(); g.moveTo(X(s.x), Y(s.y)); g.lineTo(X(x), Y(y)); g.stroke(); g.setLineDash([]); }
      if (foto) return;
      // el error en la pantalla del móvil: un mapa con el punto verdadero y el que marca el GPS
      vi.pantalla();
      const x0 = 10.1, y0 = 0.3, an = 5.5, al = 3.1, mx = x0 + 0.3, my = y0 + 0.62, mw = an - 0.6, mh = al - 1.3;
      g.globalAlpha = a; vi.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      g.globalAlpha = a; g.strokeStyle = rgba(c.rotulo, 0.2); g.lineWidth = 1;
      for (let j = 0; j <= 6; j++) { g.beginPath(); g.moveTo(X(mx + (mw * j) / 6), Y(my)); g.lineTo(X(mx + (mw * j) / 6), Y(my + mh)); g.stroke(); }
      for (let j = 0; j <= 3; j++) { g.beginPath(); g.moveTo(X(mx), Y(my + (mh * j) / 3)); g.lineTo(X(mx + mw), Y(my + (mh * j) / 3)); g.stroke(); }
      const px = mx + 0.4, py = my + mh / 2, km = datos.errKm * d, ex = px + (km / 20) * (mw - 0.8);
      g.strokeStyle = rgba(c.error, 0.8); g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(px), Y(py)); g.lineTo(X(ex), Y(py)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      punto(px, py, 0.1, c.senal, a); punto(ex, py, 0.1, c.error, a);
      rotulo('tu posición en el mapa', x0 + 0.3, y0 + 0.3, { tam: 11.5, fondo: false, color: c.rotulo });
      rotulo('real', px, py - 0.3, { al: 'center', tam: 10.5, fondo: false, color: c.senal });
      rotulo(`GPS sin corregir: ${f1(km)} km`, x0 + an - 0.3, y0 + al - 0.25, { al: 'right', tam: 12, peso: 700, fondo: false, color: c.error });
    }
  }

  const COLORES = ['espacio', 'espacio-alto', 'estrella', 'orbita', 'tierra', 'tierra2', 'tierra-borde', 'aire', 'satelite', 'panelsol', 'antena', 'movil', 'pantalla', 'senal', 'atraso', 'adelanto', 'saldo', 'error', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFisicaModerna, srDia, grDia };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: GpsRelatividad.pasos, dibuja: GpsRelatividad.dibuja, colores: GpsRelatividad.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); GpsRelatividad.abrirEnFisicaModerna(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = GpsRelatividad;
