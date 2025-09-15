import type { SgRoot, SgNode, Edit } from "@codemod.com/jssg-types/main";
import type TSX from "codemod:ast-grep/langs/tsx";

// Main transformation function - return null to skip file
async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // List of functions to modify
  const functionsToModify = [
    "useFetch",
    "useAsyncData", 
    "useLazyAsyncData",
    "useLazyFetch",
  ];

  // Find all calls to the functions that need modification
  functionsToModify.forEach((funcName) => {
    const callExpressions = rootNode.findAll({
      rule: {
        pattern: "$FUNC($ARGS)",
      },
    });

    callExpressions.forEach((call) => {
      const func = call.getMatch("FUNC");
      const args = call.getMatch("ARGS");
      
      // Check if this is one of our target functions
      if (func?.text() === funcName) {
        // Check if the function has only one argument (missing the options object)
        // The args should be a single argument, not an object
        if (args && !args.text().includes("{") && !args.text().includes("}")) {
          // Add the second argument with { deep: true }
          const insertPos = call.range().end.index - 1;
          edits.push({
            startPos: insertPos,
            endPos: insertPos,
            insertedText: ", { deep: true }",
          });
        }
      }
    });
  });

  // Special handling for useAsyncData with arrow function as first argument
  const useAsyncDataCalls = rootNode.findAll({
    rule: {
      pattern: "useAsyncData($ARROW_FUNC)",
    },
  });

  // Find useRoute calls to get the route variable name
  const useRouteCalls = rootNode.findAll({
    rule: {
      pattern: "const $ROUTE_VAR = useRoute()",
    },
  });

  let routeVarName = "";
  if (useRouteCalls.length > 0) {
    const routeCall = useRouteCalls[0];
    const routeVar = routeCall.getMatch("ROUTE_VAR");
    if (routeVar?.is("identifier")) {
      routeVarName = routeVar.text();
    }
  }

  useAsyncDataCalls.forEach((call) => {
    if (routeVarName) {
      // Add the route parameter as the first argument
      const insertPos = call.range().start.index + "useAsyncData(".length;
      edits.push({
        startPos: insertPos,
        endPos: insertPos,
        insertedText: `${routeVarName}.params.slug, `,
      });
    }
  });

  if (edits.length === 0) {
    return null; // No changes needed
  }

  return rootNode.commitEdits(edits);
}

export default transform;