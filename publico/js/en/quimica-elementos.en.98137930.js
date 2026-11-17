const Elementos = (() => {
  const FILAS = `1|H|Hydrogen|1.008|n|2.20|1312|53
2|He|Helium|4.0026|g||2372|31
3|Li|Lithium|6.94|a|0.98|520|167
4|Be|Beryllium|9.0122|t|1.57|900|112
5|B|Boron|10.81|s|2.04|801|87
6|C|Carbon|12.011|n|2.55|1086|67
7|N|Nitrogen|14.007|n|3.04|1402|56
8|O|Oxygen|15.999|n|3.44|1314|48
9|F|Fluorine|18.998|h|3.98|1681|42
10|Ne|Neon|20.180|g||2081|38
11|Na|Sodium|22.990|a|0.93|496|190
12|Mg|Magnesium|24.305|t|1.31|738|145
13|Al|Aluminum|26.982|p|1.61|578|118
14|Si|Silicon|28.085|s|1.90|787|111
15|P|Phosphorus|30.974|n|2.19|1012|98
16|S|Sulfur|32.06|n|2.58|1000|88
17|Cl|Chlorine|35.45|h|3.16|1251|79
18|Ar|Argon|39.95|g||1521|71
19|K|Potassium|39.098|a|0.82|419|243
20|Ca|Calcium|40.078|t|1.00|590|194
21|Sc|Scandium|44.956|m|1.36|633|184
22|Ti|Titanium|47.867|m|1.54|659|176
23|V|Vanadium|50.942|m|1.63|651|171
24|Cr|Chromium|51.996|m|1.66|653|166
25|Mn|Manganese|54.938|m|1.55|717|161
26|Fe|Iron|55.845|m|1.83|763|156
27|Co|Cobalt|58.933|m|1.88|760|152
28|Ni|Nickel|58.693|m|1.91|737|149
29|Cu|Copper|63.546|m|1.90|746|145
30|Zn|Zinc|65.38|m|1.65|906|142
31|Ga|Gallium|69.723|p|1.81|579|136
32|Ge|Germanium|72.630|s|2.01|762|125
33|As|Arsenic|74.922|s|2.18|947|114
34|Se|Selenium|78.971|n|2.55|941|103
35|Br|Bromine|79.904|h|2.96|1140|94
36|Kr|Krypton|83.798|g|3.00|1351|88
37|Rb|Rubidium|85.468|a|0.82|403|265
38|Sr|Strontium|87.62|t|0.95|550|219
39|Y|Yttrium|88.906|m|1.22|600|212
40|Zr|Zirconium|91.224|m|1.33|640|206
41|Nb|Niobium|92.906|m|1.6|652|198
42|Mo|Molybdenum|95.95|m|2.16|684|190
43|Tc|Technetium|[98]|m|1.9|702|183
44|Ru|Ruthenium|101.07|m|2.2|710|178
45|Rh|Rhodium|102.91|m|2.28|720|173
46|Pd|Palladium|106.42|m|2.20|804|169
47|Ag|Silver|107.87|m|1.93|731|165
48|Cd|Cadmium|112.41|m|1.69|868|161
49|In|Indium|114.82|p|1.78|558|156
50|Sn|Tin|118.71|p|1.96|709|145
51|Sb|Antimony|121.76|s|2.05|834|133
52|Te|Tellurium|127.60|s|2.1|869|123
53|I|Iodine|126.90|h|2.66|1008|115
54|Xe|Xenon|131.29|g|2.6|1170|108
55|Cs|Cesium|132.91|a|0.79|376|298
56|Ba|Barium|137.33|t|0.89|503|253
57|La|Lanthanum|138.91|l|1.10|538|
58|Ce|Cerium|140.12|l|1.12|534|
59|Pr|Praseodymium|140.91|l|1.13|527|
60|Nd|Neodymium|144.24|l|1.14|533|
61|Pm|Promethium|[145]|l||540|
62|Sm|Samarium|150.36|l|1.17|545|
63|Eu|Europium|151.96|l||547|
64|Gd|Gadolinium|157.25|l|1.20|593|
65|Tb|Terbium|158.93|l||566|
66|Dy|Dysprosium|162.50|l|1.22|573|
67|Ho|Holmium|164.93|l|1.23|581|
68|Er|Erbium|167.26|l|1.24|589|
69|Tm|Thulium|168.93|l|1.25|597|
70|Yb|Ytterbium|173.05|l||603|
71|Lu|Lutetium|174.97|l|1.27|524|
72|Hf|Hafnium|178.49|m|1.3|659|208
73|Ta|Tantalum|180.95|m|1.5|761|200
74|W|Tungsten|183.84|m|2.36|770|193
75|Re|Rhenium|186.21|m|1.9|760|188
76|Os|Osmium|190.23|m|2.2|840|185
77|Ir|Iridium|192.22|m|2.20|880|180
78|Pt|Platinum|195.08|m|2.28|870|177
79|Au|Gold|196.97|m|2.54|890|174
80|Hg|Mercury|200.59|m|2.00|1007|171
81|Tl|Thallium|204.38|p|1.62|589|156
82|Pb|Lead|207.2|p|2.33|716|154
83|Bi|Bismuth|208.98|p|2.02|703|143
84|Po|Polonium|[209]|p|2.0|812|135
85|At|Astatine|[210]|h|2.2||127
86|Rn|Radon|[222]|g|2.2|1037|120
87|Fr|Francium|[223]|a|0.7||
88|Ra|Radium|[226]|t|0.9|509|
89|Ac|Actinium|[227]|c|1.1|499|
90|Th|Thorium|232.04|c|1.3|587|
91|Pa|Protactinium|231.04|c|1.5|568|
92|U|Uranium|238.03|c|1.38|598|
93|Np|Neptunium|[237]|c|1.36|605|
94|Pu|Plutonium|[244]|c|1.28|585|
95|Am|Americium|[243]|c|1.3|578|
96|Cm|Curium|[247]|c|1.3|581|
97|Bk|Berkelium|[247]|c|1.3|601|
98|Cf|Californium|[251]|c|1.3|608|
99|Es|Einsteinium|[252]|c|1.3|619|
100|Fm|Fermium|[257]|c|1.3|627|
101|Md|Mendelevium|[258]|c|1.3|635|
102|No|Nobelium|[259]|c|1.3|642|
103|Lr|Lawrencium|[266]|c|1.3||
104|Rf|Rutherfordium|[267]|m|||
105|Db|Dubnium|[268]|m|||
106|Sg|Seaborgium|[269]|m|||
107|Bh|Bohrium|[270]|m|||
108|Hs|Hassium|[269]|m|||
109|Mt|Meitnerium|[278]|m|||
110|Ds|Darmstadtium|[281]|m|||
111|Rg|Roentgenium|[282]|m|||
112|Cn|Copernicium|[285]|m|||
113|Nh|Nihonium|[286]|p|||
114|Fl|Flerovium|[289]|p|||
115|Mc|Moscovium|[290]|p|||
116|Lv|Livermorium|[293]|p|||
117|Ts|Tennessine|[294]|h|||
118|Og|Oganesson|[294]|g|||`;

  const PROPIEDADES = `1|+1, −1|72.8|0.0000899|-259.16|-252.88
2|0|x|0.0001785||-268.93
3|+1|59.6|0.534|180.5|1342
4|+2|x|1.85|1287|2469
5|+3|26.7|2.34|2076|3927
6|−4, +2, +4|121.8|2.267|3550|4827
7|−3, +1, +2, +3, +4, +5|x|0.0012506|-210.0|-195.8
8|−2|141.0|0.001429|-218.79|-182.96
9|−1|328.0|0.001696|-219.67|-188.11
10|0|x|0.0008999|-248.59|-246.05
11|+1|52.8|0.971|97.79|882.9
12|+2|x|1.738|650|1090
13|+3|41.8|2.70|660.32|2519
14|−4, +4|134.1|2.329|1414|3265
15|−3, +3, +5|72.0|1.82|44.15|280.5
16|−2, +2, +4, +6|200.4|2.067|115.21|444.6
17|−1, +1, +3, +5, +7|348.6|0.003214|-101.5|-34.04
18|0|x|0.0017837|-189.34|-185.85
19|+1|48.4|0.862|63.5|759
20|+2|2.37|1.54|842|1484
21|+3|18.1|2.985|1541|2836
22|+2, +3, +4|7.6|4.506|1668|3287
23|+2, +3, +4, +5|50.9|6.0|1910|3407
24|+2, +3, +6|65.2|7.19|1907|2671
25|+2, +3, +4, +6, +7|x|7.21|1246|2061
26|+2, +3|15.7|7.874|1538|2862
27|+2, +3|63.9|8.90|1495|2927
28|+2, +3|111.6|8.908|1455|2913
29|+1, +2|118.4|8.96|1084.62|2562
30|+2|x|7.14|419.53|907
31|+3|41|5.91|29.76|2229
32|+2, +4|119|5.323|938.25|2833
33|−3, +3, +5|78|5.727|817|
34|−2, +4, +6|195|4.81|221|685
35|−1, +1, +3, +5, +7|324.6|3.1028|-7.2|58.8
36|0, +2|x|0.003733|-157.37|-153.42
37|+1|46.9|1.532|39.30|688
38|+2|5.0|2.64|777|1377
39|+3|29.6|4.472|1526|3345
40|+4|41.1|6.52|1855|4409
41|+3, +5|86.1|8.57|2477|4744
42|+4, +6|71.9|10.28|2623|4639
43|+4, +7|53|11|2157|4265
44|+3, +4, +8|101.3|12.45|2334|4150
45|+3|109.7|12.41|1964|3695
46|+2, +4|54.2|12.023|1554.9|2963
47|+1|125.6|10.49|961.78|2162
48|+2|x|8.65|321.07|767
49|+1, +3|37.0|7.31|156.6|2072
50|+2, +4|107.3|7.287|231.93|2602
51|−3, +3, +5|101.1|6.697|630.63|1587
52|−2, +4, +6|190.2|6.24|449.51|988
53|−1, +1, +5, +7|295.2|4.933|113.7|184.3
54|0, +2, +4, +6|x|0.005887|-111.75|-108.10
55|+1|45.5|1.873|28.44|671
56|+2|13.95|3.51|727|1897
57|+3|48|6.162|920|3464
58|+3, +4|55|6.77|795|3443
59|+3||6.77|935|3520
60|+3||7.01|1024|3074
61|+3||7.26|1042|3000
62|+2, +3||7.52|1072|1794
63|+2, +3||5.264|826|1529
64|+3||7.90|1312|3273
65|+3, +4||8.23|1356|3230
66|+3||8.54|1407|2567
67|+3||8.79|1461|2720
68|+3||9.066|1529|2868
69|+2, +3||9.32|1545|1950
70|+2, +3||6.90|824|1196
71|+3||9.841|1652|3402
72|+4||13.31|2233|4603
73|+5|31|16.69|3017|5458
74|+4, +6|78.8|19.25|3422|5555
75|+4, +7||21.02|3186|5596
76|+4, +8|106.1|22.59|3033|5012
77|+3, +4|151|22.56|2446|4428
78|+2, +4|205.3|21.45|1768.3|3825
79|+1, +3|222.8|19.3|1064.18|2856
80|+1, +2|x|13.534|-38.83|356.73
81|+1, +3|36.4|11.85|304|1473
82|+2, +4|35.1|11.34|327.46|1749
83|+3, +5|91.2|9.78|271.4|1564
84|+2, +4||9.196|254|962
85|−1, +1|233||302|
86|0|x|0.00973|-71|-61.7
87|+1||||
88|+2||5.5|700|1737
89|+3||10.07|1050|3198
90|+4||11.72|1750|4788
91|+4, +5||15.37|1572|
92|+3, +4, +5, +6||19.1|1135|4131
93|+3, +4, +5, +6, +7||20.45|644|
94|+3, +4, +5, +6||19.82|639.4|3228
95|+3||12|1176|2011
96|+3||13.51|1340|3110
97|+3, +4||14.78|986|
98|+3||15.1|900|
99|+3||8.84|860|
100|+3||||
101|+2, +3||||
102|+2, +3||||
103|+3||||
104|+4||||`;

  const CATEGORIAS = {
    a: 'Alkali metal', t: 'Alkaline earth metal', m: 'Transition metal', l: 'Lanthanide', c: 'Actinide',
    p: 'Post-transition metal', s: 'Metalloid', n: 'No metal', h: 'Halogen', g: 'Noble gas',
  };
  const GASES = new Set(['H', 'He', 'N', 'O', 'F', 'Ne', 'Cl', 'Ar', 'Kr', 'Xe', 'Rn']), LIQUIDOS = new Set(['Br', 'Hg']);
  const num = (s) => (s === '' || s == null ? null : +s);

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
  function configuracion(Z, ion = 0) {
    const e = {};
    let resto = Z;
    for (const [n, l] of ORB) { if (!resto) break; const k = Math.min(CAP[l], resto); e[`${n}${LETRA[l]}`] = k; resto -= k; }
    if (ion >= 0 && EXCEPCIONES[Z]) Object.assign(e, EXCEPCIONES[Z]);
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
      estado: z >= 100 ? null : GASES.has(simbolo) ? 'gas' : LIQUIDOS.has(simbolo) ? 'liquid' : 'solid',
      ...posicion(z),
    };
  });
  for (const f of PROPIEDADES.split('\n')) {
    const [Z, ox, ae, dens, tf, te] = f.split('|').map((x) => x.trim()), e = lista[+Z - 1];
    Object.assign(e, { oxidacion: ox || null, ae: ae === 'x' ? 0 : num(ae), aeInestable: ae === 'x', densidad: num(dens), fusion: num(tf), ebullicion: num(te) });
  }
  for (const e of lista) if (!('oxidacion' in e)) Object.assign(e, { oxidacion: null, ae: null, aeInestable: false, densidad: null, fusion: null, ebullicion: null });
  const porSimbolo = Object.fromEntries(lista.map((e) => [e.simbolo, e]));
  return { lista, porSimbolo, CATEGORIAS, configuracion, texto, abreviada, capas, bloque, NOBLES };
})();

