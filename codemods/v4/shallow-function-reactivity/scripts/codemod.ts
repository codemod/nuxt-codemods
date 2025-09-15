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
    // Find calls with single argument (no options object)
    const singleArgCalls = rootNode.findAll({
      rule: {
        pattern: `${hookName}($ARG)`,
      },
    });

    const singleArgEdits = singleArgCalls.map((call) => {
      const arg = call.getMatch("ARG");
      if (arg && !arg.text().includes("{") && !arg.text().includes("}")) {
        // Single argument without options object - add options with deep: true
        return call.replace(`${hookName}(${arg.text()}, { deep: true })`);
      }
      return null;
    }).filter(Boolean);

    allEdits.push(...singleArgEdits);

    // Find calls with options object that don't have deep property
    const optionsCalls = rootNode.findAll({
      rule: {
        pattern: `${hookName}($ARG, $OPTIONS)`,
      },
    });

    const optionsEdits = optionsCalls.map((call) => {
      const options = call.getMatch("OPTIONS");
      if (options && options.text().includes("{") && !options.text().includes("deep")) {
        // Options object without deep property - add deep: true
        const optionsText = options.text();
        const newOptions = optionsText.replace("}", ", deep: true }");
        const arg = call.getMatch("ARG");
        return call.replace(`${hookName}(${arg?.text()}, ${newOptions})`);
      }
      return null;
    }).filter(Boolean);

    allEdits.push(...optionsEdits);
  });

  if (allEdits.length === 0) {
    return rootNode.text(); // No changes needed
  }

  return rootNode.commitEdits(allEdits);
}

export default transform;