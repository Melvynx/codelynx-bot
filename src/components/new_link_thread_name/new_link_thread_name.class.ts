import type { ModalSubmitRunContext, ModalSubmitRunResult } from "arcscord";
import { anyToError, error, ModalSubmitComponent, ModalSubmitError } from "arcscord";
import { ChannelType } from "discord.js";
import { NEW_LINK_THREAD_NAME_ID, NEW_LINK_THREAD_NAME_TEXT_ID } from "./new_link_thread_name.builder";

export class NewLinkThreadName extends ModalSubmitComponent {
  customId = NEW_LINK_THREAD_NAME_ID;

  name = "newLinkThreadName";

  defaultReplyOptions = {
    preReply: false,
    ephemeral: true,
  };

  async run(ctx: ModalSubmitRunContext): Promise<ModalSubmitRunResult> {
    let name = "";
    try {
      name = ctx.interaction.fields.getTextInputValue(NEW_LINK_THREAD_NAME_TEXT_ID);
    }
    catch (e) {
      return error(new ModalSubmitError({
        interaction: ctx.interaction,
        message: "missing value in text input",
        baseError: anyToError(e),
        debugs: {
          response: ctx.interaction.fields.fields.toJSON().map(c => c.toJSON()),
        },
      }));
    }

    if (!ctx.interaction.channel || ctx.interaction.channel.type !== ChannelType.PublicThread) {
      return error(new ModalSubmitError({
        interaction: ctx.interaction,
        message: "Invalid channel type for rename button !",
      }));
    }

    if (name.length >= 100) {
      name = `${name.slice(0, 96)}...`;
    }

    try {
      await ctx.interaction.channel.edit({
        name,
        reason: `name edited by ${ctx.interaction.user.username}`,
      });
      return this.reply(ctx, {
        content: `Le fil à été renommer correctement en "${name}"`,
        ephemeral: true,
      });
    }
    catch (e) {
      return error(new ModalSubmitError({
        interaction: ctx.interaction,
        message: "Failed to rename thread",
        baseError: anyToError(e),
      }));
    }
  }
}
