/* =====================================================================
   Animación por pasos, común a todos los fenómenos de «Física en la vida real».
   Va en la página tras mates.js; cada fenómeno (fenomenos/<clave>/escena.js)
   solo da sus pasos y su dibujo:
     Animacion.monta({ lienzo: '#escena', pasos, dibuja, colores })
       pasos    [{ titulo, texto, anim?, dura? }]: texto en HTML con fórmulas $…$
                (párrafos separados por una línea en blanco); anim = ms que dura el
                movimiento del paso (2500) y dura = ms hasta pasar al siguiente (9000)
       dibuja(g, { paso, t, reloj, w, h, c })  dibuja el paso en el contexto g
                (px CSS): t va de 0 a 1 durante el movimiento, reloj son los segundos
                desde que se abrió la página (para lo que se mueve siempre, como un
                brillo) y c los colores leídos de las variables CSS de «colores»
       colores  nombres de variables CSS sin «--» (se releen al cambiar de modo)
   Avanza sola de un paso al siguiente; «Parar» detiene solo el avance (el paso
   sigue animado), y Anterior, Siguiente, los números y las flechas del teclado
   funcionan siempre. La maqueta (#escena, #ant, #play, #sig, #puntos, #paso-t,
   #paso-x, #ver) está en la pagina.html de cada fenómeno y los estilos en
   fenomenos/estilos.css. Expone window.FenomenoApp para las pruebas.
   ===================================================================== */
const Animacion = (() => {
  const { $, esc, lienzo } = Herramienta;
  function monta({ lienzo: sel, pasos, dibuja, colores = [] }) {
    const cv = $(sel), puntos = $('#puntos'), play = $('#play'), n = pasos.length;
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches, t0 = performance.now();
    let i = 0, inicio = t0, avanza = true, c = {};
    const leeColores = () => { const st = getComputedStyle(document.documentElement); c = {}; for (const k of colores) c[k] = st.getPropertyValue('--' + k).trim(); };
    const dura = (p) => p.dura || 9000, anim = (p) => p.anim || 2500;
    puntos.innerHTML = pasos.map((p, k) => `<button type="button" title="${esc(p.titulo)}" aria-label="Paso ${k + 1}: ${esc(p.titulo)}">${k + 1}<i></i></button>`).join('');
    const botones = [...puntos.children];

    function texto() {
      const p = pasos[i];
      $('#paso-t').innerHTML = `<small>Paso ${i + 1} de ${n}</small>${esc(p.titulo)}`;
      $('#paso-x').innerHTML = p.texto.split(/\n\s*\n/).map((x) => `<p>${Mates.html(x.trim())}</p>`).join('');
      botones.forEach((b, k) => { b.classList.toggle('hecho', k < i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.querySelector('i').style.width = '0'; });
      $('#ant').disabled = i === 0; $('#sig').disabled = i === n - 1;
    }
    function ve(k) { i = Math.max(0, Math.min(n - 1, k)); inicio = performance.now(); texto(); }
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

    function cuadro(ahora) {
      const p = pasos[i], el = ahora - inicio;
      if (avanza && el >= dura(p)) { if (i < n - 1) ve(i + 1); else ponPlay(false); }
      botones[i].querySelector('i').style.width = avanza ? `${Math.min(100, ((ahora - inicio) / dura(pasos[i])) * 100)}%` : '0';
      const { g, w, h } = lienzo(cv);
      dibuja(g, { paso: i, t: quieto ? 1 : Math.min(1, Math.max(0, (ahora - inicio) / anim(pasos[i]))), reloj: quieto ? 0 : (ahora - t0) / 1000, w, h, c });
      requestAnimationFrame(cuadro);
    }
    leeColores(); texto(); ponPlay(true);
    if (typeof Version !== 'undefined' && $('#ver')) $('#ver').textContent = Version.de('fenomenos').current;
    requestAnimationFrame(cuadro);
    window.FenomenoApp = { ve, paso: () => i, pasos: n, avanza: () => avanza };
  }
  return { monta };
})();
