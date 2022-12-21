import type { ProxiaCommand } from "./Command.js";
import type { ProxiaEvent } from "./Event.js";
import type { ProxiaLogger } from "./Logger.js";
import { loadCommands, loadEvents, registerSlashCommands } from "../utils/loader.js";
import { logger } from "../utils/logger.js";
import { DatabaseManager } from "./Database.js";
// import { DatabaseManager } from "./Database.js";
import { Client, Collection, GatewayIntentBits, ActivityType } from "discord.js";
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

  lastActivityIndex = -1;

  changeActivityTimer: NodeJS.Timer | undefined;

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

        logger.info(
          `Logged in as ${this.user?.tag} in ${this.guilds.cache.size} guilds ${this.shard && `on shard #${this.shard?.ids[0]}`}`,
        );
        logger.info(`${this.commands.size} commands loaded ${(this.shard && `on shard #${this.shard?.ids[0]}`) || ""}`);
        logger.info(`${this.events.size} events loaded ${this.shard && `on shard #${this.shard?.ids[0]}`}` || "");

        // Activity changing
        if (this.config.activities && this.config.activities.length > 0) {
          this.changeActivityTimer = setInterval(
            this.changeActivity,
            this.config.activityInterval >= 1 ? 1000 * 60 * this.config.activityInterval : 1000 * 60 * 1,
          );
        }
      });
    } catch (error) {
      logger.error(`An error occured while initializing Proxia: ${error}`);
    }
  }

  public changeActivity() {
    // For sake of simplicity
    const activities = this.config.activities;
    if (this.user && Array.isArray(activities) && activities.length > 0) {
      let index = -1;

      while (index === this.lastActivityIndex || index === -1) {
        index = Math.floor(Math.random() * activities.length);
      }

      this.lastActivityIndex = index;
      this.user.setActivity({
        name: activities[index],
        type: ActivityType.Playing,
      });
      return;
    }
  }
}
