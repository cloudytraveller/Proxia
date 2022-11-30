import { ProxiaEvent } from "classes/Event.js";
import { getUserId } from "utils/users.js";
import { ButtonStyle } from "discord-api-types/v9";
import {
  ActionRowBuilder,
  Attachment,
  ButtonBuilder,
  ChannelType,
  Embed,
  Guild,
  GuildMember,
  Message,
  MessagePayloadOption,
} from "discord.js";
import { randomBytes } from "node:crypto";

export class ProxiaMessageEvent extends ProxiaEvent {
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

    // eslint-disable-next-line eqeqeq
    if (ignoredChannels == undefined) {
      console.error("Guild does not have ignored_channels or is null");
      // Okay so fix it?No, I'm lazy. I'll implement that later.
      return;
    }

    if (ignoredChannels.includes(msg.channelId)) {
      return;
    }

    const channelWebhooks = await msg.channel.fetchWebhooks();

    const availableWebhooks = [...channelWebhooks.filter((webhook) => webhook.name.startsWith("__PROXIA")).values()];

    if (availableWebhooks.length === 0) {
      // Implement logic to allow 1 warning to be sent per 30 minutes stating that Proxia has no webhooks available and needs a command to run manually.
      // Or we could just do that right here right now.
      return;
    }

    // Unsure why we're choosing at random. Maybe I did this at first because of ratelimits but even then,
    // There's no logic in place for rate limits.
    const webhook = availableWebhooks[Math.floor(Math.random() * availableWebhooks.length)];

    const attachments: Attachment[] = [];
    const embeds: Embed[] = [];

    // Yes, this is a guild member
    const member = msg.member as GuildMember;
    const user = this.bot.db.getUser(member.id);

    if (!user) {
      // Well, how did we get here? *Letting the days go by...*
      console.error("Oh you've gotta be fucking kidding me.");
      return;
    }

    // const mentionCache = {};

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
        msg.content = msg.content.replace(new RegExp(`<(?:@[!&]?|#)${mention.id}>`, "g"), mentionobj[mention.id].id);
      }
    }

    // Process stickers

    // Process attachments (Make sure to check guild boost level for attachments.)

    // Process personal options like owoify and other things

    // Send the webhook

    webhook.send({
      components: replyComponent && [replyComponent],
    });
  }
}
