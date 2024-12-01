import chalk from "chalk";

export class EcosystemException extends Error {
  constructor(message: string) {
    super(message);
    this.message = chalk.bgRedBright(message);
  }

  static goToPublicChat() {
    return new EcosystemException(
      `Ты можешь вызывать эту команду только в публичном чате`
    );
  }

  static goToPrivateChat() {
    return new EcosystemException(
      `Ты можешь вызывать эту команду только в приватном чате`
    );
  }

  static unknownSessionType() {
    return new EcosystemException(`Я не смог распознать SessionType`);
  }

  static redisLostConnection() {
    return new EcosystemException(`Не могу установить соединение с Redis`);
  }

  static notFoundFolderTransaltion() {
    return new EcosystemException(
      `Не удалось загрузить папку с переводами. Либо файлы переводов пустые`
    );
  }

  static notFoundFileTranslation() {
    return new EcosystemException(
      `Не удалось загрузить одиночный файл с переводами. Либо файл переводов пустой`
    );
  }

  static dependecyNotFound(dependency: string) {
    return new EcosystemException(`Завиcимость ${dependency} не найдена`);
  }

  static unexpectedJsonSyntax(path: string) {
    return new EcosystemException(`Не смог распарсить синтаксис файла перевода: ${path}`);
  }

  static translationNotFound(path: string) {
    return new EcosystemException(`Не смог найти ключ перевода: ${chalk.bold(path)}`);
  }

  static languageIsUndefined(errorPlace: string, lang: string) {
    return new EcosystemException(`Указанный язык ${lang} в ${errorPlace} не найден`);
  }
}
