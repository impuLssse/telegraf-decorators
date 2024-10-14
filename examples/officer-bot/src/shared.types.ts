import { Types } from "mongoose";
import { Context } from "telegraf";
import { UserService } from "@services/user";
import { Scenes as TelegrafScenes } from "telegraf";
import { SceneContextScene } from "telegraf/typings/scenes";
import { KeyboardModule, MessageOptions } from "@telegraf-decorators";
import { CallbackQuery, Message, Update } from "telegraf/typings/core/types/typegram";

export interface IConfig {
  BOT_TOKEN?: string;
}

export interface IContext extends Context, IContextTypedFunctions {
  update: Update.CallbackQueryUpdate & { message: Message.PhotoMessage };
  k: KeyboardModule;
  di: DiContainer;
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

export interface IContextTypedFunctions {
  ok(text: string, messageOptions?: MessageOptions);
  okAndEdit(text: string, messageOptions?: MessageOptions);
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

export type DiContainer = {
  userService: UserService;
};

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
