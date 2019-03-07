import * as http from "http";
import app from "./app";
import { onError, normalizePort, onListening } from "./utils/utils";

import db from "./models";

const server = http.createServer(app);
const port = normalizePort(process.env.port || 3000);

db.sequelize.sync().then(() => {
  server.listen(port);
  server.on("error", onError(server));
  server.once("listening", onListening(server));
});
