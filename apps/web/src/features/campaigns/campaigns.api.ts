import { apiClient } from "../../lib/api/client";

export type CreateCampaignInput = {
  name: string;
  subject: string;
  body: string;
  recipients: string[];
  scheduledAt?: string;
  timezone: string;
};

export async function createCampaign(input: CreateCampaignInput) {
  const response = await apiClient.post("/api/campaigns", input);

  return response.data;
}
