import type { getString } from "./locales.js";

declare module "discord.js" {
  declare interface ChatInputCommandInteraction {
    getString: getString;
  }

  declare interface Message {
    getString: getString;
  }
}
