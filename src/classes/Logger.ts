import { ProxiaEvent } from "./Event.js";

export abstract class ProxiaLogger extends ProxiaEvent {
  // TODO: Implement requiredIntents to not load loggers if we're missing an intent
}
