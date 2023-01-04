import type { ChatInputCommandInteraction } from "discord.js";
import { ProxiaCommand } from "../classes/Command.js";
import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ChannelType,
} from "discord-api-types/v10";

export class RemoveIgnoredChannelCommand extends ProxiaCommand {
  description = "Removes an ignored channel.";

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

    const channel = interaction.options.getChannel("channel");

    if (!channel) {
      await interaction.reply({
        content: ":warning: A channel was not provided",
        ephemeral: true,
      });
      return;
    }

    const ignoredChannels = await this.bot.db.getIgnoredChannels(interaction.guildId);

    if (!ignoredChannels.includes(channel.id)) {
      await interaction.reply({
        content: "Channel is not in the list of ignored channels.",
        ephemeral: true,
      });
      return;
    }

    try {
      await this.bot.db.removedIgnoredChannels(channel.id);
    } catch (error) {
      await interaction.reply({
        content: ("An error occured trying to remove the ignored channel:\n" + error) as string,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `The channel (<#${channel.id}>) has been added to the ignore list`,
      ephemeral: true,
    });
  }
}
