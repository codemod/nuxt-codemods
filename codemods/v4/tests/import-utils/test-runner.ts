import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import { ensureImport } from "../../utils/imports.ts";

//command to run the test:
//codemod jssg run --language typescript --target case-1-add-empty-file/input.ts test-runner.ts

/**
 * Test runner for import-utils functionality
 * This tests the core ensureImport function with various scenarios
 */
async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  // Test: Add resolve and join imports from node:path
  const importResult = ensureImport(rootNode as any, "node:path", [
    { type: "named", name: "resolve", typed: false },
    { type: "named", name: "join", typed: false },
  ]);

  if (importResult.edit.insertedText && importResult.edit.insertedText.trim()) {
    return rootNode.commitEdits([importResult.edit]);
  }

  return rootNode.text();
}

export default transform;
