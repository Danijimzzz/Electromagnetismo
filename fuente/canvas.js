/* =====================================================================
   Lienzo: corte 2D (líneas de campo, equipotenciales, mapa de color,
   puntos arrastrables, cargas de prueba) y vista 3D girable.
   El fondo se guarda en una capa en caché: pasar el ratón o animar
   no recalcula el campo; al arrastrar se dibuja en calidad rápida.
   ===================================================================== */
const Canvas = (() => {
  const { V3 } = Engine;
  const AXES = { xy: [0, 1, 2], xz: [0, 2, 1], yz: [1, 2, 0] };
  const NAMES = ['X', 'Y', 'Z'];
  const AXI = { x: 0, y: 1, z: 2 };
  let cv, g, g0, W = 0, H = 0, dpr = 1;
  let view = { cx: 0, cy: 0, s: 50 }, needFit = true;
  let cam = { yaw: -0.6, pitch: 0.45, s: 50, c: [0, 0, 0] };
  let lastOut = null, lastScen = null, anchors = [], drag = null, hover = null;
  let bg = null, bgKey = '', outVer = 0, lastOutRef = null, fast = false, fastTimer = 0;
  let place = null, probes = [], anim = 0, legend = null;

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const is3D = () => lastScen?.view?.plane === '3d';
  const ax = () => AXES[lastScen?.view?.plane] || AXES.xy;
  const cutVal = () => { try { return Engine.parseExpr(lastScen?.view?.cut || '0', lastScen?.unit); } catch (e) { return 0; } };
  const toS = (p) => { const [a, b] = ax(); return [W / 2 + (p[a] - view.cx) * view.s, H / 2 - (p[b] - view.cy) * view.s]; };
  const toW = (x, y) => { const [a, b, c] = ax(); const p = [0, 0, 0]; p[a] = view.cx + (x - W / 2) / view.s; p[b] = view.cy - (y - H / 2) / view.s; p[c] = cutVal(); return p; };
  const el = (id) => document.getElementById(id);
  const on = (id) => !!el(id)?.checked;

  function init() {
    cv = el('cv');
    g0 = g = cv.getContext('2d');
    bg = document.createElement('canvas');
    new ResizeObserver(() => { resize(); redraw(); }).observe(cv.parentElement);
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { bgKey = ''; redraw(); });
    new MutationObserver(() => { bgKey = ''; redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { hover = null; if (!drag) redraw(); });
    cv.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 0.87); }, { passive: false });
    resize();
  }
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    W = Math.max(200, r.width); H = Math.max(220, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    bg.width = W * dpr; bg.height = H * dpr;
    bgKey = '';
  }
  function fit() { needFit = true; }
  function zoom(k) { if (is3D()) cam.s *= k; else view.s *= k; redraw(); }
  const redraw = () => draw(lastOut, lastScen);

  function scenePoints(out) {
    const pts = [];
    for (const s of out.ctx.sources) {
      const G = s.g; if (!G) continue;
      if (G.pos) pts.push(G.pos);
      if (G.A) pts.push(G.A, G.B);
      const R = G.R2 || G.R;
      if (R && G.pos) pts.push(V3.add(G.pos, [R, R, R]), V3.sub(G.pos, [R, R, R]));
      if (G.c !== undefined && G.i !== undefined) { const p = [0, 0, 0]; p[G.i] = G.c + (G.w ? G.w / 2 : 0); pts.push(p); if (G.w) { const q = [0, 0, 0]; q[G.i] = G.c - G.w / 2; pts.push(q); } }
    }
    for (const r of out.results) {
      for (const m of r.marks || []) pts.push(m.at);
      if (r.seg) pts.push(...r.seg);
      if (r.surf) pts.push(V3.add(r.surf.C, [r.surf.R, r.surf.R, r.surf.R]), V3.sub(r.surf.C, [r.surf.R, r.surf.R, r.surf.R]));
    }
    if (!pts.length) pts.push([0, 0, 0]);
    return pts;
  }
  function doFit(out) {
    const pts = scenePoints(out);
    if (is3D()) {
      const lo = [0, 1, 2].map((k) => Math.min(0, ...pts.map((p) => p[k]))), hi = [0, 1, 2].map((k) => Math.max(0, ...pts.map((p) => p[k])));
      cam.c = lo.map((v, k) => (v + hi[k]) / 2);
      const span = Math.max(3, ...hi.map((v, k) => v - lo[k]));
      cam.s = Math.min(W, H) / (span * 1.6);
      needFit = false;
      return;
    }
    const [a, b] = ax();
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
    for (const p of pts) { x0 = Math.min(x0, p[a]); x1 = Math.max(x1, p[a]); y0 = Math.min(y0, p[b]); y1 = Math.max(y1, p[b]); }
    const w = Math.max(x1 - x0, 3), hh = Math.max(y1 - y0, 3);
    view.cx = (x0 + x1) / 2; view.cy = (y0 + y1) / 2;
    view.s = Math.min(W / (w * 1.3 + 1), H / (hh * 1.3 + 1));
    needFit = false;
  }
  function colors() {
    return { bg: css('--canvas'), grid: css('--grid'), axis: css('--muted'), ink: css('--ink'), pos: css('--pos'), neg: css('--neg'), fl: css('--fieldline'), eq: css('--equi'), acc: css('--accent'), dip: css('--dipole'), mark: css('--mark'), probe: css('--probe') };
  }

  /* ----------------------------- dibujo ----------------------------- */
  function draw(out, scen) {
    lastOut = out; lastScen = scen;
    if (!g0 || !out) return;
    if (out !== lastOutRef) { lastOutRef = out; outVer++; }
    if (needFit) doFit(out);
    const C = colors();
    if (is3D()) { g = g0; g.setTransform(dpr, 0, 0, dpr, 0, 0); draw3D(out, scen, C); return; }
    const has = out.ctx.sources.some((s) => s.S && s.g);
    const key = [outVer, view.cx, view.cy, view.s, W, H, scen.view.plane, scen.view.cut, on('t-lines'), on('t-equi'), on('t-grid'), on('t-cmap'), el('cmap-q')?.value, fast, C.bg].join('|');
    if (key !== bgKey) {
      bgKey = key;
      g = bg.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      legend = null;
      if (has && on('t-cmap')) drawCmap(out.ctx, C);
      drawGrid(C);
      if (has && on('t-equi')) drawEqui(out.ctx, C);
      if (has && on('t-grid')) drawArrows(out.ctx, C);
      if (has && on('t-lines')) drawLines(out.ctx, C);
    }
    g = g0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(bg, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    anchors = [];
    drawExtras(out, C);
    out.ctx.sources.forEach((s, i) => drawSource(s, i, C));
    drawMarks(out, scen, C);
    drawProbes(C);
    if (legend) drawLegend(C);
    drawHover(out.ctx, C);
    if (place) banner(place.hint + (place.pts.length ? ` (${place.pts.length}/${place.n})` : ''), C);
  }
  function banner(text, C) {
    g.font = '600 12.5px "IBM Plex Sans", system-ui, sans-serif';
    const tw = g.measureText(text).width;
    g.fillStyle = C.mark; g.globalAlpha = 0.92; g.fillRect(W / 2 - tw / 2 - 12, 8, tw + 24, 26); g.globalAlpha = 1;
    g.fillStyle = C.bg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, 21);
  }

  function niceStep(px) {
    const target = 46 / px;
    const p = Math.pow(10, Math.floor(Math.log10(target)));
    for (const m of [1, 2, 5, 10]) if (m * p >= target) return m * p;
    return 10 * p;
  }
  function drawGrid(C) {
    const [a, b] = ax();
    const st = niceStep(view.s);
    const p0 = toW(0, H), p1 = toW(W, 0);
    g.lineWidth = 1;
    g.strokeStyle = C.grid;
    g.beginPath();
    for (let x = Math.ceil(p0[a] / st) * st; x <= p1[a]; x += st) { const X = W / 2 + (x - view.cx) * view.s; g.moveTo(X, 0); g.lineTo(X, H); }
    for (let y = Math.ceil(p0[b] / st) * st; y <= p1[b]; y += st) { const Y = H / 2 - (y - view.cy) * view.s; g.moveTo(0, Y); g.lineTo(W, Y); }
    g.stroke();
    const [ox, oy] = toS([0, 0, 0]);
    g.strokeStyle = C.axis; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, oy); g.lineTo(W, oy); g.moveTo(ox, 0); g.lineTo(ox, H); g.stroke();
    g.fillStyle = C.axis; g.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    const u = lastOut.ctx.unit || 'a';
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let x = Math.ceil(p0[a] / st) * st; x <= p1[a]; x += st) { if (Math.abs(x) < st / 2) continue; const X = W / 2 + (x - view.cx) * view.s; g.fillText(fmtTick(x) + u, X, Math.min(Math.max(oy + 4, 4), H - 16)); }
    g.textAlign = 'left'; g.textBaseline = 'middle';
    for (let y = Math.ceil(p0[b] / st) * st; y <= p1[b]; y += st) { if (Math.abs(y) < st / 2) continue; const Y = H / 2 - (y - view.cy) * view.s; g.fillText(fmtTick(y) + u, Math.min(Math.max(ox + 5, 4), W - 40), Y); }
    g.font = 'italic 600 13px "STIX Two Text", Georgia, serif';
    g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(NAMES[a], W - 8, Math.min(Math.max(oy - 4, 16), H - 4));
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(NAMES[b], Math.min(Math.max(ox + 6, 4), W - 20), 6);
  }
  const fmtTick = (x) => String(+x.toFixed(2)).replace('-', '−');

  function E2(ctx, x, y) {
    const E = Physics.fieldNum(ctx, toW(x, y));
    if (!E) return null;
    const [a, b] = ax();
    return [E[a], -E[b]];
  }

  function drawLines(ctx, C) {
    const cell = fast ? 22 : 14, gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
    const occ = new Int32Array(gw * gh).fill(-1);
    const stops = [];
    const [, , c] = ax(), cut = cutVal();
    for (const s of ctx.sources) {
      if (!s.g || !s.S) continue;
      if ((s.src.type === 'point' || s.src.type === 'dipole') && Math.abs(s.g.pos[c] - cut) < 1e-6) stops.push({ p: toS(s.g.pos), q: s.Snum });
      if (s.src.type === 'line' && s.g.mode === 'lambda' && AXI[s.g.dir] === c) stops.push({ p: toS(s.g.pos), q: s.Snum });
    }
    const seeds = [];
    for (const st of stops) {
      const n = fast ? 8 : 14;
      for (let k = 0; k < n; k++) { const t = (2 * Math.PI * k) / n + 0.2; seeds.push([st.p[0] + 9 * Math.cos(t), st.p[1] + 9 * Math.sin(t)]); }
    }
    const sp = fast ? 70 : 46;
    for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) seeds.push([x, y]);
    const h = fast ? 4.5 : 2.5, maxN = fast ? 260 : 700;
    let id = 0;
    g.strokeStyle = C.fl; g.fillStyle = C.fl; g.lineWidth = 1.1;
    for (const sd of seeds) {
      const ci = Math.floor(sd[0] / cell) + Math.floor(sd[1] / cell) * gw;
      if (occ[ci] >= 0) continue;
      const lid = id++;
      const trace = (dir) => {
        const pts = [];
        let p = sd.slice();
        for (let n = 0; n < maxN; n++) {
          const e1 = E2(ctx, p[0], p[1]); if (!e1) break;
          const n1 = Math.hypot(e1[0], e1[1]); if (n1 < 1e-14) break;
          const mid = [p[0] + (dir * h * e1[0]) / n1 / 2, p[1] + (dir * h * e1[1]) / n1 / 2];
          const e2 = E2(ctx, mid[0], mid[1]); if (!e2) break;
          const n2 = Math.hypot(e2[0], e2[1]); if (n2 < 1e-14) break;
          p = [p[0] + (dir * h * e2[0]) / n2, p[1] + (dir * h * e2[1]) / n2];
          if (p[0] < 0 || p[1] < 0 || p[0] > W || p[1] > H) break;
          if (stops.some((st) => Math.hypot(st.p[0] - p[0], st.p[1] - p[1]) < 6)) { pts.push(p); break; }
          const k = Math.floor(p[0] / cell) + Math.floor(p[1] / cell) * gw;
          if (occ[k] >= 0 && occ[k] !== lid && n > 3) break;
          pts.push(p);
        }
        return pts;
      };
      const fw = trace(1), bw = trace(-1);
      const all = [...bw.reverse(), sd, ...fw];
      if (all.length < 8) continue;
      for (const p of all) { const k = Math.floor(p[0] / cell) + Math.floor(p[1] / cell) * gw; if (k >= 0 && k < occ.length) occ[k] = lid; }
      g.beginPath(); g.moveTo(all[0][0], all[0][1]);
      for (const p of all) g.lineTo(p[0], p[1]);
      g.stroke();
      const m = Math.floor(all.length / 2), p0 = all[m - 1], p1 = all[m + 1];
      if (p0 && p1) arrowHead(p1, Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), 5);
    }
  }
  function arrowHead(p, ang, s) {
    g.beginPath();
    g.moveTo(p[0] + s * Math.cos(ang), p[1] + s * Math.sin(ang));
    g.lineTo(p[0] + s * Math.cos(ang + 2.5), p[1] + s * Math.sin(ang + 2.5));
    g.lineTo(p[0] + s * Math.cos(ang - 2.5), p[1] + s * Math.sin(ang - 2.5));
    g.closePath(); g.fill();
  }
  function arrow(p, v, len, color, w = 2) {
    const n = Math.hypot(v[0], v[1]); if (n < 1e-14) return;
    const q = [p[0] + (v[0] / n) * len, p[1] + (v[1] / n) * len];
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = w;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
    arrowHead(q, Math.atan2(v[1], v[0]), 6);
  }

  function drawArrows(ctx, C) {
    const sp = 40;
    const vals = [];
    for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2; x < W; x += sp) { const e = E2(ctx, x, y); if (e) vals.push([x, y, e, Math.hypot(e[0], e[1])]); }
    const mags = vals.map((v) => v[3]).filter((m) => m > 0).sort((p, q) => p - q);
    const ref = mags[Math.floor(mags.length * 0.9)] || 1;
    g.globalAlpha = 0.8;
    for (const [x, y, e, m] of vals) arrow([x - e[0] / m * 8, y - e[1] / m * 8], e, 6 + 12 * Math.min(1, m / ref), C.acc, 1.2);
    g.globalAlpha = 1;
  }

  function sampleV(ctx, st) {
    const nx = Math.ceil(W / st) + 1, ny = Math.ceil(H / st) + 1;
    const V = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[i + j * nx] = Physics.potNum(ctx, toW(i * st, j * st));
    return { V, nx, ny };
  }
  function drawEqui(ctx, C) {
    const st = fast ? 12 : 7;
    const { V, nx, ny } = sampleV(ctx, st);
    const fin = [...V].filter(isFinite).sort((p, q) => p - q);
    if (fin.length < 10) return;
    const lo = fin[Math.floor(fin.length * 0.04)], hi = fin[Math.floor(fin.length * 0.96)];
    if (!(hi > lo)) return;
    const NL = 13, lv = [];
    for (let k = 1; k < NL; k++) lv.push(lo + ((hi - lo) * k) / NL);
    g.strokeStyle = C.eq; g.lineWidth = 1; g.setLineDash([4, 3]);
    g.beginPath();
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const v0 = V[i + j * nx], v1 = V[i + 1 + j * nx], v2 = V[i + 1 + (j + 1) * nx], v3 = V[i + (j + 1) * nx];
      if (!(isFinite(v0) && isFinite(v1) && isFinite(v2) && isFinite(v3))) continue;
      const mn = Math.min(v0, v1, v2, v3), mx = Math.max(v0, v1, v2, v3);
      for (const L of lv) {
        if (L < mn || L > mx) continue;
        const x = i * st, y = j * st, P = [];
        const ed = (va, vb, xa, ya, xb, yb) => { if ((va - L) * (vb - L) < 0) { const t = (L - va) / (vb - va); P.push([xa + t * (xb - xa), ya + t * (yb - ya)]); } };
        ed(v0, v1, x, y, x + st, y); ed(v1, v2, x + st, y, x + st, y + st); ed(v2, v3, x + st, y + st, x, y + st); ed(v3, v0, x, y + st, x, y);
        for (let k = 0; k + 1 < P.length; k += 2) { g.moveTo(P[k][0], P[k][1]); g.lineTo(P[k + 1][0], P[k + 1][1]); }
      }
    }
    g.stroke(); g.setLineDash([]);
  }

  /* --------- mapa de color de V o |E| --------- */
  const rgb = (c) => {
    const m = c.match(/^#([0-9a-f]{6})$/i);
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    return [128, 128, 128];
  };
  function drawCmap(ctx, C) {
    const q = el('cmap-q')?.value || 'V';
    const st = fast ? 8 : 4, nx = Math.ceil(W / st), ny = Math.ceil(H / st);
    const vals = new Float64Array(nx * ny);
    const absV = ctx.sources.every((s) => !s.S || s.def.absV);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const X = toW((i + 0.5) * st, (j + 0.5) * st);
      if (q === 'V') vals[i + j * nx] = Physics.potNum(ctx, X);
      else { const E = Physics.fieldNum(ctx, X); vals[i + j * nx] = E ? V3.norm(E) : NaN; }
    }
    const fin = [...vals].filter(isFinite).sort((p, r) => p - r);
    if (fin.length < 4) return;
    const pos = rgb(C.pos), neg = rgb(C.neg), base = rgb(C.bg), acc = rgb(C.acc);
    let map, lo, hi, mid = 0;
    if (q === 'V') {
      mid = absV ? 0 : fin[Math.floor(fin.length / 2)];
      const lim = Math.max(Math.abs(fin[Math.floor(fin.length * 0.03)] - mid), Math.abs(fin[Math.floor(fin.length * 0.97)] - mid)) || 1;
      lo = mid - lim; hi = mid + lim;
      map = (v) => { const t = Math.max(-1, Math.min(1, (v - mid) / lim)); const c = t >= 0 ? pos : neg, a = Math.abs(t) * 0.75; return base.map((b, k) => b + (c[k] - b) * a); };
    } else {
      lo = Math.max(fin[Math.floor(fin.length * 0.03)], 1e-30); hi = fin[Math.floor(fin.length * 0.97)];
      const l0 = Math.log(lo), l1 = Math.log(hi) - l0 || 1;
      map = (v) => { const t = Math.max(0, Math.min(1, (Math.log(Math.max(v, 1e-300)) - l0) / l1)); return base.map((b, k) => b + (acc[k] - b) * t * 0.8); };
    }
    const img = g.createImageData(nx, ny);
    for (let k = 0; k < nx * ny; k++) {
      const v = vals[k];
      const c = isFinite(v) ? map(v) : base;
      img.data[4 * k] = c[0]; img.data[4 * k + 1] = c[1]; img.data[4 * k + 2] = c[2]; img.data[4 * k + 3] = 255;
    }
    const tmp = document.createElement('canvas');
    tmp.width = nx; tmp.height = ny;
    tmp.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(tmp, 0, 0, nx * st, ny * st);
    const si = lastOut.ctx.mode === 'si';
    const f = si ? 1 / Engine.EPS0 : Math.PI;
    legend = { q, lo: lo * f, hi: hi * f, mid: mid * f, absV, si, colors: q === 'V' ? [C.neg, C.bg, C.pos] : [C.bg, C.acc] };
  }
  function drawLegend(C) {
    const w = 150, x = W - w - 14, y = H - 46;
    g.fillStyle = C.bg; g.globalAlpha = 0.88; g.fillRect(x - 8, y - 18, w + 16, 46); g.globalAlpha = 1;
    const gr = g.createLinearGradient(x, 0, x + w, 0);
    legend.colors.forEach((c, i) => gr.addColorStop(i / (legend.colors.length - 1), c));
    g.fillStyle = gr; g.fillRect(x, y, w, 9);
    g.strokeStyle = C.axis; g.lineWidth = 0.5; g.strokeRect(x, y, w, 9);
    g.font = '10.5px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle = C.ink; g.textBaseline = 'top';
    const u = legend.si ? (legend.q === 'V' ? ' V' : ' N/C') : '';
    const fm = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(1) : String(+v.toPrecision(2))).replace('-', '−');
    g.textAlign = 'left'; g.fillText(fm(legend.lo) + u, x, y + 12);
    g.textAlign = 'right'; g.fillText(fm(legend.hi) + u, x + w, y + 12);
    g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText(legend.q === 'V' ? (legend.absV ? 'V' : 'V − V_medio') + (legend.si ? '' : ' ·πε₀a/símb.') : '|E|' + (legend.si ? '' : ' ·πε₀a²/símb.') + ' (log)', x, y - 3);
  }

  function colorOf(s, C) { return !s.S ? C.axis : s.Snum >= 0 ? C.pos : C.neg; }
  function label(text, x, y, color) {
    g.font = 'italic 14px "STIX Two Text", Georgia, serif';
    g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText(text, x, y);
  }
  const prettyName = (n) => String(n).replace(/lambda/i, 'λ').replace(/sigma/i, 'σ').replace(/rho/i, 'ρ').replace(/(\D)(\d+)$/, (_, a, d) => a + d.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[c]).join(''));

  function drawSource(s, i, C) {
    const G = s.g; if (!G) return;
    const [a, b, c] = ax(), cut = cutVal();
    const col = colorOf(s, C);
    const nm = prettyName(s.name) + (s.unknown && !s.unknownSolved ? ' ?' : '');
    const t = s.src.type;
    const addAnchors = () => { for (const an of s.def.anchors(s.src, G)) anchors.push({ p: toS(an.at), path: ['sources', i, ...an.path], at: an.at }); };
    g.lineWidth = 2;
    if (t === 'point' || t === 'dipole') {
      const p = toS(G.pos), inPlane = Math.abs(G.pos[c] - cut) < 1e-6;
      g.globalAlpha = inPlane ? 1 : 0.45;
      if (t === 'point') {
        g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 8, 0, 7); g.fill();
        g.strokeStyle = C.bg; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0] - 4, p[1]); g.lineTo(p[0] + 4, p[1]);
        if (s.Snum >= 0) { g.moveTo(p[0], p[1] - 4); g.lineTo(p[0], p[1] + 4); }
        g.stroke();
      } else {
        const d = [G.p[a], -G.p[b]];
        g.fillStyle = C.dip; g.beginPath(); g.arc(p[0], p[1], 4, 0, 7); g.fill();
        if (Math.hypot(...d) > 1e-12) { const n = Math.hypot(...d); arrow([p[0] - (d[0] / n) * 14, p[1] - (d[1] / n) * 14], d, 30, C.dip, 2.5); }
      }
      label(nm + (inPlane ? '' : ` (${'xyz'[c]}=${fmtTick(G.pos[c])})`), p[0] + 10, p[1] - 6, C.ink);
      g.globalAlpha = 1;
      addAnchors();
    } else if (t === 'line') {
      const di = AXI[G.dir];
      if (di === c) {
        const p = toS(G.pos);
        if (G.mode === 'rho') { g.fillStyle = col; g.globalAlpha = 0.18; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 7); g.fill(); g.globalAlpha = 1; g.strokeStyle = col; g.beginPath(); g.arc(p[0], p[1], G.R * view.s, 0, 7); g.stroke(); }
        g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.stroke();
        g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], 2.5, 0, 7); g.fill();
        label(nm, p[0] + 10, p[1] - 6, C.ink);
      } else {
        const off = Math.abs(G.pos[c] - cut) > 1e-6;
        const p = toS(G.pos);
        const vert = di !== a;
        g.strokeStyle = col; g.globalAlpha = off ? 0.4 : 1;
        if (G.mode === 'rho') { g.fillStyle = col; g.globalAlpha *= 0.18; const r = G.R * view.s; if (vert) g.fillRect(p[0] - r, 0, 2 * r, H); else g.fillRect(0, p[1] - r, W, 2 * r); g.globalAlpha = off ? 0.4 : 1; }
        g.lineWidth = 3; g.setLineDash(off ? [6, 4] : []);
        g.beginPath(); if (vert) { g.moveTo(p[0], 0); g.lineTo(p[0], H); } else { g.moveTo(0, p[1]); g.lineTo(W, p[1]); } g.stroke(); g.setLineDash([]);
        label(nm, vert ? p[0] + 6 : 8, vert ? 22 : p[1] - 6, C.ink);
        g.globalAlpha = 1;
      }
      addAnchors();
    } else if (t === 'plane' || t === 'slab') {
      if (G.i === c) { label(`${nm}: plano ${'xyz'[c]} = ${fmtTick(G.c)} (paralelo a la vista)`, 8, H - 8, C.axis); return; }
      const vert = G.i === a;
      const p = toS([G.c, G.c, G.c]);
      g.strokeStyle = col; g.fillStyle = col;
      if (t === 'slab') {
        const r = (G.w / 2) * view.s;
        g.globalAlpha = 0.2; if (vert) g.fillRect(p[0] - r, 0, 2 * r, H); else g.fillRect(0, p[1] - r, W, 2 * r);
        g.globalAlpha = 1; g.lineWidth = 1.5;
        g.beginPath(); if (vert) { g.moveTo(p[0] - r, 0); g.lineTo(p[0] - r, H); g.moveTo(p[0] + r, 0); g.lineTo(p[0] + r, H); } else { g.moveTo(0, p[1] - r); g.lineTo(W, p[1] - r); g.moveTo(0, p[1] + r); g.lineTo(W, p[1] + r); } g.stroke();
        label(nm, vert ? p[0] - r + 6 : 8, vert ? 22 : p[1] - r - 4, C.ink);
      } else {
        g.lineWidth = 5; g.globalAlpha = 0.85;
        g.beginPath(); if (vert) { g.moveTo(p[0], 0); g.lineTo(p[0], H); } else { g.moveTo(0, p[1]); g.lineTo(W, p[1]); } g.stroke();
        g.globalAlpha = 1;
        label(nm, vert ? p[0] + 7 : 8, vert ? 22 : p[1] - 6, C.ink);
      }
    } else if (t === 'sphere' || t === 'shell' || t === 'conductor') {
      const d = G.pos[c] - cut;
      const p = toS(G.pos);
      const rr = (R) => (R > Math.abs(d) ? Math.sqrt(R * R - d * d) * view.s : 0);
      const r2 = rr(t === 'sphere' ? G.R2 : G.R), r1 = t === 'sphere' ? rr(G.R1) : 0;
      if (r2 > 0) {
        g.fillStyle = t === 'conductor' ? C.axis : col; g.globalAlpha = t === 'shell' ? 0.06 : 0.2;
        g.beginPath(); g.arc(p[0], p[1], r2, 0, 7); if (r1 > 0) g.arc(p[0], p[1], r1, 0, 7, true); g.fill('evenodd');
        g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = t === 'shell' || t === 'conductor' ? 3 : 1.5;
        g.beginPath(); g.arc(p[0], p[1], r2, 0, 7); g.stroke();
        if (r1 > 0) { g.lineWidth = 1.5; g.beginPath(); g.arc(p[0], p[1], r1, 0, 7); g.stroke(); }
      }
      label(nm, p[0] + r2 * 0.72 + 4, p[1] - r2 * 0.72, C.ink);
      addAnchors();
    } else if (t === 'ring' || t === 'disk') {
      const p = toS(G.pos), ni = AXI[G.axis], r = G.R * view.s;
      g.strokeStyle = col; g.fillStyle = col;
      if (ni === c) {
        if (t === 'disk') { g.globalAlpha = 0.2; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.globalAlpha = 1; }
        g.lineWidth = t === 'ring' ? 3 : 1.5; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.stroke();
      } else {
        const horiz = ni === b; // el eje del anillo es vertical en pantalla → el anillo se ve como segmento horizontal
        const q0 = horiz ? [p[0] - r, p[1]] : [p[0], p[1] - r], q1 = horiz ? [p[0] + r, p[1]] : [p[0], p[1] + r];
        if (t === 'disk') { g.lineWidth = 5; g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.stroke(); }
        else { g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(...q0); g.lineTo(...q1); g.stroke(); g.setLineDash([]); for (const q of [q0, q1]) { g.beginPath(); g.arc(q[0], q[1], 5, 0, 7); g.fill(); } }
      }
      label(nm, p[0] + r * 0.72 + 4, p[1] - r * 0.72 - 2, C.ink);
      addAnchors();
    } else if (t === 'rod') {
      const p = toS(G.A), q = toS(G.B);
      g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.lineCap = 'butt';
      label(nm, (p[0] + q[0]) / 2 + 8, (p[1] + q[1]) / 2, C.ink);
      addAnchors();
    }
  }

  // superficies de Gauss y rectas de perfil
  function drawExtras(out, C) {
    const [a, b, c] = ax(), cut = cutVal();
    g.strokeStyle = C.mark; g.lineWidth = 1.5; g.setLineDash([6, 4]);
    for (const r of out.results) {
      if (r.seg) { const p = toS(r.seg[0]), q = toS(r.seg[1]); g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); }
      if (r.surf) {
        const S = r.surf, p = toS(S.C), R = S.R * view.s;
        if (S.shape === 'sphere') { const d = Math.abs(S.C[c] - cut); if (d < S.R) { g.beginPath(); g.arc(p[0], p[1], Math.sqrt(S.R ** 2 - d * d) * view.s, 0, 7); g.stroke(); } }
        else {
          const ni = AXI[S.axis], hh = (S.h / 2) * view.s;
          if (ni === c) { g.beginPath(); g.arc(p[0], p[1], R, 0, 7); g.stroke(); }
          else if (ni === a) g.strokeRect(p[0] - hh, p[1] - R, 2 * hh, 2 * R);
          else g.strokeRect(p[0] - R, p[1] - hh, 2 * R, 2 * hh);
        }
      }
    }
    g.setLineDash([]);
  }

  function drawMarks(out, scen, C) {
    const add = (path, at, lab, vec, dip) => {
      const p = toS(at);
      if (vec) { const [a, b] = ax(); arrow(p, [vec[a], -vec[b]], 42, C.acc, 2.4); }
      if (dip) { const [a, b] = ax(); const d = [dip[a], -dip[b]]; const n = Math.hypot(...d); if (n > 1e-12) arrow([p[0] - (d[0] / n) * 13, p[1] - (d[1] / n) * 13], d, 26, C.dip, 3); }
      g.fillStyle = C.bg; g.strokeStyle = C.mark; g.lineWidth = 2;
      g.beginPath(); g.moveTo(p[0], p[1] - 6); g.lineTo(p[0] + 6, p[1]); g.lineTo(p[0], p[1] + 6); g.lineTo(p[0] - 6, p[1]); g.closePath(); g.fill(); g.stroke();
      g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.mark; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(lab, p[0] + 8, p[1] + 4);
      if (path) anchors.push({ p, path, at });
    };
    const many = scen.analyses.length > 1;
    scen.analyses.forEach((an, i) => {
      for (const m of out.results[i]?.marks || []) add(m.key ? ['analyses', i, m.key] : null, m.at, `${m.label || m.key}${many ? '·' + (i + 1) : ''}`, m.vec, m.dip);
    });
    const P = out.ctx.P;
    (scen.unknown?.conds || []).forEach((cd, j) => {
      const keys = { Ecomp: ['P'], Epar: ['P'], Ezero: ['P'], dV: ['A', 'B'], V: ['P'] }[cd.type] || [];
      for (const k of keys) { try { add(['unknown', 'conds', j, k], cd[k].map(P), k + '*', null); } catch (e) { /* entrada incompleta */ } }
    });
  }

  function drawHover(ctx, C) {
    if (!hover || drag || place) return;
    const w = toW(hover[0], hover[1]);
    const E = Physics.fieldNum(ctx, w);
    const [a, b] = ax(), u = ctx.unit || 'a', si = ctx.mode === 'si';
    const Et = E ? (si ? `${(V3.norm(E) / Engine.EPS0).toPrecision(3)} N/C` : `${(V3.norm(E) * Math.PI).toPrecision(3)}/(πε₀)`) : '';
    const txt = `${'xyz'[a]} = ${w[a].toFixed(2)}${u}, ${'xyz'[b]} = ${w[b].toFixed(2)}${u}` + (E ? `   |E| ≈ ${Et}` : '');
    g.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    const tw = g.measureText(txt).width;
    g.fillStyle = C.bg; g.globalAlpha = 0.9; g.fillRect(6, H - 26, tw + 12, 20); g.globalAlpha = 1;
    g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, 12, H - 16);
  }

  /* ------------------- cargas de prueba animadas ------------------- */
  function addProbe(X, sign) {
    const E = Physics.fieldNum(lastOut.ctx, X);
    if (!E) return;
    const k = 220 / (view.s * Math.max(V3.norm(E), 1e-12)); // aceleración inicial ≈ 220 px/s²
    probes.push({ x: X.slice(), v: [0, 0, 0], k: k * sign, sign, trail: [X.slice()], alive: true, t: 0 });
    if (!anim) { let last = performance.now(); const step = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; stepProbes(dt); redraw(); anim = probes.some((p) => p.alive) ? requestAnimationFrame(step) : 0; }; anim = requestAnimationFrame(step); }
  }
  function stepProbes(dt) {
    const ctx = lastOut?.ctx; if (!ctx) return;
    const sub = 10, h = dt / sub, lim = 3 * Math.max(W, H) / view.s;
    for (const p of probes) {
      if (!p.alive) continue;
      for (let i = 0; i < sub; i++) {
        const E = Physics.fieldNum(ctx, p.x);
        if (!E || !E.every(isFinite)) { p.alive = false; break; }
        const acc = V3.sc(E, p.k);
        p.v = V3.add(p.v, V3.sc(acc, h));
        p.x = V3.add(p.x, V3.sc(p.v, h));
        if (V3.norm(V3.sub(p.x, [view.cx, view.cy, 0])) > lim && V3.norm(V3.sub(p.x, toW(W / 2, H / 2))) > lim) { p.alive = false; break; }
        if (ctx.sources.some((s) => s.g?.pos && s.src.type === 'point' && V3.norm(V3.sub(s.g.pos, p.x)) < 6 / view.s)) { p.alive = false; break; }
      }
      p.t += dt;
      if (p.t > 25) p.alive = false;
      const last = p.trail[p.trail.length - 1];
      if (V3.norm(V3.sub(p.x, last)) * view.s > 2) p.trail.push(p.x.slice());
      if (p.trail.length > 1500) p.trail.shift();
    }
  }
  function drawProbes(C) {
    for (const p of probes) {
      const col = p.sign > 0 ? C.pos : C.neg;
      g.strokeStyle = col; g.globalAlpha = 0.7; g.lineWidth = 1.6;
      g.beginPath(); p.trail.forEach((q, i) => { const s = toS(q); if (i) g.lineTo(...s); else g.moveTo(...s); }); g.stroke();
      g.globalAlpha = 1;
      const s = toS(p.x);
      g.fillStyle = C.probe || col; g.beginPath(); g.arc(s[0], s[1], 5, 0, 7); g.fill();
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.arc(s[0], s[1], 5, 0, 7); g.stroke();
    }
  }
  function clearProbes() { probes = []; redraw(); }

  /* ----------------------------- vista 3D ----------------------------- */
  function proj(p) {
    const q = V3.sub(p, cam.c);
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const x1 = cy * q[0] - sy * q[1], y1 = sy * q[0] + cy * q[1];
    const yv = q[2] * cp - y1 * sp, depth = y1 * cp + q[2] * sp;
    const f = 1 / (1 - depth * cam.s / (Math.min(W, H) * 2.2));
    return [W / 2 + x1 * cam.s * f, H / 2 - yv * cam.s * f, depth, f];
  }
  function line3(a, b) { const p = proj(a), q = proj(b); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
  function arrow3(p0, v, len, color, w = 2) {
    const a = proj(p0), b = proj(V3.add(p0, V3.sc(V3.unit(v), len / cam.s)));
    arrow([a[0], a[1]], [b[0] - a[0], b[1] - a[1]], Math.hypot(b[0] - a[0], b[1] - a[1]), color, w);
  }
  function draw3D(out, scen, C) {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const ctx = out.ctx, L = Math.min(W, H) / cam.s * 0.5, c0 = cam.c;
    // rejilla en z = 0 y ejes
    g.strokeStyle = C.grid; g.lineWidth = 1;
    const st = niceStep(cam.s);
    const gx0 = Math.floor((c0[0] - L) / st) * st, gy0 = Math.floor((c0[1] - L) / st) * st;
    for (let x = gx0; x <= c0[0] + L; x += st) line3([x, c0[1] - L, 0], [x, c0[1] + L, 0]);
    for (let y = gy0; y <= c0[1] + L; y += st) line3([c0[0] - L, y, 0], [c0[0] + L, y, 0]);
    g.strokeStyle = C.axis; g.lineWidth = 1.4;
    g.font = 'italic 600 13px "STIX Two Text", Georgia, serif'; g.fillStyle = C.axis; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const e = [0, 0, 0]; e[k] = L * 1.05;
      line3(V3.sc(e, -1), e);
      const p = proj(V3.sc(e, 1.07)); g.fillText(NAMES[k], p[0], p[1]);
    }
    // campo: flechas en una malla 3D
    if (on('t-grid') || on('t-lines')) {
      const n = fast ? 4 : 6, vals = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        const X = [c0[0] - L * 0.8 + (1.6 * L * i) / (n - 1), c0[1] - L * 0.8 + (1.6 * L * j) / (n - 1), c0[2] - L * 0.8 + (1.6 * L * k) / (n - 1)];
        const E = Physics.fieldNum(ctx, X);
        if (E && V3.norm(E) > 0) vals.push([X, E, V3.norm(E)]);
      }
      const ms = vals.map((v) => v[2]).sort((a, b) => a - b), ref = ms[Math.floor(ms.length * 0.9)] || 1;
      g.globalAlpha = 0.55;
      for (const [X, E, m] of vals) arrow3(X, E, 8 + 14 * Math.min(1, m / ref), C.acc, 1.2);
      g.globalAlpha = 1;
    }
    if (on('t-lines')) drawLines3D(ctx, C, L);
    // fuentes, de atrás hacia delante
    const items = ctx.sources.filter((s) => s.g).map((s) => ({ s, d: proj(s.g.pos || s.g.A || c0)[2] }));
    items.sort((a, b) => a.d - b.d);
    for (const { s } of items) drawSource3D(s, C, L);
    for (const r of out.results) for (const m of r.marks || []) {
      const p = proj(m.at);
      if (m.vec) arrow3(m.at, m.vec, 42, C.acc, 2.4);
      if (m.dip && V3.norm(m.dip) > 0) arrow3(V3.sub(m.at, V3.sc(V3.unit(m.dip), 13 / cam.s)), m.dip, 26, C.dip, 3);
      g.fillStyle = C.bg; g.strokeStyle = C.mark; g.lineWidth = 2;
      g.beginPath(); g.arc(p[0], p[1], 5, 0, 7); g.fill(); g.stroke();
      g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.mark; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(m.label || m.key || '', p[0] + 7, p[1] + 3);
    }
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = C.axis; g.textAlign = 'left'; g.textBaseline = 'bottom';
    g.fillText('Arrastra para girar · Ctrl + rueda o +/− para acercar', 10, H - 8);
  }
  function drawLines3D(ctx, C, L) {
    const lim = L * 1.2;
    g.strokeStyle = C.fl; g.lineWidth = 1; g.globalAlpha = 0.85;
    const dirs = [];
    const N = fast ? 8 : 14;
    for (let i = 0; i < N; i++) { const z = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - z * z), t = i * 2.39996; dirs.push([r * Math.cos(t), r * Math.sin(t), z]); }
    const h = 1.5 / cam.s;
    for (const s of ctx.sources) {
      if (!s.g || !s.S || s.src.type !== 'point') continue;
      const sgn = s.Snum >= 0 ? 1 : -1;
      for (const d of dirs) {
        let p = V3.add(s.g.pos, V3.sc(d, 8 / cam.s));
        const pts = [p];
        for (let n = 0; n < (fast ? 250 : 600); n++) {
          const E = Physics.fieldNum(ctx, p); if (!E) break;
          const m = V3.norm(E); if (m < 1e-14) break;
          p = V3.add(p, V3.sc(E, (sgn * h * 2) / m));
          if (Math.abs(p[0] - cam.c[0]) > lim || Math.abs(p[1] - cam.c[1]) > lim || Math.abs(p[2] - cam.c[2]) > lim) break;
          pts.push(p);
          if (ctx.sources.some((o) => o !== s && o.src.type === 'point' && V3.norm(V3.sub(o.g.pos, p)) < 6 / cam.s)) break;
        }
        g.beginPath(); pts.forEach((q, i) => { const pp = proj(q); if (i) g.lineTo(pp[0], pp[1]); else g.moveTo(pp[0], pp[1]); }); g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
  function circle3(c, n, R) {
    const e1 = Math.abs(n[0]) < 0.9 ? V3.unit(V3.cross(n, [1, 0, 0])) : V3.unit(V3.cross(n, [0, 1, 0])), e2 = V3.cross(n, e1);
    const pts = [];
    for (let i = 0; i <= 48; i++) { const t = (2 * Math.PI * i) / 48; pts.push(proj(V3.add(c, V3.add(V3.sc(e1, R * Math.cos(t)), V3.sc(e2, R * Math.sin(t)))))); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  }
  function drawSource3D(s, C, L) {
    const G = s.g, t = s.src.type, col = colorOf(s, C), nm = prettyName(s.name);
    g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
    let lp = null;
    if (t === 'point') { const p = proj(G.pos); g.beginPath(); g.arc(p[0], p[1], 7 * p[3], 0, 7); g.fill(); lp = p; }
    else if (t === 'dipole') { arrow3(V3.sub(G.pos, V3.sc(V3.unit(G.p), 14 / cam.s)), G.p, 30, C.dip, 2.5); lp = proj(G.pos); }
    else if (t === 'line') {
      g.lineWidth = G.mode === 'rho' ? 6 : 3;
      line3(V3.sub(G.pos, V3.sc(G.u, L * 1.2)), V3.add(G.pos, V3.sc(G.u, L * 1.2))); lp = proj(V3.add(G.pos, V3.sc(G.u, L)));
    } else if (t === 'plane' || t === 'slab') {
      const offs = t === 'slab' ? [-G.w / 2, G.w / 2] : [0];
      for (const o of offs) {
        const k1 = (G.i + 1) % 3, k2 = (G.i + 2) % 3, corner = (u, v) => { const p = cam.c.slice(); p[G.i] = G.c + o; p[k1] = cam.c[k1] + u * L; p[k2] = cam.c[k2] + v * L; return proj(p); };
        const q = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
        g.globalAlpha = 0.14; g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
        g.globalAlpha = 0.6; g.lineWidth = 1; g.stroke(); g.globalAlpha = 1;
        lp = q[2];
      }
    } else if (t === 'sphere' || t === 'shell' || t === 'conductor') {
      const p = proj(G.pos), R = (t === 'sphere' ? G.R2 : G.R) * cam.s * p[3];
      g.globalAlpha = t === 'shell' ? 0.08 : 0.2; g.fillStyle = t === 'conductor' ? C.axis : col; g.beginPath(); g.arc(p[0], p[1], R, 0, 7); g.fill();
      g.globalAlpha = 1; g.beginPath(); g.arc(p[0], p[1], R, 0, 7); g.stroke();
      lp = [p[0] + R * 0.7, p[1] - R * 0.7];
    } else if (t === 'ring' || t === 'disk') {
      circle3(G.pos, G.n, G.R);
      if (t === 'disk') { g.globalAlpha = 0.2; g.fill(); g.globalAlpha = 1; }
      g.lineWidth = t === 'ring' ? 3 : 1.5; g.stroke();
      lp = proj(V3.add(G.pos, V3.sc(G.n, 0.2)));
    } else if (t === 'rod') { g.lineWidth = 5; line3(G.A, G.B); lp = proj(G.B); }
    if (lp) label(nm, lp[0] + 8, lp[1] - 4, C.ink);
  }

  /* --------------------------- interacción --------------------------- */
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function setPlace(spec) {
    place = spec ? { ...spec, pts: [] } : null;
    cv.classList.toggle('placing', !!place);
    redraw();
  }
  function down(e) {
    const p = pos(e);
    if (place && !is3D()) {
      const w = toW(p[0], p[1]);
      const snap = e.shiftKey ? 0.01 : 0.25, [a, b] = ax();
      for (const k of [a, b]) w[k] = +(Math.round(w[k] / snap) * snap).toFixed(2);
      place.pts.push(w);
      if (place.pts.length >= place.n) { const sp = place; place = null; cv.classList.remove('placing'); sp.done(sp.pts); }
      else redraw();
      return;
    }
    if (is3D()) { drag = { rot: p, y0: cam.yaw, p0: cam.pitch }; cv.setPointerCapture(e.pointerId); return; }
    let best = null, bd = 14;
    for (const an of anchors) { const d = Math.hypot(an.p[0] - p[0], an.p[1] - p[1]); if (d < bd) { bd = d; best = an; } }
    drag = best ? { anchor: best } : { pan: p, c0: [view.cx, view.cy] };
    if (best) { fast = true; }
    cv.setPointerCapture(e.pointerId);
    cv.classList.add('dragging');
  }
  function move(e) {
    const p = pos(e);
    if (!drag) {
      hover = is3D() ? null : p;
      const near = anchors.some((an) => Math.hypot(an.p[0] - p[0], an.p[1] - p[1]) < 14);
      cv.style.cursor = place ? 'copy' : is3D() ? 'grab' : near ? 'grab' : 'crosshair';
      if (!is3D()) redraw();
      return;
    }
    if (drag.rot) {
      cam.yaw = drag.y0 + (p[0] - drag.rot[0]) * 0.01;
      cam.pitch = Math.max(-1.5, Math.min(1.5, drag.p0 + (p[1] - drag.rot[1]) * 0.01));
      fast = true; redraw();
      return;
    }
    if (drag.pan) {
      view.cx = drag.c0[0] - (p[0] - drag.pan[0]) / view.s;
      view.cy = drag.c0[1] + (p[1] - drag.pan[1]) / view.s;
      fast = true; redraw();
      return;
    }
    const w = toW(p[0], p[1]);
    const snap = e.shiftKey ? 0.01 : 0.25;
    const [a, b] = ax();
    for (const k of [a, b]) App.onDrag([...drag.anchor.path, k], String(+(Math.round(w[k] / snap) * snap).toFixed(2)));
  }
  function up() {
    const was = drag; drag = null; cv.classList.remove('dragging');
    if (was && (was.anchor ? App.endDrag?.() : true)) { /* fin del arrastre */ }
    clearTimeout(fastTimer);
    fastTimer = setTimeout(() => { fast = false; redraw(); }, 120);
  }
  function snapshot() { try { return cv.toDataURL('image/png'); } catch (e) { return ''; } }

  return { init, draw, fit, zoom, setPlace, addProbe, clearProbes, snapshot, isPlacing: () => !!place, toWorldCenter: () => toW(W / 2, H / 2) };
})();
