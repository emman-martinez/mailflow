import { z } from "zod";

const passwordSchema = z.string().min(12).max(128);

export const registerBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  name: z.string().trim().min(1).max(80).optional(),
  password: passwordSchema,
});

export const loginBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: passwordSchema,
});
