import { knexClient } from "@main";
import { AuthGuard } from "../../guards";
import { IContext, IOfficer, SceneContract } from "../../shared.types";
import { Scene, SceneEnter, Action, UseGuard, On } from "../../../../../src";

@Scene(SceneContract.WaitingPhoneForNewOfficer)
export class WaitingPhoneForNewOfficerScene {
  @SceneEnter()
  async enter(ctx: IContext) {
    // await ctx.okAndEdit("Введите телефон для нового офицера", {
    //   ...ctx.k.simpleInlineKeyboard(["Назад"]),
    // });
  }

  @On("text")
  async controlOneOfficer(ctx: IContext) {
    const anyText = ctx.message.text.split(" ");
    if (
      !anyText ||
      anyText.length > 1 ||
      !anyText[0]?.startsWith("79") ||
      (anyText?.length > 10 && anyText.length < 3)
    ) {
      return ctx.reply(`Отправьте телефон человека в таком формате: 79222690348`);
    }

    const officerAlreadyExist = await knexClient
      .table("officers")
      .select("*")
      .where("phone", "=", anyText);
    if (officerAlreadyExist.length) {
      return ctx.reply("Офиицер с таким телефоном уже существует");
    }

    ctx.session.officerController.phone = anyText[0];
    const { phone, name } = ctx.session.officerController;
    const createdOfficer = (
      await knexClient
        .table("officers")
        .insert({
          phone,
          name,
        })
        .returning<IOfficer[]>("*")
    )?.[0];

    await ctx.scene.enter(SceneContract.ControlOfficersHome);
    console.log(`createdOfficer:`, createdOfficer);

    await ctx.ok(
      `Создан офицер с именем: *${createdOfficer?.name}* и телефоном: *${createdOfficer?.phone}*`
    );
  }

  @UseGuard(AuthGuard)
  @Action("Назад")
  async back(ctx: IContext) {
    await ctx.scene.enter(SceneContract.WaitingNameForNewOfficer);
  }
}
