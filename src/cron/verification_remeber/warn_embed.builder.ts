import type { GuildMember } from "discord.js";
import { env } from "@/utils/env/env.util";
import { format } from "date-fns";
import { EmbedBuilder } from "discord.js";

export function verificationWarnEmbedBuilder(member: GuildMember) {
  return new EmbedBuilder()
    .setAuthor({
      name: "Rappel de vérification",
    })
    .setDescription(
      `Salut ${
        member.user.username
      },\n\nTu as rejoint le serveur **Codelynx Formation** le : ${format(
        member.joinedAt!,
        "dd/MM/yyyy",
      )}, mais tu n'as pas encore terminé la vérification de ton compte.\nC'est une étape importante pour lier ton compte [Codeline](https://codeline.app/home) à Discord et accéder à l'ensemble du serveur.\n*⚠️ Sans cette vérification, tu risques d'être expulsé dans les prochains jours.⚠️*\n_\n\n_`,
    )
    .addFields(
      {
        name: "Comment finaliser la vérification ?",
        value: `Pour vérifier ton compte, il te suffit de :\n- Remplir le formulaire disponible [ici](https://discord.com/channels/${env.SERVER_ID}/${env.VERIFICATION_CHANNEL_ID})\n- Poster ta présentation dans le salon -> [👀┃présentations](https://discord.com/channels/${env.SERVER_ID}/${env.PRESENTATION_CHANNEL_ID})\n***⚠️ Les deux étapes sont indispensables pour finaliser la procédure.⚠️***\n_\n\n_`,
        inline: false,
      },
      {
        name: "Besoin d'aide ?",
        value: `Si tu rencontres un problème, n'hésite pas à créer un ticket ici\n-> [🎟┃créer-un-ticket](https://discord.com/channels/${env.SERVER_ID}/${env.CREATE_TICKET_CHANEL_ID})  \nUn modérateur viendra te donner un coup de main.\n_\n_`,
        inline: false,
      },
    )
    .setColor("#00b0f4")
    .setFooter({
      text: "Codelynx Bot",
      iconURL:
        env.ICON_URL,
    })
    .setTimestamp();
}
