import { ButtonBuilder, ButtonStyle } from "discord.js";

export const VERIFY_BUTTON_ID = "verify_button";

export const verifyButtonBuilder = new ButtonBuilder()
  .setStyle(ButtonStyle.Success)
  .setCustomId(VERIFY_BUTTON_ID)
  .setLabel("Verification");
