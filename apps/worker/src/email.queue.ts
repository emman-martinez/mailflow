export const EMAIL_QUEUE_NAME = "email-delivery";

export type EmailQueueJobData = {
  emailJobId: string;
  campaignId: string;
  recipientEmail: string;
  subject: string;
  body: string;
};
