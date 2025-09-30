// Test case 1: Basic addTemplate with .ejs file
addTemplate({
  fileName: "appinsights-vue.js",
  options: {
    /* some options */
  },
  src: resolver.resolve("./runtime/plugin.ejs"),
});

// Test case 2: addTemplate with multiple properties
addTemplate({
  fileName: "test.js",
  mode: "client",
  options: {
    key: "value",
  },
  src: resolver.resolve("./templates/test.ejs"),
  write: true,
});

// Test case 3: addTemplate with non-.ejs file (should not be transformed)
addTemplate({
  fileName: "normal.js",
  options: {},
  src: resolver.resolve("./runtime/plugin.ts"),
});

// Test case 4: addTemplate with .ejs file and existing imports
import { readFileSync } from "node:fs";

addTemplate({
  fileName: "existing-import.js",
  src: resolver.resolve("./runtime/existing.ejs"),
});

// Test case 5: addTemplate with .ejs file and existing lodash import
import { template } from "lodash-es";

addTemplate({
  fileName: "lodash-import.js",
  src: resolver.resolve("./runtime/lodash.ejs"),
});

// Test case 6: Multiple addTemplate calls with .ejs files
addTemplate({
  fileName: "first.js",
  src: resolver.resolve("./templates/first.ejs"),
});

addTemplate({
  fileName: "second.js",
  src: resolver.resolve("./templates/second.ejs"),
});

// Test case 7: addTemplate with both imports already present
import { readFileSync } from "node:fs";
import { template } from "lodash-es";

addTemplate({
  fileName: "both-imports.js",
  src: resolver.resolve("./runtime/both.ejs"),
});
