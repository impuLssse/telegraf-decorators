import { defineConfig } from "vitepress";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "telegraf-ecosystem",
  description: "Создавай расширяемые телеграмм приложения с помощью telegraf-ecosystem",
  srcDir: "./docs",
  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin);
    },
  },
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
        ],
      },
      {
        text: "Паттерны проектирования",
        items: [
          {
            text: "Chain of Responsability (цепочка зависимостей)",
            link: "/patterns/chain-of-responsability.md",
          },
          { text: "Singleton (одиночка)", link: "/patterns/singleton" },
          { text: "Decorator (декоратор)", link: "/patterns/decorator" },
          { text: "Proxy (заместитель)", link: "/patterns/proxy" },
          { text: "Composer (мактрахер)", link: "/patterns/composer" },
          {
            text: "Dependecy Injection (внедрение зависимостей)",
            link: "/patterns/dependency-injection",
          },
        ],
      },
      {
        text: "Техники",
        items: [
          {
            text: "Интернационализация (i18n)",
            link: "/concepts/i18n",
          },
          {
            text: "Контейнер зависимостей (di)",
            link: "/concepts/dependency-injection",
          },
          {
            text: "Логирование (logger)",
            link: "/concepts/logger",
          },
          {
            text: "Сессии (session)",
            link: "/concepts/session",
          },
          {
            text: "Гварды (guards)",
            link: "/concepts/guards",
          },
          {
            text: "Сцены (scenes)",
            link: "/concepts/scenes/index",
            items: [
              {
                text: "Как зарегистрировать сцену",
                link: "/concepts/scenes/how-register-scene",
              },
            ],
          },
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
