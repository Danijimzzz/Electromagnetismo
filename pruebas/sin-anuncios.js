/* Las pruebas no cargan nada de Google AdSense (fuente/anuncios.js): sus peticiones reciben un script vacío,
   así que no hay errores de red en la consola ni anuncios que muevan la página. Envuelve el navegador:
     const browser = sinAnuncios(await chromium.launch(…)); */
const GOOGLE = /googlesyndication\.com|fundingchoicesmessages\.google\.com|googleadservices\.com|doubleclick\.net/;
const vacio = (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
module.exports = (browser) => {
  const pagina = browser.newPage.bind(browser), contexto = browser.newContext.bind(browser);
  browser.newPage = async (o) => { const p = await pagina(o); await p.route(GOOGLE, vacio); return p; };
  browser.newContext = async (o) => { const c = await contexto(o); await c.route(GOOGLE, vacio); return c; };
  return browser;
};
