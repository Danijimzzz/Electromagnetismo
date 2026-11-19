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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Es fehlt ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (!signo && (estricto ? v <= min : v < min)) throw new Error(`${may(nom)} muss ${estricto ? 'größer als' : 'mindestens'} ${f(min)} sein`);
    if (v > max) throw new Error(`${may(nom)} darf ${f(max)} nicht überschreiten`);
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
    const g = lee(sc, 'g', 'die Erdbeschleunigung', { estricto: true });
    const m1 = lee(sc, 'm1', 'die Masse des Blocks', { estricto: true }), th = lee(sc, 'theta', 'der Winkel der Ebene', { max: 90 });
    const mus = lee(sc, 'mus', 'der Haftreibungskoeffizient', { opcional: true }) ?? 0;
    let muk = lee(sc, 'muk', 'der Gleitreibungskoeffizient', { opcional: true }) ?? 0;
    const amed = lee(sc, 'amed', 'die gemessene Beschleunigung', { opcional: true });
    if (amed === null && muk > mus) throw new Error('Der Gleitreibungskoeffizient darf nicht größer als der Haftreibungskoeffizient sein');
    const F = lee(sc, 'F', 'die angreifende Kraft', { opcional: true }) ?? 0, al = vacio(sc.alfa) ? 0 : leeNum(sc.alfa);
    if (!isFinite(al) || al < -90 || al > 90) throw new Error('Der Winkel der Kraft muss zwischen −90° und 90° liegen');
    const m2 = lee(sc, 'm2', 'die hängende Masse', { opcional: true, estricto: true }), d = lee(sc, 'd', 'die Strecke', { opcional: true, estricto: true });
    const v0 = lee(sc, 'v0', 'die Anfangsgeschwindigkeit', { opcional: true, signo: true }) ?? 0;
    const t = th * RAD, a = al * RAD, P1 = m1 * g, Px = P1 * Math.sin(t), Py = P1 * Math.cos(t), Fx = F * Math.cos(a), Fy = F * Math.sin(a);
    const P2 = m2 ? m2 * g : 0, M = m1 + (m2 || 0);
    const N = Py - Fy;
    const pasos = [];
    const inclinado = th > 0;
    const arriba = inclinado ? 'hangaufwärts' : 'nach rechts', abajo = inclinado ? 'hangabwärts' : 'nach links';
    pasos.push({ t: 'Gewichtskraft und ihre Komponenten', html: inclinado
      ? `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b><br>$P_x = P sin θ = ${f(P1)} · sin ${f(th)}° = ${f(Px)} "N"$ (hangabwärts), &ensp; $P_y = P cos θ = ${f(P1)} · cos ${f(th)}° = ${f(Py)} "N"$`
      : `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b>` });
    if (F) pasos.push({ t: 'Komponenten der angreifenden Kraft', html: `$F_x = F cos α = ${f(F)} · cos ${p(al)}° = ${f(Fx)} "N"$, &ensp; $F_y = F sin α = ${f(F)} · sin ${p(al)}° = ${f(Fy)} "N"$` });
    if (N < -1e-9) throw new Error(`Die Kraft hebt den Block von der Ebene ab: F sin α = ${f(Fy).replace(/<[^>]+>/g, '')} N ist größer als P${inclinado ? ' cos θ' : ''} = ${f(Py).replace(/<[^>]+>/g, '')} N`);
    const Py_ = inclinado ? 'P_y' : 'P';
    pasos.push({ t: 'Normalkraft (keine Bewegung senkrecht zur Ebene: ΣF<sub>y</sub> = 0)', html: Fy ? `$N + F_y − ${Py_} = 0 ⇒ N = ${f(Py)} − ${p(Fy)}$ = <b>${f(N)} N</b>` : `$N − ${Py_} = 0 ⇒ N = ${Py_}$ = <b>${f(N)} N</b>` });
    const D = Fx + P2 - Px;
    const terminos = [F ? 'F_x' : '', m2 ? 'P_2' : '', inclinado ? '− P_x' : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    const valores = [F ? f(Fx) : '', m2 ? f(P2) : '', inclinado ? `− ${f(Px)}` : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    if (m2) pasos.push({ t: 'Gewichtskraft der hängenden Masse', html: `$P_2 = m_2 g = ${f(m2)} · ${f(g)}$ = <b>${f(P2)} N</b>. Das Seil ist undehnbar und die Rolle ideal: Beide Körper haben dieselbe Beschleunigung, und die Seilkraft ist auf beiden Seiten gleich.` });
    pasos.push({ t: 'Kräfte längs der Ebene ohne Reibung', html: terminos
      ? `$ΣF = ${terminos} = ${valores}$ = <b>${f(D)} N</b>${Math.abs(D) < 1e-9 ? ': ist im Gleichgewicht' : D > 0 ? ` (${arriba})` : ` (${abajo})`}<br>Maximale Haftreibung: $F_{r,max} = μ_e N = ${f(mus)} · ${f(N)}$ = <b>${f(mus * N)} N</b>`
      : 'Es gibt keine Kraft längs der Ebene.' });
    if (amed !== null) {
      if (Math.abs(D) < 1e-12) throw new Error('Ohne Kräfte längs der Ebene kann er nicht beschleunigen: μ lässt sich nicht aus der Beschleunigung bestimmen');
      if (N < 1e-12) throw new Error('Bei verschwindender Normalkraft gibt es keine Reibung: μ lässt sich nicht bestimmen');
      muk = (Math.abs(D) - M * Math.abs(amed)) / N;
      if (muk < -1e-12) throw new Error(`Mit diesen Kräften wäre die Beschleunigung ohne Reibung ${f(Math.abs(D) / M).replace(/<[^>]+>/g, '')} m/s²: eine größere gemessene Beschleunigung ist nicht möglich`);
      muk = Math.max(0, muk);
      pasos.push({ t: 'Reibungskoeffizient aus der gemessenen Beschleunigung', html: `Er gleitet ${D > 0 ? arriba : abajo}, also $|ΣF| − μ_d N = ${m2 ? '(m_1 + m_2)' : 'm_1'} a ⇒ μ_d = {|ΣF| − ${m2 ? '(m_1 + m_2)' : 'm_1'} a}/N = {${f(Math.abs(D))} − ${f(M)} · ${f(Math.abs(amed))}}/{${f(N)}}$ = <b>${f(muk)}</b>` });
    }
    let tramos = [], tf = 0, xf = 0, fase1 = null;
    if (v0) {
      const s0 = Math.sign(v0), a1 = (D - s0 * muk * N) / M;
      const dir = s0 > 0 ? arriba : abajo;
      pasos.push({ t: `Angestoßen ${dir} mit $v_0 = ${f(Math.abs(v0))} "m/s"$`, html: `Solange er sich bewegt, wirkt die Gleitreibung der Geschwindigkeit entgegen: $F_r = μ_d N = ${f(muk)} · ${f(N)} = ${f(muk * N)} "N"$ ${s0 > 0 ? (inclinado ? 'hangabwärts' : 'nach links') : (inclinado ? 'hangaufwärts' : 'nach rechts')}.<br>$a_1 = {ΣF ${s0 > 0 ? '−' : '+'} F_r}/{${m2 ? 'm_1 + m_2' : 'm_1'}} = {${f(D)} ${s0 > 0 ? '−' : '+'} ${f(muk * N)}}/{${f(M)}}$ = <b>${f(a1)} m/s<sup>2</sup></b> (positiv ${arriba})` });
      if (a1 * s0 < 0) {
        const t1 = -v0 / a1, x1 = -(v0 * v0) / (2 * a1);
        fase1 = { a: a1, t: t1, x: x1 };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: t1 }); tf = t1; xf = x1;
        pasos.push({ t: 'Bis er stehen bleibt', html: `$t_1 = |v_0/a_1| = ${f(Math.abs(v0))}/${f(Math.abs(a1))}$ = <b>${f(t1)} s</b>, &ensp; $s_1 = v_0^2/(2 |a_1|) = ${f(v0)}^2/(2 · ${f(Math.abs(a1))})$ = <b>${f(Math.abs(x1))} m</b> ${dir}. Dann, im Stillstand, prüft man, ob die Haftreibung ihn hält:` });
      } else {
        fase1 = { a: a1, t: Infinity, x: Infinity };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: Infinity });
        pasos.push({ t: 'Er bleibt nicht stehen', html: `Die Beschleunigung zeigt in Richtung der Geschwindigkeit${Math.abs(a1) < 1e-12 ? ' oder ist null' : ''}: Der Block bewegt sich weiter ${dir}, ${Math.abs(a1) < 1e-12 ? 'mit gleicher Geschwindigkeit' : 'immer schneller'}.` });
      }
    }
    let estado, acel = 0, Fr = 0, sentido = 0;
    const Frmax = mus * N;
    if (!fase1 || isFinite(fase1.t)) {
      if (Math.abs(D) <= Frmax + 1e-9 && amed === null) {
        estado = 'reposo'; Fr = -D;
        pasos.push({ t: v0 ? 'Danach bleibt er stehen' : 'Er bleibt in Ruhe', html: `Da $|ΣF| = ${f(Math.abs(D))} "N" ≤ ${f(Frmax)} "N"$, hält ihn die Haftreibung: $a = 0$, und die Reibung ist genau $F_r = |ΣF|$ = <b>${f(Math.abs(D))} N</b>${Math.abs(D) > 1e-9 ? `, ${D > 0 ? (inclinado ? 'hangabwärts' : 'nach links') : (inclinado ? 'hangaufwärts' : 'nach rechts')}` : ''} (nicht $μ_e N$, das nur der Höchstwert ist).` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: 0, dur: Infinity });
      } else {
        estado = 'mueve'; sentido = Math.sign(D); Fr = -sentido * muk * N; acel = (D + Fr) / M;
        const Mt = m2 ? '(m_1 + m_2)' : 'm_1';
        if (amed === null) pasos.push({ t: v0 ? 'Danach bewegt er sich wieder' : 'Er bewegt sich: Gleitreibung', html: `$|ΣF| = ${f(Math.abs(D))} "N" > ${f(Frmax)} "N"$, also gleitet der Block ${sentido > 0 ? arriba : abajo}, und die Reibung wirkt entgegen: $F_r = μ_d N = ${f(muk)} · ${f(N)}$ = <b>${f(Math.abs(Fr))} N</b>` });
        pasos.push({ t: 'Zweites Newtonsches Gesetz', html: m2
          ? `Block: $T ${F ? '+ F_x ' : ''}${inclinado ? '− P_x ' : ''}${sentido > 0 ? '−' : '+'} F_r = m_1 a$; &ensp; hängende Masse: $P_2 − T = m_2 a$<br>Addiert man beide: $a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>`
          : `$ΣF_x = ${Mt} a ⇒ a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: acel, dur: Infinity });
      }
    } else { estado = 'mueve'; sentido = Math.sign(v0); Fr = -sentido * muk * N; acel = fase1.a; }
    let T = null;
    if (m2) {
      T = m2 * (g - (fase1 && !isFinite(fase1.t) ? fase1.a : acel));
      pasos.push({ t: 'Seilkraft', html: `Aus der hängenden Masse: $T = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(acel)})$ = <b>${f(T)} N</b>` });
    }
    let Fmin = null;
    if (mus > 0 || inclinado) {
      const ne = Px - P2 + mus * Py, den = Math.cos(a) + mus * Math.sin(a);
      if (ne > 0 && den > 0) {
        const Fm = ne / den, Fo = ne / Math.hypot(1, mus), ao = Math.atan(mus) / RAD;
        Fmin = { F: Fm, Fopt: Fo, alfaOpt: ao };
        pasos.push({ t: 'Mindestkraft, damit er anfängt, nach oben zu gleiten', html: `Kurz bevor er sich ${arriba} in Bewegung setzt, ist die Haftreibung maximal und zeigt ${inclinado ? 'hangabwärts' : 'nach links'}: $F cos α ${m2 ? '+ P_2 ' : ''}= ${inclinado ? 'P_x + ' : ''}μ_e (${Py_} − F sin α) ⇒ F_{min} = {${inclinado ? 'P_x + ' : ''}μ_e ${Py_}${m2 ? ' − P_2' : ''}}/{cos α + μ_e sin α}$ = <b>${f(Fm)} N</b> mit α = ${f(al)}°.<br>Die kleinstmögliche erreicht man, wenn man mit $tan α = μ_e$ zieht, α = ${f(ao)}°: $F = {${inclinado ? 'P_x + ' : ''}μ_e ${Py_}${m2 ? ' − P_2' : ''}}/√(1 + μ_e^2)$ = <b>${f(Fo)} N</b>.` });
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
        pasos.push({ t: `Nach ${f(d)} m Weg`, html: !v0 ? `Gleichmäßig beschleunigte Bewegung aus der Ruhe: $v = √(2 |a| d) = √(2 · ${f(Math.abs(acel))} · ${f(d)})$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|) = √(2 · ${f(d)}/${f(Math.abs(acel))})$ = <b>${f(cin.t)} s</b>`
          : `Fasst man die Abschnitte der Bewegung zusammen: $v$ = <b>${f(cin.v)} m/s</b> nach $t$ = <b>${f(cin.t)} s</b>.` });
      } else if (v0 || estado === 'reposo') pasos.push({ t: `Weg von ${f(d)} m`, html: `Er legt ${f(d)} m nicht zurück: Er bleibt vorher stehen.` });
    }
    const fuerzas = [{ k: 'P', nombre: 'Gewichtskraft', x: -Px, y: -Py, mod: P1 }, { k: 'N', nombre: 'Normalkraft', x: 0, y: N, mod: N }];
    const Fr0 = v0 ? -Math.sign(v0) * muk * N : Fr;
    if (F) fuerzas.push({ k: 'F', nombre: 'Angreifende Kraft', x: Fx, y: Fy, mod: F });
    if (Math.abs(Fr0) > 1e-9) fuerzas.push({ k: 'Fr', nombre: 'Reibung', x: Fr0, y: 0, mod: Math.abs(Fr0) });
    const a0 = v0 ? fase1.a : acel;
    if (m2) fuerzas.push({ k: 'T', nombre: 'Seilkraft', x: m2 * (g - a0), y: 0, mod: m2 * (g - a0) });
    const fuerzasFin = fuerzas.filter((q) => q.k !== 'Fr' && q.k !== 'T');
    if (Math.abs(Fr) > 1e-9) fuerzasFin.push({ k: 'Fr', nombre: 'Reibung', x: Fr, y: 0, mod: Math.abs(Fr) });
    if (m2) fuerzasFin.push({ k: 'T', nombre: 'Seilkraft', x: T, y: 0, mod: T });
    return { tipo: 'plano', g, m1, th, mus, muk, F, al, m2, d, v0, amed, P1, Px, Py, Fx, Fy, N, D, Frmax, Fr, a: acel, a0, T, estado, sentido, cin, fase1, Fmin, fuerzas, fuerzasFin, tf, pasos, mov: (tt) => enTramos(tramos, tt) };
  }

  function dos(sc) {
    const g = lee(sc, 'g', 'die Erdbeschleunigung', { estricto: true }), th = lee(sc, 'theta', 'der Winkel der Ebene', { max: 89.9 });
    const m1 = lee(sc, 'm1', 'die Masse von Block 1', { estricto: true }), m2 = lee(sc, 'm2', 'die Masse von Block 2', { estricto: true });
    const F = lee(sc, 'F', 'die Kraft', { opcional: true }) ?? 0, mus = lee(sc, 'mus', 'die Haftreibung', { opcional: true }) ?? 0;
    const mk1 = lee(sc, 'muk1', 'die Gleitreibung von Block 1', { opcional: true }) ?? 0, mk2 = lee(sc, 'muk2', 'die Gleitreibung von Block 2', { opcional: true }) ?? 0;
    if (Math.max(mk1, mk2) > mus && mus > 0) throw new Error('Die Gleitreibungskoeffizienten dürfen nicht größer als der Haftreibungskoeffizient sein');
    const d = lee(sc, 'd', 'die Strecke', { opcional: true, estricto: true });
    const cuerda = sc.union === 'cuerda', t = th * RAD, M = m1 + m2, s = Math.sin(t), c = Math.cos(t), incl = th > 0;
    const pasos = [];
    const nomF = cuerda ? 'zieht an Block 1 (vorn), der Block 2 mit einem Seil mitzieht' : 'schiebt Block 2 (hinten), der Block 1 schiebt';
    pasos.push({ t: 'Beide zusammen als ein einziger Körper', html: `Die Kraft ${nomF}. Sie bewegen sich gemeinsam mit derselben Beschleunigung, also betrachtet man zuerst das gesamte System (die Kraft zwischen ihnen ist innerlich und hebt sich auf):<br>$M = m_1 + m_2 = ${f(m1)} + ${f(m2)} = ${f(M)} "kg"$${incl ? `, &ensp; $M g sin θ = ${f(M * g * s)} "N"$` : ''}` });
    const D = F - M * g * s;
    pasos.push({ t: 'Bewegen sie sich?', html: `Ohne Reibung: $ΣF = F${incl ? ' − M g sin θ' : ''} = ${f(D)} "N"$. Maximale Haftreibung: $μ_e M g ${incl ? 'cos θ ' : ''}= ${f(mus * M * g * c)} "N"$.` });
    let a = 0, Fi = null, estado;
    const nomI = cuerda ? 'T' : 'F_{12}';
    if (Math.abs(D) <= mus * M * g * c + 1e-9) {
      estado = 'reposo';
      pasos.push({ t: 'Sie bleiben in Ruhe', html: `$|ΣF| ≤ μ_e M g ${incl ? 'cos θ' : ''}$: Die Haftreibung hält sie, und $a = 0$.` });
    } else {
      estado = 'mueve';
      const sg = Math.sign(D), roz = sg * g * c * (mk1 * m1 + mk2 * m2);
      a = (D - roz) / M;
      pasos.push({ t: 'Beschleunigung des Gesamtsystems', html: `Gleitreibung: $F_r = g ${incl ? 'cos θ ' : ''}(μ_1 m_1 + μ_2 m_2) = ${f(Math.abs(roz))} "N"$, der Bewegung entgegengerichtet.<br>$a = {F${incl ? ' − M g sin θ' : ''} ${sg > 0 ? '−' : '+'} F_r}/M = {${f(D)} ${sg > 0 ? '−' : '+'} ${f(Math.abs(roz))}}/{${f(M)}}$ = <b>${f(a)} m/s<sup>2</sup></b>` });
      const [mo, mko, no] = cuerda ? [m2, mk2, '2'] : [m1, mk1, '1'];
      Fi = mo * (a + g * s + sg * mko * g * c);
      pasos.push({ t: cuerda ? 'Seilkraft' : 'Kontaktkraft zwischen den Blöcken', html: `Man isoliert Block ${no}, der nur ${cuerda ? 'die Seilkraft' : 'den Stoß des anderen'} erhält: $${nomI}${incl ? ` − m_${no} g sin θ` : ''} ${sg > 0 ? '−' : '+'} μ_${no} m_${no} g ${incl ? 'cos θ ' : ''}= m_${no} a ⇒ ${nomI} = ${f(mo)} · (${f(a)}${incl ? ` + ${f(g * s)}` : ''} ${sg > 0 ? '+' : '−'} ${f(mko * g * c)})$ = <b>${f(Fi)} N</b>${Fi < 0 ? `<br>Das Ergebnis ist negativ: ${cuerda ? 'das Seil erschlafft und jeder Block bewegt sich für sich' : 'die Blöcke trennen sich'}, jeder mit eigener Beschleunigung.` : ''}` });
      if (Math.abs(mk1 - mk2) < 1e-12) pasos.push({ t: 'Kontrolle', html: `Bei gleicher Reibung in beiden gilt $${nomI} = F · m_${no}/(m_1 + m_2) = ${f(F)} · ${f(mo)}/${f(M)} = ${f(F * mo / M)} "N"$: Sie hängt weder von der Reibung noch von der Neigung ab.` });
    }
    let cin = null;
    if (d && estado === 'mueve' && Math.abs(a) > 1e-12) { cin = { v: Math.sqrt(2 * Math.abs(a) * d), t: Math.sqrt((2 * d) / Math.abs(a)) }; pasos.push({ t: `Nach ${f(d)} m Weg`, html: `$v = √(2 |a| d)$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(cin.t)} s</b>` }); }
    return { tipo: 'dos', g, th, m1, m2, F, mus, mk1, mk2, d, cuerda, a, Fi, estado, cin, pasos, mov: (tt) => ({ x: 0.5 * a * tt * tt, v: a * tt }) };
  }

  function atwood(sc) {
    const g = lee(sc, 'g', 'die Erdbeschleunigung', { estricto: true });
    const m1 = lee(sc, 'm1', 'die Masse 1', { estricto: true }), m2 = lee(sc, 'm2', 'die Masse 2', { estricto: true });
    const mp = lee(sc, 'mp', 'die Masse der Rolle', { opcional: true }) ?? 0, d = lee(sc, 'd', 'die Strecke', { opcional: true, estricto: true });
    const a = ((m2 - m1) * g) / (m1 + m2 + mp / 2), T1 = m1 * (g + a), T2 = m2 * (g - a);
    const pasos = [];
    pasos.push({ t: 'Gewichtskräfte', html: `$P_1 = m_1 g = ${f(m1 * g)} "N"$, &ensp; $P_2 = m_2 g = ${f(m2 * g)} "N"$.<br>Wir nehmen die Richtung als positiv, in der Masse 2 sinkt (Masse 1 steigt).` });
    pasos.push({ t: 'Zweites Newtonsches Gesetz für jeden Körper', html: `Masse 1 (steigt): $T_1 − P_1 = m_1 a$<br>Masse 2 (sinkt): $P_2 − T_2 = m_2 a$<br>${mp ? 'Rolle (Scheibe, $I = 1/2 m_p R^2$, ohne Rutschen $α = a/R$): $(T_2 − T_1) R = I α ⇒ T_2 − T_1 = 1/2 m_p a$' : 'Rolle ohne Masse: $T_1 = T_2 = T$'}` });
    pasos.push({ t: 'Beschleunigung', html: `Addiert: $(m_2 − m_1) g = (m_1 + m_2${mp ? ' + 1/2 m_p' : ''}) a ⇒ a = {(${f(m2)} − ${f(m1)}) · ${f(g)}}/{${f(m1)} + ${f(m2)}${mp ? ` + ${f(mp / 2)}` : ''}}$ = <b>${f(a)} m/s<sup>2</sup></b>${Math.abs(a) < 1e-12 ? ' (gleiche Massen: Gleichgewicht)' : a < 0 ? ' (negativ: In Wirklichkeit sinkt Masse 1)' : ''}` });
    pasos.push({ t: mp ? 'Seilkräfte' : 'Seilkraft', html: mp
      ? `$T_1 = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b><br>$T_2 = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(a)})$ = <b>${f(T2)} N</b>`
      : `$T = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b> &ensp;($= {2 m_1 m_2 g}/{m_1 + m_2}$)` });
    let cin = null;
    if (d && Math.abs(a) > 1e-12) {
      const A = Math.abs(a), v = Math.sqrt(2 * A * d), tt = Math.sqrt((2 * d) / A);
      cin = { v, t: tt };
      pasos.push({ t: `Wenn jede Masse ${f(d)} m zurückgelegt hat`, html: `$v = √(2 |a| d)$ = <b>${f(v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(tt)} s</b>` });
    }
    return { tipo: 'atwood', g, m1, m2, mp, d, a, T1, T2, cin, pasos, mov: (t) => ({ x: 0.5 * a * t * t, v: a * t }) };
  }

  function circular(sc) {
    const g = lee(sc, 'g', 'die Erdbeschleunigung', { estricto: true }), m = lee(sc, 'm', 'die Masse', { estricto: true });
    const caso = sc.caso || 'peralte', pasos = [], r = { tipo: 'circular', caso, g, m, pasos };
    if (caso === 'peralte') {
      const R = lee(sc, 'R', 'der Radius der Kurve', { estricto: true }), be = lee(sc, 'beta', 'der Überhöhungswinkel', { max: 89 });
      const mu = lee(sc, 'mus', 'die Haftreibung', { opcional: true }) ?? 0, v = lee(sc, 'v', 'die Geschwindigkeit', { opcional: true });
      const b = be * RAD, sb = Math.sin(b), cb = Math.cos(b);
      Object.assign(r, { R, beta: be, mu, v });
      pasos.push({ t: 'Die Zentripetalkraft', html: `Um auf einem Kreis mit Radius R zu fahren, braucht man eine resultierende Kraft zum Mittelpunkt $F_c = m v^2/R$. Sie wird von der horizontalen Komponente der Normalkraft${be ? ' (durch die Überhöhung)' : ''} und der Reibung geliefert.` });
      const vid = Math.sqrt(R * g * Math.tan(b));
      r.videal = vid;
      if (be) pasos.push({ t: 'Geschwindigkeit ohne Reibung', html: `Nur mit der Normalkraft: $N sin β = m v^2/R$, $N cos β = m g ⇒ v = √(R g tan β) = √(${f(R)} · ${f(g)} · tan ${f(be)}°)$ = <b>${f(vid)} m/s</b> (${f(vid * 3.6)} km/h)` });
      const dmax = cb - mu * sb, vmax = dmax > 1e-12 ? Math.sqrt((R * g * (sb + mu * cb)) / dmax) : Infinity;
      const nmin = sb - mu * cb, vmin = nmin > 0 ? Math.sqrt((R * g * nmin) / (cb + mu * sb)) : 0;
      Object.assign(r, { vmax, vmin });
      pasos.push({ t: 'Höchstgeschwindigkeit ohne Ausbrechen', html: `Bei der Höchstgeschwindigkeit ist die Reibung maximal und zeigt nach innen (hangabwärts):<br>$v_{máx} = √({R g (sen β + μ_e cos β)}/{cos β − μ_e sen β})$ = <b>${isFinite(vmax) ? `${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)` : '∞</b>: Mit dieser Überhöhung und dieser Reibung rutscht es nie nach außen'}` });
      if (be) pasos.push({ t: 'Mindestgeschwindigkeit ohne Abrutschen nach innen', html: nmin > 0 ? `Fährt es sehr langsam, rutscht es zum Mittelpunkt; die Reibung zeigt hangaufwärts:<br>$v_{min} = √({R g (sin β − μ_e cos β)}/{cos β + μ_e sin β})$ = <b>${f(vmin)} m/s</b> (${f(vmin * 3.6)} km/h)` : `Da $μ_e ≥ tan β$, kann es beliebig langsam fahren (sogar stehen), ohne abzurutschen.` });
      if (v !== null) {
        const N = m * (g * cb + (v * v / R) * sb), fr = m * ((v * v / R) * cb - g * sb);
        Object.assign(r, { N, fr, derrapa: Math.abs(fr) > mu * N + 1e-9 });
        pasos.push({ t: `A ${f(v)} m/s`, html: `Horizontal: $N sin β + F_r cos β = m v^2/R$; vertikal: $N cos β − F_r sin β = m g$ ($F_r$ positiv nach innen):<br>$N = m (g cos β + v^2/R sin β)$ = <b>${f(N)} N</b>, &ensp; $F_r = m (v^2/R cos β − g sin β)$ = <b>${f(fr)} N</b><br>${r.derrapa ? `Es braucht eine Reibung von ${f(Math.abs(fr))} N, und der Höchstwert ist $μ_e N = ${f(mu * N)} "N"$: <b>${fr > 0 ? 'schleudert nach außen' : 'rutscht nach innen'}</b>.` : `Die nötige Reibung liegt unter dem Höchstwert $μ_e N = ${f(mu * N)} "N"$: <b>schafft die Kurve</b>.`}` });
      }
    } else if (caso === 'conico') {
      const L = lee(sc, 'L', 'die Länge des Fadens', { estricto: true }), an = lee(sc, 'ang', 'der Winkel zur Senkrechten', { opcional: true, max: 89.9 }), w = lee(sc, 'w', 'die Winkelgeschwindigkeit', { opcional: true, estricto: true });
      if (an === null && w === null) throw new Error('Es fehlt der Winkel zur Senkrechten oder die Winkelgeschwindigkeit');
      let th;
      if (an !== null) th = an * RAD;
      else {
        const cth = g / (w * w * L);
        if (cth >= 1) throw new Error(`Bei ω ≤ √(g/L) = ${f(Math.sqrt(g / L)).replace(/<[^>]+>/g, '')} rad/s löst sich der Faden nicht von der Senkrechten`);
        th = Math.acos(cth);
        pasos.push({ t: 'Winkel aus ω', html: `$cos θ = g/(ω^2 L) = ${f(g)}/(${f(w)}^2 · ${f(L)}) ⇒ θ$ = <b>${f(th / RAD)}°</b>` });
      }
      const T = (m * g) / Math.cos(th), Rr = L * Math.sin(th), v = Math.sqrt(g * Rr * Math.tan(th)), om = v / Rr, per = (2 * Math.PI) / om;
      Object.assign(r, { L, ang: th / RAD, T, R: Rr, v, w: om, periodo: per });
      pasos.push({ t: 'Kräfte', html: `Es wirken nur die Gewichtskraft und die Seilkraft. Vertikal: $T cos θ = m g ⇒ T = {m g}/{cos θ} = {${f(m)} · ${f(g)}}/{cos ${f(th / RAD)}°}$ = <b>${f(T)} N</b>` });
      pasos.push({ t: 'Radius und Geschwindigkeit', html: `$r = L sin θ = ${f(Rr)} "m"$. Horizontal: $T sin θ = m v^2/r ⇒ v = √(g r tan θ)$ = <b>${f(v)} m/s</b>, &ensp; $ω = v/r$ = <b>${f(om)} rad/s</b>` });
      pasos.push({ t: 'Periode', html: `$T_{Umlauf} = 2 π √({L cos θ}/g) = 2 π/ω$ = <b>${f(per)} s</b> (hängt nicht von der Masse ab)` });
    } else {
      const R = lee(sc, 'R', 'der Radius', { estricto: true }), v = lee(sc, 'v', 'die Geschwindigkeit');
      const loma = caso === 'loma', ac = (v * v) / R, N = m * (g + (loma ? -ac : ac)), vmax = Math.sqrt(g * R);
      Object.assign(r, { R, v, N, vmax, despega: loma && N < 0 });
      pasos.push({ t: loma ? 'Auf der Kuppe' : 'Am Grund der Senke', html: `Der Mittelpunkt der Kurve liegt ${loma ? 'unten' : 'oben'}; die resultierende Kraft zu ihm ist die Zentripetalkraft:<br>$${loma ? 'm g − N' : 'N − m g'} = m v^2/R ⇒ N = m (g ${loma ? '−' : '+'} v^2/R) = ${f(m)} · (${f(g)} ${loma ? '−' : '+'} ${f(ac)})$ = <b>${f(N)} N</b>` });
      pasos.push({ t: 'Scheinbares Gewicht', html: `$N/(m g) = ${f(N / (m * g))}$: Man fühlt sich ${N < m * g ? 'leichter' : 'schwerer'} als in Ruhe.${loma ? `<br>Er hebt vom Boden ab, wenn $N < 0$, also wenn $v > √(g R)$ = <b>${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)${N < 0 ? ': <b>bei dieser Geschwindigkeit hebt er ab</b>.' : '.'}` : ''}` });
    }
    return r;
  }

  function muelle(sc) {
    const g = lee(sc, 'g', 'die Erdbeschleunigung', { estricto: true }), k1 = lee(sc, 'k', 'die Federkonstante', { estricto: true });
    const k2 = lee(sc, 'k2', 'die Konstante der zweiten Feder', { opcional: true, estricto: true });
    const m = lee(sc, 'm', 'die Masse', { opcional: true, estricto: true }), th = lee(sc, 'theta', 'der Winkel', { opcional: true, max: 90 }) ?? 90;
    const mu = lee(sc, 'mus', 'die Haftreibung', { opcional: true }) ?? 0, xd = lee(sc, 'x', 'die Dehnung', { opcional: true, signo: true });
    const pasos = [];
    let k = k1;
    if (k2) {
      const serie = sc.asoc !== 'paralelo';
      k = serie ? (k1 * k2) / (k1 + k2) : k1 + k2;
      pasos.push({ t: `Federn in ${serie ? 'Reihenschaltung' : 'Parallelschaltung'}`, html: serie ? `Beide tragen dieselbe Kraft, und die Dehnungen addieren sich: $1/k = 1/k_1 + 1/k_2 ⇒ k = {k_1 k_2}/{k_1 + k_2} = {${f(k1)} · ${f(k2)}}/{${f(k1)} + ${f(k2)}}$ = <b>${f(k)} N/m</b>` : `Sie dehnen sich gleich weit, und die Kräfte addieren sich: $k = k_1 + k_2 = ${f(k1)} + ${f(k2)}$ = <b>${f(k)} N/m</b>` });
    }
    const r = { tipo: 'muelle', g, k1, k2, k, m, th, mu, pasos };
    if (xd !== null) { r.Fx = k * xd; pasos.push({ t: 'Hookesches Gesetz', html: `$F = k x = ${f(k)} · ${p(xd)}$ = <b>${f(k * xd)} N</b> (die Feder zieht entgegen der Dehnung)` }); }
    if (m) {
      const t = th * RAD, Pp = m * g * Math.sin(t), Nn = m * g * Math.cos(t), colgado = th >= 90 - 1e-9;
      const x0 = Pp / k, xmin = Math.max(0, (Pp - mu * Nn)) / k, xmax = (Pp + mu * Nn) / k;
      Object.assign(r, { x0, xmin, xmax });
      pasos.push({ t: colgado ? 'Hängende Masse im Gleichgewicht' : 'Block, von der Feder auf der Ebene gehalten', html: colgado
        ? `$k x = m g ⇒ x = {m g}/k = {${f(m)} · ${f(g)}}/{${f(k)}}$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)`
        : `Ohne Reibung: $k x = m g sin θ ⇒ x = {m g sin θ}/k$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)${mu ? `<br>Mit Haftreibung bleibt der Block bei jeder Dehnung zwischen $x_{min} = {m g (sin θ − μ_e cos θ)}/k$ = <b>${f(xmin)} m</b> und $x_{max} = {m g (sin θ + μ_e cos θ)}/k$ = <b>${f(xmax)} m</b> in Ruhe` : ''}` });
      const w = Math.sqrt(k / m), T = (2 * Math.PI) / w;
      Object.assign(r, { w, periodo: T });
      pasos.push({ t: 'Wird er aus dem Gleichgewicht ausgelenkt (ohne Reibung)', html: `Er schwingt harmonisch: $ω = √(k/m) = √(${f(k)}/${f(m)})$ = <b>${f(w)} rad/s</b>, &ensp; $T = 2 π √(m/k)$ = <b>${f(T)} s</b> (hängt weder von der Erdbeschleunigung noch von der Neigung ab)` });
    }
    if (pasos.length === 0) throw new Error('Gib die Masse, eine Dehnung oder eine zweite Feder an, um etwas zu berechnen');
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
    { clave: 'horizontal', nombre: 'Eine Kiste an einem schrägen Seil ziehen', sc: { tipo: 'plano', g: G, m1: '20', theta: '0', mus: '0,4', muk: '0,3', F: '100', alfa: '30', m2: '', v0: '', amed: '', d: '5' } },
    { clave: 'inclinado-baja', nombre: 'Block, der eine schiefe Ebene hinuntergleitet', sc: { tipo: 'plano', g: G, m1: '5', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '', amed: '', d: '2' } },
    { clave: 'inclinado-quieto', nombre: 'Die Reibung hält den Block', sc: { tipo: 'plano', g: G, m1: '5', theta: '20', mus: '0,5', muk: '0,4', F: '', alfa: '', m2: '', v0: '', amed: '', d: '' } },
    { clave: 'empujar-arriba', nombre: 'Einen Block parallel zur Ebene nach oben schieben', sc: { tipo: 'plano', g: G, m1: '10', theta: '25', mus: '0,25', muk: '0,2', F: '80', alfa: '0', m2: '', v0: '', amed: '', d: '3' } },
    { clave: 'lanzado-arriba', nombre: 'Nach oben angestoßener Block, der abbremst und zurückkommt', sc: { tipo: 'plano', g: G, m1: '2', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '6', amed: '', d: '' } },
    { clave: 'frenada', nombre: 'Kiste, die über den Boden bis zum Stillstand gleitet', sc: { tipo: 'plano', g: G, m1: '8', theta: '0', mus: '0,4', muk: '0,3', F: '', alfa: '', m2: '', v0: '5', amed: '', d: '' } },
    { clave: 'mu-medida', nombre: 'Reibungskoeffizient aus der Beschleunigung', sc: { tipo: 'plano', g: G, m1: '3', theta: '35', mus: '', muk: '', F: '', alfa: '', m2: '', v0: '', amed: '3,2', d: '' } },
    { clave: 'mesa-polea', nombre: 'Block auf einem Tisch und hängende Masse', sc: { tipo: 'plano', g: G, m1: '4', theta: '0', mus: '0,3', muk: '0,25', F: '', alfa: '', m2: '2', v0: '', amed: '', d: '1' } },
    { clave: 'plano-polea', nombre: 'Schiefe Ebene mit Rolle und hängender Masse', sc: { tipo: 'plano', g: G, m1: '6', theta: '37', mus: '0,2', muk: '0,15', F: '', alfa: '', m2: '5', v0: '', amed: '', d: '1,5' } },
    { clave: 'contacto', nombre: 'Zwei Kisten in Kontakt, über den Boden geschoben', sc: { tipo: 'dos', union: 'contacto', g: G, m1: '3', m2: '5', theta: '0', mus: '0,3', muk1: '0,2', muk2: '0,2', F: '40', d: '' } },
    { clave: 'cuerda-plano', nombre: 'Zwei durch ein Seil verbundene Blöcke, die eine Ebene hinaufgezogen werden', sc: { tipo: 'dos', union: 'cuerda', g: G, m1: '4', m2: '2', theta: '20', mus: '0,3', muk1: '0,25', muk2: '0,1', F: '60', d: '2' } },
    { clave: 'atwood', nombre: 'Atwoodsche Fallmaschine', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '', d: '2' } },
    { clave: 'atwood-polea', nombre: 'Atwoodsche Fallmaschine mit Rolle mit Masse', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '2', d: '2' } },
    { clave: 'peralte', nombre: 'Auto in einer überhöhten Kurve', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1200', R: '80', beta: '15', mus: '0,5', v: '25', L: '', ang: '', w: '' } },
    { clave: 'curva-plana', nombre: 'Kurve ohne Überhöhung: Höchstgeschwindigkeit', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1000', R: '50', beta: '0', mus: '0,6', v: '20', L: '', ang: '', w: '' } },
    { clave: 'conico', nombre: 'Kegelpendel', sc: { tipo: 'circular', caso: 'conico', g: G, m: '0,5', L: '1,2', ang: '30', w: '', R: '', v: '' } },
    { clave: 'loma', nombre: 'Auto an einer Gefällewechselstelle', sc: { tipo: 'circular', caso: 'loma', g: G, m: '900', R: '40', v: '15' } },
    { clave: 'muelle-colgado', nombre: 'An einer Feder hängende Masse', sc: { tipo: 'muelle', g: G, k: '200', k2: '', asoc: 'serie', m: '0,5', theta: '90', mus: '', x: '' } },
    { clave: 'muelle-plano', nombre: 'Von zwei Federn auf einer Ebene gehaltener Block', sc: { tipo: 'muelle', g: G, k: '300', k2: '200', asoc: 'paralelo', m: '4', theta: '30', mus: '0,2', x: '' } },
  ];

  return { plano, dos, atwood, circular, muelle, resolver, ejemplos, f };
})();

