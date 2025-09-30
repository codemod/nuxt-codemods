#!/usr/bin/env tsx

/**
 * Improved Comprehensive Test Runner
 * Actually runs codemods and validates transformations
 */

import { execSync } from "child_process";
import {
  readFileSync,
  writeFileSync,
  copyFileSync,
  unlinkSync,
  existsSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CodemodTest {
  name: string;
  language: "tsx" | "typescript";
  description: string;
}

const codemods: CodemodTest[] = [
  {
    name: "shallow-function-reactivity",
    language: "tsx",
    description: "Adds { deep: true } to data fetching hooks",
  },
  {
    name: "deprecated-dedupe-value",
    language: "tsx",
    description: 'Transforms dedupe: true/false to "cancel"/"defer"',
  },
  {
    name: "default-data-error-value",
    language: "tsx",
    description: "Changes === null to === undefined for data/error vars",
  },
  {
    name: "absolute-watch-path",
    language: "typescript",
    description: 'Adds path normalization to nuxt.hook("builder:watch")',
  },
  {
    name: "template-compilation-changes",
    language: "typescript",
    description: "Transforms addTemplate src to getContents method",
  },
];

console.log("🧪 Improved Comprehensive Nuxt v4 Codemod Tests\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results: Array<{
  name: string;
  status: "PASS" | "FAIL";
  reason: string;
}> = [];

async function runCodemodTest(codemod: CodemodTest): Promise<void> {
  console.log(`📋 Testing ${codemod.name}:`);
  console.log(`   Description: ${codemod.description}`);

  const inputFile = join(__dirname, `tests/${codemod.name}/input.ts`);
  const expectedFile = join(__dirname, `tests/${codemod.name}/expected.ts`);
  const codemodFile = join(__dirname, `scripts/${codemod.name}.ts`);
  const tempFile = join(__dirname, `temp-test-${codemod.name}.ts`);

  totalTests++;

  try {
    // Check if test files exist
    if (!existsSync(inputFile)) {
      throw new Error(`Input file not found: ${inputFile}`);
    }
    if (!existsSync(expectedFile)) {
      throw new Error(`Expected file not found: ${expectedFile}`);
    }
    if (!existsSync(codemodFile)) {
      throw new Error(`Codemod file not found: ${codemodFile}`);
    }

    // Copy input to temp file
    copyFileSync(inputFile, tempFile);

    // Try to run the codemod
    const command = `npx codemod@latest jssg run -l ${codemod.language} --target ${tempFile} ${codemodFile}`;
    console.log(`   Command: ${command}`);

    try {
      // Run with timeout and capture output
      execSync(command, {
        stdio: "pipe",
        timeout: 30000, // 30 second timeout
      });

      // Read results
      const actualResult = readFileSync(tempFile, "utf8");
      const expectedResult = readFileSync(expectedFile, "utf8");

      // Normalize whitespace for comparison
      const normalize = (code: string) => code.trim().replace(/\s+/g, " ");
      const actualNormalized = normalize(actualResult);
      const expectedNormalized = normalize(expectedResult);

      if (actualNormalized === expectedNormalized) {
        console.log("   ✅ PASSED - Transformation matches expected output");
        results.push({
          name: codemod.name,
          status: "PASS",
          reason: "Output matches expected",
        });
        passedTests++;
      } else {
        console.log("   ❌ FAILED - Output differs from expected");
        console.log(
          `   Expected length: ${expectedResult.length}, Actual length: ${actualResult.length}`
        );

        // Show first difference
        const maxLen = Math.min(
          actualNormalized.length,
          expectedNormalized.length
        );
        for (let i = 0; i < maxLen; i++) {
          if (actualNormalized[i] !== expectedNormalized[i]) {
            console.log(`   First difference at position ${i}:`);
            console.log(
              `   Expected: "${expectedNormalized.slice(i, i + 20)}..."`
            );
            console.log(
              `   Actual:   "${actualNormalized.slice(i, i + 20)}..."`
            );
            break;
          }
        }

        results.push({
          name: codemod.name,
          status: "FAIL",
          reason: "Output differs from expected",
        });
        failedTests++;
      }
    } catch (execError: any) {
      const errorMsg = execError.message || execError.toString();
      console.log("   ❌ FAILED - Codemod execution failed");

      if (errorMsg.includes("Cannot resolve module")) {
        console.log(
          "   Reason: Import resolution error (likely utils imports)"
        );
        results.push({
          name: codemod.name,
          status: "FAIL",
          reason: "Import resolution error",
        });
      } else {
        console.log(`   Reason: ${errorMsg.split("\n")[0]}`);
        results.push({
          name: codemod.name,
          status: "FAIL",
          reason: "Execution error",
        });
      }
      failedTests++;
    }
  } catch (setupError: any) {
    console.log(`   ❌ FAILED - Setup error: ${setupError.message}`);
    results.push({
      name: codemod.name,
      status: "FAIL",
      reason: `Setup error: ${setupError.message}`,
    });
    failedTests++;
  } finally {
    // Cleanup temp file
    if (existsSync(tempFile)) {
      unlinkSync(tempFile);
    }
  }

  console.log(""); // Empty line for readability
}

async function main() {
  // Run all tests
  for (const codemod of codemods) {
    await runCodemodTest(codemod);
  }

  // Summary
  console.log("📊 Test Results Summary:");
  console.log("═".repeat(50));

  results.forEach((result) => {
    const status = result.status === "PASS" ? "✅" : "❌";
    console.log(`${status} ${result.name}: ${result.reason}`);
  });

  console.log("═".repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (failedTests === 0) {
    console.log("\n🎉 All tests passed! Codemods are working correctly.");
    process.exit(0);
  } else {
    console.log(
      "\n⚠️  Some tests failed. The main issue is likely import resolution."
    );
    console.log(
      "💡 Recommendation: Create standalone versions for individual testing,"
    );
    console.log("   or use the workflow.yaml for end-to-end testing.");
    process.exit(1);
  }
}

main().catch(console.error);
