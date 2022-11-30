/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
interface Message {
  id: string;
  user_id: string;
  guild_id: string;
  channel_id: string;
  content: string;
  avatar_url?: string;
  webhook_id: string;
  createdTimestamp: number;
  attachments?: string[];
  deleted?: boolean;
  edits: {
    date: number;
    content: string;
  }[];
  reply?: {
    message_id?: string;
    author_id?: string;
  };
}

interface Role {
  name: string;
  id: string;
  unique_id: string;
  guild_id: string;
  existent: boolean;
}

interface Webhook {
  id: string;
  name: string;
  token: string;
  channel_id: string;
  guild_id: string;
  channel_name: string;
  created_timestamp: number;
}

interface Attachment {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id: string;
  filename: string;
  spoiler: boolean;
  size: number;
  local_file_path: string;
}

interface User {
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

interface Guild {
  id: string;
  owner_id: string;
  ignored_channels: string;
  ghost_hide_mentions: boolean;
}

interface oauth2_token {
  token: string;
}

// unused
interface error_report {
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

interface Setting {
  option: string;
  value: string;
}
