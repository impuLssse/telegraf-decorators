// import chalk from "chalk";
import { createLogger, format, Logger, transports } from "winston";

export const commonFormat = format.combine(
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  format.colorize({ all: true }),
  format.printf((info) => `⏱️  [${info.timestamp}] ${info.message}`)
);

export class BotLogger {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      transports: [
        new transports.Console({
          level: "verbose",
          format: commonFormat,
        }),
      ],
    });
  }

  log(link: string, message: string) {
    // this.logger.verbose(`${chalk.greenBright(link)} ${message}`);
  }

  fatal(message: string) {
    // this.logger.error(`${chalk.redBright(message)}`);
  }

  warn(message: string) {
    this.logger.warn(`${message}`);
  }
}

export const botLogger = new BotLogger();
