type PrivateClientOptions = import("discord.js").ClientOptions;

interface ProxiaConfig {
  token: string;

  // Whether or not to save attachments to disk
  saveAttachments: boolean;

  // Directory to save attachments in, if saveAttachments is enabled.
  attachmentsDirectory: string;

  // Unused for now
  webServer: {
    port: number;
  };

  clientOptions?: ClientOptions | Record<string, unknown>;
}
