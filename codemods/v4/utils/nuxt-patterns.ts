/**
 * Common AST patterns for Nuxt-specific transformations
 */

export const NUXT_PATTERNS = {
  // Hook patterns
  HOOK_SINGLE_QUOTE: "nuxt.hook('$EVENT', $CALLBACK)",
  HOOK_DOUBLE_QUOTE: 'nuxt.hook("$EVENT", $CALLBACK)',

  // Data fetching patterns
  USE_ASYNC_DATA: "useAsyncData($$$ARGS)",
  USE_FETCH: "useFetch($$$ARGS)",
  USE_LAZY_ASYNC_DATA: "useLazyAsyncData($$$ARGS)",
  USE_LAZY_FETCH: "useLazyFetch($$$ARGS)",

  // Template patterns
  ADD_TEMPLATE: "addTemplate($ARGS)",

  // Utility patterns
  REFRESH_CALL: "await refresh($ARGS)",
  CONST_DECLARATION: "const $DECL = $HOOK($$$ARGS)",

  // Comparison patterns
  NULL_COMPARISON: "$VAR === null",
  UNDEFINED_COMPARISON: "$VAR === undefined",

  // Object patterns
  OBJECT_PROPERTY: "$KEY: $VALUE",
  DEDUPE_TRUE: "dedupe: true",
  DEDUPE_FALSE: "dedupe: false",
} as const;

/**
 * Common function call patterns
 */
export const FUNCTION_PATTERNS = {
  SINGLE_ARG: "$FUNC($ARG)",
  TWO_ARGS: "$FUNC($ARG1, $ARG2)",
  MULTIPLE_ARGS: "$FUNC($$$ARGS)",
  WITH_AWAIT: "await $FUNC($$$ARGS)",
} as const;

/**
 * Import patterns
 */
export const IMPORT_PATTERNS = {
  NODE_FS: 'import { $IMPORTS } from "node:fs"',
  NODE_PATH: 'import { $IMPORTS } from "node:path"',
  LODASH_ES: 'import { $IMPORTS } from "lodash-es"',
} as const;

/**
 * Get pattern for specific Nuxt hook
 */
export function getHookPattern(
  event: string,
  quoteStyle: "single" | "double" = "single"
): string {
  const pattern =
    quoteStyle === "single"
      ? NUXT_PATTERNS.HOOK_SINGLE_QUOTE
      : NUXT_PATTERNS.HOOK_DOUBLE_QUOTE;
  return pattern.replace("$EVENT", event);
}

/**
 * Get pattern for specific data fetching hook
 */
export function getDataFetchPattern(hookName: string): string {
  switch (hookName) {
    case "useAsyncData":
      return NUXT_PATTERNS.USE_ASYNC_DATA;
    case "useFetch":
      return NUXT_PATTERNS.USE_FETCH;
    case "useLazyAsyncData":
      return NUXT_PATTERNS.USE_LAZY_ASYNC_DATA;
    case "useLazyFetch":
      return NUXT_PATTERNS.USE_LAZY_FETCH;
    default:
      return FUNCTION_PATTERNS.MULTIPLE_ARGS.replace("$FUNC", hookName);
  }
}

/**
 * Common Nuxt data fetching hooks
 */
export const DATA_FETCH_HOOKS = [
  "useAsyncData",
  "useFetch",
  "useLazyAsyncData",
  "useLazyFetch",
] as const;

/**
 * Common Node.js imports used in Nuxt codemods
 */
export const COMMON_IMPORTS = {
  NODE_FS: ["readFileSync", "writeFileSync", "existsSync"],
  NODE_PATH: ["relative", "resolve", "join", "dirname"],
  LODASH_ES: ["template", "merge", "cloneDeep"],
} as const;
