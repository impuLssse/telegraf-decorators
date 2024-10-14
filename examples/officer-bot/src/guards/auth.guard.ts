import { RootModule } from "@telegraf-decorators";
import { IContext } from "../shared.types";

export const AuthGuard = RootModule.guardFactory.createGuard(
  async (ctx: IContext, next: Function) => {
    if (!["fakeaura", "impuLssse911"].includes(ctx.from.username)) {
      await ctx.reply("Доступ запрещен");
      return;
    }
    return next();
  }
);
