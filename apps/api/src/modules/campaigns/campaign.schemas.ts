import { z } from "zod";

export const createCampaignBodySchema = z.object({
  name: z.string().trim().min(3).max(120),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10_000),
  recipients: z
    .array(z.string().trim().email().toLowerCase())
    .min(1)
    .max(1_000),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().trim().min(1).max(100).default("UTC"),
});

export const campaignIdParamsSchema = z.object({
  campaignId: z.string().cuid(),
});
