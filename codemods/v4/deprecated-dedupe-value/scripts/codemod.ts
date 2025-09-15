import type { SgRoot, SgNode, Edit } from "@codemod.com/jssg-types/main";
import type TSX from "codemod:ast-grep/langs/tsx";

// Main transformation function - return null to skip file
async function transform(root: SgRoot<TSX>): Promise<string | null> {
  const rootNode = root.root();
  const edits: Edit[] = [];

  // Step 1: Find all await refresh() calls
  const awaitRefreshCalls = rootNode.findAll({
    rule: {
      pattern: "await refresh($ARGS)",
    },
  });

  awaitRefreshCalls.forEach((call) => {
    const args = call.getMatch("ARGS");
    
    // Check if the argument is an object with dedupe property
    if (args?.is("object")) {
      const properties = args.children();
      
      properties.forEach((prop) => {
        if (prop.is("pair")) {
          const key = prop.field("key");
          const value = prop.field("value");
          
          if (key?.text() === "dedupe") {
            // Step 2: Check if value is boolean and transform it
            if (value?.is("true")) {
              // Replace true with "cancel"
              edits.push({
                startPos: value.range().start.index,
                endPos: value.range().end.index,
                insertedText: '"cancel"',
              });
            } else if (value?.is("false")) {
              // Replace false with "defer"
              edits.push({
                startPos: value.range().start.index,
                endPos: value.range().end.index,
                insertedText: '"defer"',
              });
            } else if (value?.is("number")) {
              // Handle numeric values: 1 -> "cancel", 0 -> "defer"
              const numValue = parseInt(value.text());
              if (numValue === 1) {
                edits.push({
                  startPos: value.range().start.index,
                  endPos: value.range().end.index,
                  insertedText: '"cancel"',
                });
              } else if (numValue === 0) {
                edits.push({
                  startPos: value.range().start.index,
                  endPos: value.range().end.index,
                  insertedText: '"defer"',
                });
              }
            }
          }
        }
      });
    }
  });

  if (edits.length === 0) {
    return null; // No changes needed
  }

  return rootNode.commitEdits(edits);
}

export default transform;