import { emailProvider } from "./lib/mailer.js";
import { Worker } from "bullmq";
import { JOB_EVENTS_CHANNEL, type JobStatusEvent } from "./realtime/events.js";
import { EMAIL_QUEUE_NAME, type EmailQueueJobData } from "./email.queue.js";
import { prisma } from "./lib/prisma.js";
import { eventPublisher, redisConnection } from "./lib/redis.js";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown worker error.";
}

async function publishJobStatus(
  event: Omit<JobStatusEvent, "type" | "updatedAt">,
): Promise<void> {
  const payload: JobStatusEvent = {
    type: "email_job_updated",
    ...event,
    updatedAt: new Date().toISOString(),
  };

  try {
    await eventPublisher.publish(JOB_EVENTS_CHANNEL, JSON.stringify(payload));
  } catch (error) {
    console.error({
      event: "realtime_publish_failed",
      message: getErrorMessage(error),
      emailJobId: event.emailJobId,
    });
  }
}

const worker = new Worker<EmailQueueJobData>(
  EMAIL_QUEUE_NAME,
  async (job) => {
    const attemptNumber = job.attemptsMade + 1;

    console.info({
      event: "email_job_started",
      bullmqJobId: job.id,
      emailJobId: job.data.emailJobId,
      recipientEmail: job.data.recipientEmail,
      attemptNumber,
    });

    await prisma.$transaction(async (transaction) => {
      await transaction.emailJob.update({
        where: {
          id: job.data.emailJobId,
        },
        data: {
          status: "ACTIVE",
          attemptsMade: attemptNumber,
          processedAt: new Date(),
          failureReason: null,
        },
      });

      await transaction.campaign.update({
        where: {
          id: job.data.campaignId,
        },
        data: {
          status: "PROCESSING",
        },
      });
    });

    await publishJobStatus({
      emailJobId: job.data.emailJobId,
      campaignId: job.data.campaignId,
      status: "ACTIVE",
      attemptsMade: attemptNumber,
    });

    try {
      await emailProvider.send({
        to: job.data.recipientEmail,
        subject: job.data.subject,
        text: job.data.body,
      });

      await prisma.emailJob.update({
        where: {
          id: job.data.emailJobId,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          failureReason: null,
        },
      });

      await publishJobStatus({
        emailJobId: job.data.emailJobId,
        campaignId: job.data.campaignId,
        status: "COMPLETED",
        attemptsMade: attemptNumber,
      });

      const unfinishedJobCount = await prisma.emailJob.count({
        where: {
          campaignId: job.data.campaignId,
          status: {
            not: "COMPLETED",
          },
        },
      });

      if (unfinishedJobCount === 0) {
        await prisma.campaign.update({
          where: {
            id: job.data.campaignId,
          },
          data: {
            status: "COMPLETED",
          },
        });
      }

      console.info({
        event: "email_job_completed",
        bullmqJobId: job.id,
        emailJobId: job.data.emailJobId,
      });

      return {
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      const failureReason = getErrorMessage(error);
      const maximumAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = attemptNumber >= maximumAttempts;

      await prisma.emailJob.update({
        where: {
          id: job.data.emailJobId,
        },
        data: {
          status: isFinalAttempt ? "FAILED" : "RETRYING",
          attemptsMade: attemptNumber,
          failureReason,
        },
      });

      await publishJobStatus({
        emailJobId: job.data.emailJobId,
        campaignId: job.data.campaignId,
        status: isFinalAttempt ? "FAILED" : "RETRYING",
        attemptsMade: attemptNumber,
      });

      if (isFinalAttempt) {
        await prisma.campaign.update({
          where: {
            id: job.data.campaignId,
          },
          data: {
            status: "FAILED",
          },
        });
      }

      console.error({
        event: "email_job_failed",
        bullmqJobId: job.id,
        emailJobId: job.data.emailJobId,
        attemptNumber,
        failureReason,
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);

worker.on("error", (error) => {
  console.error({
    event: "worker_error",
    message: getErrorMessage(error),
  });
});

console.info(
  `Mailflow worker is listening to the "${EMAIL_QUEUE_NAME}" queue.`,
);

async function shutdown(signal: string): Promise<void> {
  console.info(`Received ${signal}. Closing worker gracefully...`);

  await worker.close();
  await eventPublisher.quit();
  await redisConnection.quit();
  await prisma.$disconnect();

  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
