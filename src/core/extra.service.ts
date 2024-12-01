import { Context } from "telegraf";
import { Logger } from "@ecosystem-logger";
import { TranslateService } from "./translate.service";
import { EditTextMessageOptions, MessageOptions } from "../types";

export class ExtraService<
  NestedPaths extends string = string,
  L extends string = string
> {
  constructor(private translateService: TranslateService<NestedPaths, L>) {}

  typedSendMessage<Ctx extends Context>(ctx: Ctx) {
    return async (text: NestedPaths, messageOptions?: MessageOptions<NestedPaths, L>) => {
      const translatedText = this.translateService.getTranslation(text);
      return this.baseSendMessage(ctx)(translatedText, messageOptions);
    };
  }

  private baseSendMessage<Ctx extends Context>(ctx: Ctx) {
    return async (
      text: string,
      messageOptions: EditTextMessageOptions | MessageOptions<NestedPaths, L>
    ) => {
      return ctx.reply(text, {
        reply_markup: messageOptions?.reply_markup as any,
        parse_mode: "MarkdownV2",
      });
    };
  }

  typedEditMessage<Ctx extends Context>(ctx: Ctx) {
    return async (text: string, messageOptions?: EditTextMessageOptions) => {
      try {
        await ctx.editMessageText(text, {
          parse_mode: "MarkdownV2",
          reply_markup: messageOptions?.reply_markup as any,
        });
      } catch (e: any) {
        /**
         * Если последнее сообщение не удается изменить, то будем отправлять новое.
         * Делаем плавный переход между сценами
         * ---
         * Bad Request: message can't be edited если вылезет ошибка
         */
        const isOldMessage = e.response.description.includes("t be edited");
        const isNotModifiedMessage = e.response.description.includes("is not modified");
        if (isOldMessage || isNotModifiedMessage) {
          return this.baseSendMessage(ctx)(text, messageOptions);
        }

        Logger.fatal(`Возникла ошибка при изменении сообщения:`);
        console.log(e);
      }
    };
  }
}
