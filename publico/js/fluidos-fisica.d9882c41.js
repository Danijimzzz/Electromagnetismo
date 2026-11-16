const Fluidos = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }
  const G = 9.8, ATM = 101325;
  const MATERIALES = [['el oro', 19300], ['el plomo', 11340], ['la plata', 10490], ['el cobre', 8960], ['el hierro', 7870], ['el aluminio', 2700]];
  const gDe = (sc) => lee(sc, 'g', 'la gravedad', { opcional: true }) ?? G;
  const circulo = (dcm) => (Math.PI * (dcm / 100) ** 2) / 4; // área en m² de un círculo de diámetro en cm
  const areaPaso = (nom, A, dcm) => `$A_${nom} = {π d_${nom}^2}/{4} = {π · ${f(dcm / 100)}^2}/{4}$ = ${f(A)} m²`;

  function presion(sc) {
    const rho = lee(sc, 'rho', 'la densidad del líquido'), h = lee(sc, 'h', 'la profundidad', { cero: true }), g = gDe(sc);
    const p0dato = lee(sc, 'p0', 'la presión en la superficie', { opcional: true, cero: true });
    const p0 = p0dato ?? ATM, A = lee(sc, 'A', 'el área del fondo', { opcional: true });
    const pm = rho * g * h, pa = p0 + pm;
    const pasos = [
      { t: 'Presión debida al líquido', html: `La presión hidrostática solo depende de la profundidad, no de la forma del recipiente: $p_{man} = ρ g h = ${f(rho)} · ${f(g)} · ${f(h)}$ = <b>${f(pm)} Pa</b>. Es la que marca un manómetro (presión manométrica).` },
      { t: 'Presión absoluta', html: `${p0dato === null ? 'Sobre la superficie está la atmósfera, $p_0 = 101325$ Pa: ' : ''}$p = p_0 + ρ g h = ${f(p0)} + ${f(pm)}$ = <b>${f(pa)} Pa</b> = ${f(pa / ATM)} atm` },
    ];
    let F = null;
    if (A) {
      F = pm * A;
      pasos.push({ t: 'Fuerza del líquido sobre el fondo', html: `$F = p_{man} A = ${f(pm)} · ${f(A)}$ = <b>${f(F)} N</b><br>La atmósfera empuja también por fuera del recipiente, así que su parte se anula; con ella sería $p A = ${f(pa * A)}$ N.` });
    }
    pasos.push({ t: 'Cuánto sube con la profundidad', html: `En este líquido la presión aumenta 1 atm cada $h = p_{atm}/(ρ g) = 101325/(${f(rho)} · ${f(g)})$ = ${f(ATM / (rho * g))} m.` });
    return { modo: 'presion', rho, h, g, p0, pm, pa, A, F, pasos };
  }

  function tuboU(sc) {
    const rho1 = lee(sc, 'rho1', 'la densidad del líquido del fondo'), h2 = lee(sc, 'h2', 'la altura de la columna añadida');
    let rho2, h1;
    const pasos = [{ t: 'Mismo nivel, misma presión', html: 'En la superficie de separación de los dos líquidos y a la misma altura en la otra rama hay el mismo líquido en reposo y conectado, así que la presión es igual. Por encima, cada rama tiene su columna y arriba la atmósfera: $p_0 + ρ_2 g h_2 = p_0 + ρ_1 g h_1$, es decir, $ρ_2 h_2 = ρ_1 h_1$.' }];
    if (sc.buscar === 'densidad') {
      h1 = lee(sc, 'h1', 'la altura del otro lado');
      if (h1 >= h2) throw new Error('La columna del líquido añadido tiene que ser más alta que la del otro lado (es el menos denso)');
      rho2 = (rho1 * h1) / h2;
      pasos.push({ t: 'Densidad del líquido añadido', html: `$ρ_2 = {ρ_1 h_1}/{h_2} = {${f(rho1)} · ${f(h1)}}/{${f(h2)}}$ = <b>${f(rho2)} kg/m³</b>` });
    } else {
      rho2 = lee(sc, 'rho2', 'la densidad del líquido añadido');
      if (rho2 >= rho1) throw new Error('El líquido añadido tiene que ser menos denso que el del fondo: si no, baja a la curva del tubo y empuja al otro');
      h1 = (rho2 * h2) / rho1;
      pasos.push({ t: 'Altura del otro lado', html: `Sobre la superficie de separación, el líquido del fondo sube en la otra rama $h_1 = {ρ_2 h_2}/{ρ_1} = {${f(rho2)} · ${f(h2)}}/{${f(rho1)}}$ = <b>${f(h1)} m</b>` });
    }
    const dh = h2 - h1;
    pasos.push({ t: 'Desnivel entre las dos superficies', html: `$Δh = h_2 − h_1 = ${f(h2)} − ${f(h1)}$ = <b>${f(dh)} m</b> (${f(dh * 100)} cm), más alta la del líquido menos denso.` });
    return { modo: 'tuboU', buscar: sc.buscar === 'densidad' ? 'densidad' : 'altura', rho1, rho2, h1, h2, dh, pasos };
  }

  function prensa(sc) {
    const d1 = lee(sc, 'd1', 'el diámetro del émbolo pequeño'), d2 = lee(sc, 'd2', 'el diámetro del émbolo grande'), g = gDe(sc);
    if (d2 <= d1) throw new Error('El émbolo grande tiene que tener más diámetro que el pequeño');
    const A1 = circulo(d1), A2 = circulo(d2), k = A2 / A1;
    const pasos = [{ t: 'Áreas de los émbolos', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let F1, F2, m = null;
    if (sc.datos === 'masa') {
      m = lee(sc, 'm', 'la masa que se quiere levantar'); F2 = m * g; F1 = F2 / k;
      pasos.push({ t: 'Peso que hay que levantar', html: `$F_2 = m g = ${f(m)} · ${f(g)}$ = ${f(F2)} N` });
      pasos.push({ t: 'Principio de Pascal', html: `La presión se transmite igual a todo el líquido: $F_1/A_1 = F_2/A_2$, así que $F_1 = {F_2 A_1}/{A_2} = F_2 (d_1/d_2)^2 = ${f(F2)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(F1)} N</b>` });
    } else {
      F1 = lee(sc, 'F1', 'la fuerza en el émbolo pequeño'); F2 = F1 * k;
      pasos.push({ t: 'Principio de Pascal', html: `La presión se transmite igual a todo el líquido: $F_1/A_1 = F_2/A_2$, así que $F_2 = {F_1 A_2}/{A_1} = F_1 (d_2/d_1)^2 = ${f(F1)} · (${f(d2)}/${f(d1)})^2$ = <b>${f(F2)} N</b>${g ? `, lo que pesa una masa de ${f(F2 / g)} kg` : ''}` });
    }
    const pr = F1 / A1;
    pasos.push({ t: 'Presión en el líquido', html: `$p = F_1/A_1 = ${f(F1)}/${f(A1)}$ = <b>${f(pr)} Pa</b> (${f(pr / ATM)} atm por encima de la atmosférica). La fuerza se multiplica por $A_2/A_1 = ${f(k)}$.` });
    const x1 = lee(sc, 'x1', 'el recorrido del émbolo pequeño', { opcional: true });
    let x2 = null;
    if (x1) {
      x2 = x1 / k;
      pasos.push({ t: 'Recorridos', html: `El volumen de líquido que sale de un lado entra en el otro: $A_1 x_1 = A_2 x_2$, así que $x_2 = {x_1 A_1}/{A_2} = ${f(x1)}/${f(k)}$ = <b>${f(x2)} cm</b><br>Lo que se gana en fuerza se pierde en recorrido: el trabajo es el mismo, $F_1 x_1 = F_2 x_2 = ${f((F1 * x1) / 100)}$ J.` });
    }
    return { modo: 'prensa', datos: sc.datos === 'masa' ? 'masa' : 'fuerza', d1, d2, A1, A2, k, F1, F2, m, pr, x1, x2, g, pasos };
  }

  function empuje(sc) {
    const rhoF = lee(sc, 'rhoF', 'la densidad del fluido'), g = gDe(sc);
    const pasos = [];
    if (sc.datos === 'pesadas') {
      const P = lee(sc, 'P', 'el peso en el aire'), Pa = lee(sc, 'Pa', 'el peso dentro del fluido', { cero: true });
      if (Pa >= P) throw new Error('Dentro del fluido el cuerpo tiene que pesar menos que en el aire');
      const E = P - Pa, V = E / (rhoF * g), m = P / g, rhoC = m / V;
      pasos.push({ t: 'Empuje', html: `Lo que pierde de peso al sumergirlo es el empuje: $E = P − P_{ap} = ${f(P)} − ${f(Pa)}$ = <b>${f(E)} N</b>` });
      pasos.push({ t: 'Volumen del cuerpo', html: `Totalmente sumergido, $E = ρ_f V g$, así que $V = E/(ρ_f g) = ${f(E)}/(${f(rhoF)} · ${f(g)})$ = <b>${f(V)} m³</b> (${f(V * 1e6)} cm³)` });
      pasos.push({ t: 'Densidad del cuerpo', html: `$m = P/g = ${f(m)}$ kg y $ρ = m/V = {ρ_f P}/{E} = {${f(rhoF)} · ${f(P)}}/{${f(E)}}$ = <b>${f(rhoC)} kg/m³</b>` });
      const cerca = MATERIALES.reduce((a, b) => (Math.abs(Math.log(b[1] / rhoC)) < Math.abs(Math.log(a[1] / rhoC)) ? b : a));
      pasos.push({ t: '¿De qué puede ser?', html: `Comparando con algunas densidades (oro 19 300, plomo 11 340, plata 10 490, cobre 8960, hierro 7870, aluminio 2700 kg/m³), lo más parecido es ${cerca[0]}${Math.abs(rhoC / cerca[1] - 1) > 0.03 ? ', pero no coincide: será una aleación o tendrá huecos' : ''}.` });
      return { modo: 'empuje', datos: 'pesadas', rhoF, g, P, Pa, E, V, m, rhoC, flota: false, pasos };
    }
    const rhoC = lee(sc, 'rhoC', 'la densidad del cuerpo'), V = lee(sc, 'V', 'el volumen del cuerpo');
    const m = rhoC * V, P = m * g, Emax = rhoF * V * g;
    pasos.push({ t: 'Peso', html: `$P = m g = ρ V g = ${f(rhoC)} · ${f(V)} · ${f(g)}$ = <b>${f(P)} N</b>` });
    pasos.push({ t: 'Empuje con el cuerpo entero dentro', html: `$E = ρ_f V g = ${f(rhoF)} · ${f(V)} · ${f(g)}$ = <b>${f(Emax)} N</b>` });
    let flota, E, Vs = null, Pa = null, a = null;
    if (rhoC < rhoF) {
      flota = true; E = P; Vs = (rhoC * V) / rhoF;
      pasos.push({ t: 'Flota', html: `Como $E > P$ (el cuerpo es menos denso que el fluido), sube hasta que la parte sumergida da un empuje igual al peso: $ρ_f V_s g = ρ V g$, $V_s = {ρ V}/{ρ_f} = {${f(rhoC)} · ${f(V)}}/{${f(rhoF)}}$ = <b>${f(Vs)} m³</b><br>Sumergido el ${f((100 * rhoC) / rhoF)} % y fuera el ${f(100 - (100 * rhoC) / rhoF)} %.` });
      pasos.push({ t: 'Para hundirlo del todo', html: `Hay que empujarlo hacia abajo con $F = E − P = ${f(Emax)} − ${f(P)}$ = ${f(Emax - P)} N` });
    } else if (rhoC === rhoF) {
      flota = null; E = Emax; Pa = 0;
      pasos.push({ t: 'Ni sube ni baja', html: 'El cuerpo tiene la misma densidad que el fluido: $E = P$ en cualquier sitio y se queda donde lo dejes (equilibrio indiferente).' });
    } else {
      flota = false; E = Emax; Pa = P - Emax; a = Pa / m;
      pasos.push({ t: 'Se hunde', html: `Como $P > E$ se va al fondo. Su peso aparente es $P_{ap} = P − E = ${f(P)} − ${f(Emax)}$ = <b>${f(Pa)} N</b>` });
      pasos.push({ t: 'Aceleración al soltarlo', html: `Sin rozamiento con el fluido, $a = (P − E)/m = g (1 − ρ_f/ρ) = ${f(Pa)}/${f(m)}$ = <b>${f(a)} m/s²</b>` });
    }
    return { modo: 'empuje', datos: 'cuerpo', rhoC, V, rhoF, g, m, P, Emax, E, flota, Vs, Pa, a, pasos };
  }

  function bernoulli(sc) {
    const rho = lee(sc, 'rho', 'la densidad del fluido'), d1 = lee(sc, 'd1', 'el diámetro en 1'), d2 = lee(sc, 'd2', 'el diámetro en 2'), g = gDe(sc);
    const p1 = lee(sc, 'p1', 'la presión en 1', { signo: true });
    const h1 = lee(sc, 'h1', 'la altura de 1', { opcional: true, signo: true }) ?? 0, h2 = lee(sc, 'h2', 'la altura de 2', { opcional: true, signo: true }) ?? 0;
    const A1 = circulo(d1), A2 = circulo(d2);
    const pasos = [{ t: 'Secciones', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let v1, Q;
    if (sc.datos === 'Q') {
      const QL = lee(sc, 'Q', 'el caudal'); Q = QL / 1000; v1 = Q / A1;
      pasos.push({ t: 'Velocidad en 1', html: `$Q = ${f(QL)}$ L/s = ${f(Q)} m³/s, y $v_1 = Q/A_1 = ${f(Q)}/${f(A1)}$ = <b>${f(v1)} m/s</b>` });
    } else {
      v1 = lee(sc, 'v1', 'la velocidad en 1'); Q = A1 * v1;
      pasos.push({ t: 'Caudal', html: `$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s (${f(rho * Q)} kg/s)` });
    }
    const v2 = (v1 * A1) / A2;
    pasos.push({ t: 'Continuidad', html: `El caudal es el mismo en toda la tubería: $A_1 v_1 = A_2 v_2$, $v_2 = v_1 (d_1/d_2)^2 = ${f(v1)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(v2)} m/s</b>` });
    const p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
    const alt = h1 || h2;
    pasos.push({ t: 'Bernoulli', html: `$p_1 + {1}/{2} ρ v_1^2 ${alt ? '+ ρ g h_1 ' : ''}= p_2 + {1}/{2} ρ v_2^2${alt ? ' + ρ g h_2' : ''}$, así que<br>$p_2 = p_1 + {1}/{2} ρ (v_1^2 − v_2^2)${alt ? ' + ρ g (h_1 − h_2)' : ''} = ${f(p1)} + {1}/{2} · ${f(rho)} · (${f(v1)}^2 − ${f(v2)}^2)${alt ? `$ $+ ${f(rho)} · ${f(g)} · (${f(h1)} − ${p(h2)})` : ''}$ = <b>${f(p2)} Pa</b>${p2 < 0 ? '<br>Sale negativa: si $p_1$ era manométrica, en 2 hay menos presión que la atmosférica; si era absoluta, no puede ser y el líquido herviría (cavitación).' : ''}` });
    pasos.push({ t: 'Diferencia de presión', html: `$Δp = p_1 − p_2 = ${f(p1 - p2)}$ Pa${alt ? '' : `. Donde el tubo se estrecha el fluido va más deprisa y la presión baja: es el efecto Venturi. Con dos tubos verticales abiertos, el líquido subiría ${f(Math.abs(p1 - p2) / (rho * g))} m más en el lado de ${p1 > p2 ? '1' : '2'}.`}` });
    return { modo: 'bernoulli', datos: sc.datos === 'Q' ? 'Q' : 'v1', rho, d1, d2, A1, A2, v1, v2, Q, p1, p2, h1, h2, g, pasos };
  }

  function torricelli(sc) {
    const H = lee(sc, 'H', 'la altura del líquido sobre el orificio'), g = gDe(sc);
    const y = lee(sc, 'y', 'la altura del orificio', { opcional: true, cero: true });
    const d = lee(sc, 'd', 'el diámetro del orificio', { opcional: true }), D = lee(sc, 'D', 'el diámetro del depósito', { opcional: true });
    if (D && !d) throw new Error('Para el tiempo de vaciado hace falta también el diámetro del orificio');
    if (D && d && D <= d / 100) throw new Error('El depósito tiene que ser más ancho que el orificio');
    const v = Math.sqrt(2 * g * H);
    const pasos = [{ t: 'Velocidad de salida', html: `Bernoulli entre la superficie (casi quieta, a presión atmosférica) y el orificio (también al aire): $v = √(2 g H) = √(2 · ${f(g)} · ${f(H)})$ = <b>${f(v)} m/s</b>, la misma que si cayera libremente desde la superficie.` }];
    let x = null, tc = null, Q = null, A = null, tv = null;
    if (y) {
      tc = Math.sqrt((2 * y) / g); x = v * tc;
      pasos.push({ t: 'Alcance del chorro', html: `Sale horizontal y cae como un tiro horizontal: tarda $t = √(2 y/g) = √(2 · ${f(y)}/${f(g)})$ = ${f(tc)} s, y llega a $x = v t = 2 √(H y) = ${f(v)} · ${f(tc)}$ = <b>${f(x)} m</b><br>Con la misma altura total, ${f(H + y)} m, el alcance sería máximo con el orificio a media altura: ${f(H + y)} m.` });
    } else if (y === 0) {
      x = 0;
    }
    if (d) {
      A = circulo(d); Q = A * v;
      pasos.push({ t: 'Caudal que sale', html: `${areaPaso('o', A, d)}, $Q = A_o v = ${f(A)} · ${f(v)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
    }
    if (D) {
      const AD = (Math.PI * D * D) / 4;
      tv = (AD / A) * Math.sqrt((2 * H) / g);
      pasos.push({ t: 'Tiempo hasta que se vacía', html: `Al bajar el nivel la velocidad disminuye. Con $A_D v_{nivel} = A_o √(2 g z)$ e integrando desde H hasta 0: $t = (A_D/A_o) √(2 H/g) = (D/d)^2 √(2 H/g) = ${f(AD / A)} · ${f(Math.sqrt((2 * H) / g))}$ = <b>${f(tv)} s</b> (${f(tv / 60)} min), el doble de lo que tardaría si saliera siempre con el caudal inicial.` });
    }
    return { modo: 'torricelli', H, y, d, D, g, v, x, tc, A, Q, tv, pasos };
  }

  function viscosidad(sc) {
    const pasos = [], g = gDe(sc);
    if (sc.tipo === 'stokes') {
      const r = lee(sc, 'r', 'el radio de la esfera') / 1000, rhoE = lee(sc, 'rhoE', 'la densidad de la esfera'), rhoF = lee(sc, 'rhoF', 'la densidad del fluido');
      if (rhoE <= rhoF) throw new Error('La esfera tiene que ser más densa que el fluido para caer');
      let eta, v;
      pasos.push({ t: 'Fuerzas sobre la esfera', html: `Cae con su peso $ρ_e V g$, el empuje la frena con $ρ_f V g$ y el rozamiento viscoso de Stokes, $F_v = 6 π η r v$, crece con la velocidad. Llega a la velocidad límite cuando se equilibran: $6 π η r v = (ρ_e − ρ_f) {4}/{3} π r^3 g$.` });
      if (sc.datos === 'v') {
        v = lee(sc, 'v', 'la velocidad límite medida'); eta = (2 * r * r * (rhoE - rhoF) * g) / (9 * v);
        pasos.push({ t: 'Viscosidad (viscosímetro de bola)', html: `$η = {2 r^2 (ρ_e − ρ_f) g}/{9 v} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(v)}}$ = <b>${f(eta)} Pa·s</b>` });
      } else {
        eta = lee(sc, 'eta', 'la viscosidad'); v = (2 * r * r * (rhoE - rhoF) * g) / (9 * eta);
        pasos.push({ t: 'Velocidad límite', html: `$v_{lím} = {2 r^2 (ρ_e − ρ_f) g}/{9 η} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(eta)}}$ = <b>${f(v)} m/s</b>` });
      }
      const Re = (rhoF * v * 2 * r) / eta, tau = (2 * rhoE * r * r) / (9 * eta);
      pasos.push({ t: '¿Vale la ley de Stokes?', html: `Número de Reynolds $Re = ρ_f v (2r)/η = ${f(Re)}$: ${Re < 1 ? 'mucho menor que 1, el flujo alrededor de la esfera es laminar y la ley vale.' : 'no es pequeño frente a 1, así que el resultado es solo aproximado (aparece estela y la fuerza crece más deprisa).'} Llega casi a la velocidad límite en unos pocos $τ = {2 ρ_e r^2}/{9 η} = ${f(tau)}$ s.` });
      return { modo: 'viscosidad', tipo: 'stokes', datos: sc.datos === 'v' ? 'v' : 'eta', r, rhoE, rhoF, eta, v, Re, tau, g, pasos };
    }
    const eta = lee(sc, 'eta', 'la viscosidad'), L = lee(sc, 'L', 'la longitud del tubo'), d = lee(sc, 'd', 'el diámetro interior') / 1000, r = d / 2;
    const Rh = (8 * eta * L) / (Math.PI * r ** 4);
    pasos.push({ t: 'Ley de Poiseuille', html: `En un tubo de radio r y longitud L, un fluido viscoso en régimen laminar tiene un perfil de velocidades parabólico y el caudal es $Q = {π r^4 Δp}/{8 η L}$. La resistencia del tubo es $R = {8 η L}/{π r^4} = {8 · ${f(eta)} · ${f(L)}}/{π · (${f(r)})^4}$ = ${f(Rh)} Pa·s/m³: al reducir el radio a la mitad, el caudal baja 16 veces.` });
    let Q, dp;
    if (sc.datos === 'Q') {
      Q = lee(sc, 'Q', 'el caudal') / 1e6; dp = Q * Rh;
      pasos.push({ t: 'Diferencia de presión necesaria', html: `$Δp = Q R = ${f(Q)} · ${f(Rh)}$ = <b>${f(dp)} Pa</b> (${f(dp / 133.32)} mmHg)` });
    } else {
      dp = lee(sc, 'dp', 'la diferencia de presión'); Q = dp / Rh;
      pasos.push({ t: 'Caudal', html: `$Q = Δp/R = ${f(dp)}/${f(Rh)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1e6)} mL/s` });
    }
    const A = Math.PI * r * r, vm = Q / A, vmax = 2 * vm, rho = lee(sc, 'rho', 'la densidad del fluido', { opcional: true }) ?? 1000, Re = (rho * vm * d) / eta;
    pasos.push({ t: 'Velocidades', html: `Velocidad media $v̄ = Q/(π r^2) = ${f(vm)}$ m/s; en el centro va el doble, $v_{máx} = 2 v̄ = ${f(vmax)}$ m/s, y junto a la pared, 0.` });
    pasos.push({ t: '¿Es laminar?', html: `$Re = ρ v̄ d/η = {${f(rho)} · ${f(vm)} · ${f(d)}}/${'{'}${f(eta)}}$ = ${f(Re)}: ${Re < 2000 ? 'menor que unos 2000, régimen laminar y la ley de Poiseuille vale.' : Re < 4000 ? 'entre 2000 y 4000, zona de transición: la ley de Poiseuille deja de ser fiable.' : 'mayor que 4000, el flujo es turbulento y la ley de Poiseuille no vale.'}` });
    return { modo: 'viscosidad', tipo: 'poiseuille', datos: sc.datos === 'Q' ? 'Q' : 'dp', eta, L, d, r, Rh, Q, dp, vm, vmax, rho, Re, pasos };
  }

  function medidor(sc) {
    const rhoF = lee(sc, 'rhoF', 'la densidad del fluido'), dh = lee(sc, 'dh', 'el desnivel del manómetro') / 100, g = gDe(sc), pasos = [];
    const rhoM = lee(sc, 'rhoM', 'la densidad del líquido del manómetro', { opcional: true });
    if (rhoM !== null && rhoM <= rhoF) throw new Error('El líquido del manómetro tiene que ser más denso que el fluido que se mide');
    const dp = rhoM === null ? rhoF * g * dh : (rhoM - rhoF) * g * dh;
    pasos.push({ t: 'Diferencia de presión', html: rhoM === null ? `Con dos tubos verticales abiertos, el líquido sube hasta donde su peso equilibra la presión: $Δp = ρ g Δh = ${f(rhoF)} · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` : `En el manómetro en U, a la altura de la superficie más baja la presión es igual en las dos ramas: $Δp = (ρ_m − ρ) g Δh = (${f(rhoM)} − ${f(rhoF)}) · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` });
    if (sc.tipo === 'venturi') {
      const d1 = lee(sc, 'd1', 'el diámetro de la tubería'), d2 = lee(sc, 'd2', 'el diámetro del estrechamiento');
      if (d2 >= d1) throw new Error('El estrechamiento tiene que ser más estrecho que la tubería');
      const A1 = circulo(d1), A2 = circulo(d2), k = (A1 / A2) ** 2 - 1, v1 = Math.sqrt((2 * dp) / (rhoF * k)), v2 = (v1 * A1) / A2, Q = A1 * v1;
      pasos.push({ t: 'Continuidad y Bernoulli', html: `$v_2 = v_1 A_1/A_2$ y $p_1 − p_2 = {1}/{2} ρ (v_2^2 − v_1^2) = {1}/{2} ρ v_1^2 ((A_1/A_2)^2 − 1)$, con $(A_1/A_2)^2 = (d_1/d_2)^4 = ${f(k + 1)}$` });
      pasos.push({ t: 'Velocidad y caudal', html: `$v_1 = √({2 Δp}/{ρ ((A_1/A_2)^2 − 1)}) = √({2 · ${f(dp)}}/{${f(rhoF)} · ${f(k)}})$ = <b>${f(v1)} m/s</b>, $v_2$ = ${f(v2)} m/s<br>$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
      return { modo: 'medidor', tipo: 'venturi', rhoF, rhoM, dh, dp, d1, d2, A1, A2, v1, v2, Q, g, pasos };
    }
    const v = Math.sqrt((2 * dp) / rhoF);
    pasos.unshift({ t: 'Cómo funciona', html: 'El tubo tiene una boca de frente a la corriente, donde el fluido se queda quieto, y una toma en el costado, por donde pasa con su velocidad. Bernoulli entre las dos, a la misma altura: $p_{total} = p + {1}/{2} ρ v^2$, así que el manómetro que las une mide la presión dinámica ${1}/{2} ρ v^2$.' });
    pasos.push({ t: 'Velocidad del fluido', html: `En la boca del tubo de Pitot el fluido se para (presión de estancamiento) y en la toma lateral pasa con su velocidad: $Δp = {1}/{2} ρ v^2$, así que $v = √({2 Δp}/{ρ}) = √({2 · ${f(dp)}}/{${f(rhoF)}})$ = <b>${f(v)} m/s</b> (${f(v * 3.6)} km/h). Así miden los aviones su velocidad respecto al aire.` });
    return { modo: 'medidor', tipo: 'pitot', rhoF, rhoM, dh, dp, v, g, pasos };
  }

  function pared(sc) {
    const rho = lee(sc, 'rho', 'la densidad del líquido'), b = lee(sc, 'b', 'la anchura'), hc = lee(sc, 'hc', 'la altura mojada'), g = gDe(sc);
    const h0 = lee(sc, 'h0', 'la profundidad del borde de arriba', { opcional: true, cero: true }) ?? 0;
    const hg = h0 + hc / 2, A = b * hc, F = rho * g * hg * A, yc = hg + (hc * hc) / (12 * hg), M = F * (h0 + hc - yc);
    const pasos = [{ t: 'Presión sobre la pared', html: `La presión del líquido crece con la profundidad, $p = ρ g y$, así que empuja más abajo que arriba. ${h0 ? `La compuerta va de $y = ${f(h0)}$ m a $y = ${f(h0 + hc)}$ m.` : `La pared está mojada hasta $H = ${f(hc)}$ m.`}` }];
    pasos.push({ t: 'Fuerza resultante', html: `Es la presión en el centro de la superficie por su área: $F = ρ g h_G A = ${f(rho)} · ${f(g)} · ${f(hg)} · (${f(b)} · ${f(hc)})$ = <b>${f(F)} N</b>${h0 ? '' : `, es decir, $F = {1}/{2} ρ g b H^2$`}` });
    pasos.push({ t: 'Centro de presiones', html: `Como empuja más abajo, la fuerza no actúa en el centro sino más abajo: $y_P = h_G + {I_G}/{h_G A} = h_G + {h_c^2}/{12 h_G} = ${f(hg)} + {${f(hc)}^2}/{12 · ${f(hg)}}$ = <b>${f(yc)} m</b> de profundidad${h0 ? '' : ', a dos tercios de la altura (a H/3 del fondo)'}.` });
    pasos.push({ t: 'Momento respecto al borde de abajo', html: `$M = F (h_0 + h_c − y_P) = ${f(F)} · ${f(h0 + hc - yc)}$ = <b>${f(M)} N·m</b>: es lo que tienen que aguantar la presa o las bisagras de abajo para que no vuelque.` });
    return { modo: 'pared', rho, b, hc, h0, hg, A, F, yc, M, g, pasos };
  }

  function capilar(sc) {
    const ga = lee(sc, 'gamma', 'la tensión superficial'), r = lee(sc, 'r', 'el radio del tubo') / 1000, rho = lee(sc, 'rho', 'la densidad del líquido'), g = gDe(sc);
    const th = lee(sc, 'theta', 'el ángulo de contacto', { opcional: true, cero: true }) ?? 0;
    if (th > 180) throw new Error('El ángulo de contacto va de 0° a 180°');
    const c = Math.abs(th - 90) < 1e-9 ? 0 : Math.cos((th * Math.PI) / 180), h = (2 * ga * c) / (rho * g * r), dp = (2 * ga * c) / r;
    const pasos = [{ t: 'Por qué sube (o baja)', html: `La tensión superficial tira del borde del menisco a lo largo de todo el perímetro, $2πr$, con un ángulo de contacto θ = ${f(th)}°: la fuerza vertical es $2 π r γ cos θ$. ${c > 0 ? 'El líquido moja el vidrio y sube' : c < 0 ? 'El líquido no moja (como el mercurio) y baja' : 'Con θ = 90° ni sube ni baja'}.` }];
    pasos.push({ t: 'Ley de Jurin', html: `La columna sube hasta que su peso, $ρ π r^2 h g$, iguala esa fuerza: $h = {2 γ cos θ}/{ρ g r} = {2 · ${f(ga)} · ${f(c)}}/{${f(rho)} · ${f(g)} · ${f(r)}}$ = <b>${f(h * 1000)} mm</b>${h < 0 ? ' (por debajo del nivel de fuera)' : ''}. Cuanto más fino el tubo, más sube: así suben el agua por el papel y la savia por las plantas.` });
    pasos.push({ t: 'Presión bajo el menisco', html: `La superficie curva hace que debajo del menisco la presión sea $Δp = {2 γ cos θ}/{r} = ${f(dp)}$ Pa ${dp >= 0 ? 'menor' : 'mayor'} que la atmosférica (ley de Laplace), justo lo que compensa la columna: $ρ g h = ${f(rho * g * h)}$ Pa.` });
    return { modo: 'capilar', ga, r, rho, th, c, h, dp, g, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'viscosidad') return viscosidad(sc);
    if (sc.modo === 'medidor') return medidor(sc);
    if (sc.modo === 'pared') return pared(sc);
    if (sc.modo === 'capilar') return capilar(sc);
    if (sc.modo === 'tuboU') return tuboU(sc);
    if (sc.modo === 'prensa') return prensa(sc);
    if (sc.modo === 'empuje') return empuje(sc);
    if (sc.modo === 'bernoulli') return bernoulli(sc);
    if (sc.modo === 'torricelli') return torricelli(sc);
    return presion(sc);
  }

  const ejemplos = [
    { clave: 'buceo', nombre: 'Presión sobre un buceador a 20 m', sc: { modo: 'presion', rho: '1025', h: '20', p0: '', A: '', g: '9,8' } },
    { clave: 'piscina', nombre: 'Fuerza sobre el fondo de una piscina', sc: { modo: 'presion', rho: '1000', h: '2', p0: '', A: '50', g: '9,8' } },
    { clave: 'barometro', nombre: 'Barómetro de mercurio de Torricelli', sc: { modo: 'presion', rho: '13600', h: '0,76', p0: '0', A: '', g: '9,8' } },
    { clave: 'tubo-aceite', nombre: 'Aceite y agua en un tubo en U', sc: { modo: 'tuboU', buscar: 'altura', rho1: '1000', rho2: '800', h2: '0,1' } },
    { clave: 'tubo-densidad', nombre: 'Densidad de un líquido con un tubo en U', sc: { modo: 'tuboU', buscar: 'densidad', rho1: '1000', h1: '0,068', h2: '0,08' } },
    { clave: 'elevador', nombre: 'Elevador hidráulico de un taller', sc: { modo: 'prensa', datos: 'masa', m: '1500', d1: '4', d2: '40', x1: '20', g: '9,8' } },
    { clave: 'prensa', nombre: 'Prensa hidráulica', sc: { modo: 'prensa', datos: 'fuerza', F1: '200', d1: '2', d2: '30', x1: '', g: '9,8' } },
    { clave: 'madera', nombre: 'Bloque de madera en agua', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '600', V: '0,002', rhoF: '1000', g: '9,8' } },
    { clave: 'iceberg', nombre: 'Parte visible de un iceberg', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '917', V: '1000', rhoF: '1025', g: '9,8' } },
    { clave: 'hierro', nombre: 'Pieza de hierro sumergida en agua', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '7870', V: '1e-4', rhoF: '1000', g: '9,8' } },
    { clave: 'corona', nombre: 'La corona de Arquímedes: ¿es de oro?', sc: { modo: 'empuje', datos: 'pesadas', P: '10', Pa: '9,4', rhoF: '1000', g: '9,8' } },
    { clave: 'venturi', nombre: 'Tubo de Venturi', sc: { modo: 'bernoulli', datos: 'v1', rho: '1000', d1: '10', d2: '5', v1: '2', p1: '1,5e5', h1: '', h2: '', g: '9,8' } },
    { clave: 'casa', nombre: 'Agua que sube a un segundo piso', sc: { modo: 'bernoulli', datos: 'Q', rho: '1000', d1: '4', d2: '2', Q: '1,5', p1: '4e5', h1: '0', h2: '6', g: '9,8' } },
    { clave: 'deposito', nombre: 'Chorro de un depósito con un agujero', sc: { modo: 'torricelli', H: '2', y: '1', d: '2', D: '1', g: '9,8' } },
    { clave: 'sangre', nombre: 'Sangre por una arteria (Poiseuille)', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'dp', eta: '4e-3', L: '0,1', d: '4', dp: '400', Q: '', rho: '1060' } },
    { clave: 'jeringa', nombre: 'Presión para pasar agua por una aguja', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'Q', eta: '1e-3', L: '0,04', d: '0,5', dp: '', Q: '0,5', rho: '1000' } },
    { clave: 'glicerina', nombre: 'Bola de acero cayendo en glicerina (Stokes)', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'eta', r: '1', rhoE: '7800', rhoF: '1260', eta: '1,5', v: '', g: '9,8' } },
    { clave: 'viscosimetro', nombre: 'Viscosidad de un aceite con una bola que cae', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'v', r: '1,5', rhoE: '7800', rhoF: '900', eta: '', v: '0,12', g: '9,8' } },
    { clave: 'pitot', nombre: 'Velocidad de un avión con un tubo de Pitot', sc: { modo: 'medidor', tipo: 'pitot', rhoF: '1,2', rhoM: '1000', dh: '25', d1: '', d2: '', g: '9,8' } },
    { clave: 'venturimetro', nombre: 'Caudal con un medidor de Venturi y mercurio', sc: { modo: 'medidor', tipo: 'venturi', rhoF: '1000', rhoM: '13600', dh: '4', d1: '10', d2: '5', g: '9,8' } },
    { clave: 'presa', nombre: 'Fuerza del agua sobre una presa', sc: { modo: 'pared', rho: '1000', b: '50', hc: '20', h0: '', g: '9,8' } },
    { clave: 'compuerta', nombre: 'Compuerta sumergida en un depósito', sc: { modo: 'pared', rho: '1000', b: '1,5', hc: '2', h0: '3', g: '9,8' } },
    { clave: 'capilar', nombre: 'Agua que sube por un tubo capilar', sc: { modo: 'capilar', gamma: '0,073', r: '0,5', rho: '1000', theta: '0', g: '9,8' } },
    { clave: 'mercurio', nombre: 'Mercurio que baja en un capilar', sc: { modo: 'capilar', gamma: '0,49', r: '1', rho: '13600', theta: '140', g: '9,8' } },
  ];

  return { resolver, presion, tuboU, prensa, empuje, bernoulli, torricelli, viscosidad, medidor, pared, capilar, ejemplos, f, ATM };
})();

