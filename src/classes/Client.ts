import type { ProxiaCommand } from "./Command.js";
import type { ProxiaEvent } from "./Event.js";
import type { ProxiaLogger } from "./Logger.js";
import { loadCommands, loadEvents, registerSlashCommands } from "../utils/loader.js";
import { logger } from "../utils/logger.js";
import { DatabaseManager } from "./Database.js";
// import { DatabaseManager } from "./Database.js";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import path from "node:path";
import url from "node:url";

// Are we being sane or not?
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// __dirname replacement in ESM
const pathDirname = path.dirname(url.fileURLToPath(import.meta.url));

// Directories to crawl
const COMMANDS_DIRECTORY = path.join(pathDirname, "../commands");
const EVENTS_DIRECTORY = path.join(pathDirname, "../events");
const LOGGERS_DIRECTORY = path.join(pathDirname, "../loggers");
// const LOCALES_DIRECTORY = path.join(pathDirname, "../locales");

export class ProxiaClient extends Client {
  readonly config: ProxiaConfig;
  // A Prisma + Proxia Database Manager
  readonly db: DatabaseManager = new DatabaseManager();

  // A collection of commands
  readonly commands: Collection<string, ProxiaCommand> = new Collection();

  // A collection of events
  readonly events: Collection<string, ProxiaEvent> = new Collection();

  // A collection of loggers
  readonly loggers: Collection<string, ProxiaLogger> = new Collection();

  constructor(config: ProxiaConfig) {
    super({
      ...config.clientOptions,
      intents: [
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks,
      ],
    });
    this.config = config;
  }

  public init() {
    try {
      // Logs into the Discord API, I guess
      this.login(this.config.token);

      // Wait for the initial login before loading modules
      this.once("ready", async () => {
        // Loads all commands, events, and loggers
        await loadCommands(this, COMMANDS_DIRECTORY);
        await loadEvents(this, EVENTS_DIRECTORY);
        await loadEvents(this, LOGGERS_DIRECTORY, true);

        // Registers commands;
        registerSlashCommands(this);

        logger.info(`Logged in as ${this.user?.tag} in ${this.guilds.cache.size} guilds on shard #${this.shard?.ids[0]}`);
        logger.info(`${this.commands.size} commands loaded on shard #${this.shard?.ids[0]}`);
        logger.info(`${this.events.size} events loaded on shard #${this.shard?.ids[0]}`);
      });
    } catch (error) {
      logger.error(`An error occured while initializing Proxia: ${error}`);
    }
  }
}
