/* =====================================================================
   Interfaz de Balance y cuenta de resultados: las partidas de la cuenta de
   pérdidas y ganancias y del balance, las dos cuentas escritas en tablas, el
   balance dibujado en dos columnas (activo y patrimonio neto más pasivo) y el
   desarrollo. Se monta con Calculadora.monta (calculadora.js); el cálculo está
   en balance/calculo.js.
   ===================================================================== */
(() => {
  const B = Balance, { dinero, num } = Eco, d = (x) => num(x, 2);
  const pc = (x) => `${num(100 * x, 2)} %`;
  // partidas al azar que cuadran (en miles de euros), para el modo práctica
  function azar() {
    const r = (a, b, p = 1) => 1000 * p * Math.round((a + Math.random() * (b - a)) / p);
    const ventas = r(300, 1500, 4), aprov = r(0.25 * ventas / 1000, 0.5 * ventas / 1000, 4), pers = r(0.15 * ventas / 1000, 0.3 * ventas / 1000, 4), otros = r(0.05 * ventas / 1000, 0.12 * ventas / 1000, 4);
    const amort = r(0.03 * ventas / 1000, 0.08 * ventas / 1000, 4), gf = r(2, 20, 4), bai = ventas - aprov - pers - otros - amort - gf, bn = bai > 0 ? bai * 0.75 : bai;
    const mat = r(100, 600), inti = r(0, 50), ifl = r(0, 60), ex = r(20, 120), deu = r(20, 120), teso = r(10, 80), at = mat + inti + ifl + ex + deu + teso;
    const prov = r(0.08 * at / 1000, 0.16 * at / 1000), dcp = r(0.03 * at / 1000, 0.1 * at / 1000), dlp = r(0.1 * at / 1000, 0.25 * at / 1000), cap = r(0.25 * at / 1000, 0.4 * at / 1000);
    const s = { ventas, aprov, pers, otros, amort, ingf: 0, gf, t: 25, mat, inti, ifl, ex, deu, teso, cap, res: at - cap - dlp - prov - dcp - bn, dlp, prov, dcp };
    return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, String(v)]));
  }
  const fila = (n, v, cls = '') => `<tr${cls ? ` class="${cls}"` : ''}><td>${n}</td><td>${d(v)}</td></tr>`;
  const tabla2 = (tit, filas) => `<table class="tabla-eco"><thead><tr><th>${tit}</th><th>Euros</th></tr></thead><tbody>${filas}</tbody></table>`;
  Calculadora.monta({
    C: B, carpeta: 'balance', app: 'BalanceApp', azar,
    usar: [{ a: 'ratios', nombre: 'Ratios financieros', datos: (s, sc) => ({ anc: String(s.anc), ex: String(s.ex), re: String(s.deu), di: String(s.teso), pn: String(Math.round(100 * s.pn) / 100), pnc: String(s.pnc), pc: String(s.pc), ventas: String(s.ventas), baii: String(Math.round(100 * s.rexp) / 100), gf: String(s.gf), t: String(sc.t || '25') }) }],
    enunciado: () => 'Con las partidas de esta empresa, elabora la cuenta de pérdidas y ganancias (EBITDA, resultado de explotación, BAI y resultado del ejercicio) y el balance de situación, comprueba que cuadra y calcula el fondo de maniobra.',
    nota: 'Los importes en euros. El resultado del ejercicio no se escribe: sale de la cuenta de pérdidas y ganancias y se suma al patrimonio neto del balance. El balance tiene que cuadrar (activo = patrimonio neto + pasivo); las reservas pueden ser negativas.',
    campos: () => [
      { sep: 'Cuenta de pérdidas y ganancias', k: 'ventas', nom: 'Ventas (importe neto de la cifra de negocios)', un: '€' }, { k: 'aprov', nom: 'Aprovisionamientos (compras y consumos)', un: '€' }, { k: 'pers', nom: 'Gastos de personal', un: '€' },
      { k: 'otros', nom: 'Otros gastos de explotación', un: '€' }, { k: 'amort', nom: 'Amortización del inmovilizado', un: '€' },
      { k: 'ingf', nom: 'Ingresos financieros', un: '€' }, { k: 'gf', nom: 'Gastos financieros', un: '€' }, { k: 't', nom: 'Impuesto sobre beneficios', un: '%' },
      { sep: 'Activo no corriente', k: 'mat', nom: 'Inmovilizado material (neto)', un: '€' }, { k: 'inti', nom: 'Inmovilizado intangible (neto)', un: '€' }, { k: 'ifl', nom: 'Inversiones financieras a largo plazo', un: '€' },
      { sep: 'Activo corriente', k: 'ex', nom: 'Existencias', un: '€' }, { k: 'deu', nom: 'Deudores (clientes)', un: '€' }, { k: 'teso', nom: 'Tesorería (caja y bancos)', un: '€' },
      { sep: 'Patrimonio neto', k: 'cap', nom: 'Capital', un: '€' }, { k: 'res', nom: 'Reservas', un: '€' },
      { sep: 'Pasivo', k: 'dlp', nom: 'Deudas a largo plazo', un: '€' }, { k: 'prov', nom: 'Proveedores', un: '€' }, { k: 'dcp', nom: 'Otras deudas a corto plazo', un: '€' },
    ],
    resumen: (s) => [['EBITDA', dinero(s.ebitda)], ['Resultado de explotación', dinero(s.rexp)], ['BAI', dinero(s.bai)], ['Resultado del ejercicio', dinero(s.bn)], ['Activo total', dinero(s.at)], ['Fondo de maniobra', dinero(s.fm)]],
    tabla: (s) => `<div class="dos-cuentas">${tabla2('Cuenta de pérdidas y ganancias',
      fila('Ventas', s.ventas) + fila('− Aprovisionamientos', -s.aprov) + fila('− Gastos de personal', -s.pers) + fila('− Otros gastos de explotación', -s.otros) + fila('EBITDA', s.ebitda, 'sub') +
      fila('− Amortización', -s.amort) + fila('Resultado de explotación', s.rexp, 'sub') + fila('+ Ingresos financieros', s.ingf) + fila('− Gastos financieros', -s.gf) + fila('Resultado financiero', s.rfin, 'sub') +
      fila('Resultado antes de impuestos (BAI)', s.bai, 'sub') + fila(`− Impuesto sobre beneficios (${num(100 * s.t, 2)} %)`, -s.imp) + fila('Resultado del ejercicio', s.bn, 'tot'))}
      ${tabla2('Balance de situación',
      fila('Inmovilizado material', s.mat) + fila('Inmovilizado intangible', s.inti) + fila('Inversiones financieras a l/p', s.ifl) + fila('A) Activo no corriente', s.anc, 'sub') +
      fila('Existencias', s.ex) + fila('Deudores', s.deu) + fila('Tesorería', s.teso) + fila('B) Activo corriente', s.ac, 'sub') + fila('TOTAL ACTIVO (A + B)', s.at, 'tot') +
      fila('Capital', s.cap) + fila('Reservas', s.res) + fila('Resultado del ejercicio', s.bn) + fila('A) Patrimonio neto', s.pn, 'sub') +
      fila('Deudas a largo plazo', s.dlp) + fila('B) Pasivo no corriente', s.pnc, 'sub') + fila('Proveedores', s.prov) + fila('Otras deudas a corto plazo', s.dcp) + fila('C) Pasivo corriente', s.pc, 'sub') +
      fila('TOTAL PN Y PASIVO (A + B + C)', s.pn + s.pt, 'tot'))}</div>`,
    grafica: (s) => {
      // dos columnas apiladas: el activo (de abajo arriba: no corriente, existencias, deudores, tesorería) y su financiación
      const col = (x, partes, color) => { let base = 0; return partes.map(([v, a]) => { const p = { tipo: 'area', pts: [[x - 0.32, base + v], [x + 0.32, base + v]], base, color, alfa: a }; base += v; return p; }); };
      const A = [[s.anc, 0.85], [s.ex, 0.6], [s.deu, 0.42], [s.teso, 0.25]], P = [[Math.max(s.pn, 0), 0.85], [s.pnc, 0.55], [s.pc, 0.28]];
      const et = (x, partes, nombres) => { let b = 0; return partes.map(([v], k) => { const e = { x: x - 0.3, y: b + v / 2 - 0.02 * s.at, texto: v > 0.06 * s.at ? nombres[k] : '' }; b += v; return e; }); };
      return { x: [0.4, 2.6], y: [0, s.at * 1.04], fx: (v) => (Math.abs(v - 1) < 0.01 ? 'Activo' : Math.abs(v - 2) < 0.01 ? 'PN y pasivo' : ''), fy: (v) => num(v, 0), ejeY: 'Euros',
        series: [...col(1, A, '--serie-1'), ...col(2, P, '--serie-2')],
        horizontales: [{ y: s.ac, color: '--serie-1', texto: '' }, { y: s.pc, color: '--serie-2', texto: s.fm >= 0 ? 'FM > 0' : 'FM < 0' }],
        etiquetas: [...et(1, A, ['No corriente', 'Existencias', 'Deudores', 'Tesorería']), ...et(2, P, ['Patrimonio neto', 'Pasivo no corriente', 'Pasivo corriente'])] };
    },
    leyenda: (s) => `<b>Izquierda</b>: el activo, de lo menos líquido (abajo) a lo más líquido. <b>Derecha</b>: cómo se financia, de lo más estable a lo más exigible; ambas columnas miden lo mismo, porque el balance cuadra. Margen neto: el ${pc(s.margen)} de las ventas queda como resultado del ejercicio.`,
  });
})();
