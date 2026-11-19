/* =====================================================================
   «Mis ejercicios»: barra lateral común a todas las herramientas, como la
   del simulador de electrostática. Guarda en este navegador el estado de la
   herramienta (lo que cada app ya deja en localStorage con su clave) con un
   título, una carpeta y la marca de fijado; abre, renombra, borra, exporta e
   importa ejercicios en archivos .simu.json. Abrir uno deja su estado en la
   clave de la app y recarga la página, así sirve para cualquier herramienta.
   La clave sale del catálogo («guarda»): herramientas.js la pone en la llamada
   Biblioteca.monta(carpeta, clave) de cada página.
   Copia de seguridad global: «Copia de seguridad de todo» junta en un solo archivo
   (.copia.json) los ejercicios de todas las herramientas (Electrostática incluida, que desde la 1.20.1
   usa esta misma barra; los problemas que tenía guardados con la barra antigua se pasan solos: migraElectro); «Importar archivo» y «Restaurar copia» la reconocen y la suman a lo
   que ya hay sin duplicar ni borrar nada. La lógica (Biblioteca.copia / restaura) no toca
   el DOM y se prueba en Node con un almacén falso.
   También: «Copiar enlace» (los datos de ahora en la dirección, #d=…; herramienta.js los recoge al
   abrirlo) y «Hoja para imprimir» (elige varios ejercicios y se imprimen juntos con su solución:
   cada uno se abre en un marco oculto de la misma página, se copian sus resultados y su desarrollo
   y se devuelve el estado de antes).
   Sin carreras (Fase 10): antes de leer el estado lanza «simu-guardar» (las apps con cálculo en espera guardan al momento) y, al
   abrir un ejercicio, bloquea las escrituras de la clave hasta recargar. Prueba: pruebas/biblioteca-carreras.js.
   ===================================================================== */
const Biblioteca = (() => {
  const FORMATO = 'simulaciencia-ejercicios', ANCHO = 1360;
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const lee = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
  const escribe = (k, v) => { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); return true; } catch (e) { return false; } };
  const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ---- copia de seguridad global (sin DOM: recibe el almacén, normalmente localStorage) ----
  const FORMATO_COPIA = 'simulaciencia-copia', PREF = 'simu-ejercicios:', K_ELECTRO = 'electro-sim-lib-v2';
  const idAzar = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const leeAlm = (alm, k) => { try { const v = JSON.parse(alm.getItem(k)); return v ?? null; } catch (e) { return null; } };
  // Electrostática tenía su propia biblioteca (electro-sim-lib-v2); desde la 1.20.1 usa esta barra. Sus problemas pasan a
  // simu-ejercicios:electrostatica con el estado que lee la app ({title, statement, scene}) y se guarda una copia por si acaso.
  const deElectro = (e) => ({ id: typeof e.id === 'string' && e.id ? e.id : idAzar(), titulo: String(e.title || e.titulo || 'Problema sin título').slice(0, 120), carpeta: String(e.folder || e.carpeta || '').slice(0, 60), fijado: false, datos: JSON.stringify({ title: e.title || e.titulo || 'Problema sin título', statement: e.statement || e.enunciado || '', scene: e.scene || e.escena }), actualizado: Number(e.updated || e.actualizado) || Date.now() });
  function migraElectro(alm = localStorage) {
    let el = null; try { el = JSON.parse(alm.getItem(K_ELECTRO)); } catch (e) { return 0; }
    if (!Array.isArray(el?.items) || !el.items.length) return 0;
    const lib = leeAlm(alm, PREF + 'electrostatica') || { items: [] }; if (!Array.isArray(lib.items)) lib.items = [];
    let n = 0;
    for (const e of el.items) {
      if (!e?.scene) continue;
      const it = deElectro(e);
      if (lib.items.some((x) => x.id === it.id || (x.titulo === it.titulo && x.datos === it.datos))) continue;
      lib.items.push(it); n++;
    }
    try { alm.setItem(PREF + 'electrostatica', JSON.stringify(lib)); alm.setItem(K_ELECTRO + '-migrada', alm.getItem(K_ELECTRO)); alm.removeItem(K_ELECTRO); } catch (e) { return 0; }
    return n;
  }
  function copia(alm = localStorage) {
    migraElectro(alm);
    const herramientas = {}; let total = 0;
    for (let i = 0; i < alm.length; i++) {
      const k = alm.key(i); if (!k || !k.startsWith(PREF)) continue;
      const lib = leeAlm(alm, k), its = Array.isArray(lib?.items) ? lib.items.filter((x) => typeof x?.datos === 'string') : [];
      if (!its.length) continue;
      herramientas[k.slice(PREF.length)] = its.map((x) => ({ id: x.id, titulo: x.titulo, carpeta: x.carpeta || undefined, fijado: x.fijado || undefined, actualizado: x.actualizado, datos: x.datos }));
      total += its.length;
    }
    return { formato: FORMATO_COPIA, version: 1, guardado: new Date().toISOString(), herramientas, total };
  }
  // suma la copia a lo que hay: lo que ya está (mismo título y mismos datos, o mismo id en Electrostática) se salta
  function restaura(d, alm = localStorage) {
    if (d?.formato !== FORMATO_COPIA || typeof d.herramientas !== 'object' || !d.herramientas) throw new Error('no es una copia de seguridad de Ciencify');
    let nuevos = 0, repetidos = 0, herr = 0;
    // las copias hechas con la barra antigua de Electrostática traían sus problemas aparte: se suman a las demás
    const hs = { ...d.herramientas };
    if (Array.isArray(d.electrostatica)) hs.electrostatica = [...(Array.isArray(hs.electrostatica) ? hs.electrostatica : []), ...d.electrostatica.filter((e) => e?.scene).map(deElectro)];
    for (const [carpeta, its] of Object.entries(hs)) {
      if (!/^[a-z0-9-]{1,60}$/.test(carpeta) || !Array.isArray(its)) continue;
      const lib = leeAlm(alm, PREF + carpeta) || { items: [] }; if (!Array.isArray(lib.items)) lib.items = [];
      let suma = 0;
      for (const e of its) {
        if (typeof e?.datos !== 'string') continue;
        const titulo = String(e.titulo || 'Ejercicio importado').slice(0, 120);
        if (lib.items.some((x) => x.titulo === titulo && x.datos === e.datos)) { repetidos++; continue; }
        const id = typeof e.id === 'string' && e.id && !lib.items.some((x) => x.id === e.id) ? e.id : idAzar();
        lib.items.push({ id, titulo, carpeta: String(e.carpeta || '').slice(0, 60), fijado: !!e.fijado, datos: e.datos, actualizado: Number(e.actualizado) || Date.now() }); suma++;
      }
      if (suma) { alm.setItem(PREF + carpeta, JSON.stringify(lib)); herr++; nuevos += suma; }
    }
    return { nuevos, repetidos, herramientas: herr };
  }

  // iconos de trazo (estilo SF), con el color del texto
  const IC = {
    plus: '<path d="M12 5v14M5 12h14"/>', ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"/>',
    imp: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/>', exp: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19h14"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>', rest: '<path d="M4 12a8 8 0 1 1 2.5 5.8M4 18v-5h5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    print: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6" rx="1"/>',
    star: '<path d="M12 4l2.4 5 5.5.7-4 3.8 1 5.5L12 16.5 7.1 19l1-5.5-4-3.8 5.5-.7z"/>', folder: '<path d="M4 7a2 2 0 0 1 2-2h3.5l2 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>',
    dots: '<circle cx="12" cy="5.5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="18.5" r="1.4" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', chev: '<path d="M9 6l6 6-6 6"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    pencil: '<path d="M5 19l1-4L16.5 4.5a1.5 1.5 0 0 1 2 0l1 1a1.5 1.5 0 0 1 0 2L9 18z"/>', pin: '<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/>',
    sel: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/>', open: '<path d="M5 12h14M13 6l6 6-6 6"/>', move: '<path d="M4 7a2 2 0 0 1 2-2h3.5l2 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5L12 11l2.5 2.5"/>'
  };
  const ico = (n) => `<svg class="bib-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
  const CSS = `
.bib-btn { display: inline-flex; align-items: center; gap: 6px; font: 600 13.5px var(--f-ui, system-ui); color: var(--ink); background: var(--vidrio, var(--panel)); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none); border: 1px solid var(--vidrio-borde, var(--line)); border-radius: 999px; padding: 5px 12px; cursor: pointer; white-space: nowrap }
.bib-btn:hover, .bib-btn[aria-expanded=true] { border-color: var(--accent); color: var(--accent) }
.bib { --ic-azul: #0a84ff; --ic-naranja: #ff9f0a; --ic-verde: #30b25a; --ic-violeta: #8e5cf0; --ic-cielo: #3aa8e0; --ic-rosa: #ff5c7a; --ic-rojo: #ff453a; --ic-oro: #e0a000;
  position: fixed; top: 10px; left: 10px; bottom: 10px; width: 310px; max-width: calc(88vw - 10px); z-index: 60; overflow: hidden; background: var(--vidrio-fuerte, var(--panel)); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none); border: 1px solid var(--vidrio-borde, var(--line)); border-radius: 24px; box-shadow: var(--vidrio-brillo, none), var(--vidrio-sombra, none); display: flex; flex-direction: column; transform: translateX(-115%); transition: transform .2s ease; font: 13.5px/1.4 var(--f-ui, system-ui); color: var(--ink) }
.bib.abierta { transform: none }
.bib-scrim { position: fixed; inset: 0; z-index: 59; background: rgba(0,0,0,.3) }
@media (min-width: ${ANCHO}px) { body.bib-fija { padding-left: 332px } body.bib-fija .bib-scrim { display: none } }
@media (prefers-reduced-motion: reduce) { .bib { transition: none } }
.bib button { font-family: inherit } .bib-i { width: 16px; height: 16px; flex: 0 0 auto }
.bib-h { display: flex; align-items: center; gap: 8px; padding: 16px 12px 10px 16px }
.bib-h b { font: 700 18px var(--f-ui, system-ui); letter-spacing: -.01em } .bib-n { color: var(--muted); font-size: 12px; margin-right: auto }
.bib-hsel { justify-content: space-between } .bib-hsel b { font-size: 15px }
.bib-lnk { border: 0; background: none; color: var(--accent); font: 600 13.5px var(--f-ui, system-ui); padding: 4px 6px; border-radius: 8px; cursor: pointer } .bib-lnk:hover { background: var(--accent-soft, var(--bg)) }
.bib-x, .bib-dots { border: 0; background: none; color: var(--muted); cursor: pointer; display: grid; place-items: center; border-radius: 50% }
.bib-x { width: 28px; height: 28px; background: color-mix(in srgb, var(--ink) 9%, transparent) } .bib-x .bib-i { width: 13px; height: 13px }
.bib-dots { width: 30px; height: 30px; flex: 0 0 auto } .bib-dots:hover, .bib-dots[aria-expanded=true] { background: color-mix(in srgb, var(--ink) 9%, transparent); color: var(--accent) } .bib-dots .bib-i { width: 17px; height: 17px }
.bib-dots:disabled { opacity: .4; cursor: default; pointer-events: none }
.bib-h .bib-dots { background: var(--vidrio, var(--bg)); border: 1px solid var(--vidrio-borde, var(--line)) }
.bib-seg { display: grid; grid-template-columns: 1fr 1fr; margin: 0 14px 10px; padding: 3px; border-radius: 99px; background: color-mix(in srgb, var(--ink) 8%, transparent) }
.bib-seg button { border: 0; background: none; color: var(--muted); font: 500 13px var(--f-ui, system-ui); padding: 6px; border-radius: 99px; cursor: pointer }
.bib-seg button[aria-selected=true] { background: var(--vidrio-fuerte, var(--panel)); color: var(--ink); box-shadow: 0 1px 4px rgba(0,0,0,.15), var(--vidrio-brillo, none) }
.bib-cta { display: flex; gap: 8px; padding: 0 14px 8px }
.bib-prim { flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; border: 0; border-radius: 99px; padding: 9px; background: var(--accent); color: var(--panel); font: 600 14px var(--f-ui, system-ui); cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,.3) }
.bib-circ { width: 40px; flex: 0 0 auto; border-radius: 99px; border: 1px solid var(--vidrio-borde, var(--line)); background: var(--vidrio-fuerte, var(--panel)); color: var(--accent); display: grid; place-items: center; cursor: pointer; box-shadow: var(--vidrio-brillo, none) }
.bib-circ:disabled { opacity: .45; cursor: default; color: var(--muted) }
.bib-busca { margin: 0 14px 6px; font: 13px var(--f-ui, system-ui); color: var(--ink); background: color-mix(in srgb, var(--ink) 7%, transparent); border: 1px solid transparent; border-radius: 99px; padding: 7px 13px; width: calc(100% - 28px) }
.bib-busca:focus { outline: 2px solid var(--accent); outline-offset: 0 }
.bib-form { margin: 0 14px 8px; padding: 10px; border: 1px solid var(--accent); border-radius: 14px; display: grid; gap: 6px; background: var(--vidrio, var(--panel)) }
.bib-form label { font-size: 12px; color: var(--muted); display: grid; gap: 2px }
.bib-form input { font: 13px var(--f-ui, system-ui); color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 6px 9px }
.bib-form .fila { display: flex; gap: 6px; justify-content: flex-end }
.bib-form button { font: 500 13px var(--f-ui, system-ui); border: 1px solid var(--line); background: var(--panel); color: var(--ink); border-radius: 99px; padding: 5px 12px; cursor: pointer }
.bib-form button.si { background: var(--accent); border-color: var(--accent); color: var(--panel) }
.bib-chips { display: flex; flex-wrap: wrap; gap: 5px }
.bib-form .bib-chip { padding: 3px 10px; font-size: 12px } .bib-form .bib-chip.on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft, var(--bg)) }
.bib-lista { flex: 1; overflow-y: auto; padding: 0 10px 8px }
.bib-sec { display: flex; align-items: center; gap: 6px; font: 600 11px var(--f-ui, system-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin: 12px 6px 4px }
.bib-carpfila { display: flex; align-items: center; margin-top: 8px } .bib-carpfila .bib-dots { width: 26px; height: 26px }
.bib-carp { flex: 1; display: flex; align-items: center; gap: 6px; border: 0; background: none; color: var(--muted); font: 600 11px var(--f-ui, system-ui); letter-spacing: .06em; text-transform: uppercase; padding: 5px 6px; border-radius: 8px; cursor: pointer; text-align: left }
.bib-carp:hover { background: color-mix(in srgb, var(--ink) 6%, transparent) } .bib-carp .n { margin-left: auto; font-weight: 400; font-size: 12px } .bib-carp .bib-i { width: 13px; height: 13px }
.bib-it { display: flex; align-items: center; border-radius: 12px; padding-right: 2px }
.bib-it:hover, .bib-it:focus-within { background: color-mix(in srgb, var(--ink) 6%, transparent) }
.bib-it.activo { background: var(--accent-soft, var(--bg)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent); color: var(--accent); font-weight: 600 } .bib-it.activo .bib-abre { color: var(--accent) }
.bib-it.marc { background: color-mix(in srgb, var(--accent) 10%, transparent) }
.bib-abre { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; border: 0; background: none; color: var(--ink); text-align: left; font: inherit; font-weight: inherit; padding: 8px 6px 8px 10px; cursor: pointer }
.bib-tt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap } .bib-fv { color: var(--ic-oro); display: grid } .bib-fv .bib-i { width: 13px; height: 13px; fill: currentColor }
.bib-chk { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--muted); display: grid; place-items: center; flex: 0 0 auto } .bib-chk.on { background: var(--accent); border-color: var(--accent); color: var(--panel) } .bib-chk .bib-i { width: 14px; height: 14px; stroke-width: 2.6 }
.bib-vacio { color: var(--muted); padding: 4px 6px 10px; margin: 0 }
.bib-sub { font: 600 12px var(--f-ui, system-ui); color: var(--muted); margin: 10px 6px 2px }
.bib-ej { display: block; width: 100%; border: 0; background: none; color: var(--ink); text-align: left; font: 13.5px var(--f-ui, system-ui); padding: 8px 10px; border-radius: 12px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
.bib-ej:hover { background: color-mix(in srgb, var(--ink) 6%, transparent) } .bib-ej.activo { background: var(--accent-soft, var(--bg)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent); color: var(--accent); font-weight: 600 }
.bib-pie { padding: 8px 16px 14px; color: var(--muted); font-size: 11.5px } .bib-pie p { margin: 0 }
.bib-aviso { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 70; background: var(--ink); color: var(--panel); padding: 8px 14px; border-radius: 99px; font: 13px var(--f-ui, system-ui); box-shadow: 0 4px 16px rgba(0,0,0,.2) }
.bib.arrastre { outline: 2px dashed var(--accent); outline-offset: -6px }
.bib-grp { display: grid; border-radius: 14px; background: var(--vidrio-fuerte, var(--panel)); border: 1px solid var(--vidrio-borde, var(--line)); box-shadow: var(--vidrio-brillo, none); overflow: hidden }
.bib-grp + .bib-grp { margin-top: 8px }
.bib-mi { display: flex; align-items: center; gap: 10px; width: 100%; border: 0; background: none; color: var(--ink); text-align: left; font: 500 13.5px var(--f-ui, system-ui); padding: 8px 10px; cursor: pointer }
.bib-mi + .bib-mi { border-top: 1px solid var(--line) } .bib-mi:hover:not(:disabled) { background: color-mix(in srgb, var(--ink) 6%, transparent) } .bib-mi:disabled { opacity: .45; cursor: default }
.bib-mi small { display: block; color: var(--muted); font: 400 11.5px var(--f-ui, system-ui) } .bib-mi .bib-ch { margin-left: auto; color: var(--muted) } .bib-ch .bib-i { width: 13px; height: 13px }
.bib-sq { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: var(--c, var(--accent)); color: #fff; flex: 0 0 auto } .bib-sq .bib-i { width: 16px; height: 16px }
.bib-mi.peligro { color: var(--error, #c0392b) }
.bib-selbar { padding: 8px 12px 12px; border-top: 1px solid var(--vidrio-borde, var(--line)) }
.bib-dim { position: absolute; inset: 0; z-index: 4; background: rgba(0,0,0,.18); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px) }
.bib-pop { position: absolute; right: 12px; z-index: 5; width: 240px; max-width: calc(100% - 24px); max-height: calc(100% - 20px); overflow-y: auto; padding: 8px; border-radius: 20px; background: var(--vidrio-fuerte, var(--panel)); border: 1px solid var(--vidrio-borde, var(--line)); box-shadow: var(--vidrio-brillo, none), 0 14px 40px rgba(0,0,0,.28); -webkit-backdrop-filter: var(--blur, none); backdrop-filter: var(--blur, none) }
#hoja-imp { display: none }
/* al imprimir la barra, su fondo de cristal, el aviso y el hueco que deja a la izquierda sobran (en Circuitos salía encima del esquema) */
@media print { .bib, .bib-scrim, .bib-aviso, .bib-btn { display: none !important } body.bib-fija { padding-left: 0 !important } }
@media print { body.hoja-imprimiendo > *:not(#hoja-imp) { display: none !important } body.hoja-imprimiendo #hoja-imp { display: block !important } body.hoja-imprimiendo { padding: 0 !important; background: #fff !important }
  #hoja-imp { color: #222; font: 10pt/1.45 "IBM Plex Sans", system-ui, sans-serif; --i-serif: "IBM Plex Serif", Georgia, serif; --i-mono: "IBM Plex Mono", ui-monospace, monospace }
  #hoja-imp .hoja-marca { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 10pt; margin-bottom: 14pt; border-bottom: 1.5pt solid var(--accent, #555) }
  #hoja-imp .hoja-marca .mk { font: 600 15pt var(--i-serif); color: #111 } #hoja-imp .hoja-marca .mk i { color: var(--marca, #0d6b66) }
  #hoja-imp .hoja-marca .as { font: 500 7.5pt var(--i-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--accent, #555) }
  #hoja-imp h1 { font: italic 400 24pt/1.2 var(--i-serif); letter-spacing: -.01em; margin: 0 0 10pt }
  #hoja-imp .hoja-sub { color: #666; font-size: 9pt; margin: -4pt 0 16pt }
  #hoja-imp section.hoja-ej { margin: 0 0 22pt; padding-top: 14pt; border-top: .5pt solid #bbb } #hoja-imp section.hoja-ej:first-of-type { border-top: 0; padding-top: 0 }
  #hoja-imp h2 { font: 500 7.5pt var(--i-mono); text-transform: uppercase; letter-spacing: .14em; color: #222; border-bottom: .5pt solid var(--accent, #555); padding-bottom: 3pt; margin: 12pt 0 6pt; break-after: avoid }
  #hoja-imp h2.hoja-tit { font: italic 400 17pt var(--i-serif); text-transform: none; letter-spacing: 0; border: 0; padding: 0; margin: 0 0 6pt; display: flex; gap: 8pt; align-items: baseline } #hoja-imp h2.hoja-tit b { font: 600 17pt var(--f-ui, system-ui); font-style: normal; color: var(--accent, #555) } #hoja-imp h2.hoja-tit small { font: 8pt var(--f-ui, system-ui); font-style: normal; color: #777 }
  #hoja-imp h3 { font: 600 10.5pt var(--f-ui, system-ui); margin: 0 0 2pt } #hoja-imp h4 { font: 600 8pt var(--f-ui, system-ui); text-transform: uppercase; letter-spacing: .1em; color: #777; margin: 8pt 0 3pt }
  #hoja-imp .card { box-shadow: none !important; border: 0 !important; border-radius: 0 !important; padding: 0 0 6pt !important; background: none !important; break-inside: avoid }
  #hoja-imp .hoja-enun, #hoja-imp .stmt { border-left: 2pt solid var(--accent, #555) !important; background: none !important; padding: 0 0 0 12pt !important; margin: 0 0 12pt; font: italic 10.5pt/1.5 var(--i-serif); white-space: pre-wrap } #hoja-imp .hoja-enun h3 { font: 700 7.5pt var(--f-ui, system-ui); font-style: normal; text-transform: uppercase; letter-spacing: .12em; color: var(--accent, #555); margin: 0 0 3pt }
  #hoja-imp .result, #hoja-imp .destacado { border-left: 3pt solid var(--accent, #555); padding-left: 10pt }
  #hoja-imp img { max-width: 100%; max-height: 9cm; object-fit: contain } #hoja-imp .pasos li, #hoja-imp .steps-b { break-inside: avoid } #hoja-imp .enun-imp { white-space: pre-wrap } }
`;

  // opts.titulo(): título que propone «Guardar el actual» (por defecto, el del ejemplo elegido o «Ejercicio N»)
  // Una página puede definir window.simuFicha() (HTML): es lo que va a la hoja para imprimir en vez de copiar sus tarjetas (Electrostática)
  function monta(herramienta, clave, opts = {}) {
    const cab = document.querySelector('header.top');
    if (!clave || !cab || document.querySelector('.bib')) return null;
    const K = `simu-ejercicios:${herramienta}`, K_UI = 'simu-ejercicios-ui', K_ACT = `simu-ejercicios-activo:${herramienta}`;
    const nombre = (document.querySelector('h1')?.textContent || document.title.split('·')[0]).trim();
    let lib = lee(K, { items: [] }); if (!Array.isArray(lib.items)) lib = { items: [] };
    let ui = { abierta: window.innerWidth >= ANCHO, cerradas: {}, ...lee(K_UI, {}) };
    let activo = null; try { activo = sessionStorage.getItem(K_ACT); } catch (e) { /* sin almacenamiento */ }
    if (activo && !lib.items.some((x) => x.id === activo)) activo = null;
    // pestana: 'guardados' | 'ejemplos'; menu: {tipo:'fila'|'carpeta'|'general', id|carpeta}; sel: Set de ids en modo selección
    let busca = '', form = null, borrando = null, sel = null, pestana = 'guardados', menu = null;
    const guardaLib = () => escribe(K, lib) || aviso('No se pudo guardar: el navegador no deja usar el almacenamiento');
    const guardaUI = () => escribe(K_UI, ui);
    // Dos pestañas a la vez (10.6): antes de cambiar la lista se vuelve a leer la guardada, y si otra pestaña la cambia se repinta
    const refresca = () => { const l = lee(K, null); if (l && Array.isArray(l.items)) lib = l; if (activo && !lib.items.some((x) => x.id === activo)) activo = null; };
    window.addEventListener('storage', (e) => { if (e.key === K && !form) { refresca(); pinta(); } });
    const ponActivo = (id) => { activo = id; try { if (id) sessionStorage.setItem(K_ACT, id); else sessionStorage.removeItem(K_ACT); } catch (e) { /* sin almacenamiento */ } };
    // las apps que guardan con retraso escuchan «simu-guardar» y guardan al momento
    const estado = () => { window.dispatchEvent(new Event('simu-guardar')); try { return localStorage.getItem(clave); } catch (e) { return null; } };
    const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    // «Ejercicios de ejemplo»: las opciones de los <select id="ejemplos…"> de la página, agrupadas
    const selsEj = () => [...document.querySelectorAll('select[id^="ejemplo"]')];
    function grupoDe(s) {
      const p = s.closest('[role="tabpanel"]'); if (!p) return '';
      const t = document.getElementById(p.getAttribute('aria-labelledby') || 'tab-' + p.id.replace(/^panel-/, ''));
      return t ? t.textContent.trim() : '';
    }
    function ejemplosHTML(q) {
      const sels = selsEj(); let h = '';
      sels.forEach((s, i) => {
        const bot = (o) => o.value && (!q || norm(o.textContent).includes(q)) ? `<button class="bib-ej${s.value === o.value ? ' activo' : ''}" data-acc="ejemplo" data-sel="${i}" data-v="${esc(o.value)}" title="${esc(o.textContent.trim())}">${esc(o.textContent.trim())}</button>` : '';
        let cuerpo = '';
        for (const c of s.children) {
          if (c.tagName === 'OPTGROUP') { const b = [...c.children].map(bot).join(''); if (b) cuerpo += `<p class="bib-sub">${esc(c.label)}</p>${b}`; }
          else cuerpo += bot(c);
        }
        const g = sels.length > 1 && grupoDe(s);
        if (cuerpo) h += (g ? `<p class="bib-sub">${esc(g)}</p>` : '') + cuerpo;
      });
      return h;
    }
    const marcaEj = () => { const sels = selsEj(); for (const b of panel.querySelectorAll('.bib-ej')) b.classList.toggle('activo', sels[+b.dataset.sel]?.value === b.dataset.v); };
    const ejemplo = () => { if (opts.titulo) return opts.titulo(); const s = document.querySelector('select#ejemplo, select[id^="ejemplo"]'); return s && s.value && s.selectedOptions[0] ? s.selectedOptions[0].textContent.trim() : ''; };

    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const btn = document.createElement('button');
    btn.className = 'bib-btn'; btn.type = 'button'; btn.setAttribute('aria-controls', 'bib'); btn.title = 'Guardar, abrir, exportar e importar tus ejercicios';
    btn.innerHTML = '<span aria-hidden="true">☰</span> Mis ejercicios';
    // a la izquierda de la miga «Asignatura › Herramienta» (diseno.js), como la barra de electrostática
    const izq = document.querySelector('.miga-izq'), ini = cab.querySelector('.a-inicio');
    if (izq) izq.append(btn); else (ini ? ini.after(btn) : cab.prepend(btn));
    const panel = document.createElement('aside'); panel.className = 'bib'; panel.id = 'bib'; panel.setAttribute('aria-label', 'Mis ejercicios');
    const scrim = document.createElement('div'); scrim.className = 'bib-scrim'; scrim.hidden = true;
    const archivo = document.createElement('input'); archivo.type = 'file'; archivo.accept = '.json,application/json'; archivo.multiple = true; archivo.hidden = true;
    document.body.append(panel, scrim, archivo);

    let tAviso = 0;
    function aviso(t) {
      let a = document.querySelector('.bib-aviso'); if (!a) { a = document.createElement('div'); a.className = 'bib-aviso'; a.setAttribute('role', 'status'); document.body.appendChild(a); }
      a.textContent = t; a.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => { a.hidden = true; }, 2600);
    }
    function abre(v) {
      ui.abierta = v; guardaUI();
      panel.classList.toggle('abierta', v); btn.setAttribute('aria-expanded', String(v));
      document.body.classList.toggle('bib-fija', v && window.innerWidth >= ANCHO);
      scrim.hidden = !v || window.innerWidth >= ANCHO;
    }
    function descargaCopia() {
      const c = copia(); if (!c.total) { aviso('Todavía no tienes ejercicios guardados en ninguna herramienta'); return; }
      delete c.total; descarga(`ciencify-copia-${c.guardado.slice(0, 10)}.copia.json`, c);
      aviso('Copia de seguridad descargada');
    }
    function descarga(nombreArch, datos) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = nombreArch; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    const archivoDe = (items) => ({ formato: FORMATO, version: 1, herramienta, guardado: new Date().toISOString(), ejercicios: items.map((i) => ({ titulo: i.titulo, carpeta: i.carpeta || undefined, fijado: i.fijado || undefined, datos: i.datos })) });
    const nombreArchivo = (t) => (norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ejercicio') + '.simu.json';

    function importa(texto) {
      const d = JSON.parse(texto);
      if (d?.formato === FORMATO_COPIA) {
        const r = restaura(d); lib = lee(K, { items: [] }); if (!Array.isArray(lib.items)) lib = { items: [] };
        importa.aviso = r.nuevos ? `Copia restaurada: ${r.nuevos} ejercicio${r.nuevos === 1 ? '' : 's'} en ${r.herramientas} herramienta${r.herramientas === 1 ? '' : 's'}${r.repetidos ? ` (${r.repetidos} ya estaban)` : ''}` : 'La copia no traía nada nuevo: ya tenías todo';
        return r.nuevos;
      }
      importa.aviso = '';
      // .emsim.json de Electrostática (la versión de antes de la 1.20.1 los guardaba así)
      if (herramienta === 'electrostatica' && ((d?.formato === 'simulador-electrostatica' && Array.isArray(d.problemas)) || Array.isArray(d?.sources))) {
        let m = 0;
        for (const p of Array.isArray(d.sources) ? [{ titulo: 'Escena importada', escena: d }] : d.problemas) {
          if (!p?.escena) continue;
          const it = deElectro(p); it.id = nuevoId(); it.etiquetas = undefined; lib.items.push(it); m++;
        }
        return m;
      }
      if (d?.formato !== FORMATO || !Array.isArray(d.ejercicios)) throw new Error('no es un archivo de ejercicios de Ciencify');
      if (d.herramienta !== herramienta) throw new Error(`es de otra herramienta (${d.herramienta})`);
      let n = 0;
      for (const e of d.ejercicios) {
        if (typeof e?.datos !== 'string') continue;
        lib.items.push({ id: nuevoId(), titulo: String(e.titulo || 'Ejercicio importado').slice(0, 120), carpeta: String(e.carpeta || '').slice(0, 60), fijado: !!e.fijado, datos: e.datos, actualizado: Date.now() }); n++;
      }
      return n;
    }
    async function importaArchivos(files) {
      refresca();
      let n = 0;
      for (const f of files) {
        try { n += importa(await f.text()); } catch (err) { aviso(`No se pudo importar ${f.name}: ${err.message}`); return; }
      }
      guardaLib(); pinta(); aviso(importa.aviso || (n === 1 ? 'Ejercicio importado' : `${n} ejercicios importados`));
    }
    function carga(it) {
      if (!escribe(clave, it.datos)) { aviso('No se pudo abrir: el navegador no deja usar el almacenamiento'); return; }
      ponActivo(it.id);
      // hasta que la página se recargue, nada puede volver a escribir la clave: una app con un cálculo pendiente (espera, animación)
      // sobrescribiría lo que se acaba de abrir con el estado de antes y el ejercicio saldría «a veces» mal
      try {
        const pon = Storage.prototype.setItem, quita = Storage.prototype.removeItem;
        Storage.prototype.setItem = function (k, v) { if (this === localStorage && k === clave) return; return pon.call(this, k, v); };
        Storage.prototype.removeItem = function (k) { if (this === localStorage && k === clave) return; return quita.call(this, k); };
      } catch (e) { /* sin almacenamiento */ }
      // si se estaba practicando, lo que se abre sustituye a los datos de antes de la práctica
      try { sessionStorage.removeItem(`simu-practica:${herramienta}`); } catch (e) { /* sin almacenamiento */ }
      // sin el #… de la dirección, que en algunas herramientas (configuración electrónica) manda sobre lo guardado
      history.replaceState(null, '', location.pathname + location.search);
      location.reload();
    }
    function guardaForm() {
      refresca();
      const c = panel.querySelector('#bib-c')?.value.trim() ?? '', tEl = panel.querySelector('#bib-t'), t = tEl ? tEl.value.trim() || 'Ejercicio sin título' : '';
      if (form.renombra !== undefined) {
        if (!c) { aviso('Pon un nombre a la carpeta'); return; }
        for (const x of lib.items) if (x.carpeta === form.renombra) x.carpeta = c;
      } else if (form.ids) { for (const x of lib.items) if (form.ids.includes(x.id)) x.carpeta = c; sel = null; }
      else if (form.id) { const it = lib.items.find((x) => x.id === form.id); if (it) Object.assign(it, { titulo: t, carpeta: c, actualizado: Date.now() }); }
      else {
        const datos = estado();
        if (datos == null) { aviso('Todavía no hay nada que guardar: cambia algún dato primero'); return; }
        const it = { id: nuevoId(), titulo: t, carpeta: c, fijado: false, datos, actualizado: Date.now() };
        lib.items.push(it); ponActivo(it.id); aviso('Guardado en Mis ejercicios');
      }
      form = null; guardaLib(); pinta();
    }
    function actualiza() {
      const it = lib.items.find((x) => x.id === activo), datos = estado();
      if (!it || datos == null) return;
      it.datos = datos; it.actualizado = Date.now(); guardaLib(); pinta(); aviso(`Cambios guardados en «${it.titulo}»`);
    }

    // ----- enlace con los datos de ahora -----
    const b64 = (t) => btoa(unescape(encodeURIComponent(t))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const enlace = () => { const d = estado(); return location.href.split('#')[0] + (d ? `#d=${b64(d)}` : ''); };
    async function copiaTexto(t) {
      try { await navigator.clipboard.writeText(t); return true; } catch (e) {
        const x = document.createElement('textarea'); x.value = t; x.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(x); x.select();
        let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { /* sin portapapeles */ } x.remove(); return ok;
      }
    }
    const enlaceDe = (datos) => location.href.split('#')[0] + (datos ? `#d=${b64(datos)}` : '');
    async function copiaEnlace(datos) {
      const url = datos === undefined ? enlace() : enlaceDe(datos), ok = await copiaTexto(url);
      aviso(!ok ? 'No se ha podido copiar el enlace' : !url.includes('#d=') ? 'Enlace copiado, pero todavía no hay datos que llevar' : url.length > 8000 ? 'Enlace copiado (es muy largo: algunos programas lo cortan)' : 'Enlace copiado: abre la herramienta con estos datos');
    }
    async function copiaEnlaces(its) {
      const ok = await copiaTexto(its.map((i) => `${i.titulo}\n${enlaceDe(i.datos)}`).join('\n\n'));
      aviso(ok ? `${its.length} enlace${its.length === 1 ? '' : 's'} copiado${its.length === 1 ? '' : 's'}: cada uno abre la herramienta con su ejercicio` : 'No se han podido copiar los enlaces');
    }

    // ----- hoja para imprimir: cada ejercicio se abre en un marco oculto y se copia su solución -----
    const valorDe = (el) => el.tagName === 'SELECT' ? [...el.selectedOptions].map((o) => o.textContent.trim()).join(', ') : el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? '✓' : '—') : el.value;
    function extrae(d) {
      const w = d.defaultView;
      if (w && typeof w.simuFicha === 'function') { try { const f = w.simuFicha(); if (f) return f; } catch (e) { /* se copian las tarjetas */ } }
      let nodos = [...d.querySelectorAll('.layout .card')].filter((c) => !c.closest('[hidden]') && c.textContent.trim());
      if (!nodos.length) { const w = d.querySelector('.wrap') || d.body; nodos = [w]; }
      const out = d.createElement('div');
      // enunciado de la herramienta (fuente/enunciado.js): sale delante, con su título, si el ejercicio lo tiene
      const enun = d.querySelector('.enun-bloque .enun-imp');
      if (enun && enun.textContent.trim()) { const c = d.createElement('div'); c.className = 'card hoja-enun'; const t = d.createElement('h3'); t.textContent = 'Enunciado'; c.append(t, enun.cloneNode(true)); out.appendChild(c); }
      for (const n of nodos) {
        const c = n.cloneNode(true);
        // los campos y las gráficas se copian como su valor y como imagen
        const o = [...n.querySelectorAll('input, select, textarea')], k = [...c.querySelectorAll('input, select, textarea')];
        k.forEach((e, i) => { if (e.type === 'hidden' || e.type === 'file' || /^ejemplo/.test(e.id)) { (e.closest('label') || e).remove(); return; } const sp = d.createElement('b'); sp.textContent = valorDe(o[i]); e.replaceWith(sp); });
        const lo = [...n.querySelectorAll('canvas')], lk = [...c.querySelectorAll('canvas')];
        lk.forEach((e, i) => { try { const im = d.createElement('img'); im.src = lo[i].toDataURL('image/png'); im.alt = 'Gráfica del ejercicio'; e.replaceWith(im); } catch (x) { e.remove(); } });
        c.querySelectorAll('button, .controles, .compartir, .tools, .chips, .teoria, footer, header.top, nav, script, style, [hidden]').forEach((e) => e.remove());
        c.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
        c.querySelectorAll('details').forEach((e) => { e.open = true; });
        c.dataset.h = n.querySelector('.campos') ? 'datos' : n.classList.contains('pasos') ? 'desarrollo' : n.querySelector('canvas, img') ? 'escena' : 'resultados';
        c.classList.add('card'); out.appendChild(c);
      }
      return out.innerHTML;
    }
    // Punto único de salida a papel o PDF: la ventana de opciones es la del hilo de los PDF, Biblioteca.abrirVentanaExportar({ ids, accion: 'imprimir'|'pdf', origen }).
    // Mientras no exista, se usa la impresión de siempre (en «PDF» el navegador ofrece «Guardar como PDF»).
    function exporta(its, accion, origen) {
      if (!its.length) return;
      if (typeof Biblioteca.abrirVentanaExportar === 'function') { Biblioteca.abrirVentanaExportar({ ids: its.map((x) => x.id), accion, origen }); return; }
      if (accion === 'pdf') aviso('En la ventana de impresión elige «Guardar como PDF»');
      imprimeHoja(its);
    }
    async function imprimeHoja(its, op = {}) {
      if (!its.length) return;
      op = { ...(typeof VentanaImprimir !== 'undefined' ? VentanaImprimir.BASE : {}), indice: false, ...op };
      aviso('Preparando la hoja…');
      let original = null; try { original = localStorage.getItem(clave); } catch (e) { /* sin almacenamiento */ }
      const fr = document.createElement('iframe');
      fr.style.cssText = 'position:fixed;left:-10000px;top:0;width:1200px;height:900px;border:0'; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.title = 'Preparando la hoja';
      document.body.appendChild(fr);
      const trozos = [];
      try {
        for (const it of its) {
          if (!escribe(clave, it.datos)) throw new Error('el navegador no deja usar el almacenamiento');
          await new Promise((ok) => { fr.onload = ok; fr.src = location.pathname + location.search; });
          await new Promise((ok) => setTimeout(ok, 400));
          trozos.push({ it, html: extrae(fr.contentDocument) });
        }
      } catch (err) { aviso(`No se pudo preparar la hoja: ${err.message}`); }
      finally {
        try { if (original === null) localStorage.removeItem(clave); else localStorage.setItem(clave, original); } catch (e) { /* sin almacenamiento */ }
        fr.remove();
      }
      if (trozos.length !== its.length) return;
      document.getElementById('hoja-imp')?.remove();
      const cont = document.createElement('div'); cont.id = 'hoja-imp';
      const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const marca = `<div class="hoja-marca"><span class="mk">${document.querySelector('header.top .logo')?.innerHTML || 'Cienci<i>fy</i>'}</span><span class="as">${esc(document.querySelector('.miga a')?.textContent || '')}</span></div>`;
      const uno = its.length === 1, tituloHoja = op.titulo || (uno ? trozos[0].it.titulo : nombre);
      const enunDe = (html) => { const d = new DOMParser().parseFromString(html, 'text/html'), e = d.querySelector('.stmt, .hoja-enun .enun-imp, .hoja-enun'); return (e ? e.textContent.replace(/^\s*Enunciado\s*/, '').trim() : '').replace(/\s+/g, ' ').slice(0, 150); };
      const indice = !uno && op.indice && (typeof VentanaImprimir !== 'undefined') ? VentanaImprimir.indiceHTML(tituloHoja, `${its.length} ejercicios · ${fecha}`, trozos.map((t) => ({ titulo: t.it.titulo, carpeta: t.it.carpeta, enun: op.estilo === 'enunciado' ? enunDe(t.html) : '' })), op.estilo === 'enunciado') : '';
      cont.innerHTML = uno
        ? `${marca}<h1>${esc(tituloHoja)}</h1>${trozos[0].html}<div class="hoja-fin"></div>`
        : `${marca}${indice ? '' : `<h1>${esc(tituloHoja)}</h1><p class="hoja-sub">Hoja de ejercicios · ${its.length} ejercicios · ${esc(fecha)}</p>`}${indice}`
          + trozos.map((t, i) => `<section class="hoja-ej" id="hoja-ej-${i + 1}"><h2 class="hoja-tit"><b>${i + 1}</b>${esc(t.it.titulo)}${t.it.carpeta ? ` <small>(${esc(t.it.carpeta)})</small>` : ''}</h2>${t.html}</section>`).join('');
      cont.classList.toggle('uno', uno); cont.classList.toggle('hoja-sep', !uno && op.disposicion === 'paginas');
      cont.classList.toggle('sin-enun', op.enun === false); cont.classList.toggle('sin-datos', op.datos === false);
      cont.classList.toggle('sin-res', op.res === false || op.tipo === 'enunciados'); cont.classList.toggle('sin-des', op.des === false || op.tipo === 'enunciados' || op.tipo === 'resultados');
      cont.classList.toggle('sin-esc', op.esc === false); cont.classList.toggle('solo-enun', op.tipo === 'enunciados'); cont.classList.toggle('bn', op.tinta === 'bn');
      if ((typeof VentanaImprimir !== 'undefined')) VentanaImprimir.estilos();
      const tituloAntes = document.title; if (op.titulo) document.title = op.titulo;
      document.body.appendChild(cont);
      const tema = document.documentElement.getAttribute('data-theme');
      const fin = () => {
        removeEventListener('afterprint', fin);
        document.body.classList.remove('hoja-imprimiendo'); cont.remove(); document.title = tituloAntes;
        if (tema === null) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', tema);
      };
      addEventListener('afterprint', fin);
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('hoja-imprimiendo');
      sel = null; menu = null; pinta(); abre(false);
      window.print();
    }

    function fila(it) {
      if (sel) { const m = sel.has(it.id); return `<div class="bib-it${m ? ' marc' : ''}" data-id="${it.id}"><button class="bib-abre" data-acc="marcar" role="checkbox" aria-checked="${m}"><span class="bib-chk${m ? ' on' : ''}" aria-hidden="true">${m ? ico('ok') : ''}</span><span class="bib-tt">${esc(it.titulo)}</span></button></div>`; }
      return `<div class="bib-it${it.id === activo ? ' activo' : ''}" data-id="${it.id}"><button class="bib-abre" data-acc="abrir" title="Abrir «${esc(it.titulo)}»"><span class="bib-tt">${esc(it.titulo)}</span>${it.fijado ? `<span class="bib-fv" title="Fijado">${ico('star')}</span>` : ''}</button><button class="bib-dots" data-acc="menu-fila" aria-haspopup="menu" aria-expanded="${menu?.id === it.id}" aria-label="Opciones de «${esc(it.titulo)}»" title="Opciones">${ico('dots')}</button></div>`;
    }
    const mi = (acc, ic, col, txt, sub = '', extra = '') => `<button class="bib-mi${extra}" role="menuitem" data-acc="${acc}"><span class="bib-sq" style="--c:var(--ic-${col})">${ico(ic)}</span><span>${txt}${sub ? `<small>${sub}</small>` : ''}</span><span class="bib-ch" aria-hidden="true">${ico('chev')}</span></button>`;
    function menuHTML() {
      if (!menu) return '';
      let g = '';
      if (menu.tipo === 'fila') {
        const it = lib.items.find((x) => x.id === menu.id); if (!it) return '';
        g = borrando === it.id
          ? `<div class="bib-grp"><button class="bib-mi peligro" role="menuitem" data-acc="si-borrar"><span class="bib-sq" style="--c:var(--ic-rojo)">${ico('trash')}</span><span>Sí, borrar «${esc(it.titulo.length > 20 ? it.titulo.slice(0, 19) + '…' : it.titulo)}»</span></button>${mi('no-borrar', 'x', 'cielo', 'No borrar')}</div>`
          : `<div class="bib-grp">${mi('abrir', 'open', 'azul', 'Abrir')}${mi('seleccionar', 'sel', 'violeta', 'Seleccionar', 'para imprimir o compartir varios')}${mi('editar', 'pencil', 'naranja', 'Título y carpeta')}${mi('mover', 'move', 'cielo', 'Mover a carpeta')}${mi('fijar', 'pin', 'oro', it.fijado ? 'Quitar de fijados' : 'Fijar arriba')}</div><div class="bib-grp">${mi('imprimir', 'print', 'naranja', 'Imprimir')}${mi('pdf', 'exp', 'rosa', 'Descargar PDF')}${mi('enlace-fila', 'link', 'verde', 'Copiar enlace')}${mi('exportar', 'exp', 'cielo', 'Exportar')}${mi('borrar', 'trash', 'rojo', 'Borrar', '', ' peligro')}</div>`;
      } else if (menu.tipo === 'carpeta') {
        g = `<div class="bib-grp">${mi('sel-carpeta', 'sel', 'violeta', 'Seleccionar la carpeta')}${mi('carp-renombrar', 'pencil', 'naranja', 'Renombrar carpeta')}${mi('carp-quitar', 'folder', 'cielo', 'Quitar carpeta', 'los ejercicios se quedan sin carpeta')}</div>`;
      } else {
        const n = lib.items.length;
        g = `<div class="bib-grp">${mi('enlace', 'link', 'azul', 'Copiar enlace con estos datos')}<button class="bib-mi" role="menuitem" data-acc="sel-modo"${n ? '' : ' disabled'}><span class="bib-sq" style="--c:var(--ic-violeta)">${ico('sel')}</span><span>Seleccionar varios<small>imprimir, compartir, exportar…</small></span><span class="bib-ch" aria-hidden="true">${ico('chev')}</span></button></div>`
          + `<div class="bib-grp">${mi('copia', 'shield', 'verde', 'Copia de seguridad de todo', 'un archivo con todas tus herramientas')}${mi('restaurar', 'rest', 'violeta', 'Restaurar copia…')}</div>`
          + `<div class="bib-grp">${mi('importar', 'imp', 'cielo', 'Importar archivo…')}<button class="bib-mi" role="menuitem" data-acc="exportar-todo"${n ? '' : ' disabled'}><span class="bib-sq" style="--c:var(--ic-rosa)">${ico('exp')}</span><span>Exportar todos</span><span class="bib-ch" aria-hidden="true">${ico('chev')}</span></button></div>`;
      }
      return `<div class="bib-dim" data-acc="cierra-menu"></div><div class="bib-pop" role="menu" data-tipo="${menu.tipo}">${g}</div>`;
    }
    function posicionaMenu() {
      const pop = panel.querySelector('.bib-pop'); if (!pop) return;
      const pr = panel.getBoundingClientRect();
      let ref = null;
      if (menu.tipo === 'general') ref = panel.querySelector('.bib-h .bib-dots');
      else if (menu.tipo === 'fila') ref = [...panel.querySelectorAll('.bib-it')].find((x) => x.dataset.id === menu.id)?.querySelector('.bib-dots');
      else ref = [...panel.querySelectorAll('.bib-carpfila')].find((x) => x.dataset.carpeta === menu.carpeta)?.querySelector('.bib-dots');
      let top = ref ? ref.getBoundingClientRect().bottom - pr.top + 4 : 56; const h = pop.offsetHeight;
      if (top + h > pr.height - 10) top = Math.max(10, (ref ? ref.getBoundingClientRect().top - pr.top : pr.height) - h - 4);
      pop.style.top = top + 'px';
    }
    const itemsSel = () => lib.items.filter((x) => sel && sel.has(x.id));
    function pinta() {
      const q = norm(busca), n = lib.items.length, vis = lib.items.filter((i) => !q || norm(i.titulo + ' ' + (i.carpeta || '')).includes(q));
      const hayEj = selsEj().some((s) => s.options.length > 1);
      if (sel) pestana = 'guardados';
      if (!hayEj) pestana = 'guardados';
      const orden = (a, b) => a.titulo.localeCompare(b.titulo, 'es', { numeric: true });
      let lista = '';
      if (pestana === 'ejemplos') {
        lista = ejemplosHTML(q) || '<p class="bib-vacio">Ningún ejemplo coincide con la búsqueda.</p>';
      } else {
        const fij = vis.filter((i) => i.fijado).sort(orden), resto = vis.filter((i) => !i.fijado), sueltos = resto.filter((i) => !i.carpeta).sort(orden), carpetas = {};
        for (const i of resto) if (i.carpeta) (carpetas[i.carpeta] ||= []).push(i);
        if (fij.length) lista += `<p class="bib-sec">Fijados</p>${fij.map(fila).join('')}`;
        for (const c of Object.keys(carpetas).sort((a, b) => a.localeCompare(b, 'es'))) {
          const ab = q || !ui.cerradas[`${herramienta}/${c}`];
          lista += `<div class="bib-carpfila" data-carpeta="${esc(c)}"><button class="bib-carp" data-carpeta="${esc(c)}" aria-expanded="${!!ab}">${ico('folder')}${esc(c)}<span class="n">${carpetas[c].length}</span></button>${sel ? '' : `<button class="bib-dots" data-acc="menu-carpeta" aria-haspopup="menu" aria-expanded="${menu?.carpeta === c}" aria-label="Opciones de la carpeta ${esc(c)}" title="Opciones de la carpeta">${ico('dots')}</button>`}</div>${ab ? `<div class="bib-carpd">${carpetas[c].sort(orden).map(fila).join('')}</div>` : ''}`;
        }
        if (sueltos.length) lista += `${fij.length || Object.keys(carpetas).length ? '<p class="bib-sec">Sin carpeta</p>' : ''}${sueltos.map(fila).join('')}`;
        if (!vis.length) lista = `<p class="bib-vacio">${n ? 'Ningún ejercicio coincide con la búsqueda.' : 'Aún no has guardado ningún ejercicio. Prepara los datos y pulsa «Guardar el actual».'}</p>`;
      }
      const it = lib.items.find((x) => x.id === activo), carps = [...new Set(lib.items.map((x) => x.carpeta).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
      let f = null;
      if (form) {
        const valor = form.renombra !== undefined ? form.renombra : form.ids ? '' : form.id ? lib.items.find((x) => x.id === form.id)?.carpeta || '' : it?.carpeta || '';
        const tit = form.id ? lib.items.find((x) => x.id === form.id)?.titulo : ejemplo() || `Ejercicio ${n + 1}`;
        const chips = form.renombra !== undefined || !carps.length ? '' : `<div class="bib-chips" role="group" aria-label="Carpetas que ya tienes">${['', ...carps].map((c) => `<button type="button" class="bib-chip${c === valor ? ' on' : ''}" data-acc="carpeta-elige" data-c="${esc(c)}">${c ? esc(c) : 'Sin carpeta'}</button>`).join('')}</div>`;
        const campoT = form.renombra !== undefined || form.ids ? '' : `<label>Título<input id="bib-t" value="${esc(tit)}" maxlength="120" autocomplete="off"></label>`;
        f = `<div class="bib-form">${campoT}<label>${form.renombra !== undefined ? 'Nombre de la carpeta' : form.ids ? `Mover ${form.ids.length} ejercicio${form.ids.length === 1 ? '' : 's'} a la carpeta` : 'Carpeta (opcional)'}<input id="bib-c" value="${esc(valor)}" maxlength="60" placeholder="${form.renombra !== undefined ? '' : 'sin carpeta: o escribe un nombre para crear una nueva'}" autocomplete="off"></label>${chips}<div class="fila"><button data-acc="cancelar">Cancelar</button><button class="si" data-acc="guardar">Guardar</button></div></div>`;
      }
      const cab = sel
        ? `<div class="bib-h bib-hsel"><button class="bib-lnk" data-acc="sel-cancelar">Cancelar</button><b>${sel.size ? `${sel.size} seleccionado${sel.size === 1 ? '' : 's'}` : 'Elige ejercicios'}</b><button class="bib-lnk" data-acc="sel-todos">${vis.length && vis.every((i) => sel.has(i.id)) ? 'Ninguno' : 'Todos'}</button></div>`
        : `<div class="bib-h"><b>Mis ejercicios</b><span class="bib-n">${n}</span><button class="bib-dots" data-acc="sel-modo"${n ? '' : ' disabled'} aria-label="Seleccionar" title="Seleccionar">${ico('sel')}</button><button class="bib-dots" data-acc="menu-general" aria-haspopup="menu" aria-expanded="${menu?.tipo === 'general'}" aria-label="Más opciones" title="Más opciones: copia de seguridad, importar, seleccionar varios…">${ico('dots')}</button><button class="bib-x" data-acc="cerrar" title="Cerrar" aria-label="Cerrar Mis ejercicios">${ico('x')}</button></div>`;
      const tabs = sel || !hayEj ? '' : `<div class="bib-seg" role="tablist"><button role="tab" data-acc="pestana-guardados" aria-selected="${pestana === 'guardados'}">Guardados</button><button role="tab" data-acc="pestana-ejemplos" aria-selected="${pestana === 'ejemplos'}">Ejemplos</button></div>`;
      const cta = sel || pestana !== 'guardados' ? '' : `<div class="bib-cta"><button class="bib-prim" data-acc="nuevo">${ico('plus')} Guardar el actual</button><button class="bib-circ" data-acc="actualizar"${it ? '' : ' disabled'} aria-label="${it ? `Guardar cambios en «${esc(it.titulo)}»` : 'Guardar cambios'}" title="${it ? `Guardar los datos de ahora en «${esc(it.titulo)}»` : 'Abre o guarda antes un ejercicio'}">${ico('refresh')}</button></div>`;
      const buscar = (pestana === 'ejemplos' ? selsEj().some((s) => s.options.length > 5) : n > 3) ? `<input type="search" class="bib-busca" placeholder="${pestana === 'ejemplos' ? 'Buscar ejemplo…' : 'Buscar por título o carpeta…'}" aria-label="Buscar" value="${esc(busca)}">` : '';
      const nSel = sel ? sel.size : 0, conf = borrando === '#sel';
      const barra = sel ? `<div class="bib-selbar"><div class="bib-grp">${mi('sel-imprimir', 'print', 'naranja', `Imprimir hoja${nSel ? ` (${nSel})` : ''}`).replace('<button', nSel ? '<button' : '<button disabled')}${mi('sel-pdf', 'exp', 'rosa', `Descargar PDF${nSel ? ` (${nSel})` : ''}`).replace('<button', nSel ? '<button' : '<button disabled')}${mi('sel-enlaces', 'link', 'azul', 'Copiar enlaces').replace('<button', nSel ? '<button' : '<button disabled')}${mi('sel-exportar', 'exp', 'cielo', 'Exportar selección').replace('<button', nSel ? '<button' : '<button disabled')}${mi('sel-mover', 'move', 'verde', 'Mover a carpeta…').replace('<button', nSel ? '<button' : '<button disabled')}${conf ? `<button class="bib-mi peligro" data-acc="sel-si-borrar"><span class="bib-sq" style="--c:var(--ic-rojo)">${ico('trash')}</span><span>Sí, borrar ${nSel}</span></button>${mi('no-borrar', 'x', 'cielo', 'No borrar')}` : mi('sel-borrar', 'trash', 'rojo', 'Borrar', '', ' peligro').replace('<button', nSel ? '<button' : '<button disabled')}</div></div>` : '';
      const pie = sel || pestana !== 'guardados' ? '' : '<div class="bib-pie"><p>Se guardan en este navegador. Haz de vez en cuando una copia de seguridad (⋮ de arriba): si borras los datos del navegador, se pierden. También puedes arrastrar aquí un archivo <code>.simu.json</code>.</p></div>';
      panel.innerHTML = `${cab}${tabs}<div class="bib-acc">${cta}${f || ''}${buscar}</div><div class="bib-lista">${lista}</div>${pie}${barra}${menuHTML()}`;
      if (f) { const t = panel.querySelector('#bib-t') || panel.querySelector('#bib-c'); t.focus(); t.select(); }
      if (menu) posicionaMenu();
    }

    panel.addEventListener('click', (e) => {
      refresca();
      const car = e.target.closest('.bib-carp');
      if (car) { const k = `${herramienta}/${car.dataset.carpeta}`; ui.cerradas[k] = !ui.cerradas[k]; guardaUI(); pinta(); return; }
      const b = e.target.closest('[data-acc]'); if (!b) return;
      const dentro = !!b.closest('.bib-pop'), acc = b.dataset.acc;
      const id = b.closest('.bib-it')?.dataset.id || (dentro && menu?.id) || null, it = id && lib.items.find((x) => x.id === id);
      const carpeta = b.closest('.bib-carpfila')?.dataset.carpeta ?? menu?.carpeta;
      if (dentro && acc !== 'borrar') menu = null;
      switch (acc) {
        case 'cerrar': abre(false); btn.focus(); break;
        case 'pestana-guardados': case 'pestana-ejemplos': pestana = acc.slice(8); menu = null; pinta(); break;
        case 'menu-fila': menu = menu?.id === id ? null : { tipo: 'fila', id }; borrando = null; pinta(); break;
        case 'menu-carpeta': menu = menu?.carpeta === carpeta ? null : { tipo: 'carpeta', carpeta }; pinta(); break;
        case 'menu-general': menu = menu?.tipo === 'general' ? null : { tipo: 'general' }; pinta(); break;
        case 'cierra-menu': menu = null; borrando = null; pinta(); break;
        case 'nuevo': form = {}; pinta(); break;
        case 'actualizar': actualiza(); break;
        case 'importar': case 'restaurar': archivo.click(); break;
        case 'copia': descargaCopia(); break;
        case 'exportar-todo': descarga(nombreArchivo(nombre + ' ejercicios'), archivoDe(lib.items)); break;
        case 'enlace': copiaEnlace(); break;
        case 'imprimir': if (it) exporta([it], 'imprimir', 'menu-fila'); break;
        case 'pdf': if (it) exporta([it], 'pdf', 'menu-fila'); break;
        case 'enlace-fila': if (it) copiaEnlace(it.datos); break;
        case 'sel-modo': sel = new Set(); form = null; pestana = 'guardados'; break;
        case 'seleccionar': if (it) { sel = new Set([it.id]); form = null; } break;
        case 'sel-carpeta': sel = new Set(lib.items.filter((x) => x.carpeta === carpeta).map((x) => x.id)); form = null; break;
        case 'sel-cancelar': sel = null; borrando = null; break;
        case 'sel-todos': { const q = norm(busca), vis = lib.items.filter((i) => !q || norm(i.titulo + ' ' + (i.carpeta || '')).includes(q)); if (vis.every((i) => sel.has(i.id))) vis.forEach((i) => sel.delete(i.id)); else vis.forEach((i) => sel.add(i.id)); break; }
        case 'marcar': if (it) { if (sel.has(it.id)) sel.delete(it.id); else sel.add(it.id); pinta(); [...panel.querySelectorAll('.bib-it')].find((x) => x.dataset.id === it.id)?.querySelector('.bib-abre')?.focus(); } return;
        case 'sel-imprimir': { const its = itemsSel(); if (its.length) exporta(its, 'imprimir', 'seleccion'); break; }
        case 'sel-pdf': { const its = itemsSel(); if (its.length) exporta(its, 'pdf', 'seleccion'); break; }
        case 'sel-enlaces': { const its = itemsSel(); if (its.length) copiaEnlaces(its); break; }
        case 'sel-exportar': { const its = itemsSel(); if (its.length) descarga(nombreArchivo(nombre + ' seleccion'), archivoDe(its)); break; }
        case 'sel-mover': if (sel.size) form = { ids: [...sel] }; break;
        case 'sel-borrar': borrando = '#sel'; break;
        case 'sel-si-borrar': { const ids = sel; lib.items = lib.items.filter((x) => !ids.has(x.id)); if (ids.has(activo)) ponActivo(null); sel = null; borrando = null; guardaLib(); aviso(`${ids.size} ejercicio${ids.size === 1 ? '' : 's'} borrado${ids.size === 1 ? '' : 's'}`); break; }
        case 'guardar': guardaForm(); break;
        case 'cancelar': form = null; break;
        case 'carpeta-elige': { const inp = panel.querySelector('#bib-c'); if (inp) { inp.value = b.dataset.c; inp.focus(); } for (const c of panel.querySelectorAll('.bib-chip')) c.classList.toggle('on', c === b); return; }
        case 'carp-renombrar': form = { renombra: carpeta }; break;
        case 'carp-quitar': for (const x of lib.items) if (x.carpeta === carpeta) x.carpeta = ''; guardaLib(); aviso(`Carpeta «${carpeta}» quitada: sus ejercicios siguen en la lista`); break;
        case 'abrir': if (it) carga(it); break;
        case 'ejemplo': {
          const s = selsEj()[+b.dataset.sel]; if (!s) break;
          s.value = b.dataset.v; s.dispatchEvent(new Event('change', { bubbles: true }));
          ponActivo(null); pinta(); if (window.innerWidth < ANCHO) abre(false);
          return;
        }
        case 'fijar': if (it) { it.fijado = !it.fijado; guardaLib(); } break;
        case 'editar': if (it) form = { id }; break;
        case 'mover': if (it) form = { ids: [it.id] }; break;
        case 'exportar': if (it) descarga(nombreArchivo(it.titulo), archivoDe([it])); break;
        case 'borrar': borrando = id; pinta(); return;
        case 'no-borrar': borrando = null; break;
        case 'si-borrar': if (it) { lib.items = lib.items.filter((x) => x.id !== id); if (activo === id) ponActivo(null); borrando = null; guardaLib(); aviso('Ejercicio borrado'); } break;
      }
      pinta();
    });
    panel.addEventListener('keydown', (e) => {
      if (e.target.closest('.bib-form') && e.key === 'Enter') { e.preventDefault(); guardaForm(); }
      else if (e.key === 'Escape') { if (menu) { menu = null; borrando = null; pinta(); } else if (form) { form = null; pinta(); } else if (sel) { sel = null; pinta(); } else { abre(false); btn.focus(); } }
    });
    panel.addEventListener('input', (e) => { if (e.target.classList.contains('bib-busca')) { busca = e.target.value; const pos = e.target.selectionStart; pinta(); const s = panel.querySelector('.bib-busca'); s.focus(); s.setSelectionRange(pos, pos); } });
    panel.addEventListener('dragover', (e) => { e.preventDefault(); panel.classList.add('arrastre'); });
    panel.addEventListener('dragleave', () => panel.classList.remove('arrastre'));
    panel.addEventListener('drop', (e) => { e.preventDefault(); panel.classList.remove('arrastre'); if (e.dataTransfer.files.length) importaArchivos([...e.dataTransfer.files]); });
    archivo.addEventListener('change', () => { if (archivo.files.length) importaArchivos([...archivo.files]); archivo.value = ''; });
    btn.addEventListener('click', () => abre(!panel.classList.contains('abierta')));
    scrim.addEventListener('click', () => abre(false));
    window.addEventListener('resize', () => abre(panel.classList.contains('abierta')));

    // el ejemplo marcado sigue al <select>: las apps lo vacían al tocar un dato
    const sigue = (e) => { if (!panel.contains(e.target)) setTimeout(marcaEj); };
    document.addEventListener('change', sigue); document.addEventListener('input', sigue);
    pinta(); abre(!!ui.abierta);
    // los ejemplos están en la barra: el desplegable de «Ejemplos…» de la página sobra (diseno.js lo oculta)
    if (selsEj().some((s) => s.options.length > 1)) document.body.classList.add('bib-ejemplos');
    // Ventana de imprimir / descargar PDF (ventana-imprimir.js): ids = ejercicios (por defecto, los seleccionados o todos), accion = 'imprimir' | 'pdf', origen = desde dónde se pide
    function abrirVentanaExportar({ ids, accion = 'imprimir', origen = '' } = {}) {
      refresca();
      const its = ids && ids.length ? ids.map((id) => lib.items.find((x) => x.id === id)).filter(Boolean) : (sel && sel.size ? itemsSel() : lib.items);
      if (!its.length) { aviso('No hay ejercicios guardados que imprimir'); return; }
      if (typeof VentanaImprimir === 'undefined') { imprimeHoja(its); return; }
      sel = null; menu = null; pinta();
      VentanaImprimir.abre({ titulo: nombre, items: its, accion, origen, imprime: (op) => imprimeHoja(its, op) });
    }
    const inst = { get items() { return lib.items; }, abre, abrirVentanaExportar, importa: (t) => { const n = importa(t); guardaLib(); pinta(); return n; }, archivoDe };
    ultima = inst; return inst;
  }
  let ultima = null;
  // Biblioteca.abrirVentanaExportar({ ids, accion: 'imprimir' | 'pdf', origen }): la ventana común de imprimir y descargar PDF, desde donde sea
  const abrirVentanaExportar = (a) => (ultima ? ultima.abrirVentanaExportar(a) : null);
  return { monta, abrirVentanaExportar, FORMATO, FORMATO_COPIA, copia, restaura, migraElectro };
})();
if (typeof module !== 'undefined') module.exports = Biblioteca;
