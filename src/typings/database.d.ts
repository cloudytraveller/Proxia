/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */
interface Message {
  // Discord Snowflake
  id: string;
  // ID of the user who sent the messagea
  user_id: string;
  // ID Of the guild the message was sent in
  guild_id: string;
  // ID of the channel the message was sent in
  channel_id: string;
  // Content of the message
  content: string;
  // URL to the users avatar
  avatar_url?: string;
  // Webhook that was used to send the message
  webhook_id: string;
  // Date the message was created
  createdTimestamp: number;
  // Message attachments, if any
  attachments: string[];
  // If the message has been deleted
  deleted: boolean;
  // Edits that have been made to the message
  edits: {
    date: number;
    content: string;
  }[];
  // Message that the message is replying to
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
  thread_id?: string;
  filename: string;
  spoiler: boolean;
  size: number;
  local_file_path: string;
}

interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar_url: string;
  guilds: {
    id: string;
    nickname: string;
    unique_id: string;
    existent: boolean;
    banned: boolean;
    banned_reason: string;
    roles: string[];
    preferred_avatar_url: string;
  }[];
  oauth2: {
    access_token: string;
    refresh_token: string;
    created_at: number;
    expires_in: number;
    expires_at: number;
    token_type: string;
    user_id: string;
  };
  recoverykey: string;
  seen_recoverykey: boolean;
  // Times this user has used their recovery key on another account.
  recoverykey_timestamps: string[];
  // personal_user_config:
  //   | {
  //       // owoify?: boolean;
  //       [key: string]: any;
  //     }
  //   | string;
}

interface Guild {
  id: string;
  owner_id: string;
  ignored_channels: string[];
  ghost_hide_mentions: boolean;
  disabled: boolean;
}

interface oauth2_token {
  token: string;
}

interface Setting {
  option: string;
  value: string;
}
