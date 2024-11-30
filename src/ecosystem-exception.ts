export class EcosystemException extends Error {
  constructor(message: string) {
    super(message);
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
    return new EcosystemException(`Завивимость ${dependency} не найдена`);
  }
}
