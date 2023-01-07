type PrivateClientOptions = import("discord.js").ClientOptions;

interface ProxiaConfig {
  // A Discord bot token to login with
  token: string;

  // The default locale to use
  defaultLocale: ProxiaLocaleCode;

  // Whether or not to save attachments to disk
  saveAttachments: boolean;

  // A guild to be used for testing
  testGuildID: string;

  // Directory to save attachments in, if saveAttachments is enabled.
  attachmentsDirectory: string;

  // Unused for now
  webServer?: {
    port: number;
  };

  clientOptions?: ClientOptions | Record<string, unknown>;

  activities: string[] | false;

  // Minimum is 5
  activityInterval: RangeOf<5, 42_069>;

  // An object of valid hex colours
  colours: ProxiaColourOptions;
}

type ProxiaColourOptions = {
  // Indexing type
  [key: string]: number;

  // Primary hex colour
  primary: number;

  // Secondary hex colour
  secondary: number;

  // Error hex colour
  error: number;

  // Success hex colour
  success: number;

  // Warning hex colour
  warning: number;
};
