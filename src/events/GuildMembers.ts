import { ProxiaEvent } from "classes/Event.js";
import { Collection, GuildMember, Role } from "discord.js";
import { randomBytes } from "node:crypto";

export class ProxiaGuildMembersEvent extends ProxiaEvent {
  // TODO: Understand how guildMemberAvailable is useful in any way.
  events: ProxiaEventEmitter[] = ["guildMemberAdd", "guildMemberUpdate", "guildMemberRemove"];
  requiredIntents: ResolvableIntentString[] = ["GuildMembers"];

  public async run(_event: ProxiaEventEmitter, member1: GuildMember, member2: GuildMember) {
    switch (_event) {
      case "guildMemberAdd": {
        this._add(member1);
        break;
      }
      case "guildMemberUpdate": {
        this._update(member1, member2);
        break;
      }
      case "guildMemberRemove": {
        this._remove(member1);
        break;
      }
      default: {
        break;
      }
    }
  }

  private async _add(member: GuildMember) {
    if (member.user.bot || !member.user.id) return;

    let dbUser = await this.bot.db.getUser(member.user.id);
    const discordUser = member.user;
    const guild = member.guild;

    if (!dbUser) {
      const recoverykey = randomBytes(32).toString("hex");

      dbUser = await this.bot.db.createUser({
        id: member.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar_url: discordUser.avatarURL() || member.displayAvatarURL(),
        recoverykey,
      });
    }

    if (!dbUser.guilds[guild.id]) {
      let unique_id;

      const roles = await this.bot.utils.calculateRoleUniqueIds(member.roles.cache, guild.id);

      await this.bot.db.addUserToGuild(dbUser.id, guild.id, {
        nickname: member.nickname || "",
        unique_id: await this.bot.utils.generateUserUniqueId(guild.id),
        roles,
        preferred_avatar_url: member.avatarURL() || "",
      });
    } else {
      const dbUserGuild = dbUser.guilds[guild.id];
      // await this.bot.db.updateUserGuild(dbUser.id, guild.id, {
      //   existent: true,
      // })
      if (!dbUserGuild.banned) {
        const rolesToAdd = new Collection<string, Role>();
        const dbRoles = await this.bot.db.getRoles(guild.id);
        for (const roleUniqueId of dbUser.guilds[guild.id].roles) {
          const dbRole = dbRoles.find((e) => e.id === roleUniqueId) as globalThis.Role;

          const foundRole = member.guild.roles.cache.find((e) => e.id === dbRole.id);
          if (foundRole) rolesToAdd.set(roleUniqueId, foundRole);
        }

        await member.roles.add(rolesToAdd);

        await this.bot.db.updateUserGuild(dbUser.id, guild.id, {
          banned: false,
          banned_reason: "",
          existent: true,
        });

        if (dbUserGuild.nickname.length > 0) {
          await member.setNickname(dbUserGuild.nickname);
        }
      } else {
        // Users don't deserve their roles back after what they've done :>
        await this.bot.db.updateUserGuild(dbUser.id, guild.id, {
          banned: false,
          banned_reason: "",
          nickname: member.nickname || "",
          existent: true,
          roles: [],
        });
      }
    }
  }

  private async _update(oldMember: GuildMember, newMember: GuildMember) {
    const oldMemberRoles = [...oldMember.roles.cache.values()];
    const newMemberRoles = [...newMember.roles.cache.values()];

    const userId = newMember.user.id;
    const guildId = newMember.guild.id;

    const userUpdatable: Optional<Parameters<typeof this.bot.db.updateUser>[1]> = {};

    const guildUpdatable: Optional<Parameters<typeof this.bot.db.updateUserGuild>[2]> = {};

    // If the user updates their personal profile avatar
    if (oldMember.user.avatar !== newMember.user.avatar)
      userUpdatable.avatar_url = newMember.user.avatarURL();
    // If the user updates their server profile avatar
    if (
      oldMember.avatarURL() !== newMember.avatarURL() &&
      newMember.avatarURL() !== newMember.user.avatarURL()
    )
      guildUpdatable.preferred_avatar_url = newMember.avatarURL() || "";

    if (oldMember.user.username !== newMember.user.username)
      userUpdatable.username = newMember.user.username;

    if (oldMember.user.discriminator !== newMember.user.discriminator)
      userUpdatable.discriminator = newMember.user.discriminator;

    if (oldMember.nickname !== newMember.nickname)
      guildUpdatable.nickname = newMember.nickname || "";

    await this.bot.db.updateUser(newMember.user.id, {
      ...userUpdatable,
    });

    await this.bot.db.updateUserGuild(userId, guildId, {
      ...guildUpdatable,
    });
  }

  private async _remove(member: GuildMember) {
    await this.bot.db.updateUserGuild(member.id, member.guild.id, {
      existent: false,
    });
  }
}
