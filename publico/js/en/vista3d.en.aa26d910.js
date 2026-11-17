const Vista3D = (() => {
  const proyecta = (p, yaw, pitch) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = p[0] * cy - p[1] * sy, y1 = p[0] * sy + p[1] * cy, z1 = p[2];
    return [x1, z1 * cp - y1 * sp, y1 * cp + z1 * sp];
  };
  const rampa = (v) => { v = Math.max(0, Math.min(1, v)); return `hsl(${Math.round(230 - 200 * v)} 70% ${Math.round(45 + 10 * v)}%)`; };
  function monta(c, op) {
    if (typeof c === 'string') c = document.querySelector(c);
    let yaw = op.yaw ?? 0.7, pitch = op.pitch ?? 0.45;
    c.setAttribute('role', 'img'); c.tabIndex = 0;
    const barra = document.createElement('div'); barra.className = 'controles';
    barra.innerHTML = '<button type="button" class="btn" data-g="izq" aria-label="Rotate left">◀</button><button type="button" class="btn" data-g="der" aria-label="Rotate right">▶</button><button type="button" class="btn" data-g="arr" aria-label="Raise the camera">▲</button><button type="button" class="btn" data-g="aba" aria-label="Lower the camera">▼</button><button type="button" class="btn" data-g="ini">Reset view</button><span class="nota">Drag or use the keyboard arrows to rotate.</span>';
    c.insertAdjacentElement('afterend', barra);
    const gira = (dy, dp) => { yaw += dy; pitch = Math.max(-1.5, Math.min(1.5, pitch + dp)); dibuja(); };
    barra.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const q = 0.2;
      ({ izq: () => gira(-q, 0), der: () => gira(q, 0), arr: () => gira(0, -q), aba: () => gira(0, q), ini: () => { yaw = op.yaw ?? 0.7; pitch = op.pitch ?? 0.45; dibuja(); } })[b.dataset.g]();
    });
    c.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }[e.key];
      if (k) { e.preventDefault(); gira(...k); }
    });
    let ult = null;
    c.addEventListener('pointerdown', (e) => { ult = [e.clientX, e.clientY]; c.setPointerCapture?.(e.pointerId); });
    c.addEventListener('pointermove', (e) => { if (!ult) return; gira((e.clientX - ult[0]) * 0.01, (e.clientY - ult[1]) * 0.01); ult = [e.clientX, e.clientY]; });
    c.addEventListener('pointerup', () => { ult = null; });
    c.style.touchAction = 'none';
    function dibuja() {
      const { g, w, h } = Herramienta.lienzo(c);
      if (!w || !h) return;
      const cs = getComputedStyle(document.documentElement), col = (k) => cs.getPropertyValue(k).trim() || cs.getPropertyValue('--ink').trim();
      const E = op.escena() || {}, esc = Math.min(w, h) * 0.38, X = (p) => { const q = proyecta(p, yaw, pitch); return [w / 2 + q[0] * esc, h / 2 - q[1] * esc, q[2]]; };
      c.setAttribute('aria-label', op.descripcion ? op.descripcion() : 'Three-dimensional view');
      g.lineJoin = 'round'; g.lineCap = 'round';
      if (E.ejes) for (const [d, t] of [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']]) {
        const a = X([0, 0, 0]), b = X(d.map((v) => v * 1.05)); g.strokeStyle = col('--line'); g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        g.fillStyle = col('--muted'); g.font = '12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, b[0] + (b[0] - a[0]) * 0.08, b[1] + (b[1] - a[1]) * 0.08);
      }
      const caras = (E.caras || []).map((f) => { const q = f.pts.map(X); return { q, z: q.reduce((s, v) => s + v[2], 0) / q.length, v: f.v }; }).sort((a, b) => b.z - a.z);
      g.lineWidth = 0.6; g.strokeStyle = col('--line');
      for (const f of caras) { g.beginPath(); f.q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.closePath(); g.globalAlpha = 0.8; g.fillStyle = rampa(f.v); g.fill(); g.globalAlpha = 1; g.stroke(); }
      for (const l of E.lineas || []) {
        const q = l.pts.map(X); if (q.length < 2) continue;
        g.strokeStyle = col(l.color || '--serie-1'); g.lineWidth = l.ancho || 1.8; g.beginPath(); q.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1]))); g.stroke();
        if (l.flecha) { const a = q[Math.floor(q.length / 2) - 1] || q[0], b = q[Math.floor(q.length / 2)], d = Math.atan2(b[1] - a[1], b[0] - a[0]); g.fillStyle = g.strokeStyle; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[0] - 9 * Math.cos(d - 0.4), b[1] - 9 * Math.sin(d - 0.4)); g.lineTo(b[0] - 9 * Math.cos(d + 0.4), b[1] - 9 * Math.sin(d + 0.4)); g.fill(); }
      }
      for (const p of E.puntos || []) { const q = X(p.p); g.fillStyle = col(p.color || '--serie-2'); g.beginPath(); g.arc(q[0], q[1], p.r || 4.5, 0, 7); g.fill(); }
      for (const e of E.etiquetas || []) { const q = X(e.p); g.fillStyle = col('--ink'); g.font = '12px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText(e.t, q[0] + 6, q[1] - 4); }
    }
    window.addEventListener('resize', dibuja);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);
    return { dibuja, gira, estado: () => ({ yaw, pitch }) };
  }
  return { monta, proyecta, rampa };
})();

