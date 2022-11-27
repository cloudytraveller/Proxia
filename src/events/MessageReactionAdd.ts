import { ProxiaEvent } from "classes/Event.js";
import type { ChannelType, Message, MessageReaction } from "discord.js";

export class ProxiaMessageReactionAddEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["messageReactionAdd"];
  requiredIntents?: ResolvableIntentString[] = ["GuildMessageReactions", "GuildMessages"];

  public async run(_event: ProxiaEventEmitter, msgReaction: MessageReaction) {

  }
}
