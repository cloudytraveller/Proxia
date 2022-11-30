/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */

// Typings in these functions will be scattered and casted, except return types.

// import type { Role, Guild, Message, Attachment, Webhook } from "knex/types/tables";
import { logger } from "utils/logger.js";
import { SnowflakeUtil } from "discord.js";
import Knex from "knex";

export class DatabaseManager {
  client: Knex.Knex;

  /**
   * Creates a new Proxia database
   */

  constructor() {
    this.client = Knex.default({
      client: "better-sqlite3",
      connection: {
        filename: "../../database/db.sqlite",
      },
    });
  }

  public async initSchema(): Promise<void> {
    // Oh god just kill me already
    if (!(await this.client.schema.hasTable("guilds"))) {
      await this.client.schema.createTable("guilds", (k) => {
        k.integer("id").unique();
        k.text("name");
      });
    }

    if (!(await this.client.schema.hasTable("users"))) {
      await this.client.schema.createTable("users", (k) => {
        k.text("id");
        k.text("username");
        k.text("discriminator");
        k.text("nickname");
        k.text("uniqueId");
        k.text("avatar_url");
        k.text("guilds");
        k.boolean("existent");
        k.text("roles");
        k.text("oauth2");
        k.boolean("banned");
        k.text("banned_reason");
        k.text("secret");
        k.boolean("seen_secret");
        k.text("personal_user_config");
      });
    }

    if (!(await this.client.schema.hasTable("messages"))) {
      await this.client.schema.createTable("messages", (k) => {
        k.text("id");
        k.text("webhook_id");
        k.text("avatar_url");
        k.text("content");
        k.text("created_timestamp");
        k.text("channel").defaultTo('{"id":null,"name":null}');
        k.text("user").defaultTo('{"id":null,"username":null,"discriminator":null,"avatar":null}');
        k.text("attachments").defaultTo("[]");
        k.boolean("deleted").defaultTo(false);
        k.text("edits").defaultTo("[]");
        k.text("reply");
      });
    }

    if (!(await this.client.schema.hasTable("roles"))) {
      await this.client.schema.createTable("roles", (k) => {
        k.text("name");
        k.text("id");
        k.text("unique_id");
        k.text("guild_id");
        k.boolean("existent");
      });
    }

    if (!(await this.client.schema.hasTable("attachments"))) {
      await this.client.schema.createTable("attachments", (k) => {
        k.text("id");
        k.text("guild_id");
        k.text("channel_id");
        k.text("message_id");
        k.text("filename");
        k.boolean("spoiler");
        k.integer("size");
        k.text("local_file_path");
      });
    }

    if (!(await this.client.schema.hasTable("webhooks"))) {
      await this.client.schema.createTable("webhooks", (k) => {
        k.text("id");
        k.text("name");
        k.text("token");
        k.text("channel_id");
        k.text("guild_id");
        k.text("channel_name");
        k.integer("created_timestamp");
      });
    }

    if (!(await this.client.schema.hasTable("guilds"))) {
      await this.client.schema.createTable("guilds", (k) => {
        k.text("id");
        k.text("owner_id");
        k.text("ignored_channels").defaultTo("[]");
        k.integer("disabled").defaultTo(false);
        k.boolean("hide_ghost_mentions").defaultTo(false);
      });
    }
  }

  /* BEGIN ROLES SECTION */
  // Mark message as deleted

  public async addRole(role: Omit<Role, "existent">): Promise<void> {
    await this.client<Role>("roles").insert({
      ...role,
      existent: true,
    });
  }

  public async roleExists(id: string, guild_id: string): Promise<boolean> {
    const result = await this.client<Role>("roles")
      .select("*")
      .where({
        id,
        guild_id,
      })
      .first();

    return !!result;
  }

  public async deleteRole(roleId: string, guildId: string): Promise<void> {
    if (await this.roleExists(roleId, guildId)) {
      return;
    }

    await this.client<Role>("roles")
      .where({
        id: roleId,
        guild_id: guildId,
      })
      .update("existent", false);
  }

  public async getRole(id: string, guild_id: string): Promise<Role | undefined> {
    const role = await this.client<Role>("roles")
      .select("*")
      .where({
        id,
        guild_id,
      })
      .first();

    return role;
  }

  public async getRoleByUniqueId(unique_id: string) {
    const role = await this.client<Role>("roles").select("*").where({ unique_id });
    return role;
  }

  public async getUniqueRoleIds(guild_id: string) {
    const roles = await this.client<Role>("roles").select("unique_id").where({ guild_id });
    const roleIds = roles.map((r) => r.unique_id);

    return roleIds;
  }

  /* END ROLES SECTION */

  /* BEGIN GUILD SECTION */

  public async guildExists(guild_id: string): Promise<boolean> {
    const result = await this.client<Guild>("guilds")
      .select("id")
      .where({
        id: guild_id,
      })
      .first();

    return !!result;
  }

  public async getGuild(guild_id: string): Promise<Guild | null> {
    const result = await this.client<Guild>("guilds").select().where("id", guild_id).first();

    return result || null;
  }

  public async addGuild(guild: Guild): Promise<void> {
    await this.client<Guild>("guilds").insert(guild);
  }

  public async updateGuild(guild_id: string, guild: Partial<Guild>): Promise<void> {
    await this.client<Guild>("guilds").update(guild).where("id", guild_id);
  }

  public async addIgnoredChannel(guild_id: string, ...args: string[]): Promise<string[] | null> {
    const ignoredChannels = await this.getIgnoredChannels(guild_id);

    if (!ignoredChannels) {
      return null;
    }

    for (const id of args) {
      try {
        SnowflakeUtil.decode(id);
      } catch {
        throw new Error("Invalid snowflake");
      }
    }

    ignoredChannels.push(...args);

    await this.client<Guild>("guilds").where("id", guild_id).update("ignored_channels", JSON.stringify(ignoredChannels)).first();

    return [...ignoredChannels];
  }

  public async setIgnoredChannels(guild_id: string, ignored_channels: string[]) {
    await this.client<Guild>("guilds").where("id", guild_id).update("ignored_channels", JSON.stringify(ignored_channels));
  }

  public async getIgnoredChannels(guild_id: string): Promise<string[] | null> {
    const result = await this.client<Guild>("guilds").select("ignored_channels", "id").where("id", guild_id).first();

    if (result == null) return null;

    try {
      return JSON.parse(result.ignored_channels || "f");
    } catch {
      logger.error(`ignored_channels for ${guild_id} was corrupted! Resetting to default`);
      await this.setIgnoredChannels(guild_id, []);
      return [];
    }
  }

  /* END GUILD SECTION */

  /* BEGIN MESSAGE SECTION */
  // I'm not entirely sure why I'm creating two functions that do the same thing.
  // I just don't want to select a full message object for `messageExists`
  public async getMessage(message_id: string, guild_id: string, channel_id?: string): Promise<Message | undefined> {
    // You're pissin' me off, Gordon.

    const result = await this.client<Message>("messages")
      .select()
      .where({
        id: message_id,
        guild_id,
        channel_id: channel_id == null ? undefined : channel_id,
      })
      .first();

    return result;
  }

  public async messageExists(message_id: string, guild_id: string, channel_id?: string): Promise<boolean> {
    const result = await this.client<Message>("messages")
      .select("id")
      .where({
        id: message_id,
        guild_id,
        channel_id: channel_id == null ? undefined : channel_id,
      })
      .first();

    return !!result;
  }

  public async deleteMessage(id: string, channel_id: string, guild_id: string): Promise<void> {
    // eh fuck.
    this.client<Message>("messages")
      .where({
        id,
        channel_id,
        guild_id,
      })
      .first()
      .update({
        deleted: true,
      });
  }

  public async addMessage(message: Message): Promise<Message> {
    const baseMessage: Message = {
      id: "",
      user_id: "",
      guild_id: "",
      channel_id: "",
      content: "",
      avatar_url: "",
      webhook_id: "",
      createdTimestamp: 0,
      attachments: [],
      deleted: false,
      edits: [],
      reply: {},
    };

    const newMessage: Record<any, any> = {};
    Object.assign(baseMessage, message);

    for (const object in baseMessage) {
      newMessage[object] = JSON.parse((baseMessage as unknown as Record<any, any>)[object]);
    }

    await this.client("messages").insert(baseMessage);
    return baseMessage;
  }

  public async addMessageEdit({
    message_id,
    guild_id,
    channel_id,
    new_content,
    edit_epoch,
  }: {
    message_id: string;
    guild_id: string;
    channel_id?: string;
    new_content: string;
    edit_epoch: number;
  }): Promise<void> {
    if (!(await this.messageExists(message_id, guild_id, channel_id))) throw new Error("Message does not exist");

    const dbResult = (await this.client<Message>("messages")
      .select("edits")
      .where({
        id: message_id,
        guild_id,
        channel_id: channel_id == null ? undefined : channel_id,
      })
      .first()) as unknown as { edits: string };

    const messageEdits = JSON.parse(dbResult.edits) as Message["edits"];

    messageEdits.push({ content: new_content, date: edit_epoch });
  }

  /* END MESSAGE SECTION */

  /* BEGIN USER SECTION */

  /**
   * @param id User ID or Unique ID
   */
  public async getUser(id: string): Promise<User | undefined> {
    // This might be a bad idea?
    const user = await this.client<User>("users").select().where("id", id).orWhere("uniqueId", id).first();

    return user;
  }

  /**
   * @param id User ID or Unique ID
   * @param obanned_reason Reason for ban
   */
  public async markUserBanned(id: string, banned_reason?: string) {
    await this.client<User>("users").where("id", id).orWhere("uniqueId", id).first().update({
      banned: true,
      banned_reason,
    });
  }


  /* END USER SECTION */
}
