> Chain of Responsability — паттерн проектирования, при котором строится цепочка зависимых от друг друга фукнций. Любая из функция может остановить цепочку или передать эстафету следующей функции.

На таком принципе построен `express`, где есть текущий контекст состящий из `(req, res, next) => {}`. В `Nest.js` так устроен механизм гвардов

## Пример из исходников nest.js [guards-consumer.ts](https://github.com/nestjs/nest/blob/master/packages/core/guards/guards-consumer.ts)

```typescript
export class GuardsConsumer {
  public async tryActivate(
    guards: CanActivate[],
    args: unknown[],
    instance: Controller,
    callback: (...args: unknown[]) => unknown,
    type?: TContext
  ): Promise<boolean> {
    if (!guards || isEmpty(guards)) {
      return true;
    }

    // На каждый гвард будет привязан свой контекст
    const context = this.createContext(args, instance, callback);
    context.setType<TContext>(type);

    // Последовательно итерируемся по функциям. Если их 0 то цикл не запустится
    for (const guard of guards) {
      const result = guard.canActivate(context);

      // Перейдем к следующей функции если вернется true, порождая цепочку
      if (await this.pickResult(result)) {
        continue;
      }

      // Обрываем цикл, если с текущий вернулось false
      return false;
    }
    return true;
  }
}
```

## Пример из моей реализации

Если нужно прервать цепочку то вызываем `throw new Error("Гнида не авторизована")` из гварда. Моя реализация лежит в этой функции `handleGuardCycle` в [src/main.ts](https://github.com/impuLssse/telegraf-ecosystem/blob/master/src/main.ts)

```typescript
// Итирируемся по набору функций, который нам передали преждче чем запустить обработчик
for (let i = 0; i < guards.length; i++) {
  const guard = guards[i];
  const nextGuard = guards[i + 1];

  // Функция заглушка на случай если следующей не окажется
  const emptyFunction = () => {};

  if (isAsyncFunction(guard)) {
    // Передаем контекст и доступ к вызову следующей функции (то есть i + 1 если ты блять не понимаешь)
    await guard(ctx, nextGuard ?? emptyFunction);
  } else {
    guard(ctx, nextGuard ?? emptyFunction);
  }
}
```

Теперь вызовем нашу цепочку:

```typescript
/** Я надеюсь ты уже умеешь создавать сцены в telegraf */
const scene = new TelegrafScenes.BaseScene(sceneModule.sceneId);

/**
 * Метод enter — вход пользователя в сцену
 *  1. Запускаем итерацию наших гвардов
 *  2. Запускаем следующую функцию только если
 */
scene.enter(
  async (ctx, next) => {
    await this.handleGuardCycle(ctx as any, guards);
    return next();
  },
  async (ctx) => {
    await ctx.reply(`Добро пожаловать в админ-панель ${ctx.from.username}!`);
  }
);
```

Так может городить длинную цепочку функций. Пример guard:

```typescript
export const AuthGuard = async (ctx: IContext, next: Function) => {
  if (!["939834932"].includes(ctx.from.id)) {
    await ctx.reply("Доступ запрещен");
    return; // Обрываем цепочку и следующая функция не будет выполнена
  }
  return next(); // Например, следующий guard будет проверять является ли чат публичным
};

export const ChatType =
  (chatType: "private" | "public") => (ctx: IContext, next: Function) => {
    if (ctx.chat.type == "private" && chatType !== ) {
      await goToPublicChat(ctx);
    } else {
      await goToPrivateChat(ctx);
    }
    return next() // Например, следующий guard будет проверять является ли чат публичным
  };
```
