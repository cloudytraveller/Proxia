import type { GuildBan } from "discord.js";
import { ProxiaEvent } from "../classes/Event.js";

export class ProxiaGuildBanEvent extends ProxiaEvent {
  // TODO: Understand how guildMemberAvailable is useful in any way.
  events: ProxiaEventEmitter[] = ["guildBanAdd", "guildBanRemove"];
  requiredIntents: ResolvableIntentString[] = ["GuildBans", "GuildMembers"];

  public async run(_event: ProxiaEventEmitter, ban: GuildBan) {
    if (_event === "guildBanAdd") {
      this._add(ban);
    } else if (_event === "guildBanRemove") {
      this._remove(ban);
    }
  }

  private async _add(ban: GuildBan) {
    await this.bot.db.updateUserBan(ban.user.id, ban.guild.id, true, ban.reason || undefined);
  }

  private async _remove(ban: GuildBan) {
    await this.bot.db.updateUserBan(ban.user.id, ban.guild.id, false, ban.reason || undefined);
  }
}
