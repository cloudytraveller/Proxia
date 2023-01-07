/* eslint-disable unicorn/prefer-top-level-await */
/* eslint-disable unicorn/no-await-expression-member */
/* eslint-disable node/no-extraneous-import */
import type {
  TSInterfaceDeclaration,
  TSPropertySignature,
  TSTypeAnnotation,
  TSLiteralType,
  Literal,
  Identifier,
} from "@typescript-eslint/types/dist/generated/ast-spec.js";
import { logger } from "./logger.js";
import parser from "@typescript-eslint/parser";
import { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type TableColumn = {
  name: string;
  type: "integer" | "text" | "boolean" | "binary";
};

type Table = {
  name: string;
  columns: TableColumn[];
};

function formatObject(obj: any) {
  let str = "export const Schema = [\n";
  for (const element of obj) {
    str += `  {\n    name: "${element.name}",\n    columns: [\n`;
    for (let j = 0; j < element.columns.length; j++) {
      str += `      { name: "${element.columns[j].name}", type: "${element.columns[j].type}" },\n`;
    }
    str += "    ],\n  },\n";
  }
  str += "];\n";
  return str;
}

async function main() {
  const parsedCode = parser.parse(
    (
      await fsp.readFile(
        path.join(path.dirname(fileURLToPath(import.meta.url)), "../typings/database.d.ts"),
      )
    ).toString("utf8"),
    {
      ecmaVersion: "latest",
    },
  );

  const declarations = parsedCode.body;

  const interfaces = declarations.filter(
    (dec) => dec.type === AST_NODE_TYPES.TSInterfaceDeclaration && dec.extends,
  );

  // Be prepared for lots of type casting.
  const tables: Table[] = (interfaces as TSInterfaceDeclaration[])
    .filter(
      (dec) =>
        dec.extends &&
        (dec.extends[0].expression as Identifier).name === "Table" &&
        (dec.body.body as TSPropertySignature[]).find(
          (prop) => (prop?.key as Identifier).name === "_tableName",
        ),
    )
    .map((_interface) => {
      const tableName: string = (
        (
          (
            (_interface.body.body as TSPropertySignature[]).find(
              (prop) => (prop?.key as Identifier)?.name === "_tableName",
            )?.typeAnnotation as unknown as TSTypeAnnotation
          )?.typeAnnotation as TSLiteralType
        )?.literal as Literal
      )?.value as string;

      const columns = _interface.body.body
        .filter((body) => !((body as TSPropertySignature).key as Identifier).name.startsWith("_"))
        .map((body) => {
          const columnResult = {} as TableColumn;
          columnResult.name = ((body as TSPropertySignature).key as Identifier).name;

          const typeAnnotation = ((body as TSPropertySignature).typeAnnotation as TSTypeAnnotation)
            .typeAnnotation;
          const interpretedType = typeAnnotation.type;

          const textTypes = [
            AST_NODE_TYPES.TSTypeLiteral,
            AST_NODE_TYPES.TSStringKeyword,
            AST_NODE_TYPES.TSArrayType,
          ];
          if (textTypes.includes(interpretedType)) columnResult.type = "text";
          else if (interpretedType === AST_NODE_TYPES.TSNumberKeyword)
            columnResult.type = "integer";
          else if (interpretedType === AST_NODE_TYPES.TSBooleanKeyword)
            columnResult.type = "boolean";
          else if (
            interpretedType === AST_NODE_TYPES.TSTypeReference &&
            (typeAnnotation.typeName as Identifier).name === "Buffer"
          )
            columnResult.type = "binary";
          else columnResult.type = "text";
          return columnResult;
        });
      return {
        name: tableName,
        columns,
      };
    });
  const filepath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../ParsedDatabaseSchema.ts",
  );
  await fsp.writeFile(filepath, formatObject(tables));

  logger.debug(`Wrote ${tables.length} tables to ${filepath}`);
}

main().catch((error) => {
  logger.error(error);
});
