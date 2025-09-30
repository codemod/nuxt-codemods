import type { SgRoot, SgNode, Edit } from "codemod:ast-grep";

/**
 * Core utility functions for Nuxt v4 codemods
 */

/**
 * Quick check if file contains specific text before processing
 */
export function hasContent(root: SgRoot<any>, searchText: string): boolean {
  return root.root().text().includes(searchText);
}

/**
 * Apply edits and return result, or null if no changes
 */
export function applyEdits<T>(
  rootNode: SgNode<T>,
  edits: Edit[]
): string | null {
  if (edits.length === 0) {
    return null;
  }
  return rootNode.commitEdits(edits);
}

/**
 * Check if file should be processed based on multiple content checks
 */
export function shouldProcess(
  root: SgRoot<any>,
  requiredContent: string[]
): boolean {
  const text = root.root().text();
  return requiredContent.some((content) => text.includes(content));
}

/**
 * Common patterns for finding function calls
 */
export function findFunctionCalls(
  rootNode: SgNode<any>,
  functionName: string,
  ...patterns: string[]
): SgNode<any>[] {
  const results: SgNode<any>[] = [];

  for (const pattern of patterns) {
    const calls = rootNode.findAll({
      rule: { pattern: pattern.replace("$FUNC", functionName) },
    });
    results.push(...calls);
  }

  return results;
}

/**
 * Replace text in node using regex
 */
export function replaceInNode(
  node: SgNode<any>,
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
export function findWithPatterns(
  rootNode: SgNode<any>,
  patterns: string[]
): SgNode<any>[] {
  const results: SgNode<any>[] = [];

  for (const pattern of patterns) {
    const matches = rootNode.findAll({
      rule: { pattern },
    });
    results.push(...matches);
  }

  return results;
}

/**
 * Collect edits from multiple operations
 */
export function collectEdits(
  operations: Array<() => Edit | Edit[] | null>
): Edit[] {
  const edits: Edit[] = [];

  for (const operation of operations) {
    const result = operation();
    if (result) {
      if (Array.isArray(result)) {
        edits.push(...result);
      } else {
        edits.push(result);
      }
    }
  }

  return edits;
}
