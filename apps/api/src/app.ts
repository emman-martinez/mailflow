import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { campaignRoutes } from "./modules/campaigns/campaign.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import authPlugin from "./plugins/auth.js";
import prismaPlugin from "./plugins/prisma.js";
import { healthRoutes } from "./routes/health.js";

function getErrorStatusCode(error: unknown): number {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return 500;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown server error.";
}

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

  app.setErrorHandler((error, request, reply) => {
    const statusCode = getErrorStatusCode(error);

    request.log.error(
      {
        err: error,
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode,
      },
      "Request failed",
    );

    if (reply.sent) {
      return;
    }

    return reply.status(statusCode).send({
      message:
        statusCode >= 500 ? "Internal server error." : getErrorMessage(error),
      requestId: request.id,
    });
  });

  return app;
}
