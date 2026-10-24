/* =====================================================================
   Dinámica y diagramas de fuerzas (sin DOM): bloque en un plano
   (horizontal o inclinado) con rozamiento estático y dinámico, una fuerza
   aplicada con ángulo y, si se quiere, una masa colgando de una polea en lo
   alto del plano; y máquina de Atwood con polea con masa. Parte del reposo.
   Eje x a lo largo del plano, positivo plano arriba (hacia la polea).
   ===================================================================== */
const Dinamica = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-9) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  function lee(sc, k, nom, { opcional = false, min = 0, estricto = false, max = Infinity } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (estricto ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${estricto ? 'mayor que' : 'como mínimo'} ${f(min)}`);
    if (v > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no puede pasar de ${f(max)}`);
    return v;
  }
  // a·b con paréntesis si b es negativo
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));

  /* ---------- Bloque en un plano ---------- */
  // sc: { m1 (kg), theta (°), mus, muk, F (N), alfa (° sobre el plano), m2 (kg, colgando; vacío = no hay), d (m, opcional), g }
  function plano(sc) {
    const g = lee(sc, 'g', 'la gravedad', { estricto: true });
    const m1 = lee(sc, 'm1', 'la masa del bloque', { estricto: true }), th = lee(sc, 'theta', 'el ángulo del plano', { max: 90 });
    const mus = lee(sc, 'mus', 'el coeficiente de rozamiento estático', { opcional: true }) ?? 0, muk = lee(sc, 'muk', 'el coeficiente de rozamiento dinámico', { opcional: true }) ?? 0;
    if (muk > mus) throw new Error('El coeficiente dinámico no puede ser mayor que el estático');
    const F = lee(sc, 'F', 'la fuerza aplicada', { opcional: true }) ?? 0, al = vacio(sc.alfa) ? 0 : leeNum(sc.alfa);
    if (!isFinite(al) || al < -90 || al > 90) throw new Error('El ángulo de la fuerza debe estar entre −90° y 90°');
    const m2 = lee(sc, 'm2', 'la masa que cuelga', { opcional: true, estricto: true }), d = lee(sc, 'd', 'la distancia', { opcional: true, estricto: true });
    const t = th * RAD, a = al * RAD, P1 = m1 * g, Px = P1 * Math.sin(t), Py = P1 * Math.cos(t), Fx = F * Math.cos(a), Fy = F * Math.sin(a);
    const P2 = m2 ? m2 * g : 0, M = m1 + (m2 || 0);
    const N = Py - Fy;
    const pasos = [];
    const inclinado = th > 0;
    pasos.push({ t: 'Peso y sus componentes', html: inclinado
      ? `P = m<sub>1</sub>g = ${f(m1)}·${f(g)} = <b>${f(P1)} N</b><br>P<sub>x</sub> = P sen θ = ${f(P1)}·sen ${f(th)}° = ${f(Px)} N (plano abajo)<br>P<sub>y</sub> = P cos θ = ${f(P1)}·cos ${f(th)}° = ${f(Py)} N`
      : `P = m<sub>1</sub>g = ${f(m1)}·${f(g)} = <b>${f(P1)} N</b>` });
    if (F) pasos.push({ t: 'Componentes de la fuerza aplicada', html: `F<sub>x</sub> = F cos α = ${f(F)}·cos ${f(al)}° = ${f(Fx)} N<br>F<sub>y</sub> = F sen α = ${f(F)}·sen ${p(al)}° = ${f(Fy)} N` });
    if (N < -1e-9) throw new Error(`La fuerza levanta el bloque del plano: F sen α = ${f(Fy).replace(/<[^>]+>/g, '')} N es mayor que P${inclinado ? ' cos θ' : ''} = ${f(Py).replace(/<[^>]+>/g, '')} N`);
    pasos.push({ t: 'Normal (no hay movimiento perpendicular al plano: ΣF<sub>y</sub> = 0)', html: Fy ? `N + F<sub>y</sub> − ${inclinado ? 'P<sub>y</sub>' : 'P'} = 0 ⇒ N = ${f(Py)} − ${p(Fy)} = <b>${f(N)} N</b>` : `N − ${inclinado ? 'P<sub>y</sub>' : 'P'} = 0 ⇒ N = ${inclinado ? 'P<sub>y</sub>' : 'P'} = <b>${f(N)} N</b>` });
    // fuerza neta sin rozamiento, positiva plano arriba
    const D = Fx + P2 - Px;
    const terminos = [F ? 'F<sub>x</sub>' : '', m2 ? 'P<sub>2</sub>' : '', inclinado ? '− P<sub>x</sub>' : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    const valores = [F ? f(Fx) : '', m2 ? f(P2) : '', inclinado ? `− ${f(Px)}` : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    let estado, acel = 0, Fr = 0, sentido = 0;
    const Frmax = mus * N;
    if (m2) pasos.push({ t: 'Peso de la masa que cuelga', html: `P<sub>2</sub> = m<sub>2</sub>g = ${f(m2)}·${f(g)} = <b>${f(P2)} N</b>. La cuerda es inextensible y la polea ideal: los dos cuerpos tienen la misma aceleración y la tensión es la misma a los dos lados.` });
    pasos.push({ t: '¿Se mueve? (fuerzas a lo largo del plano sin contar el rozamiento)', html: terminos
      ? `${terminos} = ${valores} = <b>${f(D)} N</b>${Math.abs(D) < 1e-9 ? ': está equilibrado' : D > 0 ? ` hacia ${inclinado ? 'arriba del plano' : 'la derecha'}` : ` hacia ${inclinado ? 'abajo del plano' : 'la izquierda'}`}<br>Rozamiento estático máximo: F<sub>r,máx</sub> = μ<sub>e</sub>N = ${f(mus)}·${f(N)} = <b>${f(Frmax)} N</b>`
      : 'No hay ninguna fuerza a lo largo del plano: el bloque sigue en reposo.' });
    if (Math.abs(D) <= Frmax + 1e-9) {
      estado = 'reposo'; Fr = -D;
      pasos.push({ t: 'Se queda en reposo', html: `Como |ΣF| = ${f(Math.abs(D))} N ≤ ${f(Frmax)} N, el rozamiento estático lo sujeta: a = 0 y el rozamiento vale exactamente F<sub>r</sub> = <b>${f(Math.abs(D))} N</b>${Math.abs(D) > 1e-9 ? `, ${D > 0 ? 'plano abajo' : 'plano arriba'}` : ''} (no μ<sub>e</sub>N, que es solo el máximo).` });
    } else {
      estado = 'mueve'; sentido = Math.sign(D); Fr = -sentido * muk * N; acel = (D + Fr) / M;
      pasos.push({ t: 'Se mueve: rozamiento dinámico', html: `|ΣF| = ${f(Math.abs(D))} N &gt; ${f(Frmax)} N, así que el bloque desliza ${sentido > 0 ? (inclinado ? 'plano arriba' : 'hacia la derecha') : (inclinado ? 'plano abajo' : 'hacia la izquierda')} y el rozamiento se opone: F<sub>r</sub> = μ<sub>d</sub>N = ${f(muk)}·${f(N)} = <b>${f(Math.abs(Fr))} N</b>` });
      pasos.push({ t: 'Segunda ley de Newton', html: m2
        ? `Bloque: T ${F ? '+ F<sub>x</sub> ' : ''}${inclinado ? '− P<sub>x</sub> ' : ''}${sentido > 0 ? '−' : '+'} F<sub>r</sub> = m<sub>1</sub>a<br>Masa que cuelga: P<sub>2</sub> − T = m<sub>2</sub>a<br>Sumando las dos: ${terminos} ${sentido > 0 ? '−' : '+'} F<sub>r</sub> = (m<sub>1</sub> + m<sub>2</sub>) a ⇒ a = (${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}) / ${f(M)} = <b>${f(acel)} m/s<sup>2</sup></b>`
        : `ΣF<sub>x</sub> = m<sub>1</sub>a ⇒ ${terminos} ${sentido > 0 ? '−' : '+'} F<sub>r</sub> = m<sub>1</sub>a ⇒ a = (${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}) / ${f(m1)} = <b>${f(acel)} m/s<sup>2</sup></b>` });
    }
    let T = null;
    if (m2) {
      T = m2 * (g - acel);
      pasos.push({ t: 'Tensión de la cuerda', html: `De la masa que cuelga: T = m<sub>2</sub>(g − a) = ${f(m2)}·(${f(g)} − ${p(acel)}) = <b>${f(T)} N</b>` });
    }
    let cin = null;
    if (d && estado === 'mueve') {
      const A = Math.abs(acel), v = Math.sqrt(2 * A * d), tt = Math.sqrt((2 * d) / A);
      cin = { v, t: tt };
      pasos.push({ t: `Tras recorrer ${f(d)} m (MRUA desde el reposo)`, html: `v = √(2|a|d) = √(2·${f(A)}·${f(d)}) = <b>${f(v)} m/s</b><br>t = √(2d/|a|) = √(2·${f(d)}/${f(A)}) = <b>${f(tt)} s</b>` });
    }
    // fuerzas sobre el bloque para el diagrama (en ejes del plano: x a lo largo, y perpendicular)
    const fuerzas = [{ k: 'P', nombre: 'Peso', x: -Px, y: -Py, mod: P1 }, { k: 'N', nombre: 'Normal', x: 0, y: N, mod: N }];
    if (F) fuerzas.push({ k: 'F', nombre: 'Fuerza aplicada', x: Fx, y: Fy, mod: F });
    if (Math.abs(Fr) > 1e-9) fuerzas.push({ k: 'Fr', nombre: 'Rozamiento', x: Fr, y: 0, mod: Math.abs(Fr) });
    if (m2) fuerzas.push({ k: 'T', nombre: 'Tensión', x: T, y: 0, mod: T });
    return { tipo: 'plano', g, m1, th, mus, muk, F, al, m2, d, P1, Px, Py, Fx, Fy, N, D, Frmax, Fr, a: acel, T, estado, sentido, cin, fuerzas, pasos };
  }

  /* ---------- Máquina de Atwood ---------- */
  // sc: { m1, m2 (kg), mp (kg, polea como disco; vacío = sin masa), d (m), g }
  function atwood(sc) {
    const g = lee(sc, 'g', 'la gravedad', { estricto: true });
    const m1 = lee(sc, 'm1', 'la masa 1', { estricto: true }), m2 = lee(sc, 'm2', 'la masa 2', { estricto: true });
    const mp = lee(sc, 'mp', 'la masa de la polea', { opcional: true }) ?? 0, d = lee(sc, 'd', 'la distancia', { opcional: true, estricto: true });
    const a = ((m2 - m1) * g) / (m1 + m2 + mp / 2), T1 = m1 * (g + a), T2 = m2 * (g - a);
    const pasos = [];
    pasos.push({ t: 'Pesos', html: `P<sub>1</sub> = m<sub>1</sub>g = ${f(m1 * g)} N, &nbsp; P<sub>2</sub> = m<sub>2</sub>g = ${f(m2 * g)} N.<br>Tomamos positivo el sentido en el que baja la masa 2 (sube la 1).` });
    pasos.push({ t: 'Segunda ley de Newton para cada cuerpo', html: `Masa 1 (sube): T<sub>1</sub> − P<sub>1</sub> = m<sub>1</sub>a<br>Masa 2 (baja): P<sub>2</sub> − T<sub>2</sub> = m<sub>2</sub>a${mp ? `<br>Polea (disco, I = ½m<sub>p</sub>R<sup>2</sup>, sin deslizar α = a/R): (T<sub>2</sub> − T<sub>1</sub>)R = Iα ⇒ T<sub>2</sub> − T<sub>1</sub> = ½m<sub>p</sub>a` : '<br>Polea sin masa: T<sub>1</sub> = T<sub>2</sub> = T'}` });
    pasos.push({ t: 'Aceleración', html: `Sumando: (m<sub>2</sub> − m<sub>1</sub>)g = (m<sub>1</sub> + m<sub>2</sub>${mp ? ' + ½m<sub>p</sub>' : ''}) a ⇒ a = (${f(m2)} − ${f(m1)})·${f(g)} / (${f(m1)} + ${f(m2)}${mp ? ` + ${f(mp / 2)}` : ''}) = <b>${f(a)} m/s<sup>2</sup></b>${Math.abs(a) < 1e-12 ? ' (masas iguales: equilibrio)' : a < 0 ? ' (negativa: en realidad baja la masa 1)' : ''}` });
    pasos.push({ t: mp ? 'Tensiones' : 'Tensión', html: mp
      ? `T<sub>1</sub> = m<sub>1</sub>(g + a) = ${f(m1)}·(${f(g)} + ${p(a)}) = <b>${f(T1)} N</b><br>T<sub>2</sub> = m<sub>2</sub>(g − a) = ${f(m2)}·(${f(g)} − ${p(a)}) = <b>${f(T2)} N</b>`
      : `T = m<sub>1</sub>(g + a) = ${f(m1)}·(${f(g)} + ${p(a)}) = <b>${f(T1)} N</b> &nbsp;(= 2m<sub>1</sub>m<sub>2</sub>g/(m<sub>1</sub> + m<sub>2</sub>))` });
    let cin = null;
    if (d && Math.abs(a) > 1e-12) {
      const A = Math.abs(a), v = Math.sqrt(2 * A * d), tt = Math.sqrt((2 * d) / A);
      cin = { v, t: tt };
      pasos.push({ t: `Cuando cada masa ha recorrido ${f(d)} m`, html: `v = √(2|a|d) = <b>${f(v)} m/s</b>, &nbsp; t = √(2d/|a|) = <b>${f(tt)} s</b>` });
    }
    return { tipo: 'atwood', g, m1, m2, mp, d, a, T1, T2, cin, pasos };
  }

  function resolver(sc) { return sc.tipo === 'atwood' ? atwood(sc) : plano(sc); }

  const G = '9.8';
  const ejemplos = [
    { clave: 'horizontal', nombre: 'Tirar de una caja con una cuerda inclinada', sc: { tipo: 'plano', g: G, m1: '20', theta: '0', mus: '0.4', muk: '0.3', F: '100', alfa: '30', m2: '', d: '5' } },
    { clave: 'inclinado-baja', nombre: 'Bloque que desliza por un plano inclinado', sc: { tipo: 'plano', g: G, m1: '5', theta: '30', mus: '0.3', muk: '0.2', F: '', alfa: '', m2: '', d: '2' } },
    { clave: 'inclinado-quieto', nombre: 'El rozamiento sujeta el bloque', sc: { tipo: 'plano', g: G, m1: '5', theta: '20', mus: '0.5', muk: '0.4', F: '', alfa: '', m2: '', d: '' } },
    { clave: 'empujar-arriba', nombre: 'Subir un bloque empujando paralelo al plano', sc: { tipo: 'plano', g: G, m1: '10', theta: '25', mus: '0.25', muk: '0.2', F: '80', alfa: '0', m2: '', d: '3' } },
    { clave: 'mesa-polea', nombre: 'Bloque en una mesa y masa colgando', sc: { tipo: 'plano', g: G, m1: '4', theta: '0', mus: '0.3', muk: '0.25', F: '', alfa: '', m2: '2', d: '1' } },
    { clave: 'plano-polea', nombre: 'Plano inclinado con polea y masa colgando', sc: { tipo: 'plano', g: G, m1: '6', theta: '37', mus: '0.2', muk: '0.15', F: '', alfa: '', m2: '5', d: '1.5' } },
    { clave: 'atwood', nombre: 'Máquina de Atwood', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '', d: '2' } },
    { clave: 'atwood-polea', nombre: 'Máquina de Atwood con polea con masa', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '2', d: '2' } },
  ];

  return { plano, atwood, resolver, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Dinamica;
