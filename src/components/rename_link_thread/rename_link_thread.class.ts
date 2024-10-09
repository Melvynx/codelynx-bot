import type { ButtonRunContext, ButtonRunResult } from "arcscord";
import { anyToError, Button, ButtonError, CUSTOM_ID_SEPARATOR, error, ok } from "arcscord";
import { ChannelType, EmbedBuilder } from "discord.js";
import { newLinkThreadNameBuilder } from "../new_link_thread_name/new_link_thread_name.builder";
import { RENAME_LINK_THREAD_ID, renameLinkThreadBuilder } from "./rename_link_thread.builder";

export class RenameLinkThread extends Button {
  builder = renameLinkThreadBuilder;

  name = "renameLinkThread";

  customId = RENAME_LINK_THREAD_ID;

  async run(ctx: ButtonRunContext): Promise<ButtonRunResult> {
    if (!await this.isAllowed(ctx)) {
      return this.reply(ctx, {
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("Non authorisé !")
            .setDescription("Seulement les moderateurs et l'auteur du fil peut le renomer !"),
        ],
        ephemeral: true,
      });
    }

    if (!ctx.interaction.channel) {
      return error(new ButtonError({
        interaction: ctx.interaction,
        message: "",
      }));
    }

    if (ctx.interaction.channel && ctx.interaction.channel.type !== ChannelType.PublicThread) {
      return error(new ButtonError({
        interaction: ctx.interaction,
        message: "Invalid channel type for rename button !",
      }));
    }

    try {
      await ctx.interaction.showModal(newLinkThreadNameBuilder.toJSON());
      return ok("showed modal");
    }
    catch (e) {
      return error(new ButtonError({
        interaction: ctx.interaction,
        message: "Failed to show modal!",
        baseError: anyToError(e),
      }));
    }
  }

  private async isAllowed(ctx: ButtonRunContext): Promise<boolean> {
    const authorId = ctx.interaction.customId.split(CUSTOM_ID_SEPARATOR)[1].trim();
    if (ctx.interaction.user.id === authorId) {
      return true;
    }
    if (ctx.interaction.member && ctx.interaction.channel && ctx.interaction.guild) {
      const member = await ctx.interaction.guild.members.fetch(ctx.interaction.user.id);
      const channel = await ctx.interaction.guild.channels.fetch(ctx.interaction.channel.id);
      if (channel && channel.permissionsFor(member, true).has("ManageThreads")) {
        return true;
      }
    }

    return false;
  }
}
