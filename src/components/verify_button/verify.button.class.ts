import type { ButtonRunContext, ButtonRunResult } from "arcscord";
import { env } from "@/utils/env/env.util";
import { anyToError, Button, ButtonError, error, ok } from "arcscord";
import { verificationModalBuilder } from "../verification_modal/verification_modal.builder";
import { VERIFY_BUTTON_ID } from "./verify_button.builder";

export class VerifyButton extends Button {
  customId = VERIFY_BUTTON_ID;

  name = "verify_button";

  async run(ctx: ButtonRunContext): Promise<ButtonRunResult> {
    try {
      const member = await ctx.interaction.guild?.members.fetch(ctx.interaction.user.id);
      if (member) {
        if (member.roles.cache.hasAny(env.VERIFY_ROLE_ID, env.LYNX_ROLE_ID)) {
          return this.reply(ctx, {
            content: "Vous êtes déjà vérifié !",
            ephemeral: true,
          });
        }
      }

      await ctx.interaction.showModal(verificationModalBuilder);
      return ok(true);
    }
    catch (e) {
      return error(new ButtonError({
        interaction: ctx.interaction,
        message: "failed to send email input modal",
        baseError: anyToError(e),
      }));
    }
  }
}
