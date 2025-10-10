import type { SgRoot, Edit } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";
import { hasContent } from "../utils/index.ts";
import { ensureImport } from "../utils/import-utils.ts";

async function transform(root: SgRoot<TS>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check - does file contain addTemplate calls?
  if (!hasContent(root, "addTemplate")) {
    return null;
  }

  const edits: Edit[] = [];
  let needsReadFileSync = false;
  let needsTemplate = false;

  // Find all addTemplate call expressions
  const callExpressions = rootNode.findAll({
    rule: { kind: "call_expression" },
  });

  for (const call of callExpressions) {
    const func = call.field("function");
    if (!func || func.text() !== "addTemplate") continue;

    // Get the arguments
    const args = call.field("arguments");
    if (!args) continue;

    // Find the object argument
    const obj = args.find({
      rule: { kind: "object" },
    });

    if (!obj) continue;

    // Find all pairs in the object
    const pairs = obj.findAll({
      rule: { kind: "pair" },
    });

    for (const pair of pairs) {
      const key = pair.field("key");
      const value = pair.field("value");

      if (!key || !value || key.text() !== "src") continue;

      // Check if the value contains .ejs
      if (!value.text().includes(".ejs")) continue;

      // Extract the path from resolver.resolve call
      const resolverCall = value.find({
        rule: { pattern: "resolver.resolve($PATH)" },
      });

      if (!resolverCall) continue;

      const pathArg = resolverCall.getMatch("PATH");
      if (!pathArg) continue;

      const pathText = pathArg.text();

      // Mark that we need imports
      needsReadFileSync = true;
      needsTemplate = true;

      // Replace the entire src property with getContents method
      const getContentsMethod = `getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve(${pathText}),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  }`;

      edits.push(pair.replace(getContentsMethod));
    }
  }

  // Add imports if needed
  if (needsReadFileSync) {
    const importResult = ensureImport(rootNode as any, "node:fs", [
      { type: "named", name: "readFileSync", typed: false },
    ]);

    if (
      importResult.edit.insertedText &&
      importResult.edit.insertedText.trim()
    ) {
      edits.unshift(importResult.edit);
    }
  }

  if (needsTemplate) {
    const importResult = ensureImport(rootNode as any, "lodash-es", [
      { type: "named", name: "template", typed: false },
    ]);

    if (
      importResult.edit.insertedText &&
      importResult.edit.insertedText.trim()
    ) {
      edits.unshift(importResult.edit);
    }
  }

  if (edits.length === 0) {
    return null;
  }

  return rootNode.commitEdits(edits);
}

export default transform;
