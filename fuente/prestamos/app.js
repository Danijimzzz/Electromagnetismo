/* =====================================================================
   Interfaz de Préstamos y amortización: el préstamo, el sistema, la gráfica
   de cada cuota repartida entre intereses y capital (por años si hay muchas
   cuotas), el cuadro de amortización y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en prestamos/calculo.js.
   ===================================================================== */
(() => {
  const P = Prestamos, { f, dinero, num } = Eco;
  Calculadora.monta({
    C: P, carpeta: 'prestamos', app: 'PrestamosApp',
    nota: 'El plazo va en años (1,5 son 18 meses) y el TIN en % anual. La comisión de apertura es opcional y solo cambia la TAE.',
    campos: () => [
      { k: 'sistema', nom: 'Sistema', tipo: 'sel', ops: Object.entries(P.SISTEMAS) },
      { k: 'c', nom: 'Capital prestado', un: '€' }, { k: 'i', nom: 'TIN', un: '% anual' }, { k: 'anos', nom: 'Plazo', un: 'años' },
      { k: 'm', nom: 'Pagos', tipo: 'sel', ops: [['12', 'Mensuales'], ['4', 'Trimestrales'], ['2', 'Semestrales'], ['1', 'Anuales']] },
      { k: 'comision', nom: 'Comisión de apertura', un: '%' },
    ],
    resumen: (s) => [
      [s.sis === 'frances' ? 'Cuota' : 'Primera cuota', dinero(s.filas[0].cuota)], ...(s.sis === 'frances' ? [] : [['Última cuota', dinero(s.filas[s.n - 1].cuota)]]),
      ['Intereses totales', dinero(s.intereses)], ['Total pagado', dinero(s.total)], ['TAE', `${f(100 * s.tae, 5)} %`], ['Número de cuotas', String(s.n)],
    ],
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>${s.uno[0].toUpperCase() + s.uno.slice(1)}</th><th>Cuota</th><th>Intereses</th><th>Amortización</th><th>Amortizado</th><th>Pendiente</th></tr></thead><tbody><tr><td>0</td><td></td><td></td><td></td><td></td><td>${num(s.C)}</td></tr>${s.filas.map((r) => `<tr><td>${r.k}</td><td>${num(r.cuota)}</td><td>${num(r.I)}</td><td>${num(r.A)}</td><td>${num(r.amort)}</td><td>${num(r.pend)}</td></tr>`).join('')}</tbody><tfoot><tr><td>∑</td><td>${num(s.total)}</td><td>${num(s.intereses)}</td><td>${num(s.C)}</td><td></td><td></td></tr></tfoot></table>`,
    grafica: (s) => {
      // con muchas cuotas se suma lo de cada año
      const anual = s.n > 60, g = [];
      if (anual) for (let a = 0; a < s.n / s.m; a++) { const t = s.filas.slice(a * s.m, (a + 1) * s.m); g.push({ k: a + 1, I: t.reduce((x, r) => x + r.I, 0), A: t.reduce((x, r) => x + r.A, 0) }); }
      else g.push(...s.filas);
      const max = Math.max(...g.map((r) => r.I + r.A));
      return { x: [0.3, g.length + 0.7], y: [0, max * 1.12], fy: (v) => num(v, 0), ejeX: anual ? 'Año' : s.uno[0].toUpperCase() + s.uno.slice(1), ejeY: anual ? '€ pagados cada año' : '€',
        series: [{ tipo: 'barras', ancho: 0.75, pts: g.map((r) => [r.k, r.I + r.A]), color: '--serie-2' }, { tipo: 'barras', ancho: 0.75, pts: g.map((r) => [r.k, r.A]), color: '--serie-1' }] };
    },
    leyenda: (s) => `Cada barra es ${s.n > 60 ? 'lo pagado en un año' : 'una cuota'}: <b>abajo</b>, el capital que se amortiza; <b>arriba</b>, los intereses.`,
  });
})();
