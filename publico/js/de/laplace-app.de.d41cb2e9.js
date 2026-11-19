(() => {
  const { $, esc, copia } = Herramienta;
  const L = Laplace, CLAVE = 'laplace-v1';
  const fH = (x, d = 4) => L.f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const sup = (e) => [...e].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '−' ? '⁻' : c)).join('');
  const txt = (s) => s.replace(/<sup>(.*?)<\/sup>/g, (_, e) => sup(e)).replace(/<[^>]+>/g, '');
  const MODOS = {
    directa: { nom: 'Hintransformation: f(t) → F(s)', campos: [['f', 'f(t) =', 'Funktion von t']] },
    inversa: { nom: 'Rücktransformation: F(s) → f(t)', campos: [['F', 'F(s) =', 'Quotient von Polynomen in s']] },
    edo: { nom: 'Differentialgleichung mit y(0) und y′(0)', campos: [['a', 'a', 'Koeffizient von y″'], ['b', 'b', 'von y′'], ['c', 'c', 'von y'], ['g', 'g(t)', '0, wenn homogen'], ['y0', 'y(0)', ''], ['v0', 'y′(0)', '']] },
    convolucion: { nom: 'Faltung: (f * g)(t)', campos: [['f', 'f(t) =', ''], ['g', 'g(t) =', '']] },
    sistema: { nom: 'System: x′ = a₁₁x + a₁₂y + f, y′ = a₂₁x + a₂₂y + g', campos: [['a11', 'a₁₁', 'von x in x′'], ['a12', 'a₁₂', 'von y in x′'], ['f', 'f(t)', '0, falls keiner'], ['a21', 'a₂₁', 'von x in y′'], ['a22', 'a₂₂', 'von y in y′'], ['g', 'g(t)', '0, falls keiner'], ['x0', 'x(0)', ''], ['y0', 'y(0)', '']] },
  };
  const ANCHOS = ['f', 'F', 'g'];
  const primero = (m) => L.ejemplos.find((e) => e.sc.modo === m);

  let sc = copia(L.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS[g.modo]) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, V = null, anda = false, u = 1;

  function formulario() {
    $('#modo').innerHTML = Object.entries(MODOS).map(([k, m]) => `<option value="${k}"${sc.modo === k ? ' selected' : ''}>${m.nom}</option>`).join('');
    const uno = sc.modo === 'edo' && sc.orden === '1';
    let h = sc.modo === 'edo' ? `<label for="f-orden">Ordnung</label><select id="f-orden" class="in larga" data-c="orden"><option value="2"${uno ? '' : ' selected'}>Zweite Ordnung: a y″ + b y′ + c y = g(t)</option><option value="1"${uno ? ' selected' : ''}>Erste Ordnung: b y′ + c y = g(t)</option></select>` : '';
    h += MODOS[sc.modo].campos.filter(([k]) => !(uno && (k === 'a' || k === 'v0'))).map(([k, et, ay]) => `<label for="f-${k}">${et}${ay ? ` <small>(${ay})</small>` : ''}</label><input id="f-${k}" class="in${ANCHOS.includes(k) ? ' larga' : ''}" data-c="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`).join('');
    $('#campos').innerHTML = h;
    const saltos = 'Sprung u(t - a) (oder H(t - a)), Delta δ(t - a) und stückweise Funktionen: «t falls 0 ≤ t < 2; 4 - t falls 2 ≤ t < 4; 0 falls t ≥ 4».';
    $('#nota-datos').innerHTML = sc.modo === 'directa' ? `Summen von Termen der Form c·tⁿ·e^(at)·sin(bt) oder cos(bt), auch sinh, cosh und Produkte wie sin^2(t): 3t^2 + 2e^(-4t), t sin(2t), e^(-t) cos(3t)… ${saltos}`
      : sc.modo === 'inversa' ? 'Ein Quotient von Polynomen in s, faktorisiert oder nicht, der mit e^(-as) multipliziert sein kann: (3s + 7)/((s + 1)(s + 3)), 4/(s(s^2 + 4)), e^(-2s)/(s + 1), (1 - e^(-s))/s^2…'
        : sc.modo === 'convolucion' ? `Zwei Funktionen von t wie bei der Hintransformation: t, e^(-t), sin(t), u(t - 1)… Das Ergebnis ist (f * g)(t) = ∫₀ᵗ f(τ) g(t − τ) dτ.`
          : sc.modo === 'sistema' ? 'Zwei Gleichungen erster Ordnung mit konstanten Koeffizienten. f(t) und g(t) können 0, Polynome, Exponentialfunktionen, Sinus und Kosinus, Sprünge oder Deltas sein.'
            : `g(t) kann eine Summe von Polynomen, Exponentialfunktionen, Sinus und Kosinus sein: 4t, e^(-3t), sin(t), 2 + t e^(-t)… ${saltos}`;
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.c || t.tagName === 'SELECT') return; sc[t.dataset.c] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.dataset.c !== 'orden') return; sc.orden = t.value; if (t.value === '2' && !sc.a) sc.a = '1'; if (t.value === '2' && !sc.v0) sc.v0 = '0'; formulario(); cambia(); });
  $('#modo').addEventListener('change', (e) => { sc = copia(primero(e.target.value).sc); formulario(); cambia(); });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Beispiele…</option>' + Object.entries(MODOS).map(([k, m]) => `<optgroup label="${m.nom.split(':')[0].replace(/ con.*/, '')}">${L.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = L.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; };
    const sm = (a) => (a === 0 ? 's' : a > 0 ? `s + ${a}` : `s - ${-a}`);
    const k = (c, s, prim) => (c === 0 ? '' : `${c < 0 ? (prim ? '-' : ' - ') : prim ? '' : ' + '}${Math.abs(c) === 1 && s ? '' : Math.abs(c)}${s}`);
    const tipos = [
      () => ({ modo: 'directa', f: `${k(nz(-4, 5), `t^${ent(1, 3)}`, true)}${k(nz(-3, 3), `e^(${nz(-4, 3)}t)`)}${k(ent(-5, 5), '')}` }),
      () => ({ modo: 'directa', f: `${k(nz(-3, 4), `sen(${ent(1, 4)}t)`, true)}${k(ent(-3, 3), `cos(${ent(1, 4)}t)`)}` }),
      () => ({ modo: 'directa', f: `${['t ', ''][ent(0, 1)]}e^(${nz(-3, 2)}t) ${['sin', 'cos'][ent(0, 1)]}(${ent(1, 3)}t)` }),
      () => { const a = ent(0, 3); let b; do b = ent(1, 5); while (b === a); const A = nz(-4, 4), B = nz(-4, 4); return { modo: 'inversa', F: `(${k(A + B, 's', true)}${k(A * b + B * a, '')})/((${sm(a)})(${sm(b)}))` }; },
      () => { const a = ent(0, 3), A = nz(-3, 3), B = nz(-3, 3); return { modo: 'inversa', F: `(${k(A, 's', true)}${k(A * a + B, '')})/((${sm(a)})^2)` }; },
      () => { const al = ent(0, 3), be = ent(1, 4); return { modo: 'inversa', F: `(${k(nz(-3, 3), 's', true)}${k(ent(-6, 6), '')})/(s^2${k(2 * al, 's')}${k(al * al + be * be, '')})` }; },
      () => { let r1 = nz(-4, -1), r2 = nz(-4, -1); if (r1 === r2) r2 = r1 === -1 ? -2 : r1 + 1; return { modo: 'edo', orden: '2', a: '1', b: String(-(r1 + r2)), c: String(r1 * r2), g: ['0', String(ent(1, 6)), `e^(${nz(-5, 1)}t)`][ent(0, 2)], y0: String(ent(-2, 2)), v0: String(ent(-2, 2)) }; },
      () => { const al = ent(-2, 0), be = ent(1, 3); return { modo: 'edo', orden: '2', a: '1', b: String(-2 * al), c: String(al * al + be * be), g: ['0', String(ent(1, 5))][ent(0, 1)], y0: String(ent(0, 2)), v0: String(ent(0, 2)) }; },
      () => ({ modo: 'edo', orden: '1', a: '', b: '1', c: String(ent(1, 4)), g: [String(ent(1, 6)), `${ent(1, 4)}t`, `e^(${nz(-5, 2)}t)`][ent(0, 2)], y0: String(ent(-2, 3)), v0: '' }),
      () => ({ modo: 'directa', f: `${k(nz(-3, 4), `u(t - ${ent(1, 4)})`, true)}${k(nz(-3, 3), `(t - ${ent(1, 3)})u(t - ${ent(1, 3)})`)}`.replace(/\(t - (\d)\)u\(t - \d\)/, '(t - $1)u(t - $1)') }),
      () => { const a = ent(1, 4), b = ent(1, 3); return { modo: 'inversa', F: `${ent(1, 5)}e^(-${a}s)/(s(s + ${b}))` }; },
      () => ({ modo: 'convolucion', f: [`e^(${nz(-3, -1)}t)`, 't', `sen(${ent(1, 3)}t)`][ent(0, 2)], g: [`e^(${nz(-3, -1)}t)`, '1', `${ent(1, 3)}t`][ent(0, 2)] }),
      () => { const p = nz(-3, -1), q = ent(1, 2); return { modo: 'sistema', a11: String(p), a12: String(q), a21: String(q), a22: String(p), f: '0', g: '0', x0: String(ent(0, 2)), y0: String(ent(-1, 2)) }; },
    ];
    for (let i = 0; i < 20; i++) { sc = tipos[ent(0, tipos.length - 1)](); try { L.resolver(sc); break; } catch (e) { /* otro */ } }
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'directa') return `Berechne die Laplace-Transformierte von <b>f(t) = ${esc(sc.f)}</b> und gib ihren Wert bei s = ${sol ? sol.s1 : 1} an.`;
    if (sc.modo === 'inversa') return `Berechne durch Partialbruchzerlegung die Rücktransformierte von <b>F(s) = ${esc(sc.F)}</b> und gib f(1) und f(2) an.`;
    if (sc.modo === 'convolucion') return `Berechne mit der Laplace-Transformation die Faltung <b>(f * g)(t)</b> von f(t) = ${esc(sc.f)} und g(t) = ${esc(sc.g)} und gib ihren Wert bei t = 1 und t = 2 an.`;
    if (sc.modo === 'sistema') {
      const t2 = (p, q, f) => { const x = (v, l, pr) => { const n = Number(String(v).replace(',', '.')); return !n ? '' : `${n < 0 ? (pr ? '−' : ' − ') : pr ? '' : ' + '}${Math.abs(n) === 1 ? '' : String(Math.abs(n)).replace('.', ',')}${l}`; }; const r = `${x(p, 'x', true)}${x(q, 'y', !Number(String(p).replace(',', '.')))}`; return `${r || '0'}${f && String(f).trim() !== '0' ? ` + ${esc(f)}` : ''}`; };
      return `Löse mit der Laplace-Transformation das System <b>x′ = ${t2(sc.a11, sc.a12, sc.f)}</b>, <b>y′ = ${t2(sc.a21, sc.a22, sc.g)}</b> mit x(0) = ${esc(sc.x0)} und y(0) = ${esc(sc.y0)} und gib x(1) und y(1) an.`;
    }
    const t = (v, s, p) => { const x = Number(String(v).replace(',', '.')); return !x ? '' : `${x < 0 ? ' − ' : p ? '' : ' + '}${Math.abs(x) === 1 ? '' : String(Math.abs(x)).replace('.', ',')}${s}`; };
    const ec = sc.orden === '1' ? `${t(sc.b, 'y′', true)}${t(sc.c, 'y')}` : `${t(sc.a, 'y″', true)}${t(sc.b, 'y′')}${t(sc.c, 'y')}`;
    return `Löse mit der Laplace-Transformation <b>${ec} = ${esc(sc.g || '0')}</b> mit y(0) = ${esc(sc.y0)}${sc.orden === '1' ? '' : ` und y′(0) = ${esc(sc.v0)}`} und gib y(1) und y(2) an.`;
  };

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  const Fval = (sol, s) => (sol.Fval ? sol.Fval(s) : L.pVal(sol.F.n, s) / L.pVal(sol.F.d, s));
  function calcula() {
    const err = $('#error');
    try { sol = L.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#leyenda-s').textContent = '';
      dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '';
    if (sol.modo === 'directa') {
      sol.s1 = Math.max(0, Math.floor(isFinite(sol.conv) ? sol.conv : 0)) + 1;
      h += dato('Transformierte', M(`F(s) = ${sol.Ftxt}`), 'ancho');
      if (!sol.saltos && sol.ts.length > 1) h += dato('Mit gemeinsamem Nenner', M(`F(s) = ${sol.Ffact}`), 'ancho');
      h += dato('Existiert für', isFinite(sol.conv) ? M(`s > ${L.f(sol.conv)}`) : 'alle s');
      h += dato(`F(${sol.s1})`, fH(Fval(sol, sol.s1), 6), 'num');
    } else if (sol.modo === 'sistema') {
      h += dato('Lösung', M(`x(t) = ${sol.txt}`), 'ancho') + dato('', M(`y(t) = ${sol.txt2}`), 'ancho');
      h += dato('Transformierte', M(`X(s) = ${sol.Xtxt}`), 'ancho') + dato('', M(`Y(s) = ${sol.Ytxt}`), 'ancho');
      h += dato('x(1)', fH(sol.f(1), 6), 'num') + dato('y(1)', fH(sol.f2(1), 6), 'num');
    } else if (sol.modo === 'convolucion') {
      h += dato('Faltung', M(`(f * g)(t) = ${sol.txt}`), 'ancho');
      h += dato('Produkt der Transformierten', M(`F(s) G(s) = ${sol.Ffact}`), 'ancho');
      h += dato('(f * g)(1)', fH(sol.f(1), 6), 'num') + dato('(f * g)(2)', fH(sol.f(2), 6), 'num');
    } else {
      const y = sol.modo === 'edo' ? 'y' : 'f';
      h += dato(sol.modo === 'edo' ? 'Lösung' : 'Rücktransformierte', M(`${y}(t) = ${sol.txt}`), 'ancho');
      h += dato(sol.modo === 'edo' ? 'Transformierte der Lösung' : 'Partialbrüche', M(sol.modo === 'edo' ? `Y(s) = ${sol.Ffact}` : `F(s) = ${sol.frac}`), 'ancho');
      h += dato(`${y}(1)`, fH(sol.f(1), 6), 'num') + dato(`${y}(2)`, fH(sol.f(2), 6), 'num');
      if (sol.lim) h += dato(`${y}(0⁺)`, isFinite(sol.lim.ini) ? fH(sol.lim.ini) : '∞') + dato('Für t → ∞', sol.lim.fin === null ? 'strebt gegen keinen Wert' : fH(sol.lim.fin));
      if (sol.modo === 'edo') h += dato('Übertragungsfunktion', M(`H(s) = ${sol.Htxt}`), 'ancho') + dato('Impulsantwort', M(`h(t) = ${sol.htxt}`), 'ancho');
    }
    const ctl = !sol.saltos && (sol.modo === 'directa' || sol.modo === 'inversa') && sol.polos && sol.polos.length ? L.paraControl(sol.F) : null;
    if (ctl) { sol.estab = L.estabilidad(sol.polos); h += dato('Stabilität von F(s)', `<b>${sol.estab.estado === 'estable' ? 'Stabil' : sol.estab.estado === 'marginal' ? 'Grenzstabil' : 'Instabil'}</b> <small>${esc(sol.estab.txt.replace(/^[^:]*: /, ''))}</small>`, 'ancho'); }
    $('#resumen').innerHTML = h;
    { const ue = $('#usar-en'); ue.hidden = !ctl; ue.innerHTML = ctl ? `<a class="btn" data-usar="circuitos/control" href="${esc(Herramienta.enlaceA('circuitos/control', { modo: 'raices', num: ctl.num, den: ctl.den, K: '1' }))}">F(s) als offenen Regelkreis in Regelung verwenden →</a>` : ''; }
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    const gris = ventanaComp().length > 1 || sol.modo === 'convolucion';
    const quien = sol.modo === 'edo' ? 'y(t)' : sol.modo === 'sistema' ? 'x(t) und, in der zweiten Farbe, y(t)' : sol.modo === 'convolucion' ? '(f * g)(t)' : 'f(t)';
    $('#leyenda').innerHTML = `Farbig ${quien} ab t = 0${gris ? (sol.modo === 'convolucion' ? '; grau f(t) und g(t)' : '; grau jeder Term einzeln') : ''}${sol.deltas && sol.deltas.length ? '; die Pfeile sind Dirac-Deltas' : ''}. Mit ▶ Animieren durchläuft ein Punkt sie.`;
    $('#leyenda-s').innerHTML = `× Pole, ○ Nullstellen${sol.modo === 'directa' && isFinite(sol.conv) ? `; schattiert der Bereich Re(s) > ${fH(sol.conv)}, in dem F(s) existiert` : ''}. Pole mit negativem Realteil ergeben abklingende Terme; auf der imaginären Achse Schwingungen ohne Dämpfung; rechts wachsende Terme.`;
    V = null; if (!anda) u = 1; dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--z1', '--z2', '--z3']) col[c] = cs.getPropertyValue(c).trim(); }
  const marcas = Herramienta.marcas;
  const lienzo = (s) => Herramienta.lienzo(s);
  const rango = (vs, pad = 0.12, min = 1) => {
    const ok = vs.filter((v) => isFinite(v) && Math.abs(v) < 1e9);
    let a = Math.min(...ok), b = Math.max(...ok);
    if (!ok.length) { a = -1; b = 1; }
    if (b - a < 1e-9 * min) { a -= min; b += min; }
    const p = (b - a) * pad; return [a - p, b + p];
  };
  const evalT = (q) => (t) => q.c * t ** q.k * Math.exp(q.r * t) * (q.p === 'sin' ? Math.sin(q.w * t) : q.p === 'cos' ? Math.cos(q.w * t) : 1);
  function ventanaComp() {
    if (sol.modo === 'convolucion') return [sol.f1, sol.g1];
    const terms = sol.ts || sol.terms;
    if (sol.modo === 'sistema' || sol.saltos || (sol.piezas && sol.piezas.some((p) => p.a || p.d))) return [];
    return terms.length > 1 && terms.length <= 6 ? terms.map(evalT) : [];
  }
  function ventana() {
    const terms = sol.ts || sol.terms;
    let T = 0;
    for (const q of terms) {
      if (q.r < -1e-9) T = Math.max(T, 5 / -q.r + q.k / -q.r);
      if (q.r > 1e-9) T = Math.max(T, 3 / q.r);
      if (q.w > 1e-9) T = Math.max(T, (2.5 * 2 * Math.PI) / q.w);
    }
    const tope = Math.max(0, ...(sol.piezas || []).map((p) => p.a));
    T = Math.min(30, Math.max(2, T || 5));
    if (tope) T = Math.min(40, Math.max(T, tope * 1.6 + 2));
    const ts = [], ys = [], ys2 = [];
    for (let i = 0; i <= 800; i++) { const t = (T * i) / 800; ts.push(t); ys.push(sol.f(t)); if (sol.f2) ys2.push(sol.f2(t)); }
    const comp = ventanaComp().map((fn) => ts.map((t) => fn(t)));
    const ds = (sol.deltas || []).map((d) => d.c);
    const [y1, y2] = rango([...ys, ...ys2, ...comp.flat(), ...ds, 0], 0.12);
    return { x1: 0, x2: T, y1, y2, ts, ys, ys2, comp };
  }
  const mL = 44, mR = 12, mT = 12, mB = 26;
  function ejes(g, w, h, X, Y, W, etX, etY) {
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(W.x1, W.x2, Math.max(4, Math.round(w / 80)))) { g.beginPath(); g.moveTo(X(v), mT); g.lineTo(X(v), h - mB); g.stroke(); g.fillText(txt(fH(v, 3)), X(v), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(W.y1, W.y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(txt(fH(v, 3)), mL - 5, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath();
    if (W.y1 < 0 && W.y2 > 0) { g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); }
    if (W.x1 < 0 && W.x2 > 0) { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); }
    g.stroke();
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(etX, w - mR - 2, h - mB - 3);
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(etY, mL + 4, mT + 2);
  }
  const linea = (g, pts, X, Y) => { g.beginPath(); let dentro = false; for (const [x, y] of pts) { if (!isFinite(y) || !isFinite(x)) { dentro = false; continue; } const px = X(x), py = Y(y); if (dentro) g.lineTo(px, py); else g.moveTo(px, py); dentro = true; } g.stroke(); };
  function dibuja() { grafica(); plano(); }
  function grafica() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    if (!col['--ink']) colores();
    if (!V) V = ventana();
    const X = (x) => mL + ((x - V.x1) / (V.x2 - V.x1)) * (w - mL - mR), Y = (y) => mT + ((V.y2 - y) / (V.y2 - V.y1)) * (h - mT - mB);
    ejes(g, w, h, X, Y, V, 't', sol.modo === 'edo' ? 'y(t)' : sol.modo === 'sistema' ? 'x(t), y(t)' : sol.modo === 'convolucion' ? '(f * g)(t)' : 'f(t)');
    g.save(); g.beginPath(); g.rect(mL, mT, w - mL - mR, h - mT - mB); g.clip();
    const n = Math.round(u * (V.ts.length - 1));
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.55; g.lineWidth = 1.3; g.setLineDash([5, 4]);
    for (const c of V.comp) linea(g, V.ts.slice(0, n + 1).map((t, i) => [t, c[i]]), X, Y);
    g.setLineDash([]); g.globalAlpha = 1;
    g.strokeStyle = col['--ink']; g.globalAlpha = 0.18; g.lineWidth = 2.4; linea(g, V.ts.map((t, i) => [t, V.ys[i]]), X, Y); g.globalAlpha = 1;
    if (V.ys2.length) {
      g.strokeStyle = col['--z1']; g.globalAlpha = 0.18; g.lineWidth = 2.4; linea(g, V.ts.map((t, i) => [t, V.ys2[i]]), X, Y); g.globalAlpha = 1;
      g.lineWidth = 2.6; linea(g, V.ts.slice(0, n + 1).map((t, i) => [t, V.ys2[i]]), X, Y);
      if (isFinite(V.ys2[n])) { g.fillStyle = col['--z1']; g.beginPath(); g.arc(X(V.ts[n]), Y(V.ys2[n]), 5, 0, 2 * Math.PI); g.fill(); }
    }
    g.strokeStyle = col['--accent']; g.lineWidth = 2.6; linea(g, V.ts.slice(0, n + 1).map((t, i) => [t, V.ys[i]]), X, Y);
    if (isFinite(V.ys[n])) { g.fillStyle = col['--accent']; g.beginPath(); g.arc(X(V.ts[n]), Y(V.ys[n]), 5, 0, 2 * Math.PI); g.fill(); }
    g.strokeStyle = col['--accent']; g.fillStyle = col['--accent']; g.lineWidth = 2.2;
    for (const d of sol.deltas || []) {
      if (d.a > V.ts[n] + 1e-9) continue;
      const x = X(d.a), y0 = Y(0), y = Y(d.c), sg = Math.sign(y0 - y) || 1;
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y); g.stroke();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 8 * sg); g.lineTo(x + 5, y + 8 * sg); g.closePath(); g.fill();
    }
    g.restore();
  }
  function plano() {
    const { g, w, h } = lienzo('#plano');
    if (!sol) return;
    if (!col['--ink']) colores();
    const pts = [...sol.polos, ...sol.ceros].map((q) => q.p);
    let m = Math.max(1, ...pts.map((p) => Math.max(Math.abs(p.re), Math.abs(p.im)))) * 1.35;
    const W = { x1: -m, x2: m, y1: -m, y2: m };
    const aw = w - mL - mR, ah = h - mT - mB, esc2 = Math.min(aw / (W.x2 - W.x1), ah / (W.y2 - W.y1));
    W.x1 = -aw / esc2 / 2; W.x2 = aw / esc2 / 2; W.y1 = -ah / esc2 / 2; W.y2 = ah / esc2 / 2;
    const X = (x) => mL + ((x - W.x1) / (W.x2 - W.x1)) * aw, Y = (y) => mT + ((W.y2 - y) / (W.y2 - W.y1)) * ah;
    if (sol.modo === 'directa') { g.fillStyle = col['--accent-soft']; const x0 = Math.max(mL, Math.min(w - mR, X(sol.conv))); g.fillRect(x0, mT, w - mR - x0, ah); }
    ejes(g, w, h, X, Y, W, 'Re(s)', 'Im(s)');
    g.lineWidth = 2.4; g.strokeStyle = col['--z2'];
    for (const { p, m: mu } of sol.polos) {
      const x = X(p.re), y = Y(p.im), r = 6;
      g.beginPath(); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke();
      if (mu > 1) { g.fillStyle = col['--z2']; g.font = '600 11px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText(String(mu), x + r + 2, y - 3); }
    }
    g.strokeStyle = col['--z1']; g.lineWidth = 2;
    for (const { p, m: mu } of sol.ceros) {
      g.beginPath(); g.arc(X(p.re), Y(p.im), 5.5, 0, 2 * Math.PI); g.stroke();
      if (mu > 1) { g.fillStyle = col['--z1']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(String(mu), X(p.re) + 8, Y(p.im) + 3); }
    }
  }
  $('#animar').addEventListener('click', () => (anda ? para() : arranca()));
  function arranca() { if (!sol) return; anda = true; u = 0; $('#animar').textContent = '⏸ Anhalten'; }
  function para() { anda = false; u = 1; $('#animar').textContent = '▶ Animieren'; dibuja(); }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { u += dt / 4; if (u >= 1) { u = 1; anda = false; $('#animar').textContent = '▶ Animieren'; } grafica(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('laplace').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  Herramienta.exportar('#grafica', { nombre: 'transformada-de-laplace', titulo: 'Laplace-Transformation', etiqueta: 'f(t)' });
  Herramienta.exportar('#plano', { nombre: 'plano-s', titulo: 's-Ebene: Pole und Nullstellen', etiqueta: 'die s-Ebene' });
  window.LaplaceApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, txt: sol.txt ?? sol.Ftxt, F: sol.Ffact, f1: sol.f(1), f2: sol.f(2), polos: sol.polos.map((q) => [q.p.re, q.p.im, q.m]) }, estado: () => copia(sc) };
})();

