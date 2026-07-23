import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      sub: string;
      email: string;
      role: "USER" | "ADMIN";
    };
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: "15m",
    },
  });

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({
        message: "Authentication is required.",
      });
    }
  });
};

export default fp(authPlugin, {
  name: "auth",
});
