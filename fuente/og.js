/* ===== og.js · imágenes para compartir el enlace (publico/og.png y publico/og/<asignatura>.png, 1200 × 630) =====
   Uso: node fuente/og.js   (necesita Playwright y haber compilado publico/ antes: lee de ahí la fuente STIX). Hace el banner general y uno
   por asignatura (y «Física en la vida real»): el icono de fuente/icono.svg o fuente/iconos/<clave>.svg a la izquierda con sus órbitas,
   y a la derecha el nombre y una frase. Hay que volver a ejecutarlo si cambia el nombre, el icono, los colores o las frases (TAG).
   Las páginas de cada asignatura y de sus herramientas usan su banner como og:image (portal.js y herramientas.js).
   Tipografías: STIX Two (la del logo, publico/fuentes) y Figtree 500/700 (fuente/og/, licencia OFL-Figtree.txt). */
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const Catalogo = require('./catalogo.js'), [m1, m2] = Catalogo.marca, FY = '#4db8c4';
const b64 = (f) => fs.readFileSync(f).toString('base64');
const stix = b64(path.join(__dirname, '..', 'publico', 'fuentes', 'stix-two-math.woff2'));
const fig = (p) => b64(path.join(__dirname, 'og', `figtree-${p}.woff`));
const mezcla = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.substr(i, 2), 16) * t + parseInt(b.substr(i, 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
const TAG = { electromagnetismo: 'Electrostática, magnetostática, inducción y dieléctricos, paso a paso', fisica: 'Mecánica y termodinámica: energía, cinemática y calor', quimica: 'Tabla periódica, estequiometría y disoluciones', matematicas: 'Álgebra y cálculo, con cada paso explicado', estadistica: 'Distribuciones, regresión, intervalos y contrastes', circuitos: 'Corriente continua y alterna: Kirchhoff, Thévenin y fasores', economia: 'Microeconomía, macroeconomía y matemática financiera', fenomenos: 'Fenómenos de la vida real, explicados con una animación' };
const BANNERS = [{ clave: 'general', nombre: null, color: '#4dd0e1', tag: 'Simuladores y calculadoras de ciencias, paso a paso y gratis', base: '#0e2f38', icono: 'icono.svg', salida: 'og.png' },
  ...[...Catalogo.asignaturas, Catalogo.fenomenos].map((a) => ({ clave: a.clave, nombre: a.nombre, color: a.colorOscuro, tag: TAG[a.clave], base: mezcla(a.colorOscuro, '#0b0f12', .34), icono: `iconos/${a.clave}.svg`, salida: `og/${a.clave}.png` }))];
const css = `@font-face{font-family:S;src:url(data:font/woff2;base64,${stix})}@font-face{font-family:F;font-weight:700;src:url(data:font/woff;base64,${fig(700)})}@font-face{font-family:F;font-weight:500;src:url(data:font/woff;base64,${fig(500)})}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;position:relative;overflow:hidden;font-family:F,sans-serif;color:#e8ecef}
.wm{font:600 40px S,serif;opacity:.9}.wm i{color:${FY}}.t{font:600 80px/1.02 S,serif;margin:16px 0 0;color:#fff}.p{font:500 28px/1.38 F;color:#aab6bd;margin:22px 0 0;max-width:520px}img{display:block}`;
const estrellas = (n, semilla) => { let r = semilla, o = ''; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < n; i++) o += `<i style="position:absolute;left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;width:${2 + rnd() * 3}px;height:${2 + rnd() * 3}px;border-radius:50%;background:#fff;opacity:${(.2 + rnd() * .5).toFixed(2)}"></i>`; return o; };
const html = (s) => `<style>${css}</style><body style="background:radial-gradient(900px 700px at 15% 15%,${s.color}66,transparent 60%),linear-gradient(200deg,${s.base} 0%,#04070a 90%)">${estrellas(60, 21)}
<svg width="1200" height="630" style="position:absolute;inset:0" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-opacity=".35"><ellipse cx="330" cy="315" rx="560" ry="170" transform="rotate(18 330 315)"/><ellipse cx="330" cy="315" rx="560" ry="170" transform="rotate(-18 330 315)" stroke-opacity=".22"/></svg>
<img src="data:image/svg+xml;base64,${b64(path.join(__dirname, s.icono))}" width="380" height="380" style="position:absolute;left:120px;top:125px;filter:drop-shadow(0 20px 40px #0008)">
<div style="position:absolute;left:560px;width:580px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">${s.nombre
  ? `<div class="wm">${m1}<i>${m2}</i></div><h1 class="t" style="font-size:${Math.min(80, Math.floor(560 / (s.nombre.length * .5)))}px">${s.nombre}</h1><p class="p">${s.tag}</p>`
  : `<h1 class="t" style="font-size:124px;line-height:1;margin:0">${m1}<i style="color:${FY}">${m2}</i></h1><p class="p" style="font-size:31px">${s.tag}</p>`}</div></body>`;
(async () => {
  const publico = path.join(__dirname, '..', 'publico'); fs.mkdirSync(path.join(publico, 'og'), { recursive: true });
  const b = await chromium.launch();
  for (const s of BANNERS) {
    const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
    await p.setContent(html(s)); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(publico, s.salida) }); await p.close();
  }
  await b.close();
  // los degradados pesan en PNG (~790 KB): se cuantizan a 256 colores con Pillow si está (unos 150 KB); si no, se dejan como salen
  try {
    require('child_process').execFileSync('python3', ['-c', `
import sys
from PIL import Image
for f in sys.argv[1:]:
    Image.open(f).convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(f, optimize=True)
`, ...BANNERS.map((s) => path.join(publico, s.salida))]);
  } catch (e) { console.log('Sin Pillow: PNG sin cuantizar'); }
})();
