import { CUSTOM_ID_SEPARATOR } from "arcscord";
import { ButtonBuilder, ButtonStyle } from "discord.js";

export const DETAILED_SEARCH_RESULT_ID = "detailed_search_result";

export function detailedSearchResultBuilder(id: string): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(DETAILED_SEARCH_RESULT_ID + CUSTOM_ID_SEPARATOR + id)
    .setStyle(ButtonStyle.Success)
    .setLabel("Détaillé");
}
