import {
  AwilixContainer,
  createContainer,
  asClass as asClassAwilix,
  asValue as asValueAwilix,
  RegistrationHash,
} from "awilix";
import { EcosystemException } from "./ecosystem-exception";
import { ConstructorClasses, ConstuctorValues } from "./types";

export type EcosystemInjection<
  S extends Record<string, ConstructorClasses>,
  V extends Record<string, ConstuctorValues>
> = {
  asClass?: S;
  asValue?: V;
};

export type InjectionMethod = "AS_VALUE" | "AS_CLASS";

export class EcosystemContainer<T extends Record<string, any> = {}> {
  /** Словарь зарегистрированных классов, фукнций, значений */
  private container: AwilixContainer;

  private constructor() {
    this.container = createContainer({
      /** Про разницу режимов инъекций можно почитать в /patterns/dependency-injection */
      injectionMode: "CLASSIC",
      strict: true,
    });
  }

  get registrations(): RegistrationHash {
    return this.container.registrations;
  }

  static createContainer<
    S extends Record<string, ConstructorClasses>,
    V extends Record<string, ConstuctorValues>
  >(injection: EcosystemInjection<S, V>) {
    const newContainer = new EcosystemContainer<S & V>();
    return newContainer.register<S, V>(injection);
  }

  register<
    S extends Record<string, ConstructorClasses>,
    V extends Record<string, ConstuctorValues>
  >({ asClass, asValue }: EcosystemInjection<S, V>) {
    for (const [key, value] of Object.entries(asClass)) {
      this.container.register(key, asClassAwilix(value).singleton());
    }
    for (const [key, value] of Object.entries(asValue)) {
      this.container.register(key, asValueAwilix(value));
    }

    /**
     * Возвращаемый тип нового контейнера объединяет уже зарегистрированные
      зависимости и новые зависимости, создавая объединенный тип.
     */
    return this as EcosystemContainer<
      { [K in keyof S]: InstanceType<S[K]> } & {
        [K in keyof V]: V[K] extends abstract new (...args: any) => any
          ? keyof InstanceType<V[K]>
          : V[K];
      }
    >;
  }

  /**
   * Получение зависимости
   * @param key - ключ зарегистрированной зависимости
   */
  resolve<K extends keyof T>(dependency: K): T[K] {
    return this.container.resolve(dependency as string) as T[K];
  }

  /**
   * Паттерн проектирования Proxy
   * @see — /patterns/proxy
   */
  get dependencyContainer(): T {
    /** Создаем шпиона, который будет перехватывать запросы к прототипу */
    const proxy = new Proxy(this, {
      get: (target: any, propertyKey: string) => {
        if (propertyKey in target) {
          return this.resolve(propertyKey);
        }

        throw EcosystemException.dependecyNotFound(propertyKey);
      },
    });
    return proxy;
  }
}
