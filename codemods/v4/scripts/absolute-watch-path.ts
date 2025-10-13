import type { SgRoot, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import { hasContent } from "../utils/index.ts";
import { ensureImport } from "../utils/imports.ts";

async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check - does file contain nuxt.hook calls?
  if (!hasContent(root, "nuxt.hook")) {
    return null;
  }

  const edits: Edit[] = [];
  let needsImport = false;

  // Find nuxt.hook calls with "builder:watch" as first argument
  const hookCalls = rootNode.findAll({
    rule: {
      pattern: 'nuxt.hook("builder:watch", $CALLBACK)',
    },
  });

  for (const hookCall of hookCalls) {
    const callback = hookCall.getMatch("CALLBACK");

    if (!callback || !callback.is("arrow_function")) continue;

    // Get the parameters
    const params = callback.field("parameters");
    if (!params) continue;

    // Find the parameter identifiers
    const paramIdentifiers = params.findAll({
      rule: { kind: "identifier" },
    });

    if (paramIdentifiers.length !== 2) continue;

    const pathParam = paramIdentifiers[1]; // Second parameter
    if (!pathParam) continue;
    const pathParamName = pathParam.text();

    // Get the function body
    const body = callback.field("body");
    if (!body) continue;

    // Check if the function is async
    const isAsync = callback.text().includes("async");

    if (body.is("statement_block")) {
      // Function has a block body - insert path normalization at the beginning
      const asyncKeyword = isAsync ? "async " : "";
      const bodyText = body.text();

      // Create replacement with path normalization added at the beginning of the block
      const bodyContent = bodyText.slice(1, -1).trim(); // Remove braces
      const replacement = `nuxt.hook("builder:watch", ${asyncKeyword}(event, ${pathParamName}) => {
  ${pathParamName} = relative(
    nuxt.options.srcDir,
    resolve(nuxt.options.srcDir, ${pathParamName})
  );
  ${bodyContent}
})`;

      edits.push(hookCall.replace(replacement));
      needsImport = true;
    } else {
      // For expression bodies, replace with block statement
      const bodyText = body.text();
      const asyncKeyword = isAsync ? "async " : "";
      const replacement = `nuxt.hook("builder:watch", ${asyncKeyword}(event, ${pathParamName}) => {
  ${pathParamName} = relative(
    nuxt.options.srcDir,
    resolve(nuxt.options.srcDir, ${pathParamName})
  );
  return ${bodyText};
})`;

      edits.push(hookCall.replace(replacement));
      needsImport = true;
    }
  }

  // Add imports if needed - MUST be first in edits array
  if (needsImport) {
    const importResult = ensureImport(rootNode as any, "node:path", [
      { type: "named", name: "relative", typed: false },
      { type: "named", name: "resolve", typed: false },
    ]);

    if (
      importResult.edit.insertedText &&
      importResult.edit.insertedText.trim()
    ) {
      edits.unshift(importResult.edit); // Add import at the beginning
    }
  }

  if (edits.length === 0) {
    return null;
  }

  return rootNode.commitEdits(edits);
}

export default transform;
