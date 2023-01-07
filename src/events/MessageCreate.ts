import { ProxiaEvent } from "../classes/Event.js";
import { proxiaWebhookPrefix } from "../utils/constants.js";
import { logger } from "../utils/logger.js";
import { getUserId } from "../utils/users.js";
import axios from "axios";
import { ButtonStyle } from "discord-api-types/v9";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ChannelType,
  DataResolver,
  Embed,
  Guild,
  GuildMember,
  Message,
  MessagePayloadOption,
  StickerFormatType,
} from "discord.js";
import mimeTypes from "mime-types";
import { randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

type ChannelWarningTimeCache = {
  [guildId: string]: {
    [channelId: string]: number;
  };
};

export class ProxiaMessageEvent extends ProxiaEvent {
  static warningCache: ChannelWarningTimeCache = {};

  events: ProxiaEventEmitter[] = ["messageCreate"];
  requiredIntents?: ResolvableIntentString[] = ["GuildMessages"];

  public async run(_event: ProxiaEventEmitter, msg: Message) {
    logger.info("MessageCreate");
    if (
      !msg ||
      !msg.content ||
      !msg.author ||
      !msg.channel ||
      !msg.guildId ||
      // msg.content.endsWith("s8Ignore") ||
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
      logger.error(`Guild ${guild.id} does not exist in database?`);
      return;
    }

    const ignoredChannels = await this.bot.db.getIgnoredChannels(guild.id);

    if (
      ignoredChannels === undefined ||
      ignoredChannels.includes(msg.channelId) ||
      guildDb.disabled
    ) {
      return;
    }

    const channelWebhooks = await msg.channel.fetchWebhooks();

    const availableWebhooks = [
      ...channelWebhooks
        .filter(
          (webhook) =>
            webhook.name.startsWith(proxiaWebhookPrefix) || webhook.owner?.id === this.bot.user?.id,
        )
        .values(),
    ];

    if (availableWebhooks.length === 0) {
      const webhook = await msg.channel.createWebhook({
        name: `${proxiaWebhookPrefix}${randomUUID()}`,
      });

      await this.bot.db.addWebhook({
        id: webhook.id,
        channel_id: webhook.channelId,
        guild_id: webhook.guildId,
        name: webhook.name,
        token: webhook.token as string,
        created_timestamp: webhook.createdTimestamp,
      });

      availableWebhooks.push(webhook);
    }

    const webhook = availableWebhooks[Math.floor(Math.random() * availableWebhooks.length)];

    // Yes, this is a guild member
    const member = msg.member as GuildMember;
    let user = await this.bot.db.getUser(member.id);

    if (!user) {
      // Well, how did we get here? *Letting the days go by...*
      user = await this.bot.db.createUser({
        id: member.user.id,
        username: member.user.username,
        discriminator: member.user.discriminator,
        recoverykey: randomBytes(32).toString("hex"),
        avatar_url: member.user.avatar,
        locale: "en-GB",
      });
    }

    let userGuildObj = user.guilds[msg.guildId];

    if (!userGuildObj) {
      userGuildObj = await this.bot.db.addUserToGuild(user.id, guild.id, {
        nickname: member.nickname || "",
        unique_id: await this.bot.utils.generateUserUniqueId(guild.id),
        preferred_avatar_url: member.avatar || "",
        roles: await this.bot.utils.calculateRoleUniqueIds(member.roles.cache, guild.id),
      });
    }

    const usernameString = `${member.nickname ?? msg.author.username} (${userGuildObj.unique_id})`;

    let replyComponent: Unpacked<MessagePayloadOption["components"]>;

    let replyMessage;
    if (msg.reference) {
      replyMessage = msg.channel.messages.resolve(msg.reference.messageId as string) as Message;
      const replyDbUser = await this.bot.db.getUser(
        getUserId(replyMessage.author.username) || replyMessage.author.id,
      );

      let user = "";

      user = !replyDbUser
        ? `${replyMessage.author.username}#${replyMessage.author.discriminator}`
        : `${replyDbUser.username}#${replyDbUser.discriminator}`;

      replyComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("replyauthor")
          .setLabel(user)
          .setStyle(ButtonStyle.Primary)
          .setURL(replyMessage.url)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("replypreview")
          .setLabel(
            replyMessage.content.length > 0
              ? replyMessage.content.slice(0, Math.max(0, length)).trim() +
                  (replyMessage.content.length < length ? "" : "...")
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
        msg.content = msg.content.replace(
          new RegExp(`<(?:@[!&]?|#)${mention.id}>`, "g"),
          mentionCache[mention.id].id,
        );
      }
    }

    // const stickers: Sticker[] = [...msg.stickers.values()];
    const attachments: {
      type: "attachment" | "sticker";
      attBuilder: AttachmentBuilder;
    }[] = [];
    const embeds: Embed[] = [];

    // Process attachments (Make sure to check guild boost level for attachments.)

    if (msg.attachments.size > 0) {
      for (const attachment of msg.attachments.values()) {
        let maxSize;

        switch (guild.premiumTier) {
          case 0:
          case 1:
          case 2: {
            maxSize = [52_428_800, "50MB"];
            break;
          }
          case 3: {
            // Preparing for the inevitable
            // maxSize = [524_288_000, "500MB"];
            maxSize = [100_857_600, "100MB"];
            break;
          }
          default: {
            maxSize = [8_388_608, "10MB"];
            break;
          }
        }

        if (attachment.size > maxSize[0]) {
          member.user.send(
            `One or more of your attachments was larger than ${maxSize[1]}, and thus cannot be reuploaded to a webhook.`,
          );
          return;
        }
      }

      for (const attachment of msg.attachments.values()) {
        const resolvedAttachment = await DataResolver.resolveFile(attachment.attachment);

        attachments.push({
          type: "attachment",
          attBuilder: new AttachmentBuilder(resolvedAttachment.data, {
            name: attachment.name as string,
            description: attachment.description || undefined,
          }),
        });
      }
    }

    // Process stickers

    if (msg.stickers.size > 0) {
      // A rare case
      if (attachments.length + msg.stickers.size > 10) {
        member.user.send(
          "Due to API limitations, we have to reupload stickers as attachments, and you the amount of stickers and attachments combined exceeds more than 10, Which is discords file limit per message. Only the attachments will be sent for this message",
        );
      } else {
        for (const sticker of msg.stickers.values()) {
          const res = await axios.get(sticker.url, {
            responseType: "stream",
          });

          const resolvedSticker = await DataResolver.resolveFile(res.data);

          attachments.push({
            type: "sticker",
            attBuilder: new AttachmentBuilder(resolvedSticker.data, {
              name:
                sticker.name +
                ((sticker.type as number) === StickerFormatType.PNG ||
                (sticker.type as number) === StickerFormatType.APNG
                  ? ".png"
                  : ".lottie"),
            }),
          });
        }
      }
    }

    // Process personal options like owoify and other things

    // Send the webhook

    const webhookResponse = await webhook.send({
      content: msg.content,
      username: usernameString,
      avatarURL: msg.author.displayAvatarURL(),
      allowedMentions: {
        parse: ["users"],
      },
      components: replyComponent && [replyComponent],
      files: attachments.map((a) => a.attBuilder),
      embeds,
      threadId: msg.hasThread && msg.thread ? msg.thread.id : undefined,
    });

    if (mentions.length > 0) {
      for (const mention in mentionCache) {
        msg.content = msg.content.replace(mentionCache[mention].id, mentionCache[mention].string);
      }
      await webhookResponse.edit({
        content: msg.content,
      });
    }

    await msg.delete();

    const createdTimestamp = webhookResponse.createdTimestamp || Date.now();
    await this.bot.db.addMessage({
      id: webhookResponse.id,
      guild_id: webhookResponse.guildId || msg.guildId,
      channel_id: webhookResponse.channelId,
      thread_id: webhookResponse.hasThread ? webhookResponse.thread?.id : undefined,
      user_unique_id: userGuildObj.unique_id,
      webhook_id: webhook.id,
      content: webhookResponse.content,
      avatar_url: msg.author.displayAvatarURL(),
      createdTimestamp,
      attachments: webhookResponse.attachments.map((e) => e.id),
      deleted: false,
      edits: [],
      reply:
        (replyMessage && { message_id: replyMessage.id, author_id: replyMessage.author.id }) ||
        undefined,
    });

    // for (const attachment of attachments.filter((e) => e.type === "attachment")) {
    if (this.bot.config.saveAttachments) {
      for (const attachment of webhookResponse.attachments.values()) {
        // Shorthand
        const attachDir = this.bot.config.attachmentsDirectory;

        const guildDir = path.join(attachDir, msg.guildId as string);

        const channelDir = path.join(guildDir, msg.channelId);

        const threadsDir = path.join(channelDir, "threads");

        const threadDir =
          (msg.thread && msg.channel.isThread() && path.join(threadsDir, msg.thread.id)) ||
          undefined;

        if (!fs.existsSync(channelDir)) await fsp.mkdir(channelDir, { recursive: true });

        if (threadDir && !fs.existsSync(threadDir)) fsp.mkdir(threadDir, { recursive: true });

        const destDir = threadDir || channelDir;

        const resolvedAttachment = await DataResolver.resolveFile(attachment.attachment);

        // I doubt this is neccessary but I just don't want to have files without extentions.
        const ext =
          attachment.name?.split(".").find((v, i, obj) => obj[obj.lastIndexOf(".")]) ||
          mimeTypes.lookup(attachment.contentType || "") ||
          undefined;

        const filePath = path.join(destDir, `${attachment.id}${(ext && `.${ext}`) || ""}`);
        await fsp.writeFile(filePath, resolvedAttachment.data);
        await this.bot.db.addAttachment(attachment.id, {
          // Unsure why attachment.name is assumed to be null, according to Discord docs, an attachments file name is required.
          filename: attachment.name as string,
          local_file_path: filePath,
          size: resolvedAttachment.data.length,
          spoiler: attachment.spoiler,
        });
      }
    }
  }
}
