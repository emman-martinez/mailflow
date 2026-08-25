import { describe, expect, it } from "vitest";
import { loginBodySchema, registerBodySchema } from "./auth.schemas.js";

describe("registerBodySchema", () => {
  it("normalizes the email and name", () => {
    const result = registerBodySchema.parse({
      email: "  DEMO@EXAMPLE.COM ",
      name: "  Demo User  ",
      password: "VeryStrongPassword123!",
    });

    expect(result).toEqual({
      email: "demo@example.com",
      name: "Demo User",
      password: "VeryStrongPassword123!",
    });
  });

  it("rejects passwords shorter than 12 characters", () => {
    const result = registerBodySchema.safeParse({
      email: "demo@example.com",
      name: "Demo User",
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});

describe("loginBodySchema", () => {
  it("rejects an invalid email", () => {
    const result = loginBodySchema.safeParse({
      email: "not-an-email",
      password: "VeryStrongPassword123!",
    });

    expect(result.success).toBe(false);
  });
});
