import { IContext, SceneContract } from "../shared.types";
import { Action, Scene, SceneEnter, UseGuard } from "../common";

@Scene(SceneContract.ControlUser)
export class ControlUserScene {
  @UseGuard()
  @SceneEnter()
  async enterScene(ctx: IContext) {
    await ctx.okAndEdit(
      `\Управление пользователем: \`${ctx.session.userContoller._id}\`:\`${ctx.session.userContoller?.authPhone}\`  `,
      {
        ...ctx.k.simpleInlineKeyboard([["Сбросить дневной лимит СМС"], ["Назад"]]),
      },
    );
  }

  @Action("Назад")
  async back(ctx: IContext) {
    await ctx.scene.enter(SceneContract.WaitingControlUserId);
  }

  @Action("Сбросить дневной лимит СМС")
  async resetDailySmsLimit(ctx: IContext) {
    console.log(`Тут логика сброса смс`);
  }
}
