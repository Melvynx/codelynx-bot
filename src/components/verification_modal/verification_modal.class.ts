import type { ModalSubmitRunContext, ModalSubmitRunResult } from "arcscord";
import type { GuildMember } from "discord.js";
import { CODELINE_PRODUCT_MAPPING_CODELYNX_ROLE } from "@/utils/api/codeline/codeline.role-mapping";
import { getUser, updateUserId } from "@/utils/api/codeline/codeline.util";
import { env } from "@/utils/env/env.util";
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
      member = await ctx.interaction.guild.members.fetch(
        ctx.interaction.user.id,
      );
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

    const formationRoles: string[] = [
      haveDoPresentation ? env.LYNX_ROLE_ID : env.VERIFY_ROLE_ID,
    ];

    for (const product of user.products) {
      if (!product.id) {
        continue;
      }
      const codelineRoles = CODELINE_PRODUCT_MAPPING_CODELYNX_ROLE[product.id];

      if (!codelineRoles)
        continue;
      formationRoles.push(...codelineRoles);
    }

    try {
      await this.editReply(
        ctx,
        `Vérification effectué avec succès. ${
          !haveDoPresentation ? `La suite dans <#${env.WELCOME_CHANNEL_ID}> !` : ""
        }`,
      );
      await member.roles.add(formationRoles);
    }
    catch (e) {
      return error(
        new ModalSubmitError({
          message: "failed to add roles",
          interaction: ctx.interaction,
          baseError: anyToError(e),
        }),
      );
    }

    try {
      await member.setNickname(name, "Vérification rename");
    }
    catch (e) {
      return error(
        new ModalSubmitError({
          message: "failed to rename user",
          interaction: ctx.interaction,
          baseError: anyToError(e),
        }),
      );
    }

    if (!haveDoPresentation) {
      try {
        const channel = member.guild.channels.cache.get(env.WELCOME_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) {
          return error(
            new ModalSubmitError({
              message:
                "failed to send welcome message, channel not found or invalid type",
              interaction: ctx.interaction,
              debugs: {
                channelId: env.WELCOME_CHANNEL_ID,
                type: channel?.type,
                except: ChannelType.GuildText,
              },
            }),
          );
        }

        await channel.send(
          env.WELCOME_MESSAGE.replaceAll(
            "{mention}",
            ctx.interaction.user.toString(),
          ),
        );
        await member.send(
          env.WELCOME_MESSAGE.replaceAll(
            "{mention}",
            ctx.interaction.user.toString(),
          ),
        );
      }
      catch (e) {
        return error(
          new ModalSubmitError({
            message: "failed to send welcome message",
            interaction: ctx.interaction,
            baseError: anyToError(e),
          }),
        );
      }
    }

    LynxLogger.info(
      `VERIFICATION : verified user <@${member.user.id}> with email \`${email}\`, `
      + `giving role ${
        haveDoPresentation
          ? `lynx, link to presentation [message](${haveDoPresentation.url})`
          : "verify"
      }`,
    );
    void updateUserId(email, ctx.interaction.user.id);
    return ok(true);
  }
}
