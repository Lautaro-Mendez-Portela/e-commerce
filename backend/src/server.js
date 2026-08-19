const app = require("./app");
const env = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`Servidor corriendo en puerto ${env.port}`);
});

server.on("error", (error) => {
  console.error(`No se pudo iniciar el servidor: ${error.message}`);
  process.exit(1);
});
