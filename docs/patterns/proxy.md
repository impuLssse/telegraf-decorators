# Proxy (заместитель)

Это шаблон проектирования, предоставляющий объект, который контроллирует доступ к другому объекту. Таким способом можно перехватывать вызовы к настоящему прототипу класса. Чем-то похож на декоратор, ибо можно разделить программные слои и внедрить свои фичи.

### Когда это полезно?

- Можно внедрить кэширование
- Перехватывать запросы
- Логировать
- Шифровать данные перед отправкой куда-то
- Анализ кол-ва обращений к прототипу
- Проверка доступа перед исполнением

### Как я использовал Proxy для динимаческого получения ключей объекта

```typescript
import { EcosystemException } from "../../ecosystem-exception";
import { AwilixContainer, asClass, createContainer } from "awilix";

type Constructor<C = any> = new (...args: any[]) => C;

export class EcosystemContainer<T extends Record<string, any> = {}> {
  /** Словарь зарегистрированных классов, фукнций, значений */
  private container: AwilixContainer;

  constructor() {
    this.container = createContainer({
      /** Про разницу режимов инъекций можно почитать в /patterns/dependency-injection */
      injectionMode: "CLASSIC",
      strict: true,
    });
  }

  /**
   * Регистрация зависимостей
   * @param services - объект с парами { имя: класс }
   */
  register<U extends Record<string, Constructor>>(nameAndRegistationPair: U) {
    for (const [key, value] of Object.entries(nameAndRegistationPair)) {
      this.container.register(key, asClass(value).singleton());
    }

    /**
     * Возвращаемый тип нового контейнера объединяет уже зарегистрированные зависимости (T) и новые зависимости (U), создавая объединенный тип.
     */
    return this as EcosystemContainer<T & { [K in keyof U]: InstanceType<U[K]> }>;
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
```

### Преимущества

- Типизация сохранена: каждый раз при вызове register типы зарегистрированных сервисов сохраняются и обновляются.
- Гибкость: вы можете регистрировать любые классы, и их типы автоматически будут доступны через метод resolve.
- Удобство: код остается читаемым и расширяемым.
