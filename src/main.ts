import {
  IContextTypedFunctions,
  MiddlewareFunction,
  SceneRegistrationOptions,
  UseGuardFn,
} from "./types";
import { Stage } from "telegraf/scenes";
import { message } from "telegraf/filters";
import { isAsyncFunction } from "util/types";
import { ExtraModule, KeyboardModule } from "./common";
import { EcosystemTypes } from "./common/lib-decorators";
import { Context, Telegraf, Scenes as TelegrafScenes } from "telegraf";

export interface EcosystemConfig<Ctx extends Context = Context> {
  bot: Telegraf<Ctx>;
  onSceneRegistered?(sceneId: string): Promise<void> | void;
}

/**
 * Эта коробка приложения, котора будет хранить все обработчики, команды и сцены
 */
export class Ecosystem<Ctx extends Context = Context> {
  public bot: Telegraf<Ctx>;
  private stage: Stage<any>;
  private readonly scenesRegistry = new Set<EcosystemTypes.SceneComponent>();
  private readonly updatesRegistry = new Set<EcosystemTypes.UpdateComponent>();

  static async createBotEcosystem<Ctx extends Context = Context>(
    ecosystemConfig: EcosystemConfig<Ctx>
  ) {
    const createdBotEcosystem = new Ecosystem<Ctx>();
    await createdBotEcosystem.init(ecosystemConfig);
  }

  private async init(ecosystemConfig: EcosystemConfig<Ctx>) {
    this.stage = new Stage();
    this.bot = ecosystemConfig.bot;

    /**
     * Кто не знал - композер
     */
    if (!(Object.getPrototypeOf(ecosystemConfig.bot) instanceof Object)) {
      throw new Error(`Необходимо передать экземпляр класса telegraf`);
    }

    /** Регистрируем свои классы, которые позволяют удобные работать с Telegraf */
    this.bot.use(this.injectInternalModules());

    /** Регистрируем сцены */
    await this.registerScenes([...this.scenesRegistry]);

    /** Регистрируем все глобальные обработчики */
    this.registerUpdates([...this.updatesRegistry]);
  }

  /** Конструкор прячем, чтобы никто не мог создать экземпляр класса синхронно */
  private constructor() {}

  private injectInternalModules() {
    return (ctx: Ctx, next: Function): void => {
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
    };
  }

  private handleGuardCycle(guards: UseGuardFn<Ctx>[]): MiddlewareFunction {
    return async (ctx: any, next: Function) => {
      /**
       * Chain of Responsability — строится цепочка зависимых от друг друга фукнций.
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

      return next();
    };
  }

  private getGuards(
    instance: EcosystemTypes.SceneOrUpdateComponent,
    handler: string
  ): UseGuardFn<Ctx>[] {
    return instance?.guards?.get(handler) || [];
  }

  /**
   * Регистрация глобальных команд, миддлваров
   */
  private registerUpdates(updateModules: EcosystemTypes.UpdateComponent[]): void {
    for (const updateModule of updateModules) {
      /** Экземпляр обновления - класс на который навешали декоратор @Update */
      const updateInsance = new updateModule();

      /** Регистрируем все мидллвары, которые объявлены глобально через @Use */
      if (updateInsance?.middlewares?.length) {
        const middlewares: MiddlewareFunction[] = updateInsance?.middlewares.map(
          (middlewareKey) => updateInsance[middlewareKey]
        );
        this.bot.use(...middlewares);
      }

      /** Регистрируем все слушатели событый, которые объявлены глобально через @On */
      for (const hearsListener of updateInsance.hearsListeners || []) {
        this.bot.hears(
          hearsListener.triggers,
          this.handleGuardCycle(updateInsance.guards.get(hearsListener.handler)),
          updateInsance[hearsListener.handler]
        );
      }

      /** Регистрируем все слушатели событый, которые объявлены глобально через @On */
      for (const eventListener of updateInsance.eventListeners || []) {
        this.bot.on(
          message(...eventListener.filters),
          this.handleGuardCycle(updateInsance.guards.get(eventListener.handler)),
          updateInsance[eventListener.handler]
        );
      }

      /** Регистрируем все команды бота, которые объявлены глобально через @On */
      for (const commandListener of updateInsance.commandListeners || []) {
        this.bot.command(
          commandListener.commands,
          this.handleGuardCycle(updateInsance.guards.get(commandListener.handler)),
          updateInsance[commandListener.handler]
        );
      }
    }
  }

  /**
   * Регистрация сцен через декораторы
   */
  private async registerScenes(
    sceneModules: EcosystemTypes.SceneComponent[],
    options?: SceneRegistrationOptions
  ): Promise<void> {
    const registeredScenes: string[] = [];

    for (const sceneModule of sceneModules) {
      /** Проверяем была ли уже зарегистрирована сцена */
      const hasSceneRegistered = registeredScenes.includes(sceneModule.sceneId);
      if (hasSceneRegistered) {
        throw new Error(`Scene ${sceneModule.sceneId} is already registred`);
      }

      /** Создаем экземпляр сцены */
      const sceneInstance = new sceneModule.constructor();
      console.log(`SceneInstance:`, sceneInstance);
      // if (Object.getPrototypeOf(sceneInstance)) {}

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

        scene.enter(
          this.handleGuardCycle(guards),
          sceneInstance[handler].bind(sceneInstance)
        );
      });

      /** Регистрируем действия внутри сцены */
      sceneInstance.actionListeners?.forEach(
        ({ actionId, handler }: EcosystemTypes.ActionHandler) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.action(
            actionId,
            this.handleGuardCycle(guards),
            sceneInstance[handler].bind(sceneInstance)
          );
        }
      );

      /** Регистрируем hears внутри сцены */
      sceneInstance.hearsListeners?.forEach(
        ({ triggers, handler }: EcosystemTypes.HearsHandler) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.hears(
            triggers,
            this.handleGuardCycle(guards),
            sceneInstance[handler].bind(sceneInstance)
          );
        }
      );

      /** Регистрируем on внутри сцены */
      sceneInstance.eventListeners?.forEach(
        ({ filters, handler }: EcosystemTypes.EventHandler) => {
          const guards = this.getGuards(sceneInstance, handler);

          scene.on(
            message(...filters),
            this.handleGuardCycle(guards),
            sceneInstance[handler].bind(sceneInstance)
          );
        }
      );

      /** Регистрируем все сцены с помощью Stage */
      this.stage.register(scene);
      registeredScenes.push(sceneModule.sceneId);
    }

    /** Используем middleware для работы со сценами */
    this.bot.use(this.stage.middleware());
  }
}
