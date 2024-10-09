import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export const NEW_LINK_THREAD_NAME_ID = "new_link_thread_name";
export const NEW_LINK_THREAD_NAME_TEXT_ID = "new_link_thread_name_text";

const newNameBuilder = new TextInputBuilder()
  .setLabel("Nouveau nom :")
  .setCustomId(NEW_LINK_THREAD_NAME_TEXT_ID)
  .setStyle(TextInputStyle.Short)
  .setRequired(true)
  .setMinLength(5)
  .setMaxLength(100);

const actionRowBuilder = new ActionRowBuilder<TextInputBuilder>()
  .addComponents(newNameBuilder);

export const newLinkThreadNameBuilder = new ModalBuilder()
  .setTitle("Renommer le fil")
  .addComponents(actionRowBuilder)
  .setCustomId(NEW_LINK_THREAD_NAME_ID);
