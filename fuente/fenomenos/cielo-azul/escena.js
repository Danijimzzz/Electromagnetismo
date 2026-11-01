/* =====================================================================
   El cielo azul: los 6 pasos de la animación (texto y dibujo) y el
   ejercicio que se abre en Ondas electromagnéticas (la luz azul de
   450 nm: frecuencia, número de onda y campo). La dispersión de Rayleigh
   es I ∝ 1/λ⁴. El motor es fenomenos/animacion.js, los ayudantes de
   dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas)
   solo se cargan los datos: pruebas/herramientas/fenomenos/cielo-azul.js.
   ===================================================================== */
const CieloAzul = (() => {
  // modelo: azul 450 nm, rojo 700 nm, molécula de N₂ de unos 0,3 nm; espesor óptico de Rayleigh vertical τ(550 nm) = 0,097 y masa de aire 38 con el Sol en el horizonte
  const C = 2.998e8, L_AZUL = 450e-9, L_ROJO = 700e-9, L_VIOLETA = 400e-9, D_MOL = 0.3e-9, TAU550 = 0.097, M_HORIZONTE = 38;
  const rel = (nm) => (700 / nm) ** 4, tau = (nm) => TAU550 * (550 / nm) ** 4, trans = (nm, m) => Math.exp(-tau(nm) * m);
  const datos = { C, L_AZUL, L_ROJO, D_MOL, veces: L_AZUL / D_MOL, azulRojo: rel(450), violetaRojo: rel(400), fAzul: C / L_AZUL, kAzul: (2 * Math.PI) / L_AZUL,
    tauAzul: tau(450), tauRojo: tau(700), azulCenit: trans(450, 1), rojoCenit: trans(700, 1), azulHorizonte: trans(450, M_HORIZONTE), rojoHorizonte: trans(700, M_HORIZONTE), M_HORIZONTE };
  const f0 = (x) => String(Math.round(x)), f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ','), pc = (x) => (x * 100 >= 10 ? f0(x * 100) : x * 100 >= 1 ? f1(x * 100) : f2(x * 100));

  const pasos = [
    { titulo: 'La luz del Sol es de todos los colores', corto: 'Sol', dato: { valor: '400 – 700 nm', texto: 'es el intervalo de longitudes de onda que ve el ojo, del violeta al rojo.' }, texto: 'La luz del Sol es una mezcla de ondas electromagnéticas de muchas longitudes de onda a la vez. El ojo ve las comprendidas entre unos 400 nm (violeta) y unos 700 nm (rojo); juntas se ven blancas.\n\nTodas viajan a la misma velocidad en el vacío, $c = λ f = 3·10^8 "m/s"$, pero cada color tiene su $λ$: la onda azul mide unos 450 nm y la roja, unos 700 nm.' },
    { titulo: 'Las moléculas del aire son diminutas', corto: 'Moléculas', dato: { valor: '1500 veces', texto: 'más larga que una molécula de aire es la onda de luz azul (450 nm frente a 0,3 nm).' }, texto: 'El aire es sobre todo nitrógeno y oxígeno, y sus moléculas miden unos $0,3 "nm"$: mil quinientas veces menos que la longitud de onda de la luz azul. Para la onda, cada molécula es un punto.\n\nEl campo eléctrico de la luz tira del núcleo hacia un lado y de la nube de electrones hacia el otro, y los separa un poquito: la molécula se convierte en un dipolo $p = α E$ que oscila a la frecuencia de la luz, $f = c/λ = 6,7·10^14 "Hz"$ para el azul.' },
    { titulo: 'Un dipolo que oscila emite luz hacia todos lados', corto: 'Rayleigh', dato: { valor: 'I ∝ 1/λ⁴', texto: 'la luz azul se dispersa muchísimo más que la roja.' }, texto: 'Una carga que oscila radia una onda en todas direcciones, menos a lo largo de su eje. La potencia que emite un dipolo es proporcional a $ω^4 p^2$: crece con la cuarta potencia de la frecuencia, o sea decrece con la cuarta potencia de la longitud de onda.\n\nEs la dispersión de Rayleigh, $I ∝ 1/λ^4$. La luz azul no se «refleja» en un sitio: cada molécula la absorbe y la vuelve a emitir hacia los lados, y así llega a tus ojos desde cualquier punto del cielo, no solo desde el Sol.', dura: 10000 },
    { titulo: '¿Por qué azul y no violeta?', corto: 'Azul', dato: { valor: '×5,9 y ×9,4', texto: 'se dispersan el azul (450 nm) y el violeta (400 nm) frente al rojo (700 nm).' }, texto: 'Con $I ∝ 1/λ^4$, el azul (450 nm) se dispersa $(700/450)^4 = 5,9$ veces más que el rojo, y el violeta (400 nm), $(700/400)^4 = 9,4$ veces. Por eso el cielo no es rojo.\n\nEntonces, ¿por qué no es violeta? Porque el Sol emite menos luz violeta que azul, parte de ella la absorbe la alta atmósfera y el ojo es mucho menos sensible al violeta. Lo que llega al ojo es un azul claro, mezclado con algo de verde y violeta.', dura: 11000, },
    { titulo: 'Por qué el atardecer es rojo', corto: 'Atardecer', dato: { valor: '25 % y 0,03 %', texto: 'es la luz roja y la azul del Sol que llegan al observador con el Sol en el horizonte.' }, texto: `Con el Sol en lo alto, la luz cruza una sola capa de aire (masa de aire 1) y pierde poco: llega el ${pc(datos.azulCenit)} % del azul y el ${pc(datos.rojoCenit)} % del rojo. Con el Sol en el horizonte atraviesa unas ${datos.M_HORIZONTE} veces más aire.\n\nLa fracción que sobrevive es $T = e^{−τ m}$, con $τ ∝ 1/λ^4$: del azul llega el ${pc(datos.azulHorizonte)} % y del rojo el ${pc(datos.rojoHorizonte)} %. Al Sol le queda el rojo, y el azul que le falta está iluminando el cielo de otros sitios.` },
    { titulo: 'El cálculo, con la longitud de onda', corto: 'Cálculo', dato: { valor: 'λ = 450 nm', texto: 'es una onda de 6,66·10¹⁴ Hz con k = 1,4·10⁷ rad/m.' }, texto: 'La clave es una razón: $I_"azul"/I_"rojo" = (λ_"rojo"/λ_"azul")^4 = (700/450)^4 = 5,9$. Con la frecuencia es la misma cuenta, $(f_"azul"/f_"rojo")^4$, porque $f = c/λ$.\n\nEn Ondas electromagnéticas se abre la luz azul de 450 nm como dato: la herramienta da su frecuencia $f = 6,66·10^14 "Hz"$, su número de onda $k = 2π/λ = 1,40·10^7 "rad/m"$ y el campo magnético asociado.' },
  ];

  // ejercicio de Ondas electromagnéticas (formato de ondasem-v1): onda plana de luz azul de 450 nm en el vacío
  const ejercicio = () => ({ modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '450e-9', E0: '100', prop: '+x', pol: '+y', er: '', mr: '' });
  function abrirEnOndas(destino) {
    try { localStorage.setItem('ondasem-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // color de una longitud de onda (400 a 700 nm), solo para dibujar el espectro
  const deLongitud = (nm, a = 1) => `hsla(${Math.max(0, 270 - ((nm - 400) / 250) * 270)}, 85%, 52%, ${a})`;
  // «Pruébalo tú» del paso 4: longitud de onda en nm
  const prueba = { etiqueta: 'la longitud de onda', min: 400, max: 700, paso: 10, valor: 450, nm: 450,
    muestra: (nm) => `λ = ${nm} nm → se dispersa ${f1(rel(nm))} veces más que el rojo (700 nm)`,
    cambia: (nm) => { prueba.nm = nm; } };
  pasos[3].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, fase = quieto ? 0 : reloj;
    const atard = paso === 4 ? suave(tramo(t, 0.35, 0.8)) : paso === 5 ? 1 : 0;
    cielo();
    if (paso === 0) luz();
    if (paso === 1) moleculas();
    if (paso === 2) rayleigh();
    if (paso === 3) barras();
    if (paso === 4) atardecer();
    if (paso === 5 && !foto) cuentas();

    function cielo() {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, atard ? mezcla(c['cielo-alto'], c['atardecer-alto'], atard) : c['cielo-alto']); gr.addColorStop(1, atard ? mezcla(c.cielo, c.atardecer, atard) : c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    // mezcla de dos colores «#rrggbb» (a de 0 a 1)
    function mezcla(a, b, k) {
      const p = (s) => { const n = parseInt(s.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }, A = p(a), B = p(b);
      return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * k)).join(',')})`;
    }
    // onda senoidal que avanza hacia la derecha de x0 a x1 (longitud de onda «lam» en unidades del dibujo)
    function onda(x0, x1, y, amp, lam, color, a = 1, ancho = 2.5) {
      if (x1 <= x0) return;
      g.strokeStyle = color; g.globalAlpha = a; g.lineWidth = Math.max(1.5, ancho * (v.k / 60)); g.lineJoin = 'round'; g.beginPath();
      for (let x = x0; x <= x1; x += 0.04) { const yy = y - amp * Math.sin((2 * Math.PI * (x - x0)) / lam - fase * 3.2); x === x0 ? g.moveTo(X(x), Y(yy)) : g.lineTo(X(x), Y(yy)); }
      g.stroke(); g.globalAlpha = 1;
    }
    function sol(x, y, r, a = 1) {
      const gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * 3.2 * v.K); gr.addColorStop(0, rgba(c.sol, 0.55 * a)); gr.addColorStop(1, rgba(c.sol, 0));
      g.fillStyle = gr; g.fillRect(X(x - r * 3.2), Y(y - r * 3.2), r * 6.4 * v.K, r * 6.4 * v.K); punto(x, y, r, c.sol, a);
    }
    // nube de electrones (azul) desplazada «d» respecto del núcleo (rojo)
    function dipolo(x, y, d, r = 0.5) {
      punto(x, y + d, r, c.nube, 0.55); punto(x, y, 0.1, c.resalta);
      if (Math.abs(d) > 0.03) { g.strokeStyle = c.resalta; g.lineWidth = Math.max(1.5, 0.04 * v.K); g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x), Y(y + d)); g.stroke(); }
    }

    // paso 1: tres ondas de colores a la vez y el espectro visible
    function luz() {
      sol(1.4, 2.4, 0.65);
      const a = suave(tramo(t, 0.05, 0.45)), x1 = 2.6 + a * 12.2;
      onda(2.6, x1, 3.0, 0.3, 1.54, deLongitud(700), 0.95); onda(2.6, x1, 3.0, 0.3, 1.21, deLongitud(550), 0.95); onda(2.6, x1, 3.0, 0.3, 0.99, deLongitud(450), 0.95);
      rotulo('luz blanca = todos los colores a la vez', 8.7, 1.45, { al: 'center', peso: 600, escribe: tramo(t, 0.25, 0.5) });
      const b = suave(tramo(t, 0.5, 0.8)); if (b <= 0) return;
      g.globalAlpha = b;
      for (let k = 0; k < 120; k++) { g.fillStyle = deLongitud(400 + (k / 119) * 300); g.fillRect(X(3 + (k / 120) * 10), Y(5.2), (10 / 120) * v.K + 1, 0.7 * v.K); }
      g.globalAlpha = 1;
      rotulo('400 nm', 3, 6.25, { al: 'left', tam: 12 }); rotulo('violeta', 3, 4.85, { al: 'left', tam: 12, fondo: false, peso: 600 });
      rotulo('700 nm', 13, 6.25, { al: 'right', tam: 12 }); rotulo('rojo', 13, 4.85, { al: 'right', tam: 12, fondo: false, peso: 600 });
      rotulo('longitud de onda λ', 8, 6.25, { al: 'center', tam: 12, escribe: tramo(t, 0.75, 0.95) });
    }
    // paso 2: una onda azul mueve la nube de electrones de una molécula
    function moleculas() {
      const a = suave(tramo(t, 0, 0.35)), x1 = 0.6 + a * 6.6;
      onda(0.6, x1, 4.2, 0.45, 1.0, deLongitud(450), 1);
      v.flecha(0.8, 5.6, 7.2, 5.6, c.rotulo, 0.4 * a, 0.02);
      rotulo('luz azul', 3.2, 5.9, { al: 'center', tam: 12, fondo: false, escribe: tramo(t, 0.15, 0.4) });
      const d = 0.28 * Math.sin(fase * 3.2 * 1.0 - 7.2 * 2 * Math.PI / 1.0) * a;
      dipolo(9.6, 4.2, d, 0.7);
      rotulo('núcleo (+)', 11.2, 4.2, { al: 'left', tam: 12, escribe: tramo(t, 0.4, 0.6) });
      rotulo('nube de electrones (−)', 11.2, 3.5, { al: 'left', tam: 12, color: c.nube, peso: 600, escribe: tramo(t, 0.5, 0.7) });
      // bracket de una longitud de onda y comparación de tamaños
      const e = tramo(t, 0.6, 0.9);
      if (e > 0) {
        g.globalAlpha = e; g.strokeStyle = c.rotulo; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(2.0), Y(7.1)); g.lineTo(X(2.0), Y(7.3)); g.lineTo(X(3.0), Y(7.3)); g.lineTo(X(3.0), Y(7.1)); g.stroke(); g.globalAlpha = 1;
        rotulo('λ = 450 nm', 2.5, 7.75, { al: 'center', tam: 12 });
        punto(9.6, 7.2, 0.05, c.nube, e); rotulo('molécula ≈ 0,3 nm: 1500 veces más pequeña (sin escala)', 9.3, 7.75, { al: 'left', tam: 12 });
      }
    }
    // paso 3: anillos de luz dispersada por una molécula con luz azul y por otra con luz roja
    function rayleigh() {
      const a = suave(tramo(t, 0, 0.2));
      const molecula = (x, y, nm, escala) => {
        v.flecha(x - 3.2, y, x - 0.85, y, deLongitud(nm), 0.9 * a, 0.05);
        dipolo(x, y, 0.1 * Math.sin(fase * 6 + x) * a * escala + 0.0001, 0.35);
        const sp = 0.9 * (nm / 450), R = 3.1; g.lineWidth = Math.max(1.5, 0.035 * v.K);
        for (let k = 0; k < 4; k++) {
          const r = ((fase * 1.1 + k * sp) % (4 * sp)) / (4 * sp) * R + 0.4;
          for (let s = 0; s < 36; s++) {
            const an = (s / 36) * 2 * Math.PI, an2 = ((s + 1) / 36) * 2 * Math.PI, med = (an + an2) / 2, patron = Math.cos(med) ** 2 * 0.85 + 0.15, vida = (1 - (r - 0.4) / R);
            g.strokeStyle = deLongitud(nm, Math.max(0, 0.95 * escala * patron * vida * a)); g.beginPath(); g.arc(X(x), Y(y), r * v.K, an, an2); g.stroke();
          }
        }
      };
      molecula(4.6, 4.2, 450, 1); molecula(11.7, 4.2, 700, 1 / rel(450));
      rotulo('azul, 450 nm: dispersa mucho', 4.6, 0.9, { al: 'center', peso: 700, tam: 12.5, color: deLongitud(450), escribe: tramo(t, 0.3, 0.55) });
      rotulo('rojo, 700 nm: casi nada', 11.7, 0.9, { al: 'center', peso: 700, tam: 12.5, color: deLongitud(700), escribe: tramo(t, 0.5, 0.75) });
      rotulo('el azul sale hacia los lados 5,9 veces más fuerte', 8, 7.9, { al: 'center', tam: 12.5, escribe: tramo(t, 0.75, 1) });
    }
    // paso 4: lo que se dispersa cada color frente al rojo (1/λ⁴ relativa)
    function barras() {
      const x0 = 1.2, x1 = 14.8, y0 = 7.4, alto = 5.6, lams = [400, 450, 500, 550, 600, 650, 700], ancho = (x1 - x0) / lams.length;
      v.panel(0.5, 0.45, 15, 8.1, 0.9);
      lams.forEach((nm, k) => {
        const e = suave(tramo(t, 0.05 + k * 0.08, 0.3 + k * 0.08)), hh = (rel(nm) / rel(400)) * alto * e;
        g.fillStyle = deLongitud(nm); g.fillRect(X(x0 + k * ancho + 0.25), Y(y0 - hh), (ancho - 0.5) * v.K, hh * v.K);
        rotulo(`${nm} nm`, x0 + k * ancho + ancho / 2, y0 + 0.4, { al: 'center', tam: 11.5, fondo: false });
        if (e > 0.9) rotulo(`×${f1(rel(nm))}`, x0 + k * ancho + ancho / 2, y0 - hh - 0.3, { al: 'center', tam: 12, peso: 700, fondo: false });
      });
      // marcador del deslizador «Pruébalo tú»
      const mx = x0 + ((prueba.nm - 400) / 300) * (lams.length - 1) * ancho + ancho / 2, ry = y0 - (rel(prueba.nm) / rel(400)) * alto;
      g.strokeStyle = c.rotulo; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(mx), Y(ry)); g.lineTo(X(mx), Y(y0)); g.stroke(); g.setLineDash([]);
      punto(mx, ry, 0.12, c.rotulo);
      rotulo('dispersión relativa 1/λ⁴ (el rojo, 700 nm, vale ×1)', 8, 1.15, { al: 'center', tam: 12.5, fondo: false, peso: 600 });
    }
    // paso 5: el Sol cruza más aire cuanto más bajo está
    function atardecer() {
      const R = 9.5, cx = 8, cy = 16.5, grosor = 1.2, ob = [8, cy - R - 0.05];
      // atmósfera (capa de aire exagerada) y suelo
      g.fillStyle = rgba(c.aire, 0.5); g.beginPath(); g.arc(X(cx), Y(cy), (R + grosor) * v.K, 0, 2 * Math.PI); g.fill();
      g.fillStyle = c.suelo; g.beginPath(); g.arc(X(cx), Y(cy), R * v.K, 0, 2 * Math.PI); g.fill();
      // el Sol baja del cenit al horizonte
      const b = suave(tramo(t, 0.3, 0.75)), sx = 0.7, sy = 1.4 + (ob[1] - 0.05 - 1.4) * b;
      // rayo vertical (cenit): corto
      v.flecha(8, 0.3, ob[0], ob[1] - 0.15, c.sol, 0.8 * (1 - b), 0.05);
      // rayo del Sol bajo: va de blanco a rojo
      const gr = g.createLinearGradient(X(sx), 0, X(ob[0]), 0); gr.addColorStop(0, c.sol); gr.addColorStop(0.45, c.sol); gr.addColorStop(1, deLongitud(700));
      g.strokeStyle = gr; g.lineWidth = Math.max(3, 0.1 * v.K); g.globalAlpha = 0.5 + 0.5 * b; g.beginPath(); g.moveTo(X(sx), Y(sy)); g.lineTo(X(ob[0]), Y(ob[1] - 0.1)); g.stroke(); g.globalAlpha = 1;
      sol(sx, sy, 0.5);
      // observador
      g.fillStyle = c.rotulo; g.beginPath(); g.moveTo(X(ob[0] - 0.14), Y(ob[1] + 0.05)); g.lineTo(X(ob[0]), Y(ob[1] - 0.4)); g.lineTo(X(ob[0] + 0.14), Y(ob[1] + 0.05)); g.closePath(); g.fill();
      rotulo('observador', ob[0], ob[1] + 0.55, { al: 'center', tam: 11.5, fondo: false });
      rotulo('la capa de aire está exagerada', 8, 8.65, { al: 'center', tam: 11, fondo: false });
      if (foto) return;
      // cuadro de la fracción de luz que llega
      const p = suave(tramo(t, 0.15, 0.4));
      g.globalAlpha = p; v.panel(8.6, 0.3, 7.1, 3.3); g.globalAlpha = 1;
      if (p <= 0) return;
      rotulo('luz que llega al observador', 8.9, 0.75, { tam: 12, fondo: false, peso: 600, escribe: p });
      const fila = (y, nom, tz, th, nm) => {
        rotulo(nom, 8.9, y + 0.2, { tam: 12, fondo: false, peso: 700, color: deLongitud(nm), escribe: p });
        g.fillStyle = deLongitud(nm, 0.4); g.fillRect(X(10.1), Y(y - 0.12), Math.max(1.5, tz * 3.2 * v.K * p), 0.26 * v.K);
        g.fillStyle = deLongitud(nm); g.fillRect(X(10.1), Y(y + 0.22), Math.max(1.5, th * 3.2 * v.K * suave(tramo(t, 0.55, 0.85))), 0.26 * v.K);
        rotulo(`${pc(tz)} % con el Sol alto`, 13.4, y, { tam: 11, fondo: false, al: 'left', escribe: p });
        rotulo(`${pc(th)} % en el horizonte`, 13.4, y + 0.45, { tam: 11, fondo: false, al: 'left', peso: 700, escribe: tramo(t, 0.6, 0.85) });
      };
      fila(1.5, 'azul', datos.azulCenit, datos.azulHorizonte, 450); fila(2.6, 'rojo', datos.rojoCenit, datos.rojoHorizonte, 700);
    }
    // paso 6: la cuenta
    function cuentas() {
      v.panel(1.5, 1.2, 13, 5.2); const o = 2.1;
      rotulo('I ∝ 1/λ⁴', o, 2.2, { tam: 17, fondo: false, peso: 700, escribe: tramo(t, 0.1, 0.3) });
      rotulo('I(azul) / I(rojo) = (700 / 450)⁴', o, 3.3, { tam: 15, fondo: false, escribe: tramo(t, 0.3, 0.55) });
      rotulo(`= ${f1(datos.azulRojo)} veces`, o, 4.3, { tam: 17, fondo: false, peso: 700, color: c.resalta, escribe: tramo(t, 0.55, 0.75) });
      rotulo('f = c / λ = 3·10⁸ / 450·10⁻⁹ = 6,66·10¹⁴ Hz', o, 5.5, { tam: 14, fondo: false, escribe: tramo(t, 0.75, 1) });
    }
  }

  const COLORES = ['cielo', 'cielo-alto', 'atardecer', 'atardecer-alto', 'sol', 'nube', 'aire', 'suelo', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnOndas, rel, tau, trans };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: CieloAzul.pasos, dibuja: CieloAzul.dibuja, colores: CieloAzul.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); CieloAzul.abrirEnOndas(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = CieloAzul;
