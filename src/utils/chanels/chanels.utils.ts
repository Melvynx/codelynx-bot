import type { ArcClient } from "arcscord";
import { ChannelType } from "discord.js";
import { env } from "../env/env.util";

/**
 * Permet d'avoir un channel par son id
 * @param client Le client du bot
 * @param id L'id du channel voulu
 * @returns Une promesse qui fournie le channel
 */
export const getChanelByIdAsync = (client: ArcClient, id: string) => client.channels.fetch(id);

/**
 * Get tout les channels présent dans une catégorie
 * @param client Le client du bot
 * @param categoryId L'id de la catégorie contenant l'ensemble des salons souhaiter
 * @returns Un Array des channel contenue dans la catégorie si cette dernière existe ou alors null
 */
export async function getChannelsByCategoryIdAsync(client: ArcClient, categoryId: string) {
  const category = await client.channels.fetch(categoryId);
  if (!category || category.type !== ChannelType.GuildCategory)
    return null;

  return category.children.valueOf().map(c => c);
}

/**
 * Get tout les channels de ticker Create Claim et Close
 * @param client Le client du bot
 * @returns un array de channels
 */
export async function getTicketsChannels(client: ArcClient) {
  const createdCategory = await client.channels.fetch(env.CREATE_TICKET_CATEGORY_ID);
  if (!createdCategory || createdCategory.type !== ChannelType.GuildCategory)
    return null;

  const claimedCategory = await client.channels.fetch(env.CLAIMED_TICKET_CATEGORY_ID);
  if (!claimedCategory || claimedCategory.type !== ChannelType.GuildCategory)
    return null;

  const closedCategory = await client.channels.fetch(env.CLOSED_TICKET_CATEGORY_ID);
  if (!closedCategory || closedCategory.type !== ChannelType.GuildCategory)
    return null;

  return [
    ...createdCategory.children.valueOf().map(c => c),
    ...claimedCategory.children.valueOf().map(c => c),
    ...closedCategory.children.valueOf().map(c => c),
  ];
}
