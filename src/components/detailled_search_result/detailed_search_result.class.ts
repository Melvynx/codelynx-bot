import type { ButtonRunContext, ButtonRunResult } from "arcscord";
import type { ButtonBuilder } from "discord.js";
import { getResults } from "@/utils/search/search.util";
import { anyToError, BaseError, Button, ButtonError, CUSTOM_ID_SEPARATOR, error, ok } from "arcscord";
import { ActionRowBuilder, EmbedBuilder } from "discord.js";
import { DETAILED_SEARCH_RESULT_ID, detailedSearchResultBuilder } from "./detailed_search_result.builder";

export class DetailedSearchResult extends Button {
  customId = DETAILED_SEARCH_RESULT_ID;

  name = "DetailedSearchResult";

  defaultReplyOptions = {
    preReply: false,
    ephemeral: true,
  };

  async run(ctx: ButtonRunContext): Promise<ButtonRunResult> {
    const id = ctx.interaction.customId.split(CUSTOM_ID_SEPARATOR)[1];

    const result = getResults(id);
    if (!result) {
      this.disableButton(ctx);
      return this.reply(ctx, {
        embeds: [
          new EmbedBuilder()
            .setTitle("Résultat introuvable")
            .setColor("Orange")
            .setDescription("Impossible de retrouver le resultat, infos surrement supprimer avec le temps"),
        ],
        ephemeral: true,
      });
    }

    const query = result.query.length > 200 ? `${result.query.slice(0, 200)}...` : result.query;

    const embed = new EmbedBuilder()
      .setTitle(`Résultat détaillé de : "${query}"`)
      .setColor("Green")
      .setImage(result.youtubeVideos[0]?.media || null);
    embed.addFields({
      name: "**X :**",
      value: result.xPosts.slice(0, 5).map((post, index) => {
        return `**${index + 1} :** [${post.title}](${post.url})`;
      }).join("\n"),
    });

    if (result.youtubeVideos.length > 0) {
      embed.addFields({
        name: "**Youtube :**",
        value: result.youtubeVideos.map((video, index) => {
          return `**${index + 1} :** [${video.title}](${video.url})`;
        }).join("\n"),
      });
    }

    try {
      await ctx.interaction.message.edit({
        embeds: [embed],
        components: [],
      });
      return ok(true);
    }
    catch (e) {
      return error(new ButtonError({
        message: "failed to edit message",
        interaction: ctx.interaction,
        baseError: anyToError(e),
      }));
    }
  }

  disableButton(ctx: ButtonRunContext): void {
    try {
      void ctx.interaction.message.edit({
        components: [new ActionRowBuilder<ButtonBuilder>()
          .addComponents(detailedSearchResultBuilder("no").setDisabled(true))],
      });
    }
    catch (e) {
      this.client.logger.logError(new BaseError({
        message: "failed to disable search button",
        baseError: anyToError(e),
        debugs: {
          message_id: ctx.interaction.message.id,
        },
      }));
    }
  }
}
