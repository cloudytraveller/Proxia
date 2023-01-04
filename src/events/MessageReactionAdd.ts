import type { MessageReaction, User } from "discord.js";
import { ProxiaEvent } from "../classes/Event.js";
import { getUserId } from "utils/users.js";

export class ProxiaMessageReactionAddEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["messageReactionAdd"];
  requiredIntents?: ResolvableIntentString[] = ["GuildMessageReactions", "GuildMessages"];
  deleteEmotes = ["heavy_multiplication_x", "x", "wastebasket"];

  public async run(_event: ProxiaEventEmitter, reaction: MessageReaction, user: User) {
    if (user.bot) return;

    await reaction.message.fetch();
    if (
      !reaction.message.guildId ||
      !reaction.message.guild ||
      !reaction.message ||
      !reaction.message.author?.bot
    )
      return;

    // const dbMessage = await this.bot.db.getMessage(msgId, guildId, channelId, threadId);

    // if (!dbMessage) {
    //   return;
    // }

    if (this.deleteEmotes.includes(reaction.emoji.name || "")) {
      const messageUniqueId = getUserId(reaction.message.author.username);
      const dbUser = await this.bot.db.getUser(messageUniqueId || "");

      if (!dbUser) {
        return;
      }
      if (dbUser.id === user.id) {
        await reaction.message.delete();
        await this.bot.db.deleteMessage({
          id: reaction.message.id,
          channel_id: reaction.message.channelId,
          guild_id: reaction.message.guild?.id,
          thread_id: reaction.message.hasThread ? reaction.message.thread?.id : undefined,
        });
      } else {
        reaction.remove();
      }
    }
  }
}
