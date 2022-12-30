import type { Role as DiscordRole, User as DiscordUser } from "discord.js";
import { ProxiaEvent } from "classes/Event.js";
import { stenRemove, stenEncode, stenDecode } from "utils/sten.js";
import { AuditLogEvent } from "discord-api-types/v9";
import { randomBytes } from "node:crypto";

export class ProxiaRoleEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["roleCreate", "roleDelete", "roleUpdate", "guildMemberAdd"];
  requiredIntents?: ResolvableIntentString[] = ["Guilds"];

  public async run(_event: ProxiaEventEmitter, role: DiscordRole, role2?: DiscordRole) {
    switch (_event) {
      case "roleCreate": {
        this.addRole(role);

        break;
      }
      case "roleDelete": {
        this.deleteRole(role);

        break;
      }
      case "roleUpdate": {
        // Casting here because roleUpdate throws 2 arguments, which is why we have role2 and why I shouldn't have to explain this is beyond me :)
        this._updateRole(role, role2 as DiscordRole);

        break;
      }
      // No default
    }
  }

  public async addRole(role: DiscordRole) {
    // TODO: Check if bot has role management permissions??

    if (await this.bot.db.roleExists(role.id, role.guild.id)) {
      throw new Error("Role exists");
    }

    let id: string | undefined;
    const guildUniqueIds = await this.bot.db.getUniqueRoleIds(role.guild.id);

    while (id === undefined || guildUniqueIds.includes(id)) {
      id = randomBytes(2).toString("hex");
    }

    role.name = stenRemove(role.name);
    const stenid = stenEncode(id);
    let newName: string;

    role.name.length > 92
      ? (newName = role.name.slice(0, 92) + stenid)
      : (newName = role.name + stenid);

    await role.setName(newName);

    this.bot.db.addRole({
      id: role.id,
      name: role.name,
      guild_id: role.guild.id as string,
      unique_id: id,
    });
    return;
  }

  public async deleteRole(role: DiscordRole) {
    await this.bot.db.deleteRole(role.id, role.guild.id);
  }

  private async _updateRole(oldRole: DiscordRole, newRole: DiscordRole) {
    // TODO: Port old code
    if (
      newRole.tags?.botId ||
      newRole.id === newRole.guild.roles.everyone.id ||
      newRole.tags?.premiumSubscriberRole ||
      newRole.tags?.integrationId
    )
      return;

    if (oldRole.name === newRole.name || (!oldRole && newRole)) return;

    const dbRole = await this.bot.db.getRole(oldRole.id, oldRole.guild.id);

    if (!dbRole) {
      await this.addRole(newRole);
      return;
    }

    const oldSten = stenDecode(oldRole.name);
    const newSten = stenDecode(newRole.name);

    if (!oldSten && newSten) return;
    if (dbRole.name === newRole.name) return;

    // If the user updated the role with a new name, and it didn't include a hidden id
    if (newSten === null && oldSten !== null) {
      const roleName = stenRemove(newRole.name).slice(0, 92);

      const roleNameSten = roleName + stenEncode(dbRole.unique_id);

      await newRole.edit({
        name: roleNameSten,
      });

      await this.bot.db.updateRole(newRole.id, {
        name: roleName,
      });
      // Someone has commited tomfoolery
    } else if (oldSten && newSten && oldSten !== newSten) {
      // Check audit log to see who did this
      const audit = await newRole.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleUpdate,
      });

      let executor: DiscordUser | undefined;
      for (const entry of audit.entries.values()) {
        if ((entry.target as DiscordRole).id === newRole.id) {
          executor = entry.executor as unknown as DiscordUser;
          // revert the name change
          newRole.edit({
            name: oldRole.name,
          });
        }
      }

      if (executor) {
        executor.send(
          "Please do not directly copy and paste role names from one to another. It contains a special hidden ID that shouldn't be changed.",
        );
      }
    }
  }
}
