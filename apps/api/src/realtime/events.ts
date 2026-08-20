import type { FastifyInstance } from "fastify";
import type { Server as SocketIOServer } from "socket.io";
import { redisConnection } from "../lib/redis.js";

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

export async function startRealtimeEventBridge(
  app: FastifyInstance,
  io: SocketIOServer,
) {
  // A Pub/Sub subscriber needs its own Redis connection.
  const subscriber = redisConnection.duplicate();

  subscriber.on("error", (error) => {
    app.log.error(error, "Realtime Redis subscriber error");
  });

  subscriber.on("message", (channel, payload) => {
    app.log.info(
      {
        channel,
        payload,
      },
      "Redis realtime message received",
    );

    if (channel !== JOB_EVENTS_CHANNEL) {
      return;
    }

    try {
      const event = JSON.parse(payload) as JobStatusEvent;

      io.emit(event.type, event);

      app.log.info(
        {
          eventType: event.type,
          emailJobId: event.emailJobId,
          connectedClients: io.sockets.sockets.size,
        },
        "Realtime event broadcast",
      );
    } catch (error) {
      app.log.error(error, "Invalid realtime event payload");
    }
  });

  await subscriber.subscribe(JOB_EVENTS_CHANNEL);

  app.log.info(
    {
      channel: JOB_EVENTS_CHANNEL,
    },
    "Realtime Redis event bridge started",
  );

  return subscriber;
}
