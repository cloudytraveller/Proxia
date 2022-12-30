/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */

/**
 *
 * This Database Manager aims to make it simpler to access and modify database data
 * Database Spec:
 *
 * - Logic must check if an item exists when updating an item, and throw an error if it does not exist. Otherwise return undefined
 * - Logic will always return the new object that has the updated values
 * - Logic must alway translate database results, such as onces that can be parse as JSON objects.
 */

import {
  AttachmentExistsError,
  GuildExistsError,
  GuildNotExistError,
  MessageExistsError,
  MessageNotExistError,
  RoleExistError,
  RoleNotExistError,
  UserNotExistError,
  UserNotInGuildError,
} from "./Errors.js";
import { Schema as ParsedDatabaseSchema } from "ParsedDatabaseSchema.js";
import { logger } from "utils/logger.js";
import Knex from "knex";

export class DatabaseManager {
  client: Knex.Knex;

  constructor() {
    this.client = Knex.knex({
      client: "better-sqlite3",
      connection: {
        filename: "../../database/db.sqlite",
      },
    });
  }

  public async initSchema(): Promise<void> {
    type Column = {
      name: string;
      type: "text" | "boolean" | "integer" | "binary";
      unique?: boolean;
    };

    type Table = {
      name: string;
      columns: Column[];
    };

    // @ts-expect-error It'll be fine
    const tables: Table[] = ParsedDatabaseSchema;

    for (const table in tables) {
      if (!(await this.client.schema.hasTable(table))) {
        await this.client.schema.createTable(table, (k) => {
          // Add the necessary columns for each table
          for (const column of tables[table].columns) {
            const e = k[column.type](column.name);
            if (column.unique) e.unique();
          }
        });
      } else {
        // Check if the table has the necessary columns and add them if they don't exist
        for (const column of tables[table].columns) {
          if (!(await this.client.schema.hasColumn(table, column.name))) {
            await this.client.schema.table(table, (k) => {
              const e = k[column.type](column.name);
              if (column.unique) e.unique();
            });
          }
        }
      }

      // Get a list of all the columns in the actual database table
      const existingColumns = await this.client.raw<{ name: string }[]>(
        `PRAGMA table_info(${table});`,
      );

      // Iterate through the existing columns and delete any that aren't in the schema
      for (const column of existingColumns) {
        if (!tables[table].columns.some((c) => c.name === column.name)) {
          await this.client.schema.table(table, (k) => {
            k.dropColumn(column.name);
          });
        }
      }
    }
  }

  /* BEGIN ROLES SECTION */
  // Mark message as deleted

  public async addRole(role: Omit<Role, "existent">): Promise<void> {
    if (await this.roleExists(role.id, role.guild_id)) throw new RoleExistError();
    await this.client<Role>("roles").insert({
      ...role,
      existent: true,
    });
  }

  public async deleteRole(roleId: string, guildId: string): Promise<void> {
    if (!(await this.roleExists(roleId, guildId))) throw new RoleNotExistError();

    await this.client<Role>("roles")
      .where({
        id: roleId,
        guild_id: guildId,
      })
      .update("existent", false);
  }

  public async roleExists(id: string, guild_id: string): Promise<boolean> {
    const result = await this.client<Role>("roles")
      .select()
      .where({
        id,
        guild_id,
      })
      .first();

    return !!result;
  }

  public async updateRole(id: string, guild_id: string, optionsToUpdate: Partial<Role>) {
    if (!(await this.roleExists(id, guild_id))) throw new RoleNotExistError();

    await this.client<Role>("roles").update(optionsToUpdate).where({
      id,
      guild_id,
    });
  }

  public async getRole(id: string, guild_id: string): Promise<Role | undefined> {
    const role = await this.client<Role>("roles")
      .select()
      .where({
        id,
        guild_id,
      })
      .first();

    return role;
  }

  public async getRoles(guild_id: string): Promise<Role[]> {
    if (!(await this.guildExists(guild_id))) throw new GuildNotExistError();
    const roles = await this.client<Role>("roles").select().where({ guild_id });

    return roles || [];
  }

  public async getRoleByUniqueId(unique_id: string, guild_id: string) {
    return this.client<Role>("roles").select().where({ unique_id, guild_id });
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

  public async getGuild(guild_id: string): Promise<Guild | undefined> {
    const result = parseFromDatabaseJson(
      await this.client<Guild>("guilds").select().where("id", guild_id).first(),
    );

    return result;
  }

  public async addGuild(guild: Guild): Promise<Guild> {
    if (await this.guildExists(guild.id)) {
      throw new GuildExistsError();
    }
    await this.client<Guild>("guilds").insert(parseToDatabaseJson(guild));

    return parseFromDatabaseJson(
      this.client<Guild>("guilds").select().where({ id: guild.id }).first(),
    ) as unknown as Guild;
  }

  public async updateGuild(guild_id: string, guild: Partial<Guild>): Promise<void> {
    if (!(await this.guildExists(guild_id))) throw new GuildNotExistError();

    await this.client<Guild>("guilds").update(parseToDatabaseJson(guild)).where("id", guild_id);
  }

  public async getIgnoredChannels(guild_id: string): Promise<string[]> {
    if (!(await this.guildExists(guild_id))) throw new GuildNotExistError();

    const result = await this.client<Guild>("guilds")
      .select("ignored_channels", "id")
      .where("id", guild_id)
      .first();

    const parsedResult = parseFromDatabaseJson(result);

    if (parsedResult == null || parsedResult.ignored_channels == null) {
      logger.error(`ignored_channels for ${guild_id} was corrupted! Resetting to default`);
      await this.setIgnoredChannels(guild_id, []);
      return [];
    }

    return parsedResult.ignored_channels;
  }

  public async addIgnoredChannels(guild_id: string, ...args: string[]): Promise<string[]> {
    let ignoredChannels = await this.getIgnoredChannels(guild_id);

    if (!ignoredChannels) {
      ignoredChannels = [];
    }

    // for (const id of args) {
    //   try {
    //     SnowflakeUtil.decode(id);
    //   } catch {
    //     throw new Error("Invalid snowflake");
    //   }
    // }

    ignoredChannels.push(...args);

    await this.client<Guild>("guilds")
      .where("id", guild_id)
      .update("ignored_channels", JSON.stringify(ignoredChannels))
      .first();

    return [...ignoredChannels];
  }

  public async removedIgnoredChannels(guild_id: string, ...channel_ids: string[]): Promise<Guild> {
    if (!(await this.guildExists(guild_id))) throw new GuildNotExistError();

    const guild = (await this.getGuild(guild_id)) as Guild;

    const ignoredChannels = guild.ignored_channels.filter((e) => !channel_ids.includes(e));

    return this.setIgnoredChannels(guild_id, ignoredChannels);
  }

  public async setIgnoredChannels(guild_id: string, ignored_channels: string[]): Promise<Guild> {
    if (!(await this.guildExists(guild_id))) throw new GuildNotExistError();

    await this.client<Guild>("guilds")
      .where("id", guild_id)
      .update("ignored_channels", JSON.stringify(ignored_channels));

    return this.client<Guild>("guilds").select().where("id", guild_id).first() as unknown as Guild;
  }

  public async getUniqueIdsForGuild(guild_id: string): Promise<string[]> {
    const users = await this.client<User>("users").select();

    const usedIds: string[] = [];

    for (const user of users) {
      for (const guildId in user.guilds) {
        if (guildId === guild_id) {
          usedIds.push(user.guilds[guildId].unique_id);
        }
      }
    }
    return usedIds;
  }

  /* END GUILD SECTION */

  /* BEGIN MESSAGE SECTION */
  // I'm not entirely sure why I'm creating two functions that do the same thing.
  // I just don't want to select a full message object for `messageExists`
  public async getMessage(
    message_id: string,
    guild_id: string,
    channel_id?: string,
  ): Promise<Message | undefined> {
    const result = await this.client<Message>("messages")
      .select()
      .where({
        id: message_id,
        guild_id,
        channel_id: channel_id == null ? undefined : channel_id,
      })
      .first();

    return parseFromDatabaseJson(result);
  }

  public async messageExists(
    message_id: string,
    guild_id: string,
    channel_id?: string,
  ): Promise<boolean> {
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
    if (await this.messageExists(message.id, message.guild_id, message.channel_id))
      throw new MessageExistsError();
    const baseMessage: Message = {
      id: "",
      user_unique_id: "",
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

    Object.assign(baseMessage, message);

    await this.client("messages").insert(parseToDatabaseJson(baseMessage));

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
    if (!(await this.messageExists(message_id, guild_id, channel_id)))
      throw new MessageNotExistError();

    const dbResult = parseFromDatabaseJson(
      await this.client<Message>("messages")
        .select("edits")
        .where({
          id: message_id,
          guild_id,
          channel_id: channel_id == null ? undefined : channel_id,
        })
        .first(),
    );

    if (!dbResult) throw new MessageNotExistError();

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

  public async getUser(id: string): Promise<User | null | undefined> {
    const user = parseFromDatabaseJson(
      await this.client<User>("users").select().where("id", id).first(),
    );
    return user;
  }

  public async createUser(
    user: Omit2<User, "oauth2" | "recoverykey_timestamps" | "seen_recoverykey" | "guilds">,
  ): Promise<User> {
    const baseUser: User = {
      id: "",
      username: "",
      discriminator: "",
      avatar_url: "",
      guilds: {},
      recoverykey: "",
      seen_recoverykey: false,
      recoverykey_timestamps: [],
    };

    const newUser: Record<any, any> = {};
    Object.assign(baseUser, user);

    for (const object in baseUser) {
      newUser[object] = parseToDatabaseJson((baseUser as unknown as Record<any, any>)[object]);
    }

    await this.client<User>("users").insert(baseUser);
    // return thing
    return parseFromDatabaseJson(
      await this.client<User>("users").select().where("id", baseUser.id).first(),
    ) as User;
  }

  public async updateUserGuild(
    id: string,
    guild_id: string,
    guild: Partial<User["guilds"][number]>,
  ) {
    const user = parseFromDatabaseJson(
      await this.client<User>("users").select().where({ id }).first(),
    );

    if (!user) {
      throw new UserNotExistError();
    }

    if (!user.guilds) {
      user.guilds = {};
    }

    Object.assign(user.guilds[guild_id], guild);

    await this.client<User>("users").update("guilds", parseToDatabaseJson(user.guilds));
  }

  public async addUserToGuild(
    id: string,
    guild_id: string,
    guild: Omit2<User["guilds"][number], "banned" | "banned_reason" | "existent">,
  ): Promise<User["guilds"][number]> {
    const user = parseFromDatabaseJson(
      await this.client<User>("users").select().where({ id }).first(),
    );

    if (!user) throw new UserNotExistError();

    if (!(await this.guildExists(guild_id))) throw new GuildNotExistError();

    const guildUserBase: User["guilds"][number] = {
      nickname: "",
      existent: true,
      banned: false,
      banned_reason: "",
      preferred_avatar_url: "",
      roles: [],
      unique_id: "",
    };

    if (!user.guilds) {
      user.guilds = {};
    }

    Object.assign(guildUserBase, guild);

    user.guilds[guild_id] = guildUserBase;

    await this.client<User>("users").update("guilds", parseToDatabaseJson(user.guilds)).where({ id });

    const updatedUser = parseFromDatabaseJson(
      await this.client<User>("users").select().where({ id }).first(),
    ) as User;

    return updatedUser.guilds[guild_id];
  }

  public async updateUser(id: string, userUpdatable: Optional<Omit2<User, "guilds">>) {
    const user = parseFromDatabaseJson(
      await this.client<User>("users").select().where({ id }).first(),
    );

    if (!user) {
      throw new UserNotExistError();
    }

    Object.assign(user, userUpdatable);

    await this.client<User>("users")
      .update(parseToDatabaseJson(userUpdatable))
      .where({ id })
      .first();

    return parseFromDatabaseJson(this.client<User>("users").select().where({ id }).first());
  }

  /**
   * @param id User ID
   * @param obanned_reason Reason for ban
   */
  public async updateUserBan(
    id: string,
    guild_id: string,
    banned: boolean,
    banned_reason?: string,
  ): Promise<User> {
    const userPartial = parseFromDatabaseJson(
      await this.client<User>("users").select("guilds").where({ id }).first(),
    );

    if (!userPartial) {
      throw new UserNotExistError();
    }

    if (userPartial?.guilds[guild_id]) {
      throw new UserNotInGuildError();
    }

    userPartial.guilds[guild_id].banned = banned;
    userPartial.guilds[guild_id].banned_reason = banned_reason || "";

    await this.client<User>("users")
      .where({ id })
      .update("guilds", parseToDatabaseJson(userPartial.guilds));

    return parseFromDatabaseJson(
      this.client<User>("users").select().where({ id }).first(),
    ) as unknown as User;
  }

  public async isUserBanned(id: string, guild_id: string): Promise<boolean | null> {
    const user = parseFromDatabaseJson(
      await this.client<User>("users").select("id", "guilds").where({ id }).first(),
    );

    if (!user) {
      throw new UserNotExistError();
    }

    const guild = user.guilds[guild_id];

    if (!user?.guilds[guild_id]) {
      throw new UserNotInGuildError();
    }

    return guild.banned;
  }

  /* END USER SECTION */

  /* BEGIN ATTACHMENTS SECTION */

  public async addAttachment(
    id: string,
    attachment: Omit2<Attachment, "deleted" | "id">,
  ): Promise<Attachment> {
    const attachmentExists = await this.client("attachments").select("id").where({ id });

    if (attachmentExists) throw new AttachmentExistsError();

    await this.client<Attachment>("attachments").insert({
      ...attachment,
      deleted: false,
    });

    return this.client("attachments").select().where({ id }).first() as unknown as Attachment;
  }

  public async deleteAttachment(id: string) {
    await this.client<Attachment>("attachments")
      .update({
        deleted: true,
      })
      .where({ id });
  }

  /* END ATTACHMENTS SECTION */
}

function parseToDatabaseJson(obj: any): any {
  delete obj._tableName;
  if (Object.prototype.toString.call(obj) === "[object Array]") {
    return JSON.stringify(obj);
  } else if (typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      newObj[key] = parseToDatabaseJson((obj as Record<string, unknown>)[key]);
    }
    return newObj;
  } else {
    return obj;
  }
}

function parseFromDatabaseJson<T>(obj: T): T {
  if (typeof obj === "string") {
    try {
      obj = JSON.parse(obj);
    } catch {
      return obj;
    }
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      return parseFromDatabaseJson(item);
    }) as T;
  } else if (typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = parseFromDatabaseJson(obj[key]);
    }
    return newObj as T;
  } else {
    return obj;
  }
}
