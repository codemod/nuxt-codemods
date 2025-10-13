import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import { ensureImport } from "../../utils/imports.ts";

/**
 * CASE 7: REPLACE - Runtime import exists, replace with type import
 * This tests replacing an existing runtime import with a type import
 */
async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  // Replace runtime import with type import
  const importResult = ensureImport(rootNode as any, "node:path", [
    { type: "named", name: "PathType", typed: true },
    { type: "named", name: "ResolveType", typed: true },
  ]);

  if (importResult.edit.insertedText && importResult.edit.insertedText.trim()) {
    return rootNode.commitEdits([importResult.edit]);
  }

  return rootNode.text();
}

export default transform;
