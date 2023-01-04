import type { APIApplicationCommandOption } from "discord-api-types/v10";
import type { ChatInputCommandInteraction } from "discord.js";
import { ProxiaCommand } from "../classes/Command.js";

export class GetIgnoredChannelsCommand extends ProxiaCommand {
  description = "Retrieves a list of ignored channels for this guild.";

  options: APIApplicationCommandOption[] = [];

  public async runWithInteraction(interaction: ChatInputCommandInteraction) {
    if (
      !interaction.guild ||
      !interaction.guildId ||
      !interaction.member ||
      !interaction.memberPermissions
    ) {
      await interaction.reply({
        content: "This command must be ran inside a guild of which you have administrator in.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.memberPermissions.has("Administrator")) {
      await interaction.reply({
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

      await interaction.reply({
        content,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There are no ignored channels for this guild",
        ephemeral: true,
      });
    }
  }
}
