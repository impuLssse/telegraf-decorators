import { AuthGuard } from "../../guards";
import { IContext, SceneContract } from "../../shared.types";
import { Scene, SceneEnter, Action, UseGuard } from "../../common";
import { knexClient } from "@bot/hei/main";

@Scene(SceneContract.ControlOneOfOfficer)
export class ControlOneOfOfficerScene {
  @SceneEnter()
  async enter(ctx: IContext) {
    await ctx.okAndEdit(`Управление над: ${ctx.session.officerController.name}`, {
      ...ctx.k.simpleInlineKeyboard([["Удалить"], ["Назад"]]),
    });
  }

  @UseGuard(AuthGuard)
  @Action("Удалить")
  async back(ctx: IContext) {
    await knexClient.table('officers').delete('*').where('id', '=', ctx.session.officerController.id)
    await ctx.scene.enter(SceneContract.ControlOfficersHome);
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