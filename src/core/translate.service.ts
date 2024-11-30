import path from "path";
import { Logger } from "../ecosystem-logger";
import { readFileSync, readdirSync } from "fs";
import { Project, SourceFile } from "ts-morph";
import { EcosystemException } from "../ecosystem-exception";

/**
 * Тип написан с помощью ChatGPT. Я бы никогда до такого не додумался
 */
type NestedPaths<T, P extends string = ""> = (T extends object
  ? {
      [K in keyof T]: K extends string
        ? NestedPaths<T[K], `${P}${P extends "" ? "" : "."}${K}`>
        : never;
    }[keyof T]
  : P) &
  string;

type TranslationParams =
  | Record<string, string | number | boolean>
  | Array<string | number | boolean>;

type LanguageToSource<L> = {
  /** Язык, который будет являться родителем указанной директории */
  language: L;

  /** Путь до папки, где лежат переводы */
  source: string;

  sourceFile: string;
};

type AddNewLanguage<P> = {
  /** Сконкатенированный объект из переводов */
  translationObject: object;

  /** Вложенные пути переводов */
  translationKeys: P[];

  /** Путь до папки, где лежат переводы */
  source: string;

  /** Все загруженные файлы переводов */
  sourceFiles: string[];
};

export interface TranslateOptions<Languages extends string> {
  /** В каком месте будет создаваться файл с типами */
  outputPath: string;

  /**
   * | Указать язык и папку с переводами в виде ключ:значение
   * | Указать JSON документ с переводами
   *
   * | Не указывайте папки, которые будут содержать строку: `.json`
   */
  import?: string | Record<Languages, string>;

  /** Как будет называться сгенерированный тип из переводов */
  typeName?: string;

  /** Язык, указанный по умолчанию */
  defaultLanguage?: Languages;

  hotReload?: true;
}

export class TranslateService<
  GeneratedPaths extends string,
  Languages extends string = string
> {
  /** Все возможные пути в указанных переводах */
  private translationKeys: NestedPaths<GeneratedPaths>[] = [];

  /** Сконкатенированный объект переводов (отсюда всевозможная карта ключей) */
  private translationObject: object = {};

  /** Ключ — указанный язык. Значение — сконкатенированный объект переводов */
  private languagesObject = new Map<
    Languages,
    AddNewLanguage<NestedPaths<GeneratedPaths>>
  >();

  constructor(private translateOptions: TranslateOptions<Languages>) {
    this.createTranslationEcosystem();
  }

  private createTranslationEcosystem() {
    const isSingleImport = typeof this.translateOptions.import == "string";

    /** Если указать один JSON файл то он будет загружен без парсинга */
    if (isSingleImport) {
      this.loadSingleFile(this.translateOptions.import as string);
      return;
    }

    const languagesWithSource = [Object.keys(this.translateOptions?.import)]
      .flat()
      .reduce((acc, currentLanguage) => {
        acc.push({
          language: currentLanguage,
          source: this.translateOptions?.import[currentLanguage],
        });
        return acc;
      }, []);

    this.loadMultipleFiles([...languagesWithSource]);
  }

  private loadSingleFile(source: string): void {
    const { translationKeys, translationObject } = this.loadTranslate(source);

    /** Эти поля нужны для работы с одиночным файлом переводов */
    this.translationObject = translationObject;
    this.translationKeys = translationKeys;

    /** Создаем файл с типами */
    const destinationTypeFile = path.resolve(source);
    this.generateTypes([source], destinationTypeFile);
  }

  private loadMultipleFiles(languagesWithSources: LanguageToSource<Languages>[]): void {
    const pathsToLoad: LanguageToSource<Languages>[] = [];

    try {
      for (const languageWithSource of languagesWithSources) {
        const files = readdirSync(languageWithSource.source, {
          encoding: "utf-8",
          recursive: true,
        });

        /**
         * 1. Складываем путь + файл
         * 2. Если это директория то пропускаем итерацию
         */
        for (const file of files) {
          if (!file.includes(".json")) {
            continue;
          }
          pathsToLoad.push({
            language: languageWithSource.language,
            source: languageWithSource.source,
            sourceFile: path.resolve(languageWithSource.source, file),
          });
        }
      }
    } catch (e: any) {
      Logger.fatal(`Error: ${e}`);
      throw EcosystemException.notFoundFolderTransaltion();
    }

    const languagesObject = [...pathsToLoad].reduce((acc, pathToLoad) => {
      /** Загружаемый файл перевода */
      const progressFile = this.loadTranslate(pathToLoad.sourceFile);

      if (acc.get(pathToLoad.language)) {
        const more = acc.get(pathToLoad.language);

        acc.set(pathToLoad.language, {
          translationKeys: progressFile.translationKeys.concat(more.translationKeys), // Набор ключей переводов
          translationObject: Object.assign(
            more.translationObject,
            progressFile.translationObject
          ), // Объект переводов
          source: pathToLoad.source, // Путь до папки переводов
          sourceFiles: more.sourceFiles.concat(pathToLoad.sourceFile), // Все загруженные файлы переводов
        });

        return acc;
      } else {
        acc.set(pathToLoad.language, {
          translationKeys: progressFile.translationKeys, // Набор ключей переводов
          translationObject: progressFile.translationObject, // Объект переводов
          source: pathToLoad.source, // Путь до папки переводов
          sourceFiles: [pathToLoad.sourceFile], // Все загруженные файлы переводов
        });
        return acc;
      }
    }, new Map<Languages, AddNewLanguage<NestedPaths<GeneratedPaths>>>());

    this.languagesObject = languagesObject;

    /** Инициализируем файл с типами */
    const destinationTypeFile = path.resolve(this.translateOptions.outputPath);

    const nestedPaths = [...languagesObject.values()]
      .map((l) => l.translationKeys as string[]) // Конкатенируем все языки
      .flat() // Опускаем уровни вложенностей
      .filter((l, index, array) => array.indexOf(l) == index); // Извлекаем все неуникальные значения

    /** Создаем итоговый файл с типами */
    this.generateTypes(nestedPaths, destinationTypeFile);
  }

  private loadTranslate(source: string, languagePrefix?: Languages) {
    const destinationI18nFile = path.resolve(source);
    let fileContent: string;

    try {
      fileContent = readFileSync(destinationI18nFile, { encoding: "utf-8" });
    } catch {
      throw EcosystemException.notFoundFileTranslation();
    }

    /**
     * 1. Создаем объект из переводов.
     * 2. Устанавливаем набор путей, состоящих из вложенности объектов
     */
    const translationObject = JSON.parse(fileContent);
    const translationKeys = this.extractNestedKeys(translationObject);
    return { translationObject, translationKeys };
  }

  /**
   * Получить перевод по пути
   *
   * @param key Полный путь до перевода
   * @returns
   */
  getTranslation(
    key: GeneratedPaths,
    params?: TranslationParams,
    language: Languages = this.translateOptions?.defaultLanguage
  ): string {
    const keys = key.split(".");

    /** После всей итерации результат - будет перевод, который мы получим */
    let result: any = language
      ? this.languagesObject.get(language).translationObject
      : this.translationObject;

    /** Итерируемся по ключам переводов */
    for (const key of keys) {
      if (result?.[key] === undefined) {
        throw new Error(`Translation not found`);
      }
      result = result[key];
    }

    if (params && Object.keys(params).length >= 1) {
      if (Array.isArray(params)) {
        params = params.reduce((paramsObject, param, currentIndex) => {
          paramsObject[`${currentIndex + 1}`] = param;
          return paramsObject;
        }, {});
      }

      /** Передаем объект с аргументами для их резольва */
      result = this.resolveTranslationArguments(result, params);
    }
    return String(result);
  }

  /**
   * Резольвит строку, заменяя {{key}} на значения из params
   *
   * @param template Строка с шаблонами
   * @param args Объект аргументов для подстановки
   * @returns Строка с подставленными значениями
   */
  private resolveTranslationArguments(template: string, params: object): string {
    /**
     * Это для резольва типа аргументов, которые объявлены так:
     *  {
     *   "hello": "Hi {{1}} man. I am {{2}}",
     *   "hello": "Hi {{name}} man. I am {{botName}}",
     *  }
     *
     * t.getTranslation("hello", ["Maxim", "Kapusta"], "en")
     * t.getTranslation("hello", { name: "Maxim", botName: "Kapusta" }, "en")
     */
    return template.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
      if (key in params) {
        return String(params?.[key]);
      }
      throw new Error(`Argument "${key}" is missing in the provided args.`);
    });
  }

  /**
   * Получить все пути перевода в виде массива уникальных вложенных путей
   */
  getPaths(language?: Languages): Readonly<NestedPaths<GeneratedPaths>[]> {
    return (
      this.languagesObject.get(language)?.translationKeys ||
      this.languagesObject.get(this.translateOptions.defaultLanguage)?.translationKeys ||
      this.translationKeys
    );
  }

  /**
   * Преобразует JSON объект в массив строковых путей
   * Если входной объект такой:
   * @example
      const ru = {
        penis: {
          vlozhenniyPenis: {
            huek: 1,
          },
        },
      };

      То на выходе получим: [ 'penis.vlozhenniyPenis.huek' ]
    *
    * @param obj JSON объект
    * @param prefix Префикс пути (для рекурсии)
    * @returns Список всех возможных вложенных путей
  */
  private extractNestedKeys(
    object: Object,
    prefix: string = ""
  ): NestedPaths<GeneratedPaths>[] {
    const paths = [];

    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        const value = object[key];
        const currentPath = prefix ? `${prefix}.${key}` : key;

        if (typeof value == "object" && value !== null) {
          paths.push(...this.extractNestedKeys(value, currentPath));
        } else {
          paths.push(currentPath);
        }
      }
    }
    return paths;
  }

  /**
   * Автоматически генерирует типы для переводов.
   * @param nestedPaths Вложенные пути по которым можно получить перевод
   * @param outputPath Путь к файлу для сохранения типов
   */
  private generateTypes(nestedPaths: string[], outputPath: string) {
    const project = new Project();
    const sourceFile = project.createSourceFile(outputPath, "", { overwrite: true });

    /** Генерируем файл типов */
    this.createTypeDefinition(nestedPaths, sourceFile);
    project.saveSync();
  }

  /**
   * Создает определение типа в файле.
   * @param sourceFile Файл для записи
   * @param paths Массив строковых путей
   */
  private createTypeDefinition(nestedPaths: string[], sourceFile: SourceFile): void {
    const typeName = this.translateOptions?.typeName || "TranslationKeys";
    const onionType = !nestedPaths.length
      ? `""`
      : nestedPaths.map((path) => `"${path}"`).join(" | ");

    sourceFile.addTypeAlias({
      name: typeName,
      isExported: true,
      type: onionType,
    });
  }
}
