/* Ayudante de las pruebas de los fenómenos que se abren en el Simulador de circuitos: carga en Node el esquema, los componentes,
   el motor y el extractor, y calcula un esquema guardado (el que escribe el fenómeno) para comprobar sus resultados a mano. */
module.exports = (path, fuente) => {
  global.Herramienta = require(path.join(fuente, 'herramienta.js')); global.Esquema = require(path.join(fuente, 'esquema.js')); global.CompSim = require(path.join(fuente, 'simulador', 'componentes.js'));
  const Motor = global.SimCircuitos = require(path.join(fuente, 'simulador', 'motor.js')), Extraer = require(path.join(fuente, 'simulador', 'extraer.js'));
  return { Motor, calcula: (sc) => { const x = Extraer.extraer(sc); return { x, op: Motor.operacion(x.net), V: (id, n) => Motor.operacion(x.net).V[x.pinNet[id][n]] }; }, extrae: Extraer.extraer };
};
