import path from "path";
import * as ts from "typescript";
import type { Dirent } from "fs";
import { readdir, lstat, stat } from "fs/promises";

export const exists = async (path: string): Promise<boolean> => {
  return !!(await stat(path));
};

export const isDirectory = async (source: string) => (await lstat(source)).isDirectory();

export function mapAsync<T, U>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<U>
): Promise<U[]> {
  return Promise.all(array.map(callbackfn));
}

export async function filterAsync<T>(
  array: T[],
  callbackfn: (value: T, index: number, array: T[]) => Promise<boolean>
): Promise<T[]> {
  const filterMap = await mapAsync(array, callbackfn);
  return array.filter((_, index) => filterMap[index]);
}

export const getDirectories = async (source: string) => {
  const dirs = await readdir(source);
  return filterAsync(
    dirs.map((name) => path.join(source, name)),
    isDirectory
  );
};

export const getFiles = async (
  dirPath: string,
  pattern: RegExp,
  includeSubfolders: boolean
): Promise<string[]> => {
  const dirs: (Dirent | string)[] = await readdir(dirPath, {
    withFileTypes: true,
  });

  const files: (Dirent | string)[] = [];
  const deepFiles: string[] = [];

  for (const f of dirs) {
    try {
      if (typeof f === "string") {
        if ((await exists(path.join(dirPath, f))) && pattern.test(f)) {
          files.push(f);
        }
      } else if (f.isFile() && pattern.test(f.name)) {
        files.push(f);
      } else if (includeSubfolders && f.isDirectory()) {
        deepFiles.push(
          ...(await getFiles(path.join(dirPath, f.name), pattern, includeSubfolders))
        );
      }
    } catch {
      continue;
    }
  }

  return files
    .map((f) => path.join(dirPath, typeof f === "string" ? f : f.name))
    .concat(deepFiles);
};

/**
 * Генерация типов ~~спизжена~~ позаимствована отсюда:
 * @see — https://github.com/toonvanstrijp/nestjs-i18n/blob/main/src/utils/typescript.ts
 */
export const convertObjectToTypeDefinition = async (
  object: any
): Promise<ts.TypeElement[]> => {
  switch (typeof object) {
    case "object":
      return Promise.all(
        Object.keys(object).map(async (key) => {
          if (typeof object[key] === "string") {
            return ts.factory.createPropertySignature(
              undefined,
              ts.factory.createStringLiteral(key),
              undefined,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
            );
          }
          if (Array.isArray(object[key])) {
            return ts.factory.createPropertySignature(
              undefined,
              ts.factory.createStringLiteral(key),
              undefined,
              ts.factory.createTupleTypeNode(
                Array(object[key].length).fill(
                  ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
                )
              )
            );
          }
          return ts.factory.createPropertySignature(
            undefined,
            ts.factory.createStringLiteral(key),
            undefined,
            ts.factory.createTypeLiteralNode(
              await convertObjectToTypeDefinition(object[key])
            )
          );
        })
      );
  }

  return [];
};

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

export const createTypesFile = async (object: any) => {
  const sourceFile = ts.createSourceFile(
    "placeholder.ts",
    "",
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const i18nTranslationsType = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier("I18nTranslations"),
    undefined,
    ts.factory.createTypeLiteralNode(await convertObjectToTypeDefinition(object))
  );

  const nodes = ts.factory.createNodeArray([
    ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamedImports([
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier("Path")
          ),
        ])
      ),
      ts.factory.createStringLiteral("nestjs-i18n"),
      undefined
    ),
    i18nTranslationsType,
    ts.factory.createTypeAliasDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createIdentifier("I18nPath"),
      undefined,
      ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Path"), [
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier("I18nTranslations"),
          undefined
        ),
      ])
    ),
  ]);

  nodes.forEach((node) => {
    ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      " prettier-ignore ",
      true
    );
  });

  return printer.printList(ts.ListFormat.MultiLine, nodes, sourceFile);
};

export const annotateSourceCode = (code: string) => {
  return `/* DO NOT EDIT, file generated by nestjs-i18n */

/* eslint-disable */
${code}`;
};
