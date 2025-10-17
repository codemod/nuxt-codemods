import type { SgRoot, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import type HTML from "codemod:ast-grep/langs/html";
import { hasContent } from "../utils/index.ts";
import { ensureImport } from "../utils/imports.ts";

// Helper function that contains the core transformation logic
// This works on any TypeScript AST (from .ts files or extracted from .vue files)
//TODO: "any" type casting should be fixed/replaced.
function transformTypeScriptAST(tsRootNode: any, tsRoot: SgRoot<TSX>): Edit[] {
  const edits: Edit[] = [];
  let needsImport = false;

  // Find nuxt.hook calls with "builder:watch" as first argument
  const hookCalls = tsRootNode.findAll({
    rule: {
      pattern: 'nuxt.hook("builder:watch", $CALLBACK)',
    },
  });

  for (const hookCall of hookCalls) {
    const callback = hookCall.getMatch("CALLBACK");

    if (!callback) continue;

    // Check if it's an arrow function - if not, skip for now
    if (!callback.is("arrow_function")) continue;

    // Skip if the hook already has path normalization (avoid re-transforming)
    const hookText = hookCall.text();
    if (hookText.includes("relative(") && hookText.includes("resolve(")) {
      //TODO string op should be replaced
      continue;
    }

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
      const bodyContent = bodyText.slice(1, -1).trim();
      const replacement = `nuxt.hook("builder:watch", ${asyncKeyword}(event, ${pathParamName}) => {
  ${pathParamName} = relative(nuxt.options.srcDir, resolve(nuxt.options.srcDir, ${pathParamName}));
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

  // Handle imports - add import BEFORE other edits
  //TODO: the import utils should be updated to be able to handle this.
  if (needsImport && edits.length > 0) {
    // Check if import already exists in the original code using AST patterns
    const hasNodePathImport =
      tsRoot.root().findAll({
        rule: {
          pattern: 'import { $IMPORTS } from "node:path"',
        },
      }).length > 0 ||
      tsRoot.root().findAll({
        rule: {
          pattern: "import { $IMPORTS } from 'node:path'",
        },
      }).length > 0;

    if (!hasNodePathImport) {
      // Add import using ensureImport on the ORIGINAL ast
      const importResult = ensureImport(tsRoot.root() as any, "node:path", [
        { type: "named", name: "relative", typed: false },
        { type: "named", name: "resolve", typed: false },
      ]);

      if (
        importResult.edit.insertedText &&
        importResult.edit.insertedText.trim()
      ) {
        // Prepend the import edit to the list of edits
        edits.unshift(importResult.edit);
      }
    }
  }

  return edits;
}

async function transform(root: SgRoot<TSX | HTML>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check - does file contain nuxt.hook calls?
  if (!hasContent(root, "nuxt.hook")) {
    return null;
  }
  const edits = transformTypeScriptAST(rootNode as any, root as SgRoot<TSX>);

  if (edits.length === 0) {
    return null;
  }

  return rootNode.commitEdits(edits);
}

export default transform;
