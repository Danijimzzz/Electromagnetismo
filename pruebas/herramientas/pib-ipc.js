/* Comprobación de PIB, IPC e inflación: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo pib-ipc). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'PIB, IPC e inflación';
  const C = require(path.join(fuente, 'pib-ipc', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: nominal 2023 = 12·105 + 5,5·210 + 22·55 = 3625; real = 10·105 + 5·210 + 20·55 = 3200; deflactor 113,28125
    const t = ej('tres-bienes').anos; cerca(t[1].nom, 3625, 1e-9, 'PIB nominal 2023'); cerca(t[1].real, 3200, 1e-9, 'PIB real 2023'); cerca(t[1].def, 113.28125, 1e-9, 'deflactor 2023');
    cerca(t[2].crec, 0.03125, 1e-12, 'crecimiento 2024 (3300/3200)'); cerca(t[2].infl, (4130 / 3300) / (3625 / 3200) - 1, 1e-12, 'inflación 2024');
    cerca(ej('dos-bienes').anos[1].crec, 1370 / 1400 - 1, 1e-12, 'crecimiento negativo');
    // sueldo de 2024 en euros de 2020: 22900·100/118,9
    const s = ej('salario'); cerca(s.filas[4].real, 2290000 / 118.9, 1e-9, 'sueldo real 2024'); cerca(s.filas[1].infl, 0.031, 1e-12, 'inflación 2021');
    const a = ej('agregados'); cerca(a.pib, 970, 1e-9, 'PIB'); cerca(a.pnb, 955, 1e-9, 'PNB'); cerca(a.pnn, 835, 1e-9, 'PNN'); cerca(a.rn, 745, 1e-9, 'renta nacional');
    error({ modo: 'pib', anos: '2020 2021', base: '2020', bienes: '1 2 3' }, 'columnas impares');
    error({ modo: 'pib', anos: '2020 2021', base: '2019', bienes: '1 2 3 4' }, 'año base que no está');
    error({ modo: 'deflactar', ref: '2020', serie: '2020 100 0\n2021 110 105' }, 'IPC 0');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, PIB nominal y real, deflactor, deflactar con el IPC, agregados y errores`);
  }
  return Com.navegador({ publico, carpeta: 'pib-ipc', nombre: N, app: 'PibIpcApp', C, pagina, mal, malo: { k: 'base', v: '1990' } });
};
