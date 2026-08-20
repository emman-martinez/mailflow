import type { FastifyInstance } from "fastify";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";

export function attachSocketServer(app: FastifyInstance) {
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: env.WEB_ORIGIN,
    },
  });

  /* Handle socket connections */

  // io.on is used to listen for incoming socket connections.
  // When a client connects, the provided callback function is executed with the connected socket as an argument.
  // Inside this callback, we log the connection event,
  // emit a "realtime:ready" event to the client with the current timestamp,
  // and set up a listener for the "disconnect" event to log when the client disconnects and the reason for disconnection.
  io.on("connection", (socket) => {
    app.log.info(
      {
        socketId: socket.id,
      },
      "Realtime client connected",
    );

    socket.emit("realtime:ready", {
      connectedAt: new Date().toISOString(),
    });

    socket.on("disconnect", (reason) => {
      app.log.info(
        {
          socketId: socket.id,
          reason,
        },
        "Realtime client disconnected",
      );
    });
  });

  return io;
}
