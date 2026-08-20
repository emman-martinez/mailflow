import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { attachSocketServer } from "./realtime/socket.js";

const app = buildApp();

attachSocketServer(app);

try {
  await app.listen({
    port: env.PORT,
    host: "0.0.0.0",
  });
} catch (error) {
  app.log.error(error, "Failed to start API server");
  process.exit(1);
}
