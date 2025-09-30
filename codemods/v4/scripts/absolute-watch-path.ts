// jssg-codemod
import type { SgRoot, Edit } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";
import {
  hasContent,
  applyEdits,
  findFunctionCallsWithFirstArg,
  createImportEdit,
} from "../utils/index.js";

async function transform(root: SgRoot<TS>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check using utility
  if (!hasContent(root, "nuxt.hook")) {
    return null;
  }

  // Find nuxt.hook('builder:watch', ...) calls with arrow functions
  const hookCalls = findFunctionCallsWithFirstArg(
    rootNode,
    "nuxt.hook",
    "builder:watch"
  );

  if (hookCalls.length === 0) {
    return null;
  }

  const edits: Edit[] = [];
  let needsImportUpdate = false;

  // We'll check imports when needed

  // Process each hook call
  for (const hookCall of hookCalls) {
    const callback = hookCall.getMatch("CALLBACK");
    if (!callback || !callback.is("arrow_function")) {
      continue;
    }

    // Get parameters - we need exactly 2 parameters
    const parameters = callback.field("parameters");
    if (!parameters) continue;

    // Filter out non-parameter children (parentheses, commas)
    const paramList = parameters
      .children()
      .filter((child) => child.is("required_parameter"));
    if (paramList.length !== 2) {
      continue;
    }

    const secondParam = paramList[1];
    if (!secondParam) continue;

    // Get the parameter name (must be an identifier, not destructuring)
    const paramPattern = secondParam.field("pattern");
    if (!paramPattern || !paramPattern.is("identifier")) {
      continue;
    }

    const paramName = paramPattern.text();

    // Create the path normalization statement
    const pathNormalization = `${paramName} = relative(nuxt.options.srcDir, resolve(nuxt.options.srcDir, ${paramName}));`;

    // Get the function body
    const body = callback.field("body");
    if (!body) continue;

    if (body.is("statement_block")) {
      // Function has a block body - insert at the beginning
      // statement_block doesn't have open_token field, we need to find the first child
      const children = body.children();
      let insertPos = body.range().start.index + 1; // After the opening brace

      // Find the first actual statement to insert before it
      for (const child of children) {
        if (
          child.is("expression_statement") ||
          child.is("return_statement") ||
          child.is("variable_declaration") ||
          child.kind().endsWith("_statement")
        ) {
          insertPos = child.range().start.index;
          break;
        }
      }

      edits.push({
        startPos: insertPos,
        endPos: insertPos,
        insertedText: `\n  ${pathNormalization}\n`,
      });
      needsImportUpdate = true;
    } else {
      // Function has expression body - convert to block statement
      const bodyText = body.text();
      const newBody = `{\n  ${pathNormalization}\n  return ${bodyText};\n}`;

      edits.push(body.replace(newBody));
      needsImportUpdate = true;
    }
  }

  // Add imports if needed
  if (needsImportUpdate) {
    const importEdit = createImportEdit(rootNode, "node:path", [
      "relative",
      "resolve",
    ]);
    if (importEdit) {
      edits.unshift(importEdit); // Add import at the beginning
    }
  }

  // Use utility for applying edits
  return applyEdits(rootNode, edits);
}

export default transform;
