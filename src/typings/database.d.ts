/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
namespace Database {
  class Message {
    id: string;
    webhook_id: string;
    avatar_url: string;
    content: string;
    createdTimestamp: number;
    channel_id: string;
    guild_id: string;
    user: {
      id: string;
      username: string;
      discriminator: string;
      avatar: string;
    };
    attachments?: string | string[];
    deleted?: boolean;
    edits?:
      | {
          date: number;
          content: string;
        }[]
      | string
      | string[];
    reply?: {
      message_id?: string;
      author_id?: string;
    };
  }

  class Role {
    name: string;
    id: string;
    unique_id: string;
    guild_id: string;
    existent: boolean;
  }

  class Webhook {
    id: string;
    name: string;
    token: string;
    channel_id: string;
    guild_id: string;
    channel_name: string;
    created_timestamp: number;
  }

  class Attachment {
    id: string;
    guild_id: string;
    channel_id: string;
    message_id: string;
    filename: string;
    spoiler: boolean;
    size: number;
    local_file_path: string;
  }

  class User {
    id: string;
    username: string;
    discriminator: string;
    nickname: string;
    uniqueId: string;
    avatar_url: string;
    guilds: string | string[];
    existent: boolean;
    roles: string | string[];
    oauth2:
      | {
          access_token: string;
          refresh_token: string;
          created_at: number;
          expires_in: number;
          expires_at: number;
          token_type: string;
          user_id: string;
        }
      | string
      | string[];
    banned: boolean;
    banned_reason: string;
    secret: string;
    seen_secret: boolean;
    personal_user_config:
      | {
          // owoify?: boolean;
          [key: string]: any;
        }
      | string;
  }

  class Guild {
    id: string;
    owner_id: string;
    // Not sure what else to put here.
  }

  class oauth2_token {
    token: string;
  }

  // unused
  class error_report {
    ip: string;
    raw: string;
    message: string;
    error: {
      stack: string;
    };
    diagnostics?:
      | {
          client: "powercord" | "aliucord" | "betterdiscord";
          plugin: {
            name: string;
            version: string;
          };
          discord: {
            native: string;
            build: string;
            channel: string;
          };
          os: string;
          process: {
            platform: string;
            arch: string;
          };
        }
      | string;
  }

  class Setting {
    option: string;
    value: string;
  }
}
