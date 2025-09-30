import type { SgNode } from "codemod:ast-grep";

/**
 * Specialized utilities for managing imports in codemods
 */

export interface ImportInfo {
  hasImport: boolean;
  existingImport: string | null;
  needsImport: boolean;
}

/**
 * Check if a specific import exists in the file
 */
export function checkImport(
  rootNode: SgNode<any>,
  importName: string,
  source: string
): ImportInfo {
  const text = rootNode.text();
  const importRegex = new RegExp(
    `import\\s*\\{[^}]*${importName}[^}]*\\}\\s*from\\s*["']${source}["'];?`
  );

  const hasImport = importRegex.test(text);
  const match = text.match(importRegex);

  return {
    hasImport,
    existingImport: match ? match[0] : null,
    needsImport: !hasImport,
  };
}

/**
 * Check multiple imports at once
 */
export function checkMultipleImports(
  rootNode: SgNode<any>,
  imports: Array<{ name: string; source: string }>
): Record<string, ImportInfo> {
  const result: Record<string, ImportInfo> = {};

  for (const { name, source } of imports) {
    result[name] = checkImport(rootNode, name, source);
  }

  return result;
}

/**
 * Add import to the top of the file
 */
export function addImport(
  fileContent: string,
  importStatement: string
): string {
  const lines = fileContent.split("\n");

  // Find the best place to insert the import
  let insertIndex = 0;

  // Skip any existing imports to add at the end of import block
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("import ") || line.startsWith("//") || line === "") {
      insertIndex = i + 1;
    } else {
      break;
    }
  }

  lines.splice(insertIndex, 0, importStatement);
  return lines.join("\n");
}

/**
 * Update existing import to include new specifier
 */
export function updateImport(
  fileContent: string,
  existingImport: string,
  importName: string
): string {
  // Extract existing specifiers
  const specifiersMatch = existingImport.match(/\{([^}]+)\}/);
  if (!specifiersMatch) return fileContent;

  const existingSpecifiers = specifiersMatch[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);

  // Add new specifier if not already present
  if (!existingSpecifiers.includes(importName)) {
    existingSpecifiers.push(importName);
    const newSpecifiers = existingSpecifiers.join(", ");
    const newImport = existingImport.replace(
      /\{[^}]+\}/,
      `{ ${newSpecifiers} }`
    );
    return fileContent.replace(existingImport, newImport);
  }

  return fileContent;
}

/**
 * Add multiple imports from the same source
 */
export function addMultipleImports(
  fileContent: string,
  imports: string[],
  source: string
): string {
  const importStatement = `import { ${imports.join(", ")} } from "${source}";`;
  return addImport(fileContent, importStatement);
}

/**
 * Manage imports automatically - add missing, update existing
 */
export function manageImports(
  rootNode: SgNode<any>,
  fileContent: string,
  requiredImports: Array<{ name: string; source: string }>
): string {
  let result = fileContent;

  // Group imports by source
  const importsBySource: Record<string, string[]> = {};
  const existingImports: Record<string, string> = {};

  for (const { name, source } of requiredImports) {
    const importInfo = checkImport(rootNode, name, source);

    if (importInfo.needsImport) {
      if (!importsBySource[source]) {
        importsBySource[source] = [];
      }
      importsBySource[source].push(name);
    } else if (importInfo.existingImport) {
      existingImports[source] = importInfo.existingImport;
    }
  }

  // Add new imports
  for (const [source, imports] of Object.entries(importsBySource)) {
    if (existingImports[source]) {
      // Update existing import
      for (const importName of imports) {
        result = updateImport(result, existingImports[source], importName);
      }
    } else {
      // Add new import
      result = addMultipleImports(result, imports, source);
    }
  }

  return result;
}
