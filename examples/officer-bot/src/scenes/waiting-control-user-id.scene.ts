import { isValidObjectId, Types } from "mongoose";
import { IContext, SceneContract } from "../shared.types";
import { Scene, SceneEnter, Hears, Action } from "@telegraf-decorators";

@Scene(SceneContract.WaitingControlUserId)
export class WaitingControlUserIdScene {
  @SceneEnter()
  async enter(ctx: IContext) {
    await ctx.okAndEdit("Введите *userId* для управления пользователем", {
      ...ctx.k.simpleInlineKeyboard(["Назад"]),
    });
  }

  @Action("Назад")
  async back(ctx: IContext) {
    await ctx.scene.enter(SceneContract.Home);
  }

  @Hears(/\d/)
  async listenUserId(ctx: IContext) {
    const potentialUserId = ctx.message.text.trim();
    const isValidUserId = isValidObjectId(potentialUserId);
    if (!isValidUserId) {
      await ctx.ok("Введен не правильный objectId");
      return;
    }

    const foundUser = await ctx.di.userService.findUser(
      new Types.ObjectId(potentialUserId)
    );
    if (!foundUser) {
      await ctx.ok("Пользователь не найден");
      return;
    }

    ctx.session.userContoller = foundUser;
    await ctx.scene.enter(SceneContract.ControlUser);
  }
}
