import type { EventHandleResult } from "arcscord";
import type { ButtonBuilder, Message } from "discord.js";
import { renameLinkThreadBuilder } from "@/components/rename_link_thread/rename_link_thread.builder";
import { env } from "@/utils/env/env.util";
import { anyToError, defaultLogger, error, Event, EventError, ok } from "arcscord";
import { ActionRowBuilder, ChannelType, ThreadAutoArchiveDuration } from "discord.js";
import { parseTitle } from "./auto_threads.util";

export class AutoTreads extends Event<"messageCreate"> {
  event = "messageCreate" as const;

  name = "AutoTreads";

  async handle(message: Message): Promise<EventHandleResult> {
    if (message.author.bot) {
      return ok(true);
    }

    if (message.guildId !== env.SERVER_ID) {
      return ok(true);
    }

    switch (message.channelId) {
      case env.LINKS_CHANNEL_ID: {
        return await this.linkChannel(message);
      }

      case env.PRESENTATION_CHANNEL_ID: {
        return await this.presentation(message);
      }

      default: {
        return ok(true);
      }
    }
  }

  async sendInvalid(message: Message): Promise<EventHandleResult> {
    try {
      const msg = await message.reply("Votre message ne contient pas de lien, merci de"
        + "répondre dans le fil en question et de supprimer votre message.");

      setTimeout(async () => {
        const content = message.content;

        try {
          await msg.delete();
          await message.delete();
        }
        catch (e) {
          defaultLogger.logError(new EventError({
            event: this,
            message: "failed to auto delete invalid link warning",
            baseError: anyToError(e),
          }));
        }

        try {
          await message.author.send(`Ton message a été supprimé. C'était : \n\n ${content}`);
        }
        catch (e) {
          defaultLogger.logError(new EventError({
            event: this,
            message: "failed to send invalid link message",
            baseError: anyToError(e),
          }));
        }
      }, 60 * 1000);

      return ok("no-link");
    }
    catch (e) {
      return error(new EventError({
        event: this,
        message: "failed to send invalid link message",
        baseError: anyToError(e),
      }));
    }
  }

  async linkChannel(message: Message): Promise<EventHandleResult> {
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
    // eslint-disable-next-line prefer-regex-literals,regexp/no-unused-capturing-group,regexp/optimal-quantifier-concatenation,regexp/no-useless-flag,regexp/no-dupe-disjunctions
    const urlRegex = new RegExp(/(http|https):\/\/(\w+(?::\w*)?@)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%@\-/]))?/, "g");

    const url = urlRegex.exec(message.content);

    // check if invalid message
    if (!url) {
      return await this.sendInvalid(message);
    }

    let body: string = "";

    try {
      const site = await fetch(url[0]);
      body = await site.text();
    }
    catch (err) {
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
      title = `${title.slice(0, 96)}...`;
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
    }
    catch (e) {
      return error(new EventError({
        event: this,
        message: "failed to start thread",
        baseError: anyToError(e),
      }));
    }
  }

  async presentation(message: Message): Promise<EventHandleResult> {
    if (message.channel.type !== ChannelType.GuildText) {
      return error(new EventError({
        event: this,
        message: "invalid channel type for presentation channel",
        debugs: {
          get: message.channel.type,
          except: ChannelType.GuildText,
        },
      }));
    }

    try {
      await message.startThread({
        name: `Bienvenue ${message.author.displayName} !`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      });
    }
    catch (e) {
      return error(new EventError({
        event: this,
        message: "failed to start thread",
        baseError: anyToError(e),
      }));
    }

    try {
      await message.member?.roles.add(env.LYNX_ROLE_ID);
      await message.member?.roles.remove(env.VERIFY_ROLE_ID);
    }
    catch (e) {
      return error(new EventError({
        event: this,
        message: "failed to add lynx role",
        baseError: anyToError(e),
      }));
    }

    return ok("presentation-ok");
  }
}
