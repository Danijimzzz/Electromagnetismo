/* =====================================================================
   La tensión de paso: los 6 pasos de la animación (texto y dibujo) y la
   escena que se abre en Electrostática (el suelo conduce como el vacío con
   una carga: la corriente I que entra en el suelo hace de carga puntual,
   con k·q = ρ·I/(2π), así que el potencial V = ρI/(2πr) es el de Coulomb).
   El motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/tension-paso.js.
   ===================================================================== */
const TensionPaso = (() => {
  // modelo: un cable de 1000 A caído en suelo de arcilla húmeda (100 Ω·m), pasos de 1 m, cuerpo de 1000 Ω y cada pie
  // como una placa de 8 cm de radio (resistencia de contacto 3ρ)
  const I = 1000, RHO = 100, D = 1, RCUERPO = 1000, K = 8.9875517923e9;
  const kq = (RHO * I) / (2 * Math.PI);
  const V = (r) => kq / r, paso = (r, d = D) => V(r) - V(r + d), Rtotal = RCUERPO + 6 * RHO, Icuerpo = (r, d = D) => paso(r, d) / Rtotal;
  const datos = { I, RHO, D, RCUERPO, Rtotal, kq, q: kq / K, V1: V(1), V2: V(2), V10: V(10), paso1: paso(1), paso10: paso(10), paso20: paso(20), paso50: paso(50), I1: Icuerpo(1), I10: Icuerpo(10), I20: Icuerpo(20), J1: I / (2 * Math.PI) };
  const num = (x, c) => x.toFixed(c).replace('.', ',');
  const tension = (x) => (x >= 1000 ? `${num(x / 1000, 1)} kV` : x >= 10 ? `${num(x, 0)} V` : `${num(x, 1)} V`);
  const corriente = (x) => (x >= 1 ? `${num(x, x >= 10 ? 0 : 1)} A` : x >= 1e-3 ? `${num(x * 1e3, x >= 0.01 ? 0 : 1)} mA` : `${num(x * 1e6, 0)} µA`);

  const pasos = [
    { titulo: 'Un cable caído en el campo', corto: 'Cable', dato: { valor: '1 000 A', texto: 'entran en el suelo por el punto donde toca el cable.' }, texto: 'Una tormenta tumba un poste y el cable de alta tensión cae al suelo sin soltarse de la línea. Es lo que se llama un defecto a tierra: el cable sigue con tensión y toda su corriente busca un camino hacia la tierra.\n\nParece que no pasa nada, pero alguien que se acerque andando está a punto de meterse en un campo eléctrico que no se ve. Lo mismo ocurre al lado de un árbol alcanzado por un rayo o de la toma de tierra de una subestación.' },
    { titulo: 'La corriente se reparte por el suelo', corto: 'Corriente', dato: { valor: 'J = I/(2πr²)', texto: 'es la densidad de corriente a una distancia r del punto de contacto.' }, texto: 'El suelo no es un aislante: conduce, aunque mal. La corriente que entra por un punto se abre en todas direcciones, como semiesferas que crecen.\n\nA una distancia $r$ toda la corriente atraviesa una semiesfera de área $2πr^2$, así que la densidad de corriente es $J = {I}/{2πr^2}$. Cuanto más lejos, más repartida y más débil: a 1 m son $J = 159 "A/m"^2$ y a 10 m, solo $1,6 "A/m"^2$.' },
    { titulo: 'El potencial baja al alejarte', corto: 'Potencial', dato: { valor: 'V(1 m) = 15,9 kV', texto: 'respecto de un punto muy lejano, junto al cable caído.' }, texto: 'Para que la corriente avance por el suelo hace falta un campo $E = ρJ$, y el suelo cerca del cable está a un potencial más alto que el lejano. Integrando desde $r$ hasta el infinito:\n\n$V(r) = {ρ I}/{2π r}$\n\nCon $ρ = 100 "Ω·m"$ (arcilla húmeda) e $I = 1000 "A"$ queda $V = 15,9 "kV·m"/r$: 15,9 kV a 1 m, 8,0 kV a 2 m, 1,6 kV a 10 m. Es la misma fórmula que el potencial de una carga puntual, con ρI/2π en lugar de $kq$.' },
    { titulo: 'Un paso, dos potenciales', corto: 'Paso', dato: { valor: 'ΔV ≈ 8 kV', texto: 'entre un pie a 1 m del cable y el otro a 2 m.' }, texto: 'Si andas, tus pies pisan puntos del suelo a distinto potencial. Con un pie a 1 m del cable y el otro a 2 m, un paso de 1 m:\n\n$ΔV = V(1) − V(2) = 15,9 − 8,0 ≈ 8 "kV"$\n\nEsa es la tensión de paso. Es mayor cuanto más cerca estés (el potencial cae muy deprisa junto al cable) y cuanto más largo sea tu paso. A 10 m ya es de $ΔV = V(10) − V(11) ≈ 145 "V"$.' },
    { titulo: 'La corriente que pasa por tu cuerpo', corto: 'Cuerpo', dato: { valor: 'unos 5 A', texto: 'por el cuerpo con un pie a 1 m: mortal. A 10 m, unos 90 mA.' }, texto: 'Tus piernas, de pie a pie, son una resistencia de unos $1000 "Ω"$, y cada pie en contacto con el suelo añade $3ρ = 300 "Ω"$. En total $R = 1000 + 2 · 300 = 1600 "Ω"$.\n\nLa corriente es $I = ΔV/R$: a 1 m, $8 "kV"/1600 "Ω" ≈ 5 "A"$; a 10 m, $145 "V"/1600 "Ω" ≈ 90 "mA"$; a 20 m, unos 24 mA. Desde unos 30 mA se puede parar la respiración, y entre 50 y 100 mA, el corazón fibrila.\n\nLa corriente de pie a pie no pasa por el corazón, pero los músculos se contraen, te caes y entonces el camino ya cruza el pecho.' },
    { titulo: 'Cómo salir: pies juntos', corto: 'Salir', dato: { valor: 'pies juntos → ΔV ≈ 0', texto: 'si los dos pies están al mismo potencial, no pasa corriente de uno al otro.' }, texto: 'La tensión de paso depende de la distancia entre los pies, así que la solución es juntarlos. Si los dos pies pisan a la vez puntos a la misma distancia del cable, están al mismo potencial y no pasa corriente por las piernas.\n\nSi te ves en una zona así, quédate quieto con los pies juntos o aléjate a saltitos con los pies juntos, o dando pasos de pingüino, muy cortos, sin separar un pie del otro. Y avisa a los demás de que no se acerquen. Los animales de cuatro patas sufren más: sus patas están más separadas y la corriente les cruza el pecho.', dura: 12000 },
  ];

  // escena del simulador de electrostática (formato de electro-sim-cur-v2): una carga puntual con k·q = ρI/(2π) en el SI;
  // el potencial V = kq/r de Coulomb es el del suelo, y la tensión de paso es V_B − V_A entre los pies
  const l4 = (x) => x.toPrecision(4);
  const escenaElectrostatica = () => ({
    unit: 'a', mode: 'si', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null,
    sources: [{ id: 'contacto', type: 'point', name: 'q', pos: ['0', '0', '0'], s: { c: l4(datos.q), sym: '' } }],
    analyses: [
      { id: 'paso-1', type: 'dV', A: ['2', '0', '0'], B: ['1', '0', '0'] },
      { id: 'paso-10', type: 'dV', A: ['11', '0', '0'], B: ['10', '0', '0'] },
      { id: 'e-1', type: 'E', P: ['1', '0', '0'] },
    ],
  });
  const ejercicio = () => ({
    ref: { kind: 'preset', id: 'fenomeno-tension-paso' }, title: 'La tensión de paso junto a un cable caído',
    statement: `Un cable de alta tensión cae al suelo y le entran I = 1000 A. El suelo es homogéneo, de resistividad ρ = 100 Ω·m, y la corriente se reparte en semiesferas, así que el potencial a una distancia r es V = ρI/(2πr), igual al de una carga puntual con k·q = ρI/(2π), es decir, q = ${l4(datos.q * 1e6).replace('.', ',')} µC. Obtener la tensión de paso (diferencia de potencial entre los pies, separados 1 m) cuando el pie más cercano está a 1 m del punto de contacto y a 10 m, y el campo eléctrico a 1 m.`,
    scene: escenaElectrostatica(),
  });
  // escribe el ejercicio en el estado de Electrostática y la abre
  function abrirEnElectrostatica(destino) {
    try { localStorage.setItem('electro-sim-cur-v2', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // 0,4 unidades del dibujo por metro; el cable toca el suelo en CONTACTO
  const SUELO = 4.2, S = 0.4, CONTACTO = 2.6, MAXR = 30, cam = { x: 8, y: 4.5, z: 1 };
  const xr = (r) => CONTACTO + r * S;
  // «Pruébalo tú» del paso 4: distancia del pie más cercano al punto de contacto, en metros
  const prueba = { etiqueta: 'la distancia del pie más cercano al cable', min: 1, max: 30, paso: 1, valor: 1, r: 1,
    muestra: (r) => `${r} m → ΔV = ${tension(paso(r))}, por el cuerpo ${corriente(Icuerpo(r))}`,
    cambia: (r) => { prueba.r = r; } };
  pasos[3].prueba = prueba;

  function dibuja(g, { paso: p, t, reloj, w, h, c, quieto }) {
    const r = prueba.r;
    const meta = p === 3 || p === 4 ? { x: xr(r + 0.5) + 0.4, y: 3.6, z: 2.1 } : p === 5 ? { x: xr(2.5), y: 3.7, z: 1.6 } : { x: 8, y: 4.5, z: 1 };
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(meta, reloj, quieto);
    const { X, Y, rotulo, punto, flecha } = v;

    paisaje();
    if (p >= 1) corrientes();
    if (p >= 2) potencial();
    poste();
    persona();
    if (p === 3 || p === 4) pies();
    v.pantalla();
    rotulos();

    function paisaje() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = c.colina; g.beginPath(); g.moveTo(X(v.x0 - 1), Y(SUELO));
      for (let x = v.x0 - 1; x <= v.x1 + 1; x += 0.3) g.lineTo(X(x), Y(SUELO - 0.7 - 0.5 * Math.sin(x * 0.6) - 0.25 * Math.sin(x * 1.7)));
      g.lineTo(X(v.x1 + 1), Y(SUELO)); g.closePath(); g.fill();
      const tg = g.createLinearGradient(0, Y(SUELO), 0, Y(9)); tg.addColorStop(0, c.tierra); tg.addColorStop(1, c['tierra-honda']);
      g.fillStyle = tg; g.fillRect(0, Y(SUELO), w, Math.max(0, h - Y(SUELO)));
      g.fillStyle = c.hierba; g.fillRect(0, Y(SUELO), w, 0.16 * v.K);
      g.strokeStyle = c.hierba; g.lineWidth = Math.max(1, 0.025 * v.K); g.beginPath();
      for (let k = 0; k < 160; k++) { const x = v.x0 - 1 + k * 0.2 + 0.1 * azar(k); g.moveTo(X(x), Y(SUELO)); g.lineTo(X(x + 0.04), Y(SUELO - 0.1 - 0.08 * azar(k + 9))); }
      g.stroke();
    }
    // poste inclinado y cable que cuelga hasta el suelo
    function poste() {
      g.strokeStyle = c.poste; g.lineWidth = Math.max(2, 0.12 * v.K); g.lineCap = 'round';
      g.beginPath(); g.moveTo(X(-0.4), Y(SUELO)); g.lineTo(X(-1.1), Y(1.3)); g.stroke();
      g.strokeStyle = c.cable; g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath(); g.moveTo(X(-1.1), Y(1.3));
      for (let s = 0.05; s <= 1.001; s += 0.05) g.lineTo(X(-1.1 + (CONTACTO + 1.1) * s), Y(1.3 + (SUELO - 1.3) * (1 - (1 - s) ** 2.2) + 0.15 * Math.sin(s * 9) * (1 - s)));
      g.stroke(); g.lineCap = 'butt';
      // chispa en el contacto
      if (!quieto) { const n = Math.floor(reloj * 20); g.globalCompositeOperation = 'lighter'; v.chispa(CONTACTO - 0.12, SUELO - 0.15, CONTACTO + 0.1, SUELO, n, rgba(c['chispa-centro'], 0.8), 0.03, 4); g.globalCompositeOperation = 'source-over'; }
    }
    // la corriente: partículas que salen del contacto en semicírculos que se abren
    function corrientes() {
      const a = p === 1 ? suave(tramo(t, 0, 0.3)) : 0.55;
      for (let j = 0; j < 90; j++) {
        const ang = Math.PI * (0.04 + 0.92 * azar(j)), fase = (azar(j + 50) + reloj * 0.12) % 1, rr = 0.2 + fase * 9;
        punto(CONTACTO + rr * Math.cos(ang), SUELO + rr * Math.sin(ang) * 0.9, 0.03, c.corriente, a * (1 - fase) ** 0.6);
      }
      if (p === 1) {
        const s = suave(tramo(t, 0.25, 0.6));
        for (const ang of [0.5, 1.1, 1.6, 2.1, 2.6]) flecha(CONTACTO + 0.4 * Math.cos(ang), SUELO + 0.4 * Math.sin(ang), CONTACTO + 1.5 * Math.cos(ang), SUELO + 1.5 * Math.sin(ang), c.corriente, s, 0.03);
      }
    }
    // paso 3 en adelante: los semicírculos equipotenciales y la curva del potencial sobre el suelo
    function potencial() {
      const a = p === 2 ? suave(tramo(t, 0, 0.3)) : p >= 3 ? 1 : 0, curva = (x) => SUELO - 0.15 - (kq / Math.max(0.6, (x - CONTACTO) / S) / V(1)) * 2.4;
      g.lineWidth = Math.max(1, 0.025 * v.K);
      for (const m of [1, 2, 4, 7, 11, 17, 25]) { g.strokeStyle = rgba(c.alta, 0.5 * a); g.beginPath(); g.arc(X(CONTACTO), Y(SUELO), m * S * v.K, 0, Math.PI); g.stroke(); }
      // curva V(r)
      g.fillStyle = rgba(c.alta, 0.16 * a); g.beginPath(); g.moveTo(X(xr(0.6)), Y(SUELO - 0.15));
      for (let x = xr(0.6); x <= xr(MAXR) + 1e-9; x += 0.05) g.lineTo(X(x), Y(curva(x)));
      g.lineTo(X(xr(MAXR)), Y(SUELO - 0.15)); g.closePath(); g.fill();
      g.strokeStyle = rgba(c.alta, a); g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let x = xr(0.6); x <= xr(MAXR) + 1e-9; x += 0.05) x === xr(0.6) ? g.moveTo(X(x), Y(curva(x))) : g.lineTo(X(x), Y(curva(x)));
      g.stroke();
      potencial.curva = curva;
    }
    // una persona de palo con los pies en xa y xb (m del dibujo) y el cuerpo entre ellos
    function figura(xa, xb, e = 1, color = c.persona) {
      const xm = (xa + xb) / 2, cad = SUELO - 0.5 * e, hom = SUELO - 0.98 * e;
      g.strokeStyle = color; g.lineWidth = Math.max(2, 0.07 * v.K * e); g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(X(xa), Y(SUELO - 0.02)); g.lineTo(X(xm), Y(cad)); g.lineTo(X(xb), Y(SUELO - 0.02)); g.moveTo(X(xm), Y(cad)); g.lineTo(X(xm), Y(hom));
      g.moveTo(X(xm - 0.25 * e), Y(cad - 0.25 * e)); g.lineTo(X(xm), Y(hom + 0.08 * e)); g.lineTo(X(xm + 0.25 * e), Y(cad - 0.25 * e)); g.stroke();
      g.fillStyle = c.piel; g.beginPath(); g.arc(X(xm), Y(hom - 0.14 * e), 0.14 * e * v.K, 0, 2 * Math.PI); g.fill(); g.lineCap = 'butt';
    }
    function persona() {
      if (p === 0) { const x = xr(14) - 5 * suave(tramo(t, 0.2, 0.9)); figura(x - 0.12, x + 0.12, 1.25); }
      if (p === 5) {
        // a saltitos con los pies juntos, alejándose
        const u = tramo(t, 0.15, 0.9), x = xr(2) + 4 * suave(u), salto = quieto ? 0 : Math.abs(Math.sin(u * 14)) * 0.12 * (u > 0 && u < 1 ? 1 : 0);
        g.save(); g.translate(0, -salto * v.K); figura(x - 0.03, x + 0.03, 1.25); g.restore();
      }
      if (p === 3 || p === 4) figura(xr(r), xr(r + D), 1.25, p === 4 ? c.persona : c.persona);
    }
    // pasos 4 y 5: potencial de cada pie, tensión de paso y corriente
    function pies() {
      const xa = xr(r), xb = xr(r + D), ya = SUELO + 0.1;
      for (const [x, rr] of [[xa, r], [xb, r + D]]) { punto(x, SUELO, 0.07, c.alta); }
      // llaves de tensión por debajo del suelo
      g.strokeStyle = c.alta; g.lineWidth = Math.max(1.5, 0.03 * v.K); g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xa), Y(ya + 0.15)); g.lineTo(X(xb), Y(ya + 0.15)); g.lineTo(X(xb), Y(ya)); g.stroke();
      const dv = paso(r);
      if (p === 3) {
        rotulo(tension(V(r)), xa - 0.05, SUELO - 1.75, { al: 'right', tam: 11.5, peso: 600, color: c.alta, escribe: tramo(t, 0.1, 0.3) });
        rotulo(tension(V(r + D)), xb + 0.05, SUELO - 1.75, { al: 'left', tam: 11.5, peso: 600, color: c.alta, escribe: tramo(t, 0.25, 0.45) });
        rotulo(`ΔV = ${tension(dv)}`, (xa + xb) / 2, ya + 0.5, { al: 'center', tam: 13.5, peso: 700, color: c.resalta, escribe: tramo(t, 0.5, 0.8) });
      }
      if (p === 4) {
        const i = Icuerpo(r), peligro = i >= 0.05 ? c.resalta : i >= 0.01 ? c.corriente : c.persona;
        rotulo(`I = ΔV/R = ${tension(dv)} / 1600 Ω`, (xa + xb) / 2, ya + 0.5, { al: 'center', tam: 12.5, peso: 600, escribe: tramo(t, 0.1, 0.4) });
        rotulo(`I = ${corriente(i)}`, (xa + xb) / 2, ya + 0.85, { al: 'center', tam: 14, peso: 700, color: peligro, escribe: tramo(t, 0.4, 0.7) });
        // la corriente baja por una pierna, cruza y sube por la otra
        if (!quieto) for (let j = 0; j < 8; j++) { const s = (j / 8 + reloj * 0.5) % 1; const x = s < 0.2 ? xa : s > 0.8 ? xb : xa + (xb - xa) * ((s - 0.2) / 0.6); const y = s < 0.2 ? SUELO - 0.8 + s * 4 : s > 0.8 ? SUELO - (s - 0.8) * 4 : SUELO - 0; punto(x, Math.min(SUELO, y), 0.04, c.corriente, 0.9); }
      }
    }
    function rotulos() {
      if (p === 0) { rotulo('cable caído, con tensión', 0.4, 1.2, { peso: 600, color: c.resalta, escribe: tramo(t, 0.1, 0.4) }); rotulo('¿es seguro acercarse?', 11.5, 3.2, { al: 'center', peso: 700, escribe: tramo(t, 0.5, 0.8) }); }
      if (p === 1) rotulo('I = 1000 A', CONTACTO + 0.2, SUELO + 2.9, { peso: 700, color: c.corriente, escribe: tramo(t, 0.5, 0.8) });
      if (p === 2) {
        const f = potencial.curva;
        for (const [m, a, b] of [[1, 0.15, 0.3], [2, 0.3, 0.45], [5, 0.45, 0.6], [10, 0.6, 0.75]]) rotulo(`${m} m: ${tension(V(m))}`, xr(m) + 0.12, Math.min(f(xr(m)) - 0.2, SUELO - 0.45), { tam: 11.5, peso: 600, color: c.alta, escribe: tramo(t, a, b) });
        rotulo('V(r) = ρI/(2πr)', 14.8, 1.3, { al: 'right', peso: 700, tam: 14, escribe: tramo(t, 0.7, 0.95) });
      }
      if (p === 3) { rotulo('un paso: 1 m', 14.8, 0.8, { al: 'right', tam: 12, escribe: tramo(t, 0.05, 0.2) }); }
      if (p === 5) {
        rotulo('pies juntos: ΔV ≈ 0', 9.5, 2.1, { al: 'center', peso: 700, tam: 14, color: c.corriente, escribe: tramo(t, 0.55, 0.85) });
        rotulo('a saltitos, con los pies juntos', 9.5, 2.6, { al: 'center', tam: 12.5, escribe: tramo(t, 0.7, 0.95) });
      }
    }
  }

  const COLORES = ['cielo', 'cielo-alto', 'colina', 'hierba', 'tierra', 'tierra-honda', 'poste', 'cable', 'corriente', 'resalta', 'alta', 'persona', 'piel', 'chispa-centro', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, escenaElectrostatica, ejercicio, abrirEnElectrostatica, V, paso, Icuerpo };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: TensionPaso.pasos, dibuja: TensionPaso.dibuja, colores: TensionPaso.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); TensionPaso.abrirEnElectrostatica(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = TensionPaso;
