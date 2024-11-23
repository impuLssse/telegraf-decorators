import { Context } from "telegraf";
import { RootModule } from "../main";
import { Message } from "telegraf/typings/core/types/typegram";
import { DistinctKeys } from "telegraf/typings/core/helpers/util";

export type ISceneRaw<Ctx = Context> = {
  sceneId: string;
  constructor: new () => ISceneComponent<Ctx & Context>;
};
export type IUpdateRaw = { constructor: new () => IUpdateComponent };

export enum TypeModule {
  Scene = "Scene",
  Update = "Update",
}

export type UseGuardFn<Ctx> = (ctx: Ctx, next: Function) => Promise<void> | void;

export interface ISceneComponent<Ctx extends Context> {
  sceneEnterHandlers?: any[];
  hearsListeners?: TriggerFunction[];
  actionListeners?: TriggerFunction[];
  eventListeners?: EventFunction[];

  /** На один обработчик внутри сцены может быть несколько последовательных гварда */
  guards: Map<string, UseGuardFn<Ctx>[]>;
}

export type TriggerFunction = {
  trigger: RegExp | string | string[];
  handler: string;
};

export type EventFunction = {
  trigger: DistinctKeys<Message>[];
  handler: string;
};

export interface IUpdateComponent {
  middlewares?: string[];
  eventListeners?: EventFunction[];
  hearsListeners?: TriggerFunction[];
  commandListeners?: TriggerFunction[];
}

/** Декоратор для регистрации класса как сцены */
export function Scene(sceneId: string): ClassDecorator {
  return (constructor: any) => {
    RootModule.scenesRegistry.add({ sceneId, constructor });
  };
}

/** Декоратор для регистрации класса как сцены */
export function Update(): ClassDecorator {
  return (constructor: any) => {
    RootModule.updatesRegistry.add({ constructor });
  };
}

/** Декоратор для регистрации точки входа в сцену */
export function SceneEnter(): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    if (!target.sceneEnterHandlers) {
      target.sceneEnterHandlers = [];
    }
    target.sceneEnterHandlers.push(propertyKey);
  };
}

/** Декоратор для слушателей сообщений (hears) */
export function Hears(trigger: string | RegExp): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    if (!target.hearsListeners) {
      target.hearsListeners = [];
    }
    target.hearsListeners.push({ trigger, handler: propertyKey });
  };
}

/** Декоратор для действий (callback-кнопки) */
export function Action(actionId: string | RegExp): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    if (!target.actionListeners) {
      target.actionListeners = [];
    }
    target.actionListeners.push({ actionId, handler: propertyKey });
  };
}

/** Декоратор для команд */
export function Command(trigger: string | RegExp | string[]): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    if (!target.commandListeners) {
      target.commandListeners = [];
    }
    target.commandListeners.push({ trigger, handler: propertyKey });
  };
}

/** Декоратор для команд */
export function Use(): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    if (!target.middlewares) {
      target.middlewares = [];
    }
    target.middlewares.push(propertyKey);
  };
}

/** Декоратор для слушателей событий (callback-кнопки) */
export function On<Ks extends DistinctKeys<Message>[]>(
  ...listeners: Ks
): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    if (!target.eventListeners) {
      target.eventListeners = [];
    }
    target.eventListeners.push({ filter: listeners, handler: propertyKey });
  };
}

export function UseGuard<Ctx extends Context = Context>(
  ...guards: UseGuardFn<Ctx>[]
): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    if (!target.guards) {
      target.guards = new Map();
    }

    /** Устанавливаем на метод набор гвардов, который он указал через декоратор */
    target.guards.set(propertyKey, guards);
  };
}
