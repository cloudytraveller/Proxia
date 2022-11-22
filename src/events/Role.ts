import { ProxiaEvent } from "classes/Event.js";
import { stenRemove, stenEncode, stenDecode } from "utils/sten.js";
import { Role } from "discord.js";
import crypto from "node:crypto";

export class ProxiaRoleEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["roleCreate", "roleDelete", "roleUpdate"];
  requiredIntents?: ResolvableIntentString[] = ["Guilds"];

  public async run(_event: ProxiaEventEmitter, role: Role, role2?: Role) {
    switch (_event) {
      case "roleCreate": {
        this._addRole(role);

        break;
      }
      case "roleDelete": {
        this._deleteRole(role);

        break;
      }
      case "roleUpdate": {
        // Casting here because roleUpdate throws 2 arguments, which is why we have role2 and why I shouldn't have to explain this is beyond me :)
        this._updateRole(role, role2 as Role);

        break;
      }
      // No default
    }
  }

  private async _addRole(role: Role) {
    // TODO: Check if bot has role management permissions??

    if (await this.bot.db.roleExists(role.id, role.guild.id)) {
      throw new Error("Role exists");
    }

    let id = crypto.randomBytes(2).toString("hex");
    // TODO: Take guilds into account. ex: grab array of unique ids from guild, then loop through that instead of making constant requests to the database.
    while ((await this.bot.db.client<Database.Role>("roles").select("*").where("unique_id", id).first())?.unique_id !== undefined) {
      id = crypto.randomBytes(2).toString("hex");
    }

    role.name = stenRemove(role.name);
    const stenid = stenEncode(id);
    let newName: string;

    role.name.length > 92 ? (newName = role.name.slice(0, 92) + stenid) : (newName = role.name + stenid);

    await role.setName(newName);

    await this.bot.db.client<Database.Role>("roles").insert({
      id: role.id,
      name: role.name,
      guild_id: role.guild.id,
      unique_id: id,
      existent: true,
    });
    return;
  }

  private async _deleteRole(role: Role) {
    await this.bot.db.deleteRole(role.id, role.guild.id);
  }

  private async _updateRole(oldRole: Role, newRole: Role) {
    // TODO: Port old code
    if (
      newRole.tags?.botId ||
      newRole.id === newRole.guild.roles.everyone.id ||
      newRole.tags?.premiumSubscriberRole ||
      newRole.tags?.integrationId
    )
      return;

    if (oldRole.name === newRole.name) return;

    const dbRole = await this.bot.db.getRole(oldRole.id, oldRole.guild.id);

    if (dbRole === null) {
      await this._addRole(newRole);
      return;
    }
  }
}
