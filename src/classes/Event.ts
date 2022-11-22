import type { ProxiaClient } from "./Client.js";

// A callable type for an abstract Proxia event, including the constructor
export interface CallableProxiaEvent {
  new (bot: ProxiaClient, name: string): ProxiaEvent;
}

export abstract class ProxiaEvent {
  // An array of required intents for an event to listen on
  requiredIntents?: ResolvableIntentString[];

  // An array of event emitters to listen on
  abstract events: ProxiaEventEmitter[];

  /**
   * Creates a new Proxia event
   * @param bot Main bot object
   * @param name The event name, matching the filename
   */

  constructor(protected bot: ProxiaClient, public name: string) {}

  /**
   * Runs an event
   * @param event The event to run
   * @param params Additional event params
   */

  public abstract run(event: ProxiaEventEmitter, ...params: any[]): Promise<void>;
}
