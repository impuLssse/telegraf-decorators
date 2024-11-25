import path from "path";

/** Подгружаем конфиг с помощью dotenv */
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../.env") });
const appConfig = process.env as IConfig;

import knex from "knex";
import { Stage } from "telegraf/scenes";
import { session, Telegraf } from "telegraf";
import { Ecosystem } from "telegraf-ecosystem";
import { IConfig, IContext, SceneContract } from "./shared.types";

export const knexClient = knex({
  client: "pg",
  connection: appConfig.DATABASE_URL,
});

import "./scenes";
import chalk from "chalk";

export async function bootstrapBot(): Promise<void> {
  if (!appConfig.DATABASE_URL) {
    throw new Error(`Не указано подключение DATABASE_URL`);
  }

  try {
    await knexClient.raw("select 1+1 as result");
    console.log(`Database connected`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }

  const bot = new Telegraf<IContext>(appConfig.BOT_TOKEN);

  /** Используем middleware для работы с сессиями */
  bot.use(session());

  const ecosystem = await Ecosystem.createBotEcosystem({
    bot,
    onSceneRegistered(sceneId) {
      console.log(chalk.bgGreenBright(`Scene registered: ${sceneId}`));
    },
  });

  bot.start(async (ctx) => {
    await ctx.scene.enter(SceneContract.Home);
  });

  /**
   * Запуск бота.
   * Нельзя запускать асинхронно, потому что под капотом бесконечный асинхронный итератор
   */
  bot.launch();
  console.log("Bot is running...");
}
bootstrapBot();
