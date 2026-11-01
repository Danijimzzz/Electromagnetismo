/* =====================================================================
   Simulador de circuitos · importa lo guardado con las herramientas antiguas
   (Circuitos de continua, Corriente alterna y Mis ejercicios de ambas), que
   escribían el circuito como lista de elementos entre nudos con nombre.
   Cada elemento se coloca suelto con una etiqueta de nudo en cada patilla
   (el nudo 0 lleva una tierra): el esquema es correcto aunque no esté
   dibujado con gracia, y se puede recolocar. Transitorios no se importa.
   Va en scripts antes de app.js; la prueba está en pruebas/herramientas/simulador.js.
   ===================================================================== */
const ImportarSim = (() => {
  const TIPOS = { R: 'R', C: 'C', L: 'L', V: 'V', I: 'I' };
  // un estado antiguo ({elementos, f?}) → { sc, omitidos }
  function aEsquema(viejo, alterna) {
    const els = (viejo && viejo.elementos || []).filter((e) => e && e.a !== undefined && e.b !== undefined), cuenta = {}, comps = [], cables = [];
    let omitidos = 0, n = 0, g = 0;
    els.forEach((e) => {
      const t = TIPOS[e.t]; if (!t || !String(e.v ?? '').trim()) { omitidos++; return; }
      const letra = CompSim.C[t].letra; cuenta[letra] = (cuenta[letra] || 0) + 1;
      const y = 3 + 5 * comps.filter((c) => TIPOS[c.t]).length, id = `${letra}${cuenta[letra]}`, v = { ...CompSim.vacio(t) };
      if (t === 'R') v.R = e.v; else if (t === 'C') v.C = e.v; else if (t === 'L') v.L = e.v;
      else if (alterna && t === 'V') Object.assign(v, { forma: 'seno', A: e.v, eficaz: 'eficaz', f: String(viejo.f || '50'), fase: String(e.fase || 0) });
      else Object.assign(v, { forma: 'cc', v: e.v });
      comps.push({ id, t, x: 10, y, rot: 0, espejo: false, v });
      [e.a, e.b].forEach((nudo, k) => {
        const x = k ? 14 : 10;
        if (String(nudo) === '0') comps.push({ id: `GND${++g}`, t: 'GND', x, y, rot: 0, espejo: false, v: { ...CompSim.vacio('GND') } });
        else comps.push({ id: `N${++n}`, t: 'ETIQ', x, y, rot: k ? 0 : 2, espejo: false, v: { ...CompSim.vacio('ETIQ'), nombre: String(nudo) } });
      });
    });
    return { sc: { version: 2, componentes: comps, cables, analisis: {}, vista: null }, omitidos };
  }
  // copia a las claves nuevas lo que haya de las antiguas (una sola vez); devuelve un aviso o ''
  function migra() {
    try {
      if (localStorage.getItem('simulador-importado')) return '';
      localStorage.setItem('simulador-importado', '1');
      let aviso = '';
      const conv = (txt, alterna) => { try { const r = aEsquema(JSON.parse(txt), alterna); return r.sc.componentes.length ? r : null; } catch (e) { return null; } };
      // el circuito que había en pantalla (solo si aún no se ha usado el simulador)
      if (!localStorage.getItem('simulador-v1')) {
        for (const [clave, alt] of [['circuitos-v1', false], ['alterna-v1', true]]) {
          const t = localStorage.getItem(clave), r = t && conv(t, alt);
          if (r) { localStorage.setItem('simulador-v1', JSON.stringify(r.sc)); aviso = `Se ha traído al simulador tu último circuito de ${alt ? 'Corriente alterna' : 'Circuitos de continua'}${r.omitidos ? ` (sin ${r.omitidos} elemento${r.omitidos > 1 ? 's' : ''} que no se puede importar)` : ''}.`; break; }
        }
      }
      // Mis ejercicios guardados con las antiguas
      const nuevos = [];
      for (const [carpeta, alt] of [['circuitos', false], ['alterna', true]]) {
        let lib; try { lib = JSON.parse(localStorage.getItem(`simu-ejercicios:${carpeta}`)); } catch (e) { lib = null; }
        for (const it of (lib && lib.items) || []) { const r = conv(it.datos, alt); if (r) nuevos.push({ ...it, id: `imp-${carpeta}-${it.id}`, carpeta: it.carpeta || (alt ? 'Corriente alterna' : 'Circuitos de continua'), datos: JSON.stringify(r.sc), actualizado: it.actualizado }); }
      }
      if (nuevos.length) {
        let nu; try { nu = JSON.parse(localStorage.getItem('simu-ejercicios:simulador')); } catch (e) { nu = null; }
        nu = nu && Array.isArray(nu.items) ? nu : { items: [] };
        nu.items.push(...nuevos); localStorage.setItem('simu-ejercicios:simulador', JSON.stringify(nu));
        aviso += `${aviso ? ' ' : ''}Se han traído ${nuevos.length} ejercicio${nuevos.length > 1 ? 's' : ''} de Mis ejercicios.`;
      }
      return aviso;
    } catch (e) { return ''; }
  }
  return { aEsquema, migra };
})();
if (typeof module !== 'undefined') module.exports = ImportarSim;
