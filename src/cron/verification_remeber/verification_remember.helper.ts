import type { ArcClient, Result } from "arcscord";
import type { CategoryChildChannel, GuildMember } from "discord.js";
import { env } from "@/utils/env/env.util";
import { anyToError, BaseError, error, ok } from "arcscord";
import { ChannelType } from "discord.js";

/**
 * Check si un utilisateur a crée un ticket via sont ID
 * @param ticketList Liste des channels de tickets
 * @param userId id de l'utilisateur
 * @returns Boolean
 */
export function isUserHaveTicket(ticketList: CategoryChildChannel[], userId: string): boolean {
  return ticketList.some(
    (c: CategoryChildChannel) => c.type === ChannelType.GuildText && c.topic && c.topic.includes(userId),
  );
}

export async function getUnverifiedMembers(client: ArcClient): Promise<Result<GuildMember[], BaseError>> {
  let guild, members;
  try {
    guild = await client.guilds.fetch(env.SERVER_ID);
    if (!guild) {
      return error(
        new BaseError({
          message: "Unable to fetch Codeline Guild",
        }),
      );
    }
  }
  catch (e) {
    return error(
      new BaseError({
        message: `Unable to fetch Codeline Guild, error ${anyToError(e).message}`,
        baseError: anyToError(e),
      }),
    );
  }

  try {
    members = (await guild.members.fetch()).map(m => m);
  }
  catch (e) {
    return error(new BaseError({
      message: `Unable to fetch Members, error ${anyToError(e).message},`,
      baseError: anyToError(e),
    }));
  }

  return ok(members.filter(m => !m.roles.cache.has(env.LYNX_ROLE_ID)
    && !m.user.bot
    && m.joinedTimestamp));
}
