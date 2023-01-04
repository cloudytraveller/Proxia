import { ProxiaEvent } from "../classes/Event.js";
import { Colors, EmbedBuilder, Guild } from "discord.js";

export class GuildAddEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["guildCreate"];
  requiredIntents?: ResolvableIntentString[] = ["Guilds"];

  public async run(_event: ProxiaEventEmitter, guild: Guild) {
    const owner = await guild.fetchOwner();

    const missingPerms = guild.members.me?.permissions.missing([
      "ManageWebhooks",
      "ManageChannels",
      "ManageMessages",
      "ManageRoles",
      "ReadMessageHistory",
      "UseApplicationCommands",
      "UseExternalEmojis",
    ]);

    if (missingPerms && missingPerms?.length > 0) {
      let content = `Thanks for adding Proxia, but I was not added with the correct permissions!
      Please re-add me with the following missing permissions:\n`;

      missingPerms.forEach((perm) => {
        content += `- ${perm}\n`;
      });

      owner.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Proxia")
            .setDescription(content)
            .setAuthor({
              name: "Proxia",
              url: this.bot.user?.displayAvatarURL(),
            })
            .setColor(Colors.Red),
        ],
      });
    }
    owner.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Proxia")
          .setDescription(
            "Thanks for adding Proxia! There's a few commands that come along with the bot.",
          )
          .setAuthor({
            name: "Proxia",
            url: this.bot.user?.displayAvatarURL(),
          })
          .setColor("#9460fc"),
      ],
    });
  }
}
