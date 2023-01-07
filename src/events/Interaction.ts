import type { ChatInputCommandInteraction } from "discord.js";
import { logger } from "../utils/logger.js";
import { ProxiaEvent } from "../classes/Event.js";

export class ProxiaInteractionEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["interactionCreate"];

  public async run(_event: ProxiaEventEmitter, interaction: ChatInputCommandInteraction) {
    logger.debug("Recieved interaction event");
    if (!interaction || !interaction.isCommand() || !interaction.isChatInputCommand()) return;

    // Finds the command
    const command = this.bot.commands.find((c) => c.name === interaction.commandName);
    if (!command) return;

    // Gets the user's locale
    let locale: string = this.bot.config.defaultLocale;
    const guildconfig = await this.bot.db.getGuild(interaction.guild?.id as DiscordSnowflake);
    const userLocale = await this.bot.localeSystem.getUserLocale(interaction.user.id, this.bot);
    if (userLocale) locale = userLocale;
    else if (guildconfig?.locale && !userLocale) locale = guildconfig.locale;

    // Wrapper for getLocaleFunction();
    const getStringFunction = this.bot.localeSystem.getLocaleFunction(locale);
    interaction.getString = getStringFunction;

    try {
      // Runs the command
      await interaction.deferReply();
      await command.runWithInteraction?.(interaction);
    } catch (error) {
      throw new Error(`${error}`);
    }
  }
}
