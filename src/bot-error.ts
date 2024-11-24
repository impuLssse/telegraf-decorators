export class BotError extends Error {
  constructor(message: string) {
    super(message);
  }

  static goToPublicChat() {
    return new BotError(`Ты можешь вызывать эту команду только в публичном чате`);
  }

  static goToPrivateChat() {
    return new BotError(`Ты можешь вызывать эту команду только в приватном чате`);
  }
}
