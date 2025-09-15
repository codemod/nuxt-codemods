import type { SgRoot, SgNode, Edit } from "@codemod.com/jssg-types/main";
import type TSX from "codemod:ast-grep/langs/tsx";

// Main transformation function - return null to skip file
async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();
  const edits: Edit[] = [];

  const hooksToUpdate = ["useAsyncData", "useFetch"];

  // Step 1: Find all const declarations
  const constDeclarations = rootNode.findAll({
    rule: {
      pattern: "const $DECL = $INIT",
    },
  });

  // Step 2: Extract the actual variable names (handles aliasing)
  const propsToUpdate: string[] = [];

  constDeclarations.forEach((declaration) => {
    const decl = declaration.getMatch("DECL");
    const init = declaration.getMatch("INIT");
    
    // Check if this is a destructuring assignment
    if (decl?.is("object_pattern") && init?.is("call_expression")) {
      // Try to get the function name from the first child
      const firstChild = init.child(0);
      
      // Check if the function call is one of our target hooks
      if (firstChild?.is("identifier") && hooksToUpdate.includes(firstChild.text())) {
        // Get all properties from the destructuring
        const properties = decl.children();
        
        properties.forEach((prop) => {
          if (prop.is("pair_pattern")) {
            // Handle aliased destructuring like { data: supercooldata1, error: error3 }
            const key = prop.field("key");
            const value = prop.field("value");
            
            if (key?.text() === "error" || key?.text() === "data") {
              if (value?.is("identifier")) {
                // Handle aliased destructuring like { data: userData, error: userError }
                propsToUpdate.push(value.text());
              }
            }
          } else if (prop.is("shorthand_property_identifier_pattern")) {
            // Handle direct destructuring like { data, error }
            const name = prop.text();
            if (name === "data" || name === "error") {
              propsToUpdate.push(name);
            }
          }
        });
      }
    }
  });

  // Step 3: Update comparisons of prop.value === null to prop.value === undefined
  propsToUpdate.forEach((varName) => {
    const binaryExpressions = rootNode.findAll({
      rule: {
        pattern: "$OBJ.value === null",
      },
    });

    binaryExpressions.forEach((expr) => {
      const obj = expr.getMatch("OBJ");
      if (obj?.text() === varName) {
        const rightSide = expr.field("right");
        if (rightSide?.is("null")) {
          edits.push({
            startPos: rightSide.range().start.index,
            endPos: rightSide.range().end.index,
            insertedText: "undefined",
          });
        }
      }
    });
  });

  // Step 4: Update ternary operators with prop.value === null
  propsToUpdate.forEach((varName) => {
    const conditionalExpressions = rootNode.findAll({
      rule: {
        pattern: "$OBJ.value === null ? $CONSEQUENT : $ALTERNATE",
      },
    });

    conditionalExpressions.forEach((expr) => {
      const obj = expr.getMatch("OBJ");
      if (obj?.text() === varName) {
        const test = expr.field("test");
        if (test?.is("binary_expression")) {
          const rightSide = test.field("right");
          if (rightSide?.is("null")) {
            edits.push({
              startPos: rightSide.range().start.index,
              endPos: rightSide.range().end.index,
              insertedText: "undefined",
            });
          }
        }

        const consequent = expr.field("consequent");
        const alternate = expr.field("alternate");

        // Handle nested ternary expressions
        if (consequent?.is("conditional_expression")) {
          const consequentTest = consequent.field("test");
          if (consequentTest?.is("binary_expression")) {
            const rightSide = consequentTest.field("right");
            if (rightSide?.is("null")) {
              edits.push({
                startPos: rightSide.range().start.index,
                endPos: rightSide.range().end.index,
                insertedText: "undefined",
              });
            }
          }
        }

        if (alternate?.is("conditional_expression")) {
          const alternateTest = alternate.field("test");
          if (alternateTest?.is("binary_expression")) {
            const rightSide = alternateTest.field("right");
            if (rightSide?.is("null")) {
              edits.push({
                startPos: rightSide.range().start.index,
                endPos: rightSide.range().end.index,
                insertedText: "undefined",
              });
            }
          }
        }
      }
    });
  });

  if (edits.length === 0) {
    return null; // No changes needed
  }

  return rootNode.commitEdits(edits);
}

export default transform;