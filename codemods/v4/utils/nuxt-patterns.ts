/**
 * Common patterns and constants for Nuxt codemods
 */

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
 * Common AST patterns for Nuxt-specific transformations
 */
export const PATTERNS = {
  // Hook patterns
  NUXT_HOOK_SINGLE: "nuxt.hook('$EVENT', $CALLBACK)",
  NUXT_HOOK_DOUBLE: 'nuxt.hook("$EVENT", $CALLBACK)',

  // Data fetching patterns
  CONST_DECLARATION: "const $DECL = $HOOK($$$ARGS)",

  // Template patterns
  ADD_TEMPLATE: "addTemplate($ARGS)",

  // Utility patterns
  REFRESH_CALL: "await refresh($ARGS)",

  // Comparison patterns
  NULL_COMPARISON: "$VAR.value === null",

  // Function call patterns
  SINGLE_ARG_CALL: "$FUNC($ARG)",
  TWO_ARG_CALL: "$FUNC($ARG1, $ARG2)",
} as const;

/**
 * Common import sources and their typical specifiers
 */
export const COMMON_IMPORTS = {
  NODE_FS: {
    source: "node:fs",
    specifiers: ["readFileSync", "writeFileSync", "existsSync"],
  },
  NODE_PATH: {
    source: "node:path",
    specifiers: ["relative", "resolve", "join", "dirname"],
  },
  LODASH_ES: {
    source: "lodash-es",
    specifiers: ["template", "merge", "cloneDeep"],
  },
} as const;

/**
 * Get pattern for specific Nuxt hook with quote style
 */
export function getHookPattern(
  event: string,
  quoteStyle: "single" | "double" = "single"
): string {
  const pattern =
    quoteStyle === "single"
      ? PATTERNS.NUXT_HOOK_SINGLE
      : PATTERNS.NUXT_HOOK_DOUBLE;
  return pattern.replace("$EVENT", event);
}

/**
 * Check if text contains any data fetch hooks
 */
export function hasDataFetchHooks(text: string): boolean {
  return DATA_FETCH_HOOKS.some((hook) => text.includes(hook));
}

/**
 * Get all data fetch hook patterns for finding calls
 */
export function getDataFetchPatterns(): string[] {
  return DATA_FETCH_HOOKS.map((hook) => `${hook}($$$ARGS)`);
}
