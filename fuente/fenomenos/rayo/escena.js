/* =====================================================================
   El rayo: los 6 pasos de la animación (texto y dibujo) y el ejercicio que se
   abre en Dieléctricos y condensadores (la nube y el suelo como un condensador
   plano de 10 km² y 2 km de separación, a 100 MV). El motor es
   fenomenos/animacion.js, los ayudantes de dibujo fenomenos/dibujo.js y la
   maqueta pagina.html. En Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/rayo.js.
   ===================================================================== */
const Rayo = (() => {
  // modelo de orden de magnitud (datos revisados el 2 nov 2026 con valores típicos de la literatura): la base de la nube (10 km²) y el suelo (a 2 km) como un
  // condensador plano de aire; 100 MV justo antes de caer; 30 kA de corriente de pico típica; 343 m/s el sonido a 20 °C
  const S = 1e7, D = 2000, V = 100e6, EPS0 = 8.8541878128e-12, I = 30e3, SONIDO = 343, AIRE = 3e6;
  const C = (EPS0 * S) / D, Q = C * V, U = 0.5 * Q * V;
  const datos = { S, D, V, EPS0, C, Q, U, kWh: U / 3.6e6, E: V / D, AIRE, I, tiempo: Q / I, SONIDO, km: (s) => (SONIDO * s) / 1000 };
  const f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'Una nube que se carga', corto: 'Nube', dato: { valor: 'Base negativa', texto: 'La parte baja de la nube se carga negativa y la alta, positiva.' }, texto: 'Dentro de una nube de tormenta hay corrientes de aire muy fuertes que suben y bajan trozos de hielo. Los cristales pequeños, ligeros, son arrastrados hacia arriba; el granizo blando, más pesado, cae.\n\nCada vez que chocan, el granizo se queda con electrones y los cristales los pierden: es el mismo efecto triboeléctrico que al andar sobre una moqueta. El resultado es una nube con la parte alta positiva y la base negativa. Los detalles exactos del proceso se siguen estudiando.' },
    { titulo: 'La nube y el suelo, un condensador gigante', corto: 'Condensador', dato: { valor: 'C ≈ 44 nF', texto: 'de capacidad entre la base de la nube y el suelo.' }, texto: 'La base de la nube, con carga negativa, induce en el suelo de debajo una carga positiva, igual que el cable y el suelo en una línea de alta tensión. Nube y suelo son dos conductores separados por aire: un condensador.\n\nComo orden de magnitud, una base de $S = 10 "km"^2$ a $d = 2 "km"$ del suelo se comporta como un condensador plano:\n\n$C = {ε_0 S}/{d} = {8,85 · 10^{−12} · 10^7}/{2000} ≈ 44 "nF"$\n\nEs poca capacidad, la de un condensador pequeño. Lo que lo hace peligroso no es eso, sino la tensión a la que se carga.' },
    { titulo: 'Se carga hasta que el aire se rompe', corto: 'Tensión', dato: { valor: 'V ≈ 100 MV', texto: 'entre la nube y el suelo justo antes del rayo.' }, texto: 'Mientras la tormenta sigue separando cargas, la tensión sube. Con $V ≈ 100 "MV"$:\n\n$Q = C V ≈ 44 "nF" · 100 "MV" ≈ 4,4 "C"$\n\nEl campo medio es $E = V/d = 50 "kV/m"$, muy por debajo de los $3 "MV/m"$ que aguanta el aire seco. Pero el campo no es uniforme: alrededor de las bolsas de carga de la nube y en las puntas del suelo es mucho mayor, y ahí el aire empieza a ionizarse. Cómo arranca exactamente un rayo dentro de la nube todavía es un tema de investigación.', dura: 12000 },
    { titulo: 'Un canal baja a saltos y el suelo responde', corto: 'Líder', dato: { valor: '≈ 50 m por salto', texto: 'avanza el canal ionizado que baja de la nube, con pausas entre saltos.' }, texto: 'Desde la nube baja un canal de aire ionizado, el <b>líder escalonado</b>: avanza a saltos de unas decenas de metros, con pausas de unas decenas de microsegundos, y se ramifica. Es invisible a simple vista.\n\nCuando se acerca al suelo, el campo en las puntas de los árboles, los tejados y las torres se dispara (el efecto punta, el mismo del Fuego de San Telmo) y de ellas suben chispas hacia él. Cuando una se encuentra con el líder que baja, el camino queda cerrado: nube y suelo unidos por un hilo de plasma.' },
    { titulo: 'La descarga de retorno', corto: 'Descarga', dato: { valor: 'I ≈ 30 kA', texto: 'de corriente de pico típica, durante unas decenas de microsegundos.' }, texto: 'Al cerrarse el canal, el condensador se descarga de golpe: una onda de corriente sube del suelo hacia la nube a un tercio de la velocidad de la luz. Esa es la luz brillante del rayo.\n\nLa carga que se mueve, $Q ≈ 4,4 "C"$, a una corriente de $I ≈ 30 "kA"$, tarda del orden de $Q/I ≈ 150 "µs"$. El aire del canal se calienta a unos 30 000 K, cinco veces más que la superficie del Sol. Por el mismo canal suelen bajar varias descargas más, y por eso el relámpago parpadea.', dura: 11000 },
    { titulo: 'Energía y trueno', corto: 'Trueno', dato: { valor: 'U ≈ 220 MJ', texto: 'guardaba el condensador, unos 61 kWh.' }, texto: 'La energía que almacenaba el condensador era:\n\n$U = 1/2 Q V = 1/2 · 4,4 "C" · 100 "MV" ≈ 2,2 · 10^8 "J" ≈ 61 "kWh"$\n\nUna casa gasta eso en una semana, aproximadamente. Pero casi todo se va en calor, luz y una onda de choque, y no se puede aprovechar: se libera en una fracción de milisegundo y en un sitio imposible de prever.\n\nEl aire del canal, calentado de golpe, se expande a más velocidad que el sonido y produce el <b>trueno</b>. La luz llega casi al instante; el sonido tarda unos 3 s por cada kilómetro. Cuenta los segundos entre el relámpago y el trueno para saber a qué distancia ha caído.' },
  ];

  // ejercicio de Dieléctricos y condensadores (formato de condensadores-v1): condensador plano con aire, a 100 MV
  const ejercicio = () => ({ geo: 'plano', S: '1e7 m2', d: '2000 m', disposicion: 'serie', capas: [{ t: '2000 m', er: '1' }], fuente: 'V', V: '1e8 V' });
  // escribe el ejercicio en el estado de Condensadores y la abre
  function abrirEnCondensadores(destino) {
    try { localStorage.setItem('condensadores-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const SUELO = 7.6, BASE = 2.1, ARBOL = [11.5, 6.45], NUBE0 = [9, BASE], PASOS_LIDER = 16, CICLO = 2.6;
  const cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del último paso: segundos entre el relámpago y el trueno
  const prueba = { etiqueta: 'los segundos entre el relámpago y el trueno', min: 1, max: 30, paso: 1, valor: 7, s: 7,
    muestra: (s) => `${s} s → el rayo ha caído a ${f1(datos.km(s))} km${s <= 3 ? ': muy cerca, ponte a cubierto' : s <= 10 ? ': todavía es peligroso' : ''}`,
    cambia: (s) => { prueba.s = s; } };
  pasos[5].prueba = prueba;
  const camaraDe = (paso) => (paso === 3 ? { x: 10.4, y: 4.6, z: 1.45 } : paso === 4 ? { x: 10.2, y: 4.5, z: 1.2 } : { x: 8, y: 4.5, z: 1 });

  // el canal del rayo: de la base de la nube a la copa del árbol, con quiebros fijos (se calcula una vez, ya con Dibujo cargado)
  let canal = null;
  const damecanal = () => {
    if (canal) return canal;
    const pts = [NUBE0.slice()];
    for (let k = 1; k <= PASOS_LIDER; k++) { const s = k / PASOS_LIDER; pts.push(k === PASOS_LIDER ? ARBOL.slice() : [NUBE0[0] + (ARBOL[0] - NUBE0[0]) * s + (azar(k * 3.7) - 0.5) * 1.1 * Math.sin(Math.PI * s), NUBE0[1] + (ARBOL[1] - NUBE0[1]) * s]); }
    // dos ramas que mueren a medio camino
    const rama = (k0, dx) => { const r = [pts[k0].slice()]; for (let j = 1; j <= 5; j++) r.push([r[j - 1][0] + dx * (0.25 + 0.2 * azar(k0 * 9 + j)), r[j - 1][1] + 0.3 + 0.2 * azar(k0 * 5 + j)]); return r; };
    canal = { pts, ramas: [rama(4, -1), rama(7, 1), rama(10, -1)] };
    return canal;
  };

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(camaraDe(paso), reloj, quieto);
    const { X, Y, rotulo, signo, flecha, punto } = v, foto = window.FenomenoFoto, pantalla = v.pantalla, { pts, ramas } = damecanal();
    // destello de la descarga de retorno (paso 5): sube del suelo a la nube en unas décimas de segundo y se apaga; en la foto, a pleno brillo
    const fase = quieto ? 0.1 : reloj % CICLO, n = quieto ? 0 : Math.floor(reloj / CICLO);
    const brillo = paso !== 4 ? 0 : quieto ? 1 : fase < 0.35 ? 1 : fase < 0.5 ? 0.35 : fase < 0.62 ? 0.9 : Math.exp(-(fase - 0.62) * 4.5);
    const frente = paso !== 4 || quieto ? 1 : Math.min(1, fase / 0.12);
    // en el paso 6 el trueno es un anillo que sale del rayo tras el destello
    const rayoPaso6 = paso === 5 ? (quieto ? 0 : fase < 0.4 ? Math.exp(-fase * 5) : 0) : 0;

    cielo();
    colinas();
    nube();
    if (paso === 1 || paso === 2) campoNubeSuelo();
    suelo();
    if (paso === 1 || paso === 2) cargasSuelo();
    casaYArbol();
    if (paso === 3) lider();
    if (paso === 4 || paso === 5) descarga();
    if (paso === 5) trueno();
    if (!foto) rotulos();

    function cielo() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (brillo > 0 || rayoPaso6 > 0) { g.fillStyle = rgba(c.rayo, 0.34 * Math.max(brillo, rayoPaso6)); g.fillRect(0, 0, w, h); }
    }
    function colinas() {
      g.fillStyle = c.colina; g.beginPath(); g.moveTo(X(-4), Y(SUELO));
      for (let x = -4; x <= 20; x += 0.5) g.lineTo(X(x), Y(SUELO - 0.8 - 0.55 * Math.sin(x * 0.5 + 1) - 0.25 * Math.sin(x * 1.4)));
      g.lineTo(X(20), Y(SUELO)); g.closePath(); g.fill();
    }
    // la nube: bolas de nube que cubren toda la anchura visible; en el paso 1 aparecen las cargas de arriba y de abajo
    function nube() {
      const a = paso === 0 ? suave(tramo(t, 0, 0.4)) : 1;
      g.globalAlpha = a;
      const gr = g.createLinearGradient(0, Y(-0.8), 0, Y(BASE)); gr.addColorStop(0, rgba(c.nube, 1)); gr.addColorStop(1, rgba(c['nube-baja'], 1));
      g.fillStyle = gr;
      for (let x = Math.floor(v.x0) - 1, j = Math.floor(v.x0) * 7; x < v.x1 + 1; x += 1.25, j++) { g.beginPath(); g.arc(X(x), Y(0.55 + 0.45 * azar(j)), (0.85 + 0.5 * azar(j + 9)) * v.K, 0, 2 * Math.PI); g.fill(); }
      g.fillRect(0, 0, w, Math.max(0, Y(BASE - 0.5))); g.globalAlpha = 1;
      // cargas: + arriba y − abajo, que aparecen poco a poco en el paso 1 y se quedan
      const xs = []; for (let x = Math.ceil(v.x0 + 0.4); x < v.x1 - 0.3; x += 1.0) xs.push(x);
      const k = paso === 0 ? tramo(t, 0.3, 0.9) : 1;
      xs.slice(0, Math.round(xs.length * k)).forEach((x, j) => { signo(x, BASE - 0.2, -1, c.neg); signo(x + 0.35, 0.45 + 0.1 * azar(j), 1, c.pos, 0.9); });
      if (paso === 0) hielo();
    }
    // paso 1: hielo ligero que sube y granizo que baja, chocando
    function hielo() {
      const a = suave(tramo(t, 0, 0.3));
      for (let j = 0; j < 26; j++) {
        const x = 1 + 14 * azar(j * 3 + 1), sube = j % 2 === 0, u = (reloj * (sube ? 0.22 : 0.3) + azar(j)) % 1, y = sube ? BASE - 0.25 - u * (BASE - 0.55) : 0.55 + u * (BASE - 0.8);
        punto(x + 0.25 * Math.sin(reloj * 1.6 + j), y, sube ? 0.045 : 0.075, sube ? c.hielo : c.granizo, a);
      }
    }
    // pasos 2 y 3: el campo entre el suelo (+) y la base de la nube (−), con partículas que suben por cada línea
    function campoNubeSuelo() {
      const a = paso === 1 ? 0.7 * tramo(t, 0, 0.8) : 0.9, K = paso === 2 ? 0.45 + 0.55 * suave(tramo(t, 0, 0.9)) : 1;
      for (let x = Math.ceil(v.x0) + 0.5, j = 0; x < v.x1; x += 1.45, j++) {
        flecha(x, SUELO - 0.25, x, BASE + 0.3, c.campo, a * K, 0.025 + 0.025 * K);
        for (let q = 0; q < 3; q++) { const u = (reloj * 0.18 * (0.5 + K) + q / 3 + azar(j)) % 1; punto(x, SUELO - 0.3 - u * (SUELO - BASE - 0.6), 0.05, c.campo, a * Math.sin(Math.PI * u)); }
      }
    }
    function suelo() {
      g.fillStyle = c.hierba; g.fillRect(0, Y(SUELO), w, 0.25 * v.K);
      g.fillStyle = c.tierra; g.fillRect(0, Y(SUELO + 0.25), w, Math.max(0, h - Y(SUELO + 0.25)));
    }
    // cargas positivas inducidas en el suelo, que aumentan con la tensión del paso 3
    function cargasSuelo() {
      const k = paso === 1 ? tramo(t, 0.2, 0.8) : 1, extra = paso === 2 ? suave(tramo(t, 0, 0.9)) : 0;
      for (let x = Math.ceil(v.x0) + 0.3; x < v.x1; x += 0.9) { punto(x, SUELO + 0.5, 0.15, c.panel, 0.85 * k); signo(x, SUELO + 0.5, 1, c.pos, k, 0.8); }
      if (extra > 0) for (let j = -3; j <= 3; j++) signo(ARBOL[0] + j * 0.2, SUELO + 0.9, 1, c.pos, extra, 0.65);
    }
    function casaYArbol() {
      // casa a la izquierda
      g.fillStyle = c.casa; g.fillRect(X(3.7), Y(SUELO - 0.9), 1.5 * v.K, 0.9 * v.K);
      g.fillStyle = c.tejado; g.beginPath(); g.moveTo(X(3.55), Y(SUELO - 0.9)); g.lineTo(X(4.45), Y(SUELO - 1.5)); g.lineTo(X(5.35), Y(SUELO - 0.9)); g.closePath(); g.fill();
      g.fillStyle = rgba(c.brillo, paso === 4 || (paso === 5 && rayoPaso6 > 0) ? 0.9 : 0.5); g.fillRect(X(4.1), Y(SUELO - 0.6), 0.3 * v.K, 0.3 * v.K);
      // el árbol alto, solo en el campo, que será el blanco
      g.strokeStyle = c.tronco; g.lineWidth = Math.max(3, 0.16 * v.K); g.lineCap = 'round'; g.beginPath(); g.moveTo(X(ARBOL[0]), Y(SUELO)); g.lineTo(X(ARBOL[0]), Y(ARBOL[1] + 0.5)); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = c.copa; g.beginPath(); g.ellipse(X(ARBOL[0]), Y(ARBOL[1] + 0.55), 0.62 * v.K, 0.8 * v.K, 0, 0, 2 * Math.PI); g.fill();
    }
    // paso 4: el líder escalonado baja a saltos (se ve cada salto) y de la copa suben chispas
    function lider() {
      const nn = quieto ? PASOS_LIDER : Math.floor(suave(tramo(t, 0, 0.78)) * PASOS_LIDER);
      g.lineJoin = 'round'; g.lineCap = 'round';
      const traza = (puntos, hasta, alfa, ancho) => { if (hasta < 1) return; g.strokeStyle = rgba(c.rayo, alfa); g.lineWidth = Math.max(1, ancho * v.K); g.beginPath(); for (let k = 0; k <= hasta; k++) k ? g.lineTo(X(puntos[k][0]), Y(puntos[k][1])) : g.moveTo(X(puntos[k][0]), Y(puntos[k][1])); g.stroke(); };
      traza(pts, nn, 0.75, 0.04);
      ramas.forEach((r, j) => traza(r, Math.min(5, Math.max(0, nn - [4, 7, 10][j] + 1)), 0.5, 0.025));
      // la punta del líder brilla en cada salto
      if (nn >= 1 && nn < PASOS_LIDER && !quieto) { const p = pts[nn]; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(X(p[0]), Y(p[1]), 0, X(p[0]), Y(p[1]), 0.5 * v.K); gr.addColorStop(0, rgba(c.rayo, 0.7)); gr.addColorStop(1, rgba(c.rayo, 0)); g.fillStyle = gr; g.fillRect(X(p[0] - 0.5), Y(p[1] - 0.5), v.K, v.K); g.restore(); }
      // chispas que suben de la copa del árbol y del tejado (efecto punta) cuando el líder se acerca
      const sube = quieto ? 1 : tramo(t, 0.45, 0.8);
      if (sube > 0) {
        g.strokeStyle = rgba(c.rayo, 0.8 * sube); g.lineWidth = Math.max(1, 0.025 * v.K);
        for (const [x0, y0, L] of [[ARBOL[0], ARBOL[1] - 0.05, 0.9], [4.45, SUELO - 1.5, 0.7], [ARBOL[0] - 0.4, ARBOL[1] + 0.2, 0.6]]) {
          const nSub = Math.floor(reloj * 14) + (x0 * 3 | 0);
          v.chispa(x0, y0, x0 + (azar(nSub) - 0.5) * 0.4, y0 - L * sube, nSub, rgba(c.rayo, 0.85 * sube), 0.025, 5);
        }
      }
    }
    // pasos 5 y 6: el canal completo; en el 5 se enciende de abajo arriba y se apaga
    function descarga() {
      const b = paso === 4 ? brillo : rayoPaso6;
      const total = pts.length - 1, hasta = Math.floor(total * (paso === 4 ? frente : 1));
      if (paso === 4 || b > 0.02) {
        // canal tenue siempre visible (el plasma sigue ahí un instante)
        g.lineJoin = 'round'; g.lineCap = 'round';
        const traza = (puntos, desde, alfa, ancho) => { g.strokeStyle = rgba(c.rayo, alfa); g.lineWidth = Math.max(1, ancho * v.K); g.beginPath(); for (let k = desde; k < puntos.length; k++) k === desde ? g.moveTo(X(puntos[k][0]), Y(puntos[k][1])) : g.lineTo(X(puntos[k][0]), Y(puntos[k][1])); g.stroke(); };
        const desde = total - hasta, sub = pts.slice(desde);
        if (b > 0.02) {
          g.save(); g.globalCompositeOperation = 'lighter';
          traza(sub, 0, 0.16 * b, 0.55); traza(sub, 0, 0.3 * b, 0.22);
          g.restore();
          traza(sub, 0, 0.55 * b + 0.2, 0.09); traza(sub, 0, 1 * b, 0.04);
          ramas.forEach((r) => { if (frente > 0.5 || paso === 5) traza(r, 0, 0.6 * b, 0.022); });
          // resplandor en el suelo, junto al árbol, y en la copa
          const gr = g.createRadialGradient(X(ARBOL[0]), Y(ARBOL[1]), 0, X(ARBOL[0]), Y(ARBOL[1]), 1.4 * v.K); gr.addColorStop(0, rgba(c.brillo, 0.8 * b)); gr.addColorStop(1, rgba(c.brillo, 0));
          g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(X(ARBOL[0] - 1.4), Y(ARBOL[1] - 1.4), 2.8 * v.K, 2.8 * v.K); g.restore();
        }
      }
    }
    // paso 6: el sonido sale del canal como anillos que tardan en llegar; a la izquierda, el observador
    function trueno() {
      const x0 = ARBOL[0], r = quieto ? 3 : Math.max(0, (fase - 0.25) * 4.2);
      if (r > 0 && r < 9) { g.strokeStyle = rgba(c.sonido, Math.max(0, 0.7 * (1 - r / 9))); g.lineWidth = Math.max(1.5, 0.05 * v.K); for (const d of [0, 0.7]) { if (r - d <= 0) continue; g.beginPath(); g.ellipse(X(x0), Y(SUELO), (r - d) * v.K, (r - d) * 0.55 * v.K, 0, Math.PI, 2 * Math.PI); g.stroke(); } }
      // observador
      const x = 1.6; g.strokeStyle = c.persona; g.lineCap = 'round'; g.lineWidth = Math.max(2.5, 0.11 * v.K);
      g.beginPath(); g.moveTo(X(x), Y(SUELO)); g.lineTo(X(x), Y(SUELO - 0.55)); g.stroke(); g.beginPath(); g.moveTo(X(x), Y(SUELO - 0.5)); g.lineTo(X(x), Y(SUELO - 0.8)); g.stroke();
      punto(x, SUELO - 0.92, 0.1, c.piel); g.lineCap = 'butt';
    }
    function medidorCorriente() {
      // mini gráfica de I(t) de la descarga: sube en pocos µs y baja más despacio; el cursor sigue al destello
      const x = 0.4, y = 0.35, ancho = 4.4, alto = 2.4;
      pantalla(); v.panel(x, y, ancho, alto);
      const px = (s) => v.X(x + 0.35 + s * (ancho - 0.7)), py = (a) => v.Y(y + alto - 0.5 - a * (alto - 1.1));
      g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(px(0), py(0)); g.lineTo(px(1), py(0)); g.stroke();
      const I = (s) => { const u = s * 6; return (Math.exp(-u / 1.7) - Math.exp(-u / 0.12)) / 0.63; };
      g.strokeStyle = c.rayo2; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let j = 0; j <= 60; j++) { const s = j / 60; j ? g.lineTo(px(s), py(I(s))) : g.moveTo(px(s), py(I(s))); } g.stroke();
      const s = quieto ? 0.2 : Math.min(1, Math.max(0, (fase - 0.0) / 0.9));
      v.punto(x + 0.35 + s * (ancho - 0.7), y + alto - 0.5 - Math.max(0, I(s)) * (alto - 1.1), 0.09, c.rayo2);
      rotulo('Corriente de la descarga', x + 0.3, y + 0.35, { tam: 12, fondo: false, peso: 600 });
      rotulo('pico ≈ 30 kA', x + 0.3, y + alto - 0.2, { tam: 12, fondo: false, color: c.rayo2, peso: 700 });
      v.mundo();
    }
    function rotulos() {
      if (paso === 0) { rotulo('+ cristales de hielo, suben', 1.0, 1.15, { tam: 12, color: c.pos, escribe: tramo(t, 0.4, 0.6) }); rotulo('− granizo, cae', 1.0, 3.0, { tam: 12, color: c.neg, escribe: tramo(t, 0.6, 0.8) }); }
      if (paso === 1) {
        v.pantalla(); const a = tramo(t, 0.5, 0.9);
        rotulo('base de la nube: 10 km²', 0.5, BASE + 0.45, { tam: 12, escribe: a }); rotulo('d = 2 km', 7.1, 4.9, { tam: 12.5, peso: 700, escribe: a });
        g.strokeStyle = rgba(c.rotulo, 0.55 * a); g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(X(7), Y(BASE)); g.lineTo(X(7), Y(SUELO)); g.stroke(); g.setLineDash([]);
        v.panel(10.1, 0.35, 5.5, 1.1); rotulo('C = ε₀S/d ≈ 44 nF', 10.45, 0.9, { tam: 14, peso: 700, fondo: false, escribe: tramo(t, 0.6, 0.95) });
      }
      if (paso === 2) {
        v.pantalla(); const k = suave(tramo(t, 0, 0.9));
        v.panel(0.4, 0.35, 5.6, 2.1); rotulo(`V ≈ ${Math.round(100 * k)} MV`, 0.75, 0.9, { tam: 14, peso: 700, fondo: false }); rotulo(`Q = CV ≈ ${f1(Q * k)} C`, 0.75, 1.45, { tam: 13, fondo: false }); rotulo('E medio = V/d = 50 kV/m', 0.75, 2.0, { tam: 12.5, fondo: false, color: c.campo });
        rotulo('+ + + + más carga cerca de la copa', ARBOL[0] + 0.7, SUELO + 1.2, { tam: 11.5, fondo: false, color: c.pos, escribe: tramo(t, 0.5, 0.9) });
      }
      if (paso === 3) { v.pantalla(); v.panel(0.4, 0.35, 5.7, 1.1); rotulo('canal ionizado: líder escalonado', 0.75, 0.9, { tam: 13, fondo: false, peso: 600 }); }
      if (paso === 4) medidorCorriente();
      if (paso === 5) {
        v.pantalla(); v.panel(0.4, 0.35, 6.1, 2.1);
        rotulo('U = ½QV ≈ 220 MJ ≈ 61 kWh', 0.75, 0.9, { tam: 13.5, peso: 700, fondo: false }); rotulo(`${prueba.s} s de trueno → ${f1(datos.km(prueba.s))} km`, 0.75, 1.45, { tam: 13, fondo: false, color: c.sonido }); rotulo('el sonido tarda ≈ 3 s por km', 0.75, 2.0, { tam: 12, fondo: false });
      }
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // un chasquido seco con cada destello del paso 5 y, en el 6, un trueno grave que llega con retraso según los segundos elegidos (reducido)
  function sonido(ac) {
    const largo = (seg, tau) => { const b = ac.createBuffer(1, Math.floor(ac.sampleRate * seg), ac.sampleRate), d = b.getChannelData(0); for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * tau)); return b; };
    const seco = largo(0.3, 0.03), grave = largo(2.2, 0.55);
    let ultimo = -1, tocado = -1;
    const suena = (buf, tipo, frec, vol) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), ga = ac.createGain(); s.buffer = buf; fl.type = tipo; fl.frequency.value = frec; ga.gain.value = vol; s.connect(fl).connect(ga).connect(ac.destination); s.start(); };
    return {
      cuadro({ paso, reloj }) {
        const n = Math.floor(reloj / CICLO), fase = reloj - n * CICLO;
        if (paso === 4 && n !== ultimo && fase < 0.3) { ultimo = n; suena(seco, 'highpass', 1200, 0.5); }
        if (paso === 5 && n !== tocado && fase > 0.35) { tocado = n; suena(grave, 'lowpass', 220, Math.max(0.15, 0.9 - prueba.s / 40)); }
      },
    };
  }

  const COLORES = ['cielo', 'cielo-alto', 'colina', 'hierba', 'tierra', 'nube', 'nube-baja', 'casa', 'tejado', 'tronco', 'copa', 'persona', 'piel', 'hielo', 'granizo', 'rayo', 'rayo2', 'brillo', 'sonido', 'pos', 'neg', 'campo', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnCondensadores };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: Rayo.pasos, dibuja: Rayo.dibuja, colores: Rayo.COLORES, sonido: Rayo.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); Rayo.abrirEnCondensadores(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = Rayo;
