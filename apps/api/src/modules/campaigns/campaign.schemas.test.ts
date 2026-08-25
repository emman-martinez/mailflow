import { describe, expect, it } from "vitest";
import { createCampaignBodySchema } from "./campaign.schemas.js";

describe("createCampaignBodySchema", () => {
  it("normalizes recipients and applies the UTC default", () => {
    const result = createCampaignBodySchema.parse({
      name: "Product update",
      subject: "New features",
      body: "Here are our latest features.",
      recipients: [" FIRST@EXAMPLE.COM ", "SECOND@EXAMPLE.COM"],
    });

    expect(result.recipients).toEqual([
      "first@example.com",
      "second@example.com",
    ]);

    expect(result.timezone).toBe("UTC");
  });

  it("rejects an empty recipient list", () => {
    const result = createCampaignBodySchema.safeParse({
      name: "Product update",
      subject: "New features",
      body: "Here are our latest features.",
      recipients: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid scheduled date", () => {
    const result = createCampaignBodySchema.safeParse({
      name: "Product update",
      subject: "New features",
      body: "Here are our latest features.",
      recipients: ["user@example.com"],
      scheduledAt: "tomorrow",
    });

    expect(result.success).toBe(false);
  });
});
