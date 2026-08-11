import type { TaskResult, TaskType } from "arcscord";
import type { GuildMember } from "discord.js";
import { getTicketsChannels } from "@/utils/chanels/chanels.utils";
import { env } from "@/utils/env/env.util";
import { displayName } from "@/utils/format/formatUser";
import { LynxLogger } from "@/utils/log/log.util";
import { anyToError, defaultLogger, error, ok, Task, TaskError } from "arcscord";
import { differenceInDays, subDays } from "date-fns";
import {
  getUnverifiedMembers,
  isUserHaveTicket,
} from "./verification_remember.helper";
import { verificationWarnEmbedBuilder } from "./warn_embed.builder";

const MAX_MEMBERS_IN_REVIEW_LOG = 50;

function manualReviewLog(members: GuildMember[]): string {
  const visibleMembers = members.slice(0, MAX_MEMBERS_IN_REVIEW_LOG);
  const remainingCount = members.length - visibleMembers.length;
  const memberList = visibleMembers.map(member => displayName(member)).join("\n");
  const remainingMessage = remainingCount > 0
    ? `\n... et ${remainingCount} autre(s) membre(s)`
    : "";

  return `**VERIFICATION_REVIEW** : ${members.length} membre(s) à vérifier manuellement. Aucune expulsion automatique.\n${memberList}${remainingMessage}`;
}

export class VerificationRememberTask extends Task {
  name = "Rappel de vérification";

  type: TaskType = "cron";

  interval = "0 0 7 */2 * *";

  async run(): Promise<TaskResult> {
    const ticketChannels = await getTicketsChannels(this.client);
    if (!ticketChannels) {
      return error(
        new TaskError({
          message: "Unable to fetch ticketChannels",
          task: this,
        }),
      );
    }

    const [usersWithoutLynxRole, err] = await getUnverifiedMembers(this.client);

    if (!usersWithoutLynxRole)
      return ok("Aucun utilisateur non vérifier");
    LynxLogger.info(
      `**VERIFICATION_REMEMBER** : ${usersWithoutLynxRole.length} membres non vérifier detecter`,
    );

    if (err) {
      return error(
        new TaskError({
          message: "Unable to fetch unverified members",
          baseError: err,
          task: this,
        }),
      );
    }

    const membersToReview = usersWithoutLynxRole.filter(
      m =>
        m.joinedTimestamp! < subDays(new Date(), Number(env.DAY_TO_KICK)).getTime(),
    );
    const membersToWarn = usersWithoutLynxRole.filter(
      m =>
        !membersToReview.includes(m)
        && m.joinedTimestamp! < subDays(new Date(), Number(env.DAY_TO_WARN)).getTime(),
    );

    for (const member of membersToWarn) {
      try {
        await member.send({ embeds: [verificationWarnEmbedBuilder(member)] });
        LynxLogger.info(
          `**VERIFICATION_REMEMBER** : ${displayName(member)} à reçut un rappel de vérification. Il est présent sur le serveur de puis ${
            member.joinedTimestamp
              ? differenceInDays(Date.now(), member.joinedTimestamp)
              : "inconnue"
          } jours`,
        );
      }
      catch (err) {
        defaultLogger.warning(
          `Unable to send warn message to ${displayName(member)} with id ${member.id},  cause : ${anyToError(err).message}`,
        );
        defaultLogger.warning(
          `Unable to send warn message to ${displayName(member)} with id ${member.id},  cause : ${anyToError(err).message}`,
        );
      }
    }

    const membersNeedingManualReview = membersToReview.filter(
      member => !isUserHaveTicket(ticketChannels, member.id),
    );

    if (membersNeedingManualReview.length > 0)
      LynxLogger.warn(manualReviewLog(membersNeedingManualReview));

    return ok(true);
  }
}
