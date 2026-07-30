import type { FastifyPluginAsync } from "fastify";
import { emailQueue } from "../queues/email.queue.js";
import {
  campaignIdParamsSchema,
  createCampaignBodySchema,
  emailJobParamsSchema,
} from "./campaign.schemas.js";

export const campaignRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate);

  app.post("/", async (request, reply) => {
    const parsedBody = createCampaignBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        message: "Invalid campaign data.",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const recipients = [...new Set(parsedBody.data.recipients)];
    const status = parsedBody.data.scheduledAt ? "SCHEDULED" : "DRAFT";

    const campaign = await app.prisma.$transaction(async (transaction) => {
      const createdCampaign = await transaction.campaign.create({
        data: {
          name: parsedBody.data.name,
          subject: parsedBody.data.subject,
          body: parsedBody.data.body,
          status,
          scheduledAt: parsedBody.data.scheduledAt
            ? new Date(parsedBody.data.scheduledAt)
            : undefined,
          timezone: parsedBody.data.timezone,
          ownerId: request.user.sub,
          jobs: {
            create: recipients.map((recipientEmail) => ({
              recipientEmail,
              maxAttempts: 3,
            })),
          },
        },
        include: {
          jobs: {
            select: {
              id: true,
              recipientEmail: true,
            },
          },
          _count: {
            select: {
              jobs: true,
            },
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          action: "CAMPAIGN_CREATED",
          entityType: "Campaign",
          entityId: createdCampaign.id,
          actorId: request.user.sub,
          metadata: {
            recipientCount: recipients.length,
            status,
          },
        },
      });

      return createdCampaign;
    });

    const delay = campaign.scheduledAt
      ? Math.max(campaign.scheduledAt.getTime() - Date.now(), 0)
      : undefined;

    const queuedJobs = await emailQueue.addBulk(
      campaign.jobs.map((job) => ({
        name: "send-email",
        data: {
          emailJobId: job.id,
          campaignId: campaign.id,
          recipientEmail: job.recipientEmail,
          subject: campaign.subject,
          body: campaign.body,
        },
        opts: {
          jobId: job.id,
          delay,
        },
      })),
    );

    await app.prisma.$transaction(async (transaction) => {
      await Promise.all(
        queuedJobs.map((queuedJob) =>
          transaction.emailJob.update({
            where: {
              id: queuedJob.data.emailJobId,
            },
            data: {
              bullmqJobId: queuedJob.id,
            },
          }),
        ),
      );

      await transaction.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: campaign.scheduledAt ? "SCHEDULED" : "QUEUED",
        },
      });

      await transaction.auditLog.create({
        data: {
          action: "CAMPAIGN_ENQUEUED",
          entityType: "Campaign",
          entityId: campaign.id,
          actorId: request.user.sub,
          metadata: {
            queueName: "email-delivery",
            jobCount: queuedJobs.length,
          },
        },
      });
    });

    app.log.info(
      {
        campaignId: campaign.id,
        userId: request.user.sub,
        recipientCount: recipients.length,
      },
      "Campaign created",
    );

    return reply.code(201).send({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.scheduledAt ? "SCHEDULED" : "QUEUED",
        scheduledAt: campaign.scheduledAt,
        timezone: campaign.timezone,
        createdAt: campaign.createdAt,
        jobCount: campaign._count.jobs,
        queueJobCount: queuedJobs.length,
      },
    });
  });

  app.get("/", async (request) => {
    const campaigns = await app.prisma.campaign.findMany({
      where: {
        ownerId: request.user.sub,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    return {
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt,
        timezone: campaign.timezone,
        createdAt: campaign.createdAt,
        jobCount: campaign._count.jobs,
      })),
    };
  });

  app.post("/:campaignId/jobs/:emailJobId/retry", async (request, reply) => {
    const parsedParams = emailJobParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return reply.code(400).send({
        message: "Invalid campaign or email job ID.",
      });
    }

    const { campaignId, emailJobId } = parsedParams.data;

    const emailJob = await app.prisma.emailJob.findFirst({
      where: {
        id: emailJobId,
        campaignId,
        campaign: {
          ownerId: request.user.sub,
        },
      },
      include: {
        campaign: true,
      },
    });

    if (!emailJob) {
      return reply.code(404).send({
        message: "Email job not found.",
      });
    }

    if (emailJob.status !== "FAILED") {
      return reply.code(409).send({
        message: "Only failed email jobs can be requeued.",
      });
    }

    const reservedJob = await app.prisma.emailJob.updateMany({
      where: {
        id: emailJob.id,
        status: "FAILED",
      },
      data: {
        status: "RETRYING",
      },
    });

    if (reservedJob.count === 0) {
      return reply.code(409).send({
        message: "This email job is already being requeued.",
      });
    }

    const bullmqJobId = `retry-${emailJob.id}-${Date.now()}`;

    try {
      await emailQueue.add(
        "send-email",
        {
          emailJobId: emailJob.id,
          campaignId: emailJob.campaignId,
          recipientEmail: emailJob.recipientEmail,
          subject: emailJob.campaign.subject,
          body: emailJob.campaign.body,
        },
        {
          jobId: bullmqJobId,
        },
      );
    } catch (error) {
      await app.prisma.emailJob.update({
        where: {
          id: emailJob.id,
        },
        data: {
          status: "FAILED",
        },
      });

      throw error;
    }

    await app.prisma.$transaction(async (transaction) => {
      await transaction.emailJob.update({
        where: {
          id: emailJob.id,
        },
        data: {
          status: "WAITING",
          bullmqJobId,
          attemptsMade: 0,
          failureReason: null,
          processedAt: null,
          completedAt: null,
        },
      });

      await transaction.campaign.update({
        where: {
          id: emailJob.campaignId,
        },
        data: {
          status: "QUEUED",
        },
      });

      await transaction.auditLog.create({
        data: {
          action: "EMAIL_JOB_REQUEUED",
          entityType: "EmailJob",
          entityId: emailJob.id,
          actorId: request.user.sub,
          metadata: {
            campaignId: emailJob.campaignId,
            previousBullmqJobId: emailJob.bullmqJobId,
            newBullmqJobId: bullmqJobId,
          },
        },
      });
    });

    app.log.info(
      {
        campaignId: emailJob.campaignId,
        emailJobId: emailJob.id,
        bullmqJobId,
        userId: request.user.sub,
      },
      "Failed email job requeued",
    );

    return reply.code(202).send({
      emailJob: {
        id: emailJob.id,
        status: "WAITING",
        bullmqJobId,
        attemptsMade: 0,
      },
    });
  });

  app.get("/:campaignId", async (request, reply) => {
    const parsedParams = campaignIdParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return reply.code(400).send({
        message: "Invalid campaign ID.",
      });
    }

    const campaign = await app.prisma.campaign.findFirst({
      where: {
        id: parsedParams.data.campaignId,
        ownerId: request.user.sub,
      },
      include: {
        jobs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!campaign) {
      return reply.code(404).send({
        message: "Campaign not found.",
      });
    }

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        body: campaign.body,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt,
        timezone: campaign.timezone,
        createdAt: campaign.createdAt,
        jobs: campaign.jobs,
      },
    };
  });
};
