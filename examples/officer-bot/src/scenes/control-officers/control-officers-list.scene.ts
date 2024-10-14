import { AuthGuard } from "../../guards";
import { knexClient } from "@bot/hei/main";
import { IContext, SceneContract } from "../../shared.types";
import { Scene, SceneEnter, Action, UseGuard } from "../../common";

@Scene(SceneContract.OfficerList)
export class ControlDoctorListScene {
  @SceneEnter()
  async enter(ctx: IContext) {
    const medicalOfficers = (await knexClient.table('officers').select()).map(officer => officer.name)

    const combinedKeyboard = ctx.k.combineKeyboard(
      ctx.k.simpleKeyboard([[...medicalOfficers]], 'officer'),
      ctx.k.simpleKeyboard(["Назад"])
    ).inline()

    await ctx.okAndEdit("Выберите персонажа", {
      ...combinedKeyboard,
    });
  }

  @UseGuard(AuthGuard)
  @Action(/officer/gi)
  async controlOneOfficer(ctx: IContext) {
    const officerName = ctx.callbackQuery.data.split('officer')[1]

    const foundOfficer = (await knexClient.table('officers').select('*').whereILike(`name`, officerName))?.[0]
    if (!foundOfficer) {
      return ctx.reply('Не смог найти')
    }
    ctx.session.officerController = foundOfficer
    await ctx.scene.enter(SceneContract.ControlOneOfOfficer);
  }

  @UseGuard(AuthGuard)
  @Action("Назад")
  async back(ctx: IContext) {
    ctx.session.officerController = undefined
    await ctx.scene.enter(SceneContract.ControlOfficersHome);
  }
}