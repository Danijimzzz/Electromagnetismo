/* =====================================================================
   Interfaz de Bonos y duración: datos del bono (se pide el precio o la TIR),
   la curva precio-TIR con su tangente (la duración), la tabla de flujos
   y el desarrollo. Se monta con Calculadora.monta (calculadora.js); el
   cálculo está en bonos/calculo.js (Bonos).
   ===================================================================== */
(() => {
  const B = Bonos, { f, dinero, num } = Eco;
  const tp = (x) => `${f(100 * x, 5)} %`;
  Calculadora.monta({
    C: B, carpeta: 'bonos', app: 'BonosApp',
    nota: 'Tasas en % nominales anuales, con tantos pagos al año como indiques. Si los años no dan un número entero de pagos, se compra entre cupones: el precio de «precio → TIR» es el limpio (el cotizado) y se añade el cupón corrido. Se reembolsa el nominal. La variación de la TIR (en puntos) sirve para ver cuánto cambia el precio; déjala vacía si no la necesitas.',
    campos: (sc) => [
      { k: 'nominal', nom: 'Valor nominal N', un: '€', sep: 'El bono' }, { k: 'cupon', nom: 'Cupón anual c', un: '%' },
      { k: 'm', nom: 'Pagos al año', tipo: 'sel', ops: [['1', 'Anuales'], ['2', 'Semestrales'], ['4', 'Trimestrales'], ['12', 'Mensuales']] }, { k: 'anos', nom: 'Años hasta el vencimiento', un: 'años' },
      { k: 'modo', nom: 'Dato conocido', tipo: 'sel', sep: 'Mercado', ops: [['tir', 'La rentabilidad (TIR) → precio'], ['precio', 'El precio → rentabilidad (TIR)']] },
      sc.modo === 'precio' ? { k: 'precio', nom: 'Precio pagado (limpio)', un: '€' } : { k: 'y', nom: 'Rentabilidad exigida (TIR)', un: '%' },
      { k: 'shock', nom: 'Variación de la TIR', un: 'puntos', ayuda: 'opcional' },
    ],
    resumen: (s) => [
      ...(s.entre ? [['Precio limpio (cotizado)', dinero(s.Pl)], ['Cupón corrido', dinero(s.corrido)], ['Precio sucio (el que se paga)', dinero(s.P)]] : [['Precio', dinero(s.P)]]), ['Cotiza', `${f(100 * s.Pl / s.N, 6)} % del nominal`], ['TIR', tp(s.y)], ['Rentabilidad corriente', tp(s.corriente)],
      ['Duración de Macaulay', `${f(s.durM, 5)} años`], ['Duración modificada', f(s.durMod, 5)], ['Convexidad', f(s.conv, 5)], ['Situación', s.estado],
      ...(s.shock !== 0 ? [[`Precio si la TIR varía ${f(100 * s.shock, 3)} puntos`, dinero(s.Pexacto), true], ['Con duración', dinero(s.Pdur)], ['Con duración y convexidad', dinero(s.Pconv)]] : []),
      ...(s.aviso ? [['Aviso', s.aviso, true]] : []),
    ],
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>Periodo</th><th>Años hasta el pago</th><th>Flujo</th><th>1/(1 + i)<sup>τ</sup></th><th>Valor actual</th><th>Peso</th><th>Años × peso</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${r.j}</td><td>${f(r.t, 4)}</td><td>${num(r.q)}</td><td>${r.fa.toFixed(6).replace('.', ',')}</td><td>${num(r.va)}</td><td>${num(100 * r.w, 2)} %</td><td>${num(r.tw, 4)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td>${num(s.P)}</td><td>100 %</td><td>${num(s.durM, 4)}</td></tr></tfoot></table>`,
    grafica: (s) => {
      const span = Math.max(0.05, 0.9 * Math.abs(s.y)), lo = Math.max(s.y - span, -0.9 * s.m), hi = s.y + span, N = 120;
      const xs = Array.from({ length: N + 1 }, (_, i) => lo + ((hi - lo) * i) / N);
      const pts = xs.map((x) => [100 * x, s.precioDe(x)]), tang = [lo, hi].map((x) => [100 * x, s.P * (1 - s.durMod * (x - s.y))]);
      const ys = pts.map((p) => p[1]).concat(tang.map((p) => p[1]));
      return { x: [100 * lo, 100 * hi], y: Eco.rango(ys), fx: (v) => `${Herramienta.txt(f(v))} %`, fy: (v) => num(v, 0), ejeX: 'Rentabilidad (TIR)', ejeY: 'Precio (€)',
        series: [{ pts, color: '--serie-1' }, { pts: tang, color: '--serie-2', discontinua: true }, { tipo: 'puntos', pts: [[100 * s.y, s.P]], color: '--ink', radio: 5 },
          ...(s.shock !== 0 ? [{ tipo: 'puntos', pts: [[100 * (s.y + s.shock), s.Pexacto]], color: '--serie-3', radio: 5 }] : [])] };
    },
    leyenda: () => '<b style="color:var(--serie-1)">Azul</b>: el precio exacto según la TIR; es una curva convexa. <b style="color:var(--serie-2)">Rojo discontinuo</b>: la recta tangente en tu punto, cuya pendiente es la duración modificada: se queda por debajo de la curva, y esa diferencia es la convexidad. <b style="color:var(--serie-3)">Morado</b>: el precio con la variación de la TIR que indiques.',
  });
})();
