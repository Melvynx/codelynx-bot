import { MessageCommandBuilder, SlashCmdBuilder } from "arcscord";

export const searchSlashBuilder = new SlashCmdBuilder()
  .setName("search")
  .setDescription("search a content of Melvyn on X and on Youtube")
  .setDMPermission(false)
  .setNameLocalization("fr", "rechercher")
  .setDescriptionLocalization("fr", "rechercher un contenu de Melvyn sur X et sur Youtube")
  .addStringOption(option => option
    .setMinLength(2)
    .setMaxLength(100)
    .setRequired(true)
    .setName("query")
    .setDescription("thing what you search")
    .setDescriptionLocalization("fr", "la chose que vous cherchez"));

export const searchMessageBuilder = new MessageCommandBuilder()
  .setName("search")
  .setNameLocalization("fr", "rechercher")
  .setDMPermission(false);
