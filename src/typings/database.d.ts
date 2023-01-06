/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/naming-convention */

interface Table {
  _tableName: string;
}
interface _Message extends Table {
  _tableName: "messages";
  // Discord Snowflake
  id: string;
  // Unique ID of the user who sent the messagea
  user_unique_id: string;
  // ID Of the guild the message was sent in
  guild_id: string;
  // ID of the channel the message was sent in
  channel_id: string;
  // Thread id if applicable
  thread_id?: string;
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

type Message = Omit<_Message, "_tableName">;

interface _Role extends Table {
  _tableName: "roles";
  name: string;
  id: string;
  unique_id: string;
  guild_id: string;
  existent: boolean;
}

type Role = Omit<_Role, "_tableName">;

interface _Webhook extends Table {
  _tableName: "webhooks";
  id: string;
  name: string;
  token: string;
  channel_id: string;
  guild_id: string;
  created_timestamp?: number;
}

type Webhook = Omit<_Webhook, "_tableName">;

interface _Attachment extends Table {
  _tableName: "attachments";
  id: string;
  filename: string;
  spoiler: boolean;
  size: number;
  local_file_path: string;
  deleted: boolean;
}

type Attachment = Omit<_Attachment, "_tableName">;

interface _User extends Table {
  _tableName: "users";
  id: string;
  username: string;
  discriminator: string;
  avatar_url?: string | null;
  guilds: {
    [guild_id: string]: {
      nickname: string;
      unique_id: string;
      existent: boolean;
      banned: boolean;
      banned_reason: string;
      roles: string[];
      preferred_avatar_url: string;
    };
  };
  oauth2?: {
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
  /* Times this user has used their recovery key on another account.*/
  recoverykey_timestamps: string[];
  // personal_user_config:
  //   {
  //       // owoify?: boolean;
  //       [key: string]: any;
  //     }
  //   string;
}

type User = Omit<_User, "_tableName">;

interface _Guild extends Table {
  _tableName: "guilds";
  id: string;
  owner_id: string;
  ignored_channels: string[];
  ghost_hide_mentions: boolean;
  disabled: boolean;
  present: boolean;
}

type Guild = Omit<_Guild, "_tableName">;

interface oauth2_token extends Table {
  token: string;
}

interface Setting extends Table {
  option: string;
  value: string;
}
