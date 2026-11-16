const Dinamica = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-9) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, min = 0, estricto = false, max = Infinity, signo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (!signo && (estricto ? v <= min : v < min)) throw new Error(`${may(nom)} debe ser ${estricto ? 'mayor que' : 'como mínimo'} ${f(min)}`);
    if (v > max) throw new Error(`${may(nom)} no puede pasar de ${f(max)}`);
    return v;
  }
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  function enTramos(tramos, t) {
    let x = 0, v = 0;
    for (const s of tramos) {
      const tt = Math.min(Math.max(t - s.t0, 0), s.dur);
      x = s.x0 + s.v0 * tt + 0.5 * s.a * tt * tt; v = s.v0 + s.a * tt;
      if (t < s.t0 + s.dur) break;
    }
    return { x, v };
  }

  function plano(sc) {
    const g = lee(sc, 'g', 'la gravedad', { estricto: true });
    const m1 = lee(sc, 'm1', 'la masa del bloque', { estricto: true }), th = lee(sc, 'theta', 'el ángulo del plano', { max: 90 });
    const mus = lee(sc, 'mus', 'el coeficiente de rozamiento estático', { opcional: true }) ?? 0;
    let muk = lee(sc, 'muk', 'el coeficiente de rozamiento dinámico', { opcional: true }) ?? 0;
    const amed = lee(sc, 'amed', 'la aceleración medida', { opcional: true });
    if (amed === null && muk > mus) throw new Error('El coeficiente dinámico no puede ser mayor que el estático');
    const F = lee(sc, 'F', 'la fuerza aplicada', { opcional: true }) ?? 0, al = vacio(sc.alfa) ? 0 : leeNum(sc.alfa);
    if (!isFinite(al) || al < -90 || al > 90) throw new Error('El ángulo de la fuerza debe estar entre −90° y 90°');
    const m2 = lee(sc, 'm2', 'la masa que cuelga', { opcional: true, estricto: true }), d = lee(sc, 'd', 'la distancia', { opcional: true, estricto: true });
    const v0 = lee(sc, 'v0', 'la velocidad inicial', { opcional: true, signo: true }) ?? 0;
    const t = th * RAD, a = al * RAD, P1 = m1 * g, Px = P1 * Math.sin(t), Py = P1 * Math.cos(t), Fx = F * Math.cos(a), Fy = F * Math.sin(a);
    const P2 = m2 ? m2 * g : 0, M = m1 + (m2 || 0);
    const N = Py - Fy;
    const pasos = [];
    const inclinado = th > 0;
    const arriba = inclinado ? 'plano arriba' : 'hacia la derecha', abajo = inclinado ? 'plano abajo' : 'hacia la izquierda';
    pasos.push({ t: 'Peso y sus componentes', html: inclinado
      ? `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b><br>$P_x = P sen θ = ${f(P1)} · sen ${f(th)}° = ${f(Px)} "N"$ (plano abajo), &ensp; $P_y = P cos θ = ${f(P1)} · cos ${f(th)}° = ${f(Py)} "N"$`
      : `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b>` });
    if (F) pasos.push({ t: 'Componentes de la fuerza aplicada', html: `$F_x = F cos α = ${f(F)} · cos ${p(al)}° = ${f(Fx)} "N"$, &ensp; $F_y = F sen α = ${f(F)} · sen ${p(al)}° = ${f(Fy)} "N"$` });
    if (N < -1e-9) throw new Error(`La fuerza levanta el bloque del plano: F sen α = ${f(Fy).replace(/<[^>]+>/g, '')} N es mayor que P${inclinado ? ' cos θ' : ''} = ${f(Py).replace(/<[^>]+>/g, '')} N`);
    const Py_ = inclinado ? 'P_y' : 'P';
    pasos.push({ t: 'Normal (no hay movimiento perpendicular al plano: ΣF<sub>y</sub> = 0)', html: Fy ? `$N + F_y − ${Py_} = 0 ⇒ N = ${f(Py)} − ${p(Fy)}$ = <b>${f(N)} N</b>` : `$N − ${Py_} = 0 ⇒ N = ${Py_}$ = <b>${f(N)} N</b>` });
    const D = Fx + P2 - Px;
    const terminos = [F ? 'F_x' : '', m2 ? 'P_2' : '', inclinado ? '− P_x' : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    const valores = [F ? f(Fx) : '', m2 ? f(P2) : '', inclinado ? `− ${f(Px)}` : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    if (m2) pasos.push({ t: 'Peso de la masa que cuelga', html: `$P_2 = m_2 g = ${f(m2)} · ${f(g)}$ = <b>${f(P2)} N</b>. La cuerda es inextensible y la polea ideal: los dos cuerpos tienen la misma aceleración y la tensión es la misma a los dos lados.` });
    pasos.push({ t: 'Fuerzas a lo largo del plano sin contar el rozamiento', html: terminos
      ? `$ΣF = ${terminos} = ${valores}$ = <b>${f(D)} N</b>${Math.abs(D) < 1e-9 ? ': está equilibrado' : D > 0 ? ` (${arriba})` : ` (${abajo})`}<br>Rozamiento estático máximo: $F_{r,máx} = μ_e N = ${f(mus)} · ${f(N)}$ = <b>${f(mus * N)} N</b>`
      : 'No hay ninguna fuerza a lo largo del plano.' });
    if (amed !== null) {
      if (Math.abs(D) < 1e-12) throw new Error('Sin fuerzas a lo largo del plano no puede acelerar: no se puede sacar μ de la aceleración');
      if (N < 1e-12) throw new Error('Con normal nula no hay rozamiento: no se puede sacar μ');
      muk = (Math.abs(D) - M * Math.abs(amed)) / N;
      if (muk < -1e-12) throw new Error(`Con esas fuerzas la aceleración sin rozamiento sería ${f(Math.abs(D) / M).replace(/<[^>]+>/g, '')} m/s²: una aceleración medida mayor no es posible`);
      muk = Math.max(0, muk);
      pasos.push({ t: 'Coeficiente de rozamiento a partir de la aceleración medida', html: `Desliza ${D > 0 ? arriba : abajo}, así que $|ΣF| − μ_d N = ${m2 ? '(m_1 + m_2)' : 'm_1'} a ⇒ μ_d = {|ΣF| − ${m2 ? '(m_1 + m_2)' : 'm_1'} a}/N = {${f(Math.abs(D))} − ${f(M)} · ${f(Math.abs(amed))}}/{${f(N)}}$ = <b>${f(muk)}</b>` });
    }
    let tramos = [], tf = 0, xf = 0, fase1 = null;
    if (v0) {
      const s0 = Math.sign(v0), a1 = (D - s0 * muk * N) / M;
      const dir = s0 > 0 ? arriba : abajo;
      pasos.push({ t: `Lanzado ${dir} con $v_0 = ${f(Math.abs(v0))} "m/s"$`, html: `Mientras se mueve, el rozamiento dinámico se opone a la velocidad: $F_r = μ_d N = ${f(muk)} · ${f(N)} = ${f(muk * N)} "N"$ ${s0 > 0 ? (inclinado ? 'plano abajo' : 'hacia la izquierda') : (inclinado ? 'plano arriba' : 'hacia la derecha')}.<br>$a_1 = {ΣF ${s0 > 0 ? '−' : '+'} F_r}/{${m2 ? 'm_1 + m_2' : 'm_1'}} = {${f(D)} ${s0 > 0 ? '−' : '+'} ${f(muk * N)}}/{${f(M)}}$ = <b>${f(a1)} m/s<sup>2</sup></b> (positiva ${arriba})` });
      if (a1 * s0 < 0) {
        const t1 = -v0 / a1, x1 = -(v0 * v0) / (2 * a1);
        fase1 = { a: a1, t: t1, x: x1 };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: t1 }); tf = t1; xf = x1;
        pasos.push({ t: 'Hasta que se para', html: `$t_1 = |v_0/a_1| = ${f(Math.abs(v0))}/${f(Math.abs(a1))}$ = <b>${f(t1)} s</b>, &ensp; $s_1 = v_0^2/(2 |a_1|) = ${f(v0)}^2/(2 · ${f(Math.abs(a1))})$ = <b>${f(Math.abs(x1))} m</b> ${dir}. Luego, parado, se mira si el rozamiento estático lo sujeta:` });
      } else {
        fase1 = { a: a1, t: Infinity, x: Infinity };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: Infinity });
        pasos.push({ t: 'No se para', html: `La aceleración va en el sentido de la velocidad${Math.abs(a1) < 1e-12 ? ' o es cero' : ''}: el bloque sigue ${dir} cada vez ${Math.abs(a1) < 1e-12 ? 'a la misma velocidad' : 'más rápido'}.` });
      }
    }
    let estado, acel = 0, Fr = 0, sentido = 0;
    const Frmax = mus * N;
    if (!fase1 || isFinite(fase1.t)) {
      if (Math.abs(D) <= Frmax + 1e-9 && amed === null) {
        estado = 'reposo'; Fr = -D;
        pasos.push({ t: v0 ? 'Después se queda parado' : 'Se queda en reposo', html: `Como $|ΣF| = ${f(Math.abs(D))} "N" ≤ ${f(Frmax)} "N"$, el rozamiento estático lo sujeta: $a = 0$ y el rozamiento vale exactamente $F_r = |ΣF|$ = <b>${f(Math.abs(D))} N</b>${Math.abs(D) > 1e-9 ? `, ${D > 0 ? (inclinado ? 'plano abajo' : 'hacia la izquierda') : (inclinado ? 'plano arriba' : 'hacia la derecha')}` : ''} (no $μ_e N$, que es solo el máximo).` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: 0, dur: Infinity });
      } else {
        estado = 'mueve'; sentido = Math.sign(D); Fr = -sentido * muk * N; acel = (D + Fr) / M;
        const Mt = m2 ? '(m_1 + m_2)' : 'm_1';
        if (amed === null) pasos.push({ t: v0 ? 'Después vuelve a moverse' : 'Se mueve: rozamiento dinámico', html: `$|ΣF| = ${f(Math.abs(D))} "N" > ${f(Frmax)} "N"$, así que el bloque desliza ${sentido > 0 ? arriba : abajo} y el rozamiento se opone: $F_r = μ_d N = ${f(muk)} · ${f(N)}$ = <b>${f(Math.abs(Fr))} N</b>` });
        pasos.push({ t: 'Segunda ley de Newton', html: m2
          ? `Bloque: $T ${F ? '+ F_x ' : ''}${inclinado ? '− P_x ' : ''}${sentido > 0 ? '−' : '+'} F_r = m_1 a$; &ensp; masa que cuelga: $P_2 − T = m_2 a$<br>Sumando las dos: $a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>`
          : `$ΣF_x = ${Mt} a ⇒ a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: acel, dur: Infinity });
      }
    } else { estado = 'mueve'; sentido = Math.sign(v0); Fr = -sentido * muk * N; acel = fase1.a; }
    let T = null;
    if (m2) {
      T = m2 * (g - (fase1 && !isFinite(fase1.t) ? fase1.a : acel));
      pasos.push({ t: 'Tensión de la cuerda', html: `De la masa que cuelga: $T = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(acel)})$ = <b>${f(T)} N</b>` });
    }
    let Fmin = null;
    if (mus > 0 || inclinado) {
      const ne = Px - P2 + mus * Py, den = Math.cos(a) + mus * Math.sin(a);
      if (ne > 0 && den > 0) {
        const Fm = ne / den, Fo = ne / Math.hypot(1, mus), ao = Math.atan(mus) / RAD;
        Fmin = { F: Fm, Fopt: Fo, alfaOpt: ao };
        pasos.push({ t: 'Fuerza mínima para que empiece a subir', html: `Justo antes de arrancar ${arriba}, el rozamiento estático es máximo y va ${inclinado ? 'plano abajo' : 'hacia la izquierda'}: $F cos α ${m2 ? '+ P_2 ' : ''}= ${inclinado ? 'P_x + ' : ''}μ_e (${Py_} − F sen α) ⇒ F_{mín} = {${inclinado ? 'P_x + ' : ''}μ_e ${Py_}${m2 ? ' − P_2' : ''}}/{cos α + μ_e sen α}$ = <b>${f(Fm)} N</b> con α = ${f(al)}°.<br>La más pequeña posible se consigue tirando con $tg α = μ_e$, α = ${f(ao)}°: $F = {${inclinado ? 'P_x + ' : ''}μ_e ${Py_}${m2 ? ' − P_2' : ''}}/√(1 + μ_e^2)$ = <b>${f(Fo)} N</b>.` });
      }
    }
    let cin = null;
    if (d) {
      const rec = (tt) => tramos.reduce((s, x) => { if (tt <= x.t0) return s; const u = Math.min(tt - x.t0, x.dur); return s + Math.abs(x.v0 * u + 0.5 * x.a * u * u); }, 0);
      let tl = null, lo = 0, hi = Math.max(tf, 1);
      while (rec(hi) < d && hi < 1e5) hi *= 2;
      if (rec(hi) >= d) { for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (rec(m) < d) lo = m; else hi = m; } tl = (lo + hi) / 2; }
      if (tl !== null) {
        cin = { v: Math.abs(enTramos(tramos, tl).v), t: tl };
        pasos.push({ t: `Tras recorrer ${f(d)} m`, html: !v0 ? `MRUA desde el reposo: $v = √(2 |a| d) = √(2 · ${f(Math.abs(acel))} · ${f(d)})$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|) = √(2 · ${f(d)}/${f(Math.abs(acel))})$ = <b>${f(cin.t)} s</b>`
          : `Juntando los tramos del movimiento: $v$ = <b>${f(cin.v)} m/s</b> a los $t$ = <b>${f(cin.t)} s</b>.` });
      } else if (v0 || estado === 'reposo') pasos.push({ t: `Recorrido de ${f(d)} m`, html: `No llega a recorrer ${f(d)} m: se queda parado antes.` });
    }
    const fuerzas = [{ k: 'P', nombre: 'Peso', x: -Px, y: -Py, mod: P1 }, { k: 'N', nombre: 'Normal', x: 0, y: N, mod: N }];
    const Fr0 = v0 ? -Math.sign(v0) * muk * N : Fr;
    if (F) fuerzas.push({ k: 'F', nombre: 'Fuerza aplicada', x: Fx, y: Fy, mod: F });
    if (Math.abs(Fr0) > 1e-9) fuerzas.push({ k: 'Fr', nombre: 'Rozamiento', x: Fr0, y: 0, mod: Math.abs(Fr0) });
    const a0 = v0 ? fase1.a : acel;
    if (m2) fuerzas.push({ k: 'T', nombre: 'Tensión', x: m2 * (g - a0), y: 0, mod: m2 * (g - a0) });
    const fuerzasFin = fuerzas.filter((q) => q.k !== 'Fr' && q.k !== 'T');
    if (Math.abs(Fr) > 1e-9) fuerzasFin.push({ k: 'Fr', nombre: 'Rozamiento', x: Fr, y: 0, mod: Math.abs(Fr) });
    if (m2) fuerzasFin.push({ k: 'T', nombre: 'Tensión', x: T, y: 0, mod: T });
    return { tipo: 'plano', g, m1, th, mus, muk, F, al, m2, d, v0, amed, P1, Px, Py, Fx, Fy, N, D, Frmax, Fr, a: acel, a0, T, estado, sentido, cin, fase1, Fmin, fuerzas, fuerzasFin, tf, pasos, mov: (tt) => enTramos(tramos, tt) };
  }

  function dos(sc) {
    const g = lee(sc, 'g', 'la gravedad', { estricto: true }), th = lee(sc, 'theta', 'el ángulo del plano', { max: 89.9 });
    const m1 = lee(sc, 'm1', 'la masa del bloque 1', { estricto: true }), m2 = lee(sc, 'm2', 'la masa del bloque 2', { estricto: true });
    const F = lee(sc, 'F', 'la fuerza', { opcional: true }) ?? 0, mus = lee(sc, 'mus', 'el rozamiento estático', { opcional: true }) ?? 0;
    const mk1 = lee(sc, 'muk1', 'el rozamiento dinámico del bloque 1', { opcional: true }) ?? 0, mk2 = lee(sc, 'muk2', 'el rozamiento dinámico del bloque 2', { opcional: true }) ?? 0;
    if (Math.max(mk1, mk2) > mus && mus > 0) throw new Error('Los coeficientes dinámicos no pueden ser mayores que el estático');
    const d = lee(sc, 'd', 'la distancia', { opcional: true, estricto: true });
    const cuerda = sc.union === 'cuerda', t = th * RAD, M = m1 + m2, s = Math.sin(t), c = Math.cos(t), incl = th > 0;
    const pasos = [];
    const nomF = cuerda ? 'tira del bloque 1 (delante), que arrastra al 2 con una cuerda' : 'empuja al bloque 2 (detrás), que empuja al 1';
    pasos.push({ t: 'Los dos juntos como un solo cuerpo', html: `La fuerza ${nomF}. Se mueven juntos con la misma aceleración, así que primero se toma el sistema entero (la fuerza entre ellos es interna y se anula):<br>$M = m_1 + m_2 = ${f(m1)} + ${f(m2)} = ${f(M)} "kg"$${incl ? `, &ensp; $M g sen θ = ${f(M * g * s)} "N"$` : ''}` });
    const D = F - M * g * s;
    pasos.push({ t: '¿Se mueven?', html: `Sin rozamiento: $ΣF = F${incl ? ' − M g sen θ' : ''} = ${f(D)} "N"$. Rozamiento estático máximo: $μ_e M g ${incl ? 'cos θ ' : ''}= ${f(mus * M * g * c)} "N"$.` });
    let a = 0, Fi = null, estado;
    const nomI = cuerda ? 'T' : 'F_{12}';
    if (Math.abs(D) <= mus * M * g * c + 1e-9) {
      estado = 'reposo';
      pasos.push({ t: 'Se quedan quietos', html: `$|ΣF| ≤ μ_e M g ${incl ? 'cos θ' : ''}$: el rozamiento estático los sujeta y $a = 0$.` });
    } else {
      estado = 'mueve';
      const sg = Math.sign(D), roz = sg * g * c * (mk1 * m1 + mk2 * m2);
      a = (D - roz) / M;
      pasos.push({ t: 'Aceleración del conjunto', html: `Rozamiento dinámico: $F_r = g ${incl ? 'cos θ ' : ''}(μ_1 m_1 + μ_2 m_2) = ${f(Math.abs(roz))} "N"$, opuesto al movimiento.<br>$a = {F${incl ? ' − M g sen θ' : ''} ${sg > 0 ? '−' : '+'} F_r}/M = {${f(D)} ${sg > 0 ? '−' : '+'} ${f(Math.abs(roz))}}/{${f(M)}}$ = <b>${f(a)} m/s<sup>2</sup></b>` });
      const [mo, mko, no] = cuerda ? [m2, mk2, '2'] : [m1, mk1, '1'];
      Fi = mo * (a + g * s + sg * mko * g * c);
      pasos.push({ t: cuerda ? 'Tensión de la cuerda' : 'Fuerza de contacto entre los bloques', html: `Se aísla el bloque ${no}, que solo recibe ${cuerda ? 'la tensión' : 'el empujón del otro'}: $${nomI}${incl ? ` − m_${no} g sen θ` : ''} ${sg > 0 ? '−' : '+'} μ_${no} m_${no} g ${incl ? 'cos θ ' : ''}= m_${no} a ⇒ ${nomI} = ${f(mo)} · (${f(a)}${incl ? ` + ${f(g * s)}` : ''} ${sg > 0 ? '+' : '−'} ${f(mko * g * c)})$ = <b>${f(Fi)} N</b>${Fi < 0 ? `<br>Sale negativa: ${cuerda ? 'la cuerda se afloja y cada bloque va por su cuenta' : 'los bloques se separan'}, cada uno con su propia aceleración.` : ''}` });
      if (Math.abs(mk1 - mk2) < 1e-12) pasos.push({ t: 'Comprobación', html: `Con el mismo rozamiento en los dos, $${nomI} = F · m_${no}/(m_1 + m_2) = ${f(F)} · ${f(mo)}/${f(M)} = ${f(F * mo / M)} "N"$: no depende del rozamiento ni de la inclinación.` });
    }
    let cin = null;
    if (d && estado === 'mueve' && Math.abs(a) > 1e-12) { cin = { v: Math.sqrt(2 * Math.abs(a) * d), t: Math.sqrt((2 * d) / Math.abs(a)) }; pasos.push({ t: `Tras recorrer ${f(d)} m`, html: `$v = √(2 |a| d)$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(cin.t)} s</b>` }); }
    return { tipo: 'dos', g, th, m1, m2, F, mus, mk1, mk2, d, cuerda, a, Fi, estado, cin, pasos, mov: (tt) => ({ x: 0.5 * a * tt * tt, v: a * tt }) };
  }

  function atwood(sc) {
    const g = lee(sc, 'g', 'la gravedad', { estricto: true });
    const m1 = lee(sc, 'm1', 'la masa 1', { estricto: true }), m2 = lee(sc, 'm2', 'la masa 2', { estricto: true });
    const mp = lee(sc, 'mp', 'la masa de la polea', { opcional: true }) ?? 0, d = lee(sc, 'd', 'la distancia', { opcional: true, estricto: true });
    const a = ((m2 - m1) * g) / (m1 + m2 + mp / 2), T1 = m1 * (g + a), T2 = m2 * (g - a);
    const pasos = [];
    pasos.push({ t: 'Pesos', html: `$P_1 = m_1 g = ${f(m1 * g)} "N"$, &ensp; $P_2 = m_2 g = ${f(m2 * g)} "N"$.<br>Tomamos positivo el sentido en el que baja la masa 2 (sube la 1).` });
    pasos.push({ t: 'Segunda ley de Newton para cada cuerpo', html: `Masa 1 (sube): $T_1 − P_1 = m_1 a$<br>Masa 2 (baja): $P_2 − T_2 = m_2 a$<br>${mp ? 'Polea (disco, $I = 1/2 m_p R^2$, sin deslizar $α = a/R$): $(T_2 − T_1) R = I α ⇒ T_2 − T_1 = 1/2 m_p a$' : 'Polea sin masa: $T_1 = T_2 = T$'}` });
    pasos.push({ t: 'Aceleración', html: `Sumando: $(m_2 − m_1) g = (m_1 + m_2${mp ? ' + 1/2 m_p' : ''}) a ⇒ a = {(${f(m2)} − ${f(m1)}) · ${f(g)}}/{${f(m1)} + ${f(m2)}${mp ? ` + ${f(mp / 2)}` : ''}}$ = <b>${f(a)} m/s<sup>2</sup></b>${Math.abs(a) < 1e-12 ? ' (masas iguales: equilibrio)' : a < 0 ? ' (negativa: en realidad baja la masa 1)' : ''}` });
    pasos.push({ t: mp ? 'Tensiones' : 'Tensión', html: mp
      ? `$T_1 = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b><br>$T_2 = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(a)})$ = <b>${f(T2)} N</b>`
      : `$T = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b> &ensp;($= {2 m_1 m_2 g}/{m_1 + m_2}$)` });
    let cin = null;
    if (d && Math.abs(a) > 1e-12) {
      const A = Math.abs(a), v = Math.sqrt(2 * A * d), tt = Math.sqrt((2 * d) / A);
      cin = { v, t: tt };
      pasos.push({ t: `Cuando cada masa ha recorrido ${f(d)} m`, html: `$v = √(2 |a| d)$ = <b>${f(v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(tt)} s</b>` });
    }
    return { tipo: 'atwood', g, m1, m2, mp, d, a, T1, T2, cin, pasos, mov: (t) => ({ x: 0.5 * a * t * t, v: a * t }) };
  }

  function circular(sc) {
    const g = lee(sc, 'g', 'la gravedad', { estricto: true }), m = lee(sc, 'm', 'la masa', { estricto: true });
    const caso = sc.caso || 'peralte', pasos = [], r = { tipo: 'circular', caso, g, m, pasos };
    if (caso === 'peralte') {
      const R = lee(sc, 'R', 'el radio de la curva', { estricto: true }), be = lee(sc, 'beta', 'el ángulo del peralte', { max: 89 });
      const mu = lee(sc, 'mus', 'el rozamiento estático', { opcional: true }) ?? 0, v = lee(sc, 'v', 'la velocidad', { opcional: true });
      const b = be * RAD, sb = Math.sin(b), cb = Math.cos(b);
      Object.assign(r, { R, beta: be, mu, v });
      pasos.push({ t: 'La fuerza centrípeta', html: `Para girar en una circunferencia de radio R hace falta una fuerza neta hacia el centro $F_c = m v^2/R$. La dan la componente horizontal de la normal${be ? ' (por el peralte)' : ''} y el rozamiento.` });
      const vid = Math.sqrt(R * g * Math.tan(b));
      r.videal = vid;
      if (be) pasos.push({ t: 'Velocidad sin necesidad de rozamiento', html: `Solo con la normal: $N sen β = m v^2/R$, $N cos β = m g ⇒ v = √(R g tg β) = √(${f(R)} · ${f(g)} · tg ${f(be)}°)$ = <b>${f(vid)} m/s</b> (${f(vid * 3.6)} km/h)` });
      const dmax = cb - mu * sb, vmax = dmax > 1e-12 ? Math.sqrt((R * g * (sb + mu * cb)) / dmax) : Infinity;
      const nmin = sb - mu * cb, vmin = nmin > 0 ? Math.sqrt((R * g * nmin) / (cb + mu * sb)) : 0;
      Object.assign(r, { vmax, vmin });
      pasos.push({ t: 'Velocidad máxima sin derrapar', html: `A la velocidad máxima el rozamiento es máximo y apunta hacia dentro (plano abajo):<br>$v_{máx} = √({R g (sen β + μ_e cos β)}/{cos β − μ_e sen β})$ = <b>${isFinite(vmax) ? `${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)` : '∞</b>: con ese peralte y ese rozamiento no derrapa nunca hacia fuera'}` });
      if (be) pasos.push({ t: 'Velocidad mínima sin resbalar hacia dentro', html: nmin > 0 ? `Si va muy despacio resbala hacia el centro; el rozamiento apunta plano arriba:<br>$v_{mín} = √({R g (sen β − μ_e cos β)}/{cos β + μ_e sen β})$ = <b>${f(vmin)} m/s</b> (${f(vmin * 3.6)} km/h)` : `Como $μ_e ≥ tg β$, puede ir tan despacio como quiera (incluso parado) sin resbalar.` });
      if (v !== null) {
        const N = m * (g * cb + (v * v / R) * sb), fr = m * ((v * v / R) * cb - g * sb);
        Object.assign(r, { N, fr, derrapa: Math.abs(fr) > mu * N + 1e-9 });
        pasos.push({ t: `A ${f(v)} m/s`, html: `Horizontal: $N sen β + F_r cos β = m v^2/R$; vertical: $N cos β − F_r sen β = m g$ ($F_r$ positiva hacia dentro):<br>$N = m (g cos β + v^2/R sen β)$ = <b>${f(N)} N</b>, &ensp; $F_r = m (v^2/R cos β − g sen β)$ = <b>${f(fr)} N</b><br>${r.derrapa ? `Necesita un rozamiento de ${f(Math.abs(fr))} N y el máximo es $μ_e N = ${f(mu * N)} "N"$: <b>${fr > 0 ? 'derrapa hacia fuera' : 'resbala hacia dentro'}</b>.` : `El rozamiento necesario cabe en el máximo $μ_e N = ${f(mu * N)} "N"$: <b>toma la curva</b>.`}` });
      }
    } else if (caso === 'conico') {
      const L = lee(sc, 'L', 'la longitud del hilo', { estricto: true }), an = lee(sc, 'ang', 'el ángulo con la vertical', { opcional: true, max: 89.9 }), w = lee(sc, 'w', 'la velocidad angular', { opcional: true, estricto: true });
      if (an === null && w === null) throw new Error('Falta el ángulo con la vertical o la velocidad angular');
      let th;
      if (an !== null) th = an * RAD;
      else {
        const cth = g / (w * w * L);
        if (cth >= 1) throw new Error(`Con ω ≤ √(g/L) = ${f(Math.sqrt(g / L)).replace(/<[^>]+>/g, '')} rad/s el hilo no se separa de la vertical`);
        th = Math.acos(cth);
        pasos.push({ t: 'Ángulo a partir de ω', html: `$cos θ = g/(ω^2 L) = ${f(g)}/(${f(w)}^2 · ${f(L)}) ⇒ θ$ = <b>${f(th / RAD)}°</b>` });
      }
      const T = (m * g) / Math.cos(th), Rr = L * Math.sin(th), v = Math.sqrt(g * Rr * Math.tan(th)), om = v / Rr, per = (2 * Math.PI) / om;
      Object.assign(r, { L, ang: th / RAD, T, R: Rr, v, w: om, periodo: per });
      pasos.push({ t: 'Fuerzas', html: `Solo actúan el peso y la tensión. Vertical: $T cos θ = m g ⇒ T = {m g}/{cos θ} = {${f(m)} · ${f(g)}}/{cos ${f(th / RAD)}°}$ = <b>${f(T)} N</b>` });
      pasos.push({ t: 'Radio y velocidad', html: `$r = L sen θ = ${f(Rr)} "m"$. Horizontal: $T sen θ = m v^2/r ⇒ v = √(g r tg θ)$ = <b>${f(v)} m/s</b>, &ensp; $ω = v/r$ = <b>${f(om)} rad/s</b>` });
      pasos.push({ t: 'Periodo', html: `$T_{vuelta} = 2 π √({L cos θ}/g) = 2 π/ω$ = <b>${f(per)} s</b> (no depende de la masa)` });
    } else {
      const R = lee(sc, 'R', 'el radio', { estricto: true }), v = lee(sc, 'v', 'la velocidad');
      const loma = caso === 'loma', ac = (v * v) / R, N = m * (g + (loma ? -ac : ac)), vmax = Math.sqrt(g * R);
      Object.assign(r, { R, v, N, vmax, despega: loma && N < 0 });
      pasos.push({ t: loma ? 'En lo alto de la loma' : 'En el fondo de la hondonada', html: `El centro de la curva está ${loma ? 'debajo' : 'encima'}; la fuerza neta hacia él es la centrípeta:<br>$${loma ? 'm g − N' : 'N − m g'} = m v^2/R ⇒ N = m (g ${loma ? '−' : '+'} v^2/R) = ${f(m)} · (${f(g)} ${loma ? '−' : '+'} ${f(ac)})$ = <b>${f(N)} N</b>` });
      pasos.push({ t: 'Peso aparente', html: `$N/(m g) = ${f(N / (m * g))}$: se nota ${N < m * g ? 'más ligero' : 'más pesado'} que en reposo.${loma ? `<br>Despega del suelo si $N < 0$, es decir si $v > √(g R)$ = <b>${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)${N < 0 ? ': <b>a esta velocidad despega</b>.' : '.'}` : ''}` });
    }
    return r;
  }

  function muelle(sc) {
    const g = lee(sc, 'g', 'la gravedad', { estricto: true }), k1 = lee(sc, 'k', 'la constante del muelle', { estricto: true });
    const k2 = lee(sc, 'k2', 'la constante del segundo muelle', { opcional: true, estricto: true });
    const m = lee(sc, 'm', 'la masa', { opcional: true, estricto: true }), th = lee(sc, 'theta', 'el ángulo', { opcional: true, max: 90 }) ?? 90;
    const mu = lee(sc, 'mus', 'el rozamiento estático', { opcional: true }) ?? 0, xd = lee(sc, 'x', 'el alargamiento', { opcional: true, signo: true });
    const pasos = [];
    let k = k1;
    if (k2) {
      const serie = sc.asoc !== 'paralelo';
      k = serie ? (k1 * k2) / (k1 + k2) : k1 + k2;
      pasos.push({ t: `Muelles en ${serie ? 'serie' : 'paralelo'}`, html: serie ? `Los dos soportan la misma fuerza y se suman los alargamientos: $1/k = 1/k_1 + 1/k_2 ⇒ k = {k_1 k_2}/{k_1 + k_2} = {${f(k1)} · ${f(k2)}}/{${f(k1)} + ${f(k2)}}$ = <b>${f(k)} N/m</b>` : `Se estiran lo mismo y se suman las fuerzas: $k = k_1 + k_2 = ${f(k1)} + ${f(k2)}$ = <b>${f(k)} N/m</b>` });
    }
    const r = { tipo: 'muelle', g, k1, k2, k, m, th, mu, pasos };
    if (xd !== null) { r.Fx = k * xd; pasos.push({ t: 'Ley de Hooke', html: `$F = k x = ${f(k)} · ${p(xd)}$ = <b>${f(k * xd)} N</b> (el muelle tira en sentido contrario al alargamiento)` }); }
    if (m) {
      const t = th * RAD, Pp = m * g * Math.sin(t), Nn = m * g * Math.cos(t), colgado = th >= 90 - 1e-9;
      const x0 = Pp / k, xmin = Math.max(0, (Pp - mu * Nn)) / k, xmax = (Pp + mu * Nn) / k;
      Object.assign(r, { x0, xmin, xmax });
      pasos.push({ t: colgado ? 'Masa colgada en equilibrio' : 'Bloque sujeto por el muelle en el plano', html: colgado
        ? `$k x = m g ⇒ x = {m g}/k = {${f(m)} · ${f(g)}}/{${f(k)}}$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)`
        : `Sin rozamiento: $k x = m g sen θ ⇒ x = {m g sen θ}/k$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)${mu ? `<br>Con rozamiento estático el bloque se queda quieto para cualquier alargamiento entre $x_{mín} = {m g (sen θ − μ_e cos θ)}/k$ = <b>${f(xmin)} m</b> y $x_{máx} = {m g (sen θ + μ_e cos θ)}/k$ = <b>${f(xmax)} m</b>` : ''}` });
      const w = Math.sqrt(k / m), T = (2 * Math.PI) / w;
      Object.assign(r, { w, periodo: T });
      pasos.push({ t: 'Si se separa del equilibrio (sin rozamiento)', html: `Oscila con un movimiento armónico simple: $ω = √(k/m) = √(${f(k)}/${f(m)})$ = <b>${f(w)} rad/s</b>, &ensp; $T = 2 π √(m/k)$ = <b>${f(T)} s</b> (no depende de la gravedad ni de la inclinación)` });
    }
    if (pasos.length === 0) throw new Error('Pon la masa, un alargamiento o un segundo muelle para calcular algo');
    return r;
  }

  function resolver(sc) {
    if (sc.tipo === 'atwood') return atwood(sc);
    if (sc.tipo === 'dos') return dos(sc);
    if (sc.tipo === 'circular') return circular(sc);
    if (sc.tipo === 'muelle') return muelle(sc);
    return plano(sc);
  }

  const G = '9,8';
  const ejemplos = [
    { clave: 'horizontal', nombre: 'Tirar de una caja con una cuerda inclinada', sc: { tipo: 'plano', g: G, m1: '20', theta: '0', mus: '0,4', muk: '0,3', F: '100', alfa: '30', m2: '', v0: '', amed: '', d: '5' } },
    { clave: 'inclinado-baja', nombre: 'Bloque que desliza por un plano inclinado', sc: { tipo: 'plano', g: G, m1: '5', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '', amed: '', d: '2' } },
    { clave: 'inclinado-quieto', nombre: 'El rozamiento sujeta el bloque', sc: { tipo: 'plano', g: G, m1: '5', theta: '20', mus: '0,5', muk: '0,4', F: '', alfa: '', m2: '', v0: '', amed: '', d: '' } },
    { clave: 'empujar-arriba', nombre: 'Subir un bloque empujando paralelo al plano', sc: { tipo: 'plano', g: G, m1: '10', theta: '25', mus: '0,25', muk: '0,2', F: '80', alfa: '0', m2: '', v0: '', amed: '', d: '3' } },
    { clave: 'lanzado-arriba', nombre: 'Bloque lanzado plano arriba que frena y vuelve', sc: { tipo: 'plano', g: G, m1: '2', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '6', amed: '', d: '' } },
    { clave: 'frenada', nombre: 'Caja que se desliza por el suelo hasta pararse', sc: { tipo: 'plano', g: G, m1: '8', theta: '0', mus: '0,4', muk: '0,3', F: '', alfa: '', m2: '', v0: '5', amed: '', d: '' } },
    { clave: 'mu-medida', nombre: 'Coeficiente de rozamiento a partir de la aceleración', sc: { tipo: 'plano', g: G, m1: '3', theta: '35', mus: '', muk: '', F: '', alfa: '', m2: '', v0: '', amed: '3,2', d: '' } },
    { clave: 'mesa-polea', nombre: 'Bloque en una mesa y masa colgando', sc: { tipo: 'plano', g: G, m1: '4', theta: '0', mus: '0,3', muk: '0,25', F: '', alfa: '', m2: '2', v0: '', amed: '', d: '1' } },
    { clave: 'plano-polea', nombre: 'Plano inclinado con polea y masa colgando', sc: { tipo: 'plano', g: G, m1: '6', theta: '37', mus: '0,2', muk: '0,15', F: '', alfa: '', m2: '5', v0: '', amed: '', d: '1,5' } },
    { clave: 'contacto', nombre: 'Dos cajas en contacto empujadas por el suelo', sc: { tipo: 'dos', union: 'contacto', g: G, m1: '3', m2: '5', theta: '0', mus: '0,3', muk1: '0,2', muk2: '0,2', F: '40', d: '' } },
    { clave: 'cuerda-plano', nombre: 'Dos bloques unidos por una cuerda subiendo un plano', sc: { tipo: 'dos', union: 'cuerda', g: G, m1: '4', m2: '2', theta: '20', mus: '0,3', muk1: '0,25', muk2: '0,1', F: '60', d: '2' } },
    { clave: 'atwood', nombre: 'Máquina de Atwood', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '', d: '2' } },
    { clave: 'atwood-polea', nombre: 'Máquina de Atwood con polea con masa', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '2', d: '2' } },
    { clave: 'peralte', nombre: 'Coche en una curva peraltada', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1200', R: '80', beta: '15', mus: '0,5', v: '25', L: '', ang: '', w: '' } },
    { clave: 'curva-plana', nombre: 'Curva sin peralte: velocidad máxima', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1000', R: '50', beta: '0', mus: '0,6', v: '20', L: '', ang: '', w: '' } },
    { clave: 'conico', nombre: 'Péndulo cónico', sc: { tipo: 'circular', caso: 'conico', g: G, m: '0,5', L: '1,2', ang: '30', w: '', R: '', v: '' } },
    { clave: 'loma', nombre: 'Coche en un cambio de rasante', sc: { tipo: 'circular', caso: 'loma', g: G, m: '900', R: '40', v: '15' } },
    { clave: 'muelle-colgado', nombre: 'Masa colgada de un muelle', sc: { tipo: 'muelle', g: G, k: '200', k2: '', asoc: 'serie', m: '0,5', theta: '90', mus: '', x: '' } },
    { clave: 'muelle-plano', nombre: 'Bloque sujeto por dos muelles en un plano', sc: { tipo: 'muelle', g: G, k: '300', k2: '200', asoc: 'paralelo', m: '4', theta: '30', mus: '0,2', x: '' } },
  ];

  return { plano, dos, atwood, circular, muelle, resolver, ejemplos, f };
})();

