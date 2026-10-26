/* =====================================================================
   Gases ideales: interfaz (modo, datos, lista de transformaciones,
   diagrama P-V, curva de Maxwell o de Van der Waals, caja con partículas
   animadas, modo práctica con enunciado y desarrollo). El cálculo está en
   gases/fisica.js (Gases).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const G = Gases, f = G.f, CLAVE = 'gases-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['estado', 'Ecuación de estado PV = nRT'], ['procesos', 'Transformaciones y ciclos'], ['mezcla', 'Mezcla de gases (Dalton)'], ['real', 'Gas real (Van der Waals)'], ['cinetica', 'Teoría cinética']];
  const TIPOS = [['isoterma', 'Isoterma'], ['isobara', 'Isobara'], ['isocora', 'Isocora'], ['adiabatica', 'Adiabática']];
  const PERMITIDOS = { isoterma: ['V', 'P'], isobara: ['V', 'T'], isocora: ['P', 'T'], adiabatica: ['V', 'P', 'T'] };

  let sc = copia(G.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  /* ---------- Formulario ---------- */
  const unP = () => txt((G.UP[sc.uP] || G.UP.atm)[1]), unV = () => txt((G.UV[sc.uV] || G.UV.L)[1]).replace('^3', '³'), unT = () => (sc.uT === 'C' ? '°C' : 'K');
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (v, lista) => lista.map(([k, t]) => `<option value="${k}"${v === k ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(sc[k], lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const unidades = () => elige('uP', 'Unidad de presión', Object.entries(G.UP).map(([k, [, t]]) => [k, t])) + elige('uV', 'Unidad de volumen', Object.entries(G.UV).map(([k, [, t]]) => [k, txt(t).replace('^3', '³')])) + elige('uT', 'Temperatura en', [['K', 'kelvin (K)'], ['C', 'grados Celsius (°C)']]);
  const cuatro = () => fila('P', 'Presión P', unP()) + fila('V', 'Volumen V', unV()) + fila('T', 'Temperatura T', unT()) + fila('n', 'Moles n', 'mol');
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    if (sc.modo === 'estado') {
      h += unidades() + sep('Tres de los cuatro (deja vacío el que buscas)') + cuatro() + sep('O los moles a partir de la masa') + fila('m', 'Masa m', 'g') + fila('M', 'Masa molar M', 'g/mol');
      $('#nota').textContent = 'Si das la masa molar también se calcula la densidad del gas.';
    } else if (sc.modo === 'procesos') {
      h += elige('gas', 'Gas', Object.entries(G.GASES).map(([k, g]) => [k, g.nombre])) + unidades() + sep('Estado A: tres de los cuatro') + cuatro() + sep('Transformaciones');
      h += `<div class="tramos">${(sc.procesos || []).map((p, i) => {
        const de = String.fromCharCode(65 + i), cierra = String(p.valor).trim().toUpperCase() === 'A', a = cierra ? 'A' : String.fromCharCode(66 + i);
        const un = { P: unP(), V: unV(), T: unT() };
        return `<div class="tramo"><b>${de}→${a}</b><select class="in" data-i="${i}" data-c="tipo" aria-label="Tipo del tramo ${de}">${opciones(p.tipo, TIPOS)}</select><select class="in" data-i="${i}" data-c="dato" aria-label="Dato final del tramo ${de}">${opciones(p.dato, PERMITIDOS[p.tipo].map((k) => [k, `${k}${a}`]))}</select><input class="in" data-i="${i}" data-c="valor" value="${esc(p.valor)}" placeholder="${un[p.dato]}" inputmode="decimal" autocomplete="off" aria-label="Valor del tramo ${de}"><button class="btn" type="button" data-quita="${i}" aria-label="Quitar el tramo ${de}">✕</button></div>`;
      }).join('')}</div><div class="botones"><button class="btn" type="button" data-add="1">+ Añadir transformación</button></div>`;
      $('#nota').textContent = 'Cada tramo parte del estado anterior; das un dato del estado final. Escribe A como valor para volver al estado A y cerrar el ciclo.';
    } else if (sc.modo === 'mezcla') {
      const gasesL = Object.entries(G.MOLECULAS).map(([k, [t]]) => [k, t]);
      h += fila('T', 'Temperatura', 'K') + fila('V', 'Volumen del recipiente', 'L') + elige('cant', 'Cantidad de cada gas en', [['n', 'moles'], ['m', 'gramos']]);
      for (let i = 1; i <= 3; i++) h += sep(`Gas ${i}${i === 3 ? ' (opcional)' : ''}`) + elige(`g${i}`, 'Gas', gasesL) + fila(`c${i}`, 'Cantidad', sc.cant === 'm' ? 'g' : 'mol');
      $('#nota').textContent = 'Cada gas ocupa todo el recipiente: su presión parcial es la que tendría él solo. Deja vacía la cantidad del tercero si solo hay dos.';
    } else if (sc.modo === 'real') {
      h += elige('gasR', 'Gas', [...Object.entries(G.VDW).map(([k, [t]]) => [k, t]), ['otra', 'Otro (escribe a y b)']]);
      if (sc.gasR === 'otra') h += fila('a', 'Constante a', 'Pa·m⁶/mol²') + fila('b', 'Constante b', 'm³/mol');
      h += fila('n', 'Moles n', 'mol') + fila('V', 'Volumen V', 'L') + fila('T', 'Temperatura T', 'K');
      $('#nota').textContent = 'Las constantes a y b de los gases de la lista están en el SI. Compara con el gas ideal: a volúmenes pequeños la diferencia es grande.';
    } else {
      h += elige('molecula', 'Gas', [...Object.entries(G.MOLECULAS).map(([k, [t, M]]) => [k, `${t} (${String(M).replace('.', ',')} g/mol)`]), ['otra', 'Otro (escribe M)']]);
      if (sc.molecula === 'otra') h += fila('M', 'Masa molar M', 'g/mol');
      h += elige('uT', 'Temperatura en', [['K', 'kelvin (K)'], ['C', 'grados Celsius (°C)']]) + fila('T', 'Temperatura T', unT()) + sep('Opcional') + fila('n', 'Moles n', 'mol') + fila('P', 'Presión (para el recorrido libre medio)', 'atm') + fila('d', 'Diámetro de la molécula', 'pm');
      $('#nota').textContent = 'M se pasa a kg/mol para usar R en el SI. Con la presión sale el recorrido libre medio; si no das el diámetro se usa el típico de cada gas.';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => {
    const t = e.target;
    if (t.tagName !== 'INPUT') return;
    if (t.dataset.c) sc.procesos[+t.dataset.i][t.dataset.c] = t.value; else sc[t.dataset.k] = t.value;
    $('#ejemplos').value = ''; calcula();
    // la etiqueta del tramo cambia al escribir A
    if (t.dataset.c === 'valor') { const b = t.parentNode.querySelector('b'), i = +t.dataset.i; b.textContent = `${String.fromCharCode(65 + i)}→${t.value.trim().toUpperCase() === 'A' ? 'A' : String.fromCharCode(66 + i)}`; }
  });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    if (t.dataset.c) {
      const p = sc.procesos[+t.dataset.i]; p[t.dataset.c] = t.value;
      if (t.dataset.c === 'tipo' && !PERMITIDOS[p.tipo].includes(p.dato)) p.dato = PERMITIDOS[p.tipo][0];
    } else {
      sc[t.dataset.k] = t.value;
      if (t.dataset.k === 'modo') sc = copia(G.ejemplos.find((x) => x.sc.modo === t.value).sc);
    }
    $('#ejemplos').value = ''; formulario(); calcula();
  });
  $('#campos').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.add) sc.procesos.push({ tipo: 'isoterma', dato: 'V', valor: '' });
    else if (b.dataset.quita !== undefined) sc.procesos.splice(+b.dataset.quita, 1);
    else return;
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + G.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = G.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const vP = (P) => `${f(P / sol.u.P[0])} ${sol.u.P[1]}`, vV = (V) => `${f(V / sol.u.V[0])} ${sol.u.V[1]}`;
  function calcula() {
    const err = $('#error');
    try { sol = G.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'estado') {
      h = dato('Presión', `P = <b>${vP(sol.P)}</b>`) + dato('Volumen', `V = <b>${vV(sol.V)}</b>`) + dato('Temperatura', `T = <b>${f(sol.T, 5)} K</b> (${f(sol.T - 273.15)} °C)`) + dato('Moles', `n = <b>${f(sol.n)} mol</b>`) + (sol.rho ? dato('Densidad', `ρ = ${f(sol.rho)} kg/m<sup>3</sup>`) : '');
      ley = 'El estado del gas en el diagrama P-V, sobre su isoterma (hipérbola PV = nRT).';
    } else if (sol.modo === 'procesos') {
      if (sol.ciclo) h = dato('Trabajo neto', `W = <b>${f(sol.Wt)} J</b>`) + dato('Calor absorbido', `Q<sub>abs</sub> = ${f(sol.Qabs)} J`) + (sol.rend !== null ? dato('Rendimiento', `η = <b>${f(100 * sol.rend, 3)} %</b>`) : '');
      else h = dato('Trabajo del gas', `W = <b>${f(sol.Wt)} J</b>`) + dato('Calor', `Q = <b>${f(sol.Qt)} J</b>`) + dato('Energía interna', `ΔU = <b>${f(sol.Ut)} J</b>`);
      const fin = sol.est[sol.est.length - 1], L = sol.ciclo ? String.fromCharCode(64 + sol.est.length - 1) : String.fromCharCode(64 + sol.est.length);
      if (!sol.ciclo) h += dato(`Estado final ${L}`, `${vP(fin.P)}, ${vV(fin.V)}, ${f(fin.T, 5)} K`);
      ley = (sol.ciclo ? `Ciclo en el diagrama P-V; el área encerrada es el trabajo neto${sol.Wt > 0 ? ' (sentido horario: motor)' : ' (sentido antihorario: frigorífico)'}. En gris, las isotermas de T máxima y mínima.` : 'Transformaciones en el diagrama P-V. En gris, las isotermas de los estados inicial y final.') + ' Colores: verde isoterma, azul isobara, naranja isocora y morado adiabática.';
    } else if (sol.modo === 'mezcla') {
      h = dato('Presión total', `P = <b>${f(sol.Pt)} Pa</b> (${f(sol.Pt / 101325)} atm)`) + sol.comp.map((c) => dato(`Presión parcial de ${c.nombre}`, `<b>${f(c.P)} Pa</b> (x = ${f(c.x)})`)).join('') + dato('Masa molar media', `M̄ = ${f(sol.Mm)} g/mol`);
      ley = 'Las barras son la presión parcial de cada gas: juntas suman la total. Abajo, las moléculas de cada gas en la caja.';
    } else if (sol.modo === 'real') {
      h = dato('Presión (Van der Waals)', `P = <b>${f(sol.P)} Pa</b> (${f(sol.P / 101325)} atm)`) + dato('Presión si fuera ideal', `P = ${f(sol.Pi)} Pa`) + dato('Factor de compresibilidad', `Z = <b>${f(sol.Z)}</b>`) + dato('Temperatura crítica', `T<sub>c</sub> = ${f(sol.Tc)} K`);
      ley = 'Isoterma de Van der Waals (color) frente a la del gas ideal (gris) a la misma temperatura, con el estado marcado. En gris discontinuo, la isoterma crítica.';
    } else {
      h = dato('Velocidad cuadrática media', `v<sub>cm</sub> = <b>${f(sol.vrms)} m/s</b>`) + dato('Velocidad media', `v̄ = ${f(sol.vmed)} m/s`) + dato('Más probable', `v<sub>p</sub> = ${f(sol.vp)} m/s`) + dato('Energía cinética media', `⟨E<sub>c</sub>⟩ = ${f(sol.Ec)} J`) + (sol.lam ? dato('Recorrido libre medio', `λ = <b>${f(sol.lam * 1e9)} nm</b>`) + dato('Choques por segundo', `z = ${f(sol.z)} s<sup>−1</sup>`) : '');
      ley = `Distribución de Maxwell de las velocidades a ${txt(f(sol.T, 5))} K; en gris, la del mismo gas al doble de temperatura. Abajo, moléculas que se mueven con esas velocidades (más claras las rápidas).`;
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#caja').hidden = !['estado', 'cinetica', 'mezcla'].includes(sol.modo);
    particulas = null; dibuja();
  }

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--fuerza', '--cuerpo']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  const paso = (max) => { const e = 10 ** Math.floor(Math.log10(max / 4)), r = max / 4 / e; return e * (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10); };
  const num = (x) => txt(f(+x.toPrecision(6)));
  // ejes con marcas; devuelve las funciones de escala
  function ejes(g, w, h, xmax, ymax, nx, ny, numX = true) {
    const m = { l: 52, r: 16, t: 16, b: 34 }, X = (x) => m.l + (x / xmax) * (w - m.l - m.r), Y = (y) => h - m.b - (y / ymax) * (h - m.t - m.b);
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    const sx = paso(xmax), sy = paso(ymax);
    for (let x = 0; x <= xmax * 1.0001; x += sx) { g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), Y(ymax)); g.stroke(); if (numX) texto(g, X(x), h - m.b + 12, num(x), col['--muted']); }
    for (let y = 0; y <= ymax * 1.0001; y += sy) { g.beginPath(); g.moveTo(X(0), Y(y)); g.lineTo(X(xmax), Y(y)); g.stroke(); texto(g, m.l - 6, Y(y), num(y), col['--muted'], 'right'); }
    g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(X(0), Y(ymax)); g.lineTo(X(0), Y(0)); g.lineTo(X(xmax), Y(0)); g.stroke();
    texto(g, X(xmax), h - 8, nx, col['--muted'], 'right'); texto(g, m.l + 6, m.t - 6 + 6, ny, col['--muted'], 'left');
    return { X, Y };
  }
  function curva(g, pts, X, Y) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); }
  function flecha(g, x1, y1, x2, y2) {
    const a = Math.atan2(y2 - y1, x2 - x1), x = (x1 + x2) / 2, y = (y1 + y2) / 2;
    g.beginPath(); g.moveTo(x + 6 * Math.cos(a), y + 6 * Math.sin(a)); g.lineTo(x - 6 * Math.cos(a) + 5 * Math.sin(a), y - 6 * Math.sin(a) - 5 * Math.cos(a)); g.lineTo(x - 6 * Math.cos(a) - 5 * Math.sin(a), y - 6 * Math.sin(a) + 5 * Math.cos(a)); g.closePath(); g.fill();
  }
  // puntos (V, P) de un tramo en unidades de la pantalla
  function tramoPts(t, n, gm, u) {
    const a = t.ini, b = t.fin, pts = [];
    for (let i = 0; i <= 60; i++) {
      const s = i / 60;
      let V, P;
      if (t.tipo === 'isocora') { V = a.V; P = a.P + (b.P - a.P) * s; }
      else { V = a.V + (b.V - a.V) * s; P = t.tipo === 'isobara' ? a.P : t.tipo === 'isoterma' ? (a.P * a.V) / V : a.P * (a.V / V) ** gm; }
      pts.push([V / u.V[0], P / u.P[0]]);
    }
    return pts;
  }
  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    if (sol.modo === 'mezcla') {
      const comp = sol.comp, pmax = sol.Pt * 1.15, { X, Y } = ejes(g, w, h, comp.length + 1, pmax / 1000, '', 'P (kPa)', false), cs = [col['--accent'], col['--peso'], col['--normal']];
      comp.forEach((c, i) => { g.fillStyle = cs[i]; g.fillRect(X(i + 0.25), Y(c.P / 1000), X(0.5) - X(0), Y(0) - Y(c.P / 1000)); texto(g, X(i + 0.5), Y(c.P / 1000) - 10, txt(f(c.P / 1000)), cs[i], 'center', '600 '); texto(g, X(i + 0.5), h - 22, c.k.replace('2', '₂'), col['--ink'], 'center', '600 '); });
      let y0 = 0; comp.forEach((c, i) => { g.fillStyle = cs[i]; g.fillRect(X(comp.length + 0.25), Y((y0 + c.P) / 1000), X(0.5) - X(0), Y(y0 / 1000) - Y((y0 + c.P) / 1000)); y0 += c.P; });
      texto(g, X(comp.length + 0.5), Y(sol.Pt / 1000) - 10, `total ${txt(f(sol.Pt / 1000))}`, col['--ink'], 'center', '600 '); texto(g, X(comp.length + 0.5), h - 22, 'mezcla', col['--ink'], 'center', '600 ');
      return;
    }
    if (sol.modo === 'real') {
      // isotermas de Van der Waals y del gas ideal, P(V) a la temperatura y los moles dados
      const nb = sol.n * sol.b, Vmax = Math.max(sol.V * 2.2, nb * 12), Vmin = nb * 1.08, Pvdw = (V, T) => (sol.n * G.R * T) / (V - nb) - (sol.a * sol.n * sol.n) / (V * V), Pid = (V) => (sol.n * G.R * sol.T) / V;
      const ymax = Math.max(sol.P, sol.Pi) * 2.4 / 101325, pts = (fn) => { const r = []; for (let i = 0; i <= 300; i++) { const V = Vmin + ((Vmax - Vmin) * i) / 300, P = fn(V) / 101325; if (P <= ymax && P >= 0) r.push([V * 1000, P]); } return r; };
      const { X, Y } = ejes(g, w, h, Vmax * 1000, ymax, 'V (L)', 'P (atm)');
      g.strokeStyle = col['--line']; g.lineWidth = 2; curva(g, pts(Pid), X, Y);
      g.setLineDash([5, 4]); curva(g, pts((V) => Pvdw(V, sol.Tc)), X, Y); g.setLineDash([]);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.6; curva(g, pts((V) => Pvdw(V, sol.T)), X, Y);
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(sol.V * 1000), Y(sol.P / 101325), 5, 0, 2 * Math.PI); g.fill();
      g.fillStyle = col['--muted']; g.beginPath(); g.arc(X(sol.V * 1000), Y(sol.Pi / 101325), 4, 0, 2 * Math.PI); g.fill();
      texto(g, w - 20, 26, `real ${txt(f(sol.P / 101325))} atm · ideal ${txt(f(sol.Pi / 101325))} atm`, col['--ink'], 'right', '600 ');
      return;
    }
    if (sol.modo === 'cinetica') {
      const vmax = 4.2 * sol.vp, pts = (T) => Array.from({ length: 201 }, (_, i) => { const v = (vmax * i) / 200; return [v, G.maxwell(sol.M, T, v) * 1000]; });
      const p1 = pts(sol.T), p2 = pts(2 * sol.T), ymax = Math.max(...p1.map((p) => p[1])) * 1.18;
      const { X, Y } = ejes(g, w, h, vmax, ymax, 'v (m/s)', 'f(v) (·10⁻³ s/m)');
      g.strokeStyle = col['--line']; g.lineWidth = 2; g.setLineDash([5, 4]); curva(g, p2, X, Y); g.setLineDash([]);
      g.fillStyle = col['--accent']; g.globalAlpha = 0.12; g.beginPath(); g.moveTo(X(0), Y(0)); p1.forEach(([x, y]) => g.lineTo(X(x), Y(y))); g.lineTo(X(vmax), Y(0)); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; curva(g, p1, X, Y);
      [[sol.vp, 'v_p', col['--normal']], [sol.vmed, 'v̄', col['--roz']], [sol.vrms, 'v_cm', col['--peso']]].forEach(([v, t, cl], i) => {
        const y = G.maxwell(sol.M, sol.T, v) * 1000;
        g.strokeStyle = cl; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(v), Y(0)); g.lineTo(X(v), Y(y)); g.stroke();
        texto(g, w - 20, 26 + i * 17, `${t.replace('_p', 'ₚ').replace('_cm', 'cm')} = ${txt(f(v))} m/s`, cl, 'right', '600 ');
      });
      return;
    }
    const u = sol.u, est = sol.modo === 'estado' ? [{ P: sol.P, V: sol.V, T: sol.T }] : sol.est;
    const Vs = est.map((e) => e.V / u.V[0]), Ps = est.map((e) => e.P / u.P[0]);
    const { X, Y } = ejes(g, w, h, Math.max(...Vs) * 1.25, Math.max(...Ps) * 1.25, `V (${txt(u.V[1]).replace('^3', '³')})`, `P (${u.P[1]})`);
    const xmax = Math.max(...Vs) * 1.25, ymax = Math.max(...Ps) * 1.25;
    const iso = (PV) => { const pts = []; for (let i = 1; i <= 200; i++) { const V = (xmax * i) / 200, P = PV / V; if (P <= ymax) pts.push([V, P]); } return pts; };
    g.strokeStyle = col['--line']; g.lineWidth = 1.6; g.setLineDash([5, 4]);
    if (sol.modo === 'estado') curva(g, iso(Vs[0] * Ps[0]), X, Y);
    else {
      const PV = est.map((e, i) => Vs[i] * Ps[i]), lista = sol.ciclo ? [Math.max(...PV), Math.min(...PV)] : [PV[0], PV[PV.length - 1]];
      for (const k of lista) curva(g, iso(k), X, Y);
    }
    g.setLineDash([]);
    if (sol.modo === 'procesos') {
      const gm = sol.G.gamma, colT = { isoterma: col['--normal'], isobara: col['--accent'], isocora: col['--roz'], adiabatica: col['--fuerza'] };
      if (sol.ciclo) { g.fillStyle = col['--accent']; g.globalAlpha = 0.1; g.beginPath(); sol.tramos.forEach((t) => tramoPts(t, sol.n, gm, u).forEach(([x, y], i) => (i || t !== sol.tramos[0] ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))))); g.closePath(); g.fill(); g.globalAlpha = 1; }
      for (const t of sol.tramos) {
        const pts = tramoPts(t, sol.n, gm, u);
        g.strokeStyle = colT[t.tipo]; g.fillStyle = colT[t.tipo]; g.lineWidth = 2.6; curva(g, pts, X, Y);
        const [x1, y1] = pts[28], [x2, y2] = pts[32]; flecha(g, X(x1), Y(y1), X(x2), Y(y2));
      }
    }
    const nEst = sol.modo === 'procesos' && sol.ciclo ? est.length - 1 : est.length;
    const cx = Vs.slice(0, nEst).reduce((s, v) => s + v, 0) / nEst, cy = Ps.slice(0, nEst).reduce((s, v) => s + v, 0) / nEst;
    for (let i = 0; i < nEst; i++) {
      const x = X(Vs[i]), y = Y(Ps[i]);
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(x, y, 4.5, 0, 2 * Math.PI); g.fill();
      const dx = Vs[i] >= cx ? 1 : -1, dy = Ps[i] >= cy ? -1 : 1;
      texto(g, x + dx * 10, y + dy * 12, sol.modo === 'estado' ? `(${num(Vs[i])}, ${num(Ps[i])})` : String.fromCharCode(65 + i), col['--ink'], dx > 0 ? 'left' : 'right', '600 ');
    }
    if (sol.modo === 'estado') { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(Vs[0]), Y(0)); g.lineTo(X(Vs[0]), Y(Ps[0])); g.lineTo(X(0), Y(Ps[0])); g.stroke(); g.setLineDash([]); }
  }
  /* ---------- Caja con partículas ---------- */
  // velocidades al azar de la distribución de Maxwell (cada componente, una normal de varianza RT/M)
  let particulas = null, choques = 0, tCaja = 0;
  const normal = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  function iniciaCaja(w, h) {
    const grupos = sol.modo === 'mezcla' ? sol.comp.map((c, i) => ({ N: Math.max(3, Math.round(70 * c.x)), M: c.M * 1e-3, i })) : [{ N: 60, M: sol.modo === 'cinetica' ? sol.M : 0.029, i: 0 }];
    const T = sol.T, vref = Math.sqrt((3 * G.R * T) / Math.min(...grupos.map((q) => q.M))), esc = (0.22 * w) / vref; // px/s por m/s
    particulas = [];
    for (const q of grupos) { const s = Math.sqrt((G.R * T) / q.M) * esc; for (let k = 0; k < q.N; k++) particulas.push({ x: 8 + Math.random() * (w - 16), y: 8 + Math.random() * (h - 16), vx: normal() * s, vy: normal() * s, i: q.i, vmax: 2.2 * Math.sqrt(2) * s }); }
    choques = 0; tCaja = 0;
  }
  function caja(dt) {
    const c = $('#caja');
    if (c.hidden || !sol) return;
    const { g, w, h } = Herramienta.lienzo(c);
    if (!w) return;
    if (!col['--ink']) colores();
    if (!particulas) iniciaCaja(w, h);
    const cs = [col['--accent'], col['--peso'], col['--normal']], r = 3.5;
    tCaja += dt;
    g.strokeStyle = col['--muted']; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
    for (const q of particulas) {
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.x < r) { q.x = 2 * r - q.x; q.vx = -q.vx; choques++; } if (q.x > w - r) { q.x = 2 * (w - r) - q.x; q.vx = -q.vx; choques++; }
      if (q.y < r) { q.y = 2 * r - q.y; q.vy = -q.vy; choques++; } if (q.y > h - r) { q.y = 2 * (h - r) - q.y; q.vy = -q.vy; choques++; }
      g.fillStyle = cs[q.i]; g.globalAlpha = sol.modo === 'mezcla' ? 0.9 : 0.45 + 0.55 * Math.min(1, Math.hypot(q.vx, q.vy) / q.vmax);
      g.beginPath(); g.arc(q.x, q.y, r, 0, 2 * Math.PI); g.fill();
    }
    g.globalAlpha = 1;
    texto(g, 10, 14, `${txt(f(sol.T, 4))} K${tCaja > 0.5 ? ` · ${Math.round(choques / tCaja)} choques con las paredes por segundo (en la animación)` : ''}`, col['--ink'], 'left', '600 ');
  }
  let ultimo = performance.now();
  function bucle() { const ahora = performance.now(), dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora; caja(dt); requestAnimationFrame(bucle); }
  window.addEventListener('resize', () => { particulas = null; dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  /* ---------- Modo práctica: un ejercicio con enunciado ---------- */
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const B = { uP: 'atm', uV: 'L', uT: 'K' };
    const tipos = [
      () => ({ modo: 'estado', ...B, P: c(de([1, 1.5, 2, 3, 5])), V: '', T: String(ent(27, 50) * 10), n: '', m: String(ent(2, 20) * 4), M: de(['4', '28', '32', '44']) }),
      () => ({ modo: 'estado', ...B, P: '', V: String(ent(2, 30)), T: String(ent(27, 50) * 10), n: c(ent(1, 20) / 10), m: '', M: '' }),
      () => ({ modo: 'procesos', gas: de(['monoatomico', 'diatomico']), ...B, P: String(ent(1, 5)), V: String(ent(2, 10)), T: String(ent(27, 50) * 10), n: '', procesos: [{ tipo: de(['isoterma', 'adiabatica', 'isobara']), dato: 'V', valor: String(ent(11, 30)) }] }),
      () => ({ modo: 'procesos', gas: 'monoatomico', ...B, uP: 'kPa', P: '100', V: String(ent(1, 3)), T: '', n: c(ent(1, 5) / 10), procesos: [{ tipo: 'isocora', dato: 'P', valor: String(ent(2, 4) * 100) }, { tipo: 'isobara', dato: 'V', valor: String(ent(4, 8)) }, { tipo: 'isocora', dato: 'P', valor: '100' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] }),
      () => ({ modo: 'mezcla', T: String(ent(27, 35) * 10), V: String(ent(5, 30)), cant: 'm', g1: 'N2', c1: String(ent(1, 10) * 7), g2: de(['O2', 'He', 'CO2']), c2: String(ent(1, 10) * 4), g3: 'Ar', c3: '' }),
      () => ({ modo: 'real', gasR: de(['CO2', 'N2', 'NH3', 'H2O', 'O2']), a: '', b: '', n: '1', V: c(de([0.2, 0.5, 1, 2])), T: String(ent(30, 50) * 10) }),
      () => ({ modo: 'cinetica', molecula: de(['He', 'N2', 'O2', 'H2', 'CO2']), M: '', T: String(ent(20, 60) * 10), uT: 'K', n: '', P: Math.random() < 0.5 ? '' : '1', d: '' }),
    ];
    sc = de(tipos)();
    formulario(); sel.value = ''; calcula();
  }
  const enunciado = () => {
    const e = (x) => esc(String(x ?? '').replace('.', ',')), up = (G.UP[sc.uP] || G.UP.atm)[1], uv = txt((G.UV[sc.uV] || G.UV.L)[1]).replace('^3', '³');
    const nombreG = (k) => (G.MOLECULAS[k] || G.VDW[k] || ['gas'])[0].replace(/, .*/, '').toLowerCase();
    if (sc.modo === 'estado') return sc.m ? `¿Qué volumen ocupan ${e(sc.m)} g de un gas de masa molar ${e(sc.M)} g/mol a ${e(sc.P)} ${up} y ${e(sc.T)} K? Calcula también su densidad.` : `${e(sc.n)} mol de un gas ideal ocupan ${e(sc.V)} ${uv} a ${e(sc.T)} K. ¿Qué presión tienen?`;
    if (sc.modo === 'procesos' && (sc.procesos || []).length > 1) return `${e(sc.n)} mol de un gas monoatómico parten de ${e(sc.P)} ${up} y ${e(sc.V)} ${uv} y recorren un ciclo rectangular: isocora hasta ${e(sc.procesos[0].valor)} ${up}, isobara hasta ${e(sc.procesos[1].valor)} ${uv}, isocora hasta ${e(sc.procesos[2].valor)} ${up} e isobara de vuelta. Calcula el trabajo neto, el calor absorbido y el rendimiento.`;
    if (sc.modo === 'procesos') { const p = sc.procesos[0]; return `Un gas ideal ${sc.gas === 'monoatomico' ? 'monoatómico' : 'diatómico'} a ${e(sc.P)} ${up}, ${e(sc.V)} ${uv} y ${e(sc.T)} K se expande de forma ${{ isoterma: 'isoterma', adiabatica: 'adiabática', isobara: 'isobara' }[p.tipo]} hasta ${e(p.valor)} ${uv}. Calcula el estado final, el trabajo, el calor y la variación de energía interna.`; }
    if (sc.modo === 'mezcla') return `En un recipiente de ${e(sc.V)} L a ${e(sc.T)} K hay ${e(sc.c1)} ${sc.cant === 'm' ? 'g' : 'mol'} de ${nombreG(sc.g1)} y ${e(sc.c2)} ${sc.cant === 'm' ? 'g' : 'mol'} de ${nombreG(sc.g2)}${sc.c3 ? ` y ${e(sc.c3)} ${sc.cant === 'm' ? 'g' : 'mol'} de ${nombreG(sc.g3)}` : ''}. Calcula las fracciones molares, las presiones parciales y la presión total.`;
    if (sc.modo === 'real') return `Calcula la presión de ${e(sc.n)} mol de ${nombreG(sc.gasR)} en ${e(sc.V)} L a ${e(sc.T)} K con la ecuación de Van der Waals y compárala con la del gas ideal. ¿Cuánto vale el factor de compresibilidad?`;
    return `Calcula las velocidades cuadrática media, media y más probable de las moléculas de ${nombreG(sc.molecula)} a ${e(sc.T)} K y su energía cinética media${sc.P ? `, y el recorrido libre medio a ${e(sc.P)} atm` : ''}.`;
  };

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('gases').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.GasesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, P: sol.P, V: sol.V, T: sol.T, n: sol.n, Wt: sol.Wt, Qt: sol.Qt, Ut: sol.Ut, rend: sol.rend, ciclo: sol.ciclo, vrms: sol.vrms, Pt: sol.Pt, Z: sol.Z, lam: sol.lam }, estado: () => copia(sc) };
})();
