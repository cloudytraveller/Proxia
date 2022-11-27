import { ProxiaEvent } from "classes/Event.js";
import { ChannelType, Guild, Message } from "discord.js";

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

    if (msg.content.endsWith("s8Ignore")) {
      return;
    }
    const guild = msg.guild as Guild;
    this.bot.db.getIgnoredChannels(guild.id);

    console.log(msg.content);
  }
}
