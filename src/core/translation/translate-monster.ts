import path from "path";
import { readFileSync } from "fs";
import { Project, SourceFile } from "ts-morph";
import { TranslationKeys } from "./generated.types";

/**
 * Тип паписан с помощью ChatGPT. Я бы сам никогда бы не смог такое написать
 */
type NestedPaths<T, P extends string = ""> = (T extends object
  ? {
      [K in keyof T]: K extends string
        ? NestedPaths<T[K], `${P}${P extends "" ? "" : "."}${K}`>
        : never;
    }[keyof T]
  : P) &
  string;

export interface TranslateOptions {
  /** В каком месте будет создаваться файл с типами */
  outputPath: string;

  /** Указать JSON документ с переводами */
  loadJson: string;

  /** Как будет называться сгенерированный тип из переводов */
  typeName?: string;
}

export class TranslateService<GeneratedPaths> {
  private translationKeys: NestedPaths<GeneratedPaths>[] = [];
  private translationObject = {};

  constructor(private translateOptions: TranslateOptions) {
    this.createTranslationEcosystem();
  }

  private createTranslationEcosystem(): void {
    /** Подгружаем переводы из JSON */
    const destinationI18nFile = path.resolve(this.translateOptions.loadJson);
    const fileContent = readFileSync(destinationI18nFile, { encoding: "utf-8" });

    /**
     * 1. Создаем объект из переводов.
     * 2. Устанавливаем набор путей, состоящих из вложенности объектов
     */
    this.translationObject = JSON.parse(fileContent);
    this.translationKeys = this.translationKeys.concat(
      this.extractNestedKeys(this.translationObject)
    );

    /** Создаем файл с типами */
    const destinationTypeFile = path.resolve(this.translateOptions.outputPath);
    this.generateTypes(destinationTypeFile);
  }

  /**
   * Получить перевод по пути
   *
   * @param key Полный путь до перевода
   * @returns
   */
  getTranslation<K extends GeneratedPaths & string>(key: K): string {
    const keys = key.split(".");

    /** После всей итерации результат - будет перевод, который мы получим */
    let result: any = this.translationObject;

    /** Итерируемся по ключам переводов */
    for (const key of keys) {
      if (result?.[key] === undefined) {
        throw new Error(`Translation not found`);
      }
      result = result[key];
    }
    return String(result);
  }

  /**
   * Получить все пути перевода в виде массива строк.
   */
  getPaths(): Readonly<NestedPaths<GeneratedPaths>[]> {
    return this.translationKeys;
  }

  /**
   * Преобразует JSON объект в массив строковых путей.
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
   * @param outputPath Путь к файлу для сохранения типов
   */
  private generateTypes(outputPath: string) {
    const project = new Project();
    const sourceFile = project.createSourceFile(outputPath, "", { overwrite: true });

    /** Генерируем файл типов */
    this.createTypeDefinition(sourceFile);
    project.saveSync();
  }

  /**
   * Создает определение типа в файле.
   * @param sourceFile Файл для записи
   * @param paths Массив строковых путей
   */
  private createTypeDefinition(sourceFile: SourceFile): void {
    const paths = this.getPaths();
    const typeName = this.translateOptions?.typeName || "TranslationKeys";
    const onionType = !paths.length ? `{}` : paths.map((path) => `"${path}"`).join(" | ");

    sourceFile.addTypeAlias({
      name: typeName,
      isExported: true,
      type: onionType,
    });
  }
}

export function testFn() {}

export type Big = {
  user: {
    ola: string;
  };
};
const t = new TranslateService<TranslationKeys>({
  loadJson: path.resolve(__dirname, "./translates.json"),
  outputPath: path.resolve(__dirname, "./generated.types.ts"),
});
console.log(t.getTranslation("en.hello"));
