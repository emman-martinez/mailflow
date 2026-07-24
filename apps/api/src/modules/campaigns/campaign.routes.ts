import type { FastifyPluginAsync } from "fastify";
import {
  campaignIdParamsSchema,
  createCampaignBodySchema,
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
        status: campaign.status,
        scheduledAt: campaign.scheduledAt,
        timezone: campaign.timezone,
        createdAt: campaign.createdAt,
        jobCount: campaign._count.jobs,
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
