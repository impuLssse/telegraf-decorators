import { TranslateService } from "./translate.service";

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
   */
  lang?: L;
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
    private keyboardOptions: KeyboardOptions<L> = { columns: 4 },
    private translateService: TranslateService<NestedPaths, L>
  ) {}

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
    keyboardOptions: KeyboardOptions<L> = this.keyboardOptions
  ): InlineKeyboard {
    buttons = this.translateButtons(buttons);
    return this.simpleKeyboard(buttons, keyboardOptions).inline();
  }

  /**
   * Создание типизированной реплай-клавиатуры
   */
  typedReplyKeyboard(
    buttons: TypedButton<NestedPaths>[] | TypedButton<NestedPaths>[][],
    keyboardOptions: KeyboardOptions<L> = this.keyboardOptions
  ): ReplyKeyboard {
    buttons = this.translateButtons(buttons);
    return this.buildKeyboard(buttons, keyboardOptions).reply();
  }

  /**
   * Создание типизированной клавиатуры
   */
  typedKeyboard(
    buttons: TypedButton<NestedPaths>[] | TypedButton<NestedPaths>[][],
    keyboardOptions: KeyboardOptions<L> = this.keyboardOptions
  ): Keyboard {
    buttons = this.translateButtons(buttons);
    return this.simpleKeyboard(buttons, keyboardOptions);
  }

  /**
   * Создание простой инлайн-клавиатуры
   */
  simpleInlineKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions: KeyboardOptions<L> = this.keyboardOptions
  ): InlineKeyboard {
    return this.simpleKeyboard(buttons, keyboardOptions).inline();
  }

  /**
   * Создание простой клавиатуры
   */
  simpleKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions: KeyboardOptions<L> = this.keyboardOptions
  ): Keyboard {
    return this.buildKeyboard(buttons, keyboardOptions);
  }

  /**
   * Создание простой реплай-клавиатуры
   */
  simpleReplyKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions: KeyboardOptions<L> = this.keyboardOptions
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
   * Переводим кнопки по языкам
   *
   * @param buttons - Набор кнопок, которые необходимо перевести
   * @returns Переведенные кнопки в разных форматах
   */
  private translateButtons(
    buttons: TypedButton<NestedPaths>[] | TypedButton<NestedPaths>[][]
  ): TypedButton<NestedPaths>[] | TypedButton<NestedPaths>[][] {
    const accumulatedButtons = buttons.map((buttonOrButtonRow) => {
      /**
       * Если нужно перевести ряд кнопок
       */
      if (Array.isArray(buttonOrButtonRow)) {
        const buttonRow = buttonOrButtonRow.map((button) => {
          if (typeof button == "string") {
            const translation = this.translateService.getTranslation(
              button as NestedPaths
            ) as NestedPaths;
            return {
              ...buttonOrButtonRow,
              text: translation,
            };
          }

          const translation = this.translateService.getTranslation(
            button?.text as NestedPaths,
            button.args,
            button.lang as L
          ) as NestedPaths;
          return {
            ...buttonOrButtonRow,
            text: translation,
          };
        });
      }

      /**
       * Если пришла типизированная строка
       */
      if (typeof buttonOrButtonRow == "string") {
        const translation = this.translateService.getTranslation(
          buttonOrButtonRow as NestedPaths
        ) as NestedPaths;
        return {
          text: translation,
        };
      }

      /** Тут у тайпскрипта уже едет голова (и у меня) */
      const translation = this.translateService.getTranslation(
        buttonOrButtonRow["text"],
        buttonOrButtonRow["args"],
        buttonOrButtonRow["lang"]
      ) as NestedPaths;

      return {
        ...buttonOrButtonRow,
        text: translation,
      };
    });
    console.log(accumulatedButtons);
    return accumulatedButtons;
  }

  /**
   * Построение клавиатуры из массива кнопок или двумерного массива кнопок.
   * @param buttons - Массив кнопок или двумерный массив кнопок.
   * @param options - Опции для группировки кнопок (например, количество кнопок в ряду).
   * @returns Двумерный массив кнопок.
   */
  buildKeyboard(
    buttons: Button[] | Button[][],
    options: KeyboardOptions<L> = this.keyboardOptions
  ): Keyboard {
    let currentRow = [];
    let summaryRows = [];

    /** Это может быть кнопка, а может быть двумерный массив (ряды кнопок) */
    for (const buttonOrButtonRow of buttons) {
      if (Array.isArray(buttonOrButtonRow)) {
        for (const button of buttonOrButtonRow) {
          /** Затираем ряд если он превысил лимит */
          if (currentRow.length >= options?.columns) {
            summaryRows.push(currentRow);
            currentRow = [];
          }

          /** Если пришли строки - сконвертируем в объекты кнопок */
          if (typeof button != "object") {
            currentRow.push(<Button>{
              text: button,
              callback_data: button,
            });
            continue;
          }

          currentRow.push(<Button>{
            text: button["text"],
            args: button["args"],
            hide: button["hide"] || false,
            callback_data: button["callback_data"],
          });
        }
        continue;
      }

      /** Затираем ряд если он превысил лимит */
      if (currentRow.length >= options?.columns) {
        summaryRows.push(currentRow);
        currentRow = [];
      }
      /** Если пришли строки - сконвертируем в объекты кнопок */
      if (typeof buttonOrButtonRow != "object") {
        currentRow.push(<Button>{
          text: buttonOrButtonRow,
          callback_data: buttonOrButtonRow,
        });
        continue;
      }

      currentRow.push(<Button>{
        text: buttonOrButtonRow["text"],
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
