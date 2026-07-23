import type { FastifyPluginAsync } from "fastify";
import argon2 from "argon2";
import { loginBodySchema, registerBodySchema } from "./auth.schemas.js";

function publicUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    const parsed = registerBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid registration data.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const existingUser = await app.prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      return reply.code(409).send({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await argon2.hash(parsed.data.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const user = await app.prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
      },
    });

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    app.log.info({ userId: user.id }, "User registered");

    return reply.code(201).send({
      user: publicUser(user),
      token,
    });
  });

  app.post("/login", async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        message: "Invalid login data.",
      });
    }

    const user = await app.prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    const isPasswordValid =
      user !== null &&
      (await argon2.verify(user.passwordHash, parsed.data.password));

    if (!isPasswordValid || !user) {
      return reply.code(401).send({
        message: "Invalid email or password.",
      });
    }

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    app.log.info({ userId: user.id }, "User logged in");

    return {
      user: publicUser(user),
      token,
    };
  });

  app.get(
    "/me",
    {
      onRequest: [app.authenticate],
    },
    async (request, reply) => {
      const user = await app.prisma.user.findUnique({
        where: { id: request.user.sub },
      });

      if (!user) {
        return reply.code(401).send({
          message: "User no longer exists.",
        });
      }

      return {
        user: publicUser(user),
      };
    },
  );
};
