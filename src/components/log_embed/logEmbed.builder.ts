import { env } from "@/utils/env/env.util";
import { railwayLogUrlBuilder } from "@/utils/log/log.util";
import { addMinutes, getTime, subMinutes } from "date-fns";
import { EmbedBuilder } from "discord.js";

type LogEmbedBuilderOptions = {
  logLevel: "info" | "warn" | "error";
  message: string;
};

export function logEmbedBuilder({ logLevel, message }: LogEmbedBuilderOptions) {
  const now = new Date(); // Heure actuelle
  const timestampMinus15Minutes = getTime(subMinutes(now, 15)); // -15 minutes
  const timestampPlus15Minutes = getTime(addMinutes(now, 15)); // +15 minutes
  const logUrl = railwayLogUrlBuilder(
    timestampMinus15Minutes,
    timestampPlus15Minutes,
  );

  const embed = new EmbedBuilder()
    .setAuthor({
      name: "CodeLynx Logger",
      iconURL: env.ICON_URL,
      url: logUrl,
    })
    .setTitle(`Log Level: ${logLevel}`)
    .setURL(logUrl)
    .setDescription(message)

    .setFooter({
      text: "CodeLynx Logger",
      iconURL: env.ICON_URL,
    })
    .setTimestamp();

  switch (logLevel) {
    case "info":
      embed.setColor("DarkGreen");
      break;
    case "warn":
      embed.setColor("Yellow");
      break;
    case "error":
      embed.setColor("DarkRed");
      break;
  }

  return embed;
}
