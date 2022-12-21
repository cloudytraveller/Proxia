const config: ProxiaConfig = {
  token: "",

  // Whether or not to save attachments to disk
  saveAttachments: true,

  // Directory to save attachments in, if saveAttachments is enabled.
  attachmentsDirectory: "./attachments",

  // Unused for now
  webServer: {
    port: 8080,
  },

  clientOptions: {},

  // Status messages. Leave empty or set to false to disable.
  activities: [],

  // Change interval in minutes.
  activityInterval: 5,
};

export default config;
