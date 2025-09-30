// jssg-codemod
import type { SgRoot, Edit } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";
import { hasContent, applyEdits } from "../utils/index";

async function transform(root: SgRoot<TS>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check using utility
  if (!hasContent(root, "nuxt.hook")) {
    return null;
  }

  // Find nuxt.hook('builder:watch', ...) calls with arrow functions
  const hookCallsSingle = rootNode.findAll({
    rule: {
      pattern: "nuxt.hook('builder:watch', $CALLBACK)",
    },
  });

  const hookCallsDouble = rootNode.findAll({
    rule: {
      pattern: 'nuxt.hook("builder:watch", $CALLBACK)',
    },
  });

  const hookCalls = [...hookCallsSingle, ...hookCallsDouble];

  if (hookCalls.length === 0) {
    return null;
  }

  const edits: Edit[] = [];
  let needsImportUpdate = false;

  // Check existing imports
  const importInfo = analyzeExistingImports(rootNode);

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
      .filter((child: any) => child.is("required_parameter"));
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
    const importEdit = createImportEdit(rootNode, importInfo);
    if (importEdit) {
      edits.unshift(importEdit); // Add import at the beginning
    }
  }

  // Use utility for applying edits
  return applyEdits(rootNode, edits);
}

interface ImportInfo {
  hasRelative: boolean;
  hasResolve: boolean;
  existingImport: any | null;
}

function analyzeExistingImports(rootNode: any): ImportInfo {
  // Find existing node:fs imports (not node:path!)
  const nodefsImports = rootNode.findAll({
    rule: {
      pattern: "import { $$$SPECIFIERS } from 'node:fs'",
    },
  });

  // Also check for double quotes
  const nodefsImportsDouble = rootNode.findAll({
    rule: {
      pattern: 'import { $$$SPECIFIERS } from "node:fs"',
    },
  });

  const allImports = [...nodefsImports, ...nodefsImportsDouble];

  let hasRelative = false;
  let hasResolve = false;
  let existingImport = null;

  if (allImports.length > 0) {
    existingImport = allImports[0];
    const importText = existingImport.text();
    hasRelative = importText.includes("relative");
    hasResolve = importText.includes("resolve");
  }

  return { hasRelative, hasResolve, existingImport };
}

function createImportEdit(rootNode: any, importInfo: ImportInfo): Edit | null {
  const { hasRelative, hasResolve, existingImport } = importInfo;

  if (hasRelative && hasResolve) {
    return null; // No import changes needed
  }

  if (existingImport) {
    // Update existing import
    const currentText = existingImport.text();

    // Extract the current specifiers
    const specifiersMatch = currentText.match(
      /import\s*{\s*([^}]+)\s*}\s*from\s*["']node:fs["']/
    );
    if (!specifiersMatch) return null;

    const currentSpecifiers = specifiersMatch[1].trim();
    const specifiersList = currentSpecifiers
      .split(",")
      .map((s: string) => s.trim());

    if (!hasRelative) {
      specifiersList.push("relative");
    }
    if (!hasResolve) {
      specifiersList.push("resolve");
    }

    const newSpecifiers = specifiersList.join(", ");
    const newImport = `import { ${newSpecifiers} } from "node:fs";`;

    return existingImport.replace(newImport);
  } else {
    // Add new import at the top
    const newImport = 'import { relative, resolve } from "node:fs";\n\n';

    return {
      startPos: 0,
      endPos: 0,
      insertedText: newImport,
    };
  }
}

export default transform;
