/* =====================================================================
   Interfaz de Ratios financieros: el balance y la cuenta de resultados, el
   balance dibujado en dos columnas (activo y patrimonio neto más pasivo)
   con el fondo de maniobra, la tabla de ratios con su valor recomendado y
   el desarrollo. Se monta con Calculadora.monta (calculadora.js); el
   cálculo está en ratios/calculo.js.
   ===================================================================== */
(() => {
  const R = Ratios, { f, dinero, num } = Eco;
  const tp = (x) => (x === null ? '—' : `${f(100 * x, 4)} %`), r3 = (x) => (isFinite(x) ? f(x, 4) : '∞');
  const ESTADO = { bien: 'dentro', bajo: 'por debajo', alto: 'por encima' };
  // un balance al azar que cuadra (en miles de euros redondos), para el modo práctica
  function azar() {
    const r = (a, b) => 1000 * Math.round(a + Math.random() * (b - a)), anc = r(100, 600), ex = r(10, 100), re = r(10, 100), di = r(5, 60), at = anc + ex + re + di;
    const pc = r(0.15 * at / 1000, 0.35 * at / 1000), pnc = r(0.1 * at / 1000, 0.3 * at / 1000), baii = r(0.04 * at / 1000, 0.18 * at / 1000);
    return { anc: String(anc), ex: String(ex), re: String(re), di: String(di), pn: String(at - pc - pnc), pnc: String(pnc), pc: String(pc), ventas: String(r(at / 1000, 2.5 * at / 1000)), baii: String(baii), gf: String(Math.round(0.05 * (pc + pnc) / 100) * 100), t: '25' };
  }
  Calculadora.monta({
    C: R, carpeta: 'ratios', app: 'RatiosApp', azar,
    enunciado: () => 'Con el balance y la cuenta de resultados de esta empresa, calcula el fondo de maniobra, los ratios de liquidez, solvencia y endeudamiento y las rentabilidades económica y financiera.',
    nota: 'Los importes en euros. El realizable son los deudores y clientes; el disponible, la caja y los bancos. El BAII es el resultado de explotación (antes de intereses e impuestos).',
    campos: (sc) => [
      { k: 'comparar', nom: 'Comparar con otra situación', tipo: 'sel', ops: [['no', 'No, solo una empresa'], ['si', 'Sí: otra empresa u otro año']] },
      { k: 'anc', nom: 'Activo no corriente', un: '€' }, { k: 'ex', nom: 'Existencias', un: '€' }, { k: 're', nom: 'Realizable', un: '€' }, { k: 'di', nom: 'Disponible', un: '€' },
      { k: 'pn', nom: 'Patrimonio neto', un: '€' }, { k: 'pnc', nom: 'Pasivo no corriente', un: '€' }, { k: 'pc', nom: 'Pasivo corriente', un: '€' },
      { k: 'ventas', nom: 'Ventas', un: '€' }, { k: 'baii', nom: 'BAII', un: '€' }, { k: 'gf', nom: 'Gastos financieros', un: '€' }, { k: 't', nom: 'Impuesto sobre beneficios', un: '%' },
      ...(sc.comparar === 'si' ? [['anc', 'Activo no corriente'], ['ex', 'Existencias'], ['re', 'Realizable'], ['di', 'Disponible'], ['pn', 'Patrimonio neto'], ['pnc', 'Pasivo no corriente'], ['pc', 'Pasivo corriente'], ['ventas', 'Ventas'], ['baii', 'BAII'], ['gf', 'Gastos financieros'], ['t', 'Impuesto sobre beneficios']]
        .map(([k, nom], j) => ({ k: k + '2', nom: `${nom} (B)`, un: k === 't' ? '%' : '€', ...(j === 0 ? { sep: 'Situación B (otra empresa u otro año)' } : {}) })) : []),
    ],
    resumen: (s) => s.b ? [['Fondo de maniobra A / B', `${dinero(s.fm)} / ${dinero(s.b.fm)}`], ['Liquidez general A / B', `${r3(s.ratios[0].val)} / ${r3(s.b.ratios[0].val)}`], ['Endeudamiento A / B', `${r3(s.ratios[4].val)} / ${r3(s.b.ratios[4].val)}`], ['ROA A / B', `${tp(s.roa)} / ${tp(s.b.roa)}`], ['ROE A / B', `${tp(s.roe)} / ${tp(s.b.roe)}`], ['Resultado A / B', `${dinero(s.bn)} / ${dinero(s.b.bn)}`]] : [['Fondo de maniobra', dinero(s.fm)], ['Liquidez general', r3(s.ratios[0].val)], ['Endeudamiento', r3(s.ratios[4].val)], ['Rentabilidad económica (ROA)', tp(s.roa)], ['Rentabilidad financiera (ROE)', tp(s.roe)], ['Resultado del ejercicio', dinero(s.bn)]],
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>Ratio</th><th>${s.b ? 'A' : 'Valor'}</th>${s.b ? '<th>B</th>' : ''}<th>Recomendado</th><th>Valoración</th></tr></thead><tbody>${s.ratios.map((x) => `<tr><td>${x.nombre} <small>${x.formula}</small></td><td>${r3(x.val)}</td>${s.b ? `<td>${r3(s.b.ratios[s.ratios.indexOf(x)].val)}</td>` : ''}<td>${x.rango[0] === null ? `menos de ${r3(x.rango[1])}` : `${r3(x.rango[0])} a ${r3(x.rango[1])}`}</td><td class="val-${x.estado}">${ESTADO[x.estado]}${s.b ? ` (A) / ${ESTADO[s.b.ratios[s.ratios.indexOf(x)].estado]} (B)` : ''}</td></tr>`).join('')}</tbody></table>`,
    grafica: (s) => {
      // dos columnas apiladas: el activo (de abajo arriba: no corriente, existencias, realizable, disponible) y su financiación
      const col = (x, partes, color) => { let base = 0; return partes.map(([v, a]) => { const p = { tipo: 'area', pts: [[x - 0.32, base + v], [x + 0.32, base + v]], base, color, alfa: a }; base += v; return p; }); };
      const A = [[s.anc, 0.85], [s.ex, 0.6], [s.re, 0.42], [s.di, 0.25]], P = [[s.pn, 0.85], [s.pnc, 0.55], [s.pc, 0.28]];
      const et = (x, partes, nombres) => { let b = 0; return partes.map(([v], k) => { const e = { x: x - 0.3, y: b + v / 2 - 0.02 * s.at, texto: v > 0.06 * s.at ? nombres[k] : '' }; b += v; return e; }); };
      return { x: [0.4, 2.6], y: [0, s.at * 1.04], fx: (v) => (Math.abs(v - 1) < 0.01 ? 'Activo' : Math.abs(v - 2) < 0.01 ? 'PN y pasivo' : ''), fy: (v) => num(v, 0), ejeY: 'Euros',
        series: [...col(1, A, '--serie-1'), ...col(2, P, '--serie-2')],
        horizontales: [{ y: s.ac, color: '--serie-1', texto: '' }, { y: s.pc, color: '--serie-2', texto: s.fm >= 0 ? 'FM > 0' : 'FM < 0' }],
        etiquetas: [...et(1, A, ['No corriente', 'Existencias', 'Realizable', 'Disponible']), ...et(2, P, ['Patrimonio neto', 'Pasivo no corriente', 'Pasivo corriente'])] };
    },
    leyenda: (s) => `<b>Izquierda</b>: el activo, de lo menos líquido (abajo) a lo más líquido. <b>Derecha</b>: cómo se financia, de lo más estable a lo más exigible. Las líneas discontinuas marcan el activo corriente (azul) y el pasivo corriente (rojo): el fondo de maniobra, ${dinero(s.fm)}, es la diferencia.`,
  });
})();
