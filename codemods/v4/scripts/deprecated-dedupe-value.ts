import type { SgRoot, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import { hasContent, applyEdits, replaceInNode } from "../utils/index.ts";

async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check - does file contain refresh calls?
  if (!hasContent(root, "refresh")) {
    return null;
  }

  // Find all refresh calls
  const refreshCalls = rootNode.findAll({
    rule: { pattern: "await refresh($ARGS)" },
  });

  if (refreshCalls.length === 0) {
    return null;
  }

  const edits: Edit[] = [];

  refreshCalls.forEach((call) => {
    // Use utility for regex replacement
    const trueEdit = replaceInNode(call, /dedupe:\s*true/g, 'dedupe: "cancel"');
    const falseEdit = replaceInNode(
      call,
      /dedupe:\s*false/g,
      'dedupe: "defer"'
    );

    if (trueEdit) edits.push(trueEdit);
    if (falseEdit) edits.push(falseEdit);
  });

  if (edits.length === 0) {
    return null;
  }
  return rootNode.commitEdits(edits);
}

export default transform;
