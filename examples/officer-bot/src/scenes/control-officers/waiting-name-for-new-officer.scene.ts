import { AuthGuard } from "../../guards";
import { IContext, SceneContract } from "../../shared.types";
import { Scene, SceneEnter, Action, UseGuard, On } from "../../../../../src";

@Scene(SceneContract.WaitingNameForNewOfficer)
export class WaitingNameForNewOfficerScene {
  @SceneEnter()
  async enter(ctx: IContext) {
    await ctx.okAndEdit(
      "Введите имя для нового офицера, которому позвонят если упадет что то",
      {
        ...ctx.k.simpleInlineKeyboard(["Назад"]),
      }
    );
  }

  @On("text")
  async controlOneOfficer(ctx: IContext) {
    const anyText = ctx.message.text.split(" ");
    if (anyText.length > 1) {
      return ctx.reply(`Отправьте имя человека`);
    }

    const officerName = anyText[0];
    ctx.session.officerController = {
      name: officerName,
    };
    await ctx.scene.enter(SceneContract.WaitingPhoneForNewOfficer);
  }

  @UseGuard(AuthGuard)
  @Action("Назад")
  async back(ctx: IContext) {
    await ctx.scene.enter(SceneContract.ControlOfficersHome);
  }
}
