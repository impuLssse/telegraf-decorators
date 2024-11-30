import { Context } from "telegraf";
import { InlineKeyboard, RemoveKeyboard } from "../core";
import { InlineKeyboardMarkup, ReplyKeyboardMarkup } from "@telegraf/types";
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

export type UnionKeys<T> = T extends unknown ? keyof T : never;
export type DistinctKeys<T extends object> = Exclude<UnionKeys<T>, keyof T>;

export type UseGuardFn<Ctx> = (ctx: Ctx, next: Function) => Promise<void> | void;

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

export type ChatTypeOf = "group" | "private";

// export type ButtonsStack = Button[] | Button[][];

type IsAny<T> = unknown extends T ? ([keyof T] extends [never] ? false : true) : false;

type PathImpl<T, Key extends keyof T> = Key extends string
  ? IsAny<T[Key]> extends true
    ? never
    : T[Key] extends Record<string, any>
    ?
        | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
        | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;

type PathImpl2<T> = PathImpl<T, keyof T> | keyof T;

export type Path<T> = keyof T extends string
  ? PathImpl2<T> extends infer P
    ? P extends string | keyof T
      ? P
      : keyof T
    : keyof T
  : never;

export type PathValue<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;

export type IfAnyOrNever<T, Y, N> = 0 extends 1 & T ? Y : [T] extends [never] ? Y : N;

/** Взято из `nestjs/common` */
export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

export type Either<T, U> = Only<T, U> | Only<U, T>;

export type Only<T, U> = {
  [P in keyof T]: T[P];
} & {
  [P in keyof U]?: never;
};

export type MiddlewareFunction = <Ctx extends Context>(ctx: Ctx, next: Function) => void;

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
