import { AuthGuard } from "@guards";
import {
  Scene,
  SceneEnter,
  Action,
  UseGuard,
  Command,
  Update,
  Use,
} from "../../../../src";
import { IContext, SceneContract } from "../shared.types";

@Scene(SceneContract.Home)
export class HomeScene {
  @SceneEnter()
  async enter(ctx: IContext) {
    console.log(321);

    await ctx.okAndEdit("Выберите функцию", {
      ...ctx.k.simpleInlineKeyboard([
        ["Управление пользователем"],
        ["Управление офицерами"],
      ]),
    });
  }

  @UseGuard(AuthGuard)
  @Action("Управление пользователем")
  async controlUser(ctx: IContext) {
    await ctx.scene.enter(SceneContract.WaitingControlUserId);
  }
  @UseGuard(AuthGuard)
  @Action("Управление офицерами")
  async controlEmergencyAdminUsers(ctx: IContext) {
    await ctx.scene.enter(SceneContract.ControlOfficersHome);
  }
}

@Update()
export class HomeUpdate {
  @Use()
  async sayLog(ctx: IContext, next: Function) {
    return next();
  }

  @Command("hello")
  async sayHello(ctx: IContext) {
    await ctx.reply("1");
  }
}
