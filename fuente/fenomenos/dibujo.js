/* =====================================================================
   Ayudantes de dibujo comunes a las escenas de «Física en la vida real»
   (fenomenos/<clave>/escena.js). Va en la página tras animacion.js.
     Dibujo.suave, tramo, rgba, azar   curvas de 0 a 1, color con alfa y azar fijo
     Dibujo.vista(g, w, h, c)  un mundo de 16 × 9 unidades dentro del lienzo, con
         cámara: v.mira(cx, cy, zoom) la mueve (v.pantalla() vuelve a la vista
         entera, para lo que va fijo como un medidor) y v.sigue(meta, reloj,
         quieto) la lleva suave hacia otra cámara. Luego v.X(x) y v.Y(y) pasan a
         px, v.K son los px por unidad y v.x0, v.x1, v.y0 lo que se ve; y dibuja
         rótulos (que se escriben solos con «escribe»), signos + y −, flechas y
         puntos, siempre en coordenadas del mundo.
   ===================================================================== */
const Dibujo = (() => {
  const suave = (t) => t * t * (3 - 2 * t);
  const tramo = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const rgba = (hex, a) => { const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  // azar fijo (siempre las mismas posiciones)
  const azar = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  function vista(g, w, h, c, cam = { x: 8, y: 4.5, z: 1 }) {
    const k = Math.min(w / 16, h / 9), v = { k, cam };
    v.mira = (cx, cy, z) => { v.K = k * z; v.cx = cx; v.cy = cy; v.x0 = cx - w / 2 / v.K; v.x1 = cx + w / 2 / v.K; v.y0 = cy - h / 2 / v.K; return v; };
    v.mundo = () => v.mira(cam.x, cam.y, cam.z);
    v.pantalla = () => v.mira(8, 4.5, 1);
    // la cámara va suave hacia «meta» (el zoom, en escala logarítmica); con quieto, de golpe
    v.sigue = (meta, reloj, quieto) => {
      const dt = cam.antes === undefined || quieto ? 99 : Math.min(0.1, Math.max(0, reloj - cam.antes)), f = 1 - Math.exp(-dt * 2.4);
      cam.antes = reloj;
      cam.x += (meta.x - cam.x) * f; cam.y += (meta.y - cam.y) * f; cam.z = Math.exp(Math.log(cam.z) + (Math.log(meta.z) - Math.log(cam.z)) * f);
      return v.mundo();
    };
    v.X = (x) => w / 2 + (x - v.cx) * v.K;
    v.Y = (y) => h / 2 + (y - v.cy) * v.K;
    const letra = (px, peso = 500) => `${peso} ${Math.max(11, (px * k) / 40)}px "IBM Plex Sans", system-ui, sans-serif`;
    // rótulo; con «escribe» (0 a 1) aparece letra a letra, como escrito en la pizarra
    v.rotulo = (txt, x, y, { color = c.rotulo, tam = 13, al = 'left', peso = 500, fondo = true, escribe = 1 } = {}) => {
      if (escribe <= 0) return;
      const letras = [...txt], ver = escribe >= 1 ? txt : letras.slice(0, Math.ceil(letras.length * escribe)).join('');
      g.font = letra(tam, peso); g.textAlign = al; g.textBaseline = 'middle';
      if (fondo) { const m = g.measureText(txt).width, p = 4, x2 = al === 'center' ? v.X(x) - m / 2 : al === 'right' ? v.X(x) - m : v.X(x); g.fillStyle = rgba(c.panel, 0.85); g.fillRect(x2 - p, v.Y(y) - 9 - p, m + 2 * p, 18 + 2 * p); }
      g.fillStyle = color; g.fillText(ver, v.X(x), v.Y(y));
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
    // recuadro con sombra (paneles y medidores)
    v.panel = (x, y, ancho, alto, a = 0.94) => {
      g.save(); g.fillStyle = rgba(c.panel, a); g.shadowColor = rgba('#000', 0.18); g.shadowBlur = 16; g.shadowOffsetY = 3;
      g.beginPath(); g.roundRect(v.X(x), v.Y(y), ancho * v.K, alto * v.K, 0.22 * v.K); g.fill(); g.restore();
    };
    // chispa quebrada de (xa, ya) a (xb, yb), distinta cada vez que cambia «n»
    v.chispa = (xa, ya, xb, yb, n, color, ancho = 0.05, quiebros = 7) => {
      const L = Math.hypot(xb - xa, yb - ya), nx = -(yb - ya) / L, ny = (xb - xa) / L;
      g.strokeStyle = color; g.lineWidth = Math.max(1.2, ancho * v.K); g.lineJoin = 'round'; g.beginPath(); g.moveTo(v.X(xa), v.Y(ya));
      for (let j = 1; j < quiebros; j++) { const s = j / quiebros, d = (azar(n * 17 + j) - 0.5) * 0.35 * L / Math.sqrt(quiebros); g.lineTo(v.X(xa + (xb - xa) * s + nx * d), v.Y(ya + (yb - ya) * s + ny * d)); }
      g.lineTo(v.X(xb), v.Y(yb)); g.stroke();
    };
    return v.mundo();
  }
  return { suave, tramo, rgba, azar, vista };
})();
