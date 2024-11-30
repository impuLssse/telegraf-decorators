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

Я рассчитываю на то, что ты уже работал с express или telegraf и понимаешь фундамент работы. Если что-то будет непонятно, ты всегда можешь задать вопрос мне в телеграмм (справа сверху найдешь)
Можешь считать эту документацию путеводителем в мир паттернов, я помогу тебе с ними разобраться

```typescript
import { Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: "TELEGRAM_BOT_TOKEN", // Полученный токен от https://t.me/BotFather
    }),
  ],
})
export class AppModule {}
```
