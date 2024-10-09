import type { CommandRunContext, CommandRunResult } from "arcscord";
import { getUnverifiedMembers } from "@/cron/verification_remeber/verification_remember.helper";
import { env } from "@/utils/env/env.util";
import { LynxLogger } from "@/utils/log/log.util";
import { getPresentationMessages } from "@/utils/messages/message.util";
import { anyToError, CommandError, error, SubCommand } from "arcscord";

export class ForceVerifySubCommand extends SubCommand {
  subName = "force";

  subGroup = "verify";

  async run(ctx: CommandRunContext): Promise<CommandRunResult> {
    const [members, memberError] = await getUnverifiedMembers(this.client);

    if (memberError) {
      return error(
        new CommandError({
          message: "failed to get unverified Member list",
          command: this,
          interaction: ctx.interaction,
          context: ctx,
          baseError: memberError,
        }),
      );
    }

    const [messages, err] = await getPresentationMessages(this.client);
    if (err) {
      return error(
        new CommandError({
          message: "failed to fetch presentation messages",
          command: this,
          interaction: ctx.interaction,
          context: ctx,
          baseError: err,
        }),
      );
    }

    let count = 0;
    let errCount = 0;

    for (const member of members) {
      const message = messages.find(m => m.author.id === member.user.id);
      const roles = member.roles.valueOf().map(r => r);
      if (!roles.some(r => r.id === env.VERIFY_ROLE_ID))
        continue;
      if (!message)
        continue;
      count++;

      try {
        await member.roles.add(env.LYNX_ROLE_ID);
      }
      catch (addRoleErr) {
        errCount++;
        LynxLogger.warn(
          `**FORCE VERIFY** : Fail to add Lynx role for <@${member.user.id}> with id ${member.id}, error :${anyToError(addRoleErr).message}`,
        );
        continue;
      }

      try {
        await member.roles.remove(env.VERIFY_ROLE_ID);
      }
      catch (removeRoleErr) {
        errCount++;
        LynxLogger.warn(
          `**FORCE VERIFY** : Fail to remove Verification role for <@${member.user.id}> with id ${member.id}, error :${anyToError(removeRoleErr).message}`,
        );
      }

      try {
        await member.send(
          "Bonjour, un petit bug a été détecter avec le bot de Codeline. C'est ce pourquoi tu as reçut des messages les deux dernier jours. Le problème à été solutionner. Ton compte est bien a présent actif ",
        );
      }
      catch (messageErr) {
        errCount++;
        LynxLogger.warn(
          `**FORCE VERIFY** : Fail to send message for <@${member.user.id}> with id ${member.id}, error :${anyToError(messageErr).message}`,
        );
      }

      LynxLogger.info(
        `**FORCE VERIFY** : update role of <@${member.user.id}>, link to presentation [message](${message.url})`,
      );
    }

    return this.editReply(ctx, {
      content: `success, updated ${count} members, ${errCount} errors`,
    });
  }
}
