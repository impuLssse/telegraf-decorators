import {
  BehaviorSubject,
  Observable,
  Subject,
  lastValueFrom,
  take,
  takeUntil,
} from "rxjs";
import {
  I18nOptions,
  I18nPluralObject,
  I18nTranslator,
  TranslateOptions,
} from "./default-options";
import { EcosystemTypes } from "../../";
import { BotLogger } from "../../bot-logger";
import { IfAnyOrNever, Path, PathValue } from "../../types";
import { I18nLoader, I18nTranslation } from "./base.loader";

const pluralKeys = ["zero", "one", "two", "few", "many", "other"];

export class TranslateService {
  private I18nService: I18nService;

  constructor() {
    this.I18nService = new I18nService({});
  }
}

// @Injectable()
export class I18nService<K = Record<string, unknown>>
  implements I18nTranslator<K>, EcosystemTypes.onModuleShutdown
{
  private unsubscribe = new Subject<void>();

  private supportedLanguages: string[];
  private translations: I18nTranslation;
  private pluralRules = new Map<string, Intl.PluralRules>();

  private translationsSubject: BehaviorSubject<I18nTranslation>;
  private languagesSubject: BehaviorSubject<string[]>;
  private loader: I18nLoader;
  private logger: BotLogger;

  constructor(
    private i18nOptions: I18nOptions,
    translations: Observable<I18nTranslation>,
    supportedLanguages: Observable<string[]>
  ) {
    supportedLanguages.pipe(takeUntil(this.unsubscribe)).subscribe((languages) => {
      this.supportedLanguages = languages;
    });
    translations.pipe(takeUntil(this.unsubscribe)).subscribe((t) => {
      this.translations = t;
    });
  }

  onModuleShutdown(): void {
    this.unsubscribe.next(null);
    this.unsubscribe.complete();
  }

  translate<P extends Path<K> = any, R = PathValue<K, P>>(
    key: P,
    options?: TranslateOptions
  ): IfAnyOrNever<R, string, R> {
    options = {
      // lang: I18nContext.current()?.lang || this.i18nOptions.fallbackLanguage,
      lang: this.i18nOptions.fallbackLanguage,
      ...options,
    };

    const { defaultValue } = options;
    let { lang } = options;

    if (lang === "debug") {
      return key as unknown as IfAnyOrNever<R, string, R>;
    }

    const previousFallbackLang = lang;
    lang = lang ?? this.i18nOptions.fallbackLanguage;
    lang = this.resolveLanguage(lang);

    const translationsByLanguage = this.translations[lang];

    const translation = this.translateObject(
      key as string,
      (translationsByLanguage ?? key) as string,
      lang,
      options,
      translationsByLanguage
    );

    if (translationsByLanguage == null || !translation) {
      const translationKeyMissing = `Translation "${
        key as string
      }" in "${lang}" does not exist.`;
      if (lang !== this.i18nOptions.fallbackLanguage || !!defaultValue) {
        if (this.i18nOptions.logging && this.i18nOptions.throwOnMissingKey) {
          this.logger.error(translationKeyMissing);
          throw new Error(translationKeyMissing);
        }

        const nextFallbackLanguage = this.getFallbackLanguage(lang);

        if (previousFallbackLang !== nextFallbackLanguage) {
          return this.translate(key, {
            ...options,
            lang: nextFallbackLanguage,
          });
        }
      }
    }

    return (translation ?? key) as unknown as IfAnyOrNever<R, string, R>;
  }

  private getFallbackLanguage(lang: string) {
    let regionSepIndex = -1;

    if (lang.includes("-")) {
      regionSepIndex = lang.lastIndexOf("-");
    }

    if (lang.includes("_")) {
      regionSepIndex = lang.lastIndexOf("_");
    }

    return regionSepIndex !== -1
      ? lang.slice(0, regionSepIndex)
      : this.i18nOptions.fallbackLanguage;
  }

  t<P extends Path<K> = any, R = PathValue<K, P>>(
    key: P,
    options?: TranslateOptions
  ): IfAnyOrNever<R, string, R> {
    return this.translate(key, options);
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  getTranslations() {
    return this.translations;
  }

  async refresh(
    translations?: I18nTranslation | Observable<I18nTranslation>,
    languages?: string[] | Observable<string[]>
  ) {
    if (!translations) {
      translations = await this.loader.load();
    }
    if (translations instanceof Observable) {
      this.translationsSubject.next(await lastValueFrom(translations.pipe(take(1))));
    } else {
      this.translationsSubject.next(translations);
    }

    if (!languages) {
      languages = await this.loader.languages();
    }

    if (languages instanceof Observable) {
      this.languagesSubject.next(await lastValueFrom(languages.pipe(take(1))));
    } else {
      this.languagesSubject.next(languages);
    }
  }

  private translateObject(
    key: string,
    translations: I18nTranslation | string,
    lang: string,
    options?: TranslateOptions,
    rootTranslations?: I18nTranslation | string
  ): I18nTranslation | string {
    const keys = key.split(".");
    const [firstKey] = keys;

    const args = options?.args;

    if (keys.length > 1 && !translations[key]) {
      const newKey = keys.slice(1, keys.length).join(".");

      if (translations && translations[firstKey]) {
        return this.translateObject(
          newKey,
          translations[firstKey],
          lang,
          options,
          rootTranslations
        );
      }
    }

    let translation = translations[key] ?? options?.defaultValue;

    if (translation && (args || (args instanceof Array && args.length > 0))) {
      const pluralObject = this.getPluralObject(translation);
      if (pluralObject && args && args["count"] !== undefined) {
        const count = Number(args["count"]);

        if (!this.pluralRules.has(lang)) {
          this.pluralRules.set(lang, new Intl.PluralRules(lang));
        }

        const pluralRules = this.pluralRules.get(lang);
        const pluralCategory = pluralRules.select(count);

        if (count === 0 && pluralObject["zero"]) {
          translation = pluralObject["zero"];
        } else if (pluralObject[pluralCategory]) {
          translation = pluralObject[pluralCategory];
        }
      } else if (translation instanceof Object) {
        const result = Object.keys(translation).reduce((obj, nestedKey) => {
          return {
            ...obj,
            [nestedKey]: this.translateObject(
              nestedKey,
              translation,
              lang,
              options,
              rootTranslations
            ),
          };
        }, {});

        if (translation instanceof Array) {
          return Object.values(result) as unknown as I18nTranslation;
        }

        return result;
      }
      translation = this.i18nOptions.formatter(
        translation,
        ...(args instanceof Array ? args || [] : [args])
      );
      const nestedTranslations = this.getNestedTranslations(translation);
      if (nestedTranslations && nestedTranslations.length > 0) {
        let offset = 0;
        for (const nestedTranslation of nestedTranslations) {
          const result = rootTranslations
            ? (this.translateObject(nestedTranslation.key, rootTranslations, lang, {
                ...options,
                args: { parent: options.args, ...nestedTranslation.args },
              }) as string) ?? ""
            : "";
          translation =
            translation.substring(0, nestedTranslation.index - offset) +
            result +
            translation.substring(
              nestedTranslation.index + nestedTranslation.length - offset
            );
          offset = offset + (nestedTranslation.length - result.length);
        }
      }
    }

    return translation;
  }

  resolveLanguage(lang: string) {
    if (this.i18nOptions.fallbacks && !this.supportedLanguages.includes(lang)) {
      const sanitizedLang = lang.includes("-")
        ? lang.substring(0, lang.indexOf("-")).concat("-*")
        : lang;

      for (const key in this.i18nOptions.fallbacks) {
        if (key === lang || key === sanitizedLang) {
          lang = this.i18nOptions.fallbacks[key];
          break;
        }
      }
    }
    return lang;
  }

  private getPluralObject(translation: any): I18nPluralObject | undefined {
    for (const k of pluralKeys) {
      if (translation[k]) {
        return translation as I18nPluralObject;
      }
    }
    return undefined;
  }

  private getNestedTranslations(
    translation: string
  ): { index: number; length: number; key: string; args: any }[] | undefined {
    const list = [];
    const regex = /\$t\((.*?)(,(.*?))?\)/g;
    let result: RegExpExecArray;
    while ((result = regex.exec(translation))) {
      let key = undefined;
      let args = {};
      let index = undefined;
      let length = undefined;
      if (result && result.length > 0) {
        key = result[1].trim();
        index = result.index;
        length = result[0].length;
        if (result.length >= 3 && result[3]) {
          try {
            args = JSON.parse(result[3]);
          } catch (e) {
            this.logger.error(`Error while parsing JSON`, e);
          }
        }
      }
      if (key) {
        list.push({ index, length, key, args });
      }
      result = undefined;
    }

    return list.length > 0 ? list : undefined;
  }

  //   public async validate(
  //     value: any,
  //     options?: TranslateOptions
  //   ): Promise<I18nValidationError[]> {
  //     const errors = await validate(value, this.i18nOptions.validatorOptions);
  //     return formatI18nErrors(errors, this, options);
  //   }
}
