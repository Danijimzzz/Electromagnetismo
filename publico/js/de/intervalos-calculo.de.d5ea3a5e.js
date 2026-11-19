const Intervalos = (() => {
  const E = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, { min = -Infinity, minEx = false, max = Infinity, entero = false, opcional = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const x = leeNum(sc[k]);
    if (!isFinite(x)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} ist keine Zahl`);
    if (entero && !Number.isInteger(x)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine ganze Zahl sein`);
    if (x < min || (minEx && x === min)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${minEx ? 'größer als' : 'mindestens'} ${f(min)} sein`);
    if (x > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} darf höchstens ${f(max)} sein`);
    return x;
  }
  function leeLista(texto, nom) {
    const xs = String(texto ?? '').split(/[\s;]+/).filter((t) => t).map((t) => leeNum(t));
    if (xs.some((x) => !isFinite(x))) throw new Error(`In ${nom} steht etwas, das keine Zahl ist (das Komma ist das Dezimalzeichen; trenne mit Leerzeichen oder „;“)`);
    if (xs.length < 2) throw new Error(`In ${nom} sind mindestens zwei Werte nötig`);
    return xs;
  }

  const N01 = { mu: 0, sigma: 1 };
  const zc = (a) => E.cuantil(E.DIST.normal, N01, 1 - a);
  const tc = (nu, a) => E.cuantil(E.DIST.t, { nu }, 1 - a);
  const xc = (k, a) => E.cuantil(E.DIST.chi2, { k }, 1 - a);
  const ic = (a, b) => `(${f(a, 5)}; ${f(b, 5)})`;
  function nivel(sc) {
    let c = lee(sc, 'nivel', 'das Konfidenzniveau', { min: 0, minEx: true });
    if (c >= 1) c /= 100;
    if (!(c > 0 && c < 1)) throw new Error('Das Konfidenzniveau muss zwischen 0 und 100 % liegen');
    return c;
  }
  const pc = (c) => `${f(100 * c)} %`;
  const lado = (sc) => (sc.lado === 'inf' || sc.lado === 'sup' ? sc.lado : 'dos');
  const mitad = (sc, al) => (lado(sc) === 'dos' ? al / 2 : al);
  const alfaTxt = (c, sc) => `1 − α = ${f(c)} ⇒ α = ${f(1 - c)}${lado(sc) === 'dos' ? `, α/2 = ${f((1 - c) / 2)}` : ', ganz an einem Rand'}`;
  function finita(sc, n, pasos) {
    const Np = lee(sc, 'Npob', 'der Umfang der Grundgesamtheit N', { min: 2, entero: true, opcional: true });
    if (Np === null) return 1;
    if (Np <= n) throw new Error('Die Grundgesamtheit N muss größer als die Stichprobe n sein');
    const k = Math.sqrt((Np - n) / (Np - 1));
    pasos.push({ t: 'Endliche Grundgesamtheit', html: `Die Grundgesamtheit hat N = ${Np} Elemente und wird ohne Zurücklegen beprobt, daher wird der Fehler mit dem Korrekturfaktor √((N − n)/(N − 1)) = √((${Np} − ${n})/(${Np} − 1)) = <b>${f(k, 5)}</b> multipliziert.${n / Np < 0.05 ? ' Da n weniger als 5 % von N ist, ändert sich kaum etwas.' : ''}` });
    return k;
  }

  function muestra(sc, sufijo = '', nom = 'la muestra') {
    if ((sc['fuente' + sufijo] ?? sc.fuente) === 'datos') {
      const xs = leeLista(sc['datos' + sufijo], nom), n = xs.length, m = xs.reduce((s, x) => s + x, 0) / n, ss = xs.reduce((s, x) => s + (x - m) ** 2, 0);
      return { n, m, sc: Math.sqrt(ss / (n - 1)), sn: Math.sqrt(ss / n), xs, lista: true };
    }
    const n = lee(sc, 'n' + sufijo, `der Umfang n${sufijo}`, { min: 2, entero: true }), m = lee(sc, 'xm' + sufijo, `der Mittelwert x̄${sufijo}`);
    const s = lee(sc, 's' + sufijo, `die Standardabweichung s${sufijo}`, { min: 0, minEx: true, opcional: true });
    if (s === null) return { n, m, sc: null, sn: null };
    return sc.tipoS === 'muestral' ? { n, m, sn: s, sc: s * Math.sqrt(n / (n - 1)) } : { n, m, sc: s, sn: s * Math.sqrt((n - 1) / n) };
  }
  const datosTxt = (M, i = '') => M.lista
    ? `n${i} = ${M.n} Werte: x̄${i} = Σx/n = <b>${f(M.m, 6)}</b>, Stichprobenstandardabweichung s${i} = √(Σ(x − x̄)<sup>2</sup>/(n − 1)) = <b>${f(M.sc, 5)}</b> (die Standardabweichung mit n ist ${f(M.sn, 5)})`
    : `n${i} = ${M.n}, x̄${i} = ${f(M.m, 6)}${M.sc !== null ? `, Stichprobenstandardabweichung s${i} = ${f(M.sc, 5)}` : ''}`;
  const cuasiNota = (sc, M) => (!M.lista && sc.tipoS === 'muestral' && M.sc !== null ? ` Die angegebene Standardabweichung ist die der Stichprobe (mit n), daher ist die Stichprobenstandardabweichung s = σ<sub>n</sub>·√(n/(n − 1)) = ${f(M.sn, 5)}·√(${M.n}/${M.n - 1}) = ${f(M.sc, 5)}.` : '');

  function media(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), M = muestra(sc), conocida = sc.sigmaC === 'si', pasos = [];
    const sigma = conocida ? lee(sc, 'sigma', 'die Standardabweichung der Grundgesamtheit σ', { min: 0, minEx: true }) : null;
    if (!conocida && M.sc === null) throw new Error('Die Standardabweichung s der Stichprobe fehlt');
    pasos.push({ t: 'Daten', html: `${datosTxt(M)}${conocida ? `, σ = ${f(sigma)} (conocida)` : ''}.${cuasiNota(sc, M)}<br>${alfaTxt(c, sc)}` });
    let k, nombre, sd, h;
    if (conocida) {
      k = zc(a2); sd = sigma / Math.sqrt(M.n); nombre = `z<sub>α/2</sub> = z<sub>${f(a2)}</sub>`;
      h = `Bei bekanntem σ ist Z = (x̄ − μ)/(σ/√n) ~ N(0, 1). Gesucht ist z<sub>α/2</sub> mit P(Z &gt; z<sub>α/2</sub>) = ${f(a2)}, also Φ(z<sub>α/2</sub>) = ${f(1 - a2)}:<br>${nombre} = <b>${f(k)}</b>`;
    } else {
      k = tc(M.n - 1, a2); sd = M.sc / Math.sqrt(M.n); nombre = `t<sub>${M.n - 1}; α/2</sub> = t<sub>${M.n - 1}; ${f(a2)}</sub>`;
      h = `Bei unbekanntem σ verwendet man die Stichprobenstandardabweichung s, und T = (x̄ − μ)/(s/√n) folgt einer Student-t-Verteilung mit n − 1 = ${M.n - 1} Freiheitsgraden. Gesucht ist der Wert, der rechts ${f(a2)} übrig lässt:<br>${nombre} = <b>${f(k)}</b>`;
    }
    pasos.push({ t: 'Kritischer Wert', html: h });
    const fp = finita(sc, M.n, pasos); sd *= fp;
    const err = k * sd, a = M.m - err, b = M.m + err;
    pasos.push({ t: 'Maximaler Fehler', html: `E = ${conocida ? 'z<sub>α/2</sub>·σ/√n' : 't<sub>n−1; α/2</sub>·s/√n'}${fp < 1 ? '·√((N − n)/(N − 1))' : ''} = ${f(k)}·${f(conocida ? sigma : M.sc)}/√${M.n}${fp < 1 ? `·${f(fp, 5)}` : ''} = <b>${f(err)}</b>` });
    pasos.push({ t: 'Intervall', html: `KI<sub>${f(c)}</sub>(μ) = (x̄ − E, x̄ + E) = (${f(M.m, 6)} − ${f(err)}, ${f(M.m, 6)} + ${f(err)}) = <b>${ic(a, b)}</b>` });
    if (!conocida && M.n >= 30) { const z = zc(a2), e2 = (z * M.sc) / Math.sqrt(M.n); pasos.push({ t: 'Bei großer Stichprobe', html: `Da n ≥ 30, verwenden viele Bücher z<sub>α/2</sub> = ${f(z)} statt t: E = ${f(e2)} und das Intervall wäre ${ic(M.m - e2, M.m + e2)}, fast gleich.` }); }
    pasos.push({ t: 'Interpretation', html: `Mit einem Konfidenzniveau von ${pc(c)} liegt der Erwartungswert der Grundgesamtheit μ zwischen ${f(a)} und ${f(b)}.` });
    return { a, b, est: M.m, err, k, crit: conocida ? 'z' : 't', gl: conocida ? null : M.n - 1, c, M, sigma, pasos, param: 'μ', dist: conocida ? { d: 'normal' } : { d: 't', nu: M.n - 1 } };
  }
  function exitos(sc, i = '') {
    const n = lee(sc, 'n' + i, `der Umfang n${i}`, { min: 1, entero: true });
    if (sc.tipoP === 'proporcion') { const ph = lee(sc, 'ph' + i, `der Anteil p̂${i}`, { min: 0, max: 1 }); return { n, ph, x: null }; }
    const x = lee(sc, 'x' + i, `die Anzahl der Erfolge x${i}`, { min: 0, entero: true });
    if (x > n) throw new Error(`Die Erfolge x${i} dürfen nicht mehr sein als n${i}`);
    return { n, x, ph: x / n };
  }
  const METODOS_P = { wald: 'Normal (Wald), das aus dem Unterricht', wilson: 'Wilson', cp: 'Exakt nach Clopper-Pearson', ac: 'Agresti-Coull' };
  function metodosP(n, ph, a2) {
    const k = zc(a2), k2 = k * k, q = 1 - ph, x = n * ph, sd = Math.sqrt((ph * q) / n);
    const cen = (ph + k2 / (2 * n)) / (1 + k2 / n), med = (k / (1 + k2 / n)) * Math.sqrt((ph * q) / n + k2 / (4 * n * n));
    const nt = n + k2, pt = (x + k2 / 2) / nt, et = k * Math.sqrt((pt * (1 - pt)) / nt);
    const entero = Math.abs(x - Math.round(x)) < 1e-6, xi = Math.round(x), bq = (al, be, pr) => E.cuantil(E.DIST.beta, { al, be }, pr);
    return {
      k, wald: { a: ph - k * sd, b: ph + k * sd, sd },
      wilson: { a: cen - med, b: cen + med, cen, med },
      ac: { a: pt - et, b: pt + et, nt, pt, et },
      cp: entero ? { a: xi === 0 ? 0 : bq(xi, n - xi + 1, a2), b: xi === n ? 1 : bq(xi + 1, n - xi, 1 - a2), x: xi } : null,
    };
  }
  function proporcion(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), P = exitos(sc), q = 1 - P.ph, pasos = [];
    let met = METODOS_P[sc.metodoP] ? sc.metodoP : 'wald';
    pasos.push({ t: 'Daten', html: `n = ${P.n}, ${P.x !== null ? `x = ${P.x} Erfolge ⇒ p̂ = x/n = ${P.x}/${P.n} = ` : 'p̂ = '}<b>${f(P.ph)}</b>, q̂ = 1 − p̂ = ${f(q)}<br>${alfaTxt(c, sc)}` });
    const T = metodosP(P.n, P.ph, a2), k = T.k, recorta = (a, b) => (a < 0 || b > 1 ? ` (wird auf ${ic(Math.max(0, a), Math.min(1, b))} gekürzt, weil p zwischen 0 und 1 liegt)` : '');
    if (met === 'cp' && !T.cp) throw new Error(`Das exakte Intervall braucht eine ganze Zahl von Erfolgen, und n·p̂ = ${f(P.n * P.ph, 6)} ist keine: Gib die Erfolge x an oder wähle ein anderes Verfahren`);
    const fp = met === 'wald' ? finita(sc, P.n, pasos) : 1;
    if (met !== 'wald' && !vacio(sc.Npob)) pasos.push({ t: 'Endliche Grundgesamtheit', html: 'Die Korrektur für endliche Grundgesamtheiten gilt nur für das Normalintervall (Wald): Bei diesem Verfahren wurde so gerechnet, als wäre die Grundgesamtheit sehr groß.' });
    let a, b, err;
    if (met === 'wald') {
      const sd = T.wald.sd * fp;
      pasos.push({ t: 'Kritischer Wert', html: `Für großes n gilt p̂ ≈ N(p, √(pq/n)): z<sub>α/2</sub> = z<sub>${f(a2)}</sub> = <b>${f(k)}</b>` });
      err = k * sd; a = P.ph - err; b = P.ph + err;
      pasos.push({ t: 'Maximaler Fehler', html: `E = z<sub>α/2</sub>·√(p̂q̂/n)${fp < 1 ? '·√((N − n)/(N − 1))' : ''} = ${f(k)}·√(${f(P.ph)}·${f(q)}/${P.n})${fp < 1 ? `·${f(fp, 5)}` : ''} = <b>${f(err)}</b>` });
      pasos.push({ t: 'Intervall', html: `KI<sub>${f(c)}</sub>(p) = (p̂ − E, p̂ + E) = <b>${ic(a, b)}</b>${recorta(a, b)}` });
      if (P.n * P.ph < 5 || P.n * q < 5) {
        const wa = Math.max(0, T.wilson.a), wb = Math.min(1, T.wilson.b), extremo = P.ph === 0 || P.ph === 1;
        pasos.push({ t: 'Vorsicht', html: `np̂ = ${f(P.n * P.ph)} oder nq̂ = ${f(P.n * q)} ist kleiner als 5: Die Normalnäherung ist bei so wenigen Erfolgen oder Misserfolgen nicht gut.${extremo ? ` Mit p̂ = ${f(P.ph)} wird der Fehler 0 und das Intervall zu einem Punkt, was keinen Sinn ergibt.` : ''}` });
        pasos.push({ t: 'Wilson-Intervall', html: `Funktioniert gut, auch bei wenigen Erfolgen oder Misserfolgen:<br>Mitte = (p̂ + z<sup>2</sup>/(2n))/(1 + z<sup>2</sup>/n) = ${f(T.wilson.cen)}, &ensp; Halbbreite = z/(1 + z<sup>2</sup>/n)·√(p̂q̂/n + z<sup>2</sup>/(4n<sup>2</sup>)) = ${f(T.wilson.med)}<br>KI<sub>${f(c)}</sub>(p) = <b>${ic(wa, wb)}</b>${extremo ? ' (es wird als Ergebnis angegeben)' : ''}` });
        if (extremo) { a = wa; b = wb; err = (wb - wa) / 2; }
      }
    } else {
      pasos.push({ t: 'Kritischer Wert', html: met === 'cp' ? `Das exakte Intervall verwendet nicht die Normalverteilung: Es stammt aus der Binomialverteilung selbst. Zur Orientierung: z<sub>α/2</sub> = ${f(k)}.` : `z<sub>α/2</sub> = z<sub>${f(a2)}</sub> = <b>${f(k)}</b>` });
      if (met === 'wilson') {
        a = Math.max(0, T.wilson.a); b = Math.min(1, T.wilson.b);
        pasos.push({ t: 'Wilson-Intervall', html: `Statt den Fehler mit p̂ zu schätzen, wird p aus |p̂ − p| ≤ z·√(p(1 − p)/n) aufgelöst. Es ergibt sich ein Intervall, das nicht um p̂ zentriert ist, sondern etwas zu 0,5 hin verschoben:<br>Mitte = (p̂ + z<sup>2</sup>/(2n))/(1 + z<sup>2</sup>/n) = ${f(T.wilson.cen)}, &ensp; Halbbreite = z/(1 + z<sup>2</sup>/n)·√(p̂q̂/n + z<sup>2</sup>/(4n<sup>2</sup>)) = ${f(T.wilson.med)}<br>KI<sub>${f(c)}</sub>(p) = <b>${ic(a, b)}</b>` });
      } else if (met === 'ac') {
        a = T.ac.a; b = T.ac.b;
        pasos.push({ t: 'Agresti-Coull-Intervall', html: `Es ist das übliche Normalintervall, aber mit z<sup>2</sup> hinzugefügten Beobachtungen, die Hälfte davon Erfolge (bei 95 %: „2 Erfolge und 2 Misserfolge hinzufügen“):<br>ñ = n + z<sup>2</sup> = ${f(T.ac.nt, 6)}, &ensp; p̃ = (x + z<sup>2</sup>/2)/ñ = ${f(T.ac.pt)}, &ensp; E = z·√(p̃(1 − p̃)/ñ) = ${f(T.ac.et)}<br>KI<sub>${f(c)}</sub>(p) = (p̃ − E, p̃ + E) = <b>${ic(a, b)}</b>${recorta(a, b)}` });
      } else {
        a = T.cp.a; b = T.cp.b; const x = T.cp.x;
        pasos.push({ t: 'Exaktes Clopper-Pearson-Intervall', html: `Gesucht sind die p, für die das Beobachtete nicht selten wäre: Die untere Grenze ist das p mit P(X ≥ ${x}) = ${f(a2)} und die obere das p mit P(X ≤ ${x}) = ${f(a2)}, mit X binomialverteilt mit n = ${P.n}. Diese beiden Gleichungen werden mit Quantilen der Beta-Verteilung gelöst:<br>untere = ${x === 0 ? '0 (keine Erfolge)' : `B<sub>${f(a2)}</sub>(${x}, ${P.n - x + 1}) = ${f(a, 5)}`}, &ensp; obere = ${x === P.n ? '1 (alles sind Erfolge)' : `B<sub>${f(1 - a2)}</sub>(${x + 1}, ${P.n - x}) = ${f(b, 5)}`}<br>KI<sub>${f(c)}</sub>(p) = <b>${ic(a, b)}</b>. Es garantiert bei jedem n mindestens das geforderte Konfidenzniveau, ist dafür etwas breiter.` });
      }
      err = (b - a) / 2;
    }
    const fila = (m, I) => (I ? `${m === met ? '<b>' : ''}${METODOS_P[m]}: ${ic(Math.max(0, I.a), Math.min(1, I.b))}, anchura ${f(Math.min(1, I.b) - Math.max(0, I.a))}${m === met ? '</b>' : ''}` : `${METODOS_P[m]}: Es wird eine ganze Zahl von Erfolgen benötigt`);
    pasos.push({ t: 'Vergleich der Verfahren', html: `${['wald', 'wilson', 'cp', 'ac'].map((m) => fila(m, T[m])).join('<br>')}<br>${P.n * P.ph >= 10 && P.n * q >= 10 ? 'Bei so vielen Erfolgen und Misserfolgen stimmen die vier fast überein.' : 'Bei wenigen Erfolgen oder Misserfolgen ist das Normalintervall zu knapp: Wilson oder das exakte sind zuverlässiger.'}` });
    pasos.push({ t: 'Interpretation', html: `Mit einem Konfidenzniveau von ${pc(c)} liegt der Anteil der Grundgesamtheit zwischen ${f(100 * Math.max(0, a))} % und ${f(100 * Math.min(1, b))} %.` });
    return { a, b, est: P.ph, err, k, crit: 'z', c, P, pasos, param: 'p', dist: { d: 'normal' }, metodoP: met, metodos: T };
  }
  function prediccion(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), M = muestra(sc), pasos = [], que = sc.queP === 'tol' ? 'tol' : 'pred', nu = M.n - 1;
    if (M.sc === null) throw new Error('Die Standardabweichung s der Stichprobe fehlt');
    pasos.push({ t: 'Daten', html: `${datosTxt(M)}.${cuasiNota(sc, M)}<br>${alfaTxt(c, sc)}` });
    if (que === 'pred') {
      const k = tc(nu, a2), raiz = Math.sqrt(1 + 1 / M.n), err = k * M.sc * raiz, a = M.m - err, b = M.m + err, eMedia = (k * M.sc) / Math.sqrt(M.n);
      pasos.push({ t: 'Was gesucht wird', html: 'Es ist kein Intervall für den Erwartungswert μ, sondern für <b>den nächsten Wert</b>, der gemessen wird. Dieser Wert weicht aus zwei Gründen von x̄ ab: x̄ ist nicht genau μ (Varianz σ²/n), und der neue Wert hat seine eigene Streuung (Varianz σ²). Deshalb erscheint 1 + 1/n.' });
      pasos.push({ t: 'Kritischer Wert', html: `(X<sub>neu</sub> − x̄)/(s·√(1 + 1/n)) folgt einer Student-t-Verteilung mit n − 1 = ${nu} Freiheitsgraden:<br>t<sub>${nu}; α/2</sub> = t<sub>${nu}; ${f(a2)}</sub> = <b>${f(k)}</b>` });
      pasos.push({ t: 'Maximaler Fehler', html: `E = t<sub>n−1; α/2</sub>·s·√(1 + 1/n) = ${f(k)}·${f(M.sc, 5)}·√(1 + 1/${M.n}) = ${f(k)}·${f(M.sc, 5)}·${f(raiz, 5)} = <b>${f(err)}</b>` });
      pasos.push({ t: 'Intervall', html: `PI<sub>${f(c)}</sub> = (x̄ − E, x̄ + E) = (${f(M.m, 6)} − ${f(err)}, ${f(M.m, 6)} + ${f(err)}) = <b>${ic(a, b)}</b>` });
      pasos.push({ t: 'Vergleich mit dem des Mittelwerts', html: `Das Konfidenzintervall des Mittelwerts hat mit diesen Daten E = t·s/√n = ${f(eMedia)}: Das Prognoseintervall ist √(n + 1) = ${f(Math.sqrt(M.n + 1))}-mal breiter und wird bei noch so vielen Daten nicht beliebig schmal (mindestens z·σ).` });
      pasos.push({ t: 'Interpretation', html: `Mit einem Konfidenzniveau von ${pc(c)} liegt die nächste Beobachtung zwischen ${f(a)} und ${f(b)}. Es wird eine normalverteilte Grundgesamtheit vorausgesetzt.` });
      return { a, b, est: M.m, err, k, crit: 't', gl: nu, c, M, pasos, param: 'x', que, paramTxt: 'eine neue Beobachtung', dist: { d: 't', nu } };
    }
    if (lado(sc) !== 'dos') throw new Error('Das Toleranzintervall wird nur zweiseitig berechnet: Wähle „Zweiseitig (a; b)“');
    let cob = lee(sc, 'cob', 'der Anteil der Grundgesamtheit, der abgedeckt werden soll', { min: 0, minEx: true });
    if (cob >= 1) cob /= 100;
    if (!(cob > 0 && cob < 1)) throw new Error('Der abgedeckte Anteil der Grundgesamtheit muss zwischen 0 und 100 % liegen');
    const z = zc((1 - cob) / 2), chi = xc(nu, c), k = z * Math.sqrt((nu * (1 + 1 / M.n)) / chi), err = k * M.sc, a = M.m - err, b = M.m + err;
    pasos.push({ t: 'Was gesucht wird', html: `Ein Intervall, das mindestens <b>${pc(cob)} der Grundgesamtheit</b> enthält (nicht den Mittelwert und nicht einen einzelnen Wert), mit einem Konfidenzniveau von ${pc(c)}. Wären μ und σ bekannt, wäre es μ ± z·σ mit z<sub>${f((1 - cob) / 2)}</sub> = ${f(z)}; da es nur x̄ und s gibt, muss der Faktor größer sein.` });
    pasos.push({ t: 'Toleranzfaktor', html: `Mit der Howe-Näherung: k = z·√(ν(1 + 1/n)/χ<sup>2</sup><sub>ν; ${f(c)}</sub>), mit ν = n − 1 = ${nu} und χ<sup>2</sup><sub>${nu}; ${f(c)}</sub> = ${f(chi)} (der Wert, der rechts ${f(c)} übrig lässt):<br>k = ${f(z)}·√(${nu}·(1 + 1/${M.n})/${f(chi)}) = <b>${f(k)}</b>` });
    pasos.push({ t: 'Intervall', html: `(x̄ − k·s, x̄ + k·s) = (${f(M.m, 6)} − ${f(k)}·${f(M.sc, 5)}, ${f(M.m, 6)} + ${f(k)}·${f(M.sc, 5)}) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Interpretation', html: `Mit einem Konfidenzniveau von ${pc(c)} liegen mindestens ${pc(cob)} der Grundgesamtheit zwischen ${f(a)} und ${f(b)}. Es wird eine normalverteilte Grundgesamtheit vorausgesetzt; der Howe-Faktor weicht vom exakten aus den Tabellen um weniger als 1 % ab, außer bei sehr kleinen Stichproben.` });
    return { a, b, est: M.m, err, k, kz: z, crit: 'k', gl: nu, c, cob, M, pasos, param: 'x', que, paramTxt: `${pc(cob)} der Grundgesamtheit`, dist: { d: 'chi2', k: nu }, k2: chi, sinGrafica: true };
  }
  function varianza(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), M = muestra(vacio(sc.xm) ? { ...sc, xm: '0' } : sc), pasos = [];
    if (M.sc === null) throw new Error('Die Standardabweichung s der Stichprobe fehlt');
    const nu = M.n - 1, s2 = M.sc ** 2;
    pasos.push({ t: 'Daten', html: `${M.lista ? datosTxt(M) : `n = ${M.n}, Stichprobenstandardabweichung s = ${f(M.sc, 5)}`} ⇒ s<sup>2</sup> = ${f(s2, 5)}.${cuasiNota(sc, M)}<br>${alfaTxt(c, sc)}` });
    const ks = xc(nu, a2), ki = xc(nu, 1 - a2);
    pasos.push({ t: 'Kritische Werte', html: `(n − 1)s<sup>2</sup>/σ<sup>2</sup> folgt einer χ<sup>2</sup>-Verteilung mit n − 1 = ${nu} Freiheitsgraden, die nicht symmetrisch ist: Man braucht die beiden Werte, die an jedem Rand ${f(a2)} übrig lassen.<br>χ<sup>2</sup><sub>${nu}; ${f(a2)}</sub> = <b>${f(ks)}</b> (lässt rechts ${f(a2)} übrig), &ensp; χ<sup>2</sup><sub>${nu}; ${f(1 - a2)}</sub> = <b>${f(ki)}</b> (lässt links ${f(a2)} übrig)` });
    const a = (nu * s2) / ks, b = (nu * s2) / ki;
    pasos.push({ t: 'Intervall der Varianz', html: `KI<sub>${f(c)}</sub>(σ<sup>2</sup>) = ((n − 1)s<sup>2</sup>/χ<sup>2</sup><sub>α/2</sub>, (n − 1)s<sup>2</sup>/χ<sup>2</sup><sub>1−α/2</sub>) = (${nu}·${f(s2, 5)}/${f(ks)}, ${nu}·${f(s2, 5)}/${f(ki)}) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Intervall der Standardabweichung', html: `Mit der Wurzel der beiden Endpunkte: KI<sub>${f(c)}</sub>(σ) = (√${f(a)}, √${f(b)}) = <b>${ic(Math.sqrt(a), Math.sqrt(b))}</b>` });
    pasos.push({ t: 'Interpretation', html: `Mit einem Konfidenzniveau von ${pc(c)} liegt σ<sup>2</sup> zwischen ${f(a)} und ${f(b)}. Das Intervall ist nicht symmetrisch um s<sup>2</sup>, weil die χ<sup>2</sup>-Verteilung es nicht ist.` });
    return { a, b, est: s2, k: ks, k2: ki, crit: 'chi2', gl: nu, c, M, sa: Math.sqrt(a), sb: Math.sqrt(b), pasos, param: 'σ²', dist: { d: 'chi2', k: nu } };
  }
  const conclusion = (a, b, q) => (a > 0 ? `Das ganze Intervall ist positiv: Mit diesem Konfidenzniveau ist ${q[0]} größer als ${q[1]}.` : b < 0 ? `Das ganze Intervall ist negativ: Mit diesem Konfidenzniveau ist ${q[0]} kleiner als ${q[1]}.` : `Das Intervall enthält die 0: Mit diesem Konfidenzniveau lässt sich nicht sagen, dass ${q[0]} und ${q[1]} verschieden sind.`);
  function difMedias(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), M1 = muestra(sc, '1', 'la muestra 1'), M2 = muestra(sc, '2', 'la muestra 2'), caso = ['conocidas', 'iguales', 'distintas'].includes(sc.caso) ? sc.caso : 'iguales', pasos = [];
    const d = M1.m - M2.m;
    let k, err, h, gl = null, crit = 't', s1 = null, s2 = null, sp = null;
    if (caso === 'conocidas') { s1 = lee(sc, 'sigma1', 'σ₁', { min: 0, minEx: true }); s2 = lee(sc, 'sigma2', 'σ₂', { min: 0, minEx: true }); }
    else if (M1.sc === null || M2.sc === null) throw new Error('Die Standardabweichungen s₁ und s₂ der Stichproben fehlen');
    pasos.push({ t: 'Daten', html: `Stichprobe 1: ${datosTxt(M1, '₁')}${s1 !== null ? `, σ₁ = ${f(s1)}` : ''}<br>Stichprobe 2: ${datosTxt(M2, '₂')}${s2 !== null ? `, σ₂ = ${f(s2)}` : ''}<br>x̄₁ − x̄₂ = ${f(M1.m, 6)} − ${p(M2.m)} = <b>${f(d)}</b>; ${alfaTxt(c, sc)}` });
    if (caso === 'conocidas') {
      crit = 'z'; k = zc(a2); const sd = Math.sqrt(s1 ** 2 / M1.n + s2 ** 2 / M2.n); err = k * sd;
      h = `Bei bekanntem σ₁ und σ₂: z<sub>α/2</sub> = <b>${f(k)}</b><br>E = z<sub>α/2</sub>·√(σ₁<sup>2</sup>/n₁ + σ₂<sup>2</sup>/n₂) = ${f(k)}·√(${f(s1)}<sup>2</sup>/${M1.n} + ${f(s2)}<sup>2</sup>/${M2.n}) = <b>${f(err)}</b>`;
    } else if (caso === 'iguales') {
      gl = M1.n + M2.n - 2; sp = Math.sqrt(((M1.n - 1) * M1.sc ** 2 + (M2.n - 1) * M2.sc ** 2) / gl); k = tc(gl, a2); err = k * sp * Math.sqrt(1 / M1.n + 1 / M2.n);
      h = `Unbekannte, aber gleiche Varianzen: Beide werden in der gewichteten Stichprobenvarianz zusammengefasst<br>s<sub>p</sub><sup>2</sup> = ((n₁ − 1)s₁<sup>2</sup> + (n₂ − 1)s₂<sup>2</sup>)/(n₁ + n₂ − 2) = (${M1.n - 1}·${f(M1.sc, 5)}<sup>2</sup> + ${M2.n - 1}·${f(M2.sc, 5)}<sup>2</sup>)/${gl} = ${f(sp ** 2, 5)} ⇒ s<sub>p</sub> = ${f(sp, 5)}<br>t<sub>${gl}; α/2</sub> = <b>${f(k)}</b><br>E = t·s<sub>p</sub>·√(1/n₁ + 1/n₂) = ${f(k)}·${f(sp, 5)}·√(1/${M1.n} + 1/${M2.n}) = <b>${f(err)}</b>`;
    } else {
      const v1 = M1.sc ** 2 / M1.n, v2 = M2.sc ** 2 / M2.n, nu = (v1 + v2) ** 2 / (v1 ** 2 / (M1.n - 1) + v2 ** 2 / (M2.n - 1));
      gl = Math.max(1, Math.floor(nu)); k = tc(gl, a2); err = k * Math.sqrt(v1 + v2);
      h = `Unbekannte und verschiedene Varianzen (Welch): Die Freiheitsgrade ergeben sich aus der Welch-Satterthwaite-Formel<br>ν = (s₁<sup>2</sup>/n₁ + s₂<sup>2</sup>/n₂)<sup>2</sup> / [(s₁<sup>2</sup>/n₁)<sup>2</sup>/(n₁ − 1) + (s₂<sup>2</sup>/n₂)<sup>2</sup>/(n₂ − 1)] = ${f(nu)} ⇒ wird abgerundet: ν = ${gl} (Programme verwenden ν = ${f(nu)} ungerundet, und es ergibt sich t = ${f(tc(nu, a2))}, fast gleich)<br>t<sub>${gl}; α/2</sub> = <b>${f(k)}</b><br>E = t·√(s₁<sup>2</sup>/n₁ + s₂<sup>2</sup>/n₂) = ${f(k)}·√(${f(v1, 5)} + ${f(v2, 5)}) = <b>${f(err)}</b>`;
    }
    pasos.push({ t: 'Kritischer Wert und Fehler', html: h });
    const a = d - err, b = d + err;
    pasos.push({ t: 'Intervall', html: `KI<sub>${f(c)}</sub>(μ₁ − μ₂) = ((x̄₁ − x̄₂) − E, (x̄₁ − x̄₂) + E) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Schlussfolgerung', html: conclusion(a, b, ['μ₁', 'μ₂']).replace('distintas', 'die Mittelwerte verschieden') });
    return { a, b, est: d, err, k, crit, gl, c, M1, M2, caso, sp, pasos, param: 'μ₁ − μ₂', dist: crit === 'z' ? { d: 'normal' } : { d: 't', nu: gl }, s1, s2 };
  }
  function difProp(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), P1 = exitos(sc, '1'), P2 = exitos(sc, '2'), pasos = [], d = P1.ph - P2.ph;
    pasos.push({ t: 'Daten', html: `p̂₁ = ${P1.x !== null ? `${P1.x}/${P1.n} = ` : ''}${f(P1.ph)}, &ensp; p̂₂ = ${P2.x !== null ? `${P2.x}/${P2.n} = ` : ''}${f(P2.ph)} ⇒ p̂₁ − p̂₂ = <b>${f(d)}</b><br>${alfaTxt(c, sc)}` });
    const k = zc(a2), err = k * Math.sqrt((P1.ph * (1 - P1.ph)) / P1.n + (P2.ph * (1 - P2.ph)) / P2.n);
    pasos.push({ t: 'Kritischer Wert und Fehler', html: `z<sub>α/2</sub> = <b>${f(k)}</b><br>E = z<sub>α/2</sub>·√(p̂₁q̂₁/n₁ + p̂₂q̂₂/n₂) = ${f(k)}·√(${f(P1.ph)}·${f(1 - P1.ph)}/${P1.n} + ${f(P2.ph)}·${f(1 - P2.ph)}/${P2.n}) = <b>${f(err)}</b>` });
    const a = d - err, b = d + err;
    pasos.push({ t: 'Intervall', html: `KI<sub>${f(c)}</sub>(p₁ − p₂) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Schlussfolgerung', html: conclusion(a, b, ['p₁', 'p₂']).replace('distintas', 'die Anteile verschieden') });
    return { a, b, est: d, err, k, crit: 'z', c, P1, P2, pasos, param: 'p₁ − p₂', dist: { d: 'normal' } };
  }
  function tamano(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), k = zc(a2), pasos = [], de = ['proporcion', 'dif-medias', 'dif-prop'].includes(sc.de) ? sc.de : 'media';
    const Em = lee(sc, 'E', 'der maximale Fehler E', { min: 0, minEx: true });
    pasos.push({ t: 'Daten', html: `Maximaler Fehler E = ${f(Em)}; ${alfaTxt(c, sc)} ⇒ z<sub>α/2</sub> = <b>${f(k)}</b>` });
    let n0, sigma = null, pp = null, s1 = null, s2 = null;
    const prop = (k0, nom) => { const v = lee(sc, k0, nom, { min: 0, max: 1, opcional: true }); return v === null ? 0.5 : v; };
    if (de === 'media') {
      sigma = lee(sc, 'sigma', 'die Standardabweichung σ', { min: 0, minEx: true }); n0 = ((k * sigma) / Em) ** 2;
      pasos.push({ t: 'Auflösen nach n', html: `E = z<sub>α/2</sub>·σ/√n ⇒ n = (z<sub>α/2</sub>·σ/E)<sup>2</sup> = (${f(k)}·${f(sigma)}/${f(Em)})<sup>2</sup> = ${f(n0, 6)}` });
    } else if (de === 'proporcion') {
      if (Em >= 1) throw new Error('Bei einem Anteil muss der Fehler kleiner als 1 sein (zum Beispiel 0,03 für 3 %)');
      pp = lee(sc, 'p0', 'der erwartete Anteil p', { min: 0, max: 1, opcional: true });
      const pu = pp === null ? 0.5 : pp; n0 = (k ** 2 * pu * (1 - pu)) / Em ** 2;
      pasos.push({ t: 'Auflösen nach n', html: `${pp === null ? 'Ohne vorherige Schätzung wird der ungünstigste Fall p = q = 0,5 angenommen (der das größte n ergibt).<br>' : ''}E = z<sub>α/2</sub>·√(pq/n) ⇒ n = z<sub>α/2</sub><sup>2</sup>·pq/E<sup>2</sup> = ${f(k)}<sup>2</sup>·${f(pu)}·${f(1 - pu)}/${f(Em)}<sup>2</sup> = ${f(n0, 6)}` });
      pp = pu;
    } else if (de === 'dif-medias') {
      s1 = lee(sc, 'sigma1', 'σ₁', { min: 0, minEx: true }); s2 = lee(sc, 'sigma2', 'σ₂', { min: 0, minEx: true }); n0 = (k ** 2 * (s1 ** 2 + s2 ** 2)) / Em ** 2;
      pasos.push({ t: 'Auflösen nach n (in beiden Stichproben gleich)', html: `E = z<sub>α/2</sub>·√(σ₁<sup>2</sup>/n + σ₂<sup>2</sup>/n) ⇒ n = z<sub>α/2</sub><sup>2</sup>(σ₁<sup>2</sup> + σ₂<sup>2</sup>)/E<sup>2</sup> = ${f(k)}<sup>2</sup>·(${f(s1)}<sup>2</sup> + ${f(s2)}<sup>2</sup>)/${f(Em)}<sup>2</sup> = ${f(n0, 6)}` });
    } else {
      if (Em >= 1) throw new Error('Bei einem Anteil muss der Fehler kleiner als 1 sein (zum Beispiel 0,03 für 3 %)');
      s1 = prop('p1', 'der erwartete Anteil p₁'); s2 = prop('p2', 'der erwartete Anteil p₂'); n0 = (k ** 2 * (s1 * (1 - s1) + s2 * (1 - s2))) / Em ** 2;
      pasos.push({ t: 'Auflösen nach n (in beiden Stichproben gleich)', html: `Nicht angegebene Anteile werden als 0,5 angenommen, der ungünstigste Fall.<br>E = z<sub>α/2</sub>·√(p₁q₁/n + p₂q₂/n) ⇒ n = z<sub>α/2</sub><sup>2</sup>(p₁q₁ + p₂q₂)/E<sup>2</sup> = ${f(k)}<sup>2</sup>·(${f(s1)}·${f(1 - s1)} + ${f(s2)}·${f(1 - s2)})/${f(Em)}<sup>2</sup> = ${f(n0, 6)}` });
    }
    const Np = de === 'media' || de === 'proporcion' ? lee(sc, 'Npob', 'der Umfang der Grundgesamtheit N', { min: 2, entero: true, opcional: true }) : null;
    if (Np !== null) { const n1 = n0 / (1 + (n0 - 1) / Np); pasos.push({ t: 'Endliche Grundgesamtheit', html: `Bei einer Grundgesamtheit von N = ${Np} braucht man weniger: n = n₀/(1 + (n₀ − 1)/N) = ${f(n0, 6)}/(1 + (${f(n0, 6)} − 1)/${Np}) = ${f(n1, 6)}` }); n0 = n1; }
    const n = Math.ceil(n0 - 1e-9);
    pasos.push({ t: 'Runden', html: `n muss ganzzahlig sein und der Fehler darf nicht überschritten werden, daher wird immer aufgerundet: <b>n = ${n}</b>${de.startsWith('dif') ? ' in jeder Stichprobe' : ''}` });
    return { n, n0, k, crit: 'z', c, Em, de, sigma, p0: pp, s1, s2, Npob: Np, pasos, param: 'n', dist: { d: 'normal' } };
  }
  function apareadas(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), pasos = [];
    let M;
    if ((sc.fuente ?? sc.fuente1) === 'datos') {
      const x1 = leeLista(sc.datos1, 'la muestra 1'), x2 = leeLista(sc.datos2, 'la muestra 2');
      if (x1.length !== x2.length) throw new Error(`Beide Listen müssen dieselben Daten in derselben Reihenfolge enthalten (es sind ${x1.length} und ${x2.length})`);
      const d = x1.map((x, i) => x - x2[i]), n = d.length, m = d.reduce((s, x) => s + x, 0) / n, ss = d.reduce((s, x) => s + (x - m) ** 2, 0);
      M = { n, m, sc: Math.sqrt(ss / (n - 1)), lista: true, d };
      pasos.push({ t: 'Differenzen', html: `d<sub>i</sub> = x<sub>1i</sub> − x<sub>2i</sub>: ${d.slice(0, 20).map((x) => f(x, 5)).join('; ')}${n > 20 ? '…' : ''}<br>n = ${n}, d̄ = <b>${f(m, 6)}</b>, s<sub>d</sub> = √(Σ(d − d̄)<sup>2</sup>/(n − 1)) = <b>${f(M.sc, 5)}</b><br>${alfaTxt(c, sc)}` });
    } else {
      const n = lee(sc, 'n', 'die Anzahl der Paare n', { min: 2, entero: true });
      M = { n, m: lee(sc, 'dm', 'der Mittelwert der Differenzen d̄'), sc: lee(sc, 'sd', 'die Stichprobenstandardabweichung der Differenzen s_d', { min: 0, minEx: true }) };
      pasos.push({ t: 'Daten', html: `n = ${n} Paare, d̄ = ${f(M.m, 6)}, s<sub>d</sub> = ${f(M.sc, 5)}<br>${alfaTxt(c, sc)}` });
    }
    const gl = M.n - 1, k = tc(gl, a2), err = (k * M.sc) / Math.sqrt(M.n), a = M.m - err, b = M.m + err;
    pasos.push({ t: 'Kritischer Wert und Fehler', html: `Die Differenzen bilden eine einzige Stichprobe: T = (d̄ − μ<sub>d</sub>)/(s<sub>d</sub>/√n) folgt einer Student-t-Verteilung mit n − 1 = ${gl} Freiheitsgraden.<br>t<sub>${gl}; α/2</sub> = <b>${f(k)}</b>, &ensp; E = t·s<sub>d</sub>/√n = ${f(k)}·${f(M.sc, 5)}/√${M.n} = <b>${f(err)}</b>` });
    pasos.push({ t: 'Intervall', html: `KI<sub>${f(c)}</sub>(μ<sub>d</sub>) = (d̄ − E, d̄ + E) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Schlussfolgerung', html: `${conclusion(a, b, ['μ₁', 'μ₂']).replace('distintas', 'distintas las medias')} Bei gepaarten Daten werden nicht die Formeln für zwei unabhängige Stichproben verwendet: Es ginge verloren, dass jedes Paar am selben Individuum gemessen wird.` });
    return { a, b, est: M.m, err, k, crit: 't', gl, c, M, pasos, param: 'μ_d', dist: { d: 't', nu: gl } };
  }
  const fq = (d1, d2, p) => E.cuantil(E.DIST.f, { d1, d2 }, p);
  function cocienteVar(sc) {
    const c = nivel(sc), al = 1 - c, a2 = mitad(sc, al), pasos = [];
    const sin = (i) => (vacio(sc['xm' + i]) ? { ['xm' + i]: '0' } : {}), M1 = muestra({ ...sc, ...sin('1') }, '1', 'la muestra 1'), M2 = muestra({ ...sc, ...sin('2') }, '2', 'la muestra 2');
    if (M1.sc === null || M2.sc === null) throw new Error('Die Standardabweichungen s₁ und s₂ der Stichproben fehlen');
    const d1 = M1.n - 1, d2 = M2.n - 1, q = M1.sc ** 2 / M2.sc ** 2, ks = fq(d1, d2, 1 - a2), ki = fq(d1, d2, a2);
    pasos.push({ t: 'Daten', html: `n₁ = ${M1.n}, s₁ = ${f(M1.sc, 5)}; n₂ = ${M2.n}, s₂ = ${f(M2.sc, 5)} ⇒ s₁<sup>2</sup>/s₂<sup>2</sup> = ${f(M1.sc ** 2, 5)}/${f(M2.sc ** 2, 5)} = <b>${f(q, 5)}</b><br>${alfaTxt(c, sc)}` });
    pasos.push({ t: 'Kritische Werte', html: `(s₁<sup>2</sup>/σ₁<sup>2</sup>)/(s₂<sup>2</sup>/σ₂<sup>2</sup>) folgt einer F-Verteilung mit (n₁ − 1, n₂ − 1) = (${d1}, ${d2}) Freiheitsgraden, die nicht symmetrisch ist:<br>F<sub>${d1}, ${d2}; α/2</sub> = <b>${f(ks)}</b> &ensp; und &ensp; F<sub>${d1}, ${d2}; 1−α/2</sub> = 1/F<sub>${d2}, ${d1}; α/2</sub> = <b>${f(ki)}</b>` });
    const a = q / ks, b = q / ki;
    pasos.push({ t: 'Intervall des Varianzquotienten', html: `KI<sub>${f(c)}</sub>(σ₁<sup>2</sup>/σ₂<sup>2</sup>) = (s₁<sup>2</sup>/s₂<sup>2</sup> / F<sub>α/2</sub>, s₁<sup>2</sup>/s₂<sup>2</sup> / F<sub>1−α/2</sub>) = (${f(q, 5)}/${f(ks)}; ${f(q, 5)}/${f(ki)}) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Intervall des Quotienten der Standardabweichungen', html: `Mit der Wurzel der beiden Endpunkte: KI<sub>${f(c)}</sub>(σ₁/σ₂) = <b>${ic(Math.sqrt(a), Math.sqrt(b))}</b>` });
    pasos.push({ t: 'Schlussfolgerung', html: a > 1 ? 'Das ganze Intervall liegt über 1: Mit diesem Konfidenzniveau ist σ₁ größer als σ₂.' : b < 1 ? 'Das ganze Intervall liegt unter 1: Mit diesem Konfidenzniveau ist σ₁ kleiner als σ₂.' : 'Das Intervall enthält die 1: Es gibt keine Hinweise auf verschiedene Varianzen, daher können bei der Differenz der Mittelwerte gleiche Varianzen angenommen werden.' });
    return { a, b, est: q, k: ks, k2: ki, crit: 'F', gl: null, c, M1, M2, sa: Math.sqrt(a), sb: Math.sqrt(b), pasos, param: 'σ₁²/σ₂²', piso: 0, dist: { d: 'f', d1, d2 } };
  }

  function cola(sc, r) {
    const l = lado(sc); r.lado = l;
    if (l === 'dos') return r;
    for (const q of r.pasos) { q.html = q.html.replace(/α\/2/g, 'α'); q.t = q.t.replace(/α\/2/g, 'α'); }
    if (r.a === undefined) return r;
    const inf = l === 'inf', piso = r.piso ?? (r.param === 'p' || r.param === 'σ²' ? 0 : -Infinity), techo = r.param === 'p' ? 1 : Infinity;
    if (inf) { r.b = techo; if (r.sb !== undefined) r.sb = Infinity; } else { r.a = piso; if (r.sa !== undefined) r.sa = 0; }
    r.pasos = r.pasos.filter((q) => !/^(Intervalo|Interpretación|Conclusión)/.test(q.t));
    const P = r.param.replace('μ_d', 'μ<sub>d</sub>'), lim = inf ? r.a : r.b;
    r.pasos.push({ t: inf ? 'Untere Schranke' : 'Obere Schranke', html: `Es interessiert nur ${inf ? 'ein Minimum' : 'ein Maximum'}, daher geht das ganze α an einen Rand und der kritische Wert lässt α auf einer Seite übrig (nicht α/2).<br>KI<sub>${f(r.c)}</sub>(${P}) = <b>${inf ? `(${f(r.a, 5)}; ${techo === 1 ? '1' : '+∞'})` : `(${piso === 0 ? '0' : '−∞'}; ${f(r.b, 5)})`}</b>${r.sa !== undefined ? ` und, für ${r.param === 'σ²' ? 'σ' : 'σ₁/σ₂'}, ${inf ? `(${f(r.sa, 5)}; +∞)` : `(0; ${f(r.sb, 5)})`}` : ''}` });
    r.pasos.push({ t: 'Interpretation', html: `Mit einem Konfidenzniveau von ${pc(r.c)} ist ${P} ${inf ? 'mindestens' : 'höchstens'} ${f(lim)}.` });
    return r;
  }
  function contraste(sc, r) {
    if (r.a === undefined || vacio(sc.h0)) return r;
    const h0 = leeNum(sc.h0);
    if (!isFinite(h0)) throw new Error('Der zu testende Wert ist keine Zahl');
    const dentro = r.a <= h0 && h0 <= r.b, P = r.param.replace('μ_d', 'μ<sub>d</sub>'), al = f(1 - r.c), l = r.lado;
    const H1 = l === 'inf' ? `${P} &gt; ${f(h0)}` : l === 'sup' ? `${P} &lt; ${f(h0)}` : `${P} ≠ ${f(h0)}`;
    Object.assign(r, { h0, rechaza: !dentro });
    r.pasos.push({ t: 'Test über das Intervall', html: `H₀: ${P} = ${f(h0)} gegen H₁: ${H1}, mit Signifikanzniveau α = ${al}.<br>${dentro ? `${f(h0)} liegt im Intervall: <b>H₀ wird nicht verworfen</b>. Die Daten sind mit ${P} = ${f(h0)} vereinbar.` : `${f(h0)} liegt außerhalb des Intervalls: <b>H₀ wird verworfen</b> mit α = ${al}.`}` });
    return r;
  }
  const MODOS = { media, proporcion, prediccion, varianza, 'dif-medias': difMedias, apareadas, 'dif-prop': difProp, 'cociente-var': cocienteVar, tamano };
  function resolver(sc) {
    const m = MODOS[sc.modo] ? sc.modo : 'media';
    return Object.assign(contraste(sc, cola(sc, MODOS[m](sc))), { modo: m });
  }

  const gauss = (r) => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const binom = (r, n, q) => { if (n <= 200) { let k = 0; for (let i = 0; i < n; i++) if (r() < q) k++; return k; } return Math.min(n, Math.max(0, Math.round(n * q + gauss(r) * Math.sqrt(n * q * (1 - q))))); };
  function generaMuestra(r, n, mu, s) { const m = Math.min(n, 400); const xs = Array.from({ length: m }, () => mu + s * gauss(r)); return m === n ? xs : null; }
  function simula(sol, r = Math.random) {
    if (sol.pasos.some((q) => q.t === 'Endliche Grundgesamtheit')) return null;
    const base = { nivel: String(100 * sol.c), lado: sol.lado }, una = (fn, q) => cola(q, fn(q));
    const resumen = (n, mu, s) => {
      const xs = generaMuestra(r, n, mu, s);
      if (xs) { const m = xs.reduce((a, x) => a + x, 0) / n; return { m, s: Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1)) }; }
      const nu = n - 1, ch = Math.max(1e-9, nu + Math.sqrt(2 * nu) * gauss(r));
      return { m: mu + (s / Math.sqrt(n)) * gauss(r), s: s * Math.sqrt(ch / nu) };
    };
    if (sol.modo === 'media') {
      const mu = sol.M.m, s = sol.sigma ?? sol.M.sc, n = sol.M.n;
      return { real: mu, una: () => { const q = resumen(n, mu, s); const x = una(media, { ...base, sigmaC: sol.sigma !== null ? 'si' : 'no', sigma: String(sol.sigma), n: String(n), xm: String(q.m), s: String(q.s) }); return [x.a, x.b, q.m]; } };
    }
    if (sol.modo === 'varianza') {
      const s = sol.M.sc, n = sol.M.n;
      return { real: s * s, una: () => { const q = resumen(n, 0, s); const x = una(varianza, { ...base, n: String(n), xm: '0', s: String(q.s) }); return [x.a, x.b, q.s * q.s]; } };
    }
    if (sol.modo === 'proporcion') {
      const pr = sol.P.ph, n = sol.P.n;
      return { real: pr, una: () => { const k = binom(r, n, pr); const x = una(proporcion, { ...base, n: String(n), x: String(k), metodoP: sol.metodoP }); return [x.a, x.b, k / n]; } };
    }
    if (sol.modo === 'dif-medias') {
      const { M1, M2 } = sol, sa = sol.s1 ?? M1.sc, sb = sol.s2 ?? M2.sc;
      return { real: M1.m - M2.m, una: () => { const q1 = resumen(M1.n, M1.m, sa), q2 = resumen(M2.n, M2.m, sb); const x = una(difMedias, { ...base, caso: sol.caso, n1: String(M1.n), xm1: String(q1.m), s1: String(q1.s), n2: String(M2.n), xm2: String(q2.m), s2: String(q2.s), sigma1: String(sol.s1), sigma2: String(sol.s2) }); return [x.a, x.b, q1.m - q2.m]; } };
    }
    if (sol.modo === 'apareadas') {
      const mu = sol.M.m, s = sol.M.sc, n = sol.M.n;
      return { real: mu, una: () => { const q = resumen(n, mu, s); const x = una(apareadas, { ...base, fuente: 'resumen', n: String(n), dm: String(q.m), sd: String(q.s) }); return [x.a, x.b, q.m]; } };
    }
    if (sol.modo === 'cociente-var') {
      const { M1, M2 } = sol;
      return { real: M1.sc ** 2 / M2.sc ** 2, una: () => { const q1 = resumen(M1.n, 0, M1.sc), q2 = resumen(M2.n, 0, M2.sc); const x = una(cocienteVar, { ...base, n1: String(M1.n), s1: String(q1.s), n2: String(M2.n), s2: String(q2.s) }); return [x.a, x.b, q1.s ** 2 / q2.s ** 2]; } };
    }
    if (sol.modo === 'dif-prop') {
      const { P1, P2 } = sol;
      return { real: P1.ph - P2.ph, una: () => { const k1 = binom(r, P1.n, P1.ph), k2 = binom(r, P2.n, P2.ph); const x = una(difProp, { ...base, n1: String(P1.n), x1: String(k1), n2: String(P2.n), x2: String(k2) }); return [x.a, x.b, k1 / P1.n - k2 / P2.n]; } };
    }
    return null;
  }

  const ejemplos = [
    { clave: 'altura', nombre: 'Mittelwert bei bekanntem σ (Körpergrößen)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'si', sigma: '8', xm: '172', s: '', n: '36', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'bombillas', nombre: 'Mittelwert bei unbekanntem σ (Lebensdauer von Glühbirnen)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: '1200', s: '90', n: '16', nivel: '99', tipoS: 'cuasi' } },
    { clave: 'lista', nombre: 'Mittelwert aus den Daten', sc: { modo: 'media', fuente: 'datos', sigmaC: 'no', datos: '9,8 10,2 10,1 9,7 10,4 9,9 10,0 10,3 9,6 10,1', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'muestral', nombre: 'Mittelwert mit der Standardabweichung der Stichprobe (mit n)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: '25,4', s: '3,2', n: '12', nivel: '90', tipoS: 'muestral' } },
    { clave: 'encuesta', nombre: 'Anteil (Umfrage)', sc: { modo: 'proporcion', tipoP: 'exitos', n: '500', x: '210', ph: '', nivel: '95' } },
    { clave: 'defectuosas', nombre: 'Anteil defekter Teile', sc: { modo: 'proporcion', tipoP: 'proporcion', n: '400', x: '', ph: '0,06', nivel: '99' } },
    { clave: 'pocos-exitos', nombre: 'Anteil mit wenigen Erfolgen (exakt nach Clopper-Pearson)', sc: { modo: 'proporcion', tipoP: 'exitos', n: '20', x: '2', ph: '', nivel: '95', metodoP: 'cp' } },
    { clave: 'wilson', nombre: 'Anteil mit dem Wilson-Intervall', sc: { modo: 'proporcion', tipoP: 'exitos', n: '50', x: '6', ph: '', nivel: '95', metodoP: 'wilson' } },
    { clave: 'prediccion', nombre: 'Prognose: Lebensdauer der nächsten Glühbirne', sc: { modo: 'prediccion', queP: 'pred', fuente: 'resumen', xm: '1200', s: '90', n: '16', nivel: '95', tipoS: 'cuasi', cob: '90' } },
    { clave: 'tolerancia', nombre: 'Toleranz: 90 % der Teile', sc: { modo: 'prediccion', queP: 'tol', fuente: 'resumen', xm: '50', s: '2', n: '10', nivel: '95', tipoS: 'cuasi', cob: '90' } },
    { clave: 'varianza', nombre: 'Varianz und Standardabweichung', sc: { modo: 'varianza', fuente: 'resumen', xm: '50', s: '2,5', n: '20', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'dif-conocidas', nombre: 'Differenz von Mittelwerten bei bekanntem σ', sc: { modo: 'dif-medias', caso: 'conocidas', fuente1: 'resumen', fuente2: 'resumen', xm1: '82', n1: '40', s1: '', sigma1: '6', xm2: '78', n2: '50', s2: '', sigma2: '7', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'dif-iguales', nombre: 'Differenz von Mittelwerten (gleiche Varianzen)', sc: { modo: 'dif-medias', caso: 'iguales', fuente1: 'resumen', fuente2: 'resumen', xm1: '15,2', n1: '10', s1: '1,8', xm2: '13,9', n2: '12', s2: '2,1', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'dif-welch', nombre: 'Differenz von Mittelwerten (Welch)', sc: { modo: 'dif-medias', caso: 'distintas', fuente1: 'resumen', fuente2: 'resumen', xm1: '68', n1: '15', s1: '4', xm2: '72', n2: '20', s2: '9', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'apareadas', nombre: 'Gepaarte Daten: Gewicht vor und nach einer Diät', sc: { modo: 'apareadas', fuente: 'datos', datos1: '82 75 91 68 77 85 80 73', datos2: '79 74 86 67 75 80 78 72', nivel: '95' } },
    { clave: 'apareadas-resumen', nombre: 'Gepaarte Daten aus d̄ und s_d', sc: { modo: 'apareadas', fuente: 'resumen', n: '12', dm: '2,4', sd: '3,1', nivel: '90' } },
    { clave: 'cociente', nombre: 'Varianzquotient zweier Maschinen', sc: { modo: 'cociente-var', fuente: 'resumen', fuente1: 'resumen', fuente2: 'resumen', n1: '13', s1: '2,8', n2: '16', s2: '1,9', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'cota-media', nombre: 'Untere Schranke eines Mittelwerts (einseitig)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: '1200', s: '90', n: '16', nivel: '95', tipoS: 'cuasi', lado: 'inf' } },
    { clave: 'cota-prop', nombre: 'Obere Schranke eines Anteils defekter Teile', sc: { modo: 'proporcion', tipoP: 'exitos', n: '400', x: '12', ph: '', nivel: '95', lado: 'sup' } },
    { clave: 'finita', nombre: 'Mittelwert in einer endlichen Grundgesamtheit (500 Studierende)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'si', sigma: '1,2', xm: '6,4', s: '', n: '80', nivel: '95', tipoS: 'cuasi', Npob: '500' } },
    { clave: 'contraste', nombre: 'Ist er mit μ = 1250 vereinbar? (Test über das Intervall)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: '1200', s: '90', n: '16', nivel: '95', tipoS: 'cuasi', h0: '1250' } },
    { clave: 'dif-prop', nombre: 'Differenz von Anteilen', sc: { modo: 'dif-prop', tipoP: 'exitos', n1: '300', x1: '120', n2: '250', x2: '85', nivel: '95' } },
    { clave: 'n-media', nombre: 'Stichprobenumfang für einen Mittelwert', sc: { modo: 'tamano', de: 'media', sigma: '15', E: '3', p0: '', nivel: '95' } },
    { clave: 'n-dif', nombre: 'Stichprobenumfang zum Vergleich zweier Mittelwerte', sc: { modo: 'tamano', de: 'dif-medias', sigma1: '12', sigma2: '15', E: '4', nivel: '95' } },
    { clave: 'n-finita', nombre: 'Umfrage in einem Dorf mit 2000 Einwohnern', sc: { modo: 'tamano', de: 'proporcion', sigma: '', E: '0,05', p0: '', Npob: '2000', nivel: '95' } },
    { clave: 'n-prop', nombre: 'Stichprobenumfang für eine Umfrage', sc: { modo: 'tamano', de: 'proporcion', sigma: '', E: '0,03', p0: '', nivel: '95' } },
  ];
  return { resolver, simula, ejemplos, f, zc, tc, xc, METODOS_P };
})();

