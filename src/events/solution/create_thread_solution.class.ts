import type { EventHandleResult } from "arcscord";
import { env } from "@/utils/env/env.util";
import { Event, ok } from "arcscord";
import { type AnyThreadChannel, ChannelType, EmbedBuilder } from "discord.js";

export class SolutionCreateThread extends Event<"threadCreate"> {
  event = "threadCreate" as const;

  name = "SolutionCreateThread";

  async handle(
    thread: AnyThreadChannel<boolean>,
    newlyCreated: boolean,
  ): Promise<EventHandleResult> {
    if (
      thread.parentId !== env.HELP_CHANNEL_ID
      || thread.type !== ChannelType.PublicThread
      || !newlyCreated
    ) {
      return ok(true);
    }

    const embed = new EmbedBuilder()
      .setTitle("Post crée !")
      .setDescription(
        ":white_check_mark: Une fois le post résolu, vous pouvez marquer le message qui vous a aidé avec : `clic droit -> Applications -> Marquer comme solution.`",
      )
      .setColor("#5865f2")
      .setImage(
        "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXRzOXowMjF3c3IzNnJtc2RrcDB4a3J2YTdjNnp1MzNmMDhmY2Q5dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Gj1ZajxelyQtMQc4ar/giphy.gif",
      );

    await thread.send({ embeds: [embed] });

    return ok("Solution information message send");
  }
}
