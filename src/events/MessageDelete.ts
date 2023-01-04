/* eslint-disable unicorn/no-await-expression-member */
import { ProxiaEvent } from "../classes/Event.js";
import { proxiaWebhookPrefix } from "utils/constants.js";
import { Collection, Message, PartialMessage, Snowflake } from "discord.js";

export class ProxiaMessageDeleteEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["messageDelete", "messageDeleteBulk"];
  requiredIntents: ResolvableIntentString[] = ["GuildMessages"];

  public async run(_event: ProxiaEventEmitter, message: Collection<Snowflake, Message> | Message) {
    if (message instanceof Collection) {
      for (const msg of message.values()) {
        this._deleteMessage(msg);
      }
    } else this._deleteMessage(message);
  }

  private async _deleteMessage(message: Message | PartialMessage) {
    const fetchedMessage = await message.fetch();

    if (
      !fetchedMessage.webhookId ||
      !(await fetchedMessage.fetchWebhook()).name.startsWith(proxiaWebhookPrefix)
    )
      return;

    try {
      this.bot.db.deleteMessage({
        id: fetchedMessage.id,
        channel_id: fetchedMessage.channelId,
        guild_id: fetchedMessage.guildId as string,
      });
    } catch {
      /* empty */
    }
  }
}
