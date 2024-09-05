import type { ButtonRunContext, ButtonRunResult } from "arcscord";
import { anyToError, Button, ButtonError, error, ok } from "arcscord";
import { VERIFY_BUTTON_ID } from "./verify_button.builder";
import { emailInputBuilder } from "../email_input/email_input.builder";
import { env } from "@/utils/env/env.util";

export class VerifyButton extends Button {

  customId = VERIFY_BUTTON_ID;

  name = "verify_button";

  async run(ctx: ButtonRunContext): Promise<ButtonRunResult> {
    try {
      const member = await ctx.interaction.guild?.members.fetch(ctx.interaction.user.id);
      if (member) {
        if (member.roles.cache.hasAny(env.VERIFY_ROLE_ID, env.LYNX_ROLE_ID)) {
          return this.reply(ctx, "Vous êtes déjà vérifié !");
        }
      }

      await ctx.interaction.showModal(emailInputBuilder);
      return ok(true);
    } catch (e) {
      return error(new ButtonError({
        interaction: ctx.interaction,
        message: "failed to send email input modal",
        baseError: anyToError(e),
      }));
    }
  }

}