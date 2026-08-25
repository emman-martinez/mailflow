import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { emailQueue } from "./modules/queues/email.queue.js";
import { redisConnection } from "./lib/redis.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await emailQueue.close();
  await redisConnection.quit();
});

describe("API integration", () => {
  it("rejects unauthenticated campaign requests", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/campaigns",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: "Authentication is required.",
    });
  });

  it("rejects invalid registration data", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "invalid-email",
        password: "short",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe("Invalid registration data.");
  });

  it("rejects invalid login data", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "invalid-email",
        password: "short",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe("Invalid login data.");
  });
});
