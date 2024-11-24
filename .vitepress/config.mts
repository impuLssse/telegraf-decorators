import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Просто о сложном",
  description: "Создавай расширяемые телеграмм приложения с помощью telegraf-ecosystem",
  srcDir: "./docs",
  themeConfig: {
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Документация", link: "/" }],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Установка", link: "/" },
          { text: "Лирика", link: "/lirica" },
          { text: "Telegraf methods", link: "/telegraf-methods" },
          { text: "Async configuration", link: "/async-configuration" },
        ],
      },
      {
        text: "Паттерны проектирования",
        items: [
          {
            text: "Chain of Responsability",
            link: "/patterns/chain-of-responsability.md",
          },
          { text: "Singleton", link: "/patterns/singleton" },
          { text: "Dependecy Injection", link: "/patterns/dependency-injection" },
        ],
      },
      {
        text: "Источники",
        link: "/common",
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/impulssse/telegraf-ecosystem" },
      { icon: "telegram", link: "https://t.me/impuLssse911" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present Maxim Safronov",
    },
  },
});
