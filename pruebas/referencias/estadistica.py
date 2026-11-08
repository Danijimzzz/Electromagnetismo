#!/usr/bin/env python3
"""Valores de referencia para las pruebas de Estadística (Fase 10, ES-1).
Se calculan con scipy y statsmodels (no a mano ni de memoria) y se guardan en
estadistica.json, que leen las pruebas de pruebas/herramientas/. Para rehacerlo:
    pip install scipy statsmodels && python3 pruebas/referencias/estadistica.py
Versiones usadas al crearlo: ver el campo «versiones» del JSON."""
import json, itertools, math, os
import numpy as np, pandas as pd, scipy, statsmodels
from scipy import stats
import statsmodels.formula.api as smf
from statsmodels.stats.anova import anova_lm
from statsmodels.stats.oneway import anova_oneway
from statsmodels.stats.multitest import multipletests

R = {'versiones': {'scipy': scipy.__version__, 'statsmodels': statsmodels.__version__, 'numpy': np.__version__}}
fl = lambda v: [float(x) for x in v]

# --- rango studentizado (Tukey) ---
R['tukey_q'] = [{'k': k, 'nu': nu, 'p': p, 'q': float(stats.studentized_range.ppf(p, k, nu))} for k, nu, p in [(3, 12, 0.95), (4, 20, 0.95), (5, 10, 0.95), (3, 10, 0.99), (2, 10, 0.95), (10, 30, 0.95), (6, 5, 0.9)]]
R['tukey_p'] = [{'k': k, 'nu': nu, 'q': q, 'cdf': float(stats.studentized_range.cdf(q, k, nu))} for k, nu, q in [(4, 10, 3.5), (3, 12, 1.2), (8, 15, 6.1), (3, 1, 9.0), (2, 4, 2.5)]]

# --- ANOVA de un factor con tamaños distintos ---
g = {'Rápida': [20, 21, 23, 19, 22], 'Media': [24, 26, 25, 27, 23, 30], 'Lenta': [29, 28, 31, 27, 30, 40, 12]}
G = [np.array(v, float) for v in g.values()]
n = [len(v) for v in G]; m = [v.mean() for v in G]; N = sum(n); k = len(G)
msw = sum(((v - v.mean()) ** 2).sum() for v in G) / (N - k)
th = stats.tukey_hsd(*G); ci = th.confidence_interval(0.95)
pares = list(itertools.combinations(range(3), 2))
raw = [2 * stats.t.sf(abs((m[i] - m[j]) / math.sqrt(msw * (1 / n[i] + 1 / n[j]))), N - k) for i, j in pares]
vv = [v.var(ddof=1) for v in G]
gh = []
for i, j in pares:
    vi, vj = vv[i] / n[i], vv[j] / n[j]; se = math.sqrt(vi + vj); df = (vi + vj) ** 2 / (vi ** 2 / (n[i] - 1) + vj ** 2 / (n[j] - 1)); q = abs(m[i] - m[j]) / (se / math.sqrt(2))
    gh.append(float(stats.studentized_range.sf(q, k, df)))
w = anova_oneway(G, use_var='unequal', welch_correction=True)
R['anova_desiguales'] = {
    'datos': {a: v for a, v in g.items()},
    'tukey_p': [float(th.pvalue[i, j]) for i, j in pares], 'tukey_lo': [float(ci.low[i, j]) for i, j in pares], 'tukey_hi': [float(ci.high[i, j]) for i, j in pares],
    'bonferroni_p': fl(multipletests(raw, method='bonferroni')[1]), 'holm_p': fl(multipletests(raw, method='holm')[1]),
    'scheffe_p': [float(stats.f.sf(((m[i] - m[j]) / math.sqrt(msw * (1 / n[i] + 1 / n[j]))) ** 2 / (k - 1), k - 1, N - k)) for i, j in pares],
    'gh_p': gh,
    'welch': {'F': float(w.statistic), 'p': float(w.pvalue), 'gl2': float(w.df_denom)},
    'levene_media': [float(x) for x in stats.levene(*G, center='mean')], 'levene_mediana': [float(x) for x in stats.levene(*G, center='median')], 'bartlett': [float(x) for x in stats.bartlett(*G)],
}
# --- ANOVA de dos factores equilibrado ---
cel = {('A1', 'Poco'): [20, 22, 21], ('A1', 'Mucho'): [25, 27, 26], ('A2', 'Poco'): [24, 23, 25], ('A2', 'Mucho'): [38, 36, 37], ('A3', 'Poco'): [18, 20, 19], ('A3', 'Mucho'): [21, 22, 20]}
df = pd.DataFrame([(a, b, y) for (a, b), x in cel.items() for y in x], columns=['A', 'B', 'y'])
mod = smf.ols('y ~ C(A)*C(B)', df).fit(); an = anova_lm(mod, typ=2)
R['anova_dos'] = {'F': [float(x) for x in an['F'][:3]], 'p': [float(x) for x in an['PR(>F)'][:3]], 'SS': [float(x) for x in an['sum_sq']], 'df': [float(x) for x in an['df']], 'shapiro_residuos': [float(x) for x in stats.shapiro(mod.resid)]}
cc = {('T1', 'B1'): 12, ('T1', 'B2'): 15, ('T1', 'B3'): 11, ('T2', 'B1'): 14, ('T2', 'B2'): 18, ('T2', 'B3'): 13, ('T3', 'B1'): 19, ('T3', 'B2'): 21, ('T3', 'B3'): 18}
a2 = anova_lm(smf.ols('y ~ C(A)+C(B)', pd.DataFrame([(a, b, y) for (a, b), y in cc.items()], columns=['A', 'B', 'y'])).fit(), typ=2)
R['anova_dos_sin_replicas'] = {'F': [float(x) for x in a2['F'][:2]], 'p': [float(x) for x in a2['PR(>F)'][:2]]}
# --- Shapiro-Wilk y Jarque-Bera ---
x = np.array([2.1, 3.4, 1.9, 5.6, 4.4, 3.8, 2.7, 9.1, 3.3, 4.0, 2.2, 3.1, 6.5])
R['shapiro'] = {str(nn): [float(v) for v in stats.shapiro(x[:nn])] for nn in [3, 4, 5, 6, 8, 11, 12, 13]}
R['jarque_bera'] = [float(v) for v in stats.jarque_bera(x)]
rng = np.random.default_rng(12345); grande = rng.normal(5, 2, 300).round(3)
R['shapiro_grande'] = {'x': fl(grande), 'res': [float(v) for v in stats.shapiro(grande)]}

json.dump(R, open(os.path.join(os.path.dirname(__file__), 'estadistica.json'), 'w'), ensure_ascii=False, indent=1)
print('estadistica.json escrito')
