// CASE 5: ADD after existing imports from different sources
// Expected: Should add new import after existing imports

import { readFile } from "node:fs";
import { EventEmitter } from "node:events";
import { resolve, join } from "node:path";

console.log("Hello World");
someFunction();
