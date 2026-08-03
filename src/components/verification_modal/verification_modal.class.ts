import type { ModalSubmitRunContext, ModalSubmitRunResult } from "arcscord";
import type { GuildMember } from "discord.js";
import {
  getCodelineRoleDelta,
  getCodelineRoleIdsForProducts,
} from "@/utils/api/codeline/codeline.role-mapping";
import { resolveCodelineRoleState } from "@/utils/api/codeline/codeline.role-state";
import { displayName } from "@/utils/format/formatUser";
import { LynxLogger } from "@/utils/log/log.util";
import { getPresentationMessages } from "@/utils/messages/message.util";
import {
  anyToError,
  error,
  ModalSubmitComponent,
  ModalSubmitError,
  ok,
} from "arcscord";
import { ChannelType, EmbedBuilder } from "discord.js";
import { getUser, updateUserId } from "../../utils/api/codeline/codeline.util";
import { env } from "../../utils/env/env.util";
import {
  EMAIL_INPUT_TEXT_ID,
  NAME_INPUT_TEXT_ID,
  VERIFICATION_MODAL_ID,
} from "./verification_modal.builder";

export class VerificationModal extends ModalSubmitComponent {
  customId = VERIFICATION_MODAL_ID;

  name = "verification_modal";

  defaultReplyOptions = {
    ephemeral: true,
    preReply: true,
  };

  async run(ctx: ModalSubmitRunContext): Promise<ModalSubmitRunResult> {
    let email = "";
    let name = "";
    try {
      email = ctx.interaction.fields.getTextInputValue(EMAIL_INPUT_TEXT_ID);
      name = ctx.interaction.fields.getTextInputValue(NAME_INPUT_TEXT_ID);
    }
    catch (e) {
      return error(
        new ModalSubmitError({
          interaction: ctx.interaction,
          message: "missing value in text input",
          baseError: anyToError(e),
        }),
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return this.editReply(ctx, {
        embeds: [
          new EmbedBuilder()
            .setTitle("Email invalide")
            .setDescription(`l'email ${email} n'a pas un format valide`)
            .setColor("Red"),
        ],
      });
    }

    const [user, err] = await getUser(email);
    if (err) {
      return error(
        new ModalSubmitError({
          message: `failed to get codeline error : ${err.message}`,
          interaction: ctx.interaction,
          baseError: err,
        }),
      );
    }

    if (!user) {
      return this.editReply(ctx, {
        embeds: [
          new EmbedBuilder()
            .setTitle("Pas d'utilisateur trouvé")
            .setDescription(
              "Aucun compte codelynx à été trouvé avec cette adresse mail",
            )
            .setColor("Red"),
        ],
      });
    }

    if (user.discordId && user.discordId !== ctx.interaction.user.id) {
      return this.editReply(ctx, {
        embeds: [
          new EmbedBuilder()
            .setTitle("Déjà relié")
            .setDescription(
              `Votre compte a déjà été relier a un utilisateur, si besoins contactez le support. <#${env.CREATE_TICKET_CHANEL_ID}>`,
            )
            .setColor("Red"),
        ],
      });
    }

    if (!ctx.interaction.member || !ctx.interaction.guild) {
      return ok("Not in guild");
    }

    let member: GuildMember;
    try {
      member = await ctx.interaction.guild.members.fetch(ctx.interaction.user.id);
    }
    catch (e) {
      return error(
        new ModalSubmitError({
          message: "failed to fetch member",
          interaction: ctx.interaction,
          baseError: anyToError(e),
        }),
      );
    }

    const [messages, err2] = await getPresentationMessages(this.client);

    if (err2) {
      return error(
        new ModalSubmitError({
          message: "failed to fetch presentation messages",
          interaction: ctx.interaction,
          baseError: err2,
        }),
      );
    }

    const haveDoPresentation = messages.find(
      msg => msg.author.id === ctx.interaction.user.id,
    );

    const verificationRoleId = haveDoPresentation ? env.LYNX_ROLE_ID : env.VERIFY_ROLE_ID;

    // The verification role is the only step that must succeed : it is granted
    // before Codeline and the database are contacted, so an outage on either
    // side can never leave a member unverified.
    if (!member.roles.cache.has(verificationRoleId)) {
      try {
        await member.roles.add(verificationRoleId);
      }
      catch (e) {
        return error(
          new ModalSubmitError({
            message: "failed to add verification role",
            interaction: ctx.interaction,
            baseError: anyToError(e),
          }),
        );
      }
    }

    try {
      await updateUserId(email, ctx.interaction.user.id);
    }
    catch (e) {
      LynxLogger.warn(
        `VERIFICATION : failed to link ${displayName(member)} to codeline account `
        + `\`${email}\` : ${anyToError(e).message}`,
      );
    }

    const entitlementIds = user.products.map(product => product.id);
    let desiredFormationRoleIds: string[];
    let additionalManagedRoleIds: string[];
    try {
      ({ desiredRoleIds: desiredFormationRoleIds, additionalManagedRoleIds }
        = await resolveCodelineRoleState(entitlementIds));
    }
    catch (e) {
      // Database unreachable : fall back on the static mapping so formation
      // roles are still granted, and manage nothing else to avoid removing
      // roles we cannot resolve.
      LynxLogger.warn(
        `VERIFICATION : failed to resolve codeline role state for ${displayName(member)}, `
        + `falling back on the static mapping : ${anyToError(e).message}`,
      );
      desiredFormationRoleIds = getCodelineRoleIdsForProducts(entitlementIds);
      additionalManagedRoleIds = [];
    }

    const { roleIdsToAdd, roleIdsToRemove } = getCodelineRoleDelta(
      member.roles.cache.keys(),
      desiredFormationRoleIds,
      additionalManagedRoleIds,
    );

    const roleSyncFailures: string[] = [];
    for (const roleId of roleIdsToAdd) {
      try {
        await member.roles.add(roleId);
      }
      catch (e) {
        roleSyncFailures.push(`add <@&${roleId}> : ${anyToError(e).message}`);
      }
    }
    for (const roleId of roleIdsToRemove) {
      try {
        await member.roles.remove(roleId);
      }
      catch (e) {
        roleSyncFailures.push(`remove <@&${roleId}> : ${anyToError(e).message}`);
      }
    }
    if (roleSyncFailures.length > 0) {
      LynxLogger.warn(
        `VERIFICATION : failed to synchronize some roles of ${displayName(member)} : ${
          roleSyncFailures.join(", ")}`,
      );
    }

    await this.editReply(
      ctx,
      `Vérification effectué avec succès. ${
        !haveDoPresentation ? `La suite dans <#${env.WELCOME_CHANNEL_ID}> !` : ""
      }`,
    );

    try {
      await member.setNickname(name, "Vérification rename");
    }
    catch (e) {
      LynxLogger.warn(
        `VERIFICATION : failed to rename ${displayName(member)} to \`${name}\` : ${
          anyToError(e).message}`,
      );
    }

    if (!haveDoPresentation) {
      const welcomeMessage = env.WELCOME_MESSAGE.replaceAll(
        "{mention}",
        ctx.interaction.user.toString(),
      );
      const channel = member.guild.channels.cache.get(env.WELCOME_CHANNEL_ID);

      if (!channel || channel.type !== ChannelType.GuildText) {
        LynxLogger.warn(
          `VERIFICATION : failed to send welcome message of ${displayName(member)}, `
          + `channel ${env.WELCOME_CHANNEL_ID} not found or invalid type (${channel?.type})`,
        );
      }
      else {
        try {
          await channel.send(welcomeMessage);
        }
        catch (e) {
          LynxLogger.warn(
            `VERIFICATION : failed to send welcome message of ${displayName(member)} `
            + `in <#${env.WELCOME_CHANNEL_ID}> : ${anyToError(e).message}`,
          );
        }
      }

      try {
        await member.send(welcomeMessage);
      }
      catch (e) {
        // Members with closed DMs are expected, this must not fail the verification.
        LynxLogger.warn(
          `VERIFICATION : failed to send welcome DM to ${displayName(member)} : ${
            anyToError(e).message}`,
        );
      }
    }

    LynxLogger.info(
      `VERIFICATION : verified user ${displayName(member)} with email \`${email}\`, `
      + `giving role ${
        haveDoPresentation
          ? `lynx, link to presentation [message](${haveDoPresentation.url})`
          : "verify"
      }`,
    );
    return ok(true);
  }
}
