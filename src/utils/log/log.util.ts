import type { MessagePayload, WebhookMessageCreateOptions } from "discord.js";
import { env } from "@/utils/env/env.util";
import { anyToError, defaultLogger } from "arcscord";
import { WebhookClient } from "discord.js";
import { LynxLogger as CustomLogger } from "./log.class";

/**
 * LynxLogger instance
 * @see LynxLogger
 */
export const LynxLogger = new CustomLogger();

export const webhook = new WebhookClient({
  url: env.WEBHOOK_URL,
});

export function railwayLogUrlBuilder(start: number, end: number) {
  return env.RAILWAY_LOGS_BASE_URL.replace("{:start}", start.toString()).replace(
    "{:end}",
    end.toString(),
  );
}

export async function sendLog(payload: string | MessagePayload | WebhookMessageCreateOptions): Promise<void> {
  try {
    await webhook.send(payload);
  }
  catch (e) {
    defaultLogger.warning(`Failed to send webhook : ${anyToError(e).message}`);
  }
}
