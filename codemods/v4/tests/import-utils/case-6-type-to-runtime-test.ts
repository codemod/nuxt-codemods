import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import { ensureImport } from "../../utils/imports.ts";

/**
 * CASE 6: REPLACE - Type import exists, replace with runtime import
 * This tests replacing an existing type import with a runtime import
 */
async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  // Replace type import with runtime import
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
