import { ProxiaEvent } from "../classes/Event.js";
import { EmbedBuilder, Guild } from "discord.js";

export class GuildAddEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["guildCreate", "guildDelete"];
  requiredIntents?: ResolvableIntentString[] = ["Guilds"];

  public async run(_event: ProxiaEventEmitter, guild: Guild) {
    switch (_event) {
      case "guildCreate": {
        this._create(guild);
        break;
      }
      case "guildDelete": {
        this._delete(guild);
        break;
      }
    }
  }

  private async _create(guild: Guild) {
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

      await owner.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Proxia")
            .setDescription(content)
            .setAuthor({
              name: "Proxia",
              url: this.bot.user?.displayAvatarURL(),
            })
            .setColor(this.bot.config.colours.error),
        ],
      });
      await guild.leave();
    } else {
      owner.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Proxia")
            .setDescription(
              // TODO: Finish welcome message
              "Thanks for adding Proxia!",
            )
            .setAuthor({
              name: "Proxia",
              url: this.bot.user?.displayAvatarURL(),
            })
            .setColor(this.bot.config.colours.primary),
        ],
      });

      const dbGuild = await this.bot.db.getGuild(guild.id);
      const dbRoles = await this.bot.db.getRoles(guild.id);

      // Eslint what the fuck?
      await (!dbGuild
        ? this.bot.db.addGuild({
            id: guild.id,
            disabled: false,
            ghost_hide_mentions: false,
            ignored_channels: [],
            owner_id: owner.id,
            present: true,
            locale: "en-GB",
          })
        : this.bot.db.updateGuild(guild.id, {
            present: true,
          }));

      const fetchedMembers = await guild.members.fetch();
      const fetchedRoles = await guild.roles.fetch();
      for (const member of fetchedMembers.values()) {
        this.bot.emit("guildMemberAdd", member);
      }

      // Going through the servers roles
      for (const role of fetchedRoles.values()) {
        const dbRole = await this.bot.db.getRole(role.id, guild.id);

        // If the role is not in the database,
        // emit the role as if it was just added by an admin
        if (!dbRole) {
          this.bot.emit("roleCreate", role);
        }
      }

      for (const role of dbRoles) {
        if (!fetchedRoles.map((_e, key) => key).includes(role.id)) {
          await this.bot.db.updateRole(role.id, role.guild_id, {
            existent: false,
          });
        }
      }
    }
  }

  private async _delete(guild: Guild) {
    await this.bot.db.updateGuild(guild.id, {
      present: false,
    });
  }
}
