import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { campaignRoutes } from "./modules/campaigns/campaign.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import authPlugin from "./plugins/auth.js";
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
  app.register(authPlugin);

  app.register(healthRoutes, { prefix: "/api" });
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(campaignRoutes, { prefix: "/api/campaigns" });
  app.register(dashboardRoutes, { prefix: "/api/dashboard" });

  return app;
}
