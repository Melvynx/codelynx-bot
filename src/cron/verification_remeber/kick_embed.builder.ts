import { env } from "@/utils/env/env.util";
import { EmbedBuilder } from "discord.js";

export function verificationKickEmbedBuilder() {
  return new EmbedBuilder()
    .setAuthor({
      name: "⚠️Échec de vérification⚠️",
    })
    .setDescription(
      `**Mince...** Ta vérification n'a toujours pas été complétée.  \nPour rappel, c'est une étape très importante pour lier ton compte [Codeline](https://codeline.app/home) à Discord et accéder à l'ensemble du serveur.\n\nMalheureusement, tu as donc été expulsé du serveur.  \n***Mais pas de souci, tu es toujours éligible au serveur.***  \nTu peux le rejoindre via [ce lien](${env.INVITATION_URL}).\nCependant, cette fois, pense à bien finaliser la vérification de ton compte !\n_\n_`,
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
    .setColor("#FF0000")
    .setFooter({
      text: "Codelynx Bot",
      iconURL: env.ICON_URL,
    })
    .setTimestamp();
}
