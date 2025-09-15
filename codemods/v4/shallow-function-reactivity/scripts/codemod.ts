import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  // Find all useLazyAsyncData, useAsyncData, useFetch, and useLazyFetch calls
  const hooks = [
    "useLazyAsyncData",
    "useAsyncData", 
    "useFetch",
    "useLazyFetch"
  ];

  const allEdits = [];

  hooks.forEach((hookName) => {
    // Find all calls to this hook
    const hookCalls = rootNode.findAll({
      rule: {
        pattern: `${hookName}($ARGS)`,
      },
    });

    hookCalls.forEach((call) => {
      const args = call.getMatch("ARGS");
      if (args) {
        // Check if it's a single argument (not an object)
        if (!args.is("object")) {
          // Single argument - add options with deep: true
          allEdits.push(call.replace(`${hookName}(${args.text()}, { deep: true })`));
        }
      }
    });

    // Also find calls with two arguments
    const twoArgCalls = rootNode.findAll({
      rule: {
        pattern: `${hookName}($ARG1, $ARG2)`,
      },
    });

    twoArgCalls.forEach((call) => {
      const arg1 = call.getMatch("ARG1");
      const arg2 = call.getMatch("ARG2");
      
      if (arg2 && arg2.is("object")) {
        // Check if deep property already exists
        const deepProperty = arg2.find({
          rule: {
            pattern: "deep: $VALUE",
          },
        });

        if (!deepProperty) {
          // Add deep: true to existing options
          const optionsText = arg2.text();
          if (optionsText === "{}") {
            // Empty object
            allEdits.push(arg2.replace(`{ deep: true }`));
          } else {
            // Non-empty object - add before closing brace
            allEdits.push(arg2.replace(`${optionsText.slice(0, -1)}, deep: true }`));
          }
        }
      }
    });
  });

  if (allEdits.length === 0) {
    return rootNode.text(); // No changes needed
  }

  return rootNode.commitEdits(allEdits);
}

export default transform;