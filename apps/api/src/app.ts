import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import prismaPlugin from "./plugins/prisma.js";
import { healthRoutes } from "./routes/health.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
  });

  app.register(cors, {
    origin: env.WEB_ORIGIN,
  });

  app.register(prismaPlugin);
  app.register(healthRoutes, { prefix: "/api" });

  return app;
}
