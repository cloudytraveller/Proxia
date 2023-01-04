/* eslint-disable unicorn/no-await-expression-member */
import type { TextChannel } from "discord.js";
import { ProxiaEvent } from "../classes/Event.js";

export class ProxiaWebhookEvent extends ProxiaEvent {
  events: ProxiaEventEmitter[] = ["webhookUpdate"];
  requiredIntents: ResolvableIntentString[] = ["GuildWebhooks"];

  public async run(_event: ProxiaEventEmitter, channel: TextChannel) {
    // TODO: figure out how this should work.
    // Fetch webhooks from database and compare them to the channels webhooks,
    // then if a webhook is missing from the channel, delete it in the database?
  }
}
