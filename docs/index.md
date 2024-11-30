# Установка

```bash
$ npm i telegraf telegraf-ecosystem
```

:::tabs
== tab a
a content
== tab b
b content
:::

:::tabs
== tab a
a content 2
== tab b
b content 2
:::

Я рассчитываю на то, что ты уже работал с express или telegraf и понимаешь фундамент работы. Если что-то будет непонятно, ты всегда можешь задать вопрос мне в телеграмм (справа сверху найдешь)
Можешь считать эту документацию путеводителем в мир паттернов, я помогу тебе с ними разобраться

```typescript
import { Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: "TELEGRAM_BOT_TOKEN",
    }),
  ],
})
export class AppModule {}
```

The `forRoot()` method accepts the same configuration object as Telegraf class constructor from the Telegraf package, as described [here](https://telegraf.js.org/#/?id=constructor).
