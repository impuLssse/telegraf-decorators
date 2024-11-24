import {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from "@telegraf/types";
import { Buttons, MakeOptions, Keyboard as BaseKeyboard } from "telegram-keyboard";

export interface IContextTypedFunctions {
  ok(text: string, messageOptions?: MessageOptions);
  okAndEdit(text: string, messageOptions?: MessageOptions);
}

export interface SceneRegistrationOptions {
  onSceneRegistered?: (sceneId: string) => Promise<void> | void;
}

export interface MessageOptions {
  reply_markup: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}
export interface EditTextMessageOptions {
  reply_markup: InlineKeyboardMarkup;
}

export enum AllowChatType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export interface IContextTypedKeyboard {
  simpleInlineKeyboard: (
    buttons: Buttons,
    template?: string,
    makeOptions?: Partial<MakeOptions>
  ) => InlineKeyboard;

  simpleKeyboard: (
    buttons: Buttons,
    template?: string,
    makeOptions?: Partial<MakeOptions>
  ) => BaseKeyboard;

  combineKeyboard: (...keyboards: BaseKeyboard[]) => BaseKeyboard;
  removeKeyboard: () => RemoveKeyboard;
}

export type ChatType = "group" | "private";

export type InlineKeyboard = {
  reply_markup: InlineKeyboardMarkup;
};

export type RemoveKeyboard = {
  reply_markup: ReplyKeyboardRemove;
};

export type ButtonsStack = Button[] | Button[][];

export type MiddlewareFunction = <Ctx>(ctx: Ctx, next: Function) => void;

export type Button = {
  text: string;
  callback_data?: string;
  args?: any;
  hide?: boolean;
};

export type IExtraTextOptions = Partial<{
  reply: boolean;
  args: any;
  chatId: string;
  reply_markup: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}>;

export type ChatTypeOptions = {};

export type Caption = Partial<{
  typed_caption: string;
  caption: string;
  args?: any;
}>;

export type ReplyAlertOptions = {
  args?: any;
};

export type ReplyOrEditOptions = {
  text: string;
  args?: any;
  reply_markup?: InlineKeyboardMarkup;
  chat_id?: string;
  reply_to_message_id?: number;
  reply?: boolean;
  disable_web_page_preview?: boolean;
};
