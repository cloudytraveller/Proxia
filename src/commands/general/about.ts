import { ProxiaCommand } from "../../classes/Command.js";
import { proxiaVersion } from "../../utils/constants.js";
import { ChatInputCommandInteraction, version as djsVersion } from "discord.js";

export class AboutCommand extends ProxiaCommand {
  description = "Returns information and statistics about the bot.";

  public async runWithInteraction(interaction: ChatInputCommandInteraction) {
    // Gets cached guilds
    const guildCount = this.bot.guilds.cache.size;

    // Statistic string
    const statsString = interaction.getString("general.COMMAND_ABOUT_STATISTICS_STRING", {
      guilds: guildCount?.toString(),
      commands: this.bot.commands.size,
    });

    // Module versions
    const moduleString = interaction.getString("general.COMMAND_ABOUT_MODULES_STRING", {
      botVersion: proxiaVersion,
      djsVersion: djsVersion,
      nodeVersion: process.version,
    });

    // Links
    const linkString = interaction.getString("general.COMMAND_ABOUT_LINK_STRING", {
      privacy: "https://github.com/cloudytraveller/Proxia/tree/main#privacy-policy",
      github: "https://github.com/cloudytraveller/Proxia",
    });

    await interaction.followUp({
      embeds: [
        {
          title: interaction.getString("general.COMMAND_ABOUT_TITLE"),
          description: interaction.getString("general.COMMAND_ABOUT_DESCRIPTION", {
            username: this.bot.user?.username,
          }),
          color: this.bot.config.colours.primary,
          fields: [
            {
              name: interaction.getString("general.COMMAND_ABOUT_STATISTICS"),
              value: statsString,
              inline: true,
            },
            {
              name: interaction.getString("general.COMMAND_ABOUT_MODULES"),
              value: moduleString,
              inline: true,
            },
            {
              name: interaction.getString("global.LINKS"),
              value: linkString,
              inline: false,
            },
          ],
          thumbnail: {
            url: this.bot.user?.displayAvatarURL() ?? "",
          },
        },
      ],
    });
  }
}
