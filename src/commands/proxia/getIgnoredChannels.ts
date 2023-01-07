import type { APIApplicationCommandOption } from "discord-api-types/v10";
import type { ChatInputCommandInteraction } from "discord.js";
import { logger } from "../../utils/logger.js";
import { ProxiaCommand } from "../../classes/Command.js";

export class GetIgnoredChannelsCommand extends ProxiaCommand {
  description = "Retrieves a list of ignored channels for this guild.";

  options: APIApplicationCommandOption[] = [];

  public async runWithInteraction(interaction: ChatInputCommandInteraction) {
    logger.debug("GetIgnoredChannels " + interaction.user.id);
    if (
      !interaction.guild ||
      !interaction.guildId ||
      !interaction.member ||
      !interaction.memberPermissions
    ) {
      await interaction.followUp({
        content: "This command must be ran inside a guild of which you have administrator in.",
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.memberPermissions.has("Administrator") ||
      interaction.guild.ownerId !== interaction.user.id
    ) {
      await interaction.followUp({
        content: "Only administrators can run this command",
        ephemeral: true,
      });
      return;
    }

    const guildIgnoredChannels = await this.bot.db.getIgnoredChannels(interaction.guildId);

    if (guildIgnoredChannels.length > 0) {
      let content = "Here's a list of ignored channels for this guild:\n";

      for (const channel of guildIgnoredChannels) {
        content += `- <#${channel}>`;
      }

      await interaction.followUp({
        content,
        ephemeral: true,
      });
    } else {
      await interaction.followUp({
        content: "There are no ignored channels for this guild",
        ephemeral: true,
      });
    }
  }
}
