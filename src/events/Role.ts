import type { Role as DiscordRole } from "discord.js";
import { ProxiaEvent } from "classes/Event.js";
import { stenRemove, stenEncode } from "utils/sten.js";
import crypto from "node:crypto";

export class ProxiaRoleEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["roleCreate", "roleDelete", "roleUpdate"];
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

    let id = crypto.randomBytes(2).toString("hex");
    // TODO: Take guilds into account. ex: grab array of unique ids from guild, then loop through that instead of making constant requests to the database.
    // aka get unique id, make sure it's unique, blah blah

    role.name = stenRemove(role.name);
    const stenid = stenEncode(id);
    let newName: string;

    role.name.length > 92 ? (newName = role.name.slice(0, 92) + stenid) : (newName = role.name + stenid);

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

    if (dbRole === null) {
      await this.addRole(newRole);
      return;
    }
  }
}
