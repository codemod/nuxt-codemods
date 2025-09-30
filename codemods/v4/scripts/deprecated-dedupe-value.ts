import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import {
  hasContent,
  applyEdits,
  replaceInNode,
  NUXT_PATTERNS,
} from "../utils/index";

async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check using utility
  if (!hasContent(root, "refresh")) {
    return null;
  }

  // Find all refresh calls using utility pattern
  const refreshCalls = rootNode.findAll({
    rule: { pattern: NUXT_PATTERNS.REFRESH_CALL },
  });

  const allEdits = [];

  refreshCalls.forEach((call) => {
    // Use utility for regex replacement
    const trueEdit = replaceInNode(call, /dedupe:\s*true/g, 'dedupe: "cancel"');
    const falseEdit = replaceInNode(
      call,
      /dedupe:\s*false/g,
      'dedupe: "defer"'
    );

    if (trueEdit) allEdits.push(trueEdit);
    if (falseEdit) allEdits.push(falseEdit);
  });

  // Use utility for applying edits
  return applyEdits(rootNode, allEdits);
}

export default transform;
