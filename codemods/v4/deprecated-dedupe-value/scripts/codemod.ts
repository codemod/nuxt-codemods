import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  // Find all refresh calls
  const refreshCalls = rootNode.findAll({
    rule: {
      pattern: "await refresh($ARGS)",
    },
  });

  const allEdits = [];

  refreshCalls.forEach((call) => {
    // Find dedupe: true within this refresh call
    const dedupeTrue = call.find({
      rule: {
        pattern: "dedupe: true",
      },
    });

    if (dedupeTrue) {
      allEdits.push(dedupeTrue.replace('dedupe: "cancel"'));
    }

    // Find dedupe: false within this refresh call
    const dedupeFalse = call.find({
      rule: {
        pattern: "dedupe: false",
      },
    });

    if (dedupeFalse) {
      allEdits.push(dedupeFalse.replace('dedupe: "defer"'));
    }
  });

  if (allEdits.length === 0) {
    return rootNode.text(); // No changes needed
  }

  return rootNode.commitEdits(allEdits);
}

export default transform;