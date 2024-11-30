import { Context } from "telegraf";
import { Ecosystem } from "../main";
import { Message } from "@telegraf/types";
import { EcosystemException } from "../ecosystem-exception";
import { AllowChatType, DistinctKeys, UseGuardFn } from "../types";

export namespace EcosystemTypes {
  export interface onModuleShutdown {
    /**
     * Когда модуль будет выключен - будет вызвана эта функция.
     * Например, когда мы словили SIGINT сигнал (CTRL-C)
     */
    onModuleShutdown(): void | Promise<void>;
  }

  /** Класс на который навешали @Scene будет иметь конструктор и название сцены */
  export type SceneComponent = {
    sceneId: string;
    constructor: new () => SceneOrUpdateComponent;
  };

  /** Класс на который навешали @Update будет иметь только конструктор */
  export type UpdateComponent = new () => SceneOrUpdateComponent;

  /**
   * Компонент состоит из слушатели событый (action, on, hears)
   */
  export interface SceneOrUpdateComponent {
    ecosystem: Ecosystem;
    middlewares: string[];
    sceneEnterHandlers: string[];
    eventListeners: EcosystemTypes.EventHandler[];
    hearsListeners: EcosystemTypes.HearsHandler[];
    actionListeners: EcosystemTypes.ActionHandler[];
    commandListeners: EcosystemTypes.CommandHandler[];

    /** На один обработчик внутри обновления может быть несколько последовательных гварда */
    guards: Map<string, UseGuardFn<unknown>[]>;
  }

  export enum TypeModule {
    Scene = "Scene",
    Update = "Update",
  }

  export interface BaseHandler {
    handler: string;
  }

  /** Нужен для декоратора: On */
  export interface EventHandler extends BaseHandler {
    filters: DistinctKeys<Message>[];
  }

  /** Нужен для декоратора Action */
  export interface ActionHandler extends BaseHandler {
    actionId: RegExp | string | string[];
  }

  /** Нужен для декоратора Hears */
  export interface HearsHandler extends BaseHandler {
    triggers: RegExp | string | string[];
  }

  /** Нужен для декоратора Command */
  export interface CommandHandler extends BaseHandler {
    commands: string | string[];
  }
}

/** Декоратор для регистрации класса как сцены */
export function Scene(sceneId: string, botToken?: string): ClassDecorator {
  return (target: any) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;
    // https://stackoverflow.com/questions/63447699/integrating-nodejs-di-container-awilix-with-type-safety
    Ecosystem;
    // RootModule.scenesRegistry.add({ sceneId, constructor: target });
  };
}

/** Декоратор для регистрации класса как сцены */
export function Update(): ClassDecorator {
  return (target: any) => {
    // RootModule.updatesRegistry.add(target);
  };
}

/** Декоратор для регистрации точки входа в сцену */
export function SceneEnter(): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;

    if (!prototype.sceneEnterHandlers) {
      prototype.sceneEnterHandlers = [];
    }
    prototype.sceneEnterHandlers.push(propertyKey.toString());
  };
}

/** Декоратор для слушателей сообщений (hears) */
export function Hears(triggers: string | string[] | RegExp): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;

    if (!prototype.hearsListeners) {
      prototype.hearsListeners = [];
    }
    prototype.hearsListeners.push({ triggers, handler: propertyKey.toString() });
  };
}

/** Декоратор для действий (callback-кнопки) */
export function Action(actionId: string | RegExp): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;

    if (!prototype.actionListeners) {
      prototype.actionListeners = [];
    }
    prototype.actionListeners.push({ actionId, handler: propertyKey.toString() });
  };
}

/** Декоратор для команд */
export function Command(commands: string | string[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;

    if (!prototype.commandListeners) {
      prototype.commandListeners = [];
    }
    prototype.commandListeners.push({ commands, handler: propertyKey.toString() });
  };
}

/** Декоратор для команд */
export function Use(): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;

    if (!prototype.middlewares) {
      prototype.middlewares = [];
    }
    prototype.middlewares.push(propertyKey.toString());
  };
}

/** Декоратор для слушателей событий (callback-кнопки) */
export function On<Ks extends DistinctKeys<Message>[]>(...filters: Ks): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;

    if (!prototype.eventListeners) {
      prototype.eventListeners = [];
    }
    prototype.eventListeners.push({ filters, handler: propertyKey.toString() });
  };
}

export function UseGuard<Ctx extends Context = Context>(
  ...guards: UseGuardFn<Ctx>[]
): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const prototype = target as EcosystemTypes.SceneOrUpdateComponent;

    if (!prototype.guards) {
      target.guards = new Map();
    }

    const summaryGuards = (target.guards.get(propertyKey) || []).concat(guards);

    /** Устанавливаем на метод набор гвардов, который он указал через декоратор */
    prototype.guards.set(propertyKey.toString(), summaryGuards);
  };
}

export function ChatType(chatType: AllowChatType) {
  return UseGuard((ctx: Context, next: Function) => {
    if (
      chatType == AllowChatType.PUBLIC &&
      (ctx.chat.type == "group" || ctx.chat.type == "supergroup")
    ) {
      return next();
    }
    console.log(chatType, ctx.chat.type);
    if (chatType == AllowChatType.PRIVATE && ctx.chat.type !== "private") {
      throw EcosystemException.goToPrivateChat();
    }

    return next();
  });
}
