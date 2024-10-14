import {
  ISceneComponent,
  ISceneRaw,
  IUpdateComponent,
  IUpdateRaw,
  TriggerFunction,
  UseGuardFn,
} from "./common/lib-decorators";
import { message } from "telegraf/filters";
import { ExtraModule, KeyboardModule, GuardFactory } from "./common";
import {
  IContextTypedFunctions,
  MiddlewareFunction,
  SceneRegistrationOptions,
} from "./types";
import { Context, Telegraf, Scenes as TelegrafScenes } from "telegraf";
import { isAsyncFunction } from "util/types";

/**
 * Эта коробка приложения, котора будет хранить все обработчики, команды и сцены
 */
export class RootModule<Ctx extends Context = Context> {
  static scenesRegistry = new Set<ISceneRaw>();
  static updatesRegistry = new Set<IUpdateRaw>();

  static guardFactory: GuardFactory;

  constructor(private bot: Telegraf<Ctx>) {
    /** Регистрируем свои классы, которые позволяют удобные работать с Telegraf */
    this.bot.use((ctx, next) => {
      const newCtx = ctx as Ctx &
        IContextTypedFunctions & {
          k: KeyboardModule;
        };

      const keyboardModule = KeyboardModule.getInstance();
      const extraModule = ExtraModule.getInstance();

      newCtx.ok = extraModule.ok.apply(extraModule, [ctx, next]);
      newCtx.okAndEdit = extraModule.okAndEdit.apply(extraModule, [ctx, next]);

      newCtx.k = keyboardModule;
      return next();
    });
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
      .map((sceneModule) => {
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
            options.onSceneRegistered(sceneModule.sceneId);
          } else {
            options.onSceneRegistered(sceneModule.sceneId);
          }
        }

        /** Регистрируем вход в сцену */
        sceneInstance.sceneEnterHandlers?.forEach((handler: string) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.enter(async (ctx, next) => {
            for (const guard of guards) {
              return guard(ctx, next);
            }
            return next();
          }, sceneInstance[handler].bind(sceneInstance));
        });

        /** Регистрируем действия внутри сцены */
        sceneInstance.actionListeners?.forEach(({ actionId, handler }: any) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.action(
            actionId,
            async (ctx, next) => {
              for (const guard of guards) {
                return guard(ctx as any, next);
              }
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
              for (const guard of guards) {
                return guard(ctx as any, next);
              }
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

    /** Создаем stage с зарегистрированными сценами */
    const stage = new TelegrafScenes.Stage(registeredScenes as any);

    /** Используем middleware для работы со сценами */
    this.bot.use(stage.middleware() as any);
  }
}
