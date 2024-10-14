import "dotenv/config";
const appConfig = process.env as IConfig;

import { session, Telegraf } from "telegraf";
import { RootModule } from "@telegraf-decorators";
import { IConfig, IContext, SceneContract } from "./shared.types";

export async function bootstrapBot(): Promise<void> {
  const bot = new Telegraf<IContext>(appConfig.BOT_TOKEN);

  /** Используем middleware для работы с сессиями */
  bot.use(session());

  const rootModule = new RootModule(bot);
  rootModule.registerUpdates([...RootModule.updatesRegistry]);
  rootModule.registerScenes([...RootModule.scenesRegistry]);

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
