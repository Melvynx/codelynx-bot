import { defaultLogger } from "arcscord";
import Fastify from "fastify";
import { webhookPayloadSchema } from "@/utils/server/server.zod";
import { env } from "@/utils/env/env.util";

const server = Fastify({
  logger: false,
});

server.post("/api/webhooks/codeline", (req, res) => {
  const data = webhookPayloadSchema.parse(req.body);

  if (data.secret !== env.CODELINE_WEBHOOK_SECRET) {
    return res.status(401).send({
      ok: false,
    });
  }

  if (data.type === "purchase") {
    //TODO handleUpdate
    return res.status(201).send({
      ok: true,
    })
  }
  if (data.type === "refund") {
    //TODO handleRefund
    return res.status(201).send({
      ok: true,
    });
  }
});

void server.listen({
  port: 3000,
}, (err) => {
  defaultLogger.fatal(err?.message || "Failed run fastify");
});
