// import { Buttons, CallbackButton, Key, MakeOptions, Keyboard } from "telegram-keyboard";
// import { RemoveKeyboard } from "../types";

// export class KeyboardModule {
//   static instance: KeyboardModule;

//   private constructor() {}

//   static getInstance(): KeyboardModule {
//     if (!KeyboardModule.instance) {
//       this.instance = new KeyboardModule();
//       return this.instance;
//     }

//     return KeyboardModule.instance;
//   }

//   /** Создание нетипизированной обычной инлайн клавиатуры */
//   // simpleInlineKeyboard(
//   //   buttons: Buttons,
//   //   template?: string,
//   //   makeOptions?: Partial<MakeOptions>
//   // ) {
//   //   return this.simpleKeyboard(buttons, template, makeOptions).inline();
//   // }

//   /** Создание нетипизированной обычной клавиатуры */
//   simpleKeyboard(
//     buttons: Buttons,
//     template?: string,
//     makeOptions?: Partial<MakeOptions>
//   ) {
//     if (template) {
//       const buttonsFromFactory = this.factoryCallbackData(buttons, template);
//       return Keyboard.make(buttonsFromFactory, makeOptions as MakeOptions);
//     }
//     return Keyboard.make(buttons, makeOptions as MakeOptions);
//   }

//   /**
//    * ! **Очень важно в конце вызвать метод inline(), иначе нихуя работать не будет**
//    * @example
//    * const nav = extra.typedKeyboard(['buttons.back'], lang);
//    * const categories = extra.simpleKeyboard([arrayDataFromDatabase]);
//    *
//    * const full = extra.combineKeyboard(nav, categories).inline();
//    */
//   // combineKeyboard(...keyboards: BaseKeyboard[]): BaseKeyboard {
//   //   return BaseKeyboard.combine(...keyboards);
//   // }

//   // removeKeyboard(): RemoveKeyboard {
//   //   return BaseKeyboard.remove();
//   // }

//   /** Складываем template + callback_data
//    * * Нужно чтобы динамически ловить текст кнопок, которые пришли из БД
//    * * Например, для получения имен товаров (пришли с БД, добавим шаблон к строке, чтобы потом точно определить к чему это относится)
//    */
//   private factoryCallbackData(buttons: Buttons, template?: string) {
//     return buttons.map((button: any) => {
//       if (typeof button == "string") {
//         return Key.callback(button, template + button);
//       }

//       if (Array.isArray(button)) {
//         return button.map((button) => Key.callback(button, template + button));
//       }
//     }) as CallbackButton[];
//   }
// }
