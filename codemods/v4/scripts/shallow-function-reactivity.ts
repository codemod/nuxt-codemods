import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";
import { applyEdits } from "../utils/index";

async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();

  // Find all useLazyAsyncData, useAsyncData, useFetch, and useLazyFetch calls
  const hooks = [
    "useLazyAsyncData",
    "useAsyncData",
    "useFetch",
    "useLazyFetch",
  ];

  const allEdits = [];

  hooks.forEach((hookName) => {
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

  // Use utility for applying edits
  return applyEdits(rootNode, allEdits);
}

export default transform;
