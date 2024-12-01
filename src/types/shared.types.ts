import { Context } from "telegraf";
import { Message } from "@telegraf/types";
import { Button, InlineKeyboard, ReplyKeyboard } from "../core";

export type ConstructorClasses<C = any> = new (...args: any[]) => C;
export type ConstuctorValues<V = any> = V;

export interface IContextTypedFunctions<NestedPaths, Languages> {
  typedSendMessage(
    text: NestedPaths,
    messageOptions?: MessageOptions<NestedPaths, Languages>
  ): Promise<Message.TextMessage>;

  typedEditMessage(
    text: NestedPaths,
    messageOptions?: MessageOptions<NestedPaths, Languages>
  ): Promise<Message.TextMessage>;
}

export interface SceneRegistrationOptions {
  onSceneRegistered?: (sceneId: string) => Promise<void> | void;
}

export interface MessageOptions<NestedPaths, L> {
  reply_markup?: {
    inline_keyboard?: Button[] | Button[][];
    keyboard?: Button[] | Button[][];
  };
  args?: any;
  lang?: L;
  typedCaption?: NestedPaths;
  simpleCaption?: string;
}

export type EditTextMessageOptions = InlineKeyboard | ReplyKeyboard;

export enum AllowChatType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export type UnionKeys<T> = T extends unknown ? keyof T : never;
export type DistinctKeys<T extends object> = Exclude<UnionKeys<T>, keyof T>;

export type UseGuardFn<Ctx> = (ctx: Ctx, next: Function) => Promise<void> | void;

export type ChatTypeOf = "group" | "private";
export type ChatTypeOptions = {};

export type MiddlewareFunction = <Ctx extends Context>(ctx: Ctx, next: Function) => void;

export type Caption = Partial<{
  typed_caption: string;
  caption: string;
  args?: any;
}>;
export type ReplyAlertOptions = {
  args?: any;
};
