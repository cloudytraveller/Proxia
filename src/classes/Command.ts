import type { ProxiaClient } from "./Client.js";
import type { APIApplicationCommandOption } from "discord-api-types/v10";
import type { ChatInputCommandInteraction, Message } from "discord.js";

/**
 * Proxia command data in JSON form for slash command registration
 */

export interface ProxiaCommandJSON {
  // The command name, inherited from the filename
  name: string;

  // The command description
  description: string;

  // Slash command options
  options?: APIApplicationCommandOption[];
}

// A callable type for an abstract Proxia command, including the constructor
export interface CallableProxiaCommand {
  new (bot: ProxiaClient, name: string, category: string): ProxiaCommand;
}

export abstract class ProxiaCommand {
  /**
   * Whether or not the command is a message-only command
   * Also prevents being deployed as a slash command
   */

  messageOnly = false;

  /**
   * Whether or not to restrict a command to the application owner
   * Also prevents being deployed as a slash command
   * MUST be used with messageOnly!
   * @deprecated Since v5.0.0-alpha
   */

  ownerOnly = false;

  // An array of slash command options
  options?: APIApplicationCommandOption[];

  // A short description of a command
  abstract description: string;

  /**
   * Creates a new Proxia command
   * @param bot Main bot object
   * @param name The command name (matches the filename)
   * @param category The command category (matches the directory)
   */

  protected constructor(protected bot: ProxiaClient, public name: string, public category: string) {}

  /**
   * Converts a Proxia command to Discord API-compatible JSON
   * @returns A JSON object for a valid slash command
   */

  public toJSON(): ProxiaCommandJSON {
    return {
      name: this.name.toLowerCase(),
      description: this.description,

      // TODO: Add a validator here.
      // Be sure to follow slash command option validation. For example, ALL names must be lowercase with no spaces.
      // Correct: guild_id : incorrect: Guild ID
      // Also: Use the enum for the type for ease-of-use
      options: this.options ?? [],
    };
  }
  /**
   * Runs a command via the interaction gateway
   * @param interaction The interaction to handle
   * @param args Additional arguments
   */

  public runWithInteraction?(interaction: ChatInputCommandInteraction, ...args: string[]): Promise<void>;

  /**
   * Gets a specific subcommand's response
   * @param commandName The subcommand name to get
   * @param args Additional arguments
   */

  public getSubCommandResponse?(commandName: string, ...args: string[]): Promise<unknown>;

  /**
   * Runs a command via the legacy message API
   * @param msg The message object to utilise
   * @param args Arguments passed through the command
   * @see MIGRATION.md
   */

  public runWithMessage?(msg: Message, args?: string[]): Promise<void>;
}
