/* =====================================================================
   Datos de los 118 elementos, compartidos por las herramientas de química
   (tabla periódica, masa molar, configuración electrónica).
   Cada fila: Z | símbolo | nombre | masa atómica (u; entre corchetes, la del isótopo más estable)
            | categoría | electronegatividad de Pauling | 1.ª energía de ionización (kJ/mol)
            | radio atómico calculado (pm, Clementi y Raimondi, 1967)
   Un campo vacío es un dato desconocido o no medido.
   Categorías: a alcalino, t alcalinotérreo, m metal de transición, l lantánido, c actínido,
   p otro metal (bloque p), s metaloide, n no metal, h halógeno, g gas noble.
   ===================================================================== */
const Elementos = (() => {
  const FILAS = `1|H|Hidrógeno|1.008|n|2.20|1312|53
2|He|Helio|4.0026|g||2372|31
3|Li|Litio|6.94|a|0.98|520|167
4|Be|Berilio|9.0122|t|1.57|900|112
5|B|Boro|10.81|s|2.04|801|87
6|C|Carbono|12.011|n|2.55|1086|67
7|N|Nitrógeno|14.007|n|3.04|1402|56
8|O|Oxígeno|15.999|n|3.44|1314|48
9|F|Flúor|18.998|h|3.98|1681|42
10|Ne|Neón|20.180|g||2081|38
11|Na|Sodio|22.990|a|0.93|496|190
12|Mg|Magnesio|24.305|t|1.31|738|145
13|Al|Aluminio|26.982|p|1.61|578|118
14|Si|Silicio|28.085|s|1.90|787|111
15|P|Fósforo|30.974|n|2.19|1012|98
16|S|Azufre|32.06|n|2.58|1000|88
17|Cl|Cloro|35.45|h|3.16|1251|79
18|Ar|Argón|39.95|g||1521|71
19|K|Potasio|39.098|a|0.82|419|243
20|Ca|Calcio|40.078|t|1.00|590|194
21|Sc|Escandio|44.956|m|1.36|633|184
22|Ti|Titanio|47.867|m|1.54|659|176
23|V|Vanadio|50.942|m|1.63|651|171
24|Cr|Cromo|51.996|m|1.66|653|166
25|Mn|Manganeso|54.938|m|1.55|717|161
26|Fe|Hierro|55.845|m|1.83|763|156
27|Co|Cobalto|58.933|m|1.88|760|152
28|Ni|Níquel|58.693|m|1.91|737|149
29|Cu|Cobre|63.546|m|1.90|746|145
30|Zn|Zinc|65.38|m|1.65|906|142
31|Ga|Galio|69.723|p|1.81|579|136
32|Ge|Germanio|72.630|s|2.01|762|125
33|As|Arsénico|74.922|s|2.18|947|114
34|Se|Selenio|78.971|n|2.55|941|103
35|Br|Bromo|79.904|h|2.96|1140|94
36|Kr|Kriptón|83.798|g|3.00|1351|88
37|Rb|Rubidio|85.468|a|0.82|403|265
38|Sr|Estroncio|87.62|t|0.95|550|219
39|Y|Itrio|88.906|m|1.22|600|212
40|Zr|Circonio|91.224|m|1.33|640|206
41|Nb|Niobio|92.906|m|1.6|652|198
42|Mo|Molibdeno|95.95|m|2.16|684|190
43|Tc|Tecnecio|[98]|m|1.9|702|183
44|Ru|Rutenio|101.07|m|2.2|710|178
45|Rh|Rodio|102.91|m|2.28|720|173
46|Pd|Paladio|106.42|m|2.20|804|169
47|Ag|Plata|107.87|m|1.93|731|165
48|Cd|Cadmio|112.41|m|1.69|868|161
49|In|Indio|114.82|p|1.78|558|156
50|Sn|Estaño|118.71|p|1.96|709|145
51|Sb|Antimonio|121.76|s|2.05|834|133
52|Te|Telurio|127.60|s|2.1|869|123
53|I|Yodo|126.90|h|2.66|1008|115
54|Xe|Xenón|131.29|g|2.6|1170|108
55|Cs|Cesio|132.91|a|0.79|376|298
56|Ba|Bario|137.33|t|0.89|503|253
57|La|Lantano|138.91|l|1.10|538|
58|Ce|Cerio|140.12|l|1.12|534|
59|Pr|Praseodimio|140.91|l|1.13|527|
60|Nd|Neodimio|144.24|l|1.14|533|
61|Pm|Prometio|[145]|l||540|
62|Sm|Samario|150.36|l|1.17|545|
63|Eu|Europio|151.96|l||547|
64|Gd|Gadolinio|157.25|l|1.20|593|
65|Tb|Terbio|158.93|l||566|
66|Dy|Disprosio|162.50|l|1.22|573|
67|Ho|Holmio|164.93|l|1.23|581|
68|Er|Erbio|167.26|l|1.24|589|
69|Tm|Tulio|168.93|l|1.25|597|
70|Yb|Iterbio|173.05|l||603|
71|Lu|Lutecio|174.97|l|1.27|524|
72|Hf|Hafnio|178.49|m|1.3|659|208
73|Ta|Tantalio|180.95|m|1.5|761|200
74|W|Wolframio|183.84|m|2.36|770|193
75|Re|Renio|186.21|m|1.9|760|188
76|Os|Osmio|190.23|m|2.2|840|185
77|Ir|Iridio|192.22|m|2.20|880|180
78|Pt|Platino|195.08|m|2.28|870|177
79|Au|Oro|196.97|m|2.54|890|174
80|Hg|Mercurio|200.59|m|2.00|1007|171
81|Tl|Talio|204.38|p|1.62|589|156
82|Pb|Plomo|207.2|p|2.33|716|154
83|Bi|Bismuto|208.98|p|2.02|703|143
84|Po|Polonio|[209]|p|2.0|812|135
85|At|Astato|[210]|h|2.2||127
86|Rn|Radón|[222]|g|2.2|1037|120
87|Fr|Francio|[223]|a|0.7||
88|Ra|Radio|[226]|t|0.9|509|
89|Ac|Actinio|[227]|c|1.1|499|
90|Th|Torio|232.04|c|1.3|587|
91|Pa|Protactinio|231.04|c|1.5|568|
92|U|Uranio|238.03|c|1.38|598|
93|Np|Neptunio|[237]|c|1.36|605|
94|Pu|Plutonio|[244]|c|1.28|585|
95|Am|Americio|[243]|c|1.3|578|
96|Cm|Curio|[247]|c|1.3|581|
97|Bk|Berkelio|[247]|c|1.3|601|
98|Cf|Californio|[251]|c|1.3|608|
99|Es|Einstenio|[252]|c|1.3|619|
100|Fm|Fermio|[257]|c|1.3|627|
101|Md|Mendelevio|[258]|c|1.3|635|
102|No|Nobelio|[259]|c|1.3|642|
103|Lr|Laurencio|[266]|c|1.3||
104|Rf|Rutherfordio|[267]|m|||
105|Db|Dubnio|[268]|m|||
106|Sg|Seaborgio|[269]|m|||
107|Bh|Bohrio|[270]|m|||
108|Hs|Hasio|[269]|m|||
109|Mt|Meitnerio|[278]|m|||
110|Ds|Darmstatio|[281]|m|||
111|Rg|Roentgenio|[282]|m|||
112|Cn|Copernicio|[285]|m|||
113|Nh|Nihonio|[286]|p|||
114|Fl|Flerovio|[289]|p|||
115|Mc|Moscovio|[290]|p|||
116|Lv|Livermorio|[293]|p|||
117|Ts|Teneso|[294]|h|||
118|Og|Oganesón|[294]|g|||`;

  const CATEGORIAS = {
    a: 'Metal alcalino', t: 'Metal alcalinotérreo', m: 'Metal de transición', l: 'Lantánido', c: 'Actínido',
    p: 'Otro metal', s: 'Metaloide', n: 'No metal', h: 'Halógeno', g: 'Gas noble',
  };
  const GASES = new Set(['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn']), LIQUIDOS = new Set(['Br', 'Hg']);
  const num = (s) => (s === '' || s == null ? null : +s);

  // grupo y periodo; los lantánidos y actínidos (57–71, 89–103) van en sus filas aparte
  const LIMITES = [2, 10, 18, 36, 54, 86, 118];
  function posicion(Z) {
    const periodo = LIMITES.findIndex((l) => Z <= l) + 1, ini = periodo === 1 ? 1 : LIMITES[periodo - 2] + 1, k = Z - ini;
    if ((Z >= 57 && Z <= 71) || (Z >= 89 && Z <= 103)) return { periodo, grupo: null, fila: periodo === 6 ? 9 : 10, col: 3 + (Z - (periodo === 6 ? 57 : 89)) };
    let grupo;
    if (periodo === 1) grupo = Z === 1 ? 1 : 18;
    else if (periodo <= 3) grupo = k < 2 ? k + 1 : k + 11;
    else if (periodo <= 5) grupo = k + 1;
    else grupo = k < 2 ? k + 1 : k < 17 ? 3 : k - 13;
    return { periodo, grupo, fila: periodo, col: grupo };
  }

  /* ---------- Configuración electrónica: Madelung (n + l) con las excepciones conocidas ---------- */
  const ORB = []; // orden de llenado
  for (let s = 1; s <= 8; s++) for (let l = Math.min(s - 1, 3); l >= 0; l--) { const n = s - l; if (n > l) ORB.push([n, l]); }
  const LETRA = 'spdf', CAP = [2, 6, 10, 14];
  const EXCEPCIONES = {
    24: { '3d': 5, '4s': 1 }, 29: { '3d': 10, '4s': 1 }, 41: { '4d': 4, '5s': 1 }, 42: { '4d': 5, '5s': 1 },
    44: { '4d': 7, '5s': 1 }, 45: { '4d': 8, '5s': 1 }, 46: { '4d': 10, '5s': 0 }, 47: { '4d': 10, '5s': 1 },
    57: { '4f': 0, '5d': 1 }, 58: { '4f': 1, '5d': 1 }, 64: { '4f': 7, '5d': 1 }, 78: { '5d': 9, '6s': 1 }, 79: { '5d': 10, '6s': 1 },
    89: { '5f': 0, '6d': 1 }, 90: { '5f': 0, '6d': 2 }, 91: { '5f': 2, '6d': 1 }, 92: { '5f': 3, '6d': 1 }, 93: { '5f': 4, '6d': 1 },
    96: { '5f': 7, '6d': 1 }, 103: { '6d': 0, '7p': 1 },
  };
  // devuelve [{n, l, e, nombre}] en orden de n y l (forma habitual: 1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s²…)
  function configuracion(Z, ion = 0) {
    const e = {};
    let resto = Z;
    for (const [n, l] of ORB) { if (!resto) break; const k = Math.min(CAP[l], resto); e[`${n}${LETRA[l]}`] = k; resto -= k; }
    // los cationes salen de la configuración real del átomo neutro (Cu⁺: [Ar] 3d¹⁰, Cr³⁺: [Ar] 3d³)
    if (ion >= 0 && EXCEPCIONES[Z]) Object.assign(e, EXCEPCIONES[Z]);
    // un catión pierde primero los electrones de mayor n (4s antes que 3d)
    for (let q = ion; q > 0; q--) {
      const k = Object.keys(e).filter((o) => e[o] > 0).sort((x, y) => +y[0] - +x[0] || LETRA.indexOf(y[1]) - LETRA.indexOf(x[1]))[0];
      if (k) e[k]--;
    }
    for (let q = ion; q < 0; q++) {
      const libre = ORB.map(([n, l]) => `${n}${LETRA[l]}`).find((o) => (e[o] || 0) < CAP[LETRA.indexOf(o[1])]);
      e[libre] = (e[libre] || 0) + 1;
    }
    return Object.entries(e).filter(([, k]) => k > 0).map(([o, k]) => ({ n: +o.slice(0, -1), l: LETRA.indexOf(o.slice(-1)), e: k, nombre: o }))
      .sort((a, b) => a.n - b.n || a.l - b.l);
  }
  const SUP = (k) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const NOBLES = [2, 10, 18, 36, 54, 86];
  const texto = (conf) => conf.map((o) => o.nombre + SUP(o.e)).join(' ');
  // forma abreviada con el gas noble anterior: [Ar] 3d⁶ 4s²
  function abreviada(Z) {
    const g = [...NOBLES].reverse().find((n) => n < Z);
    if (!g) return texto(configuracion(Z));
    const base = new Set(configuracion(g).map((o) => o.nombre));
    const full = configuracion(Z).filter((o) => !base.has(o.nombre) || configuracion(g).find((b) => b.nombre === o.nombre).e !== o.e);
    return `[${lista[g - 1].simbolo}] ${texto(full)}`;
  }
  const capas = (Z) => { const c = []; for (const o of configuracion(Z)) c[o.n - 1] = (c[o.n - 1] || 0) + o.e; return c.map((x) => x || 0); };
  const bloque = (Z) => { const c = configuracion(Z); const ult = ORB.map(([n, l]) => `${n}${LETRA[l]}`).filter((o) => c.some((x) => x.nombre === o)).pop(); return ((Z >= 57 && Z <= 71) || (Z >= 89 && Z <= 103)) ? 'f' : Z === 2 ? 's' : ult ? ult.slice(-1) : 's'; };

  const lista = FILAS.split('\n').map((f) => {
    const [Z, simbolo, nombre, masa, cat, en, ei, radio] = f.split('|');
    const z = +Z, estable = masa.startsWith('[');
    return {
      Z: z, simbolo, nombre, masa: +masa.replace(/[[\]]/g, ''), masaEstable: estable, cat, categoria: CATEGORIAS[cat],
      en: num(en), ei: num(ei), radio: num(radio),
      estado: z >= 100 ? null : GASES.has(simbolo) ? 'gas' : LIQUIDOS.has(simbolo) ? 'líquido' : 'sólido',
      ...posicion(z),
    };
  });
  const porSimbolo = Object.fromEntries(lista.map((e) => [e.simbolo, e]));
  return { lista, porSimbolo, CATEGORIAS, configuracion, texto, abreviada, capas, bloque, NOBLES };
})();
if (typeof module !== 'undefined') module.exports = Elementos;
