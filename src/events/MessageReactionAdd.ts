import type { MessageReaction, User } from "discord.js";
import { ProxiaEvent } from "../classes/Event.js";
import { getUserId } from "../utils/users.js";

export class ProxiaMessageReactionAddEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["messageReactionAdd"];
  requiredIntents?: ResolvableIntentString[] = ["GuildMessageReactions", "GuildMessages"];
  deleteEmotes = ["heavy_multiplication_x", "x", "wastebasket", "❌", "✖️", "🗑️"];

  public async run(_event: ProxiaEventEmitter, reaction: MessageReaction, user: User) {
    if (user.bot) return;

    const fetchedReaction = await reaction.fetch();
    if (
      !fetchedReaction.message.guildId ||
      !fetchedReaction.message.guild ||
      !fetchedReaction.message ||
      !fetchedReaction.message.author?.bot
    )
      return;

    // const dbMessage = await this.bot.db.getMessage(msgId, guildId, channelId, threadId);

    // if (!dbMessage) {
    //   return;
    // }

    if (this.deleteEmotes.includes(fetchedReaction.emoji.name || "")) {
      const messageUniqueId = getUserId(fetchedReaction.message.author.username);
      const dbUser = await this.bot.db.getUser(messageUniqueId || "");

      if (!dbUser) {
        return;
      }
      if (dbUser.id === user.id) {
        await fetchedReaction.message.delete();
        await this.bot.db.deleteMessage({
          id: fetchedReaction.message.id,
          channel_id: fetchedReaction.message.channelId,
          guild_id: fetchedReaction.message.guild?.id,
          thread_id: fetchedReaction.message.hasThread
            ? fetchedReaction.message.thread?.id
            : undefined,
        });
      } else {
        fetchedReaction.remove();
      }
    }
  }
}
