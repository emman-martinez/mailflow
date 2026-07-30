import type { FastifyPluginAsync } from "fastify";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate);

  app.get("/overview", async (request) => {
    const [campaignStatusGroups, emailJobStatusGroups, recentJobs] =
      await Promise.all([
        app.prisma.campaign.groupBy({
          by: ["status"],
          where: {
            ownerId: request.user.sub,
          },
          _count: {
            _all: true,
          },
        }),
        app.prisma.emailJob.groupBy({
          by: ["status"],
          where: {
            campaign: {
              ownerId: request.user.sub,
            },
          },
          _count: {
            _all: true,
          },
        }),
        app.prisma.emailJob.findMany({
          where: {
            campaign: {
              ownerId: request.user.sub,
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 10,
          include: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      ]);

    const campaignStatusCounts = Object.fromEntries(
      campaignStatusGroups.map((group) => [group.status, group._count._all]),
    );

    const emailJobStatusCounts = Object.fromEntries(
      emailJobStatusGroups.map((group) => [group.status, group._count._all]),
    );

    const totalCampaigns = campaignStatusGroups.reduce(
      (total, group) => total + group._count._all,
      0,
    );

    const totalEmailJobs = emailJobStatusGroups.reduce(
      (total, group) => total + group._count._all,
      0,
    );

    return {
      campaigns: {
        total: totalCampaigns,
        byStatus: campaignStatusCounts,
      },
      emailJobs: {
        total: totalEmailJobs,
        byStatus: emailJobStatusCounts,
      },
      recentJobs: recentJobs.map((job) => ({
        id: job.id,
        recipientEmail: job.recipientEmail,
        status: job.status,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.maxAttempts,
        failureReason: job.failureReason,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        campaign: job.campaign,
      })),
    };
  });
};
