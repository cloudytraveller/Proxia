/* eslint-disable @typescript-eslint/naming-convention */
import Knex from "knex";

export class DatabaseManager {
  client: Knex.Knex;

  /**
   * Creates a new Proxia database manaer
   */

  constructor() {
    this.client = Knex.default({
      client: "better-sqlite3",
      connection: {
        filename: "../../database/db.sqlite",
      },
    });
  }

  public async initSchema() {
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
      });
    }
  }

  // Mark message as deleted
  public async deleteMessage(id: string, channel_id: string, guild_id: string) {
    // eh fuck.
    this.client<Database.Message>("messages")
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

  public async roleExists(id: string, guild_id: string) {
    const result = await this.client<Database.Role>("roles")
      .select("*")
      .where({
        id,
        guild_id,
      })
      .first();

    return !!result;
  }

  public async deleteRole(roleId: string, guildId: string) {
    if (await this.roleExists(roleId, guildId)) {
      return;
    }

    await this.client<Database.Role>("roles")
      .where({
        id: roleId,
        guild_id: guildId,
      })
      .update("existent", false);
  }

  public async getRole(id: string, guild_id: string) {
    const role = await this.client<Database.Role>("roles")
      .select("*")
      .where({
        id,
        guild_id,
      })
      .first();

    return role;
  }
}
