import { ProxiaEvent } from "classes/Event.js";
import { Collection, Message, PartialMessage, Snowflake } from "discord.js";

export class ProxiaMessageDeleteEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["messageDelete", "messageDeleteBulk"];
  requiredIntents?: ResolvableIntentString[] = ["GuildMessages"];

  public async run(_event: ProxiaEventEmitter, msg: Collection<Snowflake, Message> | Message) {
    if (msg instanceof Collection) [...msg].forEach((e) => this._deleteMessage(e[1]));
    else this._deleteMessage(msg);
  }

  private async _deleteMessage(message: Message | PartialMessage) {
    if (!message.webhookId) return;

    // There's probably some other checks we have to do here.

    const fetchedMessage = await message.fetch();
    try {
      this.bot.db.deleteMessage(fetchedMessage.id, fetchedMessage.channelId, fetchedMessage.guildId as string);
    } catch {
      // do nothing
    }
  }
}
