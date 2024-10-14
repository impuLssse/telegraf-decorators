import { AuthGuard } from "../../guards";
import { IContext, SceneContract } from "../../shared.types";
import { Scene, SceneEnter, Action, UseGuard } from "../../common";

@Scene(SceneContract.ControlOfficersHome)
export class ControlDoctorsMenuScene {
  @SceneEnter()
  async enter(ctx: IContext) {
    await ctx.okAndEdit("Выберите функцию", {
      ...ctx.k.simpleInlineKeyboard([["Список офицеров", "Добавить офицера"], ["Назад"]]),
    });
  }

  @UseGuard(AuthGuard)
  @Action("Назад")
  async back(ctx: IContext) {
    await ctx.scene.enter(SceneContract.Home);
  }

  @UseGuard(AuthGuard)
  @Action("Список офицеров")
  async controlUser(ctx: IContext) {
    await ctx.scene.enter(SceneContract.OfficerList);
  }

  @UseGuard(AuthGuard)
  @Action("Добавить офицера")
  async controlEmergencyAdminUsers(ctx: IContext) {
    await ctx.scene.enter(SceneContract.WaitingNameForNewOfficer);
  }
}