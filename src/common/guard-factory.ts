import { Context } from "telegraf";

export class GuardFactory<Ctx extends Context = Context> {
  static instance: GuardFactory;

  private constructor() {}

  static getIntance(): GuardFactory {
    if (!GuardFactory.instance) {
      GuardFactory.instance = new GuardFactory();
      return GuardFactory.instance;
    }

    return GuardFactory.instance;
  }

  createGuard(newGuard: (ctx: Ctx, next: Function) => void) {
    return newGuard;
  }
}
