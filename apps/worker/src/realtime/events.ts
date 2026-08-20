export const JOB_EVENTS_CHANNEL = "mailflow:job-events";

export type JobStatusEvent = {
  type: "email_job_updated";
  emailJobId: string;
  campaignId: string;
  status:
    | "WAITING"
    | "ACTIVE"
    | "RETRYING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELED";
  attemptsMade: number;
  updatedAt: string;
};
