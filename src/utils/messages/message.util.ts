import type { ArcClient, Result } from "arcscord";
import type { Message } from "discord.js";
import { getChanelByIdAsync } from "@/utils/chanels/chanels.utils";
import { env } from "@/utils/env/env.util";
import { anyToError, BaseError, error, ok } from "arcscord";
import { ChannelType } from "discord.js";

export async function getPresentationMessages(client: ArcClient): Promise<Result<Message[], BaseError>> {
  let channel;
  const messages = [];

  try {
    channel = await getChanelByIdAsync(client, env.PRESENTATION_CHANNEL_ID);
  }
  catch (e) {
    return error(
      new BaseError({
        message: "Failed to fetch presentation channel",
        baseError: anyToError(e),
      }),
    );
  }

  if (!channel || channel.type !== ChannelType.GuildText) {
    return error(new BaseError({
      message: "invalid presentation channel",
    }));
  }

  try {
    let lastMessageId: string | undefined;
    for (let i = 0; i < 4; i++) {
      // noinspection JSUnusedAssignment
      messages.push(...(await channel.messages.fetch({ limit: 100, before: lastMessageId })).map(m => m));
      messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
      lastMessageId = messages[0].id;
    }
    return ok(messages);
  }
  catch (e) {
    return error(new BaseError({
      message: "failed to fetch message in presentation channel",
      baseError: anyToError(e),
    }));
  }
}
