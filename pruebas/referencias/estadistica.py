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


# --- Potencia de los contrastes (Contrastes de hipótesis) ---
from statsmodels.stats.power import TTestPower, TTestIndPower, NormalIndPower
tp = TTestPower(); ip = TTestIndPower()
d1 = (12.5 - 12) / 1.2
sp = math.sqrt((9 * 16 + 11 * 25) / 20); d2 = 4 / sp
def nec_t(pw_fun, objetivo, n0, ratio=None):
    n = 2
    while pw_fun(n) < objetivo: n += 1
    return n
R['potencia'] = {
  'media_t_mayor': {'d': d1, 'n': 16, 'pot': float(tp.power(d1, 16, 0.05, alternative='larger')), 'nec90': nec_t(lambda n: tp.power(d1, n, 0.05, alternative='larger'), 0.9, 16)},
  'media_t_dos_colas': {'pot': float(tp.power(0.5, 12, 0.05, alternative='two-sided')), 'pot_menor': float(tp.power(-0.5, 12, 0.05, alternative='smaller'))},
  'dosmedias_t': {'d': d2, 'pot': float(ip.power(d2, 10, 0.05, ratio=12 / 10, alternative='two-sided')),
                  'nec80': (lambda n: [n, math.ceil(n * 1.2)])(nec_t(lambda n: ip.power(d2, n, 0.05, ratio=math.ceil(n * 1.2) / n, alternative='two-sided'), 0.8, 10))},
}
# z de una media (σ conocida), de una proporción y de dos proporciones con la fórmula clásica (scipy.stats.norm)
zn = stats.norm
def pot_z_media(real, mu0, sigma, n, alfa, h1):
    dl = (real - mu0) / (sigma / math.sqrt(n)); c = zn.ppf(1 - alfa / 2 if h1 == 'distinto' else 1 - alfa)
    return float(1 - zn.cdf(c - dl) + (zn.cdf(-c - dl) if h1 == 'distinto' else 0))
R['potencia']['media_z'] = {'pot': pot_z_media(505, 500, 10, 25, 0.05, 'distinto')}
def pot_prop(p0, p1, n, alfa):
    se0 = math.sqrt(p0 * (1 - p0) / n); se1 = math.sqrt(p1 * (1 - p1) / n); c = zn.ppf(1 - alfa)
    return float(1 - zn.cdf((c * se0 - (p1 - p0)) / se1))
R['potencia']['prop'] = {'pot': pot_prop(0.25, 0.35, 200, 0.05), 'nec80': next(n for n in range(2, 100000) if pot_prop(0.25, 0.35, n, 0.05) >= 0.8)}
def pot_dosprop(p2, dif, n1, n2, alfa):
    p1 = p2 + dif; pc = (n1 * p1 + n2 * p2) / (n1 + n2); se0 = math.sqrt(pc * (1 - pc) * (1 / n1 + 1 / n2)); se1 = math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2); c = zn.ppf(1 - alfa / 2)
    dl = dif / se0; sg = se1 / se0
    return float(1 - zn.cdf((c - dl) / sg) + zn.cdf((-c - dl) / sg))
R['potencia']['dosprop'] = {'pot': pot_dosprop(0.2, 0.1, 150, 150, 0.05)}
# varianza (χ²) y dos varianzas (F): potencia = probabilidad bajo la escala real
R['potencia']['varianza'] = {'pot': float(stats.chi2.sf(stats.chi2.ppf(0.95, 19) * (2 * 2) / (3 * 3), 19))}
R['potencia']['dosvar'] = {'pot': float(stats.f.sf(stats.f.ppf(0.975, 10, 12) / 3.0, 10, 12) + stats.f.cdf(stats.f.ppf(0.025, 10, 12) / 3.0, 10, 12))}

# --- No paramétricos ---
import numpy as np
from scipy.stats import rankdata, tiecorrect
def kw_dunn(grupos):
    todos = np.concatenate(grupos); N = len(todos); r = rankdata(todos); pos = 0; Rm = []; n = []
    for g in grupos: Rm.append(r[pos:pos + len(g)].mean()); n.append(len(g)); pos += len(g)
    H, p = stats.kruskal(*grupos)
    _, cnt = np.unique(todos, return_counts=True); corr = float(((cnt ** 3) - cnt).sum())
    v = N * (N + 1) / 12 - corr / (12 * (N - 1)); ps = []
    for i, j in itertools.combinations(range(len(grupos)), 2):
        z = (Rm[i] - Rm[j]) / math.sqrt(v * (1 / n[i] + 1 / n[j])); ps.append(float(2 * stats.norm.sf(abs(z))))
    return {'H': float(H), 'p': float(p), 'dunn_p': ps, 'holm': fl(multipletests(ps, method='holm')[1]), 'bonferroni': fl(multipletests(ps, method='bonferroni')[1])}
R['kruskal'] = {
  'tres': kw_dunn([np.array(v, float) for v in ([14, 17, 16, 19, 22], [10, 12, 15, 11, 13, 9], [20, 24, 21, 26, 23, 25])]),
  'empates': kw_dunn([np.array(v, float) for v in ([3, 4, 4, 5, 5], [4, 5, 6, 6, 7, 7], [6, 7, 7, 8, 9, 9, 9])]),
}
a1 = [14, 17, 16, 19, 22]; b1 = [10, 12, 15, 11, 13, 9]
R['mannwhitney'] = {'exacto': [float(v) for v in stats.mannwhitneyu(a1, b1, method='exact')], 'normal_empates': [float(v) for v in stats.mannwhitneyu([3, 4, 4, 5, 5, 5, 6, 7], [2, 3, 3, 4, 4, 5, 5, 6], alternative='greater', method='asymptotic', use_continuity=True)]}
dd = np.array([82 - 78, 91 - 85, 77 - 75, 88 - 89, 95 - 88, 0, 84 - 76, 90 - 79], float)
R['wilcoxon'] = {'exacto_mayor': [float(v) for v in stats.wilcoxon(dd, alternative='greater', method='exact', zero_method='wilcox')],
                 'mediana_dos': [float(v) for v in stats.wilcoxon(np.array([54, 61, 48, 58, 66, 53, 63, 57, 49, 60]) - 50.0, method='exact')]}
R['signos'] = {'dieta_mayor': float(stats.binomtest(6, 7, 0.5, alternative='greater').pvalue), 'mediana_dos': float(stats.binomtest(8, 10, 0.5).pvalue)}
R['correlacion'] = {'sin_empates': {'spearman': [float(v) for v in stats.spearmanr([1,2,3,4,5,6,7,8],[2,1,4,3,7,8,5,6])], 'kendall': [float(v) for v in stats.kendalltau([1,2,3,4,5,6,7,8],[2,1,4,3,7,8,5,6])]},
                    'empates': {'spearman': [float(v) for v in stats.spearmanr([1,2,2,3,4,4,5],[1,3,2,2,5,6,6])], 'kendall': [float(v) for v in stats.kendalltau([1,2,2,3,4,4,5],[1,3,2,2,5,6,6])]}}
# Hodges-Lehmann con el intervalo de wilcox.test de R (sin corrección de continuidad), calculado aquí a mano con las distribuciones exactas
def cuentas_mw(n1, n2):
    c = [{} for _ in range(n1 + 1)]; c[0][0] = 1
    for v in range(1, n1 + n2 + 1):
        for j in range(min(n1, v), 0, -1):
            for s_, q in list(c[j - 1].items()): c[j][s_ + v] = c[j].get(s_ + v, 0) + q
    base = n1 * (n1 + 1) // 2; return {s_ - base: q for s_, q in c[n1].items()}
def qdist(cu, p):
    tot = sum(cu.values()); acu = 0
    for k in sorted(cu):
        acu += cu[k] / tot
        if acu >= p - 1e-12: return k
x = np.array(a1, float); y = np.array(b1, float); dif = np.sort((x[:, None] - y[None, :]).ravel()); M = len(dif)
qu = qdist(cuentas_mw(5, 6), 0.025); qu = max(qu, 1); R['hodges_mw'] = {'est': float(np.median(dif)), 'lo': float(dif[qu - 1]), 'hi': float(dif[M - qu])}
w = np.array([54, 61, 48, 58, 66, 53, 63, 57, 49, 60]) - 50.0; n = len(w)
walsh = np.sort(np.array([(w[i] + w[j]) / 2 for i in range(n) for j in range(i, n)])); cs = {0: 1}
for v in range(1, n + 1):
    nu = dict(cs)
    for s_, q in cs.items(): nu[s_ + v] = nu.get(s_ + v, 0) + q
    cs = nu
qs = max(qdist(cs, 0.025), 1); Mw = n * (n + 1) // 2
R['hodges_wilcoxon'] = {'est': float(np.median(walsh)), 'lo': float(walsh[qs - 1]), 'hi': float(walsh[Mw - qs])}

# --- χ²: Fisher, McNemar y residuos ---
from statsmodels.stats.contingency_tables import mcnemar as sm_mcnemar, Table
R['chi2'] = {
  'fisher_mayor': [float(v) for v in stats.fisher_exact([[3, 1], [1, 3]], alternative='greater')],
  'fisher_menor': [float(v) for v in stats.fisher_exact([[3, 1], [1, 3]], alternative='less')],
  'fisher_bil': [float(v) for v in stats.fisher_exact([[8, 2], [1, 5]])],
  'mcnemar_chi': [float(sm_mcnemar([[59, 6], [16, 80]], exact=False, correction=True).statistic), float(sm_mcnemar([[59, 6], [16, 80]], exact=False, correction=True).pvalue)],
  'mcnemar_exacto_59': [0.0, float(sm_mcnemar([[59, 6], [16, 80]], exact=True).pvalue)],
  'mcnemar_exacto': [0.0, float(sm_mcnemar([[20, 9], [2, 15]], exact=True).pvalue)],
  'residuos_tipificados': [[float(v) for v in fila] for fila in Table(np.array([[20, 30, 50], [30, 30, 40]])).standardized_resids],
  'residuos_pearson': [[float(v) for v in fila] for fila in Table(np.array([[20, 30, 50], [30, 30, 40]])).resid_pearson],
}

# distribuciones nuevas: [parámetros, x, pdf, cdf, sf] y cuantiles
from scipy import stats as _st
def _d(nombre, d, par, xs, ps):
    return {'par': par, 'x': xs, 'pdf': [float(d.pdf(x)) for x in xs], 'cdf': [float(d.cdf(x)) for x in xs], 'sf': [float(d.sf(x)) for x in xs], 'p': ps, 'ppf': [float(d.ppf(q)) for q in ps]}
_ps = [0.05, 0.5, 0.95]
R['distribuciones'] = {
  'gamma': _d('gamma', _st.gamma(3, scale=1/2), {'forma': 3, 'tasa': 2}, [0.3, 1.0, 2.0, 4.0], _ps),
  'gamma_pequena': _d('gamma', _st.gamma(0.5, scale=1/1.5), {'forma': 0.5, 'tasa': 1.5}, [0.1, 1.0, 3.0], _ps),
  'beta': _d('beta', _st.beta(2, 5), {'al': 2, 'be': 5}, [0.1, 0.4, 0.8], _ps),
  'beta_u': _d('beta', _st.beta(0.5, 0.5), {'al': 0.5, 'be': 0.5}, [0.1, 0.5, 0.9], _ps),
  'lognormal': _d('lognormal', _st.lognorm(0.5, scale=math.exp(1)), {'mu': 1, 'sigma': 0.5}, [1, 3, 5, 12], _ps),
  'weibull': _d('weibull', _st.weibull_min(2, scale=1000), {'forma': 2, 'escala': 1000}, [200, 886.2269, 1500, 3000], _ps),
  'weibull_k05': _d('weibull', _st.weibull_min(0.7, scale=3), {'forma': 0.7, 'escala': 3}, [0.5, 3, 9], _ps),
  'momentos': {k: [float(v[0]), float(v[1])] for k, v in {'gamma': _st.gamma(3, scale=1/2).stats(), 'beta': _st.beta(2, 5).stats(), 'lognormal': _st.lognorm(0.5, scale=math.exp(1)).stats(), 'weibull': _st.weibull_min(2, scale=1000).stats(), 'nbinomial': _st.nbinom(3, 0.4).stats()}.items()},
  'nbinomial': {'par': {'r': 3, 'p': 0.4}, 'k': list(range(0, 9)), 'pmf': [float(_st.nbinom.pmf(k, 3, 0.4)) for k in range(0, 9)], 'cdf': [float(_st.nbinom.cdf(k, 3, 0.4)) for k in range(0, 9)], 'sf_ge': [float(_st.nbinom.sf(k - 1, 3, 0.4)) for k in range(0, 9)]},
}

json.dump(R, open(os.path.join(os.path.dirname(__file__), 'estadistica.json'), 'w'), ensure_ascii=False, indent=1)
print('estadistica.json escrito')
