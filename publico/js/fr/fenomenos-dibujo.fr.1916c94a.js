const Dibujo = (() => {
  const suave = (t) => t * t * (3 - 2 * t);
  const tramo = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const rgba = (hex, a) => { const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const trio = (hex) => { const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mezcla = (a, b, q) => { const A = trio(a), B = trio(b); return '#' + A.map((x, j) => Math.round(x + (B[j] - x) * q).toString(16).padStart(2, '0')).join(''); };
  const azar = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function vista(g, w, h, c, cam = { x: 8, y: 4.5, z: 1 }) {
    const k = Math.min(w / 16, h / 9), v = { k, cam };
    const crece = Math.max(1, 11 / ((13 * k) / 40)), puestos = [], paneles = [];
    let amp = null;
    const pon = (cx, cy, z) => { v.K = k * z; v.cx = cx; v.cy = cy; v.x0 = cx - w / 2 / v.K; v.x1 = cx + w / 2 / v.K; v.y0 = cy - h / 2 / v.K; return v; };
    const suelta = () => { if (amp) { const o = amp.antes; amp = null; pon(o.cx, o.cy, o.z); } };
    const fuera = (x, y) => amp && (x < amp.x - 0.6 || x > amp.x + amp.w + 0.6 || y < amp.y - 0.6 || y > amp.y + amp.h + 0.6);
    v.mira = (cx, cy, z) => { amp = null; return pon(cx, cy, z); };
    v.mundo = () => v.mira(cam.x, cam.y, cam.z);
    v.pantalla = () => v.mira(8, 4.5, 1);
    v.sigue = (meta, reloj, quieto) => {
      const dt = cam.antes === undefined || quieto ? 99 : Math.min(0.1, Math.max(0, reloj - cam.antes)), f = 1 - Math.exp(-dt * 2.4);
      cam.antes = reloj;
      cam.x += (meta.x - cam.x) * f; cam.y += (meta.y - cam.y) * f; cam.z = Math.exp(Math.log(cam.z) + (Math.log(meta.z) - Math.log(cam.z)) * f);
      return v.mundo();
    };
    v.X = (x) => { if (amp && fuera(x, amp.y)) suelta(); return w / 2 + (x - v.cx) * v.K; };
    v.Y = (y) => { if (amp && fuera(amp.x, y)) suelta(); return h / 2 + (y - v.cy) * v.K; };
    const letra = (px, peso = 500) => `${peso} ${Math.max(11, (px * k) / 40)}px "IBM Plex Sans", system-ui, sans-serif`;
    v.rotulo = (txt, x, y, { color = c.rotulo, tam = 13, al = 'left', peso = 500, fondo = true, escribe = 1 } = {}) => {
      if (escribe <= 0 || window.FenomenoFoto) return;
      if (fuera(x, y)) suelta();
      const letras = [...txt], ver = escribe >= 1 ? txt : letras.slice(0, Math.ceil(letras.length * escribe)).join('');
      g.font = letra(tam, peso); g.textAlign = 'left'; g.textBaseline = 'middle';
      let m = g.measureText(txt).width;
      if (m > w - 16) { const f = letra(tam, peso).replace(/[\d.]+px/, (q) => Math.max(8, (parseFloat(q) * (w - 16)) / m).toFixed(1) + 'px'); g.font = f; m = g.measureText(txt).width; }
      const p = 4, X = v.X(x); let x2 = al === 'center' ? X - m / 2 : al === 'right' ? X - m : X, y2 = v.Y(y);
      if (X >= 0 && X <= w && y2 >= 0 && y2 <= h && m + 16 <= w + 1) { x2 = Math.min(w - m - 8, Math.max(8, x2)); y2 = Math.min(h - 15, Math.max(15, y2)); }
      if (!amp && g.globalAlpha >= 0.5 && !paneles.some((r) => !r.amp && X >= r.x && X <= r.x + r.w && y2 >= r.y && y2 <= r.y + r.h)) {
        const sobre = (yy) => paneles.filter((r) => r.amp && x2 + m > r.x && x2 < r.x + r.w && yy + 13 > r.y && yy - 13 < r.y + r.h);
        const choca = (yy) => sobre(yy).length || puestos.some((r) => Math.abs(r.y - yy) < 14 && x2 + m > r.x + 4 && x2 < r.x + r.m - 4);
        const yy = [0, 20, -20, 40, -40].map((d) => y2 + d).concat(sobre(y2).flatMap((r) => [r.y + r.h + 17, r.y - 17, r.y + r.h + 37])).find((q) => q >= 15 && q <= h - 15 && !choca(q));
        if (yy !== undefined) y2 = yy;
        puestos.push({ x: x2, y: y2, m });
      }
      if (fondo) { g.fillStyle = rgba(c.panel, 0.85); g.fillRect(x2 - p, y2 - 9 - p, m + 2 * p, 18 + 2 * p); }
      g.fillStyle = color; g.fillText(ver, x2, y2);
    };
    v.ancho = (txt, tam = 13, peso = 500) => { g.font = letra(tam, peso); return g.measureText(txt).width / v.K; };
    v.signo = (x, y, s, color, a = 1, tam = 1) => {
      const r = 0.13 * v.K * tam; g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = Math.max(1.5, 0.045 * v.K * tam); g.beginPath();
      g.moveTo(v.X(x) - r, v.Y(y)); g.lineTo(v.X(x) + r, v.Y(y)); if (s > 0) { g.moveTo(v.X(x), v.Y(y) - r); g.lineTo(v.X(x), v.Y(y) + r); } g.stroke(); g.globalAlpha = 1;
    };
    v.flecha = (xa, ya, xb, yb, color, a = 1, ancho = 0.03) => {
      g.globalAlpha = a; g.strokeStyle = color; g.fillStyle = color; g.lineWidth = Math.max(1, ancho * v.K);
      g.beginPath(); g.moveTo(v.X(xa), v.Y(ya)); g.lineTo(v.X(xb), v.Y(yb)); g.stroke();
      const an = Math.atan2(v.Y(yb) - v.Y(ya), v.X(xb) - v.X(xa)), L = 0.18 * v.K;
      g.beginPath(); g.moveTo(v.X(xb), v.Y(yb)); g.lineTo(v.X(xb) - L * Math.cos(an - 0.4), v.Y(yb) - L * Math.sin(an - 0.4)); g.lineTo(v.X(xb) - L * Math.cos(an + 0.4), v.Y(yb) - L * Math.sin(an + 0.4)); g.fill(); g.globalAlpha = 1;
    };
    v.punto = (x, y, r, color, a = 1) => { g.globalAlpha = a; g.fillStyle = color; g.beginPath(); g.arc(v.X(x), v.Y(y), r * v.K, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1; };
    v.panel = (x, y, ancho, alto, a = 0.94, fijo = false) => {
      suelta();
      const s = fijo ? 1 : Math.min(crece, (w - 8) / (ancho * v.K), (h - 8) / (alto * v.K));
      if (s > 1.02) {
        const antes = { cx: v.cx, cy: v.cy, z: v.K / k }, W = ancho * v.K, H = alto * v.K, entre = (q) => Math.min(1, Math.max(0, q));
        const nx = 4 + entre((v.X(x) - 4) / Math.max(1, w - 8 - W)) * (w - 8 - W * s), ny = 4 + entre((v.Y(y) - 4) / Math.max(1, h - 8 - H)) * (h - 8 - H * s), K = v.K * s;
        pon(x - (nx - w / 2) / K, y - (ny - h / 2) / K, K / k); amp = { x, y, w: ancho, h: alto, antes };
      }
      g.save(); g.fillStyle = rgba(c.panel, a); g.shadowColor = rgba('#000', 0.18); g.shadowBlur = 16; g.shadowOffsetY = 3;
      g.beginPath(); g.roundRect(v.X(x), v.Y(y), ancho * v.K, alto * v.K, 0.22 * v.K); g.fill(); g.restore();
      paneles.push({ x: v.X(x), y: v.Y(y), w: ancho * v.K, h: alto * v.K, amp: !!amp });
    };
    v.degradado = (ya, yb, ca, cb, xa = null, xb = null) => {
      const gr = g.createLinearGradient(0, v.Y(ya), 0, v.Y(yb)); gr.addColorStop(0, ca); gr.addColorStop(1, cb); g.fillStyle = gr;
      const x = xa === null ? 0 : v.X(xa), an = xb === null ? w - x : v.X(xb) - x; g.fillRect(x, v.Y(ya), an, v.Y(yb) - v.Y(ya) + 1);
    };
    v.brillo = (x, y, r, color, a = 0.5) => {
      if (a <= 0) return;
      const R = r * v.K, gr = g.createRadialGradient(v.X(x), v.Y(y), 0, v.X(x), v.Y(y), R); gr.addColorStop(0, rgba(color, a)); gr.addColorStop(1, rgba(color, 0));
      g.fillStyle = gr; g.fillRect(v.X(x) - R, v.Y(y) - R, 2 * R, 2 * R);
    };
    v.sombra = (x, y, rx, ry = rx * 0.18, a = 0.22) => {
      g.save(); g.translate(v.X(x), v.Y(y)); g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx * v.K); gr.addColorStop(0, rgba('#000', a)); gr.addColorStop(1, rgba('#000', 0));
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx * v.K, 0, 2 * Math.PI); g.fill(); g.restore();
    };
    v.motas = (xa, ya, xb, yb, n, color, a = 0.3, r = 0.03, semilla = 1) => {
      g.fillStyle = rgba(color, a);
      for (let j = 0; j < n; j++) { const q = azar(semilla * 31 + j), q2 = azar(semilla * 57 + j * 3), q3 = azar(semilla * 91 + j * 7); g.beginPath(); g.ellipse(v.X(xa + (xb - xa) * q), v.Y(ya + (yb - ya) * q2), r * (0.5 + q3) * v.K * 1.5, r * (0.5 + q3) * v.K, 0, 0, 2 * Math.PI); g.fill(); }
    };
    v.colinas = (y, alto, base, color, semilla = 1, a = 1) => {
      g.fillStyle = rgba(color, a); g.beginPath(); g.moveTo(0, v.Y(base));
      for (let px = 0; px <= w + 8; px += 8) { const x = v.x0 + px / v.K; g.lineTo(px, v.Y(y - alto * (0.5 + 0.3 * Math.sin(x * 0.55 + semilla * 2.1) + 0.2 * Math.sin(x * 1.3 + semilla * 5.3)))); }
      g.lineTo(w, v.Y(base)); g.closePath(); g.fill();
    };
    v.vineta = (a = 0.16) => {
      const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.hypot(w, h) * 0.62); gr.addColorStop(0, rgba('#000', 0)); gr.addColorStop(1, rgba('#000', a));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    };
    v.pieza = (x, y, an, al, color, radio = 0.12, a = 1) => {
      const gr = g.createLinearGradient(0, v.Y(y), 0, v.Y(y + al)); gr.addColorStop(0, mezcla(color, '#ffffff', 0.22)); gr.addColorStop(0.55, color); gr.addColorStop(1, mezcla(color, '#000000', 0.25));
      g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.roundRect(v.X(x), v.Y(y), an * v.K, al * v.K, radio * v.K); g.fill(); g.globalAlpha = 1;
    };
    v.chispa = (xa, ya, xb, yb, n, color, ancho = 0.05, quiebros = 7) => {
      const L = Math.hypot(xb - xa, yb - ya), nx = -(yb - ya) / L, ny = (xb - xa) / L;
      g.strokeStyle = color; g.lineWidth = Math.max(1.2, ancho * v.K); g.lineJoin = 'round'; g.beginPath(); g.moveTo(v.X(xa), v.Y(ya));
      for (let j = 1; j < quiebros; j++) { const s = j / quiebros, d = (azar(n * 17 + j) - 0.5) * 0.35 * L / Math.sqrt(quiebros); g.lineTo(v.X(xa + (xb - xa) * s + nx * d), v.Y(ya + (yb - ya) * s + ny * d)); }
      g.lineTo(v.X(xb), v.Y(yb)); g.stroke();
    };
    return v.mundo();
  }
  return { suave, tramo, rgba, mezcla, azar, vista };
})();

