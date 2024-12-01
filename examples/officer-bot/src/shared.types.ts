import { Types } from "mongoose";
import { Context } from "telegraf";
import { container } from "./main";
import { SceneContextScene } from "telegraf/scenes";
import { TranslationKeys } from "./generated.types";
import { Scenes as TelegrafScenes } from "telegraf";
import { EcosystemContainer, IContextTypedFunctions } from "telegraf-ecosystem";
import { CallbackQuery, Message, Update } from "telegraf/typings/core/types/typegram";

export interface IConfig {
  BOT_TOKEN?: string;
  DATABASE_URL?: string;
}

export type Lang = "ru" | "en";

export type IContext = GeneratedContext<TranslationKeys, Lang> & typeof container;

export interface GeneratedContext<
  NestedPaths = unknown,
  Languages extends string = string
> extends Context,
    IContextTypedFunctions<NestedPaths, Languages> {
  update: Update.CallbackQueryUpdate & { message: Message.PhotoMessage };
  // k: KeyboardModule
  session: SessionData;
  scene: ISceneContextScene;
  callbackQuery: CallbackQuery & { data: string };
  message: Update.New &
    Update.NonChannel &
    Message & { text?: string } & Message.CommonMessage;
}

interface SceneSession extends TelegrafScenes.SceneSessionData {}

interface ISceneContextScene extends SceneContextScene<IContext, SceneSession> {
  /** Типизируем функцию входа в сцену, что принимать только значения определенного типа */
  enter: (sceneId: SceneContract) => Promise<unknown>;
}

export interface SessionData extends TelegrafScenes.SceneSession<SceneSession> {
  messageId: string;
  lang: any;
  officerController: Partial<IOfficer>;
  userContoller: Partial<IUser>;
}

export interface IOfficer {
  id: string;
  chatId: string;
  phone: string;
  name: string;
  isActive: boolean;
  telegramId: string;
}

export interface IUser {
  _id: Types.ObjectId;
  name?: string;
  phone?: string;
}

export enum SceneContract {
  Home = "Home",
  WaitingControlUserId = "WaitingControlUserId",
  ControlOfficersHome = "ControlOfficersHome",
  ControlOneOfOfficer = "ControlOneOfOfficer",
  WaitingNameForNewOfficer = "WaitingNameForNewOfficer",
  WaitingPhoneForNewOfficer = "WaitingPhoneForNewOfficer",
  OfficerList = "OfficerList",
  ControlUser = "ControlUser",
}
