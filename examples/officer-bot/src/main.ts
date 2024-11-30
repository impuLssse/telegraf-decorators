import path from "path";

/** Подгружаем конфиг с помощью dotenv */
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../.env") });
const appConfig = process.env as IConfig;

import knex from "knex";
import { Ecosystem } from "telegraf-ecosystem";
import { IConfig, IContext, SceneContract } from "./shared.types";

export const knexClient = knex({
  client: "pg",
  connection: appConfig.DATABASE_URL,
});

import "./scenes";
import { TranslateService } from "telegraf-ecosystem";
import { TranslationKeys } from "./generated.types";

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

  const ecosystem = await Ecosystem.createBotEcosystem<IContext>({
    token: appConfig.BOT_TOKEN,
    session: {
      host: "redis",
    },
    onSceneRegistered(sceneId) {
      console.log(`Scene registered: ${sceneId}`);
    },
  });

  const t = new TranslateService<TranslationKeys, "en" | "ru">({
    import: {
      en: path.resolve(__dirname, "locales", "en"),
      ru: path.resolve(__dirname, "locales", "ru"),
    },
    outputPath: path.resolve(__dirname, "./generated.types.ts"),
    defaultLanguage: "ru",
  });
  console.log(t.getTranslation("hello", ["Maxim", "Kapusta"], "en"));
  console.log(t.getTranslation("hello"));

  ecosystem.bot.start(async (ctx) => {
    await ctx.scene.enter(SceneContract.Home);
  });

  console.log("Bot is running...");
}
bootstrapBot();
