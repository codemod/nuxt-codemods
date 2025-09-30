import type { SgRoot, SgNode } from "codemod:ast-grep";

/**
 * Testing utilities for codemods
 */

/**
 * Create a mock SgRoot for testing
 */
export function createMockRoot(content: string): Partial<SgRoot<any>> {
  return {
    root: () => createMockNode(content),
    filename: () => "test.ts",
  };
}

/**
 * Create a mock SgNode for testing
 */
export function createMockNode(content: string): Partial<SgNode<any>> {
  return {
    text: () => content,
    findAll: () => [],
    find: () => null,
    replace: (newText: string) => ({
      startPos: 0,
      endPos: content.length,
      insertedText: newText,
    }),
    commitEdits: (edits: any[]) => {
      // Simple mock implementation
      let result = content;
      for (const edit of edits) {
        result = edit.insertedText;
      }
      return result;
    },
  };
}

/**
 * Test if a transformation produces expected output
 */
export async function testTransformation(
  transform: (root: SgRoot<any>) => Promise<string | null>,
  input: string,
  expectedOutput: string | null
): Promise<boolean> {
  const mockRoot = createMockRoot(input) as SgRoot<any>;
  const result = await transform(mockRoot);
  return result === expectedOutput;
}

/**
 * Test multiple transformation cases
 */
export async function testMultipleCases(
  transform: (root: SgRoot<any>) => Promise<string | null>,
  testCases: Array<{
    input: string;
    expected: string | null;
    description?: string;
  }>
): Promise<{
  passed: number;
  failed: number;
  results: Array<{ passed: boolean; description?: string }>;
}> {
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await testTransformation(
      transform,
      testCase.input,
      testCase.expected
    );
    results.push({
      passed: result,
      description: testCase.description,
    });

    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  return { passed, failed, results };
}

/**
 * Assert that content contains specific text
 */
export function assertContains(content: string, searchText: string): boolean {
  return content.includes(searchText);
}

/**
 * Assert that content matches a regex pattern
 */
export function assertMatches(content: string, pattern: RegExp): boolean {
  return pattern.test(content);
}

/**
 * Count occurrences of a pattern in content
 */
export function countOccurrences(
  content: string,
  pattern: string | RegExp
): number {
  if (typeof pattern === "string") {
    return (content.match(new RegExp(pattern, "g")) || []).length;
  }
  return (content.match(pattern) || []).length;
}

/**
 * Extract imports from content
 */
export function extractImports(content: string): string[] {
  const importRegex = /import\s+.*?from\s+["'][^"']+["'];?/g;
  return content.match(importRegex) || [];
}

/**
 * Check if specific import exists
 */
export function hasImport(
  content: string,
  importName: string,
  source: string
): boolean {
  const importRegex = new RegExp(
    `import\\s*\\{[^}]*${importName}[^}]*\\}\\s*from\\s*["']${source}["'];?`
  );
  return importRegex.test(content);
}
