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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Il manque ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} doit être un nombre`);
    if (!signo && (estricto ? v <= min : v < min)) throw new Error(`${may(nom)} doit être ${estricto ? 'strictement supérieur à' : 'au moins égal à'} ${f(min)}`);
    if (v > max) throw new Error(`${may(nom)} ne peut pas dépasser ${f(max)}`);
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
    const g = lee(sc, 'g', 'la gravité', { estricto: true });
    const m1 = lee(sc, 'm1', 'la masse du bloc', { estricto: true }), th = lee(sc, 'theta', 'l’angle du plan', { max: 90 });
    const mus = lee(sc, 'mus', 'le coefficient de frottement statique', { opcional: true }) ?? 0;
    let muk = lee(sc, 'muk', 'le coefficient de frottement dynamique', { opcional: true }) ?? 0;
    const amed = lee(sc, 'amed', 'l’accélération mesurée', { opcional: true });
    if (amed === null && muk > mus) throw new Error('Le coefficient dynamique ne peut pas être supérieur au coefficient statique');
    const F = lee(sc, 'F', 'la force appliquée', { opcional: true }) ?? 0, al = vacio(sc.alfa) ? 0 : leeNum(sc.alfa);
    if (!isFinite(al) || al < -90 || al > 90) throw new Error('L’angle de la force doit être compris entre −90° et 90°');
    const m2 = lee(sc, 'm2', 'la masse suspendue', { opcional: true, estricto: true }), d = lee(sc, 'd', 'la distance', { opcional: true, estricto: true });
    const v0 = lee(sc, 'v0', 'la vitesse initiale', { opcional: true, signo: true }) ?? 0;
    const t = th * RAD, a = al * RAD, P1 = m1 * g, Px = P1 * Math.sin(t), Py = P1 * Math.cos(t), Fx = F * Math.cos(a), Fy = F * Math.sin(a);
    const P2 = m2 ? m2 * g : 0, M = m1 + (m2 || 0);
    const N = Py - Fy;
    const pasos = [];
    const inclinado = th > 0;
    const arriba = inclinado ? 'vers le haut du plan' : 'vers la droite', abajo = inclinado ? 'vers le bas du plan' : 'vers la gauche';
    pasos.push({ t: 'Poids et ses composantes', html: inclinado
      ? `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b><br>$P_x = P sin θ = ${f(P1)} · sin ${f(th)}° = ${f(Px)} "N"$ (vers le bas du plan), &ensp; $P_y = P cos θ = ${f(P1)} · cos ${f(th)}° = ${f(Py)} "N"$`
      : `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b>` });
    if (F) pasos.push({ t: 'Composantes de la force appliquée', html: `$F_x = F cos α = ${f(F)} · cos ${p(al)}° = ${f(Fx)} "N"$, &ensp; $F_y = F sin α = ${f(F)} · sin ${p(al)}° = ${f(Fy)} "N"$` });
    if (N < -1e-9) throw new Error(`La force soulève le bloc du plan : F sin α = ${f(Fy).replace(/<[^>]+>/g, '')} N est supérieure à P${inclinado ? ' cos θ' : ''} = ${f(Py).replace(/<[^>]+>/g, '')} N`);
    const Py_ = inclinado ? 'P_y' : 'P';
    pasos.push({ t: 'Réaction normale (pas de mouvement perpendiculaire au plan : ΣF<sub>y</sub> = 0)', html: Fy ? `$N + F_y − ${Py_} = 0 ⇒ N = ${f(Py)} − ${p(Fy)}$ = <b>${f(N)} N</b>` : `$N − ${Py_} = 0 ⇒ N = ${Py_}$ = <b>${f(N)} N</b>` });
    const D = Fx + P2 - Px;
    const terminos = [F ? 'F_x' : '', m2 ? 'P_2' : '', inclinado ? '− P_x' : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    const valores = [F ? f(Fx) : '', m2 ? f(P2) : '', inclinado ? `− ${f(Px)}` : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    if (m2) pasos.push({ t: 'Poids de la masse suspendue', html: `$P_2 = m_2 g = ${f(m2)} · ${f(g)}$ = <b>${f(P2)} N</b>. La corde est inextensible et la poulie idéale : les deux corps ont la même accélération et la tension est la même des deux côtés.` });
    pasos.push({ t: 'Forces le long du plan sans compter le frottement', html: terminos
      ? `$ΣF = ${terminos} = ${valores}$ = <b>${f(D)} N</b>${Math.abs(D) < 1e-9 ? ' : il est en équilibre' : D > 0 ? ` (${arriba})` : ` (${abajo})`}<br>Frottement statique maximal : $F_{f,max} = μ_s N = ${f(mus)} · ${f(N)}$ = <b>${f(mus * N)} N</b>`
      : 'Il n’y a aucune force le long du plan.' });
    if (amed !== null) {
      if (Math.abs(D) < 1e-12) throw new Error('Sans forces le long du plan, il ne peut pas accélérer : on ne peut pas obtenir μ à partir de l’accélération');
      if (N < 1e-12) throw new Error('Avec une réaction normale nulle, il n’y a pas de frottement : on ne peut pas obtenir μ');
      muk = (Math.abs(D) - M * Math.abs(amed)) / N;
      if (muk < -1e-12) throw new Error(`Avec ces forces, l’accélération sans frottement serait de ${f(Math.abs(D) / M).replace(/<[^>]+>/g, '')} m/s² : une accélération mesurée supérieure n’est pas possible`);
      muk = Math.max(0, muk);
      pasos.push({ t: 'Coefficient de frottement à partir de l’accélération mesurée', html: `Il glisse ${D > 0 ? arriba : abajo}, donc $|ΣF| − μ_d N = ${m2 ? '(m_1 + m_2)' : 'm_1'} a ⇒ μ_d = {|ΣF| − ${m2 ? '(m_1 + m_2)' : 'm_1'} a}/N = {${f(Math.abs(D))} − ${f(M)} · ${f(Math.abs(amed))}}/{${f(N)}}$ = <b>${f(muk)}</b>` });
    }
    let tramos = [], tf = 0, xf = 0, fase1 = null;
    if (v0) {
      const s0 = Math.sign(v0), a1 = (D - s0 * muk * N) / M;
      const dir = s0 > 0 ? arriba : abajo;
      pasos.push({ t: `Lancé ${dir} avec $v_0 = ${f(Math.abs(v0))} "m/s"$`, html: `Pendant son mouvement, le frottement dynamique s’oppose à la vitesse : $F_f = μ_d N = ${f(muk)} · ${f(N)} = ${f(muk * N)} "N"$ ${s0 > 0 ? (inclinado ? 'vers le bas du plan' : 'vers la gauche') : (inclinado ? 'vers le haut du plan' : 'vers la droite')}.<br>$a_1 = {ΣF ${s0 > 0 ? '−' : '+'} F_f}/{${m2 ? 'm_1 + m_2' : 'm_1'}} = {${f(D)} ${s0 > 0 ? '−' : '+'} ${f(muk * N)}}/{${f(M)}}$ = <b>${f(a1)} m/s<sup>2</sup></b> (positive ${arriba})` });
      if (a1 * s0 < 0) {
        const t1 = -v0 / a1, x1 = -(v0 * v0) / (2 * a1);
        fase1 = { a: a1, t: t1, x: x1 };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: t1 }); tf = t1; xf = x1;
        pasos.push({ t: 'Jusqu’à l’arrêt', html: `$t_1 = |v_0/a_1| = ${f(Math.abs(v0))}/${f(Math.abs(a1))}$ = <b>${f(t1)} s</b>, &ensp; $s_1 = v_0^2/(2 |a_1|) = ${f(v0)}^2/(2 · ${f(Math.abs(a1))})$ = <b>${f(Math.abs(x1))} m</b> ${dir}. Ensuite, à l’arrêt, on regarde si le frottement statique le retient :` });
      } else {
        fase1 = { a: a1, t: Infinity, x: Infinity };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: Infinity });
        pasos.push({ t: 'Il ne s’arrête pas', html: `L’accélération est dans le sens de la vitesse${Math.abs(a1) < 1e-12 ? ' ou est nulle' : ''} : le bloc continue ${dir} ${Math.abs(a1) < 1e-12 ? 'à la même vitesse' : 'de plus en plus vite'}.` });
      }
    }
    let estado, acel = 0, Fr = 0, sentido = 0;
    const Frmax = mus * N;
    if (!fase1 || isFinite(fase1.t)) {
      if (Math.abs(D) <= Frmax + 1e-9 && amed === null) {
        estado = 'reposo'; Fr = -D;
        pasos.push({ t: v0 ? 'Ensuite il reste à l’arrêt' : 'Il reste au repos', html: `Comme $|ΣF| = ${f(Math.abs(D))} "N" ≤ ${f(Frmax)} "N"$, le frottement statique le retient : $a = 0$ et le frottement vaut exactement $F_f = |ΣF|$ = <b>${f(Math.abs(D))} N</b>${Math.abs(D) > 1e-9 ? `, ${D > 0 ? (inclinado ? 'vers le bas du plan' : 'vers la gauche') : (inclinado ? 'vers le haut du plan' : 'vers la droite')}` : ''} (et non $μ_s N$, qui n’est que le maximum).` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: 0, dur: Infinity });
      } else {
        estado = 'mueve'; sentido = Math.sign(D); Fr = -sentido * muk * N; acel = (D + Fr) / M;
        const Mt = m2 ? '(m_1 + m_2)' : 'm_1';
        if (amed === null) pasos.push({ t: v0 ? 'Ensuite il se remet en mouvement' : 'Il se déplace : frottement dynamique', html: `$|ΣF| = ${f(Math.abs(D))} "N" > ${f(Frmax)} "N"$, donc le bloc glisse ${sentido > 0 ? arriba : abajo} et le frottement s’y oppose : $F_f = μ_d N = ${f(muk)} · ${f(N)}$ = <b>${f(Math.abs(Fr))} N</b>` });
        pasos.push({ t: 'Deuxième loi de Newton', html: m2
          ? `Bloc : $T ${F ? '+ F_x ' : ''}${inclinado ? '− P_x ' : ''}${sentido > 0 ? '−' : '+'} F_f = m_1 a$ ; &ensp; masse suspendue : $P_2 − T = m_2 a$<br>En additionnant les deux : $a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>`
          : `$ΣF_x = ${Mt} a ⇒ a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: acel, dur: Infinity });
      }
    } else { estado = 'mueve'; sentido = Math.sign(v0); Fr = -sentido * muk * N; acel = fase1.a; }
    let T = null;
    if (m2) {
      T = m2 * (g - (fase1 && !isFinite(fase1.t) ? fase1.a : acel));
      pasos.push({ t: 'Tension de la corde', html: `À partir de la masse suspendue : $T = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(acel)})$ = <b>${f(T)} N</b>` });
    }
    let Fmin = null;
    if (mus > 0 || inclinado) {
      const ne = Px - P2 + mus * Py, den = Math.cos(a) + mus * Math.sin(a);
      if (ne > 0 && den > 0) {
        const Fm = ne / den, Fo = ne / Math.hypot(1, mus), ao = Math.atan(mus) / RAD;
        Fmin = { F: Fm, Fopt: Fo, alfaOpt: ao };
        pasos.push({ t: 'Force minimale pour qu’il commence à monter', html: `Juste avant de démarrer ${arriba}, le frottement statique est maximal et dirigé ${inclinado ? 'vers le bas du plan' : 'vers la gauche'} : $F cos α ${m2 ? '+ P_2 ' : ''}= ${inclinado ? 'P_x + ' : ''}μ_s (${Py_} − F sin α) ⇒ F_{min} = {${inclinado ? 'P_x + ' : ''}μ_s ${Py_}${m2 ? ' − P_2' : ''}}/{cos α + μ_s sin α}$ = <b>${f(Fm)} N</b> avec α = ${f(al)}°.<br>La plus petite possible s’obtient en tirant avec $tan α = μ_s$, α = ${f(ao)}° : $F = {${inclinado ? 'P_x + ' : ''}μ_s ${Py_}${m2 ? ' − P_2' : ''}}/√(1 + μ_s^2)$ = <b>${f(Fo)} N</b>.` });
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
        pasos.push({ t: `Après avoir parcouru ${f(d)} m`, html: !v0 ? `MRUA à partir du repos : $v = √(2 |a| d) = √(2 · ${f(Math.abs(acel))} · ${f(d)})$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|) = √(2 · ${f(d)}/${f(Math.abs(acel))})$ = <b>${f(cin.t)} s</b>`
          : `En réunissant les phases du mouvement : $v$ = <b>${f(cin.v)} m/s</b> à $t$ = <b>${f(cin.t)} s</b>.` });
      } else if (v0 || estado === 'reposo') pasos.push({ t: `Parcours de ${f(d)} m`, html: `Il ne parvient pas à parcourir ${f(d)} m : il s’arrête avant.` });
    }
    const fuerzas = [{ k: 'P', nombre: 'Poids', x: -Px, y: -Py, mod: P1 }, { k: 'N', nombre: 'Réaction normale', x: 0, y: N, mod: N }];
    const Fr0 = v0 ? -Math.sign(v0) * muk * N : Fr;
    if (F) fuerzas.push({ k: 'F', nombre: 'Force appliquée', x: Fx, y: Fy, mod: F });
    if (Math.abs(Fr0) > 1e-9) fuerzas.push({ k: 'Fr', nombre: 'Frottement', x: Fr0, y: 0, mod: Math.abs(Fr0) });
    const a0 = v0 ? fase1.a : acel;
    if (m2) fuerzas.push({ k: 'T', nombre: 'Tension', x: m2 * (g - a0), y: 0, mod: m2 * (g - a0) });
    const fuerzasFin = fuerzas.filter((q) => q.k !== 'Fr' && q.k !== 'T');
    if (Math.abs(Fr) > 1e-9) fuerzasFin.push({ k: 'Fr', nombre: 'Frottement', x: Fr, y: 0, mod: Math.abs(Fr) });
    if (m2) fuerzasFin.push({ k: 'T', nombre: 'Tension', x: T, y: 0, mod: T });
    return { tipo: 'plano', g, m1, th, mus, muk, F, al, m2, d, v0, amed, P1, Px, Py, Fx, Fy, N, D, Frmax, Fr, a: acel, a0, T, estado, sentido, cin, fase1, Fmin, fuerzas, fuerzasFin, tf, pasos, mov: (tt) => enTramos(tramos, tt) };
  }

  function dos(sc) {
    const g = lee(sc, 'g', 'la gravité', { estricto: true }), th = lee(sc, 'theta', 'l’angle du plan', { max: 89.9 });
    const m1 = lee(sc, 'm1', 'la masse du bloc 1', { estricto: true }), m2 = lee(sc, 'm2', 'la masse du bloc 2', { estricto: true });
    const F = lee(sc, 'F', 'la force', { opcional: true }) ?? 0, mus = lee(sc, 'mus', 'le frottement statique', { opcional: true }) ?? 0;
    const mk1 = lee(sc, 'muk1', 'le frottement dynamique du bloc 1', { opcional: true }) ?? 0, mk2 = lee(sc, 'muk2', 'le frottement dynamique du bloc 2', { opcional: true }) ?? 0;
    if (Math.max(mk1, mk2) > mus && mus > 0) throw new Error('Les coefficients dynamiques ne peuvent pas être supérieurs au coefficient statique');
    const d = lee(sc, 'd', 'la distance', { opcional: true, estricto: true });
    const cuerda = sc.union === 'cuerda', t = th * RAD, M = m1 + m2, s = Math.sin(t), c = Math.cos(t), incl = th > 0;
    const pasos = [];
    const nomF = cuerda ? 'tire le bloc 1 (devant), qui entraîne le 2 avec une corde' : 'pousse le bloc 2 (derrière), qui pousse le 1';
    pasos.push({ t: 'Les deux ensemble comme un seul corps', html: `La force ${nomF}. Ils se déplacent ensemble avec la même accélération ; on prend donc d’abord le système entier (la force entre eux est interne et s’annule) :<br>$M = m_1 + m_2 = ${f(m1)} + ${f(m2)} = ${f(M)} "kg"$${incl ? `, &ensp; $M g sin θ = ${f(M * g * s)} "N"$` : ''}` });
    const D = F - M * g * s;
    pasos.push({ t: 'Se déplacent-ils ?', html: `Sans frottement : $ΣF = F${incl ? ' − M g sin θ' : ''} = ${f(D)} "N"$. Frottement statique maximal : $μ_s M g ${incl ? 'cos θ ' : ''}= ${f(mus * M * g * c)} "N"$.` });
    let a = 0, Fi = null, estado;
    const nomI = cuerda ? 'T' : 'F_{12}';
    if (Math.abs(D) <= mus * M * g * c + 1e-9) {
      estado = 'reposo';
      pasos.push({ t: 'Ils restent immobiles', html: `$|ΣF| ≤ μ_s M g ${incl ? 'cos θ' : ''}$ : le frottement statique les retient et $a = 0$.` });
    } else {
      estado = 'mueve';
      const sg = Math.sign(D), roz = sg * g * c * (mk1 * m1 + mk2 * m2);
      a = (D - roz) / M;
      pasos.push({ t: 'Accélération de l’ensemble', html: `Frottement dynamique : $F_f = g ${incl ? 'cos θ ' : ''}(μ_1 m_1 + μ_2 m_2) = ${f(Math.abs(roz))} "N"$, opposé au mouvement.<br>$a = {F${incl ? ' − M g sin θ' : ''} ${sg > 0 ? '−' : '+'} F_r}/M = {${f(D)} ${sg > 0 ? '−' : '+'} ${f(Math.abs(roz))}}/{${f(M)}}$ = <b>${f(a)} m/s<sup>2</sup></b>` });
      const [mo, mko, no] = cuerda ? [m2, mk2, '2'] : [m1, mk1, '1'];
      Fi = mo * (a + g * s + sg * mko * g * c);
      pasos.push({ t: cuerda ? 'Tension de la corde' : 'Force de contact entre les blocs', html: `On isole le bloc ${no}, qui ne reçoit que ${cuerda ? 'la tension' : 'la poussée de l’autre'} : $${nomI}${incl ? ` − m_${no} g sin θ` : ''} ${sg > 0 ? '−' : '+'} μ_${no} m_${no} g ${incl ? 'cos θ ' : ''}= m_${no} a ⇒ ${nomI} = ${f(mo)} · (${f(a)}${incl ? ` + ${f(g * s)}` : ''} ${sg > 0 ? '+' : '−'} ${f(mko * g * c)})$ = <b>${f(Fi)} N</b>${Fi < 0 ? `<br>Elle est négative : ${cuerda ? 'la corde se détend et chaque bloc va de son côté' : 'les blocs se séparent'}, chacun avec sa propre accélération.` : ''}` });
      if (Math.abs(mk1 - mk2) < 1e-12) pasos.push({ t: 'Vérification', html: `Avec le même frottement sur les deux, $${nomI} = F · m_${no}/(m_1 + m_2) = ${f(F)} · ${f(mo)}/${f(M)} = ${f(F * mo / M)} "N"$ : elle ne dépend ni du frottement ni de l’inclinaison.` });
    }
    let cin = null;
    if (d && estado === 'mueve' && Math.abs(a) > 1e-12) { cin = { v: Math.sqrt(2 * Math.abs(a) * d), t: Math.sqrt((2 * d) / Math.abs(a)) }; pasos.push({ t: `Après avoir parcouru ${f(d)} m`, html: `$v = √(2 |a| d)$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(cin.t)} s</b>` }); }
    return { tipo: 'dos', g, th, m1, m2, F, mus, mk1, mk2, d, cuerda, a, Fi, estado, cin, pasos, mov: (tt) => ({ x: 0.5 * a * tt * tt, v: a * tt }) };
  }

  function atwood(sc) {
    const g = lee(sc, 'g', 'la gravité', { estricto: true });
    const m1 = lee(sc, 'm1', 'la masse 1', { estricto: true }), m2 = lee(sc, 'm2', 'la masse 2', { estricto: true });
    const mp = lee(sc, 'mp', 'la masse de la poulie', { opcional: true }) ?? 0, d = lee(sc, 'd', 'la distance', { opcional: true, estricto: true });
    const a = ((m2 - m1) * g) / (m1 + m2 + mp / 2), T1 = m1 * (g + a), T2 = m2 * (g - a);
    const pasos = [];
    pasos.push({ t: 'Poids', html: `$P_1 = m_1 g = ${f(m1 * g)} "N"$, &ensp; $P_2 = m_2 g = ${f(m2 * g)} "N"$.<br>On prend comme positif le sens dans lequel la masse 2 descend (la 1 monte).` });
    pasos.push({ t: 'Deuxième loi de Newton pour chaque corps', html: `Masse 1 (monte) : $T_1 − P_1 = m_1 a$<br>Masse 2 (descend) : $P_2 − T_2 = m_2 a$<br>${mp ? 'Poulie (disque, $I = 1/2 m_p R^2$, sans glissement $α = a/R$) : $(T_2 − T_1) R = I α ⇒ T_2 − T_1 = 1/2 m_p a$' : 'Poulie sans masse : $T_1 = T_2 = T$'}` });
    pasos.push({ t: 'Accélération', html: `En additionnant : $(m_2 − m_1) g = (m_1 + m_2${mp ? ' + 1/2 m_p' : ''}) a ⇒ a = {(${f(m2)} − ${f(m1)}) · ${f(g)}}/{${f(m1)} + ${f(m2)}${mp ? ` + ${f(mp / 2)}` : ''}}$ = <b>${f(a)} m/s<sup>2</sup></b>${Math.abs(a) < 1e-12 ? ' (masses égales : équilibre)' : a < 0 ? ' (négative : en réalité la masse 1 descend)' : ''}` });
    pasos.push({ t: mp ? 'Tensions' : 'Tension', html: mp
      ? `$T_1 = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b><br>$T_2 = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(a)})$ = <b>${f(T2)} N</b>`
      : `$T = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b> &ensp;($= {2 m_1 m_2 g}/{m_1 + m_2}$)` });
    let cin = null;
    if (d && Math.abs(a) > 1e-12) {
      const A = Math.abs(a), v = Math.sqrt(2 * A * d), tt = Math.sqrt((2 * d) / A);
      cin = { v, t: tt };
      pasos.push({ t: `Quand chaque masse a parcouru ${f(d)} m`, html: `$v = √(2 |a| d)$ = <b>${f(v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(tt)} s</b>` });
    }
    return { tipo: 'atwood', g, m1, m2, mp, d, a, T1, T2, cin, pasos, mov: (t) => ({ x: 0.5 * a * t * t, v: a * t }) };
  }

  function circular(sc) {
    const g = lee(sc, 'g', 'la gravité', { estricto: true }), m = lee(sc, 'm', 'la masse', { estricto: true });
    const caso = sc.caso || 'peralte', pasos = [], r = { tipo: 'circular', caso, g, m, pasos };
    if (caso === 'peralte') {
      const R = lee(sc, 'R', 'le rayon de la courbe', { estricto: true }), be = lee(sc, 'beta', 'l’angle de relèvement', { max: 89 });
      const mu = lee(sc, 'mus', 'le frottement statique', { opcional: true }) ?? 0, v = lee(sc, 'v', 'la vitesse', { opcional: true });
      const b = be * RAD, sb = Math.sin(b), cb = Math.cos(b);
      Object.assign(r, { R, beta: be, mu, v });
      pasos.push({ t: 'La force centripète', html: `Pour décrire un cercle de rayon R, il faut une force résultante dirigée vers le centre, $F_c = m v^2/R$. Elle est fournie par la composante horizontale de la réaction normale${be ? ' (grâce au relèvement)' : ''} et par le frottement.` });
      const vid = Math.sqrt(R * g * Math.tan(b));
      r.videal = vid;
      if (be) pasos.push({ t: 'Vitesse sans besoin de frottement', html: `Avec la seule réaction normale : $N sin β = m v^2/R$, $N cos β = m g ⇒ v = √(R g tan β) = √(${f(R)} · ${f(g)} · tan ${f(be)}°)$ = <b>${f(vid)} m/s</b> (${f(vid * 3.6)} km/h)` });
      const dmax = cb - mu * sb, vmax = dmax > 1e-12 ? Math.sqrt((R * g * (sb + mu * cb)) / dmax) : Infinity;
      const nmin = sb - mu * cb, vmin = nmin > 0 ? Math.sqrt((R * g * nmin) / (cb + mu * sb)) : 0;
      Object.assign(r, { vmax, vmin });
      pasos.push({ t: 'Vitesse maximale sans dérapage', html: `À la vitesse maximale, le frottement est maximal et dirigé vers l’intérieur (vers le bas du plan) :<br>$v_{máx} = √({R g (sen β + μ_e cos β)}/{cos β − μ_e sen β})$ = <b>${isFinite(vmax) ? `${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)` : '∞</b> : avec ce relèvement et ce frottement, il ne dérape jamais vers l’extérieur'}` });
      if (be) pasos.push({ t: 'Vitesse minimale sans glisser vers l’intérieur', html: nmin > 0 ? `Si la vitesse est trop faible, il glisse vers le centre ; le frottement est dirigé vers le haut du plan :<br>$v_{min} = √({R g (sin β − μ_s cos β)}/{cos β + μ_s sin β})$ = <b>${f(vmin)} m/s</b> (${f(vmin * 3.6)} km/h)` : `Comme $μ_s ≥ tan β$, il peut aller aussi lentement qu’il veut (même à l’arrêt) sans glisser.` });
      if (v !== null) {
        const N = m * (g * cb + (v * v / R) * sb), fr = m * ((v * v / R) * cb - g * sb);
        Object.assign(r, { N, fr, derrapa: Math.abs(fr) > mu * N + 1e-9 });
        pasos.push({ t: `A ${f(v)} m/s`, html: `Horizontalement : $N sin β + F_f cos β = m v^2/R$ ; verticalement : $N cos β − F_f sin β = m g$ ($F_f$ positif vers l’intérieur) :<br>$N = m (g cos β + v^2/R sin β)$ = <b>${f(N)} N</b>, &ensp; $F_f = m (v^2/R cos β − g sin β)$ = <b>${f(fr)} N</b><br>${r.derrapa ? `Il faut un frottement de ${f(Math.abs(fr))} N et le maximum est $μ_s N = ${f(mu * N)} "N"$ : <b>${fr > 0 ? 'il dérape vers l’extérieur' : 'il glisse vers l’intérieur'}</b>.` : `Le frottement nécessaire est inférieur au maximum $μ_s N = ${f(mu * N)} "N"$ : <b>il prend le virage</b>.`}` });
      }
    } else if (caso === 'conico') {
      const L = lee(sc, 'L', 'la longueur du fil', { estricto: true }), an = lee(sc, 'ang', 'l’angle avec la verticale', { opcional: true, max: 89.9 }), w = lee(sc, 'w', 'la vitesse angulaire', { opcional: true, estricto: true });
      if (an === null && w === null) throw new Error('L’angle avec la verticale ou la vitesse angulaire manque');
      let th;
      if (an !== null) th = an * RAD;
      else {
        const cth = g / (w * w * L);
        if (cth >= 1) throw new Error(`Avec ω ≤ √(g/L) = ${f(Math.sqrt(g / L)).replace(/<[^>]+>/g, '')} rad/s, le fil ne s’écarte pas de la verticale`);
        th = Math.acos(cth);
        pasos.push({ t: 'Angle à partir de ω', html: `$cos θ = g/(ω^2 L) = ${f(g)}/(${f(w)}^2 · ${f(L)}) ⇒ θ$ = <b>${f(th / RAD)}°</b>` });
      }
      const T = (m * g) / Math.cos(th), Rr = L * Math.sin(th), v = Math.sqrt(g * Rr * Math.tan(th)), om = v / Rr, per = (2 * Math.PI) / om;
      Object.assign(r, { L, ang: th / RAD, T, R: Rr, v, w: om, periodo: per });
      pasos.push({ t: 'Forces', html: `Seuls le poids et la tension agissent. Verticalement : $T cos θ = m g ⇒ T = {m g}/{cos θ} = {${f(m)} · ${f(g)}}/{cos ${f(th / RAD)}°}$ = <b>${f(T)} N</b>` });
      pasos.push({ t: 'Rayon et vitesse', html: `$r = L sin θ = ${f(Rr)} "m"$. Horizontalement : $T sin θ = m v^2/r ⇒ v = √(g r tan θ)$ = <b>${f(v)} m/s</b>, &ensp; $ω = v/r$ = <b>${f(om)} rad/s</b>` });
      pasos.push({ t: 'Période', html: `$T_{tour} = 2 π √({L cos θ}/g) = 2 π/ω$ = <b>${f(per)} s</b> (elle ne dépend pas de la masse)` });
    } else {
      const R = lee(sc, 'R', 'le rayon', { estricto: true }), v = lee(sc, 'v', 'la vitesse');
      const loma = caso === 'loma', ac = (v * v) / R, N = m * (g + (loma ? -ac : ac)), vmax = Math.sqrt(g * R);
      Object.assign(r, { R, v, N, vmax, despega: loma && N < 0 });
      pasos.push({ t: loma ? 'Au sommet de la bosse' : 'Au fond de la cuvette', html: `Le centre de la courbe est ${loma ? 'en dessous' : 'au-dessus'} ; la force résultante dirigée vers lui est la force centripète :<br>$${loma ? 'm g − N' : 'N − m g'} = m v^2/R ⇒ N = m (g ${loma ? '−' : '+'} v^2/R) = ${f(m)} · (${f(g)} ${loma ? '−' : '+'} ${f(ac)})$ = <b>${f(N)} N</b>` });
      pasos.push({ t: 'Poids apparent', html: `$N/(m g) = ${f(N / (m * g))}$ : on se sent ${N < m * g ? 'plus léger' : 'plus lourd'} qu’au repos.${loma ? `<br>Le véhicule décolle du sol si $N < 0$, c’est-à-dire si $v > √(g R)$ = <b>${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)${N < 0 ? ' : <b>à cette vitesse il décolle</b>.' : '.'}` : ''}` });
    }
    return r;
  }

  function muelle(sc) {
    const g = lee(sc, 'g', 'la gravité', { estricto: true }), k1 = lee(sc, 'k', 'la constante du ressort', { estricto: true });
    const k2 = lee(sc, 'k2', 'la constante du second ressort', { opcional: true, estricto: true });
    const m = lee(sc, 'm', 'la masse', { opcional: true, estricto: true }), th = lee(sc, 'theta', 'l’angle', { opcional: true, max: 90 }) ?? 90;
    const mu = lee(sc, 'mus', 'le frottement statique', { opcional: true }) ?? 0, xd = lee(sc, 'x', 'l’allongement', { opcional: true, signo: true });
    const pasos = [];
    let k = k1;
    if (k2) {
      const serie = sc.asoc !== 'paralelo';
      k = serie ? (k1 * k2) / (k1 + k2) : k1 + k2;
      pasos.push({ t: `Ressorts en ${serie ? 'série' : 'parallèle'}`, html: serie ? `Les deux supportent la même force et les allongements s’additionnent : $1/k = 1/k_1 + 1/k_2 ⇒ k = {k_1 k_2}/{k_1 + k_2} = {${f(k1)} · ${f(k2)}}/{${f(k1)} + ${f(k2)}}$ = <b>${f(k)} N/m</b>` : `Ils s’allongent de la même quantité et les forces s’additionnent : $k = k_1 + k_2 = ${f(k1)} + ${f(k2)}$ = <b>${f(k)} N/m</b>` });
    }
    const r = { tipo: 'muelle', g, k1, k2, k, m, th, mu, pasos };
    if (xd !== null) { r.Fx = k * xd; pasos.push({ t: 'Loi de Hooke', html: `$F = k x = ${f(k)} · ${p(xd)}$ = <b>${f(k * xd)} N</b> (le ressort tire dans le sens opposé à l’allongement)` }); }
    if (m) {
      const t = th * RAD, Pp = m * g * Math.sin(t), Nn = m * g * Math.cos(t), colgado = th >= 90 - 1e-9;
      const x0 = Pp / k, xmin = Math.max(0, (Pp - mu * Nn)) / k, xmax = (Pp + mu * Nn) / k;
      Object.assign(r, { x0, xmin, xmax });
      pasos.push({ t: colgado ? 'Masse suspendue à l’équilibre' : 'Bloc retenu par le ressort sur le plan', html: colgado
        ? `$k x = m g ⇒ x = {m g}/k = {${f(m)} · ${f(g)}}/{${f(k)}}$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)`
        : `Sans frottement : $k x = m g sin θ ⇒ x = {m g sin θ}/k$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)${mu ? `<br>Avec frottement statique, le bloc reste au repos pour tout allongement compris entre $x_{min} = {m g (sin θ − μ_s cos θ)}/k$ = <b>${f(xmin)} m</b> et $x_{max} = {m g (sin θ + μ_s cos θ)}/k$ = <b>${f(xmax)} m</b>` : ''}` });
      const w = Math.sqrt(k / m), T = (2 * Math.PI) / w;
      Object.assign(r, { w, periodo: T });
      pasos.push({ t: 'S’il est écarté de l’équilibre (sans frottement)', html: `Il oscille d’un mouvement harmonique simple : $ω = √(k/m) = √(${f(k)}/${f(m)})$ = <b>${f(w)} rad/s</b>, &ensp; $T = 2 π √(m/k)$ = <b>${f(T)} s</b> (elle ne dépend ni de la gravité ni de l’inclinaison)` });
    }
    if (pasos.length === 0) throw new Error('Entre la masse, un allongement ou un second ressort pour calculer quelque chose');
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
    { clave: 'horizontal', nombre: 'Tirer une caisse avec une corde inclinée', sc: { tipo: 'plano', g: G, m1: '20', theta: '0', mus: '0,4', muk: '0,3', F: '100', alfa: '30', m2: '', v0: '', amed: '', d: '5' } },
    { clave: 'inclinado-baja', nombre: 'Bloc qui glisse sur un plan incliné', sc: { tipo: 'plano', g: G, m1: '5', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '', amed: '', d: '2' } },
    { clave: 'inclinado-quieto', nombre: 'Le frottement retient le bloc', sc: { tipo: 'plano', g: G, m1: '5', theta: '20', mus: '0,5', muk: '0,4', F: '', alfa: '', m2: '', v0: '', amed: '', d: '' } },
    { clave: 'empujar-arriba', nombre: 'Monter un bloc en le poussant parallèlement au plan', sc: { tipo: 'plano', g: G, m1: '10', theta: '25', mus: '0,25', muk: '0,2', F: '80', alfa: '0', m2: '', v0: '', amed: '', d: '3' } },
    { clave: 'lanzado-arriba', nombre: 'Bloc lancé vers le haut du plan, qui ralentit et revient', sc: { tipo: 'plano', g: G, m1: '2', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '6', amed: '', d: '' } },
    { clave: 'frenada', nombre: 'Caisse qui glisse sur le sol jusqu’à s’arrêter', sc: { tipo: 'plano', g: G, m1: '8', theta: '0', mus: '0,4', muk: '0,3', F: '', alfa: '', m2: '', v0: '5', amed: '', d: '' } },
    { clave: 'mu-medida', nombre: 'Coefficient de frottement à partir de l’accélération', sc: { tipo: 'plano', g: G, m1: '3', theta: '35', mus: '', muk: '', F: '', alfa: '', m2: '', v0: '', amed: '3,2', d: '' } },
    { clave: 'mesa-polea', nombre: 'Bloc sur une table et masse suspendue', sc: { tipo: 'plano', g: G, m1: '4', theta: '0', mus: '0,3', muk: '0,25', F: '', alfa: '', m2: '2', v0: '', amed: '', d: '1' } },
    { clave: 'plano-polea', nombre: 'Plan incliné avec poulie et masse suspendue', sc: { tipo: 'plano', g: G, m1: '6', theta: '37', mus: '0,2', muk: '0,15', F: '', alfa: '', m2: '5', v0: '', amed: '', d: '1,5' } },
    { clave: 'contacto', nombre: 'Deux caisses en contact poussées sur le sol', sc: { tipo: 'dos', union: 'contacto', g: G, m1: '3', m2: '5', theta: '0', mus: '0,3', muk1: '0,2', muk2: '0,2', F: '40', d: '' } },
    { clave: 'cuerda-plano', nombre: 'Deux blocs reliés par une corde montant un plan', sc: { tipo: 'dos', union: 'cuerda', g: G, m1: '4', m2: '2', theta: '20', mus: '0,3', muk1: '0,25', muk2: '0,1', F: '60', d: '2' } },
    { clave: 'atwood', nombre: 'Machine d’Atwood', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '', d: '2' } },
    { clave: 'atwood-polea', nombre: 'Machine d’Atwood avec poulie massive', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '2', d: '2' } },
    { clave: 'peralte', nombre: 'Voiture dans un virage relevé', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1200', R: '80', beta: '15', mus: '0,5', v: '25', L: '', ang: '', w: '' } },
    { clave: 'curva-plana', nombre: 'Virage non relevé : vitesse maximale', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1000', R: '50', beta: '0', mus: '0,6', v: '20', L: '', ang: '', w: '' } },
    { clave: 'conico', nombre: 'Pendule conique', sc: { tipo: 'circular', caso: 'conico', g: G, m: '0,5', L: '1,2', ang: '30', w: '', R: '', v: '' } },
    { clave: 'loma', nombre: 'Voiture au changement de pente', sc: { tipo: 'circular', caso: 'loma', g: G, m: '900', R: '40', v: '15' } },
    { clave: 'muelle-colgado', nombre: 'Masse suspendue à un ressort', sc: { tipo: 'muelle', g: G, k: '200', k2: '', asoc: 'serie', m: '0,5', theta: '90', mus: '', x: '' } },
    { clave: 'muelle-plano', nombre: 'Bloc retenu par deux ressorts sur un plan', sc: { tipo: 'muelle', g: G, k: '300', k2: '200', asoc: 'paralelo', m: '4', theta: '30', mus: '0,2', x: '' } },
  ];

  return { plano, dos, atwood, circular, muelle, resolver, ejemplos, f };
})();

