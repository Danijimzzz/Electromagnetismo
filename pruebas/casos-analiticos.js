/* ===== Casos analíticos cerrados de Electromagnetismo (EM.EM-1, Fase 14) =====
   Resultados que salen de una fórmula exacta y que cualquier solucionario da: ángulo de Brewster, frecuencia de corte c/2a, λ/4 que
   adapta, dipolo de media onda (D = 1,64 y 73 Ω), cavidad TE101, ley de Gauss, solenoide largo, condensador plano, Larmor… Sin navegador.
   node pruebas/casos-analiticos.js (lo llama comprobar.js) */
const path = require('path'), fuente = path.join(__dirname, '..', 'fuente');
global.Expr = require(path.join(fuente, 'matematicas', 'expresion.js')); global.Herramienta = require(path.join(fuente, 'herramienta.js'));
const L = (c, f = 'calculo.js') => require(path.join(fuente, c, f));
let fallos = 0, hechos = 0;
const igual = (nombre, a, b, rel = 1e-6) => { hechos++; if (!(Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b), 1e-300))) { fallos++; console.log(`✗ ${nombre}: ${a} y no ${b}`); } };
const C0 = 299792458, E0 = 8.8541878128e-12, MU0 = 1.25663706212e-6;
const intenta = (nombre, fn) => { try { fn(); } catch (e) { fallos++; console.log(`✗ ${nombre}: ${e.message}`); } };

intenta('Fresnel', () => { const F = L('fresnel');
  for (const [n1, n2] of [[1, 1.5], [1, 1.33], [1.5, 1], [1, 2.4]]) {
    const thB = Math.atan(n2 / n1) * 180 / Math.PI, c = (x) => String(x).replace('.', ','), r = F.resolver({ dato: 'n', n1: c(n1), n2: c(n2), theta: c(thB), E0: '', lambda: '' });
    igual(`Brewster n=${n1}/${n2}: la luz polarizada en el plano de incidencia no se refleja`, r.Rl + 1, 1, 1e-9); igual(`Brewster n=${n1}/${n2}: la perpendicular sí (Rs = sen²(θi−θt)/sen²(θi+θt) > 0)`, r.Rp > 0 ? 1 : 0, 1, 0);
    igual(`Incidencia normal n=${n1}/${n2}: R = ((n₂−n₁)/(n₂+n₁))²`, F.resolver({ dato: 'n', n1: c(n1), n2: c(n2), theta: '0', E0: '', lambda: '' }).Rp, ((n2 - n1) / (n2 + n1)) ** 2, 1e-9);
  }
  const rt = F.resolver({ dato: 'n', n1: '1,5', n2: '1', theta: '45', E0: '', lambda: '' }); igual('Reflexión total (θ = 45° > θc = 41,8°): R = 1', rt.Rl, 1, 1e-9); igual('Reflexión total: Rp también', rt.Rp, 1, 1e-9);
});
intenta('Guías de onda', () => { const G = L('guias-onda'); const a = 22.86e-3;
  igual('Guía rectangular, TE10: fc = c/2a', G.resolver({ a: '22,86', b: '10,16', er: '1', f: '10', tipo: 'TE', m: '1', n: '0' }).fc, C0 / (2 * a), 1e-9);
  igual('Guía con er = 4: fc = c/(2a√er)', G.resolver({ a: '22,86', b: '10,16', er: '4', f: '10', tipo: 'TE', m: '1', n: '0' }).fc, C0 / (2 * a * 2), 1e-9);
  igual('Guía, TE01: fc = c/2b', G.resolver({ a: '22,86', b: '10,16', er: '1', f: '10', tipo: 'TE', m: '0', n: '1' }).fc, C0 / (2 * 10.16e-3), 1e-9);
  const r = G.resolver({ a: '22,86', b: '10,16', er: '1', f: '10', tipo: 'TE', m: '1', n: '0' }); igual('Guía a 10 GHz: vf·vg = c²', r.vf * r.vg, C0 * C0, 1e-6);
});
intenta('Líneas', () => { const T = L('lineas-transmision');
  const r = T.resolver({ Z0: '50', R: '100', X: '0', f: '100', er: '1', l: '0,75', lu: 'm' });
  igual('Línea λ/4 (3 m a 100 MHz): Zin = Z0²/ZL = 25 Ω', r.zin.re, 25, 1e-4); igual('ROE de 100 Ω sobre 50 Ω = 2', r.roe, 2, 1e-9);
  const m = T.resolver({ Z0: '50', R: '100', X: '0', f: '100', er: '1', l: '1,5', lu: 'm' }); igual('Línea λ/2: Zin = ZL', m.zin.re, 100, 1e-4);
  const a = T.resolver({ Z0: '50', R: '50', X: '0', f: '100', er: '1', l: '0,6', lu: 'm' }); igual('Línea adaptada: ROE = 1', a.roe, 1, 1e-9);
});
intenta('Antena', () => { const A = L('antena'), r = A.resolver({ tipo: 'media', f: '100e6', L: '', I: '2', r: '1000', th: '90' });
  igual('Dipolo λ/2: D = 1,64', r.D, 1.64, 1e-3); igual('Dipolo λ/2: 2,15 dBi', r.dBi, 2.15, 1e-3); igual('Dipolo λ/2: Rrad = 73,1 Ω', r.Rrad, 73.1, 1e-3); igual('Dipolo λ/2: ancho de haz 78°', r.hpbw, 78, 1e-2);
});
intenta('Cavidades', () => { const V = L('cavidades'), a = 22.86e-3, d = 30e-3, r = V.resolver({ geo: 'rect', a: '22,86', b: '10,16', d: '30', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '0', i3: '1' });
  igual('Cavidad rectangular TE101: f₀ = (c/2)√(1/a² + 1/d²)', r.f0, (C0 / 2) * Math.sqrt(1 / a ** 2 + 1 / d ** 2), 1e-9);
});
intenta('Gauss', () => { const M = L('maxwell'), r = M.resolver({ modo: 'gauss', Q: '2', R: '0,1', r: '0,3' });
  igual('Esfera, Q = 2 µC a 0,3 m: E = kQ/r² (en kV/m)', r.E * 1e3, 2e-6 / (4 * Math.PI * E0 * 0.09), 1e-6); igual('Flujo = Q/ε₀ (en kV·m)', r.Phi * 1e3, 2e-6 / E0, 1e-6);
  const dentro = M.resolver({ modo: 'gauss', Q: '2', R: '0,1', r: '0,05' }); igual('Dentro de una esfera conductora o hueca la carga encerrada es 0 o proporcional', dentro.Qint <= 2e-6 + 1e-12 ? 1 : 0, 1, 0);
});
intenta('Inducción', () => { const I = L('induccion', 'fisica.js'), r = I.autoinduccion({ geo: 'solenoide', N: '1000', l: '50', r: '2', mur: '1' });
  igual('Solenoide largo: L = μ₀N²πr²/l', r.res.L, MU0 * 1000 ** 2 * Math.PI * 0.02 ** 2 / 0.5, 1e-9); const mu = I.autoinduccion({ geo: 'solenoide', N: '1000', l: '50', r: '2', mur: '500' }); igual('Con μr = 500, L se multiplica por 500', mu.res.L / r.res.L, 500, 1e-9);
});
intenta('Condensadores', () => { const Cn = L('condensadores', 'fisica.js'), r = Cn.resolver({ geo: 'plano', S: '100', d: '2', disposicion: 'serie', capas: [{ t: '2', er: '1' }], fuente: 'V', V: '100' });
  const Cc = r.C; igual('Plano en el vacío: C = ε₀S/d', Cc, E0 * 100e-4 / 2e-3, 1e-6);
  const v = Cn.resolver({ geo: 'plano', S: '100', d: '2', disposicion: 'serie', capas: [{ t: '2', er: '5' }], fuente: 'V', V: '100' }); igual('Con un dieléctrico que llena todo, C se multiplica por εr', v.C / Cc, 5, 1e-9);
});
// CIR.CI-3 · Control y Transformada z: estabilidad con resultado conocido (Routh con K crítico, polos dentro, sobre y fuera del círculo unidad)
intenta('Control', () => { const K = L('control');
  const rk = K.resolver({ modo: 'routh', num: '1', den: 's(s+1)(s+2)', K: '1' }).rk; igual('Control: K crítico de K/(s(s+1)(s+2)) = 6', rk.criticos[0].K, 6, 1e-9); igual('Control: ω del cruce = √2', rk.criticos[0].w, Math.SQRT2, 1e-9);
  for (const [k, est] of [['5', true], ['5,99', true], ['6', false], ['7', false], ['0,1', true]]) { hechos++; if (K.resolver({ modo: 'routh', num: '1', den: 's(s+1)(s+2)', K: k }).estable !== est) { fallos++; console.log(`✗ Control: K = ${k} debería ${est ? '' : 'no '}ser estable`); } }
  const iv = rk.intervalos; igual('Control: estable de 0 a 6', iv[0].b, 6, 1e-9); igual('Control: 2 polos en el semiplano derecho para K > 6', iv[1].rhp, 2, 0);
});
intenta('Transformada z', () => { const Z = L('transformada-z');
  for (const [a, est, rm] of [['1 -0,5', 'estable', 0.5], ['1 -1,25', 'inestable', 1.25], ['1 -2,5 1', 'inestable', 2], ['1 0 1', 'marginal', 1], ['1 -1,2 0,72', 'estable', Math.hypot(0.6, 0.6)]]) {
    const q = Z.resolver({ modo: 'sistema', b: '1', a, Nn: '12' }); hechos++; if (q.estab !== est) { fallos++; console.log(`✗ z: 1/(${a}) debería ser ${est} y sale ${q.estab}`); } igual(`z: radio del polo mayor de 1/(${a})`, q.rmax, rm, 1e-9);
  } });
console.log(`Casos analíticos de Electromagnetismo: ${hechos} comprobaciones; ${fallos} fallos.`);
process.exit(fallos ? 1 : 0);
