/* =====================================================================
   Campos en coordenadas cilíndricas y esféricas (sin DOM): gradiente,
   divergencia, rotacional y laplaciano con los factores de escala,
   escritos con sus fórmulas y calculados con derivadas simbólicas
   (Expresion), y su valor en un punto. Lo usa el modo «Cilíndricas y
   esféricas» de Campos (campos/calculo.js); la interfaz está en campos/app.js.
     Curvilineas.calcula(sc) → { sistema, vars, base, grTxt, divTxt, rotTxt, lapTxt, …, pasos }
       sc = { sis: 'cil' | 'esf', f, A, B, C, p1, p2, p3 }
     cilíndricas: (ρ, φ, z) se escriben r, p, z    esféricas: (r, θ, φ) se escriben r, t, p
   ===================================================================== */
const Curvilineas = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const N = E.N, op = (t, a, b) => ({ t, a, b }), fn = (f, a) => ({ t: 'fn', f, a });
  const V = (n) => ({ t: 'x', n });
  const SIS = {
    cil: { nombre: 'cilíndricas', vars: ['r', 'p', 'z'], simb: ['ρ', 'φ', 'z'], base: ['e_ρ', 'e_φ', 'e_z'], escala: '$h_ρ = 1$, $h_φ = ρ$, $h_z = 1$' },
    esf: { nombre: 'esféricas', vars: ['r', 't', 'p'], simb: ['r', 'θ', 'φ'], base: ['e_r', 'e_θ', 'e_φ'], escala: '$h_r = 1$, $h_θ = r$, $h_φ = r \\text{ sen } θ$' },
  };
  const T = (n) => E.texto(E.simp(n));
  const d = (n, v) => E.simp(E.deriva(n, v));
  const mul = (...xs) => xs.reduce((a, b) => op('*', a, b));
  const suma = (...xs) => xs.reduce((a, b) => op('+', a, b));
  const cero = (n) => { const s = E.simp(n); return s.t === 'n' && s.v === 0; };
  const f6 = (x) => E.numTxt(Math.abs(x) < 1e-12 ? 0 : x);

  function lee(s, nom, vars) { return vacio(s) ? N(0) : E.lee(s, nom, vars); }
  function numero(s, nom) {
    if (vacio(s)) throw new Error(`Falta ${nom}`);
    const v = E.valor(E.lee(String(s), nom, []), 0);
    if (!isFinite(v)) throw new Error(`${nom} tiene que ser un número`);
    return v;
  }

  // operadores de la sección; c = { r, t?, p?, z? } según el sistema
  function operadores(sis, f, A, B, C) {
    const [u1, u2, u3] = SIS[sis].vars, x1 = V(u1), x2 = V(u2), x3 = V(u3);
    let gr, dv, rot, lap;
    if (sis === 'cil') {
      gr = [d(f, u1), op('/', d(f, u2), x1), d(f, u3)];
      dv = suma(op('/', d(mul(x1, A), u1), x1), op('/', d(B, u2), x1), d(C, u3));
      rot = [
        op('-', op('/', d(C, u2), x1), d(B, u3)),
        op('-', d(A, u3), d(C, u1)),
        op('/', op('-', d(mul(x1, B), u1), d(A, u2)), x1),
      ];
      lap = suma(op('/', d(mul(x1, d(f, u1)), u1), x1), op('/', d(d(f, u2), u2), op('^', x1, N(2))), d(d(f, u3), u3));
    } else {
      const sn = fn('sen', x2), r2 = op('^', x1, N(2));
      gr = [d(f, u1), op('/', d(f, u2), x1), op('/', d(f, u3), mul(x1, sn))];
      dv = suma(op('/', d(mul(r2, A), u1), r2), op('/', d(mul(sn, B), u2), mul(x1, sn)), op('/', d(C, u3), mul(x1, sn)));
      rot = [
        op('/', op('-', d(mul(sn, C), u2), d(B, u3)), mul(x1, sn)),
        op('/', op('-', op('/', d(A, u3), sn), d(mul(x1, C), u1)), x1),
        op('/', op('-', d(mul(x1, B), u1), d(A, u2)), x1),
      ];
      lap = suma(op('/', d(mul(r2, d(f, u1)), u1), r2), op('/', d(mul(sn, d(f, u2)), u2), mul(r2, sn)), op('/', d(d(f, u3), u3), mul(r2, op('^', sn, N(2)))));
    }
    return { gr: gr.map(E.simp), dv: E.simp(dv), rot: rot.map(E.simp), lap: E.simp(lap) };
  }

  function calcula(sc) {
    const sis = SIS[sc.sis] ? sc.sis : 'cil', S = SIS[sis], vars = S.vars;
    const f = lee(sc.f, 'La función f', vars), A = lee(sc.A, `La componente ${S.simb[0]}`, vars), B = lee(sc.B, `La componente ${S.simb[1]}`, vars), C = lee(sc.C, `La componente ${S.simb[2]}`, vars);
    const hayF = !vacio(sc.f), hayV = !(vacio(sc.A) && vacio(sc.B) && vacio(sc.C));
    if (!hayF && !hayV) throw new Error('Escribe una función f o las componentes del campo');
    const p = [numero(sc.p1, `el valor de ${S.simb[0]}`), numero(sc.p2, `el valor de ${S.simb[1]}`), numero(sc.p3, `el valor de ${S.simb[2]}`)];
    if (sis === 'cil' && p[0] <= 0) throw new Error('ρ tiene que ser mayor que 0 (en el eje ρ = 0 las coordenadas cilíndricas no están definidas)');
    if (sis === 'esf') {
      if (p[0] <= 0) throw new Error('r tiene que ser mayor que 0 (en el origen las coordenadas esféricas no están definidas)');
      if (!(p[1] > 1e-9 && p[1] < Math.PI - 1e-9)) throw new Error('θ tiene que estar entre 0 y π, sin tocar los extremos (en el eje z las coordenadas esféricas no están definidas)');
    }
    const op_ = operadores(sis, f, A, B, C);
    const en = (n) => E.valor(n, 0, { [vars[0]]: p[0], [vars[1]]: p[1], [vars[2]]: p[2] });
    const v = {
      g0: op_.gr.map(en), div0: en(op_.dv), rot0: op_.rot.map(en), lap0: en(op_.lap), f0: en(f), F0: [A, B, C].map(en),
    };
    if (hayF && !v.g0.every(isFinite)) throw new Error('f o sus derivadas no están definidas en ese punto');
    if (hayV && !(isFinite(v.div0) && v.rot0.every(isFinite))) throw new Error('El campo o sus derivadas no están definidos en ese punto');
    const [u1, u2, u3] = S.simb, [e1, e2, e3] = S.base, pasos = [];
    pasos.push({ t: 'Coordenadas ' + S.nombre, html: sis === 'cil'
      ? `Un punto es $(ρ, φ, z)$ con $x = ρ \\text{ cos } φ$, $y = ρ \\text{ sen } φ$, $z = z$. Los factores de escala (lo que mide un desplazamiento unidad de cada coordenada) son ${S.escala}. Se escribe <b>r</b> por ρ y <b>p</b> por φ. La base $(e_ρ, e_φ, e_z)$ es ortonormal y cambia de un punto a otro.`
      : `Un punto es $(r, θ, φ)$ con $x = r \\text{ sen } θ \\text{ cos } φ$, $y = r \\text{ sen } θ \\text{ sen } φ$, $z = r \\text{ cos } θ$ ($θ$ es el ángulo con el eje $z$, de 0 a π). Los factores de escala son ${S.escala}. Se escribe <b>t</b> por θ y <b>p</b> por φ. La base $(e_r, e_θ, e_φ)$ es ortonormal y cambia de un punto a otro.` });
    if (hayF) {
      pasos.push({ t: 'Gradiente', html: (sis === 'cil'
        ? '$∇f = {∂f}/{∂ρ} e_ρ + {1}/{ρ} {∂f}/{∂φ} e_φ + {∂f}/{∂z} e_z$'
        : '$∇f = {∂f}/{∂r} e_r + {1}/{r} {∂f}/{∂θ} e_θ + {1}/{r \\text{ sen } θ} {∂f}/{∂φ} e_φ$') + `<br>Con $f = ${T(f)}$: $∇f = (${op_.gr.map(T).join(' ; ')})$ en la base $(${e1}, ${e2}, ${e3})$.` });
      pasos.push({ t: 'Laplaciano', html: (sis === 'cil'
        ? '$∇² f = {1}/{ρ} {∂}/{∂ρ} (ρ {∂f}/{∂ρ}) + {1}/{ρ^2} {∂^2 f}/{∂φ^2} + {∂^2 f}/{∂z^2}$'
        : '$∇² f = {1}/{r^2} {∂}/{∂r} (r^2 {∂f}/{∂r}) + {1}/{r^2 \\text{ sen } θ} {∂}/{∂θ} (\\text{sen } θ {∂f}/{∂θ}) + {1}/{r^2 \\text{ sen}^2 θ} {∂^2 f}/{∂φ^2}$') + `<br>$∇² f = ${T(op_.lap)}$${cero(op_.lap) ? ' (f es armónica)' : ''}.` });
    }
    if (hayV) {
      const comp = `${u1 === 'ρ' ? 'F_ρ' : 'F_r'} = ${T(A)}$, $${'F_' + u2} = ${T(B)}$, $${'F_' + u3} = ${T(C)}`;
      pasos.push({ t: 'Divergencia', html: (sis === 'cil'
        ? '$∇ · F = {1}/{ρ} {∂(ρ F_ρ)}/{∂ρ} + {1}/{ρ} {∂F_φ}/{∂φ} + {∂F_z}/{∂z}$'
        : '$∇ · F = {1}/{r^2} {∂(r^2 F_r)}/{∂r} + {1}/{r \\text{ sen } θ} {∂(\\text{sen } θ F_θ)}/{∂θ} + {1}/{r \\text{ sen } θ} {∂F_φ}/{∂φ}$') + `<br>Con $${comp}$: $∇ · F = ${T(op_.dv)}$${cero(op_.dv) ? ' (solenoidal)' : ''}.` });
      pasos.push({ t: 'Rotacional', html: (sis === 'cil'
        ? '$∇ × F = (\\ {1}/{ρ} {∂F_z}/{∂φ} − {∂F_φ}/{∂z}\\ ) e_ρ + ({∂F_ρ}/{∂z} − {∂F_z}/{∂ρ}) e_φ + {1}/{ρ} ({∂(ρ F_φ)}/{∂ρ} − {∂F_ρ}/{∂φ}) e_z$'
        : '$∇ × F = {1}/{r \\text{ sen } θ} ({∂(\\text{sen } θ F_φ)}/{∂θ} − {∂F_θ}/{∂φ}) e_r + {1}/{r} ({1}/{\\text{sen } θ} {∂F_r}/{∂φ} − {∂(r F_φ)}/{∂r}) e_θ + {1}/{r} ({∂(r F_θ)}/{∂r} − {∂F_r}/{∂θ}) e_φ$') + `<br>$∇ × F = (${op_.rot.map(T).join(' ; ')})$ en la base $(${e1}, ${e2}, ${e3})$${op_.rot.every(cero) ? ' (irrotacional: el campo es conservativo si la región es simple)' : ''}.` });
    }
    pasos.push({ t: 'En el punto', html: `En $(${u1}, ${u2}, ${u3}) = (${p.map(f6).join(' ; ')})$: ${hayF ? `$f = ${f6(v.f0)}$, $∇f = (${v.g0.map(f6).join(' ; ')})$, $∇² f = ${f6(v.lap0)}$` : ''}${hayF && hayV ? '; ' : ''}${hayV ? `$F = (${v.F0.map(f6).join(' ; ')})$, $∇ · F = ${f6(v.div0)}$, $∇ × F = (${v.rot0.map(f6).join(' ; ')})$` : ''}.` });
    return { modo: 'curvilineas', sis, nombre: S.nombre, vars, simb: S.simb, base: S.base, hayF, hayV, p, ...v, grTxt: op_.gr.map(T), divTxt: T(op_.dv), rotTxt: op_.rot.map(T), lapTxt: T(op_.lap), fTxt: T(f), FTxt: [A, B, C].map(T), armonica: cero(op_.lap), solenoidal: cero(op_.dv), irrot: op_.rot.every(cero), d3: true, pasos };
  }

  const ejemplos = [
    { clave: 'cil-radial', nombre: 'Cilíndricas: F = ρ e_ρ (sale de un eje)', sc: { sis: 'cil', f: '', A: 'r', B: '', C: '', p1: '2', p2: 'π/3', p3: '1' } },
    { clave: 'cil-giro', nombre: 'Cilíndricas: F = ρ e_φ (un remolino)', sc: { sis: 'cil', f: '', A: '', B: 'r', C: '', p1: '1', p2: '0', p3: '0' } },
    { clave: 'cil-carga-lineal', nombre: 'Cilíndricas: campo de un hilo, F = (1/ρ) e_ρ', sc: { sis: 'cil', f: 'ln(r)', A: '1/r', B: '', C: '', p1: '3', p2: '0', p3: '0' } },
    { clave: 'esf-carga', nombre: 'Esféricas: campo de una carga puntual, F = (1/r²) e_r', sc: { sis: 'esf', f: '1/r', A: '1/r^2', B: '', C: '', p1: '2', p2: 'π/2', p3: '0' } },
    { clave: 'esf-radial', nombre: 'Esféricas: F = r e_r y f = r cos θ', sc: { sis: 'esf', f: 'r cos(t)', A: 'r', B: '', C: '', p1: '1', p2: 'π/4', p3: '0' } },
    { clave: 'esf-dipolo', nombre: 'Esféricas: potencial de un dipolo, f = cos θ / r²', sc: { sis: 'esf', f: 'cos(t)/r^2', A: '2 cos(t)/r^3', B: 'sen(t)/r^3', C: '', p1: '1', p2: 'π/3', p3: '0' } },
  ];

  return { calcula, ejemplos, SIS };
})();
if (typeof module !== 'undefined') module.exports = Curvilineas;
