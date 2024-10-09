import { CUSTOM_ID_SEPARATOR } from "arcscord";
import { ButtonBuilder, ButtonStyle } from "discord.js";

export const RENAME_LINK_THREAD_ID = "rename_link_thread";

export function renameLinkThreadBuilder(id: string): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(RENAME_LINK_THREAD_ID + CUSTOM_ID_SEPARATOR + id)
    .setStyle(ButtonStyle.Primary)
    .setLabel("Renommer le fil");
}
