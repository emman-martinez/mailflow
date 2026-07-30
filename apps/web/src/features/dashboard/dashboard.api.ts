import { apiClient } from "../../lib/api/client";

export type EmailJobStatus =
  | "WAITING"
  | "ACTIVE"
  | "RETRYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export type DashboardOverview = {
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
  };
  emailJobs: {
    total: number;
    byStatus: Partial<Record<EmailJobStatus, number>>;
  };
  recentJobs: Array<{
    id: string;
    recipientEmail: string;
    status: EmailJobStatus;
    attemptsMade: number;
    maxAttempts: number;
    failureReason: string | null;
    createdAt: string;
    updatedAt: string;
    campaign: {
      id: string;
      name: string;
    };
  }>;
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await apiClient.get<DashboardOverview>(
    "/api/dashboard/overview",
  );

  return response.data;
}
