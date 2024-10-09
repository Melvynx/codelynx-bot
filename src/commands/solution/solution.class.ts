import type { CommandRunContext, CommandRunResult, MessageCommand } from "arcscord";
import type { GuildMember, PublicThreadChannel } from "discord.js";
import { env } from "@/utils/env/env.util";
import { Command } from "arcscord";
import { ChannelType, EmbedBuilder } from "discord.js";
import { solutionMessageBuilder } from "./solution.builder";

export class SolutionCommand extends Command implements MessageCommand {
  messageBuilder = solutionMessageBuilder;

  name = "Marquer comme solution";

  async run(ctx: CommandRunContext): Promise<CommandRunResult> {
    const helpChannel = await ctx.interaction.client.channels.fetch(
      env.HELP_CHANNEL_ID,
    );

    if (!helpChannel || helpChannel.type !== ChannelType.GuildForum) {
      return this.reply(ctx, {
        content: "Une erreur est survenue. Merci de réessayer plus tard.",
        ephemeral: true,
      });
    }

    if (
      !ctx.interaction.channel
      || ctx.interaction.channel.type !== ChannelType.PublicThread
      || ctx.interaction.channel.parentId !== helpChannel.id
      || ctx.interaction.guildId !== env.SERVER_ID
      || !ctx.interaction.isMessageContextMenuCommand()
    ) {
      return this.reply(ctx, {
        content: "Vous ne pouvez pas faire ceci à cet endroit.",
        ephemeral: true,
      });
    }

    const thread = ctx.interaction.channel;

    if (!thread.ownerId) {
      return this.reply(ctx, {
        content: "Ce post doit avoir été crée par la main d'un humain",
        ephemeral: true,
      });
    }

    const threadOwner = await ctx.interaction.client.users.fetch(
      thread.ownerId,
    );
    const memberCallInteraction = ctx.interaction.member as GuildMember;

    if (this.isThreadAllReadyResolved(thread)) {
      return this.reply(ctx, {
        content: "Ce post est déjà marquer comme résolu.",
        ephemeral: true,
      });
    }

    if (
      threadOwner.id !== memberCallInteraction.id
      && !memberCallInteraction.permissions.has("ManageThreads")
    ) {
      return this.reply(ctx, {
        content:
          "Vous n’êtes pas le créateur de ce poste. Vous ne pouvez donc pas le définir comme résolu",
        ephemeral: true,
      });
    }

    const message = ctx.interaction.targetMessage;

    await message.pin();
    void message.react("✅");

    await thread.setAppliedTags([
      env.RESOLVED_THREAD_TAG_ID,
      ...thread.appliedTags,
    ]);

    const embed = new EmbedBuilder()
      .setTitle("✅ **Succès !**")
      .setDescription(
        `Ce post a été marqué comme résolu. Si vous avez d’autres questions, n’hésitez pas à créer un nouveau post -> <#${env.HELP_CHANNEL_ID}>`,
      )
      .addFields({
        name: "Message de résolution",
        value: `[Clique Ici](${message.url})`,
        inline: false,
      })
      .setColor("#01be61");

    return this.reply(ctx, { embeds: [embed] });
  }

  isThreadAllReadyResolved = (thread: PublicThreadChannel): boolean => {
    return (
      thread.appliedTags.findIndex(t => t === env.RESOLVED_THREAD_TAG_ID) !== -1
    );
  };
}
