import type { TaskResult, TaskType } from "arcscord";
import { getTicketsChannels } from "@/utils/chanels/chanels.utils";
import { env } from "@/utils/env/env.util";
import { LynxLogger } from "@/utils/log/log.util";
import { anyToError, defaultLogger, error, ok, Task, TaskError } from "arcscord";
import { differenceInDays, subDays } from "date-fns";
import { verificationKickEmbedBuilder } from "./kick_embed.builder";
import {
  getUnverifiedMembers,
  isUserHaveTicket,
} from "./verification_remember.helper";
import { verificationWarnEmbedBuilder } from "./warn_embed.builder";

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

    const membersToKick = usersWithoutLynxRole.filter(
      m =>
        m.joinedTimestamp!
        < subDays(new Date(), Number(env.DAY_TO_KICK)).getTime(),
    );
    const membersToWarn = usersWithoutLynxRole.filter(
      m =>
        !membersToKick.includes(m)
        && m.joinedTimestamp!
        < subDays(new Date(), Number(env.DAY_TO_WARN)).getTime(),
    );

    for (const member of membersToWarn) {
      try {
        await member.send({ embeds: [verificationWarnEmbedBuilder(member)] });
        LynxLogger.info(
          `**VERIFICATION_REMEMBER** : <@${
            member.id
          }> à reçut un rappel de vérification. Il est présent sur le serveur de puis ${
            member.joinedTimestamp
              ? differenceInDays(Date.now(), member.joinedTimestamp)
              : "inconnue"
          } jours`,
        );
      }
      catch (err) {
        defaultLogger.warning(
          `Unable to send warn message to <@${member.user.id}> with id ${member.id}, error : ${anyToError(err).message}`,
        );
      }
    }

    for (const member of membersToKick) {
      if (isUserHaveTicket(ticketChannels, member.id))
        continue;
      try {
        await member.send({ embeds: [verificationKickEmbedBuilder()] });
        LynxLogger.info(
          `**VERIFICATION_REMEMBER** : <@${
            member.id
          }> à reçut une explication de kick. Il est présent sur le serveur de puis ${
            member.joinedTimestamp
              ? differenceInDays(Date.now(), member.joinedTimestamp)
              : "inconnue"
          } jours`,
        );
      }
      catch (err) {
        defaultLogger.warning(
          `Unable to send kick message to <@${member.user.id}> with id ${member.id}, error : ${anyToError(err).message}`,
        );
        continue;
      }

      try {
        await member.kick();
        LynxLogger.info(
          `**VERIFICATION_REMEMBER** : <@${member.id}> à été kick due à la non vérification de son compte`,
        );
      }
      catch (err) {
        defaultLogger.warning(
          `Unable to kick <@${member.user.id}> with id ${member.id}, error : ${anyToError(err).message}`,
        );
      }
    }

    return ok(true);
  }
}
