import type { EventHandleResult } from "arcscord";
import { anyToError, defaultLogger, error, Event, EventError, ok } from "arcscord";
import type { ButtonBuilder, Message } from "discord.js";
import { ActionRowBuilder } from "discord.js";
import { ThreadAutoArchiveDuration } from "discord.js";
import { ChannelType } from "discord.js";
import { env } from "../../utils/env/env.util";
import { parseTitle } from "./auto_threads.util";
import { renameLinkThreadBuilder } from "../../components/rename_link_thread/rename_link_thread.builder";

export class AutoTreads extends Event<"messageCreate"> {

  event = "messageCreate" as const;

  name = "AutoTreads";

  async handle(message: Message): Promise<EventHandleResult> {
    if (message.author.bot) {
      return ok(true);
    }

    if (message.guildId !== env.SERVER_ID || message.channelId !== env.LINKS_CHANNEL_ID) {
      return ok(true);
    }

    if (message.channel.type !== ChannelType.GuildText) {
      return error(new EventError({
        event: this,
        message: "invalid channel type for links channel",
        debugs: {
          get: message.channel.type,
          except: ChannelType.GuildText,
        },
      }));
    }

    const urlRegex = new RegExp(/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/, "g");

    const url = urlRegex.exec(message.content);

    // check if invalid message
    if (!url) {
      return await this.sendInvalid(message);
    }

    let body: string = "";

    try {
      const site = await fetch(url[0]);
      body = await site.text();
    } catch (err) {
      return error(new EventError({
        event: this,
        message: "failed to fetch site",
        baseError: anyToError(err),
        debugs: {
          url: url[0],
        },
      }));
    }

    let title = parseTitle(body, url[0]);

    if (title.length >= 99) {
      title = title.slice(0, 96) + "...";
    }

    try {
      const thread = await message.startThread({
        name: title,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      });
      await thread.send({
        content: "Fil crée automatiquement",
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(renameLinkThreadBuilder(message.author.id))],
      });
      return ok("thread created");
    } catch (e) {
      return error(new EventError({
        event: this,
        message: "failed to start thread",
        baseError: anyToError(e),
      }));
    }

  }

  async sendInvalid(message: Message): Promise<EventHandleResult> {
    try {
      const msg = await message.reply("Votre message ne contient pas de lien, merci de"
        + "répondre dans le fil en question et de supprimer votre message.");

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(async() => {
        const content = message.content;

        try {
          await msg.delete();
          await message.delete();
        } catch (e) {
          defaultLogger.logError(new EventError({
            event: this,
            message: "failed to auto delete invalid link warning",
            baseError: anyToError(e),
          }));
        }

        try {
          await message.author.send(`Ton message a été supprimé. C'était : \n\n ${content}`);
        } catch (e) {
          defaultLogger.logError(new EventError({
            event: this,
            message: "failed to send invalid link message",
            baseError: anyToError(e),
          }));
        }


      }, 60 * 1000);

      return ok("no-link");
    } catch (e) {
      return error(new EventError({
        event: this,
        message: "failed to send invalid link message",
        baseError: anyToError(e),
      }));
    }
  }

}