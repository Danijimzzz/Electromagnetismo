/* =====================================================================
   Modo guiado de la ley de Ampère (EM.MG-3): el alumno elige la simetría
   del problema y la curva amperiana, la dibuja con su tamaño y la
   herramienta comprueba si con ella se puede sacar B de la integral y
   por qué. Cinco casos: cilindro con corriente, cable coaxial, lámina
   indefinida, solenoide largo y toroide. El cálculo (Ampere.evalua) es
   puro y se prueba con require; Ampere.monta(contenedor) pone la interfaz
   en la página de Magnetostática. Unidades del SI; longitudes en cm.
   ===================================================================== */
const Ampere = (() => {
  const MU0 = 4e-7 * Math.PI;
  const cm = 1e-2;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) { const [m, e] = x.toExponential(d - 1).split('e'); return `${String(+m).replace('.', ',').replace('-', '−')}·10<sup>${(+e).toString().replace('-', '−')}</sup>`; }
    return String(+x.toPrecision(d)).replace('.', ',').replace('-', '−');
  };
  const num = (v, nombre, { positivo = true } = {}) => {
    const t = String(v ?? '').trim().replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
    const x = +t;
    if (t === '' || !isFinite(x)) throw new Error(`${nombre}: escribe un número`);
    if (positivo && !(x > 0)) throw new Error(`${nombre} debe ser mayor que 0`);
    return x;
  };

  const SIM = [
    ['cilindrica', 'Cilíndrica: B no depende ni de φ ni de z, solo de la distancia r al eje'],
    ['plana', 'Plana: B no cambia al moverse paralelo al plano, solo con la distancia a él'],
    ['esferica', 'Esférica: B solo depende de la distancia al centro'],
    ['ninguna', 'Ninguna: no hay simetría que ayude'],
  ];
  const CURVAS = {
    circulo: 'Circunferencia coaxial con el eje, de radio r',
    desc: 'Circunferencia que no rodea el eje por el centro',
    rect: 'Rectángulo con dos lados paralelos a la corriente, uno a cada lado',
    cualquiera: 'Una curva cerrada cualquiera que rodee la corriente',
  };
  const POR_QUE = {
    cualquiera: 'La ley de Ampère vale para cualquier curva cerrada, pero para sacar B de la integral hace falta que B sea constante y paralelo a dl en toda la curva (o que el producto escalar sea 0). Con una curva arbitraria B cambia de módulo y de ángulo con dl y la integral no se puede despejar.',
    desc: 'Si la circunferencia no es coaxial, la distancia al eje cambia a lo largo de ella: B no es constante sobre la curva y no se puede sacar fuera de la integral.',
  };

  /* Cada caso: simetría correcta, curva correcta y los campos que pide (clave, nombre, unidad, valor por defecto).
     calc(p, q) → { Ienc, B, circ (circulación), pasos: [html], dibujo } con p = datos y q = curva, todo en SI. */
  const CASOS = {
    cilindro: {
      nombre: 'Cilindro largo con corriente uniforme', sim: 'cilindrica', curva: 'circulo',
      datos: [['I', 'Corriente total I', 'A', '10'], ['a', 'Radio del cilindro a', 'cm', '2']], curvaCampos: [['r', 'Radio de la curva r', 'cm', '1']],
      aviso: 'Los cilindros largos y los hilos tienen la misma simetría: por cada punto, B es tangente a la circunferencia que rodea el eje.',
      calc: (p, q) => {
        const { I, a } = p, r = q.r, Ienc = r < a ? (I * r * r) / (a * a) : I, B = (MU0 * Ienc) / (2 * Math.PI * r);
        return { Ienc, B, circ: B * 2 * Math.PI * r, region: r < a ? 'dentro del cilindro' : 'fuera del cilindro', JI: r < a ? `$I_{enc} = J π r^2 = I r^2/a^2$ = ${f(Ienc)} A, porque solo atraviesa la curva la parte de la corriente que cae dentro del radio r.` : `$I_{enc} = I$ = ${f(Ienc)} A: la curva rodea toda la corriente.` };
      },
      geom: (p, q) => ({ tipo: 'cilindro', a: p.a, r: q.r, Rmax: Math.max(p.a, q.r) * 1.5 }),
    },
    coaxial: {
      nombre: 'Cable coaxial (ida por dentro, vuelta por fuera)', sim: 'cilindrica', curva: 'circulo',
      datos: [['I', 'Corriente I', 'A', '10'], ['a', 'Radio del conductor interior a', 'cm', '1'], ['b', 'Radio interior de la malla b', 'cm', '3'], ['c', 'Radio exterior de la malla c', 'cm', '4']], curvaCampos: [['r', 'Radio de la curva r', 'cm', '2']],
      aviso: 'La corriente de vuelta, repartida de forma uniforme en la malla, mantiene la simetría cilíndrica, y por eso sirve la circunferencia coaxial.',
      valida: (p) => { if (!(p.b > p.a) || !(p.c > p.b)) throw new Error('Los radios deben cumplir a < b < c'); },
      calc: (p, q) => {
        const { I, a, b, c } = p, r = q.r;
        const Ienc = r < a ? (I * r * r) / (a * a) : r < b ? I : r < c ? I * (1 - (r * r - b * b) / (c * c - b * b)) : 0, B = (MU0 * Ienc) / (2 * Math.PI * r);
        const region = r < a ? 'dentro del conductor interior' : r < b ? 'entre los conductores' : r < c ? 'dentro de la malla' : 'fuera del cable';
        const JI = r < a ? `$I_{enc} = I r^2/a^2$ = ${f(Ienc)} A.` : r < b ? `$I_{enc} = I$ = ${f(Ienc)} A: solo rodea el conductor interior.` : r < c ? `$I_{enc} = I − I {r^2 − b^2}/{c^2 − b^2}$ = ${f(Ienc)} A: a la corriente de ida se le resta la parte de la vuelta que ya está dentro de la curva.` : `$I_{enc} = I − I = 0$: ida y vuelta se compensan y no hay campo fuera.`;
        return { Ienc, B, circ: B * 2 * Math.PI * r, region, JI };
      },
      geom: (p, q) => ({ tipo: 'coaxial', a: p.a, b: p.b, c: p.c, r: q.r, Rmax: Math.max(p.c, q.r) * 1.25 }),
    },
    lamina: {
      nombre: 'Lámina de corriente indefinida', sim: 'plana', curva: 'rect',
      datos: [['K', 'Densidad superficial K', 'A/m', '50']], curvaCampos: [['L', 'Lado paralelo a la lámina L', 'cm', '10'], ['h', 'Distancia de cada lado a la lámina h', 'cm', '5']],
      aviso: 'Por simetría B es paralelo a la lámina y perpendicular a K, con sentidos opuestos a un lado y a otro; no depende de la distancia.',
      calc: (p, q) => {
        const { K } = p, { L, h } = q, Ienc = K * L, B = (MU0 * K) / 2;
        return { Ienc, B, circ: 2 * B * L, region: `a ${f(h / cm)} cm de la lámina`, JI: `$I_{enc} = K L$ = ${f(Ienc)} A: la lámina atraviesa el rectángulo en una longitud L. Los lados perpendiculares a la lámina no aportan, porque B es perpendicular a ellos (B·dl = 0), y los dos lados largos dan $B L$ cada uno.`, lado: `La circulación es $2 B L$ = ${f(2 * B * L)} T·m, y no depende de h: el campo es uniforme a cada lado.` };
      },
      geom: (p, q) => ({ tipo: 'lamina', L: q.L, h: q.h }),
    },
    solenoide: {
      nombre: 'Solenoide largo', sim: 'cilindrica', curva: 'rect',
      datos: [['n', 'Espiras por metro n', '1/m', '2000'], ['I', 'Corriente I', 'A', '2'], ['R', 'Radio del solenoide R', 'cm', '2']], curvaCampos: [['L', 'Lado paralelo al eje L', 'cm', '10']],
      aviso: 'Dentro, B es axial y uniforme; fuera es nulo en el ideal. Un rectángulo con un lado dentro y otro fuera deja B fuera de la integral.',
      calc: (p, q) => {
        const { n, I } = p, L = q.L, Ienc = n * L * I, B = MU0 * n * I;
        return { Ienc, B, circ: B * L, region: 'dentro del solenoide', JI: `$I_{enc} = n L I$ = ${f(Ienc)} A: la curva corta N = nL espiras, cada una con corriente I. De los cuatro lados, solo el que va por dentro aporta: los dos transversales son perpendiculares a B (o están fuera, donde B = 0) y el lado de fuera lleva B = 0.` };
      },
      geom: (p, q) => ({ tipo: 'solenoide', L: q.L, R: p.R }),
    },
    toroide: {
      nombre: 'Toroide', sim: 'cilindrica', curva: 'circulo',
      datos: [['N', 'Espiras N', '', '500'], ['I', 'Corriente I', 'A', '1'], ['a', 'Radio interior a', 'cm', '5'], ['b', 'Radio exterior b', 'cm', '8']], curvaCampos: [['r', 'Radio de la curva r', 'cm', '6.5']],
      aviso: 'La simetría es la de rotación alrededor del eje del toroide: B es tangente a las circunferencias coaxiales con él.',
      valida: (p) => { if (!(p.b > p.a)) throw new Error('El radio exterior b debe ser mayor que el interior a'); },
      calc: (p, q) => {
        const { N, I, a, b } = p, r = q.r, dentro = r > a && r < b, Ienc = dentro ? N * I : 0, B = (MU0 * Ienc) / (2 * Math.PI * r);
        return { Ienc, B, circ: B * 2 * Math.PI * r, region: dentro ? 'dentro del núcleo' : r <= a ? 'en el hueco central' : 'fuera del toroide', JI: dentro ? `$I_{enc} = N I$ = ${f(Ienc)} A: la curva atraviesa las N espiras.` : r <= a ? `$I_{enc} = 0$: dentro del hueco no pasa ninguna espira.` : `$I_{enc} = 0$: cada espira atraviesa la curva dos veces, una en cada sentido, y su aportación se anula.` };
      },
      geom: (p, q) => ({ tipo: 'toroide', a: p.a, b: p.b, r: q.r }),
    },
  };

  const campoSI = (lista, v, u) => Object.fromEntries(lista.map(([k, nom, un]) => [k, num(v[k], nom) * (un === 'cm' ? cm : 1)]));

  // st: { caso, sim, curva, d: {datos}, q: {curva} } → { ok, simOk, curvaOk, mensajes, res }
  function evalua(st) {
    const C = CASOS[st.caso]; if (!C) throw new Error('Elige un caso');
    const p = campoSI(C.datos, st.d || {}), q = campoSI(C.curvaCampos, st.q || {});
    if (C.valida) C.valida(p);
    const simOk = st.sim === C.sim, curvaOk = st.curva === C.curva, mensajes = [];
    if (!st.sim) mensajes.push('Elige primero qué simetría tiene el problema.');
    else if (!simOk) mensajes.push(st.sim === 'ninguna' ? 'Sí hay una simetría que ayuda: ' + C.aviso : 'Esa no es la simetría de este problema. ' + C.aviso);
    else mensajes.push('Correcto. ' + C.aviso);
    if (st.sim) {
      if (!st.curva) mensajes.push('Ahora elige la curva amperiana.');
      else if (!curvaOk) mensajes.push(POR_QUE[st.curva] || (st.curva === 'circulo' ? 'La circunferencia coaxial no sirve aquí: el campo no es tangente a ella ni constante, porque ' + (C.curva === 'rect' ? 'las líneas de B son rectas paralelas al plano o al eje, no círculos.' : 'no coincide con la forma de las líneas de campo.') : st.curva === 'rect' ? 'El rectángulo no encaja con las líneas de campo circulares: B no es paralelo ni perpendicular a sus lados.' : 'No es la curva adecuada.'));
      else mensajes.push('Correcto: en toda esta curva B es constante y paralelo a dl (o perpendicular, y no aporta).');
    }
    const res = simOk && curvaOk ? C.calc(p, q) : null;
    return { C, p, q, simOk, curvaOk, mensajes, res, geom: C.geom(p, q) };
  }

  function pasos(e) {
    const r = e.res, tipo = e.geom.tipo, rect = e.C.curva === 'rect';
    const lista = [
      `Ley de Ampère: $∮ B · dl = μ_0 I_{enc}$.`,
      rect ? `Con el rectángulo, la circulación es $∮ B · dl = B ${tipo === 'lamina' ? '· 2L' : '· L'}$ = ${f(r.circ)} T·m.${r.lado ? ' ' + r.lado : ''}` : `Sobre la circunferencia B es tangente y de módulo constante, así que $∮ B · dl = B · 2π r$ = ${f(r.circ)} T·m.`,
      `Corriente que atraviesa la curva (${r.region}): ${r.JI}`,
      `Despejamos: $B = {μ_0 I_{enc}}/{${rect ? (tipo === 'solenoide' ? 'L' : '2L') : '2π r'}}$ = <b>${f(r.B)} T</b>${r.B === 0 ? ' (el campo es nulo en esa región)' : ''}.`,
    ];
    return lista;
  }

  /* ---------- Dibujo (SVG, colores con variables CSS) ---------- */
  function dibujo(e) {
    const g = e.geom, W = 360, H = 240, cx = W / 2, cy = H / 2, S = (c, ...a) => `<${c} ${a.join(' ')}/>`;
    const acento = 'stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="7 4" fill="var(--accent-soft)"', cobre = 'fill="var(--cobre)" fill-opacity=".55"';
    let s = '';
    const cruces = (n, x0, x1, y, sim = '⊙') => Array.from({ length: n }, (_, i) => `<text x="${x0 + ((x1 - x0) * (i + 0.5)) / n}" y="${y}" text-anchor="middle" font-size="13" fill="var(--ink)">${sim}</text>`).join('');
    if (g.tipo === 'cilindro' || g.tipo === 'coaxial') {
      const k = Math.min(W, H) / 2 * 0.92 / g.Rmax;
      if (g.tipo === 'cilindro') s += S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.a * k}"`, cobre, 'stroke="var(--cobre)"') + `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="13" fill="var(--ink)">⊙ I</text>`;
      else s += S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.c * k}"`, 'fill="var(--neg)" fill-opacity=".25"', 'stroke="var(--neg)"') + S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.b * k}"`, 'fill="var(--panel)"', 'stroke="var(--neg)"') + S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.a * k}"`, cobre, 'stroke="var(--cobre)"') + `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="var(--ink)">⊙</text><text x="${cx + (g.b + g.c) / 2 * k}" y="${cy + 4}" text-anchor="middle" font-size="12" fill="var(--ink)">⊗</text>`;
      s += S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.r * k}"`, acento, 'fill-opacity=".18"') + `<text x="${cx + g.r * k * 0.71 + 6}" y="${cy - g.r * k * 0.71 - 4}" font-size="12" fill="var(--accent)">curva r</text>`;
    } else if (g.tipo === 'toroide') {
      const k = (Math.min(W, H) / 2) * 0.92 / g.b;
      s += S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.b * k}"`, 'fill="var(--nucleo)"', 'stroke="var(--cobre)" stroke-width="2"') + S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.a * k}"`, 'fill="var(--panel)"', 'stroke="var(--cobre)" stroke-width="2"') + S('circle', `cx="${cx}"`, `cy="${cy}"`, `r="${g.r * k}"`, acento, 'fill-opacity="0"');
    } else if (g.tipo === 'lamina') {
      const w = 260, alto = Math.max(34, Math.min(70, 70 * (g.h / (g.h + g.L))));
      s += `<rect x="${cx - w / 2}" y="${cy - 5}" width="${w}" height="10" ${cobre}/>` + cruces(10, cx - w / 2, cx + w / 2, cy + 4, '⊗') + S('rect', `x="${cx - 75}"`, `y="${cy - alto}"`, `width="150"`, `height="${2 * alto}"`, acento, 'fill-opacity=".15"') + `<text x="${cx}" y="${cy - alto - 6}" text-anchor="middle" font-size="12" fill="var(--accent)">curva (lado L paralelo a la lámina)</text>`;
    } else if (g.tipo === 'solenoide') {
      const w = 280, hh = 54, ancho = 150;
      s += Array.from({ length: 14 }, (_, i) => `<ellipse cx="${cx - w / 2 + (w * (i + 0.5)) / 14}" cy="${cy}" rx="4" ry="${hh}" fill="none" stroke="var(--cobre)" stroke-width="2"/>`).join('') + S('rect', `x="${cx - ancho / 2}"`, `y="${cy - hh * 0.5}"`, `width="${ancho}"`, `height="${hh * 1.5}"`, acento, 'fill-opacity=".15"') + `<text x="${cx}" y="${cy - hh - 6}" text-anchor="middle" font-size="12" fill="var(--accent)">lado de longitud L dentro; el de fuera, con B = 0</text>`;
    }
    return `<svg class="perfil" viewBox="0 0 ${W} ${H}" role="img" aria-label="Sección con la curva amperiana dibujada con línea discontinua" style="max-width:420px">${s}</svg>`;
  }

  /* ---------- Interfaz ---------- */
  function monta(cont) {
    let st = { caso: 'cilindro', sim: '', curva: '', d: {}, q: {} };
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const defecto = () => { const C = CASOS[st.caso]; st.d = Object.fromEntries(C.datos.map(([k, , , v]) => [k, v])); st.q = Object.fromEntries(C.curvaCampos.map(([k, , , v]) => [k, v])); st.sim = ''; st.curva = ''; };
    defecto();
    const campo = (k, nom, un, grupo) => `<label for="am-${grupo}-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input class="in" id="am-${grupo}-${k}" data-g="${grupo}" data-k="${k}" value="${esc(st[grupo][k] ?? '')}" inputmode="decimal" autocomplete="off">`;
    const radios = (nombre, lista, v) => lista.map(([k, t]) => `<label class="am-op"><input type="radio" name="am-${nombre}" value="${k}"${v === k ? ' checked' : ''}> ${t}</label>`).join('');
    function pinta() {
      const C = CASOS[st.caso];
      let h = `<div class="am-grid"><div class="am-col"><label for="am-caso">Problema</label><select id="am-caso" class="in">${Object.entries(CASOS).map(([k, c]) => `<option value="${k}"${k === st.caso ? ' selected' : ''}>${c.nombre}</option>`).join('')}</select>`;
      h += `<div class="am-sep">Datos</div><div class="am-campos">${C.datos.map(([k, n, u]) => campo(k, n, u, 'd')).join('')}</div>`;
      h += `<div class="am-sep">1. ¿Qué simetría tiene?</div><div class="am-radios" role="radiogroup" aria-label="Simetría">${radios('sim', SIM, st.sim)}</div>`;
      h += `<div class="am-sep">2. ¿Qué curva amperiana eliges?</div><div class="am-radios" role="radiogroup" aria-label="Curva amperiana">${radios('curva', Object.entries(CURVAS), st.curva)}</div>`;
      h += `<div class="am-sep">3. Tamaño de la curva</div><div class="am-campos">${C.curvaCampos.map(([k, n, u]) => campo(k, n, u, 'q')).join('')}</div></div>`;
      h += `<div class="am-col"><div id="am-dib"></div><div id="am-msg" aria-live="polite"></div><div id="am-res"></div></div></div>`;
      cont.innerHTML = h; resultado();
    }
    function resultado() {
      const msg = cont.querySelector('#am-msg'), res = cont.querySelector('#am-res'), dib = cont.querySelector('#am-dib');
      let e;
      try { e = evalua(st); } catch (er) { msg.innerHTML = `<p class="error">${esc(er.message)}</p>`; res.innerHTML = ''; dib.innerHTML = ''; return; }
      dib.innerHTML = dibujo(e);
      msg.innerHTML = e.mensajes.map((m, i) => `<p class="am-m ${i === 0 ? (e.simOk ? 'ok' : st.sim ? 'mal' : '') : (e.curvaOk ? 'ok' : st.curva ? 'mal' : '')}">${m}</p>`).join('');
      if (!e.res) { res.innerHTML = ''; return; }
      const r = e.res, html = pasos(e).map((t) => `<li>${typeof Mates !== 'undefined' ? Mates.html(t, true) : t}</li>`).join('');
      res.innerHTML = `<div class="am-resumen"><div><span>I<sub>enc</sub></span><b>${f(r.Ienc)} A</b></div><div><span>Circulación ∮B·dl</span><b>${f(r.circ)} T·m</b></div><div><span>Campo B</span><b>${f(r.B)} T</b></div></div><ol class="am-pasos">${html}</ol>`;
    }
    cont.addEventListener('input', (ev) => { const t = ev.target; if (t.dataset.g) { st[t.dataset.g][t.dataset.k] = t.value; resultado(); } });
    cont.addEventListener('change', (ev) => {
      const t = ev.target;
      if (t.id === 'am-caso') { st.caso = t.value; defecto(); pinta(); }
      else if (t.name === 'am-sim') { st.sim = t.value; resultado(); }
      else if (t.name === 'am-curva') { st.curva = t.value; resultado(); }
    });
    pinta();
    return { estado: () => JSON.parse(JSON.stringify(st)), poner: (o) => { st = { ...st, ...o }; pinta(); }, evalua: () => evalua(st) };
  }

  return { CASOS, SIM, CURVAS, evalua, pasos, monta, MU0 };
})();
if (typeof module !== 'undefined') module.exports = Ampere;
