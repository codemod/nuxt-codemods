import type { SgRoot, Edit } from "codemod:ast-grep";
import type TS from "codemod:ast-grep/langs/typescript";
import { hasContent } from "../utils/index";

function transform(root: SgRoot<TS>): string | null {
  const rootNode = root.root();

  // Quick check using utility
  if (!hasContent(root, "addTemplate")) {
    return null;
  }

  let result = rootNode.text();
  let hasChanges = false;

  // Track if we need to add imports
  let needsReadFileSync = false;
  let needsTemplate = false;

  // Use regex-based approach for more reliable matching
  const srcPropertyRegex =
    /src:\s*resolver\.resolve\(\s*["']([^"']*\.ejs)["']\s*\)/g;

  let match: RegExpExecArray | null;
  while ((match = srcPropertyRegex.exec(result)) !== null) {
    const fullMatch = match[0];
    const ejsPath = match[1];

    // Only transform if this is inside an addTemplate call
    const beforeMatch = result.substring(0, match.index);
    const afterMatch = result.substring(match.index + fullMatch.length);

    // Check if we're in an addTemplate call by looking for the nearest addTemplate before this match
    const addTemplateMatch = beforeMatch.lastIndexOf("addTemplate(");
    if (addTemplateMatch === -1) continue;

    // Check if there's a closing parenthesis for addTemplate after our match
    const closingParen = afterMatch.indexOf("});");
    if (closingParen === -1) continue;

    // Mark that we need imports
    needsReadFileSync = true;
    needsTemplate = true;

    // Replace the src property with getContents method
    const getContentsMethod = `getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("${ejsPath}"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  }`;

    // Replace the src property with getContents method
    result = result.replace(fullMatch, getContentsMethod);
    hasChanges = true;

    // Reset regex position since we modified the string
    srcPropertyRegex.lastIndex = 0;
  }

  // Add imports if needed - handle them globally
  if (needsReadFileSync || needsTemplate) {
    let updatedResult = result;

    // Check if we already have the required imports at the top of the file only
    const lines = updatedResult.split("\n");
    let topImports = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("import ")) {
        topImports.push(line);
      } else if (line && !line.startsWith("//") && !line.startsWith("/*")) {
        // Stop at first non-import, non-comment line
        break;
      }
    }

    const topImportsText = topImports.join("\n");
    const hasNodeImport =
      /import\s*\{[^}]*readFileSync[^}]*\}\s*from\s*["']node:fs["'];?/.test(
        topImportsText
      );
    const hasLodashImport =
      /import\s*\{[^}]*template[^}]*\}\s*from\s*["']lodash-es["'];?/.test(
        topImportsText
      );

    // Handle readFileSync import
    if (needsReadFileSync && !hasNodeImport) {
      // Look for existing node:fs import in top imports only
      const nodeImportLine = topImports.find(
        (line) =>
          line.includes('from "node:fs"') || line.includes("from 'node:fs'")
      );

      if (nodeImportLine) {
        // Add readFileSync to existing import
        const match = nodeImportLine.match(
          /import\s*\{\s*([^}]*)\s*\}\s*from\s*["']node:fs["'];?/
        );
        if (match) {
          const specs = match[1].trim();
          const newSpecs = specs ? `${specs}, readFileSync` : "readFileSync";
          const newImportLine = `import { ${newSpecs} } from "node:fs";`;
          updatedResult = updatedResult.replace(nodeImportLine, newImportLine);
          hasChanges = true;
        }
      } else {
        // Add new import - try to place it after existing imports
        const lines = updatedResult.split("\n");
        let insertIndex = 0;

        // Find the last import line
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith("import ")) {
            insertIndex = i + 1;
          } else if (lines[i].trim() && !lines[i].trim().startsWith("//")) {
            // Stop at first non-comment, non-empty line
            break;
          }
        }

        lines.splice(insertIndex, 0, 'import { readFileSync } from "node:fs";');
        updatedResult = lines.join("\n");
        hasChanges = true;
      }
    }

    // Handle template import
    if (needsTemplate && !hasLodashImport) {
      // Look for existing lodash-es import in top imports only
      const lodashImportLine = topImports.find(
        (line) =>
          line.includes('from "lodash-es"') || line.includes("from 'lodash-es'")
      );

      if (lodashImportLine) {
        // Add template to existing import
        const match = lodashImportLine.match(
          /import\s*\{\s*([^}]*)\s*\}\s*from\s*["']lodash-es["'];?/
        );
        if (match) {
          const specs = match[1].trim();
          const newSpecs = specs ? `${specs}, template` : "template";
          const newImportLine = `import { ${newSpecs} } from "lodash-es";`;
          updatedResult = updatedResult.replace(
            lodashImportLine,
            newImportLine
          );
          hasChanges = true;
        }
      } else {
        // Add new import - try to place it after existing imports
        const lines = updatedResult.split("\n");
        let insertIndex = 0;

        // Find the last import line
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith("import ")) {
            insertIndex = i + 1;
          } else if (lines[i].trim() && !lines[i].trim().startsWith("//")) {
            // Stop at first non-comment, non-empty line
            break;
          }
        }

        lines.splice(insertIndex, 0, 'import { template } from "lodash-es";');
        updatedResult = lines.join("\n");
        hasChanges = true;
      }
    }

    result = updatedResult;
  }

  return hasChanges ? result : null;
}

export default transform;
