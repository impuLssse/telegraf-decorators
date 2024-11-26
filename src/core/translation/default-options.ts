import { Type } from "../../types";
import * as format from "string-format";
import { I18nLoader } from "./base.loader";
import { I18nJsonLoader } from "./json.loader";

import { IfAnyOrNever, Path, PathValue } from "../../types";
// import { I18nValidationError } from "./i18n-validation-error.interface";

export type TranslateOptions = {
  lang?: string;
  args?: ({ [k: string]: any } | string)[] | { [k: string]: any };
  defaultValue?: string;
  debug?: boolean;
};

export interface I18nTranslator<K = Record<string, unknown>> {
  translate<P extends Path<K> = any, R = PathValue<K, P>>(
    key: P,
    options?: TranslateOptions
  ): IfAnyOrNever<R, string, R>;

  t<P extends Path<K> = any, R = PathValue<K, P>>(
    key: P,
    options?: TranslateOptions
  ): IfAnyOrNever<R, string, R>;

  // validate(value: any, options?: TranslateOptions): Promise<I18nValidationError[]>;
}

export interface I18nPluralObject {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other?: string;
}

export interface EcosystemContext {}

export interface I18nResolver {
  resolve(
    context: EcosystemContext
  ): Promise<string | string[] | undefined> | string | string[] | undefined;
}

export type Formatter = (
  template: string,
  ...args: (string | Record<string, string>)[]
) => string;

export type I18nOptionResolver = Type<I18nResolver> | I18nResolver;

/** Взято из `nestjs-i18n` */
export interface I18nOptions {
  fallbackLanguage: string;
  fallbacks?: { [key: string]: string };
  resolvers?: I18nOptionResolver[];
  loader?: Type<I18nLoader>;
  loaderOptions: any;
  formatter?: Formatter;
  logging?: boolean;
  disableMiddleware?: boolean;
  skipAsyncHook?: boolean;
  // validatorOptions?: I18nValidatorOptions;
  throwOnMissingKey?: boolean;
  typesOutputPath?: string;
}

export const defaultI18nOptions: Partial<I18nOptions> = {
  resolvers: [],
  formatter: format,
  logging: true,
  throwOnMissingKey: false,
  loader: I18nJsonLoader,
};
