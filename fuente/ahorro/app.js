/* =====================================================================
   Interfaz de Ahorro e inflación a largo plazo: lo que se busca, los datos
   del plan, la gráfica del saldo año a año en euros de entonces y en euros
   de hoy frente a lo aportado, la tabla y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en ahorro/calculo.js.
   ===================================================================== */
(() => {
  const A = Ahorro, { f, dinero, num } = Eco;
  const tp = (x) => `${f(100 * x, 5)} %`;
  Calculadora.monta({
    C: A, carpeta: 'ahorro', app: 'AhorroApp',
    nota: 'La rentabilidad y la inflación van en % anual. Las aportaciones se hacen al final de cada periodo; si suben con la inflación, la que escribes es la del primer año.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(A.MODOS) }];
      if (sc.modo === 'poder') return [...cs, { k: 'x', nom: 'Cantidad', un: '€' }, { k: 'pi', nom: 'Inflación π', un: '% anual' }, { k: 'n', nom: 'Años', un: 'años' }];
      cs.push({ k: 'c0', nom: 'Capital inicial C₀', un: '€' });
      cs.push(sc.modo === 'objetivo' ? { k: 'objetivo', nom: 'Objetivo, en euros de hoy', un: '€' } : { k: 'a', nom: 'Aportación a', un: '€' });
      cs.push({ k: 'm', nom: 'Aportaciones', tipo: 'sel', ops: Object.entries(A.PERIODOS).map(([k, v]) => [k, v[0][0].toUpperCase() + v[0].slice(1) + 'es']) });
      cs.push({ k: 'indexa', nom: 'Subir la aportación con la inflación', tipo: 'sel', ops: [['no', 'No, siempre la misma'], ['si', 'Sí, cada año']] });
      cs.push({ k: 'r', nom: 'Rentabilidad r', un: '% anual' }, { k: 'pi', nom: 'Inflación π', un: '% anual' }, { k: 'n', nom: 'Plazo', un: 'años' });
      return cs;
    },
    resumen: (s) => (s.modo === 'poder'
      ? [['Valor en euros de hoy', dinero(s.real)], ['Pérdida de poder adquisitivo', `${f(100 * (1 - 1 / s.def), 4)} %`], ['Los precios se multiplican por', f(s.def, 5)]]
      : [...(s.modo === 'objetivo' ? [[`Aportación por ${s.uno}${s.indexa ? ' (primer año)' : ''}`, dinero(s.a), true]] : []),
        ['Saldo final', dinero(s.final)], ['En euros de hoy', dinero(s.real)], ['Aportado', dinero(s.aportado)], ['Rentabilidad ganada', dinero(s.final - s.aportado)], ['Tipo real', tp(s.rr)]]),
    tabla: (s) => (s.modo === 'poder' ? '' : `<table class="tabla-eco"><thead><tr><th>Año</th>${s.indexa ? `<th>Aportación por ${s.uno}</th>` : ''}<th>Aportado</th><th>Saldo</th><th>En euros de hoy</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${r.t}</td>${s.indexa ? `<td>${r.t ? num(r.aj) : '—'}</td>` : ''}<td>${num(r.ap)}</td><td>${num(r.s)}</td><td>${num(r.real)}</td></tr>`).join('')}</tbody></table>`),
    grafica: (s) => {
      const fy = (v) => num(v, 0), x = [0, s.n];
      if (s.modo === 'poder') return { x, y: [0, s.x * 1.08], fy, ejeX: 'Años', ejeY: 'Euros', series: [{ pts: [[0, s.x], [s.n, s.x]], color: '--serie-1', discontinua: true }, { pts: Array.from({ length: 81 }, (_, k) => { const t = (s.n * k) / 80; return [t, s.x / (1 + s.pi) ** t]; }), color: '--serie-2' }] };
      const L = (k) => s.filas.map((r) => [r.t, r[k]]);
      return { x, y: Eco.rango(s.filas.flatMap((r) => [r.s, r.real, r.ap]).concat(0)), fy, ejeX: 'Años', ejeY: 'Euros',
        series: [{ tipo: 'area', pts: L('ap'), color: '--serie-3', alfa: 0.25 }, { pts: L('s'), color: '--serie-1' }, { pts: L('real'), color: '--serie-2' }] };
    },
    leyenda: (s) => (s.modo === 'poder' ? '<b>Discontinua</b>: la cantidad, que no cambia. <b>Curva roja</b>: lo que se puede comprar con ella, en euros de hoy.' : '<b>Azul</b>: el saldo en euros de cada año. <b>Rojo</b>: el mismo saldo en euros de hoy (descontada la inflación). <b>Zona morada</b>: lo que has puesto tú.'),
  });
})();
