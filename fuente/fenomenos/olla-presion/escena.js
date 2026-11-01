/* =====================================================================
   La olla a presión y el agua en la montaña: los 6 pasos de la animación (texto y dibujo) y el ejercicio
   que se abre en Calorimetría (1 kg de agua que hierve a 121 °C, un calentador de 2000 W). El modelo es
   Clausius-Clapeyron con el calor latente de vaporización constante. El motor es fenomenos/animacion.js,
   los ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se cargan
   los datos: pruebas/herramientas/fenomenos/olla-presion.js.
   ===================================================================== */
const OllaPresion = (() => {
  // agua: calor latente de vaporización 2257 kJ/kg y masa molar 18,015 g/mol ⇒ ΔH = 40,66 kJ/mol; atmósfera estándar de 101,325 kPa
  // con una altura de escala efectiva de 7600 m (más fría que los 8434 m de la isoterma: da 31,6 kPa en el Everest, como las tablas)
  const R = 8.314, LV = 2257e3, MM = 0.018015, DH = LV * MM, P0 = 101.325, T0 = 373.15, HESC = 7600, EVEREST = 8849;
  const presionAltura = (h) => P0 * Math.exp(-h / HESC);                          // kPa
  const ebullicion = (P) => 1 / (1 / T0 - (R / DH) * Math.log(P / P0)) - 273.15; // °C, con P en kPa
  const ATM = P0, P_OLLA = 2 * ATM, T_OLLA = ebullicion(P_OLLA), P_EVEREST = presionAltura(EVEREST), T_EVEREST = ebullicion(P_EVEREST);
  // ejercicio: 1 kg de agua de 20 °C a 121 °C (redondeo de T_OLLA) con un calentador de 2000 W al 90 %
  const T_REDONDA = Math.round(T_OLLA), M_AGUA = 1, C_AGUA = 4180, Q = M_AGUA * C_AGUA * (T_REDONDA - 20), P_CAL = 2000, ETA = 0.9;
  const tOlla = Q / (ETA * P_CAL), tAbierta = (M_AGUA * C_AGUA * 80) / (ETA * P_CAL);
  // cocinado: la velocidad de las reacciones se duplica cada 10 °C (regla aproximada, Q10 = 2)
  const veces = Math.pow(2, (T_REDONDA - 100) / 10);
  const datos = { R, LV, MM, DH, P0, HESC, ebullicion, presionAltura, P_OLLA, T_OLLA, P_EVEREST, T_EVEREST, atmEverest: P_EVEREST / ATM, Q, tOlla, tAbierta, veces, T_REDONDA };
  const f0 = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'Hervir es igualar presiones', corto: 'Ebullición', dato: { valor: '100 °C', texto: 'es la temperatura a la que el agua hierve cuando el aire pesa 1 atm sobre ella.' }, texto: 'Las moléculas del agua líquida se escapan al aire como vapor, y cuanto más caliente está el agua, más vapor hay y más presiona. El agua hierve cuando la presión de su vapor iguala a la presión que tiene encima: entonces el vapor se forma también dentro del líquido, como burbujas.\n\nAl nivel del mar la presión del aire es de 1 atm = 101,3 kPa y esa igualdad se da a 100 °C. No es una propiedad del agua sola: depende de la presión que haya sobre ella.' },
    { titulo: 'En la montaña el agua hierve antes', corto: 'Montaña', dato: { valor: 'Everest: ≈ 70 °C', texto: 'hierve el agua en la cima, a unos 31 kPa.' }, texto: 'Cuanto más subes, menos aire tienes encima y menos pesa: en Madrid, a 650 m, son 93 kPa; en el Everest, a 8849 m, solo unos 31 kPa, casi un tercio de atmósfera. El vapor del agua iguala esa presión mucho antes, a unos 70 °C.\n\nPor eso en la montaña la pasta tarda más en hacerse, aunque el agua «esté hirviendo»: hierve, pero a menos temperatura, y es la temperatura la que cuece. Un termómetro que mida cuándo hierve el agua puede incluso servir de altímetro.', prueba: null },
    { titulo: 'La olla a presión sube la presión', corto: 'Olla', dato: { valor: '2 atm → 121 °C', texto: 'hierve el agua dentro de una olla a presión.' }, texto: 'La olla hace lo contrario que la montaña. Con la tapa cerrada, el vapor que sale del agua no puede escaparse, así que se acumula y la presión sube hasta que una válvula la deja salir. En una olla doméstica es de unas 2 atm, una por encima de la del aire.\n\nCon el doble de presión encima, el agua necesita estar más caliente para que su vapor la iguale: hierve a unos 121 °C. El agua sigue hirviendo, pero a una temperatura que en una cacerola abierta no puede alcanzar nunca.', prueba: null },
    { titulo: 'Más caliente, más deprisa', corto: 'Cocción', dato: { valor: '≈ 4 veces más rápido', texto: 'cuece la olla frente a la cacerola abierta.' }, texto: 'Cocer es una reacción química (los almidones se gelatinizan, las proteínas se desnaturalizan, el colágeno se ablanda) y su velocidad crece mucho con la temperatura: como regla aproximada, se duplica cada 10 °C.\n\nDe 100 °C a 121 °C son unos 21 °C y $2^{2,1} ≈ 4,3$: lo que en la cacerola tarda una hora, la olla lo hace en unos 14 minutos. Es además un ahorro de energía, porque se calienta menos tiempo.', dura: 11000 },
    { titulo: 'La curva de ebullición', corto: 'Curva', dato: { valor: 'más presión, más temperatura', texto: 'la temperatura de ebullición sube con la presión, pero cada vez más despacio.' }, texto: 'Si dibujas la temperatura de ebullición frente a la presión sale una curva que sube y se va aplanando: del Everest (0,31 atm, 70 °C) al nivel del mar (1 atm, 100 °C) hay 30 °C; de ahí a la olla (2 atm, 121 °C), solo 21 °C más.\n\nLa curva sale de la ecuación de Clausius-Clapeyron, que relaciona la presión de vapor con la temperatura mediante el calor latente de vaporización: $"ln" {P_2}/{P_1} = {ΔH}/R (1/{T_1} − 1/{T_2})$.', dura: 11000 },
    { titulo: 'El cálculo, con Clausius-Clapeyron', corto: 'Cálculo', dato: { valor: 'T = 394 K = 121 °C', texto: 'a 2 atm, y 235 s para calentar 1 kg de agua con un hervidor de 2000 W.' }, texto: 'Con el calor latente del agua, $L_v = 2257 "kJ/kg"$, y su masa molar, 18,015 g/mol, sale $ΔH = 40,66 "kJ/mol"$. Despejando la temperatura a 2 atm:\n\n$1/T_2 = 1/373,15 − {8,314}/{40 660} "ln" 2$, es decir $T_2 = 394 "K" = 121 "°C"$.\n\nEn Calorimetría se abre el calentamiento de 1 kg de agua de 20 a 121 °C: $Q = m c ΔT = 1 · 4180 · 101 = 422 "kJ"$, que un hervidor de 2000 W con un 90 % de rendimiento da en $t = Q/(η P) = 235 "s"$.' },
  ];

  // ejercicio de Calorimetría (formato de calorimetria-v1): el agua de la olla como sustancia propia que hierve a 121 °C y un calentador
  const ejercicio = () => ({
    cuerpos: [
      { sustancia: 'otra', nombre: 'Agua en la olla', m: '1000', T0: '20', cs: '2090', cl: '4180', cg: '2010', Tf: '0', Lf: '334000', Tv: String(T_REDONDA), Lv: '2257000' },
      { sustancia: 'calentador', P: String(P_CAL), t: '?', eta: String(ETA * 100) },
    ],
    Tfin: String(T_REDONDA), tab: 'mezcla',
  });
  function abrirEnCalorimetria(destino) {
    try { localStorage.setItem('calorimetria-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 2: la altura; y del paso 3: la presión dentro de la olla, en atm
  const alt = { etiqueta: 'la altura sobre el nivel del mar', min: 0, max: EVEREST, paso: 50, valor: EVEREST, h: EVEREST, tocada: false,
    muestra: (h) => `${f0(h)} m → ${f0(presionAltura(h))} kPa, el agua hierve a ${f0(ebullicion(presionAltura(h)))} °C`,
    cambia: (h) => { alt.h = h; alt.tocada = true; } };
  const pre = { etiqueta: 'la presión dentro de la olla (atm)', min: 1, max: 3, paso: 0.1, valor: 2, atm: 2,
    muestra: (a) => `${f1(a)} atm → el agua hierve a ${f0(ebullicion(a * ATM))} °C`,
    cambia: (a) => { pre.atm = a; } };
  pasos[1].prueba = alt; pasos[2].prueba = pre;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(paso === 2 ? { x: 8, y: 4.5, z: 1.15 } : { x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto, flecha } = v;
    const ciclo = (k, vel) => (quieto ? azar(k) : (reloj * vel + azar(k)) % 1);

    if (paso === 1) montana(); else if (paso === 4) { fondoCocina(); grafica(); } else if (paso === 5) { fondoCocina(); cuentas(); } else if (paso === 3) { fondoCocina(); dosOllas(); } else { fondoCocina(); olla(); }

    function fondoCocina() {
      g.fillStyle = c.pared; g.fillRect(0, 0, w, h);
      g.strokeStyle = rgba(c.rotulo, 0.07); g.lineWidth = 1; g.beginPath();
      for (let x = -4; x < 22; x += 1.2) { g.moveTo(X(x), 0); g.lineTo(X(x), Y(7)); }
      for (let y = 0; y < 7; y += 1.2) { g.moveTo(0, Y(y)); g.lineTo(w, Y(y)); }
      g.stroke();
      g.fillStyle = c.azulejo; g.fillRect(0, Y(7.0), w, h - Y(7.0));
      g.fillStyle = c.encimera; g.fillRect(0, Y(6.92), w, 0.14 * v.K);
    }
    // termómetro vertical de 40 a 140 °C
    function termometro(x, yb, alto, T) {
      const a = Math.min(1, Math.max(0.03, (T - 40) / 100));
      g.fillStyle = rgba(c.rotulo, 0.12); g.beginPath(); g.roundRect(X(x - 0.07), Y(yb - alto), 0.14 * v.K, alto * v.K, 0.07 * v.K); g.fill();
      g.fillStyle = c.termo; g.beginPath(); g.roundRect(X(x - 0.045), Y(yb - alto * a), 0.09 * v.K, alto * a * v.K, 0.045 * v.K); g.fill();
      punto(x, yb + 0.05, 0.13, c.termo);
    }
    // una cacerola con su fuego; ancho y alto en unidades, con tapa y válvula si «tapa»; el vapor sale por arriba o por la válvula
    function cazo(cx, yb, { ancho = 3.4, alto = 2.2, tapa = false, hierve = true, id = 0, nivel = 0.55, escape = 1 } = {}) {
      const x0 = cx - ancho / 2, ys = yb - alto, yagua = yb - alto * nivel;
      // fuego
      g.fillStyle = c.olla; g.fillRect(X(cx - ancho * 0.62), Y(yb), ancho * 1.24 * v.K, 0.22 * v.K);
      for (let k = 0; k < 9; k++) {
        const x = cx - ancho * 0.4 + (k / 8) * ancho * 0.8, a = 0.2 + 0.1 * Math.sin(reloj * 9 + k * 2.1) * (quieto ? 0 : 1);
        g.fillStyle = rgba(c.llama, 0.9); g.beginPath(); g.moveTo(X(x - 0.12), Y(yb)); g.quadraticCurveTo(X(x), Y(yb - 0.15 - a), X(x + 0.12), Y(yb)); g.fill();
      }
      // interior (aire, vapor) y agua
      g.fillStyle = rgba(c.vapor, 0.25); g.fillRect(X(x0), Y(ys), ancho * v.K, alto * v.K);
      g.fillStyle = rgba(c.agua, 0.85); g.fillRect(X(x0), Y(yagua), ancho * v.K, (yb - yagua) * v.K);
      // burbujas dentro del agua
      if (hierve) for (let k = 0; k < 10; k++) {
        const ph = ciclo(k + id * 20, 0.5), x = x0 + 0.25 + azar(k + id * 20 + 1) * (ancho - 0.5), y = yb - 0.1 - ph * (yb - yagua - 0.05), r = 0.05 + 0.06 * azar(k + 3);
        punto(x + Math.sin(ph * 9 + k) * 0.05, y, r, c.vapor, 0.8);
      }
      // paredes
      g.strokeStyle = c.olla; g.lineWidth = Math.max(3, 0.12 * v.K); g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(X(x0), Y(ys)); g.lineTo(X(x0), Y(yb)); g.lineTo(X(x0 + ancho), Y(yb)); g.lineTo(X(x0 + ancho), Y(ys)); g.stroke();
      // asas
      g.lineWidth = Math.max(2.5, 0.09 * v.K); g.beginPath(); g.moveTo(X(x0), Y(ys + 0.35)); g.lineTo(X(x0 - 0.55), Y(ys + 0.4)); g.moveTo(X(x0 + ancho), Y(ys + 0.35)); g.lineTo(X(x0 + ancho + 0.55), Y(ys + 0.4)); g.stroke(); g.lineCap = 'butt';
      let vx = cx, vy = ys;
      if (tapa) {
        g.fillStyle = c.tapa; g.beginPath(); g.roundRect(X(x0 - 0.12), Y(ys - 0.28), (ancho + 0.24) * v.K, 0.28 * v.K, 0.1 * v.K); g.fill();
        g.fillStyle = c.olla; g.beginPath(); g.roundRect(X(cx - 0.25), Y(ys - 0.62), 0.5 * v.K, 0.36 * v.K, 0.06 * v.K); g.fill();   // pie de la válvula
        const sal = quieto ? 0 : Math.max(0, Math.sin(reloj * 13)) * 0.06;
        g.fillStyle = c.tapa; g.beginPath(); g.roundRect(X(cx - 0.18), Y(ys - 0.82 - sal), 0.36 * v.K, 0.22 * v.K, 0.05 * v.K); g.fill();  // la pesa de la válvula, que baila
        vy = ys - 0.9;
      }
      // vapor: por encima de una cacerola abierta, o a chorritos por la válvula
      if (hierve) for (let k = 0; k < (tapa ? 5 : 7); k++) {
        const ph = ciclo(k + id * 11 + 40, tapa ? 0.9 : 0.45), x = (tapa ? vx : cx + (azar(k + 9) - 0.5) * ancho * 0.7) + Math.sin(ph * 6 + k) * (tapa ? 0.2 : 0.18) * ph;
        const y = vy - 0.1 - ph * (tapa ? 1.6 : 1.7) * escape, r = (tapa ? 0.07 : 0.12) + ph * (tapa ? 0.22 : 0.28);
        punto(x, y, r, c.vapor, (1 - ph) * (tapa ? 0.8 : 0.6));
      }
      return { x0, ys, yagua, vx, vy };
    }

    // pasos 1 y 4: una olla abierta al aire de 1 atm
    function olla() {
      const cerrada = paso === 2, yb = 6.4;
      if (paso === 0 || paso === 2) {
        const atm = paso === 2 ? pre.atm : 1, T = ebullicion(atm * ATM);
        const P = cazo(8, yb, { tapa: cerrada, ancho: cerrada ? 3.8 : 3.6, alto: 2.3, escape: cerrada ? 0.6 + 0.4 * atm : 1 });
        termometro(5.15, yb - 0.1, 2.2, T);
        // presión del aire sobre el agua (paso 1) o del vapor atrapado sobre las paredes y la tapa (paso 3)
        if (!cerrada) {
          const a = suave(tramo(t, 0.05, 0.4));
          for (let k = 0; k < 5; k++) flecha(P.x0 + 0.4 + k * 0.7, 1.2 + 0.1 * Math.sin(reloj * 3 + k) * (quieto ? 0 : 1), P.x0 + 0.4 + k * 0.7, 2.45, c.resalta, a, 0.05);
          rotulo('1 atm = 101,3 kPa', 8, 0.65, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.2, 0.5) });
          rotulo(`${f0(T)} °C`, 5.15, yb + 0.55, { al: 'center', peso: 700, color: c.termo, escribe: tramo(t, 0.3, 0.6) });
          rotulo('hierve cuando la presión de su vapor iguala a la del aire', 8, 7.45, { al: 'center', tam: 12.5, escribe: tramo(t, 0.55, 1) });
        } else {
          // moléculas de vapor atrapadas, más cuantas más presión, y flechas contra la tapa y las paredes
          const n = Math.round(8 + 12 * (atm - 1) / 2 + 6);
          for (let k = 0; k < n; k++) {
            const px = P.x0 + 0.2 + azar(k * 3 + 1) * (3.8 - 0.4), py = P.ys + 0.15 + azar(k * 3 + 2) * (P.yagua - P.ys - 0.35);
            const dx = quieto ? 0 : Math.sin(reloj * (2 + azar(k)) + k) * 0.18, dy = quieto ? 0 : Math.cos(reloj * (2.4 + azar(k + 5)) + k) * 0.14;
            punto(px + dx, py + dy, 0.045, c.vapor, 0.95);
          }
          const a = suave(tramo(t, 0.1, 0.4)), L = 0.15 + 0.3 * atm;
          for (let k = 0; k < 3; k++) flecha(P.x0 + 0.9 + k * 1.0, P.ys + 0.2, P.x0 + 0.9 + k * 1.0, P.ys - 0.05 - L * 0.5, c.resalta, a, 0.05);
          flecha(P.x0 + 0.25, P.ys + 0.9, P.x0 - 0.1 - L * 0.4, P.ys + 0.9, c.resalta, a, 0.05); flecha(P.x0 + 3.55, P.ys + 0.9, P.x0 + 3.9 + L * 0.4, P.ys + 0.9, c.resalta, a, 0.05);
          rotulo(`${f1(atm)} atm dentro`, 8, P.ys + 1.0, { al: 'center', peso: 700, color: c.resalta, tam: 12.5, escribe: tramo(t, 0.3, 0.6) });
          rotulo('válvula', P.vx + 0.6, P.vy - 0.1, { tam: 12.5, escribe: tramo(t, 0.5, 0.75) });
          rotulo(`${f0(T)} °C`, 5.15, yb + 0.55, { al: 'center', peso: 700, color: c.termo, escribe: tramo(t, 0.4, 0.7) });
          rotulo('el vapor, atrapado, sube la presión', 8, 7.45, { al: 'center', tam: 12.5, escribe: tramo(t, 0.6, 1) });
        }
      }
    }

    // paso 4: dos cocinas, una cacerola abierta a 100 °C y una olla a 121 °C, con la comida que se va haciendo
    function dosOllas() {
      const yb = 5.9, p1 = t, p2 = Math.min(1, t * veces), min1 = 60 * t, min2 = Math.min(60 / veces, 60 * t);
      cazo(4.1, yb, { ancho: 3.4, alto: 2.2, id: 0 }); cazo(11.9, yb, { ancho: 3.4, alto: 2.2, tapa: true, id: 1 });
      termometro(1.7, yb - 0.1, 2.0, 100); termometro(14.3, yb - 0.1, 2.0, T_REDONDA);
      const barra = (cx, p, hecho) => {
        const ax = 3.6, x = cx - ax / 2;
        g.fillStyle = rgba(c.rotulo, 0.14); g.beginPath(); g.roundRect(X(x), Y(7.15), ax * v.K, 0.3 * v.K, 0.15 * v.K); g.fill();
        g.fillStyle = hecho ? c.barra : c.llama; g.beginPath(); g.roundRect(X(x), Y(7.15), Math.max(0.3, ax * p) * v.K, 0.3 * v.K, 0.15 * v.K); g.fill();
      };
      barra(4.1, p1, p1 >= 1); barra(11.9, p2, p2 >= 1);
      rotulo('cazo abierto · 100 °C', 4.1, 2.35, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0, 0.2) });
      rotulo('olla a presión · 121 °C', 11.9, 2.35, { al: 'center', peso: 700, tam: 12.5, color: c.resalta, escribe: tramo(t, 0, 0.2) });
      rotulo(`${f0(min1)} min`, 4.1, 7.8, { al: 'center', tam: 12.5, fondo: false });
      rotulo(p2 >= 1 ? `¡lista a los ${f0(60 / veces)} min!` : `${f0(min2)} min`, 11.9, 7.8, { al: 'center', tam: 12.5, fondo: false, peso: p2 >= 1 ? 700 : 500, color: p2 >= 1 ? c.barra : c.rotulo });
      rotulo('una receta que en el cazo tarda una hora', 8, 0.7, { al: 'center', tam: 12.5, escribe: tramo(t, 0.1, 0.4) });
    }

    // paso 2: la subida a la montaña; la olla sube por la ladera y el termómetro del panel baja
    function montana() {
      const hh = alt.tocada ? alt.h : EVEREST * suave(tramo(t, 0.05, 0.95)), s = hh / EVEREST;
      const cima = { x: 6.2, y: 1.7 }, base = { y: 7.6 }, bx0 = 0.4, bx1 = 12.2;
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 4; k++) { const x = 1 + k * 4.2, y = 1.0 + azar(k) * 1.8; g.fillStyle = rgba(c.vapor, 0.7); g.beginPath(); g.ellipse(X(x), Y(y), 0.9 * v.K, 0.22 * v.K, 0, 0, 2 * Math.PI); g.fill(); }
      // montaña con su nieve
      g.fillStyle = c['monte-2']; g.beginPath(); g.moveTo(X(7.5), Y(base.y)); g.lineTo(X(11.4), Y(3.9)); g.lineTo(X(15), Y(base.y)); g.closePath(); g.fill();
      g.fillStyle = c.monte; g.beginPath(); g.moveTo(X(bx0), Y(base.y)); g.lineTo(X(cima.x), Y(cima.y)); g.lineTo(X(bx1), Y(base.y)); g.closePath(); g.fill();
      g.fillStyle = c.nieve; g.beginPath(); g.moveTo(X(cima.x), Y(cima.y)); g.lineTo(X(cima.x - 0.95), Y(cima.y + 1.05)); g.lineTo(X(cima.x - 0.3), Y(cima.y + 0.82)); g.lineTo(X(cima.x + 0.2), Y(cima.y + 1.2)); g.lineTo(X(cima.x + 0.55), Y(cima.y + 0.8)); g.lineTo(X(cima.x + 1.0), Y(cima.y + 1.1)); g.closePath(); g.fill();
      g.fillStyle = c.encimera; g.fillRect(0, Y(base.y), w, h - Y(base.y));
      // la olla a media ladera (a escala reducida), que sube con la altura
      const ox = bx0 + (cima.x - bx0) * s * 0.9 + 0.25, oy = base.y - (base.y - cima.y) * s * 0.9 - 0.02, T = ebullicion(presionAltura(hh));
      const E = { x: ox, y: oy };
      g.save(); g.translate(X(E.x), Y(E.y)); g.scale(0.5, 0.5); g.translate(-X(E.x), -Y(E.y));
      cazo(E.x, E.y - 0.4, { ancho: 2.4, alto: 1.5, id: 3 });
      g.restore();
      v.pantalla();
      v.panel(10.1, 0.35, 5.5, 2.75);
      rotulo(`altura: ${f0(hh)} m`, 10.5, 0.85, { tam: 13, fondo: false, peso: 600 });
      rotulo(`presión: ${f0(presionAltura(hh))} kPa`, 10.5, 1.45, { tam: 13, fondo: false });
      rotulo(`hierve a ${f0(T)} °C`, 10.5, 2.15, { tam: 15, fondo: false, peso: 700, color: c.termo });
      termometro(14.9, 2.7, 1.75, T);
      v.mundo();
    }

    // paso 5: la curva T(P)
    function grafica() {
      v.pantalla();
      const a = suave(tramo(t, 0.05, 0.2)); g.globalAlpha = a; v.panel(0.5, 0.35, 15, 8.3); g.globalAlpha = 1;
      if (a <= 0) return;
      const gx0 = 2.2, gx1 = 14.6, gy0 = 7.4, gy1 = 1.2, tx = (atm) => gx0 + (atm / 3) * (gx1 - gx0), ty = (T) => gy0 - ((T - 60) / 80) * (gy0 - gy1);
      g.strokeStyle = rgba(c.rotulo, 0.12); g.lineWidth = 1; g.beginPath();
      for (const T of [80, 100, 120]) { g.moveTo(X(gx0), Y(ty(T))); g.lineTo(X(gx1), Y(ty(T))); }
      for (const A of [1, 2, 3]) { g.moveTo(X(tx(A)), Y(gy1)); g.lineTo(X(tx(A)), Y(gy0)); }
      g.stroke();
      g.strokeStyle = c.rotulo; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(gx0), Y(gy1 - 0.15)); g.lineTo(X(gx0), Y(gy0)); g.lineTo(X(gx1), Y(gy0)); g.stroke();
      const hasta = 0.2 + 2.8 * tramo(t, 0.15, 0.7);
      g.strokeStyle = c.termo; g.lineWidth = Math.max(2.5, 0.07 * v.K); g.lineJoin = 'round'; g.beginPath();
      for (let A = 0.2, k = 0; A <= hasta + 1e-9; A += 0.02, k++) { const px = X(tx(A)), py = Y(ty(ebullicion(A * ATM))); if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
      rotulo('T de ebullición (°C)', gx0 + 0.15, gy1 - 0.15, { tam: 11.5, fondo: false });
      rotulo('presión (atm)', gx1, gy0 + 0.75, { al: 'right', tam: 11.5, fondo: false });
      for (const T of [80, 100, 120]) rotulo(String(T), gx0 - 0.15, ty(T), { al: 'right', tam: 11, fondo: false });
      for (const A of [1, 2, 3]) rotulo(String(A), tx(A), gy0 + 0.3, { al: 'center', tam: 11, fondo: false });
      const marca = (atm, T, nom, quien, desde, dx, dy) => {
        const s = suave(tramo(t, desde, desde + 0.1)); if (s <= 0) return;
        punto(tx(atm), ty(T), 0.16 * s, quien === 'olla' ? c.resalta : c.rotulo);
        rotulo(nom, tx(atm) + dx, ty(T) + dy, { tam: 12.5, peso: 700, color: quien === 'olla' ? c.resalta : c.rotulo, escribe: tramo(t, desde + 0.05, desde + 0.2) });
      };
      marca(datos.atmEverest, T_EVEREST, `Everest · ${f0(T_EVEREST)} °C`, 'e', 0.3, 0.3, 0.45);
      marca(1, 100, 'nivel del mar · 100 °C', 'm', 0.5, 0.3, 0.5);
      marca(2, T_OLLA, `olla · ${f0(T_OLLA)} °C`, 'olla', 0.7, -3.5, -0.1);
    }

    // paso 6: la cuenta de Clausius-Clapeyron y el calentamiento
    function cuentas() {
      v.pantalla();
      const a = suave(tramo(t, 0.05, 0.2)); g.globalAlpha = a; v.panel(0.8, 0.8, 14.4, 5.6); g.globalAlpha = 1;
      if (a <= 0) return;
      rotulo('ΔH = L · M = 2257 kJ/kg · 0,018 kg/mol = 40,66 kJ/mol', 1.3, 1.7, { tam: 13.5, fondo: false, peso: 600, escribe: tramo(t, 0.15, 0.35) });
      rotulo('1/T₂ = 1/373,15 − (8,314 / 40 660) · ln 2', 1.3, 2.9, { tam: 13.5, fondo: false, escribe: tramo(t, 0.35, 0.55) });
      rotulo(`T₂ = ${f0(T_OLLA + 273.15)} K = ${f0(T_OLLA)} °C`, 1.3, 4.1, { tam: 15, fondo: false, peso: 700, color: c.termo, escribe: tramo(t, 0.55, 0.7) });
      rotulo(`Q = 1 · 4180 · 101 = ${f0(Q / 1000)} kJ  →  t = ${f0(tOlla)} s con 2000 W`, 1.3, 5.4, { tam: 13.5, fondo: false, peso: 600, color: c.resalta, escribe: tramo(t, 0.7, 0.95) });
    }
  }

  const COLORES = ['pared', 'azulejo', 'encimera', 'cielo', 'cielo-alto', 'monte', 'monte-2', 'nieve', 'olla', 'tapa', 'agua', 'vapor', 'llama', 'termo', 'resalta', 'rotulo', 'barra', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnCalorimetria };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: OllaPresion.pasos, dibuja: OllaPresion.dibuja, colores: OllaPresion.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); OllaPresion.abrirEnCalorimetria(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = OllaPresion;
