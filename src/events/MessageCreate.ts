import { ProxiaEvent } from "classes/Event.js";
import { getUserId } from "utils/users.js";
import axios from "axios";
import { ButtonStyle } from "discord-api-types/v9";
import {
  ActionRowBuilder,
  Attachment,
  ButtonBuilder,
  ChannelType,
  DataResolver,
  Embed,
  Guild,
  GuildMember,
  Message,
  MessagePayloadOption,
} from "discord.js";
import { randomBytes } from "node:crypto";

export class ProxiaMessageEvent extends ProxiaEvent {
  static timeSinceLastWarning = -1;
  events: ProxiaEventEmitter[] = ["messageCreate"];
  requiredIntents?: ResolvableIntentString[] = ["GuildMessages"];

  public async run(_event: ProxiaEventEmitter, msg: Message) {
    if (
      !msg ||
      !msg.content ||
      !msg.author ||
      !msg.channel ||
      msg.content.endsWith("s8Ignore") ||
      msg.author.bot ||
      msg.channel.type !== ChannelType.GuildText
    )
      return;

    if (msg.content.startsWith("!") || msg.content.startsWith("-")) {
      setTimeout(() => {
        msg.delete();
      }, 1000);
      return;
    }

    const guild = msg.guild as Guild;
    const guildDb = await this.bot.db.getGuild(guild.id);

    if (!guildDb) {
      console.error(`Guild ${guild.id} does not exist in database?`);
      return;
    }

    const ignoredChannels = await this.bot.db.getIgnoredChannels(guild.id);

    if (ignoredChannels === undefined || ignoredChannels.includes(msg.channelId) || guildDb.disabled) {
      return;
    }

    const channelWebhooks = await msg.channel.fetchWebhooks();

    const availableWebhooks = [...channelWebhooks.filter((webhook) => webhook.name.startsWith("__PROXIA")).values()];

    if (availableWebhooks.length === 0) {
      if (Date.now() - 1000 * 60 * 30 > ProxiaMessageEvent.timeSinceLastWarning) {
        msg.channel.send({
          content:
            "There is currently no webhook setup for this channel. Run /setupwebhook to setup a webhook for this channel, or run /setupwebhooks for all channels in the guild.",
        });
        ProxiaMessageEvent.timeSinceLastWarning = Date.now();
      }
      return;
    }

    // Unsure why we're choosing at random. Maybe I did this at first because of ratelimits but even then,
    // There's no logic in place for rate limits.
    const webhook = availableWebhooks[Math.floor(Math.random() * availableWebhooks.length)];

    // Yes, this is a guild member
    const member = msg.member as GuildMember;
    const user = this.bot.db.getUser(member.id);

    if (!user) {
      // Well, how did we get here? *Letting the days go by...*
      console.error("Oh you've gotta be fucking kidding me.");
      console.error(`User does not exist in Database even though they should. User ID: ${member.id}`);
      return;
    }

    let replyComponent: Unpacked<MessagePayloadOption["components"]>;

    if (msg.reference) {
      const replyMessage = msg.channel.messages.resolve(msg.reference.messageId as string) as Message;
      const replyDbUser = await this.bot.db.getUser(getUserId(replyMessage.author.username) || replyMessage.author.id);

      replyComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("replyauthor")
          .setLabel(`${replyDbUser?.username}#${replyDbUser}`)
          .setStyle(ButtonStyle.Primary)
          .setURL(replyMessage.url)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("replypreview")
          .setLabel(
            replyMessage.content.length > 0
              ? replyMessage.content.slice(0, Math.max(0, length)).trim() + (replyMessage.content.length < length ? "" : "...")
              : "[Image/Attachment]",
          )
          .setStyle(ButtonStyle.Link),
      );
    }

    const mentions = [...msg.mentions.users.values()];

    const mentionCache: Record<
      string,
      {
        id: string;
        string: string;
      }
    > = {};

    if (mentions.length > 0 && guildDb?.ghost_hide_mentions) {
      for (const mention of mentions) {
        mentionCache[mention.id] = {
          id: randomBytes(2).toString("hex"),
          // @ts-expect-error Should not be null because there's mentions. If it's null, thats a regex issue and this regex is outdated.
          string: new RegExp(`<(?:@[!&]?|#)${mention.id}>`).exec(msg.content)[0],
        };
        msg.content = msg.content.replace(new RegExp(`<(?:@[!&]?|#)${mention.id}>`, "g"), mentionCache[mention.id].id);
      }
    }

    // const stickers: Sticker[] = [...msg.stickers.values()];
    const attachments: Attachment[] = [];
    const embeds: Embed[] = [];

    // Process attachments (Make sure to check guild boost level for attachments.)

    if ([...msg.attachments.values()].length > 0) {
      for (const attachment of msg.attachments.values()) {
        const resolvedAttachment = await DataResolver.resolveFile(attachment.attachment);
        resolvedAttachment.data;

        this.bot.config.attachmentsDirectory;
        // TODO: Finish
      }
    }

    // Process stickers

    // Process personal options like owoify and other things

    // Send the webhook

    webhook.send({
      components: replyComponent && [replyComponent],
    });
  }
}
