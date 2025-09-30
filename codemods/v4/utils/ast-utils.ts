import type { SgRoot, SgNode, Edit } from "codemod:ast-grep";

/**
 * Core AST utilities for codemods
 */

/**
 * Quick check if file contains specific content before processing
 */
export function hasContent<T extends Record<string, any>>(
  root: SgRoot<T>,
  searchText: string
): boolean {
  return root.root().text().includes(searchText);
}

/**
 * Check if file contains any of the specified content
 */
export function hasAnyContent<T extends Record<string, any>>(
  root: SgRoot<T>,
  searchTexts: readonly string[]
): boolean {
  const text = root.root().text();
  return searchTexts.some((searchText) => text.includes(searchText));
}

/**
 * Apply edits and return result, or null if no changes
 */
export function applyEdits<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  edits: Edit[]
): string | null {
  if (edits.length === 0) {
    return null;
  }
  return rootNode.commitEdits(edits);
}

/**
 * Find function calls with multiple quote styles
 */
export function findFunctionCalls<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  functionName: string,
  ...args: string[]
): SgNode<T>[] {
  const results: SgNode<T>[] = [];
  const argPattern = args.length > 0 ? args.join(", ") : "$$$ARGS";

  // Try both single and double quotes for string literals
  const patterns = [
    `${functionName}(${argPattern})`,
    `await ${functionName}(${argPattern})`,
  ];

  for (const pattern of patterns) {
    const calls = rootNode.findAll({
      rule: { pattern },
    });
    results.push(...calls);
  }

  return results;
}

/**
 * Find function calls with specific first argument (handles quote variations)
 */
export function findFunctionCallsWithFirstArg<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  functionName: string,
  firstArg: string
): SgNode<T>[] {
  const results: SgNode<T>[] = [];

  // Handle both quote styles
  const patterns = [
    `${functionName}('${firstArg}', $$$REST)`,
    `${functionName}("${firstArg}", $$$REST)`,
  ];

  for (const pattern of patterns) {
    const calls = rootNode.findAll({
      rule: { pattern },
    });
    results.push(...calls);
  }

  return results;
}

/**
 * Replace text in node using regex - returns edit or null
 */
export function replaceInNode<T extends Record<string, any>>(
  node: SgNode<T>,
  searchRegex: RegExp,
  replacement: string
): Edit | null {
  const text = node.text();
  if (searchRegex.test(text)) {
    const newText = text.replace(searchRegex, replacement);
    return node.replace(newText);
  }
  return null;
}

/**
 * Find nodes matching multiple patterns
 */
export function findWithPatterns<T extends Record<string, any>>(
  rootNode: SgNode<T>,
  patterns: string[]
): SgNode<T>[] {
  const results: SgNode<T>[] = [];

  for (const pattern of patterns) {
    const matches = rootNode.findAll({
      rule: { pattern },
    });
    results.push(...matches);
  }

  return results;
}
