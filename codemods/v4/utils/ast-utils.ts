import type { SgRoot, SgNode, Edit, TypesMap } from "codemod:ast-grep";

/**
 * Core AST utilities for codemods
 */

/**
 * Common Nuxt data fetching hooks
 */
export const DATA_FETCH_HOOKS = [
  "useAsyncData",
  "useFetch",
  "useLazyAsyncData",
  "useLazyFetch",
] as const;

/**
 * Quick check if file contains specific content before processing
 */
export function hasContent<T extends TypesMap>(
  root: SgRoot<T>,
  searchText: string
): boolean {
  return root.root().text().includes(searchText);
}

/**
 * Check if file contains any of the specified content
 */
export function hasAnyContent<T extends TypesMap>(
  root: SgRoot<T>,
  searchTexts: readonly string[]
): boolean {
  const text = root.root().text();
  return searchTexts.some((searchText) => text.includes(searchText));
}

/**
 * Apply edits and return result, or null if no changes
 */
export function applyEdits<T extends TypesMap>(
  rootNode: SgNode<T>,
  edits: Edit[]
): string | null {
  if (edits.length === 0) {
    return null;
  }
  return rootNode.commitEdits(edits);
}

/**
 * Find function calls with specific first argument (handles quote variations)
 */
export function findFunctionCallsWithFirstArg<T extends TypesMap>(
  rootNode: SgNode<T>,
  functionName: string,
  firstArg: string
): SgNode<T>[] {
  const results: SgNode<T>[] = [];

  // Handle both quote styles
  const patterns = [
    `${functionName}('${firstArg}', $CALLBACK)`,
    `${functionName}("${firstArg}", $CALLBACK)`,
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
export function replaceInNode<T extends TypesMap>(
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
