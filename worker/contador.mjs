/* =====================================================================
   Contador de visitas de Ciencify (Cloudflare Worker + D1): sirve publico/ como siempre y, solo en
   /api/*, cuenta cuántas veces se abre cada herramienta para poner la llama 🔥 a la más usada de
   cada asignatura (fuente/llama.js). Solo guarda «mes, herramienta, número de visitas»: ni IP, ni
   cookies, ni identificadores, ni qué hace cada persona dentro de la herramienta.
     POST /api/visita       cuerpo {"r":"<asignatura>/<herramienta>"}: suma una visita (204)
     GET  /api/populares    { "<asignatura>": "<asignatura>/<herramienta>" } con la más usada de
                            este mes y el anterior (hacen falta MINIMO visitas; si no, esa asignatura no sale)
   Los datos válidos (rutas y orígenes) los escribe portal.js en worker/rutas.mjs desde catalogo.js.
   Base de datos D1 «ciencify-visitas», enlazada como VISITAS en wrangler.jsonc:
     CREATE TABLE visitas (mes TEXT NOT NULL, ruta TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (mes, ruta)) WITHOUT ROWID
   ===================================================================== */
import { RUTAS, ORIGENES } from './rutas.mjs';

export const MINIMO = 10;
const meses = (ahora = new Date()) => {
  const mes = (d) => d.toISOString().slice(0, 7), ant = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1));
  return [mes(ahora), mes(ant)];
};
const cors = (extra = {}) => ({ 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', ...extra });

export async function suma(db, ruta, ahora) {
  await db.prepare('INSERT INTO visitas (mes, ruta, n) VALUES (?, ?, 1) ON CONFLICT (mes, ruta) DO UPDATE SET n = n + 1').bind(meses(ahora)[0], ruta).run();
}
export async function populares(db, ahora) {
  const [a, b] = meses(ahora);
  const { results } = await db.prepare('SELECT ruta, SUM(n) AS n FROM visitas WHERE mes IN (?, ?) GROUP BY ruta').bind(a, b).all();
  const top = {};
  for (const { ruta, n } of results) {
    const asig = ruta.split('/')[0];
    if (!RUTAS.includes(ruta) || n < MINIMO) continue;
    if (!top[asig] || n > top[asig].n || (n === top[asig].n && ruta < top[asig].ruta)) top[asig] = { ruta, n };
  }
  return Object.fromEntries(Object.entries(top).map(([k, v]) => [k, v.ruta]));
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors({ 'access-control-max-age': '86400' }) });
    if (url.pathname === '/api/populares' && req.method === 'GET') {
      try { return new Response(JSON.stringify(await populares(env.VISITAS)), { headers: cors({ 'content-type': 'application/json', 'cache-control': 'public, max-age=600' }) }); }
      catch (e) { return new Response('{}', { status: 200, headers: cors({ 'content-type': 'application/json', 'cache-control': 'no-store' }) }); }
    }
    if (url.pathname === '/api/visita' && req.method === 'POST') {
      // solo desde la propia web y solo herramientas que existen
      if (!ORIGENES.includes(req.headers.get('origin') || '')) return new Response(null, { status: 204, headers: cors() });
      let r = ''; try { r = String(JSON.parse(await req.text()).r || ''); } catch (e) { /* cuerpo roto */ }
      if (RUTAS.includes(r)) { const p = suma(env.VISITAS, r).catch(() => {}); if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p; }
      return new Response(null, { status: 204, headers: cors() });
    }
    return new Response('No encontrado', { status: 404, headers: cors() });
  },
};
