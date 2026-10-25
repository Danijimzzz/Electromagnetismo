/* =====================================================================
   Fluidos: interfaz (modo, datos, resultados, animación de cada caso y
   desarrollo). El cálculo está en fluidos/fisica.js (Fluidos).
   ===================================================================== */
(() => {
  const { $, esc, copia, txt } = Herramienta;
  const F = Fluidos, f = F.f, CLAVE = 'fluidos-v1';
  const MODOS = [['presion', 'Presión a una profundidad'], ['tuboU', 'Tubo en U con dos líquidos'], ['prensa', 'Prensa hidráulica (Pascal)'], ['empuje', 'Empuje (Arquímedes)'], ['bernoulli', 'Tubería: continuidad y Bernoulli'], ['torricelli', 'Chorro de un depósito (Torricelli)']];

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    presion: 'Si dejas vacía la presión en la superficie se toma la atmosférica, 101 325 Pa. Pon 0 si encima hay vacío, como en un barómetro. El área es opcional: con ella sale la fuerza sobre el fondo.',
    tuboU: 'El líquido del fondo es el más denso (agua, mercurio). Las alturas se miden desde la superficie de separación de los dos líquidos.',
    prensa: 'Los diámetros de los émbolos van en centímetros, como el recorrido.',
    empuje: 'Densidades del agua 1000 kg/m³, del agua de mar 1025 kg/m³. El volumen va en m³: se admite 2e-3 o 2·10^-3.',
    bernoulli: 'Los diámetros van en centímetros y el caudal en litros por segundo. La presión puede ser absoluta o manométrica: p₂ sale del mismo tipo.',
    torricelli: 'H es la altura del líquido por encima del agujero. El resto es opcional: con la altura del agujero sale el alcance, con su diámetro el caudal y con el del depósito el tiempo de vaciado.',
  };
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    const gr = sep('Opcional') + fila('g', 'Gravedad', 'm/s²');
    if (sc.modo === 'presion') {
      h += fila('rho', 'Densidad del líquido', 'kg/m³') + fila('h', 'Profundidad', 'm') + sep('Opcional') + fila('p0', 'Presión en la superficie', 'Pa') + fila('A', 'Área del fondo', 'm²') + fila('g', 'Gravedad', 'm/s²');
    } else if (sc.modo === 'tuboU') {
      h += elige('buscar', 'Qué buscas', [['altura', 'La altura del otro lado'], ['densidad', 'La densidad del líquido añadido']]);
      h += fila('rho1', 'Densidad del líquido del fondo ρ₁', 'kg/m³') + (sc.buscar === 'densidad' ? fila('h1', 'Altura del líquido del fondo h₁', 'm') : fila('rho2', 'Densidad del líquido añadido ρ₂', 'kg/m³')) + fila('h2', 'Columna del líquido añadido h₂', 'm');
    } else if (sc.modo === 'prensa') {
      h += elige('datos', 'Datos', [['fuerza', 'Conozco la fuerza en el émbolo pequeño'], ['masa', 'Conozco la masa que hay que levantar']]);
      h += (sc.datos === 'masa' ? fila('m', 'Masa que se levanta', 'kg') : fila('F1', 'Fuerza en el émbolo pequeño F₁', 'N')) + fila('d1', 'Diámetro del émbolo pequeño', 'cm') + fila('d2', 'Diámetro del émbolo grande', 'cm') + sep('Opcional') + fila('x1', 'Recorrido del émbolo pequeño', 'cm') + fila('g', 'Gravedad', 'm/s²');
    } else if (sc.modo === 'empuje') {
      h += elige('datos', 'Datos', [['cuerpo', 'Conozco el cuerpo: ¿flota o se hunde?'], ['pesadas', 'Lo peso en el aire y dentro del fluido']]);
      h += (sc.datos === 'pesadas' ? fila('P', 'Peso en el aire', 'N') + fila('Pa', 'Peso dentro del fluido', 'N') : fila('rhoC', 'Densidad del cuerpo', 'kg/m³') + fila('V', 'Volumen del cuerpo', 'm³')) + fila('rhoF', 'Densidad del fluido', 'kg/m³') + gr;
    } else if (sc.modo === 'bernoulli') {
      h += elige('datos', 'Datos', [['v1', 'Conozco la velocidad en 1'], ['Q', 'Conozco el caudal']]);
      h += fila('rho', 'Densidad del fluido', 'kg/m³') + fila('d1', 'Diámetro en 1', 'cm') + fila('d2', 'Diámetro en 2', 'cm') + (sc.datos === 'Q' ? fila('Q', 'Caudal', 'L/s') : fila('v1', 'Velocidad en 1', 'm/s')) + fila('p1', 'Presión en 1', 'Pa') + sep('Opcional') + fila('h1', 'Altura de 1', 'm') + fila('h2', 'Altura de 2', 'm') + fila('g', 'Gravedad', 'm/s²');
    } else {
      h += fila('H', 'Altura del líquido sobre el agujero H', 'm') + sep('Opcional') + fila('y', 'Altura del agujero sobre el suelo', 'm') + fila('d', 'Diámetro del agujero', 'cm') + fila('D', 'Diámetro del depósito', 'm') + fila('g', 'Gravedad', 'm/s²');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(F.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { const ej = F.ejemplos.find((x) => x.sc.modo === sc.modo && x.sc[t.dataset.k] === t.value); if (ej) for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + F.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      tA = 0; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'presion') {
      h = dato('Presión manométrica', `p<sub>man</sub> = ${f(sol.pm)} Pa`) + dato('Presión absoluta', `p = ${f(sol.pa)} Pa`) + dato('En atmósferas', `p = ${f(sol.pa / F.ATM)} atm`) + (sol.A ? dato('Fuerza sobre el fondo', `F = ${f(sol.F)} N`) : '');
      ley = 'Las flechas son la presión sobre la sonda: a una misma profundidad empuja igual en todas direcciones.';
    } else if (sol.modo === 'tuboU') {
      h = (sol.buscar === 'densidad' ? dato('Densidad del líquido añadido', `ρ₂ = ${f(sol.rho2)} kg/m³`) : dato('Altura del otro lado', `h₁ = ${f(sol.h1)} m`)) + dato('Desnivel entre superficies', `Δh = ${f(sol.dh)} m`);
      ley = 'Al echar el líquido menos denso en una rama, el otro sube por la contraria. En la línea de puntos la presión es la misma a los dos lados.';
    } else if (sol.modo === 'prensa') {
      h = (sol.datos === 'masa' ? dato('Fuerza necesaria', `F₁ = ${f(sol.F1)} N`) : dato('Fuerza en el émbolo grande', `F₂ = ${f(sol.F2)} N`)) + dato('Presión en el líquido', `p = ${f(sol.pr)} Pa`) + dato('Multiplica la fuerza por', `A₂/A₁ = ${f(sol.k)}`) + (sol.x1 ? dato('Sube el émbolo grande', `x₂ = ${f(sol.x2)} cm`) : '');
      ley = 'Al bajar el émbolo pequeño, el líquido empuja al grande con la misma presión y una fuerza mucho mayor, pero lo sube mucho menos.';
    } else if (sol.modo === 'empuje') {
      if (sol.datos === 'pesadas') {
        h = dato('Empuje', `E = ${f(sol.E)} N`) + dato('Volumen', `V = ${f(sol.V)} m³`) + dato('Densidad del cuerpo', `ρ = ${f(sol.rhoC)} kg/m³`);
        ley = 'El dinamómetro marca menos a medida que el cuerpo entra en el fluido: la diferencia es el empuje.';
      } else {
        h = dato('Peso', `P = ${f(sol.P)} N`) + dato('Empuje sumergido entero', `E = ${f(sol.Emax)} N`) + (sol.flota ? dato('Flota con sumergido', `${f((100 * sol.rhoC) / sol.rhoF)} %`) + dato('Volumen sumergido', `V<sub>s</sub> = ${f(sol.Vs)} m³`) : sol.flota === false ? dato('Se hunde con peso aparente', `P<sub>ap</sub> = ${f(sol.Pa)} N`) + dato('Aceleración al soltarlo', `a = ${f(sol.a)} m/s²`) : dato('Equilibrio', 'ni sube ni baja'));
        ley = sol.flota ? 'En rojo el peso y en verde el empuje, que crece con la parte sumergida. El cuerpo oscila hasta que los dos se igualan.' : 'En rojo el peso y en verde el empuje. El peso gana y el cuerpo se va al fondo.';
      }
    } else if (sol.modo === 'bernoulli') {
      h = dato('Velocidad en 2', `v₂ = ${f(sol.v2)} m/s`) + dato('Presión en 2', `p₂ = ${f(sol.p2)} Pa`) + dato('Caudal', `Q = ${f(sol.Q * 1000)} L/s`) + (sol.datos === 'Q' ? dato('Velocidad en 1', `v₁ = ${f(sol.v1)} m/s`) : '');
      ley = 'Cada punto es una gota de fluido: va más deprisa donde el tubo es estrecho. La altura de los tubos de arriba indica la presión.';
    } else {
      h = dato('Velocidad de salida', `v = ${f(sol.v)} m/s`) + (sol.x !== null ? dato('Alcance', `x = ${f(sol.x)} m`) : '') + (sol.Q ? dato('Caudal', `Q = ${f(sol.Q * 1000)} L/s`) : '') + (sol.tv ? dato('Tiempo de vaciado', `t = ${f(sol.tv)} s`) : '');
      ley = 'El chorro sale horizontal con la velocidad de caída libre desde la superficie y luego cae como un tiro horizontal.';
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    tA = 0; gotas = null; dibuja();
  }

  /* ---------- Animación ---------- */
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--suelo', '--cuerpo', '--panel', '--agua', '--aceite']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function flecha(g, x, y, dx, dy, color) {
    const l = Math.hypot(dx, dy); if (l < 4) return;
    const ux = dx / l, uy = dy / l;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx - ux * 6, y + dy - uy * 6); g.stroke();
    g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - ux * 9 - uy * 4.5, y + dy - uy * 9 + ux * 4.5); g.lineTo(x + dx - ux * 9 + uy * 4.5, y + dy - uy * 9 - ux * 4.5); g.closePath(); g.fill();
  }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  // cota vertical con su etiqueta
  function cota(g, x, y1, y2, t, color = col['--muted'], al = 'left') {
    if (Math.abs(y2 - y1) < 3) return;
    g.strokeStyle = color; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y2); g.moveTo(x - 4, y1); g.lineTo(x + 4, y1); g.moveTo(x - 4, y2); g.lineTo(x + 4, y2); g.stroke();
    texto(g, x + (al === 'left' ? 7 : -7), (y1 + y2) / 2, t, color, al);
  }
  // superficie de un líquido con una ondulación suave
  function liquido(g, x1, x2, ySup, yFondo, color, t, ola = 2) {
    g.fillStyle = color; g.beginPath(); g.moveTo(x1, yFondo); g.lineTo(x1, ySup);
    for (let x = x1; x <= x2; x += 6) g.lineTo(x, ySup + ola * Math.sin(x / 18 + t * 2.4));
    g.lineTo(x2, ySup); g.lineTo(x2, yFondo); g.closePath(); g.fill();
  }
  const suave = (s) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, s)));
  let tA = 0, gotas = null;

  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    const t = tA;
    if (sol.modo === 'presion') {
      const x1 = w * 0.12, x2 = Math.min(w * 0.62, x1 + 420), ySup = h * 0.16, yF = h - 22, prof = sol.A ? 1 : 0.72;
      const yp = ySup + prof * (yF - ySup) - (sol.A ? 12 : 0), xp = (x1 + x2) / 2;
      g.fillStyle = col['--suelo']; g.fillRect(x1 - 4, ySup - 14, 4, yF - ySup + 18); g.fillRect(x2, ySup - 14, 4, yF - ySup + 18); g.fillRect(x1 - 4, yF, x2 - x1 + 8, 4);
      liquido(g, x1, x2, ySup, yF, col['--agua'], t);
      // burbujas que suben desde la sonda
      for (let k = 0; k < 6; k++) { const s = ((t * 0.35 + k / 6) % 1), yb = yp - s * (yp - ySup); punto(g, xp + 14 + 6 * Math.sin(t * 3 + k), yb, 2.5 + 2 * s, col['--panel']); }
      const L = 12 + Math.min(1, sol.pa / (3 * F.ATM)) * 28;
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, cx = Math.cos(a), cy = Math.sin(a); flecha(g, xp + cx * (L + 9), yp + cy * (L + 9), -cx * L, -cy * L, col['--peso']); }
      punto(g, xp, yp, 7, col['--ink']);
      cota(g, x2 + 16, ySup, yp, `h = ${txt(f(sol.h))} m`);
      texto(g, x2 + 22, ySup - 10, sol.p0 ? `p₀ = ${txt(f(sol.p0))} Pa` : 'vacío (p₀ = 0)', col['--muted'], 'left');
      texto(g, 14, 16, `p = ${txt(f(sol.pa))} Pa · manométrica ${txt(f(sol.pm))} Pa`, col['--ink'], 'left', '600 ');
      if (sol.A) texto(g, xp, yF - 30, `F = ${txt(f(sol.F))} N sobre el fondo`, col['--ink'], 'center', '600 ');
    } else if (sol.modo === 'tuboU') {
      // echa el líquido ligero poco a poco, espera y vuelve a empezar
      const ciclo = 6, s = suave((t % ciclo) / 2.5);
      const ancho = 38, xa = w * 0.3, xb = Math.min(w * 0.62, xa + 260), yb = h - 36, yi0 = h * 0.62;
      const esc2 = (h * 0.48) / sol.h2, h2 = s * sol.h2 * esc2, h1 = s * sol.h1 * esc2;
      const ySep = yi0 + h1 / 2, yIzq = ySep - h1, yDer = ySep - h2, med = (xa + xb) / 2;
      const R = (xb - xa) / 2, tubo = () => { g.beginPath(); g.moveTo(xa, h * 0.06); g.lineTo(xa, yb - R); g.arc(med, yb - R, R, Math.PI, 0, true); g.lineTo(xb, h * 0.06); };
      // un trozo del tubo entre dos alturas y en una mitad, pintado del color de su líquido
      const pinta = (yTop, yBot, x0, x1, color) => { g.save(); g.beginPath(); g.rect(x0, yTop, x1 - x0, yBot - yTop); g.clip(); tubo(); g.lineWidth = ancho; g.strokeStyle = color; g.stroke(); g.restore(); };
      g.lineCap = 'butt'; tubo(); g.strokeStyle = col['--suelo']; g.lineWidth = ancho + 8; g.stroke(); g.strokeStyle = col['--bg']; g.lineWidth = ancho; g.stroke();
      pinta(yIzq, h, 0, med + 1, col['--agua']); pinta(ySep, h, med, w, col['--agua']);
      if (h2 > 0.5) pinta(yDer, ySep, med, w, col['--aceite']);
      g.strokeStyle = col['--ink']; g.setLineDash([5, 5]); g.lineWidth = 1; g.beginPath(); g.moveTo(xa - ancho, ySep); g.lineTo(xb + ancho, ySep); g.stroke(); g.setLineDash([]);
      cota(g, xa - ancho / 2 - 12, ySep, yIzq, `h₁ = ${txt(f(s * sol.h1))} m`, col['--muted'], 'right');
      cota(g, xb + ancho / 2 + 12, ySep, yDer, `h₂ = ${txt(f(s * sol.h2))} m`);
      texto(g, xa, yb + 18, `ρ₁ = ${txt(f(sol.rho1))} kg/m³`, col['--muted']);
      texto(g, xb + ancho / 2 + 10, h * 0.06 + 10, `ρ₂ = ${txt(f(sol.rho2))} kg/m³`, col['--muted'], 'left');
      texto(g, 14, 16, `Δh = ${txt(f(s * sol.dh))} m`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'prensa') {
      const ciclo = 4, s = suave(Math.abs(((t % ciclo) / ciclo) * 2 - 1) * 1.2 - 0.1);
      const yb = h - 30, wG = Math.min(w * 0.34, 260), wP = Math.max(10, (wG * sol.d1) / sol.d2), xP = w * 0.22, xG = w * 0.62;
      const baj = 70 * s, sube = baj / sol.k, y0P = h * 0.3, y0G = h * 0.48;
      const yP = y0P + baj, yG = y0G - sube;
      g.fillStyle = col['--agua'];
      g.fillRect(xP - wP / 2, yP, wP, yb - yP); g.fillRect(xG - wG / 2, yG, wG, yb - yG); g.fillRect(xP - wP / 2, yb - 26, xG - xP, 26);
      g.fillStyle = col['--suelo'];
      g.fillRect(xP - wP / 2 - 4, h * 0.14, 4, yb - h * 0.14 + 4); g.fillRect(xP + wP / 2, h * 0.14, 4, yb - 26 - h * 0.14); g.fillRect(xG - wG / 2 - 4, h * 0.3, 4, yb - 26 - h * 0.3); g.fillRect(xG + wG / 2, h * 0.3, 4, yb - h * 0.3 + 4);
      g.fillRect(xP - wP / 2 - 4, yb, xG + wG / 2 - xP + wP / 2 + 8, 4); g.fillRect(xP + wP / 2, yb - 30, xG - wG / 2 - xP - wP / 2, 4);
      g.fillStyle = col['--ink']; g.fillRect(xP - wP / 2, yP - 8, wP, 8); g.fillRect(xG - wG / 2, yG - 10, wG, 10);
      // la carga sobre el émbolo grande
      g.fillStyle = col['--cuerpo']; g.fillRect(xG - wG * 0.35, yG - 10 - 40, wG * 0.7, 40);
      texto(g, xG, yG - 30, sol.m ? `${txt(f(sol.m))} kg` : 'carga', col['--ink']);
      flecha(g, xP, yP - 60, 0, 48, col['--peso']); texto(g, xP + 10, yP - 66, `F₁ = ${txt(f(sol.F1))} N`, col['--peso'], 'left');
      flecha(g, xG + wG / 2 + 22, yG + 50, 0, -60, col['--normal']); texto(g, xG + wG / 2 + 30, yG + 20, `F₂ = ${txt(f(sol.F2))} N`, col['--normal'], 'left');
      texto(g, 14, 16, `p = ${txt(f(sol.pr))} Pa en todo el líquido · A₂/A₁ = ${txt(f(sol.k))}`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'empuje') {
      const x1 = w * 0.14, x2 = Math.min(w * 0.7, x1 + 460), ySup = h * 0.34, yF = h - 20, L = Math.min(76, (yF - ySup) * 0.4), xc = (x1 + x2) / 2;
      g.fillStyle = col['--suelo']; g.fillRect(x1 - 4, h * 0.2, 4, yF - h * 0.2 + 4); g.fillRect(x2, h * 0.2, 4, yF - h * 0.2 + 4); g.fillRect(x1 - 4, yF, x2 - x1 + 8, 4);
      liquido(g, x1, x2, ySup, yF, col['--agua'], t);
      const escF = 70 / Math.max(sol.P, sol.datos === 'pesadas' ? sol.P : sol.Emax);
      let yTop, sub;
      if (sol.datos === 'pesadas') {
        const ciclo = 7, s = suave((t % ciclo) / 3);
        yTop = ySup - L - 16 + s * (L + 40); sub = Math.max(0, Math.min(1, (yTop + L - ySup) / L));
        const lect = sol.P - sol.E * sub;
        g.strokeStyle = col['--muted']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xc, 12); g.lineTo(xc, 30);
        for (let k = 0; k < 8; k++) g.lineTo(xc + (k % 2 ? 6 : -6), 30 + ((yTop - 50) * (k + 1)) / 9);
        g.lineTo(xc, yTop - 14); g.lineTo(xc, yTop); g.stroke();
        g.fillStyle = col['--panel']; g.strokeStyle = col['--line']; g.fillRect(xc + 14, 18, 116, 24); g.strokeRect(xc + 14, 18, 116, 24);
        texto(g, xc + 72, 30, `marca ${txt(f(lect))} N`, col['--ink'], 'center', '600 ');
        g.fillStyle = col['--roz']; g.fillRect(xc - L / 2, yTop, L, L);
        flecha(g, xc, yTop + L / 2, 0, sol.P * escF, col['--peso']);
        if (sub > 0) flecha(g, xc - L / 2 - 14, yTop + L, 0, -sol.E * sub * escF, col['--normal']);
        texto(g, 14, h - 34 < ySup ? 16 : 16, `P = ${txt(f(sol.P))} N · E = ${txt(f(sol.E * sub))} N`, col['--ink'], 'left', '600 ');
      } else {
        let sp;
        if (sol.flota) {
          const fr = sol.rhoC / sol.rhoF, tt = t % 8;
          sp = fr + (0 - fr) * Math.exp(-0.7 * tt) * Math.cos(3 * tt);
        } else if (sol.flota === null) sp = 1.6;
        else { const tt = t % 5, a = Math.min(1, sol.a / 9.8); sp = Math.min((yF - ySup) / L, 1 + 0.5 * a * 9 * tt * tt); }
        yTop = ySup - L + sp * L; sub = Math.max(0, Math.min(1, sp));
        g.fillStyle = col['--roz']; g.fillRect(xc - L / 2, yTop, L, L);
        flecha(g, xc + 10, yTop + L / 2, 0, sol.P * escF, col['--peso']);
        flecha(g, xc - 10, yTop + L / 2, 0, -sol.Emax * sub * escF, col['--normal']);
        texto(g, xc + L / 2 + 10, yTop + L / 2 + 30, 'P', col['--peso'], 'left', '600 ');
        texto(g, xc - L / 2 - 10, yTop + L / 2 - 30, 'E', col['--normal'], 'right', '600 ');
        texto(g, 14, 16, `P = ${txt(f(sol.P))} N · E = ${txt(f(sol.Emax * sub))} N`, col['--ink'], 'left', '600 ');
      }
      texto(g, x2 - 8, yF - 12, `fluido: ρ = ${txt(f(sol.rhoF))} kg/m³`, col['--muted'], 'right');
    } else if (sol.modo === 'bernoulli') {
      const xa = 20, xb = w - 20, xm1 = w * 0.42, xm2 = w * 0.56, Dmax = Math.min(h * 0.32, 110);
      const r1 = (Dmax * Math.min(1, sol.d1 / Math.max(sol.d1, sol.d2))) / 2, r2 = (Dmax * Math.min(1, sol.d2 / Math.max(sol.d1, sol.d2))) / 2;
      const dz = sol.h2 - sol.h1, cy0 = h * 0.7, sz = dz ? Math.max(-1, Math.min(1, dz / Math.max(Math.abs(dz), 1))) * h * 0.18 : 0;
      const cyA = cy0 + sz / 2, cyB = cy0 - sz / 2;
      const ctr = (x) => (x <= xm1 ? cyA : x >= xm2 ? cyB : cyA + (cyB - cyA) * suave((x - xm1) / (xm2 - xm1)));
      const rad = (x) => (x <= xm1 ? r1 : x >= xm2 ? r2 : r1 + (r2 - r1) * suave((x - xm1) / (xm2 - xm1)));
      const vel = (x) => sol.v1 * (r1 / rad(x)) ** 2;
      // tubos piezométricos: altura proporcional a la presión
      const pmax = Math.max(Math.abs(sol.p1), Math.abs(sol.p2)) || 1, hp = Math.min(h * 0.38, cyB - r2 - 30, cyA - r1 - 30);
      for (const [x, pr, cy, r, n] of [[(xa + xm1) / 2, sol.p1, cyA, r1, '1'], [(xm2 + xb) / 2, sol.p2, cyB, r2, '2']]) {
        const alto = Math.max(0, (pr / pmax) * hp);
        g.fillStyle = col['--line']; g.fillRect(x - 7, cy - r - hp - 6, 14, hp + 6);
        g.fillStyle = col['--agua']; g.fillRect(x - 5, cy - r - alto, 10, alto);
        texto(g, x + 14, cy - r - hp + 4, `p${n === '1' ? '₁' : '₂'} = ${txt(f(pr))} Pa`, col['--ink'], 'left');
      }
      g.fillStyle = col['--agua']; g.beginPath(); g.moveTo(xa, ctr(xa) - rad(xa));
      for (let x = xa; x <= xb; x += 4) g.lineTo(x, ctr(x) - rad(x));
      for (let x = xb; x >= xa; x -= 4) g.lineTo(x, ctr(x) + rad(x));
      g.closePath(); g.fill();
      g.strokeStyle = col['--suelo']; g.lineWidth = 3;
      for (const sg of [-1, 1]) { g.beginPath(); for (let x = xa; x <= xb; x += 4) (x === xa ? g.moveTo(x, ctr(x) + sg * rad(x)) : g.lineTo(x, ctr(x) + sg * rad(x))); g.stroke(); }
      if (!gotas) { gotas = []; for (let k = 0; k < 90; k++) gotas.push({ x: xa + Math.random() * (xb - xa), s: Math.random() * 1.6 - 0.8 }); }
      for (const q of gotas) punto(g, q.x, ctr(q.x) + q.s * rad(q.x), 2.2, col['--ink']);
      bernoulliPaso = (dt) => { const k = (0.18 * w) / Math.max(sol.v1, sol.v2); for (const q of gotas) { q.x += vel(q.x) * k * dt; if (q.x > xb) { q.x = xa + (q.x - xb) % 30; q.s = Math.random() * 1.6 - 0.8; } } };
      texto(g, (xa + xm1) / 2, cyA + r1 + 16, `v₁ = ${txt(f(sol.v1))} m/s`, col['--ink']);
      texto(g, (xm2 + xb) / 2, cyB + r2 + 16, `v₂ = ${txt(f(sol.v2))} m/s`, col['--ink']);
      texto(g, 14, 16, `Q = ${txt(f(sol.Q * 1000))} L/s`, col['--ink'], 'left', '600 ');
    } else {
      const yv = sol.y ?? sol.H / 2, alto = sol.H + yv, rango = 2 * Math.sqrt(sol.H * yv), tw = Math.min(w * 0.22, 150);
      const s = Math.min((h - 50) / alto, (w - tw - 60) / Math.max(rango, 0.1)), yS = h - 18, xo = 20 + tw, yo = yS - yv * s, ySup = yo - sol.H * s;
      g.fillStyle = col['--suelo']; g.fillRect(0, yS, w, 3);
      g.fillRect(16, ySup - 16, 4, yo - ySup + 26); g.fillRect(xo, ySup - 16, 4, yo - ySup - 4); g.fillRect(16, yo + 10, tw + 8, 4);
      g.fillRect(24, yo + 14, 6, yS - yo - 14); g.fillRect(xo - 8, yo + 14, 6, yS - yo - 14);
      liquido(g, 20, xo, ySup, yo + 10, col['--agua'], t, 1.5);
      // chorro: parábola del tiro horizontal y gotas que la recorren
      const pasoT = (u) => [xo + 4 + u * rango * s, yo + u * u * yv * s];
      g.strokeStyle = col['--agua']; g.lineWidth = 6; g.beginPath();
      for (let k = 0; k <= 40; k++) { const [x, y] = pasoT(k / 40); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      for (let k = 0; k < 10; k++) { const u = (t * 0.8 + k / 10) % 1, [x, y] = pasoT(u); punto(g, x, y, 2.2, col['--accent']); }
      flecha(g, xo + 8, yo - 14, 44, 0, col['--peso']); texto(g, xo + 58, yo - 14, `v = ${txt(f(sol.v))} m/s`, col['--peso'], 'left');
      cota(g, xo - 14, ySup, yo, `H = ${txt(f(sol.H))} m`, col['--muted'], 'right');
      if (sol.y !== null) {
        cota(g, xo + 18, yo + 8, yS, `y = ${txt(f(sol.y))} m`);
        if (sol.x) { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(xo + 4, yS + 10); g.lineTo(xo + 4 + rango * s, yS + 10); g.stroke(); texto(g, xo + 4 + (rango * s) / 2, yS - 10, `x = ${txt(f(sol.x))} m`, col['--ink'], 'center', '600 '); }
      }
      texto(g, w - 14, 16, sol.tv ? `se vacía en ${txt(f(sol.tv))} s` : '', col['--ink'], 'right', '600 ');
    }
  }
  let bernoulliPaso = null;
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; if (sol.modo === 'bernoulli' && bernoulliPaso) bernoulliPaso(dt); dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { gotas = null; dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  // un ejercicio al azar: un ejemplo con sus números cambiados lo hace el modo práctica
  const ver = $('#ver'); if (ver) ver.textContent = Version.de('fluidos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.FluidosApp = { abrirEjemplo, resultado: () => sol && Object.fromEntries(Object.entries(sol).filter(([, v]) => typeof v === 'number' || typeof v === 'boolean' || v === null)), estado: () => copia(sc), pausa: () => { anda = false; } };
})();
