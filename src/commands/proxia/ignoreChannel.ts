import type { ChatInputCommandInteraction } from "discord.js";
import { ProxiaCommand } from "../../classes/Command.js";
import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ChannelType,
} from "discord-api-types/v10";

export class IgnoreChannelCommand extends ProxiaCommand {
  description = "Adds a channel to ignore";

  options: APIApplicationCommandOption[] = [
    {
      name: "channel",
      type: ApplicationCommandOptionType.Channel,
      description: "A channel to ignore",
      channel_types: [ChannelType.GuildAnnouncement, ChannelType.GuildText],
      required: true,
    },
  ];

  public async runWithInteraction(interaction: ChatInputCommandInteraction) {
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

    const channel = interaction.options.getChannel("channel");

    if (!channel) {
      await interaction.followUp({
        content: ":warning: A channel was not provided",
        ephemeral: true,
      });
      return;
    }

    try {
      await this.bot.db.addIgnoredChannels(interaction.guildId, channel.id);
    } catch (error) {
      await interaction.followUp({
        content: ("An error occured trying to add the ignored channel:\n" + error) as string,
        ephemeral: true,
      });
    }
  }
}
