import { pino } from "pino";

const pinoOptions: pino.LoggerOptions = {
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "yyyy-mm-dd HH:MM:ss",
      colorize: true,
    },
  },
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
};

export const logger = pino(pinoOptions);
