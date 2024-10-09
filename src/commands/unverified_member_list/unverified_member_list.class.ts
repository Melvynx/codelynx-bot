import type { CommandRunContext, CommandRunResult, InteractionDefaultReplyOptions, SlashCommand } from "arcscord";
import { unverifiedMemberListBuilder } from "@/commands/unverified_member_list/unverified_member_list.builder";
import { getUnverifiedMembers } from "@/cron/verification_remeber/verification_remember.helper";
import { Command, CommandError, error } from "arcscord";
import { differenceInDays } from "date-fns";
import { EmbedBuilder } from "discord.js";

export class UnverifiedMemberListCommand extends Command implements SlashCommand {
  slashBuilder = unverifiedMemberListBuilder;

  name = "unverified-member-list";

  defaultReplyOptions: InteractionDefaultReplyOptions = {
    ephemeral: false,
    preReply: true,
  };

  async run(ctx: CommandRunContext): Promise<CommandRunResult> {
    const [members, err] = await getUnverifiedMembers(this.client);

    if (err) {
      return error(
        new CommandError({
          message: "failed to get unverified memberlist",
          command: this,
          interaction: ctx.interaction,
          context: ctx,
          baseError: err,
        }),
      );
    }

    const messageRow = members
      .sort((a, b) => (a.joinedTimestamp ?? 0) + (b.joinedTimestamp ?? 1))
      .map(member => `${member.user.toString()} → ${member.joinedTimestamp
        ? differenceInDays(Date.now(), member.joinedTimestamp)
        : "inconue"} jours`);

    let max = false;
    while (messageRow.join("\n").length >= 4090) {
      messageRow.pop();
      max = true;
    }

    return this.editReply(ctx, {
      embeds: [
        new EmbedBuilder()
          .setTitle("Liste de membres non vérifié")
          .setDescription(messageRow.join("\n") + (max ? "\n..." : "")),
      ],
    });
  }
}
