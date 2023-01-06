import config from "../config.js";
import { ProxiaClient } from "./classes/Client.js";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dbDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../database");

if (!existsSync(dbDir)) mkdirSync(dbDir);

new ProxiaClient(config).init();
