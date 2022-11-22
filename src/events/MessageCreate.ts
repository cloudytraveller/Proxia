import { ProxiaEvent } from "classes/Event.js";
import { ChannelType, Message } from "discord.js";

export class ProxiaMessageEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["messageCreate"];
  requiredIntents?: ResolvableIntentString[] = ["GuildMessages"];

  public async run(_event: ProxiaEventEmitter, msg: Message) {
    if (!msg?.content || !msg.author || msg.author.bot || !msg.channel || msg.channel.type !== ChannelType.GuildText) return;

    if (msg.content.startsWith("!") || msg.content.startsWith("-")) {
      setTimeout(() => {
        msg.delete();
      }, 1000);
      return;
    }

    console.log(msg.content);
  }
}
