// Test case 1: Basic addTemplate with .ejs file
addTemplate({
  fileName: "appinsights-vue.js",
  options: {
    /* some options */
  },
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./runtime/plugin.ejs"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  },
});

// Test case 2: addTemplate with multiple properties
addTemplate({
  fileName: "test.js",
  mode: "client",
  options: {
    key: "value",
  },
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./templates/test.ejs"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  },
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
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./runtime/existing.ejs"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  },
});

// Test case 5: addTemplate with .ejs file and existing lodash import
import { template } from "lodash-es";

addTemplate({
  fileName: "lodash-import.js",
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./runtime/lodash.ejs"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  },
});

// Test case 6: Multiple addTemplate calls with .ejs files
addTemplate({
  fileName: "first.js",
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./templates/first.ejs"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  },
});

addTemplate({
  fileName: "second.js",
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./templates/second.ejs"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  },
});

// Test case 7: addTemplate with both imports already present
import { readFileSync } from "node:fs";
import { template } from "lodash-es";

addTemplate({
  fileName: "both-imports.js",
  getContents({ options }) {
    const contents = readFileSync(
      resolver.resolve("./runtime/both.ejs"),
      "utf-8"
    );

    return template(contents)({
      options,
    });
  },
});
