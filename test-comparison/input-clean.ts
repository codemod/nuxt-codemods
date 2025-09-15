// Test cases for comprehensive comparison

// Case 1: Basic builder:watch hook (should transform)
nuxt.hook("builder:watch", (event, path) => {
  someFunction();
});

// Case 2: Async builder:watch hook with expression (should transform)
nuxt.hook("builder:watch", async (event, key) =>
  console.log("File changed:", path),
);

// Case 3: Different hook name (should NOT transform)
nuxt.hook("build:before", (event, path) => {
  someFunction();
});

// Case 4: Wrong number of parameters (should NOT transform)
nuxt.hook("builder:watch", (event) => {
  someFunction();
});

// Case 5: Wrong number of parameters (should NOT transform)
nuxt.hook("builder:watch", (event, path, extra) => {
  someFunction();
});

// Case 6: Not an arrow function (should NOT transform)
nuxt.hook("builder:watch", function(event, path) {
  someFunction();
});

// Case 7: Different variable name (should transform)
nuxt.hook("builder:watch", (event, filePath) => {
  someFunction();
});

// Case 8: Nested hook call (should transform)
function setupWatcher() {
  nuxt.hook("builder:watch", (event, path) => {
    someFunction();
  });
}

// Case 9: Hook with different string format (should transform)
nuxt.hook('builder:watch', (event, path) => {
  someFunction();
});

// Case 10: Hook with existing import (should add to existing import)
import { readFile } from 'node:fs';
nuxt.hook("builder:watch", (event, path) => {
  someFunction();
});

