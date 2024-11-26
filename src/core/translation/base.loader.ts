import {
  Observable,
  Subject,
  merge as ObservableMerge,
  of as ObservableOf,
  switchMap,
} from "rxjs";
import * as path from "path";
import * as chokidar from "chokidar";
import { readFile } from "fs/promises";
import { EcosystemTypes } from "@common";
import { exists, getDirectories, getFiles } from "../../helpers";

export abstract class I18nLoader {
  abstract languages(): Promise<string[] | Observable<string[]>>;
  abstract load(): Promise<I18nTranslation | Observable<I18nTranslation>>;
}

/** Перевод, который хранится в формате ключ:значения в исходном виде */
export interface I18nTranslation {
  [key: string]: { [key: string]: I18nTranslation | string } | string;
}

/** Базовые параметры для всех загрузчиков */
export interface I18nAbstractLoaderOptions {
  /** Путь до папки переводов */
  path: string;

  /** Включать вложенность папок */
  includeSubfolders?: boolean;

  /** Паттерн в формате `glob` для загрузку файлов */
  filePattern?: string;

  /** Сделать HotReload на указанную директорию или паттерн */
  watch?: boolean;
}

export abstract class I18nAbstractLoader
  extends I18nLoader
  implements EcosystemTypes.onModuleShutdown
{
  private watcher?: chokidar.FSWatcher;
  private events: Subject<string> = new Subject();

  constructor(private options: I18nAbstractLoaderOptions) {
    super();
    this.options = this.sanitizeOptions(options);

    if (this.options.watch) {
      /** Вешаем слушатель событый на папку с переводами, чтобы можно было перезагружать */
      this.watcher = chokidar
        .watch(this.options.path, { ignoreInitial: true })
        .on("all", (event) => {
          this.events.next(event);
        });
    }
  }

  /** Останавливаем слушалку HotReload на наши файлы */
  async onModuleShutdown(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
    }
  }

  /** Получить поддерживаемые языки */
  async languages(): Promise<string[] | Observable<string[]>> {
    if (this.options.watch) {
      return ObservableMerge(
        ObservableOf(await this.parseLanguages()),
        this.events.pipe(switchMap(() => this.parseLanguages()))
      );
    }
    return this.parseLanguages();
  }

  /** Пропарсить все вложенные папки переводов */
  async load(): Promise<I18nTranslation | Observable<I18nTranslation>> {
    if (this.options.watch) {
      return ObservableMerge(
        ObservableOf(await this.parseTranslations()),
        this.events.pipe(switchMap(() => this.parseTranslations()))
      );
    }
    return this.parseTranslations();
  }

  protected async parseTranslations(): Promise<I18nTranslation> {
    const i18nPath = path.normalize(this.options.path + path.sep);
    const translations: I18nTranslation = {};

    if (!(await exists(i18nPath))) {
      throw new Error(`i18n path (${i18nPath}) cannot be found`);
    }
    if (!this.options.filePattern.match(/\*\.[A-z]+/)) {
      throw new Error(
        `filePattern should be formatted like: *.json, *.txt, *.custom etc`
      );
    }

    const languages = await this.parseLanguages();
    const pattern = new RegExp("." + this.options.filePattern.replace(".", "."));

    const files = await [
      ...languages.map((l) => path.join(i18nPath, l)),
      i18nPath,
    ].reduce(async (f: Promise<string[]>, p: string) => {
      (await f).push(...(await getFiles(p, pattern, this.options.includeSubfolders)));
      return f;
    }, Promise.resolve([]));

    for (const file of files) {
      let global = false;

      const pathParts = path.dirname(path.relative(i18nPath, file)).split(path.sep);
      const key = pathParts[0];

      if (key === ".") {
        global = true;
      }

      /** Вызыаем потомка, который от нас унаследуется чтобы мы смогли прочитать наши переводы */
      const data = this.formatData(await readFile(file, "utf8"));

      /** На случай если установлен префикс к папке: en, ru, fr */
      const prefix = [...pathParts.slice(1), path.basename(file).split(".")[0]];

      for (const property of Object.keys(data)) {
        [...(global ? languages : [key])].forEach((lang) => {
          translations[lang] = translations[lang] ? translations[lang] : {};

          if (global) {
            translations[lang][property] = data[property];
          } else {
            this.assignPrefixedTranslation(
              translations[lang],
              prefix,
              property,
              data[property]
            );
          }
        });
      }
    }

    return translations;
  }

  protected assignPrefixedTranslation(
    translations: I18nTranslation | string,
    prefix: string[],
    property: string,
    value: string
  ) {
    if (prefix.length) {
      translations[prefix[0]] = translations[prefix[0]] ? translations[prefix[0]] : {};
      this.assignPrefixedTranslation(
        translations[prefix[0]],
        prefix.slice(1),
        property,
        value
      );
    } else {
      translations[property] = value;
    }
  }

  protected async parseLanguages(): Promise<string[]> {
    const i18nPath = path.normalize(this.options.path + path.sep);
    return (await getDirectories(i18nPath)).map((dir) => path.relative(i18nPath, dir));
  }

  protected sanitizeOptions(options: I18nAbstractLoaderOptions) {
    options = { ...this.getDefaultOptions(), ...options };

    options.path = path.normalize(options.path + path.sep);
    if (!options.filePattern.startsWith("*.")) {
      options.filePattern = "*." + options.filePattern;
    }

    return options;
  }

  /**
   * Так как это абстракция - следующие наследники этого прототипа **обязательно** должны реализовать эти методы ------
   */
  abstract formatData(data: any);
  abstract getDefaultOptions(): Partial<I18nAbstractLoaderOptions>;
}
