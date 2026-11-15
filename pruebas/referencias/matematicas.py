#!/usr/bin/env python3
"""Valores de referencia de Matemáticas con sympy (Fase 14, F14.2): mismo patrón que estadistica.py.
Los problemas se escriben con la sintaxis de las herramientas (sen, tg, e^x, 2x…); aquí se pasan a sympy y se
resuelven por programa, no a mano. pruebas/referencias-matematicas.js los lee y los compara con las herramientas.
    pip install sympy mpmath && python3 pruebas/referencias/matematicas.py"""
import json, os, re
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

x, t, n, s = sp.symbols('x t n s', real=True)
LOC = {'x': x, 't': t, 'n': n, 's': s, 'e': sp.E, 'sen': sp.sin, 'tg': sp.tan, 'arctg': sp.atan, 'arcsen': sp.asin, 'arccos': sp.acos, 'cotg': sp.cot,
       'ln': sp.log, 'senh': sp.sinh, 'cosh': sp.cosh, 'abs': sp.Abs, 'sqrt': sp.sqrt, 'cos': sp.cos, 'sec': sp.sec, 'pi': sp.pi}
TR = standard_transformations + (implicit_multiplication_application, convert_xor)
def P(txt):
    # «sen(x)^2» etc.; «cos x» sin paréntesis no se usa aquí
    return parse_expr(txt, local_dict=LOC, transformations=TR)
R = {'versiones': {'sympy': sp.__version__}}
num = lambda v: float(sp.N(v, 20))

# ---------- integrales: ∫ₐᵇ f dx numérica (la primitiva de la herramienta menos su valor en a) ----------
INT = ['x e^(3x)', 'x^2 e^(-x)', 'x^2 sen(x)', 'x cos(2x)', 'e^(-x) sen(2x)', 'e^(3x) cos(x)', 'ln(x^2+1)', 'arcsen(x)', 'arccos(x)', 'x^2 arctg(x)', '1/(x^2+2x+5)',
       'x/(x^2+4x+5)', '(3x+1)/(x^2-x-6)', '1/(x^3+x)', '(x^2+1)/(x^3-x)', '1/(x^2(x-1))', 'x^3/(x^2+1)', '1/cos(x)', 'cotg(x)', 'sen(x)^2', 'cos(x)^3', 'sen(2x)cos(x)',
       'sen(x)^5', 'x senh(x)', 'e^x/(e^(2x)+1)', 'e^x sen(x)', 'sqrt(x)/(x+1)', '1/(sqrt(x)+1)', 'x/sqrt(x+1)', '1/(x sqrt(x+1))', 'x^2 e^(x^3)', 'sen(sqrt(x))',
       '1/(x^2+6x+13)', '1/sqrt(x^2+2x+5)', 'sqrt(x^2+2x+5)', '1/sqrt(3-2x-x^2)', 'sqrt(4x-x^2)', 'arctg(x)/x^2', 'ln(x)/x^2', 'ln(1+x)/sqrt(x)', '(x^2+x+1)/((x+1)^2(x+2))',
       '1/(x^4-1)', '1/(x^4+1)', 'x/(x^4+1)', 'x^2/(x^4+1)', 'e^(2x) cos(3x)', 'sen(x)cos(x)^2', 'tg(x)/cos(x)^2', '1/(x^2-4x+3)', '1/(e^x-1)', 'x sqrt(x+1)', 'sen(x)^2 cos(x)^3',
       '1/sen(x)', 'x/sqrt(1-x^2)', '1/(1+e^x)', 'x arcsen(x)', 'e^sqrt(x)', 'x^2/(x^2+1)^2', 'x^3 sen(x)', 'ln(x)^2', 'x ln(x)', 'sen(x) e^x cos(x)', '1/(x^2+x+1)', 'x (x^2+1)^3']
A, B = 0.2, 0.8
R['integrales'] = []
for f in INT:
    try: v = num(sp.Integral(P(f), (x, A, B)).evalf(30))
    except Exception: continue
    R['integrales'].append({'f': f, 'a': A, 'b': B, 'v': v})

# ---------- límites ----------
LIM = [('(sen(x)-x)/x^3', '0'), ('(1-cos(x))/x^2', '0'), ('(e^x-1-x)/x^2', '0'), ('(tg(x)-x)/x^3', '0'), ('(x-sen(x))/(x-tg(x))', '0'), ('ln(1+x)/x', '0'),
       ('(1-cos(2x))/(x sen(x))', '0'), ('(sqrt(1+x)-1)/x', '0'), ('(1+1/x)^x', 'inf'), ('x sen(1/x)', 'inf'), ('x(e^(1/x)-1)', 'inf'), ('(x^2+3x)/(2x^2-1)', 'inf'),
       ('sqrt(x^2+x)-x', 'inf'), ('x ln(x)', '0'), ('x^x', '0'), ('(cos(x))^(1/x^2)', '0'), ('(1+2x)^(1/x)', '0'), ('(sen(x)/x)^(1/x^2)', '0'), ('ln(x)/(x-1)', '1'),
       ('(x^3-1)/(x-1)', '1'), ('(arctg(x)-x)/x^3', '0'), ('(e^x-cos(x)-x)/x^2', '0'), ('1/x-1/sen(x)', '0'), ('(2^x-1)/x', '0'), ('(x-1)/ln(x)', '1'), ('x^2 e^(-x)', 'inf'),
       ('(x^2-4)/(x-2)', '2'), ('(sen(3x))/(sen(5x))', '0'), ('x^(1/x)', 'inf'), ('(1-cos(x))/(x tg(x))', '0'), ('(e^(3x)-1)/(e^(5x)-1)', '0'), ('ln(cos(x))/x^2', '0')]
R['limites'] = []
for f, a in LIM:
    try:
        v = sp.limit(P(f), x, sp.oo if a == 'inf' else sp.Rational(a))
        if v.has(sp.oo, sp.zoo, sp.nan): continue
        R['limites'].append({'f': f, 'a': a, 'v': num(v)})
    except Exception: pass

# ---------- series: suma de n = n0 a ∞ ----------
SER = [('1/2^n', 0), ('1/n^2', 1), ('1/n^3', 1), ('1/(n(n+1))', 1), ('(-1)^n/n', 1), ('(-1)^n/(2n+1)', 0), ('n/2^n', 1), ('1/n!', 0), ('1/(n^2+1)', 0), ('n^2/3^n', 1),
       ('(-1)^n/n^2', 1), ('1/(n^2+3n+2)', 0), ('2^n/n!', 0), ('1/(2n-1)^2', 1), ('n e^(-n)', 1), ('1/(n^2(n+1))', 1), ('(-1)^n/n!', 0)]  # Σ1/(n ln²n) no va: converge tan despacio que el evalf de sympy da 2,1070 y el valor conocido es 2,10974
R['series'] = []
for f, n0 in SER:
    ex = P(f.replace('n!', 'factorial(n)')) if 'ln' not in f else P(f)
    try:
        v = sp.N(sp.Sum(ex, (n, n0, sp.oo)).evalf(25))
        if v.has(sp.oo, sp.nan, sp.zoo): continue
        R['series'].append({'an': f, 'n0': n0, 'v': float(v)})
    except Exception: pass

# ---------- autovalores (reales y complejos) ----------
MAT = [[[2, 1], [1, 2]], [[1, 1], [1, 0]], [[0, -1], [1, 0]], [[4, 1, 0], [1, 4, 1], [0, 1, 4]], [[2, 0, 0], [0, 3, 4], [0, 4, 9]], [[1, 2, 3], [4, 5, 6], [7, 8, 10]],
       [[3, 1, 0, 0], [1, 3, 0, 0], [0, 0, 2, 1], [0, 0, 1, 2]], [[5, -2], [4, -1]], [[1, -1], [1, 1]], [[2, 1, 1], [1, 2, 1], [1, 1, 2]], [[0, 1, 0], [0, 0, 1], [-6, -11, -6]],
       [[1, 2, 0, 0], [0, 1, 0, 0], [0, 0, 3, 1], [0, 0, 0, 3]]]
R['autovalores'] = []
for M in MAT:
    ev = sp.Matrix(M).eigenvals()
    vals = sorted([(float(sp.re(sp.N(k))), float(sp.im(sp.N(k))), int(m)) for k, m in ev.items()])
    R['autovalores'].append({'A': M, 'ev': vals, 'det': float(sp.Matrix(M).det()), 'rango': int(sp.Matrix(M).rank())})

# ---------- EDOs de primer orden y ecuaciones lineales de segundo orden: y(x1) ----------
y = sp.Function('y')
ED1 = [('x + y', 0, 1, 1), ('y', 0, 1, 1), ('x y', 0, 1, 1), ('-2 y + x', 0, 1, 1), ('y/x + x', 1, 1, 2), ('(x+y)/x', 1, 1, 2), ('y^2', 0, 1, 0.5), ('e^x - y', 0, 0, 1),
       ('cos(x) - y', 0, 0, 2), ('2 x y', 0, 1, 1), ('y(1-y)', 0, 0.5, 2), ('-y/x + sen(x)/x', 1, 1, 2)]
R['edos1'] = []
for f, x0, y0, x1 in ED1:
    try:
        sol = sp.dsolve(sp.Eq(y(x).diff(x), P(f.replace('y', 'Y')).subs(sp.Symbol('Y'), y(x))) if False else sp.Eq(y(x).diff(x), parse_expr(f, local_dict={**LOC, 'y': y(x)}, transformations=TR)), y(x), ics={y(x0): y0})
        v = float(sp.N(sol.rhs.subs(x, x1)))
        R['edos1'].append({'f': f, 'x0': x0, 'y0': y0, 'x1': x1, 'v': v})
    except Exception: pass
ED2 = [(1, 3, 2, 0, 1, 0, 1), (1, 2, 1, 0, 1, 1, 1), (1, 0, 4, 0, 1, 0, 1), (1, 2, 5, 0, 0, 1, 1), (1, -3, 2, 0, 2, 1, 1), (2, 3, 1, 0, 1, 0, 2), (1, 0, 1, 0, 1, 1, 3)]
R['edos2'] = []
for a, b, c, x0, y0, v0, x1 in ED2:
    sol = sp.dsolve(a * y(x).diff(x, 2) + b * y(x).diff(x) + c * y(x), y(x), ics={y(x0): y0, y(x).diff(x).subs(x, x0): v0})
    R['edos2'].append({'a': a, 'b': b, 'c': c, 'x0': x0, 'y0': y0, 'v0': v0, 'x1': x1, 'v': float(sp.N(sol.rhs.subs(x, x1)))})

# ---------- Taylor: coeficientes a_k = f^(k)(a)/k! y radio de convergencia ----------
TAY = [('e^x', 0), ('sen(x)', 0), ('cos(x)', 0), ('1/(1-x)', 0), ('ln(1+x)', 0), ('arctg(x)', 0), ('(1+x)^(1/2)', 0), ('e^x sen(x)', 0), ('tg(x)', 0), ('senh(x)', 0), ('ln(x)', 2), ('1/x', 1),
       ('sqrt(x)', 4), ('e^(2x)', 1), ('sen(x)', 1), ('1/(1+x^2)', 0), ('arcsen(x)', 0), ('x e^x', 0)]
R['taylor'] = []
for f, a in TAY:
    ex = P(f); N = 7
    cs = [float(sp.N(ex.diff(x, k).subs(x, a) / sp.factorial(k))) for k in range(N)]
    R['taylor'].append({'f': f, 'a': a, 'n': N - 1, 'coef': cs})

# ---------- Laplace: F(s) de f(t), y f(t) de F(s) ----------
LAP = ['t^2 e^(-2t)', 'sen(3t)', 'cos(2t)', 't e^(-t) sen(2t)', 'e^(-3t) cos(t)', 't^3', '3t^2 + 2e^(-4t) - 5', 'senh(2t)', 't cos(3t)', 'e^(2t) t^2', 'cosh(t) e^(-t)']
R['laplace'] = []
for f in LAP:
    F = sp.laplace_transform(P(f), t, s, noconds=True)
    try: R['laplace'].append({'f': f, 'pts': [{'s': sv, 'v': float(sp.re(sp.N(F.subs(s, sv))))} for sv in (2.5, 4.0, 7.3)]})
    except Exception as e: print('Laplace sin referencia', f, e)
INV = ['(s+3)/(s^2+4s+13)', '(3s+7)/((s+1)(s+3))', '1/(s^2(s+2))', 's/(s^2+1)^2', '(2s+1)/(s^2+2s+5)', '1/((s+1)^3)', '(s^2+1)/(s(s+1)(s+2))', '5/(s^2+9)', '1/(s^2+3s+2)', '(s+2)/(s^2+4s+8)^2']
R['laplace_inv'] = []
for F in INV:
    f = sp.inverse_laplace_transform(P(F), s, t)
    f = f.subs(sp.Heaviside(t), 1)
    try: R['laplace_inv'].append({'F': F, 'pts': [{'t': tv, 'v': float(sp.re(sp.N(f.subs(t, tv))))} for tv in (0.3, 0.9, 1.7)]})
    except Exception as e: print('Laplace inversa sin referencia', F, e)

json.dump(R, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'matematicas.json'), 'w'), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in R.items() if isinstance(v, list)})
