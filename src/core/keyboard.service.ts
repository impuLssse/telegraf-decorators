import { Logger } from "../ecosystem-logger";
import { TranslateService } from "./translate.service";
import { EcosystemException } from "../ecosystem-exception";

export type ButtonObject<T = string, L = string> = {
  text: T;
  hide?: boolean;
  callback_data?: string;
  args?: Record<string, string>;
  lang?: L;
};

export type Button = ButtonObject | string;

export type TypedButton<T extends string> = T | ButtonObject<T>;

export type InlineKeyboard = {
  reply_markup: { inline_keyboard: Button[] | Button[][] };
};

export type RemoveKeyboard = {
  reply_markup: { remove_keyboard: true };
};

export interface ReplyKeyboard {
  reply_markup: { keyboard: Button[] | Button[][] };
}

export interface CreateKeyboard {
  buttons: Button[] | Button[][];
}

export interface KeyboardOptions<L> {
  /**
   * Разбить клавиатуру на строки по <n> колонок
   * @default 4
   */
  columns?: number;

  /**
   * Язык на который будет переведна
   * @default defaultLanguage в TranslateService
   */
  lang?: L;

  /**
   * ## Это опция пока не работает, не пользуйтесь
   *
   * Выбрасывать ли ошибку если не найдем перевод для кнопки
   * Если `enableButtonTextTranslation` не указано `true` то это опция не будет работать
   * @default true
   */
  throwOnMissingKey?: boolean;

  /**
   * Включить перевод кнопок для клавиатуры
   * @default false
   */
  enableButtonTextTranslation?: boolean;
}

export class Keyboard {
  constructor(private keyboard: CreateKeyboard) {}

  get buttons(): Readonly<Button[] | Button[][]> {
    return this.keyboard.buttons;
  }

  reply() {
    return { reply_markup: { keyboard: this.keyboard.buttons } };
  }

  inline() {
    return { reply_markup: { inline_keyboard: this.keyboard.buttons } };
  }
}

/**
 * Сервис по работе с клавиатурой: управление инлайн и реплай клавиатур
 */
export class KeyboardService<
  NestedPaths extends string = string,
  L extends string = string
> {
  constructor(
    private translateService: TranslateService<NestedPaths, L>,
    private keyboardOptions: KeyboardOptions<L>
  ) {
    /** Указываем настройки, которые проверили */
    this.keyboardOptions = this.parseOptions(keyboardOptions);
    Logger.log("KeyboardService", "instance mounted");
  }

  private parseOptions(keyboardOptions: KeyboardOptions<L>): KeyboardOptions<L> {
    /** Задаем опции по умолчанию */
    if (keyboardOptions?.columns == undefined) {
      this.keyboardOptions.columns = 4;
    }
    if (keyboardOptions?.enableButtonTextTranslation == undefined) {
      this.keyboardOptions.enableButtonTextTranslation = false;
    }
    if (keyboardOptions.throwOnMissingKey == undefined) {
      keyboardOptions.throwOnMissingKey = true;
    }

    /** Если пришел указанный язык в опциях */
    if (keyboardOptions.lang !== undefined) {
      if (!this.translateService.hasLanguage(keyboardOptions.lang)) {
        throw EcosystemException.languageIsUndefined(
          `keyboardOptions`,
          keyboardOptions?.lang
        );
      }

      this.keyboardOptions.lang = keyboardOptions.lang;
    } else {
      keyboardOptions.lang =
        keyboardOptions.lang || this.translateService.defaultLanguage;
    }

    return keyboardOptions;
  }

  /**
   * Объединение клавиатур
   */
  combineKeyboard(keyboard1: Keyboard, keyboard2: Keyboard): Keyboard {
    const combinedKeyboard = [...keyboard1.buttons, ...keyboard2.buttons];
    return this.buildKeyboard(combinedKeyboard as Button[] | Button[][]);
  }

  /**
   * Создание типизированной инлайн-клавиатуры
   */
  typedInlineKeyboard(
    buttons: TypedButton<NestedPaths>[] | TypedButton<NestedPaths>[][],
    keyboardOptions?: KeyboardOptions<L>
  ): InlineKeyboard {
    return this.buildKeyboard(buttons, {
      ...keyboardOptions,
      enableButtonTextTranslation: true,
    }).inline();
  }

  /**
   * Создание типизированной реплай-клавиатуры
   */
  typedReplyKeyboard(
    buttons: TypedButton<NestedPaths>[] | TypedButton<NestedPaths>[][],
    keyboardOptions?: KeyboardOptions<L>
  ): ReplyKeyboard {
    return this.buildKeyboard(buttons, {
      ...keyboardOptions,
      enableButtonTextTranslation: true,
    }).reply();
  }

  /**
   * Создание типизированной клавиатуры
   */
  typedKeyboard(
    buttons: TypedButton<NestedPaths>[] | TypedButton<NestedPaths>[][],
    keyboardOptions: KeyboardOptions<L>
  ): Keyboard {
    return this.buildKeyboard(buttons, {
      ...keyboardOptions,
      enableButtonTextTranslation: true,
    });
  }

  /**
   * Создание простой инлайн-клавиатуры
   */
  simpleInlineKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions?: KeyboardOptions<L>
  ): InlineKeyboard {
    return this.buildKeyboard(buttons, keyboardOptions).inline();
  }

  /**
   * Создание простой клавиатуры
   */
  simpleKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions?: KeyboardOptions<L>
  ): Keyboard {
    return this.buildKeyboard(buttons, keyboardOptions);
  }

  /**
   * Создание простой реплай-клавиатуры
   */
  simpleReplyKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions?: KeyboardOptions<L>
  ): ReplyKeyboard {
    return this.buildKeyboard(buttons, keyboardOptions).reply();
  }

  /**
   * Удаление клавиатуры
   */
  removeKeyboard(): RemoveKeyboard {
    return { reply_markup: { remove_keyboard: true } };
  }

  /**
   * Построение клавиатуры из массива кнопок или двумерного массива кнопок.
   * @param buttons - Массив кнопок или двумерный массив кнопок.
   * @param options - Опции для группировки кнопок (например, количество кнопок в ряду).
   * @returns Двумерный массив кнопок.
   */
  buildKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions?: KeyboardOptions<L>
  ): Keyboard {
    keyboardOptions = this.parseOptions(keyboardOptions);

    let currentRow = [];
    let summaryRows = [];

    /** Это может быть кнопка, а может быть двумерный массив (ряды кнопок) */
    for (const buttonOrButtonRow of buttons) {
      if (Array.isArray(buttonOrButtonRow)) {
        for (const button of buttonOrButtonRow) {
          /** Затираем ряд если он превысил лимит */
          if (currentRow.length >= keyboardOptions.columns) {
            summaryRows.push(currentRow);
            currentRow = [];
          }

          /** Если пришли строки - сконвертируем в объекты кнопок */
          if (typeof button != "object") {
            const translatedButton = this.translateService.getTranslation(
              button as NestedPaths
            );

            currentRow.push(<Button>{
              text: keyboardOptions.enableButtonTextTranslation
                ? translatedButton
                : button,
              callback_data: button,
            });
            continue;
          }

          const translatedButton = this.translateService.getTranslation(
            button.text as NestedPaths,
            button.args,
            button.lang as L
          );

          currentRow.push(<Button>{
            text: keyboardOptions.enableButtonTextTranslation
              ? translatedButton
              : button["text"],
            args: button["args"],
            hide: button["hide"] || false,
            callback_data: button["callback_data"],
          });
        }
        continue;
      }

      /** Затираем ряд если он превысил лимит */
      if (currentRow.length >= keyboardOptions?.columns) {
        summaryRows.push(currentRow);
        currentRow = [];
      }
      /** Если пришли строки - сконвертируем в объекты кнопок */
      if (typeof buttonOrButtonRow != "object") {
        const translatedButton = this.translateService.getTranslation(
          buttonOrButtonRow as NestedPaths,
          {},
          this.keyboardOptions.lang
        );

        currentRow.push(<Button>{
          text: keyboardOptions.enableButtonTextTranslation
            ? translatedButton
            : buttonOrButtonRow,
          callback_data: buttonOrButtonRow,
        });
        continue;
      }

      /** Переводим кнопку на заданный язык */
      const translatedButton = this.translateService.getTranslation(
        buttonOrButtonRow.text as NestedPaths,
        buttonOrButtonRow.args,
        buttonOrButtonRow.lang as L
      );

      currentRow.push(<Button>{
        text: keyboardOptions.enableButtonTextTranslation
          ? translatedButton
          : buttonOrButtonRow["text"],
        args: buttonOrButtonRow["args"],
        hide: buttonOrButtonRow["hide"] || false,
        callback_data: buttonOrButtonRow["callback_data"],
      });
    }

    /** Если остался остаток кнопок, которые не вошли по лимитам - впихиваем в конец */
    if (currentRow.length > 0) {
      summaryRows.push(currentRow);
    }

    /** Возвращаемый экземляр клавиатуры */
    return new Keyboard({ buttons: summaryRows });
  }
}
