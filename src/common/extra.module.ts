import { Context } from "telegraf";
import { EditTextMessageOptions, MessageOptions } from "../types";

export class ExtraModule<Ctx extends Context = Context> {
  static instance: ExtraModule;

  private constructor() {}

  static getInstance(): ExtraModule {
    if (!ExtraModule.instance) {
      this.instance = new ExtraModule();
      return this.instance;
    }

    return ExtraModule.instance;
  }

  ok(ctx: Ctx) {
    return async (text: string, messageOptions?: MessageOptions) => {
      await ctx.reply(text, {
        reply_markup: messageOptions?.reply_markup,
        parse_mode: "MarkdownV2",
      });
    };
  }

  okAndEdit(ctx: Ctx) {
    return async (text: string, messageOptions?: EditTextMessageOptions) => {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "MarkdownV2",
          reply_markup: messageOptions?.reply_markup,
        });
      } catch (e: any) {
        /**
         * Если последнее сообщение не удается изменить, то будем отправлять новое.
         * Делаем плавный переход между сценами
         *
         * ---
         * Bad Request: message can't be edited если вылезет ошибка
         */
        const isOldMessage = e.response.description.includes("t be edited");
        const isNotModifiedMessage = e.response.description.includes("is not modified");
        if (isOldMessage || isNotModifiedMessage) {
          await this.ok(ctx)(text, messageOptions);
          return;
        }

        console.log(`Возникла ошибка при изменении сообщения:`);
        console.log(e);
      }
    };
  }
}
