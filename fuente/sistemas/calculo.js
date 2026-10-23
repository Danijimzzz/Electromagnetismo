/* =====================================================================
   Sistemas de ecuaciones lineales (sin DOM): clasificación con el
   teorema de Rouché-Frobenius y solución por Gauss, Gauss-Jordan, Cramer
   o la matriz inversa, con la solución en paramétricas si es compatible
   indeterminado. Coeficientes racionales o complejos exactos (Algebra).
   ===================================================================== */
const Sistemas = (() => {
  const A_ = Algebra, { html, htmlF, matHtml } = A_;
  const METODOS = [['gauss', 'Gauss'], ['jordan', 'Gauss-Jordan'], ['cramer', 'Regla de Cramer'], ['inversa', 'Matriz inversa']];
  const PARAM = ['λ', 'μ', 'ν', 'α', 'β', 'γ'];
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // nombres propios («I1, I2» → I₁, I₂) o x, y, z, t; con más de cuatro, x₁ … xₙ
  function nombres(n, propios) {
    const p = String(propios ?? '').split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
    if (p.length) {
      if (p.length !== n) throw new Error(`Has escrito ${p.length} ${p.length === 1 ? 'nombre' : 'nombres'} de incógnitas y hay ${n}`);
      if (new Set(p).size !== n) throw new Error('Hay nombres de incógnitas repetidos');
      return p.map((t) => esc(t).replace(/^(.*?[^\d_])_?(\d+)$/, '$1<sub>$2</sub>'));
    }
    return n <= 4 ? ['x', 'y', 'z', 't'].slice(0, n) : Array.from({ length: n }, (_, i) => `x<sub>${i + 1}</sub>`);
  }

  // a₁x + a₂y + … como HTML (sin los términos nulos); términos: [[coef, html de la variable]]
  function combinacion(terminos, constante = null) {
    let s = '';
    const pon = (sg, v) => { s += s ? ` ${sg} ${v}` : `${sg === '−' ? '−' : ''}${v}`; };
    if (constante && !A_.esCero(constante)) s = html(constante);
    for (const [a, x] of terminos) {
      if (A_.esCero(a)) continue;
      const [sg, v] = A_.signo(a);
      pon(sg, A_.esUno(a) || A_.esUno(A_.neg(a)) ? x : `${v}${x}`);
    }
    return s || '0';
  }
  const ecuacion = (fila, vars) => `${combinacion(fila.slice(0, -1).map((a, j) => [a, vars[j]]))} = ${html(fila[fila.length - 1])}`;
  const sistemaHtml = (M, vars) => `<span class="sis">${M.map((f) => `<span>${ecuacion(f, vars)}</span>`).join('')}</span>`;

  function resolver(sc) {
    const m = sc.M.length, n = sc.M[0].length - 1;
    if (n < 1) throw new Error('Hace falta al menos una incógnita');
    const M = A_.leerMatriz(sc.M), A = M.map((f) => f.slice(0, n)), vars = nombres(n, sc.vars);
    const metodo = METODOS.some(([k]) => k === sc.metodo) ? sc.metodo : 'gauss';
    const pasos = [{ t: 'Sistema', html: sistemaHtml(M, vars) }, { t: 'Matriz ampliada A* = [A | b]', html: matHtml(M, { barra: n }) }];
    // Rouché-Frobenius
    const e = A_.escalonar(M, { reducida: metodo === 'jordan', columnas: n, barra: n });
    const rA = e.rango, rAmp = e.R.some((f, i) => i >= rA && !A_.esCero(f[n])) ? rA + 1 : rA;
    const tipo = rA < rAmp ? 'SI' : rA === n ? 'SCD' : 'SCI';
    const TIPOS = { SCD: 'compatible determinado: una única solución', SCI: `compatible indeterminado: infinitas soluciones con ${n - rA} ${n - rA === 1 ? 'parámetro' : 'parámetros'}`, SI: 'incompatible: no tiene solución' };
    const usaGauss = metodo === 'gauss' || metodo === 'jordan' || tipo !== 'SCD' || m !== n;
    if (usaGauss) pasos.push(...e.pasos.map((p) => ({ t: p.ops.join(', &nbsp;'), html: matHtml(p.M, { barra: n, marca: p.piv }) })));
    else {
      // para Cramer o la inversa, los rangos salen del determinante
      pasos.push({ t: 'Determinante de A', html: `|A| = <b>${html(A_.determinante(A))}</b> ≠ 0` });
    }
    pasos.push({ t: 'Teorema de Rouché-Frobenius', html: `rang(A) = ${rA}, &nbsp; rang(A*) = ${rAmp}, &nbsp; n.º de incógnitas = ${n}${tipo === 'SI' ? ` <br>Una fila queda 0 = ${html(e.R.find((f, i) => i >= rA && !A_.esCero(f[n]))[n])}, que es imposible.` : ''}<br>rang(A) ${rA === rAmp ? '=' : '≠'} rang(A*)${rA === rAmp ? ` ${rA === n ? '=' : '&lt;'} n` : ''} ⇒ sistema <b>${TIPOS[tipo]}</b>` });
    if ((metodo === 'cramer' || metodo === 'inversa') && (tipo !== 'SCD' || m !== n)) pasos.push({ t: `No se puede usar ${metodo === 'cramer' ? 'Cramer' : 'la matriz inversa'}`, html: `${m !== n ? 'La matriz de coeficientes no es cuadrada' : '|A| = 0'}; se resuelve por Gauss.` });
    let sol = null, param = null;
    if (tipo !== 'SI') {
      // solución general desde la forma reducida
      const R = metodo === 'jordan' ? e.R : A_.escalonar(M, { reducida: true, columnas: n }).R;
      const piv = A_.escalonar(M, { reducida: true, columnas: n }).pivotes, pc = piv.map(([, c]) => c);
      const libres = [...Array(n).keys()].filter((c) => !pc.includes(c));
      const P = Object.fromEntries(libres.map((c, k) => [c, PARAM[k] || `p<sub>${k + 1}</sub>`]));
      // cada incógnita = constante + Σ coef·parámetro
      sol = Array.from({ length: n }, (_, j) => ({ c: A_.c0, t: libres.map((l) => [l === j ? A_.c1 : A_.c0, P[l]]) }));
      piv.forEach(([r, c]) => { sol[c] = { c: R[r][n], t: libres.map((l) => [A_.neg(R[r][l]), P[l]]) }; });
      param = libres.map((l) => P[l]);
      if (tipo === 'SCD' && metodo === 'cramer' && m === n) {
        const d = A_.determinante(A);
        const lineas = vars.map((v, j) => {
          const Aj = A.map((f, i) => f.map((x, k) => (k === j ? M[i][n] : x))), dj = A_.determinante(Aj);
          return `${v} = |A<sub>${j + 1}</sub>| / |A| = ${matHtml(Aj, { det: true })} / ${htmlF(d)} = ${htmlF(dj)} / ${htmlF(d)} = <b>${html(A_.div(dj, d))}</b>`;
        });
        pasos.push({ t: 'Regla de Cramer: cada incógnita es |A<sub>i</sub>| / |A|, con la columna i cambiada por b', html: lineas.join('<br>') });
      } else if (tipo === 'SCD' && metodo === 'inversa' && m === n) {
        const aug = A.map((f, i) => [...f, ...A_.identidad(n)[i]]), inv = A_.escalonar(aug, { reducida: true, columnas: n }).R.map((f) => f.slice(n));
        const b = M.map((f) => [f[n]]);
        pasos.push({ t: 'Inversa de A (Gauss-Jordan)', html: `A<sup>−1</sup> = ${matHtml(inv)}` });
        pasos.push({ t: 'X = A<sup>−1</sup> b', html: `${matHtml(inv)} · ${matHtml(b)} = <b>${matHtml(A_.producto(inv, b))}</b>` });
      } else if (metodo === 'gauss') {
        // sustitución hacia atrás sobre la escalonada
        const lineas = [];
        const conocidos = {};
        libres.forEach((l) => { conocidos[l] = sol[l]; });
        for (let k = e.pivotes.length - 1; k >= 0; k--) {
          const [r, c] = e.pivotes[k], f = e.R[r], resto = [];
          for (let j = c + 1; j < n; j++) if (!A_.esCero(f[j])) resto.push(j);
          const ec = `${combinacion([[f[c], vars[c]], ...resto.map((j) => [f[j], vars[j]])])} = ${html(f[n])}`;
          const valor = combinacion(sol[c].t, sol[c].c);
          lineas.push(`${ec} &nbsp;⇒&nbsp; ${vars[c]} = <b>${valor}</b>`);
        }
        if (libres.length) lineas.unshift(`Las incógnitas sin pivote son parámetros: ${libres.map((l) => `${vars[l]} = ${P[l]}`).join(', ')}`);
        pasos.push({ t: 'Sustitución hacia atrás (de la última ecuación a la primera)', html: lineas.join('<br>') });
      } else {
        pasos.push({ t: 'Se lee la solución de la matriz reducida', html: `${sistemaHtml(R.filter((f) => f.some((x) => !A_.esCero(x))), vars)}${libres.length ? `<br>Con ${libres.map((l) => `${vars[l]} = ${P[l]}`).join(', ')}:` : ''}` });
      }
      pasos.push({ t: tipo === 'SCD' ? 'Solución' : 'Solución en forma paramétrica', html: `${vars.map((v, j) => `${v} = <b>${combinacion(sol[j].t, sol[j].c)}</b>`).join(', &nbsp;')}${param.length ? `, &nbsp;con ${param.join(', ')} ∈ ${M.flat().every(A_.esReal) ? 'ℝ' : 'ℂ'}` : ''}` });
      // comprobación con los parámetros a cero
      const x0 = sol.map((s) => s.c), ok = M.every((f) => A_.igual(f.slice(0, n).reduce((s, a, j) => A_.suma(s, A_.mul(a, x0[j])), A_.c0), f[n]));
      if (!ok) throw new Error('La comprobación de la solución ha fallado');
      if (tipo === 'SCD') pasos.push({ t: 'Comprobación', html: M.map((f) => `${f.slice(0, n).map((a, j) => (A_.esCero(a) ? null : `${htmlF(a)}·${htmlF(x0[j])}`)).filter(Boolean).join(' + ') || '0'} = ${html(f[n])} ✓`).join('<br>') });
    }
    const res = tipo === 'SI' ? 'Sistema incompatible: no tiene solución' : `${vars.map((v, j) => `${v} = ${combinacion(sol[j].t, sol[j].c)}`).join(', &nbsp;')}`;
    return { tipo, rA, rAmp, n, m, vars, sol, param, pasos, res, descripcion: TIPOS[tipo], metodo };
  }

  const S = (...filas) => filas.map((f) => f.split(' '));
  const ejemplos = [
    { clave: 'scd', nombre: 'Compatible determinado 3×3', sc: { metodo: 'gauss', M: S('2 1 -1 8', '-3 -1 2 -11', '-2 1 2 -3') } },
    { clave: 'cramer', nombre: 'Por la regla de Cramer', sc: { metodo: 'cramer', M: S('1 1 1 6', '0 2 5 -4', '2 5 -1 27') } },
    { clave: 'sci', nombre: 'Compatible indeterminado (un parámetro)', sc: { metodo: 'gauss', M: S('1 1 1 6', '2 -1 1 3', '3 0 2 9') } },
    { clave: 'sci2', nombre: 'Dos ecuaciones y cuatro incógnitas', sc: { metodo: 'jordan', M: S('1 2 -1 1 4', '2 4 1 -1 5') } },
    { clave: 'si', nombre: 'Incompatible', sc: { metodo: 'gauss', M: S('1 1 1 2', '1 2 3 5', '2 3 4 6') } },
    { clave: 'homogeneo', nombre: 'Sistema homogéneo', sc: { metodo: 'jordan', M: S('1 2 3 0', '4 5 6 0', '7 8 9 0') } },
    { clave: 'inversa', nombre: 'Por la matriz inversa', sc: { metodo: 'inversa', M: S('2 1 5', '1 3 10') } },
    { clave: 'fracciones', nombre: 'Con fracciones y decimales', sc: { metodo: 'gauss', M: S('1/2 1/3 1', '0,25 -1 2') } },
    { clave: 'complejo', nombre: 'Con números complejos', sc: { metodo: 'gauss', M: S('1+i 2 3+i', '1 -i 1') } },
    { clave: 'mallas', nombre: 'Mallas en alterna (impedancias complejas)', sc: { metodo: 'cramer', vars: 'I1, I2', M: S('2+3i -3i 10', '-3i 4+i 0') } },
  ];
  return { METODOS, resolver, ejemplos, nombres, combinacion };
})();
if (typeof module !== 'undefined') module.exports = Sistemas;
