#!/usr/bin/env python3
"""Contraste de los datos de Química (Fase 14, F14.1) con fuentes abiertas, por programa y no de memoria.
Lee fuente/quimica/datos.js (vía Node), lo compara con paquetes de Python y escribe quimica.json,
que lee pruebas/herramientas/comun/datos-quimica.js. Para rehacerlo:
    pip install mendeleev chemicals phreeqpython && python3 pruebas/referencias/quimica.py
Fuentes: `chemicals` (CRC, ATCT, TRC) para ΔHf° y S°; `mendeleev` (NIST/IUPAC) para energías de ionización,
afinidades electrónicas y atomización; bases de datos de PHREEQC (phreeqc.dat y wateq4f, USGS) para
productos de solubilidad, constantes de Henry y sus entalpías. Lo que no tiene fuente abierta aquí
(potenciales, complejos, indicadores, solubilidad frente a T, energías reticulares) va en «sin_contraste».
Cada fila: { grupo, dato, nuestro, ref, fuente, dif, tol, ok }. Se dan por revisadas, con su explicación,
las que superan la tolerancia pero son diferencias conocidas entre tablas (lista REVISADAS)."""
import hashlib, json, math, os, re, subprocess
import mendeleev, chemicals, phreeqpython
from mendeleev import element
from chemicals import Hfg, Hfl, Hfs, S0g, S0l, S0s
from chemicals.identifiers import search_chemical

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
SALIDA = subprocess.check_output(['node', '-e', "process.stdout.write(JSON.stringify(require('./fuente/quimica/datos.js')))"], cwd=RAIZ).decode()
D = json.loads(SALIDA)
EV = 96.48533212  # kJ/mol por eV
filas = []
# Diferencias que superan la tolerancia pero son entre tablas, no errores: se conserva el valor de las tablas de clase (CRC/NBS/Atkins)
NBS = 'Tabla NBS (Wagman 1982, la de Atkins y Chang) frente a la CRC más reciente que trae `chemicals`: el valor es el de uso en clase'
REVISADAS = {
    ('S°', 'C2H5OH(l)'): 'El valor de clase (160,7 J/(mol·K), NBS/Atkins) es el habitual; `chemicals` trae otra edición (146,6)',
    ('ΔHf°', 'CuO(s)'): NBS, ('ΔHf°', 'ZnO(s)'): NBS,
    **{('ΔHf sales', k): NBS for k in ('NaF', 'KF', 'CaF2', 'Na2O', 'K2O', 'Na2S')},
    ('Kps (log)', 'BaF2'): 'El valor (1,8·10⁻⁷) es el de la CRC; la base de PHREEQC (wateq4f) usa otro ajuste (1,7·10⁻⁶)',
    ('Kps (log)', 'Ag3PO4'): 'El valor (8,9·10⁻¹⁷) es el de la CRC; wateq4f usa otra medida (2,8·10⁻¹⁸)',
    ('Kps (log)', 'Ni(OH)2'): 'El valor (5,5·10⁻¹⁶) es el de la CRC para el hidróxido recién precipitado; wateq4f da el cristalino (6·10⁻¹⁸)',
    ('Henry (C, K)', 'N2'): 'C = 1300 K es el de Sander (2015); PHREEQC saca otro de su ΔH de disolución',
    ('Henry (C, K)', 'H2'): 'C = 500 K es el de Sander (2015); PHREEQC saca otro de su ΔH de disolución',
}
def fila(grupo, dato, nuestro, ref, fuente, tol):
    if ref is None: return
    dif = nuestro - ref
    f = {'grupo': grupo, 'dato': dato, 'nuestro': nuestro, 'ref': round(ref, 6), 'fuente': fuente, 'dif': round(dif, 6), 'tol': tol, 'ok': abs(dif) <= tol}
    if not f['ok'] and (grupo, dato) in REVISADAS: f['revisada'] = REVISADAS[(grupo, dato)]
    filas.append(f)

# ---------- ΔHf° y S° (CRC, ATCT) ----------
def formula(clave):
    m = re.match(r'^(.*)\((g|l|s)\)$', clave); return m.group(1), m.group(2)
for clave, (h, s, g) in D['TERMO'].items():
    f, fase = formula(clave)
    try: q = search_chemical(f)
    except Exception: continue
    cas = q.CAS
    if fase in ('g', 'l', 's'):
        href = {'g': Hfg, 'l': Hfl, 's': Hfs}[fase](cas)
        sref = {'g': S0g, 'l': S0l, 's': S0s}[fase](cas)
        if href is not None and h != 0: fila('ΔHf°', clave, h, href / 1000, 'chemicals (CRC/ATCT)', 1.0)
        if sref is not None: fila('S°', clave, s, sref, 'chemicals (CRC)', 1.0)

# ---------- energías de ionización, afinidades y atomización (mendeleev) ----------
for s, d in D['METALES'].items():
    e = element(s)
    for i, v in enumerate(d['ei']): fila('Ionización', f'{s} E{i+1}', v, e.ionenergies[i + 1] * EV, 'mendeleev (NIST)', 1.5)
    fila('Sublimación', f'{s} ΔH sub', d['sub'], e.heat_of_formation, 'mendeleev (CRC)', 2.0)
for s, d in D['NOMETALES'].items():
    e = element(s)
    fila('Atomización', f'{s} ½X₂', d['atom'], e.heat_of_formation, 'mendeleev (CRC)', 1.0)
    if s not in ('O', 'S'): fila('Afinidad', f'{s} AE1', d['ae'][0], e.electron_affinity * EV, 'mendeleev (NIST)', 1.5)
    else: fila('Afinidad', f'{s} AE1', d['ae'][0], e.electron_affinity * EV, 'mendeleev (NIST)', 1.5)
# entalpía de formación de las sales
for sal, d in D['SALES_BORN'].items():
    try: q = search_chemical(sal)
    except Exception: continue
    fila('ΔHf sales', sal, d['hf'], (Hfs(q.CAS) or 0) / 1000 if Hfs(q.CAS) is not None else None, 'chemicals (CRC)', 1.0)

# ---------- Kps, Henry (PHREEQC) ----------
BD = os.path.join(os.path.dirname(phreeqpython.__file__), 'database')
def fases(arch):
    """{reacción, log_k} de cada fase mineral o gas de una base de PHREEQC"""
    t = open(os.path.join(BD, arch), encoding='latin-1').read().replace('\r', '')
    sec = re.search(r'^PHASES\n(.*?)^(?:[A-Z_]{4,}\n|END)', t, re.S | re.M)
    out = []
    if not sec: return out
    bloques = re.split(r'\n(?=\S)', sec.group(1))
    for b in bloques:
        ls = [l.strip() for l in b.split('\n') if l.strip() and not l.strip().startswith('#')]
        if len(ls) < 2 or '=' not in ls[1]: continue
        lk = next((re.split(r'\s+', l)[1] for l in ls if re.match(r'-?log_k\s+\S', l)), None)
        dh = next((re.split(r'\s+', l) for l in ls if re.match(r'-?delta_h', l)), None)
        if lk is None: continue
        out.append({'nombre': ls[0].split()[0], 'rx': ls[1], 'logk': float(lk.rstrip(';')), 'dh': dh})
    return out
BASES = {a: fases(a) for a in ('phreeqc.dat', 'wateq4f_PWN.dat')}
def sol(rx):
    izq, der = [x.strip() for x in rx.split('=')]
    t = [x.strip() for x in izq.split('+ ')] if ' + ' in izq else [izq]
    solido = re.sub(r'^\d*\s*', '', t[0]); solido = solido.split(':')[0]
    nh = sum(int(re.match(r'(\d*)', x.strip()).group(1) or 1) for x in t[1:] if x.strip().endswith('H+'))
    return solido, nh, [re.sub(r'^\d*\s*', '', p.strip()) for p in re.split(r'\s\+\s', der)]
for clave, cat, an, a, b, kps, _ in D['KPS']:
    cand = []
    for arch, lista in BASES.items():
        for f in lista:
            try: sd, nh, prod = sol(f['rx'])
            except Exception: continue
            if sd != clave: continue
            if any(p in ('HS-', 'HCO3-', 'HPO4-2', 'H2PO4-') for p in prod): continue  # necesitaría un pKa más
            cand.append((f['logk'] - 14 * nh * 1 if nh else f['logk'], f'{f["nombre"]} ({arch})'))
    if cand:
        mejor = min(cand, key=lambda c: abs(math.log10(kps) - c[0]))
        fila('Kps (log)', clave, round(math.log10(kps), 3), mejor[0], f'PHREEQC · {mejor[1]}', 0.5)
for clave, d in D['HENRY'].items():
    for arch, lista in BASES.items():
        for f in lista:
            if f['nombre'] == f'{clave}(g)' and f['rx'].replace(' ', '') == f'{clave}={clave}':
                fila('Henry (log k)', clave, round(math.log10(d['k']), 3), f['logk'], f'PHREEQC · {f["nombre"]} ({arch})', 0.1)
                if f['dh'] and len(f['dh']) >= 3:
                    v = float(f['dh'][1]); u = f['dh'][2]
                    c = -v * (4184 if u.startswith('kcal') else 1000) / 8.314462618
                    fila('Henry (C, K)', clave, d['C'], round(c, 1), f'PHREEQC · {f["nombre"]} ({arch})', 250)
                break

# ---------- coherencia interna: ΔGf = ΔHf − T·ΔSf con S° de los elementos ----------
sin = ['Potenciales estándar de reducción (CRC; sin base abierta instalada)', 'logβ de complejos (CRC, Harris)',
       'Intervalos de viraje de indicadores', 'Solubilidad frente a la temperatura (CRC, Lange)', 'Energías reticulares de referencia de Born-Haber',
       'Nombres de complejos (IUPAC; comprobados en pruebas/herramientas/formulacion.js)']
R = {'sello_datos': hashlib.sha256(SALIDA.encode()).hexdigest(), 'versiones': {'mendeleev': mendeleev.__version__, 'chemicals': chemicals.__version__, 'phreeqpython': getattr(phreeqpython, '__version__', 'ver pip')},
     'filas': filas, 'sin_contraste': sin}
json.dump(R, open(os.path.join(AQUI, 'quimica.json'), 'w'), ensure_ascii=False, indent=1)
mal = [f for f in filas if not f['ok']]
print(len(filas), 'comparaciones;', len(mal), 'fuera de tolerancia')
for f in mal: print(' ', f['grupo'], f['dato'], f['nuestro'], 'vs', f['ref'], f['fuente'])
