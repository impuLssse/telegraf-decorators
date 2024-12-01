import chalk from "chalk";
import { createLogger, format, Logger as WinstonLogger, transports } from "winston";

export const commonFormat = format.combine(
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  format.colorize({ all: true }),
  format.printf((info) => `⏱️  [${info.timestamp}] ${info.message}`)
);

class BotLogger {
  private logger: WinstonLogger;

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

  error(message: string, error?: unknown) {
    this.logger.error(`${chalk.redBright(message)}`);
    console.log(error);
  }

  log(prefix: string, message: string) {
    this.logger.verbose(
      `${chalk.greenBright(chalk.bold(prefix))} ${chalk.greenBright(message)}`
    );
  }

  fatal(message: string) {
    this.logger.error(`${chalk.bgRedBright(message)}`);
  }

  warn(message: string) {
    this.logger.warn(`${message}`);
  }
}

export const Logger = new BotLogger();
