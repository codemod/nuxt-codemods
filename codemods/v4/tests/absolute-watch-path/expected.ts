// Test Case 1: Basic arrow function with block statement
nuxt.hook("builder:watch", (event, path) => {
  
  path = relative(nuxt.options.srcDir, resolve(nuxt.options.srcDir, path));
someFunction();
  console.log("Processing:", path);
});

// Test Case 2: Arrow function without block statement
nuxt.hook("builder:watch", async (event, filePath) =>
  {
  filePath = relative(nuxt.options.srcDir, resolve(nuxt.options.srcDir, filePath));
  return console.log("File changed:", filePath);
}
);

// Test Case 3: Existing node:fs import with other specifiers
import { readFile, relative, resolve } from "node:fs";

nuxt.hook("builder:watch", (event, watchedPath) => {
  
  watchedPath = relative(nuxt.options.srcDir, resolve(nuxt.options.srcDir, watchedPath));
readFile(watchedPath, "utf8", callback);
});

// Test Case 4: Regular function (should not be transformed)
nuxt.hook("builder:watch", function (event, path) {
  processFile(path);
});

// Test Case 5: Hook with different event name (should not be transformed)
nuxt.hook("other:event", (event, path) => {
  doSomething(path);
});
