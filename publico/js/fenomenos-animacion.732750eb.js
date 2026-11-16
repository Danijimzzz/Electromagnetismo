const Animacion = (() => {
  const { $, esc, lienzo } = Herramienta;
  function monta({ lienzo: sel, pasos, dibuja, colores = [], sonido = null }) {
    const cv = $(sel), puntos = $('#puntos'), play = $('#play'), n = pasos.length;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = performance.now();
    let i = 0, inicio = t0, avanza = true, c = {}, audio = null, ac = null, suena = false, foto = null, funde = 0;
    const leeColores = () => { const st = getComputedStyle(document.documentElement); c = {}; for (const k of colores) c[k] = st.getPropertyValue('--' + k).trim(); };
    const dura = (p) => p.dura || 9000, anim = (p) => p.anim || 2500;
    puntos.innerHTML = pasos.map((p, k) => `<button type="button" title="${esc(p.titulo)}" aria-label="Paso ${k + 1}: ${esc(p.titulo)}"><b>${k + 1}</b><span>${esc(p.corto || '')}</span></button>`).join('');
    const botones = [...puntos.children];

    function texto() {
      const p = pasos[i];
      $('#paso-t').innerHTML = `<small>Paso ${i + 1} de ${n}</small>${esc(p.titulo)}`;
      const caja = $('.fen-texto');
      if (caja) { caja.classList.remove('entra'); void caja.offsetWidth; caja.classList.add('entra'); }
      $('#paso-x').innerHTML = (p.dato ? `<div class="fen-dato"><b>${Mates.html(p.dato.valor)}</b><span>${Mates.html(p.dato.texto)}</span></div>` : '') + p.texto.split(/\n\s*\n/).map((x) => `<p>${Mates.html(x.trim())}</p>`).join('') + (p.prueba ? deslizador(p.prueba) : '');
      if (p.prueba) {
        const d = $('#prueba'), o = $('#prueba-v');
        d.addEventListener('input', () => { const v = +d.value; p.prueba.valor = v; p.prueba.cambia(v); o.innerHTML = p.prueba.muestra(v); if (avanza) ponPlay(false); });
      }
      botones.forEach((b, k) => { b.classList.toggle('hecho', k < i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      $('#ant').disabled = i === 0; $('#sig').disabled = i === n - 1;
    }
    function deslizador(q) {
      q.cambia(q.valor);
      return `<div class="fen-prueba"><label for="prueba"><b>Pruébalo tú:</b> ${esc(q.etiqueta)}</label><input type="range" id="prueba" min="${q.min}" max="${q.max}" step="${q.paso}" value="${q.valor}"><output id="prueba-v" for="prueba">${q.muestra(q.valor)}</output></div>`;
    }
    const FUNDE = 450;
    function retrata() {
      if (quieto || !cv.width) return;
      foto = foto || document.createElement('canvas'); foto.width = cv.width; foto.height = cv.height;
      foto.getContext('2d').drawImage(cv, 0, 0); funde = performance.now();
    }
    function ve(k) { k = Math.max(0, Math.min(n - 1, k)); if (k !== i) retrata(); i = k; inicio = performance.now(); texto(); }
    function ponPlay(on) { avanza = on; play.textContent = on ? '❚❚ Parar' : i === n - 1 && performance.now() - inicio >= dura(pasos[i]) ? '↻ Repetir' : '▶ Reproducir'; play.setAttribute('aria-pressed', String(on)); }
    play.addEventListener('click', () => {
      if (avanza) return ponPlay(false);
      if (i === n - 1 && play.textContent.includes('Repetir')) ve(0); else inicio = performance.now();
      ponPlay(true);
    });
    $('#ant').addEventListener('click', () => ve(i - 1));
    $('#sig').addEventListener('click', () => ve(i + 1));
    botones.forEach((b, k) => b.addEventListener('click', () => ve(k)));
    addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select') || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') ve(i + 1); else if (e.key === 'ArrowLeft') ve(i - 1); else return;
      e.preventDefault();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', leeColores);
    const bSonido = $('#sonido');
    if (bSonido && sonido && (window.AudioContext || window.webkitAudioContext)) {
      bSonido.addEventListener('click', () => {
        suena = !suena; bSonido.setAttribute('aria-pressed', String(suena)); bSonido.textContent = suena ? '🔊 Sonido' : '🔇 Sonido';
        if (suena && !ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); audio = sonido(ac); }
        if (ac) suena ? ac.resume() : ac.suspend();
      });
    } else if (bSonido) bSonido.hidden = true;

    function cuadro(ahora) {
      const p = pasos[i], el = ahora - inicio;
      if (avanza && el >= dura(p)) { if (i < n - 1) ve(i + 1); else ponPlay(false); }
      puntos.style.setProperty('--avance', Math.min(1, (i + (avanza && i < n - 1 ? Math.min(1, (ahora - inicio) / dura(pasos[i])) : 0)) / (n - 1)).toFixed(4));
      const { g, w, h } = lienzo(cv);
      const estado = { paso: i, t: quieto ? 1 : Math.min(1, Math.max(0, (ahora - inicio) / anim(pasos[i]))), reloj: quieto ? 0 : (ahora - t0) / 1000, w, h, c, quieto };
      dibuja(g, estado);
      if (foto && ahora - funde < FUNDE && foto.width === cv.width && foto.height === cv.height) {
        const q = 1 - (ahora - funde) / FUNDE;
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = q * q * (3 - 2 * q); g.drawImage(foto, 0, 0); g.restore();
      }
      if (suena && audio) audio.cuadro(estado);
      requestAnimationFrame(cuadro);
    }
    leeColores(); texto(); ponPlay(true);
    if (typeof Version !== 'undefined' && $('#ver')) $('#ver').textContent = Version.de('fenomenos').current;
    requestAnimationFrame(cuadro);
    window.FenomenoApp = { ve, paso: () => i, pasos: n, avanza: () => avanza, sonido: () => suena };
  }
  return { monta };
})();

