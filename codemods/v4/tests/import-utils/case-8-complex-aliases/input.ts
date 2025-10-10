// CASE 8: Complex imports with aliases and default
// Expected: Should handle aliases and default imports correctly

import Base, { A, B, C as See } from "node:path";

console.log("Hello World");
someFunction();
