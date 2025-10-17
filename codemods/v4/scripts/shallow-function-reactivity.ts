import type { SgRoot, Edit } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import type HTML from "codemod:ast-grep/langs/html";
import { hasAnyContent, applyEdits, DATA_FETCH_HOOKS } from "../utils/index.ts";

async function transform(root: SgRoot<TSX | HTML>): Promise<string | null> {
  const rootNode = root.root();

  // Quick check - does file contain data fetching hooks?
  if (!hasAnyContent(root, DATA_FETCH_HOOKS)) {
    return null;
  }

  const allEdits: Edit[] = [];

  DATA_FETCH_HOOKS.forEach((hookName) => {
    // Find all calls to this hook with single argument (function only)
    const singleArgCalls = rootNode.findAll({
      rule: {
        pattern: `${hookName}($ARG)`,
      },
    });

    singleArgCalls.forEach((call) => {
      const arg = call.getMatch("ARG");
      if (arg) {
        // Check if it's a single argument (not an object)
        if (!arg.is("object")) {
          // Single argument - add options with deep: true
          allEdits.push(
            call.replace(`${hookName}(${arg.text()}, { deep: true })`)
          );
        }
      }
    });
  });

  return applyEdits(rootNode, allEdits);
}

export default transform;
