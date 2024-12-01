import path from "path";

/** Подгружаем конфиг с помощью dotenv */
import { config } from "dotenv";
config({ path: path.resolve(__dirname, "../.env") });
const appConfig = process.env as IConfig;

import knex from "knex";
import {
  Ecosystem,
  EcosystemContainer,
  ExtraService,
  KeyboardService,
  Logger,
} from "telegraf-ecosystem";
import { IConfig, IContext, Lang } from "./shared.types";

export const knexClient = knex({
  client: "pg",
  connection: appConfig.DATABASE_URL,
});

import "./scenes";
import { TranslateService } from "telegraf-ecosystem";
import { TranslationKeys } from "./generated.types";
import { UserService } from "@services/user";

const t = new TranslateService<TranslationKeys, Lang>({
  import: {
    en: path.resolve(__dirname, "locales", "en"),
    ru: path.resolve(__dirname, "locales", "ru"),
  },
  outputPath: path.resolve(__dirname, "./generated.types.ts"),
  defaultLanguage: "ru",
});
const k = new KeyboardService<TranslationKeys, Lang>(t, {});
const e = new ExtraService(t);

export const container = EcosystemContainer.createContainer({
  asClass: {
    userService: UserService,
  },
  asValue: {
    translateService: t,
    keyboardService: k,
    extraService: e,
  },
});

export async function bootstrapBot(): Promise<void> {
  if (!appConfig.DATABASE_URL) {
    throw new Error(`Не указано подключение DATABASE_URL`);
  }

  try {
    await knexClient.raw("select 1+1 as result");
    Logger.log("DatabaseService", "instance mounted");
  } catch (e) {
    console.log(e);
    process.exit(1);
  }

  const ecosystem = await Ecosystem.createBot<IContext>({
    container,
    token: appConfig.BOT_TOKEN,
    session: {
      host: "redis",
    },
    onSceneRegistered(sceneId) {
      console.log(`Scene registered: ${sceneId}`);
    },
  });

  ecosystem.bot.start(async (ctx) => {
    // await ctx.scene.enter(SceneContract.Home);

    await ctx.typedSendMessage("hello", {
      ...k.typedInlineKeyboard(["button.main-menu"], { lang: "en" }),
    });
  });
}
bootstrapBot();
