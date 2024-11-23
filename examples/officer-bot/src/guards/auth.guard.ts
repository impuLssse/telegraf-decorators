import { IContext } from "../shared.types";

export const AuthGuard = async (ctx: IContext, next: Function) => {
  if (!["fakeaura", "impuLssse911"].includes(ctx.from.username)) {
    await ctx.reply("Доступ запрещен");
    return;
  }
  return next();
};
