import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { attachSocketServer } from "./realtime/socket.js";
import { startRealtimeEventBridge } from "./realtime/events.js";

const app = buildApp();
const io = attachSocketServer(app);

try {
  await startRealtimeEventBridge(app, io);

  await app.listen({
    port: env.PORT,
    host: "0.0.0.0",
  });
} catch (error) {
  app.log.error(error, "Failed to start API server");
  process.exit(1);
}
