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
        k.text("avatar_url");
        k.text("guilds");
        k.text("oauth2");
        k.text("recoverykey");
        k.boolean("seen_recoverykey");
        k.text("recoverykey_timestamps");
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
        k.text("thread_id");
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
        k.text("ignored_channels");
        k.boolean("hide_ghost_mentions").defaultTo(false);
        k.integer("disabled").defaultTo(false);
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

  public async updateRole(roleId: string, optionsToUpdate: Partial<Role>) {

    await this.client<Role>("roles").update(optionsToUpdate).where("id", roleId);

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

  public async getRoleByUniqueId(unique_id: string, guild_id: string) {
    const role = await this.client<Role>("roles").select("*").where({ unique_id, guild_id });
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

    return databaseJsonParse(result) || null;
  }

  public async addGuild(guild: Guild): Promise<void> {
    await this.client<Guild>("guilds").insert(parseToDatabaseJson(guild));
  }

  public async updateGuild(guild_id: string, guild: Partial<Guild>): Promise<void> {
    await this.client<Guild>("guilds").update(guild).where("id", guild_id);
  }

  public async addIgnoredChannel(guild_id: string, ...args: string[]): Promise<string[] | null> {
    const ignoredChannels = await this.getIgnoredChannels(guild_id);

    if (!ignoredChannels) {
      return null;
    }

    // for (const id of args) {
    //   try {
    //     SnowflakeUtil.decode(id);
    //   } catch {
    //     throw new Error("Invalid snowflake");
    //   }
    // }

    ignoredChannels.push(...args);

    await this.client<Guild>("guilds").where("id", guild_id).update("ignored_channels", JSON.stringify(ignoredChannels)).first();

    return [...ignoredChannels];
  }

  public async setIgnoredChannels(guild_id: string, ignored_channels: string[]) {
    await this.client<Guild>("guilds").where("id", guild_id).update("ignored_channels", JSON.stringify(ignored_channels));
  }

  public async getIgnoredChannels(guild_id: string): Promise<string[] | undefined> {
    const result = await this.client<Guild>("guilds").select("ignored_channels", "id").where("id", guild_id).first();

    if (result === undefined) {
      return undefined;
    }

    const parsedResult = databaseJsonParse(result);

    // I think this is right?
    if (result == null || parsedResult == null || parsedResult.ignored_channels === null) {
      logger.error(`ignored_channels for ${guild_id} was corrupted! Resetting to default`);
      await this.setIgnoredChannels(guild_id, []);
      return [];
    }

    return parsedResult.ignored_channels;
  }

  /* END GUILD SECTION */

  /* BEGIN MESSAGE SECTION */
  // I'm not entirely sure why I'm creating two functions that do the same thing.
  // I just don't want to select a full message object for `messageExists`
  public async getMessage(message_id: string, guild_id: string, channel_id?: string): Promise<Message | null | undefined> {
    // You're pissin' me off, Gordon.

    const result = await this.client<Message>("messages")
      .select()
      .where({
        id: message_id,
        guild_id,
        channel_id: channel_id == null ? undefined : channel_id,
      })
      .first();

    return databaseJsonParse(result);
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
      newMessage[object] = parseToDatabaseJson((baseMessage as unknown as Record<any, any>)[object]);
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

    const dbResult = databaseJsonParse(
      await this.client<Message>("messages")
        .select("edits")
        .where({
          id: message_id,
          guild_id,
          channel_id: channel_id == null ? undefined : channel_id,
        })
        .first(),
    );

    if (!dbResult) throw new Error("Message does not exist");

    dbResult.edits.push({ content: new_content, date: edit_epoch });

    await this.client<Message>("messages").update(
      "edits",
      parseToDatabaseJson([...dbResult.edits, { content: new_content, date: edit_epoch }]),
    );
  }

  /* END MESSAGE SECTION */

  /* BEGIN USER SECTION */

  /**
   * @param id User ID
   */
  public async getUser(id: string): Promise<User | undefined> {
    const user = await this.client<User>("users").select().where("id", id).first();
    return user;
  }

  /**
   * @param id User ID or Unique ID
   * @param obanned_reason Reason for ban
   */
  public async updateUserBan(id: string, guild_id: string, banned: boolean, banned_reason?: string) {
    // await this.client<User>("users").where("id", id).orWhere("uniqueId", id).first().update({
    //   banned: true,
    //   banned_reason,
    // });

    const userPartial = databaseJsonParse(await this.client<User>("users").select("guilds").where({ id }).first());

    if (!userPartial) {
      return null;
    }

    const guildIndex = userPartial?.guilds.findIndex((guild) => guild.id === guild_id);

    if (guildIndex === -1) {
      return null;
    }

    userPartial.guilds[guildIndex].banned = banned;
    userPartial.guilds[guildIndex].banned_reason = banned_reason || "";

    try {
      await this.client<User>("users").where({ id }).update("guilds", parseToDatabaseJson(userPartial.guilds));
    } catch (error) {
      logger.error("Error updating guild ban to user", error);
      return false;
    }

    return true;
  }

  public async isUserBanned(id: string, guild_id: string): Promise<boolean | null> {
    const user = databaseJsonParse(await this.client<User>("users").select("id", "guilds").where({ id }).first());

    if (!user) {
      return null;
    }

    const guild = user.guilds.find((guild) => guild.id === guild_id);

    if (!guild) {
      return null;
    }

    return guild.banned;
  }

  /* END USER SECTION */

  /* BEGIN ATTACHMENTS SECTION */

  public async addAttachment(attachment: Attachment) {

  }
  /* END ATTACHMENTS SECTION */
}

function parseToDatabaseJson(obj: any): any {
  if (Array.isArray(obj)) {
    return JSON.stringify(obj);
  } else if (typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      // @ts-expect-error (insert reason here)
      newObj[key] = stringifyObjects(obj[key]);
    }
    return newObj;
  } else {
    return obj;
  }
}

function databaseJsonParse<T>(obj: T): T | null {
  if (typeof obj === "string") {
    try {
      return JSON.parse(obj);
    } catch {
      return null;
    }
  } else if (typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      // @ts-expect-error (insert reason here)
      newObj[key] = databaseJsonParse(obj[key]);
    }
    // @ts-expect-error Shut up, grandpa
    return newObj;
  } else {
    return obj;
  }
}
