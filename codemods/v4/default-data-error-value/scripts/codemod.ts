import type { SgRoot } from "codemod:ast-grep";
import type TSX from "codemod:ast-grep/langs/tsx";

async function transform(root: SgRoot<TSX>): Promise<string> {
  const rootNode = root.root();

  // Extract data and error variable names from destructuring
  const dataErrorVars = new Set<string>();

  // Find all const declarations that assign to useAsyncData or useFetch
  const constDeclarations = rootNode.findAll({
    rule: {
      pattern: "const $DECL = $HOOK($$$ARGS)",
    },
  });

  constDeclarations.forEach((decl) => {
    const hook = decl.getMatch("HOOK");
    if (hook?.text() === "useAsyncData" || hook?.text() === "useFetch") {
      const declPattern = decl.getMatch("DECL");
      if (declPattern?.is("object_pattern")) {
        // Get all children of the object pattern to find properties
        const children = declPattern.children();
        children.forEach((child) => {
          if (child.is("pair_pattern")) {
            // Handle aliased destructuring: { data: myData, error: myError }
            const key = child.field("key");
            const value = child.field("value");
            if (key?.is("property_identifier") && value?.is("identifier")) {
              const keyName = key.text();
              const varName = value.text();
              if (keyName === "data" || keyName === "error") {
                dataErrorVars.add(varName);
              }
            }
          } else if (child.is("shorthand_property_identifier_pattern")) {
            // Handle direct destructuring: { data, error }
            const varName = child.text();
            if (varName === "data" || varName === "error") {
              dataErrorVars.add(varName);
            }
          }
        });
      }
    }
  });

  // Find all null comparisons with our data/error variables
  const nullComparisons = rootNode.findAll({
    rule: {
      pattern: "$VAR.value === null",
    },
  });

  const edits = nullComparisons.map((comparison) => {
    const varNode = comparison.getMatch("VAR");
    if (varNode?.is("identifier")) {
      const varName = varNode.text();
      if (dataErrorVars.has(varName)) {
        // Replace null with undefined
        const nullNode = comparison.find({
          rule: {
            pattern: "null",
          },
        });
        if (nullNode) {
          return nullNode.replace("undefined");
        }
      }
    }
    return null;
  }).filter(Boolean);

  if (edits.length === 0) {
    return rootNode.text(); // No changes needed
  }

  return rootNode.commitEdits(edits);
}

export default transform;