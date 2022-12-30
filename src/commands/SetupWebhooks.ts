import type { ChatInputCommandInteraction } from "discord.js";
import { ProxiaCommand } from "classes/Command.js";
import { APIApplicationCommandOption, ApplicationCommandOptionType } from "discord-api-types/v10";

export class SetupWebhooksCommand extends ProxiaCommand {
  description = "Sets up Proxia's webhooks in a guild.";

  options: APIApplicationCommandOption[] = [];

  public async runWithInteraction(interaction: ChatInputCommandInteraction, ...args: string[]) {
    if (!interaction.guild || !interaction.member || !interaction.memberPermissions) {
      await interaction.reply({
        content: "This command must be ran inside a guild of which you have administrator in.",
        ephemeral: true,
      });
      return;
    }

    if (interaction.memberPermissions.has("Administrator")) {
      await interaction.reply({
        content: "Only administrators can run this command",
      });
    }
    // TODO: Finish
  }
}
