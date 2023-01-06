/* eslint-disable @typescript-eslint/naming-convention */
import type { TextChannel } from "discord.js";
import { logger } from "../utils/logger.js";
import { ProxiaEvent } from "../classes/Event.js";

export class ProxiaRawEvent extends ProxiaEvent {
  // @ts-expect-error raw data
  events: ProxiaEventEmitter[] = ["raw"];
  requiredIntents?: ResolvableIntentString[] = [];

  public async run(_event: ProxiaEventEmitter, packet: any) {
    if (packet.t !== "MESSAGE_DELETE") return;

    logger.debug("Recieved message delete packet", packet);

    const id = packet.d.id;
    const channel_id = packet.d.channel_id;
    const guild_id = packet.d.guild_id;

    const cachedGuild = await this.bot.guilds.cache.find((e) => e.id === (guild_id as string));
    if (!cachedGuild) return;
    logger.debug("Fetched cached guild");

    const cachedChannel = cachedGuild.channels.cache.find(
      (e) => e.id === (channel_id as string),
    ) as TextChannel;
    if (!cachedChannel) return;
    logger.debug("Fetched cached channel");

    const cachedMessage = cachedChannel.messages.cache.find((e) => e.id === id);
    if (cachedMessage) return;
    logger.debug("Message " + id + " is not cached");

    const dbMessage = await this.bot.db.getMessage(id, guild_id, channel_id);
    if (!dbMessage) return;

    logger.debug("Message " + id + " in database, deleting");
    await this.bot.db.deleteMessage({
      id,
      guild_id,
      channel_id,
    });
  }
}
