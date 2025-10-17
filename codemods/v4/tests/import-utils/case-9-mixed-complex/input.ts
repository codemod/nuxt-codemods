// CASE 9: Mixed scenario - existing partial + type imports
// Expected: Should handle both type and runtime imports in same file

import { resolve, join } from "node:path";
import { readFile } from "node:fs";

console.log("Hello World");
someFunction();
