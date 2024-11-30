export type ButtonObject = {
  text: string;
  hide?: boolean;
  callback_data?: string;
  args?: Record<string, string>;
};

export type Button = ButtonObject | string;

export type InlineKeyboard = {
  reply_markup: { inline_keyboard: Button[] | Button[][] };
};

export type RemoveKeyboard = {
  reply_markup: { remove_keyboard: true };
};

export interface ReplyKeyboard {
  reply_markup: Button[] | Button[][];
}

export interface CreateKeyboard {
  buttons: Button[] | Button[][];
}

export interface KeyboardOptions {
  /**
   * Разбить клавиатуру на строки по <n> колонок
   * @default 4
   */
  columns?: number;
}

export class Keyboard {
  constructor(private keyboard: CreateKeyboard) {}

  get buttons(): Readonly<Button[] | Button[][]> {
    return this.keyboard.buttons;
  }

  reply() {
    return { reply_markup: { reply_markup: this.keyboard.buttons } };
  }

  inline() {
    return { reply_markup: { inline_keyboard: this.keyboard.buttons } };
  }

  static removeKeyboard() {
    return { remove_keyboard: true };
  }

  removeKeyboard() {
    return { remove_keyboard: true };
  }
}

export class KeyboardService<NestedPaths extends string = string> {
  constructor(private keyboardOptions: KeyboardOptions = { columns: 4 }) {}

  /**
   * Объединение клавиатур
   */
  combineKeyboard(keyboard1: Keyboard, keyboard2: Keyboard): Keyboard {
    const combinedKeyboard = [...keyboard1.buttons, ...keyboard2.buttons];
    return this.buildKeyboard(combinedKeyboard as Button[] | Button[][]);
  }

  /**
   * Создание простой инлайн-клавиатуры
   */
  simpleInlineKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions: KeyboardOptions
  ): InlineKeyboard {
    return this.simpleKeyboard(buttons, keyboardOptions).inline();
  }

  /**
   * Создание простой клавиатуры
   */
  simpleKeyboard(
    buttons: Button[] | Button[][],
    keyboardOptions: KeyboardOptions
  ): Keyboard {
    return this.buildKeyboard(buttons, keyboardOptions);
  }

  /**
   * Построение клавиатуры из массива кнопок или двумерного массива кнопок.
   * @param buttons - Массив кнопок или двумерный массив кнопок.
   * @param options - Опции для группировки кнопок (например, количество кнопок в ряду).
   * @returns Двумерный массив кнопок.
   */
  buildKeyboard(
    buttons: Button[] | Button[][],
    options: KeyboardOptions = this.keyboardOptions
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

export const testFn = () => {};

const k = new KeyboardService();

const aPart = k.buildKeyboard([
  [{ text: "A1" }, { text: "A2" }],
  [{ text: "B1" }, { text: "B2" }],
]);
const bPart = k.buildKeyboard(["penis1", "penis2"]);
console.log(`aPart:`, aPart);
console.log(`bPart:`, bPart);
