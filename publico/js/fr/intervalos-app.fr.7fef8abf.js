(() => {
  const { $, esc, copia, txt } = Herramienta;
  const I = Intervalos, f = I.f, CLAVE = 'intervalos-v1', E = Estadistica;
  const MODOS = [['media', 'Espérance μ'], ['proporcion', 'Proportion p'], ['prediccion', 'Prédiction et tolérance'], ['varianza', 'Variance σ² et écart type σ'], ['dif-medias', 'Différence de moyennes μ₁ − μ₂'], ['apareadas', 'Données appariées μ_d'], ['dif-prop', 'Différence de proportions p₁ − p₂'], ['cociente-var', 'Rapport de variances σ₁²/σ₂²'], ['tamano', 'Taille de l’échantillon']];

  let sc = copia(I.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, sim = null, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const area = (k, nom) => `<label for="f-${k}" class="ancho">${nom} <small>séparés par des espaces, « ; » ou sur des lignes</small></label><textarea id="f-${k}" class="in ancho" data-k="${k}" rows="4" spellcheck="false" autocomplete="off">${esc(sc[k] ?? '')}</textarea>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const FUENTE = [['resumen', 'Un résumé (x̄, s, n)'], ['datos', 'La liste de valeurs']];
  const TIPO_S = [['cuasi', 'Écart type corrigé (avec n − 1)'], ['muestral', 'Écart type de l’échantillon (avec n)']];
  const nivelF = () => fila('nivel', 'Niveau de confiance', '%');
  const PARAM = { prediccion: 'x', media: 'μ', proporcion: 'p', varianza: 'σ²', 'dif-medias': 'μ₁ − μ₂', apareadas: 'μ<sub>d</sub>', 'dif-prop': 'p₁ − p₂', 'cociente-var': 'σ₁²/σ₂²' };
  const NOTAS = {
    media: 'Si l’on vous donne l’écart type de la population σ, choisissez « σ connue » (on utilise z). Si vous n’avez que celui de l’échantillon, on utilise la loi de Student à n − 1 degrés de liberté.',
    proporcion: 'Vous pouvez donner le nombre de succès x ou directement la proportion de l’échantillon p̂ (0,42 ou 42 %… écrivez 0,42). La méthode normale (Wald) est celle du cours ; avec peu de succès ou d’échecs, Wilson ou l’exacte sont meilleures.',
    prediccion: 'L’intervalle de prédiction indique où tombera la prochaine donnée ; celui de tolérance, où se trouve la plus grande partie de la population. Les deux sont plus larges que celui de la moyenne et supposent une population normale.',
    varianza: 'On utilise le χ² à n − 1 degrés de liberté. Si votre manuel donne l’écart type de l’échantillon en divisant par n, choisissez-le ci-dessous et il est converti en écart type corrigé.',
    'dif-medias': 'Échantillons indépendants. Avec σ inconnues, si on les suppose égales, on utilise la variance corrigée pondérée ; sinon, l’approximation de Welch.',
    'dif-prop': 'Échantillons indépendants et grands. L’intervalle de p₁ − p₂ indique si les deux proportions sont différentes.',
    apareadas: 'Deux mesures sur les mêmes individus (avant et après, deux méthodes sur la même pièce…). On travaille avec les différences d = x₁ − x₂ comme un seul échantillon.',
    'cociente-var': 'Compare la variabilité de deux populations normales avec la loi F. Si l’intervalle contient 1, on peut supposer des variances égales.',
    tamano: 'Combien de données faut-il pour ne pas dépasser une erreur E avec la confiance demandée. Pour une proportion sans estimation préalable, on utilise p = 0,5. Si la population est petite, donnez sa taille N.',
  };
  function formulario() {
    let h = elige('modo', 'Intervalle de', MODOS);
    const m = sc.modo;
    if (m === 'media' || m === 'varianza') {
      h += elige('fuente', 'Données', FUENTE);
      if (m === 'media') h += elige('sigmaC', 'Écart type de la population', [['no', 'σ inconnue (loi de Student)'], ['si', 'σ connue (loi normale)']]) + (sc.sigmaC === 'si' ? fila('sigma', 'Écart type σ') : '');
      if (sc.fuente === 'datos') h += area('datos', 'Valeurs');
      else {
        h += (m === 'media' ? fila('xm', 'Moyenne de l’échantillon x̄') : '') + fila('n', 'Taille de l’échantillon n');
        if (!(m === 'media' && sc.sigmaC === 'si')) h += fila('s', 'Écart type de l’échantillon s') + elige('tipoS', 'Cet écart type est', TIPO_S);
      }
    } else if (m === 'proporcion') {
      h += elige('tipoP', 'Données', [['exitos', 'Nombre de succès x'], ['proporcion', 'Proportion p̂']]) + fila('n', 'Taille de l’échantillon n') + (sc.tipoP === 'proporcion' ? fila('ph', 'Proportion p̂') : fila('x', 'Succès x'));
      h += elige('metodoP', 'Méthode', Object.entries(I.METODOS_P));
    } else if (m === 'prediccion') {
      h += elige('queP', 'Intervalle pour', [['pred', 'Une observation future (prédiction)'], ['tol', 'Une proportion de la population (tolérance)']]) + elige('fuente', 'Données', FUENTE);
      if (sc.fuente === 'datos') h += area('datos', 'Valeurs');
      else h += fila('xm', 'Moyenne de l’échantillon x̄') + fila('n', 'Taille de l’échantillon n') + fila('s', 'Écart type de l’échantillon s') + elige('tipoS', 'Cet écart type est', TIPO_S);
      if (sc.queP === 'tol') h += fila('cob', 'Proportion de la population', '%');
    } else if (m === 'dif-medias') {
      h += elige('caso', 'Écarts types', [['conocidas', 'σ₁ et σ₂ connues (loi normale)'], ['iguales', 'Inconnues mais égales (t)'], ['distintas', 'Inconnues et différentes (Welch)']]) + elige('fuente', 'Données', FUENTE);
      for (const i of ['1', '2']) {
        h += sep(`Échantillon ${i}`);
        if (sc.fuente === 'datos') h += area('datos' + i, 'Valeurs');
        else h += fila('xm' + i, `Moyenne x̄${i === '1' ? '₁' : '₂'}`) + fila('n' + i, `Taille n${i === '1' ? '₁' : '₂'}`);
        if (sc.caso === 'conocidas') h += fila('sigma' + i, `σ${i === '1' ? '₁' : '₂'} de la population`);
        else if (sc.fuente !== 'datos') h += fila('s' + i, `Écart type corrigé s${i === '1' ? '₁' : '₂'}`);
      }
      h += sep('Confiance');
    } else if (m === 'apareadas') {
      h += elige('fuente', 'Données', [['datos', 'Les deux listes de valeurs'], ['resumen', 'Un résumé (d̄, s_d, n)']]);
      if (sc.fuente === 'datos') h += area('datos1', 'Valeurs de la mesure 1 (avant)') + area('datos2', 'Valeurs de la mesure 2 (après), dans le même ordre');
      else h += fila('n', 'Nombre de paires n') + fila('dm', 'Moyenne des différences d̄') + fila('sd', 'Écart type corrigé des différences s<sub>d</sub>');
    } else if (m === 'cociente-var') {
      h += elige('fuente', 'Données', FUENTE);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Échantillon ${i}`) + (sc.fuente === 'datos' ? area('datos' + i, 'Valeurs') : fila('n' + i, `Taille n${s}`) + fila('s' + i, `Écart type corrigé s${s}`)); }
      h += sep('Confiance');
    } else if (m === 'dif-prop') {
      h += elige('tipoP', 'Données', [['exitos', 'Nombre de succès'], ['proporcion', 'Proportions p̂']]);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Échantillon ${i}`) + fila('n' + i, `Taille n${s}`) + (sc.tipoP === 'proporcion' ? fila('ph' + i, `Proportion p̂${s}`) : fila('x' + i, `Succès x${s}`)); }
      h += sep('Confiance');
    } else {
      h += elige('de', 'Pour estimer', [['media', 'Une moyenne'], ['proporcion', 'Une proportion'], ['dif-medias', 'Une différence de moyennes'], ['dif-prop', 'Une différence de proportions']]) + fila('E', 'Erreur maximale E');
      h += sc.de === 'proporcion' ? fila('p0', 'Proportion attendue p', '(opcional)') : sc.de === 'dif-medias' ? fila('sigma1', 'σ₁ de la population 1') + fila('sigma2', 'σ₂ de la population 2') : sc.de === 'dif-prop' ? fila('p1', 'Proportion attendue p₁', '(opcional)') + fila('p2', 'Proportion attendue p₂', '(opcional)') : fila('sigma', 'Écart type σ');
    }
    h += nivelF();
    if (m !== 'tamano' && !(m === 'prediccion' && sc.queP === 'tol')) h += elige('lado', 'Type d’intervalle', [['dos', 'Bilatéral (a ; b)'], ['inf', 'Borne inférieure (a ; +∞)'], ['sup', 'Borne supérieure (−∞ ; b)']]);
    if (m === 'media' || m === 'proporcion' || (m === 'tamano' && (sc.de === 'media' || sc.de === 'proporcion' || !sc.de))) h += fila('Npob', 'Taille de la population N', '(opcional, si es finita)');
    if (m !== 'tamano' && m !== 'prediccion') h += fila('h0', `Tester ${PARAM[m]} =`, '(opcional)');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[m];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(I.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (k === 'queP') { sc.queP = t.value; if (t.value === 'tol') { sc.lado = 'dos'; if (!sc.cob) sc.cob = '90'; } }
    else {
      sc[k] = t.value;
      if (k === 'fuente') { sc.fuente1 = sc.fuente2 = t.value; if (t.value === 'datos') for (const d of ['dif-medias', 'apareadas', 'cociente-var'].includes(sc.modo) ? ['datos1', 'datos2'] : ['datos']) if (!sc[d]) sc[d] = d === 'datos2' ? '11,2 12,8 10,9 12,1 11,7 12,4' : '12,1 13,4 11,8 12,9 13,2 12,5'; }
    }
    formulario(); cambia();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${I.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = I.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); if (sc.fuente1 && !sc.fuente) sc.fuente = sc.fuente1;
    formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(+x.toFixed(2)).replace('.', ',');
    const nivel = de(['90', '95', '95', '99']);
    const tipos = [
      () => { const conocida = Math.random() < 0.5, s = ent(2, 30); return { modo: 'media', fuente: 'resumen', sigmaC: conocida ? 'si' : 'no', sigma: conocida ? String(s) : '', xm: String(ent(20, 500)), s: conocida ? '' : String(s), n: String(de([9, 10, 16, 25, 36, 49, 64, 100])), nivel, tipoS: 'cuasi' }; },
      () => { const n = de([100, 200, 400, 500, 1000]); return { modo: 'proporcion', tipoP: 'exitos', n: String(n), x: String(ent(Math.round(n * 0.1), Math.round(n * 0.7))), ph: '', nivel }; },
      () => ({ modo: 'varianza', fuente: 'resumen', xm: '', s: c(ent(10, 80) / 10), n: String(ent(8, 30)), nivel, tipoS: 'cuasi' }),
      () => { const s = ent(3, 12); return { modo: 'dif-medias', caso: 'conocidas', fuente: 'resumen', fuente1: 'resumen', fuente2: 'resumen', xm1: String(ent(60, 90)), n1: String(ent(30, 80)), sigma1: String(s), xm2: String(ent(60, 90)), n2: String(ent(30, 80)), sigma2: String(s + ent(0, 4)), nivel, tipoS: 'cuasi' }; },
      () => ({ modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: String(ent(50, 300)), s: String(ent(5, 40)), n: String(de([10, 16, 20, 25])), nivel, tipoS: 'cuasi', lado: de(['inf', 'sup']) }),
      () => ({ modo: 'apareadas', fuente: 'resumen', n: String(ent(8, 20)), dm: c(ent(5, 40) / 10), sd: c(ent(10, 50) / 10), nivel }),
      () => (Math.random() < 0.5 ? { modo: 'tamano', de: 'media', sigma: String(ent(5, 30)), E: String(ent(1, 5)), p0: '', nivel } : { modo: 'tamano', de: 'proporcion', sigma: '', E: c(de([0.02, 0.03, 0.04, 0.05])), p0: Math.random() < 0.5 ? '' : c(ent(10, 60) / 100), nivel }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const nc = `al ${esc(sc.nivel)} %`;
    if (sc.modo === 'media' && (sc.lado === 'inf' || sc.lado === 'sup')) return `Un échantillon de ${esc(sc.n)} éléments a pour moyenne ${esc(sc.xm)} et pour écart type corrigé ${esc(sc.s)}. Calculez la borne ${sc.lado === 'inf' ? 'inférieure' : 'supérieure'} de la moyenne de la population avec une confiance de ${esc(sc.nivel)} %.`;
    switch (sc.modo) {
      case 'apareadas': return `On mesure ${esc(sc.n)} personnes avant et après un traitement. La moyenne des différences est ${esc(sc.dm)} et son écart type corrigé ${esc(sc.sd)}. Calculez l’intervalle de confiance ${nc} pour la moyenne des différences.`;
      case 'cociente-var': return `Deux échantillons de ${esc(sc.n1)} et ${esc(sc.n2)} pièces ont pour écarts types corrigés ${esc(sc.s1)} et ${esc(sc.s2)}. Calculez l’intervalle ${nc} pour σ₁²/σ₂² et dites si les variances peuvent être égales.`;
      case 'media': return sc.fuente === 'datos' ? `Avec les données de l’échantillon, calculez l’intervalle de confiance ${nc} pour la moyenne de la population.` : `Un échantillon de ${esc(sc.n)} éléments a pour moyenne ${esc(sc.xm)}${sc.sigmaC === 'si' ? `. L’écart type de la population est ${esc(sc.sigma)}` : ` et pour écart type corrigé ${esc(sc.s)}`}. Calculez l’intervalle de confiance ${nc} pour la moyenne et l’erreur maximale.`;
      case 'proporcion': return `Dans un échantillon de ${esc(sc.n)} personnes, ${sc.tipoP === 'proporcion' ? `la proportion ayant la caractéristique est ${esc(sc.ph)}` : `${esc(sc.x)} ont la caractéristique`}. Calculez l’intervalle de confiance ${nc} pour la proportion et l’erreur maximale.`;
      case 'varianza': return `Un échantillon de ${esc(sc.n)} pièces a pour écart type corrigé ${esc(sc.s)}. Calculez l’intervalle de confiance ${nc} pour la variance et pour l’écart type de la population.`;
      case 'dif-medias': return `Deux échantillons indépendants : n₁ = ${esc(sc.n1)} de moyenne ${esc(sc.xm1)} et n₂ = ${esc(sc.n2)} de moyenne ${esc(sc.xm2)}${sc.caso === 'conocidas' ? `, de populations avec σ₁ = ${esc(sc.sigma1)} et σ₂ = ${esc(sc.sigma2)}` : ''}. Calculez l’intervalle ${nc} pour μ₁ − μ₂ et dites si les moyennes sont différentes.`;
      case 'dif-prop': return `Dans un échantillon de ${esc(sc.n1)}, il y a ${esc(sc.x1)} succès et dans un autre de ${esc(sc.n2)}, ${esc(sc.x2)}. Calculez l’intervalle ${nc} pour p₁ − p₂.`;
      default: return sc.de === 'proporcion' ? `Combien de personnes faut-il interroger pour estimer une proportion${sc.p0 ? ` (que l’on s’attend à voir égale à ${esc(sc.p0)})` : ''} avec une erreur maximale de ${esc(sc.E)} et une confiance de ${esc(sc.nivel)} % ?` : `L’écart type d’une population est ${esc(sc.sigma)}. Quelle taille d’échantillon faut-il pour estimer la moyenne avec une erreur maximale de ${esc(sc.E)} et une confiance de ${esc(sc.nivel)} % ?`;
    }
  };

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  const CRIT = (s) => {
    const al = s.lado === 'inf' || s.lado === 'sup' ? 'α' : 'α/2', X = s.crit === 'F' ? 'F' : 'χ<sup>2</sup>';
    if (s.crit === 'z') return `z<sub>${al}</sub> = <b>${f(s.k)}</b>`;
    if (s.crit === 't') return `t<sub>${s.gl}; ${al}</sub> = <b>${f(s.k)}</b>`;
    if (s.crit === 'k') return `k = <b>${f(s.k)}</b>`;
    return s.lado === 'inf' ? `${X} = <b>${f(s.k)}</b>` : s.lado === 'sup' ? `${X} = <b>${f(s.k2)}</b>` : `${X} = ${f(s.k2)} y ${f(s.k)}`;
  };
  const extremo = (x) => (x === Infinity ? '+∞' : x === -Infinity ? '−∞' : f(x, 5));
  const iv = (a, b) => `(${extremo(a)}; ${extremo(b)})`;
  function calcula() {
    const err = $('#error');
    try { sol = I.resolver({ ...sc, fuente1: sc.fuente ?? sc.fuente1, fuente2: sc.fuente ?? sc.fuente2 }); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#usar-en').hidden = true; $('#pasos').innerHTML = ''; $('#cuenta').textContent = ''; sim = null; dibuja(); return; }
    err.hidden = true; guarda();
    const nc = `${f(100 * sol.c)} %`;
    let h;
    if (sol.modo === 'tamano') h = dato(sol.de.startsWith('dif') ? 'Taille de chaque échantillon' : 'Taille de l’échantillon', `n = <b>${sol.n}</b>`) + dato('Sans arrondi', `${f(sol.n0, 6)}`) + dato('Valeur critique', CRIT(sol));
    else {
      const tipo = sol.lado === 'inf' ? 'Borne inférieure' : sol.lado === 'sup' ? 'Borne supérieure' : 'Intervalle';
      h = dato(`${tipo} à ${nc} pour ${sol.paramTxt || PARAM[sol.modo]}`, `<b>${iv(sol.a, sol.b)}</b>`, 'ancho');
      if (sol.modo === 'varianza') h += dato(`Intervalle pour σ`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Estimation', `s<sup>2</sup> = ${f(sol.est, 5)}`);
      else if (sol.modo === 'cociente-var') h += dato(`Intervalle pour σ₁/σ₂`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Estimation', `s₁<sup>2</sup>/s₂<sup>2</sup> = ${f(sol.est, 5)}`);
      else h += dato('Estimation', `${{ prediccion: 'x̄', media: 'x̄', proporcion: 'p̂', 'dif-medias': 'x̄₁ − x̄₂', apareadas: 'd̄', 'dif-prop': 'p̂₁ − p̂₂' }[sol.modo]} = ${f(sol.est, 5)}`) + dato('Erreur maximale', `E = <b>${f(sol.err)}</b>`);
      h += dato(sol.crit === 'k' ? 'Facteur de tolérance' : 'Valeur critique', CRIT(sol));
      if (sol.modo === 'proporcion') h += dato('Méthode', I.METODOS_P[sol.metodoP]);
      if (sol.h0 !== undefined) h += dato(`Test de ${PARAM[sol.modo]} = ${f(sol.h0)}`, sol.rechaza ? '<b>On rejette H₀</b>' : '<b>On ne rejette pas H₀</b>', 'ancho');
    }
    $('#res').innerHTML = h;
    const ue = $('#usar-en'), lleva = (sol.modo === 'media' || sol.modo === 'prediccion' || sol.modo === 'varianza') && sc.fuente === 'datos' && !Herramienta.vacio(sc.datos);
    ue.hidden = !lleva;
    ue.innerHTML = lleva ? `<a class="btn" data-usar="descriptiva" href="${esc(Herramienta.enlaceA('descriptiva', { formato: 'lista', datos: sc.datos, pesos: '', div: 'n1', pk: '' }))}">Descriptive de ces données →</a>` : '';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#simcard').hidden = sol.modo === 'tamano' || sol.modo === 'prediccion';
    nuevaSim();
    dibuja();
  }

  const N = 100;
  function nuevaSim() {
    const g = sol && I.simula(sol);
    sim = g ? { ...g, hechos: [], t: 0 } : null;
    if (!sim) return;
    try { for (let i = 0; i < N; i++) sim.hechos.push(g.una()); } catch (e) { sim = null; }
    $('#cuenta').textContent = '';
  }
  const visibles = () => (sim ? Math.min(N, Math.floor(sim.t * 25)) : 0);

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--ok', '--mal']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => Herramienta.lienzo(s);
  const FUENTE_UI = '"IBM Plex Sans", system-ui, sans-serif';
  function dibuja() { campana(); simulacion(); }
  function campana() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    const S = sol.sinGrafica ? { ...sol, k: sol.kz, c: sol.cob, crit: 'z', dist: { d: 'normal' } } : sol;
    if (!col['--ink']) colores();
    const d = S.dist, D = E.DIST[d.d], P = d.d === 'normal' ? { mu: 0, sigma: 1 } : d.d === 't' ? { nu: d.nu } : d.d === 'f' ? { d1: d.d1, d2: d.d2 } : { k: d.k };
    const al = 1 - S.c, asim = d.d === 'chi2' || d.d === 'f', inf = S.lado === 'inf', sup = S.lado === 'sup';
    let x0, x1;
    if (d.d === 'chi2') { x0 = 0; x1 = Math.max(S.k * 1.25, d.k + 4 * Math.sqrt(2 * d.k)); } else if (d.d === 'f') { x0 = 0; x1 = Math.max(S.k * 1.25, E.cuantil(D, P, 0.99)); } else { const r = Math.max(4, S.k * 1.35); x0 = -r; x1 = r; }
    const lo = inf ? x0 : asim ? S.k2 : -S.k, hi = sup ? x1 : S.k;
    const mL = 16, mR = 16, mT = 26, mB = 30, M = 300, xs = Array.from({ length: M + 1 }, (_, i) => x0 + ((x1 - x0) * i) / M), ys = xs.map((x) => D.pdf(P, x));
    const ymax = Math.max(...ys.filter(isFinite)) * 1.1 || 1;
    const X = (x) => mL + ((x - x0) / (x1 - x0)) * (w - mL - mR), Y = (y) => h - mB - (Math.min(y, ymax) / ymax) * (h - mT - mB);
    const tramo = (a, b, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(X(a), Y(0)); for (let i = 0; i <= 80; i++) { const x = a + ((b - a) * i) / 80; g.lineTo(X(x), Y(D.pdf(P, x))); } g.lineTo(X(b), Y(0)); g.closePath(); g.fill(); };
    tramo(Math.max(x0 + 1e-9, lo), Math.min(x1, hi), col['--accent-soft']);
    g.globalAlpha = 0.35; if (!inf) tramo(x0 + 1e-9, lo, col['--mal']); if (!sup) tramo(hi, x1, col['--mal']); g.globalAlpha = 1;
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(X(x), Y(ys[i])) : g.moveTo(X(x), Y(ys[i])))); g.stroke();
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); g.stroke();
    g.font = `12px ${FUENTE_UI}`; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const [x, t] of [[lo, f(lo)], [hi, f(hi)]].filter((_, i) => (i ? !sup : !inf))) { g.strokeStyle = col['--ink']; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), mT - 4); g.stroke(); g.setLineDash([]); g.fillStyle = col['--ink']; g.fillText(txt(t), X(x), h - mB + 6); }
    const nom = d.d === 'normal' ? 'Z ~ N(0, 1)' : d.d === 't' ? `T ~ loi de Student à ${d.nu} ddl` : d.d === 'f' ? `Loi de Fisher-Snedecor à (${d.d1}, ${d.d2}) ddl` : `χ² à ${d.k} ddl`;
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(nom, mL, 4);
    g.fillStyle = col['--accent']; g.textAlign = 'center'; g.font = `600 13px ${FUENTE_UI}`; g.fillText(`1 − α = ${txt(f(S.c))}`, X((lo + hi) / 2), Y(D.pdf(P, (lo + hi) / 2)) * 0.5 + Y(0) * 0.5);
    g.font = `12px ${FUENTE_UI}`; g.fillStyle = col['--mal'];
    const ya = mT + (h - mT - mB) * 0.6, et = inf || sup ? `α = ${txt(f(al))}` : `α/2 = ${txt(f(al / 2))}`, an = g.measureText(et).width;
    if (!inf) { if (X(lo) - 8 - an >= mL) { g.textAlign = 'right'; g.fillText(et, X(lo) - 8, ya); } else { g.textAlign = 'left'; g.fillText(et, mL, ya - 18); } }
    if (!sup) { if (X(hi) + 8 + an <= w - mR) { g.textAlign = 'left'; g.fillText(et, X(hi) + 8, ya); } else { g.textAlign = 'right'; g.fillText(et, w - mR, ya - 18); } }
  }
  function simulacion() {
    const { g, w, h } = lienzo('#sim');
    if (!sim || !sol) return;
    const v = visibles(), hs = sim.hechos;
    const fin = hs.flat().concat(sim.real).filter(isFinite);
    let a = Math.min(...fin), b = Math.max(...fin);
    const pad = (b - a) * 0.05 || 1; a -= pad; b += pad;
    const mL = 12, mR = 12, mT = 22, mB = 26, X = (x) => mL + ((Math.max(a, Math.min(b, x)) - a) / (b - a)) * (w - mL - mR), paso = (h - mT - mB) / N;
    g.font = `11px ${FUENTE_UI}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    const p0 = (b - a) / 6, e = 10 ** Math.floor(Math.log10(p0)), st = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0);
    for (let x = Math.ceil(a / st) * st; x <= b; x += st) { g.beginPath(); g.moveTo(X(x), mT); g.lineTo(X(x), h - mB); g.stroke(); g.fillText(txt(f(Math.abs(x) < st * 1e-9 ? 0 : x)), X(x), h - mB + 6); }
    let dentro = 0;
    for (let i = 0; i < v; i++) {
      const [lo, hi, est] = hs[i], ok = lo <= sim.real && sim.real <= hi, y = mT + paso * (i + 0.5);
      if (ok) dentro++;
      g.strokeStyle = ok ? col['--ok'] : col['--mal']; g.lineWidth = Math.max(1, Math.min(2.2, paso * 0.6)); g.beginPath(); g.moveTo(X(lo), y); g.lineTo(X(hi), y); g.stroke();
      g.fillStyle = g.strokeStyle; g.fillRect(X(est) - 1, y - Math.max(1, paso * 0.4), 2, Math.max(2, paso * 0.8));
    }
    g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(sim.real), mT - 4); g.lineTo(X(sim.real), h - mB); g.stroke();
    g.fillStyle = col['--ink']; g.textBaseline = 'top'; g.font = `600 12px ${FUENTE_UI}`; g.fillText(`${sol.param.replace('μ_d', 'μd')} real = ${txt(f(sim.real, 5))}`, X(sim.real), 4);
    $('#cuenta').innerHTML = v ? `<b>${dentro} sur ${v}</b> intervalles contiennent la vraie valeur${v === N ? ` (on en attend environ ${Math.round(100 * sol.c)})` : ''}.` : '';
  }

  $('#otra').addEventListener('click', () => { nuevaSim(); if (sim) sim.t = 0; anda = true; $('#play').textContent = '⏸ Pause'; dibuja(); });
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Continuer'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sim && visibles() < N) { sim.t += dt; simulacion(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('intervalos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.IntervalosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, a: sol.a, b: sol.b, n: sol.n, k: sol.k }, estado: () => copia(sc), simulacion: () => sim && { real: sim.real, dentro: sim.hechos.filter(([a, b]) => a <= sim.real && sim.real <= b).length } };
})();

