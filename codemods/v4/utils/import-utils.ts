import type { SgNode, Edit } from "codemod:ast-grep";

/**
 * Import management utilities for codemods
 */

export interface ImportInfo<T extends Record<string, any>> {
  hasImport: boolean;
  existingImport: SgNode<T> | null;
  specifiers: string[];
}

/**
 * Analyze existing imports for a specific source
 */
export function analyzeImports<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  source: string
): ImportInfo<T> {
  // Find imports with both quote styles
  const singleQuoteImports = rootNode.findAll({
    rule: {
      pattern: `import { $$$SPECIFIERS } from '${source}'`,
    },
  });

  const doubleQuoteImports = rootNode.findAll({
    rule: {
      pattern: `import { $$$SPECIFIERS } from "${source}"`,
    },
  });

  const allImports = [...singleQuoteImports, ...doubleQuoteImports];

  if (allImports.length === 0) {
    return {
      hasImport: false,
      existingImport: null,
      specifiers: [],
    };
  }

  const existingImport = allImports[0];
  if (!existingImport) {
    return {
      hasImport: false,
      existingImport: null,
      specifiers: [],
    };
  }
  const importText = existingImport.text();

  // Extract specifiers from the import
  const specifiersMatch = importText.match(
    /import\s*{\s*([^}]+)\s*}\s*from\s*["'][^"']+["']/
  );

  const specifiers =
    specifiersMatch && specifiersMatch[1]
      ? specifiersMatch[1]
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      : [];

  return {
    hasImport: true,
    existingImport,
    specifiers,
  };
}

/**
 * Check if specific specifiers are already imported from a source
 */
export function hasImportSpecifiers<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  source: string,
  requiredSpecifiers: string[]
): { [key: string]: boolean } {
  const importInfo = analyzeImports(rootNode, source);
  const result: { [key: string]: boolean } = {};

  for (const specifier of requiredSpecifiers) {
    result[specifier] = importInfo.specifiers.includes(specifier);
  }

  return result;
}

/**
 * Create edit to add or update imports
 */
export function createImportEdit<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  source: string,
  requiredSpecifiers: string[]
): Edit | null {
  const importInfo = analyzeImports(rootNode, source);
  const missingSpecifiers = requiredSpecifiers.filter(
    (spec) => !importInfo.specifiers.includes(spec)
  );

  if (missingSpecifiers.length === 0) {
    return null; // No changes needed
  }

  if (importInfo.existingImport) {
    // Update existing import
    const allSpecifiers = [...importInfo.specifiers, ...missingSpecifiers];
    const newImport = `import { ${allSpecifiers.join(
      ", "
    )} } from "${source}";`;
    return importInfo.existingImport.replace(newImport);
  } else {
    // Add new import at the top
    const newImport = `import { ${requiredSpecifiers.join(
      ", "
    )} } from "${source}";\n`;
    return {
      startPos: 0,
      endPos: 0,
      insertedText: newImport,
    };
  }
}

/**
 * Manage imports for multiple sources
 */
export function manageImports<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  imports: Array<{ source: string; specifiers: string[] }>
): Edit[] {
  const edits: Edit[] = [];

  for (const { source, specifiers } of imports) {
    const edit = createImportEdit(rootNode, source, specifiers);
    if (edit) {
      edits.push(edit);
    }
  }

  return edits;
}

/**
 * Smart import insertion - finds the best place to insert imports
 */
export function findImportInsertionPoint(fileContent: string): number {
  const lines = fileContent.split("\n");
  let insertIndex = 0;

  // Find the last import line or first non-comment line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (line?.startsWith("import ")) {
      insertIndex = i + 1;
    } else if (line && !line.startsWith("//") && !line.startsWith("/*")) {
      // Stop at first non-comment, non-empty line
      break;
    }
  }

  return insertIndex;
}
