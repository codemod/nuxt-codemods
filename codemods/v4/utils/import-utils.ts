import type { SgNode, Edit, TypesMap } from "codemod:ast-grep";
import type tsxTypes from "codemod:ast-grep/langs/tsx";
import type tsTypes from "codemod:ast-grep/langs/typescript";

// <------------          IMPORT TYPES          ------------>

type NamedImportSpecifier = {
  name: string;
  type: "named";
  typed: boolean; //a flag to track whether an import is a type-only import (e.g. import type { named } from ...) or runtime import (e.g. import { named } from ...)
  //typed import is for type checking during compile time, NOT runtime in ts.
  alias?: string;
};

type DefaultImportSpecifier = {
  type: "default";
  name: string; // Default imports DO have names! e.g., "React" in "import React from 'react'"
  typed: boolean;
};

type ImportSpecifier = NamedImportSpecifier | DefaultImportSpecifier;

// <------------          HELPERS          ------------>

function findImportFromSource(
  program: SgNode<tsxTypes | tsTypes, "program">, //root ast node of entire ts/tsx file
  source: string //the string we're looking for in the end of the import statement.
): SgNode<tsxTypes | tsTypes> | null {
  //it will either return the ast node or null.

  const allImports = program.findAll({
    rule: {
      kind: "import_statement",
    },
  }); //"give me every node that is import_statement". aka the entire import type { Something } from "./types" and other types of imports
  //so now allImports is an array of all the import_statement NODES. each item is an importNode.

  for (const importNode of allImports) {
    //look through each importNode
    const sourceNode = importNode.field("source"); //get the source field of each node. source is the part after "from"
    if (sourceNode) {
      //if the sourceNode exists. else ignore it (rare).

      //need to find the string_fragment inside the sourceNode becasue in ast grep's
      // ts/tsx syntax, the string without the quotes is actually a nested node.
      // so: source: (string) aka "react" -> string_fragment aka react (w/o quotes)
      const stringFragment = sourceNode.find({
        rule: {
          kind: "string_fragment",
        },
      });

      if (stringFragment) {
        // if strgin fragment exists, keep track of the str without the quotes
        const fragmentText = stringFragment.text();

        if (fragmentText === source) {
          //compare found string with the source arg passed in
          return importNode;
        }
      }
    }
  }
  return null;
}

function getExistingSpecifiers(
  importNode: SgNode<tsxTypes | tsTypes> //takes import nodes as arg
): ImportSpecifier[] {
  //returns a list of import specifiers
  const importSpecifiers: ImportSpecifier[] = []; //initialize empty array to store import specifiers

  //records whether the import is type-only import
  const isTypeImport = importNode.text().includes("import type");

  const importClause = importNode.field("import_clause"); //import clause: anything between import and from
  if (!importClause) {
    return importSpecifiers;
  } //need importClause node to look inside it for specifiers

  // Find default import - first identifier that's NOT inside named_imports
  const defaultImport = importClause.find({
    //finding the default aka the first identifier not inside {}
    rule: {
      kind: "identifier",
      not: {
        inside: {
          kind: "named_imports",
        },
      },
    },
  });

  if (defaultImport) {
    //if default exists, add a default to imporSpecifiers list we defined in the beginnig
    importSpecifiers.push({
      type: "default",
      name: defaultImport.text(),
      typed: isTypeImport,
    });
  }

  // Find named imports
  const namedImports = importClause.field("named_imports");
  if (namedImports) {
    const specifiers = namedImports.findAll({
      rule: { kind: "import_specifier" },
    });

    for (const spec of specifiers) {
      const nameNode = spec.field("name");
      const aliasNode = spec.field("alias");

      if (nameNode) {
        const name = nameNode.text();
        const alias = aliasNode ? aliasNode.text() : undefined;

        importSpecifiers.push({
          type: "named",
          name: name,
          typed: isTypeImport,
          alias: alias,
        });
      }
    }
  }

  return importSpecifiers;
}

function getInsertionPoint(
  program: SgNode<tsxTypes | tsTypes, "program">
): number {
  const allImports = program.findAll({
    rule: {
      kind: "import_statement",
      inside: {
        kind: "program",
        stopBy: "end",
      },
    },
  });

  if (allImports.length === 0) {
    const hashBang = program.find({
      rule: { kind: "hash_bang_line" },
    });

    if (hashBang) {
      return hashBang.range().end.index;
    }

    return 0;
  }

  const lastImport = allImports[allImports.length - 1];
  if (lastImport) {
    return lastImport.range().end.index;
  }

  return 0;
}

function detectQuoteStyle(
  program: SgNode<tsxTypes | tsTypes, "program">,
  preferredSource?: string
): "'" | '"' {
  // First, try to find an import from the specific source we're working with
  if (preferredSource) {
    const targetImport = findImportFromSource(program, preferredSource);
    if (targetImport) {
      const sourceNode = targetImport.field("source");
      if (sourceNode) {
        const fullText = sourceNode.text();
        if (fullText.startsWith("'")) {
          return "'";
        }
        if (fullText.startsWith('"')) {
          return '"';
        }
      }
    }
  }

  // Fall back to any import statement
  const anyImport = program.find({
    rule: {
      kind: "import_statement",
      has: {
        field: "source",
        kind: "string",
      },
    },
  });

  if (anyImport) {
    const sourceNode = anyImport.field("source");
    if (sourceNode) {
      const fullText = sourceNode.text();
      if (fullText.startsWith("'")) {
        return "'";
      }
      if (fullText.startsWith('"')) {
        return '"';
      }
    }
  }

  return '"'; // Default to double quotes
}

function buildImportStatement(
  source: string,
  importSpecifiers: ImportSpecifier[],
  quoteStyle: "'" | '"' = '"'
): string {
  // Check if we have mixed types - this should not happen with the new logic
  const hasTyped = importSpecifiers.some((spec) => spec.typed);
  const hasRuntime = importSpecifiers.some((spec) => !spec.typed);

  if (hasTyped && hasRuntime) {
    throw new Error(
      "buildImportStatement should not receive mixed typed/runtime imports"
    );
  }

  // All imports are the same type
  const isTypeImport = importSpecifiers.every((spec) => spec.typed);
  return buildSingleImportStatement(
    source,
    importSpecifiers,
    quoteStyle,
    isTypeImport
  );
}

function buildSingleImportStatement(
  source: string,
  importSpecifiers: ImportSpecifier[],
  quoteStyle: "'" | '"' = '"',
  isTypeImport: boolean = false
): string {
  const defaultSpecs = importSpecifiers.filter(
    (spec) => spec.type === "default"
  );
  const namedSpecs = importSpecifiers.filter(
    (spec) => spec.type === "named"
  ) as NamedImportSpecifier[];

  const importKeyword = isTypeImport ? "import type" : "import";

  const parts: string[] = [];

  if (defaultSpecs.length > 0 && defaultSpecs[0]) {
    parts.push(defaultSpecs[0].name);
  }

  if (namedSpecs.length > 0) {
    const nameParts = namedSpecs.map((spec) => {
      return spec.alias ? `${spec.name} as ${spec.alias}` : spec.name;
    });
    parts.push(`{ ${nameParts.join(", ")} }`);
  }

  const result = `${importKeyword} ${parts.join(
    ", "
  )} from ${quoteStyle}${source}${quoteStyle};`;

  return result;
}

// <------------          MAIN FUNCTION          ------------>
export function ensureImport(
  program: SgNode<tsxTypes | tsTypes, "program">,
  source: string,
  imports: ImportSpecifier[]
): {
  edit: Edit;
  importAliases: string[];
} {
  // Step 1: Find existing import from source
  const existingImport = findImportFromSource(program, source);

  // Step 2: Parse existing specifiers
  const existingSpecs = existingImport
    ? getExistingSpecifiers(existingImport)
    : [];

  // Step 3: Calculate what names will be available (aliases)
  const importAliases: string[] = [];

  for (const requestedSpec of imports) {
    if (requestedSpec.type === "default") {
      // Check if default already exists
      const existingDefault = existingSpecs.find(
        (spec) => spec.type === "default"
      );
      if (existingDefault && existingDefault.type === "default") {
        importAliases.push(existingDefault.name);
      } else {
        importAliases.push(requestedSpec.name);
      }
    } else if (requestedSpec.type === "named") {
      // Check if named import already exists
      const existingNamed = existingSpecs.find(
        (spec) => spec.type === "named" && spec.name === requestedSpec.name
      );
      if (existingNamed && existingNamed.type === "named") {
        importAliases.push(existingNamed.alias || existingNamed.name);
      } else {
        importAliases.push(requestedSpec.alias || requestedSpec.name);
      }
    }
  }

  // Step 4: Detect quote style and get insertion point
  const quoteStyle = detectQuoteStyle(program, source);
  const insertionPoint = getInsertionPoint(program);

  // Step 5: Check if ALL requested imports already exist exactly as requested
  const allImportsExist = imports.every((requestedSpec) => {
    return existingSpecs.some((existing) => {
      if (requestedSpec.type === "default" && existing.type === "default") {
        return existing.typed === requestedSpec.typed;
      }
      if (requestedSpec.type === "named" && existing.type === "named") {
        return (
          existing.name === requestedSpec.name &&
          existing.typed === requestedSpec.typed
        );
      }
      return false;
    });
  });

  // CASE 1: If imports already exist → Don't do anything, return empty edit
  if (allImportsExist) {
    return {
      edit: { startPos: 0, endPos: 0, insertedText: "" },
      importAliases: imports.map((spec) => {
        const existing = existingSpecs.find(
          (existing) =>
            (spec.type === "default" &&
              existing.type === "default" &&
              existing.typed === spec.typed) ||
            (spec.type === "named" &&
              existing.type === "named" &&
              existing.name === spec.name &&
              existing.typed === spec.typed)
        );
        return (
          (existing?.type === "named" ? existing.alias : undefined) ||
          existing?.name ||
          spec.name
        );
      }),
    };
  }

  // Step 6: Determine if we need to REPLACE or ADD
  let edit: Edit;

  if (existingImport) {
    // CASE 2: Import statement exists but needs editing → REPLACE the existing statement
    const newImportText = buildImportStatement(source, imports, quoteStyle);
    edit = existingImport.replace(newImportText);
  } else {
    // CASE 3: Import statement doesn't exist → ADD new import statement
    const newImportText = buildImportStatement(source, imports, quoteStyle);

    // Check if we're inserting after existing imports
    const hasExistingImports =
      program.findAll({
        rule: { kind: "import_statement" },
      }).length > 0;

    edit = {
      startPos: insertionPoint,
      endPos: insertionPoint,
      insertedText: hasExistingImports
        ? "\n" + newImportText
        : newImportText + "\n",
    };
  }

  // Calculate import aliases - just use the requested names since we're replacing
  const finalImportAliases: string[] = imports.map((spec) => {
    if (spec.type === "default") {
      return spec.name;
    } else {
      return spec.alias || spec.name;
    }
  });

  return {
    edit,
    importAliases: finalImportAliases,
  };
}
