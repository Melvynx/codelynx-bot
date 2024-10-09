import type { CommandRunContext, CommandRunResult } from "arcscord";
import type { ButtonBuilder } from "discord.js";
import { verifyButtonBuilder } from "@/components/verify_button/verify_button.builder";
import { anyToError, CommandError, error, SubCommand } from "arcscord";
import { ActionRowBuilder, EmbedBuilder } from "discord.js";

export class SetupVerifySubCommand extends SubCommand {
  subName = "setup";

  subGroup = "verify";

  async run(ctx: CommandRunContext): Promise<CommandRunResult> {
    const embed = new EmbedBuilder()
      .setTitle("Vérification")
      .setDescription(
        "Pour accéder à ce serveur, cliquez sur le bouton si dessous pour vérifier votre compte !",
      )
      .setColor("#6CEEF5");

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
      verifyButtonBuilder,
    );

    try {
      await ctx.interaction.channel?.send({
        embeds: [embed],
        components: [components],
      });
    }
    catch (e) {
      return error(
        new CommandError({
          command: this,
          context: ctx,
          interaction: ctx.interaction,
          message: "failed to send message",
          baseError: anyToError(e),
        }),
      );
    }
    return this.editReply(ctx, {
      content: "success",
    });
  }
}
