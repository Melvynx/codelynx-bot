import { env } from "@/utils/env/env.util";
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export const VERIFICATION_MODAL_ID = "verification_modal";
export const EMAIL_INPUT_TEXT_ID = "email_input_value";
export const NAME_INPUT_TEXT_ID = "name_input_value";

const emailInput = new TextInputBuilder()
  .setCustomId(EMAIL_INPUT_TEXT_ID)
  .setLabel("Votre adresse email")
  .setRequired(true)
  .setStyle(TextInputStyle.Short);

const nameInput = new TextInputBuilder()
  .setCustomId(NAME_INPUT_TEXT_ID)
  .setLabel("Votre Prénom")
  .setRequired(true)
  .setMinLength(Number(env.MIN_USERNAME_LEN))
  .setMaxLength(Number(env.MAX_USERNAME_LEN))
  .setStyle(TextInputStyle.Short);

const actionRows = [
  new ActionRowBuilder<TextInputBuilder>().addComponents(
    emailInput,
  ),
  new ActionRowBuilder<TextInputBuilder>().addComponents(
    nameInput,
  ),
];

export const verificationModalBuilder = new ModalBuilder()
  .setTitle("Vérification par email")
  .setCustomId(VERIFICATION_MODAL_ID)
  .addComponents(actionRows);
