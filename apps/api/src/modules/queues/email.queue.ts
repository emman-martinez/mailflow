import { Queue } from "bullmq";
import { redisConnection } from "../../lib/redis.js";

export const EMAIL_QUEUE_NAME = "email-delivery";

export type EmailQueueJobData = {
  emailJobId: string;
  campaignId: string;
  recipientEmail: string;
  subject: string;
  body: string;
};

export const emailQueue = new Queue<EmailQueueJobData>(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5_000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24 * 7,
      count: 1_000,
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 30,
    },
  },
});
