import {
  ISceneComponent,
  ISceneRaw,
  IUpdateComponent,
  IUpdateRaw,
  TriggerFunction,
  UseGuardFn,
} from "./common/lib-decorators";
import {
  IContextTypedFunctions,
  MiddlewareFunction,
  SceneRegistrationOptions,
} from "./types";
import { Stage } from "telegraf/scenes";
import { message } from "telegraf/filters";
import { isAsyncFunction } from "util/types";
import { ExtraModule, KeyboardModule } from "./common";
import { Context, Telegraf, Scenes as TelegrafScenes } from "telegraf";
/**
 * Эта коробка приложения, котора будет хранить все обработчики, команды и сцены
 */
export class RootModule<Ctx extends Context = Context> {
  static scenesRegistry = new Set<ISceneRaw>();
  static updatesRegistry = new Set<IUpdateRaw>();

  constructor(private bot: Telegraf<Ctx>, private stage: Stage<any, any>) {
    /** Регистрируем свои классы, которые позволяют удобные работать с Telegraf */
    this.bot.use((ctx, next) => {
      const newCtx = ctx as Ctx &
        IContextTypedFunctions & {
          k: KeyboardModule;
        };

      /**
       * Пакет telegram-keyboard это обёртка над Markup в telegraf, а мой пакет это обёртка над telegraf и telegram-keyboard :)
       */
      const keyboardModule = KeyboardModule.getInstance();
      const extraModule = ExtraModule.getInstance();

      newCtx.ok = extraModule.ok.apply(extraModule, [ctx, next]);
      newCtx.okAndEdit = extraModule.okAndEdit.apply(extraModule, [ctx, next]);
      newCtx.k = keyboardModule;
      return next();
    });
  }

  private async handleGuardCycle(ctx: Ctx, guards: UseGuardFn<Ctx>[]): Promise<void> {
    /**
     * Chain of Responsability — паттерн преоктирования, при котором строится цепочка зависимых от друг друга фукнций.
     *
     * @see —
     */
    for (let i = 0; i < guards.length; i++) {
      const guard = guards[i];
      const nextGuard = guards[i + 1];

      /** Функция заглушка, которая нужна на случай если чел вызовет undefined, а следующего обработчика нет */
      const emptyFunction = () => {};

      if (isAsyncFunction(guard)) {
        await guard(ctx, nextGuard ?? emptyFunction);
      } else {
        guard(ctx, nextGuard ?? emptyFunction);
      }
    }
  }

  private getGuards(
    sceneInstance: ISceneComponent<Ctx>,
    handler: string
  ): UseGuardFn<Ctx>[] {
    return sceneInstance?.guards?.get(handler) || [];
  }

  /**
   * Регистрация глобальных команд, миддлваров
   */
  registerUpdates(updateModules: IUpdateRaw[]): void {
    for (const updateModule of updateModules) {
      /** Экземпляр обновления - класс на который навешали декоратор @Update */
      const updateInsance: IUpdateComponent = new updateModule.constructor();

      /** Регистрируем все мидллвары, которые объявлены глобально через @Use */
      if (updateInsance?.middlewares?.length) {
        const middlewares: MiddlewareFunction[] = updateInsance?.middlewares.map(
          (middlewareKey) => updateInsance[middlewareKey]
        );
        this.bot.use(...middlewares);
      }

      /** Инициализируем обработчики событый Hears */
      if (!updateInsance?.hearsListeners) {
        updateInsance.hearsListeners = [];
      }
      /** Инициализируем все команды бота */
      if (!updateInsance?.commandListeners) {
        updateInsance.commandListeners = [];
      }
      /** Инициализируем все глобальные слушатели событый */
      if (!updateInsance?.eventListeners) {
        updateInsance.eventListeners = [];
      }

      /** Регистрируем обработчики событый Hears */
      for (const hearsListener of updateInsance.hearsListeners) {
        this.bot.hears(hearsListener.trigger, updateInsance[hearsListener.handler]);
      }
      /** Регистрируем все команды бота */
      for (const eventListener of updateInsance.eventListeners) {
        this.bot.on(
          message(...eventListener.trigger),
          updateInsance[eventListener.handler]
        );
      }
      /** Регистрируем все глобальные слушатели событый */
      for (const commandListener of updateInsance.commandListeners) {
        this.bot.command(commandListener.trigger, updateInsance[commandListener.handler]);
      }
    }
  }

  /**
   * Регистрация сцен через декораторы
   */
  registerScenes(sceneModules: ISceneRaw[], options?: SceneRegistrationOptions): void {
    const registeredSceneNames: string[] = [];

    const registeredScenes = sceneModules
      .map(async (sceneModule) => {
        const isAlreadyRegistred = registeredSceneNames.some(
          (sceneName) => sceneName == sceneModule.sceneId
        );
        if (isAlreadyRegistred) {
          throw new Error(`Scene ${sceneModule.sceneId} is already registred`);
        }

        /** Создаем экземпляр сцены */
        const sceneInstance = new sceneModule.constructor();
        registeredSceneNames.push(sceneModule.sceneId);

        /** Создаем экземпляр сцены в телеграфе */
        const scene = new TelegrafScenes.BaseScene<Ctx>(sceneModule.sceneId);

        /** Если нужна уведомлялка о регистрации сцены - можно указать в onSceneRegistered */
        if (options?.onSceneRegistered) {
          if (isAsyncFunction(options?.onSceneRegistered)) {
            await options.onSceneRegistered(sceneModule.sceneId);
          } else {
            options.onSceneRegistered(sceneModule.sceneId);
          }
        }

        /** Регистрируем вход в сцену */
        sceneInstance.sceneEnterHandlers?.forEach(async (handler: string) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.enter(async (ctx, next) => {
            await this.handleGuardCycle(ctx as any, guards);
            return next();
          }, sceneInstance[handler].bind(sceneInstance));
        });

        /** Регистрируем действия внутри сцены */
        sceneInstance.actionListeners?.forEach(({ actionId, handler }: any) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.action(
            actionId,
            async (ctx, next) => {
              await this.handleGuardCycle(ctx as any, guards);
              return next();
            },
            sceneInstance[handler].bind(sceneInstance)
          );
        });

        /** Регистрируем hears внутри сцены */
        sceneInstance.hearsListeners?.forEach(({ trigger, handler }: TriggerFunction) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.hears(
            trigger,
            async (ctx, next) => {
              await this.handleGuardCycle(ctx as any, guards);
              return next();
            },
            sceneInstance[handler].bind(sceneInstance)
          );
        });

        /** Регистрируем on внутри сцены */
        sceneInstance.eventListeners?.forEach(({ filter, handler }: any) => {
          scene.on(message(filter), sceneInstance[handler].bind(sceneInstance));
        });
        return scene;
      })
      .filter(Boolean);

    /** Регистрируем все сцены с помощью Stage */
    registeredScenes.forEach(async (scene) => {
      this.stage.register(await scene);
    });

    /** Используем middleware для работы со сценами */
    this.bot.use(this.stage.middleware());
  }
}
